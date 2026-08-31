---
id: MATEM2-12
serie: em2
unidade: geometria
titulo_pt: Cilindros, cones e esferas
titulo_en: Cylinders, cones and spheres
resumo_pt: Calcular áreas e volumes dos sólidos redondos, recuperar medidas a partir do volume dado e resolver peças formadas por mais de um sólido.
resumo_en: Working out areas and volumes of round solids, recovering measurements from a given volume, and handling pieces made of more than one solid.
prerequisitos: [MATEM2-11]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### Os três sólidos redondos

O **cilindro** tem duas bases circulares iguais e paralelas. O **cone** tem uma base circular e um
vértice, e a **geratriz** é o segmento que liga o vértice a um ponto da borda da base. A **esfera**
é o conjunto dos pontos que ficam a uma distância fixa do centro.

Os três aparecem em tudo que é embalagem, tanque, casquinha e bola, e a maior parte dos problemas
mistura dois deles.

#### Cilindro

O volume segue a mesma ideia do prisma, com base circular:

o volume do cilindro é pi vezes o raio ao quadrado vezes a altura

Planificando a superfície lateral, aparece um retângulo cuja base é o comprimento da circunferência
e cuja altura é a altura do cilindro. Então a área lateral é 2 vezes pi vezes o raio vezes a altura,
e a área total soma as duas bases, cada uma com área pi vezes o raio ao quadrado.

**Exemplo 1.** Um cilindro tem raio 3 e altura 10. Calcular volume, área lateral e área total.
O volume é pi vezes 9 vezes 10, ou seja, 90 vezes pi. A área lateral é 2 vezes pi vezes 3 vezes 10,
que dá 60 vezes pi. Cada base tem área 9 vezes pi, então a área total é 78 vezes pi.

#### Cone

Assim como a pirâmide vale um terço do prisma, o cone vale um terço do cilindro de mesma base e
mesma altura:

o volume do cone é um terço de pi vezes o raio ao quadrado vezes a altura

O raio, a altura e a geratriz formam um triângulo retângulo, com a geratriz no papel de hipotenusa.
A área lateral é pi vezes o raio vezes a geratriz, e a área total soma a base.

**Exemplo 2.** Um cone tem raio 3 e altura 4. Calcular a geratriz, o volume e a área total.
A geratriz é a raiz de 9 mais 16, que dá 5. O volume é um terço de pi vezes 9 vezes 4, ou seja, 12
vezes pi. A área lateral é pi vezes 3 vezes 5, que dá 15 vezes pi, e somando a base de 9 vezes pi a
área total é 24 vezes pi.

#### Esfera

A esfera tem fórmulas próprias, que valem a pena guardar:

o volume da esfera é quatro terços de pi vezes o raio ao cubo
a área da superfície esférica é 4 vezes pi vezes o raio ao quadrado

**Exemplo 3.** Uma esfera tem raio 6. Calcular volume e área.
O volume é quatro terços de pi vezes 216, o que dá 288 vezes pi. A área é 4 vezes pi vezes 36, que
dá 144 vezes pi.

#### Deixar em função de pi ou aproximar

Enquanto o problema é de geometria, a resposta em função de pi é a mais honesta, porque é exata.
Quando o enunciado manda usar 3,14, a resposta vira um número decimal aproximado, e aí a instrução
precisa estar escrita no enunciado. Trocar de critério no meio da conta é fonte garantida de
divergência.

#### Sólidos compostos e peças vazadas

Peça formada por dois sólidos tem volume igual à soma. Peça furada tem volume igual à diferença. Na
área, o cuidado continua o mesmo: a superfície de contato some, e um furo acrescenta a superfície
interna.

**Exemplo 4.** Um sólido é formado por um cone de raio 3 e altura 8 com uma semiesfera de raio 3
colada sobre a base do cone. Calcular o volume.
O cone tem um terço de pi vezes 9 vezes 8, ou seja, 24 vezes pi. A semiesfera tem metade de quatro
terços de pi vezes 27, o que dá 18 vezes pi. O total é 42 vezes pi.

#### Erros comuns

**Usar a altura no lugar da geratriz.** Na área lateral do cone entra a geratriz, não a altura.
Quando o enunciado dá a altura, primeiro se calcula a geratriz por Pitágoras.

**Esquecer o terço no cone.** O mesmo deslize da pirâmide, com o mesmo efeito de triplicar a
resposta.

**Elevar o raio ao expoente errado.** Volume da esfera usa o cubo do raio, área da esfera usa o
quadrado.

