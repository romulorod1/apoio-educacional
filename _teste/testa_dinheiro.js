/* testa_dinheiro.js
 * As contas de dinheiro do mês, sem navegador.
 *
 * Existe por causa de um defeito que ela viu: no primeiro dia do mês a tela já
 * mostrava o valor do mês inteiro, como se todas as aulas tivessem acontecido.
 * A aula nasce marcada como realizada, inclusive a que está lá na frente no
 * calendário, e a soma juntava o que já foi dado com o que ainda vai ser.
 *
 * O conserto não pede nada dela: quem separa é a data. O que já passou conta
 * como dado, a aula de HOJE conta como dada, e o que está marcado à frente vai
 * para uma soma separada. Este arquivo trava isso em sete situações: mês com
 * aula passada e futura, mês inteiro no passado, mês inteiro no futuro, a aula
 * de hoje, troca de preço no meio do mês, aluno sem preço cadastrado e as horas
 * que ela deu e não cobrou.
 *
 * Trava também que o número que é só dela nunca aparece no documento que a
 * família recebe, e que a sugestão de reajuste funciona sem internet nenhuma.
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

/* O dia de hoje é fixo no teste, senão a prova muda de resultado amanhã. */
const HOJE = '2026-09-15';

/* Setembro de 2026 da Ana, montado para ter de tudo:
 *   02  1h   realizada, cobrada, JÁ PASSOU, a R$ 100
 *   08  1h30 realizada, NÃO cobrada, já passou      (deu de graça)
 *   10  1h   cancelada com aviso, já passou         (reservada e desmarcada)
 *   15  1h   realizada, cobrada, É HOJE, a R$ 120   (conta como dada)
 *   22  1h   realizada, cobrada, AINDA VAI ACONTECER
 *   25  0h30 cancelada com aviso, ainda vai acontecer
 *   29  1h   realizada, NÃO cobrada, ainda vai acontecer
 * O preço trocou de R$ 100 para R$ 120 no dia 15. */
function bancoDeProva() {
  return {
    alunos: [
      {
        id: 'a1', nome: 'Ana',
        precos: [
          { id: 'p1', inicio: '2026-01-01', fim: '2026-09-14', valorHora: 100 },
          { id: 'p2', inicio: '2026-09-15', fim: null, valorHora: 120 }
        ]
      },
      { id: 'a2', nome: 'Bruno' }
    ],
    aulas: [
      { id: 'l1', alunoId: 'a1', data: '2026-09-02', duracaoMin: 60, status: 'realizada' },
      { id: 'l2', alunoId: 'a1', data: '2026-09-08', duracaoMin: 90, status: 'realizada', cobravel: false },
      { id: 'l3', alunoId: 'a1', data: '2026-09-10', duracaoMin: 60, status: 'cancelada' },
      { id: 'l4', alunoId: 'a1', data: '2026-09-15', duracaoMin: 60, status: 'realizada' },
      { id: 'l5', alunoId: 'a1', data: '2026-09-22', duracaoMin: 60, status: 'realizada' },
      { id: 'l6', alunoId: 'a1', data: '2026-09-25', duracaoMin: 30, status: 'cancelada' },
      { id: 'l7', alunoId: 'a1', data: '2026-09-29', duracaoMin: 60, status: 'realizada', cobravel: false },
      { id: 'l8', alunoId: 'a1', data: '2026-06-10', duracaoMin: 60, status: 'realizada' },
      { id: 'l9', alunoId: 'a1', data: '2026-11-10', duracaoMin: 60, status: 'realizada' },
      { id: 'l10', alunoId: 'a2', data: '2026-09-03', duracaoMin: 60, status: 'realizada' }
    ],
    resumos: [],
    ajustes: {}
  };
}

const db = bancoDeProva();
const set = Core.calcularFechamento(db, 'a1', '2026-09', HOJE);

// ================================================================
secao('1. Mês com aula que já passou e aula que ainda vai acontecer');

