---
id: MATEM1-13
serie: em1
unidade: estatistica
titulo_pt: Estatística descritiva
titulo_en: Descriptive statistics
resumo_pt: Organizar dados numa tabela, resumir com média, mediana e moda, e medir o espalhamento com amplitude e desvio padrão.
resumo_en: Organising data in a table, summarising it with mean, median and mode, and measuring spread with range and standard deviation.
prerequisitos: []
duracao_min: 90
dificuldade: 3
---

## PT

### Explicação

#### Para que serve resumir dados

Uma lista com as notas de trinta alunos não diz nada quando se olha para ela de uma vez. A
estatística descritiva existe para transformar essa lista em duas ou três informações que cabem numa
frase: onde o conjunto se concentra e o quanto ele se espalha. Quem só calcula a média perde metade
da história, porque dois grupos podem ter exatamente a mesma média e realidades completamente
diferentes.

#### População, amostra e variável

**População** é o conjunto inteiro que se quer estudar: todos os alunos do colégio, todas as
lâmpadas produzidas numa fábrica. **Amostra** é uma parte da população, escolhida para representá-la
quando medir tudo é caro ou impossível. Uma conclusão tirada de uma amostra mal escolhida não vale
para a população.

**Variável** é a característica observada em cada elemento. Ela pode ser:

- **Qualitativa**, quando o resultado é uma categoria: cor dos olhos, time de futebol, sexo.
- **Quantitativa discreta**, quando o resultado é um número que vem de contagem e só assume valores
  isolados: número de irmãos, quantidade de acertos numa prova.
- **Quantitativa contínua**, quando o resultado vem de medida e pode assumir qualquer valor de um
  intervalo: altura, massa, tempo.

Confundir os tipos leva a erro grosseiro: calcular a média da cor dos olhos não significa nada.

#### Tabela de frequências

A tabela de frequências conta quantas vezes cada valor aparece. A **frequência absoluta** é a
contagem pura, e a **frequência relativa** é essa contagem dividida pelo total, quase sempre escrita
em porcentagem:

f_{r} = f_{a} / N

onde f_{r} é a frequência relativa, f_{a} a frequência absoluta e N o total de observações.

**Exemplo 1.** Numa turma de 20 alunos perguntou-se quantos irmãos cada um tem. Cinco responderam
que não têm irmãos, oito responderam um, quatro responderam dois e três responderam três.

A tabela fica assim: o valor 0 tem frequência 5, o valor 1 tem frequência 8, o valor 2 tem
frequência 4 e o valor 3 tem frequência 3. As frequências somam 20, o que confirma que ninguém ficou
de fora.

As frequências relativas são 5 / 20, que dá 25%; 8 / 20, que dá 40%; 4 / 20, que dá 20%; e
3 / 20, que dá 15%. As porcentagens somam 100%, e essa soma é a primeira conferência a fazer.

#### As três medidas de centro

A **média aritmética** é a soma dos valores dividida pela quantidade deles:

M = S / n

onde M é a média, S a soma de todos os valores e n a quantidade de valores. É a medida que usa todos
os dados, e por isso é a mais sensível a valores extremos.

A **mediana** é o valor que fica no meio depois de ordenar os dados. Com quantidade ímpar de valores
ela é o valor central; com quantidade par, é a média dos dois centrais:

Md = (c_{1} + c_{2}) / 2

onde Md é a mediana e c_{1} e c_{2} são os dois valores centrais. Ordenar antes é obrigatório, e é
aí que mais se erra.

A **moda** é o valor que mais se repete. Um conjunto pode ter uma moda, mais de uma, ou nenhuma.

**Exemplo 2.** Calcular as três medidas do conjunto 3, 5, 7, 7, 8, 9, 10.
A soma é S = 49 e há n = 7 valores, então M = 49 / 7 = 7. O conjunto já está ordenado, e com 7
valores o central é o quarto, que vale 7. O único valor repetido é o 7, que é a moda.

Nesse conjunto as três medidas coincidem, o que acontece quando os dados são bem distribuídos em
torno do centro.

