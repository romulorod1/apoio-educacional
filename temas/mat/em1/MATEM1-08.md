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

log na base 2 de 32 é igual a 5, porque 2 elevado a 5 é igual a 32

Essa frase inteira é a definição. Sempre que travar numa questão de logaritmo, volte a ela e leia em
voz alta: o logaritmo é o expoente.

#### A definição em geral

log na base a de b é igual a c quando a elevado a c é igual a b

O número a é a **base**, o número b é o **logaritmando** e o número c é o **logaritmo**.

**Exemplo 1.** Calcular log na base 2 de 32.
Procura-se o expoente que leva 2 até 32. Como 2 elevado a 5 dá 32, o logaritmo vale 5.

**Exemplo 2.** Calcular log na base 3 de 1 sobre 9.
Procura-se o expoente que leva 3 até 1 sobre 9. Como 3 elevado a menos 2 dá 1 sobre 9, o logaritmo
vale menos 2. Logaritmo negativo é perfeitamente normal e acontece sempre que o logaritmando está
entre 0 e 1.

#### Condições de existência

Três restrições nascem direto da função exponencial e precisam ser conferidas em toda questão:

- **A base precisa ser positiva.** Potência de base negativa não cobre os expoentes fracionários.
- **A base precisa ser diferente de 1.** Toda potência de 1 vale 1, então só existiria logaritmo de
  1, e ele teria infinitas respostas.
- **O logaritmando precisa ser positivo.** A função exponencial de base positiva nunca produz zero
  nem número negativo, então não há expoente que leve a um resultado negativo.

Guardar essas três condições vale metade da nota em prova, porque muita equação logarítmica produz
soluções falsas que só são eliminadas por elas.

#### Consequências imediatas da definição

- log na base a de 1 é igual a 0, porque a elevado a zero dá 1.
- log na base a de a é igual a 1, porque a elevado a 1 dá a.
- a elevado ao log na base a de b é igual a b, o que é apenas a definição escrita de outro jeito.

#### As três propriedades operatórias

Elas vêm das propriedades de potência e transformam multiplicação em soma, o que foi o motivo
histórico da invenção do logaritmo.

**Produto.** log na base a de (m vezes n) é igual a log na base a de m mais log na base a de n.

**Quociente.** log na base a de (m dividido por n) é igual a log na base a de m menos log na base a
de n.

**Potência.** log na base a de m elevado a k é igual a k vezes log na base a de m.

A propriedade da potência é a mais rentável das três, porque tira o expoente de dentro e o coloca
multiplicando na frente. É ela que permite resolver equações em que a incógnita está no expoente.

**Exemplo 3.** Sabendo que log na base 10 de 2 vale aproximadamente 0,30 e que log na base 10 de 3
vale aproximadamente 0,48, calcular log na base 10 de 12.
Como 12 é 4 vezes 3, e 4 é 2 ao quadrado, o logaritmo vira 2 vezes o logaritmo de 2 mais o logaritmo
de 3. Isso dá 2 vezes 0,30 mais 0,48, ou seja, 1,08.

Atenção a um par de igualdades que não existem: o logaritmo de uma soma não é a soma dos logaritmos,
e o logaritmo de um quociente não é o quociente dos logaritmos.

#### Mudança de base

Quando a base atrapalha, troca-se de base com

log na base a de b é igual a log na base c de b dividido por log na base c de a

**Exemplo 4.** Calcular log na base 8 de 32.
Passando tudo para a base 2: log na base 2 de 32 vale 5 e log na base 2 de 8 vale 3. Então o
resultado é 5 dividido por 3, ou seja, 5 sobre 3.

Um caso particular útil sai daí: log na base a de b é igual a 1 dividido por log na base b de a.

#### Logaritmo decimal

Quando a base é 10 costuma-se omiti-la e escrever apenas log de b. Esse logaritmo mede a ordem de
grandeza: se o logaritmo decimal de um número está entre 3 e 4, o número está entre mil e dez mil, e
portanto tem 4 algarismos. Essa leitura resolve as questões clássicas sobre quantos algarismos tem
uma potência grande.

#### Equações logarítmicas e a verificação obrigatória

O procedimento tem três passos: escrever as condições de existência, usar as propriedades para
juntar tudo num único logaritmo, e voltar à forma de potência. O terceiro passo costuma produzir uma
equação do segundo grau, e é aí que aparecem raízes que não servem.