conf('o mês inteiro continua somando o que sempre somou', Core.fmtMoeda(set.totalValor), 'R$ 340,00');
conf('e as horas cobradas do mês inteiro também', set.totalHoras, '3:00');
conf('o que já aconteceu é menos do que o mês inteiro', Core.fmtMoeda(set.valorFeito), 'R$ 220,00');
conf('as horas já dadas', set.horasFeitas, '2:00');
conf('o que está marcado à frente sai separado', Core.fmtMoeda(set.valorPrevisto), 'R$ 120,00');
conf('as horas ainda por dar', set.horasPrevistas, '1:00');
conf('feito mais previsto dá o mês inteiro',
  Core.fmtMoeda(set.valorFeito + set.valorPrevisto), Core.fmtMoeda(set.totalValor));
conf('o dia de referência fica guardado na conta', set.hoje, HOJE);

conf('encontros do mês inteiro', set.qtdEncontros, 5);
conf('encontros que já aconteceram', set.qtdEncontrosFeitos, 3);
conf('encontros marcados à frente', set.qtdEncontrosPrevistos, 2);

const l22 = set.linhas.filter(l => l.data === '2026-09-22')[0];
const l02 = set.linhas.filter(l => l.data === '2026-09-02')[0];
conf('a aula do dia 22 vem marcada como futura', l22.futura, true);
conf('a do dia 2 não', l02.futura, false);

// ================================================================
secao('2. A aula de hoje conta como dada');

const hoje15 = set.linhas.filter(l => l.data === HOJE)[0];
conf('a aula de hoje não é futura', hoje15.futura, false);
conf('e o valor dela já está no que aconteceu',
  Core.fmtMoeda(set.valorFeito), 'R$ 220,00');

/* Um dia antes, a mesma aula ainda é previsão. Um dia depois, continua dada.
 * É a única coisa que muda de um dia para o outro, e muda sozinha. */
const dia14 = Core.calcularFechamento(db, 'a1', '2026-09', '2026-09-14');
const dia16 = Core.calcularFechamento(db, 'a1', '2026-09', '2026-09-16');
conf('no dia 14 a aula do dia 15 ainda é previsão', Core.fmtMoeda(dia14.valorFeito), 'R$ 100,00');
conf('no dia 16 ela já está dada', Core.fmtMoeda(dia16.valorFeito), 'R$ 220,00');
conf('e o total do mês não se mexe em nenhum dos dois',
  Core.fmtMoeda(dia14.totalValor) + ' ' + Core.fmtMoeda(dia16.totalValor),
  'R$ 340,00 R$ 340,00');

// ================================================================
secao('3. Mês inteiro no passado: previsto é zero');

const junho = Core.calcularFechamento(db, 'a1', '2026-06', HOJE);
conf('junho tem uma aula', junho.linhas.length, 1);
conf('tudo o que junho vale já aconteceu',
  Core.fmtMoeda(junho.valorFeito), Core.fmtMoeda(junho.totalValor));
conf('e nada está marcado à frente', Core.fmtMoeda(junho.valorPrevisto), 'R$ 0,00');
conf('as horas dadas são as horas do mês', junho.horasFeitas, junho.totalHoras);
conf('nenhum encontro fica pendurado no futuro', junho.qtdEncontrosPrevistos, 0);

// ================================================================
secao('4. Mês inteiro no futuro: o número grande é zero, e é a verdade');

const novembro = Core.calcularFechamento(db, 'a1', '2026-11', HOJE);
conf('novembro tem aula marcada', novembro.linhas.length, 1);
conf('mas nada aconteceu ainda', Core.fmtMoeda(novembro.valorFeito), 'R$ 0,00');
conf('as horas dadas são zero', novembro.horasFeitas, '0:00');
conf('e o previsto é o mês inteiro',
  Core.fmtMoeda(novembro.valorPrevisto), Core.fmtMoeda(novembro.totalValor));
conf('nenhum encontro dado', novembro.qtdEncontrosFeitos, 0);

// ================================================================
secao('5. Troca de preço no meio do mês');

conf('setembro tem duas faixas de valor', set.faixas.length, 2);
conf('uma hora ainda a R$ 100', Core.fmtHoras(set.faixas[0].minutos) + ' a ' +
  Core.fmtMoeda(set.faixas[0].valorHora), '1:00 a R$ 100,00');
conf('duas horas já a R$ 120', Core.fmtHoras(set.faixas[1].minutos) + ' a ' +
  Core.fmtMoeda(set.faixas[1].valorHora), '2:00 a R$ 120,00');
