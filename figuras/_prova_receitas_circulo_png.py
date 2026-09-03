"""figuras/_prova_receitas_circulo_png.py

Rasteriza paginas do _prova_receitas_circulo.pdf para PNG, inteiras ou um
recorte ampliado, para a folha ser OLHADA e nao so medida.

    python _prova_receitas_circulo_png.py <pdf> <pagina> [<saida.png>] [--zoom Z] [--clip x0 y0 x1 y1]

Regra da casa: nunca usar travessao.
"""
import sys

import pymupdf


def main():
    args = sys.argv[1:]
    pdf, pagina = args[0], int(args[1])
    saida = args[2] if len(args) > 2 and not args[2].startswith("--") else "_prova_receitas_circulo_p%d.png" % pagina
    zoom = 2.0
    clip = None
    if "--zoom" in args:
        zoom = float(args[args.index("--zoom") + 1])
    if "--clip" in args:
        i = args.index("--clip")
        clip = pymupdf.Rect(*[float(v) for v in args[i + 1:i + 5]])
    doc = pymupdf.open(pdf)
    pag = doc[pagina - 1]
    pix = pag.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=clip)
    pix.save(saida)
    print(saida, pix.width, pix.height)


if __name__ == "__main__":
    main()
