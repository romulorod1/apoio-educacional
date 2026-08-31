---
id: MATEM1-05
serie: em1
unidade: algebra
titulo_pt: Inequações do 1º e do 2º grau
titulo_en: First and second degree inequalities
resumo_pt: Resolver desigualdades lineares e quadráticas, montar o quadro de sinais e tratar produto, quociente e sistemas sem perder condição de existência.
resumo_en: Solving linear and quadratic inequalities, building the sign chart and handling products, quotients and systems without losing the existence conditions.
prerequisitos: [MATEM1-03, MATEM1-04]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### Desigualdade não é equação

Uma equação pergunta **qual** número serve. Uma inequação pergunta **quais** números servem, e a
resposta quase nunca é um número solto: é um intervalo, ou uma reunião de intervalos. Escrever a
resposta como conjunto faz parte do trabalho.

As operações que valem numa equação valem quase todas aqui. Somar o mesmo valor nos dois lados
mantém a desigualdade. Multiplicar os dois lados por um número **positivo** também mantém. A única
regra nova é a que mais derruba gente em prova:

**Multiplicar ou dividir os dois lados por um número negativo inverte o sentido da desigualdade.**

Dá para conferir com números concretos. É verdade que 2 é menor que 5. Multiplicando os dois lados
por menos 1, fica menos 2 e menos 5, e agora menos 2 é **maior** que menos 5. O sentido virou.

#### Inequação do primeiro grau

O caminho é o mesmo da equação: isolar o x, com atenção redobrada ao sinal na hora de dividir.

**Exemplo 1.** Resolver 3x menos 7 maior que 5.
Somando 7 dos dois lados: 3x maior que 12. Dividindo por 3, que é positivo, o sentido se mantém:
x maior que 4. O conjunto solução são os valores maiores que 4, sem incluir o 4.

**Exemplo 2.** Resolver menos 2x mais 1 maior ou igual a 9.
Subtraindo 1: menos 2x maior ou igual a 8. Agora divido por menos 2, que é negativo, então o sentido
inverte: x menor ou igual a menos 4. O conjunto solução são os valores menores que menos 4,
incluindo o menos 4.

Quem esquece de virar o sinal encontra x maior ou igual a menos 4, que é exatamente o complementar
da resposta certa. Vale sempre testar um valor: com x igual a menos 10, menos 2 vezes menos 10 mais
1 dá 21, que de fato é maior ou igual a 9. Confirma.

#### Inequação do segundo grau: o estudo do sinal

Aqui não adianta isolar o x, porque ele aparece ao quadrado. O método é outro, e é o mesmo para toda
inequação quadrática:

1. Passar tudo para um lado, deixando zero do outro.
2. Achar as raízes da expressão quadrática.
3. Decidir a concavidade pelo sinal do coeficiente que acompanha x ao quadrado.
4. Ler no desenho mental da parábola onde ela fica acima ou abaixo do eixo horizontal.

A regra que resume o passo 4: **entre as raízes o sinal é o contrário do sinal do coeficiente
principal, e fora das raízes o sinal é o mesmo**.

**Exemplo 3.** Resolver x ao quadrado menos 5x mais 6 menor que zero.
As raízes são 2 e 3, porque somam 5 e multiplicam 6. O coeficiente principal é 1, positivo, então a
parábola abre para cima e fica **abaixo** do eixo apenas entre as raízes. O conjunto solução são os
valores entre 2 e 3, sem incluir os extremos.

**Exemplo 4.** Resolver menos x ao quadrado mais 4x menor ou igual a zero.
Fatorando, fica x vezes (menos x mais 4), com raízes 0 e 4. O coeficiente principal é menos 1, então
a parábola abre para baixo e é negativa fora das raízes. Como a desigualdade aceita o zero, as
raízes entram. O conjunto solução são os valores menores ou iguais a 0 reunidos com os valores
maiores ou iguais a 4.

Quando o discriminante é negativo, a parábola nunca toca o eixo, e o sinal é o mesmo em toda a reta.
Isso resolve casos que parecem difíceis num piscar de olhos: x ao quadrado mais x mais 1 é sempre
positivo, porque o discriminante vale menos 3 e a concavidade é para cima.

