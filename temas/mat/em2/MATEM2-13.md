---
id: MATEM2-13
serie: em2
unidade: numeros
titulo_pt: Juros compostos
titulo_en: Compound interest
resumo_pt: Calcular montante, capital, taxa e prazo em juros compostos, e enxergar por que eles deixam os juros simples para trás.
resumo_en: Working out amount, principal, rate and time under compound interest, and seeing why it leaves simple interest behind.
prerequisitos: [MATEM1-11]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### Duas maneiras de cobrar juros

Quem empresta dinheiro cobra por isso, e existem dois jeitos de fazer a conta.

Nos **juros simples**, o rendimento de cada período é sempre calculado sobre o capital inicial. Se
1000 reais rendem 10 por cento ao mês, o rendimento é de 100 reais em todo mês, para sempre. O
montante cresce em linha reta, como uma progressão aritmética.

Nos **juros compostos**, o rendimento de cada período é calculado sobre o valor acumulado até ali,
que já inclui os juros anteriores. No primeiro mês rendem 100 reais, no segundo o rendimento incide
sobre 1100 reais e dá 110 reais, no terceiro incide sobre 1210 reais e dá 121 reais. O montante cresce
como uma progressão geométrica.

Essa é a diferença inteira, e ela é a razão de o dinheiro no mundo real funcionar do segundo jeito.

#### As fórmulas

Para juros simples:

M = C · (1 + i · t)

Para juros compostos:

M = C · (1 + i)^{t}

onde M é o montante, C o capital, i a taxa por período e t o número de períodos.

A taxa entra sempre em forma decimal: 10 por cento vira 0,1, e 5 por cento vira 0,05. E a taxa
precisa estar na mesma unidade de tempo do prazo. Taxa mensal pede prazo em meses.

**Exemplo 1.** Achar o montante de 5000 reais aplicados a 2 por cento ao mês, durante 4 meses, em
juros compostos.
M = 5000 · 1,02^{4}. O fator vale 1,08243216, e o montante fica 5412,16 reais, arredondando para
duas casas.

#### A comparação que interessa

**Exemplo 2.** Comparar, para 2000 reais a 5 por cento ao mês durante 4 meses, o montante em juros
simples e em juros compostos.
Em juros simples, o fator é 1 + 0,05 × 4 = 1,2, e o montante é 2400 reais. Em juros compostos, o
fator é 1,05^{4} = 1,21550625, e o montante é 2431,01 reais.

Repare em duas coisas. Primeiro, os dois montantes coincidem ao fim do primeiro período, porque nele
ainda não há juros acumulados sobre os quais render. Segundo, a partir do segundo período o composto
passa à frente, e a distância só aumenta. Em prazos longos a diferença deixa de ser detalhe e vira o
resultado principal.

#### Achando o que não é o montante

A mesma fórmula responde a quatro perguntas diferentes, dependendo de qual letra é a incógnita.

**Achar o capital.** Divide-se o montante pelo fator.

**Achar a taxa.** Divide-se o montante pelo capital, extrai-se a raiz de índice igual ao prazo, e
subtrai-se 1.

**Achar o prazo.** Divide-se o montante pelo capital e testa-se qual expoente produz esse fator. Com
números redondos, testar potências resolve.

**Exemplo 3.** Em quantos períodos um capital de 1000 reais vira 1728 reais a 20 por cento por
período?
O fator total é 1728 / 1000 = 1,728. Testando: 1,2^{2} = 1,44, e 1,2^{3} = 1,728. São 3 períodos.

#### Taxas equivalentes

Duas taxas em unidades de tempo diferentes são equivalentes quando produzem o mesmo montante no mesmo
prazo. Para achar a taxa de um período maior a partir da taxa de um período menor, eleva-se o fator
ao número de períodos menores que cabem no maior.

**Exemplo 4.** Achar a taxa bimestral equivalente a 10 por cento ao mês.
O fator bimestral é 1,1^{2} = 1,21. Tirando o 1, a taxa bimestral é 21 por cento.
Repare que não são 20 por cento: os juros do primeiro mês rendem no segundo.

