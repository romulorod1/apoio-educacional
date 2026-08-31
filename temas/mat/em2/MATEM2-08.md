---
id: MATEM2-08
serie: em2
unidade: estatistica
titulo_pt: Arranjos, permutações e combinações
titulo_en: Arrangements, permutations and combinations
resumo_pt: Decidir se a ordem importa e escolher entre permutação, arranjo e combinação, inclusive quando há elementos repetidos ou restrições.
resumo_en: Deciding whether order matters and choosing between permutation, arrangement and combination, including when there are repeated elements or restrictions.
prerequisitos: [MATEM2-07]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### A pergunta que organiza tudo

Todo problema de contagem de agrupamentos se resolve depois de responder uma única pergunta:
**trocar a ordem dos elementos escolhidos produz um agrupamento diferente?**

Se produz, a ordem importa, e o caso é de permutação ou de arranjo. Se não produz, a ordem não
importa, e o caso é de combinação. Um pódio de corrida e uma comissão de escola ilustram bem a
diferença: no pódio, trocar o primeiro com o segundo muda tudo; na comissão, escolher Ana e depois
Bruno dá exatamente a mesma comissão que escolher Bruno e depois Ana.

#### Fatorial

O fatorial de n é o produto de todos os naturais de 1 até n. Assim, o fatorial de 5 é o produto de
5, 4, 3, 2 e 1, que vale 120. Por convenção, o fatorial de zero vale 1, e essa convenção existe para
que as fórmulas seguintes funcionem sem exceções.

#### Permutação simples

Permutar é ordenar todos os elementos disponíveis. Com n elementos distintos, o número de ordens
possíveis é o fatorial de n.

**Exemplo 1.** De quantos modos 5 livros distintos podem ser enfileirados numa prateleira?
São 5 opções para o primeiro lugar, 4 para o segundo, e assim por diante até sobrar uma. O total é o
fatorial de 5, que dá 120.

#### Arranjo

Arranjar é escolher alguns elementos entre os disponíveis **e colocá-los em ordem**. O número de
arranjos de n elementos tomados k a k é o fatorial de n dividido pelo fatorial de n menos k, o que
equivale a multiplicar k fatores decrescentes a partir de n.

**Exemplo 2.** Numa corrida com 8 atletas, de quantos modos pode ser formado o pódio com os três
primeiros colocados?
São 8 opções para o primeiro lugar, 7 para o segundo e 6 para o terceiro, o que dá 336. Pela
fórmula, é o fatorial de 8 dividido pelo fatorial de 5, que dá o mesmo 336.

#### Combinação

Combinar é escolher alguns elementos **sem ordená-los**. Como cada grupo de k elementos foi contado
uma vez para cada ordem possível dele, basta dividir o número de arranjos pelo fatorial de k.

O número de combinações de n elementos tomados k a k é o fatorial de n dividido pelo produto do
fatorial de k pelo fatorial de n menos k.

**Exemplo 3.** Quantas comissões de 3 pessoas podem ser formadas com 10 candidatos?
A ordem não importa, então é combinação: o fatorial de 10 dividido pelo produto do fatorial de 3
pelo fatorial de 7, o que dá 120.

Compare com o pódio do exemplo anterior. Comissão e pódio partem da mesma escolha de pessoas, mas o
pódio conta cada trio 6 vezes, uma para cada ordem, e a comissão conta uma só.

#### Permutação com elementos repetidos

Quando alguns elementos são iguais entre si, as trocas entre eles não geram configurações novas.
Divide-se então o fatorial do total pelos fatoriais das quantidades repetidas.

**Exemplo 4.** Quantos anagramas tem a palavra BANANA?
São 6 letras, com a letra A repetida 3 vezes e a letra N repetida 2 vezes. O total é o fatorial de 6
dividido pelo produto do fatorial de 3 pelo fatorial de 2, o que dá 60.

#### Restrições

Duas técnicas resolvem a maioria das restrições:

**Posição fixa.** Se algum elemento precisa ficar num lugar determinado, coloque-o primeiro e conte
livremente o que sobra.

