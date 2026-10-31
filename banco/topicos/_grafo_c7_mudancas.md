# Grafo de pré-requisitos de matemática: mudanças da revisão do C7 (30/10/2026)

Revisão, assunto por assunto, do campo `prerequisitos` de `matematica.json`
(148 assuntos, do 2º ano do fundamental ao 3º do médio), feita pela entrega 1 do
item C7 sobre o grafo autoral de 09/2026. Os ids, os anos e os títulos não
mudaram; só as arestas.

Regra adotada: cada assunto lista os pré-requisitos IMEDIATOS, o que o aluno
precisa saber logo antes. A cadeia inteira sai da transitividade: se A precisa
de B e B precisa de C, A não lista C. Um pré-requisito está no mesmo ano ou em
ano anterior, nunca em ano posterior. Raízes (sem pré-requisito) só no começo
do 2º ano. A prova é `_teste/testa_grafo.js`, no portão rápido.

Números da primeira passada: 138 arestas antes, 221 depois; 122 acrescentadas,
39 tiradas, 99 mantidas. Depois da leitura cega (seção no fim): 233 arestas.
Raízes: MAT02-01 (números até 100) e MAT02-06 (figuras planas). Profundidade
máxima da cadeia: 25 níveis. Nenhuma aresta redundante deixada de propósito (a
lista de exceções do teste está vazia).

As tabelas por ano abaixo são o registro da primeira passada; a seção "Leitura
cega de 30/10" diz o que mudou depois e vence onde discordar delas.

Notação: `A <- B` quer dizer "A tem B como pré-requisito". "Acrescentada" e
"Tirada" dizem o que mudou em relação ao grafo de 09/2026. Quando uma aresta
foi tirada por redundância, o motivo diz por qual caminho ela já chega.

## 2º ano

| Assunto | Mudança | Aresta | Motivo |
| --- | --- | --- | --- |
| MAT02-09 Horas, dias e meses | Acrescentada | MAT02-09 <- MAT02-01 | Ler horas e datas é ler e comparar números; não exige adição. |
| MAT02-09 Horas, dias e meses | Tirada | MAT02-09 <- MAT02-02 | Trocada por MAT02-01: a adição não é usada para ler relógio e calendário. |
| MAT02-12 Problemas do dia a dia | Tirada | MAT02-12 <- MAT02-02 | Redundante: já vem por MAT02-03 (subtração pede adição). |

## 3º ano

| Assunto | Mudança | Aresta | Motivo |
| --- | --- | --- | --- |
| MAT03-02 Adição com reagrupamento | Acrescentada | MAT03-02 <- MAT02-02 | Reagrupar é estender a adição até 100; MAT03-01 (números até 1000) sozinho não traz a adição. |
| MAT03-03 Subtração com reagrupamento | Acrescentada | MAT03-03 <- MAT02-03 | A subtração até 100 é o que se estende; não estava na cadeia de MAT03-02. |
| MAT03-04 Multiplicação e tabuada | Acrescentada | MAT03-04 <- MAT02-04 | Dobro e triplo são a primeira multiplicação (BNCC EF02MA07 para EF03MA07). |
| MAT03-07 Figuras planas e seus lados | Acrescentada | MAT03-07 <- MAT02-06 | Era raiz no 3º ano; continua o reconhecimento de figuras do 2º. |
| MAT03-08 Metro e centímetro | Acrescentada | MAT03-08 <- MAT02-08 | Continua a medição de comprimentos do 2º ano. |
| MAT03-08 Metro e centímetro | Acrescentada | MAT03-08 <- MAT03-01 | 1 m = 100 cm e medidas em centenas pedem números até 1000. |
| MAT03-08 Metro e centímetro | Tirada | MAT03-08 <- MAT03-05 | Divisão não é usada para medir com metro e centímetro. |
| MAT03-10 Dinheiro e troco | Acrescentada | MAT03-10 <- MAT02-10 | Continua moedas e cédulas do 2º ano. |
| MAT03-10 Dinheiro e troco | Acrescentada | MAT03-10 <- MAT03-03 | Troco é subtração, com reagrupamento. |
| MAT03-10 Dinheiro e troco | Tirada | MAT03-10 <- MAT03-05 | Divisão não entra em troco. |
| MAT03-11 Relógio e calendário | Acrescentada | MAT03-11 <- MAT02-09 | Continua horas, dias e meses do 2º ano. |
| MAT03-11 Relógio e calendário | Acrescentada | MAT03-11 <- MAT03-04 | Os minutos no relógio de ponteiros contam de 5 em 5 (tabuada do 5). |
| MAT03-11 Relógio e calendário | Tirada | MAT03-11 <- MAT03-05 | Divisão não é usada para ler relógio e calendário. |
| MAT03-12 Gráficos de barras | Acrescentada | MAT03-12 <- MAT02-11 | Continua tabelas e gráficos simples do 2º ano. |
| MAT03-12 Gráficos de barras | Acrescentada | MAT03-12 <- MAT03-01 | A escala do gráfico vai a centenas. |
| MAT03-12 Gráficos de barras | Tirada | MAT03-12 <- MAT03-02 | Ler barras não exige adição com reagrupamento. |

