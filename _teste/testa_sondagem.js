/* testa_sondagem.js
 *
 * C5a: a sondagem por ano de entrada, a lógica pura, sem navegador. Dados
 * fictícios: os exercícios aqui são identificadores inventados no formato do
 * contrato ("série:módulo:lista:ex:n"), sem enunciado nenhum.
 *
 * O que se prova:
 *   1. as cinco lacunas novas (P08): ids novos, `busca` única, `alvos` que
 *      existem no índice e `obmep` no formato; as 22 antigas intactas;
 *   2. "O que costuma funcionar com este aluno" (P06): o título, a ajuda que
 *      diz preferência observada e não estilo, os quatro itens com evidência,
 *      e os dois de modalidade fora da OFERTA mas ainda lidos e desmarcáveis;
 *   3. a tabela das lacunas prováveis por ano: 5 a 7 por ano, só lacunas que
 *      existem e têm regra de escolha, e cada uma de série anterior ao ano;
 *   4. a escolha: só o degrau 1, dois por lacuna, um por lista primeiro,
 *      nenhum exercício repetido entre lacunas, o ano anterior mais perto
 *      primeiro, e a série que falta dita quando não sobra exercício;
 *   5. a marcação: a regra, a evidência escrita, e o mapeamento que só
 *      ganha (nunca perde) lacuna; a evidência de outra sondagem fica;
 *   6. a cópia de segurança (ida e volta em JSON) leva a sondagem e a
 *      evidência;
 *   7. VENENO: cópias do core.js com a regra da marcação trocada TÊM de
 *      reprovar; a principal é a que marca a lacuna com um acerto só.
 *
 * C5b, do 2º ao 5º ano, com as provas da OBMEP Mirim:
 *   1b. as cinco lacunas dos anos iniciais (ids novos, depois das 27) e a
 *      regra `mirim` (assuntos do índice, do 2º ao 5º ano, nunca o misto
 *      "Dobro, metade e triplo");
 *   3b. a tabela do 2º ao 5º ano: 5 a 7 lacunas, cada uma com assunto que
 *      não passa do ano;
 *   4b. a escolha nas provas (um conjunto sintético, com número da questão,
 *      terço e tema_app, embaralhado): pela ordem da prova, o ano anterior
 *      mais perto primeiro, um por prova antes de repetir, nunca Diversos,
 *      nunca o terço final, nunca prova nem assunto acima do ano, e o pacote
 *      que falta dito;
 *   7b. VENENO: a cópia que escolhe de Diversos, a que escolhe fora da ordem
 *      da prova, a que deixa o terço final entrar e a que aceita assunto de
 *      ano acima TÊM de reprovar.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Core = require('../core.js');
const indice = require('../banco/topicos/matematica.json');

let passes = 0, falhas = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + JSON.stringify(obtido) + ' | esperado: ' + JSON.stringify(esperado) + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

const TRAVESSAO = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']');
const grupo = chave => Core.MAPA.filter(g => g.chave === chave)[0];
const temas = indice.temas || indice;
const temaPorId = {};
temas.forEach(t => { temaPorId[t.id] = t; });
const ORDEM = ['02', '03', '04', '05', '06', '07', '08', '09', 'em1', 'em2', 'em3'];

// ================================================================
secao('1. As lacunas novas, e as antigas intactas');

const LAC = grupo('lacunas');
const ANTIGAS = ['naturais', 'tabuada', 'divisao', 'fracoes', 'decimais', 'porcentagem', 'inteiros', 'potencias',
  'medidas', 'algebrica', 'eq1', 'sistemas', 'fatoracao', 'eq2', 'proporcao', 'area', 'pitagoras', 'semelhanca',
  'trigonometria', 'funcoes', 'graficos', 'probabilidade'];
const NOVAS = ['divisibilidade', 'expressoes', 'angulos', 'notacao-cientifica', 'conjuntos'];
const INICIAIS = ['valor-posicional', 'reagrupamento', 'fracoes-simples', 'tempo', 'problemas'];
const ids = LAC.itens.map(i => i.id);
conf('as 22 antigas continuam, na mesma ordem, com os mesmos ids', ids.slice(0, 22), ANTIGAS);
conf('as cinco novas entram depois delas', ids.slice(22, 27), NOVAS);
conf('e as cinco dos anos iniciais (C5b) depois das 27', ids.slice(27), INICIAIS);
conf('nenhum id repetido', new Set(ids).size, ids.length);
conf('o rótulo antigo de frações não mudou (o que ela marcou é lido igual)', Core.rotulosDoMapa('lacunas', ['fracoes']), ['Frações']);
conf('as novas no rótulo', Core.rotulosDoMapa('lacunas', NOVAS), ['Divisibilidade, MMC e MDC',
  'Expressões numéricas e ordem das operações', 'Ângulos e figuras planas', 'Notação científica', 'Conjuntos e intervalos']);
conf('toda lacuna tem busca, e nenhuma busca se repete', [LAC.itens.every(i => i.busca && i.busca.length > 2),
  new Set(LAC.itens.map(i => i.busca)).size === LAC.itens.length], [true, true]);
const alvoQueNaoExiste = [];
LAC.itens.forEach(i => (i.alvos || []).forEach(a => { if (!temaPorId[a]) alvoQueNaoExiste.push(i.id + ':' + a); }));
conf('todo alvo existe no índice de temas', alvoQueNaoExiste, []);
conf('toda lacuna nova tem alvo, e a trilha acha o proposto', NOVAS.map(id => !!Core.alvosDaLacuna(temas, id, '09').sugerido),
  [true, true, true, true, true]);
const foraDoFormato = [];
LAC.itens.forEach(i => (i.obmep || []).forEach(p => {
  if (!/^(6ano|7ano|8ano|9ano|1em|2em|3em):[a-z0-9-]+(:[a-z0-9-]+)?$/.test(p)) foraDoFormato.push(i.id + ':' + p);
}));
conf('todo prefixo da OBMEP tem o formato série:módulo ou série:módulo:lista', foraDoFormato, []);
conf('sem regra do Portal ficam só as dos anos iniciais (tabuada, divisão e as cinco do C5b)',
  LAC.itens.filter(i => !(i.obmep && i.obmep.length)).map(i => i.id), ['tabuada', 'divisao'].concat(INICIAIS));
conf('e toda lacuna tem alguma regra de escolha, do Portal ou da Mirim',
  LAC.itens.filter(i => !(i.obmep && i.obmep.length) && !(i.mirim && i.mirim.length)).map(i => i.id), []);
conf('nenhum travessão nas lacunas', TRAVESSAO.test(JSON.stringify(LAC)), false);
conf('as novas aparecem para matemática, e não para história',
  [NOVAS.every(id => Core.itensDaMateria('lacunas', 'matematica').some(i => i.id === id)),
    Core.itensDaMateria('lacunas', 'historia').length], [true, 0]);

// ================================================================
secao('1b. As lacunas dos anos iniciais e a regra da Mirim (C5b)');

conf('os rótulos das cinco dos anos iniciais', Core.rotulosDoMapa('lacunas', INICIAIS), ['Sistema de numeração e valor posicional',
  'Adição e subtração com reagrupamento', 'Frações simples: metade, terço e quarto', 'Horas, relógio e calendário',
  'Leitura e interpretação de problemas']);
conf('os rótulos de tabuada e divisão não mudaram', Core.rotulosDoMapa('lacunas', ['tabuada', 'divisao']), ['Tabuada e multiplicação', 'Divisão']);
const mirimForaDoFormato = [];
LAC.itens.forEach(i => (i.mirim || []).forEach(t => {
  const tema = temaPorId[t];
  if (!/^MAT0[2-5]-\d\d$/.test(t) || !tema || ['02', '03', '04', '05'].indexOf(tema.serie) < 0) mirimForaDoFormato.push(i.id + ':' + t);
}));
conf('todo assunto da regra da Mirim existe no índice e é do 2º ao 5º ano', mirimForaDoFormato, []);
conf('a regra da Mirim vai do ano mais baixo para o mais alto, em toda lacuna',
  LAC.itens.filter(i => (i.mirim || []).some((t, k, l) => k > 0 && t < l[k - 1])).map(i => i.id), []);
conf('"Dobro, metade e triplo" (misto) não entra em lacuna nenhuma',
  LAC.itens.filter(i => (i.mirim || []).indexOf('MAT02-04') >= 0).map(i => i.id), []);
conf('nenhum assunto da Mirim em duas lacunas (a evidência diria a lacuna errada)', (() => {
  const visto = {}, dois = [];
  LAC.itens.forEach(i => (i.mirim || []).forEach(t => { if (visto[t]) dois.push(t); visto[t] = true; }));
  return dois;
})(), []);
conf('toda lacuna dos anos iniciais tem alvo, e a trilha do 3º ano acha o proposto',
  INICIAIS.map(id => !!Core.alvosDaLacuna(temas, id, '03').sugerido), [true, true, true, true, true]);
conf('e o proposto no 3º ano não passa do 3º ano', INICIAIS.map(id => temaPorId[Core.alvosDaLacuna(temas, id, '03').sugerido].serie <= '03'),
  [true, true, true, true, true]);

// ================================================================
secao('2. O que costuma funcionar com este aluno');

const APR = grupo('aprende');
conf('o título mudou', APR.titulo, 'O que costuma funcionar com este aluno');
conf('a ajuda diz preferência observada, e não estilo de aprendizagem',
  /preferência que você observou/.test(APR.ajuda) && /não diagnóstico nem estilo de aprendizagem/.test(APR.ajuda), true);
conf('a ajuda não trata a criança por "ele"', /\b(ele|dele)\b/i.test(APR.ajuda), false);
conf('os oito ids antigos continuam', APR.itens.slice(0, 8).map(i => i.id),
  ['visual', 'fazendo', 'ouvindo', 'explicando', 'exemplo-regra', 'regra-exemplo', 'aplicado', 'devagar']);
conf('entram as quatro práticas com evidência', APR.itens.slice(8).map(i => i.id),
  ['exemplo-resolvido', 'lembrar-antes', 'dias-separados', 'voz-alta']);
const oferta = Core.itensOferecidos(Core.itensDoAluno('aprende'), []).map(i => i.id);
conf('"Vendo" e "Ouvindo" saem da oferta', [oferta.indexOf('visual'), oferta.indexOf('ouvindo')], [-1, -1]);
conf('e a oferta tem os outros dez', oferta.length, 10);
const comMarca = Core.itensOferecidos(Core.itensDoAluno('aprende'), ['visual']).map(i => i.id);
conf('marcado antes, "Vendo" continua na tela para desmarcar', comMarca.indexOf('visual') >= 0, true);
conf('e só ele volta, não o outro', comMarca.indexOf('ouvindo'), -1);
conf('o rótulo de "Vendo" continua lido no lembrete', Core.rotulosDoMapa('aprende', ['visual']), ['Vendo o desenho ou o gráfico']);
const mVelho = Core.mapeamentoNovo();
mVelho.marcados.aprende = ['visual', 'exemplo-resolvido'];
const lembrete = Core.textoDoLembrete({ id: 'aluno_alfa', nome: 'Aluno Alfa Teste', mapeamentos: [mVelho] });
conf('o lembrete diz "Costuma funcionar", e lê o item antigo e o novo',
  /Costuma funcionar: Vendo o desenho ou o gráfico e Ver um exemplo resolvido antes de praticar\./.test(lembrete), true);
conf('e não diz mais "Aprende melhor"', /Aprende melhor/.test(lembrete), false);
const FLEXAO = /\b(ansiosos?|cansados?|sozinhos?|lembrados?|nervosos?|preocupados?|distraídos?|inseguros?|tímidos?|desatentos?|apressados?|calados?|quietos?)\b/i;
conf('nenhum rótulo novo flexiona gênero', APR.itens.concat(LAC.itens).filter(i => FLEXAO.test(i.rotulo)).map(i => i.rotulo), []);
conf('nenhum travessão no grupo', TRAVESSAO.test(JSON.stringify(APR)), false);

// ================================================================
secao('3. As lacunas prováveis de cada ano');

const ANOS = ['06', '07', '08', '09', 'em1', 'em2', 'em3'];
const ANOS_MIRIM = ['02', '03', '04', '05'];
conf('a tabela cobre do 2º ano ao 3º do médio', Object.keys(Core.LACUNAS_PROVAVEIS).sort(), ANOS_MIRIM.concat(ANOS).sort());
ANOS.forEach(ano => {
  const l = Core.lacunasProvaveis(ano);
  const fora = l.filter(id => { const it = Core.itemDaLacuna(id); return !it || !it.obmep || !it.obmep.length; });
  /* A lacuna é de ano ANTERIOR: pelo menos um tema-alvo dela é de série
   * abaixo do ano de entrada. */
  const deAgora = l.filter(id => !(Core.itemDaLacuna(id).alvos || []).some(a => ORDEM.indexOf(temaPorId[a].serie) < ORDEM.indexOf(ano)));
  conf(ano + ': de 5 a 7 lacunas (10 a 14 exercícios), sem repetir',
    [l.length >= 5 && l.length <= 7, new Set(l).size === l.length], [true, true]);
  conf(ano + ': todas existem e têm regra de escolha', fora, []);
  conf(ano + ': todas têm tema de série anterior ao ano', deAgora, []);
});
conf('cursinho lê como 3º do médio', Core.lacunasProvaveis('cursinho'), Core.lacunasProvaveis('em3'));
conf('fora da escola, outro e sem ano: nada',
  ['fora', 'outro', ''].map(a => Core.lacunasProvaveis(a).length), [0, 0, 0]);

