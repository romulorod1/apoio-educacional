/* testa_a3_edicao_repeticao.js
 *
 * Provas discriminantes para o item A3:
 * 1. Edição "esta e as seguintes" divide a série na data (antiga termina na véspera, nova nasce);
 * 2. Meses além do horizonte (ex: abril de 2027) gerados com horário e duração novos;
 * 3. Fechamento futuro cobra o valor correto (R$ 1.200,00 e não R$ 800,00);
 * 4. "Todas" atualiza a série de ponta a ponta e propaga para meses não materializados;
 * 5. Duas séries do mesmo aluno no mesmo dia (irmão) geram duas aulas distintas (sem colapso);
 * 6. Preservação de notas, anexos e exceções destacadas;
 * 7. Aviso descreveSerie reflete o padrão vigente antes e depois do corte.
 */
'use strict';
const Core = require('../core.js');

let ok = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const passou = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (passou) ok++; else falhas++;
  console.log((passou ? '  OK    ' : '  FALHA ') + rotulo + (passou ? '' : '  [obtido: ' + JSON.stringify(obtido) + ' | esperado: ' + JSON.stringify(esperado) + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

function baseNova() {
  return {
    alunos: [{
      id: 'a1', nome: 'Aluno Teste', ativo: true, cor: '#2E7D6B',
      precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 100 }]
    }],
    series: [], aulas: [], resumos: []
  };
}

secao('1. Horizonte e simulação de abril de 2027 (R$ 1.200 em vez de R$ 800)');
let db = baseNova();
// Aluno a1 tem aula toda segunda e quarta, às 14:00, 60 min, a partir de 01/06/2026
const s1 = Core.criarSerie(db, {
  alunoId: 'a1', dias: [1, 3], hora: '14:00', duracaoMin: 60,
  inicio: '2026-06-01', fim: null
});

// Aulas de junho criadas
const aulasJunho = db.aulas.filter(a => a.alunoId === 'a1' && Core.mesDe(a.data) === '2026-06')
  .sort((x, y) => x.data.localeCompare(y.data));
conf('aulas de junho geradas', aulasJunho.length > 0, true);

// Em 15/06/2026, Nathalia altera a aula para 90 min (1h30) às 16:00 com escopo 'seguintes'
const aulaCorte = aulasJunho.find(a => a.data === '2026-06-15');
conf('aula de corte encontrada (15/06)', !!aulaCorte, true);

const af = Core.aplicarEdicaoAula(db, aulaCorte.id, { hora: '16:00', duracaoMin: 90 }, 'seguintes');
conf('afetou aulas a partir de 15/06', af > 0, true);

// Divisão da série: série antiga termina na véspera (14/06/2026)
const serieVelha = db.series.find(s => s.id === s1.id);
conf('série original termina na véspera', serieVelha.fim, '2026-06-14');
conf('série original mantém horário antigo', serieVelha.hora, '14:00');
conf('série original mantém duração antiga', serieVelha.duracaoMin, 60);

// Nova série criada iniciando em 15/06/2026
const serieNova = db.series.find(s => s.id !== s1.id);
conf('nova série criada', !!serieNova, true);
conf('nova série inicia na data do corte', serieNova.inicio, '2026-06-15');
conf('nova série tem novo horário', serieNova.hora, '16:00');
conf('nova série tem nova duração', serieNova.duracaoMin, 90);
conf('nova série ligada à origem', serieNova.serieOrigemId, s1.id);

// Navegação para abril de 2027 (além do horizonte original)
Core.garantirSeriesAte(db, '2027-04');
const aulasAbril = db.aulas.filter(a => a.alunoId === 'a1' && Core.mesDe(a.data) === '2027-04');
conf('abril de 2027 materializado', aulasAbril.length, 8); // 4 segundas e 4 quartas
conf('todas as aulas de abril têm 90 min', aulasAbril.every(a => a.duracaoMin === 90), true);
conf('todas as aulas de abril têm horário 16:00', aulasAbril.every(a => a.hora === '16:00'), true);
conf('todas as aulas de abril pertencem à nova série', aulasAbril.every(a => a.serieId === serieNova.id), true);

