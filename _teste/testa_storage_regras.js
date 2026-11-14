/* testa_storage_regras.js
 *
 * Nuvem da biblioteca, PR 1: as regras do Cloud Storage (storage.rules),
 * CONTRA O EMULADOR do Storage, do Firestore e do Auth, nunca contra a
 * produção. Três contas de teste do emulador (dona, outra e observador),
 * nenhuma conta de verdade e nenhum segredo; os arquivos são bytes sintéticos.
 * Os arquivos entram no bucket do emulador pela porta de administrador
 * ("Bearer owner"), como o publicador do dono faria com a credencial dele.
 *
 * O que se prova:
 *   1. a dona baixa o próprio livro (PDF e EPUB) e o próprio pacote, byte a
 *      byte, e lê os metadados deles; listar a pasta é negado a todos, a ela
 *      também (o aplicativo sabe o nome de cada arquivo pelo catálogo);
 *   2. outra conta, com login, é NEGADA nos mesmos arquivos (ler e listar);
 *   3. sem login, é NEGADO;
 *   4. o observador listado em usuarios/{uid}/config/leitores (no Firestore,
 *      onde ele LÊ: a prova confere isso antes) é NEGADO no Storage, até o
 *      dono decidir;
 *   5. a dona, pelo aplicativo, NÃO grava: criar, sobrescrever, trocar os
 *      metadados e apagar são negados, e o arquivo fica como estava;
 *   6. caminho fora dos permitidos é NEGADO, mesmo para a dona: outra pasta,
 *      nome que não é sha256, extensão trocada, a raiz do bucket e o caminho
 *      de outra conta;
 *   7. os limites prontos para a escrita (livroValido e pacoteValido) fazem o
 *      que o cabeçalho diz: numa CÓPIA das regras, servida só ao emulador,
 *      com a escrita da dona aberta por eles, o PDF, o EPUB e o pacote certos
 *      passam; o tipo trocado, o arquivo vazio, o nome que não é sha256, a
 *      outra conta e a remoção são negados. O storage.rules do repositório
 *      nunca é tocado.
 *
 * Venenos (a prova TEM de ver o defeito e passa dizendo que viu):
 *   --envenenado-outra-conta  a leitura vale para qualquer conta com login
 *                             (2 e 4 veem);
 *   --envenenado-sem-login    a leitura vale até sem login (2, 3 e 4 veem);
 *   --envenenado-escrita      a dona grava pelo aplicativo (5 vê);
 *   --envenenado-nome-livre   a leitura da dona não confere o nome do arquivo
 *                             (sha256 e extensão da pasta): 6 vê;
 *   --envenenado-leitor-le    o observador da lista de leitores lê os livros,
 *                             pela leitura cruzada do Firestore (4 vê; prova
 *                             que o observador da seção 4 é de verdade).
 *
 * Precisa do firebase-tools fora do repositório (FIREBASE_TOOLS) e de um JDK
 * 21 em JAVA_HOME, como o testa_nuvem.js; sem eles, REPROVA dizendo onde
 * procurou. Portas: 9051 (auth), 9052 (firestore), 9053 (storage), 9054 (hub),
 * 9055 (log), 9056 (websocket).
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const FIREBASE = process.env.FIREBASE_TOOLS ||
  'C:/Users/romul/ferramentas/firebase-tools/node_modules/firebase-tools/lib/bin/firebase.js';
const JAVA_HOME = process.env.JAVA_HOME || '';
const PORTA_AUTH = 9051, PORTA_FS = 9052, PORTA_ST = 9053, PORTA_HUB = 9054, PORTA_LOG = 9055, PORTA_WS = 9056;
const PROJETO = 'demo-nath-storage';
const BUCKET = PROJETO + '.appspot.com';
const AUTH = 'http://127.0.0.1:' + PORTA_AUTH;
const FS = 'http://127.0.0.1:' + PORTA_FS;
const ST = 'http://127.0.0.1:' + PORTA_ST;
const DOCS = FS + '/v1/projects/' + PROJETO + '/databases/(default)/documents';

const REGRAS = fs.readFileSync(path.join(RAIZ, 'storage.rules'), 'utf8').replace(/\r\n/g, '\n');
const REGRAS_FS = fs.readFileSync(path.join(RAIZ, 'firestore.rules'), 'utf8');
// cada veneno: o trecho das regras, quantas vezes ele aparece, e a troca
const VENENOS = {
  '--envenenado-outra-conta': ['allow get: if dona(uid) && nomeDe', 2, 'allow get: if entrou() && nomeDe'],
  '--envenenado-sem-login': ['allow get: if dona(uid) && nomeDe', 2, 'allow get: if true && nomeDe'],
  '--envenenado-escrita': ['      allow write: if false;\n', 2, '      allow write: if dona(uid);\n'],
  '--envenenado-nome-livre': [') && nomeDe', 2, ') || false && nomeDe'],
  '--envenenado-leitor-le': ['allow get: if dona(uid) && nomeDeLivro(arquivo);', 1,
    'allow get: if (dona(uid) || (entrou() && request.auth.uid in firestore.get(/databases/(default)/documents/usuarios/$(uid)/config/leitores).data.uids)) && nomeDeLivro(arquivo);']
};
const MODO = Object.keys(VENENOS).filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && !VENENOS[a]);
const REGRAS_SERVIDAS = MODO ? REGRAS.split(VENENOS[MODO][0]).join(VENENOS[MODO][2]) : REGRAS;

let passes = 0, falhas = 0, vistos = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + String(obtido).slice(0, 400) + ' | esperado: ' + esperado + ']'));
  return ok;
}
// um caso que um veneno vira: no modo dele, o esperado é o defeito, e a linha diz que viu
function caso(rotulo, obtido, esperado, viraCom, comVeneno) {
  if (MODO && viraCom.indexOf(MODO) !== -1) {
    if (conf('VENENO visto: ' + rotulo, obtido, comVeneno)) vistos++;
    return;
  }
  conf(rotulo, obtido, esperado);
}
const secao = t => console.log('\n=== ' + t + ' ===');
const pausa = ms => new Promise(r => setTimeout(r, ms));

/* ---------- o emulador ---------- */
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'storage_regras_'));
const PASTA = path.join(TMP, 'emulador');
let emulador = null;
function subirEmulador() {
  fs.mkdirSync(PASTA, { recursive: true });
  fs.writeFileSync(path.join(PASTA, 'storage.rules'), REGRAS_SERVIDAS);
  fs.writeFileSync(path.join(PASTA, 'firestore.rules'), REGRAS_FS);
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
  emulador.saida = () => saida;
  return (async () => {
    const fim = Date.now() + 180000;
    while (Date.now() < fim) {
      if (emulador.saiu !== undefined) throw new Error('o emulador saiu: ' + saida.slice(-1500));
      const a = await fetch(AUTH + '/').then(r => r.json()).catch(() => null);
      const f = await fetch(FS + '/').then(r => r.status).catch(() => 0);
      const s = await fetch(ST + '/').then(r => r.status).catch(() => 0);
      if (a && a.authEmulator && a.authEmulator.ready && f === 200 && s > 0 && /All emulators ready/i.test(saida)) return;
      await pausa(500);
    }
    console.log(saida.slice(-1500));
    throw new Error('o emulador não subiu');
  })();
}
// um emulador que já responde nas portas é de outra rodada: a prova falaria com ele
async function portasLivres() {
  for (const u of [AUTH, FS, ST]) if (await fetch(u + '/').then(r => r.status).catch(() => 0)) return false;
  return true;
}
function derrubarEmulador() {
  return new Promise(resolve => {
    if (!emulador || emulador.saiu !== undefined) { resolve(); return; }
    emulador.on('exit', () => resolve());
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(emulador.pid), '/T', '/F'], { stdio: 'ignore' });
    else { try { process.kill(-emulador.pid, 'SIGINT'); } catch (e) { /* já saiu */ } }
    setTimeout(() => { if (process.platform !== 'win32') { try { process.kill(-emulador.pid, 'SIGKILL'); } catch (e) { /* já saiu */ } } resolve(); }, 8000);
  });
}

