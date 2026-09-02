---
id: MATEM2-06
serie: em2
unidade: algebra
titulo_pt: Sistemas lineares
titulo_en: Linear systems
resumo_pt: Resolver sistemas de equações do primeiro grau por substituição, adição e escalonamento, classificá-los e discutir a solução em função de um parâmetro.
resumo_en: Solving systems of first degree equations by substitution, elimination and row reduction, classifying them and discussing the solution in terms of a parameter.
prerequisitos: [MATEM2-05]
duracao_min: 90
dificuldade: 5
---

## PT

### Explicação

#### O que é um sistema linear

Uma equação linear é uma equação em que cada incógnita aparece elevada ao expoente um, sem produto
entre incógnitas e sem incógnita dentro de raiz. Um sistema linear é um conjunto de equações lineares
que precisam valer ao mesmo tempo.

Resolver o sistema é achar os valores das incógnitas que satisfazem **todas** as equações juntas. Uma
solução que serve para a primeira equação e falha na segunda não é solução do sistema.

A leitura geométrica ajuda. Com duas incógnitas, cada equação é uma reta no plano. Resolver o sistema
é achar os pontos comuns às retas. Duas retas concorrentes se cruzam num ponto, duas retas
coincidentes têm infinitos pontos em comum, e duas retas paralelas distintas não têm nenhum.

#### Os três métodos

**Substituição.** Isola-se uma incógnita numa equação e leva-se essa expressão para a outra. É o
melhor caminho quando alguma incógnita já está quase isolada.

**Adição.** Multiplicam-se as equações por números escolhidos de modo que, ao somar, uma incógnita
desapareça. É o mais rápido quando os coeficientes são parecidos.

**Escalonamento.** É o método que escala para sistemas maiores. Usam-se somas de múltiplos de uma
equação com outra para ir zerando coeficientes, até o sistema virar uma escada. Aí a última equação
tem uma incógnita só, e sobe-se de volta substituindo.

**Exemplo 1.** Resolver o sistema formado por x + y = 10 e x - y = 4.
Somando as duas equações, o y desaparece e sobra 2x = 14, ou seja, x = 7. Voltando na
primeira, y = 3.

**Exemplo 2.** Resolver o sistema formado por x + y + z = 6, por 2x + y - z = 1, e por
x - y + 2z = 5.
Escalonando, chega-se a x = 1, y = 2 e z = 3. Vale conferir nas três equações: a soma dá 6, a
segunda dá 2 + 2 - 3 = 1, e a terceira dá 1 - 2 + 6 = 5.

#### Classificação

Todo sistema linear cai em exatamente um dos três casos:

- **Possível e determinado.** Tem uma única solução.
- **Possível e indeterminado.** Tem infinitas soluções, porque uma equação não traz informação nova.
- **Impossível.** Não tem solução, porque as equações se contradizem.

O determinante da matriz dos coeficientes, que vamos chamar de D, separa o primeiro caso dos outros
dois. Se D ≠ 0, o sistema é possível e determinado. Se D = 0, o sistema é indeterminado ou
impossível, e é preciso olhar os termos independentes para decidir qual dos dois.

#### A regra de Cramer

Para um sistema com tantas equações quanto incógnitas e D ≠ 0, cada incógnita sai de um quociente de
determinantes:

x = D_{x} / D e y = D_{y} / D

onde D é o determinante da matriz dos coeficientes, e D_{x} e D_{y} são esse mesmo determinante com
a coluna daquela incógnita trocada pela coluna dos termos independentes.

**Exemplo 3.** Resolver por Cramer o sistema formado por 3x + 2y = 13 e x - y = 1.
O determinante dos coeficientes é D = 3 · (-1) - 2 · 1 = -5. Trocando a primeira coluna pelos termos
independentes, D_{x} = -15, e x = -15 / (-5) = 3. Fazendo o mesmo na segunda coluna,
D_{y} = -10, e y = 2.

#### Discussão em função de um parâmetro

Este é o tipo de questão que separa quem entendeu de quem decorou. O sistema vem com uma letra no
lugar de um coeficiente, e a pergunta é para quais valores dessa letra o sistema é determinado,
indeterminado ou impossível.

