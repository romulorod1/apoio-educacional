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

Dá para conferir com números concretos. É verdade que 2 < 5. Multiplicando os dois lados por -1,
ficam -2 e -5, e agora vale **-2 > -5**. O sentido virou.

#### Inequação do primeiro grau

O caminho é o mesmo da equação: isolar o x, com atenção redobrada ao sinal na hora de dividir.

**Exemplo 1.** Resolver 3x - 7 > 5.
Somando 7 dos dois lados: 3x > 12. Dividindo por 3, que é positivo, o sentido se mantém: x > 4.
O conjunto solução é x > 4: o próprio 4 fica de fora.

**Exemplo 2.** Resolver -2x + 1 ≥ 9.
Subtraindo 1: -2x ≥ 8. Agora divido por -2, que é negativo, então o sentido inverte: x ≤ -4.
O conjunto solução é x ≤ -4, e desta vez o próprio -4 entra.

Quem esquece de virar o sinal encontra x ≥ -4, que é exatamente o complementar da resposta certa.
Vale sempre testar um valor: com x = -10, temos -2 · (-10) + 1 = 21, e 21 ≥ 9 é verdade. Confirma.

#### Inequação do segundo grau: o estudo do sinal

Aqui não adianta isolar o x, porque ele aparece ao quadrado. O método é outro, e é o mesmo para toda
inequação quadrática:

1. Passar tudo para um lado, deixando zero do outro.
2. Achar as raízes da expressão quadrática.
3. Decidir a concavidade pelo sinal do coeficiente que acompanha x^{2}.
4. Ler no desenho mental da parábola onde ela fica acima ou abaixo do eixo horizontal.

A regra que resume o passo 4: **entre as raízes o sinal é o contrário do sinal do coeficiente
principal, e fora das raízes o sinal é o mesmo**.

**Exemplo 3.** Resolver x^{2} - 5x + 6 < 0.
As raízes são 2 e 3, porque somam 5 e multiplicam 6. O coeficiente principal é 1, positivo, então a
parábola abre para cima e fica **abaixo** do eixo apenas entre as raízes. O conjunto solução é
2 < x < 3.

**Exemplo 4.** Resolver -x^{2} + 4x ≤ 0.
Fatorando, fica x · (-x + 4), com raízes 0 e 4. O coeficiente principal é -1, então a parábola abre
para baixo e é negativa fora das raízes. Como a desigualdade aceita o zero, as raízes entram.
O conjunto solução é x ≤ 0 ou x ≥ 4.

Quando o discriminante é negativo, a parábola nunca toca o eixo, e o sinal é o mesmo em toda a reta.
Isso resolve casos que parecem difíceis num piscar de olhos: x^{2} + x + 1 é sempre positivo,
porque o discriminante vale -3 e a concavidade é para cima.

#### Inequação produto

Quando a inequação é um produto de fatores, cada fator recebe seu próprio estudo de sinal e depois
os sinais são multiplicados linha a linha. O quadro de sinais é a organização desse trabalho: uma
linha por fator, uma coluna por região da reta, e uma última linha com o produto.

**Exemplo 5.** Resolver (x - 1) · (x + 3) > 0.
O primeiro fator zera em 1 e é positivo à direita de 1. O segundo zera em -3 e é positivo à direita
de -3. Nas regiões da reta:

- para x < -3: o primeiro fator é negativo e o segundo é negativo, então o produto é positivo.
- para -3 < x < 1: o primeiro é negativo e o segundo é positivo, então o produto é negativo.
- para x > 1: os dois são positivos, então o produto é positivo.

O conjunto solução é x < -3 ou x > 1.

#### Inequação quociente

O quadro de sinais é o mesmo, porque o sinal de uma divisão segue a mesma regra do produto. A
diferença é a condição de existência: **o denominador nunca pode ser zero**, mesmo quando a
desigualdade aceita a igualdade. Essa é a armadilha clássica de prova.

**Exemplo 6.** Resolver (x - 2)/(x + 1) ≥ 0.
O numerador zera em 2 e o denominador zera em -1. Nas regiões:

- para x < -1: numerador negativo e denominador negativo, quociente positivo.
- para -1 < x < 2: numerador negativo e denominador positivo, quociente negativo.
- para x > 2: os dois positivos, quociente positivo.

O valor 2 entra, porque anula o numerador e a desigualdade aceita o zero. O valor -1 fica de fora,
porque anula o denominador. O conjunto solução é x < -1 ou x ≥ 2.

#### Sistema de inequações

Num sistema, cada inequação é resolvida sozinha e no fim se toma a **interseção** dos conjuntos:
serve o que satisfaz todas ao mesmo tempo.

**Exemplo 7.** Resolver o sistema formado por 2x + 1 > 5 e por x - 4 < 0.
A primeira dá x > 2. A segunda dá x < 4. A interseção é 2 < x < 4.

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

1. Resolva 3x - 7 > 5.
2. Resolva -2x + 1 ≥ 9.
3. Resolva 5x + 2 < 3x + 10.
4. Resolva x^{2} - 5x + 6 < 0.
5. Resolva x^{2} - 9 ≥ 0.