conf('a aula de hoje já saiu pelo preço novo', hoje15.valorHora, 120);
conf('e a do dia 2 pelo antigo', l02.valorHora, 100);
conf('a separação por data não embaralhou as faixas',
  Core.fmtMoeda(set.faixas[0].valor + set.faixas[1].valor), Core.fmtMoeda(set.totalValor));

// ================================================================
secao('6. Aluno sem preço cadastrado');

const bruno = Core.calcularFechamento(db, 'a2', '2026-09', HOJE);
conf('o fechamento sai mesmo assim', !!bruno, true);
conf('com o valor zerado', Core.fmtMoeda(bruno.totalValor), 'R$ 0,00');
conf('e a data sem preço avisada', bruno.semPreco.join(','), '2026-09-03');
conf('a hora dada continua sendo contada como dada', bruno.horasFeitas, '1:00');
conf('sem nenhuma faixa de valor', bruno.faixas.length, 0);
conf('e sem sugestão de reajuste nenhuma',
  Core.sugestaoDeReajuste(null, Core.indicesDeReajuste(db), 0, 60, 3), null);

/* Aluno recém-criado, sem preços, sem aulas e sem nada. A tela dela abre com
 * gente assim todo dia, e nada pode quebrar. */
const dbCru = { alunos: [{ id: 'a9', nome: 'Novo' }], aulas: [], resumos: [] };
const cru = Core.calcularFechamento(dbCru, 'a9', '2026-09', HOJE);
conf('aluno sem aula nenhuma devolve fechamento vazio', cru.linhas.length, 0);
conf('com tudo zerado', Core.fmtMoeda(cru.valorFeito) + ' ' + Core.fmtMoeda(cru.valorPrevisto),
  'R$ 0,00 R$ 0,00');
conf('e o banco sem ajustes não atrapalha o panorama',
  Core.panoramaDeValores(dbCru, '2026-09', HOJE).linhas.length, 0);

/* Aula sem duração registrada não pode virar NaN no total. */
const dbSemDur = {
  alunos: [{ id: 'a1', nome: 'Ana', precos: [{ id: 'p', inicio: '2026-01-01', fim: null, valorHora: 100 }] }],
  aulas: [{ id: 'x', alunoId: 'a1', data: '2026-09-02', status: 'realizada' }], resumos: []
};
conf('aula sem duração não estraga a soma',
  Core.fmtMoeda(Core.calcularFechamento(dbSemDur, 'a1', '2026-09', HOJE).valorFeito), 'R$ 0,00');

// ================================================================
secao('7. O que ela deu e não cobrou');

conf('o total não cobrado continua sendo o de sempre', Core.fmtHoras(set.minutosNaoCobrados), '4:00');
conf('as horas que ela deu de graça', Core.fmtHoras(set.minutosDadosSemCobrar), '1:30');
conf('as horas reservadas e desmarcadas', Core.fmtHoras(set.minutosDesmarcados), '1:30');

/* A aula do dia 29 é uma aula futura já marcada como não cobrada. Não dá para
 * ter dado de graça uma aula que ainda não chegou, então ela não entra na conta
 * da gentileza: entra quando o dia chegar. */
conf('aula futura não cobrada ainda não conta como gentileza',
  Core.fmtHoras(set.minutosDadosSemCobrar), '1:30');
const depoisDo29 = Core.calcularFechamento(db, 'a1', '2026-09', '2026-09-30');
conf('no dia 30 ela já conta', Core.fmtHoras(depoisDo29.minutosDadosSemCobrar), '2:30');
conf('e nenhuma das duas contas passa do total não cobrado',
  depoisDo29.minutosDadosSemCobrar + depoisDo29.minutosDesmarcados <= depoisDo29.minutosNaoCobrados,
  true);

/* A falta sem aviso, quando ela decide não cobrar, é horário reservado que não
 * virou aula. Para ela é a mesma coisa que a desmarcada. */
const dbFalta = {
  alunos: [{ id: 'a1', nome: 'Ana', precos: [{ id: 'p', inicio: '2026-01-01', fim: null, valorHora: 100 }] }],
  aulas: [{ id: 'x', alunoId: 'a1', data: '2026-09-02', duracaoMin: 60, status: 'falta', cobravel: false }],
  resumos: []
};
const fFalta = Core.calcularFechamento(dbFalta, 'a1', '2026-09', HOJE);
conf('falta perdoada conta como horário reservado que não aconteceu',
  Core.fmtHoras(fFalta.minutosDesmarcados), '1:00');
