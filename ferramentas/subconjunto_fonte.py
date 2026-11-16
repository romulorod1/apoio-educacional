"""Gera a fonte de reserva do pdf.js: o subconjunto da DejaVu Sans Condensed.

    python -X utf8 ferramentas/subconjunto_fonte.py <DejaVuSansCondensed.ttf>

O <DejaVuSansCondensed.ttf> é o da versão 2.37, do pacote oficial do projeto:
https://github.com/dejavu-fonts/dejavu-fonts/releases/download/version_2_37/dejavu-fonts-ttf-2.37.zip
(pasta ttf/; o LICENSE do pacote fica na pasta de cima e é copiado junto). O
script confere o SHA-256 do arquivo antes de cortar: outra versão da fonte
mudaria os glifos e as larguras em silêncio.

Escreve três arquivos, todos versionados:

  fontes/DejaVuSansCondensed-subconjunto.ttf   o TTF reduzido (a fonte da verdade)
  fontes/LICENSE-DejaVu.txt                    a licença, copiada do pacote
  fonte-unicode.js                             o que o aplicativo carrega: o TTF
                                               comprimido em zlib e em base64, e a
                                               tabela caractere -> [glifo, largura]

POR QUE O CORTE É FEITO AQUI, E NÃO NO APARELHO. O pdf.js é síncrono e não tem
leitor de TrueType; cortar no tablet pediria um subsetter inteiro dentro do
aplicativo. O corte feito antes deixa o pdf.js só embutindo bytes prontos.

POR QUE ZLIB. O fluxo FontFile2 do PDF aceita /Filter /FlateDecode, e o zlib do
Python é exatamente esse formato: os bytes comprimidos vão direto para o PDF,
sem o pdf.js precisar comprimir nada (no navegador não há zlib síncrono). O
arquivo que o tablet baixa e o PDF gerado ficam menores do que com o TTF cru.

O QUE ENTRA. A lista de notação do BRIEF_D1 (expoentes e índices, conjuntos,
setas, letras de conjunto numérico, frações, grego inteiro, marcas) e mais o
que é natural junto (os outros expoentes e índices, as outras frações, alguns
operadores e as variantes do grego). NÃO entra o que a Helvetica (WinAnsi) ou a
Symbol já desenham: para esses o pdf.js continua usando a fonte de sempre, e a
fonte de reserva nunca compete com elas.

A LARGURA de cada glifo sai do hmtx, convertida para milésimos do corpo
(arredondada), e é a mesma que o pdf.js usa para medir a linha e grava no /W.
"""
import base64
import hashlib
import io
import os
import shutil
import sys
import zlib

from fontTools import subset
from fontTools.ttLib import TTFont

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHA_FONTE = '8550cd5ca1acb65a8fc7877c46939cd0b4d909f8e7bc1e24716873d918c5e549'
NOME = 'DejaVuSansCondensed'

GREGO = (''.join(chr(c) for c in range(0x391, 0x3AA) if c != 0x3A2)
         + ''.join(chr(c) for c in range(0x3B1, 0x3CA)))
# A lista do brief, na ordem dele (U+2212 é o sinal de menos, não o hífen).
LISTA = ('⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻₀₁₂₃₄₅₆₇₈₉ℓ≈≅≡−∓∈∉∩∪⊂⊃⊆⊇∅∀∃∑∏∫∂∇∠⊥∥△′″'
         '→←↔⇒⇔↑↓ℕℤℚℝℂ⅓⅔⅛∛' + GREGO + '✓✗●○■□★')
# O que vem naturalmente junto.
EXTRAS = ('⁼⁽⁾ⁿⁱ₊₋₌₍₎'
          '∆∖∧∨∝∴∵⋅∘≪≫⊄∜∣∤≢≃∼'
          '⅕⅖⅗⅘⅙⅚⅜⅝⅞'
          '⇐↦↕'
          'ϕϑϵ'
          '▲▼◆◇✔✘')

# O que a base-14 já desenha: as MESMAS regras do desenhavel() do pdf.js.
SIMBOLOS = set('π√≥≤≠∞ΔΣαβθ')
CP1252 = {0x20AC, 0x201A, 0x0192, 0x201E, 0x2026, 0x2020, 0x2021, 0x02C6, 0x2030, 0x0160, 0x2039,
          0x0152, 0x017D, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2013, 0x2014, 0x02DC, 0x2122,
          0x0161, 0x203A, 0x0153, 0x017E, 0x0178}
WINANSI_VAZIO = {0x81, 0x8D, 0x8F, 0x90, 0x9D}


def base14_desenha(ch):
    c = ord(ch)
    if ch in SIMBOLOS or c in CP1252:
        return True
    return c < 256 and c not in WINANSI_VAZIO


def caracteres():
    vistos, saida = set(), []
    for ch in LISTA + EXTRAS:
        if ch in vistos or base14_desenha(ch):
            continue
        vistos.add(ch)
        saida.append(ch)
    return saida


def etiqueta(dados):
    """As seis maiúsculas do nome de subconjunto (PDF 9.6.4), tiradas do hash
    dos bytes: o mesmo TTF dá sempre o mesmo nome."""
    h = hashlib.sha256(dados).digest()
    return ''.join(chr(ord('A') + b % 26) for b in h[:6])


