---
id: MATEM1-14
serie: em1
unidade: geometria
titulo_pt: Trigonometria no triângulo retângulo
titulo_en: Trigonometry in the right triangle
resumo_pt: Usar seno, cosseno e tangente para achar lados e ângulos, dominar os ângulos notáveis e resolver problemas de altura e distância.
resumo_en: Using sine, cosine and tangent to find sides and angles, mastering the special angles and solving height and distance problems.
prerequisitos: []
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### A ideia central

Dois triângulos retângulos que têm o mesmo ângulo agudo são semelhantes, mesmo que um seja bem maior
que o outro. Semelhantes quer dizer que os lados de um são todos proporcionais aos lados do outro.
A consequência é forte: **a razão entre dois lados de um triângulo retângulo depende apenas do
ângulo, não do tamanho do triângulo**. É isso que permite dar nome a essas razões e guardá-las numa
tabela.

#### Os lados vistos de um ângulo

Num triângulo retângulo, o lado maior, oposto ao ângulo reto, é a **hipotenusa**. Os outros dois são
os **catetos**. A novidade da trigonometria é que os catetos ganham nomes que dependem de qual
ângulo agudo se está olhando:

- **Cateto oposto** ao ângulo é o que fica do outro lado dele, sem tocá-lo.
- **Cateto adjacente** ao ângulo é o que forma o ângulo junto com a hipotenusa.

Trocando o ângulo observado, oposto e adjacente trocam de papel. A hipotenusa nunca muda.

#### As três razões

Chamando de θ o ângulo agudo observado:

- **Seno**: sen(θ) = cateto oposto / hipotenusa
- **Cosseno**: cos(θ) = cateto adjacente / hipotenusa
- **Tangente**: tg(θ) = cateto oposto / cateto adjacente

Como a hipotenusa é sempre o maior lado, seno e cosseno de um ângulo agudo ficam sempre entre 0 e 1:
0 < sen(θ) < 1 e 0 < cos(θ) < 1. A tangente não tem esse limite: ela pode ser qualquer número
positivo.

Vale também a relação entre elas:

tg(θ) = sen(θ) / cos(θ)

porque ao dividir uma razão pela outra a hipotenusa se cancela.

**Exemplo 1.** Num triângulo retângulo os catetos medem 3 e 4 e a hipotenusa mede 5. Calcular as
três razões do ângulo θ oposto ao cateto que mede 3.
O cateto oposto vale 3, o adjacente vale 4 e a hipotenusa vale 5. Então sen(θ) = 3/5,
cos(θ) = 4/5 e tg(θ) = 3/4.
Para conferir a coerência: sen(θ) / cos(θ) = (3/5) · (5/4) = 3/4, exatamente a tangente encontrada.

#### Os ângulos notáveis

Três ângulos aparecem o tempo todo, e seus valores precisam estar na memória:

| θ | sen(θ) | cos(θ) | tg(θ) |
|---|---|---|---|
| 30° | 1/2 | √3/2 | √3/3 |
| 45° | √2/2 | √2/2 | 1 |
| 60° | √3/2 | 1/2 | √3 |

Duas observações ajudam a não decorar errado. Primeiro, o seno cresce quando o ângulo cresce, e o
cosseno diminui. Segundo, os valores de 30° e de 60° são os mesmos, apenas trocados entre seno e
cosseno.

**Exemplo 2.** Uma escada de 6 metros se apoia numa parede e forma 60° com o chão. A que altura ela
encosta e a que distância da parede fica o seu pé?
A escada é a hipotenusa. A altura h é o cateto oposto ao ângulo de 60°:

h = 6 · sen(60°) = 6 · √3/2 = 3√3 metros

A distância d até a parede é o cateto adjacente:

d = 6 · cos(60°) = 6 · 1/2 = 3 metros

#### Altura e distância

O padrão mais cobrado é o do **ângulo de elevação**: alguém no chão olha para o topo de algo alto, e
o ângulo entre a linha de visada e a horizontal é conhecido. A altura é o cateto oposto e a
distância no chão é o cateto adjacente, então a razão que serve é a tangente:

tg(θ) = altura / distância no chão

**Exemplo 3.** De um ponto do chão a 60 metros da base de uma torre, o topo é visto sob um ângulo de
30° com a horizontal. Qual é a altura da torre?
Chamando a altura de h, vale tg(30°) = h/60. Como tg(30°) = √3/3, temos

