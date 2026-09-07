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

/* O texto impresso, PÁGINA POR PÁGINA.
 *
 * Nasceu para uma pergunta que o texto corrido não responde: dois combinados
 * que só fazem sentido lidos juntos estão na mesma folha? A moldura escreve
 * "Página N de M" como última coisa de cada página, então o corte é ali.
 * Devolve um vetor, uma posição por página, na ordem impressa. */
function textoPorPagina(bytes) {
  const bruto = Buffer.from(bytes).toString('latin1');
  const rx = /\(((?:\\.|[^\\()])*)\)\s*Tj/g;
  const paginas = [];
  let atual = [];
  let m;
  while ((m = rx.exec(bruto))) {
    const t = m[1].replace(/\\([\\()])/g, '$1');
    atual.push(t);
    if (/^Página \d+ de \d+$/.test(t)) { paginas.push(atual.join(' ')); atual = []; }
  }
  if (atual.length) paginas.push(atual.join(' '));
  return paginas;
}

/* Em que página está um trecho impresso. Zero quando ele não está na folha. */
function paginaDoTrecho(paginas, trecho) {
  for (let i = 0; i < paginas.length; i++) {
    if (paginas[i].indexOf(trecho) >= 0) return i + 1;
  }
  return 0;
}

/* A COR e o CORPO com que um trecho foi impresso, lidos do próprio arquivo.
 *
 * Existe porque "mais claro e menor que o vizinho" é o formato da letra miúda,
 * e nenhuma trava de texto enxerga isso: a folha pode dizer tudo certo e
 * desbotar justamente o parágrafo que fala em compromisso e em prazo. Cada
 * doc.texto sai como um BT próprio, com a cor e a fonte na frente do Tj, então
 * dá para ler os dois do operador. */
function estiloDoTrecho(bytes, trecho) {
  const bruto = Buffer.from(bytes).toString('latin1');
  const rx = /BT\s+([\d.]+) ([\d.]+) ([\d.]+) rg \/(F\d) ([\d.]+) Tf [^()]*\(((?:\\.|[^\\()])*)\)\s*Tj/g;
  let m;
  while ((m = rx.exec(bruto))) {
    const txt = m[6].replace(/\\([\\()])/g, '$1');
    if (txt.indexOf(trecho) >= 0) {
      const oito = v => Math.round(parseFloat(v) * 255);
      const hex = n => (n < 16 ? '0' : '') + n.toString(16);
      return {
        cor: '#' + hex(oito(m[1])) + hex(oito(m[2])) + hex(oito(m[3])),
        tam: parseFloat(m[5]),
        bold: m[4] === 'F2'
      };
    }
  }
  return null;
}

function fixarDatas(p) {
  p.data = HOJE;
  p.validaAte = Core.somaDiasIso(HOJE, 30);
  return p;
}

// ================================================================
secao('1. A conta dos planos, número a número');

/* A aluna medida na revisão: ela cobra R$ 130,00 a hora, a âncora da avulsa
 * nasce em R$ 150,00, a escada é de 0, 5 e 10 por cento POR BAIXO DO PREÇO
 * DELA, e o encontro é de 1h30 uma vez por semana.
 *
 * Descontando da âncora, como era antes, os três planos saíam acima do preço
 * dela: mensal R$ 150,00, trimestral R$ 142,50 e semestral R$ 135,00. Ela
 * mandaria para a família uma tabela inteira acima do próprio preço. */
const conta = Core.calcularPlanos({
  valorHora: 130, ancora: 150,
  descontos: { mensal: 0, trimestral: 5, semestral: 10 },
  porSemana: 1, duracaoMin: 90
});
const porId = {};
conta.planos.forEach(p => { porId[p.id] = p; });

conf('a aula avulsa fica na âncora', Core.fmtMoeda(conta.avulsa.valorHora), 'R$ 150,00');
conf('e um encontro avulso de 1h30 custa uma hora e meia', Core.fmtMoeda(conta.avulsa.valorEncontro), 'R$ 225,00');
conf('a conta devolve o preço de hoje, para a tela poder comparar',
  Core.fmtMoeda(conta.precoAtual), 'R$ 130,00');

conf('mensal: 4 encontros', porId.mensal.encontros, 4);
conf('mensal: 6 horas', porId.mensal.horas, 6);
conf('mensal: sem desconto, a hora é o preço que ela cobra hoje',
  Core.fmtMoeda(porId.mensal.valorHora), 'R$ 130,00');
conf('mensal: total do período', Core.fmtMoeda(porId.mensal.total), 'R$ 780,00');

conf('trimestral: 12 encontros', porId.trimestral.encontros, 12);
conf('trimestral: 18 horas', porId.trimestral.horas, 18);
conf('trimestral: a hora com 5 por cento abaixo do preço dela',
  Core.fmtMoeda(porId.trimestral.valorHora), 'R$ 123,50');
conf('trimestral: total do período', Core.fmtMoeda(porId.trimestral.total), 'R$ 2.223,00');

conf('semestral: 24 encontros', porId.semestral.encontros, 24);
conf('semestral: 36 horas', porId.semestral.horas, 36);
conf('semestral: a hora com 10 por cento abaixo do preço dela',
  Core.fmtMoeda(porId.semestral.valorHora), 'R$ 117,00');
conf('semestral: total do período', Core.fmtMoeda(porId.semestral.total), 'R$ 4.212,00');

/* A trava que a revisão pediu: nenhum plano pode sair acima do que ela cobra
 * hoje. Com desconto zero ou mais isso vale por construção, e a prova varre
 * preços e escadas em vez de confiar num caso. */
secao('1b. Nenhum plano acima do preço dela');

let acima = 0, fora = '';
[87.5, 100, 110, 120, 130, 133.33, 175, 240].forEach(function (preco) {
  [[0, 5, 10], [0, 0, 0], [5, 10, 15], [2, 7, 12]].forEach(function (esc) {
    const c = Core.calcularPlanos({
      valorHora: preco, ancora: Core.ancoraSugerida(preco),
      descontos: { mensal: esc[0], trimestral: esc[1], semestral: esc[2] },
      porSemana: 1, duracaoMin: 90
    });
    c.planos.forEach(function (pl) {
      if (pl.valorHora > preco) { acima++; fora = preco + '/' + esc.join('-') + '/' + pl.id; }
    });
  });
});
conf('nenhum plano passa do preço dela em 8 preços x 4 escadas', acima + (fora ? ' (' + fora + ')' : ''), 0);
conf('o mensal sem desconto cai exatamente no preço dela',
  Core.calcularPlanos({ valorHora: 133.5, ancora: 155, descontos: { mensal: 0 }, porSemana: 1, duracaoMin: 60 })
    .planos[0].valorHora, 133.5);
conf('e a linha diz o que significa contra o preço de hoje',
  porId.trimestral.comparada, 'R$ 6,50 abaixo do seu preço de hoje');
conf('o mensal diz que está no preço dela', porId.mensal.comparada, 'no seu preço de hoje');
conf('e a diferença sai em número, para a tela',
  porId.semestral.contraAtual, -13);

/* Âncora abaixo do preço dela imprimiria a aula sem compromisso mais barata do
 * que o plano, na mesma folha. */
const ancoraBaixa = Core.calcularPlanos({
  valorHora: 130, ancora: 110, descontos: { mensal: 0, trimestral: 5, semestral: 10 },
  porSemana: 1, duracaoMin: 90
});
conf('âncora abaixo do preço dela acende aviso',
  ancoraBaixa.avisos.some(a => a.indexOf('mais barata') > 0), true);
