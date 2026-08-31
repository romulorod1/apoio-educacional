/* Testes da recorrência: criação da série, escopos de edição e exclusão,
 * exceções individuais e materialização ao navegar no calendário. */
const Core = require('../core.js');

let falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (!ok) falhas++;
  console.log((ok ? 'OK   ' : 'FALHA') + ' | ' + rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado);
}

function baseNova() {
  return {
    alunos: [{
      id: 'a1', nome: 'Marcelo', ativo: true, cor: '#2E7D6B',
      precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 100 }]
    }],
    series: [], aulas: [], resumos: []
  };
}

function doAluno(db, mes) {
  return db.aulas.filter(a => a.alunoId === 'a1' && Core.mesDe(a.data) === mes)
    .sort((x, y) => x.data.localeCompare(y.data));
}

console.log('\n=== criação da série ===');
let db = baseNova();
const s = Core.criarSerie(db, {
  alunoId: 'a1', dias: [1, 3, 5], hora: '15:30', duracaoMin: 60,
  inicio: '2026-06-01', fim: '2026-06-30'
});
conf('série criada com id', !!s.id, true);
const junho = doAluno(db, '2026-06');
conf('ocorrências em junho', junho.length, 13);
conf('primeira ocorrência', junho[0].data, '2026-06-01');
conf('última ocorrência', junho[junho.length - 1].data, '2026-06-29');
conf('todas ligadas à série', junho.every(a => a.serieId === s.id), true);
conf('nenhuma destacada de início', junho.some(a => a.destacada), false);
conf('descrição da série', Core.descreveSerie(s), 'Toda segunda, quarta e sexta, às 15:30, até 30/06/2026');

console.log('\n=== não duplica ao materializar de novo ===');
Core.garantirSeriesAte(db, '2026-06');
conf('continua com 13 ocorrências', doAluno(db, '2026-06').length, 13);

console.log('\n=== escopo: somente esta ===');
db = baseNova();
Core.criarSerie(db, { alunoId: 'a1', dias: [1, 3, 5], hora: '15:30', duracaoMin: 60, inicio: '2026-06-01', fim: '2026-06-30' });
let lista = doAluno(db, '2026-06');
const alvo = lista.find(a => a.data === '2026-06-10');
conf('data do alvo', alvo.data, '2026-06-10');
Core.aplicarEdicaoAula(db, alvo.id, { duracaoMin: 90 }, 'esta');
lista = doAluno(db, '2026-06');
conf('só o alvo mudou', lista.filter(a => a.duracaoMin === 90).length, 1);
conf('alvo virou exceção', lista.find(a => a.data === '2026-06-10').destacada, true);
conf('demais seguem com 60', lista.filter(a => a.duracaoMin === 60).length, 12);

console.log('\n=== escopo: esta e as seguintes (respeita a exceção) ===');
Core.aplicarEdicaoAula(db, lista.find(a => a.data === '2026-06-15').id, { hora: '16:00' }, 'seguintes');
lista = doAluno(db, '2026-06');
conf('anteriores mantêm 15:30', lista.filter(a => a.data < '2026-06-15').every(a => a.hora === '15:30'), true);
conf('de 15/06 em diante às 16:00', lista.filter(a => a.data >= '2026-06-15').every(a => a.hora === '16:00'), true);
conf('exceção de 10/06 preservada', lista.find(a => a.data === '2026-06-10').duracaoMin, 90);

console.log('\n=== escopo: todas (não sobrescreve exceção) ===');
Core.aplicarEdicaoAula(db, lista[0].id, { duracaoMin: 120 }, 'todas');
lista = doAluno(db, '2026-06');
conf('exceção de 10/06 continua 90', lista.find(a => a.data === '2026-06-10').duracaoMin, 90);
conf('as outras 12 foram para 120', lista.filter(a => a.duracaoMin === 120).length, 12);

console.log('\n=== nota é sempre individual, nunca se propaga ===');
db = baseNova();
Core.criarSerie(db, { alunoId: 'a1', dias: [1], hora: '15:30', duracaoMin: 60, inicio: '2026-06-01', fim: '2026-06-30' });
lista = doAluno(db, '2026-06');
Core.aplicarEdicaoAula(db, lista[0].id, { notaTexto: 'Revisão de frações', duracaoMin: 90 }, 'todas');
lista = doAluno(db, '2026-06');
conf('duração propagou', lista.every(a => a.duracaoMin === 90), true);
conf('nota ficou só na primeira', lista.filter(a => a.notaTexto === 'Revisão de frações').length, 1);

