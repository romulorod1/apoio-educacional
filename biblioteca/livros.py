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
  - EPUB: o sumario de navegacao do EPUB 3 (nav) ou, na falta dele, o NCX do
    EPUB 2. No EPUB nao ha pagina: cada entrada aponta o capitulo, que e a
    posicao do arquivo na espinha (spine), e a ancora dentro dele.

O PACOTE segue o contrato dos pacotes (CONTRATO_pacote_biblioteca.md, secao
8j): um zip com manifest.json e livros/<id>.<pdf|epub>, nomes ASCII, o
manifest com a lista de livros (titulo, autoria, editora, edicao, ano,
segmento, sumario e hash) e o hash de cada arquivo em `arquivos`. Os livros
vao "stored" (sem compressao): PDF e EPUB ja sao comprimidos, e assim o
tablet le cada livro direto do zip, sem inflar.

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
        if sumario:
            info.update(sumario=sumario, sumario_origem='marcadores')
            if fora:
                info['sumario_nota'] = '%d marcador(es) sem página de destino ficaram fora do sumário.' % fora
            return info
        achado = mapas.get(chave_de_arquivo(caminho))
        if achado:
            nome_mapa, livro = achado
            sumario, fora = sumario_do_mapa(livro, total)
            if sumario:
                info.update(sumario=sumario, sumario_origem='mapa',
                            sumario_nota='O PDF não tem marcadores: o sumário veio do mapa da orquestradora (%s, '
                                         'livro %s), com as páginas do arquivo.' % (nome_mapa, livro.get('livro')))
                if fora:
                    info['sumario_nota'] += ' %d capítulo(s) do mapa fora das páginas do arquivo ficaram de fora.' % fora
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


def assuntos_do_mapa(lista, ids_validos):
    """Os assuntos de uma entrada do mapa da orquestradora, so com id do indice. Devolve (assuntos, fora)."""
    saida, fora = [], 0
    for a in lista or []:
        aid = a.get('id') if isinstance(a, dict) else None
        if aid not in ids_validos:
            fora += 1
            continue
        if any(x['id'] == aid for x in saida):
            continue
        item = {'id': aid, 'confianca': CONFIANCAS.get(str(a.get('confianca') or '').lower(), 'alta')}
        if a.get('serie_vizinha'):
            item['serie_vizinha'] = True
        saida.append(item)
    return saida, fora


def montar_mapa(livro, info, achado, catalogo):
    """O mapa do livro (lista), a origem, o ano e a nota. Nao abre o livro:
    trabalha so com o sumario, as paginas e o mapa da orquestradora."""
    formato = livro['formato']
    nome_mapa, do_mapa = achado if achado else (None, None)
    disciplina_id = DISCIPLINA_DA_MATERIA.get(livro.get('materia'), livro.get('materia'))
    disciplina = catalogo.get(disciplina_id)
    ids_validos = {a['id'] for d in catalogo.values() for a in d['assuntos']}
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
# dos exercicios", "Gabarito", "Resolucoes das atividades". A preposicao e
# obrigatoria depois da palavra: "Resposta pessoal" e "Respostas possiveis",
# que aparecem no meio de qualquer capitulo, nao sao titulo.
TITULO_DE_RESPOSTAS = re.compile(r'^(respostas?|gabaritos?|resolucoes|resolucao|solucoes)'
                                 r'( (dos|das|de|do|da|e|para) [a-z0-9 ,/]{0,60})?$')
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
        alvo = ls[:LINHAS_DO_ALTO] if formato == 'pdf' else ls
        for k, l in enumerate(alvo):
            if TITULO_DE_RESPOSTAS.match(l):
                titulo_em[i + 1] = (k / max(1, len(ls)), l)
                break
    manual = [i + 1 for i, t in enumerate(textos) if NO_MANUAL.search(' '.join(linhas[i]))]

    # 2. as secoes: unidades seguidas com o titulo
    secoes = faixas(titulo_em)
    usadas = set()

    def capitulo_de(u):
        for c in capitulos:
            if c['ini'] <= u <= c['fim']:
                return c
        return None

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
        impares = any(SO_IMPARES.search(l) for u in range(a, b + 1) for l in linhas[u - 1][:LINHAS_DO_ALTO + 2])
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
        if cap and capitulo_de(b) is cap and b >= cap['fim'] - 1 and a > cap['ini'] and cap['n'] not in usadas:
            certeza = menos('média')
            saida['por_capitulo'][cap['n']] = {'faixas': [[a, b]], 'certeza': certeza, 'como': 'fim_do_capitulo',
                                               'so_impares': impares}
            usadas.add(cap['n'])
            saida['secoes'].append([a, b])
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


def ler_epub(caminho):
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
          gerado_em=None, commit=None, gravar=True, topicos=None, conferencia=None):
    """Gera o pacote livros-<rotulo>. Devolve (manifest, relatorio, pasta de trabalho).

    `conferencia`: a pasta das planilhas de conferencia do gabarito (C15.5),
    uma por livro; sem ela, <trabalho>/gabaritos."""
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
        try:
            info = ler_pdf(caminho, por_mapa) if formato == 'pdf' else ler_epub(caminho)
        except Recusa as e:
            recusados.append(dict(rec, motivo=str(e)))
            continue
        lid = slug(os.path.splitext(os.path.basename(arq))[0])
        k = 2
        while lid in ids:
            lid = '%s-%d' % (slug(os.path.splitext(os.path.basename(arq))[0])[:76], k)
            k += 1
        ids.add(lid)
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
        livro.update(montar_mapa(livro, info, por_mapa.get(chave_de_arquivo(caminho)), catalogo))
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
