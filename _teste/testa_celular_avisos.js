/* testa_celular_avisos.js
 *
 * D6c, lote 4: o que o app mostra sozinho no alto de Hoje do celular. Contra
 * o Firebase Emulator Suite (Auth e Firestore), com um tablet (1280 px), o
 * celular da dona (360 x 740) e um observador de outra conta (360 x 740).
 * Alunos, telefones e valores fictícios.
 *
 * O que prova:
 *   1. "Próxima: 15:30, Aluno Alfa Teste, daqui a 40 min": a mesma aula que
 *      a linha do tempo marca como Próxima (marcasDeAgoraCelular, do lote 1);
 *   2. "Falta registrar como foi": a aula dada e já acabada dos últimos 7
 *      dias sem registro pelo critério do tablet (Core.aulaTemRegistro, o do
 *      "Relato da aula anterior"); a registrada, a falta e a cancelada não
 *      aparecem; o toque abre o "Registrar como foi" daquela aula, e depois
 *      de salvar o aviso some;
 *   3. a família em aberto (a lista de pendentes do lote 3) vira aviso de
 *      cobrar do dia 6 em diante, e nunca no dia 5; o botão abre o WhatsApp
 *      com o texto escrito, com o mês e o que falta pelo selo
 *      (Core.seloDoPagamento), sem nome nenhum; com o telefone que não passa
 *      na regra do lote 2, nenhum link;
 *   4. o lembrete de fechar o mês nos 3 últimos dias do mês e nos 5 primeiros
 *      do seguinte (Core.mesAFechar), enquanto o mês tiver aula sem registro
 *      ou família em aberto; a regra conferida dia a dia de 2026 e 2027;
 *   5. no máximo 3 avisos, na ordem: próxima, falta registrar, fechar o mês,
 *      cobrar; em 360 x 740 a agenda continua na primeira tela;
 *   6. o observador vê a próxima e a aula sem registro, sem cobrar e sem o
 *      mês a fechar, e nada sobe dele;
 *   7. o tablet não muda: nenhum aviso nele, e junho continua 10 encontros,
 *      10:30 e R$ 1.050,00 nos dois.
 *
 * Venenos, que TÊM de reprovar a propriedade:
 *   --envenenado-cobra-antes-do-dia-6     a cobrança aparece no dia 5 (core.js);
 *   --envenenado-observador-cobra         o observador ganha o aviso e o botão de cobrar;
 *   --envenenado-telefone-de-texto-vira-link  o telefone que não passa na regra vira link;
 *   --envenenado-valor-fora-do-selo       a cobrança leva o devido do mês, e não o que falta pelo selo;
 *   --envenenado-registrada-falta-registrar   a aula registrada aparece como "falta registrar";
 *   --envenenado-mais-de-3-avisos         os avisos passam de 3;
 *   --envenenado-lembrete-fora-da-janela  o lembrete de fechar o mês sai da janela (core.js).
 *
 * O relógio: a página começa em 06/10/2026 14:50 (e anda); cada momento da
 * prova para o relógio da página num dia e numa hora (fixarRelogio), e o
 * Hoje se redesenha. A prova não depende do dia em que roda.
 *
 *   --prints <pasta>   os quatro prints do lote 4, em 360 x 740.
 *
 * Portas: 9001 (app), 9003 (auth), 9004 (firestore), 9005 (hub), 9006 (log),
 * 9007 (websocket). Precisa do firebase-tools e de um JDK 21 em JAVA_HOME.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const MODOS = ['--envenenado-cobra-antes-do-dia-6', '--envenenado-observador-cobra', '--envenenado-telefone-de-texto-vira-link',
  '--envenenado-valor-fora-do-selo', '--envenenado-registrada-falta-registrar', '--envenenado-mais-de-3-avisos', '--envenenado-lembrete-fora-da-janela'];
const [V_DIA5, V_OBS, V_TELEFONE, V_VALOR, V_REGISTRADA, V_MAIS3, V_JANELA] = MODOS;
const PRINTS = (() => { const i = process.argv.indexOf('--prints'); return i >= 0 ? process.argv[i + 1] : ''; })();
const MODO = MODOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && MODOS.indexOf(a) < 0);
function prop(rotulo, ok, venenos) {
  venenos = [].concat(venenos || []);
  if (MODO && venenos.indexOf(MODO) >= 0) return conf('VENENO visto: ' + rotulo + ', e quebrou', ok, false);
  return conf(rotulo, ok, true);
}
function fimDoVeneno() { throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true }); }
function seVeneno(venenos) { if (MODO && [].concat(venenos).indexOf(MODO) >= 0) fimDoVeneno(); }

const PORTA_APP = 9001, PORTA_AUTH = 9003, PORTA_FS = 9004, PORTA_HUB = 9005, PORTA_LOG = 9006, PORTA_WS = 9007;
const PROJETO = 'demo-nath-d6c4';
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

secao('0. As âncoras dos venenos, o núcleo reaproveitado e o ambiente');
conf('nenhum --envenenado- desconhecido foi pedido (' + (desconhecidos.join(' ') || 'nenhum') + ')', desconhecidos.length, 0);
const LINK_COBRAR = 'var link = linkDoWhatsapp(tel, mensagemDeCobrancaCelular(fam));';
const ANCORAS = {
  [V_DIA5]: ['core.js', 'return p.d >= DIA_DE_COBRAR;', 'return p.d >= DIA_DE_COBRAR - 1;'],
  [V_OBS]: ['app.js', 'var edita = celularEdita(), daDona = !leOutraConta();', 'var edita = celularEdita(), daDona = true;'],
  // o atalho que o dono recusou no lote 2: os dígitos de qualquer texto do contato viram o número
  [V_TELEFONE]: ['app.js', LINK_COBRAR,
    "var link = 'https://wa.me/55' + telefoneDoAluno(fam.aluno).replace(/\\D/g, '').replace(/^55/, '') + '?text=' + encodeURIComponent(mensagemDeCobrancaCelular(fam));"],
  [V_VALOR]: ['app.js', 'porAluno[p.alunoId].meses.push({ mes: p.mes, falta: s.falta, selo: s.selo });', 'porAluno[p.alunoId].meses.push({ mes: p.mes, falta: s.devido, selo: s.selo });'],
  [V_REGISTRADA]: ['app.js', '    return !Core.aulaTemRegistro(a);', '    return true;'],
  [V_MAIS3]: ['app.js', 'return avisos.slice(0, MAX_AVISOS_CELULAR);', 'return avisos;'],
  [V_JANELA]: ['core.js', 'var LEMBRETE_FIM_DO_MES_DIAS = 3, LEMBRETE_INICIO_DO_MES_DIAS = 5;', 'var LEMBRETE_FIM_DO_MES_DIAS = 4, LEMBRETE_INICIO_DO_MES_DIAS = 6;']
};
const FONTES = { 'app.js': APP, 'core.js': CORE };
conf('cada âncora de veneno está no arquivo dela uma vez só', MODOS.map(m => FONTES[ANCORAS[m][0]].split(ANCORAS[m][1]).length - 1).join(','), MODOS.map(() => 1).join(','));
const TRAV = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']');
conf('o app.js, o core.js, o styles.css e esta prova não têm travessão',
  [APP, CORE, CSS, fs.readFileSync(__filename, 'utf8')].map(t => TRAV.test(t)).join(','), 'false,false,false,false');
/* O núcleo reaproveitado: a Próxima do aviso e a do bloco saem da mesma
 * função; o "sem registro" é o critério do ultimoEncontro; o link é o do lote 2. */
