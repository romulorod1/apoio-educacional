"""Prova do passe do gabarito (C15.5, biblioteca/livros.py), sem navegador, com venenos.

    python biblioteca/_prova_gabaritos.py

O passe le o texto de cada pagina (ou parte do EPUB), acha os titulos de
respostas e os numeros de capitulo dentro deles, e casa cada bloco de
respostas com o capitulo do mapa. A trava central e a do CASAMENTO, medida
pelo texto e nao pelo gerador: o gabarito proposto para um capitulo comeca na
marca do PROPRIO capitulo ("Capitulo 7" para o capitulo 7 do livro), e nenhum
capitulo leva pagina que so tem respostas de outro.

Travas:
  casamento    volume que comeca no capitulo 7 (o "Capitulo 7" das respostas e o
               PRIMEIRO capitulo do mapa), respostas no fim do livro; a marca no
               alto da pagina abre o capitulo ali, a do meio da pagina divide a
               pagina com o anterior. Venenos: casar pela ordem do mapa quando o
               livro numera os capitulos; casar com o capitulo seguinte.
  variacoes    no fim do proprio capitulo (sem numero: casa pelo lugar); quadro
               de respostas no MEIO do capitulo (ignorado, nunca casado); so as
               impares (marcado); so no manual do professor (vazio, e a nota diz);
               numeracao que recomeca (nao fecha); "Resposta pessoal" nao e
               titulo; EPUB com uma parte para dois capitulos (nao fecha). Venenos:
               o fim do capitulo aceito em qualquer lugar; "Resposta pessoal" como
               titulo.
  sem texto    sem camada de texto: vazio, menos confiavel, e a nota diz; com
               texto em parte do livro, a certeza baixa. Veneno: a certeza que
               nao baixa.
  pacote       o livro sintetico com a secao "Respostas dos exercicios" no fim
               (biblioteca/_amostra/fazer_amostra_livros.py, fazer_gabarito):
               cada capitulo com a pagina das suas respostas, certeza alta; o
               livro sem respostas com "sem gabarito localizado"; a forma do
               gabarito no manifest (dentro do livro, certeza e como conhecidos,
               origem e nota); e a planilha de conferencia por livro, que guarda
               o que a sessao escreveu ao regerar. Venenos: gabarito fora do
               livro; origem "auto" sem gabarito nenhum.
Saida no dialeto do portao: "N verificacoes passaram, M falharam".
"""
import copy
import csv
import json
import os
import shutil
import sys
import tempfile
import zipfile

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
sys.path.insert(0, os.path.join(AQUI, '_amostra'))
import livros  # noqa: E402
import fazer_amostra_livros as amostra  # noqa: E402
from _prova_livros import Placar  # noqa: E402


def caps(*faixas, numeros=None):
    """Capitulos do mapa: faixas (ini, fim), com o numero do livro (ou None)."""
    numeros = numeros or [None] * len(faixas)
    return [{'n': i + 1, 'titulo': 'Capítulo do mapa %d' % (i + 1), 'ini': a, 'fim': b, 'numero': numeros[i]}
            for i, (a, b) in enumerate(faixas)]


def pag(*linhas):
    return '\n'.join(linhas)


CONTEUDO = 'Texto do capítulo, com explicação e exercícios para resolver em casa.'


