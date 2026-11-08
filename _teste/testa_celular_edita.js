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
 * D6c (lote 1), Hoje como linha do tempo, na mesma rodada:
 *  10. a faixa da semana, a linha do tempo com a cor do aluno, os horários
 *      livres escritos e a linha de agora; o "+" flutuante e o toque num
 *      horário livre ("Marcar aula às 14:00"); o alto enxuto (sem o texto de
 *      sistema da dona); data dd/mm/aaaa e hora em 24 h em todos os
 *      formulários, e Salvar à vista com o teclado aberto;
 *  11. a folha de baixo da aula: Realizada, Faltou, Cancelar (com e sem
 *      cobrança, valendo para a aula de HOJE, batendo com o fechamento),
 *      Remarcar (só esta ocorrência de uma repetição, com o vínculo mantido,
 *      os horários livres e o aviso de choque) e Registrar como foi;
 *  12. o fechamento de referência de junho continua 10 encontros, 10:30 e
 *      R$ 1.050,00 depois de remarcar a aula de 1h30 dele, no celular e no
 *      tablet; o observador vê a linha do tempo, sem botão nem folha de edição.
 *
 * Venenos, que TÊM de reprovar a propriedade (a rodada passa quando a prova
 * VÊ o veneno):
 *   --envenenado-remarca-todas   remarcar muda a hora de toda a repetição;
 *   --envenenado-remarca-solta   remarcar apaga a ocorrência e cria uma avulsa
 *                         (perde o vínculo com a série);
 *   --envenenado-sem-choque      a conta de choque do celular não vê nada;
 *   --envenenado-duracao-padrao  remarcar não traz a duração da aula (vem 1 h);
 *   --envenenado-cancela-sempre-sem  "Cancelar com cobrança" grava sem cobrança;
 *   --envenenado-cobranca-volta  tocar na situação que a aula já tem volta a
 *                         cobrança ao padrão (a regra de antes da revisão);
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

const MODOS = ['--envenenado-celular-envia-copia', '--envenenado-observador-edita', '--envenenado-corte-sobe',
  '--envenenado-remarca-todas', '--envenenado-remarca-solta', '--envenenado-sem-choque', '--envenenado-duracao-padrao', '--envenenado-cancela-sempre-sem',
  '--envenenado-cobranca-volta'];
const V_TODAS = MODOS[3], V_SOLTA = MODOS[4], V_CHOQUE = MODOS[5], V_DURACAO = MODOS[6], V_CANCELA = MODOS[7], V_COBRANCA = MODOS[8];
/* --prints <pasta>: tira os quatro prints do D6c em 390 x 844 (dados fictícios). */
const PRINTS = (() => { const i = process.argv.indexOf('--prints'); return i >= 0 ? process.argv[i + 1] : ''; })();
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
/* D6c: as âncoras dos venenos da agenda, cada uma num lugar só. */
const REMARCA = 'mudarAulaNoCelular(a, { data: v.data, hora: v.hora, duracaoMin: v.duracaoMin }, mensagem, function () { diaCelular = v.data; });';
const CHOQUE = '    return Core.conflitosDe(db, provisoria);';
const DURACAO = 'duracaoMin: Number(a.duracaoMin) || 60 }, a.id, a.status,';
const MESMA_SITUACAO = "    if (atual && (atual.status || 'realizada') === status) {";
const CANCELA_COM = "{ status: 'cancelada', cobravel: true }, 'Aula cancelada com cobrança.'";
conf('(D6c) remarcar, o choque, a duração do remarcar e o cancelar com cobrança estão cada um num lugar só',
  [REMARCA, CHOQUE, DURACAO, CANCELA_COM, MESMA_SITUACAO].map(a => APP.split(a).length).join(','), '2,2,2,2,2');
conf('(D6c) remarcar e cancelar usam o núcleo do tablet (alterarAulaComDesfazer, que é Core.aplicarEdicaoAula só nesta aula)',
  /function mudarAulaNoCelular[\s\S]{0,400}alterarAulaComDesfazer\(atual\.id, atual\.alunoId, mudancas, mensagem\)/.test(APP) &&
  /function alterarAulaComDesfazer[\s\S]{0,300}Core\.aplicarEdicaoAula\(db, aulaId, mudancas, 'esta'\)/.test(APP), true);
const comNuvemIgual = app => { trocas['/app.js'] = app; trocas['/nuvem.js'] = NUVEM + '\n'; };
if (MODO === V_TODAS) comNuvemIgual(APP.replace(REMARCA, "comoAcaoDoCelular(function () { fecharFolhaCelular(); Core.aplicarEdicaoAula(db, a.id, { hora: v.hora, duracaoMin: v.duracaoMin }, 'todas'); " +
  "Core.aplicarEdicaoAula(db, a.id, { data: v.data }, 'esta'); return salvar(); }).then(function () { diaCelular = v.data; desenharCelular(); });"));
if (MODO === V_SOLTA) comNuvemIgual(APP.replace(REMARCA, 'comoAcaoDoCelular(function () { fecharFolhaCelular(); var n = novaAulaAvulsa({ alunoId: a.alunoId, data: v.data, hora: v.hora, ' +
  "duracaoMin: v.duracaoMin, status: a.status, cobravel: a.cobravel }); Core.excluirAulas(db, a.id, 'esta'); db.aulas.push(n); return salvar(); }).then(function () { diaCelular = v.data; desenharCelular(); });"));
if (MODO === V_CHOQUE) comNuvemIgual(APP.replace(CHOQUE, '    return [];'));
if (MODO === V_DURACAO) comNuvemIgual(APP.replace(DURACAO, 'duracaoMin: 60 }, a.id, a.status,'));
if (MODO === V_COBRANCA) comNuvemIgual(APP.replace(MESMA_SITUACAO, '    if (false) {'));
if (MODO === V_CANCELA) comNuvemIgual(APP.replace(CANCELA_COM, "{ status: 'cancelada', cobravel: false }, 'Aula cancelada com cobrança.'"));
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
  pag.on('dialog', async d => {
    pag.dialogos.push(d.message());
    const recusa = pag.recusarProximo; pag.recusarProximo = false;
    try { if (recusa) await d.dismiss(); else await d.accept(); } catch (e) { /* ok */ }
  });
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

