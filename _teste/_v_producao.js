/* Confere o aplicativo publicado, e nao o local. E a unica prova que vale. */
const path = require('path');
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

  /* A versao esperada vem do app.js LOCAL e a lida e a PRIMEIRA que aparece na tela

   * (o painel de novidades lista as anteriores logo abaixo). Antes o numero estava

   * cravado aqui em dois lugares e numa regex com barras, e uma troca de versao

   * deixou a regex para tras: a conferencia acusava producao saudavel. */

  const esperada = (require('fs').readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8')

    .match(/VERSAO = '([0-9.]+)'/) || [])[1];

  c('a versao publicada e a do app.js local (' + esperada + ')',

    await pag.evaluate(() => (document.body.innerText.match(/\d+\.\d+\.\d+/) || [''])[0]), esperada);
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
