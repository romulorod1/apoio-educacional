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
 *       mostra "Última cópia na nuvem: hoje, HH:MM"; o aparelho B entra,
 *       digita o código da chave, "Restaurar neste aparelho", e os dados
 *       batem com os de A. Código com letra trocada e chave de outra conta
 *       são recusados sem mexer no banco. Depois, a cópia automática ao
 *       fechar sobe de B, a anterior fica, e a mais velha sai da nuvem;
 *   (c) o servidor nunca vê texto em claro: os documentos lidos direto do
 *       emulador não têm a assinatura de zip, nenhum nome de arquivo da cópia
 *       nem o nome de aluno fictício que está dentro do anexo em claro.
 *
 * Mais a troca de senha (a antiga deixa de entrar) e o "Esqueci a senha" (o
 * emulador registra o pedido de redefinição).
 *
 * Modos envenenados, que TÊM de ser vistos pela prova:
 *   --envenenado-sem-cifra     o nuvem.js servido sobe o zip sem cifrar; a
 *                              parte (c) tem de acusar.
 *   --envenenado-regra-aberta  as regras deixam qualquer conta ler; a parte
 *                              (a) tem de acusar no estranho e no observador
 *                              ainda não permitido.
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

const MODO = ['--envenenado-sem-cifra', '--envenenado-regra-aberta']
  .filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const SEM_CIFRA = MODO === '--envenenado-sem-cifra';
const REGRA_ABERTA = MODO === '--envenenado-regra-aberta';

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
const CIFRA = "return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv, additionalData: new TextEncoder().encode(ROTULO_CIFRA) }, k, bytes);";
const DECIFRA = "return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv, additionalData: new TextEncoder().encode(ROTULO_CIFRA) }, k, dados);";
const LEITURA = 'allow read: if dona(uid) || leitor(uid);';

