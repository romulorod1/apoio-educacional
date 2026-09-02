---
id: MATEM2-10
serie: em2
unidade: estatistica
titulo_pt: Probabilidade
titulo_en: Probability
resumo_pt: Calcular a chance de um evento contando casos favoráveis e possíveis, e usar complementar, união e probabilidade condicional quando a contagem direta é ruim.
resumo_en: Working out the chance of an event by counting favourable and possible cases, and using the complement, unions and conditional probability when direct counting is awkward.
prerequisitos: [MATEM2-08]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### O que é probabilidade

Probabilidade é a medida da chance de um evento acontecer, num experimento cujo resultado não se
conhece de antemão. O conjunto de todos os resultados possíveis chama-se **espaço amostral**, e um
**evento** é qualquer parte desse conjunto.

Quando todos os resultados do espaço amostral têm a mesma chance, e só nesse caso, vale a fórmula
mais conhecida:

P(A) = casos favoráveis / casos possíveis

onde P(A) é a probabilidade do evento A.

O resultado é sempre um número entre 0 e 1: 0 ≤ P(A) ≤ 1. Vale 0 no evento impossível e vale 1 no
evento certo. Uma probabilidade negativa ou maior que 1 é sinal de erro de conta, e conferir isso
custa alguns segundos.

Repare no que a fórmula exige: os casos precisam ser igualmente prováveis. Ao lançar dois dados, os
resultados igualmente prováveis são os 36 pares ordenados, e não as onze somas possíveis, porque a
soma 7 acontece de vários modos e a soma 2 acontece de um só.

**Exemplo 1.** Lançando dois dados honestos, qual é a probabilidade de a soma dar 7?
O espaço amostral tem 36 pares. Somam 7 os pares 1 e 6, 2 e 5, 3 e 4, 4 e 3, 5 e 2, 6 e 1, ou seja,
6 casos. A probabilidade é 6/36, que simplifica para 1/6.

#### O evento complementar

O complementar de um evento é tudo aquilo que sobra no espaço amostral, e as duas probabilidades
somam 1:

P(A) + P(não A) = 1

onde não A é o evento que acontece exatamente quando A não acontece. Isso rende um atalho poderoso:
quando o enunciado pede **ao menos um**, contar direto exige separar muitos casos, enquanto o
complementar costuma ser um caso só.

**Exemplo 2.** Lançando três moedas honestas, qual é a probabilidade de sair ao menos uma cara?
O espaço amostral tem 8 resultados. O complementar de sair ao menos uma cara é não sair nenhuma
cara, que acontece de um único modo. Logo a probabilidade pedida é 1 - 1/8 = 7/8.

#### União de eventos

P(A ou B) = P(A) + P(B) - P(A e B)

onde P(A e B) é a probabilidade de os dois acontecerem juntos. A subtração existe porque os casos
comuns foram contados duas vezes. Quando os eventos não podem acontecer juntos, essa parcela vale
zero e a probabilidade da união é a soma simples.

**Exemplo 3.** De um baralho de 52 cartas retira-se uma. Qual é a probabilidade de ela ser um rei ou
ser de copas?
São 4 reis e 13 cartas de copas, e o rei de copas está nos dois grupos. A conta é
4/52 + 13/52 - 1/52 = 16/52, ou seja, 4/13.

#### Eventos sucessivos e probabilidade condicional

Quando um experimento acontece em etapas, as probabilidades se multiplicam, e a probabilidade da
segunda etapa precisa levar em conta o que já aconteceu na primeira:

P(A e B) = P(A) · P(B | A)

onde P(B | A) é a probabilidade de B sabendo que A já aconteceu. Essa probabilidade calculada sob
uma informação já conhecida chama-se **condicional**.

Saber que algo aconteceu reduz o espaço amostral: passa a valer apenas a parte compatível com a
informação dada.

**Exemplo 4.** Uma urna tem 5 bolas vermelhas e 3 azuis. Retiram-se duas bolas, uma após a outra,
sem reposição. Qual é a probabilidade de as duas serem vermelhas?
Na primeira retirada a chance é 5/8. Sabendo que saiu vermelha, restam 7 bolas, das quais 4 são
vermelhas, então a chance da segunda é 4/7. O produto dá 20/56, que simplifica para 5/14.

Se houvesse reposição, a segunda retirada voltaria a ser 5/8, porque a urna estaria igual ao
começo. Ler com atenção se há ou não reposição decide o problema inteiro.

#### Erros comuns

