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

O endereço de um ponto é o par de coordenadas. Escrevendo o ponto de coordenadas 3 e menos 2,
queremos dizer que ele está três unidades à direita da origem e duas unidades abaixo dela. O
primeiro número é a abscissa, o segundo é a ordenada.

Vale fixar o vocabulário, porque ele aparece o tempo todo em prova:

- Ponto com ordenada zero está sobre o eixo horizontal.
- Ponto com abscissa zero está sobre o eixo vertical.
- Ponto com as duas coordenadas iguais está sobre a bissetriz dos quadrantes ímpares.

#### Distância entre dois pontos

Esta é a fórmula que sustenta o resto do capítulo, e ela não é uma fórmula nova: é o teorema de
Pitágoras vestido de coordenadas. Dois pontos determinam um triângulo retângulo cujos catetos são a
diferença das abscissas e a diferença das ordenadas.

d igual à raiz quadrada de (diferença das abscissas ao quadrado mais diferença das ordenadas ao
quadrado)

Como as diferenças aparecem ao quadrado, a ordem em que você as subtrai não importa.

**Exemplo 1.** Distância entre o ponto de coordenadas 1 e 2 e o ponto de coordenadas 4 e 6.
A diferença das abscissas é 3 e a das ordenadas é 4. Então d é a raiz de 9 mais 16, ou seja, raiz de
25, que dá 5.

Quando a conta não cai em quadrado perfeito, a resposta fica em forma de raiz simplificada. Escrever
raiz de 61 é uma resposta melhor do que um decimal aproximado, porque é exata.

#### Ponto médio

O ponto médio de um segmento tem coordenadas iguais às médias das coordenadas dos extremos.

x do ponto médio igual à média das abscissas, e y do ponto médio igual à média das ordenadas

**Exemplo 2.** Ponto médio do segmento de extremos o ponto de coordenadas menos 3 e 5 e o ponto de
coordenadas 7 e 1.
A média das abscissas é menos 3 mais 7 dividido por 2, que dá 2. A média das ordenadas é 5 mais 1
dividido por 2, que dá 3. O ponto médio é o ponto de coordenadas 2 e 3.

Essa fórmula lida bem com o problema inverso. Se você conhece um extremo e o ponto médio, o outro
extremo sai isolando: a abscissa do extremo que falta é o dobro da abscissa do ponto médio menos a
abscissa do extremo conhecido.

#### Baricentro do triângulo

O baricentro é o ponto de encontro das medianas, e em coordenadas ele é a média simples dos três
vértices: soma as abscissas e divide por 3, soma as ordenadas e divide por 3. É uma das fórmulas
mais fáceis de lembrar e das mais cobradas.

#### Alinhamento de três pontos

Três pontos estão alinhados quando não formam triângulo. O teste algébrico usa o determinante da
matriz que tem, em cada linha, a abscissa, a ordenada e o número 1 de um dos pontos. Se o
determinante der zero, os pontos estão alinhados.

Desenvolvido, o determinante vale

x1 vezes (y2 menos y3) mais x2 vezes (y3 menos y1) mais x3 vezes (y1 menos y2)

**Exemplo 3.** Verificar se o ponto de coordenadas 1 e 2, o ponto de coordenadas 3 e 6 e o ponto de
coordenadas 5 e 10 estão alinhados.
O determinante vale 1 vezes (6 menos 10) mais 3 vezes (10 menos 2) mais 5 vezes (2 menos 6), ou
seja, menos 4 mais 24 menos 20, que dá zero. Logo os três pontos estão alinhados.

#### Área de um triângulo

Quando o determinante não dá zero, o seu valor absoluto é o dobro da área do triângulo. Então a área
é a metade do módulo do determinante.

**Exemplo 4.** Área do triângulo de vértices o ponto de coordenadas 2 e 1, o ponto de coordenadas 6
e 3 e o ponto de coordenadas 4 e 7.
O determinante vale 2 vezes (3 menos 7) mais 6 vezes (7 menos 1) mais 4 vezes (1 menos 3), isto é,
menos 8 mais 36 menos 8, que dá 20. A área é a metade de 20, ou seja, 10.

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

