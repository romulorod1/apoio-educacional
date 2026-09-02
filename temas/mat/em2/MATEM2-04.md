---
id: MATEM2-04
serie: em2
unidade: algebra
titulo_pt: Matrizes e suas operações
titulo_en: Matrices and their operations
resumo_pt: Organizar dados em tabelas de números e operar com elas, somando, multiplicando por número e multiplicando matriz por matriz.
resumo_en: Organising data into tables of numbers and operating on them by adding, multiplying by a number and multiplying matrix by matrix.
prerequisitos: []
duracao_min: 90
dificuldade: 3
---

## PT

### Explicação

#### O que é uma matriz

Uma matriz é uma tabela de números organizada em linhas e colunas. A ideia é velha e simples: quando
há muitos dados relacionados, guardá-los numa tabela é melhor do que espalhá-los em frases. Uma
planilha de vendas por loja e por produto já é uma matriz.

O tamanho de uma matriz é dado pelo número de linhas e pelo número de colunas, nessa ordem. Uma
matriz de duas linhas e três colunas tem seis números dentro.

Cada número dentro da matriz é um **elemento**, e ele é localizado por dois índices: o primeiro diz a
linha e o segundo diz a coluna. O elemento da linha i e da coluna j costuma ser escrito a_{ij}, que
se lê a com os índices i e j.

Como não há desenho aqui, cada matriz vai descrita por linhas. Por exemplo, a matriz de duas linhas e
duas colunas cuja primeira linha é 1 e 2 e cuja segunda linha é 3 e 4 tem o elemento 3 na segunda
linha e primeira coluna.

#### Tipos que aparecem sempre

- **Matriz quadrada.** Tem tantas linhas quanto colunas.
- **Matriz nula.** Todos os elementos valem zero.
- **Matriz identidade.** Escrita I, é quadrada, tem 1 na diagonal principal e zero em todo o resto.
  A identidade de duas linhas tem primeira linha 1 e 0 e segunda linha 0 e 1.
- **Matriz transposta.** Troca linhas por colunas. A transposta da matriz cuja primeira linha é 1 e 2
  e cuja segunda linha é 3 e 4 tem primeira linha 1 e 3 e segunda linha 2 e 4.

#### Igualdade

Duas matrizes são iguais quando têm o mesmo tamanho e todos os elementos correspondentes são iguais.
Isso transforma uma igualdade de matrizes num sistema de equações, o que é usado o tempo todo em
prova.

#### Soma e multiplicação por número

Somar matrizes do mesmo tamanho é somar elemento a elemento. Multiplicar uma matriz por um número é
multiplicar cada elemento por esse número. As duas operações são tão simples quanto parecem, e valem
para elas as propriedades usuais: a soma é comutativa e associativa.

**Exemplo 1.** Somar a matriz cuja primeira linha é 1 e 2 e cuja segunda linha é 3 e 4 com a matriz
cuja primeira linha é 0 e 5 e cuja segunda linha é -1 e 2.
Somando posição a posição, a primeira linha do resultado é 1 e 7, e a segunda linha é 2 e 6.

#### O produto de matrizes

Aqui a regra deixa de ser óbvia. O produto de duas matrizes só existe quando o número de colunas da
primeira é igual ao número de linhas da segunda. O resultado tem o número de linhas da primeira e o
número de colunas da segunda.

Para achar o elemento da linha i e da coluna j do produto, pega-se a linha i da primeira matriz e a
coluna j da segunda, multiplicam-se os termos correspondentes e somam-se os produtos. É a regra
conhecida como linha por coluna.

**Exemplo 2.** Multiplicar a matriz cuja primeira linha é 2 e 1 e cuja segunda linha é 0 e 3 pela
matriz cuja primeira linha é 1 e 4 e cuja segunda linha é 2 e 5.
Para o elemento da primeira linha e primeira coluna: 2 × 1 + 1 × 2 = 4. Para o elemento da primeira
linha e segunda coluna: 2 × 4 + 1 × 5 = 13. Repetindo para a segunda linha, sai 6 e 15. O produto tem
primeira linha 4 e 13 e segunda linha 6 e 15.

