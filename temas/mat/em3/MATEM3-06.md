---
id: MATEM3-06
serie: em3
unidade: numeros
titulo_pt: Números complexos: forma trigonométrica
titulo_en: Complex numbers: trigonometric form
resumo_pt: Escrever um complexo pelo módulo e pelo argumento, multiplicar e dividir somando e subtraindo ângulos, e usar a fórmula de De Moivre para potências e raízes.
resumo_en: Writing a complex number from its modulus and argument, multiplying and dividing by adding and subtracting angles, and using De Moivre's formula for powers and roots.
prerequisitos: [MATEM3-05]
duracao_min: 90
dificuldade: 5
---

## PT

### Explicação

#### Duas maneiras de dar o mesmo endereço

Na forma algébrica, um complexo é localizado por duas medidas retas: quanto para o lado e quanto
para cima. Existe outra maneira de dizer a mesma coisa: informar a que distância da origem o número
está e em que direção. Essas duas informações são o módulo e o argumento.

O **módulo** é a distância até a origem, e vale a raiz da soma dos quadrados das duas partes. O
**argumento** é o ângulo medido a partir do sentido positivo do eixo horizontal, girando no sentido
anti horário, com valores de 0° até 360°.

Com essas duas medidas, o complexo se escreve na **forma trigonométrica**:

z = r · (cos θ + i · sen θ)

onde r é o módulo e θ o argumento.

Escrevendo z = a + b · i, a parte real é a = r · cos θ e a parte imaginária é b = r · sen θ, e o
módulo sai de r = √(a^{2} + b^{2}). Por isso, para achar o argumento, o caminho seguro é olhar o
sinal das duas partes, que dizem o quadrante, e só então usar a tangente ou reconhecer um ângulo
notável.

**Exemplo 1.** Escrever -1 + i na forma trigonométrica.
O módulo é √(1 + 1), ou seja, √2. A parte real é negativa e a imaginária é
positiva, então o número está no segundo quadrante. Como as duas partes têm o mesmo valor absoluto,
o argumento é 135°. Logo z = √2 · (cos 135° + i · sen 135°).

**Exemplo 2.** Escrever 4 - 4√3 · i na forma trigonométrica.
O módulo é √(16 + 48), ou seja, √64, que dá 8. O cosseno do argumento é 4/8,
que dá ½, e o seno é negativo. O ângulo do quarto quadrante com esse cosseno é 300°.
Logo z = 8 · (cos 300° + i · sen 300°).

#### Multiplicar e dividir fica fácil

Aqui está a razão de ser desta forma. Multiplicar dois complexos significa **multiplicar os módulos
e somar os argumentos**. Dividir significa **dividir os módulos e subtrair os argumentos**.

Geometricamente, multiplicar por um complexo de módulo r e argumento α é esticar por r e girar
α. Essa leitura explica de uma vez por que multiplicar por i equivale a girar um quarto de volta.

**Exemplo 3.** Calcular o produto de 2 · (cos 45° + i · sen 45°) por
3 · (cos 45° + i · sen 45°).
Os módulos multiplicam: 2 × 3 dá 6. Os argumentos somam: 45 + 45 dá 90. O produto é
6 · (cos 90° + i · sen 90°), que na forma algébrica é 6i.

#### Potências: a fórmula de De Moivre

Repetir a multiplicação n vezes leva direto à fórmula de De Moivre:

z^{n} = r^{n} · (cos(n · θ) + i · sen(n · θ))

O módulo é elevado à potência e o argumento é multiplicado por n. Se o resultado passar de 360°,
tire voltas inteiras, porque o ângulo é o mesmo.

**Exemplo 4.** Calcular (1 + i)^{6}.
O módulo de 1 + i é √2 e o argumento é 45°. Então o módulo da potência é (√2)^{6},
que dá 8, e o argumento é 6 × 45, ou seja, 270°. O resultado é
8 · (cos 270° + i · sen 270°), que vale -8i.

Sem essa fórmula, o mesmo cálculo exigiria seis multiplicações encadeadas, com chance de erro em
cada uma.

#### Raízes de um complexo

