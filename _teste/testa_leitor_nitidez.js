/* testa_leitor_nitidez.js
 *
 * A fatia 3 do leitor: nítido em qualquer zoom e mais rápido no escaneado. No
 * Chrome de verdade, com densidade de tela 2 (a do tablet), e com dois livros
 * SINTÉTICOS do gerador (biblioteca/_amostra/fazer_amostra_livros.py
 * --nitidez): o de 400 páginas do leitor (cada página diz o número dela) e um
 * "escaneado" de 12 páginas, cada uma uma imagem JPEG da página inteira, sem
 * texto. Nenhum livro de verdade, nenhum nome de criança.
 *
 * Medidas (as mesmas do DIAGNOSTICO_E_PLANO do leitor):
 *   nitidez        pixels de canvas por pixel de tela no ponto medido: o
 *                  maior entre os canvases que cobrem o ponto (o de detalhe
 *                  fica por cima da página inteira);
 *   pixels vivos   soma de largura vezes altura de todo canvas com largura
 *                  maior que zero na área de leitura.
 *
 * O que prova:
 *   1. em pé (800x1280), no zoom máximo (4, pelo "+"), na p. 206, com o título
 *      da página à vista: nitidez de pelo menos 1,9 em cinco pontos da área
 *      (o meio e quatro perto dos cantos) e no máximo 16 milhões de pixels
 *      vivos; depois de rolar 300 px e a rolagem parar, o detalhe é refeito
 *      (os cinco pontos de novo a 1,9); na divisa entre a p. 206 e a 207, as
 *      duas à vista, ainda no máximo 16 milhões;
 *   2. deitado (1280x800), no zoom máximo: nitidez de 1,9 nos cinco pontos e
 *      no máximo 16 milhões de pixels;
 *   3. o pré-desenho na direção da rolagem, deitado e na largura: na p. 100,
 *      rolando 600 px para baixo, com a rolagem parada, a p. 101 já tem canvas
 *      (e a p. 99, que ficou para trás, não); tocar "Próxima" leva à p. 101
 *      com o MESMO canvas, sem desenhar de novo; rolando 300 px para cima, a
 *      p. 99 já tem canvas;
 *   4. o escaneado: a primeira passada da p. 1 sai a meia densidade (1, de 2)
 *      e em seguida a nítida (2); no livro de texto, a p. 1 sai direto a 2;
 *   5. nenhum erro de página.
 *
 * NENHUMA ESPERA POR TEMPO FIXO: cada leitura espera a condição dela (o leitor
 * diz que não tem desenho por fazer em corpo.dataset.ocupado, a rolagem
 * parada em dois quadros seguidos, as páginas à vista com canvas do tamanho
 * da caixa).
 *
 * Venenos (o app.js servido sem uma peça; a prova TEM de ver, "VENENO visto"):
 *   --envenenado-sem-detalhe         o canvas de detalhe não é desenhado: a
 *                                    nitidez no zoom máximo cai
 *   --envenenado-sem-teto            a página inteira sem teto: os pixels vivos
 *                                    passam de 16 milhões (a prova para depois
 *                                    da primeira medida, para não gastar memória)
 *   --envenenado-direcao-errada      o pré-desenho do lado contrário da rolagem
 *   --envenenado-sem-meia-densidade  o escaneado sai direto na densidade cheia
 *
 *   --app-de <pasta>   serve o app.js e o styles.css dessa pasta (os da main,
 *                      para os prints do antes); só tira os prints, sem conferir.
 *   --prints <pasta>   grava 4 prints para o painel cego: em pé e deitado no
 *                      zoom máximo, cada um inteiro e um recorte do título.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, esperar } = H;

const PORTA = 8972;
const NITIDEZ_MIN = 1.9;
const PIXELS_MAX = 16000000;
const VENENOS = {
  'sem-detalhe': ['      desenharDetalhesDoLeitor(estado);\n      atualizarOcupacaoDoLeitor();', '      atualizarOcupacaoDoLeitor();'],
  'sem-teto': ['    return Math.min(dpr, Math.sqrt(teto / area));', '    return dpr;'],
  'direcao-errada': ['    var proxima = estado.direcao < 0 ? primeira - 1 : ultima + 1;', '    var proxima = estado.direcao < 0 ? ultima + 1 : primeira - 1;'],
  'sem-meia-densidade': ['      var densidade = estado.escaneado && !registro.temCanvas ? alvo / 2 : alvo;', '      var densidade = alvo;']
};
const VENENO = Object.keys(VENENOS).find(k => process.argv.indexOf('--envenenado-' + k) !== -1) || null;
const iPrints = process.argv.indexOf('--prints');
const PRINTS = iPrints > 0 ? process.argv[iPrints + 1] : null;
const iAppDe = process.argv.indexOf('--app-de');
const APP_DE = iAppDe > 0 ? process.argv[iAppDe + 1] : null;
const PYTHON = process.env.PYTHON || 'python';

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const trocas = {};
if (VENENO) trocas['/app.js'] = APP.split(VENENOS[VENENO][0]).join(VENENOS[VENENO][1]);
if (APP_DE) {
  trocas['/app.js'] = fs.readFileSync(path.join(APP_DE, 'app.js'), 'utf8');
  trocas['/styles.css'] = fs.readFileSync(path.join(APP_DE, 'styles.css'), 'utf8');
}

const amb = H.criarAmbiente(PORTA, 'perfil_leitor_nitidez', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'leitor_nitidez_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

function gerarLivros() {
  const r = spawnSync(PYTHON, ['-X', 'utf8', path.join(H.RAIZ, 'biblioteca', '_amostra', 'fazer_amostra_livros.py'), TMP, '--nitidez'],
    { encoding: 'utf8' });
  const linhas = String(r.stdout || '').trim().split(/\r?\n/);
  const zip = linhas[linhas.length - 1];
  if (r.status !== 0 || !zip || !fs.existsSync(zip)) { console.log(String(r.stderr || '').slice(0, 800)); return null; }
  return zip;
}

const clicar = (pag, sel) => pag.evaluate(s => { const b = document.querySelector(s); if (!b) return false; b.click(); return true; }, sel);

// checa: no modo normal é um conf; no veneno, a falha da verificação daquele veneno é o que se quer ver
const visto = [];
const checa = (rotulo, obtido, esperado, doVeneno) => {
  if (VENENO) { if (doVeneno === VENENO && String(obtido) !== String(esperado)) visto.push(rotulo + ' [obtido: ' + obtido + ']'); return; }
  if (APP_DE) return;
  conf(rotulo, obtido, esperado);
};

(async () => {
  secao('0. A prova se confere');
  conf('cada âncora de veneno aparece uma vez só no app.js',
    Object.keys(VENENOS).map(k => k + ':' + (APP.split(VENENOS[k][0]).length - 1)).join(','),
    Object.keys(VENENOS).map(k => k + ':1').join(','));
  if (VENENO) conf('o app.js servido está envenenado (' + VENENO + ')', trocas['/app.js'].indexOf(VENENOS[VENENO][0]) === -1, true);
  const zip = gerarLivros();
  conf('os livros sintéticos (400 páginas e escaneado de 12) foram gerados', !!zip, true);
  if (!zip) throw Object.assign(new Error('sem os livros'), { jaContado: true });
  if (PRINTS) fs.mkdirSync(PRINTS, { recursive: true });

  await amb.subir();
  const pag = await amb.pagina();
  const errosDePagina = [];
  pag.on('pageerror', e => errosDePagina.push(e.message));
  pag.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errosDePagina.push(m.text()); });
  await pag.setViewport({ width: 800, height: 1280, hasTouch: true, deviceScaleFactor: 2 });
  await H.abrirApp(pag, amb.ORIGEM);

  /* O gravador das passadas: cada canvas da página inteira que entra numa
   * caixa fica anotado com a página e a densidade (pixels de canvas por pixel
   * de tela), na ordem em que entrou. */
  await pag.evaluate(() => {
    window.__passadas = [];
    new MutationObserver(lista => lista.forEach(m => m.addedNodes.forEach(k => {
      if (k.tagName !== 'CANVAS' || k.classList.contains('leitor-pdf-detalhe')) return;
      const caixa = k.closest('[data-pagina-arquivo]');
      if (!caixa) return;
      window.__passadas.push({ livro: window.__livroAberto || '', n: +caixa.dataset.paginaArquivo,
        d: Math.round(k.width / parseFloat(k.style.width) * 100) / 100, t: performance.now() });
    }))).observe(document.body, { childList: true, subtree: true });
  });

  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => { document.querySelector('#estado-importacao-biblioteca').innerHTML = ''; });
  await (await pag.$('#arquivo-biblioteca')).uploadFile(zip);
  await esperar('a importação dos livros', () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca');
    return [c ? c.innerText.trim() : '', document.querySelector('#importar-biblioteca').disabled];
  }), v => !!v[0] && !/Conferindo|Gravando/.test(v[0]) && v[1] === false, 60000);

  const abrirLivro = async id => {
    await H.irParaAba(pag, 'biblioteca');
    await esperar('a aba Biblioteca desenhada', () => pag.evaluate(() => !!document.querySelector('#bib-corpo').children.length), v => v, 10000);
    await clicar(pag, '#bib-livros .bibl-disciplina[data-disciplina="matematica"]');
    // P3: a Matemática abre por assunto; os livros dela ficam na Estante, a um toque (espera pela condição)
    await esperar('a Estante da Matemática', async () => { await clicar(pag, '#bib-abrir-estante');
      return pag.evaluate(() => !!document.querySelector('#bib-livros .bibl-painel-estante')); }, v => v, 10000);
    await esperar('os anos da matemática', () => pag.evaluate(() => document.querySelectorAll('#bib-livros .bibl-ano').length), v => v > 0, 5000);
    let achou = false;
    for (const ano of await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-livros .bibl-ano')).map(b => b.dataset.ano))) {
      await clicar(pag, '#bib-livros .bibl-ano[data-ano="' + ano + '"]');
      const r = await esperar('o livro ' + id + ' no ano ' + ano, () => pag.evaluate(i => !!document.querySelector('#bib-livros [data-livro="' + i + '"]'), id), v => v, 1500);
      if (r.ok && await clicar(pag, '#bib-livros [data-livro="' + id + '"]')) { achou = true; break; }
    }
    conf('o livro ' + id + ' está na Biblioteca', achou, true);
    await esperar('a tela do livro', () => pag.evaluate(() => { const t = document.querySelector('#bib-livro'); return !!t && !t.hidden; }), v => v, 5000);
    await pag.evaluate(i => { window.__livroAberto = i; window.__abriuEm = performance.now(); }, id);
    await clicar(pag, '#bib-livro-continuar');
    const aberto = await esperar('o leitor aberto na p. 1', () => pag.evaluate(() => {
      const c = document.querySelector('#corpo-modal-leitor-pdf');
      return document.querySelector('#modal-leitor-pdf.aberto') && c ? c.dataset.paginaDesenhada || '' : '';
    }), v => v === '1', 30000);
    conf('o leitor abriu ' + id + ' na p. 1', aberto.ok, true);
  };

  // ---- as medidas
  const estado = () => pag.evaluate(() => {
    const c = document.querySelector('#corpo-modal-leitor-pdf'), r = c.getBoundingClientRect();
    const area = { x: r.left + c.clientLeft, y: r.top + c.clientTop, w: c.clientWidth, h: c.clientHeight };
    const canvases = Array.from(c.querySelectorAll('canvas')).filter(k => k.width > 0);
    const nitidezEm = (x, y) => canvases.reduce((m, k) => {
      const q = k.getBoundingClientRect();
      return x >= q.left && x <= q.right && y >= q.top && y <= q.bottom ? Math.max(m, k.width / q.width) : m;
    }, 0);
    const pontos = [[0.5, 0.5], [0.08, 0.08], [0.92, 0.08], [0.08, 0.92], [0.92, 0.92]].map(p => nitidezEm(area.x + area.w * p[0], area.y + area.h * p[1]));
    const meio = document.elementFromPoint(area.x + area.w / 2, area.y + area.h / 2);
    const caixa = meio && meio.closest('[data-pagina-arquivo]');
    const aVista = Array.from(c.querySelectorAll('.leitor-pdf-pagina')).filter(b => {
      const q = b.getBoundingClientRect(); return q.bottom > area.y + 1 && q.top < area.y + area.h - 1;
    });
    const malDesenhadas = aVista.filter(b => {
      const k = b.querySelector('canvas'); return !k || k.width === 0 || Math.abs(parseFloat(k.style.width) - b.getBoundingClientRect().width) > 2;
    }).map(b => b.dataset.paginaArquivo);
    const temCanvas = n => { const b = c.querySelector('[data-pagina-arquivo="' + n + '"]'), k = b && b.querySelector('canvas'); return !!(k && k.width > 0); };
    return { area, scrollTop: c.scrollTop, scrollLeft: c.scrollLeft, ocupado: c.dataset.ocupado || '',
      meio: caixa ? +caixa.dataset.paginaArquivo : null, largura: caixa ? caixa.getBoundingClientRect().width : null,
      nitidez: Math.round(Math.min.apply(null, pontos) * 100) / 100, nitidezMeio: Math.round(pontos[0] * 100) / 100,
      pixels: canvases.reduce((s, k) => s + k.width * k.height, 0), canvases: canvases.length,
      aVista: aVista.map(b => b.dataset.paginaArquivo).join(','), malDesenhadas: malDesenhadas.join(','),
      contador: document.querySelector('#leitor-contador').textContent,
      p99: temCanvas(99), p101: temCanvas(101), zoomMaxDesligado: document.querySelector('#leitor-mais').disabled };
  });
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
  /* pronto: a rolagem parada, as páginas à vista desenhadas no tamanho da
   * caixa e nenhum desenho por fazer (no app de antes não há o aviso de
   * ocupado, e vale só o resto) */
  const pronto = async (rotulo, extra) => {
    await estavel(rotulo);
    const r = await esperar(rotulo + ': o leitor sem desenho por fazer', estado,
      v => v.malDesenhadas === '' && v.ocupado !== '1' && (!extra || extra(v)), 20000);
    if (!r.ok) conf(rotulo + ': o leitor terminou de desenhar', false, true);
    return r.valor;
  };
  const irParaPagina = async n => {
    await pag.evaluate(v => { const i = document.querySelector('#leitor-ir-pagina'); i.value = String(v); i.dispatchEvent(new Event('change')); }, n);
    return pronto('a ida à p. ' + n, v => v.meio === n || (v.aVista.split(',').indexOf(String(n)) >= 0));
  };
  // rola dy px em passos de 100 px, um por quadro, como o dedo
  const rolar = (dy, dx) => pag.evaluate((dy, dx) => new Promise(fim => {
    const c = document.querySelector('#corpo-modal-leitor-pdf');
    const passos = Math.max(1, Math.ceil(Math.abs(dy) / 100));
    let i = 0;
    const anda = () => {
      c.scrollTop += dy / passos;
      if (dx) c.scrollLeft += dx / passos;
      if (++i < passos) requestAnimationFrame(anda); else requestAnimationFrame(() => fim());
    };
    requestAnimationFrame(anda);
  }), dy, dx || 0);
  // leva o ponto (fx, fy) da página n a (ax, ay) da área
  const levarPonto = (n, fx, fy, ax, ay) => pag.evaluate((n, fx, fy, ax, ay) => {
    const c = document.querySelector('#corpo-modal-leitor-pdf'), rc = c.getBoundingClientRect();
    const q = c.querySelector('[data-pagina-arquivo="' + n + '"]').getBoundingClientRect();
    c.scrollTop += q.top + fy * q.height - (rc.top + c.clientTop + c.clientHeight * ay);
    c.scrollLeft += q.left + fx * q.width - (rc.left + c.clientLeft + c.clientWidth * ax);
  }, n, fx, fy, ax, ay);
  const print = async (nome, recorte) => {
    if (!PRINTS) return;
    const s = await estado();
    await pag.screenshot({ path: path.join(PRINTS, nome + '.png') });
    // o recorte: 360x240 px da tela em volta do título da página, onde a letra mostra o borrão
    if (recorte) await pag.screenshot({ path: path.join(PRINTS, nome + '_recorte.png'),
      clip: { x: Math.round(s.area.x + s.area.w * 0.3 - 180), y: Math.round(s.area.y + s.area.h * 0.5 - 120), width: 360, height: 240 } });
  };
  const zoomMaximo = async rotulo => {
    for (let i = 0; i < 10; i++) {
      const antes = await estado();
      if (antes.zoomMaxDesligado) break;
      await clicar(pag, '#leitor-mais');
      await pronto(rotulo + ', o "+" ' + (i + 1), v => Math.abs(v.largura - antes.largura) > 1);
    }
    const s = await estado();
    conf(rotulo + ': o zoom chegou ao máximo (o "+" desligado)', s.zoomMaxDesligado, true);
    return s;
  };

  // ================================================================
  secao('1. Em pé, zoom máximo, na p. 206');
  await abrirLivro('livro-leitor-400');
  await pronto('a p. 1 aberta');
  const s206 = await irParaPagina(206);
  const largura1 = s206.largura;
  await zoomMaximo('em pé');
  // o título da página (no alto, à esquerda) a 30% da largura e no meio da altura da área
  await levarPonto(206, 0.2, 0.105, 0.3, 0.5);
  const z1 = await pronto('o título da p. 206 à vista no zoom máximo');
  console.log('   em pé, zoom máximo: largura ' + Math.round(largura1) + ' -> ' + Math.round(z1.largura) + ' px; nitidez ' + z1.nitidez +
    ' (meio ' + z1.nitidezMeio + '); ' + (z1.pixels / 1e6).toFixed(2) + ' milhões de pixels vivos em ' + z1.canvases + ' canvases; à vista: ' + z1.aVista);
  conf('em pé, o zoom máximo é 4 vezes a largura (±1%)', Math.abs(z1.largura / largura1 - 4) < 0.04, true);
  await print('em_pe_zoom_maximo', true);
  checa('em pé, no zoom máximo, nitidez de pelo menos ' + NITIDEZ_MIN + ' nos cinco pontos da área', z1.nitidez >= NITIDEZ_MIN, true, 'sem-detalhe');
  checa('em pé, no zoom máximo, no máximo 16 milhões de pixels de canvas vivos', z1.pixels <= PIXELS_MAX, true, 'sem-teto');
  if (VENENO === 'sem-teto') {
    secao('VENENO: ' + VENENO);
    conf('envenenado-' + VENENO + ': a prova viu o defeito', visto.length > 0, true);
    if (visto.length) console.log('VENENO visto: ' + visto.join(' ; '));
    await H.fim(amb)();
    return;
  }
  // a rolagem para e o detalhe se refaz no pedaço novo
  await rolar(300, 120);
  const z2 = await pronto('depois de rolar 300 px no zoom máximo');
  console.log('   depois de rolar: nitidez ' + z2.nitidez + '; ' + (z2.pixels / 1e6).toFixed(2) + ' milhões de pixels');
  checa('depois de rolar e parar, o detalhe foi refeito: nitidez de ' + NITIDEZ_MIN + ' nos cinco pontos', z2.nitidez >= NITIDEZ_MIN, true, 'sem-detalhe');
  checa('e ainda no máximo 16 milhões de pixels', z2.pixels <= PIXELS_MAX, true, 'sem-teto');
  // a divisa entre a p. 206 e a 207 no meio da área: duas páginas à vista
  await levarPonto(207, 0.5, 0, 0.5, 0.5);
  const z3 = await pronto('a divisa entre a p. 206 e a 207 no zoom máximo', v => v.aVista === '206,207');
  console.log('   na divisa: à vista ' + z3.aVista + '; nitidez ' + z3.nitidez + '; ' + (z3.pixels / 1e6).toFixed(2) + ' milhões de pixels em ' + z3.canvases + ' canvases');
  checa('na divisa, com duas páginas à vista, no máximo 16 milhões de pixels', z3.pixels <= PIXELS_MAX, true, 'sem-teto');
  checa('e nitidez de ' + NITIDEZ_MIN + ' nos cinco pontos', z3.nitidez >= NITIDEZ_MIN, true, 'sem-detalhe');

  // ================================================================
  secao('2. Deitado, zoom máximo');
  await levarPonto(206, 0.2, 0.105, 0.3, 0.5);
  await pronto('de volta ao título da p. 206');
  const antesGiro = await estado();
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true, deviceScaleFactor: 2 });
  await pronto('o giro para deitado', v => Math.abs(v.largura - antesGiro.largura) > 1);
  await levarPonto(206, 0.2, 0.105, 0.3, 0.5);
  const d1 = await pronto('o título da p. 206 à vista, deitado');
  console.log('   deitado, zoom máximo: largura ' + Math.round(d1.largura) + ' px; nitidez ' + d1.nitidez + '; ' +
    (d1.pixels / 1e6).toFixed(2) + ' milhões de pixels vivos em ' + d1.canvases + ' canvases');
  await print('deitado_zoom_maximo', true);
  checa('deitado, no zoom máximo, nitidez de pelo menos ' + NITIDEZ_MIN + ' nos cinco pontos', d1.nitidez >= NITIDEZ_MIN, true, 'sem-detalhe');
  checa('deitado, no zoom máximo, no máximo 16 milhões de pixels vivos', d1.pixels <= PIXELS_MAX, true, 'sem-teto');
  if (APP_DE) {
    console.log('   prints do antes em ' + PRINTS);
    await H.fim(amb)();
    return;
  }

  // ================================================================
  secao('3. Pré-desenho na direção da rolagem, deitado e na largura');
  const antesL = await estado();
  await clicar(pag, '#leitor-largura');
  await pronto('a volta à largura', v => v.largura < antesL.largura - 1);
  await irParaPagina(100);
  // 600 px para baixo: a p. 99 fica longe para trás, a p. 101 ainda longe à frente
  await rolar(600);
  const b1 = await pronto('a rolagem de 600 px para baixo parou');
  const geo = await pag.evaluate(() => {
    const c = document.querySelector('#corpo-modal-leitor-pdf'), r = c.getBoundingClientRect();
    const q = n => c.querySelector('[data-pagina-arquivo="' + n + '"]').getBoundingClientRect();
    return { abaixo: Math.round(q(101).top - (r.top + c.clientTop + c.clientHeight)), acima: Math.round((r.top + c.clientTop) - q(99).bottom) };
  });
  console.log('   à vista: ' + b1.aVista + '; a p. 101 começa ' + geo.abaixo + ' px abaixo da área e a p. 99 acaba ' + geo.acima +
    ' px acima; p. 101 com canvas: ' + b1.p101 + ', p. 99: ' + b1.p99 + '; ' + (b1.pixels / 1e6).toFixed(2) + ' milhões de pixels');
  conf('a p. 101 está fora da tela e da folga de 200 px (só o pré-desenho a desenha)', geo.abaixo > 250 && geo.acima > 250 && b1.aVista === '100', true);
  checa('rolando para baixo e parada, a p. 101 (a seguinte) já tem canvas antes do toque', b1.p101, true, 'direcao-errada');
  checa('e a p. 99, que ficou para trás, não', b1.p99, false, 'direcao-errada');
  await pag.evaluate(() => {
    const k = document.querySelector('#corpo-modal-leitor-pdf [data-pagina-arquivo="101"] canvas');
    if (k) k.__marcado = true;
  });
  await clicar(pag, '#leitor-proxima');
  const prox = await pronto('o "Próxima" até a p. 101', v => v.meio === 101 || v.aVista.split(',')[0] === '101');
  const mesmo = await pag.evaluate(() => {
    const k = document.querySelector('#corpo-modal-leitor-pdf [data-pagina-arquivo="101"] canvas');
    return !!(k && k.__marcado);
  });
  console.log('   depois do "Próxima": à vista ' + prox.aVista + '; o canvas da p. 101 é o pré-desenhado: ' + mesmo);
  checa('o "Próxima" mostra a p. 101 com o canvas pré-desenhado, sem desenhar de novo', mesmo, true, 'direcao-errada');
  // e para cima
  await irParaPagina(100);
  await rolar(600);
  await pronto('de novo no meio da p. 100');
  await rolar(-300);
  const c1 = await pronto('a rolagem de 300 px para cima parou');
  console.log('   rolando para cima: à vista ' + c1.aVista + '; p. 99 com canvas: ' + c1.p99 + ', p. 101: ' + c1.p101);
  conf('rolando para cima, só a p. 100 à vista', c1.aVista, '100');
  checa('rolando para cima e parada, a p. 99 (a seguinte nessa direção) já tem canvas', c1.p99, true, 'direcao-errada');

  // ================================================================
  secao('4. O escaneado: primeiro suave, em seguida nítido');
  const texto = await pag.evaluate(() => window.__passadas.filter(p => p.livro === 'livro-leitor-400' && p.n === 1).map(p => p.d));
  console.log('   livro de texto, passadas da p. 1 (densidade): ' + texto.join(', '));
  conf('no livro de texto, a p. 1 sai direto na densidade da tela (2)', texto[0], 2);
  const deitado = await estado();
  await pag.setViewport({ width: 800, height: 1280, hasTouch: true, deviceScaleFactor: 2 });
  await pronto('o giro de volta para em pé', v => v.largura < deitado.largura - 1);
  await clicar(pag, '#modal-leitor-pdf .fechar');
  await esperar('o leitor fechado', () => pag.evaluate(() => !document.querySelector('#modal-leitor-pdf.aberto')), v => v, 5000);
  await abrirLivro('livro-escaneado-12');
  await esperar('a p. 1 do escaneado nítida', () => pag.evaluate(() =>
    window.__passadas.filter(p => p.livro === 'livro-escaneado-12' && p.n === 1).map(p => p.d)), v => v.length && v[v.length - 1] === 2, 20000);
  await pronto('o escaneado sem desenho por fazer');
  const esc = await pag.evaluate(() => window.__passadas.filter(p => p.livro === 'livro-escaneado-12' && p.n === 1)
    .map(p => ({ d: p.d, ms: Math.round(p.t - window.__abriuEm) })));
  console.log('   escaneado, passadas da p. 1: ' + esc.map(p => p.d + ' em ' + p.ms + ' ms').join(', '));
  checa('no escaneado, a primeira passada da p. 1 sai a meia densidade (1, ±0,05)', esc.length && Math.abs(esc[0].d - 1) <= 0.05, true, 'sem-meia-densidade');
  checa('e em seguida a nítida (2), com duas passadas', esc.map(p => p.d).join(','), '1,2', 'sem-meia-densidade');

  if (VENENO) {
    secao('VENENO: ' + VENENO);
    conf('envenenado-' + VENENO + ': a prova viu o defeito', visto.length > 0, true);
    if (visto.length) console.log('VENENO visto: ' + visto.join(' ; '));
    await H.fim(amb)();
    return;
  }
  if (PRINTS) console.log('   prints em ' + PRINTS);
  conf('nenhum erro de página', errosDePagina.join(' | '), '');
  await H.fim(amb)();
})().catch(H.fim(amb));
