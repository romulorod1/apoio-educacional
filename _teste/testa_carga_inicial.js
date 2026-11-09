/* testa_carga_inicial.js
 *
 * A carga de exemplo (os doze alunos de teste e o junho de referência) é SÓ
 * das provas. Desde 09/11/2026 o app está em produção, com os dados reais
 * dela na nuvem: em produção o banco vazio abre vazio, e nada de exemplo
 * pode entrar na fila que sobe para a nuvem de um aparelho novo.
 *
 * O SINAL é a origem local: a carga entra só quando a página roda em
 * 127.0.0.1 ou localhost (app.js, cargaDeExemploPedida). A prova abre o mesmo
 * código nas origens de verdade de produção, entregues pela interceptação do
 * puppeteer a partir do disco (location.hostname é o nome real, e o
 * resolvedor do Chrome manda todo nome que não é local para lugar nenhum):
 *
 *   1. sem o sinal (apoio-educacional.pages.dev e romulorod1.github.io): o
 *      banco vazio abre vazio, com zero alunos, zero aulas e nada na fila, e
 *      a tela mostra o estado vazio de sempre;
 *   2. com o sinal (127.0.0.1): a carga entra, com os doze nomes de teste e o
 *      junho de referência (10 encontros, 10:30, R$ 1.050,00); abre no mês do
 *      exemplo; o "Apagar a carga inicial" tira os doze. CONTROLE POSITIVO da
 *      nuvem: a mesma carga, numa conta do emulador, sobe por registro, e o
 *      instrumento a conta (sem isso, o zero da seção 4 não diria nada);
 *   3. em produção, depois do "Apagar tudo" e de reabrir: zero, sem a carga;
 *   4. o APARELHO NOVO: abre em produção, entra na conta (no emulador), envia
 *      a cópia e reabre, como na migração. Zero registro de exemplo na nuvem,
 *      e a cópia enviada não tem aluno nenhum.
 *
 * Veneno, que TEM de ser visto:
 *   --envenenado-carga-em-producao  o app.js servido decide que a carga é
 *                                   pedida em qualquer origem (a regra de
 *                                   antes); as seções 1, 3 e 4 têm de acusar,
 *                                   a 4 com registros de exemplo na nuvem.
 *
 * Portas: 8951 (app), 8953 (auth), 8954 (firestore), 8955 (hub), 8956 (log),
 * 8957 (websocket). Precisa do firebase-tools e de um JDK 21 em JAVA_HOME.
 * O relógio da página é o da rodada: 16/11/2026, 11:00.
 */
'use strict';
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn, spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar, placar, RAIZ } = H;

const MODOS = ['--envenenado-carga-em-producao'];
const [V_PRODUCAO] = MODOS;
const MODO = MODOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && MODOS.indexOf(a) < 0);
function prop(rotulo, ok, venenos) {
  venenos = [].concat(venenos || []);
  if (MODO && venenos.indexOf(MODO) >= 0) return conf('VENENO visto: ' + rotulo + ', e quebrou', ok, false);
  return conf(rotulo, ok, true);
}

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORTA_APP = 8951, PORTA_AUTH = 8953, PORTA_FS = 8954, PORTA_HUB = 8955, PORTA_LOG = 8956, PORTA_WS = 8957;
const PROJETO = 'demo-nath-carga';
const AUTH = 'http://127.0.0.1:' + PORTA_AUTH;
const FS = 'http://127.0.0.1:' + PORTA_FS;
const FIREBASE = process.env.FIREBASE_TOOLS ||
  'C:/Users/romul/ferramentas/firebase-tools/node_modules/firebase-tools/lib/bin/firebase.js';
const JAVA_HOME = process.env.JAVA_HOME || '';
const DONA = { email: 'dona@exemplo.test', senha: 'senha-da-dona-1' };
const CONTROLE = { email: 'controle@exemplo.test', senha: 'senha-do-controle-1' };

