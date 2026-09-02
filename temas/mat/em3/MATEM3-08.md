---
id: MATEM3-08
serie: em3
unidade: algebra
titulo_pt: Equações polinomiais e raízes
titulo_en: Polynomial equations and roots
resumo_pt: Achar todas as raízes de uma equação polinomial usando fatoração, raízes racionais e as relações entre coeficientes e raízes.
resumo_en: Finding every root of a polynomial equation using factoring, rational roots and the relations between coefficients and roots.
prerequisitos: [MATEM3-07]
duracao_min: 90
dificuldade: 5
---

## PT

### Explicação

#### Do que se trata

Uma equação polinomial é uma igualdade da forma p(x) = 0, em que p é um polinômio. Resolver essa
equação é achar as **raízes** de p, ou seja, os valores que anulam o polinômio. Você já fez isso
com grau 1 e com grau 2. A partir do grau 3 não existe uma fórmula prática que valha para todos os
casos, então a estratégia muda: em vez de aplicar uma receita, procura-se **uma raiz** e usa-se ela
para baixar o grau.

O resultado que organiza todo o assunto é o teorema fundamental da álgebra. Ele garante que todo
polinômio de grau n, com n ≥ 1, tem exatamente n raízes quando contamos as raízes complexas e
contamos cada raiz tantas vezes quanto for a sua multiplicidade. Disso vem a **forma fatorada**:

p(x) = a_{n} · (x - r_{1}) · (x - r_{2}) e assim por diante, até (x - r_{n})

onde a_{n} é o coeficiente do termo de maior grau e r_{1} até r_{n} são as raízes. Escrever o
polinômio assim é o objetivo de quase todo exercício do tema.

#### Achar uma raiz para baixar o grau

Se r é raiz de p, então p é divisível por x - r, e a divisão devolve um polinômio de grau uma
unidade menor. Repetindo o processo, chega-se a um fator de grau 2, que já se resolve com a fórmula
conhecida.

**Exemplo 1.** Resolver x^{3} - 6x^{2} + 11x - 6 = 0.
Testando valores pequenos: para x = 1 temos 1 - 6 + 11 - 6, que dá zero. Então 1 é raiz. Dividindo
por x - 1, sobra x^{2} - 5x + 6, cujas raízes são 2 e 3. Logo o conjunto solução tem 1, 2 e 3.

#### Multiplicidade

Uma raiz pode aparecer mais de uma vez na forma fatorada. Em p(x) = (x - 4)^{2} · (x + 1), a raiz 4
tem multiplicidade 2 e a raiz -1 tem multiplicidade 1. O grau é a soma das multiplicidades, aqui 3.
Graficamente, a raiz de multiplicidade par faz o gráfico tocar o eixo horizontal sem atravessar, e a
de multiplicidade ímpar faz o gráfico atravessar.

#### Relações de Girard

Nem sempre é preciso achar as raízes para responder sobre elas. Os coeficientes já guardam a soma e o
produto. Para o polinômio de grau 3 dado por ax^{3} + bx^{2} + cx + d, com raízes r_{1}, r_{2} e
r_{3}:

soma das raízes: r_{1} + r_{2} + r_{3} = -b/a

soma dos produtos dois a dois: r_{1}·r_{2} + r_{1}·r_{3} + r_{2}·r_{3} = c/a

produto das raízes: r_{1}·r_{2}·r_{3} = -d/a

Para o grau 2, isso vira o velho par soma e produto. Para grau 4, o padrão continua, com os sinais
alternando: menos, mais, menos, mais.

**Exemplo 2.** No polinômio x^{3} - 6x^{2} + 11x - 6, a soma das raízes é 6, a soma dos produtos dois
a dois é 11 e o produto é 6. Conferindo com as raízes achadas antes: 1 + 2 + 3 = 6; os produtos dois
a dois são 2, 3 e 6, que somam 11; e o produto é 6.

Essas relações são a ferramenta certa quando o enunciado pede a soma dos quadrados das raízes, a soma
dos inversos, ou quando informa uma condição sobre as raízes e pede os coeficientes.

#### Raízes racionais

