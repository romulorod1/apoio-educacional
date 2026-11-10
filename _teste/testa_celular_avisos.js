/* testa_celular_avisos.js
 *
 * D6c, lote 4: o que o app mostra sozinho no alto de Hoje do celular. Contra
 * o Firebase Emulator Suite (Auth e Firestore), com um tablet (1280 px), o
 * celular da dona (360 x 740) e um observador de outra conta (360 x 740).
 * Alunos, telefones e valores fictícios.
 *
 * O que prova:
 *   1. a próxima aula fica só no selo PRÓXIMA do bloco, na agenda
 *      (marcasDeAgoraCelular, do lote 1), e não se repete nos avisos
 *      (auditoria de UX de 09/11);
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
 *   5. os avisos na ordem: próxima, sem registro, cobrar, fechar o mês; em
 *      360 x 740 a linha de agora e a próxima ficam na primeira tela;
 *   6. o observador vê a próxima e a aula sem registro, sem cobrar e sem o
 *      mês a fechar, e nada sobe dele;
 *   7. o tablet não muda: nenhum aviso nele, e junho continua 10 encontros,
 *      10:30 e R$ 1.050,00 nos dois;
 *   8. (compactos, 09/11) num dia com TODOS os avisos (29/10 ao meio-dia: a
 *      próxima, 4 aulas sem registro, 2 famílias a cobrar e outubro a
 *      fechar), em 390 x 844: recolhidos por padrão, só o selinho na linha
 *      da data, sem linha própria; o topo da agenda a no máximo 422 px, com
 *      o painel fechado e aberto; o toque (touch) no selinho abre o painel
 *      com as aulas certas, cada uma abrindo o "Registrar como foi"; o ponto
 *      no bloco nas mesmas aulas da lista e só nelas; fechar o painel devolve
 *      a agenda ao lugar; arrastar um aviso para o lado o dispensa (com o
 *      Desfazer), sem tocar a fila nem a nuvem, sem mexer na semana; no dia
 *      seguinte o que ainda vale volta; com o armazenamento lançando erro, o
 *      app abre e mostra o selinho; o observador, sem cobrar.
 *
 * Venenos, que TÊM de reprovar a propriedade:
 *   --envenenado-cobra-antes-do-dia-6     a cobrança aparece no dia 5 (core.js);
 *   --envenenado-observador-cobra         o observador ganha o aviso e o botão de cobrar;
 *   --envenenado-telefone-de-texto-vira-link  o telefone que não passa na regra vira link;
 *   --envenenado-valor-fora-do-selo       a cobrança leva o devido do mês, e não o que falta pelo selo;
 *   --envenenado-registrada-falta-registrar   a aula registrada aparece como "falta registrar";
 *   --envenenado-lista-aberta-por-padrao  o painel (e a lista sem registro) abre sem toque;
 *   --envenenado-marca-em-registrada      a aula registrada ganha o ponto de sem registro;
 *   --envenenado-marca-e-lista-discordam  o ponto sai de outro critério (a aula futura e a cancelada);
 *   --envenenado-avisos-empilhados        os avisos empilhados de antes, abertos e sem corte: a agenda desce;
 *   --envenenado-recolhido-empurra        o selinho ganha uma linha própria;
 *   --envenenado-dispensa-para-sempre     o dispensado não volta no dia seguinte;
 *   --envenenado-dispensa-nao-some        o arrasto não tira o aviso;
 *   --envenenado-dispensa-na-nuvem        o dispensado entra na fila de registros (e sobe);
 *   --envenenado-topo-alto                os avisos abertos e os dias da semana de volta no alto preso:
 *                                         o topo fixo passa de 20% da altura.
 *   --envenenado-lembrete-fora-da-janela  o lembrete de fechar o mês sai da janela (core.js);
 *   --envenenado-observador-sem-sessao    a cobrança e o mês a fechar abrem pela falta de observador, e o
 *                                         observador que sai da conta passa a vê-los (a revisão do lote 4).
 *
 * O relógio: a página começa em 06/10/2026 14:50 (e anda); cada momento da
 * prova para o relógio da página num dia e numa hora (fixarRelogio), e o
 * Hoje se redesenha. A prova não depende do dia em que roda.
 *
 *   --prints <pasta>   os quatro prints do lote 4, em 360 x 740, e os quatro dos
 *                      avisos compactos, em 390 x 844 (recolhido, painel aberto,
 *                      dispensado com o Desfazer, observador).
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
  '--envenenado-valor-fora-do-selo', '--envenenado-registrada-falta-registrar', '--envenenado-lembrete-fora-da-janela',
  '--envenenado-observador-sem-sessao', '--envenenado-lista-aberta-por-padrao', '--envenenado-marca-em-registrada',
  '--envenenado-marca-e-lista-discordam', '--envenenado-avisos-empilhados', '--envenenado-recolhido-empurra',
  '--envenenado-dispensa-para-sempre', '--envenenado-dispensa-nao-some', '--envenenado-dispensa-na-nuvem', '--envenenado-topo-alto'];
const [V_DIA5, V_OBS, V_TELEFONE, V_VALOR, V_REGISTRADA, V_JANELA, V_SAIR, V_ABERTA, V_MARCA_REG, V_DISCORDA, V_EMPILHADOS, V_EMPURRA,
  V_SEMPRE, V_NAO_SOME, V_NUVEM, V_TOPO] = MODOS;
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
  [V_OBS]: ['app.js', 'var edita = celularEdita(), daDona = edita;', 'var edita = celularEdita(), daDona = true;'],
  // a porta da primeira versão (revisão do lote 4): "não é observador" em vez de "é a dona"; o observador que sai da conta passa a cobrar
  [V_SAIR]: ['app.js', 'var edita = celularEdita(), daDona = edita;', 'var edita = celularEdita(), daDona = !leOutraConta();'],
  // o atalho que o dono recusou no lote 2: os dígitos de qualquer texto do contato viram o número
  [V_TELEFONE]: ['app.js', LINK_COBRAR,
    "var link = 'https://wa.me/55' + telefoneDoAluno(fam.aluno).replace(/\\D/g, '').replace(/^55/, '') + '?text=' + encodeURIComponent(mensagemDeCobrancaCelular(fam));"],
  [V_VALOR]: ['app.js', 'porAluno[p.alunoId].meses.push({ mes: p.mes, falta: s.falta, selo: s.selo });', 'porAluno[p.alunoId].meses.push({ mes: p.mes, falta: s.devido, selo: s.selo });'],
  [V_REGISTRADA]: ['app.js', '    return !Core.aulaTemRegistro(a);', '    return true;'],
  // (compactos) o painel aberto sem toque
  [V_ABERTA]: ['app.js', 'var PAINEL_ABERTO_AO_CHEGAR = false;', 'var PAINEL_ABERTO_AO_CHEGAR = true;'],
  // o ponto também na aula registrada
  [V_MARCA_REG]: ['app.js', 'blocoDaAulaCelular(l.aula, marcas[l.aula.id], !!semRegistro[l.aula.id])',
    'blocoDaAulaCelular(l.aula, marcas[l.aula.id], !!semRegistro[l.aula.id] || Core.aulaTemRegistro(l.aula))'],
  // o ponto por outro critério: toda aula do dia sem registro, a futura e a cancelada também
  [V_DISCORDA]: ['app.js', 'aulasDoAvisoSemRegistroCelular(hoje, minutosAgoraCelular()).forEach(function (a) { semRegistro[a.id] = true; });',
    'aulasDoDiaCelular(dia).filter(function (a) { return !Core.aulaTemRegistro(a); }).forEach(function (a) { semRegistro[a.id] = true; });'],
  // os avisos de antes: todos à vista, empilhados, sem o corte na metade da tela
  [V_EMPILHADOS]: ['app.js', "var aberto = painelDosAvisosAberto, classeDoPainel = 'cel-avisos cel-avisos-sobre';",
    "var aberto = true, classeDoPainel = 'cel-avisos';"],
  // o selinho numa linha só dele, entre a data e os dias
  [V_EMPURRA]: ['app.js', "topo.insertBefore(selo, topo.querySelector('#cel-dia-seguinte'));",
    "faixa.insertBefore(el('div', { class: 'cel-avisos-linha' }, [selo]), faixa.querySelector('.cel-semana-dias'));"],
  // os dispensados de todo dia valem hoje
  [V_SEMPRE]: ['app.js', '    return e.dispensados[hoje] || [];',
    '    return Object.keys(e.dispensados).reduce(function (t, d) { return t.concat(e.dispensados[d]); }, []);'],
  // o alto preso de antes da auditoria de 09/11: a semana inteira e os avisos abertos
  [V_TOPO]: ['app.js', '    caixa.appendChild(semana.dias);',
    "    faixa.insertBefore(semana.dias, faixa.querySelector('#cel-avisos')); if (faixa.querySelector('#cel-avisos')) faixa.querySelector('#cel-avisos').hidden = false;"],
  [V_NAO_SOME]: ['app.js', 'if (lista.indexOf(chave) < 0) lista.push(chave);', 'if (lista.indexOf(chave) < 0) void chave;'],
  // o dispensado gravado no banco, como ajuste: entra na fila de registros e sobe
  [V_NUVEM]: ['app.js', 'estado.dispensados[hoje] = lista;',
    'estado.dispensados[hoje] = lista; comoAcaoDoCelular(function () { db.ajustes.avisosDispensados = lista.slice(); salvar(); });'],
  [V_JANELA]: ['core.js', 'var LEMBRETE_FIM_DO_MES_DIAS = 3, LEMBRETE_INICIO_DO_MES_DIAS = 5;', 'var LEMBRETE_FIM_DO_MES_DIAS = 4, LEMBRETE_INICIO_DO_MES_DIAS = 6;']
};
const FONTES = { 'app.js': APP, 'core.js': CORE };
conf('cada âncora de veneno está no arquivo dela uma vez só', MODOS.map(m => FONTES[ANCORAS[m][0]].split(ANCORAS[m][1]).length - 1).join(','), MODOS.map(() => 1).join(','));
const TRAV = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']');
conf('o app.js, o core.js, o styles.css e esta prova não têm travessão',
  [APP, CORE, CSS, fs.readFileSync(__filename, 'utf8')].map(t => TRAV.test(t)).join(','), 'false,false,false,false');
/* O núcleo reaproveitado: a Próxima é só a do bloco (marcasDeAgoraCelular), sem aviso repetido;
 * função; o "sem registro" é o critério do ultimoEncontro; o link é o do lote 2. */
