/* testa_nuvem_diagnostico.js
 *
 * D7, o aparelho observador (o iPhone do Rômulo), contra o Firebase Emulator
 * Suite (Auth e Firestore), em quatro partes:
 *
 *   (a) as regras do caminho usuarios/{uid}/diagnostico/{aparelhoId}: a dona
 *       grava um resumo com a forma esperada; um resumo com campo de dado de
 *       criança (alunos, nome), com frase longa demais ou com o id trocado é
 *       recusado; o observador permitido lê e não escreve; o estranho não lê;
 *   (b) o tablet da dona grava o diagnóstico dele sozinho, só com metadados
 *       (versão, último erro pelo nome e pelo lugar, sem a mensagem; a fila;
 *       a última sincronização), quando muda e no máximo uma vez por hora;
 *   (c) o observador, noutra conta e num Safari de iPhone simulado (user
 *       agent, tela 390x844, persist() recusado, sem Background Sync, fora
 *       da Tela de Início), traz a cópia da dona só para ler, vê o painel
 *       "Diagnóstico" com o tablet dela em linguagem simples, vê os motivos
 *       do que o Safari não garante, vê o texto de instalação em Ajustes, não
 *       escreve NADA na nuvem (zero commits) e, reaberto, relê da nuvem;
 *   (d) nada fica no observador além da marca, da sessão e do que volta da
 *       nuvem.
 *
 * Modos envenenados, que TÊM de ser vistos pela prova:
 *   --envenenado-diagnostico-aberto  as regras deixam a dona gravar qualquer
 *                                    campo no diagnóstico; a parte (a) tem de
 *                                    acusar no campo de dado de criança.
 *   --envenenado-observador-grava    o nuvem.js servido deixa o observador
 *                                    subir o diagnóstico dele; a parte (c)
 *                                    tem de ver o commit sair.
 *
 * O que a prova precisa na máquina (como o testa_nuvem): firebase-tools fora
 * do repositório (FIREBASE_TOOLS ou o caminho padrão) e um JDK 21 em
 * JAVA_HOME. Portas: 8961 (app), 8963 (auth), 8964 (firestore), 8965 (hub),
 * 8966 (log), 8967 (websocket). Nunca a 8777 do portão.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const MODO = ['--envenenado-diagnostico-aberto', '--envenenado-observador-grava'].filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const DIAG_ABERTO = MODO === '--envenenado-diagnostico-aberto';
const OBS_GRAVA = MODO === '--envenenado-observador-grava';

const PORTA_APP = 8961, PORTA_AUTH = 8963, PORTA_FS = 8964, PORTA_HUB = 8965, PORTA_LOG = 8966, PORTA_WS = 8967;
const PROJETO = 'demo-nath-d7';
const AUTH = 'http://127.0.0.1:' + PORTA_AUTH;
const FS = 'http://127.0.0.1:' + PORTA_FS;
const FIREBASE = process.env.FIREBASE_TOOLS ||
  'C:/Users/romul/ferramentas/firebase-tools/node_modules/firebase-tools/lib/bin/firebase.js';
const JAVA_HOME = process.env.JAVA_HOME || '';

const DONA = { email: 'dona@exemplo.test', senha: 'senha-da-dona-1' };
const OBS = { email: 'observador@exemplo.test', senha: 'senha-do-observador-1' };
const ESTRANHO = { email: 'estranho@exemplo.test', senha: 'senha-do-estranho-1' };

const NUVEM = fs.readFileSync(path.join(H.RAIZ, 'nuvem.js'), 'utf8');
const REGRAS = fs.readFileSync(path.join(H.RAIZ, 'firestore.rules'), 'utf8');
const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const INDEX = fs.readFileSync(path.join(H.RAIZ, 'index.html'), 'utf8');
const VERSAO = (/var VERSAO = '([^']+)'/.exec(APP) || [])[1] || '';
const UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

/* ---------- âncoras ---------- */
const ESCRITA_DIAG = 'allow create, update: if dona(uid) && diagnosticoValido(aparelho);';
const GUARDA_DIAG = "if (!sessao || !podeEnviarRegistros() || !online()) return Promise.resolve({ pulado: 'indevido' });";
const PORTAO = 'if (!podeEnviarCopia() && !(celularDaDona() && (soRegistros(escritas) || soDiagnosticoProprio(escritas)))) return Promise.reject(recusaSoLeitura());';

