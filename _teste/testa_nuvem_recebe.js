/* testa_nuvem_recebe.js
 *
 * N1, fatia 3: o RECEBIMENTO, contra o Firebase Emulator Suite, com dois
 * tablets (A e B, contextos separados do mesmo Chrome) e um celular (C).
 *
 * O que prova, com dados fictícios:
 *   1. A sobe os registros; B restaura a cópia de A (tela larga, dono),
 *      enfileira tudo e sincroniza: os dois ficam iguais;
 *   2. os dois editam a MESMA agenda (aulas diferentes) e sincronizam: cada um
 *      recebe a edição do outro sem perder a sua;
 *   3. a aula apagada em B não volta por A: a lápide chega e apaga em A;
 *   4. a edição CONCORRENTE do mesmo registro: B grava primeiro, A grava
 *      depois sem ter recebido; o que chega por último ao servidor vence nos
 *      dois, e a versão que perde vai para o histórico nos dois, com o rótulo
 *      "Antes de receber do outro aparelho";
 *   5. a regra, direto: um registro que chega com carimbo do servidor mais
 *      velho que o conhecido não é aplicado;
 *   6. duas abas do mesmo aparelho em ordem cruzada: a aba atrasada manda a
 *      versão velha com a precondição do carimbo que viu; o servidor recusa
 *      (FAILED_PRECONDITION), ela recebe e desiste, e o servidor fica com a
 *      versão nova;
 *   7. reaberturas divergentes (A reabre a mesma data duas vezes, r2; B uma
 *      vez, r1): depois de sincronizar, nos dois fica viva só a de maior r;
 *   8. o celular só leitura restaura a cópia e RECEBE os registros (vê as
 *      edições), sem nunca enviar: zero commits;
 *   9. o cursor é guardado: receber de novo não aplica nada.
 *
 * Venenos, que TÊM de reprovar a propriedade (a rodada passa quando a prova VÊ
 * o veneno):
 *   --envenenado-ignora-lapide   o recebimento pula a lápide que chega: a aula
 *                                apagada em B continua viva em A;
 *   --envenenado-velho-por-cima  a comparação pelo carimbo do servidor sai: o
 *                                registro mais velho é aplicado por cima.
 *
 * Portas: 8821 (app), 8823 (auth), 8824 (firestore), 8825 (hub), 8826 (log),
 * 8827 (websocket). Precisa do firebase-tools e de um JDK 21 em JAVA_HOME.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const MODOS = ['--envenenado-ignora-lapide', '--envenenado-velho-por-cima', '--envenenado-pagina-so-carimbo', '--envenenado-sem-already-exists', '--envenenado-fusao-pelo-prefixo'];
const MODO = MODOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
function prop(rotulo, ok, veneno) {
  if (MODO && MODO === veneno) return conf('VENENO visto: ' + rotulo + ', e quebrou', ok, false);
  return conf(rotulo, ok, true);
}

const PORTA_APP = 8821, PORTA_AUTH = 8823, PORTA_FS = 8824, PORTA_HUB = 8825, PORTA_LOG = 8826, PORTA_WS = 8827;
const PROJETO = 'demo-nath-n1f3';
const AUTH = 'http://127.0.0.1:' + PORTA_AUTH;
const FS = 'http://127.0.0.1:' + PORTA_FS;
const FIREBASE = process.env.FIREBASE_TOOLS ||
  'C:/Users/romul/ferramentas/firebase-tools/node_modules/firebase-tools/lib/bin/firebase.js';
const JAVA_HOME = process.env.JAVA_HOME || '';
const DONA = { email: 'dona@exemplo.test', senha: 'senha-da-dona-1' };

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const NUVEM = fs.readFileSync(path.join(H.RAIZ, 'nuvem.js'), 'utf8');
const STORE = fs.readFileSync(path.join(H.RAIZ, 'store.js'), 'utf8');
const REGRAS = fs.readFileSync(path.join(H.RAIZ, 'firestore.rules'), 'utf8');

secao('0. As âncoras, o veneno e o ambiente');
/* O veneno da lápide ignora a lápide NA HORA DE APLICAR (depois do eco e da
 * edição pendente, que só anotam carimbo): a aula apagada no outro fica viva. */
const RECEBE_CADA = 'var novo = { id: chegou.id, tipo: chegou.tipo, atualizadoEm: chegou.atualizadoEm || agora, apagadoEm: chegou.apagadoEm || null,';
const COMPARA = 'if (local && local.nuvem && local.nuvem.servidorEm && chegou.servidorEm && carimboNumero(local.nuvem.servidorEm) >= carimboNumero(chegou.servidorEm)) {';
/* A paginação pelo par (carimbo, nome): o veneno volta a pedir só "maior que o
 * carimbo", e perde o resto de um commit cortado no fim da página. */
const PAGINA = 'if (c && c.servidorEm) q.startAt = { values: valoresDoCursor(c), before: !c.nome };';
/* O documento que já existe quando a escrita exigia que não (ALREADY_EXISTS, 409
 * em produção) é tratado como a precondição: receber e decidir. O veneno deixa
 * só o FAILED_PRECONDITION, e a fila de um tablet novo que restaurou trava. */
