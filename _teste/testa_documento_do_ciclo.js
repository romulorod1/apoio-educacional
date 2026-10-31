/* testa_documento_do_ciclo.js
 *
 * C9: o documento do ciclo (lente da pedagoga, P02 e P07). Sem navegador.
 * Dados fictícios ("Aluno Alfa Teste"), três meses de aulas, com o dia de
 * hoje fixado em 30/10/2026.
 *
 * O que se prova:
 *   1. os números do período: só aula que aconteceu, dentro do período e até
 *      hoje; os assuntos sem repetir; as habilidades e hábitos com o rótulo
 *      de família e a contagem;
 *   2. o domínio no período: o que passou a ser dominado (com a data da marca
 *      que o pôs lá), o que segue em construção e o que já era dominado; e as
 *      três partes somam o total;
 *   3. as etapas, o ponto de partida e o próximo passo das trilhas;
 *   4. o rascunho das quatro seções: os números certos, rótulo de família e
 *      nenhum ponto de atenção, marcado ou não;
 *   5. os pontos de atenção: o documento leva SÓ os que ela marcou;
 *   6. o texto e o PDF: as quatro seções, os rótulos de família, o ponto
 *      marcado (controle positivo: o instrumento vê) e nada do que é interno:
 *      rótulo interno de área, ponto não marcado, nota de aula, nota só minha,
 *      observação da ficha, evidência da sondagem, dinheiro e travessão;
 *   7. o texto dela sobrevive à ida e volta em JSON, que é o que a cópia de
 *      segurança faz com o banco; seção em branco não sai.
 *
 * VENENO. As seções 1 a 6 rodam também contra cópias do core.js, e cada
 * cópia TEM de reprovar:
 *   - ponto-nao-marcado: o documento leva todo ponto do mapeamento, marcado
 *     ou não (a regra da proposta quebrada);
 *   - rotulo-interno: as áreas saem pelo rótulo dela, e não pelo de família.
 * Antes dos venenos, o core.js de verdade passa pelo MESMO carregador: sem
 * isso, um carregador quebrado faria todo veneno "reprovar" sem provar nada.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Core = require('../core.js');
const PDFGen = require('../pdf.js');

let ok = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const passou = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (passou) ok++; else falhas++;
  console.log((passou ? '  OK    ' : '  FALHA ') + rotulo + (passou ? '' : '  [obtido: ' + JSON.stringify(obtido).slice(0, 400) + ' | esperado: ' + JSON.stringify(esperado) + ']'));
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

// o meia-risca e o travessão, pelo código: o arquivo não carrega o caractere
const TRAVESSOES = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']');
const HOJE = '2026-10-30';
const INICIO = '2026-08-01';
const FIM = '2026-10-31';

/* O banco fictício. Cada aula diz por que está aqui. */
function montarBanco() {
  const tema = (id, titulo, dom) => { const x = { id: id, titulo: titulo, fonte: 'banco', disciplina: 'matematica' }; if (dom) x.dominio = dom; return x; };
  const aula = (id, data, temas, areas, status) => ({
    id: id, alunoId: 'al_c9', serieId: null, destacada: false, data: data, hora: '15:30', duracaoMin: 60,
    status: status || 'realizada', cobravel: true, temNota: false, anexos: [],
    notaTexto: 'RELATO_ALFA_SENTINELA', notaPrivada: 'NOTA_SO_MINHA_SENTINELA',
    temas: temas || [], areas: areas || []
  });
  const T1 = 'Frações equivalentes', T2 = 'Soma de frações', T3 = 'Porcentagem', T4 = 'Equação do primeiro grau', T6 = 'Tabuada do 7';
  const aluno = {
    id: 'al_c9', nome: 'Aluno Alfa Teste', responsavel: 'Responsavel Alfa', ativo: true, cor: '#2E7D6B',
    obs: 'OBS_SENTINELA', obsPedagogicas: 'OBSPED_SENTINELA',
    precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 137 }],
    etapas: [
      { id: 'e1', frente: 'autonomia', etapa: 'apoio-parcial', desde: '2026-06-10' },
      { id: 'e2', frente: 'autonomia', etapa: 'supervisao', desde: '2026-09-20' },
      { id: 'e3', frente: 'confianca', etapa: 'apoio-total', desde: '2026-08-15' },
      { id: 'e4', frente: 'conteudo', etapa: 'autonomia', desde: '2026-11-15' }   // depois de hoje: não conta
    ],
    mapeamentos: [{
      id: 'm1', data: '2026-08-03', aulaId: null, escola: '', anoEscolar: '06', anoEscolarOutro: '',
      prioridades: 'PRIORIDADE_SENTINELA', nivel: '',
      marcados: { fortes: ['raciocinio-ok'], atencao: ['vespera', 'chuta', 'ansiedade-prova', 'sinal'], lacunas: ['fracoes'], rotina: [], aprende: [] },
      porMateria: {},
      evidencias: { lacunas: { fracoes: [{ sondagem: 's1', data: '2026-08-03', texto: 'errou 2 de 2 itens de frações na sondagem de 03/08' }] } }
    }],
    trilhas: [{
      id: 'tr1', alunoId: 'al_c9', titulo: 'Operações com frações', alvoId: 'X', materia: 'matematica', criadaEm: '2026-08-03',
      origem: 'manual', encerradaEm: null, motivo: '',
      passos: [{ temaId: 'A', titulo: T1, feitoEm: '2026-08-25', aulaId: 'a4', porDominio: true },
        { temaId: 'B', titulo: T2, feitoEm: null, aulaId: null }]
    }]
  };
  return {
    alunos: [aluno], series: [], resumos: [], pagamentos: [], ajustes: {},
    aulas: [
      aula('a0', '2026-07-28', [tema('A', T1, 'andamento'), tema('F', T6, 'domina')], ['ansiedade']),   // antes do período
      aula('a1', '2026-08-04', [tema('A', T1, 'andamento'), tema('B', T2, 'nao')], ['ansiedade', 'disciplina']),
      aula('a2', '2026-08-11', [tema('C', T3, 'domina')], ['base']),
      aula('a3', '2026-08-18', [tema('Z', 'Tema da falta', 'domina')], ['concentracao'], 'falta'),           // falta: não conta
      aula('a4', '2026-08-25', [tema('A', T1, 'domina')], ['frustracao', 'confianca']),
      aula('a5', '2026-09-01', [tema('B', T2, 'andamento')], ['persistencia']),
      aula('a6', '2026-09-08', [tema('Z', 'Tema da falta', 'domina')], ['concentracao'], 'cancelada'),       // cancelada: não conta
      aula('a7', '2026-09-15', [tema('D', T4)], ['pedir-ajuda']),
      aula('a8', '2026-09-22', [tema('F', T6, 'domina')], []),
      aula('a9', '2026-10-06', [tema('B', T2, 'andamento')], ['ansiedade'], 'reposicao'),
      aula('a10', '2026-10-20', [tema('C', T3, 'andamento')], []),
      aula('a11', '2026-10-27', [tema('A', 'frações equivalentes', 'domina')], ['base']),                    // o mesmo assunto, outra caixa
      aula('a12', '2026-10-31', [tema('G', 'Assunto do futuro', 'domina')], ['concentracao'])                // depois de hoje: não conta
    ]
  };
}

