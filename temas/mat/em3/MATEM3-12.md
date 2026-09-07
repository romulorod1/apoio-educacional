---
id: MATEM3-12
serie: em3
unidade: geometria
titulo_pt: Revisão: geometria plana e espacial
titulo_en: Review: plane and solid geometry
resumo_pt: Retomar áreas e relações do plano e usá-las para calcular volumes e superfícies dos sólidos mais cobrados.
resumo_en: Revisiting plane areas and relations and using them to work out volumes and surfaces of the solids that come up most.
prerequisitos: [MATEM3-04]
duracao_min: 90
dificuldade: 5
---

## PT

### Explicação

#### Por que plana e espacial no mesmo tema

Porque quase todo cálculo de sólido termina em um cálculo de figura plana. O volume de um prisma é a
área da base vezes a altura. A área lateral de uma pirâmide é a soma de áreas de triângulos. O raio
de um cone aparece dentro de um triângulo retângulo junto com a altura e a geratriz. Quem tem as
fórmulas do plano na ponta da língua resolve o espaço quase de graça.

#### O essencial do plano

**Triângulo.** A área é

A = (b · h)/2

onde b é a base e h a altura relativa a ela. No triângulo retângulo vale o teorema de Pitágoras:

a^{2} = b^{2} + c^{2}

onde a é a hipotenusa e b e c são os catetos. O triângulo equilátero de lado L tem área

A = (L^{2} · √3)/4

**Quadrilátero.** O retângulo de base b e altura h tem área

A = b · h

e sua diagonal também sai de Pitágoras: d^{2} = b^{2} + h^{2}. O trapézio de bases B e b e altura h
tem área

A = ((B + b) · h)/2

**Polígono regular.** O hexágono regular de lado L é formado por seis triângulos equiláteros de lado
L, como mostra a figura, e essa decomposição resolve a área sem fórmula decorada.

@fig poligonoregular lados=6 lado=L raio=L decomposto=sim

**Circunferência e círculo.** Com raio r, o comprimento da circunferência e a área do círculo são

C = 2 · π · r

A = π · r^{2}

Um setor de ângulo central α vale a fração α/360 do círculo inteiro, e a mesma fração vale para o
arco.

@fig circulo raio=r setor=α centro=O legenda=A região hachurada é o setor de ângulo central α.

**Semelhança.** Quando duas figuras são semelhantes na razão k, os comprimentos ficam multiplicados
por k, as áreas por k^{2} e os volumes por k^{3}. Esse é o resultado que mais aparece disfarçado
em prova.

**Exemplo 1.** Um triângulo retângulo tem catetos 6 e 8. Qual a hipotenusa e qual a área?
a = √(36 + 64) = 10 e A = (6 · 8)/2 = 24.

**Exemplo 2.** Um círculo tem raio 5. Qual a área e qual o comprimento da circunferência?
A = π · 5^{2} = 25π e C = 2 · π · 5 = 10π.

#### O essencial do espaço

Os cinco sólidos desta revisão, com o raio r e a altura h que aparecem nas fórmulas:

@fig painelsolidos nome=prisma;cilindro;pirâmide;cone;esfera raio=r altura=h

**Prisma.** Com área da base A_{b}, perímetro da base P_{b} e altura h:

V = A_{b} · h

A_{lat} = P_{b} · h

**Cilindro.** É um prisma de base circular, de raio r e altura h:

V = π · r^{2} · h

A_{lat} = 2 · π · r · h

**Pirâmide.** Com área da base A_{b} e altura h:

V = (A_{b} · h)/3

A área lateral depende do apótema da face, m, que se acha por Pitágoras com a altura h e o apótema
da base, a, que vai do centro da base ao meio de um lado:

m^{2} = h^{2} + a^{2}

@fig solido tipo=piramide triangulo=sim altura=h apotema=m apotemabase=a

**Cone.** Com raio r, altura h e geratriz g:

V = (π · r^{2} · h)/3

g^{2} = r^{2} + h^{2}

A_{lat} = π · r · g

A geratriz é a hipotenusa do triângulo retângulo formado pelo raio e pela altura.

@fig solido tipo=cone triangulo=sim raio=r altura=h geratriz=g

**Esfera.** Com raio r:

V = (4 · π · r^{3})/3

A = 4 · π · r^{2}

**Exemplo 3.** Um cilindro tem raio 3 e altura 10. Qual o volume e qual a área lateral?
V = π · 3^{2} · 10 = 90π e A_{lat} = 2 · π · 3 · 10 = 60π.