**Bloco B. Consolidação**

6. Resolva -x^{2} + 4x ≤ 0.
7. Resolva x^{2} + 6x + 9 > 0.
8. Resolva x^{2} + x + 1 > 0.
9. Resolva (x - 1) · (x + 3) > 0.
10. Resolva (x - 2)/(x + 1) ≥ 0.
11. Resolva o sistema formado por 2x + 1 > 5 e por x - 4 < 0.
12. Determine para quais valores de x o gráfico de f(x) = x^{2} - 4 fica acima do gráfico de
    g(x) = 3x.
13. Uma fábrica tem lucro dado por L(x) = -x^{2} + 10x - 16, onde x é a quantidade produzida em
    milhares de peças. Para quais quantidades o lucro é positivo?

**Bloco C. Aprofundamento**

14. Resolva a inequação produto (x - 1) · (x + 2) · (x - 4) < 0, montando o quadro de sinais
    completo.
15. Resolva (x^{2} - 4)/(x - 3) ≤ 0, indicando a condição de existência.
16. Determine os valores de m para que a inequação x^{2} + mx + 4 > 0 seja verdadeira para todo
    x real.
17. Determine o domínio da função f(x) = √(x^{2} - 5x + 4).
18. Resolva 1/x < 3, tomando cuidado com o sinal de x, e explique por que multiplicar os dois lados
    por x não é um caminho válido aqui.

### Gabarito

1. x > 4.
2. x ≤ -4. O sentido inverte porque se divide por -2.
3. x < 4.
4. 2 < x < 3.
5. x ≤ -3 ou x ≥ 3.
6. x ≤ 0 ou x ≥ 4.
7. Todos os reais, com a única exceção de -3. A expressão é (x + 3)^{2}, que só deixa de ser
   positiva quando x = -3.
8. Todos os reais. O discriminante vale -3 e a concavidade é para cima, então a parábola nunca toca
   o eixo.
9. x < -3 ou x > 1.
10. x < -1 ou x ≥ 2. O valor -1 fica de fora porque anula o denominador.
11. 2 < x < 4.
12. x < -1 ou x > 4. A condição é x^{2} - 4 > 3x.
13. 2 < x < 8, ou seja, entre 2 mil e 8 mil peças.
14. x < -2 ou 1 < x < 4. As raízes são -2, 1 e 4, e o produto é negativo nas duas regiões
    indicadas.
15. x ≤ -2 ou 2 ≤ x < 3. A condição de existência é x ≠ 3.
16. -4 < m < 4. É preciso que o discriminante, que vale m^{2} - 16, seja negativo.
17. x ≤ 1 ou x ≥ 4, porque é preciso ter x^{2} - 5x + 4 ≥ 0 dentro da raiz.
18. x < 0 ou x > 1/3. Multiplicar os dois lados por x não vale porque o sinal de x é desconhecido, e
    multiplicar por valor negativo inverteria o sentido da desigualdade. O caminho correto é passar
    tudo para um lado e estudar o sinal de (1 - 3x)/x.

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

You can check this with concrete numbers. It is true that 2 < 5. Multiplying both sides by -1 gives -2
and -5, and now **-2 > -5** holds. The direction flipped.

#### First degree inequalities

The route is the same as for equations: isolate x, with extra care about the sign when you divide.

**Example 1.** Solve 3x - 7 > 5.
Adding 7 to both sides: 3x > 12. Dividing by 3, which is positive, keeps the direction: x > 4.
The solution set is x > 4: 4 itself is left out.

**Example 2.** Solve -2x + 1 ≥ 9.
Subtracting 1: -2x ≥ 8. Now I divide by -2, which is negative, so the direction reverses: x ≤ -4.
The solution set is x ≤ -4, and this time -4 itself is included.

Anyone who forgets to flip the sign gets x ≥ -4, which is exactly the complement of the right answer.
It is always worth testing a value: with x = -10, we get -2 · (-10) + 1 = 21, and 21 ≥ 9 is true.
That confirms it.

#### Second degree inequalities: sign analysis

Here isolating x gets you nowhere, because x appears squared. The method is different, and it is the
same for every quadratic inequality:

1. Move everything to one side, leaving zero on the other.
2. Find the roots of the quadratic expression.
3. Decide the concavity from the sign of the coefficient of x^{2}.
4. Read off the mental picture of the parabola where it sits above or below the horizontal axis.

The rule that sums up step 4: **between the roots the sign is the opposite of the sign of the leading
coefficient, and outside the roots the sign is the same**.

**Example 3.** Solve x^{2} - 5x + 6 < 0.
The roots are 2 and 3, because they add to 5 and multiply to 6. The leading coefficient is 1, which is
positive, so the parabola opens upwards and sits **below** the axis only between the roots. The
solution set is 2 < x < 3.

