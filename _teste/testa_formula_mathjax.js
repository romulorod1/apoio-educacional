/* testa_formula_mathjax.js (D2: fórmula LaTeX em vetor no pdf.js, pelo MathJax 4.1.3; Node, sem navegador)
 *
 * O pdf.js desenhava fórmula só com o renderizador próprio, que saiu no B14.
 * Desde a D2 o formula.js converte o LaTeX pelo MathJax (vendor/mathjax-4.1.3/)
 * em SVG e o svg-para-pdf.js leva o SVG a operadores de PDF, com cada glifo
 * registrado uma vez por documento (Form XObject). Esta prova afirma, medindo o
 * PDF gerado:
 *
 *   controle  sem fórmula, o fechamento, a folha de aula, o planejamento, a
 *             lista da Biblioteca, o livro exportado e duas folhas de texto rico
 *             (símbolos da base-14 e a reserva da D1) saem byte a byte iguais
 *             aos do pdf.js de antes da D2 (bcc9371, FIXO), sem Form no arquivo,
 *             e SEM carregar o formula.js nem o MathJax (espião no require.cache
 *             e no global MathJaxDoApp, olhado antes de qualquer outra seção);
 *   corpus    as 396 expressões de _teste/dados/corpus_notacao.json (a bateria
 *             da D2, sem nada de aluno) numa folha (preta) e num gabarito
 *             (vermelho): quantas montaram, quais falharam (com a lista), letra
 *             sem contorno nenhuma, o MuPDF abre sem reclamar e a extração não
 *             acha TeX cru fora dos colchetes de falha; e o vendor, rodado num
 *             contexto vazio (sem require, process nem DOM, como no tablet),
 *             dá o mesmo SVG que o Node nos 44 casos de estresse;
 *   xobject   um glifo repetido em duas páginas aparece UMA vez no arquivo, as
 *             duas páginas o declaram, e o PDF do corpus fica abaixo do teto de
 *             bytes por fórmula (com o contorno repetido passa dele);
 *   falha     LaTeX quebrado de propósito (em bloco, em linha, no gabarito e
 *             com o MathJax não carregado) sai entre colchetes, cinza, entra no
 *             avisoDeFigura e na lista doc.formulasQueFalharam;
 *   casa      as escolhas do formula.js: \sen e cia., vírgula decimal e hora
 *             como um número, \overset{\frown} vira \overparen, carga do \ce
 *             empilhada, fórmula em linha inteira (um <svg> só) e no corpo certo.
 *
 *   node _teste/testa_formula_mathjax.js [--guarda-pdfs <pasta>]
 *   node _teste/testa_formula_mathjax.js --envenenado-glifo-sem-xobject
 *   node _teste/testa_formula_mathjax.js --envenenado-falha-calada
 *   node _teste/testa_formula_mathjax.js --envenenado-mathjax-na-abertura
 *
 * Os venenos trocam um trecho de uma cópia (gravada na raiz, para os require
 * relativos acharem os vizinhos) e a prova tem de ver cada um no grupo dele,
 * com os outros grupos verdes:
 *   glifo-sem-xobject   o formula.js não registra Form: o contorno vai inteiro a
 *                       cada uso, o glifo repete no arquivo e o teto de bytes
 *                       estoura (xobject);
 *   falha-calada        a fórmula que não monta não desenha nada nem avisa
 *                       (falha);
 *   mathjax-na-abertura todo Doc novo carrega o formula.js e chama o pronto():
 *                       o espião do controle vê o MathJax num documento sem
 *                       fórmula (controle).
 *
 * Com --guarda-pdfs, grava na pasta os PDFs da prova (corpus, estresse, em
 * linha, falha) para o print de revisão.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const vm = require('vm');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const PYTHON = process.env.PYTHON || 'python';

// ---------------------------------------------------------------- venenos
const MODOS = {
  '--envenenado-glifo-sem-xobject': {
    grupo: 'xobject', arquivo: 'formula.js',
    de: 'glifoXObject: function (k, contorno) {',
    para: 'glifoXObject: null, semXObject: function (k, contorno) {'
  },
  '--envenenado-falha-calada': {
    grupo: 'falha', arquivo: 'formula.js',
    de: 'desenharFalha(doc, latex, px, y, tam);',
    para: 'return { largura: 0, altura: 0, profundidade: 0, avisos: [], falhou: false, x: px, y: y };'
  },
  '--envenenado-mathjax-na-abertura': {
    grupo: 'controle', arquivo: 'pdf.js',
    de: 'function Doc() {',
    para: 'function Doc() { var mfVeneno = moduloFormula(); if (mfVeneno && mfVeneno.pronto) mfVeneno.pronto();'
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
const GRUPOS = ['controle', 'corpus', 'xobject', 'falha', 'casa'];
const placar = {};
GRUPOS.forEach(g => { placar[g] = { ok: 0, falha: 0 }; });
const erros = [];
function conf(grupo, rotulo, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  placar[grupo][ok ? 'ok' : 'falha']++;
  if (!ok) erros.push('[' + grupo + '] ' + rotulo);
  console.log((ok ? '  OK    ' : '  FALHA ') + '[' + grupo + '] ' + rotulo +
    (ok ? '' : '  [obtido: ' + JSON.stringify(obtido).slice(0, 300) + ' | esperado: ' + JSON.stringify(esperado).slice(0, 200) + ']'));
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
function trocaUmaVez(fonte, de, para, onde) {
  const partes = fonte.split(de);
  if (partes.length !== 2) {
    console.log('FALHA: a âncora do veneno ' + VENENO + ' aparece ' + (partes.length - 1) + ' vezes no ' + onde + ' (devia ser 1)');
    console.log('0 passaram, 1 falharam.');
    process.exit(1);
  }
  return partes.join(para);
}

/* O pdf.js e o formula.js que esta rodada prova. Com veneno no formula.js, a
 * cópia do pdf.js pede a cópia envenenada; com veneno no pdf.js, o formula.js é
 * o de verdade. O caminho do require é o real nos dois casos (moduloFormula). */
