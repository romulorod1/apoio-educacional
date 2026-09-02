---
id: MATEM1-15
serie: em1
unidade: algebra
titulo_pt: Função composta
titulo_en: Composite functions
resumo_pt: Aplicar uma função ao resultado de outra, perceber que a ordem da composição importa, achar o domínio da composta e usar a composição para reconhecer a função inversa.
resumo_en: Applying one function to the output of another, seeing that the order of composition matters, finding the domain of the composite and using composition to recognise the inverse function.
prerequisitos: [MATEM1-02]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### A ideia: uma máquina ligada na outra

Uma função é uma máquina: entra um número, sai outro. Função composta é o que acontece quando a
saída de uma máquina entra direto na seguinte. O número passa pelas duas, uma de cada vez, e o que
interessa é o resultado final.

Uma loja virtual dá 10% de desconto e cobra 8 reais de entrega. São duas máquinas: o desconto é
g(x) = 0,9x e a entrega é f(x) = x + 8. Numa compra de 50 reais, aplicando primeiro o desconto e
depois a entrega, o valor passa de 50 para 45 e depois para 53. Aplicando primeiro a entrega e
depois o desconto, passa de 50 para 58 e depois para 52,20. As duas máquinas são as mesmas, mas a
ordem em que o número passa por elas muda o resultado. Esse é o assunto deste tema.

#### Definição e notação

Dadas duas funções f e g, a **função composta de f com g** é a função que aplica g primeiro e f
depois:

(f o g)(x) = f(g(x))

Lê-se "f composta com g" ou "f bola g". A leitura da expressão f(g(x)) é sempre **de dentro para
fora**: o x entra em g, e o resultado g(x) entra em f. Na loja, desconto e depois entrega é
f(g(x)) = 0,9x + 8; entrega e depois desconto é g(f(x)) = 0,9 · (x + 8) = 0,9x + 7,2.

**Exemplo 1.** Sejam f(x) = 2x + 1 e g(x) = x^{2}. Calcular f(g(3)) e g(f(3)).
De dentro para fora: g(3) = 9, e f(9) = 19. Logo f(g(3)) = 19.
No outro sentido: f(3) = 7, e g(7) = 49. Logo g(f(3)) = 49.
Em geral, f(g(x)) = 2x^{2} + 1 e g(f(x)) = (2x + 1)^{2} = 4x^{2} + 4x + 1, que são funções
diferentes.

#### A ordem importa

O exemplo mostra que f o g e g o f costumam ser funções diferentes. Isso não é exceção, é a regra:
compor não é comutativo. Existem pares que coincidem, como f(x) = x + 2 e g(x) = x + 5, que dão
x + 7 nas duas ordens, mas isso precisa ser verificado caso a caso, nunca suposto.

#### Como achar a lei da composta

Para escrever f(g(x)) a partir das leis, substitui-se a expressão inteira de g(x) em **todo** lugar
em que o x aparece na lei de f. Ajuda colocar a expressão entre parênteses antes de desenvolver.

**Exemplo 2.** Sejam f(x) = x^{2} - 3x e g(x) = x + 1. Determinar f(g(x)).
Trocando cada x de f por (x + 1):
f(g(x)) = (x + 1)^{2} - 3 · (x + 1) = x^{2} + 2x + 1 - 3x - 3 = x^{2} - x - 2.
Conferindo com um número: g(2) = 3 e f(3) = 9 - 9 = 0. Pela lei encontrada, 4 - 2 - 2 = 0. Bateu.

Essa conferência com um número vale a pena sempre. Ela pega o erro mais comum, que é substituir só
o primeiro x.

#### O domínio da composta

Para f(g(x)) existir, duas coisas precisam acontecer ao mesmo tempo: o x precisa estar no domínio
de g, e o valor g(x) precisa estar no domínio de f. As mesmas proibições do tema de domínio
continuam valendo: denominador diferente de zero e radicando de raiz quadrada maior ou igual a
zero.

**Exemplo 3.** Sejam f(x) = √x e g(x) = x - 4. Achar o domínio de f(g(x)) e o de g(f(x)).
f(g(x)) = √(x - 4), que exige x - 4 ≥ 0, ou seja, x ≥ 4.
g(f(x)) = √x - 4, que exige apenas x ≥ 0.
As duas compostas têm domínios diferentes, e nenhum dos dois é o conjunto de todos os reais.