Essa definição estranha existe por um motivo: ela é exatamente o que faz uma matriz representar uma
transformação, e o produto representar duas transformações feitas em sequência.

#### O produto não é comutativo

Trocar a ordem muda o resultado, e essa é a diferença mais importante em relação aos números.

**Exemplo 3.** Multiplicar a matriz de primeira linha 1 e 1 e segunda linha 0 e 1 pela matriz de
primeira linha 1 e 0 e segunda linha 1 e 1, e depois na ordem contrária.
Na primeira ordem, o resultado tem primeira linha 2 e 1 e segunda linha 1 e 1. Na ordem contrária, o
resultado tem primeira linha 1 e 1 e segunda linha 1 e 2. São matrizes diferentes.

A identidade é a exceção agradável: para qualquer matriz quadrada A, A · I = I · A = A, ou seja,
multiplicar por ela não muda nada. Ela faz na multiplicação de matrizes o mesmo papel que o número 1
faz na multiplicação de números.

#### Matriz inversa

A inversa de uma matriz quadrada A é a matriz A^{-1} que satisfaz A · A^{-1} = A^{-1} · A = I, onde I
é a identidade. Nem toda matriz tem inversa. Para uma matriz de duas linhas e duas colunas com
primeira linha a e b e segunda linha c e d, existe uma receita: calcula-se o número a · d - b · c,
troca-se a posição de a e d, troca-se o sinal de b e de c, e divide-se tudo por esse número. Quando
esse número é zero, a inversa não existe.

**Exemplo 4.** Achar a inversa da matriz de primeira linha 3 e 5 e segunda linha 1 e 2.
O número a · d - b · c é 6 - 5 = 1. Trocando a posição de 3 e 2 e o sinal de 5 e de 1, a inversa tem
primeira linha 2 e -5 e segunda linha -1 e 3.

#### Erros comuns

**Multiplicar elemento a elemento.** A soma é elemento a elemento, mas o produto não. Quem
multiplica posição por posição erra tudo.

**Somar matrizes de tamanhos diferentes.** A soma só existe entre matrizes do mesmo tamanho.

**Inverter a ordem do produto sem pensar.** A · B raramente é igual a B · A.

**Confundir linha com coluna nos índices.** Em a_{ij}, o primeiro índice sempre é a linha.

### Exercícios

**Bloco A. Fundamentos**

1. Na matriz de duas linhas e duas colunas cuja primeira linha é 1 e 2 e cuja segunda linha é 3 e 4,
   escreva o elemento da segunda linha e primeira coluna.
2. Some a matriz cuja primeira linha é 1 e 2 e cuja segunda linha é 3 e 4 com a matriz cuja primeira
   linha é 5 e 6 e cuja segunda linha é 7 e 8.
3. Multiplique por 3 a matriz cuja primeira linha é 2 e -1 e cuja segunda linha é 0 e 4.
4. Determine a transposta da matriz cuja primeira linha é 1 e 2 e cuja segunda linha é 3 e 4.
5. Construa a matriz de duas linhas e duas colunas em que o elemento da linha i e da coluna j é dado
   por a_{ij} = i + j.

**Bloco B. Consolidação**

6. Subtraia, da matriz cuja primeira linha é 5 e 6 e cuja segunda linha é 7 e 8, a matriz cuja
   primeira linha é 1 e 2 e cuja segunda linha é 3 e 4.
7. Multiplique a matriz cuja primeira linha é 1 e 2 e cuja segunda linha é 3 e 4 pela matriz cuja
   primeira linha é 5 e 6 e cuja segunda linha é 7 e 8, nessa ordem.
8. Multiplique a matriz cuja primeira linha é 5 e 6 e cuja segunda linha é 7 e 8 pela matriz cuja
   primeira linha é 1 e 2 e cuja segunda linha é 3 e 4, nessa ordem.
9. Sendo A a matriz cuja primeira linha é 1 e 0 e cuja segunda linha é 2 e 1, e sendo B a matriz cuja
   primeira linha é 0 e 1 e cuja segunda linha é 1 e 2, calcule 2 · A + 3 · B.
