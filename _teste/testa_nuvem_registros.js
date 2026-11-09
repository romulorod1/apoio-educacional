/* testa_nuvem_registros.js
 *
 * N1, fatia 2: a fila `saida` e o envio por registro, contra o Firebase
 * Emulator Suite (Auth e Firestore), como o testa_nuvem.js.
 *
 * O que prova, com dados fictícios:
 *   1. a nuvem RECUSANDO (regras sem o caminho dos registros, como um projeto
 *      em que as regras novas ainda não foram coladas): o envio devolve
 *      PERMISSION_DENIED, nada trava, a fila fica inteira, e o cartão da nuvem
 *      em Ajustes diz que a nuvem ainda não aceita e quantas mudanças estão
 *      guardadas;
 *   2. com as regras novas publicadas (trocadas no emulador em pleno voo), a
 *      mesma fila sobe: um documento por registro em usuarios/{uid}/registros,
 *      metadados (id, tipo, atualizadoEm, aparelho, esquema, app) e o conteúdo
 *      em `dados`, como dado legível do Firestore (decisão do dono de
 *      08/11/2026: sem cifra; quem protege são o login e as regras, e um
 *      estranho não lê nem escreve registro); ajuste do aparelho (versaoVista)
 *      nunca entra na fila; lápide sobe sem conteúdo; a cópia completa continua
 *      subindo com as regras novas e leva o mesmo id de aparelho dos registros
 *      (o do Store);
 *   3. a fila sobrevive a fechar sem sinal (a página fica sem rede, grava,
 *      "fecha", recarrega) e sobe ao voltar, pelo gatilho de sempre;
 *   4. a gravação e a entrada na fila são ATÔMICAS: a transação do dado
 *      abortada (o tablet sem espaço, simulado no put do principal) não deixa
 *      entrada na fila;
 *   5. o celular só leitura (D6a) restaura a cópia, não enfileira nada e nunca
 *      envia registro: zero commits saem dele.
 *
 * Venenos, que TÊM de reprovar a propriedade (a rodada passa quando a prova VÊ
 * o veneno):
 *   --envenenado-fila-fora-da-transacao  o store.js servido grava a entrada da
 *                                        fila numa transação à parte: o dado
 *                                        abortado deixa entrada na fila.
 *
 * Portas: 8831 (app), 8833 (auth), 8834 (firestore), 8835 (hub), 8836 (log),
 * 8837 (websocket). Precisa do firebase-tools fora do repositório e de um JDK
 * 21 em JAVA_HOME, como os irmãos.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const MODOS = ['--envenenado-fila-fora-da-transacao', '--envenenado-culpa-na-recusa-total'];
const MODO = MODOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const FILA_FORA = MODO === MODOS[0];
function prop(rotulo, ok, veneno) {
  if (MODO && MODO === veneno) return conf('VENENO visto: ' + rotulo + ', e quebrou', ok, false);
  return conf(rotulo, ok, true);
}

const PORTA_APP = 8831, PORTA_AUTH = 8833, PORTA_FS = 8834, PORTA_HUB = 8835, PORTA_LOG = 8836, PORTA_WS = 8837;
const PROJETO = 'demo-nath-n1f2';
const AUTH = 'http://127.0.0.1:' + PORTA_AUTH;
const FS = 'http://127.0.0.1:' + PORTA_FS;
const FIREBASE = process.env.FIREBASE_TOOLS ||
  'C:/Users/romul/ferramentas/firebase-tools/node_modules/firebase-tools/lib/bin/firebase.js';
const JAVA_HOME = process.env.JAVA_HOME || '';
const DONA = { email: 'dona@exemplo.test', senha: 'senha-da-dona-1' };
const ESTRANHO = { email: 'estranho@exemplo.test', senha: 'senha-do-estranho-1' };

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const NUVEM = fs.readFileSync(path.join(H.RAIZ, 'nuvem.js'), 'utf8');
const STORE = fs.readFileSync(path.join(H.RAIZ, 'store.js'), 'utf8');
const REGRAS = fs.readFileSync(path.join(H.RAIZ, 'firestore.rules'), 'utf8');

/* ---------- âncoras ---------- */
secao('0. As âncoras, o veneno e o ambiente');
const DADOS_LEGIVEIS = 'if (!reg.apagadoEm && reg.dados !== null && reg.dados !== undefined) campo.dados = reg.dados;';
const ENFILEIRAR = 'function enfileirar(saida, entrada) { saida.put(entrada); }';
const SAIDA_NA_TRANSACAO = "var saida = opcoes.semFila ? null : t.objectStore('saida');";
// desde a fatia 3: recebe e envia; `tudo` (N2) leva as páginas de folha sem esperar; `fechando` manda o commit com keepalive
const GATILHO = "Nuvem.sincronizarSeDevido({ versaoApp: VERSAO, tudo: true, fechando: motivo === 'fechar' });";
// desde o D6b: o celular da dona passa, e só com escritas de registro
/* (D7) no celular da dona, além do registro, só passa o diagnóstico do PRÓPRIO
 * aparelho (soDiagnosticoProprio). Desde a N2 a primeira guarda do commit
 * recusa `folhas/` fora do tablet: a âncora aceita essa linha antes da guarda
 * dos registros. */
