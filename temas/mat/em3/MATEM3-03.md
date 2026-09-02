---
id: MATEM3-03
serie: em3
unidade: geometria
titulo_pt: Geometria analítica: a circunferência
titulo_en: Analytic geometry: the circle
resumo_pt: Passar da equação reduzida para a geral e de volta completando quadrados, e decidir a posição de um ponto ou de uma reta em relação à circunferência pela distância ao centro.
resumo_en: Moving between the standard and the general equation by completing the square, and deciding the position of a point or a line relative to the circle using the distance to the centre.
prerequisitos: [MATEM3-02]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### A definição vira equação sozinha

Circunferência é o conjunto dos pontos que ficam a uma distância fixa de um ponto fixo. A distância
fixa é o raio, o ponto fixo é o centro. Não há nada além disso, e é por isso que a equação sai
direto da fórmula da distância.

Se o centro é o ponto (a, b) e o raio vale r, dizer que o ponto (x, y) está na circunferência é
dizer que a distância dele ao centro vale r. Elevando os dois lados ao quadrado para tirar a raiz,
chega-se à **equação reduzida**:

(x - a)^{2} + (y - b)^{2} = r^{2}

onde a e b são as coordenadas do centro e r é o raio.

Quando o centro é a origem, a equação fica simplesmente x^{2} + y^{2} = r^{2}.

Repare no sinal: a equação traz **menos** a coordenada do centro. Se o centro tem ordenada -3,
aparece (y + 3) na equação. Esse é o deslize mais frequente do capítulo.

#### A equação geral

Desenvolvendo os quadrados e passando tudo para um lado, chega-se à **equação geral**:

x^{2} + y^{2} + Dx + Ey + F = 0

Duas marcas identificam uma equação geral de circunferência: os coeficientes de x^{2} e de y^{2} são
iguais, e não existe termo com o produto xy.

**Exemplo 1.** Escrever na forma geral a circunferência de centro (1, -4) e raio 3.
A equação reduzida é (x - 1)^{2} + (y + 4)^{2} = 9. Desenvolvendo:
x^{2} - 2x + 1 + y^{2} + 8y + 16 - 9 = 0, ou seja, x^{2} + y^{2} - 2x + 8y + 8 = 0.

#### Voltar da geral para a reduzida: completar quadrados

Este é o movimento que a prova cobra. Agrupe os termos em x, agrupe os termos em y, e complete cada
grupo somando o quadrado da metade do coeficiente do termo linear, compensando do outro lado.

**Exemplo 2.** Achar centro e raio de x^{2} + y^{2} - 10x + 6y + 9 = 0.
Nos termos em x, a metade de -10 é -5, e o quadrado é 25. Nos termos em y, a metade de 6 é 3, e o
quadrado é 9. Somando 25 e 9 nos dois lados:

(x - 5)^{2} + (y + 3)^{2} = -9 + 25 + 9

O lado direito dá 25. Logo o centro é (5, -3), e o raio vale 5.

Se ao final o lado direito der zero, a equação descreve apenas um ponto. Se der negativo, não
descreve nenhum ponto real. Vale conferir esse sinal antes de anunciar um raio.

#### Posição de um ponto

Compare a distância do ponto ao centro com o raio, ou, o que dá no mesmo e evita raízes, compare o
quadrado da distância com o quadrado do raio. Chamando de d a distância do ponto ao centro:

- d < r: ponto interior.
- d = r: ponto sobre a circunferência.
- d > r: ponto exterior.

**Exemplo 3.** Posição do ponto (5, 1) em relação a (x - 1)^{2} + (y + 2)^{2} = 25.
Substituindo: (5 - 1)^{2} + (1 + 2)^{2} = 16 + 9 = 25. Como o resultado é igual ao quadrado do raio,
o ponto está sobre a circunferência.

#### Posição de uma reta

Aqui entra a fórmula da distância de um ponto a uma reta, aplicada ao centro. Chamando de d a
distância do centro à reta:

- d > r: a reta é exterior e não há ponto comum.
- d = r: a reta é tangente e há exatamente um ponto comum.
- d < r: a reta é secante e há dois pontos comuns.