Um cuidado importante: o domínio se decide **antes** de simplificar. Se f(x) = x^{2} e g(x) = √x,
então f(g(x)) = (√x)^{2} = x, mas o domínio não é o conjunto dos reais: é x ≥ 0, porque a raiz
precisa existir antes de ser elevada ao quadrado.

#### Composta com função definida por partes

Quando uma das funções tem regras diferentes em pedaços diferentes do domínio, o procedimento não
muda: calcula-se de dentro para fora, e a cada passo se olha em qual pedaço o número caiu.

**Exemplo 4.** Seja g a função que vale 2x + 1 quando x < 1 e vale x^{2} quando x ≥ 1, e seja
f(x) = x - 3. Calcular f(g(0)), f(g(3)), g(f(2)) e g(f(5)).
Como 0 < 1, g(0) = 2 · 0 + 1 = 1, e f(1) = 1 - 3 = -2.
Como 3 ≥ 1, g(3) = 3^{2} = 9, e f(9) = 9 - 3 = 6.
f(2) = -1, e como -1 < 1, g(-1) = 2 · (-1) + 1 = -1.
f(5) = 2, e como 2 ≥ 1, g(2) = 2^{2} = 4.
Repare que, na composta g(f(x)), quem decide o pedaço de g é o valor f(x), e não o x original.

#### Decompor: ler de dentro para fora

O caminho inverso também é cobrado: dada uma função complicada, escrevê-la como composta de duas
mais simples. A pergunta que resolve é "o que acontece com o x primeiro?".

**Exemplo 5.** Escrever h(x) = (3x - 1)^{2} como f(g(x)).
Primeiro o x vira 3x - 1; depois esse resultado é elevado ao quadrado. Então g(x) = 3x - 1 e
f(x) = x^{2}. Da mesma forma, k(x) = √(x^{2} + 1) é f(g(x)) com g(x) = x^{2} + 1 e f(x) = √x.

A decomposição não é única, mas a natural é a que segue a ordem das operações.

#### A ponte para a função inversa

Duas funções são inversas uma da outra quando cada uma desfaz o que a outra faz. Em linguagem de
composição:

f(f^{-1}(x)) = x e f^{-1}(f(x)) = x

Só função bijetora tem inversa, e esse é o teste para saber se uma candidata a inversa é a
verdadeira: compor e ver se volta o x.

**Exemplo 6.** Verificar que f^{-1}(x) = (x - 3)/2 é a inversa de f(x) = 2x + 3.
f(f^{-1}(x)) = 2 · (x - 3)/2 + 3 = x - 3 + 3 = x.
f^{-1}(f(x)) = ((2x + 3) - 3)/2 = 2x/2 = x.
As duas compostas devolvem x, então as funções são inversas de fato.

#### Erros comuns

**Aplicar na ordem errada.** Em f(g(x)) quem age primeiro é g. A notação f o g lê-se da direita
para a esquerda.

**Multiplicar em vez de compor.** f(g(x)) não é f(x) · g(x). Uma coisa é aplicar uma função ao
resultado da outra; outra é multiplicar os dois resultados.

**Confundir f(f(x)) com f(x) elevado ao quadrado.** f(f(x)) aplica a função duas vezes seguidas.

**Substituir só o primeiro x.** Em f(x) = x^{2} - 3x, todo x vira g(x), inclusive o do termo -3x.

**Simplificar antes de achar o domínio.** (√x)^{2} vale x, mas só existe para x ≥ 0. O domínio
vem da expressão original, não da simplificada.

### Exercícios

**Bloco A. Fundamentos**

1. Sejam f(x) = 2x + 1 e g(x) = x^{2}. Calcule f(g(3)) e g(f(3)).
2. Duas funções têm domínio formado por 1, 2 e 3 e são dadas por tabela: f(1) = 2, f(2) = 3 e
   f(3) = 3; g(1) = 1, g(2) = 3 e g(3) = 2. Calcule f(g(1)), g(f(1)) e f(f(1)).
3. Sejam f(x) = x - 5 e g(x) = 3x. Determine a lei de (f o g)(x) e a lei de (g o f)(x).
4. Sejam f(x) = x^{2} - 3x e g(x) = x + 1. Determine a lei de f(g(x)) e calcule f(g(2)).
5. Seja f(x) = 3x - 2. Calcule f(f(2)) e determine a lei de f(f(x)).

