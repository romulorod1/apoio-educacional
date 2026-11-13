/* testa_sem_fonte_privada.js
 *
 * Nada da fonte privada de anos iniciais entra neste repositório público.
 *
 * A fonte são os cadernos estaduais de matemática dos anos iniciais. A licença
 * deles só permite o uso pessoal de professor e aluno: os PDFs, o texto
 * extraído e os pacotes gerados a partir deles moram numa pasta privada do
 * Drive, fora do repositório, e aqui não pode entrar nem o nome.
 *
 * As marcas NÃO aparecem escritas neste arquivo. Elas são montadas na hora
 * (a sigla por códigos de caractere, o título por uma frase invertida), e por
 * isso a prova não precisa de exceção para si mesma: ela se varre junto com
 * todo o resto e sai limpa.
 *
 * AS CAMADAS, nenhuma depende de segredo:
 *
 *   1. TIPO PROIBIDO, pelos bytes do começo e não pela extensão: PDF, zip (e
 *      com ele docx, xlsx, odt, epub), gzip, bzip2, xz, zstd, 7z, rar, tar e
 *      documento OLE (doc e xls antigos). Pega o caderno renomeado e o PDF
 *      salvo de novo sem lista nenhuma. As imagens e o wasm do app não são
 *      desses tipos. Exceção só pela lista FECHADA EXCECOES_DE_TIPO, caminho
 *      por caminho e com motivo; o conteúdo do exceptuado continua varrido.
 *
 *   2. MARCAS no nome e no conteúdo, sem diferença de maiúscula nem de acento:
 *      a sigla como palavra inteira (sem letra colada; dígito, sublinhado e
 *      ponto separam), a sigla em maiúsculas colada como no CamelCase, a sigla
 *      com pontos entre as letras e o título dos cadernos com qualquer
 *      separador ou sem separador nenhum. Onde se procura:
 *        texto        UTF-8, ou UTF-16 com ou sem BOM (um byte nulo cedo não
 *                     desliga a varredura: o que decodifica como UTF-16 é
 *                     texto);
 *        PDF          os bytes crus, as strings literais com escape octal, as
 *                     strings hexadecimais (UTF-16 com BOM inclusive, que é
 *                     como os metadados costumam vir) e todos os streams que o
 *                     zlib abre;
 *        zip          o nome, o conteúdo e o SHA de cada entrada, zip dentro
 *                     de zip até LIMITE_ZIP níveis. Zip ilegível, zip64,
 *                     cifrado, de método desconhecido ou aninhado além do
 *                     limite REPROVA, porque pode esconder qualquer coisa;
 *        gzip         o que ele descomprime;
 *        imagem, wasm só o nome e o SHA;
 *        outro binário os bytes como latin1, sem os nulos.
 *
 *   3. SHA-256 de cada arquivo e de cada entrada contra a lista da fonte, SÓ
 *      NA MÁQUINA: o arquivo FONTE_PRIVADA_SHAS ou o caminho padrão no Drive.
 *      Só o primeiro campo de cada linha conta (o formato do sha256sum); os
 *      nomes nunca são impressos. Sem a lista (no CI ela nunca existe), a
 *      prova diz que pulou esta camada e NÃO reprova. Lista que existe e não
 *      tem SHA nenhum reprova: o instrumento não estaria vendo.
 *
 * O QUE É VARRIDO: a árvore (todo arquivo de `git ls-files`, lido do disco) e o
 * HISTÓRICO que o merge leva junto: cada blob novo, cada caminho e cada
 * mensagem dos commits da faixa. A faixa é `origin/main..HEAD` no PR e na
 * máquina, `antes..HEAD` no push na main (o "before" do evento) e a que se
 * passar em --faixa (o hook _teste/hooks/pre-push usa esta).
 *
 * A PROVA PROVA QUE RODA: o próprio caminho dela tem de estar em `git ls-files`
 * e tem de ter sido varrido, e o .gitignore não pode ignorá-la.
 *
 *   node _teste/testa_sem_fonte_privada.js [--faixa A..B]
 *   node _teste/testa_sem_fonte_privada.js --envenenado-com-fonte-privada
 *        num repositório git temporário, fora desta árvore, monta cada caso que
 *        tem de reprovar (um de cada camada e de cada formato, e o histórico
 *        com um commit que acrescenta e outro que apaga), os controles limpos
 *        que não podem reprovar e a camada de SHA dos dois lados (sem a lista,
 *        passa e diz que pulou; com uma lista temporária, pega o PDF listado). Cada caso tem de sair acusado pelo motivo
 *        certo ("VENENO visto"). O índice desta árvore não é tocado, e a pasta
 *        temporária é apagada.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { execFileSync, spawnSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const EU = '_teste/testa_sem_fonte_privada.js';
const VENENO = '--envenenado-com-fonte-privada';

/* Os argumentos: o veneno e --faixa A..B. */
const argv = process.argv.slice(2);
const ENVENENADA = argv.indexOf(VENENO) >= 0;
let faixaDada = null;
const desconhecidos = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === VENENO) continue;
  if (argv[i] === '--faixa' && argv[i + 1]) { faixaDada = argv[++i]; continue; }
  desconhecidos.push(argv[i]);
}

