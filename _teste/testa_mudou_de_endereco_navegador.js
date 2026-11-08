/* testa_mudou_de_endereco_navegador.js (B4)
 *
 * Duas provas, no Chrome, com perfil novo:
 *
 * 1. A FAIXA "O aplicativo mudou de endereço" aparece no endereço antigo e
 *    nunca no novo. O mesmo código, servido em tres origens:
 *      https://romulorod1.github.io/apoio-educacional/   tem a faixa
 *      https://apoio-educacional.pages.dev/              nao tem
 *      http://localhost:<porta>/                         nao tem
 *    As duas primeiras sao entregues pela interceptacao do puppeteer, a partir
 *    do disco: a pagina roda com a origem de verdade (location.hostname e o
 *    nome real), sem nenhum pedido sair para a internet (o resolvedor do
 *    Chrome manda todo nome que nao e local para lugar nenhum). No antigo,
 *    com a faixa, o aplicativo continua funcionando com os dados locais: a
 *    aluna gravada antes de recarregar continua la, as abas trocam de tela,
 *    "Agora não" esconde a faixa so ate a proxima abertura, e "Salvar a cópia
 *    agora" aciona o mesmo botão de Ajustes.
 *
 * 2. O ACTIVATE DO sw.js NAO TOCA CACHE DE OUTRA ORIGEM. Servidor de verdade
 *    numa porta so deste teste, duas origens: 127.0.0.1 e localhost. Em
 *    127.0.0.1 ficam caches com o nome do aplicativo (inclusive um
 *    apoio-educacional-v1, que o activate apagaria se fosse da mesma origem);
 *    em localhost o aplicativo instala e ativa o worker. Controle positivo:
 *    o apoio-educacional-v1 plantado em localhost SOME (o instrumento ve a
 *    limpeza), e os de 127.0.0.1 continuam todos, com o conteudo.
 *    Nao e mudanca do sw.js: CacheStorage e por origem, e o caches.keys() do
 *    worker so lista a origem dele. A prova e que isso vale de fato aqui.
 */
'use strict';
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const H = require('./_bib_navegador');
const { conf, secao, esperar, pausa, placar, RAIZ } = H;

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORTA = Number(process.env.PORTA_B4 || 8881);
const ANTIGO = 'https://romulorod1.github.io/apoio-educacional/';
const NOVO = 'https://apoio-educacional.pages.dev/';
const LOCAL = 'http://127.0.0.1:' + PORTA + '/';
const OUTRA = 'http://localhost:' + PORTA + '/';
const PERFIL = path.join(os.tmpdir(), 'nath_b4_endereco_' + process.pid + '_' + Date.now());
const CACHE = (fs.readFileSync(path.join(RAIZ, 'sw.js'), 'utf8').match(/^var CACHE = '([^']+)'/m) || [])[1];
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm'
};

function doDisco(rel) {
  if (rel === '' || rel === '/') rel = 'index.html';
  rel = rel.replace(/^\/+/, '');
  if (rel === 'vazio.html') return { tipo: TIPOS['.html'], corpo: Buffer.from('<!doctype html><title>vazio</title>') };
  const arq = path.join(RAIZ, rel);
  if (!arq.startsWith(RAIZ) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) return null;
  return { tipo: TIPOS[path.extname(arq)] || 'application/octet-stream', corpo: fs.readFileSync(arq) };
}

/* O que a interceptacao entrega: so os dois enderecos publicos, do disco. */
const fora = [];
function caminhoInterceptado(url) {
  const u = new URL(url);
  if (u.protocol === 'https:' && u.host === 'romulorod1.github.io' && u.pathname.indexOf('/apoio-educacional/') === 0)
    return u.pathname.slice('/apoio-educacional/'.length);
  if (u.protocol === 'https:' && u.host === 'apoio-educacional.pages.dev') return u.pathname.slice(1);
  return null;
}

const servidor = http.createServer((req, res) => {
  const a = doDisco(decodeURIComponent(req.url.split('?')[0]));
  if (!a) { res.writeHead(404); res.end('nao encontrado'); return; }
  res.writeHead(200, { 'Content-Type': a.tipo, 'Cache-Control': 'no-store' });
  res.end(a.corpo);
});
const conexoes = new Set();
servidor.on('connection', s => { conexoes.add(s); s.on('close', () => conexoes.delete(s)); });

function portaOcupada() {
  return new Promise(r => {
    const q = http.get({ host: '127.0.0.1', port: PORTA, path: '/', timeout: 1500 }, s => { s.resume(); r(true); });
    q.on('timeout', () => { q.destroy(); r(true); });
    q.on('error', () => r(false));
  });
}