## 4º ano

| Assunto | Mudança | Aresta | Motivo |
| --- | --- | --- | --- |
| MAT04-01 Números até 10.000 | Acrescentada | MAT04-01 <- MAT03-01 | Era raiz; estende o valor posicional até 1000. |
| MAT04-02 Adição e subtração com números grandes | Acrescentada | MAT04-02 <- MAT03-03 | Os algoritmos com reagrupamento (subtração traz a adição) são o que se estende. |
| MAT04-03 Multiplicação por dois algarismos | Acrescentada | MAT04-03 <- MAT03-04 | A tabuada não estava na cadeia de MAT04-02. |
| MAT04-04 Divisão com resto | Acrescentada | MAT04-04 <- MAT03-05 | A ideia de repartir é o que ganha o resto. |
| MAT04-05 Frações: comparar e equivalentes | Acrescentada | MAT04-05 <- MAT03-06 | Era raiz; metade, terço e quarto são as frações unitárias que se comparam aqui. |
| MAT04-06 Decimais com dinheiro e medidas | Acrescentada | MAT04-06 <- MAT03-10 | R$ 2,50 é o dinheiro do 3º ano com vírgula. |
| MAT04-06 Decimais com dinheiro e medidas | Acrescentada | MAT04-06 <- MAT03-08 | 1,50 m é metro e centímetro com vírgula. |
| MAT04-07 Retas, ângulos e giros | Acrescentada | MAT04-07 <- MAT03-07 | Era raiz; lados e vértices das figuras do 3º ano. |
| MAT04-09 Perímetro e área | Acrescentada | MAT04-09 <- MAT03-08 | Perímetro é medida de comprimento em metro e centímetro. |
| MAT04-09 Perímetro e área | Acrescentada | MAT04-09 <- MAT03-07 | Perímetro é a soma dos lados da figura; precisa reconhecer lados. |
| MAT04-10 Unidades de medida e transformações | Acrescentada | MAT04-10 <- MAT03-09 | Massa e capacidade não estavam na cadeia de MAT04-06. |
| MAT04-11 Possível, impossível e provável | Acrescentada | MAT04-11 <- MAT03-12 | Era raiz; estimar chance compara frequências registradas em tabela e gráfico (BNCC EF03MA25 já vem com a estatística). |
| MAT04-12 Gráficos e média simples | Acrescentada | MAT04-12 <- MAT03-12 | Continua os gráficos de barras do 3º ano. |
| MAT04-12 Gráficos e média simples | Acrescentada | MAT04-12 <- MAT04-04 | Média é soma dividida pela quantidade. |
| MAT04-12 Gráficos e média simples | Tirada | MAT04-12 <- MAT04-02 | Redundante: já vem por MAT04-04 (divisão pede multiplicação, que pede adição e subtração). |

## 5º ano

| Assunto | Mudança | Aresta | Motivo |
| --- | --- | --- | --- |
| MAT05-01 Números até 100.000 | Acrescentada | MAT05-01 <- MAT04-01 | Era raiz; estende o sistema decimal de 10.000. |
| MAT05-02 Quatro operações com naturais | Acrescentada | MAT05-02 <- MAT04-04 | A divisão com resto (que traz as outras três) é o que se consolida. |
| MAT05-03 Frações com o mesmo denominador | Acrescentada | MAT05-03 <- MAT04-05 | Somar frações pede saber o que é fração e comparar. |
| MAT05-03 Frações com o mesmo denominador | Tirada | MAT05-03 <- MAT05-02 | Operar numeradores não exige as quatro operações até 100.000. |
| MAT05-04 Frações e decimais: a mesma ideia | Acrescentada | MAT05-04 <- MAT04-06 | O decimal de dinheiro e medida é a representação que se liga à fração. |
| MAT05-04 Frações e decimais: a mesma ideia | Acrescentada | MAT05-04 <- MAT05-01 | Décimos e centésimos estendem o sistema decimal para a direita. |
| MAT05-04 Frações e decimais: a mesma ideia | Tirada | MAT05-04 <- MAT05-03 | Operar frações de mesmo denominador não é pré-requisito para ver que 0,3 = 3/10. |
| MAT05-05 Operações com decimais | Acrescentada | MAT05-05 <- MAT05-02 | Os algoritmos com decimais são os das quatro operações com naturais. |
| MAT05-08 Sólidos e planificações | Acrescentada | MAT05-08 <- MAT02-07 | Era raiz; continua os sólidos do dia a dia do 2º ano. |
| MAT05-08 Sólidos e planificações | Acrescentada | MAT05-08 <- MAT04-08 | As faces da planificação são polígonos. |
| MAT05-09 Perímetro, área e volume | Acrescentada | MAT05-09 <- MAT04-09 | Continua perímetro e área do 4º ano. |
| MAT05-09 Perímetro, área e volume | Acrescentada | MAT05-09 <- MAT05-08 | Volume é de sólidos; conta cubinhos em blocos. |
| MAT05-10 Transformando unidades | Acrescentada | MAT05-10 <- MAT04-10 | Continua as transformações do 4º ano; não estava na cadeia de MAT05-05. |
| MAT05-11 Localização e plano cartesiano | Acrescentada | MAT05-11 <- MAT04-07 | Era raiz; localizar e deslocar usa direção e giro. |
| MAT05-12 Média, tabelas e gráficos | Acrescentada | MAT05-12 <- MAT04-12 | Continua gráficos e média do 4º ano. |
| MAT05-12 Média, tabelas e gráficos | Acrescentada | MAT05-12 <- MAT05-02 | Média com números maiores pede as quatro operações. |
| MAT05-12 Média, tabelas e gráficos | Tirada | MAT05-12 <- MAT05-06 | Gráfico com porcentagem entra no 6º ano (MAT06-14), não no 5º. |

