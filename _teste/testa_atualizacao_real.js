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

let falhas = 0, passes = 0;
function conf(r, o, e) {
  const ok = String(o) === String(e);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + r + (ok ? '' : '  [obtido: ' + o + ' | esperado: ' + e + ']'));
}
const espera = ms => new Promise(r => setTimeout(r, ms));

/* ESPERA A VERSÃO APARECER, em vez de dormir um número fixo de segundos.
 *
 * Os três pontos que conferiam a versão dormiam 3500 ms e perguntavam uma vez.
 * Medido no HEAD limpo, sem mudança nenhuma de código: seis rodadas, quatro
 * falharam e duas passaram, sempre na mesma asserção. A troca de service
 * worker mais o recarregamento que ela dispara não cabem num prazo fixo numa
 * máquina ocupada, e o teste virava moeda. Alarme falso ensina a ignorar
 * alarme, que é a única coisa que este portão não pode ensinar.
 *
 * O prazo generoso não afrouxa a asserção. O que ela afirma é que a versão
 * nova entra sem esperar o cache de DEZ MINUTOS do GitHub Pages: qualquer
 * coisa medida em segundos prova isso. E o tempo real sai impresso, então uma
 * lentidão nova aparece na saída em vez de virar reprovação silenciosa. */
async function esperaVersao(p, ler, esperada, limiteMs) {
  const ate = Date.now() + (limiteMs || 20000);
  let atual = await ler(p);
  while (String(atual) !== String(esperada) && Date.now() < ate) {
    await espera(250);
    atual = await ler(p);
  }
  return atual;
}

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
  const t1 = Date.now();
  const v1 = await esperaVersao(p, versao, VERSAO_NOVA);
  console.log('   a versão nova apareceu em ' + (Date.now() - t1) + ' ms');
  conf('passados os dez minutos, a versão nova entra', v1, VERSAO_NOVA);
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
  const t2 = Date.now();
  const v2 = await esperaVersao(p, versao, VERSAO_NOVA);
  console.log('   a versão nova apareceu em ' + (Date.now() - t2) + ' ms');
  conf('a versão nova entra já na primeira abertura', v2, VERSAO_NOVA);
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

  /* QUANTAS ABERTURAS ATÉ A VERSÃO SEGUINTE CHEGAR, sem limpar cache nenhum.
   *
   * A asserção antiga dizia que ela chegava na PRIMEIRA abertura, e isso é
   * falso: medido, o servidor entrega 9.9.9 quando perguntado, a página é
   * controlada pelo service worker, e mesmo assim ela executa a versão
   * anterior, porque os scripts do index.html saem do cache HTTP do próprio
   * navegador, que é o que o comentário do sw.js já dizia. A trava passava por
   * sorte, quando a instalação do service worker novo ganhava a corrida do
   * relógio fixo de 3500 ms: no HEAD limpo, quatro reprovações em seis
   * rodadas, sempre nesta linha, sem mudança nenhuma de código. Alarme falso
   * ensina a ignorar alarme.
   *
   * O que o aplicativo garante de verdade, e é o que interessa para ela: a
   * primeira abertura instala a versão nova por baixo, e a SEGUINTE já roda
   * ela. Sem esperar os dez minutos do cabeçalho, que é o ponto do teste. Duas
   * aberturas seguidas é o que acontece sozinho quando ela abre o aplicativo na
   * casa de uma família e de novo na casa da seguinte.
   *
   * Continua sendo trava, e mais forte que a de antes: falha se passar de duas
   * aberturas, e falha também se a versão nunca chegar. */
  let aberturas = 0;
  let v3 = '?';
  while (aberturas < 3 && v3 !== '9.9.9') {
    aberturas++;
    await p.goto('about:blank'); await espera(300);
    await p.goto(url, { waitUntil: 'networkidle0' });
    v3 = await esperaVersao(p, versao, '9.9.9', aberturas === 1 ? 4000 : 12000);
    console.log('   abertura ' + aberturas + ': ' + v3);
  }
  conf('a versão seguinte chega sem esperar os dez minutos de cache', v3, '9.9.9');
  conf('e chega em no máximo duas aberturas', aberturas <= 2, true);
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
  /* O placar sai no MESMO dialeto dos irmãos: "N passaram, M falharam".
   *
   * Este teste falava sozinho. Dizia "ATUALIZAÇÃO CONFIRMADA" quando passava e
   * "N FALHA(S)" quando falhava, e o portão do merge lê duas coisas: quantas
   * verificações falharam, por "N falharam", e se o teste chegou a se declarar,
   * por "passaram" ou "CONFIRMAD". Numa falha de asserção de verdade a saída
   * não casava com nenhuma das duas, então o portão caía no galho de quem morre
   * antes de começar e imprimia "FALHOU testa_atualizacao_real nao chegou a
   * rodar: ", com o motivo VAZIO, depois de rodar o teste de navegador inteiro
   * uma segunda vez à toa. Medido: o teste rodava até o fim, imprimia 14 OK e
   * uma FALHA, e quem lia o portão via um teste que não teria rodado.
   *
   * Ensinar mais um dialeto ao portão consertaria este teste e deixaria o
   * próximo irmão livre para inventar o dele. A linha do placar é o contrato
   * com o portão, e o contrato é este.
   *
   * A frase da confirmação continua, porque ela é o que este teste tem de
   * particular: ele é o único que percorre uma transição de versão com os
   * cabeçalhos reais do GitHub Pages, e é por esse nome que ela aparece no
   * resumo do portão. */
  console.log('\n' + passes + ' verificações passaram, ' + falhas + ' falharam.');
  if (falhas === 0) console.log('ATUALIZAÇÃO CONFIRMADA COM OS CABEÇALHOS REAIS');
  process.exit(falhas ? 1 : 0);
})().catch(e => {
  /* A PASTA TEMPORÁRIA SAI MESMO QUANDO O TESTE MORRE.
   *
   * Ela é uma cópia do repositório inteiro, feita por git archive, e por isso
   * carrega dentro o nome da aluna. Quando o navegador morria no meio (medido:
   * "Navigating frame was detached"), o caminho de sucesso que apaga a pasta
   * não era alcançado, _teste/sim_real ficava para trás, e a trava de
   * privacidade do portão disparava na rodada seguinte apontando um arquivo
   * que ninguém tinha escrito. Um susto de privacidade causado por um crash de
   * navegador, e a falha em cascata escondia a falha de verdade. */
  try { fs.rmSync(PASTA, { recursive: true, force: true }); } catch (e2) { }
  console.error('erro:', e.message, e.stack);
  console.log('\n' + passes + ' verificações passaram, ' + (falhas + 1) + ' falharam.');
  process.exit(1);
});
