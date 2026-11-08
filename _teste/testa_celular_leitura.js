/* testa_celular_leitura.js
 *
 * D6, parte 1: o modo celular só leitura, no navegador e contra o Firebase
 * Emulator Suite (Auth e Firestore), do mesmo jeito que o testa_nuvem.js.
 *
 * O tablet (1280 px) cria dados fictícios e sobe a cópia. O celular (390 por
 * 844) abre, entra com e-mail e senha, digita o código da chave e traz a cópia
 * pelo caminho que já existe ("Restaurar neste aparelho"). Daí em diante:
 *   - as três telas (Hoje, Fechamento, Enviar) existem, sem rolagem de lado,
 *     com todo alvo de toque de pelo menos 44 px, e a grade do mês não aparece;
 *   - Hoje mostra a cópia restaurada: a aula do dia, o lembrete e a nota só
 *     minha (fechada, abre com um toque);
 *   - no alto, "Dados de hoje, HH:MM, do tablet.";
 *   - NENHUMA gravação no banco apoio-educacional além das restaurações: um
 *     espião em IDBDatabase.prototype.transaction (como o testa_store_grava_
 *     no_commit do B3) conta toda transação de escrita, do primeiro instante
 *     da página;
 *   - NENHUM envio à nuvem deste aparelho: todo pedido de escrita ao
 *     Firestore (commit, PATCH, DELETE) que sai da página é contado, nem ao
 *     fechar, nem ao voltar (a diária), nem deitado com mais de 640 px;
 *   - ao abrir com sinal, o celular busca a cópia mais nova e a aplica;
 *   - o celular que restaurou pela tela do tablet na versão de antes (sem a
 *     marca, com a automática ligada e mudança pendente) não sobe nada em pé.
 *
 * Venenos, que TÊM de reprovar a propriedade (a rodada passa quando a prova
 * VÊ o veneno):
 *   --envenenado-envia    as travas de envio tiradas (nuvem.js e app.js) e a
 *                         restauração pelo celular ligando a automática;
 *   --envenenado-edicao   um botão "Registrar como foi" no cartão da aula de
 *                         Hoje;
 *   --envenenado-grava    a trava do banco tirada e o celular gravando a carga
 *                         inicial ao abrir.
 *
 * Precisa do firebase-tools fora do repositório e de um JDK 21 em JAVA_HOME,
 * como o testa_nuvem.js; sem eles, reprova dizendo onde procurou.
 * Portas: 8892 (app), 8893 (auth), 8894 (firestore), 8895 (hub), 8896 (log),
 * 8897 (websocket do emulador). Nunca a 8777 do portão.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const MODO = ['--envenenado-envia', '--envenenado-edicao', '--envenenado-grava']
  .filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const ENVIA = MODO === '--envenenado-envia';
const EDICAO = MODO === '--envenenado-edicao';
const GRAVA = MODO === '--envenenado-grava';

const PORTA_APP = 8892, PORTA_AUTH = 8893, PORTA_FS = 8894, PORTA_HUB = 8895, PORTA_LOG = 8896, PORTA_WS = 8897;
const PROJETO = 'demo-nath-d6a';
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

/* A propriedade de cada veneno: no modo dele, a prova tem de vê-la quebrada. */
function prop(rotulo, ok, veneno) {
  if (MODO && MODO === veneno) return conf('VENENO visto: ' + rotulo + ', e quebrou', ok, false);
  return conf(rotulo, ok, true);
}

