/* testa_registros_ressurreicao.js
 *
 * DIAGNÓSTICO (09/11/2026): aula apagada que volta da nuvem de registros
 * ("ressurreição"). Contra o Firebase Emulator Suite (Auth e Firestore), com
 * o arranjo do testa_nuvem_registros.js e só dados fictícios.
 *
 * O que se viu na prova das folhas (seção 16 do testa_nuvem_folhas.js, no
 * ramo n2-folhas-anexos): "Apagar tudo", "Enviar cópia agora", e um aparelho
 * que restaura a cópia vazia fica com 10 aulas vivas. A pergunta é se isso
 * acontece também no caminho COMUM. Uma seção por caso:
 *   (a) ela exclui UMA aula pelo app (Core.excluirAulas e salvar); um tablet
 *       novo restaura a cópia mais nova e recebe; o celular restaura e recebe;
 *   (b) o mesmo excluindo um ALUNO em cascata (Store.excluirAlunoEmCascata);
 *   (c) o celular que já tinha a cópia e só RECEBE depois das exclusões;
 *   (d) a exclusão feita SEM sinal, que sobe depois;
 *   (e) "Apagar tudo" e "Enviar cópia agora", sem reabrir o app (e1) e
 *       reabrindo antes de enviar (e2, o caminho da seção 16).
 * A propriedade de cada caso: NENHUMA aula excluída está viva no aparelho que
 * restaurou ou recebeu. As verificações levam o rótulo "ressurreição (x)".
 *
 * RESULTADO na 1.42.18 (94fa74b): nenhum dos cinco caminhos ressuscita aula.
 * As 10 aulas vivas da seção 16 são a CARGA INICIAL (o junho do Marcelo de
 * exemplo, 13 encontros de seg/qua/sex menos 03, 12 e 29), que o iniciar() do
 * app.js grava de novo quando o app abre com o banco vazio depois do "Apagar
 * tudo"; a cópia enviada em seguida já as leva. A seção 10 (e2) mostra isso.
 *
 * O caso (a') mede, só para informar, a cópia mais nova ANTERIOR à exclusão
 * (a exclusão subiu por registro e a cópia ainda não): a restauração vence
 * por decisão de 08/11 e não é contada como defeito aqui.
 *
 * Veneno (a rodada passa quando a prova VÊ a ressurreição):
 *   --envenenado-lapide-nao-sobe  o store.js servido grava a lápide da
 *                                 exclusão sem pô-la na fila: a nuvem guarda
 *                                 a aula viva, e o tablet novo a recebe.
 * Controle da seção FALHAS CONHECIDAS do portão (não é veneno):
 *   --finge-defeito  toda verificação "ressurreição (x)" reprova, como se o
 *                    defeito existisse; o resto da prova segue igual.
 *
 * Portas: 9021 (app), 9023 (auth), 9024 (firestore), 9025 (hub), 9026 (log),
 * 9027 (websocket).
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, esperar } = H;

const MODOS = ['--envenenado-lapide-nao-sobe'];
const MODO = MODOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const VENENO = MODO === MODOS[0];
/* --finge-defeito NÃO é veneno: é o controle da seção FALHAS CONHECIDAS do
 * portão. Cada verificação de ressurreição reprova como se o defeito
 * existisse, e o resto da prova segue igual. */
const FINGE_DEFEITO = process.argv.indexOf('--finge-defeito') !== -1;
/* A propriedade de cada caso: zero aulas excluídas vivas. */
function ressurreicao(caso, onde, vivas) {
  const n = FINGE_DEFEITO ? Math.max(1, vivas.length) : vivas.length;
  const rotulo = 'ressurreição (' + caso + '): ' + onde + ': nenhuma aula excluída volta viva' + (vivas.length ? ' (voltaram: ' + vivas.slice(0, 6).join(', ') + ')' : '');
  if (VENENO) return conf('VENENO visto: ' + rotulo + ', e quebrou', n === 0, false);
  return conf(rotulo, n, 0);
}
const fimDoVeneno = () => Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });

/* O veneno: a exclusão grava a lápide aqui mas NÃO a põe na fila (ela nunca
 * sobe). A nuvem guarda a aula viva, e o aparelho novo que restaura e recebe
 * TEM de vê-la voltar: é o controle de que a prova enxerga a ressurreição. */
const STORE = fs.readFileSync(path.join(H.RAIZ, 'store.js'), 'utf8');
const LAPIDE = "      gravarRegistro({ id: r.id, tipo: r.tipo, atualizadoEm: agora, apagadoEm: agora, aparelho: aparelho,";
const trocas = {};
if (VENENO) {
  if (STORE.split(LAPIDE).length !== 2) { console.log('  FALHA a âncora da lápide no store.js não é única'); process.exit(1); }
  trocas['/store.js'] = STORE.replace(LAPIDE, "      deposito.put({ id: r.id, tipo: r.tipo, atualizadoEm: agora, apagadoEm: agora, aparelho: aparelho,");
}

const PORTA_APP = 9021, PORTA_AUTH = 9023, PORTA_FS = 9024, PORTA_HUB = 9025, PORTA_LOG = 9026, PORTA_WS = 9027;
const PROJETO = 'demo-nath-ress';
const AUTH = 'http://127.0.0.1:' + PORTA_AUTH;
const FS = 'http://127.0.0.1:' + PORTA_FS;
const FIREBASE = process.env.FIREBASE_TOOLS ||
  'C:/Users/romul/ferramentas/firebase-tools/node_modules/firebase-tools/lib/bin/firebase.js';
const JAVA_HOME = process.env.JAVA_HOME || '';
const DONA = { email: 'dona@exemplo.test', senha: 'senha-da-dona-1' };
const REGRAS = fs.readFileSync(path.join(H.RAIZ, 'firestore.rules'), 'utf8');

secao('0. O ambiente');
conf('o firebase-tools está onde a prova procura (' + FIREBASE + ')', fs.existsSync(FIREBASE), true);
const javaExe = JAVA_HOME ? path.join(JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java';
const versaoJava = (function () {
  const r = spawnSync(javaExe, ['-version'], { encoding: 'utf8' });
  const m = /version "(\d+)/.exec((r.stderr || '') + (r.stdout || ''));
  return m ? Number(m[1]) : 0;
})();
conf('há um JDK 21 ou mais novo (versão ' + versaoJava + ')', versaoJava >= 21, true);
if (!fs.existsSync(FIREBASE) || versaoJava < 21) {
  console.log('\n' + H.placar.passes + ' passaram, ' + H.placar.falhas + ' falharam.');
  process.exit(1);
}

/* ---------- o emulador (como no testa_nuvem_registros) ---------- */
const PASTA = path.join(os.tmpdir(), 'nath_ress_emulador_' + process.pid);
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
/* O estado de cada aula na nuvem de registros: 'viva', 'lapide' ou ausente. */
async function aulasNoServidor(token, uid) {
  const saida = {};
  let pageToken = null;
  do {
    const r = await rest(docUrl(uid, 'registros') + '?pageSize=300' + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : ''), { token });
    if (r.status !== 200) throw new Error('a leitura dos registros devolveu ' + r.status);
    ((r.json && r.json.documents) || []).forEach(d => {
      const id = decodeURIComponent(d.name.split('/registros/')[1]);
      if (id.indexOf('aula:') !== 0) return;
      const ap = d.fields && d.fields.apagadoEm;
      saida[id.slice(5)] = ap && ap.stringValue ? 'lapide' : 'viva';
    });
    pageToken = r.json && r.json.nextPageToken;
  } while (pageToken);
  return saida;
}

const CFG = { auth: AUTH, firestore: FS, projectId: PROJETO };
const amb = H.criarAmbiente(PORTA_APP, 'nath_ress', trocas);