**Exemplo 5.** Resolver log na base 2 de (x menos 1) mais log na base 2 de (x mais 1) igual a 3.
As condições de existência pedem x maior que 1. Juntando os dois logaritmos, log na base 2 de (x ao
quadrado menos 1) igual a 3, e portanto x ao quadrado menos 1 igual a 8. Daí x ao quadrado vale 9, e
as raízes são 3 e menos 3. A raiz negativa não cumpre a condição e é descartada. A resposta é x
igual a 3.

#### Quando a base é a incógnita

Se a letra aparece na base, as restrições passam a valer sobre ela: a base tem que ser positiva e
diferente de 1. Numa equação como log na base x de 16 igual a 2, a definição dá x ao quadrado igual
a 16, cujas raízes são 4 e menos 4. Só o 4 é aceito, porque base negativa não existe.

#### Erros comuns

**Trocar a base pelo logaritmando.** log na base 2 de 8 vale 3, e log na base 8 de 2 vale 1 sobre 3.
A ordem importa.

**Distribuir o logaritmo sobre uma soma.** O logaritmo de uma soma não se separa. Só produto,
quociente e potência têm regra.

**Esquecer a verificação final.** Uma equação logarítmica pode gerar raiz que deixa o logaritmando
negativo. Sem conferir, entra resposta errada no gabarito.

**Aplicar a propriedade da potência ao logaritmando errado.** O expoente que sai para a frente é o
do logaritmando, não o da base.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule log na base 2 de 64.
2. Calcule log na base 5 de 1 sobre 25.
3. Calcule log na base 9 de 3.
4. Resolva a equação log na base 2 de x igual a 5.
5. Calcule log na base 10 de 1000.

**Bloco B. Consolidação**

6. Sabendo que log na base 10 de 2 vale aproximadamente 0,30, calcule log na base 10 de 8.
7. Sabendo que log na base 10 de 2 vale aproximadamente 0,30 e que log na base 10 de 3 vale
   aproximadamente 0,48, calcule log na base 10 de 6.
8. Escreva log na base 10 de (x ao quadrado vezes y) usando logaritmos de x e de y separados.
9. Resolva a equação log na base 3 de (2x menos 1) igual a 2.
10. Resolva a equação log na base 2 de x mais log na base 2 de (x menos 2) igual a 3.
11. Calcule log na base 8 de 32 usando mudança de base.
12. Resolva a equação log na base 10 de (x mais 3) menos log na base 10 de x igual a 1.
13. Determine todos os valores de x para os quais existe log na base 2 de (x menos 5).

**Bloco C. Aprofundamento**

14. Resolva a equação log na base 2 de (x mais 1) mais log na base 2 de (x menos 1) igual a 3.
15. Determine todos os valores de x para os quais existe log na base (x menos 2) de 10.
16. Resolva a equação log na base x de 16 igual a 2, sabendo que x é positivo e diferente de 1.
17. Mostre que log na base a de b, multiplicado por log na base b de a, resulta em 1, para a e b
    positivos e diferentes de 1.
18. Sabendo que log na base 10 de 2 vale aproximadamente 0,30, determine quantos algarismos tem o
    número 2 elevado a 100.
19. Resolva o sistema formado por log na base 2 de x mais log na base 2 de y igual a 5 e por x menos
    y igual a 4, com x e y positivos.

### Gabarito

1. 6.
2. Menos 2.
3. 1 sobre 2.
4. x igual a 32.
5. 3.
6. 0,90. Como 8 é 2 ao cubo, o logaritmo vale 3 vezes 0,30.
7. 0,78. Como 6 é 2 vezes 3, basta somar os dois logaritmos.
8. 2 vezes log na base 10 de x mais log na base 10 de y.
9. x igual a 5.
10. x igual a 4. O valor menos 2 aparece na equação do segundo grau, mas é descartado porque
    tornaria o logaritmando negativo.
11. 5 sobre 3.
12. x igual a 1 sobre 3.
13. Os valores maiores que 5.
14. x igual a 3. O valor menos 3 é descartado porque o logaritmando precisa ser positivo.
15. Os valores entre 2 e 3, sem incluir os extremos, junto com os valores maiores que 3. A base
    precisa ser positiva e diferente de 1.