/* ---------- REST: Auth, Firestore e Storage ---------- */
async function pedir(url, opcoes) {
  opcoes = opcoes || {};
  const cab = Object.assign({}, opcoes.cab || {});
  if (opcoes.autor) cab.Authorization = opcoes.autor;
  let corpo = opcoes.corpo;
  if (corpo !== undefined && !(corpo instanceof Buffer) && typeof corpo !== 'string') { corpo = JSON.stringify(corpo); cab['Content-Type'] = 'application/json'; }
  const r = await fetch(url, { method: opcoes.metodo || (corpo !== undefined ? 'POST' : 'GET'), headers: cab, body: corpo });
  const bytes = Buffer.from(await r.arrayBuffer());
  let json = null;
  try { json = JSON.parse(bytes.toString('utf8')); } catch (e) { json = null; }
  return { status: r.status, bytes, json };
}
const conta = (email) => pedir(AUTH + '/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake',
  { corpo: { email, password: 'senha-de-teste-1', returnSecureToken: true } }).then(r => r.json);
const daConta = c => c ? 'Firebase ' + c.idToken : null;
const enc = caminho => encodeURIComponent(caminho);
// o administrador (o publicador do dono): passa por cima das regras
const subirComoAdmin = (caminho, bytes, tipo) => pedir(ST + '/upload/storage/v1/b/' + BUCKET + '/o?uploadType=media&name=' + enc(caminho),
  { metodo: 'POST', corpo: bytes, cab: { 'Content-Type': tipo }, autor: 'Bearer owner' });
