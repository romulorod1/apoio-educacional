---
id: MATEM3-09
serie: em3
unidade: algebra
titulo_pt: Noção de limite e continuidade
titulo_en: The idea of limit and continuity
resumo_pt: Entender para onde uma função tende, levantar indeterminações por fatoração e reconhecer onde uma função é contínua.
resumo_en: Understanding where a function is heading, clearing indeterminate forms by factoring and recognising where a function is continuous.
prerequisitos: [MATEM3-08]
duracao_min: 90
dificuldade: 5
---

## PT

### Explicação

#### A ideia antes do símbolo

Limite responde a uma pergunta simples: **para onde o valor da função está indo quando o x se
aproxima de um número**. Repare que a pergunta não é quanto a função vale naquele ponto. É para onde
ela aponta na chegada. Essas duas coisas coincidem quase sempre, e é justamente quando elas não
coincidem que o conceito ganha utilidade.

Pense na função que dá o preço por pessoa de uma van dividida entre os passageiros. Quanto mais gente
entra, menor a parte de cada um, e o valor se aproxima de zero sem nunca chegar lá. Esse
comportamento de aproximação é o que o limite descreve.

A notação é

limite de f(x) quando x tende a a, igual a L

e se lê assim: quando x fica tão perto de a quanto se queira, f(x) fica tão perto de L quanto se
queira.

#### Quando basta substituir

Para polinômios, e para qualquer função contínua no ponto, o limite é simplesmente o valor da
função. Substituir é o primeiro movimento, sempre. Só quando a substituição produz uma expressão sem
sentido, como zero dividido por zero, é que o trabalho começa.

#### A indeterminação zero sobre zero

Se numerador e denominador vão os dois a zero, o quociente pode tender a qualquer coisa. A saída é
**fatorar e simplificar** o fator comum, que é exatamente o fator que estava causando o zero nos dois
lugares.

**Exemplo 1.** Calcular o limite de (x ao quadrado menos 9) dividido por (x menos 3), quando x tende
a 3.
Substituindo direto sai zero sobre zero. Fatorando o numerador, temos x menos 3 vezes x mais 3.
Cancelando o fator x menos 3, sobra x mais 3, e agora a substituição funciona: o limite é 6.

Repare no que aconteceu. A função original nem existe em x igual a 3, porque o denominador zera. Mas
o limite existe e vale 6, porque a pergunta é sobre a aproximação, não sobre o ponto.

Quando aparece raiz, o mesmo raciocínio vale, com um passo a mais: multiplica-se pelo conjugado para
fazer a raiz sumir do lugar que atrapalha.

**Exemplo 2.** Calcular o limite de (raiz de x mais 1, menos 1) dividido por x, quando x tende a
zero.
Multiplicando numerador e denominador por raiz de x mais 1, mais 1, o numerador vira x mais 1 menos
1, ou seja, x. Cancelando o x, sobra 1 dividido por raiz de x mais 1, mais 1. Substituindo, o limite
é um meio.

#### Limites no infinito

Quando x cresce sem parar, o que manda numa fração de polinômios são os termos de maior grau. Se os
graus são iguais, o limite é o quociente dos coeficientes principais. Se o de baixo tem grau maior, o
limite é zero. Se o de cima tem grau maior, a função cresce sem limite.

**Exemplo 3.** Calcular o limite de (3x ao quadrado mais 2x) dividido por (x ao quadrado menos 5),
quando x tende ao infinito.
Os dois têm grau 2, então o limite é 3 dividido por 1, ou seja, 3. Na prática, divide-se tudo por x
ao quadrado e observa-se que as parcelas com x no denominador vão a zero.

Esse cálculo é o que localiza a **assíntota horizontal** do gráfico: a reta de altura 3, da qual a
curva se aproxima cada vez mais.

#### Continuidade

Uma função é contínua em a quando três coisas acontecem ao mesmo tempo: f(a) existe, o limite quando
x tende a a existe, e os dois valores são iguais. Em linguagem de desenho, o gráfico passa pelo ponto
sem buraco e sem salto.

