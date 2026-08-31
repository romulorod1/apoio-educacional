/* _simula_aluno.js
 * Simulação de um aluno real, de ponta a ponta, para olhar o fechamento com
 * olho de quem recebe: duas aulas por semana, 1h30 cada, mapeamento feito,
 * temas trabalhados aula a aula e áreas de desenvolvimento marcadas.
 */
const fs = require('fs');
const path = require('path');
const Core = require('../core.js');
const PDFGen = require('../pdf.js');

const ALUNO = {
  id: 'sim1',
  nome: 'Bernardo Vasconcellos',
  responsavel: 'Fernanda Vasconcellos',
  ativo: true,
  cor: '#1F3A5F',
  desde: '2026-03-09',
  anoEscolar: '09',
  precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 180 }],
  mapeamentos: [{
    id: 'm1', data: '2026-03-09', aulaId: null,
    escola: 'Colégio Santo Inácio', anoEscolar: '09', professor: 'Ricardo Salles',
    calendarioProvas: 'Trimestral, com duas provas e um trabalho por trimestre',
    indicacao: 'Indicação da mãe do Marcelo',
    motivo: 'Caiu de média no primeiro trimestre e entrou em recuperação de matemática.',
    expectativa: 'Recuperar a média até o fim do ano e chegar ao ensino médio sem buraco de base.',
    nivel: '2',
    prioridades: 'Fechar fatoração e produtos notáveis até o fim de setembro.\n' +
      'Criar rotina de revisão semanal, para ele parar de estudar só na véspera.',
    plano: 'O Bernardo entende o conceito novo com facilidade e pergunta bem, mas nunca ' +
      'consolidou fatoração, e no nono ano isso aparece em quase tudo: equação do segundo ' +
      'grau, simplificação de fração algébrica, semelhança. O plano é gastar as primeiras ' +
      'semanas na base sem deixar de acompanhar a prova do trimestre, e depois voltar ao ' +
      'conteúdo do ano com uma revisão semanal curta.',
    marcados: {
      fortes: ['raciocinio-ok', 'pergunta', 'pega-rapido', 'sozinho'],
      atencao: ['sinal', 'vespera', 'nao-confere', 'fora-do-modelo', 'ansiedade-prova'],
      lacunas: ['fatoracao', 'eq2', 'proporcao', 'algebrica'],
      rotina: ['lugar-calmo', 'material-completo', 'agenda-cheia'],
      aprende: ['visual', 'exemplo-regra']
    }
  }]
};

/* Terças e quintas de agosto de 2026, 1h30 por encontro. */
const TEMAS = {
  'MAT09-05': 'Produtos notáveis',
  'MAT09-06': 'Fatoração de polinômios',
  'MAT09-07': 'Equação do segundo grau',
  'MAT09-08': 'Sistemas do segundo grau',
  'MAT09-11': 'Semelhança de triângulos'
};
function tema(id, partes, qtd) {
  return { id: id, titulo: TEMAS[id], lingua: 'pt', partes: partes, exercicios: qtd };
}

const ENCONTROS = [
  { data: '2026-08-04', temas: [tema('MAT09-05', ['material', 'lista'], 9)],
    areas: ['base', 'linguagem', 'metodo'],
    nota: 'Retomada de produtos notáveis. Ele lembrava do quadrado da soma, mas aplicava sem ' +
      'enxergar o padrão. Trabalhamos o reconhecimento antes da conta.' },
  { data: '2026-08-11', temas: [tema('MAT09-06', ['material', 'lista'], 10)],
    areas: ['base', 'linguagem', 'persistencia'],
    nota: 'Entrada em fatoração. Fator comum e agrupamento. Travou no agrupamento e voltamos ' +
      'duas vezes ao mesmo exemplo até ele fazer sozinho.' },
  { data: '2026-08-13', temas: [tema('MAT09-06', ['lista'], 8)],
    areas: ['base', 'analise-erros', 'confianca'],
    nota: 'Corrigimos a lista da aula anterior questão a questão. Ele identificou sozinho três ' +
      'dos quatro erros, o que não acontecia em julho.' },
  { data: '2026-08-18', temas: [tema('MAT09-06', ['lista'], 6), tema('MAT09-07', ['material'], 0)],
    areas: ['base', 'raciocinio', 'metodo'],
    nota: 'Fechamos fatoração e abrimos equação do segundo grau, mostrando que a fatoração ' +
      'resolve boa parte das equações sem precisar da fórmula.' },
  { data: '2026-08-20', temas: [tema('MAT09-07', ['material', 'lista'], 9)],
    areas: ['raciocinio', 'enunciado', 'tempo'],
    nota: 'Equação do segundo grau por fatoração e por fórmula. Ele quer sempre a fórmula: ' +
      'trabalhamos quando cada caminho é mais rápido.' },
  { data: '2026-08-25', temas: [tema('MAT09-07', ['lista', 'gabarito'], 8)],
    areas: ['estrategia-prova', 'revisao', 'ansiedade'],
    nota: 'Simulado curto com tempo marcado, no formato da prova do colégio. Conversamos sobre ' +
      'ordem de resolução e sobre não travar na primeira questão difícil.' },
  { data: '2026-08-27', temas: [tema('MAT09-08', ['material', 'lista'], 7)],
    areas: ['raciocinio', 'enunciado'],
    nota: 'Sistemas do segundo grau. Boa aula: ele montou os dois primeiros sistemas sozinho, ' +
      'a partir do enunciado, sem pedir ajuda.' },
  { data: '2026-08-28', temas: [tema('MAT09-11', ['material'], 0)],
    areas: ['base', 'priorizacao'],
    nota: 'Reposição da aula do dia 06 de agosto. Abertura de semelhança de triângulos, que ' +
      'cai na próxima prova.', status: 'reposicao' }
];

