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

A razão é de contagem. Ao multiplicar o fator (a + b) por ele mesmo n vezes, cada parcela do
resultado nasce de escolher, em cada um dos n fatores, se você leva o a ou o b. Um termo com b
aparecendo k vezes vem de escolher quais k fatores contribuem com o b, e isso pode ser feito de
C_{n, k} modos, onde C_{n, k} é a combinação de n elementos tomados k a k. Por isso os coeficientes
do desenvolvimento são exatamente os coeficientes binomiais.

#### O triângulo de Pascal

Os coeficientes binomiais se organizam num triângulo em que cada linha começa e termina em 1 e cada
número interno é a soma dos dois que estão acima dele. As primeiras linhas são:

n = 0: 1
n = 1: 1, 1
n = 2: 1, 2, 1
n = 3: 1, 3, 3, 1
n = 4: 1, 4, 6, 4, 1
n = 5: 1, 5, 10, 10, 5, 1

Duas propriedades ajudam bastante. A linha é simétrica, então C_{n, k} = C_{n, n-k}. E a soma de
toda a linha de ordem n vale 2^{n}, o que se prova substituindo a e b por 1 no desenvolvimento.

#### A fórmula

O desenvolvimento de (a + b)^{n} tem n + 1 termos. Nele, o expoente de a começa em n e cai de um em
um até zero, enquanto o expoente de b faz o caminho inverso, e a soma dos dois expoentes é sempre n.
Cada termo leva como coeficiente C_{n, k}, onde k é o expoente de b.

**Exemplo 1.** Desenvolver (x + 2)^{3}.
Os coeficientes da linha de ordem 3 são 1, 3, 3 e 1. Então (x + 2)^{3} = x^{3} + 3 · x^{2} · 2 +
3 · x · 4 + 8, ou seja, x^{3} + 6x^{2} + 12x + 8.

#### O termo geral

Quando a potência é grande e se quer apenas um termo, escrever tudo é desperdício. O termo geral do
desenvolvimento de (a + b)^{n} é

T_{k+1} = C_{n, k} · a^{n-k} · b^{k}

onde k vai de zero a n, C_{n, k} é a combinação de n tomados k a k e T_{k+1} é o termo que ocupa a
posição k + 1.

Basta descobrir qual k produz o expoente pedido e calcular só aquele termo.

**Exemplo 2.** No desenvolvimento de (x + 2)^{10}, qual é o coeficiente de x^{7}?
Aqui a = x e b = 2. O expoente de x é 10 - k, e queremos que valha 7, logo k = 3. O termo é
C_{10, 3} · 2^{3}, com C_{10, 3} = 120 e 2^{3} = 8. O coeficiente é 960.

#### Quando o binômio tem sinal ou coeficiente

Nada muda na fórmula: o que estava no lugar de a e de b entra inteiro, com sinal e com coeficiente.
Quando o segundo termo é negativo, os sinais do desenvolvimento se alternam.

**Exemplo 3.** Desenvolver (2x - 3)^{4}.
Com a = 2x e b = -3, os coeficientes 1, 4, 6, 4 e 1 produzem
(2x - 3)^{4} = 16x^{4} - 96x^{3} + 216x^{2} - 216x + 81.

#### Termo independente

Chama-se termo independente aquele em que a variável desaparece, isto é, aquele cujo expoente final
de x é zero. Para achá-lo, escreva o expoente de x do termo geral em função de k e resolva a equação
que o iguala a zero.

**Exemplo 4.** Qual é o termo independente de x no desenvolvimento de (x^{2} + 1/x)^{9}?
O termo geral tem (x^{2})^{9-k} multiplicado por x^{-k}, o que deixa o expoente 18 - 3k. Igualando a
zero, k = 6. O termo é C_{9, 6} = 84.

#### Erros comuns

**Confundir o índice do termo com o valor de k.** No termo geral, k conta a partir de zero, então o
termo com k = 3 é T_{4}, o quarto do desenvolvimento.

**Esquecer de elevar o coeficiente.** Em (2x + 3), o 2 também vai à potência, e ignorar isso muda
todos os termos.

**Perder o sinal.** Com o segundo termo negativo, quem tem k par fica positivo e quem tem k ímpar
fica negativo.

**Somar os expoentes errado ao lidar com frações.** Quando aparece 1/x, o expoente é negativo, e ele
se soma ao outro expoente, não se subtrai duas vezes.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule o coeficiente binomial C_{7, 3}.
2. Escreva a linha do triângulo de Pascal correspondente a n = 5.
3. Desenvolva (x + 2)^{3}.
4. Desenvolva (x - 1)^{4}.
5. Calcule a soma dos coeficientes do desenvolvimento de (x + 1)^{5}.

**Bloco B. Consolidação**

