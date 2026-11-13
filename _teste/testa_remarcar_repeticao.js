/* testa_remarcar_repeticao.js
 *
 * Remarcar uma aula de repetição para um dia da PRÓPRIA série não pode apagar
 * a aula fixa daquele dia. Sem navegador; só o core.js, num banco sintético.
 *
 * O defeito (12/11/2026, lente da IA): a quinta 26/11 vai para a quinta 03/12,
 * com dezembro ainda não lançado. A aula movida leva o serieId para o 03/12, e
 * no lançamento de dezembro a série achava "já tenho aula no dia 03" e não
 * criava a fixa: ela sumia calada, e o fechamento de dezembro dava 1080 em vez
 * de 1200. A mesma raiz tinha mais duas portas: remarcar DE NOVO a aula que já
 * tinha vindo de outro dia, e apagá-la, punham o dia em que ela estava nas
 * exclusões da série, e a fixa daquele dia nunca era criada.
 *
 *   node _teste/testa_remarcar_repeticao.js
 *   node _teste/testa_remarcar_repeticao.js --envenenado-regra-antiga
 *        a regra de antes (qualquer aula da série no dia ocupa a vaga, e toda
 *        saída exclui o dia) no lugar da nova: os casos do defeito TÊM de sair
 *        errados, e os de "sem mudança" iguais ("VENENO visto").
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const MODOS = ['--envenenado-regra-antiga'];
const desconhecidos = process.argv.slice(2).filter(a => MODOS.indexOf(a) < 0);
const VENENO = process.argv.indexOf('--envenenado-regra-antiga') >= 0;

let caminhoCore = path.join(__dirname, '..', 'core.js');
let tmp = null;
if (VENENO) {
  const fonte = fs.readFileSync(caminhoCore, 'utf8');
  const marca = 'function ehOcorrenciaOriginal(a, serie, iso) {';
  if (fonte.indexOf(marca) < 0) throw new Error('o veneno não achou a regra nova no core.js');
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'remarcar_'));
  caminhoCore = path.join(tmp, 'core.js');
  fs.writeFileSync(caminhoCore, fonte.replace(marca, marca + ' return true;'));
}
const Core = require(caminhoCore);

let passes = 0, falhas = 0;
const resultados = {};
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  resultados[rotulo] = ok;
  if (!VENENO) {
    if (ok) passes++; else falhas++;
    console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
  }
}

const HOJE = '2026-11-16';
/* Marina, segunda e quinta às 15h30, R$ 120 a hora; lançada até novembro.
 * Dezembro de 2026 tem 4 segundas (7, 14, 21, 28) e 5 quintas (3, 10, 17, 24,
 * 31): 9 aulas fixas, R$ 1080. Com a aula vinda de 26/11, 10 aulas, R$ 1200. */
function banco() {
  const db = { versao: 1, ajustes: {}, alunos: [
    { id: 'mar', nome: 'Marina Sintética', ativo: true, precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 120 }] }
  ], series: [
    { id: 's1', alunoId: 'mar', dias: [1, 4], hora: '15:30', duracaoMin: 60, inicio: '2026-10-01', fim: null, exclusoes: [], materializadoAte: null, status: 'realizada' }
  ], aulas: [], resumos: [], pagamentos: [] };
  Core.garantirSeriesAte(db, '2026-11');
  return db;
}
const doDia = (db, d) => db.aulas.filter(a => a.alunoId === 'mar' && a.data === d).map(a => a.hora).sort().join(' ');
const totalDez = db => Core.calcularFechamento(db, 'mar', '2026-12', HOJE).totalValor;
const mover = (db, id, data, hora) => Core.aplicarEdicaoAula(db, id, { data, hora: hora || '17:00', duracaoMin: 60 }, 'esta');
const ids = db => db.aulas.map(a => a.id);
const semIdRepetido = db => new Set(ids(db)).size === db.aulas.length;

