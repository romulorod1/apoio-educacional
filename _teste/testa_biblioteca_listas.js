/* testa_biblioteca_listas.js
 *
 * A TELA DA LISTA PRONTA (B10), no Chrome, com o pacote SINTÉTICO. O pacote
 * real do Drive nunca entra aqui.
 *
 * O que prova, no modo normal:
 *
 *   1. AS DUAS LINHAS NA TELA DO MÓDULO. "Lista pronta, nível 2" e "nível 3",
 *      cada uma dizendo quantos exercícios, a meia aula e o minuto estimado
 *      colado da palavra estimativa. E, no outro sentido, o que NÃO pode estar
 *      escrito: nenhuma palavra de curadoria em lugar nenhum da tela. A
 *      comparação cega de 24/09 mediu que a nossa escolha não vence uma
 *      escolha simples dentro da mesma rampa, então "kit curado" e "sugestão"
 *      são afirmações que esta casa não pode fazer.
 *
 *   1a. O NÚMERO É O DAQUELA LISTA. As duas listas do pacote sintético têm
 *      tamanhos e minutos diferentes de propósito, e a tela tem de mostrar os
 *      dois pares certos. A lista de 31,6 min diz 31,6 e diz "um pouco mais de
 *      meia aula", e não "cerca de meia aula": o número na tela é o da lista, e
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
 * Modos envenenados (cada um desliga UMA regra e sai assim que a vê cair):
 *   --envenenado-ordem    o app.js servido carrega a lista ORDENADA pelo id em
 *                         vez da ordem da lista. O carrinho continua com os
 *                         mesmos ids e o mesmo tamanho, e só a ORDEM muda: é o
 *                         veneno que separa "carregou os itens certos" de
 *                         "carregou na ordem certa".
 *   --envenenado-seta     o app.js servido não troca nada ao tocar na seta.
 *   --envenenado-curadoria o app.js servido escreve "Kit curado" no lugar do
 *                         rótulo da linha. A varredura de palavra proibida tem
 *                         de enxergar.
 *   --envenenado-camadas  o draw.js servido volta a desenhar o canvas na ordem
 *                         do vetor, e não em camadas. O tapar continua no
 *                         arquivo e continua saindo no PDF: o que quebra é a
 *                         tela concordar com a folha impressa, que é a parte
 *                         silenciosa.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8806;
const V_ORDEM = process.argv.indexOf('--envenenado-ordem') !== -1;
const V_SETA = process.argv.indexOf('--envenenado-seta') !== -1;
const V_CURADORIA = process.argv.indexOf('--envenenado-curadoria') !== -1;
const V_CAMADAS = process.argv.indexOf('--envenenado-camadas') !== -1;
const VENENO = V_ORDEM || V_SETA || V_CURADORIA || V_CAMADAS;

const APP_REPO = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const DRAW_REPO = fs.readFileSync(path.join(H.RAIZ, 'draw.js'), 'utf8');

/* As âncoras saem do PRÓPRIO arquivo, e a contagem de ocorrências logo abaixo
 * é o que transforma "a âncora não casou" em reprovação em vez de silêncio: um
 * veneno que deixa de envenenar sem ninguém notar é o pior defeito de uma
 * prova, e foi assim que o escopo do carregarSerie mediu o app.js inteiro no
 * PR #55. */
const L_ORDEM = 'var tudo = { itens: lp.ids.slice(), paginas: [] };';
const T_ORDEM = 'var tudo = { itens: lp.ids.slice().sort(), paginas: [] };';
const L_SETA = 'var outro = lista[j];';
const T_SETA = 'var outro = lista[j]; return null;';
const L_CURADORIA = "var linha = linhaBib('Lista pronta, nível ' + lp.nivel,";
const T_CURADORIA = "var linha = linhaBib('Kit curado, nível ' + lp.nivel,";
/* A quebra de linha sai do PRÓPRIO arquivo: o repositório pode estar em CRLF, e
 * âncora de várias linhas cravada com \n casa zero vezes e envenena nada. */
const NL = DRAW_REPO.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
const L_CAMADAS = [
  '    for (var c = 0; c < ORDEM_CAMADAS.length; c++) {',
  '      for (var i = 0; i < itens.length; i++) {',
  '        if (itens[i] && itens[i].t === ORDEM_CAMADAS[c]) this._desenharItem(ctx, itens[i]);',
  '      }',
  '    }'].join(NL);
// o desenho na ordem do vetor, que é como era antes da B10
const T_CAMADAS = '    for (var i = 0; i < itens.length; i++) this._desenharItem(ctx, itens[i]);';

const ALVO = V_ORDEM ? L_ORDEM : V_SETA ? L_SETA : V_CURADORIA ? L_CURADORIA : L_CAMADAS;
const TROCA = V_ORDEM ? T_ORDEM : V_SETA ? T_SETA : V_CURADORIA ? T_CURADORIA : T_CAMADAS;
const trocas = {};
if (VENENO) {
  if (V_CAMADAS) trocas['/draw.js'] = DRAW_REPO.split(ALVO).join(TROCA);
  else trocas['/app.js'] = APP_REPO.split(ALVO).join(TROCA);
}

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

