---
id: MATEM1-09
serie: em1
unidade: algebra
titulo_pt: Função logarítmica
titulo_en: Logarithmic function
resumo_pt: Entender a função que desfaz a exponencial, ler seu domínio e seu crescimento pela base, e resolver equações e inequações sem esquecer a condição de existência.
resumo_en: Understanding the function that undoes the exponential, reading its domain and growth from the base, and solving equations and inequalities without forgetting the existence condition.
prerequisitos: [MATEM1-08, MATEM1-15]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### A função que desfaz a exponencial

Já se sabe o que é o logaritmo de um número. Agora ele vira função: fixa-se a base e deixa-se o
número variar.

f(x) = log_{a} x, com a > 0 e a ≠ 1

As duas condições sobre a base são as mesmas da exponencial, e pela mesma razão. Base negativa não
produz potência bem definida para todo expoente, e base 1 daria sempre o mesmo valor, o que impede
qualquer inversão.

A frase que resume tudo: **log_{a} x é o expoente que se dá à base a para obter x**. Então
log_{2} 8 = 3, porque 2^{3} = 8.

#### Domínio e imagem

Aqui mora o detalhe que mais derruba aluno em prova. A exponencial de base positiva **nunca produz
resultado negativo nem zero**. Logo, só existe logaritmo de número positivo.

- **Domínio:** x > 0.
- **Imagem:** todos os números reais.

Compare com a exponencial, que tem domínio em todos os reais e imagem nos positivos. Os dois papéis
estão trocados, e isso não é coincidência: **a função logarítmica é a inversa da exponencial de
mesma base**.

Duas consequências que se usam o tempo todo:

log_{a} a^{x} = x

Se y = log_{a} x, então a^{y} = x, para x > 0

#### O gráfico, descrito em palavras

Todo gráfico de função logarítmica passa pelo **ponto (1, 0)**, porque log_{a} 1 = 0 em qualquer
base. E passa pelo **ponto (a, 1)**, porque log_{a} a = 1.

Quando a > 1, a função é **crescente**: vem de valores muito negativos quando x se aproxima de zero
pela direita, cruza o eixo horizontal em 1 e sobe devagar para sempre. Sobe cada vez mais devagar,
ao contrário da exponencial, que acelera.

Quando 0 < a < 1, a função é **decrescente**: vem de valores muito positivos perto de zero, cruza o
eixo horizontal em 1 e desce.

Em ambos os casos a curva chega perto do eixo vertical sem nunca tocá-lo, porque não existe
logaritmo de zero.

**Exemplo 1.** Achar o domínio de f(x) = log_{2} (x - 3).
O que está dentro do logaritmo precisa ser positivo: x - 3 > 0, ou seja, x > 3. O domínio é x > 3.

#### Equações logarítmicas

O método tem sempre duas partes, e nenhuma pode ser pulada.

**Primeira parte: escrever a condição de existência.** Todo logaritmando precisa ser positivo.

**Segunda parte: resolver.** Se os dois lados têm logaritmo de mesma base, iguala-se o que está
dentro. Se um lado é número, usa-se a definição.

No fim, **testa-se cada raiz contra a condição de existência**. Uma raiz que viola a condição é
descartada, e isso é frequente.

**Exemplo 2.** Resolver log_{3} (x + 1) = 2.
Pela definição, x + 1 = 3^{2}, que dá 9. Logo x = 8. A condição pedia x + 1 > 0, e 8 + 1 = 9, que é
positivo. A raiz vale.

**Exemplo 3.** Resolver log_{2} x + log_{2} (x - 2) = 3.
A condição de existência exige x > 0 e x - 2 > 0, e as duas juntas dão x > 2.
Somando os logaritmos: log_{2} (x · (x - 2)) = 3. Então x · (x - 2) = 8, e a equação vira
x^{2} - 2x - 8 = 0, cujas raízes são 4 e -2.
A raiz -2 não serve, porque não é maior que 2. **A resposta é apenas x = 4.**

#### Inequações logarítmicas

Vale a regra da exponencial, com um cuidado a mais.

- Se a > 1, a função é crescente, e a desigualdade **mantém** o sentido ao passar para os
  logaritmandos.
- Se 0 < a < 1, a função é decrescente, e a desigualdade **inverte** o sentido.

A condição de existência entra por cima de tudo: a resposta final é a interseção entre o que a
desigualdade dá e o que a existência permite.