const NOVO = 'https://apoio-educacional.pages.dev/';
const ANTIGO = 'https://romulorod1.github.io/apoio-educacional/';
const LOCAL = 'http://127.0.0.1:' + PORTA_APP + '/';
const PERFIL = path.join(os.tmpdir(), 'nath_carga_inicial_' + process.pid + '_' + Date.now());
const RELOGIO = H.relogioDaRodada('2026-11-16', '11:00');
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm', '.svg': 'image/svg+xml'
};
const NOMES_DE_TESTE = ['Aluno Alfa Teste', 'Aluno Beta Teste', 'Aluno Delta Teste', 'Aluno Gama Teste', 'Aluno Lambda Teste',
  'Aluno Referência Teste', 'Aluno Sigma Teste', 'Aluno Tau Teste', 'Aluno Teta Teste', 'Aluno Upsilon Teste', 'Aluno Xi Teste',
  'Aluno Zeta Teste'];

/* ---------- âncoras e veneno ---------- */
secao('0. As âncoras do veneno e o ambiente');
conf('nenhum --envenenado- desconhecido foi pedido (' + (desconhecidos.join(' ') || 'nenhum') + ')', desconhecidos.length, 0);
const APP = fs.readFileSync(path.join(RAIZ, 'app.js'), 'utf8');
const SINAL = "    return nome === '127.0.0.1' || nome === 'localhost';";
conf('a decisão da carga é a origem local, num lugar só', APP.split(SINAL).length, 2);
conf('a função do sinal existe uma vez', APP.split('function cargaDeExemploPedida()').length, 2);
conf('a carga só é gravada atrás do sinal, no iniciar', /\} else if \(cargaDeExemploPedida\(\)\) \{\r?\n[^\r\n]*\r?\n\s*db = cargaInicial\(\);/.test(APP), true);
conf('cargaInicial() é chamada em dois lugares: o iniciar (atrás do sinal) e o copiaTemConteudo',
  APP.split('cargaInicial()').length - 1 - APP.split('function cargaInicial()').length + 1, 2);
conf('o sinal decide uma vez, no iniciar', APP.split('if (cargaDeExemploPedida())').length - 1, 1);
const APP_SERVIDO = MODO === V_PRODUCAO ? APP.replace(SINAL, '    return true;') : APP;
if (MODO) conf('o app.js servido ficou diferente do repositório (' + MODO + ')', APP_SERVIDO !== APP, true);

conf('o firebase-tools está onde a prova procura (' + FIREBASE + ')', fs.existsSync(FIREBASE), true);
const javaExe = JAVA_HOME ? path.join(JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java';
const versaoJava = (function () {
  const r = spawnSync(javaExe, ['-version'], { encoding: 'utf8' });
  const m = /version "(\d+)/.exec((r.stderr || '') + (r.stdout || ''));
  return m ? Number(m[1]) : 0;
})();
conf('há um JDK 21 ou mais novo (' + (JAVA_HOME || 'java do PATH') + ', versão ' + versaoJava + ')', versaoJava >= 21, true);
if (desconhecidos.length || !fs.existsSync(FIREBASE) || versaoJava < 21) {
  console.log('\n' + placar.passes + ' passaram, ' + placar.falhas + ' falharam.');
  process.exit(1);
}

/* ---------- o que se serve: do disco, com o app.js do modo ---------- */
function doDisco(rel) {
  if (rel === '' || rel === '/') rel = 'index.html';
  rel = rel.replace(/^\/+/, '');
  if (rel === 'app.js') return { tipo: TIPOS['.js'], corpo: Buffer.from(APP_SERVIDO) };
  const arq = path.join(RAIZ, rel);
  if (!arq.startsWith(RAIZ) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) return null;
  return { tipo: TIPOS[path.extname(arq)] || 'application/octet-stream', corpo: fs.readFileSync(arq) };
}
function caminhoInterceptado(url) {
  const u = new URL(url);
  if (u.protocol === 'https:' && u.host === 'romulorod1.github.io' && u.pathname.indexOf('/apoio-educacional/') === 0)
    return u.pathname.slice('/apoio-educacional/'.length);
  if (u.protocol === 'https:' && u.host === 'apoio-educacional.pages.dev') return u.pathname.slice(1);
  return null;
}
const appServidoA = [];
const servidor = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel.replace(/^\/+/, '') === 'app.js') appServidoA.push(req.headers.host);
  const a = doDisco(rel);
  if (!a) { res.writeHead(404); res.end('nao encontrado'); return; }
  res.writeHead(200, { 'Content-Type': a.tipo, 'Cache-Control': 'no-store' });
  res.end(a.corpo);
});
const conexoes = new Set();
servidor.on('connection', s => { conexoes.add(s); s.on('close', () => conexoes.delete(s)); });
function portaOcupada(porta) {
  return new Promise(r => {
    const q = http.get({ host: '127.0.0.1', port: porta, path: '/', timeout: 1500 }, s => { s.resume(); r(true); });
    q.on('timeout', () => { q.destroy(); r(true); });
    q.on('error', () => r(false));
  });
}

