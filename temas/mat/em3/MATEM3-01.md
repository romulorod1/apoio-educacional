---
id: MATEM3-01
serie: em3
unidade: geometria
titulo_pt: Geometria analítica: ponto e distância
titulo_en: Analytic geometry: points and distance
resumo_pt: Usar coordenadas para medir distância, achar ponto médio e baricentro, testar alinhamento e calcular área de polígono sem desenhar nada.
resumo_en: Using coordinates to measure distance, find midpoints and centroids, test collinearity and compute areas of polygons without drawing anything.
prerequisitos: [MATEM1-02]
duracao_min: 90
dificuldade: 3
---

## PT

### Explicação

#### A ideia central

Geometria analítica é geometria feita com números. Em vez de olhar para uma figura e raciocinar
sobre ela, você dá um endereço a cada ponto e passa a resolver o problema por conta. A vantagem é
enorme: o que era intuição vira álgebra, e álgebra a gente confere.

O endereço de um ponto é o par de coordenadas. Escrevendo P(3, -2), queremos dizer que o ponto está
três unidades à direita da origem e duas unidades abaixo dela. O primeiro número é a abscissa, o
segundo é a ordenada.

Vale fixar o vocabulário, porque ele aparece o tempo todo em prova:

- Ponto da forma (x, 0) está sobre o eixo horizontal.
- Ponto da forma (0, y) está sobre o eixo vertical.
- Ponto da forma (a, a) está sobre a bissetriz dos quadrantes ímpares.

#### Distância entre dois pontos

Esta é a fórmula que sustenta o resto do capítulo, e ela não é uma fórmula nova: é o teorema de
Pitágoras vestido de coordenadas. Dois pontos determinam um triângulo retângulo cujos catetos são a
diferença das abscissas e a diferença das ordenadas.

d = √((x_{B} - x_{A})^{2} + (y_{B} - y_{A})^{2})

onde d é a distância entre os pontos A(x_{A}, y_{A}) e B(x_{B}, y_{B}).

Como as diferenças aparecem ao quadrado, a ordem em que você as subtrai não importa.

**Exemplo 1.** Distância entre A(1, 2) e B(4, 6).
A diferença das abscissas é 4 - 1 = 3 e a das ordenadas é 6 - 2 = 4. Então
d = √(3^{2} + 4^{2}) = √(9 + 16) = √25 = 5.

Quando a conta não cai em quadrado perfeito, a resposta fica em forma de raiz simplificada. Escrever
√61 é uma resposta melhor do que um decimal aproximado, porque é exata.

#### Ponto médio

O ponto médio de um segmento tem coordenadas iguais às médias das coordenadas dos extremos.

x_{M} = (x_{A} + x_{B}) / 2   e   y_{M} = (y_{A} + y_{B}) / 2

onde M(x_{M}, y_{M}) é o ponto médio do segmento de extremos A e B.

**Exemplo 2.** Ponto médio do segmento de extremos A(-3, 5) e B(7, 1).
x_{M} = (-3 + 7) / 2 = 2 e y_{M} = (5 + 1) / 2 = 3. O ponto médio é M(2, 3).

Essa fórmula lida bem com o problema inverso. Se você conhece um extremo e o ponto médio, o outro
extremo sai isolando:

x_{B} = 2 · x_{M} - x_{A}   e   y_{B} = 2 · y_{M} - y_{A}

#### Baricentro do triângulo

O baricentro é o ponto de encontro das medianas, e em coordenadas ele é a média simples dos três
vértices:

x_{G} = (x_{A} + x_{B} + x_{C}) / 3   e   y_{G} = (y_{A} + y_{B} + y_{C}) / 3

É uma das fórmulas mais fáceis de lembrar e das mais cobradas.

#### Alinhamento de três pontos

Três pontos estão alinhados quando não formam triângulo. O teste algébrico usa o determinante da
matriz que tem, em cada linha, a abscissa, a ordenada e o número 1 de um dos pontos. Se o
determinante der zero, os pontos estão alinhados.

