/* testa_nuvem.js
 *
 * Fase 0 da nuvem (N0), contra o Firebase Emulator Suite (Auth e Firestore),
 * em três partes:
 *
 *   (a) as regras do firestore.rules nos três casos, lendo e escrevendo: a
 *       dona lê e escreve o caminho dela; o observador só lê, e só depois de
 *       entrar no documento de leitores; um estranho não lê nem escreve, com
 *       ou sem login;
 *   (b) ida e volta: o aparelho A entra, cria dados fictícios, sobe a cópia e
 *       mostra "Última cópia na nuvem: hoje, HH:MM"; o aparelho B entra, toca
 *       em "Restaurar neste aparelho" (só o login: sem chave, sem código) e
 *       os dados batem com os de A. Depois, a cópia automática ao fechar sobe
 *       de B, a anterior fica, e a mais velha sai da nuvem;
 *   (c) a cópia na nuvem é o próprio .zip, em partes de bytes, e quem a lê é
 *       quem as regras deixam: a dona e o observador permitido leem, o
 *       estranho e o observador sem permissão não; só a dona escreve, e um
 *       registro com campo a mais é recusado (decisão do dono de 08/11/2026:
 *       sem cifra no aparelho; o que protege é o login, a senha e as regras).
 *
 * Mais a troca de senha (a antiga deixa de entrar) e o "Esqueci a senha" (o
 * emulador registra o pedido de redefinição).
 *
 * Modos envenenados, que TÊM de ser vistos pela prova:
 *   --envenenado-regra-aberta  as regras deixam qualquer conta ler; a parte
 *                              (a) tem de acusar no estranho e no observador
 *                              ainda não permitido.
 *   --envenenado-leitor-escreve  as regras deixam quem lê escrever os
 *                              registros; a parte (a) tem de acusar no
 *                              observador permitido.
 *   --envenenado-observador-edita  o app.js servido deixa o observador de
 *                              outra conta, em tela larga, "passar a editar";
 *                              a seção 5b tem de acusar (o botão aparece e a
 *                              marca cai).
 *
 * O que a prova precisa na máquina, e diz onde procurou quando falta:
 *   - firebase-tools instalado FORA do repositório (npm, em
 *     C:\Users\romul\ferramentas\firebase-tools), ou o caminho do firebase.js
 *     em FIREBASE_TOOLS;
 *   - um JDK 21 ou mais novo em JAVA_HOME (o firebase-tools 15 exige 21; a
 *     máquina tem o Java 8 no PATH, que não serve). Um JDK portátil, só
 *     descompactado, basta.
 * Portas desta prova: 8871 (app), 8873 (auth), 8874 (firestore), 8875 (hub),
 * 8876 (log), 8877 (websocket do emulador). Nunca a 8777 do portão.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const MODO = ['--envenenado-leitor-escreve', '--envenenado-regra-aberta', '--envenenado-sobe-vazio', '--envenenado-observador-edita',
  '--envenenado-anterior-cega', '--envenenado-pendente-zerado'].filter(m => process.argv.indexOf(m) !== -1)[0] || '';
/* N0b (08/11): --envenenado-pendente-zerado volta a regra que zerava `pendente`
 * no fim do envio sem olhar se houve gravação DURANTE o envio; a edição feita
 * enquanto a cópia sobe ficava fora da nuvem até a próxima edição. A prova da
 * gravação no meio do envio tem de acusar. */
const PENDENTE_ZERADO = MODO === '--envenenado-pendente-zerado';
/* Segunda rodada da revisão (07/11): --envenenado-anterior-cega volta a regra
 * de ed7415e, em que a rotação só olhava o conteúdo quando a NOVA era vazia;
 * com atual vazia e anterior boa, a próxima cópia com conteúdo apagava a boa.
 * A prova "a boa fica, a vazia sai" tem de acusar. */
const ANTERIOR_CEGA = MODO === '--envenenado-anterior-cega';
const LEITOR_ESCREVE = MODO === '--envenenado-leitor-escreve';
const OBSERVADOR_EDITA = MODO === '--envenenado-observador-edita';
const REGRA_ABERTA = MODO === '--envenenado-regra-aberta';
/* O médio da revisão adversarial (07/11):
 *   --envenenado-sobe-vazio      o nuvem.js servido deixa a automática subir
 *                                o banco vazio por cima da cópia boa e o
 *                                "Apagar tudo" não desliga a automática; a
 *                                prova do apagar tudo tem de acusar. */
const SOBE_VAZIO = MODO === '--envenenado-sobe-vazio';

const PORTA_APP = 8871, PORTA_AUTH = 8873, PORTA_FS = 8874, PORTA_HUB = 8875, PORTA_LOG = 8876, PORTA_WS = 8877;
const PROJETO = 'demo-nath-n0';
const AUTH = 'http://127.0.0.1:' + PORTA_AUTH;
const FS = 'http://127.0.0.1:' + PORTA_FS;
const FIREBASE = process.env.FIREBASE_TOOLS ||
  'C:/Users/romul/ferramentas/firebase-tools/node_modules/firebase-tools/lib/bin/firebase.js';
const JAVA_HOME = process.env.JAVA_HOME || '';

const DONA = { email: 'dona@exemplo.test', senha: 'senha-da-dona-1' };
const OBS = { email: 'observador@exemplo.test', senha: 'senha-do-observador-1' };
const ESTRANHO = { email: 'estranho@exemplo.test', senha: 'senha-do-estranho-1' };
const SENHA_NOVA = 'senha-nova-da-dona-2';

const NUVEM = fs.readFileSync(path.join(H.RAIZ, 'nuvem.js'), 'utf8');
const REGRAS = fs.readFileSync(path.join(H.RAIZ, 'firestore.rules'), 'utf8');

/* ---------- âncoras dos venenos ---------- */
// desde a N1 a leitura e decidida numa funcao so, podeLer, usada em cada caminho
const LEITURA = 'return dona(uid) || leitor(uid);';
// so a dona escreve registro, e com a forma conferida; o veneno abre a escrita a quem le
const ESCRITA_REGISTRO = 'allow create, update: if dona(uid) && registroValido(registro);';
const INDEX = fs.readFileSync(path.join(H.RAIZ, 'index.html'), 'utf8');

