---
id: MATEM2-14
serie: em2
unidade: estatistica
titulo_pt: Distribuições e dispersão
titulo_en: Distributions and dispersion
resumo_pt: Resumir um conjunto de dados por média, mediana e moda, e medir o quanto os valores se espalham com amplitude, variância e desvio padrão.
resumo_en: Summarising a data set with mean, median and mode, and measuring how far the values spread out using range, variance and standard deviation.
prerequisitos: []
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### Um número não conta a história toda

Duas turmas com a mesma média de notas podem ser muito diferentes. Numa delas quase todo mundo tirou
perto da média; na outra há quem tenha ido muito bem e quem tenha ido muito mal. A média não
distingue os dois casos, e é por isso que a estatística trabalha com dois tipos de medida: as de
**tendência central**, que dizem em torno de que valor os dados se organizam, e as de **dispersão**,
que dizem o quanto eles se afastam desse centro.

#### Medidas de tendência central

A **média aritmética** é a soma dos valores dividida pela quantidade de valores. Ela usa todos os
dados, o que é uma virtude, e por isso mesmo é sensível a valores extremos.

A **mediana** é o valor que fica no meio quando os dados são colocados em ordem. Com uma quantidade
par de dados, é a média dos dois centrais. Ela ignora o tamanho dos extremos e olha só a posição,
por isso resiste bem a um valor muito fora da faixa.

A **moda** é o valor que mais se repete. Um conjunto pode ter mais de uma moda, ou não ter moda
alguma.

**Exemplo 1.** Calcular média, mediana e moda de 2, 4, 4, 5, 6, 6, 6 e 7.
A soma dá 40 e são 8 valores, então a média é 5. Em ordem, os dois valores centrais são 5 e 6, e a
mediana é 5,5. O valor que mais se repete é o 6, que aparece três vezes, então a moda é 6.

#### Distribuição de frequências

Quando muitos dados se repetem, a lista vira tabela: cada valor com a quantidade de vezes em que
aparece, chamada de frequência. A média sai multiplicando cada valor pela sua frequência, somando
tudo e dividindo pela soma das frequências. É a mesma conta da média ponderada, com as frequências
no papel dos pesos.

**Exemplo 2.** Numa prova, a nota 5 apareceu 2 vezes, a nota 6 apareceu 3 vezes, a nota 7 apareceu 4
vezes e a nota 8 apareceu uma vez. Calcular a média.
A soma dos produtos é 10 mais 18 mais 28 mais 8, o que dá 64. Foram 10 alunos, então a média é 6,4.

#### Medidas de dispersão

A **amplitude** é a diferença entre o maior e o menor valor. É rápida de calcular e usa apenas dois
dados, o que a torna frágil.

A ideia mais fina é olhar o quanto cada valor se afasta da média. Somar os desvios não funciona:
essa soma dá sempre zero, porque os afastamentos para cima cancelam os afastamentos para baixo. Por
isso se elevam os desvios ao quadrado antes de somar.

A **variância** é a média dos quadrados dos desvios em relação à média. O **desvio padrão** é a raiz
quadrada da variância, e tem a vantagem de voltar à unidade original dos dados.

**Exemplo 3.** Calcular a variância e o desvio padrão de 2, 4, 5, 6 e 8.
A média é 5. Os desvios são menos 3, menos 1, 0, 1 e 3, e seus quadrados são 9, 1, 0, 1 e 9, que
somam 20. A variância é 20 dividido por 5, ou seja, 4, e o desvio padrão é 2.

#### Mesma média, dispersões diferentes

É aqui que a dispersão mostra serventia.

**Exemplo 4.** Comparar os conjuntos 2, 4, 5, 6 e 8 com 3, 4, 5, 6 e 7.
Os dois têm média 5. No primeiro, a soma dos quadrados dos desvios é 20 e a variância é 4. No
segundo, essa soma é 10 e a variância é 2. Os dois conjuntos se organizam em torno do mesmo centro,
mas o primeiro se espalha mais, e é isso que a variância mede.

Uma consequência útil: somar uma constante a todos os valores desloca a média por essa constante e
não muda a dispersão, porque a distância de cada valor ao centro continua a mesma.

#### Erros comuns

**Calcular a mediana sem ordenar.** A mediana é uma medida de posição, e sem ordenar a posição não
significa nada.

**Somar os desvios sem elevar ao quadrado.** O resultado é sempre zero, para qualquer conjunto.

**Dividir pelo número errado.** Na variância aqui adotada, divide-se pela quantidade de valores do
conjunto.