**Exemplo 4.** Posição da reta x + y - 8 = 0 em relação à circunferência de centro (2, 1) e raio 3.
Substituindo o centro: 2 + 1 - 8 = -5, e o módulo é 5. O denominador é √(1 + 1) = √2. Então
d = (5·√2)/2, que é maior que 3. A reta é exterior.

O caminho alternativo é substituir a reta na circunferência e olhar o discriminante da equação do
segundo grau que aparece. Os dois caminhos dão a mesma resposta, e o da distância costuma ser mais
curto.

#### Tangência

Uma reta tangente é perpendicular ao raio no ponto de contato. Isso dá um método rápido: para achar
a tangente num ponto da circunferência, calcule o coeficiente angular do raio e tome o inverso com o
sinal trocado.

#### Erros comuns

**Errar o sinal do centro.** Em (x + 5)^{2} o centro tem abscissa -5, e não 5.

**Esquecer de compensar ao completar o quadrado.** O que você soma de um lado precisa ser somado do
outro. Sem isso o raio sai errado.

**Confundir raio com o quadrado do raio.** Se o lado direito da equação reduzida vale 36, o raio é 6.

**Usar a fórmula da distância com a reta na forma reduzida.** Ela exige a forma geral, com tudo
igualado a zero.

### Exercícios

**Bloco A. Fundamentos**

1. Escreva a equação reduzida da circunferência de centro na origem e raio 7.
2. Escreva a equação reduzida da circunferência de centro (3, -2) e raio 4.
3. Determine o centro e o raio da circunferência de equação (x + 5)^{2} + (y - 1)^{2} = 36.
4. Verifique se o ponto (3, 4) pertence à circunferência de equação x^{2} + y^{2} = 25.
5. Determine o centro e o raio da circunferência de equação x^{2} + y^{2} = 10.

**Bloco B. Consolidação**

6. Escreva a equação geral da circunferência de centro (2, -3) e raio 5.
7. Determine o centro e o raio da circunferência de equação x^{2} + y^{2} - 6x + 4y - 12 = 0.
8. Determine o centro e o raio da circunferência de equação x^{2} + y^{2} + 8x - 10y + 16 = 0.
9. Escreva a equação reduzida da circunferência de centro (1, 2) que passa pelo ponto (4, 6).
10. Um segmento tem extremos (-1, 3) e (5, 11). Escreva a equação reduzida da circunferência que tem
    esse segmento como diâmetro.
11. Determine a posição do ponto (6, 2) em relação à circunferência de equação
    (x - 2)^{2} + (y + 1)^{2} = 16.
12. Determine a posição da reta 3x + 4y - 30 = 0 em relação à circunferência de centro (1, 2) e
    raio 5.
13. Determine os pontos comuns à circunferência x^{2} + y^{2} = 25 e à reta y = x + 1.
14. Determine k para que a equação x^{2} + y^{2} - 4x + 2y + k = 0 represente uma circunferência de
    raio 4.

**Bloco C. Aprofundamento**

15. Determine a posição da reta 3x + 4y - 25 = 0 em relação à circunferência x^{2} + y^{2} = 25,
    calculando a distância do centro à reta, e indique o ponto comum quando existir.
16. Escreva a equação reduzida da circunferência de centro (5, 1) que é tangente à reta
    3x - 4y + 8 = 0.
17. Determine a equação geral da circunferência que passa pelos pontos (0, 0), (6, 0) e (0, 8), e
    indique seu centro e seu raio.
18. Escreva a equação geral da reta tangente à circunferência x^{2} + y^{2} = 169 no ponto (5, 12).
19. Determine a posição relativa entre a circunferência x^{2} + y^{2} = 9 e a circunferência
    (x - 8)^{2} + y^{2} = 25.

### Gabarito