**Bloco B. Consolidação**

6. Sejam f(x) = √x e g(x) = x - 4. Determine as leis de f(g(x)) e de g(f(x)) e o domínio de cada
   uma.
7. Sejam f(x) = 1/x e g(x) = x - 2. Determine as leis de f(g(x)) e de g(f(x)) e o domínio de cada
   uma.
8. Uma loja virtual dá 10% de desconto sobre o valor da compra e cobra 8 reais de entrega. Chamando
   de g(x) = 0,9x o desconto e de f(x) = x + 8 a entrega, calcule quanto se paga numa compra de 50
   reais quando o desconto é aplicado antes da entrega, f(g(50)), e quando a entrega entra antes do
   desconto, g(f(50)). Escreva as leis de f(g(x)) e de g(f(x)).
9. Sejam f(x) = 2x + 3 e f^{-1}(x) = (x - 3)/2. Verifique, calculando as duas compostas, que
   f(f^{-1}(x)) = x e que f^{-1}(f(x)) = x.
10. Seja g a função que vale 2x + 1 quando x < 1 e vale x^{2} quando x ≥ 1, e seja f(x) = x - 3.
    Calcule f(g(0)), f(g(3)), g(f(2)) e g(f(5)).
11. Escreva h(x) = (3x - 1)^{2} como f(g(x)), com f e g mais simples que h. Faça o mesmo com
    k(x) = √(x^{2} + 1).
12. Sejam f(x) = x + 2 e g(x) = x^{2} - 1. Determine todos os valores de x para os quais
    f(g(x)) = g(f(x)).
13. Seja g(x) = x - 1. Sabendo que f(g(x)) = 2x + 5 para todo x real, determine a lei de f.

**Bloco C. Aprofundamento**

14. Sejam f(x) = x^{2} e g(x) = √x. Determine as leis de f(g(x)) e de g(f(x)), com os domínios, e
    explique por que as duas compostas não são a mesma função, mesmo que as duas leis pareçam
    simplificar para x.
15. Considere f(x) = (x + 2)/(x - 1), definida para x ≠ 1. Mostre que f é igual à própria inversa
    verificando que f(f(x)) devolve x.
16. Sejam f(x) = 2x - 1 e g(x) = x^{2} + 3. Resolva a equação f(g(x)) = 15 e depois a equação
    g(f(x)) = 4.
17. Sejam f(x) = √(x + 3) e g(x) = 1/(x - 2). Determine a lei de g(f(x)) e o seu domínio.
18. Determine todas as funções afins f(x) = ax + b tais que f(f(x)) = 4x + 9 para todo x real,
    explicando por que a igualdade entre as duas expressões obriga os coeficientes a coincidir.

### Gabarito

1. f(g(3)) = 19 e g(f(3)) = 49.
2. f(g(1)) = 2, g(f(1)) = 3 e f(f(1)) = 3.
3. (f o g)(x) = 3x - 5 e (g o f)(x) = 3x - 15.
4. f(g(x)) = x^{2} - x - 2 e f(g(2)) = 0.
5. f(f(2)) = 10 e f(f(x)) = 9x - 8.
6. f(g(x)) = √(x - 4), com domínio nos reais maiores ou iguais a 4. g(f(x)) = √x - 4, com domínio
   nos reais maiores ou iguais a 0.
7. f(g(x)) = 1/(x - 2), com domínio em todos os reais diferentes de 2. g(f(x)) = 1/x - 2, que
   também se escreve (1 - 2x)/x, com domínio em todos os reais diferentes de 0.
8. f(g(50)) = 53 reais e g(f(50)) = 52,20 reais. As leis são f(g(x)) = 0,9x + 8 e
   g(f(x)) = 0,9x + 7,2. Entrega antes do desconto sai mais barato, porque o desconto passa a
   incidir também sobre os 8 reais da entrega.
9. f(f^{-1}(x)) = 2 · (x - 3)/2 + 3 = x - 3 + 3 = x, e f^{-1}(f(x)) = (2x + 3 - 3)/2 = x.
10. f(g(0)) = -2, f(g(3)) = 6, g(f(2)) = -1 e g(f(5)) = 4.
11. h(x) = f(g(x)) com g(x) = 3x - 1 e f(x) = x^{2}. k(x) = f(g(x)) com g(x) = x^{2} + 1 e
    f(x) = √x.
