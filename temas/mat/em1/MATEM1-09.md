---
id: MATEM1-09
serie: em1
unidade: algebra
titulo_pt: Função logarítmica
titulo_en: Logarithmic function
resumo_pt: Entender a função que desfaz a exponencial, ler seu domínio e seu crescimento pela base, e resolver equações e inequações sem esquecer a condição de existência.
resumo_en: Understanding the function that undoes the exponential, reading its domain and growth from the base, and solving equations and inequalities without forgetting the existence condition.
prerequisitos: [MATEM1-08]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### A função que desfaz a exponencial

Já se sabe o que é o logaritmo de um número. Agora ele vira função: fixa-se a base e deixa-se o
número variar.

f(x) igual a log de x na base a, com a positivo e a diferente de 1

As duas condições sobre a base são as mesmas da exponencial, e pela mesma razão. Base negativa não
produz potência bem definida para todo expoente, e base 1 daria sempre o mesmo valor, o que impede
qualquer inversão.

A frase que resume tudo: **log de x na base a é o expoente que se dá à base a para obter x**. Então
log de 8 na base 2 é 3, porque 2 elevado a 3 dá 8.

#### Domínio e imagem

Aqui mora o detalhe que mais derruba aluno em prova. A exponencial de base positiva **nunca produz
resultado negativo nem zero**. Logo, só existe logaritmo de número positivo.

- **Domínio:** os valores maiores que zero.
- **Imagem:** todos os números reais.

Compare com a exponencial, que tem domínio em todos os reais e imagem nos positivos. Os dois papéis
estão trocados, e isso não é coincidência: **a função logarítmica é a inversa da exponencial de
mesma base**.

Duas consequências que se usam o tempo todo:

log de a elevado a x, na base a, é igual a x

a elevado ao log de x na base a é igual a x, para x positivo

#### O gráfico, descrito em palavras

Todo gráfico de função logarítmica passa pelo **ponto de coordenadas 1 e 0**, porque log de 1 em
qualquer base vale zero. E passa pelo **ponto de coordenadas a e 1**, porque log da própria base
vale 1.

Quando a base é maior que 1, a função é **crescente**: vem de valores muito negativos quando x se
aproxima de zero pela direita, cruza o eixo horizontal em 1 e sobe devagar para sempre. Sobe cada
vez mais devagar, ao contrário da exponencial, que acelera.

Quando a base está entre 0 e 1, a função é **decrescente**: vem de valores muito positivos perto de
zero, cruza o eixo horizontal em 1 e desce.

Em ambos os casos a curva chega perto do eixo vertical sem nunca tocá-lo, porque não existe
logaritmo de zero.

**Exemplo 1.** Achar o domínio de f(x) igual a log de (x menos 3) na base 2.
O que está dentro do logaritmo precisa ser positivo: x menos 3 maior que zero, ou seja, x maior que
3. O domínio são os valores maiores que 3.

#### Equações logarítmicas

O método tem sempre duas partes, e nenhuma pode ser pulada.

**Primeira parte: escrever a condição de existência.** Todo logaritmando precisa ser positivo.

**Segunda parte: resolver.** Se os dois lados têm logaritmo de mesma base, iguala-se o que está
dentro. Se um lado é número, usa-se a definição.

No fim, **testa-se cada raiz contra a condição de existência**. Uma raiz que viola a condição é
descartada, e isso é frequente.

**Exemplo 2.** Resolver log de (x mais 1) na base 3 igual a 2.
Pela definição, x mais 1 é igual a 3 ao quadrado, que dá 9. Logo x vale 8. A condição pedia x mais 1
maior que zero, e 8 mais 1 dá 9, que é positivo. A raiz vale.

**Exemplo 3.** Resolver log de x na base 2 mais log de (x menos 2) na base 2 igual a 3.
A condição de existência exige x maior que zero e x menos 2 maior que zero, e as duas juntas dão x
maior que 2.
Somando os logaritmos: log de x vezes (x menos 2), na base 2, igual a 3. Então x vezes (x menos 2)
é igual a 8, e a equação vira x ao quadrado menos 2x menos 8 igual a zero, cujas raízes são 4 e
menos 2.
A raiz menos 2 não serve, porque não é maior que 2. **A resposta é apenas x igual a 4.**

#### Inequações logarítmicas

Vale a regra da exponencial, com um cuidado a mais.

- Se a base é maior que 1, a função é crescente, e a desigualdade **mantém** o sentido ao passar
  para os logaritmandos.