// Fechamento de abril de 2027: 8 aulas * 1.5h * R$ 100/h = 12h = R$ 1.200,00
const fAbril = Core.calcularFechamento(db, 'a1', '2027-04');
conf('total de horas em abril de 2027 é 12:00', fAbril.totalHoras, '12:00');
conf('fechamento futuro cobra R$ 1.200,00 e não R$ 800,00', Core.fmtMoeda(fAbril.totalValor), 'R$ 1.200,00');

secao('2. Aviso descreveSerie reflete a repetição vigente antes e depois do corte');
const aulaAntes = aulasJunho.find(a => a.data === '2026-06-01');
const serieAntes = Core.serieDe(db, aulaAntes);
conf('aula anterior aponta para série antiga', serieAntes.id, s1.id);
conf('descrição da série anterior cita 14:00 e término em 14/06/2026',
  Core.descreveSerie(serieAntes), 'Toda segunda e quarta, às 14:00, até 14/06/2026');

const aulaDepois = db.aulas.find(a => a.id === aulaCorte.id);
const serieDepois = Core.serieDe(db, aulaDepois);
conf('aula do corte aponta para nova série', serieDepois.id, serieNova.id);
conf('descrição da nova série cita 16:00',
  Core.descreveSerie(serieDepois), 'Toda segunda e quarta, às 16:00');

secao('3. Escopo "todas" atualiza a série e propaga para meses não materializados');
db = baseNova();
const sTodas = Core.criarSerie(db, {
  alunoId: 'a1', dias: [2], hora: '10:00', duracaoMin: 60,
  inicio: '2026-08-01', fim: null
});
const primeiraAula = db.aulas.find(a => a.serieId === sTodas.id);
Core.aplicarEdicaoAula(db, primeiraAula.id, { hora: '11:00', duracaoMin: 120 }, 'todas');

conf('série teve horário alterado', sTodas.hora, '11:00');
conf('série teve duração alterada', sTodas.duracaoMin, 120);

Core.garantirSeriesAte(db, '2027-05');
const aulasMaio27 = db.aulas.filter(a => a.alunoId === 'a1' && Core.mesDe(a.data) === '2027-05');
conf('maio de 2027 materializado com nova duração de 120 min', aulasMaio27.every(a => a.duracaoMin === 120), true);
conf('maio de 2027 materializado com novo horário 11:00', aulasMaio27.every(a => a.hora === '11:00'), true);

secao('4. Irmão: duas repetições do mesmo aluno no mesmo dia da semana');
db = baseNova();
// Série matutina na terça-feira: 10:00, 60 min
const sManha = Core.criarSerie(db, {
  alunoId: 'a1', dias: [2], hora: '10:00', duracaoMin: 60,
  inicio: '2026-09-01', fim: '2026-09-30'
});
// Série vespertina na mesma terça-feira: 15:00, 90 min
const sTarde = Core.criarSerie(db, {
  alunoId: 'a1', dias: [2], hora: '15:00', duracaoMin: 90,
  inicio: '2026-09-01', fim: '2026-09-30'
});

const aulasSetembro = db.aulas.filter(a => a.alunoId === 'a1' && Core.mesDe(a.data) === '2026-09')
  .sort((x, y) => x.data.localeCompare(y.data) || x.hora.localeCompare(y.hora));

// Em setembro de 2026 há 5 terças-feiras (01, 08, 15, 22, 29). Total deve ser 10 aulas (5 manhã + 5 tarde).
conf('total de aulas geradas em setembro é 10 (5 manhã + 5 tarde)', aulasSetembro.length, 10);
const manhaCount = aulasSetembro.filter(a => a.hora === '10:00' && a.duracaoMin === 60).length;
const tardeCount = aulasSetembro.filter(a => a.hora === '15:00' && a.duracaoMin === 90).length;
conf('5 aulas da série da manhã preservadas', manhaCount, 5);
conf('5 aulas da série da tarde preservadas', tardeCount, 5);

