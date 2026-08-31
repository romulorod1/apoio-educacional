/* Teste do núcleo de cálculo e do gerador de PDF.
 * Usa os dados reais do fechamento de junho do Marcelo como referência,
 * porque o total dele (10:30 h e R$ 1.050,00) já foi conferido à mão.
 */
const fs = require('fs');
const path = require('path');
const Core = require('../core.js');
const PDFGen = require('../pdf.js');

let falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (!ok) falhas++;
  console.log((ok ? 'OK   ' : 'FALHA') + ' | ' + rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado);
}

// ---------------- base de teste ----------------

const marcelo = {
  id: 'a1',
  nome: 'Marcelo',
  responsavel: '',
  cor: '#2E7D6B',
  ativo: true,
  grade: { dias: [1, 3, 5], hora: '15:30', duracaoMin: 60 },
  precos: [
    { id: 'p1', inicio: '2025-01-01', fim: '2026-05-31', valorHora: 100 },
    { id: 'p2', inicio: '2026-06-01', fim: null, valorHora: 100 }
  ]
};

// Cecília serve para testar 1h30 e reajuste no meio do mês.
const cecilia = {
  id: 'a2',
  nome: 'Cecília',
  responsavel: 'Sra. Andrade',
  cor: '#1F3A5F',
  ativo: true,
  grade: { dias: [2, 4], hora: '09:00', duracaoMin: 90 },
  precos: [
    { id: 'p3', inicio: '2025-01-01', fim: '2026-06-14', valorHora: 120 },
    { id: 'p4', inicio: '2026-06-15', fim: null, valorHora: 150 }
  ]
};

const datasMarcelo = [
  ['2026-06-01', 60], ['2026-06-05', 60], ['2026-06-08', 60], ['2026-06-10', 90],
  ['2026-06-15', 60], ['2026-06-17', 60], ['2026-06-19', 60], ['2026-06-22', 60],
  ['2026-06-24', 60], ['2026-06-26', 60]
];

const db = { alunos: [marcelo, cecilia], aulas: [], resumos: [] };

datasMarcelo.forEach(([data, dur], i) => {
  db.aulas.push({
    id: 'au' + i, alunoId: 'a1', data, hora: '15:30', duracaoMin: dur,
    status: 'realizada', cobravel: true, notaTexto: ''
  });
});

// Cecília: 2h antes do reajuste, 2h depois, mais uma cancelada com aviso.
db.aulas.push({ id: 'c1', alunoId: 'a2', data: '2026-06-02', hora: '09:00', duracaoMin: 90, status: 'realizada' });
db.aulas.push({ id: 'c2', alunoId: 'a2', data: '2026-06-04', hora: '09:00', duracaoMin: 30, status: 'realizada' });
db.aulas.push({ id: 'c3', alunoId: 'a2', data: '2026-06-16', hora: '09:00', duracaoMin: 90, status: 'realizada' });
db.aulas.push({ id: 'c4', alunoId: 'a2', data: '2026-06-18', hora: '09:00', duracaoMin: 30, status: 'reposicao' });
db.aulas.push({ id: 'c5', alunoId: 'a2', data: '2026-06-23', hora: '09:00', duracaoMin: 90, status: 'cancelada' });

db.resumos.push({
  alunoId: 'a1', mes: '2026-06',
  texto: 'Marcelo está se tornando um homenzinho. Muito legal acompanhar o crescimento dele de perto.\n' +
    'Marcelo já consegue identificar o que ele quer fazer e está começando a se posicionar quanto a isso. ' +
    'Vale lembrar, no entanto, que a vida não é feita apenas do que queremos fazer, mas também das coisas que devem ser feitas.\n' +
    'Como combinado, estamos praticando a interpretação de textos e as respostas discursivas mais elaboradas, ' +
    'mas sem deixar de lado o conteúdo e as tarefas de casa.\n' +
    'Marcelo tem se distraído um pouco mais durante as aulas e me cobrou, no nosso último encontro, uma aula mais ' +
    '“legal”. Vou levar umas propostas diferentes para atrair mais a atenção dele.'
});

// ---------------- testes de cálculo ----------------