def livro_do_cap2():
    """Um segundo volume: os capitulos 2, 3 e 4 do livro (paginas 1-2, 3-4,
    5-6) e as respostas no fim. O 2 abre a pagina 7; o 3 comeca no MEIO da
    pagina 8 (que tem o fim do 2); o 4 abre a pagina 9, em romano. Casar pela
    ordem do mapa poria o "Capitulo 2" das respostas no segundo capitulo do
    mapa, que e o 3 do livro."""
    textos = [pag('Capítulo %d' % (2 + i // 2), CONTEUDO) for i in range(6)]
    textos += [pag('Respostas dos exercícios', '201', 'Capítulo 2', '1. 12', '2. 15', '3. 18'),
               pag('Respostas dos exercícios', '202', '4. 20', '5. 21', 'Capítulo 3', '1. 3/4', '2. 5/6'),
               pag('Respostas dos exercícios', '203', 'CAPÍTULO IV', '1. 90 graus', '2. 45 graus')]
    return textos, caps((1, 2), (3, 4), (5, 6), numeros=[2, 3, 4])


def trava_casamento(r, textos, capitulos, formato='pdf'):
    """A PROPRIEDADE, pelo texto: o gabarito de cada capitulo comeca numa pagina
    com a marca do proprio capitulo, e toda pagina do gabarito e da secao."""
    erros = []
    secao = {u for a, b in r['secoes'] for u in range(a, b + 1)}
    por_n = {c['n']: c for c in capitulos}
    for n, g in r['por_capitulo'].items():
        c = por_n[n]
        num = c['numero'] if c['numero'] is not None else n
        primeira = g['faixas'][0][0]
        marcas = [livros.numero_de(m.group(2)) for l in livros.linhas_de(textos[primeira - 1])
                  for m in [livros.MARCA_DE_CAPITULO.match(l)] if m]
        if g['como'] == 'fim_do_livro' and num not in marcas:
            erros.append('o capítulo %d (no livro %s) ganhou o gabarito que começa na %s, que só tem as marcas %r'
                         % (n, num, primeira, marcas))
        for a, b in g['faixas']:
            for u in range(a, b + 1):
                # o do fim do capitulo nao entra nas secoes: as secoes saem do capitulo exportado
                if u not in secao and g['como'] == 'fim_do_livro':
                    erros.append('o capítulo %d ganhou a %d, fora da seção de respostas' % (n, u))
                if u in secao and g['como'] == 'fim_do_capitulo':
                    erros.append('o gabarito do fim do capítulo %d (a %d) entrou nas seções, e sairia do capítulo exportado' % (n, u))
            if g['como'] == 'fim_do_capitulo' and not (c['ini'] < a and b <= c['fim']):
                erros.append('o capítulo %d ganhou o gabarito de fim de capítulo %r fora dele (%d a %d)' % (n, [a, b], c['ini'], c['fim']))
    return erros


def esperado(r, mapa):
    """Confere {n: faixas} exatamente."""
    obtido = {n: g['faixas'] for n, g in r['por_capitulo'].items()}
    return [] if obtido == mapa else ['esperado %r, veio %r' % (mapa, obtido)]


def casos(placar):
    # ---------------------------------------------------------- casamento
    textos, capitulos = livro_do_cap2()
    r = livros.propor_gabaritos(textos, capitulos)
    placar.conferir('gabarito: volume que começa no capítulo 2, respostas no fim (o "Capítulo 2" no primeiro do mapa)',
                    trava_casamento(r, textos, capitulos) + esperado(r, {1: [[7, 8]], 2: [[8, 8]], 3: [[9, 9]]}) +
                    ([] if all(g['certeza'] == 'alta' and g['como'] == 'fim_do_livro' for g in r['por_capitulo'].values())
                     else ['certeza ou como: %r' % r['por_capitulo']]) +
                    ([] if r['secoes'] == [[7, 9]] else ['seções %r' % r['secoes']]))
    regra = livros.casar_numero
    venenos = (('casar pela ordem do mapa num livro que numera os capítulos',
                lambda num, cs: (next((c for c in cs if c['n'] == num), None), 'ordem')),
               ('casar com o capítulo seguinte',
                lambda num, cs: (next((c for c in cs if c['numero'] == num + 1), None), 'numero')))
    for rot, troca in venenos:
        livros.casar_numero = troca
        try:
            rv = livros.propor_gabaritos(textos, capitulos)
        finally:
            livros.casar_numero = regra
        placar.conferir('gabarito: ' + rot, trava_casamento(rv, textos, capitulos), deve_reprovar=True)

    # sem numero nos capitulos do mapa: vale a ordem, com certeza menor
    r = livros.propor_gabaritos([pag('Capítulo 1', CONTEUDO), pag('Capítulo 2', CONTEUDO),
                                 pag('Gabarito', 'Capítulo 1', '1. a'), pag('Gabarito', 'Capítulo 2', '1. b')],
                                caps((1, 1), (2, 2)))
    placar.conferir('gabarito: mapa sem número de capítulo casa pela ordem, com certeza média',
                    esperado(r, {1: [[3, 3]], 2: [[4, 4]]}) +
                    ([] if all(g['certeza'] == 'média' for g in r['por_capitulo'].values()) else ['certeza %r' % r['por_capitulo']]))

    # ---------------------------------------------------------- variacoes
    fim_cap = [pag('Capítulo 1', CONTEUDO)] * 3 + [pag('Respostas', '1. 12', '2. 15')] + \
              [pag('Capítulo 2', CONTEUDO)] * 2 + [pag('Respostas', '1. 7')]
    r = livros.propor_gabaritos(fim_cap, caps((1, 4), (5, 7)))
    placar.conferir('gabarito: no fim do próprio capítulo, sem número, casa pelo lugar',
                    trava_casamento(r, fim_cap, caps((1, 4), (5, 7))) + esperado(r, {1: [[4, 4]], 2: [[7, 7]]}) +
                    ([] if all(g['como'] == 'fim_do_capitulo' for g in r['por_capitulo'].values()) else ['como %r' % r['por_capitulo']]))
    meio = [pag('Capítulo 1', CONTEUDO), pag('RESPOSTAS', '1. a)  Resposta possível: traça-se uma reta'),
            pag('Capítulo 1', CONTEUDO), pag('Capítulo 1', CONTEUDO), pag('Capítulo 1', CONTEUDO)]
    r = livros.propor_gabaritos(meio, caps((1, 5)))
    placar.conferir('gabarito: quadro de respostas no MEIO do capítulo (manual do professor) é ignorado',
                    esperado(r, {}) + ([] if any(l['tipo'] == 'descartado' and 'meio do capítulo' in l['observacao']
                                                 for l in r['linhas']) else ['a planilha não diz do descartado: %r' % r['linhas']]))
    # veneno: o fim do capitulo aceito em qualquer ponto do capitulo (a condicao
    # do lugar desligada numa copia do livros.py)
    fonte = open(livros.__file__, encoding='utf-8').read()
    alvo = "if cap and capitulo_de(b) is cap and b >= cap['fim'] - 1 and a > cap['ini'] and cap['n'] not in usadas:"
    if fonte.count(alvo) != 1:
        placar.conferir('gabarito: a âncora do veneno do fim do capítulo existe uma vez', ['%d vezes' % fonte.count(alvo)])
    else:
        ns = {"__file__": livros.__file__, "__name__": "livros_envenenado"}
        codigo = fonte.replace(alvo, "if cap and cap['n'] not in usadas:")
        exec(compile(codigo, livros.__file__, 'exec'), ns)
        rv = ns['propor_gabaritos'](meio, caps((1, 5)))
        placar.conferir('gabarito: o fim do capítulo aceito em qualquer lugar do capítulo', esperado(rv, {}), deve_reprovar=True)

    impares = [pag('Capítulo 1', CONTEUDO), pag('Capítulo 2', CONTEUDO),
               pag('Respostas dos exercícios ímpares', 'Capítulo 1', '1. 4', '3. 9'), pag('Respostas dos exercícios ímpares', 'Capítulo 2', '1. 2')]
    r = livros.propor_gabaritos(impares, caps((1, 1), (2, 2), numeros=[1, 2]))
    placar.conferir('gabarito: só as ímpares, marcado',
                    esperado(r, {1: [[3, 3]], 2: [[4, 4]]}) +
                    ([] if all(g['so_impares'] for g in r['por_capitulo'].values()) else ['so_impares %r' % r['por_capitulo']]))
    manual = [pag('Capítulo 1', CONTEUDO, 'Respostas no Manual do Professor.'), pag('Capítulo 1', CONTEUDO)]
    r = livros.propor_gabaritos(manual, caps((1, 2), numeros=[1]))
    placar.conferir('gabarito: só no manual do professor fica vazio, e a nota diz',
                    esperado(r, {}) + ([] if 'Manual do Professor' in r['nota'] else ['nota %r' % r['nota']]))
    recomeca = [pag('Capítulo 1', CONTEUDO), pag('Capítulo 2', CONTEUDO),
                pag('Respostas', 'Capítulo 1', '1. a', 'Capítulo 2', '1. b'), pag('Respostas', 'Capítulo 1', '1. c')]
    r = livros.propor_gabaritos(recomeca, caps((1, 1), (2, 2), numeros=[1, 2]))
    placar.conferir('gabarito: numeração que recomeça nas respostas não fecha',
                    esperado(r, {}) + ([] if any('recomeça' in l.get('observacao', '') for l in r['linhas']) else ['planilha %r' % r['linhas']]))
    # denso de respostas de proposito: quem segura e so a regra do titulo
    pessoal = [pag('Capítulo 1', CONTEUDO), pag('Resposta pessoal', '1. 12', '2. 15'), pag('Capítulo 1', CONTEUDO),
               pag('Capítulo 2', CONTEUDO), pag('Respostas possíveis', '1. 3', '2. 4')]
    r = livros.propor_gabaritos(pessoal, caps((1, 3), (4, 5)))
    placar.conferir('gabarito: "Resposta pessoal" e "Respostas possíveis" não são título',
                    esperado(r, {}) + ([] if not r['secoes'] else ['seções %r' % r['secoes']]))
    titulo = livros.TITULO_DE_RESPOSTAS
    livros.TITULO_DE_RESPOSTAS = __import__('re').compile(r'^(respostas?|gabarito)\b')
    try:
        rv = livros.propor_gabaritos(pessoal, caps((1, 3), (4, 5)))
    finally:
        livros.TITULO_DE_RESPOSTAS = titulo
    placar.conferir('gabarito: "Resposta pessoal" tomado por título', esperado(rv, {}), deve_reprovar=True)
    epub_partilha = [pag('Capítulo 1', CONTEUDO), pag('Capítulo 2', CONTEUDO),
                     pag(CONTEUDO, 'RESPOSTAS DOS EXERCÍCIOS', 'Capítulo 1', '1. a', 'Capítulo 2', '1. b')]
    r = livros.propor_gabaritos(epub_partilha, caps((1, 1), (2, 2), numeros=[1, 2]), 'epub')
    placar.conferir('gabarito: EPUB com uma parte para dois capítulos não fecha (iria o do outro junto)',
                    esperado(r, {}) + ([] if r['secoes'] == [[3, 3]] else ['seções %r' % r['secoes']]))
    epub_ok = [pag('Capítulo 1', CONTEUDO), pag('Capítulo 2', CONTEUDO),
               pag(CONTEUDO, 'Respostas', 'Capítulo 1', '1. a'), pag('Respostas', 'Capítulo 2', '1. b')]
    r = livros.propor_gabaritos(epub_ok, caps((1, 1), (2, 2), numeros=[1, 2]), 'epub')
    placar.conferir('gabarito: EPUB com uma parte por capítulo, mesmo com a seção começando no meio da parte',
                    trava_casamento(r, epub_ok, caps((1, 1), (2, 2), numeros=[1, 2]), 'epub') + esperado(r, {1: [[3, 3]], 2: [[4, 4]]}))

    # ---------------------------------------------------------- sem texto
    r = livros.propor_gabaritos([''] * 8, caps((1, 4), (5, 8)))
    placar.conferir('gabarito: sem camada de texto fica vazio, menos confiável, e a nota diz',
                    esperado(r, {}) + ([] if r['texto'] == 'nao' and 'OCR' in r['nota'] and
                                       any(l['certeza'] == 'baixa' for l in r['linhas']) else ['%r %r' % (r['texto'], r['nota'])]))
    parcial = list(textos)
    parcial[5] = ''   # a pagina colada na secao de respostas
    r = livros.propor_gabaritos(parcial, capitulos)
    baixou = r['texto'] == 'parcial' and all(g['certeza'] != 'alta' for g in r['por_capitulo'].values()) and \
        'certeza do gabarito ao lado delas baixou' in r['nota']
    placar.conferir('gabarito: com parte do livro sem texto, a certeza baixa e a nota diz',
                    esperado(r, {1: [[7, 8]], 2: [[8, 8]], 3: [[9, 9]]}) + ([] if baixou else ['certezas %r' % r['por_capitulo']]))
    # o outro lado: a capa sem texto, longe das respostas, nao baixa nada
    longe = list(textos)
    longe[0] = ''
    r = livros.propor_gabaritos(longe, capitulos)
    placar.conferir('gabarito: página sem texto longe das respostas (a capa) não baixa a certeza',
                    [] if all(g['certeza'] == 'alta' for g in r['por_capitulo'].values()) and len(r['por_capitulo']) == 3
                    else ['certezas %r' % r['por_capitulo']])

    # o quadro "RESPOSTAS" do manual do professor no fim do capitulo: prosa, nao respostas
    quadro = [pag('Capítulo 1', CONTEUDO)] * 3 + [pag('RESPOSTAS', CONTEUDO, CONTEUDO, CONTEUDO, CONTEUDO)]
    r = livros.propor_gabaritos(quadro, caps((1, 4)))
    placar.conferir('gabarito: quadro de resolução em prosa no fim do capítulo não é gabarito',
                    esperado(r, {}) + ([] if any('parecem resposta' in l.get('observacao', '') for l in r['linhas']) else ['planilha %r' % r['linhas']]))
    guarda = livros.DENSIDADE_MINIMA
    livros.DENSIDADE_MINIMA = 0
    try:
        rv = livros.propor_gabaritos(quadro, caps((1, 4)))
    finally:
        livros.DENSIDADE_MINIMA = guarda
    placar.conferir('gabarito: sem a conferência de que a seção é feita de respostas', esperado(rv, {}), deve_reprovar=True)
    # uma marca so, de outro capitulo, dentro de um capitulo numerado: nao fecha
    alheia = [pag('Capítulo 5', CONTEUDO)] * 3 + [pag('Respostas', 'Capítulo 6', '1. 3', '2. 4')]
    r = livros.propor_gabaritos(alheia, caps((1, 4), numeros=[5]))
    placar.conferir('gabarito: as respostas do capítulo 6 no fim do capítulo 5 não viram gabarito do 5', esperado(r, {}))

    # revisao do C15.5: "Resolucao" sozinha (o exercicio resolvido) no alto da
    # penultima e da ultima pagina do capitulo nao e gabarito, no PDF e no EPUB.
    # Denso de respostas de proposito: quem segura e so a regra do titulo.
    resolvido = [pag('Capítulo 1', CONTEUDO)] * 2 + [pag('Resolução', '1. 12', '2. 15'), pag('RESOLUÇÃO DO PROBLEMA', '1. 3', '2. 4')]
    erros = []
    for formato in ('pdf', 'epub'):
        r = livros.propor_gabaritos(resolvido, caps((1, 4)), formato)
        erros += ['%s: %s' % (formato, x) for x in esperado(r, {}) + ([] if not r['secoes'] else ['seções %r' % r['secoes']])]
    placar.conferir('gabarito: "Resolução" sozinha no fim do capítulo é exercício resolvido, não gabarito (PDF e EPUB)', erros)
    # o outro lado: o plural, e o singular com "dos exercícios", continuam título
    lado = [livros.TITULO_DE_RESPOSTAS.match(livros.linha_normal(t)) is not None
            for t in ('Resoluções', 'Resolução dos exercícios', 'Respostas', 'Gabarito', 'Resposta das atividades',
                      'Resolução', 'Resolução do problema', 'Resposta', 'Resposta pessoal')]
    placar.conferir('gabarito: "Resoluções", "Resolução dos exercícios", "Respostas" e "Gabarito" continuam título; '
                    '"Resolução", "Resolução do problema" e "Resposta" sozinha não',
                    [] if lado == [True] * 5 + [False] * 4 else ['%r' % lado])
    titulo = livros.TITULO_DE_RESPOSTAS
    livros.TITULO_DE_RESPOSTAS = __import__('re').compile(r'^(respostas?|gabaritos?|resolucoes|resolucao|solucoes)'
                                                          r'( (dos|das|de|do|da|e|para) [a-z0-9 ,/]{0,60})?$')
    try:
        erros = []
        for formato in ('pdf', 'epub'):
            erros += esperado(livros.propor_gabaritos(resolvido, caps((1, 4)), formato), {})
    finally:
        livros.TITULO_DE_RESPOSTAS = titulo
    placar.conferir('gabarito: a regra antiga ("Resolução" sozinha como título)', erros, deve_reprovar=True)


def conferir_gabarito(manifest):
    """A forma do gabarito no manifest, livro a livro."""
    erros = []
    for l in manifest.get('livros') or []:
        if l.get('gabarito_origem') not in ('auto', 'nenhum') or not l.get('gabarito_nota'):
            erros.append('livro %s com gabarito_origem %r e nota %r' % (l.get('id'), l.get('gabarito_origem'), l.get('gabarito_nota')))
        tem = [e for e in l.get('mapa') or [] if e.get('gabarito')]
        if (l.get('gabarito_origem') == 'auto') != bool(tem):
            erros.append('livro %s: origem %r com %d capítulos com gabarito' % (l.get('id'), l.get('gabarito_origem'), len(tem)))
        limite = l.get('paginas') if l.get('formato') == 'pdf' else len((l.get('epub') or {}).get('espinha') or [])
        secao = {u for a, b in l.get('gabarito_secoes') or [] for u in range(a, b + 1)}
        for e in tem:
            g = e['gabarito']
            fs = g.get('paginas' if l.get('formato') == 'pdf' else 'partes') or []
            if not fs or g.get('certeza') not in livros.CERTEZAS or g.get('como') not in ('fim_do_livro', 'fim_do_capitulo'):
                erros.append('livro %s, capítulo %d, gabarito mal formado: %r' % (l.get('id'), e['n'], g))
            for f in fs:
                if not (isinstance(f, list) and len(f) == 2 and all(isinstance(x, int) for x in f) and 1 <= f[0] <= f[1] <= (limite or 0)):
                    erros.append('livro %s, capítulo %d, gabarito fora do livro: %r' % (l.get('id'), e['n'], f))
                elif g.get('como') == 'fim_do_livro' and any(u not in secao for u in range(f[0], f[1] + 1)):
                    erros.append('livro %s, capítulo %d, gabarito fora das seções de respostas: %r' % (l.get('id'), e['n'], f))
                elif g.get('como') == 'fim_do_capitulo' and any(u in secao for u in range(f[0], f[1] + 1)):
                    erros.append('livro %s, capítulo %d, gabarito do fim do capítulo dentro das seções (sairia do capítulo): %r'
                                 % (l.get('id'), e['n'], f))
    return erros


def pacote(placar, temp):
    c = amostra.fazer_gabarito(temp)
    conf = os.path.join(temp, 'conferencia')
    m, rel, _ = livros.gerar(c['planilha'], 'prova-gabarito', 1, os.path.join(temp, 'pacotes'),
                             trabalho=os.path.join(temp, 'trab'), gerado_em='2026-10-30T10:00:00-03:00', commit='prova',
                             conferencia=conf)
    por = {l['id']: l for l in m['livros']}
    com = por.get('livro-com-gabarito', {})
    g = [(e['n'], (e.get('gabarito') or {}).get('paginas'), (e.get('gabarito') or {}).get('certeza')) for e in com.get('mapa') or []]
    placar.conferir('gabarito: o livro sintético, cada capítulo com a página das suas respostas',
                    [] if g == [(1, [[7, 7]], 'alta'), (2, [[8, 8]], 'alta'), (3, [[9, 9]], 'alta'), (4, None, None)]
                    and com.get('gabarito_secoes') == [[7, 9]] else ['%r %r' % (g, com.get('gabarito_secoes'))])
    textos = livros.textos_do_pdf(os.path.join(c['livros'], 'matematica', 'livro-com-gabarito.pdf'))
    capitulos = livros.capitulos_do_mapa(com)
    r = livros.propor_gabaritos(textos, capitulos)
    placar.conferir('gabarito: o casamento conferido pelo texto do PDF sintético', trava_casamento(r, textos, capitulos))
    sem = por.get('livro-sem-gabarito', {})
    placar.conferir('gabarito: o livro sem respostas fica sem gabarito, e a nota diz',
                    [] if sem.get('gabarito_origem') == 'nenhum' and not any(e.get('gabarito') for e in sem.get('mapa') or [])
                    and 'Nenhum título' in sem.get('gabarito_nota', '') else ['%r %r' % (sem.get('gabarito_origem'), sem.get('gabarito_nota'))])
    placar.conferir('gabarito: a forma no manifest (dentro do livro, nas seções, certeza, como, origem e nota)', conferir_gabarito(m))
    v = copy.deepcopy(m)
    next(x for x in v['livros'] if x['id'] == 'livro-com-gabarito')['mapa'][0]['gabarito']['paginas'] = [[7, 99]]
    placar.conferir('gabarito: gabarito além da última página', conferir_gabarito(v), deve_reprovar=True)
    v = copy.deepcopy(m)
    next(x for x in v['livros'] if x['id'] == 'livro-sem-gabarito')['gabarito_origem'] = 'auto'
    placar.conferir('gabarito: origem "auto" sem gabarito nenhum', conferir_gabarito(v), deve_reprovar=True)
    with zipfile.ZipFile(rel['zip']['caminho']) as z:
        mz = json.loads(z.read('manifest.json'))
    placar.conferir('gabarito: o manifest do zip leva o gabarito', [] if mz == m else ['diferentes'])

    # a planilha de conferencia: uma por livro, uma linha por capitulo, e regerar guarda o que a sessao escreveu
    arq = os.path.join(conf, 'livro-com-gabarito.csv')
    erros = []
    if sorted(os.listdir(conf)) != ['livro-com-gabarito.csv', 'livro-de-prova.csv', 'livro-sem-gabarito.csv']:
        erros.append('planilhas: %r' % os.listdir(conf))
    else:
        with open(arq, encoding='utf-8-sig', newline='') as f:
            linhas = list(csv.DictReader(f))
        caps_ = [l for l in linhas if l['tipo'] == 'capitulo']
        if [(l['capitulo'], l['gabarito proposto'], l['certeza']) for l in caps_] != \
                [('1', 'página 7', 'alta'), ('2', 'página 8', 'alta'), ('3', 'página 9', 'alta'), ('4', 'sem gabarito localizado', '')]:
            erros.append('linhas: %r' % [(l['capitulo'], l['gabarito proposto'], l['certeza']) for l in caps_])
        linhas[1]['conferido (sim ou nao)'] = 'sim'
        linhas[1]['comentario'] = 'abri a página 8: são as respostas do capítulo 2'
        with open(arq, 'w', encoding='utf-8-sig', newline='') as f:
            w = csv.DictWriter(f, fieldnames=livros.COLUNAS_DA_CONFERENCIA)
            w.writeheader()
            w.writerows(linhas)
        livros.gerar(c['planilha'], 'prova-gabarito', 1, os.path.join(temp, 'pacotes2'), trabalho=os.path.join(temp, 'trab2'),
                     gerado_em='2026-10-30T10:00:00-03:00', commit='prova', conferencia=conf)
        with open(arq, encoding='utf-8-sig', newline='') as f:
            depois = list(csv.DictReader(f))
        if (depois[1]['conferido (sim ou nao)'], depois[1]['comentario']) != ('sim', 'abri a página 8: são as respostas do capítulo 2'):
            erros.append('regerar apagou a conferência: %r' % depois[1])
    placar.conferir('gabarito: a planilha de conferência por livro, e regerar guarda a conferência', erros)


def principal():
    placar = Placar()
    temp = tempfile.mkdtemp(prefix='prova_gabaritos_')
    try:
        casos(placar)
        pacote(placar, temp)
    finally:
        shutil.rmtree(temp, ignore_errors=True)
    print('%d verificacoes passaram, %d falharam' % (placar.ok, placar.falhas))
    sys.exit(1 if placar.falhas else 0)


if __name__ == '__main__':
    principal()
