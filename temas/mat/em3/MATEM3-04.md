---
id: MATEM3-04
serie: em3
unidade: geometria
titulo_pt: Cônicas
titulo_en: Conic sections
resumo_pt: Reconhecer elipse, hipérbole e parábola pela definição por foco, escrever suas equações reduzidas e identificar a cônica escondida numa equação geral completando quadrados.
resumo_en: Recognising the ellipse, the hyperbola and the parabola from their focal definitions, writing their standard equations and identifying the conic hidden in a general equation by completing the square.
prerequisitos: [MATEM3-03]
duracao_min: 90
dificuldade: 5
---

## PT

### Explicação

#### Uma família com três membros

Elipse, hipérbole e parábola aparecem quando se corta um cone por um plano em inclinações
diferentes, e daí vem o nome cônicas. Mas o que interessa para resolver problema é a definição por
distância, porque é dela que sai a equação. As três se definem pela mesma ideia, com uma pequena
variação em cada caso.

- **Elipse:** conjunto dos pontos cuja **soma** das distâncias a dois pontos fixos é constante.
- **Hipérbole:** conjunto dos pontos cuja **diferença** das distâncias a dois pontos fixos, em
  módulo, é constante.
- **Parábola:** conjunto dos pontos que ficam à mesma distância de um ponto fixo e de uma reta fixa.

Os pontos fixos são os focos, e a reta fixa da parábola é a diretriz.

#### A elipse

Com centro na origem e focos sobre o eixo horizontal, a equação reduzida é

x^{2}/a^{2} + y^{2}/b^{2} = 1

Aqui a é o semieixo maior, b é o semieixo menor e c é a distância do centro a cada foco. A relação
entre eles é a relação fundamental da elipse:

a^{2} = b^{2} + c^{2}

O maior dos dois denominadores está sempre embaixo da variável cujo eixo contém os focos. Se o
denominador maior estiver embaixo de y^{2}, a elipse é vertical.

A excentricidade é dada por e = c/a, e mede o quanto a elipse é achatada. Perto de zero ela é quase
uma circunferência, e perto de 1 ela é bem alongada.

**Exemplo 1.** Analisar a elipse x^{2}/25 + y^{2}/9 = 1.
Como 25 é maior, o eixo maior é horizontal, com a = 5 e b = 3. Então c^{2} = 25 - 9 = 16, e c = 4.
Os focos são (4, 0) e (-4, 0). A excentricidade é e = 4/5.

#### A hipérbole

Com centro na origem e focos sobre o eixo horizontal:

x^{2}/a^{2} - y^{2}/b^{2} = 1

Repare no sinal de menos, que é o que distingue a hipérbole da elipse à primeira vista. Aqui a
relação fundamental muda de lugar:

c^{2} = a^{2} + b^{2}

Agora c é o maior dos três, o que faz sentido, porque os focos ficam além dos vértices. Não importa
qual denominador é maior: quem manda é o sinal, e o termo positivo indica o eixo que contém os
focos.

As assíntotas são as retas que a hipérbole se aproxima sem tocar, e valem y = ± (b/a) · x.

**Exemplo 2.** Analisar a hipérbole x^{2}/9 - y^{2}/16 = 1.
Temos a = 3 e b = 4, então c^{2} = 9 + 16 = 25, e c = 5. Os focos são (5, 0) e (-5, 0). As
assíntotas são y = 4x/3 e y = -4x/3, e a excentricidade é e = 5/3.

#### A parábola

Com vértice na origem e eixo de simetria horizontal:

y^{2} = 4px

onde p é a distância do vértice ao foco. O foco fica no ponto (p, 0), e a diretriz é a reta
x = -p. Se o eixo de simetria for vertical, a equação vira x^{2} = 4py, com foco no ponto (0, p).

Quando o coeficiente é negativo, a parábola abre para o lado oposto, e o foco fica do lado negativo.

**Exemplo 3.** Analisar a parábola y^{2} = 12x.
Como 4p = 12, p = 3. O foco é (3, 0) e a diretriz é a reta x = -3. A parábola abre para a direita.

Uma consequência prática da definição: a distância de um ponto da parábola ao foco é igual à
distância dele à diretriz. Para a parábola y^{2} = 12x, essa distância vale x + 3, sendo x a
abscissa do ponto.

#### Identificar a cônica completando quadrados

Quando o centro não está na origem, a equação aparece com termos lineares, e o trabalho é completar
quadrados em x e em y até chegar à forma reduzida. O sinal entre os dois quadrados é o que decide:
mesmo sinal indica elipse, sinais opostos indicam hipérbole, e a falta de um dos quadrados indica
parábola.

