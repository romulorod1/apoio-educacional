"""Provas do gerador do pacote de biblioteca, com um par envenenado por trava.

    python biblioteca/_prova_gerador.py
        amostra sintetica (o que roda no portao, sem o Drive): gera os PDFs de
        biblioteca/_amostra/fazer_amostra.py numa pasta temporaria, gera o
        pacote DUAS vezes, passa as travas e, para cada trava, um veneno que
        ela TEM de reprovar.

    python biblioteca/_prova_gerador.py --real --pdfs <pasta da serie> --trabalho <A> --trabalho2 <B> [--zip <pacote.zip>]
        as mesmas travas sobre um pacote de verdade gerado duas vezes (A e B).

    --sem-navegador pula a fidelidade (Chrome headless), para rodar durante o
    portao de outra frente.

Travas (CONTRATO_pacote_biblioteca.md, secao 9, mais os pedidos da B4):
  determinismo  dois pacotes do mesmo comando tem os mesmos hashes
  contagens     por lista, enunciados 1..N sem lacuna, cada numero no pacote
                ou excluido com motivo, solucao casada pelo rotulo, rotulo
                duplicado na fonte nunca entra
  recorte       altura, primeira linha comeca pelo numero, o fio entre colunas
                fora, titulo de secao fora, pedacos sem sobrepor, rotulo
                dentro do recorte e lendo o numero
  objetiva      letra de A a E, escrita na solucao da fonte
  svg           autocontido: sem <text>, sem @font-face, sem referencia
                externa, tamanho igual a medidas
  manifesto     todo arquivo com hash certo, nada sobrando nem faltando
  tracos        nada de travessao nem meia-risca em texto
  origem        origem_citada literal na fonte
  fidelidade    20 pedacos sorteados com semente fixa: SVG no Chrome contra o
                pixmap do pymupdf do mesmo retangulo, diferenca abaixo de 1%
  series (B2)   padroes medidos fora do 9o ano (Biblioteca/PADROES_numeracao_6_series.md):
                solucoes sem titulo, marcador com recuo de paragrafo, solucao
                em duas partes, marcador em CMBX10, titulo do modulo pela capa
                das listas; toda lista com solucoes

Saida no dialeto do portao: "N verificacoes passaram, M falharam".
"""
import argparse
import collections
import copy
import hashlib
import io
import json
import math
import os
import random
import re
import shutil
import subprocess
import sys
import tempfile

import pymupdf

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import apelidos as apelidos_mod  # noqa: E402
import gerar_pacote  # noqa: E402
import portal  # noqa: E402

sys.path.insert(0, os.path.join(AQUI, '_amostra'))
import fazer_amostra  # noqa: E402

LIMITE_FIDELIDADE = 0.01
DIFERENCA_PIXEL = 64      # de 255: abaixo disto e antialias, nao e conteudo
DPI_FIDELIDADE = 150
SEMENTE = 2026
SECAO = re.compile(r'Exerc\S*cios\s+(Introdut|de\s+Fixa|de\s+Aprofund)|Respostas\s*e\s*Solu|E\s*laborado\s+por\b|P\s*roduzido\s+por\b|cursoarquimedes')


# ------------------------------------------------------------------ pacote em disco

class Pacote:
    """Um pacote gerado, lido da pasta de trabalho."""

    def __init__(self, pasta, pdfs):
        self.pasta = pasta
        self.pdfs = pdfs
        ler = lambda n: json.load(io.open(os.path.join(pasta, n), encoding='utf-8'))
        self.manifest = ler('manifest.json')
        self.itens = ler('itens.json')
        self.teoria = ler('teoria.json')
        self.busca = ler('busca.json')
        self.apelidos = ler('apelidos.json')
        self.relatorio = ler('relatorio.json')
        self._docs = {}

    def doc(self, arquivo):
        """PDF de origem aberto do zero (ver gerar_pacote.svg_do_pedaco sobre o get_text)."""
        if arquivo not in self._docs:
            self._docs[arquivo] = pymupdf.open(os.path.join(self.pdfs, os.path.basename(arquivo)))
        return self._docs[arquivo]

    def bytes_de(self, caminho):
        with open(os.path.join(self.pasta, *caminho.split('/')), 'rb') as f:
            return f.read()

    def gravar(self, nome, obj):
        io.open(os.path.join(self.pasta, nome), 'w', encoding='utf-8', newline='').write(
            json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + '\n')


def pedacos(item, tipo):
    o = item['origem'].get(tipo)
    if not o:
        return []
    return o.get('pedacos') or [{'pagina': o['pagina'], 'coluna': o['coluna'], 'bbox': o['bbox']}]


def fio_da_pagina(pg):
    return [d['rect'] for d in pg.get_drawings() if d['rect'].width < 1.5 and d['rect'].height > 400]


# ------------------------------------------------------------------ oraculos da prova
#
# Achado da lente 2 do #47: tres travas decidiam com as funcoes do proprio
# gerador (a primeira linha do recorte, a letra da objetiva e a divisa de
# colunas quando a pagina nao tem fio), e entao comparavam o gerador com ele
# mesmo. Os oraculos abaixo leem a pagina por outro caminho; a trava
# "prova independente do gerador" roda as travas com aquelas funcoes do
# gerador trocadas por uma que falha, e exige o mesmo resultado.

def divisa_pela_tinta(pg):
    """Divisa de colunas pelo corredor sem tinta entre 250 e 360 pt, na pagina renderizada.

    Nao usa fio nem margem de texto: a faixa vertical mais larga sem nenhum
    pixel escuro no corpo da pagina (entre 10% e 90% da altura), e a divisa 5
    pt antes de onde ela termina. Pelo fim, e nao pelo meio: a coluna direita
    comeca sempre na mesma margem, e a esquerda termina onde cada linha acaba
    (o meio variava de 272 a 297 pt entre as paginas de Produtos Notaveis).
    """
    tmp = pymupdf.open()
    tmp.insert_pdf(pg.parent, from_page=pg.number, to_page=pg.number)
    pix = tmp[0].get_pixmap(dpi=72, colorspace=pymupdf.csGRAY)
    tmp.close()
    w, h, s = pix.width, pix.height, pix.samples
    ya, yb = int(h * 0.1), int(h * 0.9)
    livre = [not any(s[y * w + x] < 160 for y in range(ya, yb)) for x in range(w)]
    # o corredor mais a direita (com 4 px ou mais) que termina em tinta antes de 360:
    # a coluna direita comeca sempre na margem, entao a direita do vao nao sobra
    # corredor; o mais largo falhava quando uma linha da esquerda ia ate quase o
    # vao e sobrava um corredor maior no meio da coluna (amostra, "fim"). Sem
    # nenhum assim (coluna direita vazia), o mais largo.
    corredores, ini = [], None
    for x in range(250, min(361, w)):
        if livre[x] and ini is None:
            ini = x
        if (not livre[x] or x == min(360, w - 1)) and ini is not None:
            fim = x if not livre[x] else x + 1
            corredores.append((ini, fim, not livre[x]))
            ini = None
    fechados = [c for c in corredores if c[2] and c[1] - c[0] >= 4]
    if fechados:
        return fechados[-1][1] - 5.0
    if corredores:
        return max(corredores, key=lambda c: c[1] - c[0])[1] - 5.0
    return None


def divisa_da_prova(doc, pg):
    """O fio da pagina; sem ele, o fio mais frequente do documento; sem nenhum, a tinta."""
    fios = fio_da_pagina(pg)
    if fios:
        return fios[0].x0
    todos = [round(f.x0, 1) for q in doc for f in fio_da_pagina(q)]
    if todos:
        return max(set(todos), key=todos.count)
    return divisa_pela_tinta(pg)


def comeco_do_recorte(pg, bbox):
    """O texto que o leitor le primeiro no recorte, pelos caracteres do PDF.

    A linha e a dos caracteres com a mesma linha de base. A primeira e a de
    base mais alta entre as que comecam ate 45 pt da borda esquerda do
    recorte: o que sobe acima da linha do marcador (radical, numerador) comeca
    depois do "Exercicio N.", mais para dentro, e o marcador com recuo de
    paragrafo (23,5 pt) ainda conta.
    """
    r = pymupdf.Rect(bbox)
    cs = []
    for b in pg.get_text('rawdict')['blocks']:
        if b['type'] != 0:
            continue
        for l in b['lines']:
            for sp in l['spans']:
                # glifo de extensao (radical e parentese grandes, fonte CMEX) nao e
                # texto de leitura: os radicais da 2a linha da solucao 23 de Fatoracao
                # (8o ano) tem base 4 pt abaixo do "23." e a margem mais a esquerda
                # que ele, e faziam a linha do rotulo parecer suspensa
                if 'CMEX' in sp['font']:
                    continue
                for c in sp['chars']:
                    x0, y0, x1, y1 = c['bbox']
                    # pelo centro: a caixa da fonte passa da tinta, e o recorte e pela tinta
                    if c['c'].strip() and r.contains(pymupdf.Point((x0 + x1) / 2, (y0 + y1) / 2)):
                        cs.append((x0, c['origin'][1], c['c']))
    linhas = []
    for c in sorted(cs, key=lambda c: c[1]):
        if linhas and abs(c[1] - linhas[-1][0]) < 2.0:
            linhas[-1][1].append(c)
        else:
            linhas.append([c[1], [c]])
    # glifo solto (o radical de "A = raiz de 21(21-13)...", Areas, solucao 8, e o
    # parentese grande) forma "linha" de um caractere: nao conta
    inicio = [(base, min(c[0] for c in cs_l), cs_l) for base, cs_l in linhas if len(cs_l) >= 2]
    # linha suspensa (numerador de fracao, expoente): outra linha comeca mais a
    # esquerda logo abaixo dela, a menos de 9,5 pt (a entrelinha e 12 pt; o
    # numerador de "A = 4(5+7) sobre 2" sobe uns 7 pt, Areas, solucao 5)
    perto = [(b, x, l) for b, x, l in inicio if x <= r.x0 + 45
             and not any(0 < b2 - b < 9.5 and x2 < x - 5 for b2, x2, _ in inicio)]
    if not perto:
        return ''
    return portal.recompor(''.join(c[2] for c in sorted(perto[0][2], key=lambda c: c[0])))


def letras_da_solucao(texto):
    """As letras de resposta que a solucao escreve, lidas palavra a palavra.

    Depois de "resposta", "letra", "alternativa" ou "opcao", a primeira palavra
    que e uma letra solta de A a E (com ou sem parenteses e pontuacao), a ate
    8 palavras dali. Ou a solucao inteira e "N. X.".
    """
    import unicodedata
    t = unicodedata.normalize('NFD', texto)
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    palavras = t.split()
    achadas = set()
    gatilhos = ('resposta', 'letra', 'alternativa', 'opcao')
    for k, p in enumerate(palavras):
        if p.lower().strip(':.,;()') in gatilhos:
            for q in palavras[k + 1:k + 9]:
                n = q.strip('.,;:()')
                if len(n) == 1 and n in 'ABCDE':
                    achadas.add(n)
                    break
                if re.search(r'[A-Za-z]{2,}', n) and n.lower() not in ('letra', 'e', 'a', 'o', 'da', 'de'):
                    break
    so = re.match(r'^\s*\d+\s*\.\s*\(?([A-E])\)?\s*\.?\s*$', ' '.join(palavras))
    if so:
        achadas.add(so.group(1))
    return achadas


def primeira_palavra(cs):
    """Primeira palavra da linha: caracteres a menos de 2,5 pt um do outro.

    A linha de base junta coisas distantes: um "2" solto em x 29,5 e o "15."
    de "10 raiz de 15." em x 43,5 liam "215." (Relacao de Euler, p. 5).
    """
    out = [cs[0]]
    for a, b in zip(cs, cs[1:]):
        if b[0] - a[4][2] > 2.5:
            break
        out.append(b)
    return ''.join(c[1] for c in out).strip()


LIMIAR_TINTA_PROVA = 235   # de 255: cinza claro de figura ainda e tinta
CORTE_PERMITIDO = re.compile(r'^(\d+)?Exerc\S*cios(Introdut|deFixa|deAprofund)|^deExames|^Exames|^Respostas?eSolu'
                             r'|^E?laboradopor|^P?roduzidopor|cursoarquimedes')
# linha que so se pula, sem fechar o item aberto: endereco do rodape e numero
# solto (numero da pagina, denominador "2" de uma fracao centrada)
SO_PULA = re.compile(r'^http|^matematica\.obmep|^\d+$')