/* ---------- âncoras ---------- */
secao('0. As âncoras e o ambiente');
const PODE_ENVIAR = 'function podeEnviar() { return !marcaSoLeitura && !travadoNestaAbertura; }';
const GUARDA_AUTO_RE = /    if \(aparelhoSoLe\(\)\) return;\r?\n/;
const AUTO_RESTAURA = 'automatica = !soLe;';
const ENVIO_DELA = 'if (!temNuvem() || enviandoParaNuvem || aparelhoSoLe()) return Promise.resolve();';
const CARTAO = "    cartao.appendChild(el('div', { class: 'ajuda u-margem-0', texto: Core.fmtDuracao(Number(a.duracaoMin) || 0) +";
const TRAVA_BANCO = "if (modo === 'readwrite' && soLeitura && !restauracaoDaNuvem) throw erroSoLeitura();";
const SALVAR_GUARDA = '    if (aparelhoSoLe()) {';
const SEM_CARGA = '} else if (modoCelular) {';
conf('a trava de envio do nuvem.js está num lugar só', NUVEM.split(PODE_ENVIAR).length, 2);
conf('o commit e a automática do nuvem.js passam pela trava', /function commit\(escritas\) \{\r?\n    if \(!podeEnviar\(\)\)/.test(NUVEM) &&
  NUVEM.indexOf('return !!(podeEnviar() && sessao') > 0, true);
conf('a automática do app.js recusa no aparelho que só lê, num lugar só', (APP.match(new RegExp(GUARDA_AUTO_RE.source, 'g')) || []).length, 1);
conf('o envio do app.js recusa no aparelho que só lê, num lugar só', APP.split(ENVIO_DELA).length, 2);
conf('a restauração pelo celular deixa a automática desligada num lugar só', NUVEM.split(AUTO_RESTAURA).length, 2);
conf('o cartão da aula de Hoje existe para o veneno de edição', APP.split(CARTAO).length, 2);
conf('a trava do banco está num lugar só', STORE.split(TRAVA_BANCO).length, 2);
/* Toda transação do banco passa pela trava: b.transaction só aparece dentro dela. */
conf('o store.js só abre transação pela trava (um b.transaction, o de dentro dela)',
  (STORE.match(/\.transaction\(/g) || []).length, 1);
conf('o salvar() do app.js tem a recusa do só leitura num lugar só', APP.split(SALVAR_GUARDA).length, 2);
conf('o celular sem dados não grava a carga inicial (âncora)', APP.split(SEM_CARGA).length, 2);

const trocas = {};
if (ENVIA) {
  trocas['/nuvem.js'] = NUVEM.replace(PODE_ENVIAR, 'function podeEnviar() { return true; }').replace(AUTO_RESTAURA, 'automatica = true;');
  trocas['/app.js'] = APP.replace(GUARDA_AUTO_RE, '\n').replace(ENVIO_DELA, 'if (!temNuvem() || enviandoParaNuvem) return Promise.resolve();');
}
if (EDICAO) {
  trocas['/app.js'] = APP.replace(CARTAO, "    cartao.appendChild(el('button', { type: 'button', class: 'btn pequeno', texto: 'Registrar como foi' }));\n" + CARTAO);
}
if (GRAVA) {
  trocas['/store.js'] = STORE.replace(TRAVA_BANCO, '');
  trocas['/app.js'] = APP.replace(SALVAR_GUARDA, '    if (false) {').replace(SEM_CARGA, '} else if (false) {');
}

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

/* ---------- o emulador (o mesmo desenho do testa_nuvem.js) ---------- */
const PASTA = path.join(os.tmpdir(), 'nath_d6a_emulador_' + process.pid);
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
const docUrl = (uid, rel) => FS + '/v1/projects/' + PROJETO + '/databases/(default)/documents/usuarios/' + uid + (rel ? '/' + rel : '');

/* ---------- a página e os instrumentos ---------- */
const CFG = { auth: AUTH, firestore: FS, projectId: PROJETO };
const amb = H.criarAmbiente(PORTA_APP, 'nath_d6a_celular', trocas);

async function prepararPagina(pag, largura, altura) {
  pag.setDefaultTimeout(60000);
  await pag.setViewport({ width: largura, height: altura, hasTouch: true, isMobile: largura < 640 });
  pag.errosDePagina = [];
  pag.on('pageerror', e => pag.errosDePagina.push(e.message));
  pag.dialogos = [];
  pag.on('dialog', async d => { pag.dialogos.push(d.message()); try { await d.accept(); } catch (e) { /* ok */ } });
  /* Toda escrita na nuvem que sai DESTA página: o commit (cópia, rotação,
   * leitores) e qualquer PATCH ou DELETE no Firestore. */
  pag.escritasNaNuvem = [];
  pag.on('request', r => {
    const u = r.url();
    if (u.indexOf(FS) !== 0) return;
    if (/:commit\b/.test(u) || r.method() === 'PATCH' || r.method() === 'DELETE') pag.escritasNaNuvem.push(r.method() + ' ' + u);
  });
  await pag.evaluateOnNewDocument(cfg => { window.NUVEM_EMULADOR = cfg; }, CFG);
  /* O espião do banco, desde o primeiro instante da página: toda transação de
   * escrita no apoio-educacional fica anotada, com os depósitos. A lista vive
   * no sessionStorage da aba, e não só na memória da página: o service worker
   * novo assume e recarrega a página logo na primeira abertura, e uma lista só
   * em memória perdia a gravação feita antes da recarga (visto com o veneno
   * --envenenado-grava: 12 alunos no banco e a lista vazia). */
  await pag.evaluateOnNewDocument(() => {
    const original = IDBDatabase.prototype.transaction;
    let antes = [];
    try { antes = JSON.parse(sessionStorage.getItem('__escritas') || '[]'); } catch (e) { antes = ['sessionStorage ilegível']; }
    window.__escritas = antes;
    IDBDatabase.prototype.transaction = function (nomes, modo) {
      if (modo === 'readwrite' && this.name === 'apoio-educacional') {
        window.__escritas.push([].concat(nomes).join(','));
        try { sessionStorage.setItem('__escritas', JSON.stringify(window.__escritas)); } catch (e) { window.__escritas.push('sessionStorage recusou'); }
      }
      return original.apply(this, arguments);
    };
  });
}
const escritasNoBanco = pag => pag.evaluate(() => window.__escritas.slice());
/* Zera a conta da aba, para medir só o que vem depois. */
const zerarEscritas = pag => pag.evaluate(() => { window.__escritas = []; sessionStorage.removeItem('__escritas'); });
const texto = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent : null; }, sel);
const existe = (pag, sel) => pag.evaluate(s => !!document.querySelector(s), sel);
const clicar = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.click(); return true; }, sel);
async function digitar(pag, sel, valor) {
  await pag.evaluate((s, v) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, sel, valor);
}
async function abrir(pag) {
  await pag.goto(amb.ORIGEM + '/index.html', { waitUntil: 'networkidle0' });
  const ok = await esperar('o aplicativo abriu', () => pag.evaluate(() =>
    typeof Store === 'object' && !!document.querySelector('#versao-app') && document.querySelector('#versao-app').textContent.length > 1),
  v => v === true, 40000);
  if (!ok.ok) throw Object.assign(new Error('o aplicativo não abriu'), { jaContado: false });
  await pausa(1200);
  await pag.evaluate(() => {
    const b = document.querySelector('#entendi-novidades');
    if (b && document.querySelector('#modal-novidades.aberto')) b.click();
  });
}
/* Fechar e voltar: o "fechar" e a "diária" da cópia automática. */
async function fecharEVoltar(pag) {
  await pag.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pagehide'));
  });
  await pausa(600);
  await pag.evaluate(() => {
    delete document.visibilityState;
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
    delete document.visibilityState;
  });
  await pausa(2500);
}

