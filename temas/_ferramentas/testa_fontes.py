# -*- coding: utf-8 -*-
"""
Testa as travas da colecao fontes/ com arquivos propositalmente defeituosos.

A trava do dominio publico e a unica do repositorio que decide sobre uma
questao juridica, e a unica cujo veredito muda sozinho com a passagem do tempo.
Por isso cada par aqui declara o ano em que a conta e feita, e nao o relogio: um
par escrito com o relogio passaria a mentir na virada de 1 de janeiro, e o
teste que devia proteger a colecao viraria alarme falso anual.

Cada caso nasce em <tmp>/fontes/<id>.md e e apagado no fim.
"""
import io
import os
import sys
import shutil
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verificar

# Escritos pelo codigo para o proprio teste nao carregar o caractere que ele
# injeta como veneno.
TRAVESSAO = u'\u2014'

# A fonte saudavel: conto de dominio publico, autor morto em 1908, com
# procedencia, corpo quebrado a mao em linhas que cabem no bloco de citacao.
BASE = u"""---
id: machado-de-assis_missa-do-galo
titulo: Missa do galo
autor: Machado de Assis
autor_morte: 1908
obra: Páginas recolhidas
ano: 1899
genero: conto
dominio: publico
licenca: domínio público, Lei 9.610/98 art. 41
procedencia: Wikisource, cópia consultada em 08/09/2026, https://pt.wikisource.org/
integral: nao
---

Nunca pude entender a conversação que tive com uma senhora, há muitos
anos, contava eu dezessete, ela trinta. Era noite de Natal.

Havendo ajustado com um vizinho irmos à missa do galo, preferi não
dormir; combinei que eu iria acordá-lo à meia-noite.
"""

# Um texto escrito para o exercicio: dominio autoral, sem ano de morte.
AUTORAL = u"""---
id: escrito_bilhete-da-geladeira
titulo: Bilhete da geladeira
autor: escrito para o exercício
ano: 2026
genero: bilhete
dominio: autoral
licenca: escrito para este banco, uso livre
procedencia: escrito pela frente 2 em 08/09/2026 para o tema POR07-99
integral: sim
---

Mãe, peguei o último iogurte de morango. Deixei o de coco para você.
Volto do treino às seis e meia.
"""

# Uma cantiga sem autor conhecido: dominio tradicional, procedencia apontando a
# coletanea publica de onde ela foi copiada.
TRADICIONAL = u"""---
id: tradicao-popular_a-canoa-virou
titulo: A canoa virou
autor: tradição popular
ano: 1938
genero: cantiga
dominio: tradicional
licenca: domínio público, cantiga de tradição oral
procedencia: coletânea de cantigas de roda do folclore brasileiro, edição pública
integral: sim
---

A canoa virou, por deixá-la virar.
Foi por causa da menina que não soube remar.
"""

# Um texto sob licenca livre: exige o nome exato da licenca e o endereco.
CREATIVE = u"""---
id: verbete_gato-do-mato
titulo: Gato do mato
autor: equipe da enciclopédia aberta
ano: 2021
genero: verbete
dominio: cc
licenca: CC BY 4.0
procedencia: enciclopédia aberta, consultada em 08/09/2026, https://exemplo.org/gato
integral: sim
---

O gato do mato é um felino pequeno, de hábitos noturnos, que vive em
áreas de mata fechada e de cerrado no Brasil.
"""

# Uma traducao: a traducao tem direito proprio, e a conta vale para o tradutor.
TRADUZIDA = u"""---
id: andersen_o-patinho-feio
titulo: O patinho feio
autor: Hans Christian Andersen
autor_morte: 1875
tradutor: Um tradutor de 1930
tradutor_morte: 1930
ano: 1843
genero: conto
dominio: publico
licenca: domínio público, Lei 9.610/98 art. 41
procedencia: Domínio Público, cópia consultada em 08/09/2026, https://exemplo.org/patinho
integral: nao
---

Que belo estava o campo naquele verão. O trigo estava dourado, a aveia
verde, e o feno amontoado nas várzeas.
"""


