/* testa_remarcar_repeticao.js
 *
 * Remarcar uma aula de repetição para um dia da PRÓPRIA série não pode apagar
 * a aula fixa daquele dia, e o conserto não pode criar aula a mais. Os dois
 * lados do dinheiro: FALTA (a fixa some) e SOBRA (o mês dobra). Sem navegador;
 * só o core.js, num banco sintético.
 *
 * O defeito (12/11/2026, lente da IA): a quinta 26/11 vai para a quinta 03/12,
 * com dezembro ainda não lançado. A aula movida leva o serieId para o 03/12, e
 * no lançamento de dezembro a série achava "já tenho aula no dia 03" e não
 * criava a fixa: ela sumia calada, e o fechamento de dezembro dava 1080 em vez
 * de 1200. A mesma raiz tinha mais duas portas: remarcar DE NOVO a aula que já
 * tinha vindo de outro dia, e apagá-la, punham o dia em que ela estava nas
 * exclusões da série, e a fixa daquele dia nunca era criada.
 *
 * A revisão da primeira versão (13/11) achou o lado da SOBRA: com ids
 * aleatórios (quase todo o dado real é de antes do N1, 08/11) e o mês relançado
 * pelo editarSerie (ou materializadoAte nulo ou recuado), o mês inteiro dobrava,
 * dezembro com 18 aulas, R$ 2.160. As seções 5 e 6 cobrem esse lado.
 *
 *   node _teste/testa_remarcar_repeticao.js                 a prova
 *   ... --envenenado-regra-antiga        a regra de antes (qualquer aula da série
 *        no dia é a original): o lado da FALTA tem de sair errado
 *   ... --envenenado-nunca-original      nenhuma aula é a original: o lado da
 *        SOBRA tem de sair errado (o dia apagado volta)
 *   ... --envenenado-lancado-so-pelo-campo  o "mês já lançado" só pelo
 *        materializadoAte, sem olhar o dado: com o campo nulo, a aula antiga
 *        que só mudou de horário ganha uma gêmea
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const VENENOS = {
  '--envenenado-regra-antiga': ['function ehOcorrenciaOriginal(a, iso, lancado) {', 'function ehOcorrenciaOriginal(a, iso, lancado) { return true;'],
  '--envenenado-nunca-original': ['function ehOcorrenciaOriginal(a, iso, lancado) {', 'function ehOcorrenciaOriginal(a, iso, lancado) { return false;'],
  '--envenenado-lancado-so-pelo-campo': ['if (serie.materializadoAte && mesIso <= serie.materializadoAte) return true;',
    'return !!(serie.materializadoAte && mesIso <= serie.materializadoAte);']
};
const pedidos = process.argv.slice(2);
const desconhecidos = pedidos.filter(a => !VENENOS[a]);
const VENENO = pedidos.find(a => VENENOS[a]) || null;

let caminhoCore = path.join(__dirname, '..', 'core.js');
let tmp = null;
if (VENENO) {
  const fonte = fs.readFileSync(caminhoCore, 'utf8');
  const [de, para] = VENENOS[VENENO];
  if (fonte.split(de).length !== 2) throw new Error('o veneno ' + VENENO + ' não achou (uma vez só) o trecho no core.js');
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'remarcar_'));
  caminhoCore = path.join(tmp, 'core.js');
  fs.writeFileSync(caminhoCore, fonte.replace(de, para));
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
function banco(ate) {
  const db = { versao: 1, ajustes: {}, alunos: [
    { id: 'mar', nome: 'Marina Sintética', ativo: true, precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 120 }] }
  ], series: [
    { id: 's1', alunoId: 'mar', dias: [1, 4], hora: '15:30', duracaoMin: 60, inicio: '2026-10-01', fim: null, exclusoes: [], materializadoAte: null, status: 'realizada' }
  ], aulas: [], resumos: [], pagamentos: [] };
  Core.garantirSeriesAte(db, ate || '2026-11');
  return db;
}
/* O dado de antes do N1: os mesmos meses, com ids aleatórios. */
function bancoAntigo(ate) {
  const db = banco(ate);
  let i = 0;
  db.aulas.forEach(a => { a.id = 'xrnd' + (i++) + 'k9'; });
  return db;
}
const doDia = (db, d) => db.aulas.filter(a => a.alunoId === 'mar' && a.data === d).map(a => a.hora).sort().join(' ');
const totalDez = db => Core.calcularFechamento(db, 'mar', '2026-12', HOJE).totalValor;
const mover = (db, id, data, hora) => Core.aplicarEdicaoAula(db, id, { data, hora: hora || '17:00', duracaoMin: 60 }, 'esta');
const ids = db => db.aulas.map(a => a.id);
const semIdRepetido = db => new Set(ids(db)).size === db.aulas.length;
const datasRepetidas = db => {
  const por = {};
  db.aulas.forEach(a => { const k = a.data + ' ' + a.hora; por[k] = (por[k] || 0) + 1; });
  return Object.keys(por).filter(k => por[k] > 1).join(',') || 'nenhuma';
};

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
db = banco(); const outro = banco(); Core.garantirSeriesAte(outro, '2026-12');
outro.aulas.filter(a => a.data >= '2026-12').forEach(a => db.aulas.push(JSON.parse(JSON.stringify(a))));
Core.garantirSeriesAte(db, '2026-12');
conf('dezembro lançado por outro aparelho: lançar aqui não duplica', db.aulas.filter(a => a.data >= '2026-12').length + ' ' + semIdRepetido(db), '9 true');