// as áreas com rótulo de família próprio que as aulas do período marcam
const AREAS_DO_PERIODO = ['ansiedade', 'disciplina', 'base', 'frustracao', 'confianca', 'persistencia', 'pedir-ajuda'];

/* As provas, contra um Core qualquer (o de verdade ou um envenenado). */
function provas(C, conf) {
  const db = montarBanco();
  const aluno = db.alunos[0];

  const d = C.dadosDoCiclo(db, 'al_c9', INICIO, FIM, HOJE);
  // 1. os números
  conf('aulas: só as que aconteceram, no período e até hoje', d.qtdAulas, 9);
  conf('o período conta até hoje, e não até o fim marcado', d.ate, HOJE);
  conf('assuntos sem repetir, a caixa não duplica', d.assuntos.map(a => a.titulo),
    ['Frações equivalentes', 'Soma de frações', 'Porcentagem', 'Equação do primeiro grau', 'Tabuada do 7']);
  conf('habilidades e hábitos: rótulo de família e contagem', d.areas.map(a => a.rotulo + ':' + a.vezes), [
    'Base de anos anteriores:2', 'Preparação emocional para a prova:2', 'Como lidar com erro e frustração:1',
    'Como tirar dúvidas:1', 'Confiança nos estudos:1', 'Persistência na questão difícil:1', 'Rotina e constância nos estudos:1']);
  conf('a área da falta, da cancelada e da aula futura não entra', d.areas.some(a => a.id === 'concentracao'), false);

  // 2. o domínio
  conf('passou a ser dominado: o que terminou em Domina sem começar nele, com a data', d.passouADominar,
    [{ titulo: 'frações equivalentes', data: '2026-08-25' }]);
  conf('seguem em construção: o que terminou em andamento ou "ainda não"', d.pedePratica.map(x => x.titulo + ':' + x.estado),
    ['Porcentagem:andamento', 'Soma de frações:andamento']);
  conf('já era dominado e continuou', d.seguiuDominado, 1);
  conf('as três partes somam o total acompanhado', d.passouADominar.length + d.pedePratica.length + d.seguiuDominado, d.comMarcaDeDominio);

  // 3. etapas, partida, próximo passo
  conf('as etapas que mudaram no período: de onde saiu e onde terminou, por frente', d.etapas,
    [{ frente: 'autonomia', de: 'apoio-parcial', para: 'supervisao', data: '2026-09-20' },
      { frente: 'confianca', de: '', para: 'apoio-total', data: '2026-08-15' }]);
  conf('o ponto de partida: o mapeamento e as lacunas', d.partida, { data: '2026-08-03', lacunas: ['Frações'] });
  conf('o próximo passo da trilha ativa', d.proximos, [{ trilha: 'Operações com frações', passo: 'Soma de frações' }]);

  // 4. o rascunho
  const r = C.rascunhoDoCiclo(d);
  conf('rascunho: as quatro seções têm texto', Object.keys(r).filter(k => r[k]).length, 4);
  conf('rascunho, o que aconteceu: período e aulas', r.aconteceu.indexOf('Entre 01/08/2026 e 30/10/2026, foram 9 aulas.') === 0, true);
  conf('rascunho, o que aconteceu: os assuntos', r.aconteceu.indexOf('Assuntos trabalhados (5): ') >= 0, true);
  conf('rascunho, o que aconteceu: o que passou a sair com segurança, com a data', r.aconteceu.indexOf('Agora resolve com segurança: frações equivalentes (desde 25/08).') >= 0, true);
  conf('rascunho, o que significa: o que o aluno faz em cada frente que mudou, e a conta do domínio', [
    r.significa.indexOf('Para estudar e se organizar, hoje faz sem ajuda, com uma conferência depois; no começo do período, começava sem ajuda e pedia apoio no meio do caminho.') >= 0,
    r.significa.indexOf('Na confiança diante da aula e da prova, hoje precisa de acompanhamento lado a lado.') >= 0,
    r.significa.indexOf('(4), 1 passou a sair com segurança, 2 ainda estão sendo construídos e 1 já estava firme e continua.') >= 0], [true, true, true]);
  conf('rascunho, o que pede atenção: os assuntos em construção', r.atencao, 'Ainda pedem prática: Porcentagem e Soma de frações.');
  conf('rascunho, próximo ciclo: o passo da trilha, sem repetir o assunto', r.proximo,
    'No próximo ciclo, seguimos em Operações com frações, começando por Soma de frações.\n\nContinuamos praticando Porcentagem.');
  const pontos = C.pontosDeAtencaoDoCiclo(aluno);
  conf('o mapeamento oferece os quatro pontos (do aluno e da matéria)', pontos.map(p => p.id), ['vespera', 'chuta', 'ansiedade-prova', 'sinal']);
  const todoRascunho = Object.keys(r).map(k => r[k]).join('\n');
  conf('o rascunho não cita ponto de atenção nenhum, marcado ou não',
    pontos.filter(p => todoRascunho.indexOf(p.rotulo) >= 0).map(p => p.rotulo), []);
  /* Tom de família (revisão do C9): nem o nome das etapas nem o "domina"
   * do domínio, que na folha soam como laudo. */
  conf('o rascunho não usa o vocabulário interno (etapas e domínio)',
    vocabularioInterno(C, todoRascunho), []);

  // 5. só os pontos marcados
  const ciclo = C.cicloNovo(db, aluno, HOJE);
  conf('ciclo novo: o período padrão são os três meses até hoje', [ciclo.inicio, ciclo.fim], [INICIO, HOJE]);
  conf('ciclo novo: nenhum ponto nasce marcado', ciclo.atencaoQueSai, []);
  ciclo.fim = FIM;
  ciclo.textos = C.rascunhoDoCiclo(d);
  let doc = C.documentoDoCiclo(db, aluno, ciclo, HOJE);
  conf('sem nada marcado, a seção de atenção não tem item', doc.secoes.filter(s => s.chave === 'atencao')[0].itens, []);
  ciclo.atencaoQueSai = ['chuta'];
  doc = C.documentoDoCiclo(db, aluno, ciclo, HOJE);
  conf('com um marcado, só ele sai', doc.secoes.filter(s => s.chave === 'atencao')[0].itens, ['Chuta sem tentar']);
  conf('as quatro seções, na ordem', doc.secoes.map(s => s.titulo),
    ['O que aconteceu', 'O que isso significa', 'O que ainda pede atenção', 'Próximo ciclo']);

  // 6. o texto e o PDF
  const saidas = { texto: C.markdownCiclo(doc), PDF: textoDoPdf(PDFGen.gerarCiclo(doc)) };
  const NAO_MARCADOS = pontos.filter(p => p.id !== 'chuta').map(p => p.rotulo);
  const familia = AREAS_DO_PERIODO.map(id => C.rotuloAreaFamilia(id));
  const internos = AREAS_DO_PERIODO.map(id => C.rotuloArea(id)).filter(r => familia.indexOf(r) < 0);
  const SENTINELAS = ['RELATO_ALFA_SENTINELA', 'NOTA_SO_MINHA_SENTINELA', 'OBS_SENTINELA', 'OBSPED_SENTINELA',
    'PRIORIDADE_SENTINELA', 'errou 2 de 2', 'R$', '137'];
  Object.keys(saidas).forEach(nome => {
    const t = saidas[nome];
    const tl = t.toLowerCase();
    conf(nome + ': as quatro seções', ['O que aconteceu', 'O que isso significa', 'O que ainda pede atenção', 'Próximo ciclo'].filter(x => t.indexOf(x) < 0), []);
    conf(nome + ': o nome do aluno e o período', [t.indexOf('Aluno Alfa Teste') >= 0, t.indexOf('01/08/2026 a 31/10/2026') >= 0], [true, true]);
    conf(nome + ': todo rótulo de família aparece (o instrumento vê)', familia.filter(f => tl.indexOf(f.toLowerCase()) < 0), []);
    conf(nome + ': nenhum rótulo interno de área', internos.filter(i => tl.indexOf(i.toLowerCase()) >= 0), []);
    conf(nome + ': o ponto marcado aparece (o instrumento vê)', t.indexOf('Chuta sem tentar') >= 0, true);
    conf(nome + ': nenhum ponto não marcado', NAO_MARCADOS.filter(p => t.indexOf(p) >= 0), []);
    conf(nome + ': nada interno (notas, observações, evidência, dinheiro)', SENTINELAS.filter(s => t.indexOf(s) >= 0), []);
    conf(nome + ': sem travessão', TRAVESSOES.test(t), false);
    conf(nome + ': sem o vocabulário interno (etapas e domínio)', vocabularioInterno(C, t), []);
  });
}

