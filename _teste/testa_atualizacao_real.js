/* Atualização com os cabeçalhos reais do GitHub Pages (max-age=600 e ETag).
 *
 * Mede quantas aberturas o tablet precisa até receber a versão nova, nos dois
 * cenários que importam: cache do navegador recém-criado, que é o pior caso, e
 * cache já vencido, que é o caso de quem usou o aplicativo horas antes.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { execSync } = require('child_process');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PASTA = path.join(__dirname, 'sim_real');
const RAIZ = path.join(__dirname, '..');
const PORTA = 8779;
const COMMIT_V1 = '7250029';
// a versao esperada sai do proprio codigo, para o teste nao envelhecer a cada release
const VERSAO_NOVA = (fs.readFileSync(path.join(RAIZ, 'app.js'), 'utf8')
  .match(/var VERSAO = '([^']+)'/) || [])[1];
const CACHE_ATUAL = (fs.readFileSync(path.join(RAIZ, 'sw.js'), 'utf8')
  .match(/var CACHE = '([^']+)'/) || [])[1];
const BARRA = String.fromCharCode(92);

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

let falhas = 0;
function conf(r, o, e) {
  const ok = String(o) === String(e);
  if (!ok) falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + r + (ok ? '' : '  [obtido: ' + o + ' | esperado: ' + e + ']'));
}
const espera = ms => new Promise(r => setTimeout(r, ms));

function reporVersaoAntiga() {
  fs.rmSync(PASTA, { recursive: true, force: true });
  fs.mkdirSync(PASTA, { recursive: true });
  execSync('git archive ' + COMMIT_V1 + ' | tar -x -C "' + PASTA.split(BARRA).join('/') + '"',
    { cwd: RAIZ, shell: 'C:/Program Files/Git/bin/bash.exe' });
}
function publicarVersaoNova() {
  ['index.html', 'styles.css', 'core.js', 'pdf.js', 'store.js', 'draw.js', 'app.js', 'sw.js', 'manifest.webmanifest']
    .forEach(f => fs.copyFileSync(path.join(RAIZ, f), path.join(PASTA, f)));
}

const servidor = http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';
  const arquivo = path.join(PASTA, rel);
  if (!arquivo.startsWith(PASTA) || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
    res.writeHead(404); res.end('nao encontrado'); return;
  }
  const conteudo = fs.readFileSync(arquivo);
  const etag = '"' + crypto.createHash('md5').update(conteudo).digest('hex').slice(0, 16) + '"';
  if (req.headers['if-none-match'] === etag) { res.writeHead(304); res.end(); return; }
  res.writeHead(200, {
    'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream',
    'Cache-Control': 'max-age=600',           // exatamente o do GitHub Pages
    'ETag': etag
  });
  res.end(conteudo);
});

(async () => {
  await new Promise(r => servidor.listen(PORTA, '127.0.0.1', r));
  const url = 'http://127.0.0.1:' + PORTA + '/index.html';

  async function abrirNavegador() {
    const nav = await puppeteer.launch({
      executablePath: CHROME, headless: 'new',
      args: ['--no-sandbox'], defaultViewport: { width: 1280, height: 1000, hasTouch: true }
    });
    const p = await nav.newPage();
    p.on('dialog', async d => { try { await d.accept(); } catch (e) { } });
    return { nav, p };
  }
  const versao = p => p.$eval('#versao-app', e => e.textContent).catch(() => '?');
  const aulas = p => p.evaluate(() => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => { const t = q.result.transaction('dados', 'readonly').objectStore('dados').get('principal'); t.onsuccess = () => r(t.result.aulas.length); };
  }));

  // =============================================================
  console.log('\n=== CENÁRIO A: cache do navegador recém-criado (pior caso) ===');
  reporVersaoAntiga();
  let { nav, p } = await abrirNavegador();
  await p.goto(url, { waitUntil: 'networkidle0' });
  await espera(2500);
  conf('começa na versão instalada', await versao(p), '1.0.0');
  const guardadas = await aulas(p);

  publicarVersaoNova();
  await p.goto('about:blank'); await espera(300);
  await p.goto(url, { waitUntil: 'networkidle0' });
  await espera(3000);
  const aberturaUm = await versao(p);
  console.log('   com o cache ainda quentinho, a primeira abertura mostra: ' + aberturaUm);
  conf('mesmo assim nenhuma aula se perde', await aulas(p), guardadas);

  // o cache de dez minutos vence; simulamos isso limpando só o cache de arquivos
  const cdp = await p.target().createCDPSession();
  await cdp.send('Network.clearBrowserCache');
  await p.goto('about:blank'); await espera(300);
  await p.goto(url, { waitUntil: 'networkidle0' });
  await espera(3500);
  conf('passados os dez minutos, a versão nova entra', await versao(p), VERSAO_NOVA);
  conf('e as aulas continuam todas', await aulas(p), guardadas);
  await nav.close();

  // =============================================================
  console.log('\n=== CENÁRIO B: cache já vencido, que é o caso dela ===');
  reporVersaoAntiga();
  ({ nav, p } = await abrirNavegador());
  await p.goto(url, { waitUntil: 'networkidle0' });
  await espera(2500);
  conf('começa na versão instalada', await versao(p), '1.0.0');
  const guardadasB = await aulas(p);

  publicarVersaoNova();
  // ela usou o aplicativo horas atrás, então o cache de dez minutos já venceu
  const cdpB = await p.target().createCDPSession();
  await cdpB.send('Network.clearBrowserCache');
  await p.goto('about:blank'); await espera(300);
  await p.goto(url, { waitUntil: 'networkidle0' });
  await espera(3500);
  conf('a versão nova entra já na primeira abertura', await versao(p), VERSAO_NOVA);
  conf('sem perder nenhuma aula', await aulas(p), guardadasB);

  // =============================================================
  console.log('\n=== depois de atualizada, a próxima chega na hora ===');
  // agora ela está com o service worker novo, que sempre confere no servidor
  await p.evaluate(() => navigator.serviceWorker.getRegistration()
    .then(reg => { if (reg && reg.waiting) reg.waiting.postMessage({ tipo: 'ativar-agora' }); }));
  await espera(2500);
  await p.goto(url, { waitUntil: 'networkidle0' });
  await espera(2000);

  // publica uma versão seguinte, sem limpar cache nenhum
  const appOriginal = fs.readFileSync(path.join(PASTA, 'app.js'), 'utf8');
  fs.writeFileSync(path.join(PASTA, 'app.js'),
    appOriginal.replace("var VERSAO = '" + VERSAO_NOVA + "'", "var VERSAO = '9.9.9'"));
  const swOriginal = fs.readFileSync(path.join(PASTA, 'sw.js'), 'utf8');
  fs.writeFileSync(path.join(PASTA, 'sw.js'), swOriginal.replace(CACHE_ATUAL, 'apoio-educacional-v99'));

  await p.goto('about:blank'); await espera(300);
  await p.goto(url, { waitUntil: 'networkidle0' });
  await espera(3500);
  conf('a versão seguinte entra sem esperar cache nenhum', await versao(p), '9.9.9');
  conf('e as aulas seguem intactas', await aulas(p), guardadasB);

  console.log('\n=== e continua abrindo sem internet ===');
  await p.setOfflineMode(true);
  await p.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => { });
  await espera(2500);
  conf('abre sem rede', await p.$eval('#rotulo-mes', e => e.textContent.length > 3).catch(() => false), true);
  conf('com as aulas no lugar', await aulas(p), guardadasB);
  await p.setOfflineMode(false);

  await nav.close();
  servidor.close();
  fs.rmSync(PASTA, { recursive: true, force: true });
  console.log('\n' + (falhas === 0 ? 'ATUALIZAÇÃO CONFIRMADA COM OS CABEÇALHOS REAIS' : falhas + ' FALHA(S)'));
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error('erro:', e.message, e.stack); process.exit(1); });
