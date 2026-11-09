/* testa_celular_ficha.js
 *
 * D6c, lote 2: o que ela precisa na rua. Contra o Firebase Emulator Suite
 * (Auth e Firestore), com um tablet (1280 px), o celular da dona (390 x 844)
 * e um observador de outra conta (390 x 844). Dados e telefones fictícios.
 *
 * O que prova:
 *   1. a aba Alunos: a lista dos ativos e, com um toque no nome, a ficha
 *      mínima (ligar, WhatsApp, valor por hora, último relato, casa ou
 *      online); o mesmo toque no nome dentro da folha da aula;
 *   2. as mensagens prontas ("Estou 10 minutos atrasada", "Podemos
 *      remarcar?", "Chegando") são links wa.me com o telefone do responsável
 *      e o texto certo; nada abre nem sai sozinho, só o toque dela;
 *   3. o aluno SEM os campos novos funciona como antes (o contato das
 *      observações liga; sem telefone, a ficha diz e não quebra);
 *   4. o cadastro do celular tem os campos opcionais (casa ou online,
 *      endereço, link), que sobem pela fila e chegam ao tablet, onde a ficha
 *      completa os mostra; o tablet os grava e eles chegam ao celular;
 *   5. (nota da segunda mão) a cobrança do "Escrever como foi" segue o estado
 *      ATUAL da aula no momento de salvar, e não o retrato de quando o
 *      formulário abriu;
 *   6. o observador vê a lista e a ficha, com ligar e WhatsApp, e nenhuma
 *      edição; nada sobe dele;
 *   7. em 390 x 844: alvos de 48 px e sem rolagem de lado em todas as telas.
 *
 * Venenos, que TÊM de reprovar a propriedade:
 *   --envenenado-sem-55          o número do WhatsApp perde o 55 (o link some);
 *   --envenenado-texto-errado    a mensagem pronta leva o rótulo, e não o texto;
 *   --envenenado-abre-sozinho    a ficha abre o WhatsApp ao desenhar;
 *   --envenenado-campo-obrigatorio  a ficha lê o endereço sem conferir que existe;
 *   --envenenado-campos-nao-sobem   o aluno novo não leva os campos novos;
 *   --envenenado-cobranca-retrato   a cobrança volta a se decidir pelo retrato;
 *   --envenenado-observador-cadastra  o observador ganha o "Cadastrar aluno".
 *
 *   --prints <pasta>   os quatro prints do lote 2, em 390 x 844.
 *
 * Portas: 8981 (app), 8983 (auth), 8984 (firestore), 8985 (hub), 8986 (log),
 * 8987 (websocket). Precisa do firebase-tools e de um JDK 21 em JAVA_HOME.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const MODOS = ['--envenenado-sem-55', '--envenenado-texto-errado', '--envenenado-abre-sozinho', '--envenenado-campo-obrigatorio',
  '--envenenado-campos-nao-sobem', '--envenenado-cobranca-retrato', '--envenenado-observador-cadastra',
  '--envenenado-extracao-antiga', '--envenenado-aceita-http', '--envenenado-nunca-desatualizado'];
const [V_55, V_TEXTO, V_SOZINHO, V_OBRIGATORIO, V_NAO_SOBE, V_RETRATO, V_OBS, V_EXTRACAO, V_HTTP, V_HORA] = MODOS;
const PRINTS = (() => { const i = process.argv.indexOf('--prints'); return i >= 0 ? process.argv[i + 1] : ''; })();
const MODO = MODOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
function prop(rotulo, ok, veneno) {
  if (MODO && MODO === veneno) return conf('VENENO visto: ' + rotulo + ', e quebrou', ok, false);
  return conf(rotulo, ok, true);
}
function fimDoVeneno() { throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true }); }

const PORTA_APP = 8981, PORTA_AUTH = 8983, PORTA_FS = 8984, PORTA_HUB = 8985, PORTA_LOG = 8986, PORTA_WS = 8987;
const PROJETO = 'demo-nath-d6c2';
const AUTH = 'http://127.0.0.1:' + PORTA_AUTH;
const FS = 'http://127.0.0.1:' + PORTA_FS;
const FIREBASE = process.env.FIREBASE_TOOLS ||
  'C:/Users/romul/ferramentas/firebase-tools/node_modules/firebase-tools/lib/bin/firebase.js';
const JAVA_HOME = process.env.JAVA_HOME || '';
const DONA = { email: 'dona@exemplo.test', senha: 'senha-da-dona-1' };
const OBS = { email: 'observador@exemplo.test', senha: 'senha-do-observador-1' };

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const REGRAS = fs.readFileSync(path.join(H.RAIZ, 'firestore.rules'), 'utf8');

secao('0. As âncoras dos venenos e o ambiente');
const ANCORAS = {
  [V_55]: ["    return d.length === 11 && d.charAt(2) === '9' ? '55' + d : '';", "    return d.length === 11 && d.charAt(2) === '9' ? d : '';"],
  [V_TEXTO]: ["linkDoWhatsapp(tel, texto), { 'data-mensagem'", "linkDoWhatsapp(tel, m.rotulo), { 'data-mensagem'"],
  [V_SOZINHO]: ['    caixa.appendChild(relato);', "    caixa.appendChild(relato); if (whats) window.open(linkDoWhatsapp(tel, textoDaMensagemPronta('chegando', aluno, aula)), '_blank');"],
  [V_OBRIGATORIO]: ["var endereco = String(aluno.endereco || '').trim(), link", 'var endereco = aluno.endereco.trim(), link'],
  [V_NAO_SOBE]: ['    return gravarLugarEContato({', '    return (function (x) { return x; })({'],
  [V_RETRATO]: ["if (situacao.value !== (atual.status || 'realizada'))", "if (situacao.value !== (aula.status || 'realizada'))"],
  [V_OBS]: ['var podeCadastrar = celularEdita();', 'var podeCadastrar = true;'],
  // (revisão) a regra de antes: todos os dígitos do contato viram um número só
  /* (revisão) a regra de antes: o telefone tirado do texto livre por token, e as observações ligando */
  [V_EXTRACAO]: [["    return aluno && telefoneValidado(aluno.telefone) ? String(aluno.telefone).trim() : '';", '    return telefoneDoAluno(aluno);'],
    ['  function telefoneValidado(texto) {', "  function telefoneValidado(texto) { var achados = [], m0, RE0 = /(?:^|[^\\d])((?:\\+?55[\\s.-]?)?(?:\\(?\\d{2}\\)?[\\s.-]?)?9?\\d{4}[\\s.-]?\\d{4})(?!\\d)/g; while ((m0 = RE0.exec(String(texto || ''))) !== null) achados.push(m0[1]); if (achados.length !== 1) return ''; var d0 = achados[0].replace(/\\D/g, ''); if (d0.length >= 12 && /^55/.test(d0)) d0 = d0.slice(2); return d0;"]],
  [V_HTTP]: ['if (/^https:\\/\\//i.test(t)) return t;', 'if (/^https?:\\/\\//i.test(t)) return t;'],
  [V_HORA]: ['var desatualizado = !!r.erroRecebimento || agora.getTime() - d.getTime() > HORAS_SEM_RECEBER * 3600 * 1000;', 'var desatualizado = false;']
};
const paresDe = m => Array.isArray(ANCORAS[m][0]) ? ANCORAS[m] : [ANCORAS[m]];
conf('cada âncora de veneno está no app.js uma vez só', MODOS.map(m => paresDe(m).map(par => APP.split(par[0]).length - 1).join('+')).join(','),
  MODOS.map(m => paresDe(m).map(() => 1).join('+')).join(','));
conf('o app.js não tem travessão', new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']').test(APP), false);
const trocas = {};
if (MODO) {
  trocas['/app.js'] = paresDe(MODO).reduce((t, par) => t.replace(par[0], par[1]), APP);
  conf('o app.js servido ficou diferente do repositório (' + MODO + ')', trocas['/app.js'] !== APP, true);
}
/* As regras do Firestore aceitam o aluno com os campos novos: o conteúdo do
 * registro vai em `dados`, um mapa sem lista fechada de campos. */
