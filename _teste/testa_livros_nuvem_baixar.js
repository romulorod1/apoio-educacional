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
 *      arquivo na nuvem, o retirado e o que já está no tablet (pelo id ou pelo
 *      sha256, com outro id) não aparecem; mostrar não baixa nada; os da nuvem
 *      ficam entre os do tablet, em ordem de título; e o Store recusa o mesmo
 *      arquivo com outro id;
 *   2. o sha256 errado é recusado: o cartão diz, e nenhum livro é guardado;
 *   3. a baixa interrompida no meio não guarda nada, e o toque seguinte baixa,
 *      com o andamento à vista (entre 0 e 100%), confere e guarda: o livro
 *      vira um livro do tablet (pacote 'nuvem', o Blob inteiro, o sha256 do
 *      catálogo) e abre no leitor; a cor e o lugar de cada livro não mudam com
 *      a chegada dele (a cor é do livro, e os que já estavam ficam com a de hoje);
 *  3b. o corpo que fecha limpo, mas curto (INCOMPLETO), e o maior que o
 *      catálogo (TAMANHO_DIFERENTE) não viram livro;
 *   4. dois toques seguidos começam UMA baixa; o toque noutro livro enquanto
 *      um baixa não começa outra, e avisa;
 *   5. sem internet, o cartão diz que não baixa agora, e o toque não pede nada
 *      à rede; a internet volta e ele volta a dizer "toque para baixar";
 *   6. sem espaço no tablet (o estimate), avisa quanto falta e não baixa; 6b. a
 *      cota que acaba na gravação (QuotaExceededError) dá o mesmo aviso, e nada
 *      fica guardado;
 *   7. o observador (D7) não vê livro da nuvem nenhum;
 *   8. o getDownloadURL nunca entra: nenhuma das fontes do aplicativo o cita
 *      (nem o token de download), e todo pedido da página ao Storage foi um
 *      GET ?alt=media com "Authorization: Firebase <idToken>", sem token na
 *      URL e sem ler os metadados do objeto;
 *   9. a conta troca no meio da conferência (ela sai e entra com outra): a lista
 *      da primeira nunca fica guardada para a segunda, que não vê nada dela;
 *  10. o observador de verdade (a marca de celular com a conta de outra
 *      pessoa) e 11. o celular da dona, pela tela do celular: nenhum cartão da
 *      nuvem e nenhuma leitura do catálogo;
 *  12. nenhum erro de página.
 *
 * Venenos (a prova TEM de ver o defeito e passa dizendo que viu):
 *   --envenenado-sem-hash        a conferência do sha256 é pulada: o arquivo
 *                                errado vira livro (2 vê);
 *   --envenenado-guarda-parcial  guarda antes de conferir: o arquivo errado
 *                                fica guardado mesmo recusado (2 vê);
 *   --envenenado-baixa-dois      sem a guarda do toque repetido: dois toques
 *                                começam duas baixas (4 vê);
 *   --envenenado-aceita-curto    o nuvem.js entrega o corpo que fechou curto
 *                                (3b vê);
 *   --envenenado-cor-pela-posicao  a cor da capa volta a ser a da posição: o
 *                                livro que já estava muda de cor (3 vê);
 *   --envenenado-grava-na-conta-nova  a lista da conta de antes é guardada
 *                                para a conta que entrou no meio (9 vê);
 *   --envenenado-sem-prazo       a baixa que para sem erro nunca cai (3c vê);
 *   --envenenado-cancelar-nao-solta  o Cancelar não para a baixa (3d vê);
 *   --envenenado-copia-inteira   a baixa segura o livro inteiro na memória
 *                                (8b vê, pela memória viva).
 *
 * As seções da revisão das lentes: 3c (a baixa que PARA no meio, sem erro, com
 * a conexão aberta, cai no prazo sem dados, curto só nesta prova), 3d (o
 * Cancelar), 4 (o toque logo depois de guardar não baixa de novo), 8b (a
 * memória viva durante a baixa de um livro de 48 MB fica abaixo de metade do
 * livro) e 8c (o livro tirado do tablet volta "na nuvem" na hora).
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
// o prazo sem dados da baixa, curto SÓ nesta prova (o do aplicativo é de 30 s), pela configuração do emulador
const PRAZO_DA_PROVA_MS = 2500;
const CFG = { auth: AUTH, firestore: FS, projectId: PROJETO, storage: REPASSE, bucket: BUCKET, prazoSemDadosMs: PRAZO_DA_PROVA_MS };

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const NUVEM = fs.readFileSync(path.join(H.RAIZ, 'nuvem.js'), 'utf8').replace(/\r\n/g, '\n');
const STORE = fs.readFileSync(path.join(H.RAIZ, 'store.js'), 'utf8').replace(/\r\n/g, '\n');
const FONTES = { app: ['/app.js', APP], nuvem: ['/nuvem.js', NUVEM] };
// cada veneno: uma ou mais trocas [fonte, trecho, troca]
const VENENOS = {
  '--envenenado-sem-hash': [['app', 'if (h !== e.sha256) throw', 'if (false) throw']],
  '--envenenado-guarda-parcial': [['app', 'return conferirLivroBaixado(arquivo, e).then(function () { seCancelou(); return guardarLivroBaixado(arquivo, e); });',
    'return guardarLivroBaixado(arquivo, e).then(function () { return conferirLivroBaixado(arquivo, e); });']],
  '--envenenado-baixa-dois': [['app', '    if (baixaDaNuvem) return outraBaixaEmCurso(id);\n', '']],
  // o corpo que fecha limpo, mas curto, passa pela conta do tamanho
  '--envenenado-aceita-curto': [['nuvem', "            if (recebidos !== total) throw erroDaBaixa('INCOMPLETO', 'O livro não chegou inteiro.');\n", '']],
  // a cor da capa volta a ser a da posição na lista
  '--envenenado-cor-pela-posicao': [['app', 'cor: cores[l.id] };', 'cor: CORES_DAS_CAPAS[i % CORES_DAS_CAPAS.length] };']],
  // a baixa que para sem erro nunca cai: sem o prazo sem dados
  '--envenenado-sem-prazo': [['nuvem', "      if (prazoMs > 0) prazo = setTimeout(parou, prazoMs);\n", '']],
  // o Cancelar não para a baixa (nem a marca como cancelada): ela segue e guarda
  '--envenenado-cancelar-nao-solta': [['app', "    baixa.cancelada = true; if (baixa.controle) baixa.controle.abort();\n", '']],
  // a baixa segura o livro inteiro na memória: os pedaços nunca viram Blob no caminho
  '--envenenado-copia-inteira': [['nuvem', "          if (noLote >= JUNTAR_BYTES) { partes.push(new Blob(pedacos)); pedacos = []; noLote = 0; }\n", '']],
  // a lista da conta de antes é guardada (e mostrada) na conta que entrou no meio da conferência
  '--envenenado-grava-na-conta-nova': [['app', '      if (!mesmaConta()) return false;\n', ''],
    ['nuvem', "if (!sessao || !sessao.uid || typeof uid !== 'string' || !uid || uid !== sessao.uid) return Promise.resolve(null);\n    return gravarEstado('livrosNaNuvem', Object.assign({}, v, { uid: uid }));",
      "if (!sessao || !sessao.uid) return Promise.resolve(null);\n    return gravarEstado('livrosNaNuvem', Object.assign({}, v, { uid: sessao.uid }));"]]
};
const MODO = Object.keys(VENENOS).filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && !VENENOS[a]);
const trocas = {};
if (MODO) {
  for (const [qual, de, para] of VENENOS[MODO]) {
    const atual = trocas[FONTES[qual][0]] || FONTES[qual][1];
    trocas[FONTES[qual][0]] = atual.split(de).join(para);
  }
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
  'local-m': pdfMinimo(4, 'Outro livro local', 0),
  'sem-arquivo': pdfMinimo(3, 'Sem arquivo', 0),
  'retirado-r': pdfMinimo(3, 'Retirado', 0),
  // o livro grande da medida de memória (seção 8b): 48 MB
  'nuvem-grande': pdfMinimo(3, 'Livro grande', 48 * 1024 * 1024)
};
// o sha256 que o catálogo diz de cada livro; o do "falso" é o de OUTRO conteúdo (o arquivo no Storage não confere)
const SHA = {};
Object.keys(ARQ).forEach(id => { SHA[id] = hex(ARQ[id]); });
SHA['nuvem-falso'] = hex(Buffer.from('outro conteúdo, que não é o do arquivo'));
// o MESMO arquivo do livro local-l, publicado com outro id: já está no tablet, não aparece "na nuvem"
ARQ['nuvem-dup'] = ARQ['local-l'];
SHA['nuvem-dup'] = SHA['local-l'];
const TITULOS = { 'nuvem-a': 'Álgebra na nuvem', 'nuvem-b': 'Bloco de geometria', 'nuvem-c': 'Caderno de frações',
  'nuvem-falso': 'Dicionário trocado', 'local-l': 'Estatística do tablet', 'local-m': 'Frações do tablet',
  'nuvem-dup': 'Mesmo arquivo com outro nome', 'sem-arquivo': 'Sem arquivo na nuvem', 'retirado-r': 'Retirado do catálogo',
  'nuvem-grande': 'Zoologia em volume grande' };