**Confiar só na média diante de um valor extremo.** Um salário muito alto puxa a média para cima
sem alterar a mediana, e nesse caso a mediana representa melhor o grupo.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule a média dos valores 4, 7, 8, 10 e 11.
2. Determine a mediana dos valores 3, 7, 2, 9 e 5.
3. Determine a moda dos valores 2, 3, 3, 5, 7 e 3.
4. Calcule a amplitude do conjunto formado por 12, 5, 20, 8 e 15.
5. Determine a mediana dos valores 4, 6, 9 e 11.

**Bloco B. Consolidação**

6. Calcule a média, a mediana e a moda dos valores 2, 4, 4, 5, 6, 6, 6 e 7.
7. Calcule a variância e o desvio padrão do conjunto formado por 2, 4, 5, 6 e 8.
8. Calcule a variância do conjunto formado por 3, 4, 5, 6 e 7.
9. Numa prova, a nota 5 apareceu 2 vezes, a nota 6 apareceu 3 vezes, a nota 7 apareceu 4 vezes e a
   nota 8 apareceu uma vez. Calcule a média da turma.
10. Um aluno tirou 6 na primeira avaliação, 7 na segunda e 8 na terceira, com pesos 2, 3 e 5. Calcule
    a média ponderada.
11. A média de 5 números é 12. Um sexto número, igual a 18, é acrescentado ao conjunto. Calcule a
    nova média.
12. Num grupo de 10 pessoas a média das idades é 30 anos. Uma pessoa de 39 anos sai do grupo.
    Calcule a média das idades das que ficaram.
13. Calcule a média e a variância do conjunto formado por 4, 8, 12, 16 e 20.

**Bloco C. Aprofundamento**

14. Dois conjuntos têm a mesma média: o primeiro é formado por 2, 4, 5, 6 e 8, e o segundo por 3, 4,
    5, 6 e 7. Calcule a variância de cada um e diga qual deles é mais disperso, justificando.
15. A média de 6 notas é 7. Retirando do conjunto a menor delas, que vale 2, calcule a média das
    notas restantes.
16. Um conjunto de 4 valores tem média 10, e três desses valores são 6, 9 e 12. Determine o quarto
    valor.
17. Os salários mensais de cinco funcionários de uma pequena empresa são 2000, 2200, 2400, 2600 e
    15000 reais. Calcule a média e a mediana e explique qual das duas representa melhor o que ganha
    um funcionário típico dessa empresa.
18. Mostre que somar 3 a todos os valores de um conjunto aumenta a média em 3 e deixa a variância
    inalterada. Ilustre o argumento com o conjunto formado por 2, 4, 5, 6 e 8, apresentando a nova
    média e a nova variância.

### Gabarito

1. 8.
2. 5. Em ordem, os valores são 2, 3, 5, 7 e 9.
3. 3.
4. 15.
5. 7,5. Os valores centrais são 6 e 9.
6. Média 5, mediana 5,5 e moda 6.
7. Variância 4 e desvio padrão 2. A soma dos quadrados dos desvios é 20.
8. 2. A soma dos quadrados dos desvios é 10.
9. 6,4. A soma dos produtos é 64 e a turma tem 10 alunos.
10. 7,3. A soma dos produtos é 73 e a soma dos pesos é 10.
11. 13. A soma dos cinco primeiros valores é 60.
12. 29. A soma das idades era 300 e passa a ser 261, com 9 pessoas.
13. Média 12 e variância 32.
14. O primeiro conjunto tem variância 4 e o segundo tem variância 2, então o primeiro é mais
    disperso. As médias são iguais, e o que difere é o afastamento dos valores em relação a esse
    centro comum.
15. 8. A soma das seis notas é 42, e tirando a menor sobram 40 pontos distribuídos em 5 notas.
16. 13. A soma dos quatro valores precisa ser 40.
17. A média é 4840 e a mediana é 2400. A mediana representa melhor o funcionário típico, porque a
    média é puxada para cima pelo salário de 15000, muito distante dos demais.
18. A nova média é 8 e a nova variância continua 4. Somando a mesma constante a todos os valores,
    cada valor e a média sobem juntos, então cada desvio em relação à média permanece igual ao de
    antes, e a variância, que só depende desses desvios, não muda.

## EN

### Explanation

#### One number does not tell the whole story

Two classes with the same average mark can be very different. In one of them almost everybody scored
close to the average; in the other some did very well and some did very badly. The average does not
tell those two cases apart, and that is why statistics works with two kinds of measure: those of
**central tendency**, which say around what value the data organise themselves, and those of
**dispersion**, which say how far they move away from that centre.

#### Measures of central tendency

The **mean** is the sum of the values divided by how many values there are. It uses every piece of
data, which is a virtue, and for that very reason it is sensitive to extreme values.