secao('0. As âncoras e o ambiente');
conf('o nuvem.js cifra num lugar só', NUVEM.split(CIFRA).length, 2);
conf('o nuvem.js decifra num lugar só', NUVEM.split(DECIFRA).length, 2);
conf('as regras dão leitura à dona e ao leitor num lugar só', REGRAS.split(LEITURA).length, 2);
conf('as regras não têm uid fixo', /uid\s*==\s*['"]/.test(REGRAS), false);
conf('as regras só deixam a dona escrever', REGRAS.indexOf('allow write: if dona(uid);') > 0, true);

const trocas = {};
if (SEM_CIFRA) {
  trocas['/nuvem.js'] = NUVEM
    .replace(CIFRA, 'return Promise.resolve(bytes);')
    .replace(DECIFRA, 'return Promise.resolve(dados);');
}
const regrasServidas = REGRA_ABERTA ? REGRAS.replace(LEITURA, 'allow read: if entrou();') : REGRAS;

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
/* Texto em claro no servidor: no modo sem-cifra, a prova tem de achar. */
function confServidorCego(rotulo, achou) {
  if (SEM_CIFRA) conf('VENENO visto: ' + rotulo + ', e sem cifra apareceu', achou, true);
  else conf(rotulo, achou, false);
}

/* O código de uma chave aleatória, válido na conferência, mas de OUTRA chave. */
const ALFABETO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function base32(bytes) {
  let s = '', bits = 0, v = 0;
  for (const b of bytes) { v = (v << 8) | b; bits += 8; while (bits >= 5) { s += ALFABETO[(v >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) s += ALFABETO[(v << (5 - bits)) & 31];
  return s;
}
function codigoDeOutraChave() {
  const bytes = crypto.randomBytes(32);
  const d = crypto.createHash('sha256').update(bytes).digest();
  return base32(bytes).slice(0, 52) + base32(d.subarray(0, 3)).slice(0, 4);
}

const CFG = { auth: AUTH, firestore: FS, projectId: PROJETO };
const amb = H.criarAmbiente(PORTA_APP, 'nath_n0_nuvem', trocas);

async function prepararPagina(pag) {
  pag.setDefaultTimeout(60000);
  pag.errosDePagina = [];
  pag.on('pageerror', e => pag.errosDePagina.push(e.message));
  pag.on('dialog', async d => { try { await d.accept(); } catch (e) { /* ok */ } });
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
  conf('sem chave ainda: ela nasce no primeiro envio', await pagA.evaluate(() => Nuvem.estado().temChave), false);
  await clicar(pagA, '#nuvem-enviar');
  const subiu = await esperar('a cópia subiu e a tela diz quando', () => texto(pagA, '#nuvem-ultima'), v => /^Última cópia na nuvem: hoje, \d\d:\d\d\.$/.test(v || ''), 30000);
  conf('"Última cópia na nuvem: hoje, HH:MM" em Ajustes', subiu.ok, true);
  conf('a automática ligou depois do envio dela', /Sobe sozinha/.test(await texto(pagA, '#nuvem-automatica')), true);
  const chaveA = await pagA.evaluate(() => Nuvem.verChave());
  conf('a chave tem 56 letras e números, em 14 grupos de 4', chaveA.codigo.length === 56 && chaveA.formatado.split(' ').length === 14, true);
  conf('a chave fica fora do banco principal (banco próprio apoio-nuvem)', await pagA.evaluate(async () => {
    const nomes = (await indexedDB.databases()).map(b => b.name);
    return nomes.indexOf('apoio-nuvem') >= 0;
  }), true);
  await clicar(pagA, '#nuvem-ver-chave');
  const janela = await esperar('a janela da chave abriu com QR e código', () => pagA.evaluate(() =>
    document.querySelector('#modal-nuvem-chave.aberto') && !!document.querySelector('#nuvem-qr svg') && document.querySelector('#nuvem-codigo').textContent),
    v => !!v, 10000);
  conf('a janela mostra o QR e o mesmo código formatado', janela.valor === chaveA.formatado, true);
  conf('o QR codifica a conta e a chave', await pagA.evaluate(q => {
    const esperado = qrcode(0, 'M'); esperado.addData(q); esperado.make();
    // os dois passam pelo mesmo normalizador do navegador (aspas e ordem de atributos)
    const caixa = document.createElement('div');
    caixa.innerHTML = esperado.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    return document.querySelector('#nuvem-qr').innerHTML === caixa.innerHTML;
  }, chaveA.qr), true);
  conf('a frase da janela diz que sem a chave a cópia não abre', /Sem esta chave, a cópia na nuvem não abre/.test(await texto(pagA, '#modal-nuvem-chave .modal-corpo')), true);
  await pagA.evaluate(() => document.querySelector('#modal-nuvem-chave [data-fechar]').click());
  const retratoA = await retrato(pagA);

  secao('4. (c) O servidor nunca vê texto em claro');
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
  confServidorCego('a assinatura de zip (PK) não está no começo', bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 3 && bytes[3] === 4);
  const nomesDaCopia = ['manifest.json', 'dados.json', 'notas.json', 'midias.json', 'anexos.json', 'biblioteca_uso.json', 'biblioteca_listas.json'];
  confServidorCego('nenhum nome de arquivo da cópia aparece nos bytes', nomesDaCopia.some(n => latin1.indexOf(n) >= 0));
  confServidorCego('o nome de aluno fictício do anexo não aparece nos bytes', /Aluna Alfa Teste|Aluno Beta Teste|Alfa|Beta/.test(latin1));
  confServidorCego('o texto em claro do anexo não aparece nos bytes', latin1.indexOf('texto em claro') >= 0);
  const textos = JSON.stringify([meta, ponteiro].map(d => d.fields));
  conf('o cabeçalho em claro só tem tamanho, hora, aparelho e versão', /Alfa|Beta|aluno|aula/i.test(textos), false);
  conf('o cabeçalho não leva a chave nem parte dela', textos.indexOf(chaveA.codigo.slice(0, 12)) >= 0, false);
  /* O zip refeito agora difere do que subiu só pela data do manifest, que o
   * deflate pode comprimir em um ou dois bytes a mais ou a menos. */
  const zipAgora = await pagA.evaluate(async () => (await Store.exportarTudoZip(await Store.carregar())).size);
  if (!SEM_CIFRA) conf('o cifrado tem o tamanho do zip mais a etiqueta de 16 bytes do GCM (a menos da data do manifest)',
    Math.abs((bytes.length - 16) - zipAgora) <= 8, true);
  conf('o observador permitido lê a cópia dela', (await lerDoc(obs.idToken, dona.localId, 'copias/' + idAtual)).status, 200);
  confLeituraRecusada('o estranho não lê a cópia dela', (await lerDoc(estranho.idToken, dona.localId, 'copias/' + idAtual)).status);

  secao('5. (b) Aparelho B: entra, lê a chave pelo código e restaura');
  // outro contexto do mesmo Chrome: IndexedDB, cache e sessão separados, como outro aparelho
  const contextoB = await pagA.browser().createBrowserContext();
  const pagB = await contextoB.newPage();
  await prepararPagina(pagB);
  await H.abrirApp(pagB, amb.ORIGEM);
  conf('B nasce com a carga inicial, não com os dados de A', await pagB.evaluate(async () => (await Store.carregar()).alunos.some(a => a.id === 'alfa')), false);
  conf('B entrou com e-mail e senha pela tela', await entrarPelaTela(pagB, DONA.email, DONA.senha), true);
  conf('em B, nenhuma cópia subiu deste aparelho e a automática está desligada',
    /Nenhuma cópia subiu ainda/.test(await texto(pagB, '#nuvem-ultima')) && /começa depois do primeiro envio/.test(await texto(pagB, '#nuvem-automatica')), true);
  await clicar(pagB, '#nuvem-restaurar');
  const lista = await esperar('a janela lista a cópia de A', () => pagB.evaluate(() =>
    document.querySelectorAll('#modal-nuvem-restaurar.aberto #nuvem-copias input[type=radio]').length), v => v === 1, 15000);
  conf('"Restaurar neste aparelho" lista a cópia mais recente', lista.ok, true);
  conf('sem chave neste aparelho, a janela pede o código', await pagB.evaluate(() => !document.querySelector('#nuvem-chave-entrada').hidden), true);
  conf('a frase da lista diz "hoje" e o aparelho de origem', /Mais recente, de hoje, \d\d:\d\d \(\d+ KB, tablet/.test(await texto(pagB, '#nuvem-copias')), true);
  const trocada = chaveA.formatado.replace(/[0-9A-Z]$/, c => (c === 'A' ? 'B' : 'A'));
  await digitar(pagB, '#nuvem-codigo-digitado', trocada);
  await clicar(pagB, '#nuvem-restaurar-confirmar');
  const letra = await esperar('código com letra trocada é recusado', () => texto(pagB, '#nuvem-restaurar-mensagem'), v => /letra trocada/.test(v || ''), 10000);
  conf('letra trocada: a conferência do código pega antes de baixar', letra.ok, true);
  await digitar(pagB, '#nuvem-codigo-digitado', codigoDeOutraChave());
  await clicar(pagB, '#nuvem-restaurar-confirmar');
  const outra = await esperar('chave de outra conta não abre a cópia', () => texto(pagB, '#nuvem-restaurar-mensagem'), v => /não abre esta cópia/.test(v || ''), 20000);
  if (SEM_CIFRA) conf('(sem cifra, qualquer chave abre: a prova segue)', true, true);
  else conf('chave válida mas errada: "A chave não abre esta cópia"', outra.ok, true);
  conf('nada mudou no banco de B depois das duas recusas', await pagB.evaluate(async () => (await Store.carregar()).alunos.some(a => a.id === 'alfa')), SEM_CIFRA ? true : false);
  if (SEM_CIFRA) {
    await clicar(pagB, '#nuvem-restaurar');
    await esperar('a janela reabriu', () => existe(pagB, '#modal-nuvem-restaurar.aberto #nuvem-copias input[type=radio]'), v => v === true, 15000);
  }
  await digitar(pagB, '#nuvem-codigo-digitado', chaveA.formatado.toLowerCase());
  await clicar(pagB, '#nuvem-restaurar-confirmar');
  const restaurou = await esperar('B restaurou e a janela fechou', () => pagB.evaluate(async () =>
    !document.querySelector('#modal-nuvem-restaurar.aberto') && (await Store.carregar()).alunos.some(a => a.id === 'alfa')), v => v === true, 30000);
  conf('B restaurou pela chave digitada (em minúsculas, com espaços)', restaurou.ok, true);
  const retratoB = await retrato(pagB);
  conf('os dados de B batem com os de A: alunos, aulas, nota, anexo e lista', retratoB, retratoA);
  conf('B guardou a chave e a automática ligou depois de restaurar',
    await pagB.evaluate(() => Nuvem.estado().temChave) && /Sobe sozinha/.test(await texto(pagB, '#nuvem-automatica')), true);
  conf('em B, "Última cópia na nuvem" passa a ser a restaurada', /^Última cópia na nuvem: hoje, \d\d:\d\d\.$/.test(await texto(pagB, '#nuvem-ultima')), true);
  const codigoB = (await pagB.evaluate(() => Nuvem.verChave())).codigo;
  if (SEM_CIFRA) conf('VENENO visto: sem cifra, a chave errada "abriu" a cópia e ficou em B', codigoB !== chaveA.codigo, true);
  else conf('a chave de B é a mesma de A', codigoB, chaveA.codigo);

  secao('6. (b) A cópia automática ao fechar, a anterior e a que sai');
  await pagB.evaluate(async () => {
    const d = await Store.carregar();
    d.alunos.push({ id: 'gama', nome: 'Aluna Gama Teste' });
    await Store.salvar(d);
  });
  conf('gravar em B marca mudança pendente para a nuvem', await pagB.evaluate(() => Nuvem.estado().pendente), true);
  conf('com mudança, conta, chave e automática, a cópia ao fechar é devida', await pagB.evaluate(() => Nuvem.copiaAutomaticaDevida()), true);
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
  conf('ao sair, a chave continua no aparelho', await pagB.evaluate(() => Nuvem.estado().temChave), true);
  await digitar(pagB, '#nuvem-email', DONA.email);
  await clicar(pagB, '#nuvem-esqueci');
  const pediu = await esperar('"Esqueci a senha" respondeu', () => texto(pagB, '#nuvem-mensagem'), v => /chega uma mensagem/.test(v || ''), 10000);
  conf('"Esqueci a senha" diz que o e-mail chega', pediu.ok, true);
  const oob = (await rest(AUTH + '/emulator/v1/projects/' + PROJETO + '/oobCodes')).json;
  conf('o Firebase registrou o pedido de redefinição para o e-mail dela',
    !!(oob && (oob.oobCodes || []).some(c => c.email === DONA.email && c.requestType === 'PASSWORD_RESET')), true);

  secao('8. Sem erro de página');
  conf('nenhum erro de script em A', JSON.stringify(pagA.errosDePagina), '[]');
  conf('nenhum erro de script em B', JSON.stringify(pagB.errosDePagina), '[]');
  await contextoB.close();
})().then(() => derrubarEmulador().then(H.fim(amb)), e => derrubarEmulador().then(() => H.fim(amb)(e)));
