const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox']
  });
  const p = await b.newPage();
  p.on('console', m => console.log('[console.' + m.type() + ']', m.text()));
  p.on('pageerror', e => console.log('[ERRO DE PAGINA]', e.message, '\n', (e.stack||'').split('\n').slice(0,4).join('\n')));
  p.on('requestfailed', r => console.log('[REQUISICAO FALHOU]', r.url(), r.failure().errorText));
  await p.goto('http://127.0.0.1:8777/index.html', {waitUntil:'networkidle0'});
  await new Promise(r => setTimeout(r, 1500));
  const info = await p.evaluate(() => ({
    rotulo: document.querySelector('#rotulo-mes').textContent,
    dias: document.querySelectorAll('.dia').length,
    pilulas: document.querySelectorAll('.pilula').length,
    temCore: typeof Core, temStore: typeof Store, temDraw: typeof Draw, temPdf: typeof PDFGen
  }));
  console.log('ESTADO:', JSON.stringify(info));
  await b.close();
})();
