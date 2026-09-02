---
id: MATEM1-03
serie: em1
unidade: algebra
titulo_pt: Função afim
titulo_en: Linear function
resumo_pt: Ler a reta pelo coeficiente angular e pelo linear, montar a lei a partir de dois pontos e reconhecer a função afim escondida num problema.
resumo_en: Reading a line from its slope and intercept, building the rule from two points, and spotting the linear function hidden in a problem.
prerequisitos: [MATEM1-02]
duracao_min: 90
dificuldade: 3
---

## PT

### Explicação

#### O que é

Uma função afim é toda função que pode ser escrita como

f(x) = ax + b

onde a e b são números fixos. O gráfico é sempre uma **reta**, e é por isso que ela aparece em toda
situação em que uma grandeza cresce ou diminui sempre no mesmo ritmo.

Quando b = 0, a função vira f(x) = ax, e a reta passa pela origem. Esse caso especial é
chamado de função linear, e é o único em que dobrar o x dobra o f(x).

#### Os dois coeficientes contam coisas diferentes

**O coeficiente a é a taxa de variação, também chamada de coeficiente angular.** Ele diz quanto o
f(x) muda quando o x aumenta uma unidade. É a inclinação da reta:

- a > 0: a reta sobe, e a função é crescente.
- a < 0: a reta desce, e a função é decrescente.
- a = 0: a reta fica horizontal, e a função é constante.

**O coeficiente b é o valor inicial, também chamado de coeficiente linear.** Ele é o f(0), ou seja,
o ponto onde a reta corta o eixo vertical.

**Exemplo 1.** Numa função f(x) = 3x + 5, o que dizem os coeficientes?
O a vale 3: a cada unidade que o x avança, o f(x) sobe 3. O b vale 5: quando x = 0, f vale 5, e a
reta corta o eixo vertical em 5.

#### A raiz

A raiz é o valor de x que faz f(x) valer zero, ou seja, onde a reta cruza o eixo horizontal. Para
achar, resolva ax + b = 0, o que dá

x = -b/a

**Exemplo 2.** Achar a raiz de f(x) = 2x - 8.
Fazendo 2x - 8 = 0, temos 2x = 8, então x = 4. A reta cruza o eixo horizontal no 4.

#### Montando a lei a partir de dois pontos

Duas informações bastam para determinar uma reta. Se você conhece dois pontos, o coeficiente angular
sai da divisão entre a variação do f e a variação do x:

a = (variação de f) / (variação de x)

**Exemplo 3.** Uma função afim passa pelos pontos (1, 7) e (4, 16). Qual é a lei?
A variação de f é 16 - 7 = 9. A variação de x é 4 - 1 = 3. Então a = 9/3 = 3.
Agora use um dos pontos para achar b: com x = 1, temos 3 × 1 + b = 7, o que dá b = 4.
A lei é f(x) = 3x + 4. Conferindo no outro ponto: 3 × 4 + 4 = 16. Certo.

#### Onde ela aparece de verdade

Sempre que existe um valor fixo somado a um valor que cresce por unidade, há uma função afim
escondida:

- A conta de um táxi: a bandeirada é o b, o preço por quilômetro é o a.
- A conta de luz: a taxa fixa é o b, o preço por quilowatt é o a.
- Um plano de celular: a mensalidade é o b, o preço por minuto excedente é o a.

**Exemplo 4.** Um táxi cobra 5 reais de bandeirada mais 2 reais por quilômetro. Qual é a lei do
preço, e quanto custa uma corrida de 12 quilômetros?
A lei é P(x) = 2x + 5. Para 12 quilômetros: 2 × 12 + 5 = 29 reais.

#### Comparando duas funções afins

Quando duas retas se cruzam, o ponto de encontro é onde as duas funções dão o mesmo valor. Basta
igualar as leis e resolver. Esse é o tipo de questão que aparece em prova como escolha entre dois
planos.

**Exemplo 5.** O plano A custa 40 reais fixos mais 1 real por minuto. O plano B custa 10 reais fixos
mais 4 reais por minuto. A partir de quantos minutos o plano A compensa?
Igualando: 40 + x = 10 + 4x. Resolvendo: 30 = 3x, então x = 10.
Nos 10 minutos os dois custam o mesmo, que é 50 reais. Acima disso, o A fica mais barato, porque
cresce mais devagar.

#### Erros comuns

