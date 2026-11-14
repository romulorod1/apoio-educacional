/* testa_biblioteca_nuvem_metas.js
 *
 * Fase 1c da biblioteca na nuvem: o mapa novo chega ao tablet pelo catálogo,
 * sem baixar nem regravar livro nenhum. De ponta a ponta, no Chrome de verdade
 * e no EMULADOR do Firestore e do Auth (nunca a produção): o publicador da 1b
 * (biblioteca/publicar_catalogo.py) publica os metas novos de livros
 * SINTÉTICOS, filtrados por uma classificação de mentira; o tablet sintético
 * tem os metas velhos (como os pacotes de 07/11), a posição de leitura e as
 * correções dela; a dona de teste entra na nuvem e toca em "Atualizar a
 * biblioteca" (Ajustes, Livros).
 *
 * A prova de aceite é a contagem da romul-c0: a DEFASAGEM entre o mapa do
 * meta do tablet e o mapa vivo (o do catálogo) vai a ZERO nos livros que
 * ficam (FICA e SO_TEORIA), e o resto fica byte a byte como estava.
 *
 * O que se prova:
 *   1. controle: antes do toque, a defasagem é de 3 livros, e nada muda
 *      sozinho na abertura (a conferência na abertura fica desligada até a
 *      primeira publicação conferida);
 *   2. depois do toque: defasagem zero nos três; o SO_TEORIA ganha
 *      so_teoria; o Blob, os bytes, o pacote, a versão e a data de
 *      importação de cada um ficam como estavam (nenhum livro regravado);
 *   3. ficam como estavam, byte a byte: o livro SAI (fora do catálogo), o
 *      livro de outro arquivo (o catálogo tem outro sha256) e o livro de meta
 *      inválido (sumário fora do livro: pulado e contado);
 *   4. a posição de leitura e o db dela (as correções do mapa) ficam byte a
 *      byte; a correção do capítulo de mesmo título segue valendo no mapa novo;
 *   5. a linha de Ajustes diz o que aconteceu ("3 livros com mapa novo",
 *      "1 livro chega com a próxima versão", "1 livro não pôde ser
 *      conferido"), e um segundo toque não troca nada nem baixa de novo o
 *      livro de meta igual;
 *   2 e 5 também: o livro cujo meta da nuvem é IGUAL ao do tablet não é
 *      regravado (nenhum put no registro dele) nem contado como mapa novo;
 *   6. as travas do Store: o meta de outro livro, de outro formato ou de
 *      outro número de páginas não entra;
 *   7. a conferência recusa o mapa que não é lista de capítulos;
 *   8. em lotes: a falha de um lote (a falta de espaço chega assim: a
 *      transação aborta) não desfaz os anteriores, a linha diz quantos
 *      ficaram para o próximo toque, e o próximo toque os troca; a correção
 *      que o mapa novo deixou sem capítulo é contada na linha; o documento
 *      de outro livro (id trocado) nem chega ao Store;
 *   9. a entrada vencida (TOKEN_EXPIRED) pede para entrar de novo, e não
 *      "tente de novo";
 *  10. nenhum erro de página.
 *
 * Venenos (a prova TEM de ver o defeito):
 *   --envenenado-troca-o-blob      a troca regrava o Blob (2);
 *   --envenenado-solta-a-posicao   a troca apaga a posição de leitura (4);
 *   --envenenado-aceita-meta-invalido  o meta que não passa na conferência
 *                                  entra (3);
 *   --envenenado-liga-na-abertura  a conferência roda sozinha na abertura (1);
 *   --envenenado-regrava-o-igual   o meta igual é regravado e contado (2);
 *   --envenenado-store-aceita-outro-id  o Store aceita o meta de outro livro (6);
 *   --envenenado-aceita-outro-formato   o Store aceita outro formato (6);
 *   --envenenado-aceita-outras-paginas  o Store aceita outro número de páginas (6);
 *   --envenenado-aceita-mapa-texto o mapa em texto passa na conferência (7);
 *   --envenenado-um-lote-so        tudo numa transação: a falha desfaz tudo (8);
 *   --envenenado-app-aceita-outro-id  o documento de outro livro chega ao Store (8);
 *   --envenenado-vencida-pede-tente  a entrada vencida diz "tente de novo" (9).
 *
 * Precisa do firebase-tools (FIREBASE_TOOLS) e de um JDK 21 em JAVA_HOME,
 * como o testa_nuvem.js. Portas: 9041 (app), 9042 (auth), 9043 (firestore),
 * 9044 (hub), 9045 (log), 9046 (websocket).
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, esperar, pausa } = H;

const PORTA_APP = 9041, PORTA_AUTH = 9042, PORTA_FS = 9043, PORTA_HUB = 9044, PORTA_LOG = 9045, PORTA_WS = 9046;
const PROJETO = 'demo-nath-metas';
const AUTH = 'http://127.0.0.1:' + PORTA_AUTH;
const FS = 'http://127.0.0.1:' + PORTA_FS;
const FIREBASE = process.env.FIREBASE_TOOLS ||
  'C:/Users/romul/ferramentas/firebase-tools/node_modules/firebase-tools/lib/bin/firebase.js';
const JAVA_HOME = process.env.JAVA_HOME || '';
const PYTHON = process.env.PYTHON || 'python';
const CFG = { auth: AUTH, firestore: FS, projectId: PROJETO };

const STORE = fs.readFileSync(path.join(H.RAIZ, 'store.js'), 'utf8').replace(/\r\n/g, '\n');
const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const BIB = fs.readFileSync(path.join(H.RAIZ, 'biblioteca.js'), 'utf8').replace(/\r\n/g, '\n');
const FONTES = { store: ['/store.js', STORE], app: ['/app.js', APP], biblioteca: ['/biblioteca.js', BIB] };
const VENENOS = {
  '--envenenado-troca-o-blob': ['store', '          novo.meta = it.meta;\n', "          novo.meta = it.meta;\n          novo.blob = new Blob(['regravado']);\n"],
  '--envenenado-solta-a-posicao': ['store', "      var t = transacao(b, ['livros'], 'readwrite');\n      var dep = t.objectStore('livros');\n",
    "      var t = transacao(b, ['livros', 'livros_posicoes'], 'readwrite');\n      var dep = t.objectStore('livros');\n      lote.forEach(function (it) { t.objectStore('livros_posicoes').delete(it.id); });\n"],
  '--envenenado-aceita-meta-invalido': ['app', '                if (!c.meta) { estado.invalidos++; return; }\n', '                if (!c.meta) c.meta = JSON.parse(doc.metaJson);\n'],
  '--envenenado-liga-na-abertura': ['app', 'var ATUALIZAR_BIBLIOTECA_NA_ABERTURA = false;', 'var ATUALIZAR_BIBLIOTECA_NA_ABERTURA = true;'],
  '--envenenado-regrava-o-igual': ['store', '          if (canonicoDoMeta(atual.meta) === canonicoDoMeta(it.meta)) { contas.iguais.push(it.id); return; }\n', ''],
  '--envenenado-store-aceita-outro-id': ['store', '          if (!it.meta || it.meta.id !== it.id || atual.meta.id !== it.id) { contas.invalidos++; return; }\n', ''],
  '--envenenado-aceita-outro-formato': ['store', 'if (it.meta.formato !== atual.meta.formato || it.meta.paginas', 'if (it.meta.paginas'],
  '--envenenado-aceita-outras-paginas': ['store', ' || it.meta.paginas !== atual.meta.paginas) { contas.invalidos++', ') { contas.invalidos++'],
  '--envenenado-aceita-mapa-texto': ['biblioteca', 'if (meta.mapa !== undefined && (!Array.isArray(meta.mapa) ||', 'if (false && (!Array.isArray(meta.mapa) ||'],
  '--envenenado-um-lote-so': ['store', 'var LOTE_DA_NUVEM = 5;', 'var LOTE_DA_NUVEM = 1000;'],
  '--envenenado-app-aceita-outro-id': ['app', 'if (!doc || doc.id !== ped.id || doc.metaHash', 'if (!doc || doc.metaHash'],
  '--envenenado-vencida-pede-tente': ['app', '        : PEDE_ENTRAR_DE_NOVO[codigo] ?', '        : false ?']
};
const MODO = Object.keys(VENENOS).filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && !VENENOS[a]);
const trocas = {};
if (MODO) {
  const [qual, de, para] = VENENOS[MODO];
  trocas[FONTES[qual][0]] = FONTES[qual][1].split(de).join(para);
}
const amb = H.criarAmbiente(PORTA_APP, 'nath_metas_nuvem', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'metas_nuvem_'));

/* ---------- os livros sintéticos: o meta velho (o do tablet) e o vivo (o do catálogo) ---------- */
const BYTES = { 'fica-a': 'livro fica a ' + 'a'.repeat(900), 'fica-b': 'livro fica b ' + 'b'.repeat(700), 'teoria-e': 'livro teoria e ' + 'e'.repeat(600),
  'sai-c': 'livro sai c ' + 'c'.repeat(500), 'outro-d': 'livro outro d ' + 'd'.repeat(400), 'invalido-f': 'livro invalido f ' + 'f'.repeat(300),
  'igual-g': 'livro igual g ' + 'g'.repeat(250) };
