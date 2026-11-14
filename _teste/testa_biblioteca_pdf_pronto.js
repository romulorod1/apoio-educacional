/* testa_biblioteca_pdf_pronto.js
 *
 * L1 da nova montagem de listas (decisões D1, D8 revista e D10 do dono,
 * 12/11/2026), no Chrome, com o pacote SINTÉTICO e um banco fictício
 * ("Aluna Alfa Teste" e "Aluno Beta Teste"). Nenhum dado real.
 *
 * O que prova, no modo normal:
 *
 *   1. PRÓXIMAS AULAS. A janela "Gerar material" mostra as aulas de hoje e dos
 *      próximos sete dias, em ordem de data e hora: as de hoje que ainda vão
 *      acontecer, as de hoje que já terminaram e depois os próximos dias; cada
 *      linha diz o dia da semana, a data e a hora. A cancelada e a de daqui a
 *      duas semanas não entram; a de ontem fica no bloco recolhido dos últimos
 *      dias. Sem aluno em contexto, nada vem escolhido. "Nova aula hoje" fica
 *      no fim, discreta.
 *   2. ALUNO EM CONTEXTO. Com o filtro "Ainda não usei com" na Aluna Alfa, as
 *      aulas dela vêm primeiro e a de AMANHÃ (a mais próxima que ainda não
 *      aconteceu e não tem falta registrada) já vem escolhida. Anexar grava na
 *      aula de amanhã, como sempre: dois anexos (lista e gabarito) e o uso de
 *      cada exercício. Depois do anexo, com o filtro ainda na tela, nada vem
 *      escolhido sozinho; trocar o filtro devolve a sugestão. Fora da lista
 *      de exercícios (o filtro guardado, mas fora da tela), nada vem escolhido.
 *   3. PDF PRONTO. "Só gerar PDF, sem anexar" abre a janela "PDF pronto" e não
 *      baixa nada sozinho. Lista e gabarito, cada um com o nome e três botões
 *      só de símbolo (compartilhar, baixar, ver), com aria-label e title.
 *      Com navigator.share falso: o sucesso não baixa; o AbortError (ela
 *      cancelou) não baixa e diz que o PDF continua ali; o NotAllowedError (o
 *      prazo do toque) não baixa e pede para tocar de novo. Baixar baixa
 *      exatamente o arquivo do botão; ver abre o leitor do aplicativo.
 *   4. SEM COMPARTILHAMENTO NO APARELHO, um arquivo só: o botão de
 *      compartilhar some, ficam baixar e ver, e nada é baixado sozinho (o
 *      caminho antigo baixava na hora).
 *   3b. O VOLTAR DO APARELHO (history.back): com o leitor aberto por cima da
 *      janela, fecha só o leitor; depois fecha a janela PDF pronto, e a tela
 *      da Biblioteca por baixo continua a mesma.
 *   5. O TUTORIAL não manda imprimir: a etapa 4 diz mandar ao aluno ou
 *      guardar no tablet.
 *
 * Modos envenenados, um por regra que este PR cria:
 *   --envenenado-baixa-ao-cancelar  cancelar o compartilhar volta a baixar
 *                                   o arquivo escondido (o defeito de antes).
 *   --envenenado-so-hoje            a janela volta a olhar só as aulas de hoje:
 *                                   a de amanhã some.
 *   --envenenado-sem-sugestao       a próxima aula do aluno em contexto deixa
 *                                   de vir escolhida.
 *   --envenenado-sugere-depois      depois de anexar, a aula dela volta a vir
 *                                   escolhida sozinha (achado da revisão).
 *   --envenenado-filtro-fora        o filtro guardado vale mesmo fora da tela
 *                                   (achado da segunda revisão).
 *   --envenenado-guarda-pdf         a janela PDF pronto fechada não solta os
 *                                   PDFs: o corpo continua montado, com os
 *                                   botões e os arquivos presos neles.
 *   --envenenado-voltar             a janela PDF pronto sai do histórico: o
 *                                   Voltar do aparelho deixa a janela aberta e
 *                                   troca a tela por baixo (achado da
 *                                   orquestradora no #196).
 *
 * Com --prints=PASTA, guarda três prints a 1280 x 800 (a janela PDF pronto, a
 * Gerar material com as próximas aulas e a etapa 4 do tutorial).
 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
// segunda, 16/11/2026, às 11:00: amanhã é terça, 17/11
const RELOGIO = H.relogioDaRodada('2026-11-16', '11:00');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8853;
const MODOS = ['--envenenado-baixa-ao-cancelar', '--envenenado-so-hoje', '--envenenado-sem-sugestao',
  '--envenenado-sugere-depois', '--envenenado-filtro-fora', '--envenenado-voltar', '--envenenado-guarda-pdf'];
const MODO = MODOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const PRINTS = (process.argv.filter(a => a.indexOf('--prints=') === 0)[0] || '').slice('--prints='.length);
const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');

// uma linha só: âncora de várias linhas depende do final de linha do arquivo
const L_CANCELA = "      if (nome === 'AbortError') { a.recusas = 0; avisar('Envio cancelado. O PDF continua aqui.'); }";
const T_CANCELA = "      if (nome === 'AbortError') { a.recusas = 0; baixar(a.nome, a.blob); }";
const L_LIMITE = '    var limite = isoMaisDias(hoje, DIAS_PROXIMAS_AULAS);';
const T_LIMITE = '    var limite = hoje;';
const L_SUGESTAO = '      if (daProxima) { marcarAula(daProxima, aulas.sugerida.id, false); escolha.automatica = true; }';
const T_SUGESTAO = '      void daProxima;';
const L_GASTA = '&& !bibSugestaoGasta) {';
const T_GASTA = ') {';
const L_FORA = '    var filtroNaTela = !!(bibFiltroAluno && seletorDoFiltro && seletorDoFiltro.value === bibFiltroAluno &&';
const T_FORA = '    var filtroNaTela = !!(bibFiltroAluno &&';
const L_VOLTAR = "    'modal-bib-compartilhar': true";
const T_VOLTAR = "    'modal-bib-compartilhar-fora-do-historico': true";
function umaVez(texto, ancora) { return texto.split(ancora).length === 2; }

const trocas = {};
if (MODO === '--envenenado-baixa-ao-cancelar') trocas['/app.js'] = APP.split(L_CANCELA).join(T_CANCELA);
if (MODO === '--envenenado-so-hoje') trocas['/app.js'] = APP.split(L_LIMITE).join(T_LIMITE);
if (MODO === '--envenenado-sem-sugestao') trocas['/app.js'] = APP.split(L_SUGESTAO).join(T_SUGESTAO);
if (MODO === '--envenenado-sugere-depois') trocas['/app.js'] = APP.split(L_GASTA).join(T_GASTA);
if (MODO === '--envenenado-filtro-fora') trocas['/app.js'] = APP.split(L_FORA).join(T_FORA);
if (MODO === '--envenenado-voltar') trocas['/app.js'] = APP.split(L_VOLTAR).join(T_VOLTAR);
// fechada por qualquer caminho, a janela solta os PDFs; o veneno tira a soltura
const L_SOLTA = "    if (id === 'modal-bib-compartilhar') soltarPdfPronto();";
if (MODO === '--envenenado-guarda-pdf') trocas['/app.js'] = APP.split(L_SOLTA).join('');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'l1_pdf_pronto_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

const LISTA2 = Sintetico.LISTAS.filter(l => l.modulo.indexOf('equacoes') >= 0 && l.nivel === 2)[0];
const IDS2 = LISTA2.degraus.map(d => d.item);
const CHAVE_CARRINHO = 'apoio-educacional:bib-carrinho';
const HOJE = '2026-11-16';

// ---------------------------------------------------------------- 0 (Node)
secao('0. Sem navegador: as âncoras dos venenos e o texto do tutorial');
[['cancelar', L_CANCELA], ['limite', L_LIMITE], ['sugestão', L_SUGESTAO], ['sugestão gasta', L_GASTA], ['filtro na tela', L_FORA], ['voltar', L_VOLTAR], ['soltar os PDFs', L_SOLTA]]
  .forEach(([n, a]) => conf('âncora de veneno uma vez só: ' + n, umaVez(APP, a), true));
const etapa4 = APP.slice(APP.indexOf("etapa: 'Etapa 4 de 4"), APP.indexOf("etapa: 'Etapa 4 de 4") + 900);
conf('a etapa 4 do tutorial existe', etapa4.length > 100, true);
conf('a etapa 4 não fala em imprimir nem em papel', /imprim|papel/i.test(etapa4), false);
conf('a etapa 4 diz mandar ao aluno ou guardar no tablet', /mande ao aluno ou guarde no tablet/.test(etapa4), true);
conf('a figura da etapa 4 não fala em papel', /Na tela ou papel/.test(APP), false);
/* O PDF pronto é só da Biblioteca: o resto do app entrega pelo entregarArquivo
 * de sempre, com a queda para o download. Desde o #225, cancelar ali também não
 * baixa (avisa "Envio cancelado."), e outra recusa continua baixando. Provado
 * pelo comportamento, na seção 0b: a função do app.js roda aqui no Node, com o
 * compartilhar e o download de mentira. */