def _sem_linha(texto, comeco):
    return u'\n'.join(l for l in texto.split(u'\n') if not l.startswith(comeco))


def _troca(texto, de, para):
    if de not in texto:
        raise SystemExit(u'o teste esta desatualizado: nao achei "%s" na fonte' % de)
    return texto.replace(de, para)


LINHA_LARGA = (u'Uma linha de cento e quarenta caracteres que nao cabe de jeito nenhum '
               u'na largura do bloco de citacao da folha impressa, e por isso reprova.')
LINHA_ESTREITA = u'Uma linha de oitenta caracteres, que cabe folgada no bloco de citacao.'

# (descricao, id do arquivo, texto, ano da conta, erro esperado ou None)
PARES = [
    # F5: dominio publico exige autor_morte dentro da conta
    ('F5 fonte saudavel de dominio publico passa',
     'machado-de-assis_missa-do-galo', BASE, 2026, None),
    ('F5 autor morto em 1970 reprova em 2026',
     'machado-de-assis_missa-do-galo', _troca(BASE, 'autor_morte: 1908', 'autor_morte: 1970'),
     2026, 'ainda nao esta em dominio publico'),
    ('F5 sem autor_morte reprova',
     'machado-de-assis_missa-do-galo', _sem_linha(BASE, 'autor_morte:'),
     2026, 'dominio publico exige autor_morte'),
    ('F5 autor_morte que nao e ano reprova',
     'machado-de-assis_missa-do-galo', _troca(BASE, 'autor_morte: 1908', 'autor_morte: nao sei'),
     2026, 'ano inteiro'),

    # G7: a conta so afrouxa com o tempo. Morte em 1956 fica livre em 2027.
    ('G7 autor morto em 1956 reprova em 2026',
     'machado-de-assis_missa-do-galo', _troca(BASE, 'autor_morte: 1908', 'autor_morte: 1956'),
     2026, 'ainda nao esta em dominio publico'),
    ('G7 o mesmo autor morto em 1956 passa em 2027',
     'machado-de-assis_missa-do-galo', _troca(BASE, 'autor_morte: 1908', 'autor_morte: 1956'),
     2027, None),

    # G3: coautoria, com a conta feita pelo que morreu depois
    ('G3 coautoria com lista de anos passa pelo maior',
     'machado-de-assis_missa-do-galo', _troca(BASE, 'autor_morte: 1908', 'autor_morte: 1908, 1940'),
     2026, None),
    ('G3 coautoria em que o segundo autor ainda nao caiu reprova',
     'machado-de-assis_missa-do-galo', _troca(BASE, 'autor_morte: 1908', 'autor_morte: 1908, 1960'),
     2026, 'ainda nao esta em dominio publico'),

    # F6: a traducao tem direito proprio
    ('F6 traducao com tradutor morto em 1930 passa',
     'andersen_o-patinho-feio', TRADUZIDA, 2026, None),
    ('F6 tradutor sem tradutor_morte reprova',
     'andersen_o-patinho-feio', _sem_linha(TRADUZIDA, 'tradutor_morte:'),
     2026, 'tradutor exige tradutor_morte'),
    ('F6 tradutor morto em 1990 reprova',
     'andersen_o-patinho-feio', _troca(TRADUZIDA, 'tradutor_morte: 1930', 'tradutor_morte: 1990'),
     2026, 'a traducao ainda nao esta em dominio publico'),

    # F7: cc exige o nome da licenca e o endereco
    ('F7 licenca CC com endereco passa',
     'verbete_gato-do-mato', CREATIVE, 2026, None),
    ('F7 licenca "livre" reprova',
     'verbete_gato-do-mato', _troca(CREATIVE, 'licenca: CC BY 4.0', 'licenca: livre'),
     2026, 'comecando por "CC "'),
    ('F7 procedencia sem endereco reprova',
     'verbete_gato-do-mato',
     _troca(CREATIVE, 'procedencia: enciclopédia aberta, consultada em 08/09/2026, '
                      'https://exemplo.org/gato',
            'procedencia: enciclopédia aberta, consultada em 08/09/2026'),
     2026, 'exige procedencia com endereco'),

    # F8: autoral nao tem ano de morte
    ('F8 texto autoral limpo passa',
     'escrito_bilhete-da-geladeira', AUTORAL, 2026, None),
    ('F8 texto autoral com autor_morte reprova',
     'escrito_bilhete-da-geladeira',
     _troca(AUTORAL, 'dominio: autoral', 'dominio: autoral\nautor_morte: 1955'),
     2026, 'nao pode ter autor_morte'),

    # G3: tradicional, sem autor conhecido e sem ano de morte
    ('G3 cantiga tradicional sem autor passa',
     'tradicao-popular_a-canoa-virou', TRADICIONAL, 2026, None),
    ('G3 cantiga tradicional com autor_morte reprova',
     'tradicao-popular_a-canoa-virou',
     _troca(TRADICIONAL, 'dominio: tradicional', 'dominio: tradicional\nautor_morte: 1938'),
     2026, 'nao pode ter autor_morte'),

    # F9: cada linha cabe na largura do bloco de citacao, medida pelo pdf.js
    ('F9 linha de oitenta caracteres passa',
     'machado-de-assis_missa-do-galo',
     _troca(BASE, 'dormir; combinei que eu iria acordá-lo à meia-noite.', LINHA_ESTREITA),
     2026, None),
    ('F9 linha de cento e quarenta caracteres reprova',
     'machado-de-assis_missa-do-galo',
     _troca(BASE, 'dormir; combinei que eu iria acordá-lo à meia-noite.', LINHA_LARGA),
     2026, 'passa da largura do bloco de citacao'),

    # F10: o cabecalho nao tem travessao; o corpo tem, porque e texto de autor
    ('F10 travessao no corpo passa',
     'machado-de-assis_missa-do-galo',
     _troca(BASE, 'Era noite de Natal.', 'Era noite de Natal ' + TRAVESSAO + ' lembro bem.'),
     2026, None),
    ('F10 travessao no titulo reprova',
     'machado-de-assis_missa-do-galo',
     _troca(BASE, 'titulo: Missa do galo', 'titulo: Missa do galo ' + TRAVESSAO + ' conto'),
     2026, 'travessao no campo "titulo"'),

    # F11: campos obrigatorios e valores fechados
    ('F11 fonte completa passa',
     'machado-de-assis_missa-do-galo', BASE, 2026, None),
    ('F11 sem procedencia reprova',
     'machado-de-assis_missa-do-galo', _sem_linha(BASE, 'procedencia:'),
     2026, 'falta o campo "procedencia"'),
    ('F11 sem genero reprova',
     'machado-de-assis_missa-do-galo', _sem_linha(BASE, 'genero:'),
     2026, 'falta o campo "genero"'),
    ('F11 genero fora da lista reprova',
     'machado-de-assis_missa-do-galo', _troca(BASE, 'genero: conto', 'genero: romance'),
     2026, 'genero invalido'),
    ('F11 dominio fora da lista reprova',
     'machado-de-assis_missa-do-galo', _troca(BASE, 'dominio: publico', 'dominio: outro'),
     2026, 'dominio invalido'),
    ('F11 integral fora de sim e nao reprova',
     'machado-de-assis_missa-do-galo', _troca(BASE, 'integral: nao', 'integral: talvez'),
     2026, 'so aceita sim ou nao'),
    ('F11 ano que nao e numero reprova',
     'machado-de-assis_missa-do-galo', _troca(BASE, 'ano: 1899', 'ano: fim do seculo'),
     2026, 'tem que ser um numero inteiro'),

    # L3: o corpo e feito de linhas com texto e linhas vazias, e de mais nada
    ('L3 tab no corpo reprova',
     'machado-de-assis_missa-do-galo',
     _troca(BASE, 'anos, contava eu', chr(9) + 'anos, contava eu'),
     2026, 'tab ou espaco solto'),
    ('L3 linha so de espacos reprova',
     'machado-de-assis_missa-do-galo',
     _troca(BASE, 'Era noite de Natal.\n\nHavendo', 'Era noite de Natal.\n   \nHavendo'),
     2026, 'tab ou espaco solto'),

    # o nome do arquivo e o id
    ('o id diferente do nome do arquivo reprova',
     'machado-de-assis_missa-do-galo',
     _troca(BASE, 'id: machado-de-assis_missa-do-galo', 'id: machado_missa'),
     2026, 'nao bate com o nome do arquivo'),
]