- Se a base está entre 0 e 1, a função é decrescente, e a desigualdade **inverte** o sentido.

A condição de existência entra por cima de tudo: a resposta final é a interseção entre o que a
desigualdade dá e o que a existência permite.

**Exemplo 4.** Resolver log de (x menos 1) na base 2 menor que 3.
Existência: x menos 1 maior que zero, ou seja, x maior que 1.
Como a base 2 é maior que 1, mantém-se o sentido: x menos 1 menor que 2 elevado a 3, que dá 8. Então
x menor que 9.
Cruzando as duas informações, a resposta são os valores entre 1 e 9, sem incluir os extremos.

#### Onde isso aparece no mundo

O logaritmo comprime escalas enormes em números pequenos, e por isso aparece sempre que uma grandeza
varia por multiplicação.

**Escala de intensidade sonora.** O nível em decibéis é 10 vezes o logaritmo decimal da razão entre
a intensidade medida e uma intensidade de referência. Multiplicar a intensidade por 10 acrescenta 10
decibéis, e não dez vezes mais barulho.

**Tempo de duplicação.** Se algo cresce multiplicando por um fator fixo, o tempo até dobrar sai de
uma equação exponencial, e o logaritmo é o que a resolve.

**Exemplo 5.** Uma população dobra a cada período e começa com 1 unidade. Quantos períodos até
passar de 1000 unidades?
Procura-se n com 2 elevado a n maior que 1000. Como 2 elevado a 10 dá 1024, bastam 10 períodos.

#### Erros comuns

**Esquecer a condição de existência.** É o erro campeão. Resolver a equação e entregar todas as
raízes, sem testar, custa a questão inteira.

**Achar que log de zero vale zero.** Não existe logaritmo de zero. O que vale zero é log de 1.

**Distribuir o logaritmo sobre uma soma.** Log de (x mais y) não é log de x mais log de y. A
propriedade da soma vale para o logaritmo de um **produto**.

**Não inverter a desigualdade com base entre 0 e 1.** Nessa faixa a função decresce, então maior
vira menor.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule log de 8 na base 2.
2. Calcule log de 1 na base 5 e log de 5 na base 5.
3. Determine o domínio de f(x) igual a log de (x menos 3) na base 2.
4. Diga se f(x) igual a log de x na base 3 é crescente ou decrescente, e justifique pela base.
5. Determine o valor de x tal que log de x na base 2 seja igual a 5.

**Bloco B. Consolidação**

6. Resolva log de (x mais 1) na base 3 igual a 2.
7. Determine o domínio de f(x) igual a log de (5 menos 2x) na base 10.
8. Resolva log de (2x menos 1) na base 4 igual a log de (x mais 3) na base 4.
9. Resolva log de x na base 2 mais log de (x menos 2) na base 2 igual a 3.
10. Resolva a inequação log de (x menos 1) na base 2 menor que 3.
11. Determine em que ponto o gráfico de f(x) igual a log de x na base 7 cruza o eixo horizontal, e
    determine f(7).
12. Uma população dobra a cada período e começa com 1 unidade. Determine o menor número inteiro de
    períodos para que ela ultrapasse 1000 unidades.
13. O nível sonoro em decibéis é 10 vezes o logaritmo decimal da razão entre a intensidade medida e
    a intensidade de referência. Se essa razão vale 1000, calcule o nível em decibéis.

**Bloco C. Aprofundamento**

14. Resolva a inequação log de (x menos 2) na base 3 maior que 1, apresentando a condição de
    existência e a resposta final como intervalo.
15. Resolva a inequação log de x na base um meio maior que 2, apresentando a condição de existência
    e explicando por que o sentido da desigualdade se inverte.
16. Determine todos os valores reais de x que tornam a expressão log de 16 na base (x menos 1) um
    número real bem definido, e determine para qual desses valores essa expressão vale 2.
17. Determine o domínio de f(x) igual a log de (x ao quadrado menos 5x mais 6) na base 2,
    apresentando a resposta como união de intervalos.
18. Uma aplicação rende 8 por cento ao ano sobre o valor acumulado. Escreva a equação que dá o
    tempo até o valor dobrar e mostre, sem calculadora, que esse tempo é maior que 8 anos e menor
    que 10 anos.

### Gabarito

