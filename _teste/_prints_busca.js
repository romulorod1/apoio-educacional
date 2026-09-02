/* _prints_busca.js
 * Prints da busca de assunto, antes e depois.
 *
 * O lado "hoje" não é uma maquete: é o aplicativo real com o índice de busca
 * desligado, que é exatamente o caminho de código que ele usava antes. A
 * mesma tela, a mesma busca, os dois resultados.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const dados = require('./_prints_dados.js');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL_APP = 'http://127.0.0.1:8777/index.html';
const SAIDA = path.join(__dirname, 'prints');
const MES = '2026-09';

const espera = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const nav = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=2'],
    defaultViewport: { width: 1180, height: 900, deviceScaleFactor: 2, hasTouch: true }
  });
  const pag = await nav.newPage();
  pag.on('pageerror', e => console.log('  erro de pagina:', e.message));

  await pag.goto(URL_APP, { waitUntil: 'networkidle0' });
  await espera(1200);

  const banco = dados.montar(MES);
  await pag.evaluate((b) => new Promise((resolve) => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const t = req.result.transaction('dados', 'readwrite');
      t.objectStore('dados').put(b, 'principal');
      t.oncomplete = () => resolve();
    };
  }), banco);
  await pag.reload({ waitUntil: 'networkidle0' });
  await espera(1600);

  await pag.evaluate(async () => {
    let guarda = 0;
    while (document.querySelector('#rotulo-mes').textContent !== 'Setembro de 2026' && guarda++ < 40) {
      const alvo = document.querySelector('#rotulo-mes').textContent;
      document.querySelector(alvo > 'Setembro de 2026' ? '#mes-anterior' : '#mes-seguinte').click();
      await new Promise(r => setTimeout(r, 50));
    }
  });
  await espera(900);

  const aulaMarcelo = banco.aulas.find(a => a.data.slice(0, 7) === MES);

  async function abrirBusca() {
    await pag.evaluate((dia) => {
      document.querySelector('[data-dia="' + dia + '"]').querySelector('.pilula').click();
    }, aulaMarcelo.data);
    await espera(600);
    await pag.evaluate(() => {
      Array.from(document.querySelectorAll('#linha-folha button'))
        .find(x => x.textContent.trim() === 'Material de aula').click();
    });
    await espera(2400);
  }
  async function fechar() {
    await pag.evaluate(() => {
      const t = document.querySelector('#modal-tema .fechar'); if (t) t.click();
    });
    await espera(300);
    await pag.evaluate(() => {
      const a = document.querySelector('#modal-aula .fechar'); if (a) a.click();
    });
    await espera(400);
  }
  async function digitar(v) {
    await pag.evaluate((x) => {
      const e = document.querySelector('#corpo-modal-tema input[type=text]');
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      set.call(e, x);
      e.dispatchEvent(new Event('input', { bubbles: true }));
    }, v);
    await espera(700);
  }
  async function tirar(nome) {
    const alvo = await pag.$('#modal-tema .modal');
    if (!alvo) { console.log('  FALTOU:', nome); return; }
    const arq = path.join(SAIDA, nome + '.png');
    await alvo.screenshot({ path: arq });
    const kb = fs.statSync(arq).size / 1024;
    console.log('  ' + nome + '.png  ' + kb.toFixed(0) + ' KB');
  }

  // ---------------- hoje: com o indice de busca desligado ----------------
  await pag.evaluate(() => { window.__semIndice = true; });
  await pag.evaluate(() => {
    // o caminho de codigo antigo: sem indice, a busca compara pedaco de texto
    window.Busca = undefined;
  });
  await abrirBusca();
  await digitar('equação do primeiro grau');
  await tirar('antes-busca-vazia');
  await fechar();

  // ---------------- depois: aplicativo inteiro ----------------
  await pag.reload({ waitUntil: 'networkidle0' });
  await espera(1800);
  await pag.evaluate(async () => {
    let guarda = 0;
    while (document.querySelector('#rotulo-mes').textContent !== 'Setembro de 2026' && guarda++ < 40) {
      const alvo = document.querySelector('#rotulo-mes').textContent;
      document.querySelector(alvo > 'Setembro de 2026' ? '#mes-anterior' : '#mes-seguinte').click();
      await new Promise(r => setTimeout(r, 50));
    }
  });
  await espera(900);

  await abrirBusca();
  await digitar('equação do primeiro grau');
  await tirar('depois-busca-acha');
  await digitar('bhaskara');
  await tirar('depois-busca-bhaskara');
  await digitar('pitagoras');
  await tirar('depois-busca-vizinhos');
  await digitar('fração 7 ano');
  await tirar('depois-busca-ano');
  await fechar();

  await nav.close();
  console.log('\nprints da busca prontos.');
})().catch(e => {
  console.error('parou:', e.message);
  console.error(e.stack);
  process.exit(1);
});
