/* testa_celular_pacotes.js
 *
 * 12b, parte A1: o celular DA DONA traz os pacotes de exercícios da nuvem,
 * sozinho, só no Wi-Fi e com espaço, pela mesma série do Atualizar a
 * biblioteca do #233 (trazerPacotesDaNuvem), e grava pela porta nova
 * 'biblioteca' do store.js, que só aceita os quatro depósitos do pacote.
 * Nenhuma tela muda.
 *
 * De ponta a ponta, no Chrome de verdade e nos EMULADORES do Auth, do
 * Firestore e do Storage (nunca a produção), com as regras do repositório
 * (storage.rules e firestore.rules), contas SINTÉTICAS do emulador e pacotes
 * SINTÉTICOS (_pacote_sintetico.js). O catálogo e os zips entram pela porta
 * de administrador do emulador ("Bearer owner"), como o publicador do dono.
 * Um tablet (1280 px) da dona, o celular dela (390 x 844) e um observador de
 * outra conta (390 x 844). A conexão do celular é simulada no
 * navigator.connection (o type, que o Chrome do Android dá) e o espaço no
 * navigator.storage.estimate.
 *
 * O que se prova:
 *   1. o tablet traz os três pacotes pelo Atualizar a biblioteca (a régua);
 *   2. o celular da dona traz a cópia e fica com a marca; a porta da
 *      biblioteca aceita só os quatro depósitos do pacote, e nunca `dados`,
 *      `biblioteca_listas`, `midias` nem a mistura; o que o celular recusava
 *      continua recusado (listas, mídias, etiquetas, uso, remover pacote);
 *   3. nos dados móveis, com o tipo desconhecido, sem navigator.connection,
 *      sem internet e sem espaço: nada baixa (nenhum pedido ao Storage);
 *   4. o observador de outra conta, no Wi-Fi: nem lê o catálogo, nada baixa,
 *      e a porta fica fechada para ele;
 *  4b. o Wi-Fi que cai NO MEIO de uma baixa (a conexão vira cellular) a
 *      corta: o pedido é abortado, nada é gravado e a série para;
 *   5. no Wi-Fi com espaço: os três pacotes chegam, iguais aos do tablet, uma
 *      série só (cada zip baixa uma vez, mesmo com a conexão mudando de novo
 *      no meio); cada gravação do pacote é uma transação só com os quatro
 *      depósitos; `dados`, `biblioteca_listas` e `midias` (a imagem da folha,
 *      que veio na cópia) ficam idênticos, e nenhuma transação de escrita os
 *      toca durante a série;
 *   6. a conexão que muda de novo, várias vezes, com tudo em dia: nem o
 *      catálogo é relido (o intervalo de dez minutos), e nada baixa;
 *      um pacote de livros marcado no catálogo nem baixa nem entra na conta
 *      do espaço (o tamanho dele, enorme, não barra os outros);
 *   7. a escrita escondida: com os pacotes no celular, a cópia nova do tablet
 *      chega ao abrir e a Biblioteca se refaz por baixo (esquecerMinhasListas);
 *      o espelho das seleções anteriores (espelharAnteriores) NÃO chama
 *      gravarListaBiblioteca no celular;
 *   8. depois de tudo, as recusas de sempre continuam, e nenhum erro de página.
 *
 * Venenos (a prova TEM de ver o defeito e passa dizendo que viu):
 *   --envenenado-porta-aceita-dados  a porta da biblioteca aceita `dados` e
 *                                 `biblioteca_listas` (2 vê);
 *   --envenenado-porta-sem-conferir-lista  a trava (transacao) deixa de
 *                                 conferir a lista da porta 'biblioteca', que
 *                                 abriria para qualquer depósito (2 vê, pela
 *                                 sonda que abre pela própria trava);
 *   --envenenado-continua-sem-wifi  o Wi-Fi que cai no meio não corta a baixa:
 *                                 o pacote chega pelos dados móveis (4b vê);
 *   --envenenado-baixa-sem-wifi   a conferência do Wi-Fi diz sempre que sim:
 *                                 nos dados móveis, baixa (3 vê);
 *   --envenenado-observador-baixa a porta do app deixa de conferir que é o
 *                                 celular da dona: o observador lê o catálogo
 *                                 e baixa (4 vê);
 *   --envenenado-celular-grava-lista  sem a guarda do espelho: o celular chama
 *                                 gravarListaBiblioteca (7 vê).
 *
 * Precisa do firebase-tools (FIREBASE_TOOLS) e de um JDK 21 em JAVA_HOME.
 * Portas: 9121 (app), 9122 (auth), 9123 (storage), 9124 (firestore), 9125
 * (hub), 9126 (log), 9127 (websocket), 9128 (o repasse do Storage, que conta
 * os bytes e deixa um zip devagar).
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, esperar, pausa } = H;

const PORTA_APP = 9121, PORTA_AUTH = 9122, PORTA_ST = 9123, PORTA_FS = 9124, PORTA_HUB = 9125, PORTA_LOG = 9126, PORTA_WS = 9127,
  PORTA_REPASSE = 9128;
const PROJETO = 'demo-nath-celular-pacotes';
const BUCKET = PROJETO + '.appspot.com';
const AUTH = 'http://127.0.0.1:' + PORTA_AUTH;
const FS = 'http://127.0.0.1:' + PORTA_FS;
const ST = 'http://127.0.0.1:' + PORTA_ST;
const REPASSE = 'http://127.0.0.1:' + PORTA_REPASSE;
const DOCS = FS + '/v1/projects/' + PROJETO + '/databases/(default)/documents';
const FIREBASE = process.env.FIREBASE_TOOLS ||
  'C:/Users/romul/ferramentas/firebase-tools/node_modules/firebase-tools/lib/bin/firebase.js';
const JAVA_HOME = process.env.JAVA_HOME || '';
const CFG = { auth: AUTH, firestore: FS, projectId: PROJETO, storage: REPASSE, bucket: BUCKET };
const DONA = { email: 'dona@exemplo.test', senha: 'senha-da-dona-1' };
const OBS = { email: 'observador@exemplo.test', senha: 'senha-do-observador-1' };

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const STORE = fs.readFileSync(path.join(H.RAIZ, 'store.js'), 'utf8').replace(/\r\n/g, '\n');
const VENENOS = {
  '--envenenado-porta-aceita-dados': ['/store.js',
    "var DEPOSITOS_DA_PORTA_BIBLIOTECA = ['biblioteca_pacotes', 'biblioteca_itens', 'biblioteca_teoria', 'biblioteca_assets'];",
    "var DEPOSITOS_DA_PORTA_BIBLIOTECA = ['biblioteca_pacotes', 'biblioteca_itens', 'biblioteca_teoria', 'biblioteca_assets', 'dados', 'biblioteca_listas'];"],
  '--envenenado-porta-sem-conferir-lista': ['/store.js',
    "    if (modo === 'readwrite' && soLeitura && porta === 'biblioteca' && !portaDaBibliotecaAceita(nomes)) throw erroSoLeitura();\n", ''],
  '--envenenado-continua-sem-wifi': ['/app.js',
    'if (controleDaBaixaDoCelular && !celularNoWifi()) controleDaBaixaDoCelular.abort();', ''],
  '--envenenado-baixa-sem-wifi': ['/app.js',
    "return !!c && c.saveData !== true && (c.type === 'wifi' || c.type === 'ethernet');", 'return true;'],
  '--envenenado-observador-baixa': ['/app.js',
    "return celularEdita() && !Nuvem.estado().observador && typeof Nuvem.baixarPacoteDaNuvem === 'function';",
    "return modoCelular && temNuvem() && !!Nuvem.estado().entrada && typeof Nuvem.baixarPacoteDaNuvem === 'function';"],
  '--envenenado-celular-grava-lista': ['/app.js',
    'if (aparelhoSoLe()) return null;   // 12b A1: o celular só lê as listas, e o espelho grava; nada aqui', '']
};
const MODO = Object.keys(VENENOS).filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && !VENENOS[a]);
const trocas = {};
if (MODO) {
  const [arq, de, para] = VENENOS[MODO];
  trocas[arq] = (arq === '/store.js' ? STORE : APP).split(de).join(para);
}
const amb = H.criarAmbiente(PORTA_APP, 'nath_celular_pacotes', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'celular_pacotes_'));

/* ---------- os pacotes sintéticos ---------- */
const hex = b => crypto.createHash('sha256').update(b).digest('hex');
const ZIP = {
  m1: Sintetico.gerarProva(null, { serie: 'm1', versao: 1 }).zip,
  m2: Sintetico.gerarProva(null, { serie: 'm2', versao: 1 }).zip,
  sond: Sintetico.gerarSondagem(null, { versao: 1 }).zip,
  banco: Sintetico.gerarBanco(null, { versao: 1 }).zip
};
const SHA = {};
Object.keys(ZIP).forEach(k => { SHA[k] = hex(ZIP[k]); });
const CATALOGO_DONA = { 'matematica-sintetico-mirim-m1': 'm1', 'matematica-sintetico-mirim-m2': 'm2', 'matematica-sintetico-sondagem-9ano': 'sond' };
// o observador também tem um catálogo na conta DELE: o veneno que o deixa baixar tem o que baixar
const CATALOGO_OBS = { 'matematica-sintetico-banco-n2': 'banco' };
const caminho = (uid, sha) => 'usuarios/' + uid + '/pacotes/' + sha + '.zip';

