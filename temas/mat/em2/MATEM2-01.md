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
plano cartesiano. Escolhe-se um ponto de partida, que é o ponto de coordenadas (1, 0), e um sentido
positivo, que é o anti-horário. A partir daí, todo número real vira um arco, e todo arco vira um
ponto da circunferência.

#### Graus e radianos

Uma volta completa tem 360°. Ela também tem 2π radianos, porque o comprimento da circunferência de
raio 1 é 2π. Essas duas medidas contam a mesma coisa em unidades diferentes, e a conversão sai de
uma proporção simples:

180° = π radianos

Para ir de graus para radianos, multiplique por π e divida por 180. Para o caminho inverso,
multiplique por 180 e divida por π.

**Exemplo 1.** Converter 120° para radianos.
Multiplicando por π e dividindo por 180, fica 120π/180, que simplifica para 2π/3.

Vale decorar os arcos que mais aparecem: π/6 = 30°, π/4 = 45°, π/3 = 60°, π/2 = 90° e π = 180°.

#### Os quadrantes

Os eixos cortam o ciclo em quatro quadrantes, numerados no sentido anti-horário a partir do ponto de
partida. O primeiro quadrante vai de 0° a 90°, o segundo de 90° a 180°, o terceiro de 180° a 270° e
o quarto de 270° a 360°. Saber o quadrante já diz o sinal do seno e do cosseno, antes de qualquer
conta.

#### Arcos côngruos e a menor determinação positiva

Girar uma volta a mais leva ao mesmo ponto. Por isso os arcos de 30°, 390° e 750° caem exatamente no
mesmo lugar: dizemos que são côngruos. Para achar a menor determinação positiva, subtraia voltas
completas até sobrar um valor entre 0° e 360°, ou entre 0 e 2π radianos.

**Exemplo 2.** Achar a menor determinação positiva do arco de 1110°.
Cada volta tem 360°, e três voltas dão 1080°. Sobram 30°. Então o arco de 1110° tem a mesma posição
do arco de 30°, no primeiro quadrante.

#### Seno, cosseno e tangente no ciclo

Marcado o ponto do arco na circunferência, a leitura é direta:

- O **cosseno** é a abscissa do ponto, ou seja, a coordenada horizontal.
- O **seno** é a ordenada do ponto, ou seja, a coordenada vertical.
- A **tangente** é o seno dividido pelo cosseno, ou seja, tg(x) = sen(x)/cos(x), e só existe quando
  cos(x) ≠ 0.

Como o raio vale 1, tanto o seno quanto o cosseno ficam sempre entre -1 e 1, ou seja,
-1 ≤ sen(x) ≤ 1 e -1 ≤ cos(x) ≤ 1. Esse limite é uma das ferramentas mais usadas em prova: se uma
conta pede sen(x) = 2, a resposta é que não existe arco assim.

Os sinais saem do quadrante. No primeiro os dois são positivos. No segundo o seno é positivo e o
cosseno é negativo. No terceiro os dois são negativos. No quarto o seno é negativo e o cosseno é
positivo. A tangente é positiva no primeiro e no terceiro, e negativa no segundo e no quarto.

#### A relação fundamental

Como o ponto está numa circunferência de raio 1, o teorema de Pitágoras dá, para qualquer arco x,

sen(x)^{2} + cos(x)^{2} = 1

Ela permite achar uma das funções a partir da outra. O quadrante é que decide o sinal.

**Exemplo 3.** O seno de um arco do segundo quadrante vale 4/5. Achar o cosseno.
Pela relação fundamental, cos(x)^{2} = 1 - 16/25 = 9/25. Logo cos(x) = 3/5 ou cos(x) = -3/5. Como o
arco está no segundo quadrante, o cosseno é negativo, e a resposta é -3/5.

#### Redução ao primeiro quadrante

Todo arco tem um arco associado no primeiro quadrante, com o mesmo valor absoluto de seno e de
cosseno. Para um arco x do segundo quadrante, o associado é π - x. Para o terceiro, é x - π. Para o
quarto, é 2π - x. Depois de reduzir, basta ajustar o sinal pelo quadrante de origem.