console.log('\n=== formatação ===');
conf('moeda 1050', Core.fmtMoeda(1050), 'R$ 1.050,00');
conf('moeda 1050.5', Core.fmtMoeda(1050.5), 'R$ 1.050,50');
conf('moeda 12345.678', Core.fmtMoeda(12345.678), 'R$ 12.345,68');
conf('moeda 0', Core.fmtMoeda(0), 'R$ 0,00');
conf('moeda 100', Core.fmtMoeda(100), 'R$ 100,00');
conf('moeda 999.999', Core.fmtMoeda(999.999), 'R$ 1.000,00');
conf('horas 630', Core.fmtHoras(630), '10:30');
conf('horas 60', Core.fmtHoras(60), '1:00');
conf('horas decimal 630', Core.fmtHorasDecimal(630), '10,5');
conf('duração 90', Core.fmtDuracao(90), '1h30');
conf('duração 120', Core.fmtDuracao(120), '2h');
conf('mês extenso', Core.mesExtenso('2026-06'), 'Junho de 2026');
conf('dia da semana 01/06/2026', Core.diaSemanaCurto('2026-06-01'), 'seg');
conf('dia da semana 26/06/2026', Core.diaSemanaCurto('2026-06-26'), 'sex');
conf('dias do mês 2026-02', Core.diasDoMes('2026-02'), 28);
conf('dias do mês 2024-02', Core.diasDoMes('2024-02'), 29);
conf('mês anterior', Core.mesAdjacente('2026-01', -1), '2025-12');
conf('mês seguinte', Core.mesAdjacente('2026-12', 1), '2027-01');
conf('grade em texto', Core.gradeTexto(marcelo), 'segunda, quarta e sexta, 15:30');

console.log('\n=== preço vigente ===');
conf('preço em 31/05/2026', Core.precoVigente(cecilia, '2026-05-31').valorHora, 120);
conf('preço em 14/06/2026', Core.precoVigente(cecilia, '2026-06-14').valorHora, 120);
conf('preço em 15/06/2026', Core.precoVigente(cecilia, '2026-06-15').valorHora, 150);
conf('preço antes da primeira vigência', Core.precoVigente(cecilia, '2024-12-31'), null);
conf('vigências sem erro', Core.validarPrecos(cecilia).length, 0);
conf('vigências sobrepostas detectadas', Core.validarPrecos({
  precos: [{ inicio: '2025-01-01', fim: null, valorHora: 100 }, { inicio: '2026-01-01', fim: null, valorHora: 120 }]
}).length > 0, true);

console.log('\n=== fechamento do Marcelo, junho de 2026 (referência real) ===');
const fMarcelo = Core.calcularFechamento(db, 'a1', '2026-06');
conf('quantidade de encontros', fMarcelo.linhas.length, 10);
conf('total de minutos', fMarcelo.totalMin, 630);
conf('total de horas', fMarcelo.totalHoras, '10:30');
conf('total a cobrar', Core.fmtMoeda(fMarcelo.totalValor), 'R$ 1.050,00');
conf('preço único no mês', fMarcelo.precoUnico, 100);
conf('sem aula sem preço', fMarcelo.semPreco.length, 0);

console.log('\n=== fechamento da Cecília, com reajuste no meio do mês ===');
const fCecilia = Core.calcularFechamento(db, 'a2', '2026-06');
// 90 + 30 = 120 min a 120/h = 240 ; 90 + 30 = 120 min a 150/h = 300 ; cancelada não conta
conf('total de minutos cobrados', fCecilia.totalMin, 240);
conf('minutos não cobrados', fCecilia.minutosNaoCobrados, 90);
conf('total a cobrar', Core.fmtMoeda(fCecilia.totalValor), 'R$ 540,00');
conf('duas faixas de preço', fCecilia.faixas.length, 2);
conf('faixa 1', Core.fmtMoeda(fCecilia.faixas[0].valor), 'R$ 240,00');
conf('faixa 2', Core.fmtMoeda(fCecilia.faixas[1].valor), 'R$ 300,00');
conf('preço único é nulo', fCecilia.precoUnico, null);

console.log('\n=== grade automática ===');
const geradas = Core.aulasDaGradeNoMes(marcelo, '2026-06');
conf('aulas previstas pela grade em junho', geradas.length, 13);
conf('primeira aula prevista', geradas[0].data, '2026-06-01');

console.log('\n=== Markdown ===');
const md = Core.markdownFechamento(fMarcelo, { incluirNotas: true });
conf('markdown tem o total', md.indexOf('R$ 1.050,00') > 0, true);
conf('markdown tem o aluno', md.indexOf('**Aluno:** Marcelo') > 0, true);
conf('markdown sem travessão', /[–—]/.test(md), false);
fs.writeFileSync(path.join(__dirname, 'saida_marcelo.md'), md, 'utf8');