/* ---------- o emulador ---------- */
const PASTA = path.join(os.tmpdir(), 'nath_carga_emulador_' + process.pid);
let emulador = null;
function subirEmulador() {
  fs.mkdirSync(PASTA, { recursive: true });
  fs.writeFileSync(path.join(PASTA, 'firestore.rules'), fs.readFileSync(path.join(RAIZ, 'firestore.rules'), 'utf8'));
  fs.writeFileSync(path.join(PASTA, 'firebase.json'), JSON.stringify({
    firestore: { rules: 'firestore.rules' },
    emulators: {
      auth: { host: '127.0.0.1', port: PORTA_AUTH },
      firestore: { host: '127.0.0.1', port: PORTA_FS, websocketPort: PORTA_WS },
      hub: { host: '127.0.0.1', port: PORTA_HUB },
      logging: { host: '127.0.0.1', port: PORTA_LOG },
      ui: { enabled: false },
      singleProjectMode: true
    }
  }, null, 2));
  const env = Object.assign({}, process.env);
  if (JAVA_HOME) env.PATH = path.join(JAVA_HOME, 'bin') + path.delimiter + (env.PATH || env.Path || '');
  emulador = spawn(process.execPath, [FIREBASE, 'emulators:start', '--only', 'auth,firestore', '--project', PROJETO, '--non-interactive'],
    { cwd: PASTA, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let saida = '';
  emulador.stdout.on('data', d => { saida += d; });
  emulador.stderr.on('data', d => { saida += d; });
  emulador.on('exit', c => { emulador.saiu = c; });
  return esperar('o emulador respondeu', async () => {
    if (emulador.saiu !== undefined) throw new Error('o emulador saiu: ' + saida.slice(-600));
    const a = await fetch(AUTH + '/').then(r => r.json()).catch(() => null);
    const f = await fetch(FS + '/').then(r => r.status).catch(() => 0);
    return !!(a && a.authEmulator && a.authEmulator.ready) && f === 200;
  }, v => v === true, 120000).then(r => {
    if (!r.ok) { console.log(saida.slice(-1500)); throw Object.assign(new Error('o emulador não subiu'), { jaContado: false }); }
  });
}
function derrubarEmulador() {
  return new Promise(resolve => {
    if (!emulador || emulador.saiu !== undefined) { resolve(); return; }
    emulador.on('exit', () => resolve());
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(emulador.pid), '/T', '/F'], { stdio: 'ignore' });
    else emulador.kill('SIGINT');
    setTimeout(resolve, 8000);
  }).then(() => { try { fs.rmSync(PASTA, { recursive: true, force: true }); } catch (e) { /* o log pode estar preso */ } });
}
async function rest(url, opcoes) {
  opcoes = opcoes || {};
  const cab = Object.assign({}, opcoes.cab || {});
  let corpo = opcoes.corpo;
  if (corpo !== undefined) { corpo = JSON.stringify(corpo); cab['Content-Type'] = 'application/json'; }
  if (opcoes.token) cab.Authorization = 'Bearer ' + opcoes.token;
  const r = await fetch(url, { method: opcoes.metodo || (corpo !== undefined ? 'POST' : 'GET'), headers: cab, body: corpo });
  const texto = await r.text();
  let json = null;
  try { json = texto ? JSON.parse(texto) : null; } catch (e) { json = null; }
  return { status: r.status, json };
}
const criarUsuario = (u) => rest(AUTH + '/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake',
  { corpo: { email: u.email, password: u.senha, returnSecureToken: true } });