#### Inequação produto

Quando a inequação é um produto de fatores, cada fator recebe seu próprio estudo de sinal e depois
os sinais são multiplicados linha a linha. O quadro de sinais é a organização desse trabalho: uma
linha por fator, uma coluna por região da reta, e uma última linha com o produto.

**Exemplo 5.** Resolver (x menos 1) vezes (x mais 3) maior que zero.
O primeiro fator zera em 1 e é positivo à direita de 1. O segundo zera em menos 3 e é positivo à
direita de menos 3. Nas regiões da reta:

- valores menores que menos 3: o primeiro fator é negativo e o segundo é negativo, então o produto é
  positivo.
- valores entre menos 3 e 1: o primeiro é negativo e o segundo é positivo, então o produto é
  negativo.
- valores maiores que 1: os dois são positivos, então o produto é positivo.

O conjunto solução são os valores menores que menos 3 reunidos com os valores maiores que 1, sem
incluir os extremos.

#### Inequação quociente

O quadro de sinais é o mesmo, porque o sinal de uma divisão segue a mesma regra do produto. A
diferença é a condição de existência: **o denominador nunca pode ser zero**, mesmo quando a
desigualdade aceita a igualdade. Essa é a armadilha clássica de prova.

**Exemplo 6.** Resolver (x menos 2) dividido por (x mais 1) maior ou igual a zero.
O numerador zera em 2 e o denominador zera em menos 1. Nas regiões:

- valores menores que menos 1: numerador negativo e denominador negativo, quociente positivo.
- valores entre menos 1 e 2: numerador negativo e denominador positivo, quociente negativo.
- valores maiores que 2: os dois positivos, quociente positivo.

O valor 2 entra, porque anula o numerador e a desigualdade aceita o zero. O valor menos 1 fica de
fora, porque anula o denominador. O conjunto solução são os valores menores que menos 1 reunidos com
os valores maiores ou iguais a 2.

#### Sistema de inequações

Num sistema, cada inequação é resolvida sozinha e no fim se toma a **interseção** dos conjuntos:
serve o que satisfaz todas ao mesmo tempo.

**Exemplo 7.** Resolver o sistema formado por 2x mais 1 maior que 5 e por x menos 4 menor que 0.
A primeira dá x maior que 2. A segunda dá x menor que 4. A interseção são os valores entre 2 e 4,
sem incluir os extremos.

#### Erros comuns

**Esquecer de inverter o sinal ao dividir por número negativo.** É o erro mais frequente. Uma
alternativa segura é passar o termo com x para o lado onde ele fica positivo, em vez de dividir por
negativo.

**Multiplicar em cruz numa inequação com fração.** Só se pode multiplicar pelos dois lados quando se
conhece o sinal do que multiplica, e o denominador com x muda de sinal. O caminho correto é passar
tudo para um lado e montar o quadro.

**Deixar o valor que zera o denominador dentro da resposta.** Ele nunca entra, nem com desigualdade
que aceita igualdade.

**Cancelar um fator com x dos dois lados.** Cancelar equivale a dividir por algo de sinal
desconhecido, o que pode inverter o sentido sem aviso. Fatore e monte o quadro.

**Trocar reunião por interseção.** Sistema pede interseção. Estudo de sinal com resposta fora das
raízes pede reunião.

### Exercícios

**Bloco A. Fundamentos**

1. Resolva 3x menos 7 maior que 5.
2. Resolva menos 2x mais 1 maior ou igual a 9.
3. Resolva 5x mais 2 menor que 3x mais 10.
4. Resolva x ao quadrado menos 5x mais 6 menor que zero.
5. Resolva x ao quadrado menos 9 maior ou igual a zero.

**Bloco B. Consolidação**

