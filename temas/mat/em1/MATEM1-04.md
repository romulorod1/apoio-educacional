---
id: MATEM1-04
serie: em1
unidade: algebra
titulo_pt: Função quadrática
titulo_en: Quadratic function
resumo_pt: Ler a parábola pelos coeficientes, achar raízes e vértice, e usar o vértice para resolver problemas de máximo e mínimo.
resumo_en: Reading a parabola from its coefficients, finding roots and vertex, and using the vertex to solve maximum and minimum problems.
prerequisitos: [MATEM1-03]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### O que é e como se reconhece

Uma função quadrática é toda função que pode ser escrita na forma

f(x) = ax^{2} + bx + c, com a ≠ 0

onde a, b e c são números fixos e x é a variável.

A condição de a ser diferente de zero é essencial: se a fosse zero, sobraria uma função do 1º grau,
e o gráfico seria uma reta. O gráfico de uma quadrática é sempre uma **parábola**.

Os três coeficientes contam coisas diferentes, e saber lê-los economiza muita conta:

- **O coeficiente a diz a concavidade.** Se a é positivo, a parábola abre para cima e a função tem
  um ponto de mínimo. Se a é negativo, abre para baixo e tem um ponto de máximo. Quanto maior o
  valor absoluto de a, mais fechada é a parábola.
- **O coeficiente c diz onde a parábola corta o eixo vertical**, porque f(0) = c.
- **O coeficiente b, junto com a, controla a posição do vértice** na horizontal.

#### Raízes: onde a parábola corta o eixo horizontal

As raízes são os valores de x que fazem f(x) = 0. Para achá-las, resolve-se a equação do 2º
grau, e o caminho mais conhecido é a fórmula resolutiva, com o discriminante

Δ = b^{2} - 4·a·c

O discriminante conta quantas raízes reais existem, antes de qualquer conta:

- Δ > 0: duas raízes reais distintas, e a parábola corta o eixo em dois pontos.
- Δ = 0: uma raiz real dupla, e a parábola apenas encosta no eixo.
- Δ < 0: nenhuma raiz real, e a parábola não toca o eixo.

**Exemplo 1.** Achar as raízes de f(x) = x^{2} - 5x + 6.
Aqui a = 1, b = -5 e c = 6. Então Δ = 25 - 24 = 1. Como Δ > 0, há duas raízes: x = 2 e x = 3.

Nesse caso dava para ir mais rápido por soma e produto: procuramos dois números que somem 5 e
multipliquem 6. São o 2 e o 3. Vale sempre tentar isso antes da fórmula, porque é bem mais veloz
quando os números são inteiros.

#### O vértice

O vértice é o ponto mais alto ou mais baixo da parábola, e é ele que resolve todo problema de
máximo e mínimo. Suas coordenadas são

x_{v} = -b/(2a), e y_{v} = -Δ/(4a)

Na prática, calcule primeiro o x do vértice e depois substitua na função para achar o y. Costuma
ser menos trabalhoso do que usar a fórmula do y.

**Exemplo 2.** Achar o vértice de f(x) = x^{2} - 6x + 5.
O x do vértice é 6/2 = 3. Substituindo: f(3) = 9 - 18 + 5 = -4.
O vértice é o ponto (3, -4). Como a é positivo, esse é o ponto de mínimo.

Há um atalho útil: **o x do vértice é sempre a média das duas raízes**. No exemplo 1, as raízes eram
2 e 3, então o x do vértice é 2,5. Isso funciona porque a parábola é simétrica.

#### Forma canônica

Toda quadrática pode ser reescrita como

f(x) = a·(x - x_{v})^{2} + y_{v}

onde x_{v} e y_{v} são as coordenadas do vértice. Essa forma deixa o vértice à vista e é a mais
prática para desenhar o gráfico ou para resolver problemas de máximo.

**Exemplo 3.** Escrever f(x) = 2x^{2} - 8x + 6 na forma canônica.
O x do vértice é 8/4 = 2. E f(2) = 8 - 16 + 6 = -2.
Logo f(x) = 2·(x - 2)^{2} - 2.

#### Problemas de máximo e mínimo

É aqui que a função quadrática ganha o mundo. Sempre que uma grandeza depende de outra de forma
quadrática, o vértice dá a resposta ótima.

