/* testa_pacotes_nuvem_atualizar.js
 *
 * Nuvem da biblioteca, PR 4: o toque em "Atualizar a biblioteca" (Ajustes)
 * traz os pacotes de EXERCÍCIOS novos do catálogo (config/catalogo, o mapa
 * `pacotes` do publicador do PR 2), um por vez, e os importa pelo MESMO
 * caminho do "Importar biblioteca" (o zip escolhido à mão). De ponta a ponta,
 * no Chrome de verdade e nos EMULADORES do Auth, do Firestore e do Storage
 * (nunca a produção), com as regras do repositório (storage.rules e
 * firestore.rules), a conta de teste do emulador e pacotes SINTÉTICOS
 * (_pacote_sintetico.js). O catálogo e os zips entram pela porta de
 * administrador do emulador ("Bearer owner"), como o publicador do dono.
 *
 * O Storage do emulador fica atrás de um repasse desta prova, na porta 9087:
 * ele conta cada pedido e corta a conexão no meio de um zip escolhido.
 *
 * O tablet sintético já tem, importados pelo zip (o #arquivo-biblioteca de
 * verdade): o ENEM na versão 1, o Mirim 2 na versão 1, o Banco na versão 2 e
 * a sondagem na versão 1. O catálogo tem:
 *   - o Banco na versão 1 (mais velha que a do tablet): nada acontece;
 *   - o ENEM na versão 1 (a mesma): pulado, SEM baixar;
 *   - o Mirim 1 na versão 1 (novo): a primeira baixa é cortada no meio, e o
 *     toque seguinte o traz;
 *   - o Mirim 2 na versão 2 (mais nova): troca a versão 1, como o zip;
 *   - um pacote com o sha256 errado no catálogo: nada entra;
 *   - um pacote PRIVADO (o nome dele nunca pode sair do tablet);
 *   - a sondagem com OUTRO nome no catálogo (o nome do arquivo não é o do
 *     manifest): baixa uma vez, a importação a reconhece pelo manifest, e o
 *     toque seguinte não baixa mais.
 *
 * O que se prova:
 *   1. o primeiro toque: o Mirim 1 cai no meio e não entra, o Mirim 2 sobe
 *      para a versão 2, o de sha256 errado não entra, o privado entra, a
 *      sondagem fica como estava; o ENEM e o Banco nem baixam; a falha do
 *      primeiro não impede os seguintes; o resumo e a linha dizem o que
 *      entrou e o que não entrou; o andamento apareceu;
 *   2. o segundo toque: o Mirim 1 entra; o de sha256 errado tenta de novo e
 *      não entra; nada mais baixa (nem a sondagem de outro nome);
 *   3. o pacote que veio da nuvem fica IGUAL ao mesmo zip importado à mão;
 *   4. nada novo: nenhum pedido ao Storage, nenhum resumo, e a linha diz
 *      "nenhum pacote de exercícios novo";
 *   5. sem internet: a frase calma, e nenhum pedido;
 *   6. o observador e o celular não trazem nada; de volta à conta dela, o
 *      mesmo toque traz (o controle);
 *   7. o nome e o título do pacote privado não aparecem em pedido nenhum, e
 *      todo pedido ao Storage foi um GET ?alt=media com "Authorization:
 *      Firebase", pelo caminho com o sha256, sem token e sem metadados;
 *   8. nenhum erro de página.
 *
 * Venenos (a prova TEM de ver o defeito e passa dizendo que viu):
 *   --envenenado-pacote-duplica   sem a conferência da versão: o pacote que o
 *                                 tablet já tem baixa de novo (1 vê);
 *   --envenenado-pacote-sem-hash  a conferência do sha256 é pulada: o pacote
 *                                 de sha256 errado entra (1 vê);
 *   --envenenado-pacote-para-tudo a falha de um pacote para os outros (1 vê).
 *
 * Precisa do firebase-tools (FIREBASE_TOOLS) e de um JDK 21 em JAVA_HOME,
 * como o testa_livros_nuvem_baixar.js. Portas: 9081 (app), 9082 (auth), 9083
 * (storage), 9084 (firestore), 9085 (hub), 9086 (log), 9087 (o repasse do
 * Storage), 9088 (websocket).
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, esperar, pausa } = H;

const PORTA_APP = 9081, PORTA_AUTH = 9082, PORTA_ST = 9083, PORTA_FS = 9084, PORTA_HUB = 9085, PORTA_LOG = 9086,
  PORTA_REPASSE = 9087, PORTA_WS = 9088;
const PROJETO = 'demo-nath-pacotes';
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
const VENENOS = {
  '--envenenado-pacote-duplica': ["if (typeof aqui === 'number' && aqui >= id.versao) { r.iguais++; return; }",
    'if (false) { r.iguais++; return; }'],
  '--envenenado-pacote-sem-hash': ['if (doArquivo !== e.sha256) throw', 'if (false) throw'],
  '--envenenado-pacote-para-tudo': ['return pausaCurta().then(function () { return proximo(i + 1); });',
    "return res.estado === 'falhou' ? null : pausaCurta().then(function () { return proximo(i + 1); });"]
};
const MODO = Object.keys(VENENOS).filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && !VENENOS[a]);
const trocas = {};
if (MODO) trocas['/app.js'] = APP.split(VENENOS[MODO][0]).join(VENENOS[MODO][1]);
const amb = H.criarAmbiente(PORTA_APP, 'nath_pacotes_nuvem', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'pacotes_nuvem_'));

/* ---------- os pacotes sintéticos ---------- */
const hex = b => crypto.createHash('sha256').update(b).digest('hex');
/* Um pacote de prova (Mirim ou ENEM) com OUTRA identidade: o id do pacote, os
 * ids dos exercícios (para não repetir os do pacote de origem) e o nome da
 * fonte trocados, e o manifest refeito com os hashes novos. */
