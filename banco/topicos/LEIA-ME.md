# Catálogo de tópicos, e o identificador estável de cada um

Os doze arquivos `<disciplina>.json` desta pasta SÃO a fonte do catálogo: não há
`.md` nem gerador por trás deles. O `indice.json` diz quais disciplinas existem,
os grupos de cada uma (ano, nível ou eixo transversal), quantos assuntos cada
uma tem (é o número que a tela mostra) e o `prefixo` do identificador.

Esquema de cada disciplina:

```
{disciplina, chave, eixo, grupos: [{chave, rotulo, blocos: [{titulo, topicos: [string], ids: [string]}]}]}
```

`_ids.json` é o registro congelado dos identificadores. `_relacionados_rascunho/`
é outra frente, parada de propósito; o LEIA-ME de lá explica.

## O identificador

Forma: `<PREFIXO><GRUPO>-T<NN>`. Exemplos: `POR07-T12`, `LITEM2-T03`,
`INGA1-T01`, `REDINICIACAO-T04`, `ESTROTINA-T02`.

- `PREFIXO` é o campo `prefixo` da disciplina no `indice.json`. Português e
  literatura usam a MESMA sigla dos temas delas em `Core.MATERIAS` (POR e LIT),
  porque tema e tópico da mesma matéria dividem a sigla. As outras têm sigla
  própria de três letras (RED, ING, CIE, HIS, GEO, FIS, QUI, BIO, FSO, EST), e
  nenhuma é começo de outra nem da sigla de tema de outra matéria (MAT).
- `GRUPO` é a chave do grupo em maiúsculas, sem hífen: `07`, `EM1`, `A1`,
  `INICIACAO`.
- `-T` é obrigatório. É o que separa tópico de tema: `Core.materiaDoTema`
  devolve null para qualquer id com `-T`, e a trilha compara por igualdade.
- `NN` é sequencial dentro da disciplina e do grupo, na ordem em que os títulos
  apareciam no dia da primeira emissão. Depois disso a ordem não manda mais
  nada: o número é memória, não posição.

Em cada bloco, `ids` é uma lista PARALELA a `topicos`: `ids[i]` é o id de
`topicos[i]`.

## Como emitir id para tópico novo

1. Escreva o título no lugar certo da lista `topicos` do bloco. Não mexa em `ids`.
2. Rode `node temas/_ferramentas/emite_ids_topicos.js`.
3. Atualize o número de assuntos da disciplina no `indice.json` (o teste avisa
   se esquecer).
4. Rode `node _teste/testa_topicos_ids.js` e olhe o diff: só o novo id deve ter
   entrado, no arquivo e no `_ids.json`.

O emissor casa cada título com o registro por disciplina + grupo + título
EXATO. Título que ele não conhece ganha o PRÓXIMO número livre do grupo, mesmo
que tenha sido inserido no meio do bloco: os vizinhos ficam com o que tinham.
Rodar duas vezes não muda nada. `--confere` só compara e sai 1 se houver título
sem id ou id fora do lugar, apontando o bloco.

## Por que um id nunca é reusado nem renumerado

O aplicativo grava nas aulas dela o que ela escolheu, e um tema de português
vai apontar para tópicos pelo id. Se `POR07-T12` passasse a ser outro tópico,
tudo que apontava para ele passaria a apontar para o vizinho, em silêncio, sem
erro nenhum na tela. Por isso:

- Título que sai da lista fica no `_ids.json` marcado `aposentado`. O número
  dele não volta para a fila: o próximo título novo do grupo pula esse número.
- Se o mesmo título voltar (mesma disciplina, mesmo grupo, mesma grafia), ele
  recebe o id antigo de volta, reativado. É o mesmo tópico.
- Trocar a grafia de um título é aposentar um tópico e criar outro, de
  propósito: o tablet guardou a grafia antiga nas aulas. Se a intenção é
  corrigir um erro de digitação sem criar tópico novo, isso é decisão humana,
  e passa por editar título e registro juntos, com o diff na mão.
- O `_ids.json` não se edita à mão e nunca se apaga. Se sumir, o emissor se
  recusa a rodar (renumeraria tudo do zero) e manda restaurar do git.
- Mudar o `prefixo` de uma disciplina depois de ids emitidos também é recusado.

## Por que `topicos` continua lista de strings

O aplicativo lê só o título de cada tópico (app.js, `carregarTopicos` e
`desenharGrupo`) e ignora chaves que não conhece no bloco. Ele grava na aula
`{titulo, fonte: 'topico', disciplina, grupo}`, sem id. Há uma janela, entre o
deploy e o toque em atualizar, em que o app antigo lê estes JSON pela rede: se
`topicos` virasse lista de objetos, ele gravaria objeto no lugar de título nas
aulas dela, e isso é dado real, num tablet sem sinal. Por isso o id vive numa
lista paralela, e `topicos` fica exatamente como era, byte a byte.

Os arquivos são gravados no formato compacto de `JSON.stringify`, sem recuo e
sem quebra de linha, que é a forma em que nasceram. O emissor se recusa a
reescrever um arquivo que não esteja nessa forma, para nunca mudar byte fora
de `ids` sem alguém decidir.

## Tamanho

Os treze arquivos que o service worker guarda (`sw.js`, lista `ARQUIVOS`)
foram de 99.018 para 134.840 bytes com os ids (35 KB a mais). O `_ids.json`
(238 KB) não está na lista e não vai para o tablet.

## Regras da casa que valem aqui

- Nunca travessão em título, comentário ou saída. O teste varre e reprova.
- Título é dado que ela já gravou: não se "conserta" grafia por conta própria.