## 6º ano

| Assunto | Mudança | Aresta | Motivo |
| --- | --- | --- | --- |
| MAT06-01 Sistema de numeração decimal | Acrescentada | MAT06-01 <- MAT05-01 | Era raiz; formaliza o sistema visto até 100.000. |
| MAT06-02 Operações com naturais | Acrescentada | MAT06-02 <- MAT05-02 | As quatro operações do 5º ano são o que se aprofunda. |
| MAT06-03 Múltiplos, divisores, MMC e MDC | Acrescentada | MAT06-03 <- MAT05-07 | Múltiplos e divisores do 5º ano não estavam na cadeia de MAT06-02. |
| MAT06-05 Frações: o que são e como comparar | Acrescentada | MAT06-05 <- MAT05-03 | Frações do 5º ano (que trazem as do 4º); MMC fica para comparar denominadores diferentes. |
| MAT06-07 Decimais e suas operações | Acrescentada | MAT06-07 <- MAT05-05 | As operações com decimais do 5º ano são o que se estende (multiplicação e divisão). |
| MAT06-08 Porcentagem no dia a dia | Acrescentada | MAT06-08 <- MAT05-06 | Continua os primeiros passos de porcentagem do 5º ano. |
| MAT06-08 Porcentagem no dia a dia | Tirada | MAT06-08 <- MAT06-05 | Redundante: já vem por MAT06-07 (decimais pedem operações com frações, que pedem frações). |
| MAT06-09 Ângulos e retas | Acrescentada | MAT06-09 <- MAT04-07 | Continua retas, ângulos e giros do 4º ano. |
| MAT06-09 Ângulos e retas | Tirada | MAT06-09 <- MAT06-02 | Operações com naturais não são o que se precisa para ângulos e retas. |
| MAT06-10 Polígonos e classificação | Acrescentada | MAT06-10 <- MAT04-08 | Continua polígonos e simetria do 4º ano. |
| MAT06-11 Perímetro e área de figuras planas | Acrescentada | MAT06-11 <- MAT05-09 | Continua perímetro, área e volume do 5º ano. |
| MAT06-12 Volume e unidades de medida | Acrescentada | MAT06-12 <- MAT05-10 | Transformar unidades (litro, dm3) vem do 5º ano. |
| MAT06-13 Plano cartesiano | Acrescentada | MAT06-13 <- MAT05-11 | Continua localização e plano cartesiano do 5º ano. |
| MAT06-13 Plano cartesiano | Tirada | MAT06-13 <- MAT06-11 | Área e perímetro não são pré-requisito do plano cartesiano. |
| MAT06-14 Tabelas, gráficos e média | Acrescentada | MAT06-14 <- MAT05-12 | Continua média, tabelas e gráficos do 5º ano. |

## 7º ano

