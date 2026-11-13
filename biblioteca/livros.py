"""Tipo de fonte livros (item C15.1): o pacote de livros de referencia, a partir da planilha.

    python biblioteca/gerar_pacote.py --fonte livros --planilha <Livros/Livros_por_Materia_Nathalia.csv>
        --rotulo matematica --versao 1 --saida <pasta dos pacotes>
        [--materia matematica] [--pdfs <pasta Livros>] [--mapas <Livros/mapa>]
        [--trabalho <pasta>] [--gerado-em 2026-10-30T10:00:00-03:00] [--commit abc1234]

Le a planilha (uma linha por livro) e aceita os arquivos da coluna "Arquivo",
que e relativa a pasta da planilha (ou a --pdfs). Linha sem arquivo e livro
que a professora ainda nao tem: fica no relatorio como "sem arquivo", e nao e
recusa.

O TETO: 160 MB por livro (era 40 MB no C15.1; o dono decidiu depois que nada
perde qualidade, e o tablet tem 200 GB livres). Acima disso o livro nao entra,
e o relatorio o lista (item E7). O teto e conferido pelo tamanho no disco ANTES
de abrir o arquivo: um PDF de 500 MB nao chega a ser lido. E 480 MB por pacote
(ver TETO_DO_PACOTE): um pacote por materia.

O SUMARIO, por ordem de preferencia:
  - PDF: os marcadores do proprio PDF (get_toc), com nivel, titulo, pagina e a
    pagina do fim (a anterior ao proximo marcador do mesmo nivel ou acima);
    sem marcadores, o mapa da orquestradora (Livros/mapa/mapa_*.json, pelo nome
    do arquivo), com as paginas do arquivo de cada capitulo; sem os dois, o
    sumario sai vazio, e o manifest diz isso em `sumario_origem` e
    `sumario_nota`, em vez de inventar um.
    CAMPO `sumario` DO LIVRO NO MAPA (item 12a): `"sumario": "mapa"` faz o
    sumário sair do mapa MESMO quando o PDF tem marcadores. É para o PDF cujos
    marcadores são lixo (o fme05: "x, 1, 2, 3, gaba, 4, gabb, x"). A nota diz
    que o mapa venceu os marcadores. Se o mapa não der entrada nenhuma dentro
    das páginas, valem os marcadores, e a nota diz. Outro valor no campo não
    muda nada e a nota diz que foi ignorado. Só no PDF.
  - EPUB: o sumario de navegacao do EPUB 3 (nav) ou, na falta dele, o NCX do
    EPUB 2. No EPUB nao ha pagina: cada entrada aponta o capitulo, que e a
    posicao do arquivo na espinha (spine), e a ancora dentro dele. Sem sumario
    (ou com o "Start" de uma entrada so), o mapa de capitulos de EPUB da
    orquestradora, por parte e ancora (item 12a, parte 0); com
    `"sumario": "mapa"` no livro do mapa, o mapa vence o sumario do EPUB.

O MAPA DE CAPITULOS DE EPUB (item 12a, parte 0): no livro do mapa de um
EPUB, cada capitulo diz `capitulo` (a posicao da parte na espinha, de 1 em
diante, a mesma "parte N" do leitor), `capitulo_fim` (a ultima parte dele) e,
opcional, `ancora` (o id, dentro da parte `capitulo`, onde ele comeca), no
lugar de `pag_arquivo_inicio` e `pag_arquivo_fim`. A ancora tem de existir na
parte (o gerador le os ids de cada parte): ancora que nao esta la, parte fora
da espinha e entrada so com paginas de PDF saem, contadas na nota. O campo
`formato` do livro no mapa, se vier e nao for o do arquivo, tira o mapa
inteiro desse livro (mapa_do_formato). O meta sai na forma de sempre do mapa
de EPUB: {n, titulo, capitulo, capitulo_fim, ancora?, capitulo_do_livro,
assuntos, origem}, em ordem de parte e, na mesma parte, de ancora no texto.
O formato esta descrito tambem no LEIA-ME.md de Livros/mapa.

O PACOTE segue o contrato dos pacotes (CONTRATO_pacote_biblioteca.md, secao
8j): um zip com manifest.json e livros/<id>.<pdf|epub>, nomes ASCII, o
manifest com a lista de livros (titulo, autoria, editora, edicao, ano,
segmento, sumario e hash) e o hash de cada arquivo em `arquivos`. Os livros
vao "stored" (sem compressao): PDF e EPUB ja sao comprimidos, e assim o
tablet le cada livro direto do zip, sem inflar.

A NUMERAÇÃO IMPRESSA (item 12a), em `numeracao` do livro PDF: a lista de
trechos {de, ate, inicio, estilo} que biblioteca.js lê (paginaImpressa) para
o sumário, o "Abrir na p." e o contador do leitor mostrarem a página
IMPRESSA. `de` e `ate` são páginas do arquivo, `inicio` é a impressa da página
`de`, e `estilo` é "arabico" ou "romano". Os trechos vêm em ordem e sem
sobreposição, e a página fora de trecho mostra o número do arquivo. A fonte,
por ordem:
  - os rótulos de página do próprio PDF (/PageLabels), quando o PDF os tem.
    Vale só o estilo decimal e o romano, sem prefixo. O mapa não muda nada
    nesse livro, e a nota diz se ele também tentava dizer a numeração;
  - sem rótulo, o mapa da orquestradora, em duas camadas:
      * DERIVADA: cada entrada com `pag_impressa` vira um trecho do
        `pag_arquivo_inicio` ao `pag_arquivo_fim`, começando na
        `pag_impressa`. Ela tem de fechar com o `deslocamento` (o da entrada,
        ou o do livro): `pag_arquivo_inicio - deslocamento == pag_impressa`.
        A entrada que não fecha fica sem número, e a nota diz. Entrada com
        `pag_impressa: null` não numera nada. A página de transição fica com
        a entrada seguinte;
      * EXPLÍCITA: o campo novo `numeracao_trechos` do livro no mapa, uma
        lista no mesmo formato {de, ate, inicio, estilo}, com o estilo
        "arabico" por padrão. Os trechos explícitos têm precedência: a
        derivada é cortada onde eles estão. São para o que o mapa sozinho não
        diz:
          - a página dupla: um trecho de uma página com o número da esquerda;
          - as páginas fora de ordem: um trecho para cada pedaço (o mp1, PDF
            299 a 304 com as impressas 290, 291 e 286 a 289);
          - os recomeços: os capítulos adicionais do mp1 e do mp3, e a
            Resolução do ca1;
          - a página impressa que não existe: o trecho seguinte começa depois
            dela (o caderno do tel7 pula a 44).
        Um trecho explícito mal formado (fora do arquivo, sobreposto, início
        inválido, estilo desconhecido) derruba a numeração inteira do livro:
        sem `numeracao`, e a `numeracao_nota` diz qual trecho, em vez de
        mostrar a derivada errada justo nas páginas que o trecho consertaria.
A conferência é a mesma do aplicativo (erro_da_numeracao espelha o
conferirNumeracao): uma numeração que o aplicativo recusaria nunca sai.
`numeracao_origem` ("rotulos" ou "mapa") e `numeracao_nota` acompanham.

O MAPA capitulo para assunto (C15.2), em `mapa` de cada livro: capitulo,
paginas (ou a posicao na espinha, no EPUB) e os ids de assunto do indice de
banco/topicos/, sem uma linha do conteudo do livro. A fonte, por ordem:
  - o mapa da orquestradora (Livros/mapa/mapa_capitulos_*.json, pelo nome do
    arquivo): os capitulos com as paginas do arquivo e os assuntos dela;
  - o mapa de obras (mapa_obras_*.json, literatura): o assunto e da obra
    inteira, e o mapa tem uma entrada so, do comeco ao fim do livro;
  - sem os dois, um PRIMEIRO PASSE AUTOMATICO: o titulo de cada capitulo do
    sumario contra os titulos dos assuntos da materia, por semelhanca, so
    entre os assuntos do ANO do livro (o `serie` do mapa, ou o segmento da
    planilha). Cada assunto achado assim vai marcado `auto`, e a tela pede
    que ela confirme ou corrija. Sem ano, sem materia no indice ou sem
    sumario, o mapa sai vazio, e `mapa_nota` diz por que.
O mapa do pacote nao muda depois: a correcao dela mora no aplicativo, por cima.

O GABARITO de cada capitulo (C15.5), em `gabarito` da entrada do mapa: as
paginas (ou as partes, no EPUB) das respostas daquele capitulo, quando um passe
SEMIAUTOMATICO as localiza. O passe le o texto de cada pagina, acha os titulos
"Respostas", "Gabarito" e "Resolucoes" e os numeros de capitulo dentro da secao
de respostas, e propoe; a planilha de conferencia (uma por livro, fora do
repositorio) diz o que achou e o grau de certeza, para a sessao conferir por
amostragem. As variacoes: respostas no fim de cada capitulo, no fim do livro
por capitulo, so das impares, ou so no manual do professor (fora do livro: o
campo fica vazio). PDF sem camada de texto nao tem o que ler: fica vazio e
marcado como menos confiavel. Nunca se inventa: sem gabarito localizado, a
entrada nao ganha `gabarito`, e a tela diz "sem gabarito localizado neste livro".

Nenhum livro entra no repositorio: o pacote sai em --saida, fora dele. A prova
(biblioteca/_prova_livros.py) roda sobre livros sinteticos.
"""
import csv
import datetime
import hashlib
import json
import os
import posixpath
import re
import shutil
import time
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from urllib.parse import unquote

import pymupdf

import gerar_pacote
import portal

# O teto por livro e o mesmo do aplicativo (TETO_POR_LIVRO, em biblioteca.js);
# a prova confere os dois juntos.
TETO_MB = 160
TETO_BYTES = TETO_MB * 1024 * 1024
# O TETO POR PACOTE: 480 MB, e a recomendacao e um pacote por materia (--materia).
# Desde a revisao do C15.1 o app le o pacote de livros livro a livro, direto do
# arquivo, e a memoria do tablet nao depende do tamanho do pacote (o pico e
# perto de um livro, ate 160 MB). O que ainda cresce com o pacote: o espaco no
# tablet, que no dia da importacao guarda o zip baixado do Drive E a copia no
# banco (duas vezes o pacote, nada para 200 GB livres); a gravacao, que e UMA
# transacao (tudo ou nada), mais longa quanto maior o pacote; e o download pelo
# Drive, que pela metade e o caso do pacote cortado. 480 MB sao tres livros no
# teto, ou dezenas dos comuns (a matematica inteira da planilha tem 9,8 MB).
# Acima disso o gerador recusa e manda separar por materia.
TETO_DO_PACOTE_MB = 480
TETO_DO_PACOTE = TETO_DO_PACOTE_MB * 1024 * 1024


def motivo_do_pacote(total):
    """None se o pacote cabe no teto de 480 MB; senao, a frase da recusa."""
    if total > TETO_DO_PACOTE:
        return ('erro: o pacote teria %s MB, acima do teto de %d MB por pacote. Gere um pacote por materia '
                '(--materia), e, se uma materia passar sozinha, separe a planilha em duas'
                % (mb(total), TETO_DO_PACOTE_MB))
    return None
FORMATOS = {'.pdf': 'pdf', '.epub': 'epub'}

NS = {
    'c': 'urn:oasis:names:tc:opendocument:xmlns:container',
    'opf': 'http://www.idpf.org/2007/opf',
    'x': 'http://www.w3.org/1999/xhtml',
    'ncx': 'http://www.daisy.org/z3986/2005/ncx/',
    'ops': 'http://www.idpf.org/2007/ops',
    'enc': 'http://www.w3.org/2001/04/xmlenc#',
}
# Ofuscacao de fonte (IDPF e Adobe) nao e DRM: so a fonte embutida fica
# ilegivel, e o texto continua aberto. Qualquer outro algoritmo e protecao.
OFUSCACAO_DE_FONTE = {'http://www.idpf.org/2008/embedding', 'http://ns.adobe.com/pdf/enc#RC'}


class Recusa(Exception):
    """O livro nao entra no pacote, pelo motivo da mensagem (vai para o relatorio)."""


def mb(n):
    return ('%.1f' % (n / (1024 * 1024))).replace('.', ',')


def motivo_do_teto(n):
    """None se o livro cabe no teto de 160 MB; senao, a frase do relatorio."""
    if n > TETO_BYTES:
        return ('tem %s MB, acima do teto de %d MB por livro, e ficou fora do pacote (item E7)'
                % (mb(n), TETO_MB))
    return None


def limpar_texto(t):
    """Texto que vai para a tela: sem travessao nem meia-risca, sem controle, espacos simples."""
    t = portal.sem_tracos(str(t or ''))
    t = ''.join(c if (c >= ' ' or c in '\t\n') else ' ' for c in t)
    return re.sub(r'\s+', ' ', t).strip()


