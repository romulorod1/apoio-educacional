---
id: MATEM3-05
serie: em3
unidade: numeros
titulo_pt: Números complexos: forma algébrica
titulo_en: Complex numbers: algebraic form
resumo_pt: Operar com a unidade imaginária, somar, multiplicar e dividir na forma algébrica, calcular potências de i e resolver equações que não têm raiz real.
resumo_en: Working with the imaginary unit, adding, multiplying and dividing in algebraic form, computing powers of i and solving equations with no real roots.
prerequisitos: [MATEM1-04]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### Por que inventar um número novo

A equação x^{2} + 1 = 0 não tem solução entre os números reais, porque nenhum real elevado ao
quadrado dá negativo. Em vez de parar aí, a matemática fez o que já tinha feito antes com os
negativos e com os irracionais: ampliou o conjunto.

Define-se a **unidade imaginária** i pela propriedade

i^{2} = -1

Com ela, todo número da forma a + bi, com a e b reais, é um **número complexo**. O número a é a
parte real e o número b é a parte imaginária. Quando b vale zero sobra um real, o que mostra que os
reais estão dentro dos complexos.

Dois complexos são iguais quando têm a mesma parte real e a mesma parte imaginária. Uma igualdade
entre complexos vale, portanto, por duas igualdades entre reais, e é assim que se resolvem sistemas
disfarçados.

#### Somar, subtrair e multiplicar

Soma e subtração são feitas parte por parte, como se i fosse uma letra. Multiplicação também segue a
distributiva de sempre, com um cuidado só no fim: onde aparecer i^{2}, troque por -1.

**Exemplo 1.** Calcular a soma e o produto de 3 + 2i e 1 - 5i.
A soma é (3 + 1) + (2 - 5)i, ou seja, 4 - 3i.
No produto, distribuindo: 3 - 15i + 2i - 10 · i^{2}. Como i^{2} = -1, o último termo vira +10.
Juntando: 13 - 13i.

#### O conjugado e a divisão

O **conjugado** de a + bi é a - bi: mesma parte real, parte imaginária com sinal trocado. Ele tem
uma propriedade preciosa: o produto de um complexo pelo seu conjugado é sempre um número real, igual
à soma dos quadrados das duas partes.

É isso que resolve a divisão. Para dividir, multiplique numerador e denominador pelo conjugado do
denominador, e o denominador vira real.

**Exemplo 2.** Calcular (4 + 2i) / (1 + i).
Multiplicando em cima e embaixo por 1 - i, o denominador vira 1 + 1, que dá 2. O numerador fica
4 - 4i + 2i - 2 · i^{2}, ou seja, 6 - 2i. Dividindo por 2, o resultado é 3 - i.

#### Potências de i

As potências de i se repetem de quatro em quatro:

i^{1} = i, i^{2} = -1, i^{3} = -i, i^{4} = 1

Depois disso o ciclo recomeça. Para calcular uma potência de expoente grande, divida o expoente por
4 e olhe apenas o resto: resto 0 dá 1, resto 1 dá i, resto 2 dá -1, resto 3 dá -i.

**Exemplo 3.** Calcular i^{57}.
Dividindo 57 por 4, o quociente é 14 e o resto é 1. Logo i^{57} = i.

Esse atalho vale ouro em prova, porque o expoente costuma ser gigante justamente para punir quem
tenta multiplicar tudo.

#### Módulo e plano de Argand

Todo complexo a + bi pode ser desenhado como o ponto de coordenadas a e b. O **módulo** é a
distância desse ponto até a origem: |a + bi| = √(a^{2} + b^{2}).

**Exemplo 4.** Calcular o módulo de 3 - 4i.
É √(9 + 16), ou seja, √25, que dá 5.

#### Equações sem raiz real

Com os complexos, toda equação do segundo grau passa a ter raízes. Quando o discriminante é
negativo, escreva a raiz do número negativo usando i e siga a fórmula normalmente.

**Exemplo 5.** Resolver x^{2} - 6x + 13 = 0.
O discriminante é 36 - 52, ou seja, -16. Como √(-16) = 4i, as soluções são (6 ± 4i) / 2, ou seja,
3 + 2i e 3 - 2i.

Repare que as duas soluções são conjugadas. Isso sempre acontece quando os coeficientes da equação
são reais.