O caminho é sempre o mesmo. Primeiro, calcula-se o determinante dos coeficientes em função da letra e
descobre-se para quais valores ele se anula. Para os demais valores, o sistema é determinado. Depois,
para cada valor que anula o determinante, substitui-se a letra no sistema e olha-se o que acontece:
se as equações viram múltiplas uma da outra, o sistema é indeterminado; se elas se contradizem, é
impossível.

**Exemplo 4.** Analisar o sistema formado por x + y = 2 e 2x + 2y = 5.
A segunda equação é o dobro da primeira do lado esquerdo, mas o lado direito deveria ser 4 e é 5. As
duas condições não podem valer juntas, e o sistema é impossível.

#### Erros comuns

**Concluir que o sistema é impossível só porque o determinante deu zero.** Determinante zero abre
dois casos, e é preciso testar qual deles ocorre.

**Aplicar Cramer com determinante zero.** A regra não vale nesse caso, porque haveria divisão por
zero.

**Esquecer de conferir a solução em todas as equações.** Num sistema de três equações, um erro de
sinal costuma passar por duas delas e falhar na terceira.

**Parar na primeira incógnita.** A resposta de um sistema é o conjunto de valores, não um valor
solto.

### Exercícios

**Bloco A. Fundamentos**

1. Resolva o sistema formado por x + y = 7 e x - y = 3.
2. Resolva o sistema formado por 2x + y = 8 e x - y = 1.
3. Classifique o sistema formado por x + y = 4 e 2x + 2y = 8.
4. Classifique o sistema formado por x + y = 4 e 2x + 2y = 10.
5. Resolva por substituição o sistema formado por y = 2x e x + y = 9.

**Bloco B. Consolidação**

6. Resolva o sistema formado por 3x + 2y = 16 e x - y = 2.
7. Resolva por escalonamento o sistema formado por x + y + z = 6, por 2x - y + z = 3, e por
   x + 2y - z = 2.
8. Resolva pela regra de Cramer o sistema formado por 2x + 3y = 12 e x - y = 1.
9. Resolva o sistema formado por x + y = 5, por y + z = 7 e por x + z = 8.
10. Num estacionamento há carros e motos, num total de 30 veículos e 100 rodas. Sabendo que cada
    carro tem 4 rodas e cada moto tem 2 rodas, determine quantos veículos há de cada tipo.
11. Determine k para que o sistema formado por x + y = 3 e 2x + ky = 6 tenha infinitas soluções.
12. Determine k para que o sistema formado por x + y = 3 e 2x + ky = 7 não tenha solução.
13. Resolva e classifique o sistema formado por 2x + y = 5 e 4x + 2y = 10.
14. Uma bilheteria vendeu 200 ingressos e arrecadou 4500 reais. O ingresso inteiro custa 30 reais e a
    meia-entrada custa 15 reais. Determine quantos ingressos de cada tipo foram vendidos.

**Bloco C. Aprofundamento**

15. Discuta, em função de m, o sistema formado por x + y = 2 e mx + y = 4.
16. Discuta, em função de k, o sistema formado por kx + y = 1 e x + ky = 1.
17. Determine os valores de m para os quais o sistema formado por x + y + z = 1, por x + 2y + z = 2
    e por x + y + mz = 3 tem solução única.
18. Um comerciante quer preparar 100 quilos de uma mistura de café que custe 24 reais o quilo, usando
    um café de 20 reais o quilo e outro de 30 reais o quilo. Determine quantos quilos de cada café
    ele deve usar.
19. Determine os valores reais de k para os quais o sistema formado por kx + 2y = 0 e 3x + ky = 0
    admite solução diferente daquela em que as duas incógnitas valem zero.

### Gabarito

1. x = 5 e y = 2.
2. x = 3 e y = 2.
3. Possível e indeterminado. A segunda equação é o dobro da primeira, então ela não traz informação
   nova e há infinitas soluções.
4. Impossível. O lado esquerdo da segunda equação é o dobro do lado esquerdo da primeira, mas o lado
   direito deveria ser 8 e é 10.
