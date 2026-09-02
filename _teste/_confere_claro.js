const puppeteer = require('puppeteer-core');
const path = require('path');
(async () => {
  const nav = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox'], defaultViewport: { width: 1100, height: 1000 }
  });
  const pag = await nav.newPage();
  await pag.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  const arq = 'file:///' + process.argv[2].split(String.fromCharCode(92)).join('/');
  await pag.goto(arq, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  const cores = await pag.evaluate(() => {
    const c = getComputedStyle(document.body);
    return { fundo: c.backgroundColor, texto: c.color,
      titulo: getComputedStyle(document.querySelector('h1')).color };
  });
  console.log('tema claro:', JSON.stringify(cores));
  await pag.evaluate(() => window.scrollTo(0, 3400));
  await new Promise(r => setTimeout(r, 400));
  await pag.screenshot({ path: path.join(__dirname, 'prints', 'v_pagina_claro.png') });
  await nav.close();
})().catch(e => { console.error(e.message); process.exit(1); });
