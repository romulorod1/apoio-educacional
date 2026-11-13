/* testa_publicador_catalogo.js
 *
 * Fase 1b da biblioteca na nuvem: o publicador do catálogo
 * (biblioteca/publicar_catalogo.py) e as regras do catálogo (firestore.rules),
 * CONTRA O EMULADOR do Firestore e do Auth, nunca contra a produção. Livros
 * SINTÉTICOS (só manifests: nenhum PDF), três contas de teste do emulador,
 * nenhuma conta de verdade e nenhum segredo.
 *
 * O que se prova:
 *   1. sem --publicar, nada é gravado (o padrão é o relatório);
 *   2. --publicar grava os livros e o índice num commit só; o metaJson leva o
 *      meta do livro com a chave estável em cada capítulo e a tabela de
 *      herança; os registros de ids e de chaves são gravados;
 *   3. publicar de novo sem mudança não escreve nada (os documentos ficam com
 *      a mesma hora de gravação);
 *   4. mudar o mapa de um livro escreve só aquele livro e o índice, com a
 *      versão do índice e a do meta subindo, e as chaves de antes mantidas;
 *   5. a falha no meio do lote (forçada no emulador) deixa TUDO na versão
 *      anterior: o índice e os livros;
 *   6. recusas, sem gravar nada: o mesmo arquivo com outro id; o livro
 *      publicado que some sem --retirar; a troca de formato fora de
 *      trocas_de_arquivo.json; o assunto do mapa fora do banco; e o caminho
 *      fora da lista fechada, recusado antes de sair da máquina;
 *   7. --retirar marca o livro como retirado (nada sai do aparelho) e a troca
 *      de formato listada passa;
 *   8. a classificação do acervo (decisão do dono de 13/11): FICA e SO_TEORIA vão (este com so_teoria no meta);
 *      SAI, DÚVIDA e o ausente ficam de fora, listados pelo motivo (no formato
 *      da lista de verdade, com ";" e pelo nome do arquivo);
 *   9. as regras: a dona logada LÊ o catálogo e recebe PERMISSION_DENIED ao
 *      escrever config/catalogo e catalogo/x (o caminho irmão do
 *      config/leitores não herda a escrita dela); o observador lê; uma
 *      terceira conta não lê;
 *  10. fora do emulador, o publicador recusa --uid, --agora e --falhar-no-lote,
 *      e sem o gcloud por caminho absoluto não pede token a ninguém.
 *
 * Venenos (a prova TEM de ver o defeito e passa dizendo que viu):
 *   --envenenado-aceita-id-trocado   o publicador aceita o mesmo arquivo com
 *                                    outro id (6);
 *   --envenenado-escreve-fora-da-lista  a lista fechada de caminhos some (6);
 *   --envenenado-dois-lotes          cada escrita num commit: a falha do 5
 *                                    deixa livros gravados;
 *   --envenenado-regra-herda-escrita a regra do config/catalogo deixa a dona
 *                                    escrever (9);
 *   --envenenado-repetido-ultima-vence  na classificação repetida, a última
 *                                    linha vence: o SAI seguido de FICA entra (8);
 *   --envenenado-nome-cortado        a classificação casa pelo começo do
 *                                    nome: os volumes compridos se confundem (8);
 *   --envenenado-registro-vazio-passa  o registro de ids que sumiu vira um
 *                                    registro vazio (11);
 *   --envenenado-relatorio-grava     o relatório sem --publicar grava o
 *                                    registro de ids (11);
 *   --envenenado-so-pelo-id          só a linha pelo id conta, e o SAI pelo
 *                                    arquivo passa (8);
 *   --envenenado-homonimo-na-lista   o nome sem pasta repetido na lista casa (8).
 *
 * Precisa do firebase-tools fora do repositório (FIREBASE_TOOLS) e de um JDK
 * 21 em JAVA_HOME, como o testa_nuvem.js; sem eles, REPROVA dizendo onde
 * procurou. Portas: 9031 (auth), 9032 (firestore), 9033 (hub), 9034 (log),
 * 9035 (websocket).
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
const PORTA_AUTH = 9031, PORTA_FS = 9032, PORTA_HUB = 9033, PORTA_LOG = 9034, PORTA_WS = 9035;
const PROJETO = 'demo-nath-catalogo';
const AUTH = 'http://127.0.0.1:' + PORTA_AUTH;
const FS = 'http://127.0.0.1:' + PORTA_FS;
const DOCS = FS + '/v1/projects/' + PROJETO + '/databases/(default)/documents';

const PUBLICADOR = path.join(RAIZ, 'biblioteca', 'publicar_catalogo.py');
const FONTE = fs.readFileSync(PUBLICADOR, 'utf8').replace(/\r\n/g, '\n');
const REGRAS = fs.readFileSync(path.join(RAIZ, 'firestore.rules'), 'utf8').replace(/\r\n/g, '\n');
const VENENOS = {
  '--envenenado-aceita-id-trocado': ['py', '        if dono_do_sha and dono_do_sha != lid:\n', '        if False:\n'],
  '--envenenado-escreve-fora-da-lista': ['py', "            if not CAMINHO_PERMITIDO.fullmatch(e['caminho']):\n", '            if False:\n'],
  '--envenenado-repetido-ultima-vence': ['py', "        resultados = sorted({l['resultado'] for l in linhas})\n", "        resultados = [linhas[-1]['resultado']] if linhas else []\n"],
  '--envenenado-nome-cortado': ['py', '        elif a == base:\n', '        elif a[:12] == base[:12]:\n'],
  '--envenenado-relatorio-grava': ['py', "        if a.publicar and not plano['recusas'] and not plano['indice'] and plano.get('reconstruidos'):\n",
    "        if not plano['recusas'] and plano.get('reconstruidos'):\n"],
  '--envenenado-so-pelo-id': ['py', '    if origem:\n', '    if origem and not achadas:\n'],
  '--envenenado-homonimo-na-lista': ['py', 'if basenames.get(base, 0) > 1 or na_lista.get(base, 0) > 1:', 'if basenames.get(base, 0) > 1:'],
  '--envenenado-registro-vazio-passa': ['py', "        if a.registro_ids and not os.path.isfile(a.registro_ids) and not a.primeira_publicacao:\n", '        if False:\n'],
  '--envenenado-dois-lotes': ['py', '            fs.commit(escritas)\n', '            [fs.commit([e]) for e in escritas]\n'],
  '--envenenado-regra-herda-escrita': ['regras', '      match /config/catalogo {\n        allow read: if podeLer(uid);\n        allow write: if false;',
    '      match /config/catalogo {\n        allow read: if podeLer(uid);\n        allow write: if dona(uid);']
};
const MODO = Object.keys(VENENOS).filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && !VENENOS[a]);

let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + String(obtido).slice(0, 400) + ' | esperado: ' + esperado + ']'));
  return ok;
}
const secao = t => console.log('\n=== ' + t + ' ===');
const pausa = ms => new Promise(r => setTimeout(r, ms));

/* ---------- o publicador, com o veneno por troca de texto num carregador ---------- */
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'publicador_catalogo_'));
const CARREGADOR = path.join(TMP, 'carregador.py');
const VENENO_PY = MODO && VENENOS[MODO][0] === 'py' ? VENENOS[MODO] : null;
fs.writeFileSync(CARREGADOR, [
  'import json, sys, types',
  'caminho = ' + JSON.stringify(PUBLICADOR),
  'sys.path.insert(0, ' + JSON.stringify(path.join(RAIZ, 'biblioteca')) + ')',
  'texto = open(caminho, encoding="utf-8").read().replace("\\r\\n", "\\n")',
  'troca = json.loads(' + JSON.stringify(JSON.stringify(VENENO_PY ? [VENENO_PY[1], VENENO_PY[2]] : null)) + ')',
  'if troca:',
  '    assert texto.count(troca[0]) == 1, "o ponto do veneno nao existe uma vez"',
  '    texto = texto.replace(troca[0], troca[1])',
  'm = types.ModuleType("publicar_catalogo")',
  'm.__file__ = caminho',
  'sys.modules["publicar_catalogo"] = m',
  'exec(compile(texto, caminho, "exec"), m.__dict__)',
  'sys.exit(m.principal(sys.argv[1:]))', ''].join('\n'));

