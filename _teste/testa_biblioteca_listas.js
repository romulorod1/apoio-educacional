/* testa_biblioteca_listas.js
 *
 * A TELA DA LISTA PRONTA (B10), no Chrome, com o pacote SINTÉTICO. O pacote
 * real do Drive nunca entra aqui.
 *
 * O que prova, no modo normal:
 *
 *   1. AS DUAS LINHAS NA TELA DO MÓDULO. "Lista pronta, nível 2" e "nível 3",
 *      cada uma dizendo quantos exercícios, quanto da aula e o minuto estimado
 *      colado da palavra estimativa. E, no outro sentido, o que NÃO pode estar
 *      escrito: nenhuma palavra de curadoria em lugar nenhum da tela. A
 *      comparação cega de 24/09 mediu que a nossa escolha não vence uma
 *      escolha simples dentro da mesma rampa, então "kit curado" e "sugestão"
 *      são afirmações que esta casa não pode fazer.
 *
 *   1a. O NÚMERO É O DAQUELA LISTA. As duas listas do pacote sintético têm
 *      tamanhos e minutos diferentes de propósito, e a tela tem de mostrar os
 *      dois pares certos. A lista de 70,0 min diz 70 e diz "um pouco mais de
 *      uma aula", e não "cerca de uma aula": o número na tela é o da lista, e
 *      a frase acompanha o número em vez de arredondar por ele.
 *
 *   2. TOCAR CARREGA NA ORDEM DELA. O carrinho fica exatamente com os ids da
 *      lista, NA ORDEM DA LISTA, que no pacote sintético é diferente da ordem
 *      dos exercícios no módulo. É isso que separa "carregou a lista" de
 *      "marcou o módulo".
 *
 *   3. SUBIR E DESCER. As setas trocam dois itens de lugar no carrinho, a
 *      numeração da tela acompanha, a seta some na ponta, e a ORDEM SOBREVIVE
 *      ATÉ O PDF: o material gerado sai com os exercícios na ordem em que ela
 *      deixou, e não na ordem da fonte.
 *
 *   4. TIRAR PELA CAIXA. Desmarcar um item tira do carrinho e renumera os de
 *      baixo na mesma tela, e o cabeçalho passa a dizer que ela mudou a lista.
 *
 *   5. ACRESCENTAR DO MÓDULO. O caminho abre a lista cheia da fonte com o que
 *      já está marcado, e o que ela marcar lá entra no FIM da lista pronta,
 *      onde as setas alcançam, e conta como acrescentado por ela: a tela diz
 *      que ele fica fora da conta dos minutos, porque o pacote não traz
 *      estimativa para exercício que não é da lista.
 *
 *   6. TAPAR. A folha ganha a ferramenta de tapar, ela se chama tapar e não
 *      "editar o enunciado", o retângulo entra no vetor da folha como item
 *      branco cheio, e a ordem das camadas do canvas é A MESMA do PDF.
 *
 *   7. OS QUATRO CONSERTOS DE TELA que o olho de fora cego pediu, e cada um
 *      com o lugar onde a mesma régua TEM de achar o contrário, medido na
 *      mesma rodada (seção 2, na lista cheia do módulo):
 *
 *      a) UMA COLUNA. A grade da lista pronta tem uma coluna só; a da lista
 *         cheia do módulo, mais de uma. Régua: quantos valores distintos de
 *         borda esquerda as células têm.
 *      b) O AVISO NÃO FLUTUA. A mensagem da tela está DENTRO do corpo, em
 *         posição estática, e a caixa flutuante do rodapé não abriu. O alvo de
 *         controle é fabricado e é do mesmo tipo: a mesma caixa do aviso com a
 *         classe que o `avisar()` põe nela, e aí a régua tem de acusar.
 *      c) SEM ETIQUETA DE DIFICULDADE no cartão da lista pronta, e COM ela na
 *         lista cheia do módulo, que é onde ela é filtro e não juízo sobre uma
 *         trajetória. O minuto por exercício continua nos dois.
 *      e) A FRASE DIZ O TOTAL RESULTANTE. Com dois itens marcados antes, a
 *         mensagem diz o que o material TEM agora e não soma em voz alta.
 *
 * Modos envenenados: cada um desliga UMA regra e a corrida sai assim que a vê
 * cair. Os dezenove estão na tabela VENENOS, logo abaixo das âncoras, e o modo
 * normal varre TODAS elas contra os arquivos de verdade (seção 0), porque
 * veneno é código que envelhece junto com o alvo. A lista por extenso mora na
 * tabela e não aqui, de propósito: esta lista já ficou para trás duas vezes,
 * uma vez dizendo quinze quando eram dezoito, e comentário que conta errado é
 * da mesma família da âncora que deixou de casar.
 *
 * Os que merecem nota, porque o que eles medem não se adivinha pelo nome:
 *   --envenenado-ordem    o carrinho fica com os MESMOS ids e só a ordem muda.
 *   --envenenado-camadas  o canvas volta à ordem do vetor; mede PIXEL, e não a
 *                         constante exportada.
 *   --envenenado-coluna e --envenenado-agrupa mexem SÓ no styles.css: se a
 *                         régua lesse o código em vez da tela, passariam.
 *   --envenenado-aviso-velho tira o apagamento da porta única, e a MESMA
 *                         corrida mede as duas portas, a da seta e a do
 *                         Desfazer.
 *   --envenenado-apara    o mover deixa de aparar, e o retângulo sai da folha.
  */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8806;
// as bandeiras saem da tabela de venenos, definida depois dos arquivos e das âncoras
const APP_REPO = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const DRAW_REPO = fs.readFileSync(path.join(H.RAIZ, 'draw.js'), 'utf8');
const CSS_REPO = fs.readFileSync(path.join(H.RAIZ, 'styles.css'), 'utf8');

/* As âncoras saem do PRÓPRIO arquivo, e a contagem de ocorrências logo abaixo
 * é o que transforma "a âncora não casou" em reprovação em vez de silêncio: um
 * veneno que deixa de envenenar sem ninguém notar é o pior defeito de uma
 * prova, e foi assim que o escopo do carregarSerie mediu o app.js inteiro no
 * PR #55. */
const L_ORDEM = 'var tudo = { itens: lp.ids.slice(), paginas: [] };';
const T_ORDEM = 'var tudo = { itens: lp.ids.slice().sort(), paginas: [] };';
const L_SETA = 'var outro = lista[j];';
const T_SETA = 'var outro = lista[j]; return null;';
const L_CURADORIA = 'var linha = linhaBib(nomeDaListaPronta(lp),';
const T_CURADORIA = "var linha = linhaBib('Kit curado, ' + comoSeChama(lp),";
/* A quebra de linha sai do PRÓPRIO arquivo: o repositório pode estar em CRLF, e
 * âncora de várias linhas cravada com \n casa zero vezes e envenena nada. */
const NL = DRAW_REPO.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
const NL_APP = APP_REPO.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
const L_CAMADAS = [
  '    for (var c = 0; c < ORDEM_CAMADAS.length; c++) {',
  '      for (var i = 0; i < itens.length; i++) {',
  '        if (itens[i] && itens[i].t === ORDEM_CAMADAS[c]) this._desenharItem(ctx, itens[i]);',
  '      }',
  '    }'].join(NL);
// o desenho na ordem do vetor, que é como era antes da B10
const T_CAMADAS = '    for (var i = 0; i < itens.length; i++) this._desenharItem(ctx, itens[i]);';

// a grade da lista pronta volta a três colunas, que é o defeito que o olho cego viu
const L_COLUNA = '.bib-grade.bib-grade-lp { grid-template-columns: minmax(0, 560px); gap: 28px; }';
const T_COLUNA = '.bib-grade.bib-grade-lp { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 28px; }';
// a folga de dentro da célula volta a ser igual à de fora, e a caixa "No
// material" volta a ficar no meio do caminho entre dois cartões
const L_AGRUPA = '.bib-grade-lp .bib-celula { gap: 4px; }';
const T_AGRUPA = '.bib-grade-lp .bib-celula { gap: 28px; }';
/* O aviso volta a sobreviver a toda mudança de carrinho: a porta única deixa de
 * apagá-lo. É o defeito que a lente cega achou, e ele aparece em DUAS portas de
 * uma vez: a seta (que passava pelo mexeuNoMaterial) e o Desfazer (que não
 * passava). Envenenar a porta única é o que mede as duas. */
const L_ORDEM_AVISO = [
  '  function guardarCarrinho() {',
  '    bibLpAviso = null;'].join(NL_APP);
const T_ORDEM_AVISO = '  function guardarCarrinho() {';
// o sairam volta a ser cego para a ordem, e a ordem dela some sem Desfazer
/* o critério volta a enumerar casos em vez de comparar as duas listas: só
 * "saiu item" conta, e o subconjunto reordenado passa batido */
const L_SAIRAM = '    var perdeu = tinhaAlgo && !igualAoPacote;';
const T_SAIRAM = '    var perdeu = sairam > 0;';
// a linha do módulo volta a recarregar a lista que ela está mexendo
const L_RECARREGA = '          if (listaProntaEmEdicao(lp)) irNaBiblioteca({ aula: { tipo: \'lista-pronta\', id: lp.id } });';
const T_RECARREGA = '          if (false && listaProntaEmEdicao(lp)) irNaBiblioteca({ aula: { tipo: \'lista-pronta\', id: lp.id } });';
// o redesenho volta para dentro do devolve-o-foco, e cada toque de seta desenha
// a tela duas vezes, jogando fora e repedindo as miniaturas de 1080 px
// a frase da aula volta a não ter piso nem teto: meia hora vira "um pouco
// menos de uma aula", e dez minutos também, com o minuto ao lado desmentindo
// o dedo volta a não cancelar o retângulo em andamento, e a palma apoiada fecha
// o tapar que o bico tinha começado
// o contorno de tela some, e o branco volta a ser invisível na folha branca
// a memoria de qual lista ela mexia volta a nao atravessar o reinicio
const L_LEMBRA = "      try { bibLpEmEdicao = localStorage.getItem(CHAVE_LP_EM_EDICAO) || null; } catch (e) { /* sem armazenamento */ }";
const T_LEMBRA = '      bibLpEmEdicao = null;';
// depois de anexar, a tela volta a dizer "Você tirou tudo desta lista", como
// se quem esvaziou tivesse sido ela
// o nome do arquivo anexado volta a não quebrar, e passa por cima do Abrir
const L_NOME_ANEXO = '#lista-anexos .item-lista .nome { overflow-wrap: anywhere; word-break: break-word; }';
const T_NOME_ANEXO = '#lista-anexos .item-lista .nome { }';
// o gabarito volta a sair dentro do mesmo PDF da lista
// tocar para ver volta a carregar a lista por cima do que ela marcou
const L_TROCA_AO_VER = "          else irNaBiblioteca({ aula: { tipo: 'lista-pronta', id: lp.id, ver: true } });";
const T_TROCA_AO_VER = '          else usarListaPronta(lp);';
// a seleção de antes da troca deixa de ser guardada no aparelho
const L_ESQUECE_ANTERIOR = "      if (sel) localStorage.setItem('apoio-educacional:bib-selecao-anterior', JSON.stringify(sel));";
const T_ESQUECE_ANTERIOR = '      if (sel) void sel;';
const L_GABARITO_JUNTO = '      var separa = !!(aula && op.lista && op.gabarito && usaItens.length);';
const T_GABARITO_JUNTO = '      var separa = false;';
const L_ANEXADA = '    var anexada = ids.length ? null : listaAnexada();';
const T_ANEXADA = '    var anexada = null;';
// o mover volta a nao aparar, e o retangulo sai da folha ao ser arrastado
const L_APARA = "        d.item.x = aparado(d.ix + (p.x - d.ox), 0, Math.max(0, FOLHA_L - d.item.w));";
const T_APARA = '        d.item.x = d.ix + (p.x - d.ox);';
const L_CONTORNO = "      ctx.strokeStyle = 'rgba(31, 58, 95, 0.35)';";
const T_CONTORNO = "      ctx.strokeStyle = 'rgba(255, 255, 255, 1)';";
const L_PALMA = '    this._cancelarTapar();';
const T_PALMA = '    if (false) this._cancelarTapar();';
const L_UMA_AULA = '    if (minutos < 45 || minutos > 75) return null;';
const T_UMA_AULA = '    if (false) return null;';
const L_REDESENHO = '  function redesenharListaPronta(id, qual) {';
const T_REDESENHO = '  function redesenharListaPronta(id, qual) {' + NL_APP + '    desenharCorpoBiblioteca();';
/* a seleção volta a mudar em silêncio, e a lixeira volta a nunca aparecer ao
 * tocar no retângulo: a ferramenta cria uma coisa que ela não consegue tirar */
const L_LIXEIRA = '      if (mudouSelecao && this.opcoes.aoSelecionar) this.opcoes.aoSelecionar(alvo);';
const T_LIXEIRA = '      if (false && this.opcoes.aoSelecionar) this.opcoes.aoSelecionar(alvo);';
// o caminho de volta da lista cheia volta a levar para o módulo
const L_VOLTA = '          bibVoltarPara = { id: lp.id, slug: l.slug, rotulo: nomeDaListaPronta(lp) };';
const T_VOLTA = '          bibVoltarPara = null;';
/* A mensagem volta para a caixa flutuante do rodapé, e o bloco do fluxo não é
 * desenhado. A ÂNCORA JÁ ENVELHECEU UMA VEZ: ela casava em `if (bibLpAviso) {`
 * mais o `corpo.appendChild` da linha seguinte, e quando o aviso passou a ser
 * capturado numa variável no meio das duas, o veneno deixou de casar e a
 * corrida morreu antes de qualquer asserção, com 0 passaram e 2 falharam. É o
 * portão fazendo o que tem de fazer, e é a razão de existir a varredura das
 * âncoras, mais abaixo. */
const L_FLUTUA = [
  '      var av = bibLpAviso;',
  "      corpo.appendChild(el('div', { class: 'bib-lp-aviso', id: 'bib-lp-aviso' }, ["].join(NL_APP);
const T_FLUTUA = [
  '      var av = bibLpAviso;',
  '      avisar(av.texto, av.rotulo, av.aoAgir);',
  "      if (0) corpo.appendChild(el('div', { class: 'bib-lp-aviso', id: 'bib-lp-aviso' }, ["].join(NL_APP);
// a frase volta a somar em voz alta, que é exatamente a que o revisor leu como conta quebrada
const L_FRASE = [
  "      texto: 'O material agora tem ' + plural(bibCarrinho.itens.length, 'exercício', 'exercícios') +",
  "        ': “' + nomeDaListaPronta(lp) + '”' +",
  "        (sairam ? ', no lugar do que estava marcado'",
  "          : perdeu ? ', de volta como veio' : '') +",
  "        '. Mude o que quiser e toque em Gerar material.',"].join(NL_APP);
const T_FRASE = "      texto: (sairam ? 'Tirei ' + plural(sairam, 'item que estava marcado', 'itens que estavam marcados') +" +
  " ' e marquei ' : 'Marquei ') + 'a lista pronta do nível ' + lp.nivel + ': ' +" +
  " plural(lp.ids.length, 'exercício', 'exercícios') + '. Mude o que quiser e toque em Gerar material.',";
// a etiqueta de dificuldade volta ao cartão da lista pronta
const L_DIFICULDADE = [
  "        el('div', { class: 'bib-tags' }, [",
  '          lp.minutosDe[id] !== undefined'].join(NL_APP);
const T_DIFICULDADE = [
  "        el('div', { class: 'bib-tags' }, [",
  "          rotuloDificuldade(it) ? el('span', { class: 'tag bib-dif-fonte', texto: rotuloDificuldade(it) }) : null,",
  '          lp.minutosDe[id] !== undefined'].join(NL_APP);

/* UMA TABELA, e não uma cadeia de ternários: qual arquivo servido muda, e de
 * que para quê. É ela que permite varrer TODAS as âncoras de uma vez, logo
 * abaixo, em vez de descobrir uma de cada vez quando a corrida daquele veneno
 * morre. */