**Exemplo 4.** Resolver log_{2} (x - 1) < 3.
Existência: x - 1 > 0, ou seja, x > 1.
Como a base 2 é maior que 1, mantém-se o sentido: x - 1 < 2^{3}, que dá 8. Então x < 9.
Cruzando as duas informações, a resposta é 1 < x < 9.

#### Onde isso aparece no mundo

O logaritmo comprime escalas enormes em números pequenos, e por isso aparece sempre que uma grandeza
varia por multiplicação.

**Escala de intensidade sonora.** O nível em decibéis é

N = 10 · log_{10} (I / I_{0})

onde N é o nível, I a intensidade medida e I_{0} a intensidade de referência. Multiplicar a
intensidade por 10 acrescenta 10 decibéis, e não dez vezes mais barulho.

**Tempo de duplicação.** Se algo cresce multiplicando por um fator fixo, o tempo até dobrar sai de
uma equação exponencial, e o logaritmo é o que a resolve.

**Exemplo 5.** Uma população dobra a cada período e começa com 1 unidade. Quantos períodos até
passar de 1000 unidades?
Procura-se n com 2^{n} > 1000. Como 2^{10} = 1024, bastam 10 períodos.

#### Erros comuns

**Esquecer a condição de existência.** É o erro campeão. Resolver a equação e entregar todas as
raízes, sem testar, custa a questão inteira.

**Achar que log de zero vale zero.** Não existe logaritmo de zero. O que vale zero é o logaritmo
de 1: log_{a} 1 = 0.

**Distribuir o logaritmo sobre uma soma.** log_{a} (x + y) ≠ log_{a} x + log_{a} y. A propriedade da
soma vale para o logaritmo de um **produto**.

**Não inverter a desigualdade com base entre 0 e 1.** Nessa faixa a função decresce, então maior
vira menor.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule log_{2} 8.
2. Calcule log_{5} 1 e log_{5} 5.
3. Determine o domínio de f(x) = log_{2} (x - 3).
4. Diga se f(x) = log_{3} x é crescente ou decrescente, e justifique pela base.
5. Determine o valor de x tal que log_{2} x = 5.

**Bloco B. Consolidação**

6. Resolva log_{3} (x + 1) = 2.
7. Determine o domínio de f(x) = log_{10} (5 - 2x).
8. Resolva log_{4} (2x - 1) = log_{4} (x + 3).
9. Resolva log_{2} x + log_{2} (x - 2) = 3.
10. Resolva a inequação log_{2} (x - 1) < 3.
11. Determine em que ponto o gráfico de f(x) = log_{7} x cruza o eixo horizontal, e determine f(7).
12. Uma população dobra a cada período e começa com 1 unidade. Determine o menor número inteiro de
    períodos para que ela ultrapasse 1000 unidades.
13. O nível sonoro em decibéis é N = 10 · log_{10} (I / I_{0}), onde I é a intensidade medida e
    I_{0} a intensidade de referência. Se I / I_{0} = 1000, calcule N.

**Bloco C. Aprofundamento**

14. Resolva a inequação log_{3} (x - 2) > 1, apresentando a condição de existência e a resposta
    final como intervalo.
15. Resolva a inequação log_{1/2} x > 2, apresentando a condição de existência e explicando por que
    o sentido da desigualdade se inverte.
16. Determine todos os valores reais de x que tornam a expressão log_{x - 1} 16 um número real bem
    definido, e determine para qual desses valores essa expressão vale 2.
17. Determine o domínio de f(x) = log_{2} (x^{2} - 5x + 6), apresentando a resposta como união de
    intervalos.
18. Uma aplicação rende 8% ao ano sobre o valor acumulado. Escreva a equação que dá o tempo até o
    valor dobrar e mostre, sem calculadora, que esse tempo é maior que 8 anos e menor que 10 anos.

### Gabarito

1. 3, porque 2^{3} = 8.
2. log_{5} 1 = 0 e log_{5} 5 = 1.
3. x > 3.
4. Crescente, porque a base 3 é maior que 1.
5. x = 32.
6. x = 8. A condição de existência pedia x + 1 > 0, e 9 é positivo.
7. x < 5/2.
8. x = 4. A condição de existência pedia 2x - 1 > 0 e x + 3 > 0, e 4 atende às duas.
9. x = 4. A raiz -2 é descartada, porque o logaritmando ficaria negativo.
10. 1 < x < 9.
11. Cruza no ponto (1, 0), e f(7) = 1.
12. 10 períodos, porque 2^{10} = 1024.
13. 30 decibéis.
14. Existência: x > 2. Como a base 3 é maior que 1, vem x - 2 > 3, ou seja, x > 5. Resposta: x > 5.
15. Existência: x > 0. Como a base 1/2 está entre 0 e 1, a função é decrescente e o sentido se
    inverte: x < (1/2)^{2}, que dá 1/4. Resposta: 0 < x < 1/4.
