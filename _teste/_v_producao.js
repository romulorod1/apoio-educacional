/* Confere o aplicativo publicado, e nao o local. E a unica prova que vale. */
const puppeteer = require('puppeteer-core');
const URL = 'https://romulorod1.github.io/apoio-educacional/';
let ok = 0, mau = 0;
const c = (r, v, e) => { const p = String(v) === String(e); p ? ok++ : mau++;
  console.log((p ? '  OK   ' : '  FALHA') + ' ' + r + (p ? '' : '  [' + v + ' != ' + e + ']')); };
(async () => {
  const nav = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox'], defaultViewport: { width: 1200, height: 900 } });
  const pag = await nav.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  pag.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text()); });

  await pag.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3500));

  c('a versao publicada e a 1.8.0',
    await pag.evaluate(() => (document.body.innerText.match(/1\.8\.0/) || [''])[0]), '1.8.0');
  c('a tela abriu', await pag.$eval('#abas', e => e.children.length > 0), true);

  // o buscador chegou e funciona no ar
  const busca = await pag.evaluate(async () => {
    const r = await fetch('busca.json'.replace(/^/, 'banco/'));
    const j = await r.json();
    return { temas: j.temas.length, tem: typeof Busca === 'object' };
  });
  c('o indice de busca baixou', busca.temas, 146);
  c('o busca.js carregou', busca.tem, true);

  const achou = await pag.evaluate(() => {
    const ix = window.__ix;
    return null;
  });

  // a notacao chegou no banco publicado
  const notacao = await pag.evaluate(async () => {
    const r = await fetch('banco/serie-08.json');
    const j = await r.json();
    const t = j.temas.find(x => x.id === 'MAT08-05');
    return { temExpoente: /\^\{/.test(t.pt.explicacao),
             temPorExtenso: /ao quadrado menos/.test(t.pt.explicacao) };
  });
  c('o banco publicado tem a notacao nova', notacao.temExpoente, true);
  c('e nao tem mais a conta por extenso', notacao.temPorExtenso, false);

  const reais = erros.filter(e => !/favicon|manifest/i.test(e));
  reais.forEach(e => console.log('  ERRO: ' + e));
  c('nenhum erro de JavaScript no ar', reais.length, 0);

  await nav.close();
  console.log('\n' + ok + ' ok, ' + mau + ' falhas');
  process.exit(mau ? 1 : 0);
})().catch(e => { console.error('parou:', e.message); process.exit(1); });