def slug(texto):
    t = unicodedata.normalize('NFKD', str(texto))
    t = ''.join(c for c in t if not unicodedata.combining(c)).lower()
    t = re.sub(r'[^a-z0-9]+', '-', t).strip('-')
    return t[:80].strip('-') or 'livro'


def chave_de_arquivo(caminho):
    """Para casar o livro com o mapa: o nome do arquivo, sem pasta, sem caixa."""
    return unicodedata.normalize('NFC', posixpath.basename(str(caminho).replace('\\', '/'))).casefold()


def sha_do_arquivo(caminho):
    h = hashlib.sha256()
    with open(caminho, 'rb') as f:
        for bloco in iter(lambda: f.read(1024 * 1024), b''):
            h.update(bloco)
    return 'sha256:' + h.hexdigest()


def ler_planilha(caminho):
    with open(caminho, encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


# ------------------------------------------------------------------ PDF

def fechar_paginas_fim(entradas, total):
    """A pagina do fim de cada entrada: a anterior a proxima do mesmo nivel ou de cima."""
    for i, e in enumerate(entradas):
        fim = total
        for f in entradas[i + 1:]:
            if f['nivel'] <= e['nivel']:
                fim = max(e['pagina'], f['pagina'] - 1)
                break
        e['pagina_fim'] = fim
    return entradas


def sumario_dos_marcadores(doc):
    total = doc.page_count
    entradas, fora = [], 0
    for nivel, titulo, pagina in doc.get_toc(simple=True):
        t = limpar_texto(titulo)
        if not t or not (1 <= pagina <= total):
            fora += 1     # marcador sem destino, ou sem titulo: nao vira capitulo
            continue
        entradas.append({'nivel': int(nivel), 'titulo': t, 'pagina': int(pagina)})
    fechar_paginas_fim(entradas, total)
    return [dict(n=i + 1, **e) for i, e in enumerate(entradas)], fora


def sumario_do_mapa(livro_do_mapa, total):
    entradas, fora = [], 0
    for cap in livro_do_mapa.get('capitulos') or []:
        try:
            ini = int(cap.get('pag_arquivo_inicio'))
        except (TypeError, ValueError):
            fora += 1
            continue
        t = limpar_texto(cap.get('titulo'))
        if not t or not (1 <= ini <= total):
            fora += 1
            continue
        try:
            fim = int(cap.get('pag_arquivo_fim'))
        except (TypeError, ValueError):
            fim = None
        e = {'nivel': 1, 'titulo': t, 'pagina': ini}
        if fim is not None:
            e['pagina_fim'] = min(total, max(ini, fim))
        if cap.get('n') is not None:
            e['capitulo_do_livro'] = cap.get('n')
        entradas.append(e)
    entradas.sort(key=lambda e: e['pagina'])
    sem_fim = [e for e in entradas if 'pagina_fim' not in e]
    if sem_fim:
        fechar_paginas_fim(entradas, total)
    return [dict(n=i + 1, **e) for i, e in enumerate(entradas)], fora


# O valor do campo `sumario` do livro no mapa que faz o mapa vencer os marcadores.
SUMARIO_DO_MAPA = 'mapa'


def ler_pdf(caminho, mapas):
    try:
        doc = pymupdf.open(caminho)
    except Exception as e:  # noqa: BLE001 (qualquer falha de abertura e recusa do livro)
        raise Recusa('o PDF não abre (%s)' % str(e)[:120])
    try:
        if doc.needs_pass:
            raise Recusa('o PDF tem senha, e o leitor do aplicativo não abre PDF com senha')
        if doc.page_count < 1:
            raise Recusa('o PDF não tem página nenhuma')
        total = doc.page_count
        sumario, fora = sumario_dos_marcadores(doc)
        info = {'paginas': total}
        achado = mapas.get(chave_de_arquivo(caminho))
        pedido = achado[1].get('sumario') if achado else None
        aviso = ''
        if pedido == SUMARIO_DO_MAPA and sumario:
            # o campo `sumario: "mapa"` do livro: o mapa vence os marcadores
            nome_mapa, livro = achado
            do_mapa, fora_mapa = sumario_do_mapa(livro, total)
            if do_mapa:
                info.update(sumario=do_mapa, sumario_origem='mapa',
                            sumario_nota='O sumário veio do mapa da orquestradora (%s, livro %s), com as páginas do '
                                         'arquivo, e não dos %d marcadores do PDF: o mapa pede "sumario": "mapa".'
                                         % (nome_mapa, livro.get('livro'), len(sumario)))
                if fora_mapa:
                    info['sumario_nota'] += ' %d capítulo(s) do mapa fora das páginas do arquivo ficaram de fora.' % fora_mapa
                return info
            aviso = ' O mapa pede "sumario": "mapa", mas não tem capítulo dentro das páginas do arquivo: valeram os marcadores.'
        elif pedido is not None and pedido != SUMARIO_DO_MAPA:
            aviso = ' O campo "sumario" do mapa tem um valor que o gerador não conhece (%s) e foi ignorado.' % limpar_texto(pedido)[:40]
        if sumario:
            info.update(sumario=sumario, sumario_origem='marcadores')
            nota = ('%d marcador(es) sem página de destino ficaram fora do sumário.' % fora if fora else '') + aviso
            if nota.strip():
                info['sumario_nota'] = nota.strip()
            return info
        if achado:
            nome_mapa, livro = achado
            sumario, fora = sumario_do_mapa(livro, total)
            if sumario:
                info.update(sumario=sumario, sumario_origem='mapa',
                            sumario_nota='O PDF não tem marcadores: o sumário veio do mapa da orquestradora (%s, '
                                         'livro %s), com as páginas do arquivo.' % (nome_mapa, livro.get('livro')))
                if fora:
                    info['sumario_nota'] += ' %d capítulo(s) do mapa fora das páginas do arquivo ficaram de fora.' % fora
                info['sumario_nota'] += aviso
                return info
        info.update(sumario=[], sumario_origem='nenhum',
                    sumario_nota='O PDF não tem marcadores e não há mapa deste livro: o sumário está vazio.')
        return info
    finally:
        doc.close()


def ler_mapas(pasta):
    """{nome do arquivo do livro: (nome do mapa, livro do mapa)}, de todo mapa_*.json da pasta.

    Dois formatos: a lista de livros com `capitulos` (os mapas de capitulo) e
    o objeto com `obras` (o de literatura, assunto da obra inteira). No
    segundo, o livro do mapa nao tem `capitulos`, e sim `obra` e `assuntos`."""
    por_arquivo = {}
    if not pasta or not os.path.isdir(pasta):
        return por_arquivo
    for nome in sorted(os.listdir(pasta)):
        if not (nome.startswith('mapa_') and nome.endswith('.json')):
            continue
        try:
            with open(os.path.join(pasta, nome), encoding='utf-8') as f:
                dados = json.load(f)
        except (OSError, ValueError):
            continue
        if isinstance(dados, dict) and isinstance(dados.get('obras'), list):
            for obra in dados['obras']:
                if isinstance(obra, dict) and obra.get('arquivo') and isinstance(obra.get('assuntos'), list):
                    por_arquivo.setdefault(chave_de_arquivo(obra['arquivo']), (nome, obra))
            continue
        if not isinstance(dados, list):
            continue
        for livro in dados:
            if isinstance(livro, dict) and livro.get('arquivo') and isinstance(livro.get('capitulos'), list):
                por_arquivo.setdefault(chave_de_arquivo(livro['arquivo']), (nome, livro))
    return por_arquivo


def mapa_do_formato(achado, formato):
    """O mapa achado pelo nome, se ele servir a este formato; senao (None, aviso).
    O campo `formato` do livro no mapa e opcional; se vier e nao for o do
    arquivo, o mapa inteiro fica de fora: as paginas de um PDF lidas como
    partes de um EPUB (ou o contrario) levariam cada toque a outro lugar."""
    if not achado:
        return None, ''
    dito = achado[1].get('formato')
    if dito is None or str(dito).strip().lower() == formato:
        return achado, ''
    return None, ('O mapa da orquestradora (%s, livro %s) diz formato "%s", e o arquivo é %s: o mapa ficou de fora.'
                  % (achado[0], achado[1].get('livro'), limpar_texto(dito)[:20], formato.upper()))


# ------------------------------------------------------------------ a numeracao impressa (item 12a)

ESTILOS_DE_NUMERACAO = ('arabico', 'romano')
# Os estilos de rotulo do PDF que o aplicativo sabe mostrar: decimal e romano.
ESTILO_DO_ROTULO = {'D': 'arabico', 'r': 'romano', 'R': 'romano'}


def inteiro(v):
    return isinstance(v, int) and not isinstance(v, bool)


def erro_da_numeracao(trechos, total):
    """None se a lista de trechos passa na mesma regra do aplicativo
    (conferirNumeracao, em biblioteca.js); senao, a frase do defeito."""
    fim_anterior = 0
    for i, t in enumerate(trechos):
        onde = 'trecho %d' % (i + 1)
        if not isinstance(t, dict):
            return '%s não é um trecho' % onde
        if t.get('estilo') not in ESTILOS_DE_NUMERACAO:
            return '%s com estilo desconhecido (%s)' % (onde, limpar_texto(t.get('estilo'))[:20])
        de, ate, inicio = t.get('de'), t.get('ate'), t.get('inicio')
        if not (inteiro(de) and inteiro(ate) and 1 <= de <= ate <= total):
            return '%s fora das páginas do arquivo (%r a %r, de %d)' % (onde, de, ate, total)
        if not inteiro(inicio) or inicio < 1 or (t['estilo'] == 'romano' and inicio + (ate - de) > 3999):
            return '%s com início inválido (%r)' % (onde, inicio)
        if de <= fim_anterior:
            return '%s sobrepõe ou inverte o anterior' % onde
        fim_anterior = ate
    return None


def juntar_trechos(trechos):
    """Trechos seguidos que continuam a mesma contagem viram um so."""
    saida = []
    for t in trechos:
        p = saida[-1] if saida else None
        if p and p['estilo'] == t['estilo'] and t['de'] == p['ate'] + 1 and t['inicio'] == p['inicio'] + (p['ate'] - p['de'] + 1):
            p['ate'] = t['ate']
        else:
            saida.append(dict(t))
    return saida


def numeracao_dos_rotulos(doc):
    """Os rotulos de pagina do proprio PDF (/PageLabels) em trechos. So os
    estilos decimal e romano, sem prefixo; o resto fica sem numero."""
    total = doc.page_count
    try:
        regras = sorted(doc.get_page_labels() or [], key=lambda r: r.get('startpage', 0))
    except Exception:  # noqa: BLE001 (rotulo ilegivel e livro sem rotulo)
        regras = []
    trechos = []
    for i, r in enumerate(regras):
        de = int(r.get('startpage', 0)) + 1
        ate = int(regras[i + 1].get('startpage', 0)) if i + 1 < len(regras) else total
        estilo = ESTILO_DO_ROTULO.get(r.get('style') or '')
        if not estilo or r.get('prefix') or not (1 <= de <= ate <= total):
            continue
        trechos.append({'de': de, 'ate': ate, 'inicio': int(r.get('firstpagenum') or 1), 'estilo': estilo})
    return bool(regras), juntar_trechos(trechos)


def numeracao_derivada(livro_do_mapa, total):
    """Os trechos que o mapa da orquestradora diz pelas entradas: cada entrada
    com `pag_impressa` vira um trecho do `pag_arquivo_inicio` ao
    `pag_arquivo_fim`, comecando em `pag_arquivo_inicio - deslocamento` (o da
    entrada, ou o do livro). Devolve (trechos, notas)."""
    desl_livro = livro_do_mapa.get('deslocamento')
    brutos, notas = [], []
    for cap in livro_do_mapa.get('capitulos') or []:
        imp = cap.get('pag_impressa')
        if imp is None:
            continue
        ini, fim = cap.get('pag_arquivo_inicio'), cap.get('pag_arquivo_fim')
        desl = cap.get('deslocamento')
        if desl is None:
            desl = desl_livro
        titulo = limpar_texto(cap.get('titulo'))[:60]
        if not (inteiro(ini) and inteiro(fim) and inteiro(imp) and 1 <= ini <= fim <= total):
            notas.append('a entrada "%s" não tem páginas e página impressa inteiras dentro do arquivo' % titulo)
            continue
        if desl is not None and (not inteiro(desl) or ini - desl != imp):
            notas.append('a entrada "%s" tem página impressa %d que não fecha com o deslocamento %r' % (titulo, imp, desl))
            continue
        if imp < 1:
            continue
        brutos.append({'de': ini, 'ate': fim, 'inicio': imp, 'estilo': 'arabico'})
    brutos.sort(key=lambda t: t['de'])
    trechos = []
    for t in brutos:
        # a pagina de transicao (o fim de uma entrada e o comeco da seguinte) fica com a seguinte
        if trechos and t['de'] <= trechos[-1]['ate']:
            trechos[-1]['ate'] = t['de'] - 1
            if trechos[-1]['ate'] < trechos[-1]['de']:
                trechos.pop()
        trechos.append(t)
    return trechos, notas


def tirar_paginas(trechos, cobertos):
    """Os trechos sem as paginas de `cobertos` (lista de [de, ate])."""
    saida = []
    for t in trechos:
        pedacos = [(t['de'], t['ate'])]
        for a, b in cobertos:
            novos = []
            for de, ate in pedacos:
                if b < de or a > ate:
                    novos.append((de, ate))
                    continue
                if de < a:
                    novos.append((de, a - 1))
                if ate > b:
                    novos.append((b + 1, ate))
            pedacos = novos
        for de, ate in pedacos:
            saida.append({'de': de, 'ate': ate, 'inicio': t['inicio'] + (de - t['de']), 'estilo': t['estilo']})
    return saida


def numeracao_do_pdf(doc, achado):
    """A `numeracao` do livro (os trechos que biblioteca.js le), a origem e a
    nota. Ver o cabecalho, "A NUMERACAO IMPRESSA". {} quando nao ha nada."""
    total = doc.page_count
    tem_rotulo, dos_rotulos = numeracao_dos_rotulos(doc)
    if tem_rotulo:
        if not dos_rotulos:
            return {'numeracao_nota': 'O PDF tem rótulos de página, mas em estilo que o aplicativo não mostra: sem numeração impressa.'}
        erro = erro_da_numeracao(dos_rotulos, total)
        if erro:
            return {'numeracao_nota': 'Os rótulos de página do PDF não formam uma numeração válida (%s): sem numeração impressa.' % erro}
        nota = 'A numeração impressa veio dos rótulos de página do próprio PDF.'
        if achado and (achado[1].get('numeracao_trechos') is not None or
                       any(c.get('pag_impressa') is not None for c in achado[1].get('capitulos') or [])):
            nota += ' O mapa também diz a numeração, mas os rótulos do PDF vencem.'
        return {'numeracao': dos_rotulos, 'numeracao_origem': 'rotulos', 'numeracao_nota': nota}
    if not achado or 'capitulos' not in achado[1]:
        return {}
    nome_mapa, livro = achado
    explicitos = livro.get('numeracao_trechos')
    if explicitos is not None:
        if not isinstance(explicitos, list):
            return {'numeracao_nota': 'O campo numeracao_trechos do mapa (%s) não é uma lista: sem numeração impressa.' % nome_mapa}
        explicitos = [dict(t, estilo=t.get('estilo', 'arabico')) if isinstance(t, dict) else t for t in explicitos]
        erro = erro_da_numeracao(explicitos, total)
        if erro:
            return {'numeracao_nota': 'Os trechos explícitos do mapa (%s, numeracao_trechos) estão mal formados (%s): '
                                      'sem numeração impressa.' % (nome_mapa, erro)}
        explicitos = [{k: t[k] for k in ('de', 'ate', 'inicio', 'estilo')} for t in explicitos]
    derivados, notas = numeracao_derivada(livro, total)
    if explicitos:
        derivados = tirar_paginas(derivados, [(t['de'], t['ate']) for t in explicitos])
    trechos = juntar_trechos(sorted((explicitos or []) + derivados, key=lambda t: t['de']))
    if not trechos:
        return {'numeracao_nota': 'O mapa não diz a página impressa de nenhuma entrada: sem numeração impressa.'} if notas else {}
    erro = erro_da_numeracao(trechos, total)
    if erro:
        return {'numeracao_nota': 'A numeração tirada do mapa (%s) não é válida (%s): sem numeração impressa.' % (nome_mapa, erro)}
    nota = 'A numeração impressa veio do mapa da orquestradora (%s, livro %s): ' % (nome_mapa, livro.get('livro'))
    nota += ('%d trecho(s) explícito(s) e o resto pelo deslocamento de cada entrada.' % len(explicitos) if explicitos
             else 'pelo deslocamento e pela página impressa de cada entrada.')
    if notas:
        nota += ' Ficaram sem número: ' + '; '.join(notas) + '.'
    return {'numeracao': trechos, 'numeracao_origem': 'mapa', 'numeracao_nota': nota}


def ler_numeracao(caminho, achado):
    """Abre o PDF so para os rotulos de pagina e calcula a numeracao."""
    doc = pymupdf.open(caminho)
    try:
        return numeracao_do_pdf(doc, achado)
    finally:
        doc.close()


# ------------------------------------------------------------------ o mapa (C15.2)

TOPICOS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'banco', 'topicos')
# A materia da planilha (materia_id) e a disciplina do indice quando os nomes diferem.
DISCIPLINA_DA_MATERIA = {'filosofia': 'filosofia-sociologia', 'sociologia': 'filosofia-sociologia'}
# O ano do livro quando o mapa nao diz: o segmento da planilha. "Formacao da
# professora" nao e ano de aluno nenhum, e fica sem ano (e sem passe automatico).
ORDEM_DAS_SERIES = ['02', '03', '04', '05', '06', '07', '08', '09', 'em1', 'em2', 'em3']
SERIES_DO_SEGMENTO = (('anos iniciais', ORDEM_DAS_SERIES[0:4]), ('anos finais', ORDEM_DAS_SERIES[4:8]),
                      ('ensino medio', ORDEM_DAS_SERIES[8:]), ('vestibular', ORDEM_DAS_SERIES[8:]),
                      ('ime/ita', ORDEM_DAS_SERIES[8:]), ('olimpiadas', ORDEM_DAS_SERIES[8:]))
