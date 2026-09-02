---
id: MATEM1-11
serie: em1
unidade: algebra
titulo_pt: Progressão geométrica
titulo_en: Geometric progression
resumo_pt: Reconhecer a razão que multiplica, achar qualquer termo e somar a sequência, inclusive quando ela tem infinitos termos.
resumo_en: Spotting the ratio that multiplies, finding any term and adding the sequence, including when it has infinitely many terms.
prerequisitos: [MATEM1-10]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### O que muda em relação à aritmética

Na progressão aritmética você **soma** sempre o mesmo valor. Na progressão geométrica você
**multiplica** sempre pelo mesmo valor. Esse multiplicador fixo é a **razão**, escrita como q.

2, 6, 18, 54, 162

Aqui a razão é 3, porque cada termo é o anterior vezes 3. Para descobrir a razão, divida um termo
pelo anterior: 6 ÷ 2 = 3, e 18 ÷ 6 = 3 também.

Essa diferença de mecanismo muda tudo. A aritmética cresce em linha reta, e a geométrica cresce cada
vez mais depressa, o que explica juros compostos, população e meia-vida.

#### O termo geral

a_{n} = a_{1} · q^{n-1}

onde a_{n} é o termo de ordem n, a_{1} é o primeiro termo e q é a razão.

De novo o expoente é n - 1, e pela mesma razão de antes: do primeiro ao termo n há n - 1
multiplicações.

**Exemplo 1.** Na sequência 2, 6, 18, 54, qual é o sétimo termo?
O primeiro termo é 2 e a razão é 3. Então a_{7} = 2 · 3^{6} = 2 · 729 = 1458.

#### Quando a razão é menor que 1

Se a razão está entre 0 e 1, a sequência diminui, mas nunca chega a zero.

**Exemplo 2.** Na sequência 80, 40, 20, 10, qual é a razão e qual é o sexto termo?
A razão é 40 ÷ 80 = 1/2. O sexto termo é 80 · (1/2)^{5} = 80 ÷ 32 = 5/2.

Razão negativa também existe, e aí os sinais alternam. Em 3, -6, 12, -24 a razão é -2.

#### A soma dos termos

S_{n} = a_{1} · (q^{n} - 1) / (q - 1)

onde S_{n} é a soma dos n primeiros termos.

Essa fórmula vale quando q ≠ 1. Se q vale 1, todos os termos são iguais e a soma é
simplesmente a_{1} · n.

**Exemplo 3.** Somar os 6 primeiros termos de 2, 6, 18, 54.
Aqui a_{1} = 2, q = 3 e n = 6. Então S_{6} = 2 · (729 - 1) / 2 = 728.

#### A soma infinita

Este é o resultado que mais surpreende. Se a razão está entre -1 e 1, sem contar o zero, dá
para somar **infinitos** termos e obter um número finito:

S = a_{1} / (1 - q)

onde S é a soma de todos os termos.

Faz sentido porque cada termo é bem menor que o anterior, e o que se acrescenta vai ficando
desprezível.

**Exemplo 4.** Somar 1 + 1/2 + 1/4 + 1/8, e assim por diante, para sempre.
Aqui a_{1} = 1 e q = 1/2. A soma é S = 1 / (1 - 1/2) = 1 ÷ (1/2) = 2.

Por mais termos que se some, o total nunca passa de 2. Ele se aproxima de 2 e nunca ultrapassa.

**Exemplo 5.** Escrever a dízima 0,333 e assim por diante como fração.
Ela é a soma 3/10 + 3/100 + 3/1000, e assim por diante, que é uma progressão geométrica de
primeiro termo a_{1} = 3/10 e razão q = 1/10.
A soma é S = (3/10) / (1 - 1/10) = (3/10) ÷ (9/10) = 1/3.

#### Três termos em progressão geométrica

O truque aqui é chamar os três de x/q, x e x · q. O produto dos três dá x^{3}, então o termo do
meio é a raiz cúbica do produto.

#### Erros comuns

**Somar quando deveria multiplicar.** A razão da geométrica multiplica. Se você subtrair termos
consecutivos e achar valores diferentes, isso não descarta a progressão geométrica: é preciso
dividir.

