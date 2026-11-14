"""Tipo de fonte "lista-curada" do gerador da biblioteca: os itens vem
declarados um a um num json, e o gerador so recorta, empilha e empacota.

    python biblioteca/gerar_pacote.py --fonte lista-curada --itens-curados <itens.json> --versao 1
        --saida <pasta> [--curadoria <Biblioteca/curadoria>] [--gabarito-externo <json>] [--so-com-resposta]

Para que serve. As outras fontes (Portal, provas, Cadernos SME-SP) ACHAM o
item no PDF por regras do proprio modelo de pagina. Aqui ninguem acha nada: a
pessoa que fez a curadoria ja leu a fonte e escreveu, item por item, o
assunto, o titulo, os subitens e a caixa do recorte em pontos do PDF. Este
modulo nao sabe nada de fonte nenhuma (nem titulo, nem sigla, nem modelo de
pagina): tudo vem do json, que mora FORA do repositorio, junto dos PDFs. O
recorte em SVG (gerar_pacote.svg_redigido), o empilhamento dos pedacos, a
busca, o manifest com hash de todo arquivo, o zip deterministico, o
--gabarito-externo e o --so-com-resposta sao os mesmos das outras fontes.

O json (todo campo desconhecido e recusado, em qualquer nivel):

    {
      "fonte": {
        "id": "minha-fonte",            slug: o pacote sai matematica-<id>
        "nome": "Nome da fonte",
        "url": "https://...",
        "licenca": "o texto da licenca",
        "atribuicao": "{fonte}, {serie}, {paginas}, \\"{titulo}\\".",
        "privado": true                 true: o manifest sai com privado true
      },
      "itens": [
        {
          "id": "minha-fonte:3ano:1.2",  unico; comeca por <fonte.id>:
          "serie": "3ano",               1ano a 9ano, ou 1em a 3em
          "tema_app": "MAT03-01",        assunto do banco/topicos/matematica.json
          "modulo": {"slug": "numeros", "titulo": "Numeros"},
          "titulo": "Atividade 1.2",
          "subitens": ["A", "B"],        lista de textos (pode ser vazia)
          "recorte": {"pdf": "caderno.pdf", "pagina": 12, "rect": [x0, y0, x1, y1]},
          "confere": "Atividade 1.2"     opcional: o comeco do texto do recorte
        }
      ]
    }

- id: letras, algarismos e . _ - : (sem espaco nem quebra de linha),
  comecando por <fonte.id>: e diferente do id de documento de modulo da
  busca (<serie>:<modulo.slug>).
- recorte.pdf: caminho do PDF, relativo a pasta do json (ou absoluto).
- recorte.pagina: o numero da pagina no PDF, contando de 1 (como o leitor de
  PDF e como origem.enunciado.pagina no pacote). rect em pontos do PDF, nas
  coordenadas da pagina, inteiro dentro dela. Pagina girada (/Rotate) e
  recusada: o rect seria lido num sistema e recortado em outro.
- recorte que atravessa paginas: {"pdf": ..., "pedacos": [{"pagina": 12,
  "rect": [...]}, {"pagina": 13, "rect": [...]}]} no lugar de pagina e rect;
  os pedacos saem empilhados num SVG so, na ordem do json.
- pedaco sem texto e sem tinta (regiao em branco, ou caixa menor que
  RECT_MIN pt) e recusado. Tinta e medida contra a cor do papel, a cor mais
  comum da pagina desenhada (o branco, o creme, o fundo do escaneado), e nao
  contra o branco: e tinta o pixel que se afasta dela mais de TINTA_TOL em
  algum canal (RGB), e o pedaco precisa de pelo menos TINTA_MIN da caixa (e
  nunca menos de TINTA_MIN_PX pixels) assim. A figura clara (cinza 0.85,
  amarelo palido) sem texto vale; a caixa toda da cor do papel, branca ou
  creme, e recusada.
- confere: o texto do recorte, sem acento, sem pontuacao e sem espaco (o
  espaco e a quebra de linha nao contam), tem de comecar pelo confere escrito
  do mesmo jeito, na ordem natural do PDF. Uma folga so, para o cabecalho de
  verdade da pagina que a caixa pegou de raspao (e que o PDF le primeiro): o
  primeiro bloco de texto do primeiro pedaco (de cima para baixo) pode ser
  pulado quando, ao mesmo tempo, (1) e uma linha so; (2) fica inteiro na
  faixa do alto da PAGINA (nao da caixa), de altura min(8% da altura da
  pagina, 60 pt): CABECALHO_FRACAO e CABECALHO_PT, o menor dos dois, para a
  faixa nao crescer em pagina grande; e (3) e cabecalho corrido: o mesmo texto
  (sem acento, pontuacao nem espaco) aparece como linha nessa faixa de outra
  pagina do mesmo PDF, ou, no PDF de uma pagina so, e o primeiro bloco de
  texto da pagina. Ai vale tambem o texto do segundo bloco em diante. Fora
  disso, so a ordem natural, como antes: a ultima linha do item de antes
  ("Resposta: ____"), um item de antes de uma linha, o titulo da pagina
  trocada (um gabarito) e a pagina que so cita o texto mais abaixo sao
  recusados. Pega a pagina trocada por uma.
- atribuicao: modelo com {fonte} (o nome), {serie} ("3º ano"), {paginas}
  ("p. 12", "p. 12 a 13" ou "p. 12 e 15", as do PDF), {titulo}, {id} e
  {arquivo} (o nome do PDF). Outro nome entre chaves, formato ({fonte:>30})
  ou conversao ({titulo!r}) sao recusados.
- travessao e meia-risca: no nome, na licenca, na atribuicao, nos titulos
  viram hifen; nos subitens sao recusados (o rotulo tem de ser o mesmo do
  --gabarito-externo).
- privado true com a saida ou a pasta de trabalho dentro deste repositorio,
  ou de qualquer checkout git (uma pasta acima dela, ou ela mesma, com .git,
  pasta ou arquivo: outro clone, outro worktree), e recusado; privado true
  com licenca aberta (CC BY, Creative Commons, dominio publico...) tambem:
  privado e uso pessoal entre professor e aluno.
- chave repetida em qualquer objeto do json e recusada (o json.load ficaria
  calado com a ultima); o mesmo vale para o --gabarito-externo.
- subitem com espaco no comeco ou no fim e recusado.
- tema_app pode ser de outro ano que o do item (o mais proximo, quando o ano
  do item nao tem assunto que sirva): vale, e o relatorio lista em
  tema_de_outro_ano.

O item sai como nas outras fontes sem solucao: assets.solucao null,
sem_solucao true, resposta null, dificuldade null (ou a do dificuldade.csv
da curadoria, se houver). O numero e 1, 2, 3... em cada modulo de cada serie,
na ordem do json. Recorte que o apagar de fora muda (a caixa corta tinta de
outra coisa) sai com motivo em excluidos do relatorio, como nas outras fontes.
"""
import collections
import datetime
import io
import json
import os
import re
import string
import sys
import time
import unicodedata