**Exemplo 4.** Identificar 4x^{2} + 9y^{2} - 8x + 36y + 4 = 0.
Agrupando: 4 · (x^{2} - 2x) + 9 · (y^{2} + 4y) + 4 = 0. Completando: 4 · (x - 1)^{2} - 4 +
9 · (y + 2)^{2} - 36 + 4 = 0, ou seja, 4 · (x - 1)^{2} + 9 · (y + 2)^{2} = 36. Dividindo por 36:

(x - 1)^{2}/9 + (y + 2)^{2}/4 = 1

É uma elipse de centro (1, -2), com a = 3, b = 2 e c = √5.

#### Erros comuns

**Usar a relação da elipse na hipérbole.** Na elipse o maior é a, e na hipérbole o maior é c.
Trocar as duas relações é o erro que mais aparece.

**Supor que o denominador maior é sempre o de x.** Na elipse, o eixo maior fica onde está o
denominador maior, e ele pode estar embaixo de y.

**Confundir p com 4p na parábola.** Se a equação é y^{2} = 8x, então 4p = 8 e p = 2. O foco fica a
2 do vértice, não a 8.

**Esquecer que o fator multiplica o que foi somado.** Ao completar quadrados em 4 · (x^{2} - 2x),
somar 1 dentro do parêntese equivale a somar 4 fora dele.

### Exercícios

**Bloco A. Fundamentos**

1. Na elipse x^{2}/25 + y^{2}/16 = 1, determine a, b e c.
2. Na hipérbole x^{2}/16 - y^{2}/9 = 1, determine a, b e c.
3. Determine o foco e a diretriz da parábola y^{2} = 8x.
4. Calcule a excentricidade da elipse x^{2}/100 + y^{2}/64 = 1.
5. Na elipse x^{2}/4 + y^{2}/9 = 1, diga sobre qual eixo está o eixo maior e determine a, b e c.

**Bloco B. Consolidação**

6. Escreva a equação reduzida da elipse de centro na origem, com focos (3, 0) e (-3, 0), e semieixo
   maior igual a 5.
7. Escreva a equação reduzida da elipse de centro na origem cujo eixo maior está sobre o eixo
   horizontal e mede 10, e cujo eixo menor mede 6.
8. Determine as assíntotas e a excentricidade da hipérbole x^{2}/9 - y^{2}/16 = 1.
9. Escreva a equação reduzida da hipérbole de centro na origem com focos (5, 0) e (-5, 0), e
   vértices (4, 0) e (-4, 0).
10. Escreva a equação reduzida da parábola de foco (0, 4) e diretriz a reta y = -4.
11. Determine o foco e a diretriz da parábola y^{2} = -20x.
12. Determine os valores de y para os quais o ponto (4, y) pertence à elipse x^{2}/25 + y^{2}/9 = 1.
13. Identifique a cônica de equação 4x^{2} + 9y^{2} = 36 e determine a, b e c.
14. Identifique a cônica de equação 16x^{2} - 25y^{2} = 400 e determine a, b e c.

**Bloco C. Aprofundamento**

15. Identifique a cônica de equação 9x^{2} + 4y^{2} - 36x + 8y + 4 = 0, completando quadrados, e
    determine o centro, a, b e c.
16. Identifique a cônica de equação x^{2} - 4y^{2} - 2x - 16y - 19 = 0, completando quadrados, e
    determine o centro, a, b e c.
17. Identifique a cônica de equação y^{2} - 8x - 6y + 25 = 0, completando quadrados, e determine o
    vértice, o foco e a diretriz.
18. Um ponto pertence à elipse x^{2}/25 + y^{2}/16 = 1 e dista 7 de um dos focos. Determine a
    distância desse ponto ao outro foco, justificando pela definição da elipse.
19. Um arco tem a forma de metade de uma elipse, apoiado no chão numa abertura de 20 metros e com
    altura de 6 metros no ponto central. Calcule a altura do arco num ponto do chão que fica a 8
    metros do centro da abertura.
20. Um ponto da parábola y^{2} = 12x dista 8 do foco. Determine as coordenadas desse ponto, usando a
    igualdade entre a distância ao foco e a distância à diretriz.

### Gabarito