**Exemplo 4.** Uma esfera tem raio 3. Qual o volume e qual a área da superfície?
V = (4 · π · 3^{3})/3 = 36π e A = 4 · π · 3^{2} = 36π, o mesmo valor.

#### Erros comuns

**Somar área lateral com área da base sem perceber que a peça não tem tampa.** Ler o enunciado antes
de escolher a fórmula evita isso.

**Confundir altura com geratriz no cone.** A altura é perpendicular à base. A geratriz é o lado
inclinado, e é sempre maior.

**Aplicar razão de semelhança direto nas áreas.** Se os comprimentos dobram, a área quadruplica, não
dobra.

**Misturar unidades.** Medida em centímetros dá volume em centímetros cúbicos. Trocar de metro para
centímetro no meio da conta é um erro caro.

### Exercícios

**Bloco A. Fundamentos**

1. Um triângulo retângulo tem catetos 9 e 12 centímetros. Calcule a hipotenusa e a área.
2. Um círculo tem raio 6 centímetros. Calcule a área e o comprimento da circunferência.
3. Um cubo tem aresta 5 centímetros. Calcule o volume e a área total da superfície.
4. Um retângulo mede 8 por 15 centímetros. Calcule a área e a diagonal.
5. Um triângulo equilátero tem lado 10 centímetros. Calcule sua área.

**Bloco B. Consolidação**

6. Um trapézio tem bases de 12 e 8 centímetros e altura 5 centímetros. Calcule sua área.
7. Um cilindro reto tem raio 4 centímetros e altura 9 centímetros. Calcule o volume e a área lateral.
8. A pirâmide reta da figura tem base quadrada de aresta 6 centímetros e altura 4 centímetros.
   Calcule o volume, o apótema m da face, a área lateral e a área total.
   @fig solido id=s8 tipo=piramide triangulo=sim aresta=6 altura=4 apotema=m apotemabase=a
9. O cone reto da figura tem raio 6 centímetros e altura 8 centímetros. Calcule a geratriz g, o
   volume e a área total.
   @fig solido id=s9 tipo=cone triangulo=sim raio=6 altura=8 geratriz=g
10. Uma esfera tem raio 6 centímetros. Calcule o volume e a área da superfície.
11. Um triângulo tem lados 6, 8 e 10 centímetros. Outro triângulo, semelhante a ele, tem menor lado
    igual a 15 centímetros. Calcule os outros dois lados e a razão entre as áreas dos dois
    triângulos.
12. Um hexágono regular tem lado 4 centímetros. Calcule seu perímetro e sua área.
13. Um triângulo retângulo tem ângulos de 30, 60 e 90 graus e hipotenusa de 20 centímetros. Calcule
    os dois catetos.

**Bloco C. Aprofundamento**

14. O quadrado da figura tem lado 10 centímetros, um círculo inscrito de raio r e um círculo
    circunscrito de raio R. Calcule a área de cada um dos dois círculos e a área da região
    hachurada, interna ao quadrado e externa ao círculo inscrito.
    @fig circulo id=q14 inscrito=10 circunscrito=10 raio=r raio=R legenda=A região hachurada é a região pedida.
15. O prisma reto da figura tem base triangular equilátera de lado 6 centímetros e altura 10
    centímetros. Calcule o volume e a área lateral.
    @fig solido id=s15 tipo=prismatriangular aresta=6 altura=10
16. No círculo da figura, de raio 12 centímetros, o setor hachurado tem ângulo central de 30 graus.
    Calcule o comprimento do arco e a área do setor.
    @fig circulo id=c16 raio=12 setor=30 centro=O legenda=A região hachurada é o setor.
17. O semicírculo da figura, de raio 10 centímetros, é enrolado até formar a superfície lateral de
    um cone. Determine o raio r da base, a altura h e o volume desse cone.
    @fig solido id=s17 tipo=cone planificacao=sim setor=10 raio=r altura=h geratriz=g
18. A esfera da figura, de raio 3 centímetros, está inscrita em um cilindro, tocando as duas bases e
    a superfície lateral. Calcule o volume da esfera, o volume do cilindro e a razão entre eles.
    @fig solido id=s18 tipo=cilindro esfera=inscrita raio=3 altura=h centro=O

### Gabarito

1. Hipotenusa de 15 centímetros e área de 54 centímetros quadrados.
2. Área de 36π centímetros quadrados e comprimento de 12π centímetros.
3. Volume de 125 centímetros cúbicos e área total de 150 centímetros quadrados.
4. Área de 120 centímetros quadrados e diagonal de 17 centímetros.
5. Área de 25√3 centímetros quadrados.
6. Área de 50 centímetros quadrados.
7. Volume de 144π centímetros cúbicos e área lateral de 72π centímetros quadrados.
8. Volume de 48 centímetros cúbicos. O apótema da base a mede 3, metade da aresta, então o apótema
   da face m mede 5. A área lateral é 60 e a área total é 96 centímetros quadrados.
   @fig id=s8 fase=gabarito