/* ---------- o emulador ---------- */
const PASTA = path.join(TMP, 'emulador');
let emulador = null;
function subirEmulador() {
  fs.mkdirSync(PASTA, { recursive: true });
  fs.writeFileSync(path.join(PASTA, 'storage.rules'), fs.readFileSync(path.join(H.RAIZ, 'storage.rules'), 'utf8'));
  fs.writeFileSync(path.join(PASTA, 'firestore.rules'), fs.readFileSync(path.join(H.RAIZ, 'firestore.rules'), 'utf8'));
  fs.writeFileSync(path.join(PASTA, 'firebase.json'), JSON.stringify({
    firestore: { rules: 'firestore.rules' },
    storage: { rules: 'storage.rules' },
    emulators: { auth: { host: '127.0.0.1', port: PORTA_AUTH }, firestore: { host: '127.0.0.1', port: PORTA_FS, websocketPort: PORTA_WS },
      storage: { host: '127.0.0.1', port: PORTA_ST },
      hub: { host: '127.0.0.1', port: PORTA_HUB }, logging: { host: '127.0.0.1', port: PORTA_LOG }, ui: { enabled: false }, singleProjectMode: true }
  }));
  const env = Object.assign({}, process.env);
  if (JAVA_HOME) env.PATH = path.join(JAVA_HOME, 'bin') + path.delimiter + (env.PATH || env.Path || '');
  emulador = spawn(process.execPath, [FIREBASE, 'emulators:start', '--only', 'auth,firestore,storage', '--project', PROJETO, '--non-interactive'],
    { cwd: PASTA, env, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' });
  let saida = '';
  emulador.stdout.on('data', d => { saida += d; });
  emulador.stderr.on('data', d => { saida += d; });
  emulador.on('exit', c => { emulador.saiu = c; });
  return esperar('o emulador respondeu', async () => {
    if (emulador.saiu !== undefined) throw new Error('o emulador saiu: ' + saida.slice(-600));
    const a = await fetch(AUTH + '/').then(r => r.json()).catch(() => null);
    const f = await fetch(FS + '/').then(r => r.status).catch(() => 0);
    const s = await fetch(ST + '/').then(r => r.status).catch(() => 0);
    return !!(a && a.authEmulator && a.authEmulator.ready) && f === 200 && s > 0 && /All emulators ready/i.test(saida);
  }, v => v === true, 180000);
}
async function portasLivres() {
  for (const u of [AUTH, FS, ST, REPASSE, 'http://127.0.0.1:' + PORTA_APP]) if (await fetch(u + '/').then(r => r.status).catch(() => 0)) return false;
  return true;
}
function matarGrupo(sinal) {
  try { process.kill(-emulador.pid, sinal); } catch (e) { /* já saiu */ }
}
function derrubarEmulador() {
  return new Promise(resolve => {
    if (!emulador || emulador.saiu !== undefined) { resolve(); return; }
    emulador.on('exit', () => resolve());
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(emulador.pid), '/T', '/F'], { stdio: 'ignore' });
    else matarGrupo('SIGINT');
    setTimeout(() => { if (process.platform !== 'win32') matarGrupo('SIGKILL'); resolve(); }, 8000);
  });
}
/* ---------- o repasse do Storage: conta os bytes e deixa um zip devagar ---------- */
const http = require('http');
const repasse = { lentoSha: null, enviados: {}, cortados: [], completos: [] };
const servidorRepasse = http.createServer((req, res) => {
  const cab = Object.assign({}, req.headers, { host: '127.0.0.1:' + PORTA_ST });
  const ida = http.request({ host: '127.0.0.1', port: PORTA_ST, method: req.method, path: req.url, headers: cab }, volta => {
    if (req.method === 'OPTIONS' || !/[?&]alt=media/.test(req.url) || volta.statusCode !== 200) {
      res.writeHead(volta.statusCode, volta.headers);
      volta.pipe(res);
      return;
    }
    const sha = (/([0-9a-f]{64})\.zip/.exec(decodeURIComponent(req.url)) || [])[1] || '?';
    const partes = [];
    volta.on('data', p => partes.push(p));
    volta.on('end', async () => {
      const corpo = Buffer.concat(partes);
      const cabV = Object.assign({}, volta.headers, { 'content-length': String(corpo.length) });
      delete cabV['transfer-encoding'];
      res.writeHead(200, cabV);
      let caiu = false;
      res.on('close', () => { if (!res.writableFinished) caiu = true; });
      const devagar = repasse.lentoSha === sha;
      for (let i = 0; i < corpo.length; i += 512) {
        if (caiu) { repasse.cortados.push(sha); return; }
        res.write(corpo.subarray(i, Math.min(corpo.length, i + 512)));
        repasse.enviados[sha] = (repasse.enviados[sha] || 0) + Math.min(512, corpo.length - i);
        if (devagar) await pausa(400);
      }
      if (caiu) { repasse.cortados.push(sha); return; }
      res.end();
      repasse.completos.push(sha);
    });
  });
  ida.on('error', () => { try { res.socket.destroy(); } catch (e) { /* já caiu */ } });
  req.pipe(ida);
});
const fim = () => derrubarEmulador().then(() => new Promise(r => servidorRepasse.close(() => r()))).then(() => H.fim(amb)());

