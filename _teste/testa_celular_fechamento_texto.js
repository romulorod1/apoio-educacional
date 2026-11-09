/* testa_celular_fechamento_texto.js
 *
 * A mensagem do mês (o texto geral do fechamento, o "Feedback" do PDF da
 * família) editada no celular. Contra o Firebase Emulator Suite (Auth e
 * Firestore), com um tablet (1280 px), o celular da dona (390 x 844) e um
 * observador de outra conta (390 x 844). Alunos e textos fictícios.
 *
 * O que prova:
 *   1. no Fechamento e no Enviar do celular da dona, cada aluno tem "Editar a
 *      mensagem do mês", dentro das ações do celular; o observador não tem;
 *   2. o editor abre o MESMO texto que o tablet edita (Core.textoDoMes, o
 *      campo db.resumos), com as aulas do mês contadas no alto;
 *   3. a tela: o texto ocupa a tela, Salvar e Cancelar à vista com o teclado
 *      aberto (a parte visível encolhida), sem transbordo a 360, 390 e 412 px
 *      e com a letra a 130%;
 *   4. o texto salvo no celular sai no PDF ("Enviar o PDF" e "Ver o PDF"),
 *      pelo texto extraído do PDF gerado;
 *   5. ele sobe pela fila de registros e chega ao tablet;
 *   6. a edição do tablet chega ao celular, que diz "Editado no tablet hoje às
 *      HH:MM", com a hora do registro;
 *   7. editando os dois lados, vale a última gravação, nos dois sentidos;
 *   8. o observador não vê o botão nem o editor, e nada sobe dele;
 *   9. sair sem salvar deixa um rascunho neste aparelho, que volta ao reabrir;
 *  10. junho, o fechamento de referência, continua 10 encontros, 10:30 e
 *      R$ 1.050,00 quando o texto não muda, e Salvar sem mudança não grava;
 *  11. a volta de versão: um tablet com o código da 1.42.18 recebe o texto do
 *      celular e edita para ele, pelo mesmo registro de sempre.
 *
 * Venenos, que TÊM de reprovar a propriedade:
 *   --envenenado-texto-fora-do-pdf       o celular grava o texto num campo dele, que o PDF não lê;
 *   --envenenado-texto-nao-sobe          o Salvar grava fora da ação do celular e nada sobe;
 *   --envenenado-observador-edita-texto  o observador ganha o "Editar a mensagem do mês";
 *   --envenenado-vale-o-primeiro         no recebimento, o que chega vence a edição local na fila (store.js);
 *   --envenenado-vale-quem-chega-depois  a regra de antes: a edição local na fila vence mesmo escrita antes (store.js);
 *   --envenenado-resumo-sem-precondicao  a mensagem sem carimbo conhecido sobe sem precondição (nuvem.js, K4);
 *   --envenenado-tablet-antigo-edita     o celular edita com o tablet ainda numa versão anterior (K6).
 *
 * A versão que perde num conflito fica no próprio item (versaoDeFora), à
 * vista no editor do celular e na janela do feedback do tablet.
 *
 * Na mensagem do mês vence a escrita MAIS RECENTE (o atualizadoEm de quem
 * escreveu), e não a que chega por último: o texto escrito no ônibus sem
 * sinal não cobre a correção feita depois no tablet.
 *
 * O relógio da página fica fixo em 15/10/2026 18:00 (a prova não depende do
 * dia em que roda).
 *
 *   --prints <pasta>   os cinco prints, em 390 x 844.
 *
 * Portas: 9021 (app), 9023 (auth), 9024 (firestore), 9025 (hub), 9026 (log),
 * 9027 (websocket). Precisa do firebase-tools e de um JDK 21 em JAVA_HOME.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const MODOS = ['--envenenado-texto-fora-do-pdf', '--envenenado-texto-nao-sobe', '--envenenado-observador-edita-texto', '--envenenado-vale-o-primeiro',
  '--envenenado-vale-quem-chega-depois', '--envenenado-resumo-sem-precondicao', '--envenenado-tablet-antigo-edita'];
const [V_PDF, V_SOBE, V_OBS, V_PRIMEIRO, V_CHEGA, V_SEMPRE, V_K6] = MODOS;
const PRINTS = (() => { const i = process.argv.indexOf('--prints'); return i >= 0 ? process.argv[i + 1] : ''; })();
const MODO = MODOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
/* Um argumento --envenenado-... que não está na lista rodaria calado como o
 * modo normal: a prova recusa. */
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && MODOS.indexOf(a) < 0);
function prop(rotulo, ok, venenos) {
  venenos = [].concat(venenos || []);
  if (MODO && venenos.indexOf(MODO) >= 0) return conf('VENENO visto: ' + rotulo + ', e quebrou', ok, false);
  return conf(rotulo, ok, true);
}
function fimDoVeneno() { throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true }); }
function seVeneno(venenos) { if (MODO && [].concat(venenos).indexOf(MODO) >= 0) fimDoVeneno(); }

const PORTA_APP = 9021, PORTA_AUTH = 9023, PORTA_FS = 9024, PORTA_HUB = 9025, PORTA_LOG = 9026, PORTA_WS = 9027;
const PROJETO = 'demo-nath-fechtexto';
const AUTH = 'http://127.0.0.1:' + PORTA_AUTH;
const FS = 'http://127.0.0.1:' + PORTA_FS;
const FIREBASE = process.env.FIREBASE_TOOLS ||
  'C:/Users/romul/ferramentas/firebase-tools/node_modules/firebase-tools/lib/bin/firebase.js';
const JAVA_HOME = process.env.JAVA_HOME || '';
const DONA = { email: 'dona@exemplo.test', senha: 'senha-da-dona-1' };
const OBS = { email: 'observador@exemplo.test', senha: 'senha-do-observador-1' };

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const CORE = fs.readFileSync(path.join(H.RAIZ, 'core.js'), 'utf8');
const STORE = fs.readFileSync(path.join(H.RAIZ, 'store.js'), 'utf8');
const CSS = fs.readFileSync(path.join(H.RAIZ, 'styles.css'), 'utf8');
const REGRAS = fs.readFileSync(path.join(H.RAIZ, 'firestore.rules'), 'utf8');

secao('0. As âncoras dos venenos e o ambiente');
conf('nenhum --envenenado- desconhecido foi pedido (' + (desconhecidos.join(' ') || 'nenhum') + ')', desconhecidos.length, 0);
const ANCORAS = {
  [V_PDF]: ['app.js', '      Core.gravarTextoDoMes(db, ed.alunoId, ed.mes, texto);',
    "      db.ajustes = db.ajustes || {}; (db.ajustes.mensagensDoCelular = db.ajustes.mensagensDoCelular || {})[ed.alunoId + ':' + ed.mes] = texto;"],
  [V_SOBE]: ['app.js', 'return comoAcaoDoCelular(function () { return comDesfazer(rotuloMensagem,',
    'return (function (f) { return f(); })(function () { return comDesfazer(rotuloMensagem,'],
  [V_OBS]: ['app.js', 'function podeEditarMensagemCelular() { return celularEdita(); }', 'function podeEditarMensagemCelular() { return true; }'],
  [V_PRIMEIRO]: ['store.js', 'if (local && entrada && !entrada.quarentena) {', 'if (local && entrada && !entrada.quarentena && false) {'],
  // a regra de antes: a edição local na fila vence sempre, mesmo escrita antes da que chega
  [V_CHEGA]: ['store.js', "chegou.tipo === 'resumo' && !entrada.restauro &&", 'false &&'],
  // o envio de antes: a mensagem sem carimbo conhecido sobe sem precondição e cobre a do outro aparelho
  [V_SEMPRE]: ['nuvem.js', "(itens[k].fila.restauro || itens[k].registro.tipo === 'resumo')", '(itens[k].fila.restauro)'],
  // o celular edita com o tablet ainda numa versão anterior
  [V_K6]: ['app.js', 'if (v && Core.versaoAntes(v.app, VERSAO) === true) {', 'if (false) {']
};
/* O app servido leva a VERSAO desta entrega (a que o portão sobe ao juntar):
 * é com ela que o celular compara a versão do tablet (K6). */
/* A VERSAO vem do próprio app.js: depois do merge com a main e da subida de
 * versão ao juntar, ela já é maior que a 1.42.18; só no ramo ainda na 1.42.18
 * a prova serve uma versão acima, para o K6 ter o que comparar. */
const VERSAO_DO_APP = (APP.match(/var VERSAO = '([0-9.]+)';/) || [])[1] || '';
const VERSAO_SERVIDA = VERSAO_DO_APP === '1.42.18' ? '1.42.19' : VERSAO_DO_APP;
const APP_SERVIDO = VERSAO_DO_APP === '1.42.18' ? APP.replace("var VERSAO = '1.42.18';", "var VERSAO = '" + VERSAO_SERVIDA + "';") : APP;
const NUVEM = fs.readFileSync(path.join(H.RAIZ, 'nuvem.js'), 'utf8');
const FONTES = { 'app.js': APP_SERVIDO, 'store.js': STORE, 'nuvem.js': NUVEM };
conf('cada âncora de veneno está no arquivo dela uma vez só', MODOS.map(m => FONTES[ANCORAS[m][0]].split(ANCORAS[m][1]).length - 1).join(','), MODOS.map(() => 1).join(','));
const TRAV = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']');
conf('o app.js, o core.js e o styles.css não têm travessão', [APP, CORE, CSS].map(t => TRAV.test(t)).join(','), 'false,false,false');
/* Um lugar só para o texto: o tablet e o celular gravam pela mesma função do
 * core, e ninguém mais empurra resumo à mão no app (a janela "Preparar e
 * enviar", de antes, é a única exceção que sobra, e é contada). */