**Exemplo 4.** Seja f(x) igual a (x ao quadrado menos 4) dividido por (x menos 2) para x diferente de
2, e f(2) igual a k. Qual valor de k torna f contínua em 2?
O limite quando x tende a 2 é o limite de x mais 2, que vale 4. Para haver continuidade, k precisa
valer 4.

Esse tipo de buraco que se tampa escolhendo bem um único valor se chama descontinuidade removível. Já
uma função que dá um salto, como a que muda de regra em x igual a 2 e chega em valores diferentes de
cada lado, tem descontinuidade que não se remove trocando um ponto.

#### Erros comuns

**Confundir limite com valor da função.** A função pode nem estar definida no ponto e ainda assim ter
limite ali.

**Escrever zero sobre zero como resposta.** Isso não é um número, é um aviso de que falta fatorar,
simplificar ou usar o conjugado.

**Cancelar antes de fatorar.** Não se corta parcela, só fator. Em x mais 3 dividido por x, o x não
some.

**Achar que assíntota é barreira.** A curva pode até cruzar a assíntota horizontal em alguma região.
O que o limite garante é o comportamento no fim, não o caminho inteiro.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule o limite de 2x mais 5 quando x tende a 3.
2. Calcule o limite de (x ao quadrado menos 1) dividido por (x menos 1) quando x tende a 1.
3. Calcule o limite de (3x ao quadrado mais 1) dividido por (x ao quadrado mais 2) quando x tende ao
   infinito.
4. Calcule o limite de x ao quadrado menos 4x mais 7 quando x tende a 2 e diga se a função é contínua
   nesse ponto.
5. Calcule o limite de 1 dividido por x quando x tende ao infinito.

**Bloco B. Consolidação**

6. Calcule o limite de (x ao quadrado menos 9) dividido por (x menos 3) quando x tende a 3, mostrando
   a fatoração usada.
7. Calcule o limite de (x ao quadrado menos 5x mais 6) dividido por (x menos 2) quando x tende a 2.
8. Calcule o limite de (x ao cubo menos 8) dividido por (x menos 2) quando x tende a 2.
9. Calcule o limite de (2x ao cubo menos 3x mais 1) dividido por (5x ao cubo mais x ao quadrado)
   quando x tende ao infinito.
10. Calcule o limite de (x ao quadrado menos 4) dividido por (x ao quadrado menos x menos 2) quando x
    tende a 2.
11. Seja f(x) igual a (x ao quadrado menos 1) dividido por (x menos 1) para x diferente de 1, e f(1)
    igual a a. Determine a para que f seja contínua em 1.
12. Calcule o limite de (raiz de x mais 4, menos 2) dividido por x quando x tende a zero.
13. Calcule o limite de (1 dividido por x, menos 1 dividido por 3) dividido por (x menos 3) quando x
    tende a 3.

**Bloco C. Aprofundamento**

14. Uma função vale 2x mais 1 para x menor que 2 e vale x ao quadrado mais b para x maior ou igual a
    2. Determine b para que ela seja contínua em todo ponto.
15. Calcule o limite de (x ao cubo menos 2x ao quadrado menos 4x mais 8) dividido por (x ao quadrado
    menos 4) quando x tende a 2. Explique por que o resultado não é obtido simplificando apenas um
    fator comum.
16. Determine a assíntota horizontal e as assíntotas verticais do gráfico de (4x ao quadrado menos 1)
    dividido por (2x ao quadrado mais 3x).
17. Calcule o limite de (raiz de x ao quadrado mais 3x) menos x quando x tende ao infinito.
18. Mostre que a função dada por (x ao quadrado menos x menos 6) dividido por (x menos 3) tem uma
    descontinuidade removível em 3 e diga qual valor deve ser atribuído nesse ponto para torná-la
    contínua.

### Gabarito

