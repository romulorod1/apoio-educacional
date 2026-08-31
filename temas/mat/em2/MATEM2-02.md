---
id: MATEM2-02
serie: em2
unidade: algebra
titulo_pt: Funções trigonométricas
titulo_en: Trigonometric functions
resumo_pt: Reconhecer período, imagem e deslocamentos das funções seno, cosseno e tangente, e usá-las para descrever fenômenos que se repetem.
resumo_en: Recognising period, range and shifts of the sine, cosine and tangent functions, and using them to describe repeating phenomena.
prerequisitos: [MATEM2-01]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### A ideia: função que se repete

Muita coisa no mundo volta ao mesmo estado depois de um tempo fixo. A maré sobe e desce, a cadeirinha
da roda-gigante volta ao ponto de embarque, a temperatura média do dia repete o padrão a cada 24
horas. Uma função que faz isso se chama **periódica**, e o menor intervalo que se repete é o
**período**.

As funções trigonométricas são o modelo básico desse comportamento. Elas nascem do ciclo: enquanto o
arco cresce sem parar, o ponto correspondente dá voltas, e as coordenadas desse ponto ficam
oscilando.

#### As três funções básicas

**A função seno.** A cada número real x, associa a ordenada do ponto do arco x no ciclo. O domínio é
o conjunto dos números reais, a imagem vai de menos 1 a 1, e o período é 2 pi. O gráfico é uma onda
que começa no zero, sobe até 1, volta ao zero, desce até menos 1 e volta.

**A função cosseno.** Associa a abscissa do ponto. Mesmo domínio, mesma imagem e mesmo período do
seno. O gráfico tem exatamente o mesmo formato de onda, começando em 1.

**A função tangente.** É o seno dividido pelo cosseno. O domínio exclui os arcos em que o cosseno é
zero, a imagem é todo o conjunto dos números reais, e o período é pi, não 2 pi. Perto dos pontos
excluídos a função dispara para valores muito grandes em valor absoluto.

#### Os quatro parâmetros

A forma que resolve quase todo problema de aplicação é

f(x) igual a a mais b vezes o seno de (c x mais d)

Cada letra faz uma coisa, e vale entender uma de cada vez.

- **O parâmetro b controla a amplitude.** A onda passa a variar entre menos o valor absoluto de b e o
  valor absoluto de b, antes de qualquer deslocamento.
- **O parâmetro a desloca a onda na vertical.** A imagem passa a ir de a menos o valor absoluto de b
  até a mais o valor absoluto de b.
- **O parâmetro c muda o período.** O período vira 2 pi dividido pelo valor absoluto de c. Quanto
  maior c, mais depressa a onda se repete.
- **O parâmetro d desloca a onda na horizontal.**

**Exemplo 1.** Achar o período de f(x) igual ao seno de 3x.
O período é 2 pi dividido por 3, ou seja, 2 pi sobre 3. A onda completa três oscilações no espaço em
que o seno comum completa uma.

**Exemplo 2.** Achar a imagem de f(x) igual a 4 mais 2 vezes o cosseno de x.
O cosseno varia de menos 1 a 1. Multiplicando por 2, varia de menos 2 a 2. Somando 4, varia de 2 a 6.
A imagem vai de 2 a 6.

#### Máximo e mínimo sem cálculo

Como o seno e o cosseno atingem de fato o valor 1 e o valor menos 1, o máximo e o mínimo saem
direto. Para f(x) igual a a mais b vezes o seno de alguma coisa, com b positivo, o máximo é a mais b
e o mínimo é a menos b. Se b for negativo, os dois trocam de lugar.

#### Equações com essas funções

Resolver uma equação como 2 vezes o seno de x igual a raiz de 3 é isolar o seno e voltar ao ciclo.

**Exemplo 3.** Resolver 2 vezes o seno de x igual a raiz de 3, com x maior ou igual a 0 e menor que 2
pi.
Isolando, o seno de x vale raiz de 3 sobre 2. No ciclo, isso acontece em pi sobre 3 e no simétrico em
relação ao eixo vertical, que é 2 pi sobre 3.

