/* testa_publicador_arquivos.js
 *
 * Nuvem da biblioteca, PR 2: o publicador (biblioteca/publicar_catalogo.py)
 * sobe os ARQUIVOS dos livros e dos pacotes de exercícios ao Storage, pelo
 * sha256, CONTRA O EMULADOR do Storage, do Firestore e do Auth, nunca contra a
 * produção. Tudo é SINTÉTICO: os livros e os pacotes são bytes montados aqui,
 * numa pasta temporária, e as contas são de teste do emulador.
 *
 * O que se prova:
 *   1. fora do emulador, --bucket e --falhar-envio são recusados, a variável
 *      do emulador do Storage sem --emulador é recusada, e --ensaio com
 *      --publicar também;
 *   2. --ensaio só lista: quantos arquivos subiriam, o total em bytes e quais
 *      são novos; não grava NADA (nem no Storage, nem no Firestore, nem os
 *      registros no disco);
 *   3. a primeira publicação sobe tudo, cada objeto em
 *      usuarios/<uid>/livros/<sha256>.pdf|.epub ou usuarios/<uid>/pacotes/<sha256>.zip,
 *      com o tipo certo, o sha256 nos metadados e o md5 dos bytes; o catálogo
 *      ganha caminhoNuvem no livro e no índice, e o índice ganha pacotes
 *      {nome: {versao, sha256, tamanho, caminhoNuvem}}; o metaJson não muda
 *      (o caminho fica fora dele);
 *   4. NENHUM objeto tem token de download (firebaseStorageDownloadTokens);
 *   5. o privado só vai para a pasta da dona: nada fora de usuarios/<uid>/, e
 *      a pasta de outra conta fica vazia; a lista fechada do Storage recusa,
 *      antes de sair da máquina, o caminho de outra conta e o caminho fora
 *      dela;
 *   6. as versões velhas não sobem: do mesmo pacote, só o maior -vN; a
 *      subpasta (a cópia de segurança, mesmo com versão maior, e o ensaio)
 *      nunca é lida;
 *   7. a segunda publicação não sobe nada (idempotente): as mesmas gerações
 *      dos objetos e o catálogo igual;
 *   8. o arquivo trocado sobe como objeto novo, e o catálogo aponta para o
 *      hash novo; o pacote de versão nova também;
 *   9. a falha simulada no envio (toda tentativa cai na rede) deixa o catálogo
 *      e os registros exatamente como estavam; a falha que passa na segunda
 *      tentativa sobe e grava;
 *  10. o arquivo acima do limite (livro com 200 MiB e 1 byte, pacote com
 *      100 MiB e 1 byte) é recusado com o motivo, e nada sobe.
 *
 * Venenos (a prova TEM de ver o defeito e passa dizendo que viu):
 *   --envenenado-reenvia           a conferência do que já está no Storage some:
 *                                  a segunda publicação sobe tudo de novo (7);
 *   --envenenado-grava-token       o envio grava firebaseStorageDownloadTokens
 *                                  nos metadados (4);
 *   --envenenado-catalogo-antes    o catálogo é gravado antes de os arquivos
 *                                  subirem e serem conferidos: a falha do 9
 *                                  deixa o catálogo apontando para nada.
 *
 * Precisa do firebase-tools fora do repositório (FIREBASE_TOOLS) e de um JDK
 * 21 em JAVA_HOME, como o testa_publicador_catalogo.js; sem eles, REPROVA
 * dizendo onde procurou. Portas: 9061 (auth), 9062 (firestore), 9063
 * (storage), 9064 (hub), 9065 (log), 9066 (websocket).
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const PYTHON = process.env.PYTHON || 'python';
const FIREBASE = process.env.FIREBASE_TOOLS ||
  'C:/Users/romul/ferramentas/firebase-tools/node_modules/firebase-tools/lib/bin/firebase.js';
const JAVA_HOME = process.env.JAVA_HOME || '';
const PORTA_AUTH = 9061, PORTA_FS = 9062, PORTA_ST = 9063, PORTA_HUB = 9064, PORTA_LOG = 9065, PORTA_WS = 9066;
const PROJETO = 'demo-nath-arquivos';
const BUCKET = PROJETO + '.appspot.com';
const AUTH = 'http://127.0.0.1:' + PORTA_AUTH;
const FS = 'http://127.0.0.1:' + PORTA_FS;
const ST = 'http://127.0.0.1:' + PORTA_ST;
const DOCS = FS + '/v1/projects/' + PROJETO + '/databases/(default)/documents';

const PUBLICADOR = path.join(RAIZ, 'biblioteca', 'publicar_catalogo.py');
const FONTE = fs.readFileSync(PUBLICADOR, 'utf8').replace(/\r\n/g, '\n');
// cada veneno: o trecho do publicador (uma vez só) e a troca
const VENENOS = {
  '--envenenado-reenvia': ['            if existente is not None:\n', '            if False:\n'],
  '--envenenado-grava-token': ["'metadata': {'sha256': e['sha256']}", "'metadata': {'sha256': e['sha256'], 'firebaseStorageDownloadTokens': 'veneno-0000'}"],
  '--envenenado-catalogo-antes': ['            enviados = st.subir(faltam) if faltam else []\n            publicado = gravar_catalogo()\n',
    '            publicado = gravar_catalogo()\n            enviados = st.subir(faltam) if faltam else []\n']
};
const MODO = Object.keys(VENENOS).filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && !VENENOS[a]);

let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + String(obtido).slice(0, 600) + ' | esperado: ' + esperado + ']'));
  return ok;
}
const secao = t => console.log('\n=== ' + t + ' ===');
const pausa = ms => new Promise(r => setTimeout(r, ms));

/* ---------- o publicador, com o veneno por troca de texto num carregador ---------- */
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'publicador_arquivos_'));
const CARREGADOR = path.join(TMP, 'carregador.py');
const VENENO = MODO ? VENENOS[MODO] : null;
fs.writeFileSync(CARREGADOR, [
  'import json, sys, types',
  'caminho = ' + JSON.stringify(PUBLICADOR),
  'sys.path.insert(0, ' + JSON.stringify(path.join(RAIZ, 'biblioteca')) + ')',
  'texto = open(caminho, encoding="utf-8").read().replace("\\r\\n", "\\n")',
  'troca = json.loads(' + JSON.stringify(JSON.stringify(VENENO)) + ')',
  'if troca:',
  '    assert texto.count(troca[0]) == 1, "o ponto do veneno nao existe uma vez"',
  '    texto = texto.replace(troca[0], troca[1])',
  'm = types.ModuleType("publicar_catalogo")',
  'm.__file__ = caminho',
  'sys.modules["publicar_catalogo"] = m',
  'exec(compile(texto, caminho, "exec"), m.__dict__)',
  'if len(sys.argv) > 1 and sys.argv[1] == "--tentar-caminho":',
  '    s = m.Storage(sys.argv[2], "owner", sys.argv[3], sys.argv[4])',
  '    try:',
  '        s.metadados(sys.argv[5])',
  '        print("PEDIU")',
  '    except m.Recusa as e:',
  '        print("RECUSOU: " + str(e))',
  '    sys.exit(0)',
  'sys.exit(m.principal(sys.argv[1:]))', ''].join('\n'));

