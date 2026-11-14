"""Prova do envio retomável do publicador (biblioteca/publicar_catalogo.py,
classe Storage) contra um Cloud Storage FALSO, um http.server local numa
thread. O emulador do Firebase não faz o protocolo de pedaços (fecha o objeto
no primeiro PUT, ignora o ifGenerationMatch e não responde à consulta de
estado); este servidor faz, e conta cada pedido, para a prova ver o que o
cliente mandou.

    python biblioteca/_prova_envio_retomavel.py [--envenenado-...]

O que se prova (arquivos sintéticos de ~700 KiB, pedaços de 256 KiB):
  1. (seção 2) o envio em três pedaços monta os bytes certos, nos começos certos, e a
     abertura leva ifGenerationMatch=0;
  2. (seção 1, a primeira) o 308 parcial (Range: bytes=0-N) faz o pedaço seguinte começar em N+1;
  3. o 308 sem Range recomeça do 0;
  4. a conexão que cai no meio do pedaço leva à consulta de estado
     (Content-Range: bytes */total) e à retomada de onde o servidor parou;
  5. o 410 (a sessão venceu) abre uma sessão nova e sobe do zero;
  6. o 412 na abertura (o objeto já existe, pela precondição) conta como
     "existia", e o objeto que já está lá e confere não abre envio nenhum;
  7. o 308 que nunca avança termina numa recusa clara ("não avança"), em
     tempo curto, e não gira para sempre;
  8. o md5 errado depois de subir é recusa, e a mensagem diz que o objeto
     FICA no Storage e tem de ser apagado;
  9. os pacotes: x-v09.zip e x-v9.zip na mesma pasta são recusados dizendo
     que estão na mesma pasta, com os dois nomes; o .zip fora do padrão é
     listado pelo nome, com a contagem;
 10. o índice do catálogo acima de 900 KiB é recusado antes do commit.

Venenos (cada um TEM de ser visto; a prova passa dizendo que viu):
  --envenenado-retoma-no-byte-errado  o 308 parcial retoma em N, e não em N+1 (2);
  --envenenado-308-sem-limite         o 308 que não avança não gasta tentativa (7);
  --envenenado-sem-precondicao        a abertura sai sem ifGenerationMatch=0 (1);
  --envenenado-reenvia                o objeto que já está lá abre um envio (6).

Saída no dialeto do portão: "N verificacoes passaram, M falharam".
"""
import base64
import hashlib
import http.client
import http.server
import json
import os
import sys
import tempfile
import threading
import time
import types
import urllib.parse

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
PUBLICADOR = os.path.join(AQUI, 'publicar_catalogo.py')

VENENOS = {
    '--envenenado-retoma-no-byte-errado': ('    return int(m.group(1)) + 1 if m else 0\n', '    return int(m.group(1)) if m else 0\n'),
    '--envenenado-308-sem-limite': ('                    if novo > feito:\n', '                    if True:\n'),
    '--envenenado-sem-precondicao': ("'name': e['caminho'], 'ifGenerationMatch': '0'}", "'name': e['caminho']}"),
    '--envenenado-reenvia': ('            if existente is not None:\n', '            if False:\n'),
}
MODO = next((m for m in VENENOS if m in sys.argv[1:]), '')
DESCONHECIDOS = [x for x in sys.argv[1:] if x.startswith('--envenenado-') and x not in VENENOS]

passes, falhas, vistos = 0, 0, 0


def conf(rotulo, obtido, esperado):
    global passes, falhas
    ok = str(obtido) == str(esperado)
    if ok:
        passes += 1
    else:
        falhas += 1
    print(('  OK    ' if ok else '  FALHA ') + rotulo + ('' if ok else '  [obtido: %s | esperado: %s]' % (str(obtido)[:400], esperado)))
    return ok


def caso(rotulo, obtido, esperado, veneno):
    """Um caso que o veneno `veneno` vira: no modo dele, o esperado é NÃO bater."""
    global passes, falhas, vistos
    if MODO == veneno:
        if str(obtido) != str(esperado):
            passes += 1
            vistos += 1
            print('  OK    VENENO visto: ' + rotulo + '  [obtido: %s]' % str(obtido)[:200])
        else:
            falhas += 1
            print('  FALHA VENENO NÃO visto: ' + rotulo)
        return
    conf(rotulo, obtido, esperado)