1. x^{2} + y^{2} = 49.
2. (x - 3)^{2} + (y + 2)^{2} = 16.
3. Centro (-5, 1) e raio 6.
4. Pertence, porque 9 + 16 = 25.
5. Centro na origem e raio √10.
6. x^{2} + y^{2} - 4x + 6y - 12 = 0.
7. Centro (3, -2) e raio 5.
8. Centro (-4, 5) e raio 5.
9. (x - 1)^{2} + (y - 2)^{2} = 25. O raio é a distância entre os dois pontos dados, que vale 5.
10. (x - 2)^{2} + (y - 7)^{2} = 25. O centro é o ponto médio do diâmetro e o raio é a metade do
    comprimento dele, que vale 10.
11. Exterior. O quadrado da distância ao centro vale 25, maior que 16.
12. Secante. A distância do centro à reta vale 19/5, que é menor que o raio 5, então a reta corta a
    circunferência em dois pontos.
13. Os pontos (3, 4) e (-4, -3).
14. k = -11.
15. Tangente. A distância do centro à reta vale 25/5 = 5, exatamente o raio. O único ponto comum é
    (3, 4).
16. (x - 5)^{2} + (y - 1)^{2} = 361/25. O raio é a distância do centro à reta, que vale 19/5.
17. x^{2} + y^{2} - 6x - 8y = 0. O centro é (3, 4) e o raio vale 5.
18. 5x + 12y - 169 = 0. A tangente é perpendicular ao raio no ponto de contato.
19. Tangentes exteriormente. A distância entre os centros vale 8, que é a soma dos raios 3 e 5.

## EN

### Explanation

#### The definition turns into an equation on its own

A circle is the set of points that lie at a fixed distance from a fixed point. The fixed distance is
the radius, the fixed point is the centre. There is nothing beyond that, and that is why the equation
comes straight out of the distance formula.

If the centre is the point (a, b) and the radius is r, saying that the point (x, y) lies on the
circle is saying that its distance to the centre is r. Squaring both sides to remove the radical
gives the **standard equation**:

(x - a)^{2} + (y - b)^{2} = r^{2}

where a and b are the coordinates of the centre and r is the radius.

When the centre is the origin, the equation is simply x^{2} + y^{2} = r^{2}.

Watch the sign: the equation carries **minus** the coordinate of the centre. If the centre has y
coordinate -3, the equation shows (y + 3). That is the most frequent slip in this chapter.

#### The general equation

Expanding the squares and moving everything to one side gives the **general equation**:

x^{2} + y^{2} + Dx + Ey + F = 0

Two marks identify a general equation of a circle: the coefficients of x^{2} and of y^{2} are equal,
and there is no term with the product xy.

**Example 1.** Write in general form the circle with centre (1, -4) and radius 3.
The standard equation is (x - 1)^{2} + (y + 4)^{2} = 9. Expanding:
x^{2} - 2x + 1 + y^{2} + 8y + 16 - 9 = 0, that is, x^{2} + y^{2} - 2x + 8y + 8 = 0.

#### Going back from general to standard: completing the square

This is the move that tests ask for. Group the x terms, group the y terms, and complete each group by
adding the square of half the coefficient of the linear term, compensating on the other side.

**Example 2.** Find the centre and the radius of x^{2} + y^{2} - 10x + 6y + 9 = 0.
In the x terms, half of -10 is -5, and its square is 25. In the y terms, half of 6 is 3, and its
square is 9. Adding 25 and 9 to both sides:

(x - 5)^{2} + (y + 3)^{2} = -9 + 25 + 9

The right hand side gives 25. So the centre is (5, -3), and the radius is 5.

If the right hand side ends up as zero, the equation describes a single point. If it ends up
negative, it describes no real point at all. It is worth checking that sign before announcing a
radius.

#### Position of a point

Compare the distance from the point to the centre with the radius, or, which amounts to the same and
avoids radicals, compare the square of the distance with the square of the radius. Calling d the
distance from the point to the centre:

- d < r: the point is inside.
- d = r: the point is on the circle.
- d > r: the point is outside.

**Example 3.** Position of the point (5, 1) relative to (x - 1)^{2} + (y + 2)^{2} = 25.
Substituting: (5 - 1)^{2} + (1 + 2)^{2} = 16 + 9 = 25. Since the result equals the square of the
radius, the point lies on the circle.