Desenvolvido, o determinante vale

D = x_{1} · (y_{2} - y_{3}) + x_{2} · (y_{3} - y_{1}) + x_{3} · (y_{1} - y_{2})

e a condição de alinhamento é D = 0.

**Exemplo 3.** Verificar se A(1, 2), B(3, 6) e C(5, 10) estão alinhados.
D = 1 · (6 - 10) + 3 · (10 - 2) + 5 · (2 - 6) = -4 + 24 - 20 = 0. Logo os três pontos estão
alinhados.

#### Área de um triângulo

Quando o determinante não dá zero, o seu valor absoluto é o dobro da área do triângulo:

S = |D| / 2

onde S é a área do triângulo cujos vértices formaram o determinante D.

**Exemplo 4.** Área do triângulo de vértices A(2, 1), B(6, 3) e C(4, 7).
D = 2 · (3 - 7) + 6 · (7 - 1) + 4 · (1 - 3) = -8 + 36 - 8 = 20, e a área é
S = |20| / 2 = 10.

Para polígonos com mais lados existe a mesma ideia, conhecida como fórmula do cadarço: percorra os
vértices numa volta só, some os produtos de cada abscissa pela ordenada do vértice seguinte, subtraia
os produtos de cada ordenada pela abscissa do vértice seguinte, e tome a metade do módulo.

#### Erros comuns

**Somar as coordenadas em vez de subtrair na distância.** A fórmula usa diferenças. Somar dá um
número maior e sem significado geométrico.

**Esquecer o módulo na área.** O determinante pode sair negativo, dependendo da ordem em que você
escreve os vértices. Área negativa não existe.

**Trocar as coordenadas de lugar.** Abscissa primeiro, ordenada depois, sempre. Inverter é o erro
que mais custa ponto em prova de geometria analítica.

**Aproximar a raiz cedo demais.** Se a resposta é √29, deixe √29. Arredondar no meio da conta
contamina tudo o que vem depois.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule a distância entre A(2, 3) e B(6, 6).
2. Calcule a distância entre A(-1, 4) e B(2, 0).
3. Determine o ponto médio do segmento de extremos A(-2, 7) e B(6, 1).
4. Calcule a distância da origem a P(5, 12).
5. Determine o ponto médio do segmento de extremos A(3, -5) e B(-1, 9).

**Bloco B. Consolidação**

6. Calcule a distância entre A(-3, 2) e B(2, -4), deixando a resposta em forma de raiz.
7. O ponto M(4, 5) é o ponto médio de um segmento cujo primeiro extremo é A(1, 2). Determine o outro
   extremo.
8. Verifique se A(2, 1), B(4, 5) e C(7, 11) estão alinhados.
9. Um triângulo tem vértices A(0, 0), B(6, 0) e C(3, 4). Calcule o perímetro e classifique o
   triângulo quanto aos lados.
10. Determine o ponto do eixo horizontal que fica à mesma distância de A(1, 2) e de B(7, 4).
11. Calcule o baricentro do triângulo de vértices A(1, 2), B(5, 4) e C(3, 9).
12. Calcule a área do triângulo de vértices A(1, 1), B(5, 2) e C(3, 6).
13. Calcule a distância da origem a P(2, 5), deixando a resposta em forma de raiz.
14. Determine os valores de m para que P(m, 3) fique a uma distância 5 de Q(1, -1).

**Bloco C. Aprofundamento**

15. Um triângulo tem vértices A(1, 1), B(4, 5) e C(8, 2). Calcule os quadrados dos três lados,
    mostre que o triângulo é retângulo e isósceles, e calcule sua área.
16. Determine o ponto do eixo vertical que fica à mesma distância de A(3, 1) e de B(-1, 5).
17. Determine k para que A(1, 3), B(3, 7) e C(k, 15) estejam alinhados.
18. Um triângulo tem vértices A(0, 0), B(8, 0) e C(0, 6). Calcule o comprimento da mediana que sai
    do vértice do ângulo reto e compare com o comprimento da hipotenusa.
