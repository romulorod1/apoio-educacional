"""O publicador do catálogo da biblioteca na nuvem (fase 1b, DESENHO seção 2).

Monta os livros com o gerador de hoje (biblioteca/livros.py) ou lê manifests
já gerados, dá a cada capítulo do mapa a chave estável (biblioteca/chaves.py),
compara com o catálogo que está na nuvem e, SÓ com --publicar, grava num
commit atômico do Firestore os documentos que mudaram e o índice novo.
Sem --publicar (o padrão), escreve o relatório do que mudaria e para.

    python -X utf8 biblioteca/publicar_catalogo.py --planilha <csv> --livros <pasta> --mapas <Livros/mapa>
        --chaves <Livros/mapa/_chaves> --registro-ids <Livros/catalogo/_ids.json>
        [--heranca <HERANCA_L1.json> ...] [--trocas <trocas_de_arquivo.json>] [--retirar <id> ...]
        [--relatorio <arquivo.md>] [--pasta-publicacoes <Livros/catalogo/publicacoes>] [--publicar]
    (ou --manifesto <manifest.json> ..., no lugar de --planilha, --livros e --mapas)

Quem escreve: só este script, pela mão do dono, com --publicar explícito; nunca
sozinho. A credencial é a conta Google do próprio dono, numa configuração do
gcloud SÓ DELE (CLOUDSDK_CONFIG=%USERPROFILE%\\.gcloud-nath), pedida a cada
rodada com `gcloud auth print-access-token`; nunca a credencial padrão (ADC),
que nesta máquina é a da Köli. O uid da dona vem de um arquivo em
%USERPROFILE%\\.secrets\\ (--uid-arquivo). Nada disso entra no repositório.

Contra o emulador (FIRESTORE_EMULATOR_HOST=127.0.0.1:porta, como o
firebase-tools faz), o token é "owner", o uid pode vir em --uid e as provas
rodam sem conta nenhuma de verdade.

Travas (cada uma recusa a publicação inteira, com o motivo no relatório):
  - lista fechada de caminhos: só usuarios/<uid>/config/catalogo e
    usuarios/<uid>/catalogo/<id>; qualquer outro é recusado ANTES de sair da
    máquina (Firestore.commit);
  - um lote só: tudo num commit (menos de 500 escritas e de 10 MiB), ou nada;
  - ids: id repetido; o mesmo arquivo (sha256) com outro id do que o registro
    diz; id publicado que some sem --retirar; troca de formato (EPUB para PDF)
    fora de trocas_de_arquivo.json;
  - forma do meta: meta.id, meta.hash "sha256:<64 hex>" e meta.bytes inteiro;
  - assunto do mapa fora do banco da main (o gerador o descartaria calado).
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
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import chaves  # noqa: E402

PROJETO = 'nw-apoio-educacional'
MAX_ESCRITAS = 500
MAX_BYTES_DO_LOTE = 10 * 1024 * 1024
CAMINHO_PERMITIDO = re.compile(r'^usuarios/[A-Za-z0-9]{1,128}/(config/catalogo|catalogo/[a-z0-9][a-z0-9-]{0,199})$')
CAMPOS_DO_DOCUMENTO = ('id', 'titulo', 'volume', 'materia', 'materia_nome', 'segmento', 'series', 'formato', 'paginas')


class Recusa(Exception):
    pass


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
            if not CAMINHO_PERMITIDO.match(e['caminho']):
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
        st, resposta = self._pedir('POST', '%s/v1/%s/documents:commit' % (self.raiz, self.banco), corpo)
        if st != 200:
            raise Recusa('o commit falhou (HTTP %d), e nada foi gravado: %s' % (st, resposta.get('erro', '')))
        return resposta


def token_do_dono(gcloud, config):
    """O token da conta do dono, da configuração SÓ dele do gcloud. Nunca ADC."""
    if not config or not os.path.isdir(config):
        raise Recusa('falta a configuração do gcloud do dono (%s); faça o login nela antes' % config)
    if not gcloud or not os.path.isabs(gcloud) or not os.path.isfile(gcloud):
        raise Recusa('o gcloud tem de vir por caminho absoluto (--gcloud): %r' % gcloud)
    env = dict(os.environ)
    env['CLOUDSDK_CONFIG'] = config
    env.pop('GOOGLE_APPLICATION_CREDENTIALS', None)
    r = subprocess.run([gcloud, 'auth', 'print-access-token'], capture_output=True, text=True, env=env)
    if r.returncode != 0 or not r.stdout.strip():
        raise Recusa('o gcloud não deu o token do dono: %s' % (r.stderr or '').strip()[:300])
    return r.stdout.strip()


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
    if not pasta or not os.path.isdir(pasta):
        return citados
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
             'registros_chaves': registros_chaves, 'indice': None}
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
    if not caminho or not os.path.isfile(caminho):
        return padrao
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
            manifest, _rel, _trab = livros.gerar(planilha, 'catalogo-%s' % m, 1, tmp, pasta_livros=pasta_livros, materia=m,
                                                 mapas=mapas, trabalho=os.path.join(tmp, m), gravar=False, topicos=topicos,
                                                 conferencia=os.path.join(tmp, m, 'gabaritos'))
            saida.extend(manifest['livros'])
    return saida


def relatorio(plano, publicado, destino):
    partes = ['# Publicação do catálogo da biblioteca', '',
              'Publicado: %s' % ('sim, versão %d' % plano['indice']['versao'] if publicado else 'não (relatório só)'), '']
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
    p.add_argument('--heranca', action='append', default=[], help='tabela de herança de títulos (HERANCA_L1.json)')
    p.add_argument('--trocas', help='trocas_de_arquivo.json: [{id, arquivo_antigo, arquivo_novo, motivo}]')
    p.add_argument('--retirar', action='append', default=[])
    p.add_argument('--relatorio')
    p.add_argument('--pasta-publicacoes')
    p.add_argument('--projeto', default=PROJETO)
    p.add_argument('--uid-arquivo', help='o arquivo com o uid da dona, em %%USERPROFILE%%\\.secrets\\')
    p.add_argument('--uid', help='só contra o emulador')
    p.add_argument('--gcloud', help='o gcloud, por caminho absoluto')
    p.add_argument('--gcloud-config', default=os.path.join(os.path.expanduser('~'), '.gcloud-nath'))
    p.add_argument('--agora', help='só contra o emulador: a data da publicação, fixa')
    p.add_argument('--falhar-no-lote', action='store_true', help='só contra o emulador: o commit falha de propósito')
    p.add_argument('--publicar', action='store_true')
    a = p.parse_args(argv)
    emulador = os.environ.get('FIRESTORE_EMULATOR_HOST') or None
    try:
        if not emulador and (a.uid or a.agora or a.falhar_no_lote):
            raise Recusa('--uid, --agora e --falhar-no-lote só valem contra o emulador')
        if a.uid:
            uid = a.uid
        else:
            if not a.uid_arquivo or not os.path.isfile(a.uid_arquivo):
                raise Recusa('falta o arquivo do uid da dona (--uid-arquivo)')
            with open(a.uid_arquivo, encoding='utf-8') as f:
                uid = f.read().strip()
        if not re.fullmatch(r'[A-Za-z0-9]{1,128}', uid or ''):
            raise Recusa('uid inválido')
        token = 'owner' if emulador else token_do_dono(a.gcloud, a.gcloud_config)
        fs = Firestore(a.projeto, token, emulador)
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
        citados = assuntos_dos_mapas(a.mapas)
        banco = ids_do_banco(a.topicos) if citados else None
        indice = fs.ler('usuarios/%s/config/catalogo' % uid)
        import gerar_pacote
        plano = planejar(novos, indice, ler_json(a.registro_ids, {}), ler_json(a.trocas, []), a.retirar, banco, citados,
                         registros_chaves, heranca, a.agora, gerar_pacote.commit_do_gerador())
        publicado = False
        if not plano['recusas'] and plano['indice'] and a.publicar:
            escritas = montar_escritas(plano, uid)
            if a.falhar_no_lote:
                # a prova da atomicidade: uma escrita a mais com uma condição que não vale; o commit inteiro cai
                escritas.append({'caminho': 'usuarios/%s/config/catalogo' % uid, 'dados': plano['indice'],
                                 'existe': indice is None})
            fs.commit(escritas)
            publicado = True
            if a.registro_ids:
                gravar_json(a.registro_ids, plano['registro_ids'])
            if a.chaves:
                for lid, reg in plano['registros_chaves'].items():
                    gravar_json(os.path.join(a.chaves, '%s.json' % lid), reg)
        destino = a.relatorio
        if publicado and a.pasta_publicacoes:
            destino = os.path.join(a.pasta_publicacoes, '%s_v%d.md' % (plano['indice']['publicadoEm'][:10], plano['indice']['versao']))
        print(relatorio(plano, publicado, destino))
        if plano['recusas']:
            print('RECUSADO: %d motivo(s); nada foi gravado.' % len(plano['recusas']))
            return 2
        print('PUBLICADO: versão %d, %d escrita(s) em %d commit.' % (plano['indice']['versao'], fs.escritas, fs.commits) if publicado else
              ('RELATÓRIO: nada mudaria.' if not plano['indice'] else 'RELATÓRIO: sem --publicar, nada foi gravado.'))
        return 0
    except Recusa as e:
        print('RECUSADO: %s' % e)
        return 2


if __name__ == '__main__':
    sys.exit(principal())