#### Um modelo completo

**Exemplo 4.** A altura em metros de uma cadeirinha de roda-gigante, t minutos após o embarque, é
h(t) igual a 10 mais 8 vezes o seno de (pi t sobre 6). Achar a altura máxima, a mínima e a duração de
uma volta.
A amplitude é 8 e o deslocamento vertical é 10, então a altura vai de 2 a 18 metros. O período é 2 pi
dividido por pi sobre 6, que dá 12. Uma volta leva 12 minutos.

#### Erros comuns

**Achar que multiplicar por um número muda o período.** O que muda o período é o número que
multiplica o x dentro da função, não o que multiplica a função inteira.

**Dar o período da tangente como 2 pi.** O período da tangente é pi, porque somar pi ao arco troca o
sinal do seno e do cosseno ao mesmo tempo, e o quociente não muda.

**Esquecer o deslocamento vertical ao dar a imagem.** A amplitude sozinha não responde: o valor de a
sobe ou desce a onda inteira.

**Resolver uma equação e parar na primeira solução.** Numa volta completa costuma haver duas
soluções, e o enunciado quase sempre pede todas.

### Exercícios

**Bloco A. Fundamentos**

1. Determine o período e a imagem de f(x) igual ao seno de x.
2. Determine o período e a imagem de f(x) igual ao cosseno de x.
3. Calcule f de pi sobre 3 para a função f(x) igual a 2 vezes o seno de x.
4. Determine o período de f(x) igual ao seno de 2x.
5. Determine a imagem de f(x) igual a 3 vezes o cosseno de x.

**Bloco B. Consolidação**

6. Determine o período e a imagem de f(x) igual a 2 mais 3 vezes o seno de x.
7. Determine o período de f(x) igual ao cosseno de x sobre 2.
8. Determine o período e a imagem de f(x) igual a 4 vezes o seno de 3x.
9. Calcule f de pi sobre 4 para a função f(x) igual a 2 mais 3 vezes o seno de 2x.
10. Determine o valor máximo e o valor mínimo de f(x) igual a 5 menos 2 vezes o cosseno de x.
11. Determine o período da função tangente e diga para quais arcos ela não está definida.
12. Resolva a equação 2 vezes o seno de x, menos 1, igual a zero, com x maior ou igual a 0 e menor
    que 2 pi.
13. A altura em metros de uma cadeirinha de roda-gigante, t minutos após o embarque, é dada por h(t)
    igual a 6 mais 5 vezes o seno de (pi t sobre 4). Determine a altura máxima, a altura mínima e a
    duração de uma volta completa.
14. Determine todos os valores de x, com x maior ou igual a 0 e menor que 2 pi, tais que o cosseno de
    2x vale 1 sobre 2.

**Bloco C. Aprofundamento**

15. Uma função da forma f(x) igual a a mais b vezes o seno de x, com b positivo, tem valor máximo 9 e
    valor mínimo 1. Determine a e b.
16. Resolva a equação o quadrado do seno de x igual ao seno de x, com x maior ou igual a 0 e menor
    que 2 pi.
17. Uma função da forma f(x) igual a b vezes o cosseno de cx, com b positivo e c positivo, tem imagem
    de menos 3 a 3 e período pi. Determine b e c.
18. Mostre que a função f(x) igual ao seno de x vezes o cosseno de x tem período pi e valor máximo 1
    sobre 2. Use a identidade que escreve o produto como metade do seno do arco dobrado.
19. A temperatura em graus de uma cidade, t horas após a meia-noite, é modelada por T(t) igual a 20
    mais 6 vezes o seno de (pi t sobre 12). Determine a temperatura máxima, o instante em que ela
    ocorre e todos os instantes, com t maior ou igual a 0 e menor que 24, em que a temperatura vale
    23.

### Gabarito

1. Período 2 pi e imagem de menos 1 a 1.
2. Período 2 pi e imagem de menos 1 a 1.
3. Raiz de 3.
4. Período pi.
5. Imagem de menos 3 a 3.
6. Período 2 pi e imagem de menos 1 a 5.
7. Período 4 pi.
8. Período 2 pi sobre 3 e imagem de menos 4 a 4.
9. 5.
10. Máximo 7 e mínimo 3. O cosseno vale menos 1 no máximo e 1 no mínimo, porque ele aparece
    subtraído.
