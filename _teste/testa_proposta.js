/* testa_proposta.js
 * A proposta de acompanhamento, sem navegador: o modelo, a conta dos planos e
 * a folha que a família recebe.
 *
 * A proposta é o primeiro documento que uma família nova lê sobre o próprio
 * filho, e ela é mandada pelo WhatsApp sem ninguém conferir depois. Por isso as
 * travas daqui não são só de "não estourou": elas olham o texto que sai
 * impresso na folha.
 *
 * Três coisas quebrariam calado e cada uma tem seção própria:
 *
 * 1. A conta dos planos. Um arredondamento para cima entrega menos desconto do
 *    que o percentual anunciado na linha de cima, e é a família que faz essa
 *    conta. A tabela do documento de desenho é reproduzida número a número.
 *
 * 2. Os pontos de atenção. Eles nascem DESMARCADOS mesmo quando estão marcados
 *    no mapeamento: a ficha é interna e pode ser dura, a proposta não. Uma
 *    folha que abre listando "Chuta sem tentar" perde a família.
 *
 * 3. O tom. Multa, taxa, cláusula, penalidade e rescisão transformam a proposta
 *    em contrato, e travessão quebra a regra da casa. As duas coisas são
 *    conferidas no texto que sai impresso, e não no código-fonte.
 */
const fs = require('fs');
const path = require('path');
const Core = require('../core.js');
const PDFGen = require('../pdf.js');

let passes = 0, falhas = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

/* O dia de hoje é fixo no teste, senão a prova muda de resultado amanhã. */
const HOJE = '2026-09-04';

/* O texto que SAI IMPRESSO na folha, e não o código que a escreveu.
 *
 * Os fluxos de conteúdo não são comprimidos, então cada palavra da página está
 * ali dentro de um operador Tj. A leitura é em latin1 porque é assim que o
 * WinAnsi guarda os acentuados: do 0xA0 para cima os dois coincidem. */
function textoDoPdf(bytes) {
  const bruto = Buffer.from(bytes).toString('latin1');
  const rx = /\(((?:\\.|[^\\()])*)\)\s*Tj/g;
  const partes = [];
  let m;
  while ((m = rx.exec(bruto))) partes.push(m[1].replace(/\\([\\()])/g, '$1'));
  return partes.join(' ');
}

function fixarDatas(p) {
  p.data = HOJE;
  p.validaAte = Core.somaDiasIso(HOJE, 30);
  return p;
}

// ================================================================
secao('1. A conta dos planos, número a número');

/* A tabela do documento de desenho: âncora de R$ 115, escada de 0, 5 e 10 por
 * cento, um encontro de 1h30 por semana. */
const conta = Core.calcularPlanos({
  ancora: 115, descontos: { mensal: 0, trimestral: 5, semestral: 10 },
  porSemana: 1, duracaoMin: 90
});
const porId = {};
conta.planos.forEach(p => { porId[p.id] = p; });

conf('a aula avulsa fica na âncora', Core.fmtMoeda(conta.avulsa.valorHora), 'R$ 115,00');
conf('e um encontro avulso de 1h30 custa uma hora e meia', Core.fmtMoeda(conta.avulsa.valorEncontro), 'R$ 172,50');

conf('mensal: 4 encontros', porId.mensal.encontros, 4);
conf('mensal: 6 horas', porId.mensal.horas, 6);
conf('mensal: sem desconto, a hora é a âncora', Core.fmtMoeda(porId.mensal.valorHora), 'R$ 115,00');
conf('mensal: total do período', Core.fmtMoeda(porId.mensal.total), 'R$ 690,00');

conf('trimestral: 12 encontros', porId.trimestral.encontros, 12);
conf('trimestral: 18 horas', porId.trimestral.horas, 18);
conf('trimestral: a hora com 5 por cento', Core.fmtMoeda(porId.trimestral.valorHora), 'R$ 109,00');
conf('trimestral: total do período', Core.fmtMoeda(porId.trimestral.total), 'R$ 1.962,00');

conf('semestral: 24 encontros', porId.semestral.encontros, 24);
conf('semestral: 36 horas', porId.semestral.horas, 36);
conf('semestral: a hora com 10 por cento', Core.fmtMoeda(porId.semestral.valorHora), 'R$ 103,50');
conf('semestral: total do período', Core.fmtMoeda(porId.semestral.total), 'R$ 3.726,00');