const descontoNegativo = Core.calcularPlanos({
  valorHora: 130, ancora: 150, descontos: { mensal: -20, trimestral: 5, semestral: 10 },
  porSemana: 1, duracaoMin: 90
});
conf('desconto negativo não vira aumento de preço',
  descontoNegativo.planos[0].valorHora, 130);

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
  valorHora: 100, ancora: 100, descontos: { mensal: 0, trimestral: 0, semestral: 0 },
  porSemana: 1, duracaoMin: 60
});
conf('sem desconto nenhum, os três planos ficam no preço dela',
  semDesconto.planos.map(p => p.valorHora).join('/'), '100/100/100');
conf('e o semestral é só o preço dela vezes as horas',
  Core.fmtMoeda(semDesconto.planos[2].total), 'R$ 2.400,00');
conf('sem desconto e sem marcação não sai aviso', semDesconto.aviso, '');
conf('e o maior desconto é zero', semDesconto.maiorDesconto, 0);

const semAncora = Core.calcularPlanos({ ancora: 0, descontos: {}, porSemana: 1, duracaoMin: 90 });
conf('âncora zero não estoura a conta', semAncora.planos.length, 3);
conf('e devolve zero em vez de NaN', semAncora.planos[1].total, 0);

/* Sem o preço de hoje a conta cai na âncora: torto, mas nunca NaN. É o que
 * segura quem chamar calcularPlanos sem passar o valorHora. */
const semBase = Core.calcularPlanos({ ancora: 150, descontos: { mensal: 0 }, porSemana: 1, duracaoMin: 60 });
conf('sem o preço de hoje, a conta cai na âncora', semBase.planos[0].valorHora, 150);

const exagerada = Core.calcularPlanos({
  valorHora: 120, ancora: 140, descontos: { mensal: 0, trimestral: 15, semestral: 30 },
  porSemana: 1, duracaoMin: 90
});
conf('escada de 30 por cento acende o aviso', exagerada.aviso.length > 0, true);
conf('e o aviso diz o limite', exagerada.aviso.indexOf('25 por cento') > 0, true);
conf('a escada de 0, 5 e 10 não acende nada', conta.aviso, '');

secao('4. Frequência e duração mudam as horas, não o valor da hora');

const doisPorSemana = Core.calcularPlanos({
  valorHora: 130, ancora: 150, descontos: { mensal: 0, trimestral: 5, semestral: 10 },
  porSemana: 2, duracaoMin: 60
});
conf('duas vezes por semana dá 8 encontros no mês', doisPorSemana.planos[0].encontros, 8);
conf('de uma hora cada, 8 horas', doisPorSemana.planos[0].horas, 8);
conf('o valor da hora é o mesmo', Core.fmtMoeda(doisPorSemana.planos[1].valorHora), 'R$ 123,50');
conf('o total acompanha as horas', Core.fmtMoeda(doisPorSemana.planos[1].total), 'R$ 2.964,00');

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
conf('os oito combinados nascem ligados',
  nova.combinados.itens.filter(i => i.ligado).length, 8);
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

/* A folha não pode prometer o que o motor não faz.
 *
 * O motor tem cobrável sim ou não, e mais nada: a aula cancelada que ela marca
 * como cobrável entra pelo valor inteiro. Enquanto isto dizia "meia aula",
 * numa aula de 1h30 a R$ 133,00 a folha prometia R$ 99,75 e o fechamento
 * cobrava R$ 199,50, e os dois documentos chegam à mesma família no mesmo mês.
 * A prova mede o fechamento de verdade, e não só a palavra. */
secao('7b. O combinado promete só o que o motor faz');

const textoCombinado = nova.combinados.itens.map(i => i.texto).join(' ');
conf('nenhum combinado promete meia aula', /meia aula|metade da aula/i.test(textoCombinado), false);
conf('a desmarcação de véspera entra pelo valor da aula',
  nova.combinados.itens[3].texto.indexOf('pelo valor da aula') > 0, true);

const alunoCancelada = {
  id: 'ac', nome: 'Helena Prado',
  precos: [{ id: 'v1', inicio: '2026-01-01', fim: null, valorHora: 133 }]
};
const dbCancelada = {
  alunos: [alunoCancelada],
  aulas: [{ id: 'c1', alunoId: 'ac', data: '2026-09-11', duracaoMin: 90, status: 'cancelada', cobravel: true }],
  resumos: [], ajustes: {}
};
const fCancelada = Core.calcularFechamento(dbCancelada, 'ac', '2026-09', '2026-09-30');
conf('o motor cobra a desmarcação cobrável pelo valor cheio de 1h30',
  Core.fmtMoeda(fCancelada.linhas[0].valor), 'R$ 199,50');
conf('e é isso que o combinado promete, e não metade',
  Core.fmtMoeda(133 * 1.5), 'R$ 199,50');

/* Falta sem aviso é a única linha que o motor já cobra sozinho, e era a única
 * que a folha não contava. */
conf('existe o combinado de falta sem aviso', combinado.indexOf('falta') >= 0, true);
conf('a falta conta como aula dada e não tem reposição',
  /conta como aula dada e não tem reposição/.test(textoCombinado), true);
conf('o motor cobra a falta por padrão, sem ela marcar nada',
  Core.STATUS.falta.cobravelPadrao, true);
conf('e a desmarcação com aviso não é cobrada por padrão',
  Core.STATUS.cancelada.cobravelPadrao, false);

/* A promessa de devolver o que foi pago e não usado supunha pacote adiantado,
 * e o motor cobra aula por aula, todo mês. */
conf('a saída não promete devolução de pacote',
  /devolvo|devolução/i.test(textoCombinado), false);

secao('7c. Nada de pronome fixo: metade das crianças é menina');

const textoTudo = textoCombinado + ' ' + nova.vantagens.map(v => v.texto).join(' ');
conf('nenhum padrão trata a criança por "ele"', /\b(ele|dele|nele)\b/i.test(textoTudo), false);
conf('nem por "a aluna" ou "o aluno"', /\bo aluno\b|\ba aluna\b/i.test(textoTudo), false);
conf('o material continua sendo o da semana',
  nova.vantagens[0].texto.indexOf('naquela semana') > 0, true);

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

/* O texto dela vence o da casa, item a item, e o que ela nunca tocou acompanha
 * a casa. A lista é guardada na PRIMEIRA proposta que ela gera, tenha editado
 * alguma coisa ou não: substituir o molde inteiro pela lista guardada fazia com
 * que combinado corrigido aqui nunca mais chegasse nela, e as duas correções
 * desta rodada (a meia aula e a falta sem aviso) morreriam ali. */
const editada = Core.propostaPadraoDe({
  ajustes: {
    propostaPadrao: {
      combinados: [
        { id: 'aviso', rotulo: 'Se precisarem desmarcar', texto: 'Me avisem no grupo da família, com um dia de antecedência.' },
        { id: 'meu', rotulo: 'Do meu jeito', texto: 'Escrevi eu.' }
      ]
    }
  }
});
const porIdComb = {};
editada.combinados.forEach(i => { porIdComb[i.id] = i; });
conf('o texto que ela escreveu vence o da casa',
  porIdComb.aviso.texto, 'Me avisem no grupo da família, com um dia de antecedência.');
conf('e o combinado que só ela tem continua na lista', porIdComb.meu.texto, 'Escrevi eu.');
conf('o que ela nunca tocou acompanha a casa',
  porIdComb.vespera.texto.indexOf('pelo valor da aula') > 0, true);
conf('e o combinado novo chega em quem já tinha lista guardada',
  !!porIdComb.falta, true);
conf('a ordem da casa é preservada, e o item só dela fica no fim',
  editada.combinados.map(i => i.id).join(','),
  'preparo,aviso,folgas,vespera,falta,eu-desmarco,reposicao,parar,meu');

