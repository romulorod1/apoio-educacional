"""Gera o pacote de biblioteca de uma serie do Portal da OBMEP.

    python biblioteca/gerar_pacote.py --pdfs <pasta da serie> --serie 9ano --versao 1
        --saida <Biblioteca/pacotes> --curadoria <Biblioteca/curadoria>
        [--trabalho <pasta>] [--gerado-em 2026-09-22T14:03:00-03:00] [--commit abc1234]

Saida: <saida>/matematica-obmep-<serie>-v<versao>.zip, no formato de
CONTRATO_pacote_biblioteca.md (esquema 1, com os campos aditivos da secao 8a),
e uma pasta de trabalho com os assets soltos, os JSON do pacote e o
relatorio.json (itens por lista, excluidos com motivo, medidas, tempo).

Como o item e achado (medido nas 25 listas do 9o ano, ver
Biblioteca/PADROES_numeracao_9ano.md):

- A coluna vem do fio vertical que separa as colunas (x 291 ou 306), pelo
  valor mais frequente no documento, porque ha paginas sem o fio. O fio nunca
  entra no recorte: a coluna esquerda termina antes dele e a direita comeca
  depois.
- O fim util da pagina vem do fio horizontal do rodape.
- Enunciado: span em negrito "Exercicio" na margem da coluna, com o numero no
  mesmo span ("Exercicio 7.") ou no span negrito seguinte da mesma linha
  visual ("Exercicio" e "7").
- Solucao: depois do titulo "Respostas e Solucoes", span em negrito "N." (ou
  "N" seguido de ".") na margem da coluna, com ate 12 pt de recuo.
- Titulo de secao ("1 Exercicios Introdutorios") encerra o item anterior.
- A caixa do item vai do topo da linha do seu marcador ate o topo do proximo
  marcador ou titulo na mesma coluna, ou ate o fim da coluna. Conteudo no alto
  de uma coluna antes do primeiro marcador continua o item aberto: e um pedaco
  a mais, e os pedacos saem empilhados num SVG so.

O SVG e o da pagina com o cropbox no recorte, depois de apagar por redacao o
que fica fora dele (com folga), porque o cropbox sozinho leva a pagina inteira
para dentro do arquivo. Cada pedaco e conferido: o pixmap da pagina redigida
tem de ser igual ao da original naquele retangulo.
"""
import argparse
import collections
import datetime
import hashlib
import io
import json
import math
import os
import re
import subprocess
import sys
import tempfile
import time
import zipfile

import pymupdf

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
sys.path.insert(0, AQUI)
import portal  # noqa: E402

# ------------------------------------------------------------------ medidas

FOLGA = 3.0            # pt em volta do conteudo do recorte
# O que fica ate esta distancia fora do recorte nao e apagado. Tenta a menor
# primeiro: o glifo do radical tem caixa bem mais alta que o desenho e, com 6 pt,
# era apagado inteiro (conjuntos-numericos, solucao 10).
FOLGAS_REDACAO = (6.0, 18.0, 40.0)
FOLGA_PILHA = 6.0      # pt entre pedacos empilhados
MARGEM_X = 24.0        # borda externa das colunas
# distancia entre o recorte e o fio separador. Era 2,5 pt, e a fonte as vezes
# deixa a linha passar de leve do fim da coluna (Conjuntos Numericos, solucao
# 23): a borda direita cortava a ultima letra. Com 1,2 pt o fio (0,4 pt de
# largura) continua fora do recorte.
AFASTA_FIO = 1.2
ENCOSTA = 0.5  # caixa a menos disto acima da linha do marcador ainda e da linha (topo_da_linha); 0 so no veneno
CORTE_SEM_TINTA = True  # o corte entre itens nunca passa por cima de tinta (topo_sem_cortar); False so no veneno
BARRA_ACIMA = True  # barra de segmento acima da linha do marcador entra no recorte; False so no veneno
CREDITO_MATERIAL = True  # "Material elaborado por" fecha o item, como os creditos; False so no veneno
SOBREPOSICAO_MIN = 0.25  # quanto da caixa tem de estar na linha para ser dela (topo_da_linha); 0 so no veneno
MIUDO_QUE_ENCOSTA = 8.5  # so o miudo que encosta vale pela tinta propria; 99 so no veneno
TINTA_DO_QUE_ENCOSTA = True  # o que encosta por cima da linha do marcador vale pelo topo da tinta dele; False so no veneno
SUBIDA_FINA = True  # o topo da linha do marcador sobe pela tinta a 288 dpi (subida_fina); False so no veneno
FOLGA_ANTES_DO_PROXIMO = True  # o recorte acaba 1 pt antes do proximo item (ver detectar); False so no veneno
LIMPA_PASTA = True  # asset solto de geracao anterior sai da pasta de trabalho (gravar_pacote); False so no veneno
FIO_IMAGEM = True   # fio de coluna ou de rodape feito de imagem conta como fio (fios_da_pagina); False so no veneno
CALHA_TRACO = True  # traco reto que cruza o fio exclui o item como texto que cruza; False so no veneno
NOTA_LINHA_TODA = True  # a nota comeca no topo da linha do numero, nao no numero; False so no veneno
TOPO_MAX = 30     # quanto a linha do marcador sobe pelo texto que a atravessa (ver topo_da_linha); 12 so no veneno
TOLERANCIA_MARGEM = 12.0
RECUO_MAX = 40.0       # recuo de paragrafo que ainda aceita o marcador (recuado_na_linha)
NOTA_SO_NO_PE = True   # nota de rodape so no pe da coluna (ver marcadores); False so no veneno
ESTENDE_BORDA = True   # recorte passa da borda direita quando a fonte passa (ver detectar); False so no veneno
LEVA_NOTA = True       # nota de rodape vai com o item que a chama (notas_de_rodape); False so no veneno
ALTURA_MIN_ENUNCIADO = 20.0
ALTURA_MIN_SOLUCAO = 9.0
DPI_CONFERENCIA = 100
LIMITE_REDACAO = 0.001  # fracao de pixels que pode mudar ao apagar o de fora

SERIE_BUSCA = {'6ano': '06', '7ano': '07', '8ano': '08', '9ano': '09', '1em': 'em1', '2em': 'em2', '3em': 'em3'}

FONTE = {
    'id': 'obmep-portal',
    'nome': 'Portal da OBMEP',
    'url': 'https://portaldaobmep.impa.br/',
    'licenca': 'material de distribuição gratuita para uso educacional; conteúdo do IMPA/OBMEP',
}


# Pedacos do nome da fonte que marcam negrito. CMBX10 (negrito com serifa) e o
# marcador das solucoes em 6 listas do 1o medio (Circulo Trigonometrico e Leis
# dos Senos e dos Cossenos, 139 solucoes). Medido pela B2 nas 230 listas das 7
# series: span CMBX10 na margem da coluna comecando por numero so aparece
# nessas 6 listas, e sao exatamente os 139 marcadores; os outros 156 spans CMBX
# na margem sao CMBX12 de 14,3 pt, o numero do titulo de secao. Por isso entra
# CMBX10, e nao CMBX: o CMBX12 fica como esta.
FONTES_NEGRITO = ['SSBX', 'Bold', 'CMBX10']


def negrito(fonte):
    return any(p in fonte for p in FONTES_NEGRITO)


def centro_y(bb):
    return (bb[1] + bb[3]) / 2.0


# ------------------------------------------------------------------ geometria da lista

def fios_da_pagina(pg):
    """Fios verticais (divisa) e horizontais do pe da pagina, desenhados ou em imagem.

    Em Produtos Notaveis (8o ano) os dois fios sao imagens de 0,6 pt, e nao
    desenhos: sem eles o recorte do fim da coluna levava o fio do rodape.
    """
    seps, rods = [], []
    imagens = [pymupdf.Rect(b['bbox']) for b in pg.get_text('dict')['blocks'] if b['type'] == 1] if FIO_IMAGEM else []
    for r in [d['rect'] for d in pg.get_drawings()] + imagens:
        if r.width < 1.5 and r.height > 400:
            seps.append(round(r.x0 * 2) / 2)
        if r.height < 1.5 and r.width > 400 and r.y0 > pg.rect.height * 0.8:
            rods.append(round(r.y0 * 2) / 2)
    return seps, rods


def divisa_pelo_texto(doc):
    """Sem fio em pagina nenhuma: a divisa sai da margem da coluna direita.

    O comeco de linha mais frequente entre 250 pt e 360 pt e a margem da coluna
    direita; a divisa fica 10 pt antes dela, que e a distancia medida entre o
    fio e a margem nos dois modelos do Portal (291 e 301,4; 306 e 315,6).
    """
    xs = collections.Counter()
    for pg in doc:
        for b in pg.get_text('dict')['blocks']:
            if b['type'] != 0:
                continue
            for l in b['lines']:
                x = l['bbox'][0]
                if 250 < x < 360:
                    xs[round(x)] += 1
    if not xs:
        return None
    return xs.most_common(1)[0][0] - 10.0


def geometria(doc):
    """Divisa de colunas e fio do rodape do documento, com a de cada pagina a parte.

    A divisa do documento e o fio vertical mais frequente; pagina que tem o
    proprio fio usa o dela (geometria_da_pagina). Documento sem fio nenhum usa a
    divisa medida pela margem do texto (divisa_pelo_texto).
    """
    seps, rods = collections.Counter(), collections.Counter()
    for pg in doc:
        s, r = fios_da_pagina(pg)
        seps.update(s)
        rods.update(r)
    xsep = seps.most_common(1)[0][0] if seps else divisa_pelo_texto(doc)
    if xsep is None:
        return None
    return {'xsep': xsep, 'yrod': rods.most_common(1)[0][0] if rods else None,
            'origem_da_divisa': 'fio' if seps else 'margem do texto'}


def geometria_da_pagina(pg, geo):
    """A divisa e o rodape desta pagina: os do documento quando o fio esta aqui.

    Pagina com fio em outro lugar usa o dela. No rodape, figura com linha larga
    perto do pe da pagina empatava com o fio no voto (Relacao de Stewart, linhas
    em y 735 e 639) e subia o fim util da pagina, cortando o ultimo item: vale o
    fio do documento se ele esta na pagina, senao o mais baixo dentro dela.
    """
    s, r = fios_da_pagina(pg)
    r = [y for y in r if y < pg.rect.height]
    g = dict(geo)
    if s and not any(abs(x - geo['xsep']) < 1 for x in s):
        g['xsep'] = collections.Counter(s).most_common(1)[0][0]
    if r and not (geo['yrod'] and any(abs(y - geo['yrod']) < 1 for y in r)):
        g['yrod'] = max(r)
    return g


def eh_decoracao(r, geo, pg):
    """Fio separador e fio do rodape nao sao conteudo de item."""
    if r.width < 1.5 and r.height > 400 and abs(r.x0 - geo['xsep']) < 3:
        return True
    if r.height < 1.5 and r.width > 400 and geo['yrod'] and abs(r.y0 - geo['yrod']) < 3:
        return True
    return False


def elementos(pg, geo):
    """Tudo que ocupa lugar na pagina: spans, imagens e desenhos, com a coluna de cada um."""
    fundo = (geo['yrod'] - 1) if geo['yrod'] else pg.rect.height - 40
    out = []
    d = pg.get_text('dict')
    for b in d['blocks']:
        if b['type'] == 1:
            if not (FIO_IMAGEM and eh_decoracao(pymupdf.Rect(b['bbox']), geo, pg)):
                out.append({'tipo': 'img', 'bb': tuple(b['bbox'])})
            continue
        for l in b['lines']:
            for s in l['spans']:
                if s['text'].strip():
                    out.append({'tipo': 'txt', 'bb': tuple(s['bbox']), 'texto': s['text'],
                                'fonte': s['font'], 'tam': s['size']})
    for dr in pg.get_drawings():
        r = dr['rect']
        if eh_decoracao(r, geo, pg):
            continue
        out.append({'tipo': 'des', 'bb': (r.x0, r.y0, r.x1, r.y1)})
    fica = []
    for e in out:
        x0, y0, x1, y1 = e['bb']
        if y0 >= fundo:
            continue  # rodape
        cx = (x0 + x1) / 2.0
        e['col'] = 0 if cx < geo['xsep'] else 1
        e['cruza'] = x0 < geo['xsep'] - AFASTA_FIO and x1 > geo['xsep'] + AFASTA_FIO
        fica.append(e)
    return fica, fundo


def tinta_dos_dois_lados(pg, xsep, bb):
    """Ha tinta na altura de `bb` logo a esquerda e logo a direita do fio, fora dele."""
    for x0, x1 in ((xsep - 3.0, xsep - 0.8), (xsep + 0.8, xsep + 3.0)):
        clip = pymupdf.Rect(x0, bb[1] - 1.0, x1, bb[3] + 1.0)
        pix = pg.get_pixmap(dpi=288, clip=clip, colorspace=pymupdf.csGRAY)
        if not any(v < LIMIAR_TINTA for v in pix.samples):
            return False
    return True