function pacoteRenomeado(serie, pacote, prefixo, fonte) {
  const g = Sintetico.gerarProva(null, { serie, versao: 1 });
  const arquivos = {};
  Object.keys(g.arquivos).forEach(n => {
    let dados = g.arquivos[n].dados;
    if (n === 'itens.json' || n === 'busca.json') dados = Buffer.from(dados.toString('utf8').split('mirim:2099:').join(prefixo + ':2099:'), 'utf8');
    arquivos[n] = { dados, metodo: g.arquivos[n].metodo };
  });
  const lista = {};
  Object.keys(arquivos).sort().forEach(n => { lista[n] = 'sha256:' + hex(arquivos[n].dados); });
  const manifest = Object.assign({}, g.manifest, { pacote, fonte: Object.assign({}, g.manifest.fonte, { nome: fonte }), arquivos: lista });
  return Sintetico.montarZip([{ nome: 'manifest.json', dados: Buffer.from(JSON.stringify(manifest)), metodo: 8 }]
    .concat(Object.keys(arquivos).sort().map(n => ({ nome: n, dados: arquivos[n].dados, metodo: arquivos[n].metodo }))));
}
const ZIP = {
  banco1: Sintetico.gerarBanco(null, { versao: 1 }).zip,
  banco2: Sintetico.gerarBanco(null, { versao: 2 }).zip,
  enem1: Sintetico.gerarProva(null, { serie: '3em', versao: 1 }).zip,
  m1: Sintetico.gerarProva(null, { serie: 'm1', versao: 1 }).zip,
  m2v1: Sintetico.gerarProva(null, { serie: 'm2', versao: 1 }).zip,
  m2v2: Sintetico.gerarProva(null, { serie: 'm2', versao: 2 }).zip,
  sond1: Sintetico.gerarSondagem(null, { versao: 1 }).zip,
  trocado: pacoteRenomeado('m2', 'matematica-sintetico-trocado', 'trocado', 'Pacote trocado sintético'),
  privado: pacoteRenomeado('m1', 'privado-sintetico-licenca', 'privado', 'Coleção privada sintética')
};
// o que NUNCA pode sair do tablet num pedido: o id e o título do pacote privado
const PRIVADOS = ['privado-sintetico-licenca', 'Coleção privada sintética', 'privado:2099'];
const SHA = {};
Object.keys(ZIP).forEach(k => { SHA[k] = hex(ZIP[k]); });
// o catálogo diz um sha256 que NÃO é o do arquivo guardado no caminho dele
const SHA_DO_TROCADO_NO_CATALOGO = hex(Buffer.from('outro pacote, que não é o do arquivo'));
const caminho = (uid, sha) => 'usuarios/' + uid + '/pacotes/' + sha + '.zip';
const salvar = (nome, bytes) => { const p = path.join(TMP, nome + '.zip'); fs.writeFileSync(p, bytes); return p; };

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

