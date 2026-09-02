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

m = (y_{2} - y_{1}) / (x_{2} - x_{1})

onde m é o coeficiente angular e (x_{1}, y_{1}) e (x_{2}, y_{2}) são dois pontos da reta.

O sinal já conta a história: coeficiente positivo é reta que sobe da esquerda para a direita,
coeficiente negativo é reta que desce, coeficiente zero é reta horizontal. Reta vertical não tem
coeficiente angular, porque a diferença das abscissas seria zero e não se divide por zero.

**Exemplo 1.** Reta que passa por (1, 2) e por (4, 8).
O coeficiente angular é m = (8 - 2) / (4 - 1) = 6/3 = 2. Usando o primeiro ponto, a equação é
y - 2 = 2 · (x - 1), que arrumada fica y = 2x. Conferindo: para x = 4 o valor é 8, como se esperava.

#### As três formas de escrever a mesma reta

**Forma ponto e coeficiente.** Sabendo o coeficiente angular m e um ponto (x_{0}, y_{0}):

y - y_{0} = m · (x - x_{0})

É a forma de trabalho, a que se escreve primeiro quase sempre.

**Forma reduzida.** Isolando y:

y = mx + n

Aqui m é o coeficiente angular e n é o coeficiente linear, que é a ordenada do ponto em que a reta
corta o eixo vertical.

**Forma geral.** Tudo passado para o lado esquerdo:

ax + by + c = 0

É a única das três que também descreve retas verticais, e é a exigida pela fórmula da distância. Nela
o coeficiente angular vale m = -a/b, quando b ≠ 0.

#### Paralelas e perpendiculares

Duas retas não verticais são **paralelas** exatamente quando têm o mesmo coeficiente angular.

Duas retas não verticais são **perpendiculares** exatamente quando o produto dos coeficientes
angulares vale -1:

m_{1} · m_{2} = -1

Na prática, o coeficiente da perpendicular é o inverso do outro com o sinal trocado.

**Exemplo 2.** Reta perpendicular a y = 2x - 1 que passa por (4, 3).
O coeficiente angular da reta dada é 2, logo o da perpendicular é -1/2. A equação é
y - 3 = (-1/2) · (x - 4), que arrumada fica x + 2y - 10 = 0. Conferindo o ponto: 4 + 6 - 10 = 0.

#### Distância de um ponto a uma reta

Com a reta na forma geral, a distância de um ponto (x_{0}, y_{0}) até ela é

d = |a · x_{0} + b · y_{0} + c| / √(a^{2} + b^{2})

O numerador é o que sobra quando você substitui o ponto na equação. Se der zero, o ponto está sobre
a reta, e a distância é zero, o que é coerente.

**Exemplo 3.** Distância do ponto (3, 4) à reta 3x + 4y - 10 = 0.
Substituindo: 9 + 16 - 10 = 15. O denominador é √(9 + 16) = 5. A distância é d = 15/5 = 3.

Essa fórmula resolve muito mais do que parece: distância entre paralelas, raio de circunferência
tangente a uma reta, altura de triângulo. Vale decorá-la com cuidado.

#### Mediatriz

A mediatriz de um segmento é a reta perpendicular a ele que passa pelo seu ponto médio, e é
exatamente o conjunto dos pontos que ficam à mesma distância dos dois extremos. Para achá-la, faça
duas contas curtas: o ponto médio e o coeficiente angular perpendicular.

**Exemplo 4.** Mediatriz do segmento de extremos (2, 1) e (6, 7).
O ponto médio é (4, 4). O coeficiente angular do segmento é 6/4 = 3/2, então o coeficiente da
mediatriz é -2/3. A equação é y - 4 = (-2/3) · (x - 4), que arrumada fica 2x + 3y - 20 = 0.

#### Erros comuns

**Inverter a ordem na diferença do coeficiente angular.** Se você usa y_{2} - y_{1} em cima, tem de
usar x_{2} - x_{1} embaixo. Trocar só uma das ordens inverte o sinal da inclinação.

**Usar a forma reduzida na fórmula da distância.** A fórmula pede a forma geral, com tudo igualado a
zero. Aplicá-la em y = mx + n dá resultado errado.

**Confundir coeficiente linear com raiz.** O coeficiente linear é onde a reta corta o eixo vertical.
A raiz é onde ela corta o eixo horizontal.

**Achar que perpendicular é o inverso do coeficiente.** É o inverso com o sinal trocado. Sem a troca
de sinal as retas não formam ângulo reto.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule o coeficiente angular da reta que passa por (1, 2) e por (3, 8).
2. Escreva a equação reduzida da reta de coeficiente angular 2 que passa por (0, -5).
3. Determine o coeficiente angular e o coeficiente linear da reta de equação 3x + 4y - 12 = 0.
4. Escreva a equação reduzida da reta de coeficiente angular -3 que passa por (2, 1).
5. Calcule o coeficiente angular da reta que passa por (-1, 4) e por (3, -4).

**Bloco B. Consolidação**

