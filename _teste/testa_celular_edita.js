/* testa_celular_edita.js
 *
 * D6, parte 2: o celular DA DONA edita em quatro ações, contra o Firebase
 * Emulator Suite (Auth e Firestore), com um tablet (1280 px) e um celular
 * (390 x 844) da mesma conta, e um observador de outra conta (390 x 844).
 *
 * O que prova, com dados fictícios:
 *   1. o celular da dona traz a cópia e fica com a marca "este aparelho é
 *      celular": edita pelos registros e nunca envia a cópia completa;
 *   2. as quatro ações, pela tela, em 390 x 844, com todo alvo de pelo menos
 *      48 px e sem rolagem de lado: marcar aula num dia escolhido, cancelar
 *      aula (com Desfazer), "Registrar como foi" (situação, relato e assunto
 *      dado), cadastrar aluno (o essencial) e o "pago em" no Fechamento;
 *   3. cada uma grava no aparelho com a entrada da fila na mesma gravação,
 *      sobe pelo sincronizar e chega ao tablet, que a recebe ao abrir;
 *   4. o fechamento do tablet bate com o do celular depois do "pago em";
 *   5. a aula cancelada no celular aparece cancelada no tablet (o dado e a
 *      linha do Fechamento dele);
 *   6. sem sinal, a edição fica na fila e o alto diz "N mudanças esperando
 *      sinal"; com o sinal de volta, sobe sozinha;
 *   7. o celular nunca envia a cópia completa: zero escritas em copias/ e em
 *      estado/copia vindas dele (fechar, voltar, a diária, o pedido direto),
 *      com o controle positivo do tablet visto pelo mesmo instrumento;
 *   8. o celular não grava fora das quatro ações: tudo o que subiu dele é um
 *      registro das ações (nenhum ajuste), e os caminhos do tablet (folha,
 *      "Apagar tudo", excluir aluno) continuam recusados nele;
 *   9. o observador de outra conta não vê nenhum botão de edição e não
 *      grava nada.
 *
 * Venenos, que TÊM de reprovar a propriedade (a rodada passa quando a prova
 * VÊ o veneno):
 *   --envenenado-celular-envia-copia  a trava da cópia confunde o celular da
 *                         dona com o tablet (nuvem.js) e o fechar do celular
 *                         monta e manda a cópia (app.js);
 *   --envenenado-observador-edita     o celular "da dona" deixa de conferir a
 *                         conta: o observador de outra conta ganha as ações.
 *
 * Portas: 8941 (app), 8943 (auth), 8944 (firestore), 8945 (hub), 8946 (log),
 * 8947 (websocket). Precisa do firebase-tools e de um JDK 21 em JAVA_HOME.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const MODOS = ['--envenenado-celular-envia-copia', '--envenenado-observador-edita', '--envenenado-corte-sobe'];
const MODO = MODOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
function prop(rotulo, ok, veneno) {
  if (MODO && MODO === veneno) return conf('VENENO visto: ' + rotulo + ', e quebrou', ok, false);
  return conf(rotulo, ok, true);
}
function fimDoVeneno() { throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true }); }

const PORTA_APP = 8941, PORTA_AUTH = 8943, PORTA_FS = 8944, PORTA_HUB = 8945, PORTA_LOG = 8946, PORTA_WS = 8947;
const PROJETO = 'demo-nath-d6b';
const AUTH = 'http://127.0.0.1:' + PORTA_AUTH;
const FS = 'http://127.0.0.1:' + PORTA_FS;
const FIREBASE = process.env.FIREBASE_TOOLS ||
  'C:/Users/romul/ferramentas/firebase-tools/node_modules/firebase-tools/lib/bin/firebase.js';
const JAVA_HOME = process.env.JAVA_HOME || '';
const DONA = { email: 'dona@exemplo.test', senha: 'senha-da-dona-1' };
const OBS = { email: 'observador@exemplo.test', senha: 'senha-do-observador-1' };

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const NUVEM = fs.readFileSync(path.join(H.RAIZ, 'nuvem.js'), 'utf8');
const STORE = fs.readFileSync(path.join(H.RAIZ, 'store.js'), 'utf8');
const REGRAS = fs.readFileSync(path.join(H.RAIZ, 'firestore.rules'), 'utf8');

secao('0. As âncoras, os venenos e o ambiente');
const TRAVA_COPIA = 'function podeEnviarCopia() { return !marcaCelular && !travadoNestaAbertura; }';
// (D7) o celular da dona sobe também o diagnóstico do PRÓPRIO aparelho (só metadados), e nada mais
const COMMIT = 'if (!podeEnviarCopia() && !(celularDaDona() && (soRegistros(escritas) || soDiagnosticoProprio(escritas)))) return Promise.reject(recusaSoLeitura());';
const FECHAR_CELULAR = 'if (celularEdita()) { Nuvem.enviarRegistrosSeDevido({ versaoApp: VERSAO }); return; }';
const DONA_NUVEM = 'return !!(marcaCelular && sessao && sessao.uid && (!marcaCelular.uidDona || marcaCelular.uidDona === sessao.uid));';
const DONA_APP = 'return modoCelular && temNuvem() && Nuvem.celularDaDona() && !leOutraConta();';
const DONA_PORTAS = 'var dona = deve && temNuvem() && Nuvem.celularDaDona() && !leOutraConta();';
const PORTA_STORE = "if (modo === 'readwrite' && soLeitura && porta !== true && !(celularEdita && PORTAS_DO_CELULAR[porta])) throw erroSoLeitura();";
conf('a trava da cópia completa está num lugar só', NUVEM.split(TRAVA_COPIA).length, 2);
conf('o commit recusa no celular tudo o que não for registro ou o diagnóstico do próprio aparelho, num lugar só', NUVEM.split(COMMIT).length, 2);
conf('o fechar do celular da dona sobe só os registros, num lugar só', APP.split(FECHAR_CELULAR).length, 2);
conf('o celular da dona confere a conta no nuvem.js e no app.js, cada um num lugar só',
  NUVEM.split(DONA_NUVEM).length === 2 && APP.split(DONA_APP).length === 2 && APP.split(DONA_PORTAS).length === 2, true);
conf('a porta das transações do celular está num lugar só', STORE.split(PORTA_STORE).length, 2);
conf('o salvar() do celular só grava dentro de uma das ações', APP.indexOf('if (aparelhoSoLe() && !(gravacaoDoCelular > 0 && celularEdita())) {') > 0, true);
const trocas = {};
if (MODO === MODOS[0]) {
  trocas['/nuvem.js'] = NUVEM.replace(TRAVA_COPIA, 'function podeEnviarCopia() { return (!marcaCelular && !travadoNestaAbertura) || celularDaDona(); }');
  trocas['/app.js'] = APP.replace(FECHAR_CELULAR, 'if (celularEdita()) { Nuvem.enviarRegistrosSeDevido({ versaoApp: VERSAO }); ' +
    'Store.exportarTudoZip(db).then(function (z) { return Nuvem.enviarCopia(z, { motivo: motivo, conteudo: true }); }).catch(function () {}); return; }');
}
if (MODO === MODOS[1]) {
  trocas['/nuvem.js'] = NUVEM.replace(DONA_NUVEM, 'return !!(marcaCelular && sessao && sessao.uid);');
  trocas['/app.js'] = APP.replace(DONA_APP, 'return modoCelular && temNuvem() && Nuvem.celularDaDona();')
    .replace(DONA_PORTAS, 'var dona = deve && temNuvem() && Nuvem.celularDaDona();');
}
/* O corte dos pagamentos que o celular pôs na memória volta a subir com a ação seguinte. */
const SEM_CORTE = 'var p = Store.salvar(semCorteDoCelular(dbParaGravar()));';
conf('o salvar() tira o corte que o celular pôs só na memória, num lugar só', APP.split(SEM_CORTE).length, 2);
if (MODO === MODOS[2]) { trocas['/app.js'] = APP.replace(SEM_CORTE, 'var p = Store.salvar(dbParaGravar());'); trocas['/nuvem.js'] = NUVEM + '\n'; }
if (MODO) conf('os arquivos servidos ficaram diferentes do repositório (' + MODO + ')', trocas['/nuvem.js'] !== NUVEM && trocas['/app.js'] !== APP, true);

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
const PASTA = path.join(os.tmpdir(), 'nath_d6b_emulador_' + process.pid);
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
const docUrl = (uid, rel) => FS + '/v1/projects/' + PROJETO + '/databases/(default)/documents/usuarios/' + uid + (rel ? '/' + rel : '');

