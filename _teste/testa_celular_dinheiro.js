/* testa_celular_dinheiro.js
 *
 * D6c, lote 3: dinheiro de relance. Contra o Firebase Emulator Suite (Auth e
 * Firestore), com um tablet (1280 px), o celular da dona (390 x 844) e um
 * observador de outra conta (390 x 844). Alunos e valores fictícios.
 *
 * O que prova:
 *   1. o selo de cada família no Fechamento do celular (pago, parcial, em
 *      aberto) é o MESMO do Fechamento do tablet, que lê a mesma conta
 *      (Core.seloDoPagamento), e o que se espera à mão;
 *   2. o total a receber do celular é o número grande do tablet, ao
 *      centavo, e o que se espera à mão; o "em aberto" é a soma do que falta;
 *   3. a cancelada sem cobrança não entra no valor; a cancelada e cobrada
 *      entra, pelo valor por hora da data dela;
 *   4. os dois cancelamentos têm nomes que não se confundem, na folha da
 *      aula, no bloco da agenda e nas linhas do Fechamento; "com aviso" não
 *      aparece no celular;
 *   5. "Pago" em dois toques: "Marcar como pago" abre com o valor das aulas
 *      JÁ DADAS (as não dadas à parte) e a data de hoje, e "Confirmar" grava;
 *      o selo e o total se redesenham;
 *   6. o "Pago" do celular sobe pela fila de registros e chega ao tablet, que
 *      passa a mostrar o mesmo selo;
 *   7. o fechamento de referência de junho continua 10 encontros, 10:30 e
 *      R$ 1.050,00, com o selo, o total e o proposto iguais aos do tablet,
 *      mesmo com o valor por hora reajustado depois de junho;
 *   8. o observador vê o selo e o total, sem marcar pago, e nada sobe dele;
 *   9. em 390 x 844: alvos de 48 px e sem rolagem de lado.
 *
 * Venenos, que TÊM de reprovar a propriedade:
 *   --envenenado-selo-pelo-mes      o selo do celular cobra o mês inteiro;
 *   --envenenado-parcial-vira-pago  o selo do celular chama de pago o parcial;
 *   --envenenado-aberto-vira-nada   o selo do celular chama o em aberto de nada a cobrar;
 *   --envenenado-total-do-mes       o total a receber soma o mês inteiro;
 *   --envenenado-proposto-do-mes    o "Valor pago" vem com o mês inteiro (a regra de antes);
 *   --envenenado-cancelada-cobra    a cancelada sem cobrança entra no valor (core.js);
 *   --envenenado-nome-antigo        a cancelada sem cobrança volta a se chamar "Cancelada com aviso";
 *   --envenenado-pago-fora-da-acao  o "Pago" grava fora da ação do celular e não sobe;
 *   --envenenado-preco-de-hoje      o valor da aula sai do valor por hora de hoje (core.js);
 *   --envenenado-observador-paga    o observador ganha o "Marcar como pago";
 *   (revisão do lote 3)
 *   --envenenado-sem-cancelada-a-frente  o proposto esquece a cancelada e cobrada à frente;
 *   --envenenado-tira-hoje-do-proposto   o proposto tira a aula de hoje que ainda não acabou (o selo fica Parcial);
 *   --envenenado-falta-e-o-total         o número grande volta a ser o total, e não o que falta;
 *   --envenenado-sem-meses-anteriores    os meses anteriores em aberto somem;
 *   --envenenado-cancela-sem-confirmar   cancelar a aula dada tira o valor sem perguntar;
 *   --envenenado-sem-redesenho           pagar ou desmarcar não redesenha o selo e o total.
 *
 * O relógio da página fica fixo em 15/10/2026 18:00 (a prova não depende do
 * dia em que roda).
 *
 *   --prints <pasta>   os três prints do lote 3, em 390 x 844.
 *
 * Portas: 8921 (app), 8923 (auth), 8924 (firestore), 8925 (hub), 8926 (log),
 * 8927 (websocket). Precisa do firebase-tools e de um JDK 21 em JAVA_HOME.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const MODOS = ['--envenenado-selo-pelo-mes', '--envenenado-parcial-vira-pago', '--envenenado-aberto-vira-nada', '--envenenado-total-do-mes',
  '--envenenado-proposto-do-mes', '--envenenado-cancelada-cobra', '--envenenado-nome-antigo', '--envenenado-pago-fora-da-acao',
  '--envenenado-preco-de-hoje', '--envenenado-observador-paga',
  '--envenenado-sem-cancelada-a-frente', '--envenenado-tira-hoje-do-proposto', '--envenenado-falta-e-o-total', '--envenenado-sem-meses-anteriores',
  '--envenenado-cancela-sem-confirmar', '--envenenado-sem-redesenho'];
const [V_SELO_MES, V_PARCIAL, V_ABERTO, V_TOTAL, V_PROPOSTO, V_CANCELA, V_NOME, V_FORA, V_PRECO, V_OBS,
  V_FRENTE, V_HOJE, V_FALTA, V_ANTERIORES, V_CONFIRMA, V_REDESENHO] = MODOS;
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

const PORTA_APP = 8921, PORTA_AUTH = 8923, PORTA_FS = 8924, PORTA_HUB = 8925, PORTA_LOG = 8926, PORTA_WS = 8927;
const PROJETO = 'demo-nath-d6c3';
const AUTH = 'http://127.0.0.1:' + PORTA_AUTH;
const FS = 'http://127.0.0.1:' + PORTA_FS;
const FIREBASE = process.env.FIREBASE_TOOLS ||
  'C:/Users/romul/ferramentas/firebase-tools/node_modules/firebase-tools/lib/bin/firebase.js';
const JAVA_HOME = process.env.JAVA_HOME || '';
const DONA = { email: 'dona@exemplo.test', senha: 'senha-da-dona-1' };
const OBS = { email: 'observador@exemplo.test', senha: 'senha-do-observador-1' };

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const CORE = fs.readFileSync(path.join(H.RAIZ, 'core.js'), 'utf8');
const CSS = fs.readFileSync(path.join(H.RAIZ, 'styles.css'), 'utf8');
const REGRAS = fs.readFileSync(path.join(H.RAIZ, 'firestore.rules'), 'utf8');

secao('0. As âncoras dos venenos e o ambiente');
conf('nenhum --envenenado- desconhecido foi pedido (' + (desconhecidos.join(' ') || 'nenhum') + ')', desconhecidos.length, 0);
const SELO_TEXTO = "    var texto = SELOS_DO_PAGAMENTO[s.selo] || '';";
const ANCORAS = {
  [V_SELO_MES]: ['app.js', 'var selos = fechs.map(function (f) { return Core.seloDoPagamento(db, f); });',
    'var selos = fechs.map(function (f) { return Core.seloDoPagamento(db, Object.assign({}, f, { linhas: [] })); });'],
  [V_PARCIAL]: ['app.js', SELO_TEXTO, "    s = Object.assign({}, s, { selo: s.registro ? 'pago' : s.selo });\n" + SELO_TEXTO],
  [V_ABERTO]: ['app.js', SELO_TEXTO, "    s = Object.assign({}, s, { selo: s.selo === 'aberto' ? 'nada' : s.selo });\n" + SELO_TEXTO],
  [V_TOTAL]: ['app.js', "'data-valor': dinheiro(t.valorFeito), texto: 'do total de ' + dinheiro(t.valorFeito) + ' do mês'",
    "'data-valor': dinheiro(t.valor), texto: 'do total de ' + dinheiro(t.valor) + ' do mês'"],
  [V_PROPOSTO]: ['app.js', 'var proposto = reg ? reg.valor : (modoCelular ? propostoDoCelular(f).valor : (f.totalValor || 0));', 'var proposto = reg ? reg.valor : (f.totalValor || 0);'],
  [V_FRENTE]: ['app.js', 'var cent = Math.round(s.devido * 100) + centCanceladas;', 'var cent = Math.round(s.devido * 100);'],
  // a escolha que a segunda revisão derrubou: o proposto tira a aula de hoje que ainda não acabou
  [V_HOJE]: ['app.js', 'var cent = Math.round(s.devido * 100) + centCanceladas;',
    'var cent = Math.round(s.devido * 100) + centCanceladas - hojeAindaNao.reduce(function (c, l) { return c + Math.round((l.valor || 0) * 100); }, 0);'],
  [V_FALTA]: ['app.js', "id: 'cel-total-falta', texto: dinheiro(faltaCent / 100) }", "id: 'cel-total-falta', texto: dinheiro(t.valorFeito) }"],
  [V_ANTERIORES]: ['app.js', '.filter(function (p) { return p.mes < mesCelular; })', '.filter(function (p) { return false; })'],
  [V_CONFIRMA]: ['app.js', "return !jaConta || confirmar('Esta aula está como '", "return true || confirmar('Esta aula está como '"],
  [V_REDESENHO]: ['app.js', "if (modoCelular && $('#cel-fechamento') && caixa.closest && caixa.closest('#cel-fechamento')) { desenharFechamentoCelular(); return; }",
    "if (false) { return; }"],
  [V_CANCELA]: ['core.js', "      var cobravel = (typeof au.cobravel === 'boolean') ? au.cobravel : st.cobravelPadrao;",
    "      var cobravel = au.status === 'cancelada' || ((typeof au.cobravel === 'boolean') ? au.cobravel : st.cobravelPadrao);"],
  [V_NOME]: ['core.js', "return cobravel ? 'Cancelada e cobrada' : 'Cancelada sem cobrança';", "return cobravel ? 'Cancelada e cobrada' : 'Cancelada com aviso';"],
  [V_FORA]: ['app.js', 'var bloco = blocoDeAcaoDoCelular(linhaDePagamento(f));', 'var bloco = linhaDePagamento(f);'],
  [V_PRECO]: ['core.js', '      var pv = precoVigente(aluno, au.data);', '      var pv = precoVigente(aluno, hoje);'],
  [V_OBS]: ['app.js', 'var podePagar = celularEdita();', 'var podePagar = true;']
};
const FONTES = { 'app.js': APP, 'core.js': CORE };
conf('cada âncora de veneno está no arquivo dela uma vez só', MODOS.map(m => FONTES[ANCORAS[m][0]].split(ANCORAS[m][1]).length - 1).join(','), MODOS.map(() => 1).join(','));
const TRAV = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']');
conf('o app.js, o core.js e o styles.css não têm travessão', [APP, CORE, CSS].map(t => TRAV.test(t)).join(','), 'false,false,false');
conf('o selo do tablet e o do celular saem da mesma conta (Core.seloDoPagamento, e nenhuma outra regra de selo)',
  [/var s = Core\.seloDoPagamento\(db, f\);\s*var reg = s\.registro;\s*caixa\.setAttribute\('data-selo', s\.selo\);/.test(APP),
    // 4: o proposto, o tablet, o Fechamento do celular e os avisos do Hoje (lote 4, seloDoAvisoCelular)
    APP.split('Core.seloDoPagamento(').length - 1, APP.split('Core.situacaoDoPagamento(').length - 1].join(','), 'true,4,0');
const trocas = {};
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
const PASTA = path.join(os.tmpdir(), 'nath_d6c3_emulador_' + process.pid);
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
  if (opcoes.token) cab.Authorization = 'Bearer ' + opcoes.token;
  const r = await fetch(url, { method: opcoes.metodo || (corpo !== undefined ? 'POST' : 'GET'), headers: cab, body: corpo });
  const texto = await r.text();
  let json = null;
  try { json = texto ? JSON.parse(texto) : null; } catch (e) { json = null; }
  return { status: r.status, json };
}
const criarUsuario = (u) => rest(AUTH + '/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake',
  { corpo: { email: u.email, password: u.senha, returnSecureToken: true } });

const CFG = { auth: AUTH, firestore: FS, projectId: PROJETO };
const amb = H.criarAmbiente(PORTA_APP, 'nath_d6c3_celular_dinheiro', trocas);

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
  /* O relógio da página, fixo no meio do mês (e andando a partir dali): o
   * "hoje" do app é RELOGIO em qualquer dia em que a prova rode. */
  await pag.evaluateOnNewDocument(alvo => {
    const Real = Date, desvio = new Real(alvo).getTime() - Real.now();
    class Fixo extends Real { constructor(...a) { if (a.length) super(...a); else super(Real.now() + desvio); } static now() { return Real.now() + desvio; } }
    window.Date = Fixo;
  }, RELOGIO);
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
    (await Store.carregar()).alunos.some(a => a.id === 'pago') && !!document.querySelector('#cel-hoje.ativa')), v => v === true, 30000)).ok;
}
const sincronizar = pag => pag.evaluate(() => Nuvem.sincronizar({ versaoApp: 'prova' }).then(r => ({
  recebidos: r.recebidos.aplicados, erroR: r.recebidos.erro ? r.recebidos.erro.codigo : null,
  enviados: r.enviados.enviados, erroE: r.enviados.erro ? r.enviados.erro.codigo : null })));
