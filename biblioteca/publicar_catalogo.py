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
        [--pacotes <Biblioteca/pacotes> ...] [--primeira-publicacao] [--ensaio | --publicar]
    (ou --manifesto <manifest.json> ..., no lugar de --planilha e --mapas; com --livros, os
    arquivos dos livros do manifest sobem também, pelo arquivo_origem de cada um)

Os ARQUIVOS (PR 2 da nuvem da biblioteca): com --livros (a planilha sempre tem),
cada livro do catálogo sobe ao Storage do projeto, no bucket
nw-apoio-educacional.firebasestorage.app, em usuarios/<uid>/livros/<sha256>.pdf
ou .epub; com --pacotes, cada pacote de exercícios na versão VIGENTE (o maior
-vN de cada nome, só os .zip soltos na pasta: subpasta nenhuma é lida, e as
cópias de segurança e os ensaios ficam de fora) sobe em
usuarios/<uid>/pacotes/<sha256>.zip. Tudo, inclusive o pacote privado, vai só
para a pasta da dona (lista fechada de caminhos no Storage, conferida antes de
qualquer pedido). O nome é o sha256 dos bytes: o envio é idempotente (o objeto
que já está lá, conferido pelo tamanho, pelo sha256 dos metadados e pelo tipo,
não sobe de novo) e um arquivo novo nunca sobrescreve outro (ifGenerationMatch=0).
Limites, que recusam a publicação inteira com o motivo: o livro até 200 MiB e o
pacote até 100 MiB, e vazio nunca. O tipo vai certo (application/pdf,
application/epub+zip, application/zip), e NUNCA um token de download: nada de
firebaseStorageDownloadTokens nos metadados, nem API que crie token; o objeto
com token é recusa. O envio é retomável (pedaços de 8 MiB), refeito em erro de
rede; depois de subir, os metadados são relidos e o tamanho e o md5 conferidos.
SÓ DEPOIS de todos os arquivos conferidos o catálogo é gravado: o livro e o
índice ganham caminhoNuvem, e o índice ganha pacotes {nome: {versao, sha256,
tamanho, caminhoNuvem, publicadoEm}}. Esses campos são novos e ficam FORA do
metaJson (o metaHash não muda, e o aplicativo de hoje não vê diferença). Um envio
que falha deixa o catálogo como estava; o que já subiu fica (pelo hash, a
rodada seguinte não o reenvia).
--ensaio (e o padrão, sem --publicar) só lê: lista quantos arquivos subiriam, o
tamanho total e quais são novos, e não grava nada, nem no Storage nem no
Firestore nem no disco.

Quem escreve: só este script, pela mão do dono, com --publicar explícito; nunca
sozinho. A credencial é a conta Google do próprio dono, numa configuração do
gcloud SÓ DELE (CLOUDSDK_CONFIG=%USERPROFILE%\\.gcloud-nath): as variáveis que
trocariam a conta saem do ambiente do gcloud, a conta ativa da configuração e
o e-mail do token têm de ser a --conta, e nunca a credencial padrão (ADC),
que nesta máquina é a da Köli. O uid da dona vem de um arquivo em
%USERPROFILE%\\.secrets\\ (--uid-arquivo). Nada disso entra no repositório.

Contra o emulador, SÓ com --emulador e FIRESTORE_EMULATOR_HOST juntos (uma sem
a outra é recusa; o mesmo para FIREBASE_STORAGE_EMULATOR_HOST, que os arquivos
pedem): o token é "owner", o uid pode vir em --uid, o bucket em --bucket, e toda
linha de resultado começa com "EMULADOR:". O emulador do Storage fecha o objeto
no primeiro PUT do envio retomável e não responde à consulta de estado: contra
ele, cada arquivo vai num PUT só e a retomada recomeça o arquivo do zero (os
pedaços de 8 MiB e a consulta de estado valem só na produção).

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
import base64
import datetime
import hashlib
import http.client
import json
import os
import re
import subprocess
import sys
import tempfile
import time
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

