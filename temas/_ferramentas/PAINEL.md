# O painel cego: protocolo

Toda questão **aberta** de tema de matéria com catálogo (português e literatura) passa por um
painel antes de o tema entrar no banco. O painel é gente lendo como aluno, feita de modelo: três
leitores, um juiz e uma lente adversarial. O portão não lê como aluno; ele guarda o registro do que
o painel viu e confere que ele existe, que é do texto de hoje e que todas as abertas foram
aprovadas.

A ferramenta é `temas/_ferramentas/painel.py`. A especificação é a seção 1 de
`FASE3_portao_camadas_2_e_3.md`; o formato do tema é a seção 9 de `temas/FORMATO.md`.

## Por que três leitores, um juiz e uma lente

Cada um responde a uma pergunta diferente, e nenhum deles responde à pergunta do outro.

- **Os três leitores** respondem à pergunta do aluno: o que uma pessoa que leu o texto responderia?
  Eles nunca veem o gabarito. Se vissem, estariam copiando o critério, e o painel provaria apenas
  que o modelo sabe repetir o que leu.
- **O juiz** responde à pergunta do critério: o critério alcança esta resposta? Ele classifica em
  `espera_se`, `aceita_se`, `nao_aceita` ou `fora`, e não julga se a resposta é boa. Uma resposta
  excelente que o critério não alcança é `fora`, e isso é um defeito do item, não do aluno.
- **A lente adversarial** responde à pergunta do item: existe resposta defensável pelo texto que
  este critério marcaria como errada ou deixaria de fora? Ela vê o critério, de propósito: o
  trabalho dela é atacá-lo.

Não há maioria. Uma leitura `fora` ou `nao_aceita` já denuncia o item, porque três leitores é pouco
para votar e o custo de reescrever um enunciado é baixo.

## A tabela do veredito

| o que aconteceu | resultado |
|---|---|
| os três em `espera_se` ou `aceita_se`, e a lente em `criterio_ok` | **aprovada** |
| um ou mais em `fora` | **ambígua**: o critério não alcança uma leitura honesta; alargar `aceita_se` ou reescrever o enunciado |
| um ou mais em `nao_aceita` | **ambígua** também: um bom leitor caiu no erro previsto, ou o "erro" é defensável |
| a lente em `estreito` | **estreita**: o critério não alcança uma resposta defensável; alargar `aceita_se` |

Quando as duas coisas acontecem na mesma questão, a ferramenta mostra a ambígua primeiro: leitura
de aluno que cai fora do critério é a evidência mais forte sobre o item. As duas barram o tema do
mesmo jeito.

## Os quatro verbos

```
python temas/_ferramentas/painel.py exportar  POR07-05 --saida <pasta>
python temas/_ferramentas/painel.py criterios POR07-05 --saida <pasta>
python temas/_ferramentas/painel.py montar    POR07-05 \
    --leitores A.json B.json C.json --juiz juiz.json --lente lente.json
python temas/_ferramentas/painel.py conferir  POR07-05
```

- `exportar` grava `<pasta>/POR07-05.pacote.json`: o pacote cego, que é o que cada leitor recebe.
  Sem `--saida`, ele usa uma pasta temporária e imprime o caminho. A ferramenta reprova a si mesma
  (sai 2) se a palavra `espera_se`, `aceita_se`, `nao_aceita` ou `ancora` aparecer no pacote.
- `criterios` grava `<pasta>/POR07-05.criterios.json`: o critério de cada aberta, que é o que o
  juiz e a lente recebem.
- `montar` valida os cinco arquivos, calcula os resultados pela tabela, assina e grava
  `temas/por/_painel/POR07-05.json`. Imprime uma linha por questão e o placar
  `N aprovadas, M ambiguas, K estreitas.`. Sai 0 quando tudo foi aprovado e 1 quando não; o
  registro é gravado nos dois casos, porque ele é o retrato do que o painel viu.
- `conferir` roda sozinha a mesma conferência que o portão faz, e sai 0 ou 1.