| Assunto | Mudança | Aresta | Motivo |
| --- | --- | --- | --- |
| MAT07-01 Inteiros e reta numérica | Acrescentada | MAT07-01 <- MAT06-02 | Era raiz; o negativo nasce da subtração que não cabe nos naturais. |
| MAT07-03 Racionais e suas formas | Acrescentada | MAT07-03 <- MAT07-01 | O racional negativo estende os inteiros; a representação não pede as operações com inteiros. |
| MAT07-03 Racionais e suas formas | Acrescentada | MAT07-03 <- MAT06-07 | As formas fração e decimal vêm dos decimais do 6º (que trazem as frações). |
| MAT07-03 Racionais e suas formas | Tirada | MAT07-03 <- MAT06-05 | Redundante: já vem por MAT06-07. |
| MAT07-03 Racionais e suas formas | Tirada | MAT07-03 <- MAT07-02 | Operar inteiros é pré-requisito de operar racionais (MAT07-04), não de representá-los. |
| MAT07-04 Operações com racionais | Acrescentada | MAT07-04 <- MAT07-02 | A regra de sinais vem das operações com inteiros. |
| MAT07-05 Razão e proporção | Acrescentada | MAT07-05 <- MAT06-07 | Razão é quociente (fração e decimal); não exige racionais negativos. |
| MAT07-05 Razão e proporção | Tirada | MAT07-05 <- MAT07-04 | Trocada por MAT06-07: negativos não entram em razão e proporção. |
| MAT07-07 Porcentagem e juros simples | Acrescentada | MAT07-07 <- MAT06-08 | Continua a porcentagem do 6º ano. |
| MAT07-07 Porcentagem e juros simples | Acrescentada | MAT07-07 <- MAT07-06 | Porcentagem e juros são resolvidos por regra de três (que traz razão e proporção). |
| MAT07-07 Porcentagem e juros simples | Tirada | MAT07-07 <- MAT07-04 | Negativos não entram; os decimais vêm pela cadeia de MAT06-08. |
| MAT07-07 Porcentagem e juros simples | Tirada | MAT07-07 <- MAT07-05 | Redundante: já vem por MAT07-06. |
| MAT07-08 Sequências e regularidades | Acrescentada | MAT07-08 <- MAT02-05 | Sequências e padrões do 2º ano são o único antecedente do tema; a cadeia de inteiros não o trazia. |
| MAT07-09 Linguagem algébrica | Acrescentada | MAT07-09 <- MAT07-04 | Calcular o valor de uma expressão pede operar racionais. |
| MAT07-11 Ângulos: medir, somar e classificar | Acrescentada | MAT07-11 <- MAT06-09 | Era raiz; continua ângulos e retas do 6º ano. |
| MAT07-12 Triângulos e quadriláteros | Acrescentada | MAT07-12 <- MAT06-10 | Polígonos e classificação do 6º ano não estavam na cadeia de MAT07-11. |
| MAT07-13 Área e perímetro de figuras compostas | Acrescentada | MAT07-13 <- MAT06-11 | Decompor em figuras simples pede área e perímetro delas. |
| MAT07-14 Média, moda, mediana e probabilidade | Acrescentada | MAT07-14 <- MAT06-14 | Continua tabelas, gráficos e média do 6º ano. |
| MAT07-14 Média, moda, mediana e probabilidade | Acrescentada | MAT07-14 <- MAT04-11 | A probabilidade formaliza o possível e provável do 4º ano, que não estava em cadeia nenhuma. |
| MAT07-14 Média, moda, mediana e probabilidade | Tirada | MAT07-14 <- MAT07-04 | Negativos não entram; frações e decimais vêm pela cadeia de MAT06-14. |

## 8º ano

| Assunto | Mudança | Aresta | Motivo |
| --- | --- | --- | --- |
| MAT08-04 Dízimas e fração geratriz | Acrescentada | MAT08-04 <- MAT07-10 | O procedimento da geratriz (x = 0,333..., 10x = 3,333...) é uma equação do 1º grau. |
| MAT08-04 Dízimas e fração geratriz | Tirada | MAT08-04 <- MAT07-03 | Redundante: já vem por MAT07-10 (equação pede linguagem algébrica, que pede operar racionais, que pede racionais). |
| MAT08-05 Expressões algébricas e monômios | Acrescentada | MAT08-05 <- MAT08-01 | Monômios usam expoentes e propriedades da potenciação. |
| MAT08-09 Equações com duas incógnitas | Acrescentada | MAT08-09 <- MAT06-13 | As soluções são pares no plano cartesiano (BNCC EF08MA08). |
| MAT08-12 Congruência de triângulos | Acrescentada | MAT08-12 <- MAT07-12 | Triângulos do 7º ano não estavam na cadeia de MAT08-11. |
| MAT08-13 Círculo: comprimento e área | Acrescentada | MAT08-13 <- MAT06-07 | Multiplicar por 3,14 pede operar decimais, que não estava na cadeia de MAT06-11. |

## 9º ano