Quando os coeficientes são inteiros, há uma lista finita de candidatos a raiz racional. Se a fração
p/q, já simplificada, é raiz, então p divide o termo independente e q divide o coeficiente do termo
de maior grau. Isso transforma uma busca infinita em algumas contas.

**Exemplo 3.** Achar as raízes de 2x^{3} - 3x^{2} - 3x + 2 = 0.
O termo independente é 2, então p pode ser 1, -1, 2 ou -2. O coeficiente do maior grau é 2, então q
pode ser 1 ou 2. Os candidatos são 1, -1, 2, -2, 1/2 e -1/2. Substituindo, -1 anula o polinômio.
Dividindo por x + 1, sobra 2x^{2} - 5x + 2, cujas raízes são 2 e 1/2. As três raízes são -1, 1/2 e 2.

#### Raízes complexas andam em par

Se os coeficientes são reais e o número complexo a + bi é raiz, então a - bi também é. Por isso um
polinômio de grau 3 com coeficientes reais tem sempre ao menos uma raiz real: as complexas saem de
duas em duas e sobraria uma sozinha.

**Exemplo 4.** Resolver x^{3} - 5x^{2} + 17x - 13 = 0.
Para x = 1 temos 1 - 5 + 17 - 13, que dá zero. Dividindo por x - 1, sobra x^{2} - 4x + 13, com
discriminante 16 - 52 = -36. As outras duas raízes são 2 + 3i e 2 - 3i, conjugadas uma da outra.

#### Erros comuns

**Parar na primeira raiz.** Achar um valor que zera o polinômio é o começo, não o fim. O grau diz
quantas raízes existem.

**Esquecer a multiplicidade.** Um polinômio de grau 5 pode ter só duas raízes diferentes. Elas
continuam sendo cinco raízes contadas com multiplicidade.

**Trocar o sinal nas relações de Girard.** A soma é -b/a, e o produto para grau 3 é -d/a. Conferir
com um caso conhecido, como x^{2} - 5x + 6, evita o erro.

**Testar candidatos fora da lista.** Com coeficientes inteiros, não adianta procurar raiz racional
com denominador que não divide o coeficiente principal.

### Exercícios

**Bloco A. Fundamentos**

1. Resolva a equação x^{3} - 4x = 0.
2. Verifique que 2 é raiz de x^{3} - 3x^{2} + 4x - 4 e diga quantas raízes reais a equação tem ao
   todo.
3. Escreva, na forma expandida, o polinômio de grau 3 com coeficiente do termo de maior grau igual a
   1 e raízes 1, 2 e 5.
4. Dê as raízes de (x - 3)^{2} · (x + 1)^{3}, com suas multiplicidades, e o grau do polinômio.
5. Sem resolver a equação, dê a soma e o produto das raízes de x^{2} - 7x + 12 = 0.

**Bloco B. Consolidação**

6. Resolva x^{3} - 6x^{2} + 11x - 6 = 0.
7. Resolva x^{4} - 5x^{2} + 4 = 0.
8. As raízes de x^{3} - 2x^{2} - 5x + 6 = 0 somam quanto? Use as relações entre coeficientes e raízes
   para obter também a soma dos quadrados das raízes.
9. Determine todas as raízes racionais de 2x^{3} - 3x^{2} - 3x + 2 = 0.
10. Determine o valor de k para que 2 seja raiz de x^{3} - kx^{2} + 2x - 8, e diga quantas raízes
    reais a equação passa a ter.
11. Sabendo que 3 é raiz dupla de x^{3} - 5x^{2} + 3x + 9, escreva o polinômio na forma fatorada e dê
    todas as raízes.
12. Escreva a equação polinomial de grau 3, com coeficientes reais e coeficiente do termo de maior
    grau igual a 1, que tem 1 e 2 + i entre suas raízes.
13. Resolva x^{3} + x^{2} - 4x - 4 = 0 agrupando os termos.

**Bloco C. Aprofundamento**

14. Considere a equação 3x^{4} - 2x^{3} + x - 6 = 0. Sem resolvê-la, determine a soma e o produto de
    suas raízes.
15. As três raízes de x^{3} - 9x^{2} + 23x - 15 = 0 formam, nessa ordem, uma progressão aritmética.
    Use esse dado e as relações entre coeficientes e raízes para determiná-las.
