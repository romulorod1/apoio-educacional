---
id: MATEM1-07
serie: em1
unidade: algebra
titulo_pt: Função exponencial
titulo_en: Exponential function
resumo_pt: Reconhecer a função de base fixa e expoente variável, resolver equações e inequações exponenciais e usar o modelo em crescimento e decaimento.
resumo_en: Recognising the function with fixed base and variable exponent, solving exponential equations and inequalities, and using the model for growth and decay.
prerequisitos: [MATEM1-02]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### A mudança de lugar do x

Até agora o x aparecia na base: em x^{2}, em x^{3}, na raiz. Na função exponencial ele
troca de lugar e vai para o **expoente**. Essa mudança parece pequena e é enorme: a velocidade com
que a função cresce deixa de ser comparável com a de qualquer polinômio.

Uma função exponencial é toda função que pode ser escrita como

f(x) = a^{x}, com a > 0 e a ≠ 1

As duas condições sobre a base existem por bons motivos. Se a fosse negativo, a expressão perderia
sentido para muitos expoentes: 2^{1/2} = √2, mas (-2)^{1/2} não é número real. Se a valesse 1, todo
valor da função seria 1, e sobraria uma função constante, sem nenhuma das propriedades que
interessam aqui. Se a valesse 0, o zero elevado a expoente negativo não existiria.

#### O que já vale das potências

Tudo o que se aprendeu sobre potências continua valendo e é usado o tempo todo:

- a^{m} · a^{n} = a^{m+n}
- a^{m} / a^{n} = a^{m-n}
- (a^{m})^{n} = a^{m·n}
- a^{0} = 1, para qualquer a ≠ 0
- a^{-n} = 1 / a^{n}

Vale a pena guardar de cor as potências pequenas de 2 e de 3, porque quase toda equação exponencial
de prova se resolve reescrevendo os dois lados como potências da mesma base.

#### Crescimento e decrescimento

O comportamento inteiro da função depende de um único detalhe: se a base é maior ou menor que 1.

- **Base maior que 1.** A função é crescente. Quanto maior o x, maior o valor. Em 2^{x}, os
  valores para x = 0, 1, 2 e 3 são 1, 2, 4 e 8.
- **Base entre 0 e 1.** A função é decrescente. Quanto maior o x, menor o valor. Em (1/2)^{x},
  os valores para x = 0, 1, 2 e 3 são 1, 1/2, 1/4 e 1/8.

Em qualquer dos dois casos o resultado é **sempre positivo**. Nenhuma potência de base positiva dá
zero ou número negativo, por maior que seja o expoente negativo. Isso tem uma consequência prática
que resolve muita questão: uma equação como 2^{x} = -8 não tem solução alguma, e não é preciso
conta nenhuma para afirmar isso.

#### O gráfico, descrito em palavras

A curva de f(x) = a^{x} passa sempre pelo ponto (0, 1), porque toda base elevada a zero dá 1. Ela
fica inteira acima do eixo horizontal e nunca o toca. De um lado ela sobe cada vez mais depressa, e
do outro ela se aproxima do eixo horizontal sem encostar, o que se chama de assíntota.

Com base maior que 1, a curva se aproxima do eixo pela esquerda e dispara para cima pela direita.
Com base entre 0 e 1, é o espelho disso: dispara para cima pela esquerda e se aproxima do eixo pela
direita. Trocar a base por seu inverso reflete a curva em torno do eixo vertical.

#### Equações exponenciais: igualar as bases

O caminho padrão é escrever os dois lados como potências da mesma base e depois igualar os
expoentes. Isso é legítimo porque a função exponencial nunca repete valores: se a^{m} = a^{n},
então m = n.

**Exemplo 1.** Resolver 2^{x} = 32.
Como 32 = 2^{5}, a equação vira 2^{x} = 2^{5}. Logo x = 5.

