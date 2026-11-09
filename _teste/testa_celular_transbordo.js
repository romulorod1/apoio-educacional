/* testa_celular_transbordo.js
 *
 * Nada passa da borda no celular. O dono viu o aviso de versão nova quebrado
 * no celular: o texto maior que o botão e o botão "Atualizar agora" saindo da
 * tela. Esta prova é a trava permanente: abre o modo celular (o mesmo arranjo
 * das testa_celular_*, que decidem o modo pelo tamanho da tela) contra o
 * Firebase Emulator Suite, com um tablet (1280 px), o celular da dona e um
 * observador de outra conta, e percorre as telas e os estados do celular em
 * 360 x 740, 390 x 844 e 412 x 915, com a letra normal e com a letra em 130%.
 * Alunos, telefones e valores fictícios.
 *
 * As telas: a de entrar; Hoje sem aviso, Hoje com os avisos do alto e Hoje
 * com o aviso de versão nova à vista; Alunos e a ficha do aluno; Fechamento e
 * o "Marcar como pago" aberto; Enviar; a folha da aula com as ações, o
 * Cancelar, o Remarcar, o "Escrever como foi", o "Marcar aula" e o "Cadastrar
 * aluno"; e, no observador, Hoje, a folha só leitura, Fechamento, o painel de
 * Diagnóstico e os Ajustes dele.
 *
 * Em cada uma, todo elemento visível:
 *   1. não rola de lado por dentro: scrollWidth <= clientWidth + 1 (os campos
 *      de digitar ficam de fora, porque o texto longo neles rola de propósito;
 *      a lista ISENTOS abaixo diz quem mais e por quê, e hoje está vazia: a
 *      faixa da semana é uma grade de sete colunas e não rola);
 *   2. não passa da borda direita: getBoundingClientRect().right <= innerWidth + 1.
 *   3. as abas de baixo (#cel-abas) têm o alvo de 48 px nas duas medidas.
 * Cada falha imprime a tela, a largura, a letra, o seletor e quantos px passou.
 *
 * O aviso de versão nova no celular: "Versão nova pronta." e o botão
 * "Atualizar", numa linha só, sem passar de 70 px de altura (não empurra a
 * agenda mais que uma linha), com o número da versão guardado no aviso
 * (data-versao), para quem confere qual versão espera.
 *
 * A letra em 130%: o aplicativo não tem ajuste de tamanho de letra, e toda
 * letra da folha sai da escala da F1, --letra-12 a --letra-24, em rem: ela
 * cresce com o font-size do documentElement. A prova faz o que o ajuste de
 * letra do Android faz com o texto: põe o documentElement em 130%, o que leva
 * a escala inteira junto, e confere que a letra de 16 px cresceu mesmo.
 *
 * Venenos, que TÊM de reprovar a varredura:
 *   --envenenado-aviso-largo     o aviso volta ao texto e aos botões antigos
 *                                ("Versão nova pronta (x)", "Atualizar agora",
 *                                "Depois da aula") e ao estilo antigo;
 *   --envenenado-elemento-largo  um elemento de 500 px de largura na tela Alunos;
 *   --envenenado-aba-estreita    as cinco abas do observador voltam à regra que
 *                                deixava o "Hoje" com 47 px em 360 e 130%.
 *
 *   --prints <pasta>   o aviso de versão em 360 x 740, letra normal e 130%.
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

const MODOS = ['--envenenado-aviso-largo', '--envenenado-elemento-largo', '--envenenado-aba-estreita'];
const [V_AVISO, V_LARGO, V_ABA] = MODOS;
const PRINTS = (() => { const i = process.argv.indexOf('--prints'); return i >= 0 ? process.argv[i + 1] : ''; })();
const MODO = MODOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && MODOS.indexOf(a) < 0);
function prop(rotulo, ok, venenos) {
  venenos = [].concat(venenos || []);
  if (MODO && venenos.indexOf(MODO) >= 0) { vistos.push(MODO); return conf('VENENO visto: ' + rotulo + ', e quebrou', ok, false); }
  return conf(rotulo, ok, true);
}
const vistos = [];

const PORTA_APP = 9021, PORTA_AUTH = 9023, PORTA_FS = 9024, PORTA_HUB = 9025, PORTA_LOG = 9026, PORTA_WS = 9027;
const PROJETO = 'demo-nath-transbordo';
const AUTH = 'http://127.0.0.1:' + PORTA_AUTH;
const FS = 'http://127.0.0.1:' + PORTA_FS;
const FIREBASE = process.env.FIREBASE_TOOLS ||
  'C:/Users/romul/ferramentas/firebase-tools/node_modules/firebase-tools/lib/bin/firebase.js';
const JAVA_HOME = process.env.JAVA_HOME || '';
const DONA = { email: 'dona@exemplo.test', senha: 'senha-da-dona-1' };
const OBS = { email: 'observador@exemplo.test', senha: 'senha-do-observador-1' };

/* O final de linha do disco depende do checkout (core.autocrlf): as âncoras
 * comparam com o texto em LF, e o servido nos modos envenenados sai em LF. */
const ler = nome => fs.readFileSync(path.join(H.RAIZ, nome), 'utf8').replace(/\r\n/g, '\n');
const APP = ler('app.js');
const CSS = ler('styles.css');
const SW = ler('sw.js');
const REGRAS = fs.readFileSync(path.join(H.RAIZ, 'firestore.rules'), 'utf8');

