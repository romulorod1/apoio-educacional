---
id: MATEM3-10
serie: em3
unidade: algebra
titulo_pt: Revisão: funções e gráficos
titulo_en: Review: functions and graphs
resumo_pt: Retomar as famílias de funções do ensino médio, reconhecer cada uma pelo gráfico e escolher a ferramenta certa em cada problema.
resumo_en: Revisiting the families of functions from secondary school, recognising each one by its graph and picking the right tool for each problem.
prerequisitos: [MATEM3-09]
duracao_min: 90
dificuldade: 5
---

## PT

### Explicação

#### Um mapa antes das contas

Este é um tema de revisão, e revisão boa não é repetir tudo de novo: é organizar. Toda função que
você viu no ensino médio pertence a uma família, e cada família tem uma pergunta característica.
Saber a família em que o problema mora resolve metade do trabalho.

**Função afim.** Lei do tipo f(x) = ax + b. O gráfico é uma reta. O a é a taxa de variação,
isto é, quanto y muda quando x aumenta uma unidade. O b é onde a reta corta o eixo vertical. Pergunta
característica: dados dois pontos, qual é a lei?

**Função quadrática.** Lei do tipo f(x) = ax^{2} + bx + c. O gráfico é uma parábola. As raízes vêm
da fórmula resolutiva ou de soma e produto, e o vértice, de abscissa x_{v} = -b/(2a), resolve todo
problema de máximo e mínimo. Pergunta característica: onde está o ponto ótimo?

**Função exponencial.** Lei do tipo f(x) = a^{x}. O gráfico cresce cada vez mais rápido quando a base
é maior que 1, e decresce quando a base está entre 0 e 1. Pergunta característica: em quanto tempo
dobra, ou em quanto tempo cai pela metade?

**Função logarítmica.** É a inversa da exponencial. Serve exatamente para responder onde está o
expoente. Pergunta característica: qual expoente produz este valor?

**Função modular.** Lei em que f(x) é o módulo de uma expressão. O gráfico tem um bico, e a
equação com módulo quase sempre se abre em dois casos.

#### Ler uma reta a partir de dois pontos

**Exemplo 1.** A função afim f(x) = 2x - 6 tem qual raiz e qual valor em zero?
A raiz sai de 2x - 6 = 0, ou seja, x = 3. E f(0) = -6, que é justamente o
coeficiente que não acompanha o x. A reta corta o eixo horizontal em 3 e o eixo vertical em -6.

#### Parábola: raízes e vértice na mesma leitura

**Exemplo 2.** Determinar raízes e vértice de f(x) = x^{2} - 8x + 15.
Procurando dois números que somem 8 e multipliquem 15, achamos 3 e 5, que são as raízes. A abscissa
do vértice é a média das raízes: x_{v} = 4. Substituindo, f(4) = 16 - 32 + 15 = -1.
O vértice é o ponto (4, -1), e é ponto de mínimo porque a é positivo.

#### Exponencial: igualar as bases

**Exemplo 3.** Resolver 2^{x + 1} = 32.
Como 32 = 2^{5}, basta igualar os expoentes: x + 1 = 5, logo x = 4. Quando não
dá para igualar as bases, o caminho é o logaritmo.

#### Inversa: trocar o papel das variáveis

Uma função tem inversa quando cada valor de saída vem de um único valor de entrada. Para achar a
inversa, escreve-se y no lugar de f(x), trocam-se os papéis e isola-se de novo.

**Exemplo 4.** Achar a inversa de f(x) = (3x - 1)/2.
Escrevendo y = (3x - 1)/2 e isolando x, temos 2y = 3x - 1, depois x = (2y + 1)/3.
Logo a inversa é f^{-1}(x) = (2x + 1)/3.

Vale lembrar que o gráfico da inversa é o reflexo do gráfico original na reta que faz ângulo de 45
graus com os eixos.

#### Erros comuns

**Confundir taxa de variação com valor da função.** Numa reta, o a diz o quanto muda, e f(x) diz
quanto vale.

**Esquecer a condição de existência no logaritmo.** O que está dentro do logaritmo precisa ser
positivo, e por isso uma solução algébrica pode ter que ser descartada.

**Tratar módulo como um caso só.** Uma igualdade com módulo gera duas equações, e cada uma precisa
ser conferida no enunciado original.

