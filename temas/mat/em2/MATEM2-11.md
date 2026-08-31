---
id: MATEM2-11
serie: em2
unidade: geometria
titulo_pt: Prismas e pirâmides
titulo_en: Prisms and pyramids
resumo_pt: Calcular área e volume de prismas e pirâmides, achar alturas e arestas a partir do volume e resolver sólidos compostos.
resumo_en: Working out areas and volumes of prisms and pyramids, finding heights and edges from a given volume, and handling composite solids.
prerequisitos: [MAT09-07]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### Duas famílias de sólidos

Um **prisma** tem duas bases iguais e paralelas, ligadas por faces laterais que são paralelogramos.
Quando as arestas laterais são perpendiculares às bases, o prisma é reto e as faces laterais são
retângulos. O nome do prisma vem da base: base triangular dá prisma triangular, base hexagonal dá
prisma hexagonal.

Uma **pirâmide** tem uma única base e um vértice fora do plano dela, ligado a todos os vértices da
base por faces triangulares. Numa pirâmide regular, a base é um polígono regular e o vértice fica
exatamente acima do centro da base.

Duas fórmulas concentram quase tudo:

o volume do prisma é a área da base vezes a altura
o volume da pirâmide é um terço da área da base vezes a altura

O terço não é convenção: uma pirâmide com a mesma base e a mesma altura de um prisma cabe três vezes
dentro dele.

#### Áreas

A **área lateral** é a soma das áreas das faces que não são base. Num prisma reto, ela é o perímetro
da base vezes a altura, o que evita somar retângulo por retângulo. A **área total** é a área lateral
mais a área das bases: duas bases no prisma, uma só na pirâmide.

**Exemplo 1.** Um paralelepípedo reto retângulo tem dimensões 3, 4 e 5. Calcular volume, área total
e diagonal.
O volume é 3 vezes 4 vezes 5, que dá 60. A área total é o dobro da soma de 12, 15 e 20, o que dá 94.
A diagonal do bloco sai da raiz da soma dos quadrados das três dimensões, ou seja, a raiz de 9 mais
16 mais 25, que é a raiz de 50, isto é, 5 vezes a raiz de 2.

A diagonal do bloco merece atenção: ela é o teorema de Pitágoras aplicado duas vezes, primeiro na
base e depois no triângulo formado pela diagonal da base, a altura e a diagonal do sólido.

#### Bases que exigem uma fórmula própria

Quando a base é um triângulo equilátero de lado L, sua área é L ao quadrado vezes a raiz de 3,
dividido por 4. Quando a base é um hexágono regular de lado L, ela vale seis vezes essa mesma área,
porque o hexágono regular se divide em seis triângulos equiláteros.

**Exemplo 2.** Um prisma reto tem base triangular equilátera de lado 6 e altura 10. Calcular o
volume.
A área da base é 36 vezes a raiz de 3, dividido por 4, que dá 9 vezes a raiz de 3. Multiplicando
pela altura 10, o volume é 90 vezes a raiz de 3.

#### Os triângulos escondidos na pirâmide

Numa pirâmide regular de base quadrada, três triângulos retângulos resolvem tudo:

- altura, metade do lado da base e **apótema da face lateral**, que é a altura de uma face
  triangular.
- altura, metade da diagonal da base e **aresta lateral**.
- apótema da face, metade do lado da base e aresta lateral.

**Exemplo 3.** Uma pirâmide regular tem base quadrada de lado 6 e altura 4. Calcular o volume, o
apótema da face lateral e a área total.
O volume é um terço de 36 vezes 4, que dá 48. O apótema da face sai da raiz de 16 mais 9, que é 5.
Cada face lateral tem área 6 vezes 5 dividido por 2, ou seja, 15, e as quatro somam 60. Com a base
de 36, a área total é 96.

#### Sólidos compostos

Quando a peça é feita de partes coladas, o volume é a soma dos volumes, e quando falta um pedaço, o
volume é a diferença. O cuidado é com a área: as faces que ficaram escondidas na colagem não entram
na área da peça montada.

**Exemplo 4.** Um bloco tem a forma de um cubo de aresta 6 com uma pirâmide de base quadrada e
altura 4 apoiada sobre a face superior, com a base da pirâmide coincidindo com essa face. Calcular o
volume.
O cubo tem volume 216 e a pirâmide tem um terço de 36 vezes 4, que dá 48. O total é 264.

#### Erros comuns

**Esquecer o terço na pirâmide.** É o erro mais frequente, e ele multiplica a resposta por três.

