/* testa_aluno.js
 * O que o aplicativo sabe sobre o aluno, sem navegador, direto contra o core.
 *
 * Quatro coisas moram aqui, e cada uma nasceu de um pedido dela:
 *
 *   1. O último encontro, que abre a janela da aula, para ela não precisar
 *      fechar tudo e procurar a aula anterior no calendário.
 *   2. A anotação que virou duas, porque o que ela escrevia podia acabar
 *      saindo no arquivo que a família recebe.
 *   3. O mapeamento dividido entre o que é do aluno e o que é da matéria,
 *      com lista de lacunas só onde ela é verdade.
 *   4. A etapa em que o aluno está e para onde ele está indo.
 *
 * A trava que mais importa neste arquivo é a da anotação só dela: nenhum texto
 * escrito ali pode aparecer no Markdown do fechamento, no do mês inteiro nem
 * nas linhas que o gerador de PDF recebe.
 */
const Core = require('../core.js');

let passes = 0, falhas = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

function aula(extra) {
  return Object.assign({
    id: Core.uid(), alunoId: 'a1', serieId: null, destacada: false,
    data: '2026-09-01', hora: '15:30', duracaoMin: 60,
    status: 'realizada', cobravel: true, notaTexto: '', temNota: false, anexos: []
  }, extra || {});
}

// ================================================================
secao('1. O último encontro, no alto da janela da aula');

const aluno = { id: 'a1', nome: 'Aluno de Teste', precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 100 }] };
const bancoUm = {
  alunos: [aluno],
  aulas: [
    aula({ id: 'l1', data: '2026-08-10', notaTexto: 'Fechamos frações equivalentes.', areas: ['estudo-organizacao'] }),
    aula({ id: 'l2', data: '2026-08-17', notaTexto: 'Voltamos em decimais.', notaPrivada: 'Chegou muito cansado, mãe avisou que dormiu tarde.' }),
    aula({ id: 'l3', data: '2026-08-24', status: 'cancelada', notaTexto: 'Desmarcou na véspera.' }),
    aula({ id: 'l4', data: '2026-09-01' })
  ]
};

const ultimo = Core.ultimoEncontro(bancoUm, 'a1', bancoUm.aulas[3]);
conf('a aula de hoje enxerga o encontro anterior', ultimo && ultimo.aulaId, 'l2');
conf('com o que rendeu', ultimo.oQueRendeu, 'Voltamos em decimais.');
conf('e com o que ela anotou só para ela',
  /dormiu tarde/.test(ultimo.soMinha), true);
conf('a aula cancelada não conta como encontro',
  Core.ultimoEncontro(bancoUm, 'a1', bancoUm.aulas[3]).data, '2026-08-17');

conf('a primeira aula do aluno não tem encontro anterior',
  Core.ultimoEncontro(bancoUm, 'a1', bancoUm.aulas[0]), 'null');
conf('aluno sem aula nenhuma também não',
  Core.ultimoEncontro({ alunos: [], aulas: [] }, 'a9', null), 'null');
conf('banco sem a lista de aulas não quebra',
  Core.ultimoEncontro({}, 'a1', null), 'null');

/* Aula sem nada dentro não é um lugar onde alguém parou: a janela pula para a
 * anterior que tem alguma coisa, em vez de abrir com um bloco vazio. */
const bancoVazias = {
  aulas: [
    aula({ id: 'v1', data: '2026-08-03', notaTexto: 'Equação do primeiro grau.' }),
    aula({ id: 'v2', data: '2026-08-10' }),
    aula({ id: 'v3', data: '2026-08-17' })
  ]
};
conf('encontro sem registro nenhum é pulado',
  Core.ultimoEncontro(bancoVazias, 'a1', bancoVazias.aulas[2]).aulaId, 'v1');
conf('e o pulo traz o texto certo',
  Core.ultimoEncontro(bancoVazias, 'a1', bancoVazias.aulas[2]).oQueRendeu,
  'Equação do primeiro grau.');

