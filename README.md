# Apoio Educacional, controle de aulas

Aplicativo de agenda, folha de aula e fechamento mensal para a operação da Nathália Wajsenzon.

Funciona como aplicativo instalado no tablet Samsung: abre em tela cheia, tem ícone próprio e
funciona sem internet. Os dados ficam guardados no próprio aparelho, no navegador. Nada é enviado
para servidor nenhum.

---

## Para a Nathália: como instalar no tablet

1. Abra o Chrome no tablet e vá até o endereço do aplicativo.
2. Toque nos três pontinhos, no canto superior direito.
3. Toque em **Instalar aplicativo** (ou **Adicionar à tela inicial**).
4. Pronto. O ícone azul com o **NW** aparece junto com os outros aplicativos.

A partir daí ele abre direto, em tela cheia, mesmo sem internet.

### O que dá para fazer

**Agenda.** Cada mês em uma tela. Toque num dia para marcar uma aula, ou numa aula existente para
abrir. No alto ficam os números do mês: encontros, horas cobradas e quanto há a receber.

**Aulas que se repetem.** Ao criar uma aula, marque *Repetir toda semana*, escolha os dias e até
quando. O aplicativo cria todas as aulas de uma vez. Depois, ao mudar ou apagar uma delas, ele
pergunta se vale **somente para aquela**, **para aquela e as seguintes** ou **para todas**. Aula que
você mudou individualmente vira exceção e não é mais sobrescrita pelas mudanças em massa.

**Desfazer.** Toda alteração que atinge mais de uma aula aparece com o botão *Desfazer* logo abaixo,
e fica registrada em *Ajustes*, para voltar atrás mesmo depois de fechar o aplicativo.

**Feriados.** Feriados nacionais, do estado do Rio de Janeiro e de Niterói aparecem marcados no
calendário. É só lembrete: dá para marcar aula em feriado normalmente.

**Folha de aula.** Dentro de cada aula existe uma folha para escrever à mão com a S Pen. Tem fundo
sem pauta, pautado ou pontilhado, cinco cores, três espessuras, marca-texto, borracha, texto
digitado e imagem colada. A caneta escreve e o dedo arrasta a folha, então dá para apoiar a mão sem
riscar nada. Dois dedos aproximam e afastam.

Se preferir montar a aula no Samsung Notes, como sempre fez: lá dentro toque em Compartilhar,
escolha **PDF**, e depois use **Anexar PDF** aqui dentro da aula. O arquivo fica guardado junto da
aula e você abre ou compartilha quando quiser. Ele não entra dentro do PDF do fechamento, que leva
só as folhas escritas no próprio aplicativo.

**Repetir para trás.** Quando as aulas já aconteciam antes de você cadastrar o aluno, abra
qualquer aula dele e toque em *Repetir para trás*. Escolha os dias da semana e até que data voltar:
o aplicativo cria as datas passadas com o mesmo horário e a mesma duração, pulando os dias que já
têm aula. Serve para fechar um mês que começou antes do aplicativo existir.

**Valor da hora-aula.** Cada aluno tem valores com período de vigência: de tal data até tal data,
tanto por hora. Ao reajustar, encerre o valor antigo e crie o novo. Cada aula é cobrada pelo valor
que valia na data dela, então reajuste no meio do mês sai certo sozinho.

**Fechamento.** Uma tela por mês, com a tabela de cada aluno e o total. Escreva o resumo do mês e
gere o PDF, já com o cabeçalho, o rodapé e a marca d'água. Dá para gerar também o arquivo de texto e
o PDF com as folhas de aula anexadas.

**Cópia de segurança.** Em *Ajustes*, salve a cópia de vez em quando e guarde no Google Drive. O
aplicativo lembra sozinho: se passarem catorze dias sem cópia, aparece um aviso na Agenda com um
botão para salvar na hora. Se o
tablet quebrar ou for trocado, é essa cópia que devolve tudo. Ela leva junto as folhas escritas à
mão, as imagens coladas e os arquivos anexados.

**Atualização.** Quando sai uma versão nova, ela chega sozinha na próxima vez que você abrir o
aplicativo com internet, e aparece um aviso perguntando se quer atualizar. **Atualizar não apaga
nada**: alunos, aulas, folhas e anexos continuam no lugar. Nunca é preciso desinstalar e instalar de
novo. Em *Ajustes* há também o botão *Procurar atualização*, para verificar na hora.

### O que já vem preenchido

