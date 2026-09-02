---
id: MATEM2-03
serie: em2
unidade: geometria
titulo_pt: Lei dos senos e lei dos cossenos
titulo_en: Law of sines and law of cosines
resumo_pt: Resolver triângulos quaisquer, escolhendo entre a lei dos senos e a lei dos cossenos conforme os dados disponíveis.
resumo_en: Solving any triangle, choosing between the law of sines and the law of cosines according to the data available.
prerequisitos: [MATEM2-01]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### O problema que essas leis resolvem

No triângulo retângulo tudo é fácil: seno, cosseno e tangente ligam lados e ângulos de imediato. O
problema é que a maioria dos triângulos do mundo não tem ângulo reto. Um terreno, uma travessia de
rio, a posição de dois barcos que partiram do mesmo porto: nada disso vem com ângulo reto de
presente.

As duas leis deste tema fazem por um triângulo qualquer o que a trigonometria já fazia pelo
retângulo. Elas resolvem o triângulo, isto é, permitem achar todos os lados e todos os ângulos a
partir de poucos dados.

#### A lei dos senos

Num triângulo qualquer, cada lado é proporcional ao seno do ângulo oposto a ele, e a razão é sempre
a mesma:

a / sen(A) = b / sen(B) = c / sen(C)

onde a, b e c são os lados e A, B e C os ângulos opostos a eles, o lado a oposto ao ângulo A e assim
por diante. Essa razão comum tem um significado geométrico bonito: ela vale o dobro do raio da
circunferência circunscrita ao triângulo.

**Quando usar.** Quando o dado disponível é um par formado por um lado e o ângulo oposto a ele, mais
um outro lado ou um outro ângulo.

**Exemplo 1.** Num triângulo, o ângulo A mede 30°, o ângulo B mede 45° e o lado oposto ao ângulo A
mede 8. Achar o lado oposto ao ângulo B.
Pela lei dos senos, b = 8 · sen(45°) / sen(30°). Como sen(45°) = √2/2 e sen(30°) = 1/2, o resultado
é 8√2.

#### A lei dos cossenos

Ela é uma generalização do teorema de Pitágoras:

a^{2} = b^{2} + c^{2} - 2 · b · c · cos(A)

onde A é o ângulo oposto ao lado a.

O termo com o cosseno é a correção que aparece quando o ângulo deixa de ser reto. Se o ângulo A for
reto, o cosseno é zero, o termo some, e sobra exatamente o teorema de Pitágoras.

**Quando usar.** Em dois casos. Primeiro, quando se conhecem dois lados e o ângulo entre eles, e se
quer o terceiro lado. Segundo, quando se conhecem os três lados e se quer um ângulo.

**Exemplo 2.** Dois lados de um triângulo medem 7 e 15, e o ângulo entre eles mede 60°. Achar o
terceiro lado.
Chamando de a o terceiro lado, a^{2} = 49 + 225 - 2 · 7 · 15 · (1/2) = 274 - 105 = 169. O lado
mede 13.

**Exemplo 3.** Os lados de um triângulo medem 5, 7 e 8. Achar o cosseno do ângulo oposto ao lado que
mede 7.
Isolando o cosseno na lei, com o lado 7 no papel de a, temos
cos(A) = (25 + 64 - 49) / (2 · 5 · 8) = 40/80 = 1/2. O ângulo mede 60°.

O sinal do cosseno já entrega o tipo de ângulo: cosseno positivo indica ângulo agudo, cosseno
negativo indica ângulo obtuso, e cosseno zero indica ângulo reto. Essa leitura rápida vale ouro em
prova.

#### A área pelo seno

Conhecidos dois lados e o ângulo entre eles, a área sai sem precisar da altura:

S = (1/2) · b · c · sen(A)

onde S é a área, b e c são os dois lados e A o ângulo entre eles.

**Exemplo 4.** Dois lados de um triângulo medem 8 e 10, e o ângulo entre eles mede 30°. Achar a
área.
S = (1/2) · 8 · 10 · sen(30°) = (1/2) · 80 · (1/2) = 20.

