---
id: MATEM1-02
serie: em1
unidade: algebra
titulo_pt: Função: domínio, contradomínio e imagem
titulo_en: Function: domain, codomain and image
resumo_pt: Entender o que faz de uma relação uma função, achar o domínio de uma expressão real e distinguir contradomínio de imagem.
resumo_en: Understanding what makes a relation a function, finding the domain of a real expression and telling codomain from image.
prerequisitos: [MATEM1-01]
duracao_min: 90
dificuldade: 3
---

## PT

### Explicação

#### A ideia antes do símbolo

Função é uma regra que pega cada elemento de um conjunto de entrada e devolve **um único** elemento
de um conjunto de saída. A palavra que importa nessa frase é "único". Se uma entrada pudesse
devolver dois valores diferentes, a regra deixaria de ser função.

Pense numa máquina de venda automática. Cada botão devolve um produto, e sempre o mesmo. Se um botão
às vezes devolvesse refrigerante e às vezes bolacha, ninguém confiaria na máquina. Função é
exatamente essa exigência de previsibilidade.

Três conjuntos aparecem sempre, e confundi-los é o erro mais comum do assunto:

- **Domínio** é o conjunto das entradas permitidas. Todo elemento do domínio precisa ter saída.
- **Contradomínio** é o conjunto onde as saídas moram. Ele é declarado junto com a função e pode ser
  maior do que o necessário.
- **Imagem** é o conjunto das saídas que realmente acontecem. A imagem está sempre contida no
  contradomínio, e pode ser menor que ele.

**Exemplo 1.** Seja f com domínio formado por 1, 2 e 3, dada por f(x) igual a 2x mais 1.
Aplicando a regra em cada entrada: f(1) vale 3, f(2) vale 5 e f(3) vale 7. Logo a imagem é formada
por 3, 5 e 7. Se alguém tivesse declarado o contradomínio como o conjunto dos naturais, a imagem
continuaria sendo apenas esses três valores.

#### Achar o domínio de uma expressão

Quando a função vem só como uma fórmula, sem domínio declarado, combina-se que o domínio é o maior
conjunto de reais em que a expressão faz sentido. Na prática há duas proibições a vigiar:

- **Denominador não pode ser zero.**
- **Radicando de raiz quadrada não pode ser negativo.**

**Exemplo 2.** Achar o domínio de f(x) igual a 1 sobre (x menos 3).
O denominador zera quando x vale 3, então o domínio é o conjunto de todos os reais menos o número 3.

**Exemplo 3.** Achar o domínio de f(x) igual à raiz quadrada de (x menos 4).
Precisa valer x menos 4 maior ou igual a zero, ou seja, x maior ou igual a 4. O domínio são os reais
maiores ou iguais a 4.

Quando as duas proibições aparecem juntas, cada uma gera uma condição e o domínio é a intersecção
delas. Nada de resolver uma e esquecer a outra.

#### Achar a imagem

A imagem exige olhar para o comportamento da função inteira, não para um ponto. Para uma função do
primeiro grau com domínio em todos os reais, a imagem é o conjunto dos reais. Para uma quadrática, o
vértice manda: a imagem começa no valor mínimo e vai até o infinito quando a concavidade é para
cima.

**Exemplo 4.** Achar a imagem de f(x) igual a x ao quadrado menos 4x mais 3.
O x do vértice é 4 sobre 2, que dá 2, e f(2) vale 4 menos 8 mais 3, ou seja, menos 1. Como a
concavidade é para cima, a imagem são os reais maiores ou iguais a menos 1.

Outro caminho, que serve para expressões mais estranhas, é inverter a pergunta: para quais valores
de y a equação f(x) igual a y tem solução? Os y que têm solução formam a imagem.

#### Injetora, sobrejetora e bijetora

- **Injetora**: entradas diferentes dão saídas diferentes. Nenhum valor de saída se repete.
- **Sobrejetora**: a imagem coincide com o contradomínio. Nenhuma saída declarada fica sem uso.
- **Bijetora**: as duas coisas ao mesmo tempo. Só função bijetora tem inversa.

