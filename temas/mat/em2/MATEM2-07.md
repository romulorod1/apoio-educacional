---
id: MATEM2-07
serie: em2
unidade: estatistica
titulo_pt: Princípio fundamental da contagem
titulo_en: The fundamental counting principle
resumo_pt: Contar quantas configurações existem sem listar uma a uma, multiplicando as possibilidades de cada etapa e tratando restrições e casos separados.
resumo_en: Counting how many configurations exist without listing them one by one, multiplying the possibilities at each stage and handling restrictions and separate cases.
prerequisitos: []
duracao_min: 90
dificuldade: 3
---

## PT

### Explicação

#### Contar sem listar

Contar de quantos modos algo pode acontecer parece fácil enquanto os casos cabem numa folha. Com 4
camisas e 3 calças, dá para escrever as doze combinações e conferir. Com 10 camisas, 8 calças e 5
pares de tênis, listar deixa de ser possível, e a contagem passa a ser uma técnica com regras
próprias.

A ideia central é olhar a configuração como uma sequência de **decisões** e perguntar, para cada
decisão, de quantos modos ela pode ser tomada.

#### O princípio multiplicativo

Se uma decisão pode ser tomada de m modos e, para cada um deles, uma segunda decisão pode ser tomada
de n modos, então o par de decisões pode ser tomado de m vezes n modos.

O princípio vale para quantas etapas forem necessárias: multiplicam-se as possibilidades de cada
etapa. Há uma condição escondida que precisa ser respeitada: **o número de possibilidades de uma
etapa não pode mudar conforme a escolha feita nas anteriores**. Ele pode diminuir de forma
previsível, como acontece quando não se pode repetir, mas não pode depender de qual item foi
escolhido antes.

**Exemplo 1.** Com 4 camisas e 3 calças, quantos conjuntos diferentes se pode montar?
São duas etapas: escolher a camisa, de 4 modos, e escolher a calça, de 3 modos. O total é 4 vezes 3,
que dá 12.

#### Quando as escolhas interferem umas nas outras

Se um item escolhido sai da lista, a etapa seguinte tem uma possibilidade a menos. O importante é
que a redução seja a mesma qualquer que tenha sido a escolha anterior.

**Exemplo 2.** Quantas senhas de 3 algarismos distintos existem?
Para o primeiro algarismo há 10 opções. Escolhido ele, sobram 9 para o segundo e 8 para o terceiro.
O total é 10 vezes 9 vezes 8, que dá 720.

#### Comece pela etapa mais restrita

Quando alguma posição tem exigência própria, decida-a primeiro. Deixar a restrição para o fim é o
caminho mais rápido para errar, porque o número de opções que sobram passa a depender do que foi
escolhido antes.

**Exemplo 3.** Quantos números de 4 algarismos distintos existem?
A posição do milhar é a restrita, porque não aceita o zero: são 9 opções. Para a segunda posição
voltam a valer os dez algarismos, menos o que já foi usado, o que dá 9. Depois sobram 8 e 7. O total
é 9 vezes 9 vezes 8 vezes 7, que dá 4536.

#### O princípio aditivo

Quando os casos são **alternativos**, e não etapas de uma mesma configuração, as contagens se somam.
A pergunta que separa os dois princípios é curta: as decisões acontecem juntas ou é uma ou outra?
Juntas, multiplica. Uma ou outra, soma. Para somar sem contar duas vezes, os casos precisam ser
excludentes, isto é, nenhuma configuração pode caber em dois casos ao mesmo tempo.

#### Contar pelo complementar

Expressões como **ao menos um** costumam gerar muitos casos separados. Nessas horas conta-se o total
sem restrição e subtrai-se o que não interessa.

**Exemplo 4.** Quantos números de 3 algarismos têm ao menos um algarismo igual a 5?
Números de 3 algarismos existem 900, de 100 a 999. Os que não têm nenhum 5 são contados assim: 8
opções para a centena, que exclui o zero e o cinco, e 9 para cada uma das outras duas posições, o
que dá 8 vezes 9 vezes 9, ou seja, 648. Logo, com ao menos um 5 existem 900 menos 648, que dá 252.

#### Erros comuns

**Multiplicar quando os casos são alternativos.** Se o enunciado diz que a peça é de metal ou de
madeira, e essas possibilidades não convivem, as contagens se somam.

