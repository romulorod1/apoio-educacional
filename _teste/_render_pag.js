const puppeteer = require('puppeteer-core');
const path = require('path');
const arquivo = process.argv[2], saida = process.argv[3], pagina = parseInt(process.argv[4] || '1', 10);
const url = 'file:///' + path.resolve(arquivo).split(String.fromCharCode(92)).join('/') + '#page=' + pagina;
(async () => {
  const nav = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox'], defaultViewport: { width: 1000, height: 1300 }
  });
  const pag = await nav.newPage();
  await pag.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 4000));
  await pag.screenshot({ path: saida });
  await nav.close();
  console.log('pagina ' + pagina + ' em ' + saida);
})();
