---
id: MATEM1-12
serie: em1
unidade: algebra
titulo_pt: Sequências e recorrência
titulo_en: Sequences and recurrence
resumo_pt: Distinguir termo geral de lei de recorrência, passar de uma forma para a outra e reconhecer quando a recorrência esconde uma progressão conhecida.
resumo_en: Telling a general term from a recurrence law, moving from one form to the other and spotting when a recurrence hides a familiar progression.
prerequisitos: [MATEM1-10, MATEM1-11]
duracao_min: 90
dificuldade: 5
---

## PT

### Explicação

#### Sequência é função

Uma sequência é uma lista de números em ordem, e a ordem importa. Cada termo tem uma **posição**, e
é essa posição que dá o nome ao termo: a de 1, a de 2, a de 3, e assim por diante.

Dito de outro jeito, uma sequência é uma função cujo domínio são os números naturais a partir de 1.
A entrada é a posição, a saída é o termo. Escrever a de n em vez de f(n) é apenas costume.

#### Duas maneiras de descrever a mesma sequência

Toda sequência pode ser dada de duas formas, e saber trocar de uma para a outra é o que este tema
pede.

**Termo geral.** Uma fórmula fechada que calcula o termo direto da posição, sem precisar dos
anteriores.

**Lei de recorrência.** Uma regra que diz como sair de um termo para o seguinte, junto com o valor
inicial. Sem o valor inicial a regra não define nada, porque toda sequência que obedecesse à regra
serviria.

**Exemplo 1.** Escrever os quatro primeiros termos da sequência de termo geral a de n igual a 3n
menos 1.
Basta substituir a posição: para n igual a 1 dá 2, para n igual a 2 dá 5, para n igual a 3 dá 8 e
para n igual a 4 dá 11. A sequência começa 2, 5, 8, 11.

O termo geral é cômodo: para saber o termo de posição 100, calcula-se direto, sem passar pelos 99
anteriores.

**Exemplo 2.** Uma sequência tem primeiro termo 2 e cada termo seguinte é o anterior somado a 5.
Escrever os quatro primeiros termos e achar o termo geral.
Da recorrência saem 2, 7, 12, 17. Como a cada passo se soma sempre 5, isto é uma progressão
aritmética de primeiro termo 2 e razão 5. O termo geral é a de n igual a 2 mais (n menos 1) vezes 5,
que simplificado dá a de n igual a 5n menos 3.

Repare no mecanismo: **a recorrência escondia uma progressão aritmética**. Isso acontece sempre que
a regra é "somar uma constante". Quando a regra é "multiplicar por uma constante", o que se esconde
é uma progressão geométrica.

#### Duas sequências que todo mundo precisa conhecer

**Números triangulares.** São as quantidades de bolinhas que formam triângulos cheios: 1, 3, 6, 10,
15. A recorrência é transparente: para passar de um triângulo ao seguinte acrescenta-se uma fileira
nova, com uma bolinha a mais que a última. O termo geral é n vezes (n mais 1) dividido por 2.

**Exemplo 3.** Calcular o décimo número triangular.
Substituindo na fórmula: 10 vezes 11 dividido por 2, que dá 55.

**Sequência de Fibonacci.** Começa com 1 e 1, e cada termo seguinte é a soma dos dois anteriores.

1, 1, 2, 3, 5, 8, 13, 21, 34, 55

Esta é uma recorrência que olha **dois** termos para trás, e por isso precisa de dois valores
iniciais. Ela é o exemplo clássico de sequência fácil de descrever por recorrência e difícil de
descrever por termo geral.

**Exemplo 4.** Achar o décimo termo de Fibonacci.
Somando de dois em dois a partir do começo, chega-se a 55.

#### Recorrência linear que não é progressão

Nem toda recorrência simples é progressão. O caso mais cobrado em prova mistura multiplicação e
soma:

a de n mais 1 igual a 2 vezes a de n mais 3

Aqui não há razão constante nem diferença constante. O caminho é uma **substituição** que transforma
o problema numa progressão geométrica.