**Esquecer que o zero não abre número.** Em contagem de números, a primeira posição quase sempre tem
uma opção a menos que as outras.

**Tirar opções sem que o enunciado peça.** Se nada foi dito sobre repetir, repetir é permitido, e
cada etapa mantém todas as suas possibilidades.

**Deixar a restrição para o fim.** Quando uma posição exige algo, ela é a primeira a ser decidida, e
só depois se contam as demais com o que sobrou.

### Exercícios

**Bloco A. Fundamentos**

1. Um restaurante oferece 4 tipos de entrada e 6 tipos de prato principal. De quantos modos se pode
   escolher uma entrada e um prato principal?
2. Existem 3 caminhos ligando a escola à praça e 5 caminhos ligando a praça ao parque. Quantos
   trajetos diferentes vão da escola ao parque passando pela praça?
3. Quantas senhas de 3 algarismos existem, se os algarismos podem se repetir?
4. Quantos números de 3 algarismos distintos podem ser formados usando apenas os algarismos 1, 2, 3,
   4 e 5?
5. Uma placa é formada por 2 letras seguidas de 3 algarismos, com letras e algarismos podendo se
   repetir. O alfabeto usado tem 26 letras. Quantas placas diferentes existem?

**Bloco B. Consolidação**

6. Quantos números de 4 algarismos distintos existem?
7. Usando apenas os algarismos 1, 2, 3, 4 e 5, sem repetir, quantos números pares de 3 algarismos
   podem ser formados?
8. Uma bandeira tem 4 faixas horizontais e há 5 cores disponíveis. Faixas vizinhas precisam ter
   cores diferentes, e faixas que não são vizinhas podem repetir a cor. Quantas bandeiras diferentes
   existem?
9. Um grêmio de 8 estudantes vai eleger presidente, vice e tesoureiro, sem que ninguém ocupe dois
   cargos. De quantos modos isso pode ser feito?
10. Quantos números de 3 algarismos distintos podem ser formados usando apenas os algarismos 0, 1,
    2, 3 e 4?
11. Quantos números de 4 algarismos, podendo repetir algarismos, começam por algarismo ímpar e
    terminam em 0?
12. Quantos números de 3 algarismos distintos são múltiplos de 5?
13. Uma prova tem 10 afirmações e cada uma precisa ser marcada como certa ou errada. De quantos
    modos o cartão de respostas pode ser preenchido?

**Bloco C. Aprofundamento**

14. Uma placa é formada por 3 letras seguidas de 4 algarismos, com as 3 letras distintas entre si e
    os 4 algarismos distintos entre si. O alfabeto usado tem 26 letras. Quantas placas existem?
15. Quantos números de 3 algarismos têm ao menos um algarismo igual a 5?
16. Seis pessoas vão se sentar em 6 cadeiras enfileiradas. Duas delas, Ana e Bruno, precisam ficar
    em cadeiras vizinhas. De quantos modos as seis podem se sentar?
17. Usando os algarismos 0, 1, 2, 3, 4, 5 e 6, quantos números ímpares de 5 algarismos distintos
    podem ser formados?
18. Para contar quantos números de 3 algarismos distintos existem, um estudante calculou 10 vezes 9
    vezes 8 e obteve 720. Explique o erro, faça a contagem correta e diga quantas das configurações
    contadas por ele não são números de 3 algarismos.

### Gabarito

1. 24.
2. 15.
3. 1000. São 10 opções para cada uma das três posições.
4. 60.
5. 676000.
6. 4536. A primeira posição tem 9 opções, e as seguintes têm 9, 8 e 7.
7. 24. O algarismo final precisa ser 2 ou 4, o que dá 2 opções, e as outras duas posições ficam com
   4 e 3 opções.
8. 320. A primeira faixa tem 5 opções e cada faixa seguinte tem 4, por causa da cor vizinha.
9. 336.
10. 48. A primeira posição não aceita o zero, restando 4 opções, e as seguintes ficam com 4 e 3.
11. 500.
12. 136. Terminando em 0 são 72 números, e terminando em 5 são 64, porque a primeira posição perde o
    zero e o cinco.
