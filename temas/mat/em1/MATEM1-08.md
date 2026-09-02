---
id: MATEM1-08
serie: em1
unidade: algebra
titulo_pt: Logaritmos: definição e propriedades
titulo_en: Logarithms: definition and properties
resumo_pt: Entender o logaritmo como o expoente que falta, respeitar as condições de existência e operar com as propriedades do produto, do quociente, da potência e da mudança de base.
resumo_en: Understanding the logarithm as the missing exponent, respecting the existence conditions and working with the product, quotient, power and change of base properties.
prerequisitos: [MATEM1-07]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### A pergunta que o logaritmo responde

Numa potência há três números envolvidos: a base, o expoente e o resultado. Sabendo a base e o
expoente, a potência dá o resultado. O logaritmo faz o caminho contrário: dados a base e o
resultado, ele devolve **o expoente**.

Se alguém pergunta "a quanto preciso elevar 2 para chegar a 32", a resposta é 5. Escrevendo isso em
símbolos:

log_{2} 32 = 5, porque 2^{5} = 32

Lemos "log na base 2 de 32 é igual a 5, porque 2 elevado a 5 é igual a 32". Essa linha inteira
é a definição. Sempre que travar numa questão de logaritmo, volte a ela e leia em voz alta: o
logaritmo é o expoente.

#### A definição em geral

log_{a} b = c quando a^{c} = b

O número a é a **base**, o número b é o **logaritmando** e o número c é o **logaritmo**.

**Exemplo 1.** Calcular log_{2} 32.
Procura-se o expoente que leva 2 até 32. Como 2^{5} = 32, o logaritmo vale 5.

**Exemplo 2.** Calcular log_{3} (1/9).
Procura-se o expoente que leva 3 até 1/9. Como 3^{-2} = 1/9, o logaritmo vale -2. Logaritmo negativo
é perfeitamente normal e acontece sempre que o logaritmando está entre 0 e 1.

#### Condições de existência

Três restrições nascem direto da função exponencial e precisam ser conferidas em toda questão:

- **A base precisa ser positiva:** a > 0. Potência de base negativa não cobre os expoentes
  fracionários.
- **A base precisa ser diferente de 1:** a ≠ 1. Toda potência de 1 vale 1, então só existiria
  logaritmo de 1, e ele teria infinitas respostas.
- **O logaritmando precisa ser positivo:** b > 0. A função exponencial de base positiva nunca produz
  zero nem número negativo, então não há expoente que leve a um resultado negativo.

Guardar essas três condições vale metade da nota em prova, porque muita equação logarítmica produz
soluções falsas que só são eliminadas por elas.

#### Consequências imediatas da definição

- log_{a} 1 = 0, porque a^{0} = 1.
- log_{a} a = 1, porque a^{1} = a.
- Se c = log_{a} b, então a^{c} = b, o que é apenas a definição escrita de outro jeito.

#### As três propriedades operatórias

Elas vêm das propriedades de potência e transformam multiplicação em soma, o que foi o motivo
histórico da invenção do logaritmo.

**Produto.** log_{a} (m · n) = log_{a} m + log_{a} n

**Quociente.** log_{a} (m / n) = log_{a} m - log_{a} n

**Potência.** log_{a} m^{k} = k · log_{a} m

A propriedade da potência é a mais rentável das três, porque tira o expoente de dentro e o coloca
multiplicando na frente. É ela que permite resolver equações em que a incógnita está no expoente.

**Exemplo 3.** Sabendo que log_{10} 2 vale aproximadamente 0,30 e que log_{10} 3 vale
aproximadamente 0,48, calcular log_{10} 12.
Como 12 = 4 × 3 e 4 = 2^{2}, o logaritmo vira 2 · log_{10} 2 + log_{10} 3. Isso dá
2 × 0,30 + 0,48 = 1,08.

Atenção a um par de igualdades que não existem: log_{a} (m + n) não é log_{a} m + log_{a} n, e
log_{a} (m / n) não é (log_{a} m) / (log_{a} n).

#### Mudança de base

Quando a base atrapalha, troca-se de base com

log_{a} b = (log_{c} b) / (log_{c} a)

**Exemplo 4.** Calcular log_{8} 32.
Passando tudo para a base 2: log_{2} 32 = 5 e log_{2} 8 = 3. Então o resultado é 5/3.

Um caso particular útil sai daí: log_{a} b = 1 / (log_{b} a).

#### Logaritmo decimal

Quando a base é 10 costuma-se omiti-la e escrever apenas log b. Esse logaritmo mede a ordem de
grandeza: se o logaritmo decimal de um número está entre 3 e 4, o número está entre mil e dez mil, e
portanto tem 4 algarismos. Essa leitura resolve as questões clássicas sobre quantos algarismos tem
uma potência grande.

