/* testa_fechamento_ordem_alfabetica.js
 * Teste unitario para garantir que a listagem de alunos no Fechamento
 * e calculada em ordem alfabetica (A a Z) pelo nome do aluno,
 * conforme solicitado para facilitar a localizacao no fim do mes.
 */
const Core = require('../core.js');

let passes = 0, falhas = 0;
const erros = [];

function conf(rotulo, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (ok) {
    passes++;
    console.log('  OK    | ' + rotulo);
  } else {
    falhas++;
    const msg = '  FALHA | ' + rotulo + ' | obtido: ' + JSON.stringify(obtido) + ' | esperado: ' + JSON.stringify(esperado);
    console.error(msg);
    erros.push(msg);
  }
}

function secao(t) {
  console.log('\n=== ' + t + ' ===');
}

secao('1. Ordenacao alfabetica basica de alunos');

const db1 = {
  alunos: [
    { id: 'aluno-z', nome: 'Zulmira Santos', precos: [{ valorHora: 100, desde: '2026-01-01' }] },
    { id: 'aluno-b', nome: 'Bruna Lima', precos: [{ valorHora: 120, desde: '2026-01-01' }] },
    { id: 'aluno-c', nome: 'Carlos Souza', precos: [{ valorHora: 90, desde: '2026-01-01' }] },
    { id: 'aluno-a', nome: 'Ana Costa', precos: [{ valorHora: 150, desde: '2026-01-01' }] }
  ],
  aulas: [
    { id: 'aula-1', alunoId: 'aluno-z', data: '2026-06-05', duracaoMinutos: 60, status: 'realizada' },
    { id: 'aula-2', alunoId: 'aluno-b', data: '2026-06-06', duracaoMinutos: 60, status: 'realizada' },
    { id: 'aula-3', alunoId: 'aluno-c', data: '2026-06-07', duracaoMinutos: 60, status: 'realizada' },
    { id: 'aula-4', alunoId: 'aluno-a', data: '2026-06-08', duracaoMinutos: 60, status: 'realizada' }
  ]
};

const res1 = Core.calcularMesInteiro(db1, '2026-06', '2026-06-15');
const nomes1 = res1.map(function (f) { return f.alunoNome; });

conf('quatro alunos retornados', nomes1.length, 4);
conf('ordem alfabetica A a Z respeitada', nomes1, [
  'Ana Costa',
  'Bruna Lima',
  'Carlos Souza',
  'Zulmira Santos'
]);

secao('2. Independencia de valores financeiros e contagem de aulas');

/* Aluno Z tem muito mais aulas e valor maior, mas deve vir por ultimo */
const db2 = {
  alunos: [
    { id: 'aluno-z', nome: 'Zeca Pagodinho', precos: [{ valorHora: 500, desde: '2026-01-01' }] },
    { id: 'aluno-m', nome: 'Mariana Silva', precos: [{ valorHora: 50, desde: '2026-01-01' }] },
    { id: 'aluno-a', nome: 'Alice Matos', precos: [{ valorHora: 80, desde: '2026-01-01' }] }
  ],
  aulas: [
    { id: 'aula-z1', alunoId: 'aluno-z', data: '2026-06-01', duracaoMinutos: 120, status: 'realizada' },
    { id: 'aula-z2', alunoId: 'aluno-z', data: '2026-06-08', duracaoMinutos: 120, status: 'realizada' },
    { id: 'aula-z3', alunoId: 'aluno-z', data: '2026-06-15', duracaoMinutos: 120, status: 'realizada' },
    { id: 'aula-m1', alunoId: 'aluno-m', data: '2026-06-02', duracaoMinutos: 60, status: 'realizada' },
    { id: 'aula-a1', alunoId: 'aluno-a', data: '2026-06-03', duracaoMinutos: 60, status: 'realizada' }
  ]
};

const res2 = Core.calcularMesInteiro(db2, '2026-06', '2026-06-20');
const nomes2 = res2.map(function (f) { return f.alunoNome; });