if (desconhecidos.length) { console.log('opção desconhecida: ' + desconhecidos.join(' ')); process.exit(2); }
console.log('\n=== 1. O defeito: remarcar para um dia da própria série, em mês não lançado ===');
let db = banco();
mover(db, 's1@2026-11-26', '2026-12-03');
conf('A1: antes de lançar, o 03/12 ainda conta a fixa como prevista', Core.ocorrenciasPrevistasDoDia(db, '2026-12-03').length, 1);
Core.garantirSeriesAte(db, '2026-12');
conf('A1: lançado dezembro, o 03/12 tem a fixa E a remarcada', doDia(db, '2026-12-03'), '15:30 17:00');
conf('A1: o fechamento de dezembro dá 1200', totalDez(db), 1200);
conf('A1: a origem ficou gravada na aula', db.aulas.find(a => a.id === 's1@2026-11-26').dataOriginal, '2026-11-26');
let ctl = banco(); Core.garantirSeriesAte(ctl, '2026-12'); mover(ctl, 's1@2026-11-26', '2026-12-03');
conf('A1: igual ao controle com dezembro lançado antes (1200)', totalDez(ctl), 1200);

console.log('\n=== 2. As outras portas da mesma raiz ===');
db = banco();
mover(db, 's1@2026-11-26', '2026-12-03'); mover(db, 's1@2026-11-26', '2026-12-10', '18:00');
conf('remarcar de novo: o dia de passagem (03/12) não entra nas exclusões', db.series[0].exclusoes.indexOf('2026-12-03') < 0, true);
Core.garantirSeriesAte(db, '2026-12');
conf('remarcar de novo: o 03/12 tem a fixa', doDia(db, '2026-12-03'), '15:30');
conf('remarcar de novo: o 10/12 tem a fixa e a remarcada', doDia(db, '2026-12-10'), '15:30 18:00');
conf('remarcar de novo: dezembro dá 1200', totalDez(db), 1200);
db = banco();
mover(db, 's1@2026-11-26', '2026-12-03');
Core.excluirAulas(db, 's1@2026-11-26', 'esta');
conf('apagar a remarcada: o 03/12 não entra nas exclusões', db.series[0].exclusoes.indexOf('2026-12-03') < 0, true);
Core.garantirSeriesAte(db, '2026-12');
conf('apagar a remarcada: a fixa do 03/12 aparece, e dezembro dá 1080', doDia(db, '2026-12-03') + ' / ' + totalDez(db), '15:30 / 1080');
conf('apagar a remarcada: o 26/11 continua excluído (não ressuscita)', doDia(db, '2026-11-26'), '');

console.log('\n=== 3. Sem mudança onde não havia defeito ===');
db = banco();
mover(db, 's1@2026-11-26', '2026-12-02');
Core.garantirSeriesAte(db, '2026-12');
conf('dia que não é da série (quarta 02/12): a remarcada lá e o 03/12 com a fixa', doDia(db, '2026-12-02') + ' / ' + doDia(db, '2026-12-03'), '17:00 / 15:30');
conf('dia que não é da série: dezembro dá 1200', totalDez(db), 1200);
const n1 = db.aulas.length;
Core.garantirSeriesAte(db, '2026-12'); Core.garantirSeriesAte(db, '2026-12');
conf('lançar dezembro duas vezes: nada a mais', db.aulas.length, n1);
db = banco(); mover(db, 's1@2026-11-26', '2026-12-03'); Core.garantirSeriesAte(db, '2026-12');
const n2 = db.aulas.length; Core.garantirSeriesAte(db, '2026-12');
conf('lançar de novo depois do A1: nada a mais, sem id repetido', db.aulas.length === n2 && semIdRepetido(db), true);
db = banco(); Core.garantirSeriesAte(db, '2026-12');
const antes = JSON.stringify(db.aulas.map(a => [a.id, a.data, a.hora]));
Core.garantirSeriesAte(db, '2026-12');
conf('mês já lançado, sem remarcação: lançar de novo não muda nada', JSON.stringify(db.aulas.map(a => [a.id, a.data, a.hora])), antes);
mover(db, 's1@2026-11-26', '2026-12-03'); Core.garantirSeriesAte(db, '2026-12');
conf('mês já lançado: remarcar para lá deixa a fixa e a remarcada, 1200', doDia(db, '2026-12-03') + ' / ' + totalDez(db), '15:30 17:00 / 1200');
conf('mês já lançado: o 26/11 de origem foi excluído', db.series[0].exclusoes.indexOf('2026-11-26') >= 0, true);
// Outro aparelho já lançou dezembro (ids determinísticos), mas este ainda tem o
// materializadoAte antigo: lançar aqui não duplica.
db = banco(); const outro = banco(); Core.garantirSeriesAte(outro, '2026-12');
outro.aulas.filter(a => a.data >= '2026-12').forEach(a => db.aulas.push(JSON.parse(JSON.stringify(a))));
Core.garantirSeriesAte(db, '2026-12');
conf('dezembro lançado por outro aparelho: lançar aqui não duplica', db.aulas.filter(a => a.data >= '2026-12').length + ' ' + semIdRepetido(db), '9 true');