/* Só a folha escrita já basta para o encontro valer: ela escreveu à mão. */
const bancoFolha = {
  aulas: [
    aula({ id: 'f1', data: '2026-08-03', temNota: true }),
    aula({ id: 'f2', data: '2026-08-10' })
  ]
};
conf('folha escrita basta para o encontro contar',
  Core.ultimoEncontro(bancoFolha, 'a1', bancoFolha.aulas[1]).temFolha, 'true');

/* Aula marcada à frente nunca é o último encontro: ela ainda não aconteceu. */
const bancoFuturo = {
  aulas: [
    aula({ id: 'p1', data: '2026-08-10', notaTexto: 'Passado.' }),
    aula({ id: 'p2', data: '2026-09-20', notaTexto: 'Ainda vai acontecer.' }),
    aula({ id: 'p3', data: '2026-09-01' })
  ]
};
conf('o que está marcado à frente não vira memória',
  Core.ultimoEncontro(bancoFuturo, 'a1', bancoFuturo.aulas[2]).aulaId, 'p1');

/* Encontro dividido em dois: a primeira metade é o encontro anterior da
 * segunda, e as duas são do mesmo dia. */
const bancoDividido = {
  aulas: [
    aula({ id: 'd1', data: '2026-09-01', hora: '14:00', notaTexto: 'Primeira metade.' }),
    aula({ id: 'd2', data: '2026-09-01', hora: '15:00' })
  ]
};
conf('a metade da tarde vê a metade da manhã',
  Core.ultimoEncontro(bancoDividido, 'a1', bancoDividido.aulas[1]).aulaId, 'd1');

conf('a aula de outro aluno não entra',
  Core.ultimoEncontro(bancoUm, 'a2', aula({ alunoId: 'a2', data: '2026-09-01' })), 'null');

// ================================================================
secao('2. A anotação só dela nunca sai do aparelho');

const SEGREDO = 'A mãe pediu para eu não comentar a separação com o menino.';
const bancoSegredo = {
  alunos: [aluno],
  aulas: [
    aula({ id: 's1', data: '2026-09-01', notaTexto: 'Frações equivalentes.', notaPrivada: SEGREDO, temNota: true }),
    aula({ id: 's2', data: '2026-09-08', notaTexto: 'Porcentagem.', notaPrivada: SEGREDO })
  ]
};
const fech = Core.calcularFechamento(bancoSegredo, 'a1', '2026-09', '2026-09-30');
conf('o fechamento é calculado', fech && fech.linhas.length, 2);
conf('as linhas levam o que rendeu', fech.linhas[0].notaTexto, 'Frações equivalentes.');
conf('e não levam a anotação só dela',
  Object.keys(fech.linhas[0]).indexOf('notaPrivada'), -1);
conf('nem por acidente dentro de qualquer campo da linha',
  JSON.stringify(fech.linhas).indexOf(SEGREDO), -1);

const md = Core.markdownFechamento(fech, { incluirNotas: true, exibirTemasEAreas: true });
conf('o documento da família não traz o segredo', md.indexOf(SEGREDO), -1);
conf('mas traz o que rendeu', md.indexOf('Frações equivalentes.') > 0, true);

const mdMes = Core.markdownMesInteiro(Core.calcularMesInteiro(bancoSegredo, '2026-09', '2026-09-30'), '2026-09');
conf('o documento do mês inteiro também não traz', mdMes.indexOf(SEGREDO), -1);

/* Ela escreveu só na anotação dela: a aula continua tendo conteúdo, e uma
 * mudança no padrão da repetição não pode jogar isso fora. */
conf('aula com só a anotação dela tem conteúdo',
  Core.temConteudo({ notaPrivada: 'só isto' }), true);
conf('aula sem nada continua sem conteúdo',
  Core.temConteudo({ notaTexto: '', notaPrivada: '   ' }), false);
conf('aula de hoje, sem o campo novo, continua funcionando',
  Core.temConteudo({ notaTexto: 'alguma coisa' }), true);

