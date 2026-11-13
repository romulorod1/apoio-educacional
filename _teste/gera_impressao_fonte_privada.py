"""Gera a impressão do TEXTO da fonte privada de anos iniciais.

A trava _teste/testa_sem_fonte_privada.js reprova o repositório quando um
arquivo de texto rastreado repete janelas de dez palavras da fonte privada.
Este script fica no repositório SEM dado nenhum: ele lê os PDFs de uma pasta
dada por argumento (a pasta privada no Drive, fora do repositório) e escreve
na saída a amostra de hashes que vai para o segredo FONTE_PRIVADA_TEXTO do
GitHub Actions. Nenhum texto nem nome de arquivo sai na saída.

    python _teste/gera_impressao_fonte_privada.py PASTA > impressao.txt
    python _teste/gera_impressao_fonte_privada.py --shas PASTA > shas.txt
    python _teste/gera_impressao_fonte_privada.py --autoteste

A normalização e o hash são os MESMOS da trava, que confere a paridade com o
--autoteste em toda rodada:
  1. junta a palavra partida no fim da linha ("-" seguido de quebra de linha);
  2. minúsculas, NFKD e sem os acentos (U+0300 a U+036F);
  3. tudo que não é letra de a a z vira espaço; as palavras são o que sobra;
  4. cada janela de dez palavras seguidas, unidas por um espaço, vira os oito
     primeiros bytes do SHA-256 do texto em UTF-8, em hexadecimal;
  5. a amostra são os AMOSTRA menores hashes distintos (estilo minhash), para
     caber no limite de 48 KB do segredo.

Precisa do PyMuPDF (fitz) só para ler os PDFs; o --autoteste não precisa.
"""
import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path

JANELA = 10
AMOSTRA = 2500
CABECALHO = '# impressao-texto v1 janela=%d hash=sha256-8 amostra=%d de %d'

_QUEBRA = re.compile(r'-[ \t]*\r?\n[ \t]*')
_NAO_LETRA = re.compile(r'[^a-z]+')
_ACENTO = re.compile('[̀-ͯ]')


def palavras(texto):
    t = _QUEBRA.sub('', texto)
    t = _ACENTO.sub('', unicodedata.normalize('NFKD', t.lower()))
    return [p for p in _NAO_LETRA.sub(' ', t).split(' ') if p]


def hash_janela(ps):
    return hashlib.sha256(' '.join(ps).encode('utf-8')).hexdigest()[:16]


def hashes_do_texto(texto, janela=JANELA):
    ps = palavras(texto)
    return {hash_janela(ps[i:i + janela]) for i in range(0, len(ps) - janela + 1)}


# O --autoteste imprime esta frase (em JSON), as palavras dela e o hash da
# primeira janela; a trava refaz as duas contas e compara.
AMOSTRA_AUTOTESTE = ('Ação  e  reação: a ﬁgura do PROFESSOR-\n  ensina; '
                     'o aluno 3x aprende, Ç e ñ e ü, até o fim do caminho de novo.')


def textos_dos_pdfs(pasta):
    import fitz  # PyMuPDF, só aqui
    for arq in sorted(Path(pasta).rglob('*.pdf')):
        with fitz.open(arq) as doc:
            yield '\n'.join(p.get_text() for p in doc)


def main(args):
    if args == ['--autoteste']:
        ps = palavras(AMOSTRA_AUTOTESTE)
        print(json.dumps(AMOSTRA_AUTOTESTE))
        print(' '.join(ps))
        print(hash_janela(ps[:JANELA]))
        return 0
    if len(args) == 2 and args[0] == '--shas':
        for arq in sorted(Path(args[1]).rglob('*.pdf')):
            print(hashlib.sha256(arq.read_bytes()).hexdigest())
        return 0
    if len(args) != 1:
        print(__doc__, file=sys.stderr)
        return 2
    todos = set()
    n = 0
    for texto in textos_dos_pdfs(args[0]):
        n += 1
        todos |= hashes_do_texto(texto)
    if n == 0:
        print('nenhum PDF na pasta', file=sys.stderr)
        return 1
    amostra = sorted(todos)[:AMOSTRA]
    print(CABECALHO % (JANELA, len(amostra), len(todos)))
    for h in amostra:
        print(h)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