/* A nuvem de uma conta, lida por fora (REST do Node, com o token da conta):
 * todos os registros, classificados. "De exemplo" é o aluno com
 * daCargaInicial e tudo o que pende dele (aula, série, resumo). */
async function nuvemDe(conta) {
  const docs = [];
  let pagina = '';
  for (let i = 0; i < 20; i++) {
    const r = await rest(FS + '/v1/projects/' + PROJETO + '/databases/(default)/documents/usuarios/' + conta.uid +
      '/registros?pageSize=300' + (pagina ? '&pageToken=' + encodeURIComponent(pagina) : ''), { token: conta.token });
    if (r.status !== 200) return { erro: 'leitura ' + r.status };
    (r.json && r.json.documents || []).forEach(d => docs.push(d));
    pagina = r.json && r.json.nextPageToken;
    if (!pagina) break;
  }
  const campo = (d, k) => d.fields && d.fields[k];
  const dados = d => (campo(d, 'dados') && campo(d, 'dados').mapValue && campo(d, 'dados').mapValue.fields) || {};
  const tipos = {};
  const exemplos = {};
  docs.forEach(d => {
    const t = (campo(d, 'tipo') || {}).stringValue || '?';
    tipos[t] = (tipos[t] || 0) + 1;
    const f = dados(d);
    if (t === 'aluno' && f.daCargaInicial && f.daCargaInicial.booleanValue === true) exemplos[(f.id || {}).stringValue] = true;
  });
  let deExemplo = 0;
  const nomes = [];
  docs.forEach(d => {
    const t = (campo(d, 'tipo') || {}).stringValue || '?';
    const f = dados(d);
    if (t === 'aluno' && exemplos[(f.id || {}).stringValue]) { deExemplo++; nomes.push((f.nome || {}).stringValue); }
    else if (f.alunoId && exemplos[f.alunoId.stringValue]) deExemplo++;
  });
  const naoAjuste = docs.filter(d => ((campo(d, 'tipo') || {}).stringValue || '?') !== 'ajuste').length;
  return { total: docs.length, naoAjuste, deExemplo, alunosDeExemplo: Object.keys(exemplos).length, tipos, nomes: nomes.sort() };
}