#### O caso ambíguo

Quando os dados são dois lados e um ângulo que **não** está entre eles, a lei dos senos pode devolver
dois triângulos diferentes. Isso acontece porque dois ângulos suplementares têm o mesmo seno. O que
decide é a desigualdade triangular e a soma dos ângulos: se as duas possibilidades fecham um
triângulo, as duas valem.

#### Erros comuns

**Usar a lei dos senos quando o ângulo conhecido está entre os lados conhecidos.** Nesse caso a lei
dos senos não fecha, porque falta o par lado e ângulo oposto. O caminho é a lei dos cossenos.

**Errar o sinal ao isolar o cosseno.** O termo com o cosseno entra subtraindo. Ao passar para o outro
lado, ele muda de sinal, e é aí que a conta costuma escorregar.

**Esquecer que o cosseno de um ângulo obtuso é negativo.** Com ângulo de 120°, cos(120°) = -1/2, e o
termo acaba **somando** ao resultado.

**Parar numa solução no caso ambíguo.** Quando o ângulo dado não está entre os lados dados, é preciso
testar se o ângulo suplementar também fecha um triângulo.

### Exercícios

**Bloco A. Fundamentos**

1. Num triângulo, o ângulo A mede 30°, o ângulo B mede 45° e o lado oposto ao ângulo A mede 10.
   Calcule o lado oposto ao ângulo B.
2. Dois lados de um triângulo medem 5 e 8, e o ângulo entre eles mede 60°. Calcule o terceiro lado.
3. Os lados de um triângulo medem 3, 5 e 7. Calcule o cosseno do maior ângulo e diga quanto ele mede.
4. Dois lados de um triângulo medem 6 e 10, e o ângulo entre eles mede 30°. Calcule a área.
5. Use a lei dos cossenos para verificar se o triângulo de lados 6, 8 e 10 tem um ângulo reto.

**Bloco B. Consolidação**

6. Num triângulo, o ângulo A mede 45°, o ângulo B mede 60° e o lado oposto ao ângulo A mede 8.
   Calcule o lado oposto ao ângulo B.
7. Dois lados de um triângulo medem 4 e 6, e o ângulo entre eles mede 120°. Calcule o terceiro lado.
8. Os lados de um triângulo medem 7, 8 e 13. Calcule o cosseno do ângulo oposto ao lado que mede 13.
9. Num triângulo, um lado mede 12 e o ângulo oposto a ele mede 60°. Calcule o raio da circunferência
   circunscrita a esse triângulo.
10. Num triângulo, o ângulo A mede 30°, o ângulo B mede 105° e o lado oposto ao ângulo A mede 6.
    Calcule o lado oposto ao ângulo C.
11. Dois barcos partem do mesmo ponto, e o ângulo entre as rotas mede 60°. Um percorre 30
    quilômetros e o outro percorre 40 quilômetros. Calcule a distância entre eles.
12. Dois lados de um triângulo medem 5 e 12, e o ângulo entre eles mede 90°. Calcule o terceiro lado
    e a área.
13. Dois lados de um triângulo medem 9 e 12, e a área do triângulo vale 27. Sabendo que o ângulo
    entre esses lados é agudo, determine o seno desse ângulo e quanto ele mede.
14. Os lados de um triângulo medem 4, 5 e 6. Calcule o cosseno do menor ângulo.

**Bloco C. Aprofundamento**

15. Num triângulo, dois lados medem 6 e 10, e o ângulo entre eles mede 120°. Calcule o terceiro lado
    e a área do triângulo.
16. Os lados de um triângulo medem 3, 5 e x. Determine todos os valores de x para os quais o ângulo
    oposto ao lado que mede x é obtuso.
17. Num terreno triangular de vértices A, B e C, o ângulo em A mede 45°, o ângulo em B mede 60° e o
    lado AC mede 60 metros. Calcule o lado BC.