1. 3, porque 2 elevado a 3 dá 8.
2. Log de 1 na base 5 vale 0 e log de 5 na base 5 vale 1.
3. Os valores maiores que 3.
4. Crescente, porque a base 3 é maior que 1.
5. x igual a 32.
6. x igual a 8. A condição de existência pedia x mais 1 positivo, e 9 é positivo.
7. Os valores menores que 5 sobre 2.
8. x igual a 4. A condição de existência pedia 2x menos 1 positivo e x mais 3 positivo, e 4 atende
   às duas.
9. x igual a 4. A raiz menos 2 é descartada, porque o logaritmando ficaria negativo.
10. Os valores entre 1 e 9, sem incluir os extremos.
11. Cruza no ponto de coordenadas 1 e 0, e f(7) vale 1.
12. 10 períodos, porque 2 elevado a 10 dá 1024.
13. 30 decibéis.
14. Existência: x maior que 2. Como a base 3 é maior que 1, vem x menos 2 maior que 3, ou seja, x
    maior que 5. Resposta: os valores maiores que 5.
15. Existência: x maior que 0. Como a base um meio está entre 0 e 1, a função é decrescente e o
    sentido se inverte: x menor que um meio elevado a 2, que dá 1 sobre 4. Resposta: os valores
    entre 0 e 1 sobre 4, sem incluir os extremos.
16. A base precisa ser positiva e diferente de 1, logo x maior que 1 e x diferente de 2. A expressão
    vale 2 quando a base ao quadrado dá 16, ou seja, quando x menos 1 vale 4, o que dá x igual a 5.
17. Os valores menores que 2 unidos aos valores maiores que 3, em ambos os casos sem incluir os
    extremos.
18. A equação é 1,08 elevado a n igual a 2. Como 1,08 elevado a 8 vale aproximadamente 1,85, que é
    menor que 2, oito anos não bastam. E 1,08 elevado a 10 vale aproximadamente 2,159, que é maior
    que 2. Logo o tempo de duplicação está entre 8 e 10 anos.

## EN

### Explanation

#### The function that undoes the exponential

You already know what the logarithm of a number is. Now it becomes a function: you fix the base and
let the number vary.

f(x) equals log of x to the base a, with a positive and a different from 1

The two conditions on the base are the same as for the exponential, and for the same reason. A
negative base does not give a well defined power for every exponent, and base 1 would always give
the same value, which makes any inversion impossible.

The sentence that sums it all up: **log of x to the base a is the exponent you give the base a to
get x**. So log of 8 to the base 2 is 3, because 2 to the power of 3 gives 8.

#### Domain and range

Here lies the detail that trips up most students in a test. The exponential with a positive base
**never gives a negative result nor zero**. So the logarithm only exists for positive numbers.

- **Domain:** the values greater than zero.
- **Range:** all real numbers.

Compare this with the exponential, whose domain is all the reals and whose range is the positives.
The two roles are swapped, and that is no coincidence: **the logarithmic function is the inverse of
the exponential with the same base**.

Two consequences that get used all the time:

log of a to the power of x, to the base a, equals x

a to the power of the log of x to the base a equals x, for x positive

#### The graph, described in words

Every logarithmic graph passes through the **point with coordinates 1 and 0**, because log of 1 in
any base is zero. And it passes through the **point with coordinates a and 1**, because the log of
the base itself is 1.

When the base is greater than 1, the function is **increasing**: it comes from very negative values
as x approaches zero from the right, crosses the horizontal axis at 1 and climbs slowly forever. It
climbs more and more slowly, unlike the exponential, which speeds up.

When the base lies between 0 and 1, the function is **decreasing**: it comes from very positive
values near zero, crosses the horizontal axis at 1 and goes down.

In both cases the curve gets close to the vertical axis without ever touching it, because there is
no logarithm of zero.

**Example 1.** Find the domain of f(x) equals log of (x minus 3) to the base 2.
Whatever sits inside the logarithm has to be positive: x minus 3 greater than zero, that is, x
greater than 3. The domain is the values greater than 3.

#### Logarithmic equations

The method always has two parts, and neither may be skipped.

**First part: write the existence condition.** Every argument of a logarithm has to be positive.

**Second part: solve.** If both sides have a logarithm with the same base, set what is inside them
equal. If one side is a number, use the definition.

At the end, **test every root against the existence condition**. A root that breaks the condition is
thrown out, and that happens often.

**Example 2.** Solve log of (x plus 1) to the base 3 equals 2.
By the definition, x plus 1 equals 3 squared, which gives 9. So x is 8. The condition asked for x
plus 1 greater than zero, and 8 plus 1 gives 9, which is positive. The root holds.