#### Equações logarítmicas e a verificação obrigatória

O procedimento tem três passos: escrever as condições de existência, usar as propriedades para
juntar tudo num único logaritmo, e voltar à forma de potência. O terceiro passo costuma produzir uma
equação do segundo grau, e é aí que aparecem raízes que não servem.

**Exemplo 5.** Resolver log_{2} (x - 1) + log_{2} (x + 1) = 3.
As condições de existência pedem x > 1. Juntando os dois logaritmos, log_{2} (x^{2} - 1) = 3, e
portanto x^{2} - 1 = 8. Daí x^{2} = 9, e as raízes são 3 e -3. A raiz negativa não cumpre a condição
e é descartada. A resposta é x = 3.

#### Quando a base é a incógnita

Se a letra aparece na base, as restrições passam a valer sobre ela: a base tem que ser positiva e
diferente de 1. Numa equação como log_{x} 16 = 2, a definição dá x^{2} = 16, cujas raízes são 4 e
-4. Só o 4 é aceito, porque base negativa não existe.

#### Erros comuns

**Trocar a base pelo logaritmando.** log_{2} 8 = 3, e log_{8} 2 = 1/3. A ordem importa.

**Distribuir o logaritmo sobre uma soma.** O logaritmo de uma soma não se separa. Só produto,
quociente e potência têm regra.

**Esquecer a verificação final.** Uma equação logarítmica pode gerar raiz que deixa o logaritmando
negativo. Sem conferir, entra resposta errada no gabarito.

**Aplicar a propriedade da potência ao logaritmando errado.** O expoente que sai para a frente é o
do logaritmando, não o da base.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule log_{2} 64.
2. Calcule log_{5} (1/25).
3. Calcule log_{9} 3.
4. Resolva a equação log_{2} x = 5.
5. Calcule log_{10} 1000.

**Bloco B. Consolidação**

6. Sabendo que log_{10} 2 vale aproximadamente 0,30, calcule log_{10} 8.
7. Sabendo que log_{10} 2 vale aproximadamente 0,30 e que log_{10} 3 vale aproximadamente 0,48,
   calcule log_{10} 6.
8. Escreva log_{10} (x^{2} · y) usando logaritmos de x e de y separados.
9. Resolva a equação log_{3} (2x - 1) = 2.
10. Resolva a equação log_{2} x + log_{2} (x - 2) = 3.
11. Calcule log_{8} 32 usando mudança de base.
12. Resolva a equação log_{10} (x + 3) - log_{10} x = 1.
13. Determine todos os valores de x para os quais existe log_{2} (x - 5).

**Bloco C. Aprofundamento**

14. Resolva a equação log_{2} (x + 1) + log_{2} (x - 1) = 3.
15. Determine todos os valores de x para os quais existe log_{x - 2} 10.
16. Resolva a equação log_{x} 16 = 2, sabendo que x é positivo e diferente de 1.
17. Mostre que log_{a} b · log_{b} a = 1, para a e b positivos e diferentes de 1.
18. Sabendo que log_{10} 2 vale aproximadamente 0,30, determine quantos algarismos tem o número
    2^{100}.
19. Resolva o sistema formado por log_{2} x + log_{2} y = 5 e por x - y = 4, com x e y positivos.

### Gabarito

1. 6.
2. -2.
3. 1/2.
4. x = 32.
5. 3.
6. 0,90. Como 8 = 2^{3}, o logaritmo vale 3 × 0,30.
7. 0,78. Como 6 = 2 × 3, basta somar os dois logaritmos.
8. 2 · log_{10} x + log_{10} y.
9. x = 5.
10. x = 4. O valor -2 aparece na equação do segundo grau, mas é descartado porque tornaria o
    logaritmando negativo.
11. 5/3.
12. x = 1/3.
13. x > 5.
14. x = 3. O valor -3 é descartado porque o logaritmando precisa ser positivo.
15. 2 < x < 3 ou x > 3. A base precisa ser positiva e diferente de 1.
16. x = 4. O valor -4 é descartado porque a base precisa ser positiva.
17. Pela mudança de base, log_{a} b = (log b) / (log a) e log_{b} a = (log a) / (log b). O produto
    dos dois é 1, porque os fatores se cancelam.
18. 31 algarismos. O logaritmo decimal de 2^{100} vale 100 × 0,30 = 30, então o número está entre
    10^{30} e 10^{31}.
19. x = 8 e y = 4.

## EN

### Explanation

#### The question a logarithm answers