**Elementos juntos.** Se dois ou mais elementos precisam ficar lado a lado, trate o conjunto deles
como um bloco único, ordene os blocos e depois multiplique pelas ordens internas do bloco.

**Proibição.** Se certa configuração é proibida, conte o total e subtraia as configurações
proibidas. É quase sempre mais rápido do que separar em casos.

#### Erros comuns

**Usar arranjo onde cabia combinação.** O resultado sai multiplicado pelo fatorial de k. Antes de
calcular, pergunte se trocar a ordem muda o agrupamento.

**Esquecer de dividir pelas repetições.** Em anagramas de palavras com letras iguais, sem a divisão
o resultado fica grande demais.

**Somar quando deveria multiplicar dentro de um mesmo agrupamento.** Escolher 2 homens e 2 mulheres
é uma escolha só, feita em duas etapas, e as etapas se multiplicam.

**Contar duas vezes o mesmo grupo em problemas com ao menos um.** Nesses casos, o caminho seguro é
total menos o complementar.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule o fatorial de 6.
2. De quantos modos 5 livros distintos podem ser enfileirados numa prateleira?
3. Quantos anagramas tem a palavra AMOR?
4. Numa corrida com 8 atletas, de quantos modos pode ser formado o pódio com os três primeiros
   colocados?
5. Quantas comissões de 3 pessoas podem ser formadas com 10 candidatos?

**Bloco B. Consolidação**

6. Uma turma de 12 alunos precisa escolher uma comissão de 4 pessoas. Quantas comissões diferentes
   são possíveis?
7. Numa turma de 12 alunos, escolhem-se um representante, um vice e um secretário, sem acúmulo de
   cargos. De quantos modos isso pode ser feito?
8. Quantos anagramas tem a palavra BANANA?
9. Quantos anagramas tem a palavra MATEMATICA?
10. De um grupo com 7 homens e 5 mulheres, quantas comissões de 4 pessoas podem ser formadas com
    exatamente 2 homens e 2 mulheres?
11. Quantas diagonais tem um polígono convexo de 12 lados?
12. Num plano há 8 pontos e não existem 3 deles alinhados. Quantos triângulos ficam determinados por
    esses pontos?
13. Quantos anagramas da palavra AMOR começam por vogal?

**Bloco C. Aprofundamento**

14. Quantos anagramas da palavra BANANA começam e terminam com a letra A?
15. Numa turma de 10 alunos, quantas comissões de 4 pessoas podem ser formadas se dois deles, Ana e
    Bruno, se recusam a participar juntos da mesma comissão?
16. Sete pessoas vão se sentar em 7 cadeiras enfileiradas, e três delas formam uma família que quer
    ficar em cadeiras consecutivas. De quantos modos as sete podem se sentar?
17. Uma comissão de 5 pessoas será formada a partir de 6 homens e 4 mulheres, e precisa ter ao menos
    uma mulher. Quantas comissões atendem à exigência?
18. Um polígono convexo tem 35 diagonais. Determine quantos lados ele tem e mostre o raciocínio que
    leva à equação usada.

### Gabarito

1. 720.
2. 120.
3. 24.
4. 336.
5. 120.
6. 495.
7. 1320.
8. 60. São 6 letras, com a letra A repetida 3 vezes e a letra N repetida 2 vezes.
9. 151200. São 10 letras, com A repetida 3 vezes, M repetida 2 vezes e T repetida 2 vezes.
10. 210. São 21 modos de escolher os homens e 10 modos de escolher as mulheres.
11. 54. São 66 pares de vértices, dos quais 12 são lados do polígono.
12. 56.
13. 12. A primeira letra tem 2 opções, e as três restantes se ordenam de 6 modos.
14. 12. Fixadas as duas letras A nas pontas, restam as letras A, N, N e B, cujas ordens distintas são
    o fatorial de 4 dividido pelo fatorial de 2.