secao('0. As âncoras e o ambiente');
conf('o nuvem.js não cifra nem guarda chave (decisão do dono de 08/11: sem cifra)', /subtle\.|AES-GCM|gerarChave|verChave|lerQr|chaveBruta/.test(NUVEM), false);
conf('a chave antiga guardada no apoio-nuvem é apagada ao abrir, num lugar só', NUVEM.split("if (v[1]) pendencias.push(gravarEstado('chave', null)").length, 2);
conf('as regras só deixam a dona escrever registro, com a forma conferida, num lugar só', REGRAS.split(ESCRITA_REGISTRO).length, 2);
conf('as regras não têm mais o campo iv (da cifra que saiu) e recusam dados em bytes no registro', !/'iv'/.test(REGRAS) && REGRAS.indexOf("!(d.dados is bytes)") > 0, true);
conf('as regras dão leitura à dona e ao leitor num lugar só', REGRAS.split(LEITURA).length, 2);
conf('as regras não têm uid fixo', /uid\s*==\s*['"]/.test(REGRAS), false);
conf('as regras só deixam a dona escrever', REGRAS.indexOf('allow write: if dona(uid);') > 0, true);

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const GUARDA_VAZIO = 'if (automatica_ && !conteudo && apontadas.some(function (c) { return c.conteudo; })) {';
// desde a N1 fatia 3 o "Apagar tudo" desliga também a sincronização, na mesma função
const DESLIGA = /automatica = false;\r?\n    sincronizacaoDesligada = true;\r?\n    var marca = ([^\r\n]*);\r?\n    return Promise\.all\(\[gravarEstado\('automatica', false\), marca\]\)/;
conf('a automática recusa banco vazio por cima de cópia com conteúdo num lugar só', NUVEM.split(GUARDA_VAZIO).length, 2);
conf('o "Apagar tudo" tem o que desligar (desligarAutomatica grava false)', DESLIGA.test(NUVEM), true);
conf('o aplicativo não tem mais chave, QR, código de recuperação nem impressão da chave',
  /verChave|lerQr|nuvem-chave|nuvem-qr|nuvem-codigo|qrcode|imprimirChave|BarcodeDetector/.test(APP + INDEX + fs.readFileSync(path.join(H.RAIZ, 'sw.js'), 'utf8')), false);
conf('o aplicativo não cria conta: nenhum signUp nem "Criar conta" no código',
  /signUp|Criar conta/i.test(NUVEM + APP + INDEX), false);

const trocas = {};
// o observador de outra conta nunca passa a editar: a decisão está numa função só, leOutraConta
const LE_OUTRA_CONTA = 'return !!(est && est.uidDona && est.entrada && est.uidDona !== est.entrada.uid);';
conf('o app.js decide "lê a cópia de outra conta" num lugar só, e o usa no botão e na função', APP.split(LE_OUTRA_CONTA).length === 2 && APP.split('leOutraConta()').length === 7, true); // a função e cinco usos (D6b: quem edita no celular)
if (OBSERVADOR_EDITA) trocas['/app.js'] = APP.replace(LE_OUTRA_CONTA, 'return false;');
if (SOBE_VAZIO) {
  trocas['/nuvem.js'] = NUVEM
    .replace(GUARDA_VAZIO, 'if (false) {')
    .replace(DESLIGA, "sincronizacaoDesligada = true;\n    var marca = $1;\n    return Promise.all([gravarEstado('automatica', automatica), marca])");
}
const ANTERIOR = 'var anterior = apontadas.filter(function (c) { return c.conteudo; })[0] || apontadas[0] || null;';
conf('a rotação escolhe a anterior pelo conteúdo num lugar só', NUVEM.split(ANTERIOR).length, 2);
if (ANTERIOR_CEGA) {
  trocas['/nuvem.js'] = NUVEM.replace(ANTERIOR,
    'var anterior = apontadas[0] || null;\n        if (!conteudo) anterior = apontadas.filter(function (c) { return c.conteudo; })[0] || anterior;');
}
const PENDENTE_POR_GERACAO = 'pendente = geracao !== geracaoDoRetrato;';
conf('o fim do envio decide o pendente pela geração num lugar só', NUVEM.split(PENDENTE_POR_GERACAO).length, 2);
conf('a geração cresce em toda gravação, antes de olhar o pendente', /geracao\+\+;\r?\n\s*if \(pendente\) return;/.test(NUVEM), true);
if (PENDENTE_ZERADO) trocas['/nuvem.js'] = NUVEM.replace(PENDENTE_POR_GERACAO, 'pendente = false;');
const regrasServidas = REGRA_ABERTA ? REGRAS.replace(LEITURA, 'return entrou();')
  : LEITOR_ESCREVE ? REGRAS.replace(ESCRITA_REGISTRO, 'allow create, update: if podeLer(uid) && registroValido(registro);') : REGRAS;
if (MODO) conf('o arquivo servido ficou diferente do repositório (' + MODO + ')', (trocas['/nuvem.js'] || NUVEM) !== NUVEM || (trocas['/app.js'] || APP) !== APP || regrasServidas !== REGRAS, true);

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
const PASTA = path.join(os.tmpdir(), 'nath_n0_emulador_' + process.pid);
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
const entrarRest = (email, senha) => rest(AUTH + '/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake',
  { corpo: { email, password: senha, returnSecureToken: true } });
const docUrl = (uid, rel) => FS + '/v1/projects/' + PROJETO + '/databases/(default)/documents/usuarios/' + uid + (rel ? '/' + rel : '');
const lerDoc = (token, uid, rel) => rest(docUrl(uid, rel), { token });
const gravarDoc = (token, uid, rel, fields) => rest(docUrl(uid, rel), { token, metodo: 'PATCH', corpo: { fields } });
const uids = (lista) => ({ uids: { arrayValue: { values: lista.map(u => ({ stringValue: u })) } } });

/* Leitura recusada: no modo regra-aberta, o que se prova é que a prova VÊ a
 * regra aberta (quem não devia ler, leu). */
function confLeituraRecusada(rotulo, status) {
  // com a regra aberta a leitura passa: 200 se o documento existe, 404 se não; nunca 403
  if (REGRA_ABERTA) conf('VENENO visto: ' + rotulo + ', e com a regra aberta leu (' + status + ')', status !== 403, true);
  else conf(rotulo, status, 403);
}
/* Escrita de quem só lê: no modo leitor-escreve, a prova tem de VER o
 * observador escrevendo registro. */
function confEscritaRecusadaAoLeitor(rotulo, status) {
  if (LEITOR_ESCREVE) conf('VENENO visto: ' + rotulo + ', e com a escrita aberta a quem lê escreveu (' + status + ')', status, 200);
  else conf(rotulo, status, 403);
}
/* Um registro com a forma que o aplicativo manda, para as provas das regras. */
function registroDeProva(id, extras) {
  const f = { id: { stringValue: id }, tipo: { stringValue: 'aluno' }, atualizadoEm: { stringValue: '2026-11-08T10:00:00.000Z' },
    aparelho: { stringValue: 'ap000000000000' }, esquema: { integerValue: '1' }, app: { stringValue: 'prova' },
    dados: { mapValue: { fields: { id: { stringValue: 'prova' }, nome: { stringValue: 'Aluna Prova Teste' } } } } };
  return Object.assign(f, extras || {});
}
void crypto;

const CFG = { auth: AUTH, firestore: FS, projectId: PROJETO };
const amb = H.criarAmbiente(PORTA_APP, 'nath_n0_nuvem', trocas);

async function prepararPagina(pag) {
  pag.setDefaultTimeout(60000);
  /* Os três aparelhos desta prova são tablets: a tela (screen) do Chrome sem
   * cabeça fora do modo móvel é 800x600, de lado menor abaixo de 640, e a
   * automática nunca sobe de tela de celular (D6). A prova põe a tela de um
   * tablet, 1280x800. */
  await pag.evaluateOnNewDocument(() => {
    Object.defineProperty(Screen.prototype, 'width', { configurable: true, get: () => 1280 });
    Object.defineProperty(Screen.prototype, 'height', { configurable: true, get: () => 800 });
  });
  pag.errosDePagina = [];
  pag.on('pageerror', e => pag.errosDePagina.push(e.message));
  // as perguntas (confirm) ficam registradas; proximoDialogo = false responde "não"
  pag.dialogos = [];
  pag.proximoDialogo = true;
  pag.on('dialog', async d => {
    pag.dialogos.push(d.message());
    try { if (pag.proximoDialogo === false) await d.dismiss(); else await d.accept(); } catch (e) { /* ok */ }
  });
  // todo pedido que sai da página, para provar que nenhum vai ao signUp
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
/* O banco próprio da nuvem (apoio-nuvem), lido e escrito por fora. */
const lerEstadoDaNuvem = (pag, chave) => pag.evaluate(c => new Promise(r => {
  const q = indexedDB.open('apoio-nuvem');
  q.onsuccess = () => { const g = q.result.transaction('estado').objectStore('estado').get(c); g.onsuccess = () => { q.result.close(); r(g.result === undefined ? null : g.result); }; g.onerror = () => r('erro'); };
  q.onerror = () => r('erro');
}), chave);
const gravarEstadoDaNuvem = (pag, chave, valor) => pag.evaluate((c, v) => new Promise(r => {
  const q = indexedDB.open('apoio-nuvem');
  q.onsuccess = () => { const t = q.result.transaction('estado', 'readwrite'); t.objectStore('estado').put(v, c); t.oncomplete = () => { q.result.close(); r(true); }; t.onerror = () => r(false); };
  q.onerror = () => r(false);
}), chave, valor);
const existe = (pag, sel) => pag.evaluate(s => !!document.querySelector(s), sel);
async function digitar(pag, sel, valor) {
  await pag.evaluate((s, v) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, sel, valor);
}
const clicar = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.click(); return true; }, sel);
async function entrarPelaTela(pag, email, senha) {
  await H.irParaAba(pag, 'ajustes');
  const form = await esperar('o cartão da nuvem pede e-mail e senha', () => existe(pag, '#nuvem-entrar'), v => v === true, 10000);
  if (!form.ok) return false;
  await digitar(pag, '#nuvem-email', email);
  await digitar(pag, '#nuvem-senha', senha);
  await clicar(pag, '#nuvem-entrar');
  return (await esperar('entrou e o cartão mostra os botões', () => existe(pag, '#nuvem-enviar'), v => v === true, 15000)).ok;
}
/* O retrato do que é dela no aparelho, para comparar A com B. */
const retrato = (pag) => pag.evaluate(async () => {
  const d = await Store.carregar();
  const nota = await Store.lerNota('aula-alfa');
  const anexo = await Store.lerAnexo('anexo-alfa');
  return JSON.stringify({
    alunos: d.alunos.map(a => [a.id, a.nome]),
    aulas: d.aulas.map(a => [a.id, a.alunoId, a.data, a.hora, a.status]),
    nota: nota ? nota.paginas[0].itens[0].pontos : null,
    anexo: anexo ? await anexo.blob.text() : null,
    listas: (await Store.listasDaBiblioteca()).map(l => [l.id, l.titulo])
  });
});

(async function () {
  secao('1. O emulador sobe e as três contas existem');
  await subirEmulador();
  const dona = (await criarUsuario(DONA)).json, obs = (await criarUsuario(OBS)).json, estranho = (await criarUsuario(ESTRANHO)).json;
  conf('as três contas foram criadas no emulador', !!(dona && dona.localId && obs && obs.localId && estranho && estranho.localId), true);

  secao('2. (a) As regras: dona, observador e estranho, lendo e escrevendo');
  conf('a dona escreve no caminho dela', (await gravarDoc(dona.idToken, dona.localId, 'estado/copia', { atual: { stringValue: 'x' } })).status, 200);
  conf('a dona lê o caminho dela', (await lerDoc(dona.idToken, dona.localId, 'estado/copia')).status, 200);
  confLeituraRecusada('o observador ainda não permitido não lê', (await lerDoc(obs.idToken, dona.localId, 'estado/copia')).status);
  confLeituraRecusada('o estranho não lê o caminho dela', (await lerDoc(estranho.idToken, dona.localId, 'estado/copia')).status);
  conf('o estranho não escreve no caminho dela', (await gravarDoc(estranho.idToken, dona.localId, 'estado/copia', { atual: { stringValue: 'y' } })).status, 403);
  conf('sem login ninguém lê', (await lerDoc(null, dona.localId, 'estado/copia')).status, 403);
  conf('o estranho não escreve o documento de leitores dela', (await gravarDoc(estranho.idToken, dona.localId, 'config/leitores', uids([estranho.localId]))).status, 403);
  conf('o observador não se põe sozinho como leitor', (await gravarDoc(obs.idToken, dona.localId, 'config/leitores', uids([obs.localId]))).status, 403);
  conf('a dona grava o documento de leitores com o observador', (await gravarDoc(dona.idToken, dona.localId, 'config/leitores', uids([obs.localId]))).status, 200);
  conf('o observador permitido lê o caminho dela', (await lerDoc(obs.idToken, dona.localId, 'estado/copia')).status, 200);
  conf('o observador permitido lista as cópias dela', (await lerDoc(obs.idToken, dona.localId, 'copias')).status, 200);
  conf('o observador permitido não escreve', (await gravarDoc(obs.idToken, dona.localId, 'estado/copia', { atual: { stringValue: 'z' } })).status, 403);
  conf('o observador permitido não muda a lista de leitores', (await gravarDoc(obs.idToken, dona.localId, 'config/leitores', uids([obs.localId, estranho.localId]))).status, 403);
  confLeituraRecusada('o estranho continua sem ler depois do documento de leitores', (await lerDoc(estranho.idToken, dona.localId, 'estado/copia')).status);
  // os registros (N1), dado legível: a forma conferida, e só a dona escreve
  conf('a dona grava um registro com a forma esperada (dados como mapa legível)', (await gravarDoc(dona.idToken, dona.localId, 'registros/aluno:prova', registroDeProva('aluno:prova'))).status, 200);
  conf('a dona não grava um registro com campo a mais (iv, da cifra que saiu)', (await gravarDoc(dona.idToken, dona.localId, 'registros/aluno:prova', registroDeProva('aluno:prova', { iv: { bytesValue: 'AAAA' } }))).status, 403);
  conf('a dona não grava um registro cujo id difere do documento', (await gravarDoc(dona.idToken, dona.localId, 'registros/aluno:prova', registroDeProva('aluno:outro'))).status, 403);
  conf('a dona não grava um registro com dados em bytes', (await gravarDoc(dona.idToken, dona.localId, 'registros/aluno:prova', registroDeProva('aluno:prova', { dados: { bytesValue: 'AAAA' } }))).status, 403);
  conf('a dona não grava um registro com tipo longo demais', (await gravarDoc(dona.idToken, dona.localId, 'registros/aluno:prova', registroDeProva('aluno:prova', { tipo: { stringValue: 'x'.repeat(33) } }))).status, 403);
  conf('o observador permitido lê o registro dela', (await lerDoc(obs.idToken, dona.localId, 'registros/aluno:prova')).status, 200);
  confEscritaRecusadaAoLeitor('o observador permitido não escreve registro', (await gravarDoc(obs.idToken, dona.localId, 'registros/aluno:prova', registroDeProva('aluno:prova'))).status);
  conf('o estranho não escreve registro', (await gravarDoc(estranho.idToken, dona.localId, 'registros/aluno:prova', registroDeProva('aluno:prova'))).status, 403);
  confLeituraRecusada('o estranho não lê o registro dela', (await lerDoc(estranho.idToken, dona.localId, 'registros/aluno:prova')).status);
  conf('sem login ninguém lê registro', (await lerDoc(null, dona.localId, 'registros/aluno:prova')).status, 403);
  conf('o registro de prova saiu do caminho dela', (await rest(docUrl(dona.localId, 'registros/aluno:prova'), { token: dona.idToken, metodo: 'DELETE' })).status, 200);
  conf('o estranho continua sem escrever', (await gravarDoc(estranho.idToken, dona.localId, 'copias/falsa', { bytes: { integerValue: '1' } })).status, 403);
  confLeituraRecusada('a dona não lê o caminho do observador (cada um só o seu)', (await lerDoc(dona.idToken, obs.localId, 'estado/copia')).status);
  conf('a dona tirou o observador e ele deixou de ler', (await gravarDoc(dona.idToken, dona.localId, 'config/leitores', uids([]))).status === 200 &&
    (await lerDoc(obs.idToken, dona.localId, 'estado/copia')).status === (REGRA_ABERTA ? 200 : 403), true);
  await gravarDoc(dona.idToken, dona.localId, 'config/leitores', uids([obs.localId]));
  conf('o rascunho do teste saiu do caminho dela', (await rest(docUrl(dona.localId, 'estado/copia'), { token: dona.idToken, metodo: 'DELETE' })).status, 200);

  secao('3. (b) Aparelho A: entra pela tela, cria dados fictícios e sobe a cópia');
  await amb.subir();
  const pagA = await amb.pagina();
  await prepararPagina(pagA);
  await H.abrirApp(pagA, amb.ORIGEM);
  await pagA.evaluate(async () => {
    const d = Store.bancoVazio();
    d.alunos = [{ id: 'alfa', nome: 'Aluna Alfa Teste' }, { id: 'beta', nome: 'Aluno Beta Teste' }];
    d.aulas = [
      { id: 'aula-alfa', alunoId: 'alfa', data: '2026-10-01', hora: '10:00', duracaoMin: 60, status: 'realizada', anexos: [{ id: 'anexo-alfa' }] },
      { id: 'aula-beta', alunoId: 'beta', data: '2026-10-02', hora: '11:00', duracaoMin: 60, status: 'realizada' }
    ];
    await Store.salvar(d);
    await Store.salvarNota('aula-alfa', { paginas: [{ itens: [{ t: 'traco', pontos: [[1.2, 2.3, 3.5]] }] }] });
    // o anexo vai sem compressão no zip: é o texto em claro que o servidor NÃO pode ver
    await Store.salvarAnexo('anexo-alfa', { nome: 'alfa.txt', tipo: 'text/plain',
      blob: new Blob(['Anexo da Aluna Alfa Teste, texto em claro dentro da copia'], { type: 'text/plain' }) });
    await Store.gravarListaBiblioteca({ id: 'lista-alfa', titulo: 'Lista Alfa Teste', itens: [] });
  });
  await H.abrirApp(pagA, amb.ORIGEM);
  await H.irParaAba(pagA, 'ajustes');
  conf('antes de entrar, o cartão da nuvem pede e-mail e senha', await existe(pagA, '#nuvem-entrar'), true);
  conf('o cartão não oferece Enviar nem Restaurar antes de entrar', await existe(pagA, '#nuvem-enviar'), false);
  await digitar(pagA, '#nuvem-email', DONA.email);
  await digitar(pagA, '#nuvem-senha', 'senha-errada');
  await clicar(pagA, '#nuvem-entrar');
  const recusa = await esperar('senha errada recusada com frase dela', () => texto(pagA, '#nuvem-mensagem'), v => /não conferem/.test(v || ''), 10000);
  conf('senha errada: "E-mail ou senha não conferem."', recusa.ok, true);
  conf('senha errada não entrou', await existe(pagA, '#nuvem-enviar'), false);
  conf('A entrou com e-mail e senha pela tela', await entrarPelaTela(pagA, DONA.email, DONA.senha), true);
  conf('antes do primeiro envio, nenhuma cópia e a automática desligada',
    /Nenhuma cópia subiu ainda/.test(await texto(pagA, '#nuvem-ultima')) && /começa depois do primeiro envio/.test(await texto(pagA, '#nuvem-automatica')), true);
  conf('antes do envio, nenhuma cópia anotada neste aparelho', await pagA.evaluate(() => Nuvem.estado().ultimaCopia), null);
  await clicar(pagA, '#nuvem-enviar');
  const subiu = await esperar('a cópia subiu e a tela diz quando', () => texto(pagA, '#nuvem-ultima'), v => /^Última cópia na nuvem: hoje, \d\d:\d\d\.$/.test(v || ''), 30000);
  conf('"Última cópia na nuvem: hoje, HH:MM" em Ajustes', subiu.ok, true);
  conf('a automática ligou depois do envio dela', /Sobe sozinha/.test(await texto(pagA, '#nuvem-automatica')), true);
  conf('o estado da nuvem fica fora do banco principal (banco próprio apoio-nuvem)', await pagA.evaluate(async () => {
    const nomes = (await indexedDB.databases()).map(b => b.name);
    return nomes.indexOf('apoio-nuvem') >= 0;
  }), true);
  conf('nenhuma chave guardada no apoio-nuvem', await lerEstadoDaNuvem(pagA, 'chave'), null);
  conf('o cartão não tem mais "Ver a chave da cópia"', await existe(pagA, '#nuvem-ver-chave'), false);
  /* "código da conta" (o uid, D7) fica; o que saiu é a chave, o QR e o código
   * do papel. O uid é aleatório e às vezes contém "qr": ele sai do texto antes
   * da busca (era a falha intermitente desta verificação). */
  const VOCAB_CHAVE = /chave|QR|código d[ao] (papel|cópia|chave)|imprim|cifra/i;
  const semCodigoDaConta = (t, uid) => String(t || '').split(uid).join('');
  const textoCartao = await texto(pagA, '#cartao-nuvem');
  conf('o cartão mostra o código da conta', textoCartao.indexOf(dona.localId) >= 0, true);
  conf('o cartão da nuvem não fala em chave, QR, código do papel nem imprimir', VOCAB_CHAVE.test(semCodigoDaConta(textoCartao, dona.localId)), false);
  const uidPlantado = 'AbQrcdqrXYZ0123456789abc';
  const cartaoPlantado = textoCartao.split(dona.localId).join(uidPlantado);
  conf('(controle) sem tirar o código da conta, um uid com "qr" acusaria: a causa da falha intermitente', VOCAB_CHAVE.test(cartaoPlantado), true);
  conf('(controle) com o código fora do texto, a verificação passa mesmo com "qr" no uid', VOCAB_CHAVE.test(semCodigoDaConta(cartaoPlantado, uidPlantado)), false);
  const retratoA = await retrato(pagA);

  secao('4. (c) A cópia na nuvem é o zip em partes, e só quem as regras deixam a lê');
  const ponteiro = (await lerDoc(dona.idToken, dona.localId, 'estado/copia')).json;
  const idAtual = ponteiro && ponteiro.fields && ponteiro.fields.atual.stringValue;
  conf('o ponteiro aponta para a cópia que subiu', !!idAtual, true);
  const meta = (await lerDoc(dona.idToken, dona.localId, 'copias/' + idAtual)).json;
  const partesDoc = (await lerDoc(dona.idToken, dona.localId, 'copias/' + idAtual + '/partes')).json;
  const partes = ((partesDoc && partesDoc.documents) || []).sort((a, b) => Number(a.fields.n.integerValue) - Number(b.fields.n.integerValue));
  const bytes = Buffer.concat(partes.map(p => Buffer.from(p.fields.dados.bytesValue, 'base64')));
  conf('a cópia está em partes de até 768 KiB e o total bate com o cabeçalho',
    partes.length === Number(meta.fields.partes.integerValue) && bytes.length === Number(meta.fields.bytes.integerValue) &&
    partes.every(p => Buffer.from(p.fields.dados.bytesValue, 'base64').length <= 768 * 1024), true);
  const latin1 = bytes.toString('latin1');
  conf('as partes juntas são o próprio zip (assinatura PK no começo; sem cifra)', bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 3 && bytes[3] === 4, true);
  conf('os nomes de arquivo da cópia estão nos bytes (é o zip, legível por quem as regras deixam)', ['manifest.json', 'dados.json'].every(n => latin1.indexOf(n) >= 0), true);
  const textos = JSON.stringify([meta, ponteiro].map(d => d.fields));
  conf('o cabeçalho só tem tamanho, hora, aparelho e versão', /Alfa|Beta|aluno|aula/i.test(textos), false);
  conf('o cabeçalho não tem iv nem nada da cifra que saiu', /"iv"|cifra/.test(textos), false);
  /* O zip refeito agora difere do que subiu só pela data do manifest, que o
   * deflate pode comprimir em um ou dois bytes a mais ou a menos. */
  const zipAgora = await pagA.evaluate(async () => (await Store.exportarTudoZip(await Store.carregar())).size);
  conf('o que subiu tem o tamanho do zip (a menos da data do manifest)', Math.abs(bytes.length - zipAgora) <= 8, true);
  conf('o observador permitido lê a cópia dela', (await lerDoc(obs.idToken, dona.localId, 'copias/' + idAtual)).status, 200);
  confLeituraRecusada('o estranho não lê a cópia dela', (await lerDoc(estranho.idToken, dona.localId, 'copias/' + idAtual)).status);
  confLeituraRecusada('o estranho não lê as partes da cópia dela', (await lerDoc(estranho.idToken, dona.localId, 'copias/' + idAtual + '/partes/0')).status);
  conf('o observador permitido não escreve na cópia dela', (await gravarDoc(obs.idToken, dona.localId, 'copias/' + idAtual + '/partes/0', { dados: { bytesValue: 'AAAA' }, n: { integerValue: '0' } })).status, 403);
  conf('o estranho não escreve na cópia dela', (await gravarDoc(estranho.idToken, dona.localId, 'copias/' + idAtual + '/partes/0', { dados: { bytesValue: 'AAAA' }, n: { integerValue: '0' } })).status, 403);

  secao('5. (b) Aparelho B: entra e restaura, só com o login');
  // outro contexto do mesmo Chrome: IndexedDB, cache e sessão separados, como outro aparelho
  const contextoB = await pagA.browser().createBrowserContext();
  const pagB = await contextoB.newPage();
  await prepararPagina(pagB);
  await H.abrirApp(pagB, amb.ORIGEM);
  // um aparelho que ainda tinha a chave da versão com cifra: ignorada e apagada ao abrir
  conf('(arranjo) uma chave antiga foi posta no apoio-nuvem de B', await gravarEstadoDaNuvem(pagB, 'chave', { bruta: 'chave-antiga-de-prova' }), true);
  await H.abrirApp(pagB, amb.ORIGEM);
  await pagB.evaluate(() => Nuvem.pronto());
  conf('a chave antiga guardada no apoio-nuvem é ignorada e apagada ao abrir', await esperar('a chave antiga sumiu', () => lerEstadoDaNuvem(pagB, 'chave'), v => v === null, 5000).then(r => r.valor), null);
  conf('B nasce com a carga inicial, não com os dados de A', await pagB.evaluate(async () => (await Store.carregar()).alunos.some(a => a.id === 'alfa')), false);
  conf('B entrou com e-mail e senha pela tela', await entrarPelaTela(pagB, DONA.email, DONA.senha), true);
  conf('em B, nenhuma cópia subiu deste aparelho e a automática está desligada',
    /Nenhuma cópia subiu ainda/.test(await texto(pagB, '#nuvem-ultima')) && /começa depois do primeiro envio/.test(await texto(pagB, '#nuvem-automatica')), true);
  await clicar(pagB, '#nuvem-restaurar');
  const lista = await esperar('a janela lista a cópia de A', () => pagB.evaluate(() =>
    document.querySelectorAll('#modal-nuvem-restaurar.aberto #nuvem-copias input[type=radio]').length), v => v === 1, 15000);
  conf('"Restaurar neste aparelho" lista a cópia mais recente', lista.ok, true);
  conf('a janela não tem campo de código nem leitor de QR', await existe(pagB, '#nuvem-chave-entrada, #nuvem-codigo-digitado, #nuvem-ler-qr'), false);
  conf('a frase da lista diz "hoje" e o aparelho de origem', /Mais recente, de hoje, \d\d:\d\d \(\d+ KB, tablet/.test(await texto(pagB, '#nuvem-copias')), true);
  await clicar(pagB, '#nuvem-restaurar-confirmar');
  const restaurou = await esperar('B restaurou e a janela fechou', () => pagB.evaluate(async () =>
    !document.querySelector('#modal-nuvem-restaurar.aberto') && (await Store.carregar()).alunos.some(a => a.id === 'alfa')), v => v === true, 30000);
  conf('B restaurou só com o login, sem chave nem código', restaurou.ok, true);
  const retratoB = await retrato(pagB);
  conf('os dados de B batem com os de A: alunos, aulas, nota, anexo e lista', retratoB, retratoA);
  conf('a automática ligou em B depois de restaurar', /Sobe sozinha/.test(await texto(pagB, '#nuvem-automatica')), true);
  conf('em B, "Última cópia na nuvem" passa a ser a restaurada', /^Última cópia na nuvem: hoje, \d\d:\d\d\.$/.test(await texto(pagB, '#nuvem-ultima')), true);

  secao('5b. O observador, com OUTRA conta, traz a cópia da dona só para ler (D7)');
  /* O uid da dona vinha no QR, que saiu: agora ela o copia do cartão da nuvem
   * ("Código da conta para o observador") e o observador o digita em
   * "Restaurar neste aparelho". As regras decidem: o observador permitido lê a
   * cópia dela; o aparelho dele passa a só ler e não escreve nada na nuvem. */
  const contextoD = await pagA.browser().createBrowserContext();
  const pagD = await contextoD.newPage();
  await prepararPagina(pagD);
  await H.abrirApp(pagD, amb.ORIGEM);
  conf('o observador entrou com a conta dele', await entrarPelaTela(pagD, OBS.email, OBS.senha), true);
  conf('o cartão mostra o código da conta para o observador (o uid)', await texto(pagD, '#nuvem-meu-codigo'), 'Código da conta para o observador: ' + obs.localId);
  conf('com o botão Copiar ao lado', await existe(pagD, '#nuvem-copiar-codigo'), true);
  conf('no aparelho da dona o código é o dela', await texto(pagA, '#nuvem-meu-codigo'), 'Código da conta para o observador: ' + dona.localId);
  await clicar(pagD, '#nuvem-restaurar');
  const semCopia = await esperar('a janela diz que a conta do observador não tem cópia', () => texto(pagD, '#nuvem-copias'), v => /Não há cópia na nuvem nesta conta/.test(v || ''), 15000);
  conf('sem código da dona, a lista é a da própria conta (vazia)', semCopia.ok, true);
  await digitar(pagD, '#nuvem-conta-dona', 'ab/c?d');
  await clicar(pagD, '#nuvem-conta-dona-buscar');
  conf('código de conta mal formado é recusado antes de consultar', /não parece certo/.test(await texto(pagD, '#nuvem-restaurar-mensagem')), true);
  await digitar(pagD, '#nuvem-conta-dona', estranho.localId);
  await clicar(pagD, '#nuvem-conta-dona-buscar');
  const estranhoNao = await esperar('a conta que não permitiu o observador não lista cópia', () => texto(pagD, '#nuvem-copias'), v => /Não há cópia|recusou/.test(v || ''), 15000);
  conf('o código de uma conta que não o permitiu não lista cópia (a regra nega)', estranhoNao.ok && /recusou/.test(await texto(pagD, '#nuvem-copias')), !REGRA_ABERTA);
  await digitar(pagD, '#nuvem-conta-dona', dona.localId);
  await clicar(pagD, '#nuvem-conta-dona-buscar');
  const listaDona = await esperar('a janela lista as cópias da dona', () => pagD.evaluate(() => document.querySelectorAll('#modal-nuvem-restaurar.aberto #nuvem-copias input[type=radio]').length), v => v >= 1, 15000);
  conf('com o código da dona, as cópias dela aparecem', listaDona.ok, true);
  const pedidosAntesD = pagD.pedidos.length;
  await clicar(pagD, '#nuvem-restaurar-confirmar');
  const trouxe = await esperar('o observador restaurou', () => pagD.evaluate(async () => !document.querySelector('#modal-nuvem-restaurar.aberto') && (await Store.carregar()).alunos.some(a => a.id === 'alfa')), v => v === true, 30000);
  conf('o observador trouxe a cópia da dona, só com o login e o código da conta dela', trouxe.ok, true);
  conf('a pergunta disse que o aparelho passa a só ler', pagD.dialogos.some(d => /outra conta.*passa a só ler/.test(d)), true);
  conf('o observador ficou só leitura, com a conta da dona na marca e a automática desligada', await pagD.evaluate(u => { const e = Nuvem.estado(); return e.celular && e.observador && !e.celularDaDona && e.uidDona === u && e.automatica === false; }, dona.localId), true);
  conf('o observador recebe os registros da dona (só leitura na nuvem) sem erro', await pagD.evaluate(() => Nuvem.receberRegistros().then(r => r.erro ? r.erro.codigo : null)), null);
  conf('editar no observador é recusado', await pagD.evaluate(async () => { try { await Store.salvar(await Store.carregar()); return false; } catch (e) { return !!(e && e.soLeitura); } }), true);
  conf('sincronizar no observador só recebe', await pagD.evaluate(() => Nuvem.sincronizar().then(r => r.enviados.pulado || null)), 'so leitura');
  await pausa(3000);
  conf('nenhuma escrita saiu do observador (nenhum commit)', pagD.pedidos.slice(pedidosAntesD).filter(u => /:commit\b/.test(u)).length, 0);
  // com a marca, o aparelho do observador fica no modo de só leitura (as telas do celular), e assim reabre
  conf('o aparelho do observador passou ao modo de só leitura', await pagD.evaluate(() => document.body.classList.contains('modo-celular') && Store.estaSoLendo()), true);
  await H.abrirApp(pagD, amb.ORIGEM);
  await pagD.evaluate(() => Nuvem.pronto());
  conf('reaberto, continua só leitura, com a conta da dona na marca', await pagD.evaluate(u => { const e = Nuvem.estado(); return e.celular && e.observador && e.uidDona === u && document.body.classList.contains('modo-celular'); }, dona.localId), true);
  /* Em tela larga, o observador de OUTRA conta nunca passa a editar: o envio
   * dele iria para a conta dele com os carimbos da dona (FAILED_PRECONDITION
   * para sempre) e a cópia automática subiria os dados dela como cópia dele. */
  const botaoEditar = await esperar('o alto do celular desenhou', () => pagD.evaluate(() => !!document.querySelector('#nuvem-passa-a-editar, #nuvem-so-le-outra')), v => v === true, 10000);
  conf('(controle) o alto da tela de só leitura foi desenhado', botaoEditar.ok, true);
  if (OBSERVADOR_EDITA) {
    conf('VENENO visto: o observador de outra conta, em tela larga, viu "Este aparelho passa a ser o tablet"', await existe(pagD, '#nuvem-passa-a-editar'), true);
    await clicar(pagD, '#nuvem-passa-a-editar');
    const caiu = await esperar('a marca de celular caiu', () => pagD.evaluate(() => !Nuvem.estado().celular), v => v === true, 10000);
    conf('VENENO visto: e a marca caiu (o envio dele iria para a conta dele com os carimbos da dona)', caiu.ok, true);
  } else {
    conf('o observador de outra conta, em tela larga, não vê "Este aparelho passa a ser o tablet"', await existe(pagD, '#nuvem-passa-a-editar'), false);
    conf('e a tela diz que ele só lê a cópia de outra conta', await texto(pagD, '#nuvem-so-le-outra'), 'Este aparelho só lê a cópia de outra conta.');
    conf('a marca continua', await pagD.evaluate(() => Nuvem.estado().celular), true);
  }
  conf('nenhum erro de script no observador', JSON.stringify(pagD.errosDePagina), '[]');
  await contextoD.close();

  secao('6. (b) A cópia automática ao fechar, a anterior e a que sai');
  await pagB.evaluate(async () => {
    const d = await Store.carregar();
    d.alunos.push({ id: 'gama', nome: 'Aluna Gama Teste' });
    await Store.salvar(d);
  });
  conf('gravar em B marca mudança pendente para a nuvem', await pagB.evaluate(() => Nuvem.estado().pendente), true);
  conf('com mudança, conta e automática, a cópia ao fechar é devida', await pagB.evaluate(() => Nuvem.copiaAutomaticaDevida()), true);
  await pagB.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const segunda = await esperar('a cópia de B subiu ao fechar', async () => {
    const p = (await lerDoc(dona.idToken, dona.localId, 'estado/copia')).json;
    return p && p.fields ? [p.fields.atual.stringValue, p.fields.anterior.stringValue] : null;
  }, v => !!v && v[0] !== idAtual && v[1] === idAtual, 30000);
  conf('ao fechar com sinal, a cópia nova vira a atual e a de A fica como anterior', segunda.ok, true);
  conf('depois de subir, B não tem mais mudança pendente', await esperar('pendente limpou', () => pagB.evaluate(() => Nuvem.estado().pendente), v => v === false, 10000).then(r => r.ok), true);
  await pagB.evaluate(() => { delete document.visibilityState; });
  const idSegunda = segunda.valor ? segunda.valor[0] : null;
  await clicar(pagA, '#nuvem-enviar');
  const terceira = await esperar('A subiu de novo, por ela', async () => {
    const p = (await lerDoc(dona.idToken, dona.localId, 'estado/copia')).json;
    return p && p.fields ? [p.fields.atual.stringValue, p.fields.anterior.stringValue] : null;
  }, v => !!v && v[0] !== idSegunda && v[1] === idSegunda, 30000);
  conf('a terceira cópia vira atual e a segunda, anterior', terceira.ok, true);
  const idTerceira = terceira.valor ? terceira.valor[0] : null;
  const sumiu = await esperar('a primeira cópia saiu da nuvem', () => lerDoc(dona.idToken, dona.localId, 'copias/' + idAtual).then(r => r.status), v => v === 404, 15000);
  conf('a mais velha (a primeira) saiu, com as partes', sumiu.ok &&
    (await lerDoc(dona.idToken, dona.localId, 'copias/' + idAtual + '/partes/0')).status === 404, true);
  conf('a nuvem guarda no máximo duas cópias', (((await lerDoc(dona.idToken, dona.localId, 'copias')).json || {}).documents || []).length <= 2, true);

  secao('7. Trocar senha e Esqueci a senha');
  await clicar(pagA, '#nuvem-trocar-senha');
  await esperar('a janela de senha abriu', () => existe(pagA, '#modal-nuvem-senha.aberto'), v => v === true, 10000);
  await digitar(pagA, '#nuvem-senha-atual', DONA.senha);
  await digitar(pagA, '#nuvem-senha-nova', SENHA_NOVA);
  await digitar(pagA, '#nuvem-senha-repetida', SENHA_NOVA + 'x');
  await clicar(pagA, '#nuvem-senha-confirmar');
  conf('senhas novas diferentes: a janela avisa e não troca', /não são iguais/.test(await texto(pagA, '#nuvem-senha-mensagem')), true);
  await digitar(pagA, '#nuvem-senha-repetida', SENHA_NOVA);
  await clicar(pagA, '#nuvem-senha-confirmar');
  const trocou = await esperar('a senha trocou e a janela fechou', () => existe(pagA, '#modal-nuvem-senha.aberto'), v => v === false, 15000);
  conf('Trocar senha fecha a janela', trocou.ok, true);
  conf('a senha antiga deixou de entrar', (await entrarRest(DONA.email, DONA.senha)).status, 400);
  conf('a senha nova entra', (await entrarRest(DONA.email, SENHA_NOVA)).status, 200);
  conf('A continua entrada depois da troca (token renovado)', await existe(pagA, '#nuvem-enviar'), true);
  await clicar(pagB, '#nuvem-sair');
  const saiu = await esperar('B saiu e o cartão pede e-mail e senha de novo', () => existe(pagB, '#nuvem-entrar'), v => v === true, 10000);
  conf('Sair volta ao formulário de entrada', saiu.ok, true);
  conf('ao sair, a última cópia continua anotada no aparelho', await pagB.evaluate(() => !!Nuvem.estado().ultimaCopia), true);
  await digitar(pagB, '#nuvem-email', DONA.email);
  await clicar(pagB, '#nuvem-esqueci');
  const pediu = await esperar('"Esqueci a senha" respondeu', () => texto(pagB, '#nuvem-mensagem'), v => /chega uma mensagem/.test(v || ''), 10000);
  conf('"Esqueci a senha" diz que o e-mail chega', pediu.ok, true);
  const oob = (await rest(AUTH + '/emulator/v1/projects/' + PROJETO + '/oobCodes')).json;
  conf('o Firebase registrou o pedido de redefinição para o e-mail dela',
    !!(oob && (oob.oobCodes || []).some(c => c.email === DONA.email && c.requestType === 'PASSWORD_RESET')), true);

  const ponteiroAgora = async () => {
    const p = (await lerDoc(dona.idToken, dona.localId, 'estado/copia')).json;
    return p && p.fields ? [p.fields.atual.stringValue, p.fields.anterior.stringValue] : null;
  };
  /* O banco vazio que sobe por cima da boa: no modo sobe-vazio a prova tem de
   * ver o ponteiro mudar. */
  function confVazioNaoSubiu(rotulo, mudou) {
    if (SOBE_VAZIO) conf('VENENO visto: ' + rotulo + ', e o vazio subiu por cima da boa', mudou, true);
    else conf(rotulo, mudou, false);
  }

  secao('9. "Apagar tudo" não manda o banco vazio por cima da cópia boa');
  conf('B entrou de novo, com a senha nova', await entrarPelaTela(pagB, DONA.email, SENHA_NOVA), true);
  conf('B está com a automática ligada antes de apagar', await pagB.evaluate(() => Nuvem.estado().automatica), true);
  await clicar(pagB, '#apagar-tudo');
  const apagou = await esperar('B apagou tudo', () => pagB.evaluate(async () => { const d = await Store.carregar(); return d ? d.alunos.length : -1; }), v => v === 0, 15000);
  conf('"Apagar todos os dados" esvaziou B', apagou.ok, true);
  if (!SOBE_VAZIO) conf('"Apagar tudo" desligou a cópia automática em B', await esperar('automática desligada', () => pagB.evaluate(() => Nuvem.estado().automatica), v => v === false, 5000).then(r => r.ok), true);
  conf('a tela de B diz que a automática espera o próximo envio dela', /começa depois do primeiro envio/.test(await texto(pagB, '#nuvem-automatica')), !SOBE_VAZIO);
  await pagB.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const vazioAoFechar = await esperar('o fechar de B depois do apagar tudo', ponteiroAgora, v => !!v && v[0] !== idTerceira, 8000);
  confVazioNaoSubiu('o fechar depois do "Apagar tudo" não troca a cópia boa', vazioAoFechar.ok);
  await pagB.evaluate(() => { delete document.visibilityState; });
  const pulada = await pagB.evaluate(async () => {
    const zip = await Store.exportarTudoZip(await Store.carregar());
    const r = await Nuvem.enviarCopia(zip, { motivo: 'fechar', conteudo: false });
    return !!(r && r.pulada);
  });
  const depoisDoMotor = await ponteiroAgora();
  confVazioNaoSubiu('nem chamado direto o motor sobe banco vazio automático por cima da boa', !pulada || (depoisDoMotor && depoisDoMotor[0] !== (vazioAoFechar.valor ? vazioAoFechar.valor[0] : idTerceira)));
  conf('o motor devolve "pulada" em vez de fingir que subiu', pulada, !SOBE_VAZIO);
  const antesDoEnvioVazio = await ponteiroAgora();
  await clicar(pagB, '#nuvem-enviar');
  const perguntouVazio = await esperar('a pergunta do banco vazio', () => pagB.dialogos.slice(-1)[0], v => /está vazia, ou só com a carga inicial/.test(v || ''), 15000);
  conf('o envio DELA de um banco vazio pergunta antes, citando a cópia com conteúdo', perguntouVazio.ok, true);
  const envioVazio = await esperar('o envio vazio dela subiu', ponteiroAgora, v => !!v && v[0] !== antesDoEnvioVazio[0], 30000);
  conf('aceito, o vazio vira atual e a ANTERIOR é a cópia com conteúdo, não a vazia de antes',
    envioVazio.ok && envioVazio.valor[1] === idTerceira, true);
  conf('a cópia com conteúdo continua na nuvem', (await lerDoc(dona.idToken, dona.localId, 'copias/' + idTerceira)).status, 200);
  const idVazia1 = envioVazio.valor ? envioVazio.valor[0] : null;
  await clicar(pagB, '#nuvem-enviar');
  const envioVazio2 = await esperar('o segundo envio vazio dela subiu', ponteiroAgora, v => !!v && v[0] !== idVazia1, 30000);
  conf('o segundo vazio vira atual, a com conteúdo segue como anterior e a vazia de antes sai',
    envioVazio2.ok && envioVazio2.valor[1] === idTerceira &&
    (await lerDoc(dona.idToken, dona.localId, 'copias/' + idVazia1)).status === 404, true);
  conf('a nuvem nunca apaga a última cópia com conteúdo só pela contagem', (await lerDoc(dona.idToken, dona.localId, 'copias/' + idTerceira)).status, 200);

  secao('10. Aparelho novo que envia antes de restaurar não fica sem saída');
  const contextoC = await pagA.browser().createBrowserContext();
  const pagC = await contextoC.newPage();
  await prepararPagina(pagC);
  await H.abrirApp(pagC, amb.ORIGEM);
  await H.irParaAba(pagC, 'ajustes');
  await digitar(pagC, '#nuvem-email', 'ninguem@exemplo.test');
  await digitar(pagC, '#nuvem-senha', 'tanto-faz-123');
  await clicar(pagC, '#nuvem-entrar');
  const inexistente = await esperar('conta inexistente recusada', () => texto(pagC, '#nuvem-mensagem'), v => /Esta conta não existe; peça ao Rômulo para criá-la/.test(v || ''), 10000);
  conf('conta que não existe: "Esta conta não existe; peça ao Rômulo para criá-la"', inexistente.ok, true);
  conf('C entrou com a conta criada no console (pela tela)', await entrarPelaTela(pagC, DONA.email, SENHA_NOVA), true);
  const antesDeC = await ponteiroAgora();
  pagC.proximoDialogo = false;
  await clicar(pagC, '#nuvem-enviar');
  const avisouC = await esperar('C foi avisado de que já há cópia', () => pagC.dialogos.slice(-1)[0], v => /Já existe uma cópia na nuvem desta conta/.test(v || ''), 15000);
  conf('primeiro envio de um aparelho que nunca enviou nem restaurou, com cópia na nuvem: pergunta e manda restaurar primeiro', avisouC.ok, true);
  conf('a pergunta cita "Restaurar neste aparelho"', /Restaurar neste aparelho/.test(pagC.dialogos.slice(-1)[0] || ''), true);
  await pausa(1500);
  conf('com o "não", nada subiu e C continua sem cópia anotada',
    JSON.stringify(await ponteiroAgora()) === JSON.stringify(antesDeC) && !(await pagC.evaluate(() => Nuvem.estado().ultimaCopia)), true);
  pagC.proximoDialogo = true;
  await clicar(pagC, '#nuvem-enviar');
  const subiuC = await esperar('com o "sim", C subiu', ponteiroAgora, v => !!v && v[0] !== antesDeC[0], 30000);
  conf('aceito, a cópia de C (carga inicial) vira atual e a com conteúdo fica como anterior',
    subiuC.ok && subiuC.valor[1] === idTerceira, true);
  await clicar(pagC, '#nuvem-restaurar');
  await esperar('a janela de C lista as duas cópias', () => pagC.evaluate(() => document.querySelectorAll('#modal-nuvem-restaurar.aberto #nuvem-copias input[type=radio]').length), v => v === 2, 15000);
  await pagC.evaluate(id => { document.querySelector('#nuvem-copias input[value="' + id + '"]').click(); }, idTerceira);
  await clicar(pagC, '#nuvem-restaurar-confirmar');
  const saiuC = await esperar('C restaurou a anterior, só com o login', () => pagC.evaluate(async () =>
    !document.querySelector('#modal-nuvem-restaurar.aberto') && (await Store.carregar()).alunos.some(a => a.id === 'alfa')), v => v === true, 30000);
  conf('mesmo tendo enviado antes, C restaura a cópia com conteúdo sem chave nem código', saiuC.ok, true);
  /* Desde a N1 (fatia 3), logo depois da cópia chegam os registros mais novos
   * que ela. A gama, que B gravou depois da cópia, NÃO volta: B apagou tudo e
   * mandou a cópia dele valer ("Enviar cópia agora" religa e o que está no
   * aparelho passa a valer), e a gama virou lápide no servidor. A restauração
   * de C vence nas lápides do que a cópia tem. */
  await pagC.evaluate(() => Nuvem.receberRegistros());
  conf('os dados de C são os da cópia de A (a gama de B, apagada no "Apagar tudo" que passou a valer, não volta)', await retrato(pagC), retratoA);
  // as lápides do religar de B sobem pelo envio agendado; B sincroniza para não depender do relógio
  await pagB.evaluate(() => Nuvem.sincronizar({ versaoApp: 'prova' }));
  const gamaLapide = await esperar('a gama virou lápide no servidor', () => lerDoc(dona.idToken, dona.localId, 'registros/aluno:gama').then(r => !!(r.json && r.json.fields && r.json.fields.apagadoEm)), v => v === true, 20000);
  conf('no servidor a gama é lápide (apagada por B)', gamaLapide.ok, true);
  {
    /* Vazia atual (a de C), boa anterior (a terceira): C cria um aluno e fecha.
     * A automática sobe com conteúdo, e a boa tem de ficar como anterior; a
     * vazia é que sai. Com a regra de ed7415e, a boa era apagada aqui. */
    const idVaziaC = subiuC.valor ? subiuC.valor[0] : null;
    conf('ponto de partida: atual vazia (de C) e anterior com conteúdo', JSON.stringify(await ponteiroAgora()), JSON.stringify([idVaziaC, idTerceira]));
    await pagC.evaluate(async () => {
      const d = await Store.carregar();
      d.alunos.push({ id: 'delta', nome: 'Aluno Delta Teste' });
      await Store.salvar(d);
    });
    await pagC.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const comConteudo = await esperar('a automática de C subiu com conteúdo', ponteiroAgora, v => !!v && v[0] !== idVaziaC, 30000);
    await pagC.evaluate(() => { delete document.visibilityState; });
    conf('a cópia com conteúdo de C virou atual', comConteudo.ok, true);
    const boaFicou = comConteudo.ok && comConteudo.valor[1] === idTerceira &&
      (await lerDoc(dona.idToken, dona.localId, 'copias/' + idTerceira)).status === 200;
    const vaziaSaiu = (await esperar('a vazia de C saiu', () => lerDoc(dona.idToken, dona.localId, 'copias/' + idVaziaC).then(r => r.status), v => v === 404, 15000)).ok;
    if (ANTERIOR_CEGA) conf('VENENO visto: com a rotação cega, a boa foi apagada e a vazia ficou', !boaFicou, true);
    else conf('vazia atual, boa anterior, sobe uma com conteúdo: a boa fica como anterior e a vazia sai', boaFicou && vaziaSaiu, true);
  }

  secao('11. Gravação no meio do envio continua pendente e sobe no envio seguinte');
  /* O commit das partes no Firestore é segurado 1,5 s pela própria página, para
   * caber uma gravação dela no meio do envio. */
  await pagA.evaluate(() => {
    const original = window.fetch;
    window.__segurarCommit = 1500;
    window.fetch = function (url) {
      const args = arguments;
      if (String(url).indexOf(':commit') >= 0 && window.__segurarCommit) {
        return new Promise(r => setTimeout(r, window.__segurarCommit)).then(() => original.apply(this, args));
      }
      return original.apply(this, args);
    };
  });
  const geracaoAntes = await pagA.evaluate(() => Nuvem.geracao());
  const antesDoLento = await ponteiroAgora();
  await clicar(pagA, '#nuvem-enviar');
  const comecou = await esperar('o envio lento começou', () => pagA.evaluate(() => Nuvem.estado().enviando), v => v === true, 10000);
  conf('o envio de A está em curso', comecou.ok, true);
  await pagA.evaluate(async () => {
    const d = await Store.carregar();
    d.alunos.push({ id: 'epsilon', nome: 'Aluna Epsilon Teste' });
    await Store.salvar(d);
  });
  conf('a gravação no meio do envio subiu a geração', await pagA.evaluate(() => Nuvem.geracao()) > geracaoAntes, true);
  const lentoSubiu = await esperar('o envio lento terminou', ponteiroAgora, v => !!v && v[0] !== antesDoLento[0], 40000);
  conf('o envio lento terminou com uma cópia nova', lentoSubiu.ok, true);
  await esperar('o motor fechou o envio', () => pagA.evaluate(() => Nuvem.estado().enviando), v => v === false, 10000);
  const pendenteDepois = await pagA.evaluate(() => Nuvem.estado().pendente);
  if (PENDENTE_ZERADO) conf('VENENO visto: o fim do envio zerou o pendente apesar da gravação no meio', pendenteDepois, false);
  else conf('depois do envio, a gravação feita no meio continua pendente', pendenteDepois, true);
  conf('o sinal gravado no apoio-nuvem acompanha a memória', await pagA.evaluate(() => new Promise(r => {
    const q = indexedDB.open('apoio-nuvem');
    q.onsuccess = () => { const g = q.result.transaction('estado').objectStore('estado').get('pendente'); g.onsuccess = () => { q.result.close(); r(!!g.result); }; g.onerror = () => r('erro'); };
    q.onerror = () => r('erro');
  })), pendenteDepois);
  const comEpsilon = async (id) => {
    const zipB = await pagA.evaluate(async (id) => {
      const blob = await Nuvem.baixarCopia(null, id);
      const aberto = await Zip.lerDoArquivo(blob);
      const e = aberto.entradas.find(x => x.nome === 'dados.json');
      const dados = JSON.parse(new TextDecoder().decode(await Zip.extrairDoArquivo(aberto, e)));
      return dados.alunos.some(a => a.id === 'epsilon');
    }, id);
    return zipB;
  };
  conf('a cópia que acabou de subir NÃO tem a aluna gravada no meio (é o retrato de antes)', await comEpsilon(lentoSubiu.valor[0]), false);
  await pagA.evaluate(() => { window.__segurarCommit = 0; });
  conf('com a gravação pendente, o fechar é devido', await pagA.evaluate(() => Nuvem.copiaAutomaticaDevida()), !PENDENTE_ZERADO);
  if (!PENDENTE_ZERADO) {
    /* A gravação de cima foi direto no Store, por fora da tela; o aplicativo
     * reaberto lê o banco com ela, como quando ela fecha e abre de novo. O
     * pendente e a conta sobrevivem à reabertura, gravados no apoio-nuvem. */
    await H.abrirApp(pagA, amb.ORIGEM);
    await esperar('a nuvem recarregou o estado', () => pagA.evaluate(() => Nuvem.pronto().then(() => Nuvem.estado().entrada && Nuvem.estado().pendente)), v => !!v, 10000);
    conf('reaberto, o aplicativo continua entrado e com a gravação pendente', await pagA.evaluate(() => !!Nuvem.estado().entrada && Nuvem.estado().pendente), true);
    await pagA.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const seguinte = await esperar('o envio seguinte subiu', ponteiroAgora, v => !!v && v[0] !== lentoSubiu.valor[0], 30000);
    await pagA.evaluate(() => { delete document.visibilityState; });
    conf('o envio seguinte leva a edição feita no meio do anterior', seguinte.ok && await comEpsilon(seguinte.valor[0]), true);
    conf('e aí nada mais está pendente', await esperar('pendente limpou', () => pagA.evaluate(() => Nuvem.estado().pendente), v => v === false, 10000).then(r => r.ok), true);
  }

  secao('8. Sem erro de página e nenhum pedido ao signUp');
  conf('nenhum erro de script em A', JSON.stringify(pagA.errosDePagina), '[]');
  conf('nenhum erro de script em B', JSON.stringify(pagB.errosDePagina), '[]');
  conf('nenhum erro de script em C', JSON.stringify(pagC.errosDePagina), '[]');
  const pedidos = pagA.pedidos.concat(pagB.pedidos, pagC.pedidos);
  conf('as páginas falaram com o Firebase (o instrumento vê os pedidos)', pedidos.some(u => u.indexOf('signInWithPassword') >= 0), true);
  conf('nenhum pedido ao accounts:signUp saiu do aplicativo', pedidos.some(u => /signUp/i.test(u)), false);
  await contextoC.close();
  await contextoB.close();
})().then(() => derrubarEmulador().then(H.fim(amb)), e => derrubarEmulador().then(() => H.fim(amb)(e)));
