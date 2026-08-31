# Banco de temas: formato e regras

Este documento define como cada tema é escrito. O formato existe para três coisas ao mesmo tempo:
ser legível por uma pessoa, ser lido por um programa sem ambiguidade, e permitir que **toda conta
seja conferida por máquina antes de virar material de aula**.

---

## 1. Um arquivo por tema, com as duas línguas dentro

Caminho: `temas/mat/<serie>/<ID>.md`, onde a série é `06`, `07`, `08`, `09`, `em1`, `em2` ou `em3`.

As duas línguas moram no mesmo arquivo de propósito: é o que permite conferir automaticamente que a
versão em inglês usa **os mesmos números e chega às mesmas respostas** que a portuguesa. Traduzir é
onde um erro passa despercebido com mais facilidade.

## 2. Estrutura do arquivo

````markdown
---
id: MAT06-05
serie: 06
unidade: numeros
titulo_pt: Frações: o que são e como comparar
titulo_en: Fractions: what they are and how to compare them
resumo_pt: Uma frase sobre o que o aluno sai sabendo.
resumo_en: One sentence about what the student walks away knowing.
prerequisitos: [MAT06-02]
duracao_min: 60
dificuldade: 2
---

## PT

### Explicação

Texto corrido, com subtítulos livres, exemplos resolvidos e uma seção de erros comuns.

### Exercícios

1. Enunciado do primeiro.
2. Enunciado do segundo.

### Gabarito

1. Resposta do primeiro.
2. Resposta do segundo.

## EN

### Explanation

...

### Exercises

...

### Answer key

...

## VERIFICACAO

```python
# uma linha por conta que precisa ser conferida
E1: Rational(1,2) + Rational(1,3) == Rational(5,6)
E2: solve(Eq(3*x + 5, 20), x) == [5]
```
````

## 3. Campos do cabeçalho

| Campo | O que é |
|---|---|
| `id` | `MAT` + série + número sequencial. Nunca muda depois de criado. |
| `serie` | `06` a `09`, `em1` a `em3` |
| `unidade` | `numeros`, `algebra`, `geometria`, `grandezas` ou `estatistica` |
| `titulo_pt` / `titulo_en` | Título do tema nas duas línguas |
| `resumo_pt` / `resumo_en` | Uma frase, aparece na lista de temas do aplicativo |
| `prerequisitos` | Lista de ids que convém ter visto antes. Vazio quando não há. |
| `duracao_min` | Quanto tempo de encontro o material costuma ocupar |
| `dificuldade` | 1 a 5, dentro da própria série |

## 4. Regras de conteúdo

**Explicação.** Duas a três folhas. Começa pela ideia em linguagem comum, antes de qualquer símbolo.
Traz de dois a quatro exemplos resolvidos passo a passo, e termina com **erros comuns**, que é a
parte que mais ajuda quem está travado.

**Exercícios.** De quinze a vinte, em três blocos declarados no próprio texto, com numeração
contínua:

| Bloco | Quantidade | O que é |
|---|---|---|
| A. Fundamentos | 4 a 5 | Aplicação direta, para confirmar que a base está firme. Poucos, de propósito. |
| B. Consolidação | 7 a 9 | Dois ou mais passos, exigem escolher o caminho. É o corpo da lista. |
| C. Aprofundamento | 4 a 6 | Contexto real, inversão do problema, generalização ou armadilha conceitual. Ao menos um no nível de prova difícil de colégio forte. |

**Sobre o nível.** As crianças estudam em colégios exigentes da cidade. A lista não pode ser
mecânica: quem só treina repetição não é atendido por isso. Vale usar problema com dado que sobra,
pergunta que pede justificativa, item que pede o caminho inverso ("qual número faria o resultado
ser..."), e questão que só sai combinando dois conceitos. O bloco A existe para dar segurança no
começo, não para ocupar a lista.

**Gabarito.** Separado da lista, para o material poder ser entregue sem ele. Traz a resposta e, quando
o caminho não é óbvio, uma linha de como se chega lá.

**Linguagem.** Português do Brasil com acentuação completa. Nunca usar travessão, nem em português
nem em inglês: usar dois-pontos, ponto ou vírgula. A criança é tratada com respeito, sem
infantilização e sem jargão.

**Inglês.** Inglês real de sala de aula, não tradução literal. Vocabulário matemático correto
(`numerator`, `least common multiple`, `slope`). Os números e as respostas são idênticos aos da
versão portuguesa, sempre.

## 5. A seção de verificação

É a defesa contra erro de conta. Cada linha tem a forma `rótulo: expressão`, e a expressão precisa
resultar em verdadeiro quando avaliada com o sympy.

- `E1`, `E2`, ... conferem os exercícios, na ordem do gabarito.
- `X1`, `X2`, ... conferem os exemplos resolvidos dentro da explicação.

O verificador roda `temas/_ferramentas/verificar.py`. Um tema que falhe em qualquer linha **não entra
no banco**. Exercício que não é verificável por símbolo (interpretação, desenho, argumentação) é
marcado com `# manual: motivo` e entra na lista de conferência humana, que o próprio verificador
imprime no fim.

## 6. O que não fazer

- Não citar código de habilidade da BNCC. A organização segue as unidades temáticas, que são
  estáveis. Citar código específico é onde se erra com aparência de precisão.
- Não inventar dado histórico, nome de matemático com data, nem estatística sobre o mundo real dentro
  de enunciado. Se o problema precisa de contexto, usar situação cotidiana e verificável.
- Não usar uma resposta "bonita" como prova de que a conta está certa. A prova é o verificador.
