---
id: MATEM3-13
serie: em3
unidade: numeros
titulo_pt: Matemática financeira aplicada
titulo_en: Applied financial mathematics
resumo_pt: Usar fatores de aumento e desconto, juros simples e compostos e valor presente para comparar propostas de pagamento.
resumo_en: Using increase and discount factors, simple and compound interest and present value to compare payment offers.
prerequisitos: [MATEM3-10]
duracao_min: 90
dificuldade: 5
---

## PT

### Explicação

#### Tudo começa no fator

Aumentar um valor em 20% é multiplicá-lo por 1,20. Dar um desconto de 20% é multiplicá-lo por 0,80.
Trocar a palavra por um fator é o passo que transforma matemática financeira em multiplicação
simples, e é ele que resolve as pegadinhas mais comuns.

Aumentos e descontos sucessivos se **multiplicam**, nunca se somam. Dois aumentos de 20% dão 1,20
vezes 1,20, que é 1,44, ou seja, um aumento acumulado de 44% e não de 40%. E um aumento de 25%
seguido de um desconto de 20% devolve o valor original, porque 1,25 vezes 0,80 dá exatamente 1.

#### Juros simples

Nos juros simples, só o capital inicial rende. O montante depois de n períodos é

M igual a C vezes (1 mais i vezes n)

**Exemplo 1.** Qual o montante de 1000 reais aplicados a 2% ao mês, em juros simples, durante 6
meses?
Os juros são 1000 vezes 0,02 vezes 6, ou seja, 120 reais. O montante é 1120 reais.

Juros simples aparecem pouco no mercado. Servem, na prática, como termo de comparação.

#### Juros compostos

Nos juros compostos, os juros de cada período passam a render também. O montante depois de n períodos
é

M igual a C vezes (1 mais i) elevado a n

**Exemplo 2.** Qual o montante de 1000 reais aplicados a 2% ao mês, em juros compostos, durante 6
meses?
O montante é 1000 vezes 1,02 elevado a 6, o que dá 1126,16 reais quando arredondado para duas casas.
A diferença para o regime simples parece pequena em 6 meses, mas cresce muito com o tempo, porque a
função é exponencial e não linear.

#### Valor presente: trazer tudo para a mesma data

Comparar 100 reais hoje com 100 reais daqui a um ano é comparar coisas diferentes. Para comparar
propostas de pagamento, leva-se tudo para a mesma data. Trazer um valor futuro F, de n períodos à
frente, para hoje, é dividir por (1 mais i) elevado a n.

Esse é o raciocínio que decide entre pagar à vista com desconto e pagar parcelado.

**Exemplo 3.** Um preço sofre dois aumentos seguidos de 20%. Qual o aumento acumulado?
O fator é 1,20 vezes 1,20, que dá 1,44. O aumento acumulado é de 44%.

**Exemplo 4.** Um produto custa 1200 reais à vista ou 3 parcelas mensais de 440 reais. Quanto se paga
a mais no total, em termos percentuais?
O total parcelado é 1320 reais. A diferença é 120 reais sobre 1200, ou seja, 10% a mais. Esse cálculo
compara apenas totais, e não datas, então serve como primeira leitura, não como decisão final.

#### Ganho real

Quando os preços sobem, um aumento nominal de salário pode significar perda. O ganho real é o fator
do salário dividido pelo fator dos preços. Se o salário sobe 8% e os preços sobem 20%, o fator é 1,08
dividido por 1,20, que dá 0,90: uma perda real de 10%.

#### Erros comuns

**Somar taxas de períodos diferentes.** 1% ao mês não é 12% ao ano em juros compostos. O fator anual
é 1,01 elevado a 12.

**Somar aumentos e descontos sucessivos.** Aumento de 30% seguido de desconto de 30% não volta ao
início, e sim a 91% do valor original.

**Comparar valores em datas diferentes.** Sem trazer tudo para a mesma data, a comparação não tem
sentido.

**Arredondar no meio da conta.** Arredonde apenas no resultado final, com duas casas decimais.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule 15% de 240 reais.
2. Um capital de 2000 reais é aplicado a juros simples de 3% ao mês durante 5 meses. Calcule os juros
   e o montante.
3. Um produto que custa 80 reais sofre aumento de 25%. Qual passa a ser o preço?
4. Um produto que custa 200 reais recebe desconto de 15%. Qual passa a ser o preço?
5. Calcule o montante de 1000 reais aplicados a juros compostos de 10% ao ano durante 2 anos.

**Bloco B. Consolidação**