15. 182. O total de comissões é 210 e as que têm os dois juntos são 28.
16. 720. A família vira um bloco, o que dá 5 elementos para ordenar, e o bloco tem 6 ordens internas.
17. 246. O total de comissões é 252 e as formadas só por homens são 6.
18. 10 lados. Cada vértice se liga a todos os outros menos ele mesmo e os 2 vizinhos, o que dá n
    vezes n menos 3, e cada diagonal foi contada duas vezes, então o número de diagonais é n vezes n
    menos 3 dividido por 2. Igualando a 35 chega-se a n igual a 10.

## EN

### Explanation

#### The question that organises everything

Every counting problem about groupings is settled once you answer a single question: **does changing
the order of the chosen elements produce a different grouping?**

If it does, order matters, and the case is a permutation or an arrangement. If it does not, order
does not matter, and the case is a combination. A race podium and a school committee show the
difference well: on the podium, swapping first and second changes everything; on the committee,
choosing Ana and then Bruno gives exactly the same committee as choosing Bruno and then Ana.

#### Factorial

The factorial of n is the product of all natural numbers from 1 up to n. So the factorial of 5 is
the product of 5, 4, 3, 2 and 1, which is 120. By convention the factorial of zero is 1, and that
convention exists so the formulas below work with no exceptions.

#### Simple permutation

To permute is to order all the available elements. With n distinct elements, the number of possible
orders is the factorial of n.

**Example 1.** In how many ways can 5 distinct books be lined up on a shelf?
There are 5 options for the first place, 4 for the second, and so on until one is left. The total is
the factorial of 5, which gives 120.

#### Arrangement

To arrange is to choose some of the available elements **and put them in order**. The number of
arrangements of n elements taken k at a time is the factorial of n divided by the factorial of n
minus k, which is the same as multiplying k decreasing factors starting at n.

**Example 2.** In a race with 8 athletes, in how many ways can the podium with the first three
places be formed?
There are 8 options for first place, 7 for second and 6 for third, which gives 336. By the formula,
it is the factorial of 8 divided by the factorial of 5, which gives the same 336.

#### Combination

To combine is to choose some elements **without ordering them**. Since each group of k elements was
counted once for every possible order of it, you divide the number of arrangements by the factorial
of k.

The number of combinations of n elements taken k at a time is the factorial of n divided by the
product of the factorial of k and the factorial of n minus k.

**Example 3.** How many committees of 3 people can be formed from 10 candidates?
Order does not matter, so it is a combination: the factorial of 10 divided by the product of the
factorial of 3 and the factorial of 7, which gives 120.

Compare this with the podium above. Committee and podium start from the same choice of people, but
the podium counts each trio 6 times, once for each order, while the committee counts it once.

#### Permutation with repeated elements

When some elements are equal to one another, swapping them creates no new configuration. So you
divide the factorial of the total by the factorials of the repeated amounts.

**Example 4.** How many arrangements of the letters of the word BANANA are there?
There are 6 letters, with the letter A repeated 3 times and the letter N repeated 2 times. The total
is the factorial of 6 divided by the product of the factorial of 3 and the factorial of 2, which
gives 60.

#### Restrictions

Two techniques settle most restrictions:

**Fixed position.** If some element must sit in a given place, put it there first and count freely
what is left.

**Elements kept together.** If two or more elements must stay side by side, treat the set of them as
a single block, order the blocks, and then multiply by the internal orders of the block.

**Forbidden case.** If a configuration is forbidden, count the total and subtract the forbidden
configurations. That is almost always faster than splitting into cases.

#### Common mistakes

**Using an arrangement where a combination was called for.** The result comes out multiplied by the
factorial of k. Before calculating, ask whether changing the order changes the grouping.

**Forgetting to divide by the repetitions.** In arrangements of letters of words with equal letters,
without that division the result comes out far too large.

**Adding when you should multiply inside one grouping.** Choosing 2 men and 2 women is a single
choice made in two stages, and stages multiply.

**Counting the same group twice in problems with at least one.** In those cases the safe route is
the total minus the complement.

### Exercises

**Block A. Fundamentals**

1. Work out the factorial of 6.
2. In how many ways can 5 distinct books be lined up on a shelf?
3. How many arrangements of the letters of the word AMOR are there?
4. In a race with 8 athletes, in how many ways can the podium with the first three places be formed?
5. How many committees of 3 people can be formed from 10 candidates?