function publicador(args, comEmulador) {
  const env = Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8' });
  if (comEmulador !== false) {
    env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:' + PORTA_FS;
    env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:' + PORTA_ST;
  } else {
    delete env.FIRESTORE_EMULATOR_HOST;
    delete env.FIREBASE_STORAGE_EMULATOR_HOST;
  }
  const r = spawnSync(PYTHON, ['-X', 'utf8', CARREGADOR, '--projeto', PROJETO].concat(args), { encoding: 'utf8', env, timeout: 180000 });
  return { st: r.status, saida: (r.stdout || '') + (r.stderr || '') };
}

/* ---------- os arquivos sintéticos ---------- */
const hex = b => crypto.createHash('sha256').update(b).digest('hex');
const md5 = b => crypto.createHash('md5').update(b).digest('base64');
const LIVROS = path.join(TMP, 'livros');
const PACOTES = path.join(TMP, 'pacotes');
// a pasta "privada" sintética: a oficial (a vigente) e, ao lado, a cópia de segurança e o ensaio
const PRIVADO = path.join(TMP, 'privado', 'fonte-z', 'pacote');
const PRIVADO_OFICIAL = path.join(PRIVADO, 'oficial');
const grava = (p, bytes) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, bytes); return bytes; };
const bytes = (rotulo, n) => Buffer.from(rotulo + ' ' + crypto.createHash('sha256').update(rotulo).digest('hex').repeat(n));
const arqA = grava(path.join(LIVROS, 'Matematica', 'livro-a.pdf'), Buffer.concat([Buffer.from('%PDF-1.4\n'), bytes('livro a, primeira', 200)]));
let arqB = grava(path.join(LIVROS, 'Matematica', 'livro-b.epub'), bytes('livro b, primeira', 120));
const px1 = grava(path.join(PACOTES, 'prova-x-v1.zip'), bytes('pacote x v1', 50));
const px2 = grava(path.join(PACOTES, 'prova-x-v2.zip'), bytes('pacote x v2', 60));
const py1 = grava(path.join(PACOTES, 'prova-y-v1.zip'), bytes('pacote y v1', 40));
const px9 = grava(path.join(PACOTES, 'oficial-abc1234', 'prova-x-v9.zip'), bytes('pacote x v9 da copia', 30));
grava(path.join(PACOTES, 'leia-me.txt'), Buffer.from('não é pacote'));
const pz1 = grava(path.join(PRIVADO_OFICIAL, 'prova-z-v1.zip'), bytes('pacote z v1 oficial', 70));
const pzCopia = grava(path.join(PRIVADO, 'oficial-abc1234', 'prova-z-v1.zip'), bytes('pacote z v1 da copia', 70));
const pzEnsaio = grava(path.join(PRIVADO, 'ensaio', 'prova-z-v1.zip'), bytes('pacote z v1 do ensaio', 70));