# o Storage: o bucket do projeto, os caminhos (sempre com fullmatch, e o uid tem de ser o da dona) e os limites
BUCKET = 'nw-apoio-educacional.firebasestorage.app'
CAMINHO_NO_STORAGE = re.compile(r'usuarios/([A-Za-z0-9]{1,128})/(livros/[0-9a-f]{64}[.](pdf|epub)|pacotes/[0-9a-f]{64}[.]zip)')
TIPOS = {'pdf': 'application/pdf', 'epub': 'application/epub+zip', 'zip': 'application/zip'}
LIMITE_DO_LIVRO = 200 * 1024 * 1024
LIMITE_DO_PACOTE = 100 * 1024 * 1024
PEDACO = 8 * 1024 * 1024          # múltiplo de 256 KiB, como o envio retomável pede
TENTATIVAS = 5
NOME_DE_PACOTE = re.compile(r'([a-z0-9][a-z0-9-]*?)-v([0-9]{1,6})[.]zip')


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


# ------------------------------------------------------------------ o Storage pela API JSON do Cloud Storage

def caminho_no_storage(uid, sha, extensao):
    """usuarios/<uid>/livros/<sha>.pdf|.epub, ou usuarios/<uid>/pacotes/<sha>.zip."""
    return 'usuarios/%s/%s/%s.%s' % (uid, 'pacotes' if extensao == 'zip' else 'livros', sha, extensao)


def hashes_do_arquivo(caminho):
    """(sha256 em hexadecimal, md5 em base64 como o Storage o devolve, tamanho), numa leitura só."""
    sha, md5, n = hashlib.sha256(), hashlib.md5(), 0
    with open(caminho, 'rb') as f:
        for bloco in iter(lambda: f.read(1024 * 1024), b''):
            sha.update(bloco)
            md5.update(bloco)
            n += len(bloco)
    return sha.hexdigest(), base64.b64encode(md5.digest()).decode('ascii'), n


def proximo_byte(faixa):
    """O primeiro byte que falta, pelo cabeçalho Range do 308 ("bytes=0-N"); sem ele, nada ficou."""
    m = re.fullmatch(r'bytes=0-([0-9]+)', (faixa or '').strip())
    return int(m.group(1)) + 1 if m else 0