**Usar casos que não são igualmente prováveis.** Com dois dados, tratar as somas como igualmente
prováveis leva a resultados errados.

**Somar probabilidades de eventos que podem acontecer juntos.** Sem descontar a interseção, o
resultado fica maior do que deveria e às vezes passa de 1.

**Esquecer que a urna mudou.** Sem reposição, a segunda retirada tem um elemento a menos no total, e
o elemento retirado sai da contagem favorável quando for o caso.

**Contar direto o ao menos um.** Quase sempre o caminho curto é 1 menos a probabilidade de nenhum.

### Exercícios

**Bloco A. Fundamentos**

1. Um dado honesto é lançado. Qual é a probabilidade de sair um número par?
2. Um dado honesto é lançado. Qual é a probabilidade de sair um número maior que 4?
3. Uma urna tem 5 bolas vermelhas e 3 azuis. Retirando uma bola ao acaso, qual é a probabilidade de
   ela ser vermelha?
4. Duas moedas honestas são lançadas. Qual é a probabilidade de saírem duas caras?
5. De um baralho de 52 cartas retira-se uma ao acaso. Qual é a probabilidade de ela ser um rei?

**Bloco B. Consolidação**

6. Dois dados honestos são lançados. Qual é a probabilidade de a soma dar 7?
7. Dois dados honestos são lançados. Qual é a probabilidade de a soma ser maior que 9?
8. Três moedas honestas são lançadas. Qual é a probabilidade de sair ao menos uma cara?
9. Numa turma de 30 alunos, 18 jogam vôlei, 15 jogam basquete e 8 jogam os dois esportes. Escolhendo
   um aluno ao acaso, qual é a probabilidade de ele jogar vôlei ou basquete?
10. De um baralho de 52 cartas retira-se uma ao acaso. Qual é a probabilidade de ela ser um rei ou
    ser de copas?
11. Uma urna tem 5 bolas vermelhas e 3 azuis. Retiram-se duas bolas, uma após a outra, sem
    reposição. Qual é a probabilidade de as duas serem vermelhas?
12. Uma caixa tem 4 peças boas e 2 defeituosas. Retiram-se 2 peças ao acaso, de uma só vez. Qual é a
    probabilidade de exatamente uma delas ser defeituosa?
13. Sorteia-se ao acaso um número inteiro de 1 a 20. Qual é a probabilidade de ele ser múltiplo
    de 3?

**Bloco C. Aprofundamento**

14. Uma urna tem 5 bolas vermelhas e 3 azuis. Retiram-se duas bolas, uma após a outra, sem
    reposição. Qual é a probabilidade de ao menos uma delas ser azul?
15. Numa turma de 40 alunos, 24 são meninas e, entre as meninas, 15 usam óculos. Escolhe-se um aluno
    ao acaso e sabe-se que é menina. Qual é a probabilidade de ela usar óculos?
16. Numa família com 3 filhos, supondo que menino e menina sejam igualmente prováveis em cada
    nascimento, qual é a probabilidade de haver ao menos duas meninas?
17. Dois dados honestos são lançados e a soma obtida é 8. Sabendo disso, qual é a probabilidade de
    os dois dados terem mostrado o mesmo número?
18. Escolhe-se ao acaso um dos anagramas da palavra BANANA. Qual é a probabilidade de ele começar e
    terminar com a letra A?

### Gabarito

1. P = 1/2.
2. P = 1/3. São 2 casos favoráveis entre 6.
3. P = 5/8.
4. P = 1/4.
5. P = 1/13.
6. P = 1/6. São 6 pares favoráveis entre 36.
7. P = 1/6. As somas 10, 11 e 12 acontecem em 3, 2 e 1 casos, num total de 6 entre 36.
8. P = 7/8. O complementar é não sair nenhuma cara, que tem probabilidade 1/8.
9. P = 5/6. Praticam ao menos um dos esportes 25 alunos, porque 18 + 15 - 8 = 25.
10. P = 4/13. A conta é 4/52 + 13/52 - 1/52.
11. P = 5/14. O produto é 5/8 × 4/7.
12. P = 8/15. São 8 pares favoráveis entre os 15 pares possíveis.
13. P = 3/10. Os múltiplos de 3 no intervalo são 6.
14. P = 9/14. Pelo complementar, 1 menos a probabilidade de as duas serem vermelhas, que é 5/14.
15. P = 5/8. O espaço amostral passa a ser o das 24 meninas, das quais 15 usam óculos.
16. P = 1/2. São 8 sequências possíveis, e as favoráveis são as 3 com exatamente duas meninas mais
    1 com três meninas.