**Exemplo 5.** Achar o termo geral da sequência com primeiro termo 1 e a de n mais 1 igual a 2 vezes
a de n mais 3.
Chamemos b de n igual a a de n mais 3. Então

b de n mais 1 igual a a de n mais 1 mais 3, que é 2 vezes a de n mais 6, que é 2 vezes b de n

Ou seja, b é uma progressão geométrica de razão 2. Como a de 1 vale 1, b de 1 vale 4. Logo b de n é
4 vezes 2 elevado a (n menos 1), que é 2 elevado a (n mais 1). Voltando:

a de n igual a 2 elevado a (n mais 1) menos 3

Conferindo: para n igual a 1 dá 1, para n igual a 2 dá 5 e para n igual a 3 dá 13. Bate com a
recorrência.

A escolha do 3 na substituição não é mágica. Procura-se o valor fixo que a sequência teria se
parasse de mudar, e ele sai de resolver p igual a 2p mais 3, que dá p igual a menos 3.

#### Soma telescópica

Quando cada parcela pode ser escrita como uma diferença entre dois pedaços vizinhos, a soma
desmonta: quase tudo se cancela e sobram as pontas.

**Exemplo 6.** Somar 1 dividido por k vezes (k mais 1), para k indo de 1 até 10.
Cada parcela vale 1 sobre k menos 1 sobre (k mais 1). Somando de 1 até 10, o menos um meio da
primeira parcela cancela o mais um meio da segunda, o mesmo acontece com um terço, e assim segue.
Sobram apenas 1 e o último pedaço negativo, que é 1 sobre 11. A soma vale 1 menos 1 sobre 11, ou
seja, 10 sobre 11.

A mesma ideia prova termos gerais: se a de n mais 1 menos a de n é conhecido para todo n, somar essas
diferenças da primeira posição até a posição anterior a n devolve a de n menos a de 1.

#### Erros comuns

**Dar a recorrência sem o valor inicial.** A regra sozinha não determina a sequência.

**Confundir a posição com o termo.** Em a de 5 igual a 12, o 5 é a posição e o 12 é o valor.

**Achar que toda recorrência é progressão.** A regra "dobrar e somar 3" não tem razão constante nem
diferença constante.

**Errar quantas diferenças se soma.** Do primeiro termo até o termo de posição n existem n menos 1
passos, não n.

### Exercícios

**Bloco A. Fundamentos**

1. Escreva os quatro primeiros termos da sequência cujo termo geral é a de n igual a 3n menos 1.
2. Uma sequência tem primeiro termo 2 e cada termo seguinte é o anterior somado a 5. Escreva os
   quatro primeiros termos.
3. Uma sequência tem primeiro termo 3 e cada termo seguinte é o anterior multiplicado por 2. Escreva
   os cinco primeiros termos.
4. Na sequência de termo geral a de n igual a n ao quadrado mais 1, calcule o quinto termo.
5. A sequência de Fibonacci começa com 1 e 1, e cada termo seguinte é a soma dos dois anteriores.
   Escreva os seis primeiros termos.

**Bloco B. Consolidação**

6. Numa sequência, o primeiro termo é 2 e cada termo seguinte é o anterior somado a 5. Determine o
   termo geral.
7. Numa sequência, o primeiro termo é 3 e cada termo seguinte é o anterior multiplicado por 2.
   Determine o termo geral e o sétimo termo.
8. O número triangular de posição n é dado por n vezes (n mais 1) dividido por 2. Calcule o décimo
   número triangular.
9. Na sequência de Fibonacci que começa com 1 e 1, determine o décimo termo.
10. Determine o termo geral da sequência 5, 8, 11, 14 e diga se ela é uma progressão aritmética.
11. Uma sequência tem primeiro termo 1 e cada termo seguinte é o anterior somado a 2n, onde n é a
    posição do termo anterior. Escreva os cinco primeiros termos e determine o termo geral.
12. Na sequência de termo geral a de n igual a 2 elevado a n menos 1, mostre que cada termo seguinte
    é o dobro do anterior somado a 1.
