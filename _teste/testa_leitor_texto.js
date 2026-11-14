/* testa_leitor_texto.js
 *
 * A fatia 7 do leitor: texto selecionável sobre a página. No Chrome de
 * verdade, com densidade de tela 2 (a do tablet), e com dois livros
 * SINTÉTICOS do gerador (biblioteca/_amostra/fazer_amostra_livros.py
 * --texto): o de 400 páginas do leitor, em que cada página traz a linha
 * "Exercício N. Calcule a soma dos números de 1 a N.", e um "escaneado" de 12
 * páginas, cada uma uma imagem JPEG da página inteira, sem texto. Nenhum livro
 * de verdade, nenhum nome de criança.
 *
 * O que prova (o aceite da fatia 7 no DIAGNOSTICO_E_PLANO do leitor):
 *   1. na p. 206, em pé (800x1280), a área tem mais de 0 elementos de texto
 *      sobre a página;
 *   2. arrastar o mouse por cima da linha do exercício, no lugar em que ela
 *      está DESENHADA no canvas (a conta vem da geometria do gerador, não da
 *      camada), e copiar (Ctrl+C) põe "Exercício 206" na área de
 *      transferência;
 *   3. o toque da caneta (ponteiro pen do CDP) não começa seleção: o
 *      navegador dispara o selectstart, o app o cancela e o cursor da seleção
 *      não é posto (o arrasto pen do CDP nunca estende a seleção neste
 *      Chrome, nem sem o bloqueio; ver a seção 3). O caminho da S Pen no
 *      tablet não é exercitado;
 *   4. elementos de texto vivos só nas páginas desenhadas: em 80 passos de
 *      300 px, a cada passo, nenhuma camada de texto numa página sem canvas;
 *   5. no escaneado, 0 elementos de texto (nenhuma camada) depois de todas as
 *      páginas lidas, e a frase "Este livro é imagem: o texto não pode ser
 *      selecionado nem buscado." aparece UMA vez; no livro de texto, nenhuma;
 *   2b. o arrasto que termina DEPOIS do fim da linha (2 e 20 pt além da
 *      tinta e do texto da camada) copia a linha inteira, "Exercício 206.
 *      Calcule a soma dos números de 1 a 206."; e o que sai do começo do
 *      título e termina 2 pt além do fim da linha do exercício copia as duas
 *      linhas;
 *   6. nenhum erro de página.
 *   1b. (a B12 honesta, logo depois do 1) todo pedaço da camada do leitor tem
 *      a cor computada transparente (alfa 0), e o tamanho de letra inline
 *      (style.fontSize) só existe nesses pedaços, em nenhum outro elemento do
 *      documento; a contagem do que foi olhado é impressa e zero é falha.
 *
 * NENHUMA ESPERA POR TEMPO FIXO: cada leitura espera a condição dela (o leitor
 * diz que não tem desenho por fazer em corpo.dataset.ocupado, a rolagem
 * parada em dois quadros seguidos, cada página desenhada diz que o texto dela
 * já foi lido em caixa.dataset.texto).
 *
 * Venenos (o app.js ou o styles.css servido sem uma peça; um por critério, e
 * a prova TEM de ver pelo valor, "VENENO visto"; ela para depois da seção do
 * veneno):
 *   --envenenado-sem-camada            a camada não é criada com o canvas (1)
 *   --envenenado-sem-selecao           a camada sem seleção (user-select none
 *                                      no CSS): o arrasto não copia nada (2)
 *   --envenenado-caneta-seleciona      a caneta não é barrada: ela seleciona (3)
 *   --envenenado-texto-sem-soltar      a camada não sai com o canvas: fica
 *                                      texto nas páginas soltas (4)
 *   --envenenado-escaneado-com-camada  a página sem texto ganha camada (5)
 *   --envenenado-aviso-repetido        a frase do escaneado a cada página (5)
 *   --envenenado-camada-visivel        os pedaços da camada em preto, e não
 *                                      transparentes (1b, critério a)
 *   --envenenado-letra-fora-da-camada  a caixa da página, fora da camada,
 *                                      ganha font-size inline (1b, critério b)
 *   --envenenado-sem-fim-do-conteudo   a camada sem o div.endOfContent: o
 *                                      arrasto que passa do fim da linha não
 *                                      copia a linha inteira (2b)
 *
 *   --app-de <pasta>   serve o app.js e o styles.css dessa pasta (o controle
 *                      no commit pai): as verificações rodam e TÊM de falhar.
 *   --prints <pasta>   grava os prints da p. 206 antes e depois da seleção em
 *                      <pasta>/antes e <pasta>/depois (inteiro e recorte).
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, esperar } = H;

const PORTA = 8976;
const FRASE = 'Este livro é imagem: o texto não pode ser selecionado nem buscado.';
const VENENOS = {
  'sem-camada': ['app.js', '        criarCamadaDeTexto(estado, registro, pagina, vp);\n', ''],
  'sem-selecao': ['styles.css', '-webkit-user-select: text; user-select: text;', '-webkit-user-select: none; user-select: none;'],
  'caneta-seleciona': ['app.js', 'if (canetaNoLeitor) ev.preventDefault();', '/* veneno: a caneta passa */'],
  'texto-sem-soltar': ['app.js', "    soltarCamadaDeTexto(registro);\n    registro.caixa.innerHTML = '';\n", ''],
  'escaneado-com-camada': ['app.js', "      if (!temTexto) { registro.caixa.dataset.texto = '0'; return null; }\n", ''],
  'aviso-repetido': ['app.js', 'if (estado.escaneado && !estado.avisouImagem)', 'if (estado.escaneado)'],
  'camada-visivel': ['styles.css', '.textLayer br { color: transparent;', '.textLayer br { color: #000;'],
  'letra-fora-da-camada': ['app.js', "registro.caixa.dataset.texto = '1';", "registro.caixa.style.fontSize = '20px'; registro.caixa.dataset.texto = \"1\";"],
  'sem-fim-do-conteudo': ['app.js', "        camada.div.appendChild(el('div', { class: 'endOfContent' }));\n", '']
};
// a seção depois da qual o veneno já foi medido (a prova para ali)
const SECAO_DO_VENENO = { 'sem-camada': 1, 'camada-visivel': '1b', 'letra-fora-da-camada': '1b', 'sem-selecao': 2, 'sem-fim-do-conteudo': 2,
  'caneta-seleciona': 3, 'texto-sem-soltar': 4, 'escaneado-com-camada': 5, 'aviso-repetido': 5 };
