const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 1000, hasTouch: true }
  });
  const p = await b.newPage();
  const erros = [];
  p.on('pageerror', e => erros.push(e.message));
  p.on('requestfailed', r => erros.push('falhou: ' + r.url()));
  await p.goto('https://romulorod1.github.io/apoio-educacional/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));

  const info = await p.evaluate(() => ({
    mes: document.querySelector('#rotulo-mes').textContent,
    aulas: document.querySelectorAll('.pilula').length,
    valor: document.querySelectorAll('#numeros-mes .valor')[2].textContent,
    horas: document.querySelectorAll('#numeros-mes .valor')[1].textContent
  }));
  console.log('mês:', info.mes, '| aulas:', info.aulas, '| horas:', info.horas, '| valor:', info.valor);

  const alunos = await p.evaluate(() => {
    document.querySelector('[data-tela=alunos]').click();
    return new Promise(r => setTimeout(() => r(document.querySelectorAll('#lista-alunos .item-lista').length), 400));
  });
  console.log('alunos cadastrados:', alunos);

  // service worker: é o que faz abrir sem internet
  const sw = await p.evaluate(() => navigator.serviceWorker.getRegistrations().then(r => r.length));
  console.log('service worker registrado:', sw > 0);

  const manifesto = await p.evaluate(async () => {
    const r = await fetch('manifest.webmanifest');
    const j = await r.json();
    return j.name + ' | ícones: ' + j.icons.length;
  });
  console.log('manifesto:', manifesto);

  // funciona sem rede?
  await p.setOfflineMode(true);
  await p.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  await new Promise(r => setTimeout(r, 2500));
  const offline = await p.evaluate(() => ({
    mes: (document.querySelector('#rotulo-mes') || {}).textContent,
    aulas: document.querySelectorAll('.pilula').length
  }));
  console.log('SEM INTERNET -> mês:', offline.mes, '| aulas:', offline.aulas);
  await p.setOfflineMode(false);

  const reais = erros.filter(e => !/favicon/i.test(e));
  console.log('erros:', reais.length ? reais.join(' ; ') : 'nenhum');
  await b.close();
})();