16. Mostre que 3x^{3} + 2x^{2} - 4x + 1 = 0 não tem raiz inteira, encontre sua raiz racional e depois
    determine as outras duas raízes.
17. Na equação 2x^{3} - 5x^{2} + 4x - 7 = 0, calcule a soma dos inversos das raízes sem calcular as
    raízes.
18. Uma caixa sem tampa tem a forma de um bloco retangular cujas dimensões, em centímetros, são x,
    x + 2 e x + 4. O volume é de 192 centímetros cúbicos. Determine x e justifique por que a resposta
    é única.

### Gabarito

1. As raízes são -2, 0 e 2.
2. Substituindo, 8 - 12 + 8 - 4 = 0. Dividindo por x - 2 sobra x^{2} - x + 2, com discriminante
   negativo. A equação tem uma única raiz real, que é 2.
3. x^{3} - 8x^{2} + 17x - 10.
4. A raiz 3 tem multiplicidade 2 e a raiz -1 tem multiplicidade 3. O grau é 5.
5. Soma 7 e produto 12.
6. As raízes são 1, 2 e 3.
7. As raízes são -2, -1, 1 e 2.
8. A soma das raízes é 2. A soma dos produtos dois a dois é -5, e a soma dos quadrados é
   2^{2} - 2·(-5) = 14. As raízes são -2, 1 e 3.
9. As raízes racionais são -1, 1/2 e 2.
10. k = 1. O polinômio fica x^{3} - x^{2} + 2x - 8, que se fatora como (x - 2)·(x^{2} + x + 4). Como
    o fator de grau 2 tem discriminante negativo, há uma única raiz real, que é 2.
11. O polinômio é (x - 3)^{2} · (x + 1). As raízes são 3, com multiplicidade 2, e -1.
12. x^{3} - 5x^{2} + 9x - 5 = 0. Como os coeficientes são reais, 2 - i também é raiz, e o fator
    correspondente é x^{2} - 4x + 5.
13. Agrupando, x^{2}·(x + 1) - 4·(x + 1) = (x + 1)·(x^{2} - 4). As raízes são -2, -1 e 2.
14. A soma das raízes é 2/3 e o produto é -2.
15. As raízes são 1, 3 e 5. Como a soma é 9 e as raízes estão em progressão aritmética, a do meio é
    3. Escrevendo as outras como 3 - r e 3 + r, o produto 3·(9 - r^{2}) = 15, o que dá r = 2.
16. Os candidatos inteiros são 1 e -1, e nenhum anula o polinômio. Entre os candidatos fracionários,
    1/3 é raiz. A forma fatorada é (3x - 1)·(x^{2} + x - 1), e as outras duas raízes são
    (-1 + √5)/2 e (-1 - √5)/2.
17. A soma dos inversos é 4/7. Ela vale a soma dos produtos dois a dois dividida pelo produto das
    raízes, isto é, 2 dividido por 7/2.
18. x = 4, e as dimensões são 4, 6 e 8 centímetros. A equação fica x^{3} + 6x^{2} + 8x - 192 = 0, e o
    fator restante depois de dividir por x - 4 é x^{2} + 10x + 48, cujo discriminante é negativo.

## EN

### Explanation

#### What this is about

A polynomial equation is an equality of the form p(x) = 0, where p is a polynomial. Solving that
equation means finding the **roots** of p, that is, the values that make the polynomial vanish. You
have already done this for degree 1 and degree 2. From degree 3 on there is no practical formula
that covers every case, so the strategy changes: instead of applying a recipe, you look for **one
root** and use it to bring the degree down.

The result that organises the whole topic is the fundamental theorem of algebra. It guarantees that
every polynomial of degree n, with n ≥ 1, has exactly n roots once we count complex roots and count
each root as many times as its multiplicity. From this comes the **factored form**:

p(x) = a_{n} · (x - r_{1}) · (x - r_{2}) and so on, up to (x - r_{n})

where a_{n} is the leading coefficient and r_{1} through r_{n} are the roots. Writing the polynomial
this way is the goal of almost every problem in this topic.

#### Finding one root to bring the degree down