const lerComoAdmin = caminho => pedir(ST + '/storage/v1/b/' + BUCKET + '/o/' + enc(caminho) + '?alt=media', { autor: 'Bearer owner' });
// o aplicativo: a API do Firebase Storage, com o token da conta (ou sem nenhum)
const ler = (caminho, c) => pedir(ST + '/v0/b/' + BUCKET + '/o/' + enc(caminho) + '?alt=media', { autor: daConta(c) });
const metadados = (caminho, c) => pedir(ST + '/v0/b/' + BUCKET + '/o/' + enc(caminho), { autor: daConta(c) });
const listar = (prefixo, c) => pedir(ST + '/v0/b/' + BUCKET + '/o?prefix=' + enc(prefixo) + '&delimiter=' + enc('/'), { autor: daConta(c) });
const gravar = (caminho, bytes, tipo, c) => pedir(ST + '/v0/b/' + BUCKET + '/o?name=' + enc(caminho),
  { metodo: 'POST', corpo: bytes, cab: { 'Content-Type': tipo }, autor: daConta(c) });
const trocarMetadados = (caminho, c) => pedir(ST + '/v0/b/' + BUCKET + '/o/' + enc(caminho),
  { metodo: 'PATCH', corpo: { contentType: 'application/pdf', metadata: { troca: 'sim' } }, autor: daConta(c) });
const apagar = (caminho, c) => pedir(ST + '/v0/b/' + BUCKET + '/o/' + enc(caminho), { metodo: 'DELETE', autor: daConta(c) });

const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const sintetico = (rotulo, n) => Buffer.from(rotulo + ' ' + 'x'.repeat(n));