def subida_fina(doc, pno, x0, x1, y, limite):
    """Sobe o topo da linha do marcador pela tinta a 288 dpi, sem passar do topo das caixas.

    Traco fino (o expoente de 2 elevado a x ao quadrado, solucao 19 de Equacoes
    Exponenciais, 1o medio) nao escurece a linha de 1 pt da pagina a 72 dpi, e a
    subida parava 3 pt abaixo dele: o traco ia para o recorte de cima.
    """
    if y - limite < 0.25:
        return y
    tmp = pymupdf.open()
    tmp.insert_pdf(doc, from_page=pno, to_page=pno)
    pix = tmp[0].get_pixmap(dpi=288, colorspace=pymupdf.csGRAY, clip=pymupdf.Rect(x0, limite, x1, y + 0.5))
    tmp.close()
    w, h, smp = pix.width, pix.height, pix.samples
    r = min(h, int(round((y - limite) * 4)))  # a linha fina logo acima de y
    while r - 1 >= 0 and any(smp[(r - 1) * w + x] < LIMIAR_TINTA for x in range(w)):
        r -= 1
    return max(limite, limite + r / 4.0)


def descida_fina(doc, pno, x0, x1, y, limite):
    """Desce de y pela tinta a 288 dpi enquanto ela continua, sem passar de limite."""
    if limite - y < 0.25:
        return y
    tmp = pymupdf.open()
    tmp.insert_pdf(doc, from_page=pno, to_page=pno)
    pix = tmp[0].get_pixmap(dpi=288, colorspace=pymupdf.csGRAY, clip=pymupdf.Rect(x0, y, x1, limite))
    tmp.close()
    w, h, smp = pix.width, pix.height, pix.samples
    r = 0
    while r < h and any(smp[r * w + x] < LIMIAR_TINTA for x in range(w)):
        r += 1
    return min(limite, y + r / 4.0)


def tinta_extrema(doc, pno, x0, y0, x1, y1, lado):
    """A tinta mais a esquerda (ou a direita) na faixa, a 288 dpi, ou None se a faixa esta limpa."""
    if x1 - x0 < 0.25 or y1 - y0 < 0.25:
        return None
    tmp = pymupdf.open()
    tmp.insert_pdf(doc, from_page=pno, to_page=pno)
    pix = tmp[0].get_pixmap(dpi=288, colorspace=pymupdf.csGRAY, clip=pymupdf.Rect(x0, y0, x1, y1))
    tmp.close()
    w, h, smp = pix.width, pix.height, pix.samples
    cols = [x for x in range(w) if any(smp[y * w + x] < LIMIAR_TINTA for y in range(h))]
    if not cols:
        return None
    return x0 + (cols[0] / 4.0 if lado == 'esquerda' else (cols[-1] + 1) / 4.0)


def topo_da_tinta(doc, pno, r):
    """A linha mais alta com tinta dentro do retangulo, a 288 dpi, ou None."""
    if r.width < 0.25 or r.height < 0.25:
        return None
    tmp = pymupdf.open()
    tmp.insert_pdf(doc, from_page=pno, to_page=pno)
    pix = tmp[0].get_pixmap(dpi=288, colorspace=pymupdf.csGRAY, clip=r)
    tmp.close()
    w, h, smp = pix.width, pix.height, pix.samples
    for y in range(h):
        if any(smp[y * w + x] < LIMIAR_TINTA for x in range(w)):
            return r.y0 + y / 4.0
    return None


def divisa_fina(doc, pno, x0, x1, y_de, y_ate):
    """Ponto inteiro no ultimo vao em branco entre y_de e y_ate, pela tinta a 288 dpi, ou None."""
    tmp = pymupdf.open()
    tmp.insert_pdf(doc, from_page=pno, to_page=pno)
    pix = tmp[0].get_pixmap(dpi=288, colorspace=pymupdf.csGRAY, clip=pymupdf.Rect(x0, y_de, x1, y_ate))
    tmp.close()
    w, h, smp = pix.width, pix.height, pix.samples
    k = 4.0
    tinta = [any(smp[y * w + x] < LIMIAR_TINTA for x in range(w)) for y in range(h)]
    fim = h
    while fim > 0 and tinta[fim - 1]:
        fim -= 1  # a tinta do item de baixo, no fim da faixa
    ini = fim
    while ini > 0 and not tinta[ini - 1]:
        ini -= 1  # o vao em branco acima dela
    if ini == fim or ini == 0:
        return None
    a, b = y_de + ini / k, y_de + fim / k
    n = math.floor(b)
    return float(n) if n >= a else None


def faixa_da_coluna(col, geo, pg):
    if col == 0:
        return MARGEM_X, geo['xsep'] - AFASTA_FIO
    return geo['xsep'] + AFASTA_FIO, pg.rect.width - MARGEM_X


def margem_da_coluna(col, geo):
    return 29.5 if col == 0 else geo['xsep'] + 10.0


def marcadores(els, geo, em_solucoes, ja_teve_enunciado=False, secao_1_abre_solucoes=True):
    """Marcadores de item e titulos de secao, com o jeito como cada um foi achado.

    Lista sem o titulo "Respostas e Solucoes" (8o ano, Potenciacao): as
    solucoes comecam quando a secao "1 Exercicios Introdutorios" reaparece
    depois de ja ter havido enunciados. Esse titulo sai como titulo_solucoes
    implicito.
    """
    txt = [e for e in els if e['tipo'] == 'txt']
    out = []
    virou_solucoes = None
    # nota de rodape: fio curto na margem da coluna com texto miudo logo abaixo
    # (Razoes Trigonometricas, solucao 16 levava a nota "2O antigo livro chines
    # Jiuzhang..." de outro exercicio). A regiao da nota fica fora de todo recorte.
    for e in els:
        if e['tipo'] != 'des':
            continue
        x0, y0, x1, y1 = e['bb']
        if y1 - y0 > 1.5 or not (40 <= x1 - x0 <= 140) or abs(x0 - margem_da_coluna(e['col'], geo)) > 3:
            continue
        abaixo = [o for o in txt if o['col'] == e['col'] and 0 <= o['bb'][1] - y0 <= 12]
        # a nota fica no pe da coluna: abaixo dela so texto miudo. A barra de uma
        # fracao na margem, com o denominador miudo embaixo, parecia nota e cortava
        # o resto do item (Inequacoes Mistas, 1o medio, exercicio 9: o "e igual a"
        # e as alternativas saiam do recorte). Medido nas 7 series: as 25 notas
        # de verdade nao tem texto de corpo normal abaixo; a barra tinha 243.
        corpo_abaixo = any(o['col'] == e['col'] and o['bb'][1] > y0 + 0.5 and o['tam'] > 8.5 for o in txt)
        if abaixo and all(o['tam'] <= 8.5 for o in abaixo) and not (NOTA_SO_NO_PE and corpo_abaixo):
            out.append({'tipo': 'nota', 'col': e['col'], 'el': e})
    for e in txt:
        t = e['texto'].strip()
        if re.match(r'^Respostas\s*(e\s*Solu)?', t) and negrito(e['fonte']):
            out.append({'tipo': 'titulo_solucoes', 'col': e['col'], 'el': e})
            virou_solucoes = e
            continue
        # o bloco de creditos do fim do documento ("Elaborado por ...", "Produzido
        # por Arquimedes ...") fecha o ultimo item, como um titulo de secao: sem
        # isto ele entrava no recorte do ultimo exercicio (olho de fora, 9 casos)
        # (no modelo CM vem uma palavra por span: "Produzido", "por", "Arquimedes")
        # e nas versaletes do Palladio a inicial vem separada: "E" + "laborado por".
        # Por isso vale o texto da linha a partir deste span.
        if CREDITO_MATERIAL and re.match(r'^M', t):
            # a fonte parte o span ("Ma" + "terial elaborado por"): vale o texto da
            # linha a partir deste span, como no bloco de creditos do fim
            cy_m = centro_y(e['bb'])
            linha = sorted([o for o in txt if o['col'] == e['col'] and o['bb'][1] < e['bb'][3] - 1
                            and o['bb'][3] > e['bb'][1] + 1 and abs(centro_y(o['bb']) - cy_m) < 4
                            and 0 <= o['bb'][0] - e['bb'][0] < 260], key=lambda o: o['bb'][0])
            t = re.sub(r'\s+', ' ', ' '.join(o['texto'] for o in linha)).strip()
            # nas versaletes do Palladio a inicial vem num span proprio ("M" + "aterial")
            t = re.sub(r'^([A-Z]) (?=[a-z])', r'\1', t)
        if CREDITO_MATERIAL and re.match(r'^Material\s*elaborado por\b', t):
            # credito do autor no pe da ultima coluna da lista ("Material elaborado
            # por <nome>.", corpo 9, centrado): fecha o item, como o bloco de creditos
            # do fim do documento. Sem isto entrava no recorte de 23 solucoes
            out.append({'tipo': 'creditos', 'col': e['col'], 'el': e})
            continue
        if re.match(r'^[EP]$|^(Elaborado|Produzido)\b', t) or 'cursoarquimedes' in t:
            cy_e = centro_y(e['bb'])
            # sobreposicao vertical, e nao centro: a inicial tem corpo maior que a versalete
            linha = sorted([o for o in txt if o['col'] == e['col'] and o['bb'][1] < e['bb'][3] - 1
                            and o['bb'][3] > e['bb'][1] + 1 and abs(centro_y(o['bb']) - cy_e) < 4
                            and 0 <= o['bb'][0] - e['bb'][0] < 260], key=lambda o: o['bb'][0])
            t = re.sub(r'\s+', ' ', ' '.join(o['texto'] for o in linha)).strip()
            t = re.sub(r'^([EP]) (laborado|roduzido)', r'\1\2', t)
        if re.match(r'^(Elaborado|Produzido)\b', t) or 'cursoarquimedes' in t:
            out.append({'tipo': 'creditos', 'col': e['col'], 'el': e})
            continue
        if not negrito(e['fonte']):
            continue
        # titulo de secao: numero grande sozinho ou "Exercicios ..." grande
        if e['tam'] > 12.5 and (re.match(r'^\d+$', t) or t.startswith('Exerc')):
            # pelo texto da linha, e nao pelo "1": no modelo CM o numero da secao e
            # CMBX12, que nao conta como negrito (ver FONTES_NEGRITO)
            if (secao_1_abre_solucoes and t.startswith('Exerc') and ja_teve_enunciado and not em_solucoes
                    and virou_solucoes is None and 'Introdut' in _linha_a_partir(e, txt)):
                out.append({'tipo': 'titulo_solucoes', 'col': e['col'], 'el': e, 'implicito': True})
                virou_solucoes = e
                continue
            out.append({'tipo': 'secao', 'col': e['col'], 'el': e})
            continue
        if e['tam'] > 12.5:
            continue
        if abs(e['bb'][0] - margem_da_coluna(e['col'], geo)) > TOLERANCIA_MARGEM and not recuado_na_linha(e, txt, geo):
            continue
        vizinhos = sorted([o for o in txt if o is not e and o['col'] == e['col']
                           and abs(centro_y(o['bb']) - centro_y(e['bb'])) < 3
                           and 0 <= o['bb'][0] - e['bb'][2] < 60], key=lambda o: o['bb'][0])
        solucoes_agora = em_solucoes or virou_solucoes is not None
        if not solucoes_agora and t.startswith('Exerc') and not re.match(r'^Exerc\S*cios', t):
            m = re.match(r'^Exerc\S*cio\s*(\d+)\s*\.?', t)
            if m:
                out.append({'tipo': 'enunciado', 'col': e['col'], 'el': e, 'numero': int(m.group(1)), 'forma': 'junto'})
            elif vizinhos and negrito(vizinhos[0]['fonte']) and re.match(r'^\d+', vizinhos[0]['texto'].strip()):
                n = int(re.match(r'^\d+', vizinhos[0]['texto'].strip()).group(0))
                out.append({'tipo': 'enunciado', 'col': e['col'], 'el': e, 'numero': n, 'forma': 'separado'})
            continue
        if solucoes_agora:
            m = re.match(r'^(\d+)\s*(\.?)', t)
            if not m:
                continue
            tem_ponto = m.group(2) == '.' or (vizinhos and vizinhos[0]['texto'].strip().startswith('.'))
            if tem_ponto:
                out.append({'tipo': 'solucao', 'col': e['col'], 'el': e, 'numero': int(m.group(1)),
                            'forma': 'junto' if m.group(2) else 'separado'})
    return out


def recuado_na_linha(e, txt, geo):
    """"Exercicio" com recuo de paragrafo: ate RECUO_MAX do fim da margem e primeiro da linha.

    O LaTeX recua o paragrafo que vem depois de uma formula centrada, e o
    marcador sai 23,5 pt para dentro (Exercicio 7 de Exercicios sobre Fracoes,
    6o ano: o unico em 4.455 marcadores das 7 series). Nada pode vir antes dele
    na mesma linha visual, senao e palavra no meio do texto.
    """
    t = e['texto'].strip()
    if not t.startswith('Exerc') or re.match(r'^Exerc\S*cios', t):
        return False
    recuo = e['bb'][0] - margem_da_coluna(e['col'], geo)
    if not (0 < recuo <= RECUO_MAX):
        return False
    cy = centro_y(e['bb'])
    return not any(o is not e and o['col'] == e['col'] and abs(centro_y(o['bb']) - cy) < 4
                   and o['bb'][2] <= e['bb'][0] + 0.5 for o in txt)


def _linha_a_partir(e, txt):
    """Texto da linha visual de `e`, dele para a direita, com os acentos recompostos."""
    cy = centro_y(e['bb'])
    linha = sorted([o for o in txt if o['col'] == e['col'] and abs(centro_y(o['bb']) - cy) < 4
                    and o['bb'][0] >= e['bb'][0] - 0.5], key=lambda o: o['bb'][0])
    return portal.recompor(' '.join(o['texto'] for o in linha))


