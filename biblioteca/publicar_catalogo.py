"""O publicador do catálogo da biblioteca na nuvem (fase 1b, DESENHO seção 2).

Monta os livros com o gerador de hoje (biblioteca/livros.py) ou lê manifests
já gerados, filtra pela classificação do acervo, dá a cada capítulo do mapa a
chave estável (biblioteca/chaves.py), compara com o catálogo que está na nuvem
e, SÓ com --publicar, grava num commit atômico do Firestore os documentos que
mudaram e o índice novo. Sem --publicar (o padrão), escreve o relatório do que
mudaria e para.

    python -X utf8 biblioteca/publicar_catalogo.py --planilha <csv> --livros <pasta> --mapas <Livros/mapa>
        --classificacao <CLASSIFICACAO_ACERVO.csv> --chaves <Livros/mapa/_chaves>
        --registro-ids <Livros/catalogo/_ids.json> --uid-arquivo <.secrets/...> --conta <e-mail do dono>
        --gcloud <caminho absoluto do gcloud> [--gcloud-config <%USERPROFILE%/.gcloud-nath>]
        [--heranca <HERANCA_L1.json> ...] [--trocas <trocas_de_arquivo.json>] [--retirar <id> ...]
        [--relatorio <arquivo.md>] [--pasta-publicacoes <Livros/catalogo/publicacoes>]
        [--primeira-publicacao] [--publicar]
    (ou --manifesto <manifest.json> ..., no lugar de --planilha, --livros e --mapas)

Quem escreve: só este script, pela mão do dono, com --publicar explícito; nunca
sozinho. A credencial é a conta Google do próprio dono, numa configuração do
gcloud SÓ DELE (CLOUDSDK_CONFIG=%USERPROFILE%\\.gcloud-nath): as variáveis que
trocariam a conta saem do ambiente do gcloud, a conta ativa da configuração e
o e-mail do token têm de ser a --conta, e nunca a credencial padrão (ADC),
que nesta máquina é a da Köli. O uid da dona vem de um arquivo em
%USERPROFILE%\\.secrets\\ (--uid-arquivo). Nada disso entra no repositório.

Contra o emulador, SÓ com --emulador e FIRESTORE_EMULATOR_HOST juntos (uma sem
a outra é recusa): o token é "owner", o uid pode vir em --uid, e toda linha de
resultado começa com "EMULADOR:".

Travas (cada uma recusa a publicação inteira, com o motivo no relatório):
  - lista fechada de caminhos (fullmatch): só usuarios/<uid>/config/catalogo e
    usuarios/<uid>/catalogo/<id>; qualquer outro é recusado ANTES de sair da
    máquina (Firestore.commit);
  - um lote só: tudo num commit (menos de 500 escritas e de 10 MiB), ou nada;
    o Firestore que não responde é recusa, e o commit sem resposta é refeito
    na rodada seguinte pelo índice da nuvem;
  - ids: id repetido; o mesmo arquivo (sha256) com outro id do que o registro
    local OU o índice da nuvem dizem; id publicado que some sem --retirar;
    troca de formato (EPUB para PDF) fora de trocas_de_arquivo.json;
  - os registros: caminho dado que não existe é recusa (só a
    --primeira-publicacao nasce sem o registro de ids e sem a pasta das
    chaves, e só sem catálogo na nuvem); com --publicar, a classificação, o
    registro de ids e a pasta das chaves são obrigatórios;
  - forma do meta: meta.id, meta.hash "sha256:<64 hex>" e meta.bytes inteiro;
  - assunto do mapa fora do banco da main (o gerador o descartaria calado).
Limite conhecido: o índice é gravado sem precondição de updateTime, porque o
publicador roda uma publicação por vez, pela mão do dono.
Saída no dialeto de sempre: o relatório em markdown, e a última linha diz o
que aconteceu.
"""
import argparse
import datetime
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import chaves  # noqa: E402

PROJETO = 'nw-apoio-educacional'
MAX_ESCRITAS = 500
MAX_BYTES_DO_LOTE = 10 * 1024 * 1024
CAMINHO_PERMITIDO = re.compile(r'usuarios/[A-Za-z0-9]{1,128}/(config/catalogo|catalogo/[a-z0-9][a-z0-9-]{0,199})')   # sempre com fullmatch
CAMPOS_DO_DOCUMENTO = ('id', 'titulo', 'volume', 'materia', 'materia_nome', 'segmento', 'series', 'formato', 'paginas')


class Recusa(Exception):
    pass


class SemResposta(Recusa):
    """O pedido saiu e a resposta não voltou. No commit, ele pode ter
    chegado: a rodada seguinte reconstrói o registro de ids pelo índice da
    nuvem (planejar)."""


# ------------------------------------------------------------------ o Firestore pela API REST