9. Geratriz de 10 centímetros, volume de 96π centímetros cúbicos e área total de 96π centímetros
   quadrados.
10. Volume de 288π centímetros cúbicos e área da superfície de 144π centímetros quadrados.
11. Os outros lados medem 20 e 25 centímetros. A razão de semelhança é 5/2, e a razão entre as
    áreas é 25/4.
12. Perímetro de 24 centímetros e área de 24√3 centímetros quadrados.
13. Os catetos medem 10 e 10√3 centímetros.
14. O círculo inscrito tem raio 5 e área 25π. O círculo circunscrito tem raio 5√2 e área 50π. A
    região pedida tem área 100 - 25π centímetros quadrados.
15. Volume de 90√3 centímetros cúbicos e área lateral de 180 centímetros quadrados.
16. Comprimento de arco de 2π centímetros e área de setor de 12π centímetros quadrados.
17. A geratriz é o raio do semicírculo, g = 10. O raio da base é r = 5 centímetros, porque o arco do
    semicírculo, que mede 10π, vira o comprimento da circunferência da base. A altura é h = 5√3 e o
    volume é (125√3 · π)/3 centímetros cúbicos.
    @fig id=s17 fase=gabarito
18. A esfera tem volume 36π e o cilindro, de raio 3 e altura h = 6, tem volume 54π centímetros
    cúbicos. A razão entre os volumes é 2/3.
    @fig id=s18 fase=gabarito

## EN

### Explanation

#### Why plane and solid geometry share one topic

Because almost every calculation about a solid ends in a calculation about a plane figure. The volume
of a prism is the area of the base times the height. The lateral area of a pyramid is a sum of
triangle areas. The radius of a cone shows up inside a right triangle next to the height and the
slant height. Whoever has the plane formulas ready solves solids almost for free.

#### The essentials of the plane

**Triangle.** The area is

A = (b · h)/2

where b is the base and h the height relative to it. In a right triangle the Pythagorean theorem
holds:

a^{2} = b^{2} + c^{2}

where a is the hypotenuse and b and c are the legs. An equilateral triangle of side L has area

A = (L^{2} · √3)/4

**Quadrilateral.** A rectangle of base b and height h has area

A = b · h

and its diagonal also comes from Pythagoras: d^{2} = b^{2} + h^{2}. A trapezium with parallel sides
B and b and height h has area

A = ((B + b) · h)/2

**Regular polygon.** A regular hexagon of side L is made of six equilateral triangles of side L, as
the figure shows, and that decomposition settles the area with no memorised formula.

@fig poligonoregular lados=6 lado=L raio=L decomposto=sim

**Circle.** With radius r, the circumference and the area of the disc are

C = 2 · π · r

A = π · r^{2}

A sector with central angle α is the fraction α/360 of the whole disc, and the same fraction gives
the arc.

@fig circulo raio=r setor=α centro=O legenda=The hatched region is the sector with central angle α.

**Similarity.** When two figures are similar with ratio k, lengths get multiplied by k, areas by
k^{2} and volumes by k^{3}. This is the result that most often turns up in disguise on a test.

**Example 1.** A right triangle has legs 6 and 8. What is the hypotenuse and what is the area?
a = √(36 + 64) = 10 and A = (6 · 8)/2 = 24.

**Example 2.** A circle has radius 5. What is the area and what is the circumference?
A = π · 5^{2} = 25π and C = 2 · π · 5 = 10π.

#### The essentials of space

The five solids of this review, with the radius r and the height h that appear in the formulas:

@fig painelsolidos nome=prism;cylinder;pyramid;cone;sphere raio=r altura=h

**Prism.** With base area A_{b}, base perimeter P_{b} and height h:

V = A_{b} · h

A_{lat} = P_{b} · h

**Cylinder.** It is a prism with a circular base, of radius r and height h:

V = π · r^{2} · h

A_{lat} = 2 · π · r · h

**Pyramid.** With base area A_{b} and height h:

V = (A_{b} · h)/3

The lateral area depends on the slant height of a face, m, found by Pythagoras from the height h and
the apothem of the base, a, which goes from the centre of the base to the midpoint of a side:

m^{2} = h^{2} + a^{2}

@fig solido tipo=piramide triangulo=sim altura=h apotema=m apotemabase=a