function publicador(args, comEmulador, hostDoEmulador) {
  const env = Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8' });
  if (comEmulador !== false) env.FIRESTORE_EMULATOR_HOST = hostDoEmulador || ('127.0.0.1:' + PORTA_FS);
  else delete env.FIRESTORE_EMULATOR_HOST;
  const r = spawnSync(PYTHON, ['-X', 'utf8', CARREGADOR, '--projeto', PROJETO].concat(args), { encoding: 'utf8', env, timeout: 120000 });
  return { st: r.status, saida: (r.stdout || '') + (r.stderr || '') };
}

/* ---------- os livros sintéticos ---------- */
const hex = s => crypto.createHash('sha256').update(s).digest('hex');
const cap = (n, titulo, ini, fim, ids) => ({ n, titulo, pagina: ini, pagina_fim: fim, assuntos: ids.map(id => ({ id, confianca: 'alta' })), origem: 'mapa' });
function livro(id, conteudo, extra) {
  return Object.assign({ id, formato: 'pdf', arquivo: 'livros/' + id + '.pdf', hash: 'sha256:' + hex(conteudo), bytes: conteudo.length * 1000,
    titulo: 'Livro de prova ' + id, volume: null, materia: 'matematica', materia_nome: 'Matemática', segmento: 'Fundamental II',
    series: ['09'], paginas: 300, sumario: [], sumario_origem: 'mapa', mapa_origem: 'mapa', mapa_nota: 'Do mapa da orquestradora.',
    arquivo_origem: 'Matematica/' + id + '.pdf' }, extra || {});
}
const MAPA_A = [cap(1, 'Números reais', 1, 40, ['MAT09-01']), cap(2, 'Proporcionalidade', 41, 120, ['MAT09-07'])];
const MAPA_A2 = [cap(1, 'Números reais', 1, 40, ['MAT09-01']), cap(2, 'Círculo e cilindro', 41, 60, ['MAT09-12']),
  cap(3, 'Proporcionalidade', 61, 120, ['MAT09-07'])];
const UID = 'donaDeTeste';   // trocado pelo uid da conta da dona do emulador ao subir
let uid = UID;
const escrever = (nome, dados) => { const p = path.join(TMP, nome); fs.writeFileSync(p, typeof dados === 'string' ? dados : JSON.stringify(dados)); return p; };
const manifesto = (nome, livros) => escrever(nome, { esquema: 1, conteudo: 'livros', livros });
const HERANCA = escrever('heranca.json', { 'livro-b': [{ titulo_antigo: 'PMR9_001_272', titulo_novo: 'Funções', pag_arquivo_inicio_antiga: 2 }] });
const CHAVES = path.join(TMP, '_chaves');
const IDS = path.join(TMP, '_ids.json');
// a classificação de todas as seções, pelo id (a seção 8 prova a do formato de 13/11, pelo caminho do arquivo)
const CLASSIF = escrever('classificacao-geral.csv', 'id;resultado;motivo\nlivro-a;FICA;teoria\nlivro-b;FICA;teoria\nlivro-a-novo;FICA;teoria\n');
const comuns = () => ['--emulador', '--uid', uid, '--agora', '2026-11-13T10:00:00-03:00', '--chaves', CHAVES, '--registro-ids', IDS, '--heranca', HERANCA,
  '--classificacao', CLASSIF];
// o arquivo de escrever devolve o caminho; o CSV vai como texto