const fila = pag => pag.evaluate(() => Store.lerFila().then(l => l.map(e => e.id)));
const filaVazia = pag => esperar('a fila do celular esvaziou', () => pag.evaluate(() => Store.lerFila().then(l => l.length)), v => v === 0, 20000);
const aba = (pag, t) => clicar(pag, '#cel-abas .cel-aba[data-cel="' + t + '"]').then(() => pausa(200));
async function irParaDia(pag, iso) {
  for (let i = 0; i < 80; i++) {
    const onde = await pag.evaluate(d => {
      if (document.querySelector('.cel-semana-dia[data-dia="' + d + '"]')) return 'achou';
      const primeiro = document.querySelector('.cel-semana-dia');
      if (!primeiro) return 'sem faixa';
      return primeiro.dataset.dia > d ? 'antes' : 'depois';
    }, iso);
    if (onde === 'achou') { await clicar(pag, '.cel-semana-dia[data-dia="' + iso + '"]'); await pausa(60); return true; }
    if (onde === 'sem faixa') return false;
    await clicar(pag, onde === 'antes' ? '#cel-dia-anterior' : '#cel-dia-seguinte');
  }
  return false;
}
/* O Fechamento do celular num mês, pela barra do mês. */
async function mesNoCelular(pag, mes) {
  const alvo = await pag.evaluate(m => Core.mesExtenso(m), mes);
  for (let i = 0; i < 30; i++) {
    const atual = (await texto(pag, '#cel-fechamento .cel-mes .cel-titulo')) || '';
    if (atual === alvo) return true;
    const antes = await pag.evaluate((a, b) => {
      const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
      const n = t => { const p = t.toLowerCase().split(' de '); return Number(p[1]) * 12 + meses.indexOf(p[0]); };
      return n(a) > n(b);
    }, atual, alvo);
    await clicar(pag, '#cel-fechamento .cel-mes button[aria-label="' + (antes ? 'Mês anterior' : 'Mês seguinte') + '"]');
    await pausa(80);
  }
  return false;
}
async function mesNoTablet(pag, mes) {
  await H.irParaAba(pag, 'fechamento');
  await pag.evaluate(m => { const s = document.querySelector('#mes-fechamento'); if (s.value !== m) { s.value = m; s.dispatchEvent(new Event('change', { bubbles: true })); } }, mes);
  await pausa(300);
}
async function tirarPrint(pag, nome) {
  if (!PRINTS) return;
  fs.mkdirSync(PRINTS, { recursive: true });
  await pausa(250);
  await pag.screenshot({ path: path.join(PRINTS, nome) });
  console.log('   print: ' + path.join(PRINTS, nome));
}
/* O que o celular mostra: o selo de cada família (a palavra e o data-selo
 * do selo à vista), o total a receber e o "em aberto". */
