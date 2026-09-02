---
id: MATEM3-07
serie: em3
unidade: algebra
titulo_pt: Polinômios: operações e divisão
titulo_en: Polynomials: operations and division
resumo_pt: Operar com polinômios, dividir pelo algoritmo da chave e pelo dispositivo de Briot e Ruffini, e usar o teorema do resto para descobrir raízes e fatores sem fazer a divisão.
resumo_en: Operating with polynomials, dividing by long division and by synthetic division, and using the remainder theorem to find roots and factors without carrying out the division.
prerequisitos: [MATEM1-04]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### O que é um polinômio

Um polinômio na variável x é uma soma de parcelas do tipo coeficiente vezes potência de x, com
expoentes naturais. O maior expoente que aparece com coeficiente não nulo é o **grau**, e o
coeficiente que acompanha essa maior potência é o **coeficiente dominante**.

Em 5x^{4} - 3x^{2} + 7, o grau é 4 e o coeficiente dominante é 5. Repare que o expoente precisa ser
natural: uma expressão com x no denominador ou dentro de raiz não é polinômio.

Calcular o **valor numérico** é apenas substituir. O valor de P em a se escreve P(a), e é ele que vai
carregar quase toda a teoria adiante.

**Exemplo 1.** Sendo P(x) = x^{3} - 4x^{2} + 2x + 5, calcular P(3).
Substituindo: P(3) = 27 - 36 + 6 + 5 = 2.

#### Somar, subtrair e multiplicar

Somar e subtrair é juntar termos semelhantes, com atenção ao sinal quando o segundo polinômio está
entre parênteses precedido de menos: o sinal se distribui por todos os termos.

Multiplicar é aplicar a distributiva e depois reunir semelhantes. O grau do produto é a soma dos
graus, e é um bom teste rápido: se você multiplicou um polinômio de grau 1 por um de grau 2 e não
apareceu grau 3, algo se perdeu.

#### Divisão pelo algoritmo da chave

Dividir P por D produz um quociente Q e um resto R, tais que

P = D · Q + R, com o grau de R menor que o grau de D

O procedimento é o mesmo da divisão de números: divida o termo de maior grau do que sobrou pelo
termo de maior grau do divisor, multiplique, subtraia, repita. Pare quando o que sobrou tiver grau
menor que o do divisor. Se faltar alguma potência intermediária, escreva-a com coeficiente zero
antes de começar, porque a coluna precisa existir.

**Exemplo 2.** Dividir 3x^{3} - x^{2} + 2 por x^{2} - 2.
Primeiro passo: 3x^{3} ÷ x^{2} = 3x. Multiplicando e subtraindo, sobra -x^{2} + 6x + 2.
Segundo passo: -x^{2} ÷ x^{2} = -1. Multiplicando e subtraindo, sobra 6x.
O quociente é Q = 3x - 1 e o resto é R = 6x. Conferindo: (x^{2} - 2) · (3x - 1) + 6x devolve o
polinômio original.

#### Teorema do resto

Este teorema economiza tempo como poucos: **o resto da divisão de P por x - a é exatamente P(a)**.
Não é preciso dividir para saber o resto, basta substituir.

**Exemplo 3.** Determinar o resto da divisão de x^{5} + 2x - 1 por x + 1.
O divisor x + 1 é x - (-1), então a = -1. Substituindo: P(-1) = -1 - 2 - 1 = -4. Esse é o resto.

A consequência mais útil é o teorema do fator: **x - a divide P exatamente quando P(a) = 0**, isto é,
quando a é raiz de P. É assim que se testa um candidato a raiz em um segundo.

#### Dispositivo de Briot e Ruffini

Quando o divisor é do tipo x - a, existe um esquema muito mais rápido do que a chave. Escreva a
à esquerda e os coeficientes de P em ordem decrescente de grau, sem pular nenhuma potência. Baixe o
primeiro coeficiente. Depois, repita: multiplique o último número obtido por a e some ao próximo
coeficiente.

Os números obtidos, exceto o último, são os coeficientes do quociente, que tem um grau a menos. O
último número é o resto.