5. x = 3 e y = 6.
6. x = 4 e y = 2.
7. x = 1, y = 2 e z = 3.
8. x = 3 e y = 2. O determinante dos coeficientes vale -5, o da primeira coluna trocada vale -15 e
   o da segunda coluna trocada vale -10.
9. x = 3, y = 2 e z = 5.
10. 20 carros e 10 motos.
11. k = 2.
12. k = 2.
13. Possível e indeterminado. As duas equações são equivalentes, e todo par com
    y = 5 - 2x é solução.
14. 100 ingressos inteiros e 100 meias-entradas.
15. Para m ≠ 1, o sistema é possível e determinado. Para m = 1, as duas equações dizem que a mesma
    soma vale 2 e vale 4, e o sistema é impossível.
16. Para k ≠ 1 e k ≠ -1, o sistema é possível e determinado. Para k = 1, as duas equações viram a
    mesma e o sistema é possível e indeterminado. Para k = -1, as equações se contradizem e o sistema
    é impossível.
17. Todo m ≠ 1. O determinante dos coeficientes vale D = m - 1, e ele precisa ser diferente de zero.
18. 60 quilos do café de 20 reais e 40 quilos do café de 30 reais.
19. k = √6 e k = -√6. Um sistema em que os termos independentes são todos zero só ganha solução
    além da trivial quando o determinante dos coeficientes se anula.

## EN

### Explanation

#### What a linear system is

A linear equation is one in which each unknown appears raised to the exponent one, with no product of
unknowns and no unknown inside a root. A linear system is a set of linear equations that must hold at
the same time.

Solving the system means finding the values of the unknowns that satisfy **all** the equations
together. A set of values that works for the first equation and fails in the second is not a solution
of the system.

The geometric reading helps. With two unknowns, each equation is a line in the plane. Solving the
system means finding the points the lines share. Two crossing lines meet at one point, two coincident
lines share infinitely many points, and two distinct parallel lines share none.

#### The three methods

**Substitution.** Isolate one unknown in one equation and carry that expression into the other. It is
the best route when some unknown is already almost isolated.

**Elimination.** Multiply the equations by chosen numbers so that, on adding, one unknown disappears.
It is the fastest when the coefficients are similar.

**Row reduction.** This is the method that scales to larger systems. Sums of multiples of one
equation with another are used to clear coefficients until the system becomes a staircase. Then the
last equation has a single unknown, and you climb back up substituting.

**Example 1.** Solve the system made of x + y = 10 and x - y = 4.
Adding the two equations, y disappears and 2x = 14 is left, that is, x = 7. Going back to the first
equation, y = 3.

**Example 2.** Solve the system made of x + y + z = 6, of 2x + y - z = 1, and of
x - y + 2z = 5.
Row reducing, you reach x = 1, y = 2 and z = 3. It is worth checking in all three equations: the sum
gives 6, the second gives 2 + 2 - 3 = 1, and the third gives 1 - 2 + 6 = 5.

#### Classification

Every linear system falls into exactly one of three cases:

- **Consistent with a unique solution.** There is one and only one solution.
- **Consistent with infinitely many solutions.** One equation brings no new information.
- **Inconsistent.** There is no solution, because the equations contradict each other.

The determinant of the coefficient matrix, which we will call D, separates the first case from the
other two. If D ≠ 0, the system has a unique solution. If D = 0, the system either has infinitely
many solutions or none, and you have to look at the constant terms to decide which.

#### Cramer's rule

For a system with as many equations as unknowns and D ≠ 0, each unknown comes out of a quotient of
determinants:

x = D_{x} / D and y = D_{y} / D

where D is the determinant of the coefficient matrix, and D_{x} and D_{y} are that same determinant
with the column of that unknown replaced by the column of constant terms.

**Example 3.** Solve by Cramer's rule the system made of 3x + 2y = 13 and x - y = 1.
The determinant of the coefficients is D = 3 · (-1) - 2 · 1 = -5. Replacing the first column with the
constant terms, D_{x} = -15, and x = -15 / (-5) = 3. Doing the same in the second column,
D_{y} = -10, and y = 2.

