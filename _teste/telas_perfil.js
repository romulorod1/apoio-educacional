const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox'], defaultViewport: { width: 1400, height: 1050 }
  });
  const p = await b.newPage();
  p.on('dialog', async d => { try { await d.accept(); } catch (e) {} });
  await p.goto('http://127.0.0.1:8777/index.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2200));
  await p.screenshot({ path: 'v_novidades.png' });
  await p.evaluate(() => document.querySelector('#entendi-novidades').click());
  await new Promise(r => setTimeout(r, 600));

  await p.evaluate(() => new Promise(res => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => {
      const banco = q.result;
      const t = banco.transaction('dados','readonly').objectStore('dados').get('principal');
      t.onsuccess = () => {
        const db = t.result;
        const m = db.alunos.find(a => a.nome === 'Marcelo');
        m.desde = '2026-03-02';
        m.obsPedagogicas = 'Trava em enunciado longo. Vai bem quando le em voz alta.';
        const aulas = db.aulas.filter(a => a.data.startsWith('2026-06')).sort((x,y)=>y.data.localeCompare(x.data));
        aulas[0].temNota = true;
        aulas[1].anexos = [{ id:'x', nome:'lista.pdf', tamanho: 1000 }];
        aulas[1].notaTexto = 'Revisamos fracoes equivalentes e ele pegou rapido.';
        aulas[3].notaTexto = 'Interpretacao de texto, respostas discursivas.';
        const w = banco.transaction('dados','readwrite').objectStore('dados').put(db,'principal');
        w.onsuccess = () => res();
      };
    };
  }));
  await p.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1800));

  await p.evaluate(() => Array.from(document.querySelectorAll('#abas .aba')).find(x => x.dataset.tela === 'alunos').click());
  await new Promise(r => setTimeout(r, 400));
  await p.evaluate(() => {
    const i = Array.from(document.querySelectorAll('#lista-alunos .item-lista')).find(x => x.textContent.includes('Marcelo'));
    i.querySelector('button').click();
  });
  await new Promise(r => setTimeout(r, 600));
  await p.screenshot({ path: 'v_perfil_dados.png' });
  await p.evaluate(() => Array.from(document.querySelectorAll('.aba-perfil')).find(x => x.textContent.trim() === 'Historico' || x.textContent.trim() === 'Histórico').click());
  await new Promise(r => setTimeout(r, 500));
  await p.screenshot({ path: 'v_perfil_historico.png' });

  await p.evaluate(() => document.querySelectorAll('.fundo-modal').forEach(m => m.classList.remove('aberto')));
  await p.evaluate(() => Array.from(document.querySelectorAll('#abas .aba')).find(x => x.dataset.tela === 'agenda').click());
  await new Promise(r => setTimeout(r, 400));
  await p.evaluate(() => document.querySelector('#alternar-valores').click());
  await new Promise(r => setTimeout(r, 700));
  await p.screenshot({ path: 'v_valores_ocultos.png' });
  await b.close();
  console.log('telas capturadas');
})();
