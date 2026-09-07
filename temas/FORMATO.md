# Banco de temas: formato e regras

Este documento define como cada tema é escrito. O formato existe para três coisas ao mesmo tempo:
ser legível por uma pessoa, ser lido por um programa sem ambiguidade, e permitir que **toda conta
seja conferida por máquina antes de virar material de aula**.

O formato nasceu para matemática e serve a qualquer matéria declarada na tabela única de matérias
(`Core.MATERIAS`, em `core.js`, exportada para `temas/_ferramentas/materias.json`). O que muda de
uma matéria para outra vem da tabela, e não deste documento: a pasta, o prefixo do identificador,
as unidades, as línguas e se o texto pode citar autor com travessão. Matéria nova custa uma linha
na tabela e uma pasta.

---

## 1. Um arquivo por tema, na pasta da matéria

Caminho: `temas/<pasta>/<serie>/<ID>.md`. A pasta é a da matéria na tabela: `mat` para matemática,
`por` para português, `lit` para literatura. A série é `02` a `09`, `em1`, `em2` ou `em3`, e é a
mesma que aparece no id e no campo `serie`.

**A matéria vem do caminho, e não do cabeçalho.** É a pasta que diz ao verificador que prefixo,
que unidades e que línguas exigir. Se o cabeçalho também dissesse a matéria, um dia os dois iam
discordar. Arquivo em pasta que a tabela não conhece é reprovado, e a mensagem diz quais existem.

**As línguas são propriedade da matéria.** Matemática traz português e inglês no mesmo arquivo, de
propósito: é o que permite conferir automaticamente que a versão em inglês usa **os mesmos números
e chega às mesmas respostas** que a portuguesa. Traduzir é onde um erro passa despercebido com mais
facilidade. Português e literatura nascem só em português: neles `titulo_en`, `resumo_en` e a seção
`## EN` não são exigidos, e uma seção `## EN` que apareça gera aviso e é ignorada pelo gerador.

## 2. Estrutura do arquivo

O exemplo é de matemática, que tem as duas línguas. Numa matéria só em português, o cabeçalho não
tem `titulo_en` nem `resumo_en`, tem `topicos` (seção 4), e o arquivo vai do `## PT` direto ao
`## VERIFICACAO`.

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
| `id` | Prefixo da matéria + série em maiúsculas + `-` + número de dois dígitos. Matemática: `MAT06-05`, `MATEM3-04`. Português: `POR07-02`, `POREM1-01`. Literatura: `LIT09-01`, `LITEM2-03`. O prefixo vem da tabela. Nunca muda depois de criado, e nunca tem `-T` no meio: essa é a forma do identificador de tópico, e o aplicativo separa tema de tópico por ela. |
| `serie` | `02` a `09`, `em1` a `em3`. Tem que bater com a série do id e com a pasta onde o arquivo está. |
| `unidade` | Uma das unidades da matéria na tabela. Matemática: `numeros`, `algebra`, `geometria`, `grandezas`, `estatistica`. Português: `leitura`, `analise`, `producao`, `oralidade`. Literatura: `leitura`, `periodos`, `obras`, `teoria`. Unidade de uma matéria num tema de outra reprova. |
| `titulo_pt` / `titulo_en` | Título do tema. O `titulo_en` só existe, e só é exigido, nas matérias que têm inglês. |
| `resumo_pt` / `resumo_en` | Uma frase, aparece na lista de temas do aplicativo. Mesma regra para o inglês. |
| `prerequisitos` | Lista de ids que convém ter visto antes. Vazio quando não há. |
| `topicos` | Lista de identificadores de tópico do catálogo (seção 4). Obrigatório em português e literatura, proibido em matemática. |
| `duracao_min` | Quanto tempo de encontro o material costuma ocupar |
| `dificuldade` | 1 a 5, dentro da própria série |

## 4. Tópicos do catálogo (`topicos:`)

O aplicativo tem, em `banco/topicos/`, o catálogo de assuntos das matérias que não são matemática,
e é por assunto que a Nathália marca o que deu em cada aula. Um tema de português ou de literatura
precisa dizer a que assuntos serve, para o aplicativo achar material a partir da aula:

```
topicos: [POR07-T03, POR07-T05]
```

**Forma.** Prefixo da matéria + série + `-T` + número: `POR07-T03`, `LITEM1-T02`. O `-T` é o que
separa tópico de tema, e por isso um tema nunca tem `-T` no id. Os identificadores vêm do registro
`banco/topicos/_ids.json`, que é gerado e nunca renumera: um id, uma vez emitido, não muda.