# A semelhanca minima do passe automatico (Dice das palavras, de 0 a 1): metade
# das palavras de um lado e do outro em comum. Abaixo disso o capitulo fica sem
# assunto, em vez de ganhar um palpite que ela teria de desmanchar.
LIMIAR_AUTO = 0.5
PALAVRAS_VAZIAS = set(('a o as os e de da do das dos em no na nos nas um uma uns umas com para por pelo pela '
                       'pelos pelas ao aos que se sua seu suas seus como sao ou entre sobre sem mais '
                       'cap capitulo unidade parte topico secao licao modulo volume livro tema').split())
CONFIANCAS = {'alta': 'alta', 'media': 'média', 'média': 'média', 'baixa': 'baixa'}


def sem_acento(t):
    t = unicodedata.normalize('NFKD', str(t or ''))
    return ''.join(c for c in t if not unicodedata.combining(c)).lower()


def radical(p):
    """O radical de uma palavra, para "fração" e "frações" serem a mesma: o
    plural desfeito e seis letras. Grosso de proposito; quem decide e ela."""
    for fim, troca in (('oes', 'ao'), ('aes', 'ao'), ('ais', 'al'), ('eis', 'el'), ('ois', 'ol'), ('ns', 'm'), ('s', '')):
        if len(p) > 3 and p.endswith(fim):
            p = p[:-len(fim)] + troca
            break
    return p[:6]


def palavras(titulo):
    return {radical(p) for p in re.split(r'[^a-z0-9]+', sem_acento(titulo))
            if len(p) > 2 and not p.isdigit() and p not in PALAVRAS_VAZIAS}


def semelhanca(a, b):
    """Dice das palavras: 2 x comuns / (palavras de um + palavras do outro)."""
    if not a or not b:
        return 0.0
    return 2.0 * len(a & b) / (len(a) + len(b))


def series_do_segmento(segmento):
    s = sem_acento(segmento)
    achadas = set()
    for chave, series in SERIES_DO_SEGMENTO:
        if chave in s:
            achadas.update(series)
    return [x for x in ORDEM_DAS_SERIES if x in achadas]


def ler_catalogo(pasta=None):
    """{disciplina: {'eixo', 'assuntos': [{id, titulo, serie, palavras}]}} do indice de banco/topicos/.

    A matematica tem o formato proprio (temas com serie); as outras, grupos e
    blocos com a lista `ids` paralela a `topicos`. `serie` e a chave do grupo,
    que so e ano escolar quando o eixo da disciplina e "ano"."""
    pasta = pasta or TOPICOS
    catalogo = {}
    with open(os.path.join(pasta, 'matematica.json'), encoding='utf-8') as f:
        mat = json.load(f)
    catalogo['matematica'] = {'eixo': 'ano', 'assuntos': [
        {'id': t['id'], 'titulo': t['pt']['titulo'], 'serie': t['serie'], 'palavras': palavras(t['pt']['titulo'])}
        for t in mat.get('temas') or []]}
    with open(os.path.join(pasta, 'indice.json'), encoding='utf-8') as f:
        indice = json.load(f)
    for d in indice.get('disciplinas') or []:
        with open(os.path.join(pasta, d['chave'] + '.json'), encoding='utf-8') as f:
            arq = json.load(f)
        assuntos = []
        for g in arq.get('grupos') or []:
            for b in g.get('blocos') or []:
                for i, titulo in enumerate(b.get('topicos') or []):
                    ids = b.get('ids') or []
                    if i < len(ids) and ids[i]:
                        assuntos.append({'id': ids[i], 'titulo': titulo, 'serie': g['chave'], 'palavras': palavras(titulo)})
        catalogo[d['chave']] = {'eixo': d.get('eixo'), 'assuntos': assuntos}
    return catalogo


def no_ano_do_livro(assunto, series, eixo):
    """A REGRA do filtro de ano: o assunto entra no passe automatico so se for
    de um ano do livro. Disciplina que nao se divide por ano (redacao, ingles,
    metodo de estudo) nao tem o que filtrar."""
    return eixo != 'ano' or assunto['serie'] in series


def palpite(titulo, disciplina, series):
    """O assunto mais parecido com o titulo, entre os do ano do livro, ou None."""
    melhor, nota = None, 0.0
    alvo = palavras(titulo)
    for a in disciplina['assuntos']:
        if not no_ano_do_livro(a, series, disciplina['eixo']):
            continue
        s = semelhanca(alvo, a['palavras'])
        if s > nota:     # empate fica com o primeiro do indice: a ordem do indice e estavel
            melhor, nota = a, s
    if melhor is None or nota < LIMIAR_AUTO:
        return None
    return {'id': melhor['id'], 'confianca': 'auto', 'semelhanca': round(nota, 2)}


def nivel_dos_capitulos(sumario):
    """O nivel do sumario que e capitulo: o mais alto com duas entradas ou mais."""
    niveis = sorted({e['nivel'] for e in sumario})
    for n in niveis:
        if sum(1 for e in sumario if e['nivel'] == n) >= 2:
            return n
    return niveis[0] if niveis else None


def disciplinas_dos_ids(catalogo):
    """{id do assunto: disciplina}, de TODAS as disciplinas do indice."""
    return {a['id']: chave for chave, d in catalogo.items() for a in d['assuntos']}


def assuntos_do_mapa(lista, disciplina_de):
    """Os assuntos de uma entrada do mapa da orquestradora, so com id do indice. Devolve (assuntos, fora).

    Item 12c (12/11/2026): o id vale em QUALQUER disciplina do indice
    (`disciplina_de`, de disciplinas_dos_ids), e nao so na do livro: o
    capitulo de quimica que trata de unidades do SI liga o FISEM1-T01. O id
    que o indice nao tem fica de fora, como sempre. A entrada pode dizer a
    disciplina (`"disciplina": "fisica"`); quando diz, tem de ser a do id no
    indice, senao o assunto fica de fora (a disciplina escrita errada nao
    liga o capitulo a um assunto que o mapa nao quis)."""
    saida, fora = [], 0
    for a in lista or []:
        aid = a.get('id') if isinstance(a, dict) else None
        if not isinstance(aid, str) or aid not in disciplina_de:
            fora += 1
            continue
        dita = a.get('disciplina')
        if dita is not None and DISCIPLINA_DA_MATERIA.get(dita, dita) != disciplina_de[aid]:
            fora += 1
            continue
        if any(x['id'] == aid for x in saida):
            continue
        item = {'id': aid, 'confianca': CONFIANCAS.get(str(a.get('confianca') or '').lower(), 'alta')}
        if a.get('serie_vizinha'):
            item['serie_vizinha'] = True
        saida.append(item)
    return saida, fora


def nota_de_outra_materia(entradas, disciplina_id, disciplina_de):
    """O pedaco da nota que conta as ligacoes a assunto de outra materia, com os ids."""
    ids = []
    for e in entradas:
        for a in e.get('assuntos') or []:
            if disciplina_de.get(a['id']) != disciplina_id and a['id'] not in ids:
                ids.append(a['id'])
    if not ids:
        return ''
    return ' %d assunto(s) de outra matéria: %s.' % (len(ids), ', '.join(ids))


