# -*- coding: utf-8 -*-
"""
Testa o verificador com temas propositalmente defeituosos.

Um verificador que nunca reprova nada nao prova nada. Aqui cada defeito que ele
deveria pegar e injetado de proposito, e o teste falha se ele deixar passar.
"""
import io
import os
import sys
import shutil
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verificar

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
                            'Texto de explicação — com um exemplo.'),
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


def rodar():
    pasta = tempfile.mkdtemp(prefix='verifica_')
    falhas = 0
    try:
        # primeiro: o tema saudavel precisa passar limpo
        caminho = os.path.join(pasta, 'MAT06-99.md')
        io.open(caminho, 'w', encoding='utf-8', newline='\n').write(BASE)
        erros, avisos, manuais, cab = verificar.conferir(caminho)
        if erros:
            print('  FALHA  o tema saudavel foi reprovado: %s' % erros)
            falhas += 1
        else:
            print('  OK     o tema saudavel passa')

        for nome, estragar, esperado in CASOS:
            io.open(caminho, 'w', encoding='utf-8', newline='\n').write(estragar(BASE))
            try:
                erros, avisos, manuais, cab = verificar.conferir(caminho)
                texto = ' | '.join(erros)
            except verificar.Problema as e:
                texto = str(e)
            except Exception as e:
                texto = 'erro inesperado: %s' % e

            if esperado.lower() in texto.lower():
                print('  OK     pega: %s' % nome)
            else:
                print('  FALHA  NAO pegou: %s' % nome)
                print('         esperava conter "%s", obteve "%s"' % (esperado, texto[:160]))
                falhas += 1
    finally:
        shutil.rmtree(pasta, ignore_errors=True)

    falhas += testar_frases()

    print('')
    print('=' * 60)
    if falhas:
        print('%d defeito(s) passaram sem ser notados. O verificador nao esta confiavel.' % falhas)
    else:
        print('O verificador pegou todos os %d defeitos e passou nas %d frases.' % (len(CASOS), len(FRASES)))
    print('=' * 60)
    return 1 if falhas else 0


if __name__ == '__main__':
    sys.exit(rodar())