**Exemplo 2.** Resolver 9^{x} = 27^{x-1}.
As duas bases são potências de 3: 9 = 3^{2} e 27 = 3^{3}. A equação fica 3^{2x} = 3^{3x-3}.
Igualando os expoentes, 2x = 3x - 3, e daí x = 3.

#### Quando a equação vira uma do segundo grau

Há um tipo de equação que aparece em toda prova forte: aquela em que a mesma potência aparece
elevada ao quadrado. O passo é trocar a potência por uma letra nova.

**Exemplo 3.** Resolver 4^{x} - 5 · 2^{x} + 4 = 0.
Repare que 4^{x} é o mesmo que (2^{x})^{2}. Chamando 2^{x} de y, a equação vira
y^{2} - 5y + 4 = 0, cujas raízes são y = 1 e y = 4.
Agora volta-se à variável original. De 2^{x} = 1 sai x = 0. De 2^{x} = 4 sai x = 2.

Um cuidado essencial nesse tipo: se alguma raiz em y for negativa ou zero, ela deve ser descartada,
porque 2^{x} nunca assume valor menor ou igual a zero.

#### Inequações exponenciais

Aqui mora a armadilha que mais derruba gente. Ao passar dos dois lados para os expoentes, o sentido
da desigualdade depende da base:

- **Base maior que 1:** a função é crescente, e a desigualdade **mantém** o sentido.
- **Base entre 0 e 1:** a função é decrescente, e a desigualdade **inverte** o sentido.

**Exemplo 4.** Resolver (1/2)^{x} > 8.
Escrevendo 8 como (1/2)^{-3}, a comparação passa a ser entre os expoentes. Como a base está entre
0 e 1, o sinal inverte: x < -3. Conferindo com um valor, para x = -4 a potência vale 16, que de
fato é maior que 8.

#### Crescimento e decaimento

O modelo exponencial descreve toda situação em que a variação é proporcional ao que já existe: juros
sobre juros, população sem restrição de espaço, resfriamento, decaimento radioativo, concentração de
remédio no sangue.

A forma mais prática é pensar em quantas vezes o período característico coube no tempo total.

**Exemplo 5.** Uma cultura de bactérias dobra a cada 3 horas e começa com 200 indivíduos. Quantas
haverá depois de 12 horas?
Em 12 horas cabem 12 ÷ 3, ou seja, 4 períodos de duplicação. Então o total é 200 · 2^{4}, que dá
200 × 16, isto é, 3200 bactérias.

O decaimento funciona igual, com base entre 0 e 1. Meia-vida de 6 horas quer dizer base 1/2 e
período de 6 horas.

#### Erros comuns

**Somar expoentes de bases diferentes.** A propriedade só vale com a mesma base. 2^{3} · 3^{2} não
é 6^{5}.

**Esquecer de inverter a desigualdade com base entre 0 e 1.** É o erro campeão em inequação
exponencial. Antes de comparar expoentes, olhe a base.

**Aceitar raiz negativa na substituição.** Ao trocar 2^{x} por y, o novo y só pode ser positivo.
Raiz negativa em y não gera solução em x.

**Confundir a base com o coeficiente.** Em f(x) = 5 · 2^{x}, a base é 2 e o 5 é apenas o valor
inicial, aquele que a função assume quando x = 0.

### Exercícios

**Bloco A. Fundamentos**

1. Resolva a equação 2^{x} = 32.
2. Resolva a equação 3^{x} = 1/9.
3. Sendo f(x) = 5 · 2^{x}, calcule f(3).
4. Diga se a função f(x) = (1/3)^{x} é crescente ou decrescente, e justifique pelo valor da base.
5. Resolva a equação 4^{x} = 8.

**Bloco B. Consolidação**

6. Resolva a equação 2^{x+1} = 64.
7. Resolva a equação 9^{x} = 27^{x-1}.
8. Resolva a equação 2^{x²-5x} = 64.
9. Resolva a equação 3^{x+1} + 3^{x} = 108.
10. Uma cultura de bactérias dobra a cada 3 horas e começa com 200 indivíduos. Quantas bactérias
    haverá depois de 12 horas?
