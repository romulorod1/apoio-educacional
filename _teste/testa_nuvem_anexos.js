/* testa_nuvem_anexos.js
 *
 * N2, fase 2 da nuvem, fatia 2: OS ANEXOS E AS MÍDIAS SOBEM PELO SHA256, contra
 * o Firebase Emulator Suite, com o tablet A (dono), o celular C da dona e o
 * observador O (outra conta). Relógio fixo da rodada: 10/11/2026, 10:00.
 *
 * O que prova, com dados fictícios (contas do emulador, aluno "Aluna Alfa Teste"):
 *   1. PRODUÇÃO: o tablet com anexos e uma imagem de ANTES desta versão (sem
 *      estado, gravados como a versão do ar grava) abre esta versão: nada disso
 *      sobe sozinho (zero escritas em arquivos/ e anexos/), a fila de registros
 *      antiga sobe como antes, e a conta do que subiria de uma vez é impressa
 *      (os tamanhos das três cópias reais: 2.445.759 bytes);
 *   2. C restaura a cópia de antes (os anexos antigos chegam pelo .zip, como hoje);
 *   3. A anexa um PDF sintético de 1,3 MB pela tela (Anexar PDF) e cola uma
 *      imagem na folha: o PDF vira arquivos/{sha} com DUAS partes, o documento
 *      anexos/anexo:<id> leva o sha256 dos bytes; a imagem, anexos/midia:<ref>;
 *   4. C recebe só os metadados; toca em "Abrir" na folha da aula: o PDF baixa e
 *      o sha256 do que baixou bate; "Ver a folha" mostra a imagem (baixada);
 *   5. o mesmo PDF anexado a outra aula sobe UMA vez (zero partes no segundo);
 *   6. um arquivo adulterado posto direto no emulador é recusado por quem baixa,
 *      e as regras recusam as formas erradas (sha que não é hexadecimal de 64,
 *      campo a mais, parte acima de 900 KiB, cabeçalho com outro sha, número da
 *      parte trocado, anexo vivo sem sha, escrita do observador);
 *   7. "Remover" no tablet: a lápide chega e o PDF some do celular;
 *   8. a exclusão do aluno em cascata lapida o anexo e a imagem dele na nuvem;
 *   9. PRODUÇÃO: restaurar no tablet a cópia de antes desta versão sobe cada
 *      arquivo dela uma vez (medido), e restaurar de novo não sobe nada nem
 *      duplica documento;
 *  10. PRODUÇÃO: a volta para a versão do ar (06a8936, servida de verdade) não
 *      perde a entrada de anexo que esperava na fila; o que ela remove solto
 *      vira lápide quando esta versão volta; o que ela grava (sem estado) não sobe;
 *  11. o observador baixa o anexo e nada sobe dele;
 *  12. um segundo tablet baixa na hora o arquivo cujo metadado chegou;
 *  13. o cenário da lente B: o download que falha num segundo tablet em dia
 *      fica "a baixar", a reconciliação não o lapida (0 lápides), o PDF segue
 *      intacto no tablet A e o "a baixar" baixa na rodada seguinte;
 *  14. a defesa: a lápide de um anexo que a aula viva ainda cita não tira o
 *      arquivo do tablet.
 *
 * Venenos (cada um TEM de ser visto):
 *   --envenenado-sha-errado       o envio grava um sha256 que não é dos bytes:
 *                                 quem baixa TEM de recusar, e a prova vê o PDF
 *                                 não abrir no celular;
 *   --envenenado-sobe-duas-vezes  a dedupe pelo sha256 sai: o segundo envio do
 *                                 mesmo arquivo TEM de ser visto;
 *   --envenenado-lapida-o-recebido a reconciliação volta a lapidar o estado
 *                                 vivo sem arquivo, e a defesa sai junto (é o
 *                                 código que a lente B pegou): a prova TEM de
 *                                 ver a lápide e o PDF apagado do tablet A;
 *   --envenenado-sem-defesa       só a defesa sai: a lápide da seção 14 TEM de
 *                                 apagar o PDF do tablet A.
 *
 * Portas: 8911 (app), 8913 (auth), 8914 (firestore), 8915 (hub), 8916 (log),
 * 8917 (websocket). Precisa do firebase-tools e de um JDK 21 em JAVA_HOME.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const cryptoNode = require('crypto');
const { spawn, spawnSync, execFileSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, esperar } = H;

const MODOS = ['--envenenado-sha-errado', '--envenenado-sobe-duas-vezes', '--envenenado-lapida-o-recebido', '--envenenado-sem-defesa'];
const MODO = MODOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
function prop(rotulo, ok, veneno) {
  if (MODO && MODO === veneno) return conf('VENENO visto: ' + rotulo + ', e quebrou', ok, false);
  return conf(rotulo, ok, true);
}
const fimDoVeneno = () => Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });

const RELOGIO = H.relogioDaRodada('2026-11-10', '10:00');
const PORTA_APP = 8911, PORTA_AUTH = 8913, PORTA_FS = 8914, PORTA_HUB = 8915, PORTA_LOG = 8916, PORTA_WS = 8917;
const PROJETO = 'demo-nath-n2f2';
const AUTH = 'http://127.0.0.1:' + PORTA_AUTH;
const FS = 'http://127.0.0.1:' + PORTA_FS;
const FIREBASE = process.env.FIREBASE_TOOLS ||
  'C:/Users/romul/ferramentas/firebase-tools/node_modules/firebase-tools/lib/bin/firebase.js';
const JAVA_HOME = process.env.JAVA_HOME || '';
const DONA = { email: 'dona@exemplo.test', senha: 'senha-da-dona-1' };
const OBS = { email: 'observador@exemplo.test', senha: 'senha-do-observador-1' };
/* A versão que está no ar quando esta chegar (a main com a fatia 1): é para ela
 * que a volta de versão volta. */
const VERSAO_DO_AR = '06a8936';

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const NUVEM = fs.readFileSync(path.join(H.RAIZ, 'nuvem.js'), 'utf8');
const STORE = fs.readFileSync(path.join(H.RAIZ, 'store.js'), 'utf8');
const REGRAS = fs.readFileSync(path.join(H.RAIZ, 'firestore.rules'), 'utf8');