secao('3b. As lacunas prováveis do 2º ao 5º ano (C5b)');
const TABELA_MIRIM = {
  '02': ['valor-posicional', 'reagrupamento', 'medidas', 'tempo', 'problemas'],
  '03': ['valor-posicional', 'reagrupamento', 'tabuada', 'fracoes-simples', 'medidas', 'tempo', 'problemas'],
  '04': ['valor-posicional', 'reagrupamento', 'tabuada', 'divisao', 'fracoes-simples', 'medidas', 'tempo'],
  '05': ['valor-posicional', 'reagrupamento', 'tabuada', 'divisao', 'fracoes', 'decimais', 'medidas']
};
ANOS_MIRIM.forEach(ano => {
  const l = Core.lacunasProvaveis(ano);
  conf(ano + ': a tabela', l, TABELA_MIRIM[ano]);
  conf(ano + ': de 5 a 7 lacunas, sem repetir', [l.length >= 5 && l.length <= 7, new Set(l).size === l.length], [true, true]);
  /* O conteúdo dos anos anteriores E do próprio ano: todo assunto que a
   * sondagem tenta é do ano de entrada ou de antes, e toda lacuna tem pelo
   * menos um. */
  conf(ano + ': toda lacuna tem assunto da Mirim que não passa do ano',
    l.filter(id => !Core.temasDaSondagemMirim(id, ano).length), []);
  conf(ano + ': e nenhum assunto tentado passa do ano',
    [].concat.apply([], l.map(id => Core.temasDaSondagemMirim(id, ano))).filter(t => temaPorId[t].serie > ano), []);
});
conf('do 3º ao 5º, a maioria das lacunas tem assunto do ano anterior (é lacuna, e não matéria nova)',
  ['03', '04', '05'].map(ano => Core.lacunasProvaveis(ano).filter(id =>
    Core.temasDaSondagemMirim(id, ano).some(t => temaPorId[t].serie < ano)).length >= 4), [true, true, true]);