conf('ordem estritamente alfabetica independente do montante financeiro', nomes2, [
  'Alice Matos',
  'Mariana Silva',
  'Zeca Pagodinho'
]);

secao('3. Acentos e colacao em portugues (pt-BR)');

const db3 = {
  alunos: [
    { id: 'aluno-alv', nome: 'Álvaro Dias', precos: [{ valorHora: 100, desde: '2026-01-01' }] },
    { id: 'aluno-ana', nome: 'Ana Beatriz', precos: [{ valorHora: 100, desde: '2026-01-01' }] },
    { id: 'aluno-eri', nome: 'Érica Cristina', precos: [{ valorHora: 100, desde: '2026-01-01' }] },
    { id: 'aluno-edu', nome: 'Eduardo Pereira', precos: [{ valorHora: 100, desde: '2026-01-01' }] }
  ],
  aulas: [
    { id: 'a1', alunoId: 'aluno-alv', data: '2026-06-01', duracaoMinutos: 60, status: 'realizada' },
    { id: 'a2', alunoId: 'aluno-ana', data: '2026-06-02', duracaoMinutos: 60, status: 'realizada' },
    { id: 'a3', alunoId: 'aluno-eri', data: '2026-06-03', duracaoMinutos: 60, status: 'realizada' },
    { id: 'a4', alunoId: 'aluno-edu', data: '2026-06-04', duracaoMinutos: 60, status: 'realizada' }
  ]
};

const res3 = Core.calcularMesInteiro(db3, '2026-06', '2026-06-20');
const nomes3 = res3.map(function (f) { return f.alunoNome; });

/* Em pt-BR: Álvaro e Ana agrupados no A, Eduardo e Érica no E */
conf('Álvaro e Ana ordenados corretamente com acento pt-BR', nomes3[0].startsWith('A') || nomes3[0].startsWith('Á'), true);
conf('ordem correta de todas as quatro entradas com acento', nomes3, [
  'Álvaro Dias',
  'Ana Beatriz',
  'Eduardo Pereira',
  'Érica Cristina'
]);

secao('4. Nomes identicos com desempate por identificador');

const db4 = {
  alunos: [
    { id: 'aluno-02', nome: 'Lucas Silva', precos: [{ valorHora: 100, desde: '2026-01-01' }] },
    { id: 'aluno-01', nome: 'Lucas Silva', precos: [{ valorHora: 100, desde: '2026-01-01' }] }
  ],
  aulas: [
    { id: 'a1', alunoId: 'aluno-02', data: '2026-06-01', duracaoMinutos: 60, status: 'realizada' },
    { id: 'a2', alunoId: 'aluno-01', data: '2026-06-02', duracaoMinutos: 60, status: 'realizada' }
  ]
};

const res4 = Core.calcularMesInteiro(db4, '2026-06', '2026-06-20');
const ids4 = res4.map(function (f) { return f.aluno.id; });

conf('desempate estavel por id quando nomes sao iguais', ids4, ['aluno-01', 'aluno-02']);

secao('5. Alunos sem aulas no mes nao entram no fechamento');

const db5 = {
  alunos: [
    { id: 'a-ativo', nome: 'Beatriz Ramos', precos: [{ valorHora: 100, desde: '2026-01-01' }] },
    { id: 'a-inativo', nome: 'Amanda Nunes', precos: [{ valorHora: 100, desde: '2026-01-01' }] }
  ],
  aulas: [
    { id: 'a1', alunoId: 'a-ativo', data: '2026-06-10', duracaoMinutos: 60, status: 'realizada' }
  ]
};

const res5 = Core.calcularMesInteiro(db5, '2026-06', '2026-06-20');
conf('apenas aluno com aulas no mes e retornado', res5.length, 1);
conf('aluno retornado e o ativo', res5[0].alunoNome, 'Beatriz Ramos');

console.log('\n============================================================');
console.log(passes + ' verificacoes passaram, ' + falhas + ' falharam.');
console.log('============================================================');

if (falhas > 0) {
  process.exit(1);
}