h = 60 · √3/3 = 20√3 metros

#### A relação fundamental

Para qualquer ângulo agudo θ vale

sen(θ)^{2} + cos(θ)^{2} = 1

A demonstração é curta. Chamando os catetos de a e b e a hipotenusa de c, temos sen(θ) = a/c e
cos(θ) = b/c. A soma dos quadrados é

sen(θ)^{2} + cos(θ)^{2} = (a^{2} + b^{2}) / c^{2}

e, pelo Teorema de Pitágoras, a^{2} + b^{2} = c^{2}, de modo que a fração inteira vale 1.

**Exemplo 4.** Num ângulo agudo θ vale sen(θ) = 3/5. Calcular o cosseno e a tangente.
Pela relação fundamental, cos(θ)^{2} = 1 - 9/25 = 16/25. Como o ângulo é agudo, o cosseno é positivo
e vale cos(θ) = 4/5.
A tangente é tg(θ) = sen(θ) / cos(θ) = (3/5) / (4/5) = 3/4.

#### Ângulos complementares

Os dois ângulos agudos de um triângulo retângulo somam 90°. O cateto oposto a um deles é o adjacente
ao outro, e daí sai uma igualdade útil: **o seno de um ângulo é igual ao cosseno do seu
complementar**.

sen(θ) = cos(90° - θ)

Por isso sen(30°) = cos(60°).

#### Dois triângulos encaixados

Quando o problema traz duas visadas do mesmo ponto alto, feitas de lugares diferentes, aparecem dois
triângulos retângulos que compartilham a altura. A estratégia é sempre a mesma: escrever cada
distância no chão em função da altura, e usar a distância entre os dois pontos de observação para
montar uma equação com uma só incógnita.

**Exemplo 5.** De um ponto do chão o topo de uma torre é visto sob 30°. Caminhando 20 metros em
linha reta em direção à base, o topo passa a ser visto sob 60°. Qual é a altura da torre?
Chamando a altura de h, a distância do primeiro ponto até a base é d_{1} = h / tg(30°) = h · √3, e a
distância do segundo ponto até a base é d_{2} = h / tg(60°) = h / √3.
A diferença entre as duas distâncias é a caminhada de 20 metros:

h · √3 - h / √3 = 20

Resolvendo essa equação, h = 10√3 metros.

Repare que o ponto mais próximo enxerga sob ângulo maior. Se a conta der o contrário, houve troca
entre os dois triângulos.

#### Erros comuns

**Trocar oposto por adjacente.** Antes de escolher a razão, marque o ângulo e pergunte qual cateto
encosta nele. Errar isso troca seno por cosseno e o resultado sai errado sem parecer errado.

**Usar seno quando o problema não envolve a hipotenusa.** Se o enunciado dá a distância no chão e
pede a altura, os dois lados são catetos, e a razão certa é a tangente.

**Achar que a calculadora está em graus.** Vale conferir sempre, porque em radianos os valores saem
completamente diferentes.

**Obter seno maior que 1.** Isso indica erro de montagem, porque o cateto nunca é maior que a
hipotenusa.

**Somar as duas visadas como se fossem um triângulo só.** Nos problemas de duas observações existem
dois triângulos distintos que compartilham apenas a altura.

### Exercícios

**Bloco A. Fundamentos**

1. Num triângulo retângulo os catetos medem 3 e 4 e a hipotenusa mede 5. Calcule o seno, o cosseno e
   a tangente do ângulo agudo oposto ao cateto que mede 3.
2. Escreva sen(45°), cos(45°) e tg(45°).
3. Num triângulo retângulo, o cateto oposto ao ângulo de 30° mede 5. Calcule a hipotenusa.
4. Num triângulo retângulo a hipotenusa mede 8 e um dos ângulos agudos mede 60°. Calcule o cateto
   oposto a esse ângulo.
5. Num triângulo retângulo um dos ângulos agudos mede 40°. Quanto mede o outro ângulo agudo, e que
   relação existe entre o seno de um e o cosseno do outro?

**Bloco B. Consolidação**

6. Uma escada de 6 metros se apoia numa parede e forma 60° com o chão. A que altura da parede ela
   encosta e a que distância da parede está o seu pé?