#### Equações trigonométricas simples

Resolver uma equação no ciclo é achar todos os pontos que satisfazem a condição. Dentro de uma volta,
uma equação que fixa sen(x) num valor entre -1 e 1 costuma ter duas soluções, porque duas alturas
iguais aparecem em dois pontos simétricos.

**Exemplo 4.** Achar todos os arcos x, com 0 ≤ x < 2π, tais que sen(x) = √2/2.
No primeiro quadrante o arco é π/4. O outro ponto com a mesma altura está no segundo quadrante, e
vale π - π/4, ou seja, 3π/4. As soluções são π/4 e 3π/4.

#### Erros comuns

**Trocar seno por cosseno na leitura do ponto.** O cosseno é a coordenada horizontal e o seno é a
vertical. Quem inverte isso erra todos os sinais.

**Esquecer que existe mais de uma solução.** Ao resolver uma equação numa volta completa, achar
apenas o arco do primeiro quadrante deixa metade da resposta para trás.

**Aceitar seno maior que 1.** Nenhum arco tem seno ou cosseno fora do intervalo de -1 a 1.

**Converter graus e radianos de cabeça, no sentido errado.** A checagem é rápida: radiano é uma
unidade grande, então o número em radianos precisa sair menor que o número em graus.

### Exercícios

**Bloco A. Fundamentos**

1. Converta 60° para radianos.
2. Converta 5π/6 radianos para graus.
3. Determine a que quadrante pertence o arco de 210°.
4. Calcule o seno, o cosseno e a tangente do arco de π/6 radianos.
5. Determine a menor determinação positiva do arco de 750°.

**Bloco B. Consolidação**

6. Determine a menor determinação positiva do arco de 1290° e diga a que quadrante ele pertence.
7. O seno de um arco do segundo quadrante vale 3/5. Calcule o cosseno desse arco.
8. Calcule o seno, o cosseno e a tangente do arco de 2π/3 radianos.
9. Calcule o seno e o cosseno do arco de 5π/4 radianos.
10. Reduza o arco de 5π/6 radianos ao primeiro quadrante e calcule o seu seno.
11. Determine todos os arcos x, com 0 ≤ x < 2π, tais que sen(x) = 1/2.
12. Determine todos os arcos x, com 0 ≤ x < 2π, tais que cos(x) = -√2/2.
13. O cosseno de um arco do terceiro quadrante vale -1/2. Calcule o seno e a tangente desse arco.
14. Um ponto do ciclo trigonométrico está no quarto quadrante e tem abscissa 5/13. Determine a
    ordenada desse ponto.

**Bloco C. Aprofundamento**

15. Resolva a equação sen(x) = cos(x), com 0 ≤ x < 2π.
16. Resolva a equação 2·cos(x)^{2} - 3·cos(x) + 1 = 0, com 0 ≤ x < 2π.
17. Determine todos os valores reais de m para os quais existe um arco x com sen(x) = (2m - 1)/3.
18. Mostre, usando a simetria do ciclo trigonométrico, que sen(π - x) = sen(x), qualquer que seja o
    arco x.
19. Determine todos os arcos x, com 0 ≤ x < 4π, tais que sen(x) = -√3/2.

### Gabarito

1. π/3.
2. 150°.
3. Terceiro quadrante, porque 210° fica entre 180° e 270°.
4. Seno 1/2, cosseno √3/2 e tangente √3/3.
5. 30°.
6. 210°, no terceiro quadrante.
7. -4/5.
8. Seno √3/2, cosseno -1/2 e tangente -√3.
9. Os dois valem -√2/2.
10. O arco reduzido é π/6 e o seno vale 1/2.
11. x = π/6 e x = 5π/6.
12. x = 3π/4 e x = 5π/4.
13. Seno -√3/2 e tangente √3.
14. -12/13.
15. x = π/4 e x = 5π/4. Dividindo os dois lados pelo cosseno, a equação vira tg(x) = 1.
16. x = 0, x = π/3 e x = 5π/3. Chamando cos(x) de y, a equação vira uma equação do segundo grau em
    y, com raízes y = 1 e y = 1/2.