6. Escreva a equação reduzida da reta que passa por (1, 2) e por (4, 11).
7. Escreva a equação reduzida da reta que passa por (2, 5) e é paralela à reta y = 4x - 1.
8. Escreva a equação geral da reta que passa por (2, 5) e é perpendicular à reta y = 4x - 1.
9. Determine o ponto de encontro das retas 2x + y = 7 e x - y = 2.
10. Determine os pontos em que a reta 3x - 2y - 12 = 0 corta os eixos e calcule a área do triângulo
    que ela forma com os eixos.
11. Calcule a distância do ponto (1, 5) à reta 2x - y - 3 = 0, deixando a resposta com o denominador
    racionalizado.
12. Verifique se (2, 7), (5, 16) e (-1, -2) pertencem a uma mesma reta e, em caso afirmativo,
    escreva a equação reduzida dessa reta.
13. Escreva a equação geral da reta que passa por (3, 0) e por (0, 5).
14. Determine k para que as retas kx + 3y = 6 e 2x - y = 4 sejam paralelas.

**Bloco C. Aprofundamento**

15. Determine a equação geral da mediatriz do segmento de extremos (1, 2) e (5, 8).
16. Calcule a distância entre as retas paralelas 3x + 4y - 10 = 0 e 3x + 4y + 15 = 0.
17. Um triângulo tem vértices em (0, 0), (6, 0) e (2, 4). Escreva a equação geral da reta que contém
    a mediana traçada a partir da origem.
18. Determine o ponto da reta y = 2x + 1 que fica mais próximo da origem e calcule essa distância
    mínima.
19. Um triângulo tem vértices em (1, 1), (7, 3) e (3, 7). Determine a equação geral de duas alturas
    desse triângulo e o ponto em que elas se cruzam.

### Gabarito

1. 3.
2. y = 2x - 5.
3. Coeficiente angular -3/4 e coeficiente linear 3.
4. y = -3x + 7.
5. -2.
6. y = 3x - 1.
7. y = 4x - 3. Paralelas têm o mesmo coeficiente angular.
8. x + 4y - 22 = 0. O coeficiente angular da perpendicular é -1/4.
9. O ponto (3, 1).
10. Corta os eixos em (4, 0) e em (0, -6). A área do triângulo é 12.
11. 6√5/5.
12. Pertencem à mesma reta, de equação y = 3x + 1.
13. 5x + 3y - 15 = 0.
14. k = -6.
15. 2x + 3y - 21 = 0. O ponto médio é (3, 5) e o coeficiente angular da mediatriz é -2/3.
16. 5. Basta tomar um ponto de uma delas e aplicar a fórmula da distância à outra.
17. x - 2y = 0. A mediana vai da origem ao ponto médio do lado oposto, que é (4, 2).
18. O ponto (-2/5, 1/5), e a distância mínima vale √5/5. O ponto mais próximo é o pé da
    perpendicular baixada da origem.
19. A altura que sai de (1, 1) tem equação x - y = 0, e a altura que sai de (7, 3) tem equação
    x + 3y - 16 = 0. Elas se cruzam em (4, 4), que é o ortocentro.

## EN

### Explanation

#### The slope

A non vertical line is completely determined by two pieces of information: its steepness and one
point it passes through. Steepness is measured by the slope, which answers a practical question:
when I move one unit to the right, how much do I go up?

m = (y_{2} - y_{1}) / (x_{2} - x_{1})

where m is the slope and (x_{1}, y_{1}) and (x_{2}, y_{2}) are two points on the line.

The sign already tells the story: a positive slope is a line rising from left to right, a negative
slope is a line falling, a zero slope is a horizontal line. A vertical line has no slope, because the
difference of the x coordinates would be zero and you cannot divide by zero.

**Example 1.** Line through (1, 2) and (4, 8).
The slope is m = (8 - 2) / (4 - 1) = 6/3 = 2. Using the first point, the equation is
y - 2 = 2 · (x - 1), which tidies up to y = 2x. Checking: for x = 4 the value is 8, as expected.

#### Three ways of writing the same line

**Point and slope form.** Knowing the slope m and a point (x_{0}, y_{0}):

y - y_{0} = m · (x - x_{0})

This is the working form, the one you write first almost every time.

**Slope intercept form.** Isolating y:

y = mx + n

Here m is the slope and n is the y intercept, the y coordinate of the point where the line crosses
the vertical axis.

**General form.** Everything moved to the left hand side:

ax + by + c = 0

It is the only one of the three that also describes vertical lines, and it is the form required by
the distance formula. In it the slope is m = -a/b, whenever b ≠ 0.

#### Parallel and perpendicular lines

Two non vertical lines are **parallel** exactly when they have the same slope.

Two non vertical lines are **perpendicular** exactly when the product of their slopes equals -1:

m_{1} · m_{2} = -1

In practice, the slope of the perpendicular is the reciprocal of the other one with the sign flipped.

**Example 2.** Line perpendicular to y = 2x - 1 passing through (4, 3).
The slope of the given line is 2, so the slope of the perpendicular is -1/2. The equation is
y - 3 = (-1/2) · (x - 4), which tidies up to x + 2y - 10 = 0. Checking the point: 4 + 6 - 10 = 0.