/* ---------- a nuvem de teste ---------- */
const criarConta = (u) => fetch(AUTH + '/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake', { method: 'POST',
  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: u.email, password: u.senha, returnSecureToken: true }) }).then(r => r.json());
function valor(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(valor) } };
  const fields = {};
  Object.keys(v).forEach(k => { fields[k] = valor(v[k]); });
  return { mapValue: { fields } };
}
const gravarDoc = (rel, o) => fetch(DOCS + '/' + rel, { method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
  body: JSON.stringify({ fields: valor(o).mapValue.fields }) }).then(r => r.status);
const subirArquivo = (cam, bytes) => fetch(ST + '/upload/storage/v1/b/' + BUCKET + '/o?uploadType=media&name=' + encodeURIComponent(cam),
  { method: 'POST', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/zip' }, body: bytes }).then(r => r.status);
const SHA_LIVROS_MARCADO = hex(Buffer.from('um pacote de livros que nunca sobe'));
async function publicar(uid, qual, comLivros) {
  const pacotes = {}, status = [];
  for (const nome of Object.keys(qual)) {
    const k = qual[nome];
    pacotes[nome] = { versao: 1, sha256: SHA[k], tamanho: ZIP[k].length, caminhoNuvem: caminho(uid, SHA[k]), publicadoEm: '2026-11-15T10:00:00-03:00' };
    status.push(await subirArquivo(caminho(uid, SHA[k]), ZIP[k]));
  }
  if (comLivros) {
    // o catálogo que já diz que é de livros, com um tamanho que nenhum aparelho tem livre: nem baixa, nem conta no espaço
    pacotes['livros-sintetico-marcado'] = { versao: 1, sha256: SHA_LIVROS_MARCADO, tamanho: 500 * 1024 * 1024 * 1024, conteudo: 'livros',
      caminhoNuvem: caminho(uid, SHA_LIVROS_MARCADO), publicadoEm: '2026-11-15T10:00:00-03:00' };
  }
  status.push(await gravarDoc('usuarios/' + uid + '/config/catalogo', { versao: 1, publicadoEm: '2026-11-15T10:00:00-03:00', livros: {}, pacotes }));
  return status;
}

/* ---------- as páginas ---------- */
/* movel: 390 x 844, com a marca de toque. rede: o type inicial da conexão
 * simulada (undefined = desconhecido). O que a página guarda em localStorage
 * (__rede) vale para as recargas: o type, a falta de navigator.connection e a
 * quota de espaço. */
async function prepararPagina(pag, movel, rede) {
  pag.setDefaultTimeout(60000);
  if (movel) await pag.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  else await pag.setViewport({ width: 1280, height: 800 });
  pag.errosDePagina = [];
  pag.on('pageerror', e => pag.errosDePagina.push(e.message));
  pag.on('dialog', async d => { try { await d.accept(); } catch (e) { /* ok */ } });
  // os pedidos que saem: ao Storage (os zips) e a leitura do catálogo
  pag.pedidosStorage = [];
  pag.leiturasCatalogo = 0;
  pag.on('request', r => {
    const u = r.url();
    if (r.method() === 'OPTIONS') return;
    if (u.indexOf(REPASSE) === 0) pag.pedidosStorage.push(u);
    if (u.indexOf(FS) === 0 && /config(\/|%2F)catalogo/.test(u)) pag.leiturasCatalogo++;
  });
  await pag.evaluateOnNewDocument(cfg => { window.NUVEM_EMULADOR = cfg; }, CFG);
  if (!movel) {
    await pag.evaluateOnNewDocument(() => {
      Object.defineProperty(Screen.prototype, 'width', { configurable: true, get: () => 1280 });
      Object.defineProperty(Screen.prototype, 'height', { configurable: true, get: () => 800 });
    });
  }
  await pag.evaluateOnNewDocument(inicial => {
    const original = window.fetch;
    window.fetch = function (url) {
      if (String(url).indexOf('ibge') >= 0) return Promise.reject(new Error('sem rede para o IBGE neste teste'));
      return original.apply(this, arguments);
    };
    const ler = () => { try { return JSON.parse(localStorage.getItem('__rede') || 'null'); } catch (e) { return null; } };
    let r = ler();
    if (!r) { r = { tipo: inicial }; try { localStorage.setItem('__rede', JSON.stringify(r)); } catch (e) { /* ok */ } }
    const guardar = mudar => { const x = ler() || {}; mudar(x); localStorage.setItem('__rede', JSON.stringify(x)); };
    if (r.semConexao) {
      Object.defineProperty(Navigator.prototype, 'connection', { configurable: true, get: () => undefined });
    } else {
      const con = new EventTarget();
      window.__tipoRede = r.tipo;
      Object.defineProperty(con, 'type', { get: () => window.__tipoRede });
      Object.defineProperty(con, 'effectiveType', { get: () => '4g' });   // a velocidade: não diz se é Wi-Fi
      Object.defineProperty(con, 'saveData', { get: () => false });
      Object.defineProperty(Navigator.prototype, 'connection', { configurable: true, get: () => con });
      window.__mudarRede = t => { window.__tipoRede = t; guardar(x => { x.tipo = t; }); con.dispatchEvent(new Event('change')); };
    }
    window.__quota = q => guardar(x => { x.quota = q; });
    window.__semConexao = v => guardar(x => { x.semConexao = v; });
    if (navigator.storage && navigator.storage.estimate) {
      const e0 = navigator.storage.estimate.bind(navigator.storage);
      navigator.storage.estimate = () => { const x = ler() || {}; return x.quota ? Promise.resolve({ quota: x.quota, usage: 0 }) : e0(); };
    }
    // as transações de escrita no banco do app, com os depósitos de cada uma
    window.__transacoes = [];
    const t0 = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (nomes, modo) {
      if (modo === 'readwrite' && this.name === 'apoio-educacional') window.__transacoes.push([].concat(nomes).map(String).sort().join('+'));
      return t0.apply(this, arguments);
    };
    // quem chama a gravação das listas dela (o espelho das seleções anteriores grava por aqui)
    window.__listasChamadas = 0;
    let store;
    Object.defineProperty(window, 'Store', {
      configurable: true,
      get() { return store; },
      set(v) {
        if (v && typeof v.gravarListaBiblioteca === 'function' && !v.__embrulhado) {
          const g = v.gravarListaBiblioteca, a = v.apagarListaBiblioteca;
          v.gravarListaBiblioteca = function () { window.__listasChamadas++; return g.apply(this, arguments); };
          v.apagarListaBiblioteca = function () { window.__listasChamadas++; return a.apply(this, arguments); };
          v.__embrulhado = true;
        }
        store = v;
      }
    });
  }, rede === undefined ? null : rede);
}
const clicar = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.click(); return true; }, sel);
const existe = (pag, sel) => pag.evaluate(s => !!document.querySelector(s), sel);
const texto = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent : null; }, sel);
async function digitar(pag, sel, v) {
  return pag.evaluate((s, x) => {
    const e = document.querySelector(s);
    if (!e) return false;
    e.value = x;
    e.dispatchEvent(new Event('input', { bubbles: true }));
    e.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }, sel, v);
}
async function abrirCelular(pag) {
  await pag.goto(amb.ORIGEM + '/index.html', { waitUntil: 'networkidle0' });
  const ok = await esperar('o aplicativo abriu', () => pag.evaluate(() =>
    typeof Store === 'object' && !!document.querySelector('#versao-app') && document.querySelector('#versao-app').textContent.length > 1),
  v => v === true, 40000);
  if (!ok.ok) throw Object.assign(new Error('o aplicativo não abriu'), { jaContado: false });
  await pausa(1200);
}
async function entrarPelaTela(pag, u) {
  await H.irParaAba(pag, 'ajustes');
  await esperar('o cartão da nuvem pede e-mail e senha', () => existe(pag, '#nuvem-entrar'), v => v === true, 10000);
  await digitar(pag, '#nuvem-email', u.email);
  await digitar(pag, '#nuvem-senha', u.senha);
  await clicar(pag, '#nuvem-entrar');
  return (await esperar('entrou na nuvem', () => existe(pag, '#nuvem-enviar'), v => v === true, 20000)).ok;
}
async function entrarNoCelular(pag, u) {
  await esperar('a tela do celular pede a conta', () => existe(pag, '#cel-conta #nuvem-entrar'), v => v === true, 15000);
  await digitar(pag, '#cel-conta #nuvem-email', u.email);
  await digitar(pag, '#cel-conta #nuvem-senha', u.senha);
  await clicar(pag, '#cel-conta #nuvem-entrar');
  return (await esperar('o botão de trazer a cópia', () => existe(pag, '#cel-trazer'), v => v === true, 15000)).ok;
}
async function trazerCopiaNoCelular(pag, codigoDona) {
  await clicar(pag, '#cel-trazer');
  if (codigoDona) {
    await esperar('a janela de restaurar abriu', () => existe(pag, '#modal-nuvem-restaurar.aberto #nuvem-conta-dona'), v => v === true, 10000);
    await digitar(pag, '#nuvem-conta-dona', codigoDona);
    await clicar(pag, '#nuvem-conta-dona-buscar');
  }
  const lista = await esperar('a janela lista a cópia', () => pag.evaluate(() =>
    document.querySelectorAll('#modal-nuvem-restaurar.aberto #nuvem-copias input[type=radio]').length), v => v >= 1, 15000);
  if (!lista.ok) return false;
  await clicar(pag, '#nuvem-restaurar-confirmar');
  return (await esperar('a cópia chegou ao celular', () => pag.evaluate(async () => !document.querySelector('#modal-nuvem-restaurar.aberto') &&
    (await Store.carregar()).alunos.some(a => a.id === 'alfa') && !!document.querySelector('#cel-hoje.ativa')), v => v === true, 30000)).ok;
}
const marca = pag => pag.evaluate(() => { const c = document.querySelector('#modo-celular'); return c ? c.getAttribute('data-pacotes') : null; });
// espera a marca escondida chegar a um dos valores, e mais um instante para algum pedido atrasado aparecer
async function esperarMarca(pag, rotulo, valores, limite) {
  const r = await esperar(rotulo, () => marca(pag), v => valores.indexOf(v) >= 0, limite || 20000);
  await pausa(1500);
  return r.valor;
}
const lerPacotes = pag => pag.evaluate(() => Store.listarPacotesBiblioteca().then(l => l.map(p => p.pacote + '@' + p.versao).join(',')));