function livro(id, arquivo, conteudo, extra) {
  return Object.assign({ id, formato: path.extname(arquivo).slice(1), arquivo: 'livros/' + id + path.extname(arquivo), hash: 'sha256:' + hex(conteudo),
    bytes: conteudo.length, titulo: 'Livro de prova ' + id, volume: null, materia: 'matematica', materia_nome: 'Matemática',
    segmento: 'Fundamental II', series: ['09'], paginas: 30, sumario: [], sumario_origem: 'mapa', mapa_origem: 'mapa', mapa: [],
    mapa_nota: 'Do mapa da orquestradora.', arquivo_origem: 'Matematica/' + arquivo }, extra || {});
}
const escrever = (nome, dados) => { const p = path.join(TMP, nome); fs.writeFileSync(p, typeof dados === 'string' ? dados : JSON.stringify(dados)); return p; };
const manifesto = (nome, livros) => escrever(nome, { esquema: 1, conteudo: 'livros', livros });
const CHAVES = path.join(TMP, '_chaves');
const IDS = path.join(TMP, '_ids.json');
const CLASSIF = escrever('classificacao.csv', 'id;resultado;motivo\nlivro-a;FICA;teoria\nlivro-b;FICA;teoria\nlivro-g;FICA;teoria\n');
let uid = 'donaDeTeste';
const comuns = () => ['--emulador', '--uid', uid, '--bucket', BUCKET, '--agora', '2026-11-14T10:00:00-03:00', '--chaves', CHAVES,
  '--registro-ids', IDS, '--classificacao', CLASSIF, '--livros', LIVROS, '--pacotes', PACOTES, '--pacotes', PRIVADO_OFICIAL];

/* ---------- o emulador ---------- */
const PASTA = path.join(TMP, 'emulador');
let emulador = null;
function subirEmulador() {
  fs.mkdirSync(PASTA, { recursive: true });
  fs.writeFileSync(path.join(PASTA, 'firestore.rules'), fs.readFileSync(path.join(RAIZ, 'firestore.rules'), 'utf8'));
  // o publicador entra como administrador e passa por cima das regras; estas negam tudo ao aplicativo
  fs.writeFileSync(path.join(PASTA, 'storage.rules'), "rules_version = '2';\nservice firebase.storage {\n  match /b/{bucket}/o {\n    match /{tudo=**} {\n      allow read, write: if false;\n    }\n  }\n}\n");
  fs.writeFileSync(path.join(PASTA, 'firebase.json'), JSON.stringify({
    firestore: { rules: 'firestore.rules' },
    storage: { rules: 'storage.rules' },
    emulators: { auth: { host: '127.0.0.1', port: PORTA_AUTH }, firestore: { host: '127.0.0.1', port: PORTA_FS, websocketPort: PORTA_WS },
      storage: { host: '127.0.0.1', port: PORTA_ST },
      hub: { host: '127.0.0.1', port: PORTA_HUB }, logging: { host: '127.0.0.1', port: PORTA_LOG }, ui: { enabled: false }, singleProjectMode: true }
  }));
  const env = Object.assign({}, process.env);
  if (JAVA_HOME) env.PATH = path.join(JAVA_HOME, 'bin') + path.delimiter + (env.PATH || env.Path || '');
  emulador = spawn(process.execPath, [FIREBASE, 'emulators:start', '--only', 'auth,firestore,storage', '--project', PROJETO, '--non-interactive'],
    { cwd: PASTA, env, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' });
  let saida = '';
  emulador.stdout.on('data', d => { saida += d; });
  emulador.stderr.on('data', d => { saida += d; });
  emulador.on('exit', c => { emulador.saiu = c; });
  return (async () => {
    const fim = Date.now() + 180000;
    while (Date.now() < fim) {
      if (emulador.saiu !== undefined) throw new Error('o emulador saiu: ' + saida.slice(-1500));
      const a = await fetch(AUTH + '/').then(r => r.json()).catch(() => null);
      const f = await fetch(FS + '/').then(r => r.status).catch(() => 0);
      const s = await fetch(ST + '/').then(r => r.status).catch(() => 0);
      if (a && a.authEmulator && a.authEmulator.ready && f === 200 && s > 0 && /All emulators ready/i.test(saida)) return;
      await pausa(500);
    }
    console.log(saida.slice(-1500));
    throw new Error('o emulador não subiu');
  })();
}
// um emulador que já responde nas portas é de outra rodada: a prova falaria com ele
async function portasLivres() {
  for (const u of [AUTH, FS, ST]) if (await fetch(u + '/').then(r => r.status).catch(() => 0)) return false;
  return true;
}
function derrubarEmulador() {
  return new Promise(resolve => {
    if (!emulador || emulador.saiu !== undefined) { resolve(); return; }
    emulador.on('exit', () => resolve());
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(emulador.pid), '/T', '/F'], { stdio: 'ignore' });
    else { try { process.kill(-emulador.pid, 'SIGINT'); } catch (e) { /* já saiu */ } }
    setTimeout(() => { if (process.platform !== 'win32') { try { process.kill(-emulador.pid, 'SIGKILL'); } catch (e) { /* já saiu */ } } resolve(); }, 8000);
  });
}

