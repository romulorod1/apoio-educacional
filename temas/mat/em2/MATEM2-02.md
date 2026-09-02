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

Muita coisa no mundo volta ao mesmo estado depois de um tempo fixo. A maré sobe e desce, a
cadeirinha da roda-gigante volta ao ponto de embarque, a temperatura média do dia repete o padrão a
cada 24 horas. Uma função que faz isso se chama **periódica**, e o menor intervalo que se repete é o
**período**.

As funções trigonométricas são o modelo básico desse comportamento. Elas nascem do ciclo: enquanto o
arco cresce sem parar, o ponto correspondente dá voltas, e as coordenadas desse ponto ficam
oscilando.

#### As três funções básicas

**A função seno.** A cada número real x, associa a ordenada do ponto do arco x no ciclo. O domínio é
o conjunto dos números reais, a imagem é o intervalo [-1, 1], e o período é 2π. O gráfico é uma onda
que começa no zero, sobe até 1, volta ao zero, desce até -1 e volta.

**A função cosseno.** Associa a abscissa do ponto. Mesmo domínio, mesma imagem e mesmo período do
seno. O gráfico tem exatamente o mesmo formato de onda, começando em 1.

**A função tangente.** É o quociente tg(x) = sen(x)/cos(x). O domínio exclui os arcos em que o
cosseno é zero, a imagem é todo o conjunto dos números reais, e o período é π, não 2π. Perto dos
pontos excluídos a função dispara para valores muito grandes em valor absoluto.

#### Os quatro parâmetros

A forma que resolve quase todo problema de aplicação é

f(x) = a + b · sen(c · x + d)

Cada letra faz uma coisa, e vale entender uma de cada vez.

- **O parâmetro b controla a amplitude.** A onda passa a variar entre -|b| e |b|, antes de qualquer
  deslocamento.
- **O parâmetro a desloca a onda na vertical.** A imagem passa a ser [a - |b|, a + |b|].
- **O parâmetro c muda o período.** O período vira 2π/|c|. Quanto maior c, mais depressa a onda se
  repete.
- **O parâmetro d desloca a onda na horizontal.**

**Exemplo 1.** Achar o período de f(x) = sen(3x).
O período é 2π/3. A onda completa três oscilações no espaço em que o seno comum completa uma.

**Exemplo 2.** Achar a imagem de f(x) = 4 + 2 · cos(x).
O cosseno varia de -1 a 1. Multiplicando por 2, varia de -2 a 2. Somando 4, varia de 2 a 6.
A imagem é [2, 6].

#### Máximo e mínimo sem cálculo

Como o seno e o cosseno atingem de fato o valor 1 e o valor -1, o máximo e o mínimo saem direto.
Para f(x) = a + b · sen(c · x + d), com b positivo, o máximo é a + b e o mínimo é a - b. Se b for
negativo, os dois trocam de lugar.

#### Equações com essas funções

Resolver uma equação como 2 · sen(x) = √3 é isolar o seno e voltar ao ciclo.

**Exemplo 3.** Resolver 2 · sen(x) = √3, com 0 ≤ x < 2π.
Isolando, sen(x) = √3/2. No ciclo, isso acontece em π/3 e no simétrico em relação ao eixo vertical,
que é 2π/3.

#### Um modelo completo

**Exemplo 4.** A altura em metros de uma cadeirinha de roda-gigante, t minutos após o embarque, é
h(t) = 10 + 8 · sen(πt/6). Achar a altura máxima, a mínima e a duração de uma volta.
A amplitude é 8 e o deslocamento vertical é 10, então a altura vai de 2 a 18 metros. O período é
2π/(π/6) = 12. Uma volta leva 12 minutos.

#### Erros comuns

**Achar que multiplicar por um número muda o período.** O que muda o período é o número que
multiplica o x dentro da função, não o que multiplica a função inteira.

**Dar o período da tangente como 2π.** O período da tangente é π, porque somar π ao arco troca o
sinal do seno e do cosseno ao mesmo tempo, e o quociente não muda.

**Esquecer o deslocamento vertical ao dar a imagem.** A amplitude sozinha não responde: o valor de a
sobe ou desce a onda inteira.

**Resolver uma equação e parar na primeira solução.** Numa volta completa costuma haver duas
soluções, e o enunciado quase sempre pede todas.

### Exercícios

**Bloco A. Fundamentos**

1. Determine o período e a imagem de f(x) = sen(x).
2. Determine o período e a imagem de f(x) = cos(x).
3. Calcule f(π/3) para a função f(x) = 2 · sen(x).
4. Determine o período de f(x) = sen(2x).
5. Determine a imagem de f(x) = 3 · cos(x).

**Bloco B. Consolidação**