class Storage:
    """Ler os metadados de um objeto e enviar um arquivo, pela API JSON do
    Cloud Storage, com o mesmo Bearer do Firestore. Só caminhos da lista
    fechada, e só na pasta da dona (`uid`), conferidos antes de qualquer
    pedido. Nenhuma chamada cria token de download."""

    def __init__(self, bucket, token, uid, emulador=None, falhas_forcadas=0):
        self.bucket, self.token, self.uid, self.emulador = bucket, token, uid, emulador
        self.falhas_forcadas = falhas_forcadas
        self.espera = 0.05 if emulador else 2.0
        self.enviados = []
        if emulador:
            host, porta = emulador.rsplit(':', 1)
            self.conexao = lambda: http.client.HTTPConnection(host, int(porta), timeout=120)
        else:
            self.conexao = lambda: http.client.HTTPSConnection('storage.googleapis.com', timeout=120)

    def conferir_caminho(self, caminho):
        m = CAMINHO_NO_STORAGE.fullmatch(caminho or '')
        if not m or m.group(1) != self.uid:
            raise Recusa('caminho do Storage fora da lista fechada do publicador (ou fora da pasta da dona): %s' % caminho)

    def _pedir(self, metodo, url, corpo=None, cab=None):
        cab = dict(cab or {})
        cab['Authorization'] = 'Bearer ' + self.token
        if corpo is not None:
            cab['Content-Length'] = str(len(corpo))
        c = self.conexao()
        try:
            c.request(metodo, url, body=corpo, headers=cab)
            r = c.getresponse()
            return r.status, {k.lower(): v for k, v in r.getheaders()}, r.read()
        except (OSError, http.client.HTTPException, ValueError) as e:
            raise SemResposta('o Storage não respondeu (%s: %s)' % (type(e).__name__, str(e)[:200]))
        finally:
            c.close()

    def _com_tentativas(self, fazer, rotulo):
        """O pedido refeito em erro de rede, 429 e 5xx, com espera crescente."""
        ultimo = ''
        for i in range(TENTATIVAS):
            try:
                st, cab, corpo = fazer()
            except SemResposta as e:
                ultimo = str(e)
            else:
                if st != 429 and st < 500:
                    return st, cab, corpo
                ultimo = 'HTTP %d' % st
            time.sleep(self.espera * (2 ** i))
        raise SemResposta('%s: o Storage não respondeu em %d tentativas (%s)' % (rotulo, TENTATIVAS, ultimo))

    def _url_do_objeto(self, caminho):
        return '/storage/v1/b/%s/o/%s' % (urllib.parse.quote(self.bucket, safe=''), urllib.parse.quote(caminho, safe=''))

    def metadados(self, caminho):
        """Os metadados do objeto, ou None quando ele não existe."""
        self.conferir_caminho(caminho)
        url = self._url_do_objeto(caminho)
        st, _cab, corpo = self._com_tentativas(lambda: self._pedir('GET', url), 'ler ' + caminho)
        if st == 404:
            return None
        if st != 200:
            raise Recusa('não consegui ler o objeto %s no Storage (HTTP %d): %s' % (caminho, st, corpo[:300].decode('utf-8', 'replace')))
        return json.loads(corpo.decode('utf-8'))

    def conferir(self, e, obj, md5=None):
        """O objeto é o arquivo: o tamanho, o sha256 dos metadados, o tipo, nenhum
        token de download e, logo depois de subir, o md5 dos bytes. Senão, recusa."""
        problemas = []
        if obj is None:
            problemas.append('o objeto não está lá')
        else:
            meta = obj.get('metadata') or {}
            if str(obj.get('size')) != str(e['tamanho']):
                problemas.append('o tamanho é %s, e o arquivo tem %d' % (obj.get('size'), e['tamanho']))
            if meta.get('sha256') != e['sha256']:
                problemas.append('o sha256 dos metadados não é o do arquivo')
            if obj.get('contentType') != e['contentType']:
                problemas.append('o tipo é %r, e não %r' % (obj.get('contentType'), e['contentType']))
            if 'firebaseStorageDownloadTokens' in meta:
                problemas.append('o objeto tem token de download (abriria o arquivo a quem tiver o link)')
            if md5 is not None and obj.get('md5Hash') != md5:
                problemas.append('o md5 do que subiu não é o do arquivo' if obj.get('md5Hash') else 'o Storage não devolveu o md5 para conferir')
        if problemas:
            raise Recusa('o objeto %s no Storage não confere: %s' % (e['caminho'], '; '.join(problemas)))

    def situacao(self, envios):
        """(os que já estão lá, conferidos; os que faltam; os problemas), sem
        gravar nada. O mesmo caminho conta uma vez."""
        ja, faltam, problemas, vistos = [], [], [], set()
        for e in envios:
            if e['caminho'] in vistos:
                continue
            vistos.add(e['caminho'])
            existente = self.metadados(e['caminho'])
            if existente is not None:
                try:
                    self.conferir(e, existente)
                except Recusa as erro:
                    problemas.append(str(erro))
                    continue
                ja.append(e)
                continue
            faltam.append(e)
        return ja, faltam, problemas

    def _sessao(self, e):
        """Abre o envio retomável; None quando o objeto já existe (412)."""
        q = urllib.parse.urlencode({'uploadType': 'resumable', 'name': e['caminho'], 'ifGenerationMatch': '0'})
        url = '/upload/storage/v1/b/%s/o?%s' % (urllib.parse.quote(self.bucket, safe=''), q)
        corpo = json.dumps({'name': e['caminho'], 'contentType': e['contentType'],
                            'metadata': {'sha256': e['sha256']}}).encode('utf-8')
        cab = {'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': e['contentType'],
               'X-Upload-Content-Length': str(e['tamanho'])}
        st, resp, texto = self._com_tentativas(lambda: self._pedir('POST', url, corpo, cab), 'abrir o envio de ' + e['caminho'])
        if st == 412:
            return None
        if st not in (200, 201) or not resp.get('location'):
            raise Recusa('o Storage não abriu o envio de %s (HTTP %d): %s' % (e['caminho'], st, texto[:300].decode('utf-8', 'replace')))
        destino = urllib.parse.urlsplit(resp['location'])
        if not self.emulador and (destino.scheme, destino.netloc) != ('https', 'storage.googleapis.com'):
            raise Recusa('o Storage mandou o envio de %s para outro endereço; nada foi enviado' % e['caminho'])
        return destino.path + '?' + destino.query

    def _estado(self, sessao, total):
        """Quanto o Storage já guardou do envio: o próximo byte, 'fim' (fechado) ou None (a sessão venceu)."""
        try:
            st, cab, _ = self._pedir('PUT', sessao, b'', {'Content-Range': 'bytes */%d' % total})
        except SemResposta:
            return None
        if st == 308:
            return proximo_byte(cab.get('range'))
        if st in (200, 201):
            return 'fim'
        return None

    def _enviar(self, e):
        """O arquivo, em pedaços, retomado no erro de rede. 'enviado' ou 'existia'."""
        total = e['tamanho']
        # o emulador fecha o objeto no primeiro PUT: lá, o arquivo vai inteiro
        pedaco = total if self.emulador else PEDACO
        sessao = self._sessao(e)
        if sessao is None:
            return 'existia'
        feito, erros, motivo = 0, 0, ''
        with open(e['disco'], 'rb') as f:
            while True:
                fim = min(feito + pedaco, total)
                f.seek(feito)
                dados = f.read(fim - feito)
                if len(dados) != fim - feito:
                    raise Recusa('o arquivo de %s mudou de tamanho durante o envio' % e['rotulo'])
                try:
                    if self.falhas_forcadas > 0:
                        self.falhas_forcadas -= 1
                        raise SemResposta('falha de rede simulada (--falhar-envio)')
                    st, cab, texto = self._pedir('PUT', sessao, dados, {'Content-Range': 'bytes %d-%d/%d' % (feito, fim - 1, total)})
                except SemResposta as erro:
                    st, cab, texto, motivo = None, {}, b'', str(erro)
                if st in (200, 201):
                    return 'enviado'
                if st == 412:
                    return 'existia'
                if st == 308:
                    feito = proximo_byte(cab.get('range'))
                    continue
                if st is not None and st not in (404, 408, 410, 429) and st < 500:
                    raise Recusa('o Storage recusou o envio de %s (HTTP %d): %s' % (e['rotulo'], st, texto[:300].decode('utf-8', 'replace')))
                if st is not None:
                    motivo = 'HTTP %d' % st
                erros += 1
                if erros >= TENTATIVAS:
                    raise SemResposta('o envio de %s falhou %d vezes (%s)' % (e['rotulo'], erros, motivo))
                time.sleep(self.espera * (2 ** (erros - 1)))
                estado = None if (self.emulador or st in (404, 410)) else self._estado(sessao, total)
                if estado == 'fim':
                    return 'enviado'
                if estado is None:
                    # a sessão venceu (ou é o emulador, que não responde à consulta): um envio novo, do zero
                    sessao = self._sessao(e)
                    if sessao is None:
                        return 'existia'
                    feito = 0
                else:
                    feito = estado

    def subir(self, faltam):
        """Cada arquivo que falta: confere o disco (sha256 e tamanho), envia,
        relê os metadados e confere tamanho, sha256, tipo, md5 e a ausência de
        token. Qualquer falha é recusa, e quem chama não grava o catálogo."""
        for e in faltam:
            try:
                sha, md5, tamanho = hashes_do_arquivo(e['disco'])
                if sha != e['sha256'] or tamanho != e['tamanho']:
                    raise Recusa('o arquivo de %s no disco não é mais o da conferência (o sha256 ou o tamanho mudou)' % e['rotulo'])
                como = self._enviar(e)
                self.conferir(e, self.metadados(e['caminho']), md5 if como == 'enviado' else None)
            except Recusa as erro:
                raise type(erro)('%s. %d arquivo(s) subiram e foram conferidos antes deste (ficam no Storage, e a rodada '
                                 'seguinte não os reenvia); o catálogo NÃO foi gravado' % (erro, len(self.enviados)))
            self.enviados.append(e)
        return self.enviados


