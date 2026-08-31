---
id: MATEM3-02
serie: em3
unidade: geometria
titulo_pt: Geometria analítica: a reta
titulo_en: Analytic geometry: the straight line
resumo_pt: Escrever a equação de uma reta de todos os jeitos, reconhecer paralelismo e perpendicularidade pelo coeficiente angular e medir a distância de um ponto a uma reta.
resumo_en: Writing the equation of a line in every form, spotting parallel and perpendicular lines from the slope, and measuring the distance from a point to a line.
prerequisitos: [MATEM3-01]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### O coeficiente angular

Uma reta não vertical fica inteiramente determinada por duas informações: a inclinação e um ponto
por onde ela passa. A inclinação é medida pelo coeficiente angular, que responde a uma pergunta
prática: quando eu ando uma unidade para a direita, quanto eu subo?

coeficiente angular igual à diferença das ordenadas dividida pela diferença das abscissas

O sinal já conta a história: coeficiente positivo é reta que sobe da esquerda para a direita,
coeficiente negativo é reta que desce, coeficiente zero é reta horizontal. Reta vertical não tem
coeficiente angular, porque a diferença das abscissas seria zero e não se divide por zero.

**Exemplo 1.** Reta que passa pelo ponto de coordenadas 1 e 2 e pelo ponto de coordenadas 4 e 8.
O coeficiente angular é 8 menos 2 sobre 4 menos 1, ou seja, 6 sobre 3, que dá 2. Usando o primeiro
ponto, a equação é y menos 2 igual a 2 vezes (x menos 1), que arrumada fica y igual a 2x. Conferindo:
para x igual a 4 o valor é 8, como se esperava.

#### As três formas de escrever a mesma reta

**Forma ponto e coeficiente.** Sabendo o coeficiente angular m e um ponto de coordenadas x0 e y0:

y menos y0 igual a m vezes (x menos x0)

É a forma de trabalho, a que se escreve primeiro quase sempre.

**Forma reduzida.** Isolando y:

y igual a mx mais n

Aqui m é o coeficiente angular e n é o coeficiente linear, que é a ordenada do ponto em que a reta
corta o eixo vertical.

**Forma geral.** Tudo passado para o lado esquerdo:

ax mais by mais c igual a zero

É a única das três que também descreve retas verticais, e é a exigida pela fórmula da distância. Nela
o coeficiente angular vale menos a sobre b, quando b não é zero.

#### Paralelas e perpendiculares

Duas retas não verticais são **paralelas** exatamente quando têm o mesmo coeficiente angular.

Duas retas não verticais são **perpendiculares** exatamente quando o produto dos coeficientes
angulares vale menos 1. Na prática, o coeficiente da perpendicular é o inverso do outro com o sinal
trocado.

**Exemplo 2.** Reta perpendicular a y igual a 2x menos 1 que passa pelo ponto de coordenadas 4 e 3.
O coeficiente angular da reta dada é 2, logo o da perpendicular é menos 1 sobre 2. A equação é y
menos 3 igual a menos um meio vezes (x menos 4), que arrumada fica x mais 2y menos 10 igual a zero.
Conferindo o ponto: 4 mais 6 menos 10 dá zero.

#### Distância de um ponto a uma reta

Com a reta na forma geral, a distância de um ponto até ela é

módulo de (a vezes a abscissa do ponto mais b vezes a ordenada do ponto mais c), dividido pela raiz
de (a ao quadrado mais b ao quadrado)

O numerador é o que sobra quando você substitui o ponto na equação. Se der zero, o ponto está sobre
a reta, e a distância é zero, o que é coerente.

**Exemplo 3.** Distância do ponto de coordenadas 3 e 4 à reta 3x mais 4y menos 10 igual a zero.
Substituindo: 9 mais 16 menos 10 dá 15. O denominador é a raiz de 9 mais 16, que dá 5. A distância é
15 sobre 5, ou seja, 3.

Essa fórmula resolve muito mais do que parece: distância entre paralelas, raio de circunferência
tangente a uma reta, altura de triângulo. Vale decorá-la com cuidado.

#### Mediatriz

A mediatriz de um segmento é a reta perpendicular a ele que passa pelo seu ponto médio, e é
exatamente o conjunto dos pontos que ficam à mesma distância dos dois extremos. Para achá-la, faça
duas contas curtas: o ponto médio e o coeficiente angular perpendicular.

