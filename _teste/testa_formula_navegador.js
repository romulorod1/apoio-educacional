/* testa_formula_navegador.js (D2: as fórmulas em vetor no navegador; Chrome)
 *
 * O formula.js carrega o MathJax (vendor/mathjax-4.1.3/mathjax-svg.min.js, 2,5
 * MB) só quando um documento tem fórmula, pelo Formula.pronto(), e o sw.js o
 * guarda no BAIXADOS, como o leitor de PDF. Esta prova afirma, no aplicativo de
 * verdade, servido por HTTP e com o service worker no comando:
 *
 *   1. abrir o aplicativo e gerar um PDF sem fórmula NÃO pede o vendor na rede,
 *      não executa o MathJax (Formula.estado().cargas 0, sem MathJaxDoApp) e
 *      não o põe em cache nenhum;
 *   2. a primeira lista com fórmula, com a CPU 4 vezes mais lenta (CDP
 *      Emulation.setCPUThrottlingRate) e o vendor fora do cache: as fórmulas
 *      montam, o vendor é pedido uma vez e vai para o BAIXADOS;
 *   3. a mesma lista, 4 vezes mais lenta, com o vendor em cache e a rede
 *      cortada no servidor: sai igual, sem tentar a rede;
 *   4. e 5. o mesmo com a CPU 6 vezes mais lenta (o vendor apagado do BAIXADOS
 *      antes do 4, para a primeira vez valer de novo);
 *   em cada rodada, a lista tem 33 fórmulas do corpus (metade em bloco, metade
 *   dentro da frase), e registra: o tempo do pronto() (carga mais conversão de
 *   antemão), o da geração do PDF depois dele, e se o aviso "Preparando as
 *   fórmulas..." (o aoDemorar, depoisDe 3000) disparou. Passa quando: nenhuma
 *   fórmula falha; o aviso dispara se e só se o pronto() passou de 3 s (com 150
 *   ms de folga dos dois lados); e a geração depois do pronto() fica abaixo de 3
 *   s (senão a espera sem aviso volta). Os tempos são registro, não limite
 *   (um teto de 60 s pega só o travamento).
 *   6. nenhum erro de página.
 *
 *   node _teste/testa_formula_navegador.js [--resultado <arquivo.json>]
 *
 * Com --resultado, grava os tempos de cada rodada em JSON (sem nada da
 * máquina além do modelo da CPU e da memória). Porta 8883.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador');

const amb = H.criarAmbiente(8883, 'nath_d2_formula_navegador');
const { conf, secao, esperar } = H;
const iRes = process.argv.indexOf('--resultado');
const RESULTADO = iRes > 0 ? process.argv[iRes + 1] : null;

const VENDOR = '/vendor/mathjax-4.1.3/mathjax-svg.min.js';
const BAIXADOS = 'apoio-educacional-baixados';
const corpus = JSON.parse(fs.readFileSync(path.join(__dirname, 'dados', 'corpus_notacao.json'), 'utf8'));
const LISTA = corpus.filter((x, i) => i % 12 === 0).map(x => x.latex);   // 33 do corpus, de todas as séries

/* Onde o vendor está guardado, cache por cache. */
const ondeEstaOVendor = pag => pag.evaluate(async v => {
  const onde = [];
  for (const n of await caches.keys()) {
    const c = await caches.open(n);
    if ((await c.keys()).some(r => r.url.indexOf(v) >= 0)) onde.push(n.replace(/v\d+$/, 'vN'));
  }
  return onde.join(' ');
}, VENDOR);

/* Uma lista com fórmula, como a D3 vai gerar: pronto() com as fórmulas do
 * documento e o gancho do aviso, e depois a geração síncrona. */
async function rodada(pag, cdp, taxa, rotulo) {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: taxa });
  let r;
  try {
    r = await pag.evaluate(async lista => {
      const formulas = lista.map((l, i) => ({ latex: l, display: i % 2 === 0 }));
      let aviso = null;
      const t0 = performance.now();
      await Formula.pronto({ formulas, depoisDe: 3000, aoDemorar: () => { aviso = performance.now() - t0; } });
      const tPronto = performance.now() - t0;
      const t1 = performance.now();
      const d = new PDFGen.Doc();
      d.novaPagina();
      lista.forEach((l, i) => {
        if (i % 2) {
          d.escreverRico('Questão ' + (i + 1) + '. Calcule \\(' + l + '\\) e confira.', { tam: 11 });
        } else {
          d.escreverRico('Questão ' + (i + 1) + '.', { tam: 11 });
          d.equacao(l, { tam: 11 });
        }
      });
      const bytes = d.finalizar();
      const tGerar = performance.now() - t1;
      return { tPronto: Math.round(tPronto), tGerar: Math.round(tGerar), aviso: aviso == null ? null : Math.round(aviso),
        bytes: bytes.length, paginas: d.paginas.length, falharam: (d.formulasQueFalharam || []).map(f => f.latex + ' (' + f.motivo + ')'),
        cargas: Formula.estado().cargas };
    }, LISTA);
  } finally {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  }
  r.rotulo = rotulo;
  r.cpu = taxa + 'x';
  console.log('   ' + rotulo + ': pronto() ' + r.tPronto + ' ms, geração ' + r.tGerar + ' ms, aviso ' +
    (r.aviso == null ? 'não disparou' : 'disparou aos ' + r.aviso + ' ms') + ', ' + r.paginas + ' páginas, ' + r.bytes + ' bytes');
  conf(rotulo + ': as ' + LISTA.length + ' fórmulas montaram', r.falharam, []);
  const passou = r.tPronto > 3000 + 150, ficou = r.tPronto < 3000 - 150;
  conf(rotulo + ': o aviso dispara se e só se o pronto() passou de 3 s',
    passou ? r.aviso !== null : (ficou ? r.aviso === null : 'na fronteira, não decide'), passou || ficou ? true : 'na fronteira, não decide');
  conf(rotulo + ': a geração depois do pronto() fica abaixo de 3 s (a espera sem aviso)', r.tGerar < 3000, true);
  conf(rotulo + ': nada travou (pronto mais geração abaixo de 60 s)', r.tPronto + r.tGerar < 60000, true);
  return r;
}

