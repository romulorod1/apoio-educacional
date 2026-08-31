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

Se o centro tem coordenadas a e b e o raio vale r, dizer que um ponto de coordenadas x e y está na
circunferência é dizer que a distância dele ao centro vale r. Elevando os dois lados ao quadrado
para tirar a raiz, chega-se à **equação reduzida**:

(x menos a) ao quadrado mais (y menos b) ao quadrado igual a r ao quadrado

Quando o centro é a origem, a equação fica simplesmente x ao quadrado mais y ao quadrado igual a r
ao quadrado.

Repare no sinal: a equação traz **menos** a coordenada do centro. Se o centro tem ordenada menos 3,
aparece y mais 3 na equação. Esse é o deslize mais frequente do capítulo.

#### A equação geral

Desenvolvendo os quadrados e passando tudo para um lado, chega-se à **equação geral**:

x ao quadrado mais y ao quadrado mais Dx mais Ey mais F igual a zero

Duas marcas identificam uma equação geral de circunferência: os coeficientes de x ao quadrado e de y
ao quadrado são iguais, e não existe termo com o produto xy.

**Exemplo 1.** Escrever na forma geral a circunferência de centro no ponto de coordenadas 1 e menos
4 e raio 3.
A equação reduzida é (x menos 1) ao quadrado mais (y mais 4) ao quadrado igual a 9. Desenvolvendo: x
ao quadrado menos 2x mais 1 mais y ao quadrado mais 8y mais 16 menos 9 igual a zero, ou seja, x ao
quadrado mais y ao quadrado menos 2x mais 8y mais 8 igual a zero.

#### Voltar da geral para a reduzida: completar quadrados

Este é o movimento que a prova cobra. Agrupe os termos em x, agrupe os termos em y, e complete cada
grupo somando o quadrado da metade do coeficiente do termo linear, compensando do outro lado.

**Exemplo 2.** Achar centro e raio de x ao quadrado mais y ao quadrado menos 10x mais 6y mais 9 igual
a zero.
Nos termos em x, a metade de menos 10 é menos 5, e o quadrado é 25. Nos termos em y, a metade de 6 é
3, e o quadrado é 9. Somando 25 e 9 nos dois lados:

(x menos 5) ao quadrado mais (y mais 3) ao quadrado igual a menos 9 mais 25 mais 9

O lado direito dá 25. Logo o centro é o ponto de coordenadas 5 e menos 3, e o raio vale 5.

Se ao final o lado direito der zero, a equação descreve apenas um ponto. Se der negativo, não
descreve nenhum ponto real. Vale conferir esse sinal antes de anunciar um raio.

#### Posição de um ponto

Compare a distância do ponto ao centro com o raio, ou, o que dá no mesmo e evita raízes, compare o
quadrado da distância com o quadrado do raio.

- Distância menor que o raio: ponto interior.
- Distância igual ao raio: ponto sobre a circunferência.
- Distância maior que o raio: ponto exterior.

**Exemplo 3.** Posição do ponto de coordenadas 5 e 1 em relação a (x menos 1) ao quadrado mais (y
mais 2) ao quadrado igual a 25.
Substituindo: (5 menos 1) ao quadrado mais (1 mais 2) ao quadrado dá 16 mais 9, ou seja, 25. Como o
resultado é igual ao quadrado do raio, o ponto está sobre a circunferência.

#### Posição de uma reta

Aqui entra a fórmula da distância de um ponto a uma reta, aplicada ao centro. Chamando de d a
distância do centro à reta:

- d maior que r: a reta é exterior e não há ponto comum.
- d igual a r: a reta é tangente e há exatamente um ponto comum.
- d menor que r: a reta é secante e há dois pontos comuns.

**Exemplo 4.** Posição da reta x mais y menos 8 igual a zero em relação à circunferência de centro no
ponto de coordenadas 2 e 1 e raio 3.
Substituindo o centro: 2 mais 1 menos 8 dá menos 5, e o módulo é 5. O denominador é a raiz de 1 mais
1, que é raiz de 2. Então d vale 5 raiz de 2 sobre 2, que é maior que 3. A reta é exterior.

O caminho alternativo é substituir a reta na circunferência e olhar o discriminante da equação do
segundo grau que aparece. Os dois caminhos dão a mesma resposta, e o da distância costuma ser mais
curto.

#### Tangência

Uma reta tangente é perpendicular ao raio no ponto de contato. Isso dá um método rápido: para achar
a tangente num ponto da circunferência, calcule o coeficiente angular do raio e tome o inverso com o
sinal trocado.

#### Erros comuns

**Errar o sinal do centro.** Em (x mais 5) ao quadrado o centro tem abscissa menos 5, e não 5.

