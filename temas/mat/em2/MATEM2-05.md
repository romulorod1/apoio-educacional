---
id: MATEM2-05
serie: em2
unidade: algebra
titulo_pt: Determinantes
titulo_en: Determinants
resumo_pt: Calcular o determinante de matrizes quadradas e usar suas propriedades para decidir se existe inversa e para resolver equações.
resumo_en: Computing the determinant of square matrices and using its properties to decide whether an inverse exists and to solve equations.
prerequisitos: [MATEM2-04]
duracao_min: 90
dificuldade: 4
---

## PT

### Explicação

#### Um número que resume a matriz

O determinante é um número associado a toda matriz **quadrada**. Ele não existe para matriz que tenha
mais linhas do que colunas, ou o contrário. E ele responde de uma vez a uma pergunta importante: a
matriz tem inversa ou não? A resposta é curta. Tem inversa exatamente quando o determinante é
diferente de zero.

Há também uma leitura geométrica. Numa matriz de duas linhas e duas colunas, o valor absoluto do
determinante é a área do paralelogramo formado pelas duas linhas vistas como setas no plano. Quando
o determinante dá zero, o paralelogramo achatou, porque as duas linhas ficaram na mesma direção.

#### Matriz de uma linha e de duas linhas

Para uma matriz com um único elemento, o determinante é o próprio elemento.

Para uma matriz de duas linhas e duas colunas com primeira linha a e b e segunda linha c e d, o
determinante é

a vezes d menos b vezes c

Isto é, o produto da diagonal principal menos o produto da outra diagonal.

**Exemplo 1.** Achar o determinante da matriz cuja primeira linha é 2 e 3 e cuja segunda linha é 1 e
5.
É 2 vezes 5 menos 3 vezes 1, que dá 10 menos 3, ou seja, 7.

#### Matriz de três linhas: a regra de Sarrus

Para uma matriz de três linhas e três colunas há um procedimento prático. Repetem-se as duas
primeiras colunas à direita da matriz, somam-se os três produtos das diagonais que descem para a
direita e subtraem-se os três produtos das diagonais que sobem.

**Exemplo 2.** Achar o determinante da matriz cuja primeira linha é 1, 2 e 0, cuja segunda linha é 3,
1 e 4 e cuja terceira linha é 2, 0 e 1.
Os produtos que descem dão 1 vezes 1 vezes 1, mais 2 vezes 4 vezes 2, mais 0 vezes 3 vezes 0, ou
seja, 1 mais 16 mais 0, que é 17. Os produtos que sobem dão 0 vezes 1 vezes 2, mais 1 vezes 4 vezes
0, mais 2 vezes 3 vezes 1, ou seja, 0 mais 0 mais 6, que é 6. O determinante é 17 menos 6, que dá 11.

#### As propriedades que economizam conta

Muita questão de prova se resolve pelas propriedades, sem calcular nada:

- **Linha de zeros.** Se uma linha inteira é formada por zeros, o determinante é zero.
- **Duas linhas iguais ou proporcionais.** O determinante é zero. Esse é o caso que mais aparece
  disfarçado.
- **Matriz triangular.** Se todos os elementos abaixo da diagonal principal são zero, o determinante
  é o produto dos elementos da diagonal.
- **Transposta.** O determinante de uma matriz é igual ao da sua transposta.
- **Troca de linhas.** Trocar duas linhas de lugar troca o sinal do determinante.
- **Multiplicar uma linha por um número.** O determinante fica multiplicado por esse número. Se toda
  a matriz de n linhas for multiplicada por um número, o determinante fica multiplicado por esse
  número elevado a n.
- **Produto.** O determinante de um produto é o produto dos determinantes.
- **Inversa.** O determinante da inversa é o inverso do determinante.

**Exemplo 3.** Achar o determinante da matriz cuja primeira linha é 2 e 4 e cuja segunda linha é 1 e
2.
A primeira linha é o dobro da segunda. Sem calcular nada, o determinante é zero. Conferindo pela
fórmula: 2 vezes 2 menos 4 vezes 1, que dá zero.

#### Determinante com incógnita

Quando aparece uma letra dentro da matriz, o determinante vira uma expressão, e a pergunta costuma
ser para que valores da letra ele se anula. É assim que se descobre quando uma matriz deixa de ter
inversa e quando um sistema deixa de ter solução única.

**Exemplo 4.** Achar os valores de x que anulam o determinante da matriz cuja primeira linha é x e 3
e cuja segunda linha é 3 e x.
O determinante é x ao quadrado menos 9. Ele se anula quando x vale 3 ou menos 3.

#### Erros comuns

**Calcular determinante de matriz que não é quadrada.** Não existe.

**Usar a regra de Sarrus em matriz de quatro linhas.** Ela só vale para três linhas.