def escrever(pasta, ident, texto):
    caminho = os.path.join(pasta, '%s.md' % ident)
    io.open(caminho, 'w', encoding='utf-8', newline='\n').write(texto)
    return caminho


def rodar():
    pasta = tempfile.mkdtemp(prefix='fontes_')
    falhas = 0
    total = 0
    try:
        for nome, ident, texto, ano, esperado in PARES:
            total += 1
            caminho = escrever(pasta, ident, texto)
            try:
                erros = verificar.problemas_na_fonte(caminho, ano)
            except Exception as e:
                erros = ['erro inesperado: %s' % e]
            juntos = ' | '.join(erros)
            if esperado is None:
                ok = not erros
                verbo = 'passa'
            else:
                ok = esperado.lower() in juntos.lower()
                verbo = 'pega'
            if ok:
                print('  OK     %s: %s' % (verbo, nome))
            else:
                print('  FALHA  %s' % nome)
                print('         esperava %s, obteve "%s"'
                      % ('passar limpo' if esperado is None else 'conter "%s"' % esperado,
                         juntos[:200]))
                falhas += 1

        # A numeracao das linhas e o que o exercicio cita: ela conta so as
        # linhas com texto, e a fatia devolve as vazias do meio e nenhuma das
        # pontas. Um erro aqui faria "linha 12" apontar outro verso.
        caminho = escrever(pasta, 'machado-de-assis_missa-do-galo', BASE)
        cab, linhas = verificar.ler_fonte(caminho)
        numeros = [n for n, _ in verificar.numerar(linhas)]
        casos = [
            ('a numeracao pula a linha em branco', numeros, [1, 2, None, 3, 4]),
            ('a fatia de 1 a 2 nao traz a linha em branco do fim',
             verificar.fatia(linhas, 1, 2), linhas[0:2]),
            ('a fatia de 1 a 3 traz a linha em branco do meio',
             verificar.fatia(linhas, 1, 3), linhas[0:2] + [''] + linhas[3:4]),
            ('a fatia de 3 a 4 comeca depois da linha em branco',
             verificar.fatia(linhas, 3, 4), linhas[3:5]),
        ]
        for nome, obtido, esperado in casos:
            total += 1
            if obtido == esperado:
                print('  OK     %s' % nome)
            else:
                print('  FALHA  %s' % nome)
                print('         esperava %s, obteve %s' % (esperado, obtido))
                falhas += 1
    finally:
        shutil.rmtree(pasta, ignore_errors=True)

    print('')
    print('=' * 60)
    if falhas:
        print('%d defeito(s) de fonte passaram sem ser notados.' % falhas)
    else:
        print('As travas da colecao de fontes resolveram os %d pares e as 4 contas '
              'de numeracao.' % len(PARES))
    print('%d passaram, %d falharam.' % (total - falhas, falhas))
    print('=' * 60)
    return 1 if falhas else 0


if __name__ == '__main__':
    sys.exit(rodar())
