# -*- coding: utf-8 -*-
"""Rasteriza duas paginas de PDF e conta os pixels diferentes.

    python _teste/_rasteriza_compara.py <a.pdf> <b.pdf> <pagina> [--png <saida.png>]

Escreve uma linha de JSON na saida: {"paginas_a", "paginas_b", "largura",
"altura", "diferentes", "total", "pior_canal"}. Codigo 0 sempre que conseguiu
medir; quem julga o numero e quem chamou.

Existe porque "a folha impressa nao mudou" e uma afirmacao sobre o DESENHO, e
comparar bytes responde outra pergunta (mais forte, mas outra). Byte igual
implica pixel igual; a reciproca nao vale, e por isso as duas comparacoes ficam
no mesmo lugar em vez de uma substituir a outra.

O dpi e alto de proposito: a 200 dpi uma linha de meio ponto que se deslocasse
um centesimo de ponto ja cairia em pixel diferente, e e esse o tipo de mudanca
silenciosa que a prova existe para pegar.
"""
import json
import sys

DPI = 200


def main(argv):
    if len(argv) < 4:
        sys.stderr.write(__doc__)
        return 2
    import fitz          # PyMuPDF
    a = fitz.open(argv[1])
    b = fitz.open(argv[2])
    pagina = int(argv[3])
    saida = None
    if '--png' in argv:
        saida = argv[argv.index('--png') + 1]

    fora = {'paginas_a': a.page_count, 'paginas_b': b.page_count}
    if pagina >= a.page_count or pagina >= b.page_count:
        fora['erro'] = 'pagina fora das duas'
        print(json.dumps(fora))
        return 0

    zoom = DPI / 72.0
    m = fitz.Matrix(zoom, zoom)
    pa = a.load_page(pagina).get_pixmap(matrix=m, alpha=False)
    pb = b.load_page(pagina).get_pixmap(matrix=m, alpha=False)
    fora['largura'] = pa.width
    fora['altura'] = pa.height
    if (pa.width, pa.height) != (pb.width, pb.height):
        fora['erro'] = 'tamanhos diferentes: %sx%s contra %sx%s' % (pa.width, pa.height, pb.width, pb.height)
        print(json.dumps(fora))
        return 0

    sa, sb = pa.samples, pb.samples
    n = pa.width * pa.height
    passo = pa.n
    diferentes = 0
    pior = 0
    for i in range(0, len(sa), passo):
        if sa[i:i + passo] != sb[i:i + passo]:
            diferentes += 1
            for k in range(passo):
                d = abs(sa[i + k] - sb[i + k])
                if d > pior:
                    pior = d
    fora['diferentes'] = diferentes
    fora['total'] = n
    fora['pior_canal'] = pior
    if saida:
        pa.save(saida)
        fora['png'] = saida
    print(json.dumps(fora))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
