---
id: MATEM2-01
serie: em2
unidade: geometria
titulo_pt: Ciclo trigonométrico
titulo_en: The unit circle
resumo_pt: Medir arcos em graus e em radianos, localizar qualquer arco no ciclo e ler seno, cosseno e tangente a partir dele.
resumo_en: Measuring arcs in degrees and radians, placing any arc on the circle, and reading sine, cosine and tangent from it.
prerequisitos: [MATEM1-14]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### Por que sair do triângulo retângulo

No triângulo retângulo o seno e o cosseno só fazem sentido para ângulos agudos, porque um ângulo de
um triângulo não passa de um ângulo raso. Isso é pouco. Um ponto que gira, uma roda que dá voltas,
uma maré que sobe e desce: nada disso cabe em ângulo agudo.

O ciclo trigonométrico resolve o problema. É uma circunferência de raio 1, com centro na origem do
plano cartesiano. Escolhe-se um ponto de partida, que é o ponto de coordenadas 1 e 0, e um sentido
positivo, que é o anti-horário. A partir daí, todo número real vira um arco, e todo arco vira um
ponto da circunferência.

#### Graus e radianos

Uma volta completa tem 360 graus. Ela também tem 2 pi radianos, porque o comprimento da
circunferência de raio 1 é 2 pi. Essas duas medidas contam a mesma coisa em unidades diferentes, e a
conversão sai de uma proporção simples:

180 graus correspondem a pi radianos

Para ir de graus para radianos, multiplique por pi e divida por 180. Para o caminho inverso,
multiplique por 180 e divida por pi.

**Exemplo 1.** Converter 120 graus para radianos.
Multiplicando por pi e dividindo por 180, fica 120 pi sobre 180, que simplifica para 2 pi sobre 3.

Vale decorar os arcos que mais aparecem: pi sobre 6 são 30 graus, pi sobre 4 são 45 graus, pi sobre 3
são 60 graus, pi sobre 2 são 90 graus, e pi são 180 graus.

#### Os quadrantes

Os eixos cortam o ciclo em quatro quadrantes, numerados no sentido anti-horário a partir do ponto de
partida. O primeiro quadrante vai de 0 a 90 graus, o segundo de 90 a 180, o terceiro de 180 a 270 e
o quarto de 270 a 360. Saber o quadrante já diz o sinal do seno e do cosseno, antes de qualquer
conta.

#### Arcos côngruos e a menor determinação positiva

Girar uma volta a mais leva ao mesmo ponto. Por isso os arcos de 30 graus, 390 graus e 750 graus
caem exatamente no mesmo lugar: dizemos que são côngruos. Para achar a menor determinação positiva,
subtraia voltas completas até sobrar um valor entre 0 e 360 graus, ou entre 0 e 2 pi radianos.

**Exemplo 2.** Achar a menor determinação positiva do arco de 1110 graus.
Cada volta tem 360 graus, e três voltas dão 1080 graus. Sobram 30 graus. Então o arco de 1110 graus
tem a mesma posição do arco de 30 graus, no primeiro quadrante.

#### Seno, cosseno e tangente no ciclo

Marcado o ponto do arco na circunferência, a leitura é direta:

- O **cosseno** é a abscissa do ponto, ou seja, a coordenada horizontal.
- O **seno** é a ordenada do ponto, ou seja, a coordenada vertical.
- A **tangente** é o seno dividido pelo cosseno, e só existe quando o cosseno não é zero.

Como o raio vale 1, tanto o seno quanto o cosseno ficam sempre entre menos 1 e 1. Esse limite é uma
das ferramentas mais usadas em prova: se uma conta pede seno igual a 2, a resposta é que não existe
arco assim.

Os sinais saem do quadrante. No primeiro os dois são positivos. No segundo o seno é positivo e o
cosseno é negativo. No terceiro os dois são negativos. No quarto o seno é negativo e o cosseno é
positivo. A tangente é positiva no primeiro e no terceiro, e negativa no segundo e no quarto.

#### A relação fundamental

Como o ponto está numa circunferência de raio 1, o teorema de Pitágoras dá, para qualquer arco,

o quadrado do seno mais o quadrado do cosseno é igual a 1

Ela permite achar uma das funções a partir da outra. O quadrante é que decide o sinal.