/* ------------------------------------------------------------ as marcas */
const SIGLA = String.fromCharCode(101, 109, 97, 105);
const SIGLA_M = SIGLA.toUpperCase();
const TITULO = 'siaicini sona son acitametam oacacude'.split('').reverse().join('').split(' ');
const RE_SIGLA = new RegExp('(^|[^a-z])' + SIGLA + '(?![a-z])');
const RE_SIGLA_PONTOS = new RegExp('(^|[^a-z])' + SIGLA.split('').join('\\.\\s?') + '(?![a-z])');
/* Em maiúsculas, colada em qualquer coisa (CadernoXYZ3, nomeXYZTres), menos
 * depois de outra maiúscula e menos a palavra inglesa de correio eletrônico. */
const RE_SIGLA_CAIXA = new RegExp('(?<![A-Z])' + SIGLA_M + '(?!L)');
const RE_TITULO = new RegExp(TITULO.join('[^a-z0-9]*'));

/* Os caminhos padrão, na pasta privada do Drive. */
const PASTA_PRIVADA = 'J:\\Meu Drive\\Vida Pessoal\\Família\\Material pra Nath\\Aplicativo\\Biblioteca\\privado\\' + SIGLA;
const CAMINHO_SHAS = PASTA_PRIVADA + '\\shas.txt';

const LIMITE_ZIP = 3;

/* Exceções ao TIPO proibido, uma por caminho, cada uma com o motivo. Vazia:
 * a main não tem nenhum arquivo desses tipos. O conteúdo de quem estiver aqui
 * continua varrido por todas as outras camadas. */
const EXCECOES_DE_TIPO = [
];

let passes = 0, falhas = 0;
function conf(rotulo, ok, detalhe) {
  if (ok) { passes++; console.log('  OK    ' + rotulo); }
  else { falhas++; console.log('  FALHA ' + rotulo + (detalhe ? '  [' + detalhe + ']' : '')); }
}