Repare que ser sobrejetora depende do contradomínio que foi declarado, e não apenas da fórmula. A
mesma expressão pode ser sobrejetora com um contradomínio e não ser com outro.

#### Função definida por partes

Uma função pode ter regras diferentes em pedaços diferentes do domínio. Isso é comum em tarifa de
transporte e em faixa de imposto. A única exigência continua a mesma: cada entrada precisa cair em
exatamente um pedaço.

#### Erros comuns

**Confundir contradomínio com imagem.** O contradomínio é declarado. A imagem é calculada. Elas
coincidem apenas quando a função é sobrejetora.

**Resolver só uma condição de domínio.** Quando a expressão tem raiz dentro de fração, as duas
restrições valem ao mesmo tempo.

**Achar que raiz de índice par com resultado negativo é permitida.** Não é. Dentro dos reais, o
radicando precisa ser maior ou igual a zero.

**Trocar f(x) igual a 5 por f(5).** A primeira pergunta procura a entrada que produz saída 5. A
segunda calcula a saída quando a entrada é 5. São perguntas opostas.

### Exercícios

**Bloco A. Fundamentos**

1. Seja f a função de domínio formado pelos elementos 1, 2 e 3, dada por f(x) igual a 2x mais 1.
   Determine o conjunto imagem.
2. Dada f(x) igual a 3x menos 5, calcule f(0), f(2) e f(menos 1).
3. Determine o domínio de f(x) igual a 1 sobre (x menos 3).
4. Determine o domínio de f(x) igual à raiz quadrada de (x menos 4).
5. Dada f(x) igual a x ao quadrado, calcule f(menos 3) e diga se existe algum número real x com f(x)
   igual a menos 9.

**Bloco B. Consolidação**

6. Determine o domínio de f(x) igual a (x mais 1) sobre (x ao quadrado menos 4).
7. Determine o domínio de f(x) igual à raiz quadrada de (2x menos 6), dividida por (x menos 5).
8. Dada f(x) igual a 2x menos 7, determine o valor de x para o qual f(x) é igual a 9.
9. Determine o conjunto imagem de f(x) igual a x ao quadrado menos 4x mais 3, com domínio em todos
   os reais.
10. Uma função tem domínio formado por 1, 2, 3 e 4, contradomínio formado por 1, 4, 9, 16 e 25, e
    lei f(x) igual a x ao quadrado. Determine a imagem e diga se a função é sobrejetora.
11. Dada f(x) igual a (3x mais 1) sobre 2, determine o valor de x para o qual f(x) é igual a 5 e
    calcule f(3).
12. Determine o domínio de f(x) igual à raiz quadrada de (9 menos x ao quadrado).
13. Uma transportadora cobra 40 reais fixos mais 3 reais por quilômetro rodado. Escreva a lei da
    função que dá o valor pago em relação à distância e determine a imagem quando a distância varia
    de 0 a 100 quilômetros.

**Bloco C. Aprofundamento**

14. Determine o domínio de f(x) igual à raiz quadrada de (x menos 2) somada à raiz quadrada de (5
    menos x).
15. Uma função é definida por partes: ela vale 2x mais 1 quando x é menor que 1, e vale x ao
    quadrado quando x é maior ou igual a 1. Calcule f(0), f(1) e f(3), e diga se há salto no ponto
    de abscissa 1.
16. Determine o conjunto imagem de f(x) igual a 1 sobre (x menos 2), tomando como domínio todos os
    reais diferentes de 2.
17. Considere f(x) igual a (2x mais 3) sobre (x menos 1), definida para x diferente de 1. Determine
    o valor que f nunca assume e justifique isolando x.
18. Explique por que a relação que associa cada número real ao seu quadrado é uma função, enquanto a
    relação que associa cada número real positivo aos números cujo quadrado é ele não é.

### Gabarito

