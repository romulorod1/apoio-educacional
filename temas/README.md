# Banco de temas de matemática

Material explicativo, lista de exercícios e gabarito, do 2º ano do fundamental ao 3º do médio, em
português e em inglês. Feito para virar a próxima função do aplicativo de controle de aulas: ao
marcar uma aula, a Nathália escolhe o tema e o material sai pronto, anexado àquela aula.

---

## Como está agora

| | |
|---|---|
| Temas | 146 de 146, todos conferidos |
| Séries | do 2º ano do fundamental ao 3º do médio |
| Exercícios | 2.485 em português, e os mesmos em inglês |
| Verificações simbólicas | 2.999 |
| Conferência humana | 73 itens, 2,9% do total |
| Material explicativo | cerca de 105 mil palavras em cada língua |

O banco está completo. Cada série tem entre 12 e 14 temas, e cada tema traz a explicação, a lista
em três blocos de dificuldade e o gabarito, nas duas línguas.

O estado de cada tema está no `CATALOGO.md`, e a coluna de situação é preenchida por programa, não
à mão: um tema só aparece como `pronto` se o arquivo existir **e** passar na conferência.

---

## Por que dá para confiar no conteúdo

Material de matemática que vai para a mão de uma criança não pode ter conta errada, e revisar no
olho não é garantia nenhuma. Por isso cada tema carrega, no fim do arquivo, um bloco com as contas
declaradas em forma executável, e um programa resolve todas com o sympy e compara com o gabarito
escrito.

O que é conferido em cada tema:

1. **Cada conta do gabarito**, resolvida simbolicamente e comparada com a resposta escrita.
2. **Cada exemplo da explicação**, do mesmo jeito.
3. **A correspondência entre as duas línguas**: a versão em inglês precisa usar os mesmos números e
   chegar às mesmas respostas, exercício por exercício.
4. **A contagem**: número de exercícios igual ao número de respostas, nas duas línguas.
5. **Ausência de travessão**, conforme a regra da casa.
6. **Ausência de rascunho**: marcas de raciocínio do autor que não podem sobrar no material.
7. **Estrutura**: cabeçalho completo, série e unidade válidas, id igual ao nome do arquivo.

Exercício que não é verificável por símbolo, como pedir uma explicação com as próprias palavras, é
marcado como conferência humana e listado no fim do relatório.

### O verificador também é testado

Um verificador que nunca reprova nada não prova nada. `testa_verificador.py` injeta onze defeitos de
propósito, um de cada tipo, e falha se algum passar. Também mantém catorze frases de calibragem,
metade que precisa ser pega e metade que precisa passar.

Essa parte não é enfeite. Numa versão anterior, três regras de detecção ficaram inertes por um
escape trocado e ninguém notou, porque o teste só exercitava as outras. Em outra, a marca `TODO`
estava sendo procurada sem distinguir maiúsculas e casava com a palavra portuguesa "todo",
reprovando texto perfeitamente correto.

---

## Erros que a conferência já pegou

Vale registrar, porque são reais e mostram para que serve:

- **Um problema de porcentagem que não fechava.** O enunciado levava a 60% de 36, que dá 21,6
  meninas. Números ajustados para 35 alunos e 21 meninas.
- **Um parágrafo com o rascunho do autor dentro**, com uma autocorreção no meio da frase, no
  material do 6º ano. Passaria despercebido numa leitura rápida.
- **Um segundo rascunho da mesma natureza** no material do 5º ano, numa frase que se contradizia.
- **Desalinhamento entre as línguas**: "elevado a 4" contra "to the fourth" fazia o inglês perder um
  número que o português tinha.
- **Uma expressão de verificação mal escrita**, que dava a impressão de conferir mas não conferia:
  `solve` do sympy devolve raízes complexas, então "nenhuma raiz real" precisava de `real_roots`.

---

## Como usar

```bash
cd temas/_ferramentas

python verificar.py              # confere todos os temas
python verificar.py MAT06-05     # confere um tema
python testa_verificador.py      # confere o próprio verificador
python atualizar_catalogo.py     # atualiza a situação no catálogo
```

Um tema reprovado não entra no banco. A regra é essa e não tem exceção.

## Como escrever um tema novo

O `FORMATO.md` traz a estrutura completa e as regras de conteúdo. O resumo:

- Um arquivo por tema, com as duas línguas dentro, em `mat/<serie>/<ID>.md`.
- Explicação de duas a três folhas, com exemplos resolvidos e uma seção de erros comuns.
- De quinze a vinte exercícios em três blocos: fundamentos, consolidação e aprofundamento. Nos anos
  iniciais, de dez a doze.
- **Nível calibrado para colégio exigente.** As crianças estudam nos melhores colégios da cidade, e
  lista mecânica não atende quem já domina a repetição. Ao menos um exercício por tema no nível de
  prova difícil.
- Gabarito separado, para o material poder ser entregue sem ele.
- Bloco de verificação com uma linha por conta.

## Já ligado ao aplicativo

Feito na versão 1.6.0. Dentro da aula, o botão **Material de aula** abre a lista de temas por ano
escolar, com busca. Ao escolher um tema ela decide a língua, o que entra (explicação, lista,
gabarito) e quais exercícios ficam, marcando e desmarcando a partir de tudo selecionado. O material
sai em PDF anexado àquela aula, com a numeração refeita e o gabarito acompanhando a escolha.

O `indice.json` carrega sempre, e cada `serie-XX.json` só quando aquela série é
aberta: no tablet, puxar o banco inteiro para ver um título seria desperdício.

## O que falta

1. **Revisar os 73 itens de conferência humana**, que são os exercícios sem conta a verificar por
   símbolo: nomear figuras, justificar com as próprias palavras, dobrar papel. O verificador os lista
   ao final de cada execução.
2. **Traduzir o banco para outras matérias**, se fizer sentido. O formato e o verificador foram
   escritos para matemática, mas a estrutura serve.