13. Uma caixa d'água tem 800 litros e a cada dia perde metade do que tinha. Escreva a lei de
    recorrência e determine quanto resta depois de 5 dias.

**Bloco C. Aprofundamento**

14. Uma sequência tem primeiro termo 1 e cada termo seguinte é o dobro do anterior somado a 3. Usando
    a substituição b de n igual a a de n mais 3, determine o termo geral e o quinto termo.
15. Sabendo que 1 dividido por k vezes (k mais 1) é igual a 1 sobre k menos 1 sobre (k mais 1),
    calcule a soma dessas frações para k variando de 1 até 10.
16. Uma sequência tem primeiro termo 2 e cada termo seguinte é o triplo do anterior. Mostre que ela
    é uma progressão geométrica, determine o termo geral e some os cinco primeiros termos.
17. Uma sequência tem primeiro termo 1 e cada termo seguinte é o anterior somado a 2n mais 1, onde n
    é a posição do termo anterior. Mostre que o termo de posição n vale n ao quadrado.
18. Numa festa, cada convidado cumprimenta todos os outros exatamente uma vez. Chamando de a de n o
    número de cumprimentos entre n convidados, escreva a lei que liga o caso de n mais 1 convidados
    ao caso de n convidados, obtenha o termo geral e determine quantos convidados produzem 190
    cumprimentos.

### Gabarito

1. 2, 5, 8 e 11.
2. 2, 7, 12 e 17.
3. 3, 6, 12, 24 e 48.
4. 26.
5. 1, 1, 2, 3, 5 e 8.
6. a de n igual a 5n menos 3.
7. a de n igual a 3 vezes 2 elevado a (n menos 1). O sétimo termo vale 192.
8. 55.
9. 55.
10. a de n igual a 3n mais 2. É uma progressão aritmética de razão 3.
11. 1, 3, 7, 13 e 21. O termo geral é a de n igual a n ao quadrado menos n mais 1.
12. O dobro do termo de posição n somado a 1 dá 2 vezes (2 elevado a n menos 1) mais 1, que é 2
    elevado a (n mais 1) menos 1, exatamente o termo seguinte.
13. A lei é a de n mais 1 igual a metade de a de n. Restam 25 litros.
14. Com b de n igual a a de n mais 3, vem b de n mais 1 igual a 2 vezes b de n, com b de 1 igual a
    4. Logo b de n vale 2 elevado a (n mais 1) e a de n vale 2 elevado a (n mais 1) menos 3. O
    quinto termo é 61.
15. A soma vale 10 sobre 11. Os termos do meio se cancelam e sobra 1 menos 1 sobre 11.
16. É geométrica de razão 3, porque a divisão de cada termo pelo anterior dá sempre 3. O termo geral
    é a de n igual a 2 vezes 3 elevado a (n menos 1), e a soma dos cinco primeiros termos vale 242.
17. Somando as diferenças da posição 1 até a posição n menos 1, cada parcela é 2 vezes a posição
    mais 1, e a soma dessas parcelas com o primeiro termo 1 dá n ao quadrado. Verificando: as
    posições 1, 2, 3 e 4 dão 1, 4, 9 e 16.
18. A lei é a de n mais 1 igual a a de n mais n, e o termo geral é n vezes (n menos 1) dividido por
    2. Com 190 cumprimentos, a equação dá 20 convidados.

## EN

### Explanation

#### A sequence is a function

A sequence is a list of numbers in order, and the order matters. Each term has a **position**, and
that position is what names the term: a of 1, a of 2, a of 3, and so on.

Put another way, a sequence is a function whose domain is the natural numbers from 1 onwards. The
input is the position, the output is the term. Writing a of n instead of f(n) is only custom.

#### Two ways of describing the same sequence

Every sequence can be given in two forms, and knowing how to swap one for the other is what this
topic asks of you.

**General term.** A closed formula that works out the term straight from the position, with no need
for the previous ones.

