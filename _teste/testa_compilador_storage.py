"""Prova das regras do Storage no COMPILADOR DE VERDADE do Firebase.

O emulador aceita regras que o console do Firebase marca com aviso: em
14/11/2026 o storage.rules do PR #229 passava no emulador e, colado no
console, mostrava "Unused function" e "Invalid variable name: request" (11
avisos, todos nas duas funções que nenhuma regra chamava). Esta prova manda o
storage.rules para a API do Firebase Rules, projects.test, SEM casos de teste:
assim a API só compila e devolve os avisos e erros ("issues"). Nada é
publicado: o projects.test não cria ruleset nem release.

    python _teste/testa_compilador_storage.py [--envenenado-funcoes-soltas]

O que se prova:
  1. o storage.rules compila no compilador de verdade com ZERO issues
     (qualquer aviso ou erro reprova);
  2. as funções guardadas como comentário (livroValido e pacoteValido) estão
     no arquivo, entre o INÍCIO e o FIM, e fora das regras ativas.

Veneno (a prova TEM de ver o defeito e passa dizendo que viu):
  --envenenado-funcoes-soltas  tira o comentário das funções guardadas, como
                               estava no PR #229: o compilador TEM de acusar
                               avisos, e todos nas linhas delas.

A credencial: o gcloud desta máquina, com a configuração separada em
%USERPROFILE%\\.gcloud-nath (CLOUDSDK_CONFIG), pelo `gcloud auth
print-access-token`, sempre com tempo limite (o gcloud que espera
reautenticação fica parado para sempre). O token só passa pela memória até o
pedido: nunca é impresso nem gravado. Sem o gcloud, sem a configuração ou com
a credencial vencida (no CI, por exemplo), a prova é PULADA: diz o motivo e
sai com 77, e o portão marca a conferência como pulada (INSTAVEL), nunca como
passou.

Saída no dialeto do portão: "N passaram, M falharam".
"""
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJETO = 'nw-apoio-educacional'
URL = 'https://firebaserules.googleapis.com/v1/projects/' + PROJETO + ':test'
TEMPO_GCLOUD = 60
PULADA = 77

SDK = os.environ.get('CLOUDSDK_ROOT') or os.path.join(
    os.environ.get('LOCALAPPDATA') or os.path.expanduser('~/AppData/Local'), 'Google', 'Cloud SDK', 'google-cloud-sdk')
PYTHON_SDK = os.environ.get('CLOUDSDK_PYTHON') or os.path.join(SDK, 'platform', 'bundledpython', 'python.exe')
GCLOUD_PY = os.path.join(SDK, 'lib', 'gcloud.py')
CONFIG = os.environ.get('CLOUDSDK_CONFIG_NATH') or os.path.join(
    os.environ.get('USERPROFILE') or os.path.expanduser('~'), '.gcloud-nath')

INICIO = '// INÍCIO das funções guardadas'
FIM = '// FIM das funções guardadas'

VENENOS = ['--envenenado-funcoes-soltas']
MODO = next((m for m in VENENOS if m in sys.argv[1:]), '')
DESCONHECIDOS = [a for a in sys.argv[1:] if a.startswith('--envenenado-') and a not in VENENOS]

passes = 0
falhas = 0
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass


def conf(rotulo, obtido, esperado):
    global passes, falhas
    ok = str(obtido) == str(esperado)
    if ok:
        passes += 1
    else:
        falhas += 1
    print(('  OK    ' if ok else '  FALHA ') + rotulo + ('' if ok else '  [obtido: ' + str(obtido)[:400] + ' | esperado: ' + str(esperado) + ']'))
    return ok


def fim():
    if MODO:
        print('\nmodo ' + MODO)
    print('\n%d passaram, %d falharam.' % (passes, falhas))
    sys.exit(1 if falhas or not passes else 0)


def pular(motivo):
    print('  PULADA: ' + motivo)
    print('  (a conferência no compilador do Firebase não rodou aqui; não é aprovação)')
    sys.exit(PULADA)


def descomenta(texto):
    """As linhas entre o INÍCIO e o FIM sem o "// " do começo: as funções
    guardadas voltam a ser regra ativa, como no PR #229."""
    saida, dentro = [], False
    for linha in texto.split('\n'):
        s = linha.strip()
        if s == INICIO:
            dentro = True
            continue
        if s == FIM:
            dentro = False
            continue
        if dentro:
            i = linha.index('//')
            resto = linha[i + 2:]
            linha = linha[:i] + (resto[1:] if resto.startswith(' ') else resto)
        saida.append(linha)
    return '\n'.join(saida)


def sem_comentarios(texto):
    return '\n'.join(l.split('//')[0] for l in texto.split('\n'))


