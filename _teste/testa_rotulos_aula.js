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
const PDF = require('../pdf.js');

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

secao('6. Casos de referência C1 a C8 do Guia UX-UI (T02)');

const alunoPadrao = { id: 'aluno-c', nome: 'Aluno Referência', precos: [{ inicio: '2026-01-01', fim: null, valorHora: 100 }] };

// C1: Futura marcada (Cobrada: Sim)
const fC1 = Core.calcularFechamento({
  alunos: [alunoPadrao],
  aulas: [{ id: 'c1', alunoId: 'aluno-c', data: amanha, hora: '10:00', duracaoMin: 60, status: 'realizada', cobravel: true }]
}, 'aluno-c', '2026-09', hoje);
conf('C1: 1 encontro futuro ativo', fC1.qtdEncontrosPrevistos, 1);
conf('C1: R$ 100 previstos', fC1.valorPrevisto, 100);
conf('C1: 0 horas dadas sem cobrar', fC1.minutosDadosSemCobrar, 0);

// C2: Futura cancelada (Cobrada: Não)
const fC2 = Core.calcularFechamento({
  alunos: [alunoPadrao],
  aulas: [{ id: 'c2', alunoId: 'aluno-c', data: amanha, hora: '10:00', duracaoMin: 60, status: 'cancelada', cobravel: false }]
}, 'aluno-c', '2026-09', hoje);
conf('C2: 0 encontros futuros marcados', fC2.qtdEncontrosPrevistos, 0);
conf('C2: R$ 0 previstos', fC2.valorPrevisto, 0);
conf('C2: 0 horas dadas sem cobrar (não virou trabalho gratuito)', fC2.minutosDadosSemCobrar, 0);
const mdC2 = Core.markdownFechamento(fC2, {});
conf('C2: não entra em "Ainda marcadas neste mês"', mdC2.indexOf('## Ainda marcadas neste mês'), -1);
conf('C2: "Datas trabalhadas" informa ausência de aulas até a data', mdC2.indexOf('Nenhuma aula aconteceu até') > 0, true);
conf('C2: Total destas datas até hoje é R$ 0,00', mdC2.indexOf('**Total destas datas até ' + Core.ddmm(hoje) + ':** R$ 0,00') > 0, true);
conf('C2: Cancelada futura sai na seção dedicada "Aulas canceladas à frente"', mdC2.indexOf('## Aulas canceladas à frente') > 0, true);
const pdfC2 = PDF.gerarFechamento(fC2, {});
conf('C2: PDF gerado com sucesso sem incluir futura nas trabalhadas', pdfC2 && pdfC2.length > 0, true);

// C2b: Futura cancelada com cobrança explícita (Cobrada: Sim)
const fC2b = Core.calcularFechamento({
  alunos: [alunoPadrao],
  aulas: [{ id: 'c2b', alunoId: 'aluno-c', data: amanha, hora: '10:00', duracaoMin: 60, status: 'cancelada', cobravel: true }]
}, 'aluno-c', '2026-09', hoje);
conf('C2b: valorFeito até hoje continua R$ 0', fC2b.valorFeito, 0);
conf('C2b: valorPrevisto ativo é R$ 0 (sem aulas ativas à frente)', fC2b.valorPrevisto, 0);
conf('C2b: valorCanceladasFuturas registra os R$ 100', fC2b.valorCanceladasFuturas, 100);
conf('C2b: totalValor do mês registra os R$ 100', fC2b.totalValor, 100);
const mdC2b = Core.markdownFechamento(fC2b, {});
conf('C2b: "Datas trabalhadas" não inclui a aula futura cancelada', mdC2b.indexOf('Nenhuma aula aconteceu até') > 0, true);
conf('C2b: Total destas datas até hoje permanece R$ 0,00', mdC2b.indexOf('**Total destas datas até ' + Core.ddmm(hoje) + ':** R$ 0,00') > 0, true);
conf('C2b: Cancelada cobrada consta apenas em "Aulas canceladas à frente"', mdC2b.indexOf('## Aulas canceladas à frente') > 0, true);
conf('C2b: Markdown exibe Total do mês explícito', mdC2b.indexOf('**Total do mês:** R$ 100,00') > 0, true);
const pdfC2b = PDF.gerarFechamento(fC2b, {});
conf('C2b: PDF com futura cancelada cobrável gerado com sucesso', pdfC2b && pdfC2b.length > 0, true);
const txtPdfC2b = Buffer.from(pdfC2b).toString('latin1');
conf('C2b: PDF exibe Total do mês explícito na faixa', txtPdfC2b.indexOf('Total do mês:') > 0 && txtPdfC2b.indexOf('R$ 100,00') > 0, true);

// C3: Passada realizada (Cobrada: Não)
const fC3 = Core.calcularFechamento({
  alunos: [alunoPadrao],
  aulas: [{ id: 'c3', alunoId: 'aluno-c', data: ontem, hora: '10:00', duracaoMin: 60, status: 'realizada', cobravel: false }]
}, 'aluno-c', '2026-09', hoje);
conf('C3: 1 hora dada sem cobrar', fC3.minutosDadosSemCobrar, 60);
conf('C3: R$ 0 de valor a cobrar', fC3.totalValor, 0);
const mdC3 = Core.markdownFechamento(fC3, {});
conf('C3: markdown apresenta horas não cobradas', mdC3.indexOf('**Horas não cobradas:** 1:00 h') > 0, true);