**Exemplo 3.** Calcular a média, a mediana e a moda a partir da tabela do exemplo anterior, com 5
alunos sem irmãos, 8 com um irmão, 4 com dois e 3 com três.
Para a média, multiplica-se cada valor pela sua frequência e divide-se pelo total:
0 × 5 + 1 × 8 + 2 × 4 + 3 × 3 = 25, e M = 25 / 20 = 1,25.
Para a mediana, com 20 valores os centrais são o décimo e o décimo primeiro. Os cinco primeiros
valem 0 e do sexto ao décimo terceiro valem 1, então os dois centrais valem 1, e a mediana é 1.
A moda é 1, que é o valor de maior frequência.

Repare que a média deu 1,25 irmão, um número que nenhum aluno individualmente tem. Isso é normal e
não é erro: a média é um resumo, não um retrato de alguém.

#### Média ponderada

Quando os valores têm importâncias diferentes, cada um entra com um **peso**. A média ponderada é a
soma de cada valor multiplicado pelo seu peso, dividida pela soma dos pesos:

M_{p} = (v_{1} · p_{1} + v_{2} · p_{2} + v_{3} · p_{3}) / (p_{1} + p_{2} + p_{3})

onde M_{p} é a média ponderada, v_{1}, v_{2} e v_{3} são os valores e p_{1}, p_{2} e p_{3} os pesos
correspondentes.

**Exemplo 4.** A nota final de um curso vem de três avaliações: 6 com peso 2, 7 com peso 3 e 9 com
peso 5.
O numerador é 12 + 21 + 45 = 78. A soma dos pesos é 10. Então M_{p} = 78 / 10 = 7,8.

Repare que a média simples das três notas daria um valor menor, porque a nota alta é justamente a de
maior peso. Dividir pela quantidade de notas em vez de dividir pela soma dos pesos é o erro clássico
aqui.

#### Quando a média engana

**Exemplo 5.** Uma empresa tem cinco funcionários, com salários mensais de 1500, 2000, 2000, 2500 e
22000 reais.
A soma é S = 30000, então M = 6000 reais. Ordenando, o valor central é 2000, e essa é a mediana.

Quatro dos cinco funcionários ganham menos do que a média. Dizer que o salário médio da empresa é
6000 reais é verdade aritmética e mentira descritiva. A mediana de 2000 reais descreve muito melhor
o que uma pessoa dali costuma ganhar. Sempre que houver um valor muito distante dos outros, a
mediana é a medida mais honesta.

#### Medidas de dispersão

Saber o centro não basta. As medidas de dispersão contam o quanto os dados se afastam dele.

A **amplitude** é a diferença entre o maior e o menor valor:

A = x_{máx} - x_{mín}

onde A é a amplitude, x_{máx} o maior valor do conjunto e x_{mín} o menor. É rápida de calcular e
depende apenas de dois dados, o que a torna frágil.

A **variância** é a média dos quadrados dos desvios em relação à média:

V = Σ(x - M)^{2} / n

onde V é a variância, x cada valor do conjunto, M a média, n a quantidade de valores e Σ a soma
sobre todos os valores. Eleva-se ao quadrado para que desvios para cima e para baixo não se
cancelem.

O **desvio padrão** é a raiz quadrada da variância:

DP = √V

onde DP é o desvio padrão e V a variância. Ele volta para a unidade original dos dados, e por isso é
o que se usa para comunicar o resultado.

**Exemplo 6.** Calcular a média, a variância e o desvio padrão do conjunto 2, 4, 4, 4, 5, 5, 7, 9.
A soma é S = 40 e há n = 8 valores, então M = 5.
Os desvios x - 5 são -3, -1, -1, -1, 0, 0, 2 e 4. Elevando ao quadrado, (x - 5)^{2} dá
9, 1, 1, 1, 0, 0, 4 e 16, que somam 32.
Então V = 32 / 8 = 4 e DP = √4 = 2.

Um desvio padrão de 2 num conjunto de média 5 indica que os valores costumam ficar a cerca de duas
unidades do centro.

#### Lendo um gráfico com palavras

Um gráfico de barras compara categorias: cada barra tem altura igual à frequência da categoria.
Quando o eixo vertical não começa em zero, diferenças pequenas parecem enormes, e essa é a
manipulação visual mais comum. Um gráfico de setores mostra a parte de cada categoria no total, e só
faz sentido quando as categorias somam o todo. Um histograma agrupa valores em faixas, e a largura
das faixas muda a aparência da distribuição sem mudar dado nenhum.