17. P = 1/5. A soma 8 acontece em 5 casos, e apenas 1 deles tem os dois dados iguais.
18. P = 1/5. Os anagramas de BANANA são 60, e os que começam e terminam com A são 12.

## EN

### Explanation

#### What probability is

Probability measures the chance of an event happening, in an experiment whose result is not known
beforehand. The set of all possible results is called the **sample space**, and an **event** is any
part of that set.

When every result in the sample space has the same chance, and only in that case, the best known
formula applies:

P(A) = favourable cases / possible cases

where P(A) is the probability of the event A.

The result is always a number between 0 and 1: 0 ≤ P(A) ≤ 1. It is 0 for an impossible event and 1
for a certain event. A negative probability or one greater than 1 is a sign of an arithmetic slip,
and checking that costs a few seconds.

Notice what the formula demands: the cases must be equally likely. When you roll two dice, the
equally likely results are the 36 ordered pairs, not the eleven possible sums, because a sum of 7
happens in several ways while a sum of 2 happens in only one.

**Example 1.** Rolling two fair dice, what is the probability that the sum is 7?
The sample space has 36 pairs. The pairs adding to 7 are 1 and 6, 2 and 5, 3 and 4, 4 and 3, 5 and
2, 6 and 1, that is, 6 cases. The probability is 6/36, which simplifies to 1/6.

#### The complementary event

The complement of an event is everything left over in the sample space, and the two probabilities
add up to 1:

P(A) + P(not A) = 1

where not A is the event that happens exactly when A does not. That gives a powerful shortcut: when
the statement asks for **at least one**, counting directly means splitting into many cases, while
the complement is usually a single case.

**Example 2.** Tossing three fair coins, what is the probability of getting at least one head?
The sample space has 8 results. The complement of getting at least one head is getting no head at
all, which happens in a single way. So the probability asked for is 1 - 1/8 = 7/8.

#### Union of events

P(A or B) = P(A) + P(B) - P(A and B)

where P(A and B) is the probability that both happen together. The subtraction exists because the
shared cases were counted twice. When the events cannot happen together, that last part is zero and
the probability of the union is a plain sum.

**Example 3.** One card is drawn from a deck of 52 cards. What is the probability that it is a king
or a heart?
There are 4 kings and 13 hearts, and the king of hearts belongs to both groups. The calculation is
4/52 + 13/52 - 1/52 = 16/52, that is, 4/13.

#### Successive events and conditional probability

When an experiment happens in stages, the probabilities multiply, and the probability of the second
stage has to take into account what already happened in the first:

P(A and B) = P(A) · P(B | A)

where P(B | A) is the probability of B given that A has already happened. A probability worked out
under information already known is called **conditional**.

Knowing that something happened shrinks the sample space: only the part compatible with the given
information still counts.

**Example 4.** An urn holds 5 red balls and 3 blue ones. Two balls are drawn, one after the other,
without replacement. What is the probability that both are red?
On the first draw the chance is 5/8. Given that a red one came out, 7 balls are left, 4 of them red,
so the chance on the second draw is 4/7. The product gives 20/56, which simplifies to 5/14.

If there were replacement, the second draw would again be 5/8, because the urn would be just as
it started. Reading carefully whether there is replacement decides the whole problem.

#### Common mistakes

**Using cases that are not equally likely.** With two dice, treating the sums as equally likely leads
to wrong results.

**Adding probabilities of events that can happen together.** Without removing the intersection, the
result comes out too large and sometimes passes 1.

**Forgetting that the urn changed.** Without replacement, the second draw has one element fewer in
the total, and the ball taken out leaves the favourable count when that applies.

**Counting at least one directly.** The short route is almost always 1 minus the probability of none.

### Exercises

**Block A. Fundamentals**

1. A fair die is rolled. What is the probability of getting an even number?
2. A fair die is rolled. What is the probability of getting a number greater than 4?
3. An urn holds 5 red balls and 3 blue ones. Drawing one ball at random, what is the probability
   that it is red?
4. Two fair coins are tossed. What is the probability of getting two heads?
5. One card is drawn at random from a deck of 52 cards. What is the probability that it is a king?

**Block B. Building up**

6. Two fair dice are rolled. What is the probability that the sum is 7?
7. Two fair dice are rolled. What is the probability that the sum is greater than 9?
8. Three fair coins are tossed. What is the probability of getting at least one head?
9. In a class of 30 students, 18 play volleyball, 15 play basketball and 8 play both sports.
   Choosing a student at random, what is the probability that this student plays volleyball or
   basketball?
