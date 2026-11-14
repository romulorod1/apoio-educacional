/* testa_livros_nuvem_baixar.js
 *
 * Nuvem da biblioteca, PR 3: o livro que está no catálogo com o arquivo no
 * Storage (caminhoNuvem, o campo do publicador do PR 2) e não está no tablet
 * aparece na Estante como "Na nuvem" e baixa com um toque. De ponta a ponta,
 * no Chrome de verdade e nos EMULADORES do Auth, do Firestore e do Storage
 * (nunca a produção), com as regras do repositório (storage.rules e
 * firestore.rules), a conta de teste do emulador e PDFs sintéticos. O
 * catálogo e os arquivos entram pela porta de administrador do emulador
 * ("Bearer owner"), como o publicador do dono faria com a credencial dele.
 *
 * O Storage do emulador fica atrás de um repasse desta prova, na porta 9077:
 * ele conta cada pedido da página, corta a conexão no meio (a rede que cai) e
 * solta o corpo devagar, para o andamento aparecer.
 *
 * O que se prova:
 *   1. a Estante mostra os livros da nuvem que não estão no tablet ("Na
 *      nuvem · toque para baixar"), ao lado do livro do tablet; o que não tem
 *      arquivo na nuvem, o retirado e o que já está no tablet não aparecem; e
 *      mostrar não baixa nada;
 *   2. o sha256 errado é recusado: o cartão diz, e nenhum livro é guardado;
 *   3. a baixa interrompida no meio não guarda nada, e o toque seguinte baixa,
 *      com o andamento à vista (entre 0 e 100%), confere e guarda: o livro
 *      vira um livro do tablet (pacote 'nuvem', o Blob inteiro, o sha256 do
 *      catálogo) e abre no leitor;
 *   4. dois toques seguidos começam UMA baixa; o toque noutro livro enquanto
 *      um baixa não começa outra, e avisa;
 *   5. sem internet, o cartão diz que não baixa agora, e o toque não pede nada
 *      à rede; a internet volta e ele volta a dizer "toque para baixar";
 *   6. sem espaço no tablet (o estimate), avisa quanto falta e não baixa;
 *   7. o observador (D7) não vê livro da nuvem nenhum;
 *   8. o getDownloadURL nunca entra: nenhuma das fontes do aplicativo o cita
 *      (nem o token de download), e todo pedido da página ao Storage foi um
 *      GET ?alt=media com "Authorization: Firebase <idToken>", sem token na
 *      URL e sem ler os metadados do objeto;
 *   9. nenhum erro de página.
 *
 * Venenos (a prova TEM de ver o defeito e passa dizendo que viu):
 *   --envenenado-sem-hash        a conferência do sha256 é pulada: o arquivo
 *                                errado vira livro (2 vê);
 *   --envenenado-guarda-parcial  guarda antes de conferir: o arquivo errado
 *                                fica guardado mesmo recusado (2 vê);
 *   --envenenado-baixa-dois      sem a guarda do toque repetido: dois toques
 *                                começam duas baixas (4 vê).
 *
 * Precisa do firebase-tools (FIREBASE_TOOLS) e de um JDK 21 em JAVA_HOME,
 * como o testa_storage_regras.js. Portas: 9071 (app), 9072 (auth), 9073
 * (storage), 9074 (firestore), 9075 (hub), 9076 (log), 9077 (o repasse do
 * Storage), 9078 (websocket).
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, esperar, pausa } = H;

const PORTA_APP = 9071, PORTA_AUTH = 9072, PORTA_ST = 9073, PORTA_FS = 9074, PORTA_HUB = 9075, PORTA_LOG = 9076,
  PORTA_REPASSE = 9077, PORTA_WS = 9078;
const PROJETO = 'demo-nath-baixar';
const BUCKET = PROJETO + '.appspot.com';
const AUTH = 'http://127.0.0.1:' + PORTA_AUTH;
const FS = 'http://127.0.0.1:' + PORTA_FS;
const ST = 'http://127.0.0.1:' + PORTA_ST;
const REPASSE = 'http://127.0.0.1:' + PORTA_REPASSE;
const DOCS = FS + '/v1/projects/' + PROJETO + '/databases/(default)/documents';
const FIREBASE = process.env.FIREBASE_TOOLS ||
  'C:/Users/romul/ferramentas/firebase-tools/node_modules/firebase-tools/lib/bin/firebase.js';
const JAVA_HOME = process.env.JAVA_HOME || '';
const CFG = { auth: AUTH, firestore: FS, projectId: PROJETO, storage: REPASSE, bucket: BUCKET };

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const NUVEM = fs.readFileSync(path.join(H.RAIZ, 'nuvem.js'), 'utf8').replace(/\r\n/g, '\n');
const STORE = fs.readFileSync(path.join(H.RAIZ, 'store.js'), 'utf8').replace(/\r\n/g, '\n');
const FONTES = { app: ['/app.js', APP] };
const VENENOS = {
  '--envenenado-sem-hash': ['app', 'if (h !== e.sha256) throw', 'if (false) throw'],
  '--envenenado-guarda-parcial': ['app', 'return conferirLivroBaixado(bytes, e).then(function () { return guardarLivroBaixado(bytes, e); });',
    'return guardarLivroBaixado(bytes, e).then(function () { return conferirLivroBaixado(bytes, e); });'],
  '--envenenado-baixa-dois': ['app', '    if (baixaDaNuvem) return outraBaixaEmCurso(id);\n', '']
};
const MODO = Object.keys(VENENOS).filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && !VENENOS[a]);
const trocas = {};
if (MODO) {
  const [qual, de, para] = VENENOS[MODO];
  trocas[FONTES[qual][0]] = FONTES[qual][1].split(de).join(para);
}
const amb = H.criarAmbiente(PORTA_APP, 'nath_nuvem_baixar', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'nuvem_baixar_'));

/* ---------- os livros sintéticos ---------- */
/* Um PDF de verdade, mínimo, que o pdf.js do leitor abre; `enchimento` bytes de
 * comentário no conteúdo da primeira página dão corpo ao arquivo, para o
 * andamento ter passos. As posições (xref) são contadas aqui. */
