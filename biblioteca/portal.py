"""Leitura dos PDFs do Portal da OBMEP: nomes, capas, acentos e pareamento.

Tudo que depende de como o Portal escreve os seus arquivos mora aqui, para o
gerador do pacote e o inventario lerem a colecao do mesmo jeito.

Os PDFs sao LaTeX, e o texto extraido traz o acento separado da letra
("Equa¸c˜oes", "M´odulo"). Nos PDFs em Computer Modern o sinal vem ANTES da
letra; nos em Palladio a cedilha vem DEPOIS do c ("frac¸˜ao"). A recomposicao
abaixo cobre os dois e so e usada em texto (titulo e busca); o recorte nunca e
tocado.
"""
import os
import re
import unicodedata

import pymupdf

# sinal solto do LaTeX -> acento combinante
COMBINANTE = {
    '\u00b4': '\u0301',  # agudo
    '`': '\u0300',       # grave
    '\u02dc': '\u0303',  # til
    '~': '\u0303',
    '\u02c6': '\u0302',  # circunflexo
    '^': '\u0302',
    '\u00a8': '\u0308',  # trema
    '\u00b8': '\u0327',  # cedilha
}
LIGADURAS = {'\ufb01': 'fi', '\ufb02': 'fl', '\ufb00': 'ff', '\ufb03': 'ffi', '\ufb04': 'ffl'}


def recompor(texto):
    """Junta o sinal solto a sua letra e devolve em NFC."""
    s = ''.join(LIGADURAS.get(c, c) for c in texto)
    s = s.replace('\u0131', 'i')  # i sem pingo, que o LaTeX usa sob o acento
    # cedilha depois do c (Palladio), com ou sem espaco antes do proximo sinal
    s = re.sub(r'([cC])\u00b8 ?', lambda m: m.group(1) + '\u0327', s)
    # sinal antes da letra (Computer Modern), com espaco opcional entre eles
    s = re.sub('([\u00b4`\u02dc~\u02c6^\u00a8\u00b8]) ?([A-Za-z])',
               lambda m: m.group(2) + COMBINANTE[m.group(1)], s)
    return unicodedata.normalize('NFC', s)


