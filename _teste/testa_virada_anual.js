/* Proposta de série da T11: nenhuma alteração de cadastro nesta etapa. */
'use strict';
const assert = require('node:assert/strict');
const Core = require('../core');

const escada = ['02', '03', '04', '05', '06', '07', '08', '09', 'em1', 'em2', 'em3'];
for (let i = 0; i < escada.length - 1; i++) {
  assert.deepEqual(Core.sugerirAnoEscolarSeguinte(escada[i]), {
    anterior: escada[i], sugerido: escada[i + 1], acao: 'avancar'
  });
}
assert.deepEqual(Core.sugerirAnoEscolarSeguinte('em3'), {
  anterior: 'em3', sugerido: 'em3', acao: 'concluir-ou-revisar'
});
for (const ano of ['', 'cursinho', 'fora', 'outro', '99']) {
  assert.deepEqual(Core.sugerirAnoEscolarSeguinte(ano), {
    anterior: ano, sugerido: ano, acao: 'revisar'
  });
}

const aluno = {
  anoEscolar: '07', mapeamentos: [{ data: '2026-03-10', escola: 'Escola Teste', anoEscolar: '07' }],
  historicoAnoEscolar: [
    { anoLetivo: 2026, anoEscolar: '07', anoEscolarOutro: '' },
    { anoLetivo: 2027, anoEscolar: '08', anoEscolarOutro: '' }
  ]
};
assert.equal(Core.contextoEscolarDe(aluno, '2026-12'), '7º ano, Escola Teste');
assert.equal(Core.contextoEscolarDe(aluno, '2027-01'), '8º ano, Escola Teste');
assert.equal(Core.contextoEscolarDe(aluno, '2028-06'), '8º ano, Escola Teste');
assert.equal(Core.contextoEscolarDe(aluno, '2025-06'), '7º ano, Escola Teste');
assert.equal(Core.anoEscolarRegistradoEm(aluno, '2026-12').anoEscolar, '07');
assert.equal(Core.anoEscolarRegistradoEm(aluno, '2027-01').anoEscolar, '08');
assert.equal(Core.contextoEscolarDe({ anoEscolar: '09' }, '2027-01'), '9º ano');
const alunoRelatorio = Object.assign({ id: 'teste', nome: 'Aluno Teste', precos: [] }, aluno);
const banco = {
  alunos: [alunoRelatorio],
  aulas: [
    { id: 'aula-2026', alunoId: 'teste', data: '2026-06-10', duracaoMin: 60, status: 'realizada', cobravel: false },
    { id: 'aula-2027', alunoId: 'teste', data: '2027-06-10', duracaoMin: 60, status: 'realizada', cobravel: false }
  ],
  resumos: []
};
assert.equal(Core.calcularFechamento(banco, 'teste', '2026-06', '2027-08-01').contextoEscolar,
  '7º ano, Escola Teste');
assert.equal(Core.calcularFechamento(banco, 'teste', '2027-06', '2027-08-01').contextoEscolar,
  '8º ano, Escola Teste');

const previaDb = {
  ajustes: { ultimoAnoLetivoAtualizado: 2026 },
  alunos: [
    { id: 'b', nome: 'Bruna', anoEscolar: '09', ativo: true },
    { id: 'a', nome: 'Álvaro', anoEscolar: 'em3', ativo: true },
    { id: 'c', nome: 'Carlos', anoEscolar: '07', ativo: false },
    { id: 'd', nome: 'Davi', anoEscolar: '', ativo: true }
  ]
};
const antesDaPrevia = JSON.stringify(previaDb);
const previa = Core.prepararViradaAnual(previaDb, 2027);
assert.deepEqual(previa.linhas.map(x => x.nome), ['Álvaro', 'Bruna', 'Davi']);
assert.deepEqual(previa.linhas.map(x => x.sugerido), ['em3', 'em1', '']);
assert.deepEqual(previa.linhas.map(x => x.acao), ['concluir-ou-revisar', 'avancar', 'revisar']);
assert.equal(JSON.stringify(previaDb), antesDaPrevia, 'a prévia não modifica o banco');
assert.equal(Core.prepararViradaAnual(previaDb, 2026).erro, 'ja-atualizado');
assert.equal(Core.prepararViradaAnual(previaDb, 2026, { forcar: true }).erro, undefined);
assert.equal(Core.prepararViradaAnual(previaDb, 'ano errado').erro, 'ano-invalido');

const escolhas = {
  a: { acao: 'encerrar' },
  b: { acao: 'atualizar', anoEscolar: 'em1' },
  d: { acao: 'manter' }
};
assert.equal(Core.aplicarViradaAnual(previaDb, 2027, { a: escolhas.a }).erro, 'escolha-pendente');
const aplicada = Core.aplicarViradaAnual(previaDb, 2027, escolhas);
assert.equal(aplicada.erro, undefined);
assert.equal(JSON.stringify(previaDb), antesDaPrevia, 'a aplicação pura não altera o banco original');
assert.equal(aplicada.db.ajustes.ultimoAnoLetivoAtualizado, 2027);
assert.equal(aplicada.db.alunos.find(x => x.id === 'a').ativo, false);
assert.equal(aplicada.db.alunos.find(x => x.id === 'b').anoEscolar, 'em1');
assert.equal(aplicada.db.alunos.find(x => x.id === 'c').anoEscolar, '07');
assert.equal(Core.contextoEscolarDe(aplicada.db.alunos.find(x => x.id === 'b'), '2026-06'), '9º ano');
assert.equal(Core.contextoEscolarDe(aplicada.db.alunos.find(x => x.id === 'b'), '2027-06'),
  '1º ano do médio');
assert.equal(Core.aplicarViradaAnual(aplicada.db, 2027, escolhas).erro, 'ja-atualizado');

const comMapa = {
  ajustes: { ultimoAnoLetivoAtualizado: 2026 },
  alunos: [{ id: 'x', nome: 'X', anoEscolar: '06', mapeamentos: [
    { id: 'm1', data: '2024-03-01', anoEscolar: '05' },
    { id: 'm2', data: '2026-03-01', anoEscolar: '06' }
  ] }],
  series: [{ id: 's1', alunoId: 'x', inicio: '2026-01-01', fim: null }]
};
const antesComMapa = JSON.stringify(comMapa);
const avancado = Core.aplicarViradaAnual(comMapa, 2027, { x: { acao: 'atualizar', anoEscolar: '07' } });
assert.equal(avancado.db.alunos[0].mapeamentos[0].anoEscolar, '05');
assert.equal(avancado.db.alunos[0].mapeamentos[1].anoEscolar, '07');
assert.equal(avancado.db.series[0].fim, null, 'avanço não interrompe recorrência');
assert.equal(JSON.stringify(comMapa), antesComMapa, 'mapas e séries de origem permanecem intactos');

console.log('16 sugestões, 9 contextos, 6 invariantes da prévia e 14 da aplicação verificados.');