**Exemplo 4.** Dividir x^{3} - 2x^{2} - 5x + 6 por x - 1.
Com a = 1 e coeficientes 1, -2, -5 e 6:
baixa o 1; depois 1 · 1 + (-2) = -1; depois -1 · 1 + (-5) = -6; por fim -6 · 1 + 6 = 0.
O quociente é x^{2} - x - 6 e o resto é zero, logo 1 é raiz do polinômio.

Encadeando o dispositivo com raízes sucessivas, chega-se à fatoração completa de um polinômio de
grau alto sem nunca resolver uma equação difícil.

#### Erros comuns

**Esquecer o coeficiente zero das potências que faltam.** Em x^{3} + 1 os coeficientes são 1, 0, 0 e
1. Quem escreve só 1 e 1 desalinha a conta inteira.

**Trocar o sinal de a no divisor.** Para dividir por x + 3, o valor de a é -3, porque x + 3 é
x - (-3).

**Parar a divisão cedo ou tarde demais.** Continue enquanto o que sobrou tiver grau maior ou igual
ao do divisor, e pare no instante em que ficar menor.

**Somar os graus na soma de polinômios.** Os graus se somam na multiplicação. Na soma, o grau é no
máximo o maior dos dois.

### Exercícios

**Bloco A. Fundamentos**

1. Determine o grau e o coeficiente dominante do polinômio 5x^{4} - 3x^{2} + 7.
2. Sendo P(x) = 2x^{3} - 5x^{2} + x - 3, calcule P(2).
3. Calcule a soma dos polinômios 3x^{2} + 2x - 1 e x^{2} - 4x + 6.
4. Sendo P(x) = x^{3} - 2x + 4, calcule P(-1).
5. Calcule o produto (x + 3) · (x - 5).

**Bloco B. Consolidação**

6. Calcule o produto (2x - 1) · (x^{2} + 3x - 4).
7. Divida x^{3} - 6x^{2} + 11x - 6 por x - 1, indicando o quociente e o resto.
8. Divida 2x^{3} + 3x^{2} - x + 5 por x^{2} + x - 1, indicando o quociente e o resto.
9. Determine o resto da divisão de x^{4} - 3x^{2} + 2 por x - 2, usando o teorema do resto.
10. Determine o resto da divisão de 2x^{3} - x^{2} + 3x - 5 por x + 1, usando o teorema do resto.
11. Use o dispositivo de Briot e Ruffini para dividir x^{3} + 2x^{2} - 5x - 6 por x - 2, indicando o
    quociente e o resto.
12. Verifique se x - 3 é fator do polinômio x^{3} - 4x^{2} + x + 6.
13. Determine k para que a divisão de x^{3} + kx^{2} - 4x + 3 por x - 1 deixe resto 5.
14. Calcule a diferença (4x^{3} - x + 2) - (x^{3} + 2x^{2} - 3x + 7).

**Bloco C. Aprofundamento**

15. Fatore completamente o polinômio x^{3} - 6x^{2} + 11x - 6, começando por testar 1 como raiz e
    usando o dispositivo de Briot e Ruffini.
16. Um polinômio dividido por x - 1 deixa resto 3, e dividido por x - 2 deixa resto 5. Determine o
    resto da divisão desse polinômio por (x - 1) · (x - 2).
17. Determine a e b para que o polinômio x^{4} + ax^{2} + b seja divisível por x^{2} - 3x + 2.
18. Determine m para que x - 3 seja fator do polinômio x^{3} - 3x^{2} + mx - 6.
19. Divida x^{4} - 1 por x - 1 usando o dispositivo de Briot e Ruffini e escreva a fatoração
    completa de x^{4} - 1 em fatores de coeficientes reais.

### Gabarito