#### Position of a line

Here the formula for the distance from a point to a line comes in, applied to the centre. Calling d
the distance from the centre to the line:

- d > r: the line is external and there is no common point.
- d = r: the line is tangent and there is exactly one common point.
- d < r: the line is a secant and there are two common points.

**Example 4.** Position of the line x + y - 8 = 0 relative to the circle with centre (2, 1) and
radius 3.
Substituting the centre: 2 + 1 - 8 = -5, and its absolute value is 5. The denominator is
√(1 + 1) = √2. So d = (5·√2)/2, which is greater than 3. The line is external.

The alternative route is to substitute the line into the circle and look at the discriminant of the
quadratic equation that appears. Both routes give the same answer, and the distance one is usually
shorter.

#### Tangency

A tangent line is perpendicular to the radius at the point of contact. That gives a quick method: to
find the tangent at a point of the circle, compute the slope of the radius and take the reciprocal
with the sign flipped.

#### Common mistakes

**Getting the sign of the centre wrong.** In (x + 5)^{2} the centre has x coordinate -5, not 5.

**Forgetting to compensate when completing the square.** What you add on one side must be added on
the other. Without that the radius comes out wrong.

**Confusing the radius with the square of the radius.** If the right hand side of the standard
equation is 36, the radius is 6.

**Using the distance formula with the line in slope intercept form.** It requires the general form,
with everything set equal to zero.

### Exercises

**Block A. Fundamentals**

1. Write the standard equation of the circle with centre at the origin and radius 7.
2. Write the standard equation of the circle with centre (3, -2) and radius 4.
3. Find the centre and the radius of the circle with equation (x + 5)^{2} + (y - 1)^{2} = 36.
4. Check whether the point (3, 4) belongs to the circle with equation x^{2} + y^{2} = 25.
5. Find the centre and the radius of the circle with equation x^{2} + y^{2} = 10.

**Block B. Building up**

6. Write the general equation of the circle with centre (2, -3) and radius 5.
7. Find the centre and the radius of the circle with equation x^{2} + y^{2} - 6x + 4y - 12 = 0.
8. Find the centre and the radius of the circle with equation x^{2} + y^{2} + 8x - 10y + 16 = 0.
9. Write the standard equation of the circle with centre (1, 2) that passes through the point (4, 6).
10. A segment has endpoints (-1, 3) and (5, 11). Write the standard equation of the circle that has
    this segment as a diameter.
11. Find the position of the point (6, 2) relative to the circle with equation
    (x - 2)^{2} + (y + 1)^{2} = 16.
12. Find the position of the line 3x + 4y - 30 = 0 relative to the circle with centre (1, 2) and
    radius 5.
13. Find the common points of the circle x^{2} + y^{2} = 25 and the line y = x + 1.
14. Find k so that the equation x^{2} + y^{2} - 4x + 2y + k = 0 represents a circle of
    radius 4.

**Block C. Going further**

15. Find the position of the line 3x + 4y - 25 = 0 relative to the circle x^{2} + y^{2} = 25 by
    computing the distance from the centre to the line, and give the common point when there is one.
16. Write the standard equation of the circle with centre (5, 1) that is tangent to the line
    3x - 4y + 8 = 0.
17. Find the general equation of the circle through the points (0, 0), (6, 0) and (0, 8), and give
    its centre and its radius.
18. Write the general equation of the line tangent to the circle x^{2} + y^{2} = 169 at the point
    (5, 12).
19. Find the relative position of the circle x^{2} + y^{2} = 9 and the circle
    (x - 8)^{2} + y^{2} = 25.

### Answer key

1. x^{2} + y^{2} = 49.
2. (x - 3)^{2} + (y + 2)^{2} = 16.
3. Centre (-5, 1) and radius 6.
4. It does belong, because 9 + 16 = 25.
5. Centre at the origin and radius √10.
6. x^{2} + y^{2} - 4x + 6y - 12 = 0.
7. Centre (3, -2) and radius 5.
8. Centre (-4, 5) and radius 5.
9. (x - 1)^{2} + (y - 2)^{2} = 25. The radius is the distance between the two given points, which
   is 5.