/* ---------- REST: Auth, Firestore e Storage (como administrador) ---------- */
async function rest(url, opcoes) {
  opcoes = opcoes || {};
  const cab = {};
  let corpo = opcoes.corpo;
  if (corpo !== undefined) { corpo = JSON.stringify(corpo); cab['Content-Type'] = 'application/json'; }
  if (opcoes.token) cab.Authorization = 'Bearer ' + opcoes.token;
  const r = await fetch(url, { method: opcoes.metodo || (corpo !== undefined ? 'POST' : 'GET'), headers: cab, body: corpo });
  const texto = await r.text();
  let json = null;
  try { json = texto ? JSON.parse(texto) : null; } catch (e) { json = null; }
  return { status: r.status, json };
}
const conta = (email) => rest(AUTH + '/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake',
  { corpo: { email, password: 'senha-de-teste-1', returnSecureToken: true } }).then(r => r.json);
const doc = (caminho) => rest(DOCS + '/' + caminho, { token: 'owner' });
const valor = v => v.stringValue !== undefined ? v.stringValue : v.integerValue !== undefined ? Number(v.integerValue) : v.nullValue !== undefined ? null :
  v.mapValue ? Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, valor(x)])) :
  v.arrayValue ? (v.arrayValue.values || []).map(valor) : v.booleanValue !== undefined ? v.booleanValue : v;
const campos = d => d && d.json && d.json.fields ? Object.fromEntries(Object.entries(d.json.fields).map(([k, x]) => [k, valor(x)])) : null;
const indice = async () => campos(await doc('usuarios/' + uid + '/config/catalogo'));
const livroDoc = async id => campos(await doc('usuarios/' + uid + '/catalogo/' + id));
const retrato = async () => {
  const lista = await rest(DOCS + '/usuarios/' + uid + '/catalogo?pageSize=50', { token: 'owner' });
  const i = await doc('usuarios/' + uid + '/config/catalogo');
  return { indice: i.status === 200 ? i.json.updateTime + '|' + JSON.stringify(campos(i)) : 'nenhum',
    livros: ((lista.json && lista.json.documents) || []).map(d => d.name.split('/').pop() + '@' + d.updateTime).sort().join(','),
    ids: fs.existsSync(IDS) ? fs.readFileSync(IDS, 'utf8') : 'nenhum' };
};
// todos os objetos do bucket (o emulador lista para o administrador), com a geração e os metadados
async function objetos(prefixo) {
  const r = await rest(ST + '/storage/v1/b/' + BUCKET + '/o' + (prefixo ? '?prefix=' + encodeURIComponent(prefixo) : ''), { token: 'owner' });
  return ((r.json && r.json.items) || []).map(o => ({ name: o.name, generation: o.generation, size: Number(o.size), contentType: o.contentType,
    md5Hash: o.md5Hash, metadata: o.metadata || {} })).sort((x, y) => x.name < y.name ? -1 : 1);
}
const geracoes = async () => (await objetos()).map(o => o.name + '@' + o.generation).join(',');
const comToken = async () => (await objetos()).filter(o => 'firebaseStorageDownloadTokens' in o.metadata).map(o => o.name);
const noLivro = (sha, ext) => 'usuarios/' + uid + '/livros/' + sha + '.' + ext;
const noPacote = sha => 'usuarios/' + uid + '/pacotes/' + sha + '.zip';