**Aplicar a fórmula do vértice em função que não é quadrática.** A cada família, sua ferramenta.

### Exercícios

**Bloco A. Fundamentos**

1. Determine a raiz da função f(x) = 3x - 12 e o valor de f(0).
2. Determine as raízes e o vértice de f(x) = x^{2} - 8x + 15.
3. Resolva a equação 2^{x} = 64.
4. Calcule log_{3} 81.
5. Sendo f(x) = |x - 5|, calcule f(2) e f(9).

**Bloco B. Consolidação**

6. Uma função afim passa pelos pontos (1, 5) e (3, 11). Determine sua lei.
7. Sendo f(x) = 2x - 3 e g(x) = x^{2} + 1, calcule f(g(2)) e depois g(f(2)).
8. Determine a função inversa de f(x) = (3x - 1)/2.
9. Resolva a equação 3^{2x - 1} = 27.
10. Resolva a equação log_{2} (x - 1) + log_{2} (x + 1) = 3.
11. Uma substância radioativa de 800 gramas perde metade da massa a cada 5 anos. Qual é a massa
    restante depois de 20 anos?
12. Resolva a equação |2x - 6| = 4.
13. Determine o maior valor assumido por f(x) = -x^{2} + 6x - 5 e escreva o conjunto imagem da
    função.

**Bloco C. Aprofundamento**

14. Determine os valores de x em que os gráficos de f(x) = x^{2} - 4x + 3 e de g(x) = x - 1 se
    cruzam.
15. A receita de uma empresa, em reais, é dada por R(p) = p · (200 - 4p), em que p é o preço unitário
    em reais. Determine o preço que dá receita máxima e o valor dessa receita.
16. Mostre que a função dada por f(x) = (x + 2)/(x - 1) é igual à sua própria inversa, verificando
    que f(f(x)) devolve x.
17. Determine o valor de k para que a reta de equação y = x + k toque a parábola de equação
    y = x^{2} em um único ponto.
18. Uma cultura começa com 500 bactérias e dobra a cada 3 horas. Depois de quantas horas a população
    chega a 32000 bactérias?

### Gabarito

1. A raiz é 4 e f(0) = -12.
2. As raízes são 3 e 5. O vértice é o ponto (4, -1), que é ponto de mínimo.
3. x = 6.
4. O logaritmo vale 4, porque 3^{4} = 81.
5. f(2) = 3 e f(9) = 4.
6. f(x) = 3x + 2. A taxa de variação é a = (11 - 5)/(3 - 1).
7. f(g(2)) = 7 e g(f(2)) = 2.
8. A inversa é f^{-1}(x) = (2x + 1)/3.
9. x = 2, porque 27 = 3^{3}.
10. x = 3. A soma dos logaritmos vira o logaritmo do produto, e (x - 1)·(x + 1) = 8. O valor -3 é
    descartado, porque tornaria negativo o que está dentro do logaritmo.
11. Restam 50 gramas, porque 20 anos correspondem a 4 meias vidas.
12. x = 5 ou x = 1.
13. O maior valor é 4, atingido em x = 3. O conjunto imagem são os reais y ≤ 4.
14. Os gráficos se cruzam em x = 1 e em x = 4, pois a igualdade leva a x^{2} - 5x + 4 = 0.
15. O preço é 25 reais e a receita máxima é 2500 reais.
16. Substituindo, f(f(x)) tem numerador 3x/(x - 1) e denominador 3/(x - 1). O quociente é x, para
    todo x ≠ 1.
17. k = -1/4. A igualdade leva a x^{2} - x - k = 0, e o discriminante Δ = 1 + 4k precisa ser nulo.
18. Depois de 18 horas. A população é P(t) = 500 · 2^{t/3}, e 32000/500 = 64 = 2^{6}.

## EN

### Explanation

#### A map before the calculations

This is a review topic, and good review is not repeating everything again: it is organising. Every
function you met in secondary school belongs to a family, and each family has a characteristic
question. Knowing which family the problem lives in solves half the work.

**Affine function.** A rule of the type f(x) = ax + b. The graph is a straight line. The a is
the rate of change, that is, how much y changes when x increases by one unit. The b is where the line
crosses the vertical axis. Characteristic question: given two points, what is the rule?