def principal(caminho):
    bruto = open(caminho, 'rb').read()
    sha = hashlib.sha256(bruto).hexdigest()
    if sha != SHA_FONTE:
        sys.exit('a fonte não é a DejaVuSansCondensed.ttf da 2.37 (SHA-256 %s)' % sha)
    chars = caracteres()
    fonte = TTFont(io.BytesIO(bruto), recalcTimestamp=False)
    cmap_cheio = fonte.getBestCmap()
    faltam = [ch for ch in chars if ord(ch) not in cmap_cheio]
    if faltam:
        sys.exit('a fonte não tem: %s' % ' '.join('U+%04X' % ord(c) for c in faltam))

    op = subset.Options()
    op.layout_features = []
    op.hinting = False
    op.glyph_names = False
    op.notdef_outline = True
    op.name_IDs = ['*']          # o aviso de copyright e a licença ficam no arquivo
    op.name_languages = [0x409]
    op.drop_tables += ['GSUB', 'GPOS', 'GDEF', 'kern', 'FFTM', 'BASE', 'JSTF', 'MATH', 'DSIG']
    corte = subset.Subsetter(options=op)
    corte.populate(unicodes=[ord(c) for c in chars])
    corte.subset(fonte)
    saida = io.BytesIO()
    fonte.save(saida)
    ttf = saida.getvalue()

    # Relida do que foi gravado: a tabela sai do arquivo que vai para o repo.
    f = TTFont(io.BytesIO(ttf))
    upm = f['head'].unitsPerEm
    cmap = f.getBestCmap()
    ordem = f.getGlyphOrder()
    hmtx = f['hmtx']
    glifos = []
    for ch in chars:
        nome = cmap[ord(ch)]
        gid = ordem.index(nome)
        larg = int(round(hmtx[nome][0] * 1000.0 / upm))
        glifos.append((ord(ch), gid, larg))
    k = 1000.0 / upm
    head, hhea = f['head'], f['hhea']
    alt_h = f['glyf'][cmap[ord('ℝ')]].yMax  # maiúscula: o R de conjunto tem a altura do H
    metr = {
        'bbox': [int(round(v * k)) for v in (head.xMin, head.yMin, head.xMax, head.yMax)],
        'ascendente': int(round(hhea.ascent * k)),
        'descendente': int(round(hhea.descent * k)),
        'maiuscula': int(round(alt_h * k)),
    }
    flate = zlib.compress(ttf, 9)

    os.makedirs(os.path.join(RAIZ, 'fontes'), exist_ok=True)
    with open(os.path.join(RAIZ, 'fontes', NOME + '-subconjunto.ttf'), 'wb') as s:
        s.write(ttf)
    licenca = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(caminho))), 'LICENSE')
    if os.path.exists(licenca):
        shutil.copyfile(licenca, os.path.join(RAIZ, 'fontes', 'LICENSE-DejaVu.txt'))
    else:
        print('aviso: não achei o LICENSE ao lado da pasta ttf/; o fontes/LICENSE-DejaVu.txt ficou como estava')
    js = escrever_js(ttf, flate, glifos, metr, upm)
    with open(os.path.join(RAIZ, 'fonte-unicode.js'), 'w', encoding='utf-8', newline='\n') as s:
        s.write(js)
    print('%d caracteres, %d glifos no arquivo' % (len(chars), len(ordem)))
    print('TTF: %d bytes; zlib: %d bytes; fonte-unicode.js: %d bytes'
          % (len(ttf), len(flate), len(js.encode('utf-8'))))


def escrever_js(ttf, flate, glifos, metr, upm):
    b64 = base64.b64encode(flate).decode('ascii')
    linhas_b64 = [b64[i:i + 100] for i in range(0, len(b64), 100)]
    tabela = []
    for i in range(0, len(glifos), 6):
        tabela.append('      ' + ' '.join('0x%04X: [%d, %d],' % g for g in glifos[i:i + 6]))
    tabela[-1] = tabela[-1].rstrip(',')
    return (
        "/* fonte-unicode.js\n"
        " * GERADO por ferramentas/subconjunto_fonte.py. Não editar à mão: rode o script.\n"
        " *\n"
        " * A fonte de reserva do pdf.js: o subconjunto da DejaVu Sans Condensed 2.37\n"
        " * (licença em fontes/LICENSE-DejaVu.txt; o TTF reduzido em\n"
        " * fontes/DejaVuSansCondensed-subconjunto.ttf). Só o que a Helvetica e a\n"
        " * Symbol da base-14 não desenham: expoentes e índices, conjuntos, setas,\n"
        " * grego, frações e marcas.\n"
        " *\n"
        " *   glifos: código Unicode -> [glifo no TTF, largura em milésimos do corpo,\n"
        " *           tirada do hmtx]\n"
        " *   flate:  o TTF comprimido em zlib, em base64. Vai como está para o fluxo\n"
        " *           FontFile2 do PDF, com /Filter /FlateDecode.\n"
        " *\n"
        " * Carregado pelo index.html e listado no ARQUIVOS do sw.js. Sem ele o\n"
        " * pdf.js continua como antes: o caractere novo volta a ser recusado pelo\n"
        " * caracteresQueNaoDesenha. */\n"
        "(function (root, factory) {\n"
        "  if (typeof module === 'object' && module.exports) module.exports = factory();\n"
        "  else root.FonteUnicode = factory();\n"
        "})(typeof self !== 'undefined' ? self : this, function () {\n"
        "  'use strict';\n"
        "  return {\n"
        "    nome: '%s+%s',\n"
        "    unidades: %d,\n"
        "    tamanhoTTF: %d,\n"
        "    bbox: [%s],\n"
        "    ascendente: %d,\n"
        "    descendente: %d,\n"
        "    maiuscula: %d,\n"
        "    glifos: {\n%s\n    },\n"
        "    flate:\n      '%s'\n"
        "  };\n"
        "});\n"
    ) % (etiqueta(ttf), NOME, upm, len(ttf), ', '.join(str(v) for v in metr['bbox']),
         metr['ascendente'], metr['descendente'], metr['maiuscula'],
         '\n'.join(tabela), "' +\n      '".join(linhas_b64))


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    principal(sys.argv[1])