/* O arredondamento é PARA BAIXO em degraus de meio real. Para cima, 115 menos
 * 5 por cento viraria R$ 109,50, que é menos desconto do que os 5 por cento
 * escritos ao lado: a família faz essa conta. */
secao('2. Arredondamento em degraus de meio real, sempre para baixo');

conf('115 menos 5 por cento cai em 109,00, e não em 109,50',
  Core.fmtMoeda(Core.arredondaMeioReal(115 * 0.95)), 'R$ 109,00');
conf('valor que já bate no degrau não se mexe',
  Core.fmtMoeda(Core.arredondaMeioReal(103.5)), 'R$ 103,50');
conf('130 menos 7 por cento', Core.fmtMoeda(Core.arredondaMeioReal(130 * 0.93)), 'R$ 120,50');
conf('o ponto flutuante do 0,90 não derruba meio real',
  Core.fmtMoeda(Core.arredondaMeioReal(100 * 0.9)), 'R$ 90,00');
conf('centavo solto some para baixo', Core.fmtMoeda(Core.arredondaMeioReal(99.99)), 'R$ 99,50');
conf('valor negativo não vira preço', Core.arredondaMeioReal(-10), 0);

secao('3. Desconto zero, âncora zero e escada exagerada');

const semDesconto = Core.calcularPlanos({
  ancora: 100, descontos: { mensal: 0, trimestral: 0, semestral: 0 },
  porSemana: 1, duracaoMin: 60
});
conf('sem desconto nenhum, os três planos ficam na âncora',
  semDesconto.planos.map(p => p.valorHora).join('/'), '100/100/100');
conf('e o semestral é só a âncora vezes as horas',
  Core.fmtMoeda(semDesconto.planos[2].total), 'R$ 2.400,00');
conf('sem desconto não sai aviso', semDesconto.aviso, '');
conf('e o maior desconto é zero', semDesconto.maiorDesconto, 0);

const semAncora = Core.calcularPlanos({ ancora: 0, descontos: {}, porSemana: 1, duracaoMin: 90 });
conf('âncora zero não estoura a conta', semAncora.planos.length, 3);
conf('e devolve zero em vez de NaN', semAncora.planos[1].total, 0);

const exagerada = Core.calcularPlanos({
  ancora: 120, descontos: { mensal: 0, trimestral: 15, semestral: 30 },
  porSemana: 1, duracaoMin: 90
});
conf('escada de 30 por cento acende o aviso', exagerada.aviso.length > 0, true);
conf('e o aviso diz o limite', exagerada.aviso.indexOf('25 por cento') > 0, true);
conf('a escada de 0, 5 e 10 não acende nada', conta.aviso, '');

secao('4. Frequência e duração mudam as horas, não o valor da hora');

const doisPorSemana = Core.calcularPlanos({
  ancora: 115, descontos: { mensal: 0, trimestral: 5, semestral: 10 },
  porSemana: 2, duracaoMin: 60
});
conf('duas vezes por semana dá 8 encontros no mês', doisPorSemana.planos[0].encontros, 8);
conf('de uma hora cada, 8 horas', doisPorSemana.planos[0].horas, 8);
conf('o valor da hora é o mesmo', Core.fmtMoeda(doisPorSemana.planos[1].valorHora), 'R$ 109,00');
conf('o total acompanha as horas', Core.fmtMoeda(doisPorSemana.planos[1].total), 'R$ 2.616,00');

secao('5. A âncora sugerida');

conf('quem cobra 100 ancora em 115', Core.ancoraSugerida(100), 115);
conf('quem cobra 110 ancora em 130 (múltiplo de cinco, para cima)', Core.ancoraSugerida(110), 130);
conf('sem preço não há âncora', Core.ancoraSugerida(0), 0);

// ================================================================
secao('6. O registro nasce com os padrões dela');

const nova = Core.propostaNova();
conf('o registro tem identificador', nova.id.length > 4, true);
conf('nasce em hora-aula, que é o mais simples', nova.cobranca.modo, 'hora');
conf('a validade nasce em 30 dias',
  Core.somaDiasIso(nova.data, 30), nova.validaAte);
conf('a cidade dela vem escrita', nova.cidade, 'Niterói');
conf('a escada padrão é 0, 5 e 10',
  [nova.cobranca.descontos.mensal, nova.cobranca.descontos.trimestral, nova.cobranca.descontos.semestral].join('/'),
  '0/5/10');