/* (D6c) A agenda pela tela: a faixa da semana troca de semana pelas setas até
 * o dia aparecer, e um toque nele; o toque no bloco abre a folha da aula. */
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
    await clicar(pag, onde === 'antes' ? '#cel-semana-anterior' : '#cel-semana-seguinte');
  }
  return false;
}
async function abrirFolha(pag, aulaId) {
  if (!(await clicar(pag, '.cel-bloco[data-aula="' + aulaId + '"]'))) return false;
  return existe(pag, '#cel-folha[data-aula="' + aulaId + '"]');
}
async function cancelarPelaFolha(pag, aulaId, comCobranca) {
  if (!(await abrirFolha(pag, aulaId))) return false;
  await clicar(pag, '#cel-folha-cancelar');
  return clicar(pag, comCobranca ? '#cel-cancelar-com' : '#cel-cancelar-sem');
}
const botoesDaFolha = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#cel-folha button')).map(b => b.id).filter(Boolean));
const ddmmaaaa = iso => iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4);
async function tirarPrint(pag, nome) {
  if (!PRINTS) return;
  fs.mkdirSync(PRINTS, { recursive: true });
  await pausa(250);
  await pag.screenshot({ path: path.join(PRINTS, nome) });
  console.log('   print: ' + path.join(PRINTS, nome));
}
/* O fechamento de um aluno num mês, pelo mesmo Core em cada aparelho. */
const fechamentoDe = (pag, alunoId, mes) => pag.evaluate((id, m) => Store.carregar().then(d => {
  const f = Core.calcularMesInteiro(d, m).find(x => x.aluno.id === id);
  return f ? { linhas: f.linhas.length, horas: Core.fmtHoras(f.totalMin), total: Core.fmtMoeda(f.totalValor), feito: Core.fmtMoeda(f.valorFeito) } : null;
}), alunoId, mes);

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
  // (D6c) os seletores do navegador seguem a língua do aparelho (2:00 PM, 11/10): nenhum à vista no celular
  const nativos = Array.from(raiz.querySelectorAll('input[type=date], input[type=time], input[type=datetime-local]')).filter(visivel).map(e => e.id || e.className);
  return {
    nativos,
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
/* (D6c) A repetição semanal do aluno Gama: quatro aulas, de TERCEIRO em
 * diante, às 16:00; a primeira se remarca para QUARTO, às 17:00. */
const QUARTO = (() => { const d = new Date(AGORA); d.setDate(d.getDate() + 3); return isoDe(d); })();
const FIM_GAMA = (() => { const d = new Date(AGORA); d.setDate(d.getDate() + 2 + 21); return isoDe(d); })();
/* O fechamento de referência de junho (o do Marcelo, conferido à mão): 10
 * encontros, 10:30 e R$ 1.050,00, com um aluno fictício. A aula de 1h30 (10/06)
 * se remarca no celular para 12/06. */
const JUNHO = [['2026-06-01', 60], ['2026-06-05', 60], ['2026-06-08', 60], ['2026-06-10', 90], ['2026-06-15', 60],
  ['2026-06-17', 60], ['2026-06-19', 60], ['2026-06-22', 60], ['2026-06-24', 60], ['2026-06-26', 60]];
const REF_JUNHO = { linhas: 10, horas: '10:30', total: 'R$ 1.050,00' };

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
  await pagA.evaluate(async (hoje, outro, terceiro, ontem, junho, fimGama) => {
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
    // (D6c) a repetição do Gama, uma reposição hoje e o aluno do fechamento de referência de junho
    d.alunos.push({ id: 'gama', nome: 'Aluno Gama Teste', ativo: true, cor: '#C9A961', responsavel: 'Responsável Gama Teste',
      precos: [{ id: 'pg', inicio: '2026-01-01', fim: null, valorHora: 80 }], mapeamentos: [] });
    d.alunos.push({ id: 'ref', nome: 'Aluno Referência Teste', ativo: true, cor: '#2E7D6B', responsavel: '',
      precos: [{ id: 'pr1', inicio: '2025-01-01', fim: '2026-05-31', valorHora: 100 }, { id: 'pr2', inicio: '2026-06-01', fim: null, valorHora: 100 }], mapeamentos: [] });
    d.aulas.push({ id: 'aula-hoje-gama', alunoId: 'gama', serieId: null, data: hoje, hora: '14:00', duracaoMin: 60, status: 'reposicao', cobravel: true, notaTexto: '', anexos: [] });
    // marcada no tablet como realizada, mas sem cobrança
    d.aulas.push({ id: 'aula-gratis', alunoId: 'gama', serieId: null, data: ontem, hora: '16:00', duracaoMin: 60, status: 'realizada', cobravel: false, notaTexto: '', anexos: [] });
    junho.forEach(([data, dur], i) => d.aulas.push({ id: 'ref-' + data, alunoId: 'ref', serieId: null, data, hora: '15:30', duracaoMin: dur, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] }));
    Core.criarSerie(d, { alunoId: 'gama', dias: [Core.diaSemana(terceiro)], hora: '16:00', duracaoMin: 60, inicio: terceiro, fim: fimGama });
    await Store.salvar(d);
  }, HOJE, OUTRO, TERCEIRO, ONTEM, JUNHO, FIM_GAMA);
  const serieGama = await pagA.evaluate(() => Store.carregar().then(d => {
    const s = d.series.find(x => x.alunoId === 'gama');
    return { id: s.id, aulas: d.aulas.filter(a => a.serieId === s.id).map(a => a.id + ' ' + a.data + ' ' + a.hora).sort() };
  }));
  conf('(arranjo) a repetição do Gama tem quatro aulas às 16:00, a primeira em ' + TERCEIRO, serieGama.aulas.length === 4 &&
    serieGama.aulas.every(t => / 16:00$/.test(t)) && serieGama.aulas.some(t => t.indexOf(' ' + TERCEIRO + ' ') > 0), true);
  const idGama1 = serieGama.aulas.map(t => t.split(' ')).find(p => p[1] === TERCEIRO)[0];
  conf('(arranjo) o fechamento de referência de junho no tablet: 10 encontros, 10:30, R$ 1.050,00',
    JSON.stringify(await fechamentoDe(pagA, 'ref', '2026-06')), JSON.stringify(Object.assign({}, REF_JUNHO, { feito: 'R$ 1.050,00' })));
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
  conf('(D6c) o alto da dona é enxuto: sem texto de sistema, com o ícone da nuvem e o estado curto ("' + (await texto(pagC, '#cel-origem')) + '")',
    await pagC.evaluate(() => document.querySelector('#cel-regra').hidden && !document.querySelector('#cel-regra').textContent &&
      !!document.querySelector('#cel-nuvem') && document.querySelector('#cel-nuvem').getAttribute('data-tom') === 'em-dia'), true);
  conf('(D6c) o "o resto, no tablet" não aparece mais no celular', /o resto, no tablet/i.test(await pagC.evaluate(() => document.querySelector('#modo-celular').textContent)), false);
  conf('(D6c) com o teclado, a página do celular encolhe até ele (interactive-widget), e a do tablet não',
    (await pagC.evaluate(() => document.querySelector('meta[name=viewport]').content)).indexOf('interactive-widget=resizes-content') >= 0 &&
    (await pagA.evaluate(() => document.querySelector('meta[name=viewport]').content)).indexOf('interactive-widget') < 0, true);
  conf('a restauração no celular não enfileirou nada', (await fila(pagC)).length, 0);
  const idCelular = await pagC.evaluate(() => Store.aparelho());
  const reais = t => Number(String(t).replace(/[^\d,]/g, '').replace(',', '.'));

  secao('3. Hoje como linha do tempo em 390 x 844: a semana, as aulas na cor do aluno, os horários livres e a linha de agora');
  let m = await medirTela(pagC);
  conf('Hoje: sem rolagem de lado em ' + m.largura + ' px', m.rolaDeLado, false);
  conf('Hoje: todo alvo tem 48 px ou mais (' + m.alvos + ' alvos)', m.pequenos.join('; '), '');
  conf('Hoje: os botões de edição são todos das ações do celular (' + m.dasAcoes.join(', ') + ')', m.soltos.join(', '), '');
  conf('Hoje: o "+" flutuante e "Cadastrar aluno" à vista', m.dasAcoes.indexOf('+') >= 0 && m.dasAcoes.indexOf('Cadastrar aluno') >= 0, true);
  conf('(revisão) a rolagem inicial não deixa nenhuma linha cortada sob a faixa dos dias', await pagC.evaluate(() => {
    const baixo = document.querySelector('#cel-semana').getBoundingClientRect().bottom;
    const l = Array.from(document.querySelectorAll('#cel-tempo .cel-tempo-linha')).find(x => x.getBoundingClientRect().bottom > baixo + 1);
    return !l || l.getBoundingClientRect().top >= baixo - 1; }), true);
  conf('(revisão) as bolinhas de hoje dizem de quem é cada aula a quem lê a tela', await pagC.evaluate(h =>
    document.querySelector('.cel-semana-dia[data-dia="' + h + '"] .cel-semana-bolinhas').getAttribute('aria-label'), HOJE), '2 aulas: Aluno Alfa Teste às 10:30, Aluno Gama Teste às 14:00');
  conf('o "+" diz o que faz a quem lê a tela', await pagC.evaluate(() => document.querySelector('#cel-marcar-aula').getAttribute('aria-label')), 'Marcar aula neste dia');
  const semana = await pagC.evaluate(hoje => {
    const dias = Array.from(document.querySelectorAll('#cel-semana .cel-semana-dia'));
    const deHoje = document.querySelector('.cel-semana-dia[data-dia="' + hoje + '"]');
    return { dias: dias.length, ativo: !!(deHoje && deHoje.classList.contains('ativo')),
      bolinhas: deHoje ? Array.from(deHoje.querySelectorAll('.cel-bolinha')).map(b => getComputedStyle(b).backgroundColor) : [],
      titulo: document.querySelector('#cel-dia-titulo').textContent, tudo: document.querySelector('#cel-hoje').textContent };
  }, HOJE);
  const ddmmHoje = HOJE.slice(8, 10) + '/' + HOJE.slice(5, 7);
  conf('a faixa da semana tem 7 dias, com hoje escolhido', semana.dias === 7 && semana.ativo, true);
  conf('hoje tem uma bolinha por aula, na cor do aluno (' + semana.bolinhas.join(' ') + ')', semana.bolinhas.join(' '), 'rgb(31, 58, 95) rgb(201, 169, 97)');
  conf('a data aparece uma vez só, no título ("' + semana.titulo + '")', new RegExp('^Hoje, \\S+, ' + ddmmHoje + '$').test(semana.titulo) &&
    semana.tudo.split(ddmmHoje).length === 2, true);
  const bloco = await pagC.evaluate(() => {
    const b = document.querySelector('.cel-bloco[data-aula="aula-hoje"]'), g = document.querySelector('.cel-bloco[data-aula="aula-hoje-gama"]');
    return { borda: getComputedStyle(b).borderLeftColor, altura: Math.round(b.getBoundingClientRect().height), altura60: Math.round(g.getBoundingClientRect().height),
      texto: b.textContent, reposicao: g.classList.contains('cel-bloco-reposicao') && /Reposição/.test(g.textContent),
      horaAEsquerda: b.getBoundingClientRect().left > b.closest('.cel-tempo-linha').querySelector('.cel-tempo-hora').getBoundingClientRect().right,
      horaDoBloco: b.closest('.cel-tempo-linha').querySelector('.cel-tempo-hora').textContent };
  });
  conf('o bloco tem a cor do aluno, a mesma do tablet (' + bloco.borda + ')', bloco.borda, 'rgb(31, 58, 95)');
  conf('a hora fica à esquerda do bloco (' + bloco.horaDoBloco + ')', bloco.horaAEsquerda && bloco.horaDoBloco === '10:30', true);
  conf('a altura vai pela duração: a aula de 1h30 (' + bloco.altura + ' px) é maior que a de 1h (' + bloco.altura60 + ' px)', bloco.altura > bloco.altura60 && bloco.altura >= 100, true);
  conf('a reposição se vê pela cor e pelo nome', bloco.reposicao, true);
  conf('o bloco não repete o relato da última aula (ele fica na folha)', /Na última aula|Rendeu bem/.test(bloco.texto), false);
  /* (revisão) hoje, o que já passou não é livre; e a aula de agora e a próxima levam o nome. */
  const hojeLivre = await pagC.evaluate(() => {
    const d = new Date(), agora = d.getHours() * 60 + d.getMinutes();
    const min = t => { const p = t.split(':'); return +p[0] * 60 + +p[1]; };
    const textos = Array.from(document.querySelectorAll('#cel-tempo .cel-livre-texto')).map(e => e.textContent);
    const marcas = Array.from(document.querySelectorAll('#cel-tempo .cel-bloco')).map(b => b.dataset.aula + '=' + ((b.querySelector('.cel-bloco-marca') || {}).textContent || '')).join(' ');
    const aulas = [['aula-hoje', 630, 720], ['aula-hoje-gama', 840, 900]];
    const esperado = aulas.map(a => a[0] + '=' + (a[1] <= agora && agora < a[2] ? 'Agora' : '')).map((t, i, l) => t);
    const prox = aulas.find(a => a[1] > agora);
    const esperadas = aulas.map(a => a[0] + '=' + (a[1] <= agora && agora < a[2] ? 'Agora' : (prox && prox[0] === a[0] ? 'Próxima' : ''))).join(' ');
    return { textos, passado: textos.filter(t => min(t.match(/Livre (\d\d:\d\d)/)[1]) < agora).length, marcas, esperadas };
  });
  conf('hoje, nenhum horário que já passou aparece como livre (' + hojeLivre.textos.join('; ') + ')', hojeLivre.passado, 0);
  conf('a aula de agora leva "Agora" e a seguinte "Próxima" (' + hojeLivre.marcas + ')', hojeLivre.marcas, hojeLivre.esperadas);
  conf('a linha de agora está na linha do tempo de hoje', await existe(pagC, '#cel-tempo #cel-agora'), true);
  conf('nenhum "Enviar cópia agora" no celular', await pagC.evaluate(() => { const b = document.querySelector('#nuvem-enviar'); return !!(b && b.getBoundingClientRect().height); }), false);
  await tirarPrint(pagC, '1_hoje_linha_do_tempo.png');

  secao('3b. O toque no bloco abre a folha de baixo, com botões grandes');
  conf('o toque no bloco de hoje abre a folha da aula', await abrirFolha(pagC, 'aula-hoje'), true);
  const naFolha = await texto(pagC, '#cel-folha');
  conf('a folha traz o relato da aula ANTERIOR num quadro à parte, com a data no rótulo', /^Relato da aula anterior \(\d\d\/\d\d\)/.test((await texto(pagC, '#cel-folha #cel-aula-anterior')) || '') &&
    /Rendeu bem/.test((await texto(pagC, '#cel-aula-anterior')) || ''), true);
  conf('o botão do relato diz que é desta aula', await texto(pagC, '#cel-folha-registrar'), 'Escrever como foi esta aula');
  conf('(revisão) Cancelar fica numa linha só dele, a 16 px ou mais de qualquer outro botão de ação', await pagC.evaluate(() => {
    const c = document.querySelector('#cel-folha-cancelar').getBoundingClientRect();
    return Array.from(document.querySelectorAll('#cel-folha .cel-folha-botao')).filter(b => b.id !== 'cel-folha-cancelar').every(b => {
      const o = b.getBoundingClientRect(); return Math.max(c.top - o.bottom, o.top - c.bottom, c.left - o.right, o.left - c.right) >= 16; }); }), true);
  conf('a aula de HOJE oferece o nome (a ficha, D6c lote 2), Realizada, Faltou, Cancelar, Remarcar e Registrar como foi', (await botoesDaFolha(pagC)).join(','),
    'cel-folha-ficha,cel-folha-realizada,cel-folha-faltou,cel-folha-remarcar,cel-folha-registrar,cel-folha-cancelar,cel-folha-fechar');
  m = await medirTela(pagC);
  conf('a folha: alvos de 48 px e sem rolagem de lado', m.pequenos.join('; ') + (m.rolaDeLado ? ' rola' : ''), '');
  conf('a folha: os botões de edição são todos das ações do celular', m.soltos.join(', '), '');
  conf('a folha: os botões das ações são grandes (56 px)', await pagC.evaluate(() =>
    Array.from(document.querySelectorAll('#cel-folha .cel-folha-botao')).every(b => b.getBoundingClientRect().height >= 56)), true);
  await tirarPrint(pagC, '2_folha_da_aula.png');
  await clicar(pagC, '#cel-folha-fechar');
  conf('"Fechar" tira a folha', await existe(pagC, '#cel-folha'), false);
  await irParaDia(pagC, OUTRO);
  await abrirFolha(pagC, 'aula-outro');
  conf('a aula de amanhã oferece Cancelar e Remarcar, e não Realizada nem Faltou', (await botoesDaFolha(pagC)).join(','), 'cel-folha-ficha,cel-folha-remarcar,cel-folha-cancelar,cel-folha-fechar');
  await clicar(pagC, '#cel-folha-fechar');

  secao('3c. Faltou e Realizada, pela folha');
  await irParaDia(pagC, ONTEM);
  await abrirFolha(pagC, 'aula-ontem');
  await clicar(pagC, '#cel-folha-faltou');
  const situacao = id => pagC.evaluate(i => Store.carregar().then(b => { const a = b.aulas.find(x => x.id === i); return a.status + '/' + a.cobravel; }), id);
  conf('Faltou: a aula de ontem fica "falta", cobrada como a falta sem aviso do tablet', (await esperar('faltou gravou', () => situacao('aula-ontem'), v => v === 'falta/true', 10000)).ok, true);
  conf('o bloco diz "Faltou"', /✕ Faltou/.test((await texto(pagC, '.cel-bloco[data-aula="aula-ontem"]')) || ''), true);
  await abrirFolha(pagC, 'aula-ontem');
  await clicar(pagC, '#cel-folha-realizada');
  conf('Realizada: a aula volta a "realizada", cobrada', (await esperar('realizada gravou', () => situacao('aula-ontem'), v => v === 'realizada/true', 10000)).ok, true);
  conf('o bloco diz "✓ Realizada"', /✓ Realizada/.test((await texto(pagC, '.cel-bloco[data-aula="aula-ontem"]')) || ''), true);

  secao('3d. (revisão) Tocar na situação que a aula já tem não mexe na cobrança, e a reposição tem botão próprio');
  await abrirFolha(pagC, 'aula-gratis');
  conf('(arranjo) a aula de ontem marcada no tablet como realizada sem cobrança mostra "✓ Realizada" na folha',
    (await texto(pagC, '#cel-folha-realizada')) === '✓ Realizada' && (await situacao('aula-gratis')) === 'realizada/false', true);
  await clicar(pagC, '#cel-folha-realizada');
  await pausa(600);
  prop('tocar em Realizada para confirmar deixa a aula sem cobrança (' + (await situacao('aula-gratis')) + ')', (await situacao('aula-gratis')) === 'realizada/false', V_COBRANCA);
  if (MODO === V_COBRANCA) fimDoVeneno();
  conf('e o aviso diz que nada mudou', /^Nada mudou: a aula já está como realizada, sem cobrança\./.test((await texto(pagC, '#aviso-texto')) || ''), true);
  await irParaDia(pagC, HOJE);
  await abrirFolha(pagC, 'aula-hoje-gama');
  conf('a reposição tem o botão "✓ Reposição", e Realizada não aparece marcada', (await texto(pagC, '#cel-folha-reposicao')) === '✓ Reposição' &&
    (await texto(pagC, '#cel-folha-realizada')) === 'Realizada', true);
  await clicar(pagC, '#cel-folha-reposicao');
  await pausa(400);
  conf('tocar em Reposição não a transforma em realizada', await situacao('aula-hoje-gama'), 'reposicao/true');

  secao('4. Marcar aula num horário livre ("Marcar aula às 14:00") e pelo "+"');
  conf('a faixa da semana leva ao dia escolhido', await irParaDia(pagC, TERCEIRO), true);
  conf('o dia escolhido aparece em Hoje, com a aula das 11:00', /Aluno Alfa Teste/.test((await texto(pagC, '.cel-bloco[data-aula="aula-terceiro"]')) || ''), true);
  await clicar(pagC, '#cel-marcar-aula');
  const peloMais = await pagC.evaluate(() => document.querySelector('#cel-aula-titulo').textContent + ' | ' + document.querySelector('#cel-aula-data').value);
  conf('o "+" abre "Marcar aula" no dia à vista, às 15:30 (o padrão do tablet)', peloMais, 'Marcar aula às 15:30 | ' + ddmmaaaa(TERCEIRO));
  await clicar(pagC, '#cel-form-voltar');
  conf('o horário livre das 12:00 às 16:00 oferece 14:00', await existe(pagC, '.cel-livre[data-livre-de="12:00"] .cel-livre-hora[data-livre="14:00"]'), true);
  await clicar(pagC, '.cel-livre-hora[data-livre="14:00"]');
  const form = await pagC.evaluate(() => ({ titulo: document.querySelector('#cel-aula-titulo').textContent, data: document.querySelector('#cel-aula-data').value,
    hora: document.querySelector('#cel-aula-hora').value,
    horas24: Array.from(document.querySelectorAll('#cel-aula-hora option')).every(o => /^([01]\d|2[0-3]):[0-5]\d$/.test(o.textContent)) }));
  conf('o toque no horário livre abre "Marcar aula às 14:00", com a data e a hora preenchidas', form.titulo + ' | ' + form.data + ' | ' + form.hora,
    'Marcar aula às 14:00 | ' + ddmmaaaa(TERCEIRO) + ' | 14:00');
  conf('a hora vem numa lista de 24 h, e a data em dd/mm/aaaa', form.horas24 && /^\d\d\/\d\d\/\d{4}$/.test(form.data), true);
  m = await medirTela(pagC);
  conf('o formulário de marcar: alvos de 48 px, sem rolagem de lado e sem o seletor do navegador', m.pequenos.join('; ') + (m.rolaDeLado ? ' rola' : '') + m.nativos.join(','), '');
  await tirarPrint(pagC, '4_marcar_aula_as_14.png');
  /* O teclado aberto: com o interactive-widget, a página encolhe até ele; a
   * janela de 460 px é a tela que sobra acima do teclado. */
  await pagC.setViewport({ width: 390, height: 460, hasTouch: true, isMobile: true });
  await pagC.evaluate(() => document.querySelector('#cel-aula-data').focus());
  await pausa(400);
  conf('com o teclado aberto (sobram 460 px), "Salvar na agenda" e "Voltar" continuam à vista, sem rolar', await pagC.evaluate(() => ['#cel-aula-salvar', '#cel-form-voltar'].every(s => {
    const r = document.querySelector(s).getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight && r.height >= 48; })), true);
  await pagC.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  await pausa(400);
  await clicar(pagC, '#cel-aula-salvar');
  const marcada = await esperar('a aula marcada gravou', () => pagC.evaluate(d => Store.carregar().then(b => {
    const a = b.aulas.find(x => x.data === d && x.hora === '14:00' && x.alunoId === 'alfa'); return a ? a.id : null; }), TERCEIRO), v => !!v, 10000);
  conf('a aula nova está no banco do celular', marcada.ok, true);
  const idMarcada = marcada.valor;
  conf('e a entrada dela entrou na fila na mesma gravação', (await fila(pagC)).indexOf('aula:' + idMarcada) >= 0, true);
  conf('Hoje voltou ao dia da aula, com ela às 14:00', await pagC.evaluate(id => { const b = document.querySelector('.cel-bloco[data-aula="' + id + '"]');
    return !!b && b.closest('.cel-tempo-linha').querySelector('.cel-tempo-hora').textContent === '14:00'; }, idMarcada), true);

  secao('5. Cancelar aula pela folha, com Desfazer');
  await irParaDia(pagC, OUTRO);
  await cancelarPelaFolha(pagC, 'aula-outro', false);
  conf('cancelou no celular', (await esperar('a aula ficou cancelada', () => pagC.evaluate(() => Store.carregar().then(b => b.aulas.find(a => a.id === 'aula-outro').status)), v => v === 'cancelada', 10000)).ok, true);
  conf('o aviso traz o Desfazer', await pagC.evaluate(() => { const b = document.querySelector('#aviso-acao'); return b && b.style.display !== 'none' ? b.textContent : null; }), 'Desfazer');
  conf('o aviso fica entre o conteúdo e as abas: não cobre nenhum dos dois', await pagC.evaluate(() => {
    const a = document.querySelector('#aviso').getBoundingClientRect(), c = document.querySelector('#cel-conteudo').getBoundingClientRect(), b = document.querySelector('#cel-abas').getBoundingClientRect();
    return a.height > 0 && a.top >= c.bottom - 1 && a.bottom <= b.top + 1; }), true);
  await clicar(pagC, '#aviso-acao');
  conf('o Desfazer do celular volta a aula', (await esperar('a aula voltou', () => pagC.evaluate(() => Store.carregar().then(b => b.aulas.find(a => a.id === 'aula-outro').status)), v => v === 'realizada', 10000)).ok, true);
  await cancelarPelaFolha(pagC, 'aula-outro', false);
  const cancelada = await esperar('cancelada de novo', () => situacao('aula-outro'), v => v === 'cancelada/false', 10000);
  conf('cancelada de novo, sem cobrança (o mesmo "Cancelar aula" do Fechamento do tablet)', cancelada.ok, true);
  conf('a aula cancelada fica esmaecida e riscada, e o bloco diz sem cobrança', await pagC.evaluate(() => {
    const b = document.querySelector('.cel-bloco[data-aula="aula-outro"]');
    return Number(getComputedStyle(b).opacity) < 1 && /line-through/.test(getComputedStyle(b.querySelector('.cel-bloco-nome')).textDecorationLine) && /Cancelada, sem cobrança/.test(b.textContent); }), true);

  secao('5b. Cancelar a aula de HOJE, sem e com cobrança: bate com o fechamento');
  await irParaDia(pagC, HOJE);
  const antesF = await fechamentoDe(pagC, 'alfa', MES);
  await cancelarPelaFolha(pagC, 'aula-hoje', false);
  await esperar('hoje cancelada sem cobrança', () => situacao('aula-hoje'), v => v === 'cancelada/false', 10000);
  const semF = await fechamentoDe(pagC, 'alfa', MES);
  conf('a aula de HOJE se cancela sem cobrança, e o dado do mês cai R$ 150,00 (1h30 a R$ 100,00): ' + antesF.feito + ' para ' + semF.feito,
    (await situacao('aula-hoje')) === 'cancelada/false' && Math.round((reais(antesF.feito) - reais(semF.feito)) * 100) === 15000, true);
  await cancelarPelaFolha(pagC, 'aula-hoje', true);
  await esperar('hoje cancelada com cobrança', () => situacao('aula-hoje'), v => /^cancelada\//.test(v) && v !== 'cancelada/false', 10000);
  const comF = await fechamentoDe(pagC, 'alfa', MES);
  prop('cancelada COM cobrança, a aula continua cancelada e o mês volta ao de antes (' + comF.feito + ', antes ' + antesF.feito + ')',
    (await situacao('aula-hoje')) === 'cancelada/true' && comF.feito === antesF.feito, V_CANCELA);
  if (MODO === V_CANCELA) fimDoVeneno();
  conf('o bloco diz "Cancelada, com cobrança"', /Cancelada, com cobrança/.test((await texto(pagC, '.cel-bloco[data-aula="aula-hoje"]')) || ''), true);
  await clicar(pagC, '#cel-abas .cel-aba[data-cel="fechamento"]');
  await pausa(200);
  conf('o Fechamento do celular mostra o mesmo valor feito (' + comF.feito + ')', ((await texto(pagC, '.cel-fechamento-aluno[data-aluno="alfa"]')) || '').indexOf(comF.feito) >= 0, true);
  await clicar(pagC, '#cel-abas .cel-aba[data-cel="hoje"]');

  secao('6. "Registrar como foi": situação, relato e assunto dado');
  await irParaDia(pagC, HOJE);
  await abrirFolha(pagC, 'aula-hoje');
  await clicar(pagC, '#cel-folha-registrar');
  conf('abrir o formulário tira o aviso da ação anterior (o "Aula cancelada" não aparece sobre o registro)', await existe(pagC, '#aviso.aberto'), false);
  m = await medirTela(pagC);
  conf('o formulário do relato: alvos de 48 px e sem rolagem de lado', m.pequenos.join('; ') + (m.rolaDeLado ? ' rola' : ''), '');
  await digitar(pagC, '#cel-relato-texto', 'Relato escrito no celular');
  await digitar(pagC, '#cel-relato-assunto', 'Frações equivalentes');
  await clicar(pagC, '#cel-relato-salvar');
  const relato = await esperar('o relato gravou', () => pagC.evaluate(() => Store.carregar().then(b => {
    const a = b.aulas.find(x => x.id === 'aula-hoje'); return a.notaTexto + '/' + (a.temas || []).map(t => t.titulo).join(','); })), v => v === 'Relato escrito no celular/Frações equivalentes', 10000);
  conf('o relato e o assunto estão na aula do celular', relato.ok, true);
  conf('e a situação escolhida antes (cancelada com cobrança) ficou', await situacao('aula-hoje'), 'cancelada/true');

  secao('6b. Remarcar: data, hora e duração preenchidas, os horários livres do dia e o aviso de choque');
  await irParaDia(pagC, TERCEIRO);
  await abrirFolha(pagC, 'aula-terceiro');
  await clicar(pagC, '#cel-folha-remarcar');
  const pre = await pagC.evaluate(() => ['#cel-remarcar-data', '#cel-remarcar-hora', '#cel-remarcar-duracao'].map(s => document.querySelector(s).value).join(' | '));
  conf('Remarcar vem com a data, a hora e a duração da aula', pre, ddmmaaaa(TERCEIRO) + ' | 11:00 | 60');
  await digitar(pagC, '#cel-remarcar-hora', '16:00');
  const choque = (await texto(pagC, '#cel-remarcar-choque')) || '';
  prop('o choque de horário avisa: às 16:00 já há a aula do Gama ("' + choque + '")', /Já há aula neste horário: Aluno Gama Teste às 16:00/.test(choque), V_CHOQUE);
  const livresR = await pagC.evaluate(() => Array.from(document.querySelectorAll('#cel-remarcar-livres .cel-livre-hora')).map(b => b.dataset.livre));
  prop('os horários livres do dia não oferecem 14:00 nem 16:00 (ocupados) e oferecem 13:00, 15:00 e 17:00 (' + livresR.join(' ') + ')',
    ['14:00', '14:30', '16:00', '16:30'].every(h => livresR.indexOf(h) < 0) && ['13:00', '15:00', '17:00'].every(h => livresR.indexOf(h) >= 0), V_CHOQUE);
  conf('com choque, o Salvar diz "Salvar mesmo assim (as duas aulas ficam no mesmo horário)"', await texto(pagC, '#cel-remarcar-salvar'),
    MODO === V_CHOQUE ? 'Salvar a nova data' : 'Salvar mesmo assim (as duas aulas ficam no mesmo horário)');
  if (MODO === V_CHOQUE) fimDoVeneno();
  pagC.recusarProximo = true;
  const dialogosAntes = pagC.dialogos.length;
  await clicar(pagC, '#cel-remarcar-salvar');
  await pausa(300);
  conf('salvar com choque pede o sim, e o "não" não grava (a aula continua às 11:00)', /As duas aulas vão ficar no mesmo horário/.test(pagC.dialogos.slice(dialogosAntes).join(' ')) &&
    (await pagC.evaluate(() => Store.carregar().then(b => b.aulas.find(x => x.id === 'aula-terceiro').hora))) === '11:00' && !!(await existe(pagC, '#cel-remarcar-salvar')), true);
  m = await medirTela(pagC);
  conf('o Remarcar: alvos de 48 px, sem rolagem de lado e sem o seletor do navegador', m.pequenos.join('; ') + (m.rolaDeLado ? ' rola' : '') + m.nativos.join(','), '');
  await tirarPrint(pagC, '3_remarcar_livres_e_choque.png');
  await clicar(pagC, '#cel-remarcar-livres .cel-livre-hora[data-livre="15:00"]');
  conf('o toque num horário livre põe a hora e tira o aviso de choque', await pagC.evaluate(() =>
    document.querySelector('#cel-remarcar-hora').value + '|' + document.querySelector('#cel-remarcar-choque').textContent + '|' + document.querySelector('#cel-remarcar-salvar').textContent), '15:00||Salvar a nova data');
  /* A hora ocupada no dia novo vem trocada pelo primeiro horário livre dali em diante. */
  await digitar(pagC, '#cel-remarcar-hora', '14:00');
  await digitar(pagC, '#cel-remarcar-data', ddmmaaaa(HOJE));
  conf('trocando a data para hoje, as 14:00 (ocupadas pela reposição do Gama) viram 15:00, o primeiro livre', await pagC.evaluate(() =>
    document.querySelector('#cel-remarcar-hora').value + '|' + document.querySelector('#cel-remarcar-choque').textContent), '15:00|');
  /* O formulário aberto não se perde quando chegam registros do tablet. */
  await digitar(pagC, '#cel-remarcar-data', '01/02/2027');
  await pagC.evaluate(() => Nuvem.receberRegistros());
  await pausa(300);
  conf('a data digitada no Remarcar continua depois de um recebimento', await pagC.evaluate(() => (document.querySelector('#cel-remarcar-data') || {}).value), '01/02/2027');
  await clicar(pagC, '#cel-folha-voltar');
  await clicar(pagC, '#cel-folha-fechar');
  conf('"Voltar" não grava nada: a aula continua às 11:00 do mesmo dia', await pagC.evaluate(() => Store.carregar().then(b => {
    const a = b.aulas.find(x => x.id === 'aula-terceiro'); return a.data + ' ' + a.hora; })), TERCEIRO + ' 11:00');

  secao('6c. Remarcar UMA aula da repetição: só esta muda, e o vínculo com a série fica');
  await abrirFolha(pagC, idGama1);
  await clicar(pagC, '#cel-folha-remarcar');
  conf('o Remarcar diz que, numa repetição, muda só esta', /muda só esta/.test((await texto(pagC, '#cel-remarcar-serie')) || ''), true);
  await digitar(pagC, '#cel-remarcar-data', ddmmaaaa(QUARTO));
  await digitar(pagC, '#cel-remarcar-hora', '17:00');
  await clicar(pagC, '#cel-remarcar-salvar');
  conf('(arranjo) a remarcação gravou: há aula do Gama em ' + QUARTO + ' às 17:00 (também nos venenos, senão eles nada provam)', (await esperar('a remarcação gravou', () => pagC.evaluate(q => Store.carregar().then(b => b.aulas.some(a => a.alunoId === 'gama' && a.data === q && a.hora === '17:00')), QUARTO), v => v === true, 10000)).ok, true);
  const retratoGama = pag => pag.evaluate((sid, q) => Store.carregar().then(b => {
    const s = (b.series || []).find(x => x.id === sid);
    const movida = b.aulas.find(a => a.alunoId === 'gama' && a.data === q);
    const outras = b.aulas.filter(a => a.serieId === sid && a !== movida);
    return { movida: movida ? [movida.serieId === sid, !!movida.destacada, movida.hora, movida.duracaoMin].join(' ') : 'nenhuma',
      outras: outras.map(a => a.data + ' ' + a.hora + ' ' + a.duracaoMin + (a.destacada ? ' destacada' : '')).sort().join('; '),
      serie: s ? s.hora + ' ' + (s.exclusoes || []).join(',') : 'sem série', gama: b.aulas.filter(a => a.alunoId === 'gama' && a.serieId).length };
  }), serieGama.id, QUARTO);
  const outrasAntes = serieGama.aulas.map(t => t.split(' ')).filter(p => p[1] !== TERCEIRO).map(p => p[1] + ' 16:00 60').sort().join('; ');
  const rg = await retratoGama(pagC);
  console.log('   no celular: ' + JSON.stringify(rg));
  prop('a aula remarcada continua na série (destacada, às 17:00, 1h) e a data de onde saiu fica como exclusão da série',
    rg.movida === 'true true 17:00 60' && rg.serie.split(' ')[1] === TERCEIRO, V_SOLTA);
  prop('as outras três aulas da repetição não mudaram, nem a hora da série (' + rg.outras + ')', rg.outras === outrasAntes && rg.serie.split(' ')[0] === '16:00', V_TODAS);
  if (MODO === V_SOLTA || MODO === V_TODAS) fimDoVeneno();
  conf('Hoje foi ao dia novo da aula, às 17:00', (await texto(pagC, '#cel-dia-titulo')).indexOf(QUARTO.slice(8, 10) + '/' + QUARTO.slice(5, 7)) >= 0 &&
    !!(await existe(pagC, '.cel-bloco[data-aula="' + idGama1 + '"]')), true);

  secao('6d. O fechamento de referência de junho continua igual depois de remarcar a aula de 1h30 dele');
  conf('a faixa da semana chega a 10/06/2026', await irParaDia(pagC, '2026-06-10'), true);
  await abrirFolha(pagC, 'ref-2026-06-10');
  await clicar(pagC, '#cel-folha-remarcar');
  conf('o Remarcar da aula de junho traz a duração dela, 1h30', await pagC.evaluate(() => document.querySelector('#cel-remarcar-duracao').value), MODO === V_DURACAO ? '60' : '90');
  await digitar(pagC, '#cel-remarcar-data', '12/06/2026');
  await clicar(pagC, '#cel-remarcar-salvar');
  await esperar('a aula de junho foi para 12/06', () => pagC.evaluate(() => Store.carregar().then(b => b.aulas.find(a => a.id === 'ref-2026-06-10').data)), v => v === '2026-06-12', 10000);
  const junhoC = await fechamentoDe(pagC, 'ref', '2026-06');
  prop('junho no celular: 10 encontros, 10:30, R$ 1.050,00 (' + JSON.stringify(junhoC) + ')',
    junhoC.linhas === REF_JUNHO.linhas && junhoC.horas === REF_JUNHO.horas && junhoC.total === REF_JUNHO.total, V_DURACAO);
  if (MODO === V_DURACAO) fimDoVeneno();
  await clicar(pagC, '#cel-abas .cel-aba[data-cel="fechamento"]');
  for (let i = 0; i < 24 && ((await texto(pagC, '#cel-fechamento .cel-mes .cel-titulo')) || '') !== 'Junho de 2026'; i++) await clicar(pagC, '#cel-fechamento .cel-mes button[aria-label="Mês anterior"]');
  conf('e o Fechamento do celular, em junho, diz 10 aulas dadas, 10:30 h e R$ 1.050,00',
    /10 aulas dadas · 10:30 h · R\$\s?1\.050,00/.test((await texto(pagC, '.cel-fechamento-aluno[data-aluno="ref"]')) || ''), true);
  for (let i = 0; i < 24 && ((await texto(pagC, '#cel-fechamento .cel-mes .cel-titulo')) || '') !== (await pagC.evaluate(m => Core.mesExtenso(m), MES)); i++) await clicar(pagC, '#cel-fechamento .cel-mes button[aria-label="Mês seguinte"]');
  await clicar(pagC, '#cel-abas .cel-aba[data-cel="hoje"]');
  await irParaDia(pagC, HOJE);

  secao('7. Cadastrar aluno: o essencial');
  await clicar(pagC, '#cel-novo-aluno');
  conf('o cadastro abre sem o aviso "Aula salva." da ação anterior', await existe(pagC, '#aviso.aberto'), false);
  conf('a tela diz que o resto fica no tablet', /se completam no tablet/.test(await texto(pagC, '#cel-aluno-resto')), true);
  m = await medirTela(pagC);
  conf('o formulário do aluno: alvos de 48 px e sem rolagem de lado', m.pequenos.join('; ') + (m.rolaDeLado ? ' rola' : ''), '');
  conf('o formulário tem só nome, responsável, contato, preço e (D6c lote 2) onde é a aula', m.campos.join(','), 'cel-aluno-nome,cel-aluno-responsavel,cel-aluno-contato,cel-aluno-preco,cel-aluno-local');
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
  conf('(D6c) o "pago em" do celular pede a data como dd/mm/aaaa, sem o seletor do navegador', await pagC.evaluate(() => { const c = document.querySelector('.cel-fechamento-aluno[data-aluno="alfa"] .pagamento-data'); return c.type + ' ' + c.value; }), 'text ' + ddmmaaaa(HOJE));
  await digitar(pagC, '.cel-fechamento-aluno[data-aluno="alfa"] .pagamento-data', ddmmaaaa(HOJE));
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
  /* (D6c) O que a folha fez chega ao tablet igual: a remarcação de uma aula
   * da repetição (o tablet, ao abrir, materializa a série e não recria a
   * aula na data de onde ela saiu), o cancelar de hoje com cobrança, o faltou
   * e realizada, e junho. */
  const rgA = await retratoGama(pagA);
  console.log('   no tablet: ' + JSON.stringify(rgA));
  conf('(D6c) remarcar chegou ao tablet: a aula na série, destacada, às 17:00, e as outras três como estavam', JSON.stringify(rgA), JSON.stringify(rg));
  conf('(D6c) e o tablet, ao abrir, não recriou a aula na data de onde ela saiu (a repetição continua com quatro)', rgA.gama, 4);
  conf('(D6c) cancelar hoje com cobrança chegou ao tablet', await pagA.evaluate(() => Store.carregar().then(b => { const a = b.aulas.find(x => x.id === 'aula-hoje'); return a.status + '/' + a.cobravel; })), 'cancelada/true');
  conf('(D6c) faltou e realizada: a aula de ontem chegou ao tablet como realizada', await pagA.evaluate(() => Store.carregar().then(b => b.aulas.find(x => x.id === 'aula-ontem').status)), 'realizada');
  const junhoA = await fechamentoDe(pagA, 'ref', '2026-06');
  conf('(D6c) junho no tablet depois da remarcação do celular: 10 encontros, 10:30, R$ 1.050,00 (' + JSON.stringify(junhoA) + ')',
    junhoA.linhas + ' ' + junhoA.horas + ' ' + junhoA.total, REF_JUNHO.linhas + ' ' + REF_JUNHO.horas + ' ' + REF_JUNHO.total);
  conf('(D6c) e a aula de 1h30 está em 12/06 no tablet', await pagA.evaluate(() => Store.carregar().then(b => { const a = b.aulas.find(x => x.id === 'ref-2026-06-10'); return a.data + ' ' + a.duracaoMin; })), '2026-06-12 90');
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
  await irParaDia(pagC, TERCEIRO);
  await cancelarPelaFolha(pagC, 'aula-terceiro', false);
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
  await irParaDia(pagC, HOJE);
  await abrirFolha(pagC, 'aula-hoje');
  await clicar(pagC, '#cel-folha-registrar');
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
  conf('fechando o formulário, Hoje volta à linha do tempo, com a aula', await existe(pagC, '#cel-tempo .cel-bloco[data-aula="aula-hoje"]'), true);

  secao('11c. Trinta ações com Desfazer no celular: o histórico fica em 25 e o Desfazer continua');
  await irParaDia(pagC, TERCEIRO);
  const falhasDoDesfazer = [];
  for (let k = 0; k < 30; k++) {
    await cancelarPelaFolha(pagC, idMarcada, false);
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
  await irParaDia(pagC, TERCEIRO);
  await cancelarPelaFolha(pagC, idMarcada, false);
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
  const tudoDoCelular = Array.from(new Set((await escritasLidas(pagC)).map(n => decodeURIComponent(n.replace(/^.*\/documents\/usuarios\/[^/]+\//, '')))));
  console.log('   o que subiu do celular: ' + tudoDoCelular.join(', '));
  /* (D7) o diagnóstico do celular, só o do PRÓPRIO aparelho, é a outra coisa
   * que sobe dele; fica fora da conta dos registros, abaixo. */
  const diagnosticosDoCelular = tudoDoCelular.filter(n => /^diagnostico\//.test(n));
  conf('(D7) o celular que editou sobe o diagnóstico dele, e só o do próprio aparelho', diagnosticosDoCelular.join(','), 'diagnostico/' + idCelular);
  const enviadosDoCelular = tudoDoCelular.filter(n => !/^diagnostico\//.test(n));
  // (D6c) e os da folha: faltou e realizada (ontem), a remarcação da repetição (a aula e a série) e a de junho
  const esperados = ['registros/aula:' + idMarcada, 'registros/aula:aula-outro', 'registros/aula:aula-hoje', 'registros/aluno:' + idBeta, 'registros/aula:aula-terceiro',
    'registros/aula:aula-ontem', 'registros/aula:' + idGama1, 'registros/serie:' + serieGama.id, 'registros/aula:ref-2026-06-10'];
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
    if (t === 'hoje') conf('(controle) o observador vê a linha do tempo, com a aula de hoje', /Aluno Alfa Teste/.test((await texto(pagD, '#cel-tempo .cel-bloco[data-aula="aula-hoje"]')) || ''), true);
  }
  /* (D6c) a linha do tempo do observador: o toque no bloco mostra a aula, sem
   * nenhuma ação; nem o "+", nem as horas dos horários livres. */
  await clicar(pagD, '#cel-abas .cel-aba[data-cel="hoje"]');
  await pausa(200);
  const livresD = await pagD.evaluate(() => document.querySelectorAll('#cel-tempo .cel-livre').length);
  const abriuD = await abrirFolha(pagD, 'aula-hoje');
  const folhaD = await pagD.evaluate(() => ({
    acoes: document.querySelectorAll('#modo-celular [data-acao-celular]').length,
    botoes: Array.from(document.querySelectorAll('#cel-folha button')).map(b => b.id || b.textContent.trim()).join(','),
    mais: !!document.querySelector('#cel-marcar-aula'), horas: document.querySelectorAll('.cel-livre-hora').length
  }));
  conf('(controle) o observador vê a linha do tempo e a folha abre com a aula', livresD >= 0 && !!(await existe(pagD, '#cel-tempo')) && abriuD && /Aluno Alfa Teste/.test((await texto(pagD, '#cel-folha')) || ''), true);
  prop('(D6c) na linha do tempo e na folha do observador, nenhuma ação: sem "+", sem horas para marcar, só o nome (a ficha mínima) e "Fechar" (' + JSON.stringify(folhaD) + ')',
    folhaD.acoes === 0 && !folhaD.mais && folhaD.horas === 0 && /^cel-folha-ficha,(Ver a sua anotação,)?cel-folha-fechar$/.test(folhaD.botoes), MODOS[1]);
  await clicar(pagD, '#cel-folha-fechar');
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