def montar_mapa(livro, info, achado, catalogo):
    """O mapa do livro (lista), a origem, o ano e a nota. Nao abre o livro:
    trabalha so com o sumario, as paginas e o mapa da orquestradora."""
    formato = livro['formato']
    nome_mapa, do_mapa = achado if achado else (None, None)
    disciplina_id = DISCIPLINA_DA_MATERIA.get(livro.get('materia'), livro.get('materia'))
    disciplina = catalogo.get(disciplina_id)
    ids_validos = disciplinas_dos_ids(catalogo)
    serie_mapa = str((do_mapa or {}).get('serie') or '').strip()
    if serie_mapa in ORDEM_DAS_SERIES:
        series, series_origem = [serie_mapa], 'mapa'
    else:
        series = series_do_segmento(livro.get('segmento'))
        series_origem = 'segmento' if series else 'nenhuma'
    saida = {'series': series, 'series_origem': series_origem, 'mapa_disciplina': disciplina_id if disciplina else None}
    total = info.get('paginas')
    espinha = len((info.get('epub') or {}).get('espinha') or [])

    # 1. o mapa de obra (literatura): uma entrada, o livro inteiro
    if do_mapa is not None and 'capitulos' not in do_mapa:
        assuntos, fora = assuntos_do_mapa(do_mapa.get('assuntos'), ids_validos)
        e = {'n': 1, 'titulo': limpar_texto(do_mapa.get('obra') or livro['titulo']), 'obra_inteira': True,
             'assuntos': assuntos, 'origem': 'mapa'}
        if formato == 'pdf':
            e.update(pagina=1, pagina_fim=total)
        else:
            e.update(capitulo=1, capitulo_fim=espinha)
        nota = 'Assunto da obra inteira, do mapa de obras da orquestradora (%s).' % nome_mapa
        if fora:
            nota += ' %d assunto(s) fora do índice ficaram de fora.' % fora
        nota += nota_de_outra_materia([e], disciplina_id, ids_validos)
        saida.update(mapa=[e], mapa_origem='mapa', mapa_nota=nota)
        return saida

    # 2. o mapa de capitulos da orquestradora (PDF: as paginas do arquivo)
    if do_mapa is not None and formato == 'pdf':
        entradas, fora_pag, fora_id = [], 0, 0
        for cap in do_mapa.get('capitulos') or []:
            try:
                ini = int(cap.get('pag_arquivo_inicio'))
                fim = int(cap.get('pag_arquivo_fim'))
            except (TypeError, ValueError):
                fora_pag += 1
                continue
            t = limpar_texto(cap.get('titulo'))
            if not t or not (1 <= ini <= total):
                fora_pag += 1
                continue
            assuntos, fora = assuntos_do_mapa(cap.get('assuntos'), ids_validos)
            fora_id += fora
            entradas.append({'titulo': t, 'pagina': ini, 'pagina_fim': min(total, max(ini, fim)),
                             'capitulo_do_livro': cap.get('n'), 'assuntos': assuntos, 'origem': 'mapa'})
        entradas.sort(key=lambda e: e['pagina'])
        nota = 'Do mapa de capítulos da orquestradora (%s, livro %s).' % (nome_mapa, do_mapa.get('livro'))
        if fora_pag:
            nota += ' %d capítulo(s) fora das páginas do arquivo ficaram de fora.' % fora_pag
        if fora_id:
            nota += ' %d assunto(s) fora do índice ficaram de fora.' % fora_id
        nota += nota_de_outra_materia(entradas, disciplina_id, ids_validos)
        saida.update(mapa=[dict(n=i + 1, **e) for i, e in enumerate(entradas)], mapa_origem='mapa', mapa_nota=nota)
        return saida

    # 2b. o mapa de capitulos da orquestradora num EPUB (item 12a, parte 0):
    # a parte da espinha e a ancora dentro dela, no lugar das paginas
    if do_mapa is not None and formato == 'epub':
        ancoras = info.get('_ancoras')
        validas, contas = entradas_epub_do_mapa(do_mapa, espinha, ancoras)
        entradas, fora_id = [], 0
        for e in validas:
            assuntos, fora = assuntos_do_mapa(e['cap'].get('assuntos'), ids_validos)
            fora_id += fora
            m = {'titulo': e['titulo'], 'capitulo': e['capitulo'], 'capitulo_fim': e['capitulo_fim']}
            if e.get('ancora'):
                m['ancora'] = e['ancora']
            m.update(capitulo_do_livro=e['capitulo_do_livro'], assuntos=assuntos, origem='mapa')
            entradas.append(m)
        nota = 'Do mapa de capítulos da orquestradora (%s, livro %s), por parte do EPUB e âncora.' % (nome_mapa, do_mapa.get('livro'))
        fora_txt = nota_das_contas(contas)
        if fora_txt:
            nota += ' ' + fora_txt
        if fora_id:
            nota += ' %d assunto(s) fora do índice ficaram de fora.' % fora_id
        nota += nota_de_outra_materia(entradas, disciplina_id, ids_validos)
        saida.update(mapa=[dict(n=i + 1, **e) for i, e in enumerate(entradas)], mapa_origem='mapa', mapa_nota=nota)
        return saida

    # 3. o primeiro passe automatico, pelo sumario
    sumario = info.get('sumario') or []
    if not sumario or not disciplina or not series:
        motivo = ('o livro não tem sumário' if not sumario else
                  'a matéria do livro não está no índice de assuntos' if not disciplina else
                  'não se sabe o ano do livro (nem o mapa nem o segmento dizem)')
        saida.update(mapa=[], mapa_origem='nenhum', mapa_nota='Sem mapa de capítulos: %s.' % motivo)
        return saida
    nivel = nivel_dos_capitulos(sumario)
    caps = [e for e in sumario if e['nivel'] == nivel]
    entradas = []
    for i, e in enumerate(caps):
        p = palpite(e['titulo'], disciplina, series)
        m = {'n': i + 1, 'titulo': e['titulo'], 'assuntos': [p] if p else [], 'origem': 'auto'}
        if formato == 'pdf':
            m.update(pagina=e['pagina'], pagina_fim=e['pagina_fim'])
        else:
            prox = caps[i + 1]['capitulo'] if i + 1 < len(caps) else espinha + 1
            m['capitulo'] = e['capitulo']
            m['capitulo_fim'] = max(e['capitulo'], prox - 1)
            if e.get('ancora'):
                m['ancora'] = e['ancora']
        entradas.append(m)
    achados = sum(1 for m in entradas if m['assuntos'])
    saida.update(mapa=entradas, mapa_origem='auto',
                 mapa_nota='Primeiro passe automático: o título de cada capítulo contra os assuntos do índice '
                           '(%s), só do ano do livro (%s, pelo %s); %d de %d capítulos com assunto, a confirmar na tela.'
                           % (disciplina_id, ', '.join(series), series_origem, achados, len(entradas)))
    return saida


# ------------------------------------------------------------------ o gabarito (C15.5)

# O titulo de uma secao de respostas, numa linha so: "Respostas", "Respostas
# dos exercicios", "Gabarito", "Resolucoes das atividades". Depois da palavra,
# so preposicao: "Resposta pessoal" e "Respostas possiveis", que aparecem no
# meio de qualquer capitulo, nao sao titulo. No SINGULAR ("Resposta",
# "Resolucao", "Solucao"), so com "dos" ou "das": "Resolucao" sozinha, ou
# "Resolucao do problema", e o exercicio resolvido do livro, e nao o gabarito
# (revisao do C15.5).
TITULO_DE_RESPOSTAS = re.compile(r'^(?:(?:respostas|resolucoes|solucoes|gabaritos?)'
                                 r'(?: (?:dos|das|de|do|da|e|para) [a-z0-9 ,/]{0,60})?'
                                 r'|(?:resposta|resolucao|solucao) (?:dos|das) [a-z0-9 ,/]{1,60})$')
# O numero do capitulo dentro das respostas: "Capitulo 2", "Cap. 2", "CAPITULO II".
MARCA_DE_CAPITULO = re.compile(r'^(capitulo|cap\.?) ?([0-9]{1,3}|[ivxlc]{1,7})\b')
MARCA_DE_UNIDADE = re.compile(r'^(unidade) ?([0-9]{1,3}|[ivxlc]{1,7})\b')
# O numero no titulo do capitulo do sumario ou do mapa: "Capitulo 2: Fracoes", "2. Fracoes".
NUMERO_NO_TITULO = re.compile(r'^(?:(?:capitulo|cap\.?) ?([0-9]{1,3}|[ivxlc]{1,7})\b|([0-9]{1,3})[.)] )')
SO_IMPARES = re.compile(r'\bimpar(es)?\b')
NO_MANUAL = re.compile(r'(respostas?|resolucoes|gabarito)[^.]{0,40}\bmanual do professor\b')
# Quantas linhas do alto da pagina valem como titulo (o cabecalho corrido do
# livro, o numero da pagina e o titulo da secao cabem nelas).
LINHAS_DO_ALTO = 6
# A marca de capitulo no ALTO da pagina abre o capitulo ali: a pagina e so
# dele, e nao tambem do anterior. "No alto" e nas primeiras linhas e sem
# nenhuma linha de resposta antes dela (so o cabecalho corrido, o titulo da
# secao e a unidade). Marca no meio da pagina divide a pagina entre os dois.
LINHAS_ATE_A_MARCA = 6
PARECE_RESPOSTA = re.compile(r'^([0-9]{1,3}[.)]|[a-h]\))')


# A parte das linhas de uma secao de respostas que parece resposta ("1. 40",
# "b) 97"). Nas secoes de verdade da amostra real passa de um terco; no quadro
# "RESPOSTAS" do manual do professor, ao lado da pagina do aluno, fica perto de
# um decimo.
DENSIDADE_MINIMA = 0.2
# O TITULO NO FIM DO TEXTO (item 12a): em alguns PDFs o cabeçalho corrido sai
# no fim do texto extraído da página. No Praticando 8 e 9 o título "Respostas
# dos exercícios" é a ÚLTIMA linha da primeira página da seção. Por isso o
# título também vale nas LINHAS_DO_FIM últimas linhas da página do PDF. O
# título achado SÓ ali vale apenas com número de capítulo ou de unidade nas
# respostas (o caso 3a): sem número, o "Respostas" na última linha de um
# sumário (o ca2, página 6, no ensaio) viraria gabarito do fim da entrada.
LINHAS_DO_FIM = 2
# A CONTINUAÇÃO da seção (item 12a): nesses livros o título está só na
# primeira página, e as seguintes são só respostas, sem título. A seção segue
# pelas páginas seguintes enquanto as condições valem: a página tem texto; ela
# fica na mesma entrada do mapa da página do título (ou fora do mapa, como
# ela); e ou essa entrada do mapa tem título de respostas ("Respostas dos
# exercícios": o mapa diz que a faixa inteira é a seção), ou a página é feita
# de respostas (DENSIDADE_DA_CONTINUACAO; nas seções reais do Praticando, a
# maioria das páginas fica entre 60% e 80%, mas há páginas de 20% e de 38%,
# com figura ou fração, e por isso a densidade sozinha não basta quando o mapa
# diz). No fim, a seção estendida tem de trazer respostas de DOIS capítulos ou
# unidades, ou mais, senão fica como estava. Sem essa última condição, um
# quadro de margem seguido de páginas de exercício chegaria ao fim do
# capítulo e viraria "fim do capítulo". Só no PDF: no EPUB a parte inteira já
# é lida.
DENSIDADE_DA_CONTINUACAO = 0.5
# O FIM DO CAPITULO SEM NUMERO (o 3b) exige mais (item 12a): ali nada além do
# título e do lugar diz que é gabarito. O quadro "RESPOSTAS" da margem do
# professor, na última página do capítulo do aluno, tem perto de um quarto das
# linhas com cara de resposta (o ga7, página 401: 24%). As páginas de
# respostas de verdade passam de metade.
DENSIDADE_DO_FIM_DO_CAPITULO = 0.5


def marca_no_alto(ls, k):
    return k < LINHAS_ATE_A_MARCA and not any(PARECE_RESPOSTA.match(l) for l in ls[:k])
CERTEZAS = ('alta', 'média', 'baixa')
ROMANOS = {'i': 1, 'v': 5, 'x': 10, 'l': 50, 'c': 100}


def numero_de(t):
    """'12' ou 'xii' para 12; None se nao for numero."""
    if t is None:
        return None
    t = str(t).strip().lower()
    if t.isdigit():
        return int(t)
    if not t or any(c not in ROMANOS for c in t):
        return None
    total = 0
    for i, c in enumerate(t):
        v = ROMANOS[c]
        total += -v if i + 1 < len(t) and ROMANOS[t[i + 1]] > v else v
    return total or None


def linha_normal(l):
    """A linha como o passe a compara: sem acento, minuscula, espacos simples,
    sem pontuacao nas pontas."""
    t = re.sub(r'\s+', ' ', sem_acento(l)).strip()
    return t.strip(' .:;-_|*')


