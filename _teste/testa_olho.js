/* O botão que esconde os valores da tela.
   O que importa: some da interface, lembra a escolha, e nunca afeta o PDF. */
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
  pag.on('dialog', async d => { try { await d.accept(); } catch (e) { } });
  await pag.evaluateOnNewDocument(() => {
    window.__gerados = [];
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
    const criar = URL.createObjectURL.bind(URL);
    URL.createObjectURL = function (bl) { window.__ultimo = bl; return criar(bl); };
    const clique = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.hasAttribute('download')) {
        const bl = window.__ultimo, l = new FileReader();
        l.onload = () => window.__gerados.push({ nome: this.getAttribute('download'), b64: l.result.split(',')[1] });
        l.readAsDataURL(bl); return;
      }
      return clique.call(this);
    };
  });
  await pag.goto('http://127.0.0.1:8777/index.html', { waitUntil: 'networkidle0' });
  await esp(1600);

  const receber = () => pag.$$eval('#numeros-mes .numero', es => {
    const c = es.find(e => e.querySelector('.rotulo').textContent.includes('receber'));
    return c ? c.querySelector('.valor').textContent : 'nao achou';
  });

  console.log('\n=== com os valores à vista ===');
  conf('a agenda mostra quanto há a receber', await receber(), 'R$ 1.050,00');
  conf('o botão do olho existe', await pag.$$eval('#alternar-valores', e => e.length), 1);

  console.log('\n=== ela toca no olho ===');
  await pag.$eval('#alternar-valores', e => e.click());
  await esp(700);
  const oculto = await receber();
  conf('o valor sai da tela', /^R\$ [\u2022]+$/.test(oculto), true);
  conf('e o botão fica marcado', await pag.$eval('#alternar-valores', e => e.classList.contains('ativo')), true);

  await pag.evaluate(() => Array.from(document.querySelectorAll('#abas .aba')).find(x => x.dataset.tela === 'alunos').click());
  await esp(500);
  const alunos = await pag.$eval('#lista-alunos', e => e.textContent);
  conf('some também no valor por hora do aluno', alunos.includes('R$ 100,00'), false);

  await pag.evaluate(() => Array.from(document.querySelectorAll('#abas .aba')).find(x => x.dataset.tela === 'fechamento').click());
  await esp(600);
  const fech = await pag.$eval('#tela-fechamento', e => e.textContent);
  conf('some no fechamento', fech.includes('R$ 1.050,00'), false);
  conf('mas as horas continuam à vista', fech.includes('10:30 h'), true);

  console.log('\n=== o PDF continua com os números, que é o que a família recebe ===');
  await pag.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#lista-fechamento button')).find(x => x.textContent.trim() === 'PDF do fechamento');
    b.scrollIntoView({ block: 'center' }); b.click();
  });
  await esp(2000);
  await pag.evaluate(() => {
    const b = document.querySelector('#exportar-md-mes');
    b.scrollIntoView({ block: 'center' }); b.click();
  });
  await esp(1600);
  const ger = await pag.evaluate(() => window.__gerados);
  const md = ger.find(g => g.nome.endsWith('.md'));
  const pdf = ger.find(g => g.nome.endsWith('.pdf'));
  conf('o texto do mês foi gerado', !!md, true);
  if (md) {
    const t = Buffer.from(md.b64, 'base64').toString('utf8');
    conf('e traz o valor de verdade', t.includes('R$ 1.050,00'), true);
    conf('sem nenhuma máscara', t.includes('\u2022'), false);
  }
  conf('o PDF foi gerado', !!pdf, true);
  if (pdf) {
    const bin = Buffer.from(pdf.b64, 'base64');
    conf('o PDF começa certo', bin.slice(0, 4).toString(), '%PDF');
  }

  console.log('\n=== ela fecha e abre o aplicativo ===');
  await pag.reload({ waitUntil: 'networkidle0' });
  await esp(1800);
  conf('a escolha foi lembrada', /^R\$ [\u2022]+$/.test(await receber()), true);

  console.log('\n=== e volta a mostrar quando quiser ===');
  await pag.$eval('#alternar-valores', e => e.click());
  await esp(700);
  conf('os valores voltam', await receber(), 'R$ 1.050,00');
  await pag.reload({ waitUntil: 'networkidle0' });
  await esp(1600);
  conf('e continuam visíveis depois de reabrir', await receber(), 'R$ 1.050,00');

  await b.close();
  console.log('\n' + '='.repeat(56));
  console.log(p + ' passaram, ' + f + ' falharam.');
  console.log('='.repeat(56));
  process.exit(f ? 1 : 0);
})().catch(e => { console.error('erro:', e.message); process.exit(1); });