A power involves three numbers: the base, the exponent and the result. Given the base and the
exponent, the power gives the result. The logarithm goes the other way: given the base and the
result, it returns **the exponent**.

If someone asks "what do I have to raise 2 to in order to reach 32", the answer is 5. Written in
symbols:

log_{2} 32 = 5, because 2^{5} = 32

We read it as "log to base 2 of 32 equals 5, because 2 to the power of 5 equals 32". That whole
line is the definition. Whenever you get stuck on a logarithm question, go back to it and read it
aloud: the logarithm is the exponent.

#### The definition in general

log_{a} b = c when a^{c} = b

The number a is the **base**, the number b is the **argument** and the number c is the
**logarithm**.

**Example 1.** Find log_{2} 32.
We look for the exponent that takes 2 up to 32. Since 2^{5} = 32, the logarithm is 5.

**Example 2.** Find log_{3} (1/9).
We look for the exponent that takes 3 to 1/9. Since 3^{-2} = 1/9, the logarithm is -2. A negative
logarithm is perfectly normal and happens whenever the argument lies between 0 and 1.

#### Existence conditions

Three restrictions come straight from the exponential function and have to be checked in every
question:

- **The base must be positive:** a > 0. A power with a negative base does not cover fractional
  exponents.
- **The base must be different from 1:** a ≠ 1. Every power of 1 is 1, so only the logarithm of 1
  would exist, and it would have infinitely many answers.
- **The argument must be positive:** b > 0. An exponential function with a positive base never
  produces zero or a negative number, so no exponent leads to a negative result.

Keeping these three conditions in mind is worth half the marks in an exam, because many logarithmic
equations produce false solutions that only these conditions rule out.

#### Immediate consequences of the definition

- log_{a} 1 = 0, because a^{0} = 1.
- log_{a} a = 1, because a^{1} = a.
- If c = log_{a} b, then a^{c} = b, which is only the definition written another way.

#### The three operating properties

They come from the properties of powers and turn multiplication into addition, which was the
historical reason for inventing logarithms.

**Product.** log_{a} (m · n) = log_{a} m + log_{a} n

**Quotient.** log_{a} (m / n) = log_{a} m - log_{a} n

**Power.** log_{a} m^{k} = k · log_{a} m

The power property is the most profitable of the three, because it pulls the exponent out and puts
it multiplying in front. It is what lets you solve equations in which the unknown sits in the
exponent.

**Example 3.** Given that log_{10} 2 is approximately 0.30 and that log_{10} 3 is approximately
0.48, find log_{10} 12.
Since 12 = 4 × 3 and 4 = 2^{2}, the logarithm becomes 2 · log_{10} 2 + log_{10} 3. That gives
2 × 0.30 + 0.48 = 1.08.

Watch out for a pair of equalities that do not exist: log_{a} (m + n) is not log_{a} m + log_{a} n,
and log_{a} (m / n) is not (log_{a} m) / (log_{a} n).

#### Change of base

When the base gets in the way, you swap it using

log_{a} b = (log_{c} b) / (log_{c} a)

**Example 4.** Find log_{8} 32.
Moving everything to base 2: log_{2} 32 = 5 and log_{2} 8 = 3. So the result is 5/3.

A useful special case follows: log_{a} b = 1 / (log_{b} a).

#### The decimal logarithm

When the base is 10 it is usually left out, and people write just log b. This logarithm measures the
order of magnitude: if the decimal logarithm of a number lies between 3 and 4, the number lies
between a thousand and ten thousand, and therefore has 4 digits. That reading settles the classic
questions about how many digits a large power has.

#### Logarithmic equations and the compulsory check

The procedure has three steps: write down the existence conditions, use the properties to gather
everything into a single logarithm, and go back to power form. The third step usually produces a
quadratic equation, and that is where roots that do not serve show up.

**Example 5.** Solve log_{2} (x - 1) + log_{2} (x + 1) = 3.
The existence conditions require x > 1. Putting the two logarithms together,
log_{2} (x^{2} - 1) = 3, and therefore x^{2} - 1 = 8. So x^{2} = 9, and the roots are 3 and -3. The
negative root fails the condition and is discarded. The answer is x = 3.

#### When the base is the unknown

If the letter appears in the base, the restrictions now apply to it: the base has to be positive and
different from 1. In an equation such as log_{x} 16 = 2, the definition gives x^{2} = 16, whose
roots are 4 and -4. Only the 4 is accepted, because a negative base does not exist.

#### Common mistakes

**Swapping the base with the argument.** log_{2} 8 = 3, and log_{8} 2 = 1/3. The order matters.

**Spreading the logarithm over a sum.** The logarithm of a sum does not split. Only products,
quotients and powers have a rule.