/* O que está à vista na página, medido: rolagem de lado, alvos e edição. */
const RE_EDICAO = 'registrar|editar|salvar|excluir|apagar|nova aula|novo aluno|^\\s*\\+|desmarcar|marcar|cancelar a aula|pago em|anotar';
const medirTela = (pag) => pag.evaluate((reEdicao) => {
  const re = new RegExp(reEdicao, 'i');
  const visivel = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  const abertas = Array.from(document.querySelectorAll('.fundo-modal.aberto'));
  const raiz = document.querySelector('#modo-celular');
  const alvos = Array.from(raiz.querySelectorAll('button, a[href], input, select, textarea, [role=button], summary')).filter(visivel);
  const pequenos = alvos.filter(e => { const r = e.getBoundingClientRect(); return r.height < 44 || r.width < 44; })
    .map(e => (e.id || e.textContent.trim().slice(0, 30)) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
  /* Edição: no celular, campo de escrever (fora da entrada da conta) ou botão
   * com verbo de edição; no documento inteiro, os botões de edição do tablet
   * à vista. */
  const campos = Array.from(raiz.querySelectorAll('input, select, textarea, [contenteditable=true]')).filter(visivel)
    .filter(e => !e.closest('#cel-entrada')).map(e => e.id || e.tagName);
  const botoesEdicao = Array.from(document.querySelectorAll('button')).filter(visivel)
    .filter(b => !b.closest('.fundo-modal')).filter(b => re.test(b.textContent)).map(b => b.textContent.trim());
  const doTablet = ['#nova-aula', '#novo-aluno', '#proposta-nova', '#grade-mes', '#abas', '#nuvem-enviar']
    .filter(s => { const e = document.querySelector(s); return e && visivel(e); });
  const conteudo = document.querySelector('#cel-conteudo');
  return {
    largura: window.innerWidth,
    rolaDeLado: document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth ||
      (conteudo && conteudo.scrollWidth > conteudo.clientWidth),
    alvos: alvos.length, pequenos, campos, botoesEdicao, doTablet, abertas: abertas.map(m => m.id),
    celular: document.body.classList.contains('modo-celular')
  };
}, RE_EDICAO);

function hojeIso() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
const HOJE = hojeIso();
const ONTEM = (() => { const d = new Date(); d.setDate(d.getDate() - 1); const p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); })();