def topo_da_linha(marc, els):
    """Topo da linha visual do marcador.

    O texto ao lado pode subir 2 pt acima dele, e um glifo alto da mesma linha
    (o radical de "Ja sabemos que raiz de 1 = 1", Conjuntos Numericos,
    exercicio 3) sobe mais: o topo dele virava um pedaco de 5 pt grudado no
    item anterior e saia cortado deste. Entra todo texto que atravessa a
    linha do marcador, ate TOPO_MAX pt acima dela: a fracao de fracoes na
    linha do rotulo (Numeros Racionais, 7o ano, exercicio 22) sobe 22,5 pt,
    e com 12 o numerador ficava fora de todo recorte.
    """
    mb = marc['el']['bb']
    cy = centro_y(mb)
    topo, pe = mb[1], mb[3]
    txt = [e for e in els if e['col'] == marc['col'] and e['tipo'] == 'txt' and e['bb'][1] >= mb[1] - TOPO_MAX]
    # em cadeia: o numerador de uma fracao encosta na linha, e o expoente do
    # numerador encosta no numerador (Conjuntos Numericos, solucao 18, "2 a 12
    # sobre 2 a 12"): o expoente tambem e desta linha
    mudou = True
    while mudou:
        mudou = False
        for e in txt:
            # "encosta" com ENCOSTA pt de folga: a seta sobre "LB" na linha do
            # rotulo 12 de Pontos, Retas e Planos (3o medio) acaba 0,1 pt acima da
            # caixa do rotulo, e ficava no recorte de cima
            # (so o miudo: a linha de 10 pt do item de cima tambem encosta, e nao e desta)
            folga = ENCOSTA if e.get('tam', 99) <= MIUDO_QUE_ENCOSTA else 0.0
            # e a sobreposicao com a linha tem de ser boa parte da caixa: as letras
            # "a" e "b" que rotulam a figura do exercicio de cima (8o ano, Produtos
            # Notaveis 11 e 12) passam 0,8 pt na linha do rotulo de baixo, 8% da
            # altura delas, e entravam no recorte do 12
            sobre = min(e['bb'][3], pe) - max(e['bb'][1], topo)
            alt = max(0.1, e['bb'][3] - e['bb'][1])
            basta = sobre >= SOBREPOSICAO_MIN * alt or sobre >= 2.5
            if e['bb'][1] < topo and (abs(centro_y(e['bb']) - cy) < 4
                                      or (e['bb'][1] < pe and e['bb'][3] > topo - folga and (basta or folga > 0))):
                topo = e['bb'][1]
                mudou = True
    # a barra de um radical longo ou de uma fracao e desenho, nao texto
    # (Conjuntos Numericos, exercicio 21): barra fina ate 6 pt acima da linha
    barras = [e['bb'][1] for e in els if e['col'] == marc['col'] and e['tipo'] == 'des'
              and e['bb'][3] - e['bb'][1] < 1.5 and topo - 6 <= e['bb'][1] < topo]
    return min([topo] + barras)


LIMIAR_TINTA = 200  # cinza abaixo disto e tinta


def topo_sem_cortar(doc, pno, x0, x1, y_t, limite):
    """Sobe o corte enquanto ele passa por cima de tinta, ate o comeco da tinta.

    Nem toda linha se separa da de cima por um corte reto: o "b" que rotula a
    figura do exercicio 11 de Produtos Notaveis (8o ano) cobre 2,2 pt da linha do
    rotulo do 12, e cortar em qualquer ponto parte o "b" ou o rotulo. Entre cortar
    e levar junto, leva junto: o corte sobe ate o alto daquele bloco de tinta.
    """
    if not CORTE_SEM_TINTA:
        return y_t
    # pelo ponto inteiro: a borda do recorte e inteira, e o arredondamento e que
    # pode jogar o corte para dentro da tinta
    corte = float(math.floor(y_t))
    alto = max(0.0, min(limite, corte) - 14.0)
    if corte - alto < 0.25:
        return y_t
    tmp = pymupdf.open()
    tmp.insert_pdf(doc, from_page=pno, to_page=pno)
    pix = tmp[0].get_pixmap(dpi=288, colorspace=pymupdf.csGRAY, clip=pymupdf.Rect(x0, alto, x1, corte + 0.25))
    tmp.close()
    w, h, smp = pix.width, pix.height, pix.samples
    tinta = [any(smp[y * w + x] < LIMIAR_TINTA for x in range(w)) for y in range(h)]
    r = h - 1  # a linha logo abaixo do corte
    if r < 1 or not tinta[r] or not tinta[r - 1]:
        return y_t
    while r > 0 and tinta[r - 1]:
        r -= 1
    return max(alto, alto + r / 4.0 - 0.25)


def topo_com_barra(els, marc, y_t):
    """Sobe o topo ate a barra de segmento que cobre texto da linha do marcador.

    A barra sobre "BO" e "DO" (solucao 10 de Relacoes Metricas, 9o ano) fica 1,2 pt
    acima da linha, com um vao em branco: a subida pela tinta nao chega nela, e ela
    caia no recorte do item de cima. So a barra fina que cobre, em x, texto desta
    linha, e no maximo 6 pt acima do marcador.
    """
    if not BARRA_ACIMA:
        return y_t
    mb = marc['el']['bb']
    for e in els:
        if (e['col'] == marc['col'] and e['tipo'] == 'des' and e['bb'][3] - e['bb'][1] < 1.5
                and mb[1] - 6 <= e['bb'][1] < y_t
                and any(o['tipo'] == 'txt' and o['col'] == marc['col'] and o['bb'][0] < e['bb'][2]
                        and o['bb'][2] > e['bb'][0] and abs(centro_y(o['bb']) - centro_y(mb)) < 4 for o in els)):
            y_t = min(y_t, e['bb'][1] - 0.25)
    return y_t


def topo_pela_tinta(topo_caixas, marc, tinta_col):
    """O topo da linha do marcador pela tinta, limitado pelo topo das caixas.

    A caixa de fonte do radical comeca uns 7 pt acima do desenho dele e puxava
    o topo para dentro da linha de cima, cortando os descendentes do item
    anterior (Conjuntos Numericos, exercicios 20 e 21). Sobe do marcador
    enquanto houver tinta continua, e nunca alem do topo das caixas.
    """
    y = int(marc['el']['bb'][1])
    limite = int(math.floor(topo_caixas))
    while y - 1 >= limite and 0 <= y - 1 < len(tinta_col) and tinta_col[y - 1]:
        y -= 1
    return max(topo_caixas, float(y)) if y > limite else topo_caixas


def linhas_com_tinta(doc, pno, geo):
    """Por coluna, as linhas de 1 pt que tem pixel escuro na pagina renderizada.

    O aperto do recorte e pela tinta, e nao pela caixa dos objetos: ha desenhos
    que o PDF recorta por clip e que nao aparecem na pagina, mas cuja caixa
    esticava o recorte (enunciado 7 de Areas, 438 pt de altura para duas
    linhas). Renderiza uma copia limpa da pagina (ver svg_do_pedaco).
    """
    tmp = pymupdf.open()
    tmp.insert_pdf(doc, from_page=pno, to_page=pno)
    pix = tmp[0].get_pixmap(dpi=72, colorspace=pymupdf.csGRAY)
    tmp.close()
    w, h, s = pix.width, pix.height, pix.samples
    out = {}
    for col in (0, 1):
        x0, x1 = faixa_da_coluna(col, geo, doc[pno])
        a, b = max(0, int(x0 + 1)), min(w, int(x1))
        out[col] = [any(s[y * w + x] < LIMIAR_TINTA for x in range(a, b)) for y in range(h)]
    # Conteudo em cor clara (rotulo e caixa cinza de uma figura: "BH[180]",
    # Nocoes Basicas, solucao 16) fica acima do limiar e sairia do recorte. Nao
    # basta baixar o limiar: a borda suavizada de todo glifo preto tambem passa
    # a contar e quase todo recorte cresce 1 pt. Entao o objeto claro conta pela
    # sua caixa.
    for y0, y1, cx in objetos_claros(doc[pno]):
        col = 0 if cx < geo['xsep'] else 1
        for y in range(max(0, int(y0)), min(h, int(math.ceil(y1)))):
            out[col][y] = True
    return out


LUMINANCIA_CLARA = (LIMIAR_TINTA, 250)  # de 255: visivel, mas acima do limiar de tinta


def _luminancia(cor):
    if cor is None:
        return None
    if isinstance(cor, int):
        r, g, b = (cor >> 16) & 255, (cor >> 8) & 255, cor & 255
    else:
        if len(cor) == 1:
            return 255 * cor[0]
        if len(cor) == 4:  # CMYK
            c, m, yy, k = cor
            r, g, b = 255 * (1 - c) * (1 - k), 255 * (1 - m) * (1 - k), 255 * (1 - yy) * (1 - k)
        else:
            r, g, b = [255 * v for v in cor[:3]]
    return 0.299 * r + 0.587 * g + 0.114 * b


def objetos_claros(pg):
    """(y0, y1, centro x) de texto e desenho em cor clara, mas visivel."""
    a, b = LUMINANCIA_CLARA
    out = []
    for bl in pg.get_text('dict')['blocks']:
        if bl['type'] != 0:
            continue
        for l in bl['lines']:
            for sp in l['spans']:
                lum = _luminancia(sp.get('color'))
                if sp['text'].strip() and lum is not None and a <= lum < b:
                    out.append((sp['bbox'][1], sp['bbox'][3], (sp['bbox'][0] + sp['bbox'][2]) / 2))
    for d in pg.get_drawings():
        for chave in ('color', 'fill'):
            lum = _luminancia(d.get(chave))
            if lum is not None and a <= lum < b:
                r = d['rect']
                out.append((r.y0, r.y1, (r.x0 + r.x1) / 2))
                break
    return out


def caixa_do_rotulo(caracteres, marc, tipo, numero):
    """Caixa so dos caracteres do rotulo ("Exercicio 7." ou "7."), sem o texto que segue.

    O span negrito as vezes traz palavras depois do numero ("40. Deduza a
    formula"); a caixa para no ponto depois do numero. O app cobre esta caixa
    para renumerar, entao caixa larga demais apagaria texto.

    Embaixo, a caixa para um pouco abaixo da linha de base (o rotulo nao tem
    descendente), e nao no pe da caixa da fonte, que alcancava o traco do
    radical da linha de baixo ("tem entre raiz de 8", Conjuntos Numericos,
    exercicio 10): cobrir de branco apagaria o radical. Em cima fica a caixa
    da fonte, que cobre o acento do i de Exercicio.
    """
    x0 = marc['el']['bb'][0]
    cy = centro_y(marc['el']['bb'])
    # centro a menos de 2 pt: o radical da mesma linha, com o centro 3,4 pt mais
    # baixo, entrava entre o "0" e o "." (solucao 10 de Equacoes)
    cand = sorted([c for c in caracteres if abs((c[0][1] + c[0][3]) / 2.0 - cy) < 2.0
                   and x0 - 1 <= c[0][0] <= x0 + 140], key=lambda c: c[0][0])
    alvo = re.compile((r'^Exerc\S*cio\s*%d\s*\.$' if tipo == 'enunciado' else r'^%d\s*\.$') % numero)
    texto, caixa = '', None
    for bb, ch, base, corpo in cand:
        texto += ch
        if ch.strip():
            justa = (bb[0], bb[1], bb[2], base + 0.12 * corpo)
            caixa = justa if caixa is None else (min(caixa[0], justa[0]), min(caixa[1], justa[1]),
                                                 max(caixa[2], justa[2]), max(caixa[3], justa[3]))
        if alvo.match(texto.strip()):
            return caixa
    return None


def borda_cruza_tinta(doc, pno, caixa, cache):
    """A borda de cima ou a de baixo da caixa passa por cima de tinta da pagina?

    Se passa, cobrir a caixa de branco apagaria um pedaco de outra coisa: a
    fonte as vezes encosta a linha de baixo no rotulo (Nocoes Basicas de
    Conjuntos, solucao 6: o parentese de "a)" sobe ate a linha do "6.").
    Renderiza uma copia limpa da pagina, uma vez por pagina.
    """
    if pno not in cache:
        tmp = pymupdf.open()
        tmp.insert_pdf(doc, from_page=pno, to_page=pno)
        cache[pno] = tmp[0].get_pixmap(dpi=150, colorspace=pymupdf.csGRAY)
        tmp.close()
    pix = cache[pno]
    k = 150 / 72.0
    w, s = pix.width, pix.samples
    xa, xb = max(0, int(caixa[0] * k)), min(w, int(math.ceil(caixa[2] * k)))
    for y in (int(caixa[1] * k), int(math.ceil(caixa[3] * k)) - 1):
        if 0 <= y < pix.height and any(s[y * w + x] < 128 for x in range(xa, xb)):
            return True
    return False