**Confundir o a com o b.** O a é a inclinação, o b é onde começa. Numa conta de táxi, quem muda com
a distância é o a.

**Achar que a raiz é o b.** A raiz é onde f vale zero, e o b é onde x vale zero. São eixos
diferentes.

**Calcular a taxa de variação ao contrário.** É a variação do f dividida pela variação do x, nessa
ordem.

**Esquecer o domínio no problema real.** Numa corrida de táxi, x negativo não existe. A função
matemática aceita, mas o problema não.

### Exercícios

**Bloco A. Fundamentos**

1. Na função f(x) = 3x + 5, diga quanto valem a e b, e se ela é crescente ou decrescente.
2. Calcule f(2) e f(0) para f(x) = 4x - 7.
3. Determine a raiz de f(x) = 2x - 8.
4. Determine a raiz de f(x) = -3x + 12.
5. Classifique como crescente ou decrescente: f(x) = -2x + 9.

**Bloco B. Consolidação**

6. Uma função afim passa pelos pontos (1, 7) e (4, 16). Determine a lei.
7. Uma função afim passa pelos pontos (0, 5) e (3, -1). Determine a lei.
8. Um táxi cobra 5 reais de bandeirada mais 2 reais por quilômetro. Escreva a lei do preço e calcule
   quanto custa uma corrida de 12 quilômetros.
9. Numa função afim, f(1) = 10 e f(5) = 22. Quanto vale f(9)?
10. Determine o ponto onde as retas f(x) = 2x + 1 e g(x) = -x + 7 se cruzam.
11. Uma reta corta o eixo vertical em 6 e tem taxa de variação -2. Escreva a lei e determine a
    raiz.
12. O plano A custa 40 reais fixos mais 1 real por minuto e o plano B custa 10 reais fixos mais 4
    reais por minuto. A partir de quantos minutos o plano A fica mais barato?
13. Resolva a inequação 3x - 6 > 0 e diga o que ela significa em termos do gráfico de
    f(x) = 3x - 6.

**Bloco C. Aprofundamento**

14. Determine m para que a função f(x) = (m - 2)x + 5 seja decrescente.
15. Uma função afim tem f(3) = 0 e corta o eixo vertical em -9. Determine a lei.
16. Mostre que, numa função afim, a diferença f(x + 1) - f(x) é sempre igual a a, qualquer
    que seja o x. Faça com letras.
17. Um reservatório tem 500 litros e perde 8 litros por hora. Escreva a lei do volume em função do
    tempo, diga em quanto tempo ele esvazia, e explique por que a função só faz sentido até esse
    instante.
18. Duas funções afins têm o mesmo coeficiente angular mas coeficientes lineares diferentes. Elas
    podem se cruzar em algum ponto? Justifique.

### Gabarito

1. a = 3 e b = 5. É crescente, porque a > 0.
2. f(2) = 1 e f(0) = -7.
3. x = 4.
4. x = 4.
5. Decrescente, porque a = -2.
6. f(x) = 3x + 4.
7. f(x) = -2x + 5.
8. A lei é P(x) = 2x + 5, e a corrida de 12 quilômetros custa 29 reais.
9. 34. A taxa de variação é 3, porque de f(1) a f(5) o valor sobe 12 em 4 unidades de x.
10. No ponto (2, 5).
11. A lei é f(x) = -2x + 6, e a raiz é x = 3.
12. A partir de 10 minutos os dois custam igual, e acima de 10 minutos o plano A fica mais barato.
13. A solução é x > 2. Isso significa que o gráfico fica acima do eixo horizontal para x > 2.
14. m < 2.
15. f(x) = 3x - 9.
16. Substituindo, f(x + 1) = a · (x + 1) + b = ax + a + b. Tirando f(x) = ax + b, sobra apenas a.
    Isso mostra que o passo é sempre o mesmo, e é por isso que o gráfico é uma reta.
17. A lei é V(t) = 500 - 8t. Ele esvazia quando V = 0, ou seja, em 62,5 horas. Depois
    disso a fórmula daria volume negativo, que não existe num reservatório, então o domínio do
    problema vai de 0 até 62,5.
18. Não podem. Se os coeficientes angulares são iguais, as retas são paralelas, e ao igualar as duas
    leis o termo com x desaparece, sobrando uma igualdade falsa entre os coeficientes lineares.

## EN

### Explanation

#### What it is

A linear function is any function that can be written as

f(x) = ax + b

