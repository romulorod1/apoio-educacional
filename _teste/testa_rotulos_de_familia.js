/* testa_rotulos_de_familia.js
 *
 * C6 (lente da pedagoga, P07): o que a família lê descreve o trabalho feito,
 * e não a condição da criança. Cada área com rótulo de família diferente do
 * dela aparece só com o de família em tudo que sai para fora: o fechamento em
 * texto, o PDF do fechamento, o cartão do mês e a proposta (dados e PDF).
 *
 * A varredura vale nos dois sentidos, porque uma busca que não enxerga parece
 * busca vazia: o rótulo de família TEM de estar lá (o instrumento vê), e o
 * interno não pode estar. Sem navegador. Dados fictícios.
 */
'use strict';
const Core = require('../core.js');
const PDFGen = require('../pdf.js');
const Cartao = require('../cartao.js');

let ok = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const passou = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (passou) ok++; else falhas++;
  console.log((passou ? '  OK    ' : '  FALHA ') + rotulo + (passou ? '' : '  [obtido: ' + JSON.stringify(obtido) + ' | esperado: ' + JSON.stringify(esperado) + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

function textoDoPdf(bytes) {
  const bruto = Buffer.from(bytes).toString('latin1');
  const rx = /\(((?:\\.|[^\\()])*)\)\s*Tj/g;
  const partes = [];
  let m;
  while ((m = rx.exec(bruto))) partes.push(m[1].replace(/\\([\\()])/g, '$1'));
  return partes.join(' ');
}

// as áreas com rótulo de família próprio, lidas do core, e não copiadas aqui
const TODAS = [];
Core.AREAS.forEach(g => g.itens.forEach(i => TODAS.push(i)));
const TROCADAS = TODAS.filter(i => i.familia && i.familia !== i.rotulo);

/* Saída que conta: a família TEM de ver cada rótulo de família, e não pode
 * ver nenhum rótulo interno das áreas trocadas. */
function varrer(nome, texto) {
  // sem distinguir maiúscula: a proposta põe o rótulo dentro de uma frase, com a inicial minúscula
  texto = texto.toLowerCase();
  const faltam = TROCADAS.filter(i => texto.indexOf(i.familia.toLowerCase()) < 0).map(i => i.familia);
  const internos = TROCADAS.filter(i => texto.indexOf(i.rotulo.toLowerCase()) >= 0).map(i => i.rotulo);
  conf(nome + ': todo rótulo de família aparece (o instrumento vê)', faltam, []);
  conf(nome + ': nenhum rótulo interno aparece', internos, []);
}

secao('0. As âncoras');
conf('há áreas com rótulo de família próprio', TROCADAS.length >= 6, true);
conf('a de ansiedade é "Preparação emocional para a prova"', Core.rotuloAreaFamilia('ansiedade'), 'Preparação emocional para a prova');
conf('na tela dela, o rótulo dela continua', Core.rotuloArea('ansiedade'), 'Ansiedade ou medo de prova');
conf('rótulo de família sem travessão', TODAS.filter(i => /[–—]/.test(i.familia || '')).length, 0);

// um mês com todas as áreas marcadas
const db = {
  alunos: [{ id: 'al1', nome: 'Aluno Alfa Teste', responsavel: 'Responsavel Alfa', ativo: true,
    precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 100 }] }],
  series: [], resumos: [{ alunoId: 'al1', mes: '2026-06', texto: 'Bom mês.' }],
  aulas: [{ id: 'a1', alunoId: 'al1', data: '2026-06-01', hora: '15:30', duracaoMin: 60,
    status: 'realizada', cobravel: true, serieId: null, destacada: false, anexos: [],
    areas: TODAS.map(i => i.id), temas: [] }],
  ajustes: {}
};
const f = Core.calcularFechamento(db, 'al1', '2026-06');

secao('1. O fechamento em texto');
varrer('texto', Core.markdownFechamento(f, { exibirTemasEAreas: true }));

secao('2. O PDF do fechamento');
varrer('PDF', textoDoPdf(PDFGen.gerarFechamento(f, { exibirTemasEAreas: true })));

secao('3. O cartão do mês');
const cartao = Cartao.montar(f, {});
varrer('cartão', JSON.stringify(cartao));

secao('4. A proposta, nos dados e no PDF');
const p = Core.preencherProposta({ ajustes: {} }, null);
p.aluno = 'Aluno Alfa Teste';
p.responsavel = 'Responsavel Alfa';
p.areas = TODAS.map(i => i.id);
const op = Core.dadosDaProposta(null, p);
varrer('proposta, dados', JSON.stringify(op));
varrer('proposta, PDF', textoDoPdf(PDFGen.gerarProposta(op)));

secao('5. As frases da tela dela, mais leves');
conf('"Dispersa com facilidade" saiu da lista', JSON.stringify(Core.MAPA || {}).indexOf('Dispersa com facilidade'), -1);
conf('"Depende de ajuda para começar" saiu da lista', JSON.stringify(Core.MAPA || {}).indexOf('Depende de ajuda para começar'), -1);
conf('e as novas estão lá', ['Perde o foco na tarefa longa', 'Precisa de impulso para começar']
  .every(r => JSON.stringify(Core.MAPA || {}).indexOf(r) >= 0), true);

console.log('\n' + ok + ' verificações passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