18. Mostre que, quando o ângulo A é reto, a lei dos cossenos aplicada ao lado a se reduz ao teorema
    de Pitágoras.
19. Num triângulo, um lado mede 5, o ângulo oposto a ele mede 30° e um outro lado mede 8. Calcule o
    seno do ângulo oposto ao lado que mede 8 e explique por que esses dados admitem dois triângulos
    diferentes.

### Gabarito

1. 10√2.
2. 7.
3. -1/2. O maior ângulo é o oposto ao lado que mede 7, e ele mede 120°.
4. 15.
5. Tem. O cosseno do ângulo oposto ao lado que mede 10 vale zero, e por isso esse ângulo é reto.
6. 4√6.
7. 2√19.
8. -1/2.
9. 4√3.
10. 6√2. O ângulo C mede 45°, porque a soma dos ângulos é 180°.
11. 10√13 quilômetros.
12. Terceiro lado 13 e área 30.
13. O seno vale 1/2 e o ângulo mede 30°.
14. 3/4. O menor ângulo é o oposto ao lado que mede 4.
15. Terceiro lado 14 e área 15√3.
16. x entre √34 e 8, sem incluir os extremos. A desigualdade triangular obriga x a ficar entre 2 e
    8, e o ângulo é obtuso quando x^{2} passa de 34.
17. 20√6 metros.
18. O cosseno de um ângulo reto vale zero, então o termo que subtrai o dobro do produto dos lados
    pelo cosseno some. Sobra a^{2} = b^{2} + c^{2}, que é o teorema de Pitágoras.
19. O seno vale 4/5. Como esse seno é menor que 1 e o lado que mede 8 é maior que o lado que mede 5,
    tanto um ângulo agudo quanto o seu suplementar fecham um triângulo válido, e por isso há duas
    soluções.

## EN

### Explanation

#### The problem these laws solve

In a right triangle everything is easy: sine, cosine and tangent link sides and angles at once. The
trouble is that most triangles in the world have no right angle. A plot of land, a river crossing,
the position of two boats that left the same harbour: none of that comes with a right angle as a
gift.

The two laws in this topic do for any triangle what trigonometry already did for the right one. They
solve the triangle, that is, they let you find every side and every angle from a few pieces of data.

#### The law of sines

In any triangle, each side is proportional to the sine of the angle opposite it, and the ratio is
always the same:

a / sin(A) = b / sin(B) = c / sin(C)

where a, b and c are the sides and A, B and C the angles opposite them, side a opposite angle A and
so on. That common ratio has a lovely geometric meaning: it equals twice the radius of the circle
through the three vertices.

**When to use it.** When the data you have is a pair made of a side and the angle opposite it, plus
one more side or one more angle.

**Example 1.** In a triangle, angle A measures 30°, angle B measures 45° and the side opposite angle
A measures 8. Find the side opposite angle B.
By the law of sines, b = 8 · sin(45°) / sin(30°). Since sin(45°) = √2/2 and sin(30°) = 1/2, the
result is 8√2.

#### The law of cosines

It is a generalisation of the Pythagorean theorem:

a^{2} = b^{2} + c^{2} - 2 · b · c · cos(A)

where A is the angle opposite side a.

The term with the cosine is the correction that shows up when the angle stops being right. If angle A
is right, the cosine is zero, the term vanishes, and exactly the Pythagorean theorem is left.

**When to use it.** In two cases. First, when you know two sides and the angle between them and want
the third side. Second, when you know all three sides and want an angle.

**Example 2.** Two sides of a triangle measure 7 and 15, and the angle between them measures 60°.
Find the third side.
Calling the third side a, a^{2} = 49 + 225 - 2 · 7 · 15 · (1/2) = 274 - 105 = 169. The side
measures 13.

**Example 3.** The sides of a triangle measure 5, 7 and 8. Find the cosine of the angle opposite the
side measuring 7.
Isolating the cosine in the law, with the side measuring 7 in the role of a,
cos(A) = (25 + 64 - 49) / (2 · 5 · 8) = 40/80 = 1/2. The angle measures 60°.