**Aproximar a raiz cedo demais.** Se a resposta é raiz de 29, deixe raiz de 29. Arredondar no meio
da conta contamina tudo o que vem depois.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule a distância entre o ponto de coordenadas 2 e 3 e o ponto de coordenadas 6 e 6.
2. Calcule a distância entre o ponto de coordenadas menos 1 e 4 e o ponto de coordenadas 2 e 0.
3. Determine o ponto médio do segmento de extremos o ponto de coordenadas menos 2 e 7 e o ponto de
   coordenadas 6 e 1.
4. Calcule a distância da origem ao ponto de coordenadas 5 e 12.
5. Determine o ponto médio do segmento de extremos o ponto de coordenadas 3 e menos 5 e o ponto de
   coordenadas menos 1 e 9.

**Bloco B. Consolidação**

6. Calcule a distância entre o ponto de coordenadas menos 3 e 2 e o ponto de coordenadas 2 e menos
   4, deixando a resposta em forma de raiz.
7. O ponto de coordenadas 4 e 5 é o ponto médio de um segmento cujo primeiro extremo é o ponto de
   coordenadas 1 e 2. Determine o outro extremo.
8. Verifique se o ponto de coordenadas 2 e 1, o ponto de coordenadas 4 e 5 e o ponto de coordenadas
   7 e 11 estão alinhados.
9. Um triângulo tem vértices no ponto de coordenadas 0 e 0, no ponto de coordenadas 6 e 0 e no ponto
   de coordenadas 3 e 4. Calcule o perímetro e classifique o triângulo quanto aos lados.
10. Determine o ponto do eixo horizontal que fica à mesma distância do ponto de coordenadas 1 e 2 e
    do ponto de coordenadas 7 e 4.
11. Calcule o baricentro do triângulo de vértices o ponto de coordenadas 1 e 2, o ponto de
    coordenadas 5 e 4 e o ponto de coordenadas 3 e 9.
12. Calcule a área do triângulo de vértices o ponto de coordenadas 1 e 1, o ponto de coordenadas 5 e
    2 e o ponto de coordenadas 3 e 6.
13. Calcule a distância da origem ao ponto de coordenadas 2 e 5, deixando a resposta em forma de
    raiz.
14. Determine os valores de m para que o ponto de coordenadas m e 3 fique a uma distância 5 do ponto
    de coordenadas 1 e menos 1.

**Bloco C. Aprofundamento**

15. Um triângulo tem vértices no ponto de coordenadas 1 e 1, no ponto de coordenadas 4 e 5 e no
    ponto de coordenadas 8 e 2. Calcule os quadrados dos três lados, mostre que o triângulo é
    retângulo e isósceles, e calcule sua área.
16. Determine o ponto do eixo vertical que fica à mesma distância do ponto de coordenadas 3 e 1 e do
    ponto de coordenadas menos 1 e 5.
17. Determine k para que o ponto de coordenadas 1 e 3, o ponto de coordenadas 3 e 7 e o ponto de
    coordenadas k e 15 estejam alinhados.
18. Um triângulo tem vértices no ponto de coordenadas 0 e 0, no ponto de coordenadas 8 e 0 e no
    ponto de coordenadas 0 e 6. Calcule o comprimento da mediana que sai do vértice do ângulo reto e
    compare com o comprimento da hipotenusa.
19. Calcule a área do quadrilátero de vértices, nesta ordem, o ponto de coordenadas 0 e 0, o ponto
    de coordenadas 6 e 0, o ponto de coordenadas 8 e 5 e o ponto de coordenadas 0 e 4.

### Gabarito

1. 5. Os catetos medem 4 e 3.
2. 5. Os catetos medem 3 e 4.
3. O ponto de coordenadas 2 e 4.
4. 13.
5. O ponto de coordenadas 1 e 2.
6. Raiz de 61. Os catetos medem 5 e 6.
7. O ponto de coordenadas 7 e 8. Cada coordenada do extremo que falta é o dobro da do ponto médio
   menos a do extremo conhecido.
8. Estão alinhados. O determinante vale zero.
9. Perímetro 16. Os lados medem 6, 5 e 5, então o triângulo é isósceles.
10. O ponto de coordenadas 5 e 0.
11. O ponto de coordenadas 3 e 5.
12. 9. O determinante vale 18 e a área é a metade do seu módulo.
13. Raiz de 29.
14. m igual a 4 ou m igual a menos 2.
15. Os quadrados dos lados valem 25, 25 e 50. Como 25 mais 25 dá 50, o triângulo é retângulo pelo
    recíproco do teorema de Pitágoras, e como dois lados têm o mesmo quadrado ele também é
    isósceles. A área vale 12,5.