const CFG = { auth: AUTH, firestore: FS, projectId: PROJETO };
const amb = H.criarAmbiente(PORTA_APP, 'nath_d6b_celular_edita', trocas);

/* A página e os instrumentos: as escritas na nuvem que saem dela (o nome de
 * cada documento escrito, lido do corpo do commit), as transações de escrita
 * no banco e os avisos. */
async function prepararPagina(pag, movel) {
  pag.setDefaultTimeout(60000);
  if (movel) await pag.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  pag.errosDePagina = [];
  pag.on('pageerror', e => pag.errosDePagina.push(e.message));
  pag.dialogos = [];
  pag.on('dialog', async d => { pag.dialogos.push(d.message()); try { await d.accept(); } catch (e) { /* ok */ } });
  /* Os commits que saem, contados por fora (o pedido na rede) e lidos por
   * dentro (o corpo, no fetch da página, guardado no sessionStorage da aba
   * para sobreviver às recargas): o corpo grande da cópia não vem inteiro
   * pelo protocolo do navegador. As duas contas têm de bater. */
  pag.commitsNaRede = 0;
  pag.outrasEscritas = []; // PATCH ou DELETE soltos no Firestore (o app não usa; se aparecer, conta)
  pag.on('request', r => {
    const u = r.url();
    if (u.indexOf(FS) !== 0) return;
    if (/:commit\b/.test(u) && r.method() === 'POST') pag.commitsNaRede++; // o OPTIONS do CORS não conta
    else if (r.method() === 'PATCH' || r.method() === 'DELETE') pag.outrasEscritas.push(r.method() + ' ' + u);
  });
  await pag.evaluateOnNewDocument(() => {
    const ler = () => { try { return JSON.parse(sessionStorage.getItem('__commits') || '[]'); } catch (e) { return ['sessionStorage ilegível']; } };
    const original = window.fetch;
    window.fetch = function (url, opcoes) {
      if (/:commit\b/.test(String(url))) {
        const lista = ler();
        let corpo = null;
        try { corpo = JSON.parse((opcoes && opcoes.body) || 'null'); } catch (e) { corpo = null; }
        const nomes = corpo && Array.isArray(corpo.writes)
          ? corpo.writes.map(w => (w.update && w.update.name) || w.delete || 'escrita sem nome') : ['commit ilegível'];
        lista.push(nomes);
        try { sessionStorage.setItem('__commits', JSON.stringify(lista)); } catch (e) { /* memória */ }
      }
      return original.apply(this, arguments);
    };
  });
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
    try { window.__avisos = JSON.parse(sessionStorage.getItem('__avisos') || '[]'); } catch (e) { window.__avisos = []; }
    document.addEventListener('DOMContentLoaded', () => {
      const alvo = document.querySelector('#aviso-texto');
      if (!alvo) return;
      new MutationObserver(() => {
        window.__avisos.push(alvo.textContent);
        try { sessionStorage.setItem('__avisos', JSON.stringify(window.__avisos)); } catch (e) { /* memória */ }
      }).observe(alvo, { childList: true, characterData: true, subtree: true });
    });
  });
}
const ehCopia = n => /\/copias\//.test(n) || /\/estado\/copia$/.test(n);
const commitsLidos = pag => pag.evaluate(() => { try { return JSON.parse(sessionStorage.getItem('__commits') || '[]'); } catch (e) { return [['sessionStorage ilegível']]; } });
const escritasLidas = async pag => [].concat.apply([], await commitsLidos(pag));
const escritasDeCopia = async pag => (await escritasLidas(pag)).filter(ehCopia);
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
  enviados: r.enviados.enviados, erroE: r.enviados.erro ? r.enviados.erro.codigo : null, pulado: r.enviados.pulado || null })));
/* O tablet recebe AO ABRIR: reabre a página e espera a condição no banco dele. */
async function tabletAbreERecebe(pag, rotulo, condicao, arg) {
  await H.abrirApp(pag, amb.ORIGEM);
  return esperar(rotulo, () => pag.evaluate(new Function('arg', 'return Store.carregar().then(function (d) { return (' + condicao + ')(d, arg); });'), arg), v => v === true, 30000);
}
const fila = pag => pag.evaluate(() => Store.lerFila().then(l => l.map(e => e.id)));
const filaVazia = pag => esperar('a fila do celular esvaziou', () => pag.evaluate(() => Store.lerFila().then(l => l.length)), v => v === 0, 20000);

/* O que está à vista no celular, medido: rolagem de lado, alvos de 48 px e os
 * botões de edição (os das quatro ações vêm marcados com data-acao-celular). */