19. Calcule a área do quadrilátero de vértices, nesta ordem, A(0, 0), B(6, 0), C(8, 5) e D(0, 4).

### Gabarito

1. 5. Os catetos medem 4 e 3.
2. 5. Os catetos medem 3 e 4.
3. M(2, 4).
4. 13.
5. M(1, 2).
6. √61. Os catetos medem 5 e 6.
7. B(7, 8), porque x_{B} = 2 · x_{M} - x_{A} e y_{B} = 2 · y_{M} - y_{A}.
8. Estão alinhados, porque D = 0.
9. Perímetro 16. Os lados medem 6, 5 e 5, então o triângulo é isósceles.
10. O ponto (5, 0).
11. G(3, 5).
12. 9. D = 18 e a área é S = |D| / 2.
13. √29.
14. m = 4 ou m = -2.
15. Os quadrados dos lados valem 25, 25 e 50. Como 25 + 25 = 50, o triângulo é retângulo pelo
    recíproco do teorema de Pitágoras, e como dois lados têm o mesmo quadrado ele também é
    isósceles. A área vale 12,5.
16. O ponto (0, 2).
17. k = 7.
18. A mediana mede 5 e a hipotenusa mede 10. A mediana relativa à hipotenusa é a metade dela.
19. 31. Pela fórmula do cadarço, a soma dos produtos cruzados vale 62.

## EN

### Explanation

#### The central idea

Analytic geometry is geometry done with numbers. Instead of looking at a figure and reasoning about
it, you give every point an address and solve the problem by calculation. The gain is huge: what was
intuition becomes algebra, and algebra can be checked.

The address of a point is its pair of coordinates. Writing P(3, -2), we mean the point sits three
units to the right of the origin and two units below it. The first number is the x coordinate, the
second is the y coordinate.

It is worth fixing the vocabulary, because it shows up constantly in tests:

- A point of the form (x, 0) lies on the horizontal axis.
- A point of the form (0, y) lies on the vertical axis.
- A point of the form (a, a) lies on the bisector of the odd quadrants.

#### Distance between two points

This is the formula the whole chapter rests on, and it is not a new formula: it is the Pythagorean
theorem dressed in coordinates. Two points determine a right triangle whose legs are the difference
of the x coordinates and the difference of the y coordinates.

d = √((x_{B} - x_{A})^{2} + (y_{B} - y_{A})^{2})

where d is the distance between the points A(x_{A}, y_{A}) and B(x_{B}, y_{B}).

Since the differences appear squared, the order in which you subtract them does not matter.

**Example 1.** Distance between A(1, 2) and B(4, 6).
The difference of the x coordinates is 4 - 1 = 3 and of the y coordinates is 6 - 2 = 4. So
d = √(3^{2} + 4^{2}) = √(9 + 16) = √25 = 5.

When the calculation does not land on a perfect square, the answer stays in simplified radical form.
Writing √61 is a better answer than an approximate decimal, because it is exact.

#### Midpoint

The midpoint of a segment has coordinates equal to the averages of the coordinates of the endpoints.

x_{M} = (x_{A} + x_{B}) / 2   and   y_{M} = (y_{A} + y_{B}) / 2

where M(x_{M}, y_{M}) is the midpoint of the segment with endpoints A and B.

**Example 2.** Midpoint of the segment with endpoints A(-3, 5) and B(7, 1).
x_{M} = (-3 + 7) / 2 = 2 and y_{M} = (5 + 1) / 2 = 3. The midpoint is M(2, 3).

This formula handles the reverse problem well. If you know one endpoint and the midpoint, the other
endpoint comes out by isolating:

x_{B} = 2 · x_{M} - x_{A}   and   y_{B} = 2 · y_{M} - y_{A}

#### Centroid of a triangle

