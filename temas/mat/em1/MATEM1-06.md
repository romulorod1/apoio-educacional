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
então o módulo nunca é negativo. O módulo de 7 vale 7, e o módulo de menos 7 também vale 7, porque os
dois estão a sete unidades do zero, cada um para um lado.

Escreve-se com duas barras verticais: |menos 7| vale 7.

Pensar em distância é o que torna tudo o mais fácil. Uma frase como |x| igual a 5 quer dizer "x está a
cinco unidades do zero", e por isso tem duas respostas. Uma frase como |x menos 3| quer dizer "a
distância entre x e 3", e essa leitura resolve boa parte das equações e inequações sem conta nenhuma.

#### A definição por partes

A definição formal separa dois casos, conforme o sinal do que está dentro das barras:

- se o que está dentro é maior ou igual a zero, o módulo devolve a própria expressão.
- se o que está dentro é negativo, o módulo devolve a expressão trocada de sinal.

**Exemplo 1.** Escrever f(x) igual a |x menos 3| na forma de definição por partes.
O que está dentro é x menos 3, que é maior ou igual a zero quando x é maior ou igual a 3. Então:

f(x) igual a x menos 3, quando x é maior ou igual a 3
f(x) igual a 3 menos x, quando x é menor que 3

Confira com valores: f(5) é |2|, que dá 2, e a primeira linha dá 5 menos 3, que também dá 2. E f(1)
é |menos 2|, que dá 2, enquanto a segunda linha dá 3 menos 1, que também dá 2.

#### O gráfico em forma de V

O gráfico de f(x) igual a |x| tem forma de V com o bico na origem. À direita do zero ele coincide com
a reta que passa pela origem com inclinação 1, e à esquerda ele coincide com a reflexão dessa reta,
de inclinação menos 1. O ponto mais baixo é o de coordenadas 0 e 0, e o conjunto imagem são os
valores maiores ou iguais a 0.

Somar ou subtrair dentro e fora das barras desloca o V sem mudar sua forma.

**Exemplo 2.** Descrever o gráfico de f(x) igual a |x menos 2| mais 1.
O bico do V acontece quando o que está dentro das barras vale zero, ou seja, em x igual a 2. Nesse
ponto f vale 1, então o vértice é o ponto de coordenadas 2 e 1. Os dois lados sobem a partir dali:
em x igual a 0 a função vale 3, e em x igual a 4 ela também vale 3, o que mostra a simetria em torno
do vértice. O conjunto imagem são os valores maiores ou iguais a 1.

#### Equações com módulo

A regra é curta: se |A| é igual a um número positivo p, então A vale p ou A vale menos p. São dois
caminhos, e os dois precisam ser percorridos.

**Exemplo 3.** Resolver |x menos 3| igual a 4.
Pela leitura de distância: x está a quatro unidades de 3. Um caminho dá x menos 3 igual a 4, ou seja,
x igual a 7. O outro dá x menos 3 igual a menos 4, ou seja, x igual a menos 1.

**Exemplo 4.** Resolver |2x menos 1| igual a 7.
Primeiro caminho: 2x menos 1 igual a 7, então 2x vale 8 e x vale 4. Segundo caminho: 2x menos 1 igual
a menos 7, então 2x vale menos 6 e x vale menos 3.

Quando o lado direito é negativo não existe solução, porque módulo nunca é negativo. Isso se percebe
antes de qualquer conta.

#### Inequações com módulo

Aqui a leitura de distância paga o investimento. Existem dois formatos, e eles dão respostas de
naturezas opostas:

- **|A| menor que p** quer dizer "a distância é pequena", então A fica preso entre menos p e p. A
  resposta é um intervalo único.
- **|A| maior que p** quer dizer "a distância é grande", então A vai para fora, ou abaixo de menos p
  ou acima de p. A resposta é uma reunião de dois intervalos.

**Exemplo 5.** Resolver |x menos 4| menor ou igual a 6.
A distância entre x e 4 é no máximo 6, então x fica entre 4 menos 6 e 4 mais 6. O conjunto solução
são os valores entre menos 2 e 10, incluindo os dois extremos.

**Exemplo 6.** Resolver |3x menos 2| maior que 4.
Um caminho: 3x menos 2 maior que 4, então 3x é maior que 6 e x é maior que 2. Outro caminho: 3x menos
2 menor que menos 4, então 3x é menor que menos 2 e x é menor que menos 2 sobre 3. O conjunto solução
são os valores menores que menos 2 sobre 3 reunidos com os valores maiores que 2, sem incluir os
extremos.