/* A impressão digital da biblioteca do aparelho, lida direto do IndexedDB: os
 * pacotes, os itens, a teoria e os assets (chave e tamanho do Blob). */
const digitalDaBiblioteca = pag => pag.evaluate(async () => {
  const b = await new Promise((r, j) => { const q = indexedDB.open('apoio-educacional'); q.onsuccess = () => r(q.result); q.onerror = () => j(q.error); });
  const todos = n => new Promise(r => { const g = b.transaction(n, 'readonly').objectStore(n).getAll(); g.onsuccess = () => r(g.result || []); });
  const sem = o => { const c = Object.assign({}, o); delete c.importadoEm; delete c.blob; return JSON.stringify(c); };
  const r = {
    pacotes: (await todos('biblioteca_pacotes')).map(sem).sort(),
    itens: (await todos('biblioteca_itens')).map(x => JSON.stringify(x)).sort(),
    teoria: (await todos('biblioteca_teoria')).map(x => JSON.stringify(x)).sort(),
    assets: (await todos('biblioteca_assets')).map(a => a.chave + ':' + a.versao + ':' + (a.blob ? a.blob.size + ':' + a.blob.type : 'sem')).sort()
  };
  b.close();
  return { n: [r.pacotes.length, r.itens.length, r.teoria.length, r.assets.length].join('/'), tudo: JSON.stringify(r) };
});
/* O que é DELA no celular, lido direto do IndexedDB: o documento, as listas e
 * as mídias (as imagens das folhas, que vieram na cópia). */
const retratoDela = pag => pag.evaluate(async () => {
  const b = await new Promise((r, j) => { const q = indexedDB.open('apoio-educacional'); q.onsuccess = () => r(q.result); q.onerror = () => j(q.error); });
  const pedir = (n, f) => new Promise(r => { const g = f(b.transaction(n, 'readonly').objectStore(n)); g.onsuccess = () => r(g.result); });
  const chavesMidias = await pedir('midias', s => s.getAllKeys());
  const valoresMidias = await pedir('midias', s => s.getAll());
  const r = {
    dados: JSON.stringify(await pedir('dados', s => s.get('principal'))),
    listas: JSON.stringify((await pedir('biblioteca_listas', s => s.getAll())).sort((x, y) => x.id < y.id ? -1 : 1)),
    midias: JSON.stringify(chavesMidias.map((k, i) => [k, valoresMidias[i]]))
  };
  b.close();
  return { midias: chavesMidias.map(String).join(','), listas: JSON.parse(r.listas).map(l => l.id).join(','), tudo: r };
});
const h = o => hex(Buffer.from(JSON.stringify(o)));