**Exemplo 4.** Mediatriz do segmento de extremos o ponto de coordenadas 2 e 1 e o ponto de
coordenadas 6 e 7.
O ponto médio é o ponto de coordenadas 4 e 4. O coeficiente angular do segmento é 6 sobre 4, que dá
três meios, então o coeficiente da mediatriz é menos dois terços. A equação é y menos 4 igual a menos
dois terços vezes (x menos 4), que arrumada fica 2x mais 3y menos 20 igual a zero.

#### Erros comuns

**Inverter a ordem na diferença do coeficiente angular.** Se você usa y2 menos y1 em cima, tem de
usar x2 menos x1 embaixo. Trocar só uma das ordens inverte o sinal da inclinação.

**Usar a forma reduzida na fórmula da distância.** A fórmula pede a forma geral, com tudo igualado a
zero. Aplicá-la em y igual a mx mais n dá resultado errado.

**Confundir coeficiente linear com raiz.** O coeficiente linear é onde a reta corta o eixo vertical.
A raiz é onde ela corta o eixo horizontal.

**Achar que perpendicular é o inverso do coeficiente.** É o inverso com o sinal trocado. Sem a troca
de sinal as retas não formam ângulo reto.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule o coeficiente angular da reta que passa pelo ponto de coordenadas 1 e 2 e pelo ponto de
   coordenadas 3 e 8.
2. Escreva a equação reduzida da reta de coeficiente angular 2 que passa pelo ponto de coordenadas 0
   e menos 5.
3. Determine o coeficiente angular e o coeficiente linear da reta de equação 3x mais 4y menos 12
   igual a zero.
4. Escreva a equação reduzida da reta de coeficiente angular menos 3 que passa pelo ponto de
   coordenadas 2 e 1.
5. Calcule o coeficiente angular da reta que passa pelo ponto de coordenadas menos 1 e 4 e pelo
   ponto de coordenadas 3 e menos 4.

**Bloco B. Consolidação**

6. Escreva a equação reduzida da reta que passa pelo ponto de coordenadas 1 e 2 e pelo ponto de
   coordenadas 4 e 11.
7. Escreva a equação reduzida da reta que passa pelo ponto de coordenadas 2 e 5 e é paralela à reta
   y igual a 4x menos 1.
8. Escreva a equação geral da reta que passa pelo ponto de coordenadas 2 e 5 e é perpendicular à
   reta y igual a 4x menos 1.
9. Determine o ponto de encontro das retas 2x mais y igual a 7 e x menos y igual a 2.
10. Determine os pontos em que a reta 3x menos 2y menos 12 igual a zero corta os eixos e calcule a
    área do triângulo que ela forma com os eixos.
11. Calcule a distância do ponto de coordenadas 1 e 5 à reta 2x menos y menos 3 igual a zero,
    deixando a resposta com o denominador racionalizado.
12. Verifique se o ponto de coordenadas 2 e 7, o ponto de coordenadas 5 e 16 e o ponto de
    coordenadas menos 1 e menos 2 pertencem a uma mesma reta e, em caso afirmativo, escreva a
    equação reduzida dessa reta.
13. Escreva a equação geral da reta que passa pelo ponto de coordenadas 3 e 0 e pelo ponto de
    coordenadas 0 e 5.
14. Determine k para que as retas kx mais 3y igual a 6 e 2x menos y igual a 4 sejam paralelas.

**Bloco C. Aprofundamento**

15. Determine a equação geral da mediatriz do segmento de extremos o ponto de coordenadas 1 e 2 e o
    ponto de coordenadas 5 e 8.
16. Calcule a distância entre as retas paralelas 3x mais 4y menos 10 igual a zero e 3x mais 4y mais
    15 igual a zero.
17. Um triângulo tem vértices no ponto de coordenadas 0 e 0, no ponto de coordenadas 6 e 0 e no
    ponto de coordenadas 2 e 4. Escreva a equação geral da reta que contém a mediana traçada a
    partir da origem.
18. Determine o ponto da reta y igual a 2x mais 1 que fica mais próximo da origem e calcule essa
    distância mínima.
19. Um triângulo tem vértices no ponto de coordenadas 1 e 1, no ponto de coordenadas 7 e 3 e no
    ponto de coordenadas 3 e 7. Determine a equação geral de duas alturas desse triângulo e o ponto
    em que elas se cruzam.