/* Uma lista guardada ANTES desta rodada, com a promessa de meia aula, é o caso
 * real: ela já gerou proposta nesta branch e a lista dela ficou congelada. */
const congelada = Core.propostaPadraoDe({
  ajustes: {
    propostaPadrao: {
      combinados: [
        { id: 'vespera', rotulo: 'Depois dessas duas', texto: 'A desmarcação com menos de 24 horas entra no fechamento do mês como meia aula.' }
      ]
    }
  }
});
conf('a lista congelada volta a ter os oito combinados', congelada.combinados.length, 8);
conf('mas o texto que ela escreveu não é sobrescrito por trás dela',
  congelada.combinados[3].texto.indexOf('meia aula') > 0, true);
conf('e o desligado continua desligado',
  Core.propostaPadraoDe({ ajustes: { propostaPadrao: { vantagens: [{ id: 'duvida', ligado: false, texto: 'x' }] } } })
    .vantagens.filter(v => v.id === 'duvida')[0].ligado, false);

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
/* As aulas são gravadas com duracaoMin, e é esse o campo que a duração
 * habitual tem que ler. Enquanto ela lia a.duracao, que não existe em aula
 * nenhuma, a contagem ficava vazia e devolvia os 60 minutos de recurso para
 * todo mundo: uma aluna com aulas de 1h30 lançadas recebia proposta oferecendo
 * 1h, e a tabela inteira de planos saía calculada sobre a duração errada. */
const dbComPreco = {
  alunos: [comPreco],
  aulas: [
    { id: 'l1', alunoId: 'a2', data: '2026-08-04', duracaoMin: 90, status: 'realizada' },
    { id: 'l2', alunoId: 'a2', data: '2026-08-06', duracaoMin: 90, status: 'realizada' },
    { id: 'l3', alunoId: 'a2', data: '2026-08-11', duracaoMin: 60, status: 'realizada' }
  ],
  resumos: [], ajustes: {}
};
const pComPreco = Core.preencherProposta(dbComPreco, comPreco);
conf('o preço vigente vira o valor da proposta', pComPreco.cobranca.valorHora, 120);
conf('a âncora é 15 por cento acima, em múltiplo de cinco', pComPreco.cobranca.ancora, 140);
conf('a duração habitual lê duracaoMin, que é como a aula é gravada',
  Core.duracaoHabitual(dbComPreco, 'a2'), 90);
conf('a duração vem da duração habitual das aulas', pComPreco.encontro.duracaoMin, 90);
conf('e a frequência vem da grade', pComPreco.encontro.porSemana, 2);
conf('aula gravada no campo antigo não conta como hábito',
  Core.duracaoHabitual({ aulas: [{ alunoId: 'a2', duracao: 120 }] }, 'a2'), 60);

/* O número que a duração decide vai inteiro para a família: o total do
 * semestral com 1h30 é a metade a mais do total com 1h. */
const contaUmaHora = Core.calcularPlanos({
  valorHora: 120, ancora: 140, descontos: { mensal: 0, trimestral: 5, semestral: 10 },
  porSemana: 1, duracaoMin: 60
});
const contaHoraEMeia = Core.calcularPlanos({
  valorHora: 120, ancora: 140, descontos: { mensal: 0, trimestral: 5, semestral: 10 },
  porSemana: 1, duracaoMin: 90
});
conf('o semestral de 1h e o de 1h30 não são o mesmo documento',
  Core.fmtMoeda(contaUmaHora.planos[2].total) + ' x ' + Core.fmtMoeda(contaHoraEMeia.planos[2].total),
  'R$ 2.592,00 x R$ 3.888,00');

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

/* A área segue o ponto de atenção MARCADO, e não o do mapeamento.
 *
 * As duas listas nascem do mesmo conjunto. Derivando as áreas da verdade
 * inteira, a folha escondia o defeito numa seção e o devolvia quatro
 * centímetros abaixo com outro rótulo: dos dez pontos de atenção do
 * mapeamento saíam zero pontos de atenção impressos e OITO áreas marcadas,
 * entre elas "Concentração", que é "Dispersa com facilidade", e "Ansiedade ou
 * medo de prova", que é "Fica ansioso perto da prova". */
conf('nenhuma área nasce marcada, porque nenhum ponto de atenção nasceu marcado',
  pMapa.areas.length, 0);
conf('e a folha não devolve o defeito com outro rótulo',
  pMapa.areas.indexOf('concentracao') >= 0 || pMapa.areas.indexOf('ansiedade') >= 0, false);

/* Quando ela marca o ponto de atenção, a área vem junto: é a mesma tabelinha
 * de sempre, e é o que a tela chama a cada marcação. */
const sugeridas = Core.areasSugeridas(['vespera', 'branco', 'chuta', 'enunciado-fraco']);
conf('estudar só na véspera vira cronograma', sugeridas.indexOf('cronograma') >= 0, true);
conf('e disciplina', sugeridas.indexOf('disciplina') >= 0, true);
conf('deixar em branco e chutar viram estratégia de prova',
  sugeridas.indexOf('estrategia-prova') >= 0, true);
conf('ler o enunciado sem entender vira enunciado', sugeridas.indexOf('enunciado') >= 0, true);
conf('a área sugerida existe mesmo na lista de AREAS',
  sugeridas.every(a => Core.rotuloArea(a).length > 0), true);
conf('sem ponto de atenção nenhum não sai área nenhuma', Core.areasSugeridas([]).length, 0);

secao('11. A vigência que nasce do plano aceito');

/* A vigência fecha por SEMANAS, e é o que faz a folha e o fechamento darem o
 * mesmo número. Fechando por mês de calendário, o trimestral abria uma janela
 * de 04/09 a 03/12, que tem treze sextas-feiras: a folha prometia doze
 * encontros e o fechamento cobrava treze aulas, na mesma família e no mesmo
 * mês. */
const pPlano = fixarDatas(Core.preencherProposta(dbMapa, comMapa));
pPlano.cobranca.modo = 'planos';
pPlano.cobranca.valorHora = 120;
pPlano.cobranca.ancora = 140;
pPlano.cobranca.descontos = { mensal: 0, trimestral: 5, semestral: 10 };
pPlano.encontro.duracaoMin = 90;
pPlano.encontro.porSemana = 1;
const vig = Core.vigenciaDoPlano(pPlano, 'trimestral');
conf('a vigência começa no dia da proposta', vig.inicio, '2026-09-04');
conf('e termina doze semanas depois, menos um dia', vig.fim, '2026-11-26');
conf('com o valor por hora do plano', Core.fmtMoeda(vig.valorHora), 'R$ 114,00');
conf('o mensal fecha em quatro semanas', Core.vigenciaDoPlano(pPlano, 'mensal').fim, '2026-10-01');
conf('o semestral, em vinte e quatro', Core.vigenciaDoPlano(pPlano, 'semestral').fim, '2027-02-18');
conf('plano que não existe não vira vigência', Core.vigenciaDoPlano(pPlano, 'anual'), null);

/* A prova de verdade: montar as aulas semanais dentro da janela e passar o
 * mês inteiro pelo motor de fechamento, que é o que a família recebe depois. */