**Example 3.** Solve log of x to the base 2 plus log of (x minus 2) to the base 2 equals 3.
The existence condition requires x greater than zero and x minus 2 greater than zero, and the two
together give x greater than 2.
Adding the logarithms: log of x times (x minus 2), to the base 2, equals 3. So x times (x minus 2)
equals 8, and the equation becomes x squared minus 2x minus 8 equals zero, whose roots are 4 and
minus 2.
The root minus 2 does not serve, because it is not greater than 2. **The answer is only x equals 4.**

#### Logarithmic inequalities

The rule from the exponential holds, with one extra care.

- If the base is greater than 1, the function is increasing, and the inequality **keeps** its
  direction when you pass to the arguments.
- If the base lies between 0 and 1, the function is decreasing, and the inequality **reverses** its
  direction.

The existence condition sits on top of everything: the final answer is the intersection of what the
inequality gives and what existence allows.

**Example 4.** Solve log of (x minus 1) to the base 2 less than 3.
Existence: x minus 1 greater than zero, that is, x greater than 1.
Since base 2 is greater than 1, the direction is kept: x minus 1 less than 2 to the power of 3,
which gives 8. So x less than 9.
Crossing the two pieces of information, the answer is the values between 1 and 9, not including the
endpoints.

#### Where this shows up in the world

The logarithm squeezes huge scales into small numbers, so it turns up whenever a quantity varies by
multiplication.

**Sound intensity scale.** The level in decibels is 10 times the decimal logarithm of the ratio
between the measured intensity and a reference intensity. Multiplying the intensity by 10 adds 10
decibels, not ten times as much noise.

**Doubling time.** If something grows by multiplying by a fixed factor, the time until it doubles
comes from an exponential equation, and the logarithm is what solves it.

**Example 5.** A population doubles each period and starts with 1 unit. How many periods until it
passes 1000 units?
We look for n with 2 to the power of n greater than 1000. Since 2 to the power of 10 gives 1024, 10
periods are enough.

#### Common mistakes

**Forgetting the existence condition.** This is the champion mistake. Solving the equation and
handing in every root, without testing, costs the whole question.

**Thinking that log of zero is zero.** There is no logarithm of zero. What equals zero is log of 1.

**Spreading the logarithm over a sum.** Log of (x plus y) is not log of x plus log of y. The sum
property holds for the logarithm of a **product**.

**Not reversing the inequality with a base between 0 and 1.** In that range the function decreases,
so greater turns into less.

### Exercises

**Block A. Fundamentals**

1. Work out log of 8 to the base 2.
2. Work out log of 1 to the base 5 and log of 5 to the base 5.
3. Find the domain of f(x) equals log of (x minus 3) to the base 2.
4. Say whether f(x) equals log of x to the base 3 is increasing or decreasing, and justify it from
   the base.
5. Find the value of x such that log of x to the base 2 equals 5.

**Block B. Building up**

6. Solve log of (x plus 1) to the base 3 equals 2.
7. Find the domain of f(x) equals log of (5 minus 2x) to the base 10.
8. Solve log of (2x minus 1) to the base 4 equals log of (x plus 3) to the base 4.
9. Solve log of x to the base 2 plus log of (x minus 2) to the base 2 equals 3.
10. Solve the inequality log of (x minus 1) to the base 2 less than 3.
11. Find the point where the graph of f(x) equals log of x to the base 7 crosses the horizontal
    axis, and find f(7).
12. A population doubles each period and starts with 1 unit. Find the smallest whole number of
    periods for it to pass 1000 units.
13. The sound level in decibels is 10 times the decimal logarithm of the ratio between the measured
    intensity and the reference intensity. If that ratio is 1000, work out the level in decibels.

**Block C. Going further**

14. Solve the inequality log of (x minus 2) to the base 3 greater than 1, showing the existence
    condition and the final answer as an interval.
15. Solve the inequality log of x to the base one half greater than 2, showing the existence
    condition and explaining why the direction of the inequality reverses.
16. Find every real value of x that makes the expression log of 16 to the base (x minus 1) a well
    defined real number, and find for which of those values that expression equals 2.
17. Find the domain of f(x) equals log of (x squared minus 5x plus 6) to the base 2, giving the
    answer as a union of intervals.
18. An investment earns 8 per cent a year on the accumulated amount. Write the equation that gives
    the time until the value doubles and show, without a calculator, that this time is more than 8
    years and less than 10 years.

### Answer key