function pdfMinimo(n, rotulo, enchimento) {
  const objs = [];
  const fonte = 3 + 2 * n;
  const kids = [];
  for (let i = 0; i < n; i++) kids.push((3 + 2 * i) + ' 0 R');
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[2] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>';
  for (let i = 0; i < n; i++) {
    let texto = 'BT /F1 28 Tf 40 200 Td (' + rotulo + ' p ' + (i + 1) + ') Tj ET';
    if (i === 0 && enchimento) {
      const linha = '%' + 'x'.repeat(78) + '\n';
      texto += '\n' + linha.repeat(Math.ceil(enchimento / linha.length));
    }
    objs[3 + 2 * i] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 400] /Resources << /Font << /F1 ' + fonte + ' 0 R >> >> /Contents ' + (4 + 2 * i) + ' 0 R >>';
    objs[4 + 2 * i] = '<< /Length ' + texto.length + ' >>\nstream\n' + texto + '\nendstream';
  }
  objs[fonte] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  let saida = '%PDF-1.4\n';
  const pos = [];
  for (let k = 1; k < objs.length; k++) { pos[k] = Buffer.byteLength(saida); saida += k + ' 0 obj\n' + objs[k] + '\nendobj\n'; }
  const xref = Buffer.byteLength(saida);
  saida += 'xref\n0 ' + objs.length + '\n0000000000 65535 f \n';
  for (let k = 1; k < objs.length; k++) saida += String(pos[k]).padStart(10, '0') + ' 00000 n \n';
  saida += 'trailer\n<< /Size ' + objs.length + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
  return Buffer.from(saida, 'latin1');
}
const hex = b => crypto.createHash('sha256').update(b).digest('hex');
const ARQ = {
  'nuvem-a': pdfMinimo(6, 'Livro A', 700000),
  'nuvem-b': pdfMinimo(4, 'Livro B', 500000),
  'nuvem-c': pdfMinimo(4, 'Livro C', 20000),
  'nuvem-falso': pdfMinimo(4, 'Livro falso', 20000),
  'local-l': pdfMinimo(4, 'Livro local', 0),
  'sem-arquivo': pdfMinimo(3, 'Sem arquivo', 0),
  'retirado-r': pdfMinimo(3, 'Retirado', 0)
};
// o sha256 que o catálogo diz de cada livro; o do "falso" é o de OUTRO conteúdo (o arquivo no Storage não confere)
const SHA = {};
Object.keys(ARQ).forEach(id => { SHA[id] = hex(ARQ[id]); });
SHA['nuvem-falso'] = hex(Buffer.from('outro conteúdo, que não é o do arquivo'));
const TITULOS = { 'nuvem-a': 'Álgebra na nuvem', 'nuvem-b': 'Bloco de geometria', 'nuvem-c': 'Caderno de frações',
  'nuvem-falso': 'Dicionário trocado', 'local-l': 'Estatística do tablet', 'sem-arquivo': 'Sem arquivo na nuvem', 'retirado-r': 'Retirado do catálogo' };
function meta(id) {
  return { id, formato: 'pdf', arquivo: 'livros/' + id + '.pdf', hash: 'sha256:' + SHA[id], bytes: ARQ[id].length,
    titulo: TITULOS[id], materia: 'matematica', materia_nome: 'Matemática', segmento: 'Fundamental II', series: ['08'],
    series_origem: 'mapa', mapa_disciplina: 'matematica', paginas: id === 'nuvem-a' ? 6 : id === 'sem-arquivo' || id === 'retirado-r' ? 3 : 4,
    sumario: [{ n: 1, nivel: 1, titulo: 'Primeiro capítulo', pagina: 1 }, { n: 2, nivel: 1, titulo: 'Segundo capítulo', pagina: 3 }],
    sumario_origem: 'marcadores', mapa: [], mapa_origem: 'nenhum', mapa_nota: 'Sem mapa de capítulos.' };
}
const NA_NUVEM = ['nuvem-a', 'nuvem-b', 'nuvem-c', 'nuvem-falso'];
const caminho = (uid, id) => 'usuarios/' + uid + '/livros/' + SHA[id] + '.pdf';