(async () => {
  secao('0. A prova se confere');
  conf('nenhum veneno desconhecido foi pedido', desconhecidos.join(','), '');
  for (const m of Object.keys(VENENOS)) conf('a âncora de ' + m + ' aparece uma vez só no publicador', FONTE.split(VENENOS[m][0]).length - 1, 1);
  conf('o firebase-tools está onde a prova procura (' + FIREBASE + ')', fs.existsSync(FIREBASE), true);
  const javaExe = JAVA_HOME ? path.join(JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java';
  const vj = /version "(\d+)/.exec(((r) => (r.stderr || '') + (r.stdout || ''))(spawnSync(javaExe, ['-version'], { encoding: 'utf8' })));
  conf('há um JDK 21 ou mais novo (' + (JAVA_HOME || 'java do PATH') + ')', !!vj && Number(vj[1]) >= 21, true);
  conf('o bucket da produção é o decidido', /^BUCKET = 'nw-apoio-educacional\.firebasestorage\.app'$/m.test(FONTE), true);
  conf('o publicador não chama API que cria token de download', /createDownloadToken|\/v0\/b\//.test(FONTE), false);
  if (falhas) return fim();

  secao('1. Fora do emulador, as portas de teste fecham');
  const M0 = manifesto('m0.json', [livro('livro-a', 'livro-a.pdf', arqA)]);
  let r = publicador(['--manifesto', M0, '--bucket', BUCKET, '--uid-arquivo', path.join(TMP, 'nao-existe')], false);
  conf('sem --emulador, --bucket é recusado', r.st + '|' + /só valem com --emulador/.test(r.saida), '2|true');
  r = publicador(['--manifesto', M0, '--falhar-envio', '3', '--uid-arquivo', path.join(TMP, 'nao-existe')], false);
  conf('sem --emulador, --falhar-envio é recusado', r.st + '|' + /só valem com --emulador/.test(r.saida), '2|true');
  const soStorage = Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8', FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:' + PORTA_ST });
  delete soStorage.FIRESTORE_EMULATOR_HOST;
  const x1 = spawnSync(PYTHON, ['-X', 'utf8', CARREGADOR, '--projeto', PROJETO, '--manifesto', M0], { encoding: 'utf8', env: soStorage });
  r = { st: x1.status, saida: (x1.stdout || '') + (x1.stderr || '') };
  conf('a variável do emulador do Storage sem --emulador é recusada', r.st + '|' + /FIREBASE_STORAGE_EMULATOR_HOST está no ambiente sem --emulador/.test(r.saida), '2|true');
  r = publicador(['--manifesto', M0, '--ensaio', '--publicar'].concat(comuns()));
  conf('--ensaio com --publicar é recusado', r.st + '|' + /escolha um/.test(r.saida), '2|true');

  if (!(await portasLivres())) { conf('as portas 9061 a 9063 estão livres (outro emulador responderia no lugar)', false, true); return fim(); }
  await subirEmulador();
  const dona = await conta('dona@exemplo.test');
  const outra = await conta('outra@exemplo.test');
  conf('as contas de teste existem no emulador', !!(dona.localId && outra.localId), true);
  uid = dona.localId;

  const M1 = manifesto('m1.json', [livro('livro-a', 'livro-a.pdf', arqA), livro('livro-b', 'livro-b.epub', arqB)]);
  const ESPERADOS = [noLivro(hex(arqA), 'pdf'), noLivro(hex(arqB), 'epub'), noPacote(hex(px2)), noPacote(hex(py1)), noPacote(hex(pz1))].sort();

  secao('2. --ensaio só lista, e não grava nada');
  r = publicador(['--manifesto', M1, '--ensaio', '--primeira-publicacao'].concat(comuns()));
  const total1 = arqA.length + arqB.length + px2.length + py1.length + pz1.length;
  conf('o ensaio sai bem e diz quantos arquivos subiriam e o total', r.st + '|' + new RegExp('5 arquivo\\(s\\) novos a enviar, ' + total1 + ' bytes').test(r.saida) +
    '|' + /ENSAIO: nada foi gravado/.test(r.saida), '0|true|true');
  conf('e lista quais são os novos (livros e pacotes, pela versão vigente)', ['livro livro-a', 'livro livro-b', 'pacote prova-x v2', 'pacote prova-y v1', 'pacote prova-z v1']
    .every(x => r.saida.indexOf('    - ' + x + ':') !== -1) + '|' + /pacote prova-x v1|prova-x v9/.test(r.saida), 'true|false');
  conf('nada no Storage', (await objetos()).length, 0);
  conf('nada no Firestore e nenhum registro no disco', JSON.stringify(await retrato()), JSON.stringify({ indice: 'nenhum', livros: '', ids: 'nenhum' }));
  conf('e a pasta das chaves não nasceu', fs.existsSync(CHAVES), false);

  secao('3. A primeira publicação sobe tudo e grava o caminho, o hash e o tamanho');
  r = publicador(['--manifesto', M1, '--publicar', '--primeira-publicacao'].concat(comuns()));
  if (MODO === '--envenenado-grava-token') {
    conf('VENENO visto: o envio gravou o token de download nos metadados', (await comToken()).length > 0, true);
    return fim();
  }
  conf('publicado, com os 5 arquivos enviados', r.st + '|' + /ARQUIVOS: 5 enviado\(s\) ao Storage/.test(r.saida) + '|' + /PUBLICADO: versão 1, 3 escrita\(s\) em 1 commit/.test(r.saida),
    '0|true|true');
  const obj3 = await objetos();
  conf('os objetos são exatamente os 5 esperados, pelo sha256', obj3.map(o => o.name).join(','), ESPERADOS.join(','));
  const porNome = Object.fromEntries(obj3.map(o => [o.name, o]));
  const conferido = (nome, b, tipo) => { const o = porNome[nome] || {}; return [o.size === b.length, o.contentType, o.metadata.sha256 === hex(b), o.md5Hash === md5(b)].join('|'); };
  conf('o PDF: tamanho, tipo, sha256 nos metadados e md5', conferido(noLivro(hex(arqA), 'pdf'), arqA), 'true|application/pdf|true|true');
  conf('o EPUB: tamanho, tipo, sha256 nos metadados e md5', conferido(noLivro(hex(arqB), 'epub'), arqB), 'true|application/epub+zip|true|true');
  conf('o pacote: tamanho, tipo, sha256 nos metadados e md5', conferido(noPacote(hex(px2)), px2), 'true|application/zip|true|true');
  const i3 = await indice();
  const a3 = await livroDoc('livro-a');
  conf('o índice e o documento do livro ganham caminhoNuvem, com o sha256 e o tamanho do arquivo',
    [i3.livros['livro-a'].caminhoNuvem, i3.livros['livro-a'].sha256, i3.livros['livro-a'].tamanho, a3.caminhoNuvem, a3.sha256, a3.tamanho].join('|'),
    [noLivro(hex(arqA), 'pdf'), hex(arqA), arqA.length, noLivro(hex(arqA), 'pdf'), hex(arqA), arqA.length].join('|'));
  conf('o caminho fica FORA do metaJson (o metaHash não muda por ele)', ('caminhoNuvem' in JSON.parse(a3.metaJson)) + '|' + (a3.metaHash === hex(Buffer.from(a3.metaJson))), 'false|true');
  conf('o índice ganha os pacotes, cada um na versão vigente, com o sha256, o tamanho e o caminho',
    JSON.stringify(Object.fromEntries(Object.entries(i3.pacotes).map(([k, v]) => [k, [v.versao, v.sha256, v.tamanho, v.caminhoNuvem].join('|')]))),
    JSON.stringify({ 'prova-x': [2, hex(px2), px2.length, noPacote(hex(px2))].join('|'), 'prova-y': [1, hex(py1), py1.length, noPacote(hex(py1))].join('|'),
      'prova-z': [1, hex(pz1), pz1.length, noPacote(hex(pz1))].join('|') }));

  secao('4. Nenhum token de download');
  conf('nenhum objeto tem firebaseStorageDownloadTokens nos metadados', (await comToken()).join(','), '');

  secao('5. O privado só vai para a pasta da dona');
  conf('nada fora de usuarios/<uid>/', obj3.filter(o => !o.name.startsWith('usuarios/' + uid + '/')).length, 0);
  conf('o pacote da pasta privada está só em usuarios/<uid>/pacotes/', obj3.filter(o => o.metadata.sha256 === hex(pz1)).map(o => o.name).join(','), noPacote(hex(pz1)));
  conf('a pasta de outra conta está vazia', (await objetos('usuarios/' + outra.localId + '/')).length, 0);
  const tenta = c => spawnSync(PYTHON, ['-X', 'utf8', CARREGADOR, '--tentar-caminho', BUCKET, uid, '127.0.0.1:' + PORTA_ST, c], { encoding: 'utf8' }).stdout || '';
  conf('a lista fechada recusa o caminho de outra conta antes de sair da máquina',
    /^RECUSOU: caminho do Storage fora da lista fechada/.test(tenta('usuarios/' + outra.localId + '/pacotes/' + hex(pz1) + '.zip')), true);
  conf('e o caminho fora dela (outra pasta, nome que não é sha256)', [tenta('usuarios/' + uid + '/registros/x'), tenta('usuarios/' + uid + '/livros/x.pdf'),
    tenta('publico/' + hex(pz1) + '.zip')].every(s => /^RECUSOU:/.test(s)), true);

  secao('6. As versões velhas não sobem');
  conf('a versão velha do mesmo pacote na mesma pasta não subiu', obj3.some(o => o.metadata.sha256 === hex(px1)), false);
  conf('a subpasta de cópia de segurança, mesmo com versão maior, nunca é lida', obj3.some(o => o.metadata.sha256 === hex(px9)), false);
  conf('a cópia de segurança e o ensaio do pacote privado não subiram', obj3.some(o => [hex(pzCopia), hex(pzEnsaio)].indexOf(o.metadata.sha256) !== -1), false);
  conf('o relatório diz que as versões antigas e as subpastas ficaram de fora',
    /1 versão\(ões\) antiga\(s\) ficam de fora/.test(r.saida) + '|' + /1 subpasta\(s\) não lida\(s\)/.test(r.saida), 'true|true');

  secao('7. A segunda publicação não sobe nada');
  const g7 = await geracoes();
  const antes7 = await retrato();
  r = publicador(['--manifesto', M1, '--publicar'].concat(comuns()));
  if (MODO === '--envenenado-reenvia') {
    conf('VENENO visto: sem a conferência do que já está lá, tudo subiu de novo', (await geracoes()) !== g7 && /ARQUIVOS: 5 enviado\(s\)/.test(r.saida), true);
    return fim();
  }
  conf('nada enviado, nada mudaria', r.st + '|' + /ARQUIVOS: 0 enviado\(s\) ao Storage; 0 a enviar \(0 bytes\); 5 já estavam lá/.test(r.saida) + '|' + /nada mudaria/.test(r.saida), '0|true|true');
  conf('os objetos ficaram com as mesmas gerações', await geracoes(), g7);
  conf('o catálogo e os registros ficaram iguais', JSON.stringify(await retrato()), JSON.stringify(antes7));

  secao('8. O arquivo trocado sobe como objeto novo, e o catálogo aponta para o hash novo');
  const arqB1 = arqB;
  arqB = grava(path.join(LIVROS, 'Matematica', 'livro-b.epub'), bytes('livro b, segunda', 130));
  const py2 = grava(path.join(PACOTES, 'prova-y-v2.zip'), bytes('pacote y v2', 45));
  const M2 = manifesto('m2.json', [livro('livro-a', 'livro-a.pdf', arqA), livro('livro-b', 'livro-b.epub', arqB)]);
  r = publicador(['--manifesto', M2, '--ensaio'].concat(comuns()));
  conf('o ensaio vê só os 2 novos, e não grava', r.st + '|' + new RegExp('2 arquivo\\(s\\) novos a enviar, ' + (arqB.length + py2.length) + ' bytes').test(r.saida) +
    '|' + (await geracoes() === g7), '0|true|true');
  r = publicador(['--manifesto', M2, '--publicar'].concat(comuns()));
  conf('publicado, com 2 enviados', r.st + '|' + /ARQUIVOS: 2 enviado\(s\)/.test(r.saida) + '|' + /livro-b: arquivo trocado/.test(r.saida), '0|true|true');
  const i8 = await indice();
  const b8 = await livroDoc('livro-b');
  conf('o livro aponta para o hash novo, no índice e no documento', [i8.livros['livro-b'].sha256, i8.livros['livro-b'].caminhoNuvem, b8.sha256, b8.caminhoNuvem, b8.tamanho].join('|'),
    [hex(arqB), noLivro(hex(arqB), 'epub'), hex(arqB), noLivro(hex(arqB), 'epub'), arqB.length].join('|'));
  const nomes8 = (await objetos()).map(o => o.name);
  conf('o objeto novo existe, e o velho continua (nada é sobrescrito nem apagado)',
    (nomes8.indexOf(noLivro(hex(arqB), 'epub')) !== -1) + '|' + (nomes8.indexOf(noLivro(hex(arqB1), 'epub')) !== -1), 'true|true');
  conf('o pacote de versão nova também, no índice', [i8.pacotes['prova-y'].versao, i8.pacotes['prova-y'].sha256].join('|'), '2|' + hex(py2));
  const so = (ret, id) => ret.livros.split(',').filter(x => x.startsWith(id + '@'))[0];
  conf('e o livro que não mudou não foi regravado', so(await retrato(), 'livro-a'), so(antes7, 'livro-a'));

  secao('9. A falha no envio deixa o catálogo como estava');
  const arqA2 = grava(path.join(LIVROS, 'Matematica', 'livro-a.pdf'), Buffer.concat([Buffer.from('%PDF-1.4\n'), bytes('livro a, segunda', 210)]));
  const M3 = manifesto('m3.json', [livro('livro-a', 'livro-a.pdf', arqA2), livro('livro-b', 'livro-b.epub', arqB)]);
  const antes9 = await retrato();
  r = publicador(['--manifesto', M3, '--publicar', '--falhar-envio', '99'].concat(comuns()));
  if (MODO === '--envenenado-catalogo-antes') {
    const i9 = await indice();
    conf('VENENO visto: o catálogo foi gravado antes do envio, e aponta para um objeto que não está lá',
      i9.livros['livro-a'].sha256 === hex(arqA2) && (await objetos()).every(o => o.name !== i9.livros['livro-a'].caminhoNuvem), true);
    return fim();
  }
  conf('o envio que cai em toda tentativa é recusa, dita', r.st + '|' + /falhou 5 vezes/.test(r.saida) + '|' + /o catálogo NÃO foi gravado/.test(r.saida), '2|true|true');
  conf('o catálogo e os registros ficaram exatamente como estavam', JSON.stringify(await retrato()), JSON.stringify(antes9));
  conf('e o objeto pela metade não existe', (await objetos()).some(o => o.name === noLivro(hex(arqA2), 'pdf')), false);
  r = publicador(['--manifesto', M3, '--publicar', '--falhar-envio', '1'].concat(comuns()));
  conf('a falha que passa na segunda tentativa sobe e grava', r.st + '|' + /ARQUIVOS: 1 enviado\(s\)/.test(r.saida) + '|' + ((await indice()).livros['livro-a'].sha256 === hex(arqA2)), '0|true|true');
  const o9 = (await objetos()).filter(o => o.name === noLivro(hex(arqA2), 'pdf'))[0] || {};
  conf('e o objeto refeito confere (tamanho e md5)', (o9.size === arqA2.length) + '|' + (o9.md5Hash === md5(arqA2)), 'true|true');

  secao('10. Acima do limite, recusa e nada sobe');
  const antes10 = await retrato(), g10 = await geracoes();
  const grande = path.join(LIVROS, 'Matematica', 'livro-g.pdf');
  fs.closeSync(fs.openSync(grande, 'w'));
  fs.truncateSync(grande, 200 * 1024 * 1024 + 1);
  r = publicador(['--manifesto', manifesto('m4.json', [livro('livro-a', 'livro-a.pdf', arqA2), livro('livro-b', 'livro-b.epub', arqB),
    livro('livro-g', 'livro-g.pdf', Buffer.from('x'), { bytes: 200 * 1024 * 1024 + 1 })]), '--publicar'].concat(comuns()));
  conf('o livro com 200 MiB e 1 byte é recusado, com o motivo', r.st + '|' + /livro-g tem 209715201 bytes, acima do limite de 209715200 \(200 MiB\); não sobe/.test(r.saida), '2|true');
  fs.unlinkSync(grande);
  const enorme = path.join(PACOTES, 'prova-w-v1.zip');
  fs.closeSync(fs.openSync(enorme, 'w'));
  fs.truncateSync(enorme, 100 * 1024 * 1024 + 1);
  r = publicador(['--manifesto', M3, '--publicar'].concat(comuns()));
  conf('o pacote com 100 MiB e 1 byte é recusado, com o motivo', r.st + '|' + /prova-w v1 tem 104857601 bytes, acima do limite de 104857600 \(100 MiB\); não sobe/.test(r.saida), '2|true');
  fs.unlinkSync(enorme);
  conf('nada subiu e o catálogo ficou igual', (await geracoes() === g10) + '|' + (JSON.stringify(await retrato()) === JSON.stringify(antes10)), 'true|true');

  conf('no fim, nenhum objeto tem token de download', (await comToken()).join(','), '');
  if (MODO) conf('o veneno pedido foi visto pela seção dele', 'não visto', 'visto');
  return fim();
})().catch(e => { console.error('erro:', e && e.stack || e); falhas++; return fim(); });

async function fim() {
  await derrubarEmulador();
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* o log do emulador pode estar preso */ }
  if (MODO) console.log('\nmodo ' + MODO);
  console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
  process.exit(falhas || !passes ? 1 : 0);
}