1. a = 5, b = 4 e c = 3.
2. a = 4, b = 3 e c = 5.
3. Foco (2, 0), e diretriz a reta x = -2.
4. e = 3/5. Aqui c = 6 e a = 10.
5. O eixo maior está sobre o eixo vertical. a = 3, b = 2 e c = √5.
6. x^{2}/25 + y^{2}/16 = 1.
7. x^{2}/25 + y^{2}/9 = 1.
8. Assíntotas y = 4x/3 e y = -4x/3. Excentricidade e = 5/3.
9. x^{2}/16 - y^{2}/9 = 1.
10. x^{2} = 16y.
11. Foco (-5, 0), e diretriz a reta x = 5.
12. y = 9/5 ou y = -9/5.
13. Elipse de equação x^{2}/9 + y^{2}/4 = 1, com a = 3, b = 2 e c = √5.
14. Hipérbole de equação x^{2}/25 - y^{2}/16 = 1, com a = 5, b = 4 e c = √41.
15. Elipse de equação (x - 2)^{2}/4 + (y + 1)^{2}/9 = 1. Centro (2, -1), com a = 3, b = 2 e
    c = √5. O eixo maior é vertical.
16. Hipérbole de equação (x - 1)^{2}/4 - (y + 2)^{2} = 1. Centro (1, -2), com a = 2, b = 1 e
    c = √5.
17. Parábola de equação (y - 3)^{2} = 8 · (x - 2). Vértice (2, 3), foco (4, 3), e diretriz a reta
    x = 0.
18. 3. A soma das distâncias aos dois focos é constante e vale o eixo maior, ou seja, 10. Como uma
    delas vale 7, a outra vale 3.
19. 3,6 metros. Com a elipse x^{2}/100 + y^{2}/36 = 1, para x = 8 o valor de y^{2} é 1296/100.
20. Os pontos (5, 2√15) e (5, -2√15). A distância ao foco vale x + 3, então x = 5 e y^{2} = 60.

## EN

### Explanation

#### A family with three members

The ellipse, the hyperbola and the parabola appear when a cone is cut by a plane at different
slants, and that is where the name conic sections comes from. But what matters for solving problems
is the definition by distance, because the equation comes out of it. All three are defined by the
same idea, with a small variation in each case.

- **Ellipse:** the set of points for which the **sum** of the distances to two fixed points is
  constant.
- **Hyperbola:** the set of points for which the **difference** of the distances to two fixed points,
  in absolute value, is constant.
- **Parabola:** the set of points that are the same distance from a fixed point and from a fixed
  line.

The fixed points are the foci, and the fixed line of the parabola is the directrix.

#### The ellipse

With centre at the origin and foci on the horizontal axis, the standard equation is

x^{2}/a^{2} + y^{2}/b^{2} = 1

Here a is the semi major axis, b is the semi minor axis and c is the distance from the centre to each
focus. The relation between them is the fundamental relation of the ellipse:

a^{2} = b^{2} + c^{2}

The larger of the two denominators always sits under the variable whose axis contains the foci. If
the larger denominator sits under y^{2}, the ellipse is vertical.

The eccentricity is given by e = c/a, and it measures how flattened the ellipse is. Near zero it is
almost a circle, and near 1 it is very elongated.

**Example 1.** Analyse the ellipse x^{2}/25 + y^{2}/9 = 1.
Since 25 is larger, the major axis is horizontal, with a = 5 and b = 3. So c^{2} = 25 - 9 = 16, and
c = 4. The foci are (4, 0) and (-4, 0). The eccentricity is e = 4/5.

#### The hyperbola

With centre at the origin and foci on the horizontal axis:

x^{2}/a^{2} - y^{2}/b^{2} = 1

Notice the minus sign, which is what tells a hyperbola from an ellipse at first glance. Here the
fundamental relation changes places:

c^{2} = a^{2} + b^{2}

Now c is the largest of the three, which makes sense, because the foci lie beyond the vertices. It
does not matter which denominator is larger: the sign is in charge, and the positive term marks the
axis that contains the foci.

The asymptotes are the lines the hyperbola approaches without touching, and they are y = ± (b/a) · x.

**Example 2.** Analyse the hyperbola x^{2}/9 - y^{2}/16 = 1.
We have a = 3 and b = 4, so c^{2} = 9 + 16 = 25, and c = 5. The foci are (5, 0) and (-5, 0). The
asymptotes are y = 4x/3 and y = -4x/3, and the eccentricity is e = 5/3.

#### The parabola

With vertex at the origin and horizontal axis of symmetry:

y^{2} = 4px

where p is the distance from the vertex to the focus. The focus sits at the point (p, 0), and the
directrix is the line x = -p. If the axis of symmetry is vertical, the equation becomes x^{2} = 4py,
with the focus at the point (0, p).

When the coefficient is negative, the parabola opens the other way and the focus sits on the negative
side.

**Example 3.** Analyse the parabola y^{2} = 12x.
Since 4p = 12, p = 3. The focus is (3, 0) and the directrix is the line x = -3. The parabola opens
to the right.