/* O nome das etapas, com a caixa dela ("Apoio parcial", "Supervisão"), e
 * qualquer forma de "domin". */
function vocabularioInterno(C, texto) {
  const achados = C.ETAPAS.map(e => e.rotulo).filter(r => texto.indexOf(r) >= 0);
  const m = texto.match(/domin/i);
  if (m) achados.push(m[0]);
  return achados;
}

secao('0. As âncoras');
conf('quatro seções, o roteiro da pedagoga', Core.SECOES_DO_CICLO.map(s => s.titulo),
  ['O que aconteceu', 'O que isso significa', 'O que ainda pede atenção', 'Próximo ciclo']);
conf('os títulos sem travessão', Core.SECOES_DO_CICLO.filter(s => TRAVESSOES.test(s.titulo)).length, 0);
conf('o controle da varredura: o instrumento acha o rótulo interno quando ele está lá',
  'Ansiedade ou medo de prova (2 aulas)'.toLowerCase().indexOf(Core.rotuloArea('ansiedade').toLowerCase()) >= 0, true);

secao('1 a 6. Números, domínio, rascunho, pontos marcados, texto e PDF');
provas(Core, conf);

secao('7. O texto dela fica guardado e viaja na cópia');
{
  const db = montarBanco();
  const aluno = db.alunos[0];
  const ciclo = Core.cicloNovo(db, aluno, HOJE);
  ciclo.textos.significa = 'O texto dela, escrito à mão, sobre o ciclo.';
  ciclo.textos.proximo = '   ';
  aluno.ciclos = [ciclo];
  // a cópia de segurança e o "Voltar a este ponto" levam o banco como JSON
  const volta = JSON.parse(JSON.stringify(db));
  const a2 = volta.alunos[0];
  conf('o ciclo volta no aluno', Core.ciclosDe(a2).map(c => c.id), [ciclo.id]);
  const doc = Core.documentoDoCiclo(volta, a2, Core.ciclosDe(a2)[0], HOJE);
  conf('com o texto dela', doc.secoes.filter(s => s.chave === 'significa')[0].texto, 'O texto dela, escrito à mão, sobre o ciclo.');
  conf('seção em branco (só espaço) não sai', doc.secoes.map(s => s.chave), ['aconteceu', 'significa', 'atencao']);
  conf('aluno de antes, sem o campo, tem lista vazia', Core.ciclosDe({ id: 'x' }), []);
  // o próximo ciclo começa no dia seguinte ao fim do anterior
  aluno.ciclos[0].fim = '2026-07-31';
  conf('o ciclo seguinte começa no dia seguinte ao anterior', Core.periodoPadraoDoCiclo(HOJE, aluno.ciclos[0]), { inicio: INICIO, fim: HOJE });
  /* O período padrão parte do FIM MAIS RECENTE, e não do último criado, e
   * nunca repete um período que já existe. */
  const out = { id: 'c-out', inicio: '2026-09-01', fim: '2026-10-15' };
  const ago = { id: 'c-ago', inicio: '2026-08-01', fim: '2026-08-31' };   // criado depois, termina antes
  conf('parte do fim mais recente, não do último criado', Core.periodoPadraoDoCiclo(HOJE, [out, ago]), { inicio: '2026-10-16', fim: HOJE });
  aluno.ciclos = [out, ago];
  const novo = Core.cicloNovo(db, aluno, HOJE);
  conf('o ciclo novo da tela usa a mesma regra', [novo.inicio, novo.fim], ['2026-10-16', HOJE]);
  const ateHoje = { id: 'c-hoje', inicio: '2026-08-01', fim: HOJE };
  const p1 = Core.periodoPadraoDoCiclo(HOJE, [ateHoje]);
  conf('ciclo que termina hoje: o novo são os três meses depois dele', p1, { inicio: '2026-10-31', fim: '2027-01-30' });
  const alem = { id: 'c-alem', inicio: '2026-10-01', fim: '2026-12-31' };
  const p2 = Core.periodoPadraoDoCiclo(HOJE, [ateHoje, alem]);
  conf('ciclo que termina depois de hoje: idem, depois do fim mais recente', p2, { inicio: '2027-01-01', fim: '2027-03-31' });
  conf('o período proposto nunca é o de um ciclo que já existe', [p1, p2].filter(p =>
    [out, ago, ateHoje, alem].some(c => c.inicio === p.inicio && c.fim === p.fim)).length, 0);
  conf('e nunca começa depois de terminar', [p1, p2].every(p => p.inicio <= p.fim), true);
}