**Exemplo 4.** Com 40 metros de tela, qual é o maior curral retangular que se consegue cercar?
Se um lado mede x, o outro mede 20 - x, porque o perímetro é 40. A área é

A(x) = x·(20 - x) = -x^{2} + 20x

Como a é negativo, existe máximo. O x do vértice é 20/2 = 10. Então o curral é um
quadrado de 10 por 10, com área de 100 metros quadrados.

Repare no resultado: entre todos os retângulos de mesmo perímetro, o quadrado é o de maior área.

#### Estudo do sinal

Saber onde a função é positiva ou negativa resolve inequações sem precisar de gráfico detalhado.
Com a positivo e duas raízes, a função é negativa **entre** as raízes e positiva fora delas. Com a
negativo, é o contrário. Uma frase resume: **dentro das raízes o sinal é o contrário do sinal de a**.

#### Erros comuns

**Trocar o sinal no x do vértice.** A fórmula é x_{v} = -b/(2a). Se b já é negativo, o menos com
menos vira mais.

**Achar que Δ negativo significa erro de conta.** Não significa. Quer dizer apenas que a
parábola não corta o eixo horizontal, o que é perfeitamente possível.

**Confundir o valor máximo com o ponto onde ele ocorre.** O x do vértice diz **onde**, e o y do
vértice diz **quanto**. Num problema de lucro, o x é a quantidade e o y é o lucro.

**Usar a fórmula resolutiva quando dava para fatorar.** Em prova cronometrada, tentar soma e produto
primeiro rende tempo.

### Exercícios

**Bloco A. Fundamentos**

1. Determine as raízes de f(x) = x^{2} - 5x + 6.
2. Determine as raízes de f(x) = x^{2} - 4.
3. Calcule o vértice de f(x) = x^{2} - 6x + 5 e diga se é máximo ou mínimo.
4. Determine as raízes e o vértice de f(x) = -x^{2} + 4x.
5. Sem calcular as raízes, diga quantas raízes reais tem f(x) = x^{2} + 2x + 5.

**Bloco B. Consolidação**

6. Determine as raízes e o vértice de f(x) = 2x^{2} - 8x + 6.
7. Escreva f(x) = 2x^{2} - 8x + 6 na forma canônica.
8. Com 40 metros de tela, qual é a maior área retangular que se pode cercar, e quais as dimensões?
9. Um objeto é lançado e sua altura em metros, após t segundos, é dada por h(t) = -5t^{2} + 20t.
   Qual é a altura máxima atingida e em que instante isso acontece?
10. Determine os pontos em que o gráfico de f(x) = x^{2} - 3 cruza o gráfico de g(x) = 2x.
11. Resolva a inequação x^{2} - 5x + 6 < 0.
12. Uma parábola tem raízes 1 e 5 e passa pelo ponto (0, 10). Determine a lei da
    função.
13. O lucro mensal de uma loja, em milhares de reais, é dado por L(x) = -2x^{2} + 24x - 54, onde x
    é o preço do produto. Qual preço dá o maior lucro, e qual é esse lucro?

**Bloco C. Aprofundamento**

14. Determine os valores de m para que a função f(x) = x^{2} - 4x + m tenha duas raízes reais
    distintas.
15. Determine m para que f(x) = x^{2} - 2mx + 9 tenha uma única raiz real.
16. Mostre, usando a forma canônica, que o valor mínimo de f(x) = ax^{2} + bx + c, com a positivo,
    é atingido em x = -b/(2a).
17. Um terreno retangular será cercado com 60 metros de tela, mas um dos lados é um muro que já
    existe e não precisa de cerca. Qual é a maior área possível, e quais as dimensões? Quando a tela
    cerca os quatro lados, o formato ótimo é o quadrado. Aqui isso muda: explique por quê.
18. A soma de dois números é 12. Determine os dois números para que o produto deles seja o maior
    possível, e prove que a resposta é sempre a metade da soma, para qualquer soma dada.

### Gabarito

