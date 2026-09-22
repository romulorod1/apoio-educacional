/* Piloto interno: um material em PDF, na identidade dela, montado a partir do pacote.
 *
 *   node biblioteca/piloto_pdf.js --pacote <pasta de trabalho do pacote> --saida <pasta>
 *        [--pdfjs <caminho do pdf.js>] [--marca multiplicar|fundo]
 *
 * Monta: 3 paginas de teoria de "Resultados Basicos - Parte I" (sem a capa), os
 * exercicios 4 a 11 da lista "Equacao do 2o grau: resultados basicos"
 * renumerados de 1 a 8, com a origem em letra pequena, e o gabarito em folha
 * separada, tudo dentro da moldura do pdf.js (cabecalho, rodape, numeracao).
 *
 * Os recortes passam pelo mesmo caminho que o aplicativo vai usar: o SVG do
 * pacote e desenhado num canvas no Chrome, no dpi do PDF, vira JPEG e entra
 * pelo DCTDecode do pdf.js. O rotulo original ("Exercicio 7.") e coberto de
 * branco na rasterizacao, pela caixa medidas.*.rotulo do pacote, e o numero
 * novo e escrito no lugar. O asset nunca e alterado.
 *
 * A marca d'agua decidida pela B4 e por cima, em multiplicacao: precisa do
 * remendo dela (pdf_js_remendo_marca_multiplicar.diff) numa copia do pdf.js
 * fora do repositorio, passada em --pdfjs. Sem o remendo, --marca fundo usa o
 * pdf.js do repositorio como esta.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require(path.join(__dirname, '..', '_teste', 'node_modules', 'puppeteer-core'));

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DPI_ITEM = 200;
const DPI_TEORIA = 150;
const TEORIA = { modulo: 'equacoes-do-segundo-grau', aula: 'resultados-basicos-parte-i', paginas: [2, 3, 4] };
const LISTA = { modulo: 'equacoes-do-segundo-grau', aula: 'equacao-do-2o-grau-resultados-basicos', numeros: [4, 5, 6, 7, 8, 9, 10, 11] };

function argumento(nome, padrao) {
  const i = process.argv.indexOf(nome);
  return i >= 0 ? process.argv[i + 1] : padrao;
}

/* Roda dentro da pagina do Chrome: SVG, canvas no dpi pedido, rotulo coberto, JPEG. */
function rasterizarNoNavegador(svg, larguraPt, alturaPt, dpi, rotulo) {
  return new Promise(function (ok, falha) {
    const k = dpi / 72;
    const wPx = Math.round(larguraPt * k), hPx = Math.round(alturaPt * k);
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const im = new Image();
    im.onload = function () {
      const cv = document.createElement('canvas');
      cv.width = wPx; cv.height = hPx;
      const cx = cv.getContext('2d');
      cx.fillStyle = '#fff'; cx.fillRect(0, 0, wPx, hPx);
      cx.drawImage(im, 0, 0, wPx, hPx);
      URL.revokeObjectURL(url);
      if (rotulo) {
        cx.fillStyle = '#fff';
        cx.fillRect((rotulo[0] - 0.5) * k, (rotulo[1] - 0.5) * k, (rotulo[2] - rotulo[0] + 1) * k, (rotulo[3] - rotulo[1] + 1) * k);
      }
      ok({ b64: cv.toDataURL('image/jpeg', 0.92).split(',')[1], wPx: wPx, hPx: hPx });
    };
    im.onerror = function () { URL.revokeObjectURL(url); falha(new Error('SVG nao renderizou')); };
    im.src = url;
  });
}