11. Um medicamento tem meia-vida de 6 horas no organismo. Se o paciente recebe 800 miligramas,
    quanto resta depois de 24 horas?
12. Resolva a inequação 2^{x} > 16.
13. Resolva a inequação (1/2)^{x} > 8.

**Bloco C. Aprofundamento**

14. Resolva a equação 4^{x} - 5 · 2^{x} + 4 = 0.
15. Resolva a equação 9^{x} - 12 · 3^{x} + 27 = 0.
16. Resolva a inequação (1/3)^{x-1} > 9.
17. Determine o valor de a, positivo e diferente de 1, para que o gráfico de f(x) = a^{x} passe
    pelo ponto (3, 8).
18. Uma substância radioativa tem meia-vida de 20 anos. Partindo de 320 gramas, depois de quantos
    anos restarão 10 gramas? Explique por que a resposta seria a mesma partindo de 640 gramas e
    chegando a 20 gramas.

### Gabarito

1. x = 5.
2. x = -2.
3. 40.
4. Decrescente, porque a base vale 1/3, que está entre 0 e 1.
5. x = 3/2.
6. x = 5.
7. x = 3.
8. x = -1 e x = 6.
9. x = 3. Colocando 3^{x} em evidência, a soma vira 4 · 3^{x} = 108, logo 3^{x} = 27.
10. 3200 bactérias.
11. 50 miligramas.
12. x > 4.
13. x < -3. Como a base está entre 0 e 1, a desigualdade inverte ao comparar os expoentes.
14. x = 0 e x = 2.
15. x = 1 e x = 2.
16. x < -1.
17. a = 2.
18. 100 anos. A resposta depende apenas da razão entre a quantidade final e a inicial, que vale
    1/32 nos dois casos, ou seja, 5 meias-vidas.

## EN

### Explanation

#### The x changes places

Until now the x sat in the base: in x^{2}, in x^{3}, inside a root. In the exponential
function it moves to the **exponent**. The change looks small and is enormous: the speed at which
the function grows stops being comparable with that of any polynomial.

An exponential function is any function that can be written as

f(x) = a^{x}, with a > 0 and a ≠ 1

Both conditions on the base exist for good reasons. If a were negative, the expression would lose
meaning for many exponents: 2^{1/2} = √2, but (-2)^{1/2} is not a real number. If a were 1, every
value of the function would be 1, leaving a constant function without any of the properties that
matter here. If a were 0, zero raised to a negative exponent would not exist.

#### What carries over from powers

Everything learned about powers still holds and gets used constantly:

- a^{m} · a^{n} = a^{m+n}
- a^{m} / a^{n} = a^{m-n}
- (a^{m})^{n} = a^{m·n}
- a^{0} = 1, for any a ≠ 0
- a^{-n} = 1 / a^{n}

It pays to know the small powers of 2 and of 3 by heart, because almost every exam exponential
equation is solved by rewriting both sides as powers of the same base.

#### Increasing and decreasing

The whole behaviour of the function depends on a single detail: whether the base is greater or less
than 1.

- **Base greater than 1.** The function is increasing. The larger the x, the larger the value. In
  2^{x}, the values for x = 0, 1, 2 and 3 are 1, 2, 4 and 8.
- **Base between 0 and 1.** The function is decreasing. The larger the x, the smaller the value. In
  (1/2)^{x}, the values for x = 0, 1, 2 and 3 are 1, 1/2, 1/4 and 1/8.

In either case the result is **always positive**. No power of a positive base gives zero or a
negative number, however large the negative exponent. That has a practical consequence which settles
many questions: an equation such as 2^{x} = -8 has no solution at all, and no calculation is needed
to say so.

#### The graph, described in words

The curve of f(x) = a^{x} always passes through the point (0, 1), because any base raised to zero
gives 1. It lies entirely above the horizontal axis and never touches it. On one side it rises
faster and faster, and on the other it approaches the horizontal axis without meeting it, which is
called an asymptote.

