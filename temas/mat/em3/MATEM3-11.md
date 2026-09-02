---
id: MATEM3-11
serie: em3
unidade: estatistica
titulo_pt: Revisão: contagem e probabilidade
titulo_en: Review: counting and probability
resumo_pt: Escolher entre princípio multiplicativo, permutação e combinação, e usar a contagem certa para calcular probabilidades.
resumo_en: Choosing between the multiplication principle, permutations and combinations, and using the right count to work out probabilities.
prerequisitos: [MATEM3-10]
duracao_min: 90
dificuldade: 5
---

## PT

### Explicação

#### A pergunta que decide tudo

Contagem parece um assunto de fórmulas, mas na prática é um assunto de uma pergunta só: **a ordem
importa?** Se trocar a ordem produz um resultado diferente, conta-se com permutação ou arranjo. Se
trocar a ordem produz a mesma coisa, conta-se com combinação. Escolher errado aqui estraga o
problema inteiro, por mais correta que seja a conta depois.

Uma segunda pergunta ajuda: **pode repetir?** Senha aceita repetição, comissão não aceita.

#### Princípio multiplicativo

Se uma escolha pode ser feita de m modos e, para cada um deles, outra escolha pode ser feita de n
modos, o total é:

T = m · n

onde T é o número de resultados possíveis das duas escolhas feitas em sequência. Esse princípio
sustenta todas as fórmulas que vêm depois.

Com 4 camisetas e 3 calças formam-se 4 × 3 = 12 combinações de roupa, porque cada camiseta pode ser
acompanhada por qualquer das calças.

#### Permutação

Permutar é ordenar todos os elementos. Com n elementos distintos, o número de ordens possíveis é:

P_{n} = n!

onde n! é o fatorial de n, o produto de todos os naturais de 1 até n. Escrevemos n! e lemos
"n fatorial".

**Exemplo 1.** Quantos anagramas tem a palavra LIVRO?
São cinco letras distintas, então o total é 5! = 120.

Quando há letras repetidas, cada repetição gera trocas que não mudam nada, e é preciso dividir. Com n
elementos, dos quais um se repete p vezes e outro se repete q vezes, o total é:

P = n! / (p! · q!)

onde P é o número de ordens distintas, n o total de elementos, e p e q as quantidades de cada
elemento que se repete.

#### Combinação

Combinar é escolher um subconjunto sem se importar com a ordem. O número de modos de escolher k
elementos entre n é:

C_{n,k} = n! / (k! · (n - k)!)

onde C_{n,k} é a combinação de n elementos tomados k a k, também chamada binomial de n sobre k.

**Exemplo 2.** De quantos modos se forma uma comissão de 3 pessoas em um grupo de 10?
Como a comissão não tem cargos, a ordem não importa. O total é C_{10,3} = 120.

#### Probabilidade em espaço equiprovável

Quando todos os resultados têm a mesma chance, a probabilidade de um evento A é:

P(A) = casos favoráveis / casos possíveis

A parte difícil quase nunca é a divisão: é contar direito os dois números.

**Exemplo 3.** Jogando dois dados comuns, qual a probabilidade de a soma dar 7?
Os casos possíveis são 36. Os favoráveis são os pares em que a soma dá 7, e há 6 deles. A
probabilidade é 6/36 = 1/6.

#### O complementar e o pelo menos um

Quando o enunciado diz **pelo menos um**, quase sempre compensa calcular a probabilidade de nenhum e
subtrair de 1:

P(pelo menos um) = 1 - P(nenhum)

Contar diretamente todos os casos com um, dois ou três acertos dá muito mais trabalho.

**Exemplo 4.** Jogando três dados, qual a probabilidade de sair ao menos um 6?
A probabilidade de um dado não dar 6 é 5/6. Para os três, é (5/6)^{3} = 125/216. Logo a resposta é
1 - 125/216 = 91/216.

#### Probabilidade condicional

Saber que algo já ocorreu encolhe o espaço amostral:

P(A | B) = P(A e B) / P(B)

onde P(A | B) é a probabilidade de A sabendo que B já ocorreu, e P(A e B) é a probabilidade de os
dois ocorrerem juntos. O erro clássico aqui é continuar dividindo pelo espaço antigo depois que a
informação chegou.

