/* Rende as folhas da comparacao cega em PNG, no Chrome headless.
 *
 *   node biblioteca/_folhas_cegas.js <pasta da comparacao>
 *
 * Varre a pasta atras de par-NN-lista-X.html, que o _comparacao_cega.py
 * escreveu, e grava o PNG ao lado. O revisor olha o PNG, que e o que a
 * professora veria na folha: o recorte vetorial da fonte, com o rotulo
 * original tapado e renumerado.
 *
 * Por que PNG e nao texto: em geometria a figura e metade do problema, e uma
 * comparacao feita sobre o texto do enunciado julgaria outra coisa.
 *
 * O PNG sai com deviceScaleFactor 2 e largura fixa, e a altura e a da folha
 * inteira. Folha muito alta e reduzida ate caber em ALTURA_MAXIMA px, para o
 * arquivo continuar legivel de uma vez so; a reducao fica registrada na saida,
 * porque "o revisor nao conseguiu ler" tem de ser um fato escrito e nao uma
 * suposicao de quem monta.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require(path.join(__dirname, '..', '_teste', 'node_modules', 'puppeteer-core'));

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
/* A janela e em PIXELS CSS e a folha e em PONTOS: 1 pt vale 4/3 px. O corpo
 * tem 300 pt de conteudo mais 32 pt de recuo lateral, ou seja 332 pt, que dao
 * 443 px. Uma janela de 340 px cortaria a folha pela metade, e o revisor
 * julgaria um recorte cortado achando que era o exercicio. */
const LARGURA = 470;
const ESCALA = 2;
const ALTURA_MAXIMA = 2600;   // px do PNG final

function varrer(raiz) {
  const achados = [];
  for (const nome of fs.readdirSync(raiz)) {
    const inteiro = path.join(raiz, nome);
    if (fs.statSync(inteiro).isDirectory()) achados.push(...varrer(inteiro));
    else if (/^par-\d+-lista-[AB]\.html$/.test(nome)) achados.push(inteiro);
  }
  return achados;
}

(async () => {
  const raiz = process.argv[2];
  if (!raiz || !fs.existsSync(raiz)) { console.error('pasta nao existe: ' + raiz); process.exit(1); }
  const folhas = varrer(raiz).sort();
  const navegador = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const reduzidas = [];
  let ok = 0;
  try {
    const pagina = await navegador.newPage();
    for (const html of folhas) {
      await pagina.setViewport({ width: LARGURA, height: 1200, deviceScaleFactor: ESCALA });
      await pagina.goto('file:///' + html.replace(/\\/g, '/'), { waitUntil: 'load' });
      await pagina.evaluate(() => Promise.all(
        Array.from(document.images).map(im => im.complete ? null : new Promise(r => { im.onload = im.onerror = r; }))));
      const alturaPx = await pagina.evaluate(() => Math.ceil(document.body.getBoundingClientRect().height) + 8);
      const larguraReal = await pagina.evaluate(() => Math.ceil(document.body.scrollWidth));
      if (larguraReal > LARGURA) throw new Error('a folha tem ' + larguraReal + ' px e a janela ' + LARGURA +
        ': o recorte sairia cortado em ' + path.basename(html));
      let escala = ESCALA;
      if (alturaPx * escala > ALTURA_MAXIMA) {
        escala = Math.max(0.5, ALTURA_MAXIMA / alturaPx);
        reduzidas.push(path.basename(html) + ' (' + alturaPx + ' px, escala ' + escala.toFixed(2) + ')');
      }
      await pagina.setViewport({ width: LARGURA, height: alturaPx, deviceScaleFactor: escala });
      await pagina.screenshot({ path: html.replace(/\.html$/, '.png'), captureBeyondViewport: false });
      ok++;
    }
  } finally {
    await navegador.close();
  }
  process.stdout.write('renderizadas ' + ok + ' folhas\n');
  if (reduzidas.length) {
    process.stdout.write('folhas reduzidas para caber em ' + ALTURA_MAXIMA + ' px: ' + reduzidas.length + '\n');
    for (const r of reduzidas) process.stdout.write('   ' + r + '\n');
  } else {
    process.stdout.write('nenhuma folha precisou ser reduzida\n');
  }
})().catch((e) => { console.error(e); process.exit(1); });