One practical consequence of the definition: the distance from a point of the parabola to the focus
equals its distance to the directrix. For the parabola y^{2} = 12x, that distance is x + 3, where x
is the abscissa of the point.

#### Identifying the conic by completing the square

When the centre is not at the origin, the equation shows up with linear terms, and the work is to
complete the square in x and in y until the standard form appears. The sign between the two squares
decides: the same sign means an ellipse, opposite signs mean a hyperbola, and a missing square means
a parabola.

**Example 4.** Identify 4x^{2} + 9y^{2} - 8x + 36y + 4 = 0.
Grouping: 4 · (x^{2} - 2x) + 9 · (y^{2} + 4y) + 4 = 0. Completing: 4 · (x - 1)^{2} - 4 +
9 · (y + 2)^{2} - 36 + 4 = 0, that is, 4 · (x - 1)^{2} + 9 · (y + 2)^{2} = 36. Dividing by 36:

(x - 1)^{2}/9 + (y + 2)^{2}/4 = 1

It is an ellipse with centre (1, -2), with a = 3, b = 2 and c = √5.

#### Common mistakes

**Using the ellipse relation on the hyperbola.** In the ellipse the largest is a, and in the
hyperbola the largest is c. Swapping the two relations is the most common error.

**Assuming the larger denominator always belongs to x.** In the ellipse, the major axis lies where
the larger denominator is, and it may be under y.

**Confusing p with 4p in the parabola.** If the equation is y^{2} = 8x, then 4p = 8 and p = 2. The
focus is 2 away from the vertex, not 8.

**Forgetting that the factor multiplies what was added.** When completing the square in
4 · (x^{2} - 2x), adding 1 inside the bracket amounts to adding 4 outside it.

### Exercises

**Block A. Fundamentals**

1. In the ellipse x^{2}/25 + y^{2}/16 = 1, find a, b and c.
2. In the hyperbola x^{2}/16 - y^{2}/9 = 1, find a, b and c.
3. Find the focus and the directrix of the parabola y^{2} = 8x.
4. Find the eccentricity of the ellipse x^{2}/100 + y^{2}/64 = 1.
5. In the ellipse x^{2}/4 + y^{2}/9 = 1, say which axis carries the major axis and find a, b and c.

**Block B. Building up**

6. Write the standard equation of the ellipse with centre at the origin, with foci (3, 0) and
   (-3, 0), and semi major axis equal to 5.
7. Write the standard equation of the ellipse with centre at the origin whose major axis lies on the
   horizontal axis and measures 10, and whose minor axis measures 6.
8. Find the asymptotes and the eccentricity of the hyperbola x^{2}/9 - y^{2}/16 = 1.
9. Write the standard equation of the hyperbola with centre at the origin with foci (5, 0) and
   (-5, 0), and vertices (4, 0) and (-4, 0).
10. Write the standard equation of the parabola with focus (0, 4) and directrix the line y = -4.
11. Find the focus and the directrix of the parabola y^{2} = -20x.
12. Find the values of y for which the point (4, y) lies on the ellipse x^{2}/25 + y^{2}/9 = 1.
13. Identify the conic with equation 4x^{2} + 9y^{2} = 36 and find a, b and c.
14. Identify the conic with equation 16x^{2} - 25y^{2} = 400 and find a, b and c.

**Block C. Going further**

15. Identify the conic with equation 9x^{2} + 4y^{2} - 36x + 8y + 4 = 0 by completing the square,
    and find the centre, a, b and c.
16. Identify the conic with equation x^{2} - 4y^{2} - 2x - 16y - 19 = 0 by completing the square,
    and find the centre, a, b and c.
17. Identify the conic with equation y^{2} - 8x - 6y + 25 = 0 by completing the square, and find the
    vertex, the focus and the directrix.
18. A point lies on the ellipse x^{2}/25 + y^{2}/16 = 1 and is at distance 7 from one of the foci.
    Find the distance from that point to the other focus, justifying your answer by the definition
    of the ellipse.
19. An arch has the shape of half an ellipse, resting on the ground across an opening of 20 metres
    and reaching a height of 6 metres at the central point. Find the height of the arch at a point of
    the ground that is 8 metres from the centre of the opening.
20. A point of the parabola y^{2} = 12x is at distance 8 from the focus. Find the coordinates of that
    point, using the equality between the distance to the focus and the distance to the directrix.

### Answer key