console.log('\n=== 4. Aulas de antes do N1 (id aleatório, sem data de origem) ===');
db = banco();
db.aulas.push({ id: 'xantiga123', alunoId: 'mar', serieId: 's1', destacada: true, data: '2026-12-03', hora: '17:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', nota: null, anexos: [] });
conf('antiga remarcada para mês não lançado: o 03/12 ainda prevê a fixa', Core.ocorrenciasPrevistasDoDia(db, '2026-12-03').length, 1);
Core.garantirSeriesAte(db, '2026-12');
conf('antiga remarcada para mês não lançado: lançado, a fixa aparece (nunca some calada)', doDia(db, '2026-12-03'), '15:30 17:00');
db = bancoAntigo();
const idDe = d => db.aulas.find(a => a.data === d).id;
const id19 = idDe('2026-11-19'), id12 = idDe('2026-11-12');
Core.excluirAulas(db, id19, 'esta');
mover(db, id12, '2026-11-13');
Core.garantirSeriesAte(db, '2026-11');
conf('antiga apagada num mês lançado: não ressuscita', doDia(db, '2026-11-19'), '');
conf('antiga remarcada num mês lançado: o dia de origem não ganha outra aula', doDia(db, '2026-11-12'), '');
conf('antiga nunca destacada, remarcada: a origem conhecida fica gravada', db.aulas.find(a => a.id === id12).dataOriginal, '2026-11-12');
// A antiga que o app de antes JÁ tinha remarcado (destacada, id aleatório):
// o dia em que ela está é de passagem, e não vira "origem".
db = bancoAntigo('2026-12');
const passagem = db.aulas.find(a => a.data === '2026-12-02' || a.data === '2026-12-03');
passagem.destacada = true; passagem.data = '2026-12-02';
mover(db, passagem.id, '2026-12-09');
conf('antiga já remarcada antes, remarcada de novo: não grava o dia de passagem como origem', passagem.dataOriginal === undefined, true);

console.log('\n=== 5. O lado da SOBRA: dado antigo com o mês relançado ===');
// materializadoAte nulo com novembro e dezembro já materializados em ids aleatórios
db = bancoAntigo('2026-12'); db.series[0].materializadoAte = null;
Core.garantirSeriesAte(db, '2026-12');
conf('id aleatório, materializadoAte nulo: nenhuma data repetida', datasRepetidas(db), 'nenhuma');
conf('id aleatório, materializadoAte nulo: dezembro segue 1080', totalDez(db), 1080);
// a aula antiga que só mudou de horário (destacada, sem sair do dia)
db = bancoAntigo('2026-12');
db.aulas.filter(a => a.data.slice(0, 7) === '2026-12').forEach(a => { a.destacada = true; });
db.aulas.find(a => a.data === '2026-12-10').hora = '16:00';
db.aulas.find(a => a.data === '2026-12-14').destacada = false;
db.series[0].materializadoAte = '2026-11';
Core.garantirSeriesAte(db, '2026-12');
conf('antiga só com horário mudado, campo recuado: o mês lançado não ganha gêmeas', datasRepetidas(db) + ' / ' + totalDez(db), 'nenhuma / 1080');
db = bancoAntigo('2026-12'); db.series[0].materializadoAte = '2026-10';
Core.garantirSeriesAte(db, '2026-12');
conf('id aleatório, materializadoAte recuado para outubro: nenhuma data repetida, 1080', datasRepetidas(db) + ' / ' + totalDez(db), 'nenhuma / 1080');

