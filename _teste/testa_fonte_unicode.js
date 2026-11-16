/* testa_fonte_unicode.js (D1: a fonte de reserva do pdf.js; Node, sem navegador)
 *
 * O pdf.js escrevia só com a base-14 (Helvetica em WinAnsi e 11 glifos da
 * Symbol) e recusava o resto: ⁴, ℓ, ≈, o menos de verdade, as setas, o grego.
 * Desde a D1 o que a base-14 não desenha sai pela fonte de reserva, o
 * subconjunto da DejaVu Sans Condensed do fonte-unicode.js. Esta prova afirma,
 * medindo o PDF gerado:
 *
 *   A. cobertura: cada caractere da lista do BRIEF_D1 passa no
 *      caracteresQueNaoDesenha; o ℘, que a reserva não tem, continua recusado
 *      (o controle de que a trava ainda morde);
 *   B. extração: um PDF de duas páginas com todos eles abre no MuPDF sem aviso,
 *      e o texto extraído devolve cada caractere (só é verdade com o ToUnicode
 *      certo); a fonte entra UMA vez, como Type0 com TrueType embutida, e o
 *      FontFile2 descomprimido é byte a byte o vendor/dejavu-2.37/...-subconjunto.ttf;
 *   C. largura: a medida de cada caractere da reserva é a do hmtx do próprio
 *      TTF (lido aqui, sem passar pelo pdf.js), o /W do PDF diz o mesmo, e uma
 *      palavra só de setas quebra no número de linhas que o hmtx manda;
 *   D. controle: o fechamento, a folha de aula, o planejamento, a lista da
 *      Biblioteca, uma folha com os símbolos que a base-14 já desenhava e o
 *      livro exportado (com seta no texto invisível) saem byte a byte iguais
 *      aos do pdf.js de antes da D1 (c8bc1e6, fixo); e sem o fonte-unicode.js ao lado, o
 *      pdf.js volta a ser o de antes.
 *
 *   node _teste/testa_fonte_unicode.js [--guarda-pdfs <pasta>]
 *   node _teste/testa_fonte_unicode.js --envenenado-sem-tounicode
 *   node _teste/testa_fonte_unicode.js --envenenado-largura-errada
 *   node _teste/testa_fonte_unicode.js --envenenado-fonte-sempre
 *
 * Os venenos trocam um trecho de uma cópia do pdf.js (gravada na raiz, para o
 * require('./fonte-unicode.js') achar a fonte) e a prova tem de ver cada um no
 * grupo dele, com os outros grupos verdes:
 *   sem-tounicode   o Type0 sai sem /ToUnicode: a extração devolve lixo (B);
 *   largura-errada  a reserva mede 556 (a largura do '?') em vez da do hmtx: a
 *                   medida, o /W e a quebra de linha erram (C);
 *   fonte-sempre    a reserva entra em todo PDF: o controle byte a byte cai (D).
 *
 * Com --guarda-pdfs, grava na pasta os PDFs da prova (o de todos os caracteres
 * e os de controle, antes e depois), para o print de revisão.
 *
 * O texto extraído vem do MuPDF (pymupdf, o mesmo das outras provas de PDF),
 * pelo _teste/_extrai_pdf.py.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const PYTHON = process.env.PYTHON || 'python';

// ---------------------------------------------------------------- venenos
const MODOS = {
  '--envenenado-sem-tounicode': {
    grupo: 'extracao',
    de: "' /DescendantFonts [' + cid + ' 0 R] /ToUnicode ' + paraUnicode + ' 0 R >>'",
    para: "' /DescendantFonts [' + cid + ' 0 R] >>'"
  },
  '--envenenado-largura-errada': {
    grupo: 'largura',
    de: 'function larguraUnicode(g) { return g[1]; }',
    para: 'function larguraUnicode(g) { return 556; }'
  },
  '--envenenado-fonte-sempre': {
    grupo: 'controle',
    de: 'var precisaUnicode = false;',
    para: 'var precisaUnicode = !!fonteUnicode();'
  }
};
const pedidos = process.argv.filter(a => a.indexOf('--envenenado-') === 0);
const desconhecidos = pedidos.filter(a => !MODOS[a]);
if (desconhecidos.length) { console.log('veneno desconhecido: ' + desconhecidos.join(' ')); process.exit(2); }
if (pedidos.length > 1) { console.log('um veneno por rodada'); process.exit(2); }
const VENENO = pedidos[0] || null;
const iGuarda = process.argv.indexOf('--guarda-pdfs');
const GUARDA = iGuarda > 0 ? process.argv[iGuarda + 1] : null;
if (GUARDA) fs.mkdirSync(GUARDA, { recursive: true });

// ---------------------------------------------------------------- placar por grupo
const GRUPOS = ['cobertura', 'extracao', 'largura', 'controle'];
const placar = {};
GRUPOS.forEach(g => { placar[g] = { ok: 0, falha: 0 }; });
const erros = [];
function conf(grupo, rotulo, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  placar[grupo][ok ? 'ok' : 'falha']++;
  if (!ok) erros.push('[' + grupo + '] ' + rotulo);
  console.log((ok ? '  OK    ' : '  FALHA ') + '[' + grupo + '] ' + rotulo +
    (ok ? '' : '  [obtido: ' + JSON.stringify(obtido).slice(0, 240) + ' | esperado: ' + JSON.stringify(esperado).slice(0, 240) + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

// ---------------------------------------------------------------- cópias temporárias
const temporarios = [];
function limpar() { temporarios.forEach(f => { try { fs.rmSync(f, { recursive: true, force: true }); } catch (e) { /* já saiu */ } }); }
process.on('exit', limpar);
function gravaNaRaiz(nome, conteudo) {
  const arq = path.join(RAIZ, nome);
  temporarios.push(arq);
  fs.writeFileSync(arq, conteudo);
  return arq;
}