1. O limite é 11, obtido por substituição direta.
2. O limite é 2. Fatorando, o numerador é x menos 1 vezes x mais 1.
3. O limite é 3, o quociente dos coeficientes dos termos de maior grau.
4. O limite é 3, e a função é contínua no ponto, porque é polinomial e o valor coincide com o limite.
5. O limite é 0.
6. O limite é 6. O numerador se fatora como x menos 3 vezes x mais 3, o fator x menos 3 cancela e
   sobra x mais 3.
7. O limite é menos 1. O numerador se fatora como x menos 2 vezes x menos 3.
8. O limite é 12. O numerador se fatora como x menos 2 vezes x ao quadrado mais 2x mais 4.
9. O limite é 2 sobre 5.
10. O limite é 4 sobre 3. Numerador e denominador têm o fator x menos 2.
11. a igual a 2.
12. O limite é 1 sobre 4, obtido multiplicando pelo conjugado.
13. O limite é menos 1 sobre 9. A expressão se reduz a menos 1 dividido por 3x.
14. b igual a 1, porque os dois ramos precisam chegar a 5 no ponto de troca.
15. O limite é 0. O numerador se fatora como x menos 2, ao quadrado, vezes x mais 2, e o denominador
    como x menos 2 vezes x mais 2. Depois de cancelar, sobra x menos 2, que tende a 0. Cancelar um
    único fator ainda deixaria zero sobre zero.
16. Assíntota horizontal na reta y igual a 2. Assíntotas verticais em x igual a 0 e em x igual a
    menos 3 sobre 2.
17. O limite é 3 sobre 2. Multiplicando pelo conjugado, a expressão vira 3x dividido pela soma da
    raiz com x, e o limite sai comparando os termos de maior grau.
18. O numerador se fatora como x menos 3 vezes x mais 2, e o fator x menos 3 cancela. O limite quando
    x tende a 3 é 5, então basta atribuir 5 nesse ponto.

## EN

### Explanation

#### The idea before the symbol

A limit answers a simple question: **where is the value of the function heading as x gets close to a
number**. Notice that the question is not what the function is worth at that point. It is where it
points on arrival. Those two things agree almost always, and it is exactly when they disagree that
the concept becomes useful.

Think of the function giving the cost per person of a van split among its passengers. The more people
get in, the smaller each share, and the value gets close to zero without ever reaching it. That
approaching behaviour is what a limit describes.

The notation is

limit of f(x) as x tends to a, equals L

and it reads like this: when x is as close to a as you like, f(x) is as close to L as you like.

#### When substituting is enough

For polynomials, and for any function continuous at the point, the limit is simply the value of the
function. Substituting is always the first move. Only when substitution produces a meaningless
expression, such as zero divided by zero, does the real work begin.

#### The indeterminate form zero over zero

If numerator and denominator both go to zero, the quotient may tend to anything at all. The way out
is to **factor and simplify** the common factor, which is exactly the factor causing the zero in both
places.

**Example 1.** Find the limit of (x squared minus 9) divided by (x minus 3), as x tends to 3.
Substituting straight away gives zero over zero. Factoring the numerator, we have x minus 3 times x
plus 3. Cancelling the factor x minus 3 leaves x plus 3, and now substitution works: the limit is 6.

Notice what happened. The original function does not even exist at x equal to 3, because the
denominator vanishes. Yet the limit exists and equals 6, because the question is about the approach,
not about the point.

When a square root shows up, the same reasoning applies, with one extra step: multiply by the
conjugate to make the root leave the place where it gets in the way.

**Example 2.** Find the limit of (root of x plus 1, minus 1) divided by x, as x tends to zero.
Multiplying numerator and denominator by root of x plus 1, plus 1, the numerator becomes x plus 1
minus 1, that is, x. Cancelling the x leaves 1 divided by root of x plus 1, plus 1. Substituting, the
limit is one half.

#### Limits at infinity

When x grows without stopping, what rules a quotient of polynomials are the terms of highest degree.
If the degrees are equal, the limit is the quotient of the leading coefficients. If the bottom has
the higher degree, the limit is zero. If the top has the higher degree, the function grows without
bound.