let nav = null;
async function novaPagina() {
  const pag = await nav.newPage();
  pag.setDefaultTimeout(60000);
  pag.errosDePagina = [];
  pag.on('pageerror', e => pag.errosDePagina.push(e.message));
  pag.on('dialog', async d => { try { await d.accept(); } catch (e) { /* ok */ } });
  await pag.setRequestInterception(true);
  pag.on('request', req => {
    const url = req.url();
    if (/^(data|blob):/.test(url)) { req.continue(); return; }
    const rel = caminhoInterceptado(url);
    if (rel !== null) {
      const a = doDisco(rel);
      if (!a) { req.respond({ status: 404, contentType: 'text/plain', body: 'nao encontrado' }); return; }
      req.respond({ status: 200, contentType: a.tipo, body: a.corpo, headers: { 'Cache-Control': 'no-store' } });
      return;
    }
    const u = new URL(url);
    if (u.hostname === '127.0.0.1' || u.hostname === 'localhost') { req.continue(); return; }
    fora.push(url);
    req.abort('internetdisconnected');
  });
  return pag;
}

async function abrir(pag, base) {
  await pag.goto(base + 'index.html', { waitUntil: 'load' });
  const ok = await esperar('o aplicativo abriu em ' + base, () => pag.evaluate(() =>
    !!document.querySelector('#abas .aba') && typeof Store === 'object' &&
    !!document.querySelector('#versao-app') && document.querySelector('#versao-app').textContent.length > 1),
  v => v === true, 40000);
  conf('o aplicativo abre em ' + base, ok.ok, true);
  await pausa(1200);
  await pag.evaluate(() => {
    const b = document.querySelector('#entendi-novidades');
    if (b && document.querySelector('#modal-novidades.aberto')) b.click();
  });
}

const estadoFaixa = pag => pag.evaluate(() => {
  const f = document.querySelector('#faixa-endereco');
  if (!f) return { existe: false };
  const a = f.querySelector('#faixa-endereco-abrir');
  return {
    existe: true, visivel: !f.hidden && f.getBoundingClientRect().height > 0,
    titulo: (f.querySelector('strong') || {}).textContent, link: a && a.href,
    alvo: a && a.target, depoisDoCabecalho: f.previousElementSibling === document.querySelector('.cabecalho'),
    texto: f.textContent
  };
});

async function provaDaFaixa() {
  secao('endereço antigo: a faixa aparece e o aplicativo segue com os dados');
  const pag = await novaPagina();
  await abrir(pag, ANTIGO);
  conf('a página roda com a origem do endereço antigo', await pag.evaluate(() => location.origin), 'https://romulorod1.github.io');
  let f = await estadoFaixa(pag);
  conf('a faixa existe no endereço antigo', f.existe, true);
  conf('a faixa está à vista', f.visivel, true);
  conf('o título da faixa', f.titulo, 'O aplicativo mudou de endereço');
  conf('o link leva ao endereço novo', f.link, NOVO);
  conf('o link abre fora do aplicativo instalado', f.alvo, '_blank');
  conf('a faixa fica logo abaixo do cabeçalho, no fluxo', f.depoisDoCabecalho, true);
  conf('a faixa guia: cópia, instalar, restaurar',
    /Salvar a cópia agora/.test(f.texto) && /Instalar aplicativo/.test(f.texto) && /Restaurar de uma cópia/.test(f.texto), true);
  conf('sem travessão no texto da faixa', /[\u2013\u2014]/.test(f.texto || ''), false);

  // um aluno novo, gravado pelo Store do próprio aplicativo
  const gravou = await pag.evaluate(() => Store.carregar().then(db => {
    db.alunos.push({ id: 'b4-prova', nome: 'Aluna da prova B4', ativo: true });
    return Store.salvar(db).then(() => true);
  }));
  conf('gravou um aluno no endereço antigo', gravou, true);

  // "Salvar a cópia agora" aciona o botão de Ajustes (contado, sem baixar nada)
  await pag.evaluate(() => {
    window.__cliquesCopia = 0;
    document.querySelector('#baixar-copia').addEventListener('click', ev => {
      window.__cliquesCopia++; ev.stopImmediatePropagation();
    }, true);
  });
  await pag.click('#faixa-endereco-copia');
  conf('"Salvar a cópia agora" aciona o "Salvar cópia de segurança" de Ajustes', await pag.evaluate(() => window.__cliquesCopia), 1);

  await pag.click('#faixa-endereco-fechar');
  f = await estadoFaixa(pag);
  conf('"Agora não" esconde a faixa', f.visivel, false);

  await pag.reload({ waitUntil: 'load' });
  await abrir(pag, ANTIGO);
  f = await estadoFaixa(pag);
  conf('na abertura seguinte a faixa volta', f.existe && f.visivel, true);
  const aluno = await pag.evaluate(() => Store.carregar().then(db => db.alunos.some(a => a.id === 'b4-prova')));
  conf('o aluno gravado continua no endereço antigo depois de reabrir', aluno, true);
  await pag.evaluate(() => {
    const aba = Array.from(document.querySelectorAll('#abas .aba')).find(x => x.dataset.tela === 'ajustes');
    if (aba) aba.click();
  });
  await pausa(300);
  conf('com a faixa, as abas trocam de tela (Ajustes abriu)',
    await pag.evaluate(() => { const t = document.querySelector('#tela-ajustes'); return !!t && t.getBoundingClientRect().height > 0; }), true);
  conf('sem erro de página no endereço antigo', pag.errosDePagina.join(' | '), '');
  await pag.close();

  secao('endereço novo: nunca a faixa');
  const novo = await novaPagina();
  await abrir(novo, NOVO);
  conf('a página roda com a origem do endereço novo', await novo.evaluate(() => location.origin), 'https://apoio-educacional.pages.dev');
  await pausa(800);
  f = await estadoFaixa(novo);
  conf('a faixa NÃO existe no endereço novo', f.existe, false);
  conf('origem nova, banco novo: o aluno do antigo não está aqui',
    await novo.evaluate(() => Store.carregar().then(db => db.alunos.some(a => a.id === 'b4-prova'))), false);
  conf('sem erro de página no endereço novo', novo.errosDePagina.join(' | '), '');
  await novo.close();

  secao('endereço local de teste (localhost): nunca a faixa');
  const local = await novaPagina();
  await abrir(local, OUTRA);
  await pausa(800);
  conf('a faixa NÃO existe em localhost', (await estadoFaixa(local)).existe, false);
  await local.close();
}