def linhas_de(texto):
    """As linhas com conteudo, sem as que sao so o numero da pagina."""
    saida = []
    for l in str(texto or '').splitlines():
        n = linha_normal(l)
        if n and not n.isdigit():
            saida.append(n)
    return saida


def numero_do_capitulo(entrada):
    """O numero do capitulo NO LIVRO: o do mapa da orquestradora
    (capitulo_do_livro) ou o que o titulo diz. None quando nenhum dos dois diz."""
    n = entrada.get('capitulo_do_livro')
    if isinstance(n, int) and not isinstance(n, bool):
        return n
    m = NUMERO_NO_TITULO.match(linha_normal(entrada.get('titulo') or ''))
    if m:
        return numero_de(m.group(1) or m.group(2))
    return None


def casar_numero(numero, capitulos):
    """A REGRA de casar o numero das respostas com o capitulo: pelo numero do
    capitulo no livro (o do mapa, ou o do titulo), e so ele. Devolve
    (capitulo, como casou) ou (None, motivo). Quando NENHUM capitulo diz o
    proprio numero, vale a ordem do mapa (o n-esimo capitulo), com certeza
    menor; quando algum diz, a ordem nao vale, porque um volume que comeca no
    capitulo 7 tem o "Capitulo 7" das respostas no PRIMEIRO capitulo do mapa."""
    com_numero = [c for c in capitulos if c.get('numero') is not None]
    if com_numero:
        achados = [c for c in com_numero if c['numero'] == numero]
        if len(achados) == 1:
            return achados[0], 'numero'
        if len(achados) > 1:
            return None, 'dois capítulos do mapa com o número %d' % numero
        return None, 'o mapa não tem o capítulo %d' % numero
    achados = [c for c in capitulos if c['n'] == numero]
    if achados:
        return achados[0], 'ordem'
    return None, 'o mapa não tem o %dº capítulo' % numero


def faixas(unidades):
    """[3, 4, 5, 9] para [[3, 5], [9, 9]]."""
    saida = []
    for u in sorted(set(unidades)):
        if saida and u == saida[-1][1] + 1:
            saida[-1][1] = u
        else:
            saida.append([u, u])
    return saida


def descrever(fs, formato):
    nome = 'página' if formato == 'pdf' else 'parte'
    partes = []
    for a, b in fs:
        partes.append('%s %d' % (nome, a) if a == b else '%ss %d a %d' % (nome, a, b))
    return ', '.join(partes)


def propor_gabaritos(textos, capitulos, formato='pdf'):
    """O passe semiautomatico, sem abrir livro: `textos` e o texto de cada
    unidade (pagina do PDF ou parte do EPUB), a primeira e a unidade 1;
    `capitulos` e a lista de {n, titulo, ini, fim, numero} (o mapa do livro).

    Devolve {'por_capitulo': {n: {'faixas', 'certeza', 'como', 'so_impares'}},
             'secoes': [[a, b]], 'linhas': [linha da planilha], 'nota', 'texto'}.
    `texto` diz quanto do livro tem camada de texto: 'sim', 'parcial' ou 'nao'.
    """
    total = len(textos)
    linhas = [linhas_de(t) for t in textos]
    sem_texto = [i + 1 for i, t in enumerate(textos) if len(re.sub(r'\s+', '', str(t or ''))) < 20]
    nome = 'página' if formato == 'pdf' else 'parte'
    saida = {'por_capitulo': {}, 'secoes': [], 'linhas': [], 'nota': '', 'texto': 'sim'}
    if total == 0 or len(sem_texto) * 2 > total:
        saida['texto'] = 'nao'
        saida['nota'] = ('Sem camada de texto em %d de %d %ss: o passe não tem o que ler (precisa de OCR antes), '
                         'e o livro fica sem gabarito localizado, marcado como menos confiável.' % (len(sem_texto), total, nome))
        saida['linhas'].append({'tipo': 'livro', 'certeza': 'baixa', 'achado': 'sem camada de texto',
                                'observacao': saida['nota']})
        return saida
    if sem_texto:
        saida['texto'] = 'parcial'

    # 1. as unidades com titulo de respostas: no PDF, no alto da pagina (o
    # cabecalho corrido da secao); no EPUB, em qualquer ponto da parte, porque
    # a conversao junta paginas numa parte so
    titulo_em = {}
    for i, ls in enumerate(linhas):
        if formato == 'pdf':
            # no alto da pagina, ou nas ultimas linhas (o cabecalho que sai no fim do texto)
            onde = sorted(set(range(min(LINHAS_DO_ALTO, len(ls)))) | set(range(max(0, len(ls) - LINHAS_DO_FIM), len(ls))))
        else:
            onde = range(len(ls))
        for k in onde:
            if TITULO_DE_RESPOSTAS.match(ls[k]):
                # o terceiro campo diz se o titulo so foi achado nas ultimas linhas
                # (LINHAS_DO_FIM); o quarto e a linha do titulo (para o SO_IMPARES)
                titulo_em[i + 1] = (k / max(1, len(ls)), ls[k], formato == 'pdf' and k >= LINHAS_DO_ALTO, k)
                break
    manual = [i + 1 for i, t in enumerate(textos) if NO_MANUAL.search(' '.join(linhas[i]))]

    def capitulo_de(u):
        for c in capitulos:
            if c['ini'] <= u <= c['fim']:
                return c
        return None

    def densidade_de(u):
        ls = linhas[u - 1]
        return sum(1 for l in ls if PARECE_RESPOSTA.match(l)) / max(1, len(ls))

    def entrada_de_respostas(c):
        # a entrada do mapa cujo titulo E o de uma secao de respostas ("Respostas dos exercicios")
        return bool(c) and TITULO_DE_RESPOSTAS.match(linha_normal(c.get('titulo') or '')) is not None

    def numeros_em(a, b):
        return {numero_de(m.group(2)) for u in range(a, b + 1) for l in linhas[u - 1]
                for m in [MARCA_DE_CAPITULO.match(l) or MARCA_DE_UNIDADE.match(l)] if m and numero_de(m.group(2))}

    # 2. as secoes: unidades seguidas com o titulo, e no PDF a continuacao sem
    # titulo (LINHAS_DO_FIM e DENSIDADE_DA_CONTINUACAO, acima)
    secoes = faixas(titulo_em)
    if formato == 'pdf':
        com_continuacao = set(titulo_em)
        for a, b in secoes:
            cap, fim = capitulo_de(a), b
            de_respostas = entrada_de_respostas(cap)
            while (fim + 1 <= total and fim + 1 not in titulo_em and fim + 1 not in sem_texto
                   and capitulo_de(fim + 1) is cap
                   and (de_respostas or densidade_de(fim + 1) >= DENSIDADE_DA_CONTINUACAO)):
                fim += 1
            if fim > b and len(numeros_em(a, fim)) >= 2:
                com_continuacao.update(range(b + 1, fim + 1))
        secoes = faixas(com_continuacao)
    usadas = set()

    for a, b in secoes:
        # as marcas de capitulo dentro da secao, na ordem: (unidade, numero, no alto)
        def marcas_de(regra):
            achadas = []
            for u in range(a, b + 1):
                ls = linhas[u - 1]
                # no EPUB, a secao pode comecar no meio da parte: o que vem antes do titulo nao e resposta
                k0 = int(round(titulo_em[u][0] * len(ls))) if formato == 'epub' and u == a else 0
                for k in range(k0, len(ls)):
                    m = regra.match(ls[k])
                    if m and numero_de(m.group(2)):
                        achadas.append((u, numero_de(m.group(2)), marca_no_alto(ls[k0:], k - k0)))
            return achadas
        marcas = marcas_de(MARCA_DE_CAPITULO) or marcas_de(MARCA_DE_UNIDADE)
        # a mesma marca repetida em seguida (o cabecalho corrido) e uma so
        limpas = []
        for x in marcas:
            if limpas and limpas[-1][1] == x[1]:
                continue
            limpas.append(x)
        # "Só as ímpares" vale só no TÍTULO da seção, na página em que ela abre:
        # a linha do título e a seguinte ("Respostas" / "dos exercícios ímpares"),
        # esta só se não for resposta. Nas linhas do alto de todas as páginas, uma
        # resposta casava: "e expoente impar tem o mesmo sinal" (mp1, p. 193)
        # marcava os caps. 1 a 5 inteiros, e a p. 182 tem pares e ímpares.
        ls_a, k_titulo = linhas[a - 1], titulo_em[a][3]
        perto_do_titulo = [ls_a[k_titulo]] + [l for l in ls_a[k_titulo + 1:k_titulo + 2] if not PARECE_RESPOSTA.match(l)]
        impares = any(SO_IMPARES.search(l) for l in perto_do_titulo)
        evidencia = '"%s" (%s %d)' % (titulo_em[a][1], nome, a)
        numeros = [x[1] for x in limpas]
        # sem texto perto da secao (dentro dela ou colada nela), pode faltar resposta: a certeza baixa
        perto_sem_texto = any(a - 1 <= u <= b + 1 for u in sem_texto)

        def menos(certeza):
            return CERTEZAS[min(len(CERTEZAS) - 1, CERTEZAS.index(certeza) + 1)] if perto_sem_texto else certeza
        # a secao de respostas e feita de respostas: no manual do professor, o
        # quadro "RESPOSTAS" ao lado da pagina do aluno e prosa
        corpo = [l for u in range(a, b + 1)
                 for l in linhas[u - 1][(int(round(titulo_em[u][0] * len(linhas[u - 1]))) if formato == 'epub' and u == a else 0):]]
        densidade = sum(1 for l in corpo if PARECE_RESPOSTA.match(l)) / max(1, len(corpo))
        if densidade < DENSIDADE_MINIMA:
            saida['linhas'].append({'tipo': 'descartado', 'gabarito': [[a, b]], 'certeza': 'baixa', 'achado': evidencia,
                                    'observacao': 'título de respostas, mas só %d%% das linhas parecem resposta (o mínimo é %d%%): '
                                                  'quadro do manual ou texto corrido; ignorado'
                                                  % (round(densidade * 100), round(DENSIDADE_MINIMA * 100))})
            continue
        if len(limpas) == 1:
            # uma marca so: e o fim de um capitulo (3b), e a marca tem de ser a dele
            cap = capitulo_de(a)
            if cap and cap['numero'] is not None and cap['numero'] != limpas[0][1]:
                saida['linhas'].append({'tipo': 'descartado', 'gabarito': [[a, b]], 'certeza': 'baixa', 'achado': evidencia,
                                        'observacao': 'respostas do capítulo %d dentro do capítulo %d (%s): não fecha; ignorado'
                                                      % (limpas[0][1], cap['numero'], cap['titulo'])})
                continue
            limpas = []
        if limpas and len(set(numeros)) != len(numeros):
            saida['linhas'].append({'tipo': 'descartado', 'gabarito': [[a, b]], 'certeza': 'baixa', 'achado': evidencia,
                                    'observacao': 'a numeração dos capítulos recomeça dentro das respostas (%s): '
                                                  'não dá para casar sem ler; ficou sem gabarito' % ', '.join(map(str, numeros))})
            saida['secoes'].append([a, b])
            continue
        if limpas:
            # 3a. respostas por capitulo (no fim do livro, ou no fim de uma unidade)
            saida['secoes'].append([a, b])
            for j, (u, num, _) in enumerate(limpas):
                if j + 1 < len(limpas):
                    prox_u, _, prox_no_alto = limpas[j + 1]
                    fim = prox_u - 1 if prox_no_alto else prox_u
                else:
                    fim = b
                fim = max(u, fim)
                cap, como = casar_numero(num, capitulos)
                linha = {'tipo': 'capitulo', 'numero_nas_respostas': num, 'gabarito': [[u, fim]], 'achado': evidencia}
                # no EPUB o gabarito vai por parte inteira: parte com as
                # respostas de dois capitulos levaria as do outro junto
                divide = formato == 'epub' and any(u <= x[0] <= fim for x in limpas if x[1] != num)
                if cap is not None and divide:
                    cap, como = None, ('a parte traz as respostas de mais de um capítulo, e no EPUB o gabarito vai '
                                       'por parte inteira')
                if cap is None:
                    linha.update(tipo='nao_fechou', certeza='baixa', observacao='não fechou: %s; ficou sem gabarito' % como)
                    saida['linhas'].append(linha)
                    continue
                certeza = menos('alta' if como == 'numero' else 'média')
                ja = saida['por_capitulo'].get(cap['n'])
                if ja:
                    ja['faixas'] = faixas([x for f in ja['faixas'] for x in range(f[0], f[1] + 1)] + list(range(u, fim + 1)))
                else:
                    saida['por_capitulo'][cap['n']] = {'faixas': [[u, fim]], 'certeza': certeza, 'como': 'fim_do_livro',
                                                       'so_impares': impares}
                usadas.add(cap['n'])
                linha.update(capitulo=cap['n'], titulo=cap['titulo'], certeza=certeza,
                             observacao='casado pelo %s' % ('número do capítulo no livro' if como == 'numero' else
                                                            'lugar na ordem do mapa (o mapa não numera os capítulos)') +
                             ('; só as ímpares' if impares else ''))
                saida['linhas'].append(linha)
            continue
        # 3b. sem numero de capitulo: so vale no FIM de um capitulo, dentro dele
        cap = capitulo_de(a)
        if titulo_em[a][2]:
            # o titulo so nas ultimas linhas, sem numero de capitulo: no fim de
            # um sumario ("... Respostas"), por exemplo. Ele so vale com marcas (3a)
            saida['linhas'].append({'tipo': 'descartado', 'gabarito': [[a, b]], 'certeza': 'baixa', 'achado': evidencia,
                                    'observacao': 'título de respostas só no fim do texto da página, sem número de capítulo '
                                                  'nas respostas: não se sabe de que capítulo são; ignorado'})
            continue
        if cap and capitulo_de(b) is cap and b >= cap['fim'] - 1 and a > cap['ini'] and cap['n'] not in usadas \
                and densidade < DENSIDADE_DO_FIM_DO_CAPITULO:
            saida['linhas'].append({'tipo': 'descartado', 'gabarito': [[a, b]], 'certeza': 'baixa', 'achado': evidencia,
                                    'observacao': 'título de respostas no fim do capítulo %d (%s), sem número, mas só %d%% '
                                                  'das linhas parecem resposta (no fim do capítulo o mínimo é %d%%): quadro '
                                                  'de respostas da margem, na página do capítulo; ignorado'
                                                  % (cap['n'], cap['titulo'], round(densidade * 100),
                                                     round(DENSIDADE_DO_FIM_DO_CAPITULO * 100))})
            continue
        if cap and capitulo_de(b) is cap and b >= cap['fim'] - 1 and a > cap['ini'] and cap['n'] not in usadas:
            certeza = menos('média')
            saida['por_capitulo'][cap['n']] = {'faixas': [[a, b]], 'certeza': certeza, 'como': 'fim_do_capitulo',
                                               'so_impares': impares}
            usadas.add(cap['n'])
            # NAO entra em `secoes`: as secoes saem do capitulo exportado, e a
            # pagina do fim do capitulo continua dele (revisao do C15.5: uma
            # pagina de exercicio resolvido tomada por gabarito sumiria do capitulo)
            saida['linhas'].append({'tipo': 'capitulo', 'capitulo': cap['n'], 'titulo': cap['titulo'], 'gabarito': [[a, b]],
                                    'certeza': certeza, 'achado': evidencia,
                                    'observacao': 'no fim do próprio capítulo, sem número: casado pelo lugar' +
                                                  ('; só as ímpares' if impares else '')})
            continue
        onde = ('no meio do capítulo %d (%s)' % (cap['n'], cap['titulo'])) if cap else 'fora dos capítulos do mapa'
        saida['linhas'].append({'tipo': 'descartado', 'gabarito': [[a, b]], 'certeza': 'baixa', 'achado': evidencia,
                                'observacao': 'título de respostas sem número de capítulo, %s: ignorado '
                                              '(quadro de resposta do manual, ou respostas do livro inteiro)' % onde})

    achados = len(saida['por_capitulo'])
    partes = []
    if not capitulos:
        partes.append('O livro não tem capítulos no mapa: não há a que prender o gabarito.')
    if achados:
        partes.append('Gabarito localizado em %d de %d capítulos, pelo passe semiautomático (a conferir na planilha).'
                      % (achados, len(capitulos)))
    elif secoes:
        partes.append('Há títulos de respostas (%s), mas nenhum fechou com um capítulo.' % descrever(secoes, formato))
    else:
        partes.append('Nenhum título de respostas ou de gabarito no texto do livro.')
    if manual:
        partes.append('O livro diz que respostas estão no Manual do Professor (%s %d).' % (nome, manual[0]))
    if saida['texto'] == 'parcial':
        perto = [u for u in sem_texto if any(a - 1 <= u <= b + 1 for a, b in saida['secoes'])]
        partes.append('%d %s(s) sem camada de texto (%s): o que estiver nelas não foi lido%s.'
                      % (len(sem_texto), nome, ', '.join(map(str, sem_texto[:6])) + (', ...' if len(sem_texto) > 6 else ''),
                         ', e a certeza do gabarito ao lado delas baixou' if perto else ''))
    saida['nota'] = ' '.join(partes)
    return saida