/* O pdf.js que esta rodada prova: o do repositório, ou a cópia envenenada. A
 * âncora tem de existir uma vez só: veneno cuja âncora sumiu roda o caminho
 * normal e passa calado, que é uma prova que não prova nada. */
const FONTE_PDF = fs.readFileSync(path.join(RAIZ, 'pdf.js'), 'utf8');
let G;
if (VENENO) {
  const m = MODOS[VENENO];
  const partes = FONTE_PDF.split(m.de);
  if (partes.length !== 2) {
    console.log('FALHA: a âncora do veneno ' + VENENO + ' aparece ' + (partes.length - 1) + ' vezes no pdf.js (devia ser 1)');
    console.log('0 passaram, 1 falharam.');
    process.exit(1);
  }
  G = require(gravaNaRaiz('_pdf_veneno_fonte.js', partes.join(m.para)));
} else {
  G = require('../pdf.js');
}

/* O pdf.js de ANTES DA RESERVA, num commit FIXO: c8bc1e6, a main de logo antes
 * da D1 entrar (o #252, pai que a D1 tinha). Não o merge-base com a origin/main:
 * depois do merge da D1, na main e em todo PR que a traz, o merge-base já tem a
 * reserva, e o controle passaria a comparar o pdf.js com ele mesmo (ou, na
 * regra 3, reprovaria sem defeito nenhum). Mesma solução do #220 (e1929b9) e do
 * testa_leitor_voltar (PAI fixo). O portão clona com fetch-depth 0; se o commit
 * não estiver no clone, a prova falha alto, nunca compara com outra coisa.
 * Se um PR futuro mudar de propósito os bytes do pdf.js para documento sem
 * caractere novo, o controle D cai, e quem muda move este commit e diz por quê. */