conf('o plano recomendado padrão é o trimestral', nova.cobranca.recomendado, 'trimestral');
conf('o encontro nasce em 90 minutos, como o do mapeamento', nova.encontro.duracaoMin, 90);
conf('e uma vez por semana, na casa da família', nova.encontro.porSemana + '/' + nova.encontro.local, '1/casa');
conf('o aviso de remarcação nasce em 24 horas', nova.combinados.horas, 24);
conf('e a franquia em duas folgas por semestre', nova.combinados.folgas, 2);
conf('os sete combinados nascem ligados',
  nova.combinados.itens.filter(i => i.ligado).length, 7);
conf('as quatro vantagens também', nova.vantagens.filter(i => i.ligado).length, 4);
conf('nenhum campo obrigatório vem inventado', nova.aluno + '|' + nova.responsavel, '|');
conf('e nada nasce marcado no mapa', nova.fortes.length + nova.atencao.length + nova.lacunas.length, 0);

secao('7. O combinado é padrão EDITÁVEL, e nunca texto fixo');

const combinado = nova.combinados.itens.map(i => i.id).join(',');
conf('a ordem abre pelo trabalho pedagógico, e não pela regra',
  nova.combinados.itens[0].id, 'preparo');
conf('e o preparo do material é o argumento, não o horário reservado',
  nova.combinados.itens[0].texto.indexOf('preparado antes') > 0, true);
conf('as duas folgas por semestre estão no combinado', combinado.indexOf('folgas') >= 0, true);
conf('a folga não pede explicação',
  nova.combinados.itens[2].texto.indexOf('não precisam me dar explicação') > 0, true);
conf('a mesma régua vale quando quem desmarca é ela',
  combinado.indexOf('eu-desmarco') >= 0, true);
conf('a reposição tem prazo', combinado.indexOf('reposicao') >= 0, true);

/* Se ela mudar o número de horas ANTES de gerar, o texto do padrão acompanha.
 * Depois que ela edita a frase, a frase dela é que vai para o registro. */
const dbDela = { alunos: [], aulas: [], resumos: [], ajustes: { propostaPadrao: { horasDeAviso: 48, folgasPorSemestre: 3, cidade: 'Niterói', descontos: { trimestral: 8 } } } };
const comPadraoDela = Core.propostaNova(Core.propostaPadraoDe(dbDela));
conf('o número de horas dela entra no texto',
  comPadraoDela.combinados.itens[1].texto.indexOf('48 horas') > 0, true);
conf('e a franquia sai por extenso no rótulo',
  comPadraoDela.combinados.itens[2].rotulo, 'Três folgas por semestre');
conf('o desconto que ela guardou vale', comPadraoDela.cobranca.descontos.trimestral, 8);
conf('e o que ela não mexeu cai no padrão da casa', comPadraoDela.cobranca.descontos.semestral, 10);

const editada = Core.propostaPadraoDe({
  ajustes: { propostaPadrao: { combinados: [{ id: 'meu', rotulo: 'Do meu jeito', texto: 'Escrevi eu.' }] } }
});
conf('o texto que ela escreveu vence o da casa', editada.combinados.length, 1);
conf('e sai inteiro', editada.combinados[0].texto, 'Escrevi eu.');

secao('8. As gêmeas das funções de mapeamento');

conf('aluno sem proposta nenhuma devolve lista vazia', Core.propostasDe(null).length, 0);
conf('e proposta atual nenhuma', Core.propostaAtual({ nome: 'x' }), null);
const comDuas = {
  nome: 'Helena Prado',
  propostas: [
    { id: 'p2', data: '2026-08-01' },
    { id: 'p1', data: '2026-03-10' }
  ]
};
conf('as propostas saem em ordem de data', Core.propostasDe(comDuas).map(p => p.id).join(','), 'p1,p2');
conf('e a que vale é a mais recente', Core.propostaAtual(comDuas).id, 'p2');

// ================================================================
secao('9. Aluno sem preço cadastrado');