**Confundir raio e diâmetro.** Quando o enunciado dá o diâmetro, ele precisa ser dividido por dois
antes de qualquer conta.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule o volume de um cilindro de raio 3 e altura 10, deixando a resposta em função de pi.
2. Calcule a área lateral de um cilindro de raio 3 e altura 10, deixando a resposta em função de pi.
3. Calcule o volume de um cone de raio 3 e altura 4, deixando a resposta em função de pi.
4. Calcule o volume de uma esfera de raio 6, deixando a resposta em função de pi.
5. Calcule a geratriz de um cone de raio 6 e altura 8.

**Bloco B. Consolidação**

6. Calcule a área total de um cilindro de raio 3 e altura 10, deixando a resposta em função de pi.
7. Calcule a área total de um cone de raio 3 e altura 4, deixando a resposta em função de pi.
8. Um cilindro tem raio 5 e volume 100 vezes pi. Calcule a altura.
9. Uma esfera tem área 144 vezes pi. Calcule o raio e o volume, deixando o volume em função de pi.
10. Um cone tem raio 6 e geratriz 10. Calcule a altura e o volume, deixando o volume em função de
    pi.
11. Um cilindro tem raio 5 centímetros e altura 8 centímetros. Considerando pi igual a 3,14, calcule
    o volume em centímetros cúbicos.
12. Uma esfera de raio 3 está dentro de um cilindro de raio 3 e altura 6, encostando na superfície
    lateral e nas duas bases. Calcule o volume do espaço vazio, deixando a resposta em função de pi.
13. Um cilindro e um cone têm o mesmo raio 6 e a mesma altura 9. Calcule os dois volumes em função
    de pi e diga quantas vezes um é maior que o outro.

**Bloco C. Aprofundamento**

14. Um sólido é formado por um cone de raio 3 e altura 8 com uma semiesfera de raio 3 colada sobre a
    base do cone. Calcule o volume do sólido, deixando a resposta em função de pi.
15. Uma caixa de água tem a forma de um cilindro de raio 2 metros e altura 3 metros. Considerando pi
    igual a 3,14, calcule o volume em metros cúbicos e diga quantos litros a caixa comporta.
16. Um cone tem volume 96 vezes pi e altura 8. Calcule o raio e a geratriz desse cone.
17. Uma esfera de raio 6 é derretida e todo o material é usado para produzir esferas de raio 3.
    Quantas esferas se obtêm? Explique por que a resposta não é 2.
18. Um cilindro maciço de raio 5 e altura 12 é perfurado ao longo do eixo por um furo cilíndrico de
    raio 3 que atravessa de uma base à outra. Calcule o volume restante e a área total da peça, as
    duas em função de pi.

### Gabarito

1. 90 vezes pi.
2. 60 vezes pi.
3. 12 vezes pi.
4. 288 vezes pi.
5. 10.
6. 78 vezes pi. A área lateral é 60 vezes pi e cada base tem 9 vezes pi.
7. 24 vezes pi. A geratriz mede 5, a área lateral é 15 vezes pi e a base tem 9 vezes pi.
8. 4.
9. O raio mede 6 e o volume é 288 vezes pi.
10. A altura mede 8 e o volume é 96 vezes pi.
11. 628 centímetros cúbicos.
12. 18 vezes pi. O cilindro tem 54 vezes pi e a esfera tem 36 vezes pi.
13. O cilindro tem 324 vezes pi e o cone tem 108 vezes pi, ou seja, o cilindro vale o triplo.
14. 42 vezes pi. O cone contribui com 24 vezes pi e a semiesfera com 18 vezes pi.
15. 37,68 metros cúbicos, o que corresponde a 37680 litros.
16. O raio mede 6 e a geratriz mede 10.
17. 8 esferas. O raio caiu à metade, mas o volume depende do cubo do raio, então cada esfera pequena
    tem um oitavo do volume da grande.
18. O volume restante é 192 vezes pi e a área total é 224 vezes pi. A área soma a superfície externa
    de 120 vezes pi, a superfície do furo de 72 vezes pi e as duas coroas circulares, que juntas dão
    32 vezes pi.

## EN

### Explanation

#### The three round solids

A **cylinder** has two equal parallel circular bases. A **cone** has one circular base and a vertex,
and the **slant side** is the segment joining the vertex to a point on the rim of the base. A
**sphere** is the set of points lying at a fixed distance from the centre.

The three of them turn up in every package, tank, ice cream cone and ball, and most problems mix two
of them.

#### Cylinder

The volume follows the same idea as the prism, with a circular base:

the volume of a cylinder is pi times the radius squared times the height

Unrolling the lateral surface gives a rectangle whose base is the circumference of the circle and
whose height is the height of the cylinder. So the lateral area is 2 times pi times the radius times
the height, and the total area adds the two bases, each with area pi times the radius squared.

**Example 1.** A cylinder has radius 3 and height 10. Find the volume, the lateral area and the
total area.
The volume is pi times 9 times 10, that is, 90 times pi. The lateral area is 2 times pi times 3
times 10, which gives 60 times pi. Each base has area 9 times pi, so the total area is 78 times pi.

#### Cone

Just as the pyramid is one third of the prism, the cone is one third of the cylinder with the same
base and the same height:

the volume of a cone is one third of pi times the radius squared times the height

The radius, the height and the slant side form a right triangle, with the slant side playing the
part of the hypotenuse. The lateral area is pi times the radius times the slant side, and the total
area adds the base.

**Example 2.** A cone has radius 3 and height 4. Find the slant side, the volume and the total area.
The slant side is the square root of 9 plus 16, which gives 5. The volume is one third of pi times 9
times 4, that is, 12 times pi. The lateral area is pi times 3 times 5, which gives 15 times pi, and
adding the base of 9 times pi the total area is 24 times pi.

#### Sphere

The sphere has formulas of its own, worth keeping:

the volume of a sphere is four thirds of pi times the radius cubed
the area of a spherical surface is 4 times pi times the radius squared

**Example 3.** A sphere has radius 6. Find its volume and its area.
The volume is four thirds of pi times 216, which gives 288 times pi. The area is 4 times pi times
36, which gives 144 times pi.

#### Leaving it in terms of pi or approximating

While the problem is a geometry one, the answer in terms of pi is the honest one, because it is
exact. When the statement tells you to use 3.14, the answer becomes an approximate decimal, and the
instruction has to be written into the statement. Switching criteria halfway through is a guaranteed
source of disagreement.

#### Composite and hollowed pieces

A piece made of two solids has volume equal to the sum. A drilled piece has volume equal to the
difference. With area the care is the same: the contact surface disappears, and a hole adds the
inner surface.

**Example 4.** A solid is made of a cone of radius 3 and height 8 with a half sphere of radius 3
glued onto the base of the cone. Find the volume.
The cone has one third of pi times 9 times 8, that is, 24 times pi. The half sphere has half of four
thirds of pi times 27, which gives 18 times pi. The total is 42 times pi.

#### Common mistakes

**Using the height in place of the slant side.** The lateral area of a cone takes the slant side, not
the height. When the statement gives the height, the slant side comes first, by Pythagoras.

**Forgetting the third in the cone.** The same slip as with the pyramid, with the same effect of
tripling the answer.

**Raising the radius to the wrong power.** The volume of a sphere uses the cube of the radius, the
area uses the square.

**Confusing radius and diameter.** When the statement gives the diameter, it has to be halved before
any calculation.

### Exercises

**Block A. Fundamentals**

1. Find the volume of a cylinder of radius 3 and height 10, leaving your answer in terms of pi.
2. Find the lateral area of a cylinder of radius 3 and height 10, leaving your answer in terms of pi.
3. Find the volume of a cone of radius 3 and height 4, leaving your answer in terms of pi.
4. Find the volume of a sphere of radius 6, leaving your answer in terms of pi.
5. Find the slant side of a cone of radius 6 and height 8.

**Block B. Building up**

6. Find the total area of a cylinder of radius 3 and height 10, leaving your answer in terms of pi.
7. Find the total area of a cone of radius 3 and height 4, leaving your answer in terms of pi.
8. A cylinder has radius 5 and volume 100 times pi. Find the height.
9. A sphere has area 144 times pi. Find the radius and the volume, leaving the volume in terms of pi.
10. A cone has radius 6 and slant side 10. Find the height and the volume, leaving the volume in
    terms of pi.
11. A cylinder has radius 5 centimetres and height 8 centimetres. Taking pi as 3.14, find the volume
    in cubic centimetres.
12. A sphere of radius 3 sits inside a cylinder of radius 3 and height 6, touching the lateral
    surface and both bases. Find the volume of the empty space, leaving your answer in terms of pi.
13. A cylinder and a cone have the same radius 6 and the same height 9. Find both volumes in terms
    of pi and say how many times one is larger than the other.

**Block C. Going further**

14. A solid is made of a cone of radius 3 and height 8 with a half sphere of radius 3 glued onto the
    base of the cone. Find the volume of the solid, leaving your answer in terms of pi.