12. x = -1/2. Vale f(g(x)) = x^{2} + 1 e g(f(x)) = x^{2} + 4x + 3, e igualar as duas dá 4x = -2.
    Nesse ponto as duas compostas valem 5/4.
13. f(x) = 2x + 7. Chamando u = x - 1, tem-se x = u + 1 e f(u) = 2 · (u + 1) + 5 = 2u + 7.
14. f(g(x)) = (√x)^{2} = x, com domínio nos reais maiores ou iguais a 0. g(f(x)) = √(x^{2}) = |x|,
    com domínio em todos os reais. Não são a mesma função porque os domínios diferem: em x = -3,
    a primeira não existe e a segunda vale 3.
15. O numerador de f(f(x)) é (x + 2)/(x - 1) + 2 = 3x/(x - 1), e o denominador é
    (x + 2)/(x - 1) - 1 = 3/(x - 1). O quociente é 3x/3 = x. Como f(f(x)) = x, a função desfaz a si
    mesma, e por isso f^{-1} = f.
16. f(g(x)) = 2x^{2} + 5, e a equação dá x^{2} = 5, ou seja, x = √5 ou x = -√5.
    g(f(x)) = (2x - 1)^{2} + 3, e a equação dá (2x - 1)^{2} = 1, ou seja, x = 1 ou x = 0.
17. g(f(x)) = 1/(√(x + 3) - 2). O domínio são os reais maiores ou iguais a -3, tirando o 1: a raiz
    exige x + 3 ≥ 0, e o denominador zera quando √(x + 3) = 2, ou seja, quando x = 1.
18. f(x) = 2x + 3 ou f(x) = -2x - 9. Compondo, f(f(x)) = a · (ax + b) + b = a^{2}x + ab + b. Para
    essa expressão ser igual a 4x + 9 para todo x, o coeficiente de x precisa ser o mesmo dos dois
    lados, a^{2} = 4, e o termo independente também, ab + b = 9. Com a = 2 vem 3b = 9 e b = 3; com
    a = -2 vem -b = 9 e b = -9.

## EN

### Explanation

#### The idea: one machine plugged into another

A function is a machine: a number goes in, another comes out. A composite function is what happens
when the output of one machine goes straight into the next. The number passes through both, one at
a time, and what matters is the final result.

An online shop gives a 10% discount and charges 8 reais for delivery. Those are two machines: the
discount is g(x) = 0.9x and the delivery is f(x) = x + 8. On a purchase of 50 reais, applying the
discount first and then the delivery, the amount goes from 50 to 45 and then to 53. Applying the
delivery first and then the discount, it goes from 50 to 58 and then to 52.20. The two machines are
the same, but the order in which the number passes through them changes the result. That is the
subject of this topic.

#### Definition and notation

Given two functions f and g, the **composite of f with g** is the function that applies g first and
f afterwards:

(f o g)(x) = f(g(x))

It is read "f composed with g" or "f circle g". The expression f(g(x)) is always read **from the
inside out**: x goes into g, and the result g(x) goes into f. In the shop, discount then delivery is
f(g(x)) = 0.9x + 8; delivery then discount is g(f(x)) = 0.9 · (x + 8) = 0.9x + 7.2.

**Example 1.** Let f(x) = 2x + 1 and g(x) = x^{2}. Find f(g(3)) and g(f(3)).
From the inside out: g(3) = 9, and f(9) = 19. So f(g(3)) = 19.
The other way round: f(3) = 7, and g(7) = 49. So g(f(3)) = 49.
In general, f(g(x)) = 2x^{2} + 1 and g(f(x)) = (2x + 1)^{2} = 4x^{2} + 4x + 1, which are different
functions.

#### Order matters

The example shows that f o g and g o f are usually different functions. That is not the exception,
it is the rule: composition is not commutative. There are pairs that coincide, such as f(x) = x + 2
and g(x) = x + 5, which give x + 7 in both orders, but that has to be checked case by case, never
assumed.

#### How to find the rule of the composite

To write f(g(x)) from the rules, substitute the whole expression of g(x) in **every** place where x
appears in the rule of f. It helps to put the expression in brackets before expanding.

**Example 2.** Let f(x) = x^{2} - 3x and g(x) = x + 1. Find f(g(x)).
Replacing each x of f by (x + 1):
f(g(x)) = (x + 1)^{2} - 3 · (x + 1) = x^{2} + 2x + 1 - 3x - 3 = x^{2} - x - 2.
Checking with a number: g(2) = 3 and f(3) = 9 - 9 = 0. From the rule found, 4 - 2 - 2 = 0. It
matches.