#### Erros comuns

**Somar taxas de períodos seguidos.** Um aumento de 10 por cento seguido de outro de 20 por cento não
dá 30 por cento. Os fatores se multiplicam, e 1,1 × 1,2 = 1,32, ou seja, 32 por cento.

**Misturar unidade de taxa e de prazo.** Taxa ao ano com prazo em meses dá resultado sem sentido.

**Usar a taxa em porcentagem dentro da fórmula.** Escrever 10 no lugar de 0,1 multiplica o resultado
por um número absurdo.

**Arredondar no meio da conta.** Cortar casas decimais no fator e só depois multiplicar pelo capital
gera diferença visível. Arredonde apenas no fim.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule o montante de 1000 reais aplicados a 10 por cento ao mês, durante 2 meses, em juros
   compostos.
2. Calcule o montante de 2000 reais aplicados a 5 por cento ao mês, durante 3 meses, em juros
   compostos.
3. Calcule o juro e o montante de 1000 reais aplicados a 10 por cento ao mês, durante 2 meses, em
   juros simples.
4. Calcule o montante de 500 reais aplicados a 20 por cento ao ano, durante 2 anos, em juros
   compostos.
5. Um capital de 800 reais gerou um montante de 968 reais em 2 períodos, em juros compostos.
   Determine a taxa por período.

**Bloco B. Consolidação**

6. Calcule o montante e o juro total de 1000 reais aplicados a 10 por cento ao mês, durante 3 meses,
   em juros compostos.
7. Calcule o montante de 10000 reais aplicados a 2 por cento ao mês, durante 6 meses, em juros
   compostos.
8. Um capital de 5000 reais é aplicado a 12 por cento ao ano durante 3 anos. Calcule o montante em
   juros simples, o montante em juros compostos e a diferença entre eles.
9. Determine em quantos meses um capital de 2000 reais aplicado a 5 por cento ao mês, em juros
   compostos, atinge o montante de 2315,25 reais.
10. Determine o capital que, aplicado a 10 por cento ao mês em juros compostos, produz um montante de
    1210 reais em 2 meses.
11. Uma dívida de 2000 reais cresce a 5 por cento ao mês, em juros compostos. Calcule o valor da
    dívida depois de 6 meses.
12. Determine a taxa trimestral equivalente a uma taxa de 10 por cento ao mês.
13. Calcule o montante de 4000 reais aplicados a 25 por cento ao ano, durante 2 anos, em juros
    compostos.
14. Um preço de 200 reais sobe 10 por cento num ano e sobe mais 20 por cento no ano seguinte.
    Calcule o preço final e a taxa acumulada nos dois anos.

**Bloco C. Aprofundamento**

15. Um capital de 1000 reais é aplicado a 10 por cento ao mês. Calcule o montante em juros simples e
    o montante em juros compostos ao fim de 1 mês, ao fim de 2 meses e ao fim de 3 meses, e diga a
    partir de qual mês o montante composto supera o simples.
16. Determine o menor número inteiro de meses para que um capital de 1000 reais, aplicado a 10 por
    cento ao mês em juros compostos, ultrapasse 2000 reais.
17. Um capital triplica em 2 períodos, em juros compostos. Determine a taxa por período, em forma
    exata e em porcentagem arredondada com duas casas.
18. Uma pessoa pode aplicar 10000 reais a juros simples de 3 por cento ao mês ou a juros compostos de
    2 por cento ao mês. Determine qual aplicação rende mais ao fim de 12 meses e calcule a diferença
    entre os montantes.
19. Um investidor aplica 1000 reais hoje e mais 1000 reais daqui a um ano, numa aplicação que rende
    10 por cento ao ano em juros compostos. Calcule o montante total dois anos depois de hoje.

### Gabarito

1. 1210 reais.
2. 2315,25 reais.
3. Juro de 200 reais e montante de 1200 reais.
4. 720 reais.
5. 10 por cento por período. O fator de dois períodos é 968 / 800 = 1,21, e √(1,21) = 1,1.
6. Montante de 1331 reais e juro total de 331 reais.
7. 11261,62 reais.
8. Montante de 6800 reais em juros simples, montante de 7024,64 reais em juros compostos, e diferença
   de 224,64 reais.