conf('e não como aula dada de graça', Core.fmtHoras(fFalta.minutosDadosSemCobrar), '0:00');
conf('falta cobrada, que é o padrão, não entra em nenhuma das duas',
  Core.calcularFechamento({
    alunos: dbFalta.alunos,
    aulas: [{ id: 'y', alunoId: 'a1', data: '2026-09-02', duracaoMin: 60, status: 'falta' }],
    resumos: []
  }, 'a1', '2026-09', HOJE).minutosNaoCobrados, 0);

// ================================================================
secao('8. Esse número é só dela, e nunca sai no documento da família');

const md = Core.markdownFechamento(set, {});
conf('o texto do fechamento não fala em dadas sem cobrar', /sem cobrar/i.test(md), false);
conf('nem em reservadas e desmarcadas', /desmarcad/i.test(md), false);
conf('nem em gentileza', /gentileza/i.test(md), false);
conf('e continua trazendo o total a cobrar do mês', md.indexOf('R$ 340,00') >= 0, true);

const mdMes = Core.markdownMesInteiro(Core.calcularMesInteiro(db, '2026-09', HOJE), '2026-09');
conf('o documento do mês inteiro também não fala nisso', /sem cobrar|desmarcad/i.test(mdMes), false);

// ================================================================
secao('9. Os totais do mês, somados de todos os alunos');

const t = Core.totaisDoMes(Core.calcularMesInteiro(db, '2026-09', HOJE));
conf('dois alunos no mês', t.alunos, 2);
conf('o que já aconteceu, somado', Core.fmtMoeda(t.valorFeito), 'R$ 220,00');
conf('o que está marcado à frente, somado', Core.fmtMoeda(t.valorPrevisto), 'R$ 120,00');
conf('o mês inteiro, somado', Core.fmtMoeda(t.valor), 'R$ 340,00');
conf('as horas dadas incluem a hora do aluno sem preço', Core.fmtHoras(t.minFeitos), '3:00');
conf('as gentilezas somadas', Core.fmtHoras(t.minutosDadosSemCobrar), '1:30');
conf('e os horários desmarcados somados', Core.fmtHoras(t.minutosDesmarcados), '1:30');
conf('lista vazia devolve tudo zero', Core.totaisDoMes([]).valor, 0);
conf('e lista sem nada dentro também não quebra', Core.totaisDoMes(null).alunos, 0);

/* Um centavo que não fecha na tela do dinheiro dela vira desconfiança do
 * aplicativo inteiro. Aulas de 20 minutos a R$ 100 por hora dão R$ 33,333: o
 * que aconteceu mais o previsto tem que dar o total do mês assim mesmo. */
const dbCentavo = {
  alunos: [{ id: 'a1', nome: 'Ana', precos: [{ id: 'p', inicio: '2026-01-01', fim: null, valorHora: 100 }] }],
  aulas: [
    { id: 'c1', alunoId: 'a1', data: '2026-09-01', duracaoMin: 20, status: 'realizada' },
    { id: 'c2', alunoId: 'a1', data: '2026-09-02', duracaoMin: 20, status: 'realizada' },
    { id: 'c3', alunoId: 'a1', data: '2026-09-20', duracaoMin: 20, status: 'realizada' },
    { id: 'c4', alunoId: 'a1', data: '2026-09-21', duracaoMin: 20, status: 'realizada' }
  ],
  resumos: []
};
const cent = Core.calcularFechamento(dbCentavo, 'a1', '2026-09', HOJE);
conf('com centavos quebrados, feito mais previsto dá o total',
  Core.fmtMoeda(cent.valorFeito + cent.valorPrevisto), Core.fmtMoeda(cent.totalValor));
const tCent = Core.totaisDoMes([cent]);
conf('e no total do mês também',
  Core.fmtMoeda(tCent.valorFeito + tCent.valorPrevisto), Core.fmtMoeda(tCent.valor));

// ================================================================
secao('10. Cada aluno, desde quando e por quanto');

const pan = Core.panoramaDeValores(db, '2026-09', HOJE);
conf('os dois alunos entram na lista', pan.linhas.length, 2);
conf('a Ana vem primeiro, porque pesa mais no mês', pan.linhas[0].nome, 'Ana');