**Esquecer de compensar ao completar o quadrado.** O que você soma de um lado precisa ser somado do
outro. Sem isso o raio sai errado.

**Confundir raio com o quadrado do raio.** Se o lado direito da equação reduzida vale 36, o raio é 6.

**Usar a fórmula da distância com a reta na forma reduzida.** Ela exige a forma geral, com tudo
igualado a zero.

### Exercícios

**Bloco A. Fundamentos**

1. Escreva a equação reduzida da circunferência de centro na origem e raio 7.
2. Escreva a equação reduzida da circunferência de centro no ponto de coordenadas 3 e menos 2 e raio
   4.
3. Determine o centro e o raio da circunferência de equação (x mais 5) ao quadrado mais (y menos 1)
   ao quadrado igual a 36.
4. Verifique se o ponto de coordenadas 3 e 4 pertence à circunferência de equação x ao quadrado mais
   y ao quadrado igual a 25.
5. Determine o centro e o raio da circunferência de equação x ao quadrado mais y ao quadrado igual a
   10.

**Bloco B. Consolidação**

6. Escreva a equação geral da circunferência de centro no ponto de coordenadas 2 e menos 3 e raio 5.
7. Determine o centro e o raio da circunferência de equação x ao quadrado mais y ao quadrado menos
   6x mais 4y menos 12 igual a zero.
8. Determine o centro e o raio da circunferência de equação x ao quadrado mais y ao quadrado mais 8x
   menos 10y mais 16 igual a zero.
9. Escreva a equação reduzida da circunferência de centro no ponto de coordenadas 1 e 2 que passa
   pelo ponto de coordenadas 4 e 6.
10. Um segmento tem extremos no ponto de coordenadas menos 1 e 3 e no ponto de coordenadas 5 e 11.
    Escreva a equação reduzida da circunferência que tem esse segmento como diâmetro.
11. Determine a posição do ponto de coordenadas 6 e 2 em relação à circunferência de equação (x
    menos 2) ao quadrado mais (y mais 1) ao quadrado igual a 16.
12. Determine a posição da reta 3x mais 4y menos 30 igual a zero em relação à circunferência de
    centro no ponto de coordenadas 1 e 2 e raio 5.
13. Determine os pontos comuns à circunferência x ao quadrado mais y ao quadrado igual a 25 e à reta
    y igual a x mais 1.
14. Determine k para que a equação x ao quadrado mais y ao quadrado menos 4x mais 2y mais k igual a
    zero represente uma circunferência de raio 4.

**Bloco C. Aprofundamento**

15. Determine a posição da reta 3x mais 4y menos 25 igual a zero em relação à circunferência x ao
    quadrado mais y ao quadrado igual a 25, calculando a distância do centro à reta, e indique o
    ponto comum quando existir.
16. Escreva a equação reduzida da circunferência de centro no ponto de coordenadas 5 e 1 que é
    tangente à reta 3x menos 4y mais 8 igual a zero.
17. Determine a equação geral da circunferência que passa pelo ponto de coordenadas 0 e 0, pelo
    ponto de coordenadas 6 e 0 e pelo ponto de coordenadas 0 e 8, e indique seu centro e seu raio.
18. Escreva a equação geral da reta tangente à circunferência x ao quadrado mais y ao quadrado igual
    a 169 no ponto de coordenadas 5 e 12.
19. Determine a posição relativa entre a circunferência x ao quadrado mais y ao quadrado igual a 9 e
    a circunferência (x menos 8) ao quadrado mais y ao quadrado igual a 25.

### Gabarito

1. x ao quadrado mais y ao quadrado igual a 49.
2. (x menos 3) ao quadrado mais (y mais 2) ao quadrado igual a 16.
3. Centro no ponto de coordenadas menos 5 e 1, e raio 6.
4. Pertence, porque 9 mais 16 dá 25.
5. Centro na origem e raio igual à raiz de 10.
6. x ao quadrado mais y ao quadrado menos 4x mais 6y menos 12 igual a zero.
7. Centro no ponto de coordenadas 3 e menos 2, e raio 5.
8. Centro no ponto de coordenadas menos 4 e 5, e raio 5.
9. (x menos 1) ao quadrado mais (y menos 2) ao quadrado igual a 25. O raio é a distância entre os
   dois pontos dados, que vale 5.
10. (x menos 2) ao quadrado mais (y menos 7) ao quadrado igual a 25. O centro é o ponto médio do
    diâmetro e o raio é a metade do comprimento dele, que vale 10.
11. Exterior. O quadrado da distância ao centro vale 25, maior que 16.
12. Secante. A distância do centro à reta vale 19 sobre 5, que é menor que o raio 5, então a reta
    corta a circunferência em dois pontos.