#### Erros comuns

**Usar combinação onde a ordem importa.** Pódio de primeiro, segundo e terceiro lugar não é
combinação, porque trocar as posições muda o resultado.

**Somar quando deveria multiplicar.** Etapas sucessivas se multiplicam. Casos alternativos é que se
somam.

**Esquecer de descontar a interseção.** Ao contar quem usa um recurso ou outro, quem usa os dois foi
contado duas vezes.

**Tratar extração sem reposição como se fosse com reposição.** Depois da primeira retirada, o total
diminui, e o número de favoráveis também.

### Exercícios

**Bloco A. Fundamentos**

1. Quantos anagramas tem a palavra LIVRO?
2. Calcule o número de modos de escolher 3 objetos entre 8 objetos distintos, sem importar a ordem.
3. Jogando dois dados comuns, qual é a probabilidade de a soma dos pontos ser 7?
4. Com 4 camisetas e 3 calças, quantas combinações diferentes de roupa podem ser montadas?
5. Retirando uma carta de um baralho de 52 cartas, qual é a probabilidade de sair um rei?

**Bloco B. Consolidação**

6. Quantos anagramas tem a palavra BANANA?
7. De quantos modos se pode formar uma comissão de 4 pessoas em um grupo de 9?
8. Em um grupo de 6 homens e 5 mulheres, de quantos modos se forma uma comissão de 3 pessoas com
   exatamente 2 homens?
9. Quantos números de 4 algarismos distintos existem, sabendo que o primeiro algarismo não pode ser
   zero?
10. Uma urna tem 5 bolas vermelhas e 3 bolas azuis. Retirando duas bolas sem reposição, qual é a
    probabilidade de as duas serem vermelhas?
11. Jogando três dados comuns, qual é a probabilidade de sair pelo menos um 6?
12. Quantos anagramas da palavra PROVA começam com a letra P?
13. Retirando duas cartas de um baralho de 52, sem reposição, qual é a probabilidade de as duas serem
    de copas, sabendo que o baralho tem 13 cartas de copas?

**Bloco C. Aprofundamento**

14. De quantos modos 5 pessoas podem se sentar em torno de uma mesa redonda, considerando iguais as
    disposições que diferem apenas por uma rotação?
15. Em uma família com 2 filhos, sabendo que ao menos um deles é menina, qual é a probabilidade de os
    dois serem meninas?
16. Em um grupo de 7 homens e 5 mulheres, de quantos modos se forma uma comissão de 4 pessoas com ao
    menos uma mulher?
17. Lançando uma moeda honesta 5 vezes, qual é a probabilidade de sair exatamente 3 caras?
18. Uma senha tem 4 caracteres, cada um escolhido entre as letras A, B, C, D e E, com repetição
    permitida. Quantas senhas contêm ao menos uma letra A?

### Gabarito

1. São 120 anagramas, pois há 5 letras distintas.
2. São 56 modos.
3. A probabilidade é 1/6, pois há 6 casos favoráveis entre 36 possíveis.
4. São 12 combinações.
5. A probabilidade é 1/13, pois há 4 reis em 52 cartas.
6. São 60 anagramas. A palavra tem 6 letras, com a letra A repetida 3 vezes e a letra N repetida 2
   vezes.
7. São 126 modos.
8. São 75 modos, escolhendo 2 homens entre 6 e 1 mulher entre 5.
9. São 4536 números. O primeiro algarismo tem 9 opções, o segundo também 9, o terceiro 8 e o quarto
   7.
10. A probabilidade é 5/14, pois é 5/8 × 4/7.
11. A probabilidade é 91/216. O complementar é (5/6)^{3}.
12. São 24 anagramas, pois as outras 4 letras podem ser ordenadas livremente.
13. A probabilidade é 1/17, pois é 13/52 × 12/51.
14. São 24 modos, porque fixar uma pessoa e ordenar as outras 4 elimina as rotações repetidas.
15. A probabilidade é 1/3. Entre os quatro casos igualmente prováveis, três têm ao menos uma
    menina e apenas um tem duas meninas.