(async () => {
  if (VENENO) {
    secao('O veneno é de verdade');
    const arq = V_CAMADAS ? '/draw.js' : '/app.js';
    const base = V_CAMADAS ? DRAW_REPO : APP_REPO;
    conf('o arquivo servido ficou DIFERENTE do repositório', trocas[arq] !== base ? 'diferente' : 'IGUAL', 'diferente');
    conf('e o veneno trocou exatamente uma ocorrência', base.split(ALVO).length - 1, 1);
    if (trocas[arq] === base) throw Object.assign(new Error('veneno não aplicado'), { jaContado: true });
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
    conf('a primeira é a do nível 2', (linhas[0] || {}).nome, 'Lista pronta, nível 2');
    conf('a segunda é a do nível 3', (linhas[1] || {}).nome, 'Lista pronta, nível 3');
  }

  // 1a. o número é o DAQUELA lista, e os dois pares são diferentes entre si
  const d2 = (linhas[0] || {}).detalhe || [];
  const d3 = (linhas[1] || {}).detalhe || [];
  conf('o nível 2 diz quantos exercícios são', /^5 exercícios/.test(d2[0] || ''), true);
  conf('o nível 3 diz quantos exercícios são', /^4 exercícios/.test(d3[0] || ''), true);
  conf('o nível 2, com 29,4 min, diz cerca de meia aula', /cerca de meia aula/.test(d2[0] || ''), true);
  /* AS TRÊS FAIXAS DA FRASE, e é isto que impede o texto de ser uma constante:
   * 29,4 está dentro da banda, 35,0 está acima e a lista do outro módulo, com
   * 24,0, está abaixo. Com as três dentro, trocar meiaAula() por "cerca de
   * meia aula" fixo passaria em tudo. A primeira escrita desta prova tinha só
   * a de dentro, e foi rodando que isso apareceu. */
  conf('o nível 3, com 35,0 min, diz um pouco MAIS de meia aula', /um pouco mais de meia aula/.test(d3[0] || ''), true);
  /* O minuto da lista vai INTEIRO, meio para cima: 29,4 vira 29 e 35,0 vira
   * 35. A décima numa estimativa de quanto o aluno leva é precisão que não
   * existe, e era ela que fazia "29" e "32,1" aparecerem lado a lado com
   * formatos diferentes. */
  conf('o minuto do nível 2 vem embaixo, inteiro, colado da estimativa', d2[1], '≈ 29 min (estimativa)');
  conf('o minuto do nível 3 vem embaixo, inteiro, colado da estimativa', d3[1], '≈ 35 min (estimativa)');

  const texto = (await textoDoCorpo(pag)).toLowerCase();
  const achadas = PROIBIDAS.filter(p => texto.indexOf(p) >= 0);
  if (V_CURADORIA) {
    conf('VENENO: a varredura ENXERGA a palavra de curadoria que o app envenenado escreveu',
      achadas.join(','), 'curad');
    if (pag.errosDePagina.length) console.log('   erros de página: ' + pag.errosDePagina.join(' | ').slice(0, 200));
    return;
  }
  conf('nenhuma palavra de curadoria na tela do módulo', achadas.join(',') || '(nenhuma)', '(nenhuma)');
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
  conf('e é a do módulo certo', (linhasPit[0] || {}).id, LISTA_CURTA.id);
  conf('com 24,6 min, diz um pouco MENOS de meia aula',
    /um pouco menos de meia aula/.test(((linhasPit[0] || {}).detalhe || [])[0] || ''), true);
  /* O ARREDONDAMENTO É MEIO PARA CIMA, e esta é a lista que mede isso: 24,6
   * tem de virar 25. As outras duas têm 29,4 e 35,0, que arredondam para
   * BAIXO e para lugar nenhum; com só elas, trocar o meio para cima por um
   * corte simples passaria nas três asserções sem nada reclamar. */
  conf('e o minuto dela é o dela, arredondado meio PARA CIMA (24,6 vira 25)',
    ((linhasPit[0] || {}).detalhe || [])[1], '≈ 25 min (estimativa)');
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(300);
  conf('voltou e abriu de novo o módulo das equações', await tocarLinha(pag, MOD_TITULO), true);
  await pausa(400);

  // ================================================================
  secao('2. Tocar carrega a lista no carrinho, NA ORDEM DELA');
  conf('a ordem da lista do nível 2 é diferente da ordem da fonte',
    IDS2.join('|') !== IDS2.slice().sort().join('|'), true);
  conf('tocou na linha do nível 2', await tocarLinha(pag, 'Lista pronta, nível 2'), true);
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
  const nums = await numerosDaTela(pag);
  conf('a numeração da tela acompanha', nums[0].indexOf('1. ') === 0 && nums[1].indexOf('2. ') === 0, true);
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
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(300);
  conf('voltou ao módulo e tocou de novo no nível 2 não é preciso: a lista pronta guarda o estado',
    (await carrinho(pag)).itens.length, c5.itens.length);

  // ================================================================
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
  const NL_APP = APP_REPO.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
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