Diante de qualquer gráfico, três perguntas resolvem quase tudo: onde os dados se concentram, o
quanto eles se espalham, e se existe algum valor muito afastado dos demais.

#### Erros comuns

**Calcular a mediana sem ordenar.** A mediana do conjunto na ordem em que foi escrito quase nunca é
a mediana verdadeira.

**Dividir pela quantidade de notas na média ponderada.** O divisor é a soma dos pesos.

**Achar que média maior significa grupo melhor.** Dois grupos de mesma média podem ter dispersões
muito diferentes, e o de menor desvio padrão é o mais previsível.

**Esquecer que a variância está na unidade ao quadrado.** Se os dados são reais, a variância está em
reais ao quadrado, e só o desvio padrão volta para reais.

**Tratar a moda como obrigatória.** Um conjunto em que nenhum valor se repete simplesmente não tem
moda.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule a média, a mediana e a moda do conjunto 3, 5, 7, 7, 8, 9, 10.
2. Calcule a média e a mediana do conjunto 4, 6, 8, 10.
3. Calcule a amplitude do conjunto 12, 15, 20, 9, 30.
4. A nota final de um curso é a média ponderada de três notas: 6 com peso 2, 7 com peso 3 e 9 com
   peso 5. Calcule a nota final.
5. Diga se cada variável é qualitativa ou quantitativa e, sendo quantitativa, se é discreta ou
   contínua: número de irmãos de um aluno, cor dos olhos, altura em metros, quantidade de acertos
   numa prova de 20 questões.

**Bloco B. Consolidação**

6. Numa turma de 20 alunos foi anotado o número de irmãos de cada um: 5 alunos não têm irmãos, 8 têm
   1 irmão, 4 têm 2 irmãos e 3 têm 3 irmãos. Calcule a média, a mediana e a moda.
7. Calcule a média, a variância e o desvio padrão do conjunto 2, 4, 4, 4, 5, 5, 7, 9.
8. Uma empresa tem cinco funcionários, com salários mensais de 1500, 2000, 2000, 2500 e 22000 reais.
   Calcule a média e a mediana, e diga qual das duas descreve melhor o salário típico.
9. Um aluno tirou 5, 7 e 6 nas três primeiras provas. Que nota ele precisa na quarta prova para que
   a média das quatro seja 7?
10. Numa turma de 30 alunos, a média das notas dos 12 meninos foi 6 e a média das notas das 18
    meninas foi 7. Qual foi a média da turma toda?
11. Calcule a mediana do conjunto 10, 3, 7, 12, 5, 8.
12. Os quatro valores 4, 8, x e 12 têm média 9. Determine x.
13. Calcule a variância e o desvio padrão do conjunto 10, 12, 14, 16, 18.

**Bloco C. Aprofundamento**

14. Dois conjuntos de cinco valores são 8, 9, 10, 11, 12 e 4, 7, 10, 13, 16. Calcule a média e o
    desvio padrão de cada um e explique o que a comparação mostra.
15. A média das notas de 25 alunos foi 6. Depois descobriu-se que a nota de um aluno tinha sido
    anotada como 4 quando o correto era 9. Qual é a média correta?
16. Um conjunto de 9 valores tem média 20 e mediana 20. O maior valor do conjunto aumenta em 90
    unidades e todos os outros ficam iguais. Calcule a nova média e diga o que acontece com a
    mediana.
17. Numa turma de 40 alunos a média foi 6,5. Os 10 alunos do grupo de estudo tiveram média 8. Qual
    foi a média dos outros 30 alunos?
18. Cinco números inteiros positivos têm média 6, mediana 6 e moda 4, sendo 4 o único valor que se
    repete. Determine os cinco números.

### Gabarito

1. Média 7, mediana 7 e moda 7.
2. Média 7 e mediana 7.
3. Amplitude 21, porque o maior valor é 30 e o menor é 9.
4. 7,8.
5. Número de irmãos: quantitativa discreta. Cor dos olhos: qualitativa. Altura em metros:
   quantitativa contínua. Quantidade de acertos: quantitativa discreta.