conf('a Próxima sai só de marcasDeAgoraCelular, para o bloco (a definição e um uso: nenhum aviso a repete)', APP.split('marcasDeAgoraCelular(').length - 1, 2);
conf('o ultimoEncontro do tablet e o aviso usam o mesmo critério de registro (Core.aulaTemRegistro)',
  [/if \(!aulaTemRegistro\(au\)\) continue;/.test(CORE), APP.split('Core.aulaTemRegistro(').length - 1].join(','), 'true,1');
conf('o link de cobrar é o linkDoWhatsapp do lote 2, com o telefoneDoCampo', /var tel = telefoneDoCampo\(fam\.aluno\);\s+var link = linkDoWhatsapp\(tel, mensagemDeCobrancaCelular\(fam\)\);/.test(APP), true);
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
/* O painel pode estar recolhido: o texto se lê do mesmo jeito. Cada linha
 * é "título | detalhe" ("4 aulas sem registro | Aluno Alfa Teste hoje,
 * 10:00. Aluno Gama Teste hoje, 09:00."), a primeira ação, as aulas da
 * linha em ordem e as chaves do dispensar. */
const avisos = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#cel-semana #cel-avisos .cel-aviso')).map(a => {
  const l = a.querySelector('a[href]'), ac = a.querySelector('[data-acao-celular]'), mais = a.querySelector('#cel-aviso-mais-familias');
  const t = s => { const e = a.querySelector(s); return !e ? '' : e.querySelector('li') ? Array.from(e.querySelectorAll('li')).map(li => li.textContent).join(' ; ') : e.textContent; };
  const primeira = a.querySelector('.cel-aviso-acao');
  return { tipo: a.dataset.aviso, texto: [t('.cel-aviso-titulo'), t('.cel-aviso-detalhe')].filter(Boolean).join(' | ').replace(/\u00a0/g, ' '),
    seta: primeira ? primeira.textContent : '',
    aula: a.dataset.aula || '', aulas: (a.dataset.aulas || '').split(' ').filter(Boolean), chaves: a.dataset.chaves || '',
    mes: a.dataset.mes || '', aluno: a.dataset.aluno || '', link: l ? l.getAttribute('href') : '', rotuloLink: l ? l.textContent : '',
    mais: mais ? mais.textContent : '', acao: ac ? ac.getAttribute('data-acao-celular') : '' };
}));
/* O selinho e o painel: o número, se o painel está aberto, e o que o
 * leitor de tela ouve. */
const selinho = pag => pag.evaluate(() => {
  const s = document.querySelector('#cel-avisos-selo'), p = document.querySelector('#cel-avisos');
  return { existe: !!s, numero: s ? s.querySelector('.cel-avisos-selo-numero').textContent : '', expandido: s ? s.getAttribute('aria-expanded') : '',
    painelVisivel: !!p && !p.hidden && p.getBoundingClientRect().height > 0, naLinhaDaData: !!s && !!s.closest('.cel-semana-topo'), rotulo: s ? s.getAttribute('aria-label') : '' };
});
const abrirPainel = async pag => { if ((await selinho(pag)).expandido !== 'true') await clicar(pag, '#cel-avisos-selo'); await pausa(80); };
const fecharPainel = async pag => { if ((await selinho(pag)).expandido === 'true') await clicar(pag, '#cel-avisos-selo'); await pausa(80); };
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
    pequenos, soltos, acoes: Array.from(raiz.querySelectorAll('[data-acao-celular]')).filter(visivel).length
  };
}, RE_EDICAO);
const telaBoa = m => m.pequenos.join('; ') + (m.rolaDeLado ? ' ROLA DE LADO' : '');
/* A agenda na primeira tela: o espaço entre o pé da faixa presa (com os
 * avisos) e o pé da área que rola, se o bloco marcado (Próxima) cabe
 * inteiro nele e se a linha de agora está à vista. */
const leiaute = pag => pag.evaluate(() => {
  const c = document.querySelector('#cel-conteudo').getBoundingClientRect();
  const f = document.querySelector('#cel-semana').getBoundingClientRect();
  const b = document.querySelector('#cel-tempo .cel-bloco-proxima') || document.querySelector('#cel-tempo .cel-bloco');
  const r = b ? b.getBoundingClientRect() : null;
  const ag = document.querySelector('#cel-agora'), ra = ag ? ag.getBoundingClientRect() : null;
  return { livre: Math.round(c.bottom - f.bottom), alvoInteiro: !!r && r.top >= f.bottom - 1 && r.bottom <= c.bottom + 1, alvo: b ? b.dataset.aula : '',
    agoraAVista: !!ra && ra.top >= f.bottom - 1 && ra.top <= c.bottom + 1, agora: ag ? ag.textContent : '',
    // o começo do bloco (a marca Próxima e o nome) à vista
    comecoAVista: !!r && r.top >= f.bottom - 1 && r.top + 48 <= c.bottom + 1,
    janela: window.innerWidth + 'x' + window.innerHeight };
});
/* A mensagem que o link de cobrar leva, decodificada. */
const mensagemDoLink = href => { const i = String(href || '').indexOf('?text='); return i < 0 ? '' : decodeURIComponent(href.slice(i + 6)).replace(/\u00a0/g, ' '); };
const fmt = s => String(s || '').replace(/\u00a0/g, ' ');
const WA_ALFA = '5511987654321';
const REG = '#cel-avisos .cel-aviso-registrar';
/* O painel aberto: os alvos (altura e largura), o texto que transborda, e,
 * rolando a lista até o fim, se o último aviso aparece inteiro. */