def para_valor(v):
    if v is None:
        return {'nullValue': None}
    if isinstance(v, bool):
        return {'booleanValue': v}
    if isinstance(v, int):
        return {'integerValue': str(v)}
    if isinstance(v, float):
        return {'doubleValue': v}
    if isinstance(v, str):
        return {'stringValue': v}
    if isinstance(v, (list, tuple)):
        return {'arrayValue': {'values': [para_valor(x) for x in v]}}
    if isinstance(v, dict):
        return {'mapValue': {'fields': {k: para_valor(x) for k, x in v.items()}}}
    raise TypeError('valor que o Firestore não guarda: %r' % (v,))


def de_valor(v):
    if 'nullValue' in v:
        return None
    if 'booleanValue' in v:
        return v['booleanValue']
    if 'integerValue' in v:
        return int(v['integerValue'])
    if 'doubleValue' in v:
        return v['doubleValue']
    if 'stringValue' in v:
        return v['stringValue']
    if 'timestampValue' in v:
        return v['timestampValue']
    if 'arrayValue' in v:
        return [de_valor(x) for x in v['arrayValue'].get('values') or []]
    if 'mapValue' in v:
        return {k: de_valor(x) for k, x in (v['mapValue'].get('fields') or {}).items()}
    raise ValueError('valor do Firestore que este script não lê: %r' % (v,))