**Example 4.** Solve -x^{2} + 4x ≤ 0.
Factoring gives x · (-x + 4), with roots 0 and 4. The leading coefficient is -1, so the parabola opens
downwards and is negative outside the roots. Since the inequality accepts zero, the roots are
included. The solution set is x ≤ 0 or x ≥ 4.

When the discriminant is negative the parabola never touches the axis, and the sign is the same all
along the line. That settles cases that look hard in a blink: x^{2} + x + 1 is always
positive, because the discriminant is -3 and the concavity is upwards.

#### Product inequalities

When the inequality is a product of factors, each factor gets its own sign analysis and then the signs
are multiplied row by row. The sign chart organises that work: one row per factor, one column per
region of the line, and a final row with the product.

**Example 5.** Solve (x - 1) · (x + 3) > 0.
The first factor is zero at 1 and positive to the right of 1. The second is zero at -3 and positive to
the right of -3. In the regions of the line:

- for x < -3: the first factor is negative and the second is negative, so the product is positive.
- for -3 < x < 1: the first is negative and the second is positive, so the product is negative.
- for x > 1: both are positive, so the product is positive.

The solution set is x < -3 or x > 1.

#### Quotient inequalities

The sign chart is the same, because the sign of a division follows the same rule as the product. The
difference is the existence condition: **the denominator can never be zero**, even when the inequality
accepts equality. This is the classic test trap.

**Example 6.** Solve (x - 2)/(x + 1) ≥ 0.
The numerator is zero at 2 and the denominator is zero at -1. In the regions:

- for x < -1: negative numerator and negative denominator, positive quotient.
- for -1 < x < 2: negative numerator and positive denominator, negative quotient.
- for x > 2: both positive, positive quotient.

The value 2 is included, because it makes the numerator zero and the inequality accepts zero. The
value -1 is left out, because it makes the denominator zero. The solution set is x < -1 or x ≥ 2.

#### Systems of inequalities

In a system, each inequality is solved on its own and at the end you take the **intersection** of the
sets: what works is what satisfies all of them at the same time.

**Example 7.** Solve the system made of 2x + 1 > 5 and x - 4 < 0.
The first gives x > 2. The second gives x < 4. The intersection is 2 < x < 4.

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

1. Solve 3x - 7 > 5.
2. Solve -2x + 1 ≥ 9.
3. Solve 5x + 2 < 3x + 10.
4. Solve x^{2} - 5x + 6 < 0.
5. Solve x^{2} - 9 ≥ 0.

**Block B. Building up**

6. Solve -x^{2} + 4x ≤ 0.
7. Solve x^{2} + 6x + 9 > 0.
8. Solve x^{2} + x + 1 > 0.
9. Solve (x - 1) · (x + 3) > 0.
10. Solve (x - 2)/(x + 1) ≥ 0.
11. Solve the system made of 2x + 1 > 5 and x - 4 < 0.
12. Find for which values of x the graph of f(x) = x^{2} - 4 lies above the graph of
    g(x) = 3x.
13. A factory has profit given by L(x) = -x^{2} + 10x - 16, where x is the quantity produced in
    thousands of parts. For which quantities is the profit positive?

**Block C. Going further**

14. Solve the product inequality (x - 1) · (x + 2) · (x - 4) < 0, building the complete sign
    chart.
15. Solve (x^{2} - 4)/(x - 3) ≤ 0, stating the existence condition.
16. Find the values of m for which the inequality x^{2} + mx + 4 > 0 holds for every
    real x.
17. Find the domain of the function f(x) = √(x^{2} - 5x + 4).
18. Solve 1/x < 3, being careful with the sign of x, and explain why multiplying both sides
    by x is not a valid route here.

### Answer key

1. x > 4.
2. x ≤ -4. The direction reverses because you divide by -2.
3. x < 4.
4. 2 < x < 3.
5. x ≤ -3 or x ≥ 3.
6. x ≤ 0 or x ≥ 4.
7. All real numbers, with the single exception of -3. The expression is (x + 3)^{2}, which stops
   being positive only when x = -3.
8. All real numbers. The discriminant is -3 and the concavity is upwards, so the parabola never
   touches the axis.
9. x < -3 or x > 1.
10. x < -1 or x ≥ 2. The value -1 is left out because it makes the denominator zero.
11. 2 < x < 4.
12. x < -1 or x > 4. The condition is x^{2} - 4 > 3x.
13. 2 < x < 8, that is, between 2 thousand and 8 thousand parts.
14. x < -2 or 1 < x < 4. The roots are -2, 1 and 4, and the product is negative in the two regions
    indicated.
15. x ≤ -2 or 2 ≤ x < 3. The existence condition is x ≠ 3.
16. -4 < m < 4. The discriminant, which is m^{2} - 16, has to be negative.
17. x ≤ 1 or x ≥ 4, because we need x^{2} - 5x + 4 ≥ 0 under the root.
18. x < 0 or x > 1/3. Multiplying both sides by x is not allowed because the sign of x is unknown, and
    multiplying by a negative value would reverse the direction of the inequality. The correct route
    is to move everything to one side and study the sign of (1 - 3x)/x.

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