Opções de raiz, iguais às do verificador: `--temas DIR`, `--fontes DIR`, `--painel DIR` (a pasta
dos registros) e `--saida DIR`.

## O pacote cego

Uma entrada por questão aberta, na ordem da lista:

```json
{
  "tema": "POR07-05", "serie": "07", "assinatura": "<sha256>",
  "questoes": [
    { "n": 2,
      "enunciado": "Escreva o esquema de rima da segunda estrofe (linhas 5 a 8).",
      "texto_de_apoio": {
        "titulo": "Canção do exílio",
        "credito": "Gonçalves Dias. Canção do exílio. In: Primeiros cantos, 1846.",
        "linhas": ["1| Minha terra tem palmeiras,", "2| Onde canta o Sabiá;", ""]
      },
      "trecho_proprio": { "credito": "", "linhas": [] } }
  ]
}
```

O número antes da barra vertical é o número da linha na fonte, o mesmo que a folha imprime e que o
enunciado cita ("linha 12"). Linha em branco viaja vazia e sem número. `texto_de_apoio` sai quando
a questão pertence a um texto da lista; `trecho_proprio` sai quando a questão traz um bloco só
dela. Questão de gramática, sem texto nenhum, sai só com o enunciado.

## Os prompts, prontos para colar

### Leitor (Sonnet, três agentes, um por leitor)

> Você é um bom aluno do 7º ano em um colégio exigente. Leia o texto e responda cada questão como
> você responderia numa prova, com o que está no texto. Responda só com o texto da resposta, de uma
> a três frases, sem numerar de novo e sem explicar o que você fez. Não invente informação que não
> esteja no texto: quando a questão pedir algo que o texto não diz, responda o que dá para
> sustentar e pare por aí.
>
> Devolva um JSON com esta forma, e nada mais:
>
> `{"leitor": "A", "temas": {"POR07-05": [{"n": 2, "resposta": "<o texto da sua resposta>"}]}}`
>
> O pacote com o texto e as questões vem a seguir.

Troque `"A"` por `"B"` e por `"C"` nos outros dois. A série do prompt é a `serie` do pacote.

### Juiz (Sonnet, um agente)

> Você classifica respostas de alunos por um critério de correção já escrito. Para cada resposta,
> diga em qual das quatro caixas ela cai, olhando só o critério:
>
> - `espera_se`: bate com a resposta esperada;
> - `aceita_se`: cai em uma das entradas aceitas;
> - `nao_aceita`: cai em uma das entradas recusadas;
> - `fora`: não cai em nenhuma delas, nem certa pelo critério, nem errada pelo critério.
>
> Você não julga se a resposta é boa, nem se você concorda com ela. Você julga se o critério a
> alcança. Resposta excelente que o critério não previu é `fora`, e não `espera_se`.
>
> Devolva um JSON com esta forma, e nada mais:
>
> `{"vereditos": [{"tema": "POR07-05", "n": 2, "leitor": "A", "veredito": "aceita_se", "motivo": "cai na segunda entrada aceita"}]}`
>
> Os critérios e as respostas dos três leitores vêm a seguir.

### Lente adversarial (Fable, um agente)

> Você procura o buraco no critério de correção. Para cada questão, você recebe o texto, o
> enunciado e o critério inteiro. Ache uma resposta que um aluno honesto poderia dar, defensável
> pelo próprio texto, e que este critério marcaria como errada ou deixaria de fora.
>
> Se você achar, o veredito é `estreito`, e você escreve a resposta que prova o estreitamento e por
> que ela se sustenta no texto. Se não achar, o veredito é `criterio_ok`. Não invente leitura que o
> texto não sustenta: uma acusação falsa faz reescreverem um item que estava bom.
>
> Devolva um JSON com esta forma, e nada mais:
>
> `{"questoes": [{"tema": "POR07-05", "n": 7, "veredito": "estreito", "resposta": "<a resposta que prova>", "motivo": "<por que ela se sustenta>"}]}`
>
> O pacote cego e os critérios vêm a seguir.

