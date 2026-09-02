/* Reduz os prints e devolve cada um como data URI, para caberem na pagina
   publicada. A pagina nao pode buscar imagem de fora, entao tudo vai embutido. */
const puppeteer = require('puppeteer-core');
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, 'prints');

(async () => {
  const nav = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox']
  });
  const pag = await nav.newPage();
  await pag.goto('about:blank');

  const arquivos = fs.readdirSync(DIR).filter(f => /^(antes|depois|pdf)-.*\.png$/.test(f)).sort();
  const saida = {};
  let total = 0;

  for (const f of arquivos) {
    const b64 = fs.readFileSync(path.join(DIR, f)).toString('base64');
    const r = await pag.evaluate(async (dados) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + dados;
      await img.decode();
      const escala = Math.min(1, 1280 / img.width);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * escala);
      c.height = Math.round(img.height * escala);
      const x = c.getContext('2d');
      x.imageSmoothingQuality = 'high';
      x.drawImage(img, 0, 0, c.width, c.height);
      // fundo claro por baixo, para o JPEG nao inventar preto em transparencia
      const comFundo = document.createElement('canvas');
      comFundo.width = c.width; comFundo.height = c.height;
      const y = comFundo.getContext('2d');
      y.fillStyle = '#FBF9F5'; y.fillRect(0, 0, c.width, c.height);
      y.drawImage(c, 0, 0);
      return {
        url: comFundo.toDataURL('image/jpeg', 0.85),
        w: c.width, h: c.height
      };
    }, b64);
    saida[f.replace('.png', '')] = r;
    const kb = r.url.length / 1024;
    total += kb;
    console.log('  ' + f.padEnd(30) + ' ' + kb.toFixed(0).padStart(5) + ' KB  ' + r.w + 'x' + r.h);
  }

  fs.writeFileSync(path.join(DIR, 'imagens.json'), JSON.stringify(saida));
  console.log('\ntotal embutido: %.1f MB', total / 1024);
  await nav.close();
})().catch(e => { console.error(e.message); process.exit(1); });
