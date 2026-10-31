"""Prova do tipo de fonte livros (C15.1, biblioteca/livros.py), sem navegador, com um veneno por trava.

    python biblioteca/_prova_livros.py
        sobre os livros sinteticos de biblioteca/_amostra/fazer_amostra_livros.py
        (tres PDF, um EPUB, um arquivo de 41 MB, uma linha sem arquivo e uma
        com arquivo sumido), o pacote gerado DUAS vezes.

    python biblioteca/_prova_livros.py --zip <pacote.zip>
        so a trava do manifesto, sobre um pacote de verdade (o do 6o ano, por
        exemplo), sem gerar nada.

Travas:
  teto         o livro de 41 MB e recusado PELO TETO, listado no relatorio
               (relatorio.json e relatorio.md, na secao do item E7) e nunca
               aberto; e a fronteira dos dois lados: 40 MB exatos cabem, um
               byte a mais nao. Veneno: com o teto desligado, a trava reprova.
  contas       todo livro da planilha com arquivo esta no pacote ou recusado
               com motivo; linha sem arquivo fica em "sem arquivo", e nada alem.
  manifesto    esquema 1, conteudo "livros", o zip e a lista `arquivos` nos
               dois sentidos, o hash de cada arquivo batendo com os bytes, o
               hash do livro igual ao da lista, os campos do livro (titulo,
               autoria, editora, edicao, ano, segmento, sumario, hash), o
               sumario dentro das paginas (PDF) ou dos capitulos (EPUB), os
               livros "stored" e o manifest primeiro. Um veneno por regra.
  sumario      a origem certa em cada livro da amostra: marcadores, mapa da
               orquestradora, nenhum (com a nota dizendo isso) e o nav do EPUB.
  tracos       nada de travessao ou meia-risca em texto que vai para a tela
               (a amostra traz um titulo com meia-risca de proposito).
  determinismo gerar duas vezes da o mesmo zip, byte a byte.
  linha de comando  --fonte livros gera o mesmo pacote; sem --planilha recusa;
               --planilha com outra fonte recusa.
Saida no dialeto do portao: "N verificacoes passaram, M falharam".
"""
import argparse
import contextlib
import copy
import hashlib
import io
import json
import os
import re
import shutil
import sys
import tempfile
import zipfile

import pymupdf

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
sys.path.insert(0, os.path.join(AQUI, '_amostra'))
import gerar_pacote  # noqa: E402
import livros  # noqa: E402
import fazer_amostra_livros as amostra  # noqa: E402

TRACOS = re.compile('[' + chr(0x2013) + chr(0x2014) + ']')
CAMPOS_DO_LIVRO = ('id', 'arquivo', 'formato', 'titulo', 'autoria', 'editora', 'edicao', 'ano', 'segmento',
                   'sumario', 'sumario_origem', 'hash', 'bytes')
ORIGENS = {'pdf': {'marcadores', 'mapa', 'nenhum'}, 'epub': {'navegacao', 'ncx', 'nenhum'}}


class Placar:
    def __init__(self):
        self.ok = 0
        self.falhas = 0

    def conferir(self, nome, erros, deve_reprovar=False):
        erros = list(erros or [])
        if deve_reprovar:
            passou = bool(erros)
            print('  %s  veneno: %s%s' % ('OK   ' if passou else 'FALHA', nome,
                                           '' if passou else ' (a trava nao reprovou)'))
            if not passou:
                self.falhas += 1
            else:
                self.ok += 1
            return passou
        if erros:
            self.falhas += 1
            print('  FALHA  %s' % nome)
            for e in erros[:8]:
                print('           %s' % e)
        else:
            self.ok += 1
            print('  OK     %s' % nome)
        return not erros


def sha(b):
    return 'sha256:' + hashlib.sha256(b).hexdigest()


# ------------------------------------------------------------------ travas