16. A base precisa ser positiva e diferente de 1, logo x > 1 e x ≠ 2. A expressão vale 2 quando
    (x - 1)^{2} = 16, ou seja, quando x - 1 = 4, o que dá x = 5.
17. x < 2 ou x > 3, em ambos os casos sem incluir os extremos.
18. A equação é 1,08^{n} = 2. Como 1,08^{8} vale aproximadamente 1,85, que é menor que 2, oito anos
    não bastam. E 1,08^{10} vale aproximadamente 2,159, que é maior que 2. Logo o tempo de
    duplicação está entre 8 e 10 anos.

## EN

### Explanation

#### The function that undoes the exponential

You already know what the logarithm of a number is. Now it becomes a function: you fix the base and
let the number vary.

f(x) = log_{a} x, with a > 0 and a ≠ 1

The two conditions on the base are the same as for the exponential, and for the same reason. A
negative base does not give a well defined power for every exponent, and base 1 would always give
the same value, which makes any inversion impossible.

The sentence that sums it all up: **log_{a} x is the exponent you give the base a to get x**. So
log_{2} 8 = 3, because 2^{3} = 8.

#### Domain and range

Here lies the detail that trips up most students in a test. The exponential with a positive base
**never gives a negative result nor zero**. So the logarithm only exists for positive numbers.

- **Domain:** x > 0.
- **Range:** all real numbers.

Compare this with the exponential, whose domain is all the reals and whose range is the positives.
The two roles are swapped, and that is no coincidence: **the logarithmic function is the inverse of
the exponential with the same base**.

Two consequences that get used all the time:

log_{a} a^{x} = x

If y = log_{a} x, then a^{y} = x, for x > 0

#### The graph, described in words

Every logarithmic graph passes through the **point (1, 0)**, because log_{a} 1 = 0 in any base. And
it passes through the **point (a, 1)**, because log_{a} a = 1.

When a > 1, the function is **increasing**: it comes from very negative values as x approaches zero
from the right, crosses the horizontal axis at 1 and climbs slowly forever. It climbs more and more
slowly, unlike the exponential, which speeds up.

When 0 < a < 1, the function is **decreasing**: it comes from very positive values near zero,
crosses the horizontal axis at 1 and goes down.

In both cases the curve gets close to the vertical axis without ever touching it, because there is
no logarithm of zero.

**Example 1.** Find the domain of f(x) = log_{2} (x - 3).
Whatever sits inside the logarithm has to be positive: x - 3 > 0, that is, x > 3. The domain is
x > 3.

#### Logarithmic equations

The method always has two parts, and neither may be skipped.

**First part: write the existence condition.** Every argument of a logarithm has to be positive.

**Second part: solve.** If both sides have a logarithm with the same base, set what is inside them
equal. If one side is a number, use the definition.

At the end, **test every root against the existence condition**. A root that breaks the condition is
thrown out, and that happens often.

**Example 2.** Solve log_{3} (x + 1) = 2.
By the definition, x + 1 = 3^{2}, which gives 9. So x = 8. The condition asked for x + 1 > 0, and
8 + 1 = 9, which is positive. The root holds.

**Example 3.** Solve log_{2} x + log_{2} (x - 2) = 3.
The existence condition requires x > 0 and x - 2 > 0, and the two together give x > 2.
Adding the logarithms: log_{2} (x · (x - 2)) = 3. So x · (x - 2) = 8, and the equation becomes
x^{2} - 2x - 8 = 0, whose roots are 4 and -2.
The root -2 does not serve, because it is not greater than 2. **The answer is only x = 4.**

#### Logarithmic inequalities

The rule from the exponential holds, with one extra care.

- If a > 1, the function is increasing, and the inequality **keeps** its direction when you pass to
  the arguments.
- If 0 < a < 1, the function is decreasing, and the inequality **reverses** its direction.

The existence condition sits on top of everything: the final answer is the intersection of what the
inequality gives and what existence allows.

**Example 4.** Solve log_{2} (x - 1) < 3.
Existence: x - 1 > 0, that is, x > 1.
Since base 2 is greater than 1, the direction is kept: x - 1 < 2^{3}, which gives 8. So x < 9.
Crossing the two pieces of information, the answer is 1 < x < 9.

#### Where this shows up in the world