6. Calcule o montante de 5000 reais aplicados a juros compostos de 2% ao mês durante 3 meses.
7. Um produto de 500 reais recebe dois descontos sucessivos, um de 10% e outro de 20%. Calcule o
   preço final e o desconto único equivalente.
8. Um capital de 4000 reais é aplicado por 2 meses à taxa de 5% ao mês. Calcule o montante em juros
   simples e o montante em juros compostos.
9. Um preço sofre um aumento de 25% e, em seguida, um desconto de 20%. Determine a variação
   percentual acumulada.
10. Um produto custa 1500 reais à vista ou 5 parcelas mensais de 330 reais. Calcule o total pago no
    parcelamento e quantos por cento ele supera o preço à vista.
11. Uma aplicação de 8000 reais rendeu, em juros compostos, um montante de 9680 reais depois de 2
    anos. Determine a taxa anual.
12. Em um ano, o salário de uma pessoa subiu 8% e os preços subiram 20%. Determine a variação real do
    poder de compra dessa pessoa.
13. Quanto é preciso aplicar hoje, a juros compostos de 4% ao mês, para ter 5000 reais daqui a 2
    meses? Dê a resposta com duas casas decimais.

**Bloco C. Aprofundamento**

14. Uma loja vende um computador por 2400 reais à vista ou por 2600 reais em pagamento único daqui a
    2 meses. Uma aplicação financeira rende 4% ao mês em juros compostos. Para quem tem o dinheiro
    hoje, qual opção é melhor, e qual é a diferença na data do pagamento?
15. Um preço sofre um aumento de 30%. Qual desconto percentual, aplicado sobre o novo preço, devolve
    exatamente o preço original? Dê a resposta com duas casas decimais.
16. Calcule o montante de 12000 reais aplicados a juros compostos de 1,5% ao mês durante 12 meses.
    Dê a resposta com duas casas decimais.
17. Uma aplicação rende 12% ao ano com capitalização anual, e outra rende 1% ao mês com capitalização
    mensal. Qual delas rende mais em um ano, e qual é a taxa anual equivalente da segunda? Dê a taxa
    com duas casas decimais.
18. Um empréstimo de 10000 reais, a juros compostos de 3% ao mês, será pago em 2 parcelas mensais
    iguais, a primeira um mês após a liberação. Determine o valor de cada parcela e o total pago,
    com duas casas decimais.

### Gabarito

1. São 36 reais.
2. Os juros são 300 reais e o montante é 2300 reais.
3. O preço passa a ser 100 reais, pois o fator de aumento é 1,25.
4. O preço passa a ser 170 reais, pois o fator de desconto é 0,85.
5. O montante é 1210 reais.
6. O montante é 5306,04 reais.
7. O preço final é 360 reais. O fator acumulado é 0,9 vezes 0,8, que dá 0,72, logo o desconto único
   equivalente é de 28%.
8. Em juros simples o montante é 4400 reais. Em juros compostos é 4410 reais.
9. Não há variação acumulada, pois 1,25 vezes 0,80 dá 1. A variação é de 0%.
10. O total parcelado é 1650 reais, que supera o preço à vista em 10%.
11. A taxa é de 10% ao ano, pois 9680 dividido por 8000 dá 1,21, que é 1,1 ao quadrado.
12. Houve perda real de 10%, pois 1,08 dividido por 1,20 dá 0,90.
13. É preciso aplicar 4622,78 reais.
14. Pagar à vista é melhor. Os 2400 reais aplicados por 2 meses virariam 2595,84 reais, valor menor
    que os 2600 reais devidos. A diferença é de 4,16 reais a favor do pagamento à vista.
15. O desconto é de 23,08%, pois ele vale 30 dividido por 130, ou seja, 3 sobre 13.
16. O montante é 14347,42 reais.
17. A segunda rende mais. Sua taxa anual equivalente é de 12,68%, pois o fator anual é 1,01 elevado
    a 12.
18. Cada parcela vale 5226,11 reais e o total pago é 10452,22 reais. A soma dos valores presentes das
    duas parcelas precisa ser 10000, o que leva à parcela igual a 10000 vezes 1,0609 dividido por
    2,03.

## EN

### Explanation

#### Everything starts with the factor

Increasing a value by 20% means multiplying it by 1.20. Giving a 20% discount means multiplying it by
0.80. Turning the word into a factor is the step that makes financial mathematics into plain
multiplication, and it is what settles the most common traps.