6. Média 1,25, mediana 1 e moda 1.
7. Média 5, variância 4 e desvio padrão 2.
8. Média 6000 reais e mediana 2000 reais. A mediana descreve melhor, porque um único salário muito
   alto puxa a média para longe do que a maioria recebe.
9. 10. A soma das quatro notas precisa ser 28 e as três primeiras somam 18.
10. 6,6.
11. 7,5. Em ordem o conjunto é 3, 5, 7, 8, 10, 12, e a mediana é a média entre 7 e 8.
12. x = 12.
13. Variância 8 e desvio padrão DP = √8 = 2·√2.
14. Os dois conjuntos têm média 10. O primeiro tem variância 2 e desvio padrão DP = √2. O segundo
    tem variância 18 e desvio padrão DP = 3·√2. A média sozinha não distingue os dois conjuntos, e o
    desvio padrão mostra que o segundo tem valores bem mais espalhados.
15. 6,2. A soma das notas passa de 150 para 155.
16. A nova média é 30, porque 90 / 9 = 10 de acréscimo. A mediana continua 20, porque o valor
    central não mudou.
17. 6. A soma de todas as notas é 260 e o grupo de estudo soma 80, restando 180 para 30 alunos.
18. Os números são 4, 4, 6, 7 e 9. A soma precisa ser 30, o valor central é 6 e o 4 precisa aparecer
    duas vezes sem que nenhum outro se repita.

## EN

### Explanation

#### Why we summarise data

A list with the scores of thirty students says nothing when you look at it all at once. Descriptive
statistics exists to turn that list into two or three pieces of information that fit in one
sentence: where the set clusters and how much it spreads. Anyone who only works out the mean loses
half the story, because two groups can have exactly the same mean and completely different
realities.

#### Population, sample and variable

The **population** is the whole collection you want to study: every student in the school, every
bulb produced in a factory. A **sample** is a part of the population, chosen to stand for it when
measuring everything is too expensive or impossible. A conclusion drawn from a badly chosen sample
does not hold for the population.

A **variable** is the characteristic observed in each element. It can be:

- **Qualitative**, when the outcome is a category: eye colour, football team, sex.
- **Quantitative discrete**, when the outcome is a number that comes from counting and only takes
  isolated values: number of siblings, number of correct answers on a test.
- **Quantitative continuous**, when the outcome comes from measuring and can take any value in an
  interval: height, mass, time.

Mixing up the types leads to a crude mistake: the mean of eye colour means nothing at all.

#### Frequency table

A frequency table counts how many times each value appears. The **absolute frequency** is the plain
count, and the **relative frequency** is that count divided by the total, almost always written as a
percentage:

f_{r} = f_{a} / N

where f_{r} is the relative frequency, f_{a} the absolute frequency and N the total number of
observations.

**Example 1.** In a class of 20 students each one was asked how many siblings they have. Five
answered that they have none, eight answered one, four answered two and three answered three.

The table looks like this: the value 0 has frequency 5, the value 1 has frequency 8, the value 2 has
frequency 4 and the value 3 has frequency 3. The frequencies add up to 20, which confirms that
nobody was left out.

The relative frequencies are 5 / 20, which gives 25%; 8 / 20, which gives 40%; 4 / 20, which gives
20%; and 3 / 20, which gives 15%. The percentages add up to 100%, and that sum is the first check to
make.

#### The three measures of centre

The **arithmetic mean** is the sum of the values divided by how many there are:

M = S / n

where M is the mean, S the sum of all the values and n how many values there are. It is the measure
that uses every piece of data, and for that reason it is the most sensitive to extreme values.

The **median** is the value that sits in the middle once the data is ordered. With an odd number of
values it is the central value; with an even number, it is the mean of the two central ones:

Md = (c_{1} + c_{2}) / 2

where Md is the median and c_{1} and c_{2} are the two central values. Ordering first is compulsory,
and that is where most mistakes happen.

The **mode** is the value that repeats most often. A set can have one mode, more than one, or none.

**Example 2.** Find the three measures of the set 3, 5, 7, 7, 8, 9, 10.
The sum is S = 49 and there are n = 7 values, so M = 49 / 7 = 7. The set is already ordered, and
with 7 values the central one is the fourth, which is 7. The only repeated value is 7, which is the
mode.

In this set the three measures coincide, which happens when the data is evenly spread around the
centre.