13. 1024.
14. 78624000.
15. 252. O total de números de 3 algarismos é 900 e os que não têm nenhum 5 são 648.
16. 240. Tratando Ana e Bruno como um bloco, sobram 5 elementos para ordenar, e o bloco tem 2 ordens
    internas.
17. 900. O algarismo final tem 3 opções ímpares, o primeiro tem 5 opções, porque perde o zero e o
    algarismo já usado, e as três posições do meio ficam com 5, 4 e 3 opções.
18. A conta 10 vezes 9 vezes 8 permite que o zero ocupe a primeira posição. A contagem correta é 9
    vezes 9 vezes 8, que dá 648. Entre as 720 configurações contadas, 72 começam por zero e não são
    números de 3 algarismos.

## EN

### Explanation

#### Counting without listing

Counting how many ways something can happen looks easy while the cases fit on one page. With 4
shirts and 3 pairs of trousers you can write out the twelve outfits and check them. With 10 shirts,
8 pairs of trousers and 5 pairs of trainers, listing stops being possible, and counting becomes a
technique with rules of its own.

The central idea is to see the configuration as a sequence of **decisions** and to ask, for each
decision, in how many ways it can be made.

#### The multiplication principle

If one decision can be made in m ways and, for each of them, a second decision can be made in n
ways, then the pair of decisions can be made in m times n ways.

The principle works for as many stages as needed: you multiply the possibilities at each stage.
There is a hidden condition that must be respected: **the number of possibilities at one stage
cannot change according to the choice made at the previous ones**. It may shrink in a predictable
way, as happens when repetition is not allowed, but it cannot depend on which item was picked
before.

**Example 1.** With 4 shirts and 3 pairs of trousers, how many different outfits can you put
together?
There are two stages: choosing the shirt, in 4 ways, and choosing the trousers, in 3 ways. The total
is 4 times 3, which gives 12.

#### When the choices interfere with one another

If a chosen item leaves the list, the next stage has one possibility fewer. What matters is that the
reduction is the same whatever the previous choice was.

**Example 2.** How many passwords with 3 distinct digits are there?
For the first digit there are 10 options. Once it is chosen, 9 are left for the second and 8 for the
third. The total is 10 times 9 times 8, which gives 720.

#### Start with the most restricted stage

When some position has a requirement of its own, settle it first. Leaving the restriction to the end
is the fastest route to an error, because the number of remaining options then depends on what was
chosen earlier.

**Example 3.** How many 4-digit numbers with distinct digits are there?
The thousands position is the restricted one, since it does not accept zero: there are 9 options.
For the second position all ten digits are back in play, minus the one already used, which gives 9.
Then 8 and 7 are left. The total is 9 times 9 times 8 times 7, which gives 4536.

#### The addition principle

When the cases are **alternatives**, rather than stages of the same configuration, the counts are
added. The question that separates the two principles is short: do the decisions happen together or
is it one or the other? Together, multiply. One or the other, add. To add without counting twice,
the cases must be exclusive, that is, no configuration may fall into two cases at once.

#### Counting through the complement

Phrases such as **at least one** tend to create many separate cases. In those moments you count the
total with no restriction and subtract what does not interest you.

**Example 4.** How many 3-digit numbers have at least one digit equal to 5?
There are 900 three-digit numbers, from 100 to 999. Those with no 5 are counted like this: 8 options
for the hundreds digit, which rules out zero and five, and 9 for each of the other two positions,
which gives 8 times 9 times 9, that is, 648. So numbers with at least one 5 are 900 minus 648, which
gives 252.

#### Common mistakes

**Multiplying when the cases are alternatives.** If the statement says the part is made of metal or
of wood, and those possibilities do not coexist, the counts are added.

**Forgetting that zero does not open a number.** When counting numbers, the first position almost
always has one option fewer than the others.

**Removing options the statement never removed.** If nothing was said about repeating, repeating is
allowed, and every stage keeps all of its possibilities.

**Leaving the restriction to the end.** When a position demands something, it is the first one to be
settled, and only then are the others counted with what is left.

### Exercises

**Block A. Fundamentals**

1. A restaurant offers 4 kinds of starter and 6 kinds of main course. In how many ways can you
   choose one starter and one main course?
2. There are 3 paths linking the school to the square and 5 paths linking the square to the park.
   How many different routes go from the school to the park through the square?
