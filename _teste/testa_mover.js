/* Mover uma ocorrência de uma série, e antecipar o início da recorrência.
 *
 * Cenário de referência: a série começa em 01/09 (terça) e a primeira
 * ocorrência é movida para a primeira terça de agosto, 04/08. */
const Core = require('../core.js');

let falhas = 0;
function conf(r, o, e) {
  const ok = String(o) === String(e);
  if (!ok) falhas++;
  console.log((ok ? 'OK   ' : 'FALHA') + ' | ' + r + ' | obtido: ' + o + ' | esperado: ' + e);
}
const doMes = (db, m) => db.aulas.filter(a => Core.mesDe(a.data) === m).sort((x, y) => x.data.localeCompare(y.data));
const baseNova = () => ({
  alunos: [{ id: 'a1', nome: 'Miguel', precos: [{ inicio: '2026-01-01', fim: null, valorHora: 130 }] }],
  series: [], aulas: [], resumos: []
});

console.log('01/09/2026 é', Core.DIAS_LONGO[Core.diaSemana('2026-09-01')]);
console.log('04/08/2026 é', Core.DIAS_LONGO[Core.diaSemana('2026-08-04')]);

// ======================= mover uma ocorrência =======================

const db = baseNova();
Core.criarSerie(db, { alunoId: 'a1', dias: [2], hora: '16:00', duracaoMin: 60, inicio: '2026-09-01', fim: null });

console.log('\n=== antes de mover ===');
conf('agosto está vazio', doMes(db, '2026-08').length, 0);
conf('setembro tem as cinco terças', doMes(db, '2026-09').length, 5);
conf('outubro também foi criado', doMes(db, '2026-10').length > 0, true);

const idPrimeira = Core.achaAula(db, 'a1', '2026-09-01').id;
const idSegunda = Core.achaAula(db, 'a1', '2026-09-08').id;
Core.achaAula(db, 'a1', '2026-09-01').notaTexto = 'Diagnóstico inicial';
Core.achaAula(db, 'a1', '2026-09-08').notaTexto = 'Frações';

console.log('\n=== move a primeira ocorrência de 01/09 para 04/08 ===');
Core.aplicarEdicaoAula(db, idPrimeira, { data: '2026-08-04' }, 'esta');

conf('a aula apareceu em agosto', doMes(db, '2026-08').length, 1);
conf('e é o dia 04/08', doMes(db, '2026-08')[0].data, '2026-08-04');
conf('ela virou exceção', doMes(db, '2026-08')[0].destacada, true);
conf('é a mesma aula, com o mesmo id', doMes(db, '2026-08')[0].id, idPrimeira);
conf('a folha dela foi junto', doMes(db, '2026-08')[0].notaTexto, 'Diagnóstico inicial');
conf('setembro ficou com quatro', doMes(db, '2026-09').length, 4);
conf('01/09 não tem mais aula', Core.achaAula(db, 'a1', '2026-09-01'), 'null');
conf('a folha de 08/09 não foi tocada', Core.achaAula(db, 'a1', '2026-09-08').notaTexto, 'Frações');
conf('e continua sendo a mesma aula', Core.achaAula(db, 'a1', '2026-09-08').id, idSegunda);

console.log('\n=== a recorrência continua viva ===');
conf('a série ainda existe', db.series.length, 1);
conf('o início da série não mudou', db.series[0].inicio, '2026-09-01');
conf('a recorrência segue para frente', doMes(db, '2026-11').length > 0, true);

console.log('\n=== e ao navegar de novo, nada se duplica ===');
Core.garantirSeriesAte(db, '2027-03');
conf('agosto continua com uma só', doMes(db, '2026-08').length, 1);
conf('01/09 continua sem aula', Core.achaAula(db, 'a1', '2026-09-01'), 'null');
conf('setembro continua com quatro', doMes(db, '2026-09').length, 4);
conf('as folhas seguem intactas', Core.achaAula(db, 'a1', '2026-09-08').notaTexto, 'Frações');

console.log('\n=== agosto não ganha as outras terças sozinho ===');
conf('11/08 não existe', Core.achaAula(db, 'a1', '2026-08-11'), 'null');
conf('25/08 não existe', Core.achaAula(db, 'a1', '2026-08-25'), 'null');