Todo complexo não nulo tem exatamente n raízes de índice n, e todas têm o mesmo módulo: r^{1/n}, a
raiz de índice n do módulo original. Os argumentos partem de θ/n e avançam de 360°/n. As raízes
ficam, portanto, igualmente espaçadas sobre uma circunferência, formando um polígono regular.

**Exemplo 5.** Determinar as raízes quartas de 81.
O módulo de 81 é 81 e o argumento é 0°. As raízes têm módulo igual a 81^{1/4}, que dá 3,
e os argumentos avançam de 90° em 90° a partir de 0°. São elas 3, 3i, -3 e -3i.

#### Erros comuns

**Achar o argumento só pela tangente.** A tangente não distingue quadrantes opostos. Olhe o sinal da
parte real e da parte imaginária antes de decidir o ângulo.

**Somar os módulos ao multiplicar.** Os módulos se multiplicam. Quem soma está confundindo com a
regra dos argumentos.

**Elevar o argumento à potência.** O módulo é que vai à potência. O argumento é multiplicado pelo
expoente.

**Esquecer as demais raízes.** Uma equação em que z^{n} é igual a um número tem n soluções,
não apenas a mais óbvia.

### Exercícios

**Bloco A. Fundamentos**

1. Determine o módulo e o argumento de 1 + i.
2. Determine o módulo e o argumento de 2i.
3. Determine o módulo e o argumento de -3.
4. Escreva na forma algébrica o número 4 · (cos 60° + i · sen 60°).
5. Determine o módulo e o argumento de √3 + i.

**Bloco B. Consolidação**

6. Escreva na forma trigonométrica o número -1 + √3 · i.
7. Escreva na forma trigonométrica o número 3 - 3i.
8. Calcule o produto de 2 · (cos 30° + i · sen 30°) por
   3 · (cos 45° + i · sen 45°), deixando a resposta na forma trigonométrica.
9. Calcule o quociente de 10 · (cos 100° + i · sen 100°) por
   5 · (cos 40° + i · sen 40°), e escreva o resultado também na forma algébrica.
10. Calcule (cos 30° + i · sen 30°)^{6}.
11. Calcule (1 + i)^{8}, passando antes para a forma trigonométrica.
12. Calcule (√3 + i)^{6}, passando antes para a forma trigonométrica.
13. Escreva na forma trigonométrica o número -2 - 2i.
14. Escreva na forma algébrica o número 6 · (cos 270° + i · sen 270°).

**Bloco C. Aprofundamento**

15. Determine as três raízes cúbicas de 8, escrevendo cada uma na forma algébrica.
16. Determine as quatro raízes quartas de 16, escrevendo cada uma na forma algébrica.
17. Calcule (1 - i)^{10}, usando a forma trigonométrica.
18. Resolva no conjunto dos números complexos a equação z^{3} = -8.
19. As raízes cúbicas de 27 são os vértices de um triângulo equilátero inscrito na circunferência de
    centro na origem e raio 3. Calcule a medida do lado desse triângulo.
20. Escreva o quociente (1 + i)/(1 - i) na forma trigonométrica e use esse resultado para
    calcular ((1 + i)/(1 - i))^{2026}.

### Gabarito

1. Módulo igual a √2 e argumento 45°.
2. Módulo 2 e argumento 90°.
3. Módulo 3 e argumento 180°.
4. 2 + 2√3 · i.
5. Módulo 2 e argumento 30°.
6. 2 · (cos 120° + i · sen 120°).
7. 3√2 · (cos 315° + i · sen 315°).
8. 6 · (cos 75° + i · sen 75°). Os módulos multiplicam e os argumentos somam.
9. 2 · (cos 60° + i · sen 60°), que na forma algébrica vale 1 + √3 · i.
10. -1. O argumento passa a ser 180° e o módulo continua 1.
11. 16. O módulo vai a 16 e o argumento vai a 360°, que equivale a 0°.
12. -64. O módulo é 2 e o argumento é 30°, então a potência tem módulo 64 e argumento 180°.
13. 2√2 · (cos 225° + i · sen 225°).
14. -6i.
15. 2, -1 + √3 · i, e -1 - √3 · i. As três têm módulo 2 e argumentos 0°,
    120° e 240°.
16. 2, 2i, -2 e -2i. As quatro têm módulo 2 e argumentos 0°, 90°, 180° e
    270°.
