/* testa_pagamentos.js
 *
 * C4: "pago em". A regra que decide quem ainda deve o quê, sem navegador.
 *
 * O que se prova, com o dia de hoje fixo em 15/09/2026:
 *   1. o valor que ela digita é lido como se escreve no Brasil, e guardado em
 *      reais com duas casas, sem resto de vírgula flutuante;
 *   2. o valor proposto é o mesmo que o documento da família cobra;
 *   3. marcar, trocar o valor e desmarcar: um registro por aluno e mês;
 *   4. os pendentes: mês sem pagamento, pago a MENOS com a diferença, pago a
 *      mais e pago exato fora, mês de hoje marcado como em andamento, mês
 *      futuro fora, mês sem nada a cobrar fora;
 *   5. base antiga, sem o campo, lê como lista vazia e não quebra;
 *   6. o documento da família (texto e PDF) sai igual com e sem pagamentos.
 *
 * E os VENENOS, porque esta regra grava e decide: duas cópias do core.js com a
 * regra estragada rodam as MESMAS provas da seção 4, e cada uma TEM de
 * reprovar. A primeira esquece o "pago a menos" (qualquer marca conta como
 * pago inteiro); a segunda cobra o que ainda não aconteceu (mês inteiro e mês
 * futuro). Se a troca não achar o trecho no core.js, isso é falha também:
 * veneno que não pegou não prova nada.
 *
 * Dados fictícios.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const Module = require('module');
const Core = require('../core.js');
const PDFGen = require('../pdf.js');

let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK    ' : '  FALHA ') + rotulo +
    (ok ? '' : '  [obtido: ' + JSON.stringify(obtido) + ' | esperado: ' + JSON.stringify(esperado) + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

function textoDoPdf(bytes) {
  const bruto = Buffer.from(bytes).toString('latin1');
  const rx = /\(((?:\\.|[^\\()])*)\)\s*Tj/g;
  const partes = [];
  let m;
  while ((m = rx.exec(bruto))) partes.push(m[1].replace(/\\([\\()])/g, '$1'));
  return partes.join(' ');
}

const HOJE = '2026-09-15';
const ALFA = 'al_c4_alfa', BETA = 'al_c4_beta', GAMA = 'al_c4_gama';

function aula(id, alunoId, data, min, extra) {
  return Object.assign({ id: id, alunoId: alunoId, data: data, hora: '14:00', duracaoMin: min,
    status: 'realizada', cobravel: true, serieId: null, destacada: false, anexos: [], areas: [], temas: [] }, extra || {});
}
function preco(id, v) { return [{ id: id, inicio: '2026-01-01', fim: null, valorHora: v }]; }

/* Um banco novo a cada chamada: as provas mexem nele. */
function banco() {
  return {
    versao: 1,
    alunos: [
      { id: ALFA, nome: 'Aluno Alfa Teste', responsavel: 'Responsavel Alfa', ativo: true, precos: preco('p_a', 100) },
      { id: BETA, nome: 'Aluno Beta Teste', responsavel: 'Responsavel Beta', ativo: true, precos: preco('p_b', 120) },
      // 33,33 por hora, três horas: 99,99 na conta de vírgula flutuante dá 99,99000000000001
      { id: GAMA, nome: 'Aluno Gama Teste', responsavel: 'Responsavel Gama', ativo: true, precos: preco('p_g', 33.33) }
    ],
    series: [],
    aulas: [
      aula('a1', ALFA, '2026-07-03', 60), aula('a2', ALFA, '2026-07-10', 60),   // julho: 200
      aula('a3', ALFA, '2026-08-05', 60),                                         // agosto: 100
      aula('a4', ALFA, '2026-09-03', 60), aula('a5', ALFA, '2026-09-20', 60),   // setembro: 100 até hoje, 200 no mês
      aula('a6', ALFA, '2026-10-07', 60),                                         // outubro: futuro
      aula('b1', BETA, '2026-07-04', 60, { status: 'cancelada', cobravel: false }), // julho: nada a cobrar
      aula('b2', BETA, '2026-08-06', 90),                                         // agosto: 180
      aula('g1', GAMA, '2026-08-11', 60), aula('g2', GAMA, '2026-08-12', 60), aula('g3', GAMA, '2026-08-13', 60) // 99,99
    ],
    resumos: [{ alunoId: ALFA, mes: '2026-08', texto: 'Bom mês para o Alfa.' }],
    ajustes: {},
    pagamentos: []
  };
}