import pymupdf

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
sys.path.insert(0, AQUI)
import gerar_pacote  # noqa: E402
import portal  # noqa: E402

CAMPOS_TOPO = ('fonte', 'itens')
CAMPOS_FONTE = ('id', 'nome', 'url', 'licenca', 'atribuicao', 'privado')
CAMPOS_ITEM = ('id', 'serie', 'tema_app', 'modulo', 'titulo', 'subitens', 'recorte')
CAMPOS_ITEM_OPCIONAIS = ('confere',)
CAMPOS_MODULO = ('slug', 'titulo')
CAMPOS_PEDACO = ('pagina', 'rect')
CHAVES_DA_ATRIBUICAO = ('fonte', 'serie', 'paginas', 'titulo', 'id', 'arquivo')
SLUG = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
ID = re.compile(r'^[A-Za-z0-9._:-]+$')
SERIE = re.compile(r'^(?:([1-9])ano|([1-3])em)$')
TRACOS = ('–', '—', '−')
TOLERANCIA = 0.01  # pt: arredondamento de quem escreveu a caixa
RECT_MIN = 5.0     # pt: caixa mais estreita ou mais baixa que isto nao e recorte
TINTA_TOL = 16     # canal (0 a 255) mais longe que isto da cor do papel e tinta, na conferencia da caixa vazia
TINTA_MIN = 0.002  # fracao minima de pixels de tinta no pedaco (0,2%)
TINTA_MIN_PX = 3   # e nunca menos que isto de pixels
TINTA_LONGE_DO_BRANCO = True  # tinta tambem longe do branco; False so no veneno
CABECALHO_PT = 60        # pt: no maximo isto do alto da PAGINA e faixa de cabecalho, para o confere
CABECALHO_FRACAO = 0.08  # e no maximo esta fracao da altura da pagina (vale o menor)
sem_tracos = portal.sem_tracos  # um nome so, para a prova poder desliga-lo (veneno)


def nome_da_serie(serie):
    m = SERIE.match(serie)
    return ('%sº ano' % m.group(1)) if m.group(1) else ('%sª série do ensino médio' % m.group(2))


def ordem_da_serie(serie):
    m = SERIE.match(serie)
    return int(m.group(1)) if m.group(1) else 9 + int(m.group(2))


def serie_do_catalogo(serie):
    """'3ano' -> '03', '1em' -> 'em1': como o banco/topicos/matematica.json escreve."""
    m = SERIE.match(serie)
    return ('%02d' % int(m.group(1))) if m.group(1) else 'em' + m.group(2)


def carregar_temas():
    d = json.load(io.open(os.path.join(RAIZ, 'banco', 'topicos', 'matematica.json'), encoding='utf-8'))
    return {t['id']: {'serie': t['serie'], 'titulo': t['pt']['titulo']} for t in d['temas']}


def erro(onde, frase):
    raise SystemExit('erro: --itens-curados, %s: %s' % (onde, frase))


def sobra(obj, campos, onde, opcionais=()):
    if not isinstance(obj, dict):
        erro(onde, 'não é um objeto')
    a_mais = sorted(set(obj) - set(campos) - set(opcionais))
    if a_mais:
        erro(onde, 'campos desconhecidos: %s' % ', '.join(a_mais))
    faltam = [c for c in campos if c not in obj]
    return faltam


def texto(v, onde, campo):
    if not isinstance(v, str) or not v.strip():
        erro(onde, '%s tem de ser um texto não vazio (veio %r)' % (campo, v))
    return v