17. -1 ≤ m ≤ 2, com os extremos incluídos. O seno precisa ficar entre -1 e 1, o que dá a dupla
    desigualdade.
18. O arco π - x é o simétrico de x em relação ao eixo vertical. A reflexão nesse eixo troca o
    sinal da abscissa e mantém a ordenada. Como o seno é a ordenada, ele não muda.
19. x = 4π/3, x = 5π/3, x = 10π/3 e x = 11π/3.

## EN

### Explanation

#### Why leave the right triangle behind

In a right triangle, sine and cosine only make sense for acute angles, because an angle of a triangle
never exceeds a straight angle. That is not much. A spinning point, a wheel going round, a tide
rising and falling: none of that fits inside an acute angle.

The unit circle solves the problem. It is a circle of radius 1 centred at the origin of the cartesian
plane. We pick a starting point, the point with coordinates (1, 0), and a positive direction, which
is counterclockwise. From there, every real number becomes an arc, and every arc becomes a point on
the circle.

#### Degrees and radians

A full turn has 360°. It also has 2π radians, because the length of a circle of radius 1 is 2π. These
two measures count the same thing in different units, and the conversion comes from a simple
proportion:

180° = π radians

To go from degrees to radians, multiply by π and divide by 180. For the other direction, multiply by
180 and divide by π.

**Example 1.** Convert 120° to radians.
Multiplying by π and dividing by 180 gives 120π/180, which simplifies to 2π/3.

It pays to memorise the arcs that come up most: π/6 = 30°, π/4 = 45°, π/3 = 60°, π/2 = 90° and
π = 180°.

#### The quadrants

The axes cut the circle into four quadrants, numbered counterclockwise from the starting point. The
first quadrant runs from 0° to 90°, the second from 90° to 180°, the third from 180° to 270° and the
fourth from 270° to 360°. Knowing the quadrant already tells you the sign of the sine and of the
cosine, before any calculation.

#### Coterminal arcs and the smallest positive one

Going round one extra turn lands on the same point. That is why the arcs of 30°, 390° and 750° sit in
exactly the same place: we call them coterminal. To find the smallest positive one, subtract full
turns until what is left lies between 0° and 360°, or between 0 and 2π radians.

**Example 2.** Find the smallest positive arc coterminal with 1110°.
Each turn has 360°, and three turns give 1080°. That leaves 30°. So the arc of 1110° sits in the same
position as the arc of 30°, in the first quadrant.

#### Sine, cosine and tangent on the circle

Once the point of the arc is marked on the circle, the reading is direct:

- The **cosine** is the abscissa of the point, that is, the horizontal coordinate.
- The **sine** is the ordinate of the point, that is, the vertical coordinate.
- The **tangent** is the sine divided by the cosine, that is, tan(x) = sin(x)/cos(x), and it only
  exists when cos(x) ≠ 0.

Since the radius is 1, both the sine and the cosine always stay between -1 and 1, that is,
-1 ≤ sin(x) ≤ 1 and -1 ≤ cos(x) ≤ 1. That bound is one of the most used tools in a test: if a problem
asks for sin(x) = 2, the answer is that no such arc exists.

The signs come from the quadrant. In the first both are positive. In the second the sine is positive
and the cosine is negative. In the third both are negative. In the fourth the sine is negative and
the cosine is positive. The tangent is positive in the first and third, and negative in the second
and fourth.

#### The fundamental identity

Since the point lies on a circle of radius 1, the Pythagorean theorem gives, for any arc x,

sin(x)^{2} + cos(x)^{2} = 1

It lets you find one function from the other. The quadrant is what decides the sign.

**Example 3.** The sine of an arc in the second quadrant is 4/5. Find the cosine.
By the fundamental identity, cos(x)^{2} = 1 - 16/25 = 9/25. So cos(x) = 3/5 or cos(x) = -3/5. Since
the arc lies in the second quadrant, the cosine is negative, and the answer is -3/5.

#### Reducing to the first quadrant

Every arc has an associated arc in the first quadrant with the same absolute value of sine and
cosine. For an arc x in the second quadrant, the associated one is π - x. For the third, it is x - π.
For the fourth, it is 2π - x. After reducing, you only have to fix the sign using the original
quadrant.

