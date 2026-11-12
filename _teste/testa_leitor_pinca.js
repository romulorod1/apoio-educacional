/* testa_leitor_pinca.js
 *
 * A fatia 2 do leitor: pinça e duplo toque no livro aberto, com o zoom
 * ancorado no ponto. No Chrome de verdade, com o livro SINTÉTICO de 400
 * páginas do gerador (biblioteca/_amostra/fazer_amostra_livros.py --leitor):
 * cada página diz o número dela, 10 capítulos no sumário. Nenhum livro de
 * verdade, nenhum nome de criança.
 *
 * Os dedos são toques de verdade do Chrome (CDP Input.dispatchTouchEvent),
 * que viram pointerdown, pointermove e pointerup com pointerType touch e os
 * touchstart e touchmove do navegador, como no tablet.
 *
 * O que prova (tolerância declarada: TOLERANCIA_PX = 24 px, a mesma da fatia 1):
 *   1. pinça na p. 206, tablet em pé (800x1280), fora do meio da tela, com os
 *      dedos indo de 120 px a 240 px de distância e o ponto médio andando
 *      30 px: durante o gesto, as caixas à vista são esticadas por transform
 *      no primeiro movimento (em menos de 50 ms, sem nenhum canvas novo) e a
 *      rolagem não se mexe; ao soltar, a largura da página dobra (±5%), o
 *      ponto do conteúdo que estava sob o ponto médio dos dedos fica sob o
 *      ponto médio final a menos de 24 px, e a página do meio e o contador
 *      continuam na 206; as páginas à vista são redesenhadas no tamanho novo;
 *   2. duplo toque na largura, na p. 120, fora do meio: a largura vai ao
 *      dobro (±5%) e o ponto tocado vai ao meio da área a menos de 24 px;
 *      outro duplo toque no meio volta à largura (±1 px), com o ponto tocado
 *      sob o dedo a menos de 24 px na altura e a p. 120 no meio;
 *   3. a caneta (ponteiro pen, dois toques rápidos) não muda o zoom;
 *   4. um dedo só continua rolando, sem zoom;
 *   5. deitado (1280x800), o duplo toque dobra a largura, e uma pinça de 120
 *      a 180 px a partir dali (zoom 2 a 3, com o ponto médio andando 20 px)
 *      também segura o ponto sob os dedos a menos de 24 px;
 *   6. nenhum erro de página.
 *
 * Veneno:
 *   node _teste/testa_leitor_pinca.js --envenenado-gesto-sem-ponto
 *     o app.js servido faz o zoom do gesto com a âncora do MEIO da tela, e
 *     não a do ponto dos dedos: a pinça fora do meio e o duplo toque têm de
 *     deixar o ponto longe do lugar dele, e a prova TEM de ver ("VENENO visto").
 *
 *   --prints <pasta>   grava 4 prints para o painel cego: em pé antes e depois
 *                      da pinça, deitado antes e depois do duplo toque.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8971;
const TOLERANCIA_PX = 24;
const VENENOS_GESTO = {
  // o zoom do gesto ancorado no meio da tela, como os botões, e não no ponto dos dedos
  'gesto-sem-ponto': ['var ancora = ancoraNoPontoDoLeitor(estado, x, y, alvoX, alvoY);', 'var ancora = null;']
};
const VENENO = Object.keys(VENENOS_GESTO).find(k => process.argv.indexOf('--envenenado-' + k) !== -1) || null;
const iPrints = process.argv.indexOf('--prints');
const PRINTS = iPrints > 0 ? process.argv[iPrints + 1] : null;
const PYTHON = process.env.PYTHON || 'python';

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const trocas = {};
if (VENENO) trocas['/app.js'] = APP.split(VENENOS_GESTO[VENENO][0]).join(VENENOS_GESTO[VENENO][1]);

const amb = H.criarAmbiente(PORTA, 'perfil_leitor_pinca', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'leitor_pinca_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

function gerarLivro() {
  const r = spawnSync(PYTHON, ['-X', 'utf8', path.join(H.RAIZ, 'biblioteca', '_amostra', 'fazer_amostra_livros.py'), TMP, '--leitor'],
    { encoding: 'utf8' });
  const linhas = String(r.stdout || '').trim().split(/\r?\n/);
  const zip = linhas[linhas.length - 1];
  if (r.status !== 0 || !zip || !fs.existsSync(zip)) { console.log(String(r.stderr || '').slice(0, 800)); return null; }
  return zip;
}

const clicar = (pag, sel) => pag.evaluate(s => { const b = document.querySelector(s); if (!b) return false; b.click(); return true; }, sel);

(async () => {
  secao('0. A prova se confere');
  conf('cada âncora de veneno aparece uma vez só no app.js',
    Object.keys(VENENOS_GESTO).map(k => k + ':' + (APP.split(VENENOS_GESTO[k][0]).length - 1)).join(','),
    Object.keys(VENENOS_GESTO).map(k => k + ':1').join(','));
  if (VENENO) conf('o app.js servido está envenenado (' + VENENO + ')', trocas['/app.js'].indexOf(VENENOS_GESTO[VENENO][0]) === -1, true);
  const zip = gerarLivro();
  conf('o livro sintético de 400 páginas foi gerado', !!zip, true);
  if (!zip) throw Object.assign(new Error('sem o livro'), { jaContado: true });
  if (PRINTS) fs.mkdirSync(PRINTS, { recursive: true });

  await amb.subir();
  const pag = await amb.pagina();
  const errosDePagina = [];
  pag.on('pageerror', e => errosDePagina.push(e.message));
  pag.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errosDePagina.push(m.text()); });
  await pag.setViewport({ width: 800, height: 1280, hasTouch: true, deviceScaleFactor: 1 });
  await H.abrirApp(pag, amb.ORIGEM);
  const cdp = await pag.target().createCDPSession();

  // ---- importar e abrir o livro
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => { document.querySelector('#estado-importacao-biblioteca').innerHTML = ''; });
  await (await pag.$('#arquivo-biblioteca')).uploadFile(zip);
  await esperar('a importação do livro', () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca');
    return [c ? c.innerText.trim() : '', document.querySelector('#importar-biblioteca').disabled];
  }), v => !!v[0] && !/Conferindo|Gravando/.test(v[0]) && v[1] === false, 60000);
  await H.irParaAba(pag, 'biblioteca');
  await esperar('a aba Biblioteca desenhada', () => pag.evaluate(() => !!document.querySelector('#bib-corpo').children.length), v => v, 10000);
  await pausa(300);
  await clicar(pag, '#bib-livros .bibl-disciplina[data-disciplina="matematica"]');
  let achou = false;
  for (const ano of await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-livros .bibl-ano')).map(b => b.dataset.ano))) {
    await clicar(pag, '#bib-livros .bibl-ano[data-ano="' + ano + '"]');
    await pausa(150);
    if (await clicar(pag, '#bib-livros [data-livro="livro-leitor-400"]')) { achou = true; break; }
  }
  conf('o livro de 400 páginas está na Biblioteca', achou, true);
  await esperar('a tela do livro', () => pag.evaluate(() => { const t = document.querySelector('#bib-livro'); return !!t && !t.hidden; }), v => v, 5000);
  await clicar(pag, '#bib-livro-continuar');
  const aberto = await esperar('o leitor aberto na p. 1', () => pag.evaluate(() => {
    const c = document.querySelector('#corpo-modal-leitor-pdf');
    return document.querySelector('#modal-leitor-pdf.aberto') && c ? c.dataset.paginaDesenhada || '' : '';
  }), v => v === '1', 30000);
  conf('o leitor abriu o livro na p. 1', aberto.ok, true);

  // ---- as medidas
  // a área de leitura, a página no meio, a largura da caixa, o contador e as caixas à vista sem canvas no tamanho certo
  const estadoDoLeitor = () => pag.evaluate(() => {
    const c = document.querySelector('#corpo-modal-leitor-pdf'), r = c.getBoundingClientRect();
    const meio = document.elementFromPoint(r.left + c.clientWidth / 2, r.top + c.clientHeight / 2);
    const caixa = meio && meio.closest('[data-pagina-arquivo]');
    const aVista = Array.from(c.querySelectorAll('.leitor-pdf-pagina')).filter(b => {
      const q = b.getBoundingClientRect(); return q.bottom > r.top + 1 && q.top < r.top + c.clientHeight - 1;
    });
    // desenhada = canvas do tamanho da caixa (o esticado do gesto ainda não conta)
    const malDesenhadas = aVista.filter(b => {
      const k = b.querySelector('canvas'); return !k || k.width === 0 || Math.abs(parseFloat(k.style.width) - b.getBoundingClientRect().width) > 2;
    }).map(b => b.dataset.paginaArquivo);
    return { area: { x: r.left, y: r.top, w: c.clientWidth, h: c.clientHeight }, scrollTop: c.scrollTop, scrollLeft: c.scrollLeft,
      meio: caixa ? +caixa.dataset.paginaArquivo : null, largura: caixa ? caixa.getBoundingClientRect().width : null,
      contador: document.querySelector('#leitor-contador').textContent, malDesenhadas: malDesenhadas.join(','),
      transformadas: aVista.filter(b => b.style.transform).length };
  });
  // o ponto do conteúdo sob (x, y): a página e a fração dentro dela
  const pontoDoConteudo = (x, y) => pag.evaluate((x, y) => {
    const e = document.elementFromPoint(x, y), caixa = e && e.closest('[data-pagina-arquivo]');
    if (!caixa) return null;
    const r = caixa.getBoundingClientRect();
    return { n: +caixa.dataset.paginaArquivo, fx: (x - r.left) / r.width, fy: (y - r.top) / r.height };
  }, x, y);
  // onde aquele ponto do conteúdo está agora na tela
  const ondeEsta = ponto => pag.evaluate(p => {
    const caixa = document.querySelector('[data-pagina-arquivo="' + p.n + '"]');
    const r = caixa.getBoundingClientRect();
    return { x: r.left + p.fx * r.width, y: r.top + p.fy * r.height };
  }, ponto);
  const contaDiz = (m, n) => new RegExp('(Página|p\\.) ' + n + ' de 400').test(m.contador);
  const irParaPagina = async n => {
    await pag.evaluate(v => { const i = document.querySelector('#leitor-ir-pagina'); i.value = String(v); i.dispatchEvent(new Event('change')); }, n);
    const r = await esperar('a página ' + n + ' no meio', estadoDoLeitor, v => v.meio === n && v.malDesenhadas === '', 20000);
    await pausa(400);
    return r;
  };
  const redesenhado = rotulo => esperar(rotulo + ': as páginas à vista redesenhadas no tamanho novo', estadoDoLeitor,
    v => v.malDesenhadas === '' && v.transformadas === 0, 8000);

  // os dedos, pelo Chrome
  const toque = (tipo, pontos) => cdp.send('Input.dispatchTouchEvent', { type: tipo,
    touchPoints: pontos.map((p, i) => ({ x: Math.round(p.x), y: Math.round(p.y), id: i + 1, radiusX: 4, radiusY: 4, force: 1 })) });
  /* pinça horizontal em volta de (cx, cy): os dedos vão de d0 a d1 de distância
   * em `passos` movimentos, e o ponto médio anda (dx, dy) no caminho. Devolve
   * o que se viu depois do PRIMEIRO movimento e o ponto médio final. */
  const pinca = async (cx, cy, d0, d1, dx, dy, passos) => {
    const dedos = (t) => { const d = d0 + (d1 - d0) * t, mx = cx + dx * t, my = cy + dy * t;
      return [{ x: mx - d / 2, y: my }, { x: mx + d / 2, y: my }]; };
    await pag.evaluate(() => {
      window.__canvasNoGesto = 0;
      window.__criarOriginal = document.createElement;
      document.createElement = function (n) { if (String(n).toLowerCase() === 'canvas') window.__canvasNoGesto++; return window.__criarOriginal.apply(document, arguments); };
    });
    await toque('touchStart', dedos(0));
    await pausa(30);
    const t0 = Date.now();
    await toque('touchMove', dedos(1 / passos));
    const primeiro = await pag.evaluate(() => {
      const c = document.querySelector('#corpo-modal-leitor-pdf');
      return { transformadas: Array.from(c.querySelectorAll('.leitor-pdf-pagina')).filter(b => /scale/.test(b.style.transform)).length };
    });
    primeiro.ms = Date.now() - t0;
    for (let i = 2; i <= passos; i++) { await toque('touchMove', dedos(i / passos)); await pausa(16); }
    const noFim = await pag.evaluate(() => ({ canvas: window.__canvasNoGesto, scrollTop: document.querySelector('#corpo-modal-leitor-pdf').scrollTop }));
    await toque('touchEnd', []);
    await pag.evaluate(() => { document.createElement = window.__criarOriginal; });
    const f = dedos(1);
    return { primeiro, noFim, fim: { x: (f[0].x + f[1].x) / 2, y: (f[0].y + f[1].y) / 2 } };
  };
  const toqueRapido = async (x, y) => { await toque('touchStart', [{ x, y }]); await pausa(40); await toque('touchEnd', []); };
  const duploToque = async (x, y) => { await toqueRapido(x, y); await pausa(90); await toqueRapido(x, y); };
  const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // checa: no modo normal é um conf; no veneno, a falha da verificação marcada é o que se quer ver
  const visto = [];
  const checa = (rotulo, obtido, esperado, doVeneno) => {
    if (VENENO) { if (doVeneno && String(obtido) !== String(esperado)) visto.push(rotulo + ' [obtido: ' + obtido + ']'); return; }
    conf(rotulo, obtido, esperado);
  };

  // ================================================================
  secao('1. Pinça na p. 206, em pé, fora do meio da tela');
  const a206 = await irParaPagina(206);
  conf('o Ir p. leva à p. 206, no meio da tela', a206.ok, true);
  let e0 = await estadoDoLeitor();
  if (PRINTS) await pag.screenshot({ path: path.join(PRINTS, 'em_pe_antes_da_pinca.png') });
  // o centro dos dedos a 35% da largura e 40% da altura da área: longe do meio
  const c1 = { x: e0.area.x + e0.area.w * 0.35, y: e0.area.y + e0.area.h * 0.40 };
  const sob1 = await pontoDoConteudo(c1.x, c1.y);
  conf('há uma página sob o centro dos dedos', !!sob1, true);
  const g1 = await pinca(c1.x, c1.y, 120, 240, 30, 20, 10);
  console.log('   primeiro movimento: ' + g1.primeiro.transformadas + ' caixas esticadas, ' + g1.primeiro.ms + ' ms');
  conf('no primeiro movimento, as caixas à vista já estão esticadas por transform', g1.primeiro.transformadas > 0, true);
  conf('e isso em menos de 50 ms (medido do envio do toque à leitura)', g1.primeiro.ms < 50, true);
  conf('durante o gesto, nenhum canvas novo foi criado', g1.noFim.canvas, 0);
  conf('durante o gesto, a rolagem não se mexeu (o navegador não rolou junto)', Math.abs(g1.noFim.scrollTop - e0.scrollTop) < 1, true);
  const r1 = await redesenhado('a pinça');
  conf('depois da pinça, as páginas à vista estão redesenhadas', r1.ok, true);
  let e1 = await estadoDoLeitor();
  const razao1 = e1.largura / e0.largura;
  console.log('   largura ' + Math.round(e0.largura) + ' -> ' + Math.round(e1.largura) + ' px (razão ' + razao1.toFixed(3) + ')');
  conf('a pinça de 120 a 240 px dobrou a largura da página (±5%)', razao1 > 1.9 && razao1 < 2.1, true);
  const agora1 = await ondeEsta(sob1);
  const dv1 = distancia(agora1, g1.fim);
  console.log('   o ponto sob os dedos ficou a ' + dv1.toFixed(1) + ' px do centro dos dedos');
  checa('o ponto do conteúdo sob o centro dos dedos fica sob o centro a menos de ' + TOLERANCIA_PX + ' px', dv1 < TOLERANCIA_PX, true, true);
  checa('a p. 206 continua no meio, com o contador nela', e1.meio + '|' + contaDiz(e1, 206), '206|true', false);
  if (PRINTS) await pag.screenshot({ path: path.join(PRINTS, 'em_pe_depois_da_pinca.png') });

  // ================================================================
  secao('2. Duplo toque na p. 120: vai ao dobro com o ponto no meio, e volta');
  await clicar(pag, '#leitor-largura');
  await pausa(600);
  await irParaPagina(120);
  e0 = await estadoDoLeitor();
  conf('de volta à largura antes do duplo toque', Math.abs(e0.largura - a206.valor.largura) <= 1, true);
  const q = { x: e0.area.x + e0.area.w * 0.30, y: e0.area.y + e0.area.h * 0.35 };
  const sob2 = await pontoDoConteudo(q.x, q.y);
  await duploToque(q.x, q.y);
  await redesenhado('o duplo toque');
  const e2 = await estadoDoLeitor();
  const razao2 = e2.largura / e0.largura;
  const meio2 = { x: e2.area.x + e2.area.w / 2, y: e2.area.y + e2.area.h / 2 };
  const dv2 = distancia(await ondeEsta(sob2), meio2);
  console.log('   duplo toque: largura ' + Math.round(e0.largura) + ' -> ' + Math.round(e2.largura) + ' px; o ponto tocado a ' + dv2.toFixed(1) + ' px do meio');
  conf('o duplo toque dobrou a largura (±5%)', razao2 > 1.9 && razao2 < 2.1, true);
  checa('o ponto tocado foi ao meio da área a menos de ' + TOLERANCIA_PX + ' px', dv2 < TOLERANCIA_PX, true, true);
  // o segundo duplo toque, no meio (onde o ponto está agora): volta à largura
  const sob3 = await pontoDoConteudo(meio2.x, meio2.y);
  await duploToque(meio2.x, meio2.y);
  await redesenhado('o segundo duplo toque');
  const e3 = await estadoDoLeitor();
  const agora3 = await ondeEsta(sob3);
  const dv3 = Math.abs(agora3.y - meio2.y);
  console.log('   segundo duplo toque: largura ' + Math.round(e3.largura) + ' px; o ponto tocado andou ' + dv3.toFixed(1) + ' px na altura');
  conf('o segundo duplo toque voltou à largura (±1 px)', Math.abs(e3.largura - e0.largura) <= 1, true);
  checa('e o ponto tocado ficou sob o dedo a menos de ' + TOLERANCIA_PX + ' px na altura', dv3 < TOLERANCIA_PX, true, true);
  checa('a página não fugiu: a p. 120 no meio, com o contador nela', e3.meio + '|' + contaDiz(e3, 120), '120|true', false);

  // ================================================================
  secao('3. A caneta não dá zoom');
  const antesCaneta = await estadoDoLeitor();
  const caneta = async (tipo, x, y) => cdp.send('Input.dispatchMouseEvent', { type: tipo, x: Math.round(x), y: Math.round(y),
    button: 'left', buttons: tipo === 'mousePressed' ? 1 : 0, clickCount: 1, pointerType: 'pen' });
  for (let i = 0; i < 2; i++) { await caneta('mousePressed', q.x, q.y); await pausa(40); await caneta('mouseReleased', q.x, q.y); await pausa(90); }
  await pausa(800);
  const depoisCaneta = await estadoDoLeitor();
  conf('dois toques rápidos da caneta deixam a largura igual', Math.abs(depoisCaneta.largura - antesCaneta.largura) <= 1, true);
  conf('e a rolagem igual', Math.abs(depoisCaneta.scrollTop - antesCaneta.scrollTop) < 1, true);

  // ================================================================
  secao('4. Um dedo continua rolando, sem zoom');
  const antesDedo = await estadoDoLeitor();
  await cdp.send('Input.synthesizeScrollGesture', { x: Math.round(q.x), y: Math.round(antesDedo.area.y + antesDedo.area.h * 0.7),
    yDistance: -400, gestureSourceType: 'touch', speed: 800 });
  await pausa(700);
  const depoisDedo = await estadoDoLeitor();
  console.log('   um dedo: a rolagem andou ' + Math.round(depoisDedo.scrollTop - antesDedo.scrollTop) + ' px');
  conf('arrastar um dedo rola a página para baixo', depoisDedo.scrollTop - antesDedo.scrollTop > 100, true);
  conf('e não muda o zoom', Math.abs(depoisDedo.largura - antesDedo.largura) <= 1, true);

  // ================================================================
  secao('5. Deitado: duplo toque e pinça a partir do zoom 2');
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true, deviceScaleFactor: 1 });
  await pausa(900);
  await irParaPagina(300);
  if (PRINTS) await pag.screenshot({ path: path.join(PRINTS, 'deitado_antes_do_duplo_toque.png') });
  let d0 = await estadoDoLeitor();
  const q5 = { x: d0.area.x + d0.area.w * 0.62, y: d0.area.y + d0.area.h * 0.45 };
  await duploToque(q5.x, q5.y);
  await redesenhado('o duplo toque deitado');
  if (PRINTS) await pag.screenshot({ path: path.join(PRINTS, 'deitado_depois_do_duplo_toque.png') });
  d0 = await estadoDoLeitor();
  conf('deitado, o duplo toque dobrou a largura (±5%)', d0.largura / (await pag.evaluate(() => document.querySelector('#corpo-modal-leitor-pdf').clientWidth - 36)) > 1.9, true);
  const c5 = { x: d0.area.x + d0.area.w * 0.40, y: d0.area.y + d0.area.h * 0.60 };
  const sob5 = await pontoDoConteudo(c5.x, c5.y);
  const g5 = await pinca(c5.x, c5.y, 120, 180, -20, 0, 10);
  await redesenhado('a pinça deitada');
  const d5 = await estadoDoLeitor();
  const razao5 = d5.largura / d0.largura;
  const dv5 = distancia(await ondeEsta(sob5), g5.fim);
  console.log('   deitado: largura ' + Math.round(d0.largura) + ' -> ' + Math.round(d5.largura) + ' px; o ponto a ' + dv5.toFixed(1) + ' px do centro dos dedos');
  conf('a pinça de 120 a 180 px aumentou a largura em 1,5 vez (±5%)', razao5 > 1.425 && razao5 < 1.575, true);
  checa('deitado, o ponto sob os dedos fica sob o centro a menos de ' + TOLERANCIA_PX + ' px', dv5 < TOLERANCIA_PX, true, true);

  if (VENENO) {
    secao('VENENO: ' + VENENO);
    conf('envenenado-' + VENENO + ': a prova viu o ponto fora do lugar', visto.length > 0, true);
    if (visto.length) console.log('VENENO visto: ' + visto.join(' ; '));
    await H.fim(amb)();
    return;
  }
  if (PRINTS) console.log('   prints em ' + PRINTS);
  conf('nenhum erro de página', errosDePagina.join(' | '), '');
  await H.fim(amb)();
})().catch(H.fim(amb));
