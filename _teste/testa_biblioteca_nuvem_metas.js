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
 *      "1 livro chega com a próxima versão"), e um segundo toque não troca
 *      nada ("nenhum livro com mapa novo");
 *   6. nenhum erro de página.
 *
 * Venenos (a prova TEM de ver o defeito):
 *   --envenenado-troca-o-blob      a troca regrava o Blob (2);
 *   --envenenado-solta-a-posicao   a troca apaga a posição de leitura (4);
 *   --envenenado-aceita-meta-invalido  o meta que não passa na conferência
 *                                  entra (3);
 *   --envenenado-liga-na-abertura  a conferência roda sozinha na abertura (1).
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
const VENENOS = {
  '--envenenado-troca-o-blob': ['store', '            novo.meta = it.meta;\n', "            novo.meta = it.meta;\n            novo.blob = new Blob(['regravado']);\n"],
  '--envenenado-solta-a-posicao': ['store', "        var t = transacao(b, ['livros'], 'readwrite');\n        var dep = t.objectStore('livros');\n        var contas = { trocados: [],",
    "        var t = transacao(b, ['livros', 'livros_posicoes'], 'readwrite');\n        var dep = t.objectStore('livros');\n        (itens || []).forEach(function (it) { t.objectStore('livros_posicoes').delete(it.id); });\n        var contas = { trocados: [],"],
  '--envenenado-aceita-meta-invalido': ['app', '              if (!c.meta) { estado.invalidos++; return; }\n', '              if (!c.meta) c.meta = JSON.parse(doc.metaJson);\n'],
  '--envenenado-liga-na-abertura': ['app', 'var ATUALIZAR_BIBLIOTECA_NA_ABERTURA = false;', 'var ATUALIZAR_BIBLIOTECA_NA_ABERTURA = true;']
};
const MODO = Object.keys(VENENOS).filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && !VENENOS[a]);
const trocas = {};
if (MODO) {
  const [qual, de, para] = VENENOS[MODO];
  trocas[qual === 'store' ? '/store.js' : '/app.js'] = (qual === 'store' ? STORE : APP).split(de).join(para);
}
const amb = H.criarAmbiente(PORTA_APP, 'nath_metas_nuvem', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'metas_nuvem_'));

/* ---------- os livros sintéticos: o meta velho (o do tablet) e o vivo (o do catálogo) ---------- */
const BYTES = { 'fica-a': 'livro fica a ' + 'a'.repeat(900), 'fica-b': 'livro fica b ' + 'b'.repeat(700), 'teoria-e': 'livro teoria e ' + 'e'.repeat(600),
  'sai-c': 'livro sai c ' + 'c'.repeat(500), 'outro-d': 'livro outro d ' + 'd'.repeat(400), 'invalido-f': 'livro invalido f ' + 'f'.repeat(300) };
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
  meta('invalido-f')
];
const VIVOS = [
  meta('fica-a', { mapa: [cap(1, 'Proporcionalidade', 1, 5, ['MAT08-07']), cap(2, 'Volume e capacidade', 6, 10, ['MAT08-15'])], mapa_origem: 'mapa', mapa_nota: 'Do mapa vivo.' }),
  meta('fica-b', { mapa: [cap(1, 'Volumes', 2, 8, ['MAT08-15'])], mapa_origem: 'mapa', mapa_nota: 'Do mapa vivo.' }),
  meta('teoria-e', { mapa: [cap(1, 'Geometria', 1, 10, ['MAT08-13'])], mapa_origem: 'mapa', mapa_nota: 'Do mapa vivo.' }),
  meta('sai-c', { mapa: [cap(1, 'Roteiro de sala novo', 1, 10, [])], mapa_origem: 'mapa' }),
  Object.assign(meta('outro-d', { mapa: [cap(1, 'Funções novas', 1, 10, ['MAT08-06'])], mapa_origem: 'mapa' }), { hash: 'sha256:' + hex('outro arquivo de d'), bytes: 999 }),
  meta('invalido-f', { sumario: [{ n: 1, nivel: 1, titulo: 'Fora do livro', pagina: 999 }], sumario_origem: 'marcadores' })
];
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
  }, v => v === true, 120000);
}
function derrubarEmulador() {
  return new Promise(resolve => {
    if (!emulador || emulador.saiu !== undefined) { resolve(); return; }
    emulador.on('exit', () => resolve());
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(emulador.pid), '/T', '/F'], { stdio: 'ignore' });
    else emulador.kill('SIGINT');
    setTimeout(resolve, 8000);
  });
}
const conta = (email, senha) => fetch(AUTH + '/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake', { method: 'POST',
  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: senha, returnSecureToken: true }) }).then(r => r.json());