const BASE_ANTES_DA_RESERVA = 'c8bc1e6';
function pdfDaBase() {
  try {
    execFileSync('git', ['cat-file', '-e', BASE_ANTES_DA_RESERVA + '^{commit}'], { cwd: RAIZ, stdio: 'ignore' });
  } catch (e) {
    console.log('FALHA: o commit ' + BASE_ANTES_DA_RESERVA + ' (a main de antes da D1) não está neste clone; o controle não tem com o que comparar. Clone com o histórico inteiro (git fetch --unshallow).');
    console.log('0 passaram, 1 falharam.');
    process.exit(1);
  }
  const fonte = execFileSync('git', ['show', BASE_ANTES_DA_RESERVA + ':pdf.js'], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (/fonte-unicode|FontFile2/.test(fonte)) {
    console.log('FALHA: o pdf.js da ' + BASE_ANTES_DA_RESERVA + ' já tem a reserva; a base do controle está errada.');
    console.log('0 passaram, 1 falharam.');
    process.exit(1);
  }
  return fonte;
}
const B = require(gravaNaRaiz('_pdf_base_fonte.js', pdfDaBase()));
console.log('  base do controle: ' + BASE_ANTES_DA_RESERVA + ' (fixa, antes da D1)' + (VENENO ? '; veneno: ' + VENENO : ''));

// ---------------------------------------------------------------- utilidades
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'fonte_unicode_'));
temporarios.push(TMP);
let nArq = 0;
function extrair(bytes) {
  const arq = path.join(TMP, 'd' + (++nArq) + '.pdf');
  fs.writeFileSync(arq, Buffer.from(bytes));
  const saida = execFileSync(PYTHON, ['-X', 'utf8', path.join(__dirname, '_extrai_pdf.py'), arq],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return JSON.parse(saida);
}
function guarda(nome, bytes) { if (GUARDA) fs.writeFileSync(path.join(GUARDA, nome), Buffer.from(bytes)); }
const latin1 = bytes => Buffer.from(bytes).toString('latin1');
const quantas = (txt, s) => txt.split(s).length - 1;

/* O TTF lido aqui, sem o pdf.js: unidades do em, avanço do hmtx e o glifo do
 * cmap (formato 4, Windows Unicode). É a régua independente da largura. */
function lerTTF(buf) {
  const tabs = {};
  for (let i = 0; i < buf.readUInt16BE(4); i++) {
    const o = 12 + 16 * i;
    tabs[buf.toString('latin1', o, o + 4)] = buf.readUInt32BE(o + 8);
  }
  const upm = buf.readUInt16BE(tabs.head + 18);
  const nH = buf.readUInt16BE(tabs.hhea + 34);
  const avanco = gid => buf.readUInt16BE(tabs.hmtx + 4 * Math.min(gid, nH - 1));
  const c = tabs.cmap;
  let sub = null;
  for (let i = 0; i < buf.readUInt16BE(c + 2); i++) {
    const pid = buf.readUInt16BE(c + 4 + 8 * i), eid = buf.readUInt16BE(c + 6 + 8 * i), off = buf.readUInt32BE(c + 8 + 8 * i);
    if (pid === 3 && eid === 1 && buf.readUInt16BE(c + off) === 4) sub = c + off;
  }
  const segX2 = buf.readUInt16BE(sub + 6);
  const fins = sub + 14, inicios = fins + segX2 + 2, deltas = inicios + segX2, saltos = deltas + segX2;
  function glifo(cp) {
    for (let s = 0; s < segX2 / 2; s++) {
      if (cp > buf.readUInt16BE(fins + 2 * s)) continue;
      const ini = buf.readUInt16BE(inicios + 2 * s);
      if (cp < ini) return 0;
      const delta = buf.readInt16BE(deltas + 2 * s), salto = buf.readUInt16BE(saltos + 2 * s);
      if (!salto) return (cp + delta) & 0xFFFF;
      const g = buf.readUInt16BE(saltos + 2 * s + salto + 2 * (cp - ini));
      return g ? (g + delta) & 0xFFFF : 0;
    }
    return 0;
  }
  return { upm, avanco, glifo };
}

// A lista do BRIEF_D1, na ordem dele. U+2212 é o sinal de menos, não o hífen.
const GREGO = [];
for (let c = 0x391; c <= 0x3A9; c++) if (c !== 0x3A2) GREGO.push(String.fromCharCode(c));
for (let c = 0x3B1; c <= 0x3C9; c++) GREGO.push(String.fromCharCode(c));
const LISTA = Array.from('⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻₀₁₂₃₄₅₆₇₈₉ℓ≈≅≡−∓∈∉∩∪⊂⊃⊆⊇∅∀∃∑∏∫∂∇∠⊥∥△′″→←↔⇒⇔↑↓ℕℤℚℝℂ⅓⅔⅛∛')
  .concat(GREGO).concat(Array.from('✓✗●○■□★'));
const F = require('../fonte-unicode.js');
const DA_RESERVA = LISTA.filter(ch => F.glifos[ch.charCodeAt(0)]);

// ================================================================ A
secao('A. Cobertura: a lista do brief inteira desenha');
{
  conf('cobertura', 'a lista tem os 122 caracteres do brief', LISTA.length, 122);
  const fora = LISTA.filter(ch => G.caracteresQueNaoDesenha(ch).length);
  conf('cobertura', 'caracteresQueNaoDesenha vazio para cada um (' + (LISTA.length - fora.length) + ' de ' + LISTA.length + ')', fora, []);
  conf('cobertura', 'e para a lista inteira numa frase só', G.caracteresQueNaoDesenha(LISTA.join(' ')), []);
  conf('cobertura', 'controle: o ℘, que a reserva não tem, continua recusado', G.caracteresQueNaoDesenha('isto tem um ℘ perdido'), ['℘']);
  /* Regra 1: a reserva só pega o que a base-14 não desenha. Os da lista que a
   * Helvetica (¹ ² ³) e a Symbol (Δ Σ α β θ π) já desenhavam ficam com elas. */
  const daBase14 = LISTA.filter(ch => !F.glifos[ch.charCodeAt(0)]);
  conf('cobertura', 'os da lista que a base-14 já desenhava não estão na reserva', daBase14.join(''), '¹²³ΔΣαβθπ');
  conf('cobertura', 'a reserva tem os outros ' + DA_RESERVA.length, DA_RESERVA.length, 113);
}

// ================================================================ B
secao('B. Extração: o PDF com todos os caracteres');
const TTF = fs.readFileSync(path.join(RAIZ, 'vendor', 'dejavu-2.37', 'DejaVuSansCondensed-subconjunto.ttf'));
let todos = null;
{
  const doc = new G.Doc();
  doc.novaPagina();
  doc.cabecalhoDeSecao('Notação: conjuntos ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ', 'Fonte de reserva, página 1 de 2');
  doc.y -= 10;
  doc.escreverRico('Todos: ' + LISTA.join(' '), { tam: 12 });
  doc.y -= 10;
  doc.escreverRico('Expoente por marcação ao lado do Unicode: x^{2} + y⁴ − 3·z₁ ≈ 0, com **negrito → γ** e *itálico ∈ A*.', { tam: 11 });
  doc.novaPagina();
  doc.escreverRico('Segunda página: f′(x) → 0 quando x → ∞; ∀ε > 0 ∃δ; ✓ certo, ✗ errado, ★ destaque.', { tam: 11 });
  todos = doc.finalizar();
  guarda('todos_os_caracteres.pdf', todos);
  const bruto = latin1(todos);
  const ex = extrair(todos);
  conf('extracao', 'abre no MuPDF com 2 páginas', ex.paginas, 2);
  conf('extracao', 'o MuPDF não reclama de nada ao abrir e extrair', ex.avisos, []);
  /* A comparação ignora o espaço em branco. O tubo rico não escreve o espaço
   * entre palavras, só pula o vão, e o MuPDF deduz o espaço pelo vão com regra
   * própria, que falha depois de glifo que não é da Helvetica: já era assim com
   * a Symbol antes da reserva ("x ≤ ∞" sai "x ≤∞" no pdf.js da base). E o Δ da
   * Symbol volta como U+2206 (o "Delta" da codificação da Symbol, para o
   * MuPDF), também como antes; aqui ele é lido como o Δ que foi escrito. */
  const semVao = s => s.replace(/\s+/g, '').replace(/∆/g, 'Δ');
  const p1 = semVao(ex.texto[0]);
  const faltam = LISTA.filter(ch => p1.indexOf(ch) < 0);
  conf('extracao', 'a extração devolve cada caractere da lista (' + (LISTA.length - faltam.length) + ' de ' + LISTA.length + ')', faltam.join(''), '');
  conf('extracao', 'e a sequência inteira, na ordem', p1.indexOf(LISTA.join('')) >= 0, true);
  conf('extracao', 'a frase da página 2 volta igual', semVao(ex.texto[1]).indexOf(semVao('f′(x) → 0 quando x → ∞; ∀ε > 0 ∃δ; ✓ certo, ✗ errado, ★ destaque.')) >= 0, true);
  conf('extracao', 'o título com ℕ ⊂ ℤ volta igual', semVao(ex.texto[0]).indexOf(semVao('Notação: conjuntos ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ')) >= 0, true);
  conf('extracao', 'negrito e itálico com caractere da reserva voltam igual', p1.indexOf(semVao('com negrito → γ e itálico ∈ A.')) >= 0, true);
  conf('extracao', 'o Type0 traz /ToUnicode', /\/Subtype \/Type0 [^>]*\/ToUnicode \d+ 0 R/.test(bruto), true);
  const reserva = ex.fontes.filter(f => /DejaVuSansCondensed$/.test(f[3]));
  conf('extracao', 'uma fonte de reserva, Type0, TrueType embutida, Identity-H',
    reserva.map(f => [f[1], f[2], f[4], /^[A-Z]{6}\+/.test(f[3])]), [['ttf', 'Type0', 'Identity-H', true]]);
  conf('extracao', 'embutida uma vez só, com duas páginas usando', [quantas(bruto, '/FontFile2'), quantas(bruto, '/Subtype /Type0'),
    quantas(bruto, '/Subtype /CIDFontType2'), quantas(bruto, '/F6 ') >= 4], [1, 1, 1, true]);
  conf('extracao', 'as duas páginas citam o mesmo objeto como /F6', (bruto.match(/\/F6 (\d+) 0 R/g) || []).filter((v, i, a) => a.indexOf(v) === i).length, 1);
  const m = /\/Length1 (\d+) \/Filter \/FlateDecode \/Length (\d+) >>\nstream\n/.exec(bruto);
  let ttfDoPdf = null;
  if (m) {
    const ini = m.index + m[0].length;
    ttfDoPdf = zlib.inflateSync(Buffer.from(todos).subarray(ini, ini + Number(m[2])));
  }
  conf('extracao', 'o FontFile2 descomprimido é o vendor/dejavu-2.37/DejaVuSansCondensed-subconjunto.ttf', !!ttfDoPdf && ttfDoPdf.equals(TTF), true);
  conf('extracao', 'e o /Length1 diz o tamanho dele', m ? Number(m[1]) : -1, TTF.length);
}

// ================================================================ C
secao('C. Largura: a do hmtx, no medir, no /W e na quebra de linha');
{
  const T = lerTTF(TTF);
  const doHmtx = ch => Math.round(T.avanco(T.glifo(ch.charCodeAt(0))) * 1000 / T.upm);
  const glifoErrado = DA_RESERVA.filter(ch => F.glifos[ch.charCodeAt(0)][0] !== T.glifo(ch.charCodeAt(0)));
  conf('largura', 'o glifo de cada caractere é o do cmap do TTF', glifoErrado.join(''), '');
  const medidaErrada = DA_RESERVA.filter(ch => Math.abs(G.medir(ch, 1000) - doHmtx(ch)) > 1e-9);
  conf('largura', 'medir() de cada um é a largura do hmtx (' + (DA_RESERVA.length - medidaErrada.length) + ' de ' + DA_RESERVA.length + ')', medidaErrada.join(''), '');
  conf('largura', 'no negrito também: o glifo que sai é o regular', DA_RESERVA.filter(ch => Math.abs(G.medir(ch, 1000, true) - doHmtx(ch)) > 1e-9).join(''), '');
  conf('largura', 'misturado com Helvetica e Symbol: "a→π" = 556 + seta + 549',
    Math.round(G.medir('a→π', 1000) * 1000) / 1000, 556 + doHmtx('→') + 549);
  const w = /\/W \[((?:\d+ \[\d+\] ?)+)\]/.exec(latin1(todos));
  const noW = {};
  if (w) w[1].replace(/(\d+) \[(\d+)\]/g, (s, g, l) => { noW[g] = Number(l); return s; });
  conf('largura', 'o /W do PDF dá a largura do hmtx a cada glifo da reserva',
    DA_RESERVA.filter(ch => noW[T.glifo(ch.charCodeAt(0))] !== doHmtx(ch)).join(''), '');
  /* Uma palavra de 20 setas numa coluna em que cabem exatamente 6 pelo hmtx:
   * quatro linhas (6, 6, 6, 2). Com a largura do '?', caberiam 8 e sairiam três. */
  const tam = 10, seta = doHmtx('→') * tam / 1000;
  const coluna = seta * 6 + 0.01;
  const linhas = new G.Doc().quebrar('→'.repeat(20), coluna, tam, false);
  conf('largura', 'a palavra de 20 setas quebra em 4 linhas de até 6', linhas.map(l => l.length), [6, 6, 6, 2]);
}

// ================================================================ D
secao('D. Controle: sem caractere novo, o PDF é byte a byte o de antes');
const Core = require('../core.js');
const Plan = require('../planejamento.js');
function compara(nome, gerar) {
  const antes = Buffer.from(gerar(B));
  const depois = Buffer.from(gerar(G));
  guarda('controle_' + nome + '_antes.pdf', antes);
  guarda('controle_' + nome + '_depois.pdf', depois);
  let pos = 0;
  const n = Math.min(antes.length, depois.length);
  while (pos < n && antes[pos] === depois[pos]) pos++;
  conf('controle', nome + ': byte a byte igual ao da base', antes.equals(depois) ? 'igual' :
    antes.length + ' bytes antes, ' + depois.length + ' depois, primeiro diferente em ' + pos, 'igual');
  conf('controle', nome + ': sem fonte de reserva no arquivo', [quantas(latin1(depois), '/FontFile2'), quantas(latin1(depois), '/F6 ')], [0, 0]);
}
// Fechamento: o banco sintético do testa_biblioteca_aula.
function bancoFechamento() {
  const al = { id: 'a1', nome: 'Aluno Alfa Teste', responsavel: 'Responsável Teste', ativo: true,
    precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 130 }] };
  const db = { alunos: [al], series: [], aulas: [], resumos: [], ajustes: {} };
  [2, 9, 16].forEach(d => db.aulas.push({ id: 'x' + d, alunoId: 'a1', data: '2026-06-' + String(d).padStart(2, '0'),
    hora: '15:30', duracaoMin: 90, status: 'realizada', cobravel: true, areas: ['metodo'], anexos: [],
    temas: [{ id: 'MAT08-03', titulo: 'Equações do primeiro grau', lingua: 'pt', partes: ['lista'], exercicios: 6 }] }));
  return db;
}
compara('fechamento', P => P.gerarFechamento(Core.calcularFechamento(bancoFechamento(), 'a1', '2026-06'), { sempreResumo: true }));
// Folha de aula: texto (com ² e ·, que a Helvetica já desenha), traço, pauta e tapar.
compara('folha_de_aula', P => P.gerarFolhaAula({
  alunoNome: 'Aluno Alfa Teste', data: '2026-06-09',
  nota: { paginas: [{ fundo: 'pautado', itens: [
    { t: 'texto', x: 40, y: 60, txt: 'Área do quadrado: A = l² · 1 (em cm²)', tam: 26, cor: '#1A1C1F' },
    { t: 'traco', cor: '#C0392B', pontos: [[100, 300, 3], [200, 350, 3], [300, 320, 4], [380, 400, 3]] },
    { t: 'tapar', x: 600, y: 600, w: 120, h: 40 }
  ] }] },
  imagens: {}
}));
// Planejamento: o plano sintético do testa_planejamento.
function planoBase() {
  const inicio = '2026-11-09', fim = '2026-11-20';
  const grade = [];
  for (let d = inicio; d <= fim; d = Plan.somaDias(d, 1)) grade.push({ data: d, prova: null, estudo: ['Matemática'], deManha: false });
  const g = d => grade.find(x => x.data === d);
  const provas = [
    { data: Plan.somaDias(inicio, 3), disciplina: 'Cambridge', conteudo: null, material: null, incerto: false },
    { data: Plan.somaDias(inicio, 5), disciplina: 'História', conteudo: 'Cap. 3 (Rios): cap. 4 (Cidades).', material: 'Livro 2 e caderno.', incerto: false },
    { data: fim, disciplina: 'Science', conteudo: null, material: null, incerto: false }
  ];
  provas.forEach(p => { if (g(p.data)) g(p.data).prova = p.disciplina; });
  g(Plan.somaDias(inicio, 1)).estudo = ['História (2h)', 'Math (30min)', 'Science (1h30)'];
  return { alunoId: 'al-sint-1', confiancaAluno: 'alta', tratamento: 'Aluna', periodo: { inicio, fim }, grade, provas,
    aulaAConfirmar: [], aulasRemovidas: [], aulasExtras: [], feriados: [], observacoes: [] };
}
compara('planejamento', P => Plan.desenharFolha(planoBase(), { nome: 'Ana Sintética',
  aulas: [{ data: '2026-11-10', hora: '11:00' }, { data: '2026-11-12', hora: '15:30' }] }, P).bytes);