const I_ENTREGAR = APP.indexOf('  function entregarArquivo(');
const FIM_ENTREGAR = I_ENTREGAR < 0 ? -1 : APP.slice(I_ENTREGAR).search(/\r?\n  \}\r?\n/);
const FONTE_ENTREGAR = I_ENTREGAR < 0 || FIM_ENTREGAR < 0 ? '' : APP.slice(I_ENTREGAR, I_ENTREGAR + FIM_ENTREGAR) + '\n  }';
conf('o entregarArquivo do resto do app existe, e é um só', FONTE_ENTREGAR.length > 100 && APP.split('function entregarArquivo(').length === 2, true);
// recusa: o nome do erro do compartilhar; 'ok' compartilha; 'sem' é o aparelho sem compartilhar
async function entregarForaDaBiblioteca(recusa) {
  const saidas = [];
  const caixa = {
    File: function (partes, nome) { this.name = nome; },
    navigator: recusa === 'sem' ? {} : {
      canShare: () => true,
      share: d => { saidas.push('share:' + d.files[0].name); return recusa === 'ok' ? Promise.resolve() : Promise.reject({ name: recusa }); }
    },
    baixar: nome => saidas.push('download:' + nome),
    avisar: texto => saidas.push('aviso:' + texto)
  };
  vm.runInNewContext(FONTE_ENTREGAR + '\nentregarArquivo("Fechamento_teste.pdf", { type: "application/pdf" }, "Fechamento");', caixa);
  await new Promise(r => setTimeout(r, 50));
  return saidas.join(' | ');
}

