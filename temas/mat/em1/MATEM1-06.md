---
id: MATEM1-06
serie: em1
unidade: algebra
titulo_pt: Função modular
titulo_en: Absolute value function
resumo_pt: Entender o módulo como distância, escrever a função por partes, ler o gráfico em V e resolver equações e inequações com módulo.
resumo_en: Understanding absolute value as distance, writing the function piecewise, reading the V shaped graph and solving equations and inequalities with absolute value.
prerequisitos: [MATEM1-02, MATEM1-03]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### Módulo é distância

O módulo de um número é a sua **distância até a origem** na reta numérica. Distância não tem sinal,
então o módulo nunca é negativo. O módulo de 7 vale 7, e o módulo de -7 também vale 7, porque os
dois estão a sete unidades do zero, cada um para um lado.

Escreve-se com duas barras verticais: |-7| = 7.

Pensar em distância é o que torna tudo o mais fácil. Uma frase como |x| = 5 quer dizer "x está a
cinco unidades do zero", e por isso tem duas respostas. Uma frase como |x - 3| quer dizer "a
distância entre x e 3", e essa leitura resolve boa parte das equações e inequações sem conta nenhuma.

#### A definição por partes

A definição formal separa dois casos, conforme o sinal de A, a expressão que está dentro das barras:

- |A| = A, quando A ≥ 0: o módulo devolve a própria expressão.
- |A| = -A, quando A < 0: o módulo devolve a expressão trocada de sinal.

**Exemplo 1.** Escrever f(x) = |x - 3| na forma de definição por partes.
O que está dentro é x - 3, e x - 3 ≥ 0 quando x ≥ 3. Então:

f(x) = x - 3, quando x ≥ 3
f(x) = 3 - x, quando x < 3

Confira com valores: f(5) = |2| = 2, e a primeira linha dá 5 - 3 = 2. E f(1) = |-2| = 2, enquanto a
segunda linha dá 3 - 1 = 2.

#### O gráfico em forma de V

O gráfico de f(x) = |x| tem forma de V com o bico na origem. À direita do zero ele coincide com
a reta que passa pela origem com inclinação 1, e à esquerda ele coincide com a reflexão dessa reta,
de inclinação -1. O ponto mais baixo é o ponto (0, 0), e o conjunto imagem são os valores y ≥ 0.

Somar ou subtrair dentro e fora das barras desloca o V sem mudar sua forma.

**Exemplo 2.** Descrever o gráfico de f(x) = |x - 2| + 1.
O bico do V acontece quando o que está dentro das barras vale zero, ou seja, em x = 2. Nesse
ponto f(2) = 1, então o vértice é o ponto (2, 1). Os dois lados sobem a partir dali:
f(0) = 3 e f(4) = 3, o que mostra a simetria em torno do vértice. O conjunto imagem são os
valores y ≥ 1.

#### Equações com módulo

A regra é curta: se |A| = p com p > 0, então A = p ou A = -p. São dois
caminhos, e os dois precisam ser percorridos.

**Exemplo 3.** Resolver |x - 3| = 4.
Pela leitura de distância: x está a quatro unidades de 3. Um caminho dá x - 3 = 4, ou seja,
x = 7. O outro dá x - 3 = -4, ou seja, x = -1.

**Exemplo 4.** Resolver |2x - 1| = 7.
Primeiro caminho: 2x - 1 = 7, então 2x = 8 e x = 4. Segundo caminho: 2x - 1 = -7,
então 2x = -6 e x = -3.

Quando o lado direito é negativo não existe solução, porque módulo nunca é negativo. Isso se percebe
antes de qualquer conta.

#### Inequações com módulo

Aqui a leitura de distância paga o investimento. Existem dois formatos, e eles dão respostas de
naturezas opostas:

- **|A| < p** quer dizer "a distância é pequena", então A fica preso entre -p e p, ou seja,
  -p < A < p. A resposta é um intervalo único.
- **|A| > p** quer dizer "a distância é grande", então A vai para fora: A < -p ou A > p.
  A resposta é uma reunião de dois intervalos.

