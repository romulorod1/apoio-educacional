"""Faz livros sinteticos (PDF e EPUB) e a planilha deles, para a prova do tipo de fonte livros.

    python biblioteca/_amostra/fazer_amostra_livros.py <pasta> [--grande]
        so os livros, a planilha e o mapa, em <pasta>/Livros

    python biblioteca/_amostra/fazer_amostra_livros.py <pasta> --pacote
        e tambem o pacote livros-prova-v1.zip, em <pasta>/pacotes (o teste de
        navegador _teste/testa_livros.js chama assim e le o caminho do zip na
        ultima linha da saida)

    python biblioteca/_amostra/fazer_amostra_livros.py <pasta> --varios
        dez livros de 4 MB e o pacote livros-prova-varios-v1.zip (40 MB), para
        a prova de memoria do testa_livros.js

Conteudo proprio, escrito aqui: nenhum livro comercial entra no repositorio
nem no portao (C15.1, item 5). Texto conhecido, para a prova e o teste saberem
o que procurar:

- matematica/livro-com-marcadores.pdf: seis paginas, tres capitulos com
  marcadores (paginas 1, 3 e 5). Cada capitulo tem um retangulo de uma cor so
  (vermelho, azul, verde), que e o que o teste de navegador procura no canvas
  para saber que caiu no capitulo certo; e, na ultima pagina, uma figura de
  ruido de 1,2 MB, para o livro ter peso.
- matematica/livro-sem-marcadores.pdf: quatro paginas, sem marcador; o mapa
  (mapa/mapa_capitulos_prova.json) traz dois capitulos, nas paginas 1 e 3.
- matematica/livro-sem-sumario.pdf: duas paginas, sem marcador e sem mapa.
- literatura/livro-de-prova.epub: EPUB 3 com nav e NCX, tres capitulos, uma
  folha de estilo e uma imagem PNG. O capitulo 2 traz, de proposito, um
  <script>, um atributo onerror e um link para fora: o leitor do aplicativo
  nao pode executar nada disso (conteudo de terceiro).
- Na planilha, alem desses: uma linha sem arquivo (livro que ela nao tem), uma
  com arquivo que nao existe e, com --grande, grande/livro-grande.pdf com 41
  MB, acima do teto de 40 MB (recusado antes de ser aberto, e por isso basta
  ser um arquivo do tamanho certo).
"""
import csv
import os
import random
import sys
import zipfile

import pymupdf

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(AQUI))

FIXO = {'creationDate': 'D:20261030000000', 'modDate': 'D:20261030000000', 'producer': 'amostra', 'creator': 'amostra'}
W, H = 595.0, 842.0
CORES = [(0.85, 0.10, 0.10), (0.10, 0.20, 0.85), (0.10, 0.60, 0.20)]
CAPITULOS_PDF = ['Capítulo 1: Números naturais', 'Capítulo 2: Frações', 'Capítulo 3: Geometria plana']
CAPITULOS_EPUB = ['Capítulo 1: O começo', 'Capítulo 2: O meio', 'Capítulo 3: O fim']
CABECALHO = ['Matéria', 'Kit', 'Título', 'Volume', 'Autoria', 'Editora', 'Edição', 'Ano', 'ISBN', 'Segmento',
             'Relevância (1 a 5)', 'Uso', 'Fonte do ISBN', 'Formato digital', 'Onde comprar ou assinar', 'ISBN digital',
             'Fonte digital', 'Arquivo', 'Tamanho (KB)', 'EPUB convertido (caminho a partir de Livros)', 'materia_id']
GRANDE_BYTES = 41 * 1024 * 1024
LADO_RUIDO = 640     # 640 x 640 x 3 bytes: a figura de ruido tem 1,2 MB


def salvar(doc, caminho):
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    doc.set_metadata(FIXO)
    doc.save(caminho, garbage=3, deflate=True, no_new_id=True)
    doc.close()
    return caminho


def pagina(doc, cor, linhas):
    pg = doc.new_page(width=W, height=H)
    pg.draw_rect(pymupdf.Rect(72, 300, 523, 700), color=cor, fill=cor)
    for i, t in enumerate(linhas):
        pg.insert_text((72, 90 + 26 * i), t, fontname='helv', fontsize=18 if i == 0 else 12)
    return pg


