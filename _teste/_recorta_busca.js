/* _recorta_busca.js
 * Tira a faixa vazia entre o último resultado e o rodapé da janela.
 *
 * A janela de material tem altura fixa, então uma busca com dois resultados
 * deixa meia tela em branco. Na página isso vira um buraco. Aqui a faixa
 * vazia é encurtada, e o rodapé continua no lugar: a imagem segue sendo a
 * janela inteira, só sem o vão.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, 'prints');
const ALVOS = /^(antes|depois)-busca-.*\.png$/;

(async () => {
  const nav = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox']
  });
  const pag = await nav.newPage();
  await pag.goto('about:blank');

  for (const f of fs.readdirSync(DIR).filter(x => ALVOS.test(x)).sort()) {
    const b64 = fs.readFileSync(path.join(DIR, f)).toString('base64');
    const r = await pag.evaluate(async (dados) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + dados;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0);
      const px = x.getImageData(0, 0, c.width, c.height).data;

      // uma linha é vazia quando tudo nela é quase branco
      const vazia = (y) => {
        for (let i = 8; i < c.width - 8; i += 3) {
          const p = (y * c.width + i) * 4;
          if (px[p] < 248 || px[p + 1] < 248 || px[p + 2] < 248) return false;
        }
        return true;
      };

      // maior corrida de linhas vazias
      let melhorIni = -1, melhorTam = 0, ini = -1;
      for (let y = 0; y < c.height; y++) {
        if (vazia(y)) { if (ini < 0) ini = y; }
        else {
          if (ini >= 0 && y - ini > melhorTam) { melhorTam = y - ini; melhorIni = ini; }
          ini = -1;
        }
      }
      if (ini >= 0 && c.height - ini > melhorTam) { melhorTam = c.height - ini; melhorIni = ini; }

      const FOLGA = 40;
      if (melhorTam < 120) {
        return { url: c.toDataURL('image/png'), w: c.width, h: c.height, cortou: 0 };
      }
      const corte = melhorTam - FOLGA;
      const alta = c.height - corte;
      const d = document.createElement('canvas');
      d.width = c.width; d.height = alta;
      const y2 = d.getContext('2d');
      y2.fillStyle = '#ffffff'; y2.fillRect(0, 0, d.width, d.height);
      // parte de cima, até o começo do vão, mais a folga
      y2.drawImage(c, 0, 0, c.width, melhorIni + FOLGA, 0, 0, c.width, melhorIni + FOLGA);
      // e o rodapé, colado logo abaixo
      const restoIni = melhorIni + melhorTam;
      y2.drawImage(c, 0, restoIni, c.width, c.height - restoIni,
                      0, melhorIni + FOLGA, c.width, c.height - restoIni);
      return { url: d.toDataURL('image/png'), w: d.width, h: alta, cortou: corte };
    }, b64);

    fs.writeFileSync(path.join(DIR, f), Buffer.from(r.url.split(',')[1], 'base64'));
    console.log('  ' + f.padEnd(30) + ' ' + r.w + 'x' + r.h + '  (tirou ' + r.cortou + ' px de vão)');
  }
  await nav.close();
})().catch(e => { console.error(e.message); process.exit(1); });