**Quadratic function.** A rule of the type f(x) = ax^{2} + bx + c. The graph is a parabola. The roots
come from the quadratic formula or from sum and product, and the vertex, whose first coordinate is
x_{v} = -b/(2a), settles every maximum and minimum problem. Characteristic question: where is the
optimal point?

**Exponential function.** A rule of the type f(x) = a^{x}. The graph grows faster and faster when the
base is greater than 1, and decreases when the base lies between 0 and 1. Characteristic question:
how long until it doubles, or how long until it halves?

**Logarithmic function.** It is the inverse of the exponential. It exists precisely to answer where
the exponent is. Characteristic question: which exponent produces this value?

**Modulus function.** A rule in which f(x) is the modulus of an expression. The graph has a
corner, and an equation with a modulus almost always splits into two cases.

#### Reading a line from two points

**Example 1.** Which root does the affine function f(x) = 2x - 6 have, and what is its value
at zero?
The root comes from 2x - 6 = 0, that is, x = 3. And f(0) = -6, exactly the
coefficient that does not sit beside the x. The line crosses the horizontal axis at 3 and the
vertical axis at -6.

#### Parabola: roots and vertex in one reading

**Example 2.** Find the roots and the vertex of f(x) = x^{2} - 8x + 15.
Looking for two numbers adding to 8 and multiplying to 15, we find 3 and 5, which are the roots. The
first coordinate of the vertex is the average of the roots: x_{v} = 4. Substituting,
f(4) = 16 - 32 + 15 = -1. The vertex is the point (4, -1), and it is a minimum point because a is
positive.

#### Exponential: matching the bases

**Example 3.** Solve 2^{x + 1} = 32.
Since 32 = 2^{5}, it is enough to match the exponents: x + 1 = 5, so x = 4.
When the bases cannot be matched, the route is the logarithm.

#### Inverse: swapping the roles of the variables

A function has an inverse when each output value comes from a single input value. To find the
inverse, write y in place of f(x), swap the roles and isolate again.

**Example 4.** Find the inverse of f(x) = (3x - 1)/2.
Writing y = (3x - 1)/2 and isolating x, we get 2y = 3x - 1, then x = (2y + 1)/3.
So the inverse is f^{-1}(x) = (2x + 1)/3.

It is worth remembering that the graph of the inverse is the mirror image of the original graph in
the line making an angle of 45 degrees with the axes.

#### Common mistakes

**Confusing the rate of change with the value of the function.** On a line, a says how much it
changes, and f(x) says how much it is worth.

**Forgetting the existence condition in a logarithm.** Whatever sits inside the logarithm must be
positive, which is why an algebraic solution sometimes has to be discarded.

**Treating a modulus as a single case.** An equality with a modulus produces two equations, and each
one must be checked against the original statement.

**Applying the vertex formula to a function that is not quadratic.** Each family has its own tool.

### Exercises

**Block A. Fundamentals**

1. Find the root of the function f(x) = 3x - 12 and the value of f(0).
2. Find the roots and the vertex of f(x) = x^{2} - 8x + 15.
3. Solve the equation 2^{x} = 64.
4. Work out log_{3} 81.
5. With f(x) = |x - 5|, work out f(2) and f(9).

**Block B. Building up**

6. An affine function passes through the points (1, 5) and (3, 11). Find its rule.
7. With f(x) = 2x - 3 and g(x) = x^{2} + 1, work out f(g(2)) and then g(f(2)).
8. Find the inverse function of f(x) = (3x - 1)/2.
9. Solve the equation 3^{2x - 1} = 27.
10. Solve the equation log_{2} (x - 1) + log_{2} (x + 1) = 3.
11. A radioactive substance of 800 grams loses half its mass every 5 years. What mass is left after
    20 years?
12. Solve the equation |2x - 6| = 4.
13. Find the greatest value taken by f(x) = -x^{2} + 6x - 5 and write the range of the
    function.

**Block C. Going further**

14. Find the values of x at which the graphs of f(x) = x^{2} - 4x + 3 and of g(x) = x - 1
    cross.
15. The revenue of a company, in reais, is given by R(p) = p · (200 - 4p), where p is the unit price
    in reais. Find the price giving maximum revenue and the value of that revenue.
16. Show that the function given by f(x) = (x + 2)/(x - 1) equals its own inverse, by checking
    that f(f(x)) gives back x.