console.log('\n=== exclusão por escopo ===');
db = baseNova();
Core.criarSerie(db, { alunoId: 'a1', dias: [1, 3, 5], hora: '15:30', duracaoMin: 60, inicio: '2026-06-01', fim: '2026-06-30' });
lista = doAluno(db, '2026-06');
Core.excluirAulas(db, lista.find(a => a.data === '2026-06-10').id, 'esta');
conf('sobraram 12', doAluno(db, '2026-06').length, 12);

lista = doAluno(db, '2026-06');
Core.excluirAulas(db, lista.find(a => a.data === '2026-06-22').id, 'seguintes');
lista = doAluno(db, '2026-06');
conf('removeu de 22/06 em diante', lista.every(a => a.data < '2026-06-22'), true);
conf('série teve o fim ajustado', db.series[0].fim, '2026-06-21');

Core.excluirAulas(db, lista[0].id, 'todas');
conf('nenhuma aula sobrou', doAluno(db, '2026-06').length, 0);
conf('série removida', db.series.length, 0);

console.log('\n=== mudar o padrão da recorrência ===');
db = baseNova();
const s2 = Core.criarSerie(db, { alunoId: 'a1', dias: [1, 3], hora: '14:00', duracaoMin: 60, inicio: '2026-06-01', fim: '2026-06-30' });
conf('segundas e quartas em junho', doAluno(db, '2026-06').length, 9);
// marca uma exceção antes de mudar o padrão
lista = doAluno(db, '2026-06');
Core.aplicarEdicaoAula(db, lista.find(a => a.data === '2026-06-03').id, { duracaoMin: 120 }, 'esta');
// a partir de 15/06 passa a ser terça e quinta
Core.editarSerie(db, s2.id, { dias: [2, 4] }, '2026-06-15');
lista = doAluno(db, '2026-06');
const antes = lista.filter(a => a.data < '2026-06-15');
const depois = lista.filter(a => a.data >= '2026-06-15');
conf('antes do corte mantém seg/qua', antes.every(a => [1, 3].indexOf(Core.diaSemana(a.data)) >= 0), true);
conf('exceção de 03/06 preservada', lista.find(a => a.data === '2026-06-03').duracaoMin, 120);
conf('depois do corte é ter/qui', depois.every(a => [2, 4].indexOf(Core.diaSemana(a.data)) >= 0), true);
conf('quantidade após o corte', depois.length, 5);

console.log('\n=== série sem fim se estende ao navegar ===');
db = baseNova();
Core.criarSerie(db, { alunoId: 'a1', dias: [1], hora: '15:30', duracaoMin: 60, inicio: '2026-06-01', fim: null });
conf('materializou 6 meses à frente', doAluno(db, '2026-11').length > 0, true);
conf('ainda não chegou em 2027-06', doAluno(db, '2027-06').length, 0);
Core.garantirSeriesAte(db, '2027-06');
conf('materializou até 2027-06 ao navegar', doAluno(db, '2027-06').length > 0, true);

console.log('\n=== série respeita o próprio fim ao navegar ===');
db = baseNova();
Core.criarSerie(db, { alunoId: 'a1', dias: [1], hora: '15:30', duracaoMin: 60, inicio: '2026-06-01', fim: '2026-07-31' });
Core.garantirSeriesAte(db, '2027-01');
conf('nada depois do fim', doAluno(db, '2026-08').length, 0);
conf('julho materializado', doAluno(db, '2026-07').length, 4);

console.log('\n=== fechamento com série e exceção ===');
db = baseNova();
Core.criarSerie(db, { alunoId: 'a1', dias: [1, 3, 5], hora: '15:30', duracaoMin: 60, inicio: '2026-06-01', fim: '2026-06-30' });
lista = doAluno(db, '2026-06');
// remove as três que não existem no fechamento real do Marcelo (03, 12, 29)
['2026-06-03', '2026-06-12', '2026-06-29'].forEach(d => {
  Core.excluirAulas(db, lista.find(a => a.data === d).id, 'esta');
});
// 10/06 foi de 1h30
lista = doAluno(db, '2026-06');
Core.aplicarEdicaoAula(db, lista.find(a => a.data === '2026-06-10').id, { duracaoMin: 90 }, 'esta');
const f = Core.calcularFechamento(db, 'a1', '2026-06');
conf('reproduz o fechamento real: encontros', f.linhas.length, 10);
conf('reproduz o fechamento real: horas', f.totalHoras, '10:30');
conf('reproduz o fechamento real: valor', Core.fmtMoeda(f.totalValor), 'R$ 1.050,00');

console.log('\n' + (falhas === 0 ? 'TODOS OS TESTES DE SÉRIE PASSARAM' : falhas + ' TESTE(S) FALHARAM'));
process.exit(falhas === 0 ? 0 : 1);