conf('a lista devolvida é cópia: mexer nela não muda a tabela',
  (() => { const l = Core.lacunasProvaveis('09'); l.push('x'); return Core.lacunasProvaveis('09').indexOf('x'); })(), -1);

// ================================================================
secao('4. A escolha dos exercícios');

/* Uma biblioteca de mentira: para cada prefixo de cada lacuna, uma lista com
 * duas listas-da-fonte (aulas), três exercícios de degrau 1 e um de degrau 2.
 * Se o prefixo já é uma lista, os exercícios ficam todos nela. */
function bibliotecaFicticia(series) {
  const listas = [];
  const vistos = {};
  LAC.itens.forEach(it => (it.obmep || []).forEach(p => {
    if (vistos[p]) return;
    vistos[p] = true;
    const partes = p.split(':');
    if (series && series.indexOf(partes[0]) < 0) return;
    const modulo = partes[0] + ':' + partes[1];
    const aulas = partes[2] ? [partes[2], partes[2]] : ['lista-a', 'lista-b'];
    const ex = (aula, n) => modulo + ':' + aula + ':ex:' + n;
    listas.push({ modulo, nivel: 1, degraus: [
      { item: ex(aulas[0], 1), degrau: 1 }, { item: ex(aulas[1], partes[2] ? 2 : 1), degrau: 1 },
      { item: ex(aulas[0], 3), degrau: 1 }, { item: ex(aulas[0], 9), degrau: 2 }] });
  }));
  return listas;
}
const TODAS = ['6ano', '7ano', '8ano', '9ano', '1em', '2em', '3em'];
const bibCheia = bibliotecaFicticia(null);

ANOS.concat(['cursinho']).forEach(ano => {
  const s = Core.montarSondagem(ano, bibCheia, TODAS);
  const todos = [].concat.apply([], s.blocos.map(b => b.itens));
  conf(ano + ': dois exercícios por lacuna, de 10 a 14 no total, nenhum repetido',
    [s.blocos.every(b => b.itens.length === 2), todos.length >= 10 && todos.length <= 14, new Set(todos).size === todos.length],
    [true, true, true]);
});
const s09 = Core.montarSondagem('09', bibCheia, TODAS);
const todos09 = [].concat.apply([], s09.blocos.map(b => b.itens));
conf('nenhum exercício de degrau 2 entra', todos09.filter(id => /:ex:9$/.test(id)), []);
const blocoFrac08 = Core.montarSondagem('08', bibCheia, TODAS).blocos.find(b => b.lacuna === 'fracoes');
conf('para quem entra no 8º, frações começa pelo 7º ano (o ano logo antes)', blocoFrac08.itens[0].split(':')[0], '7ano');
conf('e o segundo vem de outra lista (um por lista primeiro)',
  blocoFrac08.itens.map(i => i.split(':').slice(0, 3).join(':')).length === new Set(blocoFrac08.itens.map(i => i.split(':').slice(0, 3).join(':'))).size, true);