**Block B. Building up**

6. A class of 12 students has to choose a committee of 4 people. How many different committees are
   possible?
7. In a class of 12 students, a representative, a deputy and a secretary are chosen, with nobody
   holding two posts. In how many ways can this be done?
8. How many arrangements of the letters of the word BANANA are there?
9. How many arrangements of the letters of the word MATEMATICA are there?
10. From a group of 7 men and 5 women, how many committees of 4 people can be formed with exactly 2
    men and 2 women?
11. How many diagonals does a convex polygon with 12 sides have?
12. A plane contains 8 points and no 3 of them lie on the same line. How many triangles do these
    points determine?
13. How many arrangements of the letters of the word AMOR start with a vowel?

**Block C. Going further**

14. How many arrangements of the letters of the word BANANA start and end with the letter A?
15. In a class of 10 students, how many committees of 4 people can be formed if two of them, Ana and
    Bruno, refuse to serve on the same committee together?
16. Seven people will sit on 7 chairs in a row, and three of them are a family who want consecutive
    chairs. In how many ways can the seven be seated?
17. A committee of 5 people will be formed from 6 men and 4 women, and it must include at least one
    woman. How many committees meet the requirement?
18. A convex polygon has 35 diagonals. Find how many sides it has and show the reasoning that leads
    to the equation you used.

### Answer key

1. 720.
2. 120.
3. 24.
4. 336.
5. 120.
6. 495.
7. 1320.
8. 60. There are 6 letters, with the letter A repeated 3 times and the letter N repeated 2 times.
9. 151200. There are 10 letters, with A repeated 3 times, M repeated 2 times and T repeated 2 times.
10. 210. There are 21 ways of choosing the men and 10 ways of choosing the women.
11. 54. There are 66 pairs of vertices, of which 12 are sides of the polygon.
12. 56.
13. 12. The first letter has 2 options, and the remaining three can be ordered in 6 ways.
14. 12. With the two letters A fixed at the ends, the letters A, N, N and B are left, and their
    distinct orders number the factorial of 4 divided by the factorial of 2.
15. 182. The total number of committees is 210 and those containing both of them are 28.
16. 720. The family becomes one block, which leaves 5 elements to order, and the block has 6
    internal orders.
17. 246. The total number of committees is 252 and those made only of men are 6.
18. 10 sides. Each vertex joins every other one except itself and its 2 neighbours, which gives n
    times n minus 3, and each diagonal was counted twice, so the number of diagonals is n times n
    minus 3 divided by 2. Setting that equal to 35 leads to n equal to 10.

## VERIFICACAO

```python
X1: factorial(5) == 120
X2: 8*7*6 == 336 and factorial(8)/factorial(5) == 336
X3: binomial(10,3) == 120 and factorial(10)/(factorial(3)*factorial(7)) == 120
X4: factorial(6)/(factorial(3)*factorial(2)) == 60
E1: factorial(6) == 720
E2: factorial(5) == 120
E3: factorial(4) == 24
E4: factorial(8)/factorial(5) == 336
E5: binomial(10,3) == 120
E6: binomial(12,4) == 495
E7: factorial(12)/factorial(9) == 1320
E8: factorial(6)/(factorial(3)*factorial(2)) == 60
E9: factorial(10)/(factorial(3)*factorial(2)*factorial(2)) == 151200
E10: binomial(7,2)*binomial(5,2) == 210 and binomial(7,2) == 21 and binomial(5,2) == 10
E11: binomial(12,2) - 12 == 54 and binomial(12,2) == 66
E12: binomial(8,3) == 56
E13: 2*factorial(3) == 12
E14: factorial(4)/factorial(2) == 12
E15: binomial(10,4) - binomial(8,2) == 182 and binomial(10,4) == 210 and binomial(8,2) == 28
E16: factorial(5)*factorial(3) == 720 and factorial(3) == 6
E17: binomial(10,5) - binomial(6,5) == 246 and binomial(10,5) == 252 and binomial(6,5) == 6
E18: solve(Eq(n*(n-3)/2, 35), n) == [-7, 10]
```