const semPreco = { id: 'a1', nome: 'Helena Prado', responsavel: 'Sandra Prado' };
const dbVazio = { alunos: [semPreco], aulas: [], resumos: [], ajustes: {} };
const pSemPreco = Core.preencherProposta(dbVazio, semPreco);
conf('cai no mesmo valor padrão do botão de adicionar valor', pSemPreco.cobranca.valorHora, 100);
conf('e a âncora sai desse valor', pSemPreco.cobranca.ancora, 115);
conf('o nome e o responsável vêm do cadastro',
  pSemPreco.aluno + '|' + pSemPreco.responsavel, 'Helena Prado|Sandra Prado');
conf('sem mapeamento, a matéria cai em matemática', pSemPreco.materias.join(','), 'matematica');
/* Sem aula nenhuma lançada não há hábito nenhum: a proposta fica nos 90
 * minutos do encontro de mapeamento, e não nos 60 de recurso da duração
 * habitual, senão ela ofereceria uma hora para quem ela combina hora e meia. */
conf('sem aula lançada, o encontro fica nos 90 minutos do padrão', pSemPreco.encontro.duracaoMin, 90);
conf('e uma vez por semana', pSemPreco.encontro.porSemana, 1);

const comPreco = {
  id: 'a2', nome: 'Rafael Torres', responsavel: 'Marina Torres',
  precos: [{ id: 'v1', inicio: '2026-01-01', fim: null, valorHora: 120 }],
  grade: { dias: [2, 4], hora: '15:00', duracaoMin: 90 }
};
const dbComPreco = {
  alunos: [comPreco],
  aulas: [
    { id: 'l1', alunoId: 'a2', data: '2026-08-04', duracao: 90, status: 'realizada' },
    { id: 'l2', alunoId: 'a2', data: '2026-08-06', duracao: 90, status: 'realizada' },
    { id: 'l3', alunoId: 'a2', data: '2026-08-11', duracao: 60, status: 'realizada' }
  ],
  resumos: [], ajustes: {}
};
const pComPreco = Core.preencherProposta(dbComPreco, comPreco);
conf('o preço vigente vira o valor da proposta', pComPreco.cobranca.valorHora, 120);
conf('a âncora é 15 por cento acima, em múltiplo de cinco', pComPreco.cobranca.ancora, 140);
conf('a duração vem da duração habitual das aulas', pComPreco.encontro.duracaoMin, 90);
conf('e a frequência vem da grade', pComPreco.encontro.porSemana, 2);

// ================================================================
secao('10. Os pontos de atenção nascem desmarcados');

const m = Core.mapeamentoNovo();
m.data = '2026-09-02';
m.aulaId = 'aula-de-nivelamento';
m.escola = 'Colégio Nossa Senhora';
m.anoEscolar = '08';
m.nivel = '2';
m.objetivo = { tipo: 'media', descricao: '', dataProva: '2026-10-20' };
m.marcados.fortes = ['raciocinio-ok', 'pergunta', 'gosta', 'pega-rapido', 'calculo-mental'];
m.marcados.atencao = ['sinal', 'fracao-fraca', 'vespera', 'nao-confere', 'ansiedade-prova',
  'fora-do-modelo', 'branco', 'chuta', 'dispersa', 'enunciado-fraco'];
m.marcados.lacunas = ['fracoes', 'decimais', 'inteiros', 'eq1'];
const comMapa = {
  id: 'a3', nome: 'Rafael Torres', responsavel: 'Marina Torres',
  precos: [{ id: 'v1', inicio: '2026-01-01', fim: null, valorHora: 120 }],
  mapeamentos: [m]
};
const dbMapa = { alunos: [comMapa], aulas: [], resumos: [], ajustes: {} };
const pMapa = Core.preencherProposta(dbMapa, comMapa);

conf('os dez pontos de atenção do mapeamento não vão para a proposta', pMapa.atencao.length, 0);
conf('mas os pontos fortes vão, marcados', pMapa.fortes.length, 5);
conf('as lacunas de ano anterior também', pMapa.lacunas.length, 4);
conf('a origem vira a aula de nivelamento', pMapa.origem, 'nivelamento');
conf('com a data da aula', pMapa.dataOrigem, '2026-09-02');
conf('sem aula de nivelamento, a origem é a conversa com os pais',
  Core.preencherProposta(dbVazio, semPreco).origem, 'conversa');
conf('o nível vem do mapeamento', pMapa.nivel, '2');
conf('o colégio também', pMapa.colegio, 'Colégio Nossa Senhora');

/* As áreas de trabalho, essas sim, saem da verdade inteira do mapeamento: o
 * plano é feito com o que ela viu, mesmo quando a folha não lista defeito. */