#### Erros comuns

**Escrever i^{2} como +1.** Ele vale -1, e esquecer disso troca o sinal de um termo inteiro no
produto.

**Somar partes real e imaginária.** Em 3 + 2i não dá para juntar o 3 com o 2. São grandezas de
naturezas diferentes, como no caso de um polinômio.

**Multiplicar pelo conjugado só em cima.** Na divisão, o conjugado multiplica numerador e
denominador. Só em cima muda o valor da fração.

**Calcular potência grande de i multiplicando termo a termo.** Divida o expoente por 4 e use o
resto.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule a soma de 5 + 3i com 2 - 7i.
2. Calcule a diferença entre 4 + i e 6 - 3i.
3. Calcule o produto de 2 + 3i por 1 + 4i.
4. Escreva o conjugado de -3 + 5i e calcule o módulo desse número.
5. Calcule i^{10}.

**Bloco B. Consolidação**

6. Calcule (3 + 2i)^{2}.
7. Calcule o produto de 2 + 3i pelo seu conjugado.
8. Calcule (2 + 3i) / (1 - i), escrevendo o resultado na forma algébrica.
9. Calcule 5 / (2 + i), escrevendo o resultado na forma algébrica.
10. Calcule i^{2015}.
11. Calcule o módulo de 5 - 12i.
12. Resolva no conjunto dos números complexos a equação x^{2} + 25 = 0.
13. Resolva no conjunto dos números complexos a equação x^{2} - 4x + 13 = 0.
14. Determine os números reais x e y de modo que a soma de x + 2i com 3 - yi seja igual a 7 + 5i.

**Bloco C. Aprofundamento**

15. Calcule i^{100} + i^{101} + i^{102} + i^{103}.
16. Calcule (1 + i)^{8}, aproveitando que (1 + i)^{2} é um número imaginário puro.
17. Determine o número complexo z tal que z somado ao dobro do seu conjugado seja igual a 9 + 2i.
18. Sendo z = 1 + i, calcule o valor de z^{2} - 2z + 2 e diga o que esse resultado revela sobre a
    equação x^{2} - 2x + 2 = 0.
19. Sejam z_{1} = 3 + 4i e z_{2} = 1 - 2i. Calcule o módulo de cada um, calcule o produto dos dois
    e o módulo desse produto, e compare o módulo do produto com o produto dos módulos.
20. Resolva no conjunto dos números complexos a equação x^{4} - 16 = 0.

### Gabarito

1. 7 - 4i.
2. -2 + 4i.
3. -10 + 11i.
4. O conjugado é -3 - 5i, e o módulo vale √34.
5. -1. Como 10 dividido por 4 deixa resto 2, i^{10} = i^{2}.
6. 5 + 12i.
7. 13. O produto de um complexo pelo conjugado é a soma dos quadrados das partes.
8. -1/2 + (5/2)i.
9. 2 - i.
10. -i. Como 2015 dividido por 4 deixa resto 3, i^{2015} = i^{3}.
11. 13.
12. x = 5i ou x = -5i.
13. x = 2 + 3i ou x = 2 - 3i.
14. x = 4 e y = -3.
15. zero. As quatro potências consecutivas valem 1, i, -1 e -i, e a soma delas é zero.
16. 16. (1 + i)^{2} = 2i, e (2i)^{4} = 16.
17. z = 3 - 2i.
18. O resultado é zero, o que mostra que 1 + i é raiz da equação. A outra raiz é o conjugado 1 - i.
19. O módulo de z_{1} vale 5 e o de z_{2} vale √5. O produto é 11 - 2i, cujo módulo vale 5 · √5.
    O módulo do produto coincide com o produto dos módulos.
20. x = 2, x = -2, x = 2i e x = -2i.

## EN

### Explanation

#### Why invent a new number

The equation x^{2} + 1 = 0 has no solution among the real numbers, because no real number squared
gives a negative result. Instead of stopping there, mathematics did what it had already done with
negatives and with irrationals: it enlarged the set.

The **imaginary unit** i is defined by the property

i^{2} = -1

With it, every number of the form a + bi, with a and b real, is a **complex number**. The number a
is the real part and the number b is the imaginary part. When b is zero a real number is left, which
shows that the reals sit inside the complex numbers.