If r is a root of p, then p is divisible by x - r, and the division gives back a polynomial whose
degree is one unit lower. Repeating the process, you reach a factor of degree 2, which the familiar
formula already handles.

**Example 1.** Solve x^{3} - 6x^{2} + 11x - 6 = 0.
Testing small values: for x = 1 we get 1 - 6 + 11 - 6, which gives zero. So 1 is a root. Dividing by
x - 1 leaves x^{2} - 5x + 6, whose roots are 2 and 3. So the solution set holds 1, 2 and 3.

#### Multiplicity

A root may appear more than once in the factored form. In p(x) = (x - 4)^{2} · (x + 1), the root 4
has multiplicity 2 and the root -1 has multiplicity 1. The degree is the sum of the multiplicities,
here 3. On a graph, a root of even multiplicity makes the curve touch the horizontal axis without
crossing it, and one of odd multiplicity makes the curve cross.

#### Girard relations

You do not always need the roots in order to answer a question about them. The coefficients already
store the sum and the product. For the degree 3 polynomial given by ax^{3} + bx^{2} + cx + d, with
roots r_{1}, r_{2} and r_{3}:

sum of the roots: r_{1} + r_{2} + r_{3} = -b/a

sum of the products two at a time: r_{1}·r_{2} + r_{1}·r_{3} + r_{2}·r_{3} = c/a

product of the roots: r_{1}·r_{2}·r_{3} = -d/a

For degree 2 this becomes the familiar sum and product pair. For degree 4 the pattern continues, with
the signs alternating: minus, plus, minus, plus.

**Example 2.** In the polynomial x^{3} - 6x^{2} + 11x - 6, the sum of the roots is 6, the sum of the
products two at a time is 11 and the product is 6. Checking against the roots found earlier:
1 + 2 + 3 = 6; the products two at a time are 2, 3 and 6, which add to 11; and the product is 6.

These relations are the right tool when a problem asks for the sum of the squares of the roots, the
sum of their reciprocals, or when it states a condition on the roots and asks for the coefficients.

#### Rational roots

When the coefficients are whole numbers, there is a finite list of candidates for a rational root. If
the fraction p/q, already in lowest terms, is a root, then p divides the constant term and q divides
the leading coefficient. That turns an endless search into a few calculations.

**Example 3.** Find the roots of 2x^{3} - 3x^{2} - 3x + 2 = 0.
The constant term is 2, so p can be 1, -1, 2 or -2. The leading coefficient is 2, so q can be 1 or 2.
The candidates are 1, -1, 2, -2, 1/2 and -1/2. Substituting, -1 makes the polynomial vanish. Dividing
by x + 1 leaves 2x^{2} - 5x + 2, whose roots are 2 and 1/2. The three roots are -1, 1/2 and 2.

#### Complex roots come in pairs

If the coefficients are real and the complex number a + bi is a root, then a - bi is a root too. That
is why a degree 3 polynomial with real coefficients always has at least one real root: the complex
ones come two by two and one would be left on its own.

**Example 4.** Solve x^{3} - 5x^{2} + 17x - 13 = 0.
For x = 1 we get 1 - 5 + 17 - 13, which gives zero. Dividing by x - 1 leaves x^{2} - 4x + 13, with
discriminant 16 - 52 = -36. The other two roots are 2 + 3i and 2 - 3i, conjugates of each other.

#### Common mistakes

**Stopping at the first root.** Finding one value that makes the polynomial vanish is the beginning,
not the end. The degree tells you how many roots there are.

**Forgetting multiplicity.** A degree 5 polynomial may have only two different roots. They are still
five roots counted with multiplicity.

**Getting the sign wrong in the Girard relations.** The sum is -b/a, and the product for degree 3 is
-d/a. Checking against a known case, such as x^{2} - 5x + 6, avoids the slip.

**Testing candidates outside the list.** With whole coefficients, there is no point looking for a
rational root whose denominator does not divide the leading coefficient.

### Exercises

**Block A. Fundamentals**

1. Solve the equation x^{3} - 4x = 0.
2. Check that 2 is a root of x^{3} - 3x^{2} + 4x - 4 and say how many real roots the equation has
   altogether.