def detectar(doc, secao_1_abre_solucoes=True):
    """Acha os itens de uma lista. Devolve enunciados e solucoes com os seus pedacos.

    secao_1_abre_solucoes=False desliga a regra da lista sem titulo de solucoes
    (so para o veneno da prova).
    """
    geo_doc = geometria(doc)
    if not geo_doc:
        return {'erro': 'sem divisa de colunas (nem fio, nem margem de texto)'}
    divisas = collections.Counter()
    pedacos = {'enunciado': collections.defaultdict(list), 'solucao': collections.defaultdict(list)}
    ordem = {'enunciado': [], 'solucao': []}
    rotulos = {}
    rotulos_inseguros = []
    paginas_150 = {}
    formas = collections.Counter()
    cruzados = []
    pagina_solucoes = None
    regioes_nota = []  # (pno, col, y do fio, y do fim, xsep, x0, x1)
    solucoes_sem_titulo = False
    em_solucoes = False
    aberto = None  # (tipo, numero, chave)
    chave_seq = 0
    for pno in range(1, doc.page_count):
        pg = doc[pno]
        geo = geometria_da_pagina(pg, geo_doc)
        divisas[geo['xsep']] += 1
        els, fundo = elementos(pg, geo)
        tinta = linhas_com_tinta(doc, pno, geo)
        # texto que a fonte passa por cima do fio ("+ 49", solucao 2 de Equacoes):
        # nenhum recorte de coluna pega esse trecho inteiro
        cruzam = [(e['bb'][1], e['bb'][3]) for e in els if e['tipo'] == 'txt'
                  and e['bb'][0] < geo['xsep'] - 0.5 and e['bb'][2] > geo['xsep'] + 0.5]
        # e traco reto que cruza o fio: a tabela da solucao 19 de Operacoes com
        # Numeros Naturais (6o ano) passa 2 pt do fio, e a borda direita dela
        # saia cortada de um recorte e colada no da outra coluna. So traco reto,
        # e so com tinta dos dois lados do fio: a caixa de uma curva, ou de um
        # traco que a figura recorta por clip (Angulos, 8o ano, exercicio 14),
        # cruza o fio sem que a tinta cruze
        if CALHA_TRACO:
            cruzam += [(e['bb'][1], e['bb'][3]) for e in els if e['tipo'] == 'des' and e['cruza']
                       and min(e['bb'][2] - e['bb'][0], e['bb'][3] - e['bb'][1]) < 1.5
                       and tinta_dos_dois_lados(pg, geo['xsep'], e['bb'])]
        caracteres = [(c['bbox'], c['c'], c['origin'][1], sp['size']) for b in pg.get_text('rawdict')['blocks']
                      if b['type'] == 0 for l in b['lines'] for sp in l['spans'] for c in sp['chars']]
        for e in els:
            if e['cruza']:
                cruzados.append({'pagina': pno + 1, 'bb': [round(v, 1) for v in e['bb']]})
        marcs = marcadores(els, geo, em_solucoes, bool(ordem['enunciado']), secao_1_abre_solucoes)
        for col in (0, 1):
            cx0, cx1 = faixa_da_coluna(col, geo, pg)
            ms = sorted([m for m in marcs if m['col'] == col], key=lambda m: m['el']['bb'][1])
            cortes = []
            for m in ms:
                topo_caixas = topo_da_linha(m, els)
                y_t = topo_pela_tinta(topo_caixas, m, tinta[col])
                if SUBIDA_FINA:
                    y_t = subida_fina(doc, pno, cx0, cx1, y_t, topo_caixas)
                    # o que e miudo e encosta por cima da linha (a seta de 7,9 pt sobre
                    # "LB") tem tinta propria, separada da linha por um vao: vale o topo
                    # dela. So miudo: a ultima linha do item de cima (10 pt) tambem pode
                    # encostar, e o topo subia ate ela (6o ano, Divisibilidade, solucao 19)
                    mb = m['el']['bb']
                    for e in (els if TINTA_DO_QUE_ENCOSTA else []):
                        if (e['col'] == m['col'] and e['tipo'] == 'txt' and e.get('tam', 99) <= MIUDO_QUE_ENCOSTA
                                and mb[1] - ENCOSTA < e['bb'][3] <= mb[1] + ENCOSTA
                                and e['bb'][1] < y_t):
                            y_e = topo_da_tinta(doc, pno, pymupdf.Rect(e['bb']))
                            if y_e is not None:
                                y_t = max(topo_caixas, min(y_t, y_e))
                    y_t = topo_com_barra(els, m, y_t)
                    y_t = topo_sem_cortar(doc, pno, cx0, cx1, y_t, topo_caixas)
                cortes.append((y_t, m))
            lim_col = [(y, m) for y, m in cortes]
            els_col = [e for e in els if e['col'] == col]
            inicios = [None] + lim_col
            for i in range(len(inicios)):
                if i == 0:
                    y_ini, m = -1.0, None
                else:
                    y_ini, m = inicios[i]
                y_fim = inicios[i + 1][0] if i + 1 < len(inicios) else fundo
                if m is not None:
                    if m['tipo'] == 'titulo_solucoes':
                        em_solucoes = True
                        pagina_solucoes = pagina_solucoes or pno + 1
                        if m.get('implicito'):
                            solucoes_sem_titulo = True
                        aberto = None
                        continue
                    if m['tipo'] == 'nota':
                        # pula a regiao da nota sem fechar o item aberto; a nota e
                        # guardada para ir com o item que a chama (contrato, 8a)
                        regioes_nota.append((pno, col, m['el']['bb'][1], min(y_fim, fundo), geo['xsep'], cx0, cx1))
                        continue
                    if m['tipo'] in ('secao', 'creditos'):
                        aberto = None
                        continue
                    tipo = m['tipo']
                    if tipo == 'enunciado' and em_solucoes:
                        continue
                    formas[(tipo, m['forma'])] += 1
                    texto_pos = m['el']['texto'].strip()
                    continua = (tipo == 'solucao' and ordem['solucao'] and ordem['solucao'][-1][0] == m['numero']
                                and continua_o_anterior(_depois_do_numero(m, els_col)))
                    if continua:
                        chave = ordem['solucao'][-1][1]
                    else:
                        chave_seq += 1
                        chave = chave_seq
                        ordem[tipo].append((m['numero'], chave))
                        rotulos[chave] = caixa_do_rotulo(caracteres, m, tipo, m['numero'])
                        if rotulos[chave] and borda_cruza_tinta(doc, pno, rotulos[chave], paginas_150):
                            rotulos[chave] = None
                            rotulos_inseguros.append({'tipo': tipo, 'numero': m['numero'], 'pagina': pno + 1})
                    aberto = (tipo, m['numero'], chave)
                    del texto_pos
                if aberto is None:
                    continue
                # linhas com tinta entre o comeco deste trecho e o proximo corte
                ya = 0 if m is None else max(0, int(y_ini - 2))
                yb = min(len(tinta[col]), int(y_fim - 0.5), int(fundo))
                com_tinta = [y for y in range(ya, yb) if tinta[col][y]]
                if not com_tinta:
                    continue
                y0 = com_tinta[0] - FOLGA
                y1 = com_tinta[-1] + 1 + FOLGA
                if SUBIDA_FINA:
                    # e desce pela tinta fina: a linha de 0,5 pt do eixo da figura da
                    # solucao 6 de Circulo Trigonometrico (2o medio) passa 9 pt da ultima
                    # linha que a pagina a 72 dpi mostra, e saia cortada
                    y1 = max(y1, descida_fina(doc, pno, cx0, cx1, com_tinta[-1] + 1, min(y_fim - 0.5, fundo)) + FOLGA)
                if m is not None:
                    # o pedaco do marcador comeca no topo da linha do marcador, que e a
                    # caixa da fonte e fica um pouco acima da tinta
                    y0 = min(y0, y_ini)
                y0 = max(y0, y_ini - FOLGA if m is not None else 0)
                y1 = min(y1, y_fim - 0.5, fundo)
                anteriores = [p for lst in pedacos.values() for ps in lst.values() for p in ps
                              if p['pno'] == pno and p['col'] == col and p['rect'][3] <= y_ini + FOLGA]
                # caixa em ponto inteiro, arredondada para dentro do lado do fio: com
                # origem fracionaria o pixmap do MuPDF alinha a origem a grade de
                # pixels e o Chrome nao, e a prova de fidelidade media 1,8% de
                # diferenca num recorte identico (0,01% com a origem inteira)
                y0 = math.floor(y0)
                # o fim arredonda para cima, mas nunca passa do topo da linha seguinte:
                # 1 pt a mais invadia o radical da primeira linha do item de baixo, que
                # entao perdia o topo (Equacoes, solucoes 17 e 18)
                y1 = min(math.ceil(y1), math.floor(y_fim))
                # quando a folga de baixo encosta no corte seguinte, a divisa sai da
                # tinta lida fina (288 dpi), num ponto inteiro do vao em branco: a
                # tinta do item de baixo pode comecar uns decimos acima da linha de
                # 1 pt em que a pagina a 72 dpi a mostra (o expoente do exercicio 20
                # de Equacoes Algebricas, 3o medio, em y 79,9, com o 19 acabando em 80)
                if FOLGA_ANTES_DO_PROXIMO and i + 1 < len(inicios) and y1 >= math.floor(y_fim) - 1:
                    k = divisa_fina(doc, pno, cx0, cx1, com_tinta[-1], math.floor(y_fim) + 1)
                    if k is not None:
                        y1 = min(y1, k)
                if anteriores:
                    y0 = max(y0, max(p['rect'][3] for p in anteriores))
                # a coluna da direita vai ate 24 pt da borda da pagina, e a fonte as
                # vezes passa disso com o ponto final ou o expoente de uma formula
                # longa (15 glifos nas 7 series, ate 594,7 pt): so entao o recorte
                # passa da borda, ate 4 pt do fim da pagina
                x_dir = cx1
                if col == 1 and ESTENDE_BORDA:
                    alem = [e['bb'][2] for e in els_col if e['bb'][2] > cx1 and e['bb'][1] < y1 and e['bb'][3] > y0]
                    if alem:
                        # ate a tinta, e nao ate a caixa: desenho recortado por clip tem
                        # caixa ate a borda da pagina (Areas, 9o ano, exercicio 3)
                        x_t = tinta_extrema(doc, pno, cx1, y0, min(pg.rect.width - 4.0, max(alem) + 1.0), y1, 'direita')
                        if x_t is not None:
                            x_dir = min(pg.rect.width - 4.0, x_t + 1.0)
                # na coluna da esquerda, a linha que vai ate quase o fio sem cruzar ("...,"
                # no fim de uma sequencia de simbolos, Exercicios sobre Divisibilidade, 6o
                # ano, exercicio 18) tinha o ultimo glifo cortado pela borda, 1,2 pt antes
                # do fio. A borda acompanha a tinta ate 0,3 pt do fio; o fio (0,4 pt de
                # largura) fica fora. Conteudo que cruza o fio e a regra de exclusao por calha.
                if col == 0 and ESTENDE_BORDA:
                    alem = [e['bb'][2] for e in els_col if e['tipo'] == 'txt' and e['bb'][2] > cx1
                            and e['bb'][1] < y1 and e['bb'][3] > y0 and not e['cruza']]
                    if alem:
                        x_dir = min(geo['xsep'] - 0.3, max(alem) + 0.5)
                if x_dir == cx1:
                    x_fim = math.floor(x_dir)
                elif col == 0:
                    x_fim = math.floor(x_dir * 10) / 10.0  # para baixo: o fio fica fora
                else:
                    x_fim = math.ceil(x_dir)
                # e a borda esquerda da coluna da esquerda acompanha figura que comeca
                # antes da margem (a imagem da solucao em x 18 no exercicio 2 de PAs
                # Inteiras, 1o medio, com a caixa em 24), ate 4 pt da pagina
                x_ini = math.floor(cx0) if col == 0 else math.ceil(cx0)
                if col == 0 and ESTENDE_BORDA:
                    antes = [e['bb'][0] for e in els_col if e['bb'][0] < x_ini and e['bb'][1] < y1 and e['bb'][3] > y0]
                    if antes:
                        x_t = tinta_extrema(doc, pno, max(4.0, min(antes) - 0.5), y0, x_ini, y1, 'esquerda')
                        if x_t is not None:
                            x_ini = math.floor(max(4.0, x_t - 0.5))
                r = (float(x_ini), float(y0), float(x_fim), float(y1))
                transborda = any(r[1] <= (a + b) / 2.0 <= r[3] for a, b in cruzam)
                pedacos[aberto[0]][aberto[2]].append({'pno': pno, 'col': col, 'rect': r, 'xsep': geo['xsep'],
                                                     'transborda': transborda})
    geo_doc['divisas_por_pagina'] = {str(k): v for k, v in sorted(divisas.items())}
    notas = notas_de_rodape(doc, regioes_nota, pedacos) if LEVA_NOTA else []
    return {'geo': geo_doc, 'pagina_solucoes': pagina_solucoes, 'solucoes_sem_titulo': solucoes_sem_titulo,
            'ordem': ordem, 'pedacos': pedacos, 'rotulos': rotulos, 'notas': notas,
            'rotulos_inseguros': rotulos_inseguros,
            'formas': {'%s_%s' % k: v for k, v in sorted(formas.items())}, 'cruzados': cruzados}