That check with a number is always worth doing. It catches the most common mistake, which is
replacing only the first x.

#### The domain of the composite

For f(g(x)) to exist, two things must happen at the same time: x must be in the domain of g, and
the value g(x) must be in the domain of f. The same prohibitions from the domain topic still hold: a
denominator different from zero and what sits under a square root greater than or equal to zero.

**Example 3.** Let f(x) = √x and g(x) = x - 4. Find the domain of f(g(x)) and that of g(f(x)).
f(g(x)) = √(x - 4), which requires x - 4 ≥ 0, that is, x ≥ 4.
g(f(x)) = √x - 4, which requires only x ≥ 0.
The two composites have different domains, and neither is the set of all reals.

One important care: the domain is decided **before** simplifying. If f(x) = x^{2} and g(x) = √x,
then f(g(x)) = (√x)^{2} = x, but the domain is not the set of reals: it is x ≥ 0, because the root
has to exist before being squared.

#### Composite with a piecewise function

When one of the functions follows different rules on different pieces of the domain, the procedure
does not change: work from the inside out, and at each step look at which piece the number landed
in.

**Example 4.** Let g be the function equal to 2x + 1 when x < 1 and equal to x^{2} when x ≥ 1, and
let f(x) = x - 3. Find f(g(0)), f(g(3)), g(f(2)) and g(f(5)).
Since 0 < 1, g(0) = 2 · 0 + 1 = 1, and f(1) = 1 - 3 = -2.
Since 3 ≥ 1, g(3) = 3^{2} = 9, and f(9) = 9 - 3 = 6.
f(2) = -1, and since -1 < 1, g(-1) = 2 · (-1) + 1 = -1.
f(5) = 2, and since 2 ≥ 1, g(2) = 2^{2} = 4.
Notice that, in the composite g(f(x)), what decides the piece of g is the value f(x), not the
original x.

#### Decomposing: reading from the inside out

The reverse route is also asked: given a complicated function, write it as the composite of two
simpler ones. The question that settles it is "what happens to x first?".

**Example 5.** Write h(x) = (3x - 1)^{2} as f(g(x)).
First x becomes 3x - 1; then that result is squared. So g(x) = 3x - 1 and f(x) = x^{2}. In the same
way, k(x) = √(x^{2} + 1) is f(g(x)) with g(x) = x^{2} + 1 and f(x) = √x.

The decomposition is not unique, but the natural one follows the order of operations.

#### The bridge to the inverse function

Two functions are inverses of each other when each one undoes what the other does. In the language
of composition:

f(f^{-1}(x)) = x and f^{-1}(f(x)) = x

Only a bijective function has an inverse, and this is the test to know whether a candidate inverse
is the real one: compose and see whether x comes back.

**Example 6.** Check that f^{-1}(x) = (x - 3)/2 is the inverse of f(x) = 2x + 3.
f(f^{-1}(x)) = 2 · (x - 3)/2 + 3 = x - 3 + 3 = x.
f^{-1}(f(x)) = ((2x + 3) - 3)/2 = 2x/2 = x.
Both composites give back x, so the functions really are inverses.

#### Common mistakes

**Applying in the wrong order.** In f(g(x)) the one that acts first is g. The notation f o g is read
from right to left.

**Multiplying instead of composing.** f(g(x)) is not f(x) · g(x). Applying one function to the
result of the other is one thing; multiplying the two results is another.

**Confusing f(f(x)) with f(x) squared.** f(f(x)) applies the function twice in a row.

**Replacing only the first x.** In f(x) = x^{2} - 3x, every x becomes g(x), including the one in the
term -3x.

**Simplifying before finding the domain.** (√x)^{2} equals x, but it exists only for x ≥ 0. The
domain comes from the original expression, not from the simplified one.

### Exercises

**Block A. Fundamentals**

1. Let f(x) = 2x + 1 and g(x) = x^{2}. Find f(g(3)) and g(f(3)).
2. Two functions have domain made of 1, 2 and 3 and are given by a table: f(1) = 2, f(2) = 3 and
   f(3) = 3; g(1) = 1, g(2) = 3 and g(3) = 2. Find f(g(1)), g(f(1)) and f(f(1)).
