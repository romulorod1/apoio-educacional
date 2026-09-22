/* Renderiza SVGs de recorte no Chrome headless, para a prova de fidelidade.
 *
 *   node biblioteca/_fidelidade.js <pedidos.json>
 *
 * pedidos.json: [{"svg": "a.svg", "png": "a.png", "largura_pt": 294.5, "altura_pt": 28, "escala": 2.0833}, ...]
 *
 * O <img> tem o tamanho do SVG em pontos (1 pt = 1 px CSS) e a escala entra
 * como deviceScaleFactor. Nao se arredonda o tamanho em pixels antes: com o
 * <img> em 612 x 58 px para um SVG de 294 x 28, a proporcao muda um pouco e o
 * SVG, que por padrao encolhe e centraliza (preserveAspectRatio "meet"), saia
 * 1,5 px deslocado para o lado, o que a prova media como diferenca de conteudo.
 *
 * Um navegador so para todos os pedidos, fechado no fim aconteca o que
 * acontecer: e o custo de memoria que o portao mede.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require(path.join(__dirname, '..', '_teste', 'node_modules', 'puppeteer-core'));

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const pedidos = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const navegador = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  let ok = 0;
  try {
    const pagina = await navegador.newPage();
    for (const p of pedidos) {
      const svg = fs.readFileSync(p.svg);
      const url = 'data:image/svg+xml;base64,' + svg.toString('base64');
      await pagina.setViewport({
        width: Math.ceil(p.largura_pt) + 20, height: Math.ceil(p.altura_pt) + 20, deviceScaleFactor: p.escala
      });
      await pagina.setContent(
        '<html><body style="margin:0;background:#fff">' +
        '<img id="r" style="display:block;width:' + p.largura_pt + 'px;height:' + p.altura_pt + 'px" src="' + url + '">' +
        '</body></html>', { waitUntil: 'load' });
      await pagina.waitForFunction(() => document.getElementById('r').complete);
      await pagina.screenshot({
        path: p.png,
        clip: { x: 0, y: 0, width: p.largura_pt, height: p.altura_pt }
      });
      ok++;
    }
  } finally {
    await navegador.close();
  }
  process.stdout.write('renderizados ' + ok + '\n');
})().catch((e) => { console.error(e); process.exit(1); });