**Exemplo 3.** O seno de um arco do segundo quadrante vale 4 sobre 5. Achar o cosseno.
O quadrado do cosseno é 1 menos 16 sobre 25, que dá 9 sobre 25. Logo o cosseno vale 3 sobre 5 ou
menos 3 sobre 5. Como o arco está no segundo quadrante, o cosseno é negativo, e a resposta é menos 3
sobre 5.

#### Redução ao primeiro quadrante

Todo arco tem um arco associado no primeiro quadrante, com o mesmo valor absoluto de seno e de
cosseno. Para um arco do segundo quadrante, o associado é pi menos o arco. Para o terceiro, é o arco
menos pi. Para o quarto, é 2 pi menos o arco. Depois de reduzir, basta ajustar o sinal pelo
quadrante de origem.

#### Equações trigonométricas simples

Resolver uma equação no ciclo é achar todos os pontos que satisfazem a condição. Dentro de uma volta,
uma equação como seno de x igual a um valor entre menos 1 e 1 costuma ter duas soluções, porque duas
alturas iguais aparecem em dois pontos simétricos.

**Exemplo 4.** Achar todos os arcos x, com x maior ou igual a 0 e menor que 2 pi, tais que o seno de
x vale raiz de 2 sobre 2.
No primeiro quadrante o arco é pi sobre 4. O outro ponto com a mesma altura está no segundo
quadrante, e vale pi menos pi sobre 4, ou seja, 3 pi sobre 4. As soluções são pi sobre 4 e 3 pi sobre
4.

#### Erros comuns

**Trocar seno por cosseno na leitura do ponto.** O cosseno é a coordenada horizontal e o seno é a
vertical. Quem inverte isso erra todos os sinais.

**Esquecer que existe mais de uma solução.** Ao resolver uma equação numa volta completa, achar
apenas o arco do primeiro quadrante deixa metade da resposta para trás.

**Aceitar seno maior que 1.** Nenhum arco tem seno ou cosseno fora do intervalo de menos 1 a 1.

**Converter graus e radianos de cabeça, no sentido errado.** A checagem é rápida: radiano é uma
unidade grande, então o número em radianos precisa sair menor que o número em graus.

### Exercícios

**Bloco A. Fundamentos**

1. Converta 60 graus para radianos.
2. Converta 5 pi sobre 6 radianos para graus.
3. Determine a que quadrante pertence o arco de 210 graus.
4. Calcule o seno, o cosseno e a tangente do arco de pi sobre 6 radianos.
5. Determine a menor determinação positiva do arco de 750 graus.

**Bloco B. Consolidação**

6. Determine a menor determinação positiva do arco de 1290 graus e diga a que quadrante ele pertence.
7. O seno de um arco do segundo quadrante vale 3 sobre 5. Calcule o cosseno desse arco.
8. Calcule o seno, o cosseno e a tangente do arco de 2 pi sobre 3 radianos.
9. Calcule o seno e o cosseno do arco de 5 pi sobre 4 radianos.
10. Reduza o arco de 5 pi sobre 6 radianos ao primeiro quadrante e calcule o seu seno.
11. Determine todos os arcos x, com x maior ou igual a 0 e menor que 2 pi, tais que o seno de x vale
    1 sobre 2.
12. Determine todos os arcos x, com x maior ou igual a 0 e menor que 2 pi, tais que o cosseno de x
    vale menos raiz de 2 sobre 2.
13. O cosseno de um arco do terceiro quadrante vale menos 1 sobre 2. Calcule o seno e a tangente
    desse arco.
14. Um ponto do ciclo trigonométrico está no quarto quadrante e tem abscissa 5 sobre 13. Determine a
    ordenada desse ponto.

**Bloco C. Aprofundamento**

15. Resolva a equação seno de x igual a cosseno de x, com x maior ou igual a 0 e menor que 2 pi.
16. Resolva a equação 2 vezes o quadrado do cosseno de x, menos 3 vezes o cosseno de x, mais 1 igual
    a zero, com x maior ou igual a 0 e menor que 2 pi.
17. Determine todos os valores reais de m para os quais existe um arco x cujo seno vale (2m menos 1)
    sobre 3.
18. Mostre, usando a simetria do ciclo trigonométrico, que o seno de pi menos x é igual ao seno de x,
    qualquer que seja o arco x.
19. Determine todos os arcos x, com x maior ou igual a 0 e menor que 4 pi, tais que o seno de x vale
    menos raiz de 3 sobre 2.

### Gabarito