def trava_teto(rel, md, abertos, grande):
    erros = []
    teto = [r for r in rel['recusados'] if r.get('teto')]
    if not any(r['arquivo'] == 'grande/livro-grande.pdf' for r in teto):
        erros.append('o livro de 41 MB nao saiu recusado pelo teto')
    for r in teto:
        if not r.get('bytes') or r['bytes'] <= livros.TETO_BYTES:
            erros.append('recusado pelo teto sem passar do teto: %s (%s bytes)' % (r['arquivo'], r.get('bytes')))
        if '40 MB' not in r.get('motivo', '') or 'E7' not in r.get('motivo', ''):
            erros.append('o motivo nao diz o teto e o item E7: %r' % r.get('motivo'))
    secao = md.split('## Recusados pelo teto', 1)[-1].split('##', 1)[0] if '## Recusados pelo teto' in md else ''
    if 'grande/livro-grande.pdf' not in secao:
        erros.append('o relatorio.md nao lista o livro grande na secao do teto')
    if any(os.path.normcase(os.path.abspath(a)) == os.path.normcase(os.path.abspath(grande)) for a in abertos):
        erros.append('o livro acima do teto foi aberto antes de ser recusado')
    return erros


def trava_fronteira(f=None):
    f = f or livros.motivo_do_teto
    erros = []
    if f(livros.TETO_BYTES) is not None:
        erros.append('40 MB exatos foram recusados')
    if f(livros.TETO_BYTES + 1) is None:
        erros.append('40 MB e um byte passaram')
    return erros


def trava_contas(manifest, rel, planilha):
    erros = []
    linhas = livros.ler_planilha(planilha)
    com_arquivo = [l for l in linhas if (l.get('Arquivo') or '').strip()]
    no_pacote = len(manifest['livros'])
    if no_pacote + len(rel['recusados']) != len(com_arquivo):
        erros.append('%d com arquivo na planilha, %d no pacote e %d recusados'
                     % (len(com_arquivo), no_pacote, len(rel['recusados'])))
    if len(rel['sem_arquivo']) != len(linhas) - len(com_arquivo):
        erros.append('linhas sem arquivo: %d na planilha, %d no relatorio'
                     % (len(linhas) - len(com_arquivo), len(rel['sem_arquivo'])))
    if any(not r.get('motivo') for r in rel['recusados']):
        erros.append('recusado sem motivo')
    c = manifest['contagens']
    if (c['livros'], c['recusados'], c['sem_arquivo']) != (no_pacote, len(rel['recusados']), len(rel['sem_arquivo'])):
        erros.append('as contagens do manifest nao fecham com o relatorio: %r' % c)
    return erros


def conferir_manifesto(manifest, nomes_zip, bytes_de, infos=None):
    """As regras do manifesto de livros (CONTRATO 8j). bytes_de(nome) -> bytes do zip."""
    erros = []
    if manifest.get('esquema') != 1:
        erros.append('esquema %r' % manifest.get('esquema'))
    if manifest.get('conteudo') != 'livros':
        erros.append('conteudo %r' % manifest.get('conteudo'))
    if not re.fullmatch(r'livros-[a-z0-9][a-z0-9-]*', str(manifest.get('pacote'))):
        erros.append('pacote %r' % manifest.get('pacote'))
    lista = manifest.get('arquivos') or {}
    no_zip = [n for n in nomes_zip if n != 'manifest.json']
    for n in no_zip:
        if n not in lista:
            erros.append('no zip e fora da lista: %s' % n)
        if not re.fullmatch(r'livros/[a-z0-9][a-z0-9-]*\.(pdf|epub)', n):
            erros.append('nome fora do padrao: %s' % n)
    for n in lista:
        if n not in no_zip:
            erros.append('na lista e fora do zip: %s' % n)
        elif sha(bytes_de(n)) != lista[n]:
            erros.append('hash de %s nao bate com os bytes' % n)
    ids, citados = set(), set()
    for l in manifest.get('livros') or []:
        for c in CAMPOS_DO_LIVRO:
            if c not in l:
                erros.append('livro %s sem o campo %s' % (l.get('id'), c))
        if not l.get('titulo'):
            erros.append('livro %s sem titulo' % l.get('id'))
        if l.get('id') in ids:
            erros.append('id repetido: %s' % l.get('id'))
        ids.add(l.get('id'))
        if l.get('arquivo') != 'livros/%s.%s' % (l.get('id'), l.get('formato')):
            erros.append('livro %s com arquivo %r' % (l.get('id'), l.get('arquivo')))
        citados.add(l.get('arquivo'))
        if lista.get(l.get('arquivo')) != l.get('hash'):
            erros.append('o hash do livro %s nao e o da lista' % l.get('id'))
        if l.get('arquivo') in no_zip and len(bytes_de(l['arquivo'])) != l.get('bytes'):
            erros.append('bytes do livro %s nao batem' % l.get('id'))
        if l.get('bytes', 0) > livros.TETO_BYTES:
            erros.append('livro %s acima do teto dentro do pacote' % l.get('id'))
        if l.get('sumario_origem') not in ORIGENS.get(l.get('formato'), ()):
            erros.append('livro %s com origem de sumario %r' % (l.get('id'), l.get('sumario_origem')))
        if l.get('sumario_origem') == 'nenhum' and (l.get('sumario') or not l.get('sumario_nota')):
            erros.append('livro %s sem sumario e sem a nota que diz isso' % l.get('id'))
        for k, e in enumerate(l.get('sumario') or []):
            if not e.get('titulo') or e.get('n') != k + 1 or not isinstance(e.get('nivel'), int):
                erros.append('livro %s, entrada %d do sumario mal formada' % (l.get('id'), k + 1))
            if l.get('formato') == 'pdf':
                p, f = e.get('pagina'), e.get('pagina_fim')
                if not (isinstance(p, int) and 1 <= p <= (l.get('paginas') or 0)) or not (isinstance(f, int) and p <= f <= l['paginas']):
                    erros.append('livro %s, entrada %d fora das paginas (%r a %r de %r)' % (l.get('id'), k + 1, p, f, l.get('paginas')))
            else:
                cap = e.get('capitulo')
                if not (isinstance(cap, int) and 1 <= cap <= len((l.get('epub') or {}).get('espinha') or [])):
                    erros.append('livro %s, entrada %d fora dos capitulos (%r)' % (l.get('id'), k + 1, cap))
        if l.get('formato') == 'epub' and not (l.get('epub') or {}).get('espinha'):
            erros.append('EPUB %s sem espinha' % l.get('id'))
    for n in no_zip:
        if n not in citados:
            erros.append('arquivo que nenhum livro cita: %s' % n)
    if infos is not None:
        if not infos or infos[0].filename != 'manifest.json':
            erros.append('o manifest nao e o primeiro arquivo do zip')
        for i in infos:
            if i.filename.startswith('livros/') and i.compress_type != zipfile.ZIP_STORED:
                erros.append('%s comprimido; os livros vao stored' % i.filename)
    return erros