# ------------------------------------------------------------------ o publicador, com o veneno por troca de texto
texto = open(PUBLICADOR, encoding='utf-8').read().replace('\r\n', '\n')
ANCORAS = {m: texto.count(de) for m, (de, _) in VENENOS.items()}
if MODO:
    texto = texto.replace(VENENOS[MODO][0], VENENOS[MODO][1])
P = types.ModuleType('publicar_catalogo')
P.__file__ = PUBLICADOR
exec(compile(texto, PUBLICADOR, 'exec'), P.__dict__)


# ------------------------------------------------------------------ o Cloud Storage falso
class Falso:
    def __init__(self):
        self.objetos = {}      # nome: {dados, contentType, metadata, md5}
        self.sessoes = {}      # id: {nome, contentType, metadata, total, recebido, puts}
        self.pedidos = []      # (metodo, caminho com a query, Content-Range)
        self.cenario = 'normal'
        self.md5_errado = False
        self.n = 0
        self.trava = threading.Lock()

    def zerar(self, cenario='normal'):
        self.sessoes, self.pedidos, self.cenario, self.md5_errado = {}, [], cenario, False

    def aberturas(self):
        return [p for p in self.pedidos if p[0] == 'POST']

    def comecos(self):
        return [int(p[2].split(' ')[1].split('-')[0]) for p in self.pedidos if p[0] == 'PUT' and p[2] and '*' not in p[2]]

    def consultas(self):
        return [p for p in self.pedidos if p[0] == 'PUT' and p[2] and '*/' in p[2]]


F = Falso()
B64 = lambda b: base64.b64encode(hashlib.md5(b).digest()).decode('ascii')


class Manipulador(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _json(self, st, corpo, cab=None):
        dados = json.dumps(corpo).encode('utf-8')
        self.send_response(st)
        for k, v in (cab or {}).items():
            self.send_header(k, v)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(dados)))
        self.end_headers()
        self.wfile.write(dados)

    def _vazio(self, st, cab=None):
        self.send_response(st)
        for k, v in (cab or {}).items():
            self.send_header(k, v)
        self.send_header('Content-Length', '0')
        self.end_headers()

    def _corpo(self):
        n = int(self.headers.get('Content-Length') or 0)
        return self.rfile.read(n) if n else b''

    def do_GET(self):
        F.pedidos.append(('GET', self.path, ''))
        nome = urllib.parse.unquote(self.path.split('/o/', 1)[1].split('?')[0])
        o = F.objetos.get(nome)
        if not o:
            return self._json(404, {'error': {'code': 404}})
        return self._json(200, {'name': nome, 'size': str(len(o['dados'])), 'contentType': o['contentType'],
                                'md5Hash': o['md5'], 'metadata': o['metadata']})

    def do_POST(self):
        F.pedidos.append(('POST', self.path, ''))
        q = dict(urllib.parse.parse_qsl(urllib.parse.urlsplit(self.path).query))
        corpo = json.loads(self._corpo().decode('utf-8') or '{}')
        nome = q.get('name')
        if q.get('ifGenerationMatch') == '0' and nome in F.objetos:
            return self._vazio(412)
        F.n += 1
        sid = 'sessao%d' % F.n
        F.sessoes[sid] = {'nome': nome, 'contentType': corpo.get('contentType'), 'metadata': corpo.get('metadata') or {},
                          'total': int(self.headers.get('X-Upload-Content-Length')), 'recebido': bytearray(), 'puts': 0}
        local = 'https://storage.googleapis.com/upload/storage/v1/b/b/o?uploadType=resumable&upload_id=' + sid
        return self._vazio(200, {'Location': local})

    def _faixa(self, s):
        n = len(s['recebido'])
        return {'Range': 'bytes=0-%d' % (n - 1)} if n else {}

    def do_PUT(self):
        faixa = self.headers.get('Content-Range') or ''
        F.pedidos.append(('PUT', self.path, faixa))
        sid = dict(urllib.parse.parse_qsl(urllib.parse.urlsplit(self.path).query)).get('upload_id')
        s = F.sessoes.get(sid)
        if faixa.startswith('bytes */'):
            self._corpo()
            if not s:
                return self._vazio(410)
            return self._vazio(308, self._faixa(s))
        if not s:
            self._corpo()
            return self._vazio(410)
        s['puts'] += 1
        inicio = int(faixa.split(' ')[1].split('-')[0])
        if F.cenario == 'cai' and s['puts'] == 2:
            # a conexão cai no meio do pedaço: lê um pedaço do corpo e fecha, sem resposta
            self.rfile.read(1000)
            self.close_connection = True
            self.connection.close()
            return
        dados = self._corpo()
        if s['puts'] > 40:
            return self._vazio(400)   # o freio do servidor falso: o cliente que gira para sempre bate aqui
        if inicio != len(s['recebido']):
            return self._json(400, {'error': 'o pedaço começa em %d, e o servidor tem %d' % (inicio, len(s['recebido']))})
        if F.cenario == '410' and s['puts'] == 1 and F.n == 1:
            del F.sessoes[sid]
            return self._vazio(410)
        if F.cenario == 'sem_range' and s['puts'] == 1:
            return self._vazio(308)
        if F.cenario == 'nunca_avanca':
            return self._vazio(308, self._faixa(s))
        if F.cenario == 'parcial' and s['puts'] == 1:
            s['recebido'] += dados[:100000]
            return self._vazio(308, self._faixa(s))
        s['recebido'] += dados
        if len(s['recebido']) < s['total']:
            return self._vazio(308, self._faixa(s))
        b = bytes(s['recebido'])
        F.objetos[s['nome']] = {'dados': b, 'contentType': s['contentType'], 'metadata': s['metadata'],
                                'md5': B64(b + b'x') if F.md5_errado else B64(b)}
        return self._json(200, {'name': s['nome'], 'size': str(len(b))})