**Recurrence law.** A rule saying how to get from one term to the next, together with the starting
value. Without the starting value the rule defines nothing, because every sequence obeying the rule
would do.

**Example 1.** Write the first four terms of the sequence with general term a of n equals 3n minus
1.
Just substitute the position: for n equal to 1 it gives 2, for n equal to 2 it gives 5, for n equal
to 3 it gives 8 and for n equal to 4 it gives 11. The sequence starts 2, 5, 8, 11.

The general term is convenient: to know the term at position 100, you work it out straight away,
without going through the 99 before it.

**Example 2.** A sequence has first term 2 and each next term is the previous one plus 5. Write the
first four terms and find the general term.
The recurrence gives 2, 7, 12, 17. Since each step always adds 5, this is an arithmetic progression
with first term 2 and common difference 5. The general term is a of n equals 2 plus (n minus 1)
times 5, which simplifies to a of n equals 5n minus 3.

Notice the mechanism: **the recurrence was hiding an arithmetic progression**. That happens whenever
the rule is "add a constant". When the rule is "multiply by a constant", what hides inside is a
geometric progression.

#### Two sequences everyone needs to know

**Triangular numbers.** They are the counts of dots that make up full triangles: 1, 3, 6, 10, 15.
The recurrence is transparent: to go from one triangle to the next you add a new row, with one more
dot than the last one. The general term is n times (n plus 1) divided by 2.

**Example 3.** Work out the tenth triangular number.
Substituting into the formula: 10 times 11 divided by 2, which gives 55.

**The Fibonacci sequence.** It starts with 1 and 1, and each next term is the sum of the two
previous ones.

1, 1, 2, 3, 5, 8, 13, 21, 34, 55

This is a recurrence that looks **two** terms back, and so it needs two starting values. It is the
classic example of a sequence that is easy to describe by recurrence and hard to describe by a
general term.

**Example 4.** Find the tenth Fibonacci term.
Adding two at a time from the start, you reach 55.

#### A linear recurrence that is not a progression

Not every simple recurrence is a progression. The case that shows up most in tests mixes
multiplication and addition:

a of n plus 1 equals 2 times a of n plus 3

Here there is no constant ratio and no constant difference. The route is a **substitution** that
turns the problem into a geometric progression.

**Example 5.** Find the general term of the sequence with first term 1 and a of n plus 1 equals 2
times a of n plus 3.
Let us call b of n equals a of n plus 3. Then

b of n plus 1 equals a of n plus 1 plus 3, which is 2 times a of n plus 6, which is 2 times b of n

That is, b is a geometric progression with ratio 2. Since a of 1 is 1, b of 1 is 4. So b of n is 4
times 2 to the power of (n minus 1), which is 2 to the power of (n plus 1). Going back:

a of n equals 2 to the power of (n plus 1) minus 3

Checking: for n equal to 1 it gives 1, for n equal to 2 it gives 5 and for n equal to 3 it gives 13.
It matches the recurrence.

The choice of 3 in the substitution is not magic. You look for the fixed value the sequence would
have if it stopped changing, and it comes out of solving p equals 2p plus 3, which gives p equals
minus 3.

#### Telescoping sums

When each part can be written as a difference between two neighbouring pieces, the sum falls apart:
almost everything cancels and only the ends survive.

**Example 6.** Add 1 divided by k times (k plus 1), for k running from 1 to 10.
Each part is 1 over k minus 1 over (k plus 1). Adding from 1 to 10, the minus one half of the first
part cancels the plus one half of the second, the same happens with one third, and so it goes. Only
1 and the last negative piece survive, and that piece is 1 over 11. The sum is 1 minus 1 over 11,
that is, 10 over 11.

The same idea proves general terms: if a of n plus 1 minus a of n is known for every n, adding those
differences from the first position up to the position before n gives back a of n minus a of 1.

#### Common mistakes

**Giving the recurrence without the starting value.** The rule on its own does not pin down the
sequence.

**Mixing up the position with the term.** In a of 5 equals 12, the 5 is the position and the 12 is
the value.