**Example 3.** Find the limit of (3x squared plus 2x) divided by (x squared minus 5), as x tends to
infinity.
Both have degree 2, so the limit is 3 divided by 1, that is, 3. In practice you divide everything by
x squared and observe that the parts with x in the denominator go to zero.

This calculation is what locates the **horizontal asymptote** of the graph: the line at height 3,
which the curve gets closer and closer to.

#### Continuity

A function is continuous at a when three things happen at once: f(a) exists, the limit as x tends to
a exists, and the two values are equal. In drawing terms, the graph goes through the point with no
hole and no jump.

**Example 4.** Let f(x) equal (x squared minus 4) divided by (x minus 2) for x different from 2, and
f(2) equal to k. Which value of k makes f continuous at 2?
The limit as x tends to 2 is the limit of x plus 2, which is 4. For continuity, k must be 4.

This kind of hole that gets plugged by choosing a single value well is called a removable
discontinuity. A function that jumps instead, such as one that changes rule at x equal to 2 and
arrives at different values from each side, has a discontinuity that swapping one point will not
remove.

#### Common mistakes

**Confusing the limit with the value of the function.** The function may not even be defined at the
point and still have a limit there.

**Writing zero over zero as an answer.** That is not a number, it is a warning that factoring,
simplifying or the conjugate is still missing.

**Cancelling before factoring.** You cancel factors, never terms of a sum. In x plus 3 divided by x,
the x does not disappear.

**Thinking an asymptote is a barrier.** The curve may even cross the horizontal asymptote somewhere.
What the limit guarantees is the behaviour far out, not the whole path.

### Exercises

**Block A. Fundamentals**

1. Find the limit of 2x plus 5 as x tends to 3.
2. Find the limit of (x squared minus 1) divided by (x minus 1) as x tends to 1.
3. Find the limit of (3x squared plus 1) divided by (x squared plus 2) as x tends to infinity.
4. Find the limit of x squared minus 4x plus 7 as x tends to 2 and say whether the function is
   continuous at that point.
5. Find the limit of 1 divided by x as x tends to infinity.

**Block B. Building up**

6. Find the limit of (x squared minus 9) divided by (x minus 3) as x tends to 3, showing the
   factoring you used.
7. Find the limit of (x squared minus 5x plus 6) divided by (x minus 2) as x tends to 2.
8. Find the limit of (x cubed minus 8) divided by (x minus 2) as x tends to 2.
9. Find the limit of (2x cubed minus 3x plus 1) divided by (5x cubed plus x squared) as x tends to
   infinity.
10. Find the limit of (x squared minus 4) divided by (x squared minus x minus 2) as x tends to 2.
11. Let f(x) equal (x squared minus 1) divided by (x minus 1) for x different from 1, and f(1) equal
    to a. Find a so that f is continuous at 1.
12. Find the limit of (root of x plus 4, minus 2) divided by x as x tends to zero.
13. Find the limit of (1 divided by x, minus 1 divided by 3) divided by (x minus 3) as x tends to 3.

**Block C. Going further**

14. A function equals 2x plus 1 for x less than 2 and equals x squared plus b for x greater than or
    equal to 2. Find b so that it is continuous everywhere.
15. Find the limit of (x cubed minus 2x squared minus 4x plus 8) divided by (x squared minus 4) as x
    tends to 2. Explain why the result is not obtained by simplifying just one common factor.
16. Find the horizontal asymptote and the vertical asymptotes of the graph of (4x squared minus 1)
    divided by (2x squared plus 3x).
17. Find the limit of (root of x squared plus 3x) minus x as x tends to infinity.
18. Show that the function given by (x squared minus x minus 6) divided by (x minus 3) has a
    removable discontinuity at 3 and say which value must be assigned there to make it continuous.

### Answer key

1. The limit is 11, obtained by direct substitution.
2. The limit is 2. Factoring, the numerator is x minus 1 times x plus 1.
3. The limit is 3, the quotient of the coefficients of the highest degree terms.
4. The limit is 3, and the function is continuous at the point, because it is polynomial and the
   value agrees with the limit.
5. The limit is 0.
6. The limit is 6. The numerator factors as x minus 3 times x plus 3, the factor x minus 3 cancels
   and x plus 3 is left.