const JA_EXISTE = "if (statusNuvem === 'FAILED_PRECONDITION' || statusNuvem === 'ALREADY_EXISTS' || r.status === 409) e.codigo = 'FAILED_PRECONDITION';";
conf('a paginação começa depois do par do cursor, num lugar só', NUVEM.split(PAGINA).length, 2);
conf('ALREADY_EXISTS e 409 são tratados como a precondição, num lugar só', NUVEM.split(JA_EXISTE).length, 2);
conf('o eco anota o carimbo no registro que não o tem', STORE.indexOf("if (local && !(local.nuvem && local.nuvem.servidorEm)) { local.nuvem = carimbo; registros.put(local); }") > 0, true);
conf('a lápide do "Apagar tudo" guarda o carimbo', /esquema: r\.esquema \|\| ESQUEMA_REGISTRO, ordem: r\.ordem, dados: null, nuvem: r\.nuvem \|\| null \};\r?\n\s*registros\.put\(lapide\);\r?\n\s*\/\* As lápides do "Apagar tudo"/.test(STORE), true);
conf('nenhum erro cru chega à tela: a frase padrão não leva o código', NUVEM.indexOf("'A nuvem não respondeu como esperado. Tento de novo daqui a pouco.'") > 0 && APP.indexOf("(r.erro.mensagem || 'A nuvem recusou as mudanças uma a uma.')") > 0, true);
conf('a fusão agrupa pela série e data DOS DADOS e só entre reabertas', STORE.indexOf("if (!p || !p.r || !r.dados) return; var chave = r.dados.serieId + '@' + r.dados.data;") > 0, true);
const PRECONDICAO = 'if (precondicao && precondicao.updateTime) w.currentDocument = { updateTime: precondicao.updateTime };';
const TRAVA_PASSA = "var t = transacao(b, nomes, 'readwrite', true);";
conf('o recebimento olha cada registro num lugar só', STORE.split(RECEBE_CADA).length, 2);
conf('a comparação pelo carimbo do servidor está num lugar só', STORE.split(COMPARA).length, 2);
conf('a precondição do commit está num lugar só', NUVEM.split(PRECONDICAO).length, 2);
conf('o recebimento passa pela trava como a restauração (o celular recebe)', STORE.indexOf(TRAVA_PASSA) > 0, true);
conf('o commit carimba servidorEm com a hora do servidor', NUVEM.indexOf("setToServerValue: 'REQUEST_TIME'") > 0, true);
conf('o app.js ouve o recebimento e redesenha', APP.indexOf('Store.aoReceber(registrosChegaram);') > 0, true);
conf('o celular recebe registros ao atualizar da nuvem', APP.indexOf('Nuvem.receberRegistros();') > 0, true);
conf('as regras aceitam servidorEm como timestamp', REGRAS.indexOf("(!('servidorEm' in d) || d.servidorEm is timestamp)") > 0, true);
const trocas = {};
if (MODO === MODOS[0]) trocas['/store.js'] = STORE.replace(RECEBE_CADA, 'if (chegou.apagadoEm) { contas.ignorados++; return; } ' + RECEBE_CADA);
if (MODO === MODOS[1]) trocas['/store.js'] = STORE.replace(COMPARA, 'if (false) {');
if (MODO === MODOS[2]) trocas['/nuvem.js'] = NUVEM.replace(PAGINA, "if (c && c.servidorEm) q.where = { fieldFilter: { field: { fieldPath: 'servidorEm' }, op: 'GREATER_THAN', value: { timestampValue: c.servidorEm } } };");
if (MODO === MODOS[3]) trocas['/nuvem.js'] = NUVEM.replace(JA_EXISTE, "if (statusNuvem === 'FAILED_PRECONDITION') e.codigo = 'FAILED_PRECONDITION';");
if (MODO === MODOS[4]) trocas['/store.js'] = STORE.replace("if (!p || !p.r || !r.dados) return; var chave = r.dados.serieId + '@' + r.dados.data;", "if (!p || !r.dados) return; var chave = p.serieId + '@' + p.data;");
if (MODO) conf('o arquivo servido ficou diferente do repositório (' + MODO + ')', (trocas['/store.js'] || STORE) !== STORE || (trocas['/nuvem.js'] || NUVEM) !== NUVEM, true);

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
const PASTA = path.join(os.tmpdir(), 'nath_n1f3_emulador_' + process.pid);
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
const lerDoc = (token, uid, rel) => rest(docUrl(uid, encodeURIComponent(rel).replace(/%2F/g, '/')), { token });

const CFG = { auth: AUTH, firestore: FS, projectId: PROJETO };
const amb = H.criarAmbiente(PORTA_APP, 'nath_n1f3_recebe', trocas);

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
/* Edita no app como o aplicativo faria: lê, muda, salva pelo Store. */
const editar = (pag, fn) => pag.evaluate(async (corpo) => {
  const d = await Store.carregar();
  (new Function('d', 'Core', corpo))(d, Core);
  await Store.salvar(d);
  return true;
}, fn);
const sincronizar = pag => pag.evaluate(() => Nuvem.sincronizar({ versaoApp: 'prova' }).then(r => ({
  recebidos: r.recebidos.aplicados, erroR: r.recebidos.erro ? r.recebidos.erro.codigo : null,
  enviados: r.enviados.enviados, erroE: r.enviados.erro ? r.enviados.erro.codigo : null, pulado: r.enviados.pulado || null })));