6. Resolva menos x ao quadrado mais 4x menor ou igual a zero.
7. Resolva x ao quadrado mais 6x mais 9 maior que zero.
8. Resolva x ao quadrado mais x mais 1 maior que zero.
9. Resolva (x menos 1) vezes (x mais 3) maior que zero.
10. Resolva (x menos 2) dividido por (x mais 1) maior ou igual a zero.
11. Resolva o sistema formado por 2x mais 1 maior que 5 e por x menos 4 menor que 0.
12. Determine para quais valores de x o gráfico de f(x) igual a x ao quadrado menos 4 fica acima do
    gráfico de g(x) igual a 3x.
13. Uma fábrica tem lucro dado por L(x) igual a menos x ao quadrado mais 10x menos 16, onde x é a
    quantidade produzida em milhares de peças. Para quais quantidades o lucro é positivo?

**Bloco C. Aprofundamento**

14. Resolva a inequação produto (x menos 1) vezes (x mais 2) vezes (x menos 4) menor que zero,
    montando o quadro de sinais completo.
15. Resolva (x ao quadrado menos 4) dividido por (x menos 3) menor ou igual a zero, indicando a
    condição de existência.
16. Determine os valores de m para que a inequação x ao quadrado mais mx mais 4 maior que zero seja
    verdadeira para todo x real.
17. Determine o domínio da função f(x) igual à raiz quadrada de (x ao quadrado menos 5x mais 4).
18. Resolva 1 dividido por x menor que 3, tomando cuidado com o sinal de x, e explique por que
    multiplicar os dois lados por x não é um caminho válido aqui.

### Gabarito

1. Os valores maiores que 4, sem incluir o 4.
2. Os valores menores que menos 4, incluindo o menos 4. O sentido inverte porque se divide por menos
   2.
3. Os valores menores que 4, sem incluir o 4.
4. Os valores entre 2 e 3, sem incluir os extremos.
5. Os valores menores ou iguais a menos 3 reunidos com os valores maiores ou iguais a 3.
6. Os valores menores ou iguais a 0 reunidos com os valores maiores ou iguais a 4.
7. Todos os reais, com a única exceção de menos 3. A expressão é o quadrado de (x mais 3), que só
   deixa de ser positiva quando x vale menos 3.
8. Todos os reais. O discriminante vale menos 3 e a concavidade é para cima, então a parábola nunca
   toca o eixo.
9. Os valores menores que menos 3 reunidos com os valores maiores que 1, sem incluir os extremos.
10. Os valores menores que menos 1 reunidos com os valores maiores ou iguais a 2. O menos 1 fica de
    fora porque anula o denominador.
11. Os valores entre 2 e 4, sem incluir os extremos.
12. Os valores menores que menos 1 reunidos com os valores maiores que 4, sem incluir os extremos.
    A condição é x ao quadrado menos 4 maior que 3x.
13. As quantidades entre 2 e 8, sem incluir os extremos, ou seja, entre 2 mil e 8 mil peças.
14. Os valores menores que menos 2 reunidos com os valores entre 1 e 4, sem incluir os extremos. As
    raízes são menos 2, 1 e 4, e o produto é negativo nas duas regiões indicadas.
15. Os valores menores ou iguais a menos 2 reunidos com os valores entre 2 e 3, incluindo o 2 e sem
    incluir o 3. A condição de existência é x diferente de 3.
16. Os valores entre menos 4 e 4, sem incluir os extremos. É preciso que o discriminante, que vale m
    ao quadrado menos 16, seja negativo.
17. Os valores menores ou iguais a 1 reunidos com os valores maiores ou iguais a 4, porque o radicando
    precisa ser maior ou igual a zero.
18. Os valores menores que 0 reunidos com os valores maiores que um terço, sem incluir os extremos.
    Multiplicar os dois lados por x não vale porque o sinal de x é desconhecido, e multiplicar por
    valor negativo inverteria o sentido da desigualdade. O caminho correto é passar tudo para um lado
    e estudar o sinal de (1 menos 3x) dividido por x.

## EN

### Explanation

#### An inequality is not an equation

An equation asks **which** number works. An inequality asks **which numbers** work, and the answer is
almost never a single number: it is an interval, or a union of intervals. Writing the answer as a set
is part of the job.