9. 3 meses.
10. 1000 reais.
11. 2680,19 reais.
12. 33,1 por cento ao trimestre. O fator é 1,1^{3} = 1,331.
13. 6250 reais.
14. Preço final de 264 reais e taxa acumulada de 32 por cento. Os fatores se multiplicam:
    1,1 × 1,2 = 1,32.
15. Em juros simples, os montantes são 1100, 1200 e 1300 reais. Em juros compostos, são 1100, 1210 e
    1331 reais. Os dois coincidem ao fim do primeiro mês, e a partir do segundo mês o composto passa
    à frente.
16. 8 meses. O fator 1,1^{7} vale cerca de 1,9487, e ainda não chega ao dobro, enquanto 1,1^{8}
    vale cerca de 2,1436.
17. A taxa é √3 - 1, o que dá aproximadamente 73,21 por cento por período.
18. Rende mais a aplicação em juros simples. Ela chega a 13600 reais, enquanto a de juros compostos
    chega a 12682,42 reais, com diferença de 917,58 reais. A taxa maior compensa, nesse prazo, o
    efeito do acúmulo.
19. 2310 reais. O primeiro aporte rende por dois anos e vale 1210 reais, e o segundo rende por um ano
    e vale 1100 reais.

## EN

### Explanation

#### Two ways of charging interest

Whoever lends money charges for it, and there are two ways of doing the arithmetic.

Under **simple interest**, the earnings of each period are always worked out on the initial
principal. If 1000 reais earn 10 per cent a month, the earnings are 100 reais every month, forever.
The amount grows in a straight line, like an arithmetic progression.

Under **compound interest**, the earnings of each period are worked out on the value accumulated so
far, which already includes the earlier interest. In the first month it earns 100 reais, in the
second the rate applies to 1100 reais and gives 110 reais, in the third it applies to 1210 reais and
gives 121 reais. The amount grows like a geometric progression.

That is the whole difference, and it is why money in the real world works the second way.

#### The formulas

For simple interest:

M = C · (1 + i · t)

For compound interest:

M = C · (1 + i)^{t}

where M is the amount, C the principal, i the rate per period and t the number of periods.

The rate always goes in as a decimal: 10 per cent becomes 0.1, and 5 per cent becomes 0.05. And the
rate has to be in the same time unit as the term. A monthly rate calls for a term in months.

**Example 1.** Find the amount of 5000 reais invested at 2 per cent a month for 4 months, under
compound interest.
M = 5000 · 1.02^{4}. The factor is 1.08243216, and the amount comes to 5412.16 reais, rounded to two
decimal places.

#### The comparison that matters

**Example 2.** For 2000 reais at 5 per cent a month for 4 months, compare the amount under simple
interest and under compound interest.
Under simple interest the factor is 1 + 0.05 × 4 = 1.2, and the amount is 2400 reais. Under compound
interest the factor is 1.05^{4} = 1.21550625, and the amount is 2431.01 reais.

Notice two things. First, the two amounts agree at the end of the first period, because there is not
yet any accumulated interest to earn on. Second, from the second period on, the compound one moves
ahead, and the gap only widens. Over long terms the difference stops being a detail and becomes the
main result.

#### Finding what is not the amount

The same formula answers four different questions, depending on which letter is the unknown.

**Finding the principal.** Divide the amount by the factor.

**Finding the rate.** Divide the amount by the principal, take the root whose index equals the term,
and subtract 1.

**Finding the term.** Divide the amount by the principal and test which exponent produces that
factor. With round numbers, testing powers settles it.

**Example 3.** In how many periods does a principal of 1000 reais become 1728 reais at 20 per cent
per period?
The total factor is 1728 / 1000 = 1.728. Testing: 1.2^{2} = 1.44, and 1.2^{3} = 1.728. It takes 3
periods.

#### Equivalent rates

Two rates in different time units are equivalent when they produce the same amount over the same
term. To get the rate of a longer period from the rate of a shorter one, raise the factor to the
number of shorter periods that fit inside the longer one.