def _linhas_da_pagina(doc, pno):
    """Linhas de corpo normal (acima de 8,5 pt) da pagina, por coluna e em ordem, e o teste de tinta.

    A tinta e da pagina renderizada: glifo sem tinta (o "." invisivel no fim de
    uma formula de Conjuntos Numericos) nao e conteudo. Limiar claro, 235: o
    rotulo cinza de uma figura (BH[180], Nocoes Basicas) e conteudo.
    """
    pg = doc[pno]
    xsep = divisa_da_prova(doc, pg)
    tmp = pymupdf.open()
    tmp.insert_pdf(doc, from_page=pno, to_page=pno)
    pix = tmp[0].get_pixmap(dpi=100, colorspace=pymupdf.csGRAY)
    tmp.close()
    kpx = 100 / 72.0
    amostras = pix.samples  # uma copia so: cada acesso a pix.samples copia a imagem

    def tem_tinta(bb, fora_de=()):
        """Ha tinta na caixa do glifo, nos pixels que nao estao em nenhum dos retangulos?

        So fora deles: a caixa de um glifo de simbolo e bem mais alta que o desenho
        (189 a 220 pt, com a tinta de 192 a 199), e a parte dela dentro do recorte
        nao e texto perdido.
        """
        xa, xb = max(0, int(bb[0] * kpx)), min(pix.width, int(bb[2] * kpx) + 1)
        ya, yb = max(0, int(bb[1] * kpx)), min(pix.height, int(bb[3] * kpx) + 1)
        rs = [(r.x0 * kpx, r.y0 * kpx, r.x1 * kpx, r.y1 * kpx) for r in fora_de]
        for y in range(ya, yb):
            for x in range(xa, xb):
                if amostras[y * pix.width + x] < LIMIAR_TINTA_PROVA and not any(
                        a <= x + 0.5 <= c and b <= y + 0.5 <= d for a, b, c, d in rs):
                    return True
        return False

    largos = [d['rect'].y0 for d in pg.get_drawings() if d['rect'].height < 1.5 and d['rect'].width > 400
              and d['rect'].y0 > pg.rect.height * 0.8]
    pe = min(largos) if largos else pg.rect.height - 45
    por_linha = collections.defaultdict(list)
    for b in pg.get_text('rawdict')['blocks']:
        if b['type'] != 0:
            continue
        for ln in b['lines']:
            for sp in ln['spans']:
                if sp['size'] <= 8.5:
                    continue
                for c in sp['chars']:
                    if not c['c'].strip():
                        continue
                    cx, cy = (c['bbox'][0] + c['bbox'][2]) / 2, (c['bbox'][1] + c['bbox'][3]) / 2
                    if cy >= pe:
                        continue
                    # caractere por cima do fio entre as colunas: e da regra de exclusao
                    # por calha, que tem trava propria (exclusoes_por_calha_sem_base); pelo
                    # centro ele cairia na coluna do lado e no item errado (o "." de
                    # Conjuntos Numericos, p. 9, do item 23, ja excluido por isso)
                    if c['bbox'][0] < xsep - 0.5 and c['bbox'][2] > xsep + 0.5:
                        continue
                    col = 0 if cx < xsep else 1
                    por_linha[(col, round(c['origin'][1]))].append((c['bbox'][0], c['c'], cx, cy, tuple(c['bbox'])))
    # linhas de base a menos de 2 pt sao a mesma linha
    linhas = []
    for k in sorted(por_linha):
        if linhas and linhas[-1][0][0] == k[0] and abs(linhas[-1][0][1] - k[1]) <= 2:
            linhas[-1][1].extend(por_linha[k])
        else:
            linhas.append([k, list(por_linha[k])])
    for _, cs in linhas:
        cs.sort()
    return linhas, tem_tinta


def trava_tinta_coberta(p):
    """Todo texto de corpo normal da lista esta num recorte, ou e um corte permitido.

    Pedido depois do achado da nota falsa (Inequacoes Mistas, 1o medio): a
    barra de uma fracao na margem virou "nota de rodape", e o resto do
    exercicio 9 ficou fora de todo recorte sem nenhuma trava ver, porque as
    travas so olhavam o que ESTAVA no recorte. Aqui manda a pagina: linha a
    linha, em ordem de leitura, cada linha de corpo normal (acima de 8,5 pt,
    o que deixa de fora nota de rodape e expoente) pertence ao item aberto
    naquele ponto. Linha sem recorte so passa se for titulo de secao,
    cabecalho, credito, rodape ou texto de item excluido com motivo.
    """
    erros = []
    for l in p.relatorio['listas']:
        if 'erro' in l:
            continue
        doc = p.doc(l['arquivo'])
        excluidos = {e['numero'] for e in l['excluidos']}
        rects = collections.defaultdict(list)
        for it in p.itens:
            if os.path.basename(it['origem']['arquivo']) != l['arquivo']:
                continue
            for tipo in ('enunciado', 'solucao'):
                for pz in pedacos(it, tipo):
                    rects[pz['pagina']].append(pymupdf.Rect(pz['bbox']))
        paginas = {pno: _linhas_da_pagina(doc, pno) for pno in range(1, doc.page_count)}
        # margem de cada coluna, na lista inteira: o menor comeco de linha que
        # aparece pelo menos 3 vezes (a 1 pt). Nao a moda nem por pagina: uma
        # tabela recuada em x 70 enchia a p. 6 de Conjuntos Numericos, que so
        # tinha duas linhas na margem
        margem = {}
        for col in (0, 1):
            xs = [int(min(c[0] for c in cs)) for linhas, _ in paginas.values() for (cc, _b), cs in linhas if cc == col]
            rep = [x for x in set(xs) if sum(1 for y in xs if abs(y - x) <= 1) >= 3]
            margem[col] = min(rep) if rep else None
        dono, em_sol, viu_enunciado = None, False, False
        for pno in range(1, doc.page_count):
            linhas, tem_tinta = paginas[pno]
            for k_l, ((col, base), cs) in enumerate(linhas):
                texto = portal.recompor(''.join(c[1] for c in cs))
                sem = re.sub(r'\s+', '', texto)
                if SO_PULA.search(sem):
                    continue
                if CORTE_PERMITIDO.search(sem):
                    if re.match(r'^Respostas?eSolu', sem):
                        em_sol = True
                    elif viu_enunciado and not em_sol and re.match(r'^(1)?Exerc\S*ciosIntrodut', sem):
                        em_sol = True  # solucoes sem titulo (Potenciacao)
                    dono = None
                    continue
                m = re.match(r'^Exerc\S*cio(\d+)\.', sem)
                if m and not em_sol:
                    dono, viu_enunciado = int(m.group(1)), True
                elif (em_sol and re.match(r'^\d+\.', primeira_palavra(cs)) and margem[col] is not None
                      and abs(cs[0][0] - margem[col]) <= 12
                      # a numeracao das solucoes anda de um em um (a mesma, na solucao em
                      # duas partes): "11. Resposta B." e o fim da solucao 21 de Operacoes
                      # com Numeros Naturais (6o ano), e nao a 11; "1986." e um ano
                      and (dono is None or 0 <= int(re.match(r'^(\d+)', primeira_palavra(cs)).group(1)) - dono <= 3)):
                    dono = int(re.match(r'^(\d+)', primeira_palavra(cs)).group(1))
                fora = [c for c in cs if not any(r.contains(pymupdf.Point(c[2], c[3])) for r in rects[pno + 1])]
                if not [c for c in fora if tem_tinta(c[4], rects[pno + 1])]:
                    continue
                # linha suspensa logo acima de um marcador (o numerador "AB.GE" da
                # fracao de "26. A area ... e AB.GE sobre 2", Areas, p. 12) e do
                # item desse marcador, que ainda nao foi lido. A fracao pode empilhar
                # varias linhas suspensas (o expoente do numerador de "3(-1/2)^2 + 1/4",
                # Expressoes Numericas, 8o ano, 27 pt de base acima do rotulo 5): sobe a pilha
                # de linhas coladas (menos de 9,5 pt entre bases), ate 30 pt abaixo
                # desta, ate a primeira que comeca a esquerda dela com um rotulo
                dono_l = dono
                prox = None
                for j in range(k_l + 1, len(linhas)):
                    (cj, bj), csj = linhas[j]
                    if cj != col or not 0 < bj - base < 30 or not bj - linhas[j - 1][0][1] < 9.5:
                        break
                    sj = re.sub(r'\s+', '', portal.recompor(''.join(c[1] for c in csj)))
                    if csj[0][0] < cs[0][0] - 5 and (re.match(r'^Exerc\S*cio\d+\.', sj) or re.match(r'^\d+\.', primeira_palavra(csj))):
                        prox = linhas[j]
                        break
                if prox:
                    pw = primeira_palavra(prox[1])
                    mm = re.match(r'^Exerc\S*cio(\d+)\.', re.sub(r'\s+', '', portal.recompor(''.join(c[1] for c in prox[1]))))
                    if mm and not em_sol:
                        dono_l = int(mm.group(1))
                    elif em_sol and re.match(r'^\d+\.', pw):
                        dono_l = int(re.match(r'^(\d+)', pw).group(1))
                if dono_l is None or dono_l in excluidos:
                    continue
                dono_msg = dono_l
                erros.append('%s p%d: linha fora de todo recorte, no item %s: %r' % (l['aula'], pno + 1, dono_msg, texto[:50]))
    return erros


def enunciados_no_texto(doc):
    """Numeros dos "Exercicio N." no texto do PDF, antes das solucoes, sem o detector."""
    nums = []
    for pno in range(1, doc.page_count):
        t = portal.recompor(doc[pno].get_text('text'))
        for m in re.finditer(r'Exerc\S*cio\s*(\d+)\s*\.', t):
            nums.append(int(m.group(1)))
    return nums


# ------------------------------------------------------------------ travas

def trava_determinismo(a, b):
    if a.manifest['arquivos'] == b.manifest['arquivos']:
        return []
    ka, kb = a.manifest['arquivos'], b.manifest['arquivos']
    dif = sorted(k for k in set(ka) | set(kb) if ka.get(k) != kb.get(k))
    return ['%d arquivos diferem entre as duas geracoes, por exemplo %s' % (len(dif), dif[:3])]


def trava_contagens(p):
    erros = []
    por_aula = {}
    for i in p.itens:
        por_aula.setdefault(os.path.basename(i['origem']['arquivo']), []).append(i['numero'])
    for l in p.relatorio['listas']:
        if 'erro' in l:
            erros.append('%s: %s' % (l['aula'], l['erro']))
            continue
        ne, ns = l['numeros_enunciado'], l['numeros_solucao']
        n = len(ne)
        if ne != list(range(1, n + 1)):
            erros.append('%s: enunciados fora de sequencia %s' % (l['aula'], ne))
        # pelo texto do PDF, sem o detector: pega o ultimo item perdido, que deixa
        # a sequencia 1..N-1 perfeita. Citacao repetida ("veja o Exercicio 3.") pode.
        no_texto = set(enunciados_no_texto(p.doc(l['arquivo'])))
        if no_texto != set(range(1, n + 1)):
            erros.append('%s: o texto do PDF tem os enunciados %s, e o detector achou 1..%d' % (
                l['aula'], sorted(no_texto), n))
        # por arquivo, e nao por aula: ha duas listas "resolucao-de-exercicios"
        no_pacote = sorted(por_aula.get(l['arquivo'], []))
        excl = sorted(e['numero'] for e in l['excluidos'])
        if sorted(no_pacote + excl) != list(range(1, n + 1)):
            erros.append('%s: itens no pacote %s mais excluidos %s nao dao 1..%d' % (l['aula'], no_pacote, excl, n))
        if any(not e.get('motivo') for e in l['excluidos']):
            erros.append('%s: excluido sem motivo' % l['aula'])
        # as 230 listas das 7 series tem solucoes (medido pela B2); lista sem elas
        # e detector que perdeu a secao (Potenciacao, 8o ano, nao tem o titulo)
        if not l.get('pagina_solucoes'):
            erros.append('%s: lista sem solucoes detectadas' % l['aula'])
        if l.get('pagina_solucoes'):
            for x in no_pacote:
                if ns.count(x) != 1:
                    erros.append('%s: item %d no pacote com %d solucoes rotuladas %d. na fonte' % (l['aula'], x, ns.count(x), x))
            if len(ns) != n and not excl:
                erros.append('%s: %d enunciados e %d solucoes sem lacuna registrada' % (l['aula'], n, len(ns)))
    erros.extend(exclusoes_por_calha_sem_base(p))
    c = p.manifest['contagens']
    if c['itens'] != len(p.itens) or c['itens_com_solucao'] != sum(1 for i in p.itens if i['assets']['solucao']):
        erros.append('manifest.contagens nao bate com itens.json')
    if c['itens_excluidos'] != sum(len(l['excluidos']) for l in p.relatorio['listas']):
        erros.append('manifest.contagens.itens_excluidos nao bate com o relatorio')
    return erros


def exclusoes_por_calha_sem_base(p):
    """Item excluido por "conteudo por cima do fio" tem de ter tinta de verdade ali.

    Confere pela pagina original, com o fio que esta desenhado nela, e nao com
    a divisa que o gerador mediu: com a divisa errada o gerador excluiria em
    massa, com motivo e tudo, e a contagem fecharia.
    """
    erros = []
    for l in p.relatorio['listas']:
        for e in l['excluidos']:
            c = e.get('calha')
            if not c:
                continue
            doc = p.doc(l['arquivo'])
            pg = doc[c['pagina'] - 1]
            fios = fio_da_pagina(pg)
            if not fios:
                erros.append('%s %d: excluido por calha numa pagina sem fio' % (l['aula'], e['numero']))
                continue
            x = fios[0].x0
            tmp = pymupdf.open()
            tmp.insert_pdf(doc, from_page=c['pagina'] - 1, to_page=c['pagina'] - 1)
            tinta = False
            for faixa in (pymupdf.Rect(x - 2.5, c['y'][0], x - 0.8, c['y'][1]), pymupdf.Rect(x + 0.8, c['y'][0], x + 2.5, c['y'][1])):
                pix = tmp[0].get_pixmap(dpi=DPI_FIDELIDADE, colorspace=pymupdf.csGRAY, clip=faixa)
                tinta = tinta or any(v < 128 for v in pix.samples)
            if not tinta:
                erros.append('%s %d: excluido por conteudo sobre o fio, e nao ha tinta junto do fio da pagina' % (l['aula'], e['numero']))
    return erros


def texto_na_caixa(pg, caixa):
    """Caracteres com o centro e a linha de base dentro da caixa. As caixas de
    fonte de duas linhas seguidas se sobrepoem, entao ler por intersecao traria
    a linha de baixo; e o radical da linha de baixo tem o centro alto."""
    out = []
    for b in pg.get_text('rawdict')['blocks']:
        if b['type'] != 0:
            continue
        for l in b['lines']:
            for sp in l['spans']:
                for c in sp['chars']:
                    cx, cy = (c['bbox'][0] + c['bbox'][2]) / 2, (c['bbox'][1] + c['bbox'][3]) / 2
                    base = c['origin'][1]
                    if caixa.x0 <= cx <= caixa.x1 and caixa.y0 <= cy <= caixa.y1 and caixa.y0 <= base <= caixa.y1:
                        out.append((c['bbox'][0], c['c']))
    return ''.join(portal.recompor(''.join(c for _, c in sorted(out))).split())