Successive increases and discounts **multiply**, they never add. Two increases of 20% give 1.20 times
1.20, which is 1.44, that is, an accumulated increase of 44% and not of 40%. And an increase of 25%
followed by a discount of 20% gives back the original value, because 1.25 times 0.80 is exactly 1.

#### Simple interest

Under simple interest, only the initial capital earns. The amount after n periods is

M equals C times (1 plus i times n)

**Example 1.** What is the amount of 1000 reais invested at 2% a month, at simple interest, for 6
months?
The interest is 1000 times 0.02 times 6, that is, 120 reais. The amount is 1120 reais.

Simple interest rarely shows up in the market. In practice it serves as a benchmark for comparison.

#### Compound interest

Under compound interest, the interest of each period starts earning too. The amount after n periods
is

M equals C times (1 plus i) to the power n

**Example 2.** What is the amount of 1000 reais invested at 2% a month, at compound interest, for 6
months?
The amount is 1000 times 1.02 to the power 6, which gives 1126.16 reais when rounded to two decimal
places. The gap over the simple regime looks small across 6 months, but it grows a lot with time,
because the function is exponential and not linear.

#### Present value: bringing everything to the same date

Comparing 100 reais today with 100 reais a year from now is comparing different things. To compare
payment offers, you bring everything to the same date. Bringing a future value F, n periods ahead,
back to today means dividing by (1 plus i) to the power n.

That is the reasoning that decides between paying cash with a discount and paying in installments.

**Example 3.** A price takes two successive increases of 20%. What is the accumulated increase?
The factor is 1.20 times 1.20, which gives 1.44. The accumulated increase is 44%.

**Example 4.** A product costs 1200 reais cash or 3 monthly installments of 440 reais. How much more
is paid in total, in percentage terms?
The installment total is 1320 reais. The difference is 120 reais on 1200, that is, 10% more. This
calculation compares totals only, not dates, so it works as a first reading, not as a final decision.

#### Real gain

When prices go up, a nominal salary increase may mean a loss. The real gain is the salary factor
divided by the price factor. If the salary goes up 8% and prices go up 20%, the factor is 1.08
divided by 1.20, which gives 0.90: a real loss of 10%.

#### Common mistakes

**Adding rates from different periods.** 1% a month is not 12% a year under compound interest. The
yearly factor is 1.01 to the power 12.

**Adding successive increases and discounts.** An increase of 30% followed by a discount of 30% does
not return to the start, it returns to 91% of the original value.

**Comparing values at different dates.** Without bringing everything to the same date, the comparison
means nothing.

**Rounding in the middle of the calculation.** Round only at the final result, to two decimal places.

### Exercises

**Block A. Fundamentals**

1. Work out 15% of 240 reais.
2. A capital of 2000 reais is invested at simple interest of 3% a month for 5 months. Work out the
   interest and the amount.
3. A product costing 80 reais takes an increase of 25%. What does the price become?
4. A product costing 200 reais gets a discount of 15%. What does the price become?
5. Work out the amount of 1000 reais invested at compound interest of 10% a year for 2 years.

**Block B. Building up**

6. Work out the amount of 5000 reais invested at compound interest of 2% a month for 3 months.
7. A product costing 500 reais gets two successive discounts, one of 10% and another of 20%. Work out
   the final price and the equivalent single discount.
8. A capital of 4000 reais is invested for 2 months at a rate of 5% a month. Work out the amount
   under simple interest and the amount under compound interest.
9. A price takes an increase of 25% and then a discount of 20%. Find the accumulated percentage
   change.
10. A product costs 1500 reais cash or 5 monthly installments of 330 reais. Work out the total paid
    under the installment plan and by what percentage it exceeds the cash price.
11. An investment of 8000 reais grew, under compound interest, to an amount of 9680 reais after 2
    years. Find the yearly rate.
12. Over one year, a person's salary went up 8% and prices went up 20%. Find the real change in that
    person's buying power.
13. How much must be invested today, at compound interest of 4% a month, in order to have 5000 reais
    2 months from now? Give the answer to two decimal places.

**Block C. Going further**

14. A shop sells a computer for 2400 reais cash or for 2600 reais in a single payment 2 months from
    now. An investment pays 4% a month at compound interest. For someone holding the money today,
    which option is better, and what is the difference on the payment date?
15. A price takes an increase of 30%. Which percentage discount, applied to the new price, gives back
    exactly the original price? Give the answer to two decimal places.
16. Work out the amount of 12000 reais invested at compound interest of 1.5% a month for 12 months.
    Give the answer to two decimal places.