const TELAS_DE_CELULAR = [[360, 740], [390, 844], [412, 915]];
const ESCALAS = [1, 1.3];
/* Quem rola de lado de propósito, pelo seletor, e por quê. Vazio: no
 * celular nada rola de lado (a faixa da semana é uma grade de sete colunas
 * que cabe em 360 px, e os dias não rolam). Quem entrar aqui entra com o
 * motivo escrito ao lado. */
const ISENTOS = [];

secao('0. As âncoras dos venenos e o ambiente');
conf('nenhum --envenenado- desconhecido foi pedido (' + (desconhecidos.join(' ') || 'nenhum') + ')', desconhecidos.length, 0);
/* O aviso como era antes deste conserto: o texto com o número, "Atualizar
 * agora" e "Depois da aula" lado a lado, e o estilo de antes. O veneno troca
 * só a barra do aviso: o aviso de versão no painel de Hoje (#135) fica. */
const AVISO_NOVO_APP = "      avisar('Versão nova pronta.', 'Atualizar', aplicarAtualizacao, 'Depois', atualizarDepoisDaAula);\n" +
  "      $('#aviso-texto').setAttribute('data-versao', versao || '');\n";
const AVISO_VELHO_APP = "      avisar('Versão nova pronta' + (versao ? ' (' + versao + ')' : ''),\n" +
  "        'Atualizar agora', aplicarAtualizacao, 'Depois da aula', atualizarDepoisDaAula);\n";
conf('o aviso curto do celular também vira aviso do painel de Hoje (renovarAvisosCelular logo depois)',
  APP.indexOf(AVISO_NOVO_APP + "      desenharAjustes();\n      renovarAvisosCelular();") >= 0, true);
const AVISO_NOVO_CSS_INICIO = '/* O aviso de versão nova no celular (o dono viu quebrado):';
const AVISO_NOVO_CSS_FIM = '/* fim do aviso de versão nova no celular */';
const ANCORA_LARGO = "    caixa.appendChild(el('h2', { class: 'cel-titulo', texto: 'Alunos' }));\n";
conf('a âncora do aviso novo está no app.js uma vez só', APP.split(AVISO_NOVO_APP).length - 1, 1);
conf('o estilo do aviso novo está no styles.css uma vez só, com começo e fim',
  [CSS.split(AVISO_NOVO_CSS_INICIO).length - 1, CSS.split(AVISO_NOVO_CSS_FIM).length - 1].join(','), '1,1');
conf('a âncora do elemento largo (o título da lista de Alunos) está no app.js uma vez só', APP.split(ANCORA_LARGO).length - 1, 1);
const ABA_NOVA = '.cel-abas.muitas .cel-aba { flex: 1 1 auto; padding: 0; min-width: var(--alvo-celular); font-weight: 400; line-height: 1.15;\n  overflow-wrap: break-word; hyphens: auto; }';
const ABA_VELHA = '.cel-abas.muitas .cel-aba { flex: 1 1 auto; padding: 0 1px; }';
conf('a regra das cinco abas está no styles.css uma vez só', CSS.split(ABA_NOVA).length - 1, 1);
conf('o sw.js tem o nome do cache onde a prova o troca', /var CACHE = '[^']+';/.test(SW), true);
const TRAV = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']');
conf('o app.js, o styles.css e esta prova não têm travessão',
  [APP, CSS, fs.readFileSync(__filename, 'utf8')].map(t => TRAV.test(t)).join(','), 'false,false,false');
const LETRAS = {};
/* A escala da F1 (09/11/2026): cinco tamanhos em rem, com o nome em px
 * (--letra-12 a --letra-24), que crescem sozinhos com a letra do documento. */
CSS.replace(/--letra-(\d+): ([\d.]+)rem;/g, (m, n, rem) => { LETRAS[n] = Number(rem) * 16; return m; });
conf('(arranjo) a escala de letra tem os cinco tamanhos em rem (' + JSON.stringify(LETRAS) + ')', Object.keys(LETRAS).length, 5);
conf('(arranjo) cada nome da escala é o tamanho em px', Object.keys(LETRAS).every(n => LETRAS[n] === Number(n)), true);

const trocas = {};
if (MODO === V_AVISO) {
  const i = CSS.indexOf(AVISO_NOVO_CSS_INICIO), f = CSS.indexOf(AVISO_NOVO_CSS_FIM) + AVISO_NOVO_CSS_FIM.length;
  trocas['/app.js'] = APP.replace(AVISO_NOVO_APP, AVISO_VELHO_APP);
  trocas['/styles.css'] = CSS.slice(0, i) + CSS.slice(f);
}
if (MODO === V_ABA) trocas['/styles.css'] = CSS.replace(ABA_NOVA, ABA_VELHA).replace('.cel-abas.muitas { padding-left: 2px; padding-right: 2px; }', '');
if (MODO === V_LARGO) {
  trocas['/app.js'] = APP.replace(ANCORA_LARGO, ANCORA_LARGO +
    "    caixa.appendChild(el('div', { id: 'veneno-largo', style: 'width:500px;height:8px;background:#C00' }));\n");
}
if (MODO) conf('o arquivo servido ficou diferente do repositório (' + MODO + ')',
  Object.keys(trocas).every(k => trocas[k] !== { '/app.js': APP, '/styles.css': CSS }[k]) && Object.keys(trocas).length > 0, true);

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
const PASTA = path.join(os.tmpdir(), 'nath_transbordo_emulador_' + process.pid);
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
async function rest(url, corpo) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
  const texto = await r.text();
  try { return { status: r.status, json: JSON.parse(texto) }; } catch (e) { return { status: r.status, json: null }; }
}
const criarUsuario = (u) => rest(AUTH + '/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake',
  { email: u.email, password: u.senha, returnSecureToken: true });