secao('0. As âncoras e o ambiente');
conf('a versão do aplicativo foi lida do app.js', /^\d+\.\d+\.\d+$/.test(VERSAO), true);
conf('as regras têm o caminho do diagnóstico, escrito só pela dona e com a forma conferida, num lugar só', REGRAS.split(ESCRITA_DIAG).length, 2);
conf('as regras fecham os nomes dos campos do diagnóstico (hasOnly) e limitam a frase do erro a 200', /diagnosticoValido[\s\S]*hasOnly\(\['aparelhoId'[\s\S]*erroFrase\.size\(\) <= 200/.test(REGRAS), true);
conf('o nuvem.js só sobe o diagnóstico de quem escreve na nuvem, num lugar só', NUVEM.split(GUARDA_DIAG).length, 2);
conf('o commit só deixa o celular da dona subir registro ou o diagnóstico do próprio aparelho, num lugar só', NUVEM.split(PORTAO).length, 2);
const montar = NUVEM.slice(NUVEM.indexOf('function montarDiagnostico'), NUVEM.indexOf('function assinaturaDoDiagnostico'));
conf('o resumo que sobe não toca em aluno, aula, nome, nota, valor nem mensagem de erro', montar.length > 200 && !/alunos|aulas|nome|nota|valor|mensagem|\.message/.test(montar), true);
conf('o erro de script entra só pelo nome e pelo lugar, nunca pela mensagem', /anotarErroScript\(ev && ev\.error && ev\.error\.name, ev && ev\.filename, ev && ev\.lineno\)/.test(NUVEM) && !/erroScript[^\n]*\.message/.test(NUVEM), true);
conf('o app.js pede o armazenamento persistente a cada abertura e guarda o resultado', /function iniciar\(\) \{[\s\S]{0,400}pedirPersistencia\(\);/.test(APP) && /persistenciaConcedida = r;/.test(APP), true);
conf('o app.js tem a sonda do navegador com os quatro motivos', ['não garantiu o armazenamento', 'navegação privada', 'Sem sincronização em segundo plano', 'Adicionar à Tela de Início'].every(f => APP.indexOf(f) > 0), true);
conf('o index.html tem as duas abas do observador, escondidas por padrão', /data-cel="diagnostico" type="button" hidden/.test(INDEX) && /data-cel="ajustes" type="button" hidden/.test(INDEX), true);

const trocas = {};
const regrasServidas = DIAG_ABERTO ? REGRAS.replace(ESCRITA_DIAG, 'allow create, update: if dona(uid);') : REGRAS;
if (OBS_GRAVA) {
  trocas['/nuvem.js'] = NUVEM
    .replace(GUARDA_DIAG, "if (!sessao || !online()) return Promise.resolve({ pulado: 'indevido' });")
    .replace(PORTAO, 'if (!podeEnviarCopia() && !soDiagnosticoProprio(escritas) && !(celularDaDona() && soRegistros(escritas))) return Promise.reject(recusaSoLeitura());');
}
if (MODO) conf('o arquivo servido ficou diferente do repositório (' + MODO + ')', (trocas['/nuvem.js'] || NUVEM) !== NUVEM || regrasServidas !== REGRAS, true);

conf('o firebase-tools está onde a prova procura (' + FIREBASE + ')', fs.existsSync(FIREBASE), true);
const javaExe = JAVA_HOME ? path.join(JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java';
const versaoJava = (function () {
  const r = spawnSync(javaExe, ['-version'], { encoding: 'utf8' });
  const m = /version "(\d+)/.exec((r.stderr || '') + (r.stdout || ''));
  return m ? Number(m[1]) : 0;
})();
conf('há um JDK 21 ou mais novo (' + (JAVA_HOME || 'java do PATH') + ', versão ' + versaoJava + ')', versaoJava >= 21, true);
if (!fs.existsSync(FIREBASE) || versaoJava < 21) {
  console.log('\n' + H.placar.passes + ' passaram, ' + H.placar.falhas + ' falharam.');
  process.exit(1);
}

/* ---------- o emulador ---------- */
const PASTA = path.join(os.tmpdir(), 'nath_d7_emulador_' + process.pid);
let emulador = null;
function subirEmulador() {
  fs.mkdirSync(PASTA, { recursive: true });
  fs.writeFileSync(path.join(PASTA, 'firestore.rules'), regrasServidas);
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

/* ---------- REST direto do Node ---------- */
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
const docUrl = (uid, rel) => FS + '/v1/projects/' + PROJETO + '/databases/(default)/documents/usuarios/' + uid + (rel ? '/' + rel : '');
const lerDoc = (token, uid, rel) => rest(docUrl(uid, rel), { token });
const gravarDoc = (token, uid, rel, fields) => rest(docUrl(uid, rel), { token, metodo: 'PATCH', corpo: { fields } });
const uids = (lista) => ({ uids: { arrayValue: { values: lista.map(u => ({ stringValue: u })) } } });
const s = v => ({ stringValue: v });
/* Um diagnóstico com a forma que o aplicativo manda. */
function diagnosticoDeProva(id, extras) {
  const f = { aparelhoId: s(id), aparelho: s('tablet 7K'), papel: s('tablet'), app: s(VERSAO || 'prova'), quando: s('2026-11-08T10:00:00.000Z'),
    pendentes: { integerValue: '0' }, quarentena: { integerValue: '0' }, ultimoEnvio: s('2026-11-08T09:59:00.000Z'),
    sincronizacao: s('ligada'), navegador: s('Chrome Android'), instalado: { booleanValue: true }, persistente: { booleanValue: true },
    erroCodigo: s('SEM_REDE'), erroFrase: s('Sem internet.'), erroQuando: s('2026-11-07T18:40:00.000Z'), erroOrigem: s('envio') };
  return Object.assign(f, extras || {});
}
/* O veneno das regras abertas: a prova tem de VER o campo de criança passar. */
function confDadoDeCriancaRecusado(rotulo, status) {
  if (DIAG_ABERTO) conf('VENENO visto: ' + rotulo + ', e com a regra aberta a nuvem aceitou (' + status + ')', status, 200);
  else conf(rotulo, status, 403);
}

const CFG = { auth: AUTH, firestore: FS, projectId: PROJETO };
const amb = H.criarAmbiente(PORTA_APP, 'nath_d7_diag', trocas);

/* O tablet da dona: tela 1280x800; o iPhone do observador: Safari simulado. */
async function prepararPagina(pag, iphone) {
  pag.setDefaultTimeout(60000);
  if (iphone) await pag.setUserAgent(UA_IPHONE);
  await pag.evaluateOnNewDocument(ehIphone => {
    const largura = ehIphone ? 390 : 1280, altura = ehIphone ? 844 : 800;
    Object.defineProperty(Screen.prototype, 'width', { configurable: true, get: () => largura });
    Object.defineProperty(Screen.prototype, 'height', { configurable: true, get: () => altura });
    if (ehIphone) {
      /* O Safari do iPhone, nos pontos em que não coopera: recusa o
       * armazenamento persistente, não tem Background Sync, e fora da Tela de
       * Início não é "standalone". */
      if (window.StorageManager && StorageManager.prototype.persist) StorageManager.prototype.persist = function () { return Promise.resolve(false); };
      try { delete window.SyncManager; } catch (e) { /* fica */ }
      if (!('standalone' in navigator)) Object.defineProperty(navigator, 'standalone', { configurable: true, get: () => false });
    }
  }, !!iphone);
  pag.errosDePagina = [];
  pag.on('pageerror', e => pag.errosDePagina.push(e.message));
  pag.dialogos = [];
  pag.on('dialog', async d => { pag.dialogos.push(d.message()); try { await d.accept(); } catch (e) { /* ok */ } });
  pag.pedidos = [];
  pag.on('request', r => pag.pedidos.push(r.url()));
  await pag.evaluateOnNewDocument(cfg => { window.NUVEM_EMULADOR = cfg; }, CFG);
  await pag.evaluateOnNewDocument(() => {
    const original = window.fetch;
    window.fetch = function (url) {
      if (String(url).indexOf('ibge') >= 0) return Promise.reject(new Error('sem rede para o IBGE neste teste'));
      return original.apply(this, arguments);
    };
  });
}
const texto = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent : null; }, sel);
const existe = (pag, sel) => pag.evaluate(s => !!document.querySelector(s), sel);
const visivel = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); return !!e && !e.hidden; }, sel);
async function digitar(pag, sel, valor) {
  await pag.evaluate((s, v) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, sel, valor);
}
const clicar = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.click(); return true; }, sel);
const lerEstadoDaNuvem = (pag, chave) => pag.evaluate(c => new Promise(r => {
  const q = indexedDB.open('apoio-nuvem');
  q.onsuccess = () => { const g = q.result.transaction('estado').objectStore('estado').get(c); g.onsuccess = () => { q.result.close(); r(g.result === undefined ? null : g.result); }; g.onerror = () => r('erro'); };
  q.onerror = () => r('erro');
}), chave);
const chavesDaNuvem = (pag) => pag.evaluate(() => new Promise(r => {
  const q = indexedDB.open('apoio-nuvem');
  q.onsuccess = () => { const g = q.result.transaction('estado').objectStore('estado').getAllKeys(); g.onsuccess = () => { q.result.close(); r(g.result.slice().sort()); }; g.onerror = () => r('erro'); };
  q.onerror = () => r('erro');
}));
const gravarEstadoDaNuvem = (pag, chave, valor) => pag.evaluate((c, v) => new Promise(r => {
  const q = indexedDB.open('apoio-nuvem');
  q.onsuccess = () => { const t = q.result.transaction('estado', 'readwrite'); t.objectStore('estado').put(v, c); t.oncomplete = () => { q.result.close(); r(true); }; t.onerror = () => r(false); };
  q.onerror = () => r(false);
}), chave, valor);
async function entrarPelaTela(pag, email, senha, seletorPronto) {
  const form = await esperar('o cartão da nuvem pede e-mail e senha', () => existe(pag, '#nuvem-entrar'), v => v === true, 10000);
  if (!form.ok) return false;
  await digitar(pag, '#nuvem-email', email);
  await digitar(pag, '#nuvem-senha', senha);
  await clicar(pag, '#nuvem-entrar');
  return (await esperar('entrou', () => existe(pag, seletorPronto), v => v === true, 15000)).ok;
}
const commitsDe = (pag, desde) => pag.pedidos.slice(desde).filter(u => /:commit\b/.test(u)).length;