3. Write, in expanded form, the degree 3 polynomial with leading coefficient equal to 1 and roots 1,
   2 and 5.
4. Give the roots of (x - 3)^{2} · (x + 1)^{3}, with their multiplicities, and the degree of the
   polynomial.
5. Without solving the equation, give the sum and the product of the roots of x^{2} - 7x + 12 = 0.

**Block B. Building up**

6. Solve x^{3} - 6x^{2} + 11x - 6 = 0.
7. Solve x^{4} - 5x^{2} + 4 = 0.
8. What do the roots of x^{3} - 2x^{2} - 5x + 6 = 0 add up to? Use the relations between coefficients
   and roots to obtain the sum of the squares of the roots as well.
9. Find every rational root of 2x^{3} - 3x^{2} - 3x + 2 = 0.
10. Find the value of k that makes 2 a root of x^{3} - kx^{2} + 2x - 8, and say how many real roots
    the equation then has.
11. Given that 3 is a double root of x^{3} - 5x^{2} + 3x + 9, write the polynomial in factored form
    and give all its roots.
12. Write the degree 3 polynomial equation, with real coefficients and leading coefficient equal to
    1, that has 1 and 2 + i among its roots.
13. Solve x^{3} + x^{2} - 4x - 4 = 0 by grouping the terms.

**Block C. Going further**

14. Consider the equation 3x^{4} - 2x^{3} + x - 6 = 0. Without solving it, find the sum and the
    product of its roots.
15. The three roots of x^{3} - 9x^{2} + 23x - 15 = 0 form, in that order, an arithmetic progression.
    Use that fact and the relations between coefficients and roots to find them.
16. Show that 3x^{3} + 2x^{2} - 4x + 1 = 0 has no whole root, find its rational root and then find
    the other two roots.
17. In the equation 2x^{3} - 5x^{2} + 4x - 7 = 0, work out the sum of the reciprocals of the roots
    without working out the roots.
18. An open box has the shape of a rectangular block whose dimensions, in centimetres, are x,
    x + 2 and x + 4. Its volume is 192 cubic centimetres. Find x and justify why the answer is
    unique.

### Answer key

1. The roots are -2, 0 and 2.
2. Substituting, 8 - 12 + 8 - 4 = 0. Dividing by x - 2 leaves x^{2} - x + 2, whose discriminant is
   negative. The equation has a single real root, which is 2.
3. x^{3} - 8x^{2} + 17x - 10.
4. The root 3 has multiplicity 2 and the root -1 has multiplicity 3. The degree is 5.
5. Sum 7 and product 12.
6. The roots are 1, 2 and 3.
7. The roots are -2, -1, 1 and 2.
8. The sum of the roots is 2. The sum of the products two at a time is -5, and the sum of the squares
   is 2^{2} - 2·(-5) = 14. The roots are -2, 1 and 3.
9. The rational roots are -1, 1/2 and 2.
10. k = 1. The polynomial becomes x^{3} - x^{2} + 2x - 8, which factors as (x - 2)·(x^{2} + x + 4).
    Since the degree 2 factor has a negative discriminant, there is a single real root, which is 2.
11. The polynomial is (x - 3)^{2} · (x + 1). The roots are 3, with multiplicity 2, and -1.
12. x^{3} - 5x^{2} + 9x - 5 = 0. Since the coefficients are real, 2 - i is a root as well, and the
    matching factor is x^{2} - 4x + 5.
13. Grouping, x^{2}·(x + 1) - 4·(x + 1) = (x + 1)·(x^{2} - 4). The roots are -2, -1 and 2.
14. The sum of the roots is 2/3 and the product is -2.
15. The roots are 1, 3 and 5. Since the sum is 9 and the roots are in arithmetic progression, the
    middle one is 3. Writing the others as 3 - r and 3 + r, the product 3·(9 - r^{2}) = 15, which
    gives r = 2.
16. The whole candidates are 1 and -1, and neither makes the polynomial vanish. Among the fractional
    candidates, 1/3 is a root. The factored form is (3x - 1)·(x^{2} + x - 1), and the other two roots
    are (-1 + √5)/2 and (-1 - √5)/2.