const FONTE_PDF = fs.readFileSync(path.join(RAIZ, 'pdf.js'), 'utf8');
const FONTE_FORMULA = fs.readFileSync(path.join(RAIZ, 'formula.js'), 'utf8');
let ARQ_PDF = path.join(RAIZ, 'pdf.js');
let ARQ_FORMULA = path.join(RAIZ, 'formula.js');
if (VENENO) {
  const m = MODOS[VENENO];
  if (m.arquivo === 'formula.js') {
    ARQ_FORMULA = gravaNaRaiz('_formula_veneno_d2.js', trocaUmaVez(FONTE_FORMULA, m.de, m.para, 'formula.js'));
    ARQ_PDF = gravaNaRaiz('_pdf_veneno_d2.js', trocaUmaVez(FONTE_PDF, "require('./formula.js')", "require('./_formula_veneno_d2.js')", 'pdf.js'));
  } else {
    ARQ_PDF = gravaNaRaiz('_pdf_veneno_d2.js', trocaUmaVez(FONTE_PDF, m.de, m.para, 'pdf.js'));
  }
}

/* O pdf.js de ANTES DA D2, num commit FIXO: bcc9371, a main de logo antes da D2
 * (com a D1 e o #255 dentro). Não o merge-base com a origin/main: depois do
 * merge da D2 ele já teria o formula.js, e o controle compararia o pdf.js com
 * ele mesmo. Mesmo padrão do testa_fonte_unicode (c8bc1e6). Se o commit não
 * estiver no clone, a prova falha alto, nunca compara com outra coisa. Se um PR
 * futuro mudar de propósito os bytes de documento sem fórmula, o controle cai,
 * e quem muda move este commit e diz por quê. */
const BASE_ANTES_DA_D2 = 'bcc9371';
function pdfDaBase() {
  try {
    execFileSync('git', ['cat-file', '-e', BASE_ANTES_DA_D2 + '^{commit}'], { cwd: RAIZ, stdio: 'ignore' });
  } catch (e) {
    console.log('FALHA: o commit ' + BASE_ANTES_DA_D2 + ' (a main de antes da D2) não está neste clone; o controle não tem com o que comparar. Clone com o histórico inteiro (git fetch --unshallow).');
    console.log('0 passaram, 1 falharam.');
    process.exit(1);
  }
  const fonte = execFileSync('git', ['show', BASE_ANTES_DA_D2 + ':pdf.js'], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (/registraForma|require\('\.\/formula\.js'\)/.test(fonte)) {
    console.log('FALHA: o pdf.js da ' + BASE_ANTES_DA_D2 + ' já tem a D2; a base do controle está errada.');
    console.log('0 passaram, 1 falharam.');
    process.exit(1);
  }
  return fonte;
}
const B = require(gravaNaRaiz('_pdf_base_d2.js', pdfDaBase()));
const G = require(ARQ_PDF);
console.log('  base do controle: ' + BASE_ANTES_DA_D2 + ' (fixa, antes da D2)' + (VENENO ? '; veneno: ' + VENENO : ''));

// ---------------------------------------------------------------- utilidades
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'formula_mathjax_'));
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
const VERMELHO = [0.85, 0.1, 0.1];