10. (x - 2)^{2} + (y - 7)^{2} = 25. The centre is the midpoint of the diameter and the radius is
    half its length, which is 10.
11. Outside. The square of the distance to the centre is 25, greater than 16.
12. A secant. The distance from the centre to the line is 19/5, which is less than the radius 5, so
    the line cuts the circle at two points.
13. The points (3, 4) and (-4, -3).
14. k = -11.
15. Tangent. The distance from the centre to the line is 25/5 = 5, exactly the radius. The only
    common point is (3, 4).
16. (x - 5)^{2} + (y - 1)^{2} = 361/25. The radius is the distance from the centre to the line,
    which is 19/5.
17. x^{2} + y^{2} - 6x - 8y = 0. The centre is (3, 4) and the radius is 5.
18. 5x + 12y - 169 = 0. The tangent is perpendicular to the radius at the point of contact.
19. Externally tangent. The distance between the centres is 8, which is the sum of the radii 3 and 5.

## VERIFICACAO

```python
X1: expand((x-1)**2 + (y+4)**2 - 9) == x**2 + y**2 - 2*x + 8*y + 8
X2: expand((x-5)**2 + (y+3)**2 - 25) == x**2 + y**2 - 10*x + 6*y + 9 and -9 + 25 + 9 == 25
X3: (5-1)**2 + (1+2)**2 == 25
X4: simplify(Abs(2 + 1 - 8)/sqrt(1+1)) == 5*sqrt(2)/2 and 5*sqrt(2)/2 > 3
E1: expand(x**2 + y**2 - 7**2) == x**2 + y**2 - 49
E2: expand((x-3)**2 + (y+2)**2 - 16) == x**2 + y**2 - 6*x + 4*y - 3 and 4**2 == 16
E3: (-5 + 5)**2 + (1 - 1)**2 == 0 and sqrt(36) == 6
E4: 3**2 + 4**2 == 25
E5: simplify(sqrt(10)) == sqrt(10)
E6: expand((x-2)**2 + (y+3)**2 - 25) == x**2 + y**2 - 4*x + 6*y - 12
E7: expand((x-3)**2 + (y+2)**2 - 25) == x**2 + y**2 - 6*x + 4*y - 12
E8: expand((x+4)**2 + (y-5)**2 - 25) == x**2 + y**2 + 8*x - 10*y + 16
E9: (4-1)**2 + (6-2)**2 == 25
E10: Rational(-1+5,2) == 2 and Rational(3+11,2) == 7 and sqrt((5+1)**2 + (11-3)**2) == 10 and Rational(10,2)**2 == 25
E11: (6-2)**2 + (2+1)**2 == 25 and 25 > 16
E12: simplify(Abs(3*1 + 4*2 - 30)/sqrt(3**2+4**2)) == Rational(19,5) and Rational(19,5) < 5
E13: set(solve([Eq(x**2 + y**2, 25), Eq(y, x + 1)], [x, y])) == set([(3, 4), (-4, -3)])
E14: solve(Eq(4 + 1 - k, 16), k) == [-11]
E15: simplify(Abs(3*0 + 4*0 - 25)/sqrt(3**2+4**2)) == 5 and 3*3 + 4*4 - 25 == 0 and 3**2 + 4**2 == 25
E16: simplify(Abs(3*5 - 4*1 + 8)/sqrt(3**2+4**2)) == Rational(19,5) and Rational(19,5)**2 == Rational(361,25)
E17: expand((x-3)**2 + (y-4)**2 - 25) == x**2 + y**2 - 6*x - 8*y and (0-3)**2 + (0-4)**2 == 25 and (6-3)**2 + (0-4)**2 == 25 and (0-3)**2 + (8-4)**2 == 25
E18: 5**2 + 12**2 == 169 and 5*5 + 12*12 - 169 == 0 and simplify(Abs(-169)/sqrt(5**2 + 12**2)) == 13
E19: sqrt((8-0)**2) == 8 and 3 + 5 == 8
```