3. How many passwords with 3 digits are there, if digits may repeat?
4. How many 3-digit numbers with distinct digits can be formed using only the digits 1, 2, 3, 4
   and 5?
5. A plate is made of 2 letters followed by 3 digits, with letters and digits allowed to repeat. The
   alphabet used has 26 letters. How many different plates are there?

**Block B. Building up**

6. How many 4-digit numbers with distinct digits are there?
7. Using only the digits 1, 2, 3, 4 and 5, with no repetition, how many even 3-digit numbers can be
   formed?
8. A flag has 4 horizontal stripes and there are 5 colours available. Neighbouring stripes must have
   different colours, and stripes that are not neighbours may repeat a colour. How many different
   flags are there?
9. A student council of 8 members will elect a president, a vice president and a treasurer, with
   nobody holding two posts. In how many ways can this be done?
10. How many 3-digit numbers with distinct digits can be formed using only the digits 0, 1, 2, 3
    and 4?
11. How many 4-digit numbers, with digits allowed to repeat, start with an odd digit and end in 0?
12. How many 3-digit numbers with distinct digits are multiples of 5?
13. A test has 10 statements and each one must be marked true or false. In how many ways can the
    answer sheet be filled in?

**Block C. Going further**

14. A plate is made of 3 letters followed by 4 digits, with the 3 letters distinct from one another
    and the 4 digits distinct from one another. The alphabet used has 26 letters. How many plates
    are there?
15. How many 3-digit numbers have at least one digit equal to 5?
16. Six people will sit on 6 chairs in a row. Two of them, Ana and Bruno, must sit on neighbouring
    chairs. In how many ways can the six of them be seated?
17. Using the digits 0, 1, 2, 3, 4, 5 and 6, how many odd 5-digit numbers with distinct digits can
    be formed?
18. To count how many 3-digit numbers with distinct digits there are, a student worked out 10 times
    9 times 8 and got 720. Explain the mistake, carry out the correct count, and say how many of the
    configurations counted that way are not 3-digit numbers.

### Answer key

1. 24.
2. 15.
3. 1000. There are 10 options for each of the three positions.
4. 60.
5. 676000.
6. 4536. The first position has 9 options, and the following ones have 9, 8 and 7.
7. 24. The final digit must be 2 or 4, which gives 2 options, and the other two positions are left
   with 4 and 3 options.
8. 320. The first stripe has 5 options and each following stripe has 4, because of the neighbouring
   colour.
9. 336.
10. 48. The first position does not accept zero, leaving 4 options, and the following ones are left
    with 4 and 3.
11. 500.
12. 136. Ending in 0 there are 72 numbers, and ending in 5 there are 64, because the first position
    loses both zero and five.
13. 1024.
14. 78624000.
15. 252. The total of 3-digit numbers is 900 and those with no 5 are 648.
16. 240. Treating Ana and Bruno as one block, 5 elements are left to order, and the block has 2
    internal orders.
17. 900. The final digit has 3 odd options, the first has 5 options, since it loses zero and the
    digit already used, and the three middle positions are left with 5, 4 and 3 options.
18. The calculation 10 times 9 times 8 lets zero take the first position. The correct count is 9
    times 9 times 8, which gives 648. Among the 720 configurations counted that way, 72 start with
    zero and are not 3-digit numbers.

## VERIFICACAO

```python
X1: 4*3 == 12
X2: 10*9*8 == 720
X3: 9*9*8*7 == 4536
X4: 900 - 8*9*9 == 252
E1: 4*6 == 24
E2: 3*5 == 15
E3: 10**3 == 1000
E4: 5*4*3 == 60
E5: 26**2 * 10**3 == 676000
E6: 9*9*8*7 == 4536
E7: 2*4*3 == 24
E8: 5*4*4*4 == 320
E9: 8*7*6 == 336
E10: 4*4*3 == 48
E11: 5*10*10*1 == 500
E12: 9*8 + 8*8 == 136
E13: 2**10 == 1024
E14: 26*25*24*10*9*8*7 == 78624000
E15: 900 - 8*9*9 == 252
E16: 2*factorial(5) == 240
E17: 3*5*5*4*3 == 900
E18: 10*9*8 == 720 and 9*9*8 == 648 and 720 - 648 == 72
```
