/* testa_cabecalho_tablet_navegador.js
 *
 * Prova de navegador para o item B5:
 * Validacao dinamica no Chrome do cabecalho em uma linha de 64 px
 * e abas com alvos de 44 px nas larguras do tablet em pe (721px, 850px e 900px).
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = (process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const URL_APP = process.env.URL_APP || 'http://127.0.0.1:8777/index.html';

let falhas = 0, passes = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else {
    falhas++;
    console.error('  FALHA | ' + rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado);
  }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: 'new',
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
  } catch (e) {
    console.error('Nao foi possivel iniciar o Chrome:', e.message);
    process.exit(1);
  }

  try {
    const page = await browser.newPage();
    let urlParaAbrir = URL_APP;
    try {
      await page.goto(urlParaAbrir, { waitUntil: 'domcontentloaded', timeout: 5000 });
    } catch (e) {
      // Fallback para arquivo direto caso servidor HTTP nao esteja rodando na porta
      urlParaAbrir = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
      await page.goto(urlParaAbrir, { waitUntil: 'domcontentloaded' });
    }

    await page.waitForSelector('.cabecalho');

    const largurasTablet = [721, 800, 850, 884, 900];

    for (const w of largurasTablet) {
      secao(`Medicao no tablet em pe: largura ${w}px`);
      await page.setViewport({ width: w, height: 1000, hasTouch: true });
      await new Promise(r => setTimeout(r, 100));

      const dados = await page.evaluate(() => {
        const cab = document.querySelector('.cabecalho');
        const subtitulo = document.querySelector('.marca span');
        const abas = Array.from(document.querySelectorAll('.aba'));
        const olho = document.querySelector('.olho');

        const cabRect = cab.getBoundingClientRect();
        const tops = abas.map(a => Math.round(a.getBoundingClientRect().top));
        const alturas = abas.map(a => Math.round(a.getBoundingClientRect().height));
        const subDisplay = window.getComputedStyle(subtitulo).display;
        const olhoRect = olho.getBoundingClientRect();

        return {
          alturaCabecalho: Math.round(cabRect.height),
          mesmaLinha: new Set(tops).size === 1,
          tops,
          alturas,
          subtituloOculto: subDisplay === 'none',
          alturaOlho: Math.round(olhoRect.height),
          larguraOlho: Math.round(olhoRect.width)
        };
      });

      conf(`[${w}px] cabecalho exatamente em 64px de altura`, dados.alturaCabecalho, 64);
      conf(`[${w}px] subtitulo "Apoio Educacional" oculto`, dados.subtituloOculto, true);
      conf(`[${w}px] todas as 5 abas em uma unica linha`, dados.mesmaLinha, true);
      conf(`[${w}px] todas as abas tem altura de toque de 44px`, dados.alturas.every(h => h === 44), true);
      conf(`[${w}px] botao do olho tem 44x44px de toque`, dados.alturaOlho === 44 && dados.larguraOlho === 44, true);
    }

    secao('Medicao de controle: desktop (1024px) e celular (720px)');

    // Desktop
    await page.setViewport({ width: 1024, height: 800 });
    await new Promise(r => setTimeout(r, 100));
    const desk = await page.evaluate(() => {
      const cab = document.querySelector('.cabecalho');
      const subtitulo = document.querySelector('.marca span');
      return {
        altura: Math.round(cab.getBoundingClientRect().height),
        subtituloVisivel: window.getComputedStyle(subtitulo).display !== 'none'
      };
    });
    conf('[1024px] cabecalho em 64px no desktop', desk.altura, 64);
    conf('[1024px] subtitulo visivel no desktop', desk.subtituloVisivel, true);

    // Celular
    await page.setViewport({ width: 720, height: 800 });
    await new Promise(r => setTimeout(r, 100));
    const cel = await page.evaluate(() => {
      const cab = document.querySelector('.cabecalho');
      const subtitulo = document.querySelector('.marca span');
      return {
        subtituloOculto: window.getComputedStyle(subtitulo).display === 'none',
        flexDirection: window.getComputedStyle(cab).flexDirection
      };
    });
    conf('[720px] subtitulo oculto no celular', cel.subtituloOculto, true);
    conf('[720px] layout coluna preservado no celular estreito', cel.flexDirection, 'column');

  } finally {
    if (browser) await browser.close();
  }

  console.log('\n' + '='.repeat(60));
  console.log(passes + ' verificacoes passaram, ' + falhas + ' falharam.');
  console.log('='.repeat(60));

  if (falhas > 0) process.exit(1);
})().catch(err => {
  console.error('Erro na execucao da prova de navegador:', err);
  process.exit(1);
});