13. O ponto de coordenadas 3 e 4 e o ponto de coordenadas menos 4 e menos 3.
14. k igual a menos 11.
15. Tangente. A distância do centro à reta vale 25 sobre 5, ou seja, 5, exatamente o raio. O único
    ponto comum é o ponto de coordenadas 3 e 4.
16. (x menos 5) ao quadrado mais (y menos 1) ao quadrado igual a 361 sobre 25. O raio é a distância
    do centro à reta, que vale 19 sobre 5.
17. x ao quadrado mais y ao quadrado menos 6x menos 8y igual a zero. O centro é o ponto de
    coordenadas 3 e 4 e o raio vale 5.
18. 5x mais 12y menos 169 igual a zero. A tangente é perpendicular ao raio no ponto de contato.
19. Tangentes exteriormente. A distância entre os centros vale 8, que é a soma dos raios 3 e 5.

## EN

### Explanation

#### The definition turns into an equation on its own

A circle is the set of points that lie at a fixed distance from a fixed point. The fixed distance is
the radius, the fixed point is the centre. There is nothing beyond that, and that is why the equation
comes straight out of the distance formula.

If the centre has coordinates a and b and the radius is r, saying that a point with coordinates x and
y lies on the circle is saying that its distance to the centre is r. Squaring both sides to remove
the radical gives the **standard equation**:

(x minus a) squared plus (y minus b) squared equals r squared

When the centre is the origin, the equation is simply x squared plus y squared equals r squared.

Watch the sign: the equation carries **minus** the coordinate of the centre. If the centre has y
coordinate minus 3, the equation shows y plus 3. That is the most frequent slip in this chapter.

#### The general equation

Expanding the squares and moving everything to one side gives the **general equation**:

x squared plus y squared plus Dx plus Ey plus F equals zero

Two marks identify a general equation of a circle: the coefficients of x squared and of y squared are
equal, and there is no term with the product xy.

**Example 1.** Write in general form the circle with centre at the point with coordinates 1 and minus
4 and radius 3.
The standard equation is (x minus 1) squared plus (y plus 4) squared equals 9. Expanding: x squared
minus 2x plus 1 plus y squared plus 8y plus 16 minus 9 equals zero, that is, x squared plus y squared
minus 2x plus 8y plus 8 equals zero.

#### Going back from general to standard: completing the square

This is the move that tests ask for. Group the x terms, group the y terms, and complete each group by
adding the square of half the coefficient of the linear term, compensating on the other side.

**Example 2.** Find the centre and the radius of x squared plus y squared minus 10x plus 6y plus 9
equals zero.
In the x terms, half of minus 10 is minus 5, and its square is 25. In the y terms, half of 6 is 3, and
its square is 9. Adding 25 and 9 to both sides:

(x minus 5) squared plus (y plus 3) squared equals minus 9 plus 25 plus 9

The right hand side gives 25. So the centre is the point with coordinates 5 and minus 3, and the
radius is 5.

If the right hand side ends up as zero, the equation describes a single point. If it ends up
negative, it describes no real point at all. It is worth checking that sign before announcing a
radius.

#### Position of a point

Compare the distance from the point to the centre with the radius, or, which amounts to the same and
avoids radicals, compare the square of the distance with the square of the radius.

- Distance less than the radius: the point is inside.
- Distance equal to the radius: the point is on the circle.
- Distance greater than the radius: the point is outside.

**Example 3.** Position of the point with coordinates 5 and 1 relative to (x minus 1) squared plus (y
plus 2) squared equals 25.
Substituting: (5 minus 1) squared plus (1 plus 2) squared gives 16 plus 9, that is, 25. Since the
result equals the square of the radius, the point lies on the circle.

#### Position of a line

Here the formula for the distance from a point to a line comes in, applied to the centre. Calling d
the distance from the centre to the line:

- d greater than r: the line is external and there is no common point.
- d equal to r: the line is tangent and there is exactly one common point.
- d less than r: the line is a secant and there are two common points.

**Example 4.** Position of the line x plus y minus 8 equals zero relative to the circle with centre at
the point with coordinates 2 and 1 and radius 3.
Substituting the centre: 2 plus 1 minus 8 gives minus 5, and its absolute value is 5. The denominator
is the square root of 1 plus 1, which is the square root of 2. So d equals 5 square roots of 2 over 2,
which is greater than 3. The line is external.

The alternative route is to substitute the line into the circle and look at the discriminant of the
quadratic equation that appears. Both routes give the same answer, and the distance one is usually
shorter.

#### Tangency

A tangent line is perpendicular to the radius at the point of contact. That gives a quick method: to
find the tangent at a point of the circle, compute the slope of the radius and take the reciprocal
with the sign flipped.

