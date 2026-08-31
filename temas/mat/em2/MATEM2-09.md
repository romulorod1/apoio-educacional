---
id: MATEM2-09
serie: em2
unidade: algebra
titulo_pt: Binômio de Newton
titulo_en: The binomial theorem
resumo_pt: Desenvolver potências de um binômio com coeficientes binomiais e usar o termo geral para achar um termo específico sem escrever a expansão inteira.
resumo_en: Expanding powers of a binomial with binomial coefficients and using the general term to find one specific term without writing the whole expansion.
prerequisitos: [MATEM2-08]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### De onde vêm os coeficientes

Todo mundo sabe desenvolver o quadrado de uma soma. O cubo já dá trabalho, e a quinta potência, feita
na força bruta, ocupa meia página e costuma sair errada. O binômio de Newton resolve isso: ele diz
qual é o desenvolvimento de qualquer potência de uma soma de dois termos, sem multiplicação
repetida.

A razão é de contagem. Ao multiplicar o fator (a mais b) por ele mesmo n vezes, cada parcela do
resultado nasce de escolher, em cada um dos n fatores, se você leva o a ou o b. Um termo com b
aparecendo k vezes vem de escolher quais k fatores contribuem com o b, e isso pode ser feito de
tantos modos quanto a combinação de n elementos tomados k a k. Por isso os coeficientes do
desenvolvimento são exatamente os coeficientes binomiais.

#### O triângulo de Pascal

Os coeficientes binomiais se organizam num triângulo em que cada linha começa e termina em 1 e cada
número interno é a soma dos dois que estão acima dele. As primeiras linhas são:

para n igual a 0, o número 1
para n igual a 1, os números 1 e 1
para n igual a 2, os números 1, 2 e 1
para n igual a 3, os números 1, 3, 3 e 1
para n igual a 4, os números 1, 4, 6, 4 e 1
para n igual a 5, os números 1, 5, 10, 10, 5 e 1

Duas propriedades ajudam bastante. A linha é simétrica, então a combinação de n tomados k a k é
igual à combinação de n tomados n menos k a n menos k. E a soma de toda a linha de ordem n vale 2 na
potência n, o que se prova substituindo a e b por 1 no desenvolvimento.

#### A fórmula

O desenvolvimento de (a mais b) na potência n tem n mais 1 termos. Nele, o expoente de a começa em n
e cai de um em um até zero, enquanto o expoente de b faz o caminho inverso, e a soma dos dois
expoentes é sempre n. Cada termo leva como coeficiente a combinação de n tomados k a k, onde k é o
expoente de b.

**Exemplo 1.** Desenvolver (x mais 2) ao cubo.
Os coeficientes da linha de ordem 3 são 1, 3, 3 e 1. Então o resultado é x ao cubo mais 3 vezes x ao
quadrado vezes 2, mais 3 vezes x vezes 4, mais 8, ou seja, x ao cubo mais 6x ao quadrado mais 12x
mais 8.

#### O termo geral

Quando a potência é grande e se quer apenas um termo, escrever tudo é desperdício. O termo geral do
desenvolvimento de (a mais b) na potência n é

a combinação de n tomados k a k, vezes a na potência n menos k, vezes b na potência k

Basta descobrir qual k produz o expoente pedido e calcular só aquele termo.

**Exemplo 2.** No desenvolvimento de (x mais 2) na potência 10, qual é o coeficiente de x na
potência 7?
Aqui a é x e b é 2. O expoente de x é 10 menos k, e queremos que valha 7, logo k é 3. O termo é a
combinação de 10 tomados 3 a 3, que dá 120, vezes 2 ao cubo, que dá 8. O coeficiente é 960.

#### Quando o binômio tem sinal ou coeficiente

Nada muda na fórmula: o que estava no lugar de a e de b entra inteiro, com sinal e com coeficiente.
Quando o segundo termo é negativo, os sinais do desenvolvimento se alternam.

**Exemplo 3.** Desenvolver (2x menos 3) na quarta.
Com a igual a 2x e b igual a menos 3, os coeficientes 1, 4, 6, 4 e 1 produzem 16x na quarta menos
96x ao cubo mais 216x ao quadrado menos 216x mais 81.

#### Termo independente

Chama-se termo independente aquele em que a variável desaparece, isto é, aquele cujo expoente final
de x é zero. Para achá-lo, escreva o expoente de x do termo geral em função de k e resolva a equação
que o iguala a zero.