#### Funções definidas por partes

O módulo é o exemplo mais comum de uma ideia maior: uma função pode ter leis diferentes em faixas
diferentes do domínio. Para calcular um valor, primeiro se descobre em qual faixa o x cai, e só então
se usa a lei daquela faixa. Somas de módulos, como |x menos 1| mais |x mais 2|, pedem exatamente esse
tratamento, com uma faixa para cada mudança de sinal dentro das barras.

#### Erros comuns

**Achar que |x| igual a 5 tem uma resposta só.** Tem duas, uma de cada lado do zero.

**Trocar o sinal de dentro pelo sinal de fora.** O módulo devolve a expressão trocada de sinal quando
o que está dentro é negativo, e não quando x é negativo. Em |x menos 3| a fronteira está em 3, não em
zero.

**Resolver |A| maior que p como se fosse um intervalo entre menos p e p.** Esse formato dá reunião de
dois intervalos, e escrever intervalo único inverte completamente a resposta.

**Elevar ao quadrado sem cuidado.** Elevar ao quadrado só é seguro quando os dois lados são
garantidamente não negativos, como em |x mais 1| menor que |x menos 3|. Com um lado que pode ser
negativo, o quadrado cria soluções falsas.

**Esquecer de conferir a resposta em equação com módulo dos dois lados.** Cada caminho precisa ser
testado na equação original.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule o valor de |menos 7|, de |3| e de |0|.
2. Resolva |x| igual a 5.
3. Resolva |x menos 3| igual a 4.
4. Calcule f(menos 2) e f(5) para f(x) igual a |x menos 1|.
5. Resolva |x| menor que 3.

**Bloco B. Consolidação**

6. Resolva |2x menos 1| igual a 7.
7. Resolva |x mais 2| igual a menos 3.
8. Resolva |x menos 4| menor ou igual a 6.
9. Resolva |3x menos 2| maior que 4.
10. Escreva f(x) igual a |x menos 3| na forma de definição por partes.
11. Descreva o gráfico de f(x) igual a |x menos 2| mais 1, indicando o vértice e o conjunto imagem.
12. Determine o conjunto imagem de f(x) igual a menos |x| mais 4.
13. Resolva |x ao quadrado menos 4| igual a 5.

**Bloco C. Aprofundamento**

14. Resolva |x menos 1| igual a |2x mais 3|.
15. Resolva |x mais 1| menor que |x menos 3| e justifique por que elevar os dois lados ao quadrado é
    válido neste caso.
16. Resolva |2x menos 5| maior ou igual a x mais 1, separando os dois casos do módulo.
17. Considere f(x) igual a |x menos 1| mais |x mais 2|. Escreva f na forma de definição por partes e
    determine o menor valor que f assume.
18. Determine para quais valores de k a equação |x menos 2| igual a k tem exatamente duas soluções
    reais, e diga o que acontece nos demais casos.

### Gabarito

1. 7, 3 e 0.
2. x igual a 5 ou x igual a menos 5.
3. x igual a 7 ou x igual a menos 1.
4. f(menos 2) vale 3 e f(5) vale 4.
5. Os valores entre menos 3 e 3, sem incluir os extremos.
6. x igual a 4 ou x igual a menos 3.
7. Não existe solução real, porque o módulo de qualquer número é maior ou igual a 0.
8. Os valores entre menos 2 e 10, incluindo os dois extremos.
9. Os valores menores que menos 2 sobre 3 reunidos com os valores maiores que 2, sem incluir os
   extremos.
10. f(x) igual a x menos 3 quando x é maior ou igual a 3, e f(x) igual a 3 menos x quando x é menor
    que 3.
11. O vértice é o ponto de coordenadas 2 e 1. O gráfico tem forma de V, com os dois lados subindo a
    partir do vértice, e o conjunto imagem são os valores maiores ou iguais a 1.
12. Os valores menores ou iguais a 4. O maior valor acontece quando x vale 0.
13. x igual a 3 ou x igual a menos 3. O caso em que x ao quadrado menos 4 vale menos 5 levaria a x ao
    quadrado igual a menos 1, que não tem solução real.
14. x igual a menos 4 ou x igual a menos 2 sobre 3.
15. Os valores menores que 1, sem incluir o 1. Elevar ao quadrado é válido porque os dois lados são
    módulos, e portanto nenhum deles é negativo. A desigualdade vira 8x menor que 8.