**Example 3.** Find the mean, the median and the mode from the table above, with 5 students with no
siblings, 8 with one sibling, 4 with two and 3 with three.
For the mean, multiply each value by its frequency and divide by the total:
0 × 5 + 1 × 8 + 2 × 4 + 3 × 3 = 25, and M = 25 / 20 = 1.25.
For the median, with 20 values the central ones are the tenth and the eleventh. The first five are
0 and from the sixth to the thirteenth they are 1, so both central values are 1, and the median is 1.
The mode is 1, the value with the highest frequency.

Notice that the mean came out as 1.25 siblings, a number that no individual student has. That is
normal and is not a mistake: the mean is a summary, not a portrait of anyone.

#### Weighted mean

When the values carry different importance, each one enters with a **weight**. The weighted mean is
the sum of each value multiplied by its weight, divided by the sum of the weights:

M_{w} = (v_{1} · p_{1} + v_{2} · p_{2} + v_{3} · p_{3}) / (p_{1} + p_{2} + p_{3})

where M_{w} is the weighted mean, v_{1}, v_{2} and v_{3} are the values and p_{1}, p_{2} and p_{3}
the matching weights.

**Example 4.** The final grade of a course comes from three assessments: 6 with weight 2, 7 with
weight 3 and 9 with weight 5.
The numerator is 12 + 21 + 45 = 78. The sum of the weights is 10. So M_{w} = 78 / 10 = 7.8.

Notice that the simple mean of the three grades would give a smaller value, because the high grade
is precisely the one with the largest weight. Dividing by the number of grades instead of dividing
by the sum of the weights is the classic slip here.

#### When the mean misleads

**Example 5.** A company has five employees, with monthly salaries of 1500, 2000, 2000, 2500 and
22000 reais.
The sum is S = 30000, so M = 6000 reais. In order, the central value is 2000, and that is the
median.

Four of the five employees earn less than the mean. Saying that the average salary in the company is
6000 reais is arithmetically true and descriptively false. The median of 2000 reais describes far
better what someone there usually earns. Whenever there is a value far away from the others, the
median is the more honest measure.

#### Measures of spread

Knowing the centre is not enough. Measures of spread tell you how far the data sits from it.

The **range** is the difference between the largest and the smallest value:

R = x_{max} - x_{min}

where R is the range, x_{max} the largest value in the set and x_{min} the smallest. It is quick to
work out and depends on only two pieces of data, which makes it fragile.

The **variance** is the mean of the squared deviations from the mean:

V = Σ(x - M)^{2} / n

where V is the variance, x each value in the set, M the mean, n how many values there are and Σ the
sum over every value. You square the deviations so that those above and below do not cancel each
other out.

The **standard deviation** is the square root of the variance:

SD = √V

where SD is the standard deviation and V the variance. It returns to the original unit of the data,
and that is why it is the one used to report the result.

**Example 6.** Find the mean, the variance and the standard deviation of the set 2, 4, 4, 4, 5, 5,
7, 9.
The sum is S = 40 and there are n = 8 values, so M = 5.
The deviations x - 5 are -3, -1, -1, -1, 0, 0, 2 and 4. Squaring them, (x - 5)^{2} gives
9, 1, 1, 1, 0, 0, 4 and 16, which add up to 32.
So V = 32 / 8 = 4 and SD = √4 = 2.

A standard deviation of 2 in a set with mean 5 tells you that the values usually sit about two units
from the centre.

#### Reading a graph in words

A bar chart compares categories: each bar has a height equal to the frequency of its category. When
the vertical axis does not start at zero, small differences look enormous, and that is the most
common visual manipulation. A pie chart shows the share of each category in the total, and only
makes sense when the categories add up to the whole. A histogram groups values into bands, and the
width of the bands changes the look of the distribution without changing any data.

Faced with any graph, three questions settle almost everything: where the data clusters, how much it
spreads, and whether there is a value far away from the rest.

#### Common mistakes

**Working out the median without ordering.** The median of the set in the order it was written is
almost never the true median.

**Dividing by the number of grades in a weighted mean.** The divisor is the sum of the weights.

**Thinking a higher mean means a better group.** Two groups with the same mean can have very
different spreads, and the one with the smaller standard deviation is the more predictable.