Two complex numbers are equal when they have the same real part and the same imaginary part. An
equality between complex numbers therefore stands for two equalities between reals, and that is how
disguised systems get solved.

#### Adding, subtracting and multiplying

Addition and subtraction are done part by part, as if i were a letter. Multiplication also follows
the usual distributive rule, with one care at the end: wherever i^{2} appears, replace it by -1.

**Example 1.** Find the sum and the product of 3 + 2i and 1 - 5i.
The sum is (3 + 1) + (2 - 5)i, that is, 4 - 3i.
In the product, distributing: 3 - 15i + 2i - 10 · i^{2}. Since i^{2} = -1, the last term becomes
+10. Collecting: 13 - 13i.

#### The conjugate and division

The **conjugate** of a + bi is a - bi: same real part, imaginary part with the sign flipped.
It has a precious property: the product of a complex number by its conjugate is always a real number,
equal to the sum of the squares of the two parts.

That is what settles division. To divide, multiply numerator and denominator by the conjugate of the
denominator, and the denominator turns real.

**Example 2.** Compute (4 + 2i) / (1 + i).
Multiplying top and bottom by 1 - i, the denominator becomes 1 + 1, which gives 2. The numerator
becomes 4 - 4i + 2i - 2 · i^{2}, that is, 6 - 2i. Dividing by 2, the result is 3 - i.

#### Powers of i

The powers of i repeat every four steps:

i^{1} = i, i^{2} = -1, i^{3} = -i, i^{4} = 1

After that the cycle starts again. To compute a power with a large exponent, divide the exponent by 4
and look only at the remainder: remainder 0 gives 1, remainder 1 gives i, remainder 2 gives -1,
remainder 3 gives -i.

**Example 3.** Compute i^{57}.
Dividing 57 by 4, the quotient is 14 and the remainder is 1. So i^{57} = i.

This shortcut is worth gold in a test, because the exponent is usually huge precisely to punish
anyone who tries to multiply everything out.

#### Modulus and the Argand plane

Every complex number a + bi can be drawn as the point with coordinates a and b. The **modulus** is
the distance from that point to the origin: |a + bi| = √(a^{2} + b^{2}).

**Example 4.** Compute the modulus of 3 - 4i.
It is √(9 + 16), that is, √25, which gives 5.

#### Equations with no real roots

With complex numbers, every quadratic equation gains roots. When the discriminant is negative, write
the square root of the negative number using i and follow the formula as usual.

**Example 5.** Solve x^{2} - 6x + 13 = 0.
The discriminant is 36 - 52, that is, -16. Since √(-16) = 4i, the solutions are (6 ± 4i) / 2, that
is, 3 + 2i and 3 - 2i.

Notice that the two solutions are conjugates. That always happens when the coefficients of the
equation are real.

#### Common mistakes

**Writing i^{2} as +1.** It equals -1, and forgetting that flips the sign of a whole term in a
product.

**Adding the real and the imaginary parts.** In 3 + 2i you cannot merge the 3 with the 2. They are
quantities of different natures, just as in a polynomial.

**Multiplying by the conjugate only on top.** In a division, the conjugate multiplies numerator and
denominator. Doing it only on top changes the value of the fraction.

**Computing a large power of i by multiplying term by term.** Divide the exponent by 4 and use the
remainder.

### Exercises

**Block A. Fundamentals**

1. Find the sum of 5 + 3i and 2 - 7i.
2. Find the difference between 4 + i and 6 - 3i.
3. Find the product of 2 + 3i and 1 + 4i.
4. Write the conjugate of -3 + 5i and find the modulus of that number.
5. Compute i^{10}.

**Block B. Building up**

6. Compute (3 + 2i)^{2}.
7. Compute the product of 2 + 3i by its conjugate.
8. Compute (2 + 3i) / (1 - i), writing the result in algebraic form.
9. Compute 5 / (2 + i), writing the result in algebraic form.
10. Compute i^{2015}.
11. Compute the modulus of 5 - 12i.
12. Solve the equation x^{2} + 25 = 0 over the complex numbers.
13. Solve the equation x^{2} - 4x + 13 = 0 over the complex numbers.
14. Find the real numbers x and y so that the sum of x + 2i and 3 - yi equals 7 + 5i.

**Block C. Going further**