17. -32i. O módulo é √2 e o argumento é 315°, então a potência tem módulo 32 e
    argumento 3150°, que equivale a 270°.
18. 1 + √3 · i, -2 e 1 - √3 · i. As três têm módulo 2 e argumentos 60°,
    180° e 300°.
19. 3√3. O quadrado do lado vale 27.
20. O quociente vale i, cuja forma trigonométrica é cos 90° + i · sen 90°. Como 2026
    dividido por 4 deixa resto 2, a potência vale -1.

## EN

### Explanation

#### Two ways of giving the same address

In algebraic form, a complex number is located by two straight measurements: how far sideways and how
far up. There is another way of saying the same thing: state how far from the origin the number sits
and in which direction. Those two pieces of information are the modulus and the argument.

The **modulus** is the distance to the origin, and it equals the square root of the sum of the
squares of the two parts. The **argument** is the angle measured from the positive direction of the
horizontal axis, turning anticlockwise, with values from 0° up to 360°.

With those two measurements, the complex number is written in **trigonometric form**:

z = r · (cos θ + i · sin θ)

where r is the modulus and θ the argument.

Writing z = a + b · i, the real part is a = r · cos θ and the imaginary part is b = r · sin θ, and the
modulus comes from r = √(a^{2} + b^{2}). That is why, to find the argument, the safe route is to
look at the signs of the two parts, which give the quadrant, and only then use the tangent or
recognise a special angle.

**Example 1.** Write -1 + i in trigonometric form.
The modulus is √(1 + 1), that is, √2. The real part is negative
and the imaginary part is positive, so the number sits in the second quadrant. Since both parts have
the same absolute value, the argument is 135°. So z = √2 · (cos 135° + i · sin 135°).

**Example 2.** Write 4 - 4√3 · i in trigonometric form.
The modulus is √(16 + 48), that is, √64, which gives 8. The
cosine of the argument is 4/8, which gives ½, and the sine is negative. The fourth
quadrant angle with that cosine is 300°. So z = 8 · (cos 300° + i · sin 300°).

#### Multiplying and dividing become easy

Here lies the whole point of this form. Multiplying two complex numbers means **multiplying the
moduli and adding the arguments**. Dividing means **dividing the moduli and subtracting the
arguments**.

Geometrically, multiplying by a complex number of modulus r and argument α is stretching by r and
turning by α. That reading explains at once why multiplying by i amounts to a quarter turn.

**Example 3.** Find the product of 2 · (cos 45° + i · sin 45°) and
3 · (cos 45° + i · sin 45°).
The moduli multiply: 2 × 3 gives 6. The arguments add: 45 + 45 gives 90. The product is
6 · (cos 90° + i · sin 90°), which in algebraic form is 6i.

#### Powers: De Moivre's formula

Repeating the multiplication n times leads straight to De Moivre's formula:

z^{n} = r^{n} · (cos(n · θ) + i · sin(n · θ))

The modulus is raised to the power and the argument is multiplied by n. If the result goes past 360°,
take whole turns out, because the angle is the same.

**Example 4.** Compute (1 + i)^{6}.
The modulus of 1 + i is √2 and the argument is 45°. So the modulus of the
power is (√2)^{6}, which gives 8, and the argument is 6 × 45, that is, 270°.
The result is 8 · (cos 270° + i · sin 270°), which equals -8i.

Without this formula, the same calculation would need six chained multiplications, with a chance of
error in each one.

#### Roots of a complex number

Every non zero complex number has exactly n roots of index n, and they all share the same modulus:
r^{1/n}, the root of index n of the original modulus. The arguments start at θ/n and advance by
360°/n. The roots therefore sit equally spaced on a circle, forming a regular polygon.

**Example 5.** Find the fourth roots of 81.
The modulus of 81 is 81 and the argument is 0°. The roots have modulus equal to 81^{1/4},
which gives 3, and the arguments advance by 90° at a time starting from 0°. They
are 3, 3i, -3 and -3i.

#### Common mistakes

**Finding the argument from the tangent alone.** The tangent does not tell opposite quadrants apart.
Look at the sign of the real part and of the imaginary part before deciding the angle.

**Adding the moduli when multiplying.** The moduli multiply. Anyone adding them is mixing this up
with the rule for the arguments.