def manifesto_do_zip(caminho):
    z = zipfile.ZipFile(caminho)
    m = json.loads(z.read('manifest.json'))
    return z, m


def trava_sumario(manifest):
    erros = []
    por = {l['id']: l for l in manifest['livros']}
    esperado = {'livro-com-marcadores': 'marcadores', 'livro-sem-marcadores': 'mapa', 'livro-sem-sumario': 'nenhum',
                'livro-de-prova': 'navegacao'}
    for k, origem in esperado.items():
        if k not in por:
            erros.append('falta o livro %s' % k)
        elif por[k]['sumario_origem'] != origem:
            erros.append('%s com sumario de %r, esperado %r' % (k, por[k]['sumario_origem'], origem))
    m = por.get('livro-com-marcadores')
    if m:
        cap2 = [e for e in m['sumario'] if e['titulo'] == amostra.CAPITULOS_PDF[1]]
        if not cap2 or (cap2[0]['pagina'], cap2[0]['pagina_fim']) != (3, 4):
            erros.append('o capitulo 2 do livro com marcadores nao vai da pagina 3 a 4: %r' % cap2)
        if [e['nivel'] for e in m['sumario']] != [1, 1, 2, 1]:
            erros.append('niveis do sumario: %r' % [e['nivel'] for e in m['sumario']])
    s = por.get('livro-sem-marcadores')
    if s and [(e['titulo'], e['pagina']) for e in s['sumario']] != [('Unidade do mapa A', 1), ('Unidade do mapa B', 3)]:
        erros.append('o sumario do mapa: %r' % s['sumario'])
    if s and 'mapa_capitulos_prova.json' not in s.get('sumario_nota', ''):
        erros.append('a nota nao diz de que mapa veio o sumario')
    e = por.get('livro-de-prova')
    if e:
        if [x['capitulo'] for x in e['sumario']] != [1, 2, 2, 3] or e['sumario'][2].get('ancora') != 'meio':
            erros.append('o sumario do EPUB: %r' % e['sumario'])
        if e.get('paginas') is not None or e.get('capitulos') != 3:
            erros.append('o EPUB tem paginas %r e capitulos %r' % (e.get('paginas'), e.get('capitulos')))
    return erros