**Cone.** With radius r, height h and slant height g:

V = (π · r^{2} · h)/3

g^{2} = r^{2} + h^{2}

A_{lat} = π · r · g

The slant height is the hypotenuse of the right triangle formed by the radius and the height.

@fig solido tipo=cone triangulo=sim raio=r altura=h geratriz=g

**Sphere.** With radius r:

V = (4 · π · r^{3})/3

A = 4 · π · r^{2}

**Example 3.** A cylinder has radius 3 and height 10. What is the volume and what is the lateral
area?
V = π · 3^{2} · 10 = 90π and A_{lat} = 2 · π · 3 · 10 = 60π.

**Example 4.** A sphere has radius 3. What is the volume and what is the surface area?
V = (4 · π · 3^{3})/3 = 36π and A = 4 · π · 3^{2} = 36π, the same value.

#### Common mistakes

**Adding the lateral area to the base area without noticing that the object has no lid.** Reading the
statement before picking the formula avoids this.

**Confusing height with slant height in a cone.** The height is perpendicular to the base. The slant
height is the sloping side, and it is always longer.

**Applying the similarity ratio straight to areas.** If lengths double, the area becomes four times
as large, not twice as large.

**Mixing units.** A measurement in centimetres gives a volume in cubic centimetres. Switching from
metres to centimetres mid calculation is an expensive mistake.

### Exercises

**Block A. Fundamentals**

1. A right triangle has legs 9 and 12 centimetres. Work out the hypotenuse and the area.
2. A circle has radius 6 centimetres. Work out the area and the circumference.
3. A cube has edge 5 centimetres. Work out the volume and the total surface area.
4. A rectangle measures 8 by 15 centimetres. Work out the area and the diagonal.
5. An equilateral triangle has side 10 centimetres. Work out its area.

**Block B. Building up**

6. A trapezium has parallel sides of 12 and 8 centimetres and height 5 centimetres. Work out its
   area.
7. A right cylinder has radius 4 centimetres and height 9 centimetres. Work out the volume and the
   lateral area.
8. The right pyramid in the figure has a square base of edge 6 centimetres and height 4 centimetres.
   Work out the volume, the slant height m of a face, the lateral area and the total area.
   @fig solido id=s8 tipo=piramide triangulo=sim aresta=6 altura=4 apotema=m apotemabase=a
9. The right cone in the figure has radius 6 centimetres and height 8 centimetres. Work out the slant
   height g, the volume and the total area.
   @fig solido id=s9 tipo=cone triangulo=sim raio=6 altura=8 geratriz=g
10. A sphere has radius 6 centimetres. Work out the volume and the surface area.
11. A triangle has sides 6, 8 and 10 centimetres. Another triangle, similar to it, has shortest side
    equal to 15 centimetres. Work out the other two sides and the ratio between the areas of the two
    triangles.
12. A regular hexagon has side 4 centimetres. Work out its perimeter and its area.
13. A right triangle has angles of 30, 60 and 90 degrees and hypotenuse 20 centimetres. Work out the
    two legs.

**Block C. Going further**

14. The square in the figure has side 10 centimetres, an inscribed circle of radius r and a
    circumscribed circle of radius R. Work out the area of each of the two circles and the area of
    the hatched region, inside the square and outside the inscribed circle.
    @fig circulo id=q14 inscrito=10 circunscrito=10 raio=r raio=R legenda=The hatched region is the region asked for.
15. The right prism in the figure has an equilateral triangular base of side 6 centimetres and height
    10 centimetres. Work out the volume and the lateral area.
    @fig solido id=s15 tipo=prismatriangular aresta=6 altura=10
16. In the circle in the figure, of radius 12 centimetres, the hatched sector has central angle 30
    degrees. Work out the arc length and the area of the sector.
    @fig circulo id=c16 raio=12 setor=30 centro=O legenda=The hatched region is the sector.
17. The half disc in the figure, of radius 10 centimetres, is rolled up to form the lateral surface of
    a cone. Find the base radius r, the height h and the volume of that cone.
    @fig solido id=s17 tipo=cone planificacao=sim setor=10 raio=r altura=h geratriz=g
18. The sphere in the figure, of radius 3 centimetres, is inscribed in a cylinder, touching both bases
    and the lateral surface. Work out the volume of the sphere, the volume of the cylinder and the
    ratio between them.
    @fig solido id=s18 tipo=cilindro esfera=inscrita raio=3 altura=h centro=O

### Answer key