conf('a Próxima do bloco e a do aviso saem de marcasDeAgoraCelular (a definição e dois usos)', APP.split('marcasDeAgoraCelular(').length - 1, 3);
conf('o ultimoEncontro do tablet e o aviso usam o mesmo critério de registro (Core.aulaTemRegistro)',
  [/if \(!aulaTemRegistro\(au\)\) continue;/.test(CORE), APP.split('Core.aulaTemRegistro(').length - 1].join(','), 'true,1');
conf('o link de cobrar é o linkDoWhatsapp do lote 2, com o telefoneDoCampo', APP.indexOf('var tel = telefoneDoCampo(fam.aluno);\r\n          ' + LINK_COBRAR) >= 0 ||
  APP.indexOf('var tel = telefoneDoCampo(fam.aluno);\n          ' + LINK_COBRAR) >= 0, true);
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
const PASTA = path.join(os.tmpdir(), 'nath_d6c4_emulador_' + process.pid);
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
  const r = await fetch(url, { method: corpo !== undefined ? 'POST' : 'GET', headers: cab, body: corpo });
  const texto = await r.text();
  let json = null;
  try { json = texto ? JSON.parse(texto) : null; } catch (e) { json = null; }
  return { status: r.status, json };
}
const criarUsuario = (u) => rest(AUTH + '/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake',
  { corpo: { email: u.email, password: u.senha, returnSecureToken: true } });

const CFG = { auth: AUTH, firestore: FS, projectId: PROJETO };
const amb = H.criarAmbiente(PORTA_APP, 'nath_d6c4_celular_avisos', trocas);

const RELOGIO = '2026-10-06T14:50:00';
async function prepararPagina(pag, movel) {
  pag.setDefaultTimeout(60000);
  if (movel) await pag.setViewport({ width: 360, height: 740, hasTouch: true, isMobile: true });
  pag.errosDePagina = [];
  pag.on('pageerror', e => pag.errosDePagina.push(e.message));
  pag.dialogos = [];
  pag.on('dialog', async d => { pag.dialogos.push(d.message()); try { await d.accept(); } catch (e) { /* ok */ } });
  pag.commitsNaRede = 0;
  pag.paraFora = [];
  pag.on('request', r => {
    const u = r.url();
    if (u.indexOf(FS) === 0 && /:commit\b/.test(u) && r.method() === 'POST') pag.commitsNaRede++;
    if (/wa\.me/.test(u)) pag.paraFora.push(u);
  });
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
    (await Store.carregar()).alunos.some(a => a.id === 'alfa') && !!document.querySelector('#cel-hoje.ativa')), v => v === true, 30000)).ok;
}
const sincronizar = pag => pag.evaluate(() => Nuvem.sincronizar({ versaoApp: 'prova' }).then(r => ({
  recebidos: r.recebidos.aplicados, erroR: r.recebidos.erro ? r.recebidos.erro.codigo : null,
  enviados: r.enviados.enviados, erroE: r.enviados.erro ? r.enviados.erro.codigo : null })));
const aba = (pag, t) => clicar(pag, '#cel-abas .cel-aba[data-cel="' + t + '"]').then(() => pausa(200));
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

/* O relógio da página parado num dia e numa hora (a cada chamada, de novo
 * a partir do relógio da rodada), e o Hoje redesenhado. */