const VENENOS = {
  ordem: { arq: '/app.js', de: L_ORDEM, para: T_ORDEM },
  seta: { arq: '/app.js', de: L_SETA, para: T_SETA },
  curadoria: { arq: '/app.js', de: L_CURADORIA, para: T_CURADORIA },
  camadas: { arq: '/draw.js', de: L_CAMADAS, para: T_CAMADAS },
  coluna: { arq: '/styles.css', de: L_COLUNA, para: T_COLUNA },
  flutua: { arq: '/app.js', de: L_FLUTUA, para: T_FLUTUA },
  frase: { arq: '/app.js', de: L_FRASE, para: T_FRASE },
  dificuldade: { arq: '/app.js', de: L_DIFICULDADE, para: T_DIFICULDADE },
  agrupa: { arq: '/styles.css', de: L_AGRUPA, para: T_AGRUPA },
  'aviso-velho': { arq: '/app.js', de: L_ORDEM_AVISO, para: T_ORDEM_AVISO },
  sairam: { arq: '/app.js', de: L_SAIRAM, para: T_SAIRAM },
  recarrega: { arq: '/app.js', de: L_RECARREGA, para: T_RECARREGA },
  volta: { arq: '/app.js', de: L_VOLTA, para: T_VOLTA },
  lixeira: { arq: '/draw.js', de: L_LIXEIRA, para: T_LIXEIRA },
  redesenho: { arq: '/app.js', de: L_REDESENHO, para: T_REDESENHO },
  'uma-aula': { arq: '/app.js', de: L_UMA_AULA, para: T_UMA_AULA },
  palma: { arq: '/draw.js', de: L_PALMA, para: T_PALMA },
  contorno: { arq: '/draw.js', de: L_CONTORNO, para: T_CONTORNO },
  apara: { arq: '/draw.js', de: L_APARA, para: T_APARA },
  lembra: { arq: '/app.js', de: L_LEMBRA, para: T_LEMBRA },
  anexada: { arq: '/app.js', de: L_ANEXADA, para: T_ANEXADA },
  'nome-anexo': { arq: '/styles.css', de: L_NOME_ANEXO, para: T_NOME_ANEXO },
  'gabarito-junto': { arq: '/app.js', de: L_GABARITO_JUNTO, para: T_GABARITO_JUNTO },
  'troca-ao-ver': { arq: '/app.js', de: L_TROCA_AO_VER, para: T_TROCA_AO_VER },
  'esquece-anterior': { arq: '/app.js', de: L_ESQUECE_ANTERIOR, para: T_ESQUECE_ANTERIOR }
};
const NOME_VENENO = Object.keys(VENENOS).filter(function (n) {
  return process.argv.indexOf('--envenenado-' + n) !== -1;
})[0] || null;
const RECEITA = NOME_VENENO ? VENENOS[NOME_VENENO] : null;
const VENENO = !!NOME_VENENO;
const V_ORDEM = NOME_VENENO === 'ordem';
const V_SETA = NOME_VENENO === 'seta';
const V_CURADORIA = NOME_VENENO === 'curadoria';
const V_CAMADAS = NOME_VENENO === 'camadas';
const V_COLUNA = NOME_VENENO === 'coluna';
const V_FLUTUA = NOME_VENENO === 'flutua';
const V_FRASE = NOME_VENENO === 'frase';
const V_DIFICULDADE = NOME_VENENO === 'dificuldade';
const V_AGRUPA = NOME_VENENO === 'agrupa';
const V_AVISO_VELHO = NOME_VENENO === 'aviso-velho';
const V_SAIRAM = NOME_VENENO === 'sairam';
const V_RECARREGA = NOME_VENENO === 'recarrega';
const V_VOLTA = NOME_VENENO === 'volta';
const V_LIXEIRA = NOME_VENENO === 'lixeira';
const V_REDESENHO = NOME_VENENO === 'redesenho';
const V_UMA_AULA = NOME_VENENO === 'uma-aula';
const V_PALMA = NOME_VENENO === 'palma';
const V_CONTORNO = NOME_VENENO === 'contorno';
const V_APARA = NOME_VENENO === 'apara';
const V_LEMBRA = NOME_VENENO === 'lembra';
const V_ANEXADA = NOME_VENENO === 'anexada';
const V_NOME_ANEXO = NOME_VENENO === 'nome-anexo';
const V_GABARITO_JUNTO = NOME_VENENO === 'gabarito-junto';
const V_TROCA_AO_VER = NOME_VENENO === 'troca-ao-ver';
const V_ESQUECE_ANTERIOR = NOME_VENENO === 'esquece-anterior';
const BASE_DE = { '/app.js': APP_REPO, '/draw.js': DRAW_REPO, '/styles.css': CSS_REPO };
const trocas = {};
if (VENENO) trocas[RECEITA.arq] = BASE_DE[RECEITA.arq].split(RECEITA.de).join(RECEITA.para);

const amb = H.criarAmbiente(PORTA, 'perfil_bib_listas', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'b10_listas_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

const MOD_TITULO = 'Equações do Segundo Grau';
const MOD_PIT_TITULO = 'Teorema de Pitágoras';
const LISTA2 = Sintetico.LISTAS.filter(l => l.modulo.indexOf('equacoes') >= 0 && l.nivel === 2)[0];
const LISTA3 = Sintetico.LISTAS.filter(l => l.modulo.indexOf('equacoes') >= 0 && l.nivel === 3)[0];
const LISTA_CURTA = Sintetico.LISTAS.filter(l => l.modulo.indexOf('pitagoras') >= 0)[0];
const IDS2 = LISTA2.degraus.map(d => d.item);

/* As palavras que a tela NÃO pode dizer. A lista é fechada e está aqui, e não
 * no app.js, porque a prova tem de poder acusar uma palavra que o app.js nunca
 * escreveu. */
const PROIBIDAS = ['curad', 'sugest', 'recomend', 'selecion', 'escolhid', 'melhor'];

async function importar(pag, arquivo) {
  await H.irParaAba(pag, 'ajustes');
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar('importação', () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca'); return c ? c.innerText.trim() : '';
  }), v => /^Biblioteca importada\.|não foi importado/.test(v || ''), 90000);
  return r.valor || '';
}

const carrinho = pag => pag.evaluate(() => {
  try { return JSON.parse(localStorage.getItem('apoio-educacional:bib-carrinho') || 'null') || { itens: [], paginas: [] }; }
  catch (e) { return { itens: [], paginas: [] }; }
});

const tocarLinha = (pag, nome) => pag.evaluate(n => {
  const l = Array.from(document.querySelectorAll('#bib-corpo .item-lista'))
    .find(x => x.querySelector('.nome').textContent.trim() === n);
  if (!l) return false; l.click(); return true;
}, nome);

/* TOCAR NA LINHA MOSTRA A LISTA, e quem carrega é o botão "Usar esta lista"
 * (a pergunta de trocar, quando há, é aceita pela página de teste). */
const usarLista = async (pag, nome) => {
  if (!(await tocarLinha(pag, nome))) return false;
  await pausa(400);
  return pag.evaluate(() => { const b = document.querySelector('#bib-lp-usar'); if (!b) return false; b.click(); return true; });
};

const linhasDeListaPronta = pag => pag.evaluate(() =>
  Array.from(document.querySelectorAll('#bib-corpo [data-lista-pronta]')).map(l => ({
    id: l.getAttribute('data-lista-pronta'),
    nome: l.querySelector('.nome').textContent.trim(),
    detalhe: Array.from(l.querySelectorAll('.detalhe')).map(d => d.textContent.trim())
  })));

const textoDoCorpo = pag => pag.evaluate(() => (document.querySelector('#bib-corpo') || {}).innerText || '');

const numerosDaTela = pag => pag.evaluate(() =>
  Array.from(document.querySelectorAll('#bib-lp-grade .bib-numero')).map(n => n.textContent.trim()));

const setasDaTela = pag => pag.evaluate(() =>
  Array.from(document.querySelectorAll('#bib-lp-grade .bib-celula')).map(c => ({
    subir: !!(c.querySelector('[data-subir]') || {}).disabled,
    descer: !!(c.querySelector('[data-descer]') || {}).disabled
  })));

const tocarSeta = (pag, id, qual) => pag.evaluate((i, q) => {
  const b = document.querySelector('#bib-lp-grade [data-' + q + '="' + i + '"]');
  if (!b || b.disabled) return false; b.click(); return true;
}, id, qual);

const desmarcar = (pag, id) => pag.evaluate(i => {
  const c = document.querySelector('#bib-lp-grade input[data-carrinho="itens"][data-id="' + i + '"]');
  if (!c) return false; c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); return true;
}, id);

/* A RÉGUA DAS COLUNAS mede a TELA, e não o CSS: conta quantos valores
 * distintos de borda esquerda as células de uma grade têm. Ler
 * `gridTemplateColumns` diria o que está escrito na folha de estilo, que é
 * justamente o que pode estar certo enquanto a tela sai errada. */
const gradeDe = (pag, seletor) => pag.evaluate(s => {
  const g = document.querySelector(s);
  if (!g) return null;
  const celulas = Array.from(g.children).filter(c => c.getBoundingClientRect().width > 0);
  const bordas = {};
  celulas.forEach(c => { bordas[Math.round(c.getBoundingClientRect().left)] = 1; });
  return { celulas: celulas.length, colunas: Object.keys(bordas).length,
    largura: Math.round((celulas[0] || g).getBoundingClientRect().width) };
}, seletor);

/* A RÉGUA DO AGRUPAMENTO mede a distância em PIXEL, que é o que o olho lê.
 * Para cada célula: quanto sobra entre o fim do cartão e os controles dele
 * (dentro), e quanto sobra entre esses controles e o cartão seguinte (fora).
 * O agrupamento só existe quando "dentro" é bem menor que "fora"; com os dois
 * iguais, a caixa "No material" fica no meio do caminho e não se sabe de qual
 * cartão ela é. */
const agrupamentoDe = (pag, seletor) => pag.evaluate(s => {
  const g = document.querySelector(s);
  if (!g) return null;
  const celulas = Array.from(g.children).filter(c => c.getBoundingClientRect().height > 0);
  const pares = [];
  celulas.forEach((c, i) => {
    const cartao = c.querySelector('.bib-cartao');
    const acoes = c.querySelector('.bib-acoes');
    if (!cartao || !acoes) return;
    const dentro = Math.round(acoes.getBoundingClientRect().top - cartao.getBoundingClientRect().bottom);
    const seguinte = celulas[i + 1] && celulas[i + 1].querySelector('.bib-cartao');
    const fora = seguinte
      ? Math.round(seguinte.getBoundingClientRect().top - acoes.getBoundingClientRect().bottom) : null;
    pares.push({ dentro, fora });
  });
  const comVizinho = pares.filter(p => p.fora !== null);
  return {
    pares: pares.length,
    dentroMax: pares.length ? Math.max.apply(null, pares.map(p => p.dentro)) : null,
    foraMin: comVizinho.length ? Math.min.apply(null, comVizinho.map(p => p.fora)) : null
  };
}, seletor);

/* A RÉGUA DA ETIQUETA procura por dois caminhos de propósito: a classe do
 * elemento e a palavra no texto renderizado. Uma etiqueta que voltasse com
 * outra classe passaria pela primeira e cairia na segunda. */
const etiquetasDe = (pag, seletor) => pag.evaluate(s => {
  const raiz = document.querySelector(s);
  if (!raiz) return null;
  const tags = Array.from(raiz.querySelectorAll('.bib-dif-fonte')).map(t => t.textContent.trim());
  const texto = raiz.innerText || '';
  return { tags: tags.length, exemplo: tags[0] || '(nenhuma)',
    palavra: /estimada:|revisada:/.test(texto) ? 'tem' : 'não tem',
    minutos: raiz.querySelectorAll('.bib-lp-min-item').length };
}, seletor);

/* A RÉGUA DO AVISO. Mede três coisas: se a caixa flutuante do rodapé está
 * aberta, se a mensagem da tela está dentro do corpo e em posição estática (ou
 * seja, no fluxo, empurrando o conteúdo em vez de passar por cima dele), e
 * quantos cartões e controles da lista pronta a caixa indicada cobre. */
const aviso = (pag, seletor) => pag.evaluate(s => {
  const flut = document.querySelector('#aviso');
  const dentro = document.querySelector('#bib-lp-aviso');
  const corpo = document.querySelector('#bib-corpo');
  const caixa = document.querySelector(s);
  let cobre = 0;
  if (caixa) {
    const r = caixa.getBoundingClientRect();
    const alvos = Array.from(document.querySelectorAll(
      '#bib-lp-grade .bib-celula, #bib-lp-grade .bib-marcar, #bib-lp-grade .bib-lp-setas button'));
    alvos.forEach(a => {
      const b = a.getBoundingClientRect();
      if (b.width > 0 && b.height > 0 && r.width > 0 &&
        r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top) cobre++;
    });
  }
  return {
    flutuando: !!(flut && flut.classList.contains('aberto')),
    cobertos: cobre,
    noFluxo: !!(dentro && corpo && corpo.contains(dentro) && getComputedStyle(dentro).position === 'static'),
    texto: dentro ? (dentro.innerText || '').trim().replace(/\s+/g, ' ') : '',
    flutuante: flut ? (document.querySelector('#aviso-texto') || {}).textContent || '' : ''
  };
}, seletor);

async function cenarioVerNaoTroca(pag) {
  secao('5i. Ver uma lista não troca o material, e o que estava marcado volta');
  const perguntas = [];
  pag.on('dialog', d => perguntas.push(d.message()));
  await pag.evaluate(() => { const b = document.querySelector('#bib-carrinho-limpar'); if (b) b.click(); });
  await pausa(400);
  await H.irParaAba(pag, 'biblioteca');
  await pag.evaluate(() => {
    for (let k = 0; k < 6; k++) {
      const b = document.querySelector('.bib-voltar');
      if (!b) break;
      const t = b.textContent; b.click();
      if (/9º ano/.test(t)) break;
    }
  });
  await pausa(400);
  if (!(await tocarLinha(pag, MOD_TITULO))) await pausa(200);
  await pausa(400);
  conf('abriu a lista cheia', await tocarLinha(pag, 'Equações do Segundo Grau: Resultados Básicos'), true);
  await pausa(600);
  const nove = await pag.evaluate(() => {
    const caixas = Array.from(document.querySelectorAll('#bib-corpo input[data-carrinho="itens"]')).slice(0, 9);
    caixas.forEach(c => { if (!c.checked) { c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); } });
    return caixas.map(c => c.dataset.id);
  });
  await pausa(300);
  const marcadosDela = (await carrinho(pag)).itens.slice();
  conf('ela marcou nove exercícios', marcadosDela.length, 9);
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(400);
  conf('tocou para ver a primeira lista', await tocarLinha(pag, 'Lista com 1 desafio'), true);
  await pausa(400);
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(400);
  conf('tocou para ver a outra', await tocarLinha(pag, 'Lista com 2 desafios'), true);
  await pausa(400);
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(400);
  const depoisDeVer = (await carrinho(pag)).itens.slice();
  if (V_TROCA_AO_VER) {
    conf('VENENO ENXERGADO: ver trocou o material e os nove sumiram', depoisDeVer.join('|') === marcadosDela.join('|'), false);
    return false;
  }
  conf('depois de ver as duas listas, os nove continuam, na ordem', depoisDeVer.join('|'), marcadosDela.join('|'));
  conf('tocou na outra lista e em Usar esta lista', await usarLista(pag, 'Lista com 2 desafios'), true);
  await pausa(500);
  console.log('   pergunta: ' + JSON.stringify(perguntas[perguntas.length - 1] || null));
  conf('usar perguntou antes de trocar, com o número certo',
    perguntas[perguntas.length - 1] || '', 'Trocar os 9 exercícios marcados por esta lista?');
  const LISTA3 = Sintetico.LISTAS.filter(l => l.modulo === LISTA2.modulo && l.id !== LISTA2.id)[0];
  conf('e trocou: o material é a lista', (await carrinho(pag)).itens.join('|'), LISTA3.degraus.map(d => d.item).join('|'));
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'biblioteca');
  await pausa(500);
  const temRecuperar = await pag.evaluate(() => !!document.querySelector('#bib-carrinho-recuperar'));
  if (V_ESQUECE_ANTERIOR) {
    conf('VENENO ENXERGADO: depois do reinício não há o que recuperar', temRecuperar, false);
    return false;
  }
  conf('depois de fechar e abrir, a faixa oferece Recuperar o que estava marcado', temRecuperar, true);
  await pag.evaluate(() => document.querySelector('#bib-carrinho-recuperar').click());
  await pausa(500);
  conf('e o que estava marcado voltou inteiro e na ordem', (await carrinho(pag)).itens.join('|'), marcadosDela.join('|'));
  await pag.evaluate(() => { const b = document.querySelector('#bib-carrinho-limpar'); if (b) b.click(); });
  await pausa(400);
  void nove;
  return true;
}