// os livros da seção 8 (lotes), com um catálogo de mentira na própria página
const LOTE = ['lote-1', 'lote-2', 'lote-3', 'lote-4', 'lote-5', 'lote-6', 'lote-7', 'lote-8'];
LOTE.forEach((id, i) => { BYTES[id] = 'livro ' + id + ' ' + 'x'.repeat(200 + i); });
const hex = s => crypto.createHash('sha256').update(Buffer.from(s)).digest('hex');
const cap = (n, titulo, ini, fim, ids) => ({ n, titulo, pagina: ini, pagina_fim: fim, assuntos: ids.map(id => ({ id, confianca: 'alta' })), origem: 'mapa' });
function meta(id, extra) {
  const b = BYTES[id];
  return Object.assign({ id, formato: 'pdf', arquivo: 'livros/' + id + '.pdf', hash: 'sha256:' + hex(b), bytes: Buffer.byteLength(b),
    titulo: 'Livro de prova ' + id, materia: 'matematica', materia_nome: 'Matemática', segmento: 'Fundamental II', series: ['08'],
    series_origem: 'mapa', mapa_disciplina: 'matematica', paginas: 10, sumario: [], sumario_origem: 'nenhum', mapa: [], mapa_origem: 'nenhum',
    mapa_nota: 'Sem mapa de capítulos.' }, extra || {});
}
// o caminho do arquivo na planilha, só para o publicador casar a classificação (não vai para a nuvem)
function comOrigem(m) {
  return Object.assign({}, m, { arquivo_origem: 'Matematica/' + m.id + '.pdf' });
}
const VELHOS = [
  meta('fica-a', { mapa: [cap(1, 'Proporcionalidade', 1, 5, ['MAT08-07']), cap(2, 'Volume', 6, 10, [])], mapa_origem: 'mapa', mapa_nota: 'Do mapa de 07/11.' }),
  meta('fica-b'),   // como o ga8 e o ar8: o tablet ficou sem mapa nenhum
  meta('teoria-e'),
  meta('sai-c', { mapa: [cap(1, 'Roteiro de sala', 1, 10, [])], mapa_origem: 'mapa' }),
  meta('outro-d', { mapa: [cap(1, 'Funções', 1, 10, [])], mapa_origem: 'mapa' }),
  meta('invalido-f'),
  meta('igual-g')   // o catálogo traz o MESMO meta: nada a regravar
];
const VIVOS = [
  meta('fica-a', { mapa: [cap(1, 'Proporcionalidade', 1, 5, ['MAT08-07']), cap(2, 'Volume e capacidade', 6, 10, ['MAT08-15'])], mapa_origem: 'mapa', mapa_nota: 'Do mapa vivo.' }),
  meta('fica-b', { mapa: [cap(1, 'Volumes', 2, 8, ['MAT08-15'])], mapa_origem: 'mapa', mapa_nota: 'Do mapa vivo.' }),
  meta('teoria-e', { mapa: [cap(1, 'Geometria', 1, 10, ['MAT08-13'])], mapa_origem: 'mapa', mapa_nota: 'Do mapa vivo.' }),
  meta('sai-c', { mapa: [cap(1, 'Roteiro de sala novo', 1, 10, [])], mapa_origem: 'mapa' }),
  Object.assign(meta('outro-d', { mapa: [cap(1, 'Funções novas', 1, 10, ['MAT08-06'])], mapa_origem: 'mapa' }), { hash: 'sha256:' + hex('outro arquivo de d'), bytes: 999 }),
  meta('invalido-f', { sumario: [{ n: 1, nivel: 1, titulo: 'Fora do livro', pagina: 999 }], sumario_origem: 'marcadores' }),
  meta('igual-g')
];
// seção 8: o meta velho e o novo de cada livro do lote; o lote-1 tem uma correção dela que o mapa novo deixa sem capítulo
const LOTE_VELHOS = LOTE.map(id => meta(id, { mapa: [cap(1, 'Frações', 1, 10, ['MAT08-01'])], mapa_origem: 'mapa' }));
const LOTE_NOVOS = LOTE.map(id => meta(id, { mapa: [cap(1, 'Decimais', 1, 10, ['MAT08-02'])], mapa_origem: 'mapa', mapa_nota: 'Do mapa vivo.' }));
const CORRECAO_LOTE = { 1: { titulo: 'Frações', assuntos: ['MAT08-03'], acao: 'corrigiu', quando: '2026-11-10T10:00:00.000Z' } };
const CORRECOES = { 'fica-a': { 1: { titulo: 'Proporcionalidade', assuntos: ['MAT08-08'], acao: 'corrigiu', quando: '2026-11-10T10:00:00.000Z' } } };