### Gabarito

1. 3.
2. y igual a 2x menos 5.
3. Coeficiente angular menos 3 sobre 4 e coeficiente linear 3.
4. y igual a menos 3x mais 7.
5. menos 2.
6. y igual a 3x menos 1.
7. y igual a 4x menos 3. Paralelas têm o mesmo coeficiente angular.
8. x mais 4y menos 22 igual a zero. O coeficiente angular da perpendicular é menos 1 sobre 4.
9. O ponto de coordenadas 3 e 1.
10. Corta os eixos no ponto de coordenadas 4 e 0 e no ponto de coordenadas 0 e menos 6. A área do
    triângulo é 12.
11. 6 raiz de 5 sobre 5.
12. Pertencem à mesma reta, de equação y igual a 3x mais 1.
13. 5x mais 3y menos 15 igual a zero.
14. k igual a menos 6.
15. 2x mais 3y menos 21 igual a zero. O ponto médio é o ponto de coordenadas 3 e 5 e o coeficiente
    angular da mediatriz é menos 2 sobre 3.
16. 5. Basta tomar um ponto de uma delas e aplicar a fórmula da distância à outra.
17. x menos 2y igual a zero. A mediana vai da origem ao ponto médio do lado oposto, que é o ponto de
    coordenadas 4 e 2.
18. O ponto de coordenadas menos 2 sobre 5 e 1 sobre 5, e a distância mínima vale raiz de 5 sobre 5.
    O ponto mais próximo é o pé da perpendicular baixada da origem.
19. A altura que sai do ponto de coordenadas 1 e 1 tem equação x menos y igual a zero, e a altura
    que sai do ponto de coordenadas 7 e 3 tem equação x mais 3y menos 16 igual a zero. Elas se
    cruzam no ponto de coordenadas 4 e 4, que é o ortocentro.

## EN

### Explanation

#### The slope

A non vertical line is completely determined by two pieces of information: its steepness and one
point it passes through. Steepness is measured by the slope, which answers a practical question:
when I move one unit to the right, how much do I go up?

slope equals the difference of the y coordinates divided by the difference of the x coordinates

The sign already tells the story: a positive slope is a line rising from left to right, a negative
slope is a line falling, a zero slope is a horizontal line. A vertical line has no slope, because the
difference of the x coordinates would be zero and you cannot divide by zero.

**Example 1.** Line through the point with coordinates 1 and 2 and the point with coordinates 4 and 8.
The slope is 8 minus 2 over 4 minus 1, that is, 6 over 3, which gives 2. Using the first point, the
equation is y minus 2 equals 2 times (x minus 1), which tidies up to y equals 2x. Checking: for x
equal to 4 the value is 8, as expected.

#### Three ways of writing the same line

**Point and slope form.** Knowing the slope m and a point with coordinates x0 and y0:

y minus y0 equals m times (x minus x0)

This is the working form, the one you write first almost every time.

**Slope intercept form.** Isolating y:

y equals mx plus n

Here m is the slope and n is the y intercept, the y coordinate of the point where the line crosses
the vertical axis.

**General form.** Everything moved to the left hand side:

ax plus by plus c equals zero

It is the only one of the three that also describes vertical lines, and it is the form required by
the distance formula. In it the slope equals minus a over b, whenever b is not zero.

#### Parallel and perpendicular lines

Two non vertical lines are **parallel** exactly when they have the same slope.

Two non vertical lines are **perpendicular** exactly when the product of their slopes equals minus 1.
In practice, the slope of the perpendicular is the reciprocal of the other one with the sign flipped.

**Example 2.** Line perpendicular to y equals 2x minus 1 passing through the point with coordinates 4
and 3.
The slope of the given line is 2, so the slope of the perpendicular is minus 1 over 2. The equation
is y minus 3 equals minus one half times (x minus 4), which tidies up to x plus 2y minus 10 equals
zero. Checking the point: 4 plus 6 minus 10 gives zero.

#### Distance from a point to a line

With the line in general form, the distance from a point to it is

absolute value of (a times the x coordinate of the point plus b times the y coordinate of the point
plus c), divided by the square root of (a squared plus b squared)

The numerator is what is left when you substitute the point into the equation. If it is zero, the
point lies on the line and the distance is zero, which is consistent.

