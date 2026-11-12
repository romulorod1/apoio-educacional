/* testa_vagos_repeticao.js
 *
 * Os horários vagos do celular (F3) e o choque do formulário dele contam a
 * aula de repetição que ainda não virou aula. A série só vira aula até
 * `materializadoAte`, e o celular nunca chama garantirSeriesAte: sem esta
 * regra, uma série de segunda às 15:00 materializada até novembro deixava
 * 15:00 livre na semana de 07/12, e o horário ia para a mensagem às famílias.
 *
 * Prova os dois lados da regra (Core.ocorrenciasPrevistasDoDia e
 * Core.conflitosComRepeticoes):
 *   ocupa:     série ativa além do horizonte; série sem materializadoAte;
 *   não ocupa: série encerrada (fim), série cancelada, data excluída ou
 *              remarcada (exclusoes), antes do início, outro dia da semana,
 *              mês já materializado (lá vale db.aulas), data que já tem aula
 *              da série;
 *   e NADA é gravado: o db sai idêntico.
 * Também a frase da mensagem: a preposição por dia ("no sábado", "na
 * segunda") e os inícios contínuos agrupados em faixas.
 *
 * Controle: as mesmas perguntas rodam contra duas regras quebradas (uma que
 * ignora as séries, outra que ignora encerramento, cancelamento e exclusões),
 * e a prova precisa reprovar as duas.
 */
'use strict';
const Core = require('../core.js');

let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

function dbBase() {
  return {
    alunos: [{ id: 'al1', nome: 'Aluno Um' }, { id: 'al2', nome: 'Aluno Dois' }],
    aulas: [
      // novembro já materializado: a aula de 16/11 foi remarcada para 17/11 (fica em exclusoes)
      { id: 's1@2026-11-09', alunoId: 'al1', serieId: 's1', data: '2026-11-09', hora: '15:00', duracaoMin: 60, status: 'realizada' },
      { id: 's1@2026-11-17', alunoId: 'al1', serieId: 's1', destacada: true, data: '2026-11-17', hora: '15:00', duracaoMin: 60, status: 'realizada' },
      // uma aula de dezembro que já existe (a série s1 materializou por fora): não duplica
      { id: 's1@2026-12-14', alunoId: 'al1', serieId: 's1', data: '2026-12-14', hora: '15:00', duracaoMin: 60, status: 'cancelada' }
    ],
    series: [
      // segunda 15:00, materializada até 2026-11; 21/12 excluída (apagada)
      { id: 's1', alunoId: 'al1', dias: [1], hora: '15:00', duracaoMin: 60, inicio: '2026-09-07', fim: null,
        exclusoes: ['2026-11-16', '2026-12-21'], materializadoAte: '2026-11' },
      // terça 10:00, encerrada em 2026-12-08
      { id: 's2', alunoId: 'al2', dias: [2], hora: '10:00', duracaoMin: 90, inicio: '2026-09-01', fim: '2026-12-08',
        exclusoes: [], materializadoAte: '2026-11' },
      // quarta 09:00, cancelada
      { id: 's3', alunoId: 'al2', dias: [3], hora: '09:00', duracaoMin: 60, inicio: '2026-09-02', fim: null,
        status: 'cancelada', exclusoes: [], materializadoAte: '2026-11' },
      // sábado 08:00, sem materializadoAte e começando em 2027
      { id: 's4', alunoId: 'al1', dias: [6], hora: '08:00', duracaoMin: 60, inicio: '2027-01-02', fim: null, exclusoes: [], materializadoAte: null }
    ]
  };
}

/* As perguntas da regra. `regra(db, aula)` é a função de choque testada. */
function perguntas(regra, rotulo) {
  const r = [];
  const choca = (db, data, hora, dur) => regra(db, { id: null, data: data, hora: hora, duracaoMin: dur || 60, status: 'realizada' }).length > 0;
  let db = dbBase();
  r.push([rotulo + 'série ativa além do horizonte ocupa (seg 07/12 15:00)', choca(db, '2026-12-07', '15:00'), true]);
  r.push([rotulo + 'e ocupa por sobreposição (seg 07/12 14:30, 1h)', choca(db, '2026-12-07', '14:30'), true]);
  r.push([rotulo + 'série ativa em 2027 ocupa (seg 04/01/2027 15:00)', choca(db, '2027-01-04', '15:00'), true]);
  r.push([rotulo + 'série sem materializadoAte ocupa (sáb 02/01/2027 08:00)', choca(db, '2027-01-02', '08:00'), true]);
  r.push([rotulo + 'série encerrada não ocupa depois do fim (ter 15/12 10:00)', choca(db, '2026-12-15', '10:00'), false]);
  r.push([rotulo + 'série encerrada ocupa até o fim (ter 08/12 10:00)', choca(db, '2026-12-08', '10:00'), true]);
  r.push([rotulo + 'série cancelada não ocupa (qua 09/12 09:00)', choca(db, '2026-12-09', '09:00'), false]);
  r.push([rotulo + 'data excluída não ocupa (seg 21/12 15:00)', choca(db, '2026-12-21', '15:00'), false]);
  r.push([rotulo + 'aula da série já existente e cancelada não ocupa (seg 14/12 15:00)', choca(db, '2026-12-14', '15:00'), false]);
  r.push([rotulo + 'mês materializado: data remarcada não ocupa (seg 16/11 15:00)', choca(db, '2026-11-16', '15:00'), false]);
  r.push([rotulo + 'mês materializado: a aula real ocupa (seg 09/11 15:00)', choca(db, '2026-11-09', '15:00'), true]);
  r.push([rotulo + 'outro horário do mesmo dia fica livre (seg 07/12 16:00)', choca(db, '2026-12-07', '16:00'), false]);
  r.push([rotulo + 'outro dia da semana fica livre (sex 11/12 15:00)', choca(db, '2026-12-11', '15:00'), false]);
  r.push([rotulo + 'antes do início não ocupa (sáb 26/12 08:00)', choca(db, '2026-12-26', '08:00'), false]);
  return r;
}

