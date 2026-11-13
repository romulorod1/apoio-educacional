/* testa_voltar_entrada_velha.js
 *
 * O histórico volta ao estado anterior sem entrada sobrando, também depois de
 * recarregar.
 *
 * A causa da falha de 15 por cento da testa_relato_voltar.js: a entrada de uma
 * janela ({ apoioModal }) mora no histórico do navegador, e não na memória.
 * Quando a página recarrega com essa entrada à vista (o Android descarta a aba
 * do PWA com uma janela aberta, ou a recarga chega antes de o history.back()
 * do fechamento terminar, que é assíncrono), o documento novo nasce nela: a
 * janela já não existe, a pilha do documento novo está vazia, mas o
 * history.state ainda diz que há uma janela aberta, com o número dela. Toda
 * janela aberta e fechada depois volta para essa entrada velha, e o histórico
 * nunca fica sem janela. Na prova do relato, o recarregar que vem logo depois
 * de "falha de gravação" às vezes alcança o history.back() da aula ainda a
 * caminho; aí sobrava o { apoioModal: 7 } da aula fechada.
 *
 * O conserto: ao ligar o Voltar das telas, uma entrada de janela num
 * documento que ainda não abriu janela nenhuma passa a ser a entrada da tela
 * à vista. Esta prova não depende de sorte: recarrega com a janela aberta, o
 * que põe o documento novo na entrada da janela sempre, e também mostra
 * quantas vezes a corrida do fechamento aconteceu.
 *
 * Veneno (TEM de ser visto):
 *   --envenenado-entrada-velha   a entrada de janela que veio da recarga fica como estava
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador');
const { conf, secao, esperar } = H;

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const VENENOS_DA_PROVA = {
  'entrada-velha': ["      history.replaceState({ apoioTela: ++proximoPassoTela, retrato: retratoDaTela() }, '');\n    } else if (e.retrato",
    "      void 0;\n    } else if (e.retrato"]
};
const VENENO = Object.keys(VENENOS_DA_PROVA).find(k => process.argv.indexOf('--envenenado-' + k) !== -1) || null;
const trocas = {};
if (VENENO) trocas['/app.js'] = APP.split(VENENOS_DA_PROVA[VENENO][0]).join(VENENOS_DA_PROVA[VENENO][1]);
const RELOGIO = H.relogioDaRodada('2026-11-16', '11:00');
const amb = H.criarAmbiente(8886, 'nath_voltar_entrada_velha', trocas);

const visto = [];
const checa = (rotulo, obtido, esperado, venenos) => {
  if (VENENO) {
    if ((venenos || []).indexOf(VENENO) !== -1 && String(obtido) !== String(esperado)) visto.push(rotulo);
    return;
  }
  conf(rotulo, obtido, esperado);
};
const janelaNoHistorico = pag => pag.evaluate(() => (history.state && history.state.apoioModal) || null);

(async function () {
  secao('0. A prova se confere');
  conf('a âncora do veneno aparece uma vez só no app.js',
    Object.keys(VENENOS_DA_PROVA).map(k => k + ':' + (APP.split(VENENOS_DA_PROVA[k][0]).length - 1)).join(','),
    Object.keys(VENENOS_DA_PROVA).map(k => k + ':1').join(','));
  if (VENENO) conf('o app.js servido está envenenado (' + VENENO + ')', trocas['/app.js'].indexOf(VENENOS_DA_PROVA[VENENO][0]) === -1, true);

  await amb.subir();
  const pag = await amb.pagina();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  /* o estado em que o documento NASCEU, lido antes de o app rodar: é a
   * condição da prova, e não o resultado (sem ela, o resto não exercita nada) */
  await pag.evaluateOnNewDocument(() => {
    window.__estadoAoNascer = (history.state && history.state.apoioModal) || null;
  });
  await RELOGIO.naPagina(pag);
  await H.abrirApp(pag, amb.ORIGEM);
  await RELOGIO.conferir(pag);
  await pag.evaluate(async () => {
    const d = await Store.carregar();
    d.alunos = [{ id: 'ev_alfa', nome: 'Aluna Alfa Teste', ativo: true, precos: [] }];
    d.series = [];
    d.aulas = [{ id: 'ev_aula', alunoId: 'ev_alfa', data: Core.hojeIso(), hora: '10:00',
      duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', anexos: [] }];
    d.resumos = [];
    await Store.salvar(d);
  });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'agenda');

  secao('1. Recarregar com a janela aberta');
  await pag.click('[data-aula-id="ev_aula"]');
  const aberta = await esperar('aula aberta com entrada no histórico', () => janelaNoHistorico(pag), v => !!v, 5000);
  conf('a aula aberta tem entrada de janela no histórico', aberta.ok, true);
  await H.abrirApp(pag, amb.ORIGEM);
  conf('o documento novo nasceu na entrada da janela (a condição da prova)',
    !!(await pag.evaluate(() => window.__estadoAoNascer)), true);
  conf('nenhuma janela aberta depois de recarregar',
    await pag.evaluate(() => document.querySelectorAll('.fundo-modal.aberto').length), 0);
  checa('depois de recarregar, o histórico não diz que há janela aberta', await janelaNoHistorico(pag), null, ['entrada-velha']);

  secao('2. Abrir e fechar uma janela volta ao estado anterior');
  await H.irParaAba(pag, 'agenda');
  const antes = await janelaNoHistorico(pag);
  await pag.click('[data-aula-id="ev_aula"]');
  await esperar('aula aberta de novo', () => pag.$eval('#modal-aula', e => e.classList.contains('aberto')), Boolean, 5000);
  await pag.evaluate(() => history.back());
  const fechou = await esperar('Voltar fecha a aula', () => pag.$eval('#modal-aula', e => !e.classList.contains('aberto')), Boolean, 5000);
  conf('o Voltar fechou a aula', fechou.ok, true);
  const assentou = await esperar('histórico sem janela', () => janelaNoHistorico(pag), v => v === null, 3000);
  checa('o Voltar deixa o histórico sem janela aberta', assentou.ok, true, ['entrada-velha']);
  checa('o histórico volta ao estado de antes de abrir', String(await janelaNoHistorico(pag)), String(antes), []);
  checa('o estado de antes de abrir já era sem janela', antes, null, ['entrada-velha']);

  secao('3. A corrida do fechamento com a recarga');
  /* O fechamento à mão chama history.back(), que é assíncrono, e a recarga
   * vem no mesmo instante. Quando a recarga ganha, o documento novo nasce na
   * entrada da aula fechada: é o caso da prova do relato. Quantas vezes isso
   * acontece depende do navegador; o que a prova exige é que, acontecendo ou
   * não, o histórico fique sem janela. */
  let corridas = 0;
  for (let i = 0; i < 3; i++) {
    await pag.click('[data-aula-id="ev_aula"]');
    await esperar('aula aberta para a corrida', () => pag.$eval('#modal-aula', e => e.classList.contains('aberto')), Boolean, 5000);
    await pag.evaluate(() => { document.querySelector('#modal-aula .fechar').click(); location.reload(); });
    await esperar('o app de pé depois da recarga', () => pag.evaluate(() => !!document.querySelector('#abas .aba') && typeof Store === 'object'), Boolean, 20000);
    if (await pag.evaluate(() => window.__estadoAoNascer)) corridas++;
    const limpo = await esperar('histórico sem janela depois da corrida', () => janelaNoHistorico(pag), v => v === null, 3000);
    checa('corrida ' + (i + 1) + ': o histórico fica sem janela', limpo.ok, true, ['entrada-velha']);
    await H.irParaAba(pag, 'agenda');
  }
  /* sem veneno, nascer na entrada de janela aqui é a recarga que ganhou do history.back(); com
   * veneno, conta também a entrada velha de baixo, que nunca sai. A seção 1 é a que não depende disto. */
  console.log('   o documento nasceu numa entrada de janela em ' + corridas + ' de 3 recargas');

  if (VENENO) {
    secao('VENENO: ' + VENENO);
    conf('envenenado-' + VENENO + ': a prova viu o defeito', visto.length > 0, true);
    if (visto.length) console.log('VENENO visto: ' + visto.join(' ; '));
    return;
  }
  secao('4. Erros');
  conf('nenhum erro de página', erros.join(' | '), '');
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