class Firestore:
    """Leitura de documento e commit atômico, pela API REST v1. `token` é o
    Bearer (do gcloud da configuração do dono, ou "owner" no emulador)."""

    def __init__(self, projeto, token, emulador=None):
        self.raiz = ('http://%s' % emulador) if emulador else 'https://firestore.googleapis.com'
        self.banco = 'projects/%s/databases/(default)' % projeto
        self.url = '%s/v1/%s/documents' % (self.raiz, self.banco)
        self.token = token
        self.commits = 0

    def _pedir(self, metodo, url, corpo=None):
        dados = json.dumps(corpo).encode('utf-8') if corpo is not None else None
        req = urllib.request.Request(url, data=dados, method=metodo, headers={
            'Authorization': 'Bearer ' + self.token, 'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.status, json.loads(r.read().decode('utf-8') or '{}')
        except urllib.error.HTTPError as e:
            texto = e.read().decode('utf-8', 'replace')
            return e.code, {'erro': texto[:600]}
        except (urllib.error.URLError, TimeoutError, ConnectionError, OSError, ValueError) as e:
            # sem resposta (rede, tempo esgotado, resposta que não é JSON): nunca vira sucesso
            raise SemResposta('o Firestore não respondeu (%s: %s)' % (type(e).__name__, str(e)[:200]))

    def ler(self, caminho):
        st, corpo = self._pedir('GET', '%s/%s' % (self.url, caminho))
        if st == 404:
            return None
        if st != 200:
            raise Recusa('não consegui ler %s (HTTP %d): %s' % (caminho, st, corpo.get('erro', '')))
        return {k: de_valor(v) for k, v in (corpo.get('fields') or {}).items()}

    def commit(self, escritas):
        """Um commit só. `escritas`: [{caminho, dados, campos?, existe?}]. A lista
        fechada de caminhos é conferida AQUI, antes de qualquer pedido."""
        for e in escritas:
            if not CAMINHO_PERMITIDO.fullmatch(e['caminho']):
                raise Recusa('caminho fora da lista fechada do publicador: %s' % e['caminho'])
        corpo = {'writes': []}
        for e in escritas:
            w = {'update': {'name': '%s/documents/%s' % (self.banco, e['caminho']),
                            'fields': {k: para_valor(v) for k, v in e['dados'].items()}}}
            if e.get('campos'):
                w['updateMask'] = {'fieldPaths': list(e['campos'])}
            if e.get('existe') is not None:
                w['currentDocument'] = {'exists': bool(e['existe'])}
            corpo['writes'].append(w)
        tamanho = len(json.dumps(corpo).encode('utf-8'))
        if len(escritas) > MAX_ESCRITAS or tamanho > MAX_BYTES_DO_LOTE:
            raise Recusa('o lote não cabe num commit só (%d escritas, %d bytes); nada foi gravado' % (len(escritas), tamanho))
        self.commits += 1
        self.escritas = len(escritas)
        try:
            st, resposta = self._pedir('POST', '%s/v1/%s/documents:commit' % (self.raiz, self.banco), corpo)
        except SemResposta as e:
            raise SemResposta(str(e) + '. O commit pode ter chegado ou não: rode de novo sem --publicar, e o '
                              'relatório confere pelo índice da nuvem (o registro de ids é reconstruído dele)')
        if st != 200:
            raise Recusa('o commit falhou (HTTP %d), e nada foi gravado: %s' % (st, resposta.get('erro', '')))
        return resposta


# o que pode trocar a conta do gcloud por fora da configuração do dono (a da Köli, nesta máquina)
VARIAVEIS_QUE_TROCAM_A_CONTA = ('GOOGLE_APPLICATION_CREDENTIALS', 'CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE',
                                'CLOUDSDK_AUTH_ACCESS_TOKEN_FILE', 'CLOUDSDK_CORE_ACCOUNT',
                                'CLOUDSDK_AUTH_IMPERSONATE_SERVICE_ACCOUNT', 'CLOUDSDK_ACTIVE_CONFIG_NAME')


def ambiente_do_gcloud(config):
    env = {k: v for k, v in os.environ.items() if k not in VARIAVEIS_QUE_TROCAM_A_CONTA}
    env['CLOUDSDK_CONFIG'] = config
    return env


def token_do_dono(gcloud, config, conta):
    """O token da conta do dono, da configuração SÓ dele do gcloud. Nunca a
    ADC nem uma conta posta pelo ambiente: as variáveis que trocariam a conta
    saem do ambiente do gcloud, e a conta ativa da configuração tem de ser a
    esperada (--conta) antes de pedir o token."""
    if not config or not os.path.isdir(config):
        raise Recusa('falta a configuração do gcloud do dono (%s); faça o login nela antes' % config)
    if not gcloud or not os.path.isabs(gcloud) or not os.path.isfile(gcloud):
        raise Recusa('o gcloud tem de vir por caminho absoluto (--gcloud): %r' % gcloud)
    if not conta or '@' not in conta:
        raise Recusa('diga a conta esperada do dono (--conta), para conferir antes de gravar')
    env = ambiente_do_gcloud(config)
    r = subprocess.run([gcloud, 'config', 'get-value', 'account'], capture_output=True, text=True, env=env)
    ativa = (r.stdout or '').strip().splitlines()[-1].strip() if (r.stdout or '').strip() else ''
    if r.returncode != 0 or ativa.lower() != conta.lower():
        raise Recusa('a conta ativa da configuração do dono é %r, e não %r; nada foi pedido' % (ativa, conta))
    r = subprocess.run([gcloud, 'auth', 'print-access-token', conta], capture_output=True, text=True, env=env)
    if r.returncode != 0 or not r.stdout.strip():
        raise Recusa('o gcloud não deu o token do dono: %s' % (r.stderr or '').strip()[:300])
    return r.stdout.strip().splitlines()[-1].strip()


def email_do_token(token):
    """O e-mail da conta dona do token, pelo tokeninfo do Google."""
    req = urllib.request.Request('https://oauth2.googleapis.com/tokeninfo?access_token=' + urllib.parse.quote(token))
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return (json.loads(r.read().decode('utf-8')) or {}).get('email') or ''
    except (urllib.error.URLError, TimeoutError, ConnectionError, OSError, ValueError) as e:
        raise SemResposta('não consegui conferir de quem é o token (%s)' % type(e).__name__)


# ------------------------------------------------------------------ o que publicar

def texto_do_meta(meta):
    return json.dumps(meta, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def sha_hex(meta):
    h = meta.get('hash')
    m = re.fullmatch(r'sha256:([0-9a-f]{64})', h or '')
    return m.group(1) if m else None


def ids_do_banco(topicos=None):
    """Os ids de assunto do banco (banco/topicos/), pela mesma leitura de
    livros.ler_catalogo, sem carregar o gerador (e o PyMuPDF)."""
    pasta = topicos or os.path.join(os.path.dirname(AQUI), 'banco', 'topicos')
    ids = set(t['id'] for t in ler_json(os.path.join(pasta, 'matematica.json'), {}).get('temas') or [])
    for d in ler_json(os.path.join(pasta, 'indice.json'), {}).get('disciplinas') or []:
        for g in ler_json(os.path.join(pasta, d['chave'] + '.json'), {}).get('grupos') or []:
            for b in g.get('blocos') or []:
                ids.update(i for i in b.get('ids') or [] if i)
    return ids


def assuntos_dos_mapas(pasta):
    """Todo id de assunto citado nos mapa_*.json da pasta (capítulos e obras)."""
    citados = {}
    if not pasta:
        return citados
    if not os.path.isdir(pasta):
        raise Recusa('a pasta dos mapas não existe: %s' % pasta)
    for nome in sorted(os.listdir(pasta)):
        if not (nome.startswith('mapa_') and nome.endswith('.json')):
            continue
        with open(os.path.join(pasta, nome), encoding='utf-8') as f:
            dados = json.load(f)

        def andar(x):
            if isinstance(x, dict):
                for k, v in x.items():
                    if k == 'assuntos' and isinstance(v, list):
                        for a in v:
                            aid = a.get('id') if isinstance(a, dict) else None
                            if aid:
                                citados.setdefault(aid, set()).add(nome)
                    else:
                        andar(v)
            elif isinstance(x, list):
                for v in x:
                    andar(v)
        andar(dados)
    return citados


ENTRAM = ('FICA', 'SO_TEORIA')
FICAM_DE_FORA = ('SAI', 'DUVIDA')


def nome_comparavel(caminho):
    """O caminho de um arquivo para comparar, sem cortar nada: barras
    normais, sem acento, sem caixa e sem espaço sobrando."""
    import unicodedata
    t = unicodedata.normalize('NFKD', str(caminho or '').strip().replace('\\', '/'))
    t = ''.join(c for c in t if not unicodedata.combining(c)).lower()
    return re.sub(r'\s+', ' ', re.sub(r'/+', '/', t)).strip('/')


def ler_classificacao(caminho):
    """As linhas de CLASSIFICACAO_ACERVO.csv (decisão do dono de 13/11: a
    biblioteca é só teoria, exercícios e gabarito), como
    {'por_id': {id: [linha]}, 'linhas': [linha]}, e cada linha é
    {'resultado', 'motivo', 'arquivo', 'id'}. Resultados: FICA, SO_TEORIA (o
    livro do professor: entra com `so_teoria`), SAI e DÚVIDA (que a
    orquestradora decidiu tratar como SAI); qualquer outro texto é
    desconhecido e fica de fora. O separador é o da primeira linha (`;` ou
    `,`)."""
    import csv
    if not caminho or not os.path.isfile(caminho):
        raise Recusa('a classificação do acervo não existe: %s' % caminho)
    with open(caminho, encoding='utf-8-sig', newline='') as f:
        texto = f.read()
    primeira = texto.split('\n', 1)[0]
    sep = ';' if primeira.count(';') > primeira.count(',') else ','
    saida = {'por_id': {}, 'linhas': []}
    for l in csv.DictReader(texto.splitlines(), delimiter=sep):
        r = chaves.titulo_normalizado(l.get('resultado') or '').upper().replace(' ', '_').replace('-', '_')
        linha = {'resultado': 'DUVIDA' if r == 'DUVIDA' else r, 'motivo': (l.get('motivo') or '').strip(),
                 'arquivo': (l.get('arquivo') or '').strip(), 'id': (l.get('id') or l.get('livro_id') or '').strip()}
        saida['linhas'].append(linha)
        if linha['id']:
            saida['por_id'].setdefault(linha['id'], []).append(linha)
    # quantas linhas da lista têm cada nome de arquivo: o nome sem pasta só casa se for único aqui
    saida['nomes'] = {}
    for linha in saida['linhas']:
        a = nome_comparavel(linha['arquivo'])
        if a:
            b = a.rsplit('/', 1)[-1]
            saida['nomes'][b] = saida['nomes'].get(b, 0) + 1
    return saida


def linhas_do_livro(meta, classificacao, basenames):
    """TODAS as linhas da classificação que falam deste livro, juntas antes de
    decidir: as do id (coluna `id`) E as do caminho do arquivo na planilha
    (`arquivo_origem`), comparado inteiro quando a lista traz pasta. A linha
    sem pasta só casa pelo nome do arquivo inteiro quando esse nome é ÚNICO na
    lista E nesta publicação; senão o livro fica de fora como ambíguo. Nunca
    pelo nome cortado. Devolve (linhas, ambíguo)."""
    achadas = list(classificacao['por_id'].get(meta.get('id')) or [])
    ambiguo = False
    origem = nome_comparavel(meta.get('arquivo_origem'))
    if origem:
        base = origem.rsplit('/', 1)[-1]
        na_lista = classificacao.get('nomes') or {}
        for l in classificacao['linhas']:
            a = nome_comparavel(l['arquivo'])
            if not a or any(l is x for x in achadas):
                continue
            if '/' in a:
                if a == origem:
                    achadas.append(l)
            elif a == base:
                if basenames.get(base, 0) > 1 or na_lista.get(base, 0) > 1:
                    ambiguo = True
                else:
                    achadas.append(l)
    return achadas, ambiguo


def filtrar_pela_classificacao(livros_novos, classificacao):
    """Só FICA e SO_TEORIA vão para a nuvem; o SO_TEORIA leva `so_teoria: true`
    no meta, para a tela não oferecer os exercícios dele como lista ao aluno.
    Fica de fora o livro com QUALQUER linha SAI ou DÚVIDA (a lista pode repetir
    o livro, e a repetição é avisada), o de resultado desconhecido, o que a
    lista não cita e o de nome ambíguo. Sem classificação, nada passa: quem
    chama tem de dar a lista. Devolve (ficam, linhas do relatório agrupadas
    pelo motivo). O `arquivo_origem` nunca vai para a nuvem."""
    if classificacao is None:
        raise Recusa('sem a classificação do acervo, nenhum livro vai para a nuvem')
    basenames = {}
    for meta in livros_novos:
        o = nome_comparavel(meta.get('arquivo_origem'))
        if o:
            b = o.rsplit('/', 1)[-1]
            basenames[b] = basenames.get(b, 0) + 1
    ficam, fora, avisos = [], {}, []
    for meta in livros_novos:
        linhas, ambiguo = linhas_do_livro(meta, classificacao, basenames)
        resultados = sorted({l['resultado'] for l in linhas})
        lid = meta.get('id')
        if len(linhas) > 1:
            avisos.append('- aviso: o livro %s aparece %d vezes na classificação (%s)' % (lid, len(linhas), ', '.join(resultados)))
        motivo = '; '.join(sorted({l['motivo'] for l in linhas if l['motivo']})) or 'sem motivo na lista'
        if ambiguo:
            grupo = 'nome de arquivo ambíguo (o mesmo nome em dois livros ou em duas linhas da lista)'
        elif not linhas:
            grupo = 'ausente da classificação'
        elif any(r in FICAM_DE_FORA for r in resultados):
            grupo = 'SAI' if 'SAI' in resultados else 'DÚVIDA (tratada como SAI)'
        elif not all(r in ENTRAM for r in resultados):
            grupo = 'resultado desconhecido (%s)' % ', '.join(r for r in resultados if r not in ENTRAM)
        else:
            m = dict(meta)
            m.pop('arquivo_origem', None)
            if 'SO_TEORIA' in resultados:
                m['so_teoria'] = True
            else:
                m.pop('so_teoria', None)
            ficam.append(m)
            continue
        fora.setdefault(grupo, []).append('%s (%s)' % (lid, motivo))
    saida = list(avisos)
    for grupo in sorted(fora):
        saida.append('- fora da nuvem, %s: %d livro(s)' % (grupo, len(fora[grupo])))
        saida += ['    - ' + x for x in sorted(fora[grupo])]
    return ficam, saida


def planejar(livros_novos, indice, registro_ids, trocas=None, retirar=None, banco=None, citados=None,
             registros_chaves=None, heranca=None, agora=None, gerador=None):
    """A decisão inteira, sem rede: o que escrever e por quê. Devolve
    {'recusas', 'escritas', 'linhas', 'registro_ids', 'registros_chaves', 'indice'}."""
    recusas, linhas = [], []
    trocas = {t['id']: t for t in trocas or [] if isinstance(t, dict) and t.get('id')}
    retirar = set(retirar or [])
    indice = indice or {}
    antes = indice.get('livros') or {}
    registro_ids = dict(registro_ids or {})
    # a trava de id usa também o índice da nuvem: o registro local que ficou
    # para trás (um commit que chegou sem resposta, um arquivo perdido) é
    # reconstruído dele, e a divergência entre os dois recusa tudo
    reconstruidos = 0
    for lid_n, e in sorted(antes.items()):
        sha_n = (e or {}).get('sha256')
        if not sha_n:
            continue
        if registro_ids.get(sha_n) and registro_ids[sha_n] != lid_n:
            recusas.append('o registro local diz que o arquivo %s... é do livro %s, e a nuvem diz %s' % (sha_n[:12], registro_ids[sha_n], lid_n))
        elif sha_n not in registro_ids:
            registro_ids[sha_n] = lid_n
            reconstruidos += 1
    if reconstruidos:
        linhas.append('- o registro de ids está para trás: %d entrada(s) do índice da nuvem entram nele com --publicar' % reconstruidos)
    # o registro só com o que JÁ está na nuvem: o que se grava com --publicar quando não há o que publicar
    registro_da_nuvem = dict(registro_ids)
    registros_chaves = dict(registros_chaves or {})
    heranca = heranca or {}
    agora = agora or datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-3))).replace(microsecond=0).isoformat()
    vistos = {}
    novo_indice = {}
    docs = []
    for meta in livros_novos:
        meta = dict(meta)
        lid = meta.get('id')
        sha = sha_hex(meta)
        if not isinstance(lid, str) or not re.fullmatch(r'[a-z0-9][a-z0-9-]*', lid):
            recusas.append('livro sem id válido: %r' % (lid,))
            continue
        if lid in vistos:
            recusas.append('o id %s aparece duas vezes no catálogo' % lid)
            continue
        vistos[lid] = True
        if not sha or not isinstance(meta.get('bytes'), int):
            recusas.append('o livro %s não tem hash sha256 ou tamanho válidos' % lid)
            continue
        dono_do_sha = registro_ids.get(sha)
        if dono_do_sha and dono_do_sha != lid:
            recusas.append('o mesmo arquivo (%s...) já foi publicado com o id %s, e agora viria como %s' % (sha[:12], dono_do_sha, lid))
            continue
        a = antes.get(lid)
        if a and a.get('formato') and a.get('formato') != meta.get('formato') and lid not in trocas:
            recusas.append('o livro %s trocaria de formato (%s para %s) fora de trocas_de_arquivo.json' % (lid, a.get('formato'), meta.get('formato')))
            continue
        if 'fora do índice ficaram de fora' in (meta.get('mapa_nota') or ''):
            recusas.append('o mapa do livro %s cita assunto fora do banco: %s' % (lid, meta.get('mapa_nota')))
            continue
        if heranca.get(lid):
            meta['heranca_titulos'] = heranca[lid]
        if meta.get('mapa'):
            mapa, reg, novas = chaves.estabilizar(lid, meta['mapa'], registros_chaves.get(lid), meta.get('heranca_titulos'))
            meta['mapa'] = mapa
            registros_chaves[lid] = reg
            for t in novas:
                linhas.append('- %s: chave nova no capítulo "%s" (o livro já tinha registro de chaves)' % (lid, t))
        texto = texto_do_meta(meta)
        meta_hash = hashlib.sha256(texto.encode('utf-8')).hexdigest()
        igual = bool(a) and a.get('sha256') == sha and a.get('metaHash') == meta_hash and not a.get('retiradoEm')
        versao_meta = (a.get('metaVersao') or 0) + (0 if igual else 1) if a else 1
        novo_indice[lid] = {'sha256': sha, 'tamanho': meta['bytes'], 'metaHash': meta_hash, 'metaVersao': versao_meta,
                            'formato': meta.get('formato'), 'retiradoEm': None}
        if igual:
            continue
        motivo = 'novo' if not a else ('arquivo trocado' if a.get('sha256') != sha else
                                       'volta ao catálogo' if a.get('retiradoEm') else 'meta trocado')
        linhas.append('- %s: %s (%s bytes)' % (lid, motivo, meta['bytes']))
        doc = {k: meta.get(k) for k in CAMPOS_DO_DOCUMENTO}
        doc.update(sha256=sha, tamanho=meta['bytes'], metaVersao=versao_meta, metaHash=meta_hash, metaJson=texto,
                   idsAnteriores=[], publicadoEm=agora, retiradoEm=None)
        docs.append((lid, doc))
        registro_ids[sha] = lid
    if banco is not None and citados:
        for aid, mapas in sorted(citados.items()):
            if aid not in banco:
                recusas.append('o assunto %s, citado em %s, não existe no banco da main' % (aid, ', '.join(sorted(mapas))))
    for lid, a in sorted(antes.items()):
        if lid in vistos:
            continue
        if a.get('retiradoEm'):
            novo_indice[lid] = dict(a)
            continue
        if lid not in retirar:
            recusas.append('o livro %s está publicado e sumiria sem --retirar %s' % (lid, lid))
            continue
        novo_indice[lid] = dict(a, retiradoEm=agora)
        linhas.append('- %s: retirado do catálogo (nada sai do aparelho dela)' % lid)
        docs.append((lid, None))
    for lid in sorted(retirar):
        if lid in vistos or lid not in antes:
            recusas.append('--retirar %s pede um livro que não está publicado ou que continua na planilha' % lid)
    plano = {'recusas': recusas, 'linhas': linhas, 'docs': docs, 'registro_ids': registro_ids,
             'registros_chaves': registros_chaves, 'indice': None, 'reconstruidos': reconstruidos,
             'registro_da_nuvem': registro_da_nuvem}
    if recusas or not docs:
        return plano
    indice_novo = {'versao': (indice.get('versao') or 0) + 1, 'publicadoEm': agora, 'gerador': gerador,
                   'livros': {k: novo_indice[k] for k in sorted(novo_indice)}}
    plano['indice'] = indice_novo
    return plano