11. Período pi. Ela não está definida quando o cosseno é zero, ou seja, em pi sobre 2 somado a
    qualquer múltiplo inteiro de pi.
12. x igual a pi sobre 6 e x igual a 5 pi sobre 6.
13. Altura máxima de 11 metros, altura mínima de 1 metro e volta completa em 8 minutos.
14. x igual a pi sobre 6, x igual a 5 pi sobre 6, x igual a 7 pi sobre 6 e x igual a 11 pi sobre 6.
15. a igual a 5 e b igual a 4. O máximo é a mais b e o mínimo é a menos b, o que dá um sistema de
    duas equações.
16. x igual a 0, x igual a pi sobre 2 e x igual a pi. Passando tudo para um lado, o seno de x aparece
    em evidência, e o produto é zero quando o seno vale zero ou vale 1.
17. b igual a 3 e c igual a 2. A imagem dá a amplitude e o período dá o fator que multiplica x.
18. O produto do seno pelo cosseno é metade do seno do arco dobrado. Como o seno do arco dobrado tem
    período pi na variável x, a função também tem. E como o seno chega a 1, o produto chega a 1 sobre
    2, valor atingido em pi sobre 4.
19. Temperatura máxima de 26 graus, atingida em t igual a 6. A temperatura vale 23 graus em t igual a
    2 e em t igual a 10.

## EN

### Explanation

#### The idea: a function that repeats

Plenty of things in the world return to the same state after a fixed time. The tide rises and falls,
a ferris wheel car returns to the boarding point, the average daily temperature repeats its pattern
every 24 hours. A function that behaves like this is called **periodic**, and the shortest interval
that repeats is the **period**.

Trigonometric functions are the basic model of that behaviour. They come from the circle: while the
arc grows without stopping, the matching point goes round and round, and the coordinates of that
point keep oscillating.

#### The three basic functions

**The sine function.** To each real number x it assigns the ordinate of the point of arc x on the
circle. The domain is the set of real numbers, the range runs from minus 1 to 1, and the period is 2
pi. The graph is a wave that starts at zero, climbs to 1, returns to zero, drops to minus 1 and comes
back.

**The cosine function.** It assigns the abscissa of the point. Same domain, same range and same
period as the sine. The graph has exactly the same wave shape, starting at 1.

**The tangent function.** It is the sine divided by the cosine. The domain leaves out the arcs where
the cosine is zero, the range is the whole set of real numbers, and the period is pi, not 2 pi. Near
the excluded points the function shoots off to values that are very large in absolute value.

#### The four parameters

The form that solves almost every applied problem is

f(x) equals a plus b times the sine of (c x plus d)

Each letter does one job, and it is worth understanding them one at a time.

- **The parameter b controls the amplitude.** The wave now swings between minus the absolute value of
  b and the absolute value of b, before any shift.
- **The parameter a shifts the wave vertically.** The range now runs from a minus the absolute value
  of b up to a plus the absolute value of b.
- **The parameter c changes the period.** The period becomes 2 pi divided by the absolute value of c.
  The larger c is, the faster the wave repeats.
- **The parameter d shifts the wave horizontally.**

**Example 1.** Find the period of f(x) equals the sine of 3x.
The period is 2 pi divided by 3, that is, 2 pi over 3. The wave completes three oscillations in the
space where the plain sine completes one.

**Example 2.** Find the range of f(x) equals 4 plus 2 times the cosine of x.
The cosine varies from minus 1 to 1. Multiplied by 2, it varies from minus 2 to 2. Adding 4, it
varies from 2 to 6. The range runs from 2 to 6.

#### Maximum and minimum without calculus

Since the sine and the cosine really do reach the value 1 and the value minus 1, the maximum and the
minimum come out directly. For f(x) equals a plus b times the sine of something, with b positive, the
maximum is a plus b and the minimum is a minus b. If b is negative, the two swap places.