**Skipping the final check.** A logarithmic equation can produce a root that leaves the argument
negative. Without checking, a wrong answer gets into the answer key.

**Applying the power property to the wrong exponent.** The exponent that comes to the front is the
one on the argument, not the one on the base.

### Exercises

**Block A. Fundamentals**

1. Find log_{2} 64.
2. Find log_{5} (1/25).
3. Find log_{9} 3.
4. Solve the equation log_{2} x = 5.
5. Find log_{10} 1000.

**Block B. Building up**

6. Given that log_{10} 2 is approximately 0.30, find log_{10} 8.
7. Given that log_{10} 2 is approximately 0.30 and that log_{10} 3 is approximately 0.48, find
   log_{10} 6.
8. Write log_{10} (x^{2} · y) using separate logarithms of x and of y.
9. Solve the equation log_{3} (2x - 1) = 2.
10. Solve the equation log_{2} x + log_{2} (x - 2) = 3.
11. Find log_{8} 32 using a change of base.
12. Solve the equation log_{10} (x + 3) - log_{10} x = 1.
13. Find all values of x for which log_{2} (x - 5) exists.

**Block C. Going further**

14. Solve the equation log_{2} (x + 1) + log_{2} (x - 1) = 3.
15. Find all values of x for which log_{x - 2} 10 exists.
16. Solve the equation log_{x} 16 = 2, knowing that x is positive and different from 1.
17. Show that log_{a} b · log_{b} a = 1, for a and b positive and different from 1.
18. Given that log_{10} 2 is approximately 0.30, find how many digits the number 2^{100} has.
19. Solve the system made of log_{2} x + log_{2} y = 5 and of x - y = 4, with x and y positive.

### Answer key

1. 6.
2. -2.
3. 1/2.
4. x = 32.
5. 3.
6. 0.90. Since 8 = 2^{3}, the logarithm is 3 × 0.30.
7. 0.78. Since 6 = 2 × 3, it is enough to add the two logarithms.
8. 2 · log_{10} x + log_{10} y.
9. x = 5.
10. x = 4. The value -2 appears in the quadratic equation, but it is discarded because it would make
    the argument negative.
11. 5/3.
12. x = 1/3.
13. x > 5.
14. x = 3. The value -3 is discarded because the argument has to be positive.
15. 2 < x < 3 or x > 3. The base has to be positive and different from 1.
16. x = 4. The value -4 is discarded because the base has to be positive.
17. By the change of base, log_{a} b = (log b) / (log a) and log_{b} a = (log a) / (log b). The
    product of the two is 1, because the factors cancel out.
18. 31 digits. The decimal logarithm of 2^{100} is 100 × 0.30 = 30, so the number lies between
    10^{30} and 10^{31}.
19. x = 8 and y = 4.

## VERIFICACAO

```python
X1: simplify(log(32, 2) - 5) == 0
X2: simplify(log(Rational(1,9), 3) + 2) == 0
X3: 2*Rational(30,100) + Rational(48,100) == Rational(108,100)
X4: simplify(log(32, 8) - Rational(5,3)) == 0
X5: simplify(log(3 - 1, 2) + log(3 + 1, 2) - 3) == 0
E1: simplify(log(64, 2) - 6) == 0
E2: simplify(log(Rational(1,25), 5) + 2) == 0
E3: simplify(log(3, 9) - Rational(1,2)) == 0
E4: 2**5 == 32
E5: simplify(log(1000, 10) - 3) == 0
E6: 3*Rational(30,100) == Rational(90,100)
E7: Rational(30,100) + Rational(48,100) == Rational(78,100)
E8: simplify(log(4**2*8, 10) - (2*log(4, 10) + log(8, 10))) == 0
E9: 3**2 == 2*5 - 1
E10: simplify(log(4, 2) + log(4 - 2, 2) - 3) == 0 and 4 - 2 > 0
E11: simplify(log(32, 8) - Rational(5,3)) == 0
E12: simplify(log(Rational(1,3) + 3, 10) - log(Rational(1,3), 10) - 1) == 0
E13: solveset(x - 5 > 0, x, Reals) == Interval.open(5, oo)
E14: simplify(log(3 + 1, 2) + log(3 - 1, 2) - 3) == 0 and 3 - 1 > 0
E15: Interval.open(2, oo) - FiniteSet(3) == Union(Interval.open(2, 3), Interval.open(3, oo))
E16: 4**2 == 16 and 4 > 0 and 4 != 1
E17: simplify(log(b, a) * log(a, b) - 1) == 0
E18: len(str(2**100)) == 31 and 100 * Rational(30,100) == 30
E19: simplify(log(8, 2) + log(4, 2) - 5) == 0 and 8 - 4 == 4
```