**Exemplo 4.** Qual é o termo independente de x no desenvolvimento de (x ao quadrado mais 1 sobre x)
na potência 9?
O termo geral tem x ao quadrado elevado a 9 menos k, multiplicado por x elevado a menos k, o que
deixa o expoente 18 menos 3k. Igualando a zero, k vale 6. O termo é a combinação de 9 tomados 6 a 6,
que dá 84.

#### Erros comuns

**Confundir o índice do termo com o valor de k.** No termo geral, k conta a partir de zero, então o
termo com k igual a 3 é o quarto do desenvolvimento.

**Esquecer de elevar o coeficiente.** Em (2x mais 3), o 2 também vai à potência, e ignorar isso muda
todos os termos.

**Perder o sinal.** Com o segundo termo negativo, quem tem k par fica positivo e quem tem k ímpar
fica negativo.

**Somar os expoentes errado ao lidar com frações.** Quando aparece 1 sobre x, o expoente é negativo,
e ele se soma ao outro expoente, não se subtrai duas vezes.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule o coeficiente binomial de 7 sobre 3.
2. Escreva a linha do triângulo de Pascal correspondente a n igual a 5.
3. Desenvolva (x mais 2) ao cubo.
4. Desenvolva (x menos 1) na quarta.
5. Calcule a soma dos coeficientes do desenvolvimento de (x mais 1) na potência 5.

**Bloco B. Consolidação**

6. Desenvolva (2x menos 3) na quarta.
7. No desenvolvimento de (x mais 2) na potência 10, determine o coeficiente de x na potência 7.
8. No desenvolvimento de (x mais 1) na potência 6, determine o coeficiente de x ao cubo.
9. Quantos termos tem o desenvolvimento de (a mais b) na potência 12?
10. Determine o termo central do desenvolvimento de (x mais 2) na potência 6.
11. Determine o termo independente de x no desenvolvimento de (x mais 1 sobre x) na potência 6.
12. Calcule a soma dos coeficientes do desenvolvimento de (2x menos 1) na potência 5.
13. No desenvolvimento de (3x menos 1) na quarta, determine o coeficiente de x ao quadrado.

**Bloco C. Aprofundamento**

14. Determine o termo independente de x no desenvolvimento de (x ao quadrado mais 1 sobre x) na
    potência 9.
15. O desenvolvimento de (a mais b) na potência n tem 15 termos. Determine n.
16. Verifique se o desenvolvimento de (x ao cubo mais 1 sobre x ao quadrado) na potência 10 tem
    termo independente de x e, em caso afirmativo, calcule esse termo.
17. Justifique, substituindo a por 1 e b por 1 no desenvolvimento de (a mais b) na potência n, que a
    soma dos coeficientes binomiais de uma linha do triângulo de Pascal vale 2 na potência n. Depois
    calcule essa soma para n igual a 8.
18. No desenvolvimento de (x mais 1 sobre x ao quadrado) na potência 12, determine o coeficiente do
    termo em x ao cubo.

### Gabarito

1. 35.
2. 1, 5, 10, 10, 5 e 1.
3. x ao cubo mais 6x ao quadrado mais 12x mais 8.
4. x na quarta menos 4x ao cubo mais 6x ao quadrado menos 4x mais 1.
5. 32. Basta substituir x por 1, o que dá 2 na potência 5.
6. 16x na quarta menos 96x ao cubo mais 216x ao quadrado menos 216x mais 81.
7. 960. O valor de k é 3, e o termo tem o coeficiente binomial de 10 sobre 3 multiplicado por 2 ao
   cubo.
8. 20.
9. 13.
10. 160x ao cubo. O termo central corresponde a k igual a 3.
11. 20. O expoente de x é 6 menos 2k, que se anula com k igual a 3.
12. 1. Substituindo x por 1, o binômio vira 1 e a potência também.
13. 54.
14. 84. O expoente de x é 18 menos 3k, que se anula com k igual a 6.
15. 14. O número de termos é n mais 1.
16. O termo independente existe e vale 210. O expoente de x é 30 menos 5k, que se anula com k igual
    a 6.
17. Com a igual a 1 e b igual a 1, cada termo do desenvolvimento vira o próprio coeficiente
    binomial, e o lado esquerdo vira 2 na potência n. Logo a soma da linha é 2 na potência n. Para n
    igual a 8 a soma vale 256.
18. 220. O expoente de x é 12 menos 3k, que vale 3 quando k é 3, e o coeficiente binomial de 12
    sobre 3 dá 220.

