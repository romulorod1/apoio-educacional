/* Recuperar aulas que já aconteceram antes do cadastro. */
const Core = require('../core.js');
let falhas = 0;
function conf(r, o, e) {
  const ok = String(o) === String(e);
  if (!ok) falhas++;
  console.log((ok ? 'OK   ' : 'FALHA') + ' | ' + r + ' | obtido: ' + o + ' | esperado: ' + e);
}
const doMes = (db, m) => db.aulas.filter(a => Core.mesDe(a.data) === m).sort((x, y) => x.data.localeCompare(y.data));
const baseNova = () => ({
  alunos: [{ id: 'a1', nome: 'Daniela', precos: [{ inicio: '2026-01-01', fim: null, valorHora: 140 }] }],
  series: [], aulas: [], resumos: []
});

console.log('\n=== aula avulsa: volta toda terça até agosto ===');
let db = baseNova();
db.aulas.push({ id: 'x1', alunoId: 'a1', serieId: null, destacada: false,
  data: '2026-09-01', hora: '16:00', duracaoMin: 90, status: 'realizada', cobravel: true, anexos: [] });

const previsao = Core.preverRetroativo(db, 'x1', [2], '2026-08-01');
conf('prevê quatro terças em agosto', previsao.length, 4);
conf('a mais antiga é 04/08', previsao[0], '2026-08-04');
conf('a mais recente é 25/08', previsao[previsao.length - 1], '2026-08-25');

const r = Core.repetirParaTras(db, 'x1', [2], '2026-08-01');
conf('criou as quatro', r.criadas, 4);
conf('agosto tem quatro aulas', doMes(db, '2026-08').length, 4);
conf('todas às 16:00', doMes(db, '2026-08').every(a => a.hora === '16:00'), true);
conf('todas de 1h30', doMes(db, '2026-08').every(a => a.duracaoMin === 90), true);
conf('a aula de origem não mudou', Core.achaAula(db, 'a1', '2026-09-01').id, 'x1');
conf('nada foi criado depois dela', doMes(db, '2026-09').length, 1);
conf('o fechamento de agosto fecha', Core.fmtMoeda(Core.calcularFechamento(db, 'a1', '2026-08').totalValor), 'R$ 840,00');

console.log('\n=== não duplica o que já existe ===');
const r2 = Core.repetirParaTras(db, 'x1', [2], '2026-08-01');
conf('nada de novo foi criado', r2.criadas, 0);
conf('agosto continua com quatro', doMes(db, '2026-08').length, 4);

console.log('\n=== vários dias da semana de uma vez ===');
db = baseNova();
db.aulas.push({ id: 'x2', alunoId: 'a1', serieId: null, destacada: false,
  data: '2026-09-02', hora: '14:00', duracaoMin: 60, status: 'realizada', cobravel: true, anexos: [] });
Core.repetirParaTras(db, 'x2', [1, 3], '2026-08-10');
const ago = doMes(db, '2026-08');
conf('só segundas e quartas', ago.every(a => [1, 3].includes(Core.diaSemana(a.data))), true);
conf('nada antes de 10/08', ago.every(a => a.data >= '2026-08-10'), true);
conf('quantidade correta', ago.length, 7);

console.log('\n=== aula de uma recorrência: o início é puxado para trás ===');
db = baseNova();
const s = Core.criarSerie(db, { alunoId: 'a1', dias: [2], hora: '16:00', duracaoMin: 60, inicio: '2026-09-01', fim: null });
const primeira = Core.achaAula(db, 'a1', '2026-09-01');
Core.achaAula(db, 'a1', '2026-09-08').notaTexto = 'Interpretação';
Core.repetirParaTras(db, primeira.id, [2], '2026-08-01');
conf('agosto ganhou as terças', doMes(db, '2026-08').length, 4);
conf('as novas pertencem à série', doMes(db, '2026-08').every(a => a.serieId === s.id), true);
conf('o início da série voltou', db.series[0].inicio, '2026-08-04');
conf('a folha de setembro seguiu intacta', Core.achaAula(db, 'a1', '2026-09-08').notaTexto, 'Interpretação');
Core.garantirSeriesAte(db, '2027-02');
conf('e nada duplicou ao navegar', doMes(db, '2026-08').length, 4);

console.log('\n=== limites ===');
db = baseNova();
db.aulas.push({ id: 'x3', alunoId: 'a1', serieId: null, destacada: false,
  data: '2026-09-01', hora: '16:00', duracaoMin: 60, status: 'realizada', cobravel: true, anexos: [] });
conf('data futura não cria nada', Core.repetirParaTras(db, 'x3', [2], '2026-10-01').criadas, 0);
conf('mesma data não cria nada', Core.repetirParaTras(db, 'x3', [2], '2026-09-01').criadas, 0);
conf('sem data não cria nada', Core.repetirParaTras(db, 'x3', [2], null).criadas, 0);
conf('aula inexistente não quebra', Core.repetirParaTras(db, 'nao-existe', [2], '2026-08-01').criadas, 0);
conf('sem dias escolhidos usa o dia da própria aula',
  Core.repetirParaTras(db, 'x3', [], '2026-08-25').criadas, 1);

console.log('\n' + (falhas === 0 ? 'TODOS OS TESTES DE RETROATIVO PASSARAM' : falhas + ' TESTE(S) FALHARAM'));
process.exit(falhas ? 1 : 0);