console.log('\n=== 4. Aulas de antes do N1 (id aleatório, sem data de origem) ===');
// Remarcada antes do N1 para um mês ainda não lançado: na dúvida, a fixa aparece.
db = banco();
db.aulas.push({ id: 'xantiga123', alunoId: 'mar', serieId: 's1', destacada: true, data: '2026-12-03', hora: '17:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', nota: null, anexos: [] });
conf('antiga remarcada para mês não lançado: o 03/12 ainda prevê a fixa', Core.ocorrenciasPrevistasDoDia(db, '2026-12-03').length, 1);
Core.garantirSeriesAte(db, '2026-12');
conf('antiga remarcada para mês não lançado: lançado, a fixa aparece (nunca some calada)', doDia(db, '2026-12-03'), '15:30 17:00');
// Original antiga num mês LANÇADO: apagar e remarcar continuam excluindo o dia.
db = banco();
db.aulas.forEach(a => { if (a.data >= '2026-11') a.id = 'x' + a.data.replace(/-/g, ''); });
Core.excluirAulas(db, 'x20261119', 'esta');
mover(db, 'x20261112', '2026-11-13');
Core.garantirSeriesAte(db, '2026-11');
conf('antiga apagada num mês lançado: não ressuscita', doDia(db, '2026-11-19'), '');
conf('antiga remarcada num mês lançado: o dia de origem não ganha outra aula', doDia(db, '2026-11-12'), '');
conf('antiga remarcada: a origem ficou gravada', db.aulas.find(a => a.id === 'x20261112').dataOriginal, '2026-11-12');

if (VENENO) {
  // A regra antiga TEM de errar onde estava o defeito, e acertar onde não havia.
  const deviaErrar = ['A1: antes de lançar, o 03/12 ainda conta a fixa como prevista',
    'A1: lançado dezembro, o 03/12 tem a fixa E a remarcada', 'A1: o fechamento de dezembro dá 1200',
    'remarcar de novo: o 03/12 tem a fixa', 'apagar a remarcada: a fixa do 03/12 aparece, e dezembro dá 1080',
    'antiga remarcada para mês não lançado: lançado, a fixa aparece (nunca some calada)'];
  const deviaAcertar = ['A1: igual ao controle com dezembro lançado antes (1200)', 'dia que não é da série: dezembro dá 1200',
    'lançar dezembro duas vezes: nada a mais', 'mês já lançado, sem remarcação: lançar de novo não muda nada',
    'mês já lançado: remarcar para lá deixa a fixa e a remarcada, 1200', 'dezembro lançado por outro aparelho: lançar aqui não duplica',
    'antiga apagada num mês lançado: não ressuscita'];
  const vf = (r, ok) => { if (ok) passes++; else falhas++; console.log((ok ? '  OK   ' : '  FALHA') + ' ' + r); };
  deviaErrar.forEach(r => vf('VENENO visto: com a regra antiga, "' + r + '" sai errado', resultados[r] === false));
  deviaAcertar.forEach(r => vf('com a regra antiga, "' + r + '" segue certo (não havia defeito ali)', resultados[r] === true));
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