16. x igual a 4. O valor menos 4 é descartado porque a base precisa ser positiva.
17. Pela mudança de base, log na base a de b é log de b dividido por log de a, e log na base b de a
    é log de a dividido por log de b. O produto dos dois é 1, porque os fatores se cancelam.
18. 31 algarismos. O logaritmo decimal de 2 elevado a 100 vale 100 vezes 0,30, ou seja, 30, então o
    número está entre 10 elevado a 30 e 10 elevado a 31.
19. x igual a 8 e y igual a 4.

## EN

### Explanation

#### The question a logarithm answers

A power involves three numbers: the base, the exponent and the result. Given the base and the
exponent, the power gives the result. The logarithm goes the other way: given the base and the
result, it returns **the exponent**.

If someone asks "what do I have to raise 2 to in order to reach 32", the answer is 5. Written in
symbols:

log to base 2 of 32 equals 5, because 2 to the power of 5 equals 32

That whole sentence is the definition. Whenever you get stuck on a logarithm question, go back to it
and read it aloud: the logarithm is the exponent.

#### The definition in general

log to base a of b equals c when a to the power of c equals b

The number a is the **base**, the number b is the **argument** and the number c is the
**logarithm**.

**Example 1.** Find log to base 2 of 32.
We look for the exponent that takes 2 up to 32. Since 2 to the power of 5 gives 32, the logarithm is
5.

**Example 2.** Find log to base 3 of 1 over 9.
We look for the exponent that takes 3 to 1 over 9. Since 3 to the power of minus 2 gives 1 over 9,
the logarithm is minus 2. A negative logarithm is perfectly normal and happens whenever the argument
lies between 0 and 1.

#### Existence conditions

Three restrictions come straight from the exponential function and have to be checked in every
question:

- **The base must be positive.** A power with a negative base does not cover fractional exponents.
- **The base must be different from 1.** Every power of 1 is 1, so only the logarithm of 1 would
  exist, and it would have infinitely many answers.
- **The argument must be positive.** An exponential function with a positive base never produces
  zero or a negative number, so no exponent leads to a negative result.

Keeping these three conditions in mind is worth half the marks in an exam, because many logarithmic
equations produce false solutions that only these conditions rule out.

#### Immediate consequences of the definition

- log to base a of 1 equals 0, because a to the power of zero gives 1.
- log to base a of a equals 1, because a to the power of 1 gives a.
- a raised to log to base a of b equals b, which is only the definition written another way.

#### The three operating properties

They come from the properties of powers and turn multiplication into addition, which was the
historical reason for inventing logarithms.

**Product.** log to base a of (m times n) equals log to base a of m plus log to base a of n.

**Quotient.** log to base a of (m divided by n) equals log to base a of m minus log to base a of n.

**Power.** log to base a of m to the power of k equals k times log to base a of m.

The power property is the most profitable of the three, because it pulls the exponent out and puts
it multiplying in front. It is what lets you solve equations in which the unknown sits in the
exponent.

**Example 3.** Given that log to base 10 of 2 is approximately 0.30 and that log to base 10 of 3 is
approximately 0.48, find log to base 10 of 12.
Since 12 is 4 times 3, and 4 is 2 squared, the logarithm becomes 2 times the logarithm of 2 plus the
logarithm of 3. That gives 2 times 0.30 plus 0.48, that is, 1.08.

Watch out for a pair of equalities that do not exist: the logarithm of a sum is not the sum of the
logarithms, and the logarithm of a quotient is not the quotient of the logarithms.

#### Change of base

When the base gets in the way, you swap it using

log to base a of b equals log to base c of b divided by log to base c of a

**Example 4.** Find log to base 8 of 32.
Moving everything to base 2: log to base 2 of 32 is 5 and log to base 2 of 8 is 3. So the result is
5 divided by 3, that is, 5 over 3.

A useful special case follows: log to base a of b equals 1 divided by log to base b of a.

#### The decimal logarithm

When the base is 10 it is usually left out, and people write just log of b. This logarithm measures
the order of magnitude: if the decimal logarithm of a number lies between 3 and 4, the number lies
between a thousand and ten thousand, and therefore has 4 digits. That reading settles the classic
questions about how many digits a large power has.

#### Logarithmic equations and the compulsory check