// Lista da Biblioteca: o compositor com os recortes sintéticos do testa_biblioteca_compor.
const JPEG = new Uint8Array(Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAQABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6BooooA//2Q==', 'base64'));
const img = () => ({ bytes: JPEG, wPx: 16, hPx: 16 });
const peca = h => ({ larguraPt: 260, alturaPt: h, rotulo: [4, 2, 56, 12], img: img() });
compara('lista_da_biblioteca', P => P.gerarMaterialBiblioteca({
  titulo: 'Equações do Segundo Grau', subtitulo: 'Resultados Básicos', aluno: 'Aluno Alfa Teste', data: '21/09/2026',
  incluirTeoria: true, incluirLista: true, incluirGabarito: true, gabaritoSeparado: true, espacoParaResposta: 0, mostrarOrigem: true,
  teoria: [{ img: img(), larguraPt: 612, alturaPt: 792 }],
  itens: [60, 140, 90].map((h, i) => ({ id: '9ano:sint:lista:ex:' + (i + 1), origem: 'Portal da OBMEP, Sintético, exercício ' + (i + 1),
    enunciado: peca(h), solucao: i === 2 ? null : peca(80), semSolucao: i === 2 }))
}).bytes);
// Os símbolos que a base-14 já desenhava (Symbol e WinAnsi): a reserva não toca neles.
compara('simbolos_da_base14', P => {
  const d = new P.Doc();
  d.novaPagina();
  d.escreverRico('A = π · r^{2}, Δ = b² - 4ac; α + β ≥ θ, x ≤ ∞, √2 ≠ 1,5; ½ ± ¼ × ³ ÷ µ', { tam: 12 });
  d.escreverRico('**Δ ≥ 0** e *α ≠ β*, com ℘ que nenhuma fonte desenha', { tam: 11 });
  return d.finalizar();
});
// O livro exportado: a seta no texto invisível segue como antes (descartada), e o resto igual.
compara('livro_exportado', P => P.gerarLivroExportado({
  titulo: 'Livro Sintético', subtitulo: 'Capítulo 1', fonte: 'Fonte: Livro Sintético, Autoria Teste, 2026.',
  partes: [{ nome: 'Capítulo', titulo: 'Funções', paginas: [{ img: img(), larguraPt: 400, alturaPt: 600,
    textos: [{ str: 'f: A → B, x ↦ 2x', x: 20, y: 500, tam: 11, largura: 120 }, { str: 'π ≈ 3,14 e x ∈ ℝ', x: 20, y: 480, tam: 11, largura: 110 }] }] }]
}).bytes);

/* Regra 3: sem o fonte-unicode.js ao lado (a cópia do pdf.js sozinha numa
 * pasta), a reserva não existe e tudo é como antes, inclusive o '?' na folha. */
{
  const sozinho = path.join(TMP, 'sozinho');
  fs.mkdirSync(sozinho);
  const copia = path.join(sozinho, 'pdf.js');
  fs.writeFileSync(copia, VENENO ? FONTE_PDF.split(MODOS[VENENO].de).join(MODOS[VENENO].para) : FONTE_PDF);
  const S = require(copia);
  conf('controle', 'sem o fonte-unicode.js, a seta volta a ser recusada', S.caracteresQueNaoDesenha('a → b'), ['→']);
  const doc = P => { const d = new P.Doc(); d.novaPagina(); d.texto('a → b, x⁴', 40, 700, { tam: 12 }); return Buffer.from(d.finalizar()); };
  conf('controle', 'e a folha com seta sai byte a byte como a da base', doc(S).equals(doc(B)), true);
}

// ================================================================ placar
console.log('');
GRUPOS.forEach(g => console.log('  ' + g + ': ' + placar[g].ok + ' ok, ' + placar[g].falha + ' falha'));
let passes = 0, falhas = 0;
if (!VENENO) {
  GRUPOS.forEach(g => { passes += placar[g].ok; falhas += placar[g].falha; });
  if (erros.length) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
} else {
  const alvo = MODOS[VENENO].grupo;
  const vf = (r, ok) => { if (ok) passes++; else falhas++; console.log((ok ? '  OK    ' : '  FALHA ') + r); };
  vf('VENENO visto (' + VENENO + '): o grupo ' + alvo + ' reprova (' + placar[alvo].falha + ' falha)', placar[alvo].falha > 0);
  GRUPOS.filter(g => g !== alvo).forEach(g =>
    vf('com ' + VENENO + ', o grupo ' + g + ' segue verde (o veneno é deste lado só)', placar[g].falha === 0));
}
console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