def notas_de_rodape(doc, regioes, pedacos):
    """Cada nota de rodape vai, como ULTIMO pedaco, com o item que a chama (contrato, 8a).

    Medido nas 7 series: 25 notas, 21 com a chamada unica na pagina. A regiao
    abaixo do fio curto e dividida em notas pelo numero miudo que abre cada uma,
    e cada nota e recortada so pela sua tinta, sem o fio e sem a nota vizinha.
    A chamada e o mesmo numero, em corpo miudo (ate 8,5 pt), com a linha de base
    acima da do texto vizinho, fora das notas, na mesma pagina. Com uma chamada
    so, dentro do recorte de um item so, a nota vai com ele; senao fica fora,
    com o motivo, no relatorio. As notas entram depois de todo o documento, para
    ficarem por ultimo mesmo com o item continuando na pagina seguinte.
    """
    out = []
    por_pagina = collections.defaultdict(list)
    for r in regioes:
        por_pagina[r[0]].append(r)
    for pno, regs in sorted(por_pagina.items()):
        pg = doc[pno]
        spans = [sp for b in pg.get_text('dict')['blocks'] if b['type'] == 0 for l in b['lines'] for sp in l['spans']
                 if sp['text'].strip()]
        tinta_pag = None
        notas_pag = []
        for (_, col, y_fio, y_fim, xsep, cx0, cx1) in regs:
            miudos = sorted([sp for sp in spans if sp['size'] <= 8.5 and y_fio < sp['bbox'][1] < y_fim
                             and cx0 <= (sp['bbox'][0] + sp['bbox'][2]) / 2 <= cx1],
                            key=lambda sp: (sp['bbox'][1], sp['bbox'][0]))
            margem = margem_da_coluna(col, {'xsep': xsep})
            inicios = [sp for sp in miudos if re.match(r'^\d+$', sp['text'].strip()) and sp['bbox'][0] <= margem + 15]
            if not inicios:
                texto = portal.recompor(' '.join(sp['text'] for sp in miudos)).strip()
                out.append({'pagina': pno + 1, 'coluna': col + 1, 'numero': None, 'texto': portal.sem_tracos(texto[:120]),
                            'motivo': 'a nota nao comeca por um numero'})
                continue
            # topo da primeira linha de cada nota: o numero em sobrescrito, e o que
            # atravessa a linha dele (a fracao k(k-1)/2 no comeco da nota 1 de
            # Introducao a Porcentagem, 7o ano, sobe 4 pt acima do numero)
            tops = [min([ini['bbox'][1]] + [sp['bbox'][1] for sp in miudos if NOTA_LINHA_TODA
                                            and sp['bbox'][1] < ini['bbox'][3] and sp['bbox'][3] > ini['bbox'][1]])
                    for ini in inicios]
            for k, ini in enumerate(inicios):
                # o pedaco comeca abaixo do fio da nota (contrato, 8a)
                y_a = max(tops[k] - 1.0, y_fio + 1.0)
                y_b = tops[k + 1] - 1.0 if k + 1 < len(inicios) else y_fim
                corpo = [sp for sp in miudos if y_a <= sp['bbox'][1] < y_b]
                if tinta_pag is None:
                    tmp = pymupdf.open()
                    tmp.insert_pdf(doc, from_page=pno, to_page=pno)
                    pix = tmp[0].get_pixmap(dpi=72, colorspace=pymupdf.csGRAY)
                    tmp.close()
                    tinta_pag = (pix.width, pix.height, pix.samples)
                w, h, smp = tinta_pag
                a, b = max(0, int(cx0 + 1)), min(w, int(cx1))
                linhas = [y for y in range(max(0, int(y_a)), min(h, int(y_b)))
                          if any(smp[y * w + x] < LIMIAR_TINTA for x in range(a, b))]
                if not linhas:
                    continue
                r = (float(math.floor(cx0) if col == 0 else math.ceil(cx0)), float(math.ceil(max(y_a, linhas[0] - FOLGA))),
                     float(math.floor(cx1)), float(min(math.ceil(linhas[-1] + 1 + FOLGA), math.floor(y_b))))
                notas_pag.append({'pagina': pno + 1, 'coluna': col + 1, 'numero': ini['text'].strip(), 'rect': r,
                                  'pno': pno, 'col': col, 'xsep': xsep,
                                  'texto': portal.sem_tracos(portal.recompor(ini['text'].strip() + ' ' + ' '.join(
                                      sp['text'] for sp in corpo if sp is not ini)).strip()[:120])})
        areas = [pymupdf.Rect(n['rect']) for n in notas_pag]
        todos = [sp for bl in pg.get_text('dict')['blocks'] if bl['type'] == 0 for l in bl['lines'] for sp in l['spans']
                 if sp['text'].strip()]
        for n in notas_pag:
            chamadas = []
            for sp in todos:
                if sp['text'].strip() != n['numero'] or sp['size'] > 8.5:
                    continue
                c = pymupdf.Point((sp['bbox'][0] + sp['bbox'][2]) / 2, (sp['bbox'][1] + sp['bbox'][3]) / 2)
                if any(ar.contains(c) for ar in areas):
                    continue
                # sobrescrito colado a direita de texto de corpo normal cuja linha de
                # base e mais baixa, na mesma linha do PDF ou nao
                if any(o['size'] > 8.5 and o['origin'][1] > sp['origin'][1] + 1
                       and o['bbox'][1] < sp['bbox'][3] and o['bbox'][3] > sp['bbox'][1]
                       and sp['bbox'][0] - 3 <= o['bbox'][2] <= sp['bbox'][0] + 1 for o in todos):
                    chamadas.append(c)
            donos = []
            for c in chamadas:
                for tipo in ('enunciado', 'solucao'):
                    for chave, ps in pedacos[tipo].items():
                        if any(p['pno'] == pno and pymupdf.Rect(p['rect']).contains(c) for p in ps):
                            donos.append((tipo, chave))
            reg = {k: n[k] for k in ('pagina', 'coluna', 'numero', 'texto')}
            if len(chamadas) != 1:
                reg['motivo'] = ('chamada ambigua: %d candidatas na pagina' % len(chamadas)) if chamadas else \
                    'chamada nao achada na pagina'
            elif len(set(donos)) != 1:
                reg['motivo'] = 'a chamada nao cai no recorte de um item so'
            else:
                tipo, chave = donos[0]
                pedacos[tipo][chave].append({'pno': n['pno'], 'col': n['col'], 'rect': n['rect'], 'xsep': n['xsep'],
                                             'transborda': False, 'nota': True})
                reg.update({'tipo': tipo, 'chave': chave})
            out.append(reg)
    return out


# Numero de solucao repetido logo em seguida, com uma destas frases, e a segunda
# resolucao do MESMO item, e nao outro item: "5. Outro metodo:" (9o ano, Poligonos
# Regulares), "2. (Outra solucao.)" (8o ano, Divisibilidade e Teorema da Divisao
# Euclidiana) e "21. Solucao 2." (1o medio, Introducao as Inequacoes de 2o Grau).
# Numero repetido sem uma delas continua saindo com motivo. Confere sem os
# espacos: a juncao dos spans parte a palavra ("Solu cao 2.", Inequacoes).
CONTINUACAO = re.compile(r'^\(?(?:Outr[oa](?:solu|m[eé]todo|modo|maneira|forma|resolu)|Solu[cç][aã]o2(?!\d)|Segundasolu)',
                         re.I)


def continua_o_anterior(texto_depois_do_numero):
    return CONTINUACAO.match(re.sub(r'\s+', '', texto_depois_do_numero)) is not None


def _depois_do_numero(m, els_col):
    """Texto da linha do marcador depois do numero, para reconhecer "5. Outro metodo"."""
    cy = centro_y(m['el']['bb'])
    linha = sorted([e for e in els_col if e['tipo'] == 'txt' and abs(centro_y(e['bb']) - cy) < 3],
                   key=lambda e: e['bb'][0])
    t = portal.recompor(' '.join(e['texto'] for e in linha))
    return re.sub(r'^\s*\d+\s*\.\s*', '', t)


def resumo_de_lista(doc):
    """Contagem para o inventario, sem recortar."""
    d = detectar(doc)
    if 'erro' in d:
        return {'erro': d['erro']}
    ne = [n for n, _ in d['ordem']['enunciado']]
    ns = [n for n, _ in d['ordem']['solucao']]
    multi = sum(1 for ps in d['pedacos']['enunciado'].values() if len(ps) > 1)
    return {'modelo': 'CM' if d['geo']['xsep'] < 300 else 'Palladio', 'xsep': d['geo']['xsep'],
            'yrod': d['geo']['yrod'], 'pagina_solucoes': d['pagina_solucoes'],
            'itens_enunciado': len(ne), 'itens_solucao': len(ns),
            'sequencia_enunciado_ok': ne == list(range(1, len(ne) + 1)),
            'sequencia_solucao_ok': ns == list(range(1, len(ns) + 1)),
            'numeros_solucao': None if ns == list(range(1, len(ns) + 1)) else ns,
            'enunciados_com_mais_de_um_pedaco': multi, 'formas_do_marcador': d['formas']}


# ------------------------------------------------------------------ recorte

def svg_do_pedaco(doc, pno, rect, imagens=pymupdf.PDF_REDACT_IMAGE_REMOVE, folga=FOLGAS_REDACAO[0],
                  desenhos=pymupdf.PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED):
    """SVG so com o conteudo do retangulo, e a diferenca de pixels contra a pagina original."""
    r = pymupdf.Rect(rect)
    tmp = pymupdf.open()
    tmp.insert_pdf(doc, from_page=pno, to_page=pno)
    pg = tmp[0]
    # A referencia sai da copia, ANTES de apagar. Nao sai de doc[pno]: depois de
    # um get_text('dict') no documento de origem, o PyMuPDF 1.27 passa a
    # desenhar as imagens raster daquele objeto de outro jeito (medido: 2.380
    # pixels num recorte da lista de Tales), e a copia e o arquivo reaberto
    # concordam entre si.
    a = pg.get_pixmap(dpi=DPI_CONFERENCIA, colorspace=pymupdf.csGRAY, clip=r)
    W, H = pg.rect.width, pg.rect.height
    g = pymupdf.Rect(r.x0 - folga, r.y0 - folga, r.x1 + folga, r.y1 + folga)
    for f in (pymupdf.Rect(0, 0, W, g.y0), pymupdf.Rect(0, g.y1, W, H),
              pymupdf.Rect(0, g.y0, g.x0, g.y1), pymupdf.Rect(g.x1, g.y0, W, g.y1)):
        if f.width > 0 and f.height > 0:
            pg.add_redact_annot(f, fill=False)
    pg.apply_redactions(images=imagens, graphics=desenhos,
                        text=pymupdf.PDF_REDACT_TEXT_REMOVE)
    b = pg.get_pixmap(dpi=DPI_CONFERENCIA, colorspace=pymupdf.csGRAY, clip=r)
    sa, sb = a.samples, b.samples
    dif = sum(1 for i in range(len(sa)) if abs(sa[i] - sb[i]) > 32) / float(max(1, len(sa)))
    pg.set_cropbox(r)
    svg = limpar_svg(pg.get_svg_image(text_as_path=True))
    tmp.close()
    return svg, dif


def svg_redigido(doc, pno, rect):
    """Apaga o de fora com a menor folga que deixa o recorte identico ao original.

    Se nenhuma folga basta tirando as imagens de fora, tenta mantendo as imagens.
    Devolve a melhor tentativa e a diferenca medida; quem chama decide.

    Primeiro apaga tambem o desenho que so ENCOSTA na faixa de fora (o fio do
    rodape, o separador de colunas, o traco de uma figura vizinha): o SVG sai
    sem nada que dependa do clipPath para nao aparecer, e ha leitor de SVG que
    ignora o clip (o do MuPDF desenhava o fio do rodape dentro do recorte). Se
    isso mexe em pixel do recorte, cai para so o desenho inteiro de fora.
    """
    melhor = None
    for imagens, obs_i in ((pymupdf.PDF_REDACT_IMAGE_REMOVE, None), (pymupdf.PDF_REDACT_IMAGE_NONE, 'imagens mantidas')):
        for desenhos, obs_d in ((pymupdf.PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED, None),
                                (pymupdf.PDF_REDACT_LINE_ART_REMOVE_IF_COVERED, 'desenho que encosta mantido')):
            for folga in FOLGAS_REDACAO:
                svg, dif = svg_do_pedaco(doc, pno, rect, imagens, folga, desenhos)
                notas = [x for x in (obs_i, obs_d, None if folga == FOLGAS_REDACAO[0] else 'folga de %g pt' % folga) if x]
                nota = ', '.join(notas) or None
                if melhor is None or dif < melhor[1]:
                    melhor = (svg, dif, nota)
                if dif <= LIMITE_REDACAO:
                    return svg, dif, nota
    return melhor


RAIZ_SVG = re.compile(r'<svg\b[^>]*>', re.S)
DATA_TEXT = re.compile(r'\sdata-text="[^"]*"')
CONTROLE = re.compile('[\x00-\x08\x0b\x0c\x0e-\x1f]|&#(x0*(?:[0-8bcef]|1[0-9a-f])|0*(?:[0-8]|1[124-9]|2[0-9]|3[01]));', re.I)


def limpar_svg(svg):
    """Tira o data-text dos glifos e qualquer caractere de controle.

    O PyMuPDF grava em cada glifo um data-text com o caractere original, e na
    teoria vinham U+0018 e U+001A (&#x001a;), que nao valem em XML 1.0: o
    Chrome recusava a pagina inteira e ela saia em branco (achado da B3, 9
    paginas de teoria). O texto para busca ja esta em itens.json e teoria.json;
    no SVG o data-text e peso morto.
    """
    return CONTROLE.sub('', DATA_TEXT.sub('', svg))