def borda_com_tinta(p, it, pz, caixa):
    """A borda de cima ou a de baixo da caixa do rotulo passa por cima de tinta?

    O aplicativo cobre a caixa de branco para escrever o numero novo. Se a
    borda horizontal da caixa cruza tinta na pagina original, a caixa esta
    alta demais e o branco apagaria o pedaco de uma linha vizinha (o radical
    de "tem entre raiz de 8", Conjuntos Numericos, exercicio 10).
    """
    tmp = pymupdf.open()
    tmp.insert_pdf(p.doc(it['origem']['arquivo']), from_page=pz['pagina'] - 1, to_page=pz['pagina'] - 1)
    pix = tmp[0].get_pixmap(dpi=DPI_FIDELIDADE, colorspace=pymupdf.csGRAY, clip=caixa)
    w, h, s = pix.width, pix.height, pix.samples
    lados = []
    if any(s[x] < 128 for x in range(w)):
        lados.append('de cima')
    if any(s[(h - 1) * w + x] < 128 for x in range(w)):
        lados.append('de baixo')
    return ' e '.join(lados)


def conteudo_na_caixa(p, it, pg, pz):
    """O recorte tem por inteiro o que esta dentro dele, e nada da outra coluna?

    Pedido da orquestradora depois da conferencia do pacote: caixa estreita
    corta texto na borda, e a prova de fidelidade nao enxerga isso, porque
    compara o recorte com ele mesmo. Aqui manda a pagina original:
    - nenhuma das quatro bordas da caixa passa por cima de tinta (o recorte e
      apertado pela tinta com 3 pt de folga; tinta na borda e conteudo
      cortado). E por tinta, e nao pela caixa do span, porque a caixa de fonte
      do radical e dos parenteses grandes e bem maior que o desenho;
    - nenhum span com o centro na outra coluna encosta na caixa;
    - o fio do rodape (o fio longo mais baixo da pagina) nao entra na caixa.
    """
    erros = []
    r = pymupdf.Rect(pz['bbox'])
    # Corte e tinta que atravessa a borda: escuro no ultimo pixel de dentro E no
    # primeiro de fora, na mesma coluna (ou linha). Tinta que so COMECA na borda
    # nao e corte: dois itens colados na fonte dividem a borda sem perder nada.
    tmp = pymupdf.open()
    tmp.insert_pdf(p.doc(it['origem']['arquivo']), from_page=pz['pagina'] - 1, to_page=pz['pagina'] - 1)
    k = DPI_FIDELIDADE / 72.0
    fora = r + (-2, -2, 2, 2)
    pix = tmp[0].get_pixmap(dpi=DPI_FIDELIDADE, colorspace=pymupdf.csGRAY, clip=fora)
    w, h, s = pix.width, pix.height, pix.samples
    x0, y0 = int(round((r.x0 - fora.x0) * k)), int(round((r.y0 - fora.y0) * k))
    x1, y1 = int(round((r.x1 - fora.x0) * k)) - 1, int(round((r.y1 - fora.y0) * k)) - 1
    esc = lambda x, y: 0 <= x < w and 0 <= y < h and s[y * w + x] < 128
    cortes = {
        'de cima': any(esc(x, y0) and esc(x, y0 - 1) for x in range(x0, x1 + 1)),
        'de baixo': any(esc(x, y1) and esc(x, y1 + 1) for x in range(x0, x1 + 1)),
        'esquerda': any(esc(x0, y) and esc(x0 - 1, y) for y in range(y0, y1 + 1)),
        'direita': any(esc(x1, y) and esc(x1 + 1, y) for y in range(y0, y1 + 1)),
    }
    for nome, v in cortes.items():
        if v:
            erros.append('tinta cortada na borda %s' % nome)
    # pagina sem fio (Razoes Trigonometricas, pagina 5; Produtos Notaveis inteira):
    # a divisa medida pela prova, e nao a do gerador
    xsep = divisa_da_prova(p.doc(it['origem']['arquivo']), pg)
    lado = 0 if (r.x0 + r.x1) / 2 < xsep else 1
    for b in pg.get_text('dict')['blocks']:
        if b['type'] != 0:
            continue
        for l in b['lines']:
            for sp in l['spans']:
                if not sp['text'].strip():
                    continue
                bb = pymupdf.Rect(sp['bbox'])
                cx = (bb.x0 + bb.x1) / 2
                if ((cx < xsep) != (lado == 0)) and bb.intersects(r) and (bb & r).width > 2:
                    erros.append('texto da outra coluna dentro: %r' % sp['text'][:25])
    # nota de rodape: fio curto na margem com texto miudo logo abaixo, dentro da
    # caixa, e nada de corpo normal abaixo dele na coluna (a nota fica no pe; a
    # barra de uma fracao na margem tem o resto do item embaixo)
    # o rodape da pagina (endereco, numero) fica fora da conta
    fios_pe = [d['rect'].y0 for d in pg.get_drawings() if d['rect'].height < 1.5 and d['rect'].width > 400
               and d['rect'].y0 > pg.rect.height * 0.8]
    y_pe = min(fios_pe) if fios_pe else pg.rect.height - 45
    spans = [sp for b in pg.get_text('dict')['blocks'] if b['type'] == 0 for l in b['lines'] for sp in l['spans']
             if sp['text'].strip() and sp['bbox'][1] < y_pe]
    for d in pg.get_drawings():
        q = d['rect']
        if q.height < 1.5 and 40 <= q.width <= 140 and r.y0 <= q.y0 <= r.y1 and r.x0 <= q.x0 <= r.x1:
            miudo = [sp for sp in spans if 0 <= sp['bbox'][1] - q.y0 <= 12 and q.x0 - 1 <= sp['bbox'][0] <= q.x1]
            corpo_abaixo = any(sp['size'] > 8.5 and sp['bbox'][1] > q.y0 + 0.5
                               and ((sp['bbox'][0] + sp['bbox'][2]) / 2 < xsep) == (lado == 0) for sp in spans)
            if (miudo and all(sp['size'] <= 8.5 for sp in miudo) and not corpo_abaixo
                    and any(r.contains(pymupdf.Rect(sp['bbox'])) for sp in miudo)):
                erros.append('nota de rodape dentro do recorte')
    # desenho ou imagem: em Produtos Notaveis (8o ano) o fio do rodape e uma imagem
    largos = [q for q in [d['rect'] for d in pg.get_drawings()] +
              [pymupdf.Rect(b['bbox']) for b in pg.get_text('dict')['blocks'] if b['type'] == 1]
              if q.height < 1.5 and q.width > 400 and q.y0 < pg.rect.height]
    if largos:
        rod = max(largos, key=lambda q: q.y0)
        # por coordenada: o fio tem altura zero, e o intersects do PyMuPDF trata
        # retangulo vazio como sem intersecao
        if r.y0 <= rod.y0 <= r.y1 and rod.x0 < r.x1 and rod.x1 > r.x0:
            erros.append('fio horizontal longo (rodape) dentro do recorte')
    return erros[:3]


def trava_recorte(p):
    erros = []
    ocupado = {}
    for it in p.itens:
        doc = p.doc(it['origem']['arquivo'])
        for tipo in ('enunciado', 'solucao'):
            ps = pedacos(it, tipo)
            if not ps:
                continue
            minimo = gerar_pacote.ALTURA_MIN_ENUNCIADO if tipo == 'enunciado' else gerar_pacote.ALTURA_MIN_SOLUCAO
            total = 0.0
            for k, pz in enumerate(ps):
                pg = doc[pz['pagina'] - 1]
                x0, y0, x1, y1 = pz['bbox']
                total += y1 - y0
                if y1 - y0 > pg.rect.height - 60:
                    erros.append('%s %s: pedaco maior que a coluna' % (it['id'], tipo))
                for f in fio_da_pagina(pg):
                    if x0 <= f.x0 <= x1 and f.y1 > y0 and f.y0 < y1:
                        erros.append('%s %s: o fio entre colunas (x %.1f) entra no recorte' % (it['id'], tipo, f.x0))
                erros.extend('%s %s: %s' % (it['id'], tipo, e) for e in conteudo_na_caixa(p, it, pg, pz))
                txt = portal.recompor(pg.get_text('text', clip=pymupdf.Rect(pz['bbox'])))
                if SECAO.search(txt):
                    erros.append('%s %s: titulo de secao dentro do recorte' % (it['id'], tipo))
                chave = (it['origem']['arquivo'], tipo, pz['pagina'], pz['coluna'])
                for (a, b, dono) in ocupado.get(chave, []):
                    if y0 < b - 0.01 and a < y1 - 0.01:
                        erros.append('%s %s: sobrepoe o recorte de %s' % (it['id'], tipo, dono))
                # a nota de rodape (ultimo pedaco, so texto miudo) fica no pe da coluna,
                # abaixo de itens de numero maior: nao entra na conta da ordem
                if not (k > 0 and k == len(ps) - 1 and so_miudo(pg, pz['bbox'])):
                    ocupado.setdefault(chave, []).append((y0, y1, it['id']))
            if total < minimo:
                erros.append('%s %s: %.1f pt de altura, abaixo de %d' % (it['id'], tipo, total, minimo))
            primeiro = ps[0]
            # pelos caracteres do recorte, sem a funcao do gerador (lente 2 do #47)
            linha = comeco_do_recorte(doc[primeiro['pagina'] - 1], primeiro['bbox'])
            alvo = (r'^Exerc\S*cio\s*%d\s*\.' if tipo == 'enunciado' else r'^%d\s*\.') % it['numero']
            if not re.match(alvo, linha):
                erros.append('%s %s: primeira linha nao comeca pelo numero: %r' % (it['id'], tipo, linha[:40]))
            rot = it['medidas'][tipo].get('rotulo')
            if rot:
                w, h = it['medidas'][tipo]['largura_pt'], it['medidas'][tipo]['altura_pt']
                if rot[0] < 0 or rot[1] < 0 or rot[2] > w + 0.05 or rot[3] > h + 0.05:
                    erros.append('%s %s: caixa do rotulo fora do recorte' % (it['id'], tipo))
                bx = primeiro['bbox']
                caixa = pymupdf.Rect(bx[0] + rot[0], bx[1] + rot[1], bx[0] + rot[2], bx[1] + rot[3])
                lido = texto_na_caixa(doc[primeiro['pagina'] - 1], caixa)
                alvo_r = (r'^Exerc\S*cio%d\.$' if tipo == 'enunciado' else r'^%d\.$') % it['numero']
                if not re.match(alvo_r, lido):
                    erros.append('%s %s: a caixa do rotulo le %r' % (it['id'], tipo, lido[:30]))
                corte = borda_com_tinta(p, it, primeiro, caixa)
                if corte:
                    erros.append('%s %s: a caixa do rotulo corta tinta na borda %s; cobrir de branco '
                                 'apagaria parte de outra linha' % (it['id'], tipo, corte))
    # ordem: dentro da mesma coluna, o item de numero menor vem antes
    for chave, lst in ocupado.items():
        nums = [(y0, int(dono.split(':')[-1])) for y0, y1, dono in sorted(lst)]
        if [n for _, n in nums] != sorted(n for _, n in nums):
            erros.append('%s: recortes fora da ordem dos numeros %s' % (str(chave), [n for _, n in nums]))
    return erros


def texto_da_solucao(p, it):
    doc = p.doc(it['origem']['arquivo'])
    return portal.recompor('\n'.join(doc[pz['pagina'] - 1].get_text('text', clip=pymupdf.Rect(pz['bbox']))
                                     for pz in pedacos(it, 'solucao')))


def trava_objetiva(p):
    erros = []
    for it in p.itens:
        if it['formato'] != 'objetiva':
            if it['resposta'] is not None:
                erros.append('%s: aberta com resposta %r (v1 so preenche objetiva)' % (it['id'], it['resposta']))
            continue
        r = it['resposta']
        if not (isinstance(r, str) and re.match(r'^[A-E]$', r)) or r not in (it['alternativas'] or []):
            erros.append('%s: objetiva com resposta %r' % (it['id'], r))
            continue
        s = texto_da_solucao(p, it)
        # lida palavra a palavra, sem as expressoes do gerador (lente 2 do #47)
        letras = letras_da_solucao(s)
        if letras != {r}:
            erros.append('%s: resposta %s, e a solucao da fonte escreve %s' % (it['id'], r, sorted(letras) or 'nenhuma letra'))
    return erros


def trava_xml(p):
    """Todo SVG do pacote (recorte e teoria) e XML bem formado, sem caractere de controle.

    O Chrome recusa o SVG inteiro por um unico &#x001a;, e a pagina sai em
    branco no tablet (9 paginas de teoria, achado da B3 em 21/09).
    """
    import xml.etree.ElementTree as ET
    erros = []
    ruim = re.compile('[\x00-\x08\x0b\x0c\x0e-\x1f]')
    for cam in sorted(p.manifest['arquivos']):
        if not cam.endswith('.svg'):
            continue
        b = p.bytes_de(cam)
        t = b.decode('utf-8', errors='replace')
        if ruim.search(t) or re.search(r'&#(x0*(?:[0-8bcef]|1[0-9a-f])|0*(?:[0-8]|1[124-9]|2[0-9]|3[01]));', t, re.I):
            erros.append('%s: caractere de controle' % cam)
            continue
        try:
            ET.fromstring(b)
        except ET.ParseError as e:
            erros.append('%s: XML invalido (%s)' % (cam, e))
    return erros


