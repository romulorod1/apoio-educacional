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

V = π · r^{2} · h

onde V é o volume, r o raio da base e h a altura.

Planificando a superfície lateral, aparece um retângulo cuja base é o comprimento da circunferência
e cuja altura é a altura do cilindro. Então a área lateral é A_{l} = 2 · π · r · h, e a área total
soma as duas bases, cada uma com área π · r^{2}:

A_{t} = 2 · π · r · h + 2 · π · r^{2}

**Exemplo 1.** Um cilindro tem raio 3 e altura 10. Calcular volume, área lateral e área total.
O volume é V = π · 9 · 10 = 90π. A área lateral é A_{l} = 2 · π · 3 · 10 = 60π. Cada base tem área
9π, então a área total é A_{t} = 78π.

#### Cone

Assim como a pirâmide vale um terço do prisma, o cone vale um terço do cilindro de mesma base e
mesma altura:

V = (1/3) · π · r^{2} · h

O raio, a altura e a geratriz g formam um triângulo retângulo, com a geratriz no papel de
hipotenusa, o que dá g^{2} = r^{2} + h^{2}. A área lateral é A_{l} = π · r · g, e a área total soma
a base:

A_{t} = π · r · g + π · r^{2}

**Exemplo 2.** Um cone tem raio 3 e altura 4. Calcular a geratriz, o volume e a área total.
A geratriz é g = √(9 + 16) = 5. O volume é V = (1/3) · π · 9 · 4 = 12π. A área lateral é
A_{l} = π · 3 · 5 = 15π, e somando a base de 9π a área total é A_{t} = 24π.

#### Esfera

A esfera tem fórmulas próprias, que valem a pena guardar:

V = (4/3) · π · r^{3}

A = 4 · π · r^{2}

onde V é o volume da esfera e A a área da superfície esférica.

**Exemplo 3.** Uma esfera tem raio 6. Calcular volume e área.
O volume é V = (4/3) · π · 216 = 288π. A área é A = 4 · π · 36 = 144π.

#### Deixar em função de π ou aproximar

Enquanto o problema é de geometria, a resposta em função de π é a mais honesta, porque é exata.
Quando o enunciado manda usar 3,14, a resposta vira um número decimal aproximado, e aí a instrução
precisa estar escrita no enunciado. Trocar de critério no meio da conta é fonte garantida de
divergência.

#### Sólidos compostos e peças vazadas

Peça formada por dois sólidos tem volume igual à soma. Peça furada tem volume igual à diferença. Na
área, o cuidado continua o mesmo: a superfície de contato some, e um furo acrescenta a superfície
interna.

**Exemplo 4.** Um sólido é formado por um cone de raio 3 e altura 8 com uma semiesfera de raio 3
colada sobre a base do cone. Calcular o volume.
O cone tem (1/3) · π · 9 · 8 = 24π. A semiesfera tem (1/2) · (4/3) · π · 27 = 18π. O total é
24π + 18π = 42π.

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

1. Calcule o volume de um cilindro de raio 3 e altura 10, deixando a resposta em função de π.
2. Calcule a área lateral de um cilindro de raio 3 e altura 10, deixando a resposta em função de π.
3. Calcule o volume de um cone de raio 3 e altura 4, deixando a resposta em função de π.
4. Calcule o volume de uma esfera de raio 6, deixando a resposta em função de π.
5. Calcule a geratriz de um cone de raio 6 e altura 8.

**Bloco B. Consolidação**

6. Calcule a área total de um cilindro de raio 3 e altura 10, deixando a resposta em função de π.
7. Calcule a área total de um cone de raio 3 e altura 4, deixando a resposta em função de π.
8. Um cilindro tem raio 5 e volume 100π. Calcule a altura.
9. Uma esfera tem área 144π. Calcule o raio e o volume, deixando o volume em função de π.
10. Um cone tem raio 6 e geratriz 10. Calcule a altura e o volume, deixando o volume em função de π.
11. Um cilindro tem raio 5 centímetros e altura 8 centímetros. Considerando π = 3,14, calcule o
    volume em centímetros cúbicos.