(async () => {
  secao('0. A prova se confere');
  conf('nenhum veneno desconhecido foi pedido', desconhecidos.join(','), '');
  for (const m of Object.keys(VENENOS)) {
    const [de, vezes] = VENENOS[m];
    conf('a âncora de ' + m + ' aparece ' + vezes + ' vez(es) no storage.rules', REGRAS.split(de).length - 1, vezes);
  }
  conf('o firebase-tools está onde a prova procura (' + FIREBASE + ')', fs.existsSync(FIREBASE), true);
  const javaExe = JAVA_HOME ? path.join(JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java';
  const vj = /version "(\d+)/.exec(((r) => (r.stderr || '') + (r.stdout || ''))(spawnSync(javaExe, ['-version'], { encoding: 'utf8' })));
  conf('há um JDK 21 ou mais novo (' + (JAVA_HOME || 'java do PATH') + ')', !!vj && Number(vj[1]) >= 21, true);
  // o cabeçalho documenta os caminhos e a escrita fechada
  conf('o cabeçalho do storage.rules documenta os três caminhos',
    ['usuarios/{uid}/livros/{sha256}.pdf', 'usuarios/{uid}/livros/{sha256}.epub', 'usuarios/{uid}/pacotes/{sha256}.zip'].every(s => REGRAS.indexOf(s) !== -1), true);
  conf('as regras sem veneno nunca leem o Firestore (o observador não lê o Storage)', /firestore\.(get|exists)\(/.test(REGRAS), false);
  if (falhas) return fim();
  conf('as portas da prova estão livres (nenhum emulador de outra rodada)', await portasLivres(), true);
  if (falhas) return fim();

  await subirEmulador();

  const dona = await conta('dona@exemplo.test');
  const outra = await conta('outra@exemplo.test');
  const obs = await conta('observador@exemplo.test');
  conf('as três contas de teste nasceram no emulador', [dona, outra, obs].every(c => c && c.localId && c.idToken), true);
  const U = dona.localId;

  // o observador na lista de leitores dela, no Firestore (escrito como administrador)
  const lei = await pedir(DOCS + '/usuarios/' + U + '/config/leitores', { metodo: 'PATCH', autor: 'Bearer owner',
    corpo: { fields: { uids: { arrayValue: { values: [{ stringValue: obs.localId }] } } } } });
  conf('o documento de leitores foi gravado com o observador', lei.status, 200);
  const leiObs = await pedir(DOCS + '/usuarios/' + U + '/config/leitores', { autor: 'Bearer ' + obs.idToken });
  conf('no Firestore, o observador LÊ o caminho dela (ele é observador de verdade)', leiObs.status, 200);
  const leiOutra = await pedir(DOCS + '/usuarios/' + U + '/config/leitores', { autor: 'Bearer ' + outra.idToken });
  conf('no Firestore, a outra conta não lê (controle)', leiOutra.status, 403);

  // os arquivos dela, pelo administrador
  const PDF = sintetico('%PDF-1.4 livro sintético', 3000), EPUB = sintetico('PK epub sintético', 2000), ZIP = sintetico('PK pacote sintético', 1500);
  const LIVRO = 'usuarios/' + U + '/livros/' + sha(PDF) + '.pdf';
  const LIVRO_EPUB = 'usuarios/' + U + '/livros/' + sha(EPUB) + '.epub';
  const PACOTE = 'usuarios/' + U + '/pacotes/' + sha(ZIP) + '.zip';
  const FORA = {
    'outra pasta embaixo do uid dela': ['usuarios/' + U + '/anexos/' + sha(PDF) + '.pdf', 'application/pdf'],
    'nome de livro que não é sha256': ['usuarios/' + U + '/livros/meu-livro.pdf', 'application/pdf'],
    'sha256 em maiúsculas': ['usuarios/' + U + '/livros/' + sha(PDF).toUpperCase() + '.pdf', 'application/pdf'],
    'livro com extensão de pacote': ['usuarios/' + U + '/livros/' + sha(ZIP) + '.zip', 'application/zip'],
    'pacote com extensão de livro': ['usuarios/' + U + '/pacotes/' + sha(PDF) + '.pdf', 'application/pdf'],
    'subpasta dentro de livros': ['usuarios/' + U + '/livros/extra/' + sha(PDF) + '.pdf', 'application/pdf'],
    'a raiz do bucket': [sha(PDF) + '.pdf', 'application/pdf'],
    'o documento do usuário, fora das pastas': ['usuarios/' + U + '/' + sha(PDF) + '.pdf', 'application/pdf']
  };
  const semeados = [[LIVRO, PDF, 'application/pdf'], [LIVRO_EPUB, EPUB, 'application/epub+zip'], [PACOTE, ZIP, 'application/zip']]
    .concat(Object.values(FORA).map(([c, t]) => [c, PDF, t]));
  let semeouTudo = true;
  for (const [c, b, t] of semeados) {
    const r = await subirComoAdmin(c, b, t);
    if (r.status !== 200) { semeouTudo = false; console.log('    semear ' + c + ': ' + r.status + ' ' + r.bytes.toString('utf8').slice(0, 300)); }
  }
  conf('o administrador subiu os ' + semeados.length + ' arquivos sintéticos (passa por cima das regras)', semeouTudo, true);
  const conferido = await lerComoAdmin(LIVRO);
  conf('o administrador lê o livro de volta, byte a byte', conferido.status + '|' + conferido.bytes.equals(PDF), '200|true');
  if (falhas) return fim();

  secao('1. A dona lê o que é dela');
  for (const [rot, c, b] of [['o livro em PDF', LIVRO, PDF], ['o livro em EPUB', LIVRO_EPUB, EPUB], ['o pacote', PACOTE, ZIP]]) {
    const r = await ler(c, dona);
    conf('a dona lê ' + rot + ', byte a byte', r.status + '|' + r.bytes.equals(b), '200|true');
    const m = await metadados(c, dona);
    conf('a dona lê os metadados ' + rot.replace(/^o /, 'do '), m.status + '|' + (m.json && m.json.size), '200|' + b.length);
  }
  // listar é negado a todos: o aplicativo sabe o nome pelo catálogo
  conf('a dona não lista a pasta dos livros (ler é só baixar pelo nome)', (await listar('usuarios/' + U + '/livros/', dona)).status, 403);
  conf('a dona não lista a pasta dos pacotes', (await listar('usuarios/' + U + '/pacotes/', dona)).status, 403);

  secao('2. Outra conta, com login, é negada');
  const OUTRA = ['--envenenado-outra-conta', '--envenenado-sem-login'];
  for (const [rot, c] of [['o livro em PDF', LIVRO], ['o livro em EPUB', LIVRO_EPUB], ['o pacote', PACOTE]]) {
    caso('outra conta não lê ' + rot + ' dela', (await ler(c, outra)).status, 403, OUTRA, 200);
    caso('outra conta não lê os metadados ' + rot.replace(/^o /, 'do '), (await metadados(c, outra)).status, 403, OUTRA, 200);
  }
  conf('outra conta não lista a pasta dos livros dela', (await listar('usuarios/' + U + '/livros/', outra)).status, 403);
  conf('outra conta não lista a pasta dos pacotes dela', (await listar('usuarios/' + U + '/pacotes/', outra)).status, 403);

  secao('3. Sem login, é negado');
  const SEM = ['--envenenado-sem-login'];
  for (const [rot, c] of [['o livro em PDF', LIVRO], ['o livro em EPUB', LIVRO_EPUB], ['o pacote', PACOTE]]) {
    caso('sem login, não lê ' + rot, (await ler(c, null)).status, 403, SEM, 200);
    caso('sem login, não lê os metadados ' + rot.replace(/^o /, 'do '), (await metadados(c, null)).status, 403, SEM, 200);
  }
  conf('sem login, não lista a pasta dos livros', (await listar('usuarios/' + U + '/livros/', null)).status, 403);
  const tokenFalso = { idToken: 'nao-e-um-token' };
  caso('com um token que não é token, não lê o livro', [401, 403].indexOf((await ler(LIVRO, tokenFalso)).status) !== -1, true, SEM, false);

  secao('4. O observador da lista de leitores é negado no Storage');
  const OBS_LIVRO = ['--envenenado-outra-conta', '--envenenado-sem-login', '--envenenado-leitor-le'];
  caso('o observador não lê o livro em PDF', (await ler(LIVRO, obs)).status, 403, OBS_LIVRO, 200);
  caso('o observador não lê o livro em EPUB', (await ler(LIVRO_EPUB, obs)).status, 403, OBS_LIVRO, 200);
  caso('o observador não lê o pacote', (await ler(PACOTE, obs)).status, 403, OUTRA, 200);
  conf('o observador não lista a pasta dos livros', (await listar('usuarios/' + U + '/livros/', obs)).status, 403);

  secao('5. A dona não grava pelo aplicativo');
  const ESC = ['--envenenado-escrita'];
  const NOVO_PDF = sintetico('%PDF-1.4 livro novo', 900);
  const NOVO = 'usuarios/' + U + '/livros/' + sha(NOVO_PDF) + '.pdf';
  const NOVO_ZIP = sintetico('PK pacote novo', 700);
  const NOVO_PACOTE = 'usuarios/' + U + '/pacotes/' + sha(NOVO_ZIP) + '.zip';
  caso('a dona não cria um livro novo', (await gravar(NOVO, NOVO_PDF, 'application/pdf', dona)).status, 403, ESC, 200);
  caso('a dona não cria um pacote novo', (await gravar(NOVO_PACOTE, NOVO_ZIP, 'application/zip', dona)).status, 403, ESC, 200);
  if (MODO !== '--envenenado-escrita') {
    conf('o livro novo não apareceu no bucket', (await lerComoAdmin(NOVO)).status, 404);
  }
  const OUTROS = sintetico('%PDF-1.4 por cima', 50);
  caso('a dona não sobrescreve o livro que existe', (await gravar(LIVRO, OUTROS, 'application/pdf', dona)).status, 403, ESC, 200);
  caso('a dona não sobrescreve o pacote que existe', (await gravar(PACOTE, OUTROS, 'application/zip', dona)).status, 403, ESC, 200);
  caso('a dona não troca os metadados do livro', (await trocarMetadados(LIVRO_EPUB, dona)).status, 403, ESC, 200);
  if (MODO !== '--envenenado-escrita') {
    const depois = await lerComoAdmin(LIVRO);
    conf('o livro ficou byte a byte como estava', depois.status + '|' + depois.bytes.equals(PDF), '200|true');
  }
  caso('a dona não apaga o pacote', (await apagar(PACOTE, dona)).status, 403, ESC, 204);
  caso('a dona não apaga o livro em EPUB', (await apagar(LIVRO_EPUB, dona)).status, 403, ESC, 204);
  if (MODO !== '--envenenado-escrita') {
    const ficou = await lerComoAdmin(PACOTE);
    conf('o pacote continua no bucket, byte a byte', ficou.status + '|' + ficou.bytes.equals(ZIP), '200|true');
  }
  // as outras contas também não gravam (nem no modo envenenado: a escrita aberta é só da dona)
  conf('outra conta não grava no caminho dela', (await gravar(NOVO, NOVO_PDF, 'application/pdf', outra)).status, 403);
  conf('sem login, não grava no caminho dela', (await gravar(NOVO, NOVO_PDF, 'application/pdf', null)).status, 403);
  conf('o observador não grava no caminho dela', (await gravar(NOVO, NOVO_PDF, 'application/pdf', obs)).status, 403);
  const PROPRIO = 'usuarios/' + outra.localId + '/livros/' + sha(NOVO_PDF) + '.pdf';
  caso('nem a outra conta grava no caminho dela mesma', (await gravar(PROPRIO, NOVO_PDF, 'application/pdf', outra)).status, 403, ESC, 200);

  secao('6. Caminho fora dos permitidos é negado, mesmo para a dona');
  // os quatro primeiros nomes errados moram nas pastas de livros e de pacotes: a escrita aberta (veneno) os aceitaria
  const NA_PASTA = ['nome de livro que não é sha256', 'sha256 em maiúsculas', 'livro com extensão de pacote', 'pacote com extensão de livro'];
  for (const [rot, [c, t]] of Object.entries(FORA)) {
    caso('a dona não lê: ' + rot, (await ler(c, dona)).status, 403, NA_PASTA.indexOf(rot) !== -1 ? ['--envenenado-nome-livre'] : [], 200);
    caso('a dona não grava: ' + rot, (await gravar(c, OUTROS, t, dona)).status, 403, NA_PASTA.indexOf(rot) !== -1 ? ESC : [], 200);
  }
  conf('a dona não lista a raiz do bucket', (await listar('', dona)).status, 403);
  conf('a dona não lista a pasta do usuário fora de livros e pacotes', (await listar('usuarios/' + U + '/', dona)).status, 403);
  // o caminho de outra conta não é dela, mesmo com nome certo
  const sub = await subirComoAdmin(PROPRIO.replace(sha(NOVO_PDF), sha(PDF)), PDF, 'application/pdf');
  conf('(o livro da outra conta foi semeado)', sub.status, 200);
  caso('a dona não lê o livro guardado no caminho da outra conta', (await ler(PROPRIO.replace(sha(NOVO_PDF), sha(PDF)), dona)).status, 403, OUTRA, 200);

  secao('7. Os limites prontos para a escrita (livroValido e pacoteValido) funcionam');
  // as regras do emulador são trocadas por uma cópia com a escrita aberta PELOS LIMITES (nunca o storage.rules do
  // repositório): o emulador relê o arquivo sozinho; a prova espera a troca valer antes de conferir
  // (a primeira escrita fechada é a dos livros, a segunda a dos pacotes; a regra final é "read, write")
  const ABERTA = REGRAS_SERVIDAS
    .replace('nomeDeLivro(arquivo);\n      allow write: if false;', 'nomeDeLivro(arquivo);\n      allow write: if dona(uid) && livroValido(arquivo);')
    .replace('nomeDePacote(arquivo);\n      allow write: if false;', 'nomeDePacote(arquivo);\n      allow write: if dona(uid) && pacoteValido(arquivo);');
  if (MODO === '--envenenado-escrita' || MODO === '--envenenado-nome-livre') {
    conf('(neste veneno a seção 7 não roda: as regras servidas já estão trocadas)', true, true);
  } else {
    conf('a cópia com a escrita aberta pelos limites foi montada', ABERTA !== REGRAS_SERVIDAS && ABERTA.split('Valido(arquivo);').length - 1, 2);
    fs.writeFileSync(path.join(PASTA, 'storage.rules'), ABERTA);
    const L1 = sintetico('%PDF-1.4 limite', 400);
    const C1 = 'usuarios/' + U + '/livros/' + sha(L1) + '.pdf';
    let valeu = false;
    for (let i = 0; i < 60 && !valeu; i++) {
      valeu = (await gravar(C1, L1, 'application/pdf', dona)).status === 200;
      if (!valeu) await pausa(500);
    }
    conf('com a escrita aberta pelos limites, a dona grava um PDF certo (a troca das regras valeu)', valeu, true);
    const L2 = sintetico('PK epub limite', 300), L3 = sintetico('PK pacote limite', 300);
    conf('grava um EPUB certo', (await gravar('usuarios/' + U + '/livros/' + sha(L2) + '.epub', L2, 'application/epub+zip', dona)).status, 200);
    conf('grava um pacote certo', (await gravar('usuarios/' + U + '/pacotes/' + sha(L3) + '.zip', L3, 'application/zip', dona)).status, 200);
    conf('o PDF com o tipo de EPUB é negado', (await gravar('usuarios/' + U + '/livros/' + sha(L1) + '.pdf', L1, 'application/epub+zip', dona)).status, 403);
    conf('o EPUB com o tipo de PDF é negado', (await gravar('usuarios/' + U + '/livros/' + sha(L2) + '.epub', L2, 'application/pdf', dona)).status, 403);
    conf('o livro com tipo qualquer é negado', (await gravar('usuarios/' + U + '/livros/' + sha(L1) + '.pdf', L1, 'text/html', dona)).status, 403);
    conf('o pacote com tipo que não é zip é negado', (await gravar('usuarios/' + U + '/pacotes/' + sha(L3) + '.zip', L3, 'application/pdf', dona)).status, 403);
    conf('o arquivo vazio é negado', (await gravar('usuarios/' + U + '/livros/' + sha(Buffer.alloc(0)) + '.pdf', Buffer.alloc(0), 'application/pdf', dona)).status, 403);
    conf('o nome que não é sha256 é negado', (await gravar('usuarios/' + U + '/livros/meu-livro.pdf', L1, 'application/pdf', dona)).status, 403);
    conf('outra conta segue negada', (await gravar('usuarios/' + U + '/livros/' + sha(L1) + '.pdf', L1, 'application/pdf', outra)).status, 403);
    conf('apagar segue negado (sem arquivo novo, os limites negam)', (await apagar(C1, dona)).status, 403);
    conf('os números dos limites são os documentados: 200 MiB o livro, 100 MiB o pacote',
      /request\.resource\.size <= 200 \* 1024 \* 1024/.test(REGRAS) + '|' + /request\.resource\.size <= 100 \* 1024 \* 1024/.test(REGRAS), 'true|true');
  }

  if (MODO) conf('o veneno pedido foi visto pela seção dele', vistos > 0 ? 'visto' : 'não visto', 'visto');
  return fim();
})().catch(e => { console.error('erro:', e && e.stack || e); falhas++; return fim(); });

async function fim() {
  await derrubarEmulador();
  if (falhas && emulador && emulador.saida) console.log(emulador.saida().slice(-1200));
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* o log do emulador pode estar preso */ }
  if (MODO) console.log('\nmodo ' + MODO);
  console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
  process.exit(falhas || !passes ? 1 : 0);
}