#### Common mistakes

**Getting the sign of the centre wrong.** In (x plus 5) squared the centre has x coordinate minus 5,
not 5.

**Forgetting to compensate when completing the square.** What you add on one side must be added on
the other. Without that the radius comes out wrong.

**Confusing the radius with the square of the radius.** If the right hand side of the standard
equation is 36, the radius is 6.

**Using the distance formula with the line in slope intercept form.** It requires the general form,
with everything set equal to zero.

### Exercises

**Block A. Fundamentals**

1. Write the standard equation of the circle with centre at the origin and radius 7.
2. Write the standard equation of the circle with centre at the point with coordinates 3 and minus 2
   and radius 4.
3. Find the centre and the radius of the circle with equation (x plus 5) squared plus (y minus 1)
   squared equals 36.
4. Check whether the point with coordinates 3 and 4 belongs to the circle with equation x squared
   plus y squared equals 25.
5. Find the centre and the radius of the circle with equation x squared plus y squared equals 10.

**Block B. Building up**

6. Write the general equation of the circle with centre at the point with coordinates 2 and minus 3
   and radius 5.
7. Find the centre and the radius of the circle with equation x squared plus y squared minus 6x plus
   4y minus 12 equals zero.
8. Find the centre and the radius of the circle with equation x squared plus y squared plus 8x minus
   10y plus 16 equals zero.
9. Write the standard equation of the circle with centre at the point with coordinates 1 and 2 that
   passes through the point with coordinates 4 and 6.
10. A segment has endpoints at the point with coordinates minus 1 and 3 and at the point with
    coordinates 5 and 11. Write the standard equation of the circle that has this segment as a
    diameter.
11. Find the position of the point with coordinates 6 and 2 relative to the circle with equation (x
    minus 2) squared plus (y plus 1) squared equals 16.
12. Find the position of the line 3x plus 4y minus 30 equals zero relative to the circle with centre
    at the point with coordinates 1 and 2 and radius 5.
13. Find the common points of the circle x squared plus y squared equals 25 and the line y equals x
    plus 1.
14. Find k so that the equation x squared plus y squared minus 4x plus 2y plus k equals zero
    represents a circle of radius 4.

**Block C. Going further**

15. Find the position of the line 3x plus 4y minus 25 equals zero relative to the circle x squared
    plus y squared equals 25 by computing the distance from the centre to the line, and give the
    common point when there is one.
16. Write the standard equation of the circle with centre at the point with coordinates 5 and 1 that
    is tangent to the line 3x minus 4y plus 8 equals zero.
17. Find the general equation of the circle through the point with coordinates 0 and 0, the point
    with coordinates 6 and 0 and the point with coordinates 0 and 8, and give its centre and its
    radius.
18. Write the general equation of the line tangent to the circle x squared plus y squared equals 169
    at the point with coordinates 5 and 12.
19. Find the relative position of the circle x squared plus y squared equals 9 and the circle (x
    minus 8) squared plus y squared equals 25.

### Answer key

1. x squared plus y squared equals 49.
2. (x minus 3) squared plus (y plus 2) squared equals 16.
3. Centre at the point with coordinates minus 5 and 1, and radius 6.
4. It does belong, because 9 plus 16 gives 25.
5. Centre at the origin and radius equal to the square root of 10.
6. x squared plus y squared minus 4x plus 6y minus 12 equals zero.
7. Centre at the point with coordinates 3 and minus 2, and radius 5.
8. Centre at the point with coordinates minus 4 and 5, and radius 5.
9. (x minus 1) squared plus (y minus 2) squared equals 25. The radius is the distance between the two
   given points, which is 5.
10. (x minus 2) squared plus (y minus 7) squared equals 25. The centre is the midpoint of the
    diameter and the radius is half its length, which is 10.
11. Outside. The square of the distance to the centre is 25, greater than 16.
12. A secant. The distance from the centre to the line is 19 over 5, which is less than the radius 5,
    so the line cuts the circle at two points.
13. The point with coordinates 3 and 4 and the point with coordinates minus 4 and minus 3.
14. k equals minus 11.
15. Tangent. The distance from the centre to the line is 25 over 5, that is, 5, exactly the radius.
    The only common point is the point with coordinates 3 and 4.
16. (x minus 5) squared plus (y minus 1) squared equals 361 over 25. The radius is the distance from
    the centre to the line, which is 19 over 5.
17. x squared plus y squared minus 6x minus 8y equals zero. The centre is the point with coordinates
    3 and 4 and the radius is 5.
18. 5x plus 12y minus 169 equals zero. The tangent is perpendicular to the radius at the point of
    contact.
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