**Example 4.** Find the two month rate equivalent to 10 per cent a month.
The two month factor is 1.1^{2} = 1.21. Taking away the 1, the two month rate is 21 per cent.
Notice that it is not 20 per cent: the first month interest earns during the second.

#### Common mistakes

**Adding the rates of consecutive periods.** A rise of 10 per cent followed by another of 20 per cent
does not give 30 per cent. The factors multiply, and 1.1 × 1.2 = 1.32, that is, 32 per cent.

**Mixing the unit of the rate with the unit of the term.** A yearly rate with a term in months gives
a meaningless result.

**Putting the rate as a percentage into the formula.** Writing 10 in place of 0.1 multiplies the
result by an absurd number.

**Rounding in the middle of the work.** Cutting decimal places in the factor and only then
multiplying by the principal creates a visible difference. Round only at the end.

### Exercises

**Block A. Fundamentals**

1. Find the amount of 1000 reais invested at 10 per cent a month for 2 months, under compound
   interest.
2. Find the amount of 2000 reais invested at 5 per cent a month for 3 months, under compound
   interest.
3. Find the interest and the amount of 1000 reais invested at 10 per cent a month for 2 months, under
   simple interest.
4. Find the amount of 500 reais invested at 20 per cent a year for 2 years, under compound interest.
5. A principal of 800 reais produced an amount of 968 reais in 2 periods, under compound interest.
   Find the rate per period.

**Block B. Building up**

6. Find the amount and the total interest of 1000 reais invested at 10 per cent a month for 3 months,
   under compound interest.
7. Find the amount of 10000 reais invested at 2 per cent a month for 6 months, under compound
   interest.
8. A principal of 5000 reais is invested at 12 per cent a year for 3 years. Find the amount under
   simple interest, the amount under compound interest and the difference between them.
9. Find in how many months a principal of 2000 reais invested at 5 per cent a month, under compound
   interest, reaches the amount of 2315.25 reais.
10. Find the principal that, invested at 10 per cent a month under compound interest, produces an
    amount of 1210 reais in 2 months.
11. A debt of 2000 reais grows at 5 per cent a month, under compound interest. Find the value of the
    debt after 6 months.
12. Find the quarterly rate equivalent to a rate of 10 per cent a month.
13. Find the amount of 4000 reais invested at 25 per cent a year for 2 years, under compound
    interest.
14. A price of 200 reais rises 10 per cent in one year and rises a further 20 per cent the next year.
    Find the final price and the accumulated rate over the two years.

**Block C. Going further**

15. A principal of 1000 reais is invested at 10 per cent a month. Find the amount under simple
    interest and the amount under compound interest at the end of 1 month, at the end of 2 months and
    at the end of 3 months, and say from which month on the compound amount overtakes the simple one.
16. Find the smallest whole number of months for a principal of 1000 reais, invested at 10 per cent a
    month under compound interest, to pass 2000 reais.
17. A principal triples in 2 periods, under compound interest. Find the rate per period, in exact
    form and as a percentage rounded to two decimal places.
18. A person may invest 10000 reais at simple interest of 3 per cent a month or at compound interest
    of 2 per cent a month. Find which investment earns more at the end of 12 months and work out the
    difference between the amounts.
19. An investor puts in 1000 reais today and another 1000 reais one year from today, in an investment
    earning 10 per cent a year under compound interest. Find the total amount two years from today.

### Answer key

1. 1210 reais.
2. 2315.25 reais.
3. Interest of 200 reais and amount of 1200 reais.
4. 720 reais.
5. 10 per cent per period. The two period factor is 968 / 800 = 1.21, and √(1.21) = 1.1.
6. Amount of 1331 reais and total interest of 331 reais.
7. 11261.62 reais.
8. Amount of 6800 reais under simple interest, amount of 7024.64 reais under compound interest, and a
   difference of 224.64 reais.
9. 3 months.
10. 1000 reais.
11. 2680.19 reais.
12. 33.1 per cent per quarter. The factor is 1.1^{3} = 1.331.
13. 6250 reais.
14. Final price of 264 reais and accumulated rate of 32 per cent. The factors multiply:
    1.1 × 1.2 = 1.32.