16. O ponto de coordenadas 0 e 2.
17. k igual a 7.
18. A mediana mede 5 e a hipotenusa mede 10. A mediana relativa à hipotenusa é a metade dela.
19. 31. Pela fórmula do cadarço, a soma dos produtos cruzados vale 62.

## EN

### Explanation

#### The central idea

Analytic geometry is geometry done with numbers. Instead of looking at a figure and reasoning about
it, you give every point an address and solve the problem by calculation. The gain is huge: what was
intuition becomes algebra, and algebra can be checked.

The address of a point is its pair of coordinates. Writing the point with coordinates 3 and minus 2,
we mean it sits three units to the right of the origin and two units below it. The first number is
the x coordinate, the second is the y coordinate.

It is worth fixing the vocabulary, because it shows up constantly in tests:

- A point whose y coordinate is zero lies on the horizontal axis.
- A point whose x coordinate is zero lies on the vertical axis.
- A point whose two coordinates are equal lies on the bisector of the odd quadrants.

#### Distance between two points

This is the formula the whole chapter rests on, and it is not a new formula: it is the Pythagorean
theorem dressed in coordinates. Two points determine a right triangle whose legs are the difference
of the x coordinates and the difference of the y coordinates.

d equals the square root of (difference of the x coordinates squared plus difference of the y
coordinates squared)

Since the differences appear squared, the order in which you subtract them does not matter.

**Example 1.** Distance between the point with coordinates 1 and 2 and the point with coordinates 4
and 6.
The difference of the x coordinates is 3 and of the y coordinates is 4. So d is the square root of 9
plus 16, that is, the square root of 25, which gives 5.

When the calculation does not land on a perfect square, the answer stays in simplified radical form.
Writing the square root of 61 is a better answer than an approximate decimal, because it is exact.

#### Midpoint

The midpoint of a segment has coordinates equal to the averages of the coordinates of the endpoints.

x of the midpoint equals the average of the x coordinates, and y of the midpoint equals the average
of the y coordinates

**Example 2.** Midpoint of the segment whose endpoints are the point with coordinates minus 3 and 5
and the point with coordinates 7 and 1.
The average of the x coordinates is minus 3 plus 7 divided by 2, which gives 2. The average of the y
coordinates is 5 plus 1 divided by 2, which gives 3. The midpoint is the point with coordinates 2
and 3.

This formula handles the reverse problem well. If you know one endpoint and the midpoint, the other
endpoint comes out by isolating: the x coordinate of the missing endpoint is twice the x coordinate
of the midpoint minus the x coordinate of the known endpoint.

#### Centroid of a triangle

The centroid is the meeting point of the medians, and in coordinates it is the plain average of the
three vertices: add the x coordinates and divide by 3, add the y coordinates and divide by 3. It is
one of the easiest formulas to remember and one of the most frequently asked.

#### Collinearity of three points

Three points are collinear when they form no triangle. The algebraic test uses the determinant of
the matrix that has, in each row, the x coordinate, the y coordinate and the number 1 of one of the
points. If the determinant is zero, the points are collinear.

Expanded, the determinant equals

x1 times (y2 minus y3) plus x2 times (y3 minus y1) plus x3 times (y1 minus y2)

**Example 3.** Check whether the point with coordinates 1 and 2, the point with coordinates 3 and 6
and the point with coordinates 5 and 10 are collinear.
The determinant equals 1 times (6 minus 10) plus 3 times (10 minus 2) plus 5 times (2 minus 6), that
is, minus 4 plus 24 minus 20, which gives zero. So the three points are collinear.

#### Area of a triangle

When the determinant is not zero, its absolute value is twice the area of the triangle. So the area
is half the absolute value of the determinant.

**Example 4.** Area of the triangle with vertices at the point with coordinates 2 and 1, the point
with coordinates 6 and 3 and the point with coordinates 4 and 7.
The determinant equals 2 times (3 minus 7) plus 6 times (7 minus 1) plus 4 times (1 minus 3), that
is, minus 8 plus 36 minus 8, which gives 20. The area is half of 20, that is, 10.

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