**Exemplo 5.** Resolver |x - 4| ≤ 6.
A distância entre x e 4 é no máximo 6, então x fica entre 4 - 6 e 4 + 6. O conjunto solução
são os valores de x com -2 ≤ x ≤ 10.

**Exemplo 6.** Resolver |3x - 2| > 4.
Um caminho: 3x - 2 > 4, então 3x > 6 e x > 2. Outro caminho: 3x - 2 < -4, então 3x < -2 e
x < -2/3. O conjunto solução são os valores de x com x < -2/3 reunidos com os valores com
x > 2, sem incluir os extremos.

#### Funções definidas por partes

O módulo é o exemplo mais comum de uma ideia maior: uma função pode ter leis diferentes em faixas
diferentes do domínio. Para calcular um valor, primeiro se descobre em qual faixa o x cai, e só então
se usa a lei daquela faixa. Somas de módulos, como |x - 1| + |x + 2|, pedem exatamente esse
tratamento, com uma faixa para cada mudança de sinal dentro das barras.

#### Erros comuns

**Achar que |x| = 5 tem uma resposta só.** Tem duas, uma de cada lado do zero.

**Trocar o sinal de dentro pelo sinal de fora.** O módulo devolve a expressão trocada de sinal quando
o que está dentro é negativo, e não quando x é negativo. Em |x - 3| a fronteira está em 3, não em
zero.

**Resolver |A| > p como se fosse -p < A < p.** Esse formato dá reunião de dois intervalos, e
escrever intervalo único inverte completamente a resposta.

**Elevar ao quadrado sem cuidado.** Elevar ao quadrado só é seguro quando os dois lados são
garantidamente não negativos, como em |x + 1| < |x - 3|. Com um lado que pode ser negativo, o
quadrado cria soluções falsas.

**Esquecer de conferir a resposta em equação com módulo dos dois lados.** Cada caminho precisa ser
testado na equação original.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule o valor de |-7|, de |3| e de |0|.
2. Resolva |x| = 5.
3. Resolva |x - 3| = 4.
4. Calcule f(-2) e f(5) para f(x) = |x - 1|.
5. Resolva |x| < 3.

**Bloco B. Consolidação**

6. Resolva |2x - 1| = 7.
7. Resolva |x + 2| = -3.
8. Resolva |x - 4| ≤ 6.
9. Resolva |3x - 2| > 4.
10. Escreva f(x) = |x - 3| na forma de definição por partes.
11. Descreva o gráfico de f(x) = |x - 2| + 1, indicando o vértice e o conjunto imagem.
12. Determine o conjunto imagem de f(x) = -|x| + 4.
13. Resolva |x^{2} - 4| = 5.

**Bloco C. Aprofundamento**

14. Resolva |x - 1| = |2x + 3|.
15. Resolva |x + 1| < |x - 3| e justifique por que elevar os dois lados ao quadrado é
    válido neste caso.
16. Resolva |2x - 5| ≥ x + 1, separando os dois casos do módulo.
17. Considere f(x) = |x - 1| + |x + 2|. Escreva f na forma de definição por partes e
    determine o menor valor que f assume.
18. Determine para quais valores de k a equação |x - 2| = k tem exatamente duas soluções
    reais, e diga o que acontece nos demais casos.

### Gabarito

1. 7, 3 e 0.
2. x = 5 ou x = -5.
3. x = 7 ou x = -1.
4. f(-2) = 3 e f(5) = 4.
5. Os valores de x com -3 < x < 3.
6. x = 4 ou x = -3.
7. Não existe solução real, porque |A| ≥ 0 para qualquer A.
8. Os valores de x com -2 ≤ x ≤ 10.
9. Os valores de x com x < -2/3 reunidos com os valores de x com x > 2, sem incluir os
   extremos.
10. f(x) = x - 3 quando x ≥ 3, e f(x) = 3 - x quando x < 3.
11. O vértice é o ponto (2, 1). O gráfico tem forma de V, com os dois lados subindo a
    partir do vértice, e o conjunto imagem são os valores y ≥ 1.