1. A imagem é formada por 3, 5 e 7.
2. f(0) vale menos 5, f(2) vale 1 e f(menos 1) vale menos 8.
3. Todos os números reais, exceto 3.
4. Os reais maiores ou iguais a 4.
5. f(menos 3) vale 9. Não existe, porque o quadrado de um real nunca é negativo.
6. Todos os reais, exceto menos 2 e 2.
7. Os reais maiores ou iguais a 3, tirando o 5.
8. x igual a 8.
9. Os reais maiores ou iguais a menos 1, porque o vértice fica no ponto de coordenadas 2 e menos 1.
10. A imagem é formada por 1, 4, 9 e 16. Não é sobrejetora, porque o 25 não é imagem de nenhum
    elemento do domínio.
11. x igual a 3, e f(3) vale 5.
12. Os valores de menos 3 a 3, incluindo os extremos.
13. A lei é f(d) igual a 40 mais 3d. A imagem vai de 40 a 340 reais, com os extremos incluídos.
14. Os valores de 2 a 5, incluindo os extremos, porque as duas condições precisam valer ao mesmo
    tempo.
15. f(0) vale 1, f(1) vale 1 e f(3) vale 9. Há salto: vindo de valores menores que 1 a função se
    aproxima de 3, mas em 1 ela vale 1.
16. Todos os reais, exceto o 0. Nenhum valor de x faz o quociente valer 0, porque o numerador é
    sempre 1.
17. A função nunca vale 2. Isolando x na igualdade obtém-se x igual a (y mais 3) sobre (y menos 2),
    expressão que só não existe quando y é 2.
18. A primeira é função porque cada real tem exatamente um quadrado. A segunda não é, porque o 4
    ficaria associado ao mesmo tempo a 2 e a menos 2, e uma função exige um único valor de saída
    para cada entrada.

## EN

### Explanation

#### The idea before the symbol

A function is a rule that takes each element of an input set and gives back **exactly one** element
of an output set. The word that matters in that sentence is "one". If an input could give back two
different values, the rule would stop being a function.

Think of a vending machine. Each button gives back a product, and always the same one. If a button
sometimes gave a soft drink and sometimes a biscuit, nobody would trust the machine. A function is
exactly that demand for predictability.

Three sets always show up, and mixing them up is the most common slip in this topic:

- **Domain** is the set of allowed inputs. Every element of the domain must have an output.
- **Codomain** is the set where the outputs live. It is declared along with the function and may be
  larger than needed.
- **Image** is the set of outputs that actually happen. The image is always contained in the
  codomain, and may be smaller than it.

**Example 1.** Let f have domain made of 1, 2 and 3, given by f(x) equals 2x plus 1.
Applying the rule to each input: f(1) is 3, f(2) is 5 and f(3) is 7. So the image is made of 3, 5 and
7. If someone had declared the codomain to be the set of naturals, the image would still be just
those three values.

#### Finding the domain of an expression

When the function comes only as a formula, with no domain declared, the agreement is that the domain
is the largest set of reals in which the expression makes sense. In practice there are two
prohibitions to watch:

- **A denominator cannot be zero.**
- **What sits under a square root cannot be negative.**

**Example 2.** Find the domain of f(x) equals 1 over (x minus 3).
The denominator vanishes when x is 3, so the domain is the set of all reals minus the number 3.

**Example 3.** Find the domain of f(x) equals the square root of (x minus 4).
We need x minus 4 to be greater than or equal to zero, that is, x greater than or equal to 4. The
domain is the reals greater than or equal to 4.

When both prohibitions show up together, each one produces a condition and the domain is their
intersection. Do not solve one and forget the other.

#### Finding the image

The image asks you to look at the behaviour of the whole function, not at a single point. For a
first degree function with domain all the reals, the image is the set of reals. For a quadratic, the
vertex rules: the image starts at the minimum value and runs to infinity when the parabola opens
upwards.