**Achar que o determinante da soma é a soma dos determinantes.** Isso é falso. O que vale é para o
produto.

**Esquecer o sinal ao trocar linhas.** Reorganizar a matriz para facilitar a conta é permitido, desde
que o sinal seja corrigido a cada troca.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule o determinante da matriz cuja primeira linha é 3 e 1 e cuja segunda linha é 2 e 4.
2. Calcule o determinante da matriz cuja primeira linha é 5 e 2 e cuja segunda linha é 10 e 4.
3. Calcule o determinante da matriz de três linhas cuja primeira linha é 1, 2 e 3, cuja segunda linha
   é 0, 1 e 4 e cuja terceira linha é 0, 0 e 2.
4. Calcule o determinante da matriz de três linhas cuja primeira linha é 2, 0 e 1, cuja segunda linha
   é 1, 3 e 2 e cuja terceira linha é 0, 1 e 1.
5. Determine x para que o determinante da matriz cuja primeira linha é x e 2 e cuja segunda linha é 3
   e 4 valha 10.

**Bloco B. Consolidação**

6. Calcule o determinante da matriz de três linhas cuja primeira linha é 1, 2 e 3, cuja segunda linha
   é 4, 5 e 6 e cuja terceira linha é 7, 8 e 9.
7. Calcule o determinante da matriz de três linhas cuja primeira linha é 2, menos 1 e 0, cuja segunda
   linha é 1, 3 e 4 e cuja terceira linha é 5, 0 e 2.
8. Determine os valores reais de k que anulam o determinante da matriz cuja primeira linha é k e 4 e
   cuja segunda linha é 1 e k.
9. Uma matriz A de duas linhas e duas colunas tem determinante 5. Calcule o determinante da matriz
   obtida multiplicando A por 3.
10. Uma matriz tem determinante 7. Determine o determinante da transposta dela e justifique.
11. Duas matrizes quadradas do mesmo tamanho têm determinantes 3 e menos 2. Calcule o determinante do
    produto delas.
12. Decida se a matriz cuja primeira linha é 2 e 4 e cuja segunda linha é 3 e 6 admite inversa.
13. Calcule o determinante da matriz de três linhas cuja primeira linha é 1, 0 e 2, cuja segunda
    linha é 3, 1 e 0 e cuja terceira linha é 0, 2 e 1.
14. Uma matriz de três linhas e três colunas tem determinante 4. Determine o determinante da matriz
    obtida multiplicando todos os elementos por 2.

**Bloco C. Aprofundamento**

15. Resolva a equação em que o determinante da matriz cuja primeira linha é x e 2 e cuja segunda
    linha é 3 e x menos 1 vale zero.
16. Mostre, com uma matriz de duas linhas escrita com letras, que uma matriz com duas linhas iguais
    tem determinante zero.
17. Calcule o determinante da matriz de três linhas cuja primeira linha é 1, 1 e 1, cuja segunda
    linha é 1, 2 e 3 e cuja terceira linha é 1, 4 e 9.
18. Determine todos os valores reais de m para os quais a matriz de três linhas cuja primeira linha é
    1, 2 e 3, cuja segunda linha é 2, m e 6 e cuja terceira linha é 3, 6 e 9 admite inversa.
19. Uma matriz A de três linhas e três colunas tem determinante 5. Calcule o determinante da inversa
    de A e o determinante do produto de A pela sua transposta.

### Gabarito

1. 10.
2. 0. A segunda linha é o dobro da primeira.
3. 2. A matriz é triangular, e o determinante é o produto dos elementos da diagonal principal.
4. 3.
5. x igual a 4.
6. 0. A terceira linha é o dobro da segunda menos a primeira, e por isso as três linhas não são
   independentes.
7. Menos 6.
8. k igual a 2 e k igual a menos 2.
9. 45. Multiplicar as duas linhas por 3 multiplica o determinante por 3 ao quadrado.
10. 7. O determinante de uma matriz e o da sua transposta são sempre iguais.
11. Menos 6.
12. Não admite. A segunda linha é proporcional à primeira, e a conta confirma: 2 vezes 6 menos 4
    vezes 3 dá zero.
13. 13.
14. 32. Multiplicar as três linhas por 2 multiplica o determinante por 2 na terceira potência.
15. x igual a 3 e x igual a menos 2. O determinante vale x ao quadrado menos x menos 6.
16. Numa matriz cuja primeira linha é a e b e cuja segunda linha também é a e b, o determinante vale
    a vezes b menos b vezes a, que é zero.
17. 2.
18. Nenhum valor de m serve. A terceira linha é o triplo da primeira, então o determinante é zero
    qualquer que seja m, e a inversa nunca existe.
19. O determinante da inversa vale 1 sobre 5, e o determinante do produto vale 25.