def numero(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def so_letras(t):
    """Sem acento, minusculo, so letras e algarismos: para comparar o confere."""
    t = unicodedata.normalize('NFD', portal.recompor(t).lower())
    return ''.join(c for c in t if unicodedata.category(c) != 'Mn' and c.isalnum())


LICENCA_ABERTA = re.compile(r'\bcc[ -]?(?:by|0|zero)\b|creative commons|dominio publico|public domain|'
                            r'licenca (?:livre|aberta)|open licen[cs]e|\bgpl\b|\bmit license\b')


def so_letras_e_espacos(t):
    t = unicodedata.normalize('NFD', t.lower())
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    return ' '.join(re.sub(r'[^a-z0-9-]+', ' ', t).split())


def ler_fonte(f):
    faltam = sobra(f, CAMPOS_FONTE, 'fonte')
    if faltam:
        erro('fonte', 'faltam os campos %s (licenca e atribuicao são obrigatórias)' % ', '.join(faltam))
    for c in ('id', 'nome', 'url', 'licenca', 'atribuicao'):
        texto(f[c], 'fonte', c)
    if not SLUG.match(f['id']):
        erro('fonte', 'id %r não é slug (minúsculas, algarismos e hífen)' % f['id'])
    if not isinstance(f['privado'], bool):
        erro('fonte', 'privado tem de ser true ou false (veio %r)' % (f['privado'],))
    try:
        partes = list(string.Formatter().parse(f['atribuicao']))
    except ValueError as e:
        erro('fonte', 'atribuicao mal formada (%s)' % e)
    for _, campo, formato, conversao in partes:
        if campo is None:
            continue
        if campo not in CHAVES_DA_ATRIBUICAO:
            erro('fonte', 'atribuicao com {%s}, que não existe; vale %s'
                 % (campo, ', '.join('{%s}' % c for c in CHAVES_DA_ATRIBUICAO)))
        if formato or conversao:
            erro('fonte', 'atribuicao com formato ou conversão em {%s%s%s}: só vale o nome entre chaves'
                 % (campo, '!' + conversao if conversao else '', ':' + formato if formato else ''))
    if f['privado'] and LICENCA_ABERTA.search(so_letras_e_espacos(f['licenca'])):
        erro('fonte', 'privado true com licença aberta (%r): fonte privada é de uso pessoal entre professor e aluno; '
                      'licença aberta vai com privado false' % f['licenca'])
    f = dict(f)
    for c in ('nome', 'licenca', 'atribuicao'):
        f[c] = sem_tracos(f[c])
    return f


# ------------------------------------------------------------------ CropBox

def caixa_crua(doc, xref, chave):
    """[x0, y0, x1, y1] da chave (MediaBox, CropBox) no dicionario da pagina, em
    coordenadas do PDF, herdada do Parent quando a pagina nao tem; None se nao ha."""
    vistos = set()
    while xref and xref not in vistos:
        vistos.add(xref)
        tipo, valor = doc.xref_get_key(xref, chave)
        if tipo == 'xref':
            valor = doc.xref_object(int(valor.split()[0]), compressed=True)
            tipo = 'array'
        if tipo == 'array':
            v = [float(x) for x in valor.strip('[] ').split()]
            if len(v) == 4:
                return [min(v[0], v[2]), min(v[1], v[3]), max(v[0], v[2]), max(v[1], v[3])]
            return None
        tipo, valor = doc.xref_get_key(xref, 'Parent')
        xref = int(valor.split()[0]) if tipo == 'xref' else None
    return None


def acertar_cropbox(doc, pno, notas):
    """A pagina com o CropBox fora do MediaBox (ha PDF publicado assim) nao
    deixa o svg_do_pedaco por o CropBox do recorte. O leitor de PDF ja mostra
    so a parte comum dos dois; a copia aberta aqui passa a ter o CropBox igual
    a ela. A conta e feita nas chaves cruas, em coordenadas do PDF (o MediaBox
    pode nao comecar na origem). O desenho e as coordenadas da pagina nao mudam
    (conferido: se page.rect mudasse, o gerador para). O arquivo do PDF nao e
    tocado."""
    xref = doc[pno].xref
    mb = caixa_crua(doc, xref, 'MediaBox')
    cb = caixa_crua(doc, xref, 'CropBox')
    if mb is None or cb is None:
        return
    if cb[0] >= mb[0] and cb[1] >= mb[1] and cb[2] <= mb[2] and cb[3] <= mb[3]:
        return
    novo = [max(cb[0], mb[0]), max(cb[1], mb[1]), min(cb[2], mb[2]), min(cb[3], mb[3])]
    if novo[0] >= novo[2] or novo[1] >= novo[3]:
        raise SystemExit('erro: --itens-curados: a página %d de %s tem o CropBox fora do MediaBox, sem parte comum'
                         % (pno + 1, os.path.basename(doc.name)))
    antes = pymupdf.Rect(doc[pno].rect)
    doc.xref_set_key(xref, 'CropBox', '[%s]' % ' '.join('%g' % v for v in novo))
    copia = pymupdf.open()
    copia.insert_pdf(doc, from_page=pno, to_page=pno)
    depois = pymupdf.Rect(copia[0].rect)
    copia.close()
    if depois != antes:
        raise SystemExit('erro: --itens-curados: a página %d de %s tem o CropBox fora do MediaBox, e acertá-lo mudaria '
                         'as coordenadas da página' % (pno + 1, os.path.basename(doc.name)))
    notas.append('%s p%d: CropBox %s fora do MediaBox %s; usado o comum aos dois'
                 % (os.path.basename(doc.name), pno + 1, [round(v, 1) for v in cb], [round(v, 1) for v in mb]))


# ------------------------------------------------------------------ leitura

def cor_do_papel(doc, pno):
    """A cor mais comum da pagina desenhada a 36 dpi, em RGB: o papel (ou o
    painel que toma a pagina; por isso a tinta tambem se mede contra o branco)."""
    pix = doc[pno].get_pixmap(dpi=36, colorspace=pymupdf.csRGB, alpha=False)
    s = pix.samples
    return collections.Counter(s[i:i + 3] for i in range(0, len(s), 3)).most_common(1)[0][0]


def tem_conteudo(doc, pno, rect):
    """O retangulo tem texto ou tinta: pixels que se afastam da cor do papel,
    e tambem do branco, mais de TINTA_TOL em algum canal, pelo menos TINTA_MIN da caixa (e
    TINTA_MIN_PX). A figura clara sem texto vale; a caixa da cor do papel, nao."""
    if doc[pno].get_text('text', clip=pymupdf.Rect(rect)).strip():
        return True
    papel = cor_do_papel(doc, pno)
    pix = doc[pno].get_pixmap(dpi=72, colorspace=pymupdf.csRGB, clip=pymupdf.Rect(rect), alpha=False)
    s = pix.samples
    n = len(s) // 3
    def longe(i, cor):
        return abs(s[i] - cor[0]) > TINTA_TOL or abs(s[i + 1] - cor[1]) > TINTA_TOL or abs(s[i + 2] - cor[2]) > TINTA_TOL
    # longe do papel E do branco: o branco vazio numa pagina tomada por um painel claro nao e tinta
    tinta = sum(1 for i in range(0, len(s), 3)
                if longe(i, papel) and (longe(i, (255, 255, 255)) or not TINTA_LONGE_DO_BRANCO))
    return tinta >= max(TINTA_MIN_PX, TINTA_MIN * n)


def blocos_de_texto(page, clip=None):
    """[(bbox, [texto de cada linha])] dos blocos de texto, de cima para baixo."""
    out = []
    for b in page.get_text('dict', clip=clip)['blocks']:
        if b.get('type') != 0:
            continue
        lns = [''.join(sp['text'] for sp in ln['spans']) for ln in b['lines']]
        lns = [t for t in lns if t.strip()]
        if lns:
            out.append((b['bbox'], lns))
    out.sort(key=lambda b: (b[0][1], b[0][0]))
    return out


def faixa_de_cabecalho(page):
    """O retangulo do alto da pagina onde mora o cabecalho: min(8% da altura, 60 pt)."""
    r = page.rect
    return pymupdf.Rect(r.x0, r.y0, r.x1, r.y0 + min(CABECALHO_FRACAO * r.height, CABECALHO_PT))


def e_cabecalho_da_pagina(doc, pno, bbox, linha):
    """A linha (o bloco de uma linha so em bbox) e cabecalho de verdade: fica
    na faixa do alto da pagina e se repete nessa faixa em outra pagina do PDF
    (ou, no PDF de uma pagina, e o primeiro bloco de texto dela)."""
    faixa = faixa_de_cabecalho(doc[pno])
    alvo = so_letras(linha)
    if not alvo or bbox[1] < faixa.y0 - TOLERANCIA or bbox[3] > faixa.y1 + TOLERANCIA:
        return False
    if doc.page_count == 1:
        todos = blocos_de_texto(doc[pno])
        return bool(todos) and len(todos[0][1]) == 1 and so_letras(todos[0][1][0]) == alvo
    for k in range(doc.page_count):
        if k == pno:
            continue
        for _, lns in blocos_de_texto(doc[k], faixa_de_cabecalho(doc[k])):
            if any(so_letras(t) == alvo for t in lns):
                return True
    return False


def comecos_do_recorte(docs, ps):
    """Os textos com que o recorte pode comecar, para o confere: o da ordem
    natural do PDF e, so quando o primeiro bloco de texto do primeiro pedaco
    (de cima para baixo) e o cabecalho da pagina (e_cabecalho_da_pagina), o
    texto do segundo bloco em diante mais o dos pedacos seguintes."""
    resto = ''.join(gerar_pacote.texto_do_retangulo(docs[c], pno, r) for c, pno, r in ps[1:])
    c0, pno0, r0 = ps[0]
    out = [gerar_pacote.texto_do_retangulo(docs[c0], pno0, r0) + resto]
    blocos = blocos_de_texto(docs[c0][pno0], pymupdf.Rect(r0))
    if len(blocos) >= 2 and len(blocos[0][1]) == 1 and \
            e_cabecalho_da_pagina(docs[c0], pno0, blocos[0][0], blocos[0][1][0]):
        out.append('\n'.join(t for _, lns in blocos[1:] for t in lns) + '\n' + resto)
    return out


def ler_recorte(r, base, onde, docs):
    """[(caminho do pdf, pno, rect)], conferido contra o PDF."""
    if not isinstance(r, dict):
        erro(onde, 'recorte não é um objeto')
    if 'pedacos' in r:
        faltam = sobra(r, ('pdf', 'pedacos'), onde + ', recorte')
        brutos = r['pedacos']
        if not isinstance(brutos, list) or not brutos:
            erro(onde, 'recorte.pedacos tem de ser uma lista não vazia')
    else:
        faltam = sobra(r, ('pdf', 'pagina', 'rect'), onde + ', recorte')
        brutos = [{'pagina': r.get('pagina'), 'rect': r.get('rect')}]
    if faltam:
        erro(onde, 'recorte sem %s' % ', '.join(faltam))
    texto(r['pdf'], onde, 'recorte.pdf')
    caminho = r['pdf'] if os.path.isabs(r['pdf']) else os.path.join(base, r['pdf'])
    caminho = os.path.normpath(caminho)
    if caminho not in docs:
        if not os.path.isfile(caminho):
            erro(onde, 'o PDF %s não existe' % caminho)
        try:
            docs[caminho] = pymupdf.open(caminho)
        except Exception as e:  # noqa: BLE001
            erro(onde, 'não consegui abrir o PDF %s (%s)' % (caminho, e))
        if not docs[caminho].is_pdf:
            erro(onde, '%s não é PDF' % caminho)
    doc = docs[caminho]
    out = []
    for k, p in enumerate(brutos, 1):
        o = '%s, pedaço %d' % (onde, k) if len(brutos) > 1 or 'pedacos' in r else onde
        falta = sobra(p, CAMPOS_PEDACO, o)
        if falta:
            erro(o, 'sem %s' % ', '.join(falta))
        pag, rect = p['pagina'], p['rect']
        if not isinstance(pag, int) or isinstance(pag, bool):
            erro(o, 'pagina tem de ser um inteiro, contando de 1 (veio %r)' % (pag,))
        if not 1 <= pag <= doc.page_count:
            erro(o, 'página %d fora do PDF (%s tem %d páginas)' % (pag, os.path.basename(caminho), doc.page_count))
        if doc[pag - 1].rotation:
            erro(o, 'a página %d de %s está girada (/Rotate %d): recorte em página girada não é aceito; '
                    'gire a página no PDF antes' % (pag, os.path.basename(caminho), doc[pag - 1].rotation))
        if not (isinstance(rect, list) and len(rect) == 4 and all(numero(v) for v in rect)):
            erro(o, 'rect tem de ser [x0, y0, x1, y1] em pontos (veio %r)' % (rect,))
        x0, y0, x1, y1 = [float(v) for v in rect]
        if not (x0 < x1 and y0 < y1):
            erro(o, 'rect %r vazio ou invertido' % (rect,))
        W, H = doc[pag - 1].rect.width, doc[pag - 1].rect.height
        if x0 < -TOLERANCIA or y0 < -TOLERANCIA or x1 > W + TOLERANCIA or y1 > H + TOLERANCIA:
            erro(o, 'rect %r sai da página %d (%.1f x %.1f pt)' % (rect, pag, W, H))
        if x1 - x0 < RECT_MIN or y1 - y0 < RECT_MIN:
            erro(o, 'rect %r com menos de %g pt de largura ou de altura: não é recorte' % (rect, RECT_MIN))
        caixa = (max(0.0, x0), max(0.0, y0), min(W, x1), min(H, y1))
        if not tem_conteudo(doc, pag - 1, caixa):
            erro(o, 'o rect %r da página %d não tem texto nem tinta: caixa em branco' % (rect, pag))
        out.append((caminho, pag - 1, caixa))
    return out


def ler_itens_curados(caminho):
    """(fonte, [item lido], {caminho: doc}). Para tudo no primeiro erro."""
    try:
        with io.open(caminho, encoding='utf-8') as f:
            dados = json.load(f, object_pairs_hook=gerar_pacote.sem_chave_repetida)
    except (OSError, ValueError) as e:
        raise SystemExit('erro: --itens-curados %s: não consegui ler o json (%s)' % (caminho, e))
    faltam = sobra(dados, CAMPOS_TOPO, 'o arquivo')
    if faltam:
        erro('o arquivo', 'faltam %s' % ', '.join(faltam))
    fonte = ler_fonte(dados['fonte'])
    if not isinstance(dados['itens'], list) or not dados['itens']:
        erro('o arquivo', 'itens tem de ser uma lista não vazia')
    temas = carregar_temas()
    base = os.path.dirname(os.path.abspath(caminho))
    docs, ids, modulos, itens = {}, set(), {}, []
    for n, it in enumerate(dados['itens'], 1):
        onde = 'item %d' % n
        if isinstance(it, dict) and isinstance(it.get('id'), str):
            onde += ' (%r)' % it['id']
        falta = sobra(it, CAMPOS_ITEM, onde, CAMPOS_ITEM_OPCIONAIS)
        if falta:
            erro(onde, 'faltam %s' % ', '.join(falta))
        iid = texto(it['id'], onde, 'id')
        if not ID.match(iid):
            erro(onde, 'id %r com caractere que não vale: só letras, algarismos e . _ - :' % iid)
        if not iid.startswith(fonte['id'] + ':'):
            erro(onde, 'id %r não começa por %r (o id da fonte e dois-pontos)' % (iid, fonte['id'] + ':'))
        if iid in ids:
            erro(onde, 'id %r repetido' % iid)
        ids.add(iid)
        serie = texto(it['serie'], onde, 'serie')
        if not SERIE.match(serie):
            erro(onde, 'serie %r não é 1ano a 9ano nem 1em a 3em' % serie)
        tid = texto(it['tema_app'], onde, 'tema_app')
        if tid not in temas:
            erro(onde, 'tema_app %r não está no banco/topicos/matematica.json' % tid)
        falta = sobra(it['modulo'], CAMPOS_MODULO, onde + ', modulo')
        if falta:
            erro(onde, 'modulo sem %s' % ', '.join(falta))
        slug = texto(it['modulo']['slug'], onde, 'modulo.slug')
        tit_mod = sem_tracos(texto(it['modulo']['titulo'], onde, 'modulo.titulo'))
        if not SLUG.match(slug):
            erro(onde, 'modulo.slug %r não é slug (minúsculas, algarismos e hífen)' % slug)
        if modulos.setdefault(slug, tit_mod) != tit_mod:
            erro(onde, 'o módulo %s já veio com o título %r, e aqui com %r' % (slug, modulos[slug], tit_mod))
        titulo = sem_tracos(texto(it['titulo'], onde, 'titulo'))
        subs = it['subitens']
        if not isinstance(subs, list) or not all(isinstance(s, str) and s.strip() for s in subs):
            erro(onde, 'subitens tem de ser uma lista de textos não vazios (veio %r)' % (subs,))
        if len(set(subs)) != len(subs):
            erro(onde, 'subitens repetidos: %r' % (subs,))
        com_espaco = [s for s in subs if s != s.strip()]
        if com_espaco:
            erro(onde, 'subitem com espaço no começo ou no fim: %r (o rótulo tem de ser o mesmo do '
                       '--gabarito-externo, sem espaço sobrando)' % com_espaco[0])
        com_traco = [s for s in subs if any(t in s for t in TRACOS)]
        if com_traco:
            erro(onde, 'subitem com travessão, meia-risca ou sinal de menos: %r (troque por hífen aqui e no '
                       '--gabarito-externo)' % com_traco[0])
        ps = ler_recorte(it['recorte'], base, onde, docs)
        if 'confere' in it:
            esperado = so_letras(texto(it['confere'], onde, 'confere'))
            comecos = [so_letras(t) for t in comecos_do_recorte(docs, ps)]
            lido = comecos[0]
            if not esperado or not any(t.startswith(esperado) for t in comecos):
                erro(onde, 'o texto do recorte não começa por confere %r (começa por %r): página ou caixa trocada?'
                     % (it['confere'], lido[:max(len(esperado), 20)]))
        itens.append({'id': iid, 'serie': serie, 'tema_app': tid, 'tema_serie': temas[tid]['serie'],
                      'modulo': {'slug': slug, 'titulo': tit_mod}, 'titulo': titulo, 'subitens': list(subs),
                      'pedacos': ps, 'ordem': n})
    de_modulo = {'%s:%s' % (c['serie'], c['modulo']['slug']) for c in itens}
    for c in itens:
        if c['id'] in de_modulo:
            erro('item %d (%r)' % (c['ordem'], c['id']), 'o id é igual ao do documento de módulo da busca')
    return fonte, itens, docs


def acertar_paginas(itens, docs, notas):
    for cam, pno in sorted(set((p[0], p[1]) for c in itens for p in c['pedacos'])):
        acertar_cropbox(docs[cam], pno, notas)


def paginas_de(ps):
    return sorted(set(p[1] + 1 for p in ps))


def texto_das_paginas(pags):
    """p. 12; p. 12 a 14 (seguidas); p. 12 e 15; p. 12, 14 e 15."""
    if len(pags) == 1:
        return 'p. %d' % pags[0]
    if pags == list(range(pags[0], pags[-1] + 1)):
        return 'p. %d a %d' % (pags[0], pags[-1])
    return 'p. %s e %d' % (', '.join(str(p) for p in pags[:-1]), pags[-1])


def dentro_do_repositorio(caminho):
    """A raiz do repositorio em que o caminho cai, ou None: este (RAIZ, mesmo
    sem .git, como na arvore do git archive) ou qualquer checkout git, achado
    subindo do caminho ate a raiz do disco atras de um .git (pasta ou arquivo,
    como no worktree)."""
    a, b = os.path.normcase(os.path.realpath(caminho)), os.path.normcase(os.path.realpath(RAIZ))
    try:
        if os.path.commonpath([a, b]) == b:
            return RAIZ
    except ValueError:  # outro disco
        pass
    d = os.path.realpath(os.path.abspath(caminho))
    while True:
        if os.path.lexists(os.path.join(d, '.git')):
            return d
        pai = os.path.dirname(d)
        if pai == d:
            return None
        d = pai


def gerar(itens_curados, versao, saida, curadoria=None, trabalho=None, gerado_em=None, commit=None, gravar_zip=True,
          gabarito_externo=None, so_com_resposta=False):
    t_ini = time.time()
    fonte, lidos, docs = ler_itens_curados(itens_curados)
    nome = 'matematica-%s' % fonte['id']
    trabalho = trabalho or os.path.join(os.path.dirname(os.path.abspath(saida)), 'trabalho', '%s-v%d' % (nome, versao))
    if fonte['privado']:
        dentro = [(o, dentro_do_repositorio(c)) for o, c in (('--saida', saida), ('a pasta de trabalho', trabalho))]
        dentro = [(o, r) for o, r in dentro if r]
        if dentro:
            raise SystemExit('erro: --itens-curados: a fonte é privada, e %s %s dentro do repositório git com '
                             'raiz em %s (a raiz achada pode estar bem acima do destino: o .git pode ser de uma '
                             'pasta pai). Gere fora de qualquer checkout git.'
                             % (' e '.join(o for o, _ in dentro), 'ficam' if len(dentro) > 1 else 'fica',
                                ', '.join(sorted(set(r for _, r in dentro)))))
    if curadoria:
        dif_cur, apelidos, excl_cur, _meta = gerar_pacote.ler_curadoria(curadoria)
    else:
        dif_cur, apelidos, excl_cur = {}, {}, {}
    conteudo, itens, docs_busca = {}, [], []
    relatorio = {'pacote': nome, 'versao': versao, 'pymupdf': portal.versao_pymupdf(), 'privado': fonte['privado'],
                 'excluidos': [], 'assuntos': {}, 'tema_de_outro_ano': [], 'notas': []}
    acertar_paginas(lidos, docs, relatorio['notas'])
    por_lista = collections.Counter()
    for c in lidos:
        iid, serie, ps = c['id'], c['serie'], c['pedacos']
        pags = paginas_de(ps)
        arquivo = os.path.basename(ps[0][0])
        linha = {'id': iid, 'serie': serie, 'tema': c['tema_app'], 'paginas': pags, 'titulo': c['titulo']}
        if iid in excl_cur:
            relatorio['excluidos'].append(dict(linha, motivo=sem_tracos('curadoria: ' + excl_cur[iid])))
            continue
        svgs, meds, falhou = [], [], None
        for cam, pno, rect in ps:
            svg, dif, obs = gerar_pacote.svg_redigido(docs[cam], pno, rect, cmyk_para_rgb=True)
            if dif > gerar_pacote.LIMITE_REDACAO:
                falhou = 'apagar o de fora mudou %.2f%% dos pixels do recorte (p. %d do PDF): a caixa corta outra coisa' \
                    % (100 * dif, pno + 1)
            if obs:
                relatorio['notas'].append('%s p%d: %s' % (iid, pno + 1, obs))
            svgs.append(svg)
            meds.append((rect[2] - rect[0], rect[3] - rect[1]))
        if falhou:
            relatorio['excluidos'].append(dict(linha, motivo=falhou))
            continue
        if c['tema_serie'] != serie_do_catalogo(serie):
            relatorio['tema_de_outro_ano'].append({'id': iid, 'serie': serie, 'tema': c['tema_app'],
                                                   'serie_do_tema': c['tema_serie']})
        modulo = c['modulo']
        aula = {'slug': '%s-%s' % (fonte['id'], serie),
                'titulo': sem_tracos('%s, %s' % (fonte['nome'], nome_da_serie(serie))),
                'n': ordem_da_serie(serie)}
        por_lista[(serie, modulo['slug'])] += 1
        num = por_lista[(serie, modulo['slug'])]
        base_a = 'assets/%s/%s/%s/ex-%03d' % (serie, modulo['slug'], aula['slug'], num)
        svg, (w, h) = gerar_pacote.empilhar(svgs, meds)
        conteudo[base_a + '.svg'] = svg.encode('utf-8')
        o = {'pagina': ps[0][1] + 1, 'coluna': 1, 'bbox': list(ps[0][2])}
        if len(ps) > 1:
            o['pedacos'] = [{'pagina': pno + 1, 'coluna': 1, 'bbox': list(rect)} for _, pno, rect in ps]
        txt = '\n'.join(gerar_pacote.texto_do_retangulo(docs[cam], pno, rect) for cam, pno, rect in ps)
        atrib = sem_tracos(fonte['atribuicao'].format(
            fonte=fonte['nome'], serie=nome_da_serie(serie), paginas=texto_das_paginas(pags), titulo=c['titulo'],
            id=iid, arquivo=arquivo))
        item = {
            'id': iid, 'fonte': fonte['id'], 'serie': serie,
            'modulo': dict(modulo), 'aula': aula, 'numero': num, 'titulo': c['titulo'],
            'formato': 'aberta', 'alternativas': None, 'resposta': None,
            'subitens': c['subitens'],
            'texto': portal.para_busca(txt),
            'origem_citada': atrib,
            'dificuldade': None, 'dificuldade_origem': None, 'proxy': None,
            'tema_app': c['tema_app'], 'tema_origem': 'lista-curada',
            'licenca': fonte['licenca'],
            'atribuicao': atrib,
            'link': fonte['url'],
            'origem_detalhe': {'fonte': fonte['nome'], 'ano': nome_da_serie(serie), 'paginas': pags,
                               'ordem_no_json': c['ordem']},
            'assets': {'enunciado': base_a + '.svg', 'solucao': None},
            'medidas': {'enunciado': {'largura_pt': round(w, 1), 'altura_pt': round(h, 1), 'rotulo': None},
                        'solucao': None},
            'sem_solucao': True,
            'origem': {'arquivo': arquivo, 'enunciado': o},
        }
        if iid in dif_cur:
            item.update({'dificuldade': dif_cur[iid], 'dificuldade_origem': 'curadoria'})
        itens.append(item)
        relatorio['assuntos'].setdefault(c['tema_app'], []).append(iid)
        docs_busca.append({'id': iid, 'serie': serie, 'tipo': 'exercicio',
                           'titulo': sem_tracos('%s, %s' % (aula['titulo'], c['titulo'])),
                           'resumo': sem_tracos('%s %s' % (modulo['titulo'], aula['titulo'])),
                           'texto': sem_tracos(portal.recompor(txt)), 'explicacao': ''})
    for d in docs.values():
        d.close()
    for chave in sorted(set((i['serie'], i['modulo']['slug']) for i in itens)):
        ids = [i for i in itens if (i['serie'], i['modulo']['slug']) == chave]
        docs_busca.append({'id': '%s:%s' % chave, 'serie': chave[0], 'tipo': 'modulo',
                           'titulo': sem_tracos(ids[0]['modulo']['titulo']),
                           'resumo': sem_tracos(' '.join(sorted(set(i['aula']['titulo'] for i in ids)))), 'texto': ''})
    itens.sort(key=lambda i: (ordem_da_serie(i['serie']), i['modulo']['slug'], i['numero']))
    docs_busca.sort(key=lambda d: d['id'])
    n_gabarito = (gerar_pacote.aplicar_gabarito_externo(itens, gabarito_externo)
                  if gabarito_externo is not None else None)
    sem_resposta = None
    if so_com_resposta:
        sem_resposta = gerar_pacote.tirar_sem_resposta(itens, conteudo, docs_busca)
        gerar_pacote.recusar_pacote_vazio(itens, sem_resposta)
        relatorio['assuntos'] = gerar_pacote.assuntos_sem(relatorio['assuntos'], sem_resposta)
        relatorio['sem_resposta'] = sem_resposta
        fora = {e['id'] for e in sem_resposta}
        relatorio['tema_de_outro_ano'] = [t for t in relatorio['tema_de_outro_ano'] if t['id'] not in fora]
    if not itens:
        raise SystemExit('erro: --itens-curados: nenhum item ficou no pacote (%d excluídos)' % len(relatorio['excluidos']))
    conteudo['itens.json'] = gerar_pacote.json_bytes(itens)
    conteudo['teoria.json'] = gerar_pacote.json_bytes([])
    conteudo['busca.json'] = gerar_pacote.json_bytes(gerar_pacote.montar_busca(docs_busca))
    conteudo['apelidos.json'] = gerar_pacote.json_bytes(apelidos)
    series = sorted(set(i['serie'] for i in itens), key=ordem_da_serie)
    contagens = {'modulos': len(set((i['serie'], i['modulo']['slug']) for i in itens)), 'aulas_teoria': 0,
                 'paginas_teoria': 0, 'aulas_exercicios': len(set((i['serie'], i['modulo']['slug'], i['aula']['slug'])
                                                                  for i in itens)),
                 'itens': len(itens), 'itens_com_solucao': 0, 'itens_excluidos': len(relatorio['excluidos'])}
    if n_gabarito is not None:
        contagens['itens_com_gabarito_agente'], contagens['itens_com_gabarito_agente_parcial'] = n_gabarito
    if sem_resposta is not None:
        contagens['itens_sem_resposta_excluidos'] = len(sem_resposta)
    manifest = {
        'esquema': 1, 'pacote': nome, 'versao': versao,
        'gerado_em': gerado_em or datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-3))).replace(
            microsecond=0).isoformat(),
        'gerador': {'nome': 'biblioteca/gerar_pacote.py --fonte lista-curada',
                    'commit': commit or gerar_pacote.commit_do_gerador(), 'pymupdf': pymupdf.VersionBind},
        'materia': 'matematica',
        'fonte': {k: fonte[k] for k in ('id', 'nome', 'url', 'licenca')},
        'series': series, 'licenca': fonte['licenca'], 'privado': fonte['privado'],
    }
    manifest.update({'contagens': contagens, 'arquivos': {k: gerar_pacote.sha(conteudo[k]) for k in sorted(conteudo)}})
    manifest_b = (json.dumps(manifest, ensure_ascii=False, indent=1) + '\n').encode('utf-8')
    zip_caminho = gerar_pacote.gravar_pacote(conteudo, manifest_b, nome, versao, saida, trabalho, gravar_zip)
    tam = collections.Counter()
    for k, v in conteudo.items():
        tam['enunciado' if k.startswith('assets/') else k] += len(v)
    relatorio.update({
        'contagens': contagens, 'hash_manifest': gerar_pacote.sha(manifest_b),
        'zip': {'caminho': zip_caminho if gravar_zip else None,
                'bytes': os.path.getsize(zip_caminho) if gravar_zip else None},
        'bytes_por_tipo': dict(sorted(tam.items())), 'segundos': round(time.time() - t_ini, 1),
    })
    with open(os.path.join(trabalho, 'relatorio.json'), 'w', encoding='utf-8', newline='') as f:
        f.write(json.dumps(relatorio, ensure_ascii=False, indent=1) + '\n')
    return manifest, relatorio, trabalho