The **median** is the value sitting in the middle once the data are put in order. With an even number
of values, it is the mean of the two central ones. It ignores how big the extremes are and looks
only at position, so it stands up well to a value far outside the range.

The **mode** is the value that repeats most often. A set may have more than one mode, or none at all.

**Example 1.** Find the mean, the median and the mode of 2, 4, 4, 5, 6, 6, 6 and 7.
The sum is 40 and there are 8 values, so the mean is 5. In order, the two central values are 5 and
6, so the median is 5.5. The value repeating most often is 6, which appears three times, so the mode
is 6.

#### Frequency distribution

When many data repeat, the list becomes a table: each value with the number of times it appears,
called its frequency. The mean comes from multiplying each value by its frequency, adding everything
up and dividing by the sum of the frequencies. It is the same calculation as a weighted mean, with
the frequencies playing the part of the weights.

**Example 2.** In a test, the mark 5 appeared 2 times, the mark 6 appeared 3 times, the mark 7
appeared 4 times and the mark 8 appeared once. Find the mean.
The sum of the products is 10 plus 18 plus 28 plus 8, which gives 64. There were 10 students, so the
mean is 6.4.

#### Measures of dispersion

The **range** is the difference between the largest and the smallest value. It is quick to work out
and uses only two pieces of data, which makes it fragile.

The finer idea is to look at how far each value sits from the mean. Adding the deviations does not
work: that sum is always zero, because the departures above cancel the departures below. So the
deviations are squared before being added.

The **variance** is the mean of the squared deviations from the mean. The **standard deviation** is
the square root of the variance, and it has the advantage of returning to the original unit of the
data.

**Example 3.** Find the variance and the standard deviation of 2, 4, 5, 6 and 8.
The mean is 5. The deviations are minus 3, minus 1, 0, 1 and 3, and their squares are 9, 1, 0, 1
and 9, adding to 20. The variance is 20 divided by 5, that is, 4, and the standard deviation is 2.

#### Same mean, different dispersions

This is where dispersion earns its keep.

**Example 4.** Compare the sets 2, 4, 5, 6 and 8 with 3, 4, 5, 6 and 7.
Both have mean 5. In the first, the sum of the squared deviations is 20 and the variance is 4. In
the second, that sum is 10 and the variance is 2. The two sets organise themselves around the same
centre, but the first spreads out more, and that is what the variance measures.

One useful consequence: adding a constant to every value shifts the mean by that constant and does
not change the dispersion, because the distance from each value to the centre stays the same.

#### Common mistakes

**Finding the median without ordering.** The median is a measure of position, and without ordering
the position means nothing.

**Adding the deviations without squaring them.** The result is always zero, for any set.

**Dividing by the wrong number.** In the variance adopted here, you divide by how many values the
set has.

**Trusting the mean alone when there is an extreme value.** A very high salary pulls the mean up
without moving the median, and in that case the median represents the group better.

### Exercises

**Block A. Fundamentals**

1. Find the mean of the values 4, 7, 8, 10 and 11.
2. Find the median of the values 3, 7, 2, 9 and 5.
3. Find the mode of the values 2, 3, 3, 5, 7 and 3.
4. Find the range of the set made of 12, 5, 20, 8 and 15.
5. Find the median of the values 4, 6, 9 and 11.

**Block B. Building up**

6. Find the mean, the median and the mode of the values 2, 4, 4, 5, 6, 6, 6 and 7.
7. Find the variance and the standard deviation of the set made of 2, 4, 5, 6 and 8.
8. Find the variance of the set made of 3, 4, 5, 6 and 7.
9. In a test, the mark 5 appeared 2 times, the mark 6 appeared 3 times, the mark 7 appeared 4 times
   and the mark 8 appeared once. Find the mean mark of the class.
10. A student scored 6 on the first assessment, 7 on the second and 8 on the third, with weights 2,
    3 and 5. Find the weighted mean.
11. The mean of 5 numbers is 12. A sixth number, equal to 18, is added to the set. Find the new mean.
12. In a group of 10 people the mean age is 30 years. One person aged 39 leaves the group. Find the
    mean age of those who stayed.
13. Find the mean and the variance of the set made of 4, 8, 12, 16 and 20.

**Block C. Going further**

14. Two sets have the same mean: the first is made of 2, 4, 5, 6 and 8, and the second of 3, 4, 5, 6
    and 7. Find the variance of each one and say which is more dispersed, justifying your answer.
15. The mean of 6 marks is 7. Removing the lowest of them, which is 2, find the mean of the
    remaining marks.