// Conferir busca pontual com achaAula(db, alunoId, data, hora)
const aManha01 = Core.achaAula(db, 'a1', '2026-09-01', '10:00');
const aTarde01 = Core.achaAula(db, 'a1', '2026-09-01', '15:00');
conf('achaAula acha aula da manhã pelo horário', !!aManha01 && aManha01.duracaoMin === 60, true);
conf('achaAula acha aula da tarde pelo horário', !!aTarde01 && aTarde01.duracaoMin === 90, true);
conf('as duas aulas do mesmo dia têm ids diferentes', aManha01.id !== aTarde01.id, true);

secao('5. Preservação de notas, anexos e exceções destacadas');
db = baseNova();
const sExp = Core.criarSerie(db, {
  alunoId: 'a1', dias: [3], hora: '14:00', duracaoMin: 60,
  inicio: '2026-06-01', fim: '2026-06-30'
});
const aulasExp = db.aulas.filter(a => a.serieId === sExp.id).sort((x, y) => x.data.localeCompare(y.data));
const aula03 = aulasExp[0]; // 2026-06-03
const aula10 = aulasExp[1]; // 2026-06-10
const aula17 = aulasExp[2]; // 2026-06-17

// Aula 03 tem nota e anexo
aula03.notaTexto = 'Trabalhamos equações de 1º grau';
aula03.anexos = [{ id: 'anx1', nome: 'exercicios.pdf' }];

// Aula 10 foi destacada como exceção (ex: mudou de dia/hora pontual)
aula10.destacada = true;
aula10.hora = '18:00';
aula10.duracaoMin = 120;

// Nathalia edita com escopo 'todas' a partir da aula 17, alterando horário da repetição para 15:30
Core.aplicarEdicaoAula(db, aula17.id, { hora: '15:30' }, 'todas');

// Aula 03 manteve notas e anexos intactos (edição em massa não apagou nem propagou)
const aula03Depois = db.aulas.find(a => a.id === aula03.id);
conf('nota da aula 03 preservada', aula03Depois.notaTexto, 'Trabalhamos equações de 1º grau');
conf('anexo da aula 03 preservado', aula03Depois.anexos.length, 1);

// Aula 17 não recebeu nota da aula 03
const aula17Depois = db.aulas.find(a => a.id === aula17.id);
conf('nota não foi propagada indevidamente para aula 17', aula17Depois.notaTexto, '');

// Aula 10 destacada NÃO foi sobrescrita pela edição em massa
const aula10Depois = db.aulas.find(a => a.id === aula10.id);
conf('exceção destacada manteve seu horário pontual', aula10Depois.hora, '18:00');
conf('exceção destacada manteve sua duração pontual', aula10Depois.duracaoMin, 120);

secao('6. Exclusão "seguintes" encadeada');
db = baseNova();
const sEnc = Core.criarSerie(db, {
  alunoId: 'a1', dias: [1], hora: '14:00', duracaoMin: 60,
  inicio: '2026-06-01', fim: '2026-08-31'
});
const aPrimeira = db.aulas.find(a => a.data === '2026-06-15');
Core.aplicarEdicaoAula(db, aPrimeira.id, { hora: '16:00', duracaoMin: 90 }, 'seguintes');

// Agora exclui "seguintes" a partir de 2026-06-08
const aExcl = db.aulas.find(a => a.data === '2026-06-08');
Core.excluirAulas(db, aExcl.id, 'seguintes');

conf('aula de 01/06 sobreviveu', db.aulas.some(a => a.data === '2026-06-01'), true);
conf('aulas a partir de 08/06 foram removidas', db.aulas.some(a => a.data >= '2026-06-08'), false);