12. Uma esfera de raio 3 está dentro de um cilindro de raio 3 e altura 6, encostando na superfície
    lateral e nas duas bases. Calcule o volume do espaço vazio, deixando a resposta em função de π.
13. Um cilindro e um cone têm o mesmo raio 6 e a mesma altura 9. Calcule os dois volumes em função
    de π e diga quantas vezes um é maior que o outro.

**Bloco C. Aprofundamento**

14. Um sólido é formado por um cone de raio 3 e altura 8 com uma semiesfera de raio 3 colada sobre a
    base do cone. Calcule o volume do sólido, deixando a resposta em função de π.
15. Uma caixa de água tem a forma de um cilindro de raio 2 metros e altura 3 metros. Considerando
    π = 3,14, calcule o volume em metros cúbicos e diga quantos litros a caixa comporta.
16. Um cone tem volume 96π e altura 8. Calcule o raio e a geratriz desse cone.
17. Uma esfera de raio 6 é derretida e todo o material é usado para produzir esferas de raio 3.
    Quantas esferas se obtêm? Explique por que a resposta não é 2.
18. Um cilindro maciço de raio 5 e altura 12 é perfurado ao longo do eixo por um furo cilíndrico de
    raio 3 que atravessa de uma base à outra. Calcule o volume restante e a área total da peça, as
    duas em função de π.

### Gabarito

1. 90π.
2. 60π.
3. 12π.
4. 288π.
5. 10.
6. 78π. A área lateral é 60π e cada base tem 9π.
7. 24π. A geratriz mede 5, a área lateral é 15π e a base tem 9π.
8. 4.
9. O raio mede 6 e o volume é 288π.
10. A altura mede 8 e o volume é 96π.
11. 628 centímetros cúbicos.
12. 18π. O cilindro tem 54π e a esfera tem 36π.
13. O cilindro tem 324π e o cone tem 108π, ou seja, o cilindro vale o triplo.
14. 42π. O cone contribui com 24π e a semiesfera com 18π.
15. 37,68 metros cúbicos, o que corresponde a 37680 litros.
16. O raio mede 6 e a geratriz mede 10.
17. 8 esferas. O raio caiu à metade, mas o volume depende do cubo do raio, então cada esfera pequena
    tem um oitavo do volume da grande.
18. O volume restante é 192π e a área total é 224π. A área soma a superfície externa de 120π, a
    superfície do furo de 72π e as duas coroas circulares, que juntas dão 32π.

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

V = π · r^{2} · h

where V is the volume, r the radius of the base and h the height.

Unrolling the lateral surface gives a rectangle whose base is the circumference of the circle and
whose height is the height of the cylinder. So the lateral area is A_{l} = 2 · π · r · h, and the
total area adds the two bases, each with area π · r^{2}:

A_{t} = 2 · π · r · h + 2 · π · r^{2}

**Example 1.** A cylinder has radius 3 and height 10. Find the volume, the lateral area and the
total area.
The volume is V = π · 9 · 10 = 90π. The lateral area is A_{l} = 2 · π · 3 · 10 = 60π. Each base has
area 9π, so the total area is A_{t} = 78π.

#### Cone

Just as the pyramid is one third of the prism, the cone is one third of the cylinder with the same
base and the same height:

V = (1/3) · π · r^{2} · h

The radius, the height and the slant side g form a right triangle, with the slant side playing the
part of the hypotenuse, which gives g^{2} = r^{2} + h^{2}. The lateral area is A_{l} = π · r · g,
and the total area adds the base:

A_{t} = π · r · g + π · r^{2}

**Example 2.** A cone has radius 3 and height 4. Find the slant side, the volume and the total area.
The slant side is g = √(9 + 16) = 5. The volume is V = (1/3) · π · 9 · 4 = 12π. The lateral area is
A_{l} = π · 3 · 5 = 15π, and adding the base of 9π the total area is A_{t} = 24π.

#### Sphere

The sphere has formulas of its own, worth keeping:

V = (4/3) · π · r^{3}

A = 4 · π · r^{2}

where V is the volume of the sphere and A the area of the spherical surface.