## Os arquivos de entrada do `montar`

**Leitor**, uma das duas formas. A de vários temas:

```json
{"leitor": "A", "temas": {"POR07-05": [{"n": 2, "resposta": "O esquema é A B C B."}]}}
```

A de um tema só:

```json
{"leitor": "A", "respostas": [{"n": 2, "resposta": "O esquema é A B C B."}]}
```

**Juiz**: `{"vereditos": [{"tema", "n", "leitor", "veredito", "motivo"}]}`. O campo `motivo` é
opcional e fica gravado no registro quando existe. O campo `tema` pode faltar quando o arquivo é de
um tema só.

**Lente**: `{"questoes": [{"tema", "n", "veredito", "resposta", "motivo"}]}`. `resposta` e `motivo`
só fazem sentido no veredito `estreito`.

O `montar` recusa o painel, sem gravar nada, quando os três leitores não são distintos, quando
falta a resposta de um leitor em uma aberta, quando falta o veredito do juiz para uma resposta,
quando um veredito está fora das quatro caixas ou quando a lente não olhou alguma aberta.

## O registro

`temas/<pasta>/_painel/<ID>.json`, um por tema, ao lado das pastas de série (a pasta começa com
sublinhado, e o verificador não a trata como série):

```json
{
  "tema": "POR07-05",
  "assinatura": "<sha256 das subseções Exercícios e Gabarito da seção PT>",
  "data": "2026-09-08",
  "modelos": {"leitores": "sonnet", "juiz": "sonnet", "lente": "fable"},
  "questoes": [
    {"n": 2,
     "respostas": [{"leitor": "A", "resposta": "O esquema é A B C B.", "veredito": "espera_se"}],
     "lente": {"veredito": "criterio_ok"},
     "resultado": "aprovada"}
  ],
  "resultado": {"aprovadas": [2], "ambiguas": [], "estreitas": []}
}
```

**O registro é dado, e fica no repositório, com as respostas escritas por extenso.** Não é log de
execução: é o que a Nathália e o Rômulo leem para saber o que um aluno modelo respondeu a cada
questão, e é o que permite reabrir a discussão de um item meses depois sem rodar nada de novo. Por
isso ele é gravado com recuo, e por isso a resposta em branco reprova.

**A assinatura amarra o registro ao texto.** Ela é o sha256 das subseções `### Exercícios` e
`### Gabarito` da seção `## PT`, cada uma sem espaços nas pontas, unidas por uma quebra de linha. A
explicação e o cabeçalho ficam de fora de propósito: o painel lê questão, e mudar uma vírgula do
texto didático não muda o que o leitor viu. Mudar uma vírgula do enunciado ou do critério muda, e
aí o registro fica velho e o tema volta a não entrar no banco. É o que impede um painel antigo de
aprovar um item reescrito.

## O que o portão confere

Em matéria com catálogo, para tema com pelo menos uma aberta, o `verificar.py` e o `gerar_banco.py`
exigem, como erro e não como aviso:

- o registro existe em `_painel/`;
- a assinatura bate com a do tema de hoje;
- toda aberta está no registro, com exatamente três respostas de leitores distintos, cada uma com
  veredito válido e texto não vazio, e com a lente presente;
- `resultado.ambiguas` e `resultado.estreitas` vazios, e `resultado.aprovadas` igual ao conjunto
  das abertas.

`verificar.py --sem-painel` desliga essa conferência, para quem está escrevendo um tema e quer ver
o resto passar antes de rodar o painel. O gerador nunca desliga: tema sem registro válido fica de
fora do banco, com o mesmo molde dos outros reprovados. `--painel DIR` troca a raiz dos registros,
como `--fontes DIR` troca a da coleção de textos.

## O fan-out

Os leitores, o juiz e a lente são agentes lançados pela sessão: três em Sonnet, um em Sonnet e um
em Fable. É o único fan-out da frente, e no máximo seis agentes somando as três sessões. A ordem é
sempre a mesma: `exportar`, os três leitores, `criterios`, o juiz e a lente, `montar`.
