# -*- coding: utf-8 -*-
"""
Testa o verificador com temas propositalmente defeituosos.

Um verificador que nunca reprova nada nao prova nada. Aqui cada defeito que ele
deveria pegar e injetado de proposito, e o teste falha se ele deixar passar.

Toda trava nasce com o par envenenado: o caso que TEM que reprovar e o caso
saudavel ao lado, que tem que passar. Trava que so sabe passar nao e trava, e
trava que so sabe reprovar tambem nao.

Os casos nascem em <tmp>/<pasta>/<serie>/<ID>.md, porque a materia vem do
caminho: mat/06/ e matematica, por/06/ e portugues, e uma pasta que a tabela
nao conhece e defeito por si.
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
RETICENCIAS = u'\u2026'

BASE = """---
id: MAT06-99
serie: 06
unidade: numeros
titulo_pt: Tema de teste
titulo_en: Test theme
resumo_pt: Um resumo.
resumo_en: A summary.
prerequisitos: []
duracao_min: 60
dificuldade: 2
---

## PT

### Explicação

Texto de explicação com um exemplo. Metade de 10 é 5.

### Exercícios

1. Quanto é 1/2 mais 1/3?
2. Resolva 3x mais 5 igual a 20.

### Gabarito

1. 5/6
2. x igual a 5

## EN

### Explanation

Explanation text with an example. Half of 10 is 5.

### Exercises

1. How much is 1/2 plus 1/3?
2. Solve 3x plus 5 equals 20.

### Answer key

1. 5/6
2. x equals 5

## VERIFICACAO

```python
E1: Rational(1,2) + Rational(1,3) == Rational(5,6)
E2: solve(Eq(3*x + 5, 20), x) == [5]
```
"""

# As fontes que os temas de teste citam. Elas vivem aqui, e nao em fontes/, de
# proposito: o teste grava uma raiz de mentira em <tmp>/fontes/ e aponta o
# verificador para ela, para provar F1 e F2 sem deixar texto falso no
# repositorio. O corpo da fonte e o que a trava de fidelidade compara linha a
# linha com o bloco citado no tema.
FONTE_CONTO = """---
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
dormir; combinei que eu iria acordá-lo à meia-noite, e fui bater à
porta dele na hora certa.

A casa em que eu estava hospedado era a do escrivão Meneses, que
fora casado, em primeiras núpcias, com uma de minhas primas. A
segunda mulher, Conceição, e a mãe desta acolheram-me bem.
"""

FONTE_BILHETE = """---
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

# A fonte que carrega travessao e reticencias no corpo, que e o que a isencao
# de citacao existe para proteger. O cabecalho dela continua limpo.
FONTE_DIALOGO = """---
id: escrito_dialogo-de-teste
titulo: Diálogo de teste
autor: escrito para o exercício
ano: 2026
genero: teatro
dominio: autoral
licenca: escrito para este banco, uso livre
procedencia: escrito pela frente 2 em 08/09/2026 para as provas do verificador
integral: sim
---

""" + TRAVESSAO + """ Vou contar o caso, disse ele""" + RETICENCIAS + """ mas não sei se devo.
Os outros esperavam em silêncio, sem pressa nenhuma.
"""

FONTES = {
    'machado-de-assis_missa-do-galo': FONTE_CONTO,
    'escrito_bilhete-da-geladeira': FONTE_BILHETE,
    'escrito_dialogo-de-teste': FONTE_DIALOGO,
}

# O bloco de citacao da explicacao do tema de teste, copia exata das linhas 1 e
# 2 do conto. Trocar uma palavra dele e o veneno de F2.
BLOCO_CONTO = """@fonte machado-de-assis_missa-do-galo linhas=1-2
> Nunca pude entender a conversação que tive com uma senhora, há muitos
> anos, contava eu dezessete, ela trinta. Era noite de Natal."""

BLOCO_DIALOGO = ("""@fonte escrito_dialogo-de-teste linhas=1-2
> """ + TRAVESSAO + """ Vou contar o caso, disse ele""" + RETICENCIAS +
                 """ mas não sei se devo.
> Os outros esperavam em silêncio, sem pressa nenhuma.""")

# Um tema de portugues: so pt, unidade da propria materia, topicos do catalogo,
# cobertura declarada e um trecho de autor em bloco de citacao com fonte.
BASE_POR = """---
id: POR06-99
serie: 06
unidade: leitura
titulo_pt: Tema de teste de português
resumo_pt: Um resumo.
prerequisitos: []
topicos: [POR06-T01, POR06-T02]
bncc: [EF67LP28]
vestibular: []
duracao_min: 60
dificuldade: 2
---

## PT

### Explicação

Texto de explicação sobre um conto. A ideia principal fica clara no primeiro parágrafo.

""" + BLOCO_CONTO + """

### Exercícios

@fonte machado-de-assis_missa-do-galo linhas=1-5
> Nunca pude entender a conversação que tive com uma senhora, há muitos
> anos, contava eu dezessete, ela trinta. Era noite de Natal.
>
> Havendo ajustado com um vizinho irmos à missa do galo, preferi não
> dormir; combinei que eu iria acordá-lo à meia-noite, e fui bater à
> porta dele na hora certa.

1. Explique por que a lembrança do narrador vem acompanhada de dúvida.
2. Na linha 2, a expressão "contava eu dezessete" indica
   a) o valor da conta que o narrador pagou naquela noite.
   b) a idade que o narrador tinha na noite descrita.
   c) o número de convidados que estavam na ceia.
   d) a hora em que a missa do galo começou.

### Gabarito

1. espera_se: que o aluno perceba que o narrador conta a história muitos anos
   depois, já adulto, e por isso a lembrança vem com dúvida.
   aceita_se:
   - dizer que ele era jovem na época e escreve mais velho
   - apontar a distância de tempo sem falar em idade
   nao_aceita:
   - dizer que a história acontece no presente
   - dizer que o narrador tem trinta anos
   ancora: Nunca pude entender a conversação que tive com uma senhora, há muitos anos
2. b
   ancora: contava eu dezessete, ela trinta
   porque: "contar anos" é ter idade, e a frase compara as duas idades.

## VERIFICACAO

```python
E1: 1 == 1  # manual: interpretacao de texto
E2: 1 == 1  # manual: leitura do trecho
```
"""