6. Determine o período e a imagem de f(x) = 2 + 3 · sen(x).
7. Determine o período de f(x) = cos(x/2).
8. Determine o período e a imagem de f(x) = 4 · sen(3x).
9. Calcule f(π/4) para a função f(x) = 2 + 3 · sen(2x).
10. Determine o valor máximo e o valor mínimo de f(x) = 5 - 2 · cos(x).
11. Determine o período da função tangente e diga para quais arcos ela não está definida.
12. Resolva a equação 2 · sen(x) - 1 = 0, com 0 ≤ x < 2π.
13. A altura em metros de uma cadeirinha de roda-gigante, t minutos após o embarque, é dada por
    h(t) = 6 + 5 · sen(πt/4). Determine a altura máxima, a altura mínima e a duração de uma volta
    completa.
14. Determine todos os valores de x, com 0 ≤ x < 2π, tais que cos(2x) = 1/2.

**Bloco C. Aprofundamento**

15. Uma função da forma f(x) = a + b · sen(x), com b positivo, tem valor máximo 9 e valor mínimo 1.
    Determine a e b.
16. Resolva a equação sen^{2}(x) = sen(x), com 0 ≤ x < 2π.
17. Uma função da forma f(x) = b · cos(c · x), com b positivo e c positivo, tem imagem [-3, 3] e
    período π. Determine b e c.
18. Mostre que a função f(x) = sen(x) · cos(x) tem período π e valor máximo 1/2. Use a identidade
    que escreve o produto como metade do seno do arco dobrado.
19. A temperatura em graus de uma cidade, t horas após a meia-noite, é modelada por
    T(t) = 20 + 6 · sen(πt/12). Determine a temperatura máxima, o instante em que ela
    ocorre e todos os instantes, com 0 ≤ t < 24, em que a temperatura vale 23.

### Gabarito

1. Período 2π e imagem [-1, 1].
2. Período 2π e imagem [-1, 1].
3. √3.
4. Período π.
5. Imagem [-3, 3].
6. Período 2π e imagem [-1, 5].
7. Período 4π.
8. Período 2π/3 e imagem [-4, 4].
9. 5.
10. Máximo 7 e mínimo 3. O cosseno vale -1 no máximo e 1 no mínimo, porque ele aparece subtraído.
11. Período π. Ela não está definida quando o cosseno é zero, ou seja, em x = π/2 + k · π, com k
    inteiro.
12. x = π/6 e x = 5π/6.
13. Altura máxima de 11 metros, altura mínima de 1 metro e volta completa em 8 minutos.
14. x = π/6, x = 5π/6, x = 7π/6 e x = 11π/6.
15. a = 5 e b = 4. O máximo é a + b e o mínimo é a - b, o que dá um sistema de duas equações.
16. x = 0, x = π/2 e x = π. Passando tudo para um lado, sen(x) aparece em evidência, e o produto é
    zero quando o seno vale zero ou vale 1.
17. b = 3 e c = 2. A imagem dá a amplitude e o período dá o fator que multiplica x.
18. O produto do seno pelo cosseno é metade do seno do arco dobrado. Como o seno do arco dobrado tem
    período π na variável x, a função também tem. E como o seno chega a 1, o produto chega a 1/2,
    valor atingido em π/4.
19. Temperatura máxima de 26 graus, atingida em t = 6. A temperatura vale 23 graus em t = 2 e em
    t = 10.

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
circle. The domain is the set of real numbers, the range is the interval [-1, 1], and the period is
2π. The graph is a wave that starts at zero, climbs to 1, returns to zero, drops to -1 and comes
back.

**The cosine function.** It assigns the abscissa of the point. Same domain, same range and same
period as the sine. The graph has exactly the same wave shape, starting at 1.

**The tangent function.** It is the quotient tan(x) = sin(x)/cos(x). The domain leaves out the arcs
where the cosine is zero, the range is the whole set of real numbers, and the period is π, not 2π.
Near the excluded points the function shoots off to values that are very large in absolute value.

#### The four parameters

The form that solves almost every applied problem is

f(x) = a + b · sin(c · x + d)

Each letter does one job, and it is worth understanding them one at a time.

- **The parameter b controls the amplitude.** The wave now swings between -|b| and |b|, before any
  shift.
- **The parameter a shifts the wave vertically.** The range now is [a - |b|, a + |b|].
- **The parameter c changes the period.** The period becomes 2π/|c|. The larger c is, the faster the
  wave repeats.
- **The parameter d shifts the wave horizontally.**

**Example 1.** Find the period of f(x) = sin(3x).
The period is 2π/3. The wave completes three oscillations in the space where the plain sine
completes one.

**Example 2.** Find the range of f(x) = 4 + 2 · cos(x).
The cosine varies from -1 to 1. Multiplied by 2, it varies from -2 to 2. Adding 4, it varies from 2
to 6. The range is [2, 6].

#### Maximum and minimum without calculus