function meta(id) {
  return { id, formato: 'pdf', arquivo: 'livros/' + id + '.pdf', hash: 'sha256:' + SHA[id], bytes: ARQ[id].length,
    titulo: TITULOS[id], materia: 'matematica', materia_nome: 'Matemática', segmento: 'Fundamental II', series: ['08'],
    series_origem: 'mapa', mapa_disciplina: 'matematica', paginas: id === 'nuvem-a' ? 6 : id === 'sem-arquivo' || id === 'retirado-r' ? 3 : 4,
    sumario: [{ n: 1, nivel: 1, titulo: 'Primeiro capítulo', pagina: 1 }, { n: 2, nivel: 1, titulo: 'Segundo capítulo', pagina: 3 }],
    sumario_origem: 'marcadores', mapa: [], mapa_origem: 'nenhum', mapa_nota: 'Sem mapa de capítulos.' };
}
const NA_NUVEM = ['nuvem-a', 'nuvem-b', 'nuvem-c', 'nuvem-falso', 'nuvem-grande'];
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
// cortarApos: derruba a conexão; encurtar: fecha LIMPO depois de n bytes (o tamanho diz n); alongar: manda n bytes a mais
const repasse = { pedidos: [], cortarApos: null, lento: 0, encurtar: null, alongar: null, pararApos: null, parados: [] };
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
      let corpo = Buffer.concat(partes);
      if (repasse.encurtar !== null) corpo = corpo.subarray(0, repasse.encurtar);
      if (repasse.alongar !== null) corpo = Buffer.concat([corpo, Buffer.alloc(repasse.alongar, 0x25)]);
      const cabV = Object.assign({}, volta.headers, { 'content-length': String(corpo.length) });
      delete cabV['transfer-encoding'];
      res.writeHead(200, cabV);
      const corte = repasse.cortarApos, lento = repasse.lento, parar = repasse.pararApos;
      const PASSO = 32 * 1024;
      for (let i = 0; i < corpo.length; i += PASSO) {
        if (corte !== null && i >= corte) { res.socket.destroy(); return; }
        // a rede fraca: o corpo para no meio e a conexão fica ABERTA, sem erro (o repasse a guarda para fechar no fim)
        if (parar !== null && i >= parar) { repasse.parados.push(res); return; }
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
const fim = () => {
  repasse.parados.forEach(r => { try { r.socket.destroy(); } catch (e) { /* já caiu */ } });
  return derrubarEmulador().then(() => new Promise(r => servidorRepasse.close(() => r()))).then(() => H.fim(amb)());
};

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
    if (id === 'local-m') continue;   // só no tablet
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
async function prepararPagina(pag, tela) {
  await pag.evaluateOnNewDocument(t => {
    Object.defineProperty(Screen.prototype, 'width', { configurable: true, get: () => t[0] });
    Object.defineProperty(Screen.prototype, 'height', { configurable: true, get: () => t[1] });
  }, tela || [1280, 800]);
  await pag.evaluateOnNewDocument(cfg => { window.NUVEM_EMULADOR = cfg; }, CFG);
  // cada fetch da página que vai ao Storage (o repasse), e quem chamou um getDownloadURL, se alguém chamasse
  await pag.evaluateOnNewDocument(porta => {
    window.__pedidosStorage = [];
    window.__pedidosCatalogo = [];
    const f0 = window.fetch;
    window.fetch = function (url, op) {
      const u = String(url && url.url || url);
      if (u.indexOf(':' + porta + '/') !== -1 || u.indexOf('firebasestorage') !== -1) window.__pedidosStorage.push(u);
      if (/\/catalogo(\/|$|\?)/.test(u)) window.__pedidosCatalogo.push(u);
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
// a ordem da grade da Estante: livro:<id> do tablet, nuvem:<id> da nuvem
const ordemDaGrade = pag => pag.evaluate(() => Array.from(document.querySelectorAll('.bibl-painel-estante .bibl-grade > [data-livro], .bibl-painel-estante .bibl-grade > [data-nuvem]'))
  .map(c => c.dataset.livro ? 'livro:' + c.dataset.livro : 'nuvem:' + c.dataset.nuvem).join(','));
// a cor da capa de cada livro da grade, como a tela a pinta (--capa)
const coresDaGrade = pag => pag.evaluate(() => {
  const r = {};
  document.querySelectorAll('.bibl-painel-estante .bibl-grade > [data-livro], .bibl-painel-estante .bibl-grade > [data-nuvem]').forEach(c => {
    const capa = c.querySelector('.bibl-capa');
    r[c.dataset.livro || c.dataset.nuvem] = capa ? capa.style.getPropertyValue('--capa') : '';
  });
  return r;
});
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
    for (const [qual, de] of VENENOS[m]) conf('a âncora de ' + m + ' (' + qual + ') aparece uma vez só', FONTES[qual][1].split(de).length - 1, 1);
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
  // o tablet sintético: dois livros importados (o local-l também está no catálogo, e com outro id, o nuvem-dup)
  const gravados = await pag.evaluate(async (ms, b64s) => {
    const livros = ms.map((m, i) => ({ meta: m, blob: new Blob([Uint8Array.from(atob(b64s[i]), c => c.charCodeAt(0))], { type: 'application/pdf' }) }));
    const c = await Store.gravarLivros({ manifest: { pacote: 'livros-prova', versao: 1 }, livros });
    return c.novos;
  }, [meta('local-l'), meta('local-m')], [ARQ['local-l'].toString('base64'), ARQ['local-m'].toString('base64')]);
  conf('o tablet sintético tem os dois livros importados', gravados, 2);
  await H.abrirApp(pag, amb.ORIGEM);
  conf('entrou na nuvem com a conta de teste da dona', await entrar(pag, 'dona@exemplo.test', 'senha-da-dona-1'), true);
  // o motivo de cada baixa que não deu certo, como o nuvem.js o diz (e.codigo)
  const anotarCodigos = () => pag.evaluate(() => {
    window.__codigos = [];
    const b0 = Nuvem.baixarLivroDaNuvem;
    Nuvem.baixarLivroDaNuvem = function () {
      return b0.apply(this, arguments).then(v => { window.__codigos.push('ENTREGUE'); return v; },
        e => { window.__codigos.push(e && e.codigo); throw e; });
    };
  });
  await anotarCodigos();

  secao('1. A Estante mostra os livros da nuvem');
  await abrirEstante(pag);
  const vistos = await esperar('os cartões "Na nuvem" chegaram', () => cartoesDaNuvem(pag), v => v.split(',').length === 4, 30000);
  conf('os quatro livros da nuvem que não estão no tablet aparecem, em ordem de título', vistos.valor, NA_NUVEM.join(','));
  conf('o livro do tablet continua lá, como sempre', await existe(pag, '[data-livro="local-l"]') + '|' + await existe(pag, '[data-nuvem="local-l"]'), 'true|false');
  conf('o livro sem arquivo na nuvem e o retirado não aparecem', await existe(pag, '[data-nuvem="sem-arquivo"]') + '|' + await existe(pag, '[data-nuvem="retirado-r"]'), 'false|false');
  conf('o cartão diz, pequeno, que está na nuvem', await estadoDoCartao(pag, 'nuvem-a'), 'na-nuvem|Na nuvem · toque para baixar');
  conf('o cartão diz o que o toque faz, para o leitor de tela', await pag.evaluate(() => document.querySelector('[data-nuvem="nuvem-a"] > .bibl-livro-cartao').getAttribute('aria-label')),
    'Baixar Álgebra na nuvem da nuvem para o tablet');
  conf('a capa do livro da nuvem é a clara', await pag.evaluate(() => !!document.querySelector('[data-nuvem="nuvem-a"] .bibl-capa.na-nuvem')), true);
  conf('a contagem da seção diz quantos estão na nuvem', await pag.evaluate(() => (document.querySelector('#bib-livros-contagem') || {}).textContent || ''),
    '2 materiais, 1 disciplina · 5 livros na nuvem');
  conf('mostrar não baixou nada do Storage', repasse.pedidos.length, 0);
  conf('o livro do catálogo com o MESMO arquivo de um livro do tablet (outro id) não aparece', await existe(pag, '[data-nuvem="nuvem-dup"]'), false);
  conf('os da nuvem ficam entre os do tablet, em ordem de título', await ordemDaGrade(pag),
    'nuvem:nuvem-a,nuvem:nuvem-b,nuvem:nuvem-c,nuvem:nuvem-falso,livro:local-l,livro:local-m,nuvem:nuvem-grande');
  const coresAntes = await coresDaGrade(pag);
  // a cor de hoje (pela posição em ordem de título) fica com os livros que ela já tem
  conf('os livros que já estavam no tablet ficam com a cor de sempre', coresAntes['local-l'] + '|' + coresAntes['local-m'], 'var(--capa-alfa)|var(--capa-beta)');
  const r1 = await pag.evaluate((m, b64) => Store.gravarLivroDaNuvem({ meta: m, blob: new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type: 'application/pdf' }),
    sha256: m.hash.slice(7), metaHash: 'f'.repeat(64), metaVersao: 1 }).then(r => JSON.stringify(r)).then(r => Store.lerLivro(m.id).then(l => r + '|' + !!l)),
  meta('nuvem-dup'), ARQ['nuvem-dup'].toString('base64'));
  conf('o Store recusa o mesmo arquivo com outro id, e diz qual livro já o tem', r1,
    JSON.stringify({ entrou: false, jaEstava: false, mesmoArquivo: { id: 'local-l', titulo: 'Estatística do tablet' }, bytes: ARQ['local-l'].length }) + '|false');

  secao('2. O sha256 errado é recusado, e nada é guardado');
  await clicar(pag, '[data-nuvem="nuvem-falso"] > .bibl-livro-cartao');
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
  await clicar(pag, '[data-nuvem="nuvem-a"] > .bibl-livro-cartao');
  const caiu = await esperar('a baixa interrompida terminou', () => estadoDoCartao(pag, 'nuvem-a'), v => /^(rede|outro|conferencia)\|/.test(v), 20000);
  conf('o cartão diz que a internet caiu no meio, e que o toque tenta de novo', caiu.valor, 'rede|A internet caiu no meio. Toque para tentar de novo.');
  conf('a metade não virou livro', await livroGuardado(pag, 'nuvem-a'), null);
  conf('nenhum registro novo em livros (só os do tablet)', await pag.evaluate(() => Store.listarLivros().then(l => l.map(x => x.id).join(','))), 'local-l,local-m');
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
  await clicar(pag, '[data-nuvem="nuvem-a"] > .bibl-livro-cartao');
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
  await abrirEstante(pag);
  const coresDepois = await coresDaGrade(pag);
  if (MODO === '--envenenado-cor-pela-posicao') {
    conf('VENENO visto: o livro que já estava no tablet mudou de cor quando outro chegou', coresDepois['local-l'] !== coresAntes['local-l'], true);
    return fim();
  }
  conf('a cor dos livros que já estavam no tablet não mudou com a chegada do outro', coresDepois['local-l'] + '|' + coresDepois['local-m'],
    coresAntes['local-l'] + '|' + coresAntes['local-m']);
  conf('o livro baixado ficou com a cor que o cartão "Na nuvem" mostrava', coresDepois['nuvem-a'], coresAntes['nuvem-a']);
  conf('e no mesmo lugar: nenhum livro andou na Estante', await ordemDaGrade(pag),
    'livro:nuvem-a,nuvem:nuvem-b,nuvem:nuvem-c,nuvem:nuvem-falso,livro:local-l,livro:local-m,nuvem:nuvem-grande');

  secao('3b. O corpo curto e o corpo longo não viram livro');
  await pag.evaluate(() => { window.__codigos = []; });
  repasse.encurtar = 8000;
  await clicar(pag, '[data-nuvem="nuvem-falso"] > .bibl-livro-cartao');
  await esperar('a baixa curta terminou', () => pag.evaluate(() => window.__codigos.length), v => v === 1, 20000);
  repasse.encurtar = null;
  const curto = await pag.evaluate(() => window.__codigos[0]);
  if (MODO === '--envenenado-aceita-curto') {
    conf('VENENO visto: o nuvem.js entregou o corpo que fechou curto (só a conferência do sha256 o parou)', curto, 'ENTREGUE');
    return fim();
  }
  conf('o corpo que fecha limpo, mas curto, é recusado pelo tamanho (INCOMPLETO)', curto, 'INCOMPLETO');
  conf('e o cartão diz que a internet caiu, sem guardar nada', await estadoDoCartao(pag, 'nuvem-falso') + '|' + await livroGuardado(pag, 'nuvem-falso'),
    'rede|A internet caiu no meio. Toque para tentar de novo.|null');
  repasse.alongar = 1000;
  await clicar(pag, '[data-nuvem="nuvem-falso"] > .bibl-livro-cartao');
  await esperar('a baixa longa terminou', () => pag.evaluate(() => window.__codigos.length), v => v === 2, 20000);
  repasse.alongar = null;
  conf('o corpo maior que o catálogo é recusado no meio (TAMANHO_DIFERENTE)', await pag.evaluate(() => window.__codigos[1]), 'TAMANHO_DIFERENTE');
  conf('e o cartão diz que o arquivo veio diferente, sem guardar nada', await estadoDoCartao(pag, 'nuvem-falso') + '|' + await livroGuardado(pag, 'nuvem-falso'),
    'conferencia|O arquivo veio diferente do catálogo e não foi guardado. Toque para tentar de novo.|null');

  secao('3c. A baixa que para no meio, sem erro, solta a vaga no prazo, e tentar de novo funciona');
  await abrirEstante(pag);
  await pag.evaluate(() => { window.__codigos = []; });
  repasse.pararApos = 96 * 1024;
  await clicar(pag, '[data-nuvem="nuvem-b"] > .bibl-livro-cartao');
  await esperar('a baixa parada começou', () => estadoDoCartao(pag, 'nuvem-b'), v => /^baixando\|/.test(v), 10000);
  const parada = await esperar('a baixa parada caiu no prazo', () => estadoDoCartao(pag, 'nuvem-b'), v => /^rede\|/.test(v), PRAZO_DA_PROVA_MS * 4);
  repasse.pararApos = null;
  if (MODO === '--envenenado-sem-prazo') {
    conf('VENENO visto: a baixa parada ficou presa em "Baixando" depois do prazo', /^baixando\|/.test(await estadoDoCartao(pag, 'nuvem-b')), true);
    return fim();
  }
  conf('sem bytes por mais que o prazo, o cartão volta a ser baixável, com a frase da rede', parada.valor, 'rede|A internet caiu no meio. Toque para tentar de novo.');
  conf('o motivo é a baixa parada (PARADO), e nada foi guardado', await pag.evaluate(() => window.__codigos.join(',')) + '|' + await livroGuardado(pag, 'nuvem-b'), 'PARADO|null');
  conf('a vaga ficou livre: o Cancelar sumiu', await pag.evaluate(() => document.querySelector('[data-cancelar-nuvem="nuvem-b"]').classList.contains('bibl-nuvem-cancelar-oculto')), true);

  secao('3d. O Cancelar no meio da baixa não guarda nada e solta a vaga');
  await limparAviso(pag);
  repasse.lento = 250;
  await clicar(pag, '[data-nuvem="nuvem-b"] > .bibl-livro-cartao');
  await esperar('a baixa a cancelar andou', () => estadoDoCartao(pag, 'nuvem-b'), v => { const m = /Baixando · (\d+)%/.exec(v); return !!m && Number(m[1]) >= 10; }, 15000);
  conf('enquanto baixa, o Cancelar está à vista', await pag.evaluate(() => !document.querySelector('[data-cancelar-nuvem="nuvem-b"]').classList.contains('bibl-nuvem-cancelar-oculto')), true);
  await clicar(pag, '[data-cancelar-nuvem="nuvem-b"]');
  const cancelada = await esperar('o cartão voltou depois do Cancelar', () => estadoDoCartao(pag, 'nuvem-b'), v => /^na-nuvem\|/.test(v), 5000);
  await pausa(5000);   // o tempo de a baixa inteira terminar, se o Cancelar não a tivesse parado
  repasse.lento = 0;
  if (MODO === '--envenenado-cancelar-nao-solta') {
    conf('VENENO visto: o Cancelar não parou a baixa (o livro ficou guardado, ou o cartão continuou baixando)',
      !cancelada.ok || (await livroGuardado(pag, 'nuvem-b')) !== null, true);
    return fim();
  }
  conf('depois do Cancelar o cartão volta a "toque para baixar", sem aviso de erro', cancelada.valor, 'na-nuvem|Na nuvem · toque para baixar');
  conf('e nada foi guardado', await livroGuardado(pag, 'nuvem-b'), null);

  secao('4. Dois toques seguidos começam uma baixa só; outro livro espera; o toque logo depois de terminar não baixa de novo');
  await abrirEstante(pag);
  await limparAviso(pag);
  repasse.lento = 60;
  const antesB = await pedidosDe(pag, 'nuvem-b');
  /* logo depois de guardar, quando a tela começa a se refazer (a primeira leitura
   * da lista de livros depois da gravação) e o cartão "Na nuvem" ainda está à
   * vista, ela toca de novo nele */
  await pag.evaluate(() => {
    window.__tocouDepois = null;
    let armado = false;
    const g0 = Store.gravarLivroDaNuvem, l0 = Store.listarLivros;
    Store.gravarLivroDaNuvem = function () {
      return g0.apply(this, arguments).then(r => { armado = true; Store.gravarLivroDaNuvem = g0; return r; });
    };
    Store.listarLivros = function () {
      if (armado) {
        armado = false;
        Store.listarLivros = l0;
        const b = document.querySelector('[data-nuvem="nuvem-b"] > .bibl-livro-cartao');
        window.__tocouDepois = !!b;
        if (b) b.click();
      }
      return l0.apply(this, arguments);
    };
  });
  await pag.evaluate(() => { const c = document.querySelector('[data-nuvem="nuvem-b"] > .bibl-livro-cartao'); c.click(); c.click(); });
  await esperar('a baixa do segundo livro começou', () => estadoDoCartao(pag, 'nuvem-b'), v => /^baixando\|/.test(v), 10000);
  await clicar(pag, '[data-nuvem="nuvem-c"] > .bibl-livro-cartao');
  const umPorVez = await textoDoAviso(pag);
  await esperar('o segundo livro entrou', () => existe(pag, '[data-livro="nuvem-b"]'), v => v === true, 30000);
  await pausa(1500);
  if (MODO === '--envenenado-baixa-dois') {
    conf('VENENO visto: dois toques começaram duas baixas', (await pedidosDe(pag, 'nuvem-b')) - antesB >= 2, true);
    return fim();
  }
  conf('dois toques seguidos, e mais um logo depois de guardar: uma baixa só', (await pedidosDe(pag, 'nuvem-b')) - antesB, 1);
  conf('o toque logo depois de guardar foi dado no cartão "Na nuvem" ainda à vista', await pag.evaluate(() => window.__tocouDepois), true);
  conf('o toque noutro livro durante a baixa avisa e não baixa', umPorVez + '|' + await pedidosDe(pag, 'nuvem-c'), 'Um livro por vez: espere o que está baixando terminar.|0');
  conf('o segundo livro está guardado inteiro', JSON.parse(await livroGuardado(pag, 'nuvem-b')).sha, SHA['nuvem-b']);
  conf('o livro de fora continua na nuvem, pronto para o toque', await estadoDoCartao(pag, 'nuvem-c'), 'na-nuvem|Na nuvem · toque para baixar');

  secao('5. Sem internet, o cartão diz, e nada quebra');
  repasse.lento = 0;
  await pag.setOfflineMode(true);
  const semRede = await esperar('o cartão percebeu a falta de internet', () => estadoDoCartao(pag, 'nuvem-c'), v => /^sem-rede\|/.test(v), 5000);
  conf('sem internet, o cartão diz que não baixa agora', semRede.valor, 'sem-rede|Sem internet agora; toque de novo quando ela voltar.');
  await clicar(pag, '[data-nuvem="nuvem-c"] > .bibl-livro-cartao');
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
  await clicar(pag, '[data-nuvem="nuvem-c"] > .bibl-livro-cartao');
  const cheio = await esperar('o cartão diz da falta de espaço', () => estadoDoCartao(pag, 'nuvem-c'), v => /^sem-espaco\|/.test(v), 5000);
  conf('o cartão diz que falta espaço', cheio.valor, 'sem-espaco|Falta espaço no tablet para este livro.');
  conf('o aviso diz quanto falta e o que fazer', /^O tablet está sem espaço para este livro: ele precisa de .+ e há .+ livres\. Libere espaço no tablet/.test(await textoDoAviso(pag)), true);
  conf('sem espaço, nada é pedido à rede nem guardado', await pedidosDe(pag, 'nuvem-c') + '|' + await livroGuardado(pag, 'nuvem-c'), '0|null');
  await pag.evaluate(() => { Store.estimarEspaco = window.__estimar0; });

  secao('6b. A cota do IndexedDB acaba na gravação: o mesmo aviso, e nada guardado');
  await limparAviso(pag);
  await pag.evaluate(() => {
    window.__put0 = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (v) {
      if (this.name === 'livros' && v && v.id === 'nuvem-c') throw new DOMException('A cota acabou.', 'QuotaExceededError');
      return window.__put0.apply(this, arguments);
    };
  });
  await clicar(pag, '[data-nuvem="nuvem-c"] > .bibl-livro-cartao');
  const cota = await esperar('o cartão diz da cota', () => estadoDoCartao(pag, 'nuvem-c'), v => /^sem-espaco\|/.test(v), 20000);
  await pag.evaluate(() => { IDBObjectStore.prototype.put = window.__put0; });
  conf('a cota que acaba na gravação diz que falta espaço', cota.valor, 'sem-espaco|Falta espaço no tablet para este livro.');
  conf('o aviso diz o que fazer', /^O tablet está sem espaço para este livro: .+ Libere espaço no tablet/.test(await textoDoAviso(pag)), true);
  conf('e nada foi guardado', await livroGuardado(pag, 'nuvem-c'), null);

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
    'nuvem-c,nuvem-falso,nuvem-grande');

  secao('8. O getDownloadURL nunca entra');
  const doStorage = repasse.pedidos;
  const fora = doStorage.filter(p => p.metodo !== 'GET' || !/^\/v0\/b\/[^/]+\/o\/[^/?]+\?alt=media$/.test(p.url) || !/^Firebase \S+$/.test(p.autor) || /token=/.test(p.url));
  conf('todo pedido ao Storage foi um GET ?alt=media com Authorization: Firebase <idToken>, sem token na URL', fora.map(p => p.metodo + ' ' + p.url).join(' ; '), '');
  conf('nenhum pedido leu os metadados do objeto (onde mora o token do getDownloadURL)', doStorage.filter(p => !/alt=media/.test(p.url)).length, 0);
  const daPagina = await pag.evaluate(() => window.__pedidosStorage.slice());
  conf('a página pediu ao Storage só as nove baixas (o falso três vezes, o A duas, o B três e o C da cota), todas pelo ?alt=media', daPagina.length + '|' +
    daPagina.every(u => /\?alt=media$/.test(u) && !/token=/.test(u)), '9|true');
  conf('todo fetch da página chegou ao repasse (a conta dele não é menor)', doStorage.length >= daPagina.length, true);
  conf('ninguém chamou getDownloadURL na página', await pag.evaluate(() => !!window.__chamouGetDownloadURL), false);

  secao('8b. A memória: baixar um livro de ' + Math.round(ARQ['nuvem-grande'].length / 1048576) + ' MB não segura o livro inteiro na memória');
  /* A memória VIVA da página (o heap do JavaScript mais os ArrayBuffers, depois de
   * uma coleta de lixo pedida pela própria prova), medida a cada passo da baixa,
   * da conferência e da gravação. O limite é metade do livro: a baixa junta os
   * pedaços em Blobs de 4 MB e o hash lê trechos de 1 MB, e quem segura o livro
   * inteiro (a cópia de antes, ou os pedaços todos) passa de uma vez o tamanho. */
  const N = ARQ['nuvem-grande'].length;
  const cdp = await pag.target().createCDPSession();
  await cdp.send('HeapProfiler.enable');
  const vivo = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    const u = await cdp.send('Runtime.getHeapUsage');
    return (u.usedSize || 0) + (u.backingStorageSize || 0);
  };
  conf('o Chrome diz a memória dos ArrayBuffers (backingStorageSize), além do heap', typeof (await cdp.send('Runtime.getHeapUsage')).backingStorageSize, 'number');
  await abrirEstante(pag);
  const base = await vivo();
  repasse.lento = 3;
  await clicar(pag, '[data-nuvem="nuvem-grande"] > .bibl-livro-cartao');
  let pico = base, amostras = 0;
  const fimGrande = Date.now() + 120000;
  while (Date.now() < fimGrande) {
    pico = Math.max(pico, await vivo());
    amostras++;
    if (await existe(pag, '[data-livro="nuvem-grande"]') || /^(rede|conferencia|outro|sem-espaco)\|/.test(await estadoDoCartao(pag, 'nuvem-grande'))) break;
    await pausa(60);
  }
  repasse.lento = 0;
  const acima = pico - base;
  console.log('   memória viva: base ' + (base / 1048576).toFixed(1) + ' MB, pico ' + (pico / 1048576).toFixed(1) + ' MB, acima da base ' +
    (acima / 1048576).toFixed(1) + ' MB (' + (acima / N).toFixed(2) + ' vezes o livro de ' + (N / 1048576).toFixed(1) + ' MB), ' + amostras + ' amostras');
  if (MODO === '--envenenado-copia-inteira') {
    conf('VENENO visto: a baixa segurou o livro inteiro na memória (o pico passou de metade do livro)', acima > 0.5 * N, true);
    return fim();
  }
  conf('o livro grande entrou no tablet, inteiro e conferido', JSON.parse(await livroGuardado(pag, 'nuvem-grande') || '{}').sha, SHA['nuvem-grande']);
  conf('o pico da memória viva acima da base ficou abaixo de metade do livro', acima < 0.5 * N, true);
  conf('a medida teve amostras durante a baixa', amostras >= 5, true);

  secao('8c. O livro que ela tira do tablet volta a aparecer "na nuvem" na hora');
  await H.irParaAba(pag, 'ajustes');
  await esperar('a lista de livros de Ajustes', () => existe(pag, '[data-remover-livro="local-l"]'), v => v === true, 10000);
  await clicar(pag, '[data-remover-livro="local-l"]');
  await esperar('o livro saiu do tablet', () => pag.evaluate(() => Store.lerLivro('local-l').then(l => !l)), v => v === true, 10000);
  await abrirEstante(pag);
  const voltouNaNuvem = await esperar('o livro tirado voltou como "na nuvem"', () => existe(pag, '[data-nuvem="local-l"]'), v => v === true, 10000);
  conf('o livro tirado do tablet, que está no catálogo, aparece "na nuvem" sem esperar a conferência seguinte', voltouNaNuvem.ok, true);

  secao('9. A conta troca no meio da conferência: a outra conta não vê nada da primeira');
  const outra = await conta('outra@exemplo.test', 'senha-da-outra-1');
  conf('a segunda conta de teste existe no emulador (sem catálogo nenhum)', !!outra.localId, true);
  // a lista guardada fica velha (a conferência roda de novo ao abrir a Estante), e a página abre de novo
  await pag.evaluate(() => Nuvem.lerLivrosNaNuvem().then(v => Nuvem.guardarLivrosNaNuvem(Object.assign({}, v, { quando: 0, livros: {} }), v.uid)));
  await H.abrirApp(pag, amb.ORIGEM);
  // o último documento do catálogo da dona (o nuvem-falso; o nuvem-c já chegou) fica SEGURO até a conta trocar
  await pag.evaluate(() => {
    window.__soltar = null;
    const l0 = Nuvem.lerLivroDoCatalogo;
    Nuvem.lerLivroDoCatalogo = function (id) {
      const p = l0.apply(this, arguments);
      if (id !== 'nuvem-falso') return p;
      return p.then(d => new Promise(r => { window.__soltar = () => r(d); }));
    };
  });
  await abrirEstante(pag);
  const segurou = await esperar('a conferência está no meio (um documento da dona seguro)', () => pag.evaluate(() => !!window.__soltar), v => v === true, 20000);
  conf('a conferência da dona começou e parou no meio', segurou.ok, true);
  const trocou = await pag.evaluate(() => Nuvem.sair().then(() => Nuvem.entrar('outra@exemplo.test', 'senha-da-outra-1')).then(s => s.uid));
  conf('saiu da conta da dona e entrou com a outra no meio da conferência', trocou, outra.localId);
  /* o que fica guardado depois de cada gravação da lista, na conta que está dentro: a conferência
   * da outra conta, logo depois, regrava a lista dela (vazia), e por isso a prova olha cada momento */
  await pag.evaluate(() => {
    window.__guardadas = [];
    const g0 = Nuvem.guardarLivrosNaNuvem;
    Nuvem.guardarLivrosNaNuvem = function () {
      return g0.apply(this, arguments).then(r => Nuvem.lerLivrosNaNuvem().then(v => {
        window.__guardadas.push(Object.keys(v && v.livros || {}).join('+'));
        return r;
      }));
    };
  });
  await pag.evaluate(() => window.__soltar());
  await pausa(2500);
  const guardadas = await pag.evaluate(() => window.__guardadas.filter(Boolean).join(' ; '));
  const guardada = await pag.evaluate(() => Nuvem.lerLivrosNaNuvem().then(v => JSON.stringify(v ? Object.keys(v.livros || {}) : null)));
  if (MODO === '--envenenado-grava-na-conta-nova') {
    conf('VENENO visto: a lista da dona ficou guardada como da outra conta', /nuvem-c/.test(guardadas), true);
    return fim();
  }
  conf('em nenhum momento a lista da dona ficou guardada para a outra conta', guardadas, '');
  conf('e nada da dona ficou guardado no fim', /nuvem-c|nuvem-falso/.test(guardada), false);
  await H.abrirApp(pag, amb.ORIGEM);
  await abrirEstante(pag);
  await pausa(1500);
  const textoDaBib = await pag.evaluate(() => (document.querySelector('#tela-biblioteca') || document.body).innerText);
  conf('a outra conta não vê nenhum livro da nuvem da dona', await cartoesDaNuvem(pag) + '|' + /Caderno de frações|Dicionário trocado/.test(textoDaBib), '|false');

  secao('10. O observador de verdade (a marca de celular, com a conta de outra pessoa) não vê nem lê o catálogo');
  // a outra conta está dentro; a marca diz que a cópia é da dona: é o observador (D7)
  await pag.evaluate(u => Nuvem.marcarCelular(u), U);
  await H.abrirApp(pag, amb.ORIGEM);
  await pausa(3000);
  const obs = await pag.evaluate(() => JSON.stringify({ observador: Nuvem.estado().observador, celular: document.body.classList.contains('modo-celular'),
    cartoes: document.querySelectorAll('[data-nuvem]').length, catalogo: window.__pedidosCatalogo.length }));
  conf('o observador está em modo celular, sem cartão da nuvem e sem ler o catálogo', obs, JSON.stringify({ observador: true, celular: true, cartoes: 0, catalogo: 0 }));
  await pag.evaluate(() => Nuvem.desmarcarCelular().then(() => Nuvem.sair()));

  secao('11. No modo celular (a tela do celular), nenhum livro da nuvem');
  const pagCel = await amb.pagina();
  await prepararPagina(pagCel, [390, 844]);
  await pagCel.setViewport({ width: 390, height: 844 });
  await H.abrirApp(pagCel, amb.ORIGEM);
  await pagCel.evaluate(() => Nuvem.entrar('dona@exemplo.test', 'senha-da-dona-1'));
  await H.abrirApp(pagCel, amb.ORIGEM);
  await pausa(3000);
  const cel = await pagCel.evaluate(() => JSON.stringify({ celular: document.body.classList.contains('modo-celular'), conta: !!Nuvem.estado().entrada,
    cartoes: document.querySelectorAll('[data-nuvem]').length, catalogo: window.__pedidosCatalogo.length }));
  conf('no celular da dona, sem cartão da nuvem e sem ler o catálogo', cel, JSON.stringify({ celular: true, conta: true, cartoes: 0, catalogo: 0 }));

  secao('12. Nenhum erro de página');
  conf('nenhum erro de página', pag.errosDePagina.concat(pagCel.errosDePagina).join(' | '), '');
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