function semAcento(s) {
  return s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

/* A saída do CI é pública: sigla e título saem mascarados em tudo que vem de
 * fora (caminhos, nomes, trechos). */
function mascara(s) {
  return String(s)
    .replace(new RegExp(SIGLA + '(?!l)', 'gi'), '<sigla>')
    .replace(new RegExp(TITULO.join('[^A-Za-z0-9]*'), 'gi'), '<título>');
}

/* As marcas de um texto: [{marca, linha}]. */
function marcasDe(texto) {
  const caixa = semAcento(texto);
  const t = caixa.toLowerCase();
  const achou = [];
  const linha = (s, i) => s.slice(0, i).split('\n').length;
  [['sigla', RE_SIGLA, t], ['sigla com pontos', RE_SIGLA_PONTOS, t], ['sigla em maiúsculas', RE_SIGLA_CAIXA, caixa], ['título', RE_TITULO, t]]
    .forEach(([marca, re, s]) => {
      const m = re.exec(s);
      if (m) achou.push({ marca, linha: linha(s, m.index + (m[1] || '').length) });
    });
  return achou;
}

/* ------------------------------------------------- a lista de SHAs */
/* Só o primeiro campo de cada linha, no formato do sha256sum. */
function shasDe(texto) {
  const s = new Set();
  texto.replace(/^\uFEFF/, '').split(/\r?\n/).forEach(l => {
    if (/^\s*#/.test(l)) return;
    const m = l.match(/^\s*([0-9a-fA-F]{64})(?:\s|$)/);
    if (m) s.add(m[1].toLowerCase());
  });
  return s;
}
/* A lista é só local: FONTE_PRIVADA_SHAS ou o caminho padrão. Devolve
 * {conjunto, de} ou {pulada} ou {erro}; a falta nunca reprova, nem no CI. */
function fonteShas(env) {
  const arq = env.FONTE_PRIVADA_SHAS || CAMINHO_SHAS;
  if (!fs.existsSync(arq)) return { pulada: 'sem a lista privada, pulei a camada de SHA' };
  const conjunto = shasDe(fs.readFileSync(arq, 'utf8'));
  if (!conjunto.size) return { erro: 'a lista privada existe e não tem nenhum SHA (' + mascara(arq) + ')' };
  return { conjunto, de: mascara(arq) };
}

/* ------------------------------------------------------------ os tipos */
function comeca(buf, bytes, em) {
  em = em || 0;
  if (buf.length < em + bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) if (buf[em + i] !== bytes[i]) return false;
  return true;
}
const asc = s => Array.from(Buffer.from(s, 'latin1'));
function ehZip(buf) {
  return comeca(buf, asc('PK\x03\x04')) || comeca(buf, asc('PK\x05\x06')) || comeca(buf, asc('PK\x07\x08'));
}
function ehPdf(buf) {
  return buf.subarray(0, 1024).indexOf('%PDF-') >= 0;
}
function tipoProibido(buf) {
  if (ehPdf(buf)) return 'PDF';
  if (ehZip(buf)) return 'zip (também docx, xlsx, odt, epub)';
  if (comeca(buf, [0x1f, 0x8b])) return 'gzip';
  if (comeca(buf, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) return '7z';
  if (comeca(buf, asc('Rar!\x1a\x07'))) return 'rar';
  if (comeca(buf, asc('BZh')) && buf[3] >= 0x31 && buf[3] <= 0x39) return 'bzip2';
  if (comeca(buf, [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00])) return 'xz';
  if (comeca(buf, [0x28, 0xb5, 0x2f, 0xfd])) return 'zstd';
  if (comeca(buf, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return 'documento OLE (doc, xls antigos)';
  if (comeca(buf, asc('ustar'), 257)) return 'tar';
  return null;
}
/* As mídias do app: só nome e SHA. */
function ehMidia(buf) {
  return comeca(buf, [0x89, 0x50, 0x4e, 0x47]) || comeca(buf, [0xff, 0xd8, 0xff]) || comeca(buf, asc('GIF8')) ||
    (comeca(buf, asc('RIFF')) && comeca(buf, asc('WEBP'), 8)) || comeca(buf, [0, 0, 1, 0]) ||
    comeca(buf, [0, 0x61, 0x73, 0x6d]) || comeca(buf, asc('wOFF')) || comeca(buf, asc('wOF2'));
}

/* Texto: UTF-8 (com ou sem BOM) ou UTF-16 (com BOM, ou sem BOM quando os
 * nulos caem num lado só). Devolve a string, ou null para binário. */
function decodifica(buf) {
  if (comeca(buf, [0xef, 0xbb, 0xbf])) return buf.subarray(3).toString('utf8');
  if (comeca(buf, [0xff, 0xfe])) return buf.subarray(2).toString('utf16le');
  if (comeca(buf, [0xfe, 0xff])) return trocaPares(buf.subarray(2)).toString('utf16le');
  const ini = buf.subarray(0, 8000);
  if (ini.indexOf(0) < 0) return buf.toString('utf8');
  let par = 0, impar = 0;
  for (let i = 0; i < ini.length; i++) if (ini[i] === 0) { if (i % 2) impar++; else par++; }
  const metade = Math.floor(ini.length / 2);
  if (impar > metade * 0.4 && par < metade * 0.05) return buf.toString('utf16le');
  if (par > metade * 0.4 && impar < metade * 0.05) return trocaPares(buf).toString('utf16le');
  return null;
}
function trocaPares(b) {
  const c = Buffer.from(b.subarray(0, b.length - (b.length % 2)));
  return c.swap16();
}

/* ---------------------------------------------------------------- zip */
/* As entradas pelo diretório central: [{nome, metodo, dados}] (dados nulo no
 * método desconhecido). Lança erro se não for legível. */
function entradasDoZip(buf) {
  let fim = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { fim = i; break; }
  }
  if (fim < 0) throw new Error('sem o fim do diretório central');
  const total = buf.readUInt16LE(fim + 10);
  let p = buf.readUInt32LE(fim + 16);
  if (total === 0xffff || p === 0xffffffff) throw new Error('zip64 não é lido');
  const lista = [];
  for (let k = 0; k < total; k++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) throw new Error('diretório central quebrado');
    const bandeiras = buf.readUInt16LE(p + 8);
    const metodo = buf.readUInt16LE(p + 10);
    const tamComp = buf.readUInt32LE(p + 20);
    const nl = buf.readUInt16LE(p + 28), el = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const nome = buf.subarray(p + 46, p + 46 + nl).toString((bandeiras & 0x800) ? 'utf8' : 'latin1');
    if (bandeiras & 1) throw new Error('entrada cifrada');
    if (local + 30 > buf.length || buf.readUInt32LE(local) !== 0x04034b50) throw new Error('cabeçalho local ausente');
    const ini = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const bruto = buf.subarray(ini, ini + tamComp);
    let dados = null;
    if (metodo === 0) dados = bruto;
    else if (metodo === 8) dados = zlib.inflateRawSync(bruto);
    lista.push({ nome, metodo, dados });
    p += 46 + nl + el + cl;
  }
  return lista;
}

/* ---------------------------------------------------------------- PDF */
/* O texto que um PDF deixa ler sem renderizar. */
function textoDoPdf(buf) {
  const cru = buf.toString('latin1');
  const partes = [cru];
  const re = /(?<!end)stream\r?\n/g;
  let m;
  while ((m = re.exec(cru))) {
    const ini = m.index + m[0].length;
    const fim = cru.indexOf('endstream', ini);
    if (fim < 0) break;
    try {
      partes.push(zlib.inflateSync(buf.subarray(ini, fim), { finishFlush: zlib.constants.Z_SYNC_FLUSH }).toString('latin1'));
    } catch (e) { /* stream que não é deflate */ }
    re.lastIndex = fim + 'endstream'.length;
  }
  return partes.map(stringsDoPdf).join('\n');
}
/* Desfaz os escapes octais das strings literais e as strings hexadecimais
 * (UTF-16 com BOM vira texto), e tira os nulos do UTF-16 sem BOM. */
function stringsDoPdf(s) {
  const octal = s.replace(/\\([0-7]{1,3})/g, (x, o) => String.fromCharCode(parseInt(o, 8) & 0xff));
  const hex = [];
  s.replace(/<([0-9A-Fa-f\s]{8,})>/g, (x, h) => {
    const b = Buffer.from(h.replace(/\s/g, ''), 'hex');
    hex.push(comeca(b, [0xfe, 0xff]) ? trocaPares(b.subarray(2)).toString('utf16le') : b.toString('latin1'));
    return x;
  });
  const sem = t => t.replace(/\xfe\xff/g, '').replace(/\0/g, '');
  return [sem(octal), hex.join('\n')].join('\n');
}

/* ---------------------------------------------------------- o exame */
/* Examina um conteúdo (arquivo, blob do histórico ou entrada de zip).
 * `onde` é o caminho no relatório; entrada de zip vai como "pacote.zip!x". */
function examina(onde, buf, ctx, prof, de) {
  const acha = (tipo, marca) => ctx.achados.push({ arquivo: onde, de, tipo, marca });
  if (ctx.shas && ctx.shas.has(crypto.createHash('sha256').update(buf).digest('hex'))) acha('sha256', 'SHA da lista da fonte privada');
  const tipo = tipoProibido(buf);
  if (tipo && !(prof === 0 && ctx.excecoes.has(onde))) acha('tipo proibido', tipo);
  const texto = t => marcasDe(t).forEach(a => acha('marca', a.marca + (a.linha > 1 ? ', linha ' + a.linha : '')));
  if (ehZip(buf)) {
    if (prof >= LIMITE_ZIP) { acha('zip', 'zip aninhado além de ' + LIMITE_ZIP + ' níveis'); return; }
    let entradas;
    try { entradas = entradasDoZip(buf); } catch (e) { acha('zip', 'zip que não se deixa ler (' + e.message + ')'); return; }
    entradas.forEach(en => {
      const sub = onde + '!' + en.nome;
      marcasDe(en.nome).forEach(a => ctx.achados.push({ arquivo: sub, de, tipo: 'nome', marca: a.marca }));
      if (en.dados === null) ctx.achados.push({ arquivo: sub, de, tipo: 'zip', marca: 'método de compressão desconhecido (' + en.metodo + ')' });
      else examina(sub, en.dados, ctx, prof + 1, de);
    });
    return;
  }
  if (comeca(buf, [0x1f, 0x8b])) {
    let d;
    try { d = zlib.gunzipSync(buf); } catch (e) { acha('gzip', 'gzip que não se deixa ler'); return; }
    if (prof >= LIMITE_ZIP) { acha('zip', 'compressão aninhada além de ' + LIMITE_ZIP + ' níveis'); return; }
    examina(onde + '!gunzip', d, ctx, prof + 1, de);
    return;
  }
  if (ehPdf(buf)) { texto(textoDoPdf(buf)); return; }
  const t = decodifica(buf);
  if (t !== null) { texto(t); return; }
  if (ehMidia(buf)) return;
  marcasDe(buf.toString('latin1').replace(/\0/g, '')).forEach(a => acha('marca', a.marca + ' (bytes de binário)'));
}

function git(raiz, args, input) {
  return execFileSync('git', args, { cwd: raiz, input, maxBuffer: 1024 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] });
}

/* A faixa do histórico: --faixa, o "before" do push na main, origin/main..HEAD.
 * Devolve {faixa} ou {pulada} ou {erro}. */
function faixaPadrao(env, raiz) {
  if (faixaDada) return { faixa: faixaDada, de: '--faixa' };
  const existe = ref => { try { git(raiz, ['rev-parse', '--verify', '-q', ref + '^{commit}']); return true; } catch (e) { return false; } };
  const noCI = env.GITHUB_ACTIONS === 'true';
  if (env.GITHUB_EVENT_NAME === 'push' && env.GITHUB_EVENT_PATH) {
    let antes = '';
    try { antes = JSON.parse(fs.readFileSync(env.GITHUB_EVENT_PATH, 'utf8')).before || ''; } catch (e) { /* sem evento */ }
    if (antes && !/^0+$/.test(antes) && existe(antes)) return { faixa: antes + '..HEAD', de: 'o push (before do evento)' };
    return { erro: 'push sem um "before" que exista no clone: não sei que commits o push trouxe' };
  }
  if (existe('origin/main')) return { faixa: 'origin/main..HEAD', de: 'origin/main..HEAD' };
  if (noCI) return { erro: 'no CI sem origin/main: não sei que commits o PR leva' };
  return { pulada: 'sem origin/main nesta cópia' };
}

/* A varredura: a árvore de `git ls-files` e, com faixa, o histórico dela. */
function varre(raiz, opcoes) {
  const ctx = { shas: opcoes.shas, excecoes: new Set(opcoes.excecoes || []), achados: [] };
  const arquivos = git(raiz, ['ls-files', '-z']).toString('utf8').split('\0').filter(Boolean);
  const vistos = new Set();
  const ilegiveis = [];
  arquivos.forEach(rel => {
    marcasDe(rel).forEach(a => ctx.achados.push({ arquivo: rel, de: 'árvore', tipo: 'nome', marca: a.marca }));
    let buf;
    try { buf = fs.readFileSync(path.join(raiz, rel)); } catch (e) { ilegiveis.push(rel); return; }
    vistos.add(rel);
    examina(rel, buf, ctx, 0, 'árvore');
  });
  const historico = { commits: 0, blobs: 0, caminhos: 0 };
  if (opcoes.faixa) {
    const f = opcoes.faixa;
    historico.commits = git(raiz, ['rev-list', f]).toString().split('\n').filter(Boolean).length;
    const caminhos = new Set(git(raiz, ['log', '--no-renames', '--format=', '--name-only', '-z', f]).toString('utf8').split(/\0|\n/).filter(Boolean));
    historico.caminhos = caminhos.size;
    caminhos.forEach(c => marcasDe(c).forEach(a => ctx.achados.push({ arquivo: c, de: 'histórico', tipo: 'nome', marca: a.marca })));
    git(raiz, ['log', '--format=%H%x01%B%x00', f]).toString('utf8').split('\0').forEach(bloco => {
      const [h, corpo] = bloco.replace(/^\n/, '').split('\x01');
      if (!h || corpo === undefined) return;
      marcasDe(corpo).forEach(a => ctx.achados.push({ arquivo: 'commit ' + h.slice(0, 10), de: 'mensagem de commit', tipo: 'marca', marca: a.marca }));
    });
    const objetos = git(raiz, ['rev-list', '--objects', f]).toString('utf8').split('\n').filter(Boolean)
      .map(l => { const i = l.indexOf(' '); return i < 0 ? { sha: l, nome: '' } : { sha: l.slice(0, i), nome: l.slice(i + 1) }; });
    if (objetos.length) {
      const tipos = git(raiz, ['cat-file', '--batch-check=%(objectname) %(objecttype)'], objetos.map(o => o.sha).join('\n') + '\n')
        .toString().split('\n').filter(Boolean);
      /* O blob que está no índice já foi varrido como arquivo da árvore. */
      const noIndice = new Set(git(raiz, ['ls-files', '-s', '-z']).toString('utf8').split('\0').filter(Boolean).map(l => l.split(' ')[1]));
      const blobs = objetos.filter((o, i) => / blob$/.test(tipos[i] || '') && !noIndice.has(o.sha));
      historico.blobs = blobs.length;
      if (blobs.length) {
        const saida = git(raiz, ['cat-file', '--batch'], blobs.map(b => b.sha).join('\n') + '\n');
        let p = 0;
        blobs.forEach(b => {
          const nl = saida.indexOf(10, p);
          const tam = parseInt(saida.subarray(p, nl).toString().split(' ')[2], 10);
          const dados = saida.subarray(nl + 1, nl + 1 + tam);
          p = nl + 1 + tam + 1;
          examina(b.nome || b.sha, dados, ctx, 0, 'histórico, blob ' + b.sha.slice(0, 10));
        });
      }
    }
  }
  return { arquivos, achados: ctx.achados, vistos, ilegiveis, historico };
}

function relatorio(achados) {
  return achados.map(a => '        ' + mascara(a.arquivo) + '  (' + a.de + '; ' + a.tipo + ': ' + mascara(a.marca) + ')').join('\n');
}

/* ----------------------------------------------------- a prova normal */
function provaNormal() {
  const env = process.env;
  const fs1 = fonteShas(env);
  if (fs1.pulada) console.log('  PULADA ' + fs1.pulada + ' (FONTE_PRIVADA_SHAS ou ' + mascara(CAMINHO_SHAS) + ')');
  else conf('a lista privada de SHAs foi lida' + (fs1.de ? ' (' + fs1.de + ', ' + fs1.conjunto.size + ')' : ''), !fs1.erro, fs1.erro);
  const fx = faixaPadrao(env, RAIZ);
  if (fx.pulada) console.log('  PULADA a varredura do histórico: ' + fx.pulada);
  else conf('a faixa do histórico foi decidida (' + (fx.faixa ? fx.de : '') + ')', !fx.erro, fx.erro);

  const exc = EXCECOES_DE_TIPO.map(e => e.caminho);
  const r = varre(RAIZ, { shas: fs1.conjunto, faixa: fx.faixa, excecoes: exc });
  conf('a varredura viu os arquivos rastreados (controle: mais de 100)', r.arquivos.length > 100, String(r.arquivos.length));
  conf('esta prova está em git ls-files (prova fora do índice nunca roda)', r.arquivos.indexOf(EU) >= 0);
  conf('esta prova foi lida e varrida junto com o resto', r.vistos.has(EU));
  conf('todo arquivo rastreado foi lido do disco', r.ilegiveis.length === 0, r.ilegiveis.slice(0, 5).map(mascara).join(', '));
  conf('toda exceção de tipo tem motivo e está rastreada (' + EXCECOES_DE_TIPO.length + ')',
    EXCECOES_DE_TIPO.every(e => e.motivo && String(e.motivo).trim().length > 10 && r.arquivos.indexOf(e.caminho) >= 0));
  if (fx.faixa) console.log('    histórico (' + fx.faixa + '): ' + r.historico.commits + ' commit(s), ' + r.historico.blobs + ' blob(s) novos, ' + r.historico.caminhos + ' caminho(s)');
  if (r.achados.length) console.log('    achados:\n' + relatorio(r.achados));
  conf('nada da fonte privada nos ' + r.arquivos.length + ' arquivos rastreados' + (fx.faixa ? ' nem no histórico da faixa' : ''),
    r.achados.length === 0, r.achados.length + ' achado(s)');

  /* O .gitignore: não ignora esta prova nem um email.pdf, e ignora a fonte. */
  const ignorado = rel => spawnSync('git', ['check-ignore', '-q', '--no-index', rel], { cwd: RAIZ }).status;
  conf('o .gitignore não ignora esta prova (git check-ignore)', ignorado(EU) === 1, 'status ' + ignorado(EU));
  ['email.pdf', 'docs/email_recebido.pdf', 'biblioteca/emails-2026.pdf'].forEach(rel =>
    conf('o .gitignore não ignora ' + rel, ignorado(rel) === 1, 'status ' + ignorado(rel)));
  [
    'privado/caderno.pdf',
    'biblioteca/privado/texto.txt',
    'material/Caderno_' + SIGLA_M + '_3ano.pdf',
    'material/caderno-' + SIGLA + '-volume-2.pdf',
    SIGLA_M + '_web.pdf',
    'x/EFAI_1ano_LER-' + SIGLA_M + '_web.pdf',
    SIGLA + '_pacotes/indice.json',
    SIGLA_M + '_extraido/texto.txt',
  ].forEach(rel => conf('o .gitignore ignora ' + mascara(rel), ignorado(rel) === 0, 'status ' + ignorado(rel)));

  const gancho = path.join(__dirname, 'hooks', 'pre-push');
  conf('o hook opcional _teste/hooks/pre-push existe e chama esta prova com --faixa',
    fs.existsSync(gancho) && /testa_sem_fonte_privada\.js" --faixa/.test(fs.readFileSync(gancho, 'utf8')));
}

/* -------------------------------------------------- a prova envenenada */
function zipDe(entradas) {
  const locais = [], centrais = [];
  let desloc = 0;
  entradas.forEach(en => {
    const nome = Buffer.from(en.nome, 'utf8');
    const metodo = en.metodo === undefined ? 0 : en.metodo;
    const comp = metodo === 8 ? zlib.deflateRawSync(en.dados) : en.dados;
    const crc = zlib.crc32(en.dados);
    const l = Buffer.alloc(30);
    l.writeUInt32LE(0x04034b50, 0); l.writeUInt16LE(20, 4); l.writeUInt16LE(0x800, 6); l.writeUInt16LE(metodo, 8);
    l.writeUInt32LE(crc, 14); l.writeUInt32LE(comp.length, 18); l.writeUInt32LE(en.dados.length, 22);
    l.writeUInt16LE(nome.length, 26);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x800, 8);
    c.writeUInt16LE(metodo, 10);
    c.writeUInt32LE(crc, 16); c.writeUInt32LE(comp.length, 20); c.writeUInt32LE(en.dados.length, 24);
    c.writeUInt16LE(nome.length, 28); c.writeUInt32LE(desloc, 42);
    locais.push(l, nome, comp);
    centrais.push(c, nome);
    desloc += 30 + nome.length + comp.length;
  });
  const cd = Buffer.concat(centrais);
  const e = Buffer.alloc(22);
  e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(entradas.length, 8); e.writeUInt16LE(entradas.length, 10);
  e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(desloc, 16);
  return Buffer.concat(locais.concat([cd, e]));
}
function pdfDe(streams, extra) {
  const partes = ['%PDF-1.7\n'];
  streams.forEach((s, i) => {
    const d = zlib.deflateSync(Buffer.from(s, 'latin1'));
    partes.push(Buffer.from((i + 1) + ' 0 obj << /Length ' + d.length + ' /Filter /FlateDecode >>\nstream\n', 'latin1'), d,
      Buffer.from('\nendstream\nendobj\n', 'latin1'));
  });
  partes.push(Buffer.from((extra || '') + '%%EOF\n', 'latin1'));
  return Buffer.concat(partes.map(p => (Buffer.isBuffer(p) ? p : Buffer.from(p, 'latin1'))));
}

function provaEnvenenada() {
  const status = () => git(RAIZ, ['status', '--porcelain']).toString();
  const antes = status();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fonte_privada_'));
  const g = args => git(tmp, ['-c', 'user.name=prova', '-c', 'user.email=prova@exemplo.invalid', '-c', 'core.autocrlf=false', '-c', 'commit.gpgsign=false'].concat(args));
  const escreve = (rel, conteudo) => {
    fs.mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true });
    fs.writeFileSync(path.join(tmp, rel), conteudo);
  };
  try {
    g(['init', '-q']);
    escreve('LEIAME.md', 'repositório de mentira\n');
    g(['add', '-A']); g(['commit', '-q', '-m', 'base']);
    const base = g(['rev-parse', 'HEAD']).toString().trim();

    /* O título com acento e maiúsculas, montado ao contrário. */
    const tituloCerto = ('siaicinI sonA son acitáme' + 'taM oãçacudE').split('').reverse().join('');
    const S = SIGLA_M;
    /* O histórico: um commit acrescenta, o seguinte apaga. A mensagem do
     * primeiro carrega o título. */
    escreve('rascunho/apagado.md', 'Atividade copiada do caderno ' + S + '.\n');
    escreve('rascunho/Caderno_' + S + '_velho.txt', 'neutro\n');
    g(['add', '-A']); g(['commit', '-q', '-m', 'acrescenta ' + tituloCerto]);
    fs.rmSync(path.join(tmp, 'rascunho'), { recursive: true });
    g(['add', '-A']); g(['commit', '-q', '-m', 'apaga']);

    /* Um PDF "salvo de novo": limpo por dentro, pego só pelo SHA da lista. */
    const pdfListado = pdfDe(['BT (pagina ' + crypto.randomBytes(8).toString('hex') + ') Tj ET']);
    const utf16 = s => Buffer.from(s, 'utf16le');
    const sujos = {
      'conteúdo com a sigla': ['notas/aula.md', '# Aula\n\nExercício tirado do caderno ' + S + ', volume 2.\n', 'marca'],
      'sigla colada (CamelCase)': ['notas/camel.js', 'const nomeCaderno' + S + 'Tres = 1;\n', 'marca'],
      'sigla com pontos': ['notas/pontos.txt', 'Ver ' + S.split('').join('.') + '. página 4\n', 'marca'],
      'título sem separador': ['notas/junto.txt', tituloCerto.replace(/ /g, '') + '\n', 'marca'],
      'sigla no nome': ['material/Caderno_' + S + '_3ano.txt', 'texto neutro\n', 'nome'],
      'PDF de SHA listado': ['docs/caderno_salvo.pdf', pdfListado, 'sha256'],
      'PDF com a sigla no SEGUNDO stream Flate': ['docs/dois_streams.pdf', pdfDe(['BT (nada aqui) Tj ET', 'BT (Caderno ' + S + ') Tj ET']), 'marca'],
      'PDF com a sigla só nos metadados (hex UTF-16)': ['docs/meta.pdf',
        pdfDe(['BT <0041> Tj ET'], 'trailer << /Info << /Title <FEFF' + Buffer.from('Caderno ' + S, 'utf16le').swap16().toString('hex') + '> >> >>\n'), 'marca'],
      'texto UTF-16 com BOM': ['notas/utf16_bom.txt', Buffer.concat([Buffer.from([0xff, 0xfe]), utf16('Caderno ' + S + ' do aluno\n')]), 'marca'],
      'texto UTF-16 sem BOM': ['notas/utf16_sem.txt', utf16('Caderno ' + S + ' do aluno, terceiro ano\n'), 'marca'],
      'zip com deflate': ['docs/deflate.zip', zipDe([{ nome: 'q1.txt', dados: Buffer.from('Caderno ' + S + '\n'), metodo: 8 }]), 'marca'],
      'zip aninhado': ['docs/aninhado.zip', zipDe([{ nome: 'dentro.zip', dados: zipDe([{ nome: 't.txt', dados: Buffer.from(tituloCerto), metodo: 8 }]) }]), 'marca'],
      'zip além do limite': ['docs/fundo.zip', [1, 2, 3, 4].reduce(z => zipDe([{ nome: 'z.zip', dados: z }]), zipDe([{ nome: 'a.txt', dados: Buffer.from('ok') }])), 'zip'],
      'zip de método desconhecido': ['docs/metodo.zip', zipDe([{ nome: 'a.txt', dados: Buffer.from('ok'), metodo: 99 }]), 'zip'],
      'PDF renomeado (tipo)': ['figuras/foto.png', Buffer.from('%PDF-1.7\n%limpo\n%%EOF\n', 'latin1'), 'tipo proibido'],
      'docx (tipo)': ['docs/relatorio.docx', zipDe([{ nome: 'word/document.xml', dados: Buffer.from('<w>ok</w>'), metodo: 8 }]), 'tipo proibido'],
      'gzip (tipo)': ['dados/x.json', zlib.gzipSync(Buffer.from('{"a":1}')), 'tipo proibido'],
      'gzip com a sigla dentro': ['dados/y.gz', zlib.gzipSync(Buffer.from('Caderno ' + S)), 'marca'],
      '7z (tipo)': ['dados/a.dat', Buffer.concat([Buffer.from([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c, 0, 4]), crypto.randomBytes(64)]), 'tipo proibido'],
      'rar (tipo)': ['dados/b.dat', Buffer.concat([Buffer.from('Rar!\x1a\x07\x01\x00', 'latin1'), crypto.randomBytes(64)]), 'tipo proibido'],
      'exceção de tipo continua varrida': ['docs/permitido_sujo.pdf', pdfDe(['BT (Caderno ' + S + ') Tj ET']), 'marca'],
    };
    Object.keys(sujos).forEach(k => escreve(sujos[k][0], sujos[k][1]));
    /* Controles: não podem ser acusados. */
    const limpos = {
      'notas/email.txt': 'Mande um email ou EMAIL; o x' + SIGLA + ' e o ' + SIGLA + 'lx não são a sigla.\n',
      'notas/titulo_parcial.txt': tituloCerto.replace(/\S+$/, 'Finais') + '\n',
      'icons/icone.png': Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), crypto.randomBytes(256)]),
      'vendor/m.wasm': Buffer.concat([Buffer.from([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0]), crypto.randomBytes(256)]),
      'docs/permitido.pdf': pdfDe(['BT (texto limpo) Tj ET']),
    };
    Object.keys(limpos).forEach(k => escreve(k, limpos[k]));
    const excecoes = ['docs/permitido.pdf', 'docs/permitido_sujo.pdf'];
    g(['add', '-A']); g(['commit', '-q', '-m', 'o resto']);

    const arqShas = tmp + '_shas.txt';
    fs.writeFileSync(arqShas, '# lista temporária\n' + crypto.createHash('sha256').update(pdfListado).digest('hex') + ' *pagina.pdf\n');
    try {
      /* A camada de SHA dos dois lados: sem a lista passa e diz que pulou,
       * também no CI; com a lista temporária, lê e pega o PDF listado. */
      const semLista = fonteShas({ GITHUB_ACTIONS: 'true', FONTE_PRIVADA_SHAS: tmp + '_nao_existe.txt' });
      conf('sem a lista privada, mesmo no CI, a camada de SHA é pulada e dita, sem reprovar', !!semLista.pulada && !semLista.erro && /pulei a camada de SHA/.test(semLista.pulada));
      const fs1 = fonteShas({ FONTE_PRIVADA_SHAS: arqShas });
      conf('a lista temporária foi lida (1 SHA)', !!fs1.conjunto && fs1.conjunto.size === 1);
      const vazia = tmp + '_vazia.txt';
      fs.writeFileSync(vazia, '# sem nenhum SHA\n');
      conf('VENENO visto: lista que existe sem SHA nenhum reprova', !!fonteShas({ FONTE_PRIVADA_SHAS: vazia }).erro);
      fs.rmSync(vazia, { force: true });
      const semShas = varre(tmp, { shas: null, faixa: null, excecoes });
      conf('sem a lista, o PDF listado só sai pelo tipo, não pelo SHA', !semShas.achados.some(a => a.tipo === 'sha256'));
      /* A faixa do push na main sai do "before" do evento. */
      const evento = tmp + '_evento.json';
      fs.writeFileSync(evento, JSON.stringify({ before: base }));
      conf('no push na main a faixa é before..HEAD', faixaPadrao({ GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'push', GITHUB_EVENT_PATH: evento }, tmp).faixa === base + '..HEAD');
      fs.writeFileSync(evento, JSON.stringify({ before: '0'.repeat(40) }));
      conf('VENENO visto: push sem before conhecido reprova', !!faixaPadrao({ GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'push', GITHUB_EVENT_PATH: evento }, tmp).erro);
      fs.rmSync(evento, { force: true });

      const r = varre(tmp, { shas: fs1.conjunto, faixa: base + '..HEAD', excecoes });
      console.log('    relatório da varredura no repositório temporário:\n' + relatorio(r.achados));
      const de = (arq, tipo, ondeDe) => r.achados.some(a => (a.arquivo === arq || a.arquivo.indexOf(arq + '!') === 0) && (!tipo || a.tipo === tipo) && (!ondeDe || a.de.indexOf(ondeDe) === 0));
      Object.keys(sujos).forEach(k => conf('VENENO visto: ' + k + ' (' + mascara(sujos[k][0]) + ', ' + sujos[k][2] + ')', de(sujos[k][0], sujos[k][2], 'árvore')));
      conf('VENENO visto: o conteúdo do commit apagado, no histórico', de('rascunho/apagado.md', 'marca', 'histórico'));
      conf('VENENO visto: o nome do arquivo apagado, no histórico', de('rascunho/Caderno_' + S + '_velho.txt', 'nome', 'histórico'));
      conf('VENENO visto: o título na mensagem do commit', r.achados.some(a => a.de === 'mensagem de commit' && /título/.test(a.marca)));
      conf('VENENO visto: o relatório traz cada caminho acusado (mascarado)', Object.keys(sujos).every(k => relatorio(r.achados).indexOf(mascara(sujos[k][0])) >= 0));
      conf('a exceção de tipo não acusa o tipo do exceptuado', !de('docs/permitido_sujo.pdf', 'tipo proibido') && !de('docs/permitido.pdf'));
      conf('o relatório não imprime a sigla nem o título', !RE_SIGLA.test(semAcento(relatorio(r.achados)).toLowerCase()) && !RE_TITULO.test(semAcento(relatorio(r.achados)).toLowerCase()));
      Object.keys(limpos).forEach(l => conf('controle limpo não acusado: ' + l, !de(l)));
      conf('o histórico da faixa foi lido (3 commits; só os blobs fora do índice são lidos de novo)',
        r.historico.commits === 3 && r.historico.blobs >= 1 && r.historico.caminhos > 20, JSON.stringify(r.historico));
    } finally {
      fs.rmSync(arqShas, { force: true });
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  conf('a pasta temporária foi apagada', !fs.existsSync(tmp));
  conf('o índice e a árvore desta cópia ficaram como estavam', status() === antes);
}

if (desconhecidos.length) {
  conf('opção conhecida', false, 'desconhecida: ' + mascara(desconhecidos.join(' ')));
} else if (ENVENENADA) {
  provaEnvenenada();
} else {
  provaNormal();
}
console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