const amb = H.criarAmbiente(PORTA, 'perfil_pdf_pronto', trocas);

async function importar(pag, arquivo) {
  await H.irParaAba(pag, 'ajustes');
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar('importação', () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca'); return c ? c.innerText.trim() : '';
  }), v => /^Biblioteca importada\.|não foi importado/.test(v || ''), 90000);
  return r.valor || '';
}
async function tocarLinha(pag, nome) {
  const ok = await pag.evaluate(n => {
    const l = Array.from(document.querySelectorAll('#bib-corpo .item-lista')).find(x => x.querySelector('.nome').textContent.trim() === n);
    if (!l) return false; l.click(); return true;
  }, nome);
  await pausa(200);
  return ok;
}
async function abrirBibliotecaNoInicio(pag) {
  await H.irParaAba(pag, 'biblioteca');
  for (let k = 0; k < 4; k++) {
    const v = await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); return !!b; });
    if (!v) break;
    await pausa(150);
  }
}
async function carrinhoCheio(pag) {
  await pag.evaluate((k, ids) => localStorage.setItem(k, JSON.stringify({ itens: ids, paginas: [] })), CHAVE_CARRINHO, IDS2);
  await H.abrirApp(pag, amb.ORIGEM);
  await abrirBibliotecaNoInicio(pag);
  await pausa(300);
}
async function abrirGerar(pag) {
  await pag.evaluate(() => document.querySelector('#bib-carrinho-gerar').click());
  const r = await esperar('a janela Gerar material', () => pag.evaluate(() =>
    document.querySelector('#modal-bib-gerar').classList.contains('aberto') && !!document.querySelector('#bib-gerar-proximas')), v => v === true, 8000);
  return r.ok;
}
const ordemProximas = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#bib-gerar-proximas [data-aula]'))
  .map(b => b.getAttribute('data-aula')).join(','));
const escolhida = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#bib-gerar-aulas .item-lista.escolhida'))
  .map(b => b.getAttribute('data-aula')).join(','));
const detalheDe = (pag, id) => pag.evaluate(i => {
  const b = document.querySelector('#bib-gerar-aulas [data-aula="' + i + '"] .detalhe'); return b ? b.textContent : '';
}, id);
const avisoAgora = pag => pag.evaluate(() => document.querySelector('#aviso').classList.contains('aberto')
  ? document.querySelector('#aviso-texto').textContent : '');
const baixados = pag => pag.evaluate(() => (window.__baixados || []).slice());
const janelaPdf = pag => pag.evaluate(() => {
  const m = document.querySelector('#modal-bib-compartilhar');
  return {
    aberta: m.classList.contains('aberto'),
    titulo: m.querySelector('h3').textContent,
    itens: Array.from(m.querySelectorAll('.bib-pdf-item')).map(i => ({
      parte: i.getAttribute('data-parte'),
      nome: i.querySelector('.bib-compartilhar-nome').textContent,
      acoes: Array.from(i.querySelectorAll('button')).map(b => ({
        acao: b.getAttribute('data-acao'), rotulo: b.getAttribute('aria-label'), title: b.getAttribute('title'),
        texto: b.textContent.trim(), icone: (b.querySelector('svg') || { getAttribute: () => '' }).getAttribute('data-icone-nome')
      }))
    }))
  };
});
async function print(pag, nome) {
  if (!PRINTS) return;
  fs.mkdirSync(PRINTS, { recursive: true });
  await pausa(400);
  await pag.screenshot({ path: path.join(PRINTS, nome) });
  console.log('   print: ' + nome);
}
const fim = () => Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });

(async () => {
  secao('0b. Fora da Biblioteca, o entregarArquivo: cancelar não baixa, outra recusa baixa, compartilhado não baixa, sem compartilhar baixa');
  conf('AbortError (ela cancelou): não baixa e avisa "Envio cancelado."', await entregarForaDaBiblioteca('AbortError'),
    'share:Fechamento_teste.pdf | aviso:Envio cancelado.');
  conf('NotAllowedError (outra recusa): baixa, sem o aviso de cancelado', await entregarForaDaBiblioteca('NotAllowedError'),
    'share:Fechamento_teste.pdf | download:Fechamento_teste.pdf');
  conf('compartilhado: só o compartilhar, nenhum download nem aviso', await entregarForaDaBiblioteca('ok'),
    'share:Fechamento_teste.pdf');
  conf('sem o compartilhar no aparelho: baixa direto', await entregarForaDaBiblioteca('sem'),
    'download:Fechamento_teste.pdf');
  if (MODO) {
    secao('O veneno é de verdade');
    conf('o app.js servido ficou diferente do repositório (' + MODO + ')', trocas['/app.js'] !== APP, true);
  }
  await amb.subir();
  const pag = await amb.pagina();
  await RELOGIO.naPagina(pag);
  if (PRINTS) await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  /* O compartilhar do aparelho é falso e comandado pela prova; o download vira
   * um nome anotado (nada sai para o disco). */
  await pag.evaluateOnNewDocument(() => {
    window.__baixados = [];
    window.__share = { pode: true, modo: 'ok', chamadas: [] };
    const clicar = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.hasAttribute('download')) { window.__baixados.push(this.getAttribute('download')); return; }
      return clicar.apply(this, arguments);
    };
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: function () { return window.__share.pode; } });
    Object.defineProperty(navigator, 'share', { configurable: true, value: function (d) {
      window.__share.chamadas.push((d.files || []).map(f => f.name).join('|'));
      if (window.__share.modo === 'ok') return Promise.resolve();
      return Promise.reject(new DOMException('simulado', window.__share.modo));
    } });
  });
  await H.abrirApp(pag, amb.ORIGEM);
  await RELOGIO.conferir(pag);
  const zip = path.join(TMP, 'com-listas.zip');
  Sintetico.gerar(zip, { listas: true });
  conf('importou o pacote sintético', /^Biblioteca importada\./.test(await importar(pag, zip)), true);

  /* Banco fictício. Hoje é segunda, 16/11, às 11:00. */
  await pag.evaluate(async () => {
    const d = await Store.carregar();
    const preco = [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 100 }];
    d.alunos = [{ id: 'alfa', nome: 'Aluna Alfa Teste', ativo: true, precos: preco },
      { id: 'beta', nome: 'Aluno Beta Teste', ativo: true, precos: preco }];
    d.series = [];
    const aula = (id, alunoId, data, hora, status) => ({ id, alunoId, serieId: null, destacada: false, data, hora,
      duracaoMin: 60, status: status || 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', temNota: false,
      anexos: [], temas: [], areas: [] });
    d.aulas = [
      aula('aula-alfa-cedo', 'alfa', '2026-11-16', '08:00'),        // hoje, já terminou
      aula('aula-alfa-falta', 'alfa', '2026-11-16', '14:00', 'falta'), // hoje, com falta já registrada
      aula('aula-beta-hoje', 'beta', '2026-11-16', '16:00'),        // hoje, ainda vai acontecer
      aula('aula-alfa-amanha', 'alfa', '2026-11-17', '15:30'),      // amanhã
      aula('aula-beta-cancelada', 'beta', '2026-11-18', '10:00', 'cancelada'),
      aula('aula-alfa-quinta', 'alfa', '2026-11-19', '15:30'),
      aula('aula-alfa-longe', 'alfa', '2026-11-30', '15:30'),       // daqui a duas semanas
      aula('aula-alfa-ontem', 'alfa', '2026-11-15', '15:30'),       // ontem
      aula('aula-beta-mais7', 'beta', '2026-11-23', '09:00'),       // daqui a 7 dias: entra
      aula('aula-beta-mais8', 'beta', '2026-11-24', '09:00')        // daqui a 8 dias: fica de fora
    ];
    d.resumos = [];
    d.ajustes = Object.assign({}, d.ajustes, { versaoVista: '9.9.9' });
    await Store.salvar(d);
  });

  // ================================================================
  secao('1. Próximas aulas, sem aluno em contexto');
  await carrinhoCheio(pag);
  conf('a janela Gerar material abriu', await abrirGerar(pag), true);
  const ordem1 = await ordemProximas(pag);
  console.log('   próximas: ' + ordem1);
  if (MODO === '--envenenado-so-hoje') {
    secao('VENENO: a janela olha só as aulas de hoje');
    conf('envenenado: a aula de amanhã sumiu (defeito enxergado)', ordem1.split(',').indexOf('aula-alfa-amanha') < 0, true);
    throw fim();
  }
  conf('hoje (as que vêm e as que terminaram) e depois os próximos dias',
    ordem1, 'aula-alfa-falta,aula-beta-hoje,aula-alfa-cedo,aula-alfa-amanha,aula-alfa-quinta,aula-beta-mais7');
  conf('a linha da falta diz que a falta está registrada', await detalheDe(pag, 'aula-alfa-falta'), 'Hoje, segunda 16/11, 14:00, falta registrada');
  conf('a linha diz o dia da semana, a data e a hora', await detalheDe(pag, 'aula-alfa-amanha'), 'Amanhã, terça 17/11, 15:30');
  conf('a de hoje diz que é hoje', await detalheDe(pag, 'aula-beta-hoje'), 'Hoje, segunda 16/11, 16:00');
  conf('a de hoje que já terminou diz isso', await detalheDe(pag, 'aula-alfa-cedo'), 'Hoje, segunda 16/11, 08:00, já terminou');
  conf('a cancelada não entra', await pag.evaluate(() => !document.querySelector('#bib-gerar-aulas [data-aula="aula-beta-cancelada"]')), true);
  conf('a de daqui a duas semanas não entra', await pag.evaluate(() => !document.querySelector('#bib-gerar-aulas [data-aula="aula-alfa-longe"]')), true);
  conf('a de daqui a 8 dias também não', await pag.evaluate(() => !document.querySelector('#bib-gerar-aulas [data-aula="aula-beta-mais8"]')), true);
  conf('a de ontem fica no bloco recolhido dos últimos dias', await pag.evaluate(() => {
    const d = document.querySelector('#bib-gerar-passadas');
    return !!d && !d.open && !!d.querySelector('[data-aula="aula-alfa-ontem"]');
  }), true);
  conf('sem aluno em contexto, nada vem escolhido', await escolhida(pag), '');
  conf('e o Gerar e anexar espera a escolha', await pag.evaluate(() => document.querySelector('#bib-gerar-anexar').disabled), true);
  conf('o bloco se chama Próximas aulas, e "Aulas de hoje" saiu', await pag.evaluate(() => {
    const t = document.querySelector('#bib-gerar-aulas').innerText;
    return /Próximas aulas/i.test(t) && !/Aulas de hoje/i.test(t);
  }), true);
  conf('"Nova aula hoje" é a última linha, discreta', await pag.evaluate(() => {
    const linhas = Array.from(document.querySelectorAll('#bib-gerar-aulas .item-lista'));
    const ult = linhas[linhas.length - 1];
    return ult.getAttribute('data-aula') === 'nova' && ult.classList.contains('bib-aula-nova');
  }), true);
  conf('"Procurar aula em outra data" continua', await pag.evaluate(() => !!document.querySelector('#bib-gerar-outra-data')), true);
  await pag.evaluate(() => document.querySelector('#rodape-modal-bib-gerar [data-fechar]').click());
  await pausa(300);

  // ================================================================
  secao('2. Com a Aluna Alfa no "Ainda não usei com", a aula de amanhã dela vem escolhida');
  conf('abriu o módulo das equações', await tocarLinha(pag, 'Equações do Segundo Grau'), true);
  conf('e a lista Soma e Produto', await tocarLinha(pag, 'Soma e Produto'), true);
  await esperar('o filtro na tela', () => pag.evaluate(() => !!document.querySelector('#bib-filtro-aluno')), v => v === true, 8000);
  await pag.select('#bib-filtro-aluno', 'alfa');
  await pausa(300);
  conf('a janela Gerar material abriu de novo', await abrirGerar(pag), true);
  const ordem2 = await ordemProximas(pag);
  console.log('   próximas: ' + ordem2);
  conf('as aulas dela vêm primeiro', ordem2, 'aula-alfa-falta,aula-alfa-amanha,aula-alfa-quinta,aula-alfa-cedo,aula-beta-hoje,aula-beta-mais7');
  const esc2 = await escolhida(pag);
  if (MODO === '--envenenado-sem-sugestao') {
    secao('VENENO: a próxima aula dela não vem escolhida');
    conf('envenenado: nada escolhido (defeito enxergado)', esc2, '');
    throw fim();
  }
  conf('a de amanhã, a mais próxima que ainda não aconteceu e sem falta, vem escolhida', esc2, 'aula-alfa-amanha');
  conf('e o Gerar e anexar já pode', await pag.evaluate(() => !document.querySelector('#bib-gerar-anexar').disabled), true);
  if (PRINTS) await pag.evaluate(() => document.querySelector('#bib-gerar-aulas').scrollIntoView({ block: 'start' }));
  await print(pag, 'L1-2-gerar-material-proximas-aulas.png');
  await pag.evaluate(() => document.querySelector('#bib-gerar-anexar').click());
  const anexou = await esperar('os anexos na aula de amanhã', () => pag.evaluate(() =>
    Store.carregar().then(d => (d.aulas.find(a => a.id === 'aula-alfa-amanha').anexos || []).map(a => a.parte || '').join(','))),
  v => v === 'lista,gabarito', 60000);
  conf('anexar grava na aula de amanhã, lista e gabarito, como sempre', anexou.ok, true);
  const uso = await esperar('o uso gravado', () => pag.evaluate(() => Store.usoDaBiblioteca()),
    l => Array.isArray(l) && l.length >= IDS2.length, 15000);
  conf('e o uso de cada exercício fica com a aula de amanhã',
    (uso.valor || []).filter(u => u.aulaId === 'aula-alfa-amanha' && u.alunoId === 'alfa').length, IDS2.length);
  conf('nenhuma outra aula ganhou anexo', await pag.evaluate(() => Store.carregar().then(d =>
    d.aulas.filter(a => a.id !== 'aula-alfa-amanha' && (a.anexos || []).length).length)), 0);
  await pag.evaluate(() => document.querySelectorAll('.modal.aberto [data-fechar]').forEach(b => b.click()));
  await pausa(300);

  /* DEPOIS DO ANEXO, COM O FILTRO AINDA NA TELA: ela marca outro exercício (o
   * do próximo aluno, digamos) e abre de novo. Nada pode vir escolhido
   * sozinho, senão um toque mandaria o material para a aula da Alfa. */
  conf('marcou outro exercício na mesma tela', await pag.evaluate(() => {
    const c = Array.from(document.querySelectorAll('#bib-corpo input[data-carrinho]')).find(x => !x.checked);
    if (!c) return false; c.click(); return true;
  }), true);
  await pausa(300);
  conf('o filtro continua na Alfa', await pag.$eval('#bib-filtro-aluno', e => e.value), 'alfa');
  conf('a janela Gerar material abriu depois do anexo', await abrirGerar(pag), true);
  const esc2b = await escolhida(pag);
  if (MODO === '--envenenado-sugere-depois') {
    secao('VENENO: depois do anexo, a aula dela volta escolhida sozinha');
    conf('envenenado: a aula veio escolhida (defeito enxergado)', esc2b, 'aula-alfa-amanha');
    throw fim();
  }
  conf('depois do anexo, nada vem escolhido sozinho', esc2b, '');
  await pag.evaluate(() => document.querySelector('#rodape-modal-bib-gerar [data-fechar]').click());
  await pausa(300);
  await pag.select('#bib-filtro-aluno', '');
  await pag.select('#bib-filtro-aluno', 'alfa');
  await pausa(300);
  conf('a janela abriu de novo', await abrirGerar(pag), true);
  conf('trocar o filtro devolve a sugestão', await escolhida(pag), 'aula-alfa-amanha');
  await pag.evaluate(() => document.querySelector('#rodape-modal-bib-gerar [data-fechar]').click());
  await pausa(300);

  /* O FILTRO GUARDADO, MAS FORA DA TELA: ela volta ao módulo (o seletor só
   * existe na lista de exercícios) e abre o Gerar material de lá. Ela pode
   * estar montando o material de outra criança: nada vem escolhido. */
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(300);
  conf('fora da lista de exercícios, o seletor do filtro não está na tela',
    await pag.evaluate(() => !document.querySelector('#bib-filtro-aluno')), true);
  conf('a janela abriu fora da lista', await abrirGerar(pag), true);
  const escFora = await escolhida(pag);
  if (MODO === '--envenenado-filtro-fora') {
    secao('VENENO: o filtro guardado vale fora da tela');
    conf('envenenado: a aula da Alfa veio escolhida fora da lista (defeito enxergado)', escFora, 'aula-alfa-amanha');
    throw fim();
  }
  conf('com o filtro fora da tela, nada vem escolhido', escFora, '');
  conf('e as aulas ficam na ordem de sempre, sem a Alfa na frente', (await ordemProximas(pag)).split(',')[1], 'aula-beta-hoje');
  await pag.evaluate(() => document.querySelector('#rodape-modal-bib-gerar [data-fechar]').click());
  await pausa(300);

  // ================================================================
  secao('3. "Só gerar PDF, sem anexar" abre a janela PDF pronto');
  await carrinhoCheio(pag);
  conf('a janela Gerar material abriu', await abrirGerar(pag), true);
  await pag.evaluate(() => document.querySelector('#bib-gerar-baixar').click());
  const abriu = await esperar('a janela PDF pronto', () => janelaPdf(pag), v => v && v.aberta && v.itens.length > 0, 30000);
  conf('a janela PDF pronto abriu', abriu.ok, true);
  const j = abriu.valor || { itens: [] };
  console.log('   janela: ' + JSON.stringify(j).slice(0, 600));
  conf('o título é PDF pronto', j.titulo, 'PDF pronto');
  conf('um arquivo para a lista e um para o gabarito', j.itens.map(i => i.parte).join(','), 'lista,gabarito');
  conf('cada um com o nome do arquivo', /lista.*\.pdf$/.test(j.itens[0] && j.itens[0].nome) && /gabarito.*\.pdf$/.test(j.itens[1] && j.itens[1].nome), true);
  conf('três botões em cada um: compartilhar, baixar e ver',
    j.itens.map(i => i.acoes.map(a => a.acao).join('+')).join(','), 'compartilhar+baixar+ver,compartilhar+baixar+ver');
  conf('cada botão diz o que faz no aria-label',
    j.itens.map(i => i.acoes.map(a => a.rotulo).join('|')).join(' / '),
    'Compartilhar a lista|Baixar a lista|Ver a lista / Compartilhar o gabarito|Baixar o gabarito|Ver o gabarito');
  conf('e o mesmo nome no title, que aparece ao segurar o dedo',
    j.itens.every(i => i.acoes.every(a => a.title === a.rotulo)), true);
  conf('só símbolo, sem palavra no botão', j.itens.every(i => i.acoes.every(a => a.texto === '')), true);
  conf('os símbolos: três pontos ligados, seta para baixo e olho',
    j.itens.map(i => i.acoes.map(a => a.icone).join('+')).join(','), 'compartilhar+download+olho,compartilhar+download+olho');
  conf('nada foi baixado nem compartilhado sozinho', JSON.stringify(await baixados(pag)) + ' ' +
    (await pag.evaluate(() => window.__share.chamadas.length)), '[] 0');
  await print(pag, 'L1-1-pdf-pronto.png');
  if (PRINTS) {
    // a mesma janela em retrato (tablet) e na largura de um celular
    await pag.setViewport({ width: 800, height: 1280, hasTouch: true });
    await print(pag, 'L1-1b-pdf-pronto-retrato-800x1280.png');
    await pag.setViewport({ width: 412, height: 915, hasTouch: true });
    await print(pag, 'L1-1c-pdf-pronto-412x915.png');
    await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
    await pausa(400);
  }

  // compartilhar com sucesso
  await pag.evaluate(() => document.querySelector('#bib-pdf-compartilhar-lista').click());
  const ok3 = await esperar('o compartilhar chamado', () => pag.evaluate(() => window.__share.chamadas.slice()), v => v && v.length === 1, 5000);
  conf('compartilhar a lista manda o arquivo da lista', ok3.ok && /lista.*\.pdf$/.test(ok3.valor[0]) && !/gabarito/.test(ok3.valor[0]), true);
  await pausa(300);
  conf('e não baixa nada', (await baixados(pag)).length, 0);
  conf('e a janela continua aberta', (await janelaPdf(pag)).aberta, true);

  // ela cancela (AbortError)
  await pag.evaluate(() => { window.__share.modo = 'AbortError'; document.querySelector('#bib-pdf-compartilhar-lista').click(); });
  const cancelou = await esperar('o aviso do cancelamento', () => avisoAgora(pag), v => !!v || false, 5000);
  await pausa(300);
  const baixou3 = await baixados(pag);
  if (MODO === '--envenenado-baixa-ao-cancelar') {
    secao('VENENO: cancelar volta a baixar escondido');
    conf('envenenado: o cancelar baixou o arquivo (defeito enxergado)', baixou3.length, 1);
    throw fim();
  }
  conf('cancelar o compartilhar não baixa nada', baixou3.length, 0);
  conf('e diz que o PDF continua ali', cancelou.valor, 'Envio cancelado. O PDF continua aqui.');
  conf('e a janela continua aberta', (await janelaPdf(pag)).aberta, true);

  // o prazo do toque venceu (NotAllowedError)
  await pag.evaluate(() => {
    document.querySelector('#aviso').classList.remove('aberto');
    window.__share.modo = 'NotAllowedError'; document.querySelector('#bib-pdf-compartilhar-gabarito').click();
  });
  const negou = await esperar('o aviso do prazo', () => avisoAgora(pag), v => !!v, 5000);
  await pausa(300);
  conf('o prazo do toque não baixa nada', (await baixados(pag)).length, 0);
  conf('e pede para tocar de novo', negou.valor, 'Toque de novo em compartilhar.');
  await pag.evaluate(() => { document.querySelector('#aviso').classList.remove('aberto'); document.querySelector('#bib-pdf-compartilhar-gabarito').click(); });
  const negou2 = await esperar('o aviso da segunda recusa', () => avisoAgora(pag), v => !!v, 5000);
  await pausa(300);
  conf('na segunda recusa seguida, sugere baixar, e ainda não baixa nada',
    negou2.valor + ' | ' + (await baixados(pag)).length, 'O compartilhar não abriu. Toque em baixar para guardar o PDF no tablet. | 0');

  // baixar
  await pag.evaluate(() => document.querySelector('#bib-pdf-baixar-gabarito').click());
  await pausa(300);
  const b3 = await baixados(pag);
  conf('baixar baixa exatamente o gabarito', b3.length === 1 && /gabarito.*\.pdf$/.test(b3[0]), true);
  conf('e diz para onde foi', await avisoAgora(pag), 'O PDF foi para a pasta Downloads.');

  // ver
  await pag.evaluate(() => document.querySelector('#bib-pdf-ver-lista').click());
  const leitor = await esperar('o leitor do aplicativo', () => pag.evaluate(() => ({
    aberto: document.querySelector('#modal-leitor-pdf').classList.contains('aberto'),
    titulo: document.querySelector('#titulo-modal-leitor-pdf').textContent,
    pagina: document.querySelector('#corpo-modal-leitor-pdf').dataset.paginaDesenhada || ''
  })), v => v && v.aberto && !!v.pagina, 30000);
  conf('ver abre a lista no leitor do aplicativo, com a página desenhada', leitor.ok && /lista.*\.pdf$/.test(leitor.valor.titulo), true);
  conf('sem o "Abrir como folha" (é só para conferir)', await pag.evaluate(() => document.querySelector('#leitor-como-folha').style.display), 'none');

  /* 3b. O VOLTAR DO APARELHO. A tela por baixo é guardada antes: a aba e o
   * começo do corpo da Biblioteca. O primeiro Voltar fecha só o leitor; o
   * segundo fecha a janela PDF pronto, e a tela continua a mesma. */
  const telaDaBiblioteca = () => pag.evaluate(() => (document.querySelector('#abas .aba.ativa') || { dataset: {} }).dataset.tela +
    ' | ' + ((document.querySelector('#bib-corpo') || {}).innerText || '').slice(0, 160));
  const telaAntes = await telaDaBiblioteca();
  await pag.evaluate(() => history.back());
  const leitorFechou = await esperar('o Voltar fechar o leitor', () => pag.evaluate(() =>
    !document.querySelector('#modal-leitor-pdf').classList.contains('aberto')), v => v === true, 5000);
  await pausa(400);
  conf('o Voltar com o leitor aberto fecha só o leitor', leitorFechou.ok, true);
  conf('e a janela PDF pronto continua', (await janelaPdf(pag)).aberta, true);
  conf('e ver não baixou nada', (await baixados(pag)).length, 1);
  // o leitor aberto por cima e fechado não esvazia a janela: os botões dela continuam funcionando
  conf('depois do ver, a janela continua montada, com os dois arquivos', (await janelaPdf(pag)).itens.length, 2);
  await pag.evaluate(() => document.querySelector('#bib-pdf-baixar-lista').click());
  await pausa(300);
  const b3b = await baixados(pag);
  conf('e o baixar dela ainda baixa a lista', b3b.length === 2 && /lista.*\.pdf$/.test(b3b[1]), true);
  await pag.evaluate(() => history.back());
  const fechou = await esperar('o Voltar fechar a janela PDF pronto', () => janelaPdf(pag), v => v && !v.aberta, 5000);
  await pausa(600);
  const telaDepois = await telaDaBiblioteca();
  if (MODO === '--envenenado-voltar') {
    secao('VENENO: a janela PDF pronto fora do histórico');
    conf('envenenado: o Voltar deixou a janela aberta ou trocou a tela por baixo (defeito enxergado)',
      !fechou.ok || telaDepois !== telaAntes, true);
    throw fim();
  }
  /* Fechada, a janela solta os PDFs: o corpo vazio é o sinal de que os botões
   * (e os arquivos que eles guardavam no toque) foram embora. */
  const corpoDaJanela = () => pag.evaluate(() => document.querySelector('#corpo-modal-bib-compartilhar').childElementCount + ' | ' +
    document.querySelectorAll('.bib-pdf-acao').length);
  const corpoVoltar = await corpoDaJanela();
  if (MODO === '--envenenado-guarda-pdf') {
    secao('VENENO: a janela fechada guarda os PDFs');
    conf('envenenado: fechada pelo Voltar, a janela continua com os botões e os PDFs (defeito enxergado)', corpoVoltar !== '0 | 0', true);
    throw fim();
  }
  conf('o Voltar seguinte fecha a janela PDF pronto', fechou.ok, true);
  conf('e a janela fechada pelo Voltar solta os PDFs: corpo vazio, nenhum botão', corpoVoltar, '0 | 0');
  conf('e a tela da Biblioteca por baixo continua a mesma', telaDepois, telaAntes);
  await pag.evaluate(() => { const b = document.querySelector('#modal-bib-compartilhar.aberto [data-fechar]'); if (b) b.click(); });
  await pausa(300);

  // ================================================================
  secao('4. Sem compartilhamento no aparelho, um arquivo só');
  await pag.evaluate(() => { window.__share.pode = false; window.__baixados = []; });
  conf('a janela Gerar material abriu', await abrirGerar(pag), true);
  await pag.evaluate(() => { const c = document.querySelector('#bib-gerar-gabarito'); c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); });
  await pag.evaluate(() => document.querySelector('#bib-gerar-baixar').click());
  const so = await esperar('a janela PDF pronto', () => janelaPdf(pag), v => v && v.aberta && v.itens.length > 0, 30000);
  const j4 = so.valor || { itens: [] };
  conf('um arquivo só, o material', j4.itens.map(i => i.parte).join(','), 'material');
  conf('sem o botão de compartilhar: baixar e ver', j4.itens.map(i => i.acoes.map(a => a.acao).join('+')).join(','), 'baixar+ver');
  conf('com os nomes do material', j4.itens.map(i => i.acoes.map(a => a.rotulo).join('|')).join(','), 'Baixar o material|Ver o material');
  conf('e nada foi baixado sozinho', (await baixados(pag)).length, 0);
  conf('reaberta depois de fechada, a janela funciona: baixar baixa o material', await pag.evaluate(() => {
    document.querySelector('#bib-pdf-baixar-material').click(); return window.__baixados.length; }), 1);
  await pag.evaluate(() => document.querySelector('#modal-bib-compartilhar [data-fechar]').click());
  await pausa(300);
  conf('fechada pelo X, a janela também solta os PDFs', await pag.evaluate(() =>
    document.querySelector('#corpo-modal-bib-compartilhar').childElementCount + ' | ' + document.querySelectorAll('.bib-pdf-acao').length), '0 | 0');

  // ================================================================
  secao('5. O tutorial, etapa 4, não manda imprimir');
  await pag.evaluate(() => document.querySelector('#btn-guia-listas').click());
  await esperar('o tutorial', () => pag.evaluate(() => document.querySelector('#modal-novidades').classList.contains('aberto')), v => v === true, 5000);
  await pag.evaluate(() => { const p = document.querySelectorAll('#carrossel-indicadores .carrossel-ponto'); p[p.length - 1].click(); });
  await pausa(300);
  const slide4 = await pag.evaluate(() => (document.querySelector('.carrossel-slide.ativo') || {}).innerText || '');
  conf('a etapa 4 está na tela', /Etapa 4 de 4/i.test(slide4), true);
  conf('e diz mandar ao aluno ou guardar no tablet, sem imprimir', /mande ao aluno ou guarde no tablet/i.test(slide4) && !/imprim|papel/i.test(slide4), true);
  await print(pag, 'L1-3-tutorial-etapa-4.png');

  secao('6. Nenhum erro');
  conf('nenhum erro de página', pag.errosDePagina.join(' | '), '');
  conf('nenhum pedido deu 404', amb.quatrocentos.join(', '), '');
})().then(() => H.fim(amb)(), e => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e)));
