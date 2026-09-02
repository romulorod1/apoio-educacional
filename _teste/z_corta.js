const puppeteer = require('puppeteer-core');
const fs = require('fs'), path = require('path');
const [,, origem, saida, xp, yp, wp, hp] = process.argv;
(async () => {
  const nav = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox'] });
  const pag = await nav.newPage();
  await pag.goto('about:blank');
  const b64 = fs.readFileSync(origem).toString('base64');
  const url = await pag.evaluate(async (d, x, y, w, h) => {
    const img = new Image(); img.src = 'data:image/jpeg;base64,' + d; await img.decode();
    const cx = Math.round(img.width * x), cy = Math.round(img.height * y);
    const cw = Math.round(img.width * w), ch = Math.round(img.height * h);
    const c = document.createElement('canvas');
    const escala = 3;
    c.width = cw * escala; c.height = ch * escala;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(img, cx, cy, cw, ch, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  }, b64, +xp, +yp, +wp, +hp);
  fs.writeFileSync(saida, Buffer.from(url.split(',')[1], 'base64'));
  console.log(saida);
  await nav.close();
})().catch(e => { console.error(e.message); process.exit(1); });
