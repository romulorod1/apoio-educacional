const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SAIDA = path.join(__dirname, 'prints');
const ALVOS = [
  ['depois-registro',       '#m-registro'],
  ['depois-erros',          '#m-erros'],
  ['depois-curva',          '#m-curva'],
  ['depois-relacionamento', '#m-relacionamento'],
  ['depois-trilha',         '#m-trilha'],
  ['depois-combinado',      '#m-combinado'],
  ['depois-olhinho',        '#m-olhinho'],
  ['depois-protecao',       '#m-protecao']
];
(async () => {
  const nav = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--force-device-scale-factor=2'],
    defaultViewport: { width: 1200, height: 900, deviceScaleFactor: 2 }
  });
  const pag = await nav.newPage();
  const url = 'http://127.0.0.1:8777/_teste/prints/_maquetes.html';
  await pag.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  for (const [nome, sel] of ALVOS) {
    const el = await pag.$(sel);
    if (!el) { console.log('FALTOU', nome, sel); continue; }
    await el.screenshot({ path: path.join(SAIDA, nome + '.png') });
    console.log('  ' + nome + '  ' + Math.round(fs.statSync(path.join(SAIDA, nome + '.png')).size / 1024) + ' KB');
  }
  await nav.close();
})().catch(e => { console.error(e.message); process.exit(1); });