/* ---------- o repasse do Storage: conta e corta ---------- */
const repasse = { pedidos: [], cortarSha: null, lento: 0 };
const servidorRepasse = http.createServer((req, res) => {
  if (req.method !== 'OPTIONS') repasse.pedidos.push({ metodo: req.method, url: req.url, autor: req.headers.authorization || '' });
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
      const corta = repasse.cortarSha && req.url.indexOf(repasse.cortarSha) !== -1;
      const PASSO = 1024;
      for (let i = 0; i < corpo.length; i += PASSO) {
        if (corta && i >= Math.floor(corpo.length / 2)) { res.socket.destroy(); return; }
        res.write(corpo.subarray(i, Math.min(corpo.length, i + PASSO)));
        if (repasse.lento) await pausa(repasse.lento);
      }
      res.end();
    });
  });
  ida.on('error', () => { try { res.socket.destroy(); } catch (e) { /* já caiu */ } });
  req.pipe(ida);
});
const fim = () => derrubarEmulador().then(() => new Promise(r => servidorRepasse.close(() => r()))).then(() => H.fim(amb)());

/* ---------- a nuvem de teste ---------- */
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
const gravarDoc = (rel, o) => fetch(DOCS + '/' + rel, { method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
  body: JSON.stringify({ fields: valor(o).mapValue.fields }) }).then(r => r.status);