/* ---------- o navegador ---------- */
let nav = null;
const fora = [];
async function novaPagina(ctx) {
  const pag = await ctx.newPage();
  pag.setDefaultTimeout(60000);
  await pag.setBypassServiceWorker(true);
  pag.errosDePagina = [];
  pag.on('pageerror', e => pag.errosDePagina.push(e.message));
  pag.dialogos = [];
  pag.on('dialog', async d => { pag.dialogos.push(d.message()); try { await d.accept(); } catch (e) { /* ok */ } });
  await RELOGIO.naPagina(pag);
  await pag.evaluateOnNewDocument(cfg => { window.NUVEM_EMULADOR = cfg; }, { auth: AUTH, firestore: FS, projectId: PROJETO });
  // tela de tablet: a automática e a cópia nunca sobem de tela de celular
  await pag.evaluateOnNewDocument(() => {
    Object.defineProperty(Screen.prototype, 'width', { configurable: true, get: () => 1280 });
    Object.defineProperty(Screen.prototype, 'height', { configurable: true, get: () => 800 });
    const original = window.fetch;
    window.fetch = function (url) {
      if (String(url).indexOf('ibge') >= 0) return Promise.reject(new Error('sem rede para o IBGE neste teste'));
      return original.apply(this, arguments);
    };
  });
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
  if (!ok.ok) throw Object.assign(new Error('o aplicativo não abriu em ' + base), { jaContado: false });
  await pausa(1500);
  await pag.evaluate(() => {
    const b = document.querySelector('#entendi-novidades');
    if (b && document.querySelector('#modal-novidades.aberto')) b.click();
  });
}
/* O que está GRAVADO no aparelho, lido por fora do app (o IndexedDB dele). */
const gravado = pag => pag.evaluate(async () => {
  const d = await Store.carregar();
  const fila = await Store.lerFila();
  return {
    existe: !!d,
    alunos: d ? d.alunos.length : 0,
    aulas: d ? d.aulas.length : 0,
    resumos: d ? d.resumos.length : 0,
    series: d ? (d.series || []).length : 0,
    exemplo: d ? d.alunos.filter(a => a.daCargaInicial).length : 0,
    nomes: d ? d.alunos.map(a => a.nome).sort() : [],
    filaNaoAjuste: fila.filter(e => !/^ajuste:/.test(e.id)).length,
    filaAjustes: fila.filter(e => /^ajuste:/.test(e.id)).map(e => e.id),
    fila: fila.length
  };
});
const textoDe = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; }, sel);
const existe = (pag, sel) => pag.evaluate(s => !!document.querySelector(s), sel);
const clicar = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.click(); return true; }, sel);
async function digitar(pag, sel, valor) {
  await pag.evaluate((s, v) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, sel, valor);
}
/* A tela como ela a vê com o banco vazio: agenda, alunos e fechamento. */
async function telaVazia(pag) {
  const agenda = { mes: await textoDe(pag, '#rotulo-mes'), aulas: await pag.evaluate(() => document.querySelectorAll('.pilula').length) };
  await H.irParaAba(pag, 'alunos');
  const alunos = await pag.evaluate(() => Array.from(document.querySelectorAll('#lista-alunos .vazio p')).map(p => p.textContent.trim()).join(' / '));
  await H.irParaAba(pag, 'fechamento');
  const fech = await pag.evaluate(() => { const e = document.querySelector('#tela-fechamento .vazio'); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; });
  await H.irParaAba(pag, 'agenda');
  return { agenda, alunos, fech };
}
async function entrarPelaTela(pag, conta) {
  await H.irParaAba(pag, 'ajustes');
  const form = await esperar('o cartão da nuvem pede e-mail e senha', () => existe(pag, '#nuvem-entrar'), v => v === true, 10000);
  if (!form.ok) return false;
  await digitar(pag, '#nuvem-email', conta.email);
  await digitar(pag, '#nuvem-senha', conta.senha);
  await clicar(pag, '#nuvem-entrar');
  return (await esperar('entrou e o cartão mostra os botões', () => existe(pag, '#nuvem-enviar'), v => v === true, 15000)).ok;
}
/* Ligar a nuvem como na migração: entrar, enviar a cópia pelo botão, reabrir
 * (a abertura sobe a fila) e sincronizar até a fila esvaziar. */
async function ligarNuvem(pag, base, conta) {
  conf('entrou na conta pela tela (' + base + ')', await entrarPelaTela(pag, conta), true);
  await clicar(pag, '#nuvem-enviar');
  const copia = await esperar('a cópia foi enviada', () => pag.evaluate(() => !!(Nuvem.estado().ultimaCopia)), v => v === true, 30000);
  conf('a cópia subiu pelo botão Enviar', copia.ok, true);
  await abrir(pag, base);
  const sinc = await pag.evaluate(() => Nuvem.sincronizar({ versaoApp: 'prova' }).then(r => ({
    enviados: r.enviados.enviados, erro: r.enviados.erro ? r.enviados.erro.codigo : null }), e => ({ erro: String(e && e.message) })));
  console.log('   sincronização: ' + JSON.stringify(sinc));
  const vazia = await esperar('a fila esvaziou', () => pag.evaluate(() => Store.lerFila().then(l => l.length)), v => v === 0, 30000);
  conf('a fila do aparelho esvaziou (tudo o que havia subiu)', vazia.ok, true);
}
/* A cópia atual da conta, baixada e aberta pelo próprio app: dados.json. */
const copiaAberta = pag => pag.evaluate(async () => {
  const lista = await Nuvem.listarCopias();
  const atual = lista.filter(c => c.papel === 'atual')[0];
  if (!atual) return { erro: 'sem cópia' };
  const blob = await Nuvem.baixarCopia(null, atual.id);
  const zip = Zip.ler(new Uint8Array(await blob.arrayBuffer()));
  const ent = zip.entradas.filter(e => e.nome === 'dados.json')[0];
  const d = JSON.parse(new TextDecoder().decode(await Zip.extrair(zip, ent)));
  return { conteudo: atual.conteudo, alunos: (d.alunos || []).length, aulas: (d.aulas || []).length,
    exemplo: (d.alunos || []).filter(a => a.daCargaInicial).length };
});