16. A set of 4 values has mean 10, and three of those values are 6, 9 and 12. Find the fourth value.
17. The monthly salaries of five employees of a small company are 2000, 2200, 2400, 2600 and 15000
    reais. Find the mean and the median and explain which of the two better represents what a
    typical employee of this company earns.
18. Show that adding 3 to every value of a set raises the mean by 3 and leaves the variance
    unchanged. Illustrate the argument with the set made of 2, 4, 5, 6 and 8, giving the new mean
    and the new variance.

### Answer key

1. 8.
2. 5. In order, the values are 2, 3, 5, 7 and 9.
3. 3.
4. 15.
5. 7.5. The central values are 6 and 9.
6. Mean 5, median 5.5 and mode 6.
7. Variance 4 and standard deviation 2. The sum of the squared deviations is 20.
8. 2. The sum of the squared deviations is 10.
9. 6.4. The sum of the products is 64 and the class has 10 students.
10. 7.3. The sum of the products is 73 and the sum of the weights is 10.
11. 13. The sum of the first five values is 60.
12. 29. The sum of the ages was 300 and becomes 261, shared by 9 people.
13. Mean 12 and variance 32.
14. The first set has variance 4 and the second has variance 2, so the first is more dispersed. The
    means are equal, and what differs is how far the values sit from that common centre.
15. 8. The sum of the six marks is 42, and removing the lowest leaves 40 points shared by 5 marks.
16. 13. The sum of the four values has to be 40.
17. The mean is 4840 and the median is 2400. The median represents the typical employee better,
    because the mean is pulled up by the salary of 15000, far away from all the others.
18. The new mean is 8 and the new variance is still 4. Adding the same constant to every value moves
    each value and the mean together, so each deviation from the mean stays exactly as it was, and
    the variance, which depends only on those deviations, does not change.

## VERIFICACAO

```python
X1: Rational(2+4+4+5+6+6+6+7, 8) == 5 and Rational(5+6, 2) == Rational(11,2) and len([u for u in [2,4,4,5,6,6,6,7] if u == 6]) == 3
X2: Rational(5*2 + 6*3 + 7*4 + 8*1, 10) == Rational(64,10)
X3: Rational(sum([(u-5)**2 for u in [2,4,5,6,8]]), 5) == 4 and sqrt(4) == 2
X4: Rational(sum([(u-5)**2 for u in [2,4,5,6,8]]), 5) == 4 and Rational(sum([(u-5)**2 for u in [3,4,5,6,7]]), 5) == 2
E1: Rational(4+7+8+10+11, 5) == 8
E2: sorted([3,7,2,9,5])[2] == 5
E3: len([u for u in [2,3,3,5,7,3] if u == 3]) == 3 and all(len([w for w in [2,3,3,5,7,3] if w == u]) <= 3 for u in [2,3,5,7])
E4: max([12,5,20,8,15]) - min([12,5,20,8,15]) == 15
E5: Rational(6+9, 2) == Rational(15,2)
E6: Rational(2+4+4+5+6+6+6+7, 8) == 5 and Rational(5+6, 2) == Rational(11,2) and len([u for u in [2,4,4,5,6,6,6,7] if u == 6]) == 3
E7: Rational(sum([(u-5)**2 for u in [2,4,5,6,8]]), 5) == 4 and sqrt(4) == 2 and sum([(u-5)**2 for u in [2,4,5,6,8]]) == 20
E8: Rational(sum([(u-5)**2 for u in [3,4,5,6,7]]), 5) == 2 and sum([(u-5)**2 for u in [3,4,5,6,7]]) == 10
E9: Rational(5*2 + 6*3 + 7*4 + 8*1, 10) == Rational(64,10)
E10: Rational(6*2 + 7*3 + 8*5, 10) == Rational(73,10)
E11: Rational(5*12 + 18, 6) == 13
E12: Rational(10*30 - 39, 9) == 29
E13: Rational(4+8+12+16+20, 5) == 12 and Rational(sum([(u-12)**2 for u in [4,8,12,16,20]]), 5) == 32
E14: Rational(sum([(u-5)**2 for u in [2,4,5,6,8]]), 5) == 4 and Rational(sum([(u-5)**2 for u in [3,4,5,6,7]]), 5) == 2 and 4 > 2
E15: Rational(6*7 - 2, 5) == 8
E16: solve(Eq(6 + 9 + 12 + x, 4*10), x) == [13]
E17: Rational(2000+2200+2400+2600+15000, 5) == 4840 and sorted([2000,2200,2400,2600,15000])[2] == 2400
E18: Rational(sum([u+3 for u in [2,4,5,6,8]]), 5) == 8 and Rational(sum([(u+3-8)**2 for u in [2,4,5,6,8]]), 5) == 4
```