**Quando.** Obrigatório em toda matéria que tem catálogo de tópicos na tabela e tem banco de temas,
hoje português e literatura. Proibido em matemática, que não está no catálogo: o material dela é
organizado por unidade. Lista vazia reprova como a ausência, porque um tema sem tópico ficaria
inalcançável a partir da aula. Um tema pode apontar tópico de outra série: revisão atravessa anos.

**O que o verificador confere hoje.** Só a forma, por expressão regular, mais a repetição na lista.
O cruzamento com o registro (o id existe, é desta matéria, não está aposentado) fica para a rodada
em que o registro estiver fechado; o gancho está em `verificar.py`, na função
`topicos_fora_do_registro`, e é o único lugar a mexer.

## 5. Regras de conteúdo

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
nem em inglês: usar dois-pontos, ponto ou vírgula. A única exceção é texto de autor dentro de bloco
de citação marcado, em matéria que a tabela libera para isso (seção 6). A criança é tratada com
respeito, sem infantilização e sem jargão.

**Inglês.** Nas matérias que têm inglês: inglês real de sala de aula, não tradução literal.
Vocabulário matemático correto (`numerator`, `least common multiple`, `slope`). Os números e as
respostas são idênticos aos da versão portuguesa, sempre.

## 6. Bloco de citação: texto de autor com travessão e reticências

Texto de autor não se reescreve. Um conto de Machado tem travessão no diálogo e reticência na fala
que se interrompe, e trocar isso por vírgula seria falsificar a citação. Por isso, nas matérias com
`citacao: true` na tabela (português e literatura), o trecho citado pode trazer o travessão e as
reticências do original. Decisão de 08/09/2026, e é a única exceção à regra da casa.

**Como se marca.** Bloco de citação Markdown: cada linha do trecho começa com `> ` (o sinal de
maior e um espaço), inclusive as linhas de continuação.

```
Repare em como a fala se interrompe:

> Vou contar o caso, disse ele... mas não sei se devo.
> Os outros esperavam. (Se o original tem travessão, ele fica aqui como o autor escreveu.)

Fora do bloco, a explicação segue a regra da casa: dois-pontos, ponto ou vírgula.
```

Este documento não reproduz o travessão nem no exemplo, porque a regra da casa vale para os
arquivos do acervo também; num tema de verdade, o trecho citado sai como está no livro.

**Por que só a marca explícita conta.** O Markdown aceita `>` colado ao texto e aceita linha de
continuação sem sinal nenhum, mas uma isenção que dependesse de entender Markdown seria difícil de
conferir no olho. A regra é mecânica de propósito: a linha tem `> ` no começo, ou não tem a isenção.
Fora do bloco, travessão e reticência reprovam como sempre. Em matemática (`citacao: false`) nada
muda: travessão dentro de `> ` reprova igual.