16. Os valores menores ou iguais a 4 sobre 3 reunidos com os valores maiores ou iguais a 6. O primeiro
    caso dá x maior ou igual a 6 e o segundo dá x menor ou igual a 4 sobre 3.
17. Para os valores menores que menos 2, f(x) igual a menos 2x menos 1. Para os valores entre menos 2
    e 1, incluindo os dois extremos, f(x) igual a 3. Para os valores maiores que 1, f(x) igual a 2x
    mais 1. O menor valor é 3, atingido em todo o intervalo entre menos 2 e 1.
18. A equação tem duas soluções quando k é maior que 0. Quando k vale 0 existe uma única solução, que
    é x igual a 2, e quando k é menor que 0 não existe solução, porque o módulo nunca é negativo.

## EN

### Explanation

#### Absolute value is distance

The absolute value of a number is its **distance from the origin** on the number line. Distance has no
sign, so an absolute value is never negative. The absolute value of 7 is 7, and the absolute value of
minus 7 is also 7, because both sit seven units away from zero, one on each side.

It is written with two vertical bars: |minus 7| is 7.

Thinking of it as distance is what makes everything else easier. A statement like |x| equal to 5 means
"x is five units from zero", which is why it has two answers. A statement like |x minus 3| means "the
distance between x and 3", and that reading settles most equations and inequalities with no
calculation at all.

#### The piecewise definition

The formal definition splits into two cases, according to the sign of what sits inside the bars:

- if what is inside is greater than or equal to zero, the absolute value returns the expression itself.
- if what is inside is negative, the absolute value returns the expression with its sign changed.

**Example 1.** Write f(x) equal to |x minus 3| in piecewise form.
What is inside is x minus 3, which is greater than or equal to zero when x is greater than or equal to
3. So:

f(x) equals x minus 3, when x is greater than or equal to 3
f(x) equals 3 minus x, when x is less than 3

Check it with values: f(5) is |2|, which gives 2, and the first line gives 5 minus 3, which also gives
2. And f(1) is |minus 2|, which gives 2, while the second line gives 3 minus 1, which also gives 2.

#### The V shaped graph

The graph of f(x) equal to |x| has a V shape with its point at the origin. To the right of zero it
matches the line through the origin with slope 1, and to the left it matches the reflection of that
line, with slope minus 1. The lowest point is the point with coordinates 0 and 0, and the range is the
values greater than or equal to 0.

Adding or subtracting inside and outside the bars shifts the V without changing its shape.

**Example 2.** Describe the graph of f(x) equal to |x minus 2| plus 1.
The point of the V happens when what is inside the bars is zero, that is, at x equal to 2. At that
point f is 1, so the vertex is the point with coordinates 2 and 1. Both sides rise from there: at x
equal to 0 the function is 3, and at x equal to 4 it is also 3, which shows the symmetry about the
vertex. The range is the values greater than or equal to 1.

#### Equations with absolute value

The rule is short: if |A| equals a positive number p, then A is p or A is minus p. There are two
routes, and both have to be followed.

**Example 3.** Solve |x minus 3| equal to 4.
Reading it as distance: x is four units from 3. One route gives x minus 3 equal to 4, that is, x
equal to 7. The other gives x minus 3 equal to minus 4, that is, x equal to minus 1.

**Example 4.** Solve |2x minus 1| equal to 7.
First route: 2x minus 1 equal to 7, so 2x is 8 and x is 4. Second route: 2x minus 1 equal to minus 7,
so 2x is minus 6 and x is minus 3.

When the right hand side is negative there is no solution, because an absolute value is never
negative. You can see that before doing any calculation.

#### Inequalities with absolute value

Here the distance reading pays off. There are two shapes, and they give answers of opposite natures:

- **|A| less than p** means "the distance is small", so A is trapped between minus p and p. The answer
  is a single interval.
- **|A| greater than p** means "the distance is large", so A goes outside, either below minus p or
  above p. The answer is a union of two intervals.

**Example 5.** Solve |x minus 4| less than or equal to 6.
The distance between x and 4 is at most 6, so x lies between 4 minus 6 and 4 plus 6. The solution set
is the values between minus 2 and 10, including both endpoints.

**Example 6.** Solve |3x minus 2| greater than 4.
One route: 3x minus 2 greater than 4, so 3x is greater than 6 and x is greater than 2. The other
route: 3x minus 2 less than minus 4, so 3x is less than minus 2 and x is less than minus 2 over 3. The
solution set is the values less than minus 2 over 3 together with the values greater than 2, not
including the endpoints.