console.log('\n=== 6. O lado da SOBRA: editarSerie sobre dado antigo ===');
// o cenário do exp194.js da lente: hora nova a partir de 20/11, ids aleatórios
db = bancoAntigo('2026-12');
const dezAntes = totalDez(db), nAntes = db.aulas.length;
Core.editarSerie(db, 's1', { hora: '16:00' }, '2026-11-20');
const porData = {}; db.aulas.forEach(a => { porData[a.data] = (porData[a.data] || 0) + 1; });
conf('editarSerie com ids aleatórios: nenhuma data repetida', Object.keys(porData).filter(k => porData[k] > 1).join(',') || 'nenhuma', 'nenhuma');
conf('editarSerie com ids aleatórios: dezembro igual ao de antes da edição (' + dezAntes + ')', totalDez(db), dezAntes);
conf('editarSerie com ids aleatórios: as de antes do corte ficam, as de depois seguem a hora nova',
  db.aulas.filter(a => a.data < '2026-11-20' && a.hora === '15:30').length > 0 && db.aulas.filter(a => a.data >= '2026-11-20' && a.data <= '2026-12-31').every(a => a.hora === '16:00'), true);
conf('editarSerie com ids aleatórios: não perde aula do que já estava lançado', db.aulas.filter(a => a.data <= '2026-12-31').length, nAntes);

if (VENENO) {
  const ESPERADO = {
    '--envenenado-regra-antiga': {
      erra: ['A1: antes de lançar, o 03/12 ainda conta a fixa como prevista', 'A1: lançado dezembro, o 03/12 tem a fixa E a remarcada',
        'A1: o fechamento de dezembro dá 1200', 'remarcar de novo: o 03/12 tem a fixa',
        'apagar a remarcada: a fixa do 03/12 aparece, e dezembro dá 1080',
        'antiga remarcada para mês não lançado: lançado, a fixa aparece (nunca some calada)'],
      acerta: ['A1: igual ao controle com dezembro lançado antes (1200)', 'dia que não é da série: dezembro dá 1200',
        'lançar dezembro duas vezes: nada a mais', 'mês já lançado, sem remarcação: lançar de novo não muda nada',
        'dezembro lançado por outro aparelho: lançar aqui não duplica', 'antiga apagada num mês lançado: não ressuscita',
        'id aleatório, materializadoAte nulo: nenhuma data repetida', 'editarSerie com ids aleatórios: nenhuma data repetida']
    },
    '--envenenado-nunca-original': {
      erra: ['antiga apagada num mês lançado: não ressuscita', 'antiga remarcada num mês lançado: o dia de origem não ganha outra aula',
        'apagar a remarcada: o 26/11 continua excluído (não ressuscita)'],
      acerta: ['A1: lançado dezembro, o 03/12 tem a fixa E a remarcada', 'lançar dezembro duas vezes: nada a mais']
    },
    '--envenenado-lancado-so-pelo-campo': {
      erra: ['antiga só com horário mudado, campo recuado: o mês lançado não ganha gêmeas'],
      acerta: ['A1: o fechamento de dezembro dá 1200', 'id aleatório, materializadoAte nulo: nenhuma data repetida',
        'editarSerie com ids aleatórios: nenhuma data repetida']
    }
  }[VENENO];
  const vf = (r, ok) => { if (ok) passes++; else falhas++; console.log((ok ? '  OK   ' : '  FALHA') + ' ' + r); };
  [...ESPERADO.erra, ...ESPERADO.acerta].forEach(r => { if (!(r in resultados)) vf('o caso "' + r + '" existe na prova', false); });
  ESPERADO.erra.forEach(r => vf('VENENO visto (' + VENENO + '): "' + r + '" sai errado', resultados[r] === false));
  ESPERADO.acerta.forEach(r => vf('com ' + VENENO + ', "' + r + '" segue certo (o veneno é deste lado só)', resultados[r] === true));
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