const mdMes = Core.markdownMesInteiro(Core.calcularMesInteiro(db, '2026-06'), '2026-06');
conf('markdown do mês sem travessão', /[–—]/.test(mdMes), false);
fs.writeFileSync(path.join(__dirname, 'saida_mes.md'), mdMes, 'utf8');

// ---------------- teste do PDF ----------------

console.log('\n=== PDF ===');

// nota de aula sintética: traços, texto e fundo pautado
function tracoOndulado(x0, y0, largura, amplitude, espessura) {
  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    pts.push([x0 + largura * t, y0 + Math.sin(t * Math.PI * 4) * amplitude, espessura * (0.6 + 0.8 * Math.abs(Math.sin(t * Math.PI * 2)))]);
  }
  return { t: 'traco', cor: '#1A1C1F', pontos: pts };
}

const notas = [{
  data: '2026-06-10',
  paginas: [{
    fundo: 'pautado',
    itens: [
      { t: 'texto', x: 60, y: 60, tam: 34, cor: '#1F3A5F', txt: 'Interpretação de texto: exercício de reforço' },
      tracoOndulado(60, 200, 860, 40, 3),
      tracoOndulado(60, 380, 700, 26, 5),
      { t: 'traco', cor: '#2E7D6B', pontos: [[100, 500, 2], [300, 520, 4], [500, 480, 6], [700, 540, 3]] },
      { t: 'traco', cor: '#C9A961', pontos: [[420, 700, 8]] }
    ]
  }, {
    fundo: 'pontilhado',
    itens: [
      { t: 'texto', x: 60, y: 60, tam: 30, cor: '#1A1C1F', txt: 'Segunda folha, fundo pontilhado.' },
      tracoOndulado(80, 300, 800, 60, 4)
    ]
  }]
}];

const bytes = PDFGen.gerarFechamento(fMarcelo, { incluirNotas: true, notas, imagens: {}, sempreResumo: true });
fs.writeFileSync(path.join(__dirname, 'saida_marcelo.pdf'), bytes);
conf('PDF gerado com bytes', bytes.length > 3000, true);
conf('PDF começa com %PDF', String.fromCharCode(...bytes.slice(0, 4)), '%PDF');

const bytesCecilia = PDFGen.gerarFechamento(fCecilia, { sempreResumo: true });
fs.writeFileSync(path.join(__dirname, 'saida_cecilia.pdf'), bytesCecilia);

const bytesMes = PDFGen.gerarResumoMes(Core.calcularMesInteiro(db, '2026-06'), 'Junho de 2026');
fs.writeFileSync(path.join(__dirname, 'saida_mes.pdf'), bytesMes);

// teste de estouro de página: 40 aulas
const dbGrande = { alunos: [marcelo], aulas: [], resumos: [{ alunoId: 'a1', mes: '2026-03', texto: 'Resumo longo. '.repeat(120) }] };
for (let d = 1; d <= 31; d++) {
  dbGrande.aulas.push({ id: 'g' + d, alunoId: 'a1', data: '2026-03-' + String(d).padStart(2, '0'), hora: '15:30', duracaoMin: 120, status: 'realizada' });
}
const fGrande = Core.calcularFechamento(dbGrande, 'a1', '2026-03');
conf('mês cheio: 31 linhas', fGrande.linhas.length, 31);
conf('mês cheio: total de horas', fGrande.totalHoras, '62:00');
conf('mês cheio: valor', Core.fmtMoeda(fGrande.totalValor), 'R$ 6.200,00');
fs.writeFileSync(path.join(__dirname, 'saida_mes_cheio.pdf'), PDFGen.gerarFechamento(fGrande, {}));

console.log('\n=== medição de texto ===');
conf('largura de "Nathália Wajsenzon" em 12pt bold > 100', PDFGen.medir('Nathália Wajsenzon', 12, true) > 100, true);
conf('acentuado tem largura da base', PDFGen.medir('á', 12, false), PDFGen.medir('a', 12, false));
conf('WinAnsi converte aspa curva', PDFGen.paraWinAnsi('“legal”').charCodeAt(0), 0x93);
conf('WinAnsi mantém á', PDFGen.paraWinAnsi('á').charCodeAt(0), 0xE1);
conf('WinAnsi mantém ç', PDFGen.paraWinAnsi('ç').charCodeAt(0), 0xE7);
conf('WinAnsi mantém ·', PDFGen.paraWinAnsi('·').charCodeAt(0), 0xB7);

console.log('\n' + (falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' TESTE(S) FALHARAM'));
process.exit(falhas === 0 ? 0 : 1);
