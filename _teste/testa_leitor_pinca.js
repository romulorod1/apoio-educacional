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
 *   4. um dedo só: a área deixa rolar (touch-action pan-x pan-y), nenhum
 *      touchmove de um dedo é cancelado pelo leitor, e o zoom não muda;
 *   5. dois dedos que só arrastam levam a página junto (100 px, ±3), sem
 *      zoom; a pinça de reduzir (zoom 3 a 1,5, com o ponto médio andando)
 *      segura o ponto a menos de 24 px;
 *   6. os limites: a pinça que pede menos de 0,5 para em 0,5 e a que pede
 *      mais de 4 para em 4 (largura conferida em px);
 *   7. a posição gravada nas bordas do livro: na p. 1, com a rolagem presa
 *      no alto, uma pinça com os dedos na p. 2 deixa gravada a página do meio
 *      (a 1), e não a dos dedos; no fim do livro, com os dedos na página de
 *      cima da área, a gravada também é a do meio (ali a altura do livro muda
 *      e a rolagem dispara de qualquer jeito, então só a p. 1 pega o veneno);
 *   8. deitado (1280x800), o duplo toque dobra a largura, e uma pinça de 120
 *      a 180 px a partir dali (zoom 2 a 3, com o ponto médio andando 20 px)
 *      também segura o ponto sob os dedos a menos de 24 px;
 *   9. nenhum erro de página.
 *
 * Venenos:
 *   node _teste/testa_leitor_pinca.js --envenenado-gesto-grava-pela-ancora
 *     o app.js servido volta ao de antes: o gesto grava a página sob os
 *     dedos. Na p. 1, a rolagem fica presa no alto, nenhum evento de
 *     rolagem corrige, e a seção 7 TEM de ver a p. 2 gravada.
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
  'gesto-sem-ponto': ['var ancora = ancoraNoPontoDoLeitor(estado, x, y, alvoX, alvoY);', 'var ancora = null;'],
  // o comportamento de antes: o gesto grava a página sob os dedos, e não a do meio
  'gesto-grava-pela-ancora': ['var vista = ancoraDada ? paginaMaisProximaDoCentro(estado) : ancora.n;', 'var vista = ancora.n;']
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
  // o id do livro, para ler a posição gravada depois (sai da gravação que o leitor faz)
  await pag.evaluate(() => {
    const original = Store.gravarPosicaoLivro;
    window.__gravando = 0;
    Store.gravarPosicaoLivro = function (pos) {
      if (pos && pos.id) window.__idLivro = pos.id;
      window.__gravando++;
      const fim = () => { window.__gravando--; window.__gravadas = (window.__gravadas || 0) + 1; };
      const p = original.apply(Store, arguments);
      Promise.resolve(p).then(fim, fim);
      return p;
    };
  });

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
  const contaDizNaPagina = (texto, n) => new RegExp('(Página|p\\.) ' + n + ' de 400').test(texto);
  /* ESPERAS POR CONDIÇÃO, e não por tempo. A primeira rodada do veneno
   * gesto-sem-ponto no CI só passou na segunda vez: as leituras vinham depois
   * de pausas fixas, e o duplo toque dependia de duas pausas caberem na
   * janela de 320 ms do app. Agora cada leitura espera o que ela precisa. */
  // a rolagem parada: scrollTop e scrollLeft iguais em dois quadros seguidos
  const estavel = rotulo => pag.evaluate(() => new Promise(fim => {
    const c = document.querySelector('#corpo-modal-leitor-pdf');
    let antes = null, iguais = 0, quadros = 0;
    const olha = () => {
      const agora = c.scrollTop + '|' + c.scrollLeft;
      iguais = agora === antes ? iguais + 1 : 0;
      antes = agora;
      if (iguais >= 2 || ++quadros > 240) { fim(iguais >= 2); return; }
      requestAnimationFrame(olha);
    };
    requestAnimationFrame(olha);
  })).then(ok => { if (!ok) conf((rotulo || 'a rolagem') + ' parou em até 240 quadros', false, true); return ok; });
  const irParaPagina = async n => {
    await pag.evaluate(v => { const i = document.querySelector('#leitor-ir-pagina'); i.value = String(v); i.dispatchEvent(new Event('change')); }, n);
    const r = await esperar('a página ' + n + ' no meio', estadoDoLeitor, v => v.meio === n && v.malDesenhadas === '', 20000);
    await estavel('a ida à p. ' + n);
    return r;
  };
  const redesenhado = async rotulo => {
    const r = await esperar(rotulo + ': as páginas à vista redesenhadas no tamanho novo', estadoDoLeitor,
      v => v.malDesenhadas === '' && v.transformadas === 0, 8000);
    await estavel(rotulo);
    return r;
  };
  /* depois de um gesto que muda o zoom: espera a largura MUDAR e o canvas novo
   * ficar pronto; um gesto que não pegou falha aqui, com o nome, e não numa
   * medida lida em cima do estado de antes */
  const depoisDoZoom = async (rotulo, larguraAntes) => {
    const r = await esperar(rotulo + ': a largura mudou e as páginas à vista foram redesenhadas', estadoDoLeitor,
      v => Math.abs(v.largura - larguraAntes) > 1 && v.malDesenhadas === '' && v.transformadas === 0, 8000);
    conf(rotulo + ': o zoom mudou e a página foi redesenhada', r.ok, true);
    await estavel(rotulo);
    return r;
  };

  // os dedos, pelo Chrome
  const toque = (tipo, pontos) => cdp.send('Input.dispatchTouchEvent', { type: tipo,
    touchPoints: pontos.map((p, i) => ({ x: Math.round(p.x), y: Math.round(p.y), id: i + 1, radiusX: 4, radiusY: 4, force: 1 })) });
  /* pinça horizontal em volta de (cx, cy): os dedos vão de d0 a d1 de distância
   * em `passos` movimentos, e o ponto médio anda (dx, dy) no caminho. Devolve
   * o que se viu depois do PRIMEIRO movimento e o ponto médio final. */
  const pinca = async (cx, cy, d0, d1, dx, dy, passos) => {
    await estavel('antes da pinça');
    const dedos = (t) => { const d = d0 + (d1 - d0) * t, mx = cx + dx * t, my = cy + dy * t;
      return [{ x: mx - d / 2, y: my }, { x: mx + d / 2, y: my }]; };
    await pag.evaluate(() => {
      window.__canvasNoGesto = 0;
      window.__criarOriginal = document.createElement;
      document.createElement = function (n) { if (String(n).toLowerCase() === 'canvas') window.__canvasNoGesto++; return window.__criarOriginal.apply(document, arguments); };
    });
    /* o primeiro quadro é medido DENTRO da página: no fim do primeiro
     * pointermove (o leitor já tratou, ele vem antes na subida), quantas
     * caixas já têm o transform e quanto tempo passou desde o evento. A volta
     * do CDP até o Node media a carga da máquina do CI, e não o leitor. */
    await pag.evaluate(() => {
      window.__primeiro = null;
      window.__olhaPrimeiro = e => {
        if (window.__primeiro || e.pointerType !== 'touch') return;
        const c = document.querySelector('#corpo-modal-leitor-pdf');
        window.__primeiro = { ms: performance.now() - e.timeStamp,
          transformadas: Array.from(c.querySelectorAll('.leitor-pdf-pagina')).filter(b => /scale/.test(b.style.transform)).length };
      };
      window.addEventListener('pointermove', window.__olhaPrimeiro);
    });
    await toque('touchStart', dedos(0));
    await toque('touchMove', dedos(1 / passos));
    const primeiro = await pag.evaluate(() => {
      window.removeEventListener('pointermove', window.__olhaPrimeiro);
      return window.__primeiro || { ms: Infinity, transformadas: 0 };
    });
    primeiro.ms = Math.round(primeiro.ms * 10) / 10;
    for (let i = 2; i <= passos; i++) await toque('touchMove', dedos(i / passos));
    const noFim = await pag.evaluate(() => ({ canvas: window.__canvasNoGesto, scrollTop: document.querySelector('#corpo-modal-leitor-pdf').scrollTop }));
    await toque('touchEnd', []);
    await pag.evaluate(() => { document.createElement = window.__criarOriginal; });
    const f = dedos(1);
    return { primeiro, noFim, fim: { x: (f[0].x + f[1].x) / 2, y: (f[0].y + f[1].y) / 2 } };
  };
  /* o duplo toque: quatro eventos seguidos, sem pausa. Com as pausas de antes
   * (40 + 90 + 40 ms mais a volta do CDP), numa máquina carregada os dois
   * toques podiam sair da janela de 320 ms do app e o gesto não pegava. */
  const toqueRapido = async (x, y) => { await toque('touchStart', [{ x, y }]); await toque('touchEnd', []); };
  const duploToque = async (x, y) => { await estavel('antes do duplo toque'); await toqueRapido(x, y); await toqueRapido(x, y); };
  const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // checa: no modo normal é um conf; no veneno, a falha da verificação marcada é o que se quer ver
  const visto = [];
  const checa = (rotulo, obtido, esperado, doVeneno) => {
    // doVeneno: true é o gesto-sem-ponto; um nome é o veneno daquela verificação
    const deQuem = doVeneno === true ? 'gesto-sem-ponto' : doVeneno;
    if (VENENO) { if (deQuem === VENENO && String(obtido) !== String(esperado)) visto.push(rotulo + ' [obtido: ' + obtido + ']'); return; }
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
  conf('e isso em menos de 50 ms (do evento ao fim do tratamento, medido na página)', g1.primeiro.ms < 50, true);
  conf('durante o gesto, nenhum canvas novo foi criado', g1.noFim.canvas, 0);
  conf('durante o gesto, a rolagem não se mexeu (o navegador não rolou junto)', Math.abs(g1.noFim.scrollTop - e0.scrollTop) < 1, true);
  const r1 = await depoisDoZoom('a pinça', e0.largura);
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
  await depoisDoZoom('a volta à largura depois da pinça', e1.largura);
  await irParaPagina(120);
  e0 = await estadoDoLeitor();
  conf('de volta à largura antes do duplo toque', Math.abs(e0.largura - a206.valor.largura) <= 1, true);
  const q = { x: e0.area.x + e0.area.w * 0.30, y: e0.area.y + e0.area.h * 0.35 };
  const sob2 = await pontoDoConteudo(q.x, q.y);
  await duploToque(q.x, q.y);
  await depoisDoZoom('o duplo toque', e0.largura);
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
  await depoisDoZoom('o segundo duplo toque', e2.largura);
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
  // controle: os toques chegam à área como ponteiro pen (senão a verificação abaixo não prova nada)
  await pag.evaluate(() => { window.__tiposCaneta = []; window.__olhaCaneta = e => window.__tiposCaneta.push(e.pointerType);
    document.querySelector('#corpo-modal-leitor-pdf').addEventListener('pointerdown', window.__olhaCaneta); });
  const caneta = async (tipo, x, y) => cdp.send('Input.dispatchMouseEvent', { type: tipo, x: Math.round(x), y: Math.round(y),
    button: 'left', buttons: tipo === 'mousePressed' ? 1 : 0, clickCount: 1, pointerType: 'pen' });
  for (let i = 0; i < 2; i++) { await caneta('mousePressed', q.x, q.y); await pausa(40); await caneta('mouseReleased', q.x, q.y); await pausa(90); }
  await estavel('depois da caneta');
  const depoisCaneta = await estadoDoLeitor();
  const tiposCaneta = await pag.evaluate(() => { document.querySelector('#corpo-modal-leitor-pdf').removeEventListener('pointerdown', window.__olhaCaneta); return window.__tiposCaneta.join(','); });
  conf('os dois toques chegaram à área como ponteiro pen', tiposCaneta, 'pen,pen');
  conf('dois toques rápidos da caneta deixam a largura igual', Math.abs(depoisCaneta.largura - antesCaneta.largura) <= 1, true);
  conf('e a rolagem igual', Math.abs(depoisCaneta.scrollTop - antesCaneta.scrollTop) < 1, true);

  // ================================================================
  secao('4. Um dedo continua rolando, sem zoom');
  /* No Chrome sem janela do CI, o toque sintético não rola a área (o
   * synthesizeScrollGesture andou 0 px na primeira rodada). O que o leitor
   * decide, e a prova trava, é não segurar a rolagem: a área deixa o dedo
   * rolar (touch-action) e nenhum touchmove de um dedo é cancelado. A rolagem
   * em si é medida e dita, sem reprovar. */
  const antesDedo = await estadoDoLeitor();
  await pag.evaluate(() => {
    window.__movidos = 0; window.__cancelados = 0;
    window.__contaToque = e => { if (e.touches.length === 1) { window.__movidos++; if (e.defaultPrevented) window.__cancelados++; } };
    window.addEventListener('touchmove', window.__contaToque, { passive: true });
  });
  const yd = antesDedo.area.y + antesDedo.area.h * 0.7;
  await toque('touchStart', [{ x: q.x, y: yd }]);
  for (let i = 1; i <= 12; i++) await toque('touchMove', [{ x: q.x, y: yd - i * 35 }]);
  await toque('touchEnd', []);
  await estavel('depois do arrasto de um dedo');
  const dedo = await pag.evaluate(() => {
    window.removeEventListener('touchmove', window.__contaToque, { passive: true });
    return { movidos: window.__movidos, cancelados: window.__cancelados,
      acao: getComputedStyle(document.querySelector('#corpo-modal-leitor-pdf')).touchAction };
  });
  const depoisDedo = await estadoDoLeitor();
  console.log('   um dedo: ' + dedo.movidos + ' movimentos, ' + dedo.cancelados + ' cancelados; a rolagem andou ' +
    Math.round(depoisDedo.scrollTop - antesDedo.scrollTop) + ' px (dito, não reprova)');
  conf('a área de leitura deixa o dedo rolar nos dois sentidos (touch-action)', dedo.acao, 'pan-x pan-y');
  conf('o arrasto de um dedo chegou à página', dedo.movidos > 0, true);
  conf('e nenhum movimento de um dedo foi segurado pelo leitor', dedo.cancelados, 0);
  conf('e não muda o zoom', Math.abs(depoisDedo.largura - antesDedo.largura) <= 1, true);

  // ================================================================
  secao('5. Pinça de reduzir, em pé, do zoom 3 a 1,5');
  const wBase = a206.valor.largura;
  await irParaPagina(150);
  let s5 = await estadoDoLeitor();
  // dois dedos que só arrastam (a distância não muda): a página anda junto, sem zoom
  await pinca(s5.area.x + s5.area.w * 0.5, s5.area.y + s5.area.h * 0.6, 150, 150, 0, -100, 8);
  await esperar('o arrasto de dois dedos chegou à rolagem', estadoDoLeitor, v => Math.abs(v.scrollTop - s5.scrollTop) > 50, 5000);
  await estavel('depois do arrasto de dois dedos');
  const pan = await estadoDoLeitor();
  console.log('   dois dedos arrastando 100 px para cima: a rolagem andou ' + Math.round(pan.scrollTop - s5.scrollTop) + ' px');
  conf('arrastar dois dedos sem abrir nem fechar leva a página junto (100 px, ±3)', Math.abs(pan.scrollTop - s5.scrollTop - 100) <= 3, true);
  conf('e não muda o zoom', Math.abs(pan.largura - s5.largura) <= 1, true);
  s5 = pan;
  await duploToque(s5.area.x + s5.area.w * 0.5, s5.area.y + s5.area.h * 0.45);
  await depoisDoZoom('o duplo toque na p. 150', s5.largura);
  s5 = await estadoDoLeitor();
  await pinca(s5.area.x + s5.area.w * 0.5, s5.area.y + s5.area.h * 0.5, 120, 180, 0, 0, 8);
  await depoisDoZoom('a pinça até o zoom 3', s5.largura);
  const z3 = await estadoDoLeitor();
  conf('antes de reduzir, a página está no zoom 3 (±5%)', z3.largura / wBase > 2.85 && z3.largura / wBase < 3.15, true);
  const c6 = { x: z3.area.x + z3.area.w * 0.45, y: z3.area.y + z3.area.h * 0.55 };
  const sob6 = await pontoDoConteudo(c6.x, c6.y);
  const g6 = await pinca(c6.x, c6.y, 180, 90, 10, -15, 10);
  await depoisDoZoom('a pinça de reduzir', z3.largura);
  const z15 = await estadoDoLeitor();
  const dv6 = distancia(await ondeEsta(sob6), g6.fim);
  console.log('   reduzir: largura ' + Math.round(z3.largura) + ' -> ' + Math.round(z15.largura) + ' px; o ponto a ' + dv6.toFixed(1) + ' px do centro dos dedos');
  conf('a pinça de 180 a 90 px reduziu a largura à metade (±5%)', z15.largura / z3.largura > 0.475 && z15.largura / z3.largura < 0.525, true);
  checa('reduzindo, o ponto sob os dedos fica sob o centro a menos de ' + TOLERANCIA_PX + ' px', dv6 < TOLERANCIA_PX, true, true);

  // ================================================================
  secao('6. Os limites do zoom: 0,5 e 4');
  let s6 = await estadoDoLeitor();
  await pinca(s6.area.x + s6.area.w * 0.5, s6.area.y + s6.area.h * 0.5, 240, 30, 0, 0, 10);
  await depoisDoZoom('a pinça abaixo do mínimo', s6.largura);
  const zMin = await estadoDoLeitor();
  console.log('   pedindo 1,5 x 0,125: largura ' + Math.round(zMin.largura) + ' px (a largura é ' + Math.round(wBase) + ')');
  conf('a pinça que pede menos de 0,5 para em 0,5 (largura à metade, ±2 px)', Math.abs(zMin.largura - wBase * 0.5) <= 2, true);
  await clicar(pag, '#leitor-largura');
  await depoisDoZoom('a volta à largura', zMin.largura);
  s6 = await estadoDoLeitor();
  await pinca(s6.area.x + s6.area.w * 0.5, s6.area.y + s6.area.h * 0.5, 40, 240, 0, 0, 10);
  await depoisDoZoom('a pinça acima do máximo', s6.largura);
  const zMax = await estadoDoLeitor();
  console.log('   pedindo 1 x 6: largura ' + Math.round(zMax.largura) + ' px');
  conf('a pinça que pede mais de 4 para em 4 (largura 4 vezes, ±4 px)', Math.abs(zMax.largura - wBase * 4) <= 4, true);
  await clicar(pag, '#leitor-largura');
  await depoisDoZoom('a volta à largura depois do máximo', zMax.largura);

  // ================================================================
  secao('7. A posição gravada nas bordas do livro');
  /* A GRAVAÇÃO DO GESTO, medida sem depender do evento de rolagem. Na
   * máquina 2, o veneno escapou 1 vez em 10: a gravação errada do gesto
   * (p. 2) foi coberta por uma gravação certa vinda de um evento de rolagem
   * tardio, e a prova leu a p. 1, que era também a posição de antes. Agora:
   *   - o evento de rolagem do leitor fica segurado durante a medida (fase de
   *     captura no documento), e quem grava é só o gesto;
   *   - antes do gesto, o leitor e a posição gravada estão numa página
   *     DIFERENTE da do meio (Ir p. 2 e depois a rolagem ao alto, sem evento);
   *   - a prova espera uma gravação NOVA (o contador de concluídas sobe e não
   *     sobra nenhuma pendente). Sem ela no prazo, reprova com o nome, sem ler
   *     o valor velho. */
  const segurarRolagem = liga => pag.evaluate(l => {
    if (l) {
      window.__seguraRolagem = e => { if (e.target && e.target.id === 'corpo-modal-leitor-pdf') e.stopImmediatePropagation(); };
      document.addEventListener('scroll', window.__seguraRolagem, true);
    } else if (window.__seguraRolagem) {
      document.removeEventListener('scroll', window.__seguraRolagem, true);
      delete window.__seguraRolagem;
    }
  }, liga);
  const lerPosicao = () => pag.evaluate(() => window.__idLivro ? Store.lerPosicaoLivro(window.__idLivro).then(r => r ? r.pagina : null) : null);
  const contagemDeGravacoes = () => pag.evaluate(() => ({ concluidas: window.__gravadas || 0, pendentes: window.__gravando || 0 }));
  // espera uma gravação a mais que `antes` e nenhuma pendente; devolve null se o prazo estourar
  const gravacaoNova = async (rotulo, antes) => {
    const r = await esperar(rotulo + ': uma gravação nova da posição', contagemDeGravacoes,
      v => v.concluidas > antes && v.pendentes === 0, 3000);
    return r.ok ? lerPosicao() : null;
  };
  /* põe o leitor na página `n` (contador e posição gravada) e depois rola, sem
   * evento, até `rolar` (0 é o alto, 'fim' é o fim): a página do meio passa a
   * ser outra, e o leitor ainda acha que é a `n` */
  const prepararBorda = async (rotulo, n, rolar) => {
    await segurarRolagem(true);
    const antes = (await contagemDeGravacoes()).concluidas;
    await pag.evaluate(v => { const i = document.querySelector('#leitor-ir-pagina'); i.value = String(v); i.dispatchEvent(new Event('change')); }, n);
    const g = await gravacaoNova(rotulo + ', o Ir p. ' + n, antes);
    conf(rotulo + ': antes do gesto, a posição gravada é a p. ' + n, g, n);
    await pag.evaluate(r => { const c = document.querySelector('#corpo-modal-leitor-pdf'); c.scrollTop = r === 'fim' ? c.scrollHeight : r; }, rolar);
    await estavel(rotulo);
    const e = await estadoDoLeitor();
    conf(rotulo + ': o contador ainda diz a p. ' + n + ' (a rolagem não chegou ao leitor)', contaDiz(e, n), true);
    return e;
  };
  // zoom 0,5 e depois 0,6: a p. 1 e o alto da p. 2 cabem juntos na área
  await irParaPagina(1);
  s6 = await estadoDoLeitor();
  await pinca(s6.area.x + s6.area.w * 0.5, s6.area.y + s6.area.h * 0.5, 240, 30, 0, 0, 8);
  await depoisDoZoom('o zoom 0,5 na p. 1', s6.largura);
  s6 = await estadoDoLeitor();
  await pinca(s6.area.x + s6.area.w * 0.5, s6.area.y + s6.area.h * 0.5, 150, 180, 0, 0, 6);
  await depoisDoZoom('o zoom 0,6 na p. 1', s6.largura);
  // ---- o alto do livro: o leitor na p. 2, a rolagem em 0 (a p. 1 no meio), os dedos na p. 2
  const s7 = await prepararBorda('no alto', 2, 0);
  const alto = await pag.evaluate(() => {
    const c = document.querySelector('#corpo-modal-leitor-pdf'), r = c.getBoundingClientRect();
    const p2 = document.querySelector('[data-pagina-arquivo="2"]').getBoundingClientRect();
    return { scrollTop: c.scrollTop, p2: p2.top, fundo: r.top + c.clientHeight };
  });
  const yDedos = alto.p2 + 40;
  conf('no alto do livro (rolagem em 0), com a p. 1 no meio', alto.scrollTop + '|' + s7.meio, '0|1');
  conf('e o alto da p. 2 à vista, onde os dedos vão', yDedos < alto.fundo - 10, true);
  let antes7 = (await contagemDeGravacoes()).concluidas;
  await pinca(s7.area.x + s7.area.w * 0.5, yDedos, 180, 150, 0, 0, 6);
  await depoisDoZoom('a pinça com os dedos na p. 2', s7.largura);
  const pos7 = await gravacaoNova('a pinça no alto', antes7);
  const d7 = await estadoDoLeitor();
  console.log('   no alto: a rolagem ficou em ' + Math.round(d7.scrollTop) + ' px, a p. ' + d7.meio + ' no meio, a gravação do gesto: ' + (pos7 === null ? 'nenhuma no prazo' : 'p. ' + pos7));
  conf('a pinça reduziu a página (a troca aconteceu)', d7.largura < s7.largura - 10, true);
  checa('perto da p. 1, o gesto gravou uma posição nova', pos7 !== null, true, 'gesto-grava-pela-ancora');
  if (pos7 !== null) checa('e ela é a página do meio (a 1), e não a dos dedos', pos7 + '|' + d7.meio, '1|1', 'gesto-grava-pela-ancora');
  checa('e o contador diz a página do meio', contaDiz(d7, d7.meio), true, 'gesto-grava-pela-ancora');
  await segurarRolagem(false);
  // ---- o fim do livro: o leitor na p. 399, a rolagem no fim (a p. 400 no meio), os dedos na p. 399
  const s8 = await prepararBorda('no fim', 399, 'fim');
  const cima = await pontoDoConteudo(s8.area.x + s8.area.w * 0.5, s8.area.y + 30);
  console.log('   no fim: a p. ' + s8.meio + ' no meio, a p. ' + (cima && cima.n) + ' no alto da área');
  conf('no fim, a p. 400 no meio e a p. 399 no alto da área, onde os dedos vão', s8.meio + '|' + (cima && cima.n), '400|399');
  const antes8 = (await contagemDeGravacoes()).concluidas;
  await pinca(s8.area.x + s8.area.w * 0.5, s8.area.y + 30, 150, 180, 0, 0, 6);
  await depoisDoZoom('a pinça no fim do livro', s8.largura);
  const pos8 = await gravacaoNova('a pinça no fim', antes8);
  const d8 = await estadoDoLeitor();
  console.log('   no fim: a p. ' + d8.meio + ' no meio, a gravação do gesto: ' + (pos8 === null ? 'nenhuma no prazo' : 'p. ' + pos8));
  checa('no fim do livro, o gesto gravou uma posição nova', pos8 !== null, true, 'gesto-grava-pela-ancora');
  if (pos8 !== null) checa('e ela é a página do meio, e não a dos dedos', pos8 + '|' + (pos8 === d8.meio), '400|true', 'gesto-grava-pela-ancora');
  checa('e o contador diz a página do meio', contaDiz(d8, d8.meio), true, 'gesto-grava-pela-ancora');
  await segurarRolagem(false);
  void antes7;
  await clicar(pag, '#leitor-largura');
  await depoisDoZoom('a volta à largura no fim', d8.largura);

  // ================================================================
  secao('8. Deitado: duplo toque e pinça a partir do zoom 2');
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true, deviceScaleFactor: 1 });
  // o giro: espera a página alargar para a janela deitada e ser redesenhada (o app redesenha 250 ms depois do resize)
  await depoisDoZoom('o giro para deitado', wBase);
  await irParaPagina(300);
  if (PRINTS) await pag.screenshot({ path: path.join(PRINTS, 'deitado_antes_do_duplo_toque.png') });
  let d0 = await estadoDoLeitor();
  const q5 = { x: d0.area.x + d0.area.w * 0.62, y: d0.area.y + d0.area.h * 0.45 };
  await duploToque(q5.x, q5.y);
  await depoisDoZoom('o duplo toque deitado', d0.largura);
  if (PRINTS) await pag.screenshot({ path: path.join(PRINTS, 'deitado_depois_do_duplo_toque.png') });
  d0 = await estadoDoLeitor();
  conf('deitado, o duplo toque dobrou a largura (±5%)', d0.largura / (await pag.evaluate(() => document.querySelector('#corpo-modal-leitor-pdf').clientWidth - 36)) > 1.9, true);
  const c5 = { x: d0.area.x + d0.area.w * 0.40, y: d0.area.y + d0.area.h * 0.60 };
  const sob5 = await pontoDoConteudo(c5.x, c5.y);
  const g5 = await pinca(c5.x, c5.y, 120, 180, -20, 0, 10);
  await depoisDoZoom('a pinça deitada', d0.largura);
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