15. Under simple interest the amounts are 1100, 1200 and 1300 reais. Under compound interest they are
    1100, 1210 and 1331 reais. The two agree at the end of the first month, and from the second month
    on the compound one moves ahead.
16. 8 months. The factor 1.1^{7} is about 1.9487, which still falls short of double, while 1.1^{8}
    is about 2.1436.
17. The rate is √3 - 1, which comes to about 73.21 per cent per period.
18. The simple interest investment earns more. It reaches 13600 reais, while the compound one reaches
    12682.42 reais, a difference of 917.58 reais. Over this term the higher rate outweighs the effect
    of compounding.
19. 2310 reais. The first deposit earns for two years and is worth 1210 reais, and the second earns
    for one year and is worth 1100 reais.

## VERIFICACAO

```python
X1: 5000*Rational(102,100)**4 > Rational(5412155,1000) and 5000*Rational(102,100)**4 < Rational(5412165,1000)
X2: 2000*(1 + Rational(5,100)*4) == 2400 and 2000*Rational(105,100)**4 > Rational(2431005,1000) and 2000*Rational(105,100)**4 < Rational(2431015,1000)
X3: 1000*Rational(12,10)**3 == 1728
X4: Rational(11,10)**2 == Rational(121,100) and Rational(121,100) - 1 == Rational(21,100)
E1: 1000*Rational(11,10)**2 == 1210
E2: 2000*Rational(105,100)**3 == Rational(231525,100)
E3: 1000*Rational(10,100)*2 == 200 and 1000 + 200 == 1200
E4: 500*Rational(12,10)**2 == 720
E5: solve(Eq(800*(1 + r)**2, 968), r) == [Rational(-21,10), Rational(1,10)]
E6: 1000*Rational(11,10)**3 == 1331 and 1331 - 1000 == 331
E7: 10000*Rational(102,100)**6 > Rational(11261615,1000) and 10000*Rational(102,100)**6 < Rational(11261625,1000)
E8: 5000 + 5000*Rational(12,100)*3 == 6800 and 5000*Rational(112,100)**3 == Rational(702464,100) and Rational(702464,100) - 6800 == Rational(22464,100)
E9: 2000*Rational(105,100)**3 == Rational(231525,100)
E10: solve(Eq(c*Rational(11,10)**2, 1210), c) == [1000]
E11: 2000*Rational(105,100)**6 > Rational(2680185,1000) and 2000*Rational(105,100)**6 < Rational(2680195,1000)
E12: Rational(11,10)**3 == Rational(1331,1000) and Rational(1331,1000) - 1 == Rational(331,1000)
E13: 4000*Rational(125,100)**2 == 6250
E14: 200*Rational(11,10)*Rational(12,10) == 264 and Rational(11,10)*Rational(12,10) - 1 == Rational(32,100)
E15: 1000*(1 + Rational(10,100)*1) == 1100 and 1000*Rational(11,10) == 1100 and 1000*(1 + Rational(10,100)*2) == 1200 and 1000*Rational(11,10)**2 == 1210 and 1000*(1 + Rational(10,100)*3) == 1300 and 1000*Rational(11,10)**3 == 1331
E16: 1000*Rational(11,10)**8 > 2000 and 1000*Rational(11,10)**7 < 2000
E17: simplify((1 + (sqrt(3) - 1))**2 - 3) == 0 and (sqrt(3) - 1)*100 > Rational(73205,1000) and (sqrt(3) - 1)*100 < Rational(73215,1000)
E18: 10000*(1 + Rational(3,100)*12) == 13600 and 10000*Rational(102,100)**12 > Rational(12682415,1000) and 10000*Rational(102,100)**12 < Rational(12682425,1000) and 13600 - 10000*Rational(102,100)**12 > Rational(917575,1000) and 13600 - 10000*Rational(102,100)**12 < Rational(917585,1000)
E19: 1000*Rational(11,10)**2 + 1000*Rational(11,10) == 2310
```