conf('a ordem dos prefixos: anterior mais perto primeiro, depois os de cima',
  Core.prefixosDaSondagem('porcentagem', '08').map(p => p.split(':')[0]), ['7ano', '6ano', '8ano', '1em']);
conf('no 6º ano, sem série antes, cai no mais baixo que existe',
  Core.prefixosDaSondagem('porcentagem', '06').map(p => p.split(':')[0]), ['6ano', '7ano', '8ano', '1em']);

// a escolha crua, numa lista dada
const L = (aula, n) => '9ano:mod:' + aula + ':ex:' + n;
const cand = [L('a', 1), L('a', 2), L('b', 1), L('c', 1)];
conf('dois de listas diferentes quando há', Core.escolherItensDaSondagem(cand, []), [L('a', 1), L('b', 1)]);
conf('repete lista só quando não há outra', Core.escolherItensDaSondagem([L('a', 1), L('a', 2)], []), [L('a', 1), L('a', 2)]);
conf('pula os usados', Core.escolherItensDaSondagem(cand, [L('a', 1), L('b', 1)]), [L('a', 2), L('c', 1)]);
conf('pede um, vem um', Core.escolherItensDaSondagem(cand, [], 1), [L('a', 1)]);
conf('sem candidato, vem nada', Core.escolherItensDaSondagem([], []), []);
conf('três pedidos, um por lista antes de repetir', Core.escolherItensDaSondagem(cand, [], 3), [L('a', 1), L('b', 1), L('c', 1)]);

// o limite da lista no prefixo: "fracoes" não pega "fracoes-algebricas"
const pegaVizinha = Core.candidatosDaSondagem('fracoes', '07', [
  { modulo: '6ano:resolucao-de-exercicios', nivel: 1, degraus: [
    { item: '6ano:resolucao-de-exercicios:fracoes-mais:ex:1', degrau: 1 },
    { item: '6ano:resolucao-de-exercicios:fracoes:ex:4', degrau: 1 }] }], ['6ano']);
conf('o prefixo fecha em ":" (não pega a lista de nome parecido)', pegaVizinha.candidatos, ['6ano:resolucao-de-exercicios:fracoes:ex:4']);
// o nível da lista: o mais baixo primeiro, mesmo vindo depois no arquivo
const porNivel = Core.candidatosDaSondagem('eq2', '09', [
  { modulo: '9ano:equacoes-do-segundo-grau', nivel: 3, degraus: [{ item: '9ano:equacoes-do-segundo-grau:x:ex:7', degrau: 1 }] },
  { modulo: '9ano:equacoes-do-segundo-grau', nivel: 1, degraus: [{ item: '9ano:equacoes-do-segundo-grau:x:ex:1', degrau: 1 }] }], ['9ano']);
conf('a lista de nível mais baixo vem primeiro', porNivel.candidatos[0], '9ano:equacoes-do-segundo-grau:x:ex:1');

// sem o pacote da série
const so9 = Core.montarSondagem('em1', bibliotecaFicticia(['9ano']), ['9ano']);
const fat = so9.blocos.find(b => b.lacuna === 'fatoracao');
conf('sem o pacote do 8º ano, fatoração fica sem exercício', fat.itens, []);
conf('e diz qual pacote falta', fat.faltam, ['8ano']);
conf('as lacunas do 9º ano vêm completas', so9.blocos.filter(b => b.lacuna !== 'fatoracao').every(b => b.itens.length === 2), true);
conf('sem pacote nenhum, toda lacuna diz o que falta',
  Core.montarSondagem('09', [], []).blocos.every(b => !b.itens.length && b.faltam.length > 0), true);

// ================================================================
secao('4b. A escolha nas provas da OBMEP Mirim (C5b)');

/* Um conjunto SINTÉTICO de questões no formato do contrato (seção 8i): ids
 * inventados ("mirim:2091:f1:m1:2"), número da questão, terço (dificuldade),
 * tema_app e módulo, sem enunciado nenhum. Quatro provas: duas da Mirim 1,
 * uma da Mirim 2 e uma do Nível A (que é Mirim 2). Diversos aparece como a
 * PRIMEIRA questão de quase toda prova, para a cópia que o deixa entrar ser
 * vista na hora; e há uma questão com tema_app num módulo Diversos.
 * O terço vem do número: 1 a 5 é o primeiro, 6 a 10 o segundo, 11 em diante
 * o último. */
const DIV = { slug: 'mirim-diversos', titulo: 'Diversos' };
const Q = (prova, n, tema, modulo) => ({
  id: prova + ':' + n, serie: /:m1$/.test(prova) ? 'm1' : 'm2', numero: n, dificuldade: n <= 5 ? 1 : n <= 10 ? 2 : 3,
  tema_app: tema, modulo: modulo || (tema ? { slug: 'mirim-assunto-' + tema.toLowerCase(), titulo: 'Assunto ' + tema } : DIV)
});
const P1 = 'mirim:2091:f1:m1', P2 = 'mirim:2092:f2:m1', PA = 'mirim:2090:a', P3 = 'mirim:2091:f1:m2';
const PROVAS_SINTETICAS = [
  Q(P1, 1, null), Q(P1, 2, 'MAT02-02'), Q(P1, 3, 'MAT02-01'), Q(P1, 4, 'MAT02-09'),
  Q(P1, 5, 'MAT02-02', DIV),   // tema_app num módulo Diversos: não entra
  Q(P1, 6, 'MAT03-04'), Q(P1, 7, 'MAT02-02'), Q(P1, 8, 'MAT02-03'), Q(P1, 12, 'MAT02-01'), Q(P1, 13, 'MAT03-04'),
  Q(P2, 1, null), Q(P2, 2, 'MAT02-09'), Q(P2, 3, 'MAT02-02'), Q(P2, 5, 'MAT03-01'), Q(P2, 9, 'MAT03-04'),
  Q(P2, 10, 'MAT02-01'), Q(P2, 14, 'MAT02-02'),
  Q(PA, 1, 'MAT02-02'), Q(PA, 2, 'MAT04-01'), Q(PA, 3, 'MAT04-03'), Q(PA, 4, null), Q(PA, 6, 'MAT04-04'),
  Q(P3, 1, null), Q(P3, 2, 'MAT04-03'), Q(P3, 3, 'MAT04-02'), Q(P3, 7, 'MAT04-04'), Q(P3, 11, 'MAT04-04')
];
/* Embaralhado de um jeito fixo: a ordem do arquivo não pode ser a da prova,
 * senão a cópia que esquece de ordenar passaria. */
