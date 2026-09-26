# -*- coding: utf-8 -*-
"""O CONTROLE do _rasteriza_compara.py: duas paginas DIFERENTES do MESMO PDF.

    python _teste/_rasteriza_compara_controle.py <a.pdf> <pagina_x> <pagina_y>

Existe porque "zero pixels diferentes" e o resultado bom e, exatamente por
isso, indistinguivel de um medidor quebrado, que tambem daria zero. Este aponta
o mesmo medidor para duas paginas que TEM de diferir, e o numero que sai e o
que autoriza acreditar no zero do outro.

Escreve uma linha de JSON, igual a do outro.
"""
import json
import sys

DPI = 200


def main(argv):
    if len(argv) < 4:
        sys.stderr.write(__doc__)
        return 2
    import fitz
    doc = fitz.open(argv[1])
    x, y = int(argv[2]), int(argv[3])
    fora = {'paginas': doc.page_count, 'x': x, 'y': y}
    if x >= doc.page_count or y >= doc.page_count:
        fora['erro'] = 'pagina fora do documento'
        print(json.dumps(fora))
        return 0
    if x == y:
        fora['erro'] = 'as duas paginas sao a mesma, e o controle nao mediria nada'
        print(json.dumps(fora))
        return 0

    zoom = DPI / 72.0
    m = fitz.Matrix(zoom, zoom)
    pa = doc.load_page(x).get_pixmap(matrix=m, alpha=False)
    pb = doc.load_page(y).get_pixmap(matrix=m, alpha=False)
    fora['largura'] = pa.width
    fora['altura'] = pa.height
    if (pa.width, pa.height) != (pb.width, pb.height):
        fora['erro'] = 'tamanhos diferentes'
        print(json.dumps(fora))
        return 0
    sa, sb, passo = pa.samples, pb.samples, pa.n
    diferentes = 0
    for i in range(0, len(sa), passo):
        if sa[i:i + passo] != sb[i:i + passo]:
            diferentes += 1
    fora['diferentes'] = diferentes
    fora['total'] = pa.width * pa.height
    print(json.dumps(fora))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