/* Os pagamentos do cenário: julho do Alfa exato, agosto do Alfa A MENOS
 * (60 de 100), agosto do Beta a MAIS (200 de 180), agosto do Gama exato pelo
 * texto "99,99". Setembro do Alfa sem pagamento. */
function bancoComPagamentos(C) {
  const db = banco();
  C.marcarPagamento(db, ALFA, '2026-07', '2026-08-02', 200);
  C.marcarPagamento(db, ALFA, '2026-08', '2026-09-03', 60);
  C.marcarPagamento(db, BETA, '2026-08', '2026-09-04', 200);
  C.marcarPagamento(db, GAMA, '2026-08', '2026-09-05', C.lerReais('99,99'));
  return db;
}

const chave = p => p.alunoNome + ' | ' + p.mes + ' | falta ' + p.falta + (p.aMenos ? ' | a menos, pagou ' + p.pago : '') +
  (p.emAndamento ? ' | em andamento' : '');

/* As provas da regra de pendente. Rodam no core de verdade e nos venenos;
 * devolvem quantas falharam, sem mexer no placar quando é veneno. */
function provasDosPendentes(C, contar) {
  let f = 0;
  const c = contar ? conf : (r, o, e) => { if (JSON.stringify(o) !== JSON.stringify(e)) { f++; console.log('  (veneno reprovou) ' + r); } };
  const db = bancoComPagamentos(C);
  const lista = C.pendentesDePagamento(db, HOJE);
  c('pendentes: exatamente agosto do Alfa (a menos) e setembro do Alfa (em andamento)', lista.map(chave), [
    'Aluno Alfa Teste | 2026-08 | falta 40 | a menos, pagou 60',
    'Aluno Alfa Teste | 2026-09 | falta 100 | em andamento'
  ]);
  const aMenos = lista.filter(p => p.alunoId === ALFA && p.mes === '2026-08')[0];
  c('pago a menos: continua pendente, com a diferença', aMenos ? [aMenos.devido, aMenos.pago, aMenos.falta, aMenos.pagoEm] : null,
    [100, 60, 40, '2026-09-03']);
  c('mês de hoje: só o que já aconteceu (100, não 200)', (lista.filter(p => p.mes === '2026-09')[0] || {}).falta, 100);
  c('mês futuro (outubro) não é pendente', lista.some(p => p.mes === '2026-10'), false);
  c('a soma dos pendentes', C.somaDosPendentes(lista), { falta: 140, itens: 2, meses: 2, alunos: 1 });
  const sit = C.situacaoDoPagamento(db, C.calcularFechamento(db, ALFA, '2026-08', HOJE));
  c('situação do agosto do Alfa', [sit.devido, sit.pago, sit.falta], [100, 60, 40]);
  return f;
}

// ================================================================
secao('1. O valor que ela digita');
const LEITURAS = [['150', 150], ['150,5', 150.5], ['150,50', 150.5], ['1.250,00', 1250], ['R$ 90,00', 90],
  ['R$90', 90], ['150.50', 150.5], ['1.500', 1500], [' 75,3 ', 75.3], ['150,', 150], ['0,10', 0.1],
  ['abc', null], ['', null], ['10,999', null], ['-5', null], ['1,2,3', null], ['12.34.56', null], [null, null]];
LEITURAS.forEach(([t, v]) => conf('lerReais(' + JSON.stringify(t) + ')', Core.lerReais(t), v));
{
  const db = banco();
  const r = Core.marcarPagamento(db, ALFA, '2026-08', '2026-09-03', 0.1 + 0.2);
  conf('0,1 + 0,2 é guardado como 0.3, e não 0.30000000000000004', r && r.valor, 0.3);
  const g = Core.marcarPagamento(db, GAMA, '2026-08', '2026-09-05', 33.33 * 3);
  conf('33,33 vezes 3 é guardado como 99.99', g && g.valor, 99.99);
}