def capitulos_do_mapa(livro):
    """Os capitulos do mapa como o passe os ve: {n, titulo, ini, fim, numero}."""
    saida = []
    for e in livro.get('mapa') or []:
        if e.get('obra_inteira'):
            continue
        ini, fim = (e.get('pagina'), e.get('pagina_fim')) if livro['formato'] == 'pdf' else (e.get('capitulo'), e.get('capitulo_fim'))
        if isinstance(ini, int) and isinstance(fim, int):
            saida.append({'n': e['n'], 'titulo': e['titulo'], 'ini': ini, 'fim': fim, 'numero': numero_do_capitulo(e)})
    return saida


def textos_do_pdf(caminho):
    doc = pymupdf.open(caminho)
    try:
        return [p.get_text() for p in doc]
    finally:
        doc.close()


BLOCO_DE_HTML = re.compile(r'<(?:/?(?:p|div|h[1-6]|li|tr|td|th|br|section|blockquote|dt|dd|table|caption|figcaption))\b[^>]*>', re.I)


def textos_do_epub(caminho, espinha):
    """O texto de cada parte da espinha, uma linha por bloco do HTML."""
    saida = []
    with zipfile.ZipFile(caminho) as z:
        for c in espinha:
            try:
                h = z.read(c).decode('utf-8', 'replace')
            except KeyError:
                saida.append('')
                continue
            h = re.sub(r'(?is)<(script|style|head)\b.*?</\1>', ' ', h)
            h = BLOCO_DE_HTML.sub('\n', h)
            h = re.sub(r'<[^>]+>', ' ', h)
            h = re.sub(r'&nbsp;|&#160;', ' ', h).replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
            saida.append(h)
    return saida


def localizar_gabarito(caminho, livro):
    """Le o texto do livro e grava o gabarito no mapa (a entrada ganha
    `gabarito`) e no livro (`gabarito_origem`, `gabarito_nota`,
    `gabarito_secoes`). Devolve as linhas da planilha de conferencia."""
    formato = livro['formato']
    textos = textos_do_pdf(caminho) if formato == 'pdf' else textos_do_epub(caminho, (livro.get('epub') or {}).get('espinha') or [])
    r = propor_gabaritos(textos, capitulos_do_mapa(livro), formato)
    chave = 'paginas' if formato == 'pdf' else 'partes'
    for e in livro.get('mapa') or []:
        g = r['por_capitulo'].get(e['n'])
        if g:
            e['gabarito'] = {chave: g['faixas'], 'certeza': g['certeza'], 'como': g['como']}
            if g['so_impares']:
                e['gabarito']['so_impares'] = True
    livro['gabarito_origem'] = 'auto' if r['por_capitulo'] else 'nenhum'
    livro['gabarito_nota'] = limpar_texto(r['nota'])
    livro['gabarito_secoes'] = r['secoes']
    livro['gabarito_texto'] = r['texto']
    return r['linhas']


COLUNAS_DA_CONFERENCIA = ['livro', 'formato', 'tipo', 'capitulo', 'titulo do capitulo', 'capitulo no livro',
                          'paginas do capitulo', 'gabarito proposto', 'numero nas respostas', 'certeza', 'achado',
                          'observacao', 'conferido (sim ou nao)', 'comentario']
# As colunas de quem confere: regerar a planilha guarda o que ja foi escrito nelas.
COLUNAS_DE_QUEM_CONFERE = ('conferido (sim ou nao)', 'comentario')


def gravar_conferencia(pasta, livro, linhas):
    """A planilha de conferencia do livro: <pasta>/<id>.csv, uma linha por
    capitulo do mapa e uma por achado que nao fechou. Regerar guarda o que a
    sessao ja escreveu nas duas ultimas colunas (pela chave tipo, capitulo e
    gabarito proposto)."""
    os.makedirs(pasta, exist_ok=True)
    caminho = os.path.join(pasta, livro['id'] + '.csv')
    antes = {}
    if os.path.isfile(caminho):
        with open(caminho, encoding='utf-8-sig', newline='') as f:
            for l in csv.DictReader(f):
                antes[(l.get('tipo'), l.get('capitulo'), l.get('gabarito proposto'))] = l
    formato = livro['formato']
    por_n = {l.get('capitulo'): l for l in linhas if l.get('tipo') == 'capitulo'}
    saida = []
    for e in livro.get('mapa') or []:
        l = por_n.get(e['n'], {})
        g = e.get('gabarito') or {}
        fs = g.get('paginas') or g.get('partes') or []
        saida.append({'tipo': 'capitulo', 'capitulo': e['n'], 'titulo do capitulo': e['titulo'],
                      'capitulo no livro': numero_do_capitulo(e) or '',
                      'paginas do capitulo': descrever([[e.get('pagina') or e.get('capitulo'),
                                                            e.get('pagina_fim') or e.get('capitulo_fim')]], formato),
                      'gabarito proposto': descrever(fs, formato) if fs else 'sem gabarito localizado',
                      'numero nas respostas': l.get('numero_nas_respostas', ''),
                      'certeza': g.get('certeza', ''), 'achado': l.get('achado', ''), 'observacao': l.get('observacao', '')})
    for l in linhas:
        if l.get('tipo') == 'capitulo' and l.get('capitulo') in [e['n'] for e in livro.get('mapa') or []]:
            continue
        saida.append({'tipo': l.get('tipo'), 'capitulo': l.get('capitulo', ''), 'titulo do capitulo': l.get('titulo', ''),
                      'gabarito proposto': descrever(l['gabarito'], formato) if l.get('gabarito') else '',
                      'numero nas respostas': l.get('numero_nas_respostas', ''), 'certeza': l.get('certeza', ''),
                      'achado': l.get('achado', ''), 'observacao': l.get('observacao', '')})
    saida.append({'tipo': 'livro', 'certeza': '', 'observacao': livro.get('gabarito_nota', '')})
    with open(caminho, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=COLUNAS_DA_CONFERENCIA)
        w.writeheader()
        for l in saida:
            l = {k: limpar_texto(v) if isinstance(v, str) else v for k, v in l.items()}
            l.update(livro=livro['titulo'] + (' (%s)' % livro['volume'] if livro.get('volume') else ''), formato=formato.upper())
            velho = antes.get((str(l.get('tipo')), str(l.get('capitulo', '')), str(l.get('gabarito proposto', ''))))
            for k in COLUNAS_DE_QUEM_CONFERE:
                l[k] = (velho or {}).get(k, '')
            w.writerow(l)
    return caminho


# ------------------------------------------------------------------ EPUB

def junta(base, href):
    """Caminho dentro do EPUB, a partir da pasta de quem cita. Devolve (caminho, ancora)."""
    href = str(href or '')
    caminho, _, ancora = href.partition('#')
    caminho = unquote(caminho)
    if caminho:
        caminho = posixpath.normpath(posixpath.join(base, caminho)) if base else posixpath.normpath(caminho)
    return caminho, (ancora or None)


def xml_de(bytes_):
    """XML do EPUB. As entidades do HTML (&nbsp; etc.) quebram o parser de XML,
    e o nav as vezes as traz: troca as mais comuns por numericas e tenta de novo."""
    try:
        return ET.fromstring(bytes_)
    except ET.ParseError:
        t = bytes_.decode('utf-8', 'replace')
        for nome, cod in (('nbsp', 160), ('ndash', 45), ('mdash', 45), ('hellip', 8230), ('copy', 169)):
            t = t.replace('&%s;' % nome, '&#%d;' % cod)
        return ET.fromstring(t.encode('utf-8'))


def entradas_do_nav(raiz, base):
    navs = list(raiz.iter('{%s}nav' % NS['x']))
    toc = [n for n in navs if 'toc' in (n.get('{%s}type' % NS['ops']) or '').split()] or navs[:1]
    saida = []
    if not toc:
        return saida

    def andar(ol, nivel):
        for li in ol.findall('x:li', NS):
            a = li.find('x:a', NS)
            if a is None:
                a = li.find('x:span', NS)
            if a is not None:
                titulo = limpar_texto(''.join(a.itertext()))
                if a.get('href') and titulo:
                    caminho, ancora = junta(base, a.get('href'))
                    saida.append({'nivel': nivel, 'titulo': titulo, 'caminho': caminho, 'ancora': ancora})
            sub = li.find('x:ol', NS)
            if sub is not None:
                andar(sub, nivel + 1)

    ol = toc[0].find('.//x:ol', NS)
    if ol is not None:
        andar(ol, 1)
    return saida