conf('as regras: o registro tem lista fechada só nos metadados, e `dados` é qualquer mapa sem bytes',
  /d\.keys\(\)\.hasOnly\(\['id', 'tipo', 'atualizadoEm', 'apagadoEm', 'aparelho', 'esquema', 'app', 'dados', 'servidorEm'\]\)/.test(REGRAS) &&
  /\(!\('dados' in d\) \|\| !\(d\.dados is bytes\)\)/.test(REGRAS) && !/dados\.keys\(\)/.test(REGRAS), true);

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
const PASTA = path.join(os.tmpdir(), 'nath_d6c2_emulador_' + process.pid);
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
const amb = H.criarAmbiente(PORTA_APP, 'nath_d6c2_celular_ficha', trocas);

/* A página e os instrumentos: os commits que saem (contados na rede), o que
 * abre fora do aplicativo (window.open e o toque num link, anotado e contido:
 * o WhatsApp e o mapa não abrem de verdade na prova) e os pedidos a wa.me. */
async function prepararPagina(pag, movel) {
  pag.setDefaultTimeout(60000);
  if (movel) await pag.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  pag.errosDePagina = [];
  pag.on('pageerror', e => pag.errosDePagina.push(e.message));
  pag.dialogos = [];
  pag.on('dialog', async d => { pag.dialogos.push(d.message()); try { await d.accept(); } catch (e) { /* ok */ } });
  pag.commitsNaRede = 0;
  pag.paraFora = [];
  pag.on('request', r => {
    const u = r.url();
    if (u.indexOf(FS) === 0 && /:commit\b/.test(u) && r.method() === 'POST') pag.commitsNaRede++;
    if (/^https?:\/\/(wa\.me|api\.whatsapp|www\.google\.com\/maps)/.test(u)) pag.paraFora.push(u);
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
    window.__aberturas = [];
    window.open = function (u) { window.__aberturas.push('open ' + u); return null; };
    document.addEventListener('click', e => {
      const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      const href = a.getAttribute('href');
      if (!/^(tel:|https?:)/.test(href)) return;
      window.__aberturas.push((e.isTrusted ? 'toque ' : 'clique do código ') + href);
      e.preventDefault();
    }, true);
  });
}
const texto = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent : null; }, sel);
const existe = (pag, sel) => pag.evaluate(s => !!document.querySelector(s), sel);
const clicar = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.click(); return true; }, sel);
const href = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); return e ? e.getAttribute('href') : null; }, sel);
const aberturas = pag => pag.evaluate(() => window.__aberturas.slice());
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
async function tabletAbreERecebe(pag, rotulo, condicao, arg) {
  await H.abrirApp(pag, amb.ORIGEM);
  return esperar(rotulo, () => pag.evaluate(new Function('arg', 'return Store.carregar().then(function (d) { return (' + condicao + ')(d, arg); });'), arg), v => v === true, 30000);
}
const fila = pag => pag.evaluate(() => Store.lerFila().then(l => l.map(e => e.id)));
const filaVazia = pag => esperar('a fila do celular esvaziou', () => pag.evaluate(() => Store.lerFila().then(l => l.length)), v => v === 0, 20000);
const aba = (pag, t) => clicar(pag, '#cel-abas .cel-aba[data-cel="' + t + '"]').then(() => pausa(200));
async function abrirFichaPelaLista(pag, alunoId) {
  await aba(pag, 'alunos');
  if (!(await clicar(pag, '#cel-alunos-lista .cel-aluno-item[data-aluno="' + alunoId + '"]'))) return false;
  return existe(pag, '#cel-alunos #cel-ficha[data-aluno="' + alunoId + '"]');
}
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
async function tirarPrint(pag, nome) {
  if (!PRINTS) return;
  fs.mkdirSync(PRINTS, { recursive: true });
  await pausa(250);
  await pag.screenshot({ path: path.join(PRINTS, nome) });
  console.log('   print: ' + path.join(PRINTS, nome));
}
/* A tela medida: rolagem de lado, alvos de 48 px (links incluídos) e os
 * botões e campos de edição fora das ações do celular. */
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
  const campos = Array.from(raiz.querySelectorAll('input, select, textarea')).filter(visivel).filter(e => !e.closest('#cel-entrada')).map(e => e.id || e.tagName);
  const conteudo = document.querySelector('#cel-conteudo');
  return {
    largura: window.innerWidth,
    rolaDeLado: document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth ||
      (conteudo && conteudo.scrollWidth > conteudo.clientWidth) || !!Array.from(raiz.querySelectorAll('*')).find(e => e.getBoundingClientRect().right > window.innerWidth + 0.5 && visivel(e)),
    alvos: alvos.length, pequenos, soltos, campos, acoes: raiz.querySelectorAll('[data-acao-celular]').length
  };
}, RE_EDICAO);
const telaBoa = m => m.pequenos.join('; ') + (m.rolaDeLado ? ' ROLA DE LADO' : '');

function isoDe(d) { const p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
const AGORA = new Date();
const HOJE = isoDe(AGORA);
/* A aula de hoje de Alfa ainda não acabou quando a prova roda (a próxima
 * hora cheia de 15 em 15 minutos, no máximo 23:00): é a que leva o "Estou 10
 * minutos atrasada" e o "Chegando". */
const HORA_HOJE = (() => { const m = Math.min(Math.ceil((AGORA.getHours() * 60 + AGORA.getMinutes() + 1) / 15) * 15, 23 * 60);
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); })();
const ONTEM = (() => { const d = new Date(AGORA); d.setDate(d.getDate() - 1); return isoDe(d); })();
/* Telefones fictícios (DDD 11 e 21, prefixo 9 0000). */
const TEL_ALFA = '(11) 90000-0001', WA_ALFA = '5511900000001';
const TEL_VELHO = '(21) 90000-0002', WA_VELHO = '5521900000002';
const TEL_ONLINE = '11900000003', WA_ONLINE = '5511900000003';
const ENDERECO_ALFA = 'Rua Fictícia, 100, Bairro Teste';