**O que a isenção não cobre.** Só travessão e reticências. As outras marcas de rascunho ("ou
melhor,", "espera,", `TODO`) continuam sendo procuradas dentro do bloco.

## 7. A seção de verificação

É a defesa contra erro de conta. Cada linha tem a forma `rótulo: expressão`, e a expressão precisa
resultar em verdadeiro quando avaliada com o sympy.

- `E1`, `E2`, ... conferem os exercícios, na ordem do gabarito.
- `X1`, `X2`, ... conferem os exemplos resolvidos dentro da explicação.

**A verificação precisa provar alguma coisa.** Escrever `12 == 12` para conferir que o cubo tem 12
arestas passa e não prova nada, o que é pior do que não conferir: dá a impressão de que a conta foi
checada. O verificador reprova esse padrão. O certo seria `Rational(6*4, 2) == 12`, que é o
argumento de verdade. Quando o item é fato de convenção, como a semana ter 7 dias, marque como
conferência humana. Comparação entre números diferentes, como `385 > 358`, prova algo e vale.

**Nenhum exercício pode citar outro pelo número.** A Nathália monta a lista marcando e desmarcando
questões, então a numeração muda a cada montagem. Um enunciado que diga "compare com o exercício 8"
quebra assim que o 8 sai da lista. O verificador também reprova isso.

O verificador roda `temas/_ferramentas/verificar.py`. Um tema que falhe em qualquer linha **não entra
no banco**. Exercício que não é verificável por símbolo (interpretação, desenho, argumentação) é
marcado com `# manual: motivo` e entra na lista de conferência humana, que o próprio verificador
imprime no fim. Em português e literatura a maior parte dos itens é assim, e tudo bem: o sympy não
é barreira para uma matéria entrar no banco; a estrutura e as regras de texto são.

## 8. O que não fazer

- Não citar código de habilidade da BNCC no corpo do tema. A organização segue as unidades temáticas, que são
  estáveis. Citar código específico é onde se erra com aparência de precisão.
  Em matéria com catálogo de tópicos (português e literatura) o código é dado do cabeçalho, no
  campo `bncc`, conferido contra tabela; ver a seção 9.
- Não inventar dado histórico, nome de matemático com data, nem estatística sobre o mundo real dentro
  de enunciado. Se o problema precisa de contexto, usar situação cotidiana e verificável.
- Não usar uma resposta "bonita" como prova de que a conta está certa. A prova é o verificador.

## 9. Matéria com catálogo: citação, texto de apoio, questão fechada e aberta

Vale para toda matéria que tem catálogo de tópicos na tabela (`topicos` preenchido: português e
literatura). Matemática não passa por nada desta seção. Decisão de 08/09/2026 (Fase 2 da frente
de português); a coleção de textos está descrita em `fontes/FORMATO.md`.

### 9.1 Dois campos a mais no cabeçalho

```
bncc: [EF67LP28, EF69LP47]
vestibular: [contagem de sílabas poéticas e nome da medida do verso]
```

`bncc` lista os códigos de habilidade de Língua Portuguesa que o tema cobre, conferidos contra a
tabela `temas/_ferramentas/bncc_lp.json` (código fora da tabela reprova; série do tema fora da
faixa do código é aviso, porque revisão atravessa anos). `vestibular` lista, em palavras e
separadas por `;`, as exigências de vestibular sem habilidade correspondente na Base. Pelo menos
uma das duas não pode ser vazia. Em matemática os dois campos são proibidos. O código vai no
cabeçalho e só nele: a regra 8 continua valendo para o corpo.

`serie` é o nível de profundidade: o mesmo tópico em dois níveis é dois temas, em duas séries.
Cursinho usa `em3`.

### 9.2 O bloco de citação tem fonte

Toda citação de texto, na explicação ou na lista, é um bloco assim:

```
@fonte lima-barreto_o-pai-da-ideia linhas=9-10
> Pouca gente leu o artigo do honesto facultativo, mas todos os seus colegas o fizeram,
> sem que, entretanto, nada dissessem logo.
```

- A diretiva `@fonte <id> linhas=<a>-<b>` ocupa a linha inteira e vem logo antes do bloco. O id é
  o nome do arquivo em `fontes/`; `linhas` conta as linhas não vazias da fonte e é obrigatório.
- As linhas do bloco começam com `> ` (até três espaços antes do sinal, e um espaço depois). A
  linha em branco da fonte vira `>` sozinho. Sinal de citação com mais recuo, ou colado ao texto,
  reprova.
- O bloco é cópia exata das linhas `a` a `b` da fonte, com os brancos entre elas. Uma palavra
  trocada reprova, e a mensagem diz a primeira linha que difere.
- Bloco `>` sem `@fonte` na linha anterior reprova: não existe citação sem fonte, nem de duas
  linhas. Texto escrito para o exercício também é fonte (`dominio: autoral`).
- Dentro do bloco não rodam as travas de rascunho nem a de referência cruzada: a fidelidade já
  exclui rascunho. Travessão e reticências dentro do bloco continuam permitidos (seção 6).

### 9.3 Texto de apoio na lista

Em `### Exercícios`, um bloco `@fonte` em coluna zero que aparece antes de um item numerado é
texto de apoio, e os itens depois dele, até o próximo bloco, pertencem a ele. A lista pode ter mais
de um texto e itens sem texto. O bloco pode vir antes ou depois do cabeçalho `**Bloco A. ...**`.

O enunciado nunca cita o texto pelo número ("no Texto 2"): ela desmarca questões e o segundo texto
pode virar o único. Diz "no texto", "no poema", ou cita a linha: "linha 12", "linhas 3 a 5". A
numeração citada é a da fonte, e tem que cair dentro de `linhas=a-b` do texto do item.

Na folha, o texto sai uma vez, na primeira questão selecionada que o usa, com o título da fonte,
os números de linha de cinco em cinco, um fio à esquerda e o crédito embaixo.

### 9.4 Trecho dentro da questão

Quando uma questão precisa de um trecho que não está no texto de apoio (ou de outra fonte), o bloco
vai dentro do item, indentado com três espaços, logo depois do enunciado e antes das alternativas:

```
14. O Hino Nacional repete, entre aspas, palavras deste poema. O que as aspas indicam?
   @fonte duque-estrada_hino-nacional-brasileiro linhas=1-4
   > Do que a terra mais garrida
   > Teus risonhos, lindos campos têm mais flores,
   > "Nossos bosques têm mais vida"
   > "Nossa vida" no teu seio "mais amores".
   a) Que o autor do hino discorda de Gonçalves Dias.
   b) Que os versos estão sendo citados de outro texto, e o hino reconhece isso.
```

O trecho pertence só àquele item, sai com número de linha e fio, e leva crédito quando a fonte é
diferente da do texto de apoio vigente. No máximo um trecho por item.

### 9.5 Questão fechada

Alternativas são linhas do próprio item, indentadas, com letra e parêntese, quatro ou cinco, de
`a)` a `e)`, em ordem. O gabarito é a letra, e pode trazer `ancora:` e `porque:`:

```
3. b
   ancora: contava eu dezessete, ela trinta
   porque: "contar anos" é ter idade; a frase compara as duas idades.
```

Alternativas exigem gabarito em letra e vice-versa; a letra tem que existir. `tipo: fechada` sai
inferido no JSON.

### 9.6 Questão aberta

O gabarito é critério, não frase. Quatro campos, todos obrigatórios:

```
1. espera_se: que o aluno perceba que o narrador conta a história muitos anos depois.
   aceita_se:
   - dizer que ele era jovem na época e escreve mais velho
   - apontar a distância de tempo sem falar em idade
   nao_aceita:
   - dizer que a história acontece no presente
   ancora: Nunca pude entender a conversação que tive com uma senhora, há muitos anos
```

- `espera_se`: a resposta que a professora quer ver, em uma frase.
- `aceita_se` e `nao_aceita`: listas com pelo menos um item cada.
- `ancora`: trecho literal, com pelo menos três palavras, que tem que ser substring de UM parágrafo
  do texto do item (o trecho próprio se houver, senão o texto de apoio, senão o enunciado), com os
  espaços normalizados. A âncora não atravessa linha em branco. A linha `ancora:` fica isenta de
  travessão, reticências e rascunho, porque ela é cópia.

Gabarito em texto corrido reprova em matéria com catálogo. Nos anos iniciais o esquema é o mesmo.

### 9.7 Itálico

`*texto*` é itálico, `**texto**` é negrito, `***texto***` os dois; em qualquer ordem de
aninhamento. Em cada linha o número de `**` e o de `*` solto tem que ser par, senão reprova. Em
matemática, `*` fora de `**` reprova.

### 9.8 A seção VERIFICACAO é opcional

Em matéria só em português a seção `## VERIFICACAO` pode faltar. Sem ela nenhuma conta é conferida
e o aviso "exercícios sem verificação" não sai. O que garante o material é o resto desta seção mais
o portão de português (fidelidade, domínio, esquema do gabarito, cobertura, painel cego).

### 9.9 O que sai no JSON

Além do que já sai, o tema de matéria com catálogo leva `bncc`, `vestibular`, `fontes` (metadados
e crédito de cada texto citado), `textos` (os textos de apoio, com as linhas) e, em cada
exercício, `texto` (índice em `textos`), `tipo`, `alternativas`, `trecho`, `resposta` (a letra ou o
`espera_se`, para quem só lê texto) e `gabarito` estruturado. O gerador aceita `--so portugues`
para regerar uma matéria só; a matemática não é tocada.

### 9.10 O painel cego das questões abertas

Toda questão **aberta** passa por um painel antes de o tema entrar no banco: três leitores leem o
enunciado e o texto sem ver o gabarito e respondem como alunos da série, um juiz diz se o critério
alcança cada resposta, e uma lente adversarial procura resposta defensável que o critério deixaria
de fora. O que o painel viu fica gravado em `temas/<pasta>/_painel/<ID>.json`, com as respostas por
extenso, e o portão exige esse registro: sem ele, ou com ele assinado para outra versão do texto, o
tema reprova e fica de fora do banco.

O protocolo, os três prompts prontos para colar, o formato de cada arquivo e os quatro verbos da
ferramenta estão em `temas/_ferramentas/PAINEL.md`. Enquanto o tema está sendo escrito,
`verificar.py --sem-painel` mostra o resto sem exigir o registro; o gerador nunca desliga.