**Example 4.** Find the image of f(x) equals x squared minus 4x plus 3.
The x of the vertex is 4 over 2, which gives 2, and f(2) is 4 minus 8 plus 3, that is, minus 1. Since
the parabola opens upwards, the image is the reals greater than or equal to minus 1.

Another route, useful for stranger expressions, is to turn the question round: for which values of y
does the equation f(x) equals y have a solution? The values of y that do have one form the image.

#### Injective, surjective and bijective

- **Injective**: different inputs give different outputs. No output value is repeated.
- **Surjective**: the image coincides with the codomain. No declared output goes unused.
- **Bijective**: both at once. Only a bijective function has an inverse.

Notice that being surjective depends on the codomain that was declared, not only on the formula. The
same expression can be surjective with one codomain and fail to be with another.

#### Piecewise functions

A function may follow different rules on different pieces of the domain. That is common in transport
fares and tax brackets. The requirement stays the same: each input has to land in exactly one piece.

#### Common mistakes

**Confusing codomain with image.** The codomain is declared. The image is worked out. They coincide
only when the function is surjective.

**Solving only one domain condition.** When the expression has a root inside a fraction, both
restrictions hold at the same time.

**Thinking an even root of a negative number is allowed.** It is not. Within the reals, what sits
under the root has to be greater than or equal to zero.

**Swapping f(x) equals 5 for f(5).** The first question looks for the input that produces output 5.
The second works out the output when the input is 5. They are opposite questions.

### Exercises

**Block A. Fundamentals**

1. Let f be the function whose domain is made of the elements 1, 2 and 3, given by f(x) equals 2x
   plus 1. Find the image set.
2. Given f(x) equals 3x minus 5, find f(0), f(2) and f(minus 1).
3. Find the domain of f(x) equals 1 over (x minus 3).
4. Find the domain of f(x) equals the square root of (x minus 4).
5. Given f(x) equals x squared, find f(minus 3) and say whether there is any real number x with f(x)
   equal to minus 9.

**Block B. Building up**

6. Find the domain of f(x) equals (x plus 1) over (x squared minus 4).
7. Find the domain of f(x) equals the square root of (2x minus 6), divided by (x minus 5).
8. Given f(x) equals 2x minus 7, find the value of x for which f(x) equals 9.
9. Find the image set of f(x) equals x squared minus 4x plus 3, with domain all the reals.
10. A function has domain made of 1, 2, 3 and 4, codomain made of 1, 4, 9, 16 and 25, and rule f(x)
    equals x squared. Find the image and say whether the function is surjective.
11. Given f(x) equals (3x plus 1) over 2, find the value of x for which f(x) equals 5 and work out
    f(3).
12. Find the domain of f(x) equals the square root of (9 minus x squared).
13. A haulage company charges a fixed 40 reais plus 3 reais per kilometre driven. Write the rule of
    the function giving the amount paid in terms of the distance and find the image when the
    distance varies from 0 to 100 kilometres.

**Block C. Going further**

14. Find the domain of f(x) equals the square root of (x minus 2) added to the square root of (5
    minus x).
15. A function is defined piecewise: it equals 2x plus 1 when x is less than 1, and equals x squared
    when x is greater than or equal to 1. Find f(0), f(1) and f(3), and say whether there is a jump
    at the point of abscissa 1.
16. Find the image set of f(x) equals 1 over (x minus 2), taking as domain all the reals different
    from 2.
17. Consider f(x) equals (2x plus 3) over (x minus 1), defined for x different from 1. Find the
    value that f never takes and justify it by isolating x.
18. Explain why the relation matching each real number with its square is a function, while the
    relation matching each positive real number with the numbers whose square it is is not.

### Answer key

1. The image is made of 3, 5 and 7.
2. f(0) is minus 5, f(2) is 1 and f(minus 1) is minus 8.
3. All real numbers except 3.
4. The reals greater than or equal to 4.
5. f(minus 3) is 9. There is none, because the square of a real is never negative.
6. All the reals except minus 2 and 2.
7. The reals greater than or equal to 3, leaving out 5.
8. x equals 8.
9. The reals greater than or equal to minus 1, because the vertex sits at the point with coordinates
   2 and minus 1.