/* As escritas que o celular recusava antes da A1, e continua recusando. */
const recusasDeSempre = pag => pag.evaluate(async () => {
  const tenta = f => { try { return Promise.resolve(f()).then(() => 'gravou', e => e && e.soLeitura ? 'recusou' : 'erro: ' + (e && e.message)); } catch (e) { return Promise.resolve(e && e.soLeitura ? 'recusou' : 'erro: ' + e.message); } };
  const um = (await Store.listarPacotesBiblioteca())[0];
  return [
    await tenta(() => Store.gravarListaBiblioteca({ id: 'lista-do-celular', titulo: 'Do celular', nivel: null, itens: ['x'], paginas: [], origem: null, automatica: false, criadaEm: 1, editadaEm: 1 })),
    await tenta(() => Store.apagarListaBiblioteca('lista-dela')),
    await tenta(() => Store.salvarMidia('m-do-celular', { dataUrl: 'data:image/png;base64,AAAA', w: 1, h: 1 })),
    await tenta(() => Store.salvarMidia('bib:pacote@1:a.svg#100', { dataUrl: 'data:image/jpeg;base64,AAAA', w: 1, h: 1 })),
    await tenta(() => Store.apagarMidia('mFolha')),
    await tenta(() => Store.gravarEtiquetaBiblioteca({ itemId: 'x', dificuldade: 'facil', data: '2026-11-15' })),
    await tenta(() => Store.registrarUsoBiblioteca({ itemId: 'x', alunoId: 'alfa', aulaId: 'x1', data: '2026-11-15' })),
    await tenta(() => Store.removerPacoteBiblioteca(um ? um.pacote : 'matematica-sintetico-mirim-m1'))
  ].join(',');
});
const RECUSAS = 'recusou,recusou,recusou,recusou,recusou,recusou,recusou,recusou';
const DA_PORTA = ['biblioteca_pacotes', 'biblioteca_itens', 'biblioteca_teoria', 'biblioteca_assets'];
const portaDiz = pag => pag.evaluate(da => [
  Store.portaDaBibliotecaAceita(da),
  Store.portaDaBibliotecaAceita(['biblioteca_pacotes']),
  Store.portaDaBibliotecaAceita(['dados']),
  Store.portaDaBibliotecaAceita('dados'),
  Store.portaDaBibliotecaAceita(['biblioteca_listas']),
  Store.portaDaBibliotecaAceita(['midias']),
  Store.portaDaBibliotecaAceita(da.concat(['midias'])),
  Store.portaDaBibliotecaAceita(da.concat(['dados'])),
  Store.portaDaBibliotecaAceita(['biblioteca_uso', 'biblioteca_etiquetas']),
  Store.portaDaBibliotecaAceita([])
].join(','), DA_PORTA);
const PORTA_DA_DONA = 'true,true,false,false,false,false,false,false,false,false';
// a sonda abre pela trava de verdade (transacao, com a porta 'biblioteca') e aborta na hora
const sondaDiz = pag => pag.evaluate(async da => [
  await Store.sondarPortaDaBiblioteca(da),
  await Store.sondarPortaDaBiblioteca(['dados']),
  await Store.sondarPortaDaBiblioteca('biblioteca_listas'),
  await Store.sondarPortaDaBiblioteca(['midias']),
  await Store.sondarPortaDaBiblioteca(da.concat(['midias'])),
  await Store.sondarPortaDaBiblioteca(['biblioteca_etiquetas'])
].join(','), DA_PORTA);
const SONDA_DA_DONA = 'abriu,recusou,recusou,recusou,recusou,recusou';
const PORTA_FECHADA = 'false,false,false,false,false,false,false,false,false,false';