const db = { alunos: [ALUNO], series: [], aulas: [], resumos: [] };
ENCONTROS.forEach(function (e, i) {
  db.aulas.push({
    id: 'aula' + i, alunoId: ALUNO.id, serieId: null, destacada: false,
    data: e.data, hora: e.data === '2026-08-28' ? '10:00' : '17:00',
    duracaoMin: 90,
    status: e.status || 'realizada', cobravel: true,
    notaTexto: e.nota, temNota: true, anexos: [],
    areas: e.areas, temas: e.temas
  });
});

/* A aula desmarcada com aviso, que e o que acontece de verdade num mes. Ela
   ocupa o lugar da aula daquele dia, nao se soma a ela: por isso 06/08 aparece
   uma vez so, e a reposicao vai para o dia 28. */
db.aulas.push({
  id: 'aulaX', alunoId: ALUNO.id, serieId: null, destacada: false,
  data: '2026-08-06', hora: '17:00', duracaoMin: 90,
  status: 'cancelada', cobravel: false,
  notaTexto: 'Cancelada com aviso na véspera, prova de história no dia seguinte. Reposta em 28/08.',
  temNota: true, anexos: [], areas: [], temas: []
});

db.resumos.push({
  alunoId: ALUNO.id, mes: '2026-08',
  texto: 'Agosto foi o mês em que a base começou a fechar. O Bernardo entrou no mês sem ' +
    'segurança em fatoração, que era a lacuna mais cara do diagnóstico de março, e sai ' +
    'fatorando por fator comum, agrupamento e diferença de quadrados sem precisar de apoio. ' +
    'Isso abriu caminho para a equação do segundo grau, que ele hoje resolve pelos dois ' +
    'caminhos e já escolhe o mais curto.\n\n' +
    'O ganho maior, porém, não foi de conteúdo. Na aula do dia 13 ele encontrou sozinho três ' +
    'dos quatro erros da própria lista, o que não acontecia antes, e no simulado do dia 25 ' +
    'terminou dentro do tempo sem travar na primeira questão difícil. São os dois pontos que ' +
    'mais pesavam contra ele em prova.\n\n' +
    'Para setembro: fechar semelhança de triângulos antes da prova do trimestre e manter a ' +
    'revisão semanal curta, que é o que sustenta o que já foi conquistado. Sigo atenta aos ' +
    'erros de sinal, que caíram bastante mas ainda aparecem quando ele acelera.'
});

const f = Core.calcularFechamento(db, ALUNO.id, '2026-08');

console.log('=== o que a simulação produziu ===');
console.log('encontros no mês  :', f.linhas.length);
console.log('horas cobradas    :', f.totalHoras, 'h');
console.log('valor             :', Core.fmtMoeda(f.totalValor));
console.log('temas distintos   :', f.temasDoMes.length);
console.log('áreas distintas   :', f.areasDoMes.length);
console.log('');
f.temasDoMes.forEach(function (t) {
  console.log('  tema  ' + t.titulo + ' (' + t.datas.length + ')');
});
f.areasDoMes.forEach(function (a) {
  console.log('  área  ' + a.rotulo + ' (' + a.vezes + ')');
});

const bytes = PDFGen.gerarFechamento(f, { sempreResumo: true });
const destino = process.argv[2] || path.join(__dirname, 'saida_simulacao.pdf');
fs.writeFileSync(destino, bytes);
fs.writeFileSync(path.join(__dirname, 'saida_simulacao.md'), Core.markdownFechamento(f, {}), 'utf8');
console.log('\nPDF em: ' + destino + '  (' + Math.round(bytes.length / 1024) + ' KB)');
