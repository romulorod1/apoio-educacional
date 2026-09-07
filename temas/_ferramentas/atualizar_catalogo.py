# -*- coding: utf-8 -*-
"""
Atualiza a coluna de situacao do CATALOGO.md a partir do que existe no disco.

Um tema so aparece como pronto se o arquivo existir E passar no verificador.
Assim o catalogo nunca promete conteudo que nao foi conferido.

A linha de tema e reconhecida pelo prefixo de identificador de qualquer
materia da tabela (MAT, POR, LIT...), e nao por MAT escrito a mao: com o
regex antigo toda linha POR ou LIT ficaria como 'previsto' para sempre, em
silencio, mesmo com o tema escrito e aprovado.

Uso:
    python atualizar_catalogo.py            atualiza o CATALOGO.md
    python atualizar_catalogo.py --so-ler   mostra o que mudaria, sem gravar
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
    """Devolve {id: 'pronto'|'com erro'} para cada arquivo encontrado, em toda materia."""
    situacao = {}
    for caminho in verificar.arquivos_de_temas(RAIZ):
        ident = os.path.splitext(os.path.basename(caminho))[0]
        try:
            erros, avisos, manuais, cab = verificar.conferir(caminho)
            situacao[ident] = 'pronto' if not erros else 'com erro'
        except Exception:
            situacao[ident] = 'com erro'
    return situacao


def regex_da_linha():
    """A linha de tabela do catalogo: | ID | ... | situacao |, com o ID de qualquer materia."""
    prefixos = '|'.join(re.escape(mat['temas']['prefixo']) for mat in verificar.materias())
    return re.compile(r'^\|\s*((?:%s)[A-Z0-9\-]+)\s*\|(.*)\|\s*([a-zç ]+)\s*\|\s*$' % prefixos)


def main():
    so_ler = '--so-ler' in sys.argv
    situacao = situacao_dos_temas()
    texto = io.open(CATALOGO, encoding='utf-8').read()
    linhas = texto.split('\n')
    mudou = 0
    padrao = regex_da_linha()
    no_catalogo = set()

    for i, linha in enumerate(linhas):
        achou = padrao.match(linha)
        if not achou:
            continue
        ident, meio, atual = achou.group(1), achou.group(2), achou.group(3).strip()
        no_catalogo.add(ident)
        nova = situacao.get(ident, 'previsto')
        if nova != atual:
            linhas[i] = '| %s |%s| %s |' % (ident, meio, nova)
            mudou += 1
            if so_ler:
                print('  %s: %s -> %s' % (ident, atual, nova))

    if not so_ler:
        io.open(CATALOGO, 'w', encoding='utf-8', newline='\n').write('\n'.join(linhas))

    # Conta sobre as linhas do catalogo, e nao sobre o disco: tema no disco sem
    # linha entraria na conta e daria "148 de 146", que nao quer dizer nada.
    prontos = sum(1 for i in no_catalogo if situacao.get(i) == 'pronto')
    com_erro = sum(1 for v in situacao.values() if v == 'com erro')
    total = len(no_catalogo)

    print('catalogo %s: %d linha(s) %s' % ('lido' if so_ler else 'atualizado', mudou,
                                            'mudariam' if so_ler else 'mudaram'))
    print('%d de %d temas do catalogo prontos e conferidos' % (prontos, total))
    if com_erro:
        print('%d tema(s) escritos mas reprovados na conferencia' % com_erro)
    # Tema no disco sem linha no catalogo e conteudo que o catalogo nao promete
    # e ninguem enxerga. Antes isso passava calado.
    sem_linha = sorted(set(situacao) - no_catalogo)
    if sem_linha:
        print('%d tema(s) no disco sem linha no catalogo: %s' % (len(sem_linha), ', '.join(sem_linha)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