3. Let f(x) = x - 5 and g(x) = 3x. Find the rule of (f o g)(x) and the rule of (g o f)(x).
4. Let f(x) = x^{2} - 3x and g(x) = x + 1. Find the rule of f(g(x)) and work out f(g(2)).
5. Let f(x) = 3x - 2. Find f(f(2)) and the rule of f(f(x)).

**Block B. Building up**

6. Let f(x) = √x and g(x) = x - 4. Find the rules of f(g(x)) and of g(f(x)) and the domain of each
   one.
7. Let f(x) = 1/x and g(x) = x - 2. Find the rules of f(g(x)) and of g(f(x)) and the domain of each
   one.
8. An online shop gives a 10% discount on the value of the purchase and charges 8 reais for
   delivery. Calling g(x) = 0.9x the discount and f(x) = x + 8 the delivery, work out how much is
   paid on a purchase of 50 reais when the discount is applied before the delivery, f(g(50)), and
   when the delivery comes before the discount, g(f(50)). Write the rules of f(g(x)) and of g(f(x)).
9. Let f(x) = 2x + 3 and f^{-1}(x) = (x - 3)/2. Check, by working out both composites, that
   f(f^{-1}(x)) = x and that f^{-1}(f(x)) = x.
10. Let g be the function equal to 2x + 1 when x < 1 and equal to x^{2} when x ≥ 1, and let
    f(x) = x - 3. Find f(g(0)), f(g(3)), g(f(2)) and g(f(5)).
11. Write h(x) = (3x - 1)^{2} as f(g(x)), with f and g simpler than h. Do the same with
    k(x) = √(x^{2} + 1).
12. Let f(x) = x + 2 and g(x) = x^{2} - 1. Find every value of x for which f(g(x)) = g(f(x)).
13. Let g(x) = x - 1. Knowing that f(g(x)) = 2x + 5 for every real x, find the rule of f.

**Block C. Going further**

14. Let f(x) = x^{2} and g(x) = √x. Find the rules of f(g(x)) and of g(f(x)), with their domains,
    and explain why the two composites are not the same function, even though both rules seem to
    simplify to x.
15. Consider f(x) = (x + 2)/(x - 1), defined for x ≠ 1. Show that f is equal to its own inverse by
    checking that f(f(x)) gives back x.
16. Let f(x) = 2x - 1 and g(x) = x^{2} + 3. Solve the equation f(g(x)) = 15 and then the equation
    g(f(x)) = 4.
17. Let f(x) = √(x + 3) and g(x) = 1/(x - 2). Find the rule of g(f(x)) and its domain.
18. Find every affine function f(x) = ax + b such that f(f(x)) = 4x + 9 for every real x, explaining
    why the equality between the two expressions forces the coefficients to coincide.

### Answer key

1. f(g(3)) = 19 and g(f(3)) = 49.
2. f(g(1)) = 2, g(f(1)) = 3 and f(f(1)) = 3.
3. (f o g)(x) = 3x - 5 and (g o f)(x) = 3x - 15.
4. f(g(x)) = x^{2} - x - 2 and f(g(2)) = 0.
5. f(f(2)) = 10 and f(f(x)) = 9x - 8.
6. f(g(x)) = √(x - 4), with domain the reals greater than or equal to 4. g(f(x)) = √x - 4, with
   domain the reals greater than or equal to 0.
7. f(g(x)) = 1/(x - 2), with domain all the reals different from 2. g(f(x)) = 1/x - 2, which can
   also be written (1 - 2x)/x, with domain all the reals different from 0.
8. f(g(50)) = 53 reais and g(f(50)) = 52.20 reais. The rules are f(g(x)) = 0.9x + 8 and
   g(f(x)) = 0.9x + 7.2. Delivery before discount comes out cheaper, because the discount then also
   applies to the 8 reais of delivery.
9. f(f^{-1}(x)) = 2 · (x - 3)/2 + 3 = x - 3 + 3 = x, and f^{-1}(f(x)) = (2x + 3 - 3)/2 = x.
10. f(g(0)) = -2, f(g(3)) = 6, g(f(2)) = -1 and g(f(5)) = 4.
11. h(x) = f(g(x)) with g(x) = 3x - 1 and f(x) = x^{2}. k(x) = f(g(x)) with g(x) = x^{2} + 1 and
    f(x) = √x.