(async () => {
  await amb.subir();
  const pag = await amb.pagina();
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  const pedidosDoVendor = [];
  pag.on('request', q => { if (q.url().indexOf('/vendor/mathjax') >= 0) pedidosDoVendor.push(q.url()); });
  await H.abrirApp(pag, amb.ORIGEM);
  await esperar('o sw.js controla a página', () => pag.evaluate(() => !!navigator.serviceWorker.controller), v => v === true, 20000);
  await H.abrirApp(pag, amb.ORIGEM);
  const cdp = await pag.target().createCDPSession();
  const rodadas = [];

  // ================================================================
  secao('1. Abrir o aplicativo e gerar PDF sem fórmula não traz o MathJax');
  conf('a lista de fórmulas da rodada tem 30 ou mais', LISTA.length >= 30, true);
  conf('o formula.js e o tradutor estão na página (são do pacote)', await pag.evaluate(() =>
    typeof Formula === 'object' && typeof Formula.pronto === 'function' && typeof SvgParaPdf === 'object'), true);
  const semFormula = await pag.evaluate(() => {
    const d = new PDFGen.Doc();
    d.novaPagina();
    d.escreverRico('Texto sem fórmula nenhuma: x^{2}, π · r, uma seta → e **negrito**.', { tam: 11 });
    const b = d.finalizar();
    return { bytes: b.length, cargas: Formula.estado().cargas, mj: typeof MathJaxDoApp,
      script: !!document.querySelector('script[src*="mathjax"]') };
  });
  conf('o PDF sem fórmula saiu', semFormula.bytes > 1000, true);
  conf('e o MathJax não foi pedido nem executado', [semFormula.cargas, semFormula.mj, semFormula.script], [0, 'undefined', false]);
  conf('nenhum pedido do vendor na abertura nem no PDF sem fórmula', pedidosDoVendor.length, 0);
  conf('e o vendor não está em cache nenhum', await ondeEstaOVendor(pag), '');

  // ================================================================
  secao('2. Primeira lista com fórmula, CPU 4x, vendor fora do cache');
  rodadas.push(await rodada(pag, cdp, 4, 'CPU 4x, vendor fora do cache'));
  conf('o vendor foi pedido uma vez', pedidosDoVendor.length, 1);
  conf('e ficou no BAIXADOS, e não no cache da versão', await ondeEstaOVendor(pag), BAIXADOS);

  // ================================================================
  secao('3. CPU 4x, vendor em cache, rede cortada');
  await H.abrirApp(pag, amb.ORIGEM);
  conf('depois de recarregar, o MathJax não está carregado', await pag.evaluate(() => Formula.estado().cargas), 0);
  amb.cortados.length = 0;
  amb.cortado = true;
  rodadas.push(await rodada(pag, cdp, 4, 'CPU 4x, vendor em cache'));
  amb.cortado = false;
  conf('o vendor não tentou a rede (veio do BAIXADOS)', amb.cortados.filter(c => c.indexOf('/vendor/') === 0), []);

  // ================================================================
  secao('4. CPU 6x, vendor fora do cache');
  await pag.evaluate(async (n, v) => {
    const c = await caches.open(n);
    for (const r of await c.keys()) if (r.url.indexOf(v) >= 0) await c.delete(r);
  }, BAIXADOS, VENDOR);
  conf('controle: o vendor saiu do BAIXADOS', await ondeEstaOVendor(pag), '');
  await pag.setCacheEnabled(false);
  await H.abrirApp(pag, amb.ORIGEM);
  const antes6 = pedidosDoVendor.length;
  rodadas.push(await rodada(pag, cdp, 6, 'CPU 6x, vendor fora do cache'));
  await pag.setCacheEnabled(true);
  conf('o vendor foi pedido de novo, uma vez', pedidosDoVendor.length - antes6, 1);
  conf('e voltou ao BAIXADOS', await ondeEstaOVendor(pag), BAIXADOS);

  // ================================================================
  secao('5. CPU 6x, vendor em cache, rede cortada');
  await H.abrirApp(pag, amb.ORIGEM);
  amb.cortados.length = 0;
  amb.cortado = true;
  rodadas.push(await rodada(pag, cdp, 6, 'CPU 6x, vendor em cache'));
  amb.cortado = false;
  conf('o vendor não tentou a rede (veio do BAIXADOS)', amb.cortados.filter(c => c.indexOf('/vendor/') === 0), []);

  // ================================================================
  secao('6. Nenhum erro');
  conf('nenhum erro de página', pag.errosDePagina.join(' | '), '');

  console.log('\n   rodada                          pronto()  geração  aviso');
  rodadas.forEach(r => console.log('   ' + (r.rotulo + '                                ').slice(0, 32) +
    String(r.tPronto).padStart(7) + ' ' + String(r.tGerar).padStart(8) + '  ' + (r.aviso == null ? 'não' : 'aos ' + r.aviso + ' ms')));
  if (RESULTADO) {
    fs.writeFileSync(RESULTADO, JSON.stringify({
      prova: 'testa_formula_navegador', quando: new Date().toISOString(), formulas: LISTA.length,
      cpu: (os.cpus()[0] || {}).model || '?', memoriaGB: Math.round(os.totalmem() / 1e9), rodadas
    }, null, 2));
    console.log('   resultado gravado em ' + RESULTADO);
  }
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