/* A anotação é daquele encontro, e nunca escorre para as irmãs da repetição. */
const bancoSerie = {
  series: [{ id: 'se1', alunoId: 'a1', dias: [1], hora: '15:30', duracaoMin: 60, inicio: '2026-09-01', fim: null }],
  aulas: [
    aula({ id: 'r1', serieId: 'se1', data: '2026-09-07' }),
    aula({ id: 'r2', serieId: 'se1', data: '2026-09-14' })
  ]
};
Core.aplicarEdicaoAula(bancoSerie, 'r1', { notaPrivada: 'só desta terça', duracaoMin: 90 }, 'todas');
conf('a duração foi para as duas', bancoSerie.aulas[1].duracaoMin, 90);
conf('a anotação dela ficou só numa', bancoSerie.aulas[0].notaPrivada, 'só desta terça');
conf('a irmã não recebeu nada', bancoSerie.aulas[1].notaPrivada, 'undefined');

// ================================================================
secao('3. O mapeamento dividido entre o aluno e a matéria');

conf('as matérias existem, com matemática em primeiro',
  Core.MATERIAS[0].id, 'matematica');
conf('e a última é a livre, porque nenhuma lista prevê tudo',
  Core.MATERIAS[Core.MATERIAS.length - 1].livre, true);
conf('há onze matérias além de matemática e da livre',
  Core.MATERIAS.length - 2, 11);
conf('nenhum identificador de matéria repetido',
  new Set(Core.MATERIAS.map(m => m.id)).size, Core.MATERIAS.length);
conf('nenhum travessão na lista de matérias',
  /[\u2013\u2014]/.test(JSON.stringify(Core.MATERIAS)), false);

conf('só matemática é escada', Core.MATERIAS.filter(m => m.escada).map(m => m.id).join(','), 'matematica');
conf('lacuna de ano anterior existe em matemática',
  Core.temLacunaDeAnoAnterior('matematica'), true);
['historia', 'geografia', 'biologia', 'portugues', 'ingles', 'fisica', 'quimica'].forEach(id => {
  conf('e não existe em ' + id, Core.temLacunaDeAnoAnterior(id), false);
});

conf('a lista de lacunas aparece em matemática',
  Core.itensDaMateria('lacunas', 'matematica').length >= 20, true);
conf('e não aparece em história',
  Core.itensDaMateria('lacunas', 'historia').length, 0);
conf('os grupos da matéria em matemática',
  Core.gruposDaMateria('matematica').map(g => g.chave).join(','), 'fortes,atencao,lacunas');
conf('e em história, sem lacunas',
  Core.gruposDaMateria('historia').map(g => g.chave).join(','), 'fortes,atencao');
conf('os grupos do aluno valem em qualquer matéria',
  Core.gruposDoAluno().map(g => g.chave).join(','), 'fortes,atencao,rotina,aprende');

/* O que o documento diz, com todas as letras, que é do aluno. */
const doAluno = Core.itensDoAluno('atencao').map(i => i.id);
['branco', 'chuta', 'vespera', 'ansiedade-prova'].forEach(id => {
  conf('"' + id + '" é do aluno, e vale em qualquer matéria', doAluno.indexOf(id) >= 0, true);
});
const daMateriaMat = Core.itensDaMateria('atencao', 'matematica').map(i => i.id);
['sinal', 'tabuada-fraca', 'fracao-fraca'].forEach(id => {
  conf('"' + id + '" é da matéria', daMateriaMat.indexOf(id) >= 0, true);
});
const daMateriaHist = Core.itensDaMateria('atencao', 'historia').map(i => i.id);
['sinal', 'tabuada-fraca', 'fracao-fraca', 'decimal-fraca'].forEach(id => {
  conf('"' + id + '" não é pergunta de história', daMateriaHist.indexOf(id), -1);
});
conf('mas história tem o que perguntar', daMateriaHist.length >= 3, true);
conf('e tem pontos fortes também', Core.itensDaMateria('fortes', 'historia').length >= 3, true);