def montar_escritas(plano, uid):
    """As escritas do lote: os documentos que mudaram e, por último, o índice."""
    raiz = 'usuarios/%s' % uid
    escritas = []
    for lid, doc in plano['docs']:
        if doc is None:
            escritas.append({'caminho': '%s/catalogo/%s' % (raiz, lid), 'dados': {'retiradoEm': plano['indice']['publicadoEm']},
                             'campos': ['retiradoEm']})
        else:
            escritas.append({'caminho': '%s/catalogo/%s' % (raiz, lid), 'dados': doc})
    escritas.append({'caminho': '%s/config/catalogo' % raiz, 'dados': plano['indice']})
    return escritas


# ------------------------------------------------------------------ a linha de comando

def ler_json(caminho, padrao):
    """Lê um JSON. Sem caminho, o padrão. Caminho dado que não existe é
    RECUSA: um registro que sumiu, ou um caminho errado, não pode virar um
    registro vazio que desliga a trava calada."""
    if not caminho:
        return padrao
    if not os.path.isfile(caminho):
        raise Recusa('o arquivo não existe: %s' % caminho)
    with open(caminho, encoding='utf-8') as f:
        return json.load(f)


def gravar_json(caminho, dados):
    os.makedirs(os.path.dirname(os.path.abspath(caminho)), exist_ok=True)
    tmp = caminho + '.tmp'
    with open(tmp, 'w', encoding='utf-8', newline='') as f:
        f.write(json.dumps(dados, ensure_ascii=False, indent=1, sort_keys=True) + '\n')
    os.replace(tmp, caminho)


