const puppeteer = require('puppeteer-core');
const path = require('path');
const arquivo = process.argv[2], saida = process.argv[3];
const pagina = parseInt(process.argv[4] || '1', 10);
const zoom = process.argv[5] || '160';
const alt = parseInt(process.argv[6] || '1600', 10);
const url = 'file:///' + path.resolve(arquivo).split(String.fromCharCode(92)).join('/') +
  '#page=' + pagina + '&zoom=' + zoom;
(async () => {
  const nav = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox'], defaultViewport: { width: 1250, height: alt }
  });
  const pag = await nav.newPage();
  await pag.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 4000));
  await pag.screenshot({ path: saida });
  await nav.close();
  console.log('pagina ' + pagina + ' zoom ' + zoom + ' em ' + saida);
})();