conf('nenhum item cai nos dois lados',
  Core.MAPA.some(g => g.itens.some(i => {
    const noAluno = Core.itensDoAluno(g.chave).some(x => x.id === i.id);
    const naMateria = Core.itensDaMateria(g.chave, 'matematica').some(x => x.id === i.id);
    return noAluno && naMateria;
  })), false);
conf('e nenhum item fica de fora dos dois em matemática',
  Core.MAPA.reduce((n, g) => n + Core.itensDoAluno(g.chave).length +
    Core.itensDaMateria(g.chave, 'matematica').length, 0),
  Core.MAPA.reduce((n, g) => n + g.itens.length, 0));

// ----------------------------------------------------------------
secao('4. O que ela já marcou continua onde estava');

/* Um mapeamento gravado antes desta mudança: tudo em marcados, sem porMateria.
 * Ele foi respondido sobre matemática, e tem que continuar sendo lido assim. */
const mapaAntigo = {
  id: 'm1', data: '2026-03-01', anoEscolar: '08',
  marcados: {
    fortes: ['calculo-mental', 'persiste'],
    atencao: ['sinal', 'vespera', 'ansiedade-prova'],
    lacunas: ['fracoes', 'eq1'],
    rotina: ['agenda-cheia'],
    aprende: ['visual']
  }
};
const alunoAntigo = { id: 'a1', nome: 'Aluno de Teste', mapeamentos: [mapaAntigo] };

const marcMat = Core.marcadosDaMateria(mapaAntigo, 'matematica');
conf('matemática continua lendo o que ela marcou',
  marcMat.atencao.join(','), 'sinal');
conf('com as lacunas intactas', marcMat.lacunas.join(','), 'fracoes,eq1');
conf('e os pontos fortes da matéria', marcMat.fortes.join(','), 'calculo-mental');

const marcAluno = Core.marcadosDoAluno(mapaAntigo);
conf('o bloco do aluno lê o resto da mesma lista',
  marcAluno.atencao.join(','), 'vespera,ansiedade-prova');
conf('com a rotina', marcAluno.rotina.join(','), 'agenda-cheia');
conf('e com o jeito de aprender', marcAluno.aprende.join(','), 'visual');

conf('história nasce sem nada marcado',
  Core.marcadosDaMateria(mapaAntigo, 'historia').atencao.length, 0);
conf('e sem lacuna nenhuma, porque lá elas não existem',
  Core.marcadosDaMateria(mapaAntigo, 'historia').lacunas.length, 0);

conf('o lembrete da aula não mudou de sentido',
  Core.lembreteDoMapeamento(alunoAntigo).lacunas.join(','), 'Frações,Equação do primeiro grau');
conf('nem o texto do lembrete',
  /Erros de sinal/.test(Core.textoDoLembrete(alunoAntigo)), true);

/* Marcar em história não pode mexer em matemática. */
Core.marcarNaMateria(mapaAntigo, 'historia', 'atencao', 'conteudo-atrasado', true);
Core.marcarNaMateria(mapaAntigo, 'historia', 'fortes', 'gosta', true);
conf('história guardou o que ela marcou',
  Core.marcadosDaMateria(mapaAntigo, 'historia').atencao.join(','), 'conteudo-atrasado');
conf('matemática não foi tocada',
  Core.marcadosDaMateria(mapaAntigo, 'matematica').atencao.join(','), 'sinal');
conf('e o bloco do aluno também não',
  Core.marcadosDoAluno(mapaAntigo).atencao.join(','), 'vespera,ansiedade-prova');
conf('as duas matérias aparecem na lista do mapeamento',
  Core.materiasDoMapeamento(mapaAntigo).join(','), 'matematica,historia');

Core.marcarNaMateria(mapaAntigo, 'historia', 'atencao', 'conteudo-atrasado', false);
conf('desmarcar em história funciona',
  Core.marcadosDaMateria(mapaAntigo, 'historia').atencao.length, 0);