secao('0. As âncoras, o veneno e o ambiente');
const SHA_NO_DOC = 'campo.sha256 = sha;';
const MEMO_DO_ENVIO = "if (jaNaNuvem[arq.sha256]) return Promise.resolve('no envio');";
const DEDUPE = "if (cab && cab.sha256 === arq.sha256 && Number(cab.partes) === partes.length) { jaNaNuvem[arq.sha256] = true; return 'ja estava'; }";
const CONFERE_SHA = 'if (sha !== doc.sha256) {';
conf('o sha256 entra no documento do arquivo num lugar só', NUVEM.split(SHA_NO_DOC).length, 2);
conf('a dedupe pelo sha256 (cabeçalho lido antes) está num lugar só', NUVEM.split(DEDUPE).length, 2);
conf('a memória do envio está num lugar só', NUVEM.split(MEMO_DO_ENVIO).length, 2);
conf('quem baixa confere o sha256 num lugar só', NUVEM.split(CONFERE_SHA).length, 2);
conf('o cabeçalho do arquivo sobe depois das partes', /return fila\.then\(function \(\) \{\s*return commit\(\[gravacao\(nomeDoc\(uid, 'arquivos\/' \+ arq\.sha256\)/.test(NUVEM), true);
conf('o salvarAnexo e o salvarMidia passam pela transação com estado e fila', STORE.indexOf("function salvarAnexo(id, registro, opcoes) { return salvarArquivo('anexo', id, registro, opcoes); }") > 0 &&
  STORE.indexOf("function salvarMidia(id, registro, opcoes) { return salvarArquivo('midia', id, registro, opcoes); }") > 0, true);
conf('o sha256 é calculado antes da transação', /return shaDoArquivo\(origem, registro\)\.then\(function \(info\) \{\s*return abrir\(\)/.test(STORE), true);
conf('as regras têm anexos/{anexo} e arquivos/{sha}/partes/{n}', /match \/anexos\/\{anexo\}/.test(REGRAS) && /match \/arquivos\/\{sha\}/.test(REGRAS) && /match \/partes\/\{parte\}/.test(REGRAS) &&
  REGRAS.indexOf("sha.matches('^[0-9a-f]{64}$')") > 0, true);
const SO_O_DAQUI = 'if (!lapidavelNaReconciliacao(e) || !p) return;';
const DEFESA = 'if (citado) contas.preservados = (contas.preservados || 0) + 1; else deposito.delete(p.id);';
conf('a reconciliação só lapida o estado nascido aqui, num lugar só', STORE.split(SO_O_DAQUI).length, 2);
conf('a defesa da lápide de arquivo ainda citado está num lugar só', STORE.split(DEFESA).length, 2);
conf('o celular não promete mais que o anexo "chega sozinho"', APP.indexOf('chega sozinho') < 0 && NUVEM.indexOf('chega sozinho') < 0, true);
const trocas = {};
if (MODO === MODOS[2]) trocas['/store.js'] = STORE.replace(SO_O_DAQUI, 'if (!e || e.apagadoEm || !p) return;').replace(DEFESA, 'deposito.delete(p.id);');
if (MODO === MODOS[3]) trocas['/store.js'] = STORE.replace(DEFESA, 'deposito.delete(p.id);');
if (MODO === MODOS[0]) trocas['/nuvem.js'] = NUVEM.replace(SHA_NO_DOC, "campo.sha256 = (sha.charAt(0) === '0' ? '1' : '0') + sha.slice(1);");
if (MODO === MODOS[1]) trocas['/nuvem.js'] = NUVEM.replace(DEDUPE, '').replace(MEMO_DO_ENVIO, '');
if (MODO) conf('o arquivo servido ficou diferente do repositório (' + MODO + ')', (trocas['/nuvem.js'] || NUVEM) !== NUVEM || (trocas['/store.js'] || STORE) !== STORE, true);

/* A versão do ar, de verdade, para a volta de versão (seção 10). */
const DO_AR = {};
for (const arq of ['app.js', 'store.js', 'nuvem.js']) {
  try { DO_AR['/' + arq] = execFileSync('git', ['show', VERSAO_DO_AR + ':' + arq], { cwd: H.RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); } catch (e) { DO_AR['/' + arq] = null; }
}
conf('a versão do ar (' + VERSAO_DO_AR + ') está no clone, para a volta de versão', Object.keys(DO_AR).every(k => typeof DO_AR[k] === 'string' && DO_AR[k].length > 1000), true);

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
const PASTA = path.join(os.tmpdir(), 'nath_n2f2_emulador_' + process.pid);
let emulador = null;
function subirEmulador(regras) {
  fs.mkdirSync(PASTA, { recursive: true });
  fs.writeFileSync(path.join(PASTA, 'firestore.rules'), regras);
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
  console.log('   emulador: PID ' + emulador.pid);
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
const RAIZ_DOCS = 'projects/' + PROJETO + '/databases/(default)/documents';
const docUrl = (uid, rel) => FS + '/v1/' + RAIZ_DOCS + '/usuarios/' + uid + (rel ? '/' + rel : '');
const lerDoc = (token, uid, rel) => rest(docUrl(uid, encodeURIComponent(rel).replace(/%2F/g, '/')), { token });
const listar = (token, uid, colecao) => rest(docUrl(uid, colecao) + '?pageSize=300', { token }).then(r => (r.json && r.json.documents) || []);
const commitRest = (token, writes) => rest(FS + '/v1/' + RAIZ_DOCS + ':commit', { token, corpo: { writes } });
const campoTexto = (d, k) => d && d.fields && d.fields[k] ? d.fields[k].stringValue : undefined;
const campoInt = (d, k) => d && d.fields && d.fields[k] ? Number(d.fields[k].integerValue) : undefined;
const campoBytes = (d, k) => d && d.fields && d.fields[k] && d.fields[k].bytesValue ? Buffer.from(d.fields[k].bytesValue, 'base64') : null;
const sha256 = (buf) => cryptoNode.createHash('sha256').update(buf).digest('hex');
const nomeCompleto = (uid, rel) => RAIZ_DOCS + '/usuarios/' + uid + '/' + rel;

const CFG = { auth: AUTH, firestore: FS, projectId: PROJETO };
const amb = H.criarAmbiente(PORTA_APP, 'nath_n2f2_anexos', trocas);

async function prepararPagina(pag, movel) {
  pag.setDefaultTimeout(60000);
  if (movel) await pag.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  else await pag.setViewport({ width: 1280, height: 900, hasTouch: true });
  await RELOGIO.naPagina(pag);
  pag.errosDePagina = [];
  pag.on('pageerror', e => pag.errosDePagina.push(e.message));
  pag.on('dialog', async d => { try { await d.accept(); } catch (e) { /* ok */ } });
  /* Toda escrita que sai desta página para o emulador, com os nomes dos
   * documentos: é por aqui que a prova conta partes, cabeçalhos e anexos. */
  pag.escritas = [];
  pag.on('request', r => {
    const u = r.url();
    if (u.indexOf(FS) !== 0) return;
    if (/:commit\b/.test(u)) {
      let nomes = [];
      try { nomes = (JSON.parse(r.postData() || '{}').writes || []).map(w => (w.update && w.update.name) || w.delete || ''); } catch (e) { nomes = ['?']; }
      pag.escritas.push({ url: u, nomes });
    } else if (r.method() === 'PATCH' || r.method() === 'DELETE') pag.escritas.push({ url: u, nomes: [u] });
  });
  await pag.evaluateOnNewDocument(cfg => { window.NUVEM_EMULADOR = cfg; }, CFG);
  await pag.evaluateOnNewDocument(movel_ => {
    const largura = movel_ ? 390 : 1280, altura = movel_ ? 844 : 800;
    Object.defineProperty(Screen.prototype, 'width', { configurable: true, get: () => largura });
    Object.defineProperty(Screen.prototype, 'height', { configurable: true, get: () => altura });
  }, !!movel);
  await pag.evaluateOnNewDocument(() => {
    const original = window.fetch;
    window.fetch = function (url) {
      if (String(url).indexOf('ibge') >= 0) return Promise.reject(new Error('sem rede para o IBGE neste teste'));
      return original.apply(this, arguments);
    };
  });
}
const contar = (pag, desde, filtro) => pag.escritas.slice(desde).reduce((n, e) => n + e.nomes.filter(filtro).length, 0);
const partesEscritas = (pag, desde) => contar(pag, desde, x => x.indexOf('/arquivos/') > 0 && x.indexOf('/partes/') > 0);
const cabecalhosEscritos = (pag, desde) => contar(pag, desde, x => x.indexOf('/arquivos/') > 0 && x.indexOf('/partes/') < 0);
const anexosEscritos = (pag, desde) => contar(pag, desde, x => x.indexOf('/anexos/') > 0);
const existe = (pag, sel) => pag.evaluate(s => !!document.querySelector(s), sel);
async function digitar(pag, sel, valor) {
  await pag.evaluate((s, v) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, sel, valor);
}
const clicar = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.click(); return true; }, sel);
async function entrarPelaTela(pag, email, senha, seletorPronto) {
  const form = await esperar('o cartão da nuvem pede e-mail e senha', () => existe(pag, '#nuvem-entrar'), v => v === true, 10000);
  if (!form.ok) return false;
  await digitar(pag, '#nuvem-email', email);
  await digitar(pag, '#nuvem-senha', senha);
  await clicar(pag, '#nuvem-entrar');
  return (await esperar('entrou', () => existe(pag, seletorPronto), v => v === true, 15000)).ok;
}
const editar = (pag, fn) => pag.evaluate(async (corpo) => {
  const d = await Store.carregar();
  (new Function('d', 'Core', corpo))(d, Core);
  await Store.salvar(d);
  return true;
}, fn);
const enviar = pag => pag.evaluate(() => Nuvem.enviarRegistros({ versaoApp: 'prova', tudo: true }).then(r => ({ enviados: r.enviados, erro: r.erro ? r.erro.codigo : null, pulado: r.pulado || null })));
const receber = pag => pag.evaluate(() => Nuvem.receberRegistros().then(r => ({ aplicados: r.aplicados, anexos: r.anexos || 0, baixados: r.arquivosBaixados || 0, invalidos: r.arquivosInvalidos || 0, erro: r.erro ? r.erro.codigo : null, pulado: r.pulado || null })));
const filaArquivos = pag => pag.evaluate(() => Store.lerFila().then(l => l.filter(e => e.tipo === 'anexo').map(e => ({ id: e.id, apagada: !!e.apagadoEm, restauro: !!e.restauro, quarentena: !!e.quarentena })).sort((a, b) => a.id < b.id ? -1 : 1)));
async function enviarAteEsvaziar(pag, vezes) {
  let r = null;
  for (let i = 0; i < (vezes || 4); i++) {
    r = await enviar(pag);
    if (!(await pag.evaluate(() => Store.lerFila().then(l => l.length)))) return Object.assign(r, { rodadas: i + 1, fila: 0 });
  }
  return Object.assign(r || {}, { rodadas: vezes || 4, fila: await pag.evaluate(() => Store.lerFila().then(l => l.length)) });
}
/* O sha256 de um anexo ou de uma imagem guardados no aparelho (null se não estão). */
const shaNoAparelho = (pag, filaId) => pag.evaluate(async id => {
  const p = Store.partesDoIdDoArquivo(id);
  const v = p.origem === 'midia' ? await Store.lerMidia(p.id) : await Store.lerAnexo(p.id);
  const b = await Store.bytesDoArquivo(p.origem, v);
  return b ? Store.sha256Hex(b.bytes) : null;
}, filaId);
async function enviarCopiaPelaTela(pag) {
  const antes = await pag.evaluate(() => (Nuvem.estado().ultimaCopia || {}).id || null);
  await clicar(pag, '#nuvem-enviar');
  const r = await esperar('a cópia subiu', () => pag.evaluate(() => (Nuvem.estado().ultimaCopia || {}).id || null), v => !!v && v !== antes, 30000);
  return r.ok ? r.valor : null;
}
const restaurarPelaApi = (pag, uid, idCopia, celular) => pag.evaluate(async (uid_, id_, cel) => {
  const lista = await Nuvem.listarCopias(uid_);
  const copia = lista.filter(c => c.id === id_)[0] || lista[0];
  const zip = await Nuvem.baixarCopia(uid_, copia.id);
  await Store.importarZip(zip, { daNuvem: true });
  await Nuvem.restaurou(copia, { celular: !!cel });
  return copia.id;
}, uid, idCopia, !!celular);
/* Escreve direto no banco do aplicativo, como a versão anterior grava. */
const idb = (pag, corpo, args) => pag.evaluate((c, a) => new Promise((res, rej) => {
  const r = indexedDB.open('apoio-educacional');
  r.onsuccess = () => {
    const b = r.result, t = b.transaction(['anexos', 'midias', 'notas', 'controle', 'saida'], 'readwrite');
    try { (new Function('t', 'a', c))(t, a); } catch (e) { rej(e.message); }
    t.oncomplete = () => { b.close(); res(true); };
    t.onerror = () => { b.close(); rej(String(t.error)); };
  };
  r.onerror = () => rej('não abriu o banco');
}), corpo, args || null);

/* Bytes que não se repetem (uma cadeia de SHA-256): determinísticos. */
function bytesAleatorios(n, semente) {
  const partes = []; let total = 0, i = 0;
  while (total < n) { const b = cryptoNode.createHash('sha256').update(semente + ':' + (i++)).digest(); partes.push(b); total += b.length; }
  return Buffer.concat(partes).subarray(0, n);
}
/* Um PDF válido de uma página, com um fluxo de bytes que leva o arquivo ao
 * tamanho pedido (1,3 MB: acima de 1 MiB, duas partes de 768 KiB). */
function pdfSintetico(tamanho, semente) {
  const cabeca = Buffer.from('%PDF-1.4\n', 'latin1');
  const objs = [];
  const conteudo = 'BT /F1 24 Tf 72 720 Td (Lista de teste, Aluna Alfa Teste) Tj ET\n';
  objs.push(Buffer.from('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n', 'latin1'));
  objs.push(Buffer.from('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n', 'latin1'));
  objs.push(Buffer.from('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n', 'latin1'));
  objs.push(Buffer.from('4 0 obj\n<< /Length ' + conteudo.length + ' >>\nstream\n' + conteudo + 'endstream\nendobj\n', 'latin1'));
  objs.push(Buffer.from('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n', 'latin1'));
  const fixo = cabeca.length + objs.reduce((s, b) => s + b.length, 0) + 400;
  const recheio = bytesAleatorios(Math.max(0, tamanho - fixo - 60), semente);
  objs.push(Buffer.concat([Buffer.from('6 0 obj\n<< /Length ' + recheio.length + ' >>\nstream\n', 'latin1'), recheio, Buffer.from('\nendstream\nendobj\n', 'latin1')]));
  const offs = []; let pos = cabeca.length;
  objs.forEach(o => { offs.push(pos); pos += o.length; });
  let xref = 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n';
  offs.forEach(o => { xref += String(o).padStart(10, '0') + ' 00000 n \n'; });
  xref += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + pos + '\n%%EOF\n';
  const pdf = Buffer.concat([cabeca].concat(objs).concat([Buffer.from(xref, 'latin1')]));
  if (pdf.length < tamanho) return Buffer.concat([pdf, Buffer.from('%' + 'x'.repeat(Math.max(0, tamanho - pdf.length - 2)) + '\n', 'latin1')]);
  return pdf;
}
/* Abre a aula das 10:00 de hoje na agenda do tablet. */
async function abrirAulaDasDez(pag, hojeIso) {
  await H.irParaAba(pag, 'agenda');
  for (let i = 0; i < 24; i++) {
    if (await pag.evaluate(h => !!document.querySelector('[data-dia="' + h + '"]'), hojeIso)) break;
    await pag.click(i < 12 ? '#mes-seguinte' : '#mes-anterior');
    await H.pausa(120);
  }
  const ok = await pag.evaluate(h => {
    const alvo = Array.from(document.querySelectorAll('[data-dia="' + h + '"] .pilula')).find(p => p.textContent.indexOf('10:00') === 0);
    if (!alvo) return false; alvo.click(); return true;
  }, hojeIso);
  return ok && (await esperar('a aula abriu', () => existe(pag, '#lista-anexos'), v => v === true, 10000)).ok;
}
/* "Anexar PDF" pela tela, com o arquivo escolhido no seletor do navegador. */
async function anexarPelaTela(pag, caminho) {
  const [escolha] = await Promise.all([
    pag.waitForFileChooser({ timeout: 10000 }),
    pag.evaluate(() => { const b = Array.from(document.querySelectorAll('#linha-folha button')).find(x => x.textContent.trim() === 'Anexar PDF'); if (b) b.click(); return !!b; })
  ]);
  await escolha.accept([caminho]);
  const nome = path.basename(caminho);
  return (await esperar('o anexo apareceu na lista', () => pag.evaluate(n => Array.from(document.querySelectorAll('#lista-anexos .item-lista')).some(l => l.textContent.indexOf(n) >= 0), nome), v => v === true, 15000)).ok;
}
const idDoAnexoNaAula = (pag, aulaId, nome) => pag.evaluate((a, n) => Store.carregar().then(d => { const au = d.aulas.find(x => x.id === a); const an = au && (au.anexos || []).find(x => x.nome === n); return an ? an.id : null; }), aulaId, nome);

(async function () {
  const PASTA_ARQ = fs.mkdtempSync(path.join(os.tmpdir(), 'nath_n2f2_arquivos_'));
  const PDF = pdfSintetico(Math.round(1.3 * 1024 * 1024), 'pdf-1');
  const CAMINHO_PDF = path.join(PASTA_ARQ, 'Lista_de_fracoes_teste.pdf');
  fs.writeFileSync(CAMINHO_PDF, PDF);
  const SHA_PDF = sha256(PDF);
  /* Os tamanhos dos três anexos da cópia real de 26/10 (só os tamanhos; o
   * maior é o real, os outros dois dividem o resto: INFERÊNCIA da divisão). */
  const TAMANHOS_REAIS = [1200132, 622814, 622813];
  const ANTIGOS = TAMANHOS_REAIS.map((t, i) => ({ id: 'antigo' + (i + 1), nome: 'Antigo_' + (i + 1) + '_teste.pdf', bytes: pdfSintetico(t, 'antigo-' + i) }));

  secao('1. PRODUÇÃO: o tablet com anexos de antes desta versão abre esta versão, e nada disso sobe sozinho');
  await subirEmulador(REGRAS);
  const dona = (await criarUsuario(DONA)).json;
  const obs = (await criarUsuario(OBS)).json;
  conf('as contas da dona e do observador existem no emulador', !!(dona && dona.localId && obs && obs.localId), true);
  await amb.subir();
  const pagA = await amb.pagina();
  await prepararPagina(pagA, false);
  await H.abrirApp(pagA, amb.ORIGEM);
  const hoje = await pagA.evaluate(() => Core.hojeIso());
  conf('o relógio da rodada vale na página (hoje é 10/11/2026)', hoje, '2026-11-10');
  await pagA.evaluate(async (hoje_) => {
    const d = Store.bancoVazio();
    d.alunos = [{ id: 'alfa', nome: 'Aluna Alfa Teste', ativo: true, precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 100 }] },
      { id: 'beta', nome: 'Aluno Beta Teste', ativo: true, precos: [{ id: 'p2', inicio: '2026-01-01', fim: null, valorHora: 100 }] }];
    d.aulas = [
      { id: 'x1', alunoId: 'alfa', serieId: null, data: hoje_, hora: '10:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] },
      { id: 'x2', alunoId: 'alfa', serieId: null, data: hoje_, hora: '11:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] },
      { id: 'y1', alunoId: 'beta', serieId: null, data: hoje_, hora: '14:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] }
    ];
    d.ajustes = { chavePix: 'pix-de-teste' };
    await Store.salvar(d);
  }, hoje);
  /* Os anexos e a imagem "de antes": gravados direto nos depósitos, sem estado
   * e sem fila, como a versão do ar grava (salvarAnexo era um put solto). */
  const PNG_ANTIGO = await pagA.evaluate(() => { const c = document.createElement('canvas'); c.width = 40; c.height = 30; const x = c.getContext('2d'); x.fillStyle = '#2E7D6B'; x.fillRect(0, 0, 40, 30); return c.toDataURL('image/png'); });
  await idb(pagA, "a.antigos.forEach(function (an) { var bin = atob(an.b64), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); " +
    "t.objectStore('anexos').put({ nome: an.nome, tipo: 'application/pdf', blob: new Blob([u], { type: 'application/pdf' }) }, an.id); }); " +
    "t.objectStore('midias').put({ dataUrl: a.png, w: 40, h: 30 }, 'mAntiga'); " +
    "t.objectStore('notas').put({ paginas: [{ fundo: 'pautado', itens: [{ t: 'imagem', ref: 'mAntiga', x: 10, y: 10, w: 40, h: 30 }] }] }, 'x2');",
    { antigos: ANTIGOS.map(a => ({ id: a.id, nome: a.nome, b64: a.bytes.toString('base64') })), png: PNG_ANTIGO });
  await editar(pagA, "d.aulas.find(a => a.id === 'x1').anexos = [{ id: 'antigo1', nome: 'Antigo_1_teste.pdf', tamanho: 1200132 }, { id: 'antigo2', nome: 'Antigo_2_teste.pdf', tamanho: 622814 }]; " +
    "d.aulas.find(a => a.id === 'x2').anexos = [{ id: 'antigo3', nome: 'Antigo_3_teste.pdf', tamanho: 622813 }]; d.aulas.find(a => a.id === 'x2').temNota = true;");
  await H.abrirApp(pagA, amb.ORIGEM);
  await H.irParaAba(pagA, 'ajustes');
  conf('A entrou', await entrarPelaTela(pagA, DONA.email, DONA.senha, '#nuvem-enviar'), true);
  const copiaK0 = await enviarCopiaPelaTela(pagA);
  conf('a cópia K0 (com os anexos de antes) subiu', !!copiaK0, true);
  conf('A permitiu o observador como leitor', await pagA.evaluate(u => Nuvem.permitirLeitor(u).then(l => l.indexOf(u) >= 0), obs.localId), true);
  const e1 = await enviarAteEsvaziar(pagA, 3);
  conf('a fila de registros (a de antes, do mesmo formato) subiu inteira', e1.erro === null && e1.fila === 0, true);
  conf('os registros estão na nuvem (aula:x1)', (await lerDoc(dona.idToken, dona.localId, 'registros/aula:x1')).status, 200);
  conf('NADA dos anexos e da imagem de antes subiu: zero escritas em arquivos/ e em anexos/', JSON.stringify([partesEscritas(pagA, 0), cabecalhosEscritos(pagA, 0), anexosEscritos(pagA, 0)]), '[0,0,0]');
  conf('a nuvem não tem documento nenhum em anexos/ nem em arquivos/', JSON.stringify([(await listar(dona.idToken, dona.localId, 'anexos')).length, (await listar(dona.idToken, dona.localId, 'arquivos')).length]), '[0,0]');
  conf('nenhum arquivo de antes ganhou estado nem entrada na fila', JSON.stringify([await pagA.evaluate(() => Store.estadoDoArquivo('anexo:antigo1')), (await filaArquivos(pagA)).length]), '[null,0]');
  const partesSeSubissem = TAMANHOS_REAIS.reduce((s, t) => s + Math.ceil(t / (768 * 1024)), 0);
  console.log('   MEDIDA (o que subiria se os anexos de antes subissem de uma vez): ' + TAMANHOS_REAIS.reduce((s, t) => s + t, 0) + ' bytes em 3 anexos, ' +
    partesSeSubissem + ' partes de até 768 KiB, ' + (partesSeSubissem + 3 + 3) + ' escritas (partes, 3 cabeçalhos, 3 documentos), ' +
    Math.ceil(partesSeSubissem / 8 + 3 + 1) + ' commits; armazenamento ~' + (TAMANHOS_REAIS.reduce((s, t) => s + t, 0) / 1048576).toFixed(2) + ' MiB de 1 GiB do Spark, escritas ' + (partesSeSubissem + 6) + ' de 20.000 por dia');

  secao('2. O celular C restaura a cópia de antes: os anexos antigos chegam pelo .zip, como hoje');
  const contextoC = await pagA.browser().createBrowserContext();
  const pagC = await contextoC.newPage();
  await prepararPagina(pagC, true);
  await H.abrirApp(pagC, amb.ORIGEM);
  await esperar('a tela do celular pede a conta', () => existe(pagC, '#cel-conta #nuvem-entrar'), v => v === true, 15000);
  await digitar(pagC, '#cel-conta #nuvem-email', DONA.email);
  await digitar(pagC, '#cel-conta #nuvem-senha', DONA.senha);
  await clicar(pagC, '#cel-conta #nuvem-entrar');
  await esperar('o botão de trazer a cópia', () => existe(pagC, '#cel-trazer'), v => v === true, 15000);
  await clicar(pagC, '#cel-trazer');
  await esperar('a janela lista a cópia', () => pagC.evaluate(() => document.querySelectorAll('#modal-nuvem-restaurar.aberto #nuvem-copias input[type=radio]').length), v => v >= 1, 15000);
  await clicar(pagC, '#nuvem-restaurar-confirmar');
  conf('C restaurou a cópia K0', (await esperar('a cópia chegou', () => pagC.evaluate(async () => !document.querySelector('#modal-nuvem-restaurar.aberto') &&
    (await Store.carregar()).alunos.some(a => a.id === 'alfa')), v => v === true, 30000)).ok, true);
  conf('o anexo antigo está em C pelo .zip, igual ao de A', await shaNoAparelho(pagC, 'anexo:antigo1'), sha256(ANTIGOS[0].bytes));

  secao('3. A anexa um PDF de 1,3 MB pela tela e cola uma imagem na folha: sobem pelo sha256, o PDF em duas partes');
  await H.abrirApp(pagA, amb.ORIGEM);
  conf('a aula das 10:00 abriu no tablet', await abrirAulaDasDez(pagA, hoje), true);
  const escritas3 = pagA.escritas.length;
  conf('o PDF foi anexado pela tela ("Anexar PDF")', await anexarPelaTela(pagA, CAMINHO_PDF), true);
  const idPdf = await idDoAnexoNaAula(pagA, 'x1', 'Lista_de_fracoes_teste.pdf');
  const estadoPdf = await pagA.evaluate(id => Store.estadoDoArquivo('anexo:' + id), idPdf);
  conf('o estado do PDF tem o sha256 calculado antes da transação, o tamanho e a aula', !!estadoPdf && estadoPdf.sha256 === SHA_PDF && estadoPdf.tamanho === PDF.length && estadoPdf.aulaId === 'x1', true);
  conf('o PDF entrou na fila como arquivo', JSON.stringify((await filaArquivos(pagA)).map(e => e.id)), JSON.stringify(['anexo:' + idPdf]));
  const PNG = await pagA.evaluate(() => { const c = document.createElement('canvas'); c.width = 120; c.height = 80; const x = c.getContext('2d'); x.fillStyle = '#B4453C'; x.fillRect(0, 0, 120, 80); x.fillStyle = '#FFFFFF'; x.fillRect(20, 20, 40, 20); return c.toDataURL('image/png'); });
  await pagA.evaluate(async png => {
    await Store.salvarMidia('mNova', { dataUrl: png, w: 120, h: 80 }, { aulaId: 'x1' });
    await Store.salvarNota('x1', { paginas: [{ fundo: 'pautado', itens: [{ t: 'imagem', ref: 'mNova', x: 50, y: 60, w: 120, h: 80 }] }] });
  }, PNG);
  await editar(pagA, "d.aulas.find(a => a.id === 'x1').temNota = true;");
  const SHA_PNG = sha256(Buffer.from(PNG.split(',')[1], 'base64'));
  const e3 = await enviarAteEsvaziar(pagA, 3);
  conf('o envio subiu sem erro e a fila esvaziou', e3.erro === null && e3.fila === 0, true);
  const cabPdf = await lerDoc(dona.idToken, dona.localId, 'arquivos/' + SHA_PDF);
  const shaNoDocPdf = campoTexto((await lerDoc(dona.idToken, dona.localId, 'anexos/anexo:' + idPdf)).json, 'sha256');
  prop('o documento anexos/anexo:<id> leva o sha256 dos bytes do PDF', shaNoDocPdf === SHA_PDF, MODOS[0]);
  if (MODO === MODOS[0]) console.log('   (veneno) sha no documento: ' + shaNoDocPdf + ', sha dos bytes: ' + SHA_PDF);
  if (MODO !== MODOS[0]) {
    conf('o cabeçalho arquivos/{sha} existe com 2 partes, o tamanho e o tipo', cabPdf.status === 200 && campoInt(cabPdf.json, 'partes') === 2 && campoInt(cabPdf.json, 'tamanho') === PDF.length && campoTexto(cabPdf.json, 'tipo') === 'application/pdf', true);
    const p0 = campoBytes((await lerDoc(dona.idToken, dona.localId, 'arquivos/' + SHA_PDF + '/partes/0')).json, 'dados');
    const p1 = campoBytes((await lerDoc(dona.idToken, dona.localId, 'arquivos/' + SHA_PDF + '/partes/1')).json, 'dados');
    conf('as duas partes juntas são o PDF, byte por byte (768 KiB + o resto)', !!p0 && !!p1 && p0.length === 768 * 1024 && Buffer.concat([p0, p1]).equals(PDF), true);
    const docMidia = (await lerDoc(dona.idToken, dona.localId, 'anexos/midia:mNova')).json;
    conf('a imagem colada é anexos/midia:mNova, com o sha256, a aula e as medidas', campoTexto(docMidia, 'sha256') === SHA_PNG && campoTexto(docMidia, 'aulaId') === 'x1' && campoInt(docMidia, 'largura') === 120 && campoInt(docMidia, 'altura') === 80 && campoTexto(docMidia, 'origem') === 'midia', true);
  }
  conf('subiram 3 partes (2 do PDF, 1 da imagem), 2 cabeçalhos e 2 documentos', JSON.stringify([partesEscritas(pagA, escritas3), cabecalhosEscritos(pagA, escritas3), anexosEscritos(pagA, escritas3)]), '[3,2,2]');
  const estPdfDepois = await pagA.evaluate(id => Store.estadoDoArquivo('anexo:' + id), idPdf);
  conf('o estado do PDF em A guarda o carimbo do servidor', !!(estPdfDepois.nuvem && estPdfDepois.nuvem.servidorEm), true);

  secao('4. O celular recebe os metadados e baixa ao abrir: o sha256 do que baixou bate');
  const escritasC4 = pagC.escritas.length;
  const rC4 = await receber(pagC);
  conf('C recebeu os metadados dos dois arquivos', rC4.erro === null && rC4.anexos >= 2, true);
  conf('C tem o estado do PDF e NÃO o arquivo (baixa só quando ela abre)', JSON.stringify([!!(await pagC.evaluate(id => Store.estadoDoArquivo('anexo:' + id), idPdf)), await shaNoAparelho(pagC, 'anexo:' + idPdf)]), '[true,null]');
  await pagC.evaluate(() => { const b = document.querySelector('.cel-aba[data-cel="hoje"]'); if (b) b.click(); });
  await esperar('a linha do tempo mostra a aula x1', () => existe(pagC, '#cel-tempo .cel-bloco[data-aula="x1"]'), v => v === true, 15000);
  await clicar(pagC, '#cel-tempo .cel-bloco[data-aula="x1"]');
  const botao = await esperar('a folha da aula mostra "Abrir" do PDF', () => existe(pagC, '#cel-folha[data-aula="x1"] [data-abrir-anexo="' + idPdf + '"]'), v => v === true, 10000);
  conf('a folha da aula no celular mostra "Abrir Lista_de_fracoes_teste.pdf"', botao.ok && (await pagC.evaluate(id => document.querySelector('[data-abrir-anexo="' + id + '"]').textContent, idPdf)) === 'Abrir Lista_de_fracoes_teste.pdf', true);
  await clicar(pagC, '[data-abrir-anexo="' + idPdf + '"]');
  const baixou = await esperar('o PDF baixou em C', () => shaNoAparelho(pagC, 'anexo:' + idPdf), v => !!v, MODO === MODOS[0] ? 8000 : 20000);
  prop('C baixou o PDF ao tocar em "Abrir", e o sha256 do que baixou é o do PDF de A', baixou.ok && baixou.valor === SHA_PDF, MODOS[0]);
  if (MODO === MODOS[0]) {
    console.log('   (veneno) arquivos recusados em C: ' + await pagC.evaluate(() => Nuvem.estado().registros.arquivosInvalidos));
    throw fimDoVeneno();
  }
  await pagC.evaluate(() => { const m = document.querySelector('#modal-leitor-pdf [data-fechar], #modal-leitor-pdf .fechar'); if (m) m.click(); });
  await H.abrirApp(pagC, amb.ORIGEM);
  await pagC.evaluate(() => { const b = document.querySelector('.cel-aba[data-cel="hoje"]'); if (b) b.click(); });
  await esperar('a linha do tempo mostra a aula x1', () => existe(pagC, '#cel-tempo .cel-bloco[data-aula="x1"]'), v => v === true, 15000);
  await clicar(pagC, '#cel-tempo .cel-bloco[data-aula="x1"]');
  await esperar('"Ver a folha"', () => existe(pagC, '[data-ver-folha="x1"]'), v => v === true, 10000);
  conf('a imagem ainda não está em C antes de abrir a folha', await shaNoAparelho(pagC, 'midia:mNova'), null);
  await clicar(pagC, '[data-ver-folha="x1"]');
  await esperar('a janela da folha abriu', () => existe(pagC, '#modal-nota.aberto'), v => v === true, 15000);
  const img = await esperar('a imagem da folha baixou', () => shaNoAparelho(pagC, 'midia:mNova'), v => !!v, 15000);
  conf('a folha aberta no celular baixou a imagem, e o sha256 bate', img.valor, SHA_PNG);
  conf('a imagem em C é a mesma de A (dataURL igual)', await pagC.evaluate(() => Store.lerMidia('mNova').then(m => m && m.dataUrl)), PNG);
  await pagC.evaluate(() => { const b = document.querySelector('#modal-nota [data-fechar]'); if (b) b.click(); });
  conf('nada saiu de C para a nuvem', pagC.escritas.length - escritasC4, 0);

  secao('5. O mesmo PDF anexado a outra aula sobe uma vez só');
  await editar(pagA, "var a1 = d.aulas.find(a => a.id === 'x1'), a2 = d.aulas.find(a => a.id === 'x2'); a1.hora = '09:00'; a2.hora = '10:00';");
  await H.abrirApp(pagA, amb.ORIGEM);
  conf('a aula x2 (agora às 10:00) abriu', await abrirAulaDasDez(pagA, hoje), true);
  const escritas5 = pagA.escritas.length;
  conf('o mesmo PDF foi anexado à aula x2 pela tela', await anexarPelaTela(pagA, CAMINHO_PDF), true);
  const idPdf2 = await idDoAnexoNaAula(pagA, 'x2', 'Lista_de_fracoes_teste.pdf');
  const e5 = await enviarAteEsvaziar(pagA, 3);
  console.log('   envio: ' + JSON.stringify(e5) + '; partes ' + partesEscritas(pagA, escritas5) + ', cabeçalhos ' + cabecalhosEscritos(pagA, escritas5) + ', anexos ' + anexosEscritos(pagA, escritas5));
  conf('o segundo anexo é outro documento, com o mesmo sha256', idPdf2 && idPdf2 !== idPdf && campoTexto((await lerDoc(dona.idToken, dona.localId, 'anexos/anexo:' + idPdf2)).json, 'sha256') === SHA_PDF, true);
  prop('o mesmo arquivo em duas aulas sobe uma vez: zero partes e zero cabeçalhos no segundo envio', e5.erro === null && partesEscritas(pagA, escritas5) === 0 && cabecalhosEscritos(pagA, escritas5) === 0 && anexosEscritos(pagA, escritas5) === 1, MODOS[1]);
  if (MODO === MODOS[1]) throw fimDoVeneno();
  conf('a nuvem tem um arquivo só para os dois anexos do PDF (e o da imagem)', (await listar(dona.idToken, dona.localId, 'arquivos')).length, 2);

  secao('6. O arquivo adulterado é recusado por quem baixa; as regras recusam as formas erradas');
  const falsos = bytesAleatorios(5000, 'falso');
  const shaQualquer = sha256(Buffer.from('outra coisa'));
  const adult = await commitRest(dona.idToken, [
    { update: { name: nomeCompleto(dona.localId, 'arquivos/' + shaQualquer + '/partes/0'), fields: { dados: { bytesValue: falsos.toString('base64') }, n: { integerValue: '0' } } } },
    { update: { name: nomeCompleto(dona.localId, 'arquivos/' + shaQualquer), fields: { sha256: { stringValue: shaQualquer }, tamanho: { integerValue: '5000' }, tipo: { stringValue: 'application/pdf' }, partes: { integerValue: '1' } } } },
    { update: { name: nomeCompleto(dona.localId, 'anexos/anexo:falso'), fields: { id: { stringValue: 'anexo:falso' }, aulaId: { stringValue: 'x1' }, origem: { stringValue: 'anexo' }, sha256: { stringValue: shaQualquer },
      nome: { stringValue: 'Falso_teste.pdf' }, tipo: { stringValue: 'application/pdf' }, tamanho: { integerValue: '5000' }, atualizadoEm: { stringValue: '2026-11-10T13:00:00.000Z' }, aparelho: { stringValue: 'apAdulterador' }, esquema: { integerValue: '1' } } },
      updateTransforms: [{ fieldPath: 'servidorEm', setToServerValue: 'REQUEST_TIME' }] }
  ]);
  conf('o arquivo adulterado foi posto no emulador (a forma passa; os bytes é que não são do sha)', adult.status, 200);
  const baixouFalso = await pagC.evaluate(() => Nuvem.baixarArquivo('anexo:falso').then(r => 'guardou: ' + !!r, e => 'recusou: ' + e.codigo));
  conf('quem baixa recusa o arquivo cujo sha256 não bate (ARQUIVO_INVALIDO), e não guarda nada', baixouFalso + ' / ' + await shaNoAparelho(pagC, 'anexo:falso'), 'recusou: ARQUIVO_INVALIDO / null');
  conf('a recusa fica contada no estado', await pagC.evaluate(() => Nuvem.estado().registros.arquivosInvalidos), 1);
  await commitRest(dona.idToken, [{ delete: nomeCompleto(dona.localId, 'anexos/anexo:falso') }, { delete: nomeCompleto(dona.localId, 'arquivos/' + shaQualquer) }, { delete: nomeCompleto(dona.localId, 'arquivos/' + shaQualquer + '/partes/0') }]);
  const anexoBase = (id, extra) => ({ update: { name: nomeCompleto(dona.localId, 'anexos/' + id), fields: Object.assign({ id: { stringValue: id }, aulaId: { stringValue: 'x9' }, origem: { stringValue: 'anexo' },
    sha256: { stringValue: SHA_PDF }, nome: { stringValue: 'R_teste.pdf' }, tamanho: { integerValue: '10' }, atualizadoEm: { stringValue: '2026-11-10T13:00:00.000Z' }, aparelho: { stringValue: 'apR' }, esquema: { integerValue: '1' } }, extra || {}) } });
  const controleRegras = await commitRest(dona.idToken, [anexoBase('anexo:r0')]);
  conf('controle: o documento de anexo bem formado passa pelas regras (200)', controleRegras.status, 200);
  const casos = [
    ['o sha256 que não é hexadecimal de 64', [anexoBase('anexo:r1', { sha256: { stringValue: 'ABC' + SHA_PDF.slice(3) } })]],
    ['o campo a mais', [anexoBase('anexo:r2', { conteudo: { stringValue: 'nome da criança' } })]],
    ['o anexo vivo sem sha256', [(() => { const w = anexoBase('anexo:r3'); delete w.update.fields.sha256; return w; })()]],
    ['o id diferente do nome do documento', [anexoBase('anexo:r4', { id: { stringValue: 'anexo:outro' } })]],
    ['a origem que não bate com o id', [anexoBase('anexo:r5', { origem: { stringValue: 'midia' } })]],
    ['a lápide com nome', [anexoBase('anexo:r6', { apagadoEm: { stringValue: '2026-11-10T13:00:00.000Z' } })]],
    ['o cabeçalho com outro sha256 no campo', [{ update: { name: nomeCompleto(dona.localId, 'arquivos/' + SHA_PDF), fields: { sha256: { stringValue: shaQualquer }, tamanho: { integerValue: '1' }, partes: { integerValue: '1' } } } }]],
    ['o cabeçalho cujo nome não é um sha256', [{ update: { name: nomeCompleto(dona.localId, 'arquivos/naoehsha'), fields: { sha256: { stringValue: 'naoehsha' }, tamanho: { integerValue: '1' }, partes: { integerValue: '1' } } } }]],
    ['a parte acima de 900 KiB', [{ update: { name: nomeCompleto(dona.localId, 'arquivos/' + shaQualquer + '/partes/0'), fields: { dados: { bytesValue: Buffer.alloc(901 * 1024, 7).toString('base64') }, n: { integerValue: '0' } } } }]],
    ['a parte com o número trocado', [{ update: { name: nomeCompleto(dona.localId, 'arquivos/' + shaQualquer + '/partes/1'), fields: { dados: { bytesValue: Buffer.alloc(10, 7).toString('base64') }, n: { integerValue: '0' } } } }]],
    ['o tamanho acima de 25 MiB', [anexoBase('anexo:r7', { tamanho: { integerValue: String(25 * 1024 * 1024 + 1) } })]]
  ];
  const recusas = [];
  for (const [rotulo, w] of casos) { const r = await commitRest(dona.idToken, w); recusas.push(r.status === 403 ? null : rotulo + ' (' + r.status + ')'); }
  conf('as regras recusam (403) as ' + casos.length + ' formas erradas', recusas.filter(Boolean).join('; '), '');
  const doObs = await rest(AUTH + '/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake', { corpo: { email: OBS.email, password: OBS.senha, returnSecureToken: true } });
  conf('o observador não escreve em anexos/ da dona (403)', (await commitRest(doObs.json.idToken, [anexoBase('anexo:r8')])).status, 403);
  await commitRest(dona.idToken, [{ delete: nomeCompleto(dona.localId, 'anexos/anexo:r0') }]);

  secao('7. "Remover" no tablet: a lápide chega e o PDF some do celular');
  await editar(pagA, "var a1 = d.aulas.find(a => a.id === 'x1'), a2 = d.aulas.find(a => a.id === 'x2'); a1.hora = '10:00'; a2.hora = '11:00';");
  await H.abrirApp(pagA, amb.ORIGEM);
  conf('a aula x1 abriu', await abrirAulaDasDez(pagA, hoje), true);
  const removeu = await pagA.evaluate(n => {
    const linha = Array.from(document.querySelectorAll('#lista-anexos .item-lista')).find(l => l.textContent.indexOf(n) >= 0);
    const b = linha && Array.from(linha.querySelectorAll('button')).find(x => x.textContent.trim() === 'Remover');
    if (!b) return false; b.click(); return true;
  }, 'Lista_de_fracoes_teste.pdf');
  conf('ela tocou em "Remover" no PDF de x1', removeu, true);
  await esperar('o PDF saiu da aula x1', () => idDoAnexoNaAula(pagA, 'x1', 'Lista_de_fracoes_teste.pdf'), v => v === null, 10000);
  conf('a lápide do PDF entrou na fila', JSON.stringify((await filaArquivos(pagA)).filter(e => e.id === 'anexo:' + idPdf)), JSON.stringify([{ id: 'anexo:' + idPdf, apagada: true, restauro: false, quarentena: false }]));
  const e7 = await enviarAteEsvaziar(pagA, 3);
  const doc7 = (await lerDoc(dona.idToken, dona.localId, 'anexos/anexo:' + idPdf)).json;
  conf('o documento do PDF de x1 é lápide na nuvem, sem nome nem tamanho', e7.erro === null && !!campoTexto(doc7, 'apagadoEm') && campoTexto(doc7, 'nome') === undefined, true);
  conf('o arquivo continua na nuvem (o anexo de x2 aponta para ele; a varredura é da fatia 4)', (await lerDoc(dona.idToken, dona.localId, 'arquivos/' + SHA_PDF)).status, 200);
  const rC7 = await receber(pagC);
  console.log('   recebimento em C: ' + JSON.stringify(rC7));
  /* Achado da primeira rodada: o nome do ARQUIVO cobria o nome do DOCUMENTO no
   * lote, e o cursor dos anexos virava "Lista_de_fracoes_teste.pdf" (a consulta
   * seguinte morria em INVALID_ARGUMENT, para sempre). */
  conf('o segundo recebimento em C, com cursor, não dá erro, e o cursor anda pelo nome do documento', rC7.erro === null &&
    /\/anexos\//.test((await pagC.evaluate(() => Store.lerCursorAnexos())).nome || ''), true);
  /* O celular também recebe sozinho (ao abrir, ao voltar); a prova espera a
   * lápide chegar, venha pelo recebimento dela ou pelo dele. */
  const lapideEmC = await esperar('a lápide do PDF chegou em C', () => receber(pagC).then(() => pagC.evaluate(id => Store.estadoDoArquivo('anexo:' + id).then(e => !!(e && e.apagadoEm)), idPdf)), v => v === true, 15000);
  conf('C recebeu a lápide', lapideEmC.ok, true);
  conf('o PDF sumiu do celular (o arquivo saiu do aparelho e o estado é lápide)', JSON.stringify([await shaNoAparelho(pagC, 'anexo:' + idPdf), !!(await pagC.evaluate(id => Store.estadoDoArquivo('anexo:' + id).then(e => e && e.apagadoEm), idPdf))]), '[null,true]');
  await H.abrirApp(pagC, amb.ORIGEM);
  await pagC.evaluate(() => { const b = document.querySelector('.cel-aba[data-cel="hoje"]'); if (b) b.click(); });
  await esperar('a linha do tempo mostra a aula x1', () => existe(pagC, '#cel-tempo .cel-bloco[data-aula="x1"]'), v => v === true, 15000);
  await clicar(pagC, '#cel-tempo .cel-bloco[data-aula="x1"]');
  await esperar('a folha da aula x1 abriu', () => existe(pagC, '#cel-folha[data-aula="x1"]'), v => v === true, 10000);
  conf('e a folha da aula no celular não mostra mais o "Abrir" dele', await existe(pagC, '[data-abrir-anexo="' + idPdf + '"]'), false);
  await clicar(pagC, '#cel-folha-fechar');

  secao('8. A exclusão do aluno em cascata lapida o anexo e a imagem dele na nuvem');
  await pagA.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 40; c.height = 30; const x = c.getContext('2d'); x.fillStyle = '#1F3A5F'; x.fillRect(0, 0, 40, 30);
    const png = c.toDataURL('image/png');   // outra imagem: a de antes tem o mesmo sha256 e não subiria de novo
    const d = await Store.carregar();
    const blob = new Blob([new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52, 10, 1, 2, 3])], { type: 'application/pdf' });
    await Store.salvarAnexo('anBeta', { nome: 'Beta_teste.pdf', tipo: 'application/pdf', blob: blob }, { aulaId: 'y1' });
    d.aulas.find(a => a.id === 'y1').anexos = [{ id: 'anBeta', nome: 'Beta_teste.pdf', tamanho: 12 }];
    d.aulas.find(a => a.id === 'y1').temNota = true;
    await Store.salvarMidia('mBeta', { dataUrl: png, w: 40, h: 30 }, { aulaId: 'y1' });
    await Store.salvarNota('y1', { paginas: [{ fundo: 'pautado', itens: [{ t: 'imagem', ref: 'mBeta', x: 1, y: 1, w: 40, h: 30 }] }] });
    await Store.salvar(d);
  });
  const e8a = await enviarAteEsvaziar(pagA, 3);
  conf('o anexo e a imagem de Beta subiram', e8a.erro === null && (await lerDoc(dona.idToken, dona.localId, 'anexos/anexo:anBeta')).status === 200 && (await lerDoc(dona.idToken, dona.localId, 'anexos/midia:mBeta')).status === 200, true);
  await pagA.evaluate(async () => { const d = await Store.carregar(); await Store.excluirAlunoEmCascata(d, 'beta'); });
  conf('a cascata enfileirou as duas lápides, na mesma transação', JSON.stringify((await filaArquivos(pagA)).map(e => e.id + (e.apagada ? ':lapide' : ''))), JSON.stringify(['anexo:anBeta:lapide', 'midia:mBeta:lapide']));
  const e8 = await enviarAteEsvaziar(pagA, 3);
  conf('as lápides subiram: os dois documentos têm apagadoEm', e8.erro === null && !!campoTexto((await lerDoc(dona.idToken, dona.localId, 'anexos/anexo:anBeta')).json, 'apagadoEm') && !!campoTexto((await lerDoc(dona.idToken, dona.localId, 'anexos/midia:mBeta')).json, 'apagadoEm'), true);

  secao('9. PRODUÇÃO: restaurar no tablet a cópia de antes desta versão sobe cada arquivo uma vez; de novo, nada');
  const escritas9 = pagA.escritas.length;
  conf('A restaurou a cópia K0 (de antes, sem estado de arquivo)', await restaurarPelaApi(pagA, dona.localId, copiaK0), copiaK0);
  const fila9 = await filaArquivos(pagA);
  console.log('   fila de arquivos depois de restaurar K0: ' + JSON.stringify(fila9));
  conf('a restauração enfileirou cada arquivo da cópia uma vez, com restauro (3 anexos e a imagem)', fila9.filter(e => !e.apagada && e.restauro).map(e => e.id).join(','), 'anexo:antigo1,anexo:antigo2,anexo:antigo3,midia:mAntiga');
  conf('e a lápide do que a nuvem tem e a cópia não (o PDF de x2 e a imagem nova)', fila9.filter(e => e.apagada).map(e => e.id).join(','), ['anexo:' + idPdf2, 'midia:mNova'].sort().join(','));
  const t9 = Date.now();
  const e9 = await enviarAteEsvaziar(pagA, 4);
  const ms9 = Date.now() - t9;
  const partes9 = partesEscritas(pagA, escritas9);
  conf('tudo subiu e a fila esvaziou', e9.erro === null && e9.fila === 0, true);
  conf('subiram as partes dos 3 anexos (2 + 1 + 1) e da imagem (1)', partes9, 5);
  const bytes9 = (await Promise.all(ANTIGOS.map(a => lerDoc(dona.idToken, dona.localId, 'arquivos/' + sha256(a.bytes))))).map(r => campoInt(r.json, 'tamanho')).reduce((s, x) => s + (x || 0), 0);
  console.log('   MEDIDA (restauração da cópia de antes): ' + bytes9 + ' bytes dos 3 anexos, ' + partes9 + ' partes, ' + cabecalhosEscritos(pagA, escritas9) + ' cabeçalhos, ' + anexosEscritos(pagA, escritas9) +
    ' documentos de anexo (com as 2 lápides), em ' + ms9 + ' ms no emulador');
  conf('os bytes dos 3 anexos na nuvem somam os da cópia real (2.445.759)', bytes9, 2445759);
  const anexosNaNuvem = (await listar(dona.idToken, dona.localId, 'anexos')).length;
  const arquivosNaNuvem = (await listar(dona.idToken, dona.localId, 'arquivos')).length;
  const escritas9b = pagA.escritas.length;
  conf('A restaurou a mesma cópia K0 de novo', await restaurarPelaApi(pagA, dona.localId, copiaK0), copiaK0);
  const e9b = await enviarAteEsvaziar(pagA, 4);
  conf('de novo, nenhuma parte sobe e nenhum documento novo aparece (nada duplica)', e9b.erro === null && partesEscritas(pagA, escritas9b) === 0 &&
    (await listar(dona.idToken, dona.localId, 'anexos')).length === anexosNaNuvem && (await listar(dona.idToken, dona.localId, 'arquivos')).length === arquivosNaNuvem, true);
  console.log('   documentos em anexos/: ' + anexosNaNuvem + ', em arquivos/: ' + arquivosNaNuvem);
  console.log('   recebimento em C: ' + JSON.stringify(await receber(pagC)) + '; estado do PDF de x2 em C: ' + JSON.stringify(await pagC.evaluate(id => Store.estadoDoArquivo('anexo:' + id), idPdf2)));
  const lapide9 = await esperar('a lápide do PDF de x2 chegou em C', () => receber(pagC).then(() => pagC.evaluate(id => Store.estadoDoArquivo('anexo:' + id).then(e => !!(e && e.apagadoEm)), idPdf2)), v => v === true, 15000);
  conf('C recebe as lápides da restauração e o PDF de x2 sai de lá também', lapide9.ok, true);

  secao('10. PRODUÇÃO: a volta para a versão do ar (' + VERSAO_DO_AR + ') e a volta para esta');
  /* Uma entrada de anexo esperando na fila: o arquivo gravado sem rede. */
  await pagA.setOfflineMode(true);
  await pagA.evaluate(async () => {
    const d = await Store.carregar();
    await Store.salvarAnexo('pendente1', { nome: 'Pendente_teste.pdf', tipo: 'application/pdf', blob: new Blob([new Uint8Array([37, 80, 68, 70, 9, 9, 9])], { type: 'application/pdf' }) }, { aulaId: 'x1' });
    d.aulas.find(a => a.id === 'x1').anexos.push({ id: 'pendente1', nome: 'Pendente_teste.pdf', tamanho: 7 });
    await Store.salvar(d);
  });
  await pagA.setOfflineMode(false);
  conf('a entrada do anexo pendente está na fila', (await filaArquivos(pagA)).map(e => e.id).join(','), 'anexo:pendente1');
  // a versão do ar, servida de verdade (sem o service worker, que guardaria a desta)
  Object.assign(trocas, { '/app.js': DO_AR['/app.js'], '/store.js': DO_AR['/store.js'], '/nuvem.js': DO_AR['/nuvem.js'] });
  await pagA.setBypassServiceWorker(true);
  await H.abrirApp(pagA, amb.ORIGEM);
  conf('a página roda a versão do ar (sem o salvarArquivo)', await pagA.evaluate(() => typeof Store.reconciliarArquivos), 'undefined');
  await editar(pagA, "d.alunos.find(a => a.id === 'alfa').nome = 'Aluna Alfa Teste';  d.aulas.find(a => a.id === 'x1').notaTexto = 'relato na versão do ar';");
  const e10a = await pagA.evaluate(() => Nuvem.enviarRegistros({ versaoApp: 'do-ar', tudo: true }).then(r => ({ enviados: r.enviados, erro: r.erro ? r.erro.codigo : null })));
  conf('a versão do ar sobe os registros dela sem erro', e10a.erro === null && e10a.enviados >= 1, true);
  conf('a entrada do anexo pendente continua na fila (a versão do ar não a perde nem a sobe)', await pagA.evaluate(() => Store.lerFila().then(l => l.filter(e => e.id === 'anexo:pendente1').length)), 1);
  // a versão do ar remove um anexo solto (sem lápide) e grava outro (sem estado)
  await pagA.evaluate(async () => {
    const d = await Store.carregar();
    await Store.apagarAnexo('antigo2');
    d.aulas.find(a => a.id === 'x1').anexos = d.aulas.find(a => a.id === 'x1').anexos.filter(a => a.id !== 'antigo2');
    await Store.salvarAnexo('doAr1', { nome: 'Do_ar_teste.pdf', tipo: 'application/pdf', blob: new Blob([new Uint8Array([37, 80, 68, 70, 1])], { type: 'application/pdf' }) });
    d.aulas.find(a => a.id === 'x2').anexos.push({ id: 'doAr1', nome: 'Do_ar_teste.pdf', tamanho: 5 });
    d.ajustes.versaoVista = '1.42.18';
    await Store.salvar(d);
  });
  // (os venenos do nuvem.js acabam antes desta seção: aqui o repositório volta a ser servido como está)
  delete trocas['/app.js']; delete trocas['/store.js']; delete trocas['/nuvem.js'];
  // os venenos das seções 13 e 14 voltam a ser servidos daqui em diante
  const VENENO_DO_STORE = MODO === MODOS[2] ? STORE.replace(SO_O_DAQUI, 'if (!e || e.apagadoEm || !p) return;').replace(DEFESA, 'deposito.delete(p.id);')
    : MODO === MODOS[3] ? STORE.replace(DEFESA, 'deposito.delete(p.id);') : null;
  if (VENENO_DO_STORE) trocas['/store.js'] = VENENO_DO_STORE;
  await H.abrirApp(pagA, amb.ORIGEM);
  conf('a página voltou para esta versão', await pagA.evaluate(() => typeof Store.reconciliarArquivos), 'function');
  /* A abertura sincroniza sozinha (a fila pode subir antes de a prova olhar):
   * a prova olha o ESTADO do anexo removido solto, e a nuvem depois. */
  const rec10 = await esperar('a reconciliação lapidou o anexo removido solto', () => pagA.evaluate(() => Store.estadoDoArquivo('anexo:antigo2').then(e => !!(e && e.apagadoEm))), v => v === true, 10000);
  conf('de volta, a reconciliação lapidou o anexo que a versão do ar removeu solto', rec10.ok, true);
  conf('o anexo gravado pela versão do ar (sem estado) não entrou na fila', (await filaArquivos(pagA)).some(e => e.id === 'anexo:doAr1'), false);
  const e10 = await enviarAteEsvaziar(pagA, 3);
  conf('subiram: o pendente vivo, o antigo2 como lápide; o do ar não', e10.erro === null && (await lerDoc(dona.idToken, dona.localId, 'anexos/anexo:pendente1')).status === 200 &&
    !!campoTexto((await lerDoc(dona.idToken, dona.localId, 'anexos/anexo:antigo2')).json, 'apagadoEm') && (await lerDoc(dona.idToken, dona.localId, 'anexos/anexo:doAr1')).status === 404, true);
  await pagA.setBypassServiceWorker(false);

  secao('11. O observador baixa o anexo e nada sobe dele');
  const contextoO = await pagA.browser().createBrowserContext();
  const pagO = await contextoO.newPage();
  await prepararPagina(pagO, true);
  await H.abrirApp(pagO, amb.ORIGEM);
  await clicar(pagO, '#cel-trazer-copia');
  conf('o observador entrou com a conta dele', await entrarPelaTela(pagO, OBS.email, OBS.senha, '#cel-trazer'), true);
  await clicar(pagO, '#cel-trazer');
  await esperar('a janela de restaurar abriu', () => existe(pagO, '#modal-nuvem-restaurar.aberto'), v => v === true, 10000);
  await digitar(pagO, '#nuvem-conta-dona', dona.localId);
  await clicar(pagO, '#nuvem-conta-dona-buscar');
  await esperar('a janela lista as cópias da dona', () => pagO.evaluate(() => document.querySelectorAll('#modal-nuvem-restaurar.aberto #nuvem-copias input[type=radio]').length), v => v >= 1, 15000);
  await clicar(pagO, '#nuvem-restaurar-confirmar');
  conf('o observador trouxe a cópia da dona', (await esperar('o observador restaurou', () => pagO.evaluate(async () => !document.querySelector('#modal-nuvem-restaurar.aberto') && (await Store.carregar()).alunos.some(a => a.id === 'alfa')), v => v === true, 30000)).ok, true);
  await receber(pagO);
  const baixouO = await pagO.evaluate(() => Nuvem.baixarArquivo('anexo:pendente1').then(r => !!(r && r.blob)));
  conf('o observador baixou o anexo pendente1 da nuvem, com o sha256 batendo', baixouO && (await shaNoAparelho(pagO, 'anexo:pendente1')) === (await shaNoAparelho(pagA, 'anexo:pendente1')), true);
  conf('nenhuma escrita saiu do observador para a nuvem', pagO.escritas.length, 0);
  conf('nenhum erro de página em A, C e O', [pagA, pagC, pagO].map(p => p.errosDePagina.join(' | ')).filter(Boolean).join(' || '), '');
  await pagO.close(); await contextoO.close();
  await pagC.close(); await contextoC.close();

  /* No fim, porque o tablet novo que restaura passa a valer (a restauração
   * vence) e mexeria nas seções de cima. */
  secao('12. Um segundo tablet recebe o metadado e baixa o arquivo na hora, sem ela abrir');
  const contextoB = await pagA.browser().createBrowserContext();
  const pagB = await contextoB.newPage();
  await prepararPagina(pagB, false);
  await H.abrirApp(pagB, amb.ORIGEM);
  await H.irParaAba(pagB, 'ajustes');
  conf('o tablet B entrou com a conta da dona', await entrarPelaTela(pagB, DONA.email, DONA.senha, '#nuvem-enviar'), true);
  conf('B restaurou a cópia K0 (sem o anexo pendente1)', await restaurarPelaApi(pagB, dona.localId, copiaK0, false), copiaK0);
  conf('pendente1 não está em B depois de restaurar', await shaNoAparelho(pagB, 'anexo:pendente1'), null);
  const naHora = await esperar('B recebeu e baixou pendente1', () => receber(pagB).then(() => shaNoAparelho(pagB, 'anexo:pendente1')), v => !!v, 20000);
  conf('o tablet baixa na hora o arquivo cujo metadado chegou, e o sha256 bate', naHora.ok && naHora.valor === (await shaNoAparelho(pagA, 'anexo:pendente1')), true);
  conf('nenhum erro de página em B', pagB.errosDePagina.join(' | '), '');
  await pagB.close(); await contextoB.close();

  /* O cenário provado pela lente B (seção 13 dela, 09/11/2026): um segundo
   * tablet em dia recebe o metadado de um anexo novo e o download falha; antes
   * do conserto, a reconciliação o tratava como removido solto, lapidava e
   * mandava a lápide, e o tablet dela APAGAVA o PDF que a aula ainda lista. */
  secao('13. O download que falha no segundo tablet fica "a baixar": não vira lápide nem apaga o PDF do tablet dela');
  const copiaK1 = await enviarCopiaPelaTela(pagA);
  conf('A enviou uma cópia nova (K1), do jeito que está agora', !!copiaK1, true);
  const contextoB2 = await pagA.browser().createBrowserContext();
  const pagB2 = await contextoB2.newPage();
  await prepararPagina(pagB2, false);
  await H.abrirApp(pagB2, amb.ORIGEM);
  await H.irParaAba(pagB2, 'ajustes');
  conf('o tablet B2 entrou com a conta da dona', await entrarPelaTela(pagB2, DONA.email, DONA.senha, '#nuvem-enviar'), true);
  conf('B2 restaurou a cópia K1 (a de agora)', await restaurarPelaApi(pagB2, dona.localId, copiaK1, false), copiaK1);
  const e13b = await enviarAteEsvaziar(pagB2, 4);
  await receber(pagB2);
  console.log('   B2 em dia: ' + JSON.stringify(e13b));
  const NOVO = pdfSintetico(200000, 'novo-1');
  const SHA_NOVO = sha256(NOVO);
  await pagA.evaluate(async b64 => {
    const bin = atob(b64), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const d = await Store.carregar();
    await Store.salvarAnexo('novo1', { nome: 'Novo_1_teste.pdf', tipo: 'application/pdf', blob: new Blob([u], { type: 'application/pdf' }) }, { aulaId: 'x1' });
    d.aulas.find(a => a.id === 'x1').anexos.push({ id: 'novo1', nome: 'Novo_1_teste.pdf', tamanho: u.length });
    await Store.salvar(d);
  }, NOVO.toString('base64'));
  const e13a = await enviarAteEsvaziar(pagA, 3);
  conf('A subiu o novo1 e o tem no aparelho', e13a.erro === null && (await lerDoc(dona.idToken, dona.localId, 'anexos/anexo:novo1')).status === 200 &&
    (await shaNoAparelho(pagA, 'anexo:novo1')) === SHA_NOVO, true);
  // o download em B2 falha: a rede cai para arquivos/ (cabeçalho e partes)
  await pagB2.evaluate(() => {
    if (!window.__fetchSemCorte) window.__fetchSemCorte = window.fetch;
    const original = window.__fetchSemCorte;
    window.fetch = function (url) {
      if (String(url).indexOf('/arquivos/') >= 0) return Promise.reject(new TypeError('a rede caiu (prova)'));
      return original.apply(this, arguments);
    };
  });
  const rB13 = await receber(pagB2);
  const estB13 = await pagB2.evaluate(() => Store.estadoDoArquivo('anexo:novo1'));
  console.log('   recebimento em B2 com a rede cortada para arquivos/: ' + JSON.stringify(rB13));
  conf('B2 recebeu o metadado, o download falhou, e o estado vivo ficou "a baixar" (veio da nuvem), sem o arquivo',
    JSON.stringify([!!estB13 && !estB13.apagadoEm, estB13 && estB13.recebido, estB13 && estB13.aBaixar, await shaNoAparelho(pagB2, 'anexo:novo1')]), '[true,true,true,null]');
  conf('a aula x1 em B2 lista o novo1', await pagB2.evaluate(() => Store.carregar().then(d => d.aulas.find(a => a.id === 'x1').anexos.some(an => an.id === 'novo1'))), true);
  const escritasB13 = pagB2.escritas.length;
  const rec13 = await pagB2.evaluate(() => Store.reconciliarArquivos());
  prop('a reconciliação em B2 não lapida o "a baixar" (0 lápides)', rec13.lapides === 0, MODOS[2]);
  if (MODO === MODOS[2]) console.log('   (veneno) reconciliação em B2: ' + JSON.stringify(rec13));
  const e13c = await enviarAteEsvaziar(pagB2, 3);
  const lapidesDeB2 = contar(pagB2, escritasB13, x => x.indexOf('/anexos/anexo:novo1') > 0);
  const doc13 = (await lerDoc(dona.idToken, dona.localId, 'anexos/anexo:novo1')).json;
  prop('nenhuma lápide sai de B2 e o documento do novo1 segue vivo na nuvem', e13c.erro === null && lapidesDeB2 === 0 && !campoTexto(doc13, 'apagadoEm') && campoTexto(doc13, 'sha256') === SHA_NOVO, MODOS[2]);
  const rA13 = await receber(pagA);
  const x1EmA = await pagA.evaluate(() => Store.carregar().then(d => d.aulas.find(a => a.id === 'x1').anexos.map(an => an.id)));
  const shaA13 = await shaNoAparelho(pagA, 'anexo:novo1');
  console.log('   recebimento em A: ' + JSON.stringify(rA13) + '; a aula x1 em A lista ' + JSON.stringify(x1EmA) + '; sha do novo1 em A: ' + shaA13);
  prop('o PDF novo1 segue intacto no tablet A, e a aula x1 o lista', shaA13 === SHA_NOVO && x1EmA.indexOf('novo1') >= 0, MODOS[2]);
  if (MODO === MODOS[2]) {
    console.log('   (veneno) baixar o novo1 da nuvem agora devolve: ' + await pagB2.evaluate(() => Nuvem.baixarArquivo('anexo:novo1').then(r => String(r), e => 'erro ' + e.codigo)));
    throw fimDoVeneno();
  }
  // a rede volta: o "a baixar" é pedido de novo na rodada seguinte, sem novidade nenhuma na nuvem
  await pagB2.evaluate(() => { window.fetch = window.__fetchSemCorte; });
  const rB13b = await receber(pagB2);
  console.log('   recebimento seguinte em B2: ' + JSON.stringify(rB13b));
  const estB13b = await pagB2.evaluate(() => Store.estadoDoArquivo('anexo:novo1'));
  conf('na rodada seguinte o "a baixar" baixou em B2, com o sha256 do de A, e deixou de estar "a baixar"',
    JSON.stringify([await shaNoAparelho(pagB2, 'anexo:novo1') === SHA_NOVO, estB13b && estB13b.aBaixar]), '[true,false]');
  conf('nenhum erro de página em B2', pagB2.errosDePagina.join(' | '), '');
  await pagB2.close(); await contextoB2.close();

  secao('14. A defesa: a lápide de um anexo que a aula viva ainda cita não apaga o arquivo do tablet');
  const NOVO2 = pdfSintetico(50000, 'novo-2');
  const SHA_NOVO2 = sha256(NOVO2);
  await pagA.evaluate(async b64 => {
    const bin = atob(b64), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const d = await Store.carregar();
    await Store.salvarAnexo('novo2', { nome: 'Novo_2_teste.pdf', tipo: 'application/pdf', blob: new Blob([u], { type: 'application/pdf' }) }, { aulaId: 'x1' });
    d.aulas.find(a => a.id === 'x1').anexos.push({ id: 'novo2', nome: 'Novo_2_teste.pdf', tamanho: u.length });
    await Store.salvar(d);
  }, NOVO2.toString('base64'));
  const e14 = await enviarAteEsvaziar(pagA, 3);
  conf('A subiu o novo2', e14.erro === null && (await lerDoc(dona.idToken, dona.localId, 'anexos/anexo:novo2')).status === 200, true);
  // uma lápide de outro aparelho, posta direto no emulador, com a aula x1 ainda citando o novo2
  const lap14 = await commitRest(dona.idToken, [{ update: { name: nomeCompleto(dona.localId, 'anexos/anexo:novo2'), fields: { id: { stringValue: 'anexo:novo2' }, aulaId: { stringValue: 'x1' },
    origem: { stringValue: 'anexo' }, sha256: { stringValue: SHA_NOVO2 }, atualizadoEm: { stringValue: '2026-11-10T15:00:00.000Z' }, apagadoEm: { stringValue: '2026-11-10T15:00:00.000Z' },
    aparelho: { stringValue: 'apOutroTablet' }, esquema: { integerValue: '1' } } }, updateTransforms: [{ fieldPath: 'servidorEm', setToServerValue: 'REQUEST_TIME' }] }]);
  conf('a lápide de outro aparelho entrou na nuvem', lap14.status, 200);
  const lapEmA = await esperar('a lápide do novo2 chegou em A', () => receber(pagA).then(() => pagA.evaluate(() => Store.estadoDoArquivo('anexo:novo2').then(e => !!(e && e.apagadoEm)))), v => v === true, 15000);
  conf('A recebeu a lápide (o estado é lápide)', lapEmA.ok, true);
  prop('o PDF novo2 continua no tablet A, porque a aula x1 ainda o cita', (await shaNoAparelho(pagA, 'anexo:novo2')) === SHA_NOVO2, MODOS[3]);
  if (MODO === MODOS[3]) throw fimDoVeneno();
  console.log('   (o "Remover" legítimo, em que a aula deixa de citar o anexo, segue apagando no celular: seção 7)');
  conf('nenhum erro de página em A', pagA.errosDePagina.join(' | '), '');
  try { fs.rmSync(PASTA_ARQ, { recursive: true, force: true }); } catch (e) { /* fica no temporário */ }
})().then(() => derrubarEmulador().then(H.fim(amb)), e => derrubarEmulador().then(() => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e))));