# O caso de ponta a ponta: texto de apoio na lista, questao fechada, questao
# aberta, bloco dentro de um item e explicacao com citacao. E dele que sai o
# JSON conferido no fim, e e nele que G8 se prova: entre a questao 6 e a 7 ha um
# bloco em coluna zero, e o enunciado da 6 tem que sair sem nenhum sinal dele.
# Nao entra no repositorio: vive aqui e e gravado em pasta temporaria.
BASE_POR7 = """---
id: POR07-99
serie: 07
unidade: leitura
titulo_pt: O narrador que lembra
resumo_pt: Como o intervalo entre o fato e a lembrança muda o que o narrador conta.
prerequisitos: []
topicos: [POR07-T01]
bncc: [EF67LP28, EF69LP47]
vestibular: [inferência de ironia em narrador não confiável]
duracao_min: 60
dificuldade: 2
---

## PT

### Explicação

O narrador de primeira pessoa conta o que viveu, mas conta *depois*. Entre o
fato e a lembrança há um intervalo, e é nele que mora a dúvida.

""" + BLOCO_CONTO + """

Repare em **quem** fala e em quando fala.

### Exercícios

**Bloco A. Fundamentos**

@fonte machado-de-assis_missa-do-galo linhas=1-5
> Nunca pude entender a conversação que tive com uma senhora, há muitos
> anos, contava eu dezessete, ela trinta. Era noite de Natal.
>
> Havendo ajustado com um vizinho irmos à missa do galo, preferi não
> dormir; combinei que eu iria acordá-lo à meia-noite, e fui bater à
> porta dele na hora certa.

1. Explique por que a lembrança do narrador vem acompanhada de dúvida.
2. Na linha 2, a expressão "contava eu dezessete" indica
   a) o valor da conta que o narrador pagou naquela noite.
   b) a idade que o narrador tinha na noite descrita.
   c) o número de convidados que estavam na ceia.
   d) a hora em que a missa do galo começou.
3. Nas linhas 3 a 5, o narrador conta um combinado. Diga qual é.
4. O que a escolha de não dormir revela sobre o narrador?
5. Copie a passagem em que ele diz a própria idade.
6. Explique o efeito de o narrador dizer as duas idades de uma vez.

**Bloco B. Consolidação**

@fonte escrito_bilhete-da-geladeira linhas=1-2
> Mãe, peguei o último iogurte de morango. Deixei o de coco para você.
> Volto do treino às seis e meia.

7. No bilhete, o que a segunda frase acrescenta à primeira?
8. Leia o trecho e diga o que essa apresentação prepara na narrativa.
   @fonte machado-de-assis_missa-do-galo linhas=6-8
   > A casa em que eu estava hospedado era a do escrivão Meneses, que
   > fora casado, em primeiras núpcias, com uma de minhas primas. A
   > segunda mulher, Conceição, e a mãe desta acolheram-me bem.

### Gabarito

1. espera_se: que o aluno perceba que o narrador conta a história muitos anos
   depois, já adulto, e por isso a lembrança vem com dúvida.
   aceita_se:
   - dizer que ele era jovem na época e escreve mais velho
   - apontar a distância de tempo sem falar em idade
   nao_aceita:
   - dizer que a história acontece no presente
   - dizer que o narrador tem trinta anos
   ancora: Nunca pude entender a conversação que tive com uma senhora, há muitos anos
2. b
   ancora: contava eu dezessete, ela trinta
   porque: "contar anos" é ter idade, e a frase compara as duas idades.
3. espera_se: que o aluno diga que os dois combinaram ir juntos à missa do galo
   e que o narrador ficaria acordado para chamar o vizinho na hora.
   aceita_se:
   - dizer que ele iria acordar o vizinho à meia-noite
   - dizer que preferiu não dormir para não perder a hora
   nao_aceita:
   - dizer que o vizinho é que iria acordá-lo
   - dizer que os dois foram dormir cedo
   ancora: Havendo ajustado com um vizinho irmos à missa do galo, preferi não dormir
4. espera_se: que o aluno perceba cuidado com o combinado, alguém que assume a
   responsabilidade de manter a hora marcada.
   aceita_se:
   - dizer que ele é responsável pelo que combinou
   - dizer que ele não quis correr o risco de dormir demais
   nao_aceita:
   - dizer que ele não tinha sono
   - dizer que ele não gostava de dormir
   ancora: preferi não dormir; combinei que eu iria acordá-lo à meia-noite
5. espera_se: que o aluno copie a passagem em que o narrador diz ter dezessete anos.
   aceita_se:
   - copiar a frase inteira, com as duas idades
   - copiar só a parte que diz a idade dele
   nao_aceita:
   - copiar a frase sobre a noite de Natal
   - responder com a idade em número, sem a passagem
   ancora: contava eu dezessete, ela trinta
6. espera_se: que o aluno perceba que dizer as duas idades juntas põe a
   distância entre os dois em primeiro plano.
   aceita_se:
   - dizer que a diferença de idade fica em evidência
   - dizer que a comparação aproxima e afasta os dois ao mesmo tempo
   nao_aceita:
   - dizer que as idades são iguais
   - dizer que a idade não importa no texto
   ancora: contava eu dezessete, ela trinta
7. espera_se: que o aluno perceba que a segunda frase avisa a hora da volta e
   completa o recado deixado na primeira.
   aceita_se:
   - dizer que ela informa quando ele volta
   - dizer que ela evita que a mãe fique preocupada
   nao_aceita:
   - dizer que a segunda frase repete a primeira
   - dizer que ela pede o iogurte de volta
   ancora: Volto do treino às seis e meia
8. espera_se: que o aluno perceba que a apresentação da casa e das duas mulheres
   prepara o encontro que o conto vai narrar.
   aceita_se:
   - dizer que o narrador situa onde estava hospedado
   - dizer que Conceição é apresentada antes de aparecer na cena
   nao_aceita:
   - dizer que o narrador morava sozinho
   - dizer que Conceição era a primeira mulher do escrivão
   ancora: segunda mulher, Conceição, e a mãe desta acolheram-me bem
"""

SECAO_EN = """
## EN

### Explanation

Explanation text.

### Exercises

1. What is the main idea?
2. Which word repeats?

### Answer key

1. Open answer.
2. The word time.
"""