1. Grau 4 e coeficiente dominante 5.
2. -5.
3. 4x^{2} - 2x + 5.
4. 5.
5. x^{2} - 2x - 15.
6. 2x^{3} + 5x^{2} - 11x + 4.
7. Quociente x^{2} - 5x + 6, resto zero.
8. Quociente 2x + 1, resto 6.
9. 6. Basta calcular P(2).
10. -11. Basta calcular P(-1).
11. Quociente x^{2} + 4x + 3, resto zero.
12. É fator, porque P(3) = 0.
13. k = 5.
14. 3x^{3} - 2x^{2} + 2x - 5.
15. (x - 1) · (x - 2) · (x - 3). O dispositivo com a raiz 1 dá quociente x^{2} - 5x + 6, que se
    fatora direto.
16. O resto é 2x + 1. Como o divisor tem grau 2, o resto tem a forma ax + b, e as condições dadas
    produzem o sistema a + b = 3 e 2a + b = 5.
17. a = -5 e b = 4. As raízes do divisor são 1 e 2, e ambas precisam anular o polinômio.
18. m = 2.
19. Quociente x^{3} + x^{2} + x + 1, com resto zero. A fatoração completa é
    (x - 1) · (x + 1) · (x^{2} + 1).

## EN

### Explanation

#### What a polynomial is

A polynomial in the variable x is a sum of terms of the type coefficient times a power of x, with
natural number exponents. The largest exponent appearing with a non zero coefficient is the
**degree**, and the coefficient attached to that highest power is the **leading coefficient**.

In 5x^{4} - 3x^{2} + 7, the degree is 4 and the leading coefficient is 5. Notice that the exponent
has to be a natural number: an expression with x in the denominator or inside a radical is not a
polynomial.

Computing the **value** is simply substituting. The value of P at a is written P(a), and it is what
carries almost all the theory ahead.

**Example 1.** With P(x) = x^{3} - 4x^{2} + 2x + 5, compute P(3).
Substituting: P(3) = 27 - 36 + 6 + 5 = 2.

#### Adding, subtracting and multiplying

Adding and subtracting means collecting like terms, with care about the sign when the second
polynomial sits in brackets preceded by a minus: the sign spreads over every term.

Multiplying means applying the distributive rule and then collecting like terms. The degree of the
product is the sum of the degrees, and that is a good quick check: if you multiplied a polynomial of
degree 1 by one of degree 2 and no degree 3 appeared, something got lost.

#### Long division

Dividing P by D produces a quotient Q and a remainder R, such that

P = D · Q + R, with the degree of R less than the degree of D

The procedure is the same as for numbers: divide the highest degree term of what is left by the
highest degree term of the divisor, multiply, subtract, repeat. Stop when what is left has degree
lower than the divisor. If an intermediate power is missing, write it with coefficient zero before
starting, because the column has to exist.

**Example 2.** Divide 3x^{3} - x^{2} + 2 by x^{2} - 2.
First step: 3x^{3} ÷ x^{2} = 3x. Multiplying and subtracting leaves -x^{2} + 6x + 2.
Second step: -x^{2} ÷ x^{2} = -1. Multiplying and subtracting leaves 6x.
The quotient is Q = 3x - 1 and the remainder is R = 6x. Checking: (x^{2} - 2) · (3x - 1) + 6x gives
back the original polynomial.

#### The remainder theorem

This theorem saves time like few others: **the remainder of the division of P by x - a is exactly
P(a)**. There is no need to divide in order to know the remainder, substituting is enough.

**Example 3.** Find the remainder of the division of x^{5} + 2x - 1 by x + 1.
The divisor x + 1 is x - (-1), so a = -1. Substituting: P(-1) = -1 - 2 - 1 = -4. That is the
remainder.

The most useful consequence is the factor theorem: **x - a divides P exactly when P(a) = 0**, that
is, when a is a root of P. That is how a candidate root gets tested in one second.

#### Synthetic division

When the divisor has the form x - a, there is a scheme far faster than long division. Write a on
the left and the coefficients of P in decreasing order of degree, skipping no power. Bring down the
first coefficient. Then repeat: multiply the last number obtained by a and add it to the next
coefficient.

The numbers obtained, except the last one, are the coefficients of the quotient, which has one degree
less. The last number is the remainder.