The procedure has three steps: write down the existence conditions, use the properties to gather
everything into a single logarithm, and go back to power form. The third step usually produces a
quadratic equation, and that is where roots that do not serve show up.

**Example 5.** Solve log to base 2 of (x minus 1) plus log to base 2 of (x plus 1) equals 3.
The existence conditions require x greater than 1. Putting the two logarithms together, log to base
2 of (x squared minus 1) equals 3, and therefore x squared minus 1 equals 8. So x squared is 9, and
the roots are 3 and minus 3. The negative root fails the condition and is discarded. The answer is x
equal to 3.

#### When the base is the unknown

If the letter appears in the base, the restrictions now apply to it: the base has to be positive and
different from 1. In an equation such as log to base x of 16 equals 2, the definition gives x
squared equal to 16, whose roots are 4 and minus 4. Only the 4 is accepted, because a negative base
does not exist.

#### Common mistakes

**Swapping the base with the argument.** log to base 2 of 8 is 3, and log to base 8 of 2 is 1 over
3. The order matters.

**Spreading the logarithm over a sum.** The logarithm of a sum does not split. Only products,
quotients and powers have a rule.

**Skipping the final check.** A logarithmic equation can produce a root that leaves the argument
negative. Without checking, a wrong answer gets into the answer key.

**Applying the power property to the wrong exponent.** The exponent that comes to the front is the
one on the argument, not the one on the base.

### Exercises

**Block A. Fundamentals**

1. Find log to base 2 of 64.
2. Find log to base 5 of 1 over 25.
3. Find log to base 9 of 3.
4. Solve the equation log to base 2 of x equals 5.
5. Find log to base 10 of 1000.

**Block B. Building up**

6. Given that log to base 10 of 2 is approximately 0.30, find log to base 10 of 8.
7. Given that log to base 10 of 2 is approximately 0.30 and that log to base 10 of 3 is
   approximately 0.48, find log to base 10 of 6.
8. Write log to base 10 of (x squared times y) using separate logarithms of x and of y.
9. Solve the equation log to base 3 of (2x minus 1) equals 2.
10. Solve the equation log to base 2 of x plus log to base 2 of (x minus 2) equals 3.
11. Find log to base 8 of 32 using a change of base.
12. Solve the equation log to base 10 of (x plus 3) minus log to base 10 of x equals 1.
13. Find all values of x for which log to base 2 of (x minus 5) exists.

**Block C. Going further**

14. Solve the equation log to base 2 of (x plus 1) plus log to base 2 of (x minus 1) equals 3.
15. Find all values of x for which log to base (x minus 2) of 10 exists.
16. Solve the equation log to base x of 16 equals 2, knowing that x is positive and different from 1.
17. Show that log to base a of b, multiplied by log to base b of a, gives 1, for a and b positive
    and different from 1.
18. Given that log to base 10 of 2 is approximately 0.30, find how many digits the number 2 to the
    power of 100 has.
19. Solve the system made of log to base 2 of x plus log to base 2 of y equals 5 and of x minus y
    equals 4, with x and y positive.

### Answer key

1. 6.
2. Minus 2.
3. 1 over 2.
4. x equals 32.
5. 3.
6. 0.90. Since 8 is 2 cubed, the logarithm is 3 times 0.30.
7. 0.78. Since 6 is 2 times 3, it is enough to add the two logarithms.
8. 2 times log to base 10 of x plus log to base 10 of y.
9. x equals 5.
10. x equals 4. The value minus 2 appears in the quadratic equation, but it is discarded because it
    would make the argument negative.
11. 5 over 3.
12. x equals 1 over 3.
13. The values greater than 5.
14. x equals 3. The value minus 3 is discarded because the argument has to be positive.
15. The values between 2 and 3, not including the endpoints, together with the values greater than
    3. The base has to be positive and different from 1.
16. x equals 4. The value minus 4 is discarded because the base has to be positive.
17. By the change of base, log to base a of b is log of b divided by log of a, and log to base b of
    a is log of a divided by log of b. The product of the two is 1, because the factors cancel out.
18. 31 digits. The decimal logarithm of 2 to the power of 100 is 100 times 0.30, that is, 30, so the
    number lies between 10 to the power of 30 and 10 to the power of 31.
19. x equals 8 and y equals 4.

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