def prefixar_ids(svg, pref):
    svg = re.sub(r'\bid="([^"]+)"', lambda m: 'id="%s%s"' % (pref, m.group(1)), svg)
    svg = re.sub(r'url\(#([^)]+)\)', lambda m: 'url(#%s%s)' % (pref, m.group(1)), svg)
    svg = re.sub(r'(xlink:href|href)="#([^"]+)"', lambda m: '%s="#%s%s"' % (m.group(1), pref, m.group(2)), svg)
    return svg


def empilhar(svgs, medidas):
    """Um SVG com os pedacos um embaixo do outro, cada um com o seu viewBox original."""
    if len(svgs) == 1:
        return svgs[0], medidas[0]
    largura = max(w for w, h in medidas)
    altura = sum(h for w, h in medidas) + FOLGA_PILHA * (len(svgs) - 1)
    partes = []
    y = 0.0
    for i, (s, (w, h)) in enumerate(zip(svgs, medidas)):
        s = re.sub(r'^<\?xml[^>]*>\s*', '', s.strip())
        s = prefixar_ids(s, 'p%d_' % (i + 1))
        cab = RAIZ_SVG.search(s).group(0)
        novo = re.sub(r'\s(width|height|x|y)="[^"]*"', '', cab)
        novo = novo[:-1].rstrip('/') + ' x="0" y="0" width="%s" height="%s">' % (_n(w), _n(h))
        # o deslocamento vai num <g>, e nao no y do <svg> aninhado: o MuPDF ignora
        # o y do svg aninhado e desenhava os pedacos um por cima do outro
        partes.append('<g transform="translate(0 %s)">\n%s\n</g>' % (_n(y), s.replace(cab, novo, 1)))
        y += h + FOLGA_PILHA
    cab = ('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" '
           'width="%s" height="%s" viewBox="0 0 %s %s">\n' % (_n(largura), _n(altura), _n(largura), _n(altura)))
    return cab + '\n'.join(partes) + '\n</svg>\n', (largura, altura)


def _n(v):
    v = round(v, 2)
    return ('%d' % v) if v == int(v) else ('%s' % v)


def rotulo_relativo(caixa, rect):
    """Caixa do rotulo em pt, relativa ao canto do asset (o primeiro pedaco), ou None."""
    if not caixa:
        return None
    x0, y0 = rect[0], rect[1]
    r = [round(caixa[0] - x0, 1), round(caixa[1] - y0, 1), round(caixa[2] - x0, 1), round(caixa[3] - y0, 1)]
    w, h = rect[2] - rect[0], rect[3] - rect[1]
    # a caixa da fonte passa da tinta por fracao de ponto; ate 3 pt, recorta ao asset
    if r[0] < -3 or r[1] < -3 or r[2] > w + 3 or r[3] > h + 3:
        return None
    return [max(0.0, r[0]), max(0.0, r[1]), min(round(w, 1), r[2]), min(round(h, 1), r[3])]


def texto_do_retangulo(doc, pno, rect):
    # ordem natural do PDF, e nao sort=True: a ordenacao por altura colava o
    # "a)" no fim da linha de cima de uma fracao ("ln" + "a) sen") e o rotulo da
    # alternativa sumia (Poligonos Regulares, exercicio 21)
    return doc[pno].get_text('text', clip=pymupdf.Rect(rect))


def primeira_linha_na_margem(doc, pno, rect, col, xsep):
    """A linha mais alta do recorte que comeca na margem da coluna.

    A ordem de leitura do pymupdf poe antes o que sobe acima da linha (radical,
    numerador de fracao), e isso nao e o comeco do item. O que o leitor le
    primeiro e a primeira linha encostada na margem.
    """
    palavras = doc[pno].get_text('words', clip=pymupdf.Rect(rect))
    margem = margem_da_coluna(col, {'xsep': xsep})
    # mais o "Exercicio" com recuo de paragrafo (ver recuado_na_linha): so a
    # palavra do marcador, para o radical ou o numerador acima da linha, que
    # tambem ficam para dentro da margem, nao virarem a primeira linha
    na_margem = [w for w in palavras if abs(w[0] - margem) <= TOLERANCIA_MARGEM
                 or (0 < w[0] - margem <= RECUO_MAX and w[4].startswith('Exerc'))]
    if not na_margem:
        return ''
    topo = min(na_margem, key=lambda w: (w[1], w[0]))
    cy = (topo[1] + topo[3]) / 2.0
    linha = sorted([w for w in palavras if abs((w[1] + w[3]) / 2.0 - cy) < 4 and w[0] >= topo[0] - 1],
                   key=lambda w: w[0])
    return portal.recompor(' '.join(w[4] for w in linha)).strip()


# ------------------------------------------------------------------ campos do item

ROTULO_LETRA = re.compile(r'(?:^|(?<=\s))\(?([a-zA-Z])\)(?=\s)', re.M)
# Entre "Resposta" e a letra so pode haver espaco, ou digitos de uma fracao que a
# extracao deslocou para a linha do meio ("= 31. Resposta / 2 2 / C.").
RESPOSTA = re.compile(r'(?:Resposta\s*(?:letra\s*)?:?|\b(?:na|a)\s+(?:letra|alternativa|op[çc][ãa]o)\s+)'
                      r'[\s\d]{0,40}?\(?([A-E])\)?(?=[\s.,;)]|$)')
SO_LETRA = re.compile(r'^\s*\d+\s*\.\s*\(?([A-E])\)?\s*\.?\s*$')
CHAMADA_DE_NOTA = re.compile(r'([a-z\u00e0-\u00ff])\d(\.?)$')
# "(Extraido da ...)" e, por decisao do contrato (secao 4), "(Adaptado da ...)",
# literal e com a palavra: problema adaptado nao pode passar por questao original
# da prova. Nas 7 series: 1.149 "Extraido/a" e 389 "Adaptado/a".
EXTRAIDO = re.compile(r'\(((?:Extra[íi]d[oa]|Adaptad[oa])\s[^()]*(?:\([^()]*\)[^()]*)*)\)')


def rotulos(texto):
    """Rotulos a), b), c)... em ordem, na vertical ou na mesma linha, sem pular letra."""
    seq = []
    for l in ROTULO_LETRA.findall(texto):
        l = l.lower()
        if l == chr(ord('a') + len(seq)):
            seq.append(l)
    return seq


def rotulos_com_frase(texto):
    """Algum rotulo a), b)... traz palavra de 4 letras ou mais ("Determine o valor")?

    Alternativa de objetiva no Portal e valor curto ("58cm2.", "3, 5."); sub-item
    de aberta e frase. So decide quando a solucao nao escreve a letra.
    """
    partes = re.split(r'(?:^|(?<=\s))\(?[a-e]\)(?=\s)', texto)
    return any(re.search(r'[A-Za-zÀ-ÿ]{4,}', p) for p in partes[1:])


def classificar(texto_enun, texto_sol):
    """formato, alternativas, resposta e subitens, tudo lido do texto da fonte.

    Objetiva so quando o enunciado tem exatamente a) a e) e a solucao traz UMA
    letra ("Resposta B." ou a solucao inteira "1. C."). O Portal escreve
    alternativa e sub-item do mesmo jeito, entao a) a e) sem letra so vira aberta
    se a solucao tambem responde por a), b)...; senao o item sai com motivo.
    """
    seq = rotulos(portal.recompor(texto_enun))
    achadas = []
    sol_rot = []
    if texto_sol is not None:
        s = portal.recompor(texto_sol)
        achadas = sorted(set(RESPOSTA.findall(s)))
        if not achadas:
            m = SO_LETRA.match(' '.join(s.split()))
            if m:
                achadas = [m.group(1)]
        sol_rot = rotulos(s)
    alternativas = seq in (list('abcd'), list('abcde'))
    ultima = seq[-1].upper() if seq else None
    if alternativas and len(achadas) == 1 and achadas[0] <= ultima:
        return {'formato': 'objetiva', 'alternativas': [l.upper() for l in seq], 'resposta': achadas[0],
                'subitens': []}, None
    if alternativas and len(achadas) == 1:
        return None, 'a) a %s) no enunciado e Resposta %s fora delas' % (seq[-1], achadas[0])
    if alternativas and len(achadas) > 1:
        return None, 'a) a %s) no enunciado e mais de uma letra de resposta na solucao (%s)' % (seq[-1], ','.join(achadas))
    if alternativas and len(sol_rot) < 2 and not rotulos_com_frase(portal.recompor(texto_enun)):
        return None, ('a) a %s) no enunciado so com valores curtos e a solucao nao escreve a letra nem responde '
                      'por sub-item: nao da para dizer se sao alternativas ou sub-itens, e a letra nao e '
                      'deduzida' % seq[-1])
    nota = None
    if achadas:
        nota = 'solucao diz Resposta %s mas o enunciado nao tem alternativas; tratado como aberta' % ','.join(achadas)
    return {'formato': 'aberta', 'alternativas': None, 'resposta': None, 'subitens': seq}, nota


def origem_citada(texto_enun, texto_sol):
    for onde, t in (('enunciado', texto_enun), ('solucao', texto_sol)):
        if not t:
            continue
        s = ' '.join(portal.recompor(t).split())
        m = EXTRAIDO.search(s[:400] if onde == 'solucao' else s)
        if m:
            # a chamada de nota de rodape vem colada na palavra ("livro chines" e o
            # expoente 2, Razoes Trigonometricas 12): sai da origem, que vai para a
            # tela. Ano vem sempre depois de espaco ou hifen, e nao e tocado.
            return portal.sem_tracos(CHAMADA_DE_NOTA.sub(r'\1\2', m.group(1).strip())), onde
    return None, None


# ------------------------------------------------------------------ pacote

def sha(b):
    return 'sha256:' + hashlib.sha256(b).hexdigest()


def json_bytes(obj):
    return (json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + '\n').encode('utf-8')


def ler_curadoria(pasta):
    dif = {}
    caminho = os.path.join(pasta, 'dificuldade.csv')
    if os.path.exists(caminho):
        for i, linha in enumerate(io.open(caminho, encoding='utf-8-sig')):
            linha = linha.strip()
            if not linha or i == 0:
                continue
            partes = linha.split(';')
            # linha de curadoria que nao se aplica nao pode passar calada: valor
            # fora de 1 a 3 para a geracao (o id de outra serie e normal, o
            # arquivo e um so para todas; id desta serie que nao existe vai para
            # o relatorio e a prova reprova)
            if len(partes) < 2 or partes[1].strip() not in ('1', '2', '3'):
                raise SystemExit('dificuldade.csv, linha %d: dificuldade tem de ser 1, 2 ou 3: %r' % (i + 1, linha))
            dif[partes[0].strip()] = int(partes[1])
    apelidos = json.load(io.open(os.path.join(pasta, 'apelidos.json'), encoding='utf-8'))
    apelidos = {k: apelidos[k] for k in sorted(apelidos) if not k.startswith('_')}
    # exclusoes.csv (id;motivo;quem;data): item que a revisao visual achou com
    # defeito DA FONTE (figura fora do lugar, frase da solucao no enunciado). O
    # recorte e fiel a pagina; o defeito e do conteudo, e so leitura pega.
    excl = {}
    caminho = os.path.join(pasta, 'exclusoes.csv')
    if os.path.exists(caminho):
        for i, linha in enumerate(io.open(caminho, encoding='utf-8-sig')):
            partes = linha.rstrip('\r\n').split(';')
            if i == 0 or len(partes) < 2 or not partes[0].strip():
                continue
            excl[partes[0].strip()] = partes[1].strip()
    return dif, apelidos, excl


def montar_busca(docs):
    """busca.json feito pelo proprio busca.js do aplicativo, com o tipo de cada documento."""
    entrada = [{'id': d['id'], 'serie': d['serie'], 'titulo': d['titulo'], 'resumo': d.get('resumo', ''),
                'explicacao': d.get('explicacao', ''), 'enunciados': d.get('texto', '')} for d in docs]
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8') as f:
        json.dump(entrada, f, ensure_ascii=False)
        caminho = f.name
    script = ("const fs=require('fs');const B=require(process.argv[1]);"
              "const t=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));"
              "process.stdout.write(JSON.stringify(B.montarIndice(t)));")
    r = subprocess.run(['node', '-e', script, os.path.join(RAIZ, 'busca.js'), caminho],
                       capture_output=True, text=True, encoding='utf-8')
    os.unlink(caminho)
    if r.returncode != 0:
        raise SystemExit('busca.js falhou: %s' % r.stderr[:400])
    indice = json.loads(r.stdout)
    tipos = {d['id']: d['tipo'] for d in docs}
    for reg in indice:
        reg['k'] = tipos[reg['i']]
    return {'formato': 'indice-de-busca', 'versao': 1, 'tipos': {'k': 'modulo, teoria ou exercicio'},
            'temas': indice}


