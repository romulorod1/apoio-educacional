"""Tipo de fonte livros (item C15.1): o pacote de livros de referencia, a partir da planilha.

    python biblioteca/gerar_pacote.py --fonte livros --planilha <Livros/Livros_por_Materia_Nathalia.csv>
        --rotulo matematica --versao 1 --saida <pasta dos pacotes>
        [--materia matematica] [--pdfs <pasta Livros>] [--mapas <Livros/mapa>]
        [--trabalho <pasta>] [--gerado-em 2026-10-30T10:00:00-03:00] [--commit abc1234]

Le a planilha (uma linha por livro) e aceita os arquivos da coluna "Arquivo",
que e relativa a pasta da planilha (ou a --pdfs). Linha sem arquivo e livro
que a professora ainda nao tem: fica no relatorio como "sem arquivo", e nao e
recusa.

O TETO: 40 MB por livro. Acima disso o livro nao entra, e o relatorio o lista
para o dono trocar por uma versao mais leve (item E7 do livro de execucao). O
teto e conferido pelo tamanho no disco ANTES de abrir o arquivo: um PDF de 120
MB nao chega a ser lido, e a maquina tem pouca memoria. E 300 MB por pacote
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

TETO_MB = 40
TETO_BYTES = TETO_MB * 1024 * 1024
# O TETO POR PACOTE: 300 MB, e a recomendacao e um pacote por materia (--materia).
# Desde a revisao do C15.1 o app le o pacote de livros livro a livro, direto do
# arquivo, e a memoria do tablet nao depende mais do tamanho do pacote (o pico
# e perto de um livro, ate 40 MB). O que ainda cresce com o pacote: o espaco
# no tablet, que no dia da importacao guarda o zip baixado do Drive E a copia
# no banco (duas vezes o pacote); a gravacao, que e UMA transacao (tudo ou
# nada), mais longa quanto maior o pacote; e o download pelo Drive. 300 MB sao
# sete livros no teto ou dezenas dos comuns (a matematica inteira da planilha
# tem 9,8 MB), e cabem com folga num tablet com 2 GB livres. Acima disso o
# gerador recusa e manda separar por materia, em vez de fazer um pacote que
# so falha no tablet.
TETO_DO_PACOTE_MB = 300
TETO_DO_PACOTE = TETO_DO_PACOTE_MB * 1024 * 1024


def motivo_do_pacote(total):
    """None se o pacote cabe no teto de 300 MB; senao, a frase da recusa."""
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
    """None se o livro cabe no teto de 40 MB; senao, a frase do relatorio."""
    if n > TETO_BYTES:
        return ('tem %s MB, acima do teto de %d MB por livro: trocar por uma versão mais leve (item E7)'
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
    """{nome do arquivo do livro: (nome do mapa, livro do mapa)}, de todo mapa_*.json da pasta."""
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
        if not isinstance(dados, list):
            continue
        for livro in dados:
            if isinstance(livro, dict) and livro.get('arquivo') and isinstance(livro.get('capitulos'), list):
                por_arquivo.setdefault(chave_de_arquivo(livro['arquivo']), (nome, livro))
    return por_arquivo


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
              '- Recusados pelo teto de %d MB: %d (trocar por versão mais leve, item E7).' % (TETO_MB, c['recusados_teto']),
              '- Recusados por outro motivo: %d.' % (c['recusados'] - c['recusados_teto']),
              '- Linhas sem arquivo na planilha: %d.' % c['sem_arquivo'], '']
    partes += ['## No pacote', '', tabela_md(
        ['Livro', 'Formato', 'MB', 'Sumário'],
        [[l['titulo'] + (' (%s)' % l['volume'] if l.get('volume') else ''), l['formato'].upper(), mb(l['bytes']),
          '%d entradas (%s)' % (len(l['sumario']), l['sumario_origem'])] for l in manifest['livros']]), '']
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
          gerado_em=None, commit=None, gravar=True):
    """Gera o pacote livros-<rotulo>. Devolve (manifest, relatorio, pasta de trabalho)."""
    t0 = time.time()
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]*', rotulo or ''):
        raise SystemExit('erro: --rotulo tem de ser minusculo, sem acento nem espaco (por exemplo matematica-6ano)')
    nome = 'livros-%s' % rotulo
    base = pasta_livros or os.path.dirname(os.path.abspath(planilha))
    trabalho = trabalho or os.path.join(os.path.dirname(os.path.abspath(saida)), 'trabalho', '%s-v%d' % (nome, versao))
    por_mapa = ler_mapas(mapas)
    livros, arquivos, recusados, sem_arquivo, ids = [], {}, [], [], set()
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
           'hash_manifest': gerar_pacote.sha(manifest_b), 'segundos': round(time.time() - t0, 1)}
    os.makedirs(trabalho, exist_ok=True)
    with open(os.path.join(trabalho, 'manifest.json'), 'wb') as f:
        f.write(manifest_b)
    with open(os.path.join(trabalho, 'relatorio.json'), 'w', encoding='utf-8', newline='') as f:
        f.write(json.dumps(rel, ensure_ascii=False, indent=1) + '\n')
    with open(os.path.join(trabalho, 'relatorio.md'), 'w', encoding='utf-8', newline='') as f:
        f.write(relatorio_md(manifest, rel) + '\n')
    return manifest, rel, trabalho