const ana = pan.linhas[0];
/* A data de "desde quando" segue a mesma ordem da ficha do aluno: o campo
 * "Aluno desde", quando ela preencheu; senão a primeira aula que aconteceu; e só
 * então o começo da vigência de preço mais antiga.
 *
 * A ordem antiga olhava a vigência primeiro, e isso dava duas respostas para a
 * mesma pergunta sobre o mesmo aluno: a aba Histórico dizia uma data e este
 * painel dizia outra, mais antiga. Ela decide reajuste olhando aqui, e
 * eventualmente repete o número para a família. */
conf('estuda com ela desde a primeira aula, e não desde o preço', ana.desde, '2026-06-10');
conf('há três meses', ana.mesesEstudando, 3);
conf('paga o valor que está vigente hoje', Core.fmtMoeda(ana.valorHora), 'R$ 120,00');
conf('e está nesse valor desde hoje mesmo', ana.mesesNoValor, 0);
conf('pesa tudo o que o mês vale', Math.round(ana.fatiaDoMes * 100), 100);
conf('e o mês dela é o do fechamento', Core.fmtMoeda(ana.valorNoMes), 'R$ 340,00');

const bru = pan.linhas[1];
conf('o Bruno aparece mesmo sem preço', bru.nome, 'Bruno');
conf('com o valor por hora em branco', bru.valorHora, null);
conf('e sem sugestão', bru.sugestao, null);
conf('mas com a data em que a primeira aula dele aconteceu', bru.desde, '2026-09-03');

// ================================================================
secao('11. A sugestão de reajuste, e ela funciona sem internet');

const ind = Core.indicesDeReajuste(db);
conf('sem nada baixado, vale o número escrito no aplicativo', ind.baixado, false);
conf('quanto as escolas subiram', ind.escolas12m, 8.81);
conf('e a inflação geral no mesmo período', ind.inflacao12m, 4.44);
conf('com a data do número à vista', ind.referencia, '2026-07');

const s = ana.sugestao;
conf('a sugestão sobe pelo índice das escolas', Core.pctBR(s.percentual), '8,81%');
conf('o valor novo', Core.fmtMoeda(s.valorNovo), 'R$ 130,57');
conf('quanto isso dá a mais por hora', Core.fmtMoeda(s.porHora), 'R$ 10,57');
conf('e quanto daria no ano, nas horas deste mês', Core.fmtMoeda(s.noAno), 'R$ 380,52');
conf('o motivo fala das escolas', s.motivo.indexOf('escolas subiram 8,81%') > 0, true);
conf('fala da inflação geral', s.motivo.indexOf('4,44%') > 0, true);
conf('e diz de quando é o número', s.motivo.indexOf('julho de 2026') > 0, true);
/* Regra da casa: nada de travessão no que ela lê. Os dois códigos vão escritos
 * em escape justamente para este arquivo também não ter nenhum. */
conf('o motivo não tem travessão', new RegExp('[\\u2013\\u2014]').test(s.motivo), false);

/* Quanto ela quer subir acima da inflação entra somado, e é dela. */
const dbMargem = bancoDeProva();
dbMargem.ajustes.reajusteAcimaDaInflacao = 2;
conf('a margem dela entra na conta', Core.margemDeReajuste(dbMargem), 2);
const comMargem = Core.panoramaDeValores(dbMargem, '2026-09', HOJE).linhas[0].sugestao;
conf('e sobe a sugestão', Core.pctBR(comMargem.percentual), '10,81%');
conf('com o valor novo maior', Core.fmtMoeda(comMargem.valorNovo), 'R$ 132,97');
conf('e o motivo dizendo que a margem é escolha dela',
  comMargem.motivo.indexOf('que você escolheu') > 0, true);

const dbTorto = bancoDeProva();
dbTorto.ajustes.reajusteAcimaDaInflacao = -5;
conf('margem negativa vira zero', Core.margemDeReajuste(dbTorto), 0);
dbTorto.ajustes.reajusteAcimaDaInflacao = 900;
conf('margem absurda fica no teto', Core.margemDeReajuste(dbTorto), 20);
dbTorto.ajustes.reajusteAcimaDaInflacao = 'muito';
conf('margem que não é número vira zero', Core.margemDeReajuste(dbTorto), 0);
conf('banco sem ajustes nenhum também dá zero', Core.margemDeReajuste({}), 0);