With a base greater than 1, the curve approaches the axis on the left and shoots upwards on the
right. With a base between 0 and 1, it is the mirror image: it shoots upwards on the left and
approaches the axis on the right. Replacing the base by its reciprocal reflects the curve about the
vertical axis.

#### Exponential equations: matching the bases

The standard route is to write both sides as powers of the same base and then set the exponents
equal. This is legitimate because an exponential function never repeats a value: if a^{m} = a^{n},
then m = n.

**Example 1.** Solve 2^{x} = 32.
Since 32 = 2^{5}, the equation becomes 2^{x} = 2^{5}. So x = 5.

**Example 2.** Solve 9^{x} = 27^{x-1}.
Both bases are powers of 3: 9 = 3^{2} and 27 = 3^{3}. The equation becomes 3^{2x} = 3^{3x-3}.
Setting the exponents equal, 2x = 3x - 3, and so x = 3.

#### When the equation turns into a quadratic

There is one type that shows up in every demanding exam: the one where the same power appears
squared. The step is to replace that power by a new letter.

**Example 3.** Solve 4^{x} - 5 · 2^{x} + 4 = 0.
Notice that 4^{x} is the same as (2^{x})^{2}. Calling 2^{x} by the name y, the equation becomes
y^{2} - 5y + 4 = 0, whose roots are y = 1 and y = 4. Now go back to the original variable. From
2^{x} = 1 comes x = 0. From 2^{x} = 4 comes x = 2.

One essential care with this type: if a root in y turns out negative or zero, it must be discarded,
because 2^{x} never takes a value less than or equal to zero.

#### Exponential inequalities

Here lies the trap that catches most students. When you move from both sides to the exponents, the
direction of the inequality depends on the base:

- **Base greater than 1:** the function is increasing, and the inequality **keeps** its direction.
- **Base between 0 and 1:** the function is decreasing, and the inequality **reverses**.

**Example 4.** Solve (1/2)^{x} > 8.
Writing 8 as (1/2)^{-3}, the comparison becomes one between exponents. Since the base lies between
0 and 1, the sign reverses: x < -3. Checking with a value, for x = -4 the power is 16, which is
indeed greater than 8.

#### Growth and decay

The exponential model describes every situation in which the change is proportional to what is
already there: interest on interest, population with no space limit, cooling, radioactive decay,
concentration of a medicine in the blood.

The handiest way is to think about how many times the characteristic period fits into the total
time.

**Example 5.** A bacterial culture doubles every 3 hours and starts with 200 individuals. How many
will there be after 12 hours?
In 12 hours there fit 12 ÷ 3, that is, 4 doubling periods. So the total is 200 · 2^{4}, which gives
200 × 16, that is, 3200 bacteria.

Decay works the same way, with a base between 0 and 1. A half-life of 6 hours means base 1/2 and a
period of 6 hours.

#### Common mistakes

**Adding exponents of different bases.** The property only holds for the same base. 2^{3} · 3^{2}
is not 6^{5}.

**Forgetting to reverse the inequality with a base between 0 and 1.** It is the champion mistake in
exponential inequalities. Before comparing exponents, look at the base.

**Accepting a negative root in the substitution.** When you replace 2^{x} by y, the new y can only
be positive. A negative root in y produces no solution in x.

**Mixing up the base with the coefficient.** In f(x) = 5 · 2^{x}, the base is 2 and the 5 is only
the starting value, the one the function takes when x = 0.

### Exercises

**Block A. Fundamentals**

1. Solve the equation 2^{x} = 32.
2. Solve the equation 3^{x} = 1/9.
3. Given f(x) = 5 · 2^{x}, find f(3).
4. Say whether the function f(x) = (1/3)^{x} is increasing or decreasing, and justify it by the
   value of the base.
5. Solve the equation 4^{x} = 8.

**Block B. Building up**