#### Distance from a point to a line

With the line in general form, the distance from a point (x_{0}, y_{0}) to it is

d = |a · x_{0} + b · y_{0} + c| / √(a^{2} + b^{2})

The numerator is what is left when you substitute the point into the equation. If it is zero, the
point lies on the line and the distance is zero, which is consistent.

**Example 3.** Distance from the point (3, 4) to the line 3x + 4y - 10 = 0.
Substituting: 9 + 16 - 10 = 15. The denominator is √(9 + 16) = 5. The distance is d = 15/5 = 3.

This formula solves far more than it looks: distance between parallel lines, radius of a circle
tangent to a line, height of a triangle. It is worth learning carefully.

#### Perpendicular bisector

The perpendicular bisector of a segment is the line perpendicular to it through its midpoint, and it
is exactly the set of points that are the same distance from both endpoints. To find it, do two short
calculations: the midpoint and the perpendicular slope.

**Example 4.** Perpendicular bisector of the segment whose endpoints are (2, 1) and (6, 7).
The midpoint is (4, 4). The slope of the segment is 6/4 = 3/2, so the slope of the bisector is -2/3.
The equation is y - 4 = (-2/3) · (x - 4), which tidies up to 2x + 3y - 20 = 0.

#### Common mistakes

**Reversing the order in the difference for the slope.** If you use y_{2} - y_{1} on top, you must
use x_{2} - x_{1} underneath. Reversing only one of them flips the sign of the steepness.

**Using slope intercept form in the distance formula.** The formula asks for the general form, with
everything set equal to zero. Applying it to y = mx + n gives a wrong result.

**Confusing the y intercept with the root.** The y intercept is where the line crosses the vertical
axis. The root is where it crosses the horizontal axis.

**Thinking the perpendicular slope is just the reciprocal.** It is the reciprocal with the sign
flipped. Without flipping the sign the lines do not meet at a right angle.

### Exercises

**Block A. Fundamentals**

1. Find the slope of the line through (1, 2) and (3, 8).
2. Write the slope intercept equation of the line with slope 2 through (0, -5).
3. Find the slope and the y intercept of the line with equation 3x + 4y - 12 = 0.
4. Write the slope intercept equation of the line with slope -3 through (2, 1).
5. Find the slope of the line through (-1, 4) and (3, -4).

**Block B. Building up**

6. Write the slope intercept equation of the line through (1, 2) and (4, 11).
7. Write the slope intercept equation of the line through (2, 5) that is parallel to the line
   y = 4x - 1.
8. Write the general equation of the line through (2, 5) that is perpendicular to the line
   y = 4x - 1.
9. Find the meeting point of the lines 2x + y = 7 and x - y = 2.
10. Find the points where the line 3x - 2y - 12 = 0 crosses the axes and compute the area of the
    triangle it forms with the axes.
11. Find the distance from the point (1, 5) to the line 2x - y - 3 = 0, leaving the answer with a
    rationalised denominator.
12. Check whether (2, 7), (5, 16) and (-1, -2) lie on one same line and, if so, write the slope
    intercept equation of that line.
13. Write the general equation of the line through (3, 0) and (0, 5).
14. Find k so that the lines kx + 3y = 6 and 2x - y = 4 are parallel.

**Block C. Going further**

15. Find the general equation of the perpendicular bisector of the segment whose endpoints are
    (1, 2) and (5, 8).
16. Find the distance between the parallel lines 3x + 4y - 10 = 0 and 3x + 4y + 15 = 0.
17. A triangle has vertices at (0, 0), (6, 0) and (2, 4). Write the general equation of the line
    containing the median drawn from the origin.
18. Find the point of the line y = 2x + 1 that is closest to the origin and compute that minimum
    distance.
19. A triangle has vertices at (1, 1), (7, 3) and (3, 7). Find the general equation of two of its
    altitudes and the point where they cross.

### Answer key

1. 3.
2. y = 2x - 5.
3. Slope -3/4 and y intercept 3.
4. y = -3x + 7.
5. -2.
6. y = 3x - 1.
7. y = 4x - 3. Parallel lines have the same slope.
8. x + 4y - 22 = 0. The slope of the perpendicular is -1/4.
9. The point (3, 1).
10. It crosses the axes at (4, 0) and at (0, -6). The area of the triangle is 12.
11. 6√5/5.
12. They lie on one same line, with equation y = 3x + 1.
13. 5x + 3y - 15 = 0.
14. k = -6.
15. 2x + 3y - 21 = 0. The midpoint is (3, 5) and the slope of the bisector is -2/3.
16. 5. It is enough to take a point on one of them and apply the distance formula to the other.
17. x - 2y = 0. The median runs from the origin to the midpoint of the opposite side, which is
    (4, 2).
18. The point (-2/5, 1/5), and the minimum distance is √5/5. The closest point is the foot of the
    perpendicular dropped from the origin.
19. The altitude from (1, 1) has equation x - y = 0, and the altitude from (7, 3) has equation
    x + 3y - 16 = 0. They cross at (4, 4), which is the orthocentre.

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