async function provaDoActivate() {
  secao('activate do sw.js não toca cache de outra origem');
  conf('nome do cache lido do sw.js', !!CACHE, true);
  const nomesA = ['apoio-educacional-v1', 'apoio-educacional-v73', 'outro-aplicativo-v1'];
  const a = await novaPagina();
  await a.goto(LOCAL + 'vazio.html');
  await a.evaluate(nomes => Promise.all(nomes.map(n => caches.open(n).then(c =>
    c.put('/marca-' + n, new Response('conteudo de ' + n))))), nomesA);
  conf('caches plantados na origem 127.0.0.1', (await a.evaluate(() => caches.keys())).sort().join(','), nomesA.slice().sort().join(','));

  const b = await novaPagina();
  await b.goto(OUTRA + 'vazio.html');
  await b.evaluate(() => caches.open('apoio-educacional-v1').then(c => c.put('/marca', new Response('x'))));
  await abrir(b, OUTRA);
  const ativo = await esperar('o worker ativou em localhost e limpou o v1 de lá', () => b.evaluate(async c => {
    const reg = await navigator.serviceWorker.getRegistration();
    const nomes = await caches.keys();
    return !!(reg && reg.active && reg.active.state === 'activated') && nomes.indexOf(c) >= 0 &&
      nomes.indexOf('apoio-educacional-v1') < 0;
  }, CACHE), v => v === true, 60000);
  conf('controle positivo: em localhost o activate apagou o apoio-educacional-v1 da MESMA origem', ativo.ok, true);
  const nomesB = await b.evaluate(() => caches.keys());
  conf('em localhost ficou o cache desta versão (' + CACHE + ')', nomesB.indexOf(CACHE) >= 0, true);

  const depois = await a.evaluate(nomes => Promise.all(nomes.map(n => caches.has(n).then(tem => tem ?
    caches.open(n).then(c => c.match('/marca-' + n)).then(r => r ? r.text() : 'sem a marca') : 'apagado'))), nomesA);
  nomesA.forEach((n, i) => conf('na origem 127.0.0.1, ' + n + ' continua com o conteúdo', depois[i], 'conteudo de ' + n));
  conf('a origem 127.0.0.1 não ganhou nem perdeu cache', (await a.evaluate(() => caches.keys())).sort().join(','), nomesA.slice().sort().join(','));
  await a.close();
  await b.close();
}

(async function () {
  let erro = null;
  try {
    if (await portaOcupada()) {
      conf('a porta ' + PORTA + ' está livre', 'ocupada', 'livre');
      throw Object.assign(new Error('porta ocupada'), { jaContado: true });
    }
    await new Promise((r, j) => { servidor.once('error', j); servidor.listen(PORTA, '127.0.0.1', r); });
    nav = await puppeteer.launch({
      executablePath: CHROME, headless: true, userDataDir: PERFIL,
      args: ['--no-sandbox', '--disable-dev-shm-usage',
        // nada sai para a internet: todo nome que não é local cai em "não encontrado"
        '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost'],
      defaultViewport: { width: 1280, height: 1000, hasTouch: true }
    });
    const cdp = await nav.target().createCDPSession();
    await cdp.send('Browser.setDownloadBehavior', { behavior: 'deny' });
    await provaDoActivate();
    await provaDaFaixa();
    const reais = fora.filter(u => !/ibge/.test(u));
    conf('nenhum pedido tentou sair para a internet (fora o IBGE, recusado)', reais.slice(0, 3).join(' '), '');
  } catch (e) {
    erro = e;
    console.error('erro:', e.message);
    if (!e.jaContado) { console.error(e.stack); placar.falhas++; }
  }
  if (nav) { try { await nav.close(); } catch (e) { /* já fechou */ } }
  conexoes.forEach(s => s.destroy());
  await new Promise(r => servidor.close(() => r()));
  try { fs.rmSync(PERFIL, { recursive: true, force: true }); } catch (e) { /* já saiu */ }
  console.log('\n' + placar.passes + ' passaram, ' + placar.falhas + ' falharam.');
  process.exit(placar.falhas || erro ? 1 : 0);
})();