def entradas_do_ncx(raiz, base):
    saida = []

    def andar(pai, nivel):
        for np in pai.findall('ncx:navPoint', NS):
            texto = np.find('ncx:navLabel/ncx:text', NS)
            conteudo = np.find('ncx:content', NS)
            titulo = limpar_texto(texto.text if texto is not None else '')
            if conteudo is not None and conteudo.get('src') and titulo:
                caminho, ancora = junta(base, conteudo.get('src'))
                saida.append({'nivel': nivel, 'titulo': titulo, 'caminho': caminho, 'ancora': ancora})
            andar(np, nivel + 1)

    mapa = raiz.find('ncx:navMap', NS)
    if mapa is not None:
        andar(mapa, 1)
    return saida


# O id de um elemento no HTML de uma parte do EPUB, na ordem do texto: as
# ancoras que o mapa de EPUB pode citar.
ID_NO_HTML = re.compile(r'''\sid\s*=\s*["']([^"']+)["']''')


def ancoras_das_partes(z, espinha):
    """[[ids da parte 1, na ordem do texto], [ids da parte 2], ...]."""
    saida = []
    for c in espinha:
        try:
            h = z.read(c).decode('utf-8', 'replace')
        except KeyError:
            saida.append([])
            continue
        saida.append(ID_NO_HTML.findall(h))
    return saida


def entradas_epub_do_mapa(livro_do_mapa, partes, ancoras):
    """As entradas do mapa de capitulos de um livro EPUB (item 12a, parte 0),
    validadas contra a espinha: [{titulo, capitulo, capitulo_fim, ancora?,
    capitulo_do_livro, cap}], em ordem de parte e, dentro da parte, de ancora
    no texto. `cap` e a entrada crua do mapa (os assuntos).

    Cada entrada precisa de `capitulo` (a posicao na espinha, de 1 a `partes`)
    e `capitulo_fim` (>= capitulo; acima do total fica no total, como a pagina
    no PDF). A `ancora` e opcional, mas, se vier, tem de ser um id da parte
    `capitulo`: ancora que nao esta la denuncia parte trocada, e a entrada sai.
    A entrada que so tem `pag_arquivo_*` e entrada de PDF: sai, contada a parte.
    Devolve (entradas, contas) com contas {'fora': n, 'ancora': n, 'de_pdf': n}."""
    contas = {'fora': 0, 'ancora': 0, 'de_pdf': 0}
    entradas = []
    for cap in livro_do_mapa.get('capitulos') or []:
        if not isinstance(cap, dict):
            contas['fora'] += 1
            continue
        ini, fim = cap.get('capitulo'), cap.get('capitulo_fim')
        if ini is None and fim is None and ('pag_arquivo_inicio' in cap or 'pag_arquivo_fim' in cap):
            contas['de_pdf'] += 1
            continue
        t = limpar_texto(cap.get('titulo'))
        if not t or not inteiro(ini) or not inteiro(fim) or not (1 <= ini <= partes) or fim < ini:
            contas['fora'] += 1
            continue
        e = {'titulo': t, 'capitulo': ini, 'capitulo_fim': min(partes, fim), 'capitulo_do_livro': cap.get('n'), 'cap': cap}
        ancora = cap.get('ancora')
        if ancora is not None:
            ids = ancoras[ini - 1] if ancoras and ini - 1 < len(ancoras) else []
            if not isinstance(ancora, str) or ancora not in ids:
                contas['ancora'] += 1
                continue
            e['ancora'] = ancora
            e['_ordem'] = ids.index(ancora)
        else:
            e['_ordem'] = -1
        entradas.append(e)
    entradas.sort(key=lambda e: (e['capitulo'], e['_ordem']))
    for e in entradas:
        del e['_ordem']
    return entradas, contas


def nota_das_contas(contas):
    """O que ficou de fora do mapa de EPUB, numa frase para a nota."""
    partes = []
    if contas.get('fora'):
        partes.append('%d capítulo(s) do mapa fora da espinha do EPUB (ou sem capitulo e capitulo_fim) ficaram de fora.' % contas['fora'])
    if contas.get('ancora'):
        partes.append('%d capítulo(s) do mapa com âncora que não está na parte indicada ficaram de fora.' % contas['ancora'])
    if contas.get('de_pdf'):
        partes.append('%d capítulo(s) do mapa com páginas de PDF (pag_arquivo_*) num EPUB ficaram de fora.' % contas['de_pdf'])
    return ' '.join(partes)


def sumario_epub_do_mapa(entradas):
    saida = []
    for i, e in enumerate(entradas):
        s = {'n': i + 1, 'nivel': 1, 'titulo': e['titulo'], 'capitulo': e['capitulo']}
        if e.get('ancora'):
            s['ancora'] = e['ancora']
        if e.get('capitulo_do_livro') is not None:
            s['capitulo_do_livro'] = e['capitulo_do_livro']
        saida.append(s)
    return saida


def ler_epub(caminho, mapas=None):
    """O sumario, a espinha e, quando ha mapa de capitulos deste EPUB, as
    ancoras de cada parte (em `_ancoras`, que nao vai para o manifest).

    O SUMARIO DO MAPA (item 12a, parte 0): sem sumario de navegacao (ou com o
    de uma entrada so), o sumario sai do mapa de capitulos da orquestradora,
    por parte e ancora; com `"sumario": "mapa"` no livro do mapa, o mapa vence
    o sumario do proprio EPUB. Mapa que nao da entrada nenhuma dentro da
    espinha nao muda nada, e a nota diz."""
    try:
        z = zipfile.ZipFile(caminho)
    except (zipfile.BadZipFile, OSError) as e:
        raise Recusa('o EPUB não abre (%s)' % str(e)[:120])
    with z:
        nomes = set(z.namelist())
        if 'META-INF/encryption.xml' in nomes:
            enc = xml_de(z.read('META-INF/encryption.xml'))
            algs = [m.get('Algorithm') for m in enc.iter('{%s}EncryptionMethod' % NS['enc'])]
            if any(a not in OFUSCACAO_DE_FONTE for a in algs):
                raise Recusa('o EPUB é protegido (DRM), e o leitor do aplicativo não o abre')
        if 'META-INF/container.xml' not in nomes:
            raise Recusa('o EPUB não tem o META-INF/container.xml')
        try:
            rf = xml_de(z.read('META-INF/container.xml')).find('.//c:rootfile', NS)
            opf_caminho = rf.get('full-path') if rf is not None else None
            if not opf_caminho or opf_caminho not in nomes:
                raise Recusa('o EPUB não aponta o arquivo de pacote (OPF)')
            opf = xml_de(z.read(opf_caminho))
        except ET.ParseError as e:
            raise Recusa('o EPUB tem XML que não se lê (%s)' % str(e)[:120])
        base = posixpath.dirname(opf_caminho)
        itens = {}
        for it in opf.findall('opf:manifest/opf:item', NS):
            itens[it.get('id')] = {'caminho': junta(base, it.get('href'))[0], 'tipo': it.get('media-type') or '',
                                  'props': (it.get('properties') or '').split()}
        espinha_el = opf.find('opf:spine', NS)
        if espinha_el is None:
            raise Recusa('o EPUB não tem espinha (spine)')
        espinha = []
        for r in espinha_el.findall('opf:itemref', NS):
            it = itens.get(r.get('idref'))
            if not it:
                raise Recusa('a espinha do EPUB cita um item que não existe (%s)' % r.get('idref'))
            if it['caminho'] not in nomes:
                raise Recusa('o EPUB cita um capítulo que não está no arquivo (%s)' % it['caminho'])
            if it['caminho'] not in espinha:
                espinha.append(it['caminho'])
        if not espinha:
            raise Recusa('o EPUB não tem capítulo nenhum na espinha')
        entradas, origem = [], 'nenhum'
        nav = next((i for i in itens.values() if 'nav' in i['props'] and i['caminho'] in nomes), None)
        if nav:
            try:
                entradas = entradas_do_nav(xml_de(z.read(nav['caminho'])), posixpath.dirname(nav['caminho']))
                origem = 'navegacao'
            except ET.ParseError:
                entradas = []
        if not entradas:
            ncx = itens.get(espinha_el.get('toc')) or next(
                (i for i in itens.values() if i['tipo'] == 'application/x-dtbncx+xml'), None)
            if ncx and ncx['caminho'] in nomes:
                try:
                    entradas = entradas_do_ncx(xml_de(z.read(ncx['caminho'])), posixpath.dirname(ncx['caminho']))
                    origem = 'ncx'
                except ET.ParseError:
                    entradas = []
        achado = (mapas or {}).get(chave_de_arquivo(caminho))
        do_mapa = achado[1] if achado and isinstance(achado[1].get('capitulos'), list) else None
        ancoras = ancoras_das_partes(z, espinha) if do_mapa is not None else None
    info = sumario_do_epub(entradas, origem, espinha)
    if ancoras is not None:
        info['_ancoras'] = ancoras
    if do_mapa is None:
        return info
    nome_mapa = achado[0]
    do, contas = entradas_epub_do_mapa(do_mapa, len(espinha), ancoras)
    pedido = do_mapa.get('sumario')
    de_onde = '(%s, livro %s)' % (nome_mapa, do_mapa.get('livro'))
    fora = nota_das_contas(contas)
    if pedido is not None and pedido != SUMARIO_DO_MAPA:
        aviso = ' O campo "sumario" do mapa tem um valor que o gerador não conhece (%s) e foi ignorado.' % limpar_texto(pedido)[:40]
        info['sumario_nota'] = (info.get('sumario_nota', '') + aviso).strip()
        pedido = None
    if pedido == SUMARIO_DO_MAPA or not info['sumario']:
        if do:
            antes = len(info['sumario'])
            nota = ('O sumário veio do mapa da orquestradora %s, por parte e âncora, e não das %d entradas do '
                    'sumário do EPUB: o mapa pede "sumario": "mapa".' % (de_onde, antes) if antes else
                    'O EPUB não tem sumário que leve aos capítulos: o sumário veio do mapa da orquestradora %s, '
                    'por parte e âncora.' % de_onde)
            info.update(sumario=sumario_epub_do_mapa(do), sumario_origem='mapa',
                        sumario_nota=(nota + (' ' + fora if fora else '')).strip())
        elif pedido == SUMARIO_DO_MAPA:
            info['sumario_nota'] = (info.get('sumario_nota', '') + ' O mapa pede "sumario": "mapa", mas não tem '
                                    'capítulo dentro da espinha do EPUB: valeu o sumário do EPUB.').strip()
    return info


def sumario_do_epub(entradas, origem, espinha):
    """O sumario do proprio EPUB (nav ou NCX), contra a espinha."""
    sumario, fora = [], 0
    for e in entradas:
        if e['caminho'] not in espinha:
            fora += 1    # aponta para fora da espinha (pagina de credito solta, por exemplo)
            continue
        item = {'n': len(sumario) + 1, 'nivel': e['nivel'], 'titulo': e['titulo'],
                'capitulo': espinha.index(e['caminho']) + 1}
        if e['ancora']:
            item['ancora'] = e['ancora']
        sumario.append(item)
    info = {'paginas': None, 'capitulos': len(espinha), 'epub': {'espinha': espinha}, 'sumario': sumario}
    # Uma entrada so nao e sumario: e o "Start" (ou o "Blank Page") que o
    # calibre poe quando converte um PDF, e dez dos onze Fundamentos da
    # planilha sao assim. Vira sumario vazio, dito na nota, em vez de um botao
    # que leva a uma pagina so.
    if len(sumario) == 1 and len(espinha) > 1:
        info.update(sumario=[], sumario_origem='nenhum',
                    sumario_nota='O sumário do EPUB tem uma entrada só ("%s"), que não leva aos capítulos: '
                                 'o sumário está vazio.' % sumario[0]['titulo'])
        return info
    if sumario:
        info['sumario_origem'] = origem
        if fora:
            info['sumario_nota'] = '%d entrada(s) do sumário apontam para fora dos capítulos e ficaram de fora.' % fora
    else:
        info['sumario_origem'] = 'nenhum'
        info['sumario_nota'] = 'O EPUB não tem sumário de navegação: o sumário está vazio.'
    return info


# ------------------------------------------------------------------ o pacote

def ano_de(texto):
    t = str(texto or '').strip()
    return int(t) if re.fullmatch(r'\d{4}', t) else (t or None)