**Rounding the radical too early.** If the answer is the square root of 29, leave it as the square
root of 29. Rounding mid calculation contaminates everything that follows.

### Exercises

**Block A. Fundamentals**

1. Find the distance between the point with coordinates 2 and 3 and the point with coordinates 6 and
   6.
2. Find the distance between the point with coordinates minus 1 and 4 and the point with coordinates
   2 and 0.
3. Find the midpoint of the segment whose endpoints are the point with coordinates minus 2 and 7 and
   the point with coordinates 6 and 1.
4. Find the distance from the origin to the point with coordinates 5 and 12.
5. Find the midpoint of the segment whose endpoints are the point with coordinates 3 and minus 5 and
   the point with coordinates minus 1 and 9.

**Block B. Building up**

6. Find the distance between the point with coordinates minus 3 and 2 and the point with coordinates
   2 and minus 4, leaving the answer in radical form.
7. The point with coordinates 4 and 5 is the midpoint of a segment whose first endpoint is the point
   with coordinates 1 and 2. Find the other endpoint.
8. Check whether the point with coordinates 2 and 1, the point with coordinates 4 and 5 and the
   point with coordinates 7 and 11 are collinear.
9. A triangle has vertices at the point with coordinates 0 and 0, the point with coordinates 6 and 0
   and the point with coordinates 3 and 4. Find the perimeter and classify the triangle by its sides.
10. Find the point on the horizontal axis that is the same distance from the point with coordinates
    1 and 2 and from the point with coordinates 7 and 4.
11. Find the centroid of the triangle with vertices at the point with coordinates 1 and 2, the point
    with coordinates 5 and 4 and the point with coordinates 3 and 9.
12. Find the area of the triangle with vertices at the point with coordinates 1 and 1, the point
    with coordinates 5 and 2 and the point with coordinates 3 and 6.
13. Find the distance from the origin to the point with coordinates 2 and 5, leaving the answer in
    radical form.
14. Find the values of m for which the point with coordinates m and 3 is at a distance 5 from the
    point with coordinates 1 and minus 1.

**Block C. Going further**

15. A triangle has vertices at the point with coordinates 1 and 1, the point with coordinates 4 and
    5 and the point with coordinates 8 and 2. Find the squares of the three sides, show that the
    triangle is right angled and isosceles, and find its area.
16. Find the point on the vertical axis that is the same distance from the point with coordinates 3
    and 1 and from the point with coordinates minus 1 and 5.
17. Find k so that the point with coordinates 1 and 3, the point with coordinates 3 and 7 and the
    point with coordinates k and 15 are collinear.
18. A triangle has vertices at the point with coordinates 0 and 0, the point with coordinates 8 and
    0 and the point with coordinates 0 and 6. Find the length of the median drawn from the vertex of
    the right angle and compare it with the length of the hypotenuse.
19. Find the area of the quadrilateral whose vertices are, in this order, the point with coordinates
    0 and 0, the point with coordinates 6 and 0, the point with coordinates 8 and 5 and the point
    with coordinates 0 and 4.

### Answer key

1. 5. The legs measure 4 and 3.
2. 5. The legs measure 3 and 4.
3. The point with coordinates 2 and 4.
4. 13.
5. The point with coordinates 1 and 2.
6. The square root of 61. The legs measure 5 and 6.
7. The point with coordinates 7 and 8. Each coordinate of the missing endpoint is twice the one of
   the midpoint minus the one of the known endpoint.
8. They are collinear. The determinant is zero.
9. Perimeter 16. The sides measure 6, 5 and 5, so the triangle is isosceles.
10. The point with coordinates 5 and 0.
11. The point with coordinates 3 and 5.
12. 9. The determinant is 18 and the area is half its absolute value.
13. The square root of 29.
14. m equals 4 or m equals minus 2.
15. The squares of the sides are 25, 25 and 50. Since 25 plus 25 gives 50, the triangle is right
    angled by the converse of the Pythagorean theorem, and since two sides have the same square it
    is also isosceles. The area is 12.5.
16. The point with coordinates 0 and 2.
17. k equals 7.
18. The median measures 5 and the hypotenuse measures 10. The median to the hypotenuse is half of it.
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