/* O espião: o formula.js e o vendor no require.cache, e o global que o vendor
 * cria. Nada disso pode existir depois de gerar documento sem fórmula. */
const VENDOR_ABS = path.join(RAIZ, 'vendor', 'mathjax-4.1.3', 'mathjax-svg.min.js');
function oQueCarregou() {
  const chaves = Object.keys(require.cache);
  return {
    formula: chaves.filter(k => /[\\/](_formula_veneno_d2|formula)\.js$/.test(k)).length,
    vendor: chaves.filter(k => path.resolve(k) === VENDOR_ABS).length,
    global: typeof globalThis.MathJaxDoApp !== 'undefined'
  };
}

// ================================================================ controle
secao('Controle: sem fórmula, o PDF é byte a byte o de antes da D2, e o MathJax não carrega');
const Core = require('../core.js');
const Plan = require('../planejamento.js');
conf('controle', 'controle positivo do espião: antes de tudo, nada carregado', oQueCarregou(), { formula: 0, vendor: 0, global: false });
function compara(nome, gerar) {
  const antes = Buffer.from(gerar(B));
  const depois = Buffer.from(gerar(G));
  guarda('controle_' + nome + '_antes.pdf', antes);
  guarda('controle_' + nome + '_depois.pdf', depois);
  let pos = 0;
  const n = Math.min(antes.length, depois.length);
  while (pos < n && antes[pos] === depois[pos]) pos++;
  conf('controle', nome + ': byte a byte igual ao da ' + BASE_ANTES_DA_D2, antes.equals(depois) ? 'igual' :
    antes.length + ' bytes antes, ' + depois.length + ' depois, primeiro diferente em ' + pos, 'igual');
  conf('controle', nome + ': sem Form XObject no arquivo', quantas(latin1(depois), '/Subtype /Form'), 0);
}
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
compara('folha_de_aula', P => P.gerarFolhaAula({
  alunoNome: 'Aluno Alfa Teste', data: '2026-06-09',
  nota: { paginas: [{ fundo: 'pautado', itens: [
    { t: 'texto', x: 40, y: 60, txt: 'Área do quadrado: A = l² · 1 (em cm²)', tam: 26, cor: '#1A1C1F' },
    { t: 'traco', cor: '#C0392B', pontos: [[100, 300, 3], [200, 350, 3], [300, 320, 4], [380, 400, 3]] },
    { t: 'tapar', x: 600, y: 600, w: 120, h: 40 }
  ] }] },
  imagens: {}
}));
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
compara('livro_exportado', P => P.gerarLivroExportado({
  titulo: 'Livro Sintético', subtitulo: 'Capítulo 1', fonte: 'Fonte: Livro Sintético, Autoria Teste, 2026.',
  partes: [{ nome: 'Capítulo', titulo: 'Funções', paginas: [{ img: img(), larguraPt: 400, alturaPt: 600,
    textos: [{ str: 'f: A → B, x ↦ 2x', x: 20, y: 500, tam: 11, largura: 120 }, { str: 'π ≈ 3,14 e x ∈ ℝ', x: 20, y: 480, tam: 11, largura: 110 }] }] }]
}).bytes);
compara('simbolos_da_base14', P => {
  const d = new P.Doc();
  d.novaPagina();
  d.escreverRico('A = π · r^{2}, Δ = b² - 4ac; α + β ≥ θ, x ≤ ∞, √2 ≠ 1,5; ½ ± ¼ × ³ ÷ µ', { tam: 12 });
  d.escreverRico('**Δ ≥ 0** e *α ≠ β*, com ℘ que nenhuma fonte desenha', { tam: 11 });
  return d.finalizar();
});
compara('reserva_da_d1', P => {
  const d = new P.Doc();
  d.novaPagina();
  d.escreverRico('Conjuntos ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ; f′(x) → 0 quando x → ∞; x⁴ − 3·z₁ ≈ 0; **negrito → γ** e *itálico ∈ A*.', { tam: 11 });
  d.textoRico('Potências de 10^{3} e ℓ ≈ 2 m', MARG_E_DE(P), 600, { tam: 12, bold: true });
  return d.finalizar();
});
function MARG_E_DE(P) { return P.MARG_E; }
conf('controle', 'depois dos 7 documentos sem fórmula: nem o formula.js, nem o vendor, nem o MathJaxDoApp', oQueCarregou(), { formula: 0, vendor: 0, global: false });