/* ---------- o emulador ---------- */
const PASTA = path.join(TMP, 'emulador');
let emulador = null;
const REGRAS_SERVIDAS = MODO && VENENOS[MODO][0] === 'regras' ? REGRAS.split(VENENOS[MODO][1]).join(VENENOS[MODO][2]) : REGRAS;
function subirEmulador() {
  fs.mkdirSync(PASTA, { recursive: true });
  fs.writeFileSync(path.join(PASTA, 'firestore.rules'), REGRAS_SERVIDAS);
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
  return (async () => {
    const fim = Date.now() + 120000;
    while (Date.now() < fim) {
      if (emulador.saiu !== undefined) throw new Error('o emulador saiu: ' + saida.slice(-600));
      const a = await fetch(AUTH + '/').then(r => r.json()).catch(() => null);
      const f = await fetch(FS + '/').then(r => r.status).catch(() => 0);
      if (a && a.authEmulator && a.authEmulator.ready && f === 200) return;
      await pausa(500);
    }
    console.log(saida.slice(-1500));
    throw new Error('o emulador não subiu');
  })();
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
const doc = (caminho, token) => rest(DOCS + '/' + caminho, { token: token || 'owner' });
const valor = v => v.stringValue !== undefined ? v.stringValue : v.integerValue !== undefined ? Number(v.integerValue) : v.nullValue !== undefined ? null :
  v.mapValue ? Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, valor(x)])) :
  v.arrayValue ? (v.arrayValue.values || []).map(valor) : v.booleanValue !== undefined ? v.booleanValue : v;
const campos = d => d && d.json && d.json.fields ? Object.fromEntries(Object.entries(d.json.fields).map(([k, x]) => [k, valor(x)])) : null;
const retrato = async () => {
  const lista = await rest(DOCS + '/usuarios/' + uid + '/catalogo?pageSize=50', { token: 'owner' });
  const i = await doc('usuarios/' + uid + '/config/catalogo');
  return { indice: i.status === 200 ? i.json.updateTime + '|' + JSON.stringify(campos(i)) : 'nenhum',
    livros: ((lista.json && lista.json.documents) || []).map(d => d.name.split('/').pop() + '@' + d.updateTime).sort().join(',') };
};

