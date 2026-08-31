/* Regressão: aula apagada de uma série não pode voltar sozinha
 * quando o calendário é aberto de novo. */
const Core = require('../core.js');
let falhas = 0;
function conf(r, o, e) {
  const ok = String(o) === String(e);
  if (!ok) falhas++;
  console.log((ok ? 'OK   ' : 'FALHA') + ' | ' + r + ' | obtido: ' + o + ' | esperado: ' + e);
}
function base() {
  return { alunos: [{ id: 'a1', nome: 'Marcelo', precos: [{ inicio: '2026-01-01', fim: null, valorHora: 100 }] }],
    series: [], aulas: [], resumos: [] };
}
const doMes = (db, m) => db.aulas.filter(a => Core.mesDe(a.data) === m);

console.log('\n=== aula apagada continua apagada depois de navegar ===');
let db = base();
Core.criarSerie(db, { alunoId: 'a1', dias: [1,3,5], hora: '15:30', duracaoMin: 60, inicio: '2026-06-01', fim: '2026-06-30' });
conf('junho começa com 13', doMes(db, '2026-06').length, 13);
['2026-06-03','2026-06-12','2026-06-29'].forEach(d => {
  Core.excluirAulas(db, Core.achaAula(db, 'a1', d).id, 'esta');
});
conf('ficaram 10', doMes(db, '2026-06').length, 10);
conf('as datas foram registradas como apagadas', db.series[0].exclusoes.length, 3);

Core.garantirSeriesAte(db, '2026-12');
conf('depois de navegar até dezembro, continuam 10', doMes(db, '2026-06').length, 10);
Core.garantirSeriesAte(db, '2027-06');
conf('e continuam 10 no ano seguinte', doMes(db, '2026-06').length, 10);
conf('03/06 não voltou', Core.achaAula(db, 'a1', '2026-06-03'), 'null');

console.log('\n=== o fechamento do Marcelo continua exato ===');
Core.aplicarEdicaoAula(db, Core.achaAula(db, 'a1', '2026-06-10').id, { duracaoMin: 90 }, 'esta');
Core.garantirSeriesAte(db, '2027-01');
let f = Core.calcularFechamento(db, 'a1', '2026-06');
conf('dez encontros', f.linhas.length, 10);
conf('10:30 de aula', f.totalHoras, '10:30');
conf('R$ 1.050,00', Core.fmtMoeda(f.totalValor), 'R$ 1.050,00');

console.log('\n=== exclusão em massa também é registrada ===');
db = base();
Core.criarSerie(db, { alunoId: 'a1', dias: [1], hora: '15:30', duracaoMin: 60, inicio: '2026-06-01', fim: '2026-08-31' });
const antes = doMes(db, '2026-07').length;
conf('julho tem segundas', antes > 0, true);
Core.excluirAulas(db, Core.achaAula(db, 'a1', '2026-07-06').id, 'esta');
Core.garantirSeriesAte(db, '2026-09');
conf('06/07 não voltou', Core.achaAula(db, 'a1', '2026-07-06'), 'null');

console.log('\n=== série sem fim: apagar uma não recria ao avançar ===');
db = base();
Core.criarSerie(db, { alunoId: 'a1', dias: [3], hora: '14:00', duracaoMin: 60, inicio: '2026-06-01', fim: null });
Core.excluirAulas(db, Core.achaAula(db, 'a1', '2026-06-10').id, 'esta');
Core.garantirSeriesAte(db, '2027-03');
conf('10/06 continua apagada', Core.achaAula(db, 'a1', '2026-06-10'), 'null');
conf('mas o futuro foi materializado', doMes(db, '2027-02').length > 0, true);

console.log('\n=== mudar o padrão limpa as exclusões futuras ===');
db = base();
const s = Core.criarSerie(db, { alunoId: 'a1', dias: [1,3], hora: '14:00', duracaoMin: 60, inicio: '2026-06-01', fim: '2026-06-30' });
Core.excluirAulas(db, Core.achaAula(db, 'a1', '2026-06-01').id, 'esta');
Core.excluirAulas(db, Core.achaAula(db, 'a1', '2026-06-24').id, 'esta');
conf('duas exclusões registradas', s.exclusoes.length, 2);
Core.editarSerie(db, s.id, { dias: [2,4] }, '2026-06-15');
conf('só a exclusão anterior ao corte sobrou', s.exclusoes.length, 1);
conf('e é a de 01/06', s.exclusoes[0], '2026-06-01');
conf('01/06 continua sem aula', Core.achaAula(db, 'a1', '2026-06-01'), 'null');

console.log('\n' + (falhas === 0 ? 'TODOS OS TESTES DE EXCLUSÃO PASSARAM' : falhas + ' TESTE(S) FALHARAM'));
process.exit(falhas ? 1 : 0);