conf('as áreas de trabalho saem dos pontos de atenção do mapeamento',
  pMapa.areas.length > 0, true);
conf('estudar só na véspera vira cronograma', pMapa.areas.indexOf('cronograma') >= 0, true);
conf('e disciplina', pMapa.areas.indexOf('disciplina') >= 0, true);
conf('deixar em branco e chutar viram estratégia de prova',
  pMapa.areas.indexOf('estrategia-prova') >= 0, true);
conf('ler o enunciado sem entender vira enunciado', pMapa.areas.indexOf('enunciado') >= 0, true);
conf('a área sugerida existe mesmo na lista de AREAS',
  pMapa.areas.every(a => Core.rotuloArea(a).length > 0), true);
conf('sem ponto de atenção nenhum não sai área nenhuma', Core.areasSugeridas([]).length, 0);

secao('11. A vigência que nasce do plano aceito');

const pPlano = fixarDatas(Core.preencherProposta(dbMapa, comMapa));
pPlano.cobranca.modo = 'planos';
pPlano.cobranca.ancora = 140;
pPlano.cobranca.descontos = { mensal: 0, trimestral: 5, semestral: 10 };
const vig = Core.vigenciaDoPlano(pPlano, 'trimestral');
conf('a vigência começa no dia da proposta', vig.inicio, '2026-09-04');
conf('e termina três meses depois, menos um dia', vig.fim, '2026-12-03');
conf('com o valor por hora do plano', Core.fmtMoeda(vig.valorHora), 'R$ 133,00');
conf('o semestral vai até seis meses', Core.vigenciaDoPlano(pPlano, 'semestral').fim, '2027-03-03');
conf('plano que não existe não vira vigência', Core.vigenciaDoPlano(pPlano, 'anual'), null);

/* A vigência tem que passar pela mesma validação que a tela usa, senão ela
 * cria uma linha que se sobrepõe à antiga e o fechamento fica ambíguo. */
const alunoComVigencia = {
  precos: [
    { id: 'v0', inicio: '2026-01-01', fim: '2026-09-03', valorHora: 120 },
    vig
  ]
};
conf('a vigência do plano não se sobrepõe à anterior fechada',
  Core.validarPrecos(alunoComVigencia).length, 0);
conf('mês curto não estoura: 31 de janeiro mais um mês', Core.somaMesesIso('2026-01-31', 1), '2026-02-28');

// ================================================================
secao('12. A folha, em três casos');

const PALAVRAS_PROIBIDAS = ['multa', 'taxa', 'cláusula', 'clausula', 'penalidade', 'rescisão', 'rescisao'];

function folha(nome, op, minKB) {
  const bytes = PDFGen.gerarProposta(op);
  fs.writeFileSync(path.join(__dirname, nome), bytes);
  const kb = Math.round(bytes.length / 1024);
  const bruto = Buffer.from(bytes).toString('latin1');
  const texto = textoDoPdf(bytes);
  const paginas = (bruto.match(/\/Type \/Page[^s]/g) || []).length;
  console.log('  ' + nome + ': ' + kb + ' KB, ' + paginas + ' página(s)');

  conf(nome + ': é um PDF de verdade',
    bruto.slice(0, 5) === '%PDF-' && bruto.trim().slice(-5) === '%%EOF', true);
  conf(nome + ': tem pelo menos ' + minKB + ' KB', kb >= minKB, true);
  conf(nome + ': cabe em duas folhas', paginas <= 2, true);
  conf(nome + ': o nome do aluno está na folha', texto.indexOf(op.aluno) >= 0, true);

  /* Travessão é regra da casa, e a conferência é no texto impresso: o WinAnsi
   * guarda o travessão no 0x96 e no 0x97, então procurar o caractere no
   * código-fonte não veria um que tivesse entrado por outro caminho. */
  conf(nome + ': nenhum travessão saiu impresso',
    /[\u0096\u0097\u2013\u2014]/.test(texto), false);
  PALAVRAS_PROIBIDAS.forEach(function (p) {
    conf(nome + ': a palavra "' + p + '" não aparece',
      texto.toLowerCase().indexOf(p) >= 0, false);
  });
  ['undefined', 'NaN', '[object', 'null'].forEach(function (p) {
    conf(nome + ': nada de "' + p + '" na folha', texto.indexOf(p) >= 0, false);
  });
  conf(nome + ': não tem linha de assinatura',
    /assinatura|assino|de acordo/i.test(texto), false);

  return { bytes: bytes, texto: texto, paginas: paginas };
}