const embaralhar = l => l.map((x, i) => ({ x, k: (i * 7919) % 31 })).sort((a, b) => a.k - b.k).map(o => o.x);
const MISTURADAS = embaralhar(PROVAS_SINTETICAS);
const DIVERSOS_SINTETICOS = PROVAS_SINTETICAS.filter(q => !q.tema_app || q.modulo === DIV).map(q => q.id);

/* As provas da escolha. Recebe o Core por parâmetro para rodar igual contra
 * o core.js de verdade e contra cada veneno (7b). */
function provasDaMirim(C, conferir) {
  const ambas = ['m1', 'm2'];
  const blocos = (ano, provas, series) => {
    const r = {};
    C.montarSondagem(ano, [], series || ambas, provas || MISTURADAS).blocos.forEach(b => { r[b.lacuna] = b; });
    return r;
  };
  const s3 = blocos('03');
  conferir('3º: a lacuna de ano anterior vem primeiro (valor posicional: o 2º ano, depois o 3º)',
    s3['valor-posicional'].candidatos, [P1 + ':3', P2 + ':10', P2 + ':5']);
  conferir('3º: escolhe pela ordem da prova, uma de cada prova', s3['valor-posicional'].itens, [P1 + ':3', P2 + ':10']);
  conferir('3º: reagrupamento pela ordem da prova, sem Diversos, sem o terço final e sem a prova da Mirim 2',
    s3.reagrupamento.candidatos, [P1 + ':2', P2 + ':3', P1 + ':7', P1 + ':8']);
  conferir('3º: as duas primeiras de provas diferentes', s3.reagrupamento.itens, [P1 + ':2', P2 + ':3']);
  conferir('3º: tabuada só do 3º ano (assunto do 4º não entra)', s3.tabuada.itens, [P1 + ':6', P2 + ':9']);
  conferir('3º: os assuntos tentados para tabuada', C.temasDaSondagemMirim('tabuada', '03'), ['MAT03-04']);
  conferir('3º: tempo pela ordem da prova, mesmo vindo de outra prova', s3.tempo.itens, [P2 + ':2', P1 + ':4']);
  conferir('3º: lacuna sem questão fica vazia, sem pacote faltando (a tela diz que as provas não têm)',
    [s3['fracoes-simples'].itens, s3['fracoes-simples'].faltam, s3.problemas.itens], [[], [], []]);
  const todos3 = [].concat.apply([], Object.keys(s3).map(k => s3[k].itens));
  conferir('3º: oito questões, nenhuma repetida', [todos3.length, new Set(todos3).size], [8, 8]);

  const s5 = blocos('05');
  conferir('5º: valor posicional do 4º, depois do 3º, depois do 2º',
    s5['valor-posicional'].candidatos, [PA + ':2', P2 + ':5', P1 + ':3', P2 + ':10']);
  conferir('5º: a prova da Mirim 2 vale, e a questão 1 dela vem antes da 2 da Mirim 1',
    s5.reagrupamento.candidatos, [P3 + ':3', PA + ':1', P1 + ':2', P2 + ':3', P1 + ':7', P1 + ':8']);
  conferir('5º: tabuada do 4º ano primeiro, pela ordem da prova', s5.tabuada.itens, [P3 + ':2', PA + ':3']);
  conferir('5º: divisão sem a questão do terço final', s5.divisao.candidatos, [PA + ':6', P3 + ':7']);

  // nunca Diversos, em ano nenhum, nem entre os candidatos de trocar e pôr
  const tudo = [];
  ANOS_MIRIM.forEach(ano => {
    const b = blocos(ano);
    Object.keys(b).forEach(k => { tudo.push.apply(tudo, b[k].itens.concat(b[k].candidatos)); });
  });
  conferir('do 2º ao 5º, nenhuma questão de Diversos entre os escolhidos e os candidatos',
    tudo.filter(id => DIVERSOS_SINTETICOS.indexOf(id) >= 0), []);
  conferir('e nenhuma do terço final', tudo.filter(id => /:1[1-9]$/.test(id)), []);

  // o pacote que falta
  const soM1 = MISTURADAS.filter(q => q.serie === 'm1');
  const s4 = blocos('04', soM1, ['m1']);
  conferir('4º só com a Mirim 1: divisão fica sem questão e diz que falta a Mirim 2', [s4.divisao.itens, s4.divisao.faltam], [[], ['m2']]);
  conferir('e valor posicional sai da Mirim 1', s4['valor-posicional'].itens, [P2 + ':5', P1 + ':3']);
  const nada = blocos('03', [], []);
  conferir('sem pacote nenhum, toda lacuna do 3º diz que falta a Mirim 1',
    Object.keys(nada).map(k => [nada[k].itens.length, nada[k].faltam.join()]).filter(x => x[0] !== 0 || x[1] !== 'm1'), []);

  // a mesma biblioteca em outra ordem dá a mesma sondagem
  const outra = blocos('05', PROVAS_SINTETICAS.slice().reverse());
  conferir('a ordem do arquivo não muda a sondagem', Object.keys(outra).map(k => outra[k].itens),
    Object.keys(s5).map(k => s5[k].itens));
}
provasDaMirim(Core, conf);

conf('um por prova: no Nível A, a prova é o id sem o número',
  Core.escolherItensDaSondagem(['mirim:2090:a:2', 'mirim:2090:a:5', 'mirim:2091:f1:m2:3'], []), ['mirim:2090:a:2', 'mirim:2091:f1:m2:3']);
conf('a Mirim 1 e a Mirim 2 da mesma fase são provas diferentes',
  Core.escolherItensDaSondagem(['mirim:2091:f1:m1:2', 'mirim:2091:f1:m1:4', 'mirim:2091:f1:m2:3'], []), ['mirim:2091:f1:m1:2', 'mirim:2091:f1:m2:3']);
conf('o Portal continua um por lista', Core.escolherItensDaSondagem(cand, []), [L('a', 1), L('b', 1)]);
conf('"Pôr outra lacuna": no 3º ano, a regra é a da Mirim', ['tabuada', 'tempo', 'pitagoras', 'naturais'].map(id => Core.lacunaTemRegraNoAno(id, '03')),
  [true, true, false, false]);