1. 3, because 2 to the power of 3 gives 8.
2. Log of 1 to the base 5 is 0 and log of 5 to the base 5 is 1.
3. The values greater than 3.
4. Increasing, because the base 3 is greater than 1.
5. x equals 32.
6. x equals 8. The existence condition asked for x plus 1 positive, and 9 is positive.
7. The values less than 5 over 2.
8. x equals 4. The existence condition asked for 2x minus 1 positive and x plus 3 positive, and 4
   meets both.
9. x equals 4. The root minus 2 is thrown out, because the argument would be negative.
10. The values between 1 and 9, not including the endpoints.
11. It crosses at the point with coordinates 1 and 0, and f(7) is 1.
12. 10 periods, because 2 to the power of 10 gives 1024.
13. 30 decibels.
14. Existence: x greater than 2. Since the base 3 is greater than 1, we get x minus 2 greater than
    3, that is, x greater than 5. Answer: the values greater than 5.
15. Existence: x greater than 0. Since the base one half lies between 0 and 1, the function is
    decreasing and the direction reverses: x less than one half to the power of 2, which gives 1
    over 4. Answer: the values between 0 and 1 over 4, not including the endpoints.
16. The base has to be positive and different from 1, so x greater than 1 and x different from 2.
    The expression equals 2 when the base squared gives 16, that is, when x minus 1 is 4, which
    gives x equals 5.
17. The values less than 2 together with the values greater than 3, in both cases not including the
    endpoints.
18. The equation is 1.08 to the power of n equals 2. Since 1.08 to the power of 8 is about 1.85,
    which is less than 2, eight years are not enough. And 1.08 to the power of 10 is about 2.159,
    which is greater than 2. So the doubling time lies between 8 and 10 years.

## VERIFICACAO

```python
X1: solveset(x - 3 > 0, x, Reals) == Interval.open(3, oo)
X2: solve(Eq(x + 1, 3**2), x) == [8] and 8 + 1 > 0
X3: solve(Eq(x*(x - 2), 8), x) == [-2, 4] and (-2 > 2) == False and 4 > 2
X4: solveset(x - 1 < 8, x, Reals) == Interval.open(-oo, 9) and Intersection(Interval.open(1, oo), Interval.open(-oo, 9)) == Interval.open(1, 9)
X5: 2**10 == 1024 and 1024 > 1000 and 2**9 < 1000
E1: simplify(log(8, 2) - 3) == 0
E2: simplify(log(1, 5)) == 0 and simplify(log(5, 5) - 1) == 0
E3: solveset(x - 3 > 0, x, Reals) == Interval.open(3, oo)
E4: 3 > 1
E5: solve(Eq(x, 2**5), x) == [32]
E6: solve(Eq(x + 1, 3**2), x) == [8] and 8 + 1 > 0
E7: solveset(5 - 2*x > 0, x, Reals) == Interval.open(-oo, Rational(5, 2))
E8: solve(Eq(2*x - 1, x + 3), x) == [4] and 2*4 - 1 > 0 and 4 + 3 > 0
E9: solve(Eq(x*(x - 2), 8), x) == [-2, 4] and 4 > 2 and (-2 > 2) == False
E10: Intersection(solveset(x - 1 > 0, x, Reals), solveset(x - 1 < 2**3, x, Reals)) == Interval.open(1, 9)
E11: simplify(log(1, 7)) == 0 and simplify(log(7, 7) - 1) == 0
E12: 2**10 == 1024 and 1024 > 1000 and 2**9 < 1000
E13: 10*log(1000, 10) == 30
E14: Intersection(solveset(x - 2 > 0, x, Reals), solveset(x - 2 > 3, x, Reals)) == Interval.open(5, oo)
E15: Rational(1, 2)**2 == Rational(1, 4) and Intersection(solveset(x > 0, x, Reals), solveset(x < Rational(1, 4), x, Reals)) == Interval.open(0, Rational(1, 4))
E16: Intersection(solveset(x - 1 > 0, x, Reals), Interval.open(-oo, oo)) - FiniteSet(2) == Union(Interval.open(1, 2), Interval.open(2, oo)) and solve(Eq((x - 1)**2, 16), x) == [-3, 5] and 5 - 1 == 4
E17: solveset(x**2 - 5*x + 6 > 0, x, Reals) == Union(Interval.open(-oo, 2), Interval.open(3, oo))
E18: Rational(108, 100)**8 < 2 and Rational(108, 100)**10 > 2
```