1. pi sobre 3.
2. 150 graus.
3. Terceiro quadrante, porque 210 fica entre 180 e 270.
4. Seno 1 sobre 2, cosseno raiz de 3 sobre 2 e tangente raiz de 3 sobre 3.
5. 30 graus.
6. 210 graus, no terceiro quadrante.
7. Menos 4 sobre 5.
8. Seno raiz de 3 sobre 2, cosseno menos 1 sobre 2 e tangente menos raiz de 3.
9. Os dois valem menos raiz de 2 sobre 2.
10. O arco reduzido é pi sobre 6 e o seno vale 1 sobre 2.
11. x igual a pi sobre 6 e x igual a 5 pi sobre 6.
12. x igual a 3 pi sobre 4 e x igual a 5 pi sobre 4.
13. Seno menos raiz de 3 sobre 2 e tangente raiz de 3.
14. Menos 12 sobre 13.
15. x igual a pi sobre 4 e x igual a 5 pi sobre 4. Dividindo os dois lados pelo cosseno, a equação
    vira tangente de x igual a 1.
16. x igual a 0, x igual a pi sobre 3 e x igual a 5 pi sobre 3. Chamando o cosseno de x de y, a
    equação vira uma equação do segundo grau em y, com raízes y igual a 1 e y igual a um meio.
17. m entre menos 1 e 2, incluindo os extremos. O seno precisa ficar entre menos 1 e 1, o que dá a
    dupla desigualdade.
18. O arco pi menos x é o simétrico de x em relação ao eixo vertical. A reflexão nesse eixo troca o
    sinal da abscissa e mantém a ordenada. Como o seno é a ordenada, ele não muda.
19. x igual a 4 pi sobre 3, x igual a 5 pi sobre 3, x igual a 10 pi sobre 3 e x igual a 11 pi sobre 3.

## EN

### Explanation

#### Why leave the right triangle behind

In a right triangle, sine and cosine only make sense for acute angles, because an angle of a triangle
never exceeds a straight angle. That is not much. A spinning point, a wheel going round, a tide
rising and falling: none of that fits inside an acute angle.

The unit circle solves the problem. It is a circle of radius 1 centred at the origin of the cartesian
plane. We pick a starting point, the point with coordinates 1 and 0, and a positive direction, which
is counterclockwise. From there, every real number becomes an arc, and every arc becomes a point on
the circle.

#### Degrees and radians

A full turn has 360 degrees. It also has 2 pi radians, because the length of a circle of radius 1 is
2 pi. These two measures count the same thing in different units, and the conversion comes from a
simple proportion:

180 degrees correspond to pi radians

To go from degrees to radians, multiply by pi and divide by 180. For the other direction, multiply by
180 and divide by pi.

**Example 1.** Convert 120 degrees to radians.
Multiplying by pi and dividing by 180 gives 120 pi over 180, which simplifies to 2 pi over 3.

It pays to memorise the arcs that come up most: pi over 6 is 30 degrees, pi over 4 is 45 degrees, pi
over 3 is 60 degrees, pi over 2 is 90 degrees, and pi is 180 degrees.

#### The quadrants

The axes cut the circle into four quadrants, numbered counterclockwise from the starting point. The
first quadrant runs from 0 to 90 degrees, the second from 90 to 180, the third from 180 to 270 and
the fourth from 270 to 360. Knowing the quadrant already tells you the sign of the sine and of the
cosine, before any calculation.

#### Coterminal arcs and the smallest positive one

Going round one extra turn lands on the same point. That is why the arcs of 30 degrees, 390 degrees
and 750 degrees sit in exactly the same place: we call them coterminal. To find the smallest positive
one, subtract full turns until what is left lies between 0 and 360 degrees, or between 0 and 2 pi
radians.

**Example 2.** Find the smallest positive arc coterminal with 1110 degrees.
Each turn has 360 degrees, and three turns give 1080 degrees. That leaves 30 degrees. So the arc of
1110 degrees sits in the same position as the arc of 30 degrees, in the first quadrant.

#### Sine, cosine and tangent on the circle

Once the point of the arc is marked on the circle, the reading is direct:

- The **cosine** is the abscissa of the point, that is, the horizontal coordinate.
- The **sine** is the ordinate of the point, that is, the vertical coordinate.
- The **tangent** is the sine divided by the cosine, and it only exists when the cosine is not zero.