1. Hypotenuse of 15 centimetres and area of 54 square centimetres.
2. Area of 36π square centimetres and circumference of 12π centimetres.
3. Volume of 125 cubic centimetres and total area of 150 square centimetres.
4. Area of 120 square centimetres and diagonal of 17 centimetres.
5. Area of 25√3 square centimetres.
6. Area of 50 square centimetres.
7. Volume of 144π cubic centimetres and lateral area of 72π square centimetres.
8. Volume of 48 cubic centimetres. The apothem of the base a measures 3, half the edge, so the slant
   height of a face m measures 5. The lateral area is 60 and the total area is 96 square centimetres.
   @fig id=s8 fase=gabarito
9. Slant height of 10 centimetres, volume of 96π cubic centimetres and total area of 96π square
   centimetres.
10. Volume of 288π cubic centimetres and surface area of 144π square centimetres.
11. The other sides measure 20 and 25 centimetres. The similarity ratio is 5/2, and the ratio
    between the areas is 25/4.
12. Perimeter of 24 centimetres and area of 24√3 square centimetres.
13. The legs measure 10 and 10√3 centimetres.
14. The inscribed circle has radius 5 and area 25π. The circumscribed circle has radius 5√2 and
    area 50π. The region asked for has area 100 - 25π square centimetres.
15. Volume of 90√3 cubic centimetres and lateral area of 180 square centimetres.
16. Arc length of 2π centimetres and sector area of 12π square centimetres.
17. The slant height is the radius of the half disc, g = 10. The base radius is r = 5 centimetres,
    because the arc of the half disc, which measures 10π, becomes the circumference of the base. The
    height is h = 5√3 and the volume is (125√3 · π)/3 cubic centimetres.
    @fig id=s17 fase=gabarito
18. The sphere has volume 36π and the cylinder, of radius 3 and height h = 6, has volume 54π cubic
    centimetres. The ratio between the volumes is 2/3.
    @fig id=s18 fase=gabarito

## VERIFICACAO

```python
X1: sqrt(6**2 + 8**2) == 10 and Rational(6*8, 2) == 24
X2: pi*5**2 == 25*pi and 2*pi*5 == 10*pi
X3: pi*3**2*10 == 90*pi and 2*pi*3*10 == 60*pi
X4: Rational(4, 3)*pi*3**3 == 36*pi and 4*pi*3**2 == 36*pi
E1: sqrt(9**2 + 12**2) == 15 and Rational(9*12, 2) == 54
E2: pi*6**2 == 36*pi and 2*pi*6 == 12*pi
E3: 5**3 == 125 and 6*5**2 == 150
E4: 8*15 == 120 and sqrt(8**2 + 15**2) == 17
E5: simplify(10**2*sqrt(3)/4 - 25*sqrt(3)) == 0
E6: Rational((12 + 8)*5, 2) == 50
E7: pi*4**2*9 == 144*pi and 2*pi*4*9 == 72*pi
E8: Rational(1, 3)*6**2*4 == 48 and sqrt(4**2 + 3**2) == 5 and 4*Rational(6*5, 2) == 60 and 60 + 36 == 96
E9: sqrt(6**2 + 8**2) == 10 and Rational(1, 3)*pi*6**2*8 == 96*pi and simplify(pi*6*10 + pi*6**2 - 96*pi) == 0
E10: Rational(4, 3)*pi*6**3 == 288*pi and 4*pi*6**2 == 144*pi
E11: Rational(15, 6)*8 == 20 and Rational(15, 6)*10 == 25 and Rational(15, 6)**2 == Rational(25, 4)
E12: 6*4 == 24 and simplify(6*(4**2*sqrt(3)/4) - 24*sqrt(3)) == 0
E13: 20*sin(pi/6) == 10 and simplify(20*sin(pi/3) - 10*sqrt(3)) == 0
E14: pi*5**2 == 25*pi and simplify(pi*(10*sqrt(2)/2)**2 - 50*pi) == 0 and 10**2 - 25*pi == 100 - 25*pi
E15: simplify((6**2*sqrt(3)/4)*10 - 90*sqrt(3)) == 0 and 3*6*10 == 180
E16: simplify(2*pi*12*Rational(30, 360) - 2*pi) == 0 and simplify(pi*12**2*Rational(30, 360) - 12*pi) == 0
E17: solve(Eq(2*pi*r, pi*10), r) == [5] and sqrt(10**2 - 5**2) == 5*sqrt(3) and simplify(Rational(1, 3)*pi*5**2*5*sqrt(3) - 125*sqrt(3)*pi/3) == 0
E18: Rational(4, 3)*pi*3**3 == 36*pi and pi*3**2*6 == 54*pi and Rational(36, 54) == Rational(2, 3)
```