1. x = 2 e x = 3.
2. x = -2 e x = 2.
3. Vértice em (3, -4). É ponto de mínimo, porque a é positivo.
4. Raízes 0 e 4. Vértice em (2, 4), que é ponto de máximo.
5. Nenhuma raiz real. Δ = 4 - 20 = -16.
6. Raízes 1 e 3. Vértice em (2, -2).
7. f(x) = 2·(x - 2)^{2} - 2.
8. Área máxima de 100 metros quadrados, com um quadrado de 10 por 10.
9. Altura máxima de 20 metros, atingida em 2 segundos.
10. Nos pontos (-1, -2) e (3, 6).
11. Os valores entre 2 e 3, sem incluir os extremos.
12. f(x) = 2x^{2} - 12x + 10.
13. Preço 6, com lucro de 18 mil reais.
14. m < 4.
15. m = 3 ou m = -3.
16. Completando o quadrado, f(x) = a·(x + b/(2a))^{2} + c - b^{2}/(4a). Como a é positivo, o termo
    com o quadrado nunca é negativo, e o menor valor acontece quando ele é zero, isto é, quando
    x = -b/(2a).
17. Área máxima de 450 metros quadrados, com 30 metros no lado paralelo ao muro e 15 em cada lado
    perpendicular. Com a tela cobrindo apenas três lados, a restrição passa a ser 2x + y = 60,
    e o formato ótimo deixa de ser o quadrado.
18. Os dois números são 6 e 6, com produto 36. Em geral, se a soma é S, os números são x e S - x,
    e o produto é uma parábola com concavidade para baixo cujo vértice fica em x = S/2.
    Logo o produto é máximo quando os dois números são iguais à metade da soma.

## EN

### Explanation

#### What it is and how to spot it

A quadratic function is any function that can be written in the form

f(x) = ax^{2} + bx + c, with a ≠ 0

where a, b and c are fixed numbers and x is the variable.

The condition that a is different from zero is essential: if a were zero, a linear function would be
left, and the graph would be a straight line. The graph of a quadratic is always a **parabola**.

The three coefficients tell you different things, and reading them saves a lot of work:

- **The coefficient a gives the concavity.** If a is positive, the parabola opens upwards and the
  function has a minimum point. If a is negative, it opens downwards and has a maximum point. The
  larger the absolute value of a, the narrower the parabola.
- **The coefficient c tells you where the parabola crosses the vertical axis**, because f(0) = c.
- **The coefficient b, together with a, controls the horizontal position of the vertex.**

#### Roots: where the parabola crosses the horizontal axis

The roots are the values of x that make f(x) = 0. To find them you solve the quadratic
equation, and the best known route is the quadratic formula, with the discriminant

Δ = b^{2} - 4·a·c

The discriminant tells you how many real roots there are before any calculation:

- Δ > 0: two distinct real roots, and the parabola crosses the axis at two points.
- Δ = 0: one repeated real root, and the parabola just touches the axis.
- Δ < 0: no real roots, and the parabola never touches the axis.

**Example 1.** Find the roots of f(x) = x^{2} - 5x + 6.
Here a = 1, b = -5 and c = 6. So Δ = 25 - 24 = 1. Since Δ > 0, there are two roots: x = 2 and
x = 3.

In this case there was a quicker route through sum and product: we look for two numbers adding to 5
and multiplying to 6. They are 2 and 3. It is always worth trying this before the formula, because
it is far faster when the numbers are whole.

#### The vertex

The vertex is the highest or lowest point of the parabola, and it is what solves every maximum and
minimum problem. Its coordinates are

x_{v} = -b/(2a), and y_{v} = -Δ/(4a)

In practice, work out the x of the vertex first and then substitute it into the function to get the
y. That is usually less work than using the formula for y.

**Example 2.** Find the vertex of f(x) = x^{2} - 6x + 5.
The x of the vertex is 6/2 = 3. Substituting: f(3) = 9 - 18 + 5 = -4. The vertex is the point
(3, -4). Since a is positive, this is the minimum point.

There is a useful shortcut: **the x of the vertex is always the average of the two roots**. In
example 1 the roots were 2 and 3, so the x of the vertex is 2,5. This works because the parabola is
symmetric.

#### Vertex form

Every quadratic can be rewritten as

f(x) = a·(x - x_{v})^{2} + y_{v}