def trava_svg(p):
    """Todo SVG do pacote (recorte E pagina de teoria) e autocontido e do tamanho declarado.

    Achado da lente 2: a versao anterior so olhava os recortes, e so via se o
    viewBox existia. Agora: sem <text>, sem @font-face, sem data-text, sem
    referencia externa; width, height e viewBox iguais a medidas.
    """
    erros = []
    alvos = [(it['assets'][t], it['medidas'][t]) for it in p.itens for t in ('enunciado', 'solucao') if it['assets'].get(t)]
    pilhas = {it['assets'][t]: pedacos(it, t) for it in p.itens for t in ('enunciado', 'solucao')
              if it['assets'].get(t) and len(pedacos(it, t)) > 1}
    alvos += [(pg['asset'], pg['medidas']) for t in p.teoria for pg in t['paginas']]
    for cam, med in alvos:
        s = p.bytes_de(cam).decode('utf-8')
        if '<text' in s or '@font-face' in s:
            erros.append('%s: SVG com texto ou fonte embutida' % cam)
        if 'data-text=' in s:
            erros.append('%s: SVG com data-text' % cam)
        if re.search(r'(?:xlink:)?href="(?!#|data:)', s):
            erros.append('%s: SVG com referencia externa' % cam)
        raiz = re.search(r'<svg\b[^>]*>', s)
        raiz = raiz.group(0) if raiz else ''
        w = re.search(r'\bwidth="([\d.]+)"', raiz)
        h = re.search(r'\bheight="([\d.]+)"', raiz)
        vb = re.search(r'\bviewBox="0 0 ([\d.]+) ([\d.]+)"', raiz)
        if not (w and h and vb):
            erros.append('%s: SVG sem width, height ou viewBox na raiz' % cam)
            continue
        valores = [float(w.group(1)), float(h.group(1)), float(vb.group(1)), float(vb.group(2))]
        esperado = [med['largura_pt'], med['altura_pt']] * 2
        if any(abs(v - e) > 0.6 for v, e in zip(valores, esperado)):
            erros.append('%s: width, height ou viewBox %s nao batem com medidas %s' % (cam, valores, med))
        # pedacos empilhados: cada um no lugar certo (a fidelidade desenha cada um
        # sozinho, entao a posicao na pilha e conferida aqui)
        ps = pilhas.get(cam)
        if ps:
            ys = posicoes_na_pilha(s)
            certo = [sum(q['bbox'][3] - q['bbox'][1] for q in ps[:j]) + gerar_pacote.FOLGA_PILHA * j for j in range(len(ps))]
            if len(ys) != len(certo) or any(abs(a - b) > 0.01 for a, b in zip(ys, certo)):
                erros.append('%s: pedacos na pilha em %s, e o certo e %s' % (cam, ys, certo))
    return erros


def trava_manifesto(p, zip_caminho=None):
    erros = []
    arquivos = p.manifest['arquivos']
    no_disco = set()
    for raiz, _, nomes in os.walk(p.pasta):
        for n in nomes:
            rel = os.path.relpath(os.path.join(raiz, n), p.pasta).replace(os.sep, '/')
            if rel not in ('manifest.json', 'relatorio.json'):
                no_disco.add(rel)
    for k in sorted(set(arquivos) - no_disco):
        erros.append('manifest lista %s, que nao existe' % k)
    for k in sorted(no_disco - set(arquivos)):
        erros.append('%s existe e nao esta no manifest' % k)
    for k in sorted(set(arquivos) & no_disco):
        if gerar_pacote.sha(p.bytes_de(k)) != arquivos[k]:
            erros.append('hash de %s nao bate' % k)
    usados = [i['assets'][t] for i in p.itens for t in ('enunciado', 'solucao') if i['assets'].get(t)]
    usados += [pg['asset'] for t in p.teoria for pg in t['paginas']]
    for u in usados:
        if u not in arquivos:
            erros.append('asset %s citado e ausente' % u)
    if zip_caminho:
        import zipfile
        with zipfile.ZipFile(zip_caminho) as z:
            nomes = set(z.namelist())
            if nomes != set(arquivos) | {'manifest.json'}:
                erros.append('o zip nao tem exatamente os arquivos do manifest')
            for k in sorted(nomes - {'manifest.json'}):
                if gerar_pacote.sha(z.read(k)) != arquivos.get(k):
                    erros.append('no zip, hash de %s nao bate' % k)
            if any(ord(c) > 127 or c.lower() != c for c in ''.join(nomes)):
                erros.append('nome no zip fora de ASCII minusculo')
    return erros