servidor = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Manipulador)
PORTA = servidor.server_address[1]
threading.Thread(target=servidor.serve_forever, daemon=True).start()

TMP = tempfile.mkdtemp(prefix='prova_envio_')
UID = 'donaDeTeste'


def arquivo(rotulo, n=700 * 1024):
    base = hashlib.sha256(rotulo.encode()).digest()
    dados = (base * (n // len(base) + 1))[:n]
    caminho = os.path.join(TMP, rotulo + '.pdf')
    with open(caminho, 'wb') as f:
        f.write(dados)
    sha = hashlib.sha256(dados).hexdigest()
    return dados, {'rotulo': 'livro ' + rotulo, 'caminho': P.caminho_no_storage(UID, sha, 'pdf'), 'disco': caminho,
                   'sha256': sha, 'tamanho': len(dados), 'contentType': 'application/pdf'}


def cliente():
    s = P.Storage('b', 'token-de-teste', UID)
    s.conexao = lambda: http.client.HTTPConnection('127.0.0.1', PORTA, timeout=10)
    s.espera = 0
    s.pedaco = 256 * 1024
    return s


def tenta(fazer):
    try:
        return 'ok:%s' % (fazer(),)
    except P.Recusa as e:
        return 'recusa:%s' % e


PEDACO = 256 * 1024


def fim():
    servidor.shutdown()
    if MODO:
        conf('o veneno pedido foi visto', vistos > 0, True)
        print('\nmodo ' + MODO)
    print('\n%d verificacoes passaram, %d falharam' % (passes, falhas))
    sys.exit(1 if falhas or not passes else 0)


print('\n=== 0. A prova se confere ===')
conf('nenhum veneno desconhecido foi pedido', ','.join(DESCONHECIDOS), '')
for m, n in sorted(ANCORAS.items()):
    conf('a âncora de %s aparece uma vez só no publicador' % m, n, 1)

print('\n=== 1. O 308 parcial retoma no byte seguinte ===')
F.zerar('parcial')
dados, e = arquivo('parcial')
r = tenta(lambda: cliente()._enviar(e))
caso('o envio termina, com os bytes certos', '%s|%s' % (r, F.objetos.get(e['caminho'], {}).get('dados') == dados), 'ok:enviado|True',
     '--envenenado-retoma-no-byte-errado')
caso('o segundo pedaço começa em 100000 (o Range dizia 0-99999)', F.comecos()[:2], [0, 100000], '--envenenado-retoma-no-byte-errado')

if MODO == '--envenenado-retoma-no-byte-errado':
    fim()

print('\n=== 2. Três pedaços, os bytes certos, e a precondição na abertura ===')
F.zerar('normal')
dados, e = arquivo('normal')
r = tenta(lambda: cliente()._enviar(e))
conf('enviado', r, 'ok:enviado')
conf('os bytes no servidor são os do arquivo', F.objetos.get(e['caminho'], {}).get('dados') == dados, True)
conf('os pedaços começaram em 0, 256 KiB e 512 KiB', F.comecos(), [0, PEDACO, 2 * PEDACO])
q = dict(urllib.parse.parse_qsl(urllib.parse.urlsplit(F.aberturas()[0][1]).query)) if F.aberturas() else {}
caso('a abertura leva ifGenerationMatch=0', q.get('ifGenerationMatch'), '0', '--envenenado-sem-precondicao')
conf('e o tipo e o sha256 nos metadados', [F.objetos.get(e['caminho'], {}).get('contentType'), F.objetos.get(e['caminho'], {}).get('metadata', {}).get('sha256') == e['sha256']],
     ['application/pdf', True])

print('\n=== 3. O 308 sem Range recomeça do 0 ===')
F.zerar('sem_range')
dados, e = arquivo('sem-range')
r = tenta(lambda: cliente()._enviar(e))
conf('o envio termina, com os bytes certos', '%s|%s' % (r, F.objetos.get(e['caminho'], {}).get('dados') == dados), 'ok:enviado|True')
conf('o segundo PUT começou do 0 de novo', F.comecos()[:2], [0, 0])

print('\n=== 4. A conexão que cai no meio: consulta de estado e retomada ===')
F.zerar('cai')
dados, e = arquivo('cai')
r = tenta(lambda: cliente()._enviar(e))
conf('o envio termina, com os bytes certos', '%s|%s' % (r, F.objetos.get(e['caminho'], {}).get('dados') == dados), 'ok:enviado|True')
conf('depois da queda, houve uma consulta de estado (bytes */total)', [p[2] for p in F.consultas()], ['bytes */%d' % len(dados)])
conf('e a retomada foi no pedaço que caiu (256 KiB), na mesma sessão', '%s|%d' % (F.comecos(), len(F.aberturas())), '%s|1' % [0, PEDACO, PEDACO, 2 * PEDACO])

print('\n=== 5. O 410 abre uma sessão nova ===')
F.zerar('410')
F.n = 0
dados, e = arquivo('quatrocentos-e-dez')
r = tenta(lambda: cliente()._enviar(e))
conf('o envio termina, com os bytes certos', '%s|%s' % (r, F.objetos.get(e['caminho'], {}).get('dados') == dados), 'ok:enviado|True')
conf('duas aberturas, e a segunda sobe do 0', '%d|%s' % (len(F.aberturas()), F.comecos()), '2|%s' % [0, 0, PEDACO, 2 * PEDACO])

print('\n=== 6. O 412 na abertura conta como "existia"; o que confere não abre envio ===')
F.zerar('normal')
dados, e = arquivo('existente')
F.objetos[e['caminho']] = {'dados': dados, 'contentType': 'application/pdf', 'metadata': {'sha256': e['sha256']}, 'md5': B64(dados)}
r = tenta(lambda: cliente()._enviar(e))
caso('com o objeto lá, a abertura recebe 412 e o envio diz "existia"', r, 'ok:existia', '--envenenado-sem-precondicao')
F.zerar('normal')
s = cliente()
ja, faltam, problemas = s.situacao([dict(e)])
enviados, existiam = s.subir(faltam) if faltam else ([], [])
caso('o objeto que já está lá e confere não abre envio nenhum', '%d|%d|%d|%d' % (len(ja), len(F.aberturas()), len(enviados), len(problemas)), '1|0|0|0',
     '--envenenado-reenvia')
if MODO == '--envenenado-reenvia':
    fim()

print('\n=== 7. O 308 que nunca avança termina numa recusa clara ===')
F.zerar('nunca_avanca')
dados, e = arquivo('nunca-avanca')
t0 = time.time()
r = tenta(lambda: cliente()._enviar(e))
caso('recusa dizendo que não avança, em até %d PUTs' % P.TENTATIVAS, '%s|%s' % ('não avança' in r, len(F.comecos()) <= P.TENTATIVAS), 'True|True',
     '--envenenado-308-sem-limite')
conf('e não demorou (menos de 20 s)', time.time() - t0 < 20, True)
conf('nenhum objeto foi fechado', e['caminho'] in F.objetos, False)

print('\n=== 8. O md5 errado depois de subir: recusa, e o objeto fica e tem de ser apagado ===')
F.zerar('normal')
F.md5_errado = True
dados, e = arquivo('md5-errado')
r = tenta(lambda: cliente().subir([dict(e)]))
conf('recusa pelo md5', r.startswith('recusa:') and 'o md5 não é o do arquivo' in r, True)
conf('a mensagem diz que o objeto fica no Storage e tem de ser apagado', ('FICA no Storage' in r) and ('apague-o no console do Firebase (Storage) e rode de novo' in r), True)
conf('e que o catálogo não foi gravado', 'o catálogo NÃO foi gravado' in r, True)
F.zerar('normal')
r = tenta(lambda: cliente().situacao([dict(e)]))
conf('a rodada seguinte vê o objeto errado e manda apagar', ('bytes diferentes' in r) and ('apague-o no console' in r), True)

print('\n=== 9. Os nomes dos pacotes ===')
pasta = os.path.join(TMP, 'pacotes')
os.makedirs(pasta)
for nome, conteudo in [('x-v09.zip', b'a' * 10), ('x-v9.zip', b'b' * 10), ('y-v1.zip', b'c' * 10), ('Pacote Velho.zip', b'd' * 10),
                       ('z_v2.zip', b'e' * 10), ('notas.txt', b'f')]:
    with open(os.path.join(pasta, nome), 'wb') as f:
        f.write(conteudo)
pacotes, recusas, linhas = P.pacotes_das_pastas([pasta])
conf('x-v09 e x-v9 na mesma pasta: recusa dizendo isso, com os dois nomes',
     recusas, ['o pacote x v9 aparece em 2 arquivos, na mesma pasta (x-v09.zip, x-v9.zip): deixe um só'])
conf('o .zip fora do padrão é listado pelo nome, com a contagem (o .txt não conta)',
     [l for l in linhas if 'fora do padrão' in l], ['- pacotes: 2 .zip fora do padrão <nome>-v<N>.zip, ignorado(s): Pacote Velho.zip, z_v2.zip'])
conf('o pacote certo continua, com o md5', [(p['nome'], p['versao'], bool(p.get('md5'))) for p in pacotes], [('y', 1, True)])

print('\n=== 10. O índice acima de 900 KiB é recusado antes do commit ===')
grande = {'versao': 2, 'publicadoEm': 'x', 'gerador': 'x',
          'livros': {'livro-%04d' % i: {'sha256': 'a' * 64, 'metaHash': 'b' * 64, 'nota': 'n' * 3000} for i in range(320)}}
r = tenta(lambda: P.montar_escritas({'docs': [], 'indice': grande}, UID))
conf('recusa, dizendo o tamanho e o limite', r.startswith('recusa:') and 'acima de 921600 (900 KiB' in r, True)
pequeno = dict(grande, livros={k: v for k, v in list(grande['livros'].items())[:120]})
conf('o índice de 120 livros passa (o atual tem 79, e vêm uns 38)', tenta(lambda: len(P.montar_escritas({'docs': [], 'indice': pequeno}, UID))), 'ok:1')

fim()