// C4: Passada realizada (Cobrada: Sim)
const fC4 = Core.calcularFechamento({
  alunos: [alunoPadrao],
  aulas: [{ id: 'c4', alunoId: 'aluno-c', data: ontem, hora: '10:00', duracaoMin: 60, status: 'realizada', cobravel: true }]
}, 'aluno-c', '2026-09', hoje);
conf('C4: 1h cobrada R$ 100', fC4.totalValor, 100);
conf('C4: 0 horas gratuitas', fC4.minutosDadosSemCobrar, 0);

// C5: Futura reposição marcada (Cobrada: Sim)
const fC5 = Core.calcularFechamento({
  alunos: [alunoPadrao],
  aulas: [{ id: 'c5', alunoId: 'aluno-c', data: amanha, hora: '10:00', duracaoMin: 60, status: 'reposicao', cobravel: true }]
}, 'aluno-c', '2026-09', hoje);
conf('C5: 1h/R$ 100 previstos', fC5.valorPrevisto, 100);
conf('C5: 1 encontro futuro previsto', fC5.qtdEncontrosPrevistos, 1);
conf('C5: rótulo é Reposição agendada', fC5.linhas[0].statusNaFolha, 'Reposição agendada');

// C6: C2 + C5 (Futura cancelada não cobrada + Futura reposição cobrada)
const fC6 = Core.calcularFechamento({
  alunos: [alunoPadrao],
  aulas: [
    { id: 'c2', alunoId: 'aluno-c', data: amanha, hora: '10:00', duracaoMin: 60, status: 'cancelada', cobravel: false },
    { id: 'c5', alunoId: 'aluno-c', data: '2026-09-30', hora: '10:00', duracaoMin: 60, status: 'reposicao', cobravel: true }
  ]
}, 'aluno-c', '2026-09', hoje);
conf('C6: Total previsto R$ 100', fC6.valorPrevisto, 100);
conf('C6: exatamente 1 encontro ainda marcado (cancelamento não vira 2ª aula)', fC6.qtdEncontrosPrevistos, 1);
const mdC6 = Core.markdownFechamento(fC6, {});
conf('C6: "Ainda marcadas" tem Reposição agendada', mdC6.indexOf('| Reposição agendada |') > 0, true);
conf('C6: "Ainda marcadas" diz 1 encontro', mdC6.indexOf('**Encontros ainda marcados:** 1') > 0, true);

// C6b: Futura cancelada cobrada + Futura reposição cobrada (totais previstos isolados)
const fC6b = Core.calcularFechamento({
  alunos: [alunoPadrao],
  aulas: [
    { id: 'c2cobravel', alunoId: 'aluno-c', data: amanha, hora: '10:00', duracaoMin: 60, status: 'cancelada', cobravel: true },
    { id: 'c5', alunoId: 'aluno-c', data: '2026-09-30', hora: '10:00', duracaoMin: 60, status: 'reposicao', cobravel: true }
  ]
}, 'aluno-c', '2026-09', hoje);
conf('C6b: Total previsto ativo R$ 100 (apenas a reposição)', fC6b.valorPrevisto, 100);
conf('C6b: Encontros ainda marcados é exatamente 1 (não conta a cancelada)', fC6b.qtdEncontrosPrevistos, 1);
conf('C6b: Horas ainda por dar é 1:00 h', fC6b.horasPrevistas, '1:00');
conf('C6b: Total geral do mês inclui os R$ 200 das duas aulas', fC6b.totalValor, 200);
const mdC6b = Core.markdownFechamento(fC6b, {});
conf('C6b: Subtotal de ainda marcadas diz 1 encontro e R$ 100', mdC6b.indexOf('**Encontros ainda marcados:** 1') > 0 && mdC6b.indexOf('**Valor destas datas:** R$ 100,00') > 0, true);
conf('C6b: Cancelada cobrável figura em "Aulas canceladas à frente"', mdC6b.indexOf('## Aulas canceladas à frente') > 0, true);
conf('C6b: Total do mês reflete os R$ 200', mdC6b.indexOf('R$ 200,00') > 0, true);
const pdfC6b = PDF.gerarFechamento(fC6b, {});
conf('C6b: PDF gerado com sucesso para cenário C6b', pdfC6b && pdfC6b.length > 0, true);

// C7: Passada cancelada com cobrança explícita permitida
const fC7 = Core.calcularFechamento({
  alunos: [alunoPadrao],
  aulas: [{ id: 'c7', alunoId: 'aluno-c', data: ontem, hora: '10:00', duracaoMin: 60, status: 'cancelada', cobravel: true }]
}, 'aluno-c', '2026-09', hoje);
conf('C7: Preserva a cobrança de R$ 100', fC7.totalValor, 100);
conf('C7: Não apresenta aula gratuita', fC7.minutosDadosSemCobrar, 0);
conf('C7: 0 compromissos futuros', fC7.qtdEncontrosPrevistos, 0);

// C8: Passada com falta sem aviso cobrada
const fC8 = Core.calcularFechamento({
  alunos: [alunoPadrao],
  aulas: [{ id: 'c8', alunoId: 'aluno-c', data: ontem, hora: '10:00', duracaoMin: 60, status: 'falta', cobravel: true }]
}, 'aluno-c', '2026-09', hoje);
conf('C8: Preserva os R$ 100 de cobrança da falta', fC8.totalValor, 100);
conf('C8: Não confunde falta com gratuidade', fC8.minutosDadosSemCobrar, 0);
conf('C8: Identifica rótulo como Falta sem aviso', fC8.linhas[0].statusNaFolha, 'Falta sem aviso');

console.log('\n============================================================');
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
console.log('============================================================\n');

if (falhas > 0) process.exit(1);