/* O retrato da agenda: id, hora, status e nota de cada aula viva, mais a Pix. */
const retrato = pag => pag.evaluate(async () => {
  const d = await Store.carregar();
  return JSON.stringify({ aulas: d.aulas.map(a => [a.id, a.hora, a.status, a.notaTexto || '']).sort(), pix: d.ajustes.chavePix });
});
const aula = (pag, id) => pag.evaluate(async i => { const d = await Store.carregar(); const a = d.aulas.find(x => x.id === i); return a ? { hora: a.hora, status: a.status, nota: a.notaTexto || '' } : null; }, id);
const historico = pag => pag.evaluate(() => Store.listarHistorico().then(l => l.filter(h => /outro aparelho/.test(h.rotulo)).map(h => ({ rotulo: h.rotulo, notas: h.estado.aulas.map(a => a.notaTexto || '') }))));
async function restaurarPelaTela(pag, chaveFormatada, botaoRestaurar) {
  await clicar(pag, botaoRestaurar);
  await esperar('a janela lista a cópia', () => pag.evaluate(() => document.querySelectorAll('#modal-nuvem-restaurar.aberto #nuvem-copias input[type=radio]').length), v => v >= 1, 15000);
  await digitar(pag, '#nuvem-codigo-digitado', chaveFormatada);
  await clicar(pag, '#nuvem-restaurar-confirmar');
  return (await esperar('a cópia chegou', () => pag.evaluate(async () => !document.querySelector('#modal-nuvem-restaurar.aberto') &&
    (await Store.carregar()).alunos.some(a => a.id === 'alfa')), v => v === true, 30000)).ok;
}