| Assunto | Mudança | Aresta | Motivo |
| --- | --- | --- | --- |
| MAT09-01 Reais e irracionais | Acrescentada | MAT09-01 <- MAT08-03 | Era raiz; raiz quadrada não exata é o primeiro irracional. |
| MAT09-01 Reais e irracionais | Acrescentada | MAT09-01 <- MAT08-04 | Racional é dízima periódica ou decimal finito; irracional é o que não é. |
| MAT09-02 Potências com expoente negativo e fracionário | Acrescentada | MAT09-02 <- MAT08-03 | Expoente fracionário é raiz (que traz a potenciação). |
| MAT09-02 Potências com expoente negativo e fracionário | Tirada | MAT09-02 <- MAT09-01 | O conjunto dos reais não é pré-requisito de estender o expoente; a definição é sobre potências e raízes. |
| MAT09-04 Equação do 2º grau | Acrescentada | MAT09-04 <- MAT08-07 | Resolver por fatoração e completar quadrados pede fatoração e produtos notáveis. |
| MAT09-06 Relações métricas no triângulo retângulo | Acrescentada | MAT09-06 <- MAT09-08 | As relações métricas saem da semelhança dos triângulos formados pela altura. |
| MAT09-07 Teorema de Pitágoras | Acrescentada | MAT09-07 <- MAT07-12 | O teorema é sobre triângulos retângulos; a cadeia de radicais não trazia geometria. |
| MAT09-08 Semelhança e Tales | Acrescentada | MAT09-08 <- MAT07-05 | Semelhança é razão entre lados e proporção. |
| MAT09-08 Semelhança e Tales | Acrescentada | MAT09-08 <- MAT08-11 | Tales é sobre feixe de paralelas cortado por transversais. |
| MAT09-08 Semelhança e Tales | Acrescentada | MAT09-08 <- MAT07-12 | Semelhança de triângulos pede triângulos e seus ângulos. |
| MAT09-08 Semelhança e Tales | Tirada | MAT09-08 <- MAT09-03 | Radicais não entram em semelhança nem em Tales. |
| MAT09-10 Funções: a ideia e o gráfico | Acrescentada | MAT09-10 <- MAT08-09 | y = 2x + 1 no plano é a equação com duas incógnitas vista como função. |
| MAT09-11 Circunferência: ângulos e arcos | Acrescentada | MAT09-11 <- MAT08-13 | Continua o círculo do 8º ano. |
| MAT09-11 Circunferência: ângulos e arcos | Acrescentada | MAT09-11 <- MAT07-12 | Ângulo inscrito e central se provam com triângulos isósceles e soma dos ângulos. |
| MAT09-11 Circunferência: ângulos e arcos | Tirada | MAT09-11 <- MAT09-07 | Pitágoras não é usado em ângulos e arcos. |
| MAT09-12 Volume de cilindros e outros sólidos | Acrescentada | MAT09-12 <- MAT08-13 | A base do cilindro é um círculo: área do círculo. |
| MAT09-12 Volume de cilindros e outros sólidos | Acrescentada | MAT09-12 <- MAT06-12 | Continua volume e unidades do 6º ano. |
| MAT09-12 Volume de cilindros e outros sólidos | Tirada | MAT09-12 <- MAT09-07 | Pitágoras não é usado em volume de cilindro. |
| MAT09-13 Tendência e dispersão | Acrescentada | MAT09-13 <- MAT08-14 | Era raiz; continua média ponderada do 8º ano. |
| MAT09-14 Probabilidade de eventos sucessivos | Acrescentada | MAT09-14 <- MAT08-14 | Era raiz; continua a probabilidade do 8º ano. |

## 1ª série do médio

| Assunto | Mudança | Aresta | Motivo |
| --- | --- | --- | --- |
| MATEM1-01 Conjuntos numéricos | Acrescentada | MATEM1-01 <- MAT09-01 | Era raiz; organiza N, Z, Q, I e R vistos até o 9º ano. |
| MATEM1-02 Função: domínio, contradomínio e imagem | Acrescentada | MATEM1-02 <- MAT09-10 | A ideia e o gráfico de função do 9º ano são o que se formaliza. |
| MATEM1-05 Inequações do 1º e do 2º grau | Tirada | MATEM1-05 <- MATEM1-03 | Redundante: já vem por MATEM1-04 (quadrática pede afim). |
| MATEM1-06 Função modular | Tirada | MATEM1-06 <- MATEM1-02 | Redundante: já vem por MATEM1-03. |
| MATEM1-12 Sequências e recorrência | Tirada | MATEM1-12 <- MATEM1-10 | Redundante: já vem por MATEM1-11 (PG pede PA). |
| MATEM1-13 Estatística descritiva | Acrescentada | MATEM1-13 <- MAT09-13 | Era raiz; continua tendência e dispersão do 9º ano. |
| MATEM1-14 Trigonometria no triângulo retângulo | Acrescentada | MATEM1-14 <- MAT09-09 | Era raiz; continua seno, cosseno e tangente do 9º ano. |

## 2ª série do médio

| Assunto | Mudança | Aresta | Motivo |
| --- | --- | --- | --- |
| MATEM2-01 Ciclo trigonométrico | Acrescentada | MATEM2-01 <- MAT09-11 | Radiano é razão entre arco e raio: arcos e ângulos na circunferência. |
| MATEM2-02 Funções trigonométricas | Acrescentada | MATEM2-02 <- MATEM1-02 | Seno e cosseno como função pedem domínio, imagem e gráfico; a cadeia do ciclo não trazia função. |
| MATEM2-04 Matrizes e suas operações | Acrescentada | MATEM2-04 <- MAT07-04 | Era raiz; operar matrizes é operar os números das entradas (racionais, com sinal). |
| MATEM2-06 Sistemas lineares | Acrescentada | MATEM2-06 <- MAT08-10 | Os sistemas 2x2 do 8º ano são o que se generaliza; não estavam na cadeia de determinantes. |
| MATEM2-07 Princípio fundamental da contagem | Acrescentada | MATEM2-07 <- MAT09-14 | Era raiz; a árvore de possibilidades e o produto de casos já aparecem nos eventos sucessivos do 9º ano. |
| MATEM2-09 Binômio de Newton | Acrescentada | MATEM2-09 <- MAT08-06 | (a + b)^n generaliza os produtos notáveis; a cadeia de contagem não trazia álgebra. |
| MATEM2-11 Prismas e pirâmides | Acrescentada | MATEM2-11 <- MAT09-12 | Continua volume de sólidos do 9º ano. |
| MATEM2-13 Juros compostos | Acrescentada | MATEM2-13 <- MAT07-07 | Continua juros simples do 7º ano, que não estava em cadeia nenhuma do médio. |
| MATEM2-13 Juros compostos | Acrescentada | MATEM2-13 <- MATEM1-07 | M = C(1 + i)^n é crescimento exponencial. |
| MATEM2-13 Juros compostos | Tirada | MATEM2-13 <- MATEM1-11 | PG é irmã, não pré-requisito: o montante se obtém pela função exponencial. |
| MATEM2-14 Distribuições e dispersão | Acrescentada | MATEM2-14 <- MATEM1-13 | Era raiz; continua a estatística descritiva da 1ª série. |
| MATEM2-15 Identidades trigonométricas | Acrescentada | MATEM2-15 <- MATEM2-01 | Adição de arcos e arco duplo se definem e provam no ciclo. |
| MATEM2-15 Identidades trigonométricas | Tirada | MATEM2-15 <- MATEM2-02 | Trocada por MATEM2-01: as identidades não exigem o estudo das funções e seus gráficos. |

