const puppeteer = require('puppeteer-core');
const path = require('path');
(async () => {
  const nav = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox'], defaultViewport: { width: 1100, height: 1400 }
  });
  const pag = await nav.newPage();
  const url = 'file:///' + path.resolve(process.argv[2]).split(String.fromCharCode(92)).join('/');
  await pag.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 4000));
  const total = await pag.evaluate(() => {
    const el = document.querySelector('#numPages') || document.querySelector('[aria-label*="de"]');
    return document.title;
  });
  for (const n of (process.argv[3] || '1,2,3').split(',')) {
    await pag.goto(url + '#page=' + n, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 3000));
    await pag.screenshot({ path: path.join(__dirname, 'prints', 'v_pdfpag_' + n + '.png') });
    console.log('pagina ' + n + ' capturada');
  }
  await nav.close();
})();