#### Equations with these functions

Solving an equation such as 2 times the sine of x equals square root of 3 means isolating the sine
and going back to the circle.

**Example 3.** Solve 2 times the sine of x equals square root of 3, with x greater than or equal to 0
and less than 2 pi.
Isolating, the sine of x is square root of 3 over 2. On the circle this happens at pi over 3 and at
its mirror image across the vertical axis, which is 2 pi over 3.

#### A complete model

**Example 4.** The height in metres of a ferris wheel car, t minutes after boarding, is h(t) equals
10 plus 8 times the sine of (pi t over 6). Find the maximum height, the minimum height and how long
one turn takes.
The amplitude is 8 and the vertical shift is 10, so the height runs from 2 to 18 metres. The period
is 2 pi divided by pi over 6, which gives 12. One turn takes 12 minutes.

#### Common mistakes

**Thinking that multiplying by a number changes the period.** What changes the period is the number
multiplying x inside the function, not the one multiplying the whole function.

**Giving the period of the tangent as 2 pi.** The period of the tangent is pi, because adding pi to
the arc flips the sign of the sine and of the cosine at the same time, and the quotient does not
change.

**Forgetting the vertical shift when stating the range.** The amplitude alone does not answer it: the
value of a raises or lowers the whole wave.

**Solving an equation and stopping at the first solution.** Over a full turn there are usually two
solutions, and the problem nearly always asks for all of them.

### Exercises

**Block A. Fundamentals**

1. Find the period and the range of f(x) equals the sine of x.
2. Find the period and the range of f(x) equals the cosine of x.
3. Find f of pi over 3 for the function f(x) equals 2 times the sine of x.
4. Find the period of f(x) equals the sine of 2x.
5. Find the range of f(x) equals 3 times the cosine of x.

**Block B. Building up**

6. Find the period and the range of f(x) equals 2 plus 3 times the sine of x.
7. Find the period of f(x) equals the cosine of x over 2.
8. Find the period and the range of f(x) equals 4 times the sine of 3x.
9. Find f of pi over 4 for the function f(x) equals 2 plus 3 times the sine of 2x.
10. Find the maximum and the minimum value of f(x) equals 5 minus 2 times the cosine of x.
11. Find the period of the tangent function and say for which arcs it is not defined.
12. Solve the equation 2 times the sine of x, minus 1, equals zero, with x greater than or equal to 0
    and less than 2 pi.
13. The height in metres of a ferris wheel car, t minutes after boarding, is given by h(t) equals 6
    plus 5 times the sine of (pi t over 4). Find the maximum height, the minimum height and how long
    one full turn takes.
14. Find every value of x, with x greater than or equal to 0 and less than 2 pi, such that the cosine
    of 2x equals 1 over 2.

**Block C. Going further**

15. A function of the form f(x) equals a plus b times the sine of x, with b positive, has maximum
    value 9 and minimum value 1. Find a and b.
16. Solve the equation the square of the sine of x equals the sine of x, with x greater than or equal
    to 0 and less than 2 pi.
17. A function of the form f(x) equals b times the cosine of cx, with b positive and c positive, has
    range from minus 3 to 3 and period pi. Find b and c.
18. Show that the function f(x) equals the sine of x times the cosine of x has period pi and maximum
    value 1 over 2. Use the identity that writes the product as half the sine of the doubled arc.
19. The temperature in degrees of a town, t hours after midnight, is modelled by T(t) equals 20 plus
    6 times the sine of (pi t over 12). Find the maximum temperature, the moment it happens and every
    moment, with t greater than or equal to 0 and less than 24, when the temperature is 23.

### Answer key

1. Period 2 pi and range from minus 1 to 1.
2. Period 2 pi and range from minus 1 to 1.
3. Square root of 3.
4. Period pi.
5. Range from minus 3 to 3.
6. Period 2 pi and range from minus 1 to 5.
7. Period 4 pi.
8. Period 2 pi over 3 and range from minus 4 to 4.
9. 5.
10. Maximum 7 and minimum 3. The cosine is minus 1 at the maximum and 1 at the minimum, because it
    appears subtracted.