## 3ª série do médio

| Assunto | Mudança | Aresta | Motivo |
| --- | --- | --- | --- |
| MATEM3-01 Geometria analítica: ponto e distância | Acrescentada | MATEM3-01 <- MAT09-07 | A fórmula da distância é Pitágoras. |
| MATEM3-01 Geometria analítica: ponto e distância | Acrescentada | MATEM3-01 <- MAT06-13 | Coordenadas no plano cartesiano. |
| MATEM3-01 Geometria analítica: ponto e distância | Tirada | MATEM3-01 <- MATEM1-02 | Função não é pré-requisito de ponto e distância; entra na reta (MATEM3-02). |
| MATEM3-02 Geometria analítica: a reta | Acrescentada | MATEM3-02 <- MATEM1-03 | Coeficiente angular e equação reduzida são a função afim. |
| MATEM3-05 Complexos: forma algébrica | Acrescentada | MATEM3-05 <- MAT09-04 | i nasce da equação do 2º grau com discriminante negativo (que traz radicais e reais). |
| MATEM3-05 Complexos: forma algébrica | Tirada | MATEM3-05 <- MATEM1-04 | O gráfico da quadrática não é necessário; a motivação é a equação. |
| MATEM3-07 Polinômios: operações e divisão | Acrescentada | MATEM3-07 <- MAT08-08 | Continua a manipulação algébrica do 8º ano (frações algébricas trazem fatoração e produtos notáveis). |
| MATEM3-07 Polinômios: operações e divisão | Tirada | MATEM3-07 <- MATEM1-04 | A função quadrática não é pré-requisito de operar e dividir polinômios. |
| MATEM3-08 Equações polinomiais e raízes | Acrescentada | MATEM3-08 <- MATEM3-05 | Raízes complexas e o teorema fundamental da álgebra. |
| MATEM3-09 Limite e continuidade | Acrescentada | MATEM3-09 <- MATEM1-12 | Limite de sequência e recorrência. |
| MATEM3-09 Limite e continuidade | Acrescentada | MATEM3-09 <- MATEM1-09 | Comportamento de funções (exponencial, logarítmica, composta) perto de um ponto e no infinito. |
| MATEM3-09 Limite e continuidade | Tirada | MATEM3-09 <- MATEM3-08 | Equações polinomiais não são pré-requisito de limite; a fatoração necessária já vem pela cadeia de funções. |
| MATEM3-10 Revisão: funções e gráficos | Acrescentada | MATEM3-10 <- MATEM1-05 | Revisão cobre inequações (que trazem afim e quadrática). |
| MATEM3-10 Revisão: funções e gráficos | Acrescentada | MATEM3-10 <- MATEM1-06 | Revisão cobre a função modular. |
| MATEM3-10 Revisão: funções e gráficos | Acrescentada | MATEM3-10 <- MATEM1-09 | Revisão cobre exponencial e logarítmica (e a composta, pela cadeia). |
| MATEM3-10 Revisão: funções e gráficos | Acrescentada | MATEM3-10 <- MATEM2-02 | Revisão cobre as funções trigonométricas. |
| MATEM3-10 Revisão: funções e gráficos | Tirada | MATEM3-10 <- MATEM1-15 | Redundante: já vem por MATEM1-09. |
| MATEM3-10 Revisão: funções e gráficos | Tirada | MATEM3-10 <- MATEM3-09 | Limite não é pré-requisito de revisar funções; era ordem de aula, não dependência. |
| MATEM3-11 Revisão: contagem e probabilidade | Acrescentada | MATEM3-11 <- MATEM2-10 | Revisa a probabilidade da 2ª série (que traz contagem). |
| MATEM3-11 Revisão: contagem e probabilidade | Tirada | MATEM3-11 <- MATEM3-10 | Revisão de funções não é pré-requisito de revisar contagem; era ordem de aula. |
| MATEM3-12 Revisão: geometria plana e espacial | Acrescentada | MATEM3-12 <- MATEM2-12 | Revisa os sólidos redondos (que trazem prismas, pirâmides e volumes). |
| MATEM3-12 Revisão: geometria plana e espacial | Acrescentada | MATEM3-12 <- MATEM2-03 | Revisa lei dos senos e cossenos (que trazem o ciclo e a trigonometria do triângulo). |
| MATEM3-12 Revisão: geometria plana e espacial | Acrescentada | MATEM3-12 <- MAT09-06 | Revisa relações métricas, que não estavam em cadeia nenhuma. |
| MATEM3-12 Revisão: geometria plana e espacial | Tirada | MATEM3-12 <- MATEM3-04 | Cônicas são geometria analítica, não plana e espacial. |
| MATEM3-13 Matemática financeira aplicada | Acrescentada | MATEM3-13 <- MATEM2-13 | Continua juros compostos. |
| MATEM3-13 Matemática financeira aplicada | Acrescentada | MATEM3-13 <- MATEM1-08 | Achar o prazo em M = C(1 + i)^n pede logaritmo. |
| MATEM3-13 Matemática financeira aplicada | Tirada | MATEM3-13 <- MATEM3-10 | Revisão de funções não é pré-requisito; era ordem de aula. |
| MATEM3-14 Interpretação de dados e gráficos | Acrescentada | MATEM3-14 <- MATEM2-14 | Continua distribuições e dispersão da 2ª série. |
| MATEM3-14 Interpretação de dados e gráficos | Tirada | MATEM3-14 <- MATEM3-11 | Contagem e probabilidade não são pré-requisito de ler dados; era ordem de aula. |