#### Discussion in terms of a parameter

This is the kind of question that separates who understood from who memorised. The system comes with
a letter in place of a coefficient, and the question is for which values of that letter the system
has a unique solution, infinitely many, or none.

The route is always the same. First, work out the determinant of the coefficients in terms of the
letter and find for which values it vanishes. For all other values the system has a unique solution.
Then, for each value that makes the determinant vanish, put the letter back into the system and look
at what happens: if the equations become multiples of one another, there are infinitely many
solutions; if they contradict each other, there is none.

**Example 4.** Analyse the system made of x + y = 2 and 2x + 2y = 5.
The second equation is twice the first on the left side, but the right side should be 4 and it is 5.
The two conditions cannot hold together, and the system is inconsistent.

#### Common mistakes

**Concluding that the system has no solution just because the determinant is zero.** A zero
determinant opens two cases, and you have to test which one occurs.

**Applying Cramer's rule with a zero determinant.** The rule does not hold in that case, because it
would divide by zero.

**Forgetting to check the solution in every equation.** In a system of three equations, a sign slip
usually survives two of them and fails in the third.

**Stopping at the first unknown.** The answer to a system is the set of values, not a single loose
value.

### Exercises

**Block A. Fundamentals**

1. Solve the system made of x + y = 7 and x - y = 3.
2. Solve the system made of 2x + y = 8 and x - y = 1.
3. Classify the system made of x + y = 4 and 2x + 2y = 8.
4. Classify the system made of x + y = 4 and 2x + 2y = 10.
5. Solve by substitution the system made of y = 2x and x + y = 9.

**Block B. Building up**

6. Solve the system made of 3x + 2y = 16 and x - y = 2.
7. Solve by row reduction the system made of x + y + z = 6, of 2x - y + z = 3, and of
   x + 2y - z = 2.
8. Solve by Cramer's rule the system made of 2x + 3y = 12 and x - y = 1.
9. Solve the system made of x + y = 5, of y + z = 7 and of x + z = 8.
10. In a car park there are cars and motorbikes, 30 vehicles and 100 wheels in total. Knowing that
    each car has 4 wheels and each motorbike has 2 wheels, find how many vehicles there are of each
    kind.
11. Find k so that the system made of x + y = 3 and 2x + ky = 6 has infinitely many solutions.
12. Find k so that the system made of x + y = 3 and 2x + ky = 7 has no solution.
13. Solve and classify the system made of 2x + y = 5 and 4x + 2y = 10.
14. A box office sold 200 tickets and took in 4500 reais. A full ticket costs 30 reais and a half
    price ticket costs 15 reais. Find how many tickets of each kind were sold.

**Block C. Going further**

15. Discuss, in terms of m, the system made of x + y = 2 and mx + y = 4.
16. Discuss, in terms of k, the system made of kx + y = 1 and x + ky = 1.
17. Find the values of m for which the system made of x + y + z = 1, of x + 2y + z = 2 and of
    x + y + mz = 3 has a unique solution.
18. A shopkeeper wants to prepare 100 kilos of a coffee blend costing 24 reais a kilo, using one
    coffee at 20 reais a kilo and another at 30 reais a kilo. Find how many kilos of each coffee he
    should use.
19. Find the real values of k for which the system made of kx + 2y = 0 and 3x + ky = 0 has a
    solution other than the one in which both unknowns are zero.

### Answer key

1. x = 5 and y = 2.
2. x = 3 and y = 2.
3. Consistent with infinitely many solutions. The second equation is twice the first, so it brings no
   new information.
4. Inconsistent. The left side of the second equation is twice the left side of the first, but the
   right side should be 8 and it is 10.
5. x = 3 and y = 6.
6. x = 4 and y = 2.
7. x = 1, y = 2 and z = 3.
8. x = 3 and y = 2. The determinant of the coefficients is -5, the one with the first column
   replaced is -15 and the one with the second column replaced is -10.
