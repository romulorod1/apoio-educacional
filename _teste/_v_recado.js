const puppeteer = require('puppeteer-core');
const path = require('path');
(async () => {
  const nav = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox'], defaultViewport: { width: 1000, height: 760 }
  });
  const pag = await nav.newPage();
  await pag.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  const arq = 'file:///' + process.argv[2].split(String.fromCharCode(92)).join('/');
  await pag.goto(arq, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await pag.evaluate(() => document.querySelector('.recado').scrollIntoView({ block: 'center' }));
  await new Promise(r => setTimeout(r, 500));
  await pag.screenshot({ path: path.join(__dirname, 'prints', 'v_recado.png') });
  await nav.close();
  console.log('recado renderizado');
})();