The centroid is the meeting point of the medians, and in coordinates it is the plain average of the
three vertices:

x_{G} = (x_{A} + x_{B} + x_{C}) / 3   and   y_{G} = (y_{A} + y_{B} + y_{C}) / 3

It is one of the easiest formulas to remember and one of the most frequently asked.

#### Collinearity of three points

Three points are collinear when they form no triangle. The algebraic test uses the determinant of
the matrix that has, in each row, the x coordinate, the y coordinate and the number 1 of one of the
points. If the determinant is zero, the points are collinear.

Expanded, the determinant equals

D = x_{1} · (y_{2} - y_{3}) + x_{2} · (y_{3} - y_{1}) + x_{3} · (y_{1} - y_{2})

and the collinearity condition is D = 0.

**Example 3.** Check whether A(1, 2), B(3, 6) and C(5, 10) are collinear.
D = 1 · (6 - 10) + 3 · (10 - 2) + 5 · (2 - 6) = -4 + 24 - 20 = 0. So the three points are
collinear.

#### Area of a triangle

When the determinant is not zero, its absolute value is twice the area of the triangle:

S = |D| / 2

where S is the area of the triangle whose vertices formed the determinant D.

**Example 4.** Area of the triangle with vertices A(2, 1), B(6, 3) and C(4, 7).
D = 2 · (3 - 7) + 6 · (7 - 1) + 4 · (1 - 3) = -8 + 36 - 8 = 20, and the area is
S = |20| / 2 = 10.

For polygons with more sides there is the same idea, known as the shoelace formula: walk around the
vertices in a single loop, add the products of each x coordinate by the y coordinate of the next
vertex, subtract the products of each y coordinate by the x coordinate of the next vertex, and take
half the absolute value.

#### Common mistakes

**Adding the coordinates instead of subtracting them in the distance.** The formula uses
differences. Adding gives a larger number with no geometric meaning.

**Forgetting the absolute value in the area.** The determinant may come out negative, depending on
the order in which you write the vertices. A negative area does not exist.

**Swapping the coordinates.** The x coordinate comes first, the y coordinate second, always.
Reversing them is the mistake that costs the most marks in analytic geometry.

**Rounding the radical too early.** If the answer is √29, leave it as √29. Rounding mid calculation
contaminates everything that follows.

### Exercises

**Block A. Fundamentals**

1. Find the distance between A(2, 3) and B(6, 6).
2. Find the distance between A(-1, 4) and B(2, 0).
3. Find the midpoint of the segment with endpoints A(-2, 7) and B(6, 1).
4. Find the distance from the origin to P(5, 12).
5. Find the midpoint of the segment with endpoints A(3, -5) and B(-1, 9).

**Block B. Building up**

6. Find the distance between A(-3, 2) and B(2, -4), leaving the answer in radical form.
7. The point M(4, 5) is the midpoint of a segment whose first endpoint is A(1, 2). Find the other
   endpoint.
8. Check whether A(2, 1), B(4, 5) and C(7, 11) are collinear.
9. A triangle has vertices A(0, 0), B(6, 0) and C(3, 4). Find the perimeter and classify the
   triangle by its sides.
10. Find the point on the horizontal axis that is the same distance from A(1, 2) and from B(7, 4).
11. Find the centroid of the triangle with vertices A(1, 2), B(5, 4) and C(3, 9).
12. Find the area of the triangle with vertices A(1, 1), B(5, 2) and C(3, 6).
13. Find the distance from the origin to P(2, 5), leaving the answer in radical form.
14. Find the values of m for which P(m, 3) is at a distance 5 from Q(1, -1).

**Block C. Going further**

15. A triangle has vertices A(1, 1), B(4, 5) and C(8, 2). Find the squares of the three sides, show
    that the triangle is right angled and isosceles, and find its area.