def pacotes_das_pastas(pastas):
    """Os pacotes de exercícios, só na versão VIGENTE: o maior -vN de cada nome,
    entre os .zip soltos nas pastas dadas. Subpasta nenhuma é lida (as cópias de
    segurança e os ensaios moram nelas). Devolve (pacotes, recusas, linhas)."""
    achados, recusas, linhas, antigas, subpastas = {}, [], [], 0, 0
    for pasta in pastas:
        if not os.path.isdir(pasta):
            recusas.append('a pasta dos pacotes não existe: %s' % pasta)
            continue
        for nome in sorted(os.listdir(pasta)):
            caminho = os.path.join(pasta, nome)
            if os.path.isdir(caminho):
                subpastas += 1
                continue
            m = NOME_DE_PACOTE.fullmatch(nome)
            if not m:
                continue
            achados.setdefault(m.group(1), []).append((int(m.group(2)), caminho))
    pacotes = []
    for nome in sorted(achados):
        versoes = sorted(achados[nome])
        maior = versoes[-1][0]
        vigentes = [c for v, c in versoes if v == maior]
        antigas += len(versoes) - len(vigentes)
        if len(vigentes) > 1:
            recusas.append('o pacote %s v%d está em %d pastas: diga uma só' % (nome, maior, len(vigentes)))
            continue
        tamanho = os.path.getsize(vigentes[0])
        if tamanho <= 0:
            recusas.append('o pacote %s v%d está vazio' % (nome, maior))
            continue
        if tamanho > LIMITE_DO_PACOTE:
            recusas.append('o pacote %s v%d tem %d bytes, acima do limite de %d (100 MiB); não sobe' % (nome, maior, tamanho, LIMITE_DO_PACOTE))
            continue
        sha, _md5, _n = hashes_do_arquivo(vigentes[0])
        pacotes.append({'nome': nome, 'versao': maior, 'disco': vigentes[0], 'sha256': sha, 'tamanho': tamanho})
    if antigas:
        linhas.append('- pacotes: %d versão(ões) antiga(s) ficam de fora (só a vigente de cada pacote sobe)' % antigas)
    if subpastas:
        linhas.append('- pacotes: %d subpasta(s) não lida(s) (cópias de segurança e ensaios ficam de fora)' % subpastas)
    return pacotes, recusas, linhas


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
             registros_chaves=None, heranca=None, agora=None, gerador=None, uid=None, arquivos=None, pacotes=None):
    """A decisão inteira, sem rede: o que escrever e por quê. Devolve
    {'recusas', 'escritas', 'linhas', 'registro_ids', 'registros_chaves', 'indice', 'envios'}.

    `arquivos` ({id: {disco, tamanho}}, ou None quando os arquivos dos livros
    não vêm nesta rodada) e `pacotes` (de pacotes_das_pastas, ou None): os
    arquivos que vão ao Storage, em `envios`. O livro com arquivo ganha
    caminhoNuvem; sem arquivo nesta rodada, fica o caminhoNuvem de antes se o
    arquivo (sha256) é o mesmo."""
    recusas, linhas, envios = [], [], []
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
        # o arquivo do livro no Storage (fora do metaJson: o metaHash não muda por ele)
        caminho_nuvem = None
        if arquivos is not None:
            arq = arquivos.get(lid)
            formato = meta.get('formato')
            if formato not in ('pdf', 'epub'):
                recusas.append('o livro %s tem formato %r, que não sobe ao Storage' % (lid, formato))
                continue
            if not arq:
                recusas.append('o arquivo do livro %s não está na pasta dos livros (--livros)' % lid)
                continue
            if arq['tamanho'] > LIMITE_DO_LIVRO:
                recusas.append('o livro %s tem %d bytes, acima do limite de %d (200 MiB); não sobe' % (lid, arq['tamanho'], LIMITE_DO_LIVRO))
                continue
            if arq['tamanho'] <= 0 or arq['tamanho'] != meta['bytes']:
                recusas.append('o arquivo do livro %s no disco tem %d bytes, e o meta diz %d' % (lid, arq['tamanho'], meta['bytes']))
                continue
            caminho_nuvem = caminho_no_storage(uid, sha, formato)
            envios.append({'rotulo': 'livro ' + lid, 'caminho': caminho_nuvem, 'disco': arq['disco'], 'sha256': sha,
                           'tamanho': meta['bytes'], 'contentType': TIPOS[formato]})
        elif a and a.get('sha256') == sha:
            caminho_nuvem = a.get('caminhoNuvem')
        texto = texto_do_meta(meta)
        meta_hash = hashlib.sha256(texto.encode('utf-8')).hexdigest()
        igual_meta = bool(a) and a.get('sha256') == sha and a.get('metaHash') == meta_hash and not a.get('retiradoEm')
        igual = igual_meta and a.get('caminhoNuvem') == caminho_nuvem
        versao_meta = (a.get('metaVersao') or 0) + (0 if igual_meta else 1) if a else 1
        novo_indice[lid] = {'sha256': sha, 'tamanho': meta['bytes'], 'metaHash': meta_hash, 'metaVersao': versao_meta,
                            'formato': meta.get('formato'), 'retiradoEm': None, 'caminhoNuvem': caminho_nuvem}
        if igual:
            continue
        if igual_meta:
            # só o caminho do arquivo no Storage é novo: o documento ganha esse campo, e nada mais muda
            linhas.append('- %s: arquivo na nuvem (%s bytes)' % (lid, meta['bytes']))
            docs.append((lid, {'caminhoNuvem': caminho_nuvem}, ['caminhoNuvem']))
            continue
        motivo = 'novo' if not a else ('arquivo trocado' if a.get('sha256') != sha else
                                       'volta ao catálogo' if a.get('retiradoEm') else 'meta trocado')
        linhas.append('- %s: %s (%s bytes)' % (lid, motivo, meta['bytes']))
        doc = {k: meta.get(k) for k in CAMPOS_DO_DOCUMENTO}
        doc.update(sha256=sha, tamanho=meta['bytes'], metaVersao=versao_meta, metaHash=meta_hash, metaJson=texto,
                   idsAnteriores=[], publicadoEm=agora, retiradoEm=None, caminhoNuvem=caminho_nuvem)
        docs.append((lid, doc, None))
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
        docs.append((lid, None, None))
    for lid in sorted(retirar):
        if lid in vistos or lid not in antes:
            recusas.append('--retirar %s pede um livro que não está publicado ou que continua na planilha' % lid)
    # os pacotes de exercícios: só no índice (pacotes), pela versão; o que não veio nesta rodada fica como estava
    pacotes_antes = indice.get('pacotes') or {}
    novos_pacotes = dict(pacotes_antes)
    mudou_pacotes = False
    for p in pacotes or []:
        nome, versao, sha = p['nome'], p['versao'], p['sha256']
        a = pacotes_antes.get(nome) or {}
        if a and versao < (a.get('versao') or 0):
            recusas.append('o pacote %s voltaria da versão %d para a %d' % (nome, a.get('versao'), versao))
            continue
        if a and versao == a.get('versao') and a.get('sha256') != sha:
            recusas.append('o pacote %s mudou de conteúdo sem subir a versão (v%d): gere a versão seguinte' % (nome, versao))
            continue
        caminho = caminho_no_storage(uid, sha, 'zip')
        envios.append({'rotulo': 'pacote %s v%d' % (nome, versao), 'caminho': caminho, 'disco': p['disco'], 'sha256': sha,
                       'tamanho': p['tamanho'], 'contentType': TIPOS['zip']})
        if a.get('sha256') == sha and a.get('versao') == versao and a.get('caminhoNuvem') == caminho:
            continue
        novos_pacotes[nome] = {'versao': versao, 'sha256': sha, 'tamanho': p['tamanho'], 'caminhoNuvem': caminho, 'publicadoEm': agora}
        mudou_pacotes = True
        linhas.append('- pacote %s: %s (v%d, %d bytes)' % (nome, 'novo' if not a else 'versão nova', versao, p['tamanho']))
    plano = {'recusas': recusas, 'linhas': linhas, 'docs': docs, 'registro_ids': registro_ids,
             'registros_chaves': registros_chaves, 'indice': None, 'reconstruidos': reconstruidos,
             'registro_da_nuvem': registro_da_nuvem, 'envios': envios}
    if recusas or not (docs or mudou_pacotes):
        return plano
    indice_novo = {'versao': (indice.get('versao') or 0) + 1, 'publicadoEm': agora, 'gerador': gerador,
                   'livros': {k: novo_indice[k] for k in sorted(novo_indice)}}
    if novos_pacotes:
        indice_novo['pacotes'] = {k: novos_pacotes[k] for k in sorted(novos_pacotes)}
    plano['indice'] = indice_novo
    return plano


