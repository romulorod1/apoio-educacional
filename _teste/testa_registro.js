/* testa_registro.js
 * Áreas trabalhadas, mais de um tema por aula e divisão de aula em duas.
 * Roda no Node, direto contra o core, sem navegador.
 */
const Core = require('../core.js');

let falhas = 0, passes = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

function bancoDeProva() {
  return {
    alunos: [{
      id: 'al1', nome: 'Marcelo', responsavel: 'mãe do Marcelo', ativo: true,
      precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 100 }]
    }],
    series: [],
    resumos: [],
    aulas: [
      {
        id: 'a1', alunoId: 'al1', data: '2026-06-01', hora: '15:30', duracaoMin: 90,
        status: 'realizada', cobravel: true, serieId: null, destacada: false, anexos: [],
        areas: ['autonomia', 'cronograma'],
        temas: [
          { id: 'MAT08-03', titulo: 'Equações do primeiro grau', lingua: 'pt', partes: ['material', 'lista'], exercicios: 8 }
        ]
      },
      {
        id: 'a2', alunoId: 'al1', data: '2026-06-03', hora: '15:30', duracaoMin: 60,
        status: 'realizada', cobravel: true, serieId: null, destacada: false, anexos: [],
        areas: ['autonomia', 'ansiedade'],
        temas: [
          { id: 'MAT08-03', titulo: 'Equações do primeiro grau', lingua: 'pt', partes: ['lista'], exercicios: 5 },
          { id: 'MAT08-04', titulo: 'Sistemas de duas equações', lingua: 'pt', partes: ['material'], exercicios: 0 }
        ]
      },
      {
        id: 'a3', alunoId: 'al1', data: '2026-06-05', hora: '15:30', duracaoMin: 60,
        status: 'realizada', cobravel: true, serieId: null, destacada: false, anexos: []
      }
    ]
  };
}

// ================================================================
secao('1. Catálogo de áreas');

const todas = [];
Core.AREAS.forEach(g => g.itens.forEach(i => todas.push(i.id)));
conf('há grupos de áreas', Core.AREAS.length >= 3, true);
conf('e itens suficientes para dar robustez', todas.length >= 20, true);
conf('nenhum id repetido', new Set(todas).size, todas.length);
conf('todo item tem rótulo', Core.AREAS.every(g => g.itens.every(i => i.rotulo && i.rotulo.length > 3)), true);
conf('as que ela pediu estão lá',
  ['autonomia', 'horarios', 'cronograma', 'priorizacao', 'disciplina', 'frustracao', 'ansiedade']
    .every(id => Core.rotuloArea(id)), true);
conf('id desconhecido não devolve rótulo', Core.rotuloArea('inexistente'), '');
const textoAreas = JSON.stringify(Core.AREAS);
conf('nenhum travessão no catálogo', /[–—]/.test(textoAreas), false);

// ================================================================
secao('2. Vários temas na mesma aula');

conf('lê a lista nova', Core.temasDaAula({ temas: [{ id: 'x' }, { id: 'y' }] }).length, 2);
conf('lê o campo antigo, de um tema só', Core.temasDaAula({ tema: { id: 'x' } }).length, 1);
conf('aula sem tema devolve lista vazia', Core.temasDaAula({}).length, 0);
conf('a lista devolvida é uma cópia',
  (() => { const a = { temas: [{ id: 'x' }] }; Core.temasDaAula(a).push({ id: 'y' }); return a.temas.length; })(), 1);

// ================================================================
secao('3. Fechamento com temas e áreas');

let db = bancoDeProva();
let f = Core.calcularFechamento(db, 'al1', '2026-06');

conf('três aulas no mês', f.linhas.length, 3);
conf('dois temas distintos no mês', f.temasDoMes.length, 2);
conf('o tema repetido aparece uma vez só, com as duas datas',
  f.temasDoMes.find(t => t.titulo === 'Equações do primeiro grau').datas.join(','),
  '2026-06-01,2026-06-03');
conf('o segundo tema tem a sua data',
  f.temasDoMes.find(t => t.titulo === 'Sistemas de duas equações').datas.join(','), '2026-06-03');

conf('três áreas distintas', f.areasDoMes.length, 3);
conf('a mais frequente vem primeiro', f.areasDoMes[0].id, 'autonomia');
conf('com a contagem certa', f.areasDoMes[0].vezes, 2);
conf('e as demais aparecem uma vez',
  f.areasDoMes.filter(a => a.vezes === 1).length, 2);
conf('cada área sai com rótulo legível', f.areasDoMes.every(a => a.rotulo.length > 3), true);

// área que não existe mais no catálogo não polui o fechamento
db.aulas[2].areas = ['area-que-nao-existe'];
f = Core.calcularFechamento(db, 'al1', '2026-06');
conf('área desconhecida é ignorada', f.areasDoMes.length, 3);

// ================================================================
secao('4. O fechamento em Markdown');