def titulo_do_modulo(slug, capas_listas, capas_teorias):
    """Titulo do modulo pela capa mais frequente das LISTAS; sem lista, das teorias.

    A primeira capa lida nao serve: a fonte erra o nome do modulo em algumas
    capas, e "__exercicios" vem antes de "__teoria" na ordem dos arquivos. Fracao
    como Porcentagem e como Probabilidade (6o ano) saia "Divisibilidade", que e o
    que a capa de "Exercicios Diversos de Fracoes como Porcentagens" escreve. As
    listas e nao as teorias, porque a capa da teoria escreve o modulo em caixa
    alta ("CONJUNTOS") ou corta a linha ("Geometria Plana - Parte"). Variantes que
    so diferem em maiuscula contam juntas; a grafia e a da primeira lista do
    grupo. Empate: o grupo que aparece primeiro, na ordem dos arquivos.
    Modulo com slug "-parte-N" cujo titulo nao diz a parte ganha " - Parte N"
    (Elementos Basicos de Geometria Plana, 8o ano: tres modulos, capas iguais).
    """
    for capas in (capas_listas, capas_teorias):
        capas = [c for c in capas if c]
        if not capas:
            continue
        grupos = collections.OrderedDict()
        for c in capas:
            grupos.setdefault(c.casefold(), []).append(c)
        melhor = max(grupos.values(), key=len)  # max devolve o primeiro no empate
        titulo = melhor[0]
        break
    else:
        titulo = slug.replace('-', ' ').capitalize()
    titulo = portal.sem_tracos(titulo)
    titulo = re.sub(r'(?<=\S) -(?=\S)|(?<=\S)- (?=\S)', ' - ', titulo)
    m = re.search(r'-parte-(\d+)$', slug)
    if m and 'parte' not in titulo.casefold():
        titulo += ' - Parte %s' % m.group(1)
    return titulo


def commit_do_gerador():
    try:
        r = subprocess.run(['git', '-C', RAIZ, 'rev-parse', '--short', 'HEAD'], capture_output=True, text=True)
        return r.stdout.strip() or None
    except OSError:
        return None


def gravar_pacote(conteudo, manifest_b, nome, versao, saida, trabalho, gravar_zip=True):
    """Grava a pasta de trabalho (tudo solto) e o zip deterministico. Devolve o caminho do zip."""
    os.makedirs(trabalho, exist_ok=True)
    for k, v in list(conteudo.items()) + [('manifest.json', manifest_b)]:
        c = os.path.join(trabalho, *k.split('/'))
        os.makedirs(os.path.dirname(c), exist_ok=True)
        with open(c, 'wb') as f:
            f.write(v)
    # asset de uma geracao anterior que saiu do pacote (item excluido depois)
    # nao pode ficar solto na pasta: a pasta tem de ser igual ao zip
    pasta_assets = os.path.join(trabalho, 'assets')
    for raiz, _, arqs in (os.walk(pasta_assets) if LIMPA_PASTA else []):
        for a in arqs:
            rel = os.path.relpath(os.path.join(raiz, a), trabalho).replace(os.sep, '/')
            if rel not in conteudo:
                os.remove(os.path.join(raiz, a))
    zip_caminho = os.path.join(saida, '%s-v%d.zip' % (nome, versao))
    if gravar_zip:
        os.makedirs(saida, exist_ok=True)
        ordem = ['manifest.json', 'itens.json', 'teoria.json', 'busca.json', 'apelidos.json'] +                 sorted(k for k in conteudo if k.startswith('assets/'))
        with zipfile.ZipFile(zip_caminho + '.tmp', 'w') as z:
            for k in ordem:
                zi = zipfile.ZipInfo(k, date_time=(1980, 1, 1, 0, 0, 0))
                zi.compress_type = zipfile.ZIP_DEFLATED
                zi.external_attr = 0o644 << 16
                zi.create_system = 0
                z.writestr(zi, manifest_b if k == 'manifest.json' else conteudo[k], compresslevel=9)
        os.replace(zip_caminho + '.tmp', zip_caminho)
    return zip_caminho