conf('e no 9º, a do Portal', ['tabuada', 'tempo', 'pitagoras', 'naturais'].map(id => Core.lacunaTemRegraNoAno(id, '09')),
  [false, false, true, true]);
conf('no 3º ano, lacuna só com assunto do 4º não tem regra', Core.lacunaTemRegraNoAno('decimais', '03'), false);
conf('o 6º ano continua no Portal, sem tocar nas provas da Mirim',
  Core.montarSondagem('06', bibCheia, TODAS, MISTURADAS).blocos.every(b => b.itens.every(id => !/^mirim:/.test(id))), true);
conf('Diversos: sem tema, ou no módulo Diversos', [Core.eDiversos(Q(P1, 1, null)), Core.eDiversos(Q(P1, 5, 'MAT02-02', DIV)),
  Core.eDiversos(Q(P1, 2, 'MAT02-02'))], [true, true, false]);

// ================================================================
/* A seção da REGRA. Recebe o Core por parâmetro para rodar igual contra o
 * core.js de verdade e contra cada veneno. */
function provasDaRegra(C, conferir) {
  const S = respostas => ({ id: 'sond_alfa', data: '2026-10-30', itens: respostas.map((r, i) => ({ item: 'x:' + i, lacuna: 'fracoes', resposta: r })) });
  const um = respostas => C.lacunasDaCorrecao(S(respostas))[0];
  conferir('errou os dois: marca', um(['errado', 'errado']).marca, true);
  conferir('com a evidência escrita', um(['errado', 'errado']).evidencia, 'errou 2 de 2 itens de frações na sondagem de 30/10');
  conferir('errou um e o outro saiu meio certo: marca', um(['errado', 'meio']).marca, true);
  conferir('e a evidência conta o meio certo', um(['meio', 'errado']).evidencia,
    'errou 1 de 2 itens de frações na sondagem de 30/10, e 1 saiu meio certo');
  conferir('acertou um e errou o outro: NÃO marca (um acerto basta)', um(['certo', 'errado']).marca, false);
  conferir('na outra ordem também não', um(['errado', 'certo']).marca, false);
  conferir('acertou os dois: não marca', um(['certo', 'certo']).marca, false);
  conferir('dois meio certos: não marca', um(['meio', 'meio']).marca, false);
  conferir('um acerto em três itens também não marca', um(['errado', 'certo', 'errado']).marca, false);
  conferir('um errado e um sem correção: não decide, não marca', [um(['errado', '']).decidida, um(['errado', '']).marca], [false, false]);
  conferir('um item só, errado: marca, no singular', [um(['errado']).marca, um(['errado']).evidencia],
    [true, 'errou 1 de 1 item de frações na sondagem de 30/10']);
  conferir('um item só, meio certo: não marca', um(['meio']).marca, false);
  conferir('lacuna que não marca não tem evidência', um(['certo', 'errado']).evidencia, '');

  // o mapeamento só ganha
  const m = C.mapeamentoNovo();
  m.marcados.lacunas = ['pitagoras', 'inteiros'];
  const sond = { id: 'sond_alfa', data: '2026-10-30', itens: [
    { item: 'a1', lacuna: 'fracoes', resposta: 'errado' }, { item: 'a2', lacuna: 'fracoes', resposta: 'errado' },
    { item: 'b1', lacuna: 'pitagoras', resposta: 'errado' }, { item: 'b2', lacuna: 'pitagoras', resposta: 'meio' },
    { item: 'c1', lacuna: 'inteiros', resposta: 'certo' }, { item: 'c2', lacuna: 'inteiros', resposta: 'certo' },
    { item: 'd1', lacuna: 'eq1', resposta: 'certo' }, { item: 'd2', lacuna: 'eq1', resposta: 'errado' }] };
  const r = C.aplicarSondagemNoMapeamento(m, sond);
  conferir('a lacuna nova entra', r.novas, ['fracoes']);
  conferir('a que já estava fica, e ganha a evidência', r.jaMarcadas, ['pitagoras']);
  conferir('nenhuma marcada antes é apagada, nem a que a sondagem acertou',
    C.marcadosDaMateria(m, 'matematica').lacunas.slice().sort(), ['fracoes', 'inteiros', 'pitagoras']);
  conferir('a de um acerto só não entra', C.marcadosDaMateria(m, 'matematica').lacunas.indexOf('eq1'), -1);
  conferir('a evidência fica na lacuna', C.evidenciasDaLacuna(m, 'fracoes'), ['errou 2 de 2 itens de frações na sondagem de 30/10']);
  C.aplicarSondagemNoMapeamento(m, sond);
  conferir('corrigir de novo a mesma sondagem não empilha a frase', C.evidenciasDaLacuna(m, 'fracoes').length, 1);
  C.aplicarSondagemNoMapeamento(m, { id: 'sond_beta', data: '2027-03-02', itens: [
    { item: 'z1', lacuna: 'fracoes', resposta: 'errado' }, { item: 'z2', lacuna: 'fracoes', resposta: 'meio' }] });
  conferir('a evidência de outra sondagem fica, e a nova vem por último', C.evidenciasDaLacuna(m, 'fracoes'),
    ['errou 2 de 2 itens de frações na sondagem de 30/10', 'errou 1 de 2 itens de frações na sondagem de 02/03, e 1 saiu meio certo']);
}

/* CORRIGIR DE NOVO não deixa frase falsa (revisão do C5a): a evidência da
 * sondagem sai de todas as lacunas antes de a correção nova escrever. A marca
 * da lacuna fica: nada que já está marcado é apagado pela sondagem. */