conf('o tablet e o celular gravam a mensagem pela mesma função (Core.gravarTextoDoMes: no feedback do tablet e no editor do celular)',
  [APP.split('Core.gravarTextoDoMes(').length - 1, APP.split('db.resumos.push(').length - 1, /function gravarTextoDoMes\(db, alunoId, mesIso, texto\)/.test(CORE)].join(','), '2,1,true');
const trocas = { '/app.js': APP_SERVIDO };
const numVersao = v => v.split('.').map(Number).reduce((a, n) => a * 1000 + n, 0);
conf('(arranjo) o app servido leva a VERSAO ' + VERSAO_SERVIDA + ', acima da 1.42.18', APP_SERVIDO.indexOf("var VERSAO = '" + VERSAO_SERVIDA + "';") >= 0 && numVersao(VERSAO_SERVIDA) > numVersao('1.42.18'), true);
if (MODO) {
  const [arq, de, para] = ANCORAS[MODO];
  trocas['/' + arq] = FONTES[arq].replace(de, para);
  conf('o ' + arq + ' servido ficou diferente do repositório (' + MODO + ')', trocas['/' + arq] !== FONTES[arq], true);
}

conf('o firebase-tools está onde a prova procura (' + FIREBASE + ')', fs.existsSync(FIREBASE), true);
const javaExe = JAVA_HOME ? path.join(JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java';
const versaoJava = (function () {
  const r = spawnSync(javaExe, ['-version'], { encoding: 'utf8' });
  const m = /version "(\d+)/.exec((r.stderr || '') + (r.stdout || ''));
  return m ? Number(m[1]) : 0;
})();
conf('há um JDK 21 ou mais novo (' + (JAVA_HOME || 'java do PATH') + ', versão ' + versaoJava + ')', versaoJava >= 21, true);
if (!fs.existsSync(FIREBASE) || versaoJava < 21 || desconhecidos.length) {
  console.log('\n' + H.placar.passes + ' passaram, ' + H.placar.falhas + ' falharam.');
  process.exit(1);
}

/* ---------- o emulador ---------- */
const PASTA = path.join(os.tmpdir(), 'nath_fechtexto_emulador_' + process.pid);
let emulador = null;
function subirEmulador() {
  fs.mkdirSync(PASTA, { recursive: true });
  fs.writeFileSync(path.join(PASTA, 'firestore.rules'), REGRAS);
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
  const r = await fetch(url, { method: opcoes.metodo || (corpo !== undefined ? 'POST' : 'GET'), headers: cab, body: corpo });
  const t = await r.text();
  let json = null;
  try { json = t ? JSON.parse(t) : null; } catch (e) { json = null; }
  return { status: r.status, json };
}
const criarUsuario = (u) => rest(AUTH + '/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake',
  { corpo: { email: u.email, password: u.senha, returnSecureToken: true } });

const CFG = { auth: AUTH, firestore: FS, projectId: PROJETO };
const amb = H.criarAmbiente(PORTA_APP, 'nath_fechtexto_celular', trocas);

const HOJE = '2026-10-15';
const RELOGIO = HOJE + 'T18:00:00';
/* UM relógio para as três páginas: o desvio é calculado uma vez, aqui, e não a
 * cada carga da página. Com um por carga, a página recarregada voltava às
 * 18:00 e a outra seguia andando, e a hora de escrita de cada lado (que decide
 * a mensagem do mês) não era comparável. */
const DESVIO = new Date(RELOGIO).getTime() - Date.now();
const MES = HOJE.slice(0, 7);

async function prepararPagina(pag, movel) {
  pag.setDefaultTimeout(60000);
  if (movel) await pag.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  pag.errosDePagina = [];
  pag.on('pageerror', e => pag.errosDePagina.push(e.message));
  pag.dialogos = [];
  // pag.recusar = true: a próxima pergunta é recusada (o "Cancelar" do diálogo)
  pag.on('dialog', async d => { pag.dialogos.push(d.message()); try { if (pag.recusar) await d.dismiss(); else await d.accept(); } catch (e) { /* ok */ } });
  pag.commitsNaRede = 0;
  pag.on('request', r => {
    const u = r.url();
    if (u.indexOf(FS) === 0 && /:commit\b/.test(u) && r.method() === 'POST') pag.commitsNaRede++;
  });
  /* O relógio da página, fixo no meio do mês (e andando a partir dali). */
  await pag.evaluateOnNewDocument(desvio => {
    const Real = Date;
    class Fixo extends Real { constructor(...a) { if (a.length) super(...a); else super(Real.now() + desvio); } static now() { return Real.now() + desvio; } }
    window.Date = Fixo;
  }, DESVIO);
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
const clicar = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.click(); return true; }, sel);
async function digitar(pag, sel, valor) {
  return pag.evaluate((s, v) => {
    const e = document.querySelector(s);
    if (!e) return false;
    e.value = v;
    e.dispatchEvent(new Event('input', { bubbles: true }));
    e.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }, sel, valor);
}
async function abrirCelular(pag) {
  await pag.goto(amb.ORIGEM + '/index.html', { waitUntil: 'networkidle0' });
  const ok = await esperar('o aplicativo abriu', () => pag.evaluate(() =>
    typeof Store === 'object' && !!document.querySelector('#versao-app') && document.querySelector('#versao-app').textContent.length > 1),
  v => v === true, 40000);
  if (!ok.ok) throw Object.assign(new Error('o aplicativo não abriu'), { jaContado: false });
  await pausa(1200);
}
async function entrarPelaTela(pag, email, senha) {
  await H.irParaAba(pag, 'ajustes');
  const form = await esperar('o cartão da nuvem pede e-mail e senha', () => existe(pag, '#nuvem-entrar'), v => v === true, 10000);
  if (!form.ok) return false;
  await digitar(pag, '#nuvem-email', email);
  await digitar(pag, '#nuvem-senha', senha);
  await clicar(pag, '#nuvem-entrar');
  return (await esperar('entrou e o cartão mostra os botões', () => existe(pag, '#nuvem-enviar'), v => v === true, 15000)).ok;
}
async function entrarNoCelular(pag, conta) {
  await esperar('a tela do celular pede a conta', () => existe(pag, '#cel-conta #nuvem-entrar'), v => v === true, 15000);
  await digitar(pag, '#cel-conta #nuvem-email', conta.email);
  await digitar(pag, '#cel-conta #nuvem-senha', conta.senha);
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
    (await Store.carregar()).alunos.some(a => a.id === 'msg') && !!document.querySelector('#cel-hoje.ativa')), v => v === true, 30000)).ok;
}
const sincronizar = pag => pag.evaluate(() => Nuvem.sincronizar({ versaoApp: 'prova' }).then(r => ({
  recebidos: r.recebidos.aplicados, erroR: r.recebidos.erro ? r.recebidos.erro.codigo : null,
  enviados: r.enviados.enviados, erroE: r.enviados.erro ? r.enviados.erro.codigo : null })));
const fila = pag => pag.evaluate(() => Store.lerFila().then(l => l.map(e => e.id)));
const filaVazia = pag => esperar('a fila esvaziou', () => pag.evaluate(() => Store.lerFila().then(l => l.length)), v => v === 0, 20000);
const aba = (pag, t) => clicar(pag, '#cel-abas .cel-aba[data-cel="' + t + '"]').then(() => pausa(200));
/* O texto da mensagem no disco da página (o que o PDF e a sincronização leem). */
/* Lido direto de db.resumos, e não pelo Core.textoDoMes: a seção 13 roda o
 * tablet com o código da 1.42.18, que não tem a função. */
const textoNoDisco = (pag, aluno, mes) => pag.evaluate((a, m) => Store.carregar().then(d => {
  const r = (d.resumos || []).find(x => x.alunoId === a && x.mes === m); return r ? (r.texto || '') : ''; }), aluno, mes);
async function mesNoCelular(pag, mes, tela) {
  tela = tela || 'fechamento';
  const alvo = await pag.evaluate(m => Core.mesExtenso(m), mes);
  for (let i = 0; i < 30; i++) {
    const atual = (await texto(pag, '#cel-' + tela + ' .cel-mes .cel-titulo')) || '';
    if (atual === alvo) return true;
    const antes = await pag.evaluate((a, b) => {
      const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
      const n = t => { const p = t.toLowerCase().split(' de '); return Number(p[1]) * 12 + meses.indexOf(p[0]); };
      return n(a) > n(b);
    }, atual, alvo);
    await clicar(pag, '#cel-' + tela + ' .cel-mes button[aria-label="' + (antes ? 'Mês anterior' : 'Mês seguinte') + '"]');
    await pausa(80);
  }
  return false;
}
async function mesNoTablet(pag, mes) {
  await H.irParaAba(pag, 'fechamento');
  await pag.evaluate(m => { const s = document.querySelector('#mes-fechamento'); if (s.value !== m) { s.value = m; s.dispatchEvent(new Event('change', { bubbles: true })); } }, mes);
  await pausa(300);
}
/* O tablet edita a mensagem pela janela de sempre: "Editar o feedback" no
 * cartão do aluno, o campo e o Salvar. */