def livros_dos_manifests(caminhos):
    saida = []
    for c in caminhos:
        saida.extend(ler_json(c, {}).get('livros') or [])
    return saida


def livros_da_planilha(planilha, pasta_livros, mapas, topicos=None):
    import csv
    import livros
    with open(planilha, encoding='utf-8-sig', newline='') as f:
        materias = sorted({(l.get('materia_id') or '').strip() for l in csv.DictReader(f)} - {''})
    saida = []
    with tempfile.TemporaryDirectory(prefix='publicar_catalogo_') as tmp:
        for m in materias:
            origem = {}
            manifest, _rel, _trab = livros.gerar(planilha, 'catalogo-%s' % m, 1, tmp, pasta_livros=pasta_livros, materia=m,
                                                 mapas=mapas, trabalho=os.path.join(tmp, m), gravar=False, topicos=topicos,
                                                 conferencia=os.path.join(tmp, m, 'gabaritos'), origem=origem)
            for l in manifest['livros']:
                # o caminho do arquivo na planilha, para casar a classificação; sai antes de publicar
                saida.append(dict(l, arquivo_origem=origem.get(l['id'])))
    return saida


def relatorio(plano, publicado, destino, emulador=False):
    marca = 'EMULADOR: ' if emulador else ''
    partes = [marca + '# Publicação do catálogo da biblioteca' + (' (EMULADOR)' if emulador else ''), '',
              marca + 'Publicado: %s' % ('sim, versão %d' % plano['indice']['versao'] if publicado else 'não (relatório só)'), '']
    if plano['recusas']:
        partes += ['## Recusas (nada foi gravado)', ''] + ['- ' + r for r in plano['recusas']] + ['']
    partes += ['## O que muda', ''] + (plano['linhas'] or ['- nada: o catálogo da nuvem já está igual']) + ['']
    if destino:
        os.makedirs(os.path.dirname(os.path.abspath(destino)), exist_ok=True)
        with open(destino, 'w', encoding='utf-8', newline='') as f:
            f.write('\n'.join(partes) + '\n')
    return '\n'.join(partes)