**Example 4.** Divide x^{3} - 2x^{2} - 5x + 6 by x - 1.
With a = 1 and coefficients 1, -2, -5 and 6:
bring down the 1; then 1 · 1 + (-2) = -1; then -1 · 1 + (-5) = -6; finally -6 · 1 + 6 = 0.
The quotient is x^{2} - x - 6 and the remainder is zero, so 1 is a root of the polynomial.

Chaining the scheme with successive roots leads to the complete factorisation of a high degree
polynomial without ever solving a hard equation.

#### Common mistakes

**Forgetting the zero coefficient of missing powers.** In x^{3} + 1 the coefficients are 1, 0, 0 and
1. Writing only 1 and 1 throws the whole calculation out of line.

**Flipping the sign of a in the divisor.** To divide by x + 3, the value of a is -3, because x + 3 is
x - (-3).

**Stopping the division too early or too late.** Carry on while what is left has degree greater than
or equal to the divisor, and stop the moment it becomes smaller.

**Adding the degrees when adding polynomials.** Degrees add in multiplication. In a sum, the degree
is at most the larger of the two.

### Exercises

**Block A. Fundamentals**

1. Find the degree and the leading coefficient of the polynomial 5x^{4} - 3x^{2} + 7.
2. With P(x) = 2x^{3} - 5x^{2} + x - 3, compute P(2).
3. Find the sum of the polynomials 3x^{2} + 2x - 1 and x^{2} - 4x + 6.
4. With P(x) = x^{3} - 2x + 4, compute P(-1).
5. Find the product (x + 3) · (x - 5).

**Block B. Building up**

6. Find the product (2x - 1) · (x^{2} + 3x - 4).
7. Divide x^{3} - 6x^{2} + 11x - 6 by x - 1, giving the quotient and the remainder.
8. Divide 2x^{3} + 3x^{2} - x + 5 by x^{2} + x - 1, giving the quotient and the remainder.
9. Find the remainder of the division of x^{4} - 3x^{2} + 2 by x - 2, using the remainder theorem.
10. Find the remainder of the division of 2x^{3} - x^{2} + 3x - 5 by x + 1, using the remainder
    theorem.
11. Use synthetic division to divide x^{3} + 2x^{2} - 5x - 6 by x - 2, giving the quotient and the
    remainder.
12. Check whether x - 3 is a factor of the polynomial x^{3} - 4x^{2} + x + 6.
13. Find k so that the division of x^{3} + kx^{2} - 4x + 3 by x - 1 leaves remainder 5.
14. Find the difference (4x^{3} - x + 2) - (x^{3} + 2x^{2} - 3x + 7).

**Block C. Going further**

15. Factorise completely the polynomial x^{3} - 6x^{2} + 11x - 6, starting by testing 1 as a root
    and using synthetic division.
16. A polynomial divided by x - 1 leaves remainder 3, and divided by x - 2 leaves remainder 5. Find
    the remainder of the division of that polynomial by (x - 1) · (x - 2).
17. Find a and b so that the polynomial x^{4} + ax^{2} + b is divisible by x^{2} - 3x + 2.
18. Find m so that x - 3 is a factor of the polynomial x^{3} - 3x^{2} + mx - 6.
19. Divide x^{4} - 1 by x - 1 using synthetic division and write the complete factorisation of
    x^{4} - 1 into factors with real coefficients.

### Answer key

1. Degree 4 and leading coefficient 5.
2. -5.
3. 4x^{2} - 2x + 5.
4. 5.
5. x^{2} - 2x - 15.
6. 2x^{3} + 5x^{2} - 11x + 4.
7. Quotient x^{2} - 5x + 6, remainder zero.
8. Quotient 2x + 1, remainder 6.
9. 6. It is enough to compute P(2).
10. -11. It is enough to compute P(-1).
11. Quotient x^{2} + 4x + 3, remainder zero.
12. It is a factor, because P(3) = 0.
13. k = 5.
14. 3x^{3} - 2x^{2} + 2x - 5.
15. (x - 1) · (x - 2) · (x - 3). The scheme with the root 1 gives quotient x^{2} - 5x + 6, which
    factorises straight away.