## EN

### Explanation

#### A number that sums up the matrix

The determinant is a number attached to every **square** matrix. It does not exist for a matrix with
more rows than columns, or the other way round. And it answers one important question in a single
stroke: does the matrix have an inverse? The answer is short. It has an inverse exactly when the
determinant is different from zero.

There is a geometric reading too. In a matrix with two rows and two columns, the absolute value of
the determinant is the area of the parallelogram formed by the two rows seen as arrows in the plane.
When the determinant is zero, the parallelogram has collapsed, because the two rows ended up in the
same direction.

#### One row and two rows

For a matrix with a single entry, the determinant is that entry itself.

For a matrix with two rows and two columns with first row a and b and second row c and d, the
determinant is

a times d minus b times c

That is, the product along the main diagonal minus the product along the other diagonal.

**Example 1.** Find the determinant of the matrix whose first row is 2 and 3 and whose second row is
1 and 5.
It is 2 times 5 minus 3 times 1, which gives 10 minus 3, that is, 7.

#### Three rows: the rule of Sarrus

For a matrix with three rows and three columns there is a practical procedure. Copy the first two
columns to the right of the matrix, add the three products along the diagonals that go down to the
right, and subtract the three products along the diagonals that go up.

**Example 2.** Find the determinant of the matrix whose first row is 1, 2 and 0, whose second row is
3, 1 and 4 and whose third row is 2, 0 and 1.
The products going down give 1 times 1 times 1, plus 2 times 4 times 2, plus 0 times 3 times 0, that
is, 1 plus 16 plus 0, which is 17. The products going up give 0 times 1 times 2, plus 1 times 4 times
0, plus 2 times 3 times 1, that is, 0 plus 0 plus 6, which is 6. The determinant is 17 minus 6, which
gives 11.

#### The properties that save work

Many test questions are solved by the properties, with no calculation at all:

- **A row of zeros.** If a whole row is made of zeros, the determinant is zero.
- **Two equal or proportional rows.** The determinant is zero. This is the case that most often shows
  up in disguise.
- **Triangular matrix.** If every entry below the main diagonal is zero, the determinant is the
  product of the diagonal entries.
- **Transpose.** The determinant of a matrix equals the determinant of its transpose.
- **Swapping rows.** Swapping two rows flips the sign of the determinant.
- **Multiplying a row by a number.** The determinant gets multiplied by that number. If a whole
  matrix with n rows is multiplied by a number, the determinant gets multiplied by that number raised
  to n.
- **Product.** The determinant of a product is the product of the determinants.
- **Inverse.** The determinant of the inverse is the reciprocal of the determinant.

**Example 3.** Find the determinant of the matrix whose first row is 2 and 4 and whose second row is
1 and 2.
The first row is twice the second. With no calculation, the determinant is zero. Checking with the
formula: 2 times 2 minus 4 times 1, which gives zero.

#### Determinants with an unknown

When a letter shows up inside the matrix, the determinant becomes an expression, and the question
usually asks for which values of the letter it vanishes. That is how you find out when a matrix stops
having an inverse and when a system stops having a unique solution.

**Example 4.** Find the values of x that make the determinant of the matrix whose first row is x and
3 and whose second row is 3 and x vanish.
The determinant is x squared minus 9. It vanishes when x is 3 or minus 3.

#### Common mistakes

**Computing the determinant of a matrix that is not square.** It does not exist.

**Using the rule of Sarrus on a matrix with four rows.** It only works for three rows.

**Thinking the determinant of a sum is the sum of the determinants.** That is false. What holds is
the rule for the product.

**Forgetting the sign when swapping rows.** Rearranging the matrix to make the work easier is
allowed, as long as the sign is fixed at every swap.

### Exercises

**Block A. Fundamentals**

1. Find the determinant of the matrix whose first row is 3 and 1 and whose second row is 2 and 4.
2. Find the determinant of the matrix whose first row is 5 and 2 and whose second row is 10 and 4.
3. Find the determinant of the matrix with three rows whose first row is 1, 2 and 3, whose second row
   is 0, 1 and 4 and whose third row is 0, 0 and 2.
4. Find the determinant of the matrix with three rows whose first row is 2, 0 and 1, whose second row
   is 1, 3 and 2 and whose third row is 0, 1 and 1.
5. Find x so that the determinant of the matrix whose first row is x and 2 and whose second row is 3
   and 4 equals 10.

**Block B. Building up**

6. Find the determinant of the matrix with three rows whose first row is 1, 2 and 3, whose second row
   is 4, 5 and 6 and whose third row is 7, 8 and 9.
7. Find the determinant of the matrix with three rows whose first row is 2, minus 1 and 0, whose
   second row is 1, 3 and 4 and whose third row is 5, 0 and 2.