Since the radius is 1, both the sine and the cosine always stay between minus 1 and 1. That bound is
one of the most used tools in a test: if a problem asks for a sine equal to 2, the answer is that no
such arc exists.

The signs come from the quadrant. In the first both are positive. In the second the sine is positive
and the cosine is negative. In the third both are negative. In the fourth the sine is negative and
the cosine is positive. The tangent is positive in the first and third, and negative in the second
and fourth.

#### The fundamental identity

Since the point lies on a circle of radius 1, the Pythagorean theorem gives, for any arc,

the square of the sine plus the square of the cosine equals 1

It lets you find one function from the other. The quadrant is what decides the sign.

**Example 3.** The sine of an arc in the second quadrant is 4 over 5. Find the cosine.
The square of the cosine is 1 minus 16 over 25, which gives 9 over 25. So the cosine is 3 over 5 or
minus 3 over 5. Since the arc lies in the second quadrant, the cosine is negative, and the answer is
minus 3 over 5.

#### Reducing to the first quadrant

Every arc has an associated arc in the first quadrant with the same absolute value of sine and
cosine. For an arc in the second quadrant, the associated one is pi minus the arc. For the third, it
is the arc minus pi. For the fourth, it is 2 pi minus the arc. After reducing, you only have to fix
the sign using the original quadrant.

#### Simple trigonometric equations

Solving an equation on the circle means finding every point that meets the condition. Within one
turn, an equation such as the sine of x equal to a value between minus 1 and 1 usually has two
solutions, because two equal heights show up at two symmetric points.

**Example 4.** Find every arc x, with x greater than or equal to 0 and less than 2 pi, whose sine is
square root of 2 over 2.
In the first quadrant the arc is pi over 4. The other point at the same height is in the second
quadrant, and equals pi minus pi over 4, that is, 3 pi over 4. The solutions are pi over 4 and 3 pi
over 4.

#### Common mistakes

**Swapping sine and cosine when reading the point.** The cosine is the horizontal coordinate and the
sine is the vertical one. Whoever swaps them gets every sign wrong.

**Forgetting that there is more than one solution.** When solving an equation over a full turn,
finding only the first quadrant arc leaves half the answer behind.

**Accepting a sine greater than 1.** No arc has sine or cosine outside the interval from minus 1 to 1.

**Converting degrees and radians in your head, the wrong way round.** The check is quick: a radian is
a big unit, so the number in radians has to come out smaller than the number in degrees.

### Exercises

**Block A. Fundamentals**

1. Convert 60 degrees to radians.
2. Convert 5 pi over 6 radians to degrees.
3. Find which quadrant the arc of 210 degrees belongs to.
4. Find the sine, the cosine and the tangent of the arc of pi over 6 radians.
5. Find the smallest positive arc coterminal with 750 degrees.

**Block B. Building up**

6. Find the smallest positive arc coterminal with 1290 degrees and say which quadrant it belongs to.
7. The sine of an arc in the second quadrant is 3 over 5. Find the cosine of that arc.
8. Find the sine, the cosine and the tangent of the arc of 2 pi over 3 radians.
9. Find the sine and the cosine of the arc of 5 pi over 4 radians.
10. Reduce the arc of 5 pi over 6 radians to the first quadrant and find its sine.
11. Find every arc x, with x greater than or equal to 0 and less than 2 pi, whose sine is 1 over 2.
12. Find every arc x, with x greater than or equal to 0 and less than 2 pi, whose cosine is minus
    square root of 2 over 2.
13. The cosine of an arc in the third quadrant is minus 1 over 2. Find the sine and the tangent of
    that arc.
14. A point of the unit circle lies in the fourth quadrant and has abscissa 5 over 13. Find the
    ordinate of that point.

**Block C. Going further**

15. Solve the equation sine of x equals cosine of x, with x greater than or equal to 0 and less than
    2 pi.
16. Solve the equation 2 times the square of the cosine of x, minus 3 times the cosine of x, plus 1
    equals zero, with x greater than or equal to 0 and less than 2 pi.
17. Find every real value of m for which there is an arc x whose sine equals (2m minus 1) over 3.
18. Show, using the symmetry of the unit circle, that the sine of pi minus x equals the sine of x,
    whatever the arc x may be.
19. Find every arc x, with x greater than or equal to 0 and less than 4 pi, whose sine is minus
    square root of 3 over 2.

### Answer key