def pdf_com_marcadores(caminho):
    doc = pymupdf.open()
    toc = []
    for c, titulo in enumerate(CAPITULOS_PDF):
        toc.append([1, titulo, doc.page_count + 1])
        for k in range(2):
            pagina(doc, CORES[c], [titulo, 'Livro com marcadores, página %d.' % (doc.page_count + 1),
                                   'Texto conhecido do capítulo %d, parte %d.' % (c + 1, k + 1)])
    toc.insert(2, [2, 'Frações equivalentes', 4])
    doc.set_toc(toc)
    # Uma figura de ruido (semente fixa, nao comprime) na ultima pagina: o livro
    # passa de 1 MB, e a prova de que a copia de seguranca nao leva os livros
    # (testa_livros.js) mede um crescimento que, se houvesse, nao se esconderia.
    sorteio = random.Random(15)
    pix = pymupdf.Pixmap(pymupdf.csRGB, LADO_RUIDO, LADO_RUIDO, sorteio.randbytes(LADO_RUIDO * LADO_RUIDO * 3), False)
    doc[-1].insert_image(pymupdf.Rect(72, 720, 172, 820), pixmap=pix)
    return salvar(doc, caminho)


def pdf_sem_marcadores(caminho, paginas):
    doc = pymupdf.open()
    for i in range(paginas):
        pagina(doc, CORES[i % 3], ['Livro sem marcadores', 'Página %d.' % (i + 1)])
    return salvar(doc, caminho)


def png_pequeno():
    pix = pymupdf.Pixmap(pymupdf.csRGB, pymupdf.IRect(0, 0, 40, 20), False)
    pix.set_rect(pix.irect, (30, 120, 200))
    return pix.tobytes('png')


def xhtml(titulo, corpo):
    return ('<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n'
            '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">\n'
            '<head><title>%s</title><link rel="stylesheet" type="text/css" href="../estilo/livro.css"/></head>\n'
            '<body>\n%s\n</body></html>\n' % (titulo, corpo)).encode('utf-8')