The logarithm squeezes huge scales into small numbers, so it turns up whenever a quantity varies by
multiplication.

**Sound intensity scale.** The level in decibels is

N = 10 · log_{10} (I / I_{0})

where N is the level, I the measured intensity and I_{0} the reference intensity. Multiplying the
intensity by 10 adds 10 decibels, not ten times as much noise.

**Doubling time.** If something grows by multiplying by a fixed factor, the time until it doubles
comes from an exponential equation, and the logarithm is what solves it.

**Example 5.** A population doubles each period and starts with 1 unit. How many periods until it
passes 1000 units?
We look for n with 2^{n} > 1000. Since 2^{10} = 1024, 10 periods are enough.

#### Common mistakes

**Forgetting the existence condition.** This is the champion mistake. Solving the equation and
handing in every root, without testing, costs the whole question.

**Thinking that log of zero is zero.** There is no logarithm of zero. What equals zero is the
logarithm of 1: log_{a} 1 = 0.

**Spreading the logarithm over a sum.** log_{a} (x + y) ≠ log_{a} x + log_{a} y. The sum property
holds for the logarithm of a **product**.

**Not reversing the inequality with a base between 0 and 1.** In that range the function decreases,
so greater turns into less.

### Exercises

**Block A. Fundamentals**

1. Work out log_{2} 8.
2. Work out log_{5} 1 and log_{5} 5.
3. Find the domain of f(x) = log_{2} (x - 3).
4. Say whether f(x) = log_{3} x is increasing or decreasing, and justify it from the base.
5. Find the value of x such that log_{2} x = 5.

**Block B. Building up**

6. Solve log_{3} (x + 1) = 2.
7. Find the domain of f(x) = log_{10} (5 - 2x).
8. Solve log_{4} (2x - 1) = log_{4} (x + 3).
9. Solve log_{2} x + log_{2} (x - 2) = 3.
10. Solve the inequality log_{2} (x - 1) < 3.
11. Find the point where the graph of f(x) = log_{7} x crosses the horizontal axis, and find f(7).
12. A population doubles each period and starts with 1 unit. Find the smallest whole number of
    periods for it to pass 1000 units.
13. The sound level in decibels is N = 10 · log_{10} (I / I_{0}), where I is the measured intensity
    and I_{0} the reference intensity. If I / I_{0} = 1000, work out N.

**Block C. Going further**

14. Solve the inequality log_{3} (x - 2) > 1, showing the existence condition and the final answer
    as an interval.
15. Solve the inequality log_{1/2} x > 2, showing the existence condition and explaining why the
    direction of the inequality reverses.
16. Find every real value of x that makes the expression log_{x - 1} 16 a well defined real number,
    and find for which of those values that expression equals 2.
17. Find the domain of f(x) = log_{2} (x^{2} - 5x + 6), giving the answer as a union of intervals.
18. An investment earns 8% a year on the accumulated amount. Write the equation that gives the time
    until the value doubles and show, without a calculator, that this time is more than 8 years and
    less than 10 years.

### Answer key

1. 3, because 2^{3} = 8.
2. log_{5} 1 = 0 and log_{5} 5 = 1.
3. x > 3.
4. Increasing, because the base 3 is greater than 1.
5. x = 32.
6. x = 8. The existence condition asked for x + 1 > 0, and 9 is positive.
7. x < 5/2.
8. x = 4. The existence condition asked for 2x - 1 > 0 and x + 3 > 0, and 4 meets both.
9. x = 4. The root -2 is thrown out, because the argument would be negative.
10. 1 < x < 9.
11. It crosses at the point (1, 0), and f(7) = 1.
12. 10 periods, because 2^{10} = 1024.
13. 30 decibels.
14. Existence: x > 2. Since the base 3 is greater than 1, we get x - 2 > 3, that is, x > 5. Answer:
    x > 5.
15. Existence: x > 0. Since the base 1/2 lies between 0 and 1, the function is decreasing and the
    direction reverses: x < (1/2)^{2}, which gives 1/4. Answer: 0 < x < 1/4.
16. The base has to be positive and different from 1, so x > 1 and x ≠ 2. The expression equals 2
    when (x - 1)^{2} = 16, that is, when x - 1 = 4, which gives x = 5.
17. x < 2 or x > 3, in both cases not including the endpoints.
18. The equation is 1.08^{n} = 2. Since 1.08^{8} is about 1.85, which is less than 2, eight years
    are not enough. And 1.08^{10} is about 2.159, which is greater than 2. So the doubling time
    lies between 8 and 10 years.

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