where a and b are fixed numbers. Its graph is always a **straight line**, and that is why it shows
up in every situation where a quantity grows or shrinks at a steady rate.

When b = 0, the function becomes f(x) = ax, and the line goes through the origin. That
special case is called a proportional function, and it is the only one where doubling x doubles
f(x).

#### The two coefficients say different things

**The coefficient a is the rate of change, also called the slope.** It says how much f(x) changes
when x goes up by one unit. It is the steepness of the line:

- a > 0: the line rises, and the function is increasing.
- a < 0: the line falls, and the function is decreasing.
- a = 0: the line is horizontal, and the function is constant.

**The coefficient b is the starting value, also called the intercept.** It is f(0), that is, the
point where the line crosses the vertical axis.

**Example 1.** In the function f(x) = 3x + 5, what do the coefficients say?
a is 3: for every unit x moves forward, f(x) rises by 3. b is 5: when x = 0, f is 5, and the
line crosses the vertical axis at 5.

#### The root

The root is the value of x that makes f(x) zero, that is, where the line crosses the horizontal
axis. To find it, solve ax + b = 0, which gives

x = -b/a

**Example 2.** Find the root of f(x) = 2x - 8.
Setting 2x - 8 = 0 gives 2x = 8, so x = 4. The line crosses the horizontal axis at 4.

#### Building the rule from two points

Two pieces of information are enough to pin down a line. If you know two points, the slope comes
from dividing the change in f by the change in x:

a = (change in f) / (change in x)

**Example 3.** A linear function passes through the points (1, 7) and (4, 16). What is its rule?
The change in f is 16 - 7 = 9. The change in x is 4 - 1 = 3. So a = 9/3 = 3.
Now use one of the points to find b: with x = 1, we get 3 × 1 + b = 7, which gives b = 4.
The rule is f(x) = 3x + 4. Checking with the other point: 3 × 4 + 4 = 16. Correct.

#### Where it really shows up

Whenever there is a fixed amount added to an amount that grows per unit, a linear function is
hiding:

- A taxi fare: the flat charge is b, the price per kilometre is a.
- An electricity bill: the standing charge is b, the price per kilowatt is a.
- A phone plan: the monthly fee is b, the price per extra minute is a.

**Example 4.** A taxi charges 5 reais as a flat fee plus 2 reais per kilometre. What is the price
rule, and how much does a 12 kilometre ride cost?
The rule is P(x) = 2x + 5. For 12 kilometres: 2 × 12 + 5 = 29 reais.

#### Comparing two linear functions

When two lines cross, the meeting point is where both functions give the same value. Just set the
rules equal and solve. This is the kind of question that shows up in tests as a choice between two
plans.

**Example 5.** Plan A costs 40 reais fixed plus 1 real per minute. Plan B costs 10 reais fixed plus
4 reais per minute. From how many minutes on is plan A worth it?
Setting them equal: 40 + x = 10 + 4x. Solving: 30 = 3x, so x = 10.
At 10 minutes both cost the same, which is 50 reais. Above that, A is cheaper, because it grows more
slowly.

#### Common mistakes

**Mixing up a and b.** a is the steepness, b is where it starts. In a taxi fare, what changes with
distance is a.

**Thinking the root is b.** The root is where f is zero, and b is where x is zero. Different axes.

**Working out the rate of change upside down.** It is the change in f divided by the change in x, in
that order.

**Forgetting the domain in a real problem.** In a taxi ride, a negative x does not exist. The
mathematical function accepts it, the problem does not.

### Exercises

**Block A. Fundamentals**

1. In the function f(x) = 3x + 5, say what a and b are, and whether it is increasing or
   decreasing.
2. Work out f(2) and f(0) for f(x) = 4x - 7.
3. Find the root of f(x) = 2x - 8.
4. Find the root of f(x) = -3x + 12.
5. Classify as increasing or decreasing: f(x) = -2x + 9.

**Block B. Building up**

6. A linear function passes through the points (1, 7) and (4, 16). Find the rule.
7. A linear function passes through the points (0, 5) and (3, -1). Find the rule.
8. A taxi charges 5 reais as a flat fee plus 2 reais per kilometre. Write the price rule and work
   out how much a 12 kilometre ride costs.
9. In a linear function, f(1) = 10 and f(5) = 22. What is f(9)?
10. Find the point where the lines f(x) = 2x + 1 and g(x) = -x + 7 cross.
11. A line crosses the vertical axis at 6 and has rate of change -2. Write the rule and find the
    root.