Os doze alunos de julho de 2026 já estão cadastrados: Daniel, Marcelo, Guilherme, Lucas, Cecília,
Mariah, Paula, Marina, Mateus, Eduardo, Rafael e Theo. Junho do Marcelo também vem preenchido, com
as dez aulas reais, as 10:30 de aula e os R$ 1.050,00.

**Falta informar o valor da hora-aula de onze deles.** Esse dado não estava registrado em lugar
nenhum, e o aplicativo não inventa número: enquanto o valor não for preenchido, o fechamento desses
alunos fica em zero e um aviso aparece na tela de alunos.

---

## Para o Rômulo: manutenção

### Estrutura

| Arquivo | Função |
|---|---|
| `index.html` | Estrutura das telas e dos painéis |
| `styles.css` | Identidade visual aplicada à interface |
| `core.js` | Datas, feriados, vigências de preço, recorrência e cálculo do fechamento |
| `pdf.js` | Gerador de PDF próprio, sem biblioteca externa |
| `store.js` | IndexedDB, histórico de desfazer e cópia de segurança |
| `draw.js` | Editor da folha de aula |
| `app.js` | Interface e ligação entre as partes |
| `sw.js` | Modo offline |

`core.js` e `pdf.js` não dependem de navegador, então rodam no Node e são testados direto.

### Decisões que valem lembrar

**Vigência de preço em vez de preço fixo.** Cada aula puxa o valor que valia na data dela. É o que
faz o reajuste no meio do mês sair correto, e encaixa com a planilha de reajuste por IPCA.

**Recorrência materializada.** As aulas de uma série viram registros de verdade, não datas
calculadas na hora. Cada série guarda também a lista de datas apagadas (`exclusoes`), senão uma aula
apagada voltaria sozinha ao abrir o calendário de novo.

**Traço em vetor, não em imagem.** A folha guarda os pontos do traço com a pressão da caneta. No PDF
isso vira caminho vetorial, então a letra sai nítida em qualquer tamanho e o arquivo fica pequeno.

**PDF escrito à mão, sem dependência.** Usa as fontes base-14 com `WinAnsiEncoding`, que cobrem a
acentuação do português. As larguras da Helvetica estão embutidas em `pdf.js` porque o tablet não
tem essa fonte instalada e a quebra de linha precisa ser exata mesmo assim.

**Nada sai do aparelho.** Não há servidor, conta ou sincronização. A cópia de segurança é manual, de
propósito: são dados de crianças.

**Anexo vira texto na cópia.** Blob não sobrevive a `JSON.stringify`: viraria um objeto vazio e o
arquivo se perderia calado. Por isso o anexo é convertido para texto na exportação e reconstruído na
importação.

**Um editor de folha por vez.** A tela de desenho é o mesmo elemento reaproveitado a cada folha, e
os ouvintes ficam presos a um `AbortController` que é abortado no `destruir()`. Sem isso o editor
anterior continua escutando os toques junto com o novo, e a ferramenta antiga volta a agir sozinha.

**Mudança de padrão nunca descarta trabalho.** Ao editar uma recorrência, as aulas que continuam
valendo mantêm o mesmo registro, para a folha seguir ligada a elas. Aula que sai do padrão mas tem
folha, anotação ou anexo vira exceção em vez de ser apagada.

### Testes

Sobem um servidor local e rodam contra o Chrome instalado.

```bash
cd _teste
npm install
python -m http.server 8777 --bind 127.0.0.1 &   # em outro terminal

node testa.js            # cálculo do fechamento e geração de PDF
node testa_series.js     # recorrência e escopos de edição
node testa_feriados.js   # feriados, incluindo os móveis
node testa_exclusoes.js  # regressão: aula apagada não pode voltar
node testa_mover.js      # mover ocorrência e editar o padrão sem perder folha
node testa_retroativo.js # recuperar aulas passadas
node e2e.js              # 98 verificações simulando o uso real no tablet
node e2e_correcoes.js    # 39 verificações das correções e dos recursos novos
```

O caso de referência é o fechamento de junho do Marcelo, que existe em papel: dez encontros,
10:30 de aula e R$ 1.050,00. Se algum teste mexer nesse número, alguma coisa quebrou.

### Publicar uma alteração

```bash
git add -A && git commit -m "descrição" && git push
```

O GitHub Pages atualiza sozinho em um ou dois minutos. Ao mudar qualquer arquivo, suba também a
versão do cache em `sw.js` (`var CACHE = 'apoio-educacional-v2'`), senão os tablets que já
instalaram continuam com a versão antiga em cache.
