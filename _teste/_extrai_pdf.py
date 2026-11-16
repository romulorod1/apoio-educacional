"""O que o MuPDF lê de um PDF, em JSON, para as provas de Node.

    python -X utf8 _teste/_extrai_pdf.py <arquivo.pdf>

Imprime uma linha JSON:
  { "paginas": N,
    "texto": [texto extraído de cada página],
    "fontes": [[xref, ext, tipo, nome, codificação] de cada fonte, sem repetir],
    "avisos": [o que o MuPDF reclamou ao abrir e ao extrair] }

Serve ao _teste/testa_fonte_unicode.js: a extração tem de devolver o caractere
que foi escrito, e isso só é verdade se o ToUnicode da fonte de reserva estiver
certo. O MuPDF é o mesmo instrumento das outras provas de PDF do portão.
"""
import json
import sys

import pymupdf


def principal(caminho):
    pymupdf.TOOLS.mupdf_display_errors(False)
    pymupdf.TOOLS.reset_mupdf_warnings()
    doc = pymupdf.open(caminho)
    textos, fontes, vistas = [], [], set()
    for pag in doc:
        textos.append(pag.get_text('text'))
        for f in pag.get_fonts(full=True):
            if f[0] in vistas:
                continue
            vistas.add(f[0])
            fontes.append([f[0], f[1], f[2], f[3], f[5]])
    avisos = [a for a in pymupdf.TOOLS.mupdf_warnings().split('\n') if a.strip()]
    print(json.dumps({'paginas': doc.page_count, 'texto': textos, 'fontes': fontes, 'avisos': avisos},
                     ensure_ascii=True))


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    principal(sys.argv[1])