// ================================================================
secao('12. Quando o tablet tem internet, os números do IBGE se atualizam');

/* A forma exata da resposta do IBGE, agregado 7060, variação acumulada em doze
 * meses, com o índice geral e o subitem de ensino fundamental. */
const respostaIbge = [{
  id: '2265', variavel: 'IPCA - Variação acumulada em 12 meses', unidade: '%',
  resultados: [
    {
      classificacoes: [{ id: '315', categoria: { '7169': 'Índice geral' } }],
      series: [{ localidade: { id: '1' }, serie: { '202608': '4.51' } }]
    },
    {
      classificacoes: [{ id: '315', categoria: { '107671': '8101003.Ensino fundamental' } }],
      series: [{ localidade: { id: '1' }, serie: { '202608': '9.02' } }]
    }
  ]
}];
const lido = Core.lerIndicesDoIbge(respostaIbge);
conf('lê a alta das escolas', lido.escolas12m, 9.02);
conf('lê a inflação geral', lido.inflacao12m, 4.51);
conf('e o mês a que os dois se referem', lido.referencia, '2026-08');

const dbBaixado = bancoDeProva();
dbBaixado.ajustes.ibge = {
  escolas12m: 9.02, inflacao12m: 4.51, referencia: '2026-08', baixadoEm: '2026-09-10'
};
const indBaixado = Core.indicesDeReajuste(dbBaixado);
conf('o baixado passa na frente do escrito no aplicativo', indBaixado.escolas12m, 9.02);
conf('e vem marcado como baixado', indBaixado.baixado, true);
conf('com a data em que foi baixado', indBaixado.baixadoEm, '2026-09-10');
conf('a sugestão passa a usar o número novo',
  Core.pctBR(Core.panoramaDeValores(dbBaixado, '2026-09', HOJE).linhas[0].sugestao.percentual), '9,02%');

conf('resposta vazia não vale nada', Core.lerIndicesDoIbge([]), null);
conf('resposta nula também não', Core.lerIndicesDoIbge(null), null);
conf('resposta com só um dos dois números é descartada',
  Core.lerIndicesDoIbge([{ resultados: [respostaIbge[0].resultados[0]] }]), null);
conf('valor que não é número é descartado',
  Core.lerIndicesDoIbge([{
    resultados: [
      { classificacoes: [{ categoria: { '7169': 'Índice geral' } }], series: [{ serie: { '202608': '-' } }] },
      { classificacoes: [{ categoria: { '107671': 'x' } }], series: [{ serie: { '202608': '9.02' } }] }
    ]
  }]), null);

/* Guardado torto no banco, o aplicativo volta para o número escrito no código
 * em vez de sugerir com metade de um índice. */
const dbMeio = bancoDeProva();
dbMeio.ajustes.ibge = { escolas12m: 9.02 };
conf('índice guardado pela metade é ignorado', Core.indicesDeReajuste(dbMeio).escolas12m, 8.81);
conf('e o aplicativo diz que não é baixado', Core.indicesDeReajuste(dbMeio).baixado, false);

conf('o endereço do IBGE pede os dois de uma vez só',
  Core.IBGE_URL.indexOf('7169,107671') > 0, true);
conf('e é https, porque a página é servida por https',
  Core.IBGE_URL.slice(0, 8), 'https://');

// ================================================================
secao('13. Contas de tempo');

conf('meses entre duas datas', Core.mesesEntre('2025-01-10', '2026-09-15'), 20);
conf('o mês só fecha quando passa o dia', Core.mesesEntre('2026-01-20', '2026-09-15'), 7);
conf('mesmo dia dá zero', Core.mesesEntre('2026-09-15', '2026-09-15'), 0);
conf('data futura não vira número negativo', Core.mesesEntre('2026-12-01', '2026-09-15'), 0);
conf('sem data devolve nada', Core.mesesEntre('', '2026-09-15'), null);
conf('porcentagem em português', Core.pctBR(8.81), '8,81%');
conf('sem casa sobrando', Core.pctBR(9), '9%');
conf('e com uma casa só quando é o caso', Core.pctBR(2.5), '2,5%');

// ================================================================
console.log('\n' + '='.repeat(60));
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