The sign of the cosine already gives away the type of angle: a positive cosine means an acute angle,
a negative cosine means an obtuse angle, and a zero cosine means a right angle. That quick reading is
worth gold in a test.

#### Area from the sine

Given two sides and the angle between them, the area comes out without needing the height:

S = (1/2) · b · c · sin(A)

where S is the area, b and c are the two sides and A the angle between them.

**Example 4.** Two sides of a triangle measure 8 and 10, and the angle between them measures 30°.
Find the area.
S = (1/2) · 8 · 10 · sin(30°) = (1/2) · 80 · (1/2) = 20.

#### The ambiguous case

When the data is two sides and an angle that is **not** between them, the law of sines may return two
different triangles. That happens because two supplementary angles have the same sine. What decides
is the triangle inequality and the sum of the angles: if both possibilities close a triangle, both
are valid.

#### Common mistakes

**Using the law of sines when the known angle sits between the known sides.** In that case the law of
sines does not close, because the side and opposite angle pair is missing. The route is the law of
cosines.

**Getting the sign wrong when isolating the cosine.** The term with the cosine comes in subtracted.
Moving it to the other side flips its sign, and that is where the work usually slips.

**Forgetting that the cosine of an obtuse angle is negative.** With an angle of 120°,
cos(120°) = -1/2, and the term ends up **adding** to the result.

**Stopping at one solution in the ambiguous case.** When the given angle is not between the given
sides, you have to test whether the supplementary angle also closes a triangle.

### Exercises

**Block A. Fundamentals**

1. In a triangle, angle A measures 30°, angle B measures 45° and the side opposite angle A measures
   10. Find the side opposite angle B.
2. Two sides of a triangle measure 5 and 8, and the angle between them measures 60°. Find the third
   side.
3. The sides of a triangle measure 3, 5 and 7. Find the cosine of the largest angle and say how much
   it measures.
4. Two sides of a triangle measure 6 and 10, and the angle between them measures 30°. Find the area.
5. Use the law of cosines to check whether the triangle with sides 6, 8 and 10 has a right angle.

**Block B. Building up**

6. In a triangle, angle A measures 45°, angle B measures 60° and the side opposite angle A measures
   8. Find the side opposite angle B.
7. Two sides of a triangle measure 4 and 6, and the angle between them measures 120°. Find the third
   side.
8. The sides of a triangle measure 7, 8 and 13. Find the cosine of the angle opposite the side
   measuring 13.
9. In a triangle, one side measures 12 and the angle opposite it measures 60°. Find the radius of
   the circle through the three vertices of that triangle.
10. In a triangle, angle A measures 30°, angle B measures 105° and the side opposite angle A
    measures 6. Find the side opposite angle C.
11. Two boats leave the same point, and the angle between their routes measures 60°. One travels 30
    kilometres and the other travels 40 kilometres. Find the distance between them.
12. Two sides of a triangle measure 5 and 12, and the angle between them measures 90°. Find the
    third side and the area.
13. Two sides of a triangle measure 9 and 12, and the area of the triangle is 27. Knowing that the
    angle between those sides is acute, find the sine of that angle and how much it measures.
14. The sides of a triangle measure 4, 5 and 6. Find the cosine of the smallest angle.

**Block C. Going further**

15. In a triangle, two sides measure 6 and 10, and the angle between them measures 120°. Find the
    third side and the area of the triangle.
16. The sides of a triangle measure 3, 5 and x. Find every value of x for which the angle opposite
    the side measuring x is obtuse.
17. In a triangular plot with vertices A, B and C, the angle at A measures 45°, the angle at B
    measures 60° and side AC measures 60 metres. Find side BC.
18. Show that, when angle A is right, the law of cosines applied to side a reduces to the Pythagorean
    theorem.
19. In a triangle, one side measures 5, the angle opposite it measures 30° and another side measures
    8. Find the sine of the angle opposite the side measuring 8 and explain why this data allows two
    different triangles.

### Answer key