10. One card is drawn at random from a deck of 52 cards. What is the probability that it is a king
    or a heart?
11. An urn holds 5 red balls and 3 blue ones. Two balls are drawn, one after the other, without
    replacement. What is the probability that both are red?
12. A box holds 4 good parts and 2 faulty ones. Then 2 parts are drawn at random, both at once.
    What is the probability that exactly one of them is faulty?
13. A whole number from 1 to 20 is drawn at random. What is the probability that it is a multiple
    of 3?

**Block C. Going further**

14. An urn holds 5 red balls and 3 blue ones. Two balls are drawn, one after the other, without
    replacement. What is the probability that at least one of them is blue?
15. In a class of 40 students, 24 are girls and, among the girls, 15 wear glasses. A student is
    chosen at random and is known to be a girl. What is the probability that she wears glasses?
16. In a family with 3 children, assuming a boy and a girl are equally likely at each birth, what is
    the probability that there are at least two girls?
17. Two fair dice are rolled and the sum obtained is 8. Given that, what is the probability that the
    two dice showed the same number?
18. One of the arrangements of the letters of the word BANANA is chosen at random. What is the
    probability that it starts and ends with the letter A?

### Answer key

1. P = 1/2.
2. P = 1/3. There are 2 favourable cases out of 6.
3. P = 5/8.
4. P = 1/4.
5. P = 1/13.
6. P = 1/6. There are 6 favourable pairs out of 36.
7. P = 1/6. The sums 10, 11 and 12 happen in 3, 2 and 1 cases, making 6 out of 36.
8. P = 7/8. The complement is getting no head, which has probability 1/8.
9. P = 5/6. Students playing at least one of the sports number 25, because 18 + 15 - 8 = 25.
10. P = 4/13. The calculation is 4/52 + 13/52 - 1/52.
11. P = 5/14. The product is 5/8 × 4/7.
12. P = 8/15. There are 8 favourable pairs among the 15 possible pairs.
13. P = 3/10. The multiples of 3 in the range number 6.
14. P = 9/14. By the complement, it is 1 minus the probability that both are red, which is 5/14.
15. P = 5/8. The sample space becomes the 24 girls, of whom 15 wear glasses.
16. P = 1/2. There are 8 possible sequences, and the favourable ones are the 3 with exactly two
    girls plus 1 with three girls.
17. P = 1/5. The sum 8 happens in 5 cases, and only 1 of them has the two dice equal.
18. P = 1/5. The arrangements of BANANA number 60, and those starting and ending with A number 12.

## VERIFICACAO

```python
X1: Rational(6,36) == Rational(1,6)
X2: 1 - Rational(1,8) == Rational(7,8)
X3: Rational(4,52) + Rational(13,52) - Rational(1,52) == Rational(4,13)
X4: Rational(5,8)*Rational(4,7) == Rational(5,14)
E1: Rational(3,6) == Rational(1,2)
E2: Rational(2,6) == Rational(1,3)
E3: Rational(5,5+3) == Rational(5,8)
E4: Rational(1,2)*Rational(1,2) == Rational(1,4)
E5: Rational(4,52) == Rational(1,13)
E6: Rational(len([(u,v) for u in range(1,7) for v in range(1,7) if u+v == 7]), 36) == Rational(1,6)
E7: Rational(3+2+1, 36) == Rational(1,6)
E8: 1 - Rational(1,8) == Rational(7,8)
E9: Rational(18+15-8, 30) == Rational(5,6)
E10: Rational(4,52) + Rational(13,52) - Rational(1,52) == Rational(4,13)
E11: Rational(5,8)*Rational(4,7) == Rational(5,14)
E12: Rational(binomial(2,1)*binomial(4,1), binomial(6,2)) == Rational(8,15)
E13: Rational(len([u for u in range(1,21) if u % 3 == 0]), 20) == Rational(3,10)
E14: 1 - Rational(5,14) == Rational(9,14)
E15: Rational(15,24) == Rational(5,8)
E16: Rational(3+1, 8) == Rational(1,2)
E17: Rational(len([(u,v) for u in range(1,7) for v in range(1,7) if u+v == 8 and u == v]), len([(u,v) for u in range(1,7) for v in range(1,7) if u+v == 8])) == Rational(1,5)
E18: factorial(6)/(factorial(3)*factorial(2)) == 60 and factorial(4)/factorial(2) == 12 and Rational(12,60) == Rational(1,5)
```
