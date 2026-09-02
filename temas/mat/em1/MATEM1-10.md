---
id: MATEM1-10
serie: em1
unidade: algebra
titulo_pt: Progressão aritmética
titulo_en: Arithmetic progression
resumo_pt: Reconhecer a razão constante, achar qualquer termo sem escrever todos e somar uma sequência inteira com a fórmula certa.
resumo_en: Spotting the constant difference, finding any term without listing them all, and adding a whole sequence with the right formula.
prerequisitos: [MATEM1-03]
duracao_min: 90
dificuldade: 3
---

## PT

### Explicação

#### O que é

Uma progressão aritmética é uma sequência em que a diferença entre um termo e o anterior é sempre a
mesma. Essa diferença fixa se chama **razão**, e costuma ser escrita como r.

3, 7, 11, 15, 19

Aqui a razão é 4, porque cada termo é o anterior mais 4. Para conferir se uma sequência é uma
progressão aritmética, subtraia cada termo do seguinte: se der sempre o mesmo, é.

A razão pode ser negativa, e aí a sequência decresce. Em 20, 17, 14, 11 a razão é -3.

#### O termo geral

Escrever todos os termos até chegar no que interessa é lento e não serve quando se pede o
centésimo. A fórmula do termo geral resolve:

a_{n} = a_{1} + (n - 1) · r

onde a_{n} é o termo da posição n, a_{1} o primeiro termo, n a posição e r a razão.

O raciocínio é simples: para sair do primeiro termo e chegar no termo n, você dá n - 1 passos, e
cada passo vale r.

**Exemplo 1.** Na sequência 3, 7, 11, 15, qual é o vigésimo termo?
O primeiro termo é a_{1} = 3 e a razão é r = 4. Então a_{20} = 3 + 19 × 4 = 3 + 76 = 79.

Repare que multiplicamos por 19, e não por 20. Do primeiro ao vigésimo há dezenove passos.

#### Descobrindo a posição de um termo

A mesma fórmula responde a pergunta inversa: em que posição aparece certo valor?

**Exemplo 2.** Em 3, 7, 11, 15, o número 43 pertence à sequência? Se sim, em que posição?
Usando a fórmula: 43 = 3 + (n - 1) · 4. Então 40 = (n - 1) · 4, o que dá n - 1 = 10, e n = 11.
Como n deu um número inteiro e positivo, o 43 é o décimo primeiro termo.

Se n tivesse dado quebrado, a resposta seria que o número não pertence à sequência. Esse é o teste.

#### A soma dos termos

Existe uma história famosa sobre um menino que somou os números de 1 a 100 em segundos, percebendo
que 1 + 100 = 101, que 2 + 99 também dá 101, e assim por diante. A ideia funciona em qualquer
progressão aritmética e dá a fórmula da soma:

S_{n} = (a_{1} + a_{n}) · n / 2

onde S_{n} é a soma dos n primeiros termos, a_{1} o primeiro termo e a_{n} o último deles.

Ou seja: some o primeiro com o último, multiplique pela quantidade de termos e divida por dois. O
que a fórmula faz é somar os pares que sempre dão o mesmo total.

**Exemplo 3.** Somar os 20 primeiros termos de 3, 7, 11, 15.
Já sabemos que a_{20} = 79. Então S_{20} = (3 + 79) · 20 / 2 = 82 × 10 = 820.

**Exemplo 4.** Somar todos os números de 1 a 100.
O primeiro é 1, o último é 100 e são 100 termos. Então S_{100} = (1 + 100) · 100 / 2 = 101 × 50, ou
seja, 5050.

#### Três termos em progressão

Quando um problema pede três números em progressão aritmética cuja soma é conhecida, existe um
truque que economiza muito: chame os três de x - r, x e x + r. Somando, os r se cancelam e sobra
3x, então o termo do meio é a soma dividida por 3.

**Exemplo 5.** Três números em progressão aritmética somam 24 e o produto dos extremos é 55. Quais
são?
Chamando de x - r, x e x + r, a soma dá 3x = 24, então x = 8.
Os extremos são 8 - r e 8 + r, cujo produto é 64 - r^{2}. Igualando a 55: r^{2} = 9, então r = 3 ou
r = -3.
Os números são 5, 8 e 11.