async function editarNoTablet(pag, aluno, mes, valor) {
  await mesNoTablet(pag, mes);
  const abriu = await pag.evaluate(a => {
    const l = document.querySelector('#lista-fechamento .linha-pagamento[data-aluno="' + a + '"]');
    const c = l && l.closest('.cartao');
    const b = c && Array.from(c.querySelectorAll('button')).find(x => /feedback/i.test(x.textContent));
    if (!b) return false;
    b.click();
    return true;
  }, aluno);
  if (!abriu) return false;
  await esperar('a janela do feedback abriu', () => existe(pag, '#modal-resumo.aberto #campo-resumo'), v => v === true, 5000);
  await digitar(pag, '#campo-resumo', valor);
  await clicar(pag, '#salvar-resumo');
  return (await esperar('o tablet gravou', () => textoNoDisco(pag, aluno, mes), v => v === valor, 10000)).ok;
}
async function tirarPrint(pag, nome) {
  if (!PRINTS) return;
  fs.mkdirSync(PRINTS, { recursive: true });
  await pausa(250);
  await pag.screenshot({ path: path.join(PRINTS, nome) });
  console.log('   print: ' + path.join(PRINTS, nome));
}
const RE_EDICAO = 'registrar|corrigir|editar|salvar|excluir|apagar|nova aula|novo aluno|^\\s*\\+|desmarcar|marcar|cancelar a aula|cancelar aula|cadastrar|pago|anotar|alterar|confirmar';
const medirTela = (pag) => pag.evaluate((reEdicao) => {
  const re = new RegExp(reEdicao, 'i');
  const visivel = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  const raiz = document.querySelector('#modo-celular');
  const alvos = Array.from(raiz.querySelectorAll('button, a[href], input, select, textarea, [role=button], summary')).filter(visivel);
  const pequenos = alvos.filter(e => { const r = e.getBoundingClientRect(); return r.height < 48 || r.width < 48; })
    .map(e => (e.id || e.className || e.textContent.trim().slice(0, 30)) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
  const botoes = Array.from(raiz.querySelectorAll('button')).filter(visivel).filter(b => re.test(b.textContent));
  const soltos = botoes.filter(b => !b.closest('[data-acao-celular]')).filter(b => !b.closest('#cel-entrada')).map(b => b.textContent.trim());
  const conteudo = document.querySelector('#cel-conteudo');
  return {
    rolaDeLado: document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth ||
      (conteudo && conteudo.scrollWidth > conteudo.clientWidth) || !!Array.from(raiz.querySelectorAll('*')).find(e => e.getBoundingClientRect().right > window.innerWidth + 0.5 && visivel(e)),
    alvos: alvos.length, pequenos, soltos, acoes: raiz.querySelectorAll('[data-acao-celular]').length
  };
}, RE_EDICAO);
const telaBoa = m => m.pequenos.join('; ') + (m.rolaDeLado ? ' ROLA DE LADO' : '');
/* A trava de transbordo do editor: nada passa da largura da tela, texto de
 * botão não estoura o botão, e Salvar e Cancelar ficam inteiros dentro da
 * parte visível. Devolve a lista do que transbordou (vazia é bom). */
const transbordoDoEditor = pag => pag.evaluate(() => {
  const ed = document.querySelector('#cel-mensagem');
  if (!ed) return ['sem editor'];
  const ruins = [];
  const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  Array.from(ed.querySelectorAll('*')).concat([ed]).filter(vis).forEach(e => {
    const r = e.getBoundingClientRect();
    if (r.right > window.innerWidth + 0.5 || r.left < -0.5) ruins.push((e.id || e.className || e.tagName) + ' sai de lado');
    if (e.tagName === 'BUTTON' && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)) ruins.push((e.id || e.textContent.trim()) + ' estoura o botão');
  });
  const altura = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  ['#cel-mensagem-salvar', '#cel-mensagem-cancelar'].forEach(s => {
    const b = document.querySelector(s); if (!b) { ruins.push(s + ' não existe'); return; }
    const r = b.getBoundingClientRect();
    if (r.top < 0 || r.bottom > altura + 0.5) ruins.push(s + ' fora da parte visível (' + Math.round(r.top) + '-' + Math.round(r.bottom) + ' de ' + Math.round(altura) + ')');
    if (r.height < 48) ruins.push(s + ' com ' + Math.round(r.height) + ' px de altura');
  });
  const c = document.querySelector('#cel-mensagem-texto');
  if (!c || c.getBoundingClientRect().height < 96) ruins.push('o texto ficou com ' + (c ? Math.round(c.getBoundingClientRect().height) : 0) + ' px');
  return ruins;
});
/* A letra a 130%: as variáveis de tamanho de letra do app, multiplicadas. */
const letraA = (pag, fator) => pag.evaluate(f => {
  let s = document.querySelector('#prova-letra');
  if (!s) { s = document.createElement('style'); s.id = 'prova-letra'; document.head.appendChild(s); }
  if (f === 1) { s.textContent = ''; return 0; }
  const raiz = getComputedStyle(document.documentElement);
  const regras = [];
  for (let i = 1; i <= 9; i++) {
    const v = parseFloat(raiz.getPropertyValue('--letra-' + i));
    if (v) regras.push('--letra-' + i + ': ' + (v * f).toFixed(1) + 'px !important;');
  }
  s.textContent = ':root { ' + regras.join(' ') + ' } body { font-size: ' + (16 * f) + 'px; }';
  return regras.length;
}, fator);

/* O texto do PDF: as cadeias dos operadores Tj, em latin1, emendadas. */
function textoDoPdf(base64) {
  const bruto = Buffer.from(base64, 'base64').toString('latin1');
  const rx = /\(((?:\\.|[^\\()])*)\)\s*Tj/g;
  const partes = [];
  let m;
  while ((m = rx.exec(bruto))) partes.push(m[1].replace(/\\([\\()])/g, '$1'));
  return partes.join(' ').replace(/\s+/g, ' ');
}
/* O PDF que o celular entrega: o "Enviar o PDF" vai ao compartilhar (anotado
 * aqui em vez de aberto) e o "Ver o PDF" baixa (o arquivo é guardado aqui).
 * Devolve o PDF em base64. */