**Usar a soma infinita com razão maior que 1.** Só funciona quando |q| < 1. Com razão 2 a soma
cresce sem limite.

**Errar o expoente.** É n - 1, não n.

**Confundir crescimento aritmético com geométrico num problema.** Se o enunciado diz "aumenta 10 por
cento ao ano", a razão é 1,1 e a progressão é geométrica. Se diz "aumenta 10 unidades por ano", é
aritmética.

### Exercícios

**Bloco A. Fundamentos**

1. Determine a razão de 2, 6, 18, 54 e escreva os dois termos seguintes.
2. Determine a razão de 80, 40, 20, 10 e escreva os dois termos seguintes.
3. Numa progressão geométrica de primeiro termo 5 e razão 2, calcule o sexto termo.
4. Verifique se 3, 6, 12, 20 é uma progressão geométrica.
5. Determine a razão de 3, -6, 12, -24.

**Bloco B. Consolidação**

6. Na sequência 2, 6, 18, 54, calcule o sétimo termo.
7. Na sequência 80, 40, 20, 10, calcule o sexto termo.
8. Some os 6 primeiros termos de 2, 6, 18, 54.
9. Numa progressão geométrica, o segundo termo vale 12 e o quarto vale 108, com razão positiva.
   Determine o primeiro termo e a razão.
10. Some 1 + 1/2 + 1/4 + 1/8, e assim por diante, para sempre.
11. Escreva a dízima 0,333 e assim por diante como fração, usando soma infinita.
12. Uma população de bactérias dobra a cada hora e começa com 500 indivíduos. Quantas serão depois
    de 8 horas?
13. Um carro que hoje vale 60000 reais perde 20 por cento do valor a cada ano. Quanto valerá depois
    de 3 anos?

**Bloco C. Aprofundamento**

14. Três números em progressão geométrica têm produto 216 e a soma dos extremos é 20. Determine os
    três.
15. Determine x para que 3, x e 27 formem, nessa ordem, uma progressão geométrica de razão positiva.
16. Uma bola é solta de 2 metros de altura e, a cada batida no chão, sobe metade da altura anterior.
    Que distância total ela percorre até parar?
17. Mostre que, em qualquer progressão geométrica de termos positivos, cada termo do meio é a raiz
    quadrada do produto entre o anterior e o seguinte. Faça com letras.
18. Compare duas aplicações de 1000 reais: a primeira rende 100 reais fixos por ano e a segunda rende
    8 por cento ao ano sobre o valor acumulado. Depois de 10 anos, qual rendeu mais? Explique o que
    esse resultado mostra sobre a diferença entre crescimento aritmético e geométrico.

### Gabarito

1. Razão 3. Seguem 162 e 486.
2. Razão 1/2. Seguem 5 e 5/2.
3. 160.
4. Não é. As razões seriam 2, 2 e 5/3, que não são iguais.
5. Razão -2.
6. 1458.
7. 5/2.
8. 728.
9. Razão 3 e primeiro termo 4.
10. A soma é 2.
11. 1/3.
12. 128000 bactérias.
13. 30720 reais.
14. Os números são 2, 6 e 18.
15. x = 9.
16. 6 metros. Ela cai 2 metros e depois sobe e desce alturas que somam duas vezes a soma infinita de
    1 + 1/2 + 1/4, e assim por diante, começando de 1 metro.
17. Chamando o termo do meio de a e a razão de q, o anterior é a/q e o seguinte é a · q. O produto
    entre eles é a^{2}, porque os q se cancelam. A raiz quadrada disso é a, já que os termos são
    positivos.
18. A segunda rendeu mais. A primeira chega a 2000 reais e a segunda a aproximadamente 2158,92
    reais. O crescimento aritmético soma sempre a mesma parcela, enquanto o geométrico rende sobre um
    valor que já cresceu, e por isso acaba passando à frente.

## EN

### Explanation

#### What changes compared to arithmetic

In an arithmetic progression you always **add** the same value. In a geometric progression you always
**multiply** by the same value. That fixed multiplier is the **ratio**, written q.

2, 6, 18, 54, 162