Core.definirCobranca(mapaAntigo, 'historia', 'Revolução Francesa e Era Napoleônica.');
conf('o que o colégio cobra fica guardado por matéria',
  Core.cobrancaDaMateria(mapaAntigo, 'historia'), 'Revolução Francesa e Era Napoleônica.');
conf('e não vaza para matemática', Core.cobrancaDaMateria(mapaAntigo, 'matematica'), '');

/* Marcar em matemática cai onde sempre caiu, para o lembrete e a trilha
 * continuarem achando. */
Core.marcarNaMateria(mapaAntigo, 'matematica', 'lacunas', 'proporcao', true);
conf('a lacuna nova entrou na lista de sempre',
  mapaAntigo.marcados.lacunas.join(','), 'fracoes,eq1,proporcao');

const mapaNovo = Core.mapeamentoNovo();
conf('o mapeamento novo nasce com os cinco grupos vazios',
  Object.keys(mapaNovo.marcados).sort().join(','), 'aprende,atencao,fortes,lacunas,rotina');
conf('e com a gaveta das outras matérias vazia',
  Object.keys(mapaNovo.porMateria).length, 0);
conf('mapeamento sem porMateria não quebra a leitura',
  Core.marcadosDaMateria({ marcados: { atencao: ['sinal'] } }, 'historia').atencao.length, 0);
conf('nem a de matemática',
  Core.marcadosDaMateria({ marcados: { atencao: ['sinal'] } }, 'matematica').atencao.join(','), 'sinal');
conf('mapeamento nulo devolve listas vazias',
  Core.marcadosDoAluno(null).atencao.length, 0);

conf('a matéria livre usa o nome que ela escreveu',
  (function () {
    const m = Core.mapeamentoNovo();
    Core.garantirMateria(m, 'outra').nome = 'Espanhol';
    return Core.rotuloMateria(m, 'outra');
  })(), 'Espanhol');
conf('e sem nome escrito cai no rótulo da lista',
  Core.rotuloMateria(Core.mapeamentoNovo(), 'outra'), 'Outra');

// ================================================================
secao('5. Em que etapa o aluno está');

conf('as quatro etapas que ela já usa',
  Core.ETAPAS.map(e => e.rotulo).join(', '),
  'Apoio total, Apoio parcial, Supervisão, Autonomia');
conf('e as três frentes',
  Core.FRENTES_ETAPA.map(f => f.rotulo).join(', '), 'Conteúdo, Autonomia, Confiança');
conf('nenhum travessão nas etapas',
  /[\u2013\u2014]/.test(JSON.stringify(Core.ETAPAS) + JSON.stringify(Core.FRENTES_ETAPA)), false);

const alunoEtapa = { id: 'a5', nome: 'Aluno de Teste' };
conf('aluno de hoje, sem o campo, mostra as três linhas em branco',
  Core.quadroDeEtapas(alunoEtapa).map(l => String(l.atual)).join(','), 'null,null,null');
conf('e as três frentes na ordem',
  Core.quadroDeEtapas(alunoEtapa).map(l => l.frente).join(','), 'conteudo,autonomia,confianca');
conf('sem etapa marcada não há atual', Core.etapaAtual(alunoEtapa, 'conteudo'), 'null');

conf('marcar a etapa devolve o registro',
  !!Core.registrarEtapa(alunoEtapa, 'conteudo', 'apoio-total', '2026-02-10'), true);
conf('e a linha passa a mostrar o ponto',
  Core.etapaAtual(alunoEtapa, 'conteudo').rotulo, 'Apoio total');
conf('com a data em que mudou',
  Core.etapaAtual(alunoEtapa, 'conteudo').desde, '2026-02-10');
conf('as outras duas frentes continuam em branco',
  Core.etapaAtual(alunoEtapa, 'confianca'), 'null');

conf('marcar de novo a mesma etapa não vira registro',
  Core.registrarEtapa(alunoEtapa, 'conteudo', 'apoio-total', '2026-06-01'), 'null');
conf('e o histórico continua com uma linha só',
  Core.registrosDaFrente(alunoEtapa, 'conteudo').length, 1);