(async () => {
  /* AS CERCAS AINDA APONTAM PARA O ALVO, varridas TODAS de uma vez.
   *
   * O veneno é código que envelhece junto com o alvo. Nesta leva o aviso mudou
   * de porta e a frase ganhou um caso, e duas âncoras deixaram de casar: as
   * duas corridas envenenadas morreram com "0 passaram, 2 falharam", que é o
   * feitio de veneno que não achou o que trocar. O portão pegou, e pegou
   * porque cada veneno roda. Mas isso descobre UMA por vez, e só no dia em que
   * aquela corrida acontece; e um veneno que passasse a trocar algo que não
   * importa ficaria VERDE e cego, que é pior do que estar vermelho.
   *
   * Então a varredura roda no modo normal e olha as quinze de uma vez, contra
   * os arquivos de verdade. Com o alvo ao lado: uma âncora inventada, do mesmo
   * feitio das outras, que TEM de casar zero vezes. Sem ela, "todas casaram uma
   * vez" não se distinguiria de um contador que devolve 1 para tudo. */
  if (!VENENO) {
    secao('0. As cercas ainda apontam para o alvo');
    var nomes = Object.keys(VENENOS);
    conf('a tabela tem os vinte e cinco venenos desta prova', nomes.length, 25);
    var fora = [];
    nomes.forEach(function (n) {
      var r = VENENOS[n];
      var quantas = BASE_DE[r.arq].split(r.de).length - 1;
      if (quantas !== 1) fora.push(n + ' casa ' + quantas + ' vez(es) em ' + r.arq);
      if (r.para === r.de) fora.push(n + ' troca por si mesmo');
    });
    if (fora.length) fora.forEach(function (f) { console.log('   ' + f); });
    conf('e todas as âncoras casam exatamente uma vez no arquivo delas',
      fora.join(' | ') || '(nenhuma fora)', '(nenhuma fora)');
    conf('e o controle: uma âncora inventada casa ZERO vezes, senão o contador não conta',
      APP_REPO.split('  function funcaoQueNaoExisteNesteArquivo() {').length - 1, 0);
  }

  if (VENENO) {
    secao('O veneno é de verdade');
    const base = BASE_DE[RECEITA.arq];
    conf('o arquivo ' + RECEITA.arq + ' servido ficou DIFERENTE do repositório',
      trocas[RECEITA.arq] !== base ? 'diferente' : 'IGUAL', 'diferente');
    conf('e o veneno trocou exatamente uma ocorrência', base.split(RECEITA.de).length - 1, 1);
    if (trocas[RECEITA.arq] === base) throw Object.assign(new Error('veneno não aplicado'), { jaContado: true });
  }
  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);

  const zip = path.join(TMP, 'com-listas.zip');
  Sintetico.gerar(zip, { listas: true });
  conf('importou o pacote sintético com as listas prontas',
    /^Biblioteca importada\./.test(await importar(pag, zip)), true);

  // ================================================================
  secao('1. As duas linhas na tela do módulo');
  await H.irParaAba(pag, 'biblioteca');
  await pausa(300);
  conf('abriu o módulo do pacote', await tocarLinha(pag, MOD_TITULO), true);
  await pausa(400);

  const linhas = await linhasDeListaPronta(pag);
  console.log('   linhas: ' + JSON.stringify(linhas));
  conf('são duas linhas de lista pronta', linhas.length, 2);
  /* No modo do veneno da curadoria o rótulo é outro de propósito, e cobrar o
   * rótulo certo ali seria cobrar do veneno que ele não envenenasse. O que a
   * corrida envenenada tem de medir é só se a varredura ENXERGA. */
  if (!V_CURADORIA) {
    conf('a primeira se chama pela composição dela, no singular', (linhas[0] || {}).nome, 'Lista com 1 desafio');
    conf('a segunda idem, no plural', (linhas[1] || {}).nome, 'Lista com 2 desafios');
  }

  // 1a. o número é o DAQUELA lista, e os dois pares são diferentes entre si
  const d2 = (linhas[0] || {}).detalhe || [];
  const d3 = (linhas[1] || {}).detalhe || [];
  conf('o nível 2 diz quantos exercícios são', /^5 exercícios/.test(d2[0] || ''), true);
  conf('o nível 3 diz quantos exercícios são', /^4 exercícios/.test(d3[0] || ''), true);
  conf('o nível 2, com 58,4 min, diz cerca de uma aula', /cerca de uma aula/.test(d2[0] || ''), true);
  /* AS TRÊS FAIXAS DA FRASE, e é isto que impede o texto de ser uma constante:
   * 58,4 está dentro da banda, 70,0 está acima e a lista do outro módulo, com
   * 49,6, está abaixo. Com as três dentro, trocar umaAula() por "cerca de
   * uma aula" fixo passaria em tudo. A primeira escrita desta prova tinha só
   * a de dentro, e foi rodando que isso apareceu. */
  conf('o nível 3, com 70,0 min, diz um pouco MAIS de uma aula', /um pouco mais de uma aula/.test(d3[0] || ''), true);
  /* O minuto da lista vai INTEIRO, meio para cima: 58,4 vira 58 e 70,0 vira
   * 70. A décima numa estimativa de quanto o aluno leva é precisão que não
   * existe, e era ela que fazia "29" e "32,1" aparecerem lado a lado com
   * formatos diferentes. */
  conf('o minuto do nível 2 vem embaixo, inteiro, colado da estimativa', d2[1], '≈ 58 min');
  conf('o minuto do nível 3 vem embaixo, inteiro, colado da estimativa', d3[1], '≈ 70 min');

  const texto = (await textoDoCorpo(pag)).toLowerCase();
  const achadas = PROIBIDAS.filter(p => texto.indexOf(p) >= 0);
  if (V_CURADORIA) {
    conf('VENENO: a varredura ENXERGA a palavra de curadoria que o app envenenado escreveu',
      achadas.join(','), 'curad');
    if (pag.errosDePagina.length) console.log('   erros de página: ' + pag.errosDePagina.join(' | ').slice(0, 200));
    return;
  }
  conf('nenhuma palavra de curadoria na tela do módulo', achadas.join(',') || '(nenhuma)', '(nenhuma)');
  /* A LÍNGUA DELA NA TELA DO ASSUNTO: a ajuda diz a ordem em palavras
   * simples, "estimativa" fica para o cabeçalho da lista (aqui o "≈" basta),
   * e "pacote" é palavra nossa, não dela. */
  conf('a ajuda diz a ordem em palavras simples', await pag.evaluate(() =>
    (document.querySelector('#bib-lp-ajuda') || {}).textContent || ''),
    'As listas vão do mais simples ao mais difícil. Tire, ponha e troque a ordem à vontade.');
  conf('na tela do assunto a palavra "estimativa" não aparece', /estimativa/.test(texto), false);
  conf('nem a palavra "pacote"', /pacote/.test(texto), false);
  if (V_TROCA_AO_VER) { await cenarioVerNaoTroca(pag); return; }
  /* O CONTROLE DA VARREDURA: ela tem de saber acusar. Sem este par, a linha
   * acima passaria igualzinho com a lista de palavras vazia, que é a família
   * de defeito que custou três dias a esta casa. */
  conf('e a varredura sabe acusar, medida contra uma frase que tem a palavra',
    PROIBIDAS.filter(p => 'este é um kit curado pelo professor'.indexOf(p) >= 0).join(','), 'curad');

  // 1b. o outro módulo, com a lista abaixo da banda
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(300);
  conf('abriu o outro módulo', await tocarLinha(pag, MOD_PIT_TITULO), true);
  await pausa(400);
  const linhasPit = await linhasDeListaPronta(pag);
  conf('o módulo do Teorema de Pitágoras tem a lista dele, e só ela', linhasPit.length, 1);
  /* O TERCEIRO NOME, o de zero, que a tela promete para uma trajetória que
   * ainda não existe. Sem esta lista no fixture ele seria um ramo que prova
   * nenhuma alcança, e o nome só se sustenta se ele aguentar o caso de não
   * haver nenhum item do degrau mais alto. */
  conf('e ela se chama pela composição dela, que não tem nenhum desafio',
    (linhasPit[0] || {}).nome, 'Lista sem desafio');
  conf('e é a do módulo certo', (linhasPit[0] || {}).id, LISTA_CURTA.id);
  conf('com 49,6 min, diz um pouco MENOS de uma aula',
    /um pouco menos de uma aula/.test(((linhasPit[0] || {}).detalhe || [])[0] || ''), true);
  /* O ARREDONDAMENTO É MEIO PARA CIMA, e esta é a lista que mede isso: 49,6
   * tem de virar 50. As outras duas têm 58,4 e 70,0, que arredondam para
   * BAIXO e para lugar nenhum; com só elas, trocar o meio para cima por um
   * corte simples passaria nas três asserções sem nada reclamar. */
  conf('e o minuto dela é o dela, arredondado meio PARA CIMA (49,6 vira 50)',
    ((linhasPit[0] || {}).detalhe || [])[1], '≈ 50 min');
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(300);
  conf('voltou e abriu de novo o módulo das equações', await tocarLinha(pag, MOD_TITULO), true);
  await pausa(400);

  // ================================================================
  /* AS RÉGUAS NOVAS APONTADAS PARA ONDE ELAS TÊM DE ACHAR.
   *
   * "Uma coluna" e "nenhuma etiqueta de dificuldade" são os dois resultados
   * bons da tela da lista pronta, e por isso indistinguíveis de dois medidores
   * cegos, que dariam o mesmo resultado limpo. O alvo de controle é a lista
   * CHEIA do mesmo módulo, medida na mesma rodada: lá a grade TEM mais de uma
   * coluna e os cartões TÊM etiqueta, porque ali a etiqueta é filtro e não
   * juízo sobre uma trajetória.
   *
   * E aproveita para deixar DOIS exercícios marcados, que é o que faz a frase
   * do aviso cair no caso da substituição: é exatamente esse caso que o olho
   * de fora cego leu como aritmética quebrada. */
  secao('1c. As réguas novas, medidas onde elas TÊM de achar');
  conf('abriu a lista cheia do módulo', await tocarLinha(pag, 'Soma e Produto'), true);
  await pausa(700);
  const gradeCheia = await gradeDe(pag, '#bib-corpo .bib-grade-exercicios');
  console.log('   grade da lista cheia: ' + JSON.stringify(gradeCheia));
  conf('a lista cheia tem mais de um cartão', (gradeCheia || {}).celulas > 1, true);
  conf('e a régua das colunas ACHA mais de uma coluna nela', (gradeCheia || {}).colunas > 1, true);
  const etiqCheia = await etiquetasDe(pag, '#bib-corpo .bib-grade-exercicios');
  console.log('   etiquetas na lista cheia: ' + JSON.stringify(etiqCheia));
  conf('e a régua da etiqueta ACHA etiqueta de dificuldade nela', (etiqCheia || {}).tags > 0, true);
  conf('e ACHA a palavra no texto renderizado', (etiqCheia || {}).palavra, 'tem');

  const marcados = await pag.evaluate(ids => {
    const caixas = Array.from(document.querySelectorAll('#bib-corpo input[data-carrinho="itens"]'))
      .filter(c => ids.indexOf(c.dataset.id) < 0).slice(0, 2);
    caixas.forEach(c => { c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); });
    return caixas.map(c => c.dataset.id);
  }, IDS2);
  conf('marcou dois exercícios que NÃO são da lista pronta', marcados.length, 2);
  await pausa(300);
  conf('e os dois estão no carrinho', (await carrinho(pag)).itens.length, 2);
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(400);

  // ================================================================
  secao('2. Tocar carrega a lista no carrinho, NA ORDEM DELA');
  conf('a ordem da lista do nível 2 é diferente da ordem da fonte',
    IDS2.join('|') !== IDS2.slice().sort().join('|'), true);
  /* TOCAR MOSTRA E NÃO MEXE: o material continua com os dois que ela marcou
   * na lista cheia, e a tela é a de ver, com o botão de usar. */
  conf('tocou na linha do nível 2', await tocarLinha(pag, 'Lista com 1 desafio'), true);
  await pausa(500);
  conf('ver a lista NÃO mexeu no material', (await carrinho(pag)).itens.length, 2);
  conf('e a tela é a de ver, com o botão Usar esta lista',
    await pag.evaluate(() => !!document.querySelector('#bib-lp-previa') && !!document.querySelector('#bib-lp-usar')), true);
  conf('e ela diz que ver não muda nada', await pag.evaluate(() =>
    /Ver esta lista não muda nada/.test((document.querySelector('#bib-lp-estado') || {}).textContent || '')), true);
  conf('usou a lista', await pag.evaluate(() => { const b = document.querySelector('#bib-lp-usar'); if (!b) return false; b.click(); return true; }), true);
  await pausa(500);
  const c2 = await carrinho(pag);
  console.log('   carrinho: ' + JSON.stringify(c2.itens));
  conf('o carrinho tem os itens da lista', c2.itens.slice().sort().join('|'), IDS2.slice().sort().join('|'));
  if (V_ORDEM) {
    /* O VENENO MAIS SILENCIOSO DOS QUATRO: o carrinho continua com os MESMOS
     * ids e o MESMO tamanho, e só a ordem muda. A asserção de cima passa
     * igualzinho, e é por isso que ela sozinha não mede "carregou a lista". */
    conf('VENENO: o carrinho tem os mesmos ids', c2.itens.length, IDS2.length);
    conf('VENENO: e a ordem NÃO é a da lista', c2.itens.join('|') === IDS2.join('|') ? 'é a da lista' : 'outra', 'outra');
    conf('VENENO: é a ordem do id, que é o que o app envenenado faz',
      c2.itens.join('|'), IDS2.slice().sort().join('|'));
    return;
  }
  conf('e NA ORDEM DA LISTA', c2.itens.join('|'), IDS2.join('|'));
  conf('e não levou página de teoria nenhuma', c2.paginas.length, 0);
  conf('a tela da lista abriu com os cinco', (await numerosDaTela(pag)).length, 5);
  const textoDaLista = await textoDoCorpo(pag);
  conf('na tela da lista, "estimativa" aparece UMA vez, no cabeçalho',
    (textoDaLista.match(/estimativa/g) || []).length, 1);
  conf('e "pacote" não aparece', /pacote/i.test(textoDaLista), false);

  // ================================================================
  secao('2b. Os quatro consertos de tela que o olho de fora cego pediu');
  const gradeLp = await gradeDe(pag, '#bib-lp-grade');
  console.log('   grade da lista pronta: ' + JSON.stringify(gradeLp));
  conf('a tela tem mais de um cartão, senão "uma coluna" não mediria nada', (gradeLp || {}).celulas > 1, true);
  if (V_COLUNA) {
    /* O ÚNICO VENENO QUE NÃO MEXE EM JAVASCRIPT: só a folha de estilo muda, e
     * o app.js continua igualzinho ao do repositório. Se a régua estivesse
     * lendo o código em vez da tela, este veneno passaria batido. */
    conf('VENENO: sem a regra de uma coluna, a grade volta a ter mais de uma', (gradeLp || {}).colunas > 1, true);
    return;
  }
  conf('(a) a grade da lista pronta tem UMA coluna', (gradeLp || {}).colunas, 1);

  /* O CARTÃO E OS CONTROLES DELE SÃO UM BLOCO SÓ. Em coluna única isto deixou
   * de ser de graça: com a mesma folga dentro e fora da célula, a caixa "No
   * material" fica no meio do caminho entre dois cartões, e o olho de fora cego
   * não soube dizer de qual dos dois ela era. */
  const agrupa = await agrupamentoDe(pag, '#bib-lp-grade');
  console.log('   agrupamento: ' + JSON.stringify(agrupa));
  conf('há pelo menos dois cartões, senão "dentro e fora" não existe', (agrupa || {}).pares > 1, true);
  if (V_AGRUPA) {
    conf('VENENO: com a folga de dentro igual à de fora, o agrupamento some',
      (agrupa || {}).dentroMax >= (agrupa || {}).foraMin, true);
    return;
  }
  conf('(a) os controles ficam MAIS PERTO do cartão deles do que do seguinte',
    (agrupa || {}).dentroMax * 2 <= (agrupa || {}).foraMin, true);
  /* O CONTROLE DA RÉGUA DO AGRUPAMENTO: alvo fabricado, do mesmo tipo, na
   * mesma tela. Igualadas as duas folgas pelo estilo em linha, a régua TEM de
   * acusar; sem isto, "está agrupado" não se distingue de um medidor cego. */
  await pag.evaluate(() => {
    document.querySelectorAll('#bib-lp-grade .bib-celula').forEach(c => { c.style.gap = '28px'; });
  });
  await pausa(200);
  const agrupaAlvo = await agrupamentoDe(pag, '#bib-lp-grade');
  console.log('   alvo do agrupamento: ' + JSON.stringify(agrupaAlvo));
  conf('e a régua ACUSA quando as duas folgas ficam iguais',
    (agrupaAlvo || {}).dentroMax * 2 <= (agrupaAlvo || {}).foraMin, false);
  await pag.evaluate(() => {
    document.querySelectorAll('#bib-lp-grade .bib-celula').forEach(c => { c.style.gap = ''; });
  });
  await pausa(200);

  const etiqLp = await etiquetasDe(pag, '#bib-lp-grade');
  console.log('   etiquetas na lista pronta: ' + JSON.stringify(etiqLp));
  if (V_DIFICULDADE) {
    conf('VENENO: a etiqueta voltou ao cartão e a régua a vê pela classe', (etiqLp || {}).tags > 0, true);
    conf('VENENO: e a vê também pela palavra no texto', (etiqLp || {}).palavra, 'tem');
    return;
  }
  conf('(c) nenhuma etiqueta de dificuldade no cartão da lista pronta', (etiqLp || {}).tags, 0);
  conf('(c) nem a palavra no texto renderizado', (etiqLp || {}).palavra, 'não tem');
  conf('(c) e o minuto por exercício CONTINUA, um por cartão',
    (etiqLp || {}).minutos, (gradeLp || {}).celulas);

  const av = await aviso(pag, '#bib-lp-aviso');
  console.log('   aviso: ' + JSON.stringify(av));
  if (V_FLUTUA) {
    conf('VENENO: a mensagem foi para a caixa flutuante do rodapé', av.flutuando, true);
    conf('VENENO: e não sobrou bloco nenhum no fluxo da tela', av.noFluxo, false);
    return;
  }
  conf('(b) a caixa flutuante do rodapé NÃO abriu', av.flutuando, false);
  conf('(b) a mensagem está no corpo da tela e em posição estática', av.noFluxo, true);
  conf('(b) e não cobre cartão nem controle nenhum', av.cobertos, 0);

  /* A FRASE COM OS DOIS ITENS QUE JÁ ESTAVAM MARCADOS, que é o caso do print.
   * O texto do bloco traz o rótulo do botão colado no fim, e é ele que sai. */
  const FRASE = 'O material agora tem 5 exercícios: “Lista com 1 desafio”, ' +
    'no lugar do que estava marcado. Mude o que quiser e toque em Gerar material.';
  if (V_FRASE) {
    conf('VENENO: a frase voltou a somar em voz alta',
      /^Tirei 2 itens que estavam marcados e marquei/.test(av.texto), true);
    conf('VENENO: e deixou de dizer o total resultante',
      av.texto.indexOf('O material agora tem') >= 0 ? 'diz' : 'não diz', 'não diz');
    return;
  }
  conf('(e) a frase diz o TOTAL RESULTANTE', av.texto.replace(/ Desfazer$/, ''), FRASE);
  conf('(e) e não soma em voz alta', /Tirei/.test(av.texto) ? 'soma' : 'não soma', 'não soma');
  conf('(e) e o Desfazer continua à mão, porque dois itens saíram',
    await pag.evaluate(() => !!document.querySelector('#bib-lp-aviso-acao')), true);
  /* (d) O rótulo "No material" NÃO muda nesta rodada: é do B7, está no ar
   * desde a 1.26.0 e não é regressão desta frente. Fica medido para que
   * mudá-lo sem querer reprove. */
  conf('(d) o rótulo da caixa continua "No material", intocado',
    await pag.evaluate(() => {
      const m = document.querySelector('#bib-lp-grade .bib-marcar span');
      return m ? m.textContent.trim() : '(não achei)';
    }), 'No material');

  const textoLp = (await textoDoCorpo(pag)).toLowerCase();
  conf('nenhuma palavra de curadoria na tela da lista pronta',
    PROIBIDAS.filter(p => textoLp.indexOf(p) >= 0).join(',') || '(nenhuma)', '(nenhuma)');

  /* O CONTROLE DA RÉGUA DO AVISO. "Não flutua" e "não cobre nada" são os dois
   * resultados bons, e sem alvo não se distinguem de um medidor cego. O alvo é
   * fabricado e é do MESMO tipo do que a régua lê de verdade: a mesma caixa do
   * rodapé, com a mesma classe que o avisar() põe nela, e com a tela rolada
   * até o fim, que é onde ela cobria as setas no print do marco. */
  await pag.evaluate(() => {
    const c = document.querySelector('.conteudo');
    if (c) c.scrollTop = c.scrollHeight;
    const t = document.querySelector('#aviso-texto');
    if (t) t.textContent = 'alvo de controle desta prova';
    document.querySelector('#aviso').classList.add('aberto');
  });
  await pausa(400);
  const alvo = await aviso(pag, '#aviso');
  console.log('   alvo de controle: ' + JSON.stringify(alvo));
  conf('a régua ACUSA a caixa do rodapé aberta', alvo.flutuando, true);
  conf('e ACUSA que ela cobre cartão ou controle da lista pronta', alvo.cobertos > 0, true);
  await pag.evaluate(() => {
    document.querySelector('#aviso').classList.remove('aberto');
    const c = document.querySelector('.conteudo');
    if (c) c.scrollTop = 0;
  });
  await pausa(300);

  // ================================================================
  secao('3. Subir e descer, e a ordem sobrevive até o PDF');
  const setas0 = await setasDaTela(pag);
  conf('a seta de subir do primeiro está apagada', (setas0[0] || {}).subir, true);
  conf('a seta de descer do último está apagada', (setas0[setas0.length - 1] || {}).descer, true);
  conf('a seta de subir do segundo está acesa', (setas0[1] || {}).subir, false);

  conf('tocou em descer no primeiro', await tocarSeta(pag, IDS2[0], 'descer'), true);
  await pausa(400);
  const c3 = await carrinho(pag);
  const esperada = [IDS2[1], IDS2[0]].concat(IDS2.slice(2));
  console.log('   depois da seta: ' + JSON.stringify(c3.itens));
  if (V_SETA) {
    conf('VENENO: a seta não mexeu em nada, e a ordem continua a de antes', c3.itens.join('|'), IDS2.join('|'));
    return;
  }
  conf('os dois primeiros trocaram de lugar no carrinho', c3.itens.join('|'), esperada.join('|'));

  /* O AVISO MORRE NO PRIMEIRO TOQUE QUE MUDA O MATERIAL, e a troca de ordem é
   * um desses toques: a ORDEM é o que a lista pronta É, e reordenada ela não é
   * mais a lista do pacote. O olho de fora cego pegou a frase antiga num print
   * em que um exercício já tinha subido e ela continuava afirmando "a lista
   * pronta do nível 2". E, no lugar dela, a tela passa a dizer o que virou
   * verdade, que é a frase da ordem. */
  const depoisDaSeta = await aviso(pag, '#bib-lp-aviso');
  console.log('   aviso depois da seta: ' + JSON.stringify(depoisDaSeta.texto));
  if (V_AVISO_VELHO) {
    /* A PRIMEIRA DAS DUAS PORTAS, e esta corrida NÃO para aqui: o mesmo veneno
     * mede a segunda porta na seção 5b, no Desfazer. Foi por medir só uma que o
     * guarda ficou cego enquanto o defeito entrava pela outra. */
    conf('VENENO (porta da seta): o aviso sobreviveu à troca de ordem e continua afirmando a lista do pacote',
      /“Lista com 1 desafio”/.test(depoisDaSeta.texto), true);
  } else {
    conf('o aviso da lista pronta sai no primeiro toque que muda o material', depoisDaSeta.texto, '');
    conf('e a tela passa a dizer que ela mudou a lista, mesmo tendo mudado SÓ a ordem',
      await pag.evaluate(() => {
        const m = document.querySelector('#bib-lp-mudou');
        return m ? m.textContent.trim() : '(não achei)';
      }), 'Você mudou esta lista. O material sai na ordem que está aqui.');
  }

  const nums = await numerosDaTela(pag);
  /* (Aqui havia "a numeração da tela acompanha", conferindo que o primeiro
   * cartão começa com "1. " e o segundo com "2. ". A numeração é literalmente
   * `(pos + 1) + '. '`, então não existe dado que quebre isso. Quem mede a
   * renumeração de verdade é a linha seguinte, que exige que o cartão de cima
   * seja o OUTRO exercício.) */
  conf('e o que está em primeiro agora é o outro exercício',
    nums[0], '1. Exercício ' + (Number(IDS2[1].split(':').pop())));

  /* A ORDEM SOBREVIVE ATÉ O PDF, e isto é MEDIDO na fronteira em que o
   * aplicativo entrega ao gerador, e não lido no código. O espião guarda os
   * ids na ordem em que o pdf.js os recebe; se o caminho da tela até o PDF
   * reordenasse em qualquer ponto, a lista gravada aqui sairia diferente da do
   * carrinho, que é exatamente o defeito que ninguém veria olhando a tela. */
  const ordemNoPdf = await pag.evaluate(async () => {
    const original = window.PDFGen.gerarMaterialBiblioteca;
    window.__vistos = null;
    window.PDFGen.gerarMaterialBiblioteca = function (op) {
      window.__vistos = (op.itens || []).map(p => (p.item && p.item.id) || p.id || null);
      return original.apply(this, arguments);
    };
    try {
      document.querySelector('#bib-carrinho-gerar').click();
      await new Promise(r => setTimeout(r, 400));
      const b = Array.from(document.querySelectorAll('#rodape-modal-bib-gerar button'))
        .find(x => /Gerar|Baixar|material/i.test(x.textContent));
      if (b) b.click();
      await new Promise(r => setTimeout(r, 2500));
      return window.__vistos;
    } finally {
      window.PDFGen.gerarMaterialBiblioteca = original;
    }
  });
  console.log('   ordem que o pdf.js recebeu: ' + JSON.stringify(ordemNoPdf));
  conf('o gerador do PDF recebeu os exercícios NA ORDEM DA TELA',
    (ordemNoPdf || []).join('|'), esperada.join('|'));
  await pag.evaluate(() => {
    const m = document.querySelector('#modal-bib-gerar');
    if (m && m.classList.contains('aberto')) {
      const f = Array.from(m.querySelectorAll('button')).find(x => /Fechar|Cancelar/i.test(x.textContent));
      if (f) f.click();
    }
  });
  await pausa(300);

  // ================================================================
  secao('4. Tirar pela caixa renumera na mesma tela');
  conf('desmarcou o terceiro', await desmarcar(pag, esperada[2]), true);
  await pausa(400);
  const c4 = await carrinho(pag);
  conf('saiu do carrinho', c4.itens.indexOf(esperada[2]) < 0, true);
  conf('e sobraram quatro', c4.itens.length, 4);
  conf('a tela renumerou', (await numerosDaTela(pag)).length, 4);
  conf('e o cabeçalho diz que ela mudou a lista',
    await pag.evaluate(() => !!document.querySelector('#bib-lp-mudou')), true);

  // ================================================================
  secao('5. Acrescentar do módulo entra no fim');
  const atalho = await pag.evaluate(() => {
    const b = document.querySelector('#bib-lp-acrescentar [data-acrescentar]');
    if (!b) return false; b.click(); return true;
  });
  conf('o caminho de acrescentar abre a lista cheia do módulo', atalho, true);
  await pausa(500);
  const novo = await pag.evaluate(ids => {
    const caixas = Array.from(document.querySelectorAll('#bib-corpo input[data-carrinho="itens"]'));
    const livre = caixas.find(c => ids.indexOf(c.dataset.id) < 0);
    if (!livre) return null;
    livre.checked = true;
    livre.dispatchEvent(new Event('change', { bubbles: true }));
    return livre.dataset.id;
  }, IDS2);
  conf('marcou um exercício que não é da lista', typeof novo, 'string');
  await pausa(400);
  const c5 = await carrinho(pag);
  conf('ele entrou no FIM do carrinho', c5.itens[c5.itens.length - 1], novo);

  /* O CAMINHO DE VOLTA, e é ele que fecha a promessa do cabeçalho desta seção.
   *
   * A escrita anterior parava aqui: clicava em Voltar, ia parar no MÓDULO, e
   * conferia que o carrinho tinha o mesmo tamanho de antes do clique, que é
   * verdade para qualquer implementação, porque clicar em Voltar não mexe no
   * carrinho. Não existia dado neste fixture, nem em nenhum, capaz de fazer
   * aquela linha falhar, e o nome dela afirmava um toque que o teste não dava.
   * Foi a segunda lente cega que a pegou, e ela tinha razão: era a asserção que
   * cobriria o defeito de a ordem ser jogada fora, e ela não cobria nada. */
  const rotuloVoltar = await pag.evaluate(() => {
    const b = document.querySelector('.bib-voltar');
    return b ? b.textContent.trim() : '(não achei)';
  });
  console.log('   o botão de voltar da lista cheia diz: ' + JSON.stringify(rotuloVoltar));
  if (V_VOLTA) {
    conf('VENENO: sem a marca de volta, o botão leva para o módulo',
      rotuloVoltar, '‹ ' + MOD_TITULO);
    return;
  }
  conf('o botão de voltar da lista cheia leva DE VOLTA À LISTA PRONTA',
    rotuloVoltar, '‹ Lista com 1 desafio');
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(500);
  conf('e chegou mesmo na tela da lista pronta',
    await pag.evaluate(() => !!document.querySelector('#bib-lp-grade')), true);
  const c6 = await carrinho(pag);
  /* (Aqui havia "com o carrinho inteiro preservado, na ordem dela", comparando o
   * carrinho antes e depois de um clique em Voltar, que por construção não mexe
   * no carrinho em implementação nenhuma. Era a mesma família que esta frente
   * removeu da seção 5 e que sobreviveu ao lado das asserções que mordem. O que
   * de fato mede a volta é o rótulo do botão, logo acima, e a grade estar na
   * tela.) */

  /* AGORA O QUE A SEÇÃO PROMETIA E NUNCA TINHA SIDO LIDO: o exercício de fora
   * entra no FIM, onde as setas alcançam, e a tela diz que ele fica fora da
   * conta dos minutos. Com a tela nunca reaberta, estas duas frases existiam e
   * nenhuma prova as tinha visto. */
  const deFora = await pag.evaluate(i => {
    const cel = document.querySelector('#bib-lp-grade .bib-celula:last-child');
    const cartao = cel && cel.querySelector('.bib-cartao');
    return {
      ultimo: !!(cartao && cartao.dataset.id === i),
      tag: cel ? Array.from(cel.querySelectorAll('.tag')).map(t => t.textContent.trim()).join(' | ') : '',
      setas: cel ? cel.querySelectorAll('.bib-lp-setas button').length : 0,
      subirAcesa: !!(cel && cel.querySelector('[data-subir]') && !cel.querySelector('[data-subir]').disabled),
      cabeca: (document.querySelector('#bib-lp-cabeca') || {}).innerText || ''
    };
  }, novo);
  console.log('   o acrescentado: ' + JSON.stringify(deFora));
  conf('o exercício de fora é o ÚLTIMO cartão da lista pronta', deFora.ultimo, true);
  conf('e a etiqueta dele diz que foi você quem acrescentou', deFora.tag, 'acrescentado por você');
  conf('e as setas alcançam ele', deFora.setas, 2);
  conf('e a de subir está acesa, porque há cartão acima', deFora.subirAcesa, true);
  conf('e o cabeçalho diz que ele fica fora da conta dos minutos',
    /fora 1 exercício que você acrescentou e não entram? nessa conta/.test(deFora.cabeca), true);

  /* TOCAR DE NOVO NA LINHA NÃO JOGA O TRABALHO DELA FORA. Voltar ao módulo e
   * tocar na mesma lista é o caminho mais natural do mundo, e ele apagava a
   * ordem que ela tinha acabado de montar, sem aviso e sem Desfazer. */
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(400);
  conf('voltou para o módulo', await pag.evaluate(() => !!document.querySelector('[data-lista-pronta]')), true);
  conf('tocou de novo na linha do nível 2', await tocarLinha(pag, 'Lista com 1 desafio'), true);
  await pausa(500);
  const c7 = await carrinho(pag);
  console.log('   carrinho depois de tocar de novo: ' + JSON.stringify(c7.itens));
  if (V_RECARREGA) {
    /* Sem abrir a lista que ela mexia, o toque cai na tela de VER: o trabalho
     * dela fica guardado (ver não mexe), mas a tela de mexer não abre. */
    conf('VENENO: a linha não abriu a lista que ela estava mexendo',
      await pag.evaluate(() => !!document.querySelector('#bib-lp-grade')), false);
    return;
  }
  conf('a linha ABRIU a lista que ela estava mexendo, sem recarregar',
    c7.itens.join('|'), c5.itens.join('|'));
  conf('e a tela aberta é a da lista pronta',
    await pag.evaluate(() => !!document.querySelector('#bib-lp-grade')), true);

  /* A ORDEM DELA SOBREVIVE AO APARELHO SER FECHADO, e quando ela não sobrevive
   * há Desfazer. Recarregada a página, a memória de "qual lista ela estava
   * mexendo" se perde (o carrinho não, ele mora no localStorage), então o toque
   * na linha CARREGA de novo e a ordem do pacote volta. Isso é legítimo, mas
   * não pode ser silencioso: é trabalho dela indo embora. */
  secao('5b. A ordem dela nunca some sem volta');
  /* O ARRANJO, ESCRITO ANTES DO CÓDIGO, E A AFIRMAÇÃO AO LADO DELE.
   *
   *   Arranjo:   o carrinho é um SUBCONJUNTO da lista (ela tirou um exercício),
   *              reordenado, e o aparelho foi fechado e reaberto.
   *   Afirmação: tocar na linha devolve a lista do pacote e oferece Desfazer,
   *              dizendo que ela voltou como o pacote a trouxe.
   *
   * As duas frases falam do mesmo arranjo, e é por isso que esta prova serve.
   *
   * A ESCRITA ANTERIOR NÃO SERVIA, e o defeito dela é o que fundou esta
   * disciplina. Ela devolvia, logo antes de medir, o exercício que a seção 4
   * tinha tirado, para o carrinho ficar com os MESMOS ids da lista em ordem
   * diferente. O comentário justificava assim: "sem isso, o toque na linha
   * cairia no caso 'saiu item', que já tem Desfazer desde sempre". A frase era
   * FALSA: carrinho menor que a lista não é "saiu item" nenhum, porque `sairam`
   * é diferença de conjunto e dá ZERO quando o que ela tem é subconjunto do que
   * vem. O arranjo que a prova evitava, dizendo que ele já estava coberto, era
   * exatamente o único em que o aplicativo perdia o trabalho dela em silêncio.
   *
   * Conferência descrita como feita, feita no arranjo vizinho. O caso volta ao
   * revés: o exercício tirado FICA tirado. */
  conf('tirou o acrescentado pela caixa', await desmarcar(pag, novo), true);
  await pausa(400);
  const cPuro = await carrinho(pag);
  console.log('   carrinho do caso puro: ' + JSON.stringify(cPuro.itens));
  conf('o carrinho é SUBCONJUNTO PRÓPRIO da lista: ela tirou um exercício',
    cPuro.itens.length < IDS2.length && cPuro.itens.every(function (id) { return IDS2.indexOf(id) >= 0; }), true);
  conf('e em ordem DIFERENTE da do pacote',
    cPuro.itens.join('|') === IDS2.slice(0, cPuro.itens.length).join('|') ? 'igual' : 'outra', 'outra');

  /* PRIMEIRO: O APARELHO FECHA E REABRE, E O TRABALHO DELA CONTINUA LÁ.
   *
   * O carrinho mora no localStorage e sempre sobreviveu; a memória de QUAL
   * lista ela estava mexendo era variável de memória e não sobrevivia. Então o
   * toque na linha caía no ramo que RECARREGA e substituía a ordem dela pela do
   * pacote, e a promessa da linha do módulo (tocar ABRE em vez de recarregar)
   * não valia depois de um reinício, que é a interrupção mais provável num
   * tablet que fica aberto o dia inteiro. */
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'biblioteca');
  await pausa(400);
  const guardado = await carrinho(pag);
  conf('depois do reload o carrinho continua com a ordem dela', guardado.itens.join('|'), cPuro.itens.join('|'));
  conf('abriu o módulo', await tocarLinha(pag, MOD_TITULO), true);
  await pausa(400);
  conf('tocou na linha do nível 2 depois do reinício', await tocarLinha(pag, 'Lista com 1 desafio'), true);
  await pausa(600);
  const depoisDoReinicio = await carrinho(pag);
  console.log('   depois do reinício: ' + JSON.stringify(depoisDoReinicio.itens));
  if (V_LEMBRA) {
    /* Desde que tocar MOSTRA em vez de carregar, o que se perde sem a memória
     * não é a ordem (ver não mexe no material), é o caminho: a linha abre a
     * tela de VER, e não a lista que ela estava mexendo. */
    conf('VENENO: sem lembrar qual lista era, o reinício faz a linha abrir a tela de VER, e não a de mexer',
      await pag.evaluate(() => !!document.querySelector('#bib-lp-grade')), false);
    return;
  }
  conf('a linha ABRIU, e o trabalho dela atravessou o reinício',
    depoisDoReinicio.itens.join('|'), cPuro.itens.join('|'));

  /* AGORA O CASO EM QUE A LISTA É MESMO RECARREGADA, que continua existindo: a
   * memória de qual lista era pode não bater com o carrinho (dados do
   * navegador limpos pela metade, cópia restaurada, outro perfil). Aqui ela é
   * desfeita de propósito, porque é o único jeito de encenar o desencontro, e o
   * que se mede é que nesse caso a perda NÃO é silenciosa. */
  await pag.evaluate(() => { try { localStorage.removeItem('apoio-educacional:bib-lp-em-edicao'); } catch (e) { /* ok */ } });
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'biblioteca');
  await pausa(400);
  conf('abriu o módulo de novo', await tocarLinha(pag, MOD_TITULO), true);
  await pausa(400);
  conf('tocou na linha com a memória desfeita e usou a lista', await usarLista(pag, 'Lista com 1 desafio'), true);
  await pausa(600);
  const c8 = await carrinho(pag);
  const avisoReload = await aviso(pag, '#bib-lp-aviso');
  console.log('   depois do reload: ' + JSON.stringify(c8.itens) + ' | ' + JSON.stringify(avisoReload.texto));
  conf('a lista do pacote voltou inteira e na ordem dela', c8.itens.join('|'), IDS2.join('|'));
  if (V_SAIRAM) {
    conf('VENENO: sem enxergar a ordem, o aviso nasce SEM Desfazer',
      await pag.evaluate(() => !!document.querySelector('#bib-lp-aviso-acao')), false);
    conf('VENENO: e a frase não diz que a lista voltou como o pacote a trouxe',
      /de volta como veio/.test(avisoReload.texto), false);
    return;
  }
  conf('e a tela diz que a lista voltou como o pacote a trouxe',
    /de volta como veio/.test(avisoReload.texto), true);
  conf('e oferece Desfazer, porque o que se perdeu foi trabalho dela',
    await pag.evaluate(() => !!document.querySelector('#bib-lp-aviso-acao')), true);

  /* O DESFAZER PASSA PELA PORTA ÚNICA, e é aqui que se mede a porta.
   *
   * O botão deste aviso e o "Devolver os N itens que eu tirei" da faixa do
   * contexto chamam o MESMO `devolverSelecaoTrocada`. A primeira escrita
   * apagava o aviso dentro do clique deste botão, então ele ficava certo e o
   * outro ficava errado: a lente cega achou a tela se redesenhando com o bloco
   * verde inteiro de pé, afirmando o material que acabara de ser desfeito.
   * Agora quem apaga é o `guardarCarrinho`, por onde toda mudança passa, e o
   * que este toque mede é a porta, não o botão. */
  await pag.evaluate(() => {
    window.__redesenhos = 0;
    const alvo = document.querySelector('#bib-corpo');
    if (window.__obs) window.__obs.disconnect();
    window.__obs = new MutationObserver(recs => {
      recs.forEach(r => { if (r.target === alvo && r.removedNodes.length > 1) window.__redesenhos++; });
    });
    window.__obs.observe(alvo, { childList: true });
    document.querySelector('#bib-lp-aviso-acao').click();
  });
  await pausa(600);
  const desenhosDesfazer = await pag.evaluate(() => window.__redesenhos);
  console.log('   desenhos no Desfazer do aviso: ' + desenhosDesfazer);
  conf('o Desfazer do aviso desenha a tela UMA vez', desenhosDesfazer, 1);
  const c9 = await carrinho(pag);
  const depoisDoDesfazer = await aviso(pag, '#bib-lp-aviso');
  console.log('   depois do Desfazer: ' + JSON.stringify(c9.itens) + ' | aviso: ' + JSON.stringify(depoisDoDesfazer.texto));
  conf('o Desfazer devolveu a ordem dela', c9.itens.join('|'), cPuro.itens.join('|'));
  if (V_AVISO_VELHO) {
    conf('VENENO (porta do Desfazer): o aviso sobreviveu ao próprio Desfazer e continua afirmando o material desfeito',
      /O material agora tem/.test(depoisDoDesfazer.texto), true);
    return;
  }
  conf('e o aviso morreu na porta única, junto com o material que ele afirmava',
    depoisDoDesfazer.texto, '');
  conf('e a caixa flutuante do rodapé continua sem abrir', depoisDoDesfazer.flutuando, false);

  // ================================================================
  /* UM DESENHO POR TOQUE, e não dois. A régua conta as vezes em que o corpo da
   * Biblioteca é esvaziado (o `innerHTML = ''` de cada redesenho), medindo o
   * DOM e não o código. O alvo onde ela TEM de contar é o próprio toque: se ela
   * marcasse zero, não estaria medindo nada. */
  /* O ARRANJO, ESCRITO ANTES DO CÓDIGO, E A AFIRMAÇÃO AO LADO DELE.
   *
   *   Arranjo:   três caminhos que mudam o carrinho com a tela da lista pronta
   *              à vista: o toque na seta, o toque na linha que abre a tela, e
   *              o toque no Desfazer do aviso.
   *   Afirmação: cada um desses três desenha a tela UMA vez.
   *
   * A ESCRITA ANTERIOR MEDIA SÓ A SETA e a afirmação dizia "um desenho por
   * toque", no geral. Os outros dois caminhos desenhavam DUAS vezes e ficavam
   * verdes, e foi uma lente cega que contou. A afirmação agora nomeia os três
   * caminhos que ela mede, e não "toque" no abstrato.
   *
   * E o que a régua conta, dito com precisão: quantas vezes o `#bib-corpo` é
   * esvaziado de uma vez só. Não é "desenho" no abstrato: é a limpeza em bloco
   * que todo redesenho desta tela faz. */
  secao('5c. Um desenho por toque de seta, de linha e de Desfazer');
  await pag.evaluate(() => {
    window.__redesenhos = 0;
    const alvo = document.querySelector('#bib-corpo');
    if (window.__obs) window.__obs.disconnect();
    window.__obs = new MutationObserver(recs => {
      recs.forEach(r => { if (r.target === alvo && r.removedNodes.length > 1) window.__redesenhos++; });
    });
    window.__obs.observe(alvo, { childList: true });
  });
  const idsAgora = (await carrinho(pag)).itens;
  conf('tocou em descer no primeiro cartão', await tocarSeta(pag, idsAgora[0], 'descer'), true);
  await pausa(600);
  const desenhos = await pag.evaluate(() => window.__redesenhos);
  console.log('   desenhos do corpo por toque de seta: ' + desenhos);
  conf('a régua contou desenho, senão não estaria medindo nada', desenhos > 0, true);
  if (V_REDESENHO) {
    conf('VENENO: com o redesenho de volta no foco, o toque desenha a tela DUAS vezes', desenhos, 2);
    return;
  }
  conf('um toque de seta desenha a tela UMA vez', desenhos, 1);

  /* OS OUTROS DOIS CAMINHOS, que a escrita anterior não media e que desenhavam
   * duas vezes: voltar ao módulo e tocar na linha, e o Desfazer do aviso. */
  await pag.evaluate(() => { window.__redesenhos = 0; });
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(500);
  await pag.evaluate(() => { window.__redesenhos = 0; });
  conf('tocou na linha da lista pronta', await tocarLinha(pag, 'Lista com 1 desafio'), true);
  await pausa(700);
  const desenhosLinha = await pag.evaluate(() => window.__redesenhos);
  console.log('   desenhos ao abrir a tela pela linha: ' + desenhosLinha);
  conf('abrir a tela pela linha desenha UMA vez', desenhosLinha, 1);
  /* O terceiro caminho, o Desfazer do aviso, é medido na 5b, que é onde o aviso
   * nasce com Desfazer. Aqui a linha apenas ABRE a tela que ela já estava
   * mexendo, e por isso não cria aviso nenhum. */

  /* E A TELA ESCONDIDA NÃO SE DESENHA. O guarda antigo era a existência do
   * `#bib-lp-grade`, que continua no DOM depois de ela trocar de aba; o novo é
   * a grade estar à VISTA. Aqui se mede a diferença entre os dois guardas no
   * DOM real: com a aba trocada, a grade existe e não é exibida. O caminho
   * completo que motivou o conserto (o desmarcar automático rodando no meio da
   * geração do PDF) não é dirigido aqui, e isto está escrito de propósito. */
  const visivel = await pag.evaluate(() => {
    const g = document.querySelector('#bib-lp-grade');
    return { existe: !!g, aVista: !!(g && g.offsetParent) };
  });
  conf('com a aba da Biblioteca aberta, a grade existe e está à vista',
    JSON.stringify(visivel), JSON.stringify({ existe: true, aVista: true }));
  await H.irParaAba(pag, 'ajustes');
  await pausa(400);
  const escondida = await pag.evaluate(() => {
    const g = document.querySelector('#bib-lp-grade');
    return { existe: !!g, aVista: !!(g && g.offsetParent) };
  });
  console.log('   com a aba trocada: ' + JSON.stringify(escondida));
  conf('com outra aba aberta, a grade CONTINUA no DOM, que é o que enganava o guarda antigo',
    escondida.existe, true);
  conf('e NÃO está à vista, que é o que o guarda novo enxerga', escondida.aVista, false);
  await H.irParaAba(pag, 'biblioteca');
  await pausa(400);

  // ================================================================
  /* SEM EXERCÍCIO DA LISTA NÃO HÁ ESTIMATIVA. A tela dizia "0 exercícios · um
   * pouco menos de meia aula · ≈ 0 min (estimativa)", três afirmações falsas de
   * uma vez. Achado pela primeira lente cega do PR #57. */
  /* O ARRANJO, ESCRITO ANTES DO CÓDIGO, E A AFIRMAÇÃO AO LADO DELE.
   *
   *   Arranjo:   a lista fica com UM exercício, dos cinco, e depois com zero, e
   *              depois só com um que ela acrescentou de fora.
   *   Afirmação: nenhum desses três estados faz a tela prometer meia aula, e o
   *              número que ela mostra nunca desmente a frase ao lado.
   *
   * A ESCRITA ANTERIOR SÓ TINHA OS DOIS ÚLTIMOS, que são os dois em que a conta
   * dá zero, e a guarda do código era `daLista.length`, que é a mesma fronteira.
   * Prova e conserto olhavam o mesmo lugar, e o lugar de fora ficou sem
   * ninguém: com um exercício sobrando a tela dizia "1 exercício · um pouco
   * menos de meia aula" com "≈ 5 min (estimativa)" embaixo, duas linhas se
   * desmentindo. A lente cega chegou nele pelo caminho normal desta tela, que é
   * ela tirar exercício. O estado de UM vem primeiro agora, de propósito. */
  secao('5d. A tela não promete aula fora da aula');
  const restaram = (await carrinho(pag)).itens.slice();
  for (var q = 1; q < restaram.length; q++) {
    await desmarcar(pag, restaram[q]);
    await pausa(250);
  }
  const soUm = await pag.evaluate(() => ({
    cabeca: (document.querySelector('#bib-lp-cabeca') || {}).innerText || '(não achei)',
    cartoes: document.querySelectorAll('#bib-lp-grade .bib-celula').length
  }));
  console.log('   com um exercício só: ' + JSON.stringify(soUm));
  conf('sobrou um cartão só', soUm.cartoes, 1);
  conf('a tela conta o exercício', /^1 exercício/.test(soUm.cabeca), true);
  conf('e mostra o minuto dele', /≈ \d+ min \(estimativa\)/.test(soUm.cabeca), true);
  if (V_UMA_AULA) {
    conf('VENENO: sem piso, a tela promete uma aula para um exercício de poucos minutos',
      /uma aula/.test(soUm.cabeca), true);
  } else {
    conf('e NÃO promete aula nenhuma, porque poucos minutos não são uma aula',
      /uma aula/.test(soUm.cabeca), false);
  }

  secao('5e. A tela vazia não estima nada');
  await pag.evaluate(() => { document.querySelector('#bib-carrinho-limpar').click(); });
  await pausa(600);
  const vazia = await pag.evaluate(() => ({
    cabeca: (document.querySelector('#bib-lp-cabeca') || {}).innerText || '(não achei)',
    vazia: !!document.querySelector('#bib-lp-vazia'),
    cartoes: document.querySelectorAll('#bib-lp-grade .bib-celula').length
  }));
  console.log('   lista vazia: ' + JSON.stringify(vazia));
  conf('a tela se redesenhou e não sobrou cartão nenhum', vazia.cartoes, 0);
  conf('e o cabeçalho não diz aula nenhuma', /uma aula/.test(vazia.cabeca), false);
  conf('e não estima zero minuto', /≈ 0 min/.test(vazia.cabeca), false);
  conf('e diz o que há: nenhum exercício no material',
    /^Nenhum exercício no material/.test(vazia.cabeca), true);
  conf('e, como foi ELA que tirou tudo, a tela diz isso', vazia.vazia, true);
  conf('e diz o que ela pode fazer ali mesmo, com o botão à mão',
    /Para começar de novo, toque em Usar esta lista\./.test(vazia.cabeca) &&
      await pag.evaluate(() => !!document.querySelector('#bib-lp-usar')), true);
  conf('e não fala de anexo nenhum', /anexada/.test(vazia.cabeca), false);
  conf('e NÃO afirma uma ordem de um material que não existe',
    await pag.evaluate(() => !!document.querySelector('#bib-lp-mudou')), false);

  /* E COM SÓ O QUE ELA ACRESCENTOU, a tela também não estima: o minuto vem da
   * lista pronta, e nenhum exercício dela ficou aqui. Era o caso de "7
   * exercícios · um pouco menos de meia aula · ≈ 0 min". */
  conf('abriu a outra lista do módulo', await pag.evaluate(() => {
    const b = document.querySelector('#bib-lp-acrescentar [data-acrescentar]');
    if (!b) return false; b.click(); return true;
  }), true);
  await pausa(500);
  conf('marcou um exercício qualquer', await pag.evaluate(() => {
    const c = document.querySelector('#bib-corpo input[data-carrinho="itens"]');
    if (!c) return false; c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); return true;
  }), true);
  await pausa(400);
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(500);
  const soDeFora = await pag.evaluate(() => (document.querySelector('#bib-lp-cabeca') || {}).innerText || '(não achei)');
  console.log('   só com o acrescentado: ' + JSON.stringify(soDeFora));
  conf('a tela conta o exercício', /^1 exercício/.test(soDeFora), true);
  conf('e não promete aula', /uma aula/.test(soDeFora), false);
  conf('e diz por que não há estimativa', /Sem estimativa de tempo/.test(soDeFora), true);

  // ================================================================
  /* MEIA HORA NÃO É UMA AULA. Desde 24/09 a lista pronta é de uma aula
   * inteira, e a de meia hora é a que existia antes (e a que ela fica tendo se
   * tirar metade). A tela não pode chamá-la de "um pouco menos de uma aula".
   *
   *   Arranjo:   a lista do nível 2 carregada de novo, com os dois últimos
   *              exercícios tirados pela caixa: sobram três, 31,5 minutos.
   *   Afirmação: com meia hora na tela, o cabeçalho diz o número e não diz
   *              aula nenhuma; e a MESMA lista inteira, de 58,4, diz "cerca de
   *              uma aula" (conferido no começo, seção 1a).
   *
   * O minuto é conferido junto, porque é ele que prova que o arranjo é o de
   * meia hora e não um vizinho: sem ele, uma tela que não escrevesse frase
   * nenhuma em estado nenhum passaria aqui. */
  secao('5f. Meia hora não é uma aula');
  await pag.evaluate(() => { const b = document.querySelector('#bib-carrinho-limpar'); if (b) b.click(); });
  await pausa(500);
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(400);
  if (!(await usarLista(pag, 'Lista com 1 desafio'))) {
    await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
    await pausa(400);
    await tocarLinha(pag, MOD_TITULO);
    await pausa(400);
    conf('tocou na lista do nível 2 de novo', await usarLista(pag, 'Lista com 1 desafio'), true);
  }
  await pausa(500);
  conf('a lista do nível 2 voltou inteira, na ordem dela', (await carrinho(pag)).itens.join('|'), IDS2.join('|'));
  await desmarcar(pag, IDS2[4]);
  await pausa(250);
  await desmarcar(pag, IDS2[3]);
  await pausa(400);
  const meiaHora = await pag.evaluate(() => (document.querySelector('#bib-lp-cabeca') || {}).innerText || '(não achei)');
  console.log('   com meia hora: ' + JSON.stringify(meiaHora));
  conf('sobraram três exercícios', /^3 exercícios/.test(meiaHora), true);
  conf('e o minuto é o de meia hora (31,5 vira 32)', /≈ 32 min \(estimativa\)/.test(meiaHora), true);
  if (V_UMA_AULA) {
    conf('VENENO: sem piso, a tela chama meia hora de uma aula', /uma aula/.test(meiaHora), true);
    return;
  }
  conf('e NÃO chama meia hora de aula nenhuma', /uma aula/.test(meiaHora), false);
  await pag.evaluate(() => { const b = document.querySelector('#bib-carrinho-limpar'); if (b) b.click(); });
  await pausa(500);

  // ================================================================
  /* DEPOIS DE ANEXAR, QUEM ESVAZIOU FOI O APLICATIVO.
   *
   *   Arranjo:   a lista do nível 2 carregada inteira, "Gerar e anexar" na aula
   *              de hoje do primeiro aluno, pelo caminho da tela (botão Gerar
   *              material, a linha da aula, o botão Gerar e anexar), e a tela
   *              da lista pronta olhada depois que o anexo ficou gravado.
   *   Afirmação: a tela não diz "Você tirou tudo desta lista", porque ela não
   *              tirou nada, e diz para onde a lista foi. A seção 5e mediu o
   *              outro lado: quando é ela que esvazia, a frase continua.
   *
   * O anexo gravado é conferido junto, senão uma tela que nunca anexasse e
   * nunca mostrasse a frase passaria aqui. */
  secao('5g. Depois de anexar, a tela diz para onde a lista foi');
  // aluna FICTÍCIA: os nomes da carga inicial do aplicativo são de alunos de verdade
  const nomeAluno = await pag.evaluate(async h => {
    const d = await Store.carregar();
    d.alunos.push(Object.assign({}, d.alunos[0], { id: 'aluna-prova-b10', nome: 'Aluna de Prova' }));
    d.aulas.push({ id: 'aula-b10-anexa', alunoId: 'aluna-prova-b10', serieId: null, destacada: false, data: h,
      hora: '16:00', duracaoMin: 60, status: 'agendada', cobravel: true, notaTexto: '', notaPrivada: '',
      temNota: false, anexos: [] });
    await Store.salvar(d);
    return 'Aluna de Prova';
  }, (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })());
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'biblioteca');
  await pausa(400);
  conf('abriu o módulo das equações de novo', await tocarLinha(pag, MOD_TITULO), true);
  await pausa(400);
  conf('tocou na lista do nível 2 e usou', await usarLista(pag, 'Lista com 1 desafio'), true);
  await pausa(500);
  conf('a lista está no material, inteira', (await carrinho(pag)).itens.join('|'), IDS2.join('|'));
  await pag.evaluate(() => document.querySelector('#bib-carrinho-gerar').click());
  await pausa(600);
  /* A JANELA DE GERAR, vinda de lista pronta: não diz "na ordem em que você
   * marcou" (ela não marcou, carregou) nem conta "0 páginas de teoria". */
  const resumoGerar = await pag.evaluate(() => (document.querySelector('#bib-gerar-resumo') || {}).textContent || '');
  console.log('   resumo da janela de gerar: ' + JSON.stringify(resumoGerar));
  conf('a janela de gerar diz a ordem da lista', resumoGerar, '5 exercícios, na ordem da lista.');
  conf('escolheu a aula de hoje na janela de gerar', await pag.evaluate(() => {
    const b = document.querySelector('#bib-gerar-aulas [data-aula="aula-b10-anexa"]');
    if (!b) return false; b.click(); return true;
  }), true);
  await pausa(300);
  await pag.evaluate(() => document.querySelector('#bib-gerar-anexar').click());
  const anexou = await esperar('o anexo gravado na aula', () => pag.evaluate(() =>
    Store.carregar().then(d => (d.aulas.find(a => a.id === 'aula-b10-anexa').anexos || []).length)), v => v > 0, 60000);
  conf('o material ficou anexado na aula', anexou.ok, true);
  await pausa(800);
  /* O GABARITO EM ARQUIVO SEPARADO: dois anexos, e o da lista sem gabarito
   * dentro, para ela mandar ao aluno sem as respostas. */
  const anexos = await pag.evaluate(() => Store.carregar().then(d => (d.aulas.find(a => a.id === 'aula-b10-anexa').anexos || [])
    .map(a => ({ nome: a.nome, parte: a.parte || null }))));
  console.log('   anexos da aula: ' + JSON.stringify(anexos));
  if (V_GABARITO_JUNTO) {
    conf('VENENO ENXERGADO: um anexo só, com o gabarito dentro', anexos.length, 1);
    return;
  }
  conf('dois anexos na aula: a lista e o gabarito', anexos.map(a => a.parte).join(','), 'lista,gabarito');
  conf('com nomes que dizem o que são', /_lista\.pdf$/.test((anexos[0] || {}).nome || '') && /_gabarito\.pdf$/.test((anexos[1] || {}).nome || ''), true);
  const avisoRodape = await pag.evaluate(() => {
    const b = document.querySelector('#aviso-acao2');
    return { texto: (document.querySelector('#aviso-texto') || {}).textContent || '',
      botao2: b && b.style.display !== 'none' ? b.textContent : null };
  });
  console.log('   aviso do rodapé: ' + JSON.stringify(avisoRodape));
  conf('o aviso do rodapé oferece Abrir a aula', avisoRodape.botao2, 'Abrir a aula');
  const depoisDoAnexo = await pag.evaluate(() => ({
    cabeca: (document.querySelector('#bib-lp-cabeca') || {}).innerText || '(não achei)',
    vazia: !!document.querySelector('#bib-lp-vazia'),
    titulo: (document.querySelector('#bib-corpo .bib-titulo') || {}).textContent || ''
  }));
  console.log('   depois de anexar: ' + JSON.stringify(depoisDoAnexo));
  conf('a tela da lista continua à vista', depoisDoAnexo.titulo, 'Lista com 1 desafio');
  conf('e o material ficou vazio', /^Nenhum exercício no material/.test(depoisDoAnexo.cabeca), true);
  if (V_ANEXADA) {
    conf('VENENO: depois de anexar, a tela diz que foi ela que tirou tudo', depoisDoAnexo.vazia, true);
    return;
  }
  conf('e NÃO diz que ela tirou tudo, porque quem esvaziou foi o aplicativo', depoisDoAnexo.vazia, false);
  conf('e diz para onde a lista foi, com o aluno',
    depoisDoAnexo.cabeca.indexOf('Esta lista foi anexada na aula de ' + nomeAluno + ' (') >= 0, true);
  conf('e o que fazer para usar com outro aluno', /Para usar com outro aluno, toque em Usar esta lista\./.test(depoisDoAnexo.cabeca), true);
  conf('e a tela oferece abrir a aula', await pag.evaluate(() => !!document.querySelector('#bib-lp-abrir-aula')), true);
  await pag.evaluate(() => document.querySelector('#bib-lp-abrir-aula').click());
  await pausa(700);
  conf('Abrir a aula abre a aula onde o material foi', await pag.evaluate(() => {
    const m = document.querySelector('#modal-aula');
    return !!(m && m.classList.contains('aberto'));
  }), true);
  await pag.evaluate(() => document.querySelectorAll('.modal.aberto [data-fechar]').forEach(b => b.click()));
  await pausa(300);

  // ================================================================
  /* O NOME DO ANEXO NÃO ENCOSTA NO ABRIR.
   *
   *   Arranjo:   a aula da seção 5g aberta pela agenda, com o PDF que acabou de
   *              ser anexado, numa janela de 800 e depois de 1280 de largura.
   *   Afirmação: o texto do nome termina antes do botão Abrir começar, nas
   *              duas larguras.
   *
   * A régua mede o TEXTO, com um Range sobre o nó, e não a caixa: a caixa do
   * nome acaba onde o flex manda, e o texto sem ponto de quebra passa por cima
   * do botão sem a caixa mudar um pixel. E o nome inteiro tem de estar lá: um
   * conserto que cortasse o nome também passaria na régua da distância. */
  secao('5h. O nome do arquivo anexado não encosta no Abrir');
  const hojeAnexo = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();
  const medidasNome = [];
  for (const largura of [800, 1280]) {
    await pag.setViewport({ width: largura, height: 1000, hasTouch: true });
    await pausa(300);
    await pag.evaluate(() => document.querySelectorAll('.modal.aberto [data-fechar]').forEach(b => b.click()));
    await pausa(300);
    await H.irParaAba(pag, 'agenda');
    await pausa(500);
    await pag.evaluate(d => {
      const p = Array.from(document.querySelectorAll('[data-dia="' + d + '"] .pilula')).find(x => /16:00/.test(x.textContent)) ||
        document.querySelector('[data-dia="' + d + '"] .pilula');
      if (p) p.click();
    }, hojeAnexo);
    await pausa(700);
    const m = await pag.evaluate(() => {
      const linha = document.querySelector('#lista-anexos .item-lista');
      if (!linha) return null;
      const nome = linha.querySelector('.nome');
      const abrir = Array.from(linha.querySelectorAll('button')).find(b => /Abrir/.test(b.textContent));
      linha.scrollIntoView({ block: 'center' });
      const r = document.createRange(); r.selectNodeContents(nome);
      const rects = Array.from(r.getClientRects());
      return { texto: nome.textContent, fimDoTexto: Math.round(Math.max.apply(null, rects.map(x => x.right))),
        inicioDoAbrir: Math.round(abrir.getBoundingClientRect().left) };
    });
    console.log('   largura ' + largura + ': ' + JSON.stringify(m));
    medidasNome.push(m || {});
  }
  await pag.setViewport({ width: 1280, height: 1000, hasTouch: true });
  await pag.evaluate(() => document.querySelectorAll('.modal.aberto [data-fechar]').forEach(b => b.click()));
  await pausa(300);
  conf('a aula abriu com o anexo nas duas larguras', medidasNome.filter(m => m.texto).length, 2);
  conf('e o nome está inteiro nas duas', medidasNome.every(m => /_lista\.pdf$/.test(m.texto || '')), true);
  const encostam = medidasNome.filter(m => !(m.fimDoTexto <= m.inicioDoAbrir - 4)).length;
  if (V_NOME_ANEXO) {
    conf('VENENO: o nome passa por cima do Abrir em pelo menos uma largura', encostam > 0, true);
    return;
  }
  conf('o texto do nome termina antes do Abrir, com folga, nas duas larguras', encostam, 0);

  // ================================================================
  // ================================================================
  /* VER NÃO TROCA O MATERIAL: o bloqueante da lente do uso dela no PR #57.
   *
   *   Arranjo:   ela marca nove exercícios na lista cheia; toca numa lista
   *              pronta para ver, volta, toca na outra, volta. Depois usa uma
   *              delas, aceita trocar, FECHA E REABRE o aplicativo, e toca em
   *              "Recuperar o que estava marcado".
   *   Afirmação: ver não muda nada (os nove continuam, na ordem); usar pergunta
   *              com o número certo; e o que estava marcado volta inteiro e na
   *              ordem depois do reinício.
   *
   * O antigo trocava tudo no primeiro toque de ver, e o Desfazer sumia no
   * passo seguinte. */
  if (!(await cenarioVerNaoTroca(pag))) return;

  secao('6. Tapar na folha');
  const ferramentas = await pag.evaluate(() => {
    const ed = window.Draw && window.Draw.Editor;
    return { existe: !!ed, camadas: (window.Draw && window.Draw.ORDEM_CAMADAS) || null };
  });
  conf('o draw.js exporta a ordem das camadas', (ferramentas.camadas || []).join(','), 'imagem,tapar,texto,traco');
  const tapar = await pag.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 300; c.height = 400;
    document.body.appendChild(c);
    const ed = new window.Draw.Editor(c, { nota: window.Draw.notaVazia('branco') });
    ed.ferramenta = 'tapar';
    const feito = ed.adicionarTapar(10, 20, 100, 30);
    const seco = ed.adicionarTapar(10, 20, 2, 2);
    const itens = ed.pagina().itens;
    ed.destruir && ed.destruir();
    c.remove();
    return { feito: !!feito, seco: seco === null, n: itens.length, item: itens[0] || null };
  });
  conf('a ferramenta de tapar cria um retângulo', tapar.feito, true);

  /* O RETÂNGULO NÃO PASSA DA FOLHA, e a palma da mão não o cria.
   *
   *   Arranjo:   um arrasto de tapar que começa FORA da folha (acima e à
   *              esquerda) e termina dentro; e um arrasto do bico interrompido
   *              por um `pointerup` de DEDO.
   *   Afirmação: o item gravado fica dentro da folha nos quatro lados, e o
   *              toque de dedo não cria retângulo nenhum.
   *
   * O canvas desenha dentro de um recorte da folha e o PDF não recorta: sem
   * isto a tela mostrava o branco aparado e o papel o imprimia inteiro, por
   * cima do cabeçalho. E o `_cancelarTraco` do dedo não limpava o `tapando`,
   * então a palma apoiada fechava o retângulo do bico. */
  const bordas = await pag.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 300; c.height = 400;
    document.body.appendChild(c);
    const ed = new window.Draw.Editor(c, { nota: window.Draw.notaVazia('branco') });
    const fora = ed.adicionarTapar(-200, -150, 500, 400);
    const alem = ed.adicionarTapar(900, 1200, 600, 600);
    const itens = ed.pagina().itens.slice();
    ed.destruir && ed.destruir();
    c.remove();
    return {
      fora: fora && [fora.x, fora.y, fora.w, fora.h],
      alem: alem && [alem.x, alem.y, alem.w, alem.h],
      n: itens.length,
      folha: [window.Draw.FOLHA_L || 1000, window.Draw.FOLHA_A || 1343]
    };
  });
  console.log('   retângulos nas bordas: ' + JSON.stringify(bordas));
  conf('o retângulo que começa fora da folha é aparado no canto', bordas.fora && bordas.fora.slice(0, 2).join(','), '0,0');
  conf('e não passa da folha pela direita nem por baixo',
    bordas.alem && (bordas.alem[0] + bordas.alem[2] <= 1000) && (bordas.alem[1] + bordas.alem[3] <= 1343), true);

  /* OS TRÊS CAMINHOS DO RETÂNGULO, DIRIGIDOS POR EVENTO DE PONTEIRO.
   *
   *   Arranjo:   num canvas com escala 1 e sem deslocamento, o bico CRIA um
   *              retângulo, depois o ARRASTA para muito além da borda de cima
   *              e da esquerda, depois puxa a ALÇA para muito além da borda de
   *              baixo e da direita. Tudo por `pointerdown`, `pointermove` e
   *              `pointerup`, que é o caminho que a mão dela percorre.
   *   Afirmação: nos três momentos o item gravado fica dentro da folha nos
   *              quatro lados.
   *
   * A ESCRITA ANTERIOR CHAMAVA `adicionarTapar` PELA API, duas vezes, e nunca
   * movia nem redimensionava nada, enquanto a afirmação dizia "fica dentro da
   * folha nos quatro lados". O recorte existia só na criação, e bastava
   * selecionar o branco e arrastá-lo para o defeito voltar inteiro: na tela
   * aparado, no papel por cima do cabeçalho. Duas lentes cegas acharam isso
   * sozinhas, cada uma por seu lado, e a prova de então não podia pegar porque
   * o arranjo dela não tinha mover. */
  const tresCaminhos = await pag.evaluate(() => {
    const L = window.Draw.FOLHA_L, A = window.Draw.FOLHA_A;
    const c = document.createElement('canvas');
    c.width = 900; c.height = 900;
    document.body.appendChild(c);
    const ed = new window.Draw.Editor(c, { nota: window.Draw.notaVazia('branco') });
    ed.escala = 1; ed.deslocX = 0; ed.deslocY = 0;
    function ev(tipo, x, y, id) {
      const r = c.getBoundingClientRect();
      c.dispatchEvent(new PointerEvent(tipo, { bubbles: true, cancelable: true, pointerId: id || 1,
        pointerType: 'pen', clientX: r.left + x, clientY: r.top + y,
        buttons: tipo === 'pointerup' ? 0 : 1 }));
    }
    function oTapar() { return ed.pagina().itens.filter(i => i.t === 'tapar')[0] || null; }
    function dentro(it) {
      return !!it && it.x >= 0 && it.y >= 0 && it.x + it.w <= L && it.y + it.h <= A;
    }
    // 1. criar, comecando FORA da folha (acima e a esquerda)
    ed.ferramenta = 'tapar';
    ev('pointerdown', -150, -120);
    ev('pointermove', 320, 260);
    ev('pointerup', 320, 260);
    // copia, e nao referencia: o item e mutado nos passos seguintes
    const aoCriar = Object.assign({}, oTapar());
    /* E ELE PRECISA SAIR DO CANTO ANTES DE SER ARRASTADO, senao "moveu" nao
     * acontece: criado a partir de fora da folha, ele nasce encostado em 0,0, e
     * arrastar para cima e para a esquerda dali nao muda nada. O arranjo tem de
     * poder falhar. */
    ed.ferramenta = 'selecao';
    ev('pointerdown', 100, 100, 9);
    ev('pointermove', 400, 400, 9);
    ev('pointerup', 400, 400, 9);
    const noMeio = Object.assign({}, oTapar());
    // 2. mover para muito alem da borda de cima e da esquerda
    const meio = { x: noMeio.x + noMeio.w / 2, y: noMeio.y + noMeio.h / 2 };
    ev('pointerdown', meio.x, meio.y, 2);
    ev('pointermove', meio.x - 800, meio.y - 800, 2);
    ev('pointerup', meio.x - 800, meio.y - 800, 2);
    const aoMover = Object.assign({}, oTapar());
    // 3. puxar a alca do canto para muito alem da borda de baixo e da direita
    const it = oTapar();
    ev('pointerdown', it.x + it.w, it.y + it.h, 3);
    ev('pointermove', it.x + it.w + 4000, it.y + it.h + 4000, 3);
    ev('pointerup', it.x + it.w + 4000, it.y + it.h + 4000, 3);
    const aoEsticar = Object.assign({}, oTapar());
    ed.destruir && ed.destruir();
    c.remove();
    return {
      folha: [L, A],
      criar: [aoCriar.x, aoCriar.y, aoCriar.w, aoCriar.h], criarDentro: dentro(aoCriar),
      mover: [aoMover.x, aoMover.y, aoMover.w, aoMover.h], moverDentro: dentro(aoMover),
      esticar: [aoEsticar.x, aoEsticar.y, aoEsticar.w, aoEsticar.h], esticarDentro: dentro(aoEsticar),
      levouParaOMeio: noMeio.x > 0 && noMeio.y > 0,
      moveuMesmo: aoMover.x !== noMeio.x || aoMover.y !== noMeio.y,
      esticouMesmo: aoEsticar.w !== aoMover.w || aoEsticar.h !== aoMover.h,
      guardouTamanhoAoMover: aoMover.w === noMeio.w && aoMover.h === noMeio.h
    };
  });
  console.log('   os tres caminhos: ' + JSON.stringify(tresCaminhos));
  conf('o retangulo foi levado para o meio da folha antes, senao nao haveria de onde sair',
    tresCaminhos.levouParaOMeio, true);
  conf('o arrasto moveu mesmo o retangulo, senao "dentro" passaria por nao ter acontecido nada',
    tresCaminhos.moveuMesmo, true);
  conf('e a alca esticou mesmo, pelo mesmo motivo', tresCaminhos.esticouMesmo, true);
  if (V_APARA) {
    conf('VENENO: sem aparar no mover, o retangulo sai da folha ao ser arrastado',
      tresCaminhos.moverDentro, false);
    return;
  }
  conf('CRIAR: o retangulo fica dentro da folha nos quatro lados', tresCaminhos.criarDentro, true);
  conf('MOVER: idem, e o tamanho que ela deu nao encolhe', tresCaminhos.moverDentro, true);
  conf('e mover PRENDE na borda em vez de encolher', tresCaminhos.guardouTamanhoAoMover, true);
  conf('REDIMENSIONAR: idem', tresCaminhos.esticarDentro, true);

  const palma = await pag.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 400; c.height = 500;
    document.body.appendChild(c);
    const ed = new window.Draw.Editor(c, { nota: window.Draw.notaVazia('branco') });
    ed.ferramenta = 'tapar';
    function ev(tipo, tipoPonteiro, id, x, y) {
      const r = c.getBoundingClientRect();
      c.dispatchEvent(new PointerEvent(tipo, { bubbles: true, cancelable: true, pointerId: id,
        pointerType: tipoPonteiro, clientX: r.left + x, clientY: r.top + y,
        buttons: tipo === 'pointerup' ? 0 : 1 }));
    }
    ev('pointerdown', 'pen', 1, 80, 80);
    ev('pointermove', 'pen', 1, 260, 300);
    ev('pointerdown', 'touch', 9, 20, 20);     // a palma encosta
    ev('pointerup', 'touch', 9, 20, 20);       // e levanta antes do bico
    const depoisDaPalma = ed.pagina().itens.filter(i => i.t === 'tapar').length;
    ev('pointerup', 'pen', 1, 260, 300);
    const depoisDoBico = ed.pagina().itens.filter(i => i.t === 'tapar').length;
    ed.destruir && ed.destruir();
    c.remove();
    return { depoisDaPalma, depoisDoBico };
  });
  console.log('   palma: ' + JSON.stringify(palma));
  if (V_PALMA) {
    conf('VENENO: sem cancelar o tapar, a palma da mão fecha o retângulo do bico',
      palma.depoisDaPalma, 1);
    return;
  }
  conf('a palma da mão NÃO cria retângulo nenhum', palma.depoisDaPalma, 0);

  /* O CONTORNO FINO, E ELE EXISTE PORQUE O BRANCO ERA INVISÍVEL.
   *
   *   Arranjo:   uma folha de fundo branco, sem nada, desenhada no canvas duas
   *              vezes, uma sem e outra com um retângulo de tapar em área
   *              vazia. A leitura é da BANDA DO PERÍMETRO do retângulo.
   *   Afirmação: naquela banda o retângulo pinta pixels que se distinguem do
   *              papel, e numa banda longe dele não pinta nenhum.
   *
   * Medido antes do conserto: numa área vazia da folha branca o retângulo
   * pintava ZERO pixels distinguíveis, porque o fundo já é branco puro. Numa
   * ferramenta nova isso é armadilha de primeiro uso: ela arrasta para ver o
   * que a ferramenta faz, nada acontece, e conclui que está quebrada.
   *
   * A afirmação NÃO diz "ela acha e tira": isso é outra cadeia, e já é medida
   * pela interface na seção 6b, com a lixeira. A primeira escrita desta prova
   * prometia a cadeia inteira e lia o canvas todo, aceitando diferença de um
   * pixel em qualquer canto; o conferidor cego de arranjo reprovou antes de o
   * código existir. */
  const contorno = await pag.evaluate(() => {
    const RX = 20, RY = 20, RW = 300, RH = 120, BANDA = 3;
    function pinta(comTapar) {
      const c = document.createElement('canvas');
      c.width = 400; c.height = 300;
      document.body.appendChild(c);
      const ed = new window.Draw.Editor(c, { nota: window.Draw.notaVazia('branco') });
      ed.escala = 1; ed.deslocX = 0; ed.deslocY = 0;
      if (comTapar) ed.adicionarTapar(RX, RY, RW, RH);
      ed.desenhar();
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      ed.destruir && ed.destruir();
      c.remove();
      return { d: d, w: c.width };
    }
    function difNaBanda(a, b, bx, by, bw, bh) {
      let n = 0;
      for (let y = by - BANDA; y < by + bh + BANDA; y++) {
        for (let x = bx - BANDA; x < bx + bw + BANDA; x++) {
          if (x < 0 || y < 0 || x >= a.w || y >= 300) continue;
          const dentro = x > bx + BANDA && x < bx + bw - BANDA && y > by + BANDA && y < by + bh - BANDA;
          if (dentro) continue;               // só a moldura, não o miolo
          const i = (y * a.w + x) * 4;
          if (a.d[i] !== b.d[i] || a.d[i + 1] !== b.d[i + 1] || a.d[i + 2] !== b.d[i + 2]) n++;
        }
      }
      return n;
    }
    const sem = pinta(false), com = pinta(true);
    return {
      naBanda: difNaBanda(sem, com, RX, RY, RW, RH),
      longe: difNaBanda(sem, com, 40, 220, 300, 60),
      perimetro: 2 * (RW + RH)
    };
  });
  console.log('   contorno na banda do perímetro: ' + JSON.stringify(contorno));
  if (V_CONTORNO) {
    conf('VENENO: sem o traço, a banda do perímetro não muda um pixel sequer', contorno.naBanda, 0);
    return;
  }
  conf('o contorno pinta a banda do perímetro, e pinta à altura dele',
    contorno.naBanda > contorno.perimetro / 2, true);
  conf('ALVO: numa banda longe do retângulo não muda nada, senão a régua acusaria em qualquer lugar',
    contorno.longe, 0);
  conf('e o bico, levantado depois dela, também não cria, porque o arrasto foi cancelado',
    palma.depoisDoBico, 0);
  conf('e um toque seco não vira retângulo', tapar.seco, true);
  conf('o retângulo entra no vetor da folha', tapar.n, 1);
  conf('com o tipo tapar e as quatro medidas',
    tapar.item && [tapar.item.t, tapar.item.x, tapar.item.y, tapar.item.w, tapar.item.h].join(','), 'tapar,10,20,100,30');

  /* A ORDEM DAS CAMADAS, MEDIDA NO PIXEL E NÃO NA CONSTANTE.
   *
   * Um texto preto e, DEPOIS dele no vetor, um retângulo que tapa em cima. Pela
   * ordem das camadas o texto é desenhado depois do tapar, então o pixel do
   * texto continua escuro; pela ordem do vetor o tapar vem por último e o pixel
   * fica branco. É a diferença entre a folha na tela e a folha impressa, e
   * conferir só o Draw.ORDEM_CAMADAS não mediria nada, porque a constante pode
   * estar certa e o laço que a usa, errado. */
  const pixel = await pag.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 400; c.height = 300;
    document.body.appendChild(c);
    const nota = window.Draw.notaVazia('branco');
    const ed = new window.Draw.Editor(c, { nota: nota });
    ed.escala = 1; ed.deslocX = 0; ed.deslocY = 0;
    ed.cor = '#1A1C1F';
    ed.adicionarTexto('AAAAAAAA', 40, 40, 60);
    ed.adicionarTapar(20, 20, 400, 140);
    ed.desenhar();
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let escuros = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] < 120 && d[i + 1] < 120 && d[i + 2] < 120) escuros++;
    ed.destruir && ed.destruir();
    c.remove();
    return escuros;
  });
  console.log('   pixels escuros do texto sob o retângulo: ' + pixel);
  if (V_CAMADAS) {
    conf('VENENO: sem as camadas, o retângulo tapa o que ela escreveu e o texto some', pixel, 0);
    return;
  }
  conf('o texto continua visível por cima do retângulo, como no PDF', pixel > 0, true);

  /* A BORRACHA CONTINUA ALCANÇANDO O TRAÇO depois da mudança de ordem.
   *
   * Na ORDEM_CAMADAS o traço fica POR CIMA do tapar, e isso é decisão: tapar
   * cobre o enunciado, que é imagem, e não cobre o risco que ela mesma fez. A
   * saída para o risco indesejado continua sendo a borracha, e ordem nova com
   * seleção e remoção é exatamente onde algo quebra calado. Então mede-se, em
   * vez de deduzir da leitura.
   *
   * São quatro medidas, e as duas últimas são o que impede a primeira de ser
   * vácuo: a borracha tem de TIRAR o traço, tem de NÃO tirar o tapar, o texto
   * nem a imagem (o `apagarEm` só remove `t === 'traco'`, e isso é o que faz a
   * imagem nunca ser danificada), e a seleção tem de conseguir tirar o tapar,
   * que é a única forma de desfazer um branco posto no lugar errado. */
  const borracha = await pag.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 400; c.height = 300;
    document.body.appendChild(c);
    const ed = new window.Draw.Editor(c, { nota: window.Draw.notaVazia('branco') });
    ed.adicionarTexto('texto', 200, 200, 20);
    ed.adicionarTapar(40, 40, 200, 100);
    ed.pagina().itens.push({ t: 'imagem', ref: 'x', x: 40, y: 40, w: 200, h: 100 });
    ed.pagina().itens.push({ t: 'traco', cor: '#1A1C1F', pontos: [[100, 80, 4], [140, 90, 4]] });
    const antes = ed.pagina().itens.map(i => i.t).sort().join(',');
    const removeu = ed.apagarEm({ x: 100, y: 80 }, 10);
    const depois = ed.pagina().itens.map(i => i.t).sort().join(',');
    // e a seleção alcança o tapar, que é como ela desfaz um branco errado
    ed.ferramenta = 'selecao';
    const achou = ed.itemEm({ x: 60, y: 60 });
    ed.selecionado = achou;
    ed.removerSelecionado();
    const semTapar = ed.pagina().itens.map(i => i.t).sort().join(',');
    ed.destruir && ed.destruir();
    c.remove();
    return { antes, removeu, depois, tipoAchado: achou && achou.t, semTapar };
  });
  console.log('   borracha: ' + JSON.stringify(borracha));
  conf('a folha começa com os quatro tipos', borracha.antes, 'imagem,tapar,texto,traco');
  conf('a borracha alcança e remove o traço', borracha.removeu, true);
  conf('e NÃO leva junto o tapar, o texto nem a imagem', borracha.depois, 'imagem,tapar,texto');
  conf('a seleção acha o retângulo que tapa', borracha.tipoAchado, 'tapar');
  conf('e consegue tirá-lo, que é como ela desfaz um branco no lugar errado',
    borracha.semTapar, 'imagem,texto');
  // ================================================================
  /* A CONTRADIÇÃO ENTRE AS DUAS RODADAS, MEDIDA EM VEZ DE ARBITRADA.
   *
   * A rodada anterior mediu, pela API, que a seleção alcança e remove o tapar,
   * e concluiu que havia saída. A lente cega do PR disse que a borracha não
   * alcança e que a lixeira depende de um caminho que a interface quase não
   * oferece. As duas afirmações são compatíveis, e é por isso que só medir
   * resolve: a API tinha saída e a TELA não tinha.
   *
   * Aqui a medição é pela interface, na folha de verdade, COM O BICO: o bico
   * escolhe a ferramenta, desenha o retângulo, troca para a seleção e toca
   * nele, e então se conta quantos botões de remover existem na barra.
   *
   * E é bico, e não dedo, de propósito e com o motivo escrito: nesta folha o
   * dedo NUNCA desenha, por decisão antiga da casa (`_eDedo` sai na primeira
   * linha do `_aoDescer`, antes de qualquer ferramenta), e isso vale igual para
   * a caneta, o marca-texto, a borracha, o texto e a seleção. O tapar segue a
   * regra, não inventa uma. Um comentário anterior dizia "o dedo desenha", e
   * era falso: o evento sempre foi `pointerType: 'pen'`. Ferramenta que ela
   * cria e não consegue tirar não está pronta. */
  secao('6b. O que ela cria, ela consegue tirar, medido pela interface');
  await pag.evaluate(async () => {
    const d = await Store.carregar();
    const hoje = new Date();
    const iso = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' + String(hoje.getDate()).padStart(2, '0');
    d.aulas.push({ id: 'aula-b10-tapar', alunoId: d.alunos[0].id, serieId: null, destacada: false, data: iso,
      hora: '09:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '',
      temNota: false, anexos: [], temas: [] });
    await Store.salvar(d);
  });
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'agenda');
  await pausa(700);
  const hojeIso = new Date();
  const ISO = hojeIso.getFullYear() + '-' + String(hojeIso.getMonth() + 1).padStart(2, '0') + '-' + String(hojeIso.getDate()).padStart(2, '0');
  conf('abriu a aula de hoje na agenda', await pag.evaluate(d => {
    const dia = document.querySelector('[data-dia="' + d + '"]');
    const p = dia && dia.querySelector('.pilula');
    if (!p) return false; p.click(); return true;
  }, ISO), true);
  await pausa(800);
  conf('abriu a folha da aula', await pag.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#linha-folha button, .modal-corpo button'))
      .find(x => /folha/i.test(x.textContent));
    if (!b) return false; b.click(); return true;
  }), true);
  await pausa(1500);
  const lixeiraSeletor = '#ferramentas-nota [title="Remover o item selecionado"]';
  /* O BICO desenha: pointerdown, um arrasto e pointerup no canvas, que é o
   * caminho do bico e do dedo. Nada de chamar `adicionarTapar` pela API, que é
   * exatamente a diferença entre as duas medidas que se contradiziam. */
  const desenhou = await pag.evaluate(async () => {
    function tocar(el, tipo, x, y) {
      const r = el.getBoundingClientRect();
      el.dispatchEvent(new PointerEvent(tipo, { bubbles: true, cancelable: true, pointerId: 1,
        pointerType: 'pen', clientX: r.left + x, clientY: r.top + y, buttons: tipo === 'pointerup' ? 0 : 1 }));
    }
    const b = Array.from(document.querySelectorAll('#ferramentas-nota .ferr'))
      .find(x => x.getAttribute('title') === 'Tapar com branco');
    if (!b) return 'sem a ferramenta';
    b.click();
    await new Promise(r => setTimeout(r, 200));
    /* DENTRO DA FOLHA, e em fração do canvas. A primeira escrita usava pixels
     * cravados (120,120 a 260,200) que caíam FORA da folha, num canto do canvas
     * onde só há moldura: o retângulo nascia com coordenada negativa e só
     * existia porque nada o recortava. Quando o recorte entrou, esta prova foi
     * a primeira a reprovar, e reprovou com razão. */
    const c = document.querySelector('#tela-desenho');
    const cx = c.getBoundingClientRect().width, cy = c.getBoundingClientRect().height;
    tocar(c, 'pointerdown', Math.round(cx * 0.40), Math.round(cy * 0.35));
    tocar(c, 'pointermove', Math.round(cx * 0.62), Math.round(cy * 0.52));
    tocar(c, 'pointerup', Math.round(cx * 0.62), Math.round(cy * 0.52));
    await new Promise(r => setTimeout(r, 300));
    await new Promise(r => setTimeout(r, 900));
    const nota = await Store.lerNota('aula-b10-tapar');
    const itens = (nota && nota.paginas && nota.paginas[0] && nota.paginas[0].itens) || [];
    return itens.filter(i => i.t === 'tapar').length;
  });
  console.log('   retângulos de tapar desenhados pela interface: ' + JSON.stringify(desenhou));
  /* MEDIDO E AFIRMADO. Esta linha era só um console.log, e um zero aqui só
   * reprovava por tabela, na asserção da lixeira, com a mensagem errada
   * apontando para o conserto errado. Achado por uma lente cega. */
  conf('o arrasto pela interface criou UM retângulo na folha', desenhou, 1);
  const antesDeSelecionar = await pag.evaluate(s => document.querySelectorAll(s).length, lixeiraSeletor);
  conf('antes de selecionar, a barra NÃO tem botão de remover', antesDeSelecionar, 0);
  const aoSelecionar = await pag.evaluate(async (s) => {
    function tocar(el, tipo, x, y) {
      const r = el.getBoundingClientRect();
      el.dispatchEvent(new PointerEvent(tipo, { bubbles: true, cancelable: true, pointerId: 2,
        pointerType: 'pen', clientX: r.left + x, clientY: r.top + y, buttons: tipo === 'pointerup' ? 0 : 1 }));
    }
    const sel = Array.from(document.querySelectorAll('#ferramentas-nota .ferr'))
      .find(x => x.getAttribute('title') === 'Mover e redimensionar');
    if (!sel) return { erro: 'sem a ferramenta de seleção' };
    sel.click();
    await new Promise(r => setTimeout(r, 200));
    const c = document.querySelector('#tela-desenho');
    const cx = c.getBoundingClientRect().width, cy = c.getBoundingClientRect().height;
    tocar(c, 'pointerdown', Math.round(cx * 0.50), Math.round(cy * 0.43));
    tocar(c, 'pointerup', Math.round(cx * 0.50), Math.round(cy * 0.43));
    await new Promise(r => setTimeout(r, 300));
    return { lixeiras: document.querySelectorAll(s).length };
  }, lixeiraSeletor);
  console.log('   depois de tocar no retângulo: ' + JSON.stringify(aoSelecionar));
  if (V_LIXEIRA) {
    conf('VENENO: sem o aviso de seleção, a lixeira NÃO aparece ao tocar no retângulo',
      aoSelecionar.lixeiras, 0);
    return;
  }
  conf('tocar no retângulo com a seleção ACENDE a lixeira na barra', aoSelecionar.lixeiras, 1);
  const sumiu = await pag.evaluate(async (s) => {
    document.querySelector(s).click();
    await new Promise(r => setTimeout(r, 300));
    await new Promise(r => setTimeout(r, 900));
    const nota = await Store.lerNota('aula-b10-tapar');
    const itens = (nota && nota.paginas && nota.paginas[0] && nota.paginas[0].itens) || [];
    return { tapar: itens.filter(i => i.t === 'tapar').length, lixeiras: document.querySelectorAll(s).length };
  }, lixeiraSeletor);
  console.log('   depois da lixeira: ' + JSON.stringify(sumiu));
  conf('e a lixeira tira o retângulo da folha', sumiu.tapar, 0);
  conf('e some junto, porque já não há o que remover', sumiu.lixeiras, 0);

  // ================================================================
  secao('7. A versão sobe SILENCIOSA');
  /* O texto para a Nathália é do Romulo, e não nosso. Então a 1.27.0 não entra
   * no NOVIDADES e a janela não pode abrir sozinha. Medido abrindo o
   * aplicativo com a versão anterior marcada como vista, que é exatamente o
   * estado do tablet dela quando esta versão chegar. */
  const versaoDoApp = /var VERSAO = '([^']+)';/.exec(APP_REPO)[1];
  conf('o app.js NÃO tem entrada de novidades para esta versão',
    new RegExp("versao: '" + versaoDoApp.replace(/\./g, '\\.') + "'").test(APP_REPO), false);
  const gravado = await pag.evaluate(async () => {
    const d = await Store.carregar();
    d.ajustes = d.ajustes || {};
    d.ajustes.versaoVista = '1.26.0';
    await Store.salvar(d);
    const lido = await Store.carregar();
    return (lido.ajustes || {}).versaoVista;
  });
  conf('a versão vista do tablet ficou na 1.26.0', gravado, '1.26.0');
  /* SEM o H.abrirApp, pelo mesmo motivo do controle logo abaixo: o auxiliar
   * fecha a janela quando a encontra aberta, e medir depois dele mediria o
   * clique dele e não o aplicativo. A janela do controle abre em menos de meio
   * segundo, então quatro segundos de vigia aqui é folga de oito vezes. */
  await pag.reload({ waitUntil: 'networkidle0' });
  let abriuAlgumaVez = false;
  for (let i = 0; i < 20; i++) {
    await pausa(200);
    if (await pag.evaluate(() => !!document.querySelector('#modal-novidades.aberto'))) { abriuAlgumaVez = true; break; }
  }
  const janela = await pag.evaluate(() => {
    const m = document.querySelector('#modal-novidades');
    return { existe: !!m };
  });
  console.log('   janela de novidades abriu alguma vez em 4 s: ' + abriuAlgumaVez + ', versão do app: ' + versaoDoApp);
  conf('a janela de novidades existe no aplicativo', janela.existe, true);
  conf('e NÃO abriu sozinha ao subir da 1.26.0 para esta versão', abriuAlgumaVez, false);
  /* O CONTROLE: com uma versão vista bem antiga, a MESMA janela TEM de abrir.
   * Sem este par, "não abriu" não se distingue de uma janela quebrada, que
   * também não abriria nunca. */
  /* O CONTROLE, e ele é um VENENO e não uma versão antiga.
   *
   * A primeira escrita deste controle punha `versaoVista` numa versão bem
   * antiga e esperava a janela abrir. Não abriu, e o motivo não era a janela:
   * era a montagem do teste correndo com o próprio `mostrarNovidades`, que
   * grava a versão de hoje ao decidir não abrir. Um controle que depende de
   * corrida mede a corrida.
   *
   * Aqui o controle serve um app.js com UMA entrada de novidades para esta
   * versão, e mais nada. Se a janela abrir com a entrada e não abrir sem ela,
   * então "não abriu" é consequência de não haver entrada, que é exatamente a
   * afirmação. */
  /* A quebra de linha sai do PRÓPRIO app.js: o repositório pode estar em CRLF,
   * e âncora cravada com \n casa zero vezes e não envenena nada. A asserção de
   * "trocou exatamente uma ocorrência" logo abaixo é o que transforma isso em
   * reprovação em vez de silêncio, e foi ela que pegou o erro na primeira
   * corrida desta seção. */
  // o NL_APP é o mesmo das âncoras dos venenos, lá em cima, e sai do próprio app.js
  const ANCORA_NOV = '  var NOVIDADES = [' + NL_APP;
  conf('a âncora do controle casa exatamente uma vez', APP_REPO.split(ANCORA_NOV).length - 1, 1);
  const comEntrada = APP_REPO.replace(ANCORA_NOV,
    ANCORA_NOV + "    { versao: '" + versaoDoApp + "', itens: ['entrada de controle desta prova'] }," + NL_APP);
  conf('o controle mudou mesmo o app.js', comEntrada !== APP_REPO ? 'diferente' : 'IGUAL', 'diferente');
  const ambControle = H.criarAmbiente(PORTA + 1, 'perfil_bib_listas_ctrl', { '/app.js': comEntrada });
  await ambControle.subir();
  const pagC = await ambControle.pagina();
  await H.abrirApp(pagC, ambControle.ORIGEM);
  const antes = await pagC.evaluate(async () => {
    const d = await Store.carregar();
    d.ajustes = d.ajustes || {};
    d.ajustes.versaoVista = '1.26.0';
    await Store.salvar(d);
    const lido = await Store.carregar();
    return { vista: (lido.ajustes || {}).versaoVista, aulas: (lido.aulas || []).length };
  });
  console.log('   controle antes do reload: ' + JSON.stringify(antes));
  conf('a versão vista ficou gravada antes do reload', antes.vista, '1.26.0');
  /* O RELOAD AQUI NÃO PASSA PELO H.abrirApp, e esse é o ponto.
   *
   * O auxiliar de teste CLICA no "entendi" quando encontra a janela aberta, o
   * que é o certo para os outros testes (a janela atrapalharia todos eles) e é
   * fatal para este, que existe justamente para olhar a janela. As duas
   * primeiras escritas deste controle falharam por isso, e o veredito era
   * "a janela não sabe abrir" quando quem a fechava era a própria prova. */
  await pagC.reload({ waitUntil: 'networkidle0' });
  const r = await esperar('a janela com a entrada de controle', () => pagC.evaluate(() => {
    const m = document.querySelector('#modal-novidades');
    return !!(m && m.classList.contains('aberto'));
  }), v => v === true, 12000);
  conf('e a janela SABE abrir: com uma entrada para esta versão, ela abre', r.ok, true);
  await ambControle.encerrar();

  if (pag.errosDePagina.length) console.log('   erros de página: ' + pag.errosDePagina.join(' | ').slice(0, 400));
  conf('nenhum erro de JavaScript na página', pag.errosDePagina.length, 0);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