/* ---------- o emulador ---------- */
const PASTA = path.join(TMP, 'emulador');
let emulador = null;
function subirEmulador() {
  fs.mkdirSync(PASTA, { recursive: true });
  fs.writeFileSync(path.join(PASTA, 'storage.rules'), fs.readFileSync(path.join(H.RAIZ, 'storage.rules'), 'utf8'));
  fs.writeFileSync(path.join(PASTA, 'firestore.rules'), fs.readFileSync(path.join(H.RAIZ, 'firestore.rules'), 'utf8'));
  fs.writeFileSync(path.join(PASTA, 'firebase.json'), JSON.stringify({
    firestore: { rules: 'firestore.rules' },
    storage: { rules: 'storage.rules' },
    emulators: { auth: { host: '127.0.0.1', port: PORTA_AUTH }, firestore: { host: '127.0.0.1', port: PORTA_FS, websocketPort: PORTA_WS },
      storage: { host: '127.0.0.1', port: PORTA_ST },
      hub: { host: '127.0.0.1', port: PORTA_HUB }, logging: { host: '127.0.0.1', port: PORTA_LOG }, ui: { enabled: false }, singleProjectMode: true }
  }));
  const env = Object.assign({}, process.env);
  if (JAVA_HOME) env.PATH = path.join(JAVA_HOME, 'bin') + path.delimiter + (env.PATH || env.Path || '');
  // no Linux o emulador vai num grupo de processos próprio, para sair inteiro (o java junto) no fim
  emulador = spawn(process.execPath, [FIREBASE, 'emulators:start', '--only', 'auth,firestore,storage', '--project', PROJETO, '--non-interactive'],
    { cwd: PASTA, env, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' });
  let saida = '';
  emulador.stdout.on('data', d => { saida += d; });
  emulador.stderr.on('data', d => { saida += d; });
  emulador.on('exit', c => { emulador.saiu = c; });
  return esperar('o emulador respondeu', async () => {
    if (emulador.saiu !== undefined) throw new Error('o emulador saiu: ' + saida.slice(-600));
    const a = await fetch(AUTH + '/').then(r => r.json()).catch(() => null);
    const f = await fetch(FS + '/').then(r => r.status).catch(() => 0);
    const s = await fetch(ST + '/').then(r => r.status).catch(() => 0);
    return !!(a && a.authEmulator && a.authEmulator.ready) && f === 200 && s > 0 && /All emulators ready/i.test(saida);
  }, v => v === true, 180000);
}
// um emulador que já responde nas portas é de outra rodada: a prova falaria com ele
async function portasLivres() {
  for (const u of [AUTH, FS, ST, REPASSE]) if (await fetch(u + '/').then(r => r.status).catch(() => 0)) return false;
  return true;
}
function matarGrupo(sinal) {
  try { process.kill(-emulador.pid, sinal); } catch (e) { /* já saiu */ }
}
function derrubarEmulador() {
  return new Promise(resolve => {
    if (!emulador || emulador.saiu !== undefined) { resolve(); return; }
    emulador.on('exit', () => resolve());
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(emulador.pid), '/T', '/F'], { stdio: 'ignore' });
    else matarGrupo('SIGINT');
    setTimeout(() => { if (process.platform !== 'win32') matarGrupo('SIGKILL'); resolve(); }, 8000);
  });
}

/* ---------- o repasse do Storage: conta, corta e segura ---------- */
const repasse = { pedidos: [], cortarApos: null, lento: 0 };
const servidorRepasse = http.createServer((req, res) => {
  if (req.method !== 'OPTIONS') repasse.pedidos.push({ metodo: req.method, url: req.url, autor: req.headers.authorization || '', quando: Date.now() });
  const cab = Object.assign({}, req.headers, { host: '127.0.0.1:' + PORTA_ST });
  const ida = http.request({ host: '127.0.0.1', port: PORTA_ST, method: req.method, path: req.url, headers: cab }, volta => {
    if (req.method === 'OPTIONS' || !/[?&]alt=media/.test(req.url) || volta.statusCode !== 200) {
      res.writeHead(volta.statusCode, volta.headers);
      volta.pipe(res);
      return;
    }
    const partes = [];
    volta.on('data', p => partes.push(p));
    volta.on('end', async () => {
      const corpo = Buffer.concat(partes);
      const cabV = Object.assign({}, volta.headers, { 'content-length': String(corpo.length) });
      delete cabV['transfer-encoding'];
      res.writeHead(200, cabV);
      const corte = repasse.cortarApos, lento = repasse.lento;
      const PASSO = 32 * 1024;
      for (let i = 0; i < corpo.length; i += PASSO) {
        if (corte !== null && i >= corte) { res.socket.destroy(); return; }
        res.write(corpo.subarray(i, Math.min(corpo.length, i + PASSO)));
        if (lento) await pausa(lento);
      }
      res.end();
    });
  });
  ida.on('error', () => { try { res.socket.destroy(); } catch (e) { /* já caiu */ } });
  req.pipe(ida);
});
/* Quantas baixas o APLICATIVO pediu de um livro: os fetch da página ao Storage.
 * É a conta da página, e não a do repasse, porque o Chrome refaz sozinho o GET
 * cuja conexão caiu (o repasse vê duas chegadas para um fetch só). */