function cobradoNaVigencia(proposta, planoId) {
  const v = Core.vigenciaDoPlano(proposta, planoId);
  const aulas = [];
  let d = v.inicio, guarda = 0;
  while (d <= v.fim && guarda++ < 400) {
    aulas.push({ id: 'w' + guarda, alunoId: 'aw', data: d, duracaoMin: 90, status: 'realizada' });
    d = Core.somaDiasIso(d, 7);
  }
  const aluno = { id: 'aw', nome: 'Helena Prado', precos: [v] };
  const dbW = { alunos: [aluno], aulas: aulas, resumos: [], ajustes: {} };
  const meses = {};
  aulas.forEach(a => { meses[a.data.slice(0, 7)] = 1; });
  let valor = 0, n = 0;
  Object.keys(meses).sort().forEach(function (mes) {
    Core.calcularFechamento(dbW, 'aw', mes, '2027-12-31').linhas.forEach(function (l) {
      if (l.data >= v.inicio && l.data <= v.fim) { valor += l.valor; n++; }
    });
  });
  return { aulas: n, valor: Math.round(valor * 100) / 100 };
}

Core.PLANOS.forEach(function (pl) {
  const folha = Core.planoDaProposta(pPlano, pl.id);
  const conta = cobradoNaVigencia(pPlano, pl.id);
  conf(pl.id + ': o fechamento conta os encontros que a folha promete',
    conta.aulas, folha.encontros);
  conf(pl.id + ': e cobra exatamente o total impresso na folha',
    Core.fmtMoeda(conta.valor), Core.fmtMoeda(folha.total));
});

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
conf('o trimestral sai com o valor calculado', rPlanos.texto.indexOf('R$ 114,00') >= 0, true);
conf('e o total do trimestre', rPlanos.texto.indexOf('R$ 2.052,00') >= 0, true);
conf('nenhuma linha da tabela sai acima do que ela cobra hoje',
  opPlanos.planos.planos.filter(pl => pl.valorHora > 120).length, 0);
conf('o parágrafo que explica o desconto vem junto',
  rPlanos.texto.indexOf('não é do preço da aula') > 0, true);
conf('e diz até quando o horário fica reservado, doze semanas depois',
  rPlanos.texto.indexOf('26/11/2026') > 0, true);

/* A mãe lê "Semestral, 24 encontros, R$ 4.104,00" e precisa saber se está
 * sendo convidada a pagar tudo de uma vez. No modo hora-aula essa frase sempre
 * existiu; no modo planos não havia nenhuma. */
conf('a folha diz COMO se paga', rPlanos.texto.indexOf('pagamento continua mensal') > 0, true);
conf('e que não tem pacote adiantado',
  rPlanos.texto.indexOf('Não tem pacote para pagar adiantado') > 0, true);

/* O que a folha promete tem que ser o que o fechamento cobra. */
conf('a folha não promete meia aula', /meia aula|metade da aula/i.test(rPlanos.texto), false);
conf('a folha traz o combinado de falta sem aviso',
  rPlanos.texto.indexOf('Falta sem aviso') > 0, true);
conf('e não promete devolver pacote que ninguém pagou',
  /devolvo|devolução/i.test(rPlanos.texto), false);
conf('nem trata a criança por "ele"', /\b(ele|dele)\b/i.test(rPlanos.texto), false);
conf('as duas folgas por semestre estão na folha',
  rPlanos.texto.indexOf('folgas por semestre') > 0, true);
conf('o material preparado antes está na folha',
  rPlanos.texto.indexOf('preparado antes') > 0, true);
conf('os pontos fortes aparecem', rPlanos.texto.indexOf('Pontos fortes') > 0, true);
conf('os pontos de atenção, só os três que ela marcou',
  rPlanos.texto.indexOf('Pontos de atenção') > 0, true);
/* O nome dela aparece UMA vez no corpo, na assinatura, e a moldura assina as
 * demais. A assinatura foi pedida depois que esta trava nasceu: uma proposta
 * que termina sem despedida lê como formulário, e o documento existe
 * justamente para não ler como formulário. A trava continua servindo, agora
 * contando: mais de uma vez no corpo é repetição. */
const nomesNoCorpo = (rPlanos.texto.match(/Nathália Wajsenzon/g) || []).length;
/* A moldura escreve o nome dela DUAS vezes por pagina: no cabecalho e no rodape. */
const nomesNaMoldura = rPlanos.paginas * 2;
conf('o nome dela aparece uma vez no corpo, na assinatura',
  nomesNoCorpo - nomesNaMoldura, 1);
conf('e a despedida está lá', rPlanos.texto.indexOf('Com carinho,') > 0, true);

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
 * existe, e por isso sem mapeamento nenhum.
 *
 * Sem mapeamento somem as três primeiras seções e sobram o nome, a matéria, o
 * combinado e o preço: medido na folha mínima anterior, das 444 palavras
 * impressas 232 eram o combinado de desmarcação e NENHUMA era sobre a criança.
 * Por isso o parágrafo escrito por ela deixa de ser opcional aqui, e é o
 * pendenciasDaProposta que segura. */
const pMinima = fixarDatas(Core.preencherProposta({ ajustes: {} }, null));
pMinima.aluno = 'Helena Prado';
pMinima.responsavel = 'Sandra Prado';
pMinima.texto = 'A Helena está no oitavo ano e chegou por indicação da escola: ela ' +
  'acompanha bem a aula, mas trava na hora de estudar sozinha e chega na prova sem ' +
  'ter revisado. A ideia das primeiras semanas é montar com ela uma rotina curta de ' +
  'estudo e usar a lista do colégio como termômetro do que já está firme.';
const rMinima = folha('proposta_minima.pdf', Core.dadosDaProposta(null, pMinima), 3);
conf('o responsável entra no bloco de identificação',
  rMinima.texto.indexOf('Sandra Prado') > 0, true);
conf('sem mapeamento, não sai seção de observação',
  rMinima.texto.indexOf('O que eu observei') >= 0, false);
conf('e nem seção de áreas vazia',
  rMinima.texto.indexOf('O que eu proponho trabalhar') >= 0, false);
conf('mas o parágrafo dela sai, e é a parte que fala da criança',
  rMinima.texto.indexOf('travar') >= 0 || rMinima.texto.indexOf('rotina curta de estudo') > 0, true);
conf('no ponto de partida', rMinima.texto.indexOf('Ponto de partida') > 0, true);
conf('mas o combinado dos encontros sai sempre',
  rMinima.texto.indexOf('Como funcionam os encontros') > 0, true);
/* MUDOU DE PROPÓSITO: a seção do preço chamava "Investimento" e passou a
 * chamar "Quanto custa".
 *
 * "Investimento" pede que a família chame o preço por outro nome, e o nome que
 * oferece promete retorno financeiro sobre uma criança, que é o que esta folha
 * não promete em lugar nenhum. É também a palavra mais batida de material de
 * venda no Brasil, então quem lê reconhece o roteiro antes de ler o número. A
 * folha inteira é escrita com as palavras que ela diria na sala da família, e
 * na sala ninguém pergunta qual é o investimento: pergunta quanto custa. A
 * trava passa a conferir as duas metades, senão a palavra antiga volta calada
 * numa reescrita futura. */
conf('e a seção do preço, que agora pergunta quanto custa',
  rMinima.texto.indexOf('Quanto custa') > 0, true);
conf('e não usa a palavra de material de venda',
  rMinima.texto.indexOf('Investimento') >= 0, false);
/* MUDOU DE PROPÓSITO: a validade saiu do pé da folha e ficou só na tarja do
 * alto.
 *
 * A trava antiga era "a folha contém 'Proposta válida até'", e ela passava
 * justamente porque a validade estava escrita DUAS vezes num documento de duas
 * páginas: na tarja do cabeçalho e como última linha, em cinza, colada no
 * "Com carinho, Nathália Wajsenzon". Prazo encostado em despedida era a única
 * passagem da folha que soava ensaiada.
 *
 * A trava nova é mais forte do que a que ela substitui: em vez de conferir que
 * a validade aparece, confere QUANTAS vezes e ONDE. Uma vez só, no alto da
 * página 1, antes de qualquer seção. Assim nem a repetição volta calada nem a
 * data some da folha por descuido numa reescrita. */