Core.registrarEtapa(alunoEtapa, 'conteudo', 'apoio-parcial', '2026-06-01');
conf('mudar de etapa guarda a nova',
  Core.etapaAtual(alunoEtapa, 'conteudo').rotulo, 'Apoio parcial');
conf('e a anterior não some',
  Core.etapaAtual(alunoEtapa, 'conteudo').anterior.rotulo, 'Apoio total');
conf('com a data em que ela valia',
  Core.etapaAtual(alunoEtapa, 'conteudo').anterior.desde, '2026-02-10');

/* Toque errado consertado no mesmo dia: substitui, não empilha. */
Core.registrarEtapa(alunoEtapa, 'conteudo', 'autonomia', '2026-06-01');
conf('conserto no mesmo dia substitui',
  Core.etapaAtual(alunoEtapa, 'conteudo').rotulo, 'Autonomia');
conf('e não empilha duas linhas no mesmo dia',
  Core.registrosDaFrente(alunoEtapa, 'conteudo').length, 2);

conf('frente que não existe não grava nada',
  Core.registrarEtapa(alunoEtapa, 'inventada', 'autonomia', '2026-06-01'), 'null');
conf('etapa que não existe também não',
  Core.registrarEtapa(alunoEtapa, 'confianca', 'super-heroi', '2026-06-01'), 'null');
conf('aluno nulo não quebra', Core.registrarEtapa(null, 'confianca', 'autonomia'), 'null');
conf('registro estragado no banco é ignorado',
  Core.etapasDe({ etapas: [{ frente: 'conteudo' }, null, { frente: 'x', etapa: 'y', desde: 'z' }] }).length, 0);

/* O aplicativo nunca escolhe a etapa sozinho: não existe função que devolva
 * uma etapa a partir das aulas, das áreas ou do mapeamento. */
conf('nada no core adivinha a etapa a partir das aulas',
  Object.keys(Core).filter(k => /^(sugerir|calcular|inferir|deduzir)Etapa/.test(k)).length, 0);

// ================================================================
secao('6. Para onde o aluno está indo');

conf('"Outro" fica em primeiro, com campo em branco',
  Core.OBJETIVOS[0].id + ':' + Core.OBJETIVOS[0].livre, 'outro:true');
conf('e os quatro da conversa dela estão lá',
  Core.OBJETIVOS.slice(1).map(o => o.id).join(','),
  'media,selecao-colegio,vestibular,fora');
conf('nenhum travessão nos objetivos', /[\u2013\u2014]/.test(JSON.stringify(Core.OBJETIVOS)), false);

conf('aluno sem mapeamento não tem objetivo', Core.objetivoDe({ id: 'a9' }), 'null');
conf('mapeamento sem objetivo também não',
  Core.objetivoDe({ id: 'a9', mapeamentos: [Core.mapeamentoNovo()] }), 'null');

function comObjetivo(objetivo) {
  const m = Core.mapeamentoNovo();
  m.objetivo = objetivo;
  return { id: 'a7', nome: 'Aluno de Teste', mapeamentos: [m] };
}
conf('o objetivo da lista sai em português',
  Core.objetivoDe(comObjetivo({ tipo: 'vestibular', descricao: '', dataProva: '' })).rotulo,
  'Vestibular ou ENEM');
conf('o "Outro" sai com o que ela escreveu',
  Core.objetivoDe(comObjetivo({ tipo: 'outro', descricao: 'Prova de bolsa do colégio', dataProva: '' })).rotulo,
  'Prova de bolsa do colégio');
conf('e sem nada escrito ainda sai como Outro',
  Core.objetivoDe(comObjetivo({ tipo: 'outro', descricao: '', dataProva: '2026-11-10' })).rotulo, 'Outro');
conf('a data da prova vem junto',
  Core.objetivoDe(comObjetivo({ tipo: 'media', descricao: '', dataProva: '2026-11-10' })).dataProva,
  '2026-11-10');

