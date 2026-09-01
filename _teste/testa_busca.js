/* testa_busca.js
 * A busca de assunto, no navegador: acento, e o registro do que não foi achado.
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const dados = require('./_prints_dados.js');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL_APP = 'http://127.0.0.1:8777/index.html';
const espera = ms => new Promise(r => setTimeout(r, ms));

let falhas = 0, passes = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

(async () => {
  const nav = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1280, height: 1000, hasTouch: true }
  });
  const pag = await nav.newPage();
  const errosDePagina = [];
  pag.on('pageerror', e => errosDePagina.push(e.message));
  pag.on('console', m => { if (m.type() === 'error') errosDePagina.push('console: ' + m.text()); });
  pag.on('dialog', async d => { try { await d.accept(); } catch (e) { /* ok */ } });

  await pag.goto(URL_APP, { waitUntil: 'networkidle0' });
  await espera(1300);

  const banco = dados.montar('2026-09');
  await pag.evaluate((b) => new Promise((res) => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const t = req.result.transaction('dados', 'readwrite');
      t.objectStore('dados').put(b, 'principal');
      t.oncomplete = () => res();
    };
  }), banco);
  await pag.evaluate(() => { try { localStorage.removeItem('buscas-vazias'); } catch (e) { /* ok */ } });
  await pag.reload({ waitUntil: 'networkidle0' });
  await espera(1600);

  async function digitar(valor) {
    await pag.evaluate((v) => {
      const e = document.querySelector('#corpo-modal-tema input[type=text]');
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      set.call(e, v);
      e.dispatchEvent(new Event('input', { bubbles: true }));
    }, valor);
    await espera(420);
  }
  const quantos = () => pag.$$eval('#lista-temas .item-tema', es => es.length);

  // abre o seletor de temas a partir de uma aula
  await pag.evaluate(async () => {
    let g = 0;
    while (document.querySelector('#rotulo-mes').textContent !== 'Setembro de 2026' && g++ < 40) {
      const alvo = document.querySelector('#rotulo-mes').textContent;
      document.querySelector(alvo > 'Setembro de 2026' ? '#mes-anterior' : '#mes-seguinte').click();
      await new Promise(r => setTimeout(r, 45));
    }
  });
  await espera(700);
  await pag.evaluate(() => {
    document.querySelector('[data-dia="2026-09-02"]').querySelector('.pilula').click();
  });
  await espera(600);
  await pag.evaluate(() => {
    Array.from(document.querySelectorAll('#linha-folha button'))
      .find(b => b.textContent.trim() === 'Material de aula').click();
  });
  await espera(2200);

  // ================================================================
  secao('1. O acento deixou de atrapalhar');

  const pares = [['divisão', 'divisao'], ['ângulo', 'angulo'], ['área', 'area']];
  for (const [com, sem] of pares) {
    await digitar(com);
    const a = await quantos();
    await digitar(sem);
    const b = await quantos();
    conf('"' + sem + '" acha o mesmo que "' + com + '"', b, a);
    conf('e acha alguma coisa', a > 0, true);
  }

  await digitar('ANGULO');
  conf('maiúscula também não atrapalha', await quantos() > 0, true);

  // ================================================================
  secao('2. O que ela procura e não acha fica registrado');

  await digitar('trigonometria hiperbolica');
  await espera(1600);
  conf('a lista fica vazia', await quantos(), 0);

  let registro = await pag.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('buscas-vazias') || '[]'); } catch (e) { return null; }
  });
  conf('a busca vazia foi anotada', registro.length, 1);
  conf('com o termo inteiro', registro[0].termo, 'trigonometria hiperbolica');
  conf('e com a data', /^\d{4}-\d{2}-\d{2}$/.test(registro[0].quando), true);

  // o prefixo de uma palavra não pode virar entrada
  await digitar('logaritmo neperiano');
  await espera(1600);
  registro = await pag.evaluate(() => JSON.parse(localStorage.getItem('buscas-vazias') || '[]'));
  conf('cada busca vira uma entrada só, e não uma por tecla', registro.length, 2);

  await digitar('xy');
  await espera(1600);
  registro = await pag.evaluate(() => JSON.parse(localStorage.getItem('buscas-vazias') || '[]'));
  conf('termo curto demais não é anotado', registro.length, 2);

  await digitar('divisao');
  await espera(1600);
  registro = await pag.evaluate(() => JSON.parse(localStorage.getItem('buscas-vazias') || '[]'));
  conf('busca que achou não é anotada', registro.length, 2);

  // ================================================================
  secao('3. A lista aparece em Ajustes');

  await pag.evaluate(() => document.querySelector('#modal-tema .fechar').click());
  await espera(300);
  await pag.evaluate(() => document.querySelector('#modal-aula .fechar').click());
  await espera(300);
  await pag.evaluate(() => {
    Array.from(document.querySelectorAll('#abas .aba')).find(b => b.dataset.tela === 'ajustes').click();
  });
  await espera(700);

  const texto = await pag.$eval('#buscas-vazias', e => e.textContent);
  conf('mostra o que não foi achado', /trigonometria hiperbolica/.test(texto), true);
  conf('e o segundo termo também', /logaritmo neperiano/.test(texto), true);
  conf('diz que fica só no tablet', /só neste tablet/.test(texto), true);

  await pag.evaluate(() => {
    Array.from(document.querySelectorAll('#buscas-vazias button'))
      .find(b => /Limpar/.test(b.textContent)).click();
  });
  await espera(600);
  conf('dá para limpar',
    await pag.evaluate(() => (localStorage.getItem('buscas-vazias') || '[]') === '[]' ||
      localStorage.getItem('buscas-vazias') === null), true);
  conf('e a tela avisa que está vazia',
    await pag.$eval('#buscas-vazias', e => /Nenhuma busca sem resultado/.test(e.textContent)), true);

  // ================================================================
  secao('4. Erros de página');
  const reais = errosDePagina.filter(e => !/favicon|manifest|sw\.js|ServiceWorker/i.test(e));
  reais.forEach(e => console.log('  ERRO: ' + e));
  conf('nenhum erro de JavaScript', reais.length, 0);

  await nav.close();
  console.log('\n' + '='.repeat(60));
  console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
  if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
  console.log('='.repeat(60));
  process.exit(falhas ? 1 : 0);
})().catch(e => {
  console.error('\nO teste parou com erro:', e.message);
  console.error(e.stack);
  process.exit(1);
});