const vezesValida = (rMinima.texto.match(/válida até/g) || []).length;
conf('a validade aparece uma vez só na folha', vezesValida, 1);
conf('e ela está na tarja do alto, antes da primeira seção',
  rMinima.texto.indexOf('válida até') < rMinima.texto.indexOf('Ponto de partida'), true);
conf('a validade não sai mais em cinza no pé da folha',
  rMinima.texto.indexOf('Proposta válida até') >= 0, false);

/* E a folha termina na assinatura: depois do nome dela não vem mais nada de
 * corpo, só a moldura, que é a mesma em toda página e é escrita por último. */
const paginasMinima = textoPorPagina(rMinima.bytes);
const ultimaMinima = paginasMinima[paginasMinima.length - 1];
conf('a última coisa escrita no corpo é a assinatura',
  /Com carinho, Nathália Wajsenzon Nathália Wajsenzon APOIO EDUCACIONAL Nathália Wajsenzon · Apoio Educacional Página \d+ de \d+$/
    .test(ultimaMinima.trim()), true);

/* O peso do combinado na folha mínima, medido: enquanto ele for mais da
 * metade das palavras, a folha é um regulamento com um nome no alto. Com o
 * parágrafo dela obrigatório, a criança volta a ter espaço. */
const palavrasMinima = rMinima.texto.split(/\s+/).filter(Boolean).length;
const palavrasDela = pMinima.texto.split(/\s+/).filter(Boolean).length;
console.log('  folha mínima: ' + palavrasMinima + ' palavras, ' + palavrasDela + ' escritas por ela');
conf('a folha mínima fala da criança em pelo menos 40 palavras', palavrasDela >= 40, true);

/* ================================================================
 * O TOM DA FOLHA: calorosa sem ficar ambígua.
 *
 * A folha estava correta e fria: lia como quem cumpre protocolo. Aquecer um
 * documento é fácil de fazer errado, e as duas maneiras de errar são opostas.
 *
 * A primeira é confundir calor com açúcar: diminutivo, exclamação, adjetivo
 * empilhado e promessa de resultado. Nada disso aproxima ninguém, e promessa de
 * resultado é a única que também é desonesta.
 *
 * A segunda, mais cara, é deixar a gentileza comer a clareza. Se a frase de
 * remarcação ficar tão delicada que a família não entende que aquela aula será
 * cobrada, o documento piorou, e a conta do mês seguinte é que vai contar a
 * verdade. Calor e clareza não competem; quem come os dois é a ambiguidade.
 *
 * Por isso esta seção mede as duas coisas juntas: que a criança apareça pelo
 * nome, e que o combinado continue dizendo exatamente o que o motor faz.
 */
secao('12c. A folha fala da criança pelo nome, e continua clara');

/* Rafael Torres é o aluno das folhas de plano e de hora-aula. O primeiro nome
 * entra em três lugares onde antes havia sujeito nenhum. */
conf('o título da observação nomeia a criança, e não o ato de examinar',
  rPlanos.texto.indexOf('O que eu vi em Rafael') > 0, true);
conf('e não sobrou o título antigo, que descrevia quem examina',
  rPlanos.texto.indexOf('O que eu observei') >= 0, false);
conf('a etiqueta do nível também tem sujeito',
  rPlanos.texto.indexOf('Como Rafael está hoje') > 0, true);
conf('o fecho chega com o plano da criança, pelo nome',
  rPlanos.texto.indexOf('com o plano de Rafael já montado') > 0, true);

/* SEM ARTIGO antes do nome. "A Helena" e "o Rafael" é como se fala em Niterói,
 * mas escolher o artigo pede saber o gênero da criança, e adivinhar pela
 * terminação erra em Alex, Ariel e Sasha: erraria na primeira folha que a
 * família lê sobre a própria filha. É a mesma decisão que tirou o "ele" das
 * vantagens, em vez de criar um campo de gênero na tela. */
conf('e nenhum artigo adivinhado antes do nome',
  /\b[ao] Rafael\b/.test(rPlanos.texto), false);

/* A linha de origem dizia o nome do procedimento. Agora diz de onde veio o que
 * está escrito abaixo dela, e no caminho principal credita quem contou. */
conf('a origem diz de onde veio, e não o nome do procedimento',
  rPlanos.texto.indexOf('Do que eu vi na aula de nivelamento') > 0, true);
conf('e sem mapeamento é a família quem contou',
  Core.dadosDaProposta(null, pMinima).origem,
  'Do que vocês me contaram na nossa primeira conversa');

/* O fecho terminava em posição de espera. Agora abre a conversa e pede a única
 * coisa que falta para começar, oferecendo trabalho adiantado em troca. */
conf('o fecho não fica mais à disposição esperando aprovação',
  /Fico à disposição|Se fizer sentido para vocês/.test(rPlanos.texto), false);
conf('ele diz que o preço e o horário são conversáveis',
  rPlanos.texto.indexOf('o valor e o horário inclusive') > 0, true);
conf('e pede o dia da semana, em vez de esperar um sim',
  rPlanos.texto.indexOf('Me digam o dia da semana') > 0, true);

/* AS TRAVAS DE CLAREZA. Aquecer o combinado não pode ter apagado o que ele
 * promete: a folha e o motor dizem a mesma coisa, palavra por palavra. */
conf('a remarcação de véspera continua dizendo que a aula é cobrada',
  /entra no fechamento do mês pelo valor da aula/.test(rPlanos.texto), true);
conf('e continua dizendo o prazo em horas',
  /com menos de 24 horas/.test(rPlanos.texto), true);
conf('a falta sem aviso continua contando como aula dada',
  /conta como aula dada e não tem reposição/.test(rPlanos.texto), true);
conf('e a franquia continua dizendo quantas são e que não são cobradas',
  /duas desmarcações em cima da hora por semestre que não são cobradas/.test(rPlanos.texto), true);
conf('o combinado ainda diz que a mesma régua vale para ela',
  /Vale a mesma régua para mim/.test(rPlanos.texto), true);

/* Calor não é exclamação, e a folha inteira não tem uma. */
conf('nenhuma exclamação na folha de planos', rPlanos.texto.indexOf('!') >= 0, false);
conf('nem na folha mínima', rMinima.texto.indexOf('!') >= 0, false);

/* O combinado explica cada regra em vez de enunciá-la, e o custo disso é
 * espaço. Na folha mínima ele já era mais da metade das palavras impressas: se
 * a explicação crescer sem limite, a folha volta a ser um regulamento com um
 * nome no alto, que é exatamente o defeito que o parágrafo dela veio consertar.
 * A trava é a proporção, não o número absoluto. */
const palavrasCombinado = Core.propostaNova().combinados.itens
  .map(i => i.rotulo + ' ' + i.texto).join(' ').split(/\s+/).filter(Boolean).length;
const palavrasFolhaMinima = rMinima.texto.split(/\s+/).filter(Boolean).length;
console.log('  combinado: ' + palavrasCombinado + ' palavras, ' +
  Math.round(palavrasCombinado / palavrasFolhaMinima * 100) + ' por cento da folha mínima');
conf('o combinado não passa de 60 por cento da folha mínima',
  palavrasCombinado / palavrasFolhaMinima < 0.6, true);

