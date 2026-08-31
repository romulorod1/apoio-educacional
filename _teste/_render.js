const puppeteer = require('puppeteer-core');
const path = require('path');
const arquivo = process.argv[2];
const saida = process.argv[3] || '_render.png';
const url = 'file:///' + path.resolve(arquivo).split(String.fromCharCode(92)).join('/');
(async () => {
  const nav = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox'],
    defaultViewport: { width: 1000, height: 1400 }
  });
  const pag = await nav.newPage();
  await pag.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3500));
  await pag.screenshot({ path: saida });
  await nav.close();
  console.log('renderizado em ' + saida);
})();