16. São 460 modos. Do total de 495 comissões possíveis, retiram-se as 35 formadas apenas por homens.
17. A probabilidade é 5/16, pois há 10 sequências favoráveis entre 32 possíveis.
18. São 369 senhas. Do total de 625, descontam-se as 256 que não usam a letra A.

## EN

### Explanation

#### The question that decides everything

Counting looks like a topic about formulas, but in practice it is a topic about a single question:
**does order matter?** If swapping the order gives a different result, you count with permutations or
arrangements. If swapping the order gives the same thing, you count with combinations. Getting this
wrong ruins the whole problem, however correct the arithmetic that follows.

A second question helps: **can items repeat?** A password allows repetition, a committee does not.

#### The multiplication principle

If one choice can be made in m ways and, for each of them, another choice can be made in n ways, the
total is:

T = m · n

where T is the number of possible results of the two choices made in sequence. This principle
supports every formula that comes afterwards.

With 4 shirts and 3 pairs of trousers you get 4 × 3 = 12 outfits, because each shirt can go with any
of the trousers.

#### Permutations

To permute is to put all the elements in order. With n distinct elements, the number of possible
orders is:

P_{n} = n!

where n! is the factorial of n, the product of all natural numbers from 1 up to n. We write n! and
read it "n factorial".

**Example 1.** How many anagrams does the word LIVRO have?
There are five distinct letters, so the total is 5! = 120.

When letters repeat, each repetition produces swaps that change nothing, and you have to divide. With
n elements, one of which repeats p times and another q times, the total is:

P = n! / (p! · q!)

where P is the number of distinct orders, n the total number of elements, and p and q the amounts
of each repeated element.

#### Combinations

To combine is to choose a subset without caring about order. The number of ways of choosing k
elements among n is:

C_{n,k} = n! / (k! · (n - k)!)

where C_{n,k} is the combination of n elements taken k at a time, also called the binomial of n
over k.

**Example 2.** In how many ways can a committee of 3 people be formed from a group of 10?
Since the committee has no ranks, order does not matter. The total is C_{10,3} = 120.

#### Probability in an equally likely space

When every outcome has the same chance, the probability of an event A is:

P(A) = favourable cases / possible cases

The hard part is almost never the division: it is counting both numbers properly.

**Example 3.** Rolling two ordinary dice, what is the probability that the sum is 7?
The possible cases are 36. The favourable ones are the pairs whose sum is 7, and there are 6 of them.
The probability is 6/36 = 1/6.

#### The complement and the phrase at least one

When a problem says **at least one**, it almost always pays to work out the probability of none and
subtract it from 1:

P(at least one) = 1 - P(none)

Counting directly all the cases with one, two or three hits is far more work.

**Example 4.** Rolling three dice, what is the probability of getting at least one 6?
The probability that one die does not show 6 is 5/6. For all three it is (5/6)^{3} = 125/216. So
the answer is 1 - 125/216 = 91/216.

#### Conditional probability

Knowing that something has already happened shrinks the sample space:

P(A | B) = P(A and B) / P(B)

where P(A | B) is the probability of A given that B has already happened, and P(A and B) is the
probability that both happen together. The classic mistake here is to keep dividing by the old space
after the information has arrived.

#### Common mistakes

**Using combinations where order matters.** A podium with first, second and third place is not a
combination, because swapping the positions changes the result.

**Adding when you should multiply.** Successive stages multiply. It is alternative cases that add.

**Forgetting to subtract the overlap.** When counting who uses one resource or the other, whoever
uses both has been counted twice.

**Treating drawing without replacement as if it were with replacement.** After the first draw the
total goes down, and so does the number of favourable cases.

### Exercises

**Block A. Fundamentals**

1. How many anagrams does the word LIVRO have?
2. Work out the number of ways of choosing 3 objects among 8 distinct objects, order not mattering.
3. Rolling two ordinary dice, what is the probability that the sum of the spots is 7?
4. With 4 shirts and 3 pairs of trousers, how many different outfits can be put together?
5. Drawing one card from a deck of 52 cards, what is the probability of getting a king?

**Block B. Building up**