12. Os valores y ≤ 4. O maior valor acontece quando x = 0.
13. x = 3 ou x = -3. O caso em que x^{2} - 4 = -5 levaria a x^{2} = -1, que não tem
    solução real.
14. x = -4 ou x = -2/3.
15. Os valores de x com x < 1. Elevar ao quadrado é válido porque os dois lados são
    módulos, e portanto nenhum deles é negativo. A desigualdade vira 8x < 8.
16. Os valores de x com x ≤ 4/3 reunidos com os valores de x com x ≥ 6. O primeiro
    caso dá x ≥ 6 e o segundo dá x ≤ 4/3.
17. Para x < -2, f(x) = -2x - 1. Para -2 ≤ x ≤ 1, f(x) = 3. Para x > 1,
    f(x) = 2x + 1. O menor valor é 3, atingido em todo o intervalo -2 ≤ x ≤ 1.
18. A equação tem duas soluções quando k > 0. Quando k = 0 existe uma única solução, que
    é x = 2, e quando k < 0 não existe solução, porque o módulo nunca é negativo.

## EN

### Explanation

#### Absolute value is distance

The absolute value of a number is its **distance from the origin** on the number line. Distance has no
sign, so an absolute value is never negative. The absolute value of 7 is 7, and the absolute value of
-7 is also 7, because both sit seven units away from zero, one on each side.

It is written with two vertical bars: |-7| = 7.

Thinking of it as distance is what makes everything else easier. A statement like |x| = 5 means
"x is five units from zero", which is why it has two answers. A statement like |x - 3| means "the
distance between x and 3", and that reading settles most equations and inequalities with no
calculation at all.

#### The piecewise definition

The formal definition splits into two cases, according to the sign of A, the expression inside the
bars:

- |A| = A, when A ≥ 0: the absolute value returns the expression itself.
- |A| = -A, when A < 0: the absolute value returns the expression with its sign changed.

**Example 1.** Write f(x) = |x - 3| in piecewise form.
What is inside is x - 3, and x - 3 ≥ 0 when x ≥ 3. So:

f(x) = x - 3, when x ≥ 3
f(x) = 3 - x, when x < 3

Check it with values: f(5) = |2| = 2, and the first line gives 5 - 3 = 2. And f(1) = |-2| = 2, while
the second line gives 3 - 1 = 2.

#### The V shaped graph

The graph of f(x) = |x| has a V shape with its point at the origin. To the right of zero it
matches the line through the origin with slope 1, and to the left it matches the reflection of that
line, with slope -1. The lowest point is the point (0, 0), and the range is the values y ≥ 0.

Adding or subtracting inside and outside the bars shifts the V without changing its shape.

**Example 2.** Describe the graph of f(x) = |x - 2| + 1.
The point of the V happens when what is inside the bars is zero, that is, at x = 2. At that
point f(2) = 1, so the vertex is the point (2, 1). Both sides rise from there:
f(0) = 3 and f(4) = 3, which shows the symmetry about the vertex. The range is the values
y ≥ 1.

#### Equations with absolute value

The rule is short: if |A| = p with p > 0, then A = p or A = -p. There are two
routes, and both have to be followed.

**Example 3.** Solve |x - 3| = 4.
Reading it as distance: x is four units from 3. One route gives x - 3 = 4, that is,
x = 7. The other gives x - 3 = -4, that is, x = -1.

**Example 4.** Solve |2x - 1| = 7.
First route: 2x - 1 = 7, so 2x = 8 and x = 4. Second route: 2x - 1 = -7,
so 2x = -6 and x = -3.

When the right hand side is negative there is no solution, because an absolute value is never
negative. You can see that before doing any calculation.

#### Inequalities with absolute value

Here the distance reading pays off. There are two shapes, and they give answers of opposite natures:

- **|A| < p** means "the distance is small", so A is trapped between -p and p, that is,
  -p < A < p. The answer is a single interval.