CASOS = [
    (
        'gabarito errado, conta bate mas o numero escrito nao',
        lambda t: t.replace('E1: Rational(1,2) + Rational(1,3) == Rational(5,6)',
                            'E1: Rational(1,2) + Rational(1,3) == Rational(4,6)'),
        'E1 deu falso',
    ),
    (
        'numeros diferentes entre as duas linguas',
        lambda t: t.replace('1. How much is 1/2 plus 1/3?', '1. How much is 1/2 plus 1/4?'),
        'usa numeros diferentes nas duas linguas',
    ),
    (
        'resposta diferente entre as duas linguas',
        lambda t: t.replace('### Answer key\n\n1. 5/6', '### Answer key\n\n1. 7/6'),
        'a resposta 1 difere entre as linguas',
    ),
    (
        'quantidade de respostas nao bate com a de exercicios',
        lambda t: t.replace('### Gabarito\n\n1. 5/6\n2. x igual a 5', '### Gabarito\n\n1. 5/6'),
        'exercicios em portugues para',
    ),
    (
        'travessao no texto',
        lambda t: t.replace('Texto de explicação com um exemplo.',
                            'Texto de explicação ' + TRAVESSAO + ' com um exemplo.'),
        'travessao',
    ),
    (
        'rascunho do autor deixado no material',
        lambda t: t.replace('Metade de 10 é 5.',
                            'Metade de 10 é 4? não: metade de 10 é 5.'),
        'possivel rascunho',
    ),
    (
        'marca de item por preencher',
        lambda t: t.replace('Metade de 10 é 5.', 'Metade de 10 é [inserir valor aqui].'),
        'possivel rascunho',
    ),
    (
        'expressao de verificacao quebrada',
        lambda t: t.replace('E2: solve(Eq(3*x + 5, 20), x) == [5]',
                            'E2: solve(Eq(3*x + 5, 20), z'),
        'nao pode ser avaliado',
    ),
    (
        'falta a secao em ingles',
        lambda t: t.split('## EN')[0] + '## VERIFICACAO\n\n```python\nE1: 1 == 1\n```\n',
        'falta a secao EN',
    ),
    (
        'id nao bate com o nome do arquivo',
        lambda t: t.replace('id: MAT06-99', 'id: MAT06-98'),
        'nao bate com o nome do arquivo',
    ),
    (
        'unidade invalida',
        lambda t: t.replace('unidade: numeros', 'unidade: aritmetica'),
        'unidade invalida',
    ),
]


def _com_citacao(texto, bloco):
    """Troca o bloco de citacao da explicacao por outro."""
    return texto.replace(BLOCO_CONTO, bloco)


def _sem_linha(texto, comeco):
    return '\n'.join(l for l in texto.split('\n') if not l.startswith(comeco))


def _com_fechadas(texto, letras):
    """Troca os itens 3, 4 e 5 do BASE_POR7 (abertos) por fechados com quatro alternativas,
    cada um com a letra certa dada em `letras`; com o item 2, que ja e fechado em b, o tema
    fica com quatro fechadas. E a prova da trava E7 nos dois sentidos."""
    import re as _re
    saida = texto
    for n, letra in zip((3, 4, 5), letras):
        # o enunciado ganha quatro alternativas
        padrao = _re.compile(r'^(%d\. [^\n]*)$' % n, _re.M)
        achado = padrao.search(saida)
        assert achado, 'BASE_POR7 sem o item %d' % n
        alternativas = '\n'.join('   %s) resposta %s, numero %d de quatro.' % (l, l, n) for l in 'abcd')
        saida = saida[:achado.end()] + '\n' + alternativas + saida[achado.end():]
        # o gabarito vira a letra
        bloco = _re.compile(r'^%d\. espera_se:.*?(?=^\d+\. |\Z)' % n, _re.M | _re.S)
        achado = bloco.search(saida)
        assert achado, 'BASE_POR7 sem o gabarito %d' % n
        saida = saida[:achado.start()] + '%d. %s\n\n' % (n, letra) + saida[achado.end():]
    return saida


def _troca(texto, de, para):
    if de not in texto:
        raise SystemExit('o teste esta desatualizado: nao achei "%s" no tema' % de[:60])
    return texto.replace(de, para)