12. x = -1/2. We have f(g(x)) = x^{2} + 1 and g(f(x)) = x^{2} + 4x + 3, and equating the two gives
    4x = -2. At that point both composites equal 5/4.
13. f(x) = 2x + 7. Calling u = x - 1, we get x = u + 1 and f(u) = 2 · (u + 1) + 5 = 2u + 7.
14. f(g(x)) = (√x)^{2} = x, with domain the reals greater than or equal to 0.
    g(f(x)) = √(x^{2}) = |x|, with domain all the reals. They are not the same function because
    the domains differ: at x = -3, the first does not exist and the second equals 3.
15. The numerator of f(f(x)) is (x + 2)/(x - 1) + 2 = 3x/(x - 1), and the denominator is
    (x + 2)/(x - 1) - 1 = 3/(x - 1). The quotient is 3x/3 = x. Since f(f(x)) = x, the function
    undoes itself, and that is why f^{-1} = f.
16. f(g(x)) = 2x^{2} + 5, and the equation gives x^{2} = 5, that is, x = √5 or x = -√5.
    g(f(x)) = (2x - 1)^{2} + 3, and the equation gives (2x - 1)^{2} = 1, that is, x = 1 or x = 0.
17. g(f(x)) = 1/(√(x + 3) - 2). The domain is the reals greater than or equal to -3, leaving out 1:
    the root requires x + 3 ≥ 0, and the denominator vanishes when √(x + 3) = 2, that is, when
    x = 1.
18. f(x) = 2x + 3 or f(x) = -2x - 9. Composing, f(f(x)) = a · (ax + b) + b = a^{2}x + ab + b. For
    that expression to equal 4x + 9 for every x, the coefficient of x must be the same on both
    sides, a^{2} = 4, and so must the constant term, ab + b = 9. With a = 2 comes 3b = 9 and b = 3;
    with a = -2 comes -b = 9 and b = -9.

## VERIFICACAO