/* ================================================================
 * 12d. O QUE A MÃE ENTENDE DA FOLHA.
 *
 * A leitura que gerou esta seção foi feita com os olhos de uma mãe de aluno de
 * 13 anos, folha por folha, e o que ela achou não aparecia em trava nenhuma
 * das que já existiam: a folha estava correta em cada frase e mentia no
 * conjunto. Cada trava daqui guarda um defeito medido, e não uma opinião.
 */
secao('12d. O que a mãe entende da folha');

const pgPlanos = textoPorPagina(rPlanos.bytes);
const pgHora = textoPorPagina(rHora.bytes);
const pgMinima = textoPorPagina(rMinima.bytes);

/* DEFEITO 1, o grave: a única frase que diz que a desmarcação em cima da hora
 * É COBRADA não chegava na mãe.
 *
 * Medido nas três folhas: "em cima da hora", que é como a família fala,
 * aparecia UMA vez em toda a folha, colada em "que não são cobradas". O item
 * que cobra usava outro vocabulário, "com menos de 24 horas", e o rótulo dele
 * era "Depois dessas duas", que só funciona olhando para trás. Em 3 de 3
 * variantes esse item era a PRIMEIRA linha de corpo da página 2 e o
 * antecedente ficava na página 1: a mãe virava a folha e lia "Depois dessas
 * duas" sem ter "essas duas" na frente. Ela assina achando que desmarcar em
 * cima da hora não custa, e a briga acontece no fechamento do segundo mês. */
const itemVespera = Core.propostaNova().combinados.itens.filter(i => i.id === 'vespera')[0];
conf('o rótulo do item que cobra não depende da linha de cima',
  /dessas|acima|essas duas/i.test(itemVespera.rotulo), false);
conf('e ele nomeia o assunto com a palavra da família',
  itemVespera.rotulo.indexOf('em cima da hora') > 0, true);
conf('o texto que cobra também usa a palavra da família',
  itemVespera.texto.indexOf('em cima da hora') > 0, true);
conf('a expressão da família aparece dos dois lados, no que não cobra e no que cobra',
  (rPlanos.texto.match(/em cima da hora/g) || []).length >= 2, true);

/* E os dois itens são lidos juntos, na mesma folha, nas três variantes. */
[['planos', pgPlanos], ['hora', pgHora], ['mínima', pgMinima]].forEach(function (par) {
  const pgFolgas = paginaDoTrecho(par[1], 'folgas por semestre');
  const pgCobra = paginaDoTrecho(par[1], 'Desmarcação em cima da hora');
  conf(par[0] + ': a franquia e a cobrança ficam na mesma página',
    pgFolgas > 0 && pgFolgas === pgCobra, true);
});

/* DEFEITO 7: 86 por cento da seção "Como funcionam os encontros" era contrato,
 * sem aviso de mudança de assunto, e sem título próprio o contrato podia ser
 * partido em qualquer ponto pela quebra de página. Agora são duas seções. */
conf('a seção da aula existe', rPlanos.texto.indexOf('Como funcionam os encontros') > 0, true);
conf('e o contrato ganhou título próprio', rPlanos.texto.indexOf('Os nossos combinados') > 0, true);
conf('a aula fica com o preparo do material',
  rPlanos.texto.indexOf('Como a aula é montada') <
  rPlanos.texto.indexOf('Os nossos combinados'), true);
conf('e a desmarcação fica do lado dos combinados',
  rPlanos.texto.indexOf('Os nossos combinados') <
  rPlanos.texto.indexOf('Se precisarem desmarcar'), true);
/* Título de seção sozinho no pé de uma folha é pior do que não ter título. */
conf('o título novo nunca fica órfão no pé da página',
  paginaDoTrecho(pgPlanos, 'Os nossos combinados'),
  paginaDoTrecho(pgPlanos, 'Se precisarem desmarcar'));

/* A conta que fez o defeito aparecer: 318 palavras em 9 itens numa seção
 * chamada "Como funcionam os encontros", das quais 273 (86 por cento) eram
 * contrato. A trava mede a divisão em vez de cravar quais itens vão para onde:
 * o que importa é que a seção da aula continue falando da aula. */
const itensDaCasa = Core.propostaNova().combinados.itens;
const palavrasDe = l => l.map(i => i.rotulo + ' ' + i.texto).join(' ')
  .split(/\s+/).filter(Boolean).length;
const daAula = itensDaCasa.filter(i => i.id === 'preparo');
const doContrato = itensDaCasa.filter(i => i.id !== 'preparo');
console.log('  seção da aula: ' + palavrasDe(daAula) + ' palavras em ' + daAula.length +
  ' item; combinados: ' + palavrasDe(doContrato) + ' palavras em ' + doContrato.length + ' itens');
conf('o contrato ficou com a maior parte das palavras, e agora tem título dele',
  palavrasDe(doContrato) > palavrasDe(daAula) * 3, true);
conf('e a seção da aula não carrega nenhum combinado de cobrança',
  /cobrad|cobrança|fechamento do mês|reposição|falta/i.test(daAula.map(i => i.texto).join(' ')),
  false);

/* DEFEITO 2: a etiqueta do nível saía como veredito fechado com a mesma
 * certeza viesse ele de uma aula de nivelamento ou de um telefonema. Na origem
 * "conversa" a professora nunca deu aula para a criança, e a folha punha o
 * veredito 15 pt abaixo da linha que credita a família. Lia-se como laudo. */
conf('vindo da aula, a etiqueta diz que veio da aula',
  rPlanos.texto.indexOf('Como Rafael está hoje, pelo que eu vi na aula:') > 0, true);
const pConversa = fixarDatas(Core.preencherProposta(dbMapa, comMapa));
pConversa.origem = 'conversa';
const opConversa = Core.dadosDaProposta(comMapa, pConversa);
const tConversa = textoDoPdf(PDFGen.gerarProposta(opConversa));
conf('vindo da conversa, a etiqueta diz que quem contou foi a família',
  tConversa.indexOf('Como Rafael está hoje, pelo que vocês me contaram:') > 0, true);
conf('e a folha da conversa não afirma nada como se tivesse visto',
  tConversa.indexOf('pelo que eu vi na aula') >= 0, false);
/* Sem origem nenhuma a etiqueta continua a de sempre: a folha nunca imprime
 * uma vírgula pendurada. */
const semOrigem = Object.assign({}, opConversa, { origem: '', origemFonte: '' });
conf('sem origem, a etiqueta volta a ser a de antes',
  textoDoPdf(PDFGen.gerarProposta(semOrigem)).indexOf('Como Rafael está hoje:') > 0, true);

/* E O TÍTULO DA SEÇÃO SEGUE A MESMA ORIGEM DAS DUAS LINHAS ACIMA DELE.
 *
 * A etiqueta e a linha de origem foram consertadas e o título ficou para trás,
 * dizendo "O que eu vi em Rafael" em toda folha. Medido a 300 dpi na folha de
 * conversa: as três linhas caem em 50 pt, no mesmo golpe de vista, e a do meio
 * afirmava que ela viu uma criança que ainda não tinha visto. As três precisam
 * concordar entre si, e por isso a trava confere as três juntas. */
conf('vindo da aula, o título da seção diz que ela viu',
  rPlanos.texto.indexOf('O que eu vi em Rafael') > 0, true);
conf('vindo da conversa, o título não afirma que ela viu',
  tConversa.indexOf('O que eu vi em') >= 0, false);
conf('e diz o que é verdade: ela já sabe, sem dizer que viu',
  tConversa.indexOf('O que eu já sei sobre Rafael') > 0, true);
conf('a folha da conversa não devolve o diagnóstico para a família',
  tConversa.indexOf('O que vocês me contaram sobre') >= 0, false);