# Os pares por materia. Cada item e (descricao, caminho dentro do tmp, texto,
# erro esperado ou None quando tem que passar, aviso esperado ou None).
# Quando o erro esperado e None e o aviso tambem, o tema tem que passar limpo.
PARES = [
    # ingles e propriedade da materia
    ('por: tema so em portugues, sem secao EN, passa',
     'por/06/POR06-99.md', BASE_POR, None, None),
    ('por: secao EN sobrando nao reprova, mas avisa',
     'por/06/POR06-99.md', BASE_POR.replace('## VERIFICACAO', SECAO_EN.strip() + '\n\n## VERIFICACAO'),
     None, 'a secao EN existe'),
    ('mat: sem secao EN reprova (materia bilingue)',
     'mat/06/MAT06-99.md', BASE.split('## EN')[0] + '## VERIFICACAO\n\n```python\nE1: 2 > 1\n```\n',
     'falta a secao EN', None),

    # unidade e da materia do caminho
    ('por: unidade de matematica reprova',
     'por/06/POR06-99.md', BASE_POR.replace('unidade: leitura', 'unidade: numeros'),
     'unidade invalida', None),
    ('por: outra unidade da propria materia passa',
     'por/06/POR06-99.md', BASE_POR.replace('unidade: leitura', 'unidade: analise'), None, None),

    # travessao e reticencias: so dentro de citacao marcada, so em materia com citacao
    ('por: travessao fora da citacao reprova',
     'por/06/POR06-99.md',
     BASE_POR.replace('A ideia principal fica clara', 'A ideia principal ' + TRAVESSAO + ' fica clara'),
     'travessao', None),
    ('por: travessao e reticencias dentro da citacao passam',
     'por/06/POR06-99.md', _com_citacao(BASE_POR, BLOCO_DIALOGO), None, None),
    ('por: reticencias fora da citacao reprovam',
     'por/06/POR06-99.md',
     BASE_POR.replace('fica clara no primeiro parágrafo.', 'fica clara' + RETICENCIAS + ' no primeiro parágrafo.'),
     'reticencias', None),
    ('por: sinal de citacao sem o espaco nao e citacao, travessao reprova',
     'por/06/POR06-99.md',
     _com_citacao(BASE_POR, BLOCO_DIALOGO.replace('\n> ', '\n>')),
     'travessao', None),
    ('por: sinal de citacao indentado demais reprova',
     'por/06/POR06-99.md',
     _com_citacao(BASE_POR, BLOCO_CONTO.replace('\n> ', '\n    > ')),
     'indentado demais', None),
    ('mat: travessao dentro de citacao reprova mesmo assim (citacao: false)',
     'mat/06/MAT06-99.md',
     BASE.replace('Texto de explicação com um exemplo.',
                  'Texto de explicação com um exemplo.\n\n> Texto de autor ' + TRAVESSAO + ' citado.'),
     'travessao', None),

    # topicos: obrigatorio onde ha catalogo, proibido onde nao ha
    ('por: sem topicos reprova',
     'por/06/POR06-99.md', _sem_linha(BASE_POR, 'topicos:'), 'falta o campo "topicos"', None),
    ('por: topicos vazio reprova',
     'por/06/POR06-99.md', BASE_POR.replace('topicos: [POR06-T01, POR06-T02]', 'topicos: []'),
     'esta vazia', None),
    ('por: topico sem -T (forma de tema) reprova',
     'por/06/POR06-99.md', BASE_POR.replace('topicos: [POR06-T01, POR06-T02]', 'topicos: [POR06-01]'),
     'fora da forma', None),
    ('por: topico com prefixo de outra materia reprova',
     'por/06/POR06-99.md', BASE_POR.replace('topicos: [POR06-T01, POR06-T02]', 'topicos: [MAT06-T01]'),
     'fora da forma', None),
    ('por: topico repetido reprova',
     'por/06/POR06-99.md', BASE_POR.replace('topicos: [POR06-T01, POR06-T02]', 'topicos: [POR06-T01, POR06-T01]'),
     'repetido', None),
    ('por: topico de outra serie passa (revisao atravessa anos)',
     'por/06/POR06-99.md', BASE_POR.replace('topicos: [POR06-T01, POR06-T02]', 'topicos: [POR05-T03, POREM1-T12]'),
     None, None),
    ('mat: com topicos reprova (matematica nao tem catalogo)',
     'mat/06/MAT06-99.md', BASE.replace('prerequisitos: []', 'prerequisitos: []\ntopicos: [MAT06-T01]'),
     'nao tem catalogo de topicos', None),

    # identificador
    ('id com -T reprova (forma de identificador de topico)',
     'mat/06/MAT06-T99.md', BASE.replace('id: MAT06-99', 'id: MAT06-T99'),
     'identificador de topico', None),
    ('id com prefixo de outra materia na pasta reprova',
     'mat/06/POR06-99.md', BASE.replace('id: MAT06-99', 'id: POR06-99'),
     'nao comeca com o prefixo MAT', None),
    ('serie no id diferente do campo serie reprova',
     'mat/06/MAT07-99.md', BASE.replace('id: MAT06-99', 'id: MAT07-99'),
     'nao bate com o campo serie', None),
    ('arquivo na pasta de outra serie reprova',
     'mat/07/MAT06-99.md', BASE, 'pasta da serie 07', None),
    ('id de ensino medio na forma do MAT passa',
     'mat/em2/MATEM2-99.md', BASE.replace('id: MAT06-99', 'id: MATEM2-99').replace('serie: 06', 'serie: em2'),
     None, None),

    # a pasta e a materia
    ('arquivo em pasta desconhecida reprova e diz quais pastas existem',
     'xyz/06/MAT06-99.md', BASE, 'mat, por, lit', None),

    # F1: a citacao aponta um arquivo que existe em fontes/
    ('F1: @fonte que aponta arquivo inexistente reprova',
     'por/06/POR06-99.md',
     _com_citacao(BASE_POR, BLOCO_CONTO.replace('machado-de-assis_missa-do-galo',
                                                'autor-que-nao-existe_conto')),
     'nao existe em fontes/', None),

    # F2: o bloco e copia exata das linhas a ate b da fonte
    ('F2: uma palavra trocada no bloco reprova',
     'por/06/POR06-99.md',
     _com_citacao(BASE_POR, BLOCO_CONTO.replace('noite de Natal', 'noite de festa')),
     'nao e copia exata', None),
    ('F2: bloco de duas linhas declarado com linhas=1-1 reprova',
     'por/06/POR06-99.md',
     _com_citacao(BASE_POR, BLOCO_CONTO.replace('linhas=1-2', 'linhas=1-1')),
     'linha a mais', None),
    ('F2: linha em branco a menos no bloco reprova',
     'por/06/POR06-99.md',
     _troca(BASE_POR, '> anos, contava eu dezessete, ela trinta. Era noite de Natal.\n>\n',
            '> anos, contava eu dezessete, ela trinta. Era noite de Natal.\n'),
     'nao e copia exata', None),

    # F3: nao existe citacao sem fonte
    ('F3: bloco de citacao solto, sem @fonte, reprova',
     'por/06/POR06-99.md',
     _com_citacao(BASE_POR, '\n'.join(BLOCO_CONTO.split('\n')[1:])),
     'sem @fonte', None),

    # F4: em matematica a diretiva nao existe
    ('F4: mat com @fonte reprova',
     'mat/06/MAT06-99.md',
     BASE.replace('Texto de explicação com um exemplo.',
                  'Texto de explicação com um exemplo.\n\n@fonte escrito_bilhete-da-geladeira linhas=1-1'),
     'materia sem citacao', None),

    # C1: a cobertura declarada, e a forma e a existencia do codigo
    ('C1: sem bncc reprova',
     'por/06/POR06-99.md', _sem_linha(BASE_POR, 'bncc:'), 'falta o campo "bncc"', None),
    ('C1: sem vestibular reprova',
     'por/06/POR06-99.md', _sem_linha(BASE_POR, 'vestibular:'),
     'falta o campo "vestibular"', None),
    ('C1: as duas listas vazias reprovam',
     'por/06/POR06-99.md', _troca(BASE_POR, 'bncc: [EF67LP28]', 'bncc: []'),
     'as duas vazias', None),
    ('C1: so vestibular preenchido passa',
     'por/06/POR06-99.md',
     _troca(_troca(BASE_POR, 'bncc: [EF67LP28]', 'bncc: []'),
            'vestibular: []', 'vestibular: [leitura de narrador em primeira pessoa]'),
     None, None),
    ('C1: codigo fora da forma reprova',
     'por/06/POR06-99.md', _troca(BASE_POR, 'bncc: [EF67LP28]', 'bncc: [EF67LP]'),
     'fora da forma', None),
    ('C1: EM12LP01 tem a cara certa e nao existe: reprova',
     'por/06/POR06-99.md', _troca(BASE_POR, 'bncc: [EF67LP28]', 'bncc: [EM12LP01]'),
     'fora da forma', None),
    ('C1: codigo com a forma certa e fora da tabela reprova',
     'por/06/POR06-99.md', _troca(BASE_POR, 'bncc: [EF67LP28]', 'bncc: [EF67LP99]'),
     'nao existe na tabela', None),
    ('C1: codigo de outra serie passa e avisa (revisao atravessa anos)',
     'por/06/POR06-99.md', _troca(BASE_POR, 'bncc: [EF67LP28]', 'bncc: [EF89LP01]'),
     None, 'e das series'),
    ('C1: vestibular separa itens por ponto e virgula',
     'por/06/POR06-99.md',
     _troca(_troca(BASE_POR, 'bncc: [EF67LP28]', 'bncc: []'), 'vestibular: []',
            'vestibular: [ironia, com narrador nao confiavel; ambiguidade do pronome]'),
     None, None),

    # C2: matematica nao declara cobertura
    ('C2: mat com bncc reprova',
     'mat/06/MAT06-99.md', BASE.replace('prerequisitos: []', 'prerequisitos: []\nbncc: [EF67LP28]'),
     'nao tem catalogo de topicos', None),

    # E1: quatro ou cinco alternativas, em ordem, sem pular
    ('E1: tres alternativas reprovam',
     'por/06/POR06-99.md',
     _sem_linha(BASE_POR, '   d) a hora em que a missa'), 'tem 3 alternativas', None),
    ('E1: alternativa pulada reprova',
     'por/06/POR06-99.md',
     _troca(BASE_POR, '   c) o número de convidados que estavam na ceia.',
            '   e) o número de convidados que estavam na ceia.'),
     'fora de ordem ou pulam letra', None),

    # E2: alternativas e letra andam juntas
    ('E2: alternativas com gabarito em frase reprovam',
     'por/06/POR06-99.md',
     _troca(BASE_POR, '2. b\n   ancora: contava eu dezessete, ela trinta',
            '2. A alternativa certa fala da idade.\n   ancora: contava eu dezessete, ela trinta'),
     'resposta corrida', None),
    ('E2: gabarito em letra sem alternativas reprova',
     'por/06/POR06-99.md',
     _sem_linha(_sem_linha(_sem_linha(_sem_linha(
         BASE_POR, '   a) o valor da conta'), '   b) a idade que o narrador'),
         '   c) o número de convidados'), '   d) a hora em que a missa'),
     'nao tem alternativas', None),
    ('E2: letra fora das alternativas reprova',
     'por/06/POR06-99.md', _troca(BASE_POR, '2. b\n', '2. e\n'),
     'nao esta entre as alternativas', None),

    # E3: a aberta exige os quatro campos
    ('E3: aberta sem nao_aceita reprova',
     'por/06/POR06-99.md',
     _troca(BASE_POR, '   nao_aceita:\n   - dizer que a história acontece no presente\n'
                      '   - dizer que o narrador tem trinta anos\n', ''),
     'nao tem nao_aceita', None),
    ('E3: aceita_se sem nenhum item reprova',
     'por/06/POR06-99.md',
     _troca(BASE_POR, '   aceita_se:\n   - dizer que ele era jovem na época e escreve mais velho\n'
                      '   - apontar a distância de tempo sem falar em idade\n',
            '   aceita_se:\n'),
     'nao tem aceita_se', None),
    ('E3: aberta sem ancora reprova',
     'por/06/POR06-99.md',
     _sem_linha(BASE_POR, '   ancora: Nunca pude entender'), 'nao tem ancora', None),

    # E4 e M5: a ancora e trecho literal de um paragrafo do texto do item
    ('E4: ancora com uma palavra trocada reprova',
     'por/06/POR06-99.md',
     _troca(BASE_POR, '   ancora: contava eu dezessete, ela trinta',
            '   ancora: contava eu dezoito, ela trinta'),
     'nao esta no texto do item', None),
    ('E4: ancora tirada de outro texto reprova',
     'por/06/POR06-99.md',
     _troca(BASE_POR, '   ancora: contava eu dezessete, ela trinta',
            '   ancora: Volto do treino às seis e meia'),
     'nao esta no texto do item', None),
    ('M5: ancora de duas palavras reprova',
     'por/06/POR06-99.md',
     _troca(BASE_POR, '   ancora: contava eu dezessete, ela trinta', '   ancora: ela trinta'),
     'menos de tres palavras', None),
    ('M5: ancora que atravessa linha em branco reprova',
     'por/06/POR06-99.md',
     _troca(BASE_POR, '   ancora: contava eu dezessete, ela trinta',
            '   ancora: Era noite de Natal. Havendo ajustado com um vizinho'),
     'sem atravessar linha em branco', None),

    # E5: resposta corrida nao serve para interpretacao
    ('E5: gabarito corrido reprova',
     'por/06/POR06-99.md',
     _troca(BASE_POR, '2. b\n   ancora: contava eu dezessete, ela trinta\n'
                      '   porque: "contar anos" é ter idade, e a frase compara as duas idades.',
            '2. A ideia principal é a diferença de idade.'),
     'resposta corrida', None),

    # E6 e L1: o enunciado nunca cita o texto pelo numero
    ('E6: "no Texto 2" no enunciado reprova',
     'por/06/POR06-99.md',
     _troca(BASE_POR, '1. Explique por que a lembrança',
            '1. No Texto 2, explique por que a lembrança'),
     'cita "Texto 2"', None),

    # M6: a linha citada no enunciado cai dentro do trecho do item
    ('M6: linha fora do trecho reprova',
     'por/06/POR06-99.md', _troca(BASE_POR, '2. Na linha 2, a expressão', '2. Na linha 9, a expressão'),
     'fora das linhas 1 a 5', None),

    # M11 e G1: asterisco
    ('M11: mat com asterisco solto reprova',
     'mat/06/MAT06-99.md',
     BASE.replace('Texto de explicação com um exemplo.', 'Texto de explicação com *um exemplo.'),
     'asterisco solto', None),
    ('G1: por com negrito sem fechar reprova',
     'por/06/POR06-99.md',
     _troca(BASE_POR, 'Texto de explicação sobre um conto.', 'Texto de **explicação sobre um conto.'),
     'negrito sem fechar', None),
    ('G1: por com italico sem fechar reprova',
     'por/06/POR06-99.md',
     _troca(BASE_POR, 'Texto de explicação sobre um conto.', 'Texto de *explicação sobre um conto.'),
     'italico sem fechar', None),
    ('G1: por com negrito e italico fechados passa',
     'por/06/POR06-99.md',
     _troca(BASE_POR, 'Texto de explicação sobre um conto.',
            'Texto de ***explicação*** sobre um *conto* de **Machado**.'),
     None, None),

    # V1: a secao VERIFICACAO e opcional em materia so em portugues
    ('V1: por sem a secao VERIFICACAO passa limpo',
     'por/06/POR06-99.md', BASE_POR.split('## VERIFICACAO')[0].rstrip() + '\n', None, None),

    # G8 e G6: o tema completo, com bloco entre a questao 6 e a 7 e trecho
    # dentro do item 8
    ('G8: o tema completo de portugues passa',
     'por/07/POR07-99.md', BASE_POR7, None, None),
    ('por7: quatro fechadas com a mesma letra certa reprovam (E7)',
     'por/07/POR07-99.md', _com_fechadas(BASE_POR7, 'bbb'), 'resposta certa em 4 das 4', None),
    ('por7: quatro fechadas com letras espalhadas passam',
     'por/07/POR07-99.md', _com_fechadas(BASE_POR7, 'acd'), None, None),
    ('G8: bloco recuado no lugar do texto de apoio vira trecho do item e reprova',
     'por/07/POR07-99.md',
     _troca(BASE_POR7, '\n@fonte escrito_bilhete-da-geladeira linhas=1-2\n> Mãe',
            '\n   @fonte escrito_bilhete-da-geladeira linhas=1-2\n   > Mãe')
     .replace('> Volto do treino às seis e meia.', '   > Volto do treino às seis e meia.'),
     'nao esta', None),
    ('G6: a ancora do item com trecho proprio e conferida contra o trecho',
     'por/07/POR07-99.md',
     _troca(BASE_POR7, '   ancora: segunda mulher, Conceição, e a mãe desta acolheram-me bem',
            '   ancora: Volto do treino às seis e meia'),
     'nao esta no texto do item', None),
]


