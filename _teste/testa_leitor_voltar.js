/* testa_leitor_voltar.js
 *
 * A fatia 6 do leitor: voltar para onde eu estava. Depois de um SALTO de
 * navegação (o Sumário, o "Ir p." e a barra de página), aparece por 10 s o
 * botão "Voltar à p. 45", e o toque nele leva de volta ao mesmo trecho; vários
 * saltos formam uma pilha. No Chrome de verdade, com o livro SINTÉTICO de 400
 * páginas do gerador (biblioteca/_amostra/fazer_amostra_livros.py --leitor):
 * cada página diz o número dela, 10 capítulos no sumário (o capítulo 8 começa
 * na p. 281). Nenhum livro de verdade, nenhum nome de criança.
 *
 * A busca DENTRO do livro aberto ainda não existe (fatia 8 do plano), e o
 * arrastar pela borda também não (fatia 5): os saltos que existem são o
 * Sumário, o "Ir p." e a barra de página de baixo, e são os três provados.
 *
 * O que prova (tolerância declarada: TOLERANCIA_PX = 24 px, a do plano):
 *   1. rolar (passando de página), o "+" e o "Ajustar à largura" e a Próxima
 *      NÃO são salto: o botão não aparece;
 *   2. o "Ir p. 45" é salto: o botão aparece com "Voltar à p. 3", com alvo de
 *      pelo menos 48 px, e some sozinho em 10 s. A espera aqui é por tempo, de
 *      propósito, para medir os 10 s, com folga declarada: some entre 9,5 s e
 *      13 s (FOLGA_MS = 3000) depois do salto, medido dentro da página;
 *   3. na p. 45, uma rolagem de 300 px dentro da página (que não traz o botão
 *      de volta), e o Sumário até o capítulo 8: "Voltar à p. 45";
 *   4. mais dois saltos, cada um depois de uma rolagem dentro da página: o
 *      "Ir p. 120" ("Voltar à p. 281") e a barra até a p. 350 ("Voltar à
 *      p. 120");
 *   5. três voltas refazem o caminho: p. 120, p. 281 e p. 45, cada uma com o
 *      MESMO trecho no meio da área (o ponto do conteúdo que estava no meio
 *      antes do salto volta ao meio a menos de 24 px), e depois de cada volta o
 *      botão já oferece a anterior da pilha (a última oferece a p. 3); a
 *      posição gravada depois da última volta é a p. 45, a da leitura;
 *   6. a pilha vive só no leitor aberto: fechado e reaberto o livro, o botão
 *      não está lá, e depois de um salto novo e uma volta a pilha acaba (a
 *      p. 3 de antes foi esquecida);
 *   7. nenhum erro de página.
 *
 * Venenos (o app.js servido muda numa linha; cada um TEM de falhar pelo
 * critério dele, e a prova diz "VENENO visto" com o valor):
 *   --envenenado-volta-no-topo      a volta leva à página certa, mas ao alto
 *                                   dela: o trecho no meio fica longe (seção 5)
 *   --envenenado-pilha-de-um        a pilha guarda só o último salto: depois
 *                                   da primeira volta não há a segunda (seção 5)
 *   --envenenado-nao-some           o botão não some depois de 10 s (seção 2)
 *   --envenenado-aparece-na-rolagem a rolagem que troca a página do meio conta
 *                                   como salto e mostra o botão (seção 1)
 *   --controle-pai                  serve o app.js e o styles.css do commit pai
 *                                   (a39e13f, a main de onde a fatia saiu): os
 *                                   critérios TÊM de falhar (sem botão, sem volta)
 *
 *   --prints <pasta>  grava 3 prints para o painel cego: antes do salto, logo
 *                     depois dele com o botão à vista, e depois de voltar.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, esperar } = H;

const PORTA = 8973;
const TOLERANCIA_PX = 24;
const VOLTA_MS = 10000, FOLGA_MS = 3000, ANTES_MS = 500;
const PAI = 'a39e13f';
const VENENOS = {
  'volta-no-topo': ['var estado = leitor, ancora = estado.saltos.pop();',
    'var estado = leitor, ancora = estado.saltos.pop(); ancora = { n: ancora.n, fy: 0, fx: 0.5, alvoY: 0 };'],
  'pilha-de-um': ['leitor.saltos.push(origem);', 'leitor.saltos = [origem];'],
  'nao-some': ['leitorVoltaTimer = setTimeout(esconderVoltaDoLeitor, LEITOR_VOLTA_MS);', 'leitorVoltaTimer = null;'],
  'aparece-na-rolagem': ['leitor.ancora = ancoraDoLeitorContinuo(leitor, n);',
    'var antesDaRolagem = leitor.ancora; leitor.ancora = ancoraDoLeitorContinuo(leitor, n); if (antesDaRolagem && antesDaRolagem.n !== n) guardarSaltoDoLeitor(antesDaRolagem, n);']
};
const VENENO = Object.keys(VENENOS).find(k => process.argv.indexOf('--envenenado-' + k) !== -1) ||
  (process.argv.indexOf('--controle-pai') !== -1 ? 'controle-pai' : null);
const iPrints = process.argv.indexOf('--prints');
const PRINTS = iPrints > 0 ? process.argv[iPrints + 1] : null;
const PYTHON = process.env.PYTHON || 'python';

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const trocas = {};
let paiLido = null;
if (VENENO === 'controle-pai') {
  /* Extração que falha grita: sem o commit pai (clone raso), a prova reprova
   * com o nome, em vez de servir o app.js de agora e "falhar" por acaso. */
  try {
    const doPai = f => execFileSync('git', ['-C', H.RAIZ, 'show', PAI + ':' + f], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    paiLido = { app: doPai('app.js'), css: doPai('styles.css') };
    trocas['/app.js'] = paiLido.app;
    trocas['/styles.css'] = paiLido.css;
  } catch (e) { paiLido = null; }
} else if (VENENO) {
  trocas['/app.js'] = APP.split(VENENOS[VENENO][0]).join(VENENOS[VENENO][1]);
}

