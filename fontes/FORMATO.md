# A coleção de fontes: um arquivo por texto

Todo trecho de texto que aparece num tema de português ou de literatura vive aqui, num arquivo
por texto, com procedência. O tema cita a fonte e copia as linhas; o verificador confere que a
cópia é exata. Se alguém trocar uma palavra de um verso, o tema reprova antes de qualquer humano
ler. Decisão de 08/09/2026 (Fase 2 da frente de português).

## 1. Onde e como se chama

Caminho: `fontes/<id>.md`. A pasta é plana: o que separa os textos é o campo `dominio`, e uma
pasta por domínio seria um segundo lugar dizendo a mesma coisa.

O `id` é o nome do arquivo: minúsculas, dígitos e hífen, com um sublinhado separando autor de
título. `machado-de-assis_missa-do-galo`, `goncalves-dias_cancao-do-exilio`. Texto escrito para o
exercício usa `escrito` como autor: `escrito_bilhete-da-geladeira`.

## 2. O cabeçalho

Mesmo molde `chave: valor` dos temas, entre dois `---`.

| campo | obrigatório | o que é |
|---|---|---|
| `id` | sim | igual ao nome do arquivo |
| `titulo` | sim | título do texto |
| `autor` | sim | nome como vai impresso no crédito; `escrito para o exercício` no texto autoral; `tradição popular` ou `anônimo` no tradicional |
| `autor_morte` | só em `publico` | ano de morte; com mais de um autor, os anos separados por vírgula, e a conta usa o maior |
| `obra` | não | livro ou coletânea em que o texto saiu; sem ela o crédito usa só o título |
| `ano` | sim | ano de publicação (ou do texto escrito) |
| `genero` | sim | `conto`, `poema`, `cronica`, `fabula`, `noticia`, `reportagem`, `artigo`, `entrevista`, `propaganda`, `verbete`, `bilhete`, `carta`, `teatro`, `romance`, `ensaio`, `cantiga`, `parlenda`, `relato`, `instrucao`, `outro` |
| `dominio` | sim | `publico`, `autoral`, `cc` ou `tradicional` |
| `licenca` | sim | `publico`: `domínio público, Lei 9.610/98 art. 41`; `autoral`: `escrito para este banco, uso livre`; `cc`: o nome exato da licença, começando por `CC `; `tradicional`: `domínio público, obra tradicional` |
| `procedencia` | sim | de onde o texto foi copiado, com endereço e data; ou `escrito pela frente 2 em 08/09/2026 para o tema POR07-01`; no tradicional, a coletânea |
| `tradutor` | não | quando o texto é tradução |
| `tradutor_morte` | só com `tradutor` | a tradução tem direito próprio; a mesma conta vale para o tradutor |
| `ortografia` | não | `atualizada` ou `original`; sem o campo, `atualizada` |
| `integral` | sim | `sim` quando o arquivo traz o texto inteiro; `nao` quando traz só o trecho que interessa |

### A conta do domínio público

Lei 9.610/98, art. 41: setenta anos contados de 1º de janeiro do ano seguinte à morte. O texto é
livre no ano `A` quando `autor_morte + 71 <= A`. Em 2026 está livre quem morreu até 1955. A
trava recebe o ano por parâmetro (`verificar.py --ano 2027`); sem ele usa o relógio. A conta só
afrouxa com o tempo, e é por isso que o teste passa um ano fixo, senão o par envenenado explodiria
sozinho em janeiro.

`autoral` e `tradicional` não têm `autor_morte`: se o campo aparecer, é sinal de que alguém marcou
o domínio errado, e reprova. `cc` exige `licenca` começando por `CC ` e `procedencia` com endereço.

### Ortografia atualizada não é reescrita

Trocar `annos` por `anos`, `céo` por `céu`, `idéia` por `ideia` é atualizar a ortografia, e as
edições escolares fazem isso. Trocar uma palavra, tirar uma vírgula ou cortar uma frase é
reescrever, e isso não se faz. Quando a atualização é nossa, e não da edição de procedência, a
`procedencia` diz isso e lista o que mudou. Erro de digitalização da edição (uma letra trocada)
também se corrige, declarando.

## 3. O corpo

Depois do segundo `---`, o texto. Uma linha por verso no poema. Na prosa, o texto é quebrado à mão
em linhas que cabem na largura do bloco de citação da folha (473 pontos na Helvetica de corpo 10;
uns 85 caracteres). Linha em branco separa estrofe ou parágrafo.

**A numeração conta só as linhas não vazias**, da primeira em diante. É o número que a folha
imprime ao lado do texto e que o exercício cita ("linha 12"), e ele não depende de como o gerador
quebra a página, porque cada linha da fonte é uma linha impressa. Por isso a largura é trava: linha
que não cabe viraria duas na folha e o número mentiria. O verificador mede cada linha com o próprio
`pdf.js` e diz quantos pontos sobram.

O corpo pode ter travessão e reticências: é texto de autor. Tab e linha só de espaços reprovam. O
cabeçalho segue a regra da casa (sem travessão).

## 4. Exemplos de cabeçalho

Domínio público:

```
---
id: lima-barreto_o-pai-da-ideia
titulo: O pai da ideia
autor: Lima Barreto
autor_morte: 1922
ano: 1920
genero: cronica
dominio: publico
licenca: domínio público, Lei 9.610/98 art. 41
procedencia: Wikisource pt, página "O pai da idéia" (endereço), lida em 08/09/2026; correções declaradas: ...
ortografia: atualizada
integral: sim
---
```

Texto escrito para o exercício:

```
---
id: escrito_noticia-biblioteca-do-bairro
titulo: Biblioteca do Jardim Alto reabre depois de oito meses fechada
autor: escrito para o exercício
ano: 2026
genero: noticia
dominio: autoral
licenca: escrito para este banco, uso livre
procedencia: escrito pela frente 2 em 08/09/2026 para o tema POR07-04; pessoas, lugares e fatos são inventados
integral: sim
---
```

Tradicional (cantiga, parlenda):

```
---
id: tradicional_o-cravo-e-a-rosa
titulo: O cravo e a rosa
autor: tradição popular
ano: 1900
genero: cantiga
dominio: tradicional
licenca: domínio público, obra tradicional
procedencia: coletânea pública (nome e endereço), lida em (data)
integral: sim
---
```

## 5. Como o tema usa a fonte

No tema, o bloco de citação é a diretiva `@fonte <id> linhas=<a>-<b>` seguida das linhas copiadas,
cada uma começando com `> `, e a linha em branco da fonte vira `>` sozinho. A seção 9 de
`temas/FORMATO.md` explica o resto: texto de apoio, trecho dentro da questão, alternativas e
gabarito com âncora. O crédito impresso embaixo do bloco é montado pelo gerador a partir deste
cabeçalho: `Lima Barreto. *O pai da ideia*, 1920.`; `Texto escrito para este
exercício.`; e, no tradicional, o título com a coletânea.

## 6. O que a trava garante e o que não garante

A trava garante que o tema reproduz o arquivo. Não garante que o arquivo reproduz o livro. Por
isso `procedencia` é obrigatória, e o texto de domínio público é copiado de edição pública com
endereço, nunca de memória. Quem grava a fonte é quem responde pela fidelidade dela.