**Thinking every recurrence is a progression.** The rule "double it and add 3" has no constant ratio
and no constant difference.

**Getting the number of differences wrong.** From the first term to the term at position n there are
n minus 1 steps, not n.

### Exercises

**Block A. Fundamentals**

1. Write the first four terms of the sequence whose general term is a of n equals 3n minus 1.
2. A sequence has first term 2 and each next term is the previous one plus 5. Write the first four
   terms.
3. A sequence has first term 3 and each next term is the previous one multiplied by 2. Write the
   first five terms.
4. In the sequence with general term a of n equals n squared plus 1, work out the fifth term.
5. The Fibonacci sequence starts with 1 and 1, and each next term is the sum of the two previous
   ones. Write the first six terms.

**Block B. Building up**

6. In a sequence, the first term is 2 and each next term is the previous one plus 5. Find the
   general term.
7. In a sequence, the first term is 3 and each next term is the previous one multiplied by 2. Find
   the general term and the seventh term.
8. The triangular number at position n is given by n times (n plus 1) divided by 2. Work out the
   tenth triangular number.
9. In the Fibonacci sequence that starts with 1 and 1, find the tenth term.
10. Find the general term of the sequence 5, 8, 11, 14 and say whether it is an arithmetic
    progression.
11. A sequence has first term 1 and each next term is the previous one plus 2n, where n is the
    position of the previous term. Write the first five terms and find the general term.
12. In the sequence with general term a of n equals 2 to the power of n minus 1, show that each next
    term is twice the previous one plus 1.
13. A water tank holds 800 litres and each day loses half of what it had. Write the recurrence law
    and find how much is left after 5 days.

**Block C. Going further**

14. A sequence has first term 1 and each next term is twice the previous one plus 3. Using the
    substitution b of n equals a of n plus 3, find the general term and the fifth term.
15. Knowing that 1 divided by k times (k plus 1) equals 1 over k minus 1 over (k plus 1), work out
    the sum of those fractions for k running from 1 to 10.
16. A sequence has first term 2 and each next term is the triple of the previous one. Show that it
    is a geometric progression, find the general term and add the first five terms.
17. A sequence has first term 1 and each next term is the previous one plus 2n plus 1, where n is
    the position of the previous term. Show that the term at position n is n squared.
18. At a party, each guest greets all the others exactly once. Calling a of n the number of
    greetings among n guests, write the law that links the case of n plus 1 guests to the case of n
    guests, find the general term and find how many guests produce 190 greetings.

### Answer key

1. 2, 5, 8 and 11.
2. 2, 7, 12 and 17.
3. 3, 6, 12, 24 and 48.
4. 26.
5. 1, 1, 2, 3, 5 and 8.
6. a of n equals 5n minus 3.
7. a of n equals 3 times 2 to the power of (n minus 1). The seventh term is 192.
8. 55.
9. 55.
10. a of n equals 3n plus 2. It is an arithmetic progression with common difference 3.
11. 1, 3, 7, 13 and 21. The general term is a of n equals n squared minus n plus 1.
12. Twice the term at position n plus 1 gives 2 times (2 to the power of n minus 1) plus 1, which is
    2 to the power of (n plus 1) minus 1, exactly the next term.
13. The law is a of n plus 1 equals half of a of n. There are 25 litres left.
14. With b of n equals a of n plus 3, we get b of n plus 1 equals 2 times b of n, with b of 1 equal
    to 4. So b of n is 2 to the power of (n plus 1) and a of n is 2 to the power of (n plus 1) minus
    3. The fifth term is 61.
15. The sum is 10 over 11. The middle terms cancel out and what is left is 1 minus 1 over 11.
16. It is geometric with ratio 3, because dividing each term by the previous one always gives 3. The
    general term is a of n equals 2 times 3 to the power of (n minus 1), and the sum of the first
    five terms is 242.
17. Adding the differences from position 1 up to position n minus 1, each part is 2 times the
    position plus 1, and adding those parts to the first term 1 gives n squared. Checking: positions
    1, 2, 3 and 4 give 1, 4, 9 and 16.
