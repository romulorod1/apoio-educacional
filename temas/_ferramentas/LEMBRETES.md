# Armadilhas já encontradas ao escrever temas

Lista curta, para consultar antes de escrever cada tema. Todas custaram retrabalho.

## Números precisam bater entre as duas línguas

O verificador compara os números de cada exercício em português e em inglês.

- "elevado a 4" contra "to the fourth" quebra: o inglês perde um número. Use "n na quarta".
- "conte de 10 em 10" tem dois dez, "count on in tens" tem nenhum. Prefira "somando 10 a cada passo"
  e "adding 10 at each step".
- Decimal: escreva 0,4 em português e 0.4 em inglês. O verificador normaliza.

## O problema precisa fechar em número inteiro quando o contexto exige

60% de 36 dá 21,6 meninas. Antes de escrever, confira se a conta cai redonda quando o enunciado fala
de pessoas, figurinhas ou questões.

## Nenhum exercício pode citar outro pelo número

Ela monta a lista marcando e desmarcando questões, então a numeração muda. "Compare com o exercício
8" quebra assim que o 8 sai. Todo enunciado se sustenta sozinho, repetindo a informação necessária.

## Nada de rascunho no texto

Frase que se corrige no meio, reticências, "na verdade", pergunta seguida de "não:". Isso já escapou
duas vezes.

## Expressões de verificação que enganam

- `solve` devolve raiz complexa. Para "nenhuma raiz real" use `real_roots`.
- Inequação pede `solveset(expr, x, Reals)`, não `solve`.
- `S` é o registrador de singletons do sympy. Para um símbolo qualquer use `Symbol('s')`.
- `Rational` não aceita símbolo: escreva `(d-5)/d`, não `Rational(d-5, 1)/d`.
- Estão disponíveis: max, min, enumerate, zip, sorted, range, all, any, solveset, Reals, real_roots.

## Quantidade de exercícios

- 2º ao 5º ano: de 10 a 14.
- 6º ao 3º do médio: de 15 a 20, em três blocos.
- Ao menos um exercício por tema no nível de prova difícil de colégio forte.

## A verificação precisa provar alguma coisa

Escrever `12 == 12` para conferir que o cubo tem 12 arestas passa no verificador e não prova nada.
Pior do que não conferir, porque dá a impressão de que a conta foi checada. O verificador agora
reprova esse padrão.

- Errado: `E8: 12 == 12`
- Certo: `E8: Rational(6*4, 2) == 12` (seis faces de quatro lados, cada aresta contada duas vezes)
- Quando é fato de convenção, como a semana ter 7 dias, marque como conferência humana:
  `E2: 7 == 7  # manual: convencao do calendario`

Comparação entre números diferentes, como `385 > 358`, prova algo e continua valendo.

## Separador de milhar desalinha as línguas com facilidade

Em português escreve-se 4.725 e em inglês 4,725. O verificador normaliza os dois, então passa, mas
basta trocar o separador num único lugar para o número virar outro. O mais seguro é escrever
milhares sem separador nenhum nos enunciados.

## Número por extenso numa língua só

"Six glasses" em inglês contra "6 copos" em português faz o inglês perder um número na comparação.
Use o dígito nas duas línguas, ou o extenso nas duas.

## Horários

Use `8h30` em português e `8:30` em inglês, e nunca `p.m.`. Hora cheia é `9h00` e `9:00`, nunca `9h`
contra `9:00`, senão os números não batem.

## Dinheiro

Prefira conferir em centavos inteiros, com `Rational`, em vez de trabalhar com decimais.

## Símbolos disponíveis na verificação

Só existem estes: x, y, z, a, b, c, d, k, m, n, p, q, r, t, u, v, w, alpha, beta, theta.
Usar `f` ou `S` como incógnita não dá erro de conta: dá "não pode ser avaliado", que é mais fácil de
não perceber. Precisando de outro nome, use `Symbol('nome')`.
