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

# Um tema de portugues: so pt, unidade da propria materia, topicos do catalogo
# e um trecho de autor em bloco de citacao marcado.
BASE_POR = """---
id: POR06-99
serie: 06
unidade: leitura
titulo_pt: Tema de teste de português
resumo_pt: Um resumo.
prerequisitos: []
topicos: [POR06-T01, POR06-T02]
duracao_min: 60
dificuldade: 2
---

## PT

### Explicação

Texto de explicação sobre um conto. A ideia principal fica clara no primeiro parágrafo.

> Trecho do autor, citado como está no original.

### Exercícios

1. Qual é a ideia principal do primeiro parágrafo?
2. Que palavra o autor repete de propósito?

### Gabarito

1. Resposta aberta, conferida pela professora.
2. A palavra tempo.

## VERIFICACAO

```python
E1: 1 == 1  # manual: interpretacao de texto
E2: 1 == 1  # manual: leitura do trecho
```
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


def _com_citacao(texto, trecho):
    return texto.replace('> Trecho do autor, citado como está no original.', trecho)


def _sem_linha(texto, comeco):
    return '\n'.join(l for l in texto.split('\n') if not l.startswith(comeco))


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
    ('por: travessao dentro da citacao passa',
     'por/06/POR06-99.md',
     _com_citacao(BASE_POR, '> Trecho do autor ' + TRAVESSAO + ' citado como está no original.'),
     None, None),
    ('por: reticencias fora da citacao reprovam',
     'por/06/POR06-99.md',
     BASE_POR.replace('fica clara no primeiro parágrafo.', 'fica clara' + RETICENCIAS + ' no primeiro parágrafo.'),
     'reticencias', None),
    ('por: reticencias dentro da citacao passam',
     'por/06/POR06-99.md',
     _com_citacao(BASE_POR, '> Trecho do autor, citado' + RETICENCIAS + ' como está no original.'),
     None, None),
    ('por: sinal de citacao sem o espaco nao e citacao, travessao reprova',
     'por/06/POR06-99.md',
     _com_citacao(BASE_POR, '>Trecho do autor ' + TRAVESSAO + ' citado como está no original.'),
     'travessao', None),
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


def rodar():
    pasta = tempfile.mkdtemp(prefix='verifica_')
    falhas = 0
    total = 0
    try:
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
    finally:
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
              'frases e manteve as %d decisoes do ambiente.'
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