#### Simple trigonometric equations

Solving an equation on the circle means finding every point that meets the condition. Within one
turn, an equation that fixes sin(x) at a value between -1 and 1 usually has two solutions, because
two equal heights show up at two symmetric points.

**Example 4.** Find every arc x, with 0 ≤ x < 2π, such that sin(x) = √2/2.
In the first quadrant the arc is π/4. The other point at the same height is in the second quadrant,
and equals π - π/4, that is, 3π/4. The solutions are π/4 and 3π/4.

#### Common mistakes

**Swapping sine and cosine when reading the point.** The cosine is the horizontal coordinate and the
sine is the vertical one. Whoever swaps them gets every sign wrong.

**Forgetting that there is more than one solution.** When solving an equation over a full turn,
finding only the first quadrant arc leaves half the answer behind.

**Accepting a sine greater than 1.** No arc has sine or cosine outside the interval from -1 to 1.

**Converting degrees and radians in your head, the wrong way round.** The check is quick: a radian is
a big unit, so the number in radians has to come out smaller than the number in degrees.

### Exercises

**Block A. Fundamentals**

1. Convert 60° to radians.
2. Convert 5π/6 radians to degrees.
3. Find which quadrant the arc of 210° belongs to.
4. Find the sine, the cosine and the tangent of the arc of π/6 radians.
5. Find the smallest positive arc coterminal with 750°.

**Block B. Building up**

6. Find the smallest positive arc coterminal with 1290° and say which quadrant it belongs to.
7. The sine of an arc in the second quadrant is 3/5. Find the cosine of that arc.
8. Find the sine, the cosine and the tangent of the arc of 2π/3 radians.
9. Find the sine and the cosine of the arc of 5π/4 radians.
10. Reduce the arc of 5π/6 radians to the first quadrant and find its sine.
11. Find every arc x, with 0 ≤ x < 2π, such that sin(x) = 1/2.
12. Find every arc x, with 0 ≤ x < 2π, such that cos(x) = -√2/2.
13. The cosine of an arc in the third quadrant is -1/2. Find the sine and the tangent of that arc.
14. A point of the unit circle lies in the fourth quadrant and has abscissa 5/13. Find the ordinate
    of that point.

**Block C. Going further**

15. Solve the equation sin(x) = cos(x), with 0 ≤ x < 2π.
16. Solve the equation 2·cos(x)^{2} - 3·cos(x) + 1 = 0, with 0 ≤ x < 2π.
17. Find every real value of m for which there is an arc x with sin(x) = (2m - 1)/3.
18. Show, using the symmetry of the unit circle, that sin(π - x) = sin(x), whatever the arc x may be.
19. Find every arc x, with 0 ≤ x < 4π, such that sin(x) = -√3/2.

### Answer key

1. π/3.
2. 150°.
3. Third quadrant, because 210° lies between 180° and 270°.
4. Sine 1/2, cosine √3/2 and tangent √3/3.
5. 30°.
6. 210°, in the third quadrant.
7. -4/5.
8. Sine √3/2, cosine -1/2 and tangent -√3.
9. Both equal -√2/2.
10. The reduced arc is π/6 and the sine is 1/2.
11. x = π/6 and x = 5π/6.
12. x = 3π/4 and x = 5π/4.
13. Sine -√3/2 and tangent √3.
14. -12/13.
15. x = π/4 and x = 5π/4. Dividing both sides by the cosine turns the equation into tan(x) = 1.
16. x = 0, x = π/3 and x = 5π/3. Calling cos(x) y, the equation becomes a quadratic equation in y,
    with roots y = 1 and y = 1/2.
17. -1 ≤ m ≤ 2, endpoints included. The sine has to stay between -1 and 1, which gives the double
    inequality.
18. The arc π - x is the mirror image of x across the vertical axis. Reflecting in that axis flips
    the sign of the abscissa and keeps the ordinate. Since the sine is the ordinate, it does not
    change.
19. x = 4π/3, x = 5π/3, x = 10π/3 and x = 11π/3.

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