7. De um ponto do chão a 60 metros da base de uma torre, o topo é visto sob um ângulo de 30° com a
   horizontal. Calcule a altura da torre.
8. Num triângulo retângulo o seno de um ângulo agudo vale 3/5. Calcule o cosseno e a tangente desse
   mesmo ângulo.
9. Uma rampa sobe 4 metros de altura ao longo de 8 metros de rampa. Calcule o seno do ângulo que a
   rampa faz com o chão e diga quanto mede esse ângulo.
10. Um triângulo retângulo tem os dois catetos medindo 5. Calcule a hipotenusa e os dois ângulos
    agudos.
11. Calcule o valor de 2 · sen(30°) + 4 · cos(60°).
12. Num triângulo retângulo, um dos catetos mede 12 e o ângulo agudo adjacente a ele mede 30°.
    Calcule o outro cateto e a hipotenusa.
13. Um avião decola mantendo um ângulo constante de 30° com a pista. Depois de percorrer 2000
    metros em linha reta, a que altura do chão ele está?

**Bloco C. Aprofundamento**

14. De um ponto do chão o topo de uma torre é visto sob um ângulo de 30° com a horizontal.
    Caminhando 20 metros em linha reta em direção à base, o topo passa a ser visto sob 60°. Calcule
    a altura da torre.
15. Mostre que sen(θ)^{2} + cos(θ)^{2} = 1 para qualquer ângulo agudo θ de um triângulo retângulo.
    Use os lados do triângulo e o Teorema de Pitágoras.
16. Uma pessoa de 1,6 metro de altura está a 30 metros da base de um prédio e vê o topo sob um
    ângulo de 45° com a horizontal. Calcule a altura do prédio.
17. De um ponto do chão o topo de um morro é visto sob um ângulo de 45°. Afastando-se 100 metros
    em linha reta, na mesma direção, o topo passa a ser visto sob 30°. Calcule a altura do morro.
18. Um mastro vertical é sustentado por dois cabos presos no seu topo e fixados no chão, em lados
    opostos do mastro e alinhados com ele. Um cabo forma 30° com o chão e o outro forma 60°. Os
    dois pontos de fixação estão a 24 metros um do outro. Calcule a altura do mastro e o comprimento
    do cabo mais curto.

### Gabarito

1. sen(θ) = 3/5, cos(θ) = 4/5 e tg(θ) = 3/4.
2. sen(45°) = √2/2, cos(45°) = √2/2 e tg(45°) = 1.
3. A hipotenusa mede 10, porque sen(30°) = 1/2.
4. O cateto oposto mede 4√3.
5. O outro ângulo agudo mede 50°. Vale sen(40°) = cos(50°), porque os dois ângulos são
   complementares.
6. A escada encosta a 3√3 metros de altura, e o pé fica a 3 metros da parede.
7. A torre tem 20√3 metros.
8. cos(θ) = 4/5 e tg(θ) = 3/4.
9. O seno vale 1/2, e o ângulo mede 30°.
10. A hipotenusa mede 5√2, e os dois ângulos agudos medem 45°.
11. 3.
12. O outro cateto mede 4√3 e a hipotenusa mede 8√3.
13. 1000 metros.
14. A torre tem 10√3 metros.
15. Chamando os catetos de a e b e a hipotenusa de c, temos sen(θ) = a/c e cos(θ) = b/c. Então
    sen(θ)^{2} + cos(θ)^{2} = (a^{2} + b^{2}) / c^{2}. Pelo Teorema de Pitágoras
    a^{2} + b^{2} = c^{2}, e a fração vale 1.
16. 31,6 metros. A visada de 45° dá 30 metros acima da altura dos olhos, e soma-se 1,6 metro.
17. 50√3 + 50 metros.
18. O mastro tem 6√3 metros, e o cabo mais curto mede 12 metros.

## EN

### Explanation

#### The central idea

Two right triangles with the same acute angle are similar, even if one is much larger than the
other. Similar means that the sides of one are all proportional to the sides of the other. The
consequence is strong: **the ratio between two sides of a right triangle depends only on the angle,
not on the size of the triangle**. That is what allows us to give those ratios names and store them
in a table.

#### The sides seen from an angle