/* Caso 1: planos, a proposta cheia, saída de um mapeamento de verdade. */
const opPlanos = Core.dadosDaProposta(comMapa, (function () {
  const p = fixarDatas(Core.preencherProposta(dbMapa, comMapa));
  p.cobranca.modo = 'planos';
  p.cobranca.ancora = 140;
  p.cobranca.recomendado = 'trimestral';
  /* O mapeamento é da aula de nivelamento, então ainda não há aula nenhuma
   * lançada e a duração habitual cai no recurso de 60 minutos. Ela combinou
   * 1h30 com a família na conversa. */
  p.encontro.duracaoMin = 90;
  /* Ela marca na tela os poucos pontos de atenção que diria na frente da
   * família, e é só isso que vai para a folha. */
  p.atencao = ['vespera', 'nao-confere', 'ansiedade-prova'];
  p.materias = ['matematica', 'fisica'];
  p.texto = 'O Rafael entende rápido e pergunta quando não entende, que é o que ' +
    'faz a diferença numa aula particular. O que atrapalha hoje é a base de frações ' +
    'e de números negativos, que o oitavo ano cobra dentro de toda equação. A ideia é ' +
    'fechar essa base nas primeiras semanas e voltar para o conteúdo do ano com uma ' +
    'revisão curta toda semana, para não chegar na véspera da prova estudando do zero.';
  return p;
})());
const rPlanos = folha('proposta_planos.pdf', opPlanos, 3);

conf('a tabela sai com os rótulos da proposta, e não com os do fechamento',
  rPlanos.texto.indexOf('Total do período') >= 0 && rPlanos.texto.indexOf('Situação') < 0, true);
conf('a aula avulsa aparece como âncora', rPlanos.texto.indexOf('Aula avulsa') >= 0, true);
conf('o trimestral sai com o valor calculado', rPlanos.texto.indexOf('R$ 133,00') >= 0, true);
conf('e o total do trimestre', rPlanos.texto.indexOf('R$ 2.394,00') >= 0, true);
conf('o parágrafo que explica o desconto vem junto',
  rPlanos.texto.indexOf('não é do preço da aula') > 0, true);
conf('e diz até quando o horário fica reservado',
  rPlanos.texto.indexOf('03/12/2026') > 0, true);
conf('as duas folgas por semestre estão na folha',
  rPlanos.texto.indexOf('folgas por semestre') > 0, true);
conf('o material preparado antes está na folha',
  rPlanos.texto.indexOf('preparado antes') > 0, true);
conf('os pontos fortes aparecem', rPlanos.texto.indexOf('Pontos fortes') > 0, true);
conf('os pontos de atenção, só os três que ela marcou',
  rPlanos.texto.indexOf('Pontos de atenção') > 0, true);
conf('a folha não repete o nome dela no corpo',
  (rPlanos.texto.match(/Nathália Wajsenzon/g) || []).length, rPlanos.paginas * 2);

/* Caso 2: hora-aula, sem tabela nenhuma. */
const opHora = Core.dadosDaProposta(comPreco, (function () {
  const p = fixarDatas(Core.preencherProposta(dbComPreco, comPreco));
  p.cobranca.modo = 'hora';
  p.cobranca.valorHora = 120;
  p.texto = 'Combinamos começar pelas listas do colégio e usar a primeira meia hora ' +
    'de cada encontro para revisar o que ficou da semana anterior.';
  return p;
})());
const rHora = folha('proposta_hora.pdf', opHora, 3);
conf('sai o valor por hora-aula', rHora.texto.indexOf('R$ 120,00 por hora-aula') >= 0, true);
conf('e o valor de um encontro de 1h30', rHora.texto.indexOf('R$ 180,00') > 0, true);
conf('sem tabela de planos', rHora.texto.indexOf('Total do período') >= 0, false);
conf('e sem falar de desconto', rHora.texto.indexOf('desconto') >= 0, false);

/* Caso 3: a proposta mínima, que é o caminho principal. Aluno que ainda não
 * existe, dois campos digitados, e todo o resto no padrão. */