6. Solve the equation 2^{x+1} = 64.
7. Solve the equation 9^{x} = 27^{x-1}.
8. Solve the equation 2^{x²-5x} = 64.
9. Solve the equation 3^{x+1} + 3^{x} = 108.
10. A bacterial culture doubles every 3 hours and starts with 200 individuals. How many bacteria
    will there be after 12 hours?
11. A medicine has a half-life of 6 hours in the body. If the patient receives 800 milligrams, how
    much is left after 24 hours?
12. Solve the inequality 2^{x} > 16.
13. Solve the inequality (1/2)^{x} > 8.

**Block C. Going further**

14. Solve the equation 4^{x} - 5 · 2^{x} + 4 = 0.
15. Solve the equation 9^{x} - 12 · 3^{x} + 27 = 0.
16. Solve the inequality (1/3)^{x-1} > 9.
17. Find the value of a, positive and different from 1, so that the graph of f(x) = a^{x} passes
    through the point (3, 8).
18. A radioactive substance has a half-life of 20 years. Starting from 320 grams, after how many
    years will 10 grams be left? Explain why the answer would be the same starting from 640 grams
    and ending at 20 grams.

### Answer key

1. x = 5.
2. x = -2.
3. 40.
4. Decreasing, because the base is 1/3, which lies between 0 and 1.
5. x = 3/2.
6. x = 5.
7. x = 3.
8. x = -1 and x = 6.
9. x = 3. Taking 3^{x} as a common factor, the sum becomes 4 · 3^{x} = 108, so 3^{x} = 27.
10. 3200 bacteria.
11. 50 milligrams.
12. x > 4.
13. x < -3. Since the base lies between 0 and 1, the inequality reverses when the exponents are
    compared.
14. x = 0 and x = 2.
15. x = 1 and x = 2.
16. x < -1.
17. a = 2.
18. 100 years. The answer depends only on the ratio between the final and the initial amount, which
    is 1/32 in both cases, that is, 5 half-lives.

## VERIFICACAO

```python
X1: 2**5 == 32
X2: 9**3 == 27**(3 - 1)
X3: 4**0 - 5*2**0 + 4 == 0 and 4**2 - 5*2**2 + 4 == 0 and solve(Eq(y**2 - 5*y + 4, 0), y) == [1, 4]
X4: Rational(1,2)**(-3) == 8 and Rational(1,2)**(-4) == 16 and 16 > 8
X5: 200 * 2**Rational(12,3) == 3200
E1: 2**5 == 32
E2: Rational(3)**(-2) == Rational(1,9)
E3: 5 * 2**3 == 40
E4: Rational(1,3)**1 > Rational(1,3)**2
E5: 4**Rational(3,2) == 8
E6: 2**(5 + 1) == 64
E7: 9**3 == 27**(3 - 1)
E8: 2**((-1)**2 - 5*(-1)) == 64 and 2**(6**2 - 5*6) == 64
E9: 3**(3 + 1) + 3**3 == 108
E10: 200 * 2**Rational(12,3) == 3200
E11: 800 * Rational(1,2)**Rational(24,6) == 50
E12: solveset(2**x > 16, x, Reals) == Interval.open(4, oo)
E13: simplify(solveset(Rational(1,2)**x > 8, x, Reals).sup + 3) == 0 and solveset(Rational(1,2)**x > 8, x, Reals).inf == -oo
E14: 4**0 - 5*2**0 + 4 == 0 and 4**2 - 5*2**2 + 4 == 0 and solve(Eq(y**2 - 5*y + 4, 0), y) == [1, 4]
E15: 9**1 - 12*3**1 + 27 == 0 and 9**2 - 12*3**2 + 27 == 0 and solve(Eq(y**2 - 12*y + 27, 0), y) == [3, 9]
E16: simplify(solveset(Rational(1,3)**(x - 1) > 9, x, Reals).sup + 1) == 0 and solveset(Rational(1,3)**(x - 1) > 9, x, Reals).inf == -oo
E17: 2**3 == 8
E18: 320 * Rational(1,2)**5 == 10 and 640 * Rational(1,2)**5 == 20 and 5 * 20 == 100
```