const medePainel = pag => pag.evaluate(() => {
  const p = document.querySelector('#cel-avisos'), lista = p.querySelector('.cel-avisos-lista');
  const alvos = Array.from(p.querySelectorAll('button, a[href]')).filter(e => e.getBoundingClientRect().height > 0);
  const pequenos = alvos.filter(e => { const r = e.getBoundingClientRect(); return r.height < 47.5 || r.width < 47.5; })
    .map(e => (e.id || e.className) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
  const transborda = alvos.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.id || e.textContent.trim());
  lista.scrollTop = lista.scrollHeight;
  const trilhos = lista.querySelectorAll('.cel-aviso-trilho');
  const ultima = trilhos[trilhos.length - 1].getBoundingClientRect(), rl = lista.getBoundingClientRect(), rp = p.getBoundingClientRect();
  const abas = document.querySelector('#cel-abas').getBoundingClientRect();
  const r = { alvos: alvos.length, avisos: trilhos.length, pequenos, transborda, ultimaInteira: ultima.bottom <= rl.bottom + 1 && ultima.top >= rl.top - 1,
    painelAcimaDasAbas: rp.bottom <= abas.top + 1 };
  lista.scrollTop = 0;
  return r;
});

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
  conf('dois avisos, na ordem: sem registro, cobrar; a próxima não se repete nos avisos (' + tipos(av) + ')', tipos(av), 'registrar,cobrar');
  conf('a próxima é só o selo PRÓXIMA do bloco, na agenda: um só na tela', await pagC.evaluate(() =>
    document.querySelectorAll('#cel-hoje .cel-bloco-marca').length + ' ' + (document.querySelector('#cel-tempo .cel-bloco-proxima .cel-bloco-marca') || {}).textContent + ' ' +
    /Próxima/.test((document.querySelector('#cel-avisos') || {}).textContent || '') + ' ' + /próxima/i.test(document.querySelector('#cel-avisos-selo').getAttribute('aria-label'))), '1 Próxima false false');
  conf('é a aula seguinte de hoje, a das 15:30 do Alfa', await pagC.evaluate(() => (document.querySelector('#cel-tempo .cel-bloco-proxima') || { dataset: {} }).dataset.aula), 'alfa-1006');
  const reg = av.find(a => a.tipo === 'registrar') || {};
  prop('sem registro: a aula do Alfa de ontem; a do Gama de hoje (com relato), a de ontem (com nota só minha), a falta e a cancelada ficam fora (' + reg.texto + ' ; ' + reg.aula + ')',
    reg.texto === '1 aula sem registro | Aluno Alfa Teste, seg 05/10, 10:00' && reg.aula === 'alfa-1005', V_REGISTRADA);
  seVeneno(V_REGISTRADA);
  conf('o aviso de registrar é uma ação do celular da dona', reg.acao, 'registrar-como-foi');
  const cob = av.find(a => a.tipo === 'cobrar') || {};
  const seloJulho = await pagC.evaluate(() => Store.carregar().then(d => { const s = Core.seloDoPagamento(d, Core.calcularFechamento(d, 'alfa', '2026-07', '2026-10-06'));
    return { selo: s.selo, falta: s.falta, texto: Core.fmtMoeda(s.falta).replace(/\u00a0/g, ' ') }; }));
  const msg = mensagemDoLink(cob.link);
  console.log('   selo de julho do Alfa: ' + JSON.stringify(seloJulho) + ' ; mensagem: ' + msg);
  conf('(arranjo) o selo de julho do Alfa é parcial, faltam R$ 150,00', seloJulho.selo + ' ' + seloJulho.texto, 'parcial R$ 150,00');
  prop('o aviso de cobrar: o Alfa (julho, o que espera há mais tempo) com o que falta pelo selo, e mais uma família (' + cob.texto + ')',
    cob.texto === 'Em aberto: Aluno Alfa Teste | julho de 2026, ' + seloJulho.texto && cob.aluno === 'alfa', V_VALOR);
  conf('o botão diz quem ele cobra ("Cobrar" e o nome curto que separa o Alfa dos outros alunos), e as outras famílias ficam num toque à parte',
    cob.rotuloLink + ' | ' + cob.mais, 'Cobrar Aluno Alfa | E mais 1 família');
  conf('cada linha leva a ação dela embaixo do texto', av.map(a => a.seta).join(' | '), 'Registrar | Cobrar Aluno Alfa');
  prop('o link abre o WhatsApp do Alfa com o texto escrito: o mês e o valor do selo, sem nome nenhum (' + msg + ')',
    cob.link.indexOf('https://wa.me/' + WA_ALFA + '?text=') === 0 &&
    msg === 'Olá! Tudo bem? Passando para lembrar do pagamento das aulas de julho de 2026: ficou faltando ' + seloJulho.texto + '. Obrigada!' &&
    !/Aluno|Alfa|Beta|Gama|Respons/.test(msg), V_VALOR);
  seVeneno(V_VALOR);
  conf('nada foi a wa.me sem toque', pagC.paraFora.length, 0);
  const sel4 = await selinho(pagC);
  prop('recolhidos por padrão: o selinho "2" (uma linha por tipo: a sem registro e a cobrança), o painel fechado (' + JSON.stringify(sel4) + ')',
    sel4.existe && sel4.numero === '2' && sel4.expandido === 'false' && !sel4.painelVisivel, [V_ABERTA, V_EMPILHADOS, V_TOPO]);
  seVeneno(V_ABERTA);
  let m = await medirTela(pagC);
  conf('Hoje recolhido: alvos de 48 px e sem rolagem de lado', telaBoa(m), '');
  await abrirPainel(pagC);
  m = await medirTela(pagC);
  conf('Hoje com o painel aberto (3 avisos): alvos de 48 px e sem rolagem de lado', telaBoa(m), '');
  conf('Hoje com o painel aberto: nenhum botão de edição fora das ações do celular (' + (m.soltos.join(', ') || 'nenhum') + ')', m.soltos.join(', '), '');
  await fecharPainel(pagC);
  const lay = await leiaute(pagC);
  console.log('   ' + JSON.stringify(lay));
  prop('a agenda continua na primeira tela: a linha de agora (14:50) e, abaixo dela, o começo do bloco da Próxima (a marca e o nome), com 200 px ou mais de agenda à vista (' + lay.livre + ' px)',
    lay.agoraAVista && lay.agora === '14:50' && lay.comecoAVista && lay.alvo === 'alfa-1006' && lay.livre >= 200, V_EMPILHADOS);
  await tirarPrint(pagC, '2_tres_avisos_dia_6.png');
  conf('tocar no bloco da Próxima abre a folha daquela aula', await clicar(pagC, '#cel-tempo .cel-bloco-proxima') && await existe(pagC, '#cel-folha[data-aula="alfa-1006"]'), true);
  await clicar(pagC, '#cel-folha-fechar');
  conf('tocar no aviso de cobrar leva ao Fechamento de julho', (await clicar(pagC, '#cel-aviso-cobranca')) + ' ' + (await pagC.evaluate(() => !!document.querySelector('#cel-fechamento.ativa'))) + ' ' +
    (await texto(pagC, '#cel-fechamento .cel-mes .cel-titulo')), 'true true Julho de 2026');
  av = await momento(pagC, '2026-10-06', '14:50');
  conf('o "E mais 1 família" leva ao Fechamento de agosto, o do Beta', (await clicar(pagC, '#cel-aviso-mais-familias')) + ' ' +
    (await texto(pagC, '#cel-fechamento .cel-mes .cel-titulo')), 'true Agosto de 2026');
  av = await momento(pagC, '2026-10-06', '14:50');

  secao('5. Dia 5, 14:50: sem cobrança');
  av = await momento(pagC, '2026-10-05', '14:50');
  console.log('   ' + JSON.stringify(av));
  prop('no dia 5 não há aviso de cobrar, nem link de WhatsApp no alto (' + tipos(av) + ')', tipos(av) === 'registrar' && av.every(a => !a.link), V_DIA5);
  seVeneno(V_DIA5);
  conf('dia 5: a aula do Alfa das 10:00 (a Próxima, Gama às 16:00, é o selo do bloco)', textos(av) + ' | ' +
    (await pagC.evaluate(() => (document.querySelector('#cel-tempo .cel-bloco-proxima') || { dataset: {} }).dataset.aula)),
    '1 aula sem registro | Aluno Alfa Teste, hoje, 10:00 | gama-1005');
  await tirarPrint(pagC, '3_dia_5_sem_cobrar.png');

  secao('6. Dia 3, 20:00: nenhum aviso');
  av = await momento(pagC, '2026-10-03', '20:00');
  conf('sem próxima, sem aula sem registro, sem mês a fechar (setembro sem aula) e antes do dia 6: nenhum aviso (' + tipos(av) + ')', av.length + ' ' + (await existe(pagC, '#cel-avisos')), '0 false');
  await tirarPrint(pagC, '1_sem_aviso.png');

  secao('7. O fim do mês, a virada e o máximo de 3');
  const janela = {};
  /* 29/10 duas vezes: ao meio-dia há os quatro avisos (o máximo de 3), e
   * às 18:00, sem próxima, o lembrete aparece no primeiro dia da janela. */
  for (const [iso, hhmm, chave] of [['2026-10-28', '12:00'], ['2026-10-29', '12:00'], ['2026-10-29', '18:00', '2026-10-29 18h'], ['2026-10-31', '12:00'],
    ['2026-11-01', '09:00'], ['2026-11-05', '09:00'], ['2026-11-06', '09:00']]) {
    janela[chave || iso] = await momento(pagC, iso, hhmm);
    console.log('   ' + (chave || iso) + ' ' + JSON.stringify(janela[chave || iso].map(a => a.tipo + ': ' + a.texto)));
  }
  const fechar = iso => (janela[iso].find(a => a.tipo === 'fechar') || {});
  prop('28/10 (o 4º dia antes do fim) e 06/11 (o 6º do mês seguinte): sem lembrete de fechar (' + tipos(janela['2026-10-28']) + ' ; ' + tipos(janela['2026-11-06']) + ')',
    !fechar('2026-10-28').tipo && !fechar('2026-11-06').tipo, V_JANELA);
  seVeneno(V_JANELA);
  conf('29/10, 31/10, 01/11 e 05/11: o lembrete de fechar outubro (' + ['2026-10-29 18h', '2026-10-31', '2026-11-01', '2026-11-05'].map(d => fechar(d).mes || '-').join(',') + ')',
    ['2026-10-29 18h', '2026-10-31', '2026-11-01', '2026-11-05'].map(d => fechar(d).mes || '-').join(','), '2026-10,2026-10,2026-10,2026-10');
  conf('29/10 às 18:00: "Fechar outubro de 2026", "4 aulas sem registro e 3 famílias em aberto", com a ação "Abrir"', fechar('2026-10-29 18h').texto + ' | ' + fechar('2026-10-29 18h').seta,
    'Fechar outubro de 2026 | 4 aulas sem registro e 3 famílias em aberto | Abrir');
  conf('31/10: a ordem é falta registrar, cobrar (o que já venceu) e fechar', tipos(janela['2026-10-31']), 'registrar,cobrar,fechar');
  conf('05/11: o mesmo outubro, com as 4 aulas sem registro', fechar('2026-11-05').texto, 'Fechar outubro de 2026 | 4 aulas sem registro e 3 famílias em aberto');
  /* (compactos) Sem o corte em 3: recolhidos, os quatro cabem no selinho. */
  conf('29/10 ao meio-dia: os três avisos, na ordem de urgência (' + tipos(janela['2026-10-29']) + ')', tipos(janela['2026-10-29']), 'registrar,cobrar,fechar');
  conf('29/10: a aula do Gama de terça', textos(janela['2026-10-29'].slice(0, 1)), '1 aula sem registro | Aluno Gama Teste, ter 27/10, 10:00');
  conf('31/10: as duas sem registro, da mais recente para a mais antiga', (janela['2026-10-31'].find(a => a.tipo === 'registrar') || {}).texto,
    '2 aulas sem registro | Aluno Alfa Teste, qui 29/10, 16:00 ; Aluno Gama Teste, ter 27/10, 10:00');
  conf('01/11 a 05/11: sem cobrança (antes do dia 6), e em 06/11 ela volta', ['2026-11-01', '2026-11-05', '2026-11-06'].map(d => janela[d].some(a => a.tipo === 'cobrar')).join(','), 'false,false,true');
  const cob6 = janela['2026-11-06'].find(a => a.tipo === 'cobrar') || {};
  const selos6 = await pagC.evaluate(() => Store.carregar().then(d => ['2026-07', '2026-10'].map(mes => Core.seloDoPagamento(d, Core.calcularFechamento(d, 'alfa', mes, '2026-11-06')).falta)));
  const msg6 = mensagemDoLink(cob6.link);
  console.log('   selos do Alfa em 06/11: ' + JSON.stringify(selos6) + ' ; ' + msg6);
  conf('(arranjo) os selos do Alfa em 06/11: julho faltam 150, outubro 300', selos6.join(','), '150,300');
  prop('06/11: o Alfa com julho e outubro, R$ 450,00 (a soma do que falta pelos selos), e mais 2 famílias (' + cob6.texto + ')',
    cob6.texto + ' | ' + cob6.mais === 'Em aberto: Aluno Alfa Teste | julho de 2026 e outubro de 2026, R$ 450,00 | E mais 2 famílias', V_VALOR);
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
    tipos(avD) === 'registrar' && !(await existe(pagD, '#cel-aviso-cobrar')) && !(await pagD.evaluate(() => /wa\.me/.test((document.querySelector('#cel-avisos') || {}).innerHTML || ''))), V_OBS);
  const avD29 = await momento(pagD, '2026-10-29', '12:00');
  prop('nem o mês a fechar, que é dela (29/10: ' + tipos(avD29) + ')', tipos(avD29) === 'registrar', V_OBS);
  seVeneno(V_OBS);
  await momento(pagD, '2026-10-06', '14:50');
  conf('o observador lê a aula sem registro, com "Ver a aula" e sem ação que grava', textos(avD) + ' | ' + avD.map(a => a.seta + '/' + a.acao).join(''),
    '1 aula sem registro | Aluno Alfa Teste, seg 05/10, 10:00 | Ver a aula/');
  await abrirPainel(pagD);
  m = await medirTela(pagD);
  conf('o observador, Hoje com avisos: alvos de 48 px, sem rolagem de lado, nenhum botão de edição nem ação (' + m.soltos.join(', ') + ' ; ' + m.acoes + ')',
    telaBoa(m) + '|' + m.soltos.join(', ') + '|' + m.acoes, '||0');
  await tirarPrint(pagD, '4_observador.png');
  await fecharPainel(pagD);
  conf('o toque do observador no aviso abre a folha da aula, só de leitura', (await clicar(pagD, '#cel-aviso-registrar')) + ' ' +
    (await existe(pagD, '#cel-folha[data-aula="alfa-1005"]')) + ' ' + (await pagD.evaluate(() => document.querySelectorAll('#cel-folha [data-acao-celular]').length)), 'true true 0');
  await clicar(pagD, '#cel-folha-fechar');
  await pausa(2500);
  conf('nenhuma escrita na nuvem saiu do observador', pagD.commitsNaRede, 0);
  /* (revisão) O observador sai da conta: a cópia da dona fica no aparelho,
   * e nada do que é dela abre por isso. */
  await aba(pagD, 'ajustes');
  conf('(arranjo) o observador toca em Sair, nos Ajustes dele', await clicar(pagD, '#cel-obs-sair'), true);
  const saiu = await esperar('a conta saiu', () => pagD.evaluate(() => !Nuvem.estado().entrada), v => v === true, 10000);
  conf('(arranjo) sem conta, e com os dados da dona ainda no aparelho', saiu.ok + ' ' + (await pagD.evaluate(() => Store.carregar().then(d => d.alunos.some(a => a.id === 'alfa')))), 'true true');
  const sai6 = await momento(pagD, '2026-10-06', '14:50'), sai29 = await momento(pagD, '2026-10-29', '18:00');
  const sai29Acoes = await pagD.evaluate(() => document.querySelectorAll('#cel-hoje [data-acao-celular]').length);
  console.log('   depois de sair: ' + JSON.stringify(sai6.map(a => a.tipo)) + ' ; 29/10 18h: ' + JSON.stringify(sai29.map(a => a.tipo + ': ' + a.texto)));
  prop('depois de sair, nem cobrar nem fechar o mês, e nenhum link de WhatsApp no alto (' + tipos(sai6) + ' ; ' + tipos(sai29) + ')',
    tipos(sai6) === 'registrar' && tipos(sai29) === 'registrar' && !(await pagD.evaluate(() => /wa\.me/.test((document.querySelector('#cel-avisos') || {}).innerHTML || ''))), V_SAIR);
  seVeneno(V_SAIR);
  await aba(pagD, 'fechamento');
  const pagarDepois = await pagD.evaluate(() => document.querySelectorAll('#cel-fechamento .btn-marcar-pago, #cel-fechamento .btn-alterar-pagamento, #cel-fechamento .btn-desmarcar-pagamento, #cel-fechamento [data-acao-celular]').length);
  conf('e as ações que gravam (pago, cancelar, remarcar, registrar) continuam fechadas: nenhuma ação no Hoje nem no Fechamento (' + sai29Acoes + ' ; ' + pagarDepois + ')',
    sai29Acoes + ' ' + pagarDepois, '0 0');
  await aba(pagD, 'hoje');

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
    !cobT.link && !(await existe(pagC, '#cel-aviso-cobrar')) && cobT.texto === 'Em aberto: Aluno Alfa Teste | julho de 2026, R$ 150,00. Sem celular na ficha para o WhatsApp', V_TELEFONE);
  seVeneno(V_TELEFONE);

  secao('10. O toque em "falta registrar" abre o registro daquela aula, e salvar tira o aviso');
  conf('o toque abre o "Registrar como foi" da aula do Alfa de ontem', (await clicar(pagC, '#cel-aviso-registrar')) + ' ' + (await existe(pagC, '#cel-relato-texto')) + ' ' +
    (await pagC.evaluate(() => (document.querySelector('#cel-hoje h2.cel-titulo + .ajuda') || {}).textContent)), 'true true Aluno Alfa Teste, 05/10/2026, 10:00');
  await digitar(pagC, '#cel-relato-texto', 'Frações equivalentes, de teste.');
  await clicar(pagC, '#cel-relato-salvar');
  const salvou = await esperar('o relato gravou', () => pagC.evaluate(() => Store.carregar().then(d => d.aulas.find(a => a.id === 'alfa-1005').notaTexto)), v => v === 'Frações equivalentes, de teste.', 10000);
  conf('o relato gravou na aula', salvou.ok, true);
  const avR = await momento(pagC, '2026-10-06', '14:50');
  conf('registrada, a aula sai dos avisos (' + tipos(avR) + ')', tipos(avR), 'cobrar');

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

  secao('11b. (revisão) O lembrete conta a família em aberto só a partir do corte dos pagamentos');
  const antesCorte = await momento(pagC, '2026-11-01', '09:00');
  conf('(controle) 01/11, com o corte em junho: outubro tem 3 aulas sem registro e 3 famílias em aberto', (antesCorte.find(a => a.tipo === 'fechar') || {}).texto,
    'Fechar outubro de 2026 | 3 aulas sem registro e 3 famílias em aberto');
  await soltarRelogio(pagC);
  await pagA.evaluate(() => Store.carregar().then(d => { d.ajustes.pagamentosDesde = '2026-11'; return Store.salvar(d); }));
  const sA3 = await sincronizar(pagA);
  conf('o tablet subiu o corte novo', sA3.erroE === null && sA3.enviados > 0, true);
  await pagC.evaluate(() => Nuvem.receberRegistros());
  const corteChegou = await esperar('o corte chegou ao celular', () => pagC.evaluate(() => Store.carregar().then(d => d.ajustes.pagamentosDesde)), v => v === '2026-11', 15000);
  conf('(arranjo) o corte de novembro chegou ao celular', corteChegou.ok, true);
  const depoisCorte = await momento(pagC, '2026-11-01', '09:00');
  conf('com o corte em novembro, outubro não conta família em aberto, como a lista de pendentes', (depoisCorte.find(a => a.tipo === 'fechar') || {}).texto,
    'Fechar outubro de 2026 | 3 aulas sem registro');

  secao('13. (compactos) Todos os avisos em 390 x 844: o selinho, o painel, o ponto na agenda e o dispensar');
  /* O dia com TODOS os avisos: 29/10 ao meio-dia, no fim do mês (fechar
   * outubro) e depois do dia 6 (cobrar): a próxima (Alfa, 16:00), 4 aulas
   * da manhã sem registro, uma das 11:00 registrada (não pode ter o ponto),
   * o Alfa e o Beta a cobrar e outubro a fechar. O que as seções de cima
   * mudaram (o telefone, o corte) volta ao que era, pela fila, do tablet. */
  await soltarRelogio(pagC);
  await pagA.evaluate(() => Store.carregar().then(d => {
    const a = d.alunos.find(x => x.id === 'alfa'); a.telefone = '(11) 98765-4321'; a.obs = '';
    d.ajustes.pagamentosDesde = '2026-06';
    d.aulas.find(x => x.id === 'gama-1027').notaTexto = 'Relato de teste.';
    const nova = (id, alunoId, hora, extra) => Object.assign({ id, alunoId, serieId: null, data: '2026-10-29', hora, duracaoMin: 60, status: 'realizada',
      cobravel: true, notaTexto: '', anexos: [] }, extra || {});
    d.aulas.push(nova('alfa-1029a', 'alfa', '07:00'), nova('beta-1029', 'beta', '08:00'), nova('gama-1029', 'gama', '09:00'), nova('alfa-1029b', 'alfa', '10:00'),
      nova('gama-1029r', 'gama', '11:00', { notaTexto: 'Relato de teste.' }));
    return Store.salvar(d);
  }));
  const sA4 = await sincronizar(pagA);
  conf('(arranjo) o tablet subiu as aulas de 29/10, o telefone e o corte', sA4.erroE === null && sA4.enviados > 0, true);
  await pagC.evaluate(() => Nuvem.receberRegistros());
  const cenaChegou = await esperar('a cena chegou ao celular', () => pagC.evaluate(() => Store.carregar().then(d =>
    d.aulas.some(a => a.id === 'gama-1029r') && d.ajustes.pagamentosDesde === '2026-06' && d.alunos.find(x => x.id === 'alfa').telefone === '(11) 98765-4321')), v => v === true, 15000);
  conf('(arranjo) a cena chegou ao celular', cenaChegou.ok, true);
  await pagC.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  await pagC.evaluate(() => { try { localStorage.removeItem('apoio-educacional:celular-avisos'); } catch (e) { /* ok */ } });
  const CENA = ['2026-10-29', '12:00'];
  const SEM_REGISTRO = ['alfa-1029b', 'gama-1029', 'beta-1029', 'alfa-1029a'];
  let avC = await momento(pagC, ...CENA);
  console.log('   ' + JSON.stringify(avC.map(a => a.tipo + ': ' + a.texto)));
  conf('(arranjo) 390 x 844, e os três tipos de aviso valem juntos, com a Próxima no bloco (' + tipos(avC) + ')', (await leiaute(pagC)).janela + ' ' + tipos(avC), '390x844 registrar,cobrar,fechar');
  let sel = await selinho(pagC);
  console.log('   selinho: ' + JSON.stringify(sel));
  prop('recolhidos por padrão: só o selinho, com o número 3 (uma linha por tipo: sem registro, cobrar e o mês), na linha da data, e o painel fechado',
    sel.existe && sel.numero === '3' && sel.expandido === 'false' && !sel.painelVisivel && sel.naLinhaDaData, [V_EMPILHADOS, V_EMPURRA, V_TOPO]);
  prop('o selinho diz a quem lê a tela o que há (' + sel.rotulo + ')', sel.rotulo === '3 avisos de hoje: 4 sem registro, 2 a cobrar, fechar outubro de 2026. Toque para ver', V_EMPILHADOS);
  const empurra = await pagC.evaluate(() => {
    const f = document.querySelector('#cel-semana'), s = document.querySelector('#cel-avisos-selo');
    const com = f.getBoundingClientRect().height;
    if (!s) return { com: Math.round(com), sem: Math.round(com) };
    const pai = s.parentNode, prox = s.nextSibling;
    pai.removeChild(s);
    const sem = f.getBoundingClientRect().height;
    pai.insertBefore(s, prox);
    return { com: Math.round(com), sem: Math.round(sem) };
  });
  prop('o recolhido não empurra a agenda: a faixa da semana tem a mesma altura com e sem o selinho (' + empurra.com + ' e ' + empurra.sem + ' px)', empurra.com === empurra.sem, V_EMPURRA);
  seVeneno(V_EMPURRA);
  const topoDaAgenda = () => pagC.evaluate(() => {
    const f = document.querySelector('#cel-semana').getBoundingClientRect();
    const l = Array.from(document.querySelectorAll('#cel-tempo .cel-tempo-linha')).find(x => x.getBoundingClientRect().bottom > f.bottom + 1);
    return l ? Math.round(Math.max(l.getBoundingClientRect().top, f.bottom)) : 9999;
  });
  const topoFechado = await topoDaAgenda();
  prop('recolhido, o topo da agenda (a primeira linha de hora à vista) fica a no máximo 422 px do alto (' + topoFechado + ' px)', topoFechado <= 422, V_EMPILHADOS);
  seVeneno(V_EMPILHADOS);
  /* O topo fixo (a barra do aplicativo e o que fica preso com ela) em no
   * máximo 20% da altura, em 360 x 780, 390 x 844 e 412 x 915, com a letra
   * normal e a 130% (a raiz em rem cresce com a preferência do aparelho).
   * Medido com a agenda rolada até
   * agora, que é quando o preso está preso. */
  const LETRA_130 = 'html{font-size:130%} body{font-size:20.8px}';
  const tetos = [];
  for (const [w, h] of [[360, 780], [390, 844], [412, 915]]) {
    for (const letra of ['100%', '130%']) {
      await pagC.setViewport({ width: w, height: h, hasTouch: true, isMobile: true });
      await pagC.evaluate((css) => { const v = document.querySelector('#prova-letra'); if (v) v.remove();
        if (css) { const s = document.createElement('style'); s.id = 'prova-letra'; s.textContent = css; document.head.appendChild(s); } }, letra === '130%' ? LETRA_130 : '');
      await momento(pagC, ...CENA);
      const t = await pagC.evaluate(() => { const f = document.querySelector('#cel-semana').getBoundingClientRect(), c = document.querySelector('#cel-conteudo');
        const dias = document.querySelectorAll('#cel-semana-dias .cel-semana-dia').length;
        const horas = Array.from(document.querySelectorAll('#cel-tempo .cel-tempo-grade-hora'));
        const h7 = horas.find(x => x.textContent === '07:00'), h8 = horas.find(x => x.textContent === '08:00'), h20 = horas.find(x => x.textContent === '20:00');
        const grade = document.querySelector('#cel-tempo'), g = grade.getBoundingClientRect(), anterior = c.scrollTop;
        c.scrollTop = 0;
        const gradeNoTopo = grade.getBoundingClientRect(), nav = document.querySelector('#cel-abas').getBoundingClientRect();
        const gradeFits = gradeNoTopo.top >= f.bottom - 1 && gradeNoTopo.bottom <= nav.top + 1;
        c.scrollTop = anterior;
        return { preso: Math.round(f.bottom), rolagem: Math.round(anterior), dias, gradeFits, bounds: [gradeNoTopo.top, gradeNoTopo.bottom, f.bottom, nav.top].map(Math.round).join('/'), raiz: getComputedStyle(document.documentElement).fontSize,
          escala: h7 && h8 && h20 ? Math.round(h8.getBoundingClientRect().top - h7.getBoundingClientRect().top) : 0,
          horas: [h7 && h7.textContent, h20 && h20.textContent],
          rolaDeLado: document.documentElement.scrollWidth > innerWidth || c.scrollWidth > c.clientWidth }; });
      const sl = await selinho(pagC);
      tetos.push({ tela: w + 'x' + h, letra, preso: t.preso, pct: Math.round(t.preso / h * 1000) / 10, rolagem: t.rolagem,
        dias: t.dias, escala: t.escala, horas: t.horas, gradeFits: t.gradeFits, bounds: t.bounds, raiz: t.raiz, rolaDeLado: t.rolaDeLado, selo: sl.numero, aberto: sl.painelVisivel });
    }
  }
  await pagC.evaluate(() => { const v = document.querySelector('#prova-letra'); if (v) v.remove(); });
  await pagC.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  tetos.forEach(t => console.log('   topo fixo ' + t.tela + ' letra ' + t.letra + ': ' + t.preso + ' px, ' + t.pct + '% (rolagem ' + t.rolagem + ', escala ' + t.escala + ' px/h, raiz ' + t.raiz + ', grade inteira visível sem rolar ' + t.gradeFits + ', bordas ' + t.bounds + ', selinho ' + t.selo + ')'));
  conf('(arranjo) as seis medidas rolam para a linha de agora e mantêm o selinho com os 3', tetos.every(t => t.rolagem > 0 && t.selo === '3'), true);
  prop('o topo fixo fica em no máximo 20% da altura nas três telas, com a letra normal e a 130% (' + tetos.map(t => t.tela + '/' + t.letra + ' ' + t.pct + '%').join(', ') + ')',
    tetos.every(t => t.pct <= 20), V_TOPO);
  conf('a semana mantém os sete dias e a grade mostra a escala horária de 07:00 a 20:00 nas seis combinações de tela e fonte',
    tetos.every(t => t.dias === 7 && t.escala === Math.round(52 * (t.letra === '130%' ? 1.3 : 1)) && t.horas[0] === '07:00' && t.horas[1] === '20:00'), true);
  conf('a grade inteira cabe sem rolar a 412 x 915 com a letra normal',
    tetos.find(t => t.tela === '412x915' && t.letra === '100%').gradeFits, true);
  seVeneno(V_TOPO);
  conf('nas seis, nada rola de lado', tetos.filter(t => t.rolaDeLado).map(t => t.tela + '/' + t.letra).join(','), '');
  /* Com a letra a 130% num celular de 360 x 780: o painel aberto, o terceiro
   * aviso inteiro ao rolar o painel, e nenhum botão cortado ou pequeno. */
  await pagC.setViewport({ width: 360, height: 780, hasTouch: true, isMobile: true });
  await pagC.evaluate((css) => { const s = document.createElement('style'); s.id = 'prova-letra'; s.textContent = css; document.head.appendChild(s); }, LETRA_130);
  await momento(pagC, ...CENA);
  await abrirPainel(pagC);
  const painel130 = await medePainel(pagC);
  console.log('   painel em 360 x 780, letra 130%: ' + JSON.stringify(painel130));
  conf('a 130% em 360 x 780: o terceiro aviso aparece inteiro rolando o painel, o painel para acima das abas, e todo botão tem 48 px e não transborda (' +
    painel130.pequenos.join(', ') + ' ; ' + painel130.transborda.join(', ') + ')',
    painel130.ultimaInteira && painel130.painelAcimaDasAbas && painel130.avisos === 3 && !painel130.pequenos.length && !painel130.transborda.length, true);
  await fecharPainel(pagC);
  await pagC.evaluate(() => { const v = document.querySelector('#prova-letra'); if (v) v.remove(); });
  await pagC.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  avC = await momento(pagC, ...CENA);
  const lay13 = await leiaute(pagC);
  conf('a linha de agora (12:00) continua à vista', lay13.agoraAVista && lay13.agora === '12:00', true);
  m = await medirTela(pagC);
  conf('recolhido: alvos de 48 px (o selinho também) e sem rolagem de lado', telaBoa(m), '');
  await tirarPrint(pagC, '5_compacto_recolhido.png');

  /* O ponto no bloco: as mesmas aulas da lista, e só elas. */
  const marcadas = () => pagC.evaluate(() => Array.from(document.querySelectorAll('#cel-tempo .cel-bloco.sem-registro')).map(b => b.dataset.aula).sort().join(','));
  const marcas13 = await marcadas();
  const lista13 = (avC.find(a => a.tipo === 'registrar') || { aulas: [] }).aulas;
  const doDia = await pagC.evaluate(ids => ids.filter(id => (document.querySelector('#cel-tempo .cel-bloco[data-aula="' + id + '"]') || null) !== null).sort().join(','), lista13);
  console.log('   pontos: ' + marcas13 + ' ; lista: ' + lista13.join(','));
  prop('nenhuma aula registrada ganha o ponto (a das 11:00, com relato, sem ponto)', marcas13.split(',').indexOf('gama-1029r') < 0, V_MARCA_REG);
  prop('o ponto no bloco está nas mesmas aulas da lista que são deste dia, e só nelas (' + marcas13 + ' ; ' + doDia + ')', marcas13 === doDia && doDia === SEM_REGISTRO.slice().sort().join(','),
    [V_MARCA_REG, V_DISCORDA]);
  seVeneno([V_MARCA_REG, V_DISCORDA]);
  conf('o bloco marcado diz "sem registro de como foi" a quem lê a tela', await pagC.evaluate(() =>
    Array.from(document.querySelectorAll('#cel-tempo .cel-bloco.sem-registro')).every(b => /, sem registro de como foi$/.test(b.getAttribute('aria-label')))), true);

  /* O toque de verdade (touch, pelo CDP), com a emulação de celular ligada. */
  const cdp = await pagC.createCDPSession();
  const centro = (pag, s) => pag.evaluate(sel => {
    const e = document.querySelector(sel);
    if (!e) return null;
    const p = e.closest('#cel-avisos');
    if (p) { const rp = p.getBoundingClientRect(), r = e.getBoundingClientRect(); if (r.top < rp.top || r.bottom > rp.bottom) p.scrollTop += r.top - rp.top; }
    const r = e.getBoundingClientRect();
    return { x: Math.round(r.left + Math.min(r.width / 2, 120)), y: Math.round(r.top + r.height / 2) };
  }, s);
  const tocar = async (pag, sessao, s) => {
    const c = await centro(pag, s);
    if (!c) return false;
    await sessao.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: c.x, y: c.y }] });
    await pausa(60);
    await sessao.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await pausa(250);
    return true;
  };
  const deslizar = async (pag, sessao, s, dx, dy) => {
    const c = await centro(pag, s);
    if (!c) return false;
    await sessao.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: c.x, y: c.y }] });
    for (let i = 1; i <= 10; i++) {
      await sessao.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: c.x + Math.round(dx * i / 10), y: c.y + Math.round(dy * i / 10) }] });
      await pausa(16);
    }
    await sessao.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await pausa(300);
    return true;
  };
  const posicao = () => pagC.evaluate(() => ({ rolagem: Math.round(document.querySelector('#cel-conteudo').scrollTop),
    bloco: Math.round(document.querySelector('#cel-tempo .cel-bloco[data-aula="alfa-1029"]').getBoundingClientRect().top) }));
  const antesDeAbrir = await posicao();
  conf('o toque no selinho abre o painel', (await tocar(pagC, cdp, '#cel-avisos-selo')) + ' ' + (await selinho(pagC)).painelVisivel, 'true true');
  avC = await avisos(pagC);
  const reg13 = avC.find(a => a.tipo === 'registrar') || { aulas: [] };
  prop('o painel junta as 4 aulas sem registro num aviso, uma por linha, da mais recente para a mais antiga, com aluno, dia e hora (' + reg13.texto + ')',
    reg13.aulas.join(',') === SEM_REGISTRO.join(',') &&
    reg13.texto === '4 aulas sem registro | Aluno Alfa Teste, hoje, 10:00 ; Aluno Gama Teste, hoje, 09:00 ; Aluno Beta Teste, hoje, 08:00 ; Aluno Alfa Teste, hoje, 07:00' &&
    reg13.chaves === SEM_REGISTRO.map(id => 'registrar:' + id).join(' '),
    V_REGISTRADA);
  seVeneno(V_REGISTRADA);
  const cob13 = avC.find(a => a.tipo === 'cobrar') || {};
  conf('no painel, o botão de cobrar diz quem cobra, e o mês a fechar está lá', cob13.rotuloLink + ' | ' + cob13.mais + ' | ' + (avC.find(a => a.tipo === 'fechar') || {}).mes,
    'Cobrar Aluno Alfa | E mais 1 família | 2026-10');
  const topoAberto = await topoDaAgenda();
  conf('aberto, o painel para antes da metade: o topo da agenda a no máximo 422 px (' + topoAberto + ' px)', topoAberto <= 422, true);
  m = await medirTela(pagC);
  conf('painel aberto: alvos de 48 px, sem rolagem de lado e nenhum botão de edição solto', telaBoa(m) + '|' + m.soltos.join(', '), '|');
  const painel390 = await medePainel(pagC);
  console.log('   painel em 390 x 844: ' + JSON.stringify(painel390));
  conf('painel aberto em 390 x 844: todo botão e link do painel com 48 px ou mais de altura e de largura, e nenhum texto transbordando (' + painel390.alvos + ' alvos; ' + painel390.pequenos.join(', ') + ')',
    painel390.alvos >= 8 && !painel390.pequenos.length && !painel390.transborda.length, true);
  conf('o ✕ diz "Dispensar até amanhã" (rótulo e title), e o "Cobrar" tem o mesmo peso dos outros botões', await pagC.evaluate(() =>
    Array.from(document.querySelectorAll('#cel-avisos .cel-aviso-dispensar')).every(x => x.getAttribute('aria-label') === 'Dispensar até amanhã' && x.title === 'Dispensar até amanhã') + ' ' +
    (getComputedStyle(document.querySelector('#cel-aviso-cobrar')).backgroundColor === getComputedStyle(document.querySelector('#cel-aviso-cobranca')).backgroundColor)), 'true true');
  await tirarPrint(pagC, '6_compacto_painel_aberto.png');
  conf('o toque fecha o painel, e a agenda volta ao lugar: a mesma rolagem e o bloco da Próxima na mesma altura (' + JSON.stringify(antesDeAbrir) + ')',
    (await tocar(pagC, cdp, '#cel-avisos-selo')) + ' ' + (await selinho(pagC)).painelVisivel + ' ' + JSON.stringify(await posicao()), 'true false ' + JSON.stringify(antesDeAbrir));
  await tocar(pagC, cdp, '#cel-avisos-selo');
  conf('o toque curto em "Registrar" abre o "Registrar como foi" da mais recente, e o painel recolhe', (await tocar(pagC, cdp, '#cel-aviso-registrar')) + ' ' +
    (await existe(pagC, '#cel-relato-texto')) + ' ' + (await pagC.evaluate(() => (document.querySelector('#cel-hoje h2.cel-titulo + .ajuda') || {}).textContent)),
    'true true Aluno Alfa Teste, 29/10/2026, 10:00');
  avC = await momento(pagC, ...CENA);
  conf('(arranjo) de volta a Hoje, o painel está recolhido (a ação o recolheu)', (await selinho(pagC)).painelVisivel, false);
  const sinc = await pagC.evaluate(() => [(document.querySelector('#cel-avisos-sincronia .cel-avisos-sincronia-texto') || {}).textContent, (document.querySelector('#cel-origem') || {}).textContent,
    !!document.querySelector('#cel-avisos-sincronia #cel-avisos-atualizar')]);
  conf('o rodapé do painel tem a sincronia (o mesmo estado da barra de cima) e o ↻ (' + sinc[0] + ')', sinc[0] === sinc[1] && !!sinc[0] && sinc[2], true);
  await abrirPainel(pagC);

  /* Deslizar: só de lado, passado o limiar. */
  const flush = await sincronizar(pagC);
  conf('(arranjo) a fila do celular está vazia antes de dispensar', flush.erroE + ' ' + (await pagC.evaluate(() => Store.estadoDaFila().then(e => e.pendentes))), 'null 0');
  const tituloDaSemana = () => texto(pagC, '#cel-dia-titulo');
  const titulo0 = await tituloDaSemana();
  const navega = await pagC.evaluate(() => ({
    anterior: document.querySelector('#cel-dia-anterior').textContent.replace(/\s+/g, ' ').trim(),
    seguinte: document.querySelector('#cel-dia-seguinte').textContent.replace(/\s+/g, ' ').trim(),
    rotuloAnterior: document.querySelector('#cel-dia-anterior').getAttribute('aria-label'),
    rotuloSeguinte: document.querySelector('#cel-dia-seguinte').getAttribute('aria-label'),
    dia: document.querySelector('#cel-semana-dias .cel-semana-dia.ativo').dataset.dia
  }));
  conf('as setas mostram que avançam ou voltam um dia', navega.anterior + '|' + navega.seguinte + '|' + navega.rotuloAnterior + '|' + navega.rotuloSeguinte,
    '1 dia|1 dia|Dia anterior, voltar um dia|Dia seguinte, avançar um dia');
  await deslizar(pagC, cdp, REG, 30, 0);
  await deslizar(pagC, cdp, REG, 20, 140);
  conf('o arrasto curto (30 px) e o de pé (mais vertical que de lado) não dispensam', (await selinho(pagC)).numero + ' ' + (await existe(pagC, REG)), '3 true');
  await fecharPainel(pagC);
  await deslizar(pagC, cdp, '.cel-semana-dias', -160, 0);
  conf('o arrasto de lado na faixa dos dias não dispensa nada nem muda o dia', (await selinho(pagC)).numero + ' ' + (await tituloDaSemana()), '3 ' + titulo0);
  await abrirPainel(pagC);
  const commits0 = pagC.commitsNaRede;
  await deslizar(pagC, cdp, REG, 160, 6);
  const inicioDoDesfazer = Date.now();
  const depois = { selo: (await selinho(pagC)).numero, item: await existe(pagC, REG), marcas: await marcadas(),
    desfazer: await pagC.evaluate(() => !!document.querySelector('#aviso.aberto.aviso-dourado') && (document.querySelector('#aviso-acao') || {}).textContent),
    frase: await texto(pagC, '#aviso-texto') };
  await pausa(400);
  const barra = await pagC.evaluate(() => ({ baixo: Math.round(document.querySelector('#aviso').getBoundingClientRect().bottom), abas: Math.round(document.querySelector('#cel-abas').getBoundingClientRect().top) }));
  conf('a barra do Desfazer diz qual aviso saiu e fica acima das abas (' + depois.frase + ' ; ' + JSON.stringify(barra) + ')',
    depois.frase === 'Aviso das aulas sem registro dispensado até amanhã.' && barra.baixo <= barra.abas, true);
  console.log('   depois de dispensar: ' + JSON.stringify(depois));
  prop('arrastar a linha para o lado dispensa: as 4 aulas saem do painel e do ponto na agenda, o selinho conta 2, e o "Desfazer" aparece na barra escura, em dourado',
    !depois.item && depois.selo === '2' && depois.marcas === '' && depois.desfazer === 'Desfazer', V_NAO_SOME);
  seVeneno(V_NAO_SOME);
  await tirarPrint(pagC, '7_compacto_dispensado_desfazer.png');
  conf('a chave guardada no aparelho é o tipo e o id da aula, no dia de hoje', await pagC.evaluate(() => localStorage.getItem('apoio-educacional:celular-avisos')),
    JSON.stringify({ dispensados: { '2026-10-29': SEM_REGISTRO.map(id => 'registrar:' + id) } }));
  conf('o painel aberto não se grava: no aparelho só os dispensados', await pagC.evaluate(() => /recolhida|aberto/.test(localStorage.getItem('apoio-educacional:celular-avisos'))), false);
  conf('dispensar não muda a semana: o mesmo dia no título', await tituloDaSemana(), titulo0);
  await pausa(2500);
  const fila1 = await pagC.evaluate(() => Store.estadoDaFila().then(e => e.pendentes));
  const commits1 = pagC.commitsNaRede;
  const envio = await sincronizar(pagC);
  prop('dispensar não toca a fila nem a nuvem: nada na fila, nada enviado, nenhuma escrita na rede (' + fila1 + ' ; ' + envio.enviados + ' ; ' + (commits1 - commits0) + ')',
    fila1 === 0 && envio.enviados === 0 && commits1 === commits0, V_NUVEM);
  seVeneno(V_NUVEM);
  /* O Desfazer do dispensar fica 12 s (a auditoria mediu 8,7 s nos de sempre). A
   * página está com o relógio fixo em 29/10 12:00; o tempo do aviso é o do
   * setTimeout, medido aqui no relógio do processo. */
  const esperarAte = async ms => { const falta = inicioDoDesfazer + ms - Date.now(); if (falta > 0) await pausa(falta); };
  const desfazerAberto = () => pagC.evaluate(() => !!document.querySelector('#aviso.aberto') && (document.querySelector('#aviso-acao') || {}).textContent === 'Desfazer');
  await esperarAte(10500);
  const aos10 = await desfazerAberto();
  await esperarAte(11500);
  const aos11 = await desfazerAberto();
  await esperarAte(12900);
  const aos13 = await desfazerAberto();
  conf('o "Desfazer" do dispensar segue à vista aos 10,5 s e aos 11,5 s e some até 12,9 s (' + [aos10, aos11, aos13].join(', ') + ')', [aos10, aos11, aos13].join(','), 'true,true,false');
  await fecharPainel(pagC);
  const tocouDia = await tocar(pagC, cdp, '#cel-dia-seguinte');
  const diaSeguinte = await pagC.evaluate(() => document.querySelector('#cel-semana-dias .cel-semana-dia.ativo').dataset.dia);
  const salto = (Date.parse(diaSeguinte + 'T00:00:00Z') - Date.parse(navega.dia + 'T00:00:00Z')) / 86400000;
  conf('a seta abre o dia seguinte, inclusive para ver amanhã', tocouDia + '|' + salto + '|' + ((await tituloDaSemana()) !== titulo0), 'true|1|true');
  conf('"Hoje" volta à data inicial', (await tocar(pagC, cdp, '#cel-dia-hoje')) + ' ' + ((await tituloDaSemana()) === titulo0), 'true true');
  avC = await momento(pagC, ...CENA);
  await abrirPainel(pagC);
  await deslizar(pagC, cdp, REG, 160, 6);
  conf('(arranjo) dispensada de novo', (await selinho(pagC)).numero, '2');
  conf('o "Desfazer" traz as aulas de volta', (await clicar(pagC, '#aviso-acao')) + ' ' + (await selinho(pagC)).numero + ' ' + (await existe(pagC, REG)) + ' ' + (await marcadas()),
    'true 3 true ' + SEM_REGISTRO.slice().sort().join(','));
  await deslizar(pagC, cdp, REG, -160, 6);
  await deslizar(pagC, cdp, '.cel-aviso-cobrar', 160, 6);
  const avDisp = await avisos(pagC);
  const cobB = avDisp.find(a => a.tipo === 'cobrar') || {};
  console.log('   dispensadas a aula e a cobrança do Alfa: ' + JSON.stringify(avDisp.map(a => a.tipo + ': ' + a.texto)));
  conf('o ✕ do aviso faz o mesmo que deslizar (o gesto tem um botão equivalente), e o Desfazer volta',
    (await clicar(pagC, '.cel-aviso-fechar .cel-aviso-dispensar')) + ' ' + (await existe(pagC, '.cel-aviso-fechar')) + ' ' + (await selinho(pagC)).numero + ' ' +
    (await clicar(pagC, '#aviso-acao')) + ' ' + (await existe(pagC, '.cel-aviso-fechar')) + ' ' + (await selinho(pagC)).numero, 'true false 1 true true 2');
  conf('"Dispensar todos" tira o selinho, e o Desfazer devolve tudo', (await clicar(pagC, '#cel-avisos-dispensar-todos')) + ' ' + (await existe(pagC, '#cel-avisos-selo')) + ' ' +
    (await clicar(pagC, '#aviso-acao')) + ' ' + (await selinho(pagC)).numero, 'true false true 2');
  conf('para a esquerda também; e dispensado o Alfa, a cobrança passa à família seguinte (o Beta), pela chave da família, e o selinho segue com 2 linhas',
    (await selinho(pagC)).numero + ' | ' + cobB.aluno + ' | ' + cobB.texto, '2 | beta | Em aberto: Aluno Beta Teste | agosto de 2026, R$ 100,00. Sem celular na ficha para o WhatsApp');

  /* O dia seguinte, pelo relógio fixo: o que ainda vale volta. */
  const dia30 = await momento(pagC, '2026-10-30', '12:00');
  const reg30 = dia30.find(a => a.tipo === 'registrar') || { aulas: [] };
  const cob30 = dia30.find(a => a.tipo === 'cobrar') || {};
  console.log('   30/10: ' + JSON.stringify(dia30.map(a => a.tipo + ': ' + a.texto)));
  /* Em 30/10 a das 16:00 de ontem também já passou sem registro: entra na frente. */
  prop('no dia seguinte, a aula ainda sem registro e a família ainda em aberto voltam (' + reg30.aulas.join(',') + ' ; ' + cob30.aluno + ')',
    reg30.aulas.join(',') === ['alfa-1029'].concat(SEM_REGISTRO).join(',') && cob30.aluno === 'alfa', V_SEMPRE);
  seVeneno(V_SEMPRE);
  await abrirPainel(pagC);
  await clicar(pagC, '.cel-aviso-fechar .cel-aviso-dispensar');
  conf('e a primeira gravação do dia novo limpa os dispensados de ontem', await pagC.evaluate(() => localStorage.getItem('apoio-educacional:celular-avisos')),
    JSON.stringify({ dispensados: { '2026-10-30': ['fechar:2026-10'] } }));
  await clicar(pagC, '#aviso-acao');
  /* O aberto não volta sozinho: outra abertura do aplicativo, no mesmo
   * aparelho e com o painel aberto aqui, chega recolhida. */
  conf('(arranjo) o painel está aberto neste aparelho', (await selinho(pagC)).expandido, 'true');
  const pagR = await ctxC.newPage();
  await prepararPagina(pagR, true);
  await pagR.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  await abrirCelular(pagR);
  await momento(pagR, '2026-10-30', '12:00');
  const selR = await selinho(pagR);
  prop('a próxima abertura do aplicativo chega recolhida, mesmo com o painel aberto quando ela saiu (' + JSON.stringify(selR) + ')', selR.existe && selR.expandido === 'false' && !selR.painelVisivel, V_ABERTA);
  await pagR.close();
  await fecharPainel(pagC);

  /* O armazenamento que lança erro: o app abre, recolhido, e dispensar vale
   * em memória. */
  const pagS = await ctxC.newPage();
  await prepararPagina(pagS, true);
  await pagS.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  await pagS.evaluateOnNewDocument(() => {
    const nega = function () { throw new DOMException('armazenamento negado', 'SecurityError'); };
    ['getItem', 'setItem', 'removeItem', 'key', 'clear'].forEach(n => { Storage.prototype[n] = nega; });
  });
  await abrirCelular(pagS);
  const lancou = await pagS.evaluate(() => { try { localStorage.getItem('x'); return false; } catch (e) { return true; } });
  const avS = await momento(pagS, ...CENA);
  const selS = await selinho(pagS);
  console.log('   sem armazenamento: ' + JSON.stringify(selS) + ' ; ' + tipos(avS));
  conf('com o armazenamento lançando erro, o app abre no Hoje e mostra o selinho, recolhido, com os 3', lancou + ' ' + selS.existe + ' ' + selS.numero + ' ' + selS.expandido + ' ' + selS.painelVisivel,
    'true true 3 false false');
  const cdpS = await pagS.createCDPSession();
  await tocar(pagS, cdpS, '#cel-avisos-selo');
  await deslizar(pagS, cdpS, REG, 160, 6);
  conf('sem armazenamento, o painel abre e o dispensar vale enquanto o app está aberto', (await selinho(pagS)).painelVisivel + ' ' + (await selinho(pagS)).numero, 'true 2');
  conf('nenhum erro de página sem armazenamento', pagS.errosDePagina.join(' | '), '');
  await pagS.close();

  /* O observador na mesma cena: sem cobrar e sem o mês a fechar. */
  const ctxE = await pagA.browser().createBrowserContext();
  const pagE = await ctxE.newPage();
  await prepararPagina(pagE, true);
  await pagE.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  await abrirCelular(pagE);
  conf('(arranjo) um observador entra com a conta dele e traz a cópia da dona', (await entrarNoCelular(pagE, OBS)) + ' ' + (await trazerCopiaNoCelular(pagE, dona.localId)), 'true true');
  await pagE.evaluate(() => Nuvem.receberRegistros());
  const obsChegou = await esperar('a cena chegou ao observador', () => pagE.evaluate(() => Store.carregar().then(d => d.aulas.some(a => a.id === 'gama-1029r'))), v => v === true, 15000);
  conf('(arranjo) a cena chegou ao observador', obsChegou.ok, true);
  const avE = await momento(pagE, ...CENA);
  const selE = await selinho(pagE);
  prop('o observador, no dia de todos os avisos: o selinho com 1 (a linha das 4 sem registro), sem cobrar e sem o mês a fechar (' + selE.numero + ' ; ' + tipos(avE) + ')',
    selE.numero === '1' && tipos(avE) === 'registrar' && !(await existe(pagE, '#cel-aviso-cobrar')), [V_OBS, V_SAIR]);
  await abrirPainel(pagE);
  await tirarPrint(pagE, '8_compacto_observador.png');
  conf('o observador, painel aberto: nenhuma ação de gravar e nenhum link de WhatsApp', (await pagE.evaluate(() => document.querySelectorAll('#cel-avisos [data-acao-celular]').length)) + ' ' +
    (await pagE.evaluate(() => /wa\.me/.test(document.querySelector('#cel-avisos').innerHTML))), '0 false');
  conf('nenhum erro de página no observador da cena', pagE.errosDePagina.join(' | '), '');
  await ctxE.close();

  secao('12. Sem erro de página, e o veneno pedido foi visto');
  conf('nenhum erro de página no tablet, no celular e no observador', [pagA, pagC, pagD].map(p => p.errosDePagina.join(' | ')).filter(Boolean).join(' || '), '');
  if (MODO) conf('o veneno ' + MODO + ' foi visto antes do fim', false, true);
  await ctxD.close();
  await ctxC.close();
})().then(() => derrubarEmulador().then(H.fim(amb)), e => derrubarEmulador().then(() => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e))));
