/* testa_rotulos_aula.js
 *
 * Validação da Tarefa T01 (UX01, UX02, UX15):
 * 1. Rótulos temporais verdadeiros (ontem, hoje e amanhã).
 * 2. Aula futura agendada não é dita como realizada.
 * 3. Aula futura cancelada não promete realização ("ainda vai acontecer").
 * 4. Reposição futura é identificada como agendada.
 * 5. Consistência entre motor, markdown e superfícies.
 * 6. Regra financeira preservada (valores e cobranças intactos).
 */
const Core = require('../core.js');

let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

secao('1. Rótulos de situação por data de referência (ontem, hoje, amanhã)');

const hoje = '2026-09-27';
const ontem = '2026-09-26';
const amanha = '2026-09-28';

// Ontem: tudo o que aconteceu é passado
conf('ontem: realizada -> Realizada', Core.rotuloSituacao('realizada', ontem, hoje), 'Realizada');
conf('ontem: reposicao -> Reposição', Core.rotuloSituacao('reposicao', ontem, hoje), 'Reposição');
conf('ontem: falta -> Falta sem aviso', Core.rotuloSituacao('falta', ontem, hoje), 'Falta sem aviso');
conf('ontem: cancelada -> Cancelada com aviso', Core.rotuloSituacao('cancelada', ontem, hoje), 'Cancelada com aviso');

// Hoje: pela regra do produto, aula de hoje conta como dada/acontecida
conf('hoje: realizada -> Realizada', Core.rotuloSituacao('realizada', hoje, hoje), 'Realizada');
conf('hoje: reposicao -> Reposição', Core.rotuloSituacao('reposicao', hoje, hoje), 'Reposição');
conf('hoje: falta -> Falta sem aviso', Core.rotuloSituacao('falta', hoje, hoje), 'Falta sem aviso');
conf('hoje: cancelada -> Cancelada com aviso', Core.rotuloSituacao('cancelada', hoje, hoje), 'Cancelada com aviso');

// Amanhã: data > hoje é futura
conf('amanhã: realizada -> Agendada', Core.rotuloSituacao('realizada', amanha, hoje), 'Agendada');
conf('amanhã: reposicao -> Reposição agendada', Core.rotuloSituacao('reposicao', amanha, hoje), 'Reposição agendada');
conf('amanhã: falta -> Falta sem aviso', Core.rotuloSituacao('falta', amanha, hoje), 'Falta sem aviso');
conf('amanhã: cancelada -> Cancelada com aviso', Core.rotuloSituacao('cancelada', amanha, hoje), 'Cancelada com aviso');

secao('2. Fechamento do mês: statusRotulo e statusNaFolha');

const dbTeste = {
  alunos: [{ id: 'aluno-1', nome: 'Marcelo', precos: [{ inicio: '2026-01-01', fim: null, valorHora: 100 }] }],
  aulas: [
    // Aula passada realizada
    { id: 'a1', alunoId: 'aluno-1', data: ontem, hora: '14:00', duracaoMin: 60, status: 'realizada', cobravel: true },
    // Aula de hoje realizada
    { id: 'a2', alunoId: 'aluno-1', data: hoje, hora: '15:00', duracaoMin: 60, status: 'realizada', cobravel: true },
    // Aula futura normal marcada
    { id: 'a3', alunoId: 'aluno-1', data: amanha, hora: '16:00', duracaoMin: 60, status: 'realizada', cobravel: true },
    // Aula futura reposição marcada
    { id: 'a4', alunoId: 'aluno-1', data: '2026-09-29', hora: '17:00', duracaoMin: 60, status: 'reposicao', cobravel: true },
    // Aula futura cancelada não cobrada
    { id: 'a5', alunoId: 'aluno-1', data: '2026-09-30', hora: '18:00', duracaoMin: 60, status: 'cancelada', cobravel: false }
  ],
  resumos: []
};

const fechamento = Core.calcularFechamento(dbTeste, 'aluno-1', '2026-09', hoje);
const linhas = fechamento.linhas;

conf('5 aulas no fechamento', linhas.length, 5);