## EN

### Explanation

#### Where the coefficients come from

Everybody knows how to expand the square of a sum. The cube already takes work, and the fifth power,
done by brute force, fills half a page and usually comes out wrong. The binomial theorem settles
this: it tells you the expansion of any power of a sum of two terms, with no repeated multiplication.

The reason is a counting one. When you multiply the factor (a plus b) by itself n times, every part
of the result comes from choosing, in each of the n factors, whether you take the a or the b. A term
where b appears k times comes from choosing which k factors contribute the b, and that can be done
in as many ways as the combination of n elements taken k at a time. That is why the coefficients of
the expansion are exactly the binomial coefficients.

#### Pascal's triangle

The binomial coefficients sit in a triangle where every row starts and ends with 1 and every inner
number is the sum of the two above it. The first rows are:

for n equal to 0, the number 1
for n equal to 1, the numbers 1 and 1
for n equal to 2, the numbers 1, 2 and 1
for n equal to 3, the numbers 1, 3, 3 and 1
for n equal to 4, the numbers 1, 4, 6, 4 and 1
for n equal to 5, the numbers 1, 5, 10, 10, 5 and 1

Two properties help a great deal. The row is symmetric, so the combination of n taken k at a time
equals the combination of n taken n minus k at a time. And the sum of the whole row of order n is 2
to the power n, which you prove by replacing a and b with 1 in the expansion.

#### The formula

The expansion of (a plus b) to the power n has n plus 1 terms. In it, the exponent of a starts at n
and drops one at a time down to zero, while the exponent of b runs the other way, and the two
exponents always add up to n. Each term carries as its coefficient the combination of n taken k at a
time, where k is the exponent of b.

**Example 1.** Expand (x plus 2) cubed.
The coefficients of the row of order 3 are 1, 3, 3 and 1. So the result is x cubed plus 3 times x
squared times 2, plus 3 times x times 4, plus 8, that is, x cubed plus 6x squared plus 12x plus 8.

#### The general term

When the power is large and only one term is wanted, writing everything is a waste. The general term
of the expansion of (a plus b) to the power n is

the combination of n taken k at a time, times a to the power n minus k, times b to the power k

You just work out which k produces the exponent you want and calculate that term alone.

**Example 2.** In the expansion of (x plus 2) to the power 10, what is the coefficient of x to the
power 7?
Here a is x and b is 2. The exponent of x is 10 minus k, and we want it to be 7, so k is 3. The term
is the combination of 10 taken 3 at a time, which gives 120, times 2 cubed, which gives 8. The
coefficient is 960.

#### When the binomial carries a sign or a coefficient

Nothing changes in the formula: whatever stands in the place of a and of b goes in whole, sign and
coefficient included. When the second term is negative, the signs in the expansion alternate.

**Example 3.** Expand (2x minus 3) to the fourth.
With a equal to 2x and b equal to minus 3, the coefficients 1, 4, 6, 4 and 1 produce 16x to the
fourth minus 96x cubed plus 216x squared minus 216x plus 81.

#### The independent term

The independent term is the one in which the variable disappears, that is, the one whose final
exponent of x is zero. To find it, write the exponent of x of the general term as a function of k
and solve the equation that sets it equal to zero.

**Example 4.** What is the term independent of x in the expansion of (x squared plus 1 over x) to
the power 9?
The general term has x squared raised to 9 minus k, multiplied by x raised to minus k, which leaves
the exponent 18 minus 3k. Setting it equal to zero, k is 6. The term is the combination of 9 taken 6
at a time, which gives 84.

#### Common mistakes

**Confusing the position of the term with the value of k.** In the general term, k counts from zero,
so the term with k equal to 3 is the fourth one of the expansion.

**Forgetting to raise the coefficient.** In (2x plus 3), the 2 goes to the power as well, and
ignoring that changes every term.

**Losing the sign.** With a negative second term, terms with even k stay positive and terms with odd
k turn negative.

**Adding the exponents wrongly when fractions appear.** When 1 over x shows up, the exponent is
negative, and it is added to the other exponent, not subtracted twice.

### Exercises

**Block A. Fundamentals**

1. Work out the binomial coefficient 7 choose 3.
2. Write the row of Pascal's triangle for n equal to 5.
3. Expand (x plus 2) cubed.
4. Expand (x minus 1) to the fourth.
5. Work out the sum of the coefficients of the expansion of (x plus 1) to the power 5.