# Cada regra de deteccao de rascunho precisa de um caso proprio: uma regra que
# nunca dispara e uma regra que nao existe. Ja aconteceu de tres delas ficarem
# inertes por um escape trocado, sem ninguem perceber.
FRASES = [
    # precisam ser pegos
    ('Metade de 10 e 4? nao: metade e 5.', True, 'pergunta com autocorrecao'),
    ('O resultado e 12, ou melhor, 13.', True, 'ou melhor'),
    ('Isso vale... quase sempre.', True, 'reticencias'),
    ('Hmm, deixa eu ver esse caso.', True, 'conversa interna'),
    ('Espera, isso nao fecha.', True, 'espera como interjeicao'),
    ('Deixe o valor TODO por enquanto.', True, 'marca TODO em maiusculas'),
    ('Use [inserir valor aqui] na conta.', True, 'instrucao ao autor'),
    ('O texto esta como placeholder.', True, 'placeholder'),
    # precisam passar: sao portugues legitimo, e um verificador que grita
    # demais acaba ignorado
    ('Quase todo mundo aprende isso na escola.', False, 'a palavra todo'),
    ('O vertice resolve todo problema de maximo.', False, 'todo problema'),
    ('Esses casos aparecem o tempo todo em prova.', False, 'o tempo todo'),
    ('Isso quer dizer que nenhum numero serve.', False, 'quer dizer'),
    ('O aluno espera o resultado da prova.', False, 'espera como verbo'),
    ('A soma de 2 com 3 da 5, sem excecao.', False, 'texto limpo'),
]


