/* Testes de ponta a ponta das correções e dos recursos novos:
 * folha que travava no modo texto, anexos, repetir para trás e atualização. */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL_APP = 'http://127.0.0.1:8777/index.html';
const VERSAO_ESPERADA = (fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8')
  .match(/var VERSAO = '([^']+)'/) || [])[1];

let falhas = 0, passes = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }
const espera = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const navegador = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 1000, hasTouch: true }
  });
  const pag = await navegador.newPage();
  const errosPagina = [];
  let janelasDoNavegador = 0;
  pag.on('pageerror', e => errosPagina.push(e.message));
  pag.on('console', m => { if (m.type() === 'error') errosPagina.push('console: ' + m.text()); });
  pag.on('dialog', async d => {
    janelasDoNavegador++;
    if (d.type() === 'confirm') await d.accept(); else await d.dismiss();
  });

  await pag.goto(URL_APP, { waitUntil: 'networkidle0' });
  await espera(1500);

  const conta = s => pag.$$eval(s, es => es.length).catch(() => 0);
  const visivel = s => pag.$eval(s, e => getComputedStyle(e).display !== 'none').catch(() => false);
  const texto = s => pag.$eval(s, e => e.textContent.trim()).catch(() => null);
  async function clicar(sel) {
    await pag.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click(); });
    await espera(260);
  }
  async function clicarTexto(sel, txt) {
    const achou = await pag.evaluate((s, t) => {
      const e = Array.from(document.querySelectorAll(s)).find(x => x.textContent.trim().includes(t));
      if (!e) return false;
      e.scrollIntoView({ block: 'center' }); e.click(); return true;
    }, sel, txt);
    if (!achou) throw new Error('não achei "' + txt + '" em ' + sel);
    await espera(300);
  }
  async function preencher(sel, valor) {
    await pag.$eval(sel, (e, v) => {
      const proto = e.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(e, v);
      e.dispatchEvent(new Event('input', { bubbles: true }));
      e.dispatchEvent(new Event('change', { bubbles: true }));
    }, valor);
    await espera(150);
  }
  const bd = () => pag.evaluate(() => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => { const t = q.result.transaction('dados', 'readonly').objectStore('dados').get('principal'); t.onsuccess = () => r(t.result); };
  }));
  const notas = () => pag.evaluate(() => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => { const t = q.result.transaction('notas', 'readonly').objectStore('notas').getAll(); t.onsuccess = () => r(t.result); };
  }));
  async function riscar(desloc) {
    await pag.evaluate(d => {
      const c = document.querySelector('#tela-desenho');
      const r = c.getBoundingClientRect();
      const cx = r.width / 2, cy = r.height / 2 + d;
      const ev = (t, x, y, p) => c.dispatchEvent(new PointerEvent(t, {
        pointerId: 3, pointerType: 'pen', pressure: p, isPrimary: true, bubbles: true,
        clientX: r.left + x, clientY: r.top + y }));
      ev('pointerdown', cx - 60, cy, 0.4);
      for (let i = 1; i < 14; i++) ev('pointermove', cx - 60 + i * 8, cy + Math.sin(i / 3) * 10, 0.3 + (i % 4) * 0.15);
      ev('pointerup', cx + 50, cy, 0.3);
    }, desloc || 0);
    await espera(800);
  }
  async function abrirFolhaDoDia(dia) {
    await pag.evaluate(d => document.querySelector('[data-dia="' + d + '"] .pilula').click(), dia);
    await espera(450);
    await clicarTexto('#corpo-modal-aula button', 'folha');
    await espera(1000);
  }

  // ================================================================
  secao('1. A folha não trava mais no modo texto');

  await abrirFolhaDoDia('2026-06-10');
  conf('o editor abriu', await visivel('#modal-nota'), true);
  await riscar(-60);
  let n = await notas();
  conf('a caneta riscou', n[0].paginas[0].itens.filter(i => i.t === 'traco').length, 1);

  // troca para texto e insere pelo painel do aplicativo
  await pag.$eval('#ferramentas-nota button[title="Texto digitado"]', e => e.click());
  await espera(250);
  await riscar(0);
  conf('abriu o painel do aplicativo, não a janela do navegador', await visivel('#modal-texto'), true);
  conf('nenhuma janela do navegador apareceu', janelasDoNavegador, 0);
  await preencher('#campo-texto-folha', 'Interpretação de texto\nExercícios da página 42');
  await clicar('#salvar-texto-folha');
  await espera(500);

  n = await notas();
  conf('o texto entrou na folha', n[0].paginas[0].itens.filter(i => i.t === 'texto').length, 1);
  conf('com as duas linhas', n[0].paginas[0].itens.find(i => i.t === 'texto').txt.split('\n').length, 2);
  conf('a ferramenta voltou sozinha para a caneta',
    await pag.$eval('#ferramentas-nota button.ativa', e => e.getAttribute('title')), 'Caneta');

  await riscar(60);
  n = await notas();
  conf('e a caneta voltou a riscar na hora', n[0].paginas[0].itens.filter(i => i.t === 'traco').length, 2);

  // fecha, reabre, e confirma que o editor antigo não ficou escutando
  await clicarTexto('#rodape-nota button', 'Concluir');
  await espera(900);
  await abrirFolhaDoDia('2026-06-10');
  await riscar(-30);
  conf('depois de fechar e reabrir, a caneta funciona', janelasDoNavegador, 0);
  n = await notas();
  conf('e o traço foi gravado', n[0].paginas[0].itens.filter(i => i.t === 'traco').length, 3);

  // o ciclo repetido não acumula editores
  await clicarTexto('#rodape-nota button', 'Concluir');
  await espera(800);
  for (let i = 0; i < 3; i++) {
    await abrirFolhaDoDia('2026-06-10');
    await pag.$eval('#ferramentas-nota button[title="Texto digitado"]', e => e.click());
    await espera(200);
    await clicarTexto('#rodape-nota button', 'Concluir');
    await espera(700);
  }
  await abrirFolhaDoDia('2026-06-10');
  await riscar(90);
  conf('depois de cinco aberturas, nenhuma janela do navegador', janelasDoNavegador, 0);
  n = await notas();
  conf('e o traço continua sendo gravado', n[0].paginas[0].itens.filter(i => i.t === 'traco').length, 4);
  await clicarTexto('#rodape-nota button', 'Concluir');
  await espera(800);

  // ================================================================
  secao('2. Anexos aceitam PDF');

  const aceita = await pag.$eval('#entrada-anexo', e => e.getAttribute('accept'));
  conf('o seletor de arquivo pede PDF', aceita.includes('application/pdf'), true);
  conf('e também documentos', aceita.includes('.docx'), true);
  const aceitaFoto = await pag.$eval('#entrada-anexo-foto', e => e.getAttribute('accept'));
  conf('e há um seletor separado para foto', aceitaFoto, 'image/*');

  await pag.evaluate(() => document.querySelector('[data-dia="2026-06-10"] .pilula').click());
  await espera(450);
  const botoes = await pag.$$eval('#corpo-modal-aula button', es => es.map(e => e.textContent.trim()));
  conf('existe o botão de anexar PDF', botoes.includes('Anexar PDF'), true);
  conf('existe o botão de anexar foto', botoes.includes('Anexar foto'), true);

  // anexa um PDF de verdade
  const pdfTeste = path.join(__dirname, 'anexo_teste.pdf');
  fs.writeFileSync(pdfTeste, Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n'));
  const entrada = await pag.$('#entrada-anexo');
  await pag.evaluate(() => {
    const a = Array.from(document.querySelectorAll('#corpo-modal-aula button')).find(b => b.textContent.trim() === 'Anexar PDF');
    a.click();
  });
  await espera(200);
  await entrada.uploadFile(pdfTeste);
  await espera(900);

  let banco = await bd();
  const aulaComAnexo = banco.aulas.find(a => a.data === '2026-06-10');
  conf('o anexo entrou na aula', (aulaComAnexo.anexos || []).length, 1);
  conf('com o nome do arquivo', aulaComAnexo.anexos[0].nome, 'anexo_teste.pdf');

  // ================================================================
  secao('3. A cópia de segurança leva o anexo junto');

  await pag.evaluate(() => document.querySelector('[data-fechar]').closest('.fundo-modal').classList.remove('aberto'));
  await pag.evaluate(() => document.querySelectorAll('.fundo-modal').forEach(m => m.classList.remove('aberto')));
  await espera(300);

  const copia = await pag.evaluate(() => new Promise(resolve => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => {
      const t = q.result.transaction('dados', 'readonly').objectStore('dados').get('principal');
      t.onsuccess = () => Store.exportarTudo(t.result).then(p => resolve(JSON.parse(JSON.stringify(p))));
    };
  }));
  const chaves = Object.keys(copia.anexos || {});
  conf('a cópia tem um anexo', chaves.length, 1);
  conf('o anexo virou texto e sobreviveu ao JSON', !!copia.anexos[chaves[0]].conteudo, true);
  conf('com o tipo preservado', copia.anexos[chaves[0]].tipo, 'application/pdf');
  conf('e o conteúdo é mesmo um PDF',
    Buffer.from(String(copia.anexos[chaves[0]].conteudo).split(',')[1], 'base64').slice(0, 4).toString(), '%PDF');

  // restaura e confere que o arquivo volta utilizável
  const voltou = await pag.evaluate(pacote => Store.importarTudo(pacote)
    .then(() => new Promise(r => {
      const q = indexedDB.open('apoio-educacional');
      q.onsuccess = () => {
        const t = q.result.transaction('anexos', 'readonly').objectStore('anexos').getAll();
        t.onsuccess = () => {
          const reg = t.result[0];
          if (!reg || !reg.blob) { r('sem blob'); return; }
          reg.blob.text().then(txt => r(txt.slice(0, 4)));
        };
      };
    })), copia);
  conf('depois de restaurar, o PDF continua abrindo', voltou, '%PDF');

  // ================================================================
  secao('4. Repetir para trás');

  await pag.reload({ waitUntil: 'networkidle0' });
  await espera(1500);
  await pag.evaluate(() => document.querySelector('[data-dia="2026-06-10"] .pilula').click());
  await espera(450);
  await clicarTexto('#corpo-modal-aula button', 'Repetir para trás');
  await espera(500);
  conf('o painel abriu', await visivel('#modal-retroativo'), true);

  const previaInicial = await texto('#corpo-modal-retroativo .faixa-info');
  conf('mostra a previsão antes de criar', /aula(s)? seria/.test(previaInicial), true);

  await preencher('#campo-retroativo-ate', '2026-05-01');
  await espera(300);
  const previa = await texto('#corpo-modal-retroativo .faixa-info');
  console.log('   previsão: ' + previa);

  const antes = (await bd()).aulas.length;
  await clicar('#salvar-retroativo');
  await espera(1200);
  banco = await bd();
  const maio = banco.aulas.filter(a => a.data.startsWith('2026-05'));
  conf('criou aulas em maio', maio.length > 0, true);
  conf('seguem os dias da série do aluno', maio.every(a => [1,3,5].includes(new Date(a.data + 'T12:00').getDay())), true);
  conf('no mesmo horário da aula de origem', maio.every(a => a.hora === '15:30'), true);
  conf('nenhuma depois da aula de origem', banco.aulas.every(a => a.alunoId !== maio[0].alunoId || a.data <= '2026-06-30' ), true);
  conf('a barra oferece desfazer', await pag.$eval('#aviso', e => e.classList.contains('aberto')), true);

  await clicar('#aviso-acao');
  await espera(1000);
  banco = await bd();
  conf('desfazer devolveu tudo ao que era', banco.aulas.length, antes);
  conf('e maio ficou vazio de novo', banco.aulas.filter(a => a.data.startsWith('2026-05')).length, 0);

  // ================================================================
  secao('5. Versão e atualização');

  await pag.evaluate(() => Array.from(document.querySelectorAll('#abas .aba')).find(b => b.dataset.tela === 'ajustes').click());
  await espera(500);
  conf('a versão aparece', await texto('#versao-app'), VERSAO_ESPERADA);
  conf('existe o botão de procurar atualização', await conta('#procurar-atualizacao'), 1);
  const aviso = await pag.$eval('#tela-ajustes', e => e.textContent);
  conf('explica que atualizar não apaga dados', aviso.includes('Atualizar não apaga nada'), true);
  conf('e que não precisa reinstalar', aviso.includes('desinstalar e instalar de novo'), true);

  // ================================================================
  secao('6. Erros de página');
  const reais = errosPagina.filter(e => !/favicon|manifest|sw\.js|ServiceWorker/i.test(e));
  if (reais.length) reais.forEach(e => console.log('  ERRO: ' + e));
  conf('nenhum erro de JavaScript', reais.length, 0);
  conf('nenhuma janela do navegador em toda a sessão', janelasDoNavegador, 0);

  fs.unlinkSync(pdfTeste);
  await navegador.close();

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