secao('8. VENENO: cópias do core.js TÊM de reprovar');
/* A fonte é lida com \r\n trocado por \n (o checkout no Windows põe \r\n), e
 * o controle carrega ESTA mesma fonte, então a troca não muda o que se prova. */
const FONTE = fs.readFileSync(path.join(__dirname, '..', 'core.js'), 'utf8').replace(/\r\n/g, '\n');
function carregar(fonte, nome) {
  const m = { exports: {} };
  vm.runInNewContext(fonte, { module: m, console: console }, { filename: nome });
  return m.exports;
}
function trocarUmaVez(de, para) {
  if (FONTE.split(de).length !== 2) return null;
  return FONTE.replace(de, para);
}
function contarFalhas(C) {
  let n = 0;
  try {
    provas(C, (rotulo, obtido, esperado) => { if (JSON.stringify(obtido) !== JSON.stringify(esperado)) n++; });
  } catch (e) { n = -1; }
  return n;
}
const controle = contarFalhas(carregar(FONTE, 'core-controle.js'));
conf('controle: o core.js de verdade, pelo carregador dos venenos, passa', controle, 0);
const VENENOS = {
  'ponto-nao-marcado': trocarUmaVez('      return marcados.indexOf(p.id) >= 0;\n', '      return true;\n'),
  'rotulo-interno': trocarUmaVez('    var areas = Object.keys(cont).map(function (id) {\n      return { id: id, rotulo: rotuloAreaFamilia(id), vezes: cont[id] };',
    '    var areas = Object.keys(cont).map(function (id) {\n      return { id: id, rotulo: rotuloArea(id), vezes: cont[id] };')
};
Object.keys(VENENOS).forEach(nome => {
  conf('veneno ' + nome + ': a troca foi aplicada (a âncora casa uma vez só)', VENENOS[nome] !== null, true);
  if (!VENENOS[nome]) return;
  const n = contarFalhas(carregar(VENENOS[nome], 'core-' + nome + '.js'));
  console.log('       veneno ' + nome + ': ' + n + ' verificações reprovaram');
  conf('veneno ' + nome + ': reprova', n > 0, true);
});

console.log('\n' + ok + ' verificações passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