6. How many anagrams does the word BANANA have?
7. In how many ways can a committee of 4 people be formed from a group of 9?
8. In a group of 6 men and 5 women, in how many ways can a committee of 3 people with exactly 2 men
   be formed?
9. How many numbers with 4 distinct digits exist, given that the first digit cannot be zero?
10. An urn holds 5 red balls and 3 blue balls. Drawing two balls without replacement, what is the
    probability that both are red?
11. Rolling three ordinary dice, what is the probability of getting at least one 6?
12. How many anagrams of the word PROVA start with the letter P?
13. Drawing two cards from a deck of 52 without replacement, what is the probability that both are
    hearts, given that the deck holds 13 hearts?

**Block C. Going further**

14. In how many ways can 5 people sit around a round table, counting as equal the arrangements that
    differ only by a rotation?
15. In a family with 2 children, given that at least one of them is a girl, what is the probability
    that both are girls?
16. In a group of 7 men and 5 women, in how many ways can a committee of 4 people with at least one
    woman be formed?
17. Tossing a fair coin 5 times, what is the probability of getting exactly 3 heads?
18. A password has 4 characters, each chosen among the letters A, B, C, D and E, with repetition
    allowed. How many passwords hold at least one letter A?

### Answer key

1. There are 120 anagrams, since there are 5 distinct letters.
2. There are 56 ways.
3. The probability is 1/6, since there are 6 favourable cases among 36 possible ones.
4. There are 12 outfits.
5. The probability is 1/13, since there are 4 kings among 52 cards.
6. There are 60 anagrams. The word has 6 letters, with the letter A repeated 3 times and the letter N
   repeated 2 times.
7. There are 126 ways.
8. There are 75 ways, choosing 2 men among 6 and 1 woman among 5.
9. There are 4536 numbers. The first digit has 9 options, the second also 9, the third 8 and the
   fourth 7.
10. The probability is 5/14, since it is 5/8 × 4/7.
11. The probability is 91/216. The complement is (5/6)^{3}.
12. There are 24 anagrams, since the other 4 letters can be ordered freely.
13. The probability is 1/17, since it is 13/52 × 12/51.
14. There are 24 ways, because fixing one person and ordering the other 4 removes the repeated
    rotations.
15. The probability is 1/3. Among the four equally likely cases, three hold at least one girl
    and only one holds two girls.
16. There are 460 ways. From the total of 495 possible committees, the 35 made only of men are taken
    out.
17. The probability is 5/16, since there are 10 favourable sequences among 32 possible ones.
18. There are 369 passwords. From the total of 625, the 256 that use no letter A are subtracted.

## VERIFICACAO

```python
X1: factorial(5) == 120
X2: binomial(10, 3) == 120
X3: Rational(6, 36) == Rational(1, 6)
X4: 1 - Rational(5, 6)**3 == Rational(91, 216) and Rational(5, 6)**3 == Rational(125, 216)
E1: factorial(5) == 120
E2: binomial(8, 3) == 56
E3: Rational(6, 36) == Rational(1, 6)
E4: 4*3 == 12
E5: Rational(4, 52) == Rational(1, 13)
E6: factorial(6)/(factorial(3)*factorial(2)) == 60
E7: binomial(9, 4) == 126
E8: binomial(6, 2)*binomial(5, 1) == 75
E9: 9*9*8*7 == 4536
E10: Rational(5, 8)*Rational(4, 7) == Rational(5, 14)
E11: 1 - Rational(5, 6)**3 == Rational(91, 216)
E12: factorial(4) == 24
E13: Rational(13, 52)*Rational(12, 51) == Rational(1, 17)
E14: factorial(5)/5 == 24 and factorial(4) == 24
E15: Rational(1, 4)/Rational(3, 4) == Rational(1, 3)
E16: binomial(12, 4) - binomial(7, 4) == 460 and binomial(12, 4) == 495 and binomial(7, 4) == 35
E17: binomial(5, 3)/2**5 == Rational(5, 16) and binomial(5, 3) == 10 and 2**5 == 32
E18: 5**4 - 4**4 == 369 and 5**4 == 625 and 4**4 == 256
```