/* As duas listas, temas e áreas, só saem quando ela manda exibir. Foi decisão
 * dela: hoje o que usa é a agenda, o valor a receber e o texto do fechamento, e
 * o registro de assunto está começando a ser explorado. Aqui o teste pede as
 * listas de propósito, para conferir o conteúdo delas; o padrão está logo
 * abaixo, na seção 4b. */
const md = Core.markdownFechamento(f, { incluirNotas: false, exibirTemasEAreas: true });
conf('tem a seção de temas', md.indexOf('## Temas trabalhados') >= 0, true);
conf('com o tema e as datas', md.indexOf('- Equações do primeiro grau (01/06, 03/06)') >= 0, true);
conf('tem a seção de áreas', md.indexOf('## Áreas trabalhadas') >= 0, true);
conf('marca quantas aulas quando repete', md.indexOf('(2 aulas)') >= 0, true);
conf('e não marca quando foi uma só', md.indexOf('Ansiedade ou medo de prova\n') >= 0 ||
  md.indexOf('- Ansiedade ou medo de prova') >= 0, true);
conf('o feedback continua depois disso',
  md.indexOf('## Áreas trabalhadas') < md.indexOf('## Feedback'), true);
conf('nenhum travessão no fechamento', /[–—]/.test(md), false);

const dbVazio = bancoDeProva();
dbVazio.aulas.forEach(a => { delete a.temas; delete a.areas; });
const mdVazio = Core.markdownFechamento(Core.calcularFechamento(dbVazio, 'al1', '2026-06'), {});
conf('sem temas, a seção não aparece', mdVazio.indexOf('## Temas trabalhados') >= 0, false);
conf('sem áreas, a seção não aparece', mdVazio.indexOf('## Áreas trabalhadas') >= 0, false);
conf('e o fechamento continua completo', mdVazio.indexOf('## Feedback') >= 0, true);

// ================================================================
secao('4b. Por padrão o documento não leva as duas listas');

/* O documento que a família recebe só ganha a lista de assuntos e a de áreas
 * quando ela marca a caixa no cartão do fechamento. Enquanto não marcar, ele
 * leva a tabela de aulas, o total e o feedback dela, que é o que ele já levava
 * antes de o registro de assunto existir. */
const mdPadrao = Core.markdownFechamento(f, { incluirNotas: false });
conf('sem pedir, a seção de temas não sai', mdPadrao.indexOf('## Temas trabalhados') >= 0, false);
conf('sem pedir, a seção de áreas não sai', mdPadrao.indexOf('## Áreas trabalhadas') >= 0, false);
conf('mas o feedback continua saindo', mdPadrao.indexOf('## Feedback') >= 0, true);
conf('e a tabela de aulas também', mdPadrao.indexOf('**Aluno:**') >= 0, true);
conf('pedindo, as duas voltam',
  md.indexOf('## Temas trabalhados') >= 0 && md.indexOf('## Áreas trabalhadas') >= 0, true);

// ================================================================
secao('5. Dividir a aula em duas');

db = bancoDeProva();
const antesDoTotal = Core.calcularFechamento(db, 'al1', '2026-06').totalValor;
const marca = Core.dividirAula(db, 'a1');

conf('virou duas aulas', db.aulas.filter(a => a.data === '2026-06-01').length, 2);
conf('a primeira ficou com metade', db.aulas.find(a => a.id === 'a1').duracaoMin, 45);
conf('a segunda começa quando a primeira termina',
  db.aulas.find(a => a.id === marca.novaId).hora, '16:15');
conf('e tem a outra metade', db.aulas.find(a => a.id === marca.novaId).duracaoMin, 45);
conf('a segunda nasce sem tema', Core.temasDaAula(db.aulas.find(a => a.id === marca.novaId)).length, 0);
conf('e sem área marcada', db.aulas.find(a => a.id === marca.novaId).areas.length, 0);
conf('o tema fica na primeira', Core.temasDaAula(db.aulas.find(a => a.id === 'a1')).length, 1);

const depois = Core.calcularFechamento(db, 'al1', '2026-06');
conf('o valor do mês não muda com a divisão', depois.totalValor, antesDoTotal);
conf('nem o total de minutos', depois.totalMin, Core.calcularFechamento(bancoDeProva(), 'al1', '2026-06').totalMin);

conf('desfazer devolve ao estado anterior', Core.desfazerDivisao(db, marca), true);
conf('e some com a segunda aula', db.aulas.filter(a => a.data === '2026-06-01').length, 1);
conf('com a duração original', db.aulas.find(a => a.id === 'a1').duracaoMin, 90);
conf('o valor volta ao mesmo', Core.calcularFechamento(db, 'al1', '2026-06').totalValor, antesDoTotal);

secao('6. A divisão dentro de uma repetição');

db = bancoDeProva();
db.aulas[0].serieId = 's1';
db.series.push({ id: 's1', alunoId: 'al1', dias: [1], hora: '15:30', duracaoMin: 90, inicio: '2026-06-01', fim: '2026-06-30', exclusoes: [] });
const m2 = Core.dividirAula(db, 'a1');
conf('a aula dividida sai do padrão da repetição', db.aulas.find(a => a.id === 'a1').destacada, true);
conf('e a segunda metade não pertence à repetição', db.aulas.find(a => a.id === m2.novaId).serieId, 'null');
conf('desfazer devolve a aula ao padrão',
  (() => { Core.desfazerDivisao(db, m2); return db.aulas.find(a => a.id === 'a1').destacada; })(), false);