(async function () {
  secao('1. O emulador sobe e as três contas existem');
  await subirEmulador();
  const dona = (await criarUsuario(DONA)).json, obs = (await criarUsuario(OBS)).json, estranho = (await criarUsuario(ESTRANHO)).json;
  conf('as três contas foram criadas no emulador', !!(dona && dona.localId && obs && obs.localId && estranho && estranho.localId), true);

  secao('2. (a) As regras do diagnóstico: forma fechada, só a dona escreve, o leitor lê');
  const ID = 'apProva000000001';
  conf('a dona grava o diagnóstico do aparelho com a forma esperada', (await gravarDoc(dona.idToken, dona.localId, 'diagnostico/' + ID, diagnosticoDeProva(ID))).status, 200);
  confDadoDeCriancaRecusado('VENENO: um diagnóstico com o campo "alunos" (dado de criança) é recusado',
    (await gravarDoc(dona.idToken, dona.localId, 'diagnostico/' + ID, diagnosticoDeProva(ID, { alunos: { arrayValue: { values: [s('Aluna Alfa Teste')] } } }))).status);
  confDadoDeCriancaRecusado('VENENO: um diagnóstico com o campo "nome" é recusado',
    (await gravarDoc(dona.idToken, dona.localId, 'diagnostico/' + ID, diagnosticoDeProva(ID, { nome: s('Aluno Beta Teste') }))).status);
  confDadoDeCriancaRecusado('VENENO: um diagnóstico com o campo "dados" (o conteúdo de um registro) é recusado',
    (await gravarDoc(dona.idToken, dona.localId, 'diagnostico/' + ID, diagnosticoDeProva(ID, { dados: { mapValue: { fields: { nome: s('x') } } } }))).status);
  conf('a frase do erro com mais de 200 caracteres é recusada', (await gravarDoc(dona.idToken, dona.localId, 'diagnostico/' + ID, diagnosticoDeProva(ID, { erroFrase: s('x'.repeat(201)) }))).status, DIAG_ABERTO ? 200 : 403);
  conf('o id do aparelho diferente do id do documento é recusado', (await gravarDoc(dona.idToken, dona.localId, 'diagnostico/' + ID, diagnosticoDeProva('apOutro'))).status, DIAG_ABERTO ? 200 : 403);
  conf('sem o campo quando é recusado', (await gravarDoc(dona.idToken, dona.localId, 'diagnostico/' + ID, (() => { const f = diagnosticoDeProva(ID); delete f.quando; return f; })())).status, DIAG_ABERTO ? 200 : 403);
  conf('pendentes que não é inteiro é recusado', (await gravarDoc(dona.idToken, dona.localId, 'diagnostico/' + ID, diagnosticoDeProva(ID, { pendentes: s('dois') }))).status, DIAG_ABERTO ? 200 : 403);
  // a dona volta o documento ao estado válido (nos venenos ele pode ter ficado com lixo)
  conf('a dona regrava o diagnóstico válido', (await gravarDoc(dona.idToken, dona.localId, 'diagnostico/' + ID, diagnosticoDeProva(ID))).status, 200);
  conf('o observador ainda não permitido não lê o diagnóstico dela', (await lerDoc(obs.idToken, dona.localId, 'diagnostico/' + ID)).status, 403);
  conf('o observador ainda não permitido não lista os diagnósticos dela', (await lerDoc(obs.idToken, dona.localId, 'diagnostico')).status, 403);
  conf('a dona grava o documento de leitores com o observador', (await gravarDoc(dona.idToken, dona.localId, 'config/leitores', uids([obs.localId]))).status, 200);
  conf('o observador permitido lê o diagnóstico dela', (await lerDoc(obs.idToken, dona.localId, 'diagnostico/' + ID)).status, 200);
  const listagem = await lerDoc(obs.idToken, dona.localId, 'diagnostico');
  conf('o observador permitido lista os diagnósticos dela (um documento)', listagem.status === 200 && ((listagem.json || {}).documents || []).length === 1, true);
  conf('o observador permitido não escreve o diagnóstico no caminho dela', (await gravarDoc(obs.idToken, dona.localId, 'diagnostico/' + ID, diagnosticoDeProva(ID))).status, 403);
  conf('o observador permitido não escreve um diagnóstico novo no caminho dela', (await gravarDoc(obs.idToken, dona.localId, 'diagnostico/apDoObservador', diagnosticoDeProva('apDoObservador'))).status, 403);
  conf('o estranho não lê o diagnóstico dela', (await lerDoc(estranho.idToken, dona.localId, 'diagnostico/' + ID)).status, 403);
  conf('o estranho não lista os diagnósticos dela', (await lerDoc(estranho.idToken, dona.localId, 'diagnostico')).status, 403);
  conf('o estranho não escreve o diagnóstico dela', (await gravarDoc(estranho.idToken, dona.localId, 'diagnostico/' + ID, diagnosticoDeProva(ID))).status, 403);
  conf('sem login ninguém lê o diagnóstico', (await lerDoc(null, dona.localId, 'diagnostico/' + ID)).status, 403);
  conf('o diagnóstico de prova saiu do caminho dela', (await rest(docUrl(dona.localId, 'diagnostico/' + ID), { token: dona.idToken, metodo: 'DELETE' })).status, 200);

  secao('3. (b) O tablet da dona grava o diagnóstico dele sozinho, só com metadados');
  await amb.subir();
  const pagA = await amb.pagina();
  await prepararPagina(pagA, false);
  await H.abrirApp(pagA, amb.ORIGEM);
  await pagA.evaluate(async () => {
    const d = Store.bancoVazio();
    d.alunos = [{ id: 'alfa', nome: 'Aluna Alfa Teste' }, { id: 'beta', nome: 'Aluno Beta Teste' }];
    d.aulas = [
      { id: 'aula-alfa', alunoId: 'alfa', data: '2026-10-01', hora: '10:00', duracaoMin: 60, status: 'realizada' },
      { id: 'aula-beta', alunoId: 'beta', data: '2026-10-02', hora: '11:00', duracaoMin: 60, status: 'realizada' }
    ];
    await Store.salvar(d);
  });
  await H.abrirApp(pagA, amb.ORIGEM);
  await H.irParaAba(pagA, 'ajustes');
  conf('o tablet entrou com a conta da dona', await entrarPelaTela(pagA, DONA.email, DONA.senha, '#nuvem-enviar'), true);
  const idTablet = await pagA.evaluate(() => Store.aparelho());
  conf('o tablet tem id de aparelho (nasce na primeira gravação)', /^ap[0-9a-z]+$/i.test(idTablet || ''), true);
  conf('antes de qualquer sincronização, não há diagnóstico do tablet na nuvem', (await lerDoc(dona.idToken, dona.localId, 'diagnostico/' + idTablet)).status, 404);
  /* Um erro de script no tablet ANTES do primeiro resumo: ele entra só pelo
   * nome e pelo lugar; a mensagem ("prova de erro secreta") fica fora. */
  await pagA.evaluate(() => {
    // o evento como o navegador o entrega para um erro do app.js: com o objeto do erro, o arquivo e a linha
    window.dispatchEvent(new ErrorEvent('error', { error: new TypeError('prova de erro secreta'), message: 'prova de erro secreta', filename: location.origin + '/app.js', lineno: 123 }));
  });
  await pausa(300);
  const local = await pagA.evaluate(() => Nuvem.diagnosticoLocal());
  conf('o erro de script foi anotado no diagnóstico local, com o nome do erro e o lugar', local.erroCodigo === 'SCRIPT' && local.erroFrase === 'Erro no aplicativo (TypeError em app.js:123).', true);
  conf('e SEM a mensagem do erro', JSON.stringify(local).indexOf('prova de erro secreta'), -1);
  // (controle) um erro sem objeto (script de fora, cross-origin) fica como "Erro", sem quebrar
  await pagA.evaluate(() => { setTimeout(() => { throw new TypeError('prova de erro secreta'); }, 0); });
  await pausa(300);
  const semObjeto = await pagA.evaluate(() => Nuvem.diagnosticoLocal());
  conf('(controle) um erro lançado sem objeto no evento vira "Erro no aplicativo (Erro)." e continua sem a mensagem', /^Erro no aplicativo \((Erro|TypeError)/.test(semObjeto.erroFrase || '') && JSON.stringify(semObjeto).indexOf('prova de erro secreta') < 0, true);
  await pagA.evaluate(() => {
    window.dispatchEvent(new ErrorEvent('error', { error: new TypeError('prova de erro secreta'), message: 'prova de erro secreta', filename: location.origin + '/app.js', lineno: 123 }));
  });
  await clicar(pagA, '#nuvem-enviar');
  const subiu = await esperar('a cópia subiu', () => texto(pagA, '#nuvem-ultima'), v => /^Última cópia na nuvem: hoje, \d\d:\d\d\.$/.test(v || ''), 30000);
  conf('o tablet subiu a cópia completa', subiu.ok, true);
  const diag1 = await esperar('o diagnóstico do tablet apareceu na nuvem', () => lerDoc(dona.idToken, dona.localId, 'diagnostico/' + idTablet), r => r.status === 200, 15000);
  conf('depois da primeira sincronização, o diagnóstico do tablet está em usuarios/{uid}/diagnostico/{aparelhoId}', diag1.ok, true);
  const campos1 = diag1.valor && diag1.valor.json && diag1.valor.json.fields ? diag1.valor.json.fields : {};
  const valor = (f) => f ? (f.stringValue !== undefined ? f.stringValue : f.integerValue !== undefined ? Number(f.integerValue) : f.booleanValue !== undefined ? f.booleanValue : null) : undefined;
  conf('o resumo diz a versão do aplicativo', valor(campos1.app), VERSAO);
  conf('o resumo diz que é o tablet, com o rótulo dele', valor(campos1.papel) === 'tablet' && /^tablet [0-9A-Z]{2}$/.test(valor(campos1.aparelho) || ''), true);
  // logo depois do "Enviar cópia agora" o religar pôs tudo na fila; ela sobe daqui a 2,5 s, e o resumo da reabertura (abaixo) diz 0
  conf('o resumo diz a fila (inteiro) e a quarentena (0)', Number.isInteger(valor(campos1.pendentes)) && valor(campos1.pendentes) >= 0 && valor(campos1.quarentena) === 0, true);
  conf('o resumo diz a hora da cópia completa e a hora do resumo', /^\d{4}-\d\d-\d\dT/.test(valor(campos1.ultimaCopia) || '') && /^\d{4}-\d\d-\d\dT/.test(valor(campos1.quando) || ''), true);
  conf('o resumo diz o navegador e se está instalado, e o resultado do persist()', valor(campos1.navegador) === 'Chrome' && valor(campos1.instalado) === false && typeof valor(campos1.persistente) === 'boolean', true);
  conf('o resumo leva o erro de script pelo nome e pelo lugar', valor(campos1.erroCodigo) === 'SCRIPT' && /^Erro no aplicativo \(TypeError/.test(valor(campos1.erroFrase) || '') && valor(campos1.erroOrigem) === 'script', true);
  const textoDiag1 = JSON.stringify(campos1);
  conf('o resumo não tem nome de criança, aula, nem a mensagem do erro', /Alfa|Beta|aula-|alunoId|prova de erro/.test(textoDiag1), false);
  const CAMPOS_DAS_REGRAS = ['aparelhoId', 'aparelho', 'papel', 'app', 'quando', 'pendentes', 'quarentena', 'ultimoEnvio', 'ultimoRecebimento', 'ultimaCopia',
    'sincronizacao', 'navegador', 'instalado', 'persistente', 'erroCodigo', 'erroFrase', 'erroQuando', 'erroOrigem'];
  conf('os campos do resumo são só os que as regras conhecem', Object.keys(campos1).filter(k => CAMPOS_DAS_REGRAS.indexOf(k) < 0).join(','), '');
  const updateTime1 = diag1.valor.json.updateTime;
  conf('o aparelho anotou a subida no banco próprio (hora e assinatura), para subir só quando muda', await lerEstadoDaNuvem(pagA, 'diagnostico').then(d => !!(d && d.quando && d.assinatura)), true);
  // no máximo um por hora: o resumo muda (a versão informada), mas a última subida acabou de acontecer
  await pausa(3500); // o envio de registros agendado pelo "Enviar cópia agora" passa e tenta o resumo de novo
  const pulado = await pagA.evaluate(() => { Nuvem.informar({ versaoApp: 'prova-mudou' }); return Nuvem.gravarDiagnostico(); });
  conf('mudou, mas a última subida tem menos de uma hora: o resumo NÃO sobe de novo', pulado && pulado.pulado, 'hora');
  conf('o documento na nuvem continua o mesmo', (await lerDoc(dona.idToken, dona.localId, 'diagnostico/' + idTablet)).json.updateTime, updateTime1);
  await pagA.evaluate(v => Nuvem.informar({ versaoApp: v }), VERSAO);
  /* Passada uma hora (a anotação no banco próprio envelhecida duas horas, com
   * outra assinatura), o resumo sobe; logo depois, sem mudança, "igual". */
  const envelhecer = () => gravarEstadoDaNuvem(pagA, 'diagnostico', { quando: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), assinatura: 'outra' });
  conf('(arranjo) a anotação da última subida foi envelhecida duas horas', await envelhecer(), true);
  conf('passada uma hora e com mudança, o resumo sobe', await pagA.evaluate(() => Nuvem.gravarDiagnostico()).then(r => r && r.gravado), true);
  const updateTime2 = (await lerDoc(dona.idToken, dona.localId, 'diagnostico/' + idTablet)).json.updateTime;
  conf('o documento na nuvem mudou', updateTime2 !== updateTime1, true);
  conf('sem mudança nenhuma, "igual" e nada sobe', await pagA.evaluate(() => Nuvem.gravarDiagnostico()).then(r => (r && r.pulado) || r), 'igual');
  conf('o documento continua o da segunda subida', (await lerDoc(dona.idToken, dona.localId, 'diagnostico/' + idTablet)).json.updateTime, updateTime2);
  /* Reaberto (envelhecida de novo a anotação), o tablet sobe o resumo na
   * sincronização da abertura; o erro de script era da abertura anterior. */
  conf('(arranjo) envelhecida de novo', await envelhecer(), true);
  await H.abrirApp(pagA, amb.ORIGEM);
  const diag2 = await esperar('o resumo subiu de novo na abertura', () => lerDoc(dona.idToken, dona.localId, 'diagnostico/' + idTablet), r => r.status === 200 && r.json.updateTime !== updateTime2, 20000);
  conf('reaberto, o resumo sobe na sincronização da abertura', diag2.ok, true);
  const campos2 = diag2.ok ? diag2.valor.json.fields : {};
  conf('o resumo novo não traz mais o erro de script (era da abertura anterior) e diz a última sincronização', campos2.erroCodigo === undefined && /^\d{4}-/.test(valor(campos2.ultimoEnvio) || valor(campos2.ultimoRecebimento) || ''), true);
  conf('com a fila já subida, o resumo da reabertura diz 0 a subir', valor(campos2.pendentes), 0);

  secao('4. (c) O observador, num Safari de iPhone simulado, lê tudo e não escreve nada');
  const contextoD = await pagA.browser().createBrowserContext();
  const pagD = await contextoD.newPage();
  await prepararPagina(pagD, true);
  await H.abrirApp(pagD, amb.ORIGEM);
  conf('o aparelho do observador abriu no modo celular (tela de iPhone)', await pagD.evaluate(() => document.body.classList.contains('modo-celular')), true);
  conf('o navegador foi reconhecido como Safari iOS', await pagD.evaluate(() => Nuvem.rotuloDoNavegador()), 'Safari iOS');
  conf('o pedido de armazenamento persistente foi feito nesta abertura e o Safari simulado recusou', await esperar('persist respondeu', () => pagD.evaluate(() => Nuvem.diagnosticoLocal().persistente), v => v === false, 5000).then(r => r.ok), true);
  conf('antes de entrar, as abas do observador não aparecem', (await visivel(pagD, '[data-cel="diagnostico"]')) || (await visivel(pagD, '[data-cel="ajustes"]')), false);
  await clicar(pagD, '#cel-trazer-copia');
  conf('o observador entrou com a conta dele', await entrarPelaTela(pagD, OBS.email, OBS.senha, '#cel-trazer'), true);
  await clicar(pagD, '#cel-trazer');
  await esperar('a janela de restaurar abriu', () => existe(pagD, '#modal-nuvem-restaurar.aberto'), v => v === true, 10000);
  await digitar(pagD, '#nuvem-conta-dona', dona.localId);
  await clicar(pagD, '#nuvem-conta-dona-buscar');
  const listaDona = await esperar('a janela lista as cópias da dona', () => pagD.evaluate(() => document.querySelectorAll('#modal-nuvem-restaurar.aberto #nuvem-copias input[type=radio]').length), v => v >= 1, 15000);
  conf('com o código da conta da dona, a cópia dela aparece', listaDona.ok, true);
  const pedidosAntesD = pagD.pedidos.length;
  await clicar(pagD, '#nuvem-restaurar-confirmar');
  const trouxe = await esperar('o observador restaurou só leitura', () => pagD.evaluate(async () => !document.querySelector('#modal-nuvem-restaurar.aberto') && (await Store.carregar()).alunos.some(a => a.id === 'alfa')), v => v === true, 30000);
  conf('o observador trouxe a cópia da dona, só com o login e o código da conta', trouxe.ok, true);
  conf('o observador ficou só leitura, com a conta da dona na marca', await pagD.evaluate(u => { const e = Nuvem.estado(); return e.celular && e.observador && e.uidDona === u && !e.celularDaDona; }, dona.localId), true);
  const abas = await esperar('as abas do observador apareceram', () => pagD.evaluate(() => ({
    diag: !document.querySelector('[data-cel="diagnostico"]').hidden, aj: !document.querySelector('[data-cel="ajustes"]').hidden, env: document.querySelector('[data-cel="enviar"]').hidden })),
  v => !!v && v.diag && v.aj && v.env, 10000);
  conf('as abas Diagnóstico e Ajustes aparecem para o observador, e a Enviar (PDF às famílias) some', abas.ok, true);
  conf('a agenda (Hoje) mostra os dados da dona', await esperar('Hoje desenhou', () => texto(pagD, '#cel-hoje'), v => /Alfa|Beta|aula|Nenhuma aula/.test(v || ''), 10000).then(r => r.ok), true);

  // o painel
  await clicar(pagD, '[data-cel="diagnostico"]');
  const painel = await esperar('o painel listou o tablet da dona', () => pagD.evaluate(() => Array.from(document.querySelectorAll('#cel-diag-lista .cel-diag-frase')).map(e => e.textContent)), v => Array.isArray(v) && v.length === 1, 15000);
  conf('"Diagnóstico" lista um aparelho da dona (o tablet)', painel.ok, true);
  const frase = painel.ok ? painel.valor[0] : '';
  conf('em linguagem simples: "Tablet XX: versão N, tudo enviado, sem erro registrado."', new RegExp('^Tablet [0-9A-Z]{2}: versão ' + VERSAO.replace(/\./g, '\\.') + ', tudo enviado, sem erro registrado\\.$').test(frase), true);
  conf('o cartão do tablet diz a última sincronização, a cópia completa e quando o resumo foi enviado', /Última sincronização: hoje, \d\d:\d\d\.[\s\S]*Cópia completa: hoje, \d\d:\d\d\.[\s\S]*Resumo enviado hoje, \d\d:\d\d\./.test(await texto(pagD, '#cel-diag-lista .cel-diag-aparelho')), true);
  conf('o painel não mostra nome de criança nem aula', /Alfa|Beta|aula-alfa/.test(await texto(pagD, '#cel-diagnostico')), false);
  const este = await texto(pagD, '#cel-diag-este');
  conf('"Este aparelho (observador)": versão, Safari iOS, aberto no navegador, armazenamento recusado', new RegExp('Versão ' + VERSAO.replace(/\./g, '\\.') + ', Safari iOS, aberto no navegador\\.[\\s\\S]*Armazenamento persistente: recusado pelo navegador\\.').test(este), true);
  conf('e diz que nada daqui sobe e que tudo volta da nuvem ao abrir', /Nada deste aparelho sobe para a nuvem; o que está aqui volta da nuvem ao abrir\./.test(este), true);
  const motivos = await pagD.evaluate(() => Array.from(document.querySelectorAll('#cel-diag-este .cel-motivo-navegador')).map(e => e.textContent));
  conf('o motivo do persist() recusado aparece em uma frase', motivos.some(m => /^O Safari não garantiu o armazenamento: .*ao abrir, tudo volta da nuvem\.$/.test(m)), true);
  conf('o motivo da falta de sincronização em segundo plano aparece', motivos.some(m => /^Sem sincronização em segundo plano no Safari: os dados chegam quando o aplicativo abre, não antes\.$/.test(m)), true);
  conf('o motivo de estar fora da Tela de Início aparece, com o caminho de instalar', motivos.some(m => /^Aberto no Safari, e não pela Tela de Início: toque em Compartilhar e em "Adicionar à Tela de Início" para instalar\.$/.test(m)), true);
  conf('(controle) o tablet, em Chrome, não teria esses motivos: a sonda depende do navegador', await pagA.evaluate(() => Nuvem.rotuloDoNavegador()), 'Chrome');

  // Ajustes do observador
  await clicar(pagD, '[data-cel="ajustes"]');
  await esperar('Ajustes desenhou', () => existe(pagD, '#cel-obs-instalar'), v => v === true, 10000);
  conf('Ajustes mostra a conta do observador e que ele só lê a cópia de outra conta, com o código da dona', new RegExp('Conta: ' + OBS.email + '[\\s\\S]*só lê a cópia de outra conta \\(código da dona: ' + dona.localId + '\\)').test(await texto(pagD, '#cel-obs-conta')), true);
  conf('Ajustes traz o texto de instalação pelo Safari: Compartilhar e "Adicionar à Tela de Início"', /abra este endereço no Safari, toque em Compartilhar .* e depois em "Adicionar à Tela de Início"/.test(await texto(pagD, '#cel-obs-instalar-texto')), true);
  conf('Ajustes repete os motivos do navegador', await pagD.evaluate(() => document.querySelectorAll('#cel-obs-instalar .cel-motivo-navegador').length), 3);
  conf('Ajustes tem "Buscar de novo" e "Sair", e nenhum botão de edição', (await existe(pagD, '#cel-obs-atualizar')) && (await existe(pagD, '#cel-obs-sair')) && !(await existe(pagD, '#nuvem-passa-a-editar, #nuvem-enviar, #cel-enviar-todas')), true);

  // o fechamento
  await clicar(pagD, '[data-cel="fechamento"]');
  conf('o fechamento abre no observador', await esperar('fechamento desenhou', () => texto(pagD, '#cel-fechamento'), v => !!v && v.length > 20, 10000).then(r => r.ok), true);

  // zero commits
  await pagD.evaluate(() => Nuvem.sincronizar());
  await pausa(3000);
  const commits = commitsDe(pagD, pedidosAntesD);
  if (OBS_GRAVA) conf('VENENO visto: o observador que grava subiu o diagnóstico dele (commits saíram)', commits > 0, true);
  else conf('nenhuma escrita saiu do observador: zero commits desde a restauração', commits, 0);
  const diagDoObs = await lerDoc(obs.idToken, obs.localId, 'diagnostico');
  if (OBS_GRAVA) conf('VENENO visto: há um diagnóstico na conta do observador', ((diagDoObs.json || {}).documents || []).length > 0, true);
  else conf('a conta do observador não tem diagnóstico nenhum (ele não é dono de dado)', ((diagDoObs.json || {}).documents || []).length, 0);
  conf('o tablet continua com o seu único diagnóstico na conta da dona', (((await lerDoc(dona.idToken, dona.localId, 'diagnostico')).json || {}).documents || []).length, 1);
  if (OBS_GRAVA) conf('VENENO visto: o observador que grava também guardou a anotação de subida', await lerEstadoDaNuvem(pagD, 'diagnostico').then(d => !!d), true);
  else conf('o observador não guarda a anotação de subida do diagnóstico', await lerEstadoDaNuvem(pagD, 'diagnostico'), null);
  conf('editar no observador é recusado', await pagD.evaluate(async () => { try { await Store.salvar(await Store.carregar()); return false; } catch (e) { return !!(e && e.soLeitura); } }), true);

  secao('5. (d) Nada local que não se releia: a marca, a sessão e o que vem da nuvem');
  const chaves = await chavesDaNuvem(pagD);
  const permitidas = ['sessao', 'soLeitura', 'aparelho', 'copia', 'automatica', 'pendente', 'registros'];
  const soPermitidas = Array.isArray(chaves) && chaves.every(c => permitidas.indexOf(c) >= 0);
  if (OBS_GRAVA) conf('VENENO visto: o banco próprio do observador ganhou a chave do diagnóstico (' + JSON.stringify(chaves) + ')', soPermitidas, false);
  else conf('no banco próprio do observador só há a marca, a sessão e o espelho da cópia (' + JSON.stringify(chaves) + ')', soPermitidas, true);
  conf('a marca guarda só desde quando e de quem é a cópia', await lerEstadoDaNuvem(pagD, 'soLeitura').then(m => m && Object.keys(m).sort().join(',')), 'desde,uidDona');
  await H.abrirApp(pagD, amb.ORIGEM);
  await pagD.evaluate(() => Nuvem.pronto());
  conf('reaberto, continua observador só leitura, no modo celular', await pagD.evaluate(u => { const e = Nuvem.estado(); return e.celular && e.observador && e.uidDona === u && document.body.classList.contains('modo-celular'); }, dona.localId), true);
  const releu = await esperar('ao abrir, o observador releu os registros da nuvem', () => pagD.evaluate(() => { const r = Nuvem.estado().registros; return r.ultimoRecebimento ? r.ultimoRecebimento.quando : null; }), v => !!v, 15000);
  conf('ao abrir, o observador relê da nuvem (recebimento desta abertura)', releu.ok, true);
  conf('reaberto, o persist() foi pedido de novo e o resultado está no diagnóstico local', await esperar('persist de novo', () => pagD.evaluate(() => Nuvem.diagnosticoLocal().persistente), v => v === false, 5000).then(r => r.ok), true);
  conf('reaberto, as abas do observador continuam', await esperar('abas', () => pagD.evaluate(() => !document.querySelector('[data-cel="diagnostico"]').hidden), v => v === true, 10000).then(r => r.ok), true);
  await clicar(pagD, '[data-cel="diagnostico"]');
  conf('"Este aparelho" diz a última leitura da nuvem desta abertura', await esperar('painel', () => texto(pagD, '#cel-diag-este'), v => /Última leitura da nuvem: hoje, \d\d:\d\d\./.test(v || ''), 10000).then(r => r.ok), true);
  await pausa(2000);
  conf('depois de reabrir, continua sem commit do observador', commitsDe(pagD, pedidosAntesD), OBS_GRAVA ? commitsDe(pagD, pedidosAntesD) : 0);

  secao('6. Sem erro de página');
  conf('nenhum erro de script no observador', JSON.stringify(pagD.errosDePagina), '[]');
  conf('no tablet, só o erro plantado pela prova', JSON.stringify(pagA.errosDePagina.filter(m => m.indexOf('prova de erro secreta') < 0)), '[]');
  await contextoD.close();
})().then(() => derrubarEmulador().then(H.fim(amb)), e => derrubarEmulador().then(() => H.fim(amb)(e)));