12. Plan A costs 40 reais fixed plus 1 real per minute and plan B costs 10 reais fixed plus 4 reais
    per minute. From how many minutes on is plan A cheaper?
13. Solve the inequality 3x - 6 > 0 and say what it means for the graph of
    f(x) = 3x - 6.

**Block C. Going further**

14. Find m so that the function f(x) = (m - 2)x + 5 is decreasing.
15. A linear function has f(3) = 0 and crosses the vertical axis at -9. Find the rule.
16. Show that in a linear function the difference f(x + 1) - f(x) always equals a, whatever x
    is. Do it with letters.
17. A tank holds 500 litres and loses 8 litres per hour. Write the rule for the volume as a function
    of time, say how long it takes to empty, and explain why the function only makes sense up to that
    moment.
18. Two linear functions have the same slope but different intercepts. Can they cross at some point?
    Justify.

### Answer key

1. a = 3 and b = 5. It is increasing, because a > 0.
2. f(2) = 1 and f(0) = -7.
3. x = 4.
4. x = 4.
5. Decreasing, because a = -2.
6. f(x) = 3x + 4.
7. f(x) = -2x + 5.
8. The rule is P(x) = 2x + 5, and the 12 kilometre ride costs 29 reais.
9. 34. The rate of change is 3, because from f(1) to f(5) the value rises 12 over 4 units of x.
10. At the point (2, 5).
11. The rule is f(x) = -2x + 6, and the root is x = 3.
12. At 10 minutes both cost the same, and above 10 minutes plan A is cheaper.
13. The solution is x > 2. That means the graph sits above the horizontal axis for x > 2.
14. m < 2.
15. f(x) = 3x - 9.
16. Substituting, f(x + 1) = a · (x + 1) + b = ax + a + b. Taking away f(x) = ax + b, only a is
    left. That shows the step is always the same, and that is why the graph is a straight line.
17. The rule is V(t) = 500 - 8t. It empties when V = 0, that is, at 62.5 hours. After
    that the formula would give a negative volume, which does not exist in a tank, so the domain of
    the problem runs from 0 to 62.5.
18. They cannot. If the slopes are equal, the lines are parallel, and setting the two rules equal
    makes the x term disappear, leaving a false equality between the intercepts.

## VERIFICACAO

```python
X1: 3*0 + 5 == 5 and (3*1 + 5) - (3*0 + 5) == 3
X2: solve(Eq(2*x - 8, 0), x) == [4]
X3: Rational(16-7, 4-1) == 3 and solve(Eq(3*1 + b, 7), b) == [4] and 3*4 + 4 == 16
X4: 2*12 + 5 == 29
X5: solve(Eq(40 + x, 10 + 4*x), x) == [10] and 40 + 10 == 50 and 10 + 4*10 == 50
E1: 3 > 0
E2: 4*2 - 7 == 1 and 4*0 - 7 == -7
E3: solve(Eq(2*x - 8, 0), x) == [4]
E4: solve(Eq(-3*x + 12, 0), x) == [4]
E5: -2 < 0
E6: solve([Eq(a*1 + b, 7), Eq(a*4 + b, 16)], [a, b]) == {a: 3, b: 4}
E7: solve([Eq(a*0 + b, 5), Eq(a*3 + b, -1)], [a, b]) == {a: -2, b: 5}
E8: 2*12 + 5 == 29
E9: Rational(22-10, 5-1) == 3 and 10 + 3*(9-1) == 34
E10: solve(Eq(2*x + 1, -x + 7), x) == [2] and 2*2 + 1 == 5
E11: solve(Eq(-2*x + 6, 0), x) == [3]
E12: solve(Eq(40 + x, 10 + 4*x), x) == [10]
E13: solveset(3*x - 6 > 0, x, Reals) == Interval.open(2, oo)
E14: solveset(m - 2 < 0, m, Reals) == Interval.open(-oo, 2)
E15: solve([Eq(a*3 + b, 0), Eq(b, -9)], [a, b]) == {a: 3, b: -9}
E16: simplify((a*(x+1) + b) - (a*x + b) - a) == 0
E17: solve(Eq(500 - 8*t, 0), t) == [Rational(125,2)] and Rational(125,2) == Rational(625,10)
E18: solve(Eq(a*x + 3, a*x + 7), x) == []
```