(async () => {
  secao('0. A prova se confere');
  conf('nenhum veneno desconhecido foi pedido', desconhecidos.join(','), '');
  for (const m of Object.keys(VENENOS)) {
    const [qual, de] = VENENOS[m];
    conf('a âncora de ' + m + ' aparece uma vez só', (qual === 'py' ? FONTE : REGRAS).split(de).length - 1, 1);
  }
  conf('o firebase-tools está onde a prova procura (' + FIREBASE + ')', fs.existsSync(FIREBASE), true);
  const javaExe = JAVA_HOME ? path.join(JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java';
  const vj = /version "(\d+)/.exec(((r) => (r.stderr || '') + (r.stdout || ''))(spawnSync(javaExe, ['-version'], { encoding: 'utf8' })));
  conf('há um JDK 21 ou mais novo (' + (JAVA_HOME || 'java do PATH') + ')', !!vj && Number(vj[1]) >= 21, true);
  if (falhas) return fim();

  secao('10. Fora do emulador, as portas de teste fecham e nada sai');
  let r = publicador(['--manifesto', manifesto('m0.json', [livro('livro-a', 'a1', { mapa: MAPA_A })]), '--uid', 'qualquer'], false);
  conf('sem --emulador, --uid é recusado', r.st + '|' + /só valem com --emulador/.test(r.saida), '2|true');
  r = publicador(['--manifesto', manifesto('m0.json', [livro('livro-a', 'a1', { mapa: MAPA_A })]), '--uid', 'qualquer']);
  conf('a variável do emulador sem a opção --emulador é recusada', r.st + '|' + /sem --emulador; nada foi feito/.test(r.saida), '2|true');
  r = publicador(['--manifesto', manifesto('m0.json', [livro('livro-a', 'a1', { mapa: MAPA_A })]), '--emulador', '--uid', 'qualquer'], false);
  conf('a opção --emulador sem a variável é recusada', r.st + '|' + /--emulador sem FIRESTORE_EMULATOR_HOST/.test(r.saida), '2|true');
  const semUid = path.join(TMP, 'uid.txt');
  fs.writeFileSync(semUid, 'abc123');
  r = publicador(['--manifesto', manifesto('m0.json', [livro('livro-a', 'a1', { mapa: MAPA_A })]), '--uid-arquivo', semUid,
    '--gcloud-config', path.join(TMP, 'nao-existe')], false);
  conf('sem a configuração do gcloud do dono, recusa antes de pedir token', r.st + '|' + /configuração do gcloud do dono/.test(r.saida), '2|true');
  fs.mkdirSync(path.join(TMP, 'config-falsa'));
  r = publicador(['--manifesto', manifesto('m0.json', [livro('livro-a', 'a1', { mapa: MAPA_A })]), '--uid-arquivo', semUid,
    '--gcloud-config', path.join(TMP, 'config-falsa'), '--gcloud', 'gcloud'], false);
  conf('o gcloud sem caminho absoluto é recusado (nada do PATH)', r.st + '|' + /caminho absoluto/.test(r.saida), '2|true');
  // o gcloud falso, por caminho absoluto: diz a conta ativa e anota o ambiente que recebeu
  const anotado = path.join(TMP, 'ambiente-do-gcloud.txt');
  const falso = path.join(TMP, process.platform === 'win32' ? 'gcloud.cmd' : 'gcloud');
  fs.writeFileSync(falso, process.platform === 'win32' ?
    '@echo off\r\necho CONFIG=%CLOUDSDK_CONFIG% GAC=%GOOGLE_APPLICATION_CREDENTIALS% OVERRIDE=%CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE% TOKENFILE=%CLOUDSDK_AUTH_ACCESS_TOKEN_FILE% CONTA=%CLOUDSDK_CORE_ACCOUNT% IMPERSONA=%CLOUDSDK_AUTH_IMPERSONATE_SERVICE_ACCOUNT% > "' + anotado + '"\r\necho outra-conta@exemplo.test\r\n' :
    '#!/bin/sh\necho "CONFIG=$CLOUDSDK_CONFIG GAC=$GOOGLE_APPLICATION_CREDENTIALS OVERRIDE=$CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE TOKENFILE=$CLOUDSDK_AUTH_ACCESS_TOKEN_FILE CONTA=$CLOUDSDK_CORE_ACCOUNT IMPERSONA=$CLOUDSDK_AUTH_IMPERSONATE_SERVICE_ACCOUNT" > "' + anotado + '"\necho outra-conta@exemplo.test\n');
  if (process.platform !== 'win32') fs.chmodSync(falso, 0o755);
  const envSujo = { GOOGLE_APPLICATION_CREDENTIALS: 'koli-adc.json', CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE: 'koli-sa.json', CLOUDSDK_AUTH_ACCESS_TOKEN_FILE: 'koli-token.txt',
    CLOUDSDK_CORE_ACCOUNT: 'koli@exemplo.test', CLOUDSDK_AUTH_IMPERSONATE_SERVICE_ACCOUNT: 'sa-koli' };
  Object.assign(process.env, envSujo);
  r = publicador(['--manifesto', manifesto('m0.json', [livro('livro-a', 'a1', { mapa: MAPA_A })]), '--uid-arquivo', semUid,
    '--gcloud-config', path.join(TMP, 'config-falsa'), '--gcloud', falso, '--conta', 'dono@exemplo.test'], false);
  Object.keys(envSujo).forEach(k => { delete process.env[k]; });
  conf('a conta ativa da configuração que não é a esperada recusa antes de pedir o token', r.st + '|' + /a conta ativa da configuração do dono é 'outra-conta@exemplo\.test'/.test(r.saida), '2|true');
  const visto = fs.existsSync(anotado) ? fs.readFileSync(anotado, 'utf8').trim() : '';
  conf('o gcloud recebeu só a configuração do dono: nenhuma variável que troca a conta passou', /^CONFIG=\S*config-falsa GAC=(%GOOGLE_APPLICATION_CREDENTIALS%)? OVERRIDE=(%\w+%)? TOKENFILE=(%\w+%)? CONTA=(%\w+%)? IMPERSONA=(%\w+%)?$/.test(visto) && !/koli/.test(visto), true);
  r = publicador(['--manifesto', manifesto('m0.json', [livro('livro-a', 'a1', { mapa: MAPA_A })]), '--emulador', '--uid', 'qualquer', '--registro-ids', path.join(TMP, 'x.json'), '--chaves', CHAVES,
    '--primeira-publicacao', '--classificacao', CLASSIF], true, '127.0.0.1:9');
  conf('o Firestore que não responde (porta fechada) é RECUSADO, sem exceção solta', r.st + '|' + /RECUSADO: o Firestore não respondeu/.test(r.saida) + '|' + /Traceback/.test(r.saida), '2|true|false');
  conf('e a saída diz EMULADOR em toda linha de resultado', /EMULADOR: RECUSADO/.test(r.saida), true);

  await subirEmulador();
  const dona = await conta('dona@exemplo.test');
  const obs = await conta('observador@exemplo.test');
  const estranho = await conta('estranho@exemplo.test');
  conf('as três contas existem no emulador', !!(dona.localId && obs.localId && estranho.localId), true);
  uid = dona.localId;
  await rest(DOCS + '/usuarios/' + uid + '/config/leitores', { metodo: 'PATCH', token: 'owner',
    corpo: { fields: { uids: { arrayValue: { values: [{ stringValue: obs.localId }] } } } } });

  secao('1. Sem --publicar, nada é gravado');
  const M1 = manifesto('m1.json', [livro('livro-a', 'a1', { mapa: MAPA_A }), livro('livro-b', 'b1', { mapa: [cap(1, 'Funções', 2, 90, ['MAT09-06'])] })]);
  r = publicador(['--manifesto', M1].concat(comuns()));
  if (MODO !== '--envenenado-registro-vazio-passa') conf('sem o registro de ids e sem --primeira-publicacao, recusa (registro sumido nunca vira vazio)', r.st + '|' + /o registro de ids não existe/.test(r.saida), '2|true');
  r = publicador(['--manifesto', M1, '--primeira-publicacao'].concat(comuns()));
  conf('o relatório diz o que mudaria, e sai bem', r.st + '|' + /livro-a: novo/.test(r.saida) + '|' + /sem --publicar, nada foi gravado/.test(r.saida), '0|true|true');
  conf('nada no emulador', (await retrato()).indice + '|' + (await retrato()).livros, 'nenhum|');
  conf('e nenhum registro gravado', fs.existsSync(IDS) + '|' + fs.existsSync(CHAVES), 'false|false');

  secao('2. --publicar grava tudo num commit');
  r = publicador(['--manifesto', M1, '--publicar'].concat(comuns()).filter(x => x !== '--classificacao' && x !== CLASSIF));
  conf('--publicar sem a classificação é recusado', r.st + '|' + /--publicar pede a classificação do acervo/.test(r.saida), '2|true');
  r = publicador(['--manifesto', M1, '--publicar', '--primeira-publicacao'].concat(comuns()));
  // (no veneno dos dois lotes, cada escrita vai num commit: quem diz que o defeito foi visto é a seção 5)
  const DOIS = MODO === '--envenenado-dois-lotes';
  const UM_COMMIT = DOIS ? /em \d+ commit/ : /em 1 commit/;
  conf('publicado, versão 1, 3 escritas num commit só', r.st + '|' + (DOIS ? /PUBLICADO: versão 1,/ : /PUBLICADO: versão 1, 3 escrita\(s\)/).test(r.saida) + '|' + UM_COMMIT.test(r.saida), '0|true|true');
  const i1 = campos(await doc('usuarios/' + uid + '/config/catalogo'));
  conf('o índice tem os dois livros, com sha256, tamanho, metaHash e metaVersao 1', i1 && Object.keys(i1.livros).sort().join(',') + '|' +
    i1.livros['livro-a'].sha256 + '|' + i1.livros['livro-a'].metaVersao + '|' + /^[0-9a-f]{64}$/.test(i1.livros['livro-a'].metaHash),
    'livro-a,livro-b|' + hex('a1') + '|1|true');
  const a1 = campos(await doc('usuarios/' + uid + '/catalogo/livro-a'));
  const metaA = JSON.parse(a1.metaJson);
  conf('o documento do livro: id, sha256, tamanho e o metaHash do texto exato', [a1.id, a1.sha256 === hex('a1'), a1.tamanho, a1.metaHash === hex(a1.metaJson)].join('|'),
    'livro-a|true|2000|true');
  conf('o metaJson é o meta do livro, com a chave estável em cada capítulo', metaA.mapa.map(e => e.titulo + ':' + /^c[0-9a-f]{6}$/.test(e.chave)).join(','),
    'Números reais:true,Proporcionalidade:true');
  const metaB = JSON.parse(campos(await doc('usuarios/' + uid + '/catalogo/livro-b')).metaJson);
  conf('a tabela de herança entrou no meta do livro dela', JSON.stringify(metaB.heranca_titulos), JSON.stringify([{ pag_arquivo_inicio_antiga: 2, titulo_antigo: 'PMR9_001_272', titulo_novo: 'Funções' }]));   // o metaJson vai com as chaves em ordem
  conf('os registros foram gravados (ids pelo sha e as chaves por livro)', JSON.parse(fs.readFileSync(IDS, 'utf8'))[hex('a1')] + '|' +
    fs.readdirSync(CHAVES).sort().join(','), 'livro-a|livro-a.json,livro-b.json');

  secao('3. Publicar de novo sem mudança não escreve nada');
  const antes3 = await retrato();
  r = publicador(['--manifesto', M1, '--publicar'].concat(comuns()));
  conf('nada mudaria, e nada foi gravado', r.st + '|' + /nada mudaria/.test(r.saida), '0|true');
  conf('o emulador ficou igual (as mesmas horas de gravação)', JSON.stringify(await retrato()), JSON.stringify(antes3));

  secao('4. Mudar o mapa de um livro escreve só ele e o índice');
  const M2 = manifesto('m2.json', [livro('livro-a', 'a1', { mapa: MAPA_A2 }), livro('livro-b', 'b1', { mapa: [cap(1, 'Funções', 2, 90, ['MAT09-06'])] })]);
  r = publicador(['--manifesto', M2, '--publicar'].concat(comuns()));
  conf('versão 2, 2 escritas num commit só', r.st + '|' + (DOIS ? /PUBLICADO: versão 2,/ : /PUBLICADO: versão 2, 2 escrita\(s\)/).test(r.saida) + '|' + UM_COMMIT.test(r.saida), '0|true|true');
  const depois4 = await retrato();
  const bAntes = antes3.livros.split(',').filter(x => x.startsWith('livro-b'))[0], bDepois = depois4.livros.split(',').filter(x => x.startsWith('livro-b'))[0];
  conf('o livro b não foi regravado', bDepois, bAntes);
  const metaA2 = JSON.parse(campos(await doc('usuarios/' + uid + '/catalogo/livro-a')).metaJson);
  conf('os capítulos de antes ficam com as chaves deles; o novo do meio ganha uma nova',
    [metaA2.mapa[0].chave === metaA.mapa[0].chave, metaA2.mapa[2].chave === metaA.mapa[1].chave, metaA.mapa.every(e => e.chave !== metaA2.mapa[1].chave)].join('|'), 'true|true|true');
  const i2 = campos(await doc('usuarios/' + uid + '/config/catalogo'));
  conf('o índice sobe para a versão 2, e o meta do livro a para a 2; o do b fica na 1', [i2.versao, i2.livros['livro-a'].metaVersao, i2.livros['livro-b'].metaVersao].join('|'), '2|2|1');

  secao('5. A falha no meio do lote deixa tudo na versão anterior');
  const M3 = manifesto('m3.json', [livro('livro-a', 'a1', { mapa: MAPA_A }), livro('livro-b', 'b1', { mapa: [cap(1, 'Funções e gráficos', 2, 90, ['MAT09-06'])] })]);
  r = publicador(['--manifesto', M3, '--publicar', '--falhar-no-lote'].concat(comuns()));
  const depois5 = await retrato();
  if (MODO === '--envenenado-dois-lotes') {
    conf('VENENO visto: com um commit por escrita, a falha deixou livros gravados', depois5.livros !== depois4.livros, true);
    return fim();
  }
  conf('o commit falhou e o publicador disse', r.st + '|' + /o commit falhou/.test(r.saida), '2|true');
  conf('o índice e os livros ficaram exatamente como estavam', JSON.stringify(depois5), JSON.stringify(depois4));

  secao('6. As recusas, sem gravar nada');
  const recusa = async (rotulo, args, motivo) => {
    const a = await retrato();
    const x = publicador(args.concat(comuns()));
    conf(rotulo, x.st + '|' + motivo.test(x.saida), '2|true');
    conf('e nada mudou no emulador', JSON.stringify(await retrato()), JSON.stringify(a));
    return x;
  };
  const trocado = publicador(['--manifesto', manifesto('m4.json', [livro('livro-a', 'a1', { mapa: MAPA_A2 }), livro('livro-b', 'b1', { mapa: [cap(1, 'Funções', 2, 90, ['MAT09-06'])] }),
    livro('livro-a-novo', 'a1', { mapa: MAPA_A2 })]), '--publicar'].concat(comuns()));
  if (MODO === '--envenenado-aceita-id-trocado') {
    conf('VENENO visto: o mesmo arquivo foi publicado com o id novo', trocado.st === 0 && /livro-a-novo: novo/.test(trocado.saida), true);
    return fim();
  }
  conf('o mesmo arquivo com outro id é recusado', trocado.st + '|' + /já foi publicado com o id livro-a/.test(trocado.saida), '2|true');
  conf('e nada mudou no emulador', JSON.stringify(await retrato()), JSON.stringify(depois5));
  await recusa('o livro publicado que some sem --retirar é recusado', ['--manifesto', manifesto('m5.json', [livro('livro-a', 'a1', { mapa: MAPA_A2 })]), '--publicar'],
    /livro-b está publicado e sumiria sem --retirar livro-b/);
  await recusa('a troca de formato fora de trocas_de_arquivo.json é recusada', ['--manifesto', manifesto('m6.json', [livro('livro-a', 'a1', { mapa: MAPA_A2 }),
    livro('livro-b', 'b2', { formato: 'epub', mapa: [] })]), '--publicar'], /trocaria de formato \(pdf para epub\)/);
  const mapas = path.join(TMP, 'mapas');
  fs.mkdirSync(mapas);
  fs.writeFileSync(path.join(mapas, 'mapa_capitulos_prova.json'), JSON.stringify([{ arquivo: 'x.pdf', capitulos: [{ titulo: 'X', assuntos: [{ id: 'MAT09-99' }, { id: 'MAT09-01' }] }] }]));
  await recusa('o assunto do mapa fora do banco é recusado', ['--manifesto', M2, '--mapas', mapas, '--publicar'], /o assunto MAT09-99, citado em mapa_capitulos_prova\.json, não existe no banco/);
  await recusa('a nota do gerador de assunto descartado também é recusada', ['--manifesto', manifesto('m7.json', [livro('livro-a', 'a1', { mapa: MAPA_A2,
    mapa_nota: 'Do mapa. 1 assunto(s) fora do índice ficaram de fora.' }), livro('livro-b', 'b1', { mapa: [cap(1, 'Funções', 2, 90, ['MAT09-06'])] })]), '--publicar'], /cita assunto fora do banco/);
  // a lista fechada de caminhos, direto no cliente do publicador
  const tentativa = path.join(TMP, 'tentativa.py');
  fs.writeFileSync(tentativa, [
    'import json, sys, types',
    'caminho = ' + JSON.stringify(PUBLICADOR),
    'sys.path.insert(0, ' + JSON.stringify(path.join(RAIZ, 'biblioteca')) + ')',
    'texto = open(caminho, encoding="utf-8").read().replace("\\r\\n", "\\n")',
    'troca = json.loads(' + JSON.stringify(JSON.stringify(VENENO_PY ? [VENENO_PY[1], VENENO_PY[2]] : null)) + ')',
    'if troca: texto = texto.replace(troca[0], troca[1])',
    'm = types.ModuleType("p"); m.__file__ = caminho; exec(compile(texto, caminho, "exec"), m.__dict__)',
    'fs = m.Firestore(' + JSON.stringify(PROJETO) + ', "owner", "127.0.0.1:' + PORTA_FS + '")',
    'try:',
    '    fs.commit([{"caminho": "usuarios/' + uid + '/registros/x", "dados": {"tipo": "aluno"}}])',
    '    print("GRAVOU")',
    'except m.Recusa as e:',
    '    print("RECUSOU: " + str(e))', ''].join('\n'));
  const fx = spawnSync(PYTHON, ['-X', 'utf8', tentativa], { encoding: 'utf8' });
  const registro = await doc('usuarios/' + uid + '/registros/x');
  if (MODO === '--envenenado-escreve-fora-da-lista') {
    conf('VENENO visto: sem a lista fechada, o publicador gravou em registros', /GRAVOU/.test(fx.stdout) && registro.status === 200, true);
    return fim();
  }
  conf('o caminho fora da lista (registros) é recusado antes de sair da máquina', /RECUSOU: caminho fora da lista fechada/.test(fx.stdout), true);
  conf('e nada foi gravado lá', registro.status, 404);

  secao('7. --retirar e a troca de formato listada');
  const trocas = escrever('trocas.json', [{ id: 'livro-b', arquivo_antigo: 'b.pdf', arquivo_novo: 'b.epub', motivo: 'prova' }]);
  r = publicador(['--manifesto', manifesto('m8.json', [livro('livro-a', 'a1', { mapa: MAPA_A2 }), livro('livro-b', 'b2', { formato: 'epub', mapa: [] })]),
    '--trocas', trocas, '--publicar'].concat(comuns()));
  conf('a troca de formato listada passa', r.st + '|' + /livro-b: arquivo trocado/.test(r.saida), '0|true');
  r = publicador(['--manifesto', manifesto('m9.json', [livro('livro-b', 'b2', { formato: 'epub', mapa: [] })]), '--retirar', 'livro-a', '--publicar'].concat(comuns()));
  const i7 = campos(await doc('usuarios/' + uid + '/config/catalogo'));
  const a7 = campos(await doc('usuarios/' + uid + '/catalogo/livro-a'));
  conf('--retirar marca o livro como retirado no índice e no documento, que continua lá', [r.st, i7.livros['livro-a'].retiradoEm, a7.retiradoEm, !!a7.metaJson].join('|'),
    '0|2026-11-13T10:00:00-03:00|2026-11-13T10:00:00-03:00|true');

  secao('8. A classificação do acervo (no formato da lista de 13/11: separador ";", pelo caminho do arquivo)');
  const classif = path.join(TMP, 'CLASSIFICACAO_ACERVO.csv');
  fs.writeFileSync(classif, '﻿arquivo;título;resultado;motivo;fonte\nLivro-B.pdf;B;FICA;teoria e exercícios;A\nlivro f.pdf;F;SO_TEORIA;livro do professor;B\n' +
    'livro-c.pdf;C;SAI;caderno de atividades;A\nlivro-d.pdf;D;DÚVIDA;pouca teoria;A\n');
  const LONGO = 'x'.repeat(90);
  fs.appendFileSync(classif, '6ano/repetido.pdf;R6;SAI;caderno;A\n7ano/repetido.pdf;R7;FICA;teoria;A\n' +
    'mesmo-nome.pdf;M;FICA;teoria;A\nlivro-h.pdf;H;FICA?;não sei;A\n' + LONGO + ' volume 1.pdf;L1;SAI;caderno;A\n' + LONGO + ' volume 2.pdf;L2;FICA;teoria;A\n' +
    'dup.pdf;D;FICA;teoria;A\nFisica/dup.pdf;D2;SAI;caderno;A\nlivro-i.pdf;I;SAI;caderno pelo arquivo;A\n');
  // a mesma lista ganha uma coluna id para o livro-i: a linha pelo id diz FICA, a do arquivo diz SAI
  fs.writeFileSync(classif, fs.readFileSync(classif, 'utf8').replace('\ufeffarquivo;título;resultado;motivo;fonte\n', '\ufeffid;arquivo;título;resultado;motivo;fonte\n')
    .split('\n').map((l, i) => i === 0 || !l ? l : ';' + l).join('\n') + 'livro-i;;I;FICA;teoria pelo id;A\n' +
    // o livro-g repetido pelo id (o repetido pelo nome sem pasta, na lista, é ambíguo)
    'livro-g;;G;SAI;caderno;A\nlivro-g;;G;FICA;engano;A\n');
  const m10 = [livro('livro-b', 'b2', { formato: 'epub', mapa: [], arquivo_origem: 'Matematica/Livro-B.pdf' }), livro('livro-f', 'f1', { mapa: [], arquivo_origem: 'Matematica/livro f.pdf' }),
    livro('livro-c', 'c1', { mapa: [] }), livro('livro-d', 'd1', { mapa: [] }), livro('livro-e', 'e1', { mapa: [] }), livro('livro-g', 'g1', { mapa: [] }),
    livro('repetido', 'r6', { mapa: [], arquivo_origem: '6ano/repetido.pdf' }), livro('repetido-2', 'r7', { mapa: [], arquivo_origem: '7ano/repetido.pdf' }),
    livro('mesmo-nome', 'm1', { mapa: [], arquivo_origem: 'Fisica/mesmo-nome.pdf' }), livro('mesmo-nome-2', 'm2', { mapa: [], arquivo_origem: 'Quimica/mesmo-nome.pdf' }),
    livro('livro-h', 'h1', { mapa: [] }), livro('longo-1', 'l1', { mapa: [], arquivo_origem: 'Matematica/' + LONGO + ' volume 1.pdf' }),
    livro('longo-2', 'l2', { mapa: [], arquivo_origem: 'Matematica/' + LONGO + ' volume 2.pdf' }),
    livro('dup', 'dp', { mapa: [], arquivo_origem: 'Matematica/dup.pdf' }), livro('livro-i', 'i1', { mapa: [] })];
  r = publicador(['--manifesto', manifesto('m10.json', m10), '--publicar'].concat(comuns().filter(x => x !== CLASSIF && x !== '--classificacao')).concat(['--classificacao', classif]));
  if (MODO === '--envenenado-repetido-ultima-vence') {
    conf('VENENO visto: o livro com uma linha SAI e outra FICA entrou', /livro-g: novo/.test(r.saida), true);
    return fim();
  }
  if (MODO === '--envenenado-nome-cortado') {
    conf('VENENO visto: pelo nome cortado, o volume 2 casou com a linha SAI do volume 1 e ficou de fora', !/longo-2: novo/.test(r.saida), true);
    return fim();
  }
  if (MODO === '--envenenado-so-pelo-id') {
    conf('VENENO visto: só a linha pelo id contou, e o livro com SAI pelo arquivo entrou', /livro-i: novo/.test(r.saida), true);
    return fim();
  }
  if (MODO === '--envenenado-homonimo-na-lista') {
    conf('VENENO visto: o nome sem pasta repetido na lista casou e o livro entrou', /dup: novo/.test(r.saida), true);
    return fim();
  }
  conf('as linhas pelo id e pelo arquivo contam juntas: o SAI pelo arquivo deixa de fora o FICA pelo id', /livro-i: novo/.test(r.saida) + '|' + /aviso: o livro livro-i aparece 2 vezes/.test(r.saida), 'false|true');
  conf('o nome sem pasta repetido na lista não casa: o livro fica de fora como ambíguo', /dup: novo/.test(r.saida) + '|' + /- dup \(/.test(r.saida), 'false|true');
  conf('a linha repetida com SAI deixa o livro de fora, e a repetição é avisada', /aviso: o livro livro-g aparece 2 vezes na classificação \(FICA, SAI\)/.test(r.saida) + '|' + /livro-g: novo/.test(r.saida), 'true|false');
  conf('o mesmo nome em pastas diferentes casa pelo caminho inteiro', /repetido-2: novo/.test(r.saida) + '|' + /repetido: novo/.test(r.saida), 'true|false');
  conf('o nome sem pasta de dois livros fica de fora como ambíguo', /fora da nuvem, nome de arquivo ambíguo \(o mesmo nome em dois livros ou em duas linhas da lista\): 3 livro/.test(r.saida), true);
  conf('o resultado desconhecido (FICA?) fica de fora', /fora da nuvem, resultado desconhecido \(FICA\?\): 1 livro/.test(r.saida), true);
  conf('os nomes compridos que só diferem no fim não se confundem (nada é cortado)', /longo-2: novo/.test(r.saida) + '|' + /longo-1: novo/.test(r.saida), 'true|false');
  conf('FICA e SO_TEORIA entram; SAI, DÚVIDA e o ausente ficam de fora, listados pelo motivo', [r.st,
    /fora da nuvem, SAI: 5 livro\(s\)\r?\n {4}- livro-c \(caderno de atividades\)/.test(r.saida),
    /fora da nuvem, DÚVIDA \(tratada como SAI\): 1 livro\(s\)\r?\n {4}- livro-d \(pouca teoria\)/.test(r.saida),
    /fora da nuvem, ausente da classificação: 1 livro\(s\)\r?\n {4}- livro-e/.test(r.saida),
    /livro-f: novo/.test(r.saida), /livro-c: novo|livro-d: novo|livro-e: novo/.test(r.saida)].join('|'), '0|true|true|true|true|false');
  const f8 = JSON.parse(campos(await doc('usuarios/' + uid + '/catalogo/livro-f')).metaJson);
  const b8 = JSON.parse(campos(await doc('usuarios/' + uid + '/catalogo/livro-b')).metaJson);
  conf('o SO_TEORIA leva so_teoria no meta; o FICA, não', f8.so_teoria + '|' + ('so_teoria' in b8), 'true|false');
  conf('o caminho de origem não vai para a nuvem', 'arquivo_origem' in b8, false);
  conf('os de fora não estão no catálogo', (await Promise.all(['livro-c', 'livro-d', 'livro-e'].map(x => doc('usuarios/' + uid + '/catalogo/' + x)))).map(d => d.status).join(','), '404,404,404');

  secao('9. As regras do catálogo');
  const escreve = (caminho, token) => rest(DOCS + '/' + caminho, { metodo: 'PATCH', token, corpo: { fields: { versao: { integerValue: '99' } } } });
  const wIndice = await escreve('usuarios/' + uid + '/config/catalogo', dona.idToken);
  if (MODO === '--envenenado-regra-herda-escrita') {
    conf('VENENO visto: a dona logada escreveu o índice do catálogo', wIndice.status, 200);
    return fim();
  }
  conf('a dona logada recebe PERMISSION_DENIED ao escrever config/catalogo', wIndice.status + '|' + ((wIndice.json && wIndice.json.error && wIndice.json.error.status) || ''), '403|PERMISSION_DENIED');
  const wLivro = await escreve('usuarios/' + uid + '/catalogo/livro-x', dona.idToken);
  conf('e ao escrever catalogo/livro-x', wLivro.status, 403);
  conf('a dona lê o índice e um livro', (await doc('usuarios/' + uid + '/config/catalogo', dona.idToken)).status + '|' +
    (await doc('usuarios/' + uid + '/catalogo/livro-b', dona.idToken)).status, '200|200');
  conf('o observador lê', (await doc('usuarios/' + uid + '/config/catalogo', obs.idToken)).status, 200);
  conf('o observador não escreve', (await escreve('usuarios/' + uid + '/config/catalogo', obs.idToken)).status, 403);
  conf('uma terceira conta não lê', (await doc('usuarios/' + uid + '/config/catalogo', estranho.idToken)).status + '|' +
    (await doc('usuarios/' + uid + '/catalogo/livro-b', estranho.idToken)).status, '403|403');
  conf('e a dona continua escrevendo o config/leitores (a regra irmã não mudou)', (await rest(DOCS + '/usuarios/' + uid + '/config/leitores', { metodo: 'PATCH', token: dona.idToken,
    corpo: { fields: { uids: { arrayValue: { values: [{ stringValue: obs.localId }] } } } } })).status, 200);

  secao('11. Os registros: o que some é recusa; o que ficou para trás é refeito pela nuvem');
  const guardado = fs.readFileSync(IDS, 'utf8');
  fs.unlinkSync(IDS);
  r = publicador(['--manifesto', manifesto('m11.json', [livro('livro-b', 'b2', { formato: 'epub', mapa: [] })]), '--publicar'].concat(comuns()));
  if (MODO === '--envenenado-registro-vazio-passa') {
    conf('VENENO visto: sem o registro de ids, o publicador seguiu como se estivesse vazio', /o registro de ids não existe/.test(r.saida), false);
    return fim();
  }
  conf('o registro de ids que sumiu é recusa', r.st + '|' + /o registro de ids não existe/.test(r.saida), '2|true');
  fs.writeFileSync(IDS, '{}');
  const comAnovo = manifesto('m12.json', [livro('livro-b', 'b2', { formato: 'epub', mapa: [] }), livro('livro-f', 'f1', { mapa: [] }), livro('livro-a-novo', 'a1', { mapa: [] })]);
  r = publicador(['--manifesto', comAnovo, '--retirar', 'livro-a', '--publicar'].concat(comuns()));
  conf('com o registro local vazio, o índice da nuvem ainda pega o mesmo arquivo com outro id', r.st + '|' + /já foi publicado com o id livro-a/.test(r.saida), '2|true');
  const m13 = manifesto('m13.json', m10.concat([livro('livro-novo-n', 'n7', { mapa: [] })]));
  fs.appendFileSync(classif, 'livro-novo-n;;N;FICA;teoria;A\n');
  const comClassif = () => comuns().filter(x => x !== CLASSIF && x !== '--classificacao').concat(['--classificacao', classif]);
  r = publicador(['--manifesto', m13].concat(comClassif()));
  if (MODO === '--envenenado-relatorio-grava') {
    conf('VENENO visto: o relatório (sem --publicar) gravou o registro de ids', fs.readFileSync(IDS, 'utf8').trim() !== '{}', true);
    return fim();
  }
  conf('sem --publicar, o registro para trás é só anunciado, e NADA vai para o disco', r.st + '|' + /o registro de ids está para trás: \d+ entrada\(s\)/.test(r.saida) + '|' + fs.readFileSync(IDS, 'utf8').trim(), '0|true|{}');
  r = publicador(['--manifesto', manifesto('m14.json', m10), '--publicar'].concat(comClassif()));
  const refeito = JSON.parse(fs.readFileSync(IDS, 'utf8'));
  conf('com --publicar e nada a publicar, o registro ganha só as entradas do índice da nuvem', r.st + '|' + (refeito[hex('a1')] === 'livro-a') + '|' + (hex('n7') in refeito), '0|true|false');
  fs.writeFileSync(IDS, guardado);
  r = publicador(['--manifesto', M2, '--publicar'].concat(comuns().map(x => x === CHAVES ? path.join(TMP, 'chaves-que-nao-existem') : x)));
  conf('a pasta das chaves que não existe é recusa', r.st + '|' + /a pasta das chaves não existe/.test(r.saida), '2|true');
  r = publicador(['--manifesto', M2, '--mapas', path.join(TMP, 'mapas-que-nao-existem')].concat(comuns()));
  conf('a pasta dos mapas que não existe é recusa', r.st + '|' + /a pasta dos mapas não existe/.test(r.saida), '2|true');
  r = publicador(['--manifesto', M2, '--primeira-publicacao'].concat(comuns()));
  conf('--primeira-publicacao com catálogo na nuvem é recusa', r.st + '|' + /a nuvem já tem catálogo/.test(r.saida), '2|true');

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