17. The sum of the reciprocals is 4/7. It equals the sum of the products two at a time divided by the
    product of the roots, that is, 2 divided by 7/2.
18. x = 4, and the dimensions are 4, 6 and 8 centimetres. The equation becomes
    x^{3} + 6x^{2} + 8x - 192 = 0, and the factor left after dividing by x - 4 is x^{2} + 10x + 48,
    whose discriminant is negative.

## VERIFICACAO

```python
X1: solve(Eq(x**3 - 6*x**2 + 11*x - 6, 0), x) == [1, 2, 3]
X2: (1 + 2 + 3 == 6) and (1*2 + 1*3 + 2*3 == 11) and (1*2*3 == 6)
X3: real_roots(2*x**3 - 3*x**2 - 3*x + 2) == [-1, Rational(1,2), 2]
X4: expand((x - 1)*(x**2 - 4*x + 13)) == x**3 - 5*x**2 + 17*x - 13 and real_roots(x**2 - 4*x + 13) == []
E1: sorted(solve(Eq(x**3 - 4*x, 0), x)) == [-2, 0, 2]
E2: (2**3 - 3*2**2 + 4*2 - 4) == 0 and real_roots(x**3 - 3*x**2 + 4*x - 4) == [2]
E3: expand((x - 1)*(x - 2)*(x - 5)) == x**3 - 8*x**2 + 17*x - 10
E4: roots(Poly((x - 3)**2*(x + 1)**3, x)) == {3: 2, -1: 3} and degree(Poly((x - 3)**2*(x + 1)**3, x)) == 5
E5: sorted(solve(Eq(x**2 - 7*x + 12, 0), x)) == [3, 4] and 3 + 4 == 7 and 3*4 == 12
E6: sorted(solve(Eq(x**3 - 6*x**2 + 11*x - 6, 0), x)) == [1, 2, 3]
E7: sorted(solve(Eq(x**4 - 5*x**2 + 4, 0), x)) == [-2, -1, 1, 2]
E8: sorted(solve(Eq(x**3 - 2*x**2 - 5*x + 6, 0), x)) == [-2, 1, 3] and (-2)**2 + 1**2 + 3**2 == 14 and 2**2 - 2*(-5) == 14
E9: real_roots(2*x**3 - 3*x**2 - 3*x + 2) == [-1, Rational(1,2), 2]
E10: solve(Eq(2**3 - k*2**2 + 2*2 - 8, 0), k) == [1] and real_roots(x**3 - x**2 + 2*x - 8) == [2]
E11: expand((x - 3)**2*(x + 1)) == x**3 - 5*x**2 + 3*x + 9 and roots(Poly(x**3 - 5*x**2 + 3*x + 9, x)) == {3: 2, -1: 1}
E12: expand((x - 1)*(x**2 - 4*x + 5)) == x**3 - 5*x**2 + 9*x - 5 and expand((x - 2)**2 + 1) == x**2 - 4*x + 5
E13: sorted(solve(Eq(x**3 + x**2 - 4*x - 4, 0), x)) == [-2, -1, 2] and expand((x + 1)*(x**2 - 4)) == x**3 + x**2 - 4*x - 4
E14: Poly(3*x**4 - 2*x**3 + x - 6, x).all_coeffs() == [3, -2, 0, 1, -6] and Rational(-6, 3) == -2 and -Rational(-2, 3) == Rational(2, 3)
E15: sorted(solve(Eq(x**3 - 9*x**2 + 23*x - 15, 0), x)) == [1, 3, 5] and 1 + 3 + 5 == 9 and 1*3*5 == 15 and 3 - 1 == 5 - 3
E16: all(3*v**3 + 2*v**2 - 4*v + 1 != 0 for v in [1, -1]) and expand((3*x - 1)*(x**2 + x - 1)) == 3*x**3 + 2*x**2 - 4*x + 1 and set(solve(Eq(x**2 + x - 1, 0), x)) == set([(-1 + sqrt(5))/2, (-1 - sqrt(5))/2])
E17: Rational(4, 2)/Rational(7, 2) == Rational(4, 7)
E18: real_roots(x**3 + 6*x**2 + 8*x - 192) == [4] and 4*6*8 == 192
```