6. Desenvolva (2x - 3)^{4}.
7. No desenvolvimento de (x + 2)^{10}, determine o coeficiente de x^{7}.
8. No desenvolvimento de (x + 1)^{6}, determine o coeficiente de x^{3}.
9. Quantos termos tem o desenvolvimento de (a + b)^{12}?
10. Determine o termo central do desenvolvimento de (x + 2)^{6}.
11. Determine o termo independente de x no desenvolvimento de (x + 1/x)^{6}.
12. Calcule a soma dos coeficientes do desenvolvimento de (2x - 1)^{5}.
13. No desenvolvimento de (3x - 1)^{4}, determine o coeficiente de x^{2}.

**Bloco C. Aprofundamento**

14. Determine o termo independente de x no desenvolvimento de (x^{2} + 1/x)^{9}.
15. O desenvolvimento de (a + b)^{n} tem 15 termos. Determine n.
16. Verifique se o desenvolvimento de (x^{3} + 1/x^{2})^{10} tem termo independente de x e, em caso
    afirmativo, calcule esse termo.
17. Justifique, substituindo a por 1 e b por 1 no desenvolvimento de (a + b)^{n}, que a soma dos
    coeficientes binomiais de uma linha do triângulo de Pascal vale 2^{n}. Depois calcule essa soma
    para n = 8.
18. No desenvolvimento de (x + 1/x^{2})^{12}, determine o coeficiente do termo em x^{3}.

### Gabarito

1. 35.
2. 1, 5, 10, 10, 5 e 1.
3. x^{3} + 6x^{2} + 12x + 8.
4. x^{4} - 4x^{3} + 6x^{2} - 4x + 1.
5. 32. Basta substituir x por 1, o que dá 2^{5}.
6. 16x^{4} - 96x^{3} + 216x^{2} - 216x + 81.
7. 960. O valor de k é 3, e o termo é C_{10, 3} · 2^{3}.
8. 20.
9. 13.
10. 160x^{3}. O termo central corresponde a k = 3.
11. 20. O expoente de x é 6 - 2k, que se anula com k = 3.
12. 1. Substituindo x por 1, o binômio vira 1 e a potência também.
13. 54.
14. 84. O expoente de x é 18 - 3k, que se anula com k = 6.
15. 14. O número de termos é n + 1.
16. O termo independente existe e vale 210. O expoente de x é 30 - 5k, que se anula com k = 6.
17. Com a = 1 e b = 1, cada termo do desenvolvimento vira o próprio coeficiente binomial, e o lado
    esquerdo vira 2^{n}. Logo a soma da linha é 2^{n}. Para n = 8 a soma vale 256.
18. 220. O expoente de x é 12 - 3k, que vale 3 quando k = 3, e C_{12, 3} = 220.

## EN

### Explanation

#### Where the coefficients come from

Everybody knows how to expand the square of a sum. The cube already takes work, and the fifth power,
done by brute force, fills half a page and usually comes out wrong. The binomial theorem settles
this: it tells you the expansion of any power of a sum of two terms, with no repeated multiplication.

The reason is a counting one. When you multiply the factor (a + b) by itself n times, every part of
the result comes from choosing, in each of the n factors, whether you take the a or the b. A term
where b appears k times comes from choosing which k factors contribute the b, and that can be done
in C_{n, k} ways, where C_{n, k} is the combination of n elements taken k at a time. That is why the
coefficients of the expansion are exactly the binomial coefficients.

#### Pascal's triangle

The binomial coefficients sit in a triangle where every row starts and ends with 1 and every inner
number is the sum of the two above it. The first rows are:

n = 0: 1
n = 1: 1, 1
n = 2: 1, 2, 1
n = 3: 1, 3, 3, 1
n = 4: 1, 4, 6, 4, 1
n = 5: 1, 5, 10, 10, 5, 1

Two properties help a great deal. The row is symmetric, so C_{n, k} = C_{n, n-k}. And the sum of the
whole row of order n is 2^{n}, which you prove by replacing a and b with 1 in the expansion.

#### The formula

The expansion of (a + b)^{n} has n + 1 terms. In it, the exponent of a starts at n and drops one at
a time down to zero, while the exponent of b runs the other way, and the two exponents always add up
to n. Each term carries C_{n, k} as its coefficient, where k is the exponent of b.

**Example 1.** Expand (x + 2)^{3}.
The coefficients of the row of order 3 are 1, 3, 3 and 1. So (x + 2)^{3} = x^{3} + 3 · x^{2} · 2 +
3 · x · 4 + 8, that is, x^{3} + 6x^{2} + 12x + 8.

#### The general term

When the power is large and only one term is wanted, writing everything is a waste. The general term
of the expansion of (a + b)^{n} is

T_{k+1} = C_{n, k} · a^{n-k} · b^{k}