## Assuntos que faltam na lista (sugestões, nada criado)

O catálogo não ganhou assunto novo nem mudou id. Estes buracos apareceram ao
montar as cadeias e ficam como sugestão para quem decidir ampliar a lista:

1. Princípio multiplicativo de contagem no 8º ano (BNCC EF08MA03). Hoje a
   contagem só aparece na 2ª série do médio, e MATEM2-07 teve de apontar para
   a árvore de possibilidades dos eventos sucessivos do 9º ano.
2. Probabilidade no 5º ano como fração (BNCC EF05MA22 e EF05MA23). Entre
   "possível, impossível e provável" (4º) e "probabilidade" (7º) há três anos
   sem nada.
3. Transformações geométricas (translação, reflexão, rotação) do 6º ao 8º ano
   (BNCC EF07MA19 a EF07MA21, EF08MA18). Depois de "polígonos e simetria" (4º)
   o tema some.
4. Regra de três composta e grandezas inversamente proporcionais no 8º ano
   (BNCC EF08MA12 e EF08MA13). O catálogo para na regra de três simples do 7º.
5. Medidas de tempo e temperatura no 4º e 5º ano (BNCC EF04MA22, EF05MA19).
   "Relógio e calendário" (3º) é folha: nada depois usa medida de tempo.
6. Função inversa na 1ª série do médio. A função logarítmica (MATEM1-09)
   aponta para "função composta" (MATEM1-15) por falta de um assunto de inversa.
7. Geometria de posição (retas e planos no espaço) na 2ª série, antes de
   prismas e pirâmides.
8. Álgebra dos anos iniciais e do 6º ano (igualdade, sequências com regra,
   propriedades da igualdade: BNCC EF05MA10, EF05MA11, EF06MA14, EF06MA15).
   Hoje a álgebra salta de "sequências e padrões" (2º) para o 7º ano.
9. Potenciação e radiciação de naturais no 6º ano (BNCC EF06MA03). Hoje
   quadrado e cubo só aparecem no 8º (MAT08-01); no 6º eles vivem dentro de
   "operações com números naturais" (MAT06-02).

## Leitura cega de 30/10

Um segundo leitor (lente da pedagoga), sem ver as justificativas acima, leu o
grafo e apontou arestas erradas e arestas que faltam. Veredito ponto a ponto,
como dono do conteúdo. Saldo: 21 arestas acrescentadas e 9 tiradas; 221 para
233 arestas; profundidade de 27 para 25. A cadeia foi conferida inteira depois
de cada mudança pelo `testa_grafo.js` (ciclo, ano, redundância, raízes).

### Arestas que ele acha erradas