7. The limit is minus 1. The numerator factors as x minus 2 times x minus 3.
8. The limit is 12. The numerator factors as x minus 2 times x squared plus 2x plus 4.
9. The limit is 2 over 5.
10. The limit is 4 over 3. Numerator and denominator share the factor x minus 2.
11. a equals 2.
12. The limit is 1 over 4, obtained by multiplying by the conjugate.
13. The limit is minus 1 over 9. The expression reduces to minus 1 divided by 3x.
14. b equals 1, because both branches must arrive at 5 at the changeover point.
15. The limit is 0. The numerator factors as x minus 2, squared, times x plus 2, and the denominator
    as x minus 2 times x plus 2. After cancelling, x minus 2 is left, and it tends to 0. Cancelling a
    single factor would still leave zero over zero.
16. Horizontal asymptote at the line y equals 2. Vertical asymptotes at x equals 0 and at x equals
    minus 3 over 2.
17. The limit is 3 over 2. Multiplying by the conjugate, the expression becomes 3x divided by the sum
    of the root and x, and the limit comes from comparing the highest degree terms.
18. The numerator factors as x minus 3 times x plus 2, and the factor x minus 3 cancels. The limit as
    x tends to 3 is 5, so assigning 5 at that point is enough.

## VERIFICACAO

```python
X1: limit((x**2 - 9)/(x - 3), x, 3) == 6 and expand((x - 3)*(x + 3)) == x**2 - 9
X2: limit((sqrt(x + 1) - 1)/x, x, 0) == Rational(1, 2)
X3: limit((3*x**2 + 2*x)/(x**2 - 5), x, oo) == 3
X4: limit((x**2 - 4)/(x - 2), x, 2) == 4
E1: limit(2*x + 5, x, 3) == 11
E2: limit((x**2 - 1)/(x - 1), x, 1) == 2 and expand((x - 1)*(x + 1)) == x**2 - 1
E3: limit((3*x**2 + 1)/(x**2 + 2), x, oo) == 3
E4: limit(x**2 - 4*x + 7, x, 2) == 3 and (2**2 - 4*2 + 7) == 3
E5: limit(1/x, x, oo) == 0
E6: limit((x**2 - 9)/(x - 3), x, 3) == 6 and expand((x - 3)*(x + 3)) == x**2 - 9
E7: limit((x**2 - 5*x + 6)/(x - 2), x, 2) == -1 and expand((x - 2)*(x - 3)) == x**2 - 5*x + 6
E8: limit((x**3 - 8)/(x - 2), x, 2) == 12 and expand((x - 2)*(x**2 + 2*x + 4)) == x**3 - 8
E9: limit((2*x**3 - 3*x + 1)/(5*x**3 + x**2), x, oo) == Rational(2, 5)
E10: limit((x**2 - 4)/(x**2 - x - 2), x, 2) == Rational(4, 3)
E11: solve(Eq(a, limit((x**2 - 1)/(x - 1), x, 1)), a) == [2]
E12: limit((sqrt(x + 4) - 2)/x, x, 0) == Rational(1, 4)
E13: limit((1/x - Rational(1, 3))/(x - 3), x, 3) == Rational(-1, 9)
E14: solve(Eq(2*2 + 1, 2**2 + b), b) == [1] and 2*2 + 1 == 5
E15: limit((x**3 - 2*x**2 - 4*x + 8)/(x**2 - 4), x, 2) == 0 and expand((x - 2)**2*(x + 2)) == x**3 - 2*x**2 - 4*x + 8
E16: limit((4*x**2 - 1)/(2*x**2 + 3*x), x, oo) == 2 and sorted(solve(Eq(2*x**2 + 3*x, 0), x)) == [Rational(-3, 2), 0]
E17: limit(sqrt(x**2 + 3*x) - x, x, oo) == Rational(3, 2)
E18: limit((x**2 - x - 6)/(x - 3), x, 3) == 5 and expand((x - 3)*(x + 2)) == x**2 - x - 6
```