**Raising the argument to the power.** It is the modulus that goes to the power. The argument is
multiplied by the exponent.

**Forgetting the remaining roots.** An equation in which z^{n} equals a number has n
solutions, not just the most obvious one.

### Exercises

**Block A. Fundamentals**

1. Find the modulus and the argument of 1 + i.
2. Find the modulus and the argument of 2i.
3. Find the modulus and the argument of -3.
4. Write in algebraic form the number 4 · (cos 60° + i · sin 60°).
5. Find the modulus and the argument of √3 + i.

**Block B. Building up**

6. Write in trigonometric form the number -1 + √3 · i.
7. Write in trigonometric form the number 3 - 3i.
8. Find the product of 2 · (cos 30° + i · sin 30°) and
   3 · (cos 45° + i · sin 45°), leaving the answer in trigonometric form.
9. Find the quotient of 10 · (cos 100° + i · sin 100°) by
   5 · (cos 40° + i · sin 40°), and write the result in algebraic form as well.
10. Compute (cos 30° + i · sin 30°)^{6}.
11. Compute (1 + i)^{8}, moving to trigonometric form first.
12. Compute (√3 + i)^{6}, moving to trigonometric form first.
13. Write in trigonometric form the number -2 - 2i.
14. Write in algebraic form the number 6 · (cos 270° + i · sin 270°).

**Block C. Going further**

15. Find the three cube roots of 8, writing each one in algebraic form.
16. Find the four fourth roots of 16, writing each one in algebraic form.
17. Compute (1 - i)^{10}, using trigonometric form.
18. Solve the equation z^{3} = -8 over the complex numbers.
19. The cube roots of 27 are the vertices of an equilateral triangle inscribed in the circle with
    centre at the origin and radius 3. Find the length of the side of that triangle.
20. Write the quotient (1 + i)/(1 - i) in trigonometric form and use that result to
    compute ((1 + i)/(1 - i))^{2026}.

### Answer key

1. Modulus equal to √2 and argument 45°.
2. Modulus 2 and argument 90°.
3. Modulus 3 and argument 180°.
4. 2 + 2√3 · i.
5. Modulus 2 and argument 30°.
6. 2 · (cos 120° + i · sin 120°).
7. 3√2 · (cos 315° + i · sin 315°).
8. 6 · (cos 75° + i · sin 75°). The moduli multiply and the arguments add.
9. 2 · (cos 60° + i · sin 60°), which in algebraic form is 1 + √3 · i.
10. -1. The argument becomes 180° and the modulus stays 1.
11. 16. The modulus goes to 16 and the argument goes to 360°, which is the same as 0°.
12. -64. The modulus is 2 and the argument is 30°, so the power has modulus 64 and
    argument 180°.
13. 2√2 · (cos 225° + i · sin 225°).
14. -6i.
15. 2, -1 + √3 · i, and -1 - √3 · i. All three have modulus 2 and arguments 0°,
    120° and 240°.
16. 2, 2i, -2 and -2i. All four have modulus 2 and arguments 0°, 90°, 180° and
    270°.
17. -32i. The modulus is √2 and the argument is 315°, so the power has modulus 32 and
    argument 3150°, which is the same as 270°.
18. 1 + √3 · i, -2 and 1 - √3 · i. All three have modulus 2 and arguments 60°,
    180° and 300°.
19. 3√3. The square of the side is 27.
20. The quotient is i, whose trigonometric form is cos 90° + i · sin 90°. Since 2026
    divided by 4 leaves remainder 2, the power equals -1.

## VERIFICACAO