function publicar(uid) {
  const escrever = (nome, d) => { const p = path.join(TMP, nome); fs.writeFileSync(p, typeof d === 'string' ? d : JSON.stringify(d)); return p; };
  const classif = escrever('classificacao.csv', 'arquivo;resultado;motivo\nfica-a.pdf;FICA;teoria\nfica-b.pdf;FICA;teoria\nteoria-e.pdf;SO_TEORIA;livro do professor\n' +
    'sai-c.pdf;SAI;roteiro de sala\noutro-d.pdf;FICA;teoria\ninvalido-f.pdf;FICA;teoria\n');
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
    conf('a âncora de ' + m + ' aparece uma vez só', (qual === 'store' ? STORE : APP).split(de).length - 1, 1);
  }
  conf('o firebase-tools está onde a prova procura (' + FIREBASE + ')', fs.existsSync(FIREBASE), true);
  const vj = /version "(\d+)/.exec(((r) => (r.stderr || '') + (r.stdout || ''))(spawnSync(JAVA_HOME ? path.join(JAVA_HOME, 'bin', 'java') : 'java', ['-version'], { encoding: 'utf8' })));
  conf('há um JDK 21 ou mais novo (' + (JAVA_HOME || 'java do PATH') + ')', !!vj && Number(vj[1]) >= 21, true);
  if (H.placar.falhas) return H.fim(amb)();

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
  conf('o tablet sintético tem os seis livros, com os metas velhos', gravados, 6);
  await H.abrirApp(pag, amb.ORIGEM);
  conf('entrou na nuvem com a conta de teste da dona', await entrar(pag, 'dona@exemplo.test', 'senha-da-dona-1'), true);

  secao('1. Controle: a defasagem antes do toque, e nada sozinho na abertura');
  await H.abrirApp(pag, amb.ORIGEM);
  await pausa(8000);   // a janela em que a conferência na abertura rodaria, se estivesse ligada (o veneno a mostra nela)
  const antes = await retrato(pag);
  const dbAntes = await dbDela(pag);
  if (MODO === '--envenenado-liga-na-abertura') {
    conf('VENENO visto: os metas trocaram sozinhos na abertura', defasados(antes).length < 3, true);
    return H.fim(amb)();
  }
  conf('antes do toque, os três livros que ficam estão defasados', defasados(antes).join(','), 'fica-a,fica-b,teoria-e');

  secao('2. O toque em "Atualizar a biblioteca"');
  await H.irParaAba(pag, 'ajustes');
  await esperar('o botão da biblioteca na nuvem', () => existe(pag, '#livros-nuvem-atualizar'), v => v === true, 10000);
  await clicar(pag, '#livros-nuvem-atualizar');
  const linha = await esperar('a linha de Ajustes diz o que aconteceu', () => pag.evaluate(() => (document.querySelector('#livros-nuvem-estado') || {}).textContent || ''),
    v => /livros? com mapa novo/.test(v) && !/nenhum/.test(v), 30000);
  const depois = await retrato(pag);
  if (MODO === '--envenenado-troca-o-blob') {
    conf('VENENO visto: o Blob de um livro trocado foi regravado', depois.blobs['fica-a'] !== antes.blobs['fica-a'], true);
    return H.fim(amb)();
  }
  if (MODO === '--envenenado-solta-a-posicao') {
    conf('VENENO visto: a posição de leitura de um livro trocado sumiu', !depois.posicoes['fica-a'], true);
    return H.fim(amb)();
  }
  if (MODO === '--envenenado-aceita-meta-invalido') {
    conf('VENENO visto: o meta com o sumário fora do livro entrou', JSON.parse(depois.livros['invalido-f']).meta.sumario.length, 1);
    return H.fim(amb)();
  }
  conf('a ACEITAÇÃO: a defasagem nos livros que ficam vai a zero', defasados(depois).join(','), '');
  conf('o mapa novo leva a chave estável de cada capítulo', JSON.parse(depois.livros['fica-a']).meta.mapa.every(e => /^c[0-9a-f]{6}$/.test(e.chave)), true);
  conf('o SO_TEORIA ganhou so_teoria no meta; o FICA, não', JSON.parse(depois.livros['teoria-e']).meta.so_teoria + '|' + ('so_teoria' in JSON.parse(depois.livros['fica-a']).meta), 'true|false');
  conf('nenhum livro trocado foi regravado: Blob, bytes, pacote, versão e data de importação iguais', FICAM.every(id => so(depois, id) === so(antes, id) && depois.blobs[id] === antes.blobs[id]), true);
  conf('o registro anota o meta da nuvem que foi aplicado', JSON.parse(depois.livros['fica-a']).nuvem.metaVersao, 1);

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
  conf('a linha diz quantos ganharam mapa novo e quantos chegam depois', /^Biblioteca conferida hoje às \d\d:\d\d · 3 livros com mapa novo · 1 livro chega com a próxima versão$/.test(linha.valor), true);
  await clicar(pag, '#livros-nuvem-atualizar');
  const segunda = await esperar('o segundo toque', () => pag.evaluate(() => (document.querySelector('#livros-nuvem-estado') || {}).textContent || ''),
    v => /nenhum livro com mapa novo/.test(v), 30000);
  conf('o segundo toque não troca nada', segunda.ok + '|' + (JSON.stringify((await retrato(pag)).livros) === JSON.stringify(depois.livros)), 'true|true');
  conf('a Biblioteca não ganhou banner nenhum da nuvem', await pag.evaluate(() => /mapa novo|próxima versão/.test(document.querySelector('#tela-biblioteca') ? document.querySelector('#tela-biblioteca').innerText : '')), false);

  secao('6. Nenhum erro de página');
  conf('nenhum erro de página', pag.errosDePagina.join(' | '), '');
  return H.fim(amb)();
})().catch(e => { console.error('erro:', e && e.stack || e); H.placar.falhas++; return H.fim(amb)(); });

process.on('exit', () => {
  try { if (emulador && emulador.saiu === undefined && process.platform === 'win32') spawnSync('taskkill', ['/PID', String(emulador.pid), '/T', '/F'], { stdio: 'ignore' }); } catch (e) { /* ok */ }
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ }
});