**Block B. Building up**

6. Expand (2x minus 3) to the fourth.
7. In the expansion of (x plus 2) to the power 10, find the coefficient of x to the power 7.
8. In the expansion of (x plus 1) to the power 6, find the coefficient of x cubed.
9. How many terms does the expansion of (a plus b) to the power 12 have?
10. Find the middle term of the expansion of (x plus 2) to the power 6.
11. Find the term independent of x in the expansion of (x plus 1 over x) to the power 6.
12. Work out the sum of the coefficients of the expansion of (2x minus 1) to the power 5.
13. In the expansion of (3x minus 1) to the fourth, find the coefficient of x squared.

**Block C. Going further**

14. Find the term independent of x in the expansion of (x squared plus 1 over x) to the power 9.
15. The expansion of (a plus b) to the power n has 15 terms. Find n.
16. Check whether the expansion of (x cubed plus 1 over x squared) to the power 10 has a term
    independent of x and, if it does, work that term out.
17. By replacing a with 1 and b with 1 in the expansion of (a plus b) to the power n, justify that
    the sum of the binomial coefficients of a row of Pascal's triangle is 2 to the power n. Then
    work out that sum for n equal to 8.
18. In the expansion of (x plus 1 over x squared) to the power 12, find the coefficient of the term
    in x cubed.

### Answer key

1. 35.
2. 1, 5, 10, 10, 5 and 1.
3. x cubed plus 6x squared plus 12x plus 8.
4. x to the fourth minus 4x cubed plus 6x squared minus 4x plus 1.
5. 32. Just replace x with 1, which gives 2 to the power 5.
6. 16x to the fourth minus 96x cubed plus 216x squared minus 216x plus 81.
7. 960. The value of k is 3, and the term has the binomial coefficient 10 choose 3 multiplied by 2
   cubed.
8. 20.
9. 13.
10. 160x cubed. The middle term corresponds to k equal to 3.
11. 20. The exponent of x is 6 minus 2k, which vanishes when k equals 3.
12. 1. Replacing x with 1, the binomial becomes 1 and so does the power.
13. 54.
14. 84. The exponent of x is 18 minus 3k, which vanishes when k equals 6.
15. 14. The number of terms is n plus 1.
16. The independent term exists and equals 210. The exponent of x is 30 minus 5k, which vanishes
    when k equals 6.
17. With a equal to 1 and b equal to 1, every term of the expansion becomes the binomial coefficient
    itself, and the left side becomes 2 to the power n. So the sum of the row is 2 to the power n.
    For n equal to 8 the sum is 256.
18. 220. The exponent of x is 12 minus 3k, which equals 3 when k is 3, and the binomial coefficient
    12 choose 3 gives 220.

## VERIFICACAO

```python
X1: expand((x+2)**3) == x**3 + 6*x**2 + 12*x + 8
X2: binomial(10,3)*2**3 == 960 and binomial(10,3) == 120
X3: expand((2*x-3)**4) == 16*x**4 - 96*x**3 + 216*x**2 - 216*x + 81
X4: binomial(9,6) == 84 and 18 - 3*6 == 0
E1: binomial(7,3) == 35
E2: [binomial(5,k) for k in range(6)] == [1, 5, 10, 10, 5, 1]
E3: expand((x+2)**3) == x**3 + 6*x**2 + 12*x + 8
E4: expand((x-1)**4) == x**4 - 4*x**3 + 6*x**2 - 4*x + 1
E5: expand((x+1)**5).subs(x, 1) == 32 and 2**5 == 32
E6: expand((2*x-3)**4) == 16*x**4 - 96*x**3 + 216*x**2 - 216*x + 81
E7: binomial(10,3)*2**3 == 960
E8: binomial(6,3) == 20
E9: 12 + 1 == 13
E10: binomial(6,3)*2**3 == 160
E11: binomial(6,3) == 20 and 6 - 2*3 == 0
E12: expand((2*x-1)**5).subs(x, 1) == 1
E13: binomial(4,2)*3**2 == 54
E14: binomial(9,6) == 84 and 18 - 3*6 == 0
E15: solve(Eq(n + 1, 15), n) == [14]
E16: binomial(10,6) == 210 and 30 - 5*6 == 0
E17: sum([binomial(8,k) for k in range(9)]) == 2**8 and 2**8 == 256
E18: binomial(12,3) == 220 and 12 - 3*3 == 3
```