1. a = 5, b = 4 and c = 3.
2. a = 4, b = 3 and c = 5.
3. Focus (2, 0), and directrix the line x = -2.
4. e = 3/5. Here c = 6 and a = 10.
5. The major axis lies on the vertical axis. a = 3, b = 2 and c = √5.
6. x^{2}/25 + y^{2}/16 = 1.
7. x^{2}/25 + y^{2}/9 = 1.
8. Asymptotes y = 4x/3 and y = -4x/3. Eccentricity e = 5/3.
9. x^{2}/16 - y^{2}/9 = 1.
10. x^{2} = 16y.
11. Focus (-5, 0), and directrix the line x = 5.
12. y = 9/5 or y = -9/5.
13. An ellipse with equation x^{2}/9 + y^{2}/4 = 1, with a = 3, b = 2 and c = √5.
14. A hyperbola with equation x^{2}/25 - y^{2}/16 = 1, with a = 5, b = 4 and c = √41.
15. An ellipse with equation (x - 2)^{2}/4 + (y + 1)^{2}/9 = 1. Centre (2, -1), with a = 3, b = 2
    and c = √5. The major axis is vertical.
16. A hyperbola with equation (x - 1)^{2}/4 - (y + 2)^{2} = 1. Centre (1, -2), with a = 2, b = 1
    and c = √5.
17. A parabola with equation (y - 3)^{2} = 8 · (x - 2). Vertex (2, 3), focus (4, 3), and directrix
    the line x = 0.
18. 3. The sum of the distances to the two foci is constant and equals the major axis, that is, 10.
    Since one of them is 7, the other is 3.
19. 3.6 metres. With the ellipse x^{2}/100 + y^{2}/36 = 1, for x = 8 the value of y^{2} is 1296/100.
20. The points (5, 2√15) and (5, -2√15). The distance to the focus is x + 3, so x = 5 and
    y^{2} = 60.

## VERIFICACAO

```python
X1: 25 - 9 == 16 and sqrt(16) == 4 and Rational(4,5) == Rational(4,5)
X2: 9 + 16 == 25 and sqrt(25) == 5 and simplify(x**2/9 - (4*x/3)**2/16) == 0
X3: Rational(12,4) == 3
X4: expand(4*(x-1)**2 + 9*(y+2)**2 - 36) == 4*x**2 + 9*y**2 - 8*x + 36*y + 4 and 9 - 4 == 5
E1: 25 - 16 == 9 and sqrt(25) == 5 and sqrt(16) == 4 and sqrt(9) == 3
E2: 16 + 9 == 25 and sqrt(16) == 4 and sqrt(9) == 3 and sqrt(25) == 5
E3: Rational(8,4) == 2
E4: 100 - 64 == 36 and sqrt(36) == 6 and Rational(6,10) == Rational(3,5)
E5: 9 - 4 == 5 and sqrt(9) == 3 and sqrt(4) == 2 and simplify(sqrt(5)) == sqrt(5)
E6: 5**2 - 3**2 == 16 and 5**2 == 25
E7: Rational(10,2) == 5 and Rational(6,2) == 3 and 5**2 == 25 and 3**2 == 9
E8: simplify(x**2/9 - (4*x/3)**2/16) == 0 and sqrt(9 + 16) == 5 and Rational(5,3) == Rational(5,3)
E9: 5**2 - 4**2 == 9 and 4**2 == 16
E10: expand((y+4)**2 - (y-4)**2) == 16*y
E11: Rational(-20,4) == -5
E12: solve(Eq(Rational(16,25) + y**2/9, 1), y) == [-Rational(9,5), Rational(9,5)]
E13: simplify(4*x**2 + 9*y**2 - 36 - 36*(x**2/9 + y**2/4 - 1)) == 0 and 9 - 4 == 5
E14: simplify(16*x**2 - 25*y**2 - 400 - 400*(x**2/25 - y**2/16 - 1)) == 0 and 25 + 16 == 41
E15: expand(9*(x-2)**2 + 4*(y+1)**2 - 36) == 9*x**2 + 4*y**2 - 36*x + 8*y + 4 and 9 - 4 == 5
E16: expand((x-1)**2 - 4*(y+2)**2 - 4) == x**2 - 4*y**2 - 2*x - 16*y - 19 and 4 + 1 == 5
E17: expand((y-3)**2 - 8*(x-2)) == y**2 - 8*x - 6*y + 25 and Rational(8,4) == 2 and 2 + 2 == 4 and 2 - 2 == 0
E18: 2*5 - 7 == 3
E19: solve(Eq(Rational(8**2,100) + y**2/36, 1), y)[1] == Rational(18,5) and Rational(18,5)**2 == Rational(1296,100) and Rational(18,5) == Rational(36,10)
E20: 5 + 3 == 8 and 12*5 == 60 and simplify(sqrt(60)) == 2*sqrt(15)
```