// ================================================================
secao('2. O valor proposto é o que o documento da família cobra');
{
  const db = banco();
  const setembro = Core.calcularFechamento(db, ALFA, '2026-09', HOJE);
  const agosto = Core.calcularFechamento(db, ALFA, '2026-08', HOJE);
  conf('setembro (com aula à frente): o que já aconteceu', Core.valorACobrarDoMes(setembro), 100);
  conf('e o mês inteiro seria outro número', setembro.totalValor, 200);
  conf('o texto da família cobra esse mesmo valor', Core.markdownFechamento(setembro).indexOf(Core.fmtMoeda(100)) >= 0, true);
  conf('agosto (vencido): o mês inteiro', Core.valorACobrarDoMes(agosto), 100);
  conf('sem fechamento, zero', Core.valorACobrarDoMes(null), 0);
}

// ================================================================
secao('3. Marcar, trocar o valor e desmarcar');
{
  const db = banco();
  const r1 = Core.marcarPagamento(db, ALFA, '2026-08', '2026-09-03', 100);
  conf('marcou: o registro tem o formato combinado', r1 && Object.keys(r1).sort(), ['alunoId', 'id', 'mes', 'pagoEm', 'valor']);
  conf('e mora em db.pagamentos', db.pagamentos.length, 1);
  const r2 = Core.marcarPagamento(db, ALFA, '2026-08', '2026-09-04', 85.5);
  conf('trocar o valor reaproveita o registro (mesmo id, um só)', [r2 && r2.id === r1.id, db.pagamentos.length], [true, 1]);
  conf('com o valor e a data novos', [db.pagamentos[0].valor, db.pagamentos[0].pagoEm], [85.5, '2026-09-04']);
  conf('valor zero não é pagamento', Core.marcarPagamento(db, BETA, '2026-08', '2026-09-04', 0), null);
  conf('valor negativo também não', Core.marcarPagamento(db, BETA, '2026-08', '2026-09-04', -10), null);
  conf('valor que não é número também não', Core.marcarPagamento(db, BETA, '2026-08', '2026-09-04', NaN), null);
  conf('data que não existe (30/02) não grava', Core.marcarPagamento(db, BETA, '2026-08', '2026-02-30', 10), null);
  conf('mês mal escrito não grava', Core.marcarPagamento(db, BETA, '2026-8', '2026-09-04', 10), null);
  conf('e nada disso entrou na lista', db.pagamentos.length, 1);
  conf('desmarcar devolve o registro tirado', (Core.desmarcarPagamento(db, ALFA, '2026-08') || {}).id, r1.id);
  conf('e a lista fica vazia', db.pagamentos.length, 0);
  conf('desmarcar o que não existe não quebra', Core.desmarcarPagamento(db, ALFA, '2026-08'), null);
  conf('um aluno e outro mês são registros separados', (() => {
    Core.marcarPagamento(db, ALFA, '2026-07', '2026-08-02', 200);
    Core.marcarPagamento(db, ALFA, '2026-08', '2026-09-03', 100);
    Core.marcarPagamento(db, BETA, '2026-08', '2026-09-03', 180);
    return db.pagamentos.length;
  })(), 3);
}

// ================================================================
secao('4. Os pendentes (o core de verdade)');
provasDosPendentes(Core, true);
{
  const db = banco();
  const lista = Core.pendentesDePagamento(db, HOJE);
  conf('sem pagamento nenhum: todo mês com valor a cobrar, até hoje', lista.map(chave), [
    'Aluno Alfa Teste | 2026-07 | falta 200',
    'Aluno Alfa Teste | 2026-08 | falta 100',
    'Aluno Beta Teste | 2026-08 | falta 180',
    'Aluno Gama Teste | 2026-08 | falta 99.99',
    'Aluno Alfa Teste | 2026-09 | falta 100 | em andamento'
  ]);
  conf('julho do Beta (só cancelada sem cobrança) não é pendente', lista.some(p => p.alunoId === BETA && p.mes === '2026-07'), false);
  conf('pago exato pelo texto "99,99" fecha o mês do Gama', Core.pendentesDePagamento(bancoComPagamentos(Core), HOJE)
    .some(p => p.alunoId === GAMA), false);
  conf('pago a mais (200 de 180) não deixa pendente nem dívida negativa',
    Core.situacaoDoPagamento(bancoComPagamentos(Core), Core.calcularFechamento(banco(), BETA, '2026-08', HOJE)).falta, 0);
}