Almost every operation that is valid for equations is valid here. Adding the same value to both sides
keeps the inequality. Multiplying both sides by a **positive** number also keeps it. The one new rule
is the one that trips most students up in tests:

**Multiplying or dividing both sides by a negative number reverses the direction of the inequality.**

You can check this with concrete numbers. It is true that 2 is less than 5. Multiplying both sides by
minus 1 gives minus 2 and minus 5, and now minus 2 is **greater** than minus 5. The direction flipped.

#### First degree inequalities

The route is the same as for equations: isolate x, with extra care about the sign when you divide.

**Example 1.** Solve 3x minus 7 greater than 5.
Adding 7 to both sides: 3x greater than 12. Dividing by 3, which is positive, keeps the direction:
x greater than 4. The solution set is the values greater than 4, not including 4.

**Example 2.** Solve minus 2x plus 1 greater than or equal to 9.
Subtracting 1: minus 2x greater than or equal to 8. Now I divide by minus 2, which is negative, so the
direction reverses: x less than or equal to minus 4. The solution set is the values less than minus 4,
including minus 4.

Anyone who forgets to flip the sign gets x greater than or equal to minus 4, which is exactly the
complement of the right answer. It is always worth testing a value: with x equal to minus 10, minus 2
times minus 10 plus 1 gives 21, which is indeed greater than or equal to 9. That confirms it.

#### Second degree inequalities: sign analysis

Here isolating x gets you nowhere, because x appears squared. The method is different, and it is the
same for every quadratic inequality:

1. Move everything to one side, leaving zero on the other.
2. Find the roots of the quadratic expression.
3. Decide the concavity from the sign of the coefficient of x squared.
4. Read off the mental picture of the parabola where it sits above or below the horizontal axis.

The rule that sums up step 4: **between the roots the sign is the opposite of the sign of the leading
coefficient, and outside the roots the sign is the same**.

**Example 3.** Solve x squared minus 5x plus 6 less than zero.
The roots are 2 and 3, because they add to 5 and multiply to 6. The leading coefficient is 1, which is
positive, so the parabola opens upwards and sits **below** the axis only between the roots. The
solution set is the values between 2 and 3, not including the endpoints.

**Example 4.** Solve minus x squared plus 4x less than or equal to zero.
Factoring gives x times (minus x plus 4), with roots 0 and 4. The leading coefficient is minus 1, so
the parabola opens downwards and is negative outside the roots. Since the inequality accepts zero, the
roots are included. The solution set is the values less than or equal to 0 together with the values
greater than or equal to 4.

When the discriminant is negative the parabola never touches the axis, and the sign is the same all
along the line. That settles cases that look hard in a blink: x squared plus x plus 1 is always
positive, because the discriminant is minus 3 and the concavity is upwards.

#### Product inequalities

When the inequality is a product of factors, each factor gets its own sign analysis and then the signs
are multiplied row by row. The sign chart organises that work: one row per factor, one column per
region of the line, and a final row with the product.

**Example 5.** Solve (x minus 1) times (x plus 3) greater than zero.
The first factor is zero at 1 and positive to the right of 1. The second is zero at minus 3 and
positive to the right of minus 3. In the regions of the line:

- values less than minus 3: the first factor is negative and the second is negative, so the product is
  positive.
- values between minus 3 and 1: the first is negative and the second is positive, so the product is
  negative.
- values greater than 1: both are positive, so the product is positive.

The solution set is the values less than minus 3 together with the values greater than 1, not
including the endpoints.

#### Quotient inequalities

The sign chart is the same, because the sign of a division follows the same rule as the product. The
difference is the existence condition: **the denominator can never be zero**, even when the inequality
accepts equality. This is the classic test trap.

**Example 6.** Solve (x minus 2) divided by (x plus 1) greater than or equal to zero.
The numerator is zero at 2 and the denominator is zero at minus 1. In the regions:

- values less than minus 1: negative numerator and negative denominator, positive quotient.
- values between minus 1 and 2: negative numerator and positive denominator, negative quotient.
- values greater than 2: both positive, positive quotient.