1. pi over 3.
2. 150 degrees.
3. Third quadrant, because 210 lies between 180 and 270.
4. Sine 1 over 2, cosine square root of 3 over 2 and tangent square root of 3 over 3.
5. 30 degrees.
6. 210 degrees, in the third quadrant.
7. Minus 4 over 5.
8. Sine square root of 3 over 2, cosine minus 1 over 2 and tangent minus square root of 3.
9. Both equal minus square root of 2 over 2.
10. The reduced arc is pi over 6 and the sine is 1 over 2.
11. x equals pi over 6 and x equals 5 pi over 6.
12. x equals 3 pi over 4 and x equals 5 pi over 4.
13. Sine minus square root of 3 over 2 and tangent square root of 3.
14. Minus 12 over 13.
15. x equals pi over 4 and x equals 5 pi over 4. Dividing both sides by the cosine turns the equation
    into tangent of x equals 1.
16. x equals 0, x equals pi over 3 and x equals 5 pi over 3. Calling the cosine of x y, the equation
    becomes a quadratic equation in y, with roots y equals 1 and y equals one half.
17. m between minus 1 and 2, endpoints included. The sine has to stay between minus 1 and 1, which
    gives the double inequality.
18. The arc pi minus x is the mirror image of x across the vertical axis. Reflecting in that axis
    flips the sign of the abscissa and keeps the ordinate. Since the sine is the ordinate, it does
    not change.
19. x equals 4 pi over 3, x equals 5 pi over 3, x equals 10 pi over 3 and x equals 11 pi over 3.

## VERIFICACAO

```python
X1: pi*120/180 == 2*pi/3
X2: 1110 - 3*360 == 30
X3: -sqrt(1 - Rational(4,5)**2) == Rational(-3,5)
X4: solveset(Eq(sin(x), sqrt(2)/2), x, Interval.Ropen(0, 2*pi)) == FiniteSet(pi/4, 3*pi/4)
E1: pi*60/180 == pi/3
E2: 180*Rational(5,6) == 150
E3: 210 > 180 and 210 < 270
E4: sin(pi/6) == Rational(1,2) and cos(pi/6) == sqrt(3)/2 and simplify(tan(pi/6) - sqrt(3)/3) == 0
E5: 750 - 2*360 == 30
E6: 1290 - 3*360 == 210 and 210 > 180 and 210 < 270
E7: -sqrt(1 - Rational(3,5)**2) == Rational(-4,5)
E8: sin(2*pi/3) == sqrt(3)/2 and cos(2*pi/3) == Rational(-1,2) and simplify(tan(2*pi/3) + sqrt(3)) == 0
E9: simplify(sin(5*pi/4) + sqrt(2)/2) == 0 and simplify(cos(5*pi/4) + sqrt(2)/2) == 0
E10: simplify(pi - 5*pi/6 - pi/6) == 0 and sin(5*pi/6) == Rational(1,2)
E11: solveset(Eq(sin(x), Rational(1,2)), x, Interval.Ropen(0, 2*pi)) == FiniteSet(pi/6, 5*pi/6)
E12: solveset(Eq(cos(x), -sqrt(2)/2), x, Interval.Ropen(0, 2*pi)) == FiniteSet(3*pi/4, 5*pi/4)
E13: cos(4*pi/3) == Rational(-1,2) and simplify(sin(4*pi/3) + sqrt(3)/2) == 0 and simplify(tan(4*pi/3) - sqrt(3)) == 0
E14: Rational(5,13)**2 + Rational(-12,13)**2 == 1 and Rational(-12,13) < 0
E15: solveset(Eq(sin(x), cos(x)), x, Interval.Ropen(0, 2*pi)) == FiniteSet(pi/4, 5*pi/4)
E16: solveset(Eq(2*cos(x)**2 - 3*cos(x) + 1, 0), x, Interval.Ropen(0, 2*pi)) == FiniteSet(0, pi/3, 5*pi/3)
E17: Intersection(solveset((2*m-1)/3 >= -1, m, Reals), solveset((2*m-1)/3 <= 1, m, Reals)) == Interval(-1, 2)
E18: simplify(sin(pi - x) - sin(x)) == 0
E19: solveset(Eq(sin(x), -sqrt(3)/2), x, Interval.Ropen(0, 4*pi)) == FiniteSet(4*pi/3, 5*pi/3, 10*pi/3, 11*pi/3)
```
