---
id: MATEM1-01
serie: em1
unidade: numeros
titulo_pt: Conjuntos numéricos
titulo_en: Number sets
resumo_pt: Reconhecer naturais, inteiros, racionais, irracionais e reais, passar de decimal para fração e escrever conjuntos como intervalos.
resumo_en: Recognising naturals, integers, rationals, irrationals and reals, turning decimals into fractions and writing sets as intervals.
prerequisitos: []
duracao_min: 90
dificuldade: 3
---

## PT

### Explicação

#### A ideia: caixas que cabem umas dentro das outras

Os números não apareceram todos de uma vez. Cada vez que uma conta ficou impossível dentro dos
números que existiam, foi preciso inventar números novos. O resultado é uma sequência de conjuntos
em que cada um contém o anterior inteiro.

**Naturais.** São os números de contagem: 0, 1, 2, 3, 4 e assim por diante. Dentro deles a soma e a
multiplicação sempre funcionam. A subtração não: 3 - 5 não existe entre os naturais.

**Inteiros.** Acrescentam os negativos: -3, -2, -1, 0, 1, 2, 3 e assim por diante. Agora toda
subtração funciona. A divisão ainda não: 3/5 não é inteiro.

**Racionais.** São os números que podem ser escritos na forma a/b, com a e b inteiros e b ≠ 0, isto
é, com o denominador diferente de zero. Todo inteiro é racional, porque 7 = 7/1. A marca dos
racionais na forma decimal é clara: ou a representação termina, como em 0,25, ou ela repete um bloco
para sempre, como em 0,333 e assim por diante.

**Irracionais.** São os números cuja representação decimal é infinita e nunca passa a repetir um
bloco. √2, que se lê "raiz de 2", e π, o número pi, são os exemplos clássicos. Um irracional não
pode ser escrito como fração de inteiros, e é exatamente isso que o define.

**Reais.** Reunindo racionais e irracionais chega-se aos reais, que preenchem a reta sem deixar
buracos. Cada ponto da reta é um real, e cada real é um ponto da reta.

A cadeia de inclusões é: todo natural é inteiro, todo inteiro é racional, todo racional é real. Os
irracionais ficam dentro dos reais e fora dos racionais, e não há nenhum número que seja racional e
irracional ao mesmo tempo.

#### De decimal para fração

Decimal com fim é o caso fácil: escreve-se o número sobre a potência de 10 correspondente e depois
simplifica.

**Exemplo 1.** Escrever 0,375 como fração.
São três casas decimais, então o denominador é 1000. Fica 375/1000, que simplificado dá 3/8.

Dízima periódica exige outro caminho. O mais direto é enxergá-la como soma infinita de uma
progressão geométrica.

**Exemplo 2.** Escrever 0,444 e assim por diante como fração.
Ela é 4/10 + 4/100 + 4/1000 e assim por diante. O primeiro termo é a_{1} = 4/10 e a razão é
q = 1/10. A soma infinita de uma progressão geométrica é

S = a_{1}/(1 - q)

onde S é a soma, a_{1} o primeiro termo e q a razão. Aqui
S = (4/10)/(1 - 1/10) = (4/10)/(9/10) = 4/9.

Esse resultado explica um fato que costuma incomodar: 0,999 e assim por diante é igual a 1, e não um
pouquinho menor. A soma infinita dá exatamente 1.

#### Intervalos

Quando o conjunto é um pedaço contínuo da reta, listar os elementos é impossível. Usa-se intervalo.
A notação precisa dizer duas coisas: quais são os extremos e se cada extremo entra ou não. Colchete
quer dizer que o extremo entra, parêntese quer dizer que ele fica de fora.

- [2, 5] são os valores 2 ≤ x ≤ 5, com os dois extremos incluídos.
- (2, 5) são os valores 2 < x < 5, sem incluir nenhum extremo.
- [2, 5) são os valores 2 ≤ x < 5, com o 2 incluído e o 5 de fora.
- (3, +∞) são os valores x > 3, sem limite superior.

