const puppeteer = require('puppeteer-core');
const path = require('path');
(async () => {
  const nav = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox'],
    defaultViewport: { width: 1100, height: 1000 }
  });
  const pag = await nav.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  const arq = 'file:///' + process.argv[2].split(String.fromCharCode(92)).join('/');
  await pag.goto(arq, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));

  /* Rola a pagina inteira antes de conferir: com carregamento preguicoso, a
     imagem que ainda nao apareceu na tela conta como nao carregada, e isso e
     comportamento certo, nao defeito. */
  await pag.evaluate(async () => {
    const passo = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += passo) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 1200));

  const r = await pag.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return {
      imagens: imgs.length,
      quebradas: imgs.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.alt),
      semAlt: imgs.filter(i => !i.alt).length,
      pares: document.querySelectorAll('.par').length,
      ideias: document.querySelectorAll('.ideia').length,
      rolagemH: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      altura: document.body.scrollHeight
    };
  });
  console.log(JSON.stringify(r, null, 1));
  console.log('erros de pagina:', erros.length ? erros : 'nenhum');

  await pag.screenshot({ path: path.join(__dirname, 'prints', 'v_pagina_topo.png') });
  await pag.evaluate(() => window.scrollTo(0, 2400));
  await new Promise(r => setTimeout(r, 500));
  await pag.screenshot({ path: path.join(__dirname, 'prints', 'v_pagina_par.png') });

  // tema escuro
  await pag.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await pag.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 400));
  await pag.screenshot({ path: path.join(__dirname, 'prints', 'v_pagina_escuro.png') });

  // largura de celular
  await pag.setViewport({ width: 400, height: 900 });
  await pag.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  await new Promise(r => setTimeout(r, 500));
  const estreito = await pag.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  console.log('rola de lado no celular?', estreito);
  await nav.close();
})().catch(e => { console.error(e.message); process.exit(1); });