def principal(argv=None):
    p = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    p.add_argument('--planilha')
    p.add_argument('--livros')
    p.add_argument('--mapas')
    p.add_argument('--manifesto', action='append', default=[])
    p.add_argument('--topicos')
    p.add_argument('--chaves', help='a pasta dos registros de chave por livro (Livros/mapa/_chaves)')
    p.add_argument('--registro-ids', help='o registro sha256 para id (Livros/catalogo/_ids.json), que só cresce')
    p.add_argument('--primeira-publicacao', action='store_true',
                   help='só na primeira vez: o registro de ids e a pasta das chaves ainda não existem, e a nuvem não tem catálogo')
    p.add_argument('--heranca', action='append', default=[], help='tabela de herança de títulos (HERANCA_L1.json)')
    p.add_argument('--classificacao', help='CLASSIFICACAO_ACERVO.csv: só FICA e SO_TEORIA vão para a nuvem (obrigatória com --publicar)')
    p.add_argument('--trocas', help='trocas_de_arquivo.json: [{id, arquivo_antigo, arquivo_novo, motivo}]')
    p.add_argument('--retirar', action='append', default=[])
    p.add_argument('--relatorio')
    p.add_argument('--pasta-publicacoes')
    p.add_argument('--projeto', default=PROJETO)
    p.add_argument('--uid-arquivo', help='o arquivo com o uid da dona, em %%USERPROFILE%%\\.secrets\\')
    p.add_argument('--conta', help='o e-mail da conta do dono, conferido na configuração e no token antes de gravar')
    p.add_argument('--gcloud', help='o gcloud, por caminho absoluto')
    p.add_argument('--gcloud-config', default=os.path.join(os.path.expanduser('~'), '.gcloud-nath'))
    p.add_argument('--emulador', action='store_true', help='contra o emulador (FIRESTORE_EMULATOR_HOST): o único modo das provas')
    p.add_argument('--uid', help='só com --emulador')
    p.add_argument('--agora', help='só com --emulador: a data da publicação, fixa')
    p.add_argument('--falhar-no-lote', action='store_true', help='só com --emulador: o commit falha de propósito')
    p.add_argument('--publicar', action='store_true')
    a = p.parse_args(argv)
    host = os.environ.get('FIRESTORE_EMULATOR_HOST') or None
    marca = 'EMULADOR: ' if a.emulador else ''
    try:
        # o modo do emulador é por opção explícita, e a opção e a variável andam juntas
        if a.emulador and not host:
            raise Recusa('--emulador sem FIRESTORE_EMULATOR_HOST: diga onde está o emulador')
        if host and not a.emulador:
            raise Recusa('FIRESTORE_EMULATOR_HOST está no ambiente sem --emulador; nada foi feito (para a produção, tire a variável)')
        if not a.emulador and (a.uid or a.agora or a.falhar_no_lote):
            raise Recusa('--uid, --agora e --falhar-no-lote só valem com --emulador')
        if a.publicar and not a.classificacao:
            raise Recusa('--publicar pede a classificação do acervo (--classificacao): sem ela, nada vai para a nuvem')
        if a.uid:
            uid = a.uid
        else:
            if not a.uid_arquivo or not os.path.isfile(a.uid_arquivo):
                raise Recusa('falta o arquivo do uid da dona (--uid-arquivo)')
            with open(a.uid_arquivo, encoding='utf-8') as f:
                uid = f.read().strip()
        if not re.fullmatch(r'[A-Za-z0-9]{1,128}', uid or ''):
            raise Recusa('uid inválido')
        # os registros: o caminho dado que não existe é recusa; só a primeira publicação nasce sem eles
        if a.publicar and (not a.registro_ids or not a.chaves):
            raise Recusa('--publicar pede o registro de ids (--registro-ids) e a pasta das chaves (--chaves)')
        if a.registro_ids and not os.path.isfile(a.registro_ids) and not a.primeira_publicacao:
            raise Recusa('o registro de ids não existe: %s (só a --primeira-publicacao nasce sem ele)' % a.registro_ids)
        if a.chaves and not os.path.isdir(a.chaves) and not a.primeira_publicacao:
            raise Recusa('a pasta das chaves não existe: %s (só a --primeira-publicacao nasce sem ela)' % a.chaves)
        if a.mapas and not os.path.isdir(a.mapas):
            raise Recusa('a pasta dos mapas não existe: %s' % a.mapas)
        if a.emulador:
            token = 'owner'
        else:
            token = token_do_dono(a.gcloud, a.gcloud_config, a.conta)
            dono = email_do_token(token)
            if dono.lower() != (a.conta or '').lower():
                raise Recusa('o token é da conta %r, e não da %r; nada foi gravado' % (dono, a.conta))
        fs = Firestore(a.projeto, token, host if a.emulador else None)
        indice = fs.ler('usuarios/%s/config/catalogo' % uid)
        if a.primeira_publicacao and indice is not None:
            raise Recusa('--primeira-publicacao, mas a nuvem já tem catálogo (versão %s)' % indice.get('versao'))
        if a.manifesto:
            novos = livros_dos_manifests(a.manifesto)
        elif a.planilha and a.livros:
            novos = livros_da_planilha(a.planilha, a.livros, a.mapas, a.topicos)
        else:
            raise Recusa('diga de onde vêm os livros: --manifesto, ou --planilha com --livros')
        heranca = {}
        for h in a.heranca:
            heranca.update(ler_json(h, {}))
        registros_chaves = {}
        if a.chaves and os.path.isdir(a.chaves):
            for nome in os.listdir(a.chaves):
                if nome.endswith('.json'):
                    registros_chaves[nome[:-5]] = ler_json(os.path.join(a.chaves, nome), None)
        classificacao = ler_classificacao(a.classificacao) if a.classificacao else None
        if classificacao is not None:
            novos, fora_da_nuvem = filtrar_pela_classificacao(novos, classificacao)
        else:
            fora_da_nuvem = ['- sem a classificação do acervo (relatório só): todos os livros listados abaixo']
            novos = [{k: v for k, v in m.items() if k != 'arquivo_origem'} for m in novos]
        citados = assuntos_dos_mapas(a.mapas)
        banco = ids_do_banco(a.topicos) if citados else None
        registro = ler_json(a.registro_ids, {}) if a.registro_ids and os.path.isfile(a.registro_ids) else {}
        import gerar_pacote
        plano = planejar(novos, indice, registro, ler_json(a.trocas, []), a.retirar, banco, citados,
                         registros_chaves, heranca, a.agora, gerar_pacote.commit_do_gerador())
        plano['linhas'] = fora_da_nuvem + plano['linhas']
        # sem --publicar, NADA vai para o disco (nem a reconstrução do registro de ids); com --publicar e
        # nada a publicar, o registro que ficou para trás ganha só as entradas que vieram do índice da nuvem
        if a.publicar and not plano['recusas'] and not plano['indice'] and plano.get('reconstruidos'):
            gravar_json(a.registro_ids, plano['registro_da_nuvem'])
        publicado = False
        if not plano['recusas'] and plano['indice'] and a.publicar:
            escritas = montar_escritas(plano, uid)
            if a.falhar_no_lote:
                # a prova da atomicidade: uma escrita a mais com uma condição que não vale; o commit inteiro cai
                escritas.append({'caminho': 'usuarios/%s/config/catalogo' % uid, 'dados': plano['indice'],
                                 'existe': indice is None})
            fs.commit(escritas)
            publicado = True
            gravar_json(a.registro_ids, plano['registro_ids'])
            os.makedirs(a.chaves, exist_ok=True)
            for lid, reg in plano['registros_chaves'].items():
                gravar_json(os.path.join(a.chaves, '%s.json' % lid), reg)
        destino = a.relatorio
        if publicado and a.pasta_publicacoes:
            destino = os.path.join(a.pasta_publicacoes, '%s_v%d.md' % (plano['indice']['publicadoEm'][:10], plano['indice']['versao']))
        print(relatorio(plano, publicado, destino, a.emulador))
        if plano['recusas']:
            print(marca + 'RECUSADO: %d motivo(s); nada foi gravado.' % len(plano['recusas']))
            return 2
        print(marca + ('PUBLICADO: versão %d, %d escrita(s) em %d commit.' % (plano['indice']['versao'], fs.escritas, fs.commits) if publicado else
                       ('RELATÓRIO: nada mudaria.' if not plano['indice'] else 'RELATÓRIO: sem --publicar, nada foi gravado.')))
        return 0
    except Recusa as e:
        print(marca + 'RECUSADO: %s' % e)
        return 2


if __name__ == '__main__':
    sys.exit(principal())