11. Period pi. It is not defined when the cosine is zero, that is, at pi over 2 added to any whole
    multiple of pi.
12. x equals pi over 6 and x equals 5 pi over 6.
13. Maximum height of 11 metres, minimum height of 1 metre, and one full turn in 8 minutes.
14. x equals pi over 6, x equals 5 pi over 6, x equals 7 pi over 6 and x equals 11 pi over 6.
15. a equals 5 and b equals 4. The maximum is a plus b and the minimum is a minus b, which gives a
    system of two equations.
16. x equals 0, x equals pi over 2 and x equals pi. Moving everything to one side puts the sine of x
    in evidence, and the product is zero when the sine is zero or equals 1.
17. b equals 3 and c equals 2. The range gives the amplitude and the period gives the factor
    multiplying x.
18. The product of sine and cosine is half the sine of the doubled arc. Since the sine of the doubled
    arc has period pi in the variable x, the function has it too. And since the sine reaches 1, the
    product reaches 1 over 2, a value attained at pi over 4.
19. Maximum temperature of 26 degrees, reached at t equals 6. The temperature is 23 degrees at t
    equals 2 and at t equals 10.

## VERIFICACAO

```python
X1: 2*pi/3 == 2*pi/3 and simplify(sin(3*(x + 2*pi/3)) - sin(3*x)) == 0
X2: 4 - 2 == 2 and 4 + 2 == 6
X3: solveset(Eq(2*sin(x), sqrt(3)), x, Interval.Ropen(0, 2*pi)) == FiniteSet(pi/3, 2*pi/3)
X4: 10 - 8 == 2 and 10 + 8 == 18 and 2*pi/(pi/6) == 12
E1: simplify(sin(x + 2*pi) - sin(x)) == 0 and sin(pi/2) == 1 and sin(3*pi/2) == -1
E2: simplify(cos(x + 2*pi) - cos(x)) == 0 and cos(0) == 1 and cos(pi) == -1
E3: 2*sin(pi/3) == sqrt(3)
E4: 2*pi/2 == pi and simplify(sin(2*(x + pi)) - sin(2*x)) == 0
E5: 3*1 == 3 and 3*(-1) == -3
E6: 2*pi == 2*pi and 2 - 3 == -1 and 2 + 3 == 5
E7: 2*pi/Rational(1,2) == 4*pi
E8: 2*pi/3 == 2*pi/3 and 4*1 == 4 and 4*(-1) == -4
E9: 2 + 3*sin(2*(pi/4)) == 5
E10: 5 - 2*(-1) == 7 and 5 - 2*1 == 3
E11: simplify(tan(x + pi) - tan(x)) == 0 and cos(pi/2) == 0
E12: solveset(Eq(2*sin(x) - 1, 0), x, Interval.Ropen(0, 2*pi)) == FiniteSet(pi/6, 5*pi/6)
E13: 6 + 5 == 11 and 6 - 5 == 1 and 2*pi/(pi/4) == 8
E14: solveset(Eq(cos(2*x), Rational(1,2)), x, Interval.Ropen(0, 2*pi)) == FiniteSet(pi/6, 5*pi/6, 7*pi/6, 11*pi/6)
E15: solve([Eq(a + b, 9), Eq(a - b, 1)], [a, b]) == {a: 5, b: 4}
E16: solveset(Eq(sin(x)**2, sin(x)), x, Interval.Ropen(0, 2*pi)) == FiniteSet(0, pi/2, pi)
E17: solve(Eq(2*pi/c, pi), c) == [2] and 3*1 == 3
E18: simplify(sin(x)*cos(x) - sin(2*x)/2) == 0 and simplify(sin(x + pi)*cos(x + pi) - sin(x)*cos(x)) == 0 and sin(pi/4)*cos(pi/4) == Rational(1,2)
E19: 20 + 6 == 26 and solve(Eq(pi*t/12, pi/2), t) == [6] and solveset(Eq(20 + 6*sin(pi*t/12), 23), t, Interval.Ropen(0, 24)) == FiniteSet(2, 10)
```