def epub(caminho, so_o_comeco=False):
    """so_o_comeco: o nav e o NCX com uma entrada so, a do comeco, como o "Start"
    que o calibre poe ao converter PDF (a prova confere que isso vira sumario vazio)."""
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    caps = []
    for i, t in enumerate(CAPITULOS_EPUB):
        paragrafos = ['<p>Parágrafo %d do capítulo %d. Texto conhecido para a prova do leitor de EPUB, '
                      'longo o bastante para a página rolar e a posição ser guardada.</p>\n' % (k + 1, i + 1)
                      for k in range(40)]
        extra = ''
        if i == 0:
            extra = '<p><img src="../imagens/figura.png" alt="figura de prova"/></p>\n'
        if i == 1:
            # o que o leitor nao pode deixar rodar nem sair: script, atributo de evento e link para fora
            extra = ('<script>window.parent.__epubRodou = "script"; document.title = "rodou";</script>\n'
                     '<p><img src="nao-existe.png" alt="quebrada" onerror="window.parent.__epubRodou = \'onerror\'"/></p>\n'
                     '<p><a href="https://exemplo.invalid/fora">link para fora</a> e '
                     '<a href="cap3.xhtml#meio">link para o capítulo 3</a></p>\n')
        corpo = '<h1 id="topo">%s</h1>\n%s%s<p id="meio">Meio do capítulo %d.</p>\n%s' % (
            t, extra, ''.join(paragrafos[:20]), i + 1, ''.join(paragrafos[20:]))
        caps.append(xhtml(t, corpo))
    nav = ('<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n'
           '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">\n'
           '<head><title>Sumário</title></head><body>\n<nav epub:type="toc"><h1>Sumário</h1><ol>\n'
           '<li><a href="texto/cap1.xhtml">%s</a></li>\n'
           '<li><a href="texto/cap2.xhtml">%s</a><ol><li><a href="texto/cap2.xhtml#meio">Meio do capítulo 2</a></li></ol></li>\n'
           '<li><a href="texto/cap3.xhtml">%s</a></li>\n'
           '</ol></nav>\n</body></html>\n' % tuple(CAPITULOS_EPUB)).encode('utf-8')
    ncx = ('<?xml version="1.0" encoding="utf-8"?>\n<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">\n'
           '<head/><docTitle><text>Livro de prova</text></docTitle><navMap>\n' +
           ''.join('<navPoint id="n%d" playOrder="%d"><navLabel><text>%s</text></navLabel>'
                   '<content src="texto/cap%d.xhtml"/></navPoint>\n' % (i + 1, i + 1, t, i + 1)
                   for i, t in enumerate(CAPITULOS_EPUB)) +
           '</navMap></ncx>\n').encode('utf-8')
    opf = ('<?xml version="1.0" encoding="utf-8"?>\n'
           '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id">\n'
           '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">prova-c15</dc:identifier>'
           '<dc:title>Livro de prova</dc:title><dc:language>pt-BR</dc:language></metadata>\n<manifest>\n'
           '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>\n'
           '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>\n'
           '<item id="css" href="estilo/livro.css" media-type="text/css"/>\n'
           '<item id="fig" href="imagens/figura.png" media-type="image/png"/>\n' +
           ''.join('<item id="c%d" href="texto/cap%d.xhtml" media-type="application/xhtml+xml"/>\n' % (i, i)
                   for i in (1, 2, 3)) +
           '</manifest>\n<spine toc="ncx">' + ''.join('<itemref idref="c%d"/>' % i for i in (1, 2, 3)) +
           '</spine>\n</package>\n').encode('utf-8')
    container = ('<?xml version="1.0"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">'
                 '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>'
                 '</rootfiles></container>\n').encode('utf-8')
    css = b'body { color: #222222; } h1 { color: #16314F; } p { margin: 0 0 0.8em; }\n'
    if so_o_comeco:
        nav = nav.split(b'<li><a href="texto/cap2')[0] + b'</ol></nav>\n</body></html>\n'
        ncx = ncx.split(b'<navPoint id="n2"')[0] + b'</navMap></ncx>\n'
    with zipfile.ZipFile(caminho, 'w') as z:
        for nome, dados, metodo in [('mimetype', b'application/epub+zip', zipfile.ZIP_STORED),
                                    ('META-INF/container.xml', container, zipfile.ZIP_DEFLATED),
                                    ('OEBPS/content.opf', opf, zipfile.ZIP_DEFLATED),
                                    ('OEBPS/nav.xhtml', nav, zipfile.ZIP_DEFLATED),
                                    ('OEBPS/toc.ncx', ncx, zipfile.ZIP_DEFLATED),
                                    ('OEBPS/estilo/livro.css', css, zipfile.ZIP_DEFLATED),
                                    ('OEBPS/imagens/figura.png', png_pequeno(), zipfile.ZIP_STORED)] + \
                                   [('OEBPS/texto/cap%d.xhtml' % (i + 1), c, zipfile.ZIP_DEFLATED) for i, c in enumerate(caps)]:
            zi = zipfile.ZipInfo(nome, date_time=(2026, 10, 30, 0, 0, 0))
            zi.compress_type = metodo
            z.writestr(zi, dados)
    return caminho


def linha(materia, titulo, arquivo, **campos):
    l = dict.fromkeys(CABECALHO, '')
    l.update({'Matéria': materia.capitalize(), 'Título': titulo, 'Arquivo': arquivo, 'materia_id': materia,
              'Autoria': 'Autora de Prova', 'Editora': 'Editora de Prova', 'Edição': '1ª edição', 'Ano': '2026',
              'Segmento': 'Anos finais'})
    l.update(campos)
    return l