16. The remainder is 2x + 1. Since the divisor has degree 2, the remainder has the form ax + b, and
    the given conditions produce the system a + b = 3 and 2a + b = 5.
17. a = -5 and b = 4. The roots of the divisor are 1 and 2, and both must make the polynomial zero.
18. m = 2.
19. Quotient x^{3} + x^{2} + x + 1, with remainder zero. The complete factorisation is
    (x - 1) · (x + 1) · (x^{2} + 1).

## VERIFICACAO

```python
X1: (3**3 - 4*3**2 + 2*3 + 5) == 2
X2: div(Poly(3*x**3 - x**2 + 2, x), Poly(x**2 - 2, x)) == (Poly(3*x - 1, x), Poly(6*x, x)) and expand((x**2-2)*(3*x-1) + 6*x - (3*x**3 - x**2 + 2)) == 0
X3: ((-1)**5 + 2*(-1) - 1) == -4
X4: div(Poly(x**3 - 2*x**2 - 5*x + 6, x), Poly(x - 1, x)) == (Poly(x**2 - x - 6, x), Poly(0, x))
E1: degree(5*x**4 - 3*x**2 + 7, x) == 4 and Poly(5*x**4 - 3*x**2 + 7, x).LC() == 5
E2: (2*2**3 - 5*2**2 + 2 - 3) == -5
E3: expand((3*x**2 + 2*x - 1) + (x**2 - 4*x + 6)) == 4*x**2 - 2*x + 5
E4: ((-1)**3 - 2*(-1) + 4) == 5
E5: expand((x + 3)*(x - 5)) == x**2 - 2*x - 15
E6: expand((2*x - 1)*(x**2 + 3*x - 4)) == 2*x**3 + 5*x**2 - 11*x + 4
E7: div(Poly(x**3 - 6*x**2 + 11*x - 6, x), Poly(x - 1, x)) == (Poly(x**2 - 5*x + 6, x), Poly(0, x))
E8: div(Poly(2*x**3 + 3*x**2 - x + 5, x), Poly(x**2 + x - 1, x)) == (Poly(2*x + 1, x), Poly(6, x)) and expand((x**2+x-1)*(2*x+1) + 6 - (2*x**3 + 3*x**2 - x + 5)) == 0
E9: (2**4 - 3*2**2 + 2) == 6
E10: (2*(-1)**3 - (-1)**2 + 3*(-1) - 5) == -11
E11: div(Poly(x**3 + 2*x**2 - 5*x - 6, x), Poly(x - 2, x)) == (Poly(x**2 + 4*x + 3, x), Poly(0, x))
E12: (3**3 - 4*3**2 + 3 + 6) == 0
E13: solve(Eq(1 + k - 4 + 3, 5), k) == [5]
E14: expand((4*x**3 - x + 2) - (x**3 + 2*x**2 - 3*x + 7)) == 3*x**3 - 2*x**2 + 2*x - 5
E15: factor(x**3 - 6*x**2 + 11*x - 6) == (x - 1)*(x - 2)*(x - 3) and div(Poly(x**3 - 6*x**2 + 11*x - 6, x), Poly(x - 1, x)) == (Poly(x**2 - 5*x + 6, x), Poly(0, x))
E16: solve([Eq(a + b, 3), Eq(2*a + b, 5)], [a, b]) == {a: 2, b: 1}
E17: solve([Eq(1 + a + b, 0), Eq(16 + 4*a + b, 0)], [a, b]) == {a: -5, b: 4} and div(Poly(x**4 - 5*x**2 + 4, x), Poly(x**2 - 3*x + 2, x))[1] == Poly(0, x)
E18: solve(Eq(27 - 27 + 3*m - 6, 0), m) == [2]
E19: div(Poly(x**4 - 1, x), Poly(x - 1, x)) == (Poly(x**3 + x**2 + x + 1, x), Poly(0, x)) and factor(x**4 - 1) == (x - 1)*(x + 1)*(x**2 + 1)
```