9. x = 3, y = 2 and z = 5.
10. 20 cars and 10 motorbikes.
11. k = 2.
12. k = 2.
13. Consistent with infinitely many solutions. The two equations are equivalent, and every pair
    with y = 5 - 2x is a solution.
14. 100 full tickets and 100 half price tickets.
15. For m ≠ 1, the system has a unique solution. For m = 1, the two equations say that the same sum
    is 2 and is 4, and the system is inconsistent.
16. For k ≠ 1 and k ≠ -1, the system has a unique solution. For k = 1, the two equations become the
    same and the system has infinitely many solutions. For k = -1, the equations contradict each
    other and the system is inconsistent.
17. Every m ≠ 1. The determinant of the coefficients is D = m - 1, and it has to be different
    from zero.
18. 60 kilos of the coffee at 20 reais and 40 kilos of the coffee at 30 reais.
19. k = √6 and k = -√6. A system whose constant terms are all zero only gains a solution beyond
    the trivial one when the determinant of the coefficients vanishes.

## VERIFICACAO

```python
X1: solve([Eq(x + y, 10), Eq(x - y, 4)], [x, y]) == {x: 7, y: 3}
X2: solve([Eq(x + y + z, 6), Eq(2*x + y - z, 1), Eq(x - y + 2*z, 5)], [x, y, z]) == {x: 1, y: 2, z: 3}
X3: Matrix([[3,2],[1,-1]]).det() == -5 and Matrix([[13,2],[1,-1]]).det() == -15 and Matrix([[3,13],[1,1]]).det() == -10
X4: Matrix([[1,1],[2,2]]).det() == 0 and 2*2 != 5
E1: solve([Eq(x + y, 7), Eq(x - y, 3)], [x, y]) == {x: 5, y: 2}
E2: solve([Eq(2*x + y, 8), Eq(x - y, 1)], [x, y]) == {x: 3, y: 2}
E3: Matrix([[1,1],[2,2]]).det() == 0 and 2*4 == 8
E4: Matrix([[1,1],[2,2]]).det() == 0 and 2*4 != 10
E5: solve([Eq(y, 2*x), Eq(x + y, 9)], [x, y]) == {x: 3, y: 6}
E6: solve([Eq(3*x + 2*y, 16), Eq(x - y, 2)], [x, y]) == {x: 4, y: 2}
E7: solve([Eq(x + y + z, 6), Eq(2*x - y + z, 3), Eq(x + 2*y - z, 2)], [x, y, z]) == {x: 1, y: 2, z: 3}
E8: Matrix([[2,3],[1,-1]]).det() == -5 and Matrix([[12,3],[1,-1]]).det() == -15 and Matrix([[2,12],[1,1]]).det() == -10 and Rational(-15,-5) == 3 and Rational(-10,-5) == 2
E9: solve([Eq(x + y, 5), Eq(y + z, 7), Eq(x + z, 8)], [x, y, z]) == {x: 3, y: 2, z: 5}
E10: solve([Eq(c + m, 30), Eq(4*c + 2*m, 100)], [c, m]) == {c: 20, m: 10}
E11: solve(Eq(Matrix([[1,1],[2,k]]).det(), 0), k) == [2] and 2*3 == 6
E12: solve(Eq(Matrix([[1,1],[2,k]]).det(), 0), k) == [2] and 2*3 != 7
E13: Matrix([[2,1],[4,2]]).det() == 0 and 2*5 == 10
E14: solve([Eq(a + b, 200), Eq(30*a + 15*b, 4500)], [a, b]) == {a: 100, b: 100}
E15: solve(Eq(Matrix([[1,1],[m,1]]).det(), 0), m) == [1] and 2 != 4
E16: solve(Eq(Matrix([[k,1],[1,k]]).det(), 0), k) == [-1, 1]
E17: solve(Eq(Matrix([[1,1,1],[1,2,1],[1,1,m]]).det(), 0), m) == [1]
E18: solve([Eq(a + b, 100), Eq(20*a + 30*b, 2400)], [a, b]) == {a: 60, b: 40}
E19: solve(Eq(Matrix([[k,2],[3,k]]).det(), 0), k) == [-sqrt(6), sqrt(6)]
```