const CFG = { auth: AUTH, firestore: FS, projectId: PROJETO };
const amb = H.criarAmbiente(PORTA_APP, 'nath_celular_transbordo', trocas);

const RELOGIO = '2026-10-06T14:50:00';
async function prepararPagina(pag, movel) {
  pag.setDefaultTimeout(60000);
  if (movel) await pag.setViewport({ width: 360, height: 740, hasTouch: true, isMobile: true });
  pag.errosDePagina = [];
  pag.on('pageerror', e => pag.errosDePagina.push(e.message));
  pag.on('dialog', async d => { try { await d.accept(); } catch (e) { /* ok */ } });
  await pag.evaluateOnNewDocument(alvo => {
    const Real = Date, desvio = new Real(alvo).getTime() - Real.now();
    class Fixo extends Real { constructor(...a) { if (a.length) super(...a); else super(Real.now() + desvio); } static now() { return Real.now() + desvio; } }
    window.Date = Fixo;
  }, RELOGIO);
  await pag.evaluateOnNewDocument(cfg => { window.NUVEM_EMULADOR = cfg; }, CFG);
  /* O aviso com botão some em 9 s (app.js, avisar). A varredura leva mais que
   * isso: o prazo de 9 s vira uma hora nesta página, e só ele. */
  await pag.evaluateOnNewDocument(() => {
    const st = window.setTimeout;
    window.setTimeout = function (f, ms) { const a = Array.prototype.slice.call(arguments); if (ms === 9000) a[1] = 3600000; return st.apply(this, a); };
  });
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
/* Abre e espera o documento que nasceu sob o worker (a primeira visita
 * recarrega sozinha quando o worker assume). */
async function abrirCelular(pag) {
  await pag.goto(amb.ORIGEM + '/index.html', { waitUntil: 'networkidle0' });
  const ok = await esperar('o aplicativo abriu sob o worker', () => pag.evaluate(() =>
    typeof Store === 'object' && !!navigator.serviceWorker.controller && !!document.querySelector('#versao-app') &&
    document.querySelector('#versao-app').textContent.length > 1 && document.body.classList.contains('modo-celular')),
  v => v === true, 40000);
  if (!ok.ok) throw Object.assign(new Error('o aplicativo não abriu'), { jaContado: false });
  await pausa(1500);
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
const aba = (pag, t) => clicar(pag, '#cel-abas .cel-aba[data-cel="' + t + '"]').then(() => pausa(200));
const fixarRelogio = (pag, iso, hhmm) => pag.evaluate((iso, hhmm) => {
  const Real = window.__DataReal || Date;
  window.__DataReal = Real;
  const p = iso.split('-').map(Number), h = hhmm.split(':').map(Number);
  const fixo = new Real(p[0], p[1] - 1, p[2], h[0], h[1]).getTime();
  function Fixa(...a) { return a.length ? new Real(...a) : new Real(fixo); }
  Fixa.prototype = Real.prototype; Fixa.now = () => fixo; Fixa.UTC = Real.UTC; Fixa.parse = Real.parse;
  window.Date = Fixa;
}, iso, hhmm);
async function momento(pag, iso, hhmm) {
  await fixarRelogio(pag, iso, hhmm);
  await aba(pag, 'fechamento');
  await aba(pag, 'hoje');
  // o dia escolhido antes (a folha de ontem) fica: volta ao dia de hoje
  if (await existe(pag, '#cel-dia-hoje')) { await clicar(pag, '#cel-dia-hoje'); await pausa(150); }
  await pausa(150);
}
const nAvisosDoHoje = pag => pag.evaluate(() => document.querySelectorAll('#cel-semana #cel-avisos .cel-aviso').length);
async function abrirFolha(pag, aula) {
  await clicar(pag, '#cel-tempo .cel-bloco[data-aula="' + aula + '"]');
  await pausa(200);
  return existe(pag, '#cel-folha[data-aula="' + aula + '"]');
}
async function fecharTudo(pag) {
  for (const s of ['#cel-form-voltar', '#cel-folha-voltar', '#cel-folha-fechar', '#cel-alunos-voltar', '.btn-cancelar-pagamento']) {
    if (await existe(pag, s)) { await clicar(pag, s); await pausa(120); }
  }
}

/* A letra: 1 é a da folha; 1,3 multiplica a escala inteira e o documento.
 * PROVA_FONTE="Verdana" mede com outra fonte, mais larga que a do aparelho:
 * a largura dos rótulos muda de máquina para máquina (Segoe, Roboto, a do CI). */
const FONTE_DE_FORA = process.env.PROVA_FONTE || '';
if (FONTE_DE_FORA) console.log('   (arranjo) a fonte da rodada: ' + FONTE_DE_FORA);
async function aplicarLetra(pag, escala) {
  await pag.evaluate((escala, letras, fonte) => {
    let s = document.getElementById('prova-letra');
    if (!s) { s = document.createElement('style'); s.id = 'prova-letra'; document.head.appendChild(s); }
    // a escala é em rem: a letra do documento em 130% leva a escala inteira junto
    s.textContent = (escala === 1 ? '' : 'html { font-size: ' + Math.round(escala * 100) + '%; }') +
      (fonte ? ' body { font-family: ' + fonte + '; }' : '');
  }, escala, LETRAS, FONTE_DE_FORA);
  await pausa(120);
  // a letra de 16 px da escala, medida num elemento que a usa de verdade
  return pag.evaluate(() => {
    const p = document.createElement('span'); p.style.fontSize = 'var(--letra-16)'; p.textContent = 'x';
    document.body.appendChild(p); const t = getComputedStyle(p).fontSize; p.remove(); return t;
  });
}
async function janela(pag, l, a) {
  await pag.setViewport({ width: l, height: a, hasTouch: true, isMobile: true });
  await pausa(200);
}

/* A varredura: todo elemento visível da página, as duas propriedades, e
 * quantos ela olhou (quem procura diz quanto olhou). */
const varrer = (pag) => pag.evaluate((isentos) => {
  const W = window.innerWidth;
  const visivel = e => {
    const r = e.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    const cs = getComputedStyle(e);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  const nome = e => {
    const parte = x => x.tagName.toLowerCase() + (x.id ? '#' + x.id : '') +
      (!x.id && typeof x.className === 'string' && x.className.trim() ? '.' + x.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
    const partes = [];
    for (let x = e; x && x !== document.body && partes.length < 3; x = x.parentElement) { partes.unshift(parte(x)); if (x.id) break; }
    return partes.join(' > ');
  };
  const isento = e => isentos.some(s => e.closest(s));
  const falhas = [];
  let olhados = 0;
  for (const e of document.querySelectorAll('body *')) {
    if (e.closest('svg') && e.tagName.toLowerCase() !== 'svg') continue;
    if (!visivel(e)) continue;
    olhados++;
    if (isento(e)) continue;
    const campo = /^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName);
    if (!campo && e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 1)
      falhas.push({ tipo: 'rola de lado', sel: nome(e), px: e.scrollWidth - e.clientWidth });
    const r = e.getBoundingClientRect();
    if (r.right > W + 1) falhas.push({ tipo: 'passa da borda', sel: nome(e), px: Math.round(r.right - W) });
    // as abas de baixo: o alvo de toque de 48 px, na largura e na altura
    if (e.matches('#cel-abas .cel-aba') && (r.width < 47.5 || r.height < 47.5))
      falhas.push({ tipo: 'alvo menor que 48 px (' + Math.round(r.width) + 'x' + Math.round(r.height) + ')', sel: nome(e), px: Math.round(48 - Math.min(r.width, r.height)) });
  }
  /* O texto que sai da caixa: o rótulo do botão que passa da borda do botão
   * não aparece no scrollWidth do botão (o Chrome não o conta), e foi assim o
   * aviso que o dono viu. Cada texto visível tem de caber, na largura, na
   * caixa de quem o contém, e na tela. */
  const andar = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let textos = 0;
  for (let n = andar.nextNode(); n; n = andar.nextNode()) {
    if (!n.nodeValue.trim()) continue;
    const pai = n.parentElement;
    if (!pai || /^(SCRIPT|STYLE|NOSCRIPT|OPTION)$/.test(pai.tagName) || pai.closest('svg') || !visivel(pai)) continue;
    if (isento(pai)) continue;
    const g = document.createRange(); g.selectNodeContents(n);
    const rt = g.getBoundingClientRect();
    if (rt.width <= 0) continue;
    textos++;
    const rp = pai.getBoundingClientRect();
    const sai = Math.max(rt.right - rp.right, rp.left - rt.left, rt.right - W);
    if (sai > 1) falhas.push({ tipo: 'o texto "' + n.nodeValue.trim().slice(0, 24) + '" sai da caixa', sel: nome(pai), px: Math.round(sai) });
  }
  const doc = document.documentElement.scrollWidth - W;
  if (doc > 1) falhas.push({ tipo: 'a página rola de lado', sel: 'html', px: doc });
  const topo = document.querySelector('#modo-celular .cel-topo');
  const hoje = document.querySelector('#cel-hoje');
  return { olhados, textos, falhas, W, topo: topo ? Math.round(topo.getBoundingClientRect().height) : -1,
    hojeDentro: hoje && hoje.clientWidth ? hoje.scrollWidth - hoje.clientWidth : null };
}, ISENTOS);

const registro = []; // { tela, janela, letra, olhados, falhas }
let letraAtual = 1, janelaAtual = '360x740';
async function medir(pag, tela) {
  const v = await varrer(pag);
  registro.push({ tela, janela: janelaAtual, letra: letraAtual, olhados: v.olhados, textos: v.textos, falhas: v.falhas, topo: v.topo });
  console.log('   medida ' + tela + ' | ' + janelaAtual + ' | letra ' + Math.round(letraAtual * 100) + '% | barra do alto ' + v.topo + ' px' +
    (v.hojeDentro !== null ? ' | #cel-hoje por dentro ' + v.hojeDentro + ' px' : ''));
  v.falhas.forEach(f => console.log('   TRANSBORDA  ' + tela + ' | ' + janelaAtual + ' | letra ' + Math.round(letraAtual * 100) + '% | ' +
    f.sel + ' | ' + f.tipo + ' ' + f.px + ' px'));
  return v;
}
/* Cada estado: como chegar, e a prova de que chegou (busca que não olhou não
 * pode parecer busca vazia). */
async function estado(pag, tela, abrir) {
  const chegou = await abrir();
  if (!chegou) { conf('a tela "' + tela + '" abriu (' + janelaAtual + ', letra ' + Math.round(letraAtual * 100) + '%)', false, true); return null; }
  return medir(pag, tela);
}
const esconderAviso = pag => pag.evaluate(() => { const a = document.querySelector('#aviso'); if (a) a.classList.remove('aberto'); });

async function percorrer(pag, telas) {
  for (const [l, a] of TELAS_DE_CELULAR) {
    for (const esc of ESCALAS) {
      await janela(pag, l, a);
      janelaAtual = l + 'x' + a;
      letraAtual = esc;
      const tam = await aplicarLetra(pag, esc);
      if (tam !== (16 * esc) + 'px') conf('a letra em ' + Math.round(esc * 100) + '% pegou (a --letra-16 com ' + tam + ')', tam, (16 * esc) + 'px');
      for (const [tela, abrir] of telas) {
        await esconderAviso(pag);
        await estado(pag, tela, abrir);
        await fecharTudo(pag);
      }
    }
  }
  await aplicarLetra(pag, 1);
}

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
      aluno('alfa', 'Aluno Alfa Teste', '#1F3A5F', { telefone: '(11) 98765-4321', endereco: 'Rua de Teste, 123, apartamento 45, bloco B' }),
      aluno('beta', 'Aluno Beta Teste', '#C9A961', { obs: 'Contato: (11) 91234-5678' }),
      // o nome comprido: o que mais aperta a linha no celular
      aluno('longo', 'Aluno Com Nome Bem Comprido Maximiliano Teste', '#2E7D6B', { telefone: '(11) 3456-7890' })
    ];
    const aula = (id, alunoId, data, hora, status, extra) => Object.assign({ id, alunoId, serieId: null, data, hora, duracaoMin: 60, status,
      cobravel: status === 'cancelada' ? false : true, notaTexto: '', anexos: [] }, extra || {});
    const relato = { notaTexto: 'Relato de teste.' };
    d.aulas = [
      aula('alfa-0708', 'alfa', '2026-07-08', '10:00', 'realizada', relato),
      aula('beta-0812', 'beta', '2026-08-12', '10:00', 'realizada', relato),
      aula('longo-1002', 'longo', '2026-10-02', '09:00', 'realizada', relato),
      aula('alfa-1005', 'alfa', '2026-10-05', '10:00', 'realizada'),
      aula('longo-1006', 'longo', '2026-10-06', '13:00', 'realizada', relato),
      aula('beta-1006', 'beta', '2026-10-06', '14:00', 'cancelada'),
      aula('alfa-1006', 'alfa', '2026-10-06', '15:30', 'realizada')
    ];
    d.pagamentos = [{ id: 'pg-alfa-07', alunoId: 'alfa', mes: '2026-07', pagoEm: '2026-08-03', valor: 50 }];
    d.ajustes = d.ajustes || {};
    d.ajustes.pagamentosDesde = '2026-06';
    await Store.salvar(d);
  });
  await H.abrirApp(pagA, amb.ORIGEM);
  conf('o tablet entrou', await entrarPelaTela(pagA, DONA.email, DONA.senha), true);
  await clicar(pagA, '#nuvem-enviar');
  conf('a cópia do tablet subiu', (await esperar('a cópia subiu', () => texto(pagA, '#nuvem-ultima'), v => /^Última cópia na nuvem: hoje/.test(v || ''), 30000)).ok, true);
  const sA = await pagA.evaluate(() => Nuvem.sincronizar({ versaoApp: 'prova' }).then(r => ({ enviados: r.enviados.enviados, erro: r.enviados.erro ? r.enviados.erro.codigo : null })));
  conf('o tablet subiu os registros', sA.enviados > 0 && sA.erro === null, true);
  await pagA.evaluate(u => Nuvem.permitirLeitor(u), obs.localId);

  secao('2. A tela de entrar do celular');
  const ctxC = await pagA.browser().createBrowserContext();
  const pagC = await ctxC.newPage();
  await prepararPagina(pagC, true);
  await abrirCelular(pagC);
  await percorrer(pagC, [['entrar', () => existe(pagC, '#cel-entrada.ativa #cel-conta #nuvem-entrar')]]);
  await janela(pagC, 360, 740);
  conf('o celular entrou com a conta da dona', await entrarNoCelular(pagC, DONA), true);
  conf('trouxe a cópia do tablet', await trazerCopiaNoCelular(pagC), true);
  conf('(arranjo) é o celular da dona, que edita', await pagC.evaluate(() => Nuvem.estado().celularDaDona), true);

  secao('3. As telas da dona, nas três larguras e nas duas letras');
  const hojeCom = async () => { await momento(pagC, '2026-10-06', '14:50'); return (await nAvisosDoHoje(pagC)) > 0; };
  const folhaDe = (aula, passo, dia) => async () => {
    await hojeCom();
    if (dia) { await clicar(pagC, '.cel-semana-dia[data-dia="' + dia + '"]'); await pausa(200); }
    if (!(await abrirFolha(pagC, aula))) return false;
    if (!passo) return existe(pagC, '#cel-folha [data-acao-celular]');
    return (await clicar(pagC, passo.botao)) && (await pausa(200), existe(pagC, passo.chegou));
  };
  const TELAS_DONA = [
    ['Hoje sem aviso', async () => { await momento(pagC, '2026-10-03', '20:00'); return (await nAvisosDoHoje(pagC)) === 0 && existe(pagC, '#cel-hoje.ativa'); }],
    ['Hoje com os avisos do alto', hojeCom],
    // 18:00, mais de 2 h sem receber: a barra do alto volta, com o ↻
    ['Hoje com a barra do alto à vista', async () => { await momento(pagC, '2026-10-06', '18:00');
      return pagC.evaluate(() => !document.querySelector('#modo-celular').classList.contains('topo-recolhido') && /desatualizado/.test(document.querySelector('#cel-origem').textContent)); }],
    ['Alunos', async () => { await aba(pagC, 'alunos'); return existe(pagC, '#cel-alunos-lista .cel-aluno-item'); }],
    ['a ficha do aluno', async () => { await aba(pagC, 'alunos'); await clicar(pagC, '#cel-alunos-lista .cel-aluno-item[data-aluno="longo"]'); await pausa(150); return existe(pagC, '#cel-ficha'); }],
    ['Fechamento', async () => { await aba(pagC, 'fechamento'); return existe(pagC, '#cel-fechamento.ativa .cel-mes'); }],
    ['o "Marcar como pago" aberto', async () => {
      await aba(pagC, 'fechamento');
      return (await clicar(pagC, '#cel-fechamento .btn-marcar-pago')) && (await pausa(150), existe(pagC, '#cel-fechamento .btn-confirmar-pagamento'));
    }],
    ['Enviar', async () => { await aba(pagC, 'enviar'); return existe(pagC, '#cel-enviar.ativa'); }],
    ['a folha da aula, com as ações', folhaDe('alfa-1006')],
    ['o Cancelar', folhaDe('alfa-1006', { botao: '#cel-folha-cancelar', chegou: '#cel-cancelar-pergunta' })],
    ['o Remarcar', folhaDe('alfa-1006', { botao: '#cel-folha-remarcar', chegou: '#cel-remarcar-salvar' })],
    ['o "Escrever como foi"', folhaDe('alfa-1005', { botao: '#cel-folha-registrar', chegou: '#cel-relato-salvar' }, '2026-10-05')],
    ['o "Marcar aula"', async () => { await hojeCom(); return (await clicar(pagC, '#cel-marcar-aula')) && (await pausa(200), existe(pagC, '#cel-aula-salvar')); }],
    ['o "Cadastrar aluno"', async () => { await hojeCom(); return (await clicar(pagC, '#cel-novo-aluno')) && (await pausa(200), existe(pagC, '#cel-aluno-salvar')); }]
  ];
  // o momento de Hoje de 06/10 tem de valer antes da Alunos (o dia que a ficha usa)
  await momento(pagC, '2026-10-06', '14:50');
  await percorrer(pagC, TELAS_DONA);

  /* O "+" no fim da agenda: rolada até o fim, ele não cobre bloco nem botão. */
  const fab = [];
  for (const [l, a] of TELAS_DE_CELULAR) {
    for (const esc of ESCALAS) {
      await janela(pagC, l, a);
      await aplicarLetra(pagC, esc);
      await hojeCom();
      await pagC.evaluate(() => { const c = document.querySelector('#cel-conteudo'); c.scrollTop = c.scrollHeight; });
      await pausa(150);
      fab.push(l + '/' + Math.round(esc * 100) + '%: ' + await pagC.evaluate(() => {
        const f = document.querySelector('#cel-marcar-aula'); if (!f) return 'sem o +';
        const r = f.getBoundingClientRect();
        const cobre = Array.from(document.querySelectorAll('#cel-hoje .cel-bloco, #cel-hoje button, #cel-hoje a[href]')).filter(e => e !== f && e.getBoundingClientRect().height > 0)
          .filter(e => { const q = e.getBoundingClientRect(); return q.left < r.right && q.right > r.left && q.top < r.bottom && q.bottom > r.top; });
        return cobre.length ? 'cobre ' + cobre.map(e => e.id || e.className).join(',') : 'livre';
      }));
    }
  }
  await aplicarLetra(pagC, 1);
  conf('rolada a agenda até o fim, o "+" não cobre bloco nem botão (' + fab.join('; ') + ')', fab.every(x => /livre$/.test(x)), true);

  secao('4. O observador de outra conta');
  const ctxD = await pagA.browser().createBrowserContext();
  const pagD = await ctxD.newPage();
  await prepararPagina(pagD, true);
  await abrirCelular(pagD);
  conf('o observador entrou com a conta dele', await entrarNoCelular(pagD, OBS), true);
  conf('trouxe a cópia da dona pelo código da conta dela', await trazerCopiaNoCelular(pagD, dona.localId), true);
  const TELAS_OBS = [
    ['observador: Hoje', async () => { await momento(pagD, '2026-10-06', '14:50'); return existe(pagD, '#cel-hoje.ativa'); }],
    ['observador: a folha só leitura', async () => {
      await momento(pagD, '2026-10-06', '14:50');
      return (await abrirFolha(pagD, 'alfa-1006')) && !(await existe(pagD, '#cel-folha [data-acao-celular]'));
    }],
    ['observador: Fechamento', async () => { await aba(pagD, 'fechamento'); return existe(pagD, '#cel-fechamento.ativa .cel-mes'); }],
    ['observador: o painel de Diagnóstico', async () => {
      await aba(pagD, 'diagnostico');
      return (await esperar('o diagnóstico respondeu', () => pagD.evaluate(() => !!document.querySelector('#cel-diagnostico.ativa #cel-diag-este') &&
        !/Consultando/.test(document.querySelector('#cel-diag-lista').textContent)), v => v === true, 10000)).ok;
    }],
    ['observador: Ajustes', async () => { await aba(pagD, 'ajustes'); return existe(pagD, '#cel-ajustes.ativa #cel-obs-conta'); }]
  ];
  await percorrer(pagD, TELAS_OBS);

  secao('5. O aviso de versão nova no celular da dona');
  /* Uma versão nova de verdade: o servidor passa a entregar um sw.js com
   * outro nome de cache e o app.js com a versão 9.9.9; o worker novo instala
   * inteiro e fica esperando, e o app mostra o aviso, como no celular dela. */
  trocas['/sw.js'] = SW.replace(/var CACHE = '[^']+';/, "var CACHE = 'apoio-educacional-v9999';");
  trocas['/app.js'] = (trocas['/app.js'] || APP).replace(/var VERSAO = '[^']+'/, "var VERSAO = '9.9.9'");
  await momento(pagC, '2026-10-06', '14:50');
  await esconderAviso(pagC);
  await pagC.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update())).catch(() => { });
  const veio = await esperar('o aviso de versão nova apareceu', () => pagC.evaluate(() => document.querySelector('#aviso.aberto') &&
    /^Versão nova pronta/.test(document.querySelector('#aviso-texto').textContent)), v => v === true, 45000);
  conf('o worker novo instalou e o aviso de versão nova apareceu no celular', veio.ok, true);
  const leAviso = () => pagC.evaluate(() => {
    const a = document.querySelector('#aviso'), r = a.getBoundingClientRect();
    const filhos = Array.from(a.children).filter(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0);
    const caixas = filhos.map(e => e.getBoundingClientRect());
    const t = document.querySelector('#aviso-texto'), rt = t.getBoundingClientRect();
    const botoes = filhos.filter(e => e.tagName === 'BUTTON'), rb = botoes.map(b => b.getBoundingClientRect());
    const altLinha = parseFloat(getComputedStyle(t).lineHeight) || parseFloat(getComputedStyle(t).fontSize) * 1.4;
    return {
      texto: t.textContent,
      versao: t.getAttribute('data-versao'),
      botoes: botoes.map(b => b.textContent).join(' | '),
      altura: Math.round(r.height),
      tamanho: getComputedStyle(t).fontSize,
      // o texto numa linha só, e os botões juntos na linha de baixo
      textoUmaLinha: rt.height <= altLinha * 1.5,
      botoesAbaixo: rb.length > 0 && rb.every(c => c.top >= rt.bottom - 1),
      botoesJuntos: rb.length > 0 && Math.max(...rb.map(c => c.top)) < Math.min(...rb.map(c => c.bottom)),
      botoes48: rb.every(c => c.height >= 47.5),
      // cada botão: o rótulo cabe na caixa dele
      rotulosCabem: botoes.every(b => b.scrollWidth <= b.clientWidth + 1 && b.scrollHeight <= b.clientHeight + 1),
      dentro: caixas.every(c => c.left >= -1 && c.right <= innerWidth + 1)
    };
  });
  const avisos = [];
  /* Com a versão nova pronta, ela vira também um aviso do painel de Hoje
   * (#135): no dia sem aviso, o painel tem exatamente um, e é o de versão. */
  const soOAvisoDeVersao = async () => {
    await momento(pagC, '2026-10-03', '20:00');
    const tipos = await pagC.evaluate(() => Array.from(document.querySelectorAll('#cel-semana #cel-avisos .cel-aviso')).map(a => a.dataset.aviso).join(','));
    if (tipos !== 'versao') console.log('   o painel do dia sem aviso, com a versão nova, mostrou: "' + tipos + '"');
    return tipos === 'versao' && existe(pagC, '#cel-hoje.ativa');
  };
  const TELAS_AVISO = [TELAS_DONA.find(t => t[0] === 'Hoje com os avisos do alto'), ['Hoje sem aviso', soOAvisoDeVersao],
    TELAS_DONA.find(t => t[0] === 'Alunos'), TELAS_DONA.find(t => t[0] === 'Fechamento')];
  for (const [l, a] of TELAS_DE_CELULAR) {
    for (const esc of ESCALAS) {
      await janela(pagC, l, a);
      janelaAtual = l + 'x' + a;
      letraAtual = esc;
      await aplicarLetra(pagC, esc);
      for (const [tela, abrir] of TELAS_AVISO) {
        /* Trocar de aba esconde o aviso (irParaTelaCelular); ele volta à
         * vista com o mesmo conteúdo, como volta na abertura seguinte. */
        await estado(pagC, tela + ', com o aviso de versão nova', async () => {
          const ok = await abrir();
          await pagC.evaluate(() => document.querySelector('#aviso').classList.add('aberto'));
          await pausa(80);
          return ok && /^Versão nova pronta/.test((await texto(pagC, '#aviso.aberto #aviso-texto')) || '');
        });
        if (tela === 'Hoje com os avisos do alto') {
          const av = await leAviso();
          avisos.push(Object.assign({ janela: janelaAtual, letra: esc }, av));
          console.log('   aviso ' + janelaAtual + ' letra ' + Math.round(esc * 100) + '%: ' + JSON.stringify(av));
          if (l === 360 && PRINTS) {
            fs.mkdirSync(PRINTS, { recursive: true });
            const arq = path.join(PRINTS, 'aviso_360x740_letra_' + Math.round(esc * 100) + '.png');
            await pagC.screenshot({ path: arq });
            console.log('   print: ' + arq);
          }
        }
        await fecharTudo(pagC);
      }
    }
  }
  await aplicarLetra(pagC, 1);
  const a0 = avisos[0] || {};
  prop('o aviso diz "Versão nova pronta." e os botões são "Atualizar" e "Depois" (' + a0.texto + ' ; ' + a0.botoes + ')',
    a0.texto === 'Versão nova pronta.' && a0.botoes === 'Atualizar | Depois', V_AVISO);
  prop('o número da versão nova fica guardado no aviso (data-versao: ' + a0.versao + ')', a0.versao === '9.9.9', V_AVISO);
  prop('a letra do aviso é a de 14 px (' + a0.tamanho + ')', a0.tamanho === '14px', V_AVISO);
  /* Duas linhas, e não mais: o texto (uma linha), os botões de 48 px e as
   * folgas. 100 px é o teto com a letra normal, 110 px com 130%. */
  prop('nas três larguras e nas duas letras: o texto numa linha, os dois botões juntos na linha de baixo com 48 px, os rótulos dentro dos botões, tudo dentro da tela (' +
    avisos.map(x => x.janela + '/' + Math.round(x.letra * 100) + '%: ' + x.altura + ' px' + (x.textoUmaLinha ? '' : ' TEXTO-QUEBRA') +
      (x.botoesAbaixo && x.botoesJuntos ? '' : ' BOTÕES-FORA-DO-LUGAR') + (x.botoes48 ? '' : ' BAIXO') + (x.rotulosCabem ? '' : ' RÓTULO-SAI') + (x.dentro ? '' : ' FORA')).join(', ') + ')',
    avisos.length === 6 && avisos.every(x => x.textoUmaLinha && x.botoesAbaixo && x.botoesJuntos && x.botoes48 && x.rotulosCabem && x.dentro &&
      x.altura <= (x.letra === 1 ? 100 : 110)), V_AVISO);

  secao('5b. A barra do alto');
  const barra = nome => registro.filter(r => r.tela === nome).map(r => r.janela + '/' + Math.round(r.letra * 100) + '%: ' + r.topo + ' px');
  conf('em dia, a barra do alto da dona some (Hoje com os avisos do alto: ' + barra('Hoje com os avisos do alto').join(', ') + ')',
    registro.filter(r => r.tela === 'Hoje com os avisos do alto').every(r => r.topo === 0), true);
  conf('com pendência, a barra volta com 40 px na letra normal (' + barra('Hoje com a barra do alto à vista').join(', ') + ')',
    registro.filter(r => r.tela === 'Hoje com a barra do alto à vista').every(r => r.topo > 0 && (r.letra !== 1 || r.topo <= 40)), true);

  secao('6. O resumo da varredura');
  const comFalha = registro.filter(r => r.falhas.length);
  const telas = Array.from(new Set(registro.map(r => r.tela)));
  console.log('   ' + registro.length + ' varreduras, ' + telas.length + ' telas, ' + registro.reduce((s, r) => s + r.olhados, 0) + ' elementos olhados; ' +
    comFalha.length + ' com transbordo');
  conf('a varredura olhou as 24 telas, cada uma nas 3 larguras e nas 2 letras (' + registro.length + ' varreduras)', registro.length, 24 * 6);
  conf('toda varredura olhou ao menos 20 elementos visíveis (a menor: ' + Math.min(...registro.map(r => r.olhados)) + ')', registro.every(r => r.olhados >= 20), true);
  conf('e ao menos 5 textos visíveis (o menor: ' + Math.min(...registro.map(r => r.textos)) + ')', registro.every(r => r.textos >= 5), true);
  const resumo = comFalha.map(r => r.tela + ' ' + r.janela + ' ' + Math.round(r.letra * 100) + '%: ' + r.falhas.map(f => f.sel + ' ' + f.px + ' px').join('; '));
  prop('nenhuma tela do celular transborda, em nenhuma largura nem letra (' + (resumo.slice(0, 6).join(' || ') || 'nenhuma') + (resumo.length > 6 ? ' || e mais ' + (resumo.length - 6) : '') + ')',
    comFalha.length === 0, [V_AVISO, V_LARGO, V_ABA]);
  if (MODO === V_LARGO) conf('o veneno foi pego pelo nome: o #veneno-largo, na tela Alunos, nas 6 combinações',
    registro.filter(r => r.tela === 'Alunos' && r.falhas.some(f => /#veneno-largo/.test(f.sel))).length >= 6, true);
  if (MODO === V_ABA) conf('o veneno foi pego pelo alvo: uma aba do observador abaixo de 48 px',
    comFalha.some(r => /^observador/.test(r.tela) && r.falhas.some(f => /alvo menor que 48/.test(f.tipo))), true);
  if (MODO === V_AVISO) conf('o veneno foi pego pelo aviso: a falha está no #aviso',
    comFalha.some(r => r.falhas.some(f => /#aviso/.test(f.sel))), true);

  secao('7. Sem erro de página, e o veneno pedido foi visto');
  conf('nenhum erro de página no tablet, no celular e no observador', [pagA, pagC, pagD].map(p => p.errosDePagina.join(' | ')).filter(Boolean).join(' || '), '');
  if (MODO) conf('o veneno ' + MODO + ' foi visto', vistos.indexOf(MODO) >= 0, true);
  await ctxD.close();
  await ctxC.close();
})().then(() => derrubarEmulador().then(H.fim(amb)), e => derrubarEmulador().then(() => H.fim(amb)(e)));