1. 10√2.
2. 7.
3. -1/2. The largest angle is the one opposite the side measuring 7, and it measures 120°.
4. 15.
5. It does. The cosine of the angle opposite the side measuring 10 is zero, and so that angle is
   right.
6. 4√6.
7. 2√19.
8. -1/2.
9. 4√3.
10. 6√2. Angle C measures 45°, because the angles add up to 180°.
11. 10√13 kilometres.
12. Third side 13 and area 30.
13. The sine is 1/2 and the angle measures 30°.
14. 3/4. The smallest angle is the one opposite the side measuring 4.
15. Third side 14 and area 15√3.
16. x between √34 and 8, endpoints excluded. The triangle inequality forces x to lie between 2 and
    8, and the angle is obtuse when x^{2} goes past 34.
17. 20√6 metres.
18. The cosine of a right angle is zero, so the term subtracting twice the product of the sides
    times the cosine vanishes. What is left is a^{2} = b^{2} + c^{2}, which is the Pythagorean
    theorem.
19. The sine is 4/5. Since that sine is less than 1 and the side measuring 8 is longer than the side
    measuring 5, both an acute angle and its supplement close a valid triangle, and so there are two
    solutions.

## VERIFICACAO

```python
X1: 8*sin(pi/4)/sin(pi/6) == 8*sqrt(2)
X2: sqrt(7**2 + 15**2 - 2*7*15*cos(pi/3)) == 13
X3: Rational(5**2 + 8**2 - 7**2, 2*5*8) == Rational(1,2) and acos(Rational(1,2)) == pi/3
X4: Rational(1,2)*8*10*sin(pi/6) == 20
E1: 10*sin(pi/4)/sin(pi/6) == 10*sqrt(2)
E2: sqrt(5**2 + 8**2 - 2*5*8*cos(pi/3)) == 7
E3: Rational(3**2 + 5**2 - 7**2, 2*3*5) == Rational(-1,2) and acos(Rational(-1,2)) == 2*pi/3
E4: Rational(1,2)*6*10*sin(pi/6) == 15
E5: Rational(6**2 + 8**2 - 10**2, 2*6*8) == 0
E6: simplify(8*sin(pi/3)/sin(pi/4) - 4*sqrt(6)) == 0
E7: sqrt(4**2 + 6**2 - 2*4*6*cos(2*pi/3)) == 2*sqrt(19)
E8: Rational(7**2 + 8**2 - 13**2, 2*7*8) == Rational(-1,2)
E9: simplify(12/sin(pi/3)/2 - 4*sqrt(3)) == 0
E10: simplify(6*sin(pi/4)/sin(pi/6) - 6*sqrt(2)) == 0 and 180 - 30 - 105 == 45
E11: sqrt(30**2 + 40**2 - 2*30*40*cos(pi/3)) == 10*sqrt(13)
E12: sqrt(5**2 + 12**2 - 2*5*12*cos(pi/2)) == 13 and Rational(1,2)*5*12*sin(pi/2) == 30
E13: solve(Eq(Rational(1,2)*9*12*y, 27), y) == [Rational(1,2)] and asin(Rational(1,2)) == pi/6
E14: Rational(5**2 + 6**2 - 4**2, 2*5*6) == Rational(3,4)
E15: sqrt(6**2 + 10**2 - 2*6*10*cos(2*pi/3)) == 14 and simplify(Rational(1,2)*6*10*sin(2*pi/3) - 15*sqrt(3)) == 0
E16: Intersection(solveset(3**2 + 5**2 - x**2 < 0, x, Reals), Interval.open(2, 8)) == Interval.open(sqrt(34), 8)
E17: simplify(60*sin(pi/4)/sin(pi/3) - 20*sqrt(6)) == 0
E18: cos(pi/2) == 0 and simplify(b**2 + c**2 - 2*b*c*cos(pi/2) - (b**2 + c**2)) == 0
E19: 8*sin(pi/6)/5 == Rational(4,5) and Rational(4,5) < 1 and 5 < 8
```