const subirArquivo = (cam, bytes) => fetch(ST + '/upload/storage/v1/b/' + BUCKET + '/o?uploadType=media&name=' + encodeURIComponent(cam),
  { method: 'POST', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/zip' }, body: bytes }).then(r => r.status);

/* O catálogo do publicador: { nome: { versao, sha256, tamanho, caminhoNuvem, publicadoEm } }.
 * `qual`: nome -> [chave do ZIP, versao, sha256 que o catálogo diz]. */
async function publicar(uid, qual) {
  const pacotes = {};
  const status = [];
  for (const nome of Object.keys(qual)) {
    const [k, versao, shaCatalogo] = qual[nome];
    const sha = shaCatalogo || SHA[k];
    pacotes[nome] = { versao, sha256: sha, tamanho: ZIP[k].length, caminhoNuvem: caminho(uid, sha), publicadoEm: '2026-11-14T10:00:00-03:00' };
    status.push(await subirArquivo(caminho(uid, sha), ZIP[k]));
  }
  status.push(await gravarDoc('usuarios/' + uid + '/config/catalogo', { versao: 1, publicadoEm: '2026-11-14T10:00:00-03:00', livros: {}, pacotes }));
  return status;
}
const CATALOGO = {
  'matematica-sintetico-banco-n2': ['banco1', 1],
  'matematica-sintetico-enem-3em': ['enem1', 1],
  'matematica-sintetico-mirim-m1': ['m1', 1],
  'matematica-sintetico-mirim-m2': ['m2v2', 2],
  'matematica-sintetico-trocado': ['trocado', 1, SHA_DO_TROCADO_NO_CATALOGO],
  'privado-sintetico-licenca': ['privado', 1],
  'sondagem-com-outro-nome': ['sond1', 1]
};

/* ---------- a página ---------- */
async function prepararPagina(pag) {
  await pag.evaluateOnNewDocument(() => {
    Object.defineProperty(Screen.prototype, 'width', { configurable: true, get: () => 1280 });
    Object.defineProperty(Screen.prototype, 'height', { configurable: true, get: () => 800 });
  });
  await pag.evaluateOnNewDocument(cfg => { window.NUVEM_EMULADOR = cfg; }, CFG);
  await pag.evaluateOnNewDocument(porta => {
    window.__pedidosStorage = [];
    const f0 = window.fetch;
    window.fetch = function (url) {
      const u = String(url && url.url || url);
      if (u.indexOf(':' + porta + '/') !== -1 || u.indexOf('firebasestorage') !== -1) window.__pedidosStorage.push(u);
      return f0.apply(this, arguments);
    };
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
const pedidosDe = async (pag, sha) => (await pag.evaluate(() => window.__pedidosStorage.slice())).filter(u => u.indexOf(sha) !== -1).length;
const totalStorage = pag => pag.evaluate(() => window.__pedidosStorage.length);
const lerPacotes = pag => pag.evaluate(() => Store.listarPacotesBiblioteca().then(l => l.map(p => p.pacote + '@' + p.versao).join(',')));
const versaoDosItens = (pag, id) => pag.evaluate(i => Store.itensDaBiblioteca().then(l =>
  Array.from(new Set(l.filter(x => x.pacote === i).map(x => x.versao))).sort().join(',')), id);
const textoDoAviso = pag => pag.evaluate(() => (document.querySelector('#aviso-texto') || {}).textContent || '');
const limparAviso = pag => pag.evaluate(() => { const a = document.querySelector('#aviso-texto'); if (a) a.textContent = ''; });
const linhaDaNuvem = pag => pag.evaluate(() => (document.querySelector('#livros-nuvem-estado') || {}).textContent || '');
const caixa = pag => pag.evaluate(() => {
  const c = document.querySelector('#estado-importacao-biblioteca');
  const r = document.querySelector('#resumo-importacao-biblioteca');
  return { texto: c ? c.innerText.trim() : '', resumo: r ? r.querySelector('.u-peso-seminegrito').textContent : '',
    linhas: r ? Array.from(r.querySelectorAll('.resumo-importacao-linha')).map(l => l.dataset.estado + '|' + l.dataset.arquivo + '|' + l.innerText.trim()) : [] };
});

/* Importa zips pelo caminho de sempre, o #arquivo-biblioteca, e espera o fim. */
async function importarZips(pag, arquivos) {
  await pag.evaluate(() => {
    document.querySelector('#estado-importacao-biblioteca').innerHTML = '';
    document.querySelector('#cartao-biblioteca').hidden = false;
  });
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(...arquivos);
  return esperar('a importação dos zips terminou', () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca');
    const t = c ? c.innerText.trim() : '';
    return { texto: t, livre: document.querySelector('#importar-biblioteca').disabled === false };
  }), v => v.livre && v.texto && !/Conferindo|Gravando|Importando/.test(v.texto), 90000);
}

/* O toque em "Atualizar a biblioteca" de Ajustes, e a espera pelo fim dele:
 * a linha da nuvem volta a ser escrita (ela é apagada antes do toque). */
async function atualizar(pag, rotulo) {
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => { document.querySelector('#cartao-biblioteca').hidden = false; });
  await esperar('o botão Atualizar a biblioteca está à vista', () => existe(pag, '#livros-nuvem-atualizar'), v => v === true, 10000);
  await pag.evaluate(() => {
    const l = document.querySelector('#livros-nuvem-estado');
    if (l) l.textContent = '';
    window.__andamento = [];
    const c = document.querySelector('#estado-importacao-biblioteca');
    window.__amostra = new MutationObserver(() => {
      const t = c.innerText.trim();
      if (t && window.__andamento[window.__andamento.length - 1] !== t) window.__andamento.push(t);
    });
    window.__amostra.observe(c, { childList: true, subtree: true, characterData: true });
    document.querySelector('#livros-nuvem-atualizar').click();
  });
  const r = await esperar(rotulo, () => pag.evaluate(() => {
    const l = (document.querySelector('#livros-nuvem-estado') || {}).textContent || '';
    const c = document.querySelector('#estado-importacao-biblioteca');
    const b = document.querySelector('#livros-nuvem-atualizar');
    return { linha: l, ocupado: !!(c && /Da nuvem, /.test(c.innerText)) || !!(b && b.disabled) };
  }), v => /pacote/.test(v.linha) && !v.ocupado, 90000);
  const andamento = await pag.evaluate(() => { window.__amostra.disconnect(); return window.__andamento; });
  return { ok: r.ok, linha: r.valor.linha.replace(/\d\d:\d\d/, 'HH:MM'), andamento };
}
// o toque que não deve fazer nada: espera o aviso e conta
async function tocarSemEfeito(pag) {
  await H.irParaAba(pag, 'ajustes');
  await limparAviso(pag);
  await clicar(pag, '#livros-nuvem-atualizar');
  const r = await esperar('o aviso apareceu', () => textoDoAviso(pag), v => !!v, 10000);
  await pausa(800);
  return r.valor;
}

(async () => {
  secao('0. A prova se confere');
  conf('nenhum veneno desconhecido foi pedido', desconhecidos.join(','), '');
  for (const m of Object.keys(VENENOS)) conf('a âncora de ' + m + ' aparece uma vez só', APP.split(VENENOS[m][0]).length - 1, 1);
  conf('o firebase-tools está onde a prova procura (' + FIREBASE + ')', fs.existsSync(FIREBASE), true);
  const vj = /version "(\d+)/.exec(((r) => (r.stderr || '') + (r.stdout || ''))(spawnSync(JAVA_HOME ? path.join(JAVA_HOME, 'bin', 'java') : 'java', ['-version'], { encoding: 'utf8' })));
  conf('há um JDK 21 ou mais novo (' + (JAVA_HOME || 'java do PATH') + ')', !!vj && Number(vj[1]) >= 21, true);
  conf('os pacotes sintéticos são todos diferentes', new Set(Object.values(SHA)).size, Object.keys(SHA).length);
  if (H.placar.falhas) return fim();
  conf('as portas do emulador e do repasse estão livres (nada de outra rodada responde nelas)', await portasLivres(), true);
  if (H.placar.falhas) return fim();
  await new Promise((r, j) => { servidorRepasse.once('error', j); servidorRepasse.listen(PORTA_REPASSE, '127.0.0.1', r); });
  const subiu = await subirEmulador();
  if (!subiu.ok) throw new Error('o emulador não subiu');
  const dona = await conta('dona@exemplo.test', 'senha-da-dona-1');
  conf('a conta de teste da dona existe no emulador', !!dona.localId, true);
  const U = dona.localId;
  conf('o catálogo e os zips sintéticos entraram na nuvem de teste', (await publicar(U, CATALOGO)).every(s => s === 200), true);

  await amb.subir();
  const pag = await amb.pagina();
  await prepararPagina(pag);
  // todo pedido que a página faz, com o corpo: é aqui que o nome do privado não pode aparecer
  const pedidosDaPagina = [];
  pag.on('request', r => { pedidosDaPagina.push(r.method() + ' ' + r.url() + ' ' + (r.postData() || '')); });
  await pag.setViewport({ width: 1280, height: 800 });
  await H.abrirApp(pag, amb.ORIGEM);
  // o tablet sintético: um livro (o botão Atualizar a biblioteca mora no cartão dos livros) e quatro pacotes pelo zip
  const livro = await pag.evaluate(async () => {
    const dados = new TextEncoder().encode('%PDF-1.4 livro sintetico do tablet');
    const h = await Store.sha256Hex(dados);
    const m = { id: 'livro-do-tablet', formato: 'pdf', arquivo: 'livros/livro-do-tablet.pdf', hash: 'sha256:' + h, bytes: dados.length,
      titulo: 'Livro sintético do tablet', materia: 'matematica', paginas: 1, sumario: [{ n: 1, nivel: 1, titulo: 'Capítulo 1', pagina: 1 }] };
    const c = await Store.gravarLivros({ manifest: { pacote: 'livros-prova', versao: 1 }, livros: [{ meta: m, blob: new Blob([dados], { type: 'application/pdf' }) }] });
    return c.novos;
  });
  conf('o tablet sintético tem o livro', livro, 1);
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'ajustes');
  const zips = await importarZips(pag, [salvar('enem-v1', ZIP.enem1), salvar('m2-v1', ZIP.m2v1), salvar('banco-v2', ZIP.banco2), salvar('sondagem-v1', ZIP.sond1)]);
  conf('os quatro zips entraram pelo Importar biblioteca', zips.ok && /4 entraram/.test(zips.valor.texto), true);
  conf('o tablet tem o ENEM v1, o Mirim 2 v1, o Banco v2 e a sondagem v1', await lerPacotes(pag),
    'matematica-sintetico-banco-n2@2,matematica-sintetico-enem-3em@1,matematica-sintetico-mirim-m2@1,matematica-sintetico-sondagem-9ano@1');
  conf('entrou na nuvem com a conta de teste da dona', await entrar(pag, 'dona@exemplo.test', 'senha-da-dona-1'), true);
  conf('nada foi baixado do Storage antes do toque', await totalStorage(pag), 0);

  secao('1. O primeiro toque: um por vez, a falha de um não para os outros');
  repasse.cortarSha = SHA.m1;
  repasse.lento = 15;
  const t1 = await atualizar(pag, 'o primeiro toque terminou');
  repasse.cortarSha = null;
  repasse.lento = 0;
  conf('o primeiro toque terminou', t1.ok, true);
  if (MODO === '--envenenado-pacote-duplica') {
    conf('VENENO visto: o ENEM que o tablet já tem na mesma versão baixou de novo', await pedidosDe(pag, SHA.enem1) >= 1, true);
    return fim();
  }
  if (MODO === '--envenenado-pacote-sem-hash') {
    conf('VENENO visto: o pacote de sha256 errado entrou no tablet', /matematica-sintetico-trocado@1/.test(await lerPacotes(pag)), true);
    return fim();
  }
  if (MODO === '--envenenado-pacote-para-tudo') {
    conf('VENENO visto: a queda do Mirim 1 parou os outros (o Mirim 2 ficou na versão 1)', /matematica-sintetico-mirim-m2@1/.test(await lerPacotes(pag)), true);
    return fim();
  }
  conf('o ENEM (a mesma versão, importada pelo zip) não baixou', await pedidosDe(pag, SHA.enem1), 0);
  conf('o Banco (a nuvem tem a versão 1, o tablet a 2) não baixou', await pedidosDe(pag, SHA.banco1), 0);
  conf('o Mirim 1, o Mirim 2, o trocado, o privado e a sondagem de outro nome baixaram uma vez cada',
    (await Promise.all([SHA.m1, SHA.m2v2, SHA_DO_TROCADO_NO_CATALOGO, SHA.privado, SHA.sond1].map(s => pedidosDe(pag, s)))).join(','), '1,1,1,1,1');
  conf('no tablet: o Mirim 2 na versão 2, o privado entrou, o Mirim 1 e o trocado não, o resto como estava', await lerPacotes(pag),
    'matematica-sintetico-banco-n2@2,matematica-sintetico-enem-3em@1,matematica-sintetico-mirim-m2@2,matematica-sintetico-sondagem-9ano@1,privado-sintetico-licenca@1');
  conf('os exercícios do Mirim 2 são só os da versão 2 (a troca é a do zip)', await versaoDosItens(pag, 'matematica-sintetico-mirim-m2'), '2');
  conf('a metade do Mirim 1 não deixou nada no tablet', await versaoDosItens(pag, 'matematica-sintetico-mirim-m1'), '');
  const r1 = await caixa(pag);
  conf('o resumo diz o que entrou, o que ficou e o que não entrou', r1.resumo, 'Pacotes da nuvem: 2 entraram, 1 ficou como estava, 2 não entraram.');
  conf('o resumo tem uma linha por pacote baixado, na ordem, com o motivo', r1.linhas.map(l => l.split('|').slice(0, 2).join('|')).join(' ; '),
    'falhou|matematica-sintetico-mirim-m1-v1.zip ; entrou|matematica-sintetico-mirim-m2-v2.zip ; falhou|matematica-sintetico-trocado-v1.zip ; ' +
    'entrou|privado-sintetico-licenca-v1.zip ; pulou|sondagem-com-outro-nome-v1.zip');
  conf('a linha do Mirim 1 diz que a internet caiu', /a internet caiu no meio do download\. Toque em Atualizar a biblioteca de novo para tentar\./.test(r1.linhas[0]), true);
  conf('a linha do trocado diz que o arquivo veio diferente', /o arquivo veio diferente do catálogo e não foi importado\./.test(r1.linhas[2]), true);
  conf('a linha da sondagem diz que já estava (reconhecida pelo manifest)', /já estava no tablet\./.test(r1.linhas[4]), true);
  conf('a linha de Ajustes diz os novos e os que não entraram', t1.linha,
    'Biblioteca conferida hoje às HH:MM · nenhum livro com mapa novo · 2 pacotes de exercícios novos · 2 pacotes não entraram; toque de novo para tentar');
  conf('o andamento apareceu: um por vez, com o download em %', t1.andamento.some(a => /^Da nuvem, 2 de 5: /.test(a) && /Baixando · \d+%/.test(a)) &&
    t1.andamento.some(a => /^Da nuvem, 5 de 5: /.test(a)), true);
  conf('o Importar biblioteca voltou a responder', await pag.evaluate(() => document.querySelector('#importar-biblioteca').disabled), false);

  secao('2. O segundo toque: o que caiu entra; nada mais baixa');
  const antes2 = {};
  for (const k of ['m1', 'm2v2', 'privado', 'sond1', 'enem1', 'banco1']) antes2[k] = await pedidosDe(pag, SHA[k]);
  const t2 = await atualizar(pag, 'o segundo toque terminou');
  const dif = k => pedidosDe(pag, SHA[k]).then(n => n - antes2[k]);
  conf('o Mirim 1 baixou de novo, inteiro, e entrou', (await dif('m1')) + '|' + /matematica-sintetico-mirim-m1@1/.test(await lerPacotes(pag)), '1|true');
  conf('o Mirim 2, o privado, o ENEM e o Banco não baixaram de novo', (await Promise.all(['m2v2', 'privado', 'enem1', 'banco1'].map(dif))).join(','), '0,0,0,0');
  conf('a sondagem de outro nome não baixou de novo (o sha256 já diz quem ela é)', await dif('sond1'), 0);
  conf('o trocado tentou de novo e não entrou', (await pedidosDe(pag, SHA_DO_TROCADO_NO_CATALOGO)) + '|' + /trocado/.test(await lerPacotes(pag)), '2|false');
  const r2 = await caixa(pag);
  conf('o resumo do segundo toque', r2.resumo, 'Pacotes da nuvem: 1 entrou, 1 não entrou.');
  conf('a linha do segundo toque', t2.linha,
    'Biblioteca conferida hoje às HH:MM · nenhum livro com mapa novo · 1 pacote de exercícios novo · 1 pacote não entrou; toque de novo para tentar');

  secao('3. O pacote da nuvem fica igual ao mesmo zip importado à mão');
  const retrato = id => pag.evaluate(async i => {
    const tira = o => { const c = Object.assign({}, o); delete c.importadoEm; return c; };
    const porId = (a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    const p = (await Store.listarPacotesBiblioteca()).filter(x => x.pacote === i).map(tira);
    const it = (await Store.itensDaBiblioteca()).filter(x => x.pacote === i).map(tira).sort(porId);
    const te = (await Store.teoriaDaBiblioteca()).filter(x => x.pacote === i).map(tira).sort(porId);
    return JSON.stringify([p, it, te]);
  }, id);
  const daNuvem = await retrato('matematica-sintetico-mirim-m1');
  conf('o Mirim 1 da nuvem tem os exercícios do zip', JSON.parse(daNuvem)[1].length, 6);
  await pag.evaluate(() => Store.removerPacoteBiblioteca('matematica-sintetico-mirim-m1'));
  const aMao = await importarZips(pag, [salvar('m1-a-mao', ZIP.m1)]);
  conf('o mesmo zip, pelo Importar biblioteca', /Biblioteca importada/.test(aMao.valor.texto), true);
  conf('o registro, os exercícios e a teoria são os mesmos, campo a campo', (await retrato('matematica-sintetico-mirim-m1')) === daNuvem, true);

  secao('4. Nada novo: nenhum pedido, nenhum resumo');
  const semTrocado = Object.assign({}, CATALOGO);
  delete semTrocado['matematica-sintetico-trocado'];
  await publicar(U, semTrocado);
  const n4 = await totalStorage(pag);
  await pag.evaluate(() => { document.querySelector('#estado-importacao-biblioteca').innerHTML = '<div id="sobra">resumo de antes</div>'; });
  const t4 = await atualizar(pag, 'o toque sem nada novo terminou');
  conf('nenhum pedido ao Storage', (await totalStorage(pag)) - n4, 0);
  conf('o resumo de antes saiu, e nenhum novo aparece', JSON.stringify(await caixa(pag)), JSON.stringify({ texto: '', resumo: '', linhas: [] }));
  conf('a linha diz que não há pacote novo', t4.linha, 'Biblioteca conferida hoje às HH:MM · nenhum livro com mapa novo · nenhum pacote de exercícios novo');

  secao('5. Sem internet: a frase calma, e nada é pedido');
  const consertado = Object.assign({}, semTrocado, { 'matematica-sintetico-trocado': ['trocado', 1] });
  await publicar(U, consertado);
  const n5 = pedidosDaPagina.length;
  await pag.setOfflineMode(true);
  const semRede = await tocarSemEfeito(pag);
  await pag.setOfflineMode(false);
  conf('sem internet, o aviso é calmo e diz o que fazer', semRede, 'Sem internet agora. Quando ela voltar, toque em Atualizar a biblioteca de novo. Nada mudou no tablet.');
  conf('sem internet, nenhum pedido saiu da página', pedidosDaPagina.slice(n5).filter(p => !/^GET http:\/\/127\.0\.0\.1:9081\//.test(p)).join(' ; '), '');
  conf('e nada entrou', /trocado/.test(await lerPacotes(pag)), false);

  secao('6. O observador e o celular não trazem nada');
  const n6 = await totalStorage(pag);
  await pag.evaluate(() => {
    window.__estado0 = Nuvem.estado;
    Nuvem.estado = function () { const e = window.__estado0.apply(this, arguments); e.observador = true; e.celular = true; return e; };
  });
  conf('como observador, o toque avisa que a biblioteca se atualiza no tablet', await tocarSemEfeito(pag), 'A biblioteca se atualiza no tablet.');
  await pag.evaluate(() => {
    Nuvem.estado = function () { const e = window.__estado0.apply(this, arguments); e.celular = true; return e; };
  });
  conf('com a marca de celular, o mesmo aviso', await tocarSemEfeito(pag), 'A biblioteca se atualiza no tablet.');
  conf('o observador e o celular não pediram nada ao Storage, e nada entrou', ((await totalStorage(pag)) - n6) + '|' + /trocado/.test(await lerPacotes(pag)), '0|false');
  await pag.evaluate(() => { Nuvem.estado = window.__estado0; });
  const t6 = await atualizar(pag, 'de volta à conta dela, o toque terminou');
  conf('de volta à conta dela, o mesmo toque traz o pacote (o controle)', ((await totalStorage(pag)) - n6) + '|' + /matematica-sintetico-trocado@1/.test(await lerPacotes(pag)), '1|true');
  conf('e a linha diz que ele entrou', t6.linha, 'Biblioteca conferida hoje às HH:MM · nenhum livro com mapa novo · 1 pacote de exercícios novo');

  secao('7. O nome do privado não sai do tablet; só o GET pelo sha256');
  const vazou = pedidosDaPagina.filter(p => PRIVADOS.some(n => p.indexOf(n) !== -1) || /privado-sintetico/i.test(decodeURIComponent(p)));
  conf('nenhum pedido da página leva o nome, o título ou os ids do pacote privado', vazou.join(' ; '), '');
  conf('nenhum pedido ao Storage leva o nome do privado', repasse.pedidos.filter(p => PRIVADOS.some(n => decodeURIComponent(p.url).indexOf(n) !== -1)).length, 0);
  conf('o privado veio pelo caminho com o sha256 dele', repasse.pedidos.some(p => decodeURIComponent(p.url).indexOf('/pacotes/' + SHA.privado + '.zip') !== -1), true);
  const fora = repasse.pedidos.filter(p => p.metodo !== 'GET' || !/^\/v0\/b\/[^/]+\/o\/[^/?]+\?alt=media$/.test(p.url) || !/^Firebase \S+$/.test(p.autor) || /token=/.test(p.url));
  conf('todo pedido ao Storage foi um GET ?alt=media com Authorization: Firebase, sem token na URL', fora.map(p => p.metodo + ' ' + p.url).join(' ; '), '');
  conf('todo pedido ao Storage foi de um pacote desta conta, pelo sha256', repasse.pedidos.every(p => /^usuarios\/[^/]+\/pacotes\/[0-9a-f]{64}\.zip$/.test(decodeURIComponent(p.url.split('/o/')[1].split('?')[0])) &&
    decodeURIComponent(p.url).indexOf('usuarios/' + U + '/') !== -1), true);

  secao('8. Nenhum erro de página');
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