// ================================================================
secao('5. Base antiga, sem o campo');
{
  const velho = banco();
  delete velho.pagamentos;
  conf('pagamentoDe não quebra', Core.pagamentoDe(velho, ALFA, '2026-08'), null);
  conf('pendentes lê como lista vazia de pagamentos', Core.pendentesDePagamento(velho, HOJE).length, 5);
  conf('marcar cria a lista', !!Core.marcarPagamento(velho, ALFA, '2026-08', '2026-09-03', 100) && velho.pagamentos.length, 1);
  conf('o store.js completa o campo ao ler, ao restaurar e ao voltar a um ponto',
    (() => {
      const fonte = fs.readFileSync(path.join(__dirname, '..', 'store.js'), 'utf8');
      return [
        /if \(!Array\.isArray\(d\.pagamentos\)\) d\.pagamentos = \[\];/.test(fonte),
        /return completar\(d\);/.test(fonte),
        /return completar\(pacote\.dados\);/.test(fonte),
        /return completar\(registro\.estado\);/.test(fonte)
      ];
    })(), [true, true, true, true]);
}

// ================================================================
secao('6. O documento da família não lê pagamento');
{
  const sem = banco();
  const com = bancoComPagamentos(Core);
  const fSem = Core.calcularFechamento(sem, ALFA, '2026-08', HOJE);
  const fCom = Core.calcularFechamento(com, ALFA, '2026-08', HOJE);
  const mdSem = Core.markdownFechamento(fSem, { exibirTemasEAreas: true });
  const mdCom = Core.markdownFechamento(fCom, { exibirTemasEAreas: true });
  conf('o texto sai igual, palavra por palavra', mdCom === mdSem, true);
  const pdfCom = textoDoPdf(PDFGen.gerarFechamento(fCom, { exibirTemasEAreas: true }));
  const pdfSem = textoDoPdf(PDFGen.gerarFechamento(fSem, { exibirTemasEAreas: true }));
  conf('o PDF lê (o instrumento vê o nome do aluno)', pdfCom.indexOf('Aluno Alfa Teste') >= 0, true);
  conf('o PDF sai igual', pdfCom === pdfSem, true);
  conf('e nenhum dos dois diz "pago"', /pago|pendente/i.test(mdCom + ' ' + pdfCom), false);
}

// ================================================================
secao('7. Os venenos: a regra estragada TEM de reprovar');
function coreEnvenenado(nome, trocas) {
  const arq = path.join(__dirname, '..', 'core.js');
  let fonte = fs.readFileSync(arq, 'utf8');
  for (const [de, para] of trocas) {
    const vezes = fonte.split(de).length - 1;
    conf(nome + ': o trecho a estragar está no core.js, uma vez só', vezes, 1);
    if (vezes !== 1) return null;
    fonte = fonte.replace(de, para);
  }
  const m = new Module(arq + '.' + nome, module);
  m.filename = arq;
  m.paths = module.paths;
  m._compile(fonte, arq);
  return m.exports;
}
{
  // esquece o "pago a menos": qualquer marca de pagamento conta como pago inteiro
  const C1 = coreEnvenenado('esquece-a-menos', [
    ['var pagoCent = registro ? centavos(registro.valor) : 0;', 'var pagoCent = registro ? devidoCent : 0;']
  ]);
  if (C1) {
    const f1 = provasDosPendentes(C1, false);
    conf('veneno "esquece o pago a menos": as provas reprovam', f1 > 0, true);
    conf('e a lista dele perde justamente o agosto do Alfa',
      C1.pendentesDePagamento(bancoComPagamentos(C1), HOJE).some(p => p.alunoId === ALFA && p.mes === '2026-08'), false);
  }
  // cobra o que ainda não aconteceu: o mês inteiro, e o mês futuro junto
  const C2 = coreEnvenenado('cobra-o-futuro', [
    ['var devidoCent = centavos(valorACobrarDoMes(f));', 'var devidoCent = centavos(f ? f.totalValor : 0);'],
    ['if (m > mesHoje) return;', '']
  ]);
  if (C2) {
    const f2 = provasDosPendentes(C2, false);
    conf('veneno "cobra o futuro": as provas reprovam', f2 > 0, true);
    conf('e a lista dele traz outubro, que ainda não aconteceu',
      C2.pendentesDePagamento(bancoComPagamentos(C2), HOJE).some(p => p.mes === '2026-10'), true);
  }
}

console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