async function pdfDoCelular(pag, aluno, qual) {
  await pag.evaluate(() => {
    window.__pdfs = [];
    const guardar = blob => blob.arrayBuffer().then(b => {
      const u = new Uint8Array(b); let s = '';
      for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192));
      window.__pdfs.push(btoa(s));
    });
    navigator.canShare = () => true;
    navigator.share = d => { guardar(d.files[0]); return Promise.resolve(); };
    if (!window.__urlOriginal) window.__urlOriginal = URL.createObjectURL;
    URL.createObjectURL = function (b) { if (b && b.type === 'application/pdf') guardar(b); return window.__urlOriginal.call(URL, b); };
  });
  const ok = await clicar(pag, '#cel-enviar .cel-familia[data-aluno="' + aluno + '"] ' + (qual === 'ver' ? '.cel-ver-pdf' : '.cel-enviar-pdf'));
  if (!ok) return '';
  const r = await esperar('o PDF saiu', () => pag.evaluate(() => window.__pdfs.slice()), v => v && v.length > 0, 10000);
  return r.ok ? textoDoPdf(r.valor[0]) : '';
}
const fmt = s => String(s || '').replace(/\u00a0/g, ' ');
const hhmmDe = iso => { const d = new Date(iso); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

const INICIAL = 'Texto inicial do tablet para outubro.';
const DO_CELULAR = 'Mensagem nova do celular: evoluiu em frações e já resolve problemas sozinho.';
const DO_TABLET = 'Versão do tablet: atenção à leitura dos enunciados em novembro.';
const T1 = 'Primeira, no tablet: o mês rendeu.';
const C1 = 'Última, no celular: o mês rendeu muito.';
const C2 = 'Primeira, no celular: revisão de frações.';
const T2 = 'Última, no tablet: revisão de frações e porcentagem.';
const RASCUNHO = 'Rascunho que ela não salvou: começou bem o mês.';
const JUNHO = 'Junho de referência: o texto de sempre.';
const REF_JUNHO = { linhas: 10, horas: '10:30', total: 'R$ 1.050,00' };
const SEL_MSG = '.cel-editar-mensagem[data-aluno="msg"]';
const DO_TABLET_FRASE = iso => 'O tablet editou este texto hoje às ' + hhmmDe(iso) + '. Se você salvar, a sua versão substitui a do tablet, que fica guardada no histórico.';
const ONIBUS_C = 'Escrito no ônibus, sem sinal, às dez.';
const ONIBUS_T = 'Corrigido no tablet depois, às duas.';
const ABERTO_T = 'Chegou do tablet com o editor aberto no celular.';
const ABERTO_C = 'Escrito no celular enquanto o tablet mandava outra.';

(async function () {
  secao('1. O tablet cria os alunos fictícios e as mensagens, e sobe a cópia');
  await subirEmulador();
  const dona = (await criarUsuario(DONA)).json;
  const obs = (await criarUsuario(OBS)).json;
  conf('as contas da dona e do observador existem no emulador', !!(dona && dona.localId && obs && obs.localId), true);
  await amb.subir();
  const pagA = await amb.pagina();
  await prepararPagina(pagA, false);
  await H.abrirApp(pagA, amb.ORIGEM);
  await pagA.evaluate(async (c) => {
    const d = Store.bancoVazio();
    const preco = (v) => [{ id: 'p-' + v, inicio: '2026-01-01', fim: null, valorHora: v }];
    const aluno = (id, nome, cor) => ({ id, nome, ativo: true, cor, responsavel: 'Responsável ' + nome, precos: preco(100), mapeamentos: [] });
    d.alunos = [
      aluno('msg', 'Aluno Mensagem Teste', '#1F3A5F'),
      aluno('rasc', 'Aluno Rascunho Teste', '#2E7D6B'),
      aluno('k4', 'Aluno Quatro Teste', '#B4453C'),
      { id: 'ref', nome: 'Aluno Referência Teste', ativo: true, cor: '#627D98', responsavel: '', mapeamentos: [],
        precos: [{ id: 'p-ref-1', inicio: '2026-01-01', fim: '2026-06-30', valorHora: 100 }, { id: 'p-ref-2', inicio: '2026-07-01', fim: null, valorHora: 140 }] }
    ];
    const aula = (id, alunoId, data, hora, dur) => ({ id, alunoId, serieId: null, data, hora, duracaoMin: dur, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] });
    d.aulas = [
      aula('msg-1', 'msg', c.mes + '-06', '15:00', 60),
      aula('msg-2', 'msg', c.mes + '-13', '15:00', 90),
      aula('rasc-1', 'rasc', c.mes + '-07', '10:00', 60),
      aula('k4-1', 'k4', c.mes + '-08', '11:00', 60)
    ];
    ['2026-06-01', '2026-06-03', '2026-06-05', '2026-06-08', '2026-06-10', '2026-06-12', '2026-06-15', '2026-06-17', '2026-06-19', '2026-06-22']
      .forEach((data, i) => d.aulas.push(aula('ref-' + data, 'ref', data, '15:30', i === 4 ? 90 : 60)));
    d.resumos = [{ alunoId: 'msg', mes: c.mes, texto: c.inicial }, { alunoId: 'ref', mes: '2026-06', texto: c.junho }];
    d.ajustes = d.ajustes || {};
    d.ajustes.pagamentosDesde = '2026-06';
    await Store.salvar(d);
  }, { mes: MES, inicial: INICIAL, junho: JUNHO });
  conf('(arranjo) o relógio da página é o da prova, ' + HOJE, await pagA.evaluate(() => Core.hojeIso()), HOJE);
  await H.abrirApp(pagA, amb.ORIGEM);
  conf('o tablet entrou', await entrarPelaTela(pagA, DONA.email, DONA.senha), true);
  await clicar(pagA, '#nuvem-enviar');
  conf('a cópia do tablet subiu', (await esperar('a cópia subiu', () => texto(pagA, '#nuvem-ultima'), v => /^Última cópia na nuvem: hoje/.test(v || ''), 30000)).ok, true);
  const sA = await sincronizar(pagA);
  conf('o tablet subiu os registros', sA.enviados > 0 && sA.erroE === null, true);
  await pagA.evaluate(u => Nuvem.permitirLeitor(u), obs.localId);

  secao('2. O celular da dona traz a cópia e recebe os registros');
  const ctxC = await pagA.browser().createBrowserContext();
  const pagC = await ctxC.newPage();
  await prepararPagina(pagC, true);
  await abrirCelular(pagC);
  conf('o celular entrou com a conta da dona', await entrarNoCelular(pagC, DONA), true);
  conf('trouxe a cópia do tablet', await trazerCopiaNoCelular(pagC), true);
  conf('(arranjo) é o celular da dona, que edita', await pagC.evaluate(() => Nuvem.estado().celularDaDona), true);
  const sC0 = await sincronizar(pagC);
  conf('o celular recebeu os registros do tablet', sC0.erroR === null, true);
  conf('(arranjo) o celular tem a mensagem inicial', await textoNoDisco(pagC, 'msg', MES), INICIAL);

  secao('3. O botão "Editar a mensagem do mês" no Fechamento e no Enviar');
  await aba(pagC, 'fechamento');
  conf('(arranjo) o Fechamento do celular abre no mês de hoje', await mesNoCelular(pagC, MES), true);
  const noFech = await pagC.evaluate(s => {
    const b = document.querySelector('#cel-fechamento ' + s);
    return b ? b.textContent + ' | ' + !!b.closest('[data-acao-celular]') + ' | ' + !!b.closest('.cel-fechamento-aluno[data-aluno="msg"]') : 'sem botão';
  }, SEL_MSG);
  prop('o cartão do aluno no Fechamento tem "Editar a mensagem do mês", dentro das ações do celular (' + noFech + ')', noFech === 'Editar a mensagem do mês | true | true');
  const pesos = await pagC.evaluate(() => {
    const c = document.querySelector('.cel-fechamento-aluno[data-aluno="msg"]');
    const p = c.querySelector('.btn-marcar-pago'), e = c.querySelector('.cel-editar-mensagem');
    if (!p || !e) return 'sem os dois botões';
    const fp = getComputedStyle(p), fe = getComputedStyle(e);
    return { respiro: Math.round(e.getBoundingClientRect().top - p.getBoundingClientRect().bottom), editarEhBtn: e.classList.contains('btn'),
      fundoIgual: fp.backgroundColor === fe.backgroundColor && fp.borderTopWidth === fe.borderTopWidth };
  });
  conf('o "Editar" é mais leve que o "Marcar como pago" e fica a um respiro dele (' + JSON.stringify(pesos) + ')',
    pesos.respiro >= 16 && !pesos.editarEhBtn && !pesos.fundoIgual, true);
  conf('cada aluno do mês tem o botão (msg, rasc e k4)', await pagC.evaluate(() => Array.from(document.querySelectorAll('#cel-fechamento .cel-editar-mensagem')).map(b => b.dataset.aluno).sort().join(',')), 'k4,msg,rasc');
  let m = await medirTela(pagC);
  conf('o Fechamento com o botão: alvos de 48 px, sem rolagem de lado, nenhum botão de edição solto', telaBoa(m) + '|' + m.soltos.join(', '), '|');
  await pagC.evaluate(s => document.querySelector('#cel-fechamento ' + s).scrollIntoView({ block: 'center' }), SEL_MSG);
  await tirarPrint(pagC, '1_botao_no_fechamento.png');
  await aba(pagC, 'enviar');
  await mesNoCelular(pagC, MES, 'enviar');
  conf('o Enviar também tem o botão, e "Ver o PDF" e "Enviar o PDF"', await pagC.evaluate(() => {
    const c = document.querySelector('#cel-enviar .cel-familia[data-aluno="msg"]');
    return c ? [!!c.querySelector('.cel-editar-mensagem'), !!c.querySelector('.cel-ver-pdf'), !!c.querySelector('.cel-enviar-pdf')].join(',') : 'sem cartão';
  }), 'true,true,true');
  m = await medirTela(pagC);
  conf('o Enviar: alvos de 48 px, sem rolagem de lado, nenhum botão de edição solto', telaBoa(m) + '|' + m.soltos.join(', '), '|');

  secao('4. O editor abre o mesmo texto do tablet, com as aulas do mês contadas');
  await aba(pagC, 'fechamento');
  await mesNoCelular(pagC, MES);
  const contasDoCartao = fmt(await texto(pagC, '.cel-fechamento-aluno[data-aluno="msg"] .ajuda'));
  conf('toque em "Editar a mensagem do mês"', await clicar(pagC, '#cel-fechamento ' + SEL_MSG), true);
  conf('o editor abriu', (await esperar('o editor abriu', () => existe(pagC, '#cel-mensagem #cel-mensagem-texto'), v => v === true, 5000)).ok, true);
  const noTabletAgora = await textoNoDisco(pagA, 'msg', MES);
  const aberto = await pagC.evaluate(() => ({ valor: document.querySelector('#cel-mensagem-texto').value, contas: document.querySelector('#cel-mensagem-contas').textContent,
    quem: document.querySelector('.cel-mensagem-quem').textContent, foco: document.activeElement && document.activeElement.id }));
  console.log('   ' + JSON.stringify(aberto));
  conf('o texto do editor é o que o tablet tem (Core.textoDoMes), preenchido', aberto.valor + ' | ' + noTabletAgora, INICIAL + ' | ' + INICIAL);
  conf('as aulas do mês contadas no alto, como no cartão (' + aberto.contas + ')', fmt(aberto.contas) === contasDoCartao && /^2 aulas dadas · 2:30 h · R\$ 250,00$/.test(fmt(aberto.contas)), true);
  conf('o aluno e o mês no alto', aberto.quem, 'Aluno Mensagem Teste · ' + (await pagC.evaluate(m => Core.mesExtenso(m), MES)));
  const origem0 = await esperar('a origem do texto apareceu', () => texto(pagC, '#cel-mensagem-origem'), v => !!v, 5000);
  const regInicial = await pagA.evaluate(id => Store.lerRegistros().then(l => (l.find(r => r.id === id) || {}).atualizadoEm || ''), 'resumo:msg:' + MES);
  conf('o texto inicial veio do tablet, e o editor diz o que acontece se ela salvar (' + origem0.valor + ')', origem0.valor, DO_TABLET_FRASE(regInicial));
  conf('o alto do editor diz que o texto vai para a família, no PDF do mês', await texto(pagC, '#cel-mensagem-destino'), 'Vai para a família no PDF de outubro de 2026.');
  m = await medirTela(pagC);
  conf('o editor: alvos de 48 px, sem rolagem de lado, Salvar e Cancelar dentro das ações do celular', telaBoa(m) + '|' + m.soltos.join(', '), '|');
  conf('o texto ocupa a tela: mais da metade da altura', await pagC.evaluate(() => document.querySelector('#cel-mensagem-texto').getBoundingClientRect().height > window.innerHeight / 2), true);
  conf('a trava de transbordo do editor, em 390 x 844', (await transbordoDoEditor(pagC)).join('; '), '');
  await tirarPrint(pagC, '2_editor_aberto.png');

  secao('5. Com o teclado aberto (a parte visível encolhida), Salvar e Cancelar continuam à vista; sem transbordo a 360, 390 e 412 px e com a letra a 130%');
  await pagC.setViewport({ width: 390, height: 480, hasTouch: true, isMobile: true });
  await pausa(300);
  const comTeclado = await transbordoDoEditor(pagC);
  conf('390 x 480 (teclado aberto): Salvar e Cancelar inteiros na parte visível, o texto com altura', comTeclado.join('; '), '');
  await tirarPrint(pagC, '3_editor_com_teclado.png');
  const travas = [];
  for (const largura of [360, 390, 412]) {
    for (const fator of [1, 1.3]) {
      for (const altura of [844, 480]) {
        await pagC.setViewport({ width: largura, height: altura, hasTouch: true, isMobile: true });
        await letraA(pagC, fator);
        await pausa(150);
        const r = await transbordoDoEditor(pagC);
        if (r.length) travas.push(largura + 'x' + altura + ' letra ' + Math.round(fator * 100) + '%: ' + r.join(', '));
      }
    }
  }
  await letraA(pagC, 1);
  await pagC.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  await pausa(200);
  conf('a trava de transbordo nos 12 casos (360, 390, 412; 100% e 130%; com e sem teclado)', travas.join(' || '), '');

  secao('6. O texto salvo no celular sai no PDF, pela fila, e chega ao tablet');
  const commitsAntes = pagC.commitsNaRede;
  await digitar(pagC, '#cel-mensagem-texto', DO_CELULAR);
  conf('Salvar', await clicar(pagC, '#cel-mensagem-salvar'), true);
  await esperar('o editor fechou', () => existe(pagC, '#cel-mensagem'), v => v === false, 5000);
  const aviso = await esperar('o aviso do salvar', () => texto(pagC, '#aviso-texto'), v => /salva/.test(v || ''), 5000);
  conf('o aviso diz que salvou, com Desfazer (' + aviso.valor + ')', fmt(aviso.valor) + ' | ' + /Desfazer/.test(fmt(await texto(pagC, '#aviso'))), 'Mensagem do mês de Aluno Mensagem Teste salva. | true');
  await aba(pagC, 'enviar');
  await mesNoCelular(pagC, MES, 'enviar');
  const pdfEnviar = await pdfDoCelular(pagC, 'msg', 'enviar');
  console.log('   PDF (Enviar): ' + pdfEnviar.slice(0, 400));
  conf('(controle) o texto do PDF é legível pela prova: o nome do aluno e "Realizada" aparecem', /Aluno Mensagem Teste/.test(pdfEnviar) && /Realizada/.test(pdfEnviar), true);
  prop('"Enviar o PDF" leva o texto editado no celular, com os acentos', pdfEnviar.indexOf(DO_CELULAR) >= 0 && pdfEnviar.indexOf(INICIAL) < 0, V_PDF);
  const pdfVer = await pdfDoCelular(pagC, 'msg', 'ver');
  prop('"Ver o PDF" leva o mesmo texto', pdfVer.indexOf(DO_CELULAR) >= 0, V_PDF);
  seVeneno(V_PDF);
  const noDisco = await textoNoDisco(pagC, 'msg', MES);
  const naFila = (await fila(pagC)).filter(id => /^resumo:/.test(id));
  prop('o texto ficou no disco do celular, no campo do fechamento, e entrou na fila de registros (' + (naFila.join(', ') || 'nada na fila') + ')',
    noDisco === DO_CELULAR && naFila.join(',') === 'resumo:msg:' + MES, V_SOBE);
  const sC1 = await sincronizar(pagC);
  conf('o celular sincronizou', sC1.erroE === null && sC1.erroR === null, true);
  prop('a fila do celular zerou, e a escrita foi à nuvem', (await filaVazia(pagC)).ok && pagC.commitsNaRede > commitsAntes, V_SOBE);
  await H.abrirApp(pagA, amb.ORIGEM);
  const chegou = await esperar('o tablet recebeu a mensagem do celular', () => textoNoDisco(pagA, 'msg', MES), v => v === DO_CELULAR, 30000);
  prop('o texto do celular chegou ao tablet pelo recebimento (' + chegou.valor + ')', chegou.valor === DO_CELULAR, V_SOBE);
  seVeneno(V_SOBE);
  const pdfTablet = await pagA.evaluate(m => Store.carregar().then(d => {
    const b = PDFGen.gerarFechamento(Core.calcularFechamento(d, 'msg', m), { incluirFolhas: false });
    let s = ''; for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192)); return btoa(s);
  }), MES);
  conf('e o PDF do tablet leva o mesmo texto', textoDoPdf(pdfTablet).indexOf(DO_CELULAR) >= 0, true);

  secao('7. A edição do tablet chega ao celular, com "Editado no tablet hoje às HH:MM"');
  conf('o tablet edita pela janela do feedback', await editarNoTablet(pagA, 'msg', MES, DO_TABLET), true);
  const sA2 = await sincronizar(pagA);
  conf('o tablet sincronizou', sA2.erroE === null, true);
  const regTablet = await pagA.evaluate(id => Store.lerRegistros().then(l => { const r = l.find(x => x.id === id); return r ? { em: r.atualizadoEm, ap: r.aparelho } : null; }), 'resumo:msg:' + MES);
  const apTablet = await pagA.evaluate(() => Store.aparelho());
  conf('(arranjo) o registro do tablet tem o aparelho dele e a hora', !!(regTablet && regTablet.ap === apTablet && regTablet.em), true);
  await sincronizar(pagC);
  conf('o celular recebeu o texto do tablet', (await esperar('chegou ao celular', () => textoNoDisco(pagC, 'msg', MES), v => v === DO_TABLET, 15000)).ok, true);
  await aba(pagC, 'fechamento');
  await mesNoCelular(pagC, MES);
  await clicar(pagC, '#cel-fechamento ' + SEL_MSG);
  await esperar('o editor abriu', () => existe(pagC, '#cel-mensagem-texto'), v => v === true, 5000);
  const origem1 = await esperar('a origem do texto', () => texto(pagC, '#cel-mensagem-origem'), v => !!v, 5000);
  const valor1 = await pagC.evaluate(() => document.querySelector('#cel-mensagem-texto').value);
  conf('o editor abre com o texto do tablet', valor1, DO_TABLET);
  conf('e diz de onde veio, com a hora do registro, e o que acontece se ela salvar (' + origem1.valor + ')', origem1.valor, DO_TABLET_FRASE(regTablet.em));
  await tirarPrint(pagC, '4_editado_no_tablet.png');
  await clicar(pagC, '#cel-mensagem-cancelar');
  conf('Cancelar sem mudar nada fecha e não grava', (await existe(pagC, '#cel-mensagem')) + ' ' + (await fila(pagC)).filter(id => /^resumo:/.test(id)).length, 'false 0');
  /* O que falta no registro é dito, pela mesma função que o editor chama
   * (Core.origemDoTextoDoMes): sem registro, sem a hora e sem o aparelho. */
  const faltas = await pagC.evaluate(() => {
    const f = (reg) => Core.origemDoTextoDoMes(reg, { meuAparelho: 'apX', temTexto: true });
    return [f(null), f({ id: 'r', atualizadoEm: '', aparelho: 'apT' }), f({ id: 'r', atualizadoEm: '2026-10-14T21:02:00.000Z', aparelho: '' }),
      f({ id: 'r', atualizadoEm: '', aparelho: '' })];
  });
  conf('sem o aparelho ou a hora, o editor diz o que falta (' + faltas.join(' | ') + ')', faltas.join(' | '),
    'O registro deste texto não diz o aparelho nem a hora. | Editado no tablet. O registro não diz a hora. | Gravado em 14/10 às ' +
    hhmmDe('2026-10-14T21:02:00.000Z') + '. O registro não diz em que aparelho. | O registro deste texto não diz o aparelho nem a hora.');
  conf('(controle) a função que o editor chama é essa', APP.indexOf('Core.origemDoTextoDoMes(reg,') >= 0, true);

  secao('8. Os dois lados editam o mesmo mês: vale a escrita mais recente, nos dois sentidos');
  /* 8o. O ônibus: sem sinal, ela escreve no celular; depois o tablet corrige e
   * sobe; por fim o celular pega sinal. Vence a do tablet, escrita depois,
   * mesmo chegando antes; a do celular vai para o histórico, e o editor diz. */
  const histAntes = await pagC.evaluate(() => Store.listarHistorico().then(l => l.filter(h => /Antes de receber do outro aparelho/.test(h.rotulo)).length));
  await pagC.setOfflineMode(true);
  await clicar(pagC, '#cel-fechamento ' + SEL_MSG);
  await esperar('o editor abriu', () => existe(pagC, '#cel-mensagem-texto'), v => v === true, 5000);
  await digitar(pagC, '#cel-mensagem-texto', ONIBUS_C);
  await clicar(pagC, '#cel-mensagem-salvar');
  await esperar('o celular gravou sem sinal', () => textoNoDisco(pagC, 'msg', MES), v => v === ONIBUS_C, 5000);
  conf('8o: (arranjo) sem sinal, a edição do celular espera na fila', (await fila(pagC)).filter(id => /^resumo:/.test(id)).join(','), 'resumo:msg:' + MES);
  await pausa(1500);
  conf('8o: o tablet corrige depois e sobe', await editarNoTablet(pagA, 'msg', MES, ONIBUS_T), true);
  await sincronizar(pagA);
  const horaTablet = await pagA.evaluate(id => Store.lerRegistros().then(l => (l.find(r => r.id === id) || {}).atualizadoEm), 'resumo:msg:' + MES);
  await pagC.setOfflineMode(false);
  await pausa(500);
  await sincronizar(pagC);
  await pausa(3000);
  await sincronizar(pagC);
  await sincronizar(pagA);
  const fimO = { tablet: await textoNoDisco(pagA, 'msg', MES), celular: await textoNoDisco(pagC, 'msg', MES) };
  console.log('   8o: ' + JSON.stringify(fimO));
  prop('8o: o celular escreveu sem sinal ANTES da correção do tablet: os dois ficam com a do tablet, a mais recente', fimO.tablet === ONIBUS_T && fimO.celular === ONIBUS_T, V_CHEGA);
  seVeneno(V_CHEGA);
  conf('8o: a fila do celular não guarda mais a versão que perdeu', (await fila(pagC)).filter(id => /^resumo:/.test(id)).length, 0);
  conf('8o: a versão do celular que perdeu está no histórico', (await pagC.evaluate(() => Store.listarHistorico().then(l => l.filter(h => /Antes de receber do outro aparelho/.test(h.rotulo)).length))) > histAntes, true);
  await clicar(pagC, '#cel-fechamento ' + SEL_MSG);
  await esperar('o editor abriu', () => existe(pagC, '#cel-mensagem-texto'), v => v === true, 5000);
  const origemO = await esperar('a origem do texto', () => texto(pagC, '#cel-mensagem-origem'), v => !!v, 5000);
  conf('8o: ao abrir, o editor diz que o tablet editou depois dela (' + origemO.valor + ')',
    new RegExp('^O tablet editou este texto depois de você, hoje às ' + hhmmDe(horaTablet) + '\\. A sua versão, hoje às \\d\\d:\\d\\d, está logo abaixo, em "Ver a versão que ficou de fora"\\.$').test(origemO.valor || ''), true);
  /* A versão que perdeu está no próprio item, à vista: um toque mostra, outro a usa. */
  conf('8o: o item guarda a versão do celular que ficou de fora, com o aparelho e a hora', await pagC.evaluate(m => Store.carregar().then(d => {
    const r = d.resumos.find(x => x.alunoId === 'msg' && x.mes === m); const v = r.versaoDeFora || {};
    return v.texto + ' | ' + (v.aparelho === Store.aparelho()) + ' | ' + !!v.em; }), MES), ONIBUS_C + ' | true | true');
  await clicar(pagC, '#versao-de-fora-ver');
  await tirarPrint(pagC, '6_tablet_editou_depois.png');
  conf('8o: "Ver a versão que ficou de fora" mostra o texto dela, com de onde e quando',
    (await texto(pagC, '#versao-de-fora-texto')) + ' | ' + /^Deste celular, hoje às \d\d:\d\d:$/.test(await pagC.evaluate(() => document.querySelector('#versao-de-fora-painel .ajuda').textContent)), ONIBUS_C + ' | true');
  conf('8o: a trava de transbordo com a versão de fora aberta', (await transbordoDoEditor(pagC)).join('; '), '');
  await clicar(pagC, '#versao-de-fora-usar');
  conf('8o: "Usar esta" põe a versão dela no campo (ela ainda decide se salva)', await pagC.evaluate(() => document.querySelector('#cel-mensagem-texto').value), ONIBUS_C);
  await clicar(pagC, '#cel-mensagem-cancelar');
  await pagC.evaluate(m => localStorage.removeItem('rascunho-mensagem-mes:msg:' + m), MES);
  conf('8o: (arranjo) cancelar não gravou: o texto é o do tablet', await textoNoDisco(pagC, 'msg', MES), ONIBUS_T);
  await sincronizar(pagC);
  await sincronizar(pagA);
  conf('8o: a versão de fora chegou também ao tablet, no mesmo item', await pagA.evaluate(m => Store.carregar().then(d => ((d.resumos.find(x => x.alunoId === 'msg' && x.mes === m) || {}).versaoDeFora || {}).texto), MES), ONIBUS_C);
  await clicar(pagC, '#cel-fechamento ' + SEL_MSG);
  await esperar('o editor abriu', () => existe(pagC, '#cel-mensagem-texto'), v => v === true, 5000);
  /* O texto do tablet chega com o editor aberto: o Salvar pergunta antes de
   * passar por cima; com o "não", nada muda e o editor fica. */
  conf('8e: (arranjo) o tablet manda outra com o editor do celular aberto', await editarNoTablet(pagA, 'msg', MES, ABERTO_T), true);
  await sincronizar(pagA);
  await sincronizar(pagC);
  conf('8e: (arranjo) chegou ao disco do celular, com o editor ainda aberto', (await textoNoDisco(pagC, 'msg', MES)) + ' ' + (await existe(pagC, '#cel-mensagem')), ABERTO_T + ' true');
  await digitar(pagC, '#cel-mensagem-texto', ABERTO_C);
  const dlgE = pagC.dialogos.length;
  pagC.recusar = true;
  await clicar(pagC, '#cel-mensagem-salvar');
  await pausa(300);
  pagC.recusar = false;
  conf('8e: o Salvar avisa antes de passar por cima, e o "não" deixa o editor e o texto do tablet',
    pagC.dialogos.slice(dlgE).join(' ; ') + ' | ' + (await existe(pagC, '#cel-mensagem')) + ' | ' + (await textoNoDisco(pagC, 'msg', MES)),
    'Chegou uma versão nova do tablet enquanto você escrevia. Salvar a sua por cima? A do tablet fica guardada no histórico. | true | ' + ABERTO_T);
  await clicar(pagC, '#cel-mensagem-salvar');
  conf('8e: com o "sim", a dela fica', (await esperar('gravou', () => textoNoDisco(pagC, 'msg', MES), v => v === ABERTO_C, 5000)).valor, ABERTO_C);
  await sincronizar(pagC);
  await sincronizar(pagA);
  /* 8a. O tablet grava e sobe primeiro; o celular, sem receber, grava depois:
   * a edição do celular, ainda na fila, vence o que chega. */
  conf('8a: o tablet grava a primeira', await editarNoTablet(pagA, 'msg', MES, T1), true);
  await sincronizar(pagA);
  await clicar(pagC, '#cel-fechamento ' + SEL_MSG);
  await esperar('o editor abriu', () => existe(pagC, '#cel-mensagem-texto'), v => v === true, 5000);
  await digitar(pagC, '#cel-mensagem-texto', C1);
  await clicar(pagC, '#cel-mensagem-salvar');
  await esperar('o celular gravou', () => textoNoDisco(pagC, 'msg', MES), v => v === C1, 5000);
  await sincronizar(pagC);
  await pausa(3000); // o envio automático do celular, se a precondição mandou receber antes
  await sincronizar(pagC);
  await sincronizar(pagA);
  const fim8a = { tablet: await textoNoDisco(pagA, 'msg', MES), celular: await textoNoDisco(pagC, 'msg', MES) };
  console.log('   8a: ' + JSON.stringify(fim8a));
  prop('8a: o tablet gravou antes e o celular depois: os dois ficam com a do celular', fim8a.tablet === C1 && fim8a.celular === C1, V_PRIMEIRO);
  /* 8b. O celular grava e sobe primeiro; o tablet, sem receber, grava depois. */
  await clicar(pagC, '#cel-fechamento ' + SEL_MSG);
  await esperar('o editor abriu', () => existe(pagC, '#cel-mensagem-texto'), v => v === true, 5000);
  await digitar(pagC, '#cel-mensagem-texto', C2);
  await clicar(pagC, '#cel-mensagem-salvar');
  await esperar('o celular gravou', () => textoNoDisco(pagC, 'msg', MES), v => v === C2, 5000);
  await sincronizar(pagC);
  conf('8b: (arranjo) a fila do celular zerou', (await filaVazia(pagC)).ok, true);
  conf('8b: o tablet, sem receber, grava depois', await editarNoTablet(pagA, 'msg', MES, T2), true);
  await sincronizar(pagA);
  await pausa(3000);
  await sincronizar(pagA);
  await sincronizar(pagC);
  const fim8b = { tablet: await textoNoDisco(pagA, 'msg', MES), celular: await textoNoDisco(pagC, 'msg', MES) };
  console.log('   8b: ' + JSON.stringify(fim8b));
  prop('8b: o celular gravou antes e o tablet depois: os dois ficam com a do tablet', fim8b.tablet === T2 && fim8b.celular === T2, V_PRIMEIRO);
  seVeneno(V_PRIMEIRO);
  const perdeu = await pagC.evaluate(() => Store.listarHistorico().then(l => l.filter(h => /Antes de receber do outro aparelho/.test(h.rotulo)).length));
  conf('a versão que perdeu no celular não sumiu calada: está no histórico', perdeu >= 1, true);
  /* 8b deixou no item a versão do celular (C2) que perdeu no tablet: a janela
   * do feedback do tablet a oferece, com o mesmo bloco do celular. */
  await mesNoTablet(pagA, MES);
  await pagA.evaluate(() => { const l = document.querySelector('#lista-fechamento .linha-pagamento[data-aluno="msg"]');
    Array.from(l.closest('.cartao').querySelectorAll('button')).find(x => /feedback/i.test(x.textContent)).click(); });
  await esperar('a janela do feedback abriu', () => existe(pagA, '#modal-resumo.aberto #campo-resumo'), v => v === true, 5000);
  await clicar(pagA, '#modal-resumo #versao-de-fora-ver');
  conf('8b: o tablet oferece "Ver a versão que ficou de fora", com a do celular', (await texto(pagA, '#modal-resumo #versao-de-fora-texto')) + ' | ' +
    /^Do celular, hoje às \d\d:\d\d:$/.test(await pagA.evaluate(() => (document.querySelector('#modal-resumo #versao-de-fora-painel .ajuda') || {}).textContent || '')), C2 + ' | true');
  await clicar(pagA, '#modal-resumo #versao-de-fora-usar');
  conf('8b: "Usar esta" no tablet põe a do celular no campo', await pagA.evaluate(() => document.querySelector('#campo-resumo').value), C2);
  await clicar(pagA, '#modal-resumo .modal-rodape [data-fechar]');
  await pausa(300);
  conf('8b: (arranjo) fechar sem salvar não mudou nada no tablet', await textoNoDisco(pagA, 'msg', MES), T2);

  /* K4 (lente B): um texto NOVO do mês, que nenhum aparelho tem ainda. O
   * celular, sem sinal, escreve antes; o tablet escreve depois e sobe; o
   * celular volta e só ENVIA, sem receber antes (o envio do pagehide). Sem
   * carimbo conhecido, o envio leva a precondição "não existe", falha, recebe,
   * e vence a escrita mais recente, a do tablet. */
  const K4_C = 'K4: escrito no celular sem sinal, antes.';
  const K4_T = 'K4: escrito no tablet depois, e subiu primeiro.';
  conf('K4: (arranjo) o aluno Quatro não tem mensagem no mês, em nenhum aparelho', (await textoNoDisco(pagC, 'k4', MES)) + '|' + (await textoNoDisco(pagA, 'k4', MES)), '|');
  /* Sem sinal para a nuvem: os pedidos ao emulador caem, e o aparelho não
   * recebe o aviso de "online" ao voltar (que dispararia a sincronização,
   * recebendo antes). Assim o caminho da volta é o do envio só. */
  const cortaNuvem = r => { const u = r.url(); if (u.indexOf(FS) === 0 || u.indexOf(AUTH) === 0) r.abort('internetdisconnected'); else r.continue(); };
  await pagC.setRequestInterception(true);
  pagC.on('request', cortaNuvem);
  await clicar(pagC, '#cel-fechamento .cel-editar-mensagem[data-aluno="k4"]');
  await esperar('o editor abriu', () => existe(pagC, '#cel-mensagem-texto'), v => v === true, 6000);
  await digitar(pagC, '#cel-mensagem-texto', K4_C);
  await clicar(pagC, '#cel-mensagem-salvar');
  await esperar('o celular gravou sem sinal', () => textoNoDisco(pagC, 'k4', MES), v => v === K4_C, 5000);
  const semCarimbo = await pagC.evaluate(id => Store.lerRegistros().then(l => { const r = l.find(x => x.id === id); return r ? !(r.nuvem && r.nuvem.updateTime) : 'sem registro'; }), 'resumo:k4:' + MES);
  conf('K4: (arranjo) o registro do celular não tem carimbo da nuvem', semCarimbo, true);
  await pausa(3500); // o envio automático do celular tenta e cai, sem rede
  conf('K4: o tablet escreve depois e sobe', await editarNoTablet(pagA, 'k4', MES, K4_T), true);
  await sincronizar(pagA);
  pagC.off('request', cortaNuvem);
  await pagC.setRequestInterception(false);
  conf('K4: (arranjo) a edição do celular ainda espera na fila', (await fila(pagC)).filter(id => /^resumo:k4/.test(id)).join(','), 'resumo:k4:' + MES);
  const soEnvio = await pagC.evaluate(() => Nuvem.enviarRegistros({ versaoApp: 'prova' }).then(r => ({ enviados: r.enviados, erro: r.erro ? r.erro.codigo : null })));
  console.log('   K4: o celular só enviou: ' + JSON.stringify(soEnvio));
  await pausa(3000);
  for (let i = 0; i < 2; i++) { await sincronizar(pagC); await sincronizar(pagA); }
  const fimK4 = { tablet: await textoNoDisco(pagA, 'k4', MES), celular: await textoNoDisco(pagC, 'k4', MES) };
  console.log('   K4: ' + JSON.stringify(fimK4));
  prop('K4: o texto novo escrito antes, sem sinal, não cobre o do tablet escrito depois: os dois ficam com o do tablet',
    fimK4.tablet === K4_T && fimK4.celular === K4_T, V_SEMPRE);
  seVeneno(V_SEMPRE);
  conf('K4: a fila não prende: o envio não terminou em erro e a fila do celular zerou', (soEnvio.erro || 'sem erro') + ' ' + (await filaVazia(pagC)).ok, 'sem erro true');
  conf('K4: a versão do celular ficou de fora, no item, nos dois aparelhos',
    await pagC.evaluate(m => Store.carregar().then(d => ((d.resumos.find(x => x.alunoId === 'k4' && x.mes === m) || {}).versaoDeFora || {}).texto), MES) + ' | ' +
    await pagA.evaluate(m => Store.carregar().then(d => ((d.resumos.find(x => x.alunoId === 'k4' && x.mes === m) || {}).versaoDeFora || {}).texto), MES), K4_C + ' | ' + K4_C);

  secao('9. O observador de outra conta não vê nem edita a mensagem');
  const ctxD = await pagA.browser().createBrowserContext();
  const pagD = await ctxD.newPage();
  await prepararPagina(pagD, true);
  await abrirCelular(pagD);
  conf('o observador entrou com a conta dele', await entrarNoCelular(pagD, OBS), true);
  conf('trouxe a cópia da dona pelo código da conta dela', await trazerCopiaNoCelular(pagD, dona.localId), true);
  await pagD.evaluate(() => Nuvem.receberRegistros());
  await aba(pagD, 'fechamento');
  await mesNoCelular(pagD, MES);
  const vistoD = await pagD.evaluate(() => document.querySelectorAll('.cel-editar-mensagem, #cel-mensagem, #cel-mensagem-texto').length);
  m = await medirTela(pagD);
  prop('o observador, no Fechamento: nenhum "Editar a mensagem do mês" nem editor (' + vistoD + ' ; ' + m.acoes + ' ações)', vistoD === 0 && m.acoes === 0 && m.soltos.length === 0, V_OBS);
  await tirarPrint(pagD, '5_observador.png');
  await aba(pagD, 'enviar');
  await mesNoCelular(pagD, MES, 'enviar');
  const vistoD2 = await pagD.evaluate(() => document.querySelectorAll('.cel-editar-mensagem, #cel-mensagem').length);
  prop('o observador, no Enviar: nenhum botão de editar a mensagem (' + vistoD2 + ')', vistoD2 === 0, V_OBS);
  seVeneno(V_OBS);
  conf('o observador vê o texto da dona (a última, a do tablet)', await textoNoDisco(pagD, 'msg', MES), T2);
  conf('o observador, o Fechamento: alvos de 48 px e sem rolagem de lado', telaBoa(m), '');
  await pausa(2500);
  conf('nenhuma escrita na nuvem saiu do observador', pagD.commitsNaRede, 0);

  secao('10. Sair sem salvar deixa um rascunho neste aparelho, que volta ao reabrir');
  await aba(pagC, 'fechamento');
  await mesNoCelular(pagC, MES);
  await clicar(pagC, '#cel-fechamento .cel-editar-mensagem[data-aluno="rasc"]');
  await esperar('o editor abriu', () => existe(pagC, '#cel-mensagem-texto'), v => v === true, 5000);
  conf('(arranjo) o Rascunho começa sem mensagem', await pagC.evaluate(() => document.querySelector('#cel-mensagem-texto').value), '');
  await digitar(pagC, '#cel-mensagem-texto', RASCUNHO);
  /* Ela sai sem salvar: o aplicativo é fechado e aberto de novo. */
  await abrirCelular(pagC);
  await aba(pagC, 'fechamento');
  await mesNoCelular(pagC, MES);
  conf('(arranjo) nada foi gravado no banco nem na fila', (await textoNoDisco(pagC, 'rasc', MES)) + '|' + (await fila(pagC)).filter(id => /^resumo:rasc/.test(id)).length, '|0');
  await clicar(pagC, '#cel-fechamento .cel-editar-mensagem[data-aluno="rasc"]');
  await esperar('o editor abriu', () => existe(pagC, '#cel-mensagem-texto'), v => v === true, 5000);
  const voltou = await pagC.evaluate(() => ({ valor: document.querySelector('#cel-mensagem-texto').value, faixa: (document.querySelector('#cel-mensagem-rascunho') || {}).textContent || '' }));
  console.log('   ' + JSON.stringify(voltou));
  conf('ao reabrir, o rascunho volta ao texto e a faixa diz que não foi salvo', voltou.valor === RASCUNHO && /^Rascunho recuperado, de hoje às \d\d:\d\d\. Ainda não foi salvo\./.test(voltou.faixa), true);
  conf('a trava de transbordo com a faixa do rascunho', (await transbordoDoEditor(pagC)).join('; '), '');
  await clicar(pagC, '#cel-mensagem-cancelar');
  conf('Cancelar com texto mudado avisa que o rascunho ficou', fmt(await texto(pagC, '#aviso-texto')), 'A mensagem não foi salva. O rascunho ficou neste aparelho.');
  await clicar(pagC, '#cel-fechamento .cel-editar-mensagem[data-aluno="rasc"]');
  await esperar('o editor abriu', () => existe(pagC, '#cel-mensagem-texto'), v => v === true, 5000);
  await clicar(pagC, '#cel-mensagem-descartar');
  conf('"Descartar o rascunho" volta ao texto salvo e apaga o rascunho',
    (await pagC.evaluate(() => document.querySelector('#cel-mensagem-texto').value)) + '|' + (await pagC.evaluate(() => localStorage.getItem('rascunho-mensagem-mes:rasc:2026-10'))), '|null');
  await clicar(pagC, '#cel-mensagem-cancelar');

  secao('11. Junho, o fechamento de referência, continua igual quando o texto não muda');
  conf('(arranjo) o celular vai a junho de 2026', await mesNoCelular(pagC, '2026-06'), true);
  const cartaoAntes = fmt(await texto(pagC, '.cel-fechamento-aluno[data-aluno="ref"] .ajuda'));
  await clicar(pagC, '#cel-fechamento .cel-editar-mensagem[data-aluno="ref"]');
  await esperar('o editor abriu', () => existe(pagC, '#cel-mensagem-texto'), v => v === true, 5000);
  conf('o editor de junho abre com o texto de junho e as contas de junho',
    (await pagC.evaluate(() => document.querySelector('#cel-mensagem-texto').value)) + ' | ' + fmt(await texto(pagC, '#cel-mensagem-contas')), JUNHO + ' | 10 aulas dadas · 10:30 h · R$ 1.050,00');
  const commitsJ = pagC.commitsNaRede;
  await clicar(pagC, '#cel-mensagem-salvar');
  conf('Salvar sem mudar o texto diz que nada mudou', fmt(await texto(pagC, '#aviso-texto')), 'A mensagem já estava assim. Nada mudou.');
  await pausa(3000);
  conf('e não grava: nada na fila, nada na nuvem', (await fila(pagC)).filter(id => /^resumo:/.test(id)).length + ' ' + (pagC.commitsNaRede - commitsJ), '0 0');
  const dadoJ = await pagC.evaluate(() => Store.carregar().then(d => { const f = Core.calcularMesInteiro(d, '2026-06').find(x => x.aluno.id === 'ref');
    return { linhas: f.linhas.length, horas: Core.fmtHoras(f.totalMin), total: Core.fmtMoeda(f.totalValor) }; }));
  const cartaoJ = fmt(await texto(pagC, '.cel-fechamento-aluno[data-aluno="ref"] .ajuda'));
  conf('junho: 10 encontros, 10:30, R$ 1.050,00, e o cartão igual ao de antes (' + JSON.stringify(dadoJ) + ' ; ' + cartaoJ + ')',
    JSON.stringify(dadoJ) === JSON.stringify(REF_JUNHO) && cartaoJ === '10 aulas dadas · 10:30 h · R$ 1.050,00' && cartaoJ === cartaoAntes, true);
  await aba(pagC, 'enviar');
  await mesNoCelular(pagC, '2026-06', 'enviar');
  const pdfJ = await pdfDoCelular(pagC, 'ref', 'enviar');
  conf('o PDF de junho: o texto de junho, 10:30 e R$ 1.050,00', [pdfJ.indexOf(JUNHO) >= 0, /10:30/.test(pdfJ), /1\.050,00/.test(pdfJ)].join(','), 'true,true,true');

  secao('13. A volta de versão: o tablet com o código da 1.42.18 (main 94fa74b) e o celular com esta');
  /* O que já existe nela não muda de forma: o texto continua em db.resumos, o
   * registro continua `resumo:<aluno>:<mês>` com { alunoId, mes, texto }, e o
   * store.js e o nuvem.js desta versão são os da 1.42.18. Aqui o tablet volta
   * de verdade ao app.js, core.js e styles.css de 94fa74b, sem service worker
   * no meio, e os dois lados trocam o texto. */
  const BASE = '94fa74b';
  const antigo = f => spawnSync('git', ['show', BASE + ':' + f], { cwd: H.RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).stdout || '';
  /* O sw.js muda a cada versão só no comentário e no nome do CACHE: fora isso,
   * o código dele tem de ser o da 1.42.18. */
  /* Arquivo NOVO na lista ARQUIVOS (um asset que o aplicativo passa a servir) não muda o código do
   * worker nem a volta de versão: o indice-livros.js (B12) é conhecido e sai da comparação. */
  const swNucleo = s => s.replace(/\r\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, '').replace(/var CACHE = '[^']*';/, '').replace(/\s*'\.\/indice-livros\.js',/, '').replace(/\s+/g, ' ');
  const iguais = ['sw.js'].map(f => swNucleo(antigo(f)) === swNucleo(fs.readFileSync(path.join(H.RAIZ, f), 'utf8')));
  conf('o sw.js desta versão é o da 1.42.18, fora o comentário e o nome do CACHE', iguais.join(','), 'true');
  const regCel = await pagC.evaluate(id => Store.lerRegistros().then(l => { const r = l.find(x => x.id === id);
    return r ? { forma: r.tipo + ' ' + Object.keys(r.dados || {}).sort().join(','), fora: r.dados && r.dados.versaoDeFora ? JSON.stringify(r.dados.versaoDeFora) : '' } : null; }), 'resumo:msg:' + MES);
  conf('o registro do celular tem a forma de sempre, mais a versão que ficou de fora (' + regCel.forma + ')', regCel.forma + ' ' + !!regCel.fora, 'resumo alunoId,mes,texto,versaoDeFora true');
  const VOLTA_C = 'Do celular novo para o tablet antigo: tabuada em dia.';
  const VOLTA_T = 'Do tablet antigo para o celular novo: leitura em dia.';
  /* Com o tablet ainda nesta versão, o celular edita e sobe. */
  await aba(pagC, 'fechamento');
  await mesNoCelular(pagC, MES);
  await clicar(pagC, '#cel-fechamento ' + SEL_MSG);
  await esperar('o editor abriu', () => existe(pagC, '#cel-mensagem-texto'), v => v === true, 5000);
  await digitar(pagC, '#cel-mensagem-texto', VOLTA_C);
  await clicar(pagC, '#cel-mensagem-salvar');
  await esperar('o celular gravou', () => textoNoDisco(pagC, 'msg', MES), v => v === VOLTA_C, 5000);
  await sincronizar(pagC);
  // o store.js e o nuvem.js também: a regra nova do resumo é só desta versão, e o tablet que voltou não a tem
  ['app.js', 'core.js', 'styles.css', 'store.js', 'nuvem.js'].forEach(f => { trocas['/' + f] = antigo(f); });
  conf('(arranjo) o código da 1.42.18 foi lido do git', ['app.js', 'core.js', 'styles.css', 'store.js', 'nuvem.js'].every(f => trocas['/' + f].length > 1000) && /var VERSAO = '1\.42\.18'/.test(trocas['/app.js']), true);
  /* O diagnóstico sobe no máximo uma vez por hora: a anotação da última subida
   * é apagada antes de o tablet voltar de versão, como se a hora tivesse
   * passado, para o resumo do tablet antigo subir ao abrir. */
  await pagA.evaluate(async () => {
    const regs = navigator.serviceWorker ? await navigator.serviceWorker.getRegistrations() : [];
    await Promise.all(regs.map(r => r.unregister()));
    if (window.caches) await Promise.all((await caches.keys()).map(k => caches.delete(k)));
    await new Promise(r => { const q = indexedDB.open('apoio-nuvem'); q.onsuccess = () => { const t = q.result.transaction('estado', 'readwrite'); t.objectStore('estado').delete('diagnostico'); t.oncomplete = () => { q.result.close(); r(); }; }; });
  });
  await H.abrirApp(pagA, amb.ORIGEM);
  conf('o tablet está na 1.42.18 (sem a função nova do core)', await pagA.evaluate(() => typeof Core.gravarTextoDoMes + ' ' + typeof Core.calcularFechamento), 'undefined function');
  await sincronizar(pagA);
  conf('(arranjo) o tablet antigo recebeu o texto do celular', (await esperar('chegou ao tablet antigo', () => textoNoDisco(pagA, 'msg', MES), v => v === VOLTA_C, 15000)).valor, VOLTA_C);
  const noAntigo = await pagA.evaluate(m => Store.carregar().then(d => {
    const f = Core.calcularFechamento(d, 'msg', m);
    const b = PDFGen.gerarFechamento(f, { incluirFolhas: false });
    let s = ''; for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192));
    return { texto: f.resumoTexto, pdf: btoa(s) };
  }), MES);
  conf('o tablet da 1.42.18 recebe o texto do celular e o leva ao fechamento e ao PDF (sem a versão de fora no PDF)',
    noAntigo.texto + ' | ' + (textoDoPdf(noAntigo.pdf).indexOf(VOLTA_C) >= 0) + ' | ' + (textoDoPdf(noAntigo.pdf).indexOf(JSON.parse(regCel.fora).texto) >= 0), VOLTA_C + ' | true | false');
  conf('o tablet da 1.42.18 edita pela janela de sempre', await editarNoTablet(pagA, 'msg', MES, VOLTA_T), true);
  await sincronizar(pagA);
  await pausa(3000);
  await sincronizar(pagA);
  const diagTablet = await esperar('o diagnóstico do tablet antigo subiu', () => pagC.evaluate(() => Nuvem.listarDiagnosticos().then(l => (l.find(d => d.papel === 'tablet') || {}).app || '')), v => v === '1.42.18', 15000);
  conf('(arranjo) o diagnóstico do tablet na nuvem diz 1.42.18', diagTablet.valor, '1.42.18');
  await sincronizar(pagC);
  conf('e o celular desta versão recebe o texto do tablet antigo', (await esperar('chegou ao celular', () => textoNoDisco(pagC, 'msg', MES), v => v === VOLTA_T, 15000)).valor, VOLTA_T);
  const foraDepois = await pagC.evaluate(m => Store.carregar().then(d => { const r = (d.resumos || []).find(x => x.alunoId === 'msg' && x.mes === m); return r && r.versaoDeFora ? JSON.stringify(r.versaoDeFora) : ''; }), MES);
  conf('a 1.42.18 carregou a versão que ficou de fora sem ler e sem perder: ela volta igual ao celular', foraDepois, regCel.fora);
  /* K6: com o tablet ainda na 1.42.18, o celular não edita a mensagem. */
  const avisoK6Antes = pagC.dialogos.length;
  await clicar(pagC, '#cel-fechamento ' + SEL_MSG);
  const avisoK6 = await esperar('o aviso de atualizar o tablet', () => texto(pagC, '#aviso-texto'), v => /Atualize o tablet/.test(v || ''), 8000);
  prop('K6: com o tablet na 1.42.18, o celular não abre o editor e diz o que fazer (' + avisoK6.valor + ')',
    fmt(avisoK6.valor) === 'Atualize o tablet antes de editar a mensagem pelo celular. Ele está na versão 1.42.18, e esta é a ' + VERSAO_SERVIDA + '.' &&
    !(await existe(pagC, '#cel-mensagem')) && pagC.dialogos.length === avisoK6Antes, V_K6);
  seVeneno(V_K6);
  conf('junho, já fechado, não mudou em lugar nenhum: o mesmo texto no tablet antigo e no celular',
    (await textoNoDisco(pagA, 'ref', '2026-06')) + ' | ' + (await textoNoDisco(pagC, 'ref', '2026-06')), JUNHO + ' | ' + JUNHO);

  secao('14. Sem erro de página, e o veneno pedido foi visto');
  conf('nenhum erro de página no tablet, no celular e no observador', [pagA, pagC, pagD].map(p => p.errosDePagina.join(' | ')).filter(Boolean).join(' || '), '');
  if (MODO) conf('o veneno ' + MODO + ' foi visto antes do fim', false, true);
  await ctxD.close();
  await ctxC.close();
})().then(() => derrubarEmulador().then(H.fim(amb)), e => derrubarEmulador().then(() => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e))));