- **|A| > p** means "the distance is large", so A goes outside: A < -p or A > p.
  The answer is a union of two intervals.

**Example 5.** Solve |x - 4| ≤ 6.
The distance between x and 4 is at most 6, so x lies between 4 - 6 and 4 + 6. The solution set
is the values of x with -2 ≤ x ≤ 10.

**Example 6.** Solve |3x - 2| > 4.
One route: 3x - 2 > 4, so 3x > 6 and x > 2. The other route: 3x - 2 < -4, so 3x < -2 and
x < -2/3. The solution set is the values of x with x < -2/3 together with the values with
x > 2, not including the endpoints.

#### Piecewise defined functions

Absolute value is the most common example of a bigger idea: a function may follow different rules on
different stretches of its domain. To work out a value, you first find which stretch the x falls into,
and only then use the rule for that stretch. Sums of absolute values, such as |x - 1| + |x + 2|,
call for exactly this treatment, with one stretch for each sign change inside the bars.

#### Common mistakes

**Thinking |x| = 5 has only one answer.** It has two, one on each side of zero.

**Swapping the sign inside for the sign outside.** The absolute value returns the expression with its
sign changed when what is inside is negative, not when x is negative. In |x - 3| the boundary sits
at 3, not at zero.

**Solving |A| > p as if it were -p < A < p.** That shape gives a union of two intervals, and
writing a single interval reverses the answer completely.

**Squaring carelessly.** Squaring is only safe when both sides are guaranteed to be non negative, as
in |x + 1| < |x - 3|. With one side that may be negative, squaring creates false
solutions.

**Forgetting to check the answer in an equation with absolute value on both sides.** Each route has to
be tested in the original equation.

### Exercises

**Block A. Fundamentals**

1. Find the value of |-7|, of |3| and of |0|.
2. Solve |x| = 5.
3. Solve |x - 3| = 4.
4. Find f(-2) and f(5) for f(x) = |x - 1|.
5. Solve |x| < 3.

**Block B. Building up**

6. Solve |2x - 1| = 7.
7. Solve |x + 2| = -3.
8. Solve |x - 4| ≤ 6.
9. Solve |3x - 2| > 4.
10. Write f(x) = |x - 3| in piecewise form.
11. Describe the graph of f(x) = |x - 2| + 1, giving the vertex and the range.
12. Find the range of f(x) = -|x| + 4.
13. Solve |x^{2} - 4| = 5.

**Block C. Going further**

14. Solve |x - 1| = |2x + 3|.
15. Solve |x + 1| < |x - 3| and justify why squaring both sides is valid in this case.
16. Solve |2x - 5| ≥ x + 1, splitting the two cases of the absolute
    value.
17. Consider f(x) = |x - 1| + |x + 2|. Write f in piecewise form and find the
    smallest value f takes.
18. Find for which values of k the equation |x - 2| = k has exactly two real solutions, and
    say what happens in the other cases.

### Answer key

1. 7, 3 and 0.
2. x = 5 or x = -5.
3. x = 7 or x = -1.
4. f(-2) = 3 and f(5) = 4.
5. The values of x with -3 < x < 3.
6. x = 4 or x = -3.
7. There is no real solution, because |A| ≥ 0 for any A.
8. The values of x with -2 ≤ x ≤ 10.
9. The values of x with x < -2/3 together with the values of x with x > 2, not including the
   endpoints.
10. f(x) = x - 3 when x ≥ 3, and f(x) = 3 - x when x < 3.
11. The vertex is the point (2, 1). The graph has a V shape, with both sides rising
    from the vertex, and the range is the values y ≥ 1.
12. The values y ≤ 4. The greatest value happens when x = 0.
13. x = 3 or x = -3. The case where x^{2} - 4 = -5 would lead to x^{2} = -1, which has no
    real solution.
14. x = -4 or x = -2/3.
15. The values of x with x < 1. Squaring is valid because both sides are absolute values,
    so neither of them is negative. The inequality becomes 8x < 8.