const pedidosDe = async (pag, id) => (await pag.evaluate(() => window.__pedidosStorage.slice())).filter(u => u.indexOf(SHA[id]) !== -1).length;

// o fim de toda rodada derruba o emulador e o repasse antes de sair
const fim = () => derrubarEmulador().then(() => new Promise(r => servidorRepasse.close(() => r()))).then(() => H.fim(amb)());

/* ---------- a nuvem de teste: a conta, o catálogo e os arquivos ---------- */
const conta = (email, senha) => fetch(AUTH + '/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake', { method: 'POST',
  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: senha, returnSecureToken: true }) }).then(r => r.json());
function valor(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(valor) } };
  const fields = {};
  Object.keys(v).forEach(k => { fields[k] = valor(v[k]); });
  return { mapValue: { fields } };
}
const campos = o => valor(o).mapValue.fields;
const gravarDoc = (rel, o) => fetch(DOCS + '/' + rel, { method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
  body: JSON.stringify({ fields: campos(o) }) }).then(r => r.status);
const subirArquivo = (cam, bytes) => fetch(ST + '/upload/storage/v1/b/' + BUCKET + '/o?uploadType=media&name=' + encodeURIComponent(cam),
  { method: 'POST', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/pdf' }, body: bytes }).then(r => r.status);

async function semearNuvem(uid) {
  const indice = { versao: 1, publicadoEm: '2026-11-14T10:00:00-03:00', livros: {} };
  const status = [];
  for (const id of Object.keys(ARQ)) {
    const m = meta(id);
    const texto = JSON.stringify(m);
    const metaHash = hex(Buffer.from(texto, 'utf8'));
    const cam = id === 'sem-arquivo' ? null : caminho(uid, id);
    const retiradoEm = id === 'retirado-r' ? '2026-11-14T09:00:00-03:00' : null;
    indice.livros[id] = { sha256: SHA[id], tamanho: ARQ[id].length, metaHash, metaVersao: 1, formato: 'pdf', retiradoEm, caminhoNuvem: cam };
    status.push(await gravarDoc('usuarios/' + uid + '/catalogo/' + id, { id, titulo: m.titulo, formato: 'pdf', sha256: SHA[id], tamanho: ARQ[id].length,
      metaVersao: 1, metaHash, metaJson: texto, idsAnteriores: [], publicadoEm: '2026-11-14T10:00:00-03:00', retiradoEm, caminhoNuvem: cam }));
    if (cam) status.push(await subirArquivo(cam, ARQ[id]));
  }
  status.push(await gravarDoc('usuarios/' + uid + '/config/catalogo', indice));
  return status;
}

/* ---------- a página ---------- */
async function prepararPagina(pag) {
  await pag.evaluateOnNewDocument(() => {
    Object.defineProperty(Screen.prototype, 'width', { configurable: true, get: () => 1280 });
    Object.defineProperty(Screen.prototype, 'height', { configurable: true, get: () => 800 });
  });
  await pag.evaluateOnNewDocument(cfg => { window.NUVEM_EMULADOR = cfg; }, CFG);
  // cada fetch da página que vai ao Storage (o repasse), e quem chamou um getDownloadURL, se alguém chamasse
  await pag.evaluateOnNewDocument(porta => {
    window.__pedidosStorage = [];
    const f0 = window.fetch;
    window.fetch = function (url, op) {
      const u = String(url && url.url || url);
      if (u.indexOf(':' + porta + '/') !== -1 || u.indexOf('firebasestorage') !== -1) window.__pedidosStorage.push(u);
      return f0.apply(this, arguments);
    };
    window.getDownloadURL = function () { window.__chamouGetDownloadURL = true; throw new Error('getDownloadURL não pode ser chamado'); };
  }, PORTA_REPASSE);
}
const clicar = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.click(); return true; }, sel);
const existe = (pag, sel) => pag.evaluate(s => !!document.querySelector(s), sel);
async function entrar(pag, email, senha) {
  await H.irParaAba(pag, 'ajustes');
  await esperar('o cartão da nuvem pede e-mail e senha', () => existe(pag, '#nuvem-entrar'), v => v === true, 10000);
  await pag.evaluate((e, s) => {
    const a = document.querySelector('#nuvem-email'), b = document.querySelector('#nuvem-senha');
    a.value = e; a.dispatchEvent(new Event('input', { bubbles: true }));
    b.value = s; b.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#nuvem-entrar').click();
  }, email, senha);
  return (await esperar('entrou na nuvem', () => existe(pag, '#nuvem-enviar'), v => v === true, 20000)).ok;
}
async function abrirEstante(pag) {
  await H.irParaAba(pag, 'hoje');
  await H.irParaAba(pag, 'biblioteca');
  await esperar('a Biblioteca desenhou', () => existe(pag, '#bib-abrir-estante, .bibl-painel-estante'), v => v === true, 15000);
  if (!(await existe(pag, '.bibl-painel-estante'))) await clicar(pag, '#bib-abrir-estante');
  return esperar('a Estante está à vista', () => existe(pag, '.bibl-painel-estante .bibl-grade'), v => v === true, 10000);
}
const cartoesDaNuvem = pag => pag.evaluate(() => Array.from(document.querySelectorAll('[data-nuvem]')).map(c => c.dataset.nuvem).join(','));
const estadoDoCartao = (pag, id) => pag.evaluate(i => {
  const c = document.querySelector('[data-nuvem="' + i + '"] [data-nuvem-estado]');
  return c ? c.getAttribute('data-nuvem-estado') + '|' + c.textContent : 'sem cartão';
}, id);
const livroGuardado = (pag, id) => pag.evaluate(i => Store.lerLivro(i).then(r => !r ? null : r.blob.arrayBuffer().then(buf =>
  crypto.subtle.digest('SHA-256', buf).then(h => {
    const v = new Uint8Array(h); let s = ''; for (const b of v) s += (b < 16 ? '0' : '') + b.toString(16);
    return JSON.stringify({ pacote: r.pacote, versao: r.versao, bytes: r.bytes, blob: r.blob.size, tipo: r.blob.type, sha: s, hash: r.meta.hash,
      nuvem: r.nuvem && r.nuvem.metaVersao });
  }))), id);
