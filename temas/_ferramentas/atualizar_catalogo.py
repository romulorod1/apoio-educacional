# -*- coding: utf-8 -*-
"""
Atualiza a coluna de situacao do CATALOGO.md a partir do que existe no disco.

Um tema so aparece como pronto se o arquivo existir E passar no verificador.
Assim o catalogo nunca promete conteudo que nao foi conferido.
"""
import io
import os
import re
import sys
import glob

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verificar

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOGO = os.path.join(RAIZ, 'CATALOGO.md')


def situacao_dos_temas():
    """Devolve {id: 'pronto'|'com erro'} para cada arquivo encontrado."""
    situacao = {}
    for caminho in sorted(glob.glob(os.path.join(RAIZ, 'mat', '*', '*.md'))):
        ident = os.path.splitext(os.path.basename(caminho))[0]
        try:
            erros, avisos, manuais, cab = verificar.conferir(caminho)
            situacao[ident] = 'pronto' if not erros else 'com erro'
        except Exception:
            situacao[ident] = 'com erro'
    return situacao


def main():
    situacao = situacao_dos_temas()
    texto = io.open(CATALOGO, encoding='utf-8').read()
    linhas = texto.split('\n')
    mudou = 0

    for i, linha in enumerate(linhas):
        achou = re.match(r'^\|\s*(MAT[A-Z0-9\-]+)\s*\|(.*)\|\s*([a-zç ]+)\s*\|\s*$', linha)
        if not achou:
            continue
        ident, meio, atual = achou.group(1), achou.group(2), achou.group(3).strip()
        nova = situacao.get(ident, 'previsto')
        if nova != atual:
            linhas[i] = '| %s |%s| %s |' % (ident, meio, nova)
            mudou += 1

    io.open(CATALOGO, 'w', encoding='utf-8', newline='\n').write('\n'.join(linhas))

    prontos = sum(1 for v in situacao.values() if v == 'pronto')
    com_erro = sum(1 for v in situacao.values() if v == 'com erro')
    total = sum(1 for l in linhas if re.match(r'^\|\s*MAT[A-Z0-9\-]+\s*\|', l))

    print('catalogo atualizado: %d linha(s) mudaram' % mudou)
    print('%d de %d temas prontos e conferidos' % (prontos, total))
    if com_erro:
        print('%d tema(s) escritos mas reprovados na conferencia' % com_erro)
    return 0


if __name__ == '__main__':
    sys.exit(main())