conf('sem data não há contagem', Core.semanasAteAProva('', '2026-09-03'), 'null');
conf('seis semanas antes', Core.semanasAteAProva('2026-10-15', '2026-09-03').texto, 'faltam 6 semanas');
conf('uma semana antes', Core.semanasAteAProva('2026-09-10', '2026-09-03').texto, 'falta 1 semana');
conf('três dias antes', Core.semanasAteAProva('2026-09-06', '2026-09-03').texto, 'faltam 3 dias');
conf('um dia antes', Core.semanasAteAProva('2026-09-04', '2026-09-03').texto, 'falta 1 dia');
conf('no dia', Core.semanasAteAProva('2026-09-03', '2026-09-03').texto, 'é hoje');
conf('depois do dia a aula não mente',
  Core.semanasAteAProva('2026-08-20', '2026-09-03').texto, 'já passou');
conf('e diz que passou', Core.semanasAteAProva('2026-08-20', '2026-09-03').passou, true);
conf('o número de semanas bate', Core.semanasAteAProva('2026-10-15', '2026-09-03').semanas, 6);

// ----------------------------------------------------------------
secao('7. O ano escolar deixou de ser uma lista fechada');

conf('as séries continuam todas lá',
  ['02', '05', '09', 'em1', 'em3'].every(a => !!Core.ANOS_ESCOLARES[a]), true);
conf('e agora cabe cursinho', Core.ANOS_ESCOLARES.cursinho, 'Cursinho');
conf('aluno fora da escola', Core.ANOS_ESCOLARES.fora, 'Fora da escola');
conf('e "Outro", com campo em branco', Core.anoEscolarLivre('outro'), true);
conf('a ordem da lista começa pelas séries', Core.ANOS_ESCOLARES_ORDEM[0], '02');
conf('e termina nos três casos de fora',
  Core.ANOS_ESCOLARES_ORDEM.slice(-3).join(','), 'cursinho,fora,outro');
conf('toda entrada da ordem tem rótulo',
  Core.ANOS_ESCOLARES_ORDEM.every(a => !!Core.ANOS_ESCOLARES[a]), true);

conf('o banco de temas lê cursinho como 3º do médio', Core.serieParaTemas('cursinho'), 'em3');
conf('e não inventa série para quem está fora da escola', Core.serieParaTemas('fora'), '');
conf('nem para o caso livre', Core.serieParaTemas('outro'), '');
conf('a série de sempre continua ela mesma', Core.serieParaTemas('08'), '08');

function comAno(ano, livre) {
  const m = Core.mapeamentoNovo();
  m.anoEscolar = ano;
  m.anoEscolarOutro = livre || '';
  m.escola = 'Colégio de Teste';
  return { id: 'a8', nome: 'Aluno de Teste', mapeamentos: [m] };
}
conf('o fechamento situa o aluno de cursinho',
  Core.contextoEscolarDe(comAno('cursinho')), 'Cursinho, Colégio de Teste');
conf('e o aluno do 8º ano como sempre',
  Core.contextoEscolarDe(comAno('08')), '8º ano, Colégio de Teste');
conf('o caso livre sai com o que ela escreveu',
  Core.contextoEscolarDe(comAno('outro', '1º período de engenharia')),
  '1º período de engenharia, Colégio de Teste');
conf('e sem nada escrito não vira linha vazia',
  Core.contextoEscolarDe(comAno('outro', '')), 'Colégio de Teste');
conf('aluno sem mapeamento nenhum continua sem contexto',
  Core.contextoEscolarDe({ id: 'a9', nome: 'Aluno de Teste' }), '');

conf('a trilha do aluno de cursinho mira o topo',
  Core.anoEscolarDe(comAno('cursinho')), 'em3');
conf('a do aluno fora da escola não mira nada, que é o lado seguro',
  Core.anoEscolarDe(comAno('fora')), '');
conf('e a do aluno do 8º ano continua no 8º',
  Core.anoEscolarDe(comAno('08')), '08');

// ================================================================
console.log('\n' + '='.repeat(60));
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