16. The values of x with x ≤ 4/3 together with the values of x with x ≥ 6. The first
    case gives x ≥ 6 and the second gives x ≤ 4/3.
17. For x < -2, f(x) = -2x - 1. For -2 ≤ x ≤ 1, f(x) = 3. For x > 1,
    f(x) = 2x + 1. The smallest value is 3, reached across the whole interval -2 ≤ x ≤ 1.
18. The equation has two solutions when k > 0. When k = 0 there is a single solution, which
    is x = 2, and when k < 0 there is no solution, because an absolute value is
    never negative.

## VERIFICACAO

```python
X1: Abs(5-3) == 5-3 and Abs(1-3) == 3-1 and Abs(3-3) == 0
X2: Abs(2-2)+1 == 1 and Abs(0-2)+1 == 3 and Abs(4-2)+1 == 3 and min([Abs(v-2)+1 for v in range(-5,10)]) == 1
X3: solveset(Eq(Abs(x-3), 4), x, Reals) == FiniteSet(-1, 7)
X4: solveset(Eq(Abs(2*x-1), 7), x, Reals) == FiniteSet(-3, 4)
X5: solveset(Abs(x-4) <= 6, x, Reals) == Interval(-2, 10)
X6: solveset(Abs(3*x-2) > 4, x, Reals) == Union(Interval.open(-oo, Rational(-2,3)), Interval.open(2, oo))
E1: Abs(-7) == 7 and Abs(3) == 3 and Abs(0) == 0
E2: solveset(Eq(Abs(x), 5), x, Reals) == FiniteSet(-5, 5)
E3: solveset(Eq(Abs(x-3), 4), x, Reals) == FiniteSet(-1, 7)
E4: Abs(-2-1) == 3 and Abs(5-1) == 4
E5: solveset(Abs(x) < 3, x, Reals) == Interval.open(-3, 3)
E6: solveset(Eq(Abs(2*x-1), 7), x, Reals) == FiniteSet(-3, 4)
E7: solveset(Eq(Abs(x+2), -3), x, Reals) == EmptySet
E8: solveset(Abs(x-4) <= 6, x, Reals) == Interval(-2, 10)
E9: solveset(Abs(3*x-2) > 4, x, Reals) == Union(Interval.open(-oo, Rational(-2,3)), Interval.open(2, oo))
E10: Abs(5-3) == 5-3 and Abs(1-3) == 3-1 and Abs(3-3) == 0
E11: Abs(2-2)+1 == 1 and Abs(0-2)+1 == 3 and Abs(4-2)+1 == 3 and min([Abs(v-2)+1 for v in range(-5,10)]) == 1
E12: max([-Abs(v)+4 for v in range(-10,11)]) == 4 and -Abs(0)+4 == 4
E13: solveset(Eq(Abs(x**2-4), 5), x, Reals) == FiniteSet(-3, 3) and len(real_roots(x**2+1)) == 0
E14: solveset(Eq(Abs(x-1), Abs(2*x+3)), x, Reals) == FiniteSet(-4, Rational(-2,3))
E15: solveset(Abs(x+1) < Abs(x-3), x, Reals) == Interval.open(-oo, 1) and solveset(8*x < 8, x, Reals) == Interval.open(-oo, 1)
E16: solveset(Abs(2*x-5) >= x+1, x, Reals) == Union(Interval(-oo, Rational(4,3)), Interval(6, oo))
E17: Abs(-3-1)+Abs(-3+2) == -2*(-3)-1 and Abs(0-1)+Abs(0+2) == 3 and Abs(2-1)+Abs(2+2) == 2*2+1 and min([Abs(v-1)+Abs(v+2) for v in range(-5,6)]) == 3
E18: len(solveset(Eq(Abs(x-2), 5), x, Reals)) == 2 and len(solveset(Eq(Abs(x-2), 0), x, Reals)) == 1 and solveset(Eq(Abs(x-2), -1), x, Reals) == EmptySet
```