Here the ratio is 3, because each term is the previous one times 3. To find the ratio, divide a term
by the one before: 6 ÷ 2 = 3, and 18 ÷ 6 = 3 as well.

That difference in mechanism changes everything. Arithmetic grows in a straight line, and geometric
grows faster and faster, which explains compound interest, populations and half-lives.

#### The general term

a_{n} = a_{1} · q^{n-1}

where a_{n} is the term of order n, a_{1} is the first term and q is the ratio.

Again the exponent is n - 1, for the same reason as before: from the first to term n there are
n - 1 multiplications.

**Example 1.** In the sequence 2, 6, 18, 54, what is the seventh term?
The first term is 2 and the ratio is 3. So a_{7} = 2 · 3^{6} = 2 · 729 = 1458.

#### When the ratio is less than 1

If the ratio is between 0 and 1, the sequence shrinks, but never reaches zero.

**Example 2.** In the sequence 80, 40, 20, 10, what is the ratio and what is the sixth term?
The ratio is 40 ÷ 80 = 1/2. The sixth term is 80 · (1/2)^{5} = 80 ÷ 32 = 5/2.

A negative ratio also exists, and then the signs alternate. In 3, -6, 12, -24 the ratio is -2.

#### The sum of the terms

S_{n} = a_{1} · (q^{n} - 1) / (q - 1)

where S_{n} is the sum of the first n terms.

This formula holds when q ≠ 1. If q is 1, all terms are equal and the sum is simply
a_{1} · n.

**Example 3.** Add the first 6 terms of 2, 6, 18, 54.
Here a_{1} = 2, q = 3 and n = 6. So S_{6} = 2 · (729 - 1) / 2 = 728.

#### The infinite sum

This is the result that surprises students most. If the ratio is between -1 and 1, not counting
zero, you can add **infinitely** many terms and get a finite number:

S = a_{1} / (1 - q)

where S is the sum of all the terms.

It makes sense because each term is much smaller than the one before, and what gets added becomes
negligible.

**Example 4.** Add 1 + 1/2 + 1/4 + 1/8, and so on, forever.
Here a_{1} = 1 and q = 1/2. The sum is S = 1 / (1 - 1/2) = 1 ÷ (1/2) = 2.

However many terms you add, the total never passes 2. It gets closer to 2 and never goes beyond.

**Example 5.** Write the repeating decimal 0.333 and so on as a fraction.
It is the sum 3/10 + 3/100 + 3/1000, and so on, which is a geometric progression with first term
a_{1} = 3/10 and ratio q = 1/10.
The sum is S = (3/10) / (1 - 1/10) = (3/10) ÷ (9/10) = 1/3.

#### Three terms in geometric progression

The trick here is to call the three of them x/q, x and x · q. The product of the three gives
x^{3}, so the middle term is the cube root of the product.

#### Common mistakes

**Adding when you should multiply.** The ratio of a geometric progression multiplies. If you
subtract consecutive terms and get different values, that does not rule out a geometric progression:
you have to divide.

**Using the infinite sum with a ratio greater than 1.** It only works when |q| < 1. With ratio 2 the
sum grows without limit.

**Getting the exponent wrong.** It is n - 1, not n.

**Mixing up arithmetic and geometric growth in a problem.** If the problem says "goes up by 10 per
cent a year", the ratio is 1.1 and the progression is geometric. If it says "goes up by 10 units a
year", it is arithmetic.

### Exercises

**Block A. Fundamentals**

1. Find the ratio of 2, 6, 18, 54 and write the next two terms.
2. Find the ratio of 80, 40, 20, 10 and write the next two terms.
3. In a geometric progression with first term 5 and ratio 2, find the sixth term.
4. Check whether 3, 6, 12, 20 is a geometric progression.
5. Find the ratio of 3, -6, 12, -24.

**Block B. Building up**

6. In the sequence 2, 6, 18, 54, find the seventh term.
7. In the sequence 80, 40, 20, 10, find the sixth term.
8. Add the first 6 terms of 2, 6, 18, 54.
9. In a geometric progression, the second term is 12 and the fourth is 108, with positive ratio.
   Find the first term and the ratio.
