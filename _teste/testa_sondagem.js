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
const ids = LAC.itens.map(i => i.id);
conf('as 22 antigas continuam, na mesma ordem, com os mesmos ids', ids.slice(0, 22), ANTIGAS);
conf('as cinco novas entram depois delas', ids.slice(22), NOVAS);
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
conf('só tabuada e divisão ficam sem regra de escolha (anos iniciais, OBMEP Mirim)',
  LAC.itens.filter(i => !(i.obmep && i.obmep.length)).map(i => i.id), ['tabuada', 'divisao']);
conf('nenhum travessão nas lacunas', TRAVESSAO.test(JSON.stringify(LAC)), false);
conf('as novas aparecem para matemática, e não para história',
  [NOVAS.every(id => Core.itensDaMateria('lacunas', 'matematica').some(i => i.id === id)),
    Core.itensDaMateria('lacunas', 'historia').length], [true, 0]);

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
conf('a tabela cobre do 6º ano ao 3º do médio', Object.keys(Core.LACUNAS_PROVAVEIS).sort(), ANOS.slice().sort());
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
conf('2º ao 5º, fora da escola, outro e sem ano: nada (OBMEP Mirim fica para depois)',
  ['02', '05', 'fora', 'outro', ''].map(a => Core.lacunasProvaveis(a).length), [0, 0, 0, 0, 0]);
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
console.log('\n' + '='.repeat(60));
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