const amb = H.criarAmbiente(PORTA, 'perfil_leitor_voltar', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'leitor_voltar_'));
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
    Object.keys(VENENOS).map(k => k + ':' + (APP.split(VENENOS[k][0]).length - 1)).join(','),
    Object.keys(VENENOS).map(k => k + ':1').join(','));
  if (VENENO === 'controle-pai') {
    conf('o app.js e o styles.css do commit pai ' + PAI + ' foram lidos', !!paiLido, true);
    if (!paiLido) throw Object.assign(new Error('sem o commit pai'), { jaContado: true });
    conf('e o app.js do pai não tem a volta do salto (o controle é de verdade)', paiLido.app.indexOf('voltarDoSaltoDoLeitor') === -1, true);
  } else if (VENENO) {
    conf('o app.js servido está envenenado (' + VENENO + ')', trocas['/app.js'].indexOf(VENENOS[VENENO][1]) !== -1, true);
  }
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
  // o id do livro e as gravações da posição, para ler a gravada depois
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
  await clicar(pag, '#bib-livros .bibl-disciplina[data-disciplina="matematica"]');
  let achou = false;
  for (const ano of await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-livros .bibl-ano')).map(b => b.dataset.ano))) {
    await clicar(pag, '#bib-livros .bibl-ano[data-ano="' + ano + '"]');
    const r = await esperar('o livro no ano ' + ano, () => pag.evaluate(() => !!document.querySelector('#bib-livros [data-livro="livro-leitor-400"]')), v => v, 1500);
    if (r.ok && await clicar(pag, '#bib-livros [data-livro="livro-leitor-400"]')) { achou = true; break; }
  }
  conf('o livro de 400 páginas está na Biblioteca', achou, true);
  const abrirOLivro = async (rotulo, n) => {
    await esperar('a tela do livro', () => pag.evaluate(() => { const t = document.querySelector('#bib-livro'); return !!t && !t.hidden; }), v => v, 5000);
    await clicar(pag, '#bib-livro-continuar');
    return esperar(rotulo, () => pag.evaluate(() => {
      const c = document.querySelector('#corpo-modal-leitor-pdf');
      return document.querySelector('#modal-leitor-pdf.aberto') && c && c.querySelector('canvas') ? c.dataset.paginaDesenhada || '' : '';
    }), v => n === null ? !!v : v === String(n), 30000);
  };
  conf('o leitor abriu o livro na p. 1', (await abrirOLivro('o leitor aberto na p. 1', 1)).ok, true);

  // ---- as medidas
  const estadoDoLeitor = () => pag.evaluate(() => {
    const c = document.querySelector('#corpo-modal-leitor-pdf'), r = c.getBoundingClientRect();
    const meio = document.elementFromPoint(r.left + c.clientWidth / 2, r.top + c.clientHeight / 2);
    const caixa = meio && meio.closest('[data-pagina-arquivo]');
    const aVista = Array.from(c.querySelectorAll('.leitor-pdf-pagina')).filter(b => {
      const q = b.getBoundingClientRect(); return q.bottom > r.top + 1 && q.top < r.top + c.clientHeight - 1;
    });
    const malDesenhadas = aVista.filter(b => {
      const k = b.querySelector('canvas'); return !k || k.width === 0 || Math.abs(parseFloat(k.style.width) - b.getBoundingClientRect().width) > 2;
    }).map(b => b.dataset.paginaArquivo);
    const b = document.querySelector('#leitor-voltar-salto');
    const rb = b && !b.hidden ? b.getBoundingClientRect() : null;
    return { area: { x: r.left, y: r.top, w: c.clientWidth, h: c.clientHeight }, scrollTop: c.scrollTop,
      meio: caixa ? +caixa.dataset.paginaArquivo : null, largura: caixa ? caixa.getBoundingClientRect().width : null,
      contador: document.querySelector('#leitor-contador').textContent, malDesenhadas: malDesenhadas.join(','),
      botao: rb && rb.width > 0 ? { texto: b.textContent.trim(), w: rb.width, h: rb.height } : null };
  });
  // o ponto do conteúdo no meio da área: a página e a fração dentro dela
  const pontoNoMeio = () => pag.evaluate(() => {
    const c = document.querySelector('#corpo-modal-leitor-pdf'), r = c.getBoundingClientRect();
    const x = r.left + c.clientWidth / 2, y = r.top + c.clientHeight / 2;
    const e = document.elementFromPoint(x, y), caixa = e && e.closest('[data-pagina-arquivo]');
    if (!caixa) return null;
    const q = caixa.getBoundingClientRect();
    return { n: +caixa.dataset.paginaArquivo, fx: (x - q.left) / q.width, fy: (y - q.top) / q.height };
  });
  // a distância, na altura, entre aquele ponto do conteúdo e o meio da área agora
  const longeDoMeio = ponto => pag.evaluate(p => {
    const c = document.querySelector('#corpo-modal-leitor-pdf'), r = c.getBoundingClientRect();
    const q = document.querySelector('[data-pagina-arquivo="' + p.n + '"]').getBoundingClientRect();
    return Math.abs(q.top + p.fy * q.height - (r.top + c.clientHeight / 2));
  }, ponto);
  const contaDiz = (m, n) => new RegExp('(Página|p\\.) ' + n + ' de 400').test(m.contador);
  // a rolagem parada: scrollTop igual em dois quadros seguidos
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
  // a página n no meio, desenhada, e a rolagem parada
  const naPagina = async (rotulo, n) => {
    const r = await esperar(rotulo + ': a p. ' + n + ' no meio, desenhada', estadoDoLeitor, v => v.meio === n && v.malDesenhadas === '', 20000);
    await estavel(rotulo);
    return r;
  };
  // a rolagem de quem lê: muda o scrollTop e espera o leitor tratar (o evento e o quadro dele)
  const rolar = async (rotulo, px) => {
    await pag.evaluate(d => { document.querySelector('#corpo-modal-leitor-pdf').scrollTop += d; }, px);
    await estavel(rotulo);
    await pag.evaluate(() => new Promise(f => requestAnimationFrame(() => requestAnimationFrame(f))));
  };
  const irP = async n => pag.evaluate(v => { const i = document.querySelector('#leitor-ir-pagina'); i.value = String(v); i.dispatchEvent(new Event('change')); }, n);

  // checa: no modo normal é um conf; no veneno (e no controle), a falha do critério marcado é o que se quer ver
  const visto = [];
  const checa = (rotulo, obtido, esperado, deQuem) => {
    const dele = VENENO && (VENENO === 'controle-pai' || (deQuem || []).indexOf(VENENO) !== -1);
    if (VENENO) { if (dele && String(obtido) !== String(esperado)) visto.push(rotulo + ' [obtido: ' + obtido + ']'); return; }
    conf(rotulo, obtido, esperado);
  };
  const textoDoBotao = e => e.botao ? e.botao.texto : '(sem botão)';

  // ================================================================
  secao('1. Rolar, o zoom e a Próxima não são salto');
  const e1a = await estadoDoLeitor();
  const alturaDaPagina = await pag.evaluate(() => document.querySelector('[data-pagina-arquivo="1"]').getBoundingClientRect().height);
  // duas rolagens: a primeira dentro da p. 1, a segunda leva a p. 2 ao meio (a troca da página do meio)
  await rolar('meia página', Math.round(alturaDaPagina * 0.5));
  await rolar('mais uma página', Math.round(alturaDaPagina * 0.8));
  const e1 = await naPagina('a rolagem', 2);
  conf('rolar levou a p. 2 ao meio, e o contador nela', e1.ok && contaDiz(e1.valor, 2), true);
  checa('depois de rolar até a p. 2, o botão de voltar não aparece', textoDoBotao(await estadoDoLeitor()), '(sem botão)', ['aparece-na-rolagem']);
  await clicar(pag, '#leitor-mais');
  await esperar('o "+" aplicado', estadoDoLeitor, v => v.largura > e1a.largura + 10 && v.malDesenhadas === '', 8000);
  await clicar(pag, '#leitor-largura');
  await esperar('a volta à largura', estadoDoLeitor, v => Math.abs(v.largura - e1a.largura) <= 1 && v.malDesenhadas === '', 8000);
  await estavel('depois do zoom');
  checa('depois do "+" e do "Ajustar à largura", o botão não aparece', textoDoBotao(await estadoDoLeitor()), '(sem botão)', []);
  await clicar(pag, '#leitor-proxima');
  const e1c = await naPagina('a Próxima', 3);
  conf('a Próxima levou à p. 3', e1c.ok, true);
  checa('depois da Próxima, o botão não aparece', textoDoBotao(await estadoDoLeitor()), '(sem botão)', ['aparece-na-rolagem']);

  // ================================================================
  secao('2. O "Ir p. 45" é salto: o botão aparece, com 48 px, e some em 10 s');
  // o relógio da página marca o salto, a primeira vez que o botão está à vista e a que ele some
  await pag.evaluate(() => {
    window.__volta = { salto: performance.now(), viu: null, sumiu: null };
    window.__voltaOlho = setInterval(() => {
      const b = document.querySelector('#leitor-voltar-salto');
      const aVista = !!b && !b.hidden && b.getBoundingClientRect().width > 0;
      if (aVista && window.__volta.viu === null) window.__volta.viu = performance.now();
      if (!aVista && window.__volta.viu !== null && window.__volta.sumiu === null) window.__volta.sumiu = performance.now();
    }, 50);
  });
  await irP(45);
  const e2 = await naPagina('o Ir p. 45', 45);
  conf('o Ir p. leva à p. 45', e2.ok, true);
  const b2 = (await estadoDoLeitor()).botao;
  console.log('   botão: ' + (b2 ? '"' + b2.texto + '", ' + Math.round(b2.w) + ' x ' + Math.round(b2.h) + ' px' : 'nenhum'));
  checa('depois do Ir p. 45, o botão diz "Voltar à p. 3"', b2 ? b2.texto : '(sem botão)', 'Voltar à p. 3', []);
  checa('e o alvo de toque tem pelo menos 48 x 48 px', !!b2 && b2.w >= 48 && b2.h >= 48, true, []);
  // a espera por TEMPO, a única da prova: os 10 s, com folga declarada de 3 s
  const r2 = await esperar('o botão some sozinho (até ' + (VOLTA_MS + FOLGA_MS) / 1000 + ' s)', () => pag.evaluate(() => window.__volta),
    v => v && v.sumiu !== null, VOLTA_MS + FOLGA_MS);
  const vol = await pag.evaluate(() => { clearInterval(window.__voltaOlho); return window.__volta; });
  const durou = vol.sumiu !== null ? Math.round(vol.sumiu - vol.salto) : null;
  console.log('   o botão apareceu ' + (vol.viu === null ? 'nunca' : Math.round(vol.viu - vol.salto) + ' ms depois do salto') +
    ' e sumiu ' + (durou === null ? 'nunca, no prazo de ' + (VOLTA_MS + FOLGA_MS) + ' ms' : durou + ' ms depois do salto'));
  checa('o botão sumiu sozinho', r2.ok, true, ['nao-some']);
  checa('e durou de ' + (VOLTA_MS - ANTES_MS) + ' a ' + (VOLTA_MS + FOLGA_MS) + ' ms (10 s, folga de 3 s)',
    durou !== null && durou >= VOLTA_MS - ANTES_MS && durou <= VOLTA_MS + FOLGA_MS, true, ['nao-some']);

  // ================================================================
  secao('3. Na p. 45, uma rolagem dentro da página e o Sumário até o capítulo 8');
  await rolar('300 px dentro da p. 45', 300);
  const e3 = await estadoDoLeitor();
  conf('depois de rolar 300 px, a p. 45 continua no meio', e3.meio, 45);
  checa('e a rolagem não traz o botão de volta', textoDoBotao(e3), '(sem botão)', ['nao-some']);
  const p45 = await pontoNoMeio();
  console.log('   o trecho no meio: p. ' + p45.n + ', a ' + Math.round(p45.fy * 100) + '% da altura da página');
  if (PRINTS) await pag.screenshot({ path: path.join(PRINTS, '1_antes_do_salto_p45.png'), captureBeyondViewport: false });
  await clicar(pag, '#leitor-sumario');
  const s3 = await esperar('o sumário aberto', () => pag.evaluate(() => {
    const l = document.querySelector('#leitor-sumario-lista');
    return l && !l.hidden ? Array.from(l.querySelectorAll('button')).map(b => b.textContent) : null;
  }), v => !!v && v.some(t => /Capítulo 8/.test(t)), 5000);
  conf('o sumário mostra o capítulo 8', s3.ok, true);
  await pag.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#leitor-sumario-lista button')).find(x => /Capítulo 8/.test(x.textContent));
    b.click();
  });
  const e3b = await naPagina('o Sumário até o capítulo 8', 281);
  conf('o Sumário levou ao capítulo 8, na p. 281', e3b.ok, true);
  checa('depois do Sumário, o botão diz "Voltar à p. 45"', textoDoBotao(await estadoDoLeitor()), 'Voltar à p. 45', []);
  if (PRINTS) await pag.screenshot({ path: path.join(PRINTS, '2_logo_depois_do_salto_cap8.png'), captureBeyondViewport: false });

  // ================================================================
  secao('4. Mais dois saltos: o Ir p. 120 e a barra até a p. 350');
  await rolar('200 px dentro da p. 281', 200);
  const p281 = await pontoNoMeio();
  conf('o trecho guardado está na p. 281', p281 && p281.n, 281);
  await irP(120);
  conf('o Ir p. levou à p. 120', (await naPagina('o Ir p. 120', 120)).ok, true);
  checa('depois do Ir p. 120, o botão diz "Voltar à p. 281"', textoDoBotao(await estadoDoLeitor()), 'Voltar à p. 281', []);
  await rolar('150 px dentro da p. 120', 150);
  const p120 = await pontoNoMeio();
  conf('o trecho guardado está na p. 120', p120 && p120.n, 120);
  // a barra de página: o dedo arrasta (três movimentos) e solta
  await pag.evaluate(() => {
    const s = document.querySelector('#leitor-slider-pagina');
    [200, 300, 350].forEach(v => { s.value = String(v); s.dispatchEvent(new Event('input')); });
    s.dispatchEvent(new Event('change'));
  });
  conf('a barra levou à p. 350', (await naPagina('a barra até a p. 350', 350)).ok, true);
  checa('depois da barra, o botão diz "Voltar à p. 120" (a origem do arrasto, e não uma página do caminho)',
    textoDoBotao(await estadoDoLeitor()), 'Voltar à p. 120', []);

  // ================================================================
  secao('5. Três voltas refazem o caminho, com o mesmo trecho no meio');
  const antesDasVoltas = await pag.evaluate(() => window.__gravadas || 0);
  const caminho = [[120, p120, 'Voltar à p. 281', ['volta-no-topo']], [281, p281, 'Voltar à p. 45', ['volta-no-topo', 'pilha-de-um']],
    [45, p45, 'Voltar à p. 3', ['volta-no-topo', 'pilha-de-um']]];
  for (const [n, ponto, depois, deQuem] of caminho) {
    const e = await estadoDoLeitor();
    const tem = !!e.botao && e.botao.texto === 'Voltar à p. ' + n;
    checa('antes de voltar, o botão oferece a p. ' + n, textoDoBotao(e), 'Voltar à p. ' + n, ['pilha-de-um']);
    if (tem) await pag.tap('#leitor-voltar-salto');
    const r = tem ? await naPagina('a volta à p. ' + n, n) : { ok: false };
    const d = r.ok ? await longeDoMeio(ponto) : null;
    console.log('   volta à p. ' + n + ': ' + (r.ok ? 'o trecho guardado ficou a ' + d.toFixed(1) + ' px do meio' : 'não voltou'));
    checa('a volta leva à p. ' + n, r.ok, true, ['pilha-de-um']);
    checa('com o mesmo trecho no meio, a menos de ' + TOLERANCIA_PX + ' px (ficou a ' + (d === null ? '?' : d.toFixed(1)) + ' px)',
      d !== null && d < TOLERANCIA_PX, true, deQuem);
    if (n === 45 && PRINTS) await pag.screenshot({ path: path.join(PRINTS, '3_depois_de_voltar_p45.png'), captureBeyondViewport: false });
    checa('depois da volta à p. ' + n + ', o botão oferece a anterior da pilha ("' + depois + '")',
      textoDoBotao(await estadoDoLeitor()), depois, ['pilha-de-um']);
  }
  // a posição gravada é a da leitura: a p. 45, onde ela chegou
  const g5 = await esperar('a gravação da posição depois das voltas', () => pag.evaluate(() => ({ c: window.__gravadas || 0, p: window.__gravando || 0 })),
    v => v.c > antesDasVoltas && v.p === 0, 5000);
  const gravada = g5.ok ? await pag.evaluate(() => window.__idLivro ? Store.lerPosicaoLivro(window.__idLivro).then(r => r ? r.pagina : null) : null) : null;
  checa('a posição gravada depois das voltas é a p. 45, a da leitura', gravada, 45, []);

  // ================================================================
  secao('6. A pilha vive só no leitor aberto');
  await pag.evaluate(() => document.querySelector('#modal-leitor-pdf [data-fechar]').click());
  await esperar('o leitor fechado', () => pag.evaluate(() => !document.querySelector('#modal-leitor-pdf.aberto')), v => v, 5000);
  const reaberto = await abrirOLivro('o leitor reaberto', null);
  conf('o livro reabriu', reaberto.ok, true);
  checa('o livro reabre na p. 45 (a posição gravada)', reaberto.valor, '45', ['pilha-de-um']);
  await estavel('a reabertura');
  checa('reaberto o livro, o botão não está lá', textoDoBotao(await estadoDoLeitor()), '(sem botão)', ['nao-some']);
  await irP(60);
  await naPagina('o Ir p. 60', 60);
  checa('um salto novo oferece a p. 45', textoDoBotao(await estadoDoLeitor()), 'Voltar à p. 45', []);
  if ((await estadoDoLeitor()).botao) {
    await pag.tap('#leitor-voltar-salto');
    await naPagina('a volta à p. 45', 45);
  }
  checa('e depois dessa volta a pilha acaba: a p. 3 de antes foi esquecida', textoDoBotao(await estadoDoLeitor()), '(sem botão)', []);

  if (VENENO) {
    secao(VENENO === 'controle-pai' ? 'CONTROLE no commit pai ' + PAI : 'VENENO: ' + VENENO);
    if (visto.length) console.log((VENENO === 'controle-pai' ? 'CONTROLE visto: ' : 'VENENO visto: ') + visto.join(' ; '));
    if (VENENO === 'controle-pai') {
      // sem a fatia, os critérios centrais falham todos: o botão e as voltas
      conf('controle: sem a fatia, o botão não aparece depois do salto', visto.some(v => /^depois do Ir p\. 45/.test(v)), true);
      conf('controle: sem a fatia, a volta à p. 45 não acontece', visto.some(v => /^a volta leva à p\. 45/.test(v)), true);
    } else {
      conf('envenenado-' + VENENO + ': a prova viu o critério dele falhar', visto.length > 0, true);
    }
    await H.fim(amb)();
    return;
  }
  if (PRINTS) console.log('   prints em ' + PRINTS);
  conf('nenhum erro de página', errosDePagina.join(' | '), '');
  await H.fim(amb)();
})().catch(H.fim(amb));