(async function () {
  secao('1. O tablet cria os alunos fictícios (com e sem os campos novos) e sobe a cópia');
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
    d.alunos = [
      { id: 'alfa', nome: 'Aluno Alfa Teste', ativo: true, cor: '#1F3A5F', responsavel: 'Responsável Alfa Teste', precos: preco(100), mapeamentos: [],
        telefone: c.telAlfa, local: 'casa', endereco: c.endereco },
      // como os alunos de hoje: nenhum campo novo; o contato está nas observações (como o cadastro do celular do D6b o põe)
      { id: 'velho', nome: 'Aluno Velho Teste', ativo: true, cor: '#C9A961', responsavel: 'Responsável Velho Teste', precos: preco(80), mapeamentos: [],
        obs: 'Contato: ' + c.telVelho },
      // sem telefone nenhum
      { id: 'nada', nome: 'Aluno Sem Contato Teste', ativo: true, cor: '#2E7D6B', responsavel: '', precos: [], mapeamentos: [] },
      { id: 'online', nome: 'Aluno Online Teste', ativo: true, cor: '#B4453C', responsavel: 'Responsável Online Teste', precos: preco(90), mapeamentos: [],
        telefone: c.telOnline, local: 'online', linkOnline: 'meet.google.com/abc-defg-hij' },
      { id: 'inativo', nome: 'Aluno Inativo Teste', ativo: false, cor: '#9AA3AF', responsavel: '', precos: [], mapeamentos: [] },
      // (revisão) os contatos dela que não são UM telefone com DDD, e o campo próprio que vence o "Contato:"
      { id: 'c1', nome: 'Contato Caso 1 Teste', ativo: true, cor: '#1F3A5F', responsavel: 'R1', precos: [], mapeamentos: [], obs: 'Contato: 98765-4321 (casa 2)' },
      { id: 'c2', nome: 'Contato Caso 2 Teste', ativo: true, cor: '#1F3A5F', responsavel: 'R2', precos: [], mapeamentos: [], obs: 'Contato: mãe, prédio 12' },
      { id: 'c3', nome: 'Contato Caso 3 Teste', ativo: true, cor: '#1F3A5F', responsavel: 'R3', precos: [], mapeamentos: [], obs: 'Contato: mãe 11 98765-4321, pai 11 91234-5678' },
      { id: 'c4', nome: 'Contato Caso 4 Teste', ativo: true, cor: '#1F3A5F', responsavel: 'R4', precos: [], mapeamentos: [], obs: 'Contato: ramal 2',
        local: 'online', linkOnline: 'http://inseguro.example.test/sala' },
      { id: 'c5', nome: 'Contato Caso 5 Teste', ativo: true, cor: '#1F3A5F', responsavel: 'R5', precos: [], mapeamentos: [], obs: 'Contato: (11) 90000-0009',
        telefone: '(31) 90000-0005' }
    ];
    d.aulas = [
      { id: 'aula-ontem', alunoId: 'alfa', serieId: null, data: c.ontem, hora: '09:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: 'Rendeu bem em frações', anexos: [] },
      { id: 'aula-hoje', alunoId: 'alfa', serieId: null, data: c.hoje, hora: c.horaHoje, duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] },
      { id: 'aula-velho', alunoId: 'velho', serieId: null, data: c.hoje, hora: '10:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] },
      // as da nota da segunda mão: o tablet muda a situação com o formulário aberto no celular
      { id: 'aula-cobra', alunoId: 'velho', serieId: null, data: c.ontem, hora: '16:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] },
      { id: 'aula-cobra2', alunoId: 'velho', serieId: null, data: c.ontem, hora: '17:30', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] }
    ];
    await Store.salvar(d);
  }, { hoje: HOJE, ontem: ONTEM, horaHoje: HORA_HOJE, telAlfa: TEL_ALFA, telVelho: TEL_VELHO, telOnline: TEL_ONLINE, endereco: ENDERECO_ALFA });
  await H.abrirApp(pagA, amb.ORIGEM);
  conf('o tablet entrou', await entrarPelaTela(pagA, DONA.email, DONA.senha), true);
  await clicar(pagA, '#nuvem-enviar');
  conf('a cópia do tablet subiu', (await esperar('a cópia subiu', () => texto(pagA, '#nuvem-ultima'), v => /^Última cópia na nuvem: hoje/.test(v || ''), 30000)).ok, true);
  const sA = await sincronizar(pagA);
  conf('o tablet subiu os registros (os campos novos do aluno passam pelas regras)', sA.enviados > 0 && sA.erroE === null, true);
  const regAlfa = await rest(docUrl(dona.localId, 'registros/' + encodeURIComponent('aluno:alfa')), { token: dona.idToken });
  const dadosAlfa = regAlfa.json && regAlfa.json.fields && regAlfa.json.fields.dados && regAlfa.json.fields.dados.mapValue.fields;
  conf('(regras) no servidor, o registro do aluno leva o telefone, casa e o endereço em `dados`',
    dadosAlfa ? [dadosAlfa.telefone.stringValue, dadosAlfa.local.stringValue, dadosAlfa.endereco.stringValue].join(' | ') : 'sem registro (' + regAlfa.status + ')',
    TEL_ALFA + ' | casa | ' + ENDERECO_ALFA);
  await pagA.evaluate(u => Nuvem.permitirLeitor(u), obs.localId);

  secao('2. O celular da dona traz a cópia');
  const ctxC = await pagA.browser().createBrowserContext();
  const pagC = await ctxC.newPage();
  await prepararPagina(pagC, true);
  await abrirCelular(pagC);
  conf('o celular entrou com a conta da dona', await entrarNoCelular(pagC, DONA), true);
  conf('trouxe a cópia do tablet', await trazerCopiaNoCelular(pagC), true);
  conf('(arranjo) é o celular da dona, que edita', await pagC.evaluate(() => Nuvem.estado().celularDaDona), true);

  secao('2b. (painel) O alto diz "Atualizado às HH:MM" pelo último recebimento, e avisa quando pode estar desatualizado');
  await pagC.evaluate(() => Nuvem.receberRegistros());
  const horaReceb = await pagC.evaluate(() => { const q = new Date(Nuvem.estado().registros.ultimoRecebimento.quando); return Core.pad2(q.getHours()) + ':' + Core.pad2(q.getMinutes()); });
  const alto = () => pagC.evaluate(() => { const o = document.querySelector('#cel-origem'); return o.textContent + (o.classList.contains('cel-desatualizado') ? ' [destaque]' : ''); });
  conf('depois de receber, o alto diz a hora do recebimento, sem destaque', (await esperar('o alto diz a hora', alto, v => /^Atualizado às/.test(v || ''), 10000)).valor, 'Atualizado às ' + horaReceb + '.');
  conf('e a nuvem do alto fica em dia', await pagC.evaluate(() => document.querySelector('#cel-nuvem').getAttribute('data-tom')), 'em-dia');
  /* O recebimento que falha (sem sinal): o aviso em destaque. */
  await pagC.setOfflineMode(true);
  await pagC.evaluate(() => window.dispatchEvent(new Event('offline')));
  await pagC.evaluate(() => Nuvem.receberRegistros());
  const falhou = await esperar('o alto avisa depois da falha', alto, v => /\[destaque\]$/.test(v || ''), 10000);
  prop('o recebimento falhou: "Pode estar desatualizado: toque em ↻." em destaque (' + falhou.valor + ')',
    falhou.valor === 'Pode estar desatualizado: toque em ↻. Atualizado às ' + horaReceb + '. [destaque]', V_HORA);
  await pagC.setOfflineMode(false);
  await pagC.evaluate(() => window.dispatchEvent(new Event('online')));
  await pagC.evaluate(() => Nuvem.receberRegistros());
  conf('com o sinal de volta e o recebimento certo, o destaque sai', !/destaque/.test((await esperar('o alto voltou', alto, v => !/destaque/.test(v || ''), 15000)).valor || ''), true);
  /* Mais de 2 horas sem receber: o relógio da página anda 3 horas. */
  await pagC.evaluate(() => {
    const Real = Date, desvio = 3 * 3600 * 1000;
    class Adiantado extends Real { constructor(...a) { if (a.length) super(...a); else super(Real.now() + desvio); } static now() { return Real.now() + desvio; } }
    window.__DataReal = Real; window.Date = Adiantado;
    window.dispatchEvent(new Event('offline'));
  });
  const velhoAlto = await alto();
  await pagC.evaluate(() => { window.Date = window.__DataReal; window.dispatchEvent(new Event('offline')); });
  prop('três horas sem receber: o aviso em destaque (' + velhoAlto + ')', /^Pode estar desatualizado: toque em ↻\. Atualizado .* \[destaque\]$/.test(velhoAlto), V_HORA);
  if (MODO === V_HORA) fimDoVeneno();

  secao('3. A aba Alunos: a lista dos ativos');
  conf('a aba Alunos está nas abas de baixo, depois de Hoje', await pagC.evaluate(() => Array.from(document.querySelectorAll('#cel-abas .cel-aba')).filter(b => !b.hidden).map(b => b.textContent).join(',')),
    'Hoje,Alunos,Biblioteca,Fechamento,Enviar'); // B1: a Biblioteca entrou entre Alunos e Fechamento
  await aba(pagC, 'alunos');
  const lista = await pagC.evaluate(() => Array.from(document.querySelectorAll('#cel-alunos-lista .cel-aluno-item')).map(b => b.dataset.aluno + '=' + b.querySelector('.cel-aluno-nome').textContent));
  conf('a lista traz os ativos em ordem de nome, sem o inativo', lista.join(', '),
    'alfa=Aluno Alfa Teste, online=Aluno Online Teste, nada=Aluno Sem Contato Teste, velho=Aluno Velho Teste, ' +
    [1, 2, 3, 4, 5].map(i => 'c' + i + '=Contato Caso ' + i + ' Teste').join(', '));
  conf('(painel) rolada até o fim, a lista termina acima da barra de abas, com folga', await pagC.evaluate(() => { const c = document.querySelector('#cel-conteudo'); c.scrollTop = c.scrollHeight;
    const ultimo = document.querySelector('#cel-alunos').lastElementChild.getBoundingClientRect(); const r = ultimo.bottom <= document.querySelector('#cel-abas').getBoundingClientRect().top - 8 && ultimo.bottom <= c.getBoundingClientRect().bottom - 8; c.scrollTop = 0; return r; }), true);
  conf('(painel) o aluno sem contato diz na lista "sem telefone cadastrado"', await texto(pagC, '.cel-aluno-item[data-aluno="nada"] .cel-aluno-detalhe'), 'sem telefone cadastrado');
  conf('e o que tem telefone não diz', await texto(pagC, '.cel-aluno-item[data-aluno="alfa"] .cel-aluno-detalhe'), 'Responsável Alfa Teste · Na casa do aluno');
  conf('e diz que o inativo fica no tablet', await texto(pagC, '#cel-alunos-inativos'), '1 aluno inativo fica só no tablet.');
  conf('cada aluno da lista leva a cor dele', await pagC.evaluate(() => getComputedStyle(document.querySelector('.cel-aluno-item[data-aluno="alfa"]')).borderLeftColor), 'rgb(31, 58, 95)');
  let m = await medirTela(pagC);
  conf('a lista: alvos de 48 px e sem rolagem de lado em ' + m.largura + ' px', telaBoa(m), '');
  conf('a lista: o único botão de edição é o "Cadastrar aluno" das ações do celular', m.soltos.join(', ') + '|' + (await existe(pagC, '#cel-alunos-cadastrar[data-acao-celular]')), '|true');
  await tirarPrint(pagC, '1_lista_de_alunos.png');

  secao('4. A ficha mínima, com um toque no nome');
  conf('o toque no nome abre a ficha mínima de Alfa', await abrirFichaPelaLista(pagC, 'alfa'), true);
  const ficha = await pagC.evaluate(() => ({
    nome: (document.querySelector('#cel-ficha-nome') || {}).textContent,
    resp: (document.querySelector('#cel-ficha-responsavel') || {}).textContent,
    valor: (document.querySelector('#cel-ficha-valor') || {}).textContent,
    relato: (document.querySelector('#cel-ficha-relato') || {}).textContent,
    onde: (document.querySelector('#cel-ficha-onde') || {}).textContent,
    endereco: (document.querySelector('#cel-ficha-endereco') || {}).textContent,
    link: !!document.querySelector('#cel-ficha-link')
  }));
  conf('a ficha: o nome e o responsável', ficha.nome + ' | ' + ficha.resp, 'Aluno Alfa Teste | Responsável: Responsável Alfa Teste');
  conf('a ficha: o valor por hora', /^Valor por hora: R\$\s?100,00$/.test(ficha.valor || ''), true);
  conf('a ficha: o último relato, com a data (' + ficha.relato + ')', /^Último relato \(\d\d\/\d\d\)Rendeu bem em frações$/.test(ficha.relato || ''), true);
  conf('a ficha: na casa do aluno, com o endereço, e sem o link online', ficha.onde + ' | ' + ficha.endereco + ' | ' + ficha.link, 'Na casa do aluno | ' + ENDERECO_ALFA + ' | false');
  conf('o endereço abre o mapa', await href(pagC, '#cel-ficha-mapa'), 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(ENDERECO_ALFA));
  const ligar = await href(pagC, '#cel-ficha-ligar'), whats = await href(pagC, '#cel-ficha-whatsapp');
  prop('Ligar abre o telefone do responsável (' + ligar + ') e o WhatsApp, a conversa dele (' + whats + ')',
    ligar === 'tel:+' + WA_ALFA && whats === 'https://wa.me/' + WA_ALFA, V_55);
  if (MODO === V_55) fimDoVeneno();
  m = await medirTela(pagC);
  conf('a ficha: alvos de 48 px (os links também) e sem rolagem de lado', telaBoa(m), '');
  conf('(painel) o telefone na ficha em letra maior (16 px, negrito)', await pagC.evaluate(() => { const c = getComputedStyle(document.querySelector('#cel-ficha-telefone')); return c.fontSize + ' ' + c.fontWeight + ' ' + document.querySelector('#cel-ficha-telefone').textContent; }), '16px 700 Telefone: ' + TEL_ALFA);
  conf('a ficha: nenhum botão nem campo de edição', m.soltos.join(', ') + '|' + m.campos.join(','), '|');
  await tirarPrint(pagC, '2_ficha_minima.png');

  secao('5. As mensagens prontas: wa.me com o telefone do responsável e o texto certo, e nada sai sozinho');
  const quando = await pagC.evaluate((h, hora) => Core.diaSemanaCurto(h) + ' ' + Core.ddmm(h) + ', ' + hora, HOJE, HORA_HOJE);
  const esperadas = {
    atrasada: 'Olá! Estou 10 minutos atrasada para a aula de Aluno.',
    remarcar: 'Olá! Podemos remarcar a aula de Aluno (' + quando + ')?',
    chegando: 'Olá! Estou chegando para a aula de Aluno.'
  };
  const msgs = await pagC.evaluate(() => Array.from(document.querySelectorAll('#cel-ficha-mensagens a')).map(a => ({ id: a.dataset.mensagem, rotulo: a.textContent, href: a.getAttribute('href') })));
  conf('a aula de hoje de Alfa (' + HORA_HOJE + ') ainda não foi dada: as três mensagens prontas, com os rótulos do pedido', msgs.map(x => x.rotulo).join(' / '), 'Estou 10 minutos atrasada / Podemos remarcar? / Chegando');
  prop('cada uma abre wa.me/' + WA_ALFA + ' com o texto certo (' + msgs.map(x => x.href).join(' ; ') + ')',
    msgs.length === 3 && msgs.every(x => x.href === 'https://wa.me/' + WA_ALFA + '?text=' + encodeURIComponent(esperadas[x.id])), V_TEXTO);
  if (MODO === V_TEXTO) fimDoVeneno();
  conf('(decodificado) o "Chegando" diz "' + esperadas.chegando + '"', decodeURIComponent((msgs.find(x => x.id === 'chegando') || { href: '' }).href.split('?text=')[1] || ''), esperadas.chegando);
  /* Nada abre nem sai sem o toque: nenhum window.open, nenhum clique do
   * código num link, nenhum pedido a wa.me e nada na fila de registros,
   * com a lista e a ficha já desenhadas. */
  const antesDoToque = await aberturas(pagC);
  prop('antes do toque, nada abriu (' + (antesDoToque.join(' ; ') || 'nada') + '), nada foi a wa.me (' + pagC.paraFora.length + ') e nada foi para a fila (' + (await fila(pagC)).length + ')',
    antesDoToque.length === 0 && pagC.paraFora.length === 0 && (await fila(pagC)).length === 0, V_SOZINHO);
  if (MODO === V_SOZINHO) fimDoVeneno();
  await pagC.click('#cel-msg-chegando');
  await pausa(200);
  const depoisDoToque = await aberturas(pagC);
  conf('(controle) o instrumento vê o toque: um, no "Chegando", com o link dele', depoisDoToque.join(' ; '), 'toque ' + msgs.find(x => x.id === 'chegando').href);
  conf('o link do WhatsApp abre numa aba nova, sem levar o aplicativo junto', await pagC.evaluate(() => { const a = document.querySelector('#cel-msg-chegando'); return a.target + ' ' + a.rel; }), '_blank noopener');
  conf('tocar no link não gravou nada (a fila continua vazia) nem foi a wa.me pela rede do aplicativo', (await fila(pagC)).length + '/' + pagC.paraFora.length, '0/0');
  await pagC.hover('#cel-msg-atrasada');
  conf('(painel) o "Estou 10 minutos atrasada" sob o dedo não fica cinza, com cara de já enviado', await pagC.evaluate(() => getComputedStyle(document.querySelector('#cel-msg-atrasada')).backgroundColor), 'rgb(255, 255, 255)');

  secao('5b. Na folha da aula: o toque no nome abre a mesma ficha, e o "Podemos remarcar?" diz qual aula');
  await aba(pagC, 'hoje');
  await irParaDia(pagC, HOJE);
  await clicar(pagC, '.cel-bloco[data-aula="aula-hoje"]');
  conf('o nome na folha é um botão que diz o que faz', await pagC.evaluate(() => (document.querySelector('#cel-folha #cel-folha-ficha') || {}).getAttribute && document.querySelector('#cel-folha-ficha').getAttribute('aria-label')),
    'Ver a ficha de Aluno Alfa Teste: telefone, WhatsApp e endereço');
  await clicar(pagC, '#cel-folha-ficha');
  conf('o toque no nome abre a ficha mínima dentro da folha', await existe(pagC, '#cel-folha #cel-ficha[data-aluno="alfa"]'), true);
  conf('o "Podemos remarcar?" da folha diz o dia e a hora da aula (' + quando + ')',
    decodeURIComponent(((await href(pagC, '#cel-folha #cel-msg-remarcar')) || '').split('?text=')[1] || ''), 'Olá! Podemos remarcar a aula de Aluno (' + quando + ')?');
  m = await medirTela(pagC);
  conf('a ficha na folha: alvos de 48 px e sem rolagem de lado', telaBoa(m), '');
  await pagC.evaluate(() => { const e = document.querySelector('#cel-folha #cel-ficha-mensagens'); if (e) e.scrollIntoView({ block: 'center' }); });
  await tirarPrint(pagC, '3_mensagens_prontas.png');
  await clicar(pagC, '#cel-folha-voltar');
  conf('"Voltar" leva às ações da aula', await existe(pagC, '#cel-folha-realizada'), true);
  await clicar(pagC, '#cel-folha-fechar');
  /* A aula de ontem já foi dada: só o "Podemos remarcar?". */
  await irParaDia(pagC, ONTEM);
  await clicar(pagC, '.cel-bloco[data-aula="aula-ontem"]');
  await clicar(pagC, '#cel-folha-ficha');
  conf('(painel) na aula que já foi dada, atrasada e chegando não aparecem; o remarcar, sim', await pagC.evaluate(() => Array.from(document.querySelectorAll('#cel-folha #cel-ficha-mensagens a')).map(a => a.dataset.mensagem).join(',')), 'remarcar');
  await clicar(pagC, '#cel-folha-voltar');
  await clicar(pagC, '#cel-folha-fechar');

  secao('6. O aluno SEM os campos novos funciona como hoje');
  const abriuVelho = await abrirFichaPelaLista(pagC, 'velho');
  prop('a ficha do aluno sem os campos novos abre (' + (pagC.errosDePagina.join(' | ') || 'sem erro de página') + ')', abriuVelho && pagC.errosDePagina.length === 0, V_OBRIGATORIO);
  if (MODO === V_OBRIGATORIO) fimDoVeneno();
  prop('o contato das observações NÃO liga nem abre o WhatsApp: mostra o texto e "Confira o telefone no tablet" (' + (await href(pagC, '#cel-ficha-ligar')) + ')',
    !(await existe(pagC, '#cel-ficha-ligar')) && !(await existe(pagC, '#cel-ficha-whatsapp')) && (await texto(pagC, '#cel-ficha-telefone')) === 'Contato: ' + TEL_VELHO &&
    /^Confira o telefone no tablet/.test((await texto(pagC, '#cel-ficha-confira')) || ''), V_EXTRACAO);
  conf('sem casa nem online, a ficha não mostra o lugar; o valor é o dele', (await existe(pagC, '#cel-ficha-lugar')) + ' ' + (await texto(pagC, '#cel-ficha-valor')).replace(/\s/g, ' '), 'false Valor por hora: R$ 80,00');
  conf('sem relato, a ficha diz', await texto(pagC, '#cel-ficha-relato'), 'Ainda sem relato de aula.');
  await clicar(pagC, '#cel-alunos-voltar');
  await abrirFichaPelaLista(pagC, 'nada');
  conf('sem telefone: a ficha diz onde pôr, e não oferece ligar, WhatsApp nem mensagem pronta',
    (await texto(pagC, '#cel-ficha-sem-telefone')) + ' | ' + (await pagC.evaluate(() => document.querySelectorAll('#cel-ficha a').length)),
    'Sem telefone do responsável. Ele se põe no tablet, na ficha do aluno. | 0');
  conf('sem valor por hora, a ficha diz', await texto(pagC, '#cel-ficha-valor'), 'Sem valor por hora para hoje.');
  await clicar(pagC, '#cel-alunos-voltar');
  await abrirFichaPelaLista(pagC, 'online');
  conf('online: o link da aula abre (o escrito sem https:// ganha o começo), e nenhum mapa',
    (await texto(pagC, '#cel-ficha-onde')) + ' | ' + (await href(pagC, '#cel-ficha-link')) + ' | ' + (await existe(pagC, '#cel-ficha-mapa')), 'Online | https://meet.google.com/abc-defg-hij | false');
  await clicar(pagC, '#cel-alunos-voltar');
  await aba(pagC, 'hoje');
  await irParaDia(pagC, HOJE);
  await clicar(pagC, '.cel-bloco[data-aula="aula-velho"]');
  conf('a folha da aula do aluno sem os campos novos tem as ações de sempre', await pagC.evaluate(() => Array.from(document.querySelectorAll('#cel-folha button')).map(b => b.id).filter(Boolean).join(',')),
    'cel-folha-ficha,cel-folha-realizada,cel-folha-faltou,cel-folha-remarcar,cel-folha-registrar,cel-folha-cancelar,cel-folha-fechar');
  await clicar(pagC, '#cel-folha-fechar');

  secao('6b. (revisão) Só o campo telefone liga: os contatos das observações não viram link, pela tela');
  const doCaso = async id => { await abrirFichaPelaLista(pagC, id); const r = await pagC.evaluate(() => ({
    ligar: (document.querySelector('#cel-ficha-ligar') || { getAttribute: () => '' }).getAttribute('href'),
    whats: (document.querySelector('#cel-ficha-whatsapp') || { getAttribute: () => '' }).getAttribute('href'),
    msgs: document.querySelectorAll('#cel-ficha-mensagens a').length,
    confira: !!document.querySelector('#cel-ficha-confira'), texto: (document.querySelector('#cel-ficha-telefone') || {}).textContent || '',
    link: !!document.querySelector('#cel-ficha-link') })); await clicar(pagC, '#cel-alunos-voltar'); return r; };
  const c1 = await doCaso('c1'), c2 = await doCaso('c2'), c3 = await doCaso('c3'), c4 = await doCaso('c4'), c5 = await doCaso('c5');
  console.log('   casos: ' + JSON.stringify({ c1, c2, c3, c4, c5 }));
  prop('"98765-4321 (casa 2)" nas observações: nenhum link, e pede para conferir (' + [c1.ligar, c1.whats, c1.msgs, c1.confira].join('|') + ')', [c1.ligar, c1.whats, c1.msgs, c1.confira].join('|') === '||0|true', V_EXTRACAO);
  conf('"mãe, prédio 12": nenhum link, o texto à vista e "Confira o telefone no tablet"', [c2.ligar, c2.whats, c2.msgs, c2.confira, c2.texto].join('|'), '||0|true|Contato: mãe, prédio 12');
  conf('dois números ("mãe 11 98765-4321, pai 11 91234-5678"): nenhum link, e pede para conferir', [c3.ligar, c3.whats, c3.msgs, c3.confira].join('|'), '||0|true');
  conf('"ramal 2": nenhum link, e pede para conferir', [c4.ligar, c4.whats, c4.msgs, c4.confira].join('|'), '||0|true');
  conf('o campo telefone próprio vence o "Contato:" das observações', c5.ligar + ' ' + c5.whats, 'tel:+5531900000005 https://wa.me/5531900000005');
  prop('(revisão) o link online com http: não vira botão, só https', c4.link === false, V_HTTP);
  if (MODO === V_HTTP) fimDoVeneno();

  secao('6c. (revisão) A tabela dos 28 contatos dela: no campo telefone, link certo, só Ligar ou nenhum; nas observações, nunca');
  /* As funções que a ficha usa, tiradas do app.js SERVIDO (o dos venenos),
   * e a composição dela: telefoneDoCampo, e dele o Ligar e o WhatsApp. */
  const servido = await (await fetch(amb.ORIGEM + '/app.js')).text();
  const pega = nome => { const i = servido.indexOf('  function ' + nome + '('); if (i < 0) throw new Error('sem ' + nome);
    const resto = servido.slice(i); const f = /\r?\n  \}\r?\n/.exec(resto); return resto.slice(0, f.index + f[0].length); };
  const nomesF = ['telefoneDoAluno', 'telefoneValidado', 'telefoneDoCampo', 'numeroDoWhatsapp', 'linkDeLigar', 'linkDoWhatsapp'];
  const F = new Function(nomesF.map(pega).join('\n') + '\nreturn {' + nomesF.join(',') + '};')();
  const links = aluno => { const t = F.telefoneDoCampo(aluno); return (F.linkDeLigar(t) || '-') + ' ' + (F.linkDoWhatsapp(t, '') || '-'); };
  const cel = d => 'tel:+55' + d + ' https://wa.me/55' + d, fixo = d => 'tel:+55' + d + ' -', nada = '- -';
  const TABELA = [
    ['11 98765-4321', cel('11987654321')], ['avó 99999-1234', nada], ['98765-4321 (casa 2)', nada], ['mãe 11 98765-4321, pai 11 91234-5678', nada],
    ['98765-4321 mãe, prédio 12', nada], ['(11) 98765-4321 ramal 2', nada], ['+55 (11) 98765-4321', cel('11987654321')], ['011 98765-4321', cel('11987654321')],
    ['55 9 9999-1234', cel('55999991234')], ['Ana, apto 1203, bloco 4, 9876-5432', nada], ['9876-5432 / 9988-7766', nada], ['(11) 98765-4321', cel('11987654321')],
    ['+55 11 98765-4321', cel('11987654321')], ['11987654321', cel('11987654321')], ['avó 11 98765-4321', nada], ['11 3456-7890', fixo('1134567890')],
    ['5511987654321', nada], ['(11)98765-4321', cel('11987654321')], ['11 9 8765-4321', cel('11987654321')], ['(11) 9 8765-4321', cel('11987654321')],
    ['11 9.8765.4321', cel('11987654321')], ['apto 1203 9876-5432', nada], ['apto 12 98765-4321', nada], ['21 99876 5432', cel('21998765432')],
    ['+5511987654321', cel('11987654321')], ['0 11 98765-4321', cel('11987654321')], ['casa 3 11 98765-4321', nada], ['(021) 98765-4321', cel('21987654321')],
    // revisão da 3cc25bd: o celular com um dígito a menos não passa como fixo
    ['11 98765-432', nada], ['11 8765-4321', nada]
  ];
  conf('(arranjo) a tabela tem os 28 casos dela e os 2 da última revisão', TABELA.length, 30);
  const erradosCampo = TABELA.filter(([c, esp]) => links({ telefone: c }) !== esp).map(([c, esp]) => c + ' => ' + links({ telefone: c }) + ' (esperado ' + esp + ')');
  const erradosObs = TABELA.filter(([c]) => links({ obs: 'Contato: ' + c }) !== nada).map(([c]) => 'Contato: ' + c + ' => ' + links({ obs: 'Contato: ' + c }));
  console.log('   no campo: ' + TABELA.filter(x => x[1] !== nada).length + ' ligam (' + TABELA.filter(x => / -$/.test(x[1]) && x[1] !== nada).length + ' fixo), ' + TABELA.filter(x => x[1] === nada).length + ' sem link');
  prop('no campo telefone, cada um dos 30 dá o link certo, só Ligar ou nenhum (' + (erradosCampo.join(' ; ') || 'todos certos') + ')', erradosCampo.length === 0, V_EXTRACAO);
  prop('nas observações ("Contato: ..."), nenhum dos 30 vira link (' + (erradosObs.slice(0, 4).join(' ; ') || 'nenhum') + ')', erradosObs.length === 0, V_EXTRACAO);
  if (MODO === V_EXTRACAO) fimDoVeneno();
  conf('ao salvar, o campo que não é um telefone com DDD é recusado (a mesma regra): ' + TABELA.filter(([c]) => !F.telefoneValidado(c)).length + ' dos 30',
    TABELA.filter(([c, esp]) => !F.telefoneValidado(c) !== (esp === nada)).length, 0);

  secao('7. O cadastro do celular com os campos opcionais, e eles chegam ao tablet pela fila');
  await aba(pagC, 'alunos');
  await clicar(pagC, '#cel-alunos-cadastrar');
  conf('"Cadastrar aluno" da aba Alunos abre o cadastro', await existe(pagC, '#cel-aluno-nome'), true);
  m = await medirTela(pagC);
  conf('sem "onde é a aula", o endereço e o link ficam escondidos', m.campos.join(','), 'cel-aluno-nome,cel-aluno-responsavel,cel-aluno-telefone,cel-aluno-preco,cel-aluno-local');
  conf('(painel) o campo diz que é o telefone do responsável, para ligar e o WhatsApp, com o formato', await pagC.evaluate(() => document.querySelector('#cel-aluno-telefone').closest('label').querySelector('span').textContent + ' | ' + document.querySelector('#cel-aluno-telefone').placeholder),
    'Telefone do responsável (para ligar e WhatsApp) | Com DDD, por exemplo (11) 98765-4321');
  await digitar(pagC, '#cel-aluno-nome', 'Aluno Novo Casa Teste');
  await digitar(pagC, '#cel-aluno-responsavel', 'Responsável Novo Teste');
  await digitar(pagC, '#cel-aluno-telefone', '(11) 90000-0004');
  await digitar(pagC, '#cel-aluno-preco', '110,00');
  await pagC.select('#cel-aluno-local', 'casa');
  await digitar(pagC, '#cel-aluno-endereco', 'Avenida Fictícia, 200, Centro Teste');
  m = await medirTela(pagC);
  conf('na casa do aluno: aparece o endereço, e o link não', m.campos.join(','), 'cel-aluno-nome,cel-aluno-responsavel,cel-aluno-telefone,cel-aluno-preco,cel-aluno-local,cel-aluno-endereco');
  conf('o cadastro: alvos de 48 px e sem rolagem de lado', telaBoa(m), '');
  await pagC.evaluate(() => document.querySelector('#cel-aluno-endereco').scrollIntoView({ block: 'center' }));
  await tirarPrint(pagC, '4_cadastro_com_campos_novos.png');
  /* Dois números no telefone: o cadastro não grava e diz como escrever. */
  await digitar(pagC, '#cel-aluno-telefone', 'mãe 11 98765-4321, pai 11 91234-5678');
  await clicar(pagC, '#cel-aluno-salvar');
  await pausa(300);
  conf('telefone com dois números: o cadastro avisa e não grava', (await texto(pagC, '#aviso-texto')) + ' | ' + (await pagC.evaluate(() => Store.carregar().then(b => b.alunos.some(x => x.nome === 'Aluno Novo Casa Teste')))),
    'Escreva o telefone com DDD, por exemplo (11) 98765-4321. | false');
  await digitar(pagC, '#cel-aluno-telefone', '(11) 90000-0004');
  await clicar(pagC, '#cel-aluno-salvar');
  const novo = await esperar('o aluno gravou', () => pagC.evaluate(() => Store.carregar().then(b => { const a = b.alunos.find(x => x.nome === 'Aluno Novo Casa Teste'); return a ? a.id : null; })), v => !!v, 10000);
  conf('o aluno novo está no celular', novo.ok, true);
  const idNovo = novo.valor;
  conf('e a entrada dele está na fila', (await fila(pagC)).indexOf('aluno:' + idNovo) >= 0, true);
  // um online pelo mesmo cadastro, com o endereço digitado e depois trocado para online: o endereço não vai
  await aba(pagC, 'alunos');
  await clicar(pagC, '#cel-alunos-cadastrar');
  await digitar(pagC, '#cel-aluno-nome', 'Aluno Novo Online Teste');
  await pagC.select('#cel-aluno-local', 'casa');
  await digitar(pagC, '#cel-aluno-endereco', 'endereço que não deve ir');
  await pagC.select('#cel-aluno-local', 'online');
  await digitar(pagC, '#cel-aluno-link', 'https://meet.example.test/sala-nova');
  await clicar(pagC, '#cel-aluno-salvar');
  const novo2 = await esperar('o aluno online gravou', () => pagC.evaluate(() => Store.carregar().then(b => { const a = b.alunos.find(x => x.nome === 'Aluno Novo Online Teste'); return a ? a.id : null; })), v => !!v, 10000);
  const idNovo2 = novo2.valor;
  // e um sem nada: os campos vazios não entram no registro
  await aba(pagC, 'alunos');
  await clicar(pagC, '#cel-alunos-cadastrar');
  await digitar(pagC, '#cel-aluno-nome', 'Aluno Novo Simples Teste');
  await clicar(pagC, '#cel-aluno-salvar');
  const novo3 = await esperar('o aluno simples gravou', () => pagC.evaluate(() => Store.carregar().then(b => { const a = b.alunos.find(x => x.nome === 'Aluno Novo Simples Teste'); return a ? a.id : null; })), v => !!v, 10000);
  const idNovo3 = novo3.valor;
  const sC = await sincronizar(pagC);
  conf('o celular sincronizou sem erro', sC.erroE === null && sC.erroR === null, true);
  conf('a fila do celular zerou', (await filaVazia(pagC)).ok, true);
  const chegou = await tabletAbreERecebe(pagA, 'o tablet recebeu os três alunos', function (d, a) {
    return [a.n1, a.n2, a.n3].every(function (id) { return d.alunos.some(function (x) { return x.id === id; }); });
  }.toString(), { n1: idNovo, n2: idNovo2, n3: idNovo3 });
  conf('(arranjo) os três alunos do celular chegaram ao tablet', chegou.ok, true);
  const noTablet = await pagA.evaluate((a) => Store.carregar().then(d => {
    const r = id => { const x = d.alunos.find(y => y.id === id); return x ? ['telefone', 'local', 'endereco', 'linkOnline'].map(k => k in x ? k + '=' + x[k] : '').filter(Boolean).join(' ; ') : 'não chegou'; };
    const ob = id => (d.alunos.find(y => y.id === id) || {}).obs;
    return [r(a.n1), r(a.n2), r(a.n3), ob(a.n1)];
  }), { n1: idNovo, n2: idNovo2, n3: idNovo3 });
  console.log('   no tablet: ' + JSON.stringify(noTablet));
  prop('o aluno da casa chegou ao tablet com casa e o endereço (' + noTablet[0] + ')', noTablet[0] === 'telefone=(11) 90000-0004 ; local=casa ; endereco=Avenida Fictícia, 200, Centro Teste', V_NAO_SOBE);
  prop('o online chegou com o link e sem o endereço digitado antes (' + noTablet[1] + ')', noTablet[1] === 'local=online ; linkOnline=https://meet.example.test/sala-nova', V_NAO_SOBE);
  if (MODO === V_NAO_SOBE) fimDoVeneno();
  conf('o sem nada chegou sem nenhum dos campos novos (sem chave vazia)', noTablet[2], '');
  conf('(painel) as observações ficam só para o texto livre: o telefone não vai para elas', noTablet[3], '');
  await H.irParaAba(pagA, 'alunos');
  await pagA.evaluate(() => { const l = [...document.querySelectorAll('#lista-alunos .item-lista')].find(e => e.textContent.includes('Aluno Novo Casa Teste')); if (l) l.click(); });
  const fichaTablet = await esperar('a ficha completa do tablet abriu', () => pagA.evaluate(() => document.querySelector('#modal-aluno.aberto #campo-endereco') ?
    ['#campo-local', '#campo-endereco', '#campo-link-online', '#campo-telefone'].map(s => document.querySelector(s).value).join(' | ') : null), v => !!v, 8000);
  conf('a ficha completa do tablet mostra os campos que vieram do celular', fichaTablet.valor, 'casa | Avenida Fictícia, 200, Centro Teste |  | (11) 90000-0004');
  await pagA.evaluate(() => { const b = document.querySelector('#modal-aluno.aberto .fechar, #modal-aluno.aberto [data-fechar]'); if (b) b.click(); });

  secao('7b. O tablet grava os campos opcionais na ficha completa, e eles chegam ao celular');
  await H.abrirApp(pagA, amb.ORIGEM);
  await H.irParaAba(pagA, 'alunos');
  await pagA.evaluate(() => { const l = [...document.querySelectorAll('#lista-alunos .item-lista')].find(e => e.textContent.includes('Aluno Velho Teste')); if (l) l.click(); });
  await esperar('a ficha do Velho abriu', () => existe(pagA, '#modal-aluno.aberto #campo-local'), v => v === true, 8000);
  conf('(o aluno sem os campos) a ficha do tablet abre com eles vazios', await pagA.evaluate(() => ['#campo-telefone', '#campo-local', '#campo-endereco', '#campo-link-online'].map(s => document.querySelector(s).value).join('|')), '|||');
  conf('(aluno antigo) o tablet mostra o contato das observações e o atalho para o campo Telefone', /Contato: \(21\) 90000-0002/.test((await texto(pagA, '#atalho-telefone')) || '') && (await existe(pagA, '#usar-contato-no-telefone')), true);
  await digitar(pagA, '#campo-telefone', 'apto 12 98765-4321');
  await pagA.$eval('#salvar-aluno', e => e.click());
  await pausa(300);
  conf('o tablet recusa o telefone que não é um telefone com DDD, e não grava', (await texto(pagA, '#aviso-texto')) + ' | ' + (await existe(pagA, '#modal-aluno.aberto')) + ' | ' +
    (await pagA.evaluate(() => Store.carregar().then(d => String(d.alunos.find(y => y.id === 'velho').telefone)))), 'Escreva o telefone com DDD, por exemplo (11) 98765-4321. | true | undefined');
  await clicar(pagA, '#usar-contato-no-telefone');
  conf('o atalho põe o contato no campo Telefone', await pagA.evaluate(() => document.querySelector('#campo-telefone').value), TEL_VELHO);
  await pagA.select('#campo-local', 'online');
  await digitar(pagA, '#campo-link-online', 'https://meet.example.test/sala-velho');
  await pagA.$eval('#salvar-aluno', e => e.click());
  await esperar('a ficha fechou', () => pagA.$eval('#modal-aluno', e => !e.classList.contains('aberto')), Boolean, 8000);
  conf('o tablet gravou os campos, e o resto do aluno ficou igual', await pagA.evaluate(() => Store.carregar().then(d => { const x = d.alunos.find(y => y.id === 'velho');
    return [x.telefone, x.local, x.linkOnline, 'endereco' in x, x.obs, x.responsavel].join(' | '); })), TEL_VELHO + ' | online | https://meet.example.test/sala-velho | false | Contato: ' + TEL_VELHO + ' | Responsável Velho Teste');
  const sA2 = await sincronizar(pagA);
  conf('o tablet subiu o aluno', sA2.erroE === null && sA2.enviados > 0, true);
  await pagC.evaluate(() => Nuvem.receberRegistros());
  const ligaVelho = await esperar('o celular recebeu o telefone do Velho', () => abrirFichaPelaLista(pagC, 'velho').then(() => href(pagC, '#cel-ficha-whatsapp')), v => v === 'https://wa.me/' + WA_VELHO, 15000);
  conf('com o campo Telefone preenchido no tablet, o Velho passa a ligar e abrir o WhatsApp no celular', ligaVelho.ok, true);
  await clicar(pagC, '#cel-alunos-voltar');
  const linkVelho = await esperar('o celular recebeu o link', () => abrirFichaPelaLista(pagC, 'velho').then(() => href(pagC, '#cel-ficha-link')), v => v === 'https://meet.example.test/sala-velho', 15000);
  conf('o link gravado no tablet chegou à ficha mínima do celular', linkVelho.ok, true);
  await clicar(pagC, '#cel-alunos-voltar');

  secao('8. (nota da segunda mão) A cobrança do "Escrever como foi" segue o estado atual da aula');
  const situacao = (pag, id) => pag.evaluate(i => Store.carregar().then(b => { const a = b.aulas.find(x => x.id === i); return a.status + '/' + a.cobravel; }), id);
  /* Caso 1: ela abre o formulário com a aula realizada e cobrada; o tablet a
   * muda para falta sem cobrança; ela salva sem tocar na situação (que mostra
   * "realizada"). A situação gravada é realizada, e a cobrança tem de ser a
   * de realizada (o estado atual era falta: houve troca). */
  const tabletMuda = (id) => pagA.evaluate(async i => { const d = await Store.carregar(); const a = d.aulas.find(x => x.id === i); a.status = 'falta'; a.cobravel = false; await Store.salvar(d); await Nuvem.sincronizar({ versaoApp: 'prova' }); }, id);
  const abrirRelato = async (id) => {
    await aba(pagC, 'hoje');
    await irParaDia(pagC, ONTEM);
    await clicar(pagC, '.cel-bloco[data-aula="' + id + '"]');
    await clicar(pagC, '#cel-folha-registrar');
    return existe(pagC, '#cel-relato-situacao');
  };
  conf('(arranjo) a aula começa realizada e cobrada', await situacao(pagC, 'aula-cobra'), 'realizada/true');
  conf('ela abre o "Escrever como foi"', await abrirRelato('aula-cobra'), true);
  await digitar(pagC, '#cel-relato-texto', 'Relato do caso 1');
  await tabletMuda('aula-cobra');
  await pagC.evaluate(() => Nuvem.receberRegistros());
  conf('(arranjo) com o formulário aberto, chegou a falta sem cobrança do tablet', (await esperar('a falta chegou', () => situacao(pagC, 'aula-cobra'), v => v === 'falta/false', 10000)).ok, true);
  conf('(arranjo) o formulário continua aberto, com "realizada" e o texto dela', await pagC.evaluate(() => document.querySelector('#cel-relato-situacao').value + ' | ' + document.querySelector('#cel-relato-texto').value), 'realizada | Relato do caso 1');
  await clicar(pagC, '#cel-relato-salvar');
  const caso1 = await esperar('o relato do caso 1 gravou', () => pagC.evaluate(() => Store.carregar().then(b => { const a = b.aulas.find(x => x.id === 'aula-cobra'); return a.notaTexto === 'Relato do caso 1' ? a.status + '/' + a.cobravel : null; })), v => !!v, 10000);
  prop('caso 1: a situação vai de falta (a atual) para realizada, e a cobrança é a de realizada (' + caso1.valor + ')', caso1.valor === 'realizada/true', V_RETRATO);
  /* Caso 2: o mesmo arranjo, e ela escolhe "falta": a situação é a que a aula
   * já tem, e a cobrança que o tablet pôs (sem cobrança) fica. */
  conf('ela abre o "Escrever como foi" da outra aula', await abrirRelato('aula-cobra2'), true);
  await tabletMuda('aula-cobra2');
  await pagC.evaluate(() => Nuvem.receberRegistros());
  conf('(arranjo) chegou a falta sem cobrança da outra aula', (await esperar('a falta 2 chegou', () => situacao(pagC, 'aula-cobra2'), v => v === 'falta/false', 10000)).ok, true);
  await pagC.select('#cel-relato-situacao', 'falta');
  await digitar(pagC, '#cel-relato-texto', 'Relato do caso 2');
  await clicar(pagC, '#cel-relato-salvar');
  const caso2 = await esperar('o relato do caso 2 gravou', () => pagC.evaluate(() => Store.carregar().then(b => { const a = b.aulas.find(x => x.id === 'aula-cobra2'); return a.notaTexto === 'Relato do caso 2' ? a.status + '/' + a.cobravel : null; })), v => !!v, 10000);
  prop('caso 2: falta escolhida sobre a falta atual não volta a cobrança ao padrão (' + caso2.valor + ')', caso2.valor === 'falta/false', V_RETRATO);
  if (MODO === V_RETRATO) fimDoVeneno();
  await sincronizar(pagC);
  conf('as duas chegam ao tablet como o celular gravou', (await tabletAbreERecebe(pagA, 'o tablet recebeu os relatos', function (d) {
    var a = d.aulas.find(function (x) { return x.id === 'aula-cobra'; }), b = d.aulas.find(function (x) { return x.id === 'aula-cobra2'; });
    return a.notaTexto === 'Relato do caso 1' && a.status === 'realizada' && a.cobravel === true && b.notaTexto === 'Relato do caso 2' && b.status === 'falta' && b.cobravel === false;
  }.toString())).ok, true);

  secao('9. O observador de outra conta: a lista e a ficha, com ligar e WhatsApp, e nenhuma edição');
  const ctxD = await pagA.browser().createBrowserContext();
  const pagD = await ctxD.newPage();
  await prepararPagina(pagD, true);
  await abrirCelular(pagD);
  conf('o observador entrou com a conta dele', await entrarNoCelular(pagD, OBS), true);
  conf('trouxe a cópia da dona pelo código da conta dela', await trazerCopiaNoCelular(pagD, dona.localId), true);
  await pausa(400);
  const abasD = await pagD.evaluate(() => Array.from(document.querySelectorAll('#cel-abas .cel-aba')).filter(b => !b.hidden).map(b => b.textContent + ':' + Math.round(b.getBoundingClientRect().height)));
  conf('o observador tem a aba Alunos, com as dele (' + abasD.join(', ') + ')', abasD.map(t => t.split(':')[0]).join(','), 'Hoje,Alunos,Fechamento,Diagnóstico,Ajustes');
  await aba(pagD, 'alunos');
  m = await medirTela(pagD);
  conf('o observador, a lista: alvos de 48 px e sem rolagem de lado, com as cinco abas', telaBoa(m), '');
  prop('o observador, a lista: nenhuma ação nem campo (' + m.acoes + ' ações, ' + (m.soltos.join(', ') || 'nenhum botão solto') + ')', m.acoes === 0 && m.soltos.length === 0 && m.campos.length === 0, V_OBS);
  if (MODO === V_OBS) fimDoVeneno();
  conf('o observador abre a ficha mínima de Alfa', await abrirFichaPelaLista(pagD, 'alfa'), true);
  conf('o observador tem ligar, WhatsApp e as mensagens prontas (abrem o telefone dele)',
    [await href(pagD, '#cel-ficha-ligar'), await href(pagD, '#cel-ficha-whatsapp'), await pagD.evaluate(() => document.querySelectorAll('#cel-ficha-mensagens a').length)].join(' '),
    'tel:+' + WA_ALFA + ' https://wa.me/' + WA_ALFA + ' 3');
  m = await medirTela(pagD);
  conf('o observador, a ficha: alvos de 48 px, sem rolagem de lado, nenhuma ação nem campo', telaBoa(m) + '|' + m.acoes + '|' + m.campos.length, '|0|0');
  await pagD.click('#cel-msg-atrasada');
  await pausa(200);
  conf('o toque do observador abre o WhatsApp com a mensagem, e só pelo toque', (await aberturas(pagD)).join(' ; '),
    'toque https://wa.me/' + WA_ALFA + '?text=' + encodeURIComponent(esperadas.atrasada));
  await aba(pagD, 'hoje');
  await irParaDia(pagD, HOJE);
  await clicar(pagD, '.cel-bloco[data-aula="aula-hoje"]');
  await clicar(pagD, '#cel-folha-ficha');
  conf('na folha, o observador também abre a ficha pelo nome, sem nenhuma ação', (await existe(pagD, '#cel-folha #cel-ficha')) + ' ' + (await pagD.evaluate(() => document.querySelectorAll('#modo-celular [data-acao-celular]').length)), 'true 0');
  await pausa(2500);
  conf('nenhuma escrita na nuvem saiu do observador', pagD.commitsNaRede, 0);

  secao('10. Sem erro de página');
  conf('nenhum erro de página no tablet, no celular e no observador', [pagA, pagC, pagD].map(p => p.errosDePagina.join(' | ')).filter(Boolean).join(' || '), '');
  await ctxD.close();
  await ctxC.close();
})().then(() => derrubarEmulador().then(H.fim(amb)), e => derrubarEmulador().then(() => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e))));