| Ponto | Veredito | O que mudou | Motivo |
| --- | --- | --- | --- |
| 1. MAT09-07 Pitágoras <- MAT09-03 Radicais | Aceito | Tirada MAT09-07 <- MAT09-03; acrescentada MAT09-07 <- MAT08-03; acrescentada MAT09-09 <- MAT09-03 | O teorema pede raiz quadrada (8º). Simplificar e racionalizar radicais é usado de fato nos valores notáveis de seno, cosseno e tangente, então a aresta desce para MAT09-09, onde é imediata. |
| 2. MAT09-10 Funções (a ideia) <- MAT09-04 Equação do 2º grau | Aceito | Tirada MAT09-10 <- MAT09-04; acrescentadas MATEM1-04 <- MAT09-04, MATEM1-07 <- MAT09-02, MATEM3-03 <- MAT08-07 | A ideia de função não pede resolver equação do 2º grau. Três assuntos só alcançavam o que usam por essa aresta, e passam a pedir direto: a função quadrática pede as raízes, a exponencial pede o expoente fracionário e negativo (o aviso do leitor), e a circunferência analítica pede completar quadrados. |
| 3. MATEM2-07 Contagem <- MAT09-14 Eventos sucessivos | Aceito | Tirada MATEM2-07 <- MAT09-14; acrescentada MATEM2-07 <- MAT06-02; acrescentada MATEM2-10 <- MAT09-14 | O sentido estava invertido (contar vem antes de calcular probabilidade). O princípio multiplicativo pede multiplicar naturais; a probabilidade da 2ª série volta a pedir a do 9º, que antes vinha pela cadeia. A falta é de ASSUNTO (contagem no 8º), e fica como sugestão 1. |
| 4. MATEM1-09 Logarítmica <- MATEM1-15 Função composta | Aceito | Tirada MATEM1-09 <- MATEM1-15; acrescentada MATEM3-10 <- MATEM1-15 | O que a logarítmica pede é função inversa, que não existe na lista (sugestão 6). A composta não é pré-requisito dela; a revisão de funções passa a cobrir a composta direto. |
| 5. MATEM3-09 Limite <- MATEM1-09 Logarítmica | Aceito, com troca | Tirada MATEM3-09 <- MATEM1-09; acrescentada MATEM3-09 <- MATEM1-04 | A logarítmica não é necessária. Mas limite pede mais do que sequências: a indeterminação 0/0 fatora quadráticas, e o comportamento no infinito se estuda primeiro na parábola; a função quadrática é o imediato. |
| 6a. MAT04-11 Possível e provável <- MAT03-12 Gráficos de barras | Recusado | Nada | Raiz fora do 2º ano é proibida, e nos anos iniciais a estimativa de chance (EF03MA25) vive na unidade de probabilidade e estatística junto com registrar resultados em tabela e gráfico (EF03MA26 a EF03MA28): é o único antecedente do tema no catálogo. Sem alternativa melhor, a aresta fica. |
| 6b. MAT03-09 Massa e capacidade <- MAT03-08 Metro e centímetro | Aceito | Tirada MAT03-09 <- MAT03-08; acrescentadas MAT03-09 <- MAT03-01 e MAT03-09 <- MAT02-08 | Comprimento não é pré-requisito de massa; o que se usa é a ideia de medir com uma unidade (2º ano) e números até 1000 (1 kg = 1000 g, 1 L = 1000 mL). |
| 6c. MAT03-11 Relógio e calendário <- MAT03-04 Tabuada | Aceito, com troca | Tirada MAT03-11 <- MAT03-04; acrescentada MAT03-11 <- MAT02-05 | Ler minutos no relógio de ponteiros conta de 5 em 5, e isso é contagem em sequência (2º ano), não tabuada. |

### Arestas que faltam

| Ponto | Veredito | O que mudou | Motivo |
| --- | --- | --- | --- |
| 1. Dispersão [09] e [em2] sem radiciação e potenciação | Aceito | Acrescentada MAT09-13 <- MAT08-03 | Variância e desvio padrão elevam ao quadrado e tiram raiz; MATEM2-14 herda por MATEM1-13. |
| 2. Função afim [em1] sem razão e proporção e regra de três | Aceito em parte | Acrescentada MAT09-10 <- MAT07-05 | A proporcionalidade é a porta de entrada da ideia de função no 9º ano (EF09MA08), então a aresta entra em MAT09-10 e a afim herda. Regra de três não é usada na afim. |
| 3. Semelhança e Tales [09] sem regra de três e equação do 1º grau | Aceito | Tirada MAT09-08 <- MAT07-05; acrescentadas MAT09-08 <- MAT07-06 e MAT09-08 <- MAT07-10 | A proporção com incógnita se resolve por regra de três (que traz razão e proporção) e, com expressões, por equação. |
| 4. Círculo [08] e volume de cilindros [09] sem razão e potenciação | Aceito | Acrescentadas MAT08-13 <- MAT07-05 e MAT08-13 <- MAT08-01; tirada MAT08-13 <- MAT06-07 | Pi é a razão entre comprimento e diâmetro, e a área é pi vezes r ao quadrado. Os decimais passam a vir pela cadeia da potenciação, e a aresta direta virou redundante. MAT09-12 herda por MAT08-13. |
| 5. Primos, área e volume [06] sem potência | Recusado | Nada (sugestão 9) | Não há assunto de potenciação no 6º ano para apontar: no catálogo quadrado e cubo de naturais vivem em MAT06-02 (operações com naturais), que MAT06-04 já pede e que MAT06-11 e MAT06-12 passam a alcançar pelo ponto 6. Criar assunto não cabe nesta entrega. |
| 6. Área de figuras planas [06] sem decimais | Aceito | Acrescentada MAT06-11 <- MAT06-07 | Medidas com vírgula entram no cálculo de área e perímetro do 6º ano. |
| 7. Complexos [em3] sem conjuntos numéricos [em1] | Aceito | Acrescentada MATEM3-05 <- MATEM1-01 | C estende R; a organização dos conjuntos numéricos é o que se amplia. |
| 8. Reta analítica [em3] sem sistemas [08] | Aceito | Acrescentada MATEM3-02 <- MAT08-10 | Interseção de retas é sistema 2x2. |

Grandes linhas: a álgebra salta do 2º para o 7º ano e a contagem só aparece na
2ª série do médio. As duas são falta de assunto, não de aresta; estão nas
sugestões 1 e 8, nada foi criado.
