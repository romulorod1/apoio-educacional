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
 * (a sigla por códigos de caractere, o título por uma frase invertida), e é
 * por isso que a prova não precisa de lista de exceções nenhuma: ela varre a
 * si mesma junto com todo o resto e sai limpa.
 *
 * O QUE ELA VARRE: todo arquivo de `git ls-files` (o que está no índice, que é
 * o que vai para o commit), lido do disco.
 *   o caminho e o nome      sempre;
 *   o conteúdo de texto     todo arquivo sem byte nulo nos primeiros 8000 bytes
 *                           (a mesma regra do git para "binário");
 *   .pdf                    os bytes crus (o texto não comprimido, também em
 *                           UTF-16, com os bytes nulos tirados) e cada stream
 *                           FlateDecode que o zlib consegue abrir. Texto que o
 *                           PDF guarda por códigos de glifo ou escapes octais
 *                           não é visto: para isso existe a conferência do SHA;
 *   .zip                    o nome de cada entrada, o conteúdo de cada entrada
 *                           guardada ou comprimida por deflate (com as mesmas
 *                           regras acima, inclusive zip dentro de zip) e o SHA
 *                           de cada entrada. Zip64 e zip cifrado não são lidos:
 *                           zip que não se deixa ler REPROVA, porque um pacote
 *                           ilegível pode esconder qualquer coisa;
 *   outro binário           só o nome e o SHA.
 *
 * AS MARCAS, sem diferença de maiúscula nem de acento:
 *   a sigla dos cadernos como PALAVRA INTEIRA. Palavra inteira aqui quer dizer
 *     sem letra colada antes nem depois; dígito, sublinhado, ponto e barra
 *     separam, para um nome de arquivo com a sigla seguida de "_3ano" ser pego;
 *   o título dos cadernos, com qualquer separador entre as palavras;
 *   o SHA-256 de cada arquivo rastreado contra a lista de SHAs da fonte, lida
 *     de FORA do repositório: FONTE_PRIVADA_SHAS, ou o caminho padrão no Drive
 *     (CAMINHO_SHAS abaixo). Sem a lista, essa conferência é pulada, dito na
 *     saída, e a prova não reprova por isso (no CI a lista nunca existe). Lista
 *     que existe e não tem SHA nenhum reprova: o instrumento não estaria vendo.
 *
 * A PROVA PROVA QUE RODA: o próprio caminho dela tem de estar em `git ls-files`
 * e tem de ter sido varrido (prova que nunca roda parece verde), o .gitignore
 * não pode ignorá-la e tem de ignorar os três padrões da fonte privada.
 *
 *   node _teste/testa_sem_fonte_privada.js
 *   node _teste/testa_sem_fonte_privada.js --envenenado-com-fonte-privada
 *        num repositório git temporário, fora desta árvore, rastreia um arquivo
 *        com a marca no conteúdo, um com a marca no NOME, um binário cujo SHA
 *        está numa lista temporária, um PDF e um zip com a marca dentro, e
 *        arquivos limpos de controle. A varredura TEM de acusar os cinco, com o
 *        caminho no relatório, e não pode acusar os de controle ("VENENO visto").
 *        O índice desta árvore não é tocado, e a pasta temporária é apagada.
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
const MODOS = [VENENO];
const ENVENENADA = process.argv.indexOf(VENENO) >= 0;
const desconhecidos = process.argv.slice(2).filter(a => MODOS.indexOf(a) < 0);

const CAMINHO_SHAS = 'J:\\Meu Drive\\Vida Pessoal\\Família\\Material pra Nath\\Aplicativo\\Biblioteca\\privado\\' +
  String.fromCharCode(101, 109, 97, 105) + '\\shas.txt';

/* As marcas, montadas na hora. */
const SIGLA = String.fromCharCode(101, 109, 97, 105);
const TITULO = 'siaicini sona son acitametam oacacude'.split('').reverse().join('');
const RE_SIGLA = new RegExp('(^|[^a-z])' + SIGLA + '(?![a-z])');
const RE_TITULO = new RegExp(TITULO.split(' ').join('[^a-z0-9]+'));

let passes = 0, falhas = 0;
function conf(rotulo, ok, detalhe) {
  if (ok) { passes++; console.log('  OK    ' + rotulo); }
  else { falhas++; console.log('  FALHA ' + rotulo + (detalhe ? '  [' + detalhe + ']' : '')); }
}