#### Erros comuns

**Multiplicar por n em vez de n - 1.** Do primeiro ao termo n há n - 1 passos, não n.

**Confundir a razão com o primeiro termo.** A razão é a diferença entre termos consecutivos.

**Usar a soma quando o problema pede o termo.** Leia se a pergunta é "quanto vale o termo" ou
"quanto dá a soma até ele".

**Aceitar posição quebrada.** Se n der 7,5, o número não pertence à sequência. Posição é sempre um
inteiro positivo.

### Exercícios

**Bloco A. Fundamentos**

1. Determine a razão de 3, 7, 11, 15 e escreva os dois termos seguintes.
2. Determine a razão de 20, 17, 14, 11 e escreva os dois termos seguintes.
3. Numa progressão aritmética com primeiro termo 5 e razão 6, calcule o décimo termo.
4. Verifique se 2, 5, 9, 12 é uma progressão aritmética.
5. Escreva os cinco primeiros termos da progressão de primeiro termo 100 e razão -7.

**Bloco B. Consolidação**

6. Na sequência 3, 7, 11, 15, calcule o vigésimo termo.
7. Na sequência 3, 7, 11, 15, o número 43 pertence à progressão? Em que posição?
8. Some os 20 primeiros termos de 3, 7, 11, 15.
9. Some todos os números de 1 a 100.
10. Numa progressão aritmética, o terceiro termo vale 14 e o sétimo vale 34. Determine o primeiro
    termo e a razão.
11. Quantos termos tem a progressão 7, 11, 15, e assim por diante, até o 79?
12. Some todos os múltiplos de 3 entre 1 e 100.
13. Uma pessoa começa a poupar 50 reais no primeiro mês e aumenta 20 reais a cada mês seguinte.
    Quanto ela guarda no décimo segundo mês, e quanto terá guardado no total ao fim de um ano?

**Bloco C. Aprofundamento**

14. Três números em progressão aritmética somam 24 e o produto dos extremos é 55. Determine os três.
15. Numa progressão aritmética, a soma dos 10 primeiros termos é 140 e o primeiro termo é 5.
    Determine a razão.
16. Determine x para que 2x - 1, 3x + 2 e 5x - 1 formem, nessa ordem, uma progressão aritmética.
17. Mostre que, em qualquer progressão aritmética, cada termo do meio é a média entre o anterior e o
    seguinte. Faça com letras.
18. Numa progressão aritmética de razão positiva, o primeiro termo é 4 e o último é 100, e a soma de
    todos é 1300. Quantos termos ela tem, e qual é a razão?

### Gabarito

1. Razão 4. Seguem 19 e 23.
2. Razão -3. Seguem 8 e 5.
3. 59.
4. Não é. As diferenças são 3, 4 e 3, e portanto não são constantes.
5. 100, 93, 86, 79, 72.
6. 79.
7. Pertence, e é o décimo primeiro termo.
8. 820.
9. 5050.
10. Razão 5 e primeiro termo 4.
11. 19 termos.
12. 1683. São os múltiplos de 3 de 3 até 99, que somam 33 termos.
13. No décimo segundo mês ela guarda 270 reais, e ao fim do ano terá guardado 1920 reais.
14. Os números são 5, 8 e 11.
15. Razão 2.
16. x = 6. A condição vem de igualar as duas diferenças, e com esse valor os termos ficam 11, 20 e
    29, com razão 9.
17. Chamando o termo do meio de a e a razão de r, o anterior é a - r e o seguinte é a + r. A média
    entre eles é ((a - r) + (a + r)) / 2 = 2a / 2 = a. Isso vale para qualquer posição e qualquer
    razão.
18. Tem 25 termos e a razão vale 4. Do primeiro ao último são 24 passos, e 96 / 24 = 4.

## EN

### Explanation

#### What it is

An arithmetic progression is a sequence where the difference between a term and the one before is
always the same. That fixed difference is called the **common difference**, usually written r.

3, 7, 11, 15, 19