where k runs from zero to n, C_{n, k} is the combination of n taken k at a time and T_{k+1} is the
term sitting in position k + 1.

You just work out which k produces the exponent you want and calculate that term alone.

**Example 2.** In the expansion of (x + 2)^{10}, what is the coefficient of x^{7}?
Here a = x and b = 2. The exponent of x is 10 - k, and we want it to be 7, so k = 3. The term is
C_{10, 3} · 2^{3}, with C_{10, 3} = 120 and 2^{3} = 8. The coefficient is 960.

#### When the binomial carries a sign or a coefficient

Nothing changes in the formula: whatever stands in the place of a and of b goes in whole, sign and
coefficient included. When the second term is negative, the signs in the expansion alternate.

**Example 3.** Expand (2x - 3)^{4}.
With a = 2x and b = -3, the coefficients 1, 4, 6, 4 and 1 produce
(2x - 3)^{4} = 16x^{4} - 96x^{3} + 216x^{2} - 216x + 81.

#### The independent term

The independent term is the one in which the variable disappears, that is, the one whose final
exponent of x is zero. To find it, write the exponent of x of the general term as a function of k
and solve the equation that sets it equal to zero.

**Example 4.** What is the term independent of x in the expansion of (x^{2} + 1/x)^{9}?
The general term has (x^{2})^{9-k} multiplied by x^{-k}, which leaves the exponent 18 - 3k. Setting
it equal to zero, k = 6. The term is C_{9, 6} = 84.

#### Common mistakes

**Confusing the position of the term with the value of k.** In the general term, k counts from zero,
so the term with k = 3 is T_{4}, the fourth one of the expansion.

**Forgetting to raise the coefficient.** In (2x + 3), the 2 goes to the power as well, and ignoring
that changes every term.

**Losing the sign.** With a negative second term, terms with even k stay positive and terms with odd
k turn negative.

**Adding the exponents wrongly when fractions appear.** When 1/x shows up, the exponent is negative,
and it is added to the other exponent, not subtracted twice.

### Exercises

**Block A. Fundamentals**

1. Work out the binomial coefficient C_{7, 3}.
2. Write the row of Pascal's triangle for n = 5.
3. Expand (x + 2)^{3}.
4. Expand (x - 1)^{4}.
5. Work out the sum of the coefficients of the expansion of (x + 1)^{5}.

**Block B. Building up**

6. Expand (2x - 3)^{4}.
7. In the expansion of (x + 2)^{10}, find the coefficient of x^{7}.
8. In the expansion of (x + 1)^{6}, find the coefficient of x^{3}.
9. How many terms does the expansion of (a + b)^{12} have?
10. Find the middle term of the expansion of (x + 2)^{6}.
11. Find the term independent of x in the expansion of (x + 1/x)^{6}.
12. Work out the sum of the coefficients of the expansion of (2x - 1)^{5}.
13. In the expansion of (3x - 1)^{4}, find the coefficient of x^{2}.

**Block C. Going further**

14. Find the term independent of x in the expansion of (x^{2} + 1/x)^{9}.
15. The expansion of (a + b)^{n} has 15 terms. Find n.
16. Check whether the expansion of (x^{3} + 1/x^{2})^{10} has a term independent of x and, if it
    does, work that term out.
17. By replacing a with 1 and b with 1 in the expansion of (a + b)^{n}, justify that the sum of the
    binomial coefficients of a row of Pascal's triangle is 2^{n}. Then work out that sum for n = 8.
18. In the expansion of (x + 1/x^{2})^{12}, find the coefficient of the term in x^{3}.

### Answer key

1. 35.
2. 1, 5, 10, 10, 5 and 1.
3. x^{3} + 6x^{2} + 12x + 8.
4. x^{4} - 4x^{3} + 6x^{2} - 4x + 1.
5. 32. Just replace x with 1, which gives 2^{5}.
6. 16x^{4} - 96x^{3} + 216x^{2} - 216x + 81.
7. 960. The value of k is 3, and the term is C_{10, 3} · 2^{3}.
8. 20.
9. 13.
10. 160x^{3}. The middle term corresponds to k = 3.
11. 20. The exponent of x is 6 - 2k, which vanishes when k = 3.
12. 1. Replacing x with 1, the binomial becomes 1 and so does the power.
13. 54.
14. 84. The exponent of x is 18 - 3k, which vanishes when k = 6.
15. 14. The number of terms is n + 1.
16. The independent term exists and equals 210. The exponent of x is 30 - 5k, which vanishes when
    k = 6.
17. With a = 1 and b = 1, every term of the expansion becomes the binomial coefficient itself, and
    the left side becomes 2^{n}. So the sum of the row is 2^{n}. For n = 8 the sum is 256.
18. 220. The exponent of x is 12 - 3k, which equals 3 when k = 3, and C_{12, 3} = 220.

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