const VENENO = Object.keys(VENENOS).find(k => process.argv.indexOf('--envenenado-' + k) !== -1) || null;
const iPrints = process.argv.indexOf('--prints');
const PRINTS = iPrints > 0 ? process.argv[iPrints + 1] : null;
const iAppDe = process.argv.indexOf('--app-de');
const APP_DE = iAppDe > 0 ? process.argv[iAppDe + 1] : null;
const PYTHON = process.env.PYTHON || 'python';

const ler = nome => fs.readFileSync(path.join(H.RAIZ, nome), 'utf8').replace(/\r\n/g, '\n');
const FONTES = { 'app.js': ler('app.js'), 'styles.css': ler('styles.css') };
const trocas = {};
if (VENENO) {
  const v = VENENOS[VENENO];
  trocas['/' + v[0]] = FONTES[v[0]].split(v[1]).join(v[2]);
}
if (APP_DE) {
  trocas['/app.js'] = fs.readFileSync(path.join(APP_DE, 'app.js'), 'utf8');
  trocas['/styles.css'] = fs.readFileSync(path.join(APP_DE, 'styles.css'), 'utf8');
}

const amb = H.criarAmbiente(PORTA, 'perfil_leitor_texto', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'leitor_texto_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

function gerarLivros() {
  const r = spawnSync(PYTHON, ['-X', 'utf8', path.join(H.RAIZ, 'biblioteca', '_amostra', 'fazer_amostra_livros.py'), TMP, '--texto'],
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
  conf(rotulo, obtido, esperado);
};

(async () => {
  secao('0. A prova se confere');
  conf('cada âncora de veneno aparece uma vez só no arquivo dela',
    Object.keys(VENENOS).map(k => k + ':' + (FONTES[VENENOS[k][0]].split(VENENOS[k][1]).length - 1)).join(','),
    Object.keys(VENENOS).map(k => k + ':1').join(','));
  if (VENENO) conf('o ' + VENENOS[VENENO][0] + ' servido está envenenado (' + VENENO + ')',
    trocas['/' + VENENOS[VENENO][0]].indexOf(VENENOS[VENENO][1]) === -1, true);
  const zip = gerarLivros();
  conf('os livros sintéticos (400 páginas com o exercício e escaneado de 12) foram gerados', !!zip, true);
  if (!zip) throw Object.assign(new Error('sem os livros'), { jaContado: true });

  const nav = await amb.subir();
  // a área de transferência de verdade: o Ctrl+C copia, e a prova lê o que foi copiado
  await nav.defaultBrowserContext().overridePermissions(amb.ORIGEM, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
  const pag = await amb.pagina();
  const errosDePagina = [];
  pag.on('pageerror', e => errosDePagina.push(e.message));
  pag.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errosDePagina.push(m.text()); });
  await pag.setViewport({ width: 800, height: 1280, hasTouch: true, deviceScaleFactor: 2 });
  await H.abrirApp(pag, amb.ORIGEM);

  /* Quantas vezes a frase do escaneado foi dita, por livro: cada aviso novo
   * troca o texto do #aviso-texto (mesmo texto de novo também troca o nó). */
  await pag.evaluate(frase => {
    window.__frases = {};
    window.__ponteiros = [];
    const alvo = document.querySelector('#aviso-texto');
    new MutationObserver(() => {
      if (alvo.textContent !== frase) return;
      const livro = window.__livroAberto || '';
      window.__frases[livro] = (window.__frases[livro] || 0) + 1;
    }).observe(alvo, { childList: true, characterData: true, subtree: true });
    document.addEventListener('pointerdown', e => window.__ponteiros.push(e.pointerType), true);
    window.__copias = [];
    document.addEventListener('copy', () => window.__copias.push(String(window.getSelection())), true);
  }, FRASE);

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
    await pag.evaluate(i => { window.__livroAberto = i; }, id);
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
    const caixas = Array.from(c.querySelectorAll('.leitor-pdf-pagina'));
    const aVista = caixas.filter(b => {
      const q = b.getBoundingClientRect(); return q.bottom > area.y + 1 && q.top < area.y + area.h - 1;
    });
    const temCanvas = b => { const k = b.querySelector('canvas'); return !!(k && k.width > 0); };
    const malDesenhadas = aVista.filter(b => {
      const k = b.querySelector('canvas'); return !k || k.width === 0 || Math.abs(parseFloat(k.style.width) - b.getBoundingClientRect().width) > 2;
    }).map(b => b.dataset.paginaArquivo);
    const desenhadas = caixas.filter(temCanvas);
    const camadas = Array.from(c.querySelectorAll('.textLayer'));
    const camadaSemCanvas = camadas.map(t => t.closest('[data-pagina-arquivo]')).filter(b => !b || !temCanvas(b))
      .map(b => b ? b.dataset.paginaArquivo : '?');
    const spans = n => { const b = c.querySelector('[data-pagina-arquivo="' + n + '"]'); return b ? b.querySelectorAll('.textLayer span').length : 0; };
    return { area, ocupado: c.dataset.ocupado || '', aVista: aVista.map(b => b.dataset.paginaArquivo).join(','),
      malDesenhadas: malDesenhadas.join(','), desenhadas: desenhadas.map(b => b.dataset.paginaArquivo).join(','),
      // as desenhadas que ainda não disseram se o texto delas foi lido (no app de antes não há o aviso)
      semLeitura: desenhadas.filter(b => !b.dataset.texto).map(b => b.dataset.paginaArquivo).join(','),
      camadas: camadas.length, spansVivos: c.querySelectorAll('.textLayer span').length,
      camadaSemCanvas: camadaSemCanvas.join(','), spans206: spans(206), canvases: desenhadas.length };
  });
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
  /* pronto: a rolagem parada, as páginas à vista desenhadas no tamanho da
   * caixa, nenhum desenho por fazer e o texto de cada página desenhada lido.
   * No app de antes (o controle) e no veneno sem camada não há o aviso do
   * texto: ali vale o resto. */
  const semAvisoDoTexto = !!APP_DE || VENENO === 'sem-camada';
  const pronto = async (rotulo, extra) => {
    await estavel(rotulo);
    const r = await esperar(rotulo + ': o leitor sem desenho nem texto por fazer', estado,
      v => v.malDesenhadas === '' && v.ocupado !== '1' && (semAvisoDoTexto || v.semLeitura === '') && (!extra || extra(v)), 20000);
    if (!r.ok) conf(rotulo + ': o leitor terminou de desenhar e de ler o texto', false, true);
    return r.valor;
  };
  const irParaPagina = async n => {
    await pag.evaluate(v => { const i = document.querySelector('#leitor-ir-pagina'); i.value = String(v); i.dispatchEvent(new Event('change')); }, n);
    return pronto('a ida à p. ' + n, v => v.aVista.split(',').indexOf(String(n)) >= 0);
  };
  const rolar = dy => pag.evaluate(dy => new Promise(fim => {
    const c = document.querySelector('#corpo-modal-leitor-pdf');
    const passos = Math.max(1, Math.ceil(Math.abs(dy) / 100));
    let i = 0;
    const anda = () => {
      c.scrollTop += dy / passos;
      if (++i < passos) requestAnimationFrame(anda); else requestAnimationFrame(() => fim());
    };
    requestAnimationFrame(anda);
  }), dy);
  /* O ponto da tela em que está DESENHADO o ponto (x, y), em pontos de PDF
   * (595 x 842), da página n: pela caixa da página, e não pela camada. */
  const pontoDaPagina = (n, x, y) => pag.evaluate((n, x, y) => {
    const q = document.querySelector('#corpo-modal-leitor-pdf [data-pagina-arquivo="' + n + '"]').getBoundingClientRect();
    return { x: q.left + q.width * x / 595, y: q.top + q.height * y / 842 };
  }, n, x, y);
  const selecao = () => pag.evaluate(() => String(window.getSelection()));
  const limparSelecao = () => pag.evaluate(() => window.getSelection().removeAllRanges());
  const print = async (pasta, nome) => {
    if (!PRINTS) return;
    const dir = path.join(PRINTS, pasta);
    fs.mkdirSync(dir, { recursive: true });
    /* captureBeyondViewport false: o print padrão estica a janela por um
     * instante, o leitor trata isso como giro e redesenha as páginas, e a
     * camada nova no meio do arrasto ancorava a seleção no título (visto nas
     * rodadas com --prints) */
    await pag.screenshot({ path: path.join(dir, nome + '.png'), captureBeyondViewport: false });
    // o recorte: o alto da p. 206, com o título e a linha do exercício
    const a = await pontoDaPagina(206, 40, 50);
    await pag.screenshot({ path: path.join(dir, nome + '_recorte.png'), captureBeyondViewport: false,
      clip: { x: Math.max(0, Math.round(a.x)), y: Math.max(0, Math.round(a.y)), width: 640, height: 200 } });
    await pronto('depois do print ' + nome);
  };
  const pararNoVeneno = async n => {
    if (!VENENO || SECAO_DO_VENENO[VENENO] !== n) return false;
    secao('VENENO: ' + VENENO);
    conf('envenenado-' + VENENO + ': a prova viu o defeito', visto.length > 0, true);
    if (visto.length) console.log('VENENO visto: ' + visto.join(' ; '));
    await H.fim(amb)();
    return true;
  };

  // ================================================================
  secao('1. A p. 206 tem texto sobre a página');
  await abrirLivro('livro-leitor-400');
  await pronto('a p. 1 aberta');
  await irParaPagina(206);
  const t1 = await esperar('o texto da p. 206 sobre a página', estado, v => v.spans206 > 0, 8000);
  const s1 = t1.valor;
  console.log('   p. 206: ' + s1.spans206 + ' elementos de texto; ' + s1.camadas + ' camadas e ' + s1.spansVivos +
    ' elementos vivos em ' + s1.canvases + ' páginas desenhadas (' + s1.desenhadas + ')');
  checa('na p. 206 a área tem mais de 0 elementos de texto', s1.spans206 > 0, true, 'sem-camada');
  if (await pararNoVeneno(1)) return;

  // ================================================================
  /* A B12 (sistema visual) guarda a tipografia de leitura no styles.css. O
   * tamanho da letra da camada é a exceção: o app.js o põe no estilo inline
   * de cada pedaço, depois do render, porque é geometria da página do PDF e
   * não letra que alguém lê. Esta seção mantém a exceção estreita: (a) todo
   * pedaço da camada é transparente, então o tamanho dele não muda nada
   * visível; (b) o tamanho inline só existe nesses pedaços, em nenhum outro
   * elemento do documento. Zero olhado é FALHA (teste vazio passa). */
  secao('1b. A letra da camada é invisível e só dela (a B12 honesta)');
  const b12 = await pag.evaluate(() => {
    const alfa = cor => {
      const m = /rgba?\(([^)]*)\)/.exec(cor);
      if (!m) return cor === 'transparent' ? 0 : NaN;
      const p = m[1].split(/[\s,/]+/).filter(Boolean);
      return p.length >= 4 ? parseFloat(p[3]) : 1;
    };
    const naCamada = Array.from(document.querySelectorAll('#corpo-modal-leitor-pdf .leitor-pdf-pagina .textLayer *'));
    const visiveis = naCamada.filter(e => !(alfa(getComputedStyle(e).color) === 0))
      .map(e => e.tagName + ' ' + getComputedStyle(e).color + ' "' + (e.textContent || '').slice(0, 15) + '"');
    const todos = Array.from(document.querySelectorAll('*'));
    const comLetraInline = todos.filter(e => e.style && e.style.fontSize !== '');
    const fora = comLetraInline.filter(e => !(e.tagName === 'SPAN' && e.closest('#corpo-modal-leitor-pdf .leitor-pdf-pagina .textLayer')))
      .map(e => e.tagName + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.split(/\s+/).join('.') : '') +
        ' font-size: ' + e.style.fontSize);
    return { naCamada: naCamada.length, visiveis, todos: todos.length, comLetraInline: comLetraInline.length, fora };
  });
  console.log('   olhados: ' + b12.naCamada + ' pedaços na camada, ' + b12.todos + ' elementos no documento, ' +
    b12.comLetraInline + ' com tamanho de letra inline' +
    (b12.visiveis.length ? '; visíveis: ' + b12.visiveis.slice(0, 3).join(' | ') : '') +
    (b12.fora.length ? '; fora da camada: ' + b12.fora.slice(0, 3).join(' | ') : ''));
  conf('a prova olhou pedaços da camada e elementos com letra inline (zero olhado é falha)',
    b12.naCamada > 0 && b12.comLetraInline > 0 && b12.todos > b12.naCamada, true);
  checa('(a) todo pedaço da camada tem a cor computada transparente (alfa 0)', b12.visiveis.length, 0, 'camada-visivel');
  checa('(b) tamanho de letra inline só em pedaço da camada, em nenhum outro elemento', b12.fora.length, 0, 'letra-fora-da-camada');
  if (await pararNoVeneno('1b')) return;

  // ================================================================
  secao('2. Arrastar pela linha do exercício e copiar traz "Exercício 206"');
  await limparSelecao();
  await print('antes', 'p206_antes_da_selecao');
  // a linha começa em x = 72 pt (o arrasto sai de dentro do "E", em 74), com a base em y = 140 pt e letra de 14 pt: o meio dela fica em y = 135
  const de = await pontoDaPagina(206, 74, 135), ate = await pontoDaPagina(206, 300, 135);
  console.log('   no ponto de partida: ' + await pag.evaluate(p => {
    const e = document.elementFromPoint(p.x, p.y), r = document.caretRangeFromPoint(p.x, p.y);
    return (e ? e.tagName + '.' + e.className + ' "' + (e.textContent || '').slice(0, 20) + '"' : 'nada') +
      '; cursor em ' + (r ? JSON.stringify((r.startContainer.textContent || '').slice(0, 20)) + ' +' + r.startOffset : 'nada');
  }, de));
  await pag.mouse.move(de.x, de.y);
  await pag.mouse.down();
  /* o arrasto só anda depois que o navegador pôs o cursor da seleção onde o
   * mouse desceu (espera por condição, sem tempo fixo). A seleção que pegava
   * o título junto só apareceu nas rodadas com --prints: era o print, que
   * redesenhava as páginas (ver print acima), e não a falta desta espera */
  const ancoraSel = () => pag.evaluate(() => { const s = window.getSelection(); return s.anchorNode ? JSON.stringify((s.anchorNode.textContent || '').slice(0, 12)) + ' +' + s.anchorOffset : ''; });
  const anc = await esperar('o cursor da seleção onde o mouse desceu', ancoraSel, v => !!v, 3000);
  console.log('   cursor da seleção: ' + (anc.valor || 'nenhum'));
  await pag.mouse.move(ate.x, ate.y, { steps: 12 });
  await pag.mouse.up();
  const selMouse = await selecao();
  await pag.bringToFront();
  await pag.keyboard.down('Control');
  await pag.keyboard.press('KeyC');
  await pag.keyboard.up('Control');
  const copia = await esperar('o Ctrl+C chegou ao documento', () => pag.evaluate(() => window.__copias.length), v => v > 0, 3000);
  const copiado = await pag.evaluate(() => navigator.clipboard.readText().catch(e => 'ERRO: ' + e.message));
  console.log('   seleção do mouse: ' + JSON.stringify(selMouse) + '; copiado: ' + JSON.stringify(copiado) + ' (evento copy: ' + copia.ok + ')');
  await print('depois', 'p206_depois_da_selecao');
  // o arrasto sai de dentro do primeiro E: a cópia COMEÇA no exercício (a camada está no lugar da letra desenhada)
  checa('arrastar o mouse pela linha e copiar põe na área de transferência o texto que começa em "Exercício 206"', /^Exercício 206/.test(copiado), true, 'sem-selecao');

  /* 2b. O arrasto que passa do fim da linha (o dedo no tablet quase sempre
   * passa). O fim da linha é o da TINTA no canvas (o último pixel escuro na
   * faixa da linha do exercício, 126 a 142 pt) ou o do texto da camada, o que
   * vier mais à direita (ver abaixo). Sem o fim do
   * conteúdo (div.endOfContent com a classe selecting, como no visualizador do
   * pdf.js), o arrasto 2 pt depois da tinta copiava "\r\n", e o que saía do
   * título até ali copiava só o título. A cópia tem de ser a linha inteira, e
   * nada a mais (só o fim de linha final é tolerado). */
  const tinta = await pag.evaluate(() => {
    const k = document.querySelector('#corpo-modal-leitor-pdf [data-pagina-arquivo="206"] canvas');
    const g = k.getContext('2d', { willReadFrequently: true });
    const y0 = Math.round(k.height * 126 / 842), y1 = Math.round(k.height * 142 / 842);
    const d = g.getImageData(0, y0, k.width, y1 - y0).data;
    let maxX = -1;
    for (let y = 0; y < y1 - y0; y++) for (let x = 0; x < k.width; x++) {
      const i = (y * k.width + x) * 4;
      if (d[i + 3] > 0 && 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2] < 128 && x > maxX) maxX = x;
    }
    return maxX < 0 ? null : (maxX + 1) * 595 / k.width;
  });
  /* e o fim do texto da camada na mesma linha: no Chrome do CI (Linux) o pedaço
   * da camada passa da tinta (2 pt depois da tinta ainda caía dentro de "206."),
   * e o arrasto que termina em cima do pedaço não mede o que passa do fim. O fim
   * do arrasto fica depois dos DOIS fins, o desenhado e o selecionável. */
  const fimCamada = await pag.evaluate(() => {
    const b = document.querySelector('#corpo-modal-leitor-pdf [data-pagina-arquivo="206"]'), q = b.getBoundingClientRect();
    const ps = Array.from(b.querySelectorAll('.textLayer span')).filter(s => /Exercício|Calcule|206\./.test(s.textContent) && !s.children.length);
    if (!ps.length) return null;
    return (Math.max.apply(null, ps.map(s => s.getBoundingClientRect().right)) - q.left) * 595 / q.width;
  });
  console.log('   fim da tinta da linha do exercício: ' + (tinta === null ? 'nenhum' : tinta.toFixed(1) + ' pt') +
    '; fim do texto da camada na linha: ' + (fimCamada === null ? 'nenhum' : fimCamada.toFixed(1) + ' pt'));
  conf('a prova achou a tinta da linha do exercício no canvas', tinta !== null && tinta > 300 && tinta < 560, true);
  conf('e o fim do texto da camada na mesma linha', fimCamada !== null && fimCamada > 300 && fimCamada < 560, true);
  /* A camada é o que o dedo seleciona e o realce que ela vê: tem de acabar onde a
   * letra desenhada acaba. Camada que passa da tinta (ou fica aquém) é defeito de
   * alinhamento da camada, e o conserto é nela, não no arrasto da prova. Folga de
   * 3 pt: meia letra do corpo 12 do livro sintético. O diagnóstico imprime cada
   * pedaço da linha (texto, largura, --scale-x, fonte), para achar a causa. */
  const pedacos = await pag.evaluate(() => {
    const b = document.querySelector('#corpo-modal-leitor-pdf [data-pagina-arquivo="206"]'), q = b.getBoundingClientRect();
    return Array.from(b.querySelectorAll('.textLayer span')).filter(s => !s.children.length && s.textContent.trim()).map(s => {
      const r = s.getBoundingClientRect(), cs = getComputedStyle(s);
      return { t: s.textContent.slice(0, 40), esq: ((r.left - q.left) * 595 / q.width).toFixed(1), dir: ((r.right - q.left) * 595 / q.width).toFixed(1),
        scaleX: s.style.getPropertyValue('--scale-x') || cs.getPropertyValue('--scale-x'), fonte: cs.fontFamily, tam: cs.fontSize, transf: cs.transform };
    });
  });
  for (const p of pedacos) console.log('   pedaço: ' + JSON.stringify(p));
  console.log('   camada menos tinta na linha do exercício: ' + (tinta !== null && fimCamada !== null ? (fimCamada - tinta).toFixed(1) + ' pt' : 'sem medida'));
  conf('a camada acaba onde a tinta acaba, na linha do exercício (diferença até 3 pt)', tinta !== null && fimCamada !== null && Math.abs(fimCamada - tinta) <= 3, true);
  const LINHA = 'Exercício 206. Calcule a soma dos números de 1 a 206.';
  const TITULO = 'Página 206 do livro do leitor.';
  const arrastaECopia = async (dePt, atePt) => {
    await limparSelecao();
    await pag.evaluate(() => { window.__copias = []; });
    const p0 = await pontoDaPagina(206, dePt[0], dePt[1]), p1 = await pontoDaPagina(206, atePt[0], atePt[1]);
    await pag.mouse.move(p0.x, p0.y);
    await pag.mouse.down();
    await esperar('o cursor da seleção onde o mouse desceu', ancoraSel, v => !!v, 3000);
    await pag.mouse.move(p1.x, p1.y, { steps: 12 });
    await pag.mouse.up();
    await pag.keyboard.down('Control');
    await pag.keyboard.press('KeyC');
    await pag.keyboard.up('Control');
    await esperar('o Ctrl+C chegou ao documento', () => pag.evaluate(() => window.__copias.length), v => v > 0, 3000);
    const c = await pag.evaluate(() => navigator.clipboard.readText().catch(e => 'ERRO: ' + e.message));
    // o fim de linha do sistema (\r\n no Windows) vira \n; só o fim de linha final é tirado
    return c.replace(/\r\n/g, '\n').replace(/\n$/, '');
  };
  const fimX = Math.max(tinta || 0, fimCamada || 0);
  for (const passa of [2, 20]) {
    const c = await arrastaECopia([74, 135], [fimX + passa, 135]);
    console.log('   da linha do exercício até ' + passa + ' pt depois do fim da linha (' + (fimX + passa).toFixed(1) + ' pt): copiado ' + JSON.stringify(c));
    checa('arrastar do começo de "Exercício" até ' + passa + ' pt depois do fim da linha copia a linha inteira', c, LINHA, 'sem-fim-do-conteudo');
  }
  const c2 = await arrastaECopia([74, 83], [fimX + 2, 135]);
  console.log('   do título até 2 pt depois do fim da linha do exercício: copiado ' + JSON.stringify(c2));
  checa('arrastar do começo do título até 2 pt depois do fim da linha do exercício copia as duas linhas', c2, TITULO + '\n' + LINHA, 'sem-fim-do-conteudo');
  await limparSelecao();
  if (await pararNoVeneno(2)) return;

  // ================================================================
  secao('3. A caneta (S Pen) não seleciona');
  await limparSelecao();
  const cdp = await pag.target().createCDPSession();
  const caneta = (type, p, buttons) => cdp.send('Input.dispatchMouseEvent',
    { type, x: p.x, y: p.y, button: 'left', buttons, clickCount: 1, pointerType: 'pen' });
  // o selectstart que chega ao documento, e se o app o cancelou (o leitor o ouve antes, no corpo)
  await pag.evaluate(() => {
    window.__ponteiros = [];
    window.__inicios = [];
    if (!window.__ouveInicio) {
      window.__ouveInicio = true;
      document.addEventListener('selectstart', e => window.__inicios.push(e.defaultPrevented ? 'cancelado' : 'livre'));
    }
  });
  await caneta('mouseMoved', de, 0);
  await caneta('mousePressed', de, 1);
  // como no mouse: o arrasto só anda depois do cursor da seleção (sem o bloqueio, ele aparece)
  const ancCaneta = await esperar('o cursor da seleção onde a caneta desceu', ancoraSel, v => !!v, 3000);
  for (let i = 1; i <= 12; i++) await caneta('mouseMoved', { x: de.x + (ate.x - de.x) * i / 12, y: de.y }, 1);
  await caneta('mouseReleased', ate, 0);
  const ponteiros = await pag.evaluate(() => window.__ponteiros.join(','));
  const inicios = await pag.evaluate(() => window.__inicios.join(','));
  const selCaneta = await selecao();
  console.log('   ponteiros vistos: ' + ponteiros + '; selectstart: ' + (inicios || 'nenhum') + '; cursor: ' + (ancCaneta.valor || 'nenhum') +
    '; seleção da caneta: ' + JSON.stringify(selCaneta));
  conf('o arrasto foi mesmo da caneta (pointerType pen)', ponteiros, 'pen');
  /* O INSTRUMENTO: neste Chrome o arrasto pen do CDP NUNCA estende a seleção,
   * nem sem o bloqueio (medido com o veneno: 0 de 10 e depois 0 de 1 com a
   * espera do cursor). Mas o toque da caneta faz o PRÓPRIO navegador disparar
   * o selectstart e, sem o bloqueio, pôr o cursor da seleção no texto. Então
   * a prova confere o que o navegador fez com a caneta de verdade do CDP: o
   * selectstart veio (controle do instrumento, nos dois modos), o app o
   * cancelou, e o cursor da seleção não foi posto. NÃO prova o caminho da S
   * Pen no tablet (o toque longo e as alças do Android). */
  conf('o toque da caneta fez o navegador disparar o selectstart (o instrumento enxerga)', inicios.length > 0, true);
  checa('o app cancelou o selectstart da caneta', inicios.split(',').every(v => v === 'cancelado'), true, 'caneta-seleciona');
  checa('e o cursor da seleção não foi posto onde a caneta desceu', ancCaneta.valor || '', '', 'caneta-seleciona');
  // No Chrome do Linux (CI) o arrasto pen do CDP seleciona sem o bloqueio, e esta
  // verificação é o controle positivo dele; no Windows ele nunca selecionava.
  checa('e nada ficou selecionado', selCaneta, '', 'caneta-seleciona');
  if (await pararNoVeneno(3)) return;

  // ================================================================
  secao('4. Texto vivo só nas páginas desenhadas, em 80 passos de 300 px');
  await limparSelecao();
  let pior = { camadaSemCanvas: '', passo: 0 }, maxCamadas = 0, maxSpans = 0, maxCanvases = 0;
  for (let i = 1; i <= 80; i++) {
    await rolar(300);
    const s = await estado();
    maxCamadas = Math.max(maxCamadas, s.camadas);
    maxSpans = Math.max(maxSpans, s.spansVivos);
    maxCanvases = Math.max(maxCanvases, s.canvases);
    if (s.camadaSemCanvas && !pior.camadaSemCanvas) pior = { camadaSemCanvas: s.camadaSemCanvas, passo: i };
  }
  const s4 = await pronto('a rolagem de 80 passos parou');
  console.log('   em 80 passos: no máximo ' + maxCamadas + ' camadas, ' + maxSpans + ' elementos de texto e ' + maxCanvases +
    ' páginas desenhadas; no fim, à vista ' + s4.aVista + ', desenhadas ' + s4.desenhadas + ', camadas ' + s4.camadas +
    (pior.camadaSemCanvas ? '; primeira camada sem canvas no passo ' + pior.passo + ': p. ' + pior.camadaSemCanvas : ''));
  checa('em nenhum dos 80 passos uma página sem canvas tinha camada de texto', pior.camadaSemCanvas, '', 'texto-sem-soltar');
  checa('no fim, camada de texto só nas páginas desenhadas', s4.camadaSemCanvas, '', 'texto-sem-soltar');
  conf('e as páginas à vista no fim têm o texto delas', s4.camadas > 0, true);
  if (await pararNoVeneno(4)) return;

  // ================================================================
  secao('5. O escaneado: nenhuma camada, e a frase uma vez');
  const frasesTexto = await pag.evaluate(() => window.__frases['livro-leitor-400'] || 0);
  checa('no livro de texto a frase do escaneado não aparece', frasesTexto, 0, 'aviso-repetido');
  await clicar(pag, '#modal-leitor-pdf .fechar');
  await esperar('o leitor fechado', () => pag.evaluate(() => !document.querySelector('#modal-leitor-pdf.aberto')), v => v, 5000);
  await abrirLivro('livro-escaneado-12');
  await pronto('o escaneado aberto');
  // as 12 páginas passam pela tela: cada uma é desenhada e lida
  const lidas = new Set();
  for (let i = 0; i < 40 && lidas.size < 12; i++) {
    const s = await pronto('o escaneado, passo ' + i);
    s.desenhadas.split(',').filter(Boolean).forEach(n => lidas.add(n));
    if (lidas.size >= 12) break;
    await rolar(700);
  }
  const s5 = await estado();
  const frasesEsc = await pag.evaluate(() => window.__frases['livro-escaneado-12'] || 0);
  console.log('   escaneado: ' + lidas.size + ' páginas desenhadas e lidas; ' + s5.camadas + ' camadas e ' + s5.spansVivos +
    ' elementos de texto; a frase dita ' + frasesEsc + ' vez(es)');
  conf('as 12 páginas do escaneado passaram pela tela', lidas.size, 12);
  checa('no escaneado, 0 elementos de texto (nenhuma camada)', s5.camadas + s5.spansVivos, 0, 'escaneado-com-camada');
  checa('a frase "' + FRASE + '" aparece uma vez', frasesEsc, 1, 'aviso-repetido');
  if (await pararNoVeneno(5)) return;

  conf('nenhum erro de página', errosDePagina.join(' | '), '');
  if (PRINTS) console.log('   prints em ' + PRINTS);
  await H.fim(amb)();
})().catch(H.fim(amb));