/* DEFEITO 3: "Fica ansioso perto da prova" saía no masculino sobre uma menina,
 * na página 1 da folha que a família lê sobre a própria filha. A varredura vale
 * para os três grupos que chegam impressos, e o identificador de cada item
 * continua o mesmo para não perder o que ela já marcou. */
/* A lista é escrita à mão, e não uma regra de terminação, porque terminação
 * pega o que não é sobre a criança: "Caderno organizado" fala do caderno,
 * "enunciado" e "resultado" são substantivos, e nenhum dos três muda com o
 * gênero de quem está sendo descrito. O que precisa ser proibido são os
 * adjetivos e particípios que descrevem a PESSOA, e esses cabem numa lista.
 *
 * A lista é só do MASCULINO, e isso também é medido: no feminino essas
 * palavras só aparecem concordando com um substantivo feminino do assunto,
 * como em "Tabuada insegura", onde a insegura é a tabuada. O defeito que existe
 * é o masculino cravado sobre uma criança que pode ser menina. */
const FLEXAO = /\b(ansiosos?|cansados?|sozinhos?|lembrados?|nervosos?|preocupados?|distraídos?|inseguros?|tímidos?|desatentos?|apressados?|calados?|quietos?)\b/i;
['fortes', 'atencao', 'lacunas', 'rotina', 'aprende'].forEach(function (chave) {
  const grupo = Core.MAPA.filter(g => g.chave === chave)[0];
  const comFlexao = grupo.itens.filter(i => FLEXAO.test(i.rotulo)).map(i => i.rotulo);
  conf('nenhum rótulo de ' + chave + ' flexiona gênero', comFlexao.join(' | '), '');
});
/* A ajuda do grupo também é lida por ela na tela, e dizia "Onde ele costuma
 * perder ponto" sobre uma criança que pode ser menina. */
conf('e nenhuma ajuda do mapa trata a criança por "ele"',
  Core.MAPA.filter(g => /\b(ele|dele)\b/i.test(g.ajuda || '')).map(g => g.chave).join(','), '');
conf('e o item da ansiedade manteve o identificador',
  Core.MAPA.filter(g => g.chave === 'atencao')[0].itens
    .filter(i => i.id === 'ansiedade-prova')[0].rotulo, 'Ansiedade perto da prova');
conf('e o do cansaço também',
  Core.MAPA.filter(g => g.chave === 'rotina')[0].itens
    .filter(i => i.id === 'cansado')[0].rotulo, 'Cansaço na hora da aula');
/* E a metade da folha que fala da criança, que é tudo o que vem antes dos
 * combinados, não tem uma palavra flexionada no masculino sobre ela. */
conf('a folha não trata a criança no masculino em lugar nenhum',
  FLEXAO.test(rPlanos.texto.slice(0, rPlanos.texto.indexOf('Como funcionam os encontros'))),
  false);

/* DEFEITO 4: a folha nomeava as lacunas da criança e a seção seguinte, a única
 * que responde o que a família está comprando, tinha 29 palavras e não citava
 * nenhuma delas. O dado existia e não era impresso. */
/* As áreas nascem desmarcadas e ela as marca na tela, junto com os pontos de
 * atenção, vendo o que a família vai ler. A folha com áreas marcadas é a que o
 * defeito descreve: lacunas nomeadas em cima, plano sem citar nenhuma delas
 * embaixo. */
const comAreas = fixarDatas(Core.preencherProposta(dbMapa, comMapa));
comAreas.areas = ['metodo', 'revisao'];
comAreas.anoEscolar = '08';
const tComAreas = textoDoPdf(PDFGen.gerarProposta(Core.dadosDaProposta(comMapa, comAreas)));
const iProponho = tComAreas.indexOf('O que eu proponho trabalhar');
const iEncontros = tComAreas.indexOf('Como funcionam os encontros');
conf('a seção do plano existe quando ela marcou as áreas', iProponho > 0, true);
const secaoPlano = tComAreas.slice(iProponho, iEncontros);
conf('o que ela propõe trabalhar cita as lacunas pelo nome',
  secaoPlano.indexOf('frações') > 0 && secaoPlano.indexOf('números negativos') > 0, true);
conf('e cita todas as que a folha listou em cima',
  secaoPlano.indexOf('números decimais') > 0 &&
  secaoPlano.indexOf('equação do primeiro grau') > 0, true);
conf('e diz que o conteúdo do ano não para',
  secaoPlano.indexOf('sem parar o conteúdo do 8º ano') > 0, true);
/* Sem ano escolar registrado a frase não inventa série nenhuma. */
const semAno = fixarDatas(Core.preencherProposta(dbMapa, comMapa));
semAno.areas = ['metodo'];
semAno.anoEscolar = '';
conf('sem ano registrado, a frase fala do ano sem dizer qual',
  textoDoPdf(PDFGen.gerarProposta(Core.dadosDaProposta(comMapa, semAno)))
    .indexOf('sem parar o conteúdo do ano.') > 0, true);
/* Sem lacuna nenhuma a linha não sai: ela é montada só com o que a folha já
 * imprimiu acima, e sem lacuna não haveria o que dizer. */
const semLacuna = fixarDatas(Core.preencherProposta(dbMapa, comMapa));
semLacuna.areas = ['metodo'];
semLacuna.lacunas = [];
const tSemLacuna = textoDoPdf(PDFGen.gerarProposta(Core.dadosDaProposta(comMapa, semLacuna)));
conf('sem lacuna marcada, a linha não é inventada',
  tSemLacuna.indexOf('Começo pelo que ficou para trás') >= 0, false);
conf('e a seção do plano continua saindo pelas áreas',
  tSemLacuna.indexOf('O que eu proponho trabalhar') > 0, true);

/* E A FRASE SAI TAMBÉM QUANDO NÃO HÁ ÁREA NENHUMA MARCADA, que é o caso comum.
 *
 * preencherProposta zera os pontos de atenção de propósito, e as áreas nascem
 * deles: a proposta montada a partir do mapeamento nasce SEMPRE com lacuna
 * preenchida e área vazia. Enquanto a frase morava só dentro da seção das
 * áreas, a folha que sai do caminho principal listava "Frações, Números
 * decimais, Números negativos, Equação do primeiro grau" e nunca dizia o que
 * seria feito com aquilo. Aqui ela fecha a seção do diagnóstico. */
const semArea = fixarDatas(Core.preencherProposta(dbMapa, comMapa));
conf('o caminho principal nasce mesmo sem área marcada', (semArea.areas || []).length, 0);
conf('e com lacuna marcada', (semArea.lacunas || []).length > 0, true);
const tSemArea = textoDoPdf(PDFGen.gerarProposta(Core.dadosDaProposta(comMapa, semArea)));
conf('sem área marcada, a folha continua dizendo o que será feito com a lacuna',
  tSemArea.indexOf('Começo pelo que ficou para trás e está atrapalhando agora') > 0, true);
conf('e a frase cita as lacunas que a folha acabou de listar',
  tSemArea.indexOf('frações') > 0, true);
conf('sem área marcada, a seção do plano não é aberta só para carregar a frase',
  tSemArea.indexOf('O que eu proponho trabalhar') >= 0, false);
/* Nunca duas vezes: com área marcada ela sai uma vez só, na seção do plano. */
conf('com área marcada, a frase sai uma vez só',
  tComAreas.split('Começo pelo que ficou para trás').length - 1, 1);
conf('sem área marcada, também uma vez só',
  tSemArea.split('Começo pelo que ficou para trás').length - 1, 1);

/* DEFEITO 5: a tabela pedia compromisso de 12 encontros e a folha nunca dizia
 * o que acontece se a família parar no segundo mês. Silêncio nesse ponto a
 * família lê como multa. A folha passou a dizer, e o que ela diz é o que o
 * motor faz: conferido aqui contra calcularFechamento, e não contra a memória
 * de quem escreveu a frase. */