Alguns livros escrevem o intervalo aberto com o colchete virado para fora: ]2, 5[ é o mesmo que
(2, 5).

O extremo entra quando a desigualdade é do tipo ≥ ou ≤, que se leem "maior ou igual" e
"menor ou igual", e não entra quando é do tipo > ou <, estritamente maior ou estritamente menor.
Infinito nunca entra, porque não é um número: do lado do ∞ o parêntese é obrigatório.

#### União, intersecção e diferença

A união junta tudo que está em pelo menos um dos conjuntos. A intersecção guarda só o que está nos
dois. A diferença de A para B guarda o que está em A e não está em B.

**Exemplo 3.** Determinar a intersecção de [0, 5] com (3, 8).
O que está nos dois ao mesmo tempo são os valores 3 < x ≤ 5, ou seja, (3, 5]. Repare que o 3 fica de
fora, porque o segundo intervalo o exclui, e o 5 entra, porque o primeiro o inclui e o segundo
também o contém.

#### Operar não muda de conjunto por acaso

Somar, subtrair, multiplicar ou dividir dois racionais sempre devolve um racional, com a única
ressalva de não dividir por zero. Com irracionais isso falha: o resultado pode voltar a ser
racional.

**Exemplo 4.** √2 é irracional e √8 também. O produto das duas vale √2 · √8 = √16 = 4, que é
racional.

Por isso a pergunta "esse número é irracional?" nunca se responde olhando a cara da expressão. É
preciso simplificar primeiro.

#### Erros comuns

**Achar que dízima periódica é irracional.** Dízima periódica é racional, sempre. Irracional é a
decimal infinita que não repete bloco nenhum.

**Confundir o número com a sua escrita.** √9 parece irracional pela aparência, mas √9 = 3 e é
natural. Simplifique antes de classificar.

**Esquecer se o extremo entra no intervalo.** É o erro mais caro em prova, porque muda a resposta
por um único ponto.

**Tratar infinito como número.** Não existe intervalo fechado no infinito, e não se soma nem
multiplica com ele nesse nível.

### Exercícios

**Bloco A. Fundamentos**

1. Diga a qual conjunto, entre naturais, inteiros, racionais e irracionais, cada número pertence de
   forma mais restrita: -7, 3/4, √9, √2 e 0,25.
2. Escreva 0,4 e 1,25 na forma de fração irredutível.
3. Sendo A o conjunto de elementos 1, 2, 3 e 4, e B o conjunto de elementos 3, 4 e 5, determine a
   união e a intersecção de A com B.
4. Escreva em forma de intervalo o conjunto dos números reais x com -2 ≤ x < 5.
5. Coloque em ordem crescente: 3/2, √2, 1,4 e 1.

**Bloco B. Consolidação**

6. Escreva a dízima 0,222 e assim por diante na forma de fração.
7. Escreva a dízima 1,333 e assim por diante na forma de fração.
8. Determine a intersecção de [-1, 4] com (2, 7).
9. Escreva, em forma de intervalo, o conjunto dos reais x com x^{2} > 9.
10. Sendo A o conjunto dos naturais de 1 a 9 que são múltiplos de 2, e B o conjunto dos naturais de
    1 a 9 que são múltiplos de 3, determine a intersecção de A com B e os elementos de A que não
    pertencem a B.
11. Calcule 2/3 + 3/4 e diga a qual conjunto pertence o resultado.
12. Verifique se √8/√2 é um número racional.
13. Determine o conjunto dos reais x com (x - 1) · (x + 2) ≤ 0.

**Bloco C. Aprofundamento**

14. Determine todos os números inteiros n para os quais (n + 3)/(n - 2) também é inteiro.
15. Determine o conjunto dos reais x para os quais √(x - 3) existe e, ao mesmo tempo, x ≠ 5.
16. Mostre que a soma de um número racional com um número irracional é sempre irracional.
17. Usando soma infinita, decida se 0,999 e assim por diante é igual a 1.
18. Considere A o conjunto dos reais x com x^{2} - 5x + 6 ≤ 0, e B o conjunto dos reais x > 2,5.
    Determine a intersecção de A com B.

### Gabarito

1. -7 é inteiro; 3/4 é racional; √9 = 3 e é natural; √2 é irracional; 0,25 é racional.
2. 2/5 e 5/4.
3. A união tem os elementos 1, 2, 3, 4 e 5. A intersecção tem os elementos 3 e 4.
4. [-2, 5).
5. 1 < 1,4 < √2 < 3/2.
6. 2/9.
7. 4/3.
8. (2, 4].
9. (-∞, -3) reunido com (3, +∞).
10. A intersecção tem apenas o 6. Os elementos de A fora de B são 2, 4 e 8.
11. O resultado é 17/12, que é racional.
12. É racional, porque √8/√2 = √4 = 2.
13. [-2, 1].
14. n = -3, 1, 3 e 7. O caminho é escrever o quociente como 1 + 5/(n - 2), o que obriga n - 2 a ser
    divisor de 5.
15. Os valores x ≥ 3, tirando o 5. Em intervalos: [3, 5) reunido com (5, +∞).
16. Suponha r racional, i irracional e r + i = s, com s racional. Então i = s - r, e a diferença de
    dois racionais é racional. Isso contradiz i ser irracional. Logo a soma nunca é racional.
17. É igual a 1. A soma tem primeiro termo 9/10 e razão 1/10, e vale (9/10)/(9/10) = 1.
18. Os valores x com 2,5 < x ≤ 3. O conjunto A é o intervalo [2, 3].

## EN

### Explanation

#### The idea: boxes that fit inside one another

Numbers did not all show up at once. Every time a calculation became impossible inside the numbers
that existed, new numbers had to be invented. The result is a chain of sets in which each one
contains the previous one whole.

**Naturals.** These are the counting numbers: 0, 1, 2, 3, 4 and so on. Inside them addition and
multiplication always work. Subtraction does not: 3 - 5 does not exist among the naturals.

**Integers.** These add the negatives: -3, -2, -1, 0, 1, 2, 3 and so on. Now every subtraction
works. Division still does not: 3/5 is not an integer.

**Rationals.** These are the numbers that can be written in the form a/b, with a and b integers and
b ≠ 0, that is, with a denominator different from zero. Every integer is rational, because 7 = 7/1.
The decimal signature of a rational is clear: either the representation ends, as in 0.25, or it
repeats a block forever, as in 0.333 and so on.

**Irrationals.** These are the numbers whose decimal representation is infinite and never settles
into a repeating block. √2, read "the square root of 2", and π, the number pi, are the classic
examples. An irrational cannot be written as a fraction of integers, and that is exactly what
defines it.

**Reals.** Putting rationals and irrationals together gives the reals, which fill the line leaving no
gaps. Every point of the line is a real number, and every real number is a point of the line.

The chain of inclusions is: every natural is an integer, every integer is rational, every rational is
real. The irrationals sit inside the reals and outside the rationals, and no number is rational and
irrational at the same time.

#### From decimal to fraction

A terminating decimal is the easy case: write the number over the matching power of 10 and then
simplify.

**Example 1.** Write 0.375 as a fraction.
There are three decimal places, so the denominator is 1000. That gives 375/1000, which simplifies to
3/8.

A repeating decimal needs another route. The most direct one is to see it as the infinite sum of a
geometric progression.

**Example 2.** Write 0.444 and so on as a fraction.
It is 4/10 + 4/100 + 4/1000 and so on. The first term is a_{1} = 4/10 and the ratio is q = 1/10. The
infinite sum of a geometric progression is

S = a_{1}/(1 - q)

where S is the sum, a_{1} the first term and q the ratio. Here
S = (4/10)/(1 - 1/10) = (4/10)/(9/10) = 4/9.

That result explains a fact that usually bothers students: 0.999 and so on equals 1, not a tiny bit
less. The infinite sum gives exactly 1.

#### Intervals

When the set is a continuous stretch of the line, listing its elements is impossible. We use an
interval instead. The notation has to say two things: what the endpoints are and whether each
endpoint is in. A square bracket means the endpoint is in, a round bracket means it is out.

- [2, 5] is the set of values 2 ≤ x ≤ 5, with both endpoints included.
- (2, 5) is the set of values 2 < x < 5, with neither endpoint included.
- [2, 5) is the set of values 2 ≤ x < 5, with 2 in and 5 out.
- (3, +∞) is the set of values x > 3, with no upper limit.

Some books write the open interval with the brackets turned outwards: ]2, 5[ is the same as (2, 5).

An endpoint is in when the inequality is of the ≥ or ≤ kind, read "greater than or equal" and
"less than or equal", and out when it is of the > or < kind, strictly greater or strictly less.
Infinity is never in, because it is not a number: on the ∞ side the round bracket is compulsory.

#### Union, intersection and difference

The union gathers everything that is in at least one of the sets. The intersection keeps only what is
in both. The difference of A from B keeps what is in A and not in B.

**Example 3.** Find the intersection of [0, 5] and (3, 8).
What lies in both at once are the values 3 < x ≤ 5, that is, (3, 5]. Notice that 3 is left out,
because the second interval excludes it, and 5 is in, because the first one includes it and the
second one contains it too.

#### Operating does not change set by accident

Adding, subtracting, multiplying or dividing two rationals always gives a rational back, with the
single proviso of not dividing by zero. With irrationals that fails: the result can turn out rational
again.

**Example 4.** √2 is irrational and so is √8. Their product is √2 · √8 = √16 = 4, which is
rational.

That is why the question "is this number irrational?" is never answered by looking at the shape of
the expression. You have to simplify first.

#### Common mistakes

**Thinking a repeating decimal is irrational.** A repeating decimal is always rational. Irrational is
the infinite decimal that repeats no block at all.

**Confusing the number with the way it is written.** √9 looks irrational, but √9 = 3 and is a
natural number. Simplify before classifying.

**Forgetting whether the endpoint belongs to the interval.** It is the most expensive slip in a test,
because it changes the answer by a single point.

**Treating infinity as a number.** There is no interval closed at infinity, and you do not add or
multiply with it at this level.

### Exercises

**Block A. Fundamentals**

1. Say which set, among naturals, integers, rationals and irrationals, each number belongs to in the
   most restricted way: -7, 3/4, √9, √2 and 0.25.
2. Write 0.4 and 1.25 as fractions in lowest terms.
3. Given A the set with elements 1, 2, 3 and 4, and B the set with elements 3, 4 and 5, find the
   union and the intersection of A and B.
4. Write as an interval the set of real numbers x with -2 ≤ x < 5.
5. Put in increasing order: 3/2, √2, 1.4 and 1.

**Block B. Building up**

6. Write the repeating decimal 0.222 and so on as a fraction.
7. Write the repeating decimal 1.333 and so on as a fraction.
8. Find the intersection of [-1, 4] and (2, 7).
9. Write, as intervals, the set of reals x with x^{2} > 9.
10. Given A the set of naturals from 1 to 9 that are multiples of 2, and B the set of naturals from
    1 to 9 that are multiples of 3, find the intersection of A and B and the elements of A that do
    not belong to B.
11. Work out 2/3 + 3/4 and say which set the result belongs to.
12. Check whether √8/√2 is a rational number.
13. Find the set of reals x with (x - 1) · (x + 2) ≤ 0.

**Block C. Going further**

14. Find every integer n for which (n + 3)/(n - 2) is also an integer.
15. Find the set of reals x for which √(x - 3) exists and, at the same time, x ≠ 5.
16. Show that the sum of a rational number and an irrational number is always irrational.
17. Using an infinite sum, decide whether 0.999 and so on equals 1.
18. Let A be the set of reals x with x^{2} - 5x + 6 ≤ 0, and B the set of reals x > 2.5. Find the
    intersection of A and B.

### Answer key

1. -7 is an integer; 3/4 is rational; √9 = 3 and is natural; √2 is irrational; 0.25 is rational.
2. 2/5 and 5/4.
3. The union has elements 1, 2, 3, 4 and 5. The intersection has elements 3 and 4.
4. [-2, 5).
5. 1 < 1.4 < √2 < 3/2.
6. 2/9.
7. 4/3.
8. (2, 4].
9. (-∞, -3) together with (3, +∞).
10. The intersection has only 6. The elements of A outside B are 2, 4 and 8.
11. The result is 17/12, which is rational.
12. It is rational, because √8/√2 = √4 = 2.
13. [-2, 1].
14. n = -3, 1, 3 and 7. The route is to write the quotient as 1 + 5/(n - 2), which forces n - 2 to
    be a divisor of 5.
15. The values x ≥ 3, leaving out 5. As intervals: [3, 5) together with (5, +∞).
16. Suppose r is rational, i is irrational and r + i = s, with s rational. Then i = s - r, and the
    difference of two rationals is rational. That contradicts i being irrational. So the sum is never
    rational.
17. It equals 1. The sum has first term 9/10 and ratio 1/10, and equals (9/10)/(9/10) = 1.
18. The values x with 2.5 < x ≤ 3. The set A is the interval [2, 3].

## VERIFICACAO

```python
X1: Rational(375, 1000) == Rational(3, 8)
X2: Rational(4, 10) / (1 - Rational(1, 10)) == Rational(4, 9)
X3: Intersection(Interval(0, 5), Interval.open(3, 8)) == Interval.Lopen(3, 5)
X4: simplify(sqrt(2) * sqrt(8)) == 4
E1: sqrt(9) == 3 and Rational(25, 100) == Rational(1, 4) and sqrt(2).is_rational == False
E2: Rational(4, 10) == Rational(2, 5) and Rational(125, 100) == Rational(5, 4)
E3: Union(FiniteSet(1, 2, 3, 4), FiniteSet(3, 4, 5)) == FiniteSet(1, 2, 3, 4, 5) and Intersection(FiniteSet(1, 2, 3, 4), FiniteSet(3, 4, 5)) == FiniteSet(3, 4)
E4: Intersection(Interval(-2, oo), Interval.open(-oo, 5)) == Interval.Ropen(-2, 5)
E5: (1 < Rational(14, 10)) and (Rational(14, 10) < sqrt(2)) and (sqrt(2) < Rational(3, 2))
E6: Rational(2, 10) / (1 - Rational(1, 10)) == Rational(2, 9)
E7: 1 + Rational(3, 10) / (1 - Rational(1, 10)) == Rational(4, 3)
E8: Intersection(Interval(-1, 4), Interval.open(2, 7)) == Interval.Lopen(2, 4)
E9: solveset(x**2 - 9 > 0, x, Reals) == Union(Interval.open(-oo, -3), Interval.open(3, oo))
E10: Intersection(FiniteSet(2, 4, 6, 8), FiniteSet(3, 6, 9)) == FiniteSet(6) and FiniteSet(2, 4, 6, 8) - FiniteSet(3, 6, 9) == FiniteSet(2, 4, 8)
E11: Rational(2, 3) + Rational(3, 4) == Rational(17, 12)
E12: simplify(sqrt(8) / sqrt(2)) == 2
E13: solveset((x - 1) * (x + 2) <= 0, x, Reals) == Interval(-2, 1)
E14: sorted([v for v in range(-20, 21) if v != 2 and Rational(v + 3, v - 2).is_integer]) == [-3, 1, 3, 7]
E15: Interval(3, oo) - FiniteSet(5) == Union(Interval.Ropen(3, 5), Interval.open(5, oo))
E16: # manual: demonstração por contradição, sem conta a conferir
E17: Rational(9, 10) / (1 - Rational(1, 10)) == 1
E18: Intersection(solveset(x**2 - 5*x + 6 <= 0, x, Reals), Interval.open(Rational(5, 2), oo)) == Interval.Lopen(Rational(5, 2), 3)
```