const COMMIT_TRAVADO = /function commit\(escritas, opcoes\) \{[\s\S]{0,400}?if \(!podeEnviarCopia\(\) && !\(celularDaDona\(\) && \(soRegistros\(escritas\) \|\| soDiagnosticoProprio\(escritas\)\)\)\)/;
const REGISTROS_NAS_REGRAS = 'match /registros/{registro} {';
conf('o conteúdo do registro vai em dados, como dado legível, num lugar só (sem cifra)', NUVEM.split(DADOS_LEGIVEIS).length === 2 && !/subtle\.|AES-GCM/.test(NUVEM), true);
conf('o store.js enfileira num lugar só, na transação de quem chamou', STORE.split(ENFILEIRAR).length, 2);
conf('a fila é um depósito da MESMA transação do dado', STORE.split(SAIDA_NA_TRANSACAO).length, 2);
conf("os depósitos do documento incluem a fila", STORE.indexOf("var DEPOSITOS_DO_DOCUMENTO = ['dados', 'registros', 'controle', 'saida'];") > 0, true);
conf('o app.js dispara o envio nos momentos da cópia, num lugar só', APP.split(GATILHO).length, 2);
conf('o envio dos registros passa pelo commit, que recusa no aparelho que só lê (e no celular da dona, tudo o que não for registro ou o diagnóstico do próprio aparelho)', COMMIT_TRAVADO.test(NUVEM) && NUVEM.indexOf("gravacaoCarimbada(nomeDoc(uid, p.colecao + p.doc.id), p.doc, precondicao)") > 0 && NUVEM.indexOf("return Promise.resolve({ colecao: 'registros/', doc: doc, ") > 0, true);
conf('as regras têm o caminho dos registros, com a forma conferida', REGRAS.split(REGISTROS_NAS_REGRAS).length === 2 && REGRAS.indexOf('registroValido(registro)') > 0, true);
conf('a lista de ajustes do aparelho tem versaoVista', /AJUSTES_DO_APARELHO = \[[^\]]*'versaoVista'/.test(STORE), true);

/* As regras "velhas": as novas sem o bloco dos registros. É o projeto em que
 * as regras novas ainda não foram coladas (ou em que nada permite o caminho). */
const INICIO_BLOCO = REGRAS.indexOf('      // registros (N1)');
const FIM_BLOCO = REGRAS.indexOf('      // fim registros (N1)');
conf('o bloco dos registros nas regras tem começo e fim marcados', INICIO_BLOCO > 0 && FIM_BLOCO > INICIO_BLOCO, true);
const REGRAS_VELHAS = REGRAS.slice(0, INICIO_BLOCO) + REGRAS.slice(FIM_BLOCO);
conf('as regras velhas não têm o caminho dos registros', REGRAS_VELHAS.indexOf(REGISTROS_NAS_REGRAS), -1);

/* O critério de culpa: só quem ficou de fora enquanto outros passaram, ou erro
 * de forma. O veneno volta a contar também quem já tinha tentativa, e aí a
 * recusa total da nuvem leva um bom sozinho à quarentena. */
const CULPA = "return r.enviados > 0 || (r.erro && (r.erro.codigo === 'INVALID_ARGUMENT' || r.erro.codigo === 'PAGINA_GRANDE'));";
conf('o critério de culpa está num lugar só', NUVEM.split(CULPA).length, 2);
const trocas = {};
if (MODO === MODOS[1]) trocas['/nuvem.js'] = NUVEM.replace(CULPA, "return r.enviados > 0 || (r.erro && r.erro.codigo === 'INVALID_ARGUMENT') || (i.fila.tentativas || 0) > 0;");
if (FILA_FORA) {
  trocas['/store.js'] = STORE.replace(ENFILEIRAR,
    "function enfileirar(saida, entrada) { setTimeout(function () { escrever('saida', function (s) { return s.put(entrada); }).catch(function () {}); }, 0); }");
}
if (MODO) conf('o arquivo servido ficou diferente do repositório (' + MODO + ')', (trocas['/nuvem.js'] || NUVEM) !== NUVEM || (trocas['/store.js'] || STORE) !== STORE, true);

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
const PASTA = path.join(os.tmpdir(), 'nath_n1f2_emulador_' + process.pid);
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
/* As regras trocadas em pleno voo, pela porta do emulador: é o "Publicar" do
 * console, sem derrubar nada. */
async function publicarRegras(regras) {
  const r = await rest(FS + '/emulator/v1/projects/' + PROJETO + ':securityRules', { metodo: 'PUT',
    corpo: { rules: { files: [{ name: 'firestore.rules', content: regras }] } } });
  return r.status;
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
/* Todos os registros dela no servidor, como { id: campos }. */
async function registrosNoServidor(token, uid) {
  const saida = {};
  let pageToken = null;
  do {
    const r = await rest(docUrl(uid, 'registros') + '?pageSize=300' + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : ''), { token });
    if (r.status !== 200) return { status: r.status, docs: saida };
    ((r.json && r.json.documents) || []).forEach(d => { saida[decodeURIComponent(d.name.split('/registros/')[1])] = d.fields; });
    pageToken = r.json && r.json.nextPageToken;
  } while (pageToken);
  return { status: 200, docs: saida };
}

const CFG = { auth: AUTH, firestore: FS, projectId: PROJETO };
const amb = H.criarAmbiente(PORTA_APP, 'nath_n1f2_registros', trocas);

async function prepararPagina(pag, movel) {
  pag.setDefaultTimeout(60000);
  if (movel) await pag.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  pag.errosDePagina = [];
  pag.on('pageerror', e => pag.errosDePagina.push(e.message));
  pag.dialogos = [];
  pag.on('dialog', async d => { pag.dialogos.push(d.message()); try { await d.accept(); } catch (e) { /* ok */ } });
  pag.commits = [];
  pag.on('request', r => { const u = r.url(); if (u.indexOf(FS) === 0 && /:commit\b/.test(u)) pag.commits.push(u); });
  await pag.evaluateOnNewDocument(cfg => { window.NUVEM_EMULADOR = cfg; }, CFG);
  if (!movel) {
    await pag.evaluateOnNewDocument(() => {
      Object.defineProperty(Screen.prototype, 'width', { configurable: true, get: () => 1280 });
      Object.defineProperty(Screen.prototype, 'height', { configurable: true, get: () => 800 });
    });
  }
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
const fila = pag => pag.evaluate(() => Store.lerFila().then(l => l.map(e => e.id).sort()));
const enviar = pag => pag.evaluate(() => Nuvem.enviarRegistros({ versaoApp: 'prova' }));
const redesenhar = pag => pag.evaluate(() => { if (typeof Nuvem.contarFila === 'function') return Nuvem.contarFila().then(() => document.querySelector('#nuvem-registros') && document.querySelector('#nuvem-registros').textContent); });
const NOME_FICTICIO = 'Aluna Alfa Teste';
function textoDoServidor(docs) {
  const partes = [];
  Object.keys(docs).forEach(id => {
    const f = docs[id];
    partes.push(JSON.stringify(f));
    if (f.dados && f.dados.bytesValue) partes.push(Buffer.from(f.dados.bytesValue, 'base64').toString('latin1'));
  });
  return partes.join('\n');
}

(async function () {
  secao('1. O emulador sobe com as regras VELHAS (sem o caminho dos registros) e a conta existe');
  await subirEmulador(REGRAS_VELHAS);
  const dona = (await criarUsuario(DONA)).json;
  const estranho = (await criarUsuario(ESTRANHO)).json;
  conf('a conta do estranho existe no emulador', !!(estranho && estranho.localId), true);
  conf('a conta da dona existe no emulador', !!(dona && dona.localId), true);

  secao('2. O tablet entra, grava dados fictícios e a fila nasce na mesma gravação');
  await amb.subir();
  const pagA = await amb.pagina();
  await prepararPagina(pagA, false);
  await H.abrirApp(pagA, amb.ORIGEM);
  const gravou = await pagA.evaluate(async (nome) => {
    const d = Store.bancoVazio();
    d.alunos = [{ id: 'alfa', nome: nome, ativo: true, precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 100 }] }];
    d.series = [{ id: 's1', alunoId: 'alfa', dias: [1, 3], hora: '10:00', duracaoMin: 60, inicio: '2026-06-01', fim: '2026-06-30', exclusoes: [], materializadoAte: '2026-06' }];
    d.aulas = ['2026-06-01', '2026-06-03', '2026-06-08'].map(data => ({ id: 's1@' + data, alunoId: 'alfa', serieId: 's1', destacada: false, data, hora: '10:00',
      duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: 'nota da ' + nome, anexos: [] }));
    d.resumos = [{ alunoId: 'alfa', mes: '2026-06', texto: 'Resumo da ' + nome }];
    d.pagamentos = [{ id: 'pg1', alunoId: 'alfa', mes: '2026-05', pagoEm: '2026-06-02', valor: 300 }];
    d.ajustes = { chavePix: 'pix-de-teste', versaoVista: '9.9.9', valoresOcultos: false };
    await Store.salvar(d);
    const f = (await Store.lerFila()).map(e => e.id).sort();
    const regs = await Store.lerRegistros();
    return { fila: f, aparelho: Store.aparelho(), vivos: regs.filter(r => !r.apagadoEm).length };
  }, NOME_FICTICIO);
  const ESPERADOS_NA_FILA = ['ajuste:chavePix', 'aluno:alfa', 'aula:s1@2026-06-01', 'aula:s1@2026-06-03', 'aula:s1@2026-06-08', 'pagamento:pg1', 'resumo:alfa:2026-06', 'serie:s1'];
  // o aplicativo pode ter gravado ajustes próprios dele antes (versaoVista é do aparelho e não entra; outros entram)
  conf('a fila tem cada item sincronizável do que ela gravou', ESPERADOS_NA_FILA.every(id => gravou.fila.indexOf(id) >= 0), true);
  conf('e não tem o ajuste do aparelho nem a raiz', gravou.fila.some(id => id === 'ajuste:versaoVista' || id === 'ajuste:valoresOcultos' || id.indexOf('raiz:') === 0), false);
  conf('o Store já tem o id deste aparelho', /^ap[0-9a-f]{12}$/.test(gravou.aparelho || ''), true);
  await H.abrirApp(pagA, amb.ORIGEM);
  conf('o tablet entrou com e-mail e senha pela tela', await entrarPelaTela(pagA, DONA.email, DONA.senha), true);
  await clicar(pagA, '#nuvem-enviar');
  const copiaSubiu = await esperar('a cópia completa subiu', () => texto(pagA, '#nuvem-ultima'), v => /^Última cópia na nuvem: hoje/.test(v || ''), 30000);
  conf('a cópia completa sobe com as regras velhas (fase 0 intacta)', copiaSubiu.ok, true);
  const filaAntes = await fila(pagA);

  secao('3. A nuvem recusa os registros: nada trava, a fila fica e Ajustes diz');
  const recusa = await enviar(pagA);
  conf('o envio devolve o erro de permissão, sem rejeitar', recusa && recusa.erro && recusa.erro.codigo, 'PERMISSION_DENIED');
  conf('nenhum registro subiu', recusa.enviados, 0);
  conf('a fila ficou inteira', JSON.stringify(await fila(pagA)), JSON.stringify(filaAntes));
  const fraseRecusa = await redesenhar(pagA);
  conf('Ajustes diz que a nuvem ainda não aceita e quantas mudanças estão guardadas',
    new RegExp('ainda não aceita as mudanças uma a uma.*' + filaAntes.length + ' mudanças guardadas aqui').test(fraseRecusa || ''), true);
  conf('o estado da nuvem guarda o erro para a tela', await pagA.evaluate(() => Nuvem.estado().registros.erro.codigo), 'PERMISSION_DENIED');
  conf('o servidor não tem registro nenhum (a leitura também é recusada)', (await registrosNoServidor(dona.idToken, dona.localId)).status, 403);
  conf('o aplicativo segue vivo: nenhum erro de página', pagA.errosDePagina.join(' | '), '');

  secao('4. As regras novas publicadas: a mesma fila sobe, com os metadados e o conteúdo legível');
  conf('as regras novas foram publicadas no emulador em pleno voo', await publicarRegras(REGRAS), 200);
  const envio = await enviar(pagA);
  conf('o envio sobe tudo o que estava na fila', envio.enviados, filaAntes.length);
  conf('sem erro', envio.erro === undefined || envio.erro === null, true);
  conf('a fila ficou vazia', (await fila(pagA)).length, 0);
  conf('Ajustes diz que tudo subiu', /Todas as mudanças já subiram/.test((await redesenhar(pagA)) || ''), true);
  const noServidor = await registrosNoServidor(dona.idToken, dona.localId);
  conf('a dona lê os registros dela no servidor', noServidor.status, 200);
  const ids = Object.keys(noServidor.docs).sort();
  conf('há um documento por entrada da fila, pelo id do registro', JSON.stringify(ids), JSON.stringify(filaAntes));
  const aulaDoc = noServidor.docs['aula:s1@2026-06-03'];
  conf('o documento da aula tem só os metadados esperados mais dados (sem iv)',
    aulaDoc && Object.keys(aulaDoc).sort().join(','), 'aparelho,app,atualizadoEm,dados,esquema,id,servidorEm,tipo');
  conf('servidorEm é a hora do servidor (timestamp), posta pelo commit', aulaDoc && 'timestampValue' in aulaDoc.servidorEm, true);
  conf('os metadados em claro: id, tipo, atualizadoEm ISO, aparelho do Store, esquema 1, app',
    aulaDoc && aulaDoc.id.stringValue === 'aula:s1@2026-06-03' && aulaDoc.tipo.stringValue === 'aula' && !isNaN(new Date(aulaDoc.atualizadoEm.stringValue).getTime()) &&
      aulaDoc.aparelho.stringValue === gravou.aparelho && aulaDoc.esquema.integerValue === '1' && aulaDoc.app.stringValue === 'prova', true);
  conf('o conteúdo vai em dados como mapa do Firestore, legível: a nota da aula está lá, como texto',
    aulaDoc && aulaDoc.dados.mapValue && aulaDoc.dados.mapValue.fields.notaTexto.stringValue, 'nota da ' + NOME_FICTICIO);
  conf('os tipos do mapa: inteiro, booleano, texto e lista vazia', aulaDoc && aulaDoc.dados.mapValue.fields.duracaoMin.integerValue === '60' &&
    aulaDoc.dados.mapValue.fields.cobravel.booleanValue === true && aulaDoc.dados.mapValue.fields.data.stringValue === '2026-06-03' &&
    'arrayValue' in aulaDoc.dados.mapValue.fields.anexos, true);
  const tudo = textoDoServidor(noServidor.docs);
  conf('o nome fictício da aluna está no registro do aluno (dado legível, protegido pelas regras)', tudo.indexOf(NOME_FICTICIO) >= 0, true);
  conf('o estranho não lê os registros dela (a regra nega a lista)', (await registrosNoServidor(estranho.idToken, dona.localId)).status, 403);
  conf('o estranho não lê um registro dela pelo nome', (await lerDoc(estranho.idToken, dona.localId, 'registros/aula:s1@2026-06-03')).status, 403);
  conf('o estranho não escreve por cima de um registro dela', (await rest(docUrl(dona.localId, 'registros/aula:s1@2026-06-03'), { token: estranho.idToken, metodo: 'PATCH',
    corpo: { fields: { id: { stringValue: 'aula:s1@2026-06-03' }, tipo: { stringValue: 'aula' }, atualizadoEm: { stringValue: '2026-11-08T00:00:00.000Z' },
      aparelho: { stringValue: 'ap000000000000' }, esquema: { integerValue: '1' } } } })).status, 403);
  conf('sem login ninguém lê registro', (await lerDoc(null, dona.localId, 'registros/aula:s1@2026-06-03')).status, 403);
  const ponteiro = (await lerDoc(dona.idToken, dona.localId, 'estado/copia')).json;
  const metaCopia = (await lerDoc(dona.idToken, dona.localId, 'copias/' + ponteiro.fields.atual.stringValue)).json;
  conf('a cópia completa leva o mesmo id de aparelho dos registros (o do Store), ao lado do rótulo',
    metaCopia.fields.aparelhoId && metaCopia.fields.aparelhoId.stringValue === gravou.aparelho && /^(tablet|celular) /.test(metaCopia.fields.aparelho.stringValue), true);

  secao('5. Lápide sobe sem conteúdo; ajuste do aparelho não entra na fila; a edição que vale é a última');
  const edicao = await pagA.evaluate(async () => {
    const d = await Store.carregar();
    d.aulas = d.aulas.filter(a => a.id !== 's1@2026-06-08');
    d.ajustes.versaoVista = '8.8.8';
    d.ajustes.chavePix = 'pix-novo';
    await Store.salvar(d);
    const f1 = (await Store.lerFila()).map(e => e.id).sort();
    const r = await Nuvem.enviarRegistros({ versaoApp: 'prova' });
    return { fila: f1, enviados: r.enviados, erro: r.erro || null, filaDepois: (await Store.lerFila()).length };
  });
  conf('a fila da edição tem a lápide da aula e a chave Pix, e não o ajuste do aparelho', JSON.stringify(edicao.fila), JSON.stringify(['ajuste:chavePix', 'aula:s1@2026-06-08']));
  conf('os dois subiram e a fila esvaziou', edicao.enviados + '/' + edicao.filaDepois + '/' + (edicao.erro === null), '2/0/true');
  const depois = await registrosNoServidor(dona.idToken, dona.localId);
  const lapide = depois.docs['aula:s1@2026-06-08'];
  conf('a lápide no servidor tem apagadoEm e não tem conteúdo', lapide && 'apagadoEm' in lapide && !('dados' in lapide), true);
  conf('o ajuste do aparelho não está no servidor', 'ajuste:versaoVista' in depois.docs, false);
  conf('o ajuste dela foi atualizado no servidor (pix-novo)', JSON.stringify(depois.docs['ajuste:chavePix'].dados), JSON.stringify({ stringValue: 'pix-novo' }));

  secao('5b. Um registro que a nuvem recusa sozinho não derruba a fila: tentativas, quarentena e a frase');
  const quarentena = await pagA.evaluate(async () => {
    const P = {};
    // um registro que a regra recusa (tipo com mais de 32 letras), posto por fora, com a entrada dele na fila
    const agora = new Date().toISOString();
    await new Promise((res, rej) => {
      const q = indexedDB.open('apoio-educacional');
      q.onsuccess = () => {
        const t = q.result.transaction(['registros', 'saida'], 'readwrite');
        t.objectStore('registros').put({ id: 'aula:ruim', tipo: 'x'.repeat(40), atualizadoEm: agora, apagadoEm: null, aparelho: Store.aparelho(), esquema: 1, ordem: 9999, dados: { id: 'ruim' } });
        t.objectStore('saida').put({ id: 'aula:ruim', tipo: 'x'.repeat(40), atualizadoEm: agora, apagadoEm: null });
        t.oncomplete = () => { q.result.close(); res(); };
        t.onerror = () => rej(t.error);
      };
    });
    const resultados = [];
    for (let rodada = 1; rodada <= 3; rodada++) {
      const d = await Store.carregar();
      d.ajustes.chavePix = 'pix-rodada-' + rodada;   // um bom no mesmo lote
      await Store.salvar(d);
      const r = await Nuvem.enviarRegistros({ versaoApp: 'prova' });
      const fila = await Store.lerFila();
      const ruim = fila.find(e => e.id === 'aula:ruim');
      resultados.push({ enviados: r.enviados, erro: r.erro ? r.erro.codigo : null, bonsNaFila: fila.filter(e => e.id !== 'aula:ruim').length,
        tentativas: ruim ? ruim.tentativas || 0 : null, quarentena: ruim ? !!ruim.quarentena : null });
    }
    await Nuvem.contarFila();
    P.resultados = resultados;
    P.estado = Nuvem.estado().registros;
    P.frase = (document.querySelector('#nuvem-registros') || {}).textContent || '';
    // uma edição do mesmo item tira da quarentena (a entrada é regravada)
    return P;
  });
  conf('em cada rodada o bom subiu e o ruim ficou, sem erro de nuvem', JSON.stringify(quarentena.resultados.map(r => [r.enviados, r.erro, r.bonsNaFila])),
    JSON.stringify([[1, null, 0], [1, null, 0], [1, null, 0]]));
  conf('as tentativas do ruim contam 1, 2, 3', quarentena.resultados.map(r => r.tentativas).join(','), '1,2,3');
  conf('e na terceira ele entra na quarentena', quarentena.resultados.map(r => r.quarentena).join(','), 'false,false,true');
  conf('o estado da nuvem conta 0 pendentes e 1 em quarentena', quarentena.estado.pendentes + '/' + quarentena.estado.quarentena, '0/1');
  conf('Ajustes diz que 1 mudança não consegue subir e as outras seguem', /1 mudança não consegue subir \(a nuvem recusa esse registro\); as outras seguem/.test(quarentena.frase), true);
  /* O reteste: o envio seguinte, inteiro sem recusa, solta a quarentena uma vez;
   * o ruim volta ao lote, a nuvem o recusa de novo e ele volta para a
   * quarentena, de onde não sai mais sozinho. */
  const retestes = await pagA.evaluate(async () => {
    const rodadas = [];
    for (let k = 1; k <= 3; k++) {
      const d = await Store.carregar();
      d.ajustes.chavePix = 'pix-reteste-' + k;
      await Store.salvar(d);
      const r = await Nuvem.enviarRegistros({ versaoApp: 'prova' });
      const fila = await Store.lerFila();
      rodadas.push([r.enviados, r.erro ? r.erro.codigo : null, fila.map(e => e.id + (e.quarentena ? '(q)' : '') + (e.retestada ? '(r)' : '') + ':' + (e.tentativas || 0)).join(' ')]);
    }
    return rodadas;
  });
  conf('1a: com o ruim em quarentena, o bom sobe sem tocar nele; o envio limpo solta a quarentena para o reteste',
    JSON.stringify(retestes[0]), JSON.stringify([1, null, 'aula:ruim(r):3']));
  conf('2a: no reteste a nuvem recusa o ruim de novo, o bom do lote sobe, e ele volta para a quarentena',
    JSON.stringify(retestes[1]), JSON.stringify([1, null, 'aula:ruim(q)(r):4']));
  conf('3a: já retestado, não volta mais sozinho', JSON.stringify(retestes[2]), JSON.stringify([1, null, 'aula:ruim(q)(r):4']));
  conf('o registro ruim não está no servidor', 'aula:ruim' in (await registrosNoServidor(dona.idToken, dona.localId)).docs, false);
  await pagA.evaluate(() => new Promise(res => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => { const t = q.result.transaction(['registros', 'saida'], 'readwrite'); t.objectStore('registros').delete('aula:ruim'); t.objectStore('saida').delete('aula:ruim');
      t.oncomplete = () => { q.result.close(); res(); }; };
  }));

  secao('5c. Um bom sozinho na fila, com uma tentativa de uma queda parcial, não vai para a quarentena em recusas totais');
  conf('as regras velhas voltam ao emulador (a nuvem recusa tudo)', await publicarRegras(REGRAS_VELHAS), 200);
  const recusaTotal = await pagA.evaluate(async () => {
    const d = await Store.carregar();
    d.ajustes.chavePix = 'pix-sozinho';
    await Store.salvar(d);
    // a queda parcial de antes (um 5xx no meio do lote) deixou uma tentativa nele
    await Store.marcarTentativa(['ajuste:chavePix']);
    const rodadas = [];
    for (let k = 1; k <= 2; k++) {
      const r = await Nuvem.enviarRegistros({ versaoApp: 'prova' });
      const e = (await Store.lerFila()).find(x => x.id === 'ajuste:chavePix');
      rodadas.push([r.enviados, r.erro ? r.erro.codigo : null, e ? (e.tentativas || 0) : null, e ? !!e.quarentena : null]);
    }
    return rodadas;
  });
  // (sob o veneno a recusa vira culpa do registro e o erro da nuvem não aparece; a propriedade medida é a de baixo)
  if (MODO !== MODOS[1]) conf('as duas recusas totais devolvem PERMISSION_DENIED e nada sobe', JSON.stringify(recusaTotal.map(r => [r[0], r[1]])), JSON.stringify([[0, 'PERMISSION_DENIED'], [0, 'PERMISSION_DENIED']]));
  else conf('nada sobe nas duas recusas totais', JSON.stringify(recusaTotal.map(r => r[0])), JSON.stringify([0, 0]));
  prop('a tentativa continua uma e o bom não entra na quarentena (recusa total nunca conta)',
    JSON.stringify(recusaTotal.map(r => [r[2], r[3]])) === JSON.stringify([[1, false], [1, false]]), MODOS[1]);
  if (MODO === MODOS[1]) throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
  conf('as regras novas voltam', await publicarRegras(REGRAS), 200);
  const sozinhoSubiu = await pagA.evaluate(async () => { const r = await Nuvem.enviarRegistros({ versaoApp: 'prova' }); return [r.enviados, r.erro || null, (await Store.lerFila()).length]; });
  conf('e com a nuvem aceitando, o bom sobe', JSON.stringify(sozinhoSubiu), JSON.stringify([1, null, 0]));

  secao('6. A fila sobrevive a fechar sem sinal e sobe ao voltar');
  await pagA.setOfflineMode(true);
  const semSinal = await pagA.evaluate(async () => {
    const d = await Store.carregar();
    d.aulas.find(a => a.id === 's1@2026-06-01').notaTexto = 'editada sem sinal';
    await Store.salvar(d);
    const r = await Nuvem.enviarRegistros({ versaoApp: 'prova' });
    // "fechar" sem sinal: o gatilho de sempre
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise(r2 => setTimeout(r2, 800));
    return { codigo: r.erro && r.erro.codigo, fila: (await Store.lerFila()).map(e => e.id), frase: (document.querySelector('#nuvem-registros') || {}).textContent || '' };
  });
  conf('sem sinal, o envio devolve SEM_REDE e nada trava', semSinal.codigo, 'SEM_REDE');
  conf('a fila guarda a edição', JSON.stringify(semSinal.fila), JSON.stringify(['aula:s1@2026-06-01']));
  conf('Ajustes diz "Sem internet" e que a mudança está guardada', /Sem internet agora\. 1 mudança guardada aqui/.test(semSinal.frase), true);
  await pagA.setOfflineMode(false);
  /* Recarrega: a memória da página morre, e só o que está no disco volta. O
   * aplicativo, ao abrir, grava os ajustes dele e isso agenda o envio; a fila
   * pode já ter subido quando a prova olha, então a prova deste ponto é o
   * servidor receber a edição feita sem sinal, logo abaixo. */
  await H.abrirApp(pagA, amb.ORIGEM);
  await pagA.evaluate(() => {
    // voltou ao aplicativo com sinal: o gatilho da volta
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const subiuAoVoltar = await esperar('a fila subiu ao voltar', () => fila(pagA), v => Array.isArray(v) && v.length === 0, 20000);
  conf('a fila subiu ao voltar, pelo gatilho de sempre', subiuAoVoltar.ok, true);
  const aoVoltar = await registrosNoServidor(dona.idToken, dona.localId);
  conf('o registro editado sem sinal está no servidor com o conteúdo novo (dados mudou)',
    JSON.stringify(aoVoltar.docs['aula:s1@2026-06-01'].dados) !== JSON.stringify(noServidor.docs['aula:s1@2026-06-01'].dados), true);

  secao('7. A gravação e a entrada na fila são atômicas');
  const atomica = await pagA.evaluate(async () => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () {
      const req = original.apply(this, arguments);
      if (this.name === 'dados') this.transaction.abort();
      return req;
    };
    const d = await Store.carregar();
    d.aulas.find(a => a.id === 's1@2026-06-03').notaTexto = 'tablet sem espaço';
    let rejeitou = false;
    try { await Store.salvar(d); } catch (e) { rejeitou = true; }
    IDBObjectStore.prototype.put = original;
    await new Promise(r => setTimeout(r, 600)); // o veneno grava a fila numa transação à parte, depois
    const f = (await Store.lerFila()).map(e => e.id);
    const reg = (await Store.lerRegistros()).find(r => r.id === 'aula:s1@2026-06-03');
    return { rejeitou, fila: f, registroIntacto: reg && reg.dados && reg.dados.notaTexto !== 'tablet sem espaço' };
  });
  conf('a gravação abortada rejeita', atomica.rejeitou, true);
  conf('e o registro ficou como estava', atomica.registroIntacto, true);
  prop('nenhuma entrada na fila para o dado que não foi gravado', atomica.fila.indexOf('aula:s1@2026-06-03') < 0, MODOS[0]);
  if (FILA_FORA) throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });

  secao('8. O celular da dona restaura a cópia sem enfileirar; sem editar, não envia registro');
  const contextoC = await pagA.browser().createBrowserContext();
  const pagC = await contextoC.newPage();
  await prepararPagina(pagC, true);
  await H.abrirApp(pagC, amb.ORIGEM);
  const entradaCel = await esperar('a tela do celular pede a conta', () => existe(pagC, '#cel-conta #nuvem-entrar'), v => v === true, 15000);
  conf('o celular abre na tela de entrada dele', entradaCel.ok, true);
  await digitar(pagC, '#cel-conta #nuvem-email', DONA.email);
  await digitar(pagC, '#cel-conta #nuvem-senha', DONA.senha);
  await clicar(pagC, '#cel-conta #nuvem-entrar');
  conf('o celular entrou', (await esperar('o botão de trazer a cópia', () => existe(pagC, '#cel-trazer'), v => v === true, 15000)).ok, true);
  await clicar(pagC, '#cel-trazer');
  await esperar('a janela lista a cópia', () => pagC.evaluate(() => document.querySelectorAll('#modal-nuvem-restaurar.aberto #nuvem-copias input[type=radio]').length), v => v >= 1, 15000);
  await clicar(pagC, '#nuvem-restaurar-confirmar');
  const veio = await esperar('a cópia chegou ao celular', () => pagC.evaluate(async () => !document.querySelector('#modal-nuvem-restaurar.aberto') &&
    (await Store.carregar()).alunos.some(a => a.id === 'alfa')), v => v === true, 30000);
  conf('o celular restaurou a cópia do tablet', veio.ok, true);
  const cel = await pagC.evaluate(async () => {
    const r = await Nuvem.enviarRegistros({ versaoApp: 'prova' });
    return { fila: (await Store.lerFila()).length, pulado: r.pulado || null, enviados: r.enviados || 0, celular: Nuvem.estado().celular, dona: Nuvem.estado().celularDaDona, aparelho: Store.aparelho() };
  });
  conf('a restauração que veio da nuvem não enfileira nada', cel.fila, 0);
  /* Desde o D6b o celular da dona envia os registros das quatro ações dele
   * (testa_celular_edita.js); sem edição, o envio não tem o que subir. */
  conf('o celular da dona, sem edição, não envia nada: a fila está vazia', [cel.pulado, cel.enviados, cel.celular, cel.dona].join('/'), '/0/true/true');
  conf('nenhum commit saiu do celular', pagC.commits.length, 0);
  // a restauração é a única gravação do celular, e é nela que o id do aparelho nasce
  conf('o celular ganhou o id de aparelho na restauração, a única gravação dele', /^ap[0-9a-f]{12}$/.test(cel.aparelho || ''), true);
  conf('nenhum erro de página no celular', pagC.errosDePagina.join(' | '), '');
  conf('nenhum erro de página no tablet', pagA.errosDePagina.join(' | '), '');
  await pagC.close();
  await contextoC.close();
})().then(() => derrubarEmulador().then(H.fim(amb)), e => derrubarEmulador().then(() => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e))));