conf('a folha diz o que acontece se a família parar no meio',
  rPlanos.texto.indexOf('Se pararem antes do fim do período') > 0, true);
conf('e o que ela promete é pagar só as aulas que aconteceram',
  rPlanos.texto.indexOf('vocês pagam só as aulas que aconteceram, pelo valor do plano que escolheram') > 0, true);

const vTri = Core.vigenciaDoPlano(pPlano, 'trimestral');
const paradas = [
  { id: 'p1', alunoId: 'ap', data: vTri.inicio, duracaoMin: 90, status: 'realizada' },
  { id: 'p2', alunoId: 'ap', data: Core.somaDiasIso(vTri.inicio, 7), duracaoMin: 90, status: 'realizada' }
];
const dbParou = {
  alunos: [{ id: 'ap', nome: 'Quem Parou', precos: [vTri] }],
  aulas: paradas, resumos: [], ajustes: {}
};
const fechParou = Core.calcularFechamento(dbParou, 'ap', vTri.inicio.slice(0, 7), '2027-12-31');
conf('o motor cobra só as duas aulas que aconteceram, pelo valor do plano',
  Core.fmtMoeda(fechParou.totalValor), Core.fmtMoeda(2 * 1.5 * vTri.valorHora));
conf('e não cobra os doze encontros que a tabela prometia',
  fechParou.linhas.length, 2);
conf('e não existe linha nenhuma de multa no fechamento de quem parou',
  /multa|rescis|penalidade/i.test(JSON.stringify(fechParou)), false);

/* DEFEITO 6: o único parágrafo da folha que fala em compromisso e em data de
 * reserva saía em #6b7280 a 9,5 pt colado num de #1a1c1f a 10 pt. Mais claro e
 * menor que o vizinho é o formato da letra miúda, e numa folha cujo argumento
 * é que nada está escondido esse é o parágrafo errado para desbotar. A trava
 * compara os dois, em vez de cravar a cor: assim ela continua valendo no dia
 * em que a folha inteira mudar de paleta. */
const estiloDeCima = estiloDoTrecho(rPlanos.bytes, 'O pagamento continua mensal');
const estiloCompromisso = estiloDoTrecho(rPlanos.bytes, 'O desconto não é do preço da aula');
conf('o parágrafo do compromisso foi encontrado na folha', !!estiloCompromisso, true);
conf('ele sai na mesma cor do parágrafo colado acima',
  estiloCompromisso.cor, estiloDeCima.cor);
conf('e no mesmo corpo', estiloCompromisso.tam, estiloDeCima.tam);
conf('e a cor não é a do texto apagado', estiloCompromisso.cor === '#6b7280', false);

/* DEFEITO 9: a seção do ponto de partida abria com duas linhas sem verbo
 * finito e sem ponto, e o parágrafo em prosa, que é a voz dela, vinha por
 * último. Era o trecho que mais parecia ficha de atendimento, justamente onde
 * a conversa deveria começar. E a data saía em 02/09 enquanto o cabeçalho,
 * duas linhas acima, trazia 4 de setembro de 2026. */
const iPonto = rPlanos.texto.indexOf('Ponto de partida');
const iProsa = rPlanos.texto.indexOf('O Rafael entende rápido');
const iOrigem = rPlanos.texto.indexOf('Do que eu vi na aula de nivelamento');
const iNivel = rPlanos.texto.indexOf('Como Rafael está hoje');
conf('a voz dela abre a seção, logo abaixo do título',
  iPonto < iProsa && iProsa < iOrigem && iOrigem < iNivel, true);
/* O cabeçalho traz "4 de setembro de 2026" e a linha de origem trazia "02/09",
 * duas datas em dois formatos coladas uma na outra. Sem o ano na segunda: ele
 * está impresso duas linhas acima e não precisa aparecer de novo. */
conf('a data da origem sai por extenso, como a do cabeçalho',
  rPlanos.texto.indexOf('aula de nivelamento, em 2 de setembro') > 0, true);
conf('e não sobrou data em barra na linha de origem',
  /nivelamento, em \d\d?\//.test(rPlanos.texto), false);
conf('o cabeçalho continua com a data por extenso e com o ano',
  rPlanos.texto.indexOf('4 de setembro de 2026') > 0, true);

secao('12b. Sem mapeamento, o parágrafo dela deixa de ser opcional');

const semNada = Core.preencherProposta({ ajustes: {} }, null);
conf('proposta sem nome nenhum pede o nome',
  Core.pendenciasDaProposta(semNada)[0], 'Informe o nome do aluno. A proposta é escrita sobre ele.');
semNada.aluno = 'Helena Prado';
conf('depois pede o responsável',
  Core.pendenciasDaProposta(semNada)[0].indexOf('Informe o responsável') === 0, true);
semNada.responsavel = 'Sandra Prado';
conf('e aí pede o parágrafo, porque a folha não diria nada da criança',
  Core.pendenciasDaProposta(semNada)[0].indexOf('Escreva duas ou três linhas') === 0, true);
/* E O ANO E O COLÉGIO NÃO SUBSTITUEM O PARÁGRAFO.
 *
 * A folha mínima é a que sai mais cedo na relação com a família, e ela não tem
 * uma palavra sobre a criança: medido, 589 palavras impressas, nenhuma delas
 * sobre quem a folha é. A tentação é preencher esse silêncio com o que existe,
 * que é nome, ano e colégio. Não dá: os três já estão impressos no bloco de
 * identificação, sessenta pontos acima, e repeti-los em prosa seria o mesmo
 * dado vestido de observação. Qualquer coisa além deles seria invenção sobre a
 * criança na primeira folha que a família lê sobre a própria filha, e inventar
 * é pior do que a folha ser curta.
 *
 * Quem resolve isso não é o gerador da folha, é a tela: a pendência continua
 * de pé mesmo com ano e colégio preenchidos, então essa folha não chega em
 * família nenhuma sem que ela escreva as duas ou três linhas. */
const soEscola = Core.preencherProposta({ ajustes: {} }, null);
soEscola.aluno = 'Helena Prado';
soEscola.responsavel = 'Sandra Prado';
soEscola.anoEscolar = '08';
soEscola.colegio = 'Colégio São Vicente';
soEscola.materias = ['matematica'];
conf('ano e colégio preenchidos não dispensam o parágrafo dela',
  Core.pendenciasDaProposta(soEscola)[0].indexOf('Escreva duas ou três linhas') === 0, true);
conf('e a folha crua não inventa nada sobre a criança',
  textoDoPdf(PDFGen.gerarProposta(Core.dadosDaProposta(null, fixarDatas(soEscola))))
    .indexOf('Ponto de partida') >= 0, false);

semNada.texto = 'A Helena está no oitavo ano e chegou por indicação da escola.';
conf('com o parágrafo escrito, nada mais falta', Core.pendenciasDaProposta(semNada).length, 0);

/* Quem tem mapeamento já tem o que contar: o nível, os pontos fortes e as
 * lacunas abrem seções próprias, e o parágrafo volta a ser opcional. */
const comMapeamento = fixarDatas(Core.preencherProposta(dbMapa, comMapa));
conf('a folha do mapeamento fala da criança sem o parágrafo',
  Core.falaDaCrianca(comMapeamento), true);
conf('e por isso o parágrafo continua opcional lá',
  Core.pendenciasDaProposta(comMapeamento).length, 0);
conf('proposta em branco não fala da criança', Core.falaDaCrianca(Core.propostaNova()), false);

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