(async function () {
  secao('1. O emulador e a conta da dona');
  await subirEmulador();
  const dona = (await rest(AUTH + '/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake',
    { corpo: { email: DONA.email, password: DONA.senha, returnSecureToken: true } })).json;
  conf('a conta foi criada no emulador', !!(dona && dona.localId), true);
  const ponteiroAgora = async () => {
    const r = await rest(docUrl(dona.localId, 'estado/copia'), { token: dona.idToken });
    return r.json && r.json.fields ? r.json.fields.atual.stringValue : null;
  };

  secao('2. O tablet (1280 px) cria dados fictícios e sobe a cópia');
  await amb.subir();
  const pagA = await amb.pagina();
  await prepararPagina(pagA, 1280, 1000);
  await abrir(pagA);
  await pagA.evaluate(async (hoje, ontem) => {
    const d = Store.bancoVazio();
    d.alunos = [{ id: 'alfa', nome: 'Aluno Alfa Teste', ativo: true, cor: '#1F3A5F',
      precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 100 }],
      mapeamentos: [{ id: 'm1', data: '2026-10-01', prioridades: 'Frações antes da prova', marcados: {} }] }];
    d.aulas = [
      { id: 'aula-ontem', alunoId: 'alfa', data: ontem, hora: '09:00', duracaoMin: 60, status: 'realizada',
        notaTexto: 'Rendeu bem em frações', notaPrivada: 'Mãe pediu para falar da prova' },
      { id: 'aula-hoje', alunoId: 'alfa', data: hoje, hora: '10:30', duracaoMin: 90, status: 'realizada' }
    ];
    await Store.salvar(d);
  }, HOJE, ONTEM);
  await abrir(pagA);
  conf('o tablet está no modo de sempre (sem a classe do celular, com as abas)', await pagA.evaluate(() =>
    !document.body.classList.contains('modo-celular') && !!document.querySelector('#abas').getBoundingClientRect().height), true);
  await pagA.evaluate(() => document.querySelector('#abas .aba[data-tela="ajustes"]').click());
  await pausa(200);
  await digitar(pagA, '#nuvem-email', DONA.email);
  await digitar(pagA, '#nuvem-senha', DONA.senha);
  await clicar(pagA, '#nuvem-entrar');
  conf('o tablet entrou', (await esperar('o tablet entrou', () => existe(pagA, '#nuvem-enviar'), v => v === true, 15000)).ok, true);
  await clicar(pagA, '#nuvem-enviar');
  const subiu = await esperar('a cópia do tablet subiu', ponteiroAgora, v => !!v, 30000);
  conf('a cópia do tablet está na nuvem', subiu.ok, true);
  conf('o instrumento vê as escritas na nuvem (as do tablet)', pagA.escritasNaNuvem.length > 0, true);
  const idTablet = subiu.valor;
  const chave = await pagA.evaluate(() => Nuvem.verChave());

  secao('3. O celular (390 x 844) abre sem dados, entra e traz a cópia');
  const ctxB = await pagA.browser().createBrowserContext();
  const pagB = await ctxB.newPage();
  await prepararPagina(pagB, 390, 844);
  await abrir(pagB);
  let m = await medirTela(pagB);
  conf('abaixo de 640 px o aplicativo entra no modo celular', m.celular, true);
  prop('ao abrir sem dados, o celular não grava nada no banco (nem a carga inicial)', (await escritasNoBanco(pagB)).length === 0, '--envenenado-grava');
  if (GRAVA) { await ctxB.close(); return; }
  conf('sem dados, aparece a entrada (conta e chave) e não as abas', await pagB.evaluate(() =>
    document.querySelector('#cel-entrada').classList.contains('ativa') && document.querySelector('#cel-abas').hidden), true);
  conf('a grade do mês e as abas do tablet não aparecem', m.doTablet.join(','), '');
  conf('só um formulário de entrada na página (o de Ajustes fica vazio no celular)',
    await pagB.evaluate(() => document.querySelectorAll('#nuvem-email').length), 1);
  await digitar(pagB, '#cel-conta #nuvem-email', DONA.email);
  await digitar(pagB, '#cel-conta #nuvem-senha', DONA.senha);
  await clicar(pagB, '#cel-conta #nuvem-entrar');
  conf('o celular entrou com e-mail e senha', (await esperar('o botão de trazer a cópia apareceu', () => existe(pagB, '#cel-trazer'), v => v === true, 15000)).ok, true);
  await clicar(pagB, '#cel-trazer');
  const lista = await esperar('a janela lista a cópia do tablet', () => pagB.evaluate(() =>
    document.querySelectorAll('#modal-nuvem-restaurar.aberto #nuvem-copias input[type=radio]').length), v => v >= 1, 15000);
  conf('"Trazer a cópia do tablet" abre a restauração de sempre, com a cópia', lista.ok, true);
  await digitar(pagB, '#nuvem-codigo-digitado', chave.formatado);
  await clicar(pagB, '#nuvem-restaurar-confirmar');
  const veio = await esperar('a cópia chegou e Hoje mostra a aula', () => pagB.evaluate(() =>
    !document.querySelector('#modal-nuvem-restaurar.aberto') && document.querySelector('#cel-hoje.ativa') &&
    /Aluno Alfa Teste/.test(document.querySelector('#cel-hoje').textContent)), v => v === true, 30000);
  conf('a cópia restaurada aparece em Hoje', veio.ok, true);
  conf('a pergunta de restaurar diz que o celular passa a só ler', pagB.dialogos.some(d => /passa a só ler/.test(d)), true);
  let escritas = await escritasNoBanco(pagB);
  conf('a única escrita no banco foi a restauração (uma transação, com os dados)', escritas.length === 1 && /dados/.test(escritas[0]), true);
  conf('a marca "só leitura" foi gravada, de que conta, e a automática ficou desligada', await pagB.evaluate(u => {
    const e = Nuvem.estado(); return e.soLeitura && e.uidDona === u && e.automatica === false;
  }, dona.localId), ENVIA ? false : true);
  conf('no alto: "Dados de hoje, HH:MM, do tablet."', /^Dados de hoje, \d\d:\d\d, do tablet\.$/.test(await texto(pagB, '#cel-origem')), true);

  secao('4. As três telas: sem rolagem de lado, alvos de 44 px e nenhum botão de edição');
  const hojeTexto = await texto(pagB, '#cel-hoje');
  conf('Hoje: a aula do dia, com o horário', /10:30 Aluno Alfa Teste/.test(hojeTexto), true);
  conf('Hoje: o lembrete do mapeamento', /Lembrete: Prioridades: Frações antes da prova/.test(hojeTexto), true);
  conf('Hoje: a última aula e o relato', /Na última aula/.test(hojeTexto) && /Rendeu bem em frações/.test(hojeTexto), true);
  conf('Hoje: a nota só minha nasce fechada', await pagB.evaluate(() => document.querySelector('.cel-so-minha').hidden), true);
  await clicar(pagB, '.cel-ver-nota');
  conf('Hoje: um toque abre a nota só minha', await pagB.evaluate(() =>
    !document.querySelector('.cel-so-minha').hidden && /Mãe pediu para falar da prova/.test(document.querySelector('.cel-so-minha').textContent)), true);
  const telas = { hoje: null, fechamento: null, enviar: null };
  for (const t of Object.keys(telas)) {
    await clicar(pagB, '#cel-abas .cel-aba[data-cel="' + t + '"]');
    await pausa(200);
    telas[t] = await medirTela(pagB);
    const ativa = await pagB.evaluate(t => document.querySelector('#cel-' + t).classList.contains('ativa') &&
      document.querySelector('#cel-' + t).textContent.trim().length > 0, t);
    conf('a tela "' + t + '" existe e abre pela aba de baixo', ativa, true);
    conf('"' + t + '": sem rolagem de lado em ' + telas[t].largura + ' px', telas[t].rolaDeLado, false);
    conf('"' + t + '": todo alvo de toque tem 44 px ou mais (' + telas[t].alvos + ' alvos)', telas[t].pequenos.join('; '), '');
    prop('"' + t + '": nenhum botão de edição nem campo de escrever (' + (telas[t].botoesEdicao.concat(telas[t].campos).join(', ') || 'nenhum') + ')',
      telas[t].botoesEdicao.length === 0 && telas[t].campos.length === 0, t === 'hoje' ? '--envenenado-edicao' : 'nenhum');
    conf('"' + t + '": nada do tablet à vista', telas[t].doTablet.join(','), '');
  }
  if (EDICAO) { await ctxB.close(); return; }
  conf('as abas de baixo têm alvo de 44 px ou mais', await pagB.evaluate(() =>
    Array.from(document.querySelectorAll('#cel-abas .cel-aba')).every(b => b.getBoundingClientRect().height >= 44)), true);
  conf('Fechamento: o aluno, as aulas e o valor do mês', await pagB.evaluate(() => {
    document.querySelector('#cel-abas .cel-aba[data-cel="fechamento"]').click();
    const t = document.querySelector('#cel-fechamento').textContent;
    return /Aluno Alfa Teste/.test(t) && /R\$/.test(t);
  }), true);
  await clicar(pagB, '#cel-abas .cel-aba[data-cel="enviar"]');
  await pausa(200);
  const baixados = await pagB.evaluate(() => {
    window.__baixou = [];
    // o compartilhar do celular (onde ela escolhe o WhatsApp), anotado em vez de aberto
    navigator.canShare = () => true;
    navigator.share = d => { window.__baixou.push(d.files[0].name + ' ' + d.files[0].type); return Promise.resolve(); };
    const b = Array.from(document.querySelectorAll('#cel-enviar .cel-familia button')).find(x => /Enviar o PDF/.test(x.textContent));
    if (b) b.click();
    return !!b;
  });
  conf('Enviar: cada família tem "Enviar o PDF"', baixados, true);
  const pdf = await esperar('o PDF do fechamento saiu pelo caminho do tablet', () => pagB.evaluate(() => window.__baixou.slice()), v => v && v.length > 0, 10000);
  conf('o PDF do fechamento foi para o compartilhar do celular (o mesmo exportarAlunoEmPdf)', pdf.ok && /^Fechamento.*\.pdf application\/pdf$/.test(pdf.valor[0]), true);
  await clicar(pagB, '#cel-enviar-todas');
  conf('"Enviar para todas as famílias" abre a janela de sempre', await esperar('a janela do envio abriu', () =>
    existe(pagB, '#modal-envio-familias.aberto #envio-enviar'), v => v === true, 5000).then(r => r.ok), true);
  await pagB.evaluate(() => document.querySelector('#envio-parar').click());
  await pagB.evaluate(() => document.querySelector('#envio-fechar').click());
  conf('usar as três telas e enviar não gravou nada no banco', (await escritasNoBanco(pagB)).length, 1);

  secao('5. Nenhum envio à nuvem do celular: ao fechar, ao voltar, deitado');
  const antesB = pagB.escritasNaNuvem.length;
  await pagB.evaluate(() => Nuvem.marcarMudanca()); // uma mudança pendente: a automática teria motivo para subir
  await fecharEVoltar(pagB);
  prop('fechar e voltar com mudança pendente: nenhuma escrita na nuvem saiu do celular (' + pagB.escritasNaNuvem.slice(antesB).join(' ') + ')',
    pagB.escritasNaNuvem.length === antesB, '--envenenado-envia');
  if (!ENVIA) {
    conf('a cópia na nuvem continua a do tablet', await ponteiroAgora(), idTablet);
    await pagB.setViewport({ width: 900, height: 420, hasTouch: true, isMobile: true });
    await pausa(800);
    conf('deitado, com 900 px, continua no modo celular (a marca, não a largura)', (await medirTela(pagB)).celular, true);
    await zerarEscritas(pagB);
    await abrir(pagB);
    const deitado = await medirTela(pagB);
    conf('reaberto deitado, continua no modo celular', deitado.celular, true);
    conf('deitado: nada do tablet à vista e nenhum botão de edição', deitado.doTablet.concat(deitado.botoesEdicao).join(','), '');
    await pagB.evaluate(() => Nuvem.marcarMudanca());
    await fecharEVoltar(pagB);
    conf('deitado, fechar e voltar: nenhuma escrita na nuvem do celular', pagB.escritasNaNuvem.length, antesB);
    conf('reaberto deitado: nenhuma escrita no banco (a cópia já era a mais nova)', (await escritasNoBanco(pagB)).length, 0);
    await pagB.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });

    secao('6. Ao abrir com sinal, o celular busca a cópia mais nova e a aplica');
    await pagA.evaluate(async (hoje) => {
      const d = await Store.carregar();
      d.alunos.push({ id: 'beta', nome: 'Aluno Beta Teste', ativo: true, cor: '#2E7D6B', precos: [] });
      d.aulas.push({ id: 'aula-beta', alunoId: 'beta', data: hoje, hora: '16:00', duracaoMin: 60, status: 'realizada' });
      await Store.salvar(d);
    }, HOJE);
    await abrir(pagA);
    await pagA.evaluate(() => document.querySelector('#abas .aba[data-tela="ajustes"]').click());
    await pausa(200);
    await clicar(pagA, '#nuvem-enviar');
    const nova = await esperar('a cópia nova do tablet subiu', ponteiroAgora, v => !!v && v !== idTablet, 30000);
    conf('o tablet subiu uma cópia nova', nova.ok, true);
    await zerarEscritas(pagB);
    await abrir(pagB);
    const aplicou = await esperar('o celular aplicou a cópia nova ao abrir', () => pagB.evaluate(() =>
      /Aluno Beta Teste/.test(document.querySelector('#cel-hoje').textContent)), v => v === true, 30000);
    conf('ao abrir, Hoje já mostra a aula da cópia nova', aplicou.ok, true);
    conf('a cópia aplicada é a mais nova', await pagB.evaluate(() => Nuvem.estado().ultimaCopia.id), nova.valor);
    conf('no alto, de novo: "Dados de hoje, HH:MM, do tablet."', /^Dados de hoje, \d\d:\d\d, do tablet\.$/.test(await texto(pagB, '#cel-origem')), true);
    escritas = await escritasNoBanco(pagB);
    conf('a única escrita desta abertura foi a restauração da cópia nova', escritas.length === 1 && /dados/.test(escritas[0]), true);
    conf('e nenhuma escrita na nuvem do celular em toda a rodada', pagB.escritasNaNuvem.length, 0);
  }

  secao('7. O celular que restaurou pela tela do tablet antes (sem a marca) não sobe nada em pé');
  const ctxC = await pagA.browser().createBrowserContext();
  const pagC = await ctxC.newPage();
  await prepararPagina(pagC, 1280, 1000);
  await abrir(pagC);
  await pagC.evaluate(() => document.querySelector('#abas .aba[data-tela="ajustes"]').click());
  await pausa(200);
  await digitar(pagC, '#nuvem-email', DONA.email);
  await digitar(pagC, '#nuvem-senha', DONA.senha);
  await clicar(pagC, '#nuvem-entrar');
  await esperar('C entrou', () => existe(pagC, '#nuvem-restaurar'), v => v === true, 15000);
  await clicar(pagC, '#nuvem-restaurar');
  await esperar('C lista as cópias', () => pagC.evaluate(() =>
    document.querySelectorAll('#modal-nuvem-restaurar.aberto #nuvem-copias input[type=radio]').length), v => v >= 1, 15000);
  await digitar(pagC, '#nuvem-codigo-digitado', chave.formatado);
  await clicar(pagC, '#nuvem-restaurar-confirmar');
  const cRest = await esperar('C restaurou pela tela do tablet', () => pagC.evaluate(() =>
    Nuvem.estado().automatica && !document.querySelector('#modal-nuvem-restaurar.aberto')), v => v === true, 30000);
  conf('ponto de partida: restaurou como tablet, sem a marca, com a automática ligada', cRest.ok &&
    !(await pagC.evaluate(() => Nuvem.estado().soLeitura)), true);
  await pagC.evaluate(async () => {
    const d = await Store.carregar();
    d.alunos.push({ id: 'gama', nome: 'Aluno Gama Teste', ativo: true, precos: [] });
    await Store.salvar(d);
  });
  conf('e com mudança pendente', await pagC.evaluate(() => Nuvem.estado().pendente), true);
  await pagC.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  const antesC = pagC.escritasNaNuvem.length;
  await zerarEscritas(pagC);
  await abrir(pagC);
  const mc = await medirTela(pagC);
  conf('em pé, sem a marca, abre no modo celular com os dados dele', mc.celular && await pagC.evaluate(() =>
    document.querySelector('#cel-hoje.ativa') !== null && !!document.querySelector('#cel-trazer-copia')), true);
  await fecharEVoltar(pagC);
  prop('em pé, sem a marca e com a automática ligada: nenhuma escrita na nuvem ao fechar nem ao voltar (' +
    pagC.escritasNaNuvem.slice(antesC).join(' ') + ')', pagC.escritasNaNuvem.length === antesC, '--envenenado-envia');
  prop('e nenhuma escrita no banco nessa abertura', (await escritasNoBanco(pagC)).length === 0, 'nenhum');
  await ctxC.close();

  secao('8. Sem erro de página');
  conf('nenhum erro de script no tablet', JSON.stringify(pagA.errosDePagina), '[]');
  conf('nenhum erro de script no celular', JSON.stringify(pagB.errosDePagina), '[]');
  await ctxB.close();
})().then(() => derrubarEmulador().then(H.fim(amb)), e => derrubarEmulador().then(() => H.fim(amb)(e)));