// ---------------------------------------------------------------- daqui em diante, com fórmula
const F = require(ARQ_FORMULA);
const corpus = JSON.parse(fs.readFileSync(path.join(__dirname, 'dados', 'corpus_notacao.json'), 'utf8'));
const ESTRESSE = corpus.filter(i => /-estresse-/.test(i.id));
const TEX_CRU = /\\[A-Za-z]|[\^_]\{|\\\(|\\\)/;
const semColchetes = s => s.replace(/\[[^\]]*\]/g, ' ');

function docDoCorpus(itens, cor, titulo) {
  const d = new G.Doc();
  d.novaPagina();
  d.y -= 4;
  d.texto(titulo, G.MARG_E, d.y, { tam: 12, bold: true, cor: cor });
  d.y -= 6;
  itens.forEach(it => {
    const alt = d.alturaDeEquacao(it.latex, { tam: 11 });
    if (d.y - alt - 12 < G.Y_LIMITE) d.novaPagina();
    d.y -= 10;
    d.texto(it.id, G.MARG_E, d.y, { tam: 7, cor: G.COR.muted });
    d.equacao(it.latex, { tam: 11, cor: cor });
  });
  return d;
}

(async () => {
  const t0 = process.hrtime.bigint();
  await F.pronto();
  const tCarga = Number(process.hrtime.bigint() - t0) / 1e6;
  console.log('  MathJax carregado em ' + tCarga.toFixed(0) + ' ms (' + JSON.stringify(F.estado()) + ')');

  // ================================================================ corpus
  secao('Corpus: as 396 expressões na folha e no gabarito');
  conf('corpus', 'o corpus tem as 396 expressões e os 44 casos de estresse', [corpus.length, ESTRESSE.length], [396, 44]);
  const t1 = process.hrtime.bigint();
  const folha = docDoCorpus(corpus, G.COR.texto, 'Corpus de notação da D2: folha');
  const bFolha = folha.finalizar();
  const tFolha = Number(process.hrtime.bigint() - t1) / 1e6;
  const gabarito = docDoCorpus(corpus, VERMELHO, 'Corpus de notação da D2: gabarito');
  const bGab = gabarito.finalizar();
  guarda('corpus_folha.pdf', bFolha);
  guarda('corpus_gabarito.pdf', bGab);
  console.log('  folha: ' + folha.paginas.length + ' páginas, ' + bFolha.length + ' bytes, ' + tFolha.toFixed(0) +
    ' ms com a conversão; gabarito: ' + gabarito.paginas.length + ' páginas, ' + bGab.length + ' bytes');
  const falhasFolha = (folha.formulasQueFalharam || []).map(f => f.latex.slice(0, 60) + ' (' + f.motivo + ')');
  const falhasGab = (gabarito.formulasQueFalharam || []);
  console.log('  montaram: ' + (corpus.length - falhasFolha.length) + ' de ' + corpus.length + ' na folha, ' +
    (corpus.length - falhasGab.length) + ' no gabarito; falharam: ' + JSON.stringify(falhasFolha));
  conf('corpus', 'todas as 396 montaram na folha (lista das que falharam)', falhasFolha, []);
  conf('corpus', 'e no gabarito', falhasGab.length, 0);
  const avisosEstranhos = (folha.avisosFigura || []).filter(a => !/mais larga que a coluna/.test(a));
  conf('corpus', 'nenhum aviso do tradutor (letra sem contorno, elemento ignorado) nem de falha', avisosEstranhos, []);
  const largas = (folha.avisosFigura || []).filter(a => /mais larga que a coluna/.test(a));
  console.log('  ' + largas.length + ' fórmulas mais largas que a coluna, encolhidas: ' +
    largas.filter(a => /encolhida/.test(a)).length + '; ainda passam da margem: ' + largas.filter(a => /ainda passa/.test(a)).length);
  /* No corpus, a 11 pt, nenhuma passa da coluna (medido: 0); a regra do
   * encolher é provada de propósito na seção "casa". */
  conf('corpus', 'nenhuma fórmula do corpus passa da margem (' + largas.length + ' mais largas que a coluna)', largas.filter(a => /ainda passa/.test(a)), []);
  console.log('  blocos de fonte que o corpus pediu: ' + F.estado().blocos.join(', '));
  const exF = extrair(bFolha), exG = extrair(bGab);
  conf('corpus', 'o MuPDF abre a folha e o gabarito sem reclamar', [exF.avisos, exG.avisos], [[], []]);
  conf('corpus', 'o MuPDF vê as mesmas páginas que o pdf.js', [exF.paginas, exG.paginas], [folha.paginas.length, gabarito.paginas.length]);
  const textoF = exF.texto.join('\n'), textoG = exG.texto.join('\n');
  conf('corpus', 'a extração da folha não acha TeX cru fora dos colchetes', (semColchetes(textoF).match(TEX_CRU) || [null])[0], null);
  conf('corpus', 'nem a do gabarito', (semColchetes(textoG).match(TEX_CRU) || [null])[0], null);
  conf('corpus', 'controle da extração: os 396 rótulos aparecem na folha', corpus.filter(i => textoF.indexOf(i.id) < 0).length, 0);
  const vermelho = '0.85 0.1 0.1 rg';
  conf('corpus', 'o gabarito pinta as fórmulas de vermelho, a folha não', [quantas(latin1(bGab), vermelho) >= 396, quantas(latin1(bFolha), vermelho)], [true, 0]);
  /* O vendor num contexto vazio, como no tablet: sem require, sem process, sem
   * DOM. Os 44 casos de estresse dão o mesmo SVG que o Node. Controle
   * positivo: uma fórmula diferente dá SVG diferente. */
  {
    const ctx = { console: console };
    ctx.self = ctx;
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(VENDOR_ABS, 'utf8'), ctx, { filename: 'mathjax-svg.min.js' });
    /* As mesmas opções do formula.js, montadas DENTRO do contexto (objeto e
     * RegExp de outro contexto não passam pelo merge de opções do MathJax). */
    ctx.opcoesTex = JSON.stringify({ macros: F.OPCOES_TEX.macros, digits: F.OPCOES_TEX.digits.source });
    vm.runInContext('var o = JSON.parse(opcoesTex); o.digits = new RegExp(o.digits); MathJaxDoApp.aoMhchem(' +
      F.empilharCarga.toString() + '); var noVm = MathJaxDoApp.criar(o);', ctx);
    // o número do documento no id dos glifos (MJX-<n>-) é contador de cada instância
    const norm = s => s.replace(/MJX-\d+-/g, 'MJX-');
    const doVm = l => norm(ctx.noVm.latexParaSvg(F.preparar(l), true));
    const dif = ESTRESSE.filter(i => doVm(i.latex) !== norm(F.latexParaSvg(i.latex, true)));
    conf('corpus', 'o vendor num contexto vazio dá o mesmo SVG que o formula.js nos 44 de estresse', dif.map(i => i.id), []);
    conf('corpus', 'controle positivo da comparação: fórmulas diferentes dão SVG diferente',
      doVm('x^{2}') === norm(F.latexParaSvg('x^{3}', true)), false);
  }
  {
    const ef = docDoCorpus(ESTRESSE, G.COR.texto, 'Os 44 casos de estresse: folha');
    const eg = docDoCorpus(ESTRESSE, VERMELHO, 'Os 44 casos de estresse: gabarito');
    guarda('estresse_folha.pdf', ef.finalizar());
    guarda('estresse_gabarito.pdf', eg.finalizar());
  }

  // ================================================================ xobject
  secao('XObject: cada glifo uma vez por documento');
  {
    const d = new G.Doc();
    d.novaPagina();
    d.equacao('x + x + x = 3x', { tam: 11 });
    d.escreverRico('Em linha também: \\(x \\cdot x = x^{2}\\).', { tam: 11 });
    d.novaPagina();
    d.equacao('x - x = 0', { tam: 11, cor: VERMELHO });
    const bytes = d.finalizar();
    const bruto = latin1(bytes);
    const glifos = (d.formulasDoDoc || { glifos: {} }).glifos;
    const chaveX = Object.keys(glifos).find(k => /-1D465$/.test(k));
    conf('xobject', 'o glifo do x itálico foi convertido', !!chaveX, true);
    const contorno = chaveX ? glifos[chaveX] : 'nada';
    conf('xobject', 'o contorno do x aparece UMA vez no arquivo (usado 9 vezes em duas páginas)', quantas(bruto, contorno), 1);
    const formas = Object.keys(d.formas || {}).length;
    conf('xobject', 'um Form por glifo distinto do documento', [quantas(bruto, '/Subtype /Form'), formas > 0], [formas, true]);
    const nomeX = d.formas && d.formas['glifo:' + chaveX] ? d.formas['glifo:' + chaveX].nome : '?';
    const paginas = bruto.split('/Type /Page ').slice(1);
    conf('xobject', 'as duas páginas declaram o Form do x nos recursos', paginas.map(p => new RegExp('/XObject << [^>]*/' + nomeX + ' \\d+ 0 R').test(p)), [true, true]);
    const ex = extrair(bytes);
    conf('xobject', 'o MuPDF abre sem reclamar', ex.avisos, []);
    guarda('xobject.pdf', bytes);
  }
  /* O teto de bytes por fórmula do corpus. Medido em 16/11/2026: com o Form,
   * 1,5 KB por fórmula na folha (o arquivo inteiro, 611 KB, dividido por 396);
   * com o contorno repetido a cada uso (o veneno glifo-sem-xobject), 10,1 KB.
   * O teto de 2,5 KB fica entre os dois, longe de cada um. */
  const porFormula = bFolha.length / corpus.length;
  console.log('  ' + Math.round(porFormula) + ' bytes por fórmula na folha do corpus (' + bFolha.length + ' / ' + corpus.length + ')');
  conf('xobject', 'a folha do corpus fica abaixo de 2,5 KB por fórmula', porFormula < 2500, true);

  // ================================================================ falha
  secao('Falha alta: o que não monta sai entre colchetes, cinza, e avisa');
  {
    const d = new G.Doc();
    d.novaPagina();
    d.escreverRico('Antes da fórmula quebrada.', { tam: 11 });
    d.equacao('\\frac{1}{2', { tam: 11 });
    d.escreverRico('Em linha: \\(\\cancelar{x}\\) e o texto segue.', { tam: 11 });
    d.equacao('\\begin{bmatrix} 1 & 2 \\end{pmatrix}', { tam: 11, cor: VERMELHO });
    const bytes = d.finalizar();
    guarda('falha.pdf', bytes);
    const ex = extrair(bytes);
    const txt = ex.texto.join('\n').replace(/\s+/g, ' ');
    conf('falha', 'a quebrada em bloco aparece entre colchetes na folha', txt.indexOf('[\\frac{1}{2]') >= 0, true);
    conf('falha', 'a quebrada em linha também, e o texto segue', /\[\\cancelar\{x\}\] e o texto segue/.test(txt), true);
    conf('falha', 'a quebrada do gabarito também', txt.indexOf('[\\begin{bmatrix} 1 & 2 \\end{pmatrix}]') >= 0, true);
    conf('falha', 'em cinza (o COR.muted), e não na cor da fórmula',
      quantas(latin1(bytes), '0.419608 0.447059 0.501961 rg /F1 11 Tf'), 3);
    const avisos = (d.avisosFigura || []).filter(a => /não montou/.test(a));
    conf('falha', 'as três entram no avisoDeFigura, com o motivo', avisos.map(a => /Missing close brace|Undefined control sequence|Unknown environment|\\begin\{bmatrix\} ended/.test(a)), [true, true, true]);
    conf('falha', 'e na lista doc.formulasQueFalharam', (d.formulasQueFalharam || []).map(f => f.latex),
      ['\\frac{1}{2', '\\cancelar{x}', '\\begin{bmatrix} 1 & 2 \\end{pmatrix}']);
  }
  {
    /* Um formula.js que ninguém carregou: gerar sem o pronto() não pode sair
     * calado nem derrubar o documento. */
    const copia = gravaNaRaiz('_formula_sem_pronto_d2.js', fs.readFileSync(ARQ_FORMULA, 'utf8'));
    const S = require(copia);
    const d = new G.Doc();
    d.novaPagina();
    const r = S.desenhar(d, 'x^{2}', 100, 700, 11, {});
    conf('falha', 'sem o pronto(), a fórmula sai entre colchetes e diz por quê',
      [r.falhou, /não foi carregado/.test((r.avisos || [])[0] || '')], [true, true]);
    conf('falha', 'e entra na lista do documento', (d.formulasQueFalharam || []).length, 1);
  }

  // ================================================================ casa
  secao('As escolhas da casa');
  const w = (l, o) => +F.medir(l, 10, o || {}).largura.toFixed(3);
  const nada = (l) => F.medir(l, 10, {}).falhou;
  ['sen', 'tg', 'cotg', 'cossec', 'arcsen', 'arctg'].forEach(f => {
    conf('casa', '\\' + f + ' x monta e sai como \\operatorname{' + f + '} x', [nada('\\' + f + ' x'), w('\\' + f + ' x')], [false, w('\\operatorname{' + f + '} x')]);
  });
  conf('casa', 'vírgula decimal: 0,5 sai como 0{,}5', w('0,5'), w('0{,}5'));
  conf('casa', 'e 2,50 como 2{,}50', w('2,50'), w('2{,}50'));
  conf('casa', 'hora: 14:35 sai como 14{:}35', w('14:35'), w('14{:}35'));
  conf('casa', 'controle: "1, 2" com espaço continua mais largo que "1,2"', w('1, 2') > w('1,2'), true);
  conf('casa', 'controle: o "{,}" do TeX não muda', w('0{,}5') < w('0,\\,5'), true);
  const arco = F.medir('\\overset{\\frown}{AB}', 10, {}), paren = F.medir('\\overparen{AB}', 10, {});
  conf('casa', '\\overset{\\frown}{AB} sai como \\overparen{AB}', [arco.largura, arco.altura, arco.profundidade], [paren.largura, paren.altura, paren.profundidade]);
  conf('casa', 'o mhchem empilha a carga: SO4^2- tem a largura do índice e da carga juntos',
    w('\\ce{SO4^2-}'), w('{\\mathrm{SO}{\\vphantom{A}}_{\\smash[t]{4}}^{2-}}'));
  conf('casa', 'controle: escalonado (como o mhchem sai sem o gancho) é mais largo',
    w('{\\mathrm{SO}{\\vphantom{A}}_{\\smash[t]{4}}{\\vphantom{A}}^{2-}}') > w('\\ce{SO4^2-}'), true);
  conf('casa', 'em linha, a fórmula vem inteira (um <svg> só): x^{2} - 4 = 0 tem a largura do display',
    w('x^{2} - 4 = 0', { display: false }), w('x^{2} - 4 = 0'));
  conf('casa', 'corpo: a fórmula sai a 1,1 vez o corpo pedido', +(F.medir('x', 20, {}).largura / F.medir('x', 10, {}).largura).toFixed(6), 2);
  {
    /* O gancho do "Preparando as fórmulas...": o pronto() com as fórmulas do
     * documento converte de antemão, em lotes, e o aoDemorar dispara se passar
     * do prazo. As 396 do corpus EM LINHA ainda não estão no cache (o corpus
     * foi em bloco), e levam mais de um lote. */
    const emLinha = corpus.map(i => ({ latex: i.latex, display: false }));
    const antes = F.estado().noCache;
    let disparou = 0;
    await F.pronto({ formulas: emLinha, depoisDe: 0, aoDemorar: () => { disparou++; } });
    const depois = F.estado().noCache;
    emLinha.forEach(f => F.medir(f.latex, 11, { display: false }));
    conf('casa', 'pronto({ formulas }) converte de antemão as 396 em linha: medir depois não converte mais nada',
      [depois - antes > 300, F.estado().noCache - depois], [true, 0]);
    conf('casa', 'e o aoDemorar dispara uma vez quando passa do prazo (depoisDe 0)', disparou, 1);
    let calado = 0;
    await F.pronto({ formulas: emLinha, depoisDe: 60000, aoDemorar: () => { calado++; } });
    await new Promise(r => setTimeout(r, 20));
    conf('casa', 'controle: já no cache e com prazo de 60 s, não dispara nem converte de novo', [calado, F.estado().noCache - depois], [0, 0]);
    /* Equação mais larga que a coluna: encolhe até caber, até 70% do corpo, e
     * avisa; além disso, avisa que ainda passa da margem. */
    const soma = n => Array.from({ length: n }, (v, k) => 'a_{' + (k + 1) + '}').join(' + ');
    let n = 5;
    while (F.medir(soma(n), 11, {}).largura < G.UTIL * 1.15) n++;
    const larga = soma(n), largaDemais = soma(3 * n);
    const dl = new G.Doc();
    dl.novaPagina();
    const rl = dl.equacao(larga, { tam: 11 });
    const avUm = (dl.avisosFigura || []).slice();
    const rl2 = dl.equacao(largaDemais, { tam: 11 });
    const avDois = (dl.avisosFigura || []).slice(avUm.length);
    conf('casa', 'equação 15% mais larga que a coluna encolhe até caber e avisa quanto, sem dizer que passa',
      [rl.largura <= G.UTIL + 0.01, rl.largura > G.UTIL * 0.98, avUm.map(a => /encolhida a 8\d% do corpo: @eq/.test(a) && !/ainda passa/.test(a))], [true, true, [true]]);
    conf('casa', 'e a que nem a 70% cabe sai a 70% e avisa que ainda passa da margem',
      [Math.abs(rl2.largura / F.medir(largaDemais, 11, {}).largura - 0.7) < 0.001, avDois.map(a => /encolhida a 70% do corpo e ainda passa da margem/.test(a))], [true, [true]]);
    conf('casa', 'temFormula: \\( e @eq isolada sim; texto, e-mail e expoente da casa não',
      ['a \\(x\\) b', 'veja @eq x^2', 'só texto', 'contato@eq.com', 'x^{2} e π'].map(F.temFormula), [true, true, false, false, false]);
    conf('casa', 'formulasDoTexto devolve as fórmulas em linha do texto',
      F.formulasDoTexto('a \\( x^{2} \\) b \\(\\frac{1}{2}\\) c \\(y'), [{ latex: 'x^{2}', display: false }, { latex: '\\frac{1}{2}', display: false }, { latex: 'y', display: false }]);
  }
  {
    const d = new G.Doc();
    d.novaPagina();
    d.escreverRico('Resolva \\(x^{2} - 5x + 6 = 0\\) e confira com \\(\\frac{-b \\pm \\sqrt{\\Delta}}{2a}\\), ' +
      'sabendo que \\(\\Delta = b^{2} - 4ac\\). A fração \\(\\frac{3}{4}\\) vale \\(0,75\\); às \\(14:35\\) o trem sai. ' +
      'Na química, \\(\\ce{SO4^2-}\\) e \\(\\ce{H2O}\\); no arco, \\(\\overset{\\frown}{AB}\\); e \\(\\sen 30^{\\circ} = \\frac{1}{2}\\).', { tam: 11 });
    d.escreverRico('No gabarito, em vermelho: \\(x = 2\\) ou \\(x = 3\\), porque \\(\\frac{5 \\pm 1}{2}\\).', { tam: 11, cor: VERMELHO });
    d.escreverRico('**Negrito antes** de \\(a*b\\), com asterisco dentro da fórmula, e *itálico depois*.', { tam: 11 });
    const bytes = d.finalizar();
    guarda('em_linha.pdf', bytes);
    const ex = extrair(bytes);
    const txt = ex.texto.join(' ').replace(/\s+/g, ' ');
    conf('casa', 'em linha: o texto em volta das fórmulas volta inteiro e sem TeX cru', [txt.indexOf('e confira com') >= 0, txt.indexOf('o trem sai') >= 0, (txt.match(TEX_CRU) || [null])[0]], [true, true, null]);
    conf('casa', 'em linha: nenhuma falhou nem avisou', [(d.formulasQueFalharam || []).length, (d.avisosFigura || []).length], [0, 0]);
    conf('casa', 'o asterisco dentro da fórmula não vira itálico: "itálico depois" segue em itálico', /\/F4 11 Tf/.test(latin1(bytes)) && txt.indexOf('itálico depois') >= 0, true);
    conf('casa', 'as travas de caractere e de marcação não leem a fórmula em linha',
      [G.caracteresQueNaoDesenha('a \\(\\wp \\in \\mathbb{R}\\) b'), G.marcacaoQueSobrou('a \\(x^{2}_{3}\\) b')], [[], null]);
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
})().catch(e => {
  console.log('FALHA: a prova parou com erro: ' + (e && e.stack ? e.stack : e));
  console.log('0 passaram, 1 falharam.');
  process.exit(1);
});