const pMinima = fixarDatas(Core.preencherProposta({ ajustes: {} }, null));
pMinima.aluno = 'Helena Prado';
pMinima.responsavel = 'Sandra Prado';
const rMinima = folha('proposta_minima.pdf', Core.dadosDaProposta(null, pMinima), 3);
conf('o responsável entra no bloco de identificação',
  rMinima.texto.indexOf('Sandra Prado') > 0, true);
conf('sem mapeamento, não sai seção de observação',
  rMinima.texto.indexOf('O que eu observei') >= 0, false);
conf('nem seção de ponto de partida com uma linha só',
  rMinima.texto.indexOf('Ponto de partida') >= 0, false);
conf('e nem seção de áreas vazia',
  rMinima.texto.indexOf('O que eu proponho trabalhar') >= 0, false);
conf('mas o combinado dos encontros sai sempre',
  rMinima.texto.indexOf('Como funcionam os encontros') > 0, true);
conf('e o investimento também', rMinima.texto.indexOf('Investimento') > 0, true);
conf('a proposta diz até quando vale', rMinima.texto.indexOf('Proposta válida até') > 0, true);

secao('13. A trava que protege a família: ponto de atenção nunca vem sozinho');

const soAtencao = fixarDatas(Core.preencherProposta(dbMapa, comMapa));
soAtencao.fortes = [];
soAtencao.atencao = ['chuta', 'vespera', 'dispersa'];
soAtencao.lacunas = [];
const tSoAtencao = textoDoPdf(PDFGen.gerarProposta(Core.dadosDaProposta(comMapa, soAtencao)));
conf('sem nenhum ponto forte, a lista de atenção não é impressa',
  tSoAtencao.indexOf('Chuta sem tentar') >= 0, false);
conf('e o título da seção também não sai',
  tSoAtencao.indexOf('Pontos de atenção') >= 0, false);

const comUmForte = fixarDatas(Core.preencherProposta(dbMapa, comMapa));
comUmForte.fortes = ['pergunta'];
comUmForte.atencao = ['chuta', 'vespera', 'dispersa'];
const tComForte = textoDoPdf(PDFGen.gerarProposta(Core.dadosDaProposta(comMapa, comUmForte)));
conf('com um ponto forte, a atenção pode sair', tComForte.indexOf('Chuta sem tentar') > 0, true);
conf('e o ponto forte vem antes do ponto de atenção na folha',
  tComForte.indexOf('Pontos fortes') < tComForte.indexOf('Pontos de atenção'), true);

const demais = fixarDatas(Core.preencherProposta(dbMapa, comMapa));
demais.fortes = ['pergunta'];
demais.atencao = ['chuta', 'vespera', 'dispersa', 'branco', 'nao-confere', 'nao-revisa',
  'ansiedade-prova', 'caderno-fraco'];
const tDemais = textoDoPdf(PDFGen.gerarProposta(Core.dadosDaProposta(comMapa, demais)));
conf('o teto de seis vale na folha: o sétimo não é impresso',
  tDemais.indexOf('Fica ansioso perto da prova') >= 0, false);
conf('e os seis primeiros saem', tDemais.indexOf('Não revisa a prova depois de corrigida') > 0, true);

secao('14. O fechamento do mês não mudou de tabela');

/* A tabela do fechamento passou a receber as colunas por parâmetro. Se o
 * parâmetro vazasse, doze famílias receberiam a folha do mês com os rótulos da
 * proposta. */
const dbFech = {
  alunos: [comPreco],
  aulas: [
    { id: 'f1', alunoId: 'a2', data: '2026-08-04', duracaoMin: 90, status: 'realizada' },
    { id: 'f2', alunoId: 'a2', data: '2026-08-06', duracaoMin: 90, status: 'realizada' }
  ],
  resumos: [], ajustes: {}
};
const fech = Core.calcularFechamento(dbFech, 'a2', '2026-08', HOJE);
const tFech = textoDoPdf(PDFGen.gerarFechamento(fech, {}));
conf('o fechamento continua com a coluna Situação', tFech.indexOf('Situação') > 0, true);
conf('e com a coluna R$/hora', tFech.indexOf('R$/hora') > 0, true);
conf('e não pegou nada da proposta', tFech.indexOf('Total do período') >= 0, false);
conf('e não pegou a coluna Compromisso', tFech.indexOf('Compromisso') >= 0, false);

// ================================================================
console.log('\n' + '='.repeat(60));
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