10. Multiplique a matriz de duas linhas e três colunas cuja primeira linha é 1, 2 e 3 e cuja segunda
    linha é 4, 5 e 6 pela matriz de três linhas e duas colunas cuja primeira linha é 1 e 0, cuja
    segunda linha é 0 e 1 e cuja terceira linha é 1 e 1.
11. Determine x e y para que a matriz cuja primeira linha é x + y e 3 e cuja segunda linha é 2 e
    x - y seja igual à matriz cuja primeira linha é 5 e 3 e cuja segunda linha é 2 e 1.
12. Verifique que o produto da matriz cuja primeira linha é 1 e 2 e cuja segunda linha é 3 e 4 pela
    matriz identidade de duas linhas devolve a própria matriz.
13. As quantidades vendidas de dois produtos em duas lojas formam a matriz cuja primeira linha é 20 e
    30 e cuja segunda linha é 15 e 25, com as lojas nas linhas e os produtos nas colunas. Os preços
    dos dois produtos formam a matriz coluna cuja primeira linha é 4 e cuja segunda linha é 6.
    Calcule a matriz do faturamento de cada loja.
14. Multiplique a matriz cuja primeira linha é 1 e 2 e cuja segunda linha é 0 e 1 pela matriz cuja
    primeira linha é 1 e 0 e cuja segunda linha é 3 e 1, nessa ordem, e escreva a transposta do
    resultado.

**Bloco C. Aprofundamento**

15. Determine a inversa da matriz cuja primeira linha é 2 e 1 e cuja segunda linha é 5 e 3.
16. Determine a inversa da matriz cuja primeira linha é 1 e 2 e cuja segunda linha é 3 e 4.
17. Determine os valores reais de k para os quais a matriz cuja primeira linha é k e 2 e cuja segunda
    linha é 3 e k não admite inversa.
18. Dada a matriz A cuja primeira linha é 1 e 1 e cuja segunda linha é 0 e 1, calcule A^{3} e
    descreva o que acontece com o elemento da primeira linha e da segunda coluna quando o expoente
    cresce.
19. Resolva o sistema formado pelas equações 2x + y = 7 e 5x + 3y = 18 escrevendo o sistema na forma
    de produto de matrizes e usando a matriz inversa.

### Gabarito

1. 3.
2. A primeira linha é 6 e 8, e a segunda linha é 10 e 12.
3. A primeira linha é 6 e -3, e a segunda linha é 0 e 12.
4. A primeira linha é 1 e 3, e a segunda linha é 2 e 4.
5. A primeira linha é 2 e 3, e a segunda linha é 3 e 4.
6. A primeira linha é 4 e 4, e a segunda linha é 4 e 4.
7. A primeira linha é 19 e 22, e a segunda linha é 43 e 50.
8. A primeira linha é 23 e 34, e a segunda linha é 31 e 46. O resultado mostra que a ordem do produto
   importa.
9. A primeira linha é 2 e 3, e a segunda linha é 7 e 8.
10. A primeira linha é 4 e 5, e a segunda linha é 10 e 11.
11. x = 3 e y = 2. A igualdade de matrizes dá o sistema com x + y = 5 e x - y = 1.
12. O produto tem primeira linha 1 e 2 e segunda linha 3 e 4, ou seja, a própria matriz.
13. A matriz coluna do faturamento tem primeira linha 260 e segunda linha 210.
14. O produto tem primeira linha 7 e 2 e segunda linha 3 e 1. A transposta tem primeira linha 7 e 3 e
    segunda linha 2 e 1.
15. A primeira linha é 3 e -1, e a segunda linha é -5 e 2.
16. A primeira linha é -2 e 1, e a segunda linha é 3/2 e -1/2.
17. k = √6 e k = -√6. A inversa deixa de existir quando o produto dos elementos da diagonal
    principal menos o produto dos outros dois se anula.
18. A^{3} tem primeira linha 1 e 3 e segunda linha 0 e 1. Em A^{n}, o elemento da primeira linha e da
    segunda coluna vale n, e os outros três não mudam.
19. x = 3 e y = 1. A matriz dos coeficientes tem primeira linha 2 e 1 e segunda linha 5 e 3, e a
    inversa dela tem primeira linha 3 e -1 e segunda linha -5 e 2.

## EN

### Explanation

#### What a matrix is