where x_{v} and y_{v} are the coordinates of the vertex. This form puts the vertex in plain sight
and is the handiest one for sketching the graph or solving maximum problems.

**Example 3.** Write f(x) = 2x^{2} - 8x + 6 in vertex form.
The x of the vertex is 8/4 = 2. And f(2) = 8 - 16 + 6 = -2.
So f(x) = 2·(x - 2)^{2} - 2.

#### Maximum and minimum problems

This is where the quadratic function takes over the world. Whenever one quantity depends on another
in a quadratic way, the vertex gives the optimal answer.

**Example 4.** With 40 metres of fencing, what is the largest rectangular pen you can enclose?
If one side measures x, the other measures 20 - x, because the perimeter is 40. The area is

A(x) = x·(20 - x) = -x^{2} + 20x

Since a is negative, there is a maximum. The x of the vertex is 20/2 = 10. So the
pen is a 10 by 10 square, with an area of 100 square metres.

Notice the result: among all rectangles with the same perimeter, the square has the largest area.

#### Sign analysis

Knowing where the function is positive or negative solves inequalities without a detailed graph.
With a positive and two roots, the function is negative **between** the roots and positive outside
them. With a negative, it is the other way round. One sentence sums it up: **between the roots the
sign is the opposite of the sign of a**.

#### Common mistakes

**Getting the sign wrong in the x of the vertex.** The formula is x_{v} = -b/(2a). If b is already
negative, minus with minus becomes plus.

**Thinking a negative Δ means an arithmetic slip.** It does not. It simply means the parabola
does not cross the horizontal axis, which is perfectly possible.

**Confusing the maximum value with the point where it happens.** The x of the vertex says **where**,
and the y of the vertex says **how much**. In a profit problem, x is the quantity and y is the profit.

**Using the quadratic formula when factoring would do.** In a timed test, trying sum and product
first pays off.

### Exercises

**Block A. Fundamentals**

1. Find the roots of f(x) = x^{2} - 5x + 6.
2. Find the roots of f(x) = x^{2} - 4.
3. Find the vertex of f(x) = x^{2} - 6x + 5 and say whether it is a maximum or a
   minimum.
4. Find the roots and the vertex of f(x) = -x^{2} + 4x.
5. Without finding the roots, say how many real roots f(x) = x^{2} + 2x + 5 has.

**Block B. Building up**

6. Find the roots and the vertex of f(x) = 2x^{2} - 8x + 6.
7. Write f(x) = 2x^{2} - 8x + 6 in vertex form.
8. With 40 metres of fencing, what is the largest rectangular area you can enclose, and what are its
   dimensions?
9. An object is launched and its height in metres, after t seconds, is given by h(t) = -5t^{2} + 20t.
   What is the maximum height reached and at what moment does it happen?
10. Find the points where the graph of f(x) = x^{2} - 3 meets the graph of g(x) = 2x.
11. Solve the inequality x^{2} - 5x + 6 < 0.
12. A parabola has roots 1 and 5 and passes through the point (0, 10). Find the
    rule of the function.
13. The monthly profit of a shop, in thousands of reais, is given by L(x) = -2x^{2} + 24x - 54,
    where x is the price of the product. Which price gives the greatest profit, and what is that
    profit?

**Block C. Going further**

14. Find the values of m for which f(x) = x^{2} - 4x + m has two distinct real
    roots.
15. Find m so that f(x) = x^{2} - 2mx + 9 has exactly one real root.
16. Using vertex form, show that the minimum value of f(x) = ax^{2} + bx + c, with a positive,
    occurs at x = -b/(2a).
17. A rectangular plot will be fenced with 60 metres of fencing, but one of its sides is an existing
    wall that needs no fence. What is the largest possible area, and what are the dimensions? When
    fencing surrounds all four sides, the best shape is a square. Here that changes: explain why.
18. The sum of two numbers is 12. Find the two numbers that make their product as large as possible,
    and prove that the answer is always half the sum, for any given sum.

### Answer key