def gerar(pdfs, serie, versao, saida, curadoria, trabalho=None, gerado_em=None, commit=None,
          so_modulos=None, gravar_zip=True, anterior=None):
    t_ini = time.time()
    nome = 'matematica-obmep-%s' % serie
    trabalho = trabalho or os.path.join(os.path.dirname(os.path.abspath(saida)), 'trabalho', '%s-v%d' % (nome, versao))
    arquivos = portal.listar(pdfs)
    if so_modulos:
        arquivos = [a for a in arquivos if a['modulo'] in so_modulos]
    dif_cur, apelidos, excl_cur = ler_curadoria(curadoria)
    conteudo = {}   # caminho no zip -> bytes
    itens, teoria, docs_busca = [], [], []
    relatorio = {'pacote': nome, 'versao': versao, 'serie': serie, 'pymupdf': portal.versao_pymupdf(),
                 'listas': [], 'teorias': [], 'excluidos': []}

    # titulos de modulo e de aula, lidos das capas
    por_modulo = collections.OrderedDict()
    for a in arquivos:
        por_modulo.setdefault(a['modulo'], {'teoria': [], 'exercicios': []})[a['tipo']].append(a)
    abertos = {}
    capas_mod = collections.defaultdict(lambda: {'exercicios': [], 'teoria': []})
    for a in arquivos:
        doc = pymupdf.open(os.path.join(pdfs, a['arquivo']))
        abertos[a['arquivo']] = doc
        capa = portal.capa_da_teoria(doc) if a['tipo'] == 'teoria' else portal.capa_da_lista(doc)
        a['capa'] = capa
        capas_mod[a['modulo']][a['tipo']].append(capa.get('modulo'))

    def titulo_modulo(slug):
        return titulo_do_modulo(slug, capas_mod[slug]['exercicios'], capas_mod[slug]['teoria'])

    for mod, grupos in por_modulo.items():
        modulo = {'slug': mod, 'titulo': titulo_modulo(mod)}
        titulos_aulas = []
        # -------------------------------------------------------------- listas
        for n_aula, a in enumerate(sorted(grupos['exercicios'], key=lambda x: x['aula']), 1):
            t0 = time.time()
            doc = abertos[a['arquivo']]
            aula_tit = portal.sem_tracos(a['capa'].get('titulo') or a['aula'].replace('-', ' ').capitalize())
            titulos_aulas.append(aula_tit)
            aula = {'slug': a['aula'], 'titulo': aula_tit, 'n': n_aula}
            det = detectar(doc)
            rel = {'arquivo': a['arquivo'], 'aula': a['aula'], 'excluidos': [], 'notas': []}
            relatorio['listas'].append(rel)
            if 'erro' in det:
                rel['erro'] = det['erro']
                continue
            rel.update({'modelo': 'CM' if det['geo']['xsep'] < 300 else 'Palladio', 'fio_colunas_x': det['geo']['xsep'],
                        'fio_rodape_y': det['geo']['yrod'], 'pagina_solucoes': det['pagina_solucoes'],
                        'solucoes_sem_titulo': det['solucoes_sem_titulo'],
                        'origem_da_divisa': det['geo']['origem_da_divisa'], 'divisas_por_pagina': det['geo']['divisas_por_pagina'],
                        'rotulos_sem_caixa_por_encostar_em_tinta': det['rotulos_inseguros'],
                        'formas_do_marcador': det['formas'], 'elementos_que_cruzam_o_fio': det['cruzados']})
            # notas de rodape: com que item foi cada uma, e as que ficaram fora (8a)
            rel['notas_de_rodape'] = []
            for nt in det.get('notas', []):
                reg = {k: nt.get(k) for k in ('pagina', 'coluna', 'numero', 'texto')}
                if 'chave' in nt:
                    num = next(n for n, ch in det['ordem'][nt['tipo']] if ch == nt['chave'])
                    reg.update({'id': '%s:%s:%s:ex:%d' % (serie, mod, a['aula'], num), 'em': nt['tipo']})
                else:
                    reg['motivo'] = nt['motivo']
                rel['notas_de_rodape'].append(reg)
            ne = [n for n, _ in det['ordem']['enunciado']]
            ns = [n for n, _ in det['ordem']['solucao']]
            total = len(ne)
            cont_e = collections.Counter(ne)
            cont_s = collections.Counter(ns)
            chave_sol = {}
            for n, ch in det['ordem']['solucao']:
                chave_sol.setdefault(n, []).append(ch)
            sem_secao = det['pagina_solucoes'] is None
            rel['enunciados'] = total
            rel['solucoes'] = len(ns)
            rel['numeros_enunciado'] = ne
            rel['numeros_solucao'] = ns
            multi_e = multi_s = 0
            for numero, ch in det['ordem']['enunciado']:
                iid = '%s:%s:%s:ex:%d' % (serie, mod, a['aula'], numero)
                motivo = None
                if iid in excl_cur:
                    motivo = 'curadoria: ' + excl_cur[iid]
                elif cont_e[numero] > 1:
                    motivo = 'numero %d aparece %d vezes nos enunciados da fonte' % (numero, cont_e[numero])
                elif not sem_secao and cont_s[numero] == 0:
                    motivo = 'a fonte nao tem solucao rotulada %d.' % numero
                elif cont_s[numero] > 1:
                    motivo = ('a fonte rotula duas solucoes como %d. (e nenhuma como %s); sem saber qual e de qual '
                              'item, sai' % (numero, ', '.join(str(x) for x in range(1, total + 1) if cont_s[x] == 0) or 'outra'))
                p_enun = det['pedacos']['enunciado'].get(ch, [])
                p_sol = det['pedacos']['solucao'].get(chave_sol[numero][0], []) if cont_s[numero] == 1 else []
                vaza = [p for p in p_enun + p_sol if p.get('transborda')]
                if not motivo and vaza:
                    motivo = ('na pagina %d a fonte passa conteudo por cima do fio entre as colunas, na altura deste '
                              'item: o recorte da coluna cortaria esse trecho ou pegaria a outra coluna' % (vaza[0]['pno'] + 1))
                    rel['excluidos'].append({'id': iid, 'numero': numero, 'motivo': motivo,
                                             'calha': {'pagina': vaza[0]['pno'] + 1, 'y': [vaza[0]['rect'][1], vaza[0]['rect'][3]]}})
                    continue
                if not motivo and not p_enun:
                    motivo = 'enunciado sem conteudo detectado'
                if not motivo and not sem_secao and not p_sol:
                    motivo = 'solucao sem conteudo detectado'
                if motivo:
                    rel['excluidos'].append({'id': iid, 'numero': numero, 'motivo': motivo})
                    continue
                txt_e = '\n'.join(texto_do_retangulo(doc, p['pno'], p['rect']) for p in p_enun)
                txt_s = '\n'.join(texto_do_retangulo(doc, p['pno'], p['rect']) for p in p_sol) if p_sol else None
                primeiro_e = primeira_linha_na_margem(doc, p_enun[0]['pno'], p_enun[0]['rect'], p_enun[0]['col'], p_enun[0]['xsep'])
                if not re.match(r'^Exerc\S*cio\s*%d\s*\.' % numero, primeiro_e):
                    rel['excluidos'].append({'id': iid, 'numero': numero,
                                             'motivo': 'texto do recorte nao comeca com "Exercicio %d."' % numero})
                    continue
                if p_sol:
                    primeiro_s = primeira_linha_na_margem(doc, p_sol[0]['pno'], p_sol[0]['rect'], p_sol[0]['col'], p_sol[0]['xsep'])
                    if not re.match(r'^%d\s*\.' % numero, primeiro_s):
                        rel['excluidos'].append({'id': iid, 'numero': numero,
                                                 'motivo': 'texto da solucao nao comeca com "%d."' % numero})
                        continue
                cls, nota = classificar(txt_e, txt_s)
                if cls is None:
                    rel['excluidos'].append({'id': iid, 'numero': numero, 'motivo': 'objetiva sem resposta: ' + nota})
                    continue
                if nota:
                    rel['notas'].append({'id': iid, 'nota': nota})
                # alturas
                col_alt = det['geo']['yrod'] or 750
                ruim = None
                for tipo, ps, minimo in (('enunciado', p_enun, ALTURA_MIN_ENUNCIADO), ('solucao', p_sol, ALTURA_MIN_SOLUCAO)):
                    if not ps:
                        continue
                    h_total = sum(p['rect'][3] - p['rect'][1] for p in ps)
                    if h_total < minimo:
                        ruim = '%s com %.1f pt de altura, abaixo de %d' % (tipo, h_total, minimo)
                    for p in ps:
                        if p['rect'][3] - p['rect'][1] > col_alt:
                            ruim = '%s com pedaco maior que a coluna' % tipo
                if ruim:
                    rel['excluidos'].append({'id': iid, 'numero': numero, 'motivo': ruim})
                    continue
                # SVG
                base = 'assets/%s/%s/%s/ex-%s' % (serie, mod, a['aula'], ('%02d' if total < 100 else '%03d') % numero)
                assets, medidas, origem = {}, {}, {}
                falhou = None
                for tipo, ps, suf in (('enunciado', p_enun, '.svg'), ('solucao', p_sol, '-sol.svg')):
                    if not ps:
                        continue
                    svgs, meds = [], []
                    for p in ps:
                        s, d, obs = svg_redigido(doc, p['pno'], p['rect'])
                        if d > LIMITE_REDACAO:
                            falhou = '%s: apagar o de fora mudou %.2f%% dos pixels do recorte' % (tipo, 100 * d)
                        if obs:
                            rel['notas'].append({'id': iid, 'nota': '%s p%d: %s' % (tipo, p['pno'] + 1, obs)})
                        svgs.append(s)
                        meds.append((p['rect'][2] - p['rect'][0], p['rect'][3] - p['rect'][1]))
                    svg, (w, h) = empilhar(svgs, meds)
                    caminho = base + suf
                    conteudo[caminho] = svg.encode('utf-8')
                    assets[tipo] = caminho
                    chave = ch if tipo == 'enunciado' else chave_sol[numero][0]
                    medidas[tipo] = {'largura_pt': round(w, 1), 'altura_pt': round(h, 1),
                                     'rotulo': rotulo_relativo(det['rotulos'].get(chave), ps[0]['rect'])}
                    o = {'pagina': ps[0]['pno'] + 1, 'coluna': ps[0]['col'] + 1, 'bbox': list(ps[0]['rect'])}
                    if len(ps) > 1:
                        o['pedacos'] = [{'pagina': p['pno'] + 1, 'coluna': p['col'] + 1, 'bbox': list(p['rect'])} for p in ps]
                        if tipo == 'enunciado':
                            multi_e += 1
                        else:
                            multi_s += 1
                    origem[tipo] = o
                if falhou:
                    for c in assets.values():
                        conteudo.pop(c, None)
                    rel['excluidos'].append({'id': iid, 'numero': numero, 'motivo': falhou})
                    continue
                oc, oc_em = origem_citada(txt_e, txt_s)
                terco = min(3, 1 + (3 * (numero - 1)) // total)
                item = {
                    'id': iid, 'fonte': FONTE['id'], 'serie': serie,
                    'modulo': modulo, 'aula': aula, 'numero': numero,
                    'formato': cls['formato'], 'alternativas': cls['alternativas'], 'resposta': cls['resposta'],
                    'subitens': cls['subitens'],
                    'texto': portal.para_busca(txt_e),
                    'origem_citada': oc,
                }
                if oc:
                    item['origem_citada_em'] = oc_em
                if iid in dif_cur:
                    item.update({'dificuldade': dif_cur[iid], 'dificuldade_origem': 'curadoria'})
                else:
                    item.update({'dificuldade': terco, 'dificuldade_origem': 'proxy'})
                item['proxy'] = {'posicao': round(numero / float(total), 2), 'terco': terco}
                item['tema_app'] = None
                item['assets'] = {'enunciado': assets['enunciado'], 'solucao': assets.get('solucao')}
                if 'solucao' not in assets:
                    item['sem_solucao'] = True
                item['medidas'] = medidas
                item['origem'] = dict({'arquivo': 'PDF/matematica/obmep-portal/%s/%s' % (serie, a['arquivo'])}, **origem)
                itens.append(item)
                docs_busca.append({'id': iid, 'serie': SERIE_BUSCA.get(serie, serie), 'tipo': 'exercicio',
                                   'titulo': '', 'resumo': '%s %s' % (aula_tit, modulo['titulo']),
                                   'texto': portal.sem_tracos(portal.recompor(txt_e)),
                                   'explicacao': portal.sem_tracos(portal.recompor(txt_s or ''))})
            rel['itens_no_pacote'] = sum(1 for i in itens if i['origem']['arquivo'].endswith(a['arquivo']))
            rel['enunciados_com_mais_de_um_pedaco'] = multi_e
            rel['solucoes_com_mais_de_um_pedaco'] = multi_s
            rel['segundos'] = round(time.time() - t0, 1)
            relatorio['excluidos'].extend(rel['excluidos'])
        # -------------------------------------------------------------- teoria
        listas_mod = sorted(grupos['exercicios'], key=lambda x: x['aula'])
        for n_aula, a in enumerate(sorted(grupos['teoria'], key=lambda x: x['aula']), 1):
            t0 = time.time()
            doc = abertos[a['arquivo']]
            capa = a['capa']
            aula_tit = portal.sem_tracos(capa.get('titulo') or a['aula'].replace('-', ' ').capitalize())
            titulos_aulas.append(aula_tit)
            aula = {'slug': a['aula'], 'titulo': aula_tit, 'n': n_aula, 'autor': capa.get('autor'),
                    'revisor': capa.get('revisor'), 'data': capa.get('data'),
                    'creditos': [portal.sem_tracos(c) for c in capa.get('creditos', [])]}
            tid = '%s:%s:%s:teo' % (serie, mod, a['aula'])
            paginas = []
            textos = []
            # SVG de um arquivo aberto agora: a capa ja foi lida com get_text('dict')
            # no `doc`, e isso muda como o PyMuPDF desenha imagem raster (svg_do_pedaco)
            limpo = pymupdf.open(os.path.join(pdfs, a['arquivo']))
            for pno in range(doc.page_count):
                pg = doc[pno]
                svg = limpar_svg(limpo[pno].get_svg_image(text_as_path=True))
                cam = 'assets/%s/%s/%s/teo-p%s.svg' % (serie, mod, a['aula'], ('%02d' if doc.page_count < 100 else '%03d') % (pno + 1))
                conteudo[cam] = svg.encode('utf-8')
                t = pg.get_text('text', sort=True)
                textos.append(portal.recompor(t))
                paginas.append({'id': '%s:p%02d' % (tid, pno + 1), 'n': pno + 1, 'capa': pno == 0, 'asset': cam,
                                'medidas': {'largura_pt': round(pg.rect.width, 1), 'altura_pt': round(pg.rect.height, 1)},
                                'texto': portal.para_busca(t)})
            teoria.append({'id': tid, 'fonte': FONTE['id'], 'serie': serie, 'modulo': modulo, 'aula': aula,
                           'exercicios_pareados': ['%s:%s:%s' % (serie, mod, l['aula']) for l in listas_mod
                                                   if portal.casa(a['aula'], l['aula'], capa.get('titulo'),
                                                                  l['capa'].get('titulo'))],
                           'paginas': paginas})
            docs_busca.append({'id': tid, 'serie': SERIE_BUSCA.get(serie, serie), 'tipo': 'teoria', 'titulo': aula_tit,
                               'resumo': modulo['titulo'], 'texto': portal.sem_tracos(' '.join(textos[1:]))})
            limpo.close()
            relatorio['teorias'].append({'arquivo': a['arquivo'], 'paginas': doc.page_count,
                                         'segundos': round(time.time() - t0, 1)})
        docs_busca.append({'id': '%s:%s' % (serie, mod), 'serie': SERIE_BUSCA.get(serie, serie), 'tipo': 'modulo',
                           'titulo': modulo['titulo'], 'resumo': ' '.join(titulos_aulas), 'texto': ''})

    itens.sort(key=lambda i: (i['modulo']['slug'], i['aula']['slug'], i['numero']))
    teoria.sort(key=lambda t: t['id'])
    docs_busca.sort(key=lambda d: d['id'])
    conteudo['itens.json'] = json_bytes(itens)
    conteudo['teoria.json'] = json_bytes(teoria)
    conteudo['busca.json'] = json_bytes(montar_busca(docs_busca))
    conteudo['apelidos.json'] = json_bytes(apelidos)

    n_excl = len(relatorio['excluidos'])
    contagens = {
        'modulos': len(por_modulo),
        'aulas_teoria': len(teoria),
        'paginas_teoria': sum(len(t['paginas']) for t in teoria),
        'aulas_exercicios': sum(len(g['exercicios']) for g in por_modulo.values()),
        'itens': len(itens),
        'itens_com_solucao': sum(1 for i in itens if i['assets']['solucao']),
        'itens_excluidos': n_excl,
    }
    manifest = {
        'esquema': 1, 'pacote': nome, 'versao': versao,
        'gerado_em': gerado_em or datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-3))).replace(microsecond=0).isoformat(),
        # a versao do PyMuPDF muda o SVG (e o hash) de um mesmo recorte: fica no
        # manifest para a reproducao, e nao so no relatorio (lente 2 do #47)
        'gerador': {'nome': 'biblioteca/gerar_pacote.py', 'commit': commit or commit_do_gerador(),
                    'pymupdf': pymupdf.VersionBind},
        'materia': 'matematica', 'fonte': FONTE, 'series': [serie], 'contagens': contagens,
        'arquivos': {k: sha(conteudo[k]) for k in sorted(conteudo)},
    }
    manifest_b = (json.dumps(manifest, ensure_ascii=False, indent=1) + '\n').encode('utf-8')

    zip_caminho = gravar_pacote(conteudo, manifest_b, nome, versao, saida, trabalho, gravar_zip)

    tam = collections.Counter()
    for k, v in conteudo.items():
        if k.startswith('assets/'):
            tipo = 'teoria' if '/teo-p' in k else ('solucao' if k.endswith('-sol.svg') else 'enunciado')
            tam[tipo] += len(v)
            tam['n_' + tipo] += 1
        else:
            tam[k] += len(v)
    if anterior:
        relatorio['comparacao_com_anterior'] = comparar_com_anterior(itens, anterior)
    # curadoria desta serie que nao achou item: id digitado errado nao pode
    # passar calado (o arquivo e um so para todas as series)
    ids = {i['id'] for i in itens}
    ids_excl = {e['id'] for e in relatorio['excluidos']}
    prefixo = serie + ':'
    relatorio['curadoria_sem_item'] = sorted(
        ['dificuldade.csv: ' + k for k in dif_cur if k.startswith(prefixo) and k not in ids and k not in ids_excl] +
        ['exclusoes.csv: ' + k for k in excl_cur if k.startswith(prefixo) and k not in ids_excl])
    relatorio.update({
        'contagens': contagens,
        'hash_manifest_arquivos': sha(json.dumps(manifest['arquivos'], sort_keys=True).encode('utf-8')),
        'hash_manifest': sha(manifest_b),
        'zip': {'caminho': zip_caminho if gravar_zip else None,
                'bytes': os.path.getsize(zip_caminho) if gravar_zip else None},
        'bytes_por_tipo': dict(sorted(tam.items())),
        'enunciados_com_mais_de_um_pedaco': sum(l.get('enunciados_com_mais_de_um_pedaco', 0) for l in relatorio['listas']),
        'solucoes_com_mais_de_um_pedaco': sum(l.get('solucoes_com_mais_de_um_pedaco', 0) for l in relatorio['listas']),
        'segundos': round(time.time() - t_ini, 1),
        'como_o_marcador_foi_achado': (
            'enunciado: span negrito "Exercicio" na margem da coluna (ate 12 pt); forma "junto" quando o proprio span '
            'traz "Exercicio N." e "separado" quando o numero esta no span negrito seguinte da mesma linha visual '
            '(centro vertical a menos de 3 pt, ate 60 pt a direita). Solucao: span negrito "N." ou "N" seguido de span '
            '"." na margem da coluna, depois do titulo Respostas e Solucoes. Contagem por forma em formas_do_marcador.'),
    })
    io.open(os.path.join(trabalho, 'relatorio.json'), 'w', encoding='utf-8', newline='').write(
        json.dumps(relatorio, ensure_ascii=False, indent=1) + '\n')
    for d in abertos.values():
        d.close()
    return manifest, relatorio, trabalho


def comparar_com_anterior(itens, caminho):
    """Quantos itens mudaram de caixa (enunciado ou solucao) contra uma geracao anterior."""
    antes = {i['id']: i for i in json.load(io.open(caminho, encoding='utf-8'))}
    agora = {i['id']: i for i in itens}

    def caixas(i, tipo):
        o = i['origem'].get(tipo)
        if not o:
            return None
        return [tuple(pz['bbox']) for pz in (o.get('pedacos') or [o])]

    mudou = sorted(k for k in set(antes) & set(agora)
                   if any(caixas(antes[k], t) != caixas(agora[k], t) for t in ('enunciado', 'solucao')))
    return {'arquivo': caminho.replace('\\', '/'), 'itens_antes': len(antes), 'itens_agora': len(agora),
            'sairam': sorted(set(antes) - set(agora)), 'entraram': sorted(set(agora) - set(antes)),
            'com_caixa_diferente': len(mudou), 'ids_com_caixa_diferente': mudou}


def principal(argv=None):
    ap = argparse.ArgumentParser(description='Gera o pacote de biblioteca de uma serie do Portal da OBMEP.')
    ap.add_argument('--pdfs', required=True)
    ap.add_argument('--serie', required=True)
    ap.add_argument('--versao', type=int, required=True)
    ap.add_argument('--saida', required=True)
    ap.add_argument('--curadoria', required=True)
    ap.add_argument('--trabalho')
    ap.add_argument('--gerado-em')
    ap.add_argument('--commit')
    ap.add_argument('--modulos', help='so estes modulos, separados por virgula')
    ap.add_argument('--sem-zip', action='store_true')
    ap.add_argument('--anterior', help='itens.json de uma geracao anterior, para contar as caixas que mudaram')
    ap.add_argument('--fontes-negrito', help='pedacos de nome de fonte negrito, separados por virgula '
                    '(padrao %s)' % ','.join(FONTES_NEGRITO))
    a = ap.parse_args(argv)
    if a.fontes_negrito:
        FONTES_NEGRITO[:] = [x for x in a.fontes_negrito.split(',') if x]
    manifest, rel, trab = gerar(a.pdfs, a.serie, a.versao, a.saida, a.curadoria, a.trabalho, a.gerado_em, a.commit,
                                a.modulos.split(',') if a.modulos else None, not a.sem_zip, a.anterior)
    print(json.dumps({'contagens': manifest['contagens'], 'zip': rel['zip'], 'bytes_por_tipo': rel['bytes_por_tipo'],
                      'excluidos': len(rel['excluidos']), 'segundos': rel['segundos'], 'trabalho': trab},
                     ensure_ascii=False, indent=1))


if __name__ == '__main__':
    principal()