def montar_escritas(plano, uid):
    """As escritas do lote: os documentos que mudaram e, por último, o índice."""
    raiz = 'usuarios/%s' % uid
    escritas = []
    for lid, doc, campos in plano['docs']:
        if doc is None:
            escritas.append({'caminho': '%s/catalogo/%s' % (raiz, lid), 'dados': {'retiradoEm': plano['indice']['publicadoEm']},
                             'campos': ['retiradoEm']})
        elif campos:
            # só os campos novos, num documento que já existe
            escritas.append({'caminho': '%s/catalogo/%s' % (raiz, lid), 'dados': doc, 'campos': list(campos), 'existe': True})
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
    if plano.get('linhas_arquivos'):
        partes += ['## Arquivos no Storage', ''] + plano['linhas_arquivos'] + ['']
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
    p.add_argument('--pacotes', action='append', default=[],
                   help='a pasta dos pacotes de exercícios (os .zip soltos nela; sobe só o maior -vN de cada nome)')
    p.add_argument('--bucket', help='só com --emulador: o bucket do emulador do Storage')
    p.add_argument('--falhar-envio', type=int, default=0, help='só com --emulador: os N primeiros envios ao Storage falham na rede')
    p.add_argument('--ensaio', action='store_true', help='só lê: o que subiria ao Storage e o que mudaria no catálogo')
    p.add_argument('--publicar', action='store_true')
    a = p.parse_args(argv)
    host = os.environ.get('FIRESTORE_EMULATOR_HOST') or None
    host_st = os.environ.get('FIREBASE_STORAGE_EMULATOR_HOST') or None
    marca = 'EMULADOR: ' if a.emulador else ''
    try:
        # o modo do emulador é por opção explícita, e a opção e a variável andam juntas
        if a.emulador and not host:
            raise Recusa('--emulador sem FIRESTORE_EMULATOR_HOST: diga onde está o emulador')
        if host and not a.emulador:
            raise Recusa('FIRESTORE_EMULATOR_HOST está no ambiente sem --emulador; nada foi feito (para a produção, tire a variável)')
        if host_st and not a.emulador:
            raise Recusa('FIREBASE_STORAGE_EMULATOR_HOST está no ambiente sem --emulador; nada foi feito (para a produção, tire a variável)')
        if not a.emulador and (a.uid or a.agora or a.falhar_no_lote or a.bucket or a.falhar_envio):
            raise Recusa('--uid, --agora, --falhar-no-lote, --bucket e --falhar-envio só valem com --emulador')
        if a.ensaio and a.publicar:
            raise Recusa('--ensaio só lê, e --publicar grava: escolha um')
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
        # os arquivos dos livros (com --livros): o caminho da planilha (arquivo_origem) dentro da pasta, lido antes
        # que a classificação o tire do meta
        arquivos = None
        if a.livros:
            if not os.path.isdir(a.livros):
                raise Recusa('a pasta dos livros não existe: %s' % a.livros)
            arquivos = {}
            for m in novos:
                o = m.get('arquivo_origem')
                d = os.path.join(a.livros, *str(o).replace(chr(92), '/').split('/')) if o else None
                if m.get('id') and d and os.path.isfile(d):
                    arquivos[m['id']] = {'disco': d, 'tamanho': os.path.getsize(d)}
        pacotes, recusas_pacotes, linhas_pacotes = pacotes_das_pastas(a.pacotes) if a.pacotes else (None, [], [])
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
                         registros_chaves, heranca, a.agora, gerar_pacote.commit_do_gerador(), uid, arquivos, pacotes)
        plano['linhas'] = fora_da_nuvem + linhas_pacotes + plano['linhas']
        plano['recusas'] = recusas_pacotes + plano['recusas']
        # o Storage: o que já está lá (conferido) e o que falta, só lendo
        st, ja, faltam = None, [], []
        if plano['envios'] and not plano['recusas']:
            if a.emulador and not host_st:
                raise Recusa('--emulador com arquivos pede FIREBASE_STORAGE_EMULATOR_HOST: diga onde está o emulador do Storage')
            st = Storage(a.bucket or BUCKET, token, uid, host_st if a.emulador else None, a.falhar_envio)
            ja, faltam, problemas = st.situacao(plano['envios'])
            plano['recusas'] += problemas
            total = sum(e['tamanho'] for e in faltam)
            plano['linhas_arquivos'] = ['- %d arquivo(s) já estão no Storage, conferidos pelo tamanho, pelo sha256 e pelo tipo' % len(ja),
                                        '- %d arquivo(s) novos a enviar, %d bytes (%.1f MB) no total%s' % (
                                            len(faltam), total, total / 1e6, ':' if faltam else '')]
            plano['linhas_arquivos'] += ['    - %s: %d bytes (%.1f MB)' % (e['rotulo'], e['tamanho'], e['tamanho'] / 1e6) for e in faltam]
        # sem --publicar, NADA vai para o disco (nem a reconstrução do registro de ids); com --publicar e
        # nada a publicar, o registro que ficou para trás ganha só as entradas que vieram do índice da nuvem
        if a.publicar and not plano['recusas'] and not plano['indice'] and plano.get('reconstruidos'):
            gravar_json(a.registro_ids, plano['registro_da_nuvem'])

        def gravar_catalogo():
            if not plano['indice']:
                return False
            escritas = montar_escritas(plano, uid)
            if a.falhar_no_lote:
                # a prova da atomicidade: uma escrita a mais com uma condição que não vale; o commit inteiro cai
                escritas.append({'caminho': 'usuarios/%s/config/catalogo' % uid, 'dados': plano['indice'],
                                 'existe': indice is None})
            fs.commit(escritas)
            gravar_json(a.registro_ids, plano['registro_ids'])
            os.makedirs(a.chaves, exist_ok=True)
            for lid, reg in plano['registros_chaves'].items():
                gravar_json(os.path.join(a.chaves, '%s.json' % lid), reg)
            return True
        publicado = False
        enviados = []
        if a.publicar and not plano['recusas']:
            # primeiro os arquivos, cada um conferido depois de subir; o catálogo SÓ depois de todos
            enviados = st.subir(faltam) if faltam else []
            publicado = gravar_catalogo()
        if enviados:
            plano['linhas_arquivos'].append('- enviados e conferidos (tamanho e md5): %d arquivo(s), %d bytes' % (
                len(enviados), sum(e['tamanho'] for e in enviados)))
        destino = a.relatorio
        if publicado and a.pasta_publicacoes:
            destino = os.path.join(a.pasta_publicacoes, '%s_v%d.md' % (plano['indice']['publicadoEm'][:10], plano['indice']['versao']))
        print(relatorio(plano, publicado, destino, a.emulador))
        if plano['recusas']:
            print(marca + 'RECUSADO: %d motivo(s); nada foi gravado.' % len(plano['recusas']))
            return 2
        if st is not None:
            pendentes = [] if a.publicar else faltam
            print(marca + 'ARQUIVOS: %d enviado(s) ao Storage; %d a enviar (%d bytes); %d já estavam lá.' % (
                len(enviados), len(pendentes), sum(e['tamanho'] for e in pendentes), len(ja)))
        print(marca + ('PUBLICADO: versão %d, %d escrita(s) em %d commit.' % (plano['indice']['versao'], fs.escritas, fs.commits) if publicado else
                       ('RELATÓRIO: nada mudaria.' if not plano['indice'] else
                        'ENSAIO: nada foi gravado.' if a.ensaio else 'RELATÓRIO: sem --publicar, nada foi gravado.')))
        return 0
    except Recusa as e:
        print(marca + 'RECUSADO: %s' % e)
        return 2


if __name__ == '__main__':
    sys.exit(principal())