Since the sine and the cosine really do reach the value 1 and the value -1, the maximum and the
minimum come out directly. For f(x) = a + b · sin(c · x + d), with b positive, the maximum is a + b
and the minimum is a - b. If b is negative, the two swap places.

#### Equations with these functions

Solving an equation such as 2 · sin(x) = √3 means isolating the sine and going back to the circle.

**Example 3.** Solve 2 · sin(x) = √3, with 0 ≤ x < 2π.
Isolating, sin(x) = √3/2. On the circle this happens at π/3 and at its mirror image across the
vertical axis, which is 2π/3.

#### A complete model

**Example 4.** The height in metres of a ferris wheel car, t minutes after boarding, is
h(t) = 10 + 8 · sin(πt/6). Find the maximum height, the minimum height and how long one
turn takes.
The amplitude is 8 and the vertical shift is 10, so the height runs from 2 to 18 metres. The period
is 2π/(π/6) = 12. One turn takes 12 minutes.

#### Common mistakes

**Thinking that multiplying by a number changes the period.** What changes the period is the number
multiplying x inside the function, not the one multiplying the whole function.

**Giving the period of the tangent as 2π.** The period of the tangent is π, because adding π to the
arc flips the sign of the sine and of the cosine at the same time, and the quotient does not change.

**Forgetting the vertical shift when stating the range.** The amplitude alone does not answer it:
the value of a raises or lowers the whole wave.

**Solving an equation and stopping at the first solution.** Over a full turn there are usually two
solutions, and the problem nearly always asks for all of them.

### Exercises

**Block A. Fundamentals**

1. Find the period and the range of f(x) = sin(x).
2. Find the period and the range of f(x) = cos(x).
3. Find f(π/3) for the function f(x) = 2 · sin(x).
4. Find the period of f(x) = sin(2x).
5. Find the range of f(x) = 3 · cos(x).

**Block B. Building up**

6. Find the period and the range of f(x) = 2 + 3 · sin(x).
7. Find the period of f(x) = cos(x/2).
8. Find the period and the range of f(x) = 4 · sin(3x).
9. Find f(π/4) for the function f(x) = 2 + 3 · sin(2x).
10. Find the maximum and the minimum value of f(x) = 5 - 2 · cos(x).
11. Find the period of the tangent function and say for which arcs it is not defined.
12. Solve the equation 2 · sin(x) - 1 = 0, with 0 ≤ x < 2π.
13. The height in metres of a ferris wheel car, t minutes after boarding, is given by
    h(t) = 6 + 5 · sin(πt/4). Find the maximum height, the minimum height and how long
    one full turn takes.
14. Find every value of x, with 0 ≤ x < 2π, such that cos(2x) = 1/2.

**Block C. Going further**

15. A function of the form f(x) = a + b · sin(x), with b positive, has maximum value 9 and minimum
    value 1. Find a and b.
16. Solve the equation sin^{2}(x) = sin(x), with 0 ≤ x < 2π.
17. A function of the form f(x) = b · cos(c · x), with b positive and c positive, has range [-3, 3]
    and period π. Find b and c.
18. Show that the function f(x) = sin(x) · cos(x) has period π and maximum value 1/2. Use the
    identity that writes the product as half the sine of the doubled arc.
19. The temperature in degrees of a town, t hours after midnight, is modelled by
    T(t) = 20 + 6 · sin(πt/12). Find the maximum temperature, the moment it happens
    and every moment, with 0 ≤ t < 24, when the temperature is 23.

### Answer key

1. Period 2π and range [-1, 1].
2. Period 2π and range [-1, 1].
3. √3.
4. Period π.
5. Range [-3, 3].
6. Period 2π and range [-1, 5].
7. Period 4π.
8. Period 2π/3 and range [-4, 4].
9. 5.
10. Maximum 7 and minimum 3. The cosine is -1 at the maximum and 1 at the minimum, because it
    appears subtracted.
11. Period π. It is not defined when the cosine is zero, that is, at x = π/2 + k · π, with k a whole
    number.
12. x = π/6 and x = 5π/6.
13. Maximum height of 11 metres, minimum height of 1 metre, and one full turn in 8 minutes.
14. x = π/6, x = 5π/6, x = 7π/6 and x = 11π/6.
15. a = 5 and b = 4. The maximum is a + b and the minimum is a - b, which gives a system of two
    equations.
16. x = 0, x = π/2 and x = π. Moving everything to one side puts sin(x) in evidence, and the product
    is zero when the sine is zero or equals 1.
17. b = 3 and c = 2. The range gives the amplitude and the period gives the factor multiplying x.
18. The product of sine and cosine is half the sine of the doubled arc. Since the sine of the
    doubled arc has period π in the variable x, the function has it too. And since the sine reaches
    1, the product reaches 1/2, a value attained at π/4.
19. Maximum temperature of 26 degrees, reached at t = 6. The temperature is 23 degrees at t = 2 and
    at t = 10.

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