```python
# figura: na seção "A ideia", duas caixas em série, x entra em g, sai g(x), entra em f, sai f(g(x)); a mesma cadeia com f e g trocadas, para mostrar que o resultado muda
# figura: na seção "A ponte para a função inversa", gráficos de f(x) = 2x + 3 e de f^{-1}(x) = (x - 3)/2 no mesmo plano, refletidos na reta y = x
X0: Rational(9, 10)*50 + 8 == 53 and Rational(9, 10)*(50 + 8) == Rational(522, 10) and expand(Rational(9, 10)*(x + 8)) == Rational(9, 10)*x + Rational(72, 10)
X1: (2*3**2 + 1) == 19 and (2*3 + 1)**2 == 49 and expand((2*x + 1)**2) == 4*x**2 + 4*x + 1
X2: expand((x + 1)**2 - 3*(x + 1)) == x**2 - x - 2 and (2**2 - 2 - 2) == 0
X3: solveset(x - 4 >= 0, x, Reals) == Interval(4, oo) and solveset(x >= 0, x, Reals) == Interval(0, oo)
X4: (2*0 + 1) == 1 and 1 - 3 == -2 and 3**2 == 9 and 9 - 3 == 6 and 2 - 3 == -1 and 2*(-1) + 1 == -1 and 5 - 3 == 2 and 2**2 == 4
X5: expand((3*x - 1)**2) == 9*x**2 - 6*x + 1 and simplify(sqrt(x**2 + 1)**2 - (x**2 + 1)) == 0
X6: simplify(2*((x - 3)/2) + 3 - x) == 0 and simplify(((2*x + 3) - 3)/2 - x) == 0
E1: (2*3**2 + 1) == 19 and (2*3 + 1)**2 == 49
E2: {1: 2, 2: 3, 3: 3}[{1: 1, 2: 3, 3: 2}[1]] == 2 and {1: 1, 2: 3, 3: 2}[{1: 2, 2: 3, 3: 3}[1]] == 3 and {1: 2, 2: 3, 3: 3}[{1: 2, 2: 3, 3: 3}[1]] == 3
E3: (lambda u: u - 5)((lambda u: 3*u)(x)) == 3*x - 5 and (lambda u: 3*u)((lambda u: u - 5)(x)) == 3*x - 15 and expand((3*x - 5) - (3*x - 15)) == 10
E4: expand((lambda u: u**2 - 3*u)((lambda u: u + 1)(x))) == x**2 - x - 2 and (lambda u: u**2 - 3*u)((lambda u: u + 1)(2)) == 0
E5: (lambda u: 3*u - 2)((lambda u: 3*u - 2)(2)) == 10 and expand((lambda u: 3*u - 2)((lambda u: 3*u - 2)(x))) == 9*x - 8
E6: simplify((lambda u: sqrt(u))((lambda u: u - 4)(x)) - sqrt(x - 4)) == 0 and solveset(x - 4 >= 0, x, Reals) == Interval(4, oo) and simplify((lambda u: u - 4)((lambda u: sqrt(u))(x)) - (sqrt(x) - 4)) == 0 and solveset(x >= 0, x, Reals) == Interval(0, oo)
E7: simplify((lambda u: 1/u)((lambda u: u - 2)(x)) - 1/(x - 2)) == 0 and simplify((lambda u: u - 2)((lambda u: 1/u)(x)) - (1 - 2*x)/x) == 0 and solve(Eq(x - 2, 0), x) == [2]
E8: Rational(9, 10)*50 + 8 == 53 and Rational(9, 10)*(50 + 8) == Rational(522, 10) and expand(Rational(9, 10)*(x + 8)) == Rational(9, 10)*x + Rational(72, 10)
E9: simplify((lambda u: 2*u + 3)((lambda u: (u - 3)/2)(x)) - x) == 0 and simplify((lambda u: (u - 3)/2)((lambda u: 2*u + 3)(x)) - x) == 0
E10: (lambda u: u - 3)((lambda u: 2*u + 1 if u < 1 else u**2)(0)) == -2 and (lambda u: u - 3)((lambda u: 2*u + 1 if u < 1 else u**2)(3)) == 6 and (lambda u: 2*u + 1 if u < 1 else u**2)((lambda u: u - 3)(2)) == -1 and (lambda u: 2*u + 1 if u < 1 else u**2)((lambda u: u - 3)(5)) == 4
E11: simplify((lambda u: u**2)((lambda u: 3*u - 1)(x)) - (3*x - 1)**2) == 0 and simplify((lambda u: sqrt(u))((lambda u: u**2 + 1)(x)) - sqrt(x**2 + 1)) == 0
E12: solve(Eq((lambda u: u + 2)((lambda u: u**2 - 1)(x)), (lambda u: u**2 - 1)((lambda u: u + 2)(x))), x) == [Rational(-1, 2)] and (lambda u: u + 2)((lambda u: u**2 - 1)(Rational(-1, 2))) == Rational(5, 4) and (lambda u: u**2 - 1)((lambda u: u + 2)(Rational(-1, 2))) == Rational(5, 4)
E13: expand((lambda u: 2*u + 7)((lambda u: u - 1)(x))) == 2*x + 5
E14: simplify((lambda u: u**2)((lambda u: sqrt(u))(x)) - x) == 0 and simplify((lambda u: sqrt(u))((lambda u: u**2)(x)) - Abs(x)) == 0 and Abs(-3) == 3 and solveset(x >= 0, x, Reals) == Interval(0, oo)
E15: simplify((lambda u: (u + 2)/(u - 1))((lambda u: (u + 2)/(u - 1))(x)) - x) == 0 and simplify(((x + 2)/(x - 1) + 2) - 3*x/(x - 1)) == 0 and simplify(((x + 2)/(x - 1) - 1) - 3/(x - 1)) == 0
E16: set(solve(Eq((lambda u: 2*u - 1)((lambda u: u**2 + 3)(x)), 15), x)) == set([sqrt(5), -sqrt(5)]) and sorted(solve(Eq((lambda u: u**2 + 3)((lambda u: 2*u - 1)(x)), 4), x)) == [0, 1]
E17: simplify((lambda u: 1/(u - 2))((lambda u: sqrt(u + 3))(x)) - 1/(sqrt(x + 3) - 2)) == 0 and solveset(x + 3 >= 0, x, Reals) == Interval(-3, oo) and solve(Eq(sqrt(x + 3), 2), x) == [1]
E18: sorted(solve([Eq(a**2, 4), Eq(a*b + b, 9)], [a, b])) == [(-2, -9), (2, 3)] and expand((lambda u: 2*u + 3)((lambda u: 2*u + 3)(x))) == 4*x + 9 and expand((lambda u: -2*u - 9)((lambda u: -2*u - 9)(x))) == 4*x + 9
```