def testar_frases():
    falhas = 0
    for texto, deveria, nome in FRASES:
        achou = bool(verificar.marcas_de_rascunho(texto))
        if achou == deveria:
            print('  OK     regra de rascunho: %s' % nome)
        else:
            print('  FALHA  regra de rascunho: %s (esperava %s)' % (nome, 'pegar' if deveria else 'passar'))
            falhas += 1
    return falhas


# O ambiente de verificacao tem duas decisoes que precisam ser preservadas.
# Um agente que escreveu os temas de numeros complexos avisou: se z virar real,
# os temas de raiz complexa quebram sem que ninguem entenda por que.
AMBIENTE_ESPERADO = [
    ("solve(Eq(Abs(2*x - 6), 4), x) == [1, 5]", True,
     "x precisa ser real, senao equacao com valor absoluto nao resolve"),
    ("set(solve(Eq(z**2 + 25, 0), z)) == set([5*I, -5*I])", True,
     "z precisa ficar complexo, senao as raizes complexas somem"),
    ("expand((1 + I)**2) == 2*I", True,
     "a unidade imaginaria precisa estar disponivel"),
    ("Rational(3)**(-2) == Rational(1,9)", True,
     "expoente negativo precisa dar fracao exata, nao float"),
    ("solveset(x**2 - 5*x + 6 < 0, x, Reals) == Interval.open(2, 3)", True,
     "inequacao precisa de solveset sobre os reais"),
    ("len(real_roots(x**2 + 2*x + 5)) == 0", True,
     "raiz real precisa ser contada por real_roots, nao por solve"),
]


def testar_ambiente():
    falhas = 0
    escopo = dict(verificar.AMBIENTE)
    escopo['__builtins__'] = {}
    for expressao, esperado, motivo in AMBIENTE_ESPERADO:
        try:
            obtido = bool(eval(expressao, dict(escopo)))
        except Exception as e:
            obtido = 'erro: %s' % e
        if obtido == esperado:
            print('  OK     ambiente: %s' % motivo)
        else:
            print('  FALHA  ambiente: %s' % motivo)
            print('         %s deu %s' % (expressao[:60], obtido))
            falhas += 1
    return falhas


