const puppeteer = require('puppeteer-core');
const fs = require('fs'), path = require('path');
(async () => {
  const nav = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox'],
    defaultViewport: { width: 1120, height: 1120 }
  });
  const pag = await nav.newPage();
  await pag.goto('http://127.0.0.1:8777/_teste/prints/_cartao.html', { waitUntil: 'networkidle0' });
  await pag.waitForFunction(() => document.title === 'pronto', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 600));
  const el = await pag.$('#cartao');
  const dest = path.join(__dirname, 'prints', 'depois-cartao.png');
  await el.screenshot({ path: dest });
  console.log('cartao 1080x1080:', Math.round(fs.statSync(dest).size / 1024), 'KB');
  await nav.close();
})().catch(e => { console.error(e.message); process.exit(1); });