def fazer(pasta, grande=False):
    """Escreve <pasta>/Livros (livros, planilha e mapa). Devolve os caminhos."""
    livros = os.path.join(pasta, 'Livros')
    pdf_com_marcadores(os.path.join(livros, 'matematica', 'livro-com-marcadores.pdf'))
    pdf_sem_marcadores(os.path.join(livros, 'matematica', 'livro-sem-marcadores.pdf'), 4)
    pdf_sem_marcadores(os.path.join(livros, 'matematica', 'livro-sem-sumario.pdf'), 2)
    epub(os.path.join(livros, 'literatura', 'livro-de-prova.epub'))
    mapa = os.path.join(livros, 'mapa')
    os.makedirs(mapa, exist_ok=True)
    with open(os.path.join(mapa, 'mapa_capitulos_prova.json'), 'w', encoding='utf-8', newline='') as f:
        f.write('[{"livro": "sm4", "arquivo": "livro-sem-marcadores.pdf", "serie": "06", "deslocamento": 0, '
                '"capitulos": [{"n": 1, "titulo": "Unidade do mapa A", "pag_impressa": 1, "pag_arquivo_inicio": 1, '
                '"pag_arquivo_fim": 2, "assuntos": []}, {"n": 2, "titulo": "Unidade do mapa B", "pag_impressa": 3, '
                '"pag_arquivo_inicio": 3, "pag_arquivo_fim": 4, "assuntos": []}]}]\n')
    linhas = [
        linha('matematica', 'Livro com marcadores', 'matematica/livro-com-marcadores.pdf', Volume='Volume 1'),
        linha('matematica', 'Livro sem marcadores', 'matematica/livro-sem-marcadores.pdf'),
        linha('matematica', 'Livro sem sumário', 'matematica/livro-sem-sumario.pdf'),
        linha('literatura', 'Livro de prova em EPUB', 'literatura/livro-de-prova.epub'),
        linha('matematica', 'Livro que ela ainda não tem', ''),
        linha('matematica', 'Livro com arquivo sumido', 'matematica/nao-existe.pdf'),
    ]
    if grande:
        g = os.path.join(livros, 'grande', 'livro-grande.pdf')
        os.makedirs(os.path.dirname(g), exist_ok=True)
        with open(g, 'wb') as f:
            f.truncate(GRANDE_BYTES)
        linhas.append(linha('matematica', 'Livro grande demais', 'grande/livro-grande.pdf'))
    planilha = os.path.join(livros, 'livros_prova.csv')
    with open(planilha, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=CABECALHO)
        w.writeheader()
        w.writerows(linhas)
    return {'livros': livros, 'planilha': planilha, 'mapas': mapa}


def fazer_varios(pasta, n=10, lado=1150):
    """Varios livros pesados (cada um com uma figura de ruido de lado x lado x 3
    bytes, 4 MB com o padrao), e a planilha deles, em <pasta>/Varios. E o
    pacote da prova de memoria: o pico na importacao tem de ficar perto de UM
    livro, e nao do pacote."""
    raiz = os.path.join(pasta, 'Varios')
    linhas = []
    for k in range(n):
        doc = pymupdf.open()
        pagina(doc, CORES[k % 3], ['Livro pesado %d' % (k + 1), 'Uma página só, com uma figura de ruído.'])
        sorteio = random.Random(100 + k)
        pix = pymupdf.Pixmap(pymupdf.csRGB, lado, lado, sorteio.randbytes(lado * lado * 3), False)
        doc[0].insert_image(pymupdf.Rect(72, 720, 172, 820), pixmap=pix)
        salvar(doc, os.path.join(raiz, 'pesados', 'livro-pesado-%02d.pdf' % (k + 1)))
        linhas.append(linha('matematica', 'Livro pesado %d' % (k + 1), 'pesados/livro-pesado-%02d.pdf' % (k + 1)))
    planilha = os.path.join(raiz, 'livros_varios.csv')
    with open(planilha, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=CABECALHO)
        w.writeheader()
        w.writerows(linhas)
    return {'livros': raiz, 'planilha': planilha}


def principal():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) != 1:
        raise SystemExit(__doc__)
    pasta = os.path.abspath(args[0])
    if '--varios' in sys.argv:
        import livros
        c = fazer_varios(pasta)
        manifest, rel, _ = livros.gerar(c['planilha'], 'prova-varios', 1, os.path.join(pasta, 'pacotes'),
                                        trabalho=os.path.join(pasta, 'trabalho-varios'),
                                        gerado_em='2026-10-30T10:00:00-03:00', commit='prova')
        print('%d livros no pacote, %d bytes' % (manifest['contagens']['livros'], manifest['contagens']['bytes']))
        print(rel['zip']['caminho'])
        return
    c = fazer(pasta, grande='--grande' in sys.argv)
    if '--pacote' in sys.argv:
        import livros
        manifest, rel, _ = livros.gerar(c['planilha'], 'prova', 1, os.path.join(pasta, 'pacotes'),
                                        mapas=c['mapas'], trabalho=os.path.join(pasta, 'trabalho'),
                                        gerado_em='2026-10-30T10:00:00-03:00', commit='prova')
        print('%d livros no pacote, %d recusados' % (manifest['contagens']['livros'], len(rel['recusados'])))
        print(rel['zip']['caminho'])
    else:
        print(c['livros'])


if __name__ == '__main__':
    principal()