const RE_EDICAO = 'registrar|corrigir|editar|salvar|excluir|apagar|nova aula|novo aluno|^\\s*\\+|desmarcar|marcar|cancelar a aula|cancelar aula|cadastrar|pago|anotar|alterar|confirmar';
const medirTela = (pag) => pag.evaluate((reEdicao) => {
  const re = new RegExp(reEdicao, 'i');
  const visivel = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  const raiz = document.querySelector('#modo-celular');
  const alvos = Array.from(raiz.querySelectorAll('button, a[href], input, select, textarea, [role=button], summary')).filter(visivel);
  const pequenos = alvos.filter(e => { const r = e.getBoundingClientRect(); return r.height < 48 || r.width < 48; })
    .map(e => (e.id || e.className || e.textContent.trim().slice(0, 30)) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
  const botoes = Array.from(raiz.querySelectorAll('button')).filter(visivel).filter(b => re.test(b.textContent));
  const dasAcoes = botoes.filter(b => b.closest('[data-acao-celular]')).map(b => b.textContent.trim());
  const soltos = botoes.filter(b => !b.closest('[data-acao-celular]')).filter(b => !b.closest('#cel-entrada')).map(b => b.textContent.trim());
  const campos = Array.from(raiz.querySelectorAll('input, select, textarea')).filter(visivel)
    .filter(e => !e.closest('#cel-entrada') && !e.hasAttribute('data-consulta')).map(e => e.id || e.tagName);
  const conteudo = document.querySelector('#cel-conteudo');
  return {
    largura: window.innerWidth,
    rolaDeLado: document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth ||
      (conteudo && conteudo.scrollWidth > conteudo.clientWidth),
    alvos: alvos.length, pequenos, dasAcoes, soltos, campos, celular: document.body.classList.contains('modo-celular')
  };
}, RE_EDICAO);

function isoDe(d) { const p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
const AGORA = new Date();
const HOJE = isoDe(AGORA);
const MES = HOJE.slice(0, 7);
/* Um outro dia do MESMO mês (o Fechamento do tablet é o do mês corrente). */
/* Aulas AGENDADAS (data à frente): só elas se cancelam no celular. Perto do
 * fim do mês caem no seguinte, e a linha do Fechamento do tablet (o mês
 * corrente) só é conferida quando a data é deste mês. */
const OUTRO = (() => { const d = new Date(AGORA); d.setDate(d.getDate() + 1); return isoDe(d); })();
const TERCEIRO = (() => { const d = new Date(AGORA); d.setDate(d.getDate() + 2); return isoDe(d); })();
const ONTEM = (() => { const d = new Date(AGORA); d.setDate(d.getDate() - 1); return isoDe(d); })();

(async function () {
  secao('1. O tablet da dona cria a agenda fictícia, sobe a cópia e os registros, e permite o observador');
  await subirEmulador();
  const dona = (await criarUsuario(DONA)).json;
  const obs = (await criarUsuario(OBS)).json;
  conf('as contas da dona e do observador existem no emulador', !!(dona && dona.localId && obs && obs.localId), true);
  await amb.subir();
  const pagA = await amb.pagina();
  await prepararPagina(pagA, false);
  await H.abrirApp(pagA, amb.ORIGEM);
  await pagA.evaluate(async (hoje, outro, terceiro, ontem) => {
    const d = Store.bancoVazio();
    d.alunos = [{ id: 'alfa', nome: 'Aluno Alfa Teste', ativo: true, cor: '#1F3A5F', responsavel: 'Responsável Alfa Teste',
      precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 100 }], mapeamentos: [] }];
    d.aulas = [
      { id: 'aula-ontem', alunoId: 'alfa', serieId: null, data: ontem, hora: '09:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: 'Rendeu bem', anexos: [] },
      { id: 'aula-hoje', alunoId: 'alfa', serieId: null, data: hoje, hora: '10:30', duracaoMin: 90, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] },
      { id: 'aula-outro', alunoId: 'alfa', serieId: null, data: outro, hora: '09:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] },
      { id: 'aula-terceiro', alunoId: 'alfa', serieId: null, data: terceiro, hora: '11:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] }
    ];
    d.ajustes = { chavePix: 'pix-de-teste' };
    await Store.salvar(d);
  }, HOJE, OUTRO, TERCEIRO, ONTEM);
  await H.abrirApp(pagA, amb.ORIGEM);
  conf('o tablet entrou', await entrarPelaTela(pagA, DONA.email, DONA.senha), true);
  await clicar(pagA, '#nuvem-enviar');
  conf('a cópia do tablet subiu', (await esperar('a cópia subiu', () => texto(pagA, '#nuvem-ultima'), v => /^Última cópia na nuvem: hoje/.test(v || ''), 30000)).ok, true);
  const sA = await sincronizar(pagA);
  conf('o tablet subiu os registros', sA.enviados > 0 && sA.erroE === null, true);
  conf('(controle positivo) o instrumento vê as escritas de cópia do tablet', (await escritasDeCopia(pagA)).length > 0, true);
  conf('(controle) os commits lidos por dentro são os que saíram na rede', (await commitsLidos(pagA)).length, pagA.commitsNaRede);
  await pagA.evaluate(u => Nuvem.permitirLeitor(u), obs.localId);
  conf('o tablet permitiu o observador', await pagA.evaluate(() => Nuvem.leitores().then(l => l.length)), 1);

  secao('2. O celular da dona traz a cópia e fica com a marca "este aparelho é celular"');
  const ctxC = await pagA.browser().createBrowserContext();
  const pagC = await ctxC.newPage();
  await prepararPagina(pagC, true);
  await abrirCelular(pagC);
  conf('o celular entrou com a conta da dona', await entrarNoCelular(pagC, DONA), true);
  conf('trouxe a cópia do tablet', await trazerCopiaNoCelular(pagC), true);
  conf('a pergunta diz o que o celular edita e que a cópia completa sai só do tablet',
    pagC.dialogos.some(d => /marca e cancela aula, registra como foi, cadastra aluno e marca o pago/.test(d) && /A cópia completa continua saindo só do tablet/.test(d)), true);
  const est = await pagC.evaluate(() => { const e = Nuvem.estado(); return { celular: e.celular, dona: e.celularDaDona, observador: e.observador, automatica: e.automatica }; });
  conf('a marca: celular, da dona, não observador, a automática desligada', JSON.stringify(est), JSON.stringify({ celular: true, dona: true, observador: false, automatica: false }));
  conf('a marca continua guardada na chave de antes (a versão anterior a lê e não envia a cópia)', await pagC.evaluate(() => new Promise(r => {
    const q = indexedDB.open('apoio-nuvem');
    q.onsuccess = () => { const g = q.result.transaction('estado', 'readonly').objectStore('estado').get('soLeitura'); g.onsuccess = () => { q.result.close(); r(!!(g.result && g.result.uidDona)); }; };
  })), true);
  conf('o alto diz o que este celular edita', await texto(pagC, '#cel-regra'), 'Aqui: marcar e cancelar aula, registrar como foi, aluno novo e pago. O resto, no tablet.');
  conf('a restauração no celular não enfileirou nada', (await fila(pagC)).length, 0);
  const idCelular = await pagC.evaluate(() => Store.aparelho());

  secao('3. Hoje em 390 x 844: as ações à vista, alvos de 48 px, sem rolagem de lado');
  let m = await medirTela(pagC);
  conf('Hoje: sem rolagem de lado em ' + m.largura + ' px', m.rolaDeLado, false);
  conf('Hoje: todo alvo tem 48 px ou mais (' + m.alvos + ' alvos)', m.pequenos.join('; '), '');
  conf('Hoje: os botões de edição são todos das quatro ações (' + m.dasAcoes.join(', ') + ')', m.soltos.join(', '), '');
  conf('Hoje: "Marcar aula neste dia", "Ver ou corrigir como foi" e "Cadastrar aluno" à vista',
    ['Marcar aula neste dia', 'Ver ou corrigir como foi', 'Cadastrar aluno'].every(t => m.dasAcoes.indexOf(t) >= 0), true);
  conf('a aula de hoje, Realizada, não oferece "Cancelar aula" (só a agendada se cancela)', await existe(pagC, '.cel-aula[data-aula="aula-hoje"] .cel-cancelar'), false);
  conf('nenhum "Enviar cópia agora" no celular', await pagC.evaluate(() => { const b = document.querySelector('#nuvem-enviar'); return !!(b && b.getBoundingClientRect().height); }), false);

  secao('4. Marcar aula num dia escolhido');
  await digitar(pagC, '#cel-dia', TERCEIRO);
  conf('o dia escolhido aparece em Hoje', /11:00 Aluno Alfa Teste/.test(await texto(pagC, '#cel-hoje')), true);
  await clicar(pagC, '#cel-marcar-aula');
  m = await medirTela(pagC);
  conf('o formulário de marcar: alvos de 48 px e sem rolagem de lado', m.pequenos.join('; ') + (m.rolaDeLado ? ' rola' : ''), '');
  conf('o formulário traz o dia escolhido', await pagC.evaluate(() => document.querySelector('#cel-aula-data').value), TERCEIRO);
  await digitar(pagC, '#cel-aula-hora', '14:00');
  await clicar(pagC, '#cel-aula-salvar');
  const marcada = await esperar('a aula marcada gravou', () => pagC.evaluate(d => Store.carregar().then(b => {
    const a = b.aulas.find(x => x.data === d && x.hora === '14:00'); return a ? a.id : null; }), TERCEIRO), v => !!v, 10000);
  conf('a aula nova está no banco do celular', marcada.ok, true);
  const idMarcada = marcada.valor;
  conf('e a entrada dela entrou na fila na mesma gravação', (await fila(pagC)).indexOf('aula:' + idMarcada) >= 0, true);
  conf('Hoje voltou ao dia da aula, com ela', /14:00 Aluno Alfa Teste/.test(await texto(pagC, '#cel-hoje')), true);

  secao('5. Cancelar aula, com Desfazer');
  await digitar(pagC, '#cel-dia', OUTRO);
  conf('a aula agendada oferece "Cancelar aula", e não "Registrar como foi"', (await existe(pagC, '.cel-aula[data-aula="aula-outro"] .cel-cancelar')) &&
    !(await existe(pagC, '.cel-aula[data-aula="aula-outro"] .cel-registrar')), true);
  await clicar(pagC, '.cel-aula[data-aula="aula-outro"] .cel-cancelar');
  conf('cancelou no celular', (await esperar('a aula ficou cancelada', () => pagC.evaluate(() => Store.carregar().then(b => b.aulas.find(a => a.id === 'aula-outro').status)), v => v === 'cancelada', 10000)).ok, true);
  conf('o aviso traz o Desfazer', await pagC.evaluate(() => { const b = document.querySelector('#aviso-acao'); return b && b.style.display !== 'none' ? b.textContent : null; }), 'Desfazer');
  conf('o aviso fica entre o conteúdo e as abas: não cobre nenhum dos dois', await pagC.evaluate(() => {
    const a = document.querySelector('#aviso').getBoundingClientRect(), c = document.querySelector('#cel-conteudo').getBoundingClientRect(), b = document.querySelector('#cel-abas').getBoundingClientRect();
    return a.height > 0 && a.top >= c.bottom - 1 && a.bottom <= b.top + 1; }), true);
  await clicar(pagC, '#aviso-acao');
  conf('o Desfazer do celular volta a aula', (await esperar('a aula voltou', () => pagC.evaluate(() => Store.carregar().then(b => b.aulas.find(a => a.id === 'aula-outro').status)), v => v === 'realizada', 10000)).ok, true);
  await clicar(pagC, '.cel-aula[data-aula="aula-outro"] .cel-cancelar');
  const cancelada = await esperar('cancelada de novo', () => pagC.evaluate(() => Store.carregar().then(b => { const a = b.aulas.find(x => x.id === 'aula-outro'); return a.status + '/' + a.cobravel; })), v => v === 'cancelada/false', 10000);
  conf('cancelada de novo, sem cobrança (o mesmo "Cancelar aula" do Fechamento do tablet)', cancelada.ok, true);

  secao('6. "Registrar como foi": situação, relato e assunto dado');
  await clicar(pagC, '#cel-dia-hoje');
  await clicar(pagC, '.cel-aula[data-aula="aula-hoje"] .cel-registrar');
  conf('abrir o formulário tira o aviso da ação anterior (o "Aula cancelada" não aparece sobre o registro)', await existe(pagC, '#aviso.aberto'), false);
  m = await medirTela(pagC);
  conf('o formulário do relato: alvos de 48 px e sem rolagem de lado', m.pequenos.join('; ') + (m.rolaDeLado ? ' rola' : ''), '');
  await digitar(pagC, '#cel-relato-texto', 'Relato escrito no celular');
  await digitar(pagC, '#cel-relato-assunto', 'Frações equivalentes');
  await clicar(pagC, '#cel-relato-salvar');
  const relato = await esperar('o relato gravou', () => pagC.evaluate(() => Store.carregar().then(b => {
    const a = b.aulas.find(x => x.id === 'aula-hoje'); return a.notaTexto + '/' + (a.temas || []).map(t => t.titulo).join(','); })), v => v === 'Relato escrito no celular/Frações equivalentes', 10000);
  conf('o relato e o assunto estão na aula do celular', relato.ok, true);

  secao('7. Cadastrar aluno: o essencial');
  await clicar(pagC, '#cel-novo-aluno');
  conf('o cadastro abre sem o aviso "Aula salva." da ação anterior', await existe(pagC, '#aviso.aberto'), false);
  conf('a tela diz que o resto fica no tablet', /se completam no tablet/.test(await texto(pagC, '#cel-aluno-resto')), true);
  m = await medirTela(pagC);
  conf('o formulário do aluno: alvos de 48 px e sem rolagem de lado', m.pequenos.join('; ') + (m.rolaDeLado ? ' rola' : ''), '');
  conf('o formulário tem só nome, responsável, contato e preço', m.campos.join(','), 'cel-aluno-nome,cel-aluno-responsavel,cel-aluno-contato,cel-aluno-preco');
  await digitar(pagC, '#cel-aluno-nome', 'Aluno Beta Teste');
  await digitar(pagC, '#cel-aluno-responsavel', 'Responsável Beta Teste');
  await digitar(pagC, '#cel-aluno-contato', 'telefone fictício 0000');
  await digitar(pagC, '#cel-aluno-preco', '120,00');
  await clicar(pagC, '#cel-aluno-salvar');
  const beta = await esperar('o aluno gravou', () => pagC.evaluate(() => Store.carregar().then(b => { const a = b.alunos.find(x => x.nome === 'Aluno Beta Teste'); return a ? a.id : null; })), v => !!v, 10000);
  conf('o aluno novo está no celular', beta.ok, true);
  conf('o aviso do cadastro diz "Aluno cadastrado."', /^Aluno cadastrado\./.test((await texto(pagC, '#aviso-texto')) || ''), true);
  const idBeta = beta.valor;

  secao('8. "Pago em" no Fechamento, por aluno e por mês');
  await clicar(pagC, '#cel-abas .cel-aba[data-cel="fechamento"]');
  await pausa(200);
  m = await medirTela(pagC);
  conf('Fechamento: alvos de 48 px e sem rolagem de lado', m.pequenos.join('; ') + (m.rolaDeLado ? ' rola' : ''), '');
  conf('Fechamento: os botões de edição são só os do "pago em" (' + m.dasAcoes.join(', ') + ')', m.soltos.join(', '), '');
  if (TERCEIRO.slice(0, 7) === MES) {
    const futuras = (await texto(pagC, '.cel-fechamento-aluno[data-aluno="alfa"] .cel-linhas-futuras')) || '';
    conf('as aulas agendadas ficam à parte, marcadas "ainda não dada" (' + futuras + ')', /ainda não dada/.test(futuras) && !/Realizada/.test(futuras), true);
    conf('e as dadas, na lista de cima, não levam a marca', /ainda não dada/.test((await texto(pagC, '.cel-fechamento-aluno[data-aluno="alfa"] .cel-linhas:not(.cel-linhas-futuras)')) || ''), false);
  }
  await clicar(pagC, '.cel-fechamento-aluno[data-aluno="alfa"] .btn-marcar-pago');
  const proposto = await pagC.evaluate(m => Store.carregar().then(d => {
    const f = Core.calcularMesInteiro(d, m).find(x => x.aluno.id === 'alfa');
    const campo = document.querySelector('.cel-fechamento-aluno[data-aluno="alfa"] .pagamento-valor');
    return { campo: campo && campo.value, total: Core.fmtMoeda(f.totalValor).replace(/^R\$\s*/, ''), soma: (document.querySelector('.cel-proposto-soma') || {}).textContent || '',
      fechar: (document.querySelector('.cel-fechamento-aluno[data-aluno="alfa"] .btn-cancelar-pagamento') || {}).textContent }; }), MES);
  conf('o valor proposto é o do tablet, o total do mês (' + proposto.total + ')', proposto.campo, proposto.total);
  conf('e diz o que soma: as aulas dadas e as ainda não dadas (' + proposto.soma + ')', /do mês: R\$\s?[\d.,]+ das? \d+ aulas? dadas?/.test(proposto.soma), true);
  conf('o "Cancelar" do pago em diz "Fechar sem marcar"', proposto.fechar, 'Fechar sem marcar');
  m = await medirTela(pagC);
  conf('o "pago em" aberto: alvos de 48 px e sem rolagem de lado', m.pequenos.join('; ') + (m.rolaDeLado ? ' rola' : ''), '');
  await digitar(pagC, '.cel-fechamento-aluno[data-aluno="alfa"] .pagamento-valor', '250,00');
  await digitar(pagC, '.cel-fechamento-aluno[data-aluno="alfa"] .pagamento-data', HOJE);
  await clicar(pagC, '.cel-fechamento-aluno[data-aluno="alfa"] .btn-confirmar-pagamento');
  const pago = await esperar('o pagamento gravou', () => pagC.evaluate(m => Store.carregar().then(b => {
    const p = (b.pagamentos || []).find(x => x.alunoId === 'alfa' && x.mes === m); return p ? p.pagoEm + '/' + p.valor : null; }), MES), v => v === HOJE + '/250', 10000);
  conf('o pagamento está no celular', pago.ok, true);
  conf('a linha diz "Pago em", com o valor', /Pago em .* R\$\s?250,00/.test(await texto(pagC, '.cel-fechamento-aluno[data-aluno="alfa"] .linha-pagamento')), true);
  conf('nenhum "Este celular só lê" nas quatro ações', await pagC.evaluate(() => window.__avisos.filter(t => /só lê/.test(t)).length), 0);

  secao('9. Tudo sobe pelo sincronizar e chega ao tablet, que recebe ao abrir');
  const sC = await sincronizar(pagC);
  conf('o celular sincronizou sem erro (o que faltava subir, subiu: ' + sC.enviados + ')', sC.erroE === null && sC.erroR === null, true);
  conf('a fila do celular zerou', (await filaVazia(pagC)).ok, true);
  const chegou = await tabletAbreERecebe(pagA, 'o tablet recebeu tudo ao abrir', function (d, a) {
    const nova = d.aulas.find(x => x.id === a.idMarcada);
    const outro = d.aulas.find(x => x.id === 'aula-outro');
    const hoje = d.aulas.find(x => x.id === 'aula-hoje');
    const beta = d.alunos.find(x => x.id === a.idBeta);
    const p = (d.pagamentos || []).find(x => x.alunoId === 'alfa' && x.mes === a.mes);
    return !!(nova && nova.hora === '14:00' && outro && outro.status === 'cancelada' && hoje && hoje.notaTexto === 'Relato escrito no celular' &&
      beta && p && p.valor === 250);
  }.toString(), { idMarcada, idBeta, mes: MES });
  conf('as quatro ações chegaram ao tablet ao abrir', chegou.ok, true);
  const noTablet = await pagA.evaluate((a) => Store.carregar().then(d => {
    const nova = d.aulas.find(x => x.id === a.idMarcada), hoje = d.aulas.find(x => x.id === 'aula-hoje'), beta = d.alunos.find(x => x.id === a.idBeta);
    return { nova: nova && [nova.data, nova.hora, nova.duracaoMin, nova.alunoId].join(' '), temas: (hoje.temas || []).map(t => t.titulo).join(','),
      beta: beta && [beta.nome, beta.responsavel, beta.obs, beta.precos.map(p => p.valorHora + '@' + p.inicio).join(',')].join(' | ') };
  }), { idMarcada, idBeta });
  conf('marcar aula: a aula do celular no tablet, com data, hora, duração e aluno', noTablet.nova, TERCEIRO + ' 14:00 60 alfa');
  conf('"Registrar como foi": o assunto dado chegou ao tablet', noTablet.temas, 'Frações equivalentes');
  conf('cadastrar aluno: o aluno do celular no tablet, com o essencial', noTablet.beta, 'Aluno Beta Teste | Responsável Beta Teste | Contato: telefone fictício 0000 | 120@' + HOJE);
  await H.irParaAba(pagA, 'fechamento');
  await pausa(400);
  if (OUTRO.slice(0, 7) === MES) {
    const linhaCancelada = await texto(pagA, 'tr[data-aula-fechamento="aula-outro"]');
    conf('a aula cancelada no celular aparece cancelada no Fechamento do tablet (' + (linhaCancelada || 'sem linha') + ')', /Cancelada/.test(linhaCancelada || '') && /não cobrada/.test(linhaCancelada || ''), true);
  } else console.log('   (a aula de amanhã é do mês seguinte: a linha do Fechamento do tablet não é conferida hoje; o dado, sim)');
  /* O fechamento do tablet bate com o do celular: as somas do mês e a
   * situação do pagamento, calculadas pelo mesmo Core em cada aparelho. */
  const retratoFechamento = pag => pag.evaluate(mes => Store.carregar().then(d => Core.calcularMesInteiro(d, mes).map(f => {
    const s = Core.situacaoDoPagamento(d, f);
    return [f.aluno.id, f.qtdEncontrosFeitos, f.valorFeito, f.totalValor, s.registro ? s.registro.pagoEm + '@' + s.registro.valor : '-', s.falta].join(' ');
  }).sort().join(' || ')), MES);
  const fA = await retratoFechamento(pagA), fC = await retratoFechamento(pagC);
  console.log('   fechamento no tablet: ' + fA);
  conf('o fechamento do tablet bate com o do celular depois do "pago em"', fA, fC);
  conf('e o tablet mostra o "Pago em" do celular', /Pago em .* R\$\s?250,00/.test((await texto(pagA, '.linha-pagamento[data-aluno="alfa"]')) || ''), true);

  secao('10. Sem sinal: a edição fica na fila e o alto diz quantas esperam');
  await clicar(pagC, '#cel-abas .cel-aba[data-cel="hoje"]');
  await pagC.setOfflineMode(true);
  await pagC.evaluate(() => window.dispatchEvent(new Event('offline')));
  await digitar(pagC, '#cel-dia', TERCEIRO);
  await clicar(pagC, '.cel-aula[data-aula="aula-terceiro"] .cel-cancelar');
  await esperar('cancelada sem sinal', () => pagC.evaluate(() => Store.carregar().then(b => b.aulas.find(a => a.id === 'aula-terceiro').status)), v => v === 'cancelada', 10000);
  await pausa(3500); // o envio agendado tenta e não sai
  conf('a edição sem sinal ficou na fila', JSON.stringify(await fila(pagC)), JSON.stringify(['aula:aula-terceiro']));
  const alto = await esperar('o alto diz que espera sinal', () => texto(pagC, '#cel-origem'), v => /1 mudança esperando sinal\./.test(v || ''), 10000);
  conf('o alto diz "1 mudança esperando sinal." (' + alto.valor + ')', alto.ok, true);
  await pagC.setOfflineMode(false);
  await pagC.evaluate(() => window.dispatchEvent(new Event('online')));
  conf('com o sinal de volta, a fila subiu sozinha', (await filaVazia(pagC)).ok, true);
  conf('e o alto deixou de dizer que espera', !/esperando sinal/.test((await esperar('o alto atualizou', () => texto(pagC, '#cel-origem'), v => !/esperando sinal/.test(v || ''), 10000)).valor || ''), true);
  conf('o tablet recebe ao abrir a aula cancelada sem sinal', (await tabletAbreERecebe(pagA, 'o tablet recebeu a do sem sinal',
    function (d) { return d.aulas.find(function (x) { return x.id === 'aula-terceiro'; }).status === 'cancelada'; }.toString())).ok, true);

  secao('11. A cópia do tablet mais velha que a edição do celular não a desfaz no celular');
  /* O tablet manda uma cópia montada de um retrato de ANTES de receber o "pago
   * em" e o cancelamento: o celular a restaura ao abrir e recebe os registros
   * do zero; a edição dele já enviada tem de continuar valendo nele. */
  await pagA.evaluate(async (m) => {
    const d = await Store.carregar();
    d.pagamentos = (d.pagamentos || []).filter(p => !(p.alunoId === 'alfa' && p.mes === m));
    d.aulas.find(a => a.id === 'aula-outro').status = 'realizada';
    d.aulas.find(a => a.id === 'aula-outro').cobravel = true;
    await Nuvem.enviarCopia(await Store.exportarTudoZip(d), { motivo: 'ela', conteudo: true });
  }, MES);
  await abrirCelular(pagC);
  const depoisDaCopia = await esperar('o celular restaurou a cópia velha e recebeu', () => pagC.evaluate(() => !Nuvem.estado().registros.recebendo &&
    Store.lerCursor().then(c => !!(c && c.servidorEm))), v => v === true, 30000);
  conf('(arranjo) o celular abriu, restaurou e recebeu', depoisDaCopia.ok, true);
  const noCel = await pagC.evaluate(m => Store.carregar().then(d => {
    const p = (d.pagamentos || []).find(x => x.alunoId === 'alfa' && x.mes === m);
    return (p ? p.valor : 'sem pagamento') + '/' + d.aulas.find(a => a.id === 'aula-outro').status;
  }), MES);
  conf('o "pago em" e o cancelamento do celular continuam nele, por cima da cópia velha', noCel, '250/cancelada');

  secao('11b. O formulário aberto não se perde quando chegam registros nem no "Buscar de novo"');
  await clicar(pagC, '#cel-abas .cel-aba[data-cel="hoje"]');
  await clicar(pagC, '#cel-dia-hoje');
  await clicar(pagC, '.cel-aula[data-aula="aula-hoje"] .cel-registrar');
  await digitar(pagC, '#cel-relato-texto', 'texto que ela digitou e não pode sumir');
  await pagA.evaluate(async () => { const d = await Store.carregar(); d.aulas.find(a => a.id === 'aula-ontem').notaTexto = 'o tablet mexeu com o formulário aberto'; await Store.salvar(d); await Nuvem.sincronizar({ versaoApp: 'prova' }); });
  const chegouComForm = await pagC.evaluate(() => Nuvem.receberRegistros().then(r => r.aplicados || 0));
  await pausa(600);
  conf('(arranjo) chegou registro do tablet com o formulário aberto', chegouComForm >= 1, true);
  conf('o texto digitado continua no formulário depois do recebimento', await pagC.evaluate(() => (document.querySelector('#cel-relato-texto') || {}).value), 'texto que ela digitou e não pode sumir');
  await clicar(pagC, '#cel-atualizar');
  await esperar('o "Buscar de novo" terminou', () => pagC.evaluate(() => !Nuvem.estado().registros.recebendo && !!document.querySelector('#cel-atualizar') && !document.querySelector('#cel-atualizar').disabled), v => v === true, 20000);
  conf('e depois do "Buscar de novo"', await pagC.evaluate(() => (document.querySelector('#cel-relato-texto') || {}).value), 'texto que ela digitou e não pode sumir');
  await clicar(pagC, '#cel-form-voltar');
  conf('fechando o formulário, Hoje volta e mostra o que chegou', /o tablet mexeu com o formulário aberto|10:30 Aluno Alfa Teste/.test(await texto(pagC, '#cel-hoje')), true);

  secao('11c. Trinta ações com Desfazer no celular: o histórico fica em 25 e o Desfazer continua');
  await digitar(pagC, '#cel-dia', TERCEIRO);
  const falhasDoDesfazer = [];
  for (let k = 0; k < 30; k++) {
    await clicar(pagC, '.cel-aula[data-aula="' + idMarcada + '"] .cel-cancelar');
    const c = await esperar('cancelada (' + (k + 1) + ')', () => pagC.evaluate(id => Store.carregar().then(b => b.aulas.find(a => a.id === id).status), idMarcada), v => v === 'cancelada', 10000);
    const temDesfazer = await pagC.evaluate(() => { const b = document.querySelector('#aviso-acao'); return !!(b && b.style.display !== 'none' && document.querySelector('#aviso.aberto')); });
    if (!c.ok || !temDesfazer) { falhasDoDesfazer.push(k + 1); break; }
    await clicar(pagC, '#aviso-acao');
    const v = await esperar('desfeita (' + (k + 1) + ')', () => pagC.evaluate(id => Store.carregar().then(b => b.aulas.find(a => a.id === id).status), idMarcada), v => v === 'realizada', 10000);
    if (!v.ok) { falhasDoDesfazer.push(k + 1); break; }
  }
  conf('as 30 ações tiveram o Desfazer, e o Desfazer voltou a aula (falhou em: ' + (falhasDoDesfazer.join(', ') || 'nenhuma') + ')', falhasDoDesfazer.length, 0);
  conf('o histórico do celular ficou em 25 pontos', await pagC.evaluate(() => Store.listarHistorico().then(l => l.length)), 25);
  await filaVazia(pagC);

  secao('11d. A cópia sem o corte dos pagamentos: nenhuma ação do celular sobe ajuste:pagamentosDesde');
  /* O banco do celular perde o corte (a cópia de um tablet que nunca desenhou
   * o Fechamento): o Fechamento do celular o põe na memória, e a ação seguinte
   * não pode levá-lo para a fila. */
  await pagC.evaluate(() => new Promise((res, rej) => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => {
      const t = q.result.transaction(['registros', 'dados'], 'readwrite');
      t.objectStore('registros').delete('ajuste:pagamentosDesde');
      const p = t.objectStore('dados').get('principal');
      p.onsuccess = () => { const d = p.result; delete d.ajustes.pagamentosDesde; t.objectStore('dados').put(d, 'principal'); };
      t.oncomplete = () => { q.result.close(); res(); };
      t.onerror = () => rej(t.error);
    };
  }));
  await abrirCelular(pagC);
  conf('(arranjo) o celular abriu sem o corte no banco', await pagC.evaluate(() => Store.carregar().then(d => d.ajustes.pagamentosDesde === undefined)), true);
  const antesDoCorte = (await escritasLidas(pagC)).length;
  await clicar(pagC, '#cel-abas .cel-aba[data-cel="fechamento"]');
  await pausa(300);
  await clicar(pagC, '#cel-abas .cel-aba[data-cel="hoje"]');
  await digitar(pagC, '#cel-dia', TERCEIRO);
  await clicar(pagC, '.cel-aula[data-aula="' + idMarcada + '"] .cel-cancelar');
  await esperar('a ação depois do Fechamento gravou', () => pagC.evaluate(id => Store.carregar().then(b => b.aulas.find(a => a.id === id).status), idMarcada), v => v === 'cancelada', 10000);
  await sincronizar(pagC);
  await filaVazia(pagC);
  const depoisDoCorte = (await escritasLidas(pagC)).slice(antesDoCorte);
  conf('(controle) a ação subiu: ' + depoisDoCorte.map(n => n.replace(/^.*\/registros\//, '')).join(', '), depoisDoCorte.some(n => /registros\/aula:/.test(n)), true);
  prop('nenhum ajuste:pagamentosDesde subiu do celular', depoisDoCorte.filter(n => /ajuste:pagamentosDesde/.test(n)).length === 0, MODOS[2]);
  if (MODO === MODOS[2]) fimDoVeneno();
  conf('e o banco do celular continua sem o corte', await pagC.evaluate(() => Store.lerRegistros().then(l => !l.some(r => r.id === 'ajuste:pagamentosDesde'))), true);

  secao('11e. A quarentena não segura a cópia do tablet: a restauração a substitui');
  await pagC.evaluate(() => new Promise((res, rej) => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => {
      const t = q.result.transaction('saida', 'readwrite');
      t.objectStore('saida').put({ id: 'aula:aula-ontem', tipo: 'aula', atualizadoEm: new Date().toISOString(), apagadoEm: null, tentativas: 3, quarentena: true, retestada: true });
      t.oncomplete = () => { q.result.close(); res(); };
      t.onerror = () => rej(t.error);
    };
  }));
  await pagC.evaluate(() => Nuvem.contarFila());
  const fraseQ = await esperar('o alto diz da quarentena', () => texto(pagC, '#cel-origem'), v => /1 mudança não consegue subir; a restauração vai substituir\./.test(v || ''), 10000);
  conf('o alto diz "1 mudança não consegue subir; a restauração vai substituir." e não que espera sinal (' + fraseQ.valor + ')', fraseQ.ok && !/esperando/.test(fraseQ.valor), true);
  await pagA.evaluate(async () => { await Nuvem.enviarCopia(await Store.exportarTudoZip(await Store.carregar()), { motivo: 'ela', conteudo: true }); });
  const pont = await rest(docUrl(dona.localId, 'estado/copia'), { token: dona.idToken });
  const copiaNova = pont.json && pont.json.fields ? pont.json.fields.atual.stringValue : null;
  await clicar(pagC, '#cel-atualizar');
  const trouxe = await esperar('o celular trouxe a cópia nova', () => pagC.evaluate(() => Nuvem.estado().ultimaCopia && Nuvem.estado().ultimaCopia.id), v => v === copiaNova, 30000);
  conf('com só a quarentena na fila, o celular trouxe a cópia nova do tablet', trouxe.ok, true);
  conf('e a quarentena saiu da fila', JSON.stringify(await fila(pagC)), '[]');

  secao('12. A cópia completa nunca sobe do celular');
  await pagC.evaluate(() => Nuvem.marcarMudanca());
  for (const estado of ['hidden', 'visible']) {
    await pagC.evaluate(e => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => e });
      document.dispatchEvent(new Event('visibilitychange'));
      if (e === 'hidden') window.dispatchEvent(new Event('pagehide'));
      delete document.visibilityState;
    }, estado);
    await pausa(2500);
  }
  const direto = await pagC.evaluate(async () => {
    try { await Nuvem.enviarCopia(await Store.exportarTudoZip(await Store.carregar()), { motivo: 'diaria', conteudo: true }); return 'enviou'; }
    catch (e) { return e && e.codigo; }
  });
  await pausa(1500);
  const copiasDoCelular = await escritasDeCopia(pagC);
  conf('(controle) no celular, os commits lidos por dentro são os que saíram na rede', (await commitsLidos(pagC)).length, pagC.commitsNaRede);
  prop('zero escritas em copias/ e em estado/copia vindas do celular (fechar, voltar, a diária e o pedido direto: ' + (copiasDoCelular.length ? copiasDoCelular.slice(0, 3).join(' ') : 'nenhuma') + ')',
    copiasDoCelular.length === 0 && pagC.outrasEscritas.length === 0, MODOS[0]);
  prop('o pedido direto de cópia no celular é recusado (SO_LEITURA)', direto === 'SO_LEITURA', MODOS[0]);
  /* Do lado do servidor: nenhuma cópia apontada leva o id do celular. */
  const ponteiro = await rest(docUrl(dona.localId, 'estado/copia'), { token: dona.idToken });
  const ids = ponteiro.json && ponteiro.json.fields ? [ponteiro.json.fields.atual, ponteiro.json.fields.anterior].map(v => v && v.stringValue).filter(Boolean) : [];
  const autores = [];
  for (const id of ids) {
    const meta = await rest(docUrl(dona.localId, 'copias/' + id), { token: dona.idToken });
    autores.push(meta.json && meta.json.fields && meta.json.fields.aparelhoId ? meta.json.fields.aparelhoId.stringValue : '?');
  }
  prop('no servidor, nenhuma cópia apontada foi enviada pelo celular (' + autores.length + ' lidas)', autores.length > 0 && autores.indexOf(idCelular) < 0, MODOS[0]);
  if (MODO === MODOS[0]) fimDoVeneno();

  secao('13. O celular não grava fora das quatro ações');
  const tudoDoCelular = Array.from(new Set((await escritasLidas(pagC)).map(n => n.replace(/^.*\/documents\/usuarios\/[^/]+\//, ''))));
  console.log('   o que subiu do celular: ' + tudoDoCelular.join(', '));
  /* (D7) o diagnóstico do celular, só o do PRÓPRIO aparelho, é a outra coisa
   * que sobe dele; fica fora da conta dos registros, abaixo. */
  const diagnosticosDoCelular = tudoDoCelular.filter(n => /^diagnostico\//.test(n));
  conf('(D7) o celular que editou sobe o diagnóstico dele, e só o do próprio aparelho', diagnosticosDoCelular.join(','), 'diagnostico/' + idCelular);
  const enviadosDoCelular = tudoDoCelular.filter(n => !/^diagnostico\//.test(n));
  const esperados = ['registros/aula:' + idMarcada, 'registros/aula:aula-outro', 'registros/aula:aula-hoje', 'registros/aluno:' + idBeta, 'registros/aula:aula-terceiro'];
  const pagamento = enviadosDoCelular.filter(n => /^registros\/pagamento:/.test(n));
  conf('tudo o que subiu do celular é um registro das quatro ações: as aulas, o aluno novo e o pagamento, e nada mais',
    enviadosDoCelular.filter(n => esperados.indexOf(n) < 0 && pagamento.indexOf(n) < 0).join(', ') + '|' + esperados.filter(n => enviadosDoCelular.indexOf(n) < 0).join(', ') + '|' + pagamento.length, '||1');
  conf('nenhum ajuste subiu do celular', enviadosDoCelular.filter(n => /ajuste:/.test(n)).length, 0);
  const recusas = await pagC.evaluate(async () => {
    const tenta = async f => { try { await f(); return 'gravou'; } catch (e) { return e && e.soLeitura ? 'recusou' : 'erro: ' + (e && e.message); } };
    return [
      await tenta(() => Store.salvarNota('aula-hoje', { paginas: [] })),
      await tenta(() => Store.apagarTudo()),
      await tenta(async () => Store.excluirAlunoEmCascata(await Store.carregar(), 'alfa')),
      await tenta(() => Store.desligarSincronizacao())
    ].join(',');
  });
  conf('os caminhos do tablet continuam recusados no celular: folha, "Apagar tudo", excluir aluno, desligar a sincronização', recusas, 'recusou,recusou,recusou,recusou');
  conf('e o celular segue com os dados (o aluno de referência continua lá)', await pagC.evaluate(() => Store.carregar().then(d => d.alunos.some(a => a.id === 'alfa'))), true);

  secao('14. O observador de outra conta: nenhum botão de edição, nada gravado');
  const ctxD = await pagA.browser().createBrowserContext();
  const pagD = await ctxD.newPage();
  await prepararPagina(pagD, true);
  await abrirCelular(pagD);
  conf('o observador entrou com a conta dele', await entrarNoCelular(pagD, OBS), true);
  conf('trouxe a cópia da dona pelo código da conta dela', await trazerCopiaNoCelular(pagD, dona.localId), true);
  conf('a marca do observador: celular, de outra conta, não da dona', await pagD.evaluate(() => { const e = Nuvem.estado(); return [e.celular, e.observador, e.celularDaDona].join(','); }),
    MODO === MODOS[1] ? 'true,true,true' : 'true,true,false');
  const telasD = [];
  for (const t of ['hoje', 'fechamento', 'enviar']) {
    await clicar(pagD, '#cel-abas .cel-aba[data-cel="' + t + '"]');
    await pausa(200);
    const md = await medirTela(pagD);
    telasD.push(t + ': ' + md.dasAcoes.concat(md.soltos).concat(md.campos).join(' + '));
    if (t === 'hoje') conf('(controle) o observador vê a aula de hoje', /10:30 Aluno Alfa Teste/.test(await texto(pagD, '#cel-hoje')), true);
  }
  prop('o observador não vê nenhum botão de edição nem campo de escrever (' + telasD.join(' | ') + ')', telasD.every(t => /: $/.test(t)), MODOS[1]);
  prop('o alto do observador diz que só consulta', (await texto(pagD, '#cel-regra')) === 'Este celular só consulta. Para mudar algo, use o tablet.', MODOS[1]);
  if (MODO === MODOS[1]) fimDoVeneno();
  conf('gravar no observador é recusado', await pagD.evaluate(async () => { try { await Store.salvar(await Store.carregar()); return false; } catch (e) { return !!(e && e.soLeitura); } }), true);
  await pagD.evaluate(() => Nuvem.marcarMudanca());
  await pausa(3500);
  conf('nenhuma escrita na nuvem saiu do observador', pagD.commitsNaRede + pagD.outrasEscritas.length, 0);

  secao('15. Sem erro de página');
  conf('nenhum erro de página no tablet, no celular e no observador', [pagA, pagC, pagD].map(p => p.errosDePagina.join(' | ')).filter(Boolean).join(' || '), '');
  await ctxD.close();
  await ctxC.close();
})().then(() => derrubarEmulador().then(H.fim(amb)), e => derrubarEmulador().then(() => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e))));