1. x = 2 and x = 3.
2. x = -2 and x = 2.
3. Vertex at (3, -4). It is a minimum point, because a is positive.
4. Roots 0 and 4. Vertex at (2, 4), which is a maximum point.
5. No real roots. Δ = 4 - 20 = -16.
6. Roots 1 and 3. Vertex at (2, -2).
7. f(x) = 2·(x - 2)^{2} - 2.
8. Maximum area of 100 square metres, with a 10 by 10 square.
9. Maximum height of 20 metres, reached at 2 seconds.
10. At the points (-1, -2) and (3, 6).
11. The values between 2 and 3, not including the endpoints.
12. f(x) = 2x^{2} - 12x + 10.
13. Price 6, with a profit of 18 thousand reais.
14. m < 4.
15. m = 3 or m = -3.
16. Completing the square, f(x) = a·(x + b/(2a))^{2} + c - b^{2}/(4a). Since a is positive, the
    squared term is never negative, and the smallest value happens when it is zero, that is, when
    x = -b/(2a).
17. Maximum area of 450 square metres, with 30 metres on the side parallel to the wall and 15 on
    each perpendicular side. With the fencing covering only three sides, the constraint becomes
    2x + y = 60, and the optimal shape is no longer a square.
18. The two numbers are 6 and 6, with product 36. In general, if the sum is S, the numbers are x and
    S - x, and the product is a downward parabola whose vertex sits at x = S/2. So the
    product is greatest when the two numbers are both half the sum.

## VERIFICACAO

```python
X1: solve(Eq(x**2 - 5*x + 6, 0), x) == [2, 3]
X2: -(-6)/(2*1) == 3 and (3**2 - 6*3 + 5) == -4
X3: -(-8)/(2*2) == 2 and (2*2**2 - 8*2 + 6) == -2 and simplify(2*(x-2)**2 - 2 - (2*x**2 - 8*x + 6)) == 0
X4: solve(Eq(diff(x*(20-x), x), 0), x) == [10] and 10*(20-10) == 100
E1: solve(Eq(x**2 - 5*x + 6, 0), x) == [2, 3]
E2: solve(Eq(x**2 - 4, 0), x) == [-2, 2]
E3: -(-6)/(2*1) == 3 and (3**2 - 6*3 + 5) == -4
E4: solve(Eq(-x**2 + 4*x, 0), x) == [0, 4] and -(4)/(2*(-1)) == 2 and (-(2**2) + 4*2) == 4
E5: (2**2 - 4*1*5) == -16 and len(real_roots(x**2 + 2*x + 5)) == 0
E6: solve(Eq(2*x**2 - 8*x + 6, 0), x) == [1, 3] and -(-8)/(2*2) == 2 and (2*4 - 16 + 6) == -2
E7: simplify(2*(x-2)**2 - 2 - (2*x**2 - 8*x + 6)) == 0
E8: solve(Eq(diff(x*(20-x), x), 0), x) == [10] and 10*(20-10) == 100 and 2*(10+10) == 40
E9: solve(Eq(diff(-5*t**2 + 20*t, t), 0), t) == [2] and (-5*4 + 20*2) == 20
E10: solve(Eq(x**2 - 3, 2*x), x) == [-1, 3] and 2*(-1) == -2 and 2*3 == 6
E11: solveset(x**2 - 5*x + 6 < 0, x, Reals) == Interval.open(2, 3)
E12: solve([Eq(a*1**2 + b*1 + c, 0), Eq(a*25 + b*5 + c, 0), Eq(c, 10)], [a,b,c]) == {a: 2, b: -12, c: 10}
E13: solve(Eq(diff(-2*x**2 + 24*x - 54, x), 0), x) == [6] and (-2*36 + 24*6 - 54) == 18
E14: solveset((-4)**2 - 4*1*m > 0, m, Reals) == Interval.open(-oo, 4)
E15: solve(Eq((2*m)**2 - 4*1*9, 0), m) == [-3, 3]
E16: simplify(a*(x + b/(2*a))**2 + c - b**2/(4*a) - (a*x**2 + b*x + c)) == 0
E17: solve(Eq(diff(x*(60 - 2*x), x), 0), x) == [15] and 15*(60 - 2*15) == 450 and 60 - 2*15 == 30
E18: solve(Eq(diff(x*(12-x), x), 0), x) == [6] and 6*(12-6) == 36 and solve(Eq(diff(x*(Symbol('s')-x), x), 0), x) == [Symbol('s')/2]
```