// Navegar para o futuro não recria aulas da série filha excluída
Core.garantirSeriesAte(db, '2026-08');
conf('nenhuma aula criada em julho de 2026', db.aulas.filter(a => Core.mesDe(a.data) === '2026-07').length, 0);
conf('nenhuma aula criada em agosto de 2026', db.aulas.filter(a => Core.mesDe(a.data) === '2026-08').length, 0);

secao('7. Cortes encadeados: edição anterior sobrescreve corte posterior');
db = baseNova();
const sEnc2 = Core.criarSerie(db, {
  alunoId: 'a1', dias: [1], hora: '14:00', duracaoMin: 60,
  inicio: '2026-06-01', fim: null
});
// Primeiro corte em 22/06: muda para 16:00, 90 min
const a22 = db.aulas.find(a => a.data === '2026-06-22');
Core.aplicarEdicaoAula(db, a22.id, { hora: '16:00', duracaoMin: 90 }, 'seguintes');

// Segundo corte em 08/06 (anterior ao primeiro corte): muda para 18:00, 120 min
const a08 = db.aulas.find(a => a.data === '2026-06-08');
Core.aplicarEdicaoAula(db, a08.id, { hora: '18:00', duracaoMin: 120 }, 'seguintes');

// Verifica que a série filha intermediária foi superada
conf('apenas duas séries ativas na cadeia (origem e corte de 08/06)', db.series.length, 2);
const sAtiva = db.series.find(s => s.inicio === '2026-06-08');
conf('série ativa inicia em 08/06', !!sAtiva, true);
conf('série ativa tem 18:00', sAtiva ? sAtiva.hora : '', '18:00');
conf('série ativa tem 120 min', sAtiva ? sAtiva.duracaoMin : 0, 120);

// Navegar para 2027-01
Core.garantirSeriesAte(db, '2027-01');
const aulasJan27 = db.aulas.filter(a => a.alunoId === 'a1' && Core.mesDe(a.data) === '2027-01');
conf('janeiro de 2027 gerado com 18:00', aulasJan27.every(a => a.hora === '18:00'), true);
conf('janeiro de 2027 gerado com 120 min', aulasJan27.every(a => a.duracaoMin === 120), true);

secao('8. Caso exato da revisão Codex (15/06 -> 13/07 -> 22/06)');
db = baseNova();
// Repetição às 14:00 a partir de 01/06/2026
const sCodex = Core.criarSerie(db, {
  alunoId: 'a1', dias: [1], hora: '14:00', duracaoMin: 60,
  inicio: '2026-06-01', fim: null
});
// 1. "seguintes" em 15/06 para 16:00
const ac15 = db.aulas.find(a => a.data === '2026-06-15');
Core.aplicarEdicaoAula(db, ac15.id, { hora: '16:00' }, 'seguintes');

// 2. "seguintes" em 13/07 para 17:00
Core.garantirSeriesAte(db, '2026-07');
const ac13 = db.aulas.find(a => a.data === '2026-07-13');
Core.aplicarEdicaoAula(db, ac13.id, { hora: '17:00' }, 'seguintes');

// 3. "seguintes" em 22/06 para 18:00 (entre 15/06 e 13/07)
const ac22 = db.aulas.find(a => a.data === '2026-06-22');
Core.aplicarEdicaoAula(db, ac22.id, { hora: '18:00' }, 'seguintes');

// Materializar abril de 2027
Core.garantirSeriesAte(db, '2027-04');
const aulasAbrilCodex = db.aulas.filter(a => a.alunoId === 'a1' && Core.mesDe(a.data) === '2027-04');
conf('quatro aulas em abril de 2027', aulasAbrilCodex.length, 4);
conf('todas as aulas de abril de 2027 nascem às 18:00 (e não 17:00)',
  aulasAbrilCodex.every(a => a.hora === '18:00'), true);

console.log('\n' + ok + ' verificações passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);