def para_busca(texto):
    """Texto do campo `texto`: recomposto, minusculo, sem acento, sem quebras."""
    s = recompor(texto).lower()
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = sem_tracos(s.replace('\u2212', '-'))
    # os delimitadores grandes do LaTeX saem como caractere de controle
    s = re.sub('[\x00-\x08\x0b\x0c\x0e-\x1f]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def sem_tracos(texto):
    """Troca travessao, meia-risca e sinal de menos por hifen: nada disso vai para a tela.

    O sinal de menos (U+2212) entra por decisao do contrato (secao 4): a fonte o
    usa como traco em titulo e origem ("Adaptada do ENEM \u22122013",
    "Probabilidade \u2212Miscelanea"). Vale so para exibicao e busca; o recorte
    nunca e tocado.
    """
    return texto.replace('\u2014', '-').replace('\u2013', '-').replace('\u2212', '-')


# ------------------------------------------------------------------ nomes

PADRAO_ARQUIVO = re.compile(r'^(?P<modulo>[a-z0-9-]+)__(?P<tipo>teoria|exercicios)-(?P<aula>[a-z0-9-]+)\.pdf$')
PARTE = re.compile(r'-parte-(i{1,3}|iv|v|0?\d+)$')
VAZIAS_SLUG = {'de', 'do', 'da', 'dos', 'das', 'e', 'o', 'a', 'os', 'as', 'no', 'na', 'em', 'para', 'exercicios'}


def listar(pasta):
    """Arquivos do Portal numa pasta de serie, em ordem de nome."""
    out = []
    for nome in sorted(os.listdir(pasta)):
        m = PADRAO_ARQUIVO.match(nome)
        if m:
            out.append(dict(arquivo=nome, modulo=m.group('modulo'), tipo=m.group('tipo'), aula=m.group('aula')))
    return out


def base_do_slug(aula):
    return PARTE.sub('', aula)


def fichas(slug):
    """Palavras que identificam a aula, para parear teoria e exercicios."""
    out = set()
    for p in base_do_slug(slug).split('-'):
        if p in VAZIAS_SLUG or not p:
            continue
        if len(p) > 3 and p.endswith('s'):
            p = p[:-1]
        out.add(p)
    return out


def casa(teoria_slug, exercicio_slug, teoria_titulo=None, exercicio_titulo=None):
    """Teoria e lista tratam da mesma aula quando as palavras de uma cabem na outra.

    Primeiro pelo slug; se nao casar, pelo titulo das capas, que e a outra coisa
    que a fonte escreve (Funcao Afim: a lista `funcoes-afins` se chama "Nocoes
    Basicas", como a teoria "Nocoes Basicas - Parte 1").
    """
    a, b = fichas(teoria_slug), fichas(exercicio_slug)
    if a and b and (a <= b or b <= a):
        return True
    if teoria_titulo and exercicio_titulo:
        a, b = fichas(slug_de(teoria_titulo)), fichas(slug_de(exercicio_titulo))
        return bool(a) and bool(b) and (a <= b or b <= a)
    return False


def slug_de(titulo):
    s = para_busca(titulo)
    s = re.sub(r'\bparte\s+(i{1,3}|iv|v|0?\d+)\b', '', s)
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


# ------------------------------------------------------------------ capas

def linhas_da_pagina(pg):
    """Linhas de texto da pagina, com o texto recomposto."""
    out = []
    for b in pg.get_text('dict')['blocks']:
        if b['type'] != 0:
            continue
        for l in b['lines']:
            t = ''.join(s['text'] for s in l['spans']).strip()
            if t:
                out.append((l['bbox'], recompor(t), max(s['size'] for s in l['spans'])))
    return out


def blocos_da_capa(doc):
    """Linhas da capa agrupadas em blocos pelo vao vertical.

    A capa do Portal empilha blocos separados por vaos grandes: modulo, titulo
    da aula, serie, creditos, data. Um titulo longo quebra em duas ou tres
    linhas coladas, e e isso que o bloco junta.
    """
    # "Portal OBMEP" e a marca d'agua da capa, nao e texto dela
    linhas = sorted([(bb, t, sz) for bb, t, sz in linhas_da_pagina(doc[0])
                     if sz < 40 and t.strip() and not re.match(r'^Portal (da )?OBMEP$', t.strip())],
                    key=lambda x: (x[0][1], x[0][0]))
    blocos = []
    for bb, t, sz in linhas:
        if blocos and bb[1] - blocos[-1][-1][0][1] <= sz * 1.6:
            blocos[-1].append((bb, t, sz))
        else:
            blocos.append([(bb, t, sz)])
    return [[t for bb, t, sz in b] for b in blocos]


def _junta(linhas):
    return re.sub(r'\s+', ' ', ' '.join(linhas)).strip()


SERIE_NA_CAPA = re.compile(r'(\bAno\b|\bano\b|s[ée]rie|E\.\s*F\.|Ensino)')
DATA_NA_CAPA = re.compile(r'^(\d{1,2})[oº]? de ([A-Za-zçÇ]+) de (\d{4})$')
DATA_NO_FIM = re.compile(r'\s+(\d{1,2})[oº]? de ([A-Za-zçÇ]+) de (\d{4})$')


def _modulo_do_bloco(texto):
    t = re.sub(r'^Material Te[oó]rico\s*-\s*', '', texto)
    t = re.sub(r'^M[oó]dulo\s*:?\s+(de\s+)?', '', t)
    return t.rstrip('.').strip()


def capa_da_teoria(doc):
    """Modulo, titulo, creditos e data escritos na capa da teoria, lidos por bloco."""
    info = {}
    blocos = blocos_da_capa(doc)
    resto = []
    for b in blocos:
        texto = _junta(b)
        if texto.startswith('Material Te') and 'modulo' not in info:
            info['modulo'] = _modulo_do_bloco(texto)
        elif DATA_NA_CAPA.match(texto):
            d = DATA_NA_CAPA.match(texto)
            info['data'] = data_iso(d.group(1), d.group(2), d.group(3))
        elif SERIE_NA_CAPA.search(texto) and len(texto) < 45:
            info['serie_na_capa'] = texto
        else:
            resto.append(b)
    if resto:
        info['titulo'] = _junta(resto[0]).rstrip('.')
    if len(resto) > 1:
        creditos = []
        for t in [l for b in resto[1:] for l in b]:
            # data colada na ultima linha dos creditos ("... Neto 1o de Setembro de 2025")
            d = DATA_NO_FIM.search(t)
            if d and 'data' not in info:
                info['data'] = data_iso(d.group(1), d.group(2), d.group(3))
                t = t[:d.start()]
            # linha que nao comeca com rotulo nem com "Prof" continua a anterior
            if creditos and not re.match(r'^(Autora?e?s?|Revisora?e?s?|Prof)', t):
                creditos[-1] += ' ' + t
            else:
                creditos.append(t)
        info['creditos'] = creditos
        autores = [re.sub(r'^Autora?e?s?:\s*', '', c) for c in creditos if re.match(r'^Autor', c)]
        revisores = [re.sub(r'^Revisora?e?s?:\s*', '', c) for c in creditos if re.match(r'^Revisor', c)]
        if autores:
            info['autor'] = ', '.join(autores)
        if revisores:
            info['revisor'] = ', '.join(revisores)
    return info


def capa_da_lista(doc):
    """Modulo e titulo escritos na capa da lista de exercicios, lidos por bloco."""
    info = {}
    blocos = [_junta(b) for b in blocos_da_capa(doc)]
    if blocos:
        info['modulo'] = _modulo_do_bloco(blocos[0])
    if len(blocos) > 1 and not SERIE_NA_CAPA.search(blocos[1]):
        info['titulo'] = blocos[1].rstrip('.').strip()
    return info


MESES = {'janeiro': 1, 'fevereiro': 2, 'marco': 3, 'março': 3, 'abril': 4, 'maio': 5, 'junho': 6,
         'julho': 7, 'agosto': 8, 'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12}


def data_iso(d, mes, a):
    n = MESES.get(mes.lower())
    return '%s-%02d-%02d' % (a, n, int(d)) if n else None


def versao_pymupdf():
    return pymupdf.VersionBind
