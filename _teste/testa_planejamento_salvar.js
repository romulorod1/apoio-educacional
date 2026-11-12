/* testa_planejamento_salvar.js (projeto IA no app, fase 2; Node, sem navegador)
 *
 * O "Salvar na ficha" do planejamento (salvarPlanoNaFicha, no app.js), com a
 * gravação PENDENTE: a função é tirada do app.js de verdade e roda com um
 * salvarEDepois falso, que só responde quando a prova manda.
 *
 * O defeito que esta prova trava (segunda mão da romul-ac, 12/11/2026): o
 * segundo pedido de salvar chegava com o primeiro pendente e era descartado,
 * e a volta do primeiro zerava o "mudou" sem conferir. Ela trocava o aluno no
 * meio, a ficha ficava com o aluno velho e a tela dizia "Salvo".
 *
 * Dos dois lados:
 *   - toque duplo sem mudança no meio: UMA gravação, um registro, "Salvo";
 *   - mudança no meio (o aluno): a volta grava DE NOVO, com o mesmo id, e só
 *     depois da segunda volta a tela diz "Salvo"; a ficha fica com o aluno
 *     novo.
 *
 * Veneno, que TEM de reprovar:
 *   --envenenado-zera-sem-comparar   a volta não compara o plano gravado com o
 *                                    da tela (o código de antes).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const VENENO = process.argv.indexOf('--envenenado-zera-sem-comparar') >= 0;
let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK    ' : '  FALHA ') + rotulo + (ok ? '' : '  [obtido: ' + JSON.stringify(obtido) + ' | esperado: ' + JSON.stringify(esperado) + ']'));
}
function prop(rotulo, ok) {
  if (VENENO) return conf('VENENO visto: ' + rotulo + ', e quebrou', ok, false);
  return conf(rotulo, ok, true);
}

const APP = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const ANCORA = '        var igual = JSON.stringify(registro.plano) === JSON.stringify(p.plano);';
conf('a âncora do veneno está uma vez só no app.js', APP.split(ANCORA).length, 2);
const FONTE = VENENO ? APP.split(ANCORA).join('        var igual = true;') : APP;
const ini = FONTE.indexOf('  function salvarPlanoNaFicha(p, calado) {');
conf('achei o salvarPlanoNaFicha', ini >= 0, true);
const fim = FONTE.indexOf('\n  }\n', ini) + 4;
const CORPO = FONTE.slice(ini, fim);

/* Um ambiente novo: o banco, o botão, os avisos e as gravações pendentes. */
function ambiente() {
  const pendentes = [], avisos = [];
  const botao = { textContent: 'Salvar na ficha', disabled: false };
  const p = { plano: { alunoId: 'al1', tratamento: 'Aluna', grade: ['A'] }, salvando: false, salvoId: null, idParaSalvar: null, mudouDesdeSalvar: true, estado: 'previa' };
  let n = 0;
  const amb = {
    db: { ajustes: {} }, PREFIXO_PLANEJAMENTO: 'planejamento:', modoCelular: false,
    $: s => (s === '#plan-salvar' ? botao : null), avisar: t => avisos.push(t),
    alunoPorId: id => ({ id, nome: id === 'al1' ? 'Zélia Teste' : 'Bruno Teste' }), redesenharSecoesDePlanejamento: () => {},
    Core: { uid: () => 'id' + (++n) }, Planejamento: { primeiroNome: s => String(s).split(' ')[0] },
    salvarEDepois: depois => new Promise(r => pendentes.push(() => { depois(true); r(); })),
    comoAcaoDoCelular: f => f(), fluxoPlano: p
  };
  const salvar = new Function(...Object.keys(amb), CORPO + '\nreturn salvarPlanoNaFicha;')(...Object.values(amb));
  return { amb, p, salvar, pendentes, avisos, botao };
}

console.log('\n=== toque duplo sem mudança no meio: uma gravação, um registro ===');
{
  const a = ambiente();
  a.salvar(a.p, false);
  a.salvar(a.p, false);
  conf('com o primeiro pendente, o segundo não grava outro registro', [Object.keys(a.amb.db.ajustes).length, a.pendentes.length], [1, 1]);
  a.pendentes.shift()();
  conf('na volta, nada mudou: não grava de novo, e a tela diz "Salvo"', [a.pendentes.length, a.p.mudouDesdeSalvar, a.p.salvando, a.botao.textContent], [0, false, false, 'Salvo na ficha']);
  conf('um aviso só', a.avisos, ['Planejamento salvo na ficha de Zélia.']);
}

console.log('\n=== mudança no meio (o aluno): grava de novo, com o mesmo id ===');
{
  const a = ambiente();
  a.salvar(a.p, false);
  a.p.plano.alunoId = 'al2';  // a troca de aluno com o salvar pendente
  a.p.mudouDesdeSalvar = true;
  a.salvar(a.p, true);        // o salvar automático (ou o compartilhar)
  a.pendentes.shift()();
  prop('na volta da primeira, o plano mudou: uma SEGUNDA gravação saiu', a.pendentes.length === 1);
  prop('e a tela ainda não diz "Salvo" (o mudou continua)', a.p.mudouDesdeSalvar === true && a.botao.textContent !== 'Salvo na ficha');
  if (a.pendentes.length) a.pendentes.shift()();
  const reg = a.amb.db.ajustes['planejamento:id1'];
  prop('no fim, um registro só, com o MESMO id, e com o aluno novo', Object.keys(a.amb.db.ajustes).length === 1 && !!reg && reg.alunoId === 'al2');
  // (no veneno a tela também diz Salvo, mas cedo e com o aluno velho: as três de cima é que o pegam)
  if (!VENENO) conf('e só então a tela diz "Salvo"', a.p.mudouDesdeSalvar === false && a.botao.textContent === 'Salvo na ficha' && a.p.salvando === false, true);
}

console.log('\n' + passes + ' verificacoes passaram, ' + falhas + ' falharam');
process.exit(falhas ? 1 : 0);