(async function () {
  let erro = null;
  try {
    if (await portaOcupada(PORTA_APP)) {
      conf('a porta ' + PORTA_APP + ' está livre', 'ocupada', 'livre');
      throw Object.assign(new Error('porta ocupada'), { jaContado: true });
    }
    await new Promise((r, j) => { servidor.once('error', j); servidor.listen(PORTA_APP, '127.0.0.1', r); });
    secao('0b. O emulador sobe e as contas existem');
    await subirEmulador();
    for (const c of [DONA, CONTROLE]) {
      const r = (await criarUsuario(c)).json;
      c.uid = r && r.localId; c.token = r && r.idToken;
    }
    conf('as duas contas do emulador foram criadas', !!(DONA.uid && CONTROLE.uid), true);
    nav = await puppeteer.launch({
      executablePath: CHROME, headless: true, userDataDir: PERFIL,
      args: ['--no-sandbox', '--disable-dev-shm-usage',
        // nada sai para a internet: todo nome que não é local cai em "não encontrado"
        '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost',
        // a página de origem pública fala com o emulador em 127.0.0.1, como fala com o Firebase
        '--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessSendPreflights,PrivateNetworkAccessRespectPreflightResults,BlockInsecurePrivateNetworkRequests'],
      defaultViewport: { width: 1280, height: 1000, hasTouch: true }
    });

    // ------------------------------------------------------------------
    secao('1. Sem o sinal (produção): o banco vazio abre vazio');
    for (const base of [NOVO, ANTIGO]) {
      const ctx = await nav.createBrowserContext();
      const pag = await novaPagina(ctx);
      await abrir(pag, base);
      conf('a página roda com a origem de produção (' + base + ')', await pag.evaluate(() => location.origin), new URL(base).origin);
      const g = await gravado(pag);
      console.log('   gravado em ' + base + ': ' + JSON.stringify(g));
      prop('sem o sinal, em ' + base + ': zero alunos e zero aulas gravados (' + g.alunos + ' e ' + g.aulas + ')',
        g.alunos === 0 && g.aulas === 0 && g.resumos === 0 && g.series === 0, V_PRODUCAO);
      prop('sem o sinal, em ' + base + ': nada de aluno, aula ou resumo na fila da nuvem (' + g.filaNaoAjuste + ')', g.filaNaoAjuste === 0, V_PRODUCAO);
      if (base === NOVO) {
        const t = await telaVazia(pag);
        console.log('   a tela vazia: ' + JSON.stringify(t));
        prop('a lista de alunos mostra o estado vazio de sempre ("' + t.alunos + '")',
          t.alunos === 'Nenhum aluno cadastrado ainda. / Comece cadastrando um aluno e o valor da hora-aula.', V_PRODUCAO);
        prop('a agenda abre no mês de hoje, sem aula (' + t.agenda.mes + ', ' + t.agenda.aulas + ' aulas)',
          t.agenda.mes === 'Novembro de 2026' && t.agenda.aulas === 0, V_PRODUCAO);
      }
      conf('sem erro de página em ' + base, pag.errosDePagina.join(' | '), '');
      await ctx.close();
    }

    // ------------------------------------------------------------------
    secao('2. Com o sinal (127.0.0.1): a carga entra, e o controle positivo da nuvem');
    {
      const ctx = await nav.createBrowserContext();
      const pag = await novaPagina(ctx);
      await abrir(pag, LOCAL);
      conf('127.0.0.1 recebeu o app.js do servidor desta prova', appServidoA.indexOf('127.0.0.1:' + PORTA_APP) >= 0, true);
      const g = await gravado(pag);
      console.log('   gravado em 127.0.0.1: ' + JSON.stringify({ alunos: g.alunos, aulas: g.aulas, resumos: g.resumos, series: g.series, fila: g.fila }));
      conf('com o sinal: os doze alunos de exemplo gravados', g.alunos + ' ' + g.exemplo, '12 12');
      conf('com o sinal: os nomes são os doze de teste', g.nomes.join(', '), NOMES_DE_TESTE.join(', '));
      conf('com o sinal: as 10 aulas e o resumo do junho de referência', g.aulas + ' ' + g.resumos, '10 1');
      const ref = await pag.evaluate(() => Store.carregar().then(d => {
        const a = d.alunos.filter(x => x.nome === 'Aluno Referência Teste')[0];
        const f = Core.calcularMesInteiro(d, '2026-06').filter(x => x.aluno.id === a.id)[0];
        return f ? { linhas: f.linhas.length, horas: Core.fmtHoras(f.totalMin), total: Core.fmtMoeda(f.totalValor) } : null;
      }));
      conf('o junho de referência: 10 encontros, 10:30, R$ 1.050,00', JSON.stringify(ref),
        JSON.stringify({ linhas: 10, horas: '10:30', total: 'R$ 1.050,00' }));
      const cartao = await pag.evaluate(() => {
        const c = Array.from(document.querySelectorAll('#lista-fechamento .cartao')).find(x => /Aluno Referência Teste/.test((x.querySelector('h3') || {}).textContent || ''));
        const t = c && c.querySelector('tr.total');
        return t ? Array.from(t.querySelectorAll('td')).map(x => x.textContent).join('|') : null;
      });
      conf('o fechamento de junho na tela: Total, 10:30 h, R$ 1.050,00', cartao, 'Total||10:30 h||R$ 1.050,00');
      conf('abre no mês do exemplo (a abertura no mês da carga)', await textoDe(pag, '#rotulo-mes'), 'Junho de 2026');

      // controle positivo: a carga, numa conta, sobe por registro e o instrumento a conta
      await ligarNuvem(pag, LOCAL, CONTROLE);
      const n = await nuvemDe(CONTROLE);
      console.log('   nuvem do controle: ' + JSON.stringify(n));
      conf('CONTROLE POSITIVO: a carga ligada à nuvem sobe, e o instrumento vê os 12 alunos de exemplo', n.alunosDeExemplo, 12);
      conf('CONTROLE POSITIVO: e as 10 aulas, a série e o resumo deles (' + n.deExemplo + ' registros de exemplo)', n.deExemplo >= 24, true);
      const c = await copiaAberta(pag);
      console.log('   cópia do controle: ' + JSON.stringify(c));
      conf('a cópia da carga intocada sobe marcada SEM conteúdo (o copiaTemConteudo compara com a carga)', c.conteudo, false);
      conf('e a cópia aberta tem os 12 de exemplo (o instrumento da cópia vê)', c.exemplo, 12);

      // o "Apagar a carga inicial" tira os doze
      await H.irParaAba(pag, 'ajustes');
      await clicar(pag, '#apagar-exemplo');
      const apagou = await esperar('a carga inicial saiu', () => gravado(pag), v => v.exemplo === 0, 15000);
      conf('o "Apagar a carga inicial" tira os doze e as aulas deles', apagou.ok && apagou.valor.alunos === 0 && apagou.valor.aulas === 0, true);
      conf('sem erro de página em 127.0.0.1', pag.errosDePagina.join(' | '), '');
      await ctx.close();
    }

    // ------------------------------------------------------------------
    secao('3. Em produção, depois do "Apagar tudo" e de reabrir: zero, sem a carga');
    {
      const ctx = await nav.createBrowserContext();
      const pag = await novaPagina(ctx);
      await abrir(pag, NOVO);
      await pag.evaluate(() => Store.carregar().then(d => {
        d = d || Store.bancoVazio();
        d.alunos.push({ id: 'prova-apagar', nome: 'Aluno Apagar Teste', ativo: true, precos: [] });
        return Store.salvar(d);
      }));
      await abrir(pag, NOVO);
      const antes = await gravado(pag);
      conf('(arranjo) antes do "Apagar tudo" há um aluno dela', antes.nomes.indexOf('Aluno Apagar Teste') >= 0, true);
      await H.irParaAba(pag, 'ajustes');
      await clicar(pag, '#apagar-tudo');
      const vazio = await esperar('o "Apagar tudo" terminou', () => gravado(pag), v => v.alunos === 0, 15000);
      conf('o "Apagar tudo" apagou (controle: o aluno dela saiu)', vazio.ok, true);
      await abrir(pag, NOVO);
      const g = await gravado(pag);
      console.log('   depois do "Apagar tudo" e de reabrir: ' + JSON.stringify(g));
      prop('depois do "Apagar tudo" e de reabrir: zero alunos e zero aulas (' + g.alunos + ' e ' + g.aulas + ')',
        g.alunos === 0 && g.aulas === 0 && g.exemplo === 0, V_PRODUCAO);
      conf('sem erro de página', pag.errosDePagina.join(' | '), '');
      await ctx.close();
    }

    // ------------------------------------------------------------------
    secao('4. O aparelho novo: abre em produção, entra na conta e liga a nuvem');
    {
      const ctx = await nav.createBrowserContext();
      const pag = await novaPagina(ctx);
      await abrir(pag, NOVO);
      const g = await gravado(pag);
      console.log('   antes de entrar: ' + JSON.stringify({ alunos: g.alunos, aulas: g.aulas, fila: g.fila }));
      await ligarNuvem(pag, NOVO, DONA);
      const n = await nuvemDe(DONA);
      console.log('   nuvem da dona: ' + JSON.stringify(n));
      conf('a nuvem da dona foi lida', !n.erro, true);
      prop('ZERO registros de exemplo subiram para a nuvem (' + n.deExemplo + ' de exemplo, ' + n.alunosDeExemplo + ' alunos)',
        n.deExemplo === 0 && n.alunosDeExemplo === 0, V_PRODUCAO);
      prop('nenhum aluno, aula, série ou resumo na nuvem (' + n.naoAjuste + ' fora dos ajustes, de ' + n.total + ')', n.naoAjuste === 0, V_PRODUCAO);
      const c = await copiaAberta(pag);
      console.log('   cópia da dona: ' + JSON.stringify(c));
      prop('a cópia enviada não tem aluno nenhum (' + c.alunos + ')', c.alunos === 0 && c.exemplo === 0, V_PRODUCAO);
      conf('a cópia do banco vazio sobe marcada SEM conteúdo', c.conteudo, false);
      conf('sem erro de página', pag.errosDePagina.join(' | '), '');
      await ctx.close();
    }

    const reais = fora.filter(u => !/ibge/.test(u));
    conf('nenhum pedido tentou sair para a internet', reais.slice(0, 3).join(' '), '');
  } catch (e) {
    erro = e;
    console.error('erro:', e.message);
    if (!e.jaContado) { console.error(e.stack); placar.falhas++; }
  }
  if (nav) { try { await nav.close(); } catch (e) { /* já fechou */ } }
  conexoes.forEach(s => s.destroy());
  await new Promise(r => servidor.close(() => r()));
  await derrubarEmulador();
  try { fs.rmSync(PERFIL, { recursive: true, force: true }); } catch (e) { /* já saiu */ }
  console.log('\n' + placar.passes + ' passaram, ' + placar.falhas + ' falharam.');
  process.exit(placar.falhas || erro ? 1 : 0);
})();