```python
X1: Abs(-1+sqrt(-1)) == sqrt(2) and simplify(sqrt(2)*(cos(3*pi/4) + sqrt(-1)*sin(3*pi/4)) - (-1+sqrt(-1))) == 0
X2: Abs(4-4*sqrt(3)*sqrt(-1)) == 8 and simplify(8*(cos(5*pi/3) + sqrt(-1)*sin(5*pi/3)) - (4-4*sqrt(3)*sqrt(-1))) == 0
X3: simplify(2*(cos(pi/4)+sqrt(-1)*sin(pi/4))*3*(cos(pi/4)+sqrt(-1)*sin(pi/4)) - 6*sqrt(-1)) == 0 and 45 + 45 == 90
X4: expand((1+sqrt(-1))**6) == -8*sqrt(-1) and sqrt(2)**6 == 8 and 6*45 == 270
X5: set(solve(Eq(z**4, 81), z)) == set([3, -3, 3*sqrt(-1), -3*sqrt(-1)])
E1: Abs(1+sqrt(-1)) == sqrt(2) and atan(1) == pi/4
E2: Abs(2*sqrt(-1)) == 2 and simplify(2*(cos(pi/2)+sqrt(-1)*sin(pi/2)) - 2*sqrt(-1)) == 0
E3: Abs(-3) == 3 and simplify(3*(cos(pi)+sqrt(-1)*sin(pi)) + 3) == 0
E4: simplify(4*(cos(pi/3)+sqrt(-1)*sin(pi/3)) - (2 + 2*sqrt(3)*sqrt(-1))) == 0
E5: Abs(sqrt(3)+sqrt(-1)) == 2 and simplify(2*(cos(pi/6)+sqrt(-1)*sin(pi/6)) - (sqrt(3)+sqrt(-1))) == 0
E6: Abs(-1+sqrt(3)*sqrt(-1)) == 2 and simplify(2*(cos(2*pi/3)+sqrt(-1)*sin(2*pi/3)) - (-1+sqrt(3)*sqrt(-1))) == 0
E7: simplify(Abs(3-3*sqrt(-1)) - 3*sqrt(2)) == 0 and simplify(3*sqrt(2)*(cos(7*pi/4)+sqrt(-1)*sin(7*pi/4)) - (3-3*sqrt(-1))) == 0
E8: simplify(2*(cos(pi/6)+sqrt(-1)*sin(pi/6))*3*(cos(pi/4)+sqrt(-1)*sin(pi/4)) - 6*(cos(5*pi/12)+sqrt(-1)*sin(5*pi/12))) == 0 and 30 + 45 == 75
E9: Rational(10,5) == 2 and 100 - 40 == 60 and simplify(2*(cos(pi/3)+sqrt(-1)*sin(pi/3)) - (1+sqrt(3)*sqrt(-1))) == 0
E10: simplify((cos(pi/6)+sqrt(-1)*sin(pi/6))**6 + 1) == 0 and 6*30 == 180
E11: expand((1+sqrt(-1))**8) == 16 and sqrt(2)**8 == 16 and 8*45 == 360
E12: expand((sqrt(3)+sqrt(-1))**6) == -64 and 2**6 == 64 and 6*30 == 180
E13: simplify(Abs(-2-2*sqrt(-1)) - 2*sqrt(2)) == 0 and simplify(2*sqrt(2)*(cos(5*pi/4)+sqrt(-1)*sin(5*pi/4)) - (-2-2*sqrt(-1))) == 0
E14: simplify(6*(cos(3*pi/2)+sqrt(-1)*sin(3*pi/2)) + 6*sqrt(-1)) == 0
E15: set(solve(Eq(z**3, 8), z)) == set([2, -1+sqrt(3)*sqrt(-1), -1-sqrt(3)*sqrt(-1)])
E16: set(solve(Eq(z**4, 16), z)) == set([2, -2, 2*sqrt(-1), -2*sqrt(-1)])
E17: expand((1-sqrt(-1))**10) == -32*sqrt(-1) and sqrt(2)**10 == 32 and 10*315 == 3150 and 3150 - 8*360 == 270
E18: set(solve(Eq(z**3, -8), z)) == set([-2, 1+sqrt(3)*sqrt(-1), 1-sqrt(3)*sqrt(-1)])
E19: set(solve(Eq(z**3, 27), z)) == set([3, Rational(-3,2)+3*sqrt(3)*sqrt(-1)/2, Rational(-3,2)-3*sqrt(3)*sqrt(-1)/2]) and simplify(sqrt((3-Rational(-3,2))**2 + (3*sqrt(3)/2)**2) - 3*sqrt(3)) == 0
E20: simplify((1+sqrt(-1))/(1-sqrt(-1)) - sqrt(-1)) == 0 and sqrt(-1)**2026 == -1 and 2026 - 4*506 == 2
```