**Forgetting that the variance is in squared units.** If the data is in reais, the variance is in
reais squared, and only the standard deviation returns to reais.

**Treating the mode as compulsory.** A set in which no value repeats simply has no mode.

### Exercises

**Block A. Fundamentals**

1. Find the mean, the median and the mode of the set 3, 5, 7, 7, 8, 9, 10.
2. Find the mean and the median of the set 4, 6, 8, 10.
3. Find the range of the set 12, 15, 20, 9, 30.
4. The final grade of a course is the weighted mean of three grades: 6 with weight 2, 7 with weight
   3 and 9 with weight 5. Find the final grade.
5. Say whether each variable is qualitative or quantitative and, if quantitative, whether it is
   discrete or continuous: the number of siblings of a student, eye colour, height in metres, the
   number of correct answers on a test with 20 questions.

**Block B. Building up**

6. In a class of 20 students the number of siblings of each one was recorded: 5 students have no
   siblings, 8 have 1 sibling, 4 have 2 siblings and 3 have 3 siblings. Find the mean, the median
   and the mode.
7. Find the mean, the variance and the standard deviation of the set 2, 4, 4, 4, 5, 5, 7, 9.
8. A company has five employees, with monthly salaries of 1500, 2000, 2000, 2500 and 22000 reais.
   Find the mean and the median, and say which of the two better describes the typical salary.
9. A student scored 5, 7 and 6 on the first three tests. What score do they need on the fourth test
   so that the mean of the four is 7?
10. In a class of 30 students, the mean score of the 12 boys was 6 and the mean score of the 18
    girls was 7. What was the mean of the whole class?
11. Find the median of the set 10, 3, 7, 12, 5, 8.
12. The four values 4, 8, x and 12 have mean 9. Find x.
13. Find the variance and the standard deviation of the set 10, 12, 14, 16, 18.

**Block C. Going further**

14. Two sets of five values are 8, 9, 10, 11, 12 and 4, 7, 10, 13, 16. Find the mean and the
    standard deviation of each one and explain what the comparison shows.
15. The mean score of 25 students was 6. It was later found that one student's score had been
    recorded as 4 when the correct value was 9. What is the correct mean?
16. A set of 9 values has mean 20 and median 20. The largest value of the set increases by 90 units
    and all the others stay the same. Find the new mean and say what happens to the median.
17. In a class of 40 students the mean was 6.5. The 10 students in the study group had mean 8. What
    was the mean of the other 30 students?
18. Five positive whole numbers have mean 6, median 6 and mode 4, with 4 being the only value that
    repeats. Find the five numbers.

### Answer key

1. Mean 7, median 7 and mode 7.
2. Mean 7 and median 7.
3. Range 21, because the largest value is 30 and the smallest is 9.
4. 7.8.
5. Number of siblings: quantitative discrete. Eye colour: qualitative. Height in metres:
   quantitative continuous. Number of correct answers: quantitative discrete.
6. Mean 1.25, median 1 and mode 1.
7. Mean 5, variance 4 and standard deviation 2.
8. Mean 6000 reais and median 2000 reais. The median describes it better, because a single very high
   salary pulls the mean far away from what most people earn.
9. 10. The sum of the four scores has to be 28 and the first three add up to 18.
10. 6.6.
11. 7.5. In order the set is 3, 5, 7, 8, 10, 12, and the median is the mean of 7 and 8.
12. x = 12.
13. Variance 8 and standard deviation SD = √8 = 2·√2.
14. The two sets have mean 10. The first has variance 2 and standard deviation SD = √2. The second
    has variance 18 and standard deviation SD = 3·√2. The mean alone does not tell the two sets
    apart, and the standard deviation shows that the second one has values that are far more spread
    out.
15. 6.2. The sum of the scores goes from 150 to 155.
16. The new mean is 30, because 90 / 9 = 10 is the increase. The median stays 20, because the
    middle value did not change.
17. 6. The sum of all the scores is 260 and the study group adds up to 80, leaving 180 for 30
    students.
18. The numbers are 4, 4, 6, 7 and 9. The sum has to be 30, the middle value is 6 and the 4 has to
    appear twice with no other value repeating.

## VERIFICACAO