secao('1. A regra do celular (Core.conflitosComRepeticoes)');
perguntas(Core.conflitosComRepeticoes, '').forEach(p => conf(p[0], p[1], p[2]));

secao('2. Nada é gravado');
{
  const db = dbBase();
  const antes = JSON.stringify(db);
  for (let d = 1; d <= 31; d++) {
    const iso = '2026-12-' + Core.pad2(d);
    for (let m = 7 * 60; m < 20 * 60; m += 30) {
      Core.conflitosComRepeticoes(db, { id: null, data: iso, hora: Core.pad2(Math.floor(m / 60)) + ':' + Core.pad2(m % 60), duracaoMin: 60, status: 'realizada' });
    }
    Core.ocorrenciasPrevistasDoDia(db, iso);
  }
  conf('o db sai idêntico depois de varrer dezembro inteiro', JSON.stringify(db) === antes, true);
  conf('as séries continuam materializadas só até 2026-11', db.series[0].materializadoAte, '2026-11');
  const previstas = Core.ocorrenciasPrevistasDoDia(db, '2026-12-07');
  conf('a ocorrência prevista é marcada como prevista e diz aluno e hora',
    previstas.length + '|' + previstas[0].prevista + '|' + previstas[0].alunoId + '|' + previstas[0].hora, '1|true|al1|15:00');
  conf('e não entra em db.aulas', db.aulas.some(a => a.data === '2026-12-07'), false);
}

secao('3. Controle: regras quebradas reprovam');
{
  const semSeries = (db, aula) => Core.conflitosDe(db, aula);
  const semFiltros = (db, aula) => {
    const prev = [];
    (db.series || []).forEach(s => {
      if (s.dias.indexOf(Core.diaSemana(aula.data)) < 0) return;
      if (s.inicio && aula.data < s.inicio) return;
      if (s.materializadoAte && Core.mesDe(aula.data) <= s.materializadoAte) return;
      prev.push({ id: 'x' + s.id, data: aula.data, hora: s.hora, duracaoMin: s.duracaoMin, status: 'realizada' });
    });
    return Core.conflitosDe(db, aula).concat(Core.conflitosDe({ aulas: prev }, aula));
  };
  [['ignora as séries', semSeries], ['ignora fim, cancelamento e exclusões', semFiltros]].forEach(([nome, regra]) => {
    const erradas = perguntas(regra, '').filter(p => String(p[1]) !== String(p[2])).length;
    conf('a regra que ' + nome + ' erra ao menos uma pergunta (errou ' + erradas + ')', erradas > 0, true);
  });
}

secao('4. A mensagem às famílias');
{
  const dias = ['2026-12-06', '2026-12-07', '2026-12-08', '2026-12-09', '2026-12-10', '2026-12-11', '2026-12-12'];
  conf('a preposição de cada dia', dias.map(Core.diaSemanaComPreposicao).join(','),
    'no domingo,na segunda,na terça,na quarta,na quinta,na sexta,no sábado');
  conf('inícios contínuos viram uma faixa, com o fim da última aula',
    JSON.stringify(Core.faixasDeHorariosLivres(['07:00', '07:30', '08:00', '11:00'], 60, 30)),
    JSON.stringify([{ de: '07:00', ate: '09:00' }, { de: '11:00', ate: '12:00' }]));
  conf('sábado com duas faixas',
    Core.mensagemDeHorariosVagos('2026-12-12', ['07:00', '07:30', '08:00', '14:00', '14:30'], 90, 30),
    'Olá! Tenho horários livres para aula de 1h30 no sábado, 12/12: das 07:00 às 09:30 e das 14:00 às 16:00. Qual horário funciona para você?');
  conf('segunda com três faixas',
    Core.mensagemDeHorariosVagos('2026-12-07', ['07:00', '09:00', '11:00', '11:30'], 60, 30),
    'Olá! Tenho horários livres para aula de 1h na segunda, 07/12: das 07:00 às 08:00, das 09:00 às 10:00 e das 11:00 às 12:30. Qual horário funciona para você?');
  conf('sem horário, sem mensagem', Core.mensagemDeHorariosVagos('2026-12-07', [], 60, 30), '');
  conf('a mensagem nunca diz "na sábado" nem "na domingo"',
    /na (sábado|domingo)/.test(Core.mensagemDeHorariosVagos('2026-12-12', ['07:00'], 60, 30) + Core.mensagemDeHorariosVagos('2026-12-13', ['07:00'], 60, 30)), false);
}

console.log('\n' + passes + ' passaram, ' + falhas + ' falharam');
if (falhas) { console.log('FALHOU'); process.exit(1); }
console.log('TUDO PASSOU');