// a1: ontem realizada
conf('a1 passada: futura é false', linhas[0].futura, false);
conf('a1 passada: statusRotulo é Realizada', linhas[0].statusRotulo, 'Realizada');
conf('a1 passada: statusNaFolha é Realizada', linhas[0].statusNaFolha, 'Realizada');

// a2: hoje realizada
conf('a2 hoje: futura é false', linhas[1].futura, false);
conf('a2 hoje: statusRotulo é Realizada', linhas[1].statusRotulo, 'Realizada');
conf('a2 hoje: statusNaFolha é Realizada', linhas[1].statusNaFolha, 'Realizada');

// a3: amanha agendada
conf('a3 amanhã: futura é true', linhas[2].futura, true);
conf('a3 amanhã: statusRotulo é Agendada', linhas[2].statusRotulo, 'Agendada');
conf('a3 amanhã: statusNaFolha é Agendada', linhas[2].statusNaFolha, 'Agendada');

// a4: depois de amanhã reposição agendada
conf('a4 reposição futura: futura é true', linhas[3].futura, true);
conf('a4 reposição futura: statusRotulo é Reposição agendada', linhas[3].statusRotulo, 'Reposição agendada');
conf('a4 reposição futura: statusNaFolha é Reposição agendada', linhas[3].statusNaFolha, 'Reposição agendada');

// a5: cancelada futura
conf('a5 cancelada futura: futura é true', linhas[4].futura, true);
conf('a5 cancelada futura: statusRotulo é Cancelada com aviso', linhas[4].statusRotulo, 'Cancelada com aviso');
conf('a5 cancelada futura: statusNaFolha é Cancelada com aviso', linhas[4].statusNaFolha, 'Cancelada com aviso');
conf('a5 cancelada futura: cobravel é false', linhas[4].cobravel, false);

secao('3. Preservação financeira invariante');
// 2 aulas passadas cobradas (R$ 200), 2 aulas futuras cobradas (R$ 200), 1 cancelada (R$ 0)
conf('totalValor do mês é R$ 400', fechamento.totalValor, 400);
conf('valorFeito (até hoje) é R$ 200', fechamento.valorFeito, 200);
conf('valorPrevisto (à frente) é R$ 200', fechamento.valorPrevisto, 200);
conf('minFeitos é 120 (2 horas)', fechamento.minFeitos, 120);
conf('minPrevistos é 120 (2 horas)', fechamento.minPrevistos, 120);

secao('4. Exportação Markdown do Fechamento');
const md = Core.markdownFechamento(fechamento, {});

conf('markdown contém Agendada', md.indexOf('| Agendada |') > 0, true);
conf('markdown contém Reposição agendada', md.indexOf('| Reposição agendada |') > 0, true);
conf('markdown não tem "Realizada · ainda vai acontecer"', md.indexOf('Realizada · ainda vai acontecer'), -1);
conf('markdown não tem "ainda vai acontecer"', md.indexOf('ainda vai acontecer'), -1);

secao('5. Validação de integridade na interface (app.js)');
const fs = require('fs');
const path = require('path');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

conf('app.js tem texto de tarifa de referência quando desmarcar cobrar',
  appJs.includes('Não será cobrada (tarifa de referência:'), true);
conf('app.js liga ouvinte de chkCobrar a atualizarPrevisao',
  /chkCobrar\.addEventListener\(\s*['"]change['"][\s\S]*?atualizarPrevisao/.test(appJs), true);
conf('app.js atualiza opções de situação ao mudar a data',
  appJs.includes('atualizarOpcoesStatus();'), true);
conf('app.js não tem mais "· ainda vai acontecer" na tabela de fechamento',
  appJs.includes('(l.futura ? \' · ainda vai acontecer\' : \'\')'), false);
conf('app.js não tem mais "ainda vai acontecer" em blocoDaAula',
  appJs.includes("if (l.futura) detalhe.push('ainda vai acontecer');"), false);

console.log('\n============================================================');
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
console.log('============================================================\n');

if (falhas > 0) process.exit(1);