10. Add 1 + 1/2 + 1/4 + 1/8, and so on, forever.
11. Write the repeating decimal 0.333 and so on as a fraction, using an infinite sum.
12. A population of bacteria doubles every hour and starts with 500 individuals. How many will there
    be after 8 hours?
13. A car worth 60000 reais today loses 20 per cent of its value each year. What will it be worth
    after 3 years?

**Block C. Going further**

14. Three numbers in geometric progression have product 216 and the sum of the outer two is 20. Find
    the three.
15. Find x so that 3, x and 27 form, in that order, a geometric progression with positive ratio.
16. A ball is dropped from a height of 2 metres and, on each bounce, rises half the previous height.
    What total distance does it travel before stopping?
17. Show that in any geometric progression with positive terms each middle term is the square root of
    the product of the one before and the one after. Do it with letters.
18. Compare two investments of 1000 reais: the first earns a fixed 100 reais a year and the second
    earns 8 per cent a year on the accumulated amount. After 10 years, which earned more? Explain
    what that result shows about the difference between arithmetic and geometric growth.

### Answer key

1. Ratio 3. Next come 162 and 486.
2. Ratio 1/2. Next come 5 and 5/2.
3. 160.
4. It is not. The ratios would be 2, 2 and 5/3, which are not equal.
5. Ratio -2.
6. 1458.
7. 5/2.
8. 728.
9. Ratio 3 and first term 4.
10. The sum is 2.
11. 1/3.
12. 128000 bacteria.
13. 30720 reais.
14. The numbers are 2, 6 and 18.
15. x = 9.
16. 6 metres. It falls 2 metres and then rises and falls through heights that add up to twice the
    infinite sum of 1 + 1/2 + 1/4, and so on, starting from 1 metre.
17. Calling the middle term a and the ratio q, the one before is a/q and the one after is a · q.
    Their product is a^{2}, because the q cancels out. Its square root is a, since the terms are
    positive.
18. The second earned more. The first reaches 2000 reais and the second reaches about 2158.92 reais.
    Arithmetic growth always adds the same amount, while geometric growth earns on a value that has
    already grown, and so it ends up ahead.

## VERIFICACAO

```python
X1: 2 * 3**6 == 1458
X2: Rational(40,80) == Rational(1,2) and 80 * Rational(1,2)**5 == Rational(5,2)
X3: 2 * (3**6 - 1) / (3 - 1) == 728
X4: 1 / (1 - Rational(1,2)) == 2
X5: Rational(3,10) / (1 - Rational(1,10)) == Rational(1,3)
E1: Rational(6,2) == 3 and 54*3 == 162 and 162*3 == 486
E2: Rational(40,80) == Rational(1,2) and 10*Rational(1,2) == 5 and 5*Rational(1,2) == Rational(5,2)
E3: 5 * 2**5 == 160
E4: Rational(6,3) == 2 and Rational(12,6) == 2 and Rational(20,12) != 2
E5: Rational(-6,3) == -2 and Rational(12,-6) == -2
E6: 2 * 3**6 == 1458
E7: 80 * Rational(1,2)**5 == Rational(5,2)
E8: 2 * (3**6 - 1) / (3 - 1) == 728
E9: solve([Eq(a*q, 12), Eq(a*q**3, 108)], [a, q])[1] == (4, 3)
E10: 1 / (1 - Rational(1,2)) == 2
E11: Rational(3,10) / (1 - Rational(1,10)) == Rational(1,3)
E12: 500 * 2**8 == 128000
E13: 60000 * Rational(8,10)**3 == 30720
E14: 2*6*18 == 216 and 2 + 18 == 20 and Rational(6,2) == 3 and Rational(18,6) == 3
E15: solve(Eq(x**2, 3*27), x) == [-9, 9] and Rational(9,3) == 3 and Rational(27,9) == 3
E16: 2 + 2*(1 / (1 - Rational(1,2))) == 6
E17: simplify((a/q)*(a*q) - a**2) == 0 and sqrt(Symbol('t', positive=True)**2) == Symbol('t', positive=True)
E18: 1000 + 10*100 == 2000 and 1000 * Rational(108,100)**10 > 2000
```