const fixarRelogio = (pag, iso, hhmm) => pag.evaluate((iso, hhmm) => {
  const Real = window.__DataReal || Date;
  window.__DataReal = Real;
  const p = iso.split('-').map(Number), h = hhmm.split(':').map(Number);
  const fixo = new Real(p[0], p[1] - 1, p[2], h[0], h[1]).getTime();
  function Fixa(...a) { return a.length ? new Real(...a) : new Real(fixo); }
  Fixa.prototype = Real.prototype; Fixa.now = () => fixo; Fixa.UTC = Real.UTC; Fixa.parse = Real.parse;
  window.Date = Fixa;
}, iso, hhmm);
const soltarRelogio = pag => pag.evaluate(() => { if (window.__DataReal) window.Date = window.__DataReal; });
async function momento(pag, iso, hhmm) {
  await fixarRelogio(pag, iso, hhmm);
  await aba(pag, 'fechamento');
  await aba(pag, 'hoje');
  await pausa(150);
  return avisos(pag);
}
/* O que o alto de Hoje mostra: cada aviso com o tipo, o texto, a aula, o
 * mês, o aluno e o link (se houver). */
const avisos = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#cel-semana #cel-avisos .cel-aviso')).map(a => {
  const l = a.querySelector('a[href]'), ac = a.querySelector('[data-acao-celular]');
  return { tipo: a.dataset.aviso, texto: a.querySelector('.cel-aviso-botao').textContent.replace(/\u00a0/g, ' '),
    aula: a.dataset.aula || '', mes: a.dataset.mes || '', aluno: a.dataset.aluno || '', link: l ? l.getAttribute('href') : '',
    acao: ac ? ac.getAttribute('data-acao-celular') : '' };
}));
const tipos = l => l.map(a => a.tipo).join(',');
const textos = l => l.map(a => a.texto).join(' | ');
const RE_EDICAO = 'registrar|corrigir|editar|salvar|excluir|apagar|nova aula|novo aluno|^\\s*\\+|desmarcar|marcar|cancelar a aula|cancelar aula|cadastrar|pago|anotar|alterar|confirmar';
const medirTela = (pag) => pag.evaluate((reEdicao) => {
  const re = new RegExp(reEdicao, 'i');
  const visivel = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  const raiz = document.querySelector('#modo-celular');
  const alvos = Array.from(raiz.querySelectorAll('button, a[href], input, select, textarea, [role=button], summary')).filter(visivel);
  /* Os dias da faixa da semana (lote 1) têm 45 px de largura em 360 px: sete
   * cabem sem rolar de lado, com 56 de altura. Ficam de fora só na largura;
   * os avisos deste lote entram inteiros na conta. */
  const pequenos = alvos.filter(e => { const r = e.getBoundingClientRect(); return r.height < 48 || (r.width < 48 && !e.classList.contains('cel-semana-dia')); })
    .map(e => (e.id || e.className || e.textContent.trim().slice(0, 30)) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
  const botoes = Array.from(raiz.querySelectorAll('button')).filter(visivel).filter(b => re.test(b.textContent));
  const soltos = botoes.filter(b => !b.closest('[data-acao-celular]')).filter(b => !b.closest('#cel-entrada')).map(b => b.textContent.trim());
  const conteudo = document.querySelector('#cel-conteudo');
  return {
    rolaDeLado: document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth ||
      (conteudo && conteudo.scrollWidth > conteudo.clientWidth) || !!Array.from(raiz.querySelectorAll('*')).find(e => e.getBoundingClientRect().right > window.innerWidth + 0.5 && visivel(e)),
    pequenos, soltos, acoes: raiz.querySelectorAll('[data-acao-celular]').length
  };
}, RE_EDICAO);
const telaBoa = m => m.pequenos.join('; ') + (m.rolaDeLado ? ' ROLA DE LADO' : '');
/* A agenda na primeira tela: o espaço entre o pé da faixa presa (com os
 * avisos) e o pé da área que rola, e se o bloco marcado (Próxima) cabe
 * inteiro nele. */
const leiaute = pag => pag.evaluate(() => {
  const c = document.querySelector('#cel-conteudo').getBoundingClientRect();
  const f = document.querySelector('#cel-semana').getBoundingClientRect();
  const b = document.querySelector('#cel-tempo .cel-bloco-proxima') || document.querySelector('#cel-tempo .cel-bloco');
  const r = b ? b.getBoundingClientRect() : null;
  return { livre: Math.round(c.bottom - f.bottom), alvoInteiro: !!r && r.top >= f.bottom - 1 && r.bottom <= c.bottom + 1, alvo: b ? b.dataset.aula : '',
    janela: window.innerWidth + 'x' + window.innerHeight };
});
/* A mensagem que o link de cobrar leva, decodificada. */
const mensagemDoLink = href => { const i = String(href || '').indexOf('?text='); return i < 0 ? '' : decodeURIComponent(href.slice(i + 6)).replace(/\u00a0/g, ' '); };
const fmt = s => String(s || '').replace(/\u00a0/g, ' ');
const WA_ALFA = '5511987654321';

(async function () {
  secao('1. O tablet cria os alunos fictícios, as aulas e os pagamentos e sobe a cópia');
  await subirEmulador();
  const dona = (await criarUsuario(DONA)).json;
  const obs = (await criarUsuario(OBS)).json;
  conf('as contas da dona e do observador existem no emulador', !!(dona && dona.localId && obs && obs.localId), true);
  await amb.subir();
  const pagA = await amb.pagina();
  await prepararPagina(pagA, false);
  await H.abrirApp(pagA, amb.ORIGEM);
  await pagA.evaluate(async () => {
    const d = Store.bancoVazio();
    const preco = (v) => [{ id: 'p-' + v, inicio: '2026-01-01', fim: null, valorHora: v }];
    const aluno = (id, nome, cor, extra) => Object.assign({ id, nome, ativo: true, cor, responsavel: 'Responsável ' + nome, precos: preco(100), mapeamentos: [] }, extra || {});
    d.alunos = [
      aluno('alfa', 'Aluno Alfa Teste', '#1F3A5F', { telefone: '(11) 98765-4321' }),
      // o contato só nas observações: nunca vira link (a regra do lote 2)
      aluno('beta', 'Aluno Beta Teste', '#C9A961', { obs: 'Contato: (11) 91234-5678' }),
      aluno('gama', 'Aluno Gama Teste', '#2E7D6B', { telefone: '(11) 3456-7890' }),
      aluno('ref', 'Aluno Referência Teste', '#627D98')
    ];
    const aula = (id, alunoId, data, hora, status, extra) => Object.assign({ id, alunoId, serieId: null, data, hora, duracaoMin: 60, status,
      cobravel: status === 'cancelada' ? false : true, notaTexto: '', anexos: [] }, extra || {});
    const relato = { notaTexto: 'Relato de teste.' };
    d.aulas = [
      // julho do Alfa: 2 h, pagou R$ 50,00 (parcial, faltam R$ 150,00); agosto do Beta: 1 h, nada pago
      aula('alfa-0708', 'alfa', '2026-07-08', '10:00', 'realizada', relato),
      aula('alfa-0715', 'alfa', '2026-07-15', '10:00', 'realizada', relato),
      aula('beta-0812', 'beta', '2026-08-12', '10:00', 'realizada', relato),
      // setembro sem aula: no começo de outubro não há mês a fechar
      aula('gama-1002', 'gama', '2026-10-02', '09:00', 'realizada', relato),
      aula('beta-1004', 'beta', '2026-10-04', '10:00', 'falta'),
      aula('alfa-1005', 'alfa', '2026-10-05', '10:00', 'realizada'),
      // registrada só pela nota só minha: é registro, como no tablet
      aula('gama-1005', 'gama', '2026-10-05', '16:00', 'realizada', { notaPrivada: 'Só minha, de teste.' }),
      aula('gama-1006', 'gama', '2026-10-06', '13:00', 'realizada', relato),
      aula('beta-1006', 'beta', '2026-10-06', '14:00', 'cancelada'),
      aula('alfa-1006', 'alfa', '2026-10-06', '15:30', 'realizada'),
      aula('gama-1027', 'gama', '2026-10-27', '10:00', 'realizada'),
      aula('alfa-1029', 'alfa', '2026-10-29', '16:00', 'realizada')
    ];
    // junho do aluno de referência: 9 de 1 h e 1 de 1h30 (10 encontros, 10:30, R$ 1.050,00), pago
    ['2026-06-01', '2026-06-03', '2026-06-05', '2026-06-08', '2026-06-10', '2026-06-12', '2026-06-15', '2026-06-17', '2026-06-19', '2026-06-22']
      .forEach((data, i) => d.aulas.push(aula('ref-' + data, 'ref', data, '15:30', 'realizada', { duracaoMin: i === 4 ? 90 : 60, notaTexto: 'Relato de junho.' })));
    d.pagamentos = [
      { id: 'pg-alfa-07', alunoId: 'alfa', mes: '2026-07', pagoEm: '2026-08-03', valor: 50 },
      { id: 'pg-ref-06', alunoId: 'ref', mes: '2026-06', pagoEm: '2026-07-03', valor: 1050 }
    ];
    d.ajustes = d.ajustes || {};
    d.ajustes.pagamentosDesde = '2026-06';
    await Store.salvar(d);
  });
  conf('(arranjo) o relógio da página é o da prova (relógio real do processo: ' + new Date().toISOString().slice(0, 10) + ')', await pagA.evaluate(() => Core.hojeIso()), '2026-10-06');
  await H.abrirApp(pagA, amb.ORIGEM);
  conf('o tablet entrou', await entrarPelaTela(pagA, DONA.email, DONA.senha), true);
  await clicar(pagA, '#nuvem-enviar');
  conf('a cópia do tablet subiu', (await esperar('a cópia subiu', () => texto(pagA, '#nuvem-ultima'), v => /^Última cópia na nuvem: hoje/.test(v || ''), 30000)).ok, true);
  const sA = await sincronizar(pagA);
  conf('o tablet subiu os registros', sA.enviados > 0 && sA.erroE === null, true);
  await pagA.evaluate(u => Nuvem.permitirLeitor(u), obs.localId);

  secao('2. A regra dos dias, dia a dia de 2026 e 2027 (Core.cobrancaLiberada e Core.mesAFechar)');
  /* Cada dia cai em exatamente um balde: fim do mês (o mês que acaba),
   * começo do mês (o que acabou) ou fora da janela; e a cobrança vale do dia
   * 6 em diante. A regra esperada é escrita aqui de novo, à parte. */
  const part = await pagA.evaluate(() => {
    const q = n => String(n).padStart(2, '0');
    const baldes = { fim: 0, inicio: 0, fora: 0 }, erros = [];
    let cobra = 0, total = 0;
    for (let t = new Date(2026, 0, 1, 12); t.getFullYear() < 2028; t = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1, 12)) {
      const y = t.getFullYear(), m = t.getMonth() + 1, d = t.getDate();
      const iso = y + '-' + q(m) + '-' + q(d), mes = y + '-' + q(m);
      const ultimo = new Date(y, m, 0).getDate();
      const ant = new Date(y, m - 2, 1); const mesAnt = ant.getFullYear() + '-' + q(ant.getMonth() + 1);
      const esperado = d > ultimo - 3 ? mes : d <= 5 ? mesAnt : null;
      const balde = d > ultimo - 3 ? 'fim' : d <= 5 ? 'inicio' : 'fora';
      baldes[balde]++; total++;
      const obtido = Core.mesAFechar(iso);
      if (obtido !== esperado) erros.push(iso + ' ' + obtido + '/' + esperado);
      if (Core.cobrancaLiberada(iso) !== (d >= 6)) erros.push(iso + ' cobra ' + Core.cobrancaLiberada(iso));
      if (Core.cobrancaLiberada(iso)) cobra++;
    }
    return { baldes, total, erros: erros.slice(0, 6), nErros: erros.length, cobra,
      fev: [Core.mesAFechar('2027-02-25'), Core.mesAFechar('2027-02-26'), Core.mesAFechar('2027-03-05'), Core.mesAFechar('2027-03-06')].join(','),
      virada: [Core.mesAFechar('2026-12-31'), Core.mesAFechar('2027-01-01')].join(',') };
  });
  console.log('   ' + JSON.stringify(part));
  conf('todo dia de 2026 e 2027 caiu num balde só: 24 meses x 3 no fim, 24 x 5 no começo, o resto fora', part.baldes.fim + ',' + part.baldes.inicio + ',' + (part.baldes.fim + part.baldes.inicio + part.baldes.fora), '72,120,' + part.total);
  prop('o mês a fechar e a cobrança batem com a regra escrita à parte em todo dia (' + part.nErros + ' diferenças: ' + part.erros.join('; ') + ')', part.nErros === 0, [V_JANELA, V_DIA5]);
  prop('fevereiro de 2027 (28 dias): 25/02 fora, 26/02 fecha fevereiro, 05/03 ainda fevereiro, 06/03 fora (' + part.fev + ')', part.fev === ',2027-02,2027-02,', V_JANELA);
  conf('a virada do ano: 31/12 fecha dezembro, 01/01 fecha dezembro do ano que passou (' + part.virada + ')', part.virada, '2026-12,2026-12');

  secao('3. O celular da dona traz a cópia');
  const ctxC = await pagA.browser().createBrowserContext();
  const pagC = await ctxC.newPage();
  await prepararPagina(pagC, true);
  await abrirCelular(pagC);
  conf('o celular entrou com a conta da dona', await entrarNoCelular(pagC, DONA), true);
  conf('trouxe a cópia do tablet', await trazerCopiaNoCelular(pagC), true);
  conf('(arranjo) é o celular da dona, que edita', await pagC.evaluate(() => Nuvem.estado().celularDaDona), true);

  secao('4. Dia 6, 14:50: próxima, falta registrar e cobrar, em 360 x 740');
  let av = await momento(pagC, '2026-10-06', '14:50');
  console.log('   ' + JSON.stringify(av));
  conf('(arranjo) a janela é a de 360 x 740', (await leiaute(pagC)).janela, '360x740');
  conf('três avisos, na ordem: próxima, falta registrar, cobrar (' + tipos(av) + ')', tipos(av), 'proxima,registrar,cobrar');
  conf('a próxima: "Próxima: 15:30, Aluno Alfa Teste, daqui a 40 min"', (av[0] || {}).texto, 'Próxima: 15:30, Aluno Alfa Teste, daqui a 40 min');
  conf('é a mesma aula que a linha do tempo marca como Próxima', await pagC.evaluate(() => (document.querySelector('#cel-tempo .cel-bloco-proxima') || { dataset: {} }).dataset.aula), 'alfa-1006');
  const reg = av.find(a => a.tipo === 'registrar') || {};
  prop('falta registrar: a aula do Alfa de ontem, sem registro; a do Gama de hoje (com relato), a de ontem (com nota só minha), a falta e a cancelada ficam fora (' + reg.texto + ' ; ' + reg.aula + ')',
    reg.texto === 'Falta registrar como foi: Aluno Alfa Teste, seg 05/10, 10:00' && reg.aula === 'alfa-1005', V_REGISTRADA);
  seVeneno(V_REGISTRADA);
  conf('o aviso de registrar é uma ação do celular da dona', reg.acao, 'registrar-como-foi');
  const cob = av.find(a => a.tipo === 'cobrar') || {};
  const seloJulho = await pagC.evaluate(() => Store.carregar().then(d => { const s = Core.seloDoPagamento(d, Core.calcularFechamento(d, 'alfa', '2026-07', '2026-10-06'));
    return { selo: s.selo, falta: s.falta, texto: Core.fmtMoeda(s.falta).replace(/\u00a0/g, ' ') }; }));
  const msg = mensagemDoLink(cob.link);
  console.log('   selo de julho do Alfa: ' + JSON.stringify(seloJulho) + ' ; mensagem: ' + msg);
  conf('(arranjo) o selo de julho do Alfa é parcial, faltam R$ 150,00', seloJulho.selo + ' ' + seloJulho.texto, 'parcial R$ 150,00');
  prop('o aviso de cobrar: o Alfa (julho, o que espera há mais tempo) com o que falta pelo selo, e mais uma família (' + cob.texto + ')',
    cob.texto === 'Em aberto: Aluno Alfa Teste, julho de 2026, ' + seloJulho.texto + '. E mais 1 família' && cob.aluno === 'alfa', V_VALOR);
  prop('o link abre o WhatsApp do Alfa com o texto escrito: o mês e o valor do selo, sem nome nenhum (' + msg + ')',
    cob.link.indexOf('https://wa.me/' + WA_ALFA + '?text=') === 0 &&
    msg === 'Olá! Tudo bem? Passando para lembrar do pagamento das aulas de julho de 2026: ficou faltando ' + seloJulho.texto + '. Obrigada!' &&
    !/Aluno|Alfa|Beta|Gama|Respons/.test(msg), V_VALOR);
  seVeneno(V_VALOR);
  conf('nada foi a wa.me sem toque', pagC.paraFora.length, 0);
  let m = await medirTela(pagC);
  conf('Hoje com 3 avisos: alvos de 48 px e sem rolagem de lado', telaBoa(m), '');
  conf('Hoje com 3 avisos: nenhum botão de edição fora das ações do celular (' + (m.soltos.join(', ') || 'nenhum') + ')', m.soltos.join(', '), '');
  const lay = await leiaute(pagC);
  console.log('   ' + JSON.stringify(lay));
  conf('a agenda continua na primeira tela: o bloco da Próxima inteiro abaixo dos avisos, com 200 px ou mais de agenda à vista (' + lay.livre + ' px)',
    lay.alvoInteiro && lay.alvo === 'alfa-1006' && lay.livre >= 200, true);
  await tirarPrint(pagC, '2_tres_avisos_dia_6.png');
  conf('tocar na próxima abre a folha daquela aula', await clicar(pagC, '#cel-aviso-proxima') && await existe(pagC, '#cel-folha[data-aula="alfa-1006"]'), true);
  await clicar(pagC, '#cel-folha-fechar');
  conf('tocar no aviso de cobrar leva ao Fechamento de julho', (await clicar(pagC, '#cel-aviso-cobranca')) + ' ' + (await pagC.evaluate(() => !!document.querySelector('#cel-fechamento.ativa'))) + ' ' +
    (await texto(pagC, '#cel-fechamento .cel-mes .cel-titulo')), 'true true Julho de 2026');
  av = await momento(pagC, '2026-10-06', '14:50');

  secao('5. Dia 5, 14:50: sem cobrança');
  av = await momento(pagC, '2026-10-05', '14:50');
  console.log('   ' + JSON.stringify(av));
  prop('no dia 5 não há aviso de cobrar, nem link de WhatsApp no alto (' + tipos(av) + ')', tipos(av) === 'proxima,registrar' && av.every(a => !a.link), V_DIA5);
  seVeneno(V_DIA5);
  conf('dia 5: "Próxima: 16:00, Aluno Gama Teste, daqui a 1 h 10 min" e a aula do Alfa das 10:00', textos(av),
    'Próxima: 16:00, Aluno Gama Teste, daqui a 1 h 10 min | Falta registrar como foi: Aluno Alfa Teste, seg 05/10, 10:00');
  await tirarPrint(pagC, '3_dia_5_sem_cobrar.png');

  secao('6. Dia 3, 20:00: nenhum aviso');
  av = await momento(pagC, '2026-10-03', '20:00');
  conf('sem próxima, sem aula sem registro, sem mês a fechar (setembro sem aula) e antes do dia 6: nenhum aviso (' + tipos(av) + ')', av.length + ' ' + (await existe(pagC, '#cel-avisos')), '0 false');
  await tirarPrint(pagC, '1_sem_aviso.png');

  secao('7. O fim do mês, a virada e o máximo de 3');
  const janela = {};
  for (const [iso, hhmm] of [['2026-10-28', '12:00'], ['2026-10-29', '12:00'], ['2026-10-31', '12:00'], ['2026-11-01', '09:00'], ['2026-11-05', '09:00'], ['2026-11-06', '09:00']]) {
    janela[iso] = await momento(pagC, iso, hhmm);
    console.log('   ' + iso + ' ' + JSON.stringify(janela[iso].map(a => a.tipo + ': ' + a.texto)));
  }
  const fechar = iso => (janela[iso].find(a => a.tipo === 'fechar') || {});
  prop('28/10 (o 4º dia antes do fim) e 06/11 (o 6º do mês seguinte): sem lembrete de fechar (' + tipos(janela['2026-10-28']) + ' ; ' + tipos(janela['2026-11-06']) + ')',
    !fechar('2026-10-28').tipo && !fechar('2026-11-06').tipo, V_JANELA);
  seVeneno(V_JANELA);
  conf('29/10, 31/10, 01/11 e 05/11: o lembrete de fechar outubro (' + ['2026-10-29', '2026-10-31', '2026-11-01', '2026-11-05'].map(d => fechar(d).mes || '-').join(',') + ')',
    ['2026-10-29', '2026-10-31', '2026-11-01', '2026-11-05'].map(d => fechar(d).mes || '-').join(','), '2026-10,2026-10,2026-10,2026-10');
  conf('29/10: "Fechar outubro de 2026: 3 aulas sem registro e 3 famílias em aberto"', fechar('2026-10-29').texto, 'Fechar outubro de 2026: 3 aulas sem registro e 3 famílias em aberto');
  conf('05/11: o mesmo outubro, com as 4 aulas sem registro', fechar('2026-11-05').texto, 'Fechar outubro de 2026: 4 aulas sem registro e 3 famílias em aberto');
  prop('29/10 tem quatro avisos possíveis e mostra três, sem o de cobrar (o último na urgência) (' + tipos(janela['2026-10-29']) + ')',
    tipos(janela['2026-10-29']) === 'proxima,registrar,fechar', V_MAIS3);
  prop('nenhum momento passa de 3 avisos (' + Object.keys(janela).map(d => janela[d].length).join(',') + ')', Object.keys(janela).every(d => janela[d].length <= 3), V_MAIS3);
  seVeneno(V_MAIS3);
  conf('29/10: "Próxima: 16:00, Aluno Alfa Teste, daqui a 4 h" e a aula do Gama de terça', textos(janela['2026-10-29'].slice(0, 2)),
    'Próxima: 16:00, Aluno Alfa Teste, daqui a 4 h | Falta registrar como foi: Aluno Gama Teste, ter 27/10, 10:00');
  conf('31/10: a mais recente sem registro, e quantas mais', (janela['2026-10-31'].find(a => a.tipo === 'registrar') || {}).texto, 'Falta registrar como foi: Aluno Alfa Teste, qui 29/10, 16:00 (e mais 1)');
  conf('01/11 a 05/11: sem cobrança (antes do dia 6), e em 06/11 ela volta', ['2026-11-01', '2026-11-05', '2026-11-06'].map(d => janela[d].some(a => a.tipo === 'cobrar')).join(','), 'false,false,true');
  const cob6 = janela['2026-11-06'].find(a => a.tipo === 'cobrar') || {};
  const selos6 = await pagC.evaluate(() => Store.carregar().then(d => ['2026-07', '2026-10'].map(mes => Core.seloDoPagamento(d, Core.calcularFechamento(d, 'alfa', mes, '2026-11-06')).falta)));
  const msg6 = mensagemDoLink(cob6.link);
  console.log('   selos do Alfa em 06/11: ' + JSON.stringify(selos6) + ' ; ' + msg6);
  conf('(arranjo) os selos do Alfa em 06/11: julho faltam 150, outubro 300', selos6.join(','), '150,300');
  prop('06/11: o Alfa com julho e outubro, R$ 450,00 (a soma do que falta pelos selos), e mais 2 famílias (' + cob6.texto + ')',
    cob6.texto === 'Em aberto: Aluno Alfa Teste, julho de 2026 e outubro de 2026, R$ 450,00. E mais 2 famílias', V_VALOR);
  conf('06/11: a mensagem diz cada mês com o que falta e o total', msg6,
    'Olá! Tudo bem? Passando para lembrar do pagamento das aulas em aberto: julho de 2026, R$ 150,00; outubro de 2026, R$ 300,00 (total de R$ 450,00). Obrigada!');

  secao('8. O observador de outra conta: a próxima e a aula sem registro, sem cobrar');
  const ctxD = await pagA.browser().createBrowserContext();
  const pagD = await ctxD.newPage();
  await prepararPagina(pagD, true);
  await abrirCelular(pagD);
  conf('o observador entrou com a conta dele', await entrarNoCelular(pagD, OBS), true);
  conf('trouxe a cópia da dona pelo código da conta dela', await trazerCopiaNoCelular(pagD, dona.localId), true);
  const avD = await momento(pagD, '2026-10-06', '14:50');
  console.log('   ' + JSON.stringify(avD));
  prop('o observador vê a próxima e a aula sem registro, e nada de cobrar (' + tipos(avD) + ')',
    tipos(avD) === 'proxima,registrar' && !(await existe(pagD, '#cel-aviso-cobrar')) && !(await pagD.evaluate(() => /wa\.me/.test((document.querySelector('#cel-avisos') || {}).innerHTML || ''))), V_OBS);
  const avD29 = await momento(pagD, '2026-10-29', '12:00');
  prop('nem o mês a fechar, que é dela (29/10: ' + tipos(avD29) + ')', tipos(avD29) === 'proxima,registrar', V_OBS);
  seVeneno(V_OBS);
  await momento(pagD, '2026-10-06', '14:50');
  conf('o observador lê "Ainda sem registro de como foi", sem botão de ação', textos(avD) + ' | ' + avD.map(a => a.acao).join(''),
    'Próxima: 15:30, Aluno Alfa Teste, daqui a 40 min | Ainda sem registro de como foi: Aluno Alfa Teste, seg 05/10, 10:00 | ');
  m = await medirTela(pagD);
  conf('o observador, Hoje com avisos: alvos de 48 px, sem rolagem de lado, nenhum botão de edição nem ação (' + m.soltos.join(', ') + ' ; ' + m.acoes + ')',
    telaBoa(m) + '|' + m.soltos.join(', ') + '|' + m.acoes, '||0');
  await tirarPrint(pagD, '4_observador.png');
  conf('o toque do observador no aviso abre a folha da aula, só de leitura', (await clicar(pagD, '#cel-aviso-registrar')) + ' ' +
    (await existe(pagD, '#cel-folha[data-aula="alfa-1005"]')) + ' ' + (await pagD.evaluate(() => document.querySelectorAll('#cel-folha [data-acao-celular]').length)), 'true true 0');
  await clicar(pagD, '#cel-folha-fechar');
  await pausa(2500);
  conf('nenhuma escrita na nuvem saiu do observador', pagD.commitsNaRede, 0);

  secao('9. O telefone que não passa na regra do lote 2 não vira link');
  /* O dado antigo: o tablet de hoje recusa o telefone que não é telefone,
   * mas um campo assim pode ter vindo de antes. Ele chega ao celular pela
   * fila de registros, como qualquer mudança. */
  await pagA.evaluate(() => Store.carregar().then(d => { const a = d.alunos.find(x => x.id === 'alfa'); a.telefone = 'apto 12, 98765-4321'; a.obs = 'Contato: (11) 98765-4321'; return Store.salvar(d); }));
  const sA2 = await sincronizar(pagA);
  conf('o tablet subiu o aluno', sA2.erroE === null && sA2.enviados > 0, true);
  await soltarRelogio(pagC);
  await pagC.evaluate(() => Nuvem.receberRegistros());
  const chegou = await esperar('o celular recebeu o telefone novo do Alfa', () => pagC.evaluate(() => Store.carregar().then(d => d.alunos.find(x => x.id === 'alfa').telefone)), v => v === 'apto 12, 98765-4321', 15000);
  conf('(arranjo) o telefone novo chegou ao celular', chegou.ok, true);
  const avT = await momento(pagC, '2026-10-06', '14:50');
  const cobT = avT.find(a => a.tipo === 'cobrar') || {};
  console.log('   ' + JSON.stringify(cobT));
  prop('sem telefone válido no campo, o aviso de cobrar não tem link e diz por quê (' + cobT.texto + ' ; ' + (cobT.link || 'sem link') + ')',
    !cobT.link && !(await existe(pagC, '#cel-aviso-cobrar')) && cobT.texto === 'Em aberto: Aluno Alfa Teste, julho de 2026, R$ 150,00. Sem celular na ficha para o WhatsApp. E mais 1 família', V_TELEFONE);
  seVeneno(V_TELEFONE);

  secao('10. O toque em "falta registrar" abre o registro daquela aula, e salvar tira o aviso');
  conf('o toque abre o "Registrar como foi" da aula do Alfa de ontem', (await clicar(pagC, '#cel-aviso-registrar')) + ' ' + (await existe(pagC, '#cel-relato-texto')) + ' ' +
    (await pagC.evaluate(() => (document.querySelector('#cel-hoje h2.cel-titulo + .ajuda') || {}).textContent)), 'true true Aluno Alfa Teste, 05/10/2026, 10:00');
  await digitar(pagC, '#cel-relato-texto', 'Frações equivalentes, de teste.');
  await clicar(pagC, '#cel-relato-salvar');
  const salvou = await esperar('o relato gravou', () => pagC.evaluate(() => Store.carregar().then(d => d.aulas.find(a => a.id === 'alfa-1005').notaTexto)), v => v === 'Frações equivalentes, de teste.', 10000);
  conf('o relato gravou na aula', salvou.ok, true);
  const avR = await momento(pagC, '2026-10-06', '14:50');
  conf('registrada, a aula sai dos avisos (' + tipos(avR) + ')', tipos(avR), 'proxima,cobrar');

  secao('11. O tablet não muda');
  await H.abrirApp(pagA, amb.ORIGEM);
  conf('o tablet não tem avisos do celular', await pagA.evaluate(() => !document.body.classList.contains('modo-celular') && !document.querySelector('.cel-aviso')), true);
  await aba(pagC, 'fechamento');
  conf('(arranjo) o celular vai a junho de 2026', await mesNoCelular(pagC, '2026-06'), true);
  await mesNoTablet(pagA, '2026-06');
  const cartaoJ = fmt(await texto(pagC, '.cel-fechamento-aluno[data-aluno="ref"] .ajuda'));
  const totalJ = await pagA.evaluate(() => { const n = Array.from(document.querySelectorAll('#numeros-fechamento .numero')).find(x => (x.querySelector('.rotulo') || {}).textContent === 'Total a receber');
    return n ? n.querySelector('.valor').textContent.replace(/\u00a0/g, ' ') : null; });
  const dadoJ = await pagA.evaluate(() => Store.carregar().then(d => { const f = Core.calcularMesInteiro(d, '2026-06').find(x => x.aluno.id === 'ref');
    return [f.linhas.length, Core.fmtHoras(f.totalMin), Core.fmtMoeda(f.totalValor).replace(/\u00a0/g, ' ')].join(' | '); }));
  conf('junho de referência: 10 encontros, 10:30, R$ 1.050,00 no núcleo, no celular e no tablet (' + dadoJ + ' ; ' + cartaoJ + ' ; ' + totalJ + ')',
    dadoJ + ' ; ' + cartaoJ + ' ; ' + totalJ, '10 | 10:30 | R$ 1.050,00 ; 10 aulas dadas · 10:30 h · R$ 1.050,00 ; R$ 1.050,00');

  secao('12. Sem erro de página, e o veneno pedido foi visto');
  conf('nenhum erro de página no tablet, no celular e no observador', [pagA, pagC, pagD].map(p => p.errosDePagina.join(' | ')).filter(Boolean).join(' || '), '');
  if (MODO) conf('o veneno ' + MODO + ' foi visto antes do fim', false, true);
  await ctxD.close();
  await ctxC.close();
})().then(() => derrubarEmulador().then(H.fim(amb)), e => derrubarEmulador().then(() => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e))));