async function prepararPagina(pag, movel) {
  pag.setDefaultTimeout(60000);
  if (movel) await pag.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  pag.errosDePagina = [];
  pag.on('pageerror', e => pag.errosDePagina.push(e.message));
  pag.on('dialog', async d => { try { await d.accept(); } catch (e) { /* ok */ } });
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
const existe = (pag, sel) => pag.evaluate(s => !!document.querySelector(s), sel);
async function digitar(pag, sel, valor) {
  await pag.evaluate((s, v) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, sel, valor);
}
const clicar = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.click(); return true; }, sel);
async function entrarPelaTela(pag) {
  await H.irParaAba(pag, 'ajustes');
  const form = await esperar('o cartão da nuvem pede e-mail e senha', () => existe(pag, '#nuvem-entrar'), v => v === true, 10000);
  if (!form.ok) return false;
  await digitar(pag, '#nuvem-email', DONA.email);
  await digitar(pag, '#nuvem-senha', DONA.senha);
  await clicar(pag, '#nuvem-entrar');
  return (await esperar('entrou e o cartão mostra os botões', () => existe(pag, '#nuvem-enviar'), v => v === true, 15000)).ok;
}
/* "Enviar cópia agora", pela tela de Ajustes. Devolve o id da cópia nova. */
async function enviarCopiaPelaTela(pag) {
  await H.irParaAba(pag, 'ajustes');
  const antes = await pag.evaluate(() => (Nuvem.estado().ultimaCopia || {}).id || null);
  await clicar(pag, '#nuvem-enviar');
  const r = await esperar('a cópia subiu', () => pag.evaluate(() => (Nuvem.estado().ultimaCopia || {}).id || null), v => !!v && v !== antes, 30000);
  return r.ok ? r.valor : null;
}
/* Envia os registros até a fila esvaziar (ou desistir). */
async function enviarTudo(pag) {
  let r = null;
  for (let i = 0; i < 5; i++) {
    r = await pag.evaluate(() => Nuvem.enviarRegistros({ versaoApp: 'prova' }).then(x => ({ enviados: x.enviados || 0, erro: x.erro ? x.erro.codigo : null, pulado: x.pulado || null })));
    const n = await pag.evaluate(() => Store.lerFila().then(l => l.filter(e => !e.quarentena).length));
    if (!n) return Object.assign(r, { fila: 0 });
  }
  return Object.assign(r || {}, { fila: await pag.evaluate(() => Store.lerFila().then(l => l.length)) });
}
const aulasVivas = pag => pag.evaluate(() => Store.carregar().then(d => (d ? d.aulas : []).map(a => a.id).sort()));
const receber = pag => pag.evaluate(() => Nuvem.receberRegistros().then(r => ({ aplicados: r.aplicados || 0, erro: r.erro ? r.erro.codigo : null, pulado: r.pulado || null })));
const vivasDentre = (lista, ids) => ids.filter(id => lista.indexOf(id) >= 0);

/* Um tablet NOVO (outro contexto, outro banco): entra, restaura a cópia pedida
 * pelo mesmo caminho do restaurarDaNuvem do app.js (baixar, importarZip com
 * daNuvem, restaurou, receberRegistros) e devolve as aulas vivas. */
async function tabletNovoRestaura(navegador, uid, idCopia) {
  const ctx = await navegador.createBrowserContext();
  const pag = await ctx.newPage();
  await prepararPagina(pag, false);
  await H.abrirApp(pag, amb.ORIGEM);
  await pag.evaluate((e, s) => Nuvem.entrar(e, s), DONA.email, DONA.senha);
  const r = await pag.evaluate(async (uid_, id_) => {
    const lista = await Nuvem.listarCopias(uid_);
    const copia = lista.filter(c => c.id === id_)[0];
    if (!copia) return { erro: 'a cópia ' + id_ + ' não está na lista' };
    const zip = await Nuvem.baixarCopia(uid_, copia.id);
    const dados = await Store.importarZip(zip, { daNuvem: true });
    await Nuvem.restaurou(copia, { celular: false });
    const daCopia = dados.aulas.map(a => a.id).sort();
    const rec = await Nuvem.receberRegistros();
    return { daCopia, aplicados: rec.aplicados || 0, erro: rec.erro ? rec.erro.codigo : null };
  }, uid, idCopia);
  const vivas = await aulasVivas(pag);
  return { ctx, pag, r, vivas };
}
async function fechar(x) { try { await x.pag.close(); await x.ctx.close(); } catch (e) { /* já fechou */ } }