def textos(obj):
    if isinstance(obj, str):
        yield obj
    elif isinstance(obj, dict):
        for v in obj.values():
            yield from textos(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from textos(v)


def trava_tracos(p):
    erros = []
    for nome, obj in (('itens.json', p.itens), ('teoria.json', p.teoria), ('busca.json', p.busca),
                      ('apelidos.json', p.apelidos), ('manifest.json', p.manifest)):
        ruins = [t for t in textos(obj) if '\u2013' in t or '\u2014' in t]
        if ruins:
            erros.append('%s: %d textos com travessao ou meia-risca, por exemplo %r' % (nome, len(ruins), ruins[0][:60]))
    return erros


def trava_origem(p):
    erros = []
    for it in p.itens:
        oc = it.get('origem_citada')
        if not oc:
            continue
        onde = it.get('origem_citada_em')
        doc = p.doc(it['origem']['arquivo'])
        t = ' '.join(portal.recompor('\n'.join(doc[pz['pagina'] - 1].get_text('text', clip=pymupdf.Rect(pz['bbox']))
                                               for pz in pedacos(it, onde))).split()) if onde in ('enunciado', 'solucao') else ''
        if re.search(r'[a-z\u00e0-\u00ff]\d\.?$', oc):
            erros.append('%s: origem_citada termina numa chamada de nota colada (%r)' % (it['id'], oc))
            continue
        # a chamada de nota colada antes do fecha-parenteses nao e parte da origem
        t = re.sub(r'([a-z\u00e0-\u00ff])\d(\.?\))', r'\1\2', t)
        # espaco junto do parentese e so a extracao do texto ("(Extraido do vestibular da
        # UFSCar(SP) -2013 )", 6o ano): o texto de dentro e que tem de ser literal
        if not re.search(r'\(\s*' + re.escape(oc) + r'\s*\)', portal.sem_tracos(t)):
            erros.append('%s: origem_citada %r nao esta literal na %s da fonte' % (it['id'], oc, onde))
    return erros


# ------------------------------------------------------------------ padroes das outras series (B2)

def trava_bordas(p):
    """A lista de bordas da amostra: 1, 2 e 5 no pacote; 3 e 4 fora pela calha.

    A tabela do 3 cruza o fio com tracos retos, e o 4 esta na mesma altura da
    outra coluna: os dois saem com o motivo da calha, e nenhum outro sai.
    """
    lst = [l for l in p.relatorio['listas'] if l['aula'] == 'lista-bordas']
    if not lst:
        return ['a amostra nao tem a lista de bordas']
    erros = []
    nums = sorted(i['numero'] for i in p.itens if i['aula']['slug'] == 'lista-bordas')
    if nums != [1, 2, 5]:
        erros.append('lista-bordas: itens no pacote %s, e nao 1, 2 e 5' % nums)
    fora = sorted(e['numero'] for e in lst[0]['excluidos'] if 'fio entre as colunas' in e['motivo'])
    if fora != [3, 4]:
        erros.append('lista-bordas: excluidos pela calha %s, e nao 3 e 4' % fora)
    return erros


def trava_variantes(p):
    """A lista de variantes da amostra sai inteira e com as solucoes certas.

    Ela imita tres padroes medidos fora do 9o ano: solucoes sem o titulo
    "Respostas e Solucoes", marcador com recuo de paragrafo (item 3) e solucao
    em duas partes (itens 2 e 3). Cada par de partes tem de ser UM item, com
    os dois pedacos empilhados.
    """
    erros = []
    lst = [l for l in p.relatorio['listas'] if l['aula'] == 'lista-variantes']
    if not lst:
        return ['a amostra nao tem a lista de variantes']
    l = lst[0]
    if not l.get('solucoes_sem_titulo'):
        erros.append('lista-variantes: as solucoes nao foram achadas pela secao 1 que reaparece')
    nums = sorted(i['numero'] for i in p.itens if i['aula']['slug'] == 'lista-variantes')
    if nums != [1, 2, 3, 4]:
        erros.append('lista-variantes: itens no pacote %s, e nao 1 a 4 (excluidos: %s)' % (
            nums, [(e['numero'], e['motivo'][:60]) for e in l['excluidos']]))
    for i in p.itens:
        if i['aula']['slug'] == 'lista-variantes' and i['numero'] == 1:
            if i.get('origem_citada') != 'Adaptado da Amostra - 2020':
                erros.append('lista-variantes: "(Adaptado da ...)" nao virou origem_citada literal (%r)' % i.get('origem_citada'))
        if i['aula']['slug'] == 'lista-variantes' and i['numero'] in (2, 3):
            if len(pedacos(i, 'solucao')) != 2:
                erros.append('lista-variantes: solucao %d com %d pedaco(s), e nao as duas partes' % (
                    i['numero'], len(pedacos(i, 'solucao'))))
    return erros


def trava_apelidos(p):
    """Todo apelido do pacote leva a um modulo do pacote, e todo modulo tem apelido.

    No pacote real a conta e contra as 7 series (python biblioteca/apelidos.py);
    aqui, contra os modulos que a pasta de PDFs tem.
    """
    modulos = apelidos_mod.modulos_da_pasta(p.pdfs, p.manifest['series'][0])
    falhas, _ = apelidos_mod.conferir(p.apelidos, modulos)
    if any(k.startswith('_') for k in p.apelidos):
        falhas.append('apelidos.json do pacote leva chave de comentario (comeca com _)')
    return falhas


USO_GLIFO = re.compile(r'<use [^>]*transform="matrix\(([-\d.e]+),([-\d.e]+),([-\d.e]+),([-\d.e]+),([-\d.e]+),([-\d.e]+)\)"')


def origens_dos_glifos(svg, n_pedacos):
    """Por pedaco, as origens (x, y) dos glifos do SVG, em pt relativos ao canto do pedaco."""
    if n_pedacos == 1:
        blocos = [svg]
    else:
        blocos = re.split(r'<g transform="translate\(0 [\d.]+\)">', svg)[1:]
    return [[(float(m.group(5)), float(m.group(6))) for m in USO_GLIFO.finditer(b)] for b in blocos]


def trava_glifos(p):
    """Todo caractere do PDF dentro do recorte tem o seu glifo no SVG, na mesma origem.

    Pendencia (a) da lente 2 do #47: a fidelidade por pixel tem pouco dente para
    defeito pequeno (3 glifos a menos davam 0,13% do pedaco), e a comparacao por
    linha tambem nao serve (ruido de ate 12,5% numa linha certa, medido). Com o
    texto em contorno, cada caractere vira um <use> com a origem na matriz;
    medido no 9o ano: 1.098 de 1.098 pedacos com todos os caracteres casados a
    menos de 0,6 pt. Um glifo a menos deixa um caractere sem par; glifo a mais
    (a folga da redacao na borda) nao atrapalha.
    """
    erros = []
    for it in p.itens:
        doc = p.doc(it['origem']['arquivo'])
        for tipo in ('enunciado', 'solucao'):
            ps = pedacos(it, tipo)
            if not ps or not it['assets'].get(tipo):
                continue
            ors = origens_dos_glifos(p.bytes_de(it['assets'][tipo]).decode('utf-8'), len(ps))
            if len(ors) != len(ps):
                erros.append('%s %s: o SVG tem %d pedacos e a origem %d' % (it['id'], tipo, len(ors), len(ps)))
                continue
            for k, pz in enumerate(ps):
                r = pymupdf.Rect(pz['bbox'])
                faltam = []
                for b in doc[pz['pagina'] - 1].get_text('rawdict')['blocks']:
                    if b['type'] != 0:
                        continue
                    for l in b['lines']:
                        for sp in l['spans']:
                            for c in sp['chars']:
                                if not c['c'].strip():
                                    continue
                                if not r.contains(pymupdf.Point((c['bbox'][0] + c['bbox'][2]) / 2, (c['bbox'][1] + c['bbox'][3]) / 2)):
                                    continue
                                ox, oy = c['origin'][0] - r.x0, c['origin'][1] - r.y0
                                if not any(abs(ux - ox) < 0.6 and abs(uy - oy) < 0.6 for ux, uy in ors[k]):
                                    faltam.append(c['c'])
                if faltam:
                    erros.append('%s %s p%d: %d caractere(s) do PDF sem glifo no SVG (%r)' % (
                        it['id'], tipo, k + 1, len(faltam), ''.join(faltam)[:20]))
    return erros


def so_miudo(pg, bbox):
    """O retangulo so tem texto miudo (ate 8,5 pt), comecando por um numero: e uma nota."""
    r = pymupdf.Rect(bbox)
    sps = [sp for b in pg.get_text('dict', clip=r)['blocks'] if b['type'] == 0 for l in b['lines'] for sp in l['spans']
           if sp['text'].strip() and r.contains(pymupdf.Point((sp['bbox'][0] + sp['bbox'][2]) / 2,
                                                              (sp['bbox'][1] + sp['bbox'][3]) / 2))]
    if not sps or any(sp['size'] > 8.5 for sp in sps):
        return False
    # a primeira palavra e a mais a esquerda da primeira linha: o numero da nota,
    # em sobrescrito menor, tem o topo mais baixo que o do texto dela, e uma
    # fracao no comeco da nota sobe acima dele. A primeira linha e o que cruza a
    # altura do objeto mais alto
    alto = min(sps, key=lambda sp: sp['bbox'][1])['bbox']
    primeiro = min([sp for sp in sps if sp['bbox'][1] < alto[3] and sp['bbox'][3] > alto[1]], key=lambda sp: sp['bbox'][0])
    return bool(re.match(r'^\d+$', primeiro['text'].strip()))


def notas_na_pagina(doc, pg):
    """Notas de rodape da pagina, lidas pela prova: [(coluna, numero, Point do numero)].

    Fio curto (40 a 140 pt) na margem da coluna, texto miudo logo abaixo e nada de
    corpo normal depois dele na coluna. Cada numero miudo na margem abre uma nota.
    """
    xsep = divisa_da_prova(doc, pg)
    fios_pe = [d['rect'].y0 for d in pg.get_drawings() if d['rect'].height < 1.5 and d['rect'].width > 400
               and d['rect'].y0 > pg.rect.height * 0.8]
    y_pe = min(fios_pe) if fios_pe else pg.rect.height - 45
    sps = [sp for b in pg.get_text('dict')['blocks'] if b['type'] == 0 for l in b['lines'] for sp in l['spans']
           if sp['text'].strip() and sp['bbox'][1] < y_pe]
    lado = lambda bb: 0 if (bb[0] + bb[2]) / 2 < xsep else 1
    out = []
    for d in pg.get_drawings():
        q = d['rect']
        if not (q.height < 1.5 and 40 <= q.width <= 140):
            continue
        col = lado((q.x0, q.y0, q.x1, q.y1))
        abaixo = [sp for sp in sps if lado(sp['bbox']) == col and sp['bbox'][1] > q.y0 + 0.5]
        if not abaixo or any(sp['size'] > 8.5 for sp in abaixo):
            continue
        if not any(0 <= sp['bbox'][1] - q.y0 <= 12 and q.x0 - 1 <= sp['bbox'][0] <= q.x1 for sp in abaixo):
            continue
        x_marg = min(sp['bbox'][0] for sp in abaixo)
        for sp in abaixo:
            if re.match(r'^\d+$', sp['text'].strip()) and sp['bbox'][0] <= x_marg + 15:
                out.append((col, sp['text'].strip(), pymupdf.Point((sp['bbox'][0] + sp['bbox'][2]) / 2,
                                                                    (sp['bbox'][1] + sp['bbox'][3]) / 2)))
    return out


def trava_notas(p):
    """Toda nota de rodape da lista esta com um item (como ultimo pedaco) ou registrada com motivo.

    Contrato, 8a (decidido com a B2 em 22/09): a nota vai com o item que a chama,
    como ultimo pedaco, so com a chamada unica. A prova acha as notas pela
    pagina, sem o detector, e confere contra o relatorio.
    """
    erros = []
    for l in p.relatorio['listas']:
        if 'erro' in l:
            continue
        doc = p.doc(l['arquivo'])
        achadas = [(pno + 1, col, num, pt) for pno in range(1, doc.page_count) for col, num, pt in notas_na_pagina(doc, doc[pno])]
        regs = l.get('notas_de_rodape', [])
        if len(achadas) != len([r for r in regs if r.get('numero')]):
            erros.append('%s: a pagina tem %d nota(s) de rodape, e o relatorio registra %d' % (
                l['aula'], len(achadas), len([r for r in regs if r.get('numero')])))
        por_id = {i['id']: i for i in p.itens}
        for r in regs:
            if r.get('id'):
                it = por_id.get(r['id'])
                if not it:
                    if not any(e['id'] == r['id'] for e in l['excluidos']):
                        erros.append('%s: nota %s levada para %s, que nao esta no pacote' % (l['aula'], r['numero'], r['id']))
                    continue
                ult = pedacos(it, r['em'])[-1]
                pt = next((pt for pg_n, col, num, pt in achadas if pg_n == r['pagina'] and num == r['numero']), None)
                if pt is None or ult['pagina'] != r['pagina'] or not pymupdf.Rect(ult['bbox']).contains(pt):
                    erros.append('%s: a nota %s da p%d nao e o ultimo pedaco de %s' % (l['aula'], r['numero'], r['pagina'], r['id']))
                elif not so_miudo(p.doc(it['origem']['arquivo'])[ult['pagina'] - 1], ult['bbox']):
                    erros.append('%s: o pedaco da nota %s de %s leva outra coisa alem da nota' % (l['aula'], r['numero'], r['id']))
            elif not r.get('motivo'):
                erros.append('%s: nota %s da p%d fora de todo item e sem motivo' % (l['aula'], r.get('numero'), r['pagina']))
    return erros


def trava_curadoria(p):
    """Toda linha de curadoria desta serie achou o seu item."""
    return ['%s nao achou o item no pacote' % k for k in p.relatorio.get('curadoria_sem_item', [])]


def trava_gerador_no_manifest(p):
    """manifest.gerador diz com que PyMuPDF o pacote foi feito, e e o que esta instalado aqui."""
    v = p.manifest.get('gerador', {}).get('pymupdf')
    if not v:
        return ['manifest.gerador sem a versao do PyMuPDF']
    if v != pymupdf.VersionBind:
        return ['manifest.gerador diz PyMuPDF %s, e o instalado e %s: o pacote nao se reproduz aqui' % (v, pymupdf.VersionBind)]
    return []


def trava_fontes_negrito():
    """O marcador de solucao em CMBX10 (1o medio) e reconhecido; o CMBX12 de secao nao vira marcador.

    A amostra sintetica so tem as fontes-base do PDF, entao a prova monta os
    elementos de uma linha como o gerador os le de uma pagina real.
    """
    geo = {'xsep': 291.0, 'yrod': 747.0}
    def el(texto, fonte, x, y, tam=10.0):
        return {'tipo': 'txt', 'bb': (x, y, x + 6 * len(texto), y + tam), 'texto': texto, 'fonte': fonte,
                'tam': tam, 'col': 0 if x < 291 else 1, 'cruza': False}
    erros = []
    ms = gerar_pacote.marcadores([el('5.', 'ABCDEF+CMBX10', 29.5, 100), el('Temos', 'CMR10', 45, 100)], geo, True)
    if not any(m['tipo'] == 'solucao' and m['numero'] == 5 for m in ms):
        erros.append('marcador "5." em CMBX10 nao reconhecido como solucao')
    ms = gerar_pacote.marcadores([el('2', 'ABCDEF+CMBX12', 29.5, 300, 14.3), el('Exercícios', 'ABCDEF+CMSSBX10', 59, 300, 14.3)],
                                 geo, True)
    if any(m['tipo'] == 'solucao' for m in ms):
        erros.append('numero de secao em CMBX12 lido como marcador de solucao')
    return erros


def trava_titulo_modulo():
    """O titulo do modulo sai da capa mais frequente das listas, nao da primeira capa lida."""
    erros = []
    casos = [
        # 6o ano: a primeira capa (em ordem de arquivo) erra o modulo
        ('fracao-como-porcentagem-e-como-probabilidade',
         ['Divisibilidade', 'Fração como Porcentagem e Probabilidade', 'Fração como Porcentagem e Probabilidade'],
         ['FRAÇÃO COMO PORCENTAGEM E COMO PROBABILIDADE'], 'Fração como Porcentagem e Probabilidade'),
        # a teoria em caixa alta nao ganha da lista
        ('conjuntos', ['Conjuntos', 'Conjuntos'], ['CONJUNTOS', 'CONJUNTOS', 'CONJUNTOS'], 'Conjuntos'),
        # modulo so com teoria
        ('introducao-a-funcao-quadratica', [], ['Introdução à Função Quadrática'], 'Introdução à Função Quadrática'),
        # a parte do slug entra quando a capa nao diz
        ('elementos-basicos-de-geometria-plana-parte-2', ['Elementos básicos de geometria plana'], [],
         'Elementos básicos de geometria plana - Parte 2'),
        # sinal de menos da fonte vira hifen com espaco
        ('probabilidade-miscelanea-de-exercicios', ['Probabilidade −Miscelânea de Exercícios'], [],
         'Probabilidade - Miscelânea de Exercícios'),
    ]
    for slug, listas, teorias, esperado in casos:
        obtido = gerar_pacote.titulo_do_modulo(slug, listas, teorias)
        if obtido != esperado:
            erros.append('%s: titulo %r, e nao %r' % (slug, obtido, esperado))
    return erros


def fracao_diferente(ref, cro, w, h, y0):
    """Fracao de pixels sem correspondente na outra imagem.

    Um pixel so conta como diferente se NENHUM pixel a ate 1 px dele, na outra
    imagem, estiver a menos de DIFERENCA_PIXEL niveis de cinza, nos dois
    sentidos. Chrome e MuPDF suavizam a borda do traco de jeitos diferentes e
    arredondam a escala em fracao de pixel: comparado pixel a pixel, o mesmo
    recorte, identico a olho, dava 10% (medido em 21/09 na amostra). A
    tolerancia de 1 px absorve so isso; conteudo trocado continua reprovando (o
    veneno da fidelidade).
    """
    import numpy as np
    a = np.frombuffer(ref.samples, dtype=np.uint8).reshape(ref.height, ref.width)[:h, :w].astype(np.int16)
    b = np.frombuffer(cro.samples, dtype=np.uint8).reshape(cro.height, cro.width)[y0:y0 + h, :w].astype(np.int16)

    def sem_par(x, y):
        pad = np.pad(y, 1, mode='edge')
        ok = np.zeros(x.shape, dtype=bool)
        for dy in (0, 1, 2):
            for dx in (0, 1, 2):
                ok |= np.abs(x - pad[dy:dy + x.shape[0], dx:dx + x.shape[1]]) <= DIFERENCA_PIXEL
        return ~ok

    ruins = sem_par(a, b) | sem_par(b, a)
    return float(ruins.sum()) / float(w * h)


def sortear_pedacos(p, n=20, semente=SEMENTE):
    todos = []
    for it in p.itens:
        for tipo in ('enunciado', 'solucao'):
            for k, pz in enumerate(pedacos(it, tipo)):
                todos.append((it['id'], tipo, k))
    rnd = random.Random(semente)
    return sorted(rnd.sample(todos, min(n, len(todos))))


def pedaco_do_svg(svg, k):
    """O k-esimo <svg> aninhado de um SVG empilhado, como documento proprio."""
    blocos = re.split(r'<g transform="translate\(0 [\d.]+\)">', svg)[1:]
    b = blocos[k]
    fim = b.rfind('</g>')
    return b[:fim].strip() + '\n'


def posicoes_na_pilha(svg):
    return [float(y) for y in re.findall(r'<g transform="translate\(0 ([\d.]+)\)">', svg)]


def trava_fidelidade(p, sorteio, temp):
    """SVG renderizado no Chrome contra o pixmap do pymupdf do mesmo retangulo."""
    por_id = {i['id']: i for i in p.itens}
    escala = DPI_FIDELIDADE / 72.0
    pedidos, casos = [], []
    for n, (iid, tipo, k) in enumerate(sorteio):
        it = por_id.get(iid)
        if not it:
            continue
        ps = pedacos(it, tipo)
        med = it['medidas'][tipo]
        png = os.path.join(temp, 'chrome_%02d.png' % n)
        caminho = os.path.join(p.pasta, *it['assets'][tipo].split('/'))
        if len(ps) > 1:
            # Pedaco empilhado: o Chrome desenha o glifo em fracao de pixel quando o
            # pedaco comeca, por exemplo, em 537,5 px, e o mesmo SVG sai 0,96%
            # diferente dele mesmo desenhado sozinho (medido na amostra do Banco).
            # Entao o k-esimo <svg> aninhado sai do proprio asset entregue e e
            # desenhado sozinho; a posicao dele na pilha e conferida a parte, na
            # trava_svg (translate igual a soma das alturas mais a folga).
            aninhado = pedaco_do_svg(p.bytes_de(it['assets'][tipo]).decode('utf-8'), k)
            caminho = os.path.join(temp, 'pedaco_%02d.svg' % n)
            open(caminho, 'w', encoding='utf-8').write(aninhado)
            b = ps[k]['bbox']
            largura, altura = b[2] - b[0], b[3] - b[1]
        else:
            largura, altura = med['largura_pt'], med['altura_pt']
        pedidos.append({'svg': caminho, 'png': png, 'largura_pt': largura, 'altura_pt': altura, 'escala': escala})
        casos.append((iid, tipo, k, ps[k], 0.0, png))
    arq = os.path.join(temp, 'pedidos.json')
    json.dump(pedidos, open(arq, 'w', encoding='utf-8'))
    r = subprocess.run(['node', os.path.join(AQUI, '_fidelidade.js'), arq], capture_output=True, text=True)
    if r.returncode != 0:
        return ['o Chrome nao renderizou: %s' % r.stderr[-300:]], []
    erros, medidas = [], []
    for iid, tipo, k, pz, desloc, png in casos:
        it = por_id[iid]
        # referencia: copia limpa da pagina com o cropbox no retangulo, para o
        # canto do pixmap cair exatamente no canto do SVG
        tmp = pymupdf.open()
        tmp.insert_pdf(p.doc(it['origem']['arquivo']), from_page=pz['pagina'] - 1, to_page=pz['pagina'] - 1)
        # O pedaco empilhado pode comecar em fracao de pixel (258 pt a 150 dpi sao
        # 537,5 px): o Chrome o desenha ali, e a referencia tem de sair com a
        # mesma fracao, senao toda borda de letra difere (1,27% num pedaco
        # identico a olho, amostra do Banco). A referencia sobe a fracao.
        exato = desloc * escala
        y0 = int(math.floor(exato + 1e-6))
        delta = (exato - y0) / escala
        b = pz['bbox']
        tmp[0].set_cropbox(pymupdf.Rect(b[0], b[1] - delta, b[2], b[3] - delta))
        ref = tmp[0].get_pixmap(dpi=DPI_FIDELIDADE, colorspace=pymupdf.csGRAY)
        cro = pymupdf.Pixmap(pymupdf.csGRAY, pymupdf.Pixmap(png))
        # o asset empilhado tem a largura do pedaco mais largo: o pedaco fica
        # encostado a esquerda, e a comparacao e na largura dele
        w = min(ref.width, cro.width)
        h = min(ref.height, cro.height - y0)
        if h <= 0 or w <= 0 or cro.width < ref.width - 2 or abs(ref.height - (h)) > 2:
            erros.append('%s %s p%d: tamanhos nao conferem (%dx%d contra %dx%d)' % (iid, tipo, k + 1, ref.width, ref.height, cro.width, cro.height))
            continue
        frac = fracao_diferente(ref, cro, w, h, y0)
        medidas.append((frac, iid, tipo, k))
        if frac >= LIMITE_FIDELIDADE:
            erros.append('%s %s p%d: %.2f%% dos pixels diferem' % (iid, tipo, k + 1, 100 * frac))
    return erros, medidas


def trava_fidelidade_teoria(p, temp, n=10, semente=SEMENTE, trocar=None):
    """Paginas de teoria sorteadas: SVG no Chrome contra o pixmap da pagina do PDF.

    Pedido da orquestradora: a amostra dos recortes nunca olhava teoria, e foi
    na teoria que a B3 achou SVG que o Chrome recusava. `trocar` (so no veneno)
    renderiza o SVG de outra pagina no lugar.
    """
    paginas = [(t, pg) for t in p.teoria for pg in t['paginas']]
    rnd = random.Random(semente)
    sorteio = rnd.sample(paginas, min(n, len(paginas)))
    escala = DPI_FIDELIDADE / 72.0
    pedidos = []
    for k, (t, pg) in enumerate(sorteio):
        cam = pg['asset']
        if trocar and k == 0:
            # o SVG de uma pagina que nao e esta
            cam = next(o['asset'] for tt, o in paginas if o['asset'] != pg['asset'])
        pedidos.append({'svg': os.path.join(p.pasta, *cam.split('/')), 'png': os.path.join(temp, 'teo_%02d.png' % k),
                        'largura_pt': pg['medidas']['largura_pt'], 'altura_pt': pg['medidas']['altura_pt'], 'escala': escala})
    arq = os.path.join(temp, 'pedidos_teoria.json')
    json.dump(pedidos, open(arq, 'w', encoding='utf-8'))
    r = subprocess.run(['node', os.path.join(AQUI, '_fidelidade.js'), arq], capture_output=True, text=True)
    if r.returncode != 0:
        return ['o Chrome nao renderizou a teoria: %s' % r.stderr[-300:]], []
    erros, medidas = [], []
    for k, (t, pg) in enumerate(sorteio):
        arquivo = 'PDF/matematica/obmep-portal/%s/%s__teoria-%s.pdf' % (t['serie'], t['modulo']['slug'], t['aula']['slug'])
        tmp = pymupdf.open()
        tmp.insert_pdf(p.doc(arquivo), from_page=pg['n'] - 1, to_page=pg['n'] - 1)
        ref = tmp[0].get_pixmap(dpi=DPI_FIDELIDADE, colorspace=pymupdf.csGRAY)
        cro = pymupdf.Pixmap(pymupdf.csGRAY, pymupdf.Pixmap(pedidos[k]['png']))
        w, h = min(ref.width, cro.width), min(ref.height, cro.height)
        if abs(ref.width - cro.width) > 2 or abs(ref.height - cro.height) > 2:
            erros.append('%s: tamanhos nao conferem' % pg['id'])
            continue
        frac = fracao_diferente(ref, cro, w, h, 0)
        medidas.append((frac, pg['id']))
        if frac >= LIMITE_FIDELIDADE:
            erros.append('%s: %.2f%% dos pixels diferem' % (pg['id'], 100 * frac))
    return erros, medidas


# ------------------------------------------------------------------ amostra e venenos

def gerar(pdfs, trabalho, curadoria, **kw):
    kw.setdefault('gerado_em', '2026-09-21T00:00:00-03:00')
    kw.setdefault('commit', 'amostra')
    return gerar_pacote.gerar(pdfs, '9ano', 1, trabalho + '_zip', curadoria, trabalho=trabalho, **kw)


def curadoria_da_amostra(pasta):
    os.makedirs(pasta, exist_ok=True)
    io.open(os.path.join(pasta, 'dificuldade.csv'), 'w', encoding='utf-8', newline='').write(
        'id;dificuldade;quem;data;observacao\n9ano:amostra-sintetica:lista-de-amostra:ex:4;1;prova;2026-09-21;curadoria de teste\n')
    io.open(os.path.join(pasta, 'apelidos.json'), 'w', encoding='utf-8', newline='').write(
        '{"_nota": "comentario, fora do pacote", "bhaskara": ["amostra sintética"]}\n')
    io.open(os.path.join(pasta, 'exclusoes.csv'), 'w', encoding='utf-8', newline='').write(
        'id;motivo;quem;data\n9ano:amostra-sintetica:lista-cm:ex:2;defeito de teste da prova;prova;2026-09-22\n')
    return pasta


def copia(p, temp, nome):
    destino = os.path.join(temp, nome)
    if os.path.exists(destino):
        shutil.rmtree(destino)
    shutil.copytree(p.pasta, destino, ignore=shutil.ignore_patterns('_zip'))
    return Pacote(destino, p.pdfs)


def regravar_asset(q, cam, novo):
    with open(os.path.join(q.pasta, *cam.split('/')), 'wb') as f:
        f.write(novo)


class Placar:
    def __init__(self):
        self.ok = 0
        self.falhas = 0

    def conferir(self, nome, erros, deve_reprovar=False, motivo=None):
        """Com deve_reprovar, o veneno so conta se reprovar PELO motivo esperado."""
        if deve_reprovar:
            if motivo:
                erros = [e for e in erros if motivo in e]
            if erros:
                self.ok += 1
                print('  ok      veneno %-34s reprovou: %s' % (nome, erros[0][:90]))
            else:
                self.falhas += 1
                print('  FALHOU  veneno %-34s passou sem ver o defeito%s' % (nome, ' (%s)' % motivo if motivo else ''))
            return
        if erros:
            self.falhas += 1
            print('  FALHOU  %-41s %d problema(s): %s' % (nome, len(erros), ' | '.join(e[:120] for e in erros[:4])))
            # a lista inteira, um por linha: a prova real acha dezenas, e o resumo mostra 4
            for e in erros[4:]:
                print('           | %s' % e[:200])
        else:
            self.ok += 1
            print('  ok      %s' % nome)


def travas_simples(p, placar, zip_caminho=None, rotulo=''):
    placar.conferir('contagens' + rotulo, trava_contagens(p))
    placar.conferir('recorte' + rotulo, trava_recorte(p))
    placar.conferir('objetiva' + rotulo, trava_objetiva(p))
    placar.conferir('svg autocontido' + rotulo, trava_svg(p))
    placar.conferir('svg bem formado (todos)' + rotulo, trava_xml(p))
    placar.conferir('manifesto' + rotulo, trava_manifesto(p, zip_caminho))
    placar.conferir('sem travessao' + rotulo, trava_tracos(p))
    placar.conferir('origem literal' + rotulo, trava_origem(p))
    placar.conferir('PyMuPDF no manifest' + rotulo, trava_gerador_no_manifest(p))
    placar.conferir('prova independente do gerador' + rotulo, trava_independencia(p))
    placar.conferir('nenhum texto fora de recorte' + rotulo, trava_tinta_coberta(p))
    placar.conferir('curadoria aplicada' + rotulo, trava_curadoria(p))
    placar.conferir('todo caractere com o seu glifo' + rotulo, trava_glifos(p))
    placar.conferir('notas de rodape com o item ou registradas' + rotulo, trava_notas(p))


def venenos(p, temp, placar, curadoria):
    # os alvos dos venenos sao da lista de amostra: as outras listas vem antes na ordem
    da = [i for i in p.itens if i['aula']['slug'] == 'lista-de-amostra']
    it_obj = next(i for i in da if i['formato'] == 'objetiva')
    it_multi = next(i for i in da if i['origem']['enunciado'].get('pedacos'))
    it_simples = next(i for i in da if i['numero'] == 2)

    # determinismo: um asset que sai diferente na segunda geracao
    q = copia(p, temp, 'v_det')
    cam = it_simples['assets']['enunciado']
    regravar_asset(q, cam, q.bytes_de(cam).replace(b'</svg>', b'<!-- outra rodada --></svg>'))
    q.manifest['arquivos'][cam] = gerar_pacote.sha(q.bytes_de(cam))
    placar.conferir('determinismo', trava_determinismo(p, q), True, 'diferem')

    # contagens (1): lista com o item 2, o de marcador num span so, tirado da fonte
    pdfs = os.path.join(temp, 'pdfs_sem_item')
    fazer_amostra.fazer(pdfs, sem_item=2)
    gerar(pdfs, os.path.join(temp, 'v_sem_item'), curadoria)
    placar.conferir('contagens: item tirado da fonte', trava_contagens(Pacote(os.path.join(temp, 'v_sem_item'), pdfs)), True, 'fora de sequencia')
    # contagens (2): item tirado do itens.json sem ir para os excluidos
    q = copia(p, temp, 'v_cont')
    q.itens = [i for i in q.itens if i['id'] != it_simples['id']]
    placar.conferir('contagens: item sumido do pacote', trava_contagens(q), True, 'nao dao 1..')
    # contagens (3): rotulo de solucao duplicado na fonte ("9." duas vezes) entrando no pacote
    pdfs_d = os.path.join(temp, 'pdfs_duplicado')
    fazer_amostra.fazer(pdfs_d, duplica=3)
    gerar(pdfs_d, os.path.join(temp, 'v_dup_certo'), curadoria)
    pd = Pacote(os.path.join(temp, 'v_dup_certo'), pdfs_d)
    placar.conferir('contagens: duplicado fica de fora', trava_contagens(pd))
    q = copia(pd, temp, 'v_dup')
    q.itens.append(copy.deepcopy(next(i for i in p.itens if i['aula']['slug'] == 'lista-de-amostra' and i['numero'] == 2)))
    q.relatorio['listas'] = [dict(l, excluidos=[e for e in l['excluidos'] if e['numero'] != 2]) for l in q.relatorio['listas']]
    placar.conferir('contagens: duplicado entrando', trava_contagens(q), True, 'solucoes rotuladas')
    # divisa: a coluna direita do modelo CM lida com a divisa fixa do Palladio
    antes = gerar_pacote.geometria
    gerar_pacote.geometria = lambda doc: dict(antes(doc), xsep=306.0)
    antes_pag = gerar_pacote.geometria_da_pagina
    gerar_pacote.geometria_da_pagina = lambda pg, geo: dict(geo)
    try:
        gerar(p.pdfs, os.path.join(temp, 'v_divisa'), curadoria)
    finally:
        gerar_pacote.geometria = antes
        gerar_pacote.geometria_da_pagina = antes_pag
    q = Pacote(os.path.join(temp, 'v_divisa'), p.pdfs)
    placar.conferir('divisa fixa em 306 no modelo CM', trava_contagens(q) + trava_recorte(q), True, 'lista-cm')

    # recorte: caixa descida 15 pt, o texto nao comeca mais pelo numero
    q = copia(p, temp, 'v_rec')
    for i in q.itens:
        if i['id'] == it_simples['id']:
            b = i['origem']['enunciado']['bbox']
            i['origem']['enunciado']['bbox'] = [b[0], b[1] + 15, b[2], b[3] + 15]
    placar.conferir('recorte: caixa deslocada', trava_recorte(q), True, 'nao comeca pelo numero')
    # recorte: o fio entre colunas dentro da caixa
    q = copia(p, temp, 'v_fio')
    for i in q.itens:
        if i['id'] == it_simples['id']:
            b = i['origem']['enunciado']['bbox']
            i['origem']['enunciado']['bbox'] = [b[0], b[1], b[2] + 12, b[3]]
    placar.conferir('recorte: fio dentro', trava_recorte(q), True, 'fio entre colunas')
    # recorte: titulo de secao colado no fim do item 3 (a secao 2 vem logo abaixo dele)
    q = copia(p, temp, 'v_secao')
    for i in q.itens:
        if i['id'] == it_multi['id']:
            # o pedaco do alto da coluna direita (o ultimo agora e a nota de rodape)
            ult = [pz for pz in i['origem']['enunciado']['pedacos'] if pz['coluna'] == 2][-1]
            ult['bbox'] = [ult['bbox'][0], ult['bbox'][1], ult['bbox'][2], ult['bbox'][3] + 30]
    placar.conferir('recorte: titulo de secao colado', trava_recorte(q), True, 'titulo de secao')
    # recorte: caixa do rotulo deslocada para cima do texto
    q = copia(p, temp, 'v_rot')
    for i in q.itens:
        if i['id'] == it_simples['id']:
            r = i['medidas']['enunciado']['rotulo']
            i['medidas']['enunciado']['rotulo'] = [r[0] + 60, r[1], r[2] + 60, r[3]]
    placar.conferir('recorte: rotulo fora do lugar', trava_recorte(q), True, 'rotulo')
    # recorte: caixa estreitada de proposito, o texto sai cortado na borda direita
    q = copia(p, temp, 'v_estreita')
    for i in q.itens:
        if i['id'] == it_obj['id']:
            b = i['origem']['enunciado']['bbox']
            # corta por dentro de "Exercicio": no meio de uma linha comum o corte
            # pode cair justo no espaco entre duas palavras
            i['origem']['enunciado']['bbox'] = [b[0] + 40, b[1], b[2], b[3]]
    placar.conferir('recorte: caixa estreita', trava_recorte(q), True, 'tinta cortada na borda')
    # recorte: bloco de creditos do fim do documento colado na ultima solucao
    q = copia(p, temp, 'v_creditos')
    for i in q.itens:
        if i['aula']['slug'] == 'lista-de-amostra' and i['numero'] == 4:
            b = i['origem']['solucao']['bbox']
            i['origem']['solucao']['bbox'] = [b[0], b[1], b[2], b[3] + 40]
    placar.conferir('recorte: creditos colados', trava_recorte(q), True, 'titulo de secao')
    # recorte: a nota de rodape do pe da coluna colada no item 3
    q = copia(p, temp, 'v_nota')
    for i in q.itens:
        if i['aula']['slug'] == 'lista-de-amostra' and i['numero'] == 3:
            prim = i['origem']['enunciado']['pedacos'][0]
            prim['bbox'] = [prim['bbox'][0], prim['bbox'][1], prim['bbox'][2], 760.0]
    placar.conferir('recorte: nota de rodape colada', trava_recorte(q), True, 'nota de rodape')
    # recorte: caixa descendo ate o fio do rodape
    q = copia(p, temp, 'v_rodape')
    for i in q.itens:
        if i['id'] == it_multi['id']:
            prim = i['origem']['enunciado']['pedacos'][0]
            prim['bbox'] = [prim['bbox'][0], prim['bbox'][1], prim['bbox'][2], 772.0]
    placar.conferir('recorte: fio do rodape dentro', trava_recorte(q), True, 'fio horizontal longo')
    # recorte: caixa do rotulo alta demais, descendo ate a linha de baixo
    q = copia(p, temp, 'v_rot_alto')
    for i in q.itens:
        if i['id'] == it_obj['id']:  # a linha de baixo comeca 12 pt abaixo do rotulo
            r = i['medidas']['enunciado']['rotulo']
            i['medidas']['enunciado']['rotulo'] = [r[0], r[1], r[2], r[3] + 6]
    placar.conferir('recorte: rotulo alto demais', trava_recorte(q), True, 'corta tinta')

    # objetiva: letra trocada
    q = copia(p, temp, 'v_obj')
    for i in q.itens:
        if i['id'] == it_obj['id']:
            i['resposta'] = 'D' if i['resposta'] != 'D' else 'A'
    placar.conferir('objetiva: letra trocada', trava_objetiva(q), True, 'a solucao da fonte escreve')

    # svg: texto vivo no SVG
    q = copia(p, temp, 'v_svg')
    cam = it_simples['assets']['enunciado']
    regravar_asset(q, cam, q.bytes_de(cam).replace(b'</svg>', b'<text x="1" y="9">x</text></svg>'))
    placar.conferir('svg: texto vivo', trava_svg(q), True, 'texto ou fonte')
    # svg: texto vivo e data-text numa pagina de teoria; viewBox que nao bate
    q = copia(p, temp, 'v_svg_teo')
    cam = q.teoria[0]['paginas'][0]['asset']
    regravar_asset(q, cam, q.bytes_de(cam).replace(b'</svg>', b'<text x="1" y="9">x</text></svg>'))
    placar.conferir('svg: texto vivo na teoria', trava_svg(q), True, 'texto ou fonte')
    q = copia(p, temp, 'v_svg_dt')
    cam = it_simples['assets']['enunciado']
    regravar_asset(q, cam, q.bytes_de(cam).replace(b'</svg>', b'<use data-text="a"/></svg>'))
    placar.conferir('svg: data-text', trava_svg(q), True, 'data-text')
    q = copia(p, temp, 'v_svg_pilha')
    cam = it_multi['assets']['enunciado']
    b = q.bytes_de(cam)
    regravar_asset(q, cam, re.sub(rb'<g transform="translate\(0 ([\d.]+)\)">', lambda m: b'<g transform="translate(0 %s)">'
                                  % (b'0' if m.group(1) == b'0' else b'1' + m.group(1)), b))
    placar.conferir('svg: pedaco fora do lugar na pilha', trava_svg(q), True, 'na pilha')
    q = copia(p, temp, 'v_svg_vb')
    cam = it_simples['assets']['enunciado']
    b = q.bytes_de(cam)
    regravar_asset(q, cam, re.sub(rb'viewBox="0 0 ([\d.]+)', b'viewBox="0 0 999', b, count=1))
    placar.conferir('svg: viewBox trocado', trava_svg(q), True, 'nao batem com medidas')
    # manifesto: arquivo sobrando e arquivo faltando; zip com hash trocado
    q = copia(p, temp, 'v_man_sobra')
    open(os.path.join(q.pasta, 'assets', 'sobrando.svg'), 'wb').write(b'<svg/>')
    placar.conferir('manifesto: arquivo sobrando', trava_manifesto(q), True, 'nao esta no manifest')
    q = copia(p, temp, 'v_man_falta')
    os.remove(os.path.join(q.pasta, *it_obj['assets']['enunciado'].split('/')))
    placar.conferir('manifesto: arquivo faltando', trava_manifesto(q), True, 'que nao existe')
    import zipfile
    zorig = os.path.join(temp, 'a_zip', 'matematica-obmep-9ano-v1.zip')
    zruim = os.path.join(temp, 'zip_ruim.zip')
    with zipfile.ZipFile(zorig) as zi, zipfile.ZipFile(zruim, 'w') as zo:
        for n in zi.namelist():
            dado = zi.read(n)
            if n == it_obj['assets']['solucao']:
                dado = dado.replace(b'</svg>', b'<!-- -->\n</svg>')
            zo.writestr(n, dado)
    placar.conferir('zip: asset diferente do manifest', trava_manifesto(p, zruim), True, 'no zip, hash')
    # svg: caractere de controle numa pagina de teoria (o &#x001a; que a B3 achou)
    q = copia(p, temp, 'v_xml')
    cam = q.teoria[0]['paginas'][1]['asset']
    regravar_asset(q, cam, q.bytes_de(cam).replace(b'</svg>', b'<g data-text="&#x001a;"/></svg>'))
    placar.conferir('svg: caractere de controle', trava_xml(q), True, 'caractere de controle')

    # notas de rodape: sem a regra, a nota da amostra (chamada no item 3) fica fora
    # de todo item e sem registro
    antes_n = gerar_pacote.LEVA_NOTA
    gerar_pacote.LEVA_NOTA = False
    try:
        gerar(p.pdfs, os.path.join(temp, 'v_nota_fora'), curadoria)
    finally:
        gerar_pacote.LEVA_NOTA = antes_n
    q = Pacote(os.path.join(temp, 'v_nota_fora'), p.pdfs)
    placar.conferir('nota de rodape sem dono', trava_notas(q), True, 'nota(s) de rodape')

    # glifos: um unico glifo apagado do SVG (defeito que a fidelidade por pixel
    # quase nao ve)
    q = copia(p, temp, 'v_glifo')
    cam = it_simples['assets']['enunciado']
    svg = q.bytes_de(cam).decode('utf-8')
    usos = list(re.finditer(r'<use [^>]*/>', svg))
    meio = usos[len(usos) // 2]
    regravar_asset(q, cam, (svg[:meio.start()] + svg[meio.end():]).encode('utf-8'))
    placar.conferir('um glifo a menos', trava_glifos(q), True, 'sem glifo no SVG')

    # manifesto: um byte trocado num asset
    q = copia(p, temp, 'v_man')
    cam = it_obj['assets']['solucao']
    b = bytearray(q.bytes_de(cam))
    b[-10] = (b[-10] + 1) % 256
    regravar_asset(q, cam, bytes(b))
    placar.conferir('manifesto: byte trocado', trava_manifesto(q), True, 'hash de')

    # tracos: meia-risca num titulo
    q = copia(p, temp, 'v_tra')
    q.itens[0]['aula']['titulo'] += ' \u2013 parte'
    placar.conferir('tracos: meia-risca no titulo', trava_tracos(q), True, 'meia-risca')

    # origem: citacao que a fonte nao faz
    q = copia(p, temp, 'v_ori')
    for i in q.itens:
        if i['id'] == it_obj['id']:
            i['origem_citada'] = 'Extraído da IMO - 1999'
    placar.conferir('origem: citacao inventada', trava_origem(q), True, 'nao esta literal')
    # origem: a chamada da nota de rodape colada no fim ("chines2.")
    q = copia(p, temp, 'v_ori_nota')
    for i in q.itens:
        if i['id'] == it_obj['id']:
            i['origem_citada'] = i['origem_citada'] + 'a2.'
    placar.conferir('origem: chamada de nota colada', trava_origem(q), True, 'chamada de nota')
    return it_obj, it_simples


class _Sabotado:
    """Funcao ou expressao do gerador que nao pode ser usada pela prova."""

    def __init__(self, nome):
        self.nome = nome

    def __call__(self, *a, **k):
        raise RuntimeError('a prova usou %s do gerador' % self.nome)

    def __getattr__(self, attr):
        raise RuntimeError('a prova usou %s.%s do gerador' % (self.nome, attr))


def trava_independencia(p, zip_caminho=None):
    """As travas nao decidem com as funcoes de decisao do gerador.

    Roda as travas duas vezes: como sao, e com a primeira linha, a letra da
    objetiva, a divisa de colunas e o detector do gerador trocados por algo
    que falha ao ser usado. As duas rodadas tem de dar os mesmos erros.
    """
    nomes = ['primeira_linha_na_margem', 'RESPOSTA', 'SO_LETRA', 'geometria', 'geometria_da_pagina',
             'divisa_pelo_texto', 'detectar', 'marcadores', 'classificar', 'EXTRAIDO', 'origem_citada']

    def rodar():
        return [trava_contagens(p), trava_recorte(p), trava_objetiva(p), trava_origem(p)]

    antes = rodar()
    guardados = {n: getattr(gerar_pacote, n) for n in nomes}
    try:
        for n in nomes:
            setattr(gerar_pacote, n, _Sabotado(n))
        try:
            depois = rodar()
        except RuntimeError as e:
            return [str(e)]
    finally:
        for n, v in guardados.items():
            setattr(gerar_pacote, n, v)
    if depois != antes:
        return ['as travas mudam de resultado sem as funcoes do gerador']
    return []


def venenos_series(p, temp, placar, curadoria):
    """Um veneno por padrao que a B2 acrescentou; cada um tem de reprovar pelo motivo esperado."""
    # oraculo do texto: o detector perde o ULTIMO item da lista CM. A sequencia
    # 1..3 continua perfeita e as travas antigas passavam; o texto do PDF tem o 4
    q = copia(p, temp, 'v_ultimo')
    q.itens = [i for i in q.itens if not (i['aula']['slug'] == 'lista-cm' and i['numero'] == 4)]
    for l in q.relatorio['listas']:
        if l['aula'] == 'lista-cm':
            l['numeros_enunciado'] = [x for x in l['numeros_enunciado'] if x != 4]
            l['numeros_solucao'] = [x for x in l['numeros_solucao'] if x != 4]
            l['excluidos'] = [e for e in l['excluidos'] if e['numero'] != 4]
    q.manifest['contagens']['itens'] = len(q.itens)
    q.manifest['contagens']['itens_com_solucao'] = sum(1 for i in q.itens if i['assets']['solucao'])
    q.manifest['contagens']['itens_excluidos'] = sum(len(l['excluidos']) for l in q.relatorio['listas'])
    placar.conferir('ultimo item perdido pelo detector', trava_contagens(q), True, 'o texto do PDF tem')
    # tinta coberta: tres defeitos que tiravam conteudo do recorte sem nenhuma
    # outra trava ver. Cada um, desligado, tem de reprovar aqui.
    for nome, attr, valor, motivo in (('barra de fracao lida como nota', 'NOTA_SO_NO_PE', False, 'Portanto'),
                                      ('recorte preso na borda direita', 'ESTENDE_BORDA', False, 'Conferindo')):
        antes_v = getattr(gerar_pacote, attr)
        setattr(gerar_pacote, attr, valor)
        try:
            gerar(p.pdfs, os.path.join(temp, 'v_' + attr.lower()), curadoria)
        finally:
            setattr(gerar_pacote, attr, antes_v)
        q = Pacote(os.path.join(temp, 'v_' + attr.lower()), p.pdfs)
        placar.conferir(nome, [re.sub(r'\s+', '', e) for e in trava_tinta_coberta(q)], True, motivo)
        if attr == 'ESTENDE_BORDA':
            # o mesmo veneno na coluna da esquerda: a palavra rente a divisa sai cortada
            placar.conferir('recorte preso antes da divisa', trava_recorte(q), True, 'lista-variantes:ex:3 enunciado: tinta cortada')
    # pasta de trabalho reaproveitada: o asset de um item que saiu na geracao
    # seguinte nao pode ficar solto (6o ano, solucoes 19 e 21 depois da calha)
    for limpa in (True, False):
        pasta = os.path.join(temp, 'v_pasta_%s' % limpa)
        solto = os.path.join(pasta, 'assets', '9ano', 'amostra-sintetica', 'lista-cm', 'ex-99.svg')
        os.makedirs(os.path.dirname(solto), exist_ok=True)
        open(solto, 'w').write('<svg/>')
        antes_l = gerar_pacote.LIMPA_PASTA
        gerar_pacote.LIMPA_PASTA = limpa
        try:
            gerar(p.pdfs, pasta, curadoria)
        finally:
            gerar_pacote.LIMPA_PASTA = antes_l
        erros_m = trava_manifesto(Pacote(pasta, p.pdfs), None)
        if limpa:
            placar.conferir('pasta reaproveitada sai limpa', erros_m)
        else:
            placar.conferir('asset solto de geracao anterior', erros_m, True, 'ex-99.svg existe e nao esta no manifest')
    # bordas: cada regra da lista de bordas, desligada, tem de reprovar
    for nome, attr, valor, trava, motivo in (
            ('tabela que cruza o fio fica', 'CALHA_TRACO', False, trava_recorte, 'lista-bordas:ex:3 enunciado: tinta cortada'),
            ('tabela que cruza o fio fica (contagem)', 'CALHA_TRACO', False, trava_bordas, 'itens no pacote'),
            ('traco recortado antes do fio tira o item', 'tinta_dos_dois_lados', lambda pg, x, bb: True, trava_bordas,
             'itens no pacote'),
            ('expoente alto fica no item de cima', 'TOPO_MAX', 12, trava_recorte, 'lista-bordas:ex:2 enunciado: tinta cortada'),
            ('nota que comeca por fracao', 'NOTA_LINHA_TODA', False, trava_recorte, 'lista-bordas:ex:5 enunciado: tinta cortada'),
            ('fio do rodape em imagem', 'FIO_IMAGEM', False, trava_recorte, 'lista-fio-imagem:ex:2 enunciado: fio horizontal longo')):
        pasta = os.path.join(temp, 'v_' + attr.lower())
        if not os.path.exists(os.path.join(pasta, 'itens.json')):
            antes_v = getattr(gerar_pacote, attr)
            setattr(gerar_pacote, attr, valor)
            try:
                gerar(p.pdfs, pasta, curadoria)
            finally:
                setattr(gerar_pacote, attr, antes_v)
        placar.conferir(nome, trava(Pacote(pasta, p.pdfs)), True, motivo)
    antes_oc = gerar_pacote.objetos_claros
    gerar_pacote.objetos_claros = lambda pg: []
    try:
        gerar(p.pdfs, os.path.join(temp, 'v_claro'), curadoria)
    finally:
        gerar_pacote.objetos_claros = antes_oc
    q = Pacote(os.path.join(temp, 'v_claro'), p.pdfs)
    placar.conferir('conteudo cinza claro cortado', [re.sub(r'\s+', '', e) for e in trava_tinta_coberta(q)], True, 'Figuraemcinza')
    # independencia: uma trava que volte a chamar o gerador tem de reprovar
    antes_ob = trava_objetiva.__globals__['letras_da_solucao']
    trava_objetiva.__globals__['letras_da_solucao'] = lambda s: set(gerar_pacote.RESPOSTA.findall(s))
    try:
        placar.conferir('trava que usa o gerador', trava_independencia(p), True, 'a prova usou RESPOSTA')
    finally:
        trava_objetiva.__globals__['letras_da_solucao'] = antes_ob
    # soluções sem titulo: sem a regra da secao 1, a lista de variantes fica sem solucoes
    antes = gerar_pacote.detectar
    gerar_pacote.detectar = lambda doc: antes(doc, secao_1_abre_solucoes=False)
    try:
        gerar(p.pdfs, os.path.join(temp, 'v_sem_titulo'), curadoria)
    finally:
        gerar_pacote.detectar = antes
    q = Pacote(os.path.join(temp, 'v_sem_titulo'), p.pdfs)
    placar.conferir('lista sem titulo de solucoes', trava_contagens(q), True, 'lista sem solucoes detectadas')
    # recuo de paragrafo: sem ele, o "Exercicio 3." recuado some e a sequencia quebra
    antes_r = gerar_pacote.RECUO_MAX
    gerar_pacote.RECUO_MAX = 0.0
    try:
        gerar(p.pdfs, os.path.join(temp, 'v_recuo'), curadoria)
    finally:
        gerar_pacote.RECUO_MAX = antes_r
    q = Pacote(os.path.join(temp, 'v_recuo'), p.pdfs)
    placar.conferir('marcador com recuo de paragrafo', trava_contagens(q), True, 'fora de sequencia')
    # continuacao: sem ela, "2." e "2. (Outra solucao.)" viram duas solucoes 2 e o item sai
    antes_c = gerar_pacote.continua_o_anterior
    gerar_pacote.continua_o_anterior = lambda t: False
    try:
        gerar(p.pdfs, os.path.join(temp, 'v_continua'), curadoria)
    finally:
        gerar_pacote.continua_o_anterior = antes_c
    q = Pacote(os.path.join(temp, 'v_continua'), p.pdfs)
    placar.conferir('solucao em duas partes', trava_variantes(q), True, 'itens no pacote')
    # origem: sem "Adaptado" na regra, a origem do item 1 some
    antes_e = gerar_pacote.EXTRAIDO
    gerar_pacote.EXTRAIDO = re.compile(r'\((Extra[íi]d[oa]\s[^()]*(?:\([^()]*\)[^()]*)*)\)')
    try:
        gerar(p.pdfs, os.path.join(temp, 'v_adaptado'), curadoria)
    finally:
        gerar_pacote.EXTRAIDO = antes_e
    q = Pacote(os.path.join(temp, 'v_adaptado'), p.pdfs)
    placar.conferir('origem "Adaptado da"', trava_variantes(q), True, 'Adaptado')
    # curadoria de dificuldade (brief B2): a linha muda o item, e so ele; o pacote
    # sem a linha e o pacote com ela sao, cada um, deterministicos
    cur_sem = os.path.join(temp, 'cur_sem_linha')
    shutil.copytree(curadoria, cur_sem)
    io.open(os.path.join(cur_sem, 'dificuldade.csv'), 'w', encoding='utf-8', newline='').write(
        'id;dificuldade;quem;data;observacao\n')
    gerar(p.pdfs, os.path.join(temp, 'v_sem_linha'), cur_sem)
    q = Pacote(os.path.join(temp, 'v_sem_linha'), p.pdfs)
    alvo = '9ano:amostra-sintetica:lista-de-amostra:ex:4'
    antes_i, depois_i = {i['id']: i for i in q.itens}, {i['id']: i for i in p.itens}
    erros = []
    if antes_i[alvo]['dificuldade_origem'] != 'proxy' or depois_i[alvo]['dificuldade_origem'] != 'curadoria':
        erros.append('a linha do dificuldade.csv nao mudou a origem da dificuldade do item')
    mudaram = sorted(k for k in depois_i if json.dumps(depois_i[k], sort_keys=True) != json.dumps(antes_i.get(k), sort_keys=True))
    if mudaram != [alvo]:
        erros.append('a linha do dificuldade.csv mudou %s, e nao so o item dela' % mudaram)
    gerar(p.pdfs, os.path.join(temp, 'v_sem_linha_b'), cur_sem, gerado_em='2031-01-01T00:00:00-03:00')
    erros += trava_determinismo(q, Pacote(os.path.join(temp, 'v_sem_linha_b'), p.pdfs))
    placar.conferir('curadoria muda so o seu item, deterministica', erros)
    # curadoria: id desta serie digitado errado nao pode passar calado
    cur_errada = os.path.join(temp, 'cur_errada')
    shutil.copytree(curadoria, cur_errada)
    with io.open(os.path.join(cur_errada, 'dificuldade.csv'), 'a', encoding='utf-8', newline='') as f:
        f.write('9ano:amostra-sintetica:lista-de-amostra:ex:44;3;prova;2026-09-22;id que nao existe\n')
    gerar(p.pdfs, os.path.join(temp, 'v_cur_errada'), cur_errada)
    placar.conferir('curadoria com id errado', trava_curadoria(Pacote(os.path.join(temp, 'v_cur_errada'), p.pdfs)),
                    True, 'ex:44')
    # curadoria: dificuldade fora de 1 a 3 para a geracao
    with io.open(os.path.join(cur_errada, 'dificuldade.csv'), 'a', encoding='utf-8', newline='') as f:
        f.write('9ano:amostra-sintetica:lista-cm:ex:3;4;prova;2026-09-22;fora da escala\n')
    try:
        gerar(p.pdfs, os.path.join(temp, 'v_cur_4'), cur_errada)
        placar.conferir('curadoria com dificuldade 4', [], True, 'dificuldade')
    except SystemExit as e:
        placar.conferir('curadoria com dificuldade 4', [str(e)], True, 'dificuldade tem de ser')
    # apelidos: um orfao e um modulo sem apelido
    q = copia(p, temp, 'v_apelido')
    q.apelidos = dict(q.apelidos, **{'assunto inventado': ['modulo que nao existe no portal']})
    placar.conferir('apelido orfao', trava_apelidos(q), True, 'assunto inventado')
    q = copia(p, temp, 'v_sem_apelido')
    q.apelidos = {}
    placar.conferir('modulo sem apelido', trava_apelidos(q), True, 'modulo sem apelido')
    # manifest sem a versao do PyMuPDF
    q = copia(p, temp, 'v_pymupdf')
    del q.manifest['gerador']['pymupdf']
    placar.conferir('manifest sem PyMuPDF', trava_gerador_no_manifest(q), True, 'sem a versao')
    # CMBX10 fora da lista de negrito: o marcador do 1o medio deixa de ser lido
    antes_f = list(gerar_pacote.FONTES_NEGRITO)
    gerar_pacote.FONTES_NEGRITO[:] = ['SSBX', 'Bold']
    try:
        placar.conferir('negrito sem CMBX10', trava_fontes_negrito(), True, 'CMBX10')
    finally:
        gerar_pacote.FONTES_NEGRITO[:] = antes_f
    # titulo pela primeira capa lida (a regra antiga): o 6o ano sai "Divisibilidade"
    antes_t = gerar_pacote.titulo_do_modulo
    gerar_pacote.titulo_do_modulo = lambda slug, listas, teorias: next((c for c in listas + teorias if c), slug)
    try:
        placar.conferir('titulo pela primeira capa', trava_titulo_modulo(), True, 'fracao-como-porcentagem')
    finally:
        gerar_pacote.titulo_do_modulo = antes_t


def principal():
    ap = argparse.ArgumentParser()
    ap.add_argument('--real', action='store_true')
    ap.add_argument('--pdfs')
    ap.add_argument('--trabalho')
    ap.add_argument('--trabalho2')
    ap.add_argument('--zip')
    ap.add_argument('--sem-navegador', action='store_true')
    ap.add_argument('--saida-fidelidade', help='grava a medida de cada pedaco sorteado neste JSON')
    a = ap.parse_args()
    placar = Placar()
    temp = tempfile.mkdtemp(prefix='prova_gerador_')
    try:
        if a.real:
            p1 = Pacote(a.trabalho, a.pdfs)
            p2 = Pacote(a.trabalho2, a.pdfs)
            print('pacote real: %d itens, %d excluidos' % (len(p1.itens), p1.manifest['contagens']['itens_excluidos']))
            placar.conferir('determinismo', trava_determinismo(p1, p2))
            travas_simples(p1, placar, a.zip)
            p = p1
        else:
            pdfs = os.path.join(temp, 'pdfs')
            fazer_amostra.fazer(pdfs)
            cur = curadoria_da_amostra(os.path.join(temp, 'curadoria'))
            gerar(pdfs, os.path.join(temp, 'a'), cur)
            # a segunda geracao muda tudo o que NAO pode entrar nos hashes: outra
            # data, outro commit e outra pasta de PDFs (achado da lente 2)
            pdfs_b = os.path.join(temp, 'pdfs_outra_pasta')
            fazer_amostra.fazer(pdfs_b)
            gerar_pacote.gerar(pdfs_b, '9ano', 1, os.path.join(temp, 'b') + '_zip', cur, trabalho=os.path.join(temp, 'b'),
                               gerado_em='2030-01-01T12:34:56-03:00', commit='outro')
            p = Pacote(os.path.join(temp, 'a'), pdfs)
            print('amostra sintetica: %d itens em %d listas (modelos Palladio e CM)' % (len(p.itens), len(p.relatorio['listas'])))
            placar.conferir('determinismo', trava_determinismo(p, Pacote(os.path.join(temp, 'b'), pdfs)))
            travas_simples(p, placar, os.path.join(temp, 'a_zip', 'matematica-obmep-9ano-v1.zip'))
            placar.conferir('curadoria exclui o item listado',
                            [] if not any(i['aula']['slug'] == 'lista-cm' and i['numero'] == 2 for i in p.itens)
                            and any(e['numero'] == 2 and e['motivo'].startswith('curadoria:') for l in p.relatorio['listas']
                                    if l['aula'] == 'lista-cm' for e in l['excluidos'])
                            else ['a linha do exclusoes.csv nao tirou o item'])
            placar.conferir('curadoria sobrescreve o proxy',
                            [] if any(i['dificuldade_origem'] == 'curadoria' and i['numero'] == 4 and i['dificuldade'] == 1
                                      for i in p.itens) else ['a linha do dificuldade.csv nao chegou ao item'])
            placar.conferir('apelidos', trava_apelidos(p))
            placar.conferir('variantes: sem titulo, recuo, duas partes', trava_variantes(p))
            placar.conferir('bordas: expoente alto, tabela no fio, nota com fracao', trava_bordas(p))
            placar.conferir('marcador em CMBX10', trava_fontes_negrito())
            placar.conferir('titulo do modulo pela capa das listas', trava_titulo_modulo())
            it_obj, it_simples = venenos(p, temp, placar, cur)
            venenos_series(p, temp, placar, cur)
        if not a.sem_navegador:
            sorteio = sortear_pedacos(p)
            erros, medidas = trava_fidelidade(p, sorteio, temp)
            placar.conferir('fidelidade (%d pedacos, semente %d)' % (len(sorteio), SEMENTE), erros)
            if medidas:
                fr = [m[0] for m in medidas]
                print('          fidelidade: media %.3f%%, pior %.3f%% (%s %s p%d)' % (
                    100 * sum(fr) / len(fr), 100 * max(fr), *max(medidas)[1:3], max(medidas)[3] + 1))
            erros_t, med_t = trava_fidelidade_teoria(p, temp)
            placar.conferir('fidelidade da teoria (%d paginas)' % len(med_t), erros_t)
            if med_t:
                ft = [m[0] for m in med_t]
                print('          teoria: media %.3f%%, pior %.3f%% (%s)' % (100 * sum(ft) / len(ft), 100 * max(ft), max(med_t)[1]))
            if a.saida_fidelidade:
                json.dump([{'fracao': m[0], 'id': m[1], 'tipo': m[2], 'pedaco': m[3] + 1} for m in medidas],
                          open(a.saida_fidelidade, 'w', encoding='utf-8'), indent=1)
            if not a.real:
                # veneno: o SVG de um item trocado pelo de outro
                q = copia(p, temp, 'v_fid')
                alvo = sorteio[0]
                por_id = {i['id']: i for i in q.itens}
                outro = next(i for i in q.itens if i['id'] != alvo[0])
                cam = por_id[alvo[0]]['assets'][alvo[1]]
                regravar_asset(q, cam, q.bytes_de(outro['assets']['solucao']))
                erros_v, _ = trava_fidelidade(q, [alvo], temp)
                placar.conferir('fidelidade: SVG trocado', erros_v, True, 'diferem')
                # veneno: a primeira pagina sorteada da teoria recebe o SVG de outra
                erros_tv, _ = trava_fidelidade_teoria(p, temp, n=2, trocar=True)
                placar.conferir('fidelidade: teoria trocada', erros_tv, True, 'diferem')
    finally:
        shutil.rmtree(temp, ignore_errors=True)
    print('%d verificacoes passaram, %d falharam' % (placar.ok, placar.falhas))
    sys.exit(1 if placar.falhas else 0)


if __name__ == '__main__':
    principal()