function provasDaCorrecaoRefeita(C, conferir) {
  const m = C.mapeamentoNovo();
  const s = (fr, pit) => ({ id: 'sond_refeita', data: '2026-10-30', itens: [
    { item: 'f1', lacuna: 'fracoes', resposta: fr[0] }, { item: 'f2', lacuna: 'fracoes', resposta: fr[1] },
    { item: 'p1', lacuna: 'pitagoras', resposta: pit[0] }, { item: 'p2', lacuna: 'pitagoras', resposta: pit[1] }] });
  C.aplicarSondagemNoMapeamento(m, { id: 'sond_outra', data: '2026-09-01', itens: [
    { item: 'o1', lacuna: 'fracoes', resposta: 'errado' }] });
  C.aplicarSondagemNoMapeamento(m, s(['errado', 'errado'], ['errado', 'errado']));
  conferir('primeira correção: as duas lacunas com a frase desta sondagem',
    [C.evidenciasDaLacuna(m, 'fracoes').length, C.evidenciasDaLacuna(m, 'pitagoras').length], [2, 1]);
  const r = C.aplicarSondagemNoMapeamento(m, s(['certo', 'errado'], ['errado', 'meio']));
  conferir('refeita, frações com um acerto: a frase "errou 2 de 2" desta sondagem SAI',
    C.evidenciasDaLacuna(m, 'fracoes'), ['errou 1 de 1 item de frações na sondagem de 01/09']);
  conferir('e a de outra sondagem fica', C.evidenciasDaLacuna(m, 'fracoes').length, 1);
  conferir('Pitágoras, ainda marcada pela correção nova, ganha a frase nova e só ela',
    C.evidenciasDaLacuna(m, 'pitagoras'), ['errou 1 de 2 itens de teorema de Pitágoras na sondagem de 30/10, e 1 saiu meio certo']);
  conferir('a marca de frações fica (nada marcado é apagado pela sondagem)',
    C.marcadosDaMateria(m, 'matematica').lacunas.indexOf('fracoes') >= 0, true);
  conferir('e a correção nova não a conta como marcada por ela', r.novas.concat(r.jaMarcadas), ['pitagoras']);
  C.aplicarSondagemNoMapeamento(m, s(['certo', 'certo'], ['certo', 'certo']));
  // lido com cuidado: um veneno pode nem criar o campo, e a prova conta, não quebra
  const ev = (m.evidencias && m.evidencias.lacunas) || {};
  conferir('refeita toda certa: nenhuma frase desta sondagem sobra em lacuna nenhuma',
    Object.keys(ev).reduce((n, k) => n + ev[k].filter(e => e.sondagem === 'sond_refeita').length, 0), 0);
  conferir('e a lista que ficou vazia sai, e a de outra sondagem fica', [Object.prototype.hasOwnProperty.call(ev, 'pitagoras'),
    (ev.fracoes || []).map(e => e.sondagem)], [false, ['sond_outra']]);
}

secao('5. A marcação da lacuna, com a evidência');
provasDaRegra(Core, conf);
provasDaCorrecaoRefeita(Core, conf);

secao('5b. Gerar a folha de novo com outros exercícios: a sondagem volta a "falta corrigir"');
const regBase = () => ({ id: 's', corrigidaEm: '2026-10-30', aplicadaEm: '2026-10-30', lacunasMarcadas: ['fracoes'], itens: [
  { item: 'a', lacuna: 'fracoes', resposta: 'errado' }, { item: 'b', lacuna: 'fracoes', resposta: 'meio' }] });
const mesmos = Core.refazerItensDaSondagem(regBase(), [{ item: 'a', lacuna: 'fracoes' }, { item: 'b', lacuna: 'fracoes' }]);
conf('os mesmos exercícios: continua corrigida, com as respostas', [mesmos.aplicadaEm, mesmos.lacunasMarcadas, mesmos.itens.map(x => x.resposta)],
  ['2026-10-30', ['fracoes'], ['errado', 'meio']]);
const outros = Core.refazerItensDaSondagem(regBase(), [{ item: 'a', lacuna: 'fracoes' }, { item: 'c', lacuna: 'fracoes' }]);
conf('um exercício trocado: volta a não corrigida', [outros.corrigidaEm, outros.aplicadaEm, outros.lacunasMarcadas], [undefined, undefined, undefined]);
conf('o que ficou guarda a resposta, o novo nasce sem', outros.itens.map(x => x.resposta), ['errado', '']);
const menos = Core.refazerItensDaSondagem(regBase(), [{ item: 'a', lacuna: 'fracoes' }]);
conf('um exercício tirado também volta a não corrigida', menos.aplicadaEm, undefined);

// ================================================================
secao('6. A cópia de segurança leva a sondagem e a evidência');

const aluno = { id: 'aluno_alfa', nome: 'Aluno Alfa Teste', anoEscolar: 'em1', mapeamentos: [Core.mapeamentoNovo()] };
const sondAlfa = { id: 'sond_copia', aulaId: 'aula_alfa', data: '2026-10-30', anoEscolar: 'em1', itens: [
  { item: '9ano:conjuntos:nocoes-basicas:ex:1', lacuna: 'conjuntos', resposta: 'errado' },
  { item: '9ano:conjuntos:conjuntos-numericos:ex:2', lacuna: 'conjuntos', resposta: 'errado' }] };
aluno.sondagens = [sondAlfa];
Core.aplicarSondagemNoMapeamento(aluno.mapeamentos[0], sondAlfa);
const volta = JSON.parse(JSON.stringify({ formato: 'apoio-educacional', dados: { alunos: [aluno] } })).dados.alunos[0];
conf('a sondagem volta inteira (itens, respostas, data)', volta.sondagens, aluno.sondagens);
conf('a lacuna volta marcada', Core.marcadosDaMateria(Core.mapeamentoAtual(volta), 'matematica').lacunas, ['conjuntos']);
conf('e a evidência volta lida', Core.evidenciasDaLacuna(Core.mapeamentoAtual(volta), 'conjuntos'),
  ['errou 2 de 2 itens de conjuntos e intervalos na sondagem de 30/10']);
conf('mapeamento antigo, sem o campo de evidência, não quebra', Core.evidenciasDaLacuna({ marcados: { lacunas: ['fracoes'] } }, 'fracoes'), []);

// ================================================================
secao('7. VENENO: cópias do core.js com a regra da marcação ou a limpeza trocada TÊM de reprovar');