(async function () {
  secao('1. O emulador, a conta e o tablet A com dados fictícios');
  await subirEmulador(REGRAS);
  const dona = (await criarUsuario(DONA)).json;
  conf('a conta da dona existe no emulador', !!(dona && dona.localId), true);
  await amb.subir();
  const pagA = await amb.pagina();
  const navegador = pagA.browser();
  await prepararPagina(pagA, false);
  await H.abrirApp(pagA, amb.ORIGEM);
  const ini = await pagA.evaluate(async () => {
    const d = Store.bancoVazio();
    d.ajustes.cargaInicial = false;
    const alunos = [['alfa', 'Aluno Alfa Teste'], ['beta', 'Aluno Beta Teste'], ['gama', 'Aluno Gama Teste']];
    d.alunos = alunos.map(x => ({ id: x[0], nome: x[1], responsavel: '', ativo: true, precos: [{ id: 'p' + x[0], inicio: '2026-01-01', fim: null, valorHora: 100 }] }));
    const sA = Core.criarSerie(d, { alunoId: 'alfa', dias: [1, 3, 5], hora: '10:00', duracaoMin: 60, inicio: '2026-06-01', fim: '2026-06-30' });
    const sB = Core.criarSerie(d, { alunoId: 'beta', dias: [2, 4], hora: '14:00', duracaoMin: 60, inicio: '2026-06-01', fim: '2026-06-30' });
    d.aulas.push({ id: 'avulsa-gama-1', alunoId: 'gama', serieId: null, destacada: false, data: '2026-06-12', hora: '09:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] });
    await Store.salvar(d);
    return { sA: sA.id, sB: sB.id, aulas: d.aulas.length, betas: d.aulas.filter(a => a.alunoId === 'beta').map(a => a.id) };
  });
  console.log('   aulas no tablet A: ' + ini.aulas + ' (série de alfa ' + ini.sA + ', de beta ' + ini.sB + ')');
  await H.abrirApp(pagA, amb.ORIGEM);   // a memória do app passa a ser o disco (a cópia sai da memória)
  conf('o app reaberto tem as aulas gravadas (e não a carga inicial)', (await aulasVivas(pagA)).length, ini.aulas);
  conf('o tablet entrou com e-mail e senha pela tela', await entrarPelaTela(pagA), true);
  const k0 = await enviarCopiaPelaTela(pagA);
  conf('a primeira cópia subiu', !!k0, true);
  const e0 = await enviarTudo(pagA);
  conf('os registros subiram e a fila esvaziou', e0.erro === null && e0.fila === 0, true);
  const nuvem0 = await aulasNoServidor(dona.idToken, dona.localId);
  conf('a nuvem tem uma aula viva por aula do tablet', Object.keys(nuvem0).filter(k => nuvem0[k] === 'viva').length, ini.aulas);

  secao('2. O celular D restaura a primeira cópia (antes de qualquer exclusão)');
  const ctxD = await navegador.createBrowserContext();
  const pagD = await ctxD.newPage();
  await prepararPagina(pagD, true);
  await H.abrirApp(pagD, amb.ORIGEM);
  conf('o celular abre na tela de entrada dele', (await esperar('a tela do celular pede a conta', () => existe(pagD, '#cel-conta #nuvem-entrar'), v => v === true, 15000)).ok, true);
  await digitar(pagD, '#cel-conta #nuvem-email', DONA.email);
  await digitar(pagD, '#cel-conta #nuvem-senha', DONA.senha);
  await clicar(pagD, '#cel-conta #nuvem-entrar');
  conf('o celular entrou', (await esperar('o botão de trazer a cópia', () => existe(pagD, '#cel-trazer'), v => v === true, 15000)).ok, true);
  await clicar(pagD, '#cel-trazer');
  await esperar('a janela lista a cópia', () => pagD.evaluate(() => document.querySelectorAll('#modal-nuvem-restaurar.aberto #nuvem-copias input[type=radio]').length), v => v >= 1, 15000);
  await clicar(pagD, '#nuvem-restaurar-confirmar');
  const veioD = await esperar('a cópia chegou ao celular', () => pagD.evaluate(async () => !document.querySelector('#modal-nuvem-restaurar.aberto') &&
    ((await Store.carregar()) || { aulas: [] }).aulas.length), v => v === ini.aulas, 30000);
  conf('o celular D tem as ' + ini.aulas + ' aulas', veioD.ok, true);

  /* ---------- (a) uma aula pelo app ---------- */
  secao('3. (a) Ela exclui UMA aula pelo app; o tablet novo e o celular novo restauram a cópia mais nova e recebem');
  const aulaA = ini.sA + '@2026-06-03';
  const exA = await pagA.evaluate(async id => { const d = await Store.carregar(); const n = Core.excluirAulas(d, id, 'esta'); await Store.salvar(d); return { n, fila: (await Store.lerFila()).map(e => e.id + (e.apagadoEm ? ':lapide' : '')) }; }, aulaA);
  console.log('   fila depois da exclusão: ' + JSON.stringify(exA.fila));
  if (!VENENO) conf('a exclusão virou lápide na fila do tablet', exA.n === 1 && exA.fila.indexOf('aula:' + aulaA + ':lapide') >= 0, true);
  const eA = await enviarTudo(pagA);
  conf('o envio terminou e a fila esvaziou', eA.erro === null && eA.fila === 0, true);
  const nuvemA = (await aulasNoServidor(dona.idToken, dona.localId))[aulaA];
  if (!VENENO) conf('a aula excluída é lápide na nuvem de registros', nuvemA, 'lapide');
  else conf('sob o veneno, a aula excluída continua viva na nuvem de registros', nuvemA, 'viva');
  await H.abrirApp(pagA, amb.ORIGEM);   // a memória do app passa a ser o disco (a cópia sai da memória)
  const discoA = await aulasVivas(pagA);
  const kA = await enviarCopiaPelaTela(pagA);
  conf('a cópia mais nova subiu', !!kA, true);
  const c1 = await tabletNovoRestaura(navegador, dona.localId, kA);
  console.log('   tablet novo: ' + JSON.stringify({ daCopia: c1.r.daCopia && c1.r.daCopia.length, aplicados: c1.r.aplicados, erro: c1.r.erro, vivas: c1.vivas.length }));
  // o instrumento: a cópia restaurada é o que o tablet A tem (sem isto, uma cópia velha passaria por "nada voltou")
  conf('a cópia que o tablet novo restaurou tem exatamente as aulas do tablet A', JSON.stringify(c1.r.daCopia), JSON.stringify(discoA));
  conf('e o tablet novo, depois de receber, tem as mesmas aulas vivas que o A', JSON.stringify(c1.vivas.filter(id => discoA.indexOf(id) >= 0 || id === aulaA)), JSON.stringify(VENENO ? discoA.concat([aulaA]).sort() : discoA));
  ressurreicao('a', 'tablet novo que restaura a cópia mais nova e recebe', vivasDentre(c1.vivas, [aulaA]));
  await fechar(c1);
  if (VENENO) throw fimDoVeneno();
  const recDa = await receber(pagD);
  console.log('   celular D recebeu: ' + JSON.stringify(recDa));

  /* ---------- (a') cópia anterior à exclusão: só informa ---------- */
  secao("4. (a') Só para informar: a cópia mais nova é ANTERIOR à exclusão (a lápide subiu, a cópia não)");
  const aulaA2 = ini.sA + '@2026-06-10';
  await pagA.evaluate(async id => { const d = await Store.carregar(); Core.excluirAulas(d, id, 'esta'); await Store.salvar(d); }, aulaA2);
  const eA2 = await enviarTudo(pagA);
  conf("(a') a lápide subiu, sem cópia nova", eA2.erro === null && eA2.fila === 0, true);
  const c2 = await tabletNovoRestaura(navegador, dona.localId, kA);
  const naCopiaVelha = (c2.r.daCopia || []).indexOf(aulaA2) >= 0;
  const subiuDeVolta = await enviarTudo(c2.pag);
  const nuvemA2 = (await aulasNoServidor(dona.idToken, dona.localId))[aulaA2];
  console.log("   (a') INFORMA: a cópia anterior traz a aula: " + naCopiaVelha + '; viva no tablet novo depois de receber: ' + (c2.vivas.indexOf(aulaA2) >= 0) +
    '; depois do envio do tablet novo, a aula na nuvem está: ' + nuvemA2 + ' (a restauração vence, decisão de 08/11)');
  await fechar(c2);
  // a nuvem volta ao estado que A conhece: A exclui de novo se a restauração a reviveu
  if (nuvemA2 === 'viva') {
    await receber(pagA);
    await pagA.evaluate(async id => { const d = await Store.carregar(); if (d.aulas.some(a => a.id === id)) { Core.excluirAulas(d, id, 'esta'); await Store.salvar(d); } }, aulaA2);
    await enviarTudo(pagA);
  }

  /* ---------- (b) um aluno em cascata ---------- */
  secao('5. (b) Ela exclui um ALUNO em cascata; o tablet novo restaura a cópia mais nova e recebe');
  const exB = await pagA.evaluate(async () => { const d = await Store.carregar(); const novo = await Store.excluirAlunoEmCascata(d, 'beta'); return { aulas: novo.aulas.length, fila: (await Store.lerFila()).filter(e => e.apagadoEm).length }; });
  console.log('   depois da cascata: ' + JSON.stringify(exB));
  const eB = await enviarTudo(pagA);
  conf('as lápides da cascata subiram', eB.erro === null && eB.fila === 0, true);
  const nuvemB = await aulasNoServidor(dona.idToken, dona.localId);
  conf('as ' + ini.betas.length + ' aulas de beta são lápide na nuvem', ini.betas.filter(id => nuvemB[id] === 'lapide').length, ini.betas.length);
  await H.abrirApp(pagA, amb.ORIGEM);   // a memória do app passa a ser o disco (a cópia sai da memória)
  const kB = await enviarCopiaPelaTela(pagA);
  conf('a cópia mais nova subiu', !!kB, true);
  const c3 = await tabletNovoRestaura(navegador, dona.localId, kB);
  ressurreicao('b', 'tablet novo depois da cascata do aluno', vivasDentre(c3.vivas, ini.betas));
  await fechar(c3);

  /* ---------- (d) sem sinal ---------- */
  secao('6. (d) A exclusão feita SEM sinal, que sobe depois');
  const aulaD = ini.sA + '@2026-06-08';
  await pagA.setOfflineMode(true);
  const semSinal = await pagA.evaluate(async id => {
    const d = await Store.carregar(); Core.excluirAulas(d, id, 'esta'); await Store.salvar(d);
    const r = await Nuvem.enviarRegistros({ versaoApp: 'prova' });
    return { codigo: r.erro && r.erro.codigo, fila: (await Store.lerFila()).map(e => e.id + (e.apagadoEm ? ':lapide' : '')) };
  }, aulaD);
  conf('sem sinal, a lápide fica guardada na fila', semSinal.codigo === 'SEM_REDE' && semSinal.fila.indexOf('aula:' + aulaD + ':lapide') >= 0, true);
  await pagA.setOfflineMode(false);
  await H.abrirApp(pagA, amb.ORIGEM);   // fechou sem sinal e reabriu com sinal
  const eD = await enviarTudo(pagA);
  conf('com sinal, a lápide sobe', eD.erro === null && eD.fila === 0 && (await aulasNoServidor(dona.idToken, dona.localId))[aulaD] === 'lapide', true);
  const kD = await enviarCopiaPelaTela(pagA);
  conf('a cópia mais nova subiu', !!kD, true);
  const c4 = await tabletNovoRestaura(navegador, dona.localId, kD);
  ressurreicao('d', 'tablet novo depois da exclusão sem sinal', vivasDentre(c4.vivas, [aulaD]));
  await fechar(c4);

  /* ---------- (c) o celular que só recebe ---------- */
  secao('7. (c) O celular D, que restaurou antes das exclusões, só RECEBE');
  const recD = await receber(pagD);
  console.log('   celular D recebeu: ' + JSON.stringify(recD));
  const vivasD = await aulasVivas(pagD);
  const excluidas = [aulaA, aulaA2, aulaD].concat(ini.betas);
  ressurreicao('c', 'celular que só recebe depois de (a), (b) e (d)', vivasDentre(vivasD, excluidas));
  conf('e o celular tem as mesmas aulas vivas que o tablet A', JSON.stringify(vivasD), JSON.stringify(await aulasVivas(pagA)));

  /* ---------- (a) também no celular novo ---------- */
  secao('8. (a), (b), (d) num celular NOVO, pelo caminho da tela, com a cópia mais nova');
  const ctxE = await navegador.createBrowserContext();
  const pagE = await ctxE.newPage();
  await prepararPagina(pagE, true);
  await H.abrirApp(pagE, amb.ORIGEM);
  await esperar('a tela do celular pede a conta', () => existe(pagE, '#cel-conta #nuvem-entrar'), v => v === true, 15000);
  await digitar(pagE, '#cel-conta #nuvem-email', DONA.email);
  await digitar(pagE, '#cel-conta #nuvem-senha', DONA.senha);
  await clicar(pagE, '#cel-conta #nuvem-entrar');
  await esperar('o botão de trazer a cópia', () => existe(pagE, '#cel-trazer'), v => v === true, 15000);
  await clicar(pagE, '#cel-trazer');
  await esperar('a janela lista a cópia', () => pagE.evaluate(() => document.querySelectorAll('#modal-nuvem-restaurar.aberto #nuvem-copias input[type=radio]').length), v => v >= 1, 15000);
  await clicar(pagE, '#nuvem-restaurar-confirmar');
  const veioE = await esperar('a cópia chegou ao celular novo', () => pagE.evaluate(async () => !document.querySelector('#modal-nuvem-restaurar.aberto') &&
    ((await Store.carregar()) || { aulas: [] }).aulas.length > 0), v => v === true, 30000);
  conf('o celular novo restaurou', veioE.ok, true);
  await receber(pagE);
  ressurreicao('a', 'celular novo que restaura a cópia mais nova e recebe', vivasDentre(await aulasVivas(pagE), excluidas));
  await pagE.close(); await ctxE.close();

  /* ---------- (e) Apagar tudo e Enviar cópia agora ---------- */
  secao('9. (e1) "Apagar tudo" e "Enviar cópia agora", sem reabrir o app');
  const antesE = await aulasVivas(pagA);
  await H.irParaAba(pagA, 'ajustes');
  await clicar(pagA, '#apagar-tudo');
  conf('apagou tudo e a sincronização ficou desligada', (await esperar('apagou', () => pagA.evaluate(async () => (await Store.sincronizacaoDesligada()) && !((await Store.carregar()) || { aulas: [] }).aulas.length), v => v === true, 15000)).ok, true);
  const kE1 = await enviarCopiaPelaTela(pagA);
  conf('a cópia vazia subiu e religou', !!kE1 && !(await pagA.evaluate(() => Store.sincronizacaoDesligada())), true);
  const eE1 = await enviarTudo(pagA);
  conf('as lápides do religar subiram', eE1.erro === null && eE1.fila === 0, true);
  const nuvemE1 = await aulasNoServidor(dona.idToken, dona.localId);
  conf('toda aula que A tinha é lápide na nuvem', antesE.filter(id => nuvemE1[id] !== 'lapide').length, 0);
  const c5 = await tabletNovoRestaura(navegador, dona.localId, kE1);
  console.log('   tablet novo depois de (e1): ' + JSON.stringify({ daCopia: (c5.r.daCopia || []).length, aplicados: c5.r.aplicados, vivas: c5.vivas.length }));
  ressurreicao('e', 'tablet novo que restaura a cópia vazia (e1, sem reabrir)', vivasDentre(c5.vivas, antesE.concat(excluidas)));
  await fechar(c5);
  const recDe1 = await receber(pagD);
  console.log('   celular D recebeu: ' + JSON.stringify(recDe1));
  ressurreicao('e', 'celular D que só recebe depois de (e1)', vivasDentre(await aulasVivas(pagD), antesE.concat(excluidas)));

  secao('10. (e2) O caminho da seção 16: "Apagar tudo", o app REABERTO, e só então "Enviar cópia agora"');
  // um dado novo para apagar (a nuvem tem algo vivo de novo)
  await pagA.evaluate(async () => {
    const d = await Store.carregar() || Store.bancoVazio();
    d.alunos.push({ id: 'delta', nome: 'Aluno Delta Teste', responsavel: '', ativo: true, precos: [] });
    d.aulas.push({ id: 'avulsa-delta-1', alunoId: 'delta', serieId: null, destacada: false, data: '2026-06-15', hora: '09:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] });
    await Store.salvar(d);
  });
  await H.abrirApp(pagA, amb.ORIGEM);
  await enviarTudo(pagA);
  const antesE2 = await aulasVivas(pagA);
  await H.irParaAba(pagA, 'ajustes');
  await clicar(pagA, '#apagar-tudo');
  await esperar('apagou', () => pagA.evaluate(async () => (await Store.sincronizacaoDesligada()) && !((await Store.carregar()) || { aulas: [] }).aulas.length), v => v === true, 15000);
  await H.abrirApp(pagA, amb.ORIGEM);   // ela fecha e abre o app antes de enviar
  const reaberto = await pagA.evaluate(() => Store.carregar().then(d => ({ aulas: d.aulas.length, alunos: d.alunos.length, daCarga: d.alunos.filter(a => a.daCargaInicial).length, series: d.series.map(s => s.id) })));
  console.log('   ao reabrir depois do "Apagar tudo": ' + JSON.stringify(reaberto));
  const kE2 = await enviarCopiaPelaTela(pagA);
  conf('a cópia subiu', !!kE2, true);
  await enviarTudo(pagA);
  const c6 = await tabletNovoRestaura(navegador, dona.localId, kE2);
  const daCarga = c6.vivas.filter(id => reaberto.series.some(s => id.indexOf(s + '@') === 0));
  console.log('   tablet novo depois de (e2): ' + c6.vivas.length + ' aulas vivas, das quais ' + daCarga.length + ' são da série da carga inicial (o Marcelo de exemplo) gravada ao reabrir; ' +
    'a cópia já as trazia: ' + (c6.r.daCopia || []).length);
  ressurreicao('e', 'tablet novo que restaura a cópia de (e2, reaberto)', vivasDentre(c6.vivas, antesE2.concat(antesE, excluidas)));
  await fechar(c6);

  conf('nenhum erro de página em A e D', [pagA, pagD].map(p => p.errosDePagina.join(' | ')).filter(Boolean).join(' || '), '');
  await pagD.close(); await ctxD.close();
})().then(() => derrubarEmulador().then(H.fim(amb)), e => derrubarEmulador().then(() => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e))));
