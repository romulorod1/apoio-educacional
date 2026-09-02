const puppeteer = require('puppeteer-core');
const fs = require('fs'), path = require('path');
const SAIDA = path.join(__dirname, 'prints');
const ALVOS = [
  ['depois-mapa-matematica', '#m-mapa-matematica'],
  ['depois-mapa-historia',   '#m-mapa-historia']
];
(async () => {
  const nav = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox', '--force-device-scale-factor=2'],
    defaultViewport: { width: 1200, height: 900, deviceScaleFactor: 2 }
  });
  const pag = await nav.newPage();
  await pag.goto('http://127.0.0.1:8777/_teste/prints/_maquetes5.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1800));
  for (const [nome, sel] of ALVOS) {
    const el = await pag.$(sel);
    if (!el) { console.log('FALTOU', nome); continue; }
    await el.screenshot({ path: path.join(SAIDA, nome + '.png') });
    console.log('  ' + nome + '  ' + Math.round(fs.statSync(path.join(SAIDA, nome + '.png')).size / 1024) + ' KB');
  }
  await nav.close();
})().catch(e => { console.error(e.message); process.exit(1); });
