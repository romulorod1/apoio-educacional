/* _prints_antes.js
 * Prints do aplicativo REAL, com o banco abastecido.
 * Estas imagens são o aplicativo como ele está hoje, sem nenhuma alteração.
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
  if (!fs.existsSync(SAIDA)) fs.mkdirSync(SAIDA, { recursive: true });

  const nav = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=2'],
    defaultViewport: { width: 1180, height: 900, deviceScaleFactor: 2, hasTouch: true }
  });
  const pag = await nav.newPage();
  pag.on('pageerror', e => console.log('  erro de pagina:', e.message));

  await pag.goto(URL_APP, { waitUntil: 'networkidle0' });
  await espera(1200);

  // injeta o banco abastecido
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

  // vai para setembro de 2026
  await pag.evaluate(async () => {
    let guarda = 0;
    while (document.querySelector('#rotulo-mes').textContent !== 'Setembro de 2026' && guarda++ < 40) {
      const alvo = document.querySelector('#rotulo-mes').textContent;
      const ir = alvo > 'Setembro de 2026' ? '#mes-anterior' : '#mes-seguinte';
      document.querySelector(ir).click();
      await new Promise(r => setTimeout(r, 50));
    }
  });
  await espera(900);

  async function tirar(nome, seletor, opcoes) {
    opcoes = opcoes || {};
    const alvo = seletor ? await pag.$(seletor) : pag;
    if (!alvo) { console.log('  FALTOU:', nome, seletor); return; }
    await alvo.screenshot({
      path: path.join(SAIDA, nome + '.png'),
      captureBeyondViewport: false
    });
    const kb = fs.statSync(path.join(SAIDA, nome + '.png')).size / 1024;
    console.log('  %-34s %6.0f KB', nome, kb);
  }

  async function aba(nome) {
    await pag.evaluate(n => {
      Array.from(document.querySelectorAll('#abas .aba')).find(b => b.dataset.tela === n).click();
    }, nome);
    await espera(500);
  }

  console.log('\nPrints do aplicativo como ele esta hoje:\n');

  // ---------- agenda ----------
  await tirar('antes-agenda', '#tela-agenda');

  // ---------- agenda com o olhinho ligado ----------
  await pag.evaluate(() => document.querySelector('#alternar-valores').click());
  await espera(600);
  await tirar('antes-olhinho', '#tela-agenda');
  await pag.evaluate(() => document.querySelector('#alternar-valores').click());
  await espera(500);

  // ---------- modal da aula ----------
  const idMarcelo = banco.alunos.filter(a => a.nome === 'Marcelo')[0].id;
  const aulaMarcelo = banco.aulas
    .filter(a => a.alunoId === idMarcelo && a.notaTexto)
    .sort((a, b) => a.data.localeCompare(b.data))[2];
  await pag.evaluate((dia) => {
    const cel = document.querySelector('[data-dia="' + dia + '"]');
    cel.querySelector('.pilula').click();
  }, aulaMarcelo.data);
  await espera(700);
  await pag.evaluate(() => { document.querySelector('#corpo-modal-aula').scrollTop = 0; });
  await tirar('antes-aula-topo', '#modal-aula .modal');
  await pag.evaluate(() => {
    const c = document.querySelector('#corpo-modal-aula');
    c.scrollTop = c.scrollHeight;
  });
  await espera(400);
  await tirar('antes-aula-fim', '#modal-aula .modal');

  // areas trabalhadas abertas
  await pag.evaluate(() => {
    const b = document.querySelector('#abrir-areas');
    if (b && b.textContent.trim() === 'Mostrar') b.click();
    const alvo = document.querySelector('#caixa-areas');
    if (alvo) alvo.scrollIntoView({ block: 'center' });
  });
  await espera(600);
  await tirar('antes-areas', '#modal-aula .modal');
  await pag.evaluate(() => document.querySelector('#modal-aula .fechar').click());
  await espera(400);

  // ---------- lista de alunos ----------
  await aba('alunos');
  await tirar('antes-alunos', '#tela-alunos');

  // ---------- ficha do aluno, aba mapeamento ----------
  await pag.evaluate(() => {
    const linha = Array.from(document.querySelectorAll('#lista-alunos .item-lista'))
      .find(e => /Marcelo/.test(e.textContent));
    linha.click();
  });
  await espera(700);
  await pag.evaluate(() => {
    Array.from(document.querySelectorAll('.aba-perfil')).find(x => x.textContent.trim() === 'Mapeamento').click();
  });
  await espera(500);
  await tirar('antes-mapeamento', '#modal-aluno .modal');
  await pag.evaluate(() => {
    Array.from(document.querySelectorAll('.aba-perfil')).find(x => x.textContent.trim() === 'Valores').click();
  });
  await espera(500);
  await tirar('antes-valores', '#modal-aluno .modal');
  await pag.evaluate(() => document.querySelector('#modal-aluno .fechar').click());
  await espera(400);

  // ---------- seletor de temas, busca por texto ----------
  await aba('agenda');
  await espera(400);
  await pag.evaluate((dia) => {
    document.querySelector('[data-dia="' + dia + '"]').querySelector('.pilula').click();
  }, aulaMarcelo.data);
  await espera(600);
  await pag.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#linha-folha button'))
      .find(x => x.textContent.trim() === 'Material de aula');
    b.click();
  });
  await espera(2200);
  await pag.evaluate(() => {
    const e = document.querySelector('#corpo-modal-tema input[type=text]');
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    set.call(e, 'fração');
    e.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await espera(800);
  await tirar('antes-temas-busca', '#modal-tema .modal');
  await pag.evaluate(() => document.querySelector('#modal-tema .fechar').click());
  await espera(300);
  await pag.evaluate(() => document.querySelector('#modal-aula .fechar').click());
  await espera(300);

  // ---------- fechamento ----------
  await aba('fechamento');
  await espera(900);
  await tirar('antes-fechamento', '#tela-fechamento');

  // ---------- ajustes ----------
  await aba('ajustes');
  await espera(700);
  await tirar('antes-ajustes', '#tela-ajustes');

  await nav.close();
  console.log('\nprontos em', SAIDA);
})().catch(e => { console.error('parou:', e.message); console.error(e.stack); process.exit(1); });