In a right triangle, the longest side, opposite the right angle, is the **hypotenuse**. The other
two are the **legs**. What trigonometry adds is that the legs get names that depend on which acute
angle you are looking at:

- The **opposite leg** is the one on the far side of the angle, not touching it.
- The **adjacent leg** is the one that forms the angle together with the hypotenuse.

If you switch the angle you are looking at, opposite and adjacent swap roles. The hypotenuse never
changes.

#### The three ratios

Calling θ the acute angle you are looking at:

- **Sine**: sin(θ) = opposite leg / hypotenuse
- **Cosine**: cos(θ) = adjacent leg / hypotenuse
- **Tangent**: tan(θ) = opposite leg / adjacent leg

Since the hypotenuse is always the longest side, the sine and the cosine of an acute angle always
sit between 0 and 1: 0 < sin(θ) < 1 and 0 < cos(θ) < 1. The tangent has no such limit: it can be any
positive number.

There is also a link between them:

tan(θ) = sin(θ) / cos(θ)

because dividing one ratio by the other cancels the hypotenuse.

**Example 1.** In a right triangle the legs are 3 and 4 and the hypotenuse is 5. Find the three
ratios of the angle θ opposite the leg that measures 3.
The opposite leg is 3, the adjacent leg is 4 and the hypotenuse is 5. So sin(θ) = 3/5,
cos(θ) = 4/5 and tan(θ) = 3/4.
As a consistency check: sin(θ) / cos(θ) = (3/5) · (5/4) = 3/4, exactly the tangent found.

#### The special angles

Three angles turn up all the time, and their values have to be in memory:

| θ | sin(θ) | cos(θ) | tan(θ) |
|---|---|---|---|
| 30° | 1/2 | √3/2 | √3/3 |
| 45° | √2/2 | √2/2 | 1 |
| 60° | √3/2 | 1/2 | √3 |

Two remarks help you avoid memorising them wrongly. First, the sine grows as the angle grows, and
the cosine shrinks. Second, the values for 30° and for 60° are the same ones, simply swapped between
sine and cosine.

**Example 2.** A 6 metre ladder leans against a wall and makes 60° with the ground. At what height
does it touch the wall and how far from the wall is its foot?
The ladder is the hypotenuse. The height h is the leg opposite the 60° angle:

h = 6 · sin(60°) = 6 · √3/2 = 3√3 metres

The distance d to the wall is the adjacent leg:

d = 6 · cos(60°) = 6 · 1/2 = 3 metres

#### Height and distance

The pattern asked for most often is the **angle of elevation**: someone on the ground looks up at
the top of something tall, and the angle between the line of sight and the horizontal is known. The
height is the opposite leg and the distance on the ground is the adjacent leg, so the ratio that
works is the tangent:

tan(θ) = height / distance on the ground

**Example 3.** From a point on the ground 60 metres from the base of a tower, the top is seen at an
angle of 30° with the horizontal. What is the height of the tower?
Calling the height h, we have tan(30°) = h/60. Since tan(30°) = √3/3,

h = 60 · √3/3 = 20√3 metres

#### The fundamental relation

For any acute angle θ it holds that

sin(θ)^{2} + cos(θ)^{2} = 1

The proof is short. Calling the legs a and b and the hypotenuse c, we have sin(θ) = a/c and
cos(θ) = b/c. The sum of the squares is

sin(θ)^{2} + cos(θ)^{2} = (a^{2} + b^{2}) / c^{2}

and, by the Pythagorean Theorem, a^{2} + b^{2} = c^{2}, so the whole fraction is 1.

**Example 4.** In an acute angle θ we have sin(θ) = 3/5. Find the cosine and the tangent.
By the fundamental relation, cos(θ)^{2} = 1 - 9/25 = 16/25. Since the angle is acute, the cosine is
positive and equals cos(θ) = 4/5.
The tangent is tan(θ) = sin(θ) / cos(θ) = (3/5) / (4/5) = 3/4.

#### Complementary angles

The two acute angles of a right triangle add up to 90°. The leg opposite one of them is the leg
adjacent to the other, and from that comes a useful equality: **the sine of an angle equals the
cosine of its complement**.

sin(θ) = cos(90° - θ)

That is why sin(30°) = cos(60°).

#### Two nested triangles