Here the common difference is 4, because each term is the previous one plus 4. To check whether a
sequence is an arithmetic progression, subtract each term from the next: if you always get the same,
it is.

The common difference can be negative, and then the sequence decreases. In 20, 17, 14, 11 it
is -3.

#### The general term

Writing out every term until you reach the one you want is slow and useless when the hundredth is
asked for. The general term formula solves it:

a_{n} = a_{1} + (n - 1) · r

where a_{n} is the term in position n, a_{1} the first term, n the position and r the common
difference.

The reasoning is simple: to go from the first term to term n you take n - 1 steps, and each step is
worth r.

**Example 1.** In the sequence 3, 7, 11, 15, what is the twentieth term?
The first term is a_{1} = 3 and the common difference is r = 4.
So a_{20} = 3 + 19 × 4 = 3 + 76 = 79.

Notice we multiplied by 19, not by 20. From the first to the twentieth there are nineteen steps.

#### Finding the position of a term

The same formula answers the reverse question: at which position does a certain value appear?

**Example 2.** In 3, 7, 11, 15, does the number 43 belong to the sequence? If so, at which position?
Using the formula: 43 = 3 + (n - 1) · 4. So 40 = (n - 1) · 4, which gives n - 1 = 10, and n = 11.
Since n came out a positive whole number, 43 is the eleventh term.

If n had come out fractional, the answer would be that the number does not belong to the sequence.
That is the test.

#### The sum of the terms

There is a famous story about a boy who added the numbers from 1 to 100 in seconds, noticing that
1 + 100 = 101, that 2 + 99 also gives 101, and so on. The idea works in any arithmetic progression
and gives the sum formula:

S_{n} = (a_{1} + a_{n}) · n / 2

where S_{n} is the sum of the first n terms, a_{1} the first term and a_{n} the last of them.

That is: add the first to the last, multiply by how many terms there are and divide by two. What the
formula does is add up the pairs that always give the same total.

**Example 3.** Add the first 20 terms of 3, 7, 11, 15.
We already know that a_{20} = 79. So S_{20} = (3 + 79) · 20 / 2 = 82 × 10 = 820.

**Example 4.** Add every number from 1 to 100.
The first is 1, the last is 100 and there are 100 terms.
So S_{100} = (1 + 100) · 100 / 2 = 101 × 50, that is, 5050.

#### Three terms in progression

When a problem asks for three numbers in arithmetic progression with a known sum, there is a trick
that saves a lot of work: call the three of them x - r, x and x + r. Adding them up, the r cancels
out and 3x is left, so the middle term is the sum divided by 3.

**Example 5.** Three numbers in arithmetic progression add up to 24 and the product of the outer two
is 55. What are they?
Calling them x - r, x and x + r, the sum gives 3x = 24, so x = 8.
The outer ones are 8 - r and 8 + r, whose product is 64 - r^{2}. Setting that equal to 55:
r^{2} = 9, so r = 3 or r = -3.
The numbers are 5, 8 and 11.

#### Common mistakes

**Multiplying by n instead of n - 1.** From the first to term n there are n - 1 steps, not n.

**Mixing up the common difference with the first term.** The common difference is the gap between
consecutive terms.

**Using the sum when the problem asks for the term.** Read whether the question is "what is the
term" or "what does the sum up to it give".

**Accepting a fractional position.** If n comes out as 7.5, the number does not belong to the
sequence. A position is always a positive whole number.

### Exercises

**Block A. Fundamentals**

1. Find the common difference of 3, 7, 11, 15 and write the next two terms.
2. Find the common difference of 20, 17, 14, 11 and write the next two terms.
3. In an arithmetic progression with first term 5 and common difference 6, find the tenth term.
4. Check whether 2, 5, 9, 12 is an arithmetic progression.
5. Write the first five terms of the progression with first term 100 and common difference -7.

**Block B. Building up**

6. In the sequence 3, 7, 11, 15, find the twentieth term.
7. In the sequence 3, 7, 11, 15, does the number 43 belong to the progression? At which position?
8. Add the first 20 terms of 3, 7, 11, 15.
9. Add every number from 1 to 100.
10. In an arithmetic progression, the third term is 14 and the seventh is 34. Find the first term
    and the common difference.