The value 2 is included, because it makes the numerator zero and the inequality accepts zero. The
value minus 1 is left out, because it makes the denominator zero. The solution set is the values less
than minus 1 together with the values greater than or equal to 2.

#### Systems of inequalities

In a system, each inequality is solved on its own and at the end you take the **intersection** of the
sets: what works is what satisfies all of them at the same time.

**Example 7.** Solve the system made of 2x plus 1 greater than 5 and x minus 4 less than 0.
The first gives x greater than 2. The second gives x less than 4. The intersection is the values
between 2 and 4, not including the endpoints.

#### Common mistakes

**Forgetting to reverse the sign when dividing by a negative number.** This is the most frequent slip.
A safe alternative is to move the term with x to the side where it comes out positive, instead of
dividing by a negative.

**Cross multiplying in an inequality with a fraction.** You may only multiply both sides when you know
the sign of what you multiply by, and a denominator with x changes sign. The correct route is to move
everything to one side and build the chart.

**Leaving the value that makes the denominator zero inside the answer.** It never belongs there, not
even with an inequality that accepts equality.

**Cancelling a factor with x from both sides.** Cancelling amounts to dividing by something whose sign
is unknown, which can reverse the direction without warning. Factor and build the chart.

**Swapping union for intersection.** A system calls for intersection. A sign analysis whose answer
lies outside the roots calls for union.

### Exercises

**Block A. Fundamentals**

1. Solve 3x minus 7 greater than 5.
2. Solve minus 2x plus 1 greater than or equal to 9.
3. Solve 5x plus 2 less than 3x plus 10.
4. Solve x squared minus 5x plus 6 less than zero.
5. Solve x squared minus 9 greater than or equal to zero.

**Block B. Building up**

6. Solve minus x squared plus 4x less than or equal to zero.
7. Solve x squared plus 6x plus 9 greater than zero.
8. Solve x squared plus x plus 1 greater than zero.
9. Solve (x minus 1) times (x plus 3) greater than zero.
10. Solve (x minus 2) divided by (x plus 1) greater than or equal to zero.
11. Solve the system made of 2x plus 1 greater than 5 and x minus 4 less than 0.
12. Find for which values of x the graph of f(x) equals x squared minus 4 lies above the graph of
    g(x) equals 3x.
13. A factory has profit given by L(x) equals minus x squared plus 10x minus 16, where x is the
    quantity produced in thousands of parts. For which quantities is the profit positive?

**Block C. Going further**

14. Solve the product inequality (x minus 1) times (x plus 2) times (x minus 4) less than zero,
    building the complete sign chart.
15. Solve (x squared minus 4) divided by (x minus 3) less than or equal to zero, stating the existence
    condition.
16. Find the values of m for which the inequality x squared plus mx plus 4 greater than zero holds for
    every real x.
17. Find the domain of the function f(x) equal to the square root of (x squared minus 5x plus 4).
18. Solve 1 divided by x less than 3, being careful with the sign of x, and explain why multiplying
    both sides by x is not a valid route here.

### Answer key

1. The values greater than 4, not including 4.
2. The values less than minus 4, including minus 4. The direction reverses because you divide by minus
   2.
3. The values less than 4, not including 4.
4. The values between 2 and 3, not including the endpoints.
5. The values less than or equal to minus 3 together with the values greater than or equal to 3.
6. The values less than or equal to 0 together with the values greater than or equal to 4.
7. All real numbers, with the single exception of minus 3. The expression is the square of (x plus 3),
   which stops being positive only when x is minus 3.
8. All real numbers. The discriminant is minus 3 and the concavity is upwards, so the parabola never
   touches the axis.
9. The values less than minus 3 together with the values greater than 1, not including the endpoints.
10. The values less than minus 1 together with the values greater than or equal to 2. Minus 1 is left
    out because it makes the denominator zero.
11. The values between 2 and 4, not including the endpoints.
12. The values less than minus 1 together with the values greater than 4, not including the endpoints.
    The condition is x squared minus 4 greater than 3x.
13. The quantities between 2 and 8, not including the endpoints, that is, between 2 thousand and 8
    thousand parts.