def trava_tracos(manifest):
    erros = []

    def andar(v, onde):
        if isinstance(v, str):
            if TRACOS.search(v):
                erros.append('%s: %r' % (onde, v[:80]))
        elif isinstance(v, dict):
            for k, x in v.items():
                andar(x, onde + '.' + k)
        elif isinstance(v, list):
            for i, x in enumerate(v):
                andar(x, '%s[%d]' % (onde, i))
    andar(manifest, 'manifest')
    return erros


# ------------------------------------------------------------------ rodada

def gerar_amostra(pasta, nome):
    return livros.gerar(os.path.join(pasta, 'Livros', 'livros_prova.csv'), 'prova', 1, os.path.join(pasta, nome),
                        mapas=os.path.join(pasta, 'Livros', 'mapa'), trabalho=os.path.join(pasta, 'trab-' + nome),
                        gerado_em='2026-10-30T10:00:00-03:00', commit='prova')


def amostra_rodada(temp, placar):
    c = amostra.fazer(temp, grande=True)
    # a meia-risca no titulo, de proposito: tem de sair trocada no manifest
    linhas = livros.ler_planilha(c['planilha'])
    for l in linhas:
        if l['Título'] == 'Livro de prova em EPUB':
            l['Título'] = 'Livro de prova ' + chr(0x2013) + ' EPUB'
    import csv
    with open(c['planilha'], 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=amostra.CABECALHO)
        w.writeheader()
        w.writerows(linhas)

    abertos = []
    original = pymupdf.open

    def espiao(*a, **k):
        if a:
            abertos.append(a[0])
        return original(*a, **k)
    pymupdf.open = espiao
    try:
        m1, r1, t1 = gerar_amostra(temp, 'p1')
    finally:
        pymupdf.open = original
    m2, r2, _ = gerar_amostra(temp, 'p2')
    with open(os.path.join(t1, 'relatorio.md'), encoding='utf-8') as f:
        md = f.read()
    grande = os.path.join(c['livros'], 'grande', 'livro-grande.pdf')
    print('amostra: %d livros no pacote, %d recusados (%d pelo teto), %d sem arquivo'
          % (m1['contagens']['livros'], len(r1['recusados']), m1['contagens']['recusados_teto'], len(r1['sem_arquivo'])))

    # o espiao enxerga: sem isto, "nunca aberto" passaria tambem com o espiao cego
    placar.conferir('livros: o espiao ve o PDF que entra sendo aberto',
                    [] if any(str(x).endswith('livro-com-marcadores.pdf') for x in abertos) else ['espiao cego: %r' % abertos])
    placar.conferir('livros: teto de 40 MB (o de 41 MB recusado, listado e nunca aberto)', trava_teto(r1, md, abertos, grande))
    placar.conferir('livros: fronteira do teto (40 MB cabem, 40 MB e um byte nao)', trava_fronteira())
    # veneno: o teto desligado. O livro grande deixa de sair pelo teto (sai como PDF que nao abre).
    guarda = livros.TETO_BYTES
    livros.TETO_BYTES = 10 ** 12
    try:
        _, rv, tv = gerar_amostra(temp, 'veneno-teto')
        with open(os.path.join(tv, 'relatorio.md'), encoding='utf-8') as f:
            mdv = f.read()
        placar.conferir('livros: teto desligado', trava_teto(rv, mdv, [], grande), deve_reprovar=True)
    finally:
        livros.TETO_BYTES = guarda
    placar.conferir('livros: fronteira com o teto em ">=" (40 MB exatos recusados)',
                    trava_fronteira(lambda n: 'x' if n >= livros.TETO_BYTES else None), deve_reprovar=True)
    placar.conferir('livros: fronteira com o teto em 41 MB',
                    trava_fronteira(lambda n: 'x' if n > livros.TETO_BYTES + 1024 * 1024 else None), deve_reprovar=True)

    # o teto por pacote (300 MB), dos dois lados, e o veneno de um teto que nao recusa nada
    def fronteira_do_pacote(f):
        e = []
        if f(livros.TETO_DO_PACOTE) is not None:
            e.append('300 MB exatos recusados')
        if f(livros.TETO_DO_PACOTE + 1) is None:
            e.append('300 MB e um byte passaram')
        elif 'materia' not in f(livros.TETO_DO_PACOTE + 1):
            e.append('a recusa nao manda separar por materia')
        return e
    placar.conferir('livros: teto por pacote (300 MB cabem, um byte a mais nao; manda separar por materia)',
                    fronteira_do_pacote(livros.motivo_do_pacote))
    placar.conferir('livros: teto por pacote desligado', fronteira_do_pacote(lambda n: None), deve_reprovar=True)

    placar.conferir('livros: contas (no pacote, recusado com motivo ou sem arquivo)', trava_contas(m1, r1, c['planilha']))
    sumiu = copy.deepcopy(r1)
    sumiu['recusados'] = sumiu['recusados'][1:]
    placar.conferir('livros: um recusado some do relatorio', trava_contas(m1, sumiu, c['planilha']), deve_reprovar=True)

    z, mz = manifesto_do_zip(r1['zip']['caminho'])
    with z:
        nomes = z.namelist()
        infos = z.infolist()
        cache = {n: z.read(n) for n in nomes}
    ler = cache.__getitem__
    placar.conferir('livros: manifesto (zip, lista, hash, campos, sumario dentro do livro, stored)',
                    conferir_manifesto(mz, nomes, ler, infos))
    if mz != m1:
        placar.conferir('livros: o manifest do zip e o devolvido pelo gerador', ['diferentes'])
    venenos = []
    v = copy.deepcopy(mz); del v['arquivos'][sorted(v['arquivos'])[0]]
    venenos.append(('arquivo do zip fora da lista', v, nomes))
    v = copy.deepcopy(mz); k = sorted(v['arquivos'])[0]; v['arquivos'][k] = 'sha256:' + '0' * 64
    venenos.append(('hash trocado na lista', v, nomes))
    v = copy.deepcopy(mz); v['livros'][0]['hash'] = 'sha256:' + '1' * 64
    venenos.append(('hash do livro diferente do da lista', v, nomes))
    v = copy.deepcopy(mz); del v['livros'][0]['autoria']
    venenos.append(('livro sem autoria', v, nomes))
    v = copy.deepcopy(mz)
    pdf = next(x for x in v['livros'] if x['sumario'] and x['formato'] == 'pdf')
    pdf['sumario'][0]['pagina'] = pdf['paginas'] + 1
    venenos.append(('sumario do PDF depois da ultima pagina', v, nomes))
    v = copy.deepcopy(mz)
    ep = next(x for x in v['livros'] if x['formato'] == 'epub')
    ep['sumario'][0]['capitulo'] = 99
    venenos.append(('sumario do EPUB fora dos capitulos', v, nomes))
    v = copy.deepcopy(mz)
    sem = next(x for x in v['livros'] if x['sumario_origem'] == 'nenhum')
    del sem['sumario_nota']
    venenos.append(('sumario vazio sem a nota', v, nomes))
    v = copy.deepcopy(mz); v['livros'] = v['livros'][1:]
    venenos.append(('arquivo que nenhum livro cita', v, nomes))
    v = copy.deepcopy(mz); v['conteudo'] = None
    venenos.append(('manifest sem conteudo livros', v, nomes))
    for rot, vm, ns in venenos:
        placar.conferir('livros: manifesto com ' + rot, conferir_manifesto(vm, ns, ler, infos), deve_reprovar=True)
    infos_ruins = list(reversed(infos))
    placar.conferir('livros: manifest fora do primeiro lugar', conferir_manifesto(mz, nomes, ler, infos_ruins),
                    deve_reprovar=True)

    placar.conferir('livros: sumario de cada origem (marcadores, mapa, nenhum, nav do EPUB)', trava_sumario(m1))
    v = copy.deepcopy(m1)
    next(x for x in v['livros'] if x['id'] == 'livro-sem-marcadores')['sumario_origem'] = 'nenhum'
    placar.conferir('livros: o mapa ignorado', trava_sumario(v), deve_reprovar=True)

    # o "Start" do calibre: uma entrada so, no comeco, vira sumario vazio com a nota
    so_comeco = amostra.epub(os.path.join(temp, 'so-comeco', 'livro.epub'), so_o_comeco=True)
    info = livros.ler_epub(so_comeco)
    placar.conferir('livros: EPUB com sumario so do comeco vira sumario vazio, dito na nota',
                    [] if (info['sumario'], info['sumario_origem']) == ([], 'nenhum') and 'uma entrada só' in info.get('sumario_nota', '')
                    else ['%r %r' % (info['sumario_origem'], info['sumario'])])

    placar.conferir('livros: nada de travessao ou meia-risca no manifest', trava_tracos(m1))
    titulo_epub = next(x['titulo'] for x in m1['livros'] if x['formato'] == 'epub')
    if titulo_epub != 'Livro de prova - EPUB':
        placar.conferir('livros: a meia-risca do titulo virou hifen', ['titulo %r' % titulo_epub])
    v = copy.deepcopy(m1); v['livros'][0]['titulo'] += ' ' + chr(0x2014)
    placar.conferir('livros: travessao num titulo', trava_tracos(v), deve_reprovar=True)

    with open(r1['zip']['caminho'], 'rb') as f1, open(r2['zip']['caminho'], 'rb') as f2:
        iguais = sha(f1.read()) == sha(f2.read())
    placar.conferir('livros: determinismo (duas geracoes, o mesmo zip)', [] if iguais else ['zips diferentes'])

    # linha de comando: a mesma geracao pelo gerar_pacote.py --fonte livros. A
    # versao do PyMuPDF nao muda o pacote de livros (nada e recortado), e o
    # portao roda com outra; a guarda de versao e contornada so aqui.
    guarda_versao = gerar_pacote.confere_versao_do_pymupdf
    gerar_pacote.confere_versao_do_pymupdf = lambda versao=None: None
    erros_cli = []
    # o que a linha de comando imprime (o resumo e o uso) fica fora da saida da prova
    silencio = io.StringIO()
    calar = contextlib.ExitStack()
    calar.enter_context(contextlib.redirect_stdout(silencio))
    calar.enter_context(contextlib.redirect_stderr(silencio))
    try:
        saida = os.path.join(temp, 'p-cli')
        gerar_pacote.principal(['--fonte', 'livros', '--planilha', c['planilha'], '--rotulo', 'prova', '--versao', '1',
                                '--saida', saida, '--mapas', c['mapas'], '--trabalho', os.path.join(temp, 'trab-cli'),
                                '--gerado-em', '2026-10-30T10:00:00-03:00', '--commit', 'prova'])
        with open(os.path.join(saida, 'livros-prova-v1.zip'), 'rb') as f3, open(r1['zip']['caminho'], 'rb') as f1:
            if sha(f3.read()) != sha(f1.read()):
                erros_cli.append('o pacote da linha de comando e diferente do da funcao')
        for rot, argv in (('--fonte livros sem --planilha', ['--fonte', 'livros', '--rotulo', 'x', '--versao', '1', '--saida', saida]),
                          ('--planilha com --fonte portal', ['--pdfs', temp, '--serie', '9ano', '--curadoria', temp,
                                                             '--versao', '1', '--saida', saida, '--planilha', c['planilha']]),
                          ('--curadoria com --fonte livros', ['--fonte', 'livros', '--planilha', c['planilha'], '--rotulo', 'x',
                                                              '--versao', '1', '--saida', saida, '--curadoria', temp])):
            try:
                gerar_pacote.principal(argv)
                erros_cli.append('%s nao foi recusado' % rot)
            except SystemExit as e:
                if not e.code:
                    erros_cli.append('%s saiu sem erro' % rot)
    finally:
        calar.close()
        gerar_pacote.confere_versao_do_pymupdf = guarda_versao
    placar.conferir('livros: linha de comando (--fonte livros, e as recusas)', erros_cli)


def principal():
    ap = argparse.ArgumentParser()
    ap.add_argument('--zip')
    a = ap.parse_args()
    placar = Placar()
    temp = tempfile.mkdtemp(prefix='prova_livros_')
    try:
        if a.zip:
            z, m = manifesto_do_zip(a.zip)
            with z:
                nomes, infos = z.namelist(), z.infolist()
                print('pacote %s: %d livros' % (m.get('pacote'), len(m.get('livros') or [])))
                placar.conferir('livros: manifesto', conferir_manifesto(m, nomes, z.read, infos))
                placar.conferir('livros: nada de travessao ou meia-risca no manifest', trava_tracos(m))
        else:
            amostra_rodada(temp, placar)
    finally:
        shutil.rmtree(temp, ignore_errors=True)
    print('%d verificacoes passaram, %d falharam' % (placar.ok, placar.falhas))
    sys.exit(1 if placar.falhas else 0)


if __name__ == '__main__':
    principal()