/* ---------- o emulador ---------- */
const PASTA = path.join(TMP, 'emulador');
let emulador = null;
function subirEmulador() {
  fs.mkdirSync(PASTA, { recursive: true });
  fs.writeFileSync(path.join(PASTA, 'firestore.rules'), fs.readFileSync(path.join(H.RAIZ, 'firestore.rules'), 'utf8'));
  fs.writeFileSync(path.join(PASTA, 'firebase.json'), JSON.stringify({
    firestore: { rules: 'firestore.rules' },
    emulators: { auth: { host: '127.0.0.1', port: PORTA_AUTH }, firestore: { host: '127.0.0.1', port: PORTA_FS, websocketPort: PORTA_WS },
      hub: { host: '127.0.0.1', port: PORTA_HUB }, logging: { host: '127.0.0.1', port: PORTA_LOG }, ui: { enabled: false }, singleProjectMode: true }
  }));
  const env = Object.assign({}, process.env);
  if (JAVA_HOME) env.PATH = path.join(JAVA_HOME, 'bin') + path.delimiter + (env.PATH || env.Path || '');
  // no Linux o emulador vai num grupo de processos próprio, para sair inteiro (o java junto) no fim
  emulador = spawn(process.execPath, [FIREBASE, 'emulators:start', '--only', 'auth,firestore', '--project', PROJETO, '--non-interactive'],
    { cwd: PASTA, env, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' });
  let saida = '';
  emulador.stdout.on('data', d => { saida += d; });
  emulador.stderr.on('data', d => { saida += d; });
  emulador.on('exit', c => { emulador.saiu = c; });
  return esperar('o emulador respondeu', async () => {
    if (emulador.saiu !== undefined) throw new Error('o emulador saiu: ' + saida.slice(-600));
    const a = await fetch(AUTH + '/').then(r => r.json()).catch(() => null);
    const f = await fetch(FS + '/').then(r => r.status).catch(() => 0);
    return !!(a && a.authEmulator && a.authEmulator.ready) && f === 200;
  }, v => v === true, 120000);
}
// um emulador que já responde nas portas é de outra rodada: a prova falaria com ele (conta e catálogo dela)
async function portasLivres() {
  const a = await fetch(AUTH + '/').then(r => r.status).catch(() => 0);
  const f = await fetch(FS + '/').then(r => r.status).catch(() => 0);
  return a === 0 && f === 0;
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
// o fim de toda rodada derruba o emulador antes de sair (a rodada seguinte da fatia usa as mesmas portas)
const fim = () => derrubarEmulador().then(() => H.fim(amb)());
const conta = (email, senha) => fetch(AUTH + '/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake', { method: 'POST',
  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: senha, returnSecureToken: true }) }).then(r => r.json());

function publicar(uid) {
  const escrever = (nome, d) => { const p = path.join(TMP, nome); fs.writeFileSync(p, typeof d === 'string' ? d : JSON.stringify(d)); return p; };
  const classif = escrever('classificacao.csv', 'arquivo;resultado;motivo\nfica-a.pdf;FICA;teoria\nfica-b.pdf;FICA;teoria\nteoria-e.pdf;SO_TEORIA;livro do professor\n' +
    'sai-c.pdf;SAI;roteiro de sala\noutro-d.pdf;FICA;teoria\ninvalido-f.pdf;FICA;teoria\nigual-g.pdf;FICA;teoria\n');
  const env = Object.assign({}, process.env, { FIRESTORE_EMULATOR_HOST: '127.0.0.1:' + PORTA_FS, PYTHONIOENCODING: 'utf-8' });
  return spawnSync(PYTHON, ['-X', 'utf8', path.join(H.RAIZ, 'biblioteca', 'publicar_catalogo.py'), '--projeto', PROJETO, '--emulador', '--uid', uid,
    '--manifesto', escrever('vivos.json', { livros: VIVOS.map(comOrigem) }), '--classificacao', classif, '--agora', '2026-11-13T10:00:00-03:00',
    '--registro-ids', path.join(TMP, '_ids.json'), '--chaves', path.join(TMP, '_chaves'), '--primeira-publicacao', '--publicar'],
  { encoding: 'utf8', env, timeout: 120000 });
}

/* ---------- a página ---------- */
async function prepararPagina(pag) {
  pag.setDefaultTimeout(60000);
  await pag.evaluateOnNewDocument(() => {
    Object.defineProperty(Screen.prototype, 'width', { configurable: true, get: () => 1280 });
    Object.defineProperty(Screen.prototype, 'height', { configurable: true, get: () => 800 });
  });
  pag.errosDePagina = [];
  pag.on('pageerror', e => pag.errosDePagina.push(e.message));
  pag.on('dialog', async d => { try { await d.accept(); } catch (e) { /* ok */ } });
  await pag.evaluateOnNewDocument(cfg => { window.NUVEM_EMULADOR = cfg; }, CFG);
  // quem foi regravado em 'livros' (o put leva o Blob junto), e a falha de um lote quando a prova pede
  await pag.evaluateOnNewDocument(() => {
    const put0 = IDBObjectStore.prototype.put;
    window.__putsLivros = [];
    window.__falharPutDe = null;
    IDBObjectStore.prototype.put = function (v) {
      if (this.name === 'livros' && v && v.id) {
        window.__putsLivros.push(v.id);
        if (window.__falharPutDe === v.id) {
          const t = this.transaction;
          const r = put0.apply(this, arguments);
          t.abort();
          return r;
        }
      }
      return put0.apply(this, arguments);
    };
  });
  await pag.evaluateOnNewDocument(() => {
    const original = window.fetch;
    window.fetch = function (url) {
      if (String(url).indexOf('ibge') >= 0) return Promise.reject(new Error('sem rede para o IBGE neste teste'));
      return original.apply(this, arguments);
    };
  });
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
// o JSON cru de livros (sem o Blob, com o tamanho e o texto do Blob) e de livros_posicoes
const retrato = pag => pag.evaluate(() => new Promise((ok, falha) => {
  const q = indexedDB.open('apoio-educacional');
  q.onerror = () => falha(q.error);
  q.onsuccess = () => {
    const b = q.result; const tr = b.transaction(['livros', 'livros_posicoes'], 'readonly');
    const r = { livros: {}, posicoes: {}, blobs: {} };
    const lidos = [];
    tr.objectStore('livros').getAll().onsuccess = e => {
      e.target.result.forEach(x => {
        r.livros[x.id] = JSON.stringify(Object.assign({}, x, { blob: x.blob ? x.blob.size : null }));
        lidos.push(x.blob.text().then(t => { r.blobs[x.id] = t.slice(0, 20) + '|' + t.length; }));
      });
    };
    tr.objectStore('livros_posicoes').getAll().onsuccess = e => { e.target.result.forEach(p => { r.posicoes[p.id] = JSON.stringify(p); }); };
    tr.oncomplete = () => { b.close(); Promise.all(lidos).then(() => ok(r)); };
    tr.onerror = () => { b.close(); falha(tr.error); };
  };
}));
const dbDela = pag => pag.evaluate(() => Store.carregar().then(d => JSON.stringify((d.ajustes || {}).mapaDosLivros || null)));
// a defasagem da romul-c0: o mapa do meta do tablet contra o do catálogo (o vivo), nos livros que ficam
const MAPA_VIVO = {};
// comparado em forma canônica (chaves em ordem): o metaJson do catálogo vai com as chaves ordenadas
const canonico = v => Array.isArray(v) ? "[" + v.map(canonico).join(",") + "]" : v && typeof v === "object" ? "{" + Object.keys(v).sort().map(k => JSON.stringify(k) + ":" + canonico(v[k])).join(",") + "}" : JSON.stringify(v);
VIVOS.forEach(m => { MAPA_VIVO[m.id] = canonico(m.mapa); });
const FICAM = ['fica-a', 'fica-b', 'teoria-e'];
const defasados = r => FICAM.filter(id => {
  const l = JSON.parse(r.livros[id]);
  return canonico(l.meta.mapa.map(e => { const c = Object.assign({}, e); delete c.chave; return c; })) !== MAPA_VIVO[id];
});
const so = (r, id) => { const l = JSON.parse(r.livros[id]); delete l.meta; delete l.nuvem; return JSON.stringify(l); };

(async () => {
  secao('0. A prova se confere');
  conf('nenhum veneno desconhecido foi pedido', desconhecidos.join(','), '');
  for (const m of Object.keys(VENENOS)) {
    const [qual, de] = VENENOS[m];
    conf('a âncora de ' + m + ' aparece uma vez só', FONTES[qual][1].split(de).length - 1, 1);
  }
  conf('o firebase-tools está onde a prova procura (' + FIREBASE + ')', fs.existsSync(FIREBASE), true);
  const vj = /version "(\d+)/.exec(((r) => (r.stderr || '') + (r.stdout || ''))(spawnSync(JAVA_HOME ? path.join(JAVA_HOME, 'bin', 'java') : 'java', ['-version'], { encoding: 'utf8' })));
  conf('há um JDK 21 ou mais novo (' + (JAVA_HOME || 'java do PATH') + ')', !!vj && Number(vj[1]) >= 21, true);
  if (H.placar.falhas) return fim();

  conf('as portas do emulador estão livres (nenhum emulador de outra rodada responde nelas)', await portasLivres(), true);
  if (H.placar.falhas) return fim();
  const subiu = await subirEmulador();
  if (!subiu.ok) throw new Error('o emulador não subiu');
  const dona = await conta('dona@exemplo.test', 'senha-da-dona-1');
  conf('a conta de teste da dona existe no emulador', !!dona.localId, true);
  const p = publicar(dona.localId);
  conf('o publicador da 1b publicou os metas vivos no emulador (só FICA e SO_TEORIA)', p.status + '|' + /PUBLICADO: versão 1/.test(p.stdout) +
    '|' + /sai-c \(roteiro de sala\)/.test(p.stdout), '0|true|true');
  if (p.status !== 0) console.log(p.stdout + p.stderr);

  await amb.subir();
  const pag = await amb.pagina();
  await prepararPagina(pag);
  await pag.setViewport({ width: 1280, height: 800 });
  await H.abrirApp(pag, amb.ORIGEM);
  // o tablet sintético: os metas velhos, a posição e a correção dela
  const gravados = await pag.evaluate(async (velhos, bytes, correcoes) => {
    const c = await Store.gravarLivros({ manifest: { pacote: 'livros-prova-07-11', versao: 1 },
      livros: velhos.map(m => ({ meta: m, blob: new Blob([bytes[m.id]], { type: 'application/pdf' }) })) });
    for (const m of velhos) await Store.gravarPosicaoLivro({ id: m.id, pagina: 3, sha: m.hash });
    const d = await Store.carregar();
    d.ajustes = d.ajustes || {};
    d.ajustes.mapaDosLivros = correcoes;
    await Store.salvar(d);
    return c.novos;
  }, VELHOS, BYTES, CORRECOES);
  conf('o tablet sintético tem os sete livros, com os metas velhos', gravados, 7);
  await H.abrirApp(pag, amb.ORIGEM);
  conf('entrou na nuvem com a conta de teste da dona', await entrar(pag, 'dona@exemplo.test', 'senha-da-dona-1'), true);

  secao('1. Controle: a defasagem antes do toque, e nada sozinho na abertura');
  await H.abrirApp(pag, amb.ORIGEM);
  await pausa(8000);   // a janela em que a conferência na abertura rodaria, se estivesse ligada (o veneno a mostra nela)
  const antes = await retrato(pag);
  const dbAntes = await dbDela(pag);
  if (MODO === '--envenenado-liga-na-abertura') {
    conf('VENENO visto: os metas trocaram sozinhos na abertura', defasados(antes).length < 3, true);
    return fim();
  }
  conf('antes do toque, os três livros que ficam estão defasados', defasados(antes).join(','), 'fica-a,fica-b,teoria-e');

  secao('2. O toque em "Atualizar a biblioteca"');
  await H.irParaAba(pag, 'ajustes');
  await esperar('o botão da biblioteca na nuvem', () => existe(pag, '#livros-nuvem-atualizar'), v => v === true, 10000);
  await pag.evaluate(() => { window.__putsLivros = []; });
  await clicar(pag, '#livros-nuvem-atualizar');
  const linha = await esperar('a linha de Ajustes diz o que aconteceu', () => pag.evaluate(() => (document.querySelector('#livros-nuvem-estado') || {}).textContent || ''),
    v => /livros? com mapa novo/.test(v) && !/nenhum/.test(v), 30000);
  const depois = await retrato(pag);
  const puts = await pag.evaluate(() => window.__putsLivros.slice().sort().join(','));
  if (MODO === '--envenenado-regrava-o-igual') {
    conf('VENENO visto: o livro de meta igual foi regravado', puts.split(',').indexOf('igual-g') !== -1, true);
    return fim();
  }
  if (MODO === '--envenenado-troca-o-blob') {
    conf('VENENO visto: o Blob de um livro trocado foi regravado', depois.blobs['fica-a'] !== antes.blobs['fica-a'], true);
    return fim();
  }
  if (MODO === '--envenenado-solta-a-posicao') {
    conf('VENENO visto: a posição de leitura de um livro trocado sumiu', !depois.posicoes['fica-a'], true);
    return fim();
  }
  if (MODO === '--envenenado-aceita-meta-invalido') {
    conf('VENENO visto: o meta com o sumário fora do livro entrou', JSON.parse(depois.livros['invalido-f']).meta.sumario.length, 1);
    return fim();
  }
  conf('a ACEITAÇÃO: a defasagem nos livros que ficam vai a zero', defasados(depois).join(','), '');
  conf('o mapa novo leva a chave estável de cada capítulo', JSON.parse(depois.livros['fica-a']).meta.mapa.every(e => /^c[0-9a-f]{6}$/.test(e.chave)), true);
  conf('o SO_TEORIA ganhou so_teoria no meta; o FICA, não', JSON.parse(depois.livros['teoria-e']).meta.so_teoria + '|' + ('so_teoria' in JSON.parse(depois.livros['fica-a']).meta), 'true|false');
  conf('nenhum livro trocado foi regravado: Blob, bytes, pacote, versão e data de importação iguais', FICAM.every(id => so(depois, id) === so(antes, id) && depois.blobs[id] === antes.blobs[id]), true);
  conf('o registro anota o meta da nuvem que foi aplicado', JSON.parse(depois.livros['fica-a']).nuvem.metaVersao, 1);
  conf('só os três livros de mapa novo foram regravados (o de meta igual, não)', puts, 'fica-a,fica-b,teoria-e');
  conf('o livro de meta igual ficou byte a byte', depois.livros['igual-g'] === antes.livros['igual-g'], true);

  secao('3. O que não fica, ou não confere, fica como estava');
  conf('o livro SAI (fora do catálogo) ficou byte a byte', depois.livros['sai-c'] === antes.livros['sai-c'], true);
  conf('o livro de outro arquivo ficou byte a byte', depois.livros['outro-d'] === antes.livros['outro-d'], true);
  conf('o livro de meta inválido ficou byte a byte', depois.livros['invalido-f'] === antes.livros['invalido-f'], true);

  secao('4. A posição e o que ela gravou');
  conf('as posições de leitura ficaram byte a byte', JSON.stringify(depois.posicoes) === JSON.stringify(antes.posicoes), true);
  conf('o db dela (as correções do mapa) ficou byte a byte', await dbDela(pag), dbAntes);
  const valendo = await pag.evaluate(() => Store.lerLivro('fica-a').then(r => Store.carregar().then(d =>
    Biblioteca.mapaDoLivro(r.meta, d.ajustes.mapaDosLivros['fica-a']).map(e => e.n + ':' + e.estado + ':' + e.assuntos.join('+')).join(' '))));
  conf('a correção do capítulo de mesmo número e título segue valendo no mapa novo', valendo, '1:corrigido:MAT08-08 2:do_mapa:MAT08-15');

  secao('5. A linha de Ajustes e o segundo toque');
  conf('a linha diz quantos ganharam mapa novo, quantos chegam depois e quantos não puderam ser conferidos', linha.valor.replace(/\d\d:\d\d/, 'HH:MM'),
    'Biblioteca conferida hoje às HH:MM · 3 livros com mapa novo · 1 livro chega com a próxima versão · 1 livro não pôde ser conferido');
  conf('o estado da linha mora na chave do padrão apoio-educacional:', await pag.evaluate(() => !!localStorage.getItem('apoio-educacional:biblioteca-nuvem')), true);
  // no segundo toque, quem baixa de novo o documento do catálogo: só o de meta inválido (o igual ficou marcado)
  await pag.evaluate(() => {
    window.__baixados = [];
    const ler0 = Nuvem.lerLivroDoCatalogo;
    Nuvem.lerLivroDoCatalogo = function (id) { window.__baixados.push(id); return ler0.apply(this, arguments); };
    window.__putsLivros = [];
  });
  await clicar(pag, '#livros-nuvem-atualizar');
  const segunda = await esperar('o segundo toque', () => pag.evaluate(() => (document.querySelector('#livros-nuvem-estado') || {}).textContent || ''),
    v => /nenhum livro com mapa novo/.test(v), 30000);
  conf('o segundo toque não troca nada', segunda.ok + '|' + (JSON.stringify((await retrato(pag)).livros) === JSON.stringify(depois.livros)), 'true|true');
  conf('o segundo toque não regrava nada e só baixa de novo o livro de meta inválido', await pag.evaluate(() => window.__putsLivros.length + '|' + window.__baixados.join(',')), '0|invalido-f');
  conf('a Biblioteca não ganhou banner nenhum da nuvem', await pag.evaluate(() => /mapa novo|próxima versão/.test(document.querySelector('#tela-biblioteca') ? document.querySelector('#tela-biblioteca').innerText : '')), false);

  secao('6. As travas do Store: outro livro, outro formato, outro número de páginas');
  const SHA_C = hex(BYTES['sai-c']);
  const trava = (mudar) => pag.evaluate((sha, mudar) => Store.lerLivro('sai-c').then(r => {
    const m = JSON.parse(JSON.stringify(r.meta));
    Object.assign(m, mudar, { mapa: [{ n: 1, titulo: 'Mapa que não deveria entrar', pagina: 1, pagina_fim: 10, assuntos: [] }] });
    return Store.trocarMetaDaNuvem([{ id: 'sai-c', sha256: sha, meta: m, metaHash: 'f'.repeat(64), metaVersao: 9 }]);
  }).then(c => c.trocados.length + '|' + c.invalidos), SHA_C, mudar);
  const r6 = { id: await trava({ id: 'fica-a' }), formato: await trava({ formato: 'epub' }), paginas: await trava({ paginas: 12 }) };
  const depois6 = await retrato(pag);
  if (MODO === '--envenenado-store-aceita-outro-id') { conf('VENENO visto: o meta de outro livro entrou', r6.id, '1|0'); return fim(); }
  if (MODO === '--envenenado-aceita-outro-formato') { conf('VENENO visto: o meta de outro formato entrou', r6.formato, '1|0'); return fim(); }
  if (MODO === '--envenenado-aceita-outras-paginas') { conf('VENENO visto: o meta de outro número de páginas entrou', r6.paginas, '1|0'); return fim(); }
  conf('o meta de outro livro não entra', r6.id, '0|1');
  conf('o meta de outro formato não entra', r6.formato, '0|1');
  conf('o meta de outro número de páginas não entra', r6.paginas, '0|1');
  conf('o livro das travas ficou byte a byte', depois6.livros['sai-c'] === antes.livros['sai-c'], true);

  secao('7. A conferência recusa o mapa que não é lista de capítulos');
  const r7 = await pag.evaluate(async (base, sha) => {
    const um = async mapa => {
      const m = Object.assign({}, base, { mapa });
      if (mapa === undefined) delete m.mapa;
      const texto = JSON.stringify(m);
      const h = await Store.sha256Hex(texto);
      const c = Biblioteca.conferirMetaDaNuvem({ id: m.id, sha256: sha, tamanho: m.bytes, metaJson: texto, metaHash: h, metaVersao: 1 }, h);
      return c.meta ? 'ACEITO' : 'recusado';
    };
    return [await um([]), await um('nao sou lista'), await um([null]), await um([['dentro']])].join(',');
  }, VELHOS[3], SHA_C);
  if (MODO === '--envenenado-aceita-mapa-texto') { conf('VENENO visto: o mapa em texto passou', r7.split(',')[1], 'ACEITO'); return fim(); }
  conf('a lista vazia passa (controle); texto, null e lista dentro de lista, não', r7, 'ACEITO,recusado,recusado,recusado');

  secao('8. Em lotes: a falha de um lote não desfaz os anteriores');
  // oito livros no tablet; o catálogo (de mentira, na página) traz um meta novo para cada; o do lote-8 é o
  // documento de OUTRO livro com os hashes do índice ajustados, que só a conferência do id pega
  const gravados8 = await pag.evaluate(async (velhos, bytes, correcao) => {
    const c = await Store.gravarLivros({ manifest: { pacote: 'livros-prova-lote', versao: 1 },
      livros: velhos.map(m => ({ meta: m, blob: new Blob([bytes[m.id]], { type: 'application/pdf' }) })) });
    const d = await Store.carregar();
    d.ajustes.mapaDosLivros = Object.assign({}, d.ajustes.mapaDosLivros, { 'lote-1': correcao });
    await Store.salvar(d);
    return c.novos;
  }, LOTE_VELHOS, BYTES, CORRECAO_LOTE);
  conf('os oito livros do lote estão no tablet', gravados8, 8);
  await H.abrirApp(pag, amb.ORIGEM);
  await pag.evaluate(async (novos) => {
    const indice = { versao: 2, livros: {} }, docs = {};
    for (const m0 of novos) {
      const m = m0.id === 'lote-8' ? Object.assign({}, m0, { id: 'lote-9', arquivo: 'livros/lote-9.pdf' }) : m0;
      const texto = JSON.stringify(m);
      const h = await Store.sha256Hex(texto);
      const sha = m.hash.slice(7);
      docs[m0.id] = { id: m.id, sha256: sha, tamanho: m.bytes, metaJson: texto, metaHash: h, metaVersao: 2 };
      indice.livros[m0.id] = { sha256: sha, tamanho: m.bytes, metaHash: h, metaVersao: 2, formato: 'pdf' };
    }
    window.__entregues = [];
    const trocar0 = Store.trocarMetaDaNuvem;
    Store.trocarMetaDaNuvem = function (itens) {
      itens.forEach(it => window.__entregues.push(it.id + ':' + it.meta.id));
      return trocar0.apply(this, arguments);
    };
    Nuvem.lerCatalogo = () => Promise.resolve(indice);
    Nuvem.lerLivroDoCatalogo = id => Promise.resolve(docs[id] || null);
    window.__falharPutDe = 'lote-6';
  }, LOTE_NOVOS);
  await H.irParaAba(pag, 'ajustes');
  await esperar('o botão da biblioteca na nuvem', () => existe(pag, '#livros-nuvem-atualizar'), v => v === true, 10000);
  await clicar(pag, '#livros-nuvem-atualizar');
  const linha8 = await esperar('a linha do toque com a falha', () => pag.evaluate(() => (document.querySelector('#livros-nuvem-estado') || {}).textContent || ''),
    v => /próximo toque|livros? com mapa novo · /.test(v) && !/· 1 livro chega/.test(v), 30000);
  const r8 = await retrato(pag);
  const trocados8 = LOTE.filter(id => JSON.parse(r8.livros[id]).meta.mapa[0].titulo === 'Decimais').join(',');
  const entregues = await pag.evaluate(() => window.__entregues.join(','));
  if (MODO === '--envenenado-um-lote-so') { conf('VENENO visto: a falha de um lote desfez os anteriores', trocados8, ''); return fim(); }
  if (MODO === '--envenenado-app-aceita-outro-id') { conf('VENENO visto: o documento de outro livro chegou ao Store', /lote-8:lote-9/.test(entregues), true); return fim(); }
  conf('os cinco do primeiro lote ficaram trocados; os do lote que falhou, não', trocados8, 'lote-1,lote-2,lote-3,lote-4,lote-5');
  conf('o documento de outro livro nem chegou ao Store', entregues.split(',').filter(x => x.split(':')[0] !== x.split(':')[1]).join(','), '');
  conf('a linha diz os trocados, o não conferido, os que ficaram e a correção sem capítulo', linha8.valor.replace(/\d\d:\d\d/, 'HH:MM'),
    'Biblioteca conferida hoje às HH:MM · 5 livros com mapa novo · 1 livro não pôde ser conferido · 2 livros ficaram para o próximo toque · ' +
    '1 correção sua ficou sem capítulo; veja no livro');
  await pag.evaluate(() => { window.__falharPutDe = null; });
  await clicar(pag, '#livros-nuvem-atualizar');
  const linha8b = await esperar('o próximo toque troca os que ficaram', () => pag.evaluate(() => (document.querySelector('#livros-nuvem-estado') || {}).textContent || ''),
    v => /· 2 livros com mapa novo/.test(v), 30000);
  conf('o próximo toque troca os dois que ficaram', linha8b.ok, true);
  const r8b = await retrato(pag);
  conf('e agora os sete do lote estão trocados', LOTE.filter(id => JSON.parse(r8b.livros[id]).meta.mapa[0].titulo === 'Decimais').length, 7);

  secao('9. A entrada vencida pede para entrar de novo');
  await pag.evaluate(() => { const a = document.querySelector('#aviso-texto'); if (a) a.textContent = ''; });
  await pag.evaluate(() => { Nuvem.lerCatalogo = () => Promise.reject(Object.assign(new Error('venceu'), { codigo: 'TOKEN_EXPIRED' })); });
  await clicar(pag, '#livros-nuvem-atualizar');
  const aviso = await esperar('o aviso da entrada vencida', () => pag.evaluate(() => (document.querySelector('#aviso-texto') || {}).textContent || ''),
    v => /entr|Tente de novo/i.test(v), 15000);
  if (MODO === '--envenenado-vencida-pede-tente') { conf('VENENO visto: a entrada vencida diz "tente de novo"', /Tente de novo/.test(aviso.valor), true); return fim(); }
  conf('a entrada vencida pede para entrar de novo', aviso.valor, 'A entrada na nuvem venceu. Entre de novo para atualizar a biblioteca.');

  secao('10. Nenhum erro de página');
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