**Example 3.** A sphere has radius 6. Find its volume and its area.
The volume is V = (4/3) · π · 216 = 288π. The area is A = 4 · π · 36 = 144π.

#### Leaving it in terms of π or approximating

While the problem is a geometry one, the answer in terms of π is the honest one, because it is
exact. When the statement tells you to use 3.14, the answer becomes an approximate decimal, and the
instruction has to be written into the statement. Switching criteria halfway through is a guaranteed
source of disagreement.

#### Composite and hollowed pieces

A piece made of two solids has volume equal to the sum. A drilled piece has volume equal to the
difference. With area the care is the same: the contact surface disappears, and a hole adds the
inner surface.

**Example 4.** A solid is made of a cone of radius 3 and height 8 with a half sphere of radius 3
glued onto the base of the cone. Find the volume.
The cone has (1/3) · π · 9 · 8 = 24π. The half sphere has (1/2) · (4/3) · π · 27 = 18π. The total is
24π + 18π = 42π.

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

1. Find the volume of a cylinder of radius 3 and height 10, leaving your answer in terms of π.
2. Find the lateral area of a cylinder of radius 3 and height 10, leaving your answer in terms of π.
3. Find the volume of a cone of radius 3 and height 4, leaving your answer in terms of π.
4. Find the volume of a sphere of radius 6, leaving your answer in terms of π.
5. Find the slant side of a cone of radius 6 and height 8.

**Block B. Building up**

6. Find the total area of a cylinder of radius 3 and height 10, leaving your answer in terms of π.
7. Find the total area of a cone of radius 3 and height 4, leaving your answer in terms of π.
8. A cylinder has radius 5 and volume 100π. Find the height.
9. A sphere has area 144π. Find the radius and the volume, leaving the volume in terms of π.
10. A cone has radius 6 and slant side 10. Find the height and the volume, leaving the volume in
    terms of π.
11. A cylinder has radius 5 centimetres and height 8 centimetres. Taking π = 3.14, find the volume
    in cubic centimetres.
12. A sphere of radius 3 sits inside a cylinder of radius 3 and height 6, touching the lateral
    surface and both bases. Find the volume of the empty space, leaving your answer in terms of π.
13. A cylinder and a cone have the same radius 6 and the same height 9. Find both volumes in terms
    of π and say how many times one is larger than the other.

**Block C. Going further**

14. A solid is made of a cone of radius 3 and height 8 with a half sphere of radius 3 glued onto the
    base of the cone. Find the volume of the solid, leaving your answer in terms of π.
15. A water tank has the shape of a cylinder of radius 2 metres and height 3 metres. Taking
    π = 3.14, find the volume in cubic metres and say how many litres the tank holds.
16. A cone has volume 96π and height 8. Find the radius and the slant side of that cone.
17. A sphere of radius 6 is melted down and all the material is used to make spheres of radius 3.
    How many spheres do you get? Explain why the answer is not 2.
18. A solid cylinder of radius 5 and height 12 is drilled along its axis by a cylindrical hole of
    radius 3 running from one base to the other. Find the remaining volume and the total area of the
    piece, both in terms of π.

### Answer key

1. 90π.
2. 60π.
3. 12π.
4. 288π.
5. 10.
6. 78π. The lateral area is 60π and each base has 9π.
7. 24π. The slant side is 5, the lateral area is 15π and the base has 9π.
8. 4.
9. The radius is 6 and the volume is 288π.
10. The height is 8 and the volume is 96π.
11. 628 cubic centimetres.
12. 18π. The cylinder has 54π and the sphere has 36π.
13. The cylinder has 324π and the cone has 108π, so the cylinder is three times as large.
14. 42π. The cone contributes 24π and the half sphere contributes 18π.
15. 37.68 cubic metres, which corresponds to 37680 litres.
16. The radius is 6 and the slant side is 10.
17. 8 spheres. The radius dropped to half, but the volume depends on the cube of the radius, so each
    small sphere has one eighth of the volume of the large one.
18. The remaining volume is 192π and the total area is 224π. The area adds the outer surface of
    120π, the surface of the hole of 72π and the two circular rings, which together give 32π.

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
