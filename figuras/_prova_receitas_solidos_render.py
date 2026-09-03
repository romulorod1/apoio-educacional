# figuras/_prova_receitas_solidos_render.py
#
# Renderiza o _prova_receitas_solidos.pdf em PNG para a conferencia de olho:
# cada pagina inteira e, ampliado, cada figura que o _prova_receitas_solidos.js
# anotou no _prova_receitas_solidos_clips.json (a caixa da figura, em pontos de
# PDF, y para cima). So render: nao mede nada, a medicao e do .js. E a mesma
# forma do _prova_solidos_render.py.
#
# Uso: python _prova_receitas_solidos_render.py
#
# Regra da casa: nunca usar travessao.

import json, os

try:
    import pymupdf
except ImportError:
    import fitz as pymupdf

AQUI = os.path.dirname(os.path.abspath(__file__))
PDF = os.path.join(AQUI, '_prova_receitas_solidos.pdf')
CLIPS = os.path.join(AQUI, '_prova_receitas_solidos_clips.json')

doc = pymupdf.open(PDF)
for i, pag in enumerate(doc):
    pix = pag.get_pixmap(dpi=110)
    saida = os.path.join(AQUI, '_prova_receitas_solidos_p%d.png' % (i + 1))
    pix.save(saida)
    print(saida, pix.width, 'x', pix.height)

with open(CLIPS, encoding='utf-8') as f:
    dados = json.load(f)
altura_pagina = dados['paginaAltura']
for c in dados['clips']:
    pag = doc[c['pagina'] - 1]
    folga = 6
    x0 = c['x'] - folga
    x1 = c['x'] + c['largura'] + folga
    # y do PDF cresce para cima; o do pymupdf cresce para baixo
    y0 = altura_pagina - (c['y'] + c['altura']) - folga
    y1 = altura_pagina - c['y'] + folga
    clip = pymupdf.Rect(x0, y0, x1, y1)
    pix = pag.get_pixmap(dpi=220, clip=clip)
    nome = ''.join(ch if ch.isalnum() else '_' for ch in c['nome'])
    saida = os.path.join(AQUI, '_prova_receitas_solidos_z_%s.png' % nome)
    pix.save(saida)
    print(saida, pix.width, 'x', pix.height)