8. Find the real values of k that make the determinant of the matrix whose first row is k and 4 and
   whose second row is 1 and k vanish.
9. A matrix A with two rows and two columns has determinant 5. Find the determinant of the matrix
   obtained by multiplying A by 3.
10. A matrix has determinant 7. Find the determinant of its transpose and justify the answer.
11. Two square matrices of the same size have determinants 3 and minus 2. Find the determinant of
    their product.
12. Decide whether the matrix whose first row is 2 and 4 and whose second row is 3 and 6 has an
    inverse.
13. Find the determinant of the matrix with three rows whose first row is 1, 0 and 2, whose second
    row is 3, 1 and 0 and whose third row is 0, 2 and 1.
14. A matrix with three rows and three columns has determinant 4. Find the determinant of the matrix
    obtained by multiplying every entry by 2.

**Block C. Going further**

15. Solve the equation in which the determinant of the matrix whose first row is x and 2 and whose
    second row is 3 and x minus 1 equals zero.
16. Show, using a matrix with two rows written with letters, that a matrix with two equal rows has
    determinant zero.
17. Find the determinant of the matrix with three rows whose first row is 1, 1 and 1, whose second
    row is 1, 2 and 3 and whose third row is 1, 4 and 9.
18. Find every real value of m for which the matrix with three rows whose first row is 1, 2 and 3,
    whose second row is 2, m and 6 and whose third row is 3, 6 and 9 has an inverse.
19. A matrix A with three rows and three columns has determinant 5. Find the determinant of the
    inverse of A and the determinant of the product of A by its transpose.

### Answer key

1. 10.
2. 0. The second row is twice the first.
3. 2. The matrix is triangular, and the determinant is the product of the main diagonal entries.
4. 3.
5. x equals 4.
6. 0. The third row is twice the second minus the first, and so the three rows are not
   independent.
7. Minus 6.
8. k equals 2 and k equals minus 2.
9. 45. Multiplying the two rows by 3 multiplies the determinant by 3 squared.
10. 7. The determinant of a matrix and that of its transpose are always equal.
11. Minus 6.
12. It does not. The second row is proportional to the first, and the calculation confirms it: 2
    times 6 minus 4 times 3 gives zero.
13. 13.
14. 32. Multiplying the three rows by 2 multiplies the determinant by 2 to the third power.
15. x equals 3 and x equals minus 2. The determinant is x squared minus x minus 6.
16. In a matrix whose first row is a and b and whose second row is also a and b, the determinant is a
    times b minus b times a, which is zero.
17. 2.
18. No value of m works. The third row is three times the first, so the determinant is zero whatever
    m may be, and the inverse never exists.
19. The determinant of the inverse is 1 over 5, and the determinant of the product is 25.

## VERIFICACAO

```python
X1: Matrix([[2,3],[1,5]]).det() == 7
X2: Matrix([[1,2,0],[3,1,4],[2,0,1]]).det() == 11
X3: Matrix([[2,4],[1,2]]).det() == 0
X4: solve(Eq(Matrix([[x,3],[3,x]]).det(), 0), x) == [-3, 3]
E1: Matrix([[3,1],[2,4]]).det() == 10
E2: Matrix([[5,2],[10,4]]).det() == 0
E3: Matrix([[1,2,3],[0,1,4],[0,0,2]]).det() == 2 and 1*1*2 == 2
E4: Matrix([[2,0,1],[1,3,2],[0,1,1]]).det() == 3
E5: solve(Eq(Matrix([[x,2],[3,4]]).det(), 10), x) == [4]
E6: Matrix([[1,2,3],[4,5,6],[7,8,9]]).det() == 0
E7: Matrix([[2,-1,0],[1,3,4],[5,0,2]]).det() == -6
E8: solve(Eq(Matrix([[k,4],[1,k]]).det(), 0), k) == [-2, 2]
E9: 3**2 * 5 == 45
E10: simplify(Matrix([[a,b],[c,d]]).det() - Matrix([[a,b],[c,d]]).T.det()) == 0
E11: 3*(-2) == -6
E12: Matrix([[2,4],[3,6]]).det() == 0 and 2*6 - 4*3 == 0
E13: Matrix([[1,0,2],[3,1,0],[0,2,1]]).det() == 13
E14: 2**3 * 4 == 32
E15: solve(Eq(Matrix([[x,2],[3,x-1]]).det(), 0), x) == [-2, 3]
E16: Matrix([[a,b],[a,b]]).det() == 0
E17: Matrix([[1,1,1],[1,2,3],[1,4,9]]).det() == 2
E18: Matrix([[1,2,3],[2,m,6],[3,6,9]]).det() == 0
E19: 5*Rational(1,5) == 1 and 5*5 == 25
```