15. A water tank has the shape of a cylinder of radius 2 metres and height 3 metres. Taking pi as
    3.14, find the volume in cubic metres and say how many litres the tank holds.
16. A cone has volume 96 times pi and height 8. Find the radius and the slant side of that cone.
17. A sphere of radius 6 is melted down and all the material is used to make spheres of radius 3.
    How many spheres do you get? Explain why the answer is not 2.
18. A solid cylinder of radius 5 and height 12 is drilled along its axis by a cylindrical hole of
    radius 3 running from one base to the other. Find the remaining volume and the total area of the
    piece, both in terms of pi.

### Answer key

1. 90 times pi.
2. 60 times pi.
3. 12 times pi.
4. 288 times pi.
5. 10.
6. 78 times pi. The lateral area is 60 times pi and each base has 9 times pi.
7. 24 times pi. The slant side is 5, the lateral area is 15 times pi and the base has 9 times pi.
8. 4.
9. The radius is 6 and the volume is 288 times pi.
10. The height is 8 and the volume is 96 times pi.
11. 628 cubic centimetres.
12. 18 times pi. The cylinder has 54 times pi and the sphere has 36 times pi.
13. The cylinder has 324 times pi and the cone has 108 times pi, so the cylinder is three times as
    large.
14. 42 times pi. The cone contributes 24 times pi and the half sphere contributes 18 times pi.
15. 37.68 cubic metres, which corresponds to 37680 litres.
16. The radius is 6 and the slant side is 10.
17. 8 spheres. The radius dropped to half, but the volume depends on the cube of the radius, so each
    small sphere has one eighth of the volume of the large one.
18. The remaining volume is 192 times pi and the total area is 224 times pi. The area adds the outer
    surface of 120 times pi, the surface of the hole of 72 times pi and the two circular rings,
    which together give 32 times pi.

## VERIFICACAO

```python
X1: pi*3**2*10 == 90*pi and 2*pi*3*10 == 60*pi and 2*pi*3*10 + 2*pi*3**2 == 78*pi
X2: sqrt(3**2 + 4**2) == 5 and Rational(1,3)*pi*3**2*4 == 12*pi and pi*3*5 + pi*3**2 == 24*pi
X3: Rational(4,3)*pi*6**3 == 288*pi and 4*pi*6**2 == 144*pi
X4: Rational(1,3)*pi*3**2*8 + Rational(2,3)*pi*3**3 == 42*pi
E1: pi*3**2*10 == 90*pi
E2: 2*pi*3*10 == 60*pi
E3: Rational(1,3)*pi*3**2*4 == 12*pi
E4: Rational(4,3)*pi*6**3 == 288*pi
E5: sqrt(6**2 + 8**2) == 10
E6: 2*pi*3*10 + 2*pi*3**2 == 78*pi and pi*3**2 == 9*pi
E7: sqrt(3**2 + 4**2) == 5 and pi*3*5 == 15*pi and pi*3*5 + pi*3**2 == 24*pi
E8: solve(Eq(pi*5**2*x, 100*pi), x) == [4]
E9: solve(Eq(4*pi*x**2, 144*pi), x) == [-6, 6] and Rational(4,3)*pi*6**3 == 288*pi
E10: sqrt(10**2 - 6**2) == 8 and Rational(1,3)*pi*6**2*8 == 96*pi
E11: Rational(314,100)*5**2*8 == 628
E12: pi*3**2*6 == 54*pi and Rational(4,3)*pi*3**3 == 36*pi and 54*pi - 36*pi == 18*pi
E13: pi*6**2*9 == 324*pi and Rational(1,3)*pi*6**2*9 == 108*pi and 324 == 3*108
E14: Rational(1,3)*pi*3**2*8 == 24*pi and Rational(2,3)*pi*3**3 == 18*pi and 24*pi + 18*pi == 42*pi
E15: Rational(314,100)*2**2*3 == Rational(3768,100) and Rational(3768,100)*1000 == 37680
E16: solve(Eq(Rational(1,3)*pi*x**2*8, 96*pi), x) == [-6, 6] and sqrt(6**2 + 8**2) == 10
E17: Rational(4,3)*pi*6**3 / (Rational(4,3)*pi*3**3) == 8
E18: pi*5**2*12 - pi*3**2*12 == 192*pi and 2*pi*5*12 == 120*pi and 2*pi*3*12 == 72*pi and 2*(pi*5**2 - pi*3**2) == 32*pi and 120*pi + 72*pi + 32*pi == 224*pi
```