16. Find the point on the vertical axis that is the same distance from A(3, 1) and from B(-1, 5).
17. Find k so that A(1, 3), B(3, 7) and C(k, 15) are collinear.
18. A triangle has vertices A(0, 0), B(8, 0) and C(0, 6). Find the length of the median drawn from
    the vertex of the right angle and compare it with the length of the hypotenuse.
19. Find the area of the quadrilateral whose vertices are, in this order, A(0, 0), B(6, 0), C(8, 5)
    and D(0, 4).

### Answer key

1. 5. The legs measure 4 and 3.
2. 5. The legs measure 3 and 4.
3. M(2, 4).
4. 13.
5. M(1, 2).
6. √61. The legs measure 5 and 6.
7. B(7, 8), because x_{B} = 2 · x_{M} - x_{A} and y_{B} = 2 · y_{M} - y_{A}.
8. They are collinear, because D = 0.
9. Perimeter 16. The sides measure 6, 5 and 5, so the triangle is isosceles.
10. The point (5, 0).
11. G(3, 5).
12. 9. D = 18 and the area is S = |D| / 2.
13. √29.
14. m = 4 or m = -2.
15. The squares of the sides are 25, 25 and 50. Since 25 + 25 = 50, the triangle is right angled by
    the converse of the Pythagorean theorem, and since two sides have the same square it is also
    isosceles. The area is 12.5.
16. The point (0, 2).
17. k = 7.
18. The median measures 5 and the hypotenuse measures 10. The median to the hypotenuse is half of
    it.
19. 31. By the shoelace formula, the sum of the cross products is 62.

## VERIFICACAO

```python
X1: sqrt((4-1)**2 + (6-2)**2) == 5
X2: Rational(-3+7,2) == 2 and Rational(5+1,2) == 3
X3: 1*(6-10) + 3*(10-2) + 5*(2-6) == 0
X4: 2*(3-7) + 6*(7-1) + 4*(1-3) == 20 and Rational(20,2) == 10
E1: sqrt((6-2)**2 + (6-3)**2) == 5
E2: sqrt((2-(-1))**2 + (0-4)**2) == 5
E3: Rational(-2+6,2) == 2 and Rational(7+1,2) == 4
E4: sqrt(5**2 + 12**2) == 13
E5: Rational(3+(-1),2) == 1 and Rational(-5+9,2) == 2
E6: simplify(sqrt((2-(-3))**2 + (-4-2)**2)) == sqrt(61)
E7: 2*4 - 1 == 7 and 2*5 - 2 == 8
E8: 2*(5-11) + 4*(11-1) + 7*(1-5) == 0
E9: sqrt(36) + sqrt((3-6)**2+16) + sqrt(9+16) == 16 and sqrt((3-6)**2+16) == sqrt(9+16)
E10: solve(Eq((x-1)**2 + 4, (x-7)**2 + 16), x) == [5]
E11: Rational(1+5+3,3) == 3 and Rational(2+4+9,3) == 5
E12: Abs(1*(2-6) + 5*(6-1) + 3*(1-2)) == 18 and Rational(18,2) == 9
E13: simplify(sqrt(2**2 + 5**2)) == sqrt(29)
E14: solve(Eq((m-1)**2 + (3-(-1))**2, 25), m) == [-2, 4]
E15: (4-1)**2+(5-1)**2 == 25 and (8-4)**2+(2-5)**2 == 25 and (8-1)**2+(2-1)**2 == 50 and 25+25 == 50 and Rational(5*5,2) == Rational(25,2)
E16: solve(Eq(9 + (y-1)**2, 1 + (y-5)**2), y) == [2]
E17: solve(Eq(1*(7-15) + 3*(15-3) + k*(3-7), 0), k) == [7]
E18: sqrt((Rational(8+0,2))**2 + (Rational(0+6,2))**2) == 5 and sqrt(8**2+6**2) == 10
E19: Abs(0*0 + 6*5 + 8*4 + 0*0 - (0*6 + 0*8 + 5*0 + 4*0)) == 62 and Rational(62,2) == 31
```
