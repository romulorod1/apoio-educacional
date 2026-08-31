/* Janela de perfil do aluno com histórico, campos novos, e a janela de novidades. */
const puppeteer = require('puppeteer-core');
let f = 0, p = 0;
function conf(r, o, e) {
  const ok = String(o) === String(e);
  if (ok) p++; else f++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + r + (ok ? '' : '  [' + o + ' != ' + e + ']'));
}
const esp = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox'], defaultViewport: { width: 1280, height: 1000 }
  });
  const pag = await b.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  pag.on('dialog', async d => { try { await d.accept(); } catch (e) { } });
  await pag.goto('http://127.0.0.1:8777/index.html', { waitUntil: 'networkidle0' });
  await esp(2200);

  const bd = () => pag.evaluate(() => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => {
      const t = q.result.transaction('dados', 'readonly').objectStore('dados').get('principal');
      t.onsuccess = () => r(t.result);
    };
  }));
  const visivel = s => pag.$eval(s, e => getComputedStyle(e).display !== 'none').catch(() => false);

  async function abrirAluno(nome) {
    await pag.evaluate(() => {
      Array.from(document.querySelectorAll('#abas .aba')).find(x => x.dataset.tela === 'alunos').click();
    });
    await esp(400);
    await pag.evaluate(n => {
      const item = Array.from(document.querySelectorAll('#lista-alunos .item-lista'))
        .find(i => i.textContent.includes(n));
      item.querySelector('button').click();
    }, nome);
    await esp(500);
  }
  async function aba(nome) {
    await pag.evaluate(n => {
      Array.from(document.querySelectorAll('.aba-perfil')).find(x => x.textContent.trim() === n).click();
    }, nome);
    await esp(350);
  }

  console.log('\n=== a janela de novidades aparece ===');
  conf('a janela abriu sozinha', await visivel('#modal-novidades'), true);
  const nov = await pag.$eval('#corpo-modal-novidades', e => e.textContent);
  conf('diz a versão nova', nov.includes('1.5.0'), true);
  conf('tranquiliza sobre os dados', nov.includes('Nada do que você já tinha foi alterado'), true);
  conf('conta do histórico do aluno', nov.includes('Histórico'), true);
  await pag.$eval('#entendi-novidades', e => e.click());
  await esp(600);
  conf('fecha ao confirmar', await visivel('#modal-novidades'), false);
  let banco = await bd();
  conf('guarda que ela já viu', banco.ajustes.versaoVista, '1.5.0');

  await pag.reload({ waitUntil: 'networkidle0' });
  await esp(2200);
  conf('não aparece de novo na próxima abertura', await visivel('#modal-novidades'), false);

  console.log('\n=== a ficha do aluno tem abas ===');
  await abrirAluno('Marcelo');
  const nomesAbas = await pag.$$eval('.aba-perfil', es => es.map(e => e.textContent.trim()));
  conf('três abas', nomesAbas.join(','), 'Dados,Valores,Histórico');
  conf('abre na aba de dados', await pag.$eval('.aba-perfil.ativa', e => e.textContent.trim()), 'Dados');

  console.log('\n=== campos novos ===');
  conf('tem o campo de data de início', await pag.$$eval('#campo-desde', e => e.length), 1);
  conf('tem observações pedagógicas', await pag.$$eval('#campo-obs-pedagogicas', e => e.length), 1);
  conf('tem observações gerais', await pag.$$eval('#campo-obs', e => e.length), 1);

  await pag.$eval('#campo-desde', e => {
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    set.call(e, '2026-03-02');
    e.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await pag.$eval('#campo-obs-pedagogicas', e => {
    const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    set.call(e, 'Trava em enunciado longo. Vai bem quando lê em voz alta.');
    e.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await pag.$eval('#salvar-aluno', e => e.click());
  await esp(700);
  banco = await bd();
  const marcelo = banco.alunos.find(a => a.nome === 'Marcelo');
  conf('a data de início foi gravada', marcelo.desde, '2026-03-02');
  conf('as observações pedagógicas foram gravadas', marcelo.obsPedagogicas.includes('voz alta'), true);
  conf('as observações gerais continuam separadas', marcelo.obs.includes('Julho de 2026'), true);

  console.log('\n=== o histórico do aluno ===');
  // marca uma aula com folha, outra com anexo e outra com anotação, para conferir
  // que o histórico mostra cada sinal
  await pag.evaluate(() => new Promise(resolve => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => {
      const banco = q.result;
      const t = banco.transaction('dados', 'readonly').objectStore('dados').get('principal');
      t.onsuccess = () => {
        const db = t.result;
        const doMarcelo = db.aulas
          .filter(a => a.data.startsWith('2026-06'))
          .sort((x, y) => y.data.localeCompare(x.data));
        doMarcelo[0].temNota = true;
        doMarcelo[1].anexos = [{ id: 'x', nome: 'lista.pdf', tamanho: 1000 }];
        doMarcelo[2].notaTexto = 'Revisamos frações equivalentes e ele pegou rápido.';
        const w = banco.transaction('dados', 'readwrite').objectStore('dados').put(db, 'principal');
        w.onsuccess = () => resolve();
      };
    };
  }));
  await pag.reload({ waitUntil: 'networkidle0' });
  await esp(1800);
  await abrirAluno('Marcelo');
  await aba('Histórico');
  const hist = await pag.$eval('#corpo-modal-aluno', e => e.textContent);
  conf('mostra quantos encontros', hist.includes('Encontros'), true);
  conf('mostra as horas somadas', hist.includes('10:30 h'), true);
  conf('mostra desde quando', hist.includes('02/03/2026'), true);
  const linhas = await pag.$$eval('.linha-historico', es => es.length);
  conf('lista as aulas', linhas > 0, true);
  conf('mostra no máximo oito de início', linhas <= 8, true);
  const datas = await pag.$$eval('.linha-historico .nome', es => es.map(e => e.textContent.trim()));
  conf('a mais recente vem primeiro', datas[0].startsWith('26/06'), true);
  conf('marca a aula que tem folha', hist.includes('folha'), true);
  conf('marca a aula que tem anexo', hist.includes('anexo'), true);
  conf('mostra a anotação da aula', hist.includes('pegou rápido'), true);

  const temMais = await pag.evaluate(() => Array.from(document.querySelectorAll('#corpo-modal-aluno button'))
    .some(x => x.textContent.includes('Ver mais')));
  conf('oferece ver mais', temMais, true);
  await pag.evaluate(() => Array.from(document.querySelectorAll('#corpo-modal-aluno button'))
    .find(x => x.textContent.includes('Ver mais')).click());
  await esp(400);
  const linhas2 = await pag.$$eval('.linha-historico', es => es.length);
  conf('ver mais amplia a lista', linhas2 > linhas, true);

  console.log('\n=== abrir uma aula direto do histórico ===');
  await pag.evaluate(() => {
    document.querySelector('.linha-historico').querySelector('button').click();
  });
  await esp(900);
  conf('a ficha do aluno fecha', await visivel('#modal-aluno'), false);
  conf('e a aula abre', await visivel('#modal-aula'), true);
  const tituloAula = await pag.$eval('#titulo-modal-aula', e => e.textContent);
  conf('é a aula certa', tituloAula.includes('26/06/2026'), true);

  console.log('\n=== aluno sem aulas ===');
  await pag.evaluate(() => {
    document.querySelectorAll('.fundo-modal').forEach(m => m.classList.remove('aberto'));
  });
  await esp(300);
  await abrirAluno('Theo');
  await aba('Histórico');
  const vazio = await pag.$eval('#corpo-modal-aluno', e => e.textContent);
  conf('avisa que não há aulas', vazio.includes('Nenhuma aula registrada'), true);

  const reais = erros.filter(e => !/favicon|manifest|ServiceWorker/i.test(e));
  if (reais.length) reais.forEach(e => console.log('  ERRO: ' + e));
  conf('nenhum erro de JavaScript', reais.length, 0);

  await b.close();
  console.log('\n' + '='.repeat(56));
  console.log(p + ' passaram, ' + f + ' falharam.');
  console.log('='.repeat(56));
  process.exit(f ? 1 : 0);
})().catch(e => { console.error('erro:', e.message, e.stack); process.exit(1); });
