/* Print da barra de ferramentas da folha, antes e depois dos ícones. */
const puppeteer = require('puppeteer-core');
const fs = require('fs'), path = require('path');
const dados = require('./_prints_dados.js');
const espera = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const nav = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox', '--force-device-scale-factor=2'],
    defaultViewport: { width: 1180, height: 900, deviceScaleFactor: 2, hasTouch: true }
  });
  const pag = await nav.newPage();
  await pag.goto('http://127.0.0.1:8777/index.html', { waitUntil: 'networkidle0' });
  await espera(1200);
  const banco = dados.montar('2026-09');
  await pag.evaluate((b) => new Promise((res) => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const t = req.result.transaction('dados', 'readwrite');
      t.objectStore('dados').put(b, 'principal');
      t.oncomplete = () => res();
    };
  }), banco);
  await pag.reload({ waitUntil: 'networkidle0' });
  await espera(1500);

  await pag.evaluate(async () => {
    let g = 0;
    while (document.querySelector('#rotulo-mes').textContent !== 'Setembro de 2026' && g++ < 40) {
      const alvo = document.querySelector('#rotulo-mes').textContent;
      document.querySelector(alvo > 'Setembro de 2026' ? '#mes-anterior' : '#mes-seguinte').click();
      await new Promise(r => setTimeout(r, 50));
    }
  });
  await espera(800);
  await pag.evaluate(() => {
    document.querySelector('[data-dia="2026-09-02"]').querySelector('.pilula').click();
  });
  await espera(600);
  await pag.evaluate(() => {
    Array.from(document.querySelectorAll('#linha-folha button'))
      .find(b => /folha/i.test(b.textContent)).click();
  });
  await espera(1600);

  const barra = await pag.$('#ferramentas-nota');
  const dest = path.join(__dirname, 'prints', 'depois-ferramentas.png');
  await barra.screenshot({ path: dest });
  console.log('barra de ferramentas:', Math.round(fs.statSync(dest).size / 1024), 'KB');
  await nav.close();
})().catch(e => { console.error(e.message); process.exit(1); });