secao('7. O que a divisão se recusa a fazer');

db = bancoDeProva();
db.aulas[0].duracaoMin = 15;
conf('aula curta demais não divide', Core.dividirAula(db, 'a1'), 'null');
conf('e nem entra no menu', Core.podeDividir(db.aulas[0]), false);
conf('aula de 20 minutos ainda divide', Core.podeDividir({ duracaoMin: 20 }), true);

db = bancoDeProva();
const m3 = Core.dividirAula(db, 'a1');
db.aulas.find(a => a.id === m3.novaId).notaTexto = 'trabalhamos sistemas';
conf('não desfaz depois que ela escreveu na segunda', Core.desfazerDivisao(db, m3), false);
conf('e as duas aulas continuam de pé', db.aulas.filter(a => a.data === '2026-06-01').length, 2);

conf('duração ímpar reparte sem perder minuto',
  Core.metadesDe(55).reduce((a, b) => a + b, 0), 55);
conf('e a diferença é de um minuto no máximo',
  Math.abs(Core.metadesDe(55)[0] - Core.metadesDe(55)[1]), 1);
conf('hora vazia não inventa horário', Core.somarMinutosNaHora('', 30), '');
conf('não passa da meia-noite', Core.somarMinutosNaHora('23:50', 30), '23:59');

secao('8. Choque de horário');

db = bancoDeProva();
const base = db.aulas[0];  // 01/06, 15:30, 90 min
function nova(campos) {
  return Object.assign({ id: 'novo', alunoId: 'al1', data: '2026-06-01', hora: '15:30',
    duracaoMin: 60, status: 'realizada' }, campos);
}
conf('mesma hora e mesmo dia é choque',
  Core.conflitosDe(db, nova({})).map(a => a.id).join(','), 'a1');
conf('sobreposição parcial também',
  Core.conflitosDe(db, nova({ hora: '16:30' })).map(a => a.id).join(','), 'a1');
conf('encostado no fim não é choque',
  Core.conflitosDe(db, nova({ hora: '17:00' })).length, 0);
conf('antes de começar não é choque',
  Core.conflitosDe(db, nova({ hora: '14:00', duracaoMin: 90 })).length, 0);
conf('outro dia não é choque',
  Core.conflitosDe(db, nova({ data: '2026-06-02' })).length, 0);
conf('a aula cancelada não ocupa horário',
  Core.conflitosDe(db, nova({ status: 'cancelada' })).length, 0);
conf('e não é apontada como choque de outra',
  (() => { base.status = 'cancelada'; const r = Core.conflitosDe(db, nova({})).length; base.status = 'realizada'; return r; })(), 0);
conf('a própria aula não choca consigo mesma',
  Core.conflitosDe(db, base).map(a => a.id).join(','), '');
conf('sem horário não dá para saber, então não acusa',
  Core.conflitosDe(db, nova({ hora: '' })).length, 0);
conf('aluno diferente no mesmo horário também acusa, porque ela é uma só',
  Core.conflitosDe(db, nova({ alunoId: 'outro' })).map(a => a.id).join(','), 'a1');

secao('9. Busca sem acento');

conf('acha com acento', Core.casaBusca('Equação do primeiro grau', 'equação'), true);
conf('acha sem acento', Core.casaBusca('Equação do primeiro grau', 'equacao'), true);
conf('acha com maiúscula', Core.casaBusca('Equação do primeiro grau', 'EQUACAO'), true);
conf('o ç vira c', Core.casaBusca('Frações e decimais', 'fracoes'), true);
conf('o til some', Core.casaBusca('Revolução Francesa', 'revolucao'), true);
conf('o circunflexo some', Core.casaBusca('Ângulos internos', 'angulos'), true);
conf('o acento agudo some', Core.casaBusca('Genética mendeliana', 'genetica'), true);
conf('termo vazio casa com tudo', Core.casaBusca('qualquer coisa', ''), true);
conf('só espaço casa com tudo', Core.casaBusca('qualquer coisa', '   '), true);
conf('o que não é, continua não sendo', Core.casaBusca('Holocausto', 'nazismo'), false);
conf('texto vazio não casa com termo', Core.casaBusca('', 'nazismo'), false);
conf('a chave é estável', Core.chaveDeBusca('Ç Á É Í Ó Ú Ã Õ Â Ê Ô À'), 'c a e i o u a o a e o a');

/* Isto é limite conhecido e não defeito: tirar acento não junta singular com
   plural. Fica registrado para ninguém achar depois que é regressão. */
conf('singular não acha plural, e isso é esperado',
  Core.casaBusca('Frações equivalentes', 'fracao'), false);

console.log('\n' + '='.repeat(60));
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