(async function () {
  secao('1. Dois tablets com a mesma agenda: A sobe, B restaura e sincroniza');
  await subirEmulador(REGRAS);
  const dona = (await criarUsuario(DONA)).json;
  conf('a conta da dona existe no emulador', !!(dona && dona.localId), true);
  await amb.subir();
  const pagA = await amb.pagina();
  await prepararPagina(pagA, false);
  await H.abrirApp(pagA, amb.ORIGEM);
  await pagA.evaluate(async () => {
    const d = Store.bancoVazio();
    d.alunos = [{ id: 'alfa', nome: 'Aluna Alfa Teste', ativo: true, precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 100 }] }];
    d.series = [{ id: 's1', alunoId: 'alfa', dias: [1, 3], hora: '10:00', duracaoMin: 60, inicio: '2026-06-01', fim: '2026-06-30', exclusoes: [], materializadoAte: '2026-06' }];
    d.aulas = ['2026-06-01', '2026-06-03', '2026-06-08', '2026-06-10'].map(data => ({ id: 's1@' + data, alunoId: 'alfa', serieId: 's1', destacada: false, data, hora: '10:00',
      duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] }));
    d.aulas.push({ id: 'x1', alunoId: 'alfa', serieId: null, data: '2026-06-05', hora: '15:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: 'avulsa', anexos: [] });
    d.aulas.push({ id: 'x2', alunoId: 'alfa', serieId: null, data: '2026-06-12', hora: '15:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: 'avulsa dois', anexos: [] });
    d.ajustes = { chavePix: 'pix-de-teste' };
    await Store.salvar(d);
  });
  await H.abrirApp(pagA, amb.ORIGEM);
  conf('A entrou', await entrarPelaTela(pagA, DONA.email, DONA.senha), true);
  await clicar(pagA, '#nuvem-enviar');
  conf('a cópia de A subiu (a chave nasceu)', (await esperar('a cópia subiu', () => texto(pagA, '#nuvem-ultima'), v => /^Última cópia na nuvem: hoje/.test(v || ''), 30000)).ok, true);
  const chaveA = await pagA.evaluate(() => Nuvem.verChave());
  const sA1 = await sincronizar(pagA);
  conf('A sincronizou: nada a receber, tudo enviado', sA1.recebidos === 0 && sA1.enviados > 0 && sA1.erroE === null, true);
  /* A edita DEPOIS da cópia e sobe o registro: a cópia que B vai restaurar é mais
   * velha que esta edição, e a restauração num dono não pode reescrevê-la. */
  await editar(pagA, "d.aulas.find(a => a.id === 's1@2026-06-10').notaTexto = 'A editou antes de B restaurar';");
  const sA1b = await sincronizar(pagA);
  conf('A subiu a edição posterior à cópia', sA1b.enviados >= 1 && sA1b.erroE === null, true);
  const contextoB = await pagA.browser().createBrowserContext();
  const pagB = await contextoB.newPage();
  await prepararPagina(pagB, false);
  await H.abrirApp(pagB, amb.ORIGEM);
  conf('B entrou', await entrarPelaTela(pagB, DONA.email, DONA.senha), true);
  conf('B restaurou a cópia de A pelo código (tela larga: dono)', await restaurarPelaTela(pagB, chaveA.formatado, '#nuvem-restaurar'), true);
  const filaB = await pagB.evaluate(() => Store.lerFila().then(l => l.length));
  conf('B, dono, enfileirou o que restaurou', filaB > 0, true);
  const filaRestauro = await pagB.evaluate(() => Store.lerFila().then(l => l.some(e => e.id === 'aula:s1@2026-06-08' && e.restauro === true)));
  conf('as entradas da restauração estão marcadas como tal', filaRestauro, true);
  /* B é um tablet NOVO: os registros restaurados não têm carimbo, o envio exige
   * que o documento não exista, o servidor tem todos (A subiu), e a resposta é
   * ALREADY_EXISTS. Tratada como a precondição: B recebe (as versões de A, que
   * perdem para a restauração e vão ao histórico), anota os carimbos e sobe. */
  await esperar('o recebimento que segue a restauração em B terminou', () => pagB.evaluate(() => Store.lerCursor().then(c => !!(c && c.servidorEm) && !Nuvem.estado().registros.recebendo)), v => v === true, 20000);
  /* A condição da revisora, forçada para ser determinística: registros restaurados
   * SEM o carimbo do servidor (como a lápide do "Apagar tudo" perdia) e sem
   * cursor. O envio exige que os documentos não existam, e eles existem. */
  await pagB.evaluate(() => new Promise(res => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => {
      const t = q.result.transaction(['registros', 'controle'], 'readwrite');
      t.objectStore('registros').openCursor().onsuccess = e => { const c = e.target.result; if (!c) return; if (c.value.nuvem) { const v = c.value; delete v.nuvem; c.update(v); } c.continue(); };
      t.objectStore('controle').delete('cursor');
      t.oncomplete = () => { q.result.close(); res(); };
    };
  }));
  const envioB = await pagB.evaluate(() => Nuvem.enviarRegistros({ versaoApp: 'prova' }).then(r => ({ enviados: r.enviados, erro: r.erro ? r.erro.codigo : null })));
  const filaBDepois = await pagB.evaluate(() => Store.estadoDaFila());
  prop('B, tablet novo, ENVIOU antes de receber: ALREADY_EXISTS em tudo, tratado como a precondição (recebe, decide, sobe); a fila zerou e nenhum erro ficou',
    envioB.erro === null && envioB.enviados >= 1 && filaBDepois.pendentes === 0 && filaBDepois.quarentena === 0, MODOS[3]);
  if (MODO === MODOS[3]) throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
  const sB1 = await sincronizar(pagB);
  /* A RESTAURAÇÃO VENCE (decisão da sessão): a cópia era de antes da edição de A,
   * e restaurá-la é a vontade dela de voltar àquele ponto. B fica com a cópia, o
   * servidor também, e a edição de A vai para o histórico de B. */
  const noServidor10 = (((await lerDoc(dona.idToken, dona.localId, 'registros/aula:s1@2026-06-10')).json || { fields: {} }).fields.atualizadoEm || {}).stringValue;
  const emB10 = await pagB.evaluate(() => Store.lerRegistros().then(l => l.find(r => r.id === 'aula:s1@2026-06-10')));
  conf('a restauração venceu em B: a aula de 10/06 voltou ao que a cópia tinha (sem a nota de A)', (await aula(pagB, 's1@2026-06-10')).nota, '');
  conf('e no servidor: o documento é o da restauração de B', noServidor10, emB10.atualizadoEm);
  conf('a edição de A que perdeu está no histórico de B, recuperável', (await historico(pagB)).some(h => h.rotulo === 'Do outro aparelho, que perdeu para a edição daqui' && h.notas.indexOf('A editou antes de B restaurar') >= 0), true);
  const sA2 = await sincronizar(pagA);
  conf('A recebeu as versões de B sem erro', sA2.erroR === null, true);
  conf('em A a edição de hoje foi desfeita pela restauração de ontem', (await aula(pagA, 's1@2026-06-10')).nota, '');
  conf('e aparece no histórico de A, recuperável', (await historico(pagA)).some(h => h.rotulo === 'Antes de receber do outro aparelho' && h.notas.indexOf('A editou antes de B restaurar') >= 0), true);
  conf('A e B têm a mesma agenda', await retrato(pagA), await retrato(pagB));

  secao('2. Os dois editam a mesma agenda, aulas diferentes, sem sobrescrever');
  await editar(pagA, "d.aulas.find(a => a.id === 's1@2026-06-01').notaTexto = 'A escreveu';");
  await editar(pagB, "d.aulas.find(a => a.id === 's1@2026-06-03').status = 'cancelada';");
  await sincronizar(pagA);
  const sB2 = await sincronizar(pagB);
  const sA3 = await sincronizar(pagA);
  console.log('   sincronizações: A1 ' + JSON.stringify(sA1) + ' | B1 ' + JSON.stringify(sB1) + ' | A2 ' + JSON.stringify(sA2) + ' | B2 ' + JSON.stringify(sB2) + ' | A3 ' + JSON.stringify(sA3));
  console.log('   estado dos registros em B: ' + JSON.stringify(await pagB.evaluate(() => Nuvem.estado().registros)));
  console.log('   erro de envio em A: ' + JSON.stringify(await pagA.evaluate(() => Nuvem.estado().registros.erro)));
  console.log('   carimbo local em A de s1@2026-06-01: ' + JSON.stringify(await pagA.evaluate(() => Store.lerRegistros().then(l => l.find(r => r.id === 'aula:s1@2026-06-01').nuvem))) +
    '; no servidor: ' + JSON.stringify(((await lerDoc(dona.idToken, dona.localId, 'registros/aula:s1@2026-06-01')).json || {}).updateTime));
  console.log('   cursor de B: ' + JSON.stringify(await pagB.evaluate(() => Store.lerCursor())) + '; registros vivos em B com carimbo: ' +
    JSON.stringify(await pagB.evaluate(() => Store.lerRegistros().then(l => l.filter(r => !r.apagadoEm).map(r => [r.id, r.aparelho === Store.aparelho() ? 'meu' : 'outro', !!(r.nuvem && r.nuvem.servidorEm)])))));
  conf('B recebeu a edição de A e A recebeu a de B', sB2.recebidos >= 1 && sA3.recebidos >= 1, true);
  const a01 = await aula(pagB, 's1@2026-06-01'), a03 = await aula(pagA, 's1@2026-06-03');
  conf('em B, a aula de 01/06 tem a nota de A', a01 && a01.nota, 'A escreveu');
  conf('em A, a aula de 03/06 está cancelada por B', a03 && a03.status, 'cancelada');
  conf('A e B continuam iguais', await retrato(pagA), await retrato(pagB));

  secao('3. A aula apagada em B não volta por A');
  await editar(pagB, "d.aulas = d.aulas.filter(a => a.id !== 'x1');");
  await sincronizar(pagB);
  const sA4 = await sincronizar(pagA);
  prop('a lápide chegou a A e a aula avulsa sumiu de A', (await aula(pagA, 'x1')) === null && sA4.recebidos >= 1, MODOS[0]);
  await editar(pagA, "d.ajustes.chavePix = 'pix-mudou';");
  await sincronizar(pagA);
  await sincronizar(pagB);
  conf('depois de A gravar e subir outra coisa, a aula não voltou em B', (await aula(pagB, 'x1')) === null, true);
  if (MODO === MODOS[0]) throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
  conf('A e B iguais, sem a aula', await retrato(pagA), await retrato(pagB));

  secao('3b. B apaga, A edita a mesma aula sem ter recebido: a edição ressuscita a aula, e o apagamento de B vai ao histórico de B');
  const hBAntes = (await historico(pagB)).length;
  await editar(pagB, "d.aulas = d.aulas.filter(a => a.id !== 'x2');");
  await sincronizar(pagB);
  await editar(pagA, "d.aulas.find(a => a.id === 'x2').notaTexto = 'A mexeu na que B apagou';");
  const sA4b = await sincronizar(pagA);
  conf('A recebeu a lápide de B, a edição pendente venceu e subiu', sA4b.erroR === null && sA4b.enviados >= 1, true);
  const sB4b = await sincronizar(pagB);
  conf('B recebeu a aula de volta', sB4b.recebidos >= 1 && (await aula(pagB, 'x2')) !== null, true);
  conf('o apagamento de B que perdeu foi para o histórico de B', (await historico(pagB)).length, hBAntes + 1);
  conf('A e B iguais, com a aula de volta', await retrato(pagA), await retrato(pagB));

  secao('4. Edição concorrente do mesmo registro: a última a chegar ao servidor vence, a outra vai ao histórico nos dois');
  await editar(pagB, "d.aulas.find(a => a.id === 's1@2026-06-08').notaTexto = 'B primeiro';");
  const sB3 = await sincronizar(pagB);
  conf('B subiu a sua', sB3.enviados >= 1, true);
  await editar(pagA, "d.aulas.find(a => a.id === 's1@2026-06-08').notaTexto = 'A depois';");
  const sA5 = await sincronizar(pagA);
  conf('A recebeu a de B e subiu a sua por cima (a escrita mais nova no servidor)', sA5.erroR === null && sA5.enviados >= 1, true);
  const sB4 = await sincronizar(pagB);
  conf('B recebeu a de A', sB4.recebidos >= 1, true);
  conf('nos dois a aula de 08/06 tem "A depois"', (await aula(pagA, 's1@2026-06-08')).nota + '/' + (await aula(pagB, 's1@2026-06-08')).nota, 'A depois/A depois');
  const hA = await historico(pagA), hB = await historico(pagB);
  conf('o histórico de B guarda a versão dele que perdeu ("B primeiro")', hB.some(h => h.notas.indexOf('B primeiro') >= 0), true);
  conf('o histórico de A guarda a versão de B que chegou e perdeu para a edição pendente de A', hA.some(h => h.notas.indexOf('B primeiro') >= 0), true);
  conf('os rótulos dizem de onde veio cada uma', (hB.map(h => h.rotulo).indexOf('Antes de receber do outro aparelho') >= 0) + '/' +
    (hA.map(h => h.rotulo).indexOf('Do outro aparelho, que perdeu para a edição daqui') >= 0), 'true/true');

  secao('5. A regra, direto: o que chega com carimbo do servidor mais velho não é aplicado');
  const velho = await pagA.evaluate(async () => {
    const regs = await Store.lerRegistros();
    const local = regs.find(r => r.id === 'aula:s1@2026-06-08');
    const antes = JSON.stringify(local.dados);
    const velho = Object.assign({}, local.dados, { notaTexto: 'velho de outro aparelho' });
    const contas = await Store.aplicarRecebidos([{ id: local.id, tipo: 'aula', atualizadoEm: '2020-01-01T00:00:00.000Z', apagadoEm: null, aparelho: 'ap000000000000',
      esquema: 1, servidorEm: '2000-01-01T00:00:00.000000Z', updateTime: '2000-01-01T00:00:00.000000Z', dados: velho }]);
    const depois = JSON.stringify((await Store.lerRegistros()).find(r => r.id === 'aula:s1@2026-06-08').dados);
    return { carimboLocal: local.nuvem && local.nuvem.servidorEm, ignorados: contas.ignorados, aplicados: contas.aplicados, igual: antes === depois };
  });
  conf('o registro local tem o carimbo do servidor anotado', !!velho.carimboLocal, true);
  prop('o mais velho foi ignorado e o local ficou como estava', velho.ignorados === 1 && velho.aplicados === 0 && velho.igual, MODOS[1]);
  if (MODO === MODOS[1]) throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });

  secao('6. Duas abas do mesmo aparelho em ordem cruzada: a precondição recusa a versão velha');
  const pagA2 = await pagA.browser().newPage();
  await prepararPagina(pagA2, false);
  await H.abrirApp(pagA2, amb.ORIGEM);
  await editar(pagA, "d.aulas.find(a => a.id === 's1@2026-06-10').hora = '11:00';");
  // a aba 2 lê a fila (versão 11:00) e fica presa no commit
  await pagA2.evaluate(() => {
    const original = window.fetch;
    window.__segurado = false;
    window.__soltar = null;
    window.fetch = function (url) {
      const args = arguments;
      if (/:commit\b/.test(String(url)) && !window.__soltou) {
        window.__segurado = true;
        return new Promise(res => { window.__soltar = () => { window.__soltou = true; res(original.apply(this, args)); }; });
      }
      return original.apply(this, args);
    };
    window.__envio2 = Nuvem.enviarRegistros({ versaoApp: 'aba2' });
  });
  conf('a aba 2 chegou ao commit e ficou presa', (await esperar('o commit da aba 2 preso', () => pagA2.evaluate(() => window.__segurado), v => v === true, 10000)).ok, true);
  await editar(pagA, "d.aulas.find(a => a.id === 's1@2026-06-10').hora = '12:00';");
  const sA6 = await sincronizar(pagA);
  conf('a aba 1 subiu a versão nova (12:00)', sA6.enviados >= 1 && sA6.erroE === null, true);
  const envio2 = await pagA2.evaluate(() => { window.__soltar(); return window.__envio2.then(r => ({ enviados: r.enviados, erro: r.erro ? r.erro.codigo : null })); });
  conf('a aba 2, solta, não sobrepôs e não ficou em erro (recebeu e desistiu)', JSON.stringify(envio2), JSON.stringify({ enviados: 0, erro: null }));
  const atualizadoLocal = await pagA.evaluate(() => Store.lerRegistros().then(l => l.find(r => r.id === 'aula:s1@2026-06-10').atualizadoEm));
  const noServidor = (await lerDoc(dona.idToken, dona.localId, 'registros/aula:s1@2026-06-10')).json;
  conf('o servidor ficou com a versão nova (o atualizadoEm da aba 1)', noServidor && noServidor.fields.atualizadoEm.stringValue, atualizadoLocal);
  conf('e as duas abas leem 12:00', (await aula(pagA, 's1@2026-06-10')).hora + '/' + (await aula(pagA2, 's1@2026-06-10')).hora, '12:00/12:00');
  await pagA2.close();

  secao('7. Reaberturas divergentes: A reabre a mesma data duas vezes (r2), B uma vez (r1); fica só a de maior r');
  const reabrir = "Core.excluirAulas(d, d.aulas.find(a => a.serieId === 's1' && a.data === '2026-06-01').id, 'esta'); Core.editarSerie(d, 's1', { hora: '10:30' }, '2026-06-01');";
  await editar(pagA, reabrir);
  await editar(pagA, reabrir);
  await editar(pagB, reabrir);
  const idsA = await pagA.evaluate(async () => (await Store.carregar()).aulas.filter(a => a.serieId === 's1' && a.data === '2026-06-01').map(a => a.id));
  const idsB = await pagB.evaluate(async () => (await Store.carregar()).aulas.filter(a => a.serieId === 's1' && a.data === '2026-06-01').map(a => a.id));
  conf('antes de sincronizar, A tem r2 e B tem r1 na mesma data', idsA.join(',') + ' | ' + idsB.join(','), 's1@2026-06-01+r2 | s1@2026-06-01+r1');
  await sincronizar(pagA);
  await sincronizar(pagB);
  await sincronizar(pagA);
  await sincronizar(pagB);
  const vivasA = await pagA.evaluate(async () => (await Store.carregar()).aulas.filter(a => a.serieId === 's1' && a.data === '2026-06-01').map(a => a.id));
  const vivasB = await pagB.evaluate(async () => (await Store.carregar()).aulas.filter(a => a.serieId === 's1' && a.data === '2026-06-01').map(a => a.id));
  conf('depois, em A fica viva só a de maior r', vivasA.join(','), 's1@2026-06-01+r2');
  conf('e em B também', vivasB.join(','), 's1@2026-06-01+r2');
  const lapideR1 = await pagB.evaluate(() => Store.lerRegistros().then(l => { const r = l.find(x => x.id === 'aula:s1@2026-06-01+r1'); return r ? !!r.apagadoEm : null; }));
  conf('a r1 em B virou lápide', lapideR1, true);

  secao('7b. A fusão não mata aula legítima: a aula da série filha com o id da mãe (seguintes) e a mãe reaberta com +2; e nunca apaga aula com conteúdo');
  const legitimas = await pagA.evaluate(async () => {
    const d = await Store.carregar();
    d.series.push({ id: 's3', alunoId: 'alfa', dias: [2, 4], hora: '09:00', duracaoMin: 60, inicio: '2026-07-01', fim: '2026-07-31', exclusoes: [], materializadoAte: null });
    Core.garantirSeriesAte(d, '2026-07');
    const corte = d.aulas.find(a => a.serieId === 's3' && a.data === '2026-07-14');
    // "desta em diante" com hora nova: a série filha nasce e as aulas de 14/07 em diante passam para ela, com o id que têm
    Core.aplicarEdicaoAula(d, corte.id, { hora: '16:00' }, 'seguintes');
    const daFilha = d.aulas.find(a => a.id === 's3@2026-07-14');
    daFilha.notaTexto = 'relato na aula da filha';
    // a mãe reaberta sobre 14/07: o id s3@2026-07-14 já existe, a nova ganha +2
    Core.editarSerie(d, 's3', { fim: '2026-07-31' }, '2026-07-14');
    await Store.salvar(d);
    const porId = l => l.filter(a => a.data === '2026-07-14').map(a => a.id + ' (' + a.serieId + ')').sort();
    const antes = porId(d.aulas);
    const contas = await Store.aplicarRecebidos([]);
    const depois = porId((await Store.carregar()).aulas);
    // duas reabertas (+r) na mesma série e data, a de menor r com relato: as duas ficam e o conflito vai ao histórico
    const d2 = await Store.carregar();
    d2.aulas.push({ id: 's3@2026-07-02+r1', alunoId: 'alfa', serieId: 's3', data: '2026-07-02', hora: '09:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: 'relato da r1', anexos: [] });
    d2.aulas.push({ id: 's3@2026-07-02+r2', alunoId: 'alfa', serieId: 's3', data: '2026-07-02', hora: '09:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] });
    await Store.salvar(d2);
    const contas2 = await Store.aplicarRecebidos([]);
    await Store.aplicarRecebidos([]); // o mesmo conflito, de novo: nenhuma entrada a mais
    const vivas0702 = (await Store.carregar()).aulas.filter(a => a.data === '2026-07-02' && a.serieId === 's3').map(a => a.id).sort();
    const conflito = (await Store.listarHistorico()).filter(h => /as duas com conteúdo/.test(h.rotulo)).length;
    return { antes, depois, fundidas: contas.fundidas, vivas0702, conflitos: contas2.conflitos || 0, fundidas2: contas2.fundidas, conflito };
  });
  conf('o Core produziu as duas aulas legítimas de 14/07: a da filha com o id da mãe e a da mãe com +2',
    JSON.stringify(legitimas.antes.map(a => a.split(' ')[0])), JSON.stringify(['s3@2026-07-14', 's3@2026-07-14+2']));
  conf('e em séries diferentes', legitimas.antes.map(a => a.split(' ')[1]).join(',') !== '(s3),(s3)', true);
  prop('a fusão não tocou nelas (séries diferentes, e sem +r)', legitimas.fundidas === 0 && JSON.stringify(legitimas.depois) === JSON.stringify(legitimas.antes), MODOS[4]);
  if (MODO === MODOS[4]) throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
  // (a aula original de 02/07, sem +r, fica fora da fusão e continua viva também)
  conf('duas reabertas na mesma série e data, a de menor r com relato: as duas ficam', JSON.stringify(legitimas.vivas0702), JSON.stringify(['s3@2026-07-02', 's3@2026-07-02+r1', 's3@2026-07-02+r2']));
  conf('nada fundido, um conflito, e UMA entrada no histórico mesmo recebendo duas vezes', legitimas.fundidas2 + '/' + legitimas.conflitos + '/' + legitimas.conflito, '0/1/1');
  await editar(pagA, "d.aulas = d.aulas.filter(a => !/^s3@2026-07-02/.test(a.id));");

  secao('8. O celular só leitura restaura e RECEBE os registros, sem nunca enviar');
  const contextoC = await pagA.browser().createBrowserContext();
  const pagC = await contextoC.newPage();
  await prepararPagina(pagC, true);
  await H.abrirApp(pagC, amb.ORIGEM);
  await esperar('a tela do celular pede a conta', () => existe(pagC, '#cel-conta #nuvem-entrar'), v => v === true, 15000);
  await digitar(pagC, '#cel-conta #nuvem-email', DONA.email);
  await digitar(pagC, '#cel-conta #nuvem-senha', DONA.senha);
  await clicar(pagC, '#cel-conta #nuvem-entrar');
  await esperar('o botão de trazer a cópia', () => existe(pagC, '#cel-trazer'), v => v === true, 15000);
  conf('o celular restaurou a cópia (a de A, antiga)', await restaurarPelaTela(pagC, chaveA.formatado, '#cel-trazer'), true);
  /* A ordem no celular é restaurar e DEPOIS receber, em série, e a restauração
   * zera o cursor: o recebimento recomeça do zero e as edições que a cópia não
   * tinha chegam por cima dela. Aqui a prova espera o receber que a tela do
   * celular dispara depois da restauração, e confere o cursor dos dois lados. */
  const cursorDepois = await esperar('o recebimento que segue a restauração', () => pagC.evaluate(() => Store.lerCursor().then(c => c && c.servidorEm ? c.servidorEm : null)), v => !!v, 20000);
  conf('depois da restauração veio um recebimento, em série, e o cursor foi gravado de novo', cursorDepois.ok, true);
  const rC = await pagC.evaluate(() => Nuvem.receberRegistros().then(r => ({ aplicados: r.aplicados, erro: r.erro ? r.erro.codigo : null })));
  conf('a cópia é mais velha que as edições: foi o recebimento que trouxe "A depois" (a restauração zerou o cursor e recomeçou)',
    (await aula(pagC, 's1@2026-06-08')).nota, 'A depois');
  conf('receber de novo no celular, em dia, não falha', rC.erro === null, true);
  conf('o celular vê "A depois" na aula de 08/06 e não vê a aula apagada', (await aula(pagC, 's1@2026-06-08')).nota + '/' + ((await aula(pagC, 'x1')) === null), 'A depois/true');
  conf('o celular tem a mesma agenda de A', await retrato(pagC), await retrato(pagA));
  const sC = await pagC.evaluate(() => Nuvem.sincronizar({ versaoApp: 'prova' }).then(r => r.enviados.pulado || null));
  conf('sincronizar no celular só recebe: o envio é pulado pela trava', sC, 'so leitura');
  conf('nenhum commit saiu do celular', pagC.commits.length, 0);
  conf('a fila do celular está vazia', await pagC.evaluate(() => Store.lerFila().then(l => l.length)), 0);

  secao('9. O cursor é guardado: receber de novo não aplica nada');
  const rA = await pagA.evaluate(() => Nuvem.receberRegistros().then(r => r.aplicados));
  conf('A, em dia, recebe zero', rA, 0);
  conf('o cursor de A está gravado, com o par carimbo e nome', await pagA.evaluate(() => Store.lerCursor().then(c => !!(c && c.servidorEm && c.nome))), true);

  secao('9b. "Apagar tudo" desliga a sincronização; restaurar a própria cópia religa, e três sincronizações zeram a fila sem erro');
  await H.irParaAba(pagB, 'ajustes');
  await clicar(pagB, '#apagar-tudo');
  const apagou = await esperar('B apagou tudo', () => pagB.evaluate(async () => { const d = await Store.carregar(); return d ? d.alunos.filter(a => !a.daCargaInicial).length : -1; }), v => v === 0, 15000);
  conf('B apagou tudo (fica só a carga inicial ou nada)', apagou.ok, true);
  const desligada = await pagB.evaluate(() => Nuvem.sincronizar({ versaoApp: 'prova' }).then(r => ({ recebe: r.recebidos.pulado || null, envia: r.enviados.pulado || null, estado: Nuvem.estado().sincronizacaoDesligada })));
  conf('depois do "Apagar tudo", receber e enviar ficam desligados', JSON.stringify(desligada), JSON.stringify({ recebe: 'desligada', envia: 'desligada', estado: true }));
  const fraseDesligada = await pagB.evaluate(() => Nuvem.contarFila().then(() => (document.querySelector('#nuvem-registros') || {}).textContent || ''));
  conf('Ajustes diz que a sincronização está desligada desde o "Apagar tudo"', /sincronização entre aparelhos está desligada desde o "Apagar tudo"/.test(fraseDesligada), true);
  await sincronizar(pagA);
  conf('a nuvem não perdeu nada com o "Apagar tudo" de B: A continua com as aulas', (await pagA.evaluate(async () => (await Store.carregar()).aulas.length)) > 0, true);
  conf('B restaurou a própria cópia (a atual, pelo código)', await restaurarPelaTela(pagB, chaveA.formatado, '#nuvem-restaurar'), true);
  const religada = await pagB.evaluate(async () => {
    const rodadas = [];
    for (let k = 0; k < 3; k++) {
      const r = await Nuvem.sincronizar({ versaoApp: 'prova' });
      rodadas.push([r.recebidos.erro ? r.recebidos.erro.codigo : null, r.enviados.erro ? r.enviados.erro.codigo : null, r.enviados.pulado || null]);
    }
    await Nuvem.contarFila();
    return { rodadas, fila: await Store.tamanhoDaFila(), quarentena: (await Store.estadoDaFila()).quarentena, ligada: !Nuvem.estado().sincronizacaoDesligada,
      frase: (document.querySelector('#nuvem-registros') || {}).textContent || '' };
  });
  conf('restaurar religou a sincronização', religada.ligada, true);
  conf('três sincronizações sem erro, nenhuma pulada', JSON.stringify(religada.rodadas), JSON.stringify([[null, null, null], [null, null, null], [null, null, null]]));
  conf('a fila zerou e nada foi para a quarentena', religada.fila + '/' + religada.quarentena, '0/0');
  conf('e a tela ficou sem erro', /Todas as mudanças já subiram/.test(religada.frase), true);
  await sincronizar(pagA);
  conf('A e B iguais depois do apagar tudo e da restauração', await retrato(pagA), await retrato(pagB));

  secao('10. Mil registros em cinco commits: a paginação não perde nenhum');
  const mil = await pagA.evaluate(async () => {
    const d = await Store.carregar();
    for (let k = 0; k < 1000; k++) d.aulas.push({ id: 'm' + k, alunoId: 'alfa', serieId: null, data: '2027-0' + (1 + (k % 9)) + '-' + String(1 + (k % 28)).padStart(2, '0'), hora: '08:00',
      duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] });
    await Store.salvar(d);
    const r = await Nuvem.sincronizar({ versaoApp: 'prova' });
    return { enviados: r.enviados.enviados, erro: r.enviados.erro ? r.enviados.erro.codigo : null, fila: await Store.tamanhoDaFila() };
  });
  conf('A subiu os mil (em lotes de 200) sem erro e a fila esvaziou', JSON.stringify(mil), JSON.stringify({ enviados: 1000, erro: null, fila: 0 }));
  const milEmB = await pagB.evaluate(() => Nuvem.sincronizar({ versaoApp: 'prova' }).then(async r => ({ recebidos: r.recebidos.aplicados, erro: r.recebidos.erro ? r.recebidos.erro.codigo : null,
    aulasM: (await Store.carregar()).aulas.filter(a => /^m\d+$/.test(a.id)).length })));
  prop('B recebeu os mil registros, nenhum perdido entre as páginas', milEmB.aulasM === 1000 && milEmB.erro === null, MODOS[2]);
  if (MODO === MODOS[2]) throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
  conf('nenhum erro de página em A, B e C', [pagA, pagB, pagC].map(p => p.errosDePagina.join(' | ')).filter(Boolean).join(' || '), '');
  await pagC.close(); await contextoC.close();
  await pagB.close(); await contextoB.close();
})().then(() => derrubarEmulador().then(H.fim(amb)), e => derrubarEmulador().then(() => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e))));