18. The law is a of n plus 1 equals a of n plus n, and the general term is n times (n minus 1)
    divided by 2. With 190 greetings, the equation gives 20 guests.

## VERIFICACAO

```python
X1: [3*i - 1 for i in range(1, 5)] == [2, 5, 8, 11]
X2: [2 + 5*(i - 1) for i in range(1, 5)] == [2, 7, 12, 17] and [5*i - 3 for i in range(1, 5)] == [2, 7, 12, 17]
X3: Rational(10*11, 2) == 55
X4: [1, 1, 2, 3, 5, 8, 13, 21, 34, 55][9] == 55 and all([1, 1, 2, 3, 5, 8, 13, 21, 34, 55][i] == [1, 1, 2, 3, 5, 8, 13, 21, 34, 55][i-1] + [1, 1, 2, 3, 5, 8, 13, 21, 34, 55][i-2] for i in range(2, 10))
X5: [2**(i + 1) - 3 for i in range(1, 4)] == [1, 5, 13] and all(2**(i + 2) - 3 == 2*(2**(i + 1) - 3) + 3 for i in range(1, 8)) and solve(Eq(p, 2*p + 3), p) == [-3]
X6: sum([Rational(1, i*(i + 1)) for i in range(1, 11)]) == Rational(10, 11)
E1: [3*i - 1 for i in range(1, 5)] == [2, 5, 8, 11]
E2: [2 + 5*(i - 1) for i in range(1, 5)] == [2, 7, 12, 17]
E3: [3*2**(i - 1) for i in range(1, 6)] == [3, 6, 12, 24, 48]
E4: 5**2 + 1 == 26
E5: [1, 1, 2, 3, 5, 8][5] == 8 and all([1, 1, 2, 3, 5, 8][i] == [1, 1, 2, 3, 5, 8][i-1] + [1, 1, 2, 3, 5, 8][i-2] for i in range(2, 6))
E6: [5*i - 3 for i in range(1, 5)] == [2, 7, 12, 17] and all(5*(i + 1) - 3 == (5*i - 3) + 5 for i in range(1, 10))
E7: [3*2**(i - 1) for i in range(1, 6)] == [3, 6, 12, 24, 48] and 3*2**6 == 192
E8: Rational(10*11, 2) == 55
E9: [1, 1, 2, 3, 5, 8, 13, 21, 34, 55][9] == 55
E10: [3*i + 2 for i in range(1, 5)] == [5, 8, 11, 14] and len(set([[5, 8, 11, 14][i] - [5, 8, 11, 14][i-1] for i in range(1, 4)])) == 1
E11: [1, 1 + 2*1, 3 + 2*2, 7 + 2*3, 13 + 2*4] == [1, 3, 7, 13, 21] and [i**2 - i + 1 for i in range(1, 6)] == [1, 3, 7, 13, 21]
E12: simplify(2**(n + 1) - 1 - (2*(2**n - 1) + 1)) == 0
E13: 800*Rational(1, 2)**5 == 25
E14: [2**(i + 1) - 3 for i in range(1, 6)] == [1, 5, 13, 29, 61] and all(2**(i + 2) - 3 == 2*(2**(i + 1) - 3) + 3 for i in range(1, 8)) and 2**6 - 3 == 61
E15: sum([Rational(1, i*(i + 1)) for i in range(1, 11)]) == Rational(10, 11) and 1 - Rational(1, 11) == Rational(10, 11)
E16: [2*3**(i - 1) for i in range(1, 6)] == [2, 6, 18, 54, 162] and sum([2*3**(i - 1) for i in range(1, 6)]) == 242
E17: all((i + 1)**2 == i**2 + 2*i + 1 for i in range(1, 11)) and [i**2 for i in range(1, 5)] == [1, 4, 9, 16]
E18: all(Rational((i + 1)*i, 2) == Rational(i*(i - 1), 2) + i for i in range(1, 12)) and solve(Eq(n*(n - 1)/2, 190), n) == [-19, 20]
```