(async () => {
  secao('0. A prova se confere');
  conf('nenhum veneno desconhecido foi pedido', desconhecidos.join(','), '');
  for (const m of Object.keys(VENENOS)) {
    const [arq, de] = VENENOS[m];
    conf('a âncora de ' + m + ' aparece uma vez só', (arq === '/store.js' ? STORE : APP).split(de).length - 1, 1);
  }
  if (MODO) conf('o veneno ' + MODO + ' foi aplicado', trocas[VENENOS[MODO][0]] !== (VENENOS[MODO][0] === '/store.js' ? STORE : APP), true);
  conf('o firebase-tools está onde a prova procura (' + FIREBASE + ')', fs.existsSync(FIREBASE), true);
  const vj = /version "(\d+)/.exec(((r) => (r.stderr || '') + (r.stdout || ''))(spawnSync(JAVA_HOME ? path.join(JAVA_HOME, 'bin', 'java') : 'java', ['-version'], { encoding: 'utf8' })));
  conf('há um JDK 21 ou mais novo (' + (JAVA_HOME || 'java do PATH') + ')', !!vj && Number(vj[1]) >= 21, true);
  conf('os pacotes sintéticos são todos diferentes', new Set(Object.values(SHA)).size, Object.keys(SHA).length);
  if (H.placar.falhas) return fim();
  conf('as portas do emulador e do app estão livres (nada de outra rodada responde nelas)', await portasLivres(), true);
  if (H.placar.falhas) return fim();
  await new Promise((r, j) => { servidorRepasse.once('error', j); servidorRepasse.listen(PORTA_REPASSE, '127.0.0.1', r); });
  const subiu = await subirEmulador();
  if (!subiu.ok) throw new Error('o emulador não subiu');
  const dona = await criarConta(DONA);
  const obs = await criarConta(OBS);
  conf('as contas sintéticas da dona e do observador existem no emulador', !!dona.localId && !!obs.localId, true);
  const U = dona.localId;
  conf('o catálogo e os zips sintéticos entraram na nuvem de teste (da dona e do observador)',
    (await publicar(U, CATALOGO_DONA, true)).concat(await publicar(obs.localId, CATALOGO_OBS)).every(s => s === 200), true);

  secao('1. O tablet: a cópia sobe, e os pacotes chegam pelo Atualizar a biblioteca');
  const nav = await amb.subir();
  const ctxA = await nav.createBrowserContext();
  const pagA = await ctxA.newPage();
  await prepararPagina(pagA, false, 'wifi');
  await H.abrirApp(pagA, amb.ORIGEM);
  const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j8ioAAAAASUVORK5CYII=';
  await pagA.evaluate(async png => {
    const d = Store.bancoVazio();
    d.alunos = [{ id: 'alfa', nome: 'Aluno Alfa Teste', ativo: true, cor: '#1F3A5F', responsavel: 'Responsável Alfa Teste',
      precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 100 }], mapeamentos: [] }];
    d.aulas = [{ id: 'x1', alunoId: 'alfa', serieId: null, data: '2026-11-10', hora: '14:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [], temNota: true }];
    await Store.salvar(d);
    // a imagem de uma folha: é mídia da cópia de segurança, no mesmo depósito das miniaturas
    await Store.salvarMidia('mFolha', { dataUrl: png, w: 1, h: 1 }, { aulaId: 'x1' });
    await Store.salvarNota('x1', { paginas: [{ fundo: 'pautado', itens: [{ t: 'imagem', ref: 'mFolha', x: 10, y: 10, w: 1, h: 1 }] }] });
    // uma das listas dela
    await Store.gravarListaBiblioteca({ id: 'lista-dela', titulo: 'Quadriláteros', nivel: 'base', itens: ['x'], paginas: [], origem: null,
      automatica: false, criadaEm: 1700000000000, editadaEm: 1700000000000 });
  }, PNG);
  await H.abrirApp(pagA, amb.ORIGEM);
  conf('o tablet entrou na conta da dona', await entrarPelaTela(pagA, DONA), true);
  await clicar(pagA, '#nuvem-enviar');
  conf('a cópia do tablet subiu', (await esperar('a cópia subiu', () => texto(pagA, '#nuvem-ultima'), v => /^Última cópia na nuvem: hoje/.test(v || ''), 30000)).ok, true);
  await pagA.evaluate(u => Nuvem.permitirLeitor(u), obs.localId);
  conf('o tablet permitiu o observador', await pagA.evaluate(() => Nuvem.leitores().then(l => l.length)), 1);
  await H.irParaAba(pagA, 'ajustes');
  await pagA.evaluate(() => { const c = document.querySelector('#cartao-biblioteca'); if (c) c.hidden = false; });
  await esperar('o Atualizar a biblioteca está no tablet', () => existe(pagA, '#livros-nuvem-atualizar'), v => v === true, 15000);
  await clicar(pagA, '#livros-nuvem-atualizar');
  const noTablet = await esperar('os três pacotes chegaram ao tablet', () => lerPacotes(pagA), v => (v || '').split(',').filter(Boolean).length === 3, 90000);
  conf('o tablet tem os três pacotes da nuvem', noTablet.ok, true);
  const digitalA = await digitalDaBiblioteca(pagA);
  console.log('   no tablet: pacotes/itens/teoria/assets = ' + digitalA.n);

  secao('2. O celular da dona traz a cópia; a porta da biblioteca só abre para os quatro depósitos do pacote');
  const ctxC = await nav.createBrowserContext();
  const pagC = await ctxC.newPage();
  await prepararPagina(pagC, true, 'cellular');
  await abrirCelular(pagC);
  conf('o celular entrou com a conta da dona', await entrarNoCelular(pagC, DONA), true);
  conf('trouxe a cópia do tablet', await trazerCopiaNoCelular(pagC), true);
  conf('a marca: celular, da dona, não observador', await pagC.evaluate(() => { const e = Nuvem.estado(); return [e.celular, e.celularDaDona, e.observador].join(','); }), 'true,true,false');
  conf('o celular está no modo celular, a 390 px', await pagC.evaluate(() => document.body.classList.contains('modo-celular') && window.innerWidth === 390), true);
  const retrato0 = await retratoDela(pagC);
  conf('a cópia trouxe a imagem da folha e a lista dela ao celular', retrato0.midias + '|' + retrato0.listas, 'mFolha|lista-dela');
  const porta = await portaDiz(pagC);
  if (MODO === '--envenenado-porta-aceita-dados') {
    conf('VENENO visto: a porta da biblioteca aceita dados e biblioteca_listas', /^true,true,true,true,true,false,false,true,/.test(porta), true);
    return fim();
  }
  conf('a porta aceita só os quatro depósitos do pacote (nunca dados, listas, mídias, uso, etiquetas nem a mistura)', porta, PORTA_DA_DONA);
  const sonda = await sondaDiz(pagC);
  if (MODO === '--envenenado-porta-sem-conferir-lista') {
    conf('VENENO visto: pela trava, a porta da biblioteca abriu para dados, listas e mídias (' + sonda + ')', /^abriu,abriu,abriu,abriu/.test(sonda), true);
    return fim();
  }
  conf('pela própria trava (transacao), a porta abre para os quatro e recusa dados, listas, mídias, a mistura e etiquetas', sonda, SONDA_DA_DONA);
  conf('e a sonda não gravou nada', h((await retratoDela(pagC)).tudo), h(retrato0.tudo));
  conf('o que o celular recusava continua recusado: listas, mídias (da folha e miniatura), etiquetas, uso e remover pacote', await recusasDeSempre(pagC), RECUSAS);
  conf('e nada mudou no que é dela', h((await retratoDela(pagC)).tudo), h(retrato0.tudo));

  secao('3. Fora do Wi-Fi, ou sem espaço, nada baixa');
  const v3 = await esperarMarca(pagC, 'o celular conferiu a conexão depois da cópia', ['sem-wifi', 'prontos', 'conferindo', 'trazendo 1/3'], 20000);
  if (MODO === '--envenenado-baixa-sem-wifi') {
    const r = await esperar('os pacotes chegaram pelos dados móveis', () => lerPacotes(pagC), v => (v || '').split(',').filter(Boolean).length === 3, 60000);
    conf('VENENO visto: nos dados móveis, o celular baixou os pacotes (' + pagC.pedidosStorage.length + ' pedidos ao Storage)', r.ok && pagC.pedidosStorage.length > 0, true);
    return fim();
  }
  conf('nos dados móveis (type cellular): a marca diz sem Wi-Fi, nenhum pedido ao Storage, nenhum pacote', v3 + '|' + pagC.pedidosStorage.length + '|' + await lerPacotes(pagC), 'sem-wifi|0|');
  await pagC.evaluate(() => { document.querySelector('#modo-celular').removeAttribute('data-pacotes'); window.__mudarRede(undefined); });
  conf('com o tipo desconhecido (sem type, só o effectiveType 4g): nada', (await esperarMarca(pagC, 'conferiu com o tipo desconhecido', ['sem-wifi', 'conferindo'])) + '|' +
    pagC.pedidosStorage.length + '|' + await lerPacotes(pagC), 'sem-wifi|0|');
  await pagC.evaluate(() => { window.__mudarRede('unknown'); });
  conf('com o tipo "unknown": nada', (await esperarMarca(pagC, 'conferiu com unknown', ['sem-wifi', 'conferindo'])) + '|' + pagC.pedidosStorage.length, 'sem-wifi|0');
  // sem navigator.connection (o Safari do iPhone): a abertura confere e não baixa
  await pagC.evaluate(() => { window.__semConexao(true); });
  await abrirCelular(pagC);
  conf('sem navigator.connection, ao abrir: nada', (await esperarMarca(pagC, 'a abertura conferiu sem navigator.connection', ['sem-wifi', 'conferindo'])) + '|' +
    pagC.pedidosStorage.length + '|' + await pagC.evaluate(() => navigator.connection === undefined), 'sem-wifi|0|true');
  await pagC.evaluate(() => { window.__semConexao(false); window.__quota(1024 * 1024); });
  await abrirCelular(pagC);
  await esperarMarca(pagC, 'a abertura conferiu, ainda nos dados móveis', ['sem-wifi', 'conferindo']);
  // sem internet: o Wi-Fi entra, mas o aparelho está fora do ar
  await pagC.setOfflineMode(true);
  const catalogo0 = pagC.leiturasCatalogo;
  await pagC.evaluate(() => { window.__mudarRede('wifi'); });
  conf('sem internet (o Wi-Fi sem sinal): nem o catálogo é pedido', (await esperarMarca(pagC, 'conferiu sem internet', ['sem-internet', 'conferindo'])) + '|' +
    (pagC.leiturasCatalogo - catalogo0) + '|' + pagC.pedidosStorage.length, 'sem-internet|0|0');
  // o sinal volta, no Wi-Fi, mas sem espaço (a quota de 1 MB)
  await pagC.setOfflineMode(false);
  conf('o sinal voltou no Wi-Fi sem espaço para os três: nenhum pacote baixa', (await esperarMarca(pagC, 'conferiu sem espaço', ['sem-espaco', 'prontos', 'faltam'], 30000)) + '|' +
    pagC.pedidosStorage.length + '|' + await lerPacotes(pagC), 'sem-espaco|0|');
  conf('(controle) a conferência sem espaço leu o catálogo', pagC.leiturasCatalogo > catalogo0, true);

  secao('4. O observador de outra conta, no Wi-Fi: nada');
  const ctxD = await nav.createBrowserContext();
  const pagD = await ctxD.newPage();
  await prepararPagina(pagD, true, 'wifi');
  await abrirCelular(pagD);
  conf('o observador entrou com a conta dele', await entrarNoCelular(pagD, OBS), true);
  conf('trouxe a cópia da dona pelo código da conta dela', await trazerCopiaNoCelular(pagD, U), true);
  conf('a marca do observador: celular, observador, não da dona', await pagD.evaluate(() => { const e = Nuvem.estado(); return [e.celular, e.observador, e.celularDaDona].join(','); }), 'true,true,false');
  await pausa(3000);
  await pagD.evaluate(() => { window.__mudarRede('wifi'); });
  await pausa(2500);
  await abrirCelular(pagD);
  await pausa(4000);
  if (MODO === '--envenenado-observador-baixa') {
    conf('VENENO visto: o observador leu o catálogo e baixou (' + pagD.leiturasCatalogo + ' leituras, ' + pagD.pedidosStorage.length + ' pedidos ao Storage)',
      pagD.leiturasCatalogo > 0 && pagD.pedidosStorage.length > 0, true);
    return fim();
  }
  conf('o observador nem leu o catálogo, não pediu nada ao Storage e não tem pacote', pagD.leiturasCatalogo + '|' + pagD.pedidosStorage.length + '|' + await lerPacotes(pagD), '0|0|');
  conf('e a marca escondida do andamento nem aparece nele', await marca(pagD), null);
  conf('a porta da biblioteca fica fechada para o observador', await portaDiz(pagD), PORTA_FECHADA);
  conf('e, pela própria trava, ela recusa até os quatro depósitos do pacote', await sondaDiz(pagD), 'recusou,recusou,recusou,recusou,recusou,recusou');
  conf('nenhum erro de página no observador', pagD.errosDePagina.join(' | '), '');
  await ctxD.close();

  secao('4b. O Wi-Fi cai no meio da baixa: o pedido é cortado e nada é gravado');
  repasse.lentoSha = SHA.m1;   // o primeiro da série, em ordem de nome
  repasse.enviados = {}; repasse.cortados = []; repasse.completos = [];   // o tablet já baixou estes zips antes
  await pagC.evaluate(() => { window.__transacoes = []; window.__quota(0); window.__mudarRede('wifi'); });
  const meio = await esperar('o primeiro zip começou a chegar, devagar', () => repasse.enviados[SHA.m1] || 0, v => v >= 1024, 30000);
  conf('(arranjo) a baixa do primeiro pacote estava no meio', meio.ok && (repasse.enviados[SHA.m1] || 0) < ZIP.m1.length, true);
  await pagC.evaluate(() => { window.__mudarRede('cellular'); });
  const fimCorte = await esperar('a série acabou depois da troca para os dados móveis', () => marca(pagC), v => ['parou', 'prontos', 'faltam', 'falhou'].indexOf(v) >= 0, 60000);
  await pausa(1500);
  repasse.lentoSha = null;
  if (MODO === '--envenenado-continua-sem-wifi') {
    conf('VENENO visto: o zip chegou inteiro pelos dados móveis e o pacote foi gravado', repasse.completos.indexOf(SHA.m1) >= 0 &&
      /matematica-sintetico-mirim-m1@1/.test(await lerPacotes(pagC)), true);
    return fim();
  }
  conf('a troca para os dados móveis cortou o pedido no meio (o repasse viu a conexão cair antes do fim)',
    repasse.cortados.indexOf(SHA.m1) >= 0 && repasse.completos.indexOf(SHA.m1) < 0, true);
  conf('nada foi gravado: nenhum pacote e nenhuma transação de pacote', (await lerPacotes(pagC)) + '|' +
    (await pagC.evaluate(() => window.__transacoes.filter(t => /biblioteca_/.test(t)).length)), '|0');
  conf('a série parou ali, sem pedir o pacote seguinte', fimCorte.valor + '|' + pagC.pedidosStorage.filter(u => u.indexOf(SHA.m2) >= 0 || u.indexOf(SHA.sond) >= 0).length, 'parou|0');

  secao('5. No Wi-Fi com espaço: os três pacotes chegam, iguais aos do tablet, e nada dela muda');
  pagC.pedidosStorage = [];
  const retrato1 = await retratoDela(pagC);
  conf('(antes) o que é dela no celular continua o da cópia', h(retrato1.tudo), h(retrato0.tudo));
  await pagC.evaluate(() => {
    window.__transacoes = [];
    window.__marcas = [];
    const c = document.querySelector('#modo-celular');
    window.__olhaMarca = new MutationObserver(() => { const v = c.getAttribute('data-pacotes'); if (window.__marcas[window.__marcas.length - 1] !== v) window.__marcas.push(v); });
    window.__olhaMarca.observe(c, { attributes: true, attributeFilter: ['data-pacotes'] });
    window.__quota(0);
    window.__mudarRede('wifi');
    // a conexão muda de novo no meio: continua uma série só
    setTimeout(() => window.__mudarRede('wifi'), 30);
    setTimeout(() => window.__mudarRede('ethernet'), 120);
  });
  const chegou = await esperar('os três pacotes chegaram ao celular', () => marca(pagC), v => v === 'prontos' || v === 'faltam' || v === 'falhou' || v === 'parou', 90000);
  await pausa(1500);
  conf('a série terminou com todos os pacotes', chegou.valor, 'prontos');
  conf('os três pacotes estão no celular', await lerPacotes(pagC), noTablet.valor);
  const marcas = await pagC.evaluate(() => { window.__olhaMarca.disconnect(); return window.__marcas; });
  conf('a marca escondida andou de um em um (' + marcas.join(' > ') + ')', ['trazendo 1/3', 'trazendo 2/3', 'trazendo 3/3', 'prontos'].every(m => marcas.indexOf(m) >= 0), true);
  const porZip = Object.keys(CATALOGO_DONA).map(n => pagC.pedidosStorage.filter(u => u.indexOf(SHA[CATALOGO_DONA[n]]) !== -1).length);
  conf('uma série só: cada zip baixou uma vez, mesmo com a conexão mudando no meio', porZip.join(',') + '|' + pagC.pedidosStorage.length, '1,1,1|3');
  const digitalC = await digitalDaBiblioteca(pagC);
  conf('os pacotes do celular são iguais aos do tablet (pacotes, itens, teoria e assets: ' + digitalC.n + ')', h(digitalC.tudo), h(digitalA.tudo));
  const trans = await pagC.evaluate(() => window.__transacoes.slice());
  const doPacote = trans.filter(t => /biblioteca_(pacotes|itens|teoria|assets)/.test(t));
  conf('cada gravação de pacote foi uma transação só com os quatro depósitos (' + doPacote.length + ')', doPacote.length === 3 &&
    doPacote.every(t => t === 'biblioteca_assets+biblioteca_itens+biblioteca_pacotes+biblioteca_teoria'), true);
  const tocou = trans.filter(t => /(^|\+)(dados|biblioteca_listas|midias)(\+|$)/.test(t));
  conf('nenhuma transação de escrita tocou dados, biblioteca_listas ou midias durante a série', tocou.join(' ; '), '');
  const retrato2 = await retratoDela(pagC);
  conf('dados, listas e mídias do celular ficaram idênticos (a imagem da folha da cópia continua lá)',
    h(retrato2.tudo) + '|' + retrato2.midias, h(retrato0.tudo) + '|mFolha');

  secao('6. A conexão muda de novo, com tudo em dia: nada baixa outra vez');
  const n6 = pagC.pedidosStorage.length, c6 = pagC.leiturasCatalogo;
  // o change que só troca a velocidade (downlink, rtt) dispara várias vezes seguidas
  await pagC.evaluate(() => { ['wifi', 'wifi', 'ethernet', 'wifi', 'wifi'].forEach((t, i) => setTimeout(() => window.__mudarRede(t), i * 200)); });
  await pausa(4000);
  conf('cinco changes seguidos no Wi-Fi, com tudo em dia: no máximo uma leitura do catálogo, e nada baixou (' + (pagC.leiturasCatalogo - c6) + ' leituras)',
    (pagC.leiturasCatalogo - c6 <= 1) + '|' + (pagC.pedidosStorage.length - n6), 'true|0');
  conf('o pacote de livros marcado no catálogo nunca foi pedido (nem no tablet), e o tamanho dele não barrou os outros',
    pagC.pedidosStorage.concat(pagA.pedidosStorage).filter(u => u.indexOf(SHA_LIVROS_MARCADO) >= 0).length, 0);

  secao('7. A escrita escondida: o espelho das listas não grava no celular');
  // uma seleção anterior no diário do celular (localStorage), que o espelho copiaria para as listas
  await pagC.evaluate(() => {
    localStorage.setItem('apoio-educacional:bib-selecoes-anteriores', JSON.stringify([{ itens: ['x-espelho'], paginas: [], quando: 1700000001000, lista: null }]));
  });
  // o tablet sobe uma cópia nova; o celular a traz ao abrir e a Biblioteca se refaz por baixo
  await pagA.evaluate(async () => { const d = await Store.carregar(); d.alunos[0].responsavel = 'Responsável Alfa Teste 2'; await Store.salvar(d); });
  await H.abrirApp(pagA, amb.ORIGEM);
  const idAntes = await pagA.evaluate(() => (Nuvem.estado().ultimaCopia || {}).id || null);
  await H.irParaAba(pagA, 'ajustes');
  await clicar(pagA, '#nuvem-enviar');
  const idNovo = (await esperar('a cópia nova subiu', () => pagA.evaluate(() => (Nuvem.estado().ultimaCopia || {}).id || null), v => !!v && v !== idAntes, 30000)).valor;
  await abrirCelular(pagC);
  const trouxe = await esperar('o celular trouxe a cópia nova ao abrir', () => pagC.evaluate(() => (Nuvem.estado().ultimaCopia || {}).id || null), v => v === idNovo, 30000);
  conf('o celular trouxe a cópia nova ao abrir', trouxe.ok, true);
  // a restauração refaz a Biblioteca por baixo (esquecerMinhasListas), que relê as listas e chama o espelho
  await pausa(4000);
  const chamadas = await pagC.evaluate(() => window.__listasChamadas);
  if (MODO === '--envenenado-celular-grava-lista') {
    conf('VENENO visto: o celular chamou gravarListaBiblioteca (' + chamadas + ' vezes)', chamadas > 0, true);
    return fim();
  }
  conf('o celular não chamou gravarListaBiblioteca nem apagarListaBiblioteca', chamadas, 0);
  const retrato3 = await retratoDela(pagC);
  conf('as listas do celular são só as da cópia, e a imagem da folha continua', retrato3.listas + '|' + retrato3.midias, 'lista-dela|mFolha');
  conf('os pacotes continuam no celular depois da restauração', await lerPacotes(pagC), noTablet.valor);
  conf('(controle) a seleção anterior continua no diário do celular, sem ter ido para o depósito',
    await pagC.evaluate(() => JSON.parse(localStorage.getItem('apoio-educacional:bib-selecoes-anteriores') || '[]').length), 1);

  secao('8. As recusas de sempre, a tela e os erros');
  conf('depois dos pacotes, o celular continua recusando listas, mídias, etiquetas, uso e remover pacote', await recusasDeSempre(pagC), RECUSAS);
  conf('a porta continua estreita', await portaDiz(pagC), PORTA_DA_DONA);
  conf('a tela da Biblioteca do celular é a de antes (a linha que ela vê é da A2)', await texto(pagC, '#cel-biblioteca-onde') === null ||
    await texto(pagC, '#cel-biblioteca-onde') === 'Os livros e as questões da OBMEP ficam no tablet. Abra a Biblioteca por lá.', true);
  conf('nenhum erro de página no celular', pagC.errosDePagina.join(' | '), '');
  conf('nenhum erro de página no tablet', pagA.errosDePagina.join(' | '), '');
  return fim();
})().catch(e => { console.error('erro:', e && e.stack || e); H.placar.falhas++; return fim(); });

process.on('exit', () => {
  try {
    if (emulador && emulador.saiu === undefined) {
      if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(emulador.pid), '/T', '/F'], { stdio: 'ignore' });
      else matarGrupo('SIGKILL');
    }
  } catch (e) { /* ok */ }
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ }
});