def token():
    """O token de acesso da configuração separada, só em memória."""
    if not os.path.isdir(CONFIG):
        pular('falta a configuração do gcloud em ' + CONFIG)
    if not os.path.isfile(PYTHON_SDK) or not os.path.isfile(GCLOUD_PY):
        pular('falta o gcloud (procurei ' + GCLOUD_PY + ' e ' + PYTHON_SDK + ')')
    env = dict(os.environ)
    env['CLOUDSDK_CONFIG'] = CONFIG
    env['CLOUDSDK_PYTHON'] = PYTHON_SDK
    env['CLOUDSDK_CORE_DISABLE_PROMPTS'] = '1'
    try:
        r = subprocess.run([PYTHON_SDK, GCLOUD_PY, 'auth', 'print-access-token'], env=env,
                           stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                           timeout=TEMPO_GCLOUD)
    except subprocess.TimeoutExpired:
        pular('o gcloud não deu o token em %d s (deve estar pedindo reautenticação: gcloud auth login com CLOUDSDK_CONFIG=%s)' % (TEMPO_GCLOUD, CONFIG))
    t = r.stdout.decode('utf-8', 'replace').strip()
    if r.returncode != 0 or not t or ' ' in t:
        # o stderr do gcloud não leva o token; só a última linha, para dizer o motivo
        ultima = [l for l in r.stderr.decode('utf-8', 'replace').splitlines() if l.strip()][-1:] or ['sem mensagem']
        pular('o gcloud não deu o token (saída %d): %s' % (r.returncode, ultima[0][:200]))
    return t


def compila(fonte, t):
    corpo = json.dumps({'source': {'files': [{'name': 'storage.rules', 'content': fonte}]}}).encode('utf-8')
    pedido = urllib.request.Request(URL, data=corpo, method='POST', headers={
        'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json', 'x-goog-user-project': PROJETO})
    try:
        with urllib.request.urlopen(pedido, timeout=60) as r:
            return r.status, json.loads(r.read().decode('utf-8') or '{}')
    except urllib.error.HTTPError as e:
        return e.code, {'erro': e.read().decode('utf-8', 'replace')[:600]}


print('\n=== 0. A prova se confere ===')
conf('nenhum veneno desconhecido foi pedido', ','.join(DESCONHECIDOS), '')
with open(os.path.join(RAIZ, 'storage.rules'), encoding='utf-8') as f:
    REGRAS = f.read().replace('\r\n', '\n')
conf('o storage.rules marca o INÍCIO e o FIM das funções guardadas, uma vez cada',
     '%d|%d' % (REGRAS.count(INICIO), REGRAS.count(FIM)), '1|1')
ativas = sem_comentarios(REGRAS)
conf('nas regras ativas não há livroValido nem pacoteValido (só no comentário)',
     ('livroValido' in ativas) or ('pacoteValido' in ativas), False)
soltas = descomenta(REGRAS)
conf('tirado o comentário, as duas funções voltam a ser regra ativa',
     ('function livroValido(arquivo) {' in sem_comentarios(soltas)) and ('function pacoteValido(arquivo) {' in sem_comentarios(soltas)), True)
if falhas:
    fim()
FONTE = soltas if MODO == '--envenenado-funcoes-soltas' else REGRAS
# as linhas das funções no texto mandado, para saber onde caem os avisos do veneno
linhas = FONTE.split('\n')
faixa = set()
dentro = False
for n, l in enumerate(linhas, 1):
    if l.strip().startswith('function livroValido(') or l.strip().startswith('function pacoteValido('):
        dentro = True
    if dentro:
        faixa.add(n)
        if l.rstrip() == '    }':
            dentro = False

t = token()
print('\n=== 1. O compilador do Firebase (projects.test, sem casos: só compila, não publica) ===')
status, resposta = compila(FONTE, t)
t = None
conf('a API respondeu 200', status, 200)
if status != 200:
    print('    resposta: ' + json.dumps(resposta, ensure_ascii=False)[:600])
    fim()
issues = resposta.get('issues') or []
for i in issues:
    p = i.get('sourcePosition') or {}
    print('    %s linha %s coluna %s: %s' % (i.get('severity'), p.get('line'), p.get('column'), i.get('description')))
avisos = sum(1 for i in issues if i.get('severity') == 'WARNING')
erros = len(issues) - avisos
if MODO == '--envenenado-funcoes-soltas':
    fora = [i for i in issues if int((i.get('sourcePosition') or {}).get('line') or 0) not in faixa]
    conf('VENENO visto: o compilador acusa as funções soltas (%d issues: %d avisos, %d erros)' % (len(issues), avisos, erros),
         len(issues) > 0, True)
    conf('todas as issues do veneno caem nas linhas das duas funções', len(fora), 0)
else:
    conf('o storage.rules compila sem nenhuma issue (%d avisos, %d erros)' % (avisos, erros), len(issues), 0)
fim()