```python
X1: 5 + 8 + 4 + 3 == 20 and Rational(5,20)*100 == 25 and Rational(8,20)*100 == 40 and Rational(4,20)*100 == 20 and Rational(3,20)*100 == 15
X2: Rational(sum([3,5,7,7,8,9,10]), 7) == 7 and sorted([3,5,7,7,8,9,10])[3] == 7 and [3,5,7,7,8,9,10].count(7) == 2
X3: Rational(0*5 + 1*8 + 2*4 + 3*3, 20) == Rational(5,4) and sorted([0]*5+[1]*8+[2]*4+[3]*3)[9] == 1 and sorted([0]*5+[1]*8+[2]*4+[3]*3)[10] == 1
X4: Rational(6*2 + 7*3 + 9*5, 2+3+5) == Rational(39,5)
X5: Rational(sum([1500,2000,2000,2500,22000]), 5) == 6000 and sorted([1500,2000,2000,2500,22000])[2] == 2000
X6: Rational(sum([2,4,4,4,5,5,7,9]), 8) == 5 and Rational(sum([(v-5)**2 for v in [2,4,4,4,5,5,7,9]]), 8) == 4 and sqrt(4) == 2
E1: Rational(sum([3,5,7,7,8,9,10]), 7) == 7 and sorted([3,5,7,7,8,9,10])[3] == 7 and [3,5,7,7,8,9,10].count(7) == 2
E2: Rational(sum([4,6,8,10]), 4) == 7 and Rational(6+8, 2) == 7
E3: max([12,15,20,9,30]) - min([12,15,20,9,30]) == 21
E4: Rational(6*2 + 7*3 + 9*5, 2+3+5) == Rational(39,5)
E5: # manual: classificacao de variaveis em qualitativa, discreta e continua, resposta descritiva
E6: Rational(0*5 + 1*8 + 2*4 + 3*3, 20) == Rational(5,4) and sorted([0]*5+[1]*8+[2]*4+[3]*3)[9] == 1 and sorted([0]*5+[1]*8+[2]*4+[3]*3)[10] == 1 and 5+8+4+3 == 20
E7: Rational(sum([2,4,4,4,5,5,7,9]), 8) == 5 and Rational(sum([(v-5)**2 for v in [2,4,4,4,5,5,7,9]]), 8) == 4 and sqrt(4) == 2
E8: Rational(sum([1500,2000,2000,2500,22000]), 5) == 6000 and sorted([1500,2000,2000,2500,22000])[2] == 2000
E9: solve(Eq((5 + 7 + 6 + x)/4, 7), x) == [10] and 5 + 7 + 6 == 18 and 4*7 == 28
E10: Rational(12*6 + 18*7, 30) == Rational(33,5) and 12 + 18 == 30
E11: sorted([10,3,7,12,5,8]) == [3,5,7,8,10,12] and Rational(7+8, 2) == Rational(15,2)
E12: solve(Eq((4 + 8 + x + 12)/4, 9), x) == [12]
E13: Rational(sum([10,12,14,16,18]), 5) == 14 and Rational(sum([(v-14)**2 for v in [10,12,14,16,18]]), 5) == 8 and simplify(sqrt(8) - 2*sqrt(2)) == 0
E14: Rational(sum([8,9,10,11,12]), 5) == 10 and Rational(sum([4,7,10,13,16]), 5) == 10 and Rational(sum([(v-10)**2 for v in [8,9,10,11,12]]), 5) == 2 and Rational(sum([(v-10)**2 for v in [4,7,10,13,16]]), 5) == 18 and simplify(sqrt(18) - 3*sqrt(2)) == 0
E15: 25*6 == 150 and 150 - 4 + 9 == 155 and Rational(155, 25) == Rational(31,5)
E16: Rational(9*20 + 90, 9) == 30 and Rational(90, 9) == 10
E17: solve(Eq(10*8 + 30*x, 40*Rational(13,2)), x) == [6] and 40*Rational(13,2) == 260 and 10*8 == 80 and 260 - 80 == 180
E18: sum([4,4,6,7,9]) == 30 and Rational(30, 5) == 6 and sorted([4,4,6,7,9])[2] == 6 and [4,4,6,7,9].count(4) == 2 and all([4,4,6,7,9].count(v) == 1 for v in [6,7,9])
```