**Example 3.** Distance from the point with coordinates 3 and 4 to the line 3x plus 4y minus 10
equals zero.
Substituting: 9 plus 16 minus 10 gives 15. The denominator is the square root of 9 plus 16, which
gives 5. The distance is 15 over 5, that is, 3.

This formula solves far more than it looks: distance between parallel lines, radius of a circle
tangent to a line, height of a triangle. It is worth learning carefully.

#### Perpendicular bisector

The perpendicular bisector of a segment is the line perpendicular to it through its midpoint, and it
is exactly the set of points that are the same distance from both endpoints. To find it, do two short
calculations: the midpoint and the perpendicular slope.

**Example 4.** Perpendicular bisector of the segment whose endpoints are the point with coordinates 2
and 1 and the point with coordinates 6 and 7.
The midpoint is the point with coordinates 4 and 4. The slope of the segment is 6 over 4, which gives
three halves, so the slope of the bisector is minus two thirds. The equation is y minus 4 equals
minus two thirds times (x minus 4), which tidies up to 2x plus 3y minus 20 equals zero.

#### Common mistakes

**Reversing the order in the difference for the slope.** If you use y2 minus y1 on top, you must use
x2 minus x1 underneath. Reversing only one of them flips the sign of the steepness.

**Using slope intercept form in the distance formula.** The formula asks for the general form, with
everything set equal to zero. Applying it to y equals mx plus n gives a wrong result.

**Confusing the y intercept with the root.** The y intercept is where the line crosses the vertical
axis. The root is where it crosses the horizontal axis.

**Thinking the perpendicular slope is just the reciprocal.** It is the reciprocal with the sign
flipped. Without flipping the sign the lines do not meet at a right angle.

### Exercises

**Block A. Fundamentals**

1. Find the slope of the line through the point with coordinates 1 and 2 and the point with
   coordinates 3 and 8.
2. Write the slope intercept equation of the line with slope 2 through the point with coordinates 0
   and minus 5.
3. Find the slope and the y intercept of the line with equation 3x plus 4y minus 12 equals zero.
4. Write the slope intercept equation of the line with slope minus 3 through the point with
   coordinates 2 and 1.
5. Find the slope of the line through the point with coordinates minus 1 and 4 and the point with
   coordinates 3 and minus 4.

**Block B. Building up**

6. Write the slope intercept equation of the line through the point with coordinates 1 and 2 and the
   point with coordinates 4 and 11.
7. Write the slope intercept equation of the line through the point with coordinates 2 and 5 that is
   parallel to the line y equals 4x minus 1.
8. Write the general equation of the line through the point with coordinates 2 and 5 that is
   perpendicular to the line y equals 4x minus 1.
9. Find the meeting point of the lines 2x plus y equals 7 and x minus y equals 2.
10. Find the points where the line 3x minus 2y minus 12 equals zero crosses the axes and compute the
    area of the triangle it forms with the axes.
11. Find the distance from the point with coordinates 1 and 5 to the line 2x minus y minus 3 equals
    zero, leaving the answer with a rationalised denominator.
12. Check whether the point with coordinates 2 and 7, the point with coordinates 5 and 16 and the
    point with coordinates minus 1 and minus 2 lie on one same line and, if so, write the slope
    intercept equation of that line.
13. Write the general equation of the line through the point with coordinates 3 and 0 and the point
    with coordinates 0 and 5.
14. Find k so that the lines kx plus 3y equals 6 and 2x minus y equals 4 are parallel.

**Block C. Going further**

15. Find the general equation of the perpendicular bisector of the segment whose endpoints are the
    point with coordinates 1 and 2 and the point with coordinates 5 and 8.
16. Find the distance between the parallel lines 3x plus 4y minus 10 equals zero and 3x plus 4y plus
    15 equals zero.
17. A triangle has vertices at the point with coordinates 0 and 0, the point with coordinates 6 and 0
    and the point with coordinates 2 and 4. Write the general equation of the line containing the
    median drawn from the origin.
18. Find the point of the line y equals 2x plus 1 that is closest to the origin and compute that
    minimum distance.
19. A triangle has vertices at the point with coordinates 1 and 1, the point with coordinates 7 and 3
    and the point with coordinates 3 and 7. Find the general equation of two of its altitudes and the
    point where they cross.

### Answer key