A matrix is a table of numbers arranged in rows and columns. The idea is old and simple: when there
is a lot of related data, keeping it in a table beats scattering it across sentences. A spreadsheet
of sales by shop and by product already is a matrix.

The size of a matrix is given by its number of rows and its number of columns, in that order. A
matrix with two rows and three columns holds six numbers.

Each number inside the matrix is an **entry**, and it is located by two indices: the first gives the
row and the second gives the column. The entry in row i and column j is usually written a_{ij}, read
as a with indices i and j.

Since there are no pictures here, every matrix is described row by row. For instance, the matrix with
two rows and two columns whose first row is 1 and 2 and whose second row is 3 and 4 has the entry 3
in the second row and first column.

#### Types that always show up

- **Square matrix.** It has as many rows as columns.
- **Zero matrix.** Every entry is zero.
- **Identity matrix.** Written I, it is square, with 1 along the main diagonal and zero everywhere
  else. The identity with two rows has first row 1 and 0 and second row 0 and 1.
- **Transpose.** It swaps rows for columns. The transpose of the matrix whose first row is 1 and 2
  and whose second row is 3 and 4 has first row 1 and 3 and second row 2 and 4.

#### Equality

Two matrices are equal when they have the same size and every matching entry is equal. That turns an
equality of matrices into a system of equations, which is used all the time in tests.

#### Addition and multiplication by a number

Adding matrices of the same size means adding entry by entry. Multiplying a matrix by a number means
multiplying every entry by that number. Both operations are as simple as they look, and the usual
properties hold: addition is commutative and associative.

**Example 1.** Add the matrix whose first row is 1 and 2 and whose second row is 3 and 4 to the
matrix whose first row is 0 and 5 and whose second row is -1 and 2.
Adding position by position, the first row of the result is 1 and 7, and the second row is 2 and 6.

#### The product of matrices

Here the rule stops being obvious. The product of two matrices exists only when the number of columns
of the first equals the number of rows of the second. The result has the number of rows of the first
and the number of columns of the second.

To find the entry in row i and column j of the product, take row i of the first matrix and column j
of the second, multiply matching terms and add the products. This is the rule known as row by column.

**Example 2.** Multiply the matrix whose first row is 2 and 1 and whose second row is 0 and 3 by the
matrix whose first row is 1 and 4 and whose second row is 2 and 5.
For the entry in the first row and first column: 2 × 1 + 1 × 2 = 4. For the entry in the first row
and second column: 2 × 4 + 1 × 5 = 13. Repeating for the second row gives 6 and 15. The product has
first row 4 and 13 and second row 6 and 15.

That strange definition exists for a reason: it is exactly what makes a matrix represent a
transformation, and the product represent two transformations carried out one after the other.

#### The product is not commutative

Swapping the order changes the result, and that is the most important difference from ordinary
numbers.

**Example 3.** Multiply the matrix with first row 1 and 1 and second row 0 and 1 by the matrix with
first row 1 and 0 and second row 1 and 1, and then in the opposite order.
In the first order, the result has first row 2 and 1 and second row 1 and 1. In the opposite order,
the result has first row 1 and 1 and second row 1 and 2. They are different matrices.

The identity is the pleasant exception: for any square matrix A, A · I = I · A = A, that is,
multiplying by it changes nothing. It plays the same role in matrix multiplication that the number 1
plays for numbers.

#### Inverse matrix

The inverse of a square matrix A is the matrix A^{-1} that satisfies A · A^{-1} = A^{-1} · A = I,
where I is the identity. Not every matrix has an inverse. For a matrix with two rows and two columns
with first row a and b and second row c and d there is a recipe: work out the number a · d - b · c,
swap the positions of a and d, flip the sign of b and of c, and divide everything by that number.
When that number is zero, the inverse does not exist.

**Example 4.** Find the inverse of the matrix with first row 3 and 5 and second row 1 and 2.
The number a · d - b · c is 6 - 5 = 1. Swapping the positions of 3 and 2 and flipping the sign of 5
and of 1, the inverse has first row 2 and -5 and second row -1 and 3.

#### Common mistakes

**Multiplying entry by entry.** Addition is entry by entry, but the product is not. Whoever
multiplies position by position gets everything wrong.