(async () => {
  const PAC = argumento('--pacote');
  const SAIDA = argumento('--saida');
  const marca = argumento('--marca', 'multiplicar');
  const PDFGen = require(path.resolve(argumento('--pdfjs', path.join(__dirname, '..', 'pdf.js'))));
  fs.mkdirSync(SAIDA, { recursive: true });
  const itens = JSON.parse(fs.readFileSync(path.join(PAC, 'itens.json'), 'utf8'));
  const teoria = JSON.parse(fs.readFileSync(path.join(PAC, 'teoria.json'), 'utf8'));

  const aulaTeoria = teoria.find(t => t.modulo.slug === TEORIA.modulo && t.aula.slug === TEORIA.aula);
  const paginasTeoria = TEORIA.paginas.map(n => aulaTeoria.paginas.find(p => p.n === n));
  const escolhidos = LISTA.numeros.map(n => itens.find(i => i.modulo.slug === LISTA.modulo && i.aula.slug === LISTA.aula && i.numero === n));
  if (escolhidos.some(x => !x) || paginasTeoria.some(x => !x)) throw new Error('item ou pagina ausente no pacote');

  const navegador = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const rast = {};
  try {
    const pag = await navegador.newPage();
    await pag.goto('about:blank');
    await pag.evaluate('window.rasterizar = ' + rasterizarNoNavegador.toString());
    async function rasterizar(rel, l, a, dpi, rotulo) {
      const svg = fs.readFileSync(path.join(PAC, ...rel.split('/')), 'utf8');
      const r = await pag.evaluate((svg, l, a, dpi, rotulo) => window.rasterizar(svg, l, a, dpi, rotulo), svg, l, a, dpi, rotulo);
      return { bytes: new Uint8Array(Buffer.from(r.b64, 'base64')), wPx: r.wPx, hPx: r.hPx };
    }
    for (const p of paginasTeoria) rast[p.asset] = await rasterizar(p.asset, p.medidas.largura_pt, p.medidas.altura_pt, DPI_TEORIA, null);
    for (const it of escolhidos) {
      for (const tipo of ['enunciado', 'solucao']) {
        const m = it.medidas[tipo];
        if (it.assets[tipo]) rast[it.assets[tipo]] = await rasterizar(it.assets[tipo], m.largura_pt, m.altura_pt, DPI_ITEM, m.rotulo);
      }
    }
  } finally {
    await navegador.close();
  }

  const { Doc, COR, MARG_E, UTIL, Y_TOPO, Y_LIMITE } = PDFGen;
  const doc = new Doc();
  doc.lingua = 'pt';
  let n = 0;
  function imagem(asset, x, y, l, a) {
    const ref = 'b' + (++n);
    const r = rast[asset];
    doc.registraImagem(ref, r.bytes, r.wPx, r.hPx);
    doc.desenhaImagem(ref, x, y, l, a);
  }
  const titulo = aulaTeoria.modulo.titulo;
  doc.novaPagina();
  doc.cabecalhoDeSecao(titulo, 'Teoria  ·  ' + aulaTeoria.aula.titulo);
  paginasTeoria.forEach((p, i) => {
    if (i > 0) doc.novaPagina();
    const alto = doc.y - 6 - Y_LIMITE;
    const k = Math.min(UTIL / p.medidas.largura_pt, alto / p.medidas.altura_pt);
    const l = p.medidas.largura_pt * k, a = p.medidas.altura_pt * k;
    const x = MARG_E + (UTIL - l) / 2;
    doc.y -= 6;
    imagem(p.asset, x, doc.y - a, l, a);
    doc.op(COR.fio.map(c => c.toFixed(6)).join(' ') + ' RG 0.5 w ' + x.toFixed(2) + ' ' + (doc.y - a).toFixed(2) +
      ' ' + l.toFixed(2) + ' ' + a.toFixed(2) + ' re S');
    doc.y -= a;
  });

  /* Recorte com o numero novo escrito no lugar do rotulo coberto. */
  function bloco(peca, med, rotuloNovo, tamNum, origem) {
    let l = med.largura_pt, a = med.altura_pt;
    if (l > UTIL) { a = a * UTIL / l; l = UTIL; }
    const cheia = Y_TOPO - Y_LIMITE;
    if (a > cheia) { l = l * cheia / a; a = cheia; }
    const r = med.rotulo;
    doc.garanteEspaco(a + (origem ? 12 : 0) + 10 + (r ? 0 : 16));
    if (!r) {
      // sem a caixa do rotulo original: o numero novo sai numa linha propria,
      // acima do recorte, e o rotulo antigo fica visivel (nao ha o que cobrir)
      doc.y -= 12;
      doc.texto(rotuloNovo, MARG_E, doc.y, { tam: tamNum, bold: true, cor: COR.navy });
    }
    const topo = doc.y - 4;
    const k = l / med.largura_pt;
    imagem(peca, MARG_E, topo - a, l, a);
    if (r) {
      const tam = Math.min(tamNum, (r[3] - r[1]) * k * 1.05, (r[2] - r[0] + 2) * k / PDFGen.medir(rotuloNovo, 1, true));
      doc.texto(rotuloNovo, MARG_E + r[0] * k, topo - r[3] * k + 1.5, { tam: tam, bold: true, cor: COR.navy });
    }
    doc.y = topo - a;
    if (origem) {
      doc.y -= 9;
      doc.texto(origem, MARG_E, doc.y, { tam: 6.5, cor: COR.muted });
    }
    doc.y -= 10;
  }

  doc.novaPagina();
  doc.cabecalhoDeSecao(titulo, 'Exercícios  ·  ' + escolhidos[0].aula.titulo);
  doc.y -= 6;
  escolhidos.forEach((it, i) => {
    const origem = 'Portal da OBMEP, ' + it.aula.titulo + ', exercício ' + it.numero +
      (it.origem_citada ? ' (' + it.origem_citada + ')' : '');
    bloco(it.assets.enunciado, it.medidas.enunciado, 'Exercício ' + (i + 1) + '.', 11, origem);
  });

  doc.novaPagina();
  doc.cabecalhoDeSecao(titulo, 'Gabarito  ·  ' + escolhidos[0].aula.titulo);
  doc.y -= 6;
  escolhidos.forEach((it, i) => {
    if (!it.assets.solucao) {
      doc.garanteEspaco(24);
      doc.y -= 14;
      doc.texto((i + 1) + '.', MARG_E, doc.y, { tam: 10, bold: true, cor: COR.navy });
      doc.texto('Sem solução na fonte.', MARG_E + 20, doc.y, { tam: 9.5, cor: COR.muted });
      doc.y -= 8;
      return;
    }
    bloco(it.assets.solucao, it.medidas.solucao, (i + 1) + '.', 10, null);
  });

  if (marca === 'multiplicar') {
    if (!/marcaPorCima/.test(fs.readFileSync(require.resolve(path.resolve(argumento('--pdfjs', path.join(__dirname, '..', 'pdf.js')))), 'utf8'))) {
      throw new Error('--marca multiplicar pede o pdf.js com o remendo da B4 (--pdfjs)');
    }
    doc.paginas.forEach(p => { p.marcaPorCima = true; });
  }
  const bytes = doc.finalizar();
  const destino = path.join(SAIDA, 'piloto_9ano_marca_' + marca + '.pdf');
  fs.writeFileSync(destino, bytes);
  process.stdout.write(destino + ' ' + doc.paginas.length + ' paginas ' + (bytes.length / 1024).toFixed(0) + ' KB\n');
})().catch(e => { console.error(e); process.exit(1); });
