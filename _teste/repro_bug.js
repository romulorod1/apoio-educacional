/* Reproduz o relato: abrir a folha, escolher T, fechar, abrir de novo e
   tentar escrever com a caneta. */
const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 1000, hasTouch: true }
  });
  const p = await b.newPage();
  let prompts = 0;
  p.on('dialog', async d => { prompts++; console.log('  >>> JANELA ABRIU:', d.message()); await d.dismiss(); });
  await p.goto('http://127.0.0.1:8777/index.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  const esp = ms => new Promise(r => setTimeout(r, ms));

  async function abrirFolha() {
    await p.evaluate(() => document.querySelector('[data-dia="2026-06-10"] .pilula').click());
    await esp(400);
    await p.evaluate(() => Array.from(document.querySelectorAll('#corpo-modal-aula button'))
      .find(b => /à mão|Abrir folha/.test(b.textContent)).click());
    await esp(1000);
  }
  async function ferramenta(titulo) {
    await p.evaluate(t => document.querySelector('#ferramentas-nota button[title="' + t + '"]').click(), titulo);
    await esp(250);
  }
  async function riscar() {
    await p.evaluate(() => {
      const c = document.querySelector('#tela-desenho');
      const r = c.getBoundingClientRect();
      const cx = r.width / 2, cy = r.height / 2;
      const ev = (t, x, y) => c.dispatchEvent(new PointerEvent(t, {
        pointerId: 7, pointerType: 'pen', pressure: 0.5, isPrimary: true, bubbles: true,
        clientX: r.left + x, clientY: r.top + y }));
      ev('pointerdown', cx, cy);
      for (let i = 1; i < 12; i++) ev('pointermove', cx + i * 6, cy + i * 2);
      ev('pointerup', cx + 70, cy + 24);
    });
    await esp(400);
  }
  const tracos = () => p.evaluate(() =>
    document.querySelector('#tela-desenho') && window.__editorAtivo ? 0 : 0);

  console.log('\n1) abre a folha e risca com a caneta');
  await abrirFolha();
  await riscar();
  let n = await p.evaluate(() => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => { const t = q.result.transaction('notas','readonly').objectStore('notas').getAll();
      t.onsuccess = () => r((t.result[0]?.paginas[0]?.itens || []).length); };
  }));
  console.log('   itens na folha:', n, '| janelas abertas:', prompts);

  console.log('\n2) troca para T, cancela, e fecha a folha');
  await ferramenta('Texto digitado');
  await riscar();                      // dispara o prompt, que é cancelado
  await p.evaluate(() => Array.from(document.querySelectorAll('#rodape-nota button'))
    .find(b => b.textContent.includes('Concluir')).click());
  await esp(900);

  console.log('\n3) abre a folha DE NOVO e tenta riscar com a caneta');
  const antesDoTeste = prompts;
  await abrirFolha();
  const ferrAtiva = await p.evaluate(() => {
    const b = document.querySelector('#ferramentas-nota button.ativa');
    return b ? b.getAttribute('title') : 'nenhuma';
  });
  console.log('   ferramenta marcada na barra:', ferrAtiva);
  await riscar();
  console.log('   janelas abertas nesta etapa:', prompts - antesDoTeste);

  const n2 = await p.evaluate(() => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => { const t = q.result.transaction('notas','readonly').objectStore('notas').getAll();
      t.onsuccess = () => r((t.result[0]?.paginas[0]?.itens || []).length); };
  }));
  console.log('   itens na folha depois:', n2);

  console.log('\nRESULTADO:');
  if (prompts - antesDoTeste > 0) console.log('  BUG REPRODUZIDO: a caneta está ativa mas a janela de texto aparece.');
  else if (n2 <= n) console.log('  BUG REPRODUZIDO: a caneta não riscou nada.');
  else console.log('  sem bug: a caneta funcionou normalmente.');
  await b.close();
})();