console.log('\n=== fechamentos ===');
conf('agosto cobra uma aula', Core.fmtMoeda(Core.calcularFechamento(db, 'a1', '2026-08').totalValor), 'R$ 130,00');
conf('setembro cobra quatro', Core.fmtMoeda(Core.calcularFechamento(db, 'a1', '2026-09').totalValor), 'R$ 520,00');

// ======================= antecipar o início =======================

console.log('\n=== antecipar o início da repetição para agosto ===');
const db2 = baseNova();
const s2 = Core.criarSerie(db2, { alunoId: 'a1', dias: [2], hora: '16:00', duracaoMin: 60, inicio: '2026-09-01', fim: null });
const qtdSetembro = doMes(db2, '2026-09').length;
Core.achaAula(db2, 'a1', '2026-09-08').notaTexto = 'Frações';

Core.editarSerie(db2, s2.id, { inicio: '2026-08-04' }, '2026-08-04');

conf('agosto ganhou as terças', doMes(db2, '2026-08').length, 4);
conf('começando em 04/08', doMes(db2, '2026-08')[0].data, '2026-08-04');
conf('setembro continua inteiro', doMes(db2, '2026-09').length, qtdSetembro);
conf('a folha de setembro sobreviveu', Core.achaAula(db2, 'a1', '2026-09-08').notaTexto, 'Frações');
conf('o início da série mudou', db2.series[0].inicio, '2026-08-04');
Core.garantirSeriesAte(db2, '2027-02');
conf('e nada duplicou ao navegar', doMes(db2, '2026-08').length, 4);
conf('setembro segue igual', doMes(db2, '2026-09').length, qtdSetembro);

console.log('\n=== mudar dias e horário a partir de uma data ===');
const db3 = baseNova();
const s3 = Core.criarSerie(db3, { alunoId: 'a1', dias: [2], hora: '16:00', duracaoMin: 60, inicio: '2026-09-01', fim: '2026-10-31' });
Core.achaAula(db3, 'a1', '2026-09-01').notaTexto = 'Aula um';
Core.editarSerie(db3, s3.id, { dias: [1, 4], hora: '17:00' }, '2026-10-01');
conf('setembro preservado', doMes(db3, '2026-09').every(a => Core.diaSemana(a.data) === 2), true);
conf('a folha de setembro sobreviveu', Core.achaAula(db3, 'a1', '2026-09-01').notaTexto, 'Aula um');
conf('outubro virou segunda e quinta', doMes(db3, '2026-10').every(a => [1, 4].includes(Core.diaSemana(a.data))), true);
conf('e no horário novo', doMes(db3, '2026-10').every(a => a.hora === '17:00'), true);

console.log('\n=== aula com folha escrita nunca é descartada ===');
const db4 = baseNova();
const s4 = Core.criarSerie(db4, { alunoId: 'a1', dias: [2], hora: '16:00', duracaoMin: 60, inicio: '2026-09-01', fim: '2026-09-30' });
const quinze = Core.achaAula(db4, 'a1', '2026-09-15');
quinze.temNota = true;
const idQuinze = quinze.id;
// o padrão muda para quintas, então a terça 15/09 sai do padrão
Core.editarSerie(db4, s4.id, { dias: [4] }, '2026-09-01');
conf('a aula com folha continua existindo', !!Core.achaAula(db4, 'a1', '2026-09-15'), true);
conf('com o mesmo registro, então a folha segue ligada', Core.achaAula(db4, 'a1', '2026-09-15').id, idQuinze);
conf('e virou exceção', Core.achaAula(db4, 'a1', '2026-09-15').destacada, true);
conf('as terças vazias saíram', Core.achaAula(db4, 'a1', '2026-09-08'), 'null');
conf('as quintas entraram', doMes(db4, '2026-09').filter(a => Core.diaSemana(a.data) === 4).length, 4);

console.log('\n' + (falhas === 0 ? 'TODOS OS TESTES DE MOVER E EDITAR SÉRIE PASSARAM' : falhas + ' TESTE(S) FALHARAM'));
process.exit(falhas ? 1 : 0);
