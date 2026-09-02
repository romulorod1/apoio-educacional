/* Gera o PDF da página de novidades, usando as regras de impressão da própria
   página. Serve para ela abrir no tablet sem depender de navegador nenhum. */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const origem = process.argv[2];
const destino = process.argv[3];

(async () => {
  const nav = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox']
  });
  const pag = await nav.newPage();
  await pag.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await pag.goto('file:///' + path.resolve(origem).split(String.fromCharCode(92)).join('/'),
    { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));

  // rola tudo, para nenhuma imagem preguiçosa ficar de fora
  await pag.evaluate(async () => {
    const passo = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += passo) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 1200));

  await pag.emulateMediaType('print');
  await pag.pdf({
    path: destino,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false
  });

  const kb = fs.statSync(destino).size / 1024;
  console.log('PDF: %s  %.1f MB', path.basename(destino), kb / 1024);
  await nav.close();
})().catch(e => { console.error(e.message); process.exit(1); });