15. Compute i^{100} + i^{101} + i^{102} + i^{103}.
16. Compute (1 + i)^{8}, using the fact that (1 + i)^{2} is a purely imaginary number.
17. Find the complex number z such that z added to twice its conjugate equals 9 + 2i.
18. With z = 1 + i, compute the value of z^{2} - 2z + 2 and say what that result reveals about the
    equation x^{2} - 2x + 2 = 0.
19. Let z_{1} = 3 + 4i and z_{2} = 1 - 2i. Compute the modulus of each one, compute their product
    and the modulus of that product, and compare the modulus of the product with the product of the
    moduli.
20. Solve the equation x^{4} - 16 = 0 over the complex numbers.

### Answer key

1. 7 - 4i.
2. -2 + 4i.
3. -10 + 11i.
4. The conjugate is -3 - 5i, and the modulus is √34.
5. -1. Since 10 divided by 4 leaves remainder 2, i^{10} = i^{2}.
6. 5 + 12i.
7. 13. The product of a complex number by its conjugate is the sum of the squares of the parts.
8. -1/2 + (5/2)i.
9. 2 - i.
10. -i. Since 2015 divided by 4 leaves remainder 3, i^{2015} = i^{3}.
11. 13.
12. x = 5i or x = -5i.
13. x = 2 + 3i or x = 2 - 3i.
14. x = 4 and y = -3.
15. zero. The four consecutive powers are 1, i, -1 and -i, and their sum is zero.
16. 16. (1 + i)^{2} = 2i, and (2i)^{4} = 16.
17. z = 3 - 2i.
18. The result is zero, which shows that 1 + i is a root of the equation. The other root is the
    conjugate 1 - i.
19. The modulus of z_{1} is 5 and that of z_{2} is √5. The product is 11 - 2i, whose modulus is
    5 · √5. The modulus of the product matches the product of the moduli.
20. x = 2, x = -2, x = 2i and x = -2i.

## VERIFICACAO

```python
X1: expand((3+2*I) + (1-5*I)) == 4-3*I and expand((3+2*I)*(1-5*I)) == 13-13*I
X2: simplify((4+2*I)/(1+I) - (3-I)) == 0
X3: I**57 == I and 57 == 4*14 + 1
X4: Abs(3-4*I) == 5
X5: set(solve(Eq(z**2 - 6*z + 13, 0), z)) == set([3+2*I, 3-2*I]) and 36 - 52 == -16
E1: expand((5+3*I) + (2-7*I)) == 7-4*I
E2: expand((4+I) - (6-3*I)) == -2+4*I
E3: expand((2+3*I)*(1+4*I)) == -10+11*I
E4: expand((-3+5*I)*(-3-5*I)) == 34 and Abs(-3+5*I) == sqrt(34)
E5: I**10 == -1 and 10 == 4*2 + 2
E6: expand((3+2*I)**2) == 5+12*I
E7: expand((2+3*I)*(2-3*I)) == 13
E8: simplify((2+3*I)/(1-I) - (Rational(-1,2) + Rational(5,2)*I)) == 0
E9: simplify(5/(2+I) - (2-I)) == 0
E10: I**2015 == -I and 2015 == 4*503 + 3
E11: Abs(5-12*I) == 13
E12: set(solve(Eq(z**2 + 25, 0), z)) == set([5*I, -5*I])
E13: set(solve(Eq(z**2 - 4*z + 13, 0), z)) == set([2+3*I, 2-3*I])
E14: solve([Eq(a + 3, 7), Eq(2 - b, 5)], [a, b]) == {a: 4, b: -3}
E15: I**100 + I**101 + I**102 + I**103 == 0
E16: expand((1+I)**2) == 2*I and expand((1+I)**8) == 16
E17: expand((3-2*I) + 2*(3+2*I)) == 9+2*I
E18: expand((1+I)**2 - 2*(1+I) + 2) == 0 and set(solve(Eq(z**2-2*z+2,0), z)) == set([1+I, 1-I])
E19: Abs(3+4*I) == 5 and Abs(1-2*I) == sqrt(5) and expand((3+4*I)*(1-2*I)) == 11-2*I and simplify(Abs(11-2*I) - 5*sqrt(5)) == 0
E20: set(solve(Eq(z**4 - 16, 0), z)) == set([2, -2, 2*I, -2*I])
```