#### Piecewise defined functions

Absolute value is the most common example of a bigger idea: a function may follow different rules on
different stretches of its domain. To work out a value, you first find which stretch the x falls into,
and only then use the rule for that stretch. Sums of absolute values, such as |x minus 1| plus
|x plus 2|, call for exactly this treatment, with one stretch for each sign change inside the bars.

#### Common mistakes

**Thinking |x| equal to 5 has only one answer.** It has two, one on each side of zero.

**Swapping the sign inside for the sign outside.** The absolute value returns the expression with its
sign changed when what is inside is negative, not when x is negative. In |x minus 3| the boundary sits
at 3, not at zero.

**Solving |A| greater than p as if it were an interval between minus p and p.** That shape gives a
union of two intervals, and writing a single interval reverses the answer completely.

**Squaring carelessly.** Squaring is only safe when both sides are guaranteed to be non negative, as
in |x plus 1| less than |x minus 3|. With one side that may be negative, squaring creates false
solutions.

**Forgetting to check the answer in an equation with absolute value on both sides.** Each route has to
be tested in the original equation.

### Exercises

**Block A. Fundamentals**

1. Find the value of |minus 7|, of |3| and of |0|.
2. Solve |x| equal to 5.
3. Solve |x minus 3| equal to 4.
4. Find f(minus 2) and f(5) for f(x) equal to |x minus 1|.
5. Solve |x| less than 3.

**Block B. Building up**

6. Solve |2x minus 1| equal to 7.
7. Solve |x plus 2| equal to minus 3.
8. Solve |x minus 4| less than or equal to 6.
9. Solve |3x minus 2| greater than 4.
10. Write f(x) equal to |x minus 3| in piecewise form.
11. Describe the graph of f(x) equal to |x minus 2| plus 1, giving the vertex and the range.
12. Find the range of f(x) equal to minus |x| plus 4.
13. Solve |x squared minus 4| equal to 5.

**Block C. Going further**

14. Solve |x minus 1| equal to |2x plus 3|.
15. Solve |x plus 1| less than |x minus 3| and justify why squaring both sides is valid in this case.
16. Solve |2x minus 5| greater than or equal to x plus 1, splitting the two cases of the absolute
    value.
17. Consider f(x) equal to |x minus 1| plus |x plus 2|. Write f in piecewise form and find the
    smallest value f takes.
18. Find for which values of k the equation |x minus 2| equal to k has exactly two real solutions, and
    say what happens in the other cases.

### Answer key

1. 7, 3 and 0.
2. x equals 5 or x equals minus 5.
3. x equals 7 or x equals minus 1.
4. f(minus 2) is 3 and f(5) is 4.
5. The values between minus 3 and 3, not including the endpoints.
6. x equals 4 or x equals minus 3.
7. There is no real solution, because the absolute value of any number is greater than or equal to 0.
8. The values between minus 2 and 10, including both endpoints.
9. The values less than minus 2 over 3 together with the values greater than 2, not including the
   endpoints.
10. f(x) equals x minus 3 when x is greater than or equal to 3, and f(x) equals 3 minus x when x is
    less than 3.
11. The vertex is the point with coordinates 2 and 1. The graph has a V shape, with both sides rising
    from the vertex, and the range is the values greater than or equal to 1.
12. The values less than or equal to 4. The greatest value happens when x is 0.
13. x equals 3 or x equals minus 3. The case where x squared minus 4 is minus 5 would lead to x
    squared equal to minus 1, which has no real solution.
14. x equals minus 4 or x equals minus 2 over 3.
15. The values less than 1, not including 1. Squaring is valid because both sides are absolute values,
    so neither of them is negative. The inequality becomes 8x less than 8.
16. The values less than or equal to 4 over 3 together with the values greater than or equal to 6. The
    first case gives x greater than or equal to 6 and the second gives x less than or equal to 4 over 3.
17. For the values less than minus 2, f(x) equals minus 2x minus 1. For the values between minus 2 and
    1, including both endpoints, f(x) equals 3. For the values greater than 1, f(x) equals 2x plus 1.
    The smallest value is 3, reached across the whole interval between minus 2 and 1.
18. The equation has two solutions when k is greater than 0. When k is 0 there is a single solution,
    which is x equal to 2, and when k is less than 0 there is no solution, because an absolute value is
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