const retratoCelular = pag => pag.evaluate(() => {
  const selos = {};
  document.querySelectorAll('#cel-fechamento .cel-fechamento-aluno').forEach(c => {
    const s = c.querySelector('.cel-selo');
    selos[c.dataset.aluno] = s ? s.dataset.selo + ' | ' + s.textContent : 'sem selo';
  });
  const t = document.querySelector('#cel-total-valor'), a = document.querySelector('#cel-total-aberto'), fa = document.querySelector('#cel-total-falta');
  const an = document.querySelector('#cel-total-anteriores');
  const m = t ? /^do total de (.*) do mês$/.exec(t.textContent) : null;
  return { selos, total: m ? m[1] : (t ? 'texto fora do formato: ' + t.textContent : null), falta: fa ? fa.textContent : null,
    aberto: a ? a.textContent : null, anteriores: an ? an.textContent : null };
});
/* O que o tablet mostra: o data-selo da linha do pagamento de cada cartão, o
 * texto dela e o número grande "Total a receber". */
const retratoTablet = pag => pag.evaluate(() => {
  const selos = {};
  document.querySelectorAll('#lista-fechamento .linha-pagamento').forEach(l => {
    selos[l.dataset.aluno] = l.dataset.selo + ' | ' + l.textContent;
  });
  const n = Array.from(document.querySelectorAll('#numeros-fechamento .numero')).find(x => (x.querySelector('.rotulo') || {}).textContent === 'Total a receber');
  return { selos, total: n ? n.querySelector('.valor').textContent : null };
});
const soSelo = r => Object.keys(r.selos).sort().map(k => k + '=' + r.selos[k].split(' | ')[0]).join(' ');
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
    alvos: alvos.length, pequenos, soltos, acoes: Array.from(raiz.querySelectorAll('[data-acao-celular]')).filter(e => e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0).length
  };
}, RE_EDICAO);
const telaBoa = m => m.pequenos.join('; ') + (m.rolaDeLado ? ' ROLA DE LADO' : '');

function isoDe(d) { const p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
/* O dia da prova é fixo, e não o de hoje: no último dia do mês não haveria
 * aula "ainda não dada" no mês, e quatro venenos ficariam invisíveis. O meio
 * de outubro de 2026 tem aula dada e não dada no mesmo mês, fica depois do
 * junho de referência e do reajuste de julho, e fica ANTES de qualquer dia em
 * que a prova rode (o relógio da página só anda para trás: o token do
 * emulador nunca parece vencido). */
const HOJE = '2026-10-15';
const RELOGIO = HOJE + 'T18:00:00';
const AGORA = new Date(2026, 9, 15, 18, 0, 0);
const MES = HOJE.slice(0, 7);
const AMANHA = (() => { const d = new Date(AGORA.getTime()); d.setDate(d.getDate() + 1); return isoDe(d); })();
/* No último dia do mês não há aula "ainda não dada" no mesmo mês: o proposto
 * das aulas dadas e o do mês inteiro são o mesmo número, e a prova diz. */
const TEM_FUTURA = AMANHA.slice(0, 7) === MES;
const ddmmaaaa = iso => iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4);
const ddmm = iso => iso.slice(8, 10) + '/' + iso.slice(5, 7);

/* O que se espera, à mão (R$ 100,00 por hora; o aluno de referência tem
 * R$ 100,00 até junho e R$ 140,00 de julho em diante):
 *   pago:     1 h dada (R$ 100,00) e 1 h amanhã; pagou R$ 100,00           -> pago
 *   parcial:  2 h dadas (R$ 200,00); pagou R$ 150,00                       -> parcial, faltam R$ 50,00
 *   aberto:   1 h dada, 1 h cancelada e cobrada, 1 h cancelada sem
 *             cobrança (R$ 200,00); nada pago                              -> em aberto
 *   celular:  1 h dada (R$ 100,00) e 1 h amanhã; o celular marca o pago    -> em aberto, depois pago
 *   frente:   1 h dada (R$ 100,00) e 1 h cancelada e cobrada no dia 25     -> em aberto; propõe R$ 200,00
 *   noite:    1 h dada em 14/10 e 1 h hoje às 19:00 (o relógio está nas
 *             18:00); o fechamento conta as duas como dadas                 -> em aberto; propõe R$ 200,00,
 *             e pagar o proposto deixa Pago (sem pendência em 02/11)
 * Total do mês (o número grande do tablet): 100 + 200 + 200 + 100 + 100 + 200 = R$ 900,00.
 * Falta receber: 0 + 50 + 200 + 100 + 100 + 200 = R$ 650,00; depois do pago do celular, R$ 550,00.
 * Meses anteriores em aberto: junho do aluno de referência, R$ 1.050,00. */
const ESPERADO = { pago: 'pago', parcial: 'parcial', aberto: 'aberto', celular: 'aberto', frente: 'aberto', noite: 'aberto' };
const TOTAL_MES = 'R$ 900,00';
const REF_JUNHO = { linhas: 10, horas: '10:30', total: 'R$ 1.050,00' };
const fmt = s => s.replace(/\u00a0/g, ' ');