def escrever(pasta, relativo, texto):
    """Grava o caso em <tmp>/<pasta>/<serie>/<ID>.md e devolve o caminho."""
    caminho = os.path.join(pasta, *relativo.split('/'))
    pasta_do_arquivo = os.path.dirname(caminho)
    if not os.path.isdir(pasta_do_arquivo):
        os.makedirs(pasta_do_arquivo)
    io.open(caminho, 'w', encoding='utf-8', newline='\n').write(texto)
    return caminho


def conferir_texto(caminho):
    """(erros como texto, avisos como texto) de um caso, tratando Problema como erro."""
    try:
        erros, avisos, manuais, cab = verificar.conferir(caminho)
        return ' | '.join(erros), ' | '.join(avisos)
    except verificar.Problema as e:
        return str(e), ''
    except Exception as e:
        return 'erro inesperado: %s' % e, ''


def testar_parser(pasta):
    """G8 e G6: o parser corta o item onde tem que cortar.

    Este e o unico grupo em que a prova nao pode ser a mensagem de erro: o
    defeito de G8 nao reprova nada, ele COLA o bloco de citacao no enunciado
    anterior e a folha sai com um '>' no meio da pergunta. Quem tem que ver
    isso e uma afirmacao sobre o que o parser devolve.
    """
    caminho = escrever(pasta, 'por/07/POR07-99.md', BASE_POR7)
    cab, corpo = verificar.ler_tema(caminho)
    parte = verificar.secao(corpo, 'PT')
    eventos = verificar.itens_estruturados(verificar.subsecao(parte, 'Exercícios'), True)
    itens = [e for e in eventos if e['tipo'] == 'item']
    textos = [e for e in eventos if e['tipo'] == 'texto']
    seis = verificar.ler_exercicio(itens[5]['linhas']) if len(itens) > 5 else {}
    oito = verificar.ler_exercicio(itens[7]['linhas']) if len(itens) > 7 else {}

    casos = [
        ('a lista tem oito itens', len(itens), 8),
        ('os dois textos de apoio saem como evento proprio', len(textos), 2),
        ('o enunciado da 6 nao carrega o bloco que vem depois dela',
         '>' in seis.get('enunciado', ''), False),
        ('o enunciado da 6 nao carrega a diretiva que vem depois dela',
         '@fonte' in seis.get('enunciado', ''), False),
        ('a questao 6 nao tem trecho proprio', seis.get('trecho'), None),
        ('a questao 8 tem trecho proprio, das linhas 6 a 8',
         (oito.get('trecho') or {}).get('linhas'), [6, 8]),
        ('o trecho da 8 aponta o conto, e nao o bilhete',
         (oito.get('trecho') or {}).get('fonte'), 'machado-de-assis_missa-do-galo'),
        ('o segundo texto de apoio e o bilhete', textos[1]['fonte'] if len(textos) > 1 else None,
         'escrito_bilhete-da-geladeira'),
        ('a questao 2 tem quatro alternativas',
         len(verificar.ler_exercicio(itens[1]['linhas'])['alternativas']) if len(itens) > 1 else 0, 4),
    ]
    falhas = 0
    for nome, obtido, esperado in casos:
        if obtido == esperado:
            print('  OK     parser: %s' % nome)
        else:
            print('  FALHA  parser: %s' % nome)
            print('         esperava %r, obteve %r' % (esperado, obtido))
            falhas += 1
    return falhas, len(casos)


def testar_gerador(pasta):
    """G2: o gerador de uma materia com catalogo produz o JSON da secao 3.

    Roda em pasta temporaria, com --temas e --saida, como o gerador ja sabe
    fazer: o tema de prova nao entra no repositorio.
    """
    import gerar_banco
    # Raiz propria: os pares deixaram temas de teste na outra, e a prova do
    # gerador precisa de uma lista de temas com um tema so.
    raiz = tempfile.mkdtemp(prefix='gera_')
    try:
        escrever(raiz, 'por/07/POR07-99.md', BASE_POR7)
        saida = os.path.join(raiz, 'saida')
        bancos = gerar_banco.gerar(raiz, saida, so='portugues',
                                   raiz_fontes=os.path.join(pasta, 'fontes'))
    finally:
        shutil.rmtree(raiz, ignore_errors=True)
    tema = bancos['portugues']['temas'][0]
    ex = tema['pt']['exercicios']
    fechada = [e for e in ex if e['tipo'] == 'fechada'][0]
    conto = tema['fontes'].get('machado-de-assis_missa-do-galo', {})
    bilhete = tema['fontes'].get('escrito_bilhete-da-geladeira', {})

    casos = [
        ('as chaves do tema saem na ordem do desenho', list(tema.keys()),
         ['id', 'materia', 'serie', 'unidade', 'duracaoMin', 'dificuldade', 'prerequisitos',
          'topicos', 'bncc', 'vestibular', 'fontes', 'pt']),
        ('as chaves da lingua saem na ordem do desenho', list(tema['pt'].keys()),
         ['titulo', 'resumo', 'explicacao', 'textos', 'exercicios']),
        ('os dois textos de apoio viajam', len(tema['pt']['textos']), 2),
        ('o primeiro texto traz o par de linhas da fonte',
         tema['pt']['textos'][0]['linhas'], [1, 5]),
        ('a linha em branco do texto viaja como cadeia vazia',
         tema['pt']['textos'][0]['conteudo'][2], ''),
        ('o primeiro exercicio aponta o texto de indice 0', ex[0]['texto'], 0),
        ('o primeiro exercicio e aberto', ex[0]['tipo'], 'aberta'),
        ('a resposta da aberta e o espera_se', ex[0]['resposta'], ex[0]['gabarito']['espera_se']),
        ('as chaves da questao aberta saem na ordem do desenho', list(ex[0].keys()),
         ['n', 'bloco', 'texto', 'tipo', 'enunciado', 'resposta', 'gabarito']),
        ('as chaves da questao fechada saem na ordem do desenho', list(fechada.keys()),
         ['n', 'bloco', 'texto', 'tipo', 'enunciado', 'alternativas', 'resposta', 'gabarito']),
        ('a fechada traz quatro alternativas', len(fechada['alternativas']), 4),
        ('a resposta da fechada e a letra', fechada['resposta'], 'b'),
        ('o bloco do primeiro exercicio vem do cabecalho da lista',
         ex[0]['bloco'], 'Fundamentos'),
        ('a questao 7 aponta o segundo texto', ex[6]['texto'], 1),
        ('a questao 8 leva o trecho proprio', ex[7]['trecho']['linhas'], [6, 8]),
        ('o credito do conto sai montado',
         conto.get('credito'),
         'Machado de Assis. *Missa do galo*. In: *Páginas recolhidas*, 1899.'),
        ('o credito do texto autoral diz que ele foi escrito para o exercicio',
         bilhete.get('credito'), 'Texto escrito para este exercício.'),
        ('as chaves da fonte saem na ordem do desenho', list(conto.keys()),
         ['titulo', 'autor', 'obra', 'ano', 'dominio', 'credito']),
        ('a fonte sem obra sai sem a chave obra', 'obra' in bilhete, False),
        ('so as fontes citadas viajam', sorted(tema['fontes'].keys()),
         ['escrito_bilhete-da-geladeira', 'machado-de-assis_missa-do-galo']),
        ('a cobertura declarada viaja', tema['bncc'], ['EF67LP28', 'EF69LP47']),
        ('o indice de busca so leva os enunciados',
         'Nunca pude entender' in ' '.join(e['enunciado'] for e in ex), False),
    ]
    falhas = 0
    for nome, obtido, esperado in casos:
        if obtido == esperado:
            print('  OK     gerador: %s' % nome)
        else:
            print('  FALHA  gerador: %s' % nome)
            print('         esperava %r, obteve %r' % (esperado, obtido))
            falhas += 1
    return falhas, len(casos)