17. Find the value of k for which the line with equation y = x + k touches the parabola with equation
    y = x^{2} at a single point.
18. A culture starts with 500 bacteria and doubles every 3 hours. After how many hours does the
    population reach 32000 bacteria?

### Answer key

1. The root is 4 and f(0) = -12.
2. The roots are 3 and 5. The vertex is the point (4, -1), which is a minimum point.
3. x = 6.
4. The logarithm is 4, because 3^{4} = 81.
5. f(2) = 3 and f(9) = 4.
6. f(x) = 3x + 2. The rate of change is a = (11 - 5)/(3 - 1).
7. f(g(2)) = 7 and g(f(2)) = 2.
8. The inverse is f^{-1}(x) = (2x + 1)/3.
9. x = 2, because 27 = 3^{3}.
10. x = 3. The sum of the logarithms becomes the logarithm of the product, and (x - 1)·(x + 1) = 8.
    The value -3 is discarded, because it would make what sits inside the logarithm negative.
11. There are 50 grams left, because 20 years amount to 4 half lives.
12. x = 5 or x = 1.
13. The greatest value is 4, reached at x = 3. The range is the set of reals y ≤ 4.
14. The graphs cross at x = 1 and at x = 4, since the equality leads to x^{2} - 5x + 4 = 0.
15. The price is 25 reais and the maximum revenue is 2500 reais.
16. Substituting, f(f(x)) has numerator 3x/(x - 1) and denominator 3/(x - 1). The quotient is x, for
    every x ≠ 1.
17. k = -1/4. The equality leads to x^{2} - x - k = 0, and the discriminant Δ = 1 + 4k must be zero.
18. After 18 hours. The population is P(t) = 500 · 2^{t/3}, and 32000/500 = 64 = 2^{6}.

## VERIFICACAO

```python
X1: solve(Eq(2*x - 6, 0), x) == [3] and (2*0 - 6) == -6
X2: sorted(solve(Eq(x**2 - 8*x + 15, 0), x)) == [3, 5] and -(-8)/(2*1) == 4 and (4**2 - 8*4 + 15) == -1
X3: solve(Eq(2**(x + 1), 32), x) == [4]
X4: solve(Eq((3*y - 1)/2, x), y) == [(2*x + 1)/3]
E1: solve(Eq(3*x - 12, 0), x) == [4] and (3*0 - 12) == -12
E2: sorted(solve(Eq(x**2 - 8*x + 15, 0), x)) == [3, 5] and -(-8)/(2*1) == 4 and (4**2 - 8*4 + 15) == -1
E3: solve(Eq(2**x, 64), x) == [6]
E4: simplify(log(81, 3)) == 4
E5: Abs(2 - 5) == 3 and Abs(9 - 5) == 4
E6: solve([Eq(a*1 + b, 5), Eq(a*3 + b, 11)], [a, b]) == {a: 3, b: 2}
E7: (2*(2**2 + 1) - 3) == 7 and ((2*2 - 3)**2 + 1) == 2
E8: solve(Eq((3*y - 1)/2, x), y) == [(2*x + 1)/3]
E9: 3**(2*2 - 1) == 27 and solve(Eq(2*x - 1, 3), x) == [2]
E10: sorted(solve(Eq((x - 1)*(x + 1), 8), x)) == [-3, 3] and 2**3 == 8 and (3 - 1)*(3 + 1) == 8
E11: 800*Rational(1, 2)**4 == 50 and 20/5 == 4
E12: Abs(2*5 - 6) == 4 and Abs(2*1 - 6) == 4 and solve(Eq(2*x - 6, 4), x) == [5] and solve(Eq(2*x - 6, -4), x) == [1]
E13: -6/(2*(-1)) == 3 and (-(3**2) + 6*3 - 5) == 4
E14: sorted(solve(Eq(x**2 - 4*x + 3, x - 1), x)) == [1, 4]
E15: solve(Eq(diff(p*(200 - 4*p), p), 0), p) == [25] and 25*(200 - 4*25) == 2500
E16: simplify(((x + 2)/(x - 1) + 2)/((x + 2)/(x - 1) - 1) - x) == 0
E17: solve(Eq(1 + 4*k, 0), k) == [Rational(-1, 4)]
E18: solve(Eq(500*2**(t/3), 32000), t) == [18] and 500*2**6 == 32000
```