**Confundir altura da pirâmide com apótema da face.** A altura vai até o centro da base; o apótema
da face vai até o meio de uma aresta da base. Eles são catetos e hipotenusa de um mesmo triângulo,
nunca são iguais.

**Somar a área das faces coladas.** Em sólido composto, a superfície de contato desaparece.

**Misturar unidades.** Comprimento em centímetros com volume em litros só funciona depois da
conversão. Um decímetro cúbico é um litro.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule o volume de um paralelepípedo reto retângulo de dimensões 3, 4 e 5.
2. Calcule a área total de um cubo de aresta 5.
3. Calcule o volume de um cubo de aresta 4.
4. Calcule o volume de uma pirâmide de base quadrada de lado 6 e altura 4.
5. Calcule a diagonal de um paralelepípedo reto retângulo de dimensões 3, 4 e 12.

**Bloco B. Consolidação**

6. Um prisma reto tem base triangular equilátera de lado 6 e altura 10. Calcule o volume, deixando a
   resposta em forma de raiz.
7. Um prisma reto de base quadrada tem lado da base 5 e volume 200. Calcule a altura.
8. Calcule a área total de um paralelepípedo reto retângulo de dimensões 3, 4 e 5.
9. Uma pirâmide regular tem base quadrada de lado 6 e altura 4. Calcule o apótema da face lateral e
   a área total.
10. Um prisma reto tem base hexagonal regular de lado 4 e altura 10. Calcule o volume, deixando a
    resposta em forma de raiz.
11. Uma pirâmide de base quadrada tem volume 100 e altura 12. Calcule o lado da base.
12. A diagonal de um cubo mede 6 vezes a raiz de 3. Calcule a aresta e o volume desse cubo.
13. Um prisma reto tem base retangular de 3 por 8 e altura 5. Calcule a área lateral e a área total.

**Bloco C. Aprofundamento**

14. Um bloco de concreto tem a forma de um cubo de aresta 6 com uma pirâmide de base quadrada e
    altura 4 apoiada sobre a face superior, com a base da pirâmide coincidindo com essa face.
    Calcule o volume do bloco.
15. De um cubo de aresta 6 retira-se um prisma reto de base quadrada de lado 2, que atravessa o cubo
    de uma face à face oposta, com as arestas paralelas às arestas do cubo. Calcule o volume que
    resta.
16. Uma pirâmide regular tem base quadrada de lado 12 e aresta lateral 11. Calcule a altura e o
    volume dessa pirâmide.
17. Um prisma reto e uma pirâmide têm a mesma base quadrada de lado 6 e a mesma altura 10. Calcule
    os dois volumes e explique, sem usar as fórmulas prontas, por que a razão entre eles não depende
    das medidas escolhidas.
18. Um recipiente tem a forma de um prisma reto de base quadrada de lado 20 centímetros e altura 30
    centímetros, e está com água até a altura de 12 centímetros. Um cubo maciço de aresta 10
    centímetros é colocado no fundo do recipiente e fica totalmente submerso. Calcule a nova altura
    da água.

### Gabarito

1. 60.
2. 150.
3. 64.
4. 48.
5. 13.
6. 90 vezes a raiz de 3. A área da base é 9 vezes a raiz de 3.
7. 8.
8. 94.
9. O apótema da face lateral mede 5 e a área total é 96. A área lateral é 60 e a base tem área 36.
10. 240 vezes a raiz de 3. A área da base é 24 vezes a raiz de 3.
11. 5. A área da base é o triplo do volume dividido pela altura, o que dá 25.
12. A aresta mede 6 e o volume é 216.
13. A área lateral é 110 e a área total é 158.
14. 264. O cubo contribui com 216 e a pirâmide com 48.
15. 192. O furo tem volume 24.
16. A altura é 7 e o volume é 336. A metade da diagonal da base vale 6 vezes a raiz de 2, cujo
    quadrado é 72, e 121 menos 72 dá 49.
17. O prisma tem volume 360 e a pirâmide tem volume 120, ou seja, o prisma vale o triplo. A razão
    não depende das medidas porque as duas fórmulas usam a mesma área de base e a mesma altura, e a
    da pirâmide traz o fator um terço qualquer que seja o sólido.
18. 14,5 centímetros. O volume de água é 4800, o cubo acrescenta 1000, e a soma dividida pela área
    da base, que é 400, dá a nova altura.

## EN

### Explanation

#### Two families of solids

A **prism** has two equal parallel bases joined by lateral faces that are parallelograms. When the
lateral edges are perpendicular to the bases, the prism is a right prism and the lateral faces are
rectangles. The prism takes its name from the base: a triangular base gives a triangular prism, a
hexagonal base gives a hexagonal prism.