def rodar():
    pasta = tempfile.mkdtemp(prefix='verifica_')
    raiz_antiga = verificar.RAIZ_FONTES
    falhas = 0
    total = 0
    try:
        # A raiz de fontes de mentira: sem ela o teste nao consegue provar F1 e
        # F2 sem deixar texto falso no repositorio.
        raiz_fontes = os.path.join(pasta, 'fontes')
        os.makedirs(raiz_fontes)
        for ident, texto in sorted(FONTES.items()):
            io.open(os.path.join(raiz_fontes, '%s.md' % ident), 'w',
                    encoding='utf-8', newline='\n').write(texto)
        verificar.RAIZ_FONTES = raiz_fontes

        # primeiro: o tema saudavel de matematica precisa passar limpo
        total += 1
        caminho = escrever(pasta, 'mat/06/MAT06-99.md', BASE)
        erros, avisos, manuais, cab = verificar.conferir(caminho)
        if erros:
            print('  FALHA  o tema saudavel foi reprovado: %s' % erros)
            falhas += 1
        else:
            print('  OK     o tema saudavel passa')

        for nome, estragar, esperado in CASOS:
            total += 1
            caminho = escrever(pasta, 'mat/06/MAT06-99.md', estragar(BASE))
            texto, _ = conferir_texto(caminho)
            if esperado.lower() in texto.lower():
                print('  OK     pega: %s' % nome)
            else:
                print('  FALHA  NAO pegou: %s' % nome)
                print('         esperava conter "%s", obteve "%s"' % (esperado, texto[:160]))
                falhas += 1

        for nome, relativo, conteudo, erro_esperado, aviso_esperado in PARES:
            total += 1
            caminho = escrever(pasta, relativo, conteudo)
            erros, avisos = conferir_texto(caminho)
            if erro_esperado is not None:
                ok = erro_esperado.lower() in erros.lower()
                verbo = 'pega'
            elif aviso_esperado is not None:
                ok = not erros and aviso_esperado.lower() in avisos.lower()
                verbo = 'passa e avisa'
            else:
                ok = not erros
                verbo = 'passa'
            if ok:
                print('  OK     %s: %s' % (verbo, nome))
            else:
                print('  FALHA  %s' % nome)
                print('         esperava %s, obteve erros "%s" e avisos "%s"'
                      % ('conter "%s"' % erro_esperado if erro_esperado else
                         ('passar com aviso "%s"' % aviso_esperado if aviso_esperado else 'passar limpo'),
                         erros[:160], avisos[:120]))
                falhas += 1

        # V1 tem duas metades. A primeira (o tema passa sem a secao) esta nos
        # PARES. A segunda e esta: o aviso "N exercicios sem verificacao" NAO
        # pode sair, senao ele apareceria em todo tema de interpretacao e
        # deixaria de ser lido.
        total += 1
        caminho = escrever(pasta, 'por/06/POR06-99.md',
                           BASE_POR.split('## VERIFICACAO')[0].rstrip() + '\n')
        erros_v1, avisos_v1 = conferir_texto(caminho)
        if 'sem verificacao' in avisos_v1:
            print('  FALHA  V1: o aviso de verificacao saiu num tema que nao a exige')
            falhas += 1
        else:
            print('  OK     V1: sem a secao VERIFICACAO o aviso nao sai')

        parciais, quantos = testar_parser(pasta)
        falhas += parciais
        total += quantos

        parciais, quantos = testar_gerador(pasta)
        falhas += parciais
        total += quantos
    finally:
        verificar.RAIZ_FONTES = raiz_antiga
        shutil.rmtree(pasta, ignore_errors=True)

    falhas += testar_frases()
    falhas += testar_ambiente()
    total += len(FRASES) + len(AMBIENTE_ESPERADO)

    print('')
    print('=' * 60)
    if falhas:
        print('%d defeito(s) passaram sem ser notados. O verificador nao esta confiavel.' % falhas)
    else:
        print('O verificador pegou os %d defeitos, resolveu os %d pares por materia, passou nas %d '
              'frases, manteve as %d decisoes do ambiente e provou o parser e o gerador.'
              % (len(CASOS), len(PARES), len(FRASES), len(AMBIENTE_ESPERADO)))
    # O PLACAR SAI NO DIALETO DOS IRMAOS: "N passaram, M falharam."
    #
    # Este teste falava sozinho, e falava de um jeito que enganaria o portao na
    # pior direcao possivel. O portao le duas coisas: quantas verificacoes
    # falharam, por "N falharam", e se o teste chegou a se declarar, por
    # "passaram|PASSARAM|CONFIRMAD". A linha de reprovacao daqui era "%d
    # defeito(s) PASSARAM sem ser notados", que casa com a segunda e nao casa
    # com a primeira: um verificador furado seria anunciado como ok.
    print('%d passaram, %d falharam.' % (total - falhas, falhas))
    print('=' * 60)
    return 1 if falhas else 0


if __name__ == '__main__':
    sys.exit(rodar())