**Adding matrices of different sizes.** Addition exists only between matrices of the same size.

**Reversing the order of a product without thinking.** A · B is rarely equal to B · A.

**Mixing up row and column in the indices.** In a_{ij}, the first index is always the row.

### Exercises

**Block A. Fundamentals**

1. In the matrix with two rows and two columns whose first row is 1 and 2 and whose second row is 3
   and 4, write the entry in the second row and first column.
2. Add the matrix whose first row is 1 and 2 and whose second row is 3 and 4 to the matrix whose
   first row is 5 and 6 and whose second row is 7 and 8.
3. Multiply by 3 the matrix whose first row is 2 and -1 and whose second row is 0 and 4.
4. Find the transpose of the matrix whose first row is 1 and 2 and whose second row is 3 and 4.
5. Build the matrix with two rows and two columns in which the entry in row i and column j is given
   by a_{ij} = i + j.

**Block B. Building up**

6. From the matrix whose first row is 5 and 6 and whose second row is 7 and 8, subtract the matrix
   whose first row is 1 and 2 and whose second row is 3 and 4.
7. Multiply the matrix whose first row is 1 and 2 and whose second row is 3 and 4 by the matrix whose
   first row is 5 and 6 and whose second row is 7 and 8, in that order.
8. Multiply the matrix whose first row is 5 and 6 and whose second row is 7 and 8 by the matrix whose
   first row is 1 and 2 and whose second row is 3 and 4, in that order.
9. Let A be the matrix whose first row is 1 and 0 and whose second row is 2 and 1, and let B be the
   matrix whose first row is 0 and 1 and whose second row is 1 and 2. Find 2 · A + 3 · B.
10. Multiply the matrix with two rows and three columns whose first row is 1, 2 and 3 and whose
    second row is 4, 5 and 6 by the matrix with three rows and two columns whose first row is 1 and
    0, whose second row is 0 and 1 and whose third row is 1 and 1.
11. Find x and y so that the matrix whose first row is x + y and 3 and whose second row is 2 and
    x - y equals the matrix whose first row is 5 and 3 and whose second row is 2 and 1.
12. Check that the product of the matrix whose first row is 1 and 2 and whose second row is 3 and 4
    by the identity matrix with two rows gives back the same matrix.
13. The quantities sold of two products in two shops form the matrix whose first row is 20 and 30 and
    whose second row is 15 and 25, with the shops along the rows and the products along the columns.
    The prices of the two products form the column matrix whose first row is 4 and whose second row
    is 6. Find the matrix of the revenue of each shop.
14. Multiply the matrix whose first row is 1 and 2 and whose second row is 0 and 1 by the matrix
    whose first row is 1 and 0 and whose second row is 3 and 1, in that order, and write the
    transpose of the result.

**Block C. Going further**

15. Find the inverse of the matrix whose first row is 2 and 1 and whose second row is 5 and 3.
16. Find the inverse of the matrix whose first row is 1 and 2 and whose second row is 3 and 4.
17. Find the real values of k for which the matrix whose first row is k and 2 and whose second row is
    3 and k has no inverse.
18. Given the matrix A whose first row is 1 and 1 and whose second row is 0 and 1, find A^{3} and
    describe what happens to the entry in the first row and second column as the exponent grows.
19. Solve the system made of the equations 2x + y = 7 and 5x + 3y = 18 by writing the system as a
    product of matrices and using the inverse matrix.

### Answer key

1. 3.
2. The first row is 6 and 8, and the second row is 10 and 12.
3. The first row is 6 and -3, and the second row is 0 and 12.
4. The first row is 1 and 3, and the second row is 2 and 4.
5. The first row is 2 and 3, and the second row is 3 and 4.
6. The first row is 4 and 4, and the second row is 4 and 4.
7. The first row is 19 and 22, and the second row is 43 and 50.
8. The first row is 23 and 34, and the second row is 31 and 46. The result shows that the order of
   the product matters.