10. The image is made of 1, 4, 9 and 16. It is not surjective, because 25 is not the image of any
    element of the domain.
11. x equals 3, and f(3) is 5.
12. The values from minus 3 to 3, including the endpoints.
13. The rule is f(d) equals 40 plus 3d. The image runs from 40 to 340 reais, with the endpoints
    included.
14. The values from 2 to 5, including the endpoints, because both conditions have to hold at the
    same time.
15. f(0) is 1, f(1) is 1 and f(3) is 9. There is a jump: coming from values less than 1 the function
    approaches 3, but at 1 it is 1.
16. All the reals except 0. No value of x makes the quotient equal 0, because the numerator is always
    1.
17. The function never takes the value 2. Isolating x in the equality gives x equals (y plus 3) over
    (y minus 2), an expression that fails to exist only when y is 2.
18. The first is a function because every real has exactly one square. The second is not, because 4
    would be matched at the same time with 2 and with minus 2, and a function requires a single
    output value for each input.

## VERIFICACAO

```python
X1: sorted([2*v + 1 for v in [1, 2, 3]]) == [3, 5, 7]
X2: Reals - FiniteSet(3) == Union(Interval.open(-oo, 3), Interval.open(3, oo))
X3: solveset(x - 4 >= 0, x, Reals) == Interval(4, oo)
X4: -(-4)/(2*1) == 2 and (2**2 - 4*2 + 3) == -1
E1: sorted([2*v + 1 for v in [1, 2, 3]]) == [3, 5, 7]
E2: (3*0 - 5) == -5 and (3*2 - 5) == 1 and (3*(-1) - 5) == -8
E3: Reals - FiniteSet(3) == Union(Interval.open(-oo, 3), Interval.open(3, oo))
E4: solveset(x - 4 >= 0, x, Reals) == Interval(4, oo)
E5: (-3)**2 == 9 and len(real_roots(x**2 + 9)) == 0
E6: solve(Eq(x**2 - 4, 0), x) == [-2, 2] and Reals - FiniteSet(-2, 2) == Union(Interval.open(-oo, -2), Interval.open(-2, 2), Interval.open(2, oo))
E7: Intersection(solveset(2*x - 6 >= 0, x, Reals), Reals - FiniteSet(5)) == Union(Interval.Ropen(3, 5), Interval.open(5, oo))
E8: solve(Eq(2*x - 7, 9), x) == [8]
E9: -(-4)/(2*1) == 2 and (2**2 - 4*2 + 3) == -1 and solveset(x**2 - 4*x + 3 + 1 >= 0, x, Reals) == Reals
E10: FiniteSet(1, 4, 9, 16) == FiniteSet(1**2, 2**2, 3**2, 4**2) and (25 in FiniteSet(1, 4, 9, 16)) == False
E11: solve(Eq((3*x + 1)/2, 5), x) == [3] and Rational(3*3 + 1, 2) == 5
E12: solveset(9 - x**2 >= 0, x, Reals) == Interval(-3, 3)
E13: (40 + 3*0) == 40 and (40 + 3*100) == 340
E14: Intersection(solveset(x - 2 >= 0, x, Reals), solveset(5 - x >= 0, x, Reals)) == Interval(2, 5)
E15: (2*0 + 1) == 1 and (1**2) == 1 and (3**2) == 9 and (2*1 + 1) == 3
E16: Reals - FiniteSet(0) == Union(Interval.open(-oo, 0), Interval.open(0, oo)) and len(solve(Eq(1/(x - 2), 0), x)) == 0
E17: len(solve(Eq((2*x + 3)/(x - 1), 2), x)) == 0 and simplify((2*((y + 3)/(y - 2)) + 3) / (((y + 3)/(y - 2)) - 1) - y) == 0
E18: # manual: argumentação sobre a definição de função
```