def gravar_zip(manifest_b, arquivos, caminho_zip):
    """Zip deterministico: manifest.json primeiro (deflate), depois os livros em
    ordem de nome, "stored" e copiados do disco aos pedacos (nada inteiro na memoria)."""
    os.makedirs(os.path.dirname(os.path.abspath(caminho_zip)), exist_ok=True)
    tmp = caminho_zip + '.tmp'
    with zipfile.ZipFile(tmp, 'w') as z:
        zi = zipfile.ZipInfo('manifest.json', date_time=(1980, 1, 1, 0, 0, 0))
        zi.compress_type = zipfile.ZIP_DEFLATED
        zi.external_attr = 0o644 << 16
        zi.create_system = 0
        z.writestr(zi, manifest_b, compresslevel=9)
        for nome, origem in sorted(arquivos.items()):
            zi = zipfile.ZipInfo(nome, date_time=(1980, 1, 1, 0, 0, 0))
            zi.compress_type = zipfile.ZIP_STORED
            zi.external_attr = 0o644 << 16
            zi.create_system = 0
            zi.file_size = os.path.getsize(origem)
            with open(origem, 'rb') as src, z.open(zi, 'w') as dst:
                shutil.copyfileobj(src, dst, 1024 * 1024)
    os.replace(tmp, caminho_zip)
    return caminho_zip


def tabela_md(cabecalho, linhas):
    def cel(v):
        return str(v if v is not None else '').replace('|', '/').replace('\n', ' ')
    saida = ['| ' + ' | '.join(cabecalho) + ' |', '|' + '---|' * len(cabecalho)]
    saida += ['| ' + ' | '.join(cel(c) for c in l) + ' |' for l in linhas]
    return '\n'.join(saida)


def relatorio_md(manifest, rel):
    c = manifest['contagens']
    partes = ['# Pacote %s, versão %d' % (manifest['pacote'], manifest['versao']), '',
              'Gerado de %s%s.' % (manifest['fonte']['planilha'],
                                   ' (matéria: %s)' % manifest['materia'] if manifest.get('materia') else ''), '',
              '- Livros no pacote: %d (%d PDF, %d EPUB), %s MB.' % (c['livros'], c['pdf'], c['epub'], mb(c['bytes'])),
              '- Recusados pelo teto de %d MB por livro: %d (item E7).' % (TETO_MB, c['recusados_teto']),
              '- Recusados por outro motivo: %d.' % (c['recusados'] - c['recusados_teto']),
              '- Linhas sem arquivo na planilha: %d.' % c['sem_arquivo'], '']
    partes += ['## No pacote', '', tabela_md(
        ['Livro', 'Formato', 'MB', 'Sumário', 'Mapa', 'Gabarito'],
        [[l['titulo'] + (' (%s)' % l['volume'] if l.get('volume') else ''), l['formato'].upper(), mb(l['bytes']),
          '%d entradas (%s)' % (len(l['sumario']), l['sumario_origem']),
          '%d de %d capítulos com assunto (%s)' % (sum(1 for e in l.get('mapa') or [] if e['assuntos']),
                                                    len(l.get('mapa') or []), l.get('mapa_origem')),
          '%d de %d capítulos' % (sum(1 for e in l.get('mapa') or [] if e.get('gabarito')), len(l.get('mapa') or []))
          if l.get('gabarito_origem') == 'auto' else 'sem gabarito localizado']
         for l in manifest['livros']]), '']
    teto = [r for r in rel['recusados'] if r.get('teto')]
    outros = [r for r in rel['recusados'] if not r.get('teto')]
    partes += ['## Recusados pelo teto de %d MB (item E7)' % TETO_MB, '']
    partes += [tabela_md(['Linha', 'Livro', 'Arquivo', 'MB'],
                         [[r['linha'], r['titulo'], r['arquivo'], mb(r['bytes'])] for r in teto]) if teto else 'Nenhum.', '']
    partes += ['## Recusados por outro motivo', '']
    partes += [tabela_md(['Linha', 'Livro', 'Arquivo', 'Motivo'],
                         [[r['linha'], r['titulo'], r['arquivo'], r['motivo']] for r in outros]) if outros else 'Nenhum.', '']
    partes += ['## Sem arquivo na planilha', '']
    partes += [tabela_md(['Linha', 'Livro'], [[r['linha'], r['titulo']] for r in rel['sem_arquivo']])
               if rel['sem_arquivo'] else 'Nenhuma.', '']
    return '\n'.join(partes)


def gerar(planilha, rotulo, versao, saida, pasta_livros=None, materia=None, mapas=None, trabalho=None,
          gerado_em=None, commit=None, gravar=True, topicos=None, conferencia=None, origem=None):
    """Gera o pacote livros-<rotulo>. Devolve (manifest, relatorio, pasta de trabalho).

    `conferencia`: a pasta das planilhas de conferencia do gabarito (C15.5),
    uma por livro; sem ela, <trabalho>/gabaritos.

    `origem`: um dicionário que, se vier, recebe {id: caminho do arquivo na
    planilha} (o publicador do catálogo o usa; não entra no manifest)."""
    t0 = time.time()
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]*', rotulo or ''):
        raise SystemExit('erro: --rotulo tem de ser minusculo, sem acento nem espaco (por exemplo matematica-6ano)')
    nome = 'livros-%s' % rotulo
    base = pasta_livros or os.path.dirname(os.path.abspath(planilha))
    trabalho = trabalho or os.path.join(os.path.dirname(os.path.abspath(saida)), 'trabalho', '%s-v%d' % (nome, versao))
    por_mapa = ler_mapas(mapas)
    catalogo = ler_catalogo(topicos)
    livros, arquivos, recusados, sem_arquivo, ids, conferencias = [], {}, [], [], set(), []
    for i, l in enumerate(ler_planilha(planilha), start=2):   # linha 1 e o cabecalho
        if materia and (l.get('materia_id') or '').strip() != materia:
            continue
        titulo = limpar_texto(l.get('Título'))
        arq = (l.get('Arquivo') or '').strip()
        if not arq:
            sem_arquivo.append({'linha': i, 'titulo': titulo})
            continue
        caminho = os.path.join(base, *arq.replace('\\', '/').split('/'))
        rec = {'linha': i, 'titulo': titulo, 'arquivo': arq, 'bytes': None, 'teto': False}
        formato = FORMATOS.get(os.path.splitext(arq)[1].lower())
        if not os.path.isfile(caminho):
            recusados.append(dict(rec, motivo='o arquivo não está na pasta dos livros'))
            continue
        tam = os.path.getsize(caminho)
        rec['bytes'] = tam
        if not formato:
            recusados.append(dict(rec, motivo='formato que o aplicativo não lê (só PDF e EPUB)'))
            continue
        m = motivo_do_teto(tam)
        if m:
            recusados.append(dict(rec, motivo=m, teto=True))
            continue
        # item 12a, parte 0: o mapa que diz outro formato (um mapa de PDF com o
        # nome de um EPUB, ou o contrario) nao vale para este arquivo
        achado, aviso_formato = mapa_do_formato(por_mapa.get(chave_de_arquivo(caminho)), formato)
        mapas_do_livro = {chave_de_arquivo(caminho): achado} if achado else {}
        try:
            info = ler_pdf(caminho, mapas_do_livro) if formato == 'pdf' else ler_epub(caminho, mapas_do_livro)
        except Recusa as e:
            recusados.append(dict(rec, motivo=str(e)))
            continue
        lid = slug(os.path.splitext(os.path.basename(arq))[0])
        k = 2
        while lid in ids:
            lid = '%s-%d' % (slug(os.path.splitext(os.path.basename(arq))[0])[:76], k)
            k += 1
        ids.add(lid)
        if origem is not None:
            origem[lid] = arq   # o publicador do catálogo casa a classificação pelo caminho, fora do manifest
        no_zip = 'livros/%s.%s' % (lid, formato)
        h = sha_do_arquivo(caminho)
        livro = {
            'id': lid, 'arquivo': no_zip, 'formato': formato,
            'titulo': titulo, 'volume': limpar_texto(l.get('Volume')) or None,
            'autoria': limpar_texto(l.get('Autoria')) or None, 'editora': limpar_texto(l.get('Editora')) or None,
            'edicao': limpar_texto(l.get('Edição')) or None, 'ano': ano_de(l.get('Ano')),
            'isbn': limpar_texto(l.get('ISBN')) or None, 'segmento': limpar_texto(l.get('Segmento')) or None,
            'materia': (l.get('materia_id') or '').strip() or None, 'materia_nome': limpar_texto(l.get('Matéria')) or None,
            'bytes': tam, 'hash': h, 'paginas': info['paginas'],
            'sumario': info['sumario'], 'sumario_origem': info['sumario_origem'],
        }
        if info.get('sumario_nota'):
            livro['sumario_nota'] = info['sumario_nota']
        if formato == 'epub':
            livro['capitulos'] = info['capitulos']
            livro['epub'] = info['epub']
        livro.update(montar_mapa(livro, info, achado, catalogo))
        if aviso_formato:
            livro['mapa_nota'] = (aviso_formato + ' ' + livro.get('mapa_nota', '')).strip()
        if formato == 'pdf':
            # item 12a: a numeracao impressa (rotulos do PDF, ou o mapa)
            livro.update(ler_numeracao(caminho, achado))
        # C15.5: o gabarito de cada capitulo, e a planilha de conferencia do livro
        try:
            linhas_conf = localizar_gabarito(caminho, livro)
        except Exception as e:  # noqa: BLE001 (o texto que nao se le nao recusa o livro: fica dito)
            for x in livro.get('mapa') or []:
                x.pop('gabarito', None)
            livro.update(gabarito_origem='nenhum', gabarito_secoes=[], gabarito_texto='nao',
                         gabarito_nota=limpar_texto('Não consegui ler o texto do livro para achar o gabarito (%s).' % str(e)[:120]))
            linhas_conf = [{'tipo': 'livro', 'certeza': 'baixa', 'observacao': livro['gabarito_nota']}]
        conferencias.append(gravar_conferencia(conferencia or os.path.join(trabalho, 'gabaritos'), livro, linhas_conf))
        livros.append(livro)
        arquivos[no_zip] = caminho
    livros.sort(key=lambda x: x['id'])
    total = sum(x['bytes'] for x in livros)
    recusa_do_pacote = motivo_do_pacote(total)
    if recusa_do_pacote:
        raise SystemExit(recusa_do_pacote)
    contagens = {'livros': len(livros), 'pdf': sum(1 for x in livros if x['formato'] == 'pdf'),
                 'epub': sum(1 for x in livros if x['formato'] == 'epub'), 'bytes': total,
                 'recusados': len(recusados), 'recusados_teto': sum(1 for r in recusados if r['teto']),
                 'sem_arquivo': len(sem_arquivo)}
    manifest = {
        'esquema': 1, 'pacote': nome, 'versao': versao,
        'gerado_em': gerado_em or datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-3))).replace(microsecond=0).isoformat(),
        'gerador': {'nome': 'biblioteca/gerar_pacote.py --fonte livros', 'commit': commit or gerar_pacote.commit_do_gerador(),
                    'pymupdf': pymupdf.VersionBind},
        'conteudo': 'livros', 'materia': materia or None,
        'fonte': {'id': 'livros-planilha', 'nome': 'Livros de referência da professora',
                  'planilha': os.path.basename(planilha),
                  'licenca': 'livros de uso pessoal da professora: ficam só no tablet, fora do repositório, '
                             'da cópia de segurança e da nuvem'},
        'teto_mb_por_livro': TETO_MB, 'teto_mb_por_pacote': TETO_DO_PACOTE_MB,
        'contagens': contagens,
        'livros': livros,
        'arquivos': {k: next(x['hash'] for x in livros if x['arquivo'] == k) for k in sorted(arquivos)},
    }
    manifest_b = (json.dumps(manifest, ensure_ascii=False, indent=1) + '\n').encode('utf-8')
    zip_caminho = os.path.join(saida, '%s-v%d.zip' % (nome, versao))
    if gravar:
        gravar_zip(manifest_b, arquivos, zip_caminho)
    rel = {'pacote': nome, 'versao': versao, 'planilha': os.path.abspath(planilha), 'contagens': contagens,
           'recusados': recusados, 'sem_arquivo': sem_arquivo,
           'zip': {'caminho': zip_caminho if gravar else None,
                   'bytes': os.path.getsize(zip_caminho) if gravar else None},
           'hash_manifest': gerar_pacote.sha(manifest_b), 'segundos': round(time.time() - t0, 1),
           'conferencias': conferencias}
    os.makedirs(trabalho, exist_ok=True)
    with open(os.path.join(trabalho, 'manifest.json'), 'wb') as f:
        f.write(manifest_b)
    with open(os.path.join(trabalho, 'relatorio.json'), 'w', encoding='utf-8', newline='') as f:
        f.write(json.dumps(rel, ensure_ascii=False, indent=1) + '\n')
    with open(os.path.join(trabalho, 'relatorio.md'), 'w', encoding='utf-8', newline='') as f:
        f.write(relatorio_md(manifest, rel) + '\n')
    return manifest, rel, trabalho