A **pyramid** has a single base and one vertex off the plane of that base, joined to every vertex of
the base by triangular faces. In a regular pyramid, the base is a regular polygon and the vertex
sits exactly above the centre of the base.

Two formulas carry almost everything:

the volume of a prism is the area of the base times the height
the volume of a pyramid is one third of the area of the base times the height

The third is not a convention: a pyramid with the same base and the same height as a prism fits
three times inside it.

#### Areas

The **lateral area** is the sum of the areas of the faces that are not bases. In a right prism it is
the perimeter of the base times the height, which saves you adding rectangle by rectangle. The
**total area** is the lateral area plus the area of the bases: two bases in a prism, only one in a
pyramid.

**Example 1.** A rectangular block has dimensions 3, 4 and 5. Find its volume, total area and
diagonal.
The volume is 3 times 4 times 5, which gives 60. The total area is twice the sum of 12, 15 and 20,
which gives 94. The diagonal of the block comes from the square root of the sum of the squares of
the three dimensions, that is, the square root of 9 plus 16 plus 25, which is the square root of 50,
that is, 5 times the square root of 2.

The diagonal of the block deserves attention: it is the Pythagorean theorem used twice, first on the
base and then on the triangle formed by the diagonal of the base, the height and the diagonal of the
solid.

#### Bases that call for a formula of their own

When the base is an equilateral triangle of side L, its area is L squared times the square root of
3, divided by 4. When the base is a regular hexagon of side L, it is six times that same area,
because a regular hexagon splits into six equilateral triangles.

**Example 2.** A right prism has an equilateral triangular base of side 6 and height 10. Find the
volume.
The area of the base is 36 times the square root of 3, divided by 4, which gives 9 times the square
root of 3. Multiplying by the height 10, the volume is 90 times the square root of 3.

#### The triangles hidden in a pyramid

In a regular pyramid with a square base, three right triangles settle everything:

- the height, half the side of the base and the **slant height of a lateral face**, which is the
  height of one triangular face.
- the height, half the diagonal of the base and the **lateral edge**.
- the slant height of a face, half the side of the base and the lateral edge.

**Example 3.** A regular pyramid has a square base of side 6 and height 4. Find the volume, the
slant height of a lateral face and the total area.
The volume is one third of 36 times 4, which gives 48. The slant height comes from the square root
of 16 plus 9, which is 5. Each lateral face has area 6 times 5 divided by 2, that is, 15, and the
four of them add to 60. With the base of 36, the total area is 96.

#### Composite solids

When the piece is made of parts glued together, the volume is the sum of the volumes, and when a
piece is missing, the volume is the difference. The care is with the area: faces hidden by the
joining do not count in the area of the assembled piece.

**Example 4.** A block has the shape of a cube of edge 6 with a pyramid with a square base and
height 4 resting on the top face, the base of the pyramid coinciding with that face. Find the volume.
The cube has volume 216 and the pyramid has one third of 36 times 4, which gives 48. The total
is 264.

#### Common mistakes

**Forgetting the third in the pyramid.** It is the most frequent error, and it multiplies the answer
by three.

**Confusing the height of the pyramid with the slant height of a face.** The height runs to the
centre of the base; the slant height runs to the middle of an edge of the base. They are legs and
hypotenuse of one right triangle, never equal.

**Adding the area of the glued faces.** In a composite solid, the contact surface disappears.

**Mixing units.** Length in centimetres with volume in litres only works after converting. One cubic
decimetre is one litre.

### Exercises

**Block A. Fundamentals**

1. Find the volume of a rectangular block with dimensions 3, 4 and 5.
2. Find the total area of a cube of edge 5.
3. Find the volume of a cube of edge 4.
4. Find the volume of a pyramid with a square base of side 6 and height 4.
5. Find the diagonal of a rectangular block with dimensions 3, 4 and 12.

**Block B. Building up**

6. A right prism has an equilateral triangular base of side 6 and height 10. Find the volume,
   leaving your answer in surd form.
7. A right prism with a square base has base side 5 and volume 200. Find the height.
8. Find the total area of a rectangular block with dimensions 3, 4 and 5.
9. A regular pyramid has a square base of side 6 and height 4. Find the slant height of a lateral
   face and the total area.
10. A right prism has a regular hexagonal base of side 4 and height 10. Find the volume, leaving
    your answer in surd form.
11. A pyramid with a square base has volume 100 and height 12. Find the side of the base.
12. The diagonal of a cube measures 6 times the square root of 3. Find the edge and the volume of
    that cube.
13. A right prism has a rectangular base of 3 by 8 and height 5. Find the lateral area and the total
    area.