When a problem gives two lines of sight to the same high point, taken from different places, two
right triangles appear sharing the same height. The strategy is always the same: write each distance
on the ground in terms of the height, and use the distance between the two observation points to set
up an equation with a single unknown.

**Example 5.** From a point on the ground the top of a tower is seen at 30°. Walking 20 metres in a
straight line towards the base, the top is then seen at 60°. What is the height of the tower?
Calling the height h, the distance from the first point to the base is
d_{1} = h / tan(30°) = h · √3, and the distance from the second point to the base is
d_{2} = h / tan(60°) = h / √3.
The difference between the two distances is the walk of 20 metres:

h · √3 - h / √3 = 20

Solving that equation, h = 10√3 metres.

Notice that the closer point sees the top at the larger angle. If the calculation says otherwise,
the two triangles were swapped.

#### Common mistakes

**Swapping opposite and adjacent.** Before choosing a ratio, mark the angle and ask which leg
touches it. Getting this wrong swaps sine for cosine and the answer comes out wrong without looking
wrong.

**Using sine when the problem has no hypotenuse in it.** If the question gives the distance on the
ground and asks for the height, both sides are legs, and the right ratio is the tangent.

**Assuming the calculator is set to degrees.** It is worth checking every time, because in radians
the values come out completely different.

**Getting a sine greater than 1.** That signals a set-up error, because a leg is never longer than
the hypotenuse.

**Adding the two lines of sight as if they were one triangle.** In two-observation problems there
are two distinct triangles that share only the height.

### Exercises

**Block A. Fundamentals**

1. In a right triangle the legs are 3 and 4 and the hypotenuse is 5. Find the sine, the cosine and
   the tangent of the acute angle opposite the leg that measures 3.
2. Write sin(45°), cos(45°) and tan(45°).
3. In a right triangle, the leg opposite the angle of 30° measures 5. Find the hypotenuse.
4. In a right triangle the hypotenuse measures 8 and one of the acute angles is 60°. Find the leg
   opposite that angle.
5. In a right triangle one of the acute angles is 40°. How large is the other acute angle, and what
   relation is there between the sine of one and the cosine of the other?

**Block B. Building up**

6. A 6 metre ladder leans against a wall and makes 60° with the ground. At what height on the wall
   does it touch and how far from the wall is its foot?
7. From a point on the ground 60 metres from the base of a tower, the top is seen at an angle of
   30° with the horizontal. Find the height of the tower.
8. In a right triangle the sine of an acute angle is 3/5. Find the cosine and the tangent of that
   same angle.
9. A ramp rises 4 metres in height along 8 metres of ramp. Find the sine of the angle the ramp makes
   with the ground and say how large that angle is.
10. A right triangle has both legs measuring 5. Find the hypotenuse and the two acute angles.
11. Find the value of 2 · sin(30°) + 4 · cos(60°).
12. In a right triangle, one of the legs measures 12 and the acute angle adjacent to it is 30°.
    Find the other leg and the hypotenuse.
13. A plane takes off keeping a constant angle of 30° with the runway. After travelling 2000
    metres in a straight line, how high above the ground is it?

**Block C. Going further**

14. From a point on the ground the top of a tower is seen at an angle of 30° with the horizontal.
    Walking 20 metres in a straight line towards the base, the top is then seen at 60°. Find the
    height of the tower.
15. Show that sin(θ)^{2} + cos(θ)^{2} = 1 for any acute angle θ of a right triangle. Use the sides
    of the triangle and the Pythagorean Theorem.
16. A person 1.6 metres tall stands 30 metres from the base of a building and sees the top at an
    angle of 45° with the horizontal. Find the height of the building.
17. From a point on the ground the top of a hill is seen at an angle of 45°. Moving 100 metres away
    in a straight line, in the same direction, the top is then seen at 30°. Find the height of the
    hill.
18. A vertical mast is held by two cables tied at its top and fixed to the ground, on opposite sides
    of the mast and in line with it. One cable makes 30° with the ground and the other makes 60°.
    The two fixing points are 24 metres apart. Find the height of the mast and the length of the
    shorter cable.

### Answer key

1. sin(θ) = 3/5, cos(θ) = 4/5 and tan(θ) = 3/4.
2. sin(45°) = √2/2, cos(45°) = √2/2 and tan(45°) = 1.
3. The hypotenuse measures 10, because sin(30°) = 1/2.
4. The opposite leg measures 4√3.
5. The other acute angle is 50°. It holds that sin(40°) = cos(50°), because the two angles are
   complementary.