17. One investment pays 12% a year with yearly compounding, and another pays 1% a month with monthly
    compounding. Which of them pays more over a year, and what is the equivalent yearly rate of the
    second one? Give the rate to two decimal places.
18. A loan of 10000 reais, at compound interest of 3% a month, will be paid in 2 equal monthly
    installments, the first one a month after the money is released. Find the value of each
    installment and the total paid, to two decimal places.

### Answer key

1. It is 36 reais.
2. The interest is 300 reais and the amount is 2300 reais.
3. The price becomes 100 reais, since the increase factor is 1.25.
4. The price becomes 170 reais, since the discount factor is 0.85.
5. The amount is 1210 reais.
6. The amount is 5306.04 reais.
7. The final price is 360 reais. The accumulated factor is 0.9 times 0.8, which gives 0.72, so the
   equivalent single discount is 28%.
8. Under simple interest the amount is 4400 reais. Under compound interest it is 4410 reais.
9. There is no accumulated change, since 1.25 times 0.80 gives 1. The change is 0%.
10. The installment total is 1650 reais, which exceeds the cash price by 10%.
11. The rate is 10% a year, since 9680 divided by 8000 gives 1.21, which is 1.1 squared.
12. There was a real loss of 10%, since 1.08 divided by 1.20 gives 0.90.
13. It is necessary to invest 4622.78 reais.
14. Paying cash is better. The 2400 reais invested for 2 months would become 2595.84 reais, less than
    the 2600 reais owed. The difference is 4.16 reais in favour of paying cash.
15. The discount is 23.08%, since it equals 30 divided by 130, that is, 3 over 13.
16. The amount is 14347.42 reais.
17. The second one pays more. Its equivalent yearly rate is 12.68%, since the yearly factor is 1.01
    to the power 12.
18. Each installment is 5226.11 reais and the total paid is 10452.22 reais. The sum of the present
    values of the two installments must be 10000, which leads to an installment equal to 10000 times
    1.0609 divided by 2.03.

## VERIFICACAO

```python
X1: 1000 + 1000*Rational(2, 100)*6 == 1120 and 1000*Rational(2, 100)*6 == 120
X2: Abs(1000*Rational(51, 50)**6 - Rational(112616, 100)) < Rational(1, 100)
X3: Rational(120, 100)**2 == Rational(144, 100)
X4: 3*440 == 1320 and Rational(1320 - 1200, 1200)*100 == 10
E1: Rational(15, 100)*240 == 36
E2: 2000*Rational(3, 100)*5 == 300 and 2000 + 2000*Rational(3, 100)*5 == 2300
E3: 80*Rational(125, 100) == 100
E4: 200*Rational(85, 100) == 170
E5: 1000*Rational(11, 10)**2 == 1210
E6: 5000*Rational(51, 50)**3 == Rational(530604, 100)
E7: 500*Rational(9, 10)*Rational(8, 10) == 360 and Rational(9, 10)*Rational(8, 10) == Rational(72, 100) and (1 - Rational(72, 100))*100 == 28
E8: 4000 + 4000*Rational(5, 100)*2 == 4400 and 4000*Rational(105, 100)**2 == 4410
E9: Rational(125, 100)*Rational(80, 100) == 1
E10: 5*330 == 1650 and Rational(1650 - 1500, 1500)*100 == 10
E11: 8000*Rational(11, 10)**2 == 9680 and Rational(9680, 8000) == Rational(121, 100)
E12: Rational(108, 100)/Rational(120, 100) == Rational(90, 100) and (1 - Rational(90, 100))*100 == 10
E13: Abs(5000/Rational(104, 100)**2 - Rational(462278, 100)) < Rational(1, 100)
E14: 2400*Rational(104, 100)**2 == Rational(259584, 100) and 2600 - Rational(259584, 100) == Rational(416, 100)
E15: Abs(Rational(30, 130)*100 - Rational(2308, 100)) < Rational(1, 100) and Rational(30, 130) == Rational(3, 13)
E16: Abs(12000*Rational(1015, 1000)**12 - Rational(1434742, 100)) < Rational(1, 100)
E17: Abs((Rational(101, 100)**12 - 1)*100 - Rational(1268, 100)) < Rational(1, 100) and Rational(101, 100)**12 > Rational(112, 100)
E18: Abs(10000*Rational(10609, 10000)/Rational(203, 100) - Rational(522611, 100)) < Rational(1, 100) and Abs(2*10000*Rational(10609, 10000)/Rational(203, 100) - Rational(1045222, 100)) < Rational(1, 100)
```