11. How many terms does the progression 7, 11, 15, and so on, have up to 79?
12. Add every multiple of 3 between 1 and 100.
13. A person starts saving 50 reais in the first month and increases it by 20 reais each following
    month. How much do they save in the twelfth month, and how much will they have saved in total by
    the end of a year?

**Block C. Going further**

14. Three numbers in arithmetic progression add up to 24 and the product of the outer two is 55.
    Find the three.
15. In an arithmetic progression, the sum of the first 10 terms is 140 and the first term is 5. Find
    the common difference.
16. Find x so that 2x - 1, 3x + 2 and 5x - 1 form, in that order, an arithmetic progression.
17. Show that in any arithmetic progression each middle term is the average of the one before and
    the one after. Do it with letters.
18. In an arithmetic progression with positive common difference, the first term is 4 and the last
    is 100, and the sum of all of them is 1300. How many terms does it have, and what is the common
    difference?

### Answer key

1. Common difference 4. Next come 19 and 23.
2. Common difference -3. Next come 8 and 5.
3. 59.
4. It is not. The differences are 3, 4 and 3, so they are not constant.
5. 100, 93, 86, 79, 72.
6. 79.
7. It belongs, and it is the eleventh term.
8. 820.
9. 5050.
10. Common difference 5 and first term 4.
11. 19 terms.
12. 1683. These are the multiples of 3 from 3 to 99, which come to 33 terms.
13. In the twelfth month they save 270 reais, and by the end of the year they will have saved 1920
    reais.
14. The numbers are 5, 8 and 11.
15. Common difference 2.
16. x = 6. The condition comes from setting the two differences equal, and with that value the
    terms become 11, 20 and 29, with common difference 9.
17. Calling the middle term a and the common difference r, the one before is a - r and the one
    after is a + r. Their average is ((a - r) + (a + r)) / 2 = 2a / 2 = a. This holds for any
    position and any common difference.
18. It has 25 terms and the common difference is 4. From the first to the last there are 24 steps,
    and 96 / 24 = 4.

## VERIFICACAO

```python
X1: 3 + 19*4 == 79
X2: solve(Eq(3 + (n-1)*4, 43), n) == [11]
X3: Rational((3 + 79)*20, 2) == 820
X4: Rational((1 + 100)*100, 2) == 5050
X5: solve(Eq(3*x, 24), x) == [8] and solve(Eq((8-r)*(8+r), 55), r) == [-3, 3] and 5 + 8 + 11 == 24
E1: 7 - 3 == 4 and 15 + 4 == 19 and 19 + 4 == 23
E2: 17 - 20 == -3 and 11 - 3 == 8 and 8 - 3 == 5
E3: 5 + 9*6 == 59
E4: 5 - 2 == 3 and 9 - 5 == 4 and 3 != 4
E5: [100 - 7*k for k in range(5)] == [100, 93, 86, 79, 72]
E6: 3 + 19*4 == 79
E7: solve(Eq(3 + (n-1)*4, 43), n) == [11]
E8: Rational((3 + 79)*20, 2) == 820
E9: Rational((1 + 100)*100, 2) == 5050
E10: solve([Eq(a + 2*r, 14), Eq(a + 6*r, 34)], [a, r]) == {a: 4, r: 5}
E11: solve(Eq(7 + (n-1)*4, 79), n) == [19]
E12: sum(range(3, 100, 3)) == 1683 and len(list(range(3, 100, 3))) == 33
E13: 50 + 11*20 == 270 and Rational((50 + 270)*12, 2) == 1920
E14: 5 + 8 + 11 == 24 and 5*11 == 55
E15: solve(Eq((2*5 + 9*r)*10/2, 140), r) == [2]
E16: solve(Eq((3*x + 2) - (2*x - 1), (5*x - 1) - (3*x + 2)), x) == [6] and 2*6-1 == 11 and 3*6+2 == 20 and 5*6-1 == 29
E17: simplify(((a - r) + (a + r))/2 - a) == 0
E18: solve(Eq((4 + 100)*n/2, 1300), n) == [25] and solve(Eq(4 + 24*r, 100), r) == [4]
```