6. The ladder touches the wall at a height of 3√3 metres, and its foot is 3 metres from the wall.
7. The tower is 20√3 metres tall.
8. cos(θ) = 4/5 and tan(θ) = 3/4.
9. The sine is 1/2, and the angle is 30°.
10. The hypotenuse measures 5√2, and both acute angles are 45°.
11. 3.
12. The other leg measures 4√3 and the hypotenuse measures 8√3.
13. 1000 metres.
14. The tower is 10√3 metres tall.
15. Calling the legs a and b and the hypotenuse c, we have sin(θ) = a/c and cos(θ) = b/c. Then
    sin(θ)^{2} + cos(θ)^{2} = (a^{2} + b^{2}) / c^{2}. By the Pythagorean Theorem
    a^{2} + b^{2} = c^{2}, and the fraction is 1.
16. 31.6 metres. The 45° line of sight gives 30 metres above eye level, and 1.6 metres are added.
17. 50√3 + 50 metres.
18. The mast is 6√3 metres tall, and the shorter cable measures 12 metres.

## VERIFICACAO

```python
X1: 3**2 + 4**2 == 5**2 and simplify(Rational(3,5)/Rational(4,5) - Rational(3,4)) == 0
X2: simplify(6*sin(pi/3) - 3*sqrt(3)) == 0 and 6*cos(pi/3) == 3
X3: simplify(60*tan(pi/6) - 20*sqrt(3)) == 0
X4: simplify(sqrt(1 - Rational(3,5)**2) - Rational(4,5)) == 0 and simplify(Rational(3,5)/Rational(4,5) - Rational(3,4)) == 0
X5: simplify(solve(Eq(x/tan(pi/6) - x/tan(pi/3), 20), x)[0] - 10*sqrt(3)) == 0
E1: 3**2 + 4**2 == 5**2 and simplify(Rational(3,5)/Rational(4,5) - Rational(3,4)) == 0
E2: simplify(sin(pi/4) - sqrt(2)/2) == 0 and simplify(cos(pi/4) - sqrt(2)/2) == 0 and tan(pi/4) == 1
E3: solve(Eq(5/x, sin(pi/6)), x) == [10]
E4: simplify(8*sin(pi/3) - 4*sqrt(3)) == 0
E5: 90 - 40 == 50 and simplify(sin(pi*Rational(40,180)) - cos(pi*Rational(50,180))) == 0
E6: simplify(6*sin(pi/3) - 3*sqrt(3)) == 0 and 6*cos(pi/3) == 3
E7: simplify(60*tan(pi/6) - 20*sqrt(3)) == 0
E8: simplify(sqrt(1 - Rational(3,5)**2) - Rational(4,5)) == 0 and simplify(Rational(3,5)/Rational(4,5) - Rational(3,4)) == 0
E9: Rational(4,8) == Rational(1,2) and sin(pi/6) == Rational(1,2)
E10: simplify(sqrt(5**2 + 5**2) - 5*sqrt(2)) == 0 and tan(pi/4) == 1 and 90 - 45 == 45
E11: 2*sin(pi/6) + 4*cos(pi/3) == 3
E12: simplify(12*tan(pi/6) - 4*sqrt(3)) == 0 and simplify(12/cos(pi/6) - 8*sqrt(3)) == 0
E13: 2000*sin(pi/6) == 1000
E14: simplify(solve(Eq(x/tan(pi/6) - x/tan(pi/3), 20), x)[0] - 10*sqrt(3)) == 0
E15: simplify((a/sqrt(a**2 + b**2))**2 + (b/sqrt(a**2 + b**2))**2 - 1) == 0
E16: 30*tan(pi/4) + Rational(16,10) == Rational(316,10)
E17: simplify(solve(Eq(x/tan(pi/6) - x/tan(pi/4), 100), x)[0] - (50*sqrt(3) + 50)) == 0
E18: simplify(solve(Eq(x/tan(pi/6) + x/tan(pi/3), 24), x)[0] - 6*sqrt(3)) == 0 and simplify(6*sqrt(3)/sin(pi/3) - 12) == 0
```