/* Sem acento e em minúsculas: "Ç" vira "c", "á" vira "a". */
function normaliza(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/* As marcas de um texto: [{marca, linha}]. */
function marcasDe(texto) {
  const t = normaliza(texto);
  const achou = [];
  [['sigla', RE_SIGLA], ['título', RE_TITULO]].forEach(([marca, re]) => {
    const m = re.exec(t);
    if (m) achou.push({ marca, linha: t.slice(0, m.index + (m[1] || '').length).split('\n').length });
  });
  return achou;
}

function ehBinario(buf) {
  return buf.subarray(0, 8000).indexOf(0) >= 0;
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/* A lista de SHAs, no formato da saída do sha256sum ("<64 hex> *<nome>" ou
 * "<64 hex>  <nome>"): só o PRIMEIRO campo de cada linha conta; o asterisco e
 * o nome são ignorados e nunca impressos. Linha com # e linha vazia saem. */
function lerShas(arq) {
  if (!arq || !fs.existsSync(arq)) return null;
  const shas = new Set();
  fs.readFileSync(arq, 'utf8').replace(/^﻿/, '').split(/\r?\n/).forEach(l => {
    if (/^\s*#/.test(l)) return;
    const m = l.match(/^\s*([0-9a-fA-F]{64})(?:\s|$)/);
    if (m) shas.add(m[1].toLowerCase());
  });
  return shas;
}
function caminhoShas(env) {
  return (env || process.env).FONTE_PRIVADA_SHAS || CAMINHO_SHAS;
}

/* As entradas de um zip pelo diretório central: [{nome, dados}] (dados nulo
 * quando o método não é guardado nem deflate). Lança erro se não for legível. */
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
    if (bandeiras & 1) throw new Error('entrada cifrada: ' + nome);
    let dados = null;
    if (local + 30 <= buf.length && buf.readUInt32LE(local) === 0x04034b50) {
      const ini = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
      const bruto = buf.subarray(ini, ini + tamComp);
      if (metodo === 0) dados = bruto;
      else if (metodo === 8) dados = zlib.inflateRawSync(bruto);
    } else {
      throw new Error('cabeçalho local ausente: ' + nome);
    }
    lista.push({ nome, dados });
    p += 46 + nl + el + cl;
  }
  return lista;
}

/* O texto que um PDF deixa ler sem renderizar: os bytes crus (sem os nulos,
 * para o texto em UTF-16 aparecer) e cada stream que o zlib abre. */
function textoDoPdf(buf) {
  const partes = [buf.toString('latin1').replace(/\0/g, '')];
  const cru = buf.toString('latin1');
  const re = /stream\r?\n/g;
  let m;
  while ((m = re.exec(cru))) {
    const ini = m.index + m[0].length;
    const fim = cru.indexOf('endstream', ini);
    if (fim < 0) break;
    try { partes.push(zlib.inflateSync(buf.subarray(ini, fim)).toString('latin1').replace(/\0/g, '')); } catch (e) { /* stream que não é deflate */ }
    re.lastIndex = fim;
  }
  return partes.join('\n');
}

/* Examina um conteúdo (um arquivo, ou uma entrada de zip). `onde` é o rótulo
 * no relatório: o caminho, ou "pacote.zip!entrada". */
function examina(onde, nome, buf, shas, achados, profundidade) {
  if (shas && shas.has(sha256(buf))) achados.push({ arquivo: onde, onde: 'sha256', marca: 'SHA da lista da fonte privada' });
  const ext = path.extname(nome).toLowerCase();
  if (ext === '.zip') {
    let entradas;
    try { entradas = entradasDoZip(buf); } catch (e) {
      achados.push({ arquivo: onde, onde: 'zip', marca: 'zip que não se deixa ler (' + e.message + ')' });
      return;
    }
    entradas.forEach(en => {
      marcasDe(en.nome).forEach(a => achados.push({ arquivo: onde + '!' + en.nome, onde: 'nome da entrada do zip', marca: a.marca }));
      if (en.dados && profundidade < 3) examina(onde + '!' + en.nome, en.nome, en.dados, shas, achados, profundidade + 1);
    });
    return;
  }
  if (ext === '.pdf') {
    marcasDe(textoDoPdf(buf)).forEach(a => achados.push({ arquivo: onde, onde: 'texto do PDF', marca: a.marca }));
    return;
  }
  if (ehBinario(buf)) return;
  marcasDe(buf.toString('utf8')).forEach(a => achados.push({ arquivo: onde, onde: 'conteúdo, linha ' + a.linha, marca: a.marca }));
}

/* A varredura de um repositório: o que está em `git ls-files`. */
function varre(raiz, shas) {
  const saida = execFileSync('git', ['ls-files', '-z'], { cwd: raiz, maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
  const arquivos = saida.split('\0').filter(Boolean);
  const achados = [];
  const vistos = new Set();
  const ilegiveis = [];
  arquivos.forEach(rel => {
    marcasDe(rel).forEach(a => achados.push({ arquivo: rel, onde: 'caminho ou nome', marca: a.marca }));
    let buf;
    try { buf = fs.readFileSync(path.join(raiz, rel)); } catch (e) { ilegiveis.push(rel); return; }
    vistos.add(rel);
    examina(rel, rel, buf, shas, achados, 0);
  });
  return { arquivos, achados, vistos, ilegiveis };
}

/* A saída do CI é pública: a sigla sai mascarada no que se imprime. */
function mascara(s) {
  return s.replace(new RegExp(SIGLA, 'ig'), '<sigla>');
}

function relatorio(achados) {
  return achados.map(a => '        ' + a.arquivo + '  (' + a.onde + ': ' + a.marca + ')').join('\n');
}

/* ------------------------------------------------------------- a prova */
function provaNormal() {
  const arqShas = caminhoShas();
  const shas = lerShas(arqShas);
  if (shas === null) console.log('  PULADA a conferência por SHA: a lista não existe aqui (' + mascara(arqShas) + '); defina FONTE_PRIVADA_SHAS para rodá-la');
  else conf('a lista de SHAs da fonte privada foi lida e tem SHAs (' + shas.size + ')', shas.size > 0, mascara(arqShas));

  const r = varre(RAIZ, shas);
  conf('a varredura viu os arquivos rastreados (controle: mais de 100)', r.arquivos.length > 100, String(r.arquivos.length));
  conf('esta prova está em git ls-files (prova fora do índice nunca roda)', r.arquivos.indexOf(EU) >= 0);
  conf('esta prova foi lida e varrida junto com o resto', r.vistos.has(EU));
  conf('todo arquivo rastreado foi lido do disco', r.ilegiveis.length === 0, r.ilegiveis.slice(0, 5).join(', '));
  if (r.achados.length) console.log('    achados:\n' + mascara(relatorio(r.achados)));
  conf('nada da fonte privada nos ' + r.arquivos.length + ' arquivos rastreados (nome, conteúdo' + (shas ? ', SHA' : '') + ')',
    r.achados.length === 0, r.achados.length + ' achado(s)');

  /* O .gitignore: não ignora esta prova e ignora os três padrões da fonte. */
  const ignorado = rel => spawnSync('git', ['check-ignore', '-q', '--no-index', rel], { cwd: RAIZ }).status;
  conf('o .gitignore não ignora esta prova (git check-ignore)', ignorado(EU) === 1, 'status ' + ignorado(EU));
  const S = SIGLA.toUpperCase();
  [
    'privado/caderno.pdf',
    'biblioteca/privado/texto.txt',
    'material/Caderno_' + S + '_3ano.pdf',
    'material/caderno-' + SIGLA + '-volume-2.pdf',
    SIGLA + '_pacotes/indice.json',
    S + '_extraido/texto.txt',
  ].forEach(rel => conf('o .gitignore ignora ' + mascara(rel), ignorado(rel) === 0, 'status ' + ignorado(rel)));
}

function provaEnvenenada() {
  const status = () => execFileSync('git', ['status', '--porcelain'], { cwd: RAIZ }).toString();
  const antes = status();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fonte_privada_'));
  try {
    execFileSync('git', ['init', '-q'], { cwd: tmp });
    execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: tmp });
    const escreve = (rel, conteudo) => {
      fs.mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true });
      fs.writeFileSync(path.join(tmp, rel), conteudo);
    };
    const S = SIGLA.toUpperCase();
    /* O título com acento e maiúsculas, montado ao contrário como o de cima. */
    const titulo = 'siaicinI sonA son acitáme' + 'taM oãçacudE';
    const tituloCerto = titulo.split('').reverse().join('');
    const sujos = {
      conteudo: 'notas/aula.md',
      nome: 'material/Caderno_' + S + '_3ano.txt',
      sha: 'figuras/pagina.bin',
      pdf: 'docs/folha.pdf',
      zip: 'docs/pacote.zip',
    };
    escreve(sujos.conteudo, '# Aula\n\nExercício tirado do caderno ' + S + ', volume 2.\n');
    escreve(sujos.nome, 'texto neutro, sem marca nenhuma\n');
    const binario = Buffer.concat([Buffer.from([0, 1, 2, 3, 0, 255]), crypto.randomBytes(256)]);
    escreve(sujos.sha, binario);
    escreve(sujos.pdf, Buffer.from('%PDF-1.4\n1 0 obj << /Length 44 >>\nstream\nBT (' + tituloCerto + ') Tj ET\nendstream\nendobj\n%%EOF\n', 'latin1'));
    escreve(sujos.zip, zipGuardado([{ nome: 'pacote/' + SIGLA + '_q1.json', dados: Buffer.from('{"q":1}') }]));
    /* Controles: não podem ser acusados. */
    const limpos = ['notas/email.txt', 'notas/titulo_parcial.txt', 'docs/limpo.zip', 'figuras/outra.bin'];
    escreve(limpos[0], 'Mande um email; o ' + SIGLA + 'l e o x' + SIGLA + ' não são a sigla.\n');
    escreve(limpos[1], tituloCerto.replace(/\S+$/, 'Finais') + '\n');
    escreve(limpos[2], zipGuardado([{ nome: 'pacote/q1.json', dados: Buffer.from('{"q":1}') }]));
    escreve(limpos[3], Buffer.concat([Buffer.from([0, 9, 9]), crypto.randomBytes(256)]));
    execFileSync('git', ['add', '-A'], { cwd: tmp });

    const arqShas = path.join(tmp, '..', path.basename(tmp) + '_shas.txt');
    /* Lista própria do veneno, no formato da real ("<sha> *<nome>"), com uma
     * linha cujo SHA só aparece depois do nome, que NÃO pode contar. */
    fs.writeFileSync(arqShas, '# lista temporária\n' + sha256(binario) + ' *pagina.pdf\n' +
      'nome ' + sha256(Buffer.from('outro')) + '\n');
    try {
      const env = Object.assign({}, process.env, { FONTE_PRIVADA_SHAS: arqShas });
      conf('FONTE_PRIVADA_SHAS troca o caminho da lista', caminhoShas(env) === arqShas);
      const shas = lerShas(caminhoShas(env));
      conf('a lista temporária foi lida com o SHA do binário', !!shas && shas.size === 1);
      const r = varre(tmp, shas);
      const texto = relatorio(r.achados);
      console.log('    relatório da varredura no repositório temporário:\n' + mascara(texto));
      const acusados = new Set(r.achados.map(a => a.arquivo.split('!')[0]));
      Object.keys(sujos).forEach(k => {
        conf('VENENO visto: ' + k + ' (' + mascara(sujos[k]) + ') acusado e no relatório',
          acusados.has(sujos[k]) && texto.indexOf(sujos[k]) >= 0);
      });
      conf('VENENO visto: a marca no nome sai como "caminho ou nome"', r.achados.some(a => a.arquivo === sujos.nome && a.onde === 'caminho ou nome'));
      conf('VENENO visto: o binário sai pelo SHA', r.achados.some(a => a.arquivo === sujos.sha && a.onde === 'sha256'));
      conf('VENENO visto: o zip sai pelo nome da entrada', r.achados.some(a => a.arquivo.indexOf(sujos.zip + '!') === 0 && a.onde === 'nome da entrada do zip'));
      limpos.forEach(l => conf('controle limpo não acusado: ' + l, !acusados.has(l)));
    } finally {
      fs.rmSync(arqShas, { force: true });
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  conf('a pasta temporária foi apagada', !fs.existsSync(tmp));
  conf('o índice e a árvore desta cópia ficaram como estavam', status() === antes);
}

/* Um zip mínimo, sem compressão, para o veneno. */
function zipGuardado(entradas) {
  const locais = [], centrais = [];
  let desloc = 0;
  entradas.forEach(en => {
    const nome = Buffer.from(en.nome, 'utf8');
    const crc = zlib.crc32(en.dados);
    const l = Buffer.alloc(30);
    l.writeUInt32LE(0x04034b50, 0); l.writeUInt16LE(20, 4); l.writeUInt16LE(0x800, 6); l.writeUInt16LE(0, 8);
    l.writeUInt32LE(crc, 14); l.writeUInt32LE(en.dados.length, 18); l.writeUInt32LE(en.dados.length, 22);
    l.writeUInt16LE(nome.length, 26);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x800, 8);
    c.writeUInt32LE(crc, 16); c.writeUInt32LE(en.dados.length, 20); c.writeUInt32LE(en.dados.length, 24);
    c.writeUInt16LE(nome.length, 28); c.writeUInt32LE(desloc, 42);
    locais.push(l, nome, en.dados);
    centrais.push(c, nome);
    desloc += 30 + nome.length + en.dados.length;
  });
  const cd = Buffer.concat(centrais);
  const e = Buffer.alloc(22);
  e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(entradas.length, 8); e.writeUInt16LE(entradas.length, 10);
  e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(desloc, 16);
  return Buffer.concat(locais.concat([cd, e]));
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