const FONTE = fs.readFileSync(path.join(__dirname, '..', 'core.js'), 'utf8').replace(/\r\n/g, '\n');
function carregar(fonte, nome) {
  const m = { exports: {} };
  vm.runInNewContext(fonte, { module: m, console: console }, { filename: nome });
  return m.exports;
}
const REGRA = 'function sondagemMarcaLacuna(c) {';
const LIMPEZA = 'function tirarEvidenciasDaSondagem(m, sondagemId) {';
function envenenar(inicio, corpo) {
  const i = FONTE.indexOf(inicio);
  if (i < 0 || FONTE.indexOf(inicio, i + 1) >= 0) return null;
  const fim = FONTE.indexOf('\n  }\n', i);
  if (fim < 0) return null;
  return FONTE.slice(0, i) + inicio + '\n' + corpo + FONTE.slice(fim);
}
function contarFalhas(C) {
  let n = 0;
  const contar = (rotulo, obtido, esperado) => { if (JSON.stringify(obtido) !== JSON.stringify(esperado)) n++; };
  provasDaRegra(C, contar);
  provasDaCorrecaoRefeita(C, contar);
  return n;
}
let controle;
try { controle = contarFalhas(carregar(FONTE, 'core_de_verdade.js')); } catch (e) { controle = 'erro: ' + e.message; }
conf('controle: o core.js de verdade, pelo carregador dos venenos, passa em tudo', controle, 0);

const VENENOS = {
  // o principal: marca a lacuna mesmo com um acerto
  'um-acerto-marca': [REGRA, '    return c.total > 0 && c.corrigidos === c.total && c.certos <= 1 && c.errados >= 1;'],
  // marca sem esperar a correção inteira
  'sem-correcao-marca': [REGRA, '    return c.total > 0 && c.certos === 0 && c.errados >= c.meios && c.errados > 0;'],
  // o outro extremo, que nenhuma prova de "não marca" pegaria
  'nunca-marca': [REGRA, '    return false;'],
  // corrigir de novo sem limpar: a frase velha fica escrita (revisão do C5a)
  'nao-limpa': [LIMPEZA, '    return;']
};
Object.keys(VENENOS).forEach(nome => {
  const fonte = envenenar(VENENOS[nome][0], VENENOS[nome][1]);
  conf('veneno ' + nome + ': a troca da regra foi aplicada', fonte !== null && fonte !== FONTE, true);
  if (!fonte) return;
  let n;
  try { n = contarFalhas(carregar(fonte, 'core_' + nome + '.js')); } catch (e) { n = 'erro: ' + e.message; }
  console.log('       veneno ' + nome + ': ' + n + ' prova(s) da regra reprovaram');
  conf('veneno ' + nome + ': reprova (veneno visto)', typeof n === 'number' && n > 0, true);
});

// ================================================================
secao('7b. VENENO: cópias do core.js com a escolha da Mirim trocada TÊM de reprovar (C5b)');

/* Troca trechos EXATOS do core.js; cada um tem de existir uma vez só, senão
 * o veneno não foi aplicado e a prova diz isso, em vez de passar calada. */
function trocarTrechos(pares) {
  let fonte = FONTE;
  for (const [de, para] of pares) {
    const i = fonte.indexOf(de);
    if (i < 0 || fonte.indexOf(de, i + 1) >= 0) return null;
    fonte = fonte.slice(0, i) + para + fonte.slice(i + de.length);
  }
  return fonte;
}
function contarFalhasDaMirim(C) {
  let n = 0;
  provasDaMirim(C, (rotulo, obtido, esperado) => { if (JSON.stringify(obtido) !== JSON.stringify(esperado)) n++; });
  return n;
}
let controleMirim;
try { controleMirim = contarFalhasDaMirim(carregar(FONTE, 'core_de_verdade.js')); } catch (e) { controleMirim = 'erro: ' + e.message; }
conf('controle: o core.js de verdade, pelo carregador dos venenos, passa na escolha da Mirim', controleMirim, 0);

const FILTRO = "      if (!q || typeof q.id !== 'string' || typeof q.numero !== 'number' || eDiversos(q)) return false;\n";
const VENENOS_MIRIM = {
  // o principal: Diversos entra como curinga, quando a questão não tem assunto
  'escolhe-diversos': [
    [FILTRO, "      if (!q || typeof q.id !== 'string' || typeof q.numero !== 'number') return false;\n"],
    ['validas.filter(function (q) { return p.temas.indexOf(q.tema_app) >= 0; })',
      'validas.filter(function (q) { return !q.tema_app || p.temas.indexOf(q.tema_app) >= 0; })']],
  // Diversos só pelo tema: a questão com tema_app num módulo Diversos passa
  'diversos-so-pelo-tema': [
    ["    var m = q.modulo || {};\n    return /(^|-)diversos$/.test(String(m.slug || '')) || String(m.titulo || '') === 'Diversos';",
      '    return false;']],
  // fora da ordem da prova: na ordem em que o arquivo trouxe
  'fora-da-ordem': [
    ['        .sort(function (a, b) { return (a.numero - b.numero) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); })\n', '']],
  // a ordem invertida: a última questão primeiro
  'ordem-invertida': [
    ['return (a.numero - b.numero) || (a.id < b.id', 'return (b.numero - a.numero) || (a.id < b.id']],
  // o terço final da prova entra
  'terco-final-entra': [['      if (q.dificuldade === 3) return false;\n', '']],
  // assunto de ano acima do de entrada entra, como o recurso do Portal
  'ano-acima-entra': [['    var doAno = lista.filter(function (x) { return x.pos === teto; });',
    '    var doAno = lista.filter(function (x) { return x.pos >= teto; });']],
  // a prova de nível acima entra (Mirim 2 para quem entra no 3º)
  'prova-acima-entra': [['      return !!piso && posDaSerie(piso) <= teto;', '      return !!piso;']]
};
Object.keys(VENENOS_MIRIM).forEach(nome => {
  const fonte = trocarTrechos(VENENOS_MIRIM[nome]);
  conf('veneno ' + nome + ': a troca foi aplicada', fonte !== null && fonte !== FONTE, true);
  if (!fonte) return;
  let n;
  try { n = contarFalhasDaMirim(carregar(fonte, 'core_' + nome + '.js')); } catch (e) { n = 'erro: ' + e.message; }
  console.log('       veneno ' + nome + ': ' + n + ' prova(s) da escolha reprovaram');
  conf('veneno ' + nome + ': reprova (veneno visto)', typeof n === 'number' && n > 0, true);
});

// ================================================================
console.log('\n' + '='.repeat(60));
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