(async function () {
  secao('1. O tablet cria os alunos fictícios, os pagamentos e sobe a cópia');
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
      aluno('pago', 'Aluno Pago Teste', '#1F3A5F'),
      // "Abel" vem antes de "Aberto": o parcial, com o "faltam", é o primeiro cartão do print
      aluno('parcial', 'Aluno Abel Parcial Teste', '#C9A961'),
      aluno('aberto', 'Aluno Aberto Teste', '#2E7D6B'),
      aluno('celular', 'Aluno Celular Teste', '#B4453C'),
      aluno('frente', 'Aluno Frente Teste', '#627D98'),
      aluno('noite', 'Aluno Noite Teste', '#16314F'),
      // o de referência de junho, com o valor reajustado depois de junho (a vigência por data)
      { id: 'ref', nome: 'Aluno Referência Teste', ativo: true, cor: '#627D98', responsavel: '', mapeamentos: [],
        precos: [{ id: 'p-ref-1', inicio: '2026-01-01', fim: '2026-06-30', valorHora: 100 }, { id: 'p-ref-2', inicio: '2026-07-01', fim: null, valorHora: 140 }] }
    ];
    const aula = (id, alunoId, data, hora, dur, status, cobravel) => ({ id, alunoId, serieId: null, data, hora, duracaoMin: dur, status, cobravel, notaTexto: '', anexos: [] });
    d.aulas = [
      aula('pago-1', 'pago', c.hoje, '08:00', 60, 'realizada', true),
      aula('parcial-1', 'parcial', c.hoje, '09:00', 120, 'realizada', true),
      aula('aberto-1', 'aberto', c.hoje, '11:30', 60, 'realizada', true),
      aula('aberto-cobrada', 'aberto', c.hoje, '13:00', 60, 'cancelada', true),
      aula('aberto-sem', 'aberto', c.hoje, '14:30', 60, 'cancelada', false),
      aula('celular-1', 'celular', c.hoje, '16:00', 60, 'realizada', true),
      aula('frente-1', 'frente', c.hoje, '10:00', 60, 'realizada', true),
      aula('frente-cancelada', 'frente', c.mes + '-25', '15:00', 60, 'cancelada', true),
      aula('noite-1', 'noite', c.mes + '-14', '10:00', 60, 'realizada', true),
      aula('noite-2', 'noite', c.hoje, '19:00', 60, 'realizada', true)
    ];
    if (c.temFutura) {
      d.aulas.push(aula('pago-2', 'pago', c.amanha, '08:00', 60, 'realizada', true));
      d.aulas.push(aula('celular-2', 'celular', c.amanha, '16:00', 60, 'realizada', true));
    }
    // junho do aluno de referência: 9 de 1 h e 1 de 1h30 (10 encontros, 10:30, R$ 1.050,00)
    ['2026-06-01', '2026-06-03', '2026-06-05', '2026-06-08', '2026-06-10', '2026-06-12', '2026-06-15', '2026-06-17', '2026-06-19', '2026-06-22']
      .forEach((data, i) => d.aulas.push(aula('ref-' + data, 'ref', data, '15:30', i === 4 ? 90 : 60, 'realizada', true)));
    d.pagamentos = [
      { id: 'pg-pago', alunoId: 'pago', mes: c.mes, pagoEm: c.hoje, valor: 100 },
      { id: 'pg-parcial', alunoId: 'parcial', mes: c.mes, pagoEm: c.hoje, valor: 150 }
    ];
    d.ajustes = d.ajustes || {};
    d.ajustes.pagamentosDesde = '2026-06';
    await Store.salvar(d);
  }, { hoje: HOJE, amanha: AMANHA, mes: MES, temFutura: TEM_FUTURA });
  conf('(arranjo) o relógio da página é o da prova, ' + HOJE + ', e o mês tem aula ainda não dada (relógio real do processo: ' + isoDe(new Date()) + ')',
    (await pagA.evaluate(() => Core.hojeIso())) + ' ' + TEM_FUTURA, HOJE + ' true');
  await H.abrirApp(pagA, amb.ORIGEM);
  conf('o tablet entrou', await entrarPelaTela(pagA, DONA.email, DONA.senha), true);
  await clicar(pagA, '#nuvem-enviar');
  conf('a cópia do tablet subiu', (await esperar('a cópia subiu', () => texto(pagA, '#nuvem-ultima'), v => /^Última cópia na nuvem: hoje/.test(v || ''), 30000)).ok, true);
  const sA = await sincronizar(pagA);
  conf('o tablet subiu os registros', sA.enviados > 0 && sA.erroE === null, true);
  await pagA.evaluate(u => Nuvem.permitirLeitor(u), obs.localId);

  secao('2. O celular da dona traz a cópia');
  const ctxC = await pagA.browser().createBrowserContext();
  const pagC = await ctxC.newPage();
  await prepararPagina(pagC, true);
  await abrirCelular(pagC);
  conf('o celular entrou com a conta da dona', await entrarNoCelular(pagC, DONA), true);
  conf('trouxe a cópia do tablet', await trazerCopiaNoCelular(pagC), true);
  conf('(arranjo) é o celular da dona, que edita', await pagC.evaluate(() => Nuvem.estado().celularDaDona), true);

  secao('2b. O atalho de Pagamentos pendentes abre o pagamento daquele mês e aluno');
  await pagA.evaluate(() => document.querySelector('#abrir-pendentes-pagamento').click());
  const pendenteJunho = await pagA.evaluate(() => Array.from(document.querySelectorAll('.pendente-pagamento'))
    .find(x => x.dataset.aluno === 'ref' && x.dataset.mes === '2026-06'));
  conf('a lista mostra a pendência de junho do aluno de referência', !!pendenteJunho, true);
  await pagA.evaluate(() => Array.from(document.querySelectorAll('.pendente-pagamento'))
    .find(x => x.dataset.aluno === 'ref' && x.dataset.mes === '2026-06').querySelector('button.principal').click());
  const abriuAtalho = await esperar('o atalho abre o valor de junho', () => pagA.evaluate(() => ({
    mes: document.querySelector('#mes-fechamento').value,
    valor: (document.querySelector('.linha-pagamento[data-aluno="ref"] .pagamento-valor') || {}).value || ''
  })), x => x.mes === '2026-06' && !!x.valor, 10000);
  conf('vai ao mês certo e abre o formulário do aluno', abriuAtalho.ok, true);
  conf('o valor vem preenchido com o total devido', abriuAtalho.valor && abriuAtalho.valor.valor, '1.050,00');
  await pagA.evaluate(() => document.querySelector('.linha-pagamento[data-aluno="ref"] .btn-cancelar-pagamento').click());
  conf('fechar o formulário sem confirmar não grava pagamento', await pagA.evaluate(() => Store.carregar().then(d => d.pagamentos.length)), 2);
  await mesNoTablet(pagA, MES);

  secao('3. O selo de cada família: o mesmo do tablet, e o esperado à mão');
  await aba(pagC, 'fechamento');
  conf('(arranjo) o Fechamento do celular abre no mês de hoje', await mesNoCelular(pagC, MES), true);
  const c1 = await retratoCelular(pagC);
  await mesNoTablet(pagA, MES);
  const t1 = await retratoTablet(pagA);
  console.log('   celular: ' + JSON.stringify(c1));
  console.log('   tablet:  ' + JSON.stringify(t1));
  const esperado = Object.keys(ESPERADO).sort().map(k => k + '=' + ESPERADO[k]).join(' ');
  conf('(arranjo) o tablet dá o esperado à mão: pago, parcial e em aberto (' + soSelo(t1) + ')', soSelo(t1), esperado);
  prop('o selo do celular bate com o do tablet em pago, parcial e em aberto (' + soSelo(c1) + ')', soSelo(c1) === soSelo(t1) && soSelo(c1) === esperado, [V_SELO_MES, V_PARCIAL, V_ABERTO]);
  prop('as palavras dos selos: Pago, "Parcial, faltam R$ 50,00" e Em aberto (' + ['pago', 'parcial', 'aberto'].map(k => fmt(c1.selos[k] || '')).join(' ; ') + ')',
    fmt(c1.selos.pago) === 'pago | Pago' && fmt(c1.selos.parcial) === 'parcial | Parcial, faltam R$ 50,00' && fmt(c1.selos.aberto) === 'aberto | Em aberto', [V_SELO_MES, V_PARCIAL, V_ABERTO]);
  seVeneno([V_SELO_MES, V_PARCIAL, V_ABERTO]);
  conf('e o tablet diz o mesmo do parcial: "faltam R$ 50,00"', /faltam R\$\s?50,00/.test(t1.selos.parcial || ''), true);

  secao('4. Falta receber (o número grande) e o total do mês: o do tablet, ao centavo, e o esperado à mão');
  prop('(arranjo) o tablet: Total a receber ' + t1.total + ', o esperado à mão', fmt(t1.total || '') === TOTAL_MES, V_CANCELA);
  prop('o "do total de" do celular é o número grande do tablet (' + c1.total + ')', fmt(c1.total || '') === fmt(t1.total || '') && fmt(c1.total || '') === TOTAL_MES, [V_TOTAL, V_CANCELA]);
  seVeneno(V_TOTAL);
  prop('o número grande é o que falta receber neste mês: R$ 650,00 (' + c1.falta + ')', fmt(c1.falta || '') === 'R$ 650,00', [V_CANCELA, V_FALTA]);
  seVeneno(V_FALTA);
  conf('o rótulo diz "Falta receber neste mês"', await texto(pagC, '#cel-total-mes .cel-total-rotulo'), 'Falta receber neste mês');
  conf('a contagem dos selos (' + c1.aberto + ')', fmt(c1.aberto || ''), '1 paga · 1 parcial · 4 em aberto');
  prop('os meses anteriores em aberto, à parte: o junho de referência (' + c1.anteriores + ')', fmt(c1.anteriores || '') === 'Meses anteriores em aberto: R$ 1.050,00', [V_ANTERIORES, V_PRECO]);
  seVeneno(V_ANTERIORES);
  const detalhe = fmt((await texto(pagC, '#cel-total-detalhe')) || '');
  prop('o total diz as aulas dadas, a cancelada e cobrada à frente e o que ainda não foi dado (' + detalhe + ')',
    detalhe === '8 aulas dadas · canceladas e cobradas à frente: R$ 100,00 · ainda não dado: R$ 200,00', V_CANCELA);

  secao('5. A cancelada sem cobrança não entra; a cancelada e cobrada entra, pelo valor da data dela');
  const linhas = await pagC.evaluate(() => {
    const c = document.querySelector('.cel-fechamento-aluno[data-aluno="aberto"]');
    const l = id => { const e = c.querySelector('.cel-linha[data-aula="' + id + '"]'); return e ? e.textContent : 'sem linha'; };
    return { sem: l('aberto-sem'), cobrada: l('aberto-cobrada'), resumo: c.querySelector('.ajuda').textContent };
  });
  console.log('   ' + JSON.stringify(linhas));
  prop('o cartão do Aberto: 2 aulas dadas, R$ 200,00 (a sem cobrança fora) (' + linhas.resumo + ')', /R\$\s?200,00$/.test(fmt(linhas.resumo)), V_CANCELA);
  prop('a linha da cancelada sem cobrança não tem valor (' + linhas.sem + ')', /Cancelada sem cobrança$/.test(fmt(linhas.sem)), [V_CANCELA, V_NOME]);
  seVeneno(V_CANCELA);
  conf('a linha da cancelada e cobrada leva o valor por hora da data: R$ 100,00 (' + linhas.cobrada + ')', /Cancelada e cobrada\s*R\$\s?100,00$/.test(fmt(linhas.cobrada)), true);

  secao('6. Os dois cancelamentos com nomes que não se confundem');
  const textoCelular = await pagC.evaluate(() => document.querySelector('#modo-celular').textContent);
  prop('o Fechamento do celular não diz "com aviso" em lugar nenhum', !/com aviso/i.test(textoCelular), V_NOME);
  await aba(pagC, 'hoje');
  await irParaDia(pagC, HOJE);
  const blocos = await pagC.evaluate(() => ['aberto-sem', 'aberto-cobrada'].map(id => {
    const b = document.querySelector('.cel-bloco[data-aula="' + id + '"] .cel-bloco-situacao'); return b ? b.textContent : 'sem bloco'; }));
  prop('os blocos da agenda: "Cancelada sem cobrança" e "Cancelada e cobrada" (' + blocos.join(' ; ') + ')', blocos.join(' ; ') === 'Cancelada sem cobrança ; Cancelada e cobrada', V_NOME);
  /* Os mesmos nomes no tablet: a tabela do Fechamento e o PDF da família. */
  await mesNoTablet(pagA, MES);
  const noTablet = await pagA.evaluate(() => ['aberto-sem', 'aberto-cobrada'].map(id => {
    const tr = document.querySelector('tr[data-aula-fechamento="' + id + '"]'); return tr ? tr.children[3].textContent + ' / ' + tr.children[4].textContent : 'sem linha'; }));
  prop('a tabela do Fechamento do tablet: "Cancelada sem cobrança" sem valor e "Cancelada e cobrada" com R$ 100,00 (' + noTablet.join(' ; ') + ')',
    fmt(noTablet.join(' ; ')) === 'Cancelada sem cobrança / R$ 0,00 ; Cancelada e cobrada / R$ 100,00', V_NOME);
  const pdf = await pagA.evaluate(m => Store.carregar().then(d => {
    const f = Core.calcularFechamento(d, 'aberto', m);
    const t = new TextDecoder('latin1').decode(PDFGen.gerarFechamento(f, { exibirTemasEAreas: false, incluirNotasPublicas: false, incluirFolhas: false }));
    return { sem: t.indexOf('Cancelada sem cobran') >= 0, cobrada: t.indexOf('Cancelada e cobrada') >= 0, aviso: t.indexOf('com aviso') >= 0,
      naoCobrada: t.indexOf('o cobrada)') >= 0, valor: t.indexOf('200,00') >= 0, controle: t.indexOf('Realizada') >= 0 };
  }), MES);
  console.log('   PDF: ' + JSON.stringify(pdf));
  conf('(controle) o texto do PDF é legível pela prova: "Realizada" aparece', pdf.controle, true);
  prop('o PDF da família diz "Cancelada sem cobrança" e "Cancelada e cobrada", sem "com aviso" e sem o "(não cobrada)" repetido', pdf.sem && pdf.cobrada && !pdf.aviso && !pdf.naoCobrada, V_NOME);
  conf('e o valor do PDF não mudou: R$ 200,00', pdf.valor, true);
  seVeneno(V_NOME);
  conf('(arranjo) a folha da aula do Aberto abre', await clicar(pagC, '.cel-bloco[data-aula="aberto-1"]') && await existe(pagC, '#cel-folha[data-aula="aberto-1"]'), true);
  await clicar(pagC, '#cel-folha-cancelar');
  const cancela = await pagC.evaluate(() => ['#cel-cancelar-sem', '#cel-cancelar-com', '#cel-cancelar-explica'].map(s => { const e = document.querySelector(s); return e ? e.textContent : 'sem ' + s; }));
  conf('a folha diz o efeito em dinheiro em cada botão: "sai R$ 100,00 do mês" e "cobrar R$ 100,00"', fmt(cancela.join(' | ')),
    'Cancelar sem cobrança (sai R$ 100,00 do mês) | Cancelar e cobrar R$ 100,00 | Sem cobrança: a família avisou a tempo, e a aula sai do valor do mês. ' +
    'Cobrada: cancelamento em cima da hora, e a aula continua no valor, pelo valor por hora da data dela.');
  conf('nenhum dos dois cancelamentos é o botão principal', await pagC.evaluate(() => ['#cel-cancelar-sem', '#cel-cancelar-com'].map(s => document.querySelector(s).classList.contains('principal')).join(',')), 'false,false');
  let m = await medirTela(pagC);
  conf('a folha de cancelar: alvos de 48 px e sem rolagem de lado', telaBoa(m), '');
  await tirarPrint(pagC, '3_folha_os_dois_cancelamentos.png');
  /* A aula está como dada: o toque em "Cancelar sem cobrança" pergunta, com
   * o efeito em dinheiro; ela recusa, e nada muda. */
  const dialogosAntes = pagC.dialogos.length;
  pagC.recusar = true;
  await pagC.click('#cel-cancelar-sem');
  await pausa(400);
  pagC.recusar = false;
  const perguntou = pagC.dialogos.slice(dialogosAntes).map(fmt);
  const situacaoAberto1 = await pagC.evaluate(() => Store.carregar().then(b => { const a = b.aulas.find(x => x.id === 'aberto-1'); return a.status + '/' + a.cobravel; }));
  prop('cancelar a aula dada pergunta com o efeito em dinheiro, e o "não" deixa a aula como estava (' + (perguntou.join(' ; ') || 'não perguntou') + ' ; ' + situacaoAberto1 + ')',
    perguntou.join(' ; ') === 'Esta aula está como dada. Cancelar sem cobrança tira R$ 100,00 do mês.' && situacaoAberto1 === 'realizada/true', V_CONFIRMA);
  seVeneno(V_CONFIRMA);
  await clicar(pagC, '#cel-folha-voltar');
  await clicar(pagC, '#cel-folha-fechar');
  conf('(arranjo) nada mudou na aula ao voltar', await pagC.evaluate(() => Store.carregar().then(b => b.aulas.find(a => a.id === 'aberto-1').status)), 'realizada');

  secao('7. "Pago" em dois toques, com o valor das aulas já dadas');
  await aba(pagC, 'fechamento');
  m = await medirTela(pagC);
  conf('o Fechamento: alvos de 48 px e sem rolagem de lado', telaBoa(m), '');
  conf('o Fechamento: os botões de edição são só os do "pago em" (' + (m.soltos.join(', ') || 'nenhum solto') + ')', m.soltos.join(', '), '');
  await pagC.evaluate(() => { const c = document.querySelector('#cel-conteudo'); if (c) c.scrollTop = 0; });
  await tirarPrint(pagC, '1_fechamento_selos_e_total.png');
  /* (revisão) O proposto é o devido até hoje: com a cancelada e cobrada à
   * frente (o tablet propõe o mês inteiro, R$ 200,00), e sem a aula de hoje
   * que ainda não acabou. */
  const propostoDe = async (id) => {
    const S = '.cel-fechamento-aluno[data-aluno="' + id + '"] ';
    await clicar(pagC, S + '.btn-marcar-pago');
    const r = await pagC.evaluate(s => ({ valor: (document.querySelector(s + '.pagamento-valor') || {}).value, soma: (document.querySelector(s + '.cel-proposto-soma') || {}).textContent }), S);
    await clicar(pagC, S + '.btn-cancelar-pagamento');
    return r;
  };
  const pFrente = await propostoDe('frente');
  console.log('   frente: ' + JSON.stringify(pFrente));
  prop('com uma cancelada e cobrada no dia 25, o proposto é R$ 200,00 e diz por quê (' + pFrente.valor + ' ; ' + pFrente.soma + ')',
    pFrente.valor === '200,00' && fmt(pFrente.soma || '') === 'Devido até hoje: R$ 200,00 (1 aula dada). Inclui R$ 100,00 de cancelada e cobrada à frente.', V_FRENTE);
  seVeneno(V_FRENTE);
  const pNoite = await propostoDe('noite');
  console.log('   noite: ' + JSON.stringify(pNoite));
  prop('às 18:00, o proposto é o devido do selo, com a aula de hoje às 19:00, e a frase diz (' + pNoite.valor + ' ; ' + pNoite.soma + ')',
    pNoite.valor === '200,00' && fmt(pNoite.soma || '') === 'Devido até hoje: R$ 200,00 (2 aulas dadas). Inclui a aula de hoje às 19:00, como no tablet.', V_HOJE);
  seVeneno(V_HOJE);
  conf('a linha da aula das 19:00 diz que ainda não acabou, com o valor que já conta no mês', await pagC.evaluate(() => {
    const l = document.querySelector('.cel-linha[data-aula="noite-2"]'); const v = l.querySelector('.cel-valor');
    return l.textContent.replace(/ /g, ' ') + ' | ' + v.classList.contains('cel-valor-a-dar'); }), '15/10 19:00 · 1h · Hoje, ainda não acabouR$ 100,00 | false');
  conf('(arranjo) os dois "Fechar sem marcar" não gravaram nada', await pagC.evaluate(m => Store.carregar().then(d => (d.pagamentos || []).filter(p => p.mes === m).length), MES), 2);
  conf('o tablet propõe o mês inteiro para o Frente, R$ 200,00 (o mesmo número, pela regra dele)', await pagA.evaluate(() => {
    const b = document.querySelector('#lista-fechamento .linha-pagamento[data-aluno="frente"] .btn-marcar-pago'); if (!b) return 'sem botão'; b.click();
    const v = document.querySelector('#lista-fechamento .linha-pagamento[data-aluno="frente"] .pagamento-valor').value;
    document.querySelector('#lista-fechamento .linha-pagamento[data-aluno="frente"] .btn-cancelar-pagamento').click(); return v; }), '200,00');
  const SEL = '.cel-fechamento-aluno[data-aluno="celular"] ';
  conf('toque 1: "Marcar como pago" no cartão do Celular', await clicar(pagC, SEL + '.btn-marcar-pago'), true);
  const aberto = await pagC.evaluate(s => ({
    valor: (document.querySelector(s + '.pagamento-valor') || {}).value, data: (document.querySelector(s + '.pagamento-data') || {}).value,
    ajuda: (document.querySelector(s + '.ajuda-proposto') || {}).textContent, soma: (document.querySelector(s + '.cel-proposto-soma') || {}).textContent
  }), SEL);
  console.log('   ' + JSON.stringify(aberto));
  prop('o "Valor pago" vem com o devido até hoje, R$ 100,00, e não o do mês (' + aberto.valor + ')', aberto.valor === '100,00', V_PROPOSTO);
  conf('e as não dadas aparecem à parte (' + aberto.soma + ')', fmt(aberto.soma || ''),
    'Devido até hoje: R$ 100,00 (1 aula dada). Ainda não dadas: 1 aula, R$ 100,00 (não entram no valor).');
  seVeneno(V_PROPOSTO);
  conf('a ajuda diz de onde vem o valor', aberto.ajuda, 'O valor proposto é o devido até hoje. Troque se a família pagou outro valor.');
  conf('junto do Confirmar: "Confira o valor que a família pagou."', await texto(pagC, SEL + '.cel-confira-valor'), 'Confira o valor que a família pagou.');
  conf('a data vem com hoje, dd/mm/aaaa', aberto.data, ddmmaaaa(HOJE));
  m = await medirTela(pagC);
  conf('o "Pago" aberto: alvos de 48 px e sem rolagem de lado', telaBoa(m), '');
  await pagC.evaluate(s => document.querySelector(s + '.btn-confirmar-pagamento').scrollIntoView({ block: 'center' }), SEL);
  await tirarPrint(pagC, '2_pago_em_dois_toques.png');
  conf('toque 2: "Confirmar"', await clicar(pagC, SEL + '.btn-confirmar-pagamento'), true);
  const gravou = await esperar('o pagamento gravou no celular', () => pagC.evaluate(m => Store.carregar().then(b => {
    const p = (b.pagamentos || []).find(x => x.alunoId === 'celular' && x.mes === m); return p ? p.pagoEm + '/' + p.valor : null; }), MES), v => !!v, MODO === V_FORA ? 4000 : 10000);
  const naFila = (await fila(pagC)).filter(id => /^pagamento:/.test(id));
  prop('dois toques gravaram o pagamento de R$ 100,00 com a data de hoje, e ele entrou na fila de registros (' + gravou.valor + ' ; ' + (naFila.join(', ') || 'nada na fila') + ')',
    gravou.valor === HOJE + '/100' && naFila.length === 1, V_FORA);
  seVeneno(V_FORA);
  const c2 = await retratoCelular(pagC);
  prop('o selo e o total se redesenham: o Celular virou Pago, e o que falta caiu para R$ 550,00 (' + c2.selos.celular + ' ; ' + c2.falta + ' ; ' + c2.aberto + ')',
    fmt(c2.selos.celular || '') + ' ; ' + fmt(c2.falta || '') + ' ; ' + fmt(c2.aberto || '') === 'pago | Pago ; R$ 550,00 ; 2 pagas · 1 parcial · 3 em aberto', V_REDESENHO);
  seVeneno(V_REDESENHO);
  conf('o total do mês não muda com o pagamento (' + c2.total + ')', fmt(c2.total || ''), TOTAL_MES);
  conf('a linha diz "Pago em", com o valor', /Pago em \d\d\/\d\d · R\$\s?100,00/.test(fmt((await texto(pagC, SEL + '.linha-pagamento')) || '')), true);
  conf('nenhum "Este celular só lê"', pagC.dialogos.concat(await pagC.evaluate(() => (document.querySelector('#aviso-texto') || {}).textContent || '')).filter(t => /só lê/.test(t)).length, 0);

  secao('8. O "Pago" do celular sobe pela fila e chega ao tablet');
  const sC = await sincronizar(pagC);
  conf('o celular sincronizou sem erro', sC.erroE === null && sC.erroR === null && sC.enviados >= 1, true);
  conf('a fila do celular zerou', (await filaVazia(pagC)).ok, true);
  await H.abrirApp(pagA, amb.ORIGEM);
  const chegou = await esperar('o tablet recebeu o pagamento', () => pagA.evaluate(m => Store.carregar().then(d => {
    const p = (d.pagamentos || []).find(x => x.alunoId === 'celular' && x.mes === m); return p ? p.pagoEm + '/' + p.valor : null; }), MES), v => !!v, 30000);
  conf('o pagamento do celular chegou ao tablet', chegou.valor, HOJE + '/100');
  await mesNoTablet(pagA, MES);
  const t2 = await retratoTablet(pagA);
  conf('o tablet mostra o selo Pago do Celular, com o "Pago em" e o valor', /^pago \| Pago em \d\d\/\d\d · R\$\s?100,00/.test(fmt(t2.selos.celular || '')), true);
  conf('e os selos e o total do tablet batem com os do celular depois do pago', soSelo(t2) + ' ; ' + fmt(t2.total || ''), soSelo(c2) + ' ; ' + fmt(c2.total || ''));

  secao('9. Junho, o fechamento de referência, continua igual');
  await aba(pagC, 'fechamento');
  conf('(arranjo) o celular vai a junho de 2026', await mesNoCelular(pagC, '2026-06'), true);
  await mesNoTablet(pagA, '2026-06');
  const cJ = await retratoCelular(pagC), tJ = await retratoTablet(pagA);
  const cartaoJ = fmt((await texto(pagC, '.cel-fechamento-aluno[data-aluno="ref"] .ajuda')) || '');
  const dadoJ = await pagC.evaluate(() => Store.carregar().then(d => { const f = Core.calcularMesInteiro(d, '2026-06').find(x => x.aluno.id === 'ref');
    return { linhas: f.linhas.length, horas: Core.fmtHoras(f.totalMin), total: Core.fmtMoeda(f.totalValor) }; }));
  prop('junho no celular: 10 encontros, 10:30, R$ 1.050,00 (' + JSON.stringify(dadoJ) + ' ; ' + cartaoJ + ')',
    JSON.stringify(dadoJ) === JSON.stringify(REF_JUNHO) && cartaoJ === '10 aulas dadas · 10:30 h · R$ 1.050,00', V_PRECO);
  prop('junho: o total a receber do celular é o do tablet, R$ 1.050,00 (' + cJ.total + ' ; ' + tJ.total + ')', fmt(cJ.total || '') === 'R$ 1.050,00' && fmt(tJ.total || '') === 'R$ 1.050,00', V_PRECO);
  seVeneno(V_PRECO);
  conf('junho: o selo é Em aberto no celular e no tablet', soSelo(cJ) + ' ; ' + soSelo(tJ), 'ref=aberto ; ref=aberto');
  await clicar(pagC, '.cel-fechamento-aluno[data-aluno="ref"] .btn-marcar-pago');
  conf('junho: o "Valor pago" vem com R$ 1.050,00', await pagC.evaluate(() => (document.querySelector('.cel-fechamento-aluno[data-aluno="ref"] .pagamento-valor') || {}).value), '1.050,00');
  await clicar(pagC, '.cel-fechamento-aluno[data-aluno="ref"] .btn-cancelar-pagamento');
  conf('(arranjo) "Fechar sem marcar" não grava nada em junho', await pagC.evaluate(() => Store.carregar().then(d => (d.pagamentos || []).filter(p => p.mes === '2026-06').length)), 0);
  await mesNoCelular(pagC, MES);

  secao('10. O observador de outra conta vê o selo e o total, sem marcar pago');
  const ctxD = await pagA.browser().createBrowserContext();
  const pagD = await ctxD.newPage();
  await prepararPagina(pagD, true);
  await abrirCelular(pagD);
  conf('o observador entrou com a conta dele', await entrarNoCelular(pagD, OBS), true);
  conf('trouxe a cópia da dona pelo código da conta dela', await trazerCopiaNoCelular(pagD, dona.localId), true);
  await pagD.evaluate(() => Nuvem.receberRegistros());
  await aba(pagD, 'fechamento');
  await mesNoCelular(pagD, MES);
  const cD = await esperar('o observador vê o pago do celular', () => retratoCelular(pagD), v => /^pago/.test(v.selos.celular || ''), 15000);
  conf('o observador vê os mesmos selos e o mesmo total do celular da dona (' + soSelo(cD.valor) + ' ; ' + cD.valor.total + ')',
    soSelo(cD.valor) + ' ; ' + fmt(cD.valor.total || ''), soSelo(c2) + ' ; ' + TOTAL_MES);
  m = await medirTela(pagD);
  const botaoPago = await pagD.evaluate(() => document.querySelectorAll('#cel-fechamento .btn-marcar-pago, #cel-fechamento .btn-desmarcar-pagamento, #cel-fechamento .btn-alterar-pagamento').length);
  prop('o observador não tem "Marcar como pago", nem Alterar ou Desmarcar (' + botaoPago + ' botões, ' + m.acoes + ' ações)', botaoPago === 0 && m.acoes === 0 && m.soltos.length === 0, V_OBS);
  seVeneno(V_OBS);
  conf('o observador, o Fechamento: alvos de 48 px e sem rolagem de lado', telaBoa(m), '');
  await pausa(2500);
  conf('nenhuma escrita na nuvem saiu do observador', pagD.commitsNaRede, 0);

  secao('10b. (revisão) Desmarcar no celular: o selo e o que falta se redesenham, e a mudança chega ao tablet');
  await aba(pagC, 'fechamento');
  await mesNoCelular(pagC, MES);
  const dlgAntes = pagC.dialogos.length;
  conf('o cartão do Celular tem "Desmarcar"', await clicar(pagC, SEL + '.btn-desmarcar-pagamento'), true);
  conf('Desmarcar pergunta antes', pagC.dialogos.slice(dlgAntes).map(fmt).join(' ; '), 'Desmarcar o pagamento de Aluno Celular Teste em ' + (await pagC.evaluate(m => Core.mesExtenso(m), MES)) + '?');
  const c3 = await retratoCelular(pagC);
  conf('depois de desmarcar: Em aberto, e falta receber R$ 650,00 de novo (' + c3.selos.celular + ' ; ' + c3.falta + ' ; ' + c3.aberto + ')',
    fmt(c3.selos.celular || '') + ' ; ' + fmt(c3.falta || '') + ' ; ' + fmt(c3.aberto || ''), 'aberto | Em aberto ; R$ 650,00 ; 1 paga · 1 parcial · 4 em aberto');
  conf('o cartão volta a ter "Marcar como pago"', await existe(pagC, SEL + '.btn-marcar-pago'), true);
  conf('o pagamento saiu do celular, e a mudança está na fila', await pagC.evaluate(m => Store.carregar().then(d => (d.pagamentos || []).some(p => p.alunoId === 'celular' && p.mes === m)), MES) + ' ' +
    (await fila(pagC)).filter(id => /^pagamento:/.test(id)).length, 'false 1');
  const sC3 = await sincronizar(pagC);
  conf('o celular sincronizou o desmarcar', sC3.erroE === null && sC3.enviados >= 1, true);
  await H.abrirApp(pagA, amb.ORIGEM);
  const saiu = await esperar('o tablet recebeu o desmarcar', () => pagA.evaluate(m => Store.carregar().then(d => !(d.pagamentos || []).some(p => p.alunoId === 'celular' && p.mes === m)), MES), v => v === true, 30000);
  conf('o desmarcar chegou ao tablet', saiu.ok, true);
  await mesNoTablet(pagA, MES);
  const t3 = await retratoTablet(pagA);
  conf('e o tablet mostra o Celular em aberto, como o celular', soSelo(t3), soSelo(c3));

  secao('10c. (segunda revisão) Às 18:00, pagar o proposto do Noite (com a aula de hoje às 19:00) deixa Pago, e em 02/11 não sobra pendência');
  const SN = '.cel-fechamento-aluno[data-aluno="noite"] ';
  conf('toque 1: "Marcar como pago" no Noite, com R$ 200,00', (await clicar(pagC, SN + '.btn-marcar-pago')) + ' ' + (await pagC.evaluate(s => document.querySelector(s + '.pagamento-valor').value, SN)), 'true 200,00');
  conf('toque 2: "Confirmar"', await clicar(pagC, SN + '.btn-confirmar-pagamento'), true);
  await esperar('o pagamento do Noite gravou', () => pagC.evaluate(m => Store.carregar().then(d => (d.pagamentos || []).some(p => p.alunoId === 'noite' && p.mes === m)), MES), v => v === true, 10000);
  const cN = await retratoCelular(pagC);
  conf('o selo do Noite é Pago, já às 18:00', fmt(cN.selos.noite || ''), 'pago | Pago');
  const pend = await pagC.evaluate(() => Store.carregar().then(d => Core.pendentesDePagamento(d, '2026-11-02').map(p => p.alunoId + ' ' + p.mes + ' ' + p.falta)));
  console.log('   pendentes em 02/11: ' + JSON.stringify(pend));
  conf('em 02/11, outubro fechado, o Noite não fica pendente', pend.filter(p => /^noite /.test(p)).join(' ; '), '');
  conf('(controle) em 02/11 a lista de pendentes vê outubro: o Frente, que não pagou, está nela', pend.some(p => /^frente 2026-10 /.test(p)), true);

  secao('11. Sem erro de página, e o veneno pedido foi visto');
  conf('nenhum erro de página no tablet, no celular e no observador', [pagA, pagC, pagD].map(p => p.errosDePagina.join(' | ')).filter(Boolean).join(' || '), '');
  /* Num modo envenenado, chegar aqui é não ter visto o veneno: cada um
   * termina a rodada onde é visto. */
  if (MODO) conf('o veneno ' + MODO + ' foi visto antes do fim', false, true);
  await ctxD.close();
  await ctxC.close();
})().then(() => derrubarEmulador().then(H.fim(amb)), e => derrubarEmulador().then(() => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e))));