const textoDoAviso = pag => pag.evaluate(() => (document.querySelector('#aviso-texto') || {}).textContent || '');
const limparAviso = pag => pag.evaluate(() => { const a = document.querySelector('#aviso-texto'); if (a) a.textContent = ''; });
const paginaDesenhada = pag => pag.evaluate(() => {
  const c = document.querySelector('#corpo-modal-leitor-pdf');
  return c && document.querySelector('#modal-leitor-pdf.aberto') ? (c.dataset.paginaDesenhada || '') : 'fechado';
});

(async () => {
  secao('0. A prova se confere');
  conf('nenhum veneno desconhecido foi pedido', desconhecidos.join(','), '');
  for (const m of Object.keys(VENENOS)) {
    const [qual, de] = VENENOS[m];
    conf('a âncora de ' + m + ' aparece uma vez só', FONTES[qual][1].split(de).length - 1, 1);
  }
  // o getDownloadURL (e o token de download que ele cria) não aparece em fonte nenhuma do aplicativo
  // (no código, sem os comentários: o comentário do nuvem.js explica por que ele não é usado)
  const semComentarios = t => t.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  const fontesDoApp = { 'app.js': APP, 'nuvem.js': NUVEM, 'store.js': STORE };
  const citam = Object.keys(fontesDoApp).filter(n => /getDownloadURL|downloadTokens|firebaseStorageDownloadTokens|[?&]token=/.test(semComentarios(fontesDoApp[n])));
  conf('o comentário do nuvem.js diz por que o getDownloadURL não entra (a busca acima não é cega)', /getDownloadURL/.test(NUVEM), true);
  conf('nenhuma fonte do aplicativo cita getDownloadURL nem o token de download', citam.join(','), '');
  conf('o nuvem.js baixa pelo ?alt=media com Authorization: Firebase', /'\?alt=media'/.test(NUVEM) && /Authorization: 'Firebase ' \+ token/.test(NUVEM), true);
  conf('o firebase-tools está onde a prova procura (' + FIREBASE + ')', fs.existsSync(FIREBASE), true);
  const vj = /version "(\d+)/.exec(((r) => (r.stderr || '') + (r.stdout || ''))(spawnSync(JAVA_HOME ? path.join(JAVA_HOME, 'bin', 'java') : 'java', ['-version'], { encoding: 'utf8' })));
  conf('há um JDK 21 ou mais novo (' + (JAVA_HOME || 'java do PATH') + ')', !!vj && Number(vj[1]) >= 21, true);
  if (H.placar.falhas) return fim();
  conf('as portas do emulador e do repasse estão livres (nada de outra rodada responde nelas)', await portasLivres(), true);
  if (H.placar.falhas) return fim();
  await new Promise((r, j) => { servidorRepasse.once('error', j); servidorRepasse.listen(PORTA_REPASSE, '127.0.0.1', r); });
  const subiu = await subirEmulador();
  if (!subiu.ok) throw new Error('o emulador não subiu');
  const dona = await conta('dona@exemplo.test', 'senha-da-dona-1');
  conf('a conta de teste da dona existe no emulador', !!dona.localId, true);
  const U = dona.localId;
  const semeados = await semearNuvem(U);
  conf('o catálogo e os arquivos sintéticos entraram na nuvem de teste', semeados.every(s => s === 200), true);

  await amb.subir();
  const pag = await amb.pagina();
  await prepararPagina(pag);
  await pag.setViewport({ width: 1280, height: 800 });
  await H.abrirApp(pag, amb.ORIGEM);
  // o tablet sintético: um livro importado (também está no catálogo, com arquivo na nuvem)
  const gravados = await pag.evaluate(async (m, b64) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const c = await Store.gravarLivros({ manifest: { pacote: 'livros-prova', versao: 1 }, livros: [{ meta: m, blob: new Blob([bytes], { type: 'application/pdf' }) }] });
    return c.novos;
  }, meta('local-l'), ARQ['local-l'].toString('base64'));
  conf('o tablet sintético tem o livro importado', gravados, 1);
  await H.abrirApp(pag, amb.ORIGEM);
  conf('entrou na nuvem com a conta de teste da dona', await entrar(pag, 'dona@exemplo.test', 'senha-da-dona-1'), true);

  secao('1. A Estante mostra os livros da nuvem');
  await abrirEstante(pag);
  const vistos = await esperar('os cartões "Na nuvem" chegaram', () => cartoesDaNuvem(pag), v => v.split(',').length === 4, 30000);
  conf('os quatro livros da nuvem que não estão no tablet aparecem, em ordem de título', vistos.valor, NA_NUVEM.join(','));
  conf('o livro do tablet continua lá, como sempre', await existe(pag, '[data-livro="local-l"]') + '|' + await existe(pag, '[data-nuvem="local-l"]'), 'true|false');
  conf('o livro sem arquivo na nuvem e o retirado não aparecem', await existe(pag, '[data-nuvem="sem-arquivo"]') + '|' + await existe(pag, '[data-nuvem="retirado-r"]'), 'false|false');
  conf('o cartão diz, pequeno, que está na nuvem', await estadoDoCartao(pag, 'nuvem-a'), 'na-nuvem|Na nuvem · toque para baixar');
  conf('o cartão diz o que o toque faz, para o leitor de tela', await pag.evaluate(() => document.querySelector('[data-nuvem="nuvem-a"]').getAttribute('aria-label')),
    'Baixar Álgebra na nuvem da nuvem para o tablet');
  conf('a capa do livro da nuvem é a clara', await pag.evaluate(() => !!document.querySelector('[data-nuvem="nuvem-a"] .bibl-capa.na-nuvem')), true);
  conf('a contagem da seção diz quantos estão na nuvem', await pag.evaluate(() => (document.querySelector('#bib-livros-contagem') || {}).textContent || ''),
    '1 material, 1 disciplina · 4 livros na nuvem');
  conf('mostrar não baixou nada do Storage', repasse.pedidos.length, 0);

  secao('2. O sha256 errado é recusado, e nada é guardado');
  await clicar(pag, '[data-nuvem="nuvem-falso"]');
  const falso = await esperar('o livro de sha256 errado terminou', () => estadoDoCartao(pag, 'nuvem-falso'),
    v => /^(conferencia|outro|rede)\|/.test(v) || v === 'sem cartão', 20000);
  const guardadoFalso = await livroGuardado(pag, 'nuvem-falso');
  if (MODO === '--envenenado-sem-hash' || MODO === '--envenenado-guarda-parcial') {
    conf('VENENO visto: o arquivo que não confere com o catálogo ficou guardado como livro', guardadoFalso !== null, true);
    return fim();
  }
  conf('o cartão diz que o arquivo veio diferente e não foi guardado', falso.valor,
    'conferencia|O arquivo veio diferente do catálogo e não foi guardado. Toque para tentar de novo.');
  conf('nenhum livro foi guardado', guardadoFalso, null);
  conf('o arquivo baixou uma vez, inteiro, e foi recusado na conferência', await pedidosDe(pag, 'nuvem-falso'), 1);

  secao('3. A baixa interrompida não guarda nada; a seguinte baixa com andamento, guarda e abre');
  repasse.cortarApos = 200 * 1024;
  await clicar(pag, '[data-nuvem="nuvem-a"]');
  const caiu = await esperar('a baixa interrompida terminou', () => estadoDoCartao(pag, 'nuvem-a'), v => /^(rede|outro|conferencia)\|/.test(v), 20000);
  conf('o cartão diz que a internet caiu no meio, e que o toque tenta de novo', caiu.valor, 'rede|A internet caiu no meio. Toque para tentar de novo.');
  conf('a metade não virou livro', await livroGuardado(pag, 'nuvem-a'), null);
  conf('nenhum registro novo em livros (só o do tablet)', await pag.evaluate(() => Store.listarLivros().then(l => l.map(x => x.id).join(','))), 'local-l');
  repasse.cortarApos = null;
  repasse.lento = 60;
  // o andamento, anotado a cada mudança da própria tela (um observador do DOM: nenhum passo escapa)
  await pag.evaluate(() => {
    window.__andamento = [];
    const anotar = () => {
      const c = document.querySelector('[data-nuvem="nuvem-a"] [data-nuvem-estado]');
      if (!c) return;
      const v = c.getAttribute('data-nuvem-estado') + '|' + c.textContent + '|' + ((c.querySelector('.bibl-progresso i') || { style: {} }).style.width || '');
      if (window.__andamento[window.__andamento.length - 1] !== v) window.__andamento.push(v);
    };
    window.__amostra = new MutationObserver(anotar);
    window.__amostra.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
  });
  await clicar(pag, '[data-nuvem="nuvem-a"]');
  const chegou = await esperar('o livro baixado virou livro do tablet', () => pag.evaluate(() =>
    !!document.querySelector('[data-livro="nuvem-a"]') && !document.querySelector('[data-nuvem="nuvem-a"]')), v => v === true, 30000);
  const andamento = await pag.evaluate(() => { window.__amostra.disconnect(); return window.__andamento; });
  const pcts = andamento.filter(a => /^baixando\|/.test(a)).map(a => Number(/(\d+)%/.exec(a)[1]));
  conf('a baixa mostrou o andamento: passos entre 0 e 100%, crescendo, com a barra junto', pcts.some(p => p > 0 && p < 100) &&
    pcts.every((p, i) => i === 0 || p >= pcts[i - 1]) && andamento.filter(a => /^baixando\|/.test(a)).every(a => /\|\d+%$/.test(a)), true);
  conf('e passou pela conferência antes de guardar', andamento.some(a => /^conferindo\|Conferindo o arquivo/.test(a)), true);
  conf('o livro entrou no tablet', chegou.ok, true);
  conf('o registro é o de um livro do tablet: pacote nuvem, o Blob inteiro, o sha256 do catálogo', await livroGuardado(pag, 'nuvem-a'),
    JSON.stringify({ pacote: 'nuvem', versao: 1, bytes: ARQ['nuvem-a'].length, blob: ARQ['nuvem-a'].length, tipo: 'application/pdf',
      sha: SHA['nuvem-a'], hash: 'sha256:' + SHA['nuvem-a'], nuvem: 1 }));
  conf('o aviso diz que o livro está no tablet', await textoDoAviso(pag), 'Álgebra na nuvem está no tablet. Toque nele para abrir.');
  conf('foram duas baixas deste livro: a cortada e a inteira', await pedidosDe(pag, 'nuvem-a'), 2);
  await clicar(pag, '[data-livro="nuvem-a"]');
  await esperar('a tela do livro abriu', () => existe(pag, '#bib-livro:not([hidden]) .bibl-cap[data-n="1"]'), v => v === true, 10000);
  await clicar(pag, '#bib-livro .bibl-cap[data-n="1"]');
  const abriu = await esperar('o leitor desenhou a página', () => paginaDesenhada(pag), v => v === '1', 20000);
  conf('o livro baixado abre no leitor, como um importado', abriu.valor, '1');
  await pag.evaluate(() => { const b = document.querySelector('#modal-leitor-pdf .modal-rodape [data-fechar]') || document.querySelector('#modal-leitor-pdf [data-fechar]'); if (b) b.click(); });
  await esperar('o leitor fechou', () => paginaDesenhada(pag), v => v === 'fechado', 5000);

  secao('4. Dois toques seguidos começam uma baixa só; outro livro espera');
  await abrirEstante(pag);
  await limparAviso(pag);
  repasse.lento = 60;
  await pag.evaluate(() => { const c = document.querySelector('[data-nuvem="nuvem-b"]'); c.click(); c.click(); });
  await esperar('a baixa do segundo livro começou', () => estadoDoCartao(pag, 'nuvem-b'), v => /^baixando\|/.test(v), 10000);
  await clicar(pag, '[data-nuvem="nuvem-c"]');
  const umPorVez = await textoDoAviso(pag);
  await esperar('o segundo livro entrou', () => existe(pag, '[data-livro="nuvem-b"]'), v => v === true, 30000);
  await pausa(500);
  if (MODO === '--envenenado-baixa-dois') {
    conf('VENENO visto: dois toques começaram duas baixas', await pedidosDe(pag, 'nuvem-b'), 2);
    return fim();
  }
  conf('dois toques seguidos: uma baixa só', await pedidosDe(pag, 'nuvem-b'), 1);
  conf('o toque noutro livro durante a baixa avisa e não baixa', umPorVez + '|' + await pedidosDe(pag, 'nuvem-c'), 'Um livro por vez: espere o que está baixando terminar.|0');
  conf('o segundo livro está guardado inteiro', JSON.parse(await livroGuardado(pag, 'nuvem-b')).sha, SHA['nuvem-b']);
  conf('o livro de fora continua na nuvem, pronto para o toque', await estadoDoCartao(pag, 'nuvem-c'), 'na-nuvem|Na nuvem · toque para baixar');

  secao('5. Sem internet, o cartão diz, e nada quebra');
  repasse.lento = 0;
  await pag.setOfflineMode(true);
  const semRede = await esperar('o cartão percebeu a falta de internet', () => estadoDoCartao(pag, 'nuvem-c'), v => /^sem-rede\|/.test(v), 5000);
  conf('sem internet, o cartão diz que não baixa agora', semRede.valor, 'sem-rede|Sem internet agora; toque de novo quando ela voltar.');
  await clicar(pag, '[data-nuvem="nuvem-c"]');
  await pausa(600);
  conf('o toque sem internet não pede nada à rede e não guarda nada', await pedidosDe(pag, 'nuvem-c') + '|' + await livroGuardado(pag, 'nuvem-c'), '0|null');
  conf('e o cartão continua dizendo o mesmo', await estadoDoCartao(pag, 'nuvem-c'), 'sem-rede|Sem internet agora; toque de novo quando ela voltar.');
  await pag.setOfflineMode(false);
  const voltou = await esperar('a internet voltou', () => estadoDoCartao(pag, 'nuvem-c'), v => /^na-nuvem\|/.test(v), 5000);
  conf('com a internet de volta, o cartão volta a dizer "toque para baixar"', voltou.valor, 'na-nuvem|Na nuvem · toque para baixar');

  secao('6. Sem espaço no tablet, avisa e não baixa');
  await limparAviso(pag);
  await pag.evaluate(() => {
    window.__estimar0 = Store.estimarEspaco;
    Store.estimarEspaco = () => Promise.resolve({ quota: 100 * 1024 * 1024, usage: 100 * 1024 * 1024 - 2048 });
  });
  await clicar(pag, '[data-nuvem="nuvem-c"]');
  const cheio = await esperar('o cartão diz da falta de espaço', () => estadoDoCartao(pag, 'nuvem-c'), v => /^sem-espaco\|/.test(v), 5000);
  conf('o cartão diz que falta espaço', cheio.valor, 'sem-espaco|Falta espaço no tablet para este livro.');
  conf('o aviso diz quanto falta e o que fazer', /^O tablet está sem espaço para este livro: ele precisa de .+ e há .+ livres\. Libere espaço no tablet/.test(await textoDoAviso(pag)), true);
  conf('sem espaço, nada é pedido à rede nem guardado', await pedidosDe(pag, 'nuvem-c') + '|' + await livroGuardado(pag, 'nuvem-c'), '0|null');
  await pag.evaluate(() => { Store.estimarEspaco = window.__estimar0; });

  secao('7. O observador não vê livro da nuvem');
  await pag.evaluate(() => {
    window.__estado0 = Nuvem.estado;
    Nuvem.estado = function () { const e = window.__estado0.apply(this, arguments); e.observador = true; return e; };
  });
  await abrirEstante(pag);
  await pausa(300);
  conf('como observador, nenhum cartão da nuvem', await cartoesDaNuvem(pag), '');
  await pag.evaluate(() => { Nuvem.estado = window.__estado0; });
  await abrirEstante(pag);
  conf('de volta à conta dela, os da nuvem voltam (o controle)', (await esperar('os cartões voltaram', () => cartoesDaNuvem(pag), v => !!v, 10000)).valor,
    'nuvem-c,nuvem-falso');

  secao('8. O getDownloadURL nunca entra');
  const doStorage = repasse.pedidos;
  const fora = doStorage.filter(p => p.metodo !== 'GET' || !/^\/v0\/b\/[^/]+\/o\/[^/?]+\?alt=media$/.test(p.url) || !/^Firebase \S+$/.test(p.autor) || /token=/.test(p.url));
  conf('todo pedido ao Storage foi um GET ?alt=media com Authorization: Firebase <idToken>, sem token na URL', fora.map(p => p.metodo + ' ' + p.url).join(' ; '), '');
  conf('nenhum pedido leu os metadados do objeto (onde mora o token do getDownloadURL)', doStorage.filter(p => !/alt=media/.test(p.url)).length, 0);
  const daPagina = await pag.evaluate(() => window.__pedidosStorage.slice());
  conf('a página pediu ao Storage só as quatro baixas (o falso, o A duas vezes e o B), todas pelo ?alt=media', daPagina.length + '|' +
    daPagina.every(u => /\?alt=media$/.test(u) && !/token=/.test(u)), '4|true');
  conf('todo fetch da página chegou ao repasse (a conta dele não é menor)', doStorage.length >= daPagina.length, true);
  conf('ninguém chamou getDownloadURL na página', await pag.evaluate(() => !!window.__chamouGetDownloadURL), false);

  secao('9. Nenhum erro de página');
  conf('nenhum erro de página', pag.errosDePagina.join(' | '), '');
  return fim();
})().catch(e => { console.error('erro:', e && e.stack || e); H.placar.falhas++; return fim(); });

process.on('exit', () => {
  try {
    if (emulador && emulador.saiu === undefined) {
      if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(emulador.pid), '/T', '/F'], { stdio: 'ignore' });
      else matarGrupo('SIGKILL');
    }
  } catch (e) { /* ok */ }
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ }
});
