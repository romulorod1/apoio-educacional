const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox'],
    defaultViewport: { width: 1400, height: 1050, hasTouch: true }
  });
  const p = await b.newPage();
  await p.goto('http://127.0.0.1:8777/index.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1600));

  await p.screenshot({ path: 'v_agenda.png' });

  // novembro, para ver os feriados
  await p.evaluate(async () => {
    for (let i = 0; i < 5; i++) { document.querySelector('#mes-seguinte').click(); await new Promise(r => setTimeout(r, 60)); }
  });
  await new Promise(r => setTimeout(r, 700));
  await p.screenshot({ path: 'v_feriados.png' });

  await p.evaluate(() => document.querySelector('[data-tela=alunos]').click());
  await new Promise(r => setTimeout(r, 500));
  await p.screenshot({ path: 'v_alunos.png' });

  await p.evaluate(() => document.querySelector('[data-tela=fechamento]').click());
  await new Promise(r => setTimeout(r, 500));
  await p.evaluate(() => { document.querySelector('#mes-fechamento').value = '2026-06'; document.querySelector('#mes-fechamento').dispatchEvent(new Event('change')); });
  await new Promise(r => setTimeout(r, 700));
  await p.screenshot({ path: 'v_fechamento.png' });

  // editor de folha
  await p.evaluate(() => document.querySelector('[data-tela=agenda]').click());
  await new Promise(r => setTimeout(r, 300));
  await p.evaluate(async () => {
    let g = 0;
    while (document.querySelector('#rotulo-mes').textContent !== 'Junho de 2026' && g++ < 40) {
      document.querySelector('#mes-anterior').click(); await new Promise(r => setTimeout(r, 50));
    }
  });
  await new Promise(r => setTimeout(r, 600));
  await p.evaluate(() => document.querySelector('[data-dia="2026-06-10"] .pilula').click());
  await new Promise(r => setTimeout(r, 600));
  await p.screenshot({ path: 'v_modal_aula.png' });
  await p.evaluate(() => Array.from(document.querySelectorAll('#corpo-modal-aula button'))
    .find(b => b.textContent.includes('à mão')).click());
  await new Promise(r => setTimeout(r, 1200));
  // rabisca algo
  await p.evaluate(() => {
    const c = document.querySelector('#tela-desenho');
    const r = c.getBoundingClientRect();
    const ev = (t, x, y, pr) => c.dispatchEvent(new PointerEvent(t, {
      pointerId: 1, pointerType: 'pen', pressure: pr, isPrimary: true, bubbles: true,
      clientX: r.left + x, clientY: r.top + y }));
    for (const [ox, oy] of [[120, 150], [120, 260]]) {
      ev('pointerdown', ox, oy, 0.3);
      for (let i = 1; i <= 40; i++) ev('pointermove', ox + i * 8, oy + Math.sin(i / 4) * 22, 0.25 + (i % 6) * 0.11);
      ev('pointerup', ox + 320, oy, 0.3);
    }
  });
  await new Promise(r => setTimeout(r, 700));
  await p.screenshot({ path: 'v_folha.png' });
  await b.close();
  console.log('telas capturadas');
})();