**Block C. Going further**

14. A concrete block has the shape of a cube of edge 6 with a pyramid with a square base and height
    4 resting on the top face, the base of the pyramid coinciding with that face. Find the volume of
    the block.
15. From a cube of edge 6 a right prism with a square base of side 2 is removed, running through the
    cube from one face to the opposite one, with its edges parallel to the edges of the cube. Find
    the volume that is left.
16. A regular pyramid has a square base of side 12 and lateral edge 11. Find the height and the
    volume of that pyramid.
17. A right prism and a pyramid have the same square base of side 6 and the same height 10. Find the
    two volumes and explain, without leaning on the ready made formulas, why the ratio between them
    does not depend on the measurements chosen.
18. A container has the shape of a right prism with a square base of side 20 centimetres and height
    30 centimetres, and holds water up to a height of 12 centimetres. A solid cube of edge 10
    centimetres is placed on the bottom of the container and is fully submerged. Find the new height
    of the water.

### Answer key

1. 60.
2. 150.
3. 64.
4. 48.
5. 13.
6. 90 times the square root of 3. The area of the base is 9 times the square root of 3.
7. 8.
8. 94.
9. The slant height of a lateral face is 5 and the total area is 96. The lateral area is 60 and the
   base has area 36.
10. 240 times the square root of 3. The area of the base is 24 times the square root of 3.
11. 5. The area of the base is three times the volume divided by the height, which gives 25.
12. The edge is 6 and the volume is 216.
13. The lateral area is 110 and the total area is 158.
14. 264. The cube contributes 216 and the pyramid contributes 48.
15. 192. The hole has volume 24.
16. The height is 7 and the volume is 336. Half the diagonal of the base is 6 times the square root
    of 2, whose square is 72, and 121 minus 72 gives 49.
17. The prism has volume 360 and the pyramid has volume 120, so the prism is three times as large.
    The ratio does not depend on the measurements because both formulas use the same base area and
    the same height, and the one for the pyramid carries the factor one third whatever the solid is.
18. 14.5 centimetres. The volume of water is 4800, the cube adds 1000, and that sum divided by the
    base area, which is 400, gives the new height.

## VERIFICACAO

```python
X1: 3*4*5 == 60 and 2*(3*4 + 3*5 + 4*5) == 94 and sqrt(3**2 + 4**2 + 5**2) == 5*sqrt(2)
X2: (sqrt(3)/4)*6**2 == 9*sqrt(3) and (sqrt(3)/4)*6**2*10 == 90*sqrt(3)
X3: Rational(1,3)*6**2*4 == 48 and sqrt(4**2 + 3**2) == 5 and 4*(6*5/2) == 60 and 36 + 60 == 96
X4: 6**3 + Rational(1,3)*6**2*4 == 264
E1: 3*4*5 == 60
E2: 6*5**2 == 150
E3: 4**3 == 64
E4: Rational(1,3)*6**2*4 == 48
E5: sqrt(3**2 + 4**2 + 12**2) == 13
E6: (sqrt(3)/4)*6**2*10 == 90*sqrt(3) and (sqrt(3)/4)*6**2 == 9*sqrt(3)
E7: solve(Eq(5**2*x, 200), x) == [8]
E8: 2*(3*4 + 3*5 + 4*5) == 94
E9: sqrt(4**2 + 3**2) == 5 and 36 + 4*(6*5/2) == 96 and 4*(6*5/2) == 60
E10: 6*(sqrt(3)/4)*4**2*10 == 240*sqrt(3) and 6*(sqrt(3)/4)*4**2 == 24*sqrt(3)
E11: solve(Eq(Rational(1,3)*x**2*12, 100), x) == [-5, 5] and Rational(3*100,12) == 25
E12: solve(Eq(x*sqrt(3), 6*sqrt(3)), x) == [6] and 6**3 == 216
E13: 2*(3+8)*5 == 110 and 110 + 2*3*8 == 158
E14: 6**3 + Rational(1,3)*6**2*4 == 264 and 6**3 == 216
E15: 6**3 - 2**2*6 == 192 and 2**2*6 == 24
E16: sqrt(11**2 - (6*sqrt(2))**2) == 7 and Rational(1,3)*12**2*7 == 336 and (6*sqrt(2))**2 == 72 and 121 - 72 == 49
E17: 6**2*10 == 360 and Rational(1,3)*6**2*10 == 120 and 360 == 3*120
E18: 20**2*12 == 4800 and Rational(4800 + 10**3, 20**2) == Rational(29,2) and Rational(29,2) == Rational(145,10)
```