1. 3.
2. y equals 2x minus 5.
3. Slope minus 3 over 4 and y intercept 3.
4. y equals minus 3x plus 7.
5. minus 2.
6. y equals 3x minus 1.
7. y equals 4x minus 3. Parallel lines have the same slope.
8. x plus 4y minus 22 equals zero. The slope of the perpendicular is minus 1 over 4.
9. The point with coordinates 3 and 1.
10. It crosses the axes at the point with coordinates 4 and 0 and at the point with coordinates 0 and
    minus 6. The area of the triangle is 12.
11. 6 square roots of 5 over 5.
12. They lie on one same line, with equation y equals 3x plus 1.
13. 5x plus 3y minus 15 equals zero.
14. k equals minus 6.
15. 2x plus 3y minus 21 equals zero. The midpoint is the point with coordinates 3 and 5 and the slope
    of the bisector is minus 2 over 3.
16. 5. It is enough to take a point on one of them and apply the distance formula to the other.
17. x minus 2y equals zero. The median runs from the origin to the midpoint of the opposite side,
    which is the point with coordinates 4 and 2.
18. The point with coordinates minus 2 over 5 and 1 over 5, and the minimum distance is the square
    root of 5 over 5. The closest point is the foot of the perpendicular dropped from the origin.
19. The altitude from the point with coordinates 1 and 1 has equation x minus y equals zero, and the
    altitude from the point with coordinates 7 and 3 has equation x plus 3y minus 16 equals zero.
    They cross at the point with coordinates 4 and 4, which is the orthocentre.

## VERIFICACAO

```python
X1: Rational(8-2, 4-1) == 2 and 2*1 == 2 and 2*4 == 8
X2: Rational(2,1)*Rational(-1,2) == -1 and 4 + 2*3 - 10 == 0
X3: Rational(Abs(3*3 + 4*4 - 10), sqrt(3**2+4**2)) == 3
X4: Rational(2+6,2) == 4 and Rational(1+7,2) == 4 and Rational(7-1,6-2) == Rational(3,2) and Rational(3,2)*Rational(-2,3) == -1 and 2*4 + 3*4 - 20 == 0
E1: Rational(8-2, 3-1) == 3
E2: 2*0 - 5 == -5
E3: simplify(solve(Eq(3*x + 4*y - 12, 0), y)[0] - (-Rational(3,4)*x + 3)) == 0
E4: -3*2 + 7 == 1
E5: Rational(-4-4, 3-(-1)) == -2
E6: Rational(11-2, 4-1) == 3 and 3*1 - 1 == 2 and 3*4 - 1 == 11
E7: 4*2 - 3 == 5
E8: Rational(1,4)*4 == 1 and 2 + 4*5 - 22 == 0
E9: solve([Eq(2*x + y, 7), Eq(x - y, 2)], [x, y]) == {x: 3, y: 1}
E10: 3*4 - 2*0 - 12 == 0 and 3*0 - 2*(-6) - 12 == 0 and Rational(4*6, 2) == 12
E11: simplify(Abs(2*1 - 5 - 3)/sqrt(2**2 + (-1)**2)) == 6*sqrt(5)/5
E12: 3*2 + 1 == 7 and 3*5 + 1 == 16 and 3*(-1) + 1 == -2
E13: 5*3 + 3*0 - 15 == 0 and 5*0 + 3*5 - 15 == 0
E14: solve(Eq(-k/3, 2), k) == [-6]
E15: Rational(1+5,2) == 3 and Rational(2+8,2) == 5 and 2*3 + 3*5 - 21 == 0 and Rational(8-2,5-1)*Rational(-2,3) == -1
E16: simplify(Abs(3*0 + 4*Rational(10,4) + 15)/sqrt(3**2+4**2)) == 5
E17: Rational(6+2,2) == 4 and Rational(0+4,2) == 2 and 4 - 2*2 == 0 and 0 - 2*0 == 0
E18: solve([Eq(y, 2*x + 1), Eq(y, -x/2)], [x, y]) == {x: Rational(-2,5), y: Rational(1,5)} and simplify(sqrt(Rational(-2,5)**2 + Rational(1,5)**2)) == sqrt(5)/5
E19: Rational(7-3, 3-7) == -1 and 1 - 1 == 0 and Rational(7-1, 3-1)*Rational(-1,3) == -1 and 7 + 3*3 - 16 == 0 and solve([Eq(x - y, 0), Eq(x + 3*y - 16, 0)], [x, y]) == {x: 4, y: 4}
```