9. The first row is 2 and 3, and the second row is 7 and 8.
10. The first row is 4 and 5, and the second row is 10 and 11.
11. x = 3 and y = 2. Equality of matrices gives the system with x + y = 5 and x - y = 1.
12. The product has first row 1 and 2 and second row 3 and 4, that is, the matrix itself.
13. The column matrix of the revenue has first row 260 and second row 210.
14. The product has first row 7 and 2 and second row 3 and 1. Its transpose has first row 7 and 3 and
    second row 2 and 1.
15. The first row is 3 and -1, and the second row is -5 and 2.
16. The first row is -2 and 1, and the second row is 3/2 and -1/2.
17. k = √6 and k = -√6. The inverse stops existing when the product of the main diagonal entries
    minus the product of the other two vanishes.
18. A^{3} has first row 1 and 3 and second row 0 and 1. In A^{n}, the entry in the first row and
    second column equals n, and the other three do not change.
19. x = 3 and y = 1. The coefficient matrix has first row 2 and 1 and second row 5 and 3, and its
    inverse has first row 3 and -1 and second row -5 and 2.

## VERIFICACAO

```python
X1: Matrix([[1,2],[3,4]]) + Matrix([[0,5],[-1,2]]) == Matrix([[1,7],[2,6]])
X2: Matrix([[2,1],[0,3]])*Matrix([[1,4],[2,5]]) == Matrix([[4,13],[6,15]])
X3: Matrix([[1,1],[0,1]])*Matrix([[1,0],[1,1]]) == Matrix([[2,1],[1,1]]) and Matrix([[1,0],[1,1]])*Matrix([[1,1],[0,1]]) == Matrix([[1,1],[1,2]])
X4: Matrix([[3,5],[1,2]]).inv() == Matrix([[2,-5],[-1,3]])
E1: Matrix([[1,2],[3,4]])[1,0] == 3
E2: Matrix([[1,2],[3,4]]) + Matrix([[5,6],[7,8]]) == Matrix([[6,8],[10,12]])
E3: 3*Matrix([[2,-1],[0,4]]) == Matrix([[6,-3],[0,12]])
E4: Matrix([[1,2],[3,4]]).T == Matrix([[1,3],[2,4]])
E5: Matrix([[1+1,1+2],[2+1,2+2]]) == Matrix([[2,3],[3,4]])
E6: Matrix([[5,6],[7,8]]) - Matrix([[1,2],[3,4]]) == Matrix([[4,4],[4,4]])
E7: Matrix([[1,2],[3,4]])*Matrix([[5,6],[7,8]]) == Matrix([[19,22],[43,50]])
E8: Matrix([[5,6],[7,8]])*Matrix([[1,2],[3,4]]) == Matrix([[23,34],[31,46]])
E9: 2*Matrix([[1,0],[2,1]]) + 3*Matrix([[0,1],[1,2]]) == Matrix([[2,3],[7,8]])
E10: Matrix([[1,2,3],[4,5,6]])*Matrix([[1,0],[0,1],[1,1]]) == Matrix([[4,5],[10,11]])
E11: solve([Eq(x + y, 5), Eq(x - y, 1)], [x, y]) == {x: 3, y: 2}
E12: Matrix([[1,2],[3,4]])*Matrix([[1,0],[0,1]]) == Matrix([[1,2],[3,4]])
E13: Matrix([[20,30],[15,25]])*Matrix([[4],[6]]) == Matrix([[260],[210]])
E14: Matrix([[1,2],[0,1]])*Matrix([[1,0],[3,1]]) == Matrix([[7,2],[3,1]]) and (Matrix([[1,2],[0,1]])*Matrix([[1,0],[3,1]])).T == Matrix([[7,3],[2,1]])
E15: Matrix([[2,1],[5,3]]).inv() == Matrix([[3,-1],[-5,2]])
E16: Matrix([[1,2],[3,4]]).inv() == Matrix([[-2,1],[Rational(3,2),Rational(-1,2)]])
E17: solve(Eq(Matrix([[k,2],[3,k]]).det(), 0), k) == [-sqrt(6), sqrt(6)]
E18: Matrix([[1,1],[0,1]])**3 == Matrix([[1,3],[0,1]]) and Matrix([[1,1],[0,1]])**5 == Matrix([[1,5],[0,1]])
E19: Matrix([[2,1],[5,3]]).inv()*Matrix([[7],[18]]) == Matrix([[3],[1]])
```