14. The values less than minus 2 together with the values between 1 and 4, not including the endpoints.
    The roots are minus 2, 1 and 4, and the product is negative in the two regions indicated.
15. The values less than or equal to minus 2 together with the values between 2 and 3, including 2 and
    not including 3. The existence condition is x different from 3.
16. The values between minus 4 and 4, not including the endpoints. The discriminant, which is m squared
    minus 16, has to be negative.
17. The values less than or equal to 1 together with the values greater than or equal to 4, because the
    expression under the root has to be greater than or equal to zero.
18. The values less than 0 together with the values greater than one third, not including the endpoints.
    Multiplying both sides by x is not allowed because the sign of x is unknown, and multiplying by a
    negative value would reverse the direction of the inequality. The correct route is to move
    everything to one side and study the sign of (1 minus 3x) divided by x.

## VERIFICACAO

```python
X1: solveset(3*x - 7 > 5, x, Reals) == Interval.open(4, oo)
X2: solveset(-2*x + 1 >= 9, x, Reals) == Interval(-oo, -4)
X3: solveset(x**2 - 5*x + 6 < 0, x, Reals) == Interval.open(2, 3)
X4: solveset(-x**2 + 4*x <= 0, x, Reals) == Union(Interval(-oo, 0), Interval(4, oo))
X5: solveset((x - 1)*(x + 3) > 0, x, Reals) == Union(Interval.open(-oo, -3), Interval.open(1, oo))
X6: solveset((x - 2)/(x + 1) >= 0, x, Reals) == Union(Interval.open(-oo, -1), Interval(2, oo))
X7: solveset(2*x + 1 > 5, x, Reals).intersect(solveset(x - 4 < 0, x, Reals)) == Interval.open(2, 4)
E1: solveset(3*x - 7 > 5, x, Reals) == Interval.open(4, oo)
E2: solveset(-2*x + 1 >= 9, x, Reals) == Interval(-oo, -4)
E3: solveset(5*x + 2 < 3*x + 10, x, Reals) == Interval.open(-oo, 4)
E4: solveset(x**2 - 5*x + 6 < 0, x, Reals) == Interval.open(2, 3)
E5: solveset(x**2 - 9 >= 0, x, Reals) == Union(Interval(-oo, -3), Interval(3, oo))
E6: solveset(-x**2 + 4*x <= 0, x, Reals) == Union(Interval(-oo, 0), Interval(4, oo))
E7: solveset(x**2 + 6*x + 9 > 0, x, Reals) == Union(Interval.open(-oo, -3), Interval.open(-3, oo))
E8: solveset(x**2 + x + 1 > 0, x, Reals) == Reals and len(real_roots(x**2 + x + 1)) == 0
E9: solveset((x - 1)*(x + 3) > 0, x, Reals) == Union(Interval.open(-oo, -3), Interval.open(1, oo))
E10: solveset((x - 2)/(x + 1) >= 0, x, Reals) == Union(Interval.open(-oo, -1), Interval(2, oo))
E11: solveset(2*x + 1 > 5, x, Reals).intersect(solveset(x - 4 < 0, x, Reals)) == Interval.open(2, 4)
E12: solveset(x**2 - 4 > 3*x, x, Reals) == Union(Interval.open(-oo, -1), Interval.open(4, oo))
E13: solveset(-x**2 + 10*x - 16 > 0, x, Reals) == Interval.open(2, 8)
E14: solveset((x - 1)*(x + 2)*(x - 4) < 0, x, Reals) == Union(Interval.open(-oo, -2), Interval.open(1, 4))
E15: solveset((x**2 - 4)/(x - 3) <= 0, x, Reals) == Union(Interval(-oo, -2), Interval.Ropen(2, 3))
E16: solveset(m**2 - 16 < 0, m, Reals) == Interval.open(-4, 4)
E17: solveset(x**2 - 5*x + 4 >= 0, x, Reals) == Union(Interval(-oo, 1), Interval(4, oo))
E18: solveset(1/x < 3, x, Reals) == Union(Interval.open(-oo, 0), Interval.open(Rational(1,3), oo))
```
