/* testa_livros_mapa_correcao.js
 *
 * Fase 1a da biblioteca na nuvem (DESENHO 4.2): a correção dela no mapa
 * (db.ajustes.mapaDosLivros) sobrevive a qualquer mapa novo. Sem navegador
 * (Node 18+), sobre biblioteca.js: resolverCorrecoes, mapaDoLivro,
 * correcoesOrfas e chaveParaGravarCorrecao. Roda no --rapido. Livros e
 * correções SINTÉTICOS; dos livros reais só entram os títulos de arquivo da
 * tabela de herança (revisao-mapas/L1/HERANCA_L1.json), que já aparecem nos
 * comentários do biblioteca.js.
 *
 * O que se prova:
 *   1. CONTROLE, nada muda quando nada muda: com o mesmo mapa e as
 *      correções de sempre (número e título), a saída é a da regra de antes
 *      (a da main, copiada aqui e executada), e o objeto das correções sai
 *      byte a byte igual;
 *   2. o mapa renumera (o Praticando 9 de 12/11/2026: "Círculo e cilindro"
 *      entrou no meio, e os capítulos 3 e 4 viraram 4 e 5 com o mesmo
 *      título): a correção do 3 segue o título para o 4, a do 4 para o 5, e o
 *      capítulo novo do meio fica sem correção;
 *   3. o título muda e a CHAVE do capítulo fica: a correção segue a chave;
 *   4. o título ganha acento, sem chave: a correção segue o título
 *      normalizado;
 *   5. o capítulo sai do mapa: a correção fica ÓRFÃ, listada, e nunca vai
 *      para o vizinho;
 *   6. dois capítulos de mesmo título: a correção que dependia do título
 *      fica órfã, e não cai no primeiro;
 *   7. a unidade 8 do ga7 e do ga9 (a herança de títulos): a correção do
 *      título de arquivo cai no capítulo novo de MESMO assunto dentro da
 *      faixa antiga (o segundo, e não "Medições" nem "Algumas grandezas", que
 *      a tabela aponta); dois candidatos, nenhum, ou "nenhum assunto": órfã;
 *   8. gravar: a palavra nova sobre um capítulo substitui a correção que já
 *      vale nele (mesmo guardada sob outro número) e nunca a de OUTRO
 *      capítulo que mora no mesmo número; depois de gravar, tudo resolve;
 *   9. o tablet na versão antiga lendo as correções novas (a regra da main,
 *      executada): não quebra, a correção gravada pelo app novo vale no mapa
 *      antigo pelo número e título de lá, e a chave "<n>~..." é ignorada;
 *  10. a correção repetida que diz o mesmo some na que ficou; a que diz
 *      outra coisa fica órfã.
 *
 * Venenos (cada um tira uma regra; a prova TEM de ver o defeito):
 *   --envenenado-so-numero-e-titulo  sem a casa pela chave: o caso 3 perde
 *                                    a correção;
 *   --envenenado-titulo-pelo-primeiro  com dois candidatos, fica o primeiro:
 *                                    o caso 6 cai no capítulo errado;
 *   --envenenado-heranca-pelo-inicio  a herança cai no primeiro capítulo da
 *                                    faixa: o caso 7 vai para "Medições";
 *   --envenenado-orfa-some           as órfãs não são listadas: o caso 5
 *                                    conta zero;
 *   --envenenado-grava-por-cima      a palavra nova vai sempre para o número
 *                                    do capítulo: o caso 8 apaga a correção
 *                                    do outro capítulo.
 *
 *   node _teste/testa_livros_mapa_correcao.js [--envenenado-...]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const Module = require('module');

const RAIZ = path.join(__dirname, '..');
const TROCAS = {
  '--envenenado-so-numero-e-titulo': ["if (typeof c.chave !== 'string' || !c.chave) return [];", 'return [];'],
  '--envenenado-titulo-pelo-primeiro': ['if (achadas.length !== 1) return;', 'if (!achadas.length) return;'],
  '--envenenado-heranca-pelo-inicio': ['if (!escolhidos.length) return [];', 'return naFaixa.slice(0, 1);'],
  '--envenenado-orfa-some': ['return resolverCorrecoes(meta, correcoes).orfas;', 'return [];'],
  '--envenenado-grava-por-cima': ['if (!tem(k)) return k;', 'return k;']
};
const MODO = Object.keys(TROCAS).filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && !TROCAS[a]);

let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + String(obtido).slice(0, 400) + ' | esperado: ' + esperado + ']'));
  return ok;
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }
function terminar() {
  if (MODO) console.log('\nmodo ' + MODO);
  console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
  process.exit(falhas || !passes ? 1 : 0);
}

function carregar(nome, troca) {
  const caminho = path.join(RAIZ, nome);
  let texto = fs.readFileSync(caminho, 'utf8');
  if (troca) {
    const vezes = texto.split(troca[0]).length - 1;
    if (!conf('o ponto do veneno existe uma vez em ' + nome, vezes, 1)) process.exit(1);
    texto = texto.split(troca[0]).join(troca[1]);
  }
  const m = new Module(caminho, module);
  m.filename = caminho;
  m.paths = Module._nodeModulePaths(path.dirname(caminho));
  m._compile(texto, caminho);
  return m.exports;
}
const B = carregar('biblioteca.js', TROCAS[MODO] || null);

/* A REGRA DE ANTES (biblioteca.js da main 87bc615, mapaDoLivro), copiada e
 * executada: é o controle do caso 1 e o "tablet na versão antiga" do caso 9.
 * Só os campos que ela devolvia e que importam aqui. */
function mapaDaVersaoAntiga(meta, correcoes) {
  const inteiro = x => typeof x === 'number' && isFinite(x) && Math.floor(x) === x;
  const mapa = meta && Array.isArray(meta.mapa) ? meta.mapa : [];
  correcoes = correcoes || {};
  const saida = [];
  mapa.forEach(function (e) {
    if (!e || !inteiro(e.n) || typeof e.titulo !== 'string') return;
    const ids = (Array.isArray(e.assuntos) ? e.assuntos : []).map(a => a && a.id).filter(id => typeof id === 'string' && id);
    const c = Object.prototype.hasOwnProperty.call(correcoes, String(e.n)) ? correcoes[String(e.n)] : null;
    const vale = !!c && c.titulo === e.titulo && Array.isArray(c.assuntos);
    saida.push({ n: e.n, titulo: e.titulo,
      assuntos: vale ? c.assuntos.filter(id => typeof id === 'string' && id) : ids,
      estado: vale ? (c.acao === 'corrigiu' ? 'corrigido' : 'confirmado') : (e.origem === 'auto' ? 'a_confirmar' : 'do_mapa') });
  });
  return saida;
}

const a = id => ({ id, confianca: 'alta' });
const cap = (n, titulo, ini, fim, ids, extra) => Object.assign({ n, titulo, pagina: ini, pagina_fim: fim, assuntos: ids.map(a), origem: 'mapa' }, extra || {});
const pdf = (mapa, extra) => Object.assign({ formato: 'pdf', titulo: 'Livro sintético', paginas: 500, series: ['09'], mapa }, extra || {});
const resumo = m => m.map(e => e.n + ':' + e.assuntos.join('+') + ':' + e.estado).join(' ');
const orfas = (meta, c) => B.correcoesOrfas(meta, c).map(o => o.chave + '=' + o.titulo).join(' ');
const corr = (titulo, ids, acao, extra) => Object.assign({ titulo, assuntos: ids, acao: acao || 'corrigiu', quando: '2026-11-10T10:00:00.000Z' }, extra || {});

console.log('modo: ' + (MODO || 'normal'));
conf('nenhum veneno desconhecido foi pedido', desconhecidos.join(','), '');

// ------------------------------------------------------------------
secao('1. CONTROLE: nada muda quando nada muda');
const metaV1 = pdf([cap(1, 'Números reais', 1, 40, ['MAT09-01']), cap(2, 'Potências e raízes', 41, 80, ['MAT09-02']),
  cap(3, 'Equações do 2º grau', 81, 120, ['MAT09-05']), cap(4, 'Funções', 121, 160, ['MAT09-06']),
  cap(5, 'Estatística', 161, 200, [], { origem: 'auto' })]);
const correcoesV1 = {
  1: corr('Números reais', ['MAT09-01'], 'confirmou'),
  3: corr('Equações do 2º grau', ['MAT09-04']),
  4: corr('Funções', [], 'corrigiu'),
  // a de título velho, de um sumário em que o 5 tinha outro nome: não vale em lugar nenhum
  5: corr('Um capítulo que mudou de nome', ['MAT09-11'])
};
const fotoAntes = JSON.stringify(correcoesV1);
const novo1 = B.mapaDoLivro(metaV1, correcoesV1), velho1 = mapaDaVersaoAntiga(metaV1, correcoesV1);
console.log('   regra nova:  ' + resumo(novo1));
console.log('   regra antiga: ' + resumo(velho1));
conf('a saída é a da regra de antes (executada), capítulo a capítulo', resumo(novo1), resumo(velho1));
conf('e a regra de antes dá o que se espera dela (o controle enxerga as correções)', resumo(velho1),
  '1:MAT09-01:confirmado 2:MAT09-02:do_mapa 3:MAT09-04:corrigido 4::corrigido 5::a_confirmar');
conf('o objeto das correções sai byte a byte igual', JSON.stringify(correcoesV1), fotoAntes);
if (MODO !== '--envenenado-orfa-some') {
  conf('a de título velho é órfã, listada (nunca aplicada no 5)', orfas(metaV1, correcoesV1), '5=Um capítulo que mudou de nome');
}
conf('sem correção nenhuma: igual à regra de antes e sem órfã', resumo(B.mapaDoLivro(metaV1, {})) + '|' + orfas(metaV1, {}),
  resumo(mapaDaVersaoAntiga(metaV1, {})) + '|');
conf('correção null ou malformada não quebra e não vale', resumo(B.mapaDoLivro(metaV1, { 2: null, 3: 'x', 4: { titulo: 'Funções' } })),
  resumo(mapaDaVersaoAntiga(metaV1, {})));
conf('a entrada leva a chave do capítulo (null sem chave) e a chave da correção que vale', JSON.stringify(novo1.slice(0, 2).map(e => [e.chave, e.correcaoChave])),
  '[[null,"1"],[null,null]]');

// ------------------------------------------------------------------
secao('2. O mapa renumera (Praticando 9, 12/11/2026)');
const pr9Antes = pdf([cap(1, 'Números reais', 1, 40, ['MAT09-01']), cap(2, 'Potências e raízes', 41, 80, ['MAT09-02']),
  cap(3, 'Proporcionalidade', 81, 221, ['MAT09-07']), cap(4, 'Semelhança', 242, 273, ['MAT09-09'])]);
const pr9Depois = pdf([cap(1, 'Números reais', 1, 40, ['MAT09-01']), cap(2, 'Potências e raízes', 41, 80, ['MAT09-02']),
  cap(3, 'Círculo e cilindro', 222, 241, ['MAT09-12']), cap(4, 'Proporcionalidade', 81, 221, ['MAT09-07']),
  cap(5, 'Semelhança', 242, 273, ['MAT09-09'])]);
const correcoesPr9 = { 3: corr('Proporcionalidade', ['MAT09-08']), 4: corr('Semelhança', ['MAT09-09'], 'confirmou') };
conf('antes: as duas correções valem no 3 e no 4', resumo(B.mapaDoLivro(pr9Antes, correcoesPr9)),
  '1:MAT09-01:do_mapa 2:MAT09-02:do_mapa 3:MAT09-08:corrigido 4:MAT09-09:confirmado');
const fotoPr9 = JSON.stringify(correcoesPr9);
conf('depois: a do 3 segue o título para o 4, a do 4 para o 5, e o capítulo novo do meio fica do mapa',
  resumo(B.mapaDoLivro(pr9Depois, correcoesPr9)), '1:MAT09-01:do_mapa 2:MAT09-02:do_mapa 3:MAT09-12:do_mapa 4:MAT09-08:corrigido 5:MAT09-09:confirmado');
conf('a regra de antes perdia as duas (o defeito que a 1a conserta)', resumo(mapaDaVersaoAntiga(pr9Depois, correcoesPr9)),
  '1:MAT09-01:do_mapa 2:MAT09-02:do_mapa 3:MAT09-12:do_mapa 4:MAT09-07:do_mapa 5:MAT09-09:do_mapa');
conf('nenhuma órfã, e o db não mudou', orfas(pr9Depois, correcoesPr9) + '|' + (JSON.stringify(correcoesPr9) === fotoPr9), '|true');

// ------------------------------------------------------------------
secao('3. O título muda e a chave do capítulo fica');
const comChave = pdf([cap(1, 'Conjuntos', 1, 30, ['MAT09-01'], { chave: 'c1a2b' }), cap(2, 'Frações', 31, 60, ['MAT09-03'], { chave: 'c7f3a' })]);
const correcoesChave = { 2: corr('Frações', ['MAT09-04'], 'corrigiu', { n: 2, chave: 'c7f3a' }) };
const trocouTitulo = pdf([cap(1, 'Conjuntos numéricos', 1, 30, ['MAT09-01'], { chave: 'c1a2b' }),
  cap(2, 'Números racionais e frações', 31, 60, ['MAT09-03'], { chave: 'c7f3a' })]);
const r3 = resumo(B.mapaDoLivro(trocouTitulo, correcoesChave));
if (MODO === '--envenenado-so-numero-e-titulo') {
  secao('VENENO: sem a casa pela chave');
  conf('envenenado: a correção do capítulo de título novo se perdeu e virou órfã (defeito enxergado)',
    r3 + '|' + orfas(trocouTitulo, correcoesChave), '1:MAT09-01:do_mapa 2:MAT09-03:do_mapa|2=Frações');
  terminar();
} else {
  conf('antes, pelo número e título', resumo(B.mapaDoLivro(comChave, correcoesChave)), '1:MAT09-01:do_mapa 2:MAT09-04:corrigido');
  conf('depois do título novo, pela chave', r3, '1:MAT09-01:do_mapa 2:MAT09-04:corrigido');
  const renumerouETrocou = pdf([cap(1, 'Introdução', 1, 10, []), cap(2, 'Conjuntos numéricos', 11, 30, ['MAT09-01'], { chave: 'c1a2b' }),
    cap(3, 'Números racionais e frações', 31, 60, ['MAT09-03'], { chave: 'c7f3a' })]);
  conf('renumerado e de título novo, a chave ainda leva ao capítulo certo', resumo(B.mapaDoLivro(renumerouETrocou, correcoesChave)),
    '1::do_mapa 2:MAT09-01:do_mapa 3:MAT09-04:corrigido');
  const chaveDupla = pdf([cap(1, 'A', 1, 10, [], { chave: 'c7f3a' }), cap(2, 'B', 11, 20, [], { chave: 'c7f3a' })]);
  // (nos venenos do primeiro candidato e da órfã que some, quem diz que o defeito foi visto são as seções 6 e 5)
  if (MODO !== '--envenenado-titulo-pelo-primeiro' && MODO !== '--envenenado-orfa-some') {
    conf('a mesma chave em duas entradas (mapa defeituoso): nenhuma, e a correção fica órfã', orfas(chaveDupla, correcoesChave), '2=Frações');
  }
}

// ------------------------------------------------------------------
secao('4. O título ganha acento, sem chave');
const semAcento = { 2: corr('Fracoes  e   decimais', ['MAT06-06']) };
const comAcento = pdf([cap(1, 'Números naturais', 1, 10, ['MAT06-02']), cap(2, 'Geometria', 11, 20, []), cap(3, 'Frações e Decimais', 21, 30, ['MAT06-05'])]);
conf('a correção segue o título normalizado (acento, caixa e espaço), mesmo em outro número', resumo(B.mapaDoLivro(comAcento, semAcento)),
  '1:MAT06-02:do_mapa 2::do_mapa 3:MAT06-06:corrigido');

// ------------------------------------------------------------------
secao('5. O capítulo sai do mapa: órfã, nunca no vizinho');
const saiu = pdf([cap(1, 'Números reais', 1, 40, ['MAT09-01']), cap(2, 'Potências e raízes', 41, 80, ['MAT09-02']),
  cap(3, 'Funções', 121, 160, ['MAT09-06'])]);
const correcoesSaiu = { 3: corr('Equações do 2º grau', ['MAT09-04']), 2: corr('Potências e raízes', ['MAT09-03']) };
const fotoSaiu = JSON.stringify(correcoesSaiu);
const r5 = resumo(B.mapaDoLivro(saiu, correcoesSaiu)), o5 = B.correcoesOrfas(saiu, correcoesSaiu);
conf('o capítulo 3 de agora (outro) não recebe a correção do que saiu', r5, '1:MAT09-01:do_mapa 2:MAT09-03:corrigido 3:MAT09-06:do_mapa');
if (MODO === '--envenenado-orfa-some') {
  secao('VENENO: as órfãs não são listadas');
  conf('envenenado: a correção do capítulo que saiu não aparece em lugar nenhum (defeito enxergado)', o5.length, 0);
  terminar();
} else {
  conf('ela é listada como órfã, com o que ela escolheu', JSON.stringify(o5.map(o => [o.chave, o.titulo, o.assuntos.join('+'), o.acao, o.n])),
    '[["3","Equações do 2º grau","MAT09-04","corrigiu",3]]');
}
conf('o db não mudou', JSON.stringify(correcoesSaiu), fotoSaiu);

// ------------------------------------------------------------------
secao('6. Dois capítulos de mesmo título: órfã, e não o primeiro');
const repetido = pdf([cap(1, 'Revisão', 1, 10, ['MAT09-01']), cap(2, 'Funções', 11, 40, ['MAT09-06']), cap(3, 'Revisão', 41, 50, ['MAT09-06'])]);
const correcoesRep = { 5: corr('Revisão', ['MAT09-11']) };
const r6 = resumo(B.mapaDoLivro(repetido, correcoesRep));
if (MODO === '--envenenado-titulo-pelo-primeiro') {
  secao('VENENO: com dois candidatos, o primeiro');
  conf('envenenado: a correção caiu no primeiro "Revisão" (defeito enxergado)', r6.indexOf('1:MAT09-11:corrigido') >= 0, true);
  terminar();
} else {
  conf('nenhum dos dois "Revisão" recebe a correção', r6, '1:MAT09-01:do_mapa 2:MAT09-06:do_mapa 3:MAT09-06:do_mapa');
  if (MODO !== '--envenenado-orfa-some') conf('ela fica órfã', orfas(repetido, correcoesRep), '5=Revisão');
  // a do MESMO número e título continua valendo pela regra de antes, mesmo com o título repetido
  conf('a do mesmo número e título vale pela regra de antes', resumo(B.mapaDoLivro(repetido, { 3: corr('Revisão', ['MAT09-02']) })),
    '1:MAT09-01:do_mapa 2:MAT09-06:do_mapa 3:MAT09-02:corrigido');
}

// ------------------------------------------------------------------
secao('7. A unidade 8 do ga7 e do ga9 (herança de títulos, HERANCA_L1)');
// trechos da tabela real (revisao-mapas/L1/HERANCA_L1.json), com as faixas vizinhas para a unidade 8 ter fim
const herancaGa7 = [
  { titulo_antigo: 'GA_MAT_7_LP_4ED_PNLD24_OB1_U7_244A277_FECHADO', titulo_novo: 'Probabilidade', pag_arquivo_inicio_antiga: 358 },
  { titulo_antigo: 'GA_MAT_7_LP_4ED_PNLD24_OB1_U8_278A307_FECHADO', titulo_novo: 'Medições', pag_arquivo_inicio_antiga: 392 },
  { titulo_antigo: 'GA_MAT_7_LE_4ED_PNLD24_OB1_INTERACAO_308A310_FECHADO', titulo_novo: 'Interação: Vamos reciclar?', pag_arquivo_inicio_antiga: 422 }
];
const herancaGa9 = [
  { titulo_antigo: 'GA_MAT_9_LP_4ED_PNLD24_OB1_U7_250A281_P4', titulo_novo: 'Probabilidade', pag_arquivo_inicio_antiga: 404 },
  { titulo_antigo: 'GA_MAT_9_LP_4ED_PNLD24_OB1_U8_282A307_FECHADO', titulo_novo: 'Algumas grandezas', pag_arquivo_inicio_antiga: 436 },
  { titulo_antigo: 'GA_MAT_9_LP_4ED_PNLD24_OB1_INTERACAO_308A310_FECHADO', titulo_novo: 'Interação: Imigrantes e refugiados', pag_arquivo_inicio_antiga: 462 }
];
const ga7 = pdf([cap(30, 'Probabilidade', 358, 391, ['MAT07-14']), cap(31, 'Medições', 392, 405, ['MAT07-12']),
  cap(32, 'Volume e capacidade', 406, 421, ['MAT06-12']), cap(33, 'Interação: Vamos reciclar?', 422, 424, [])],
{ paginas: 430, series: ['07'], heranca_titulos: herancaGa7 });
const ga9 = pdf([cap(28, 'Probabilidade', 404, 435, ['MAT09-14']), cap(29, 'Algumas grandezas', 436, 447, ['MAT09-13']),
  cap(30, 'Volume de prismas e cilindros', 448, 461, ['MAT09-12']), cap(31, 'Interação: Imigrantes e refugiados', 462, 464, [])],
{ paginas: 470, heranca_titulos: herancaGa9 });
const u8ga7 = { 26: corr('GA_MAT_7_LP_4ED_PNLD24_OB1_U8_278A307_FECHADO', ['MAT06-12'], 'confirmou') };
const u8ga9 = { 26: corr('GA_MAT_9_LP_4ED_PNLD24_OB1_U8_282A307_FECHADO', ['MAT09-12'], 'confirmou') };
const r7a = resumo(B.mapaDoLivro(ga7, u8ga7)), r7b = resumo(B.mapaDoLivro(ga9, u8ga9));
console.log('   ga7: ' + r7a);
console.log('   ga9: ' + r7b);
if (MODO === '--envenenado-heranca-pelo-inicio') {
  secao('VENENO: a herança pelo começo da faixa');
  conf('envenenado: a correção do volume caiu em "Medições" e em "Algumas grandezas" (defeito enxergado)',
    r7a.indexOf('31:MAT06-12:confirmado') >= 0 && r7b.indexOf('29:MAT09-12:confirmado') >= 0, true);
  terminar();
} else {
  conf('ga7: a correção cai no capítulo do volume (MAT06-12), e não em "Medições"', r7a,
    '30:MAT07-14:do_mapa 31:MAT07-12:do_mapa 32:MAT06-12:confirmado 33::do_mapa');
  conf('ga9: a correção cai no capítulo do volume (MAT09-12), e não em "Algumas grandezas"', r7b,
    '28:MAT09-14:do_mapa 29:MAT09-13:do_mapa 30:MAT09-12:confirmado 31::do_mapa');
  // corrigida para outro assunto que também está na faixa: segue o assunto que ELA escolheu
  conf('a correção para o assunto de "Medições" cai em "Medições"', resumo(B.mapaDoLivro(ga7,
    { 26: corr('GA_MAT_7_LP_4ED_PNLD24_OB1_U8_278A307_FECHADO', ['MAT07-12']) })), '30:MAT07-14:do_mapa 31:MAT07-12:corrigido 32:MAT06-12:do_mapa 33::do_mapa');
  if (MODO !== '--envenenado-orfa-some') {
    conf('assunto que nenhum capítulo da faixa tem: órfã', orfas(ga7, { 26: corr('GA_MAT_7_LP_4ED_PNLD24_OB1_U8_278A307_FECHADO', ['MAT07-14']) }),
      '26=GA_MAT_7_LP_4ED_PNLD24_OB1_U8_278A307_FECHADO');
    conf('"nenhum assunto do índice": órfã, e não "Medições"', orfas(ga7, { 26: corr('GA_MAT_7_LP_4ED_PNLD24_OB1_U8_278A307_FECHADO', []) }),
      '26=GA_MAT_7_LP_4ED_PNLD24_OB1_U8_278A307_FECHADO');
    const doisNaFaixa = Object.assign({}, ga7, { mapa: ga7.mapa.map(e => e.n === 31 ? cap(31, 'Medições', 392, 405, ['MAT06-12']) : e) });
    conf('dois capítulos da faixa com o mesmo assunto: órfã', orfas(doisNaFaixa, u8ga7), '26=GA_MAT_7_LP_4ED_PNLD24_OB1_U8_278A307_FECHADO');
    conf('sem a tabela de herança no meta: órfã', orfas(Object.assign({}, ga7, { heranca_titulos: undefined }), u8ga7),
      '26=GA_MAT_7_LP_4ED_PNLD24_OB1_U8_278A307_FECHADO');
  }
  // a faixa antiga termina antes do começo seguinte da tabela: a Interação (422) está fora da unidade 8
  const naInteracao = Object.assign({}, ga7, { mapa: ga7.mapa.map(e => e.n === 32 ? cap(32, 'Volume e capacidade', 406, 421, []) :
    e.n === 33 ? cap(33, 'Interação: Vamos reciclar?', 422, 424, ['MAT06-12']) : e) });
  if (MODO !== '--envenenado-orfa-some') {
    conf('o assunto só na Interação (fora da faixa, p. 422): órfã', orfas(naInteracao, u8ga7), '26=GA_MAT_7_LP_4ED_PNLD24_OB1_U8_278A307_FECHADO');
  }
}

// ------------------------------------------------------------------
secao('8. Gravar: a palavra nova nunca toma o lugar de outra correção');
// o app.js grava assim (gravarCorrecaoDoMapa): a chave de Biblioteca.chaveParaGravarCorrecao, com n e chave
const gravar = (meta, todas, n, ids, acao) => {
  const e = B.mapaDoLivro(meta, todas).filter(x => x.n === n)[0];
  const r = { titulo: e.titulo, assuntos: ids, acao, quando: '2026-11-12T20:00:00.000Z', n: e.n };
  if (e.chave) r.chave = e.chave;
  todas[B.chaveParaGravarCorrecao(todas, e)] = r;
};
const c8 = JSON.parse(fotoPr9);   // as do Praticando 9, gravadas nos números de antes (3 e 4)
gravar(pr9Depois, c8, 3, ['MAT09-13'], 'corrigiu');   // o capítulo novo do meio, cujo número (3) guarda a de "Proporcionalidade"
const r8 = resumo(B.mapaDoLivro(pr9Depois, c8));
if (MODO === '--envenenado-grava-por-cima') {
  secao('VENENO: a palavra nova sempre no número do capítulo');
  conf('envenenado: a correção de "Proporcionalidade" foi apagada pela do capítulo novo (defeito enxergado)',
    !Object.keys(c8).some(k => c8[k].titulo === 'Proporcionalidade'), true);
  terminar();
} else {
  conf('a correção de "Proporcionalidade" continua no db', Object.keys(c8).filter(k => c8[k].titulo === 'Proporcionalidade').join(','), '3');
  conf('a nova foi para uma chave nova do número 3', Object.keys(c8).sort().join(','), '3,3~circulo-e-cilindro,4');
  conf('as três valem, cada uma no seu capítulo', r8, '1:MAT09-01:do_mapa 2:MAT09-02:do_mapa 3:MAT09-13:corrigido 4:MAT09-08:corrigido 5:MAT09-09:confirmado');
  gravar(pr9Depois, c8, 4, ['MAT09-07'], 'confirmou');   // a palavra nova sobre "Proporcionalidade", agora o 4
  conf('a palavra nova sobre o capítulo 4 substitui a dela mesma, guardada no 3', JSON.stringify([c8['3'].titulo, c8['3'].acao, c8['3'].n, c8['4'].titulo]),
    '["Proporcionalidade","confirmou",4,"Semelhança"]');
  conf('sem órfã e sem repetida', orfas(pr9Depois, c8) + '|' + Object.keys(c8).length, '|3');
  // a chave nova já ocupada: a seguinte
  const ocupada = { 3: corr('Outro', []), '3~circulo-e-cilindro': corr('Outro ainda', []) };
  conf('a chave "<n>~..." ocupada leva a "<n>~...~2"', B.chaveParaGravarCorrecao(ocupada, B.mapaDoLivro(pr9Depois, ocupada)[2]), '3~circulo-e-cilindro~2');
  conf('com a chave do capítulo, é ela que entra no nome', B.chaveParaGravarCorrecao({ 2: corr('Outro', []) }, B.mapaDoLivro(comChave, {})[1]), '2~c7f3a');
  conf('número livre: o número, como sempre foi', B.chaveParaGravarCorrecao({}, B.mapaDoLivro(comChave, {})[1]), '2');
}

// ------------------------------------------------------------------
secao('9. O tablet na versão antiga lendo as correções novas');
if (MODO !== '--envenenado-grava-por-cima') {
  let quebrou = null, velho = '';
  try { velho = resumo(mapaDaVersaoAntiga(pr9Antes, c8)); } catch (e) { quebrou = e.message; }
  conf('a regra antiga lê as correções novas sem quebrar', quebrou, null);
  // no mapa antigo (Proporcionalidade é o 3), a correção que o app novo regravou no "3" vale pelo número e título de lá
  conf('no mapa antigo, a palavra nova de "Proporcionalidade" vale no 3 de lá, e a "3~..." é ignorada', velho,
    '1:MAT09-01:do_mapa 2:MAT09-02:do_mapa 3:MAT09-07:confirmado 4:MAT09-09:confirmado');
  // e a versão nova lê o que a antiga grava (só titulo, assuntos, acao e quando, no número): o caso 2
}
conf('a versão nova lê o que a antiga gravou (número e título do mapa antigo)', resumo(B.mapaDoLivro(pr9Depois, correcoesPr9)),
  '1:MAT09-01:do_mapa 2:MAT09-02:do_mapa 3:MAT09-12:do_mapa 4:MAT09-08:corrigido 5:MAT09-09:confirmado');

// ------------------------------------------------------------------
secao('10. A correção repetida');
const igual = { 3: corr('Proporcionalidade', ['MAT09-08']), '4~x': corr('Proporcionalidade', ['MAT09-08'], 'corrigiu', { n: 4, quando: '2026-11-11T10:00:00.000Z' }) };
conf('duas que dizem o mesmo para o mesmo capítulo: vale uma, sem órfã', resumo(B.mapaDoLivro(pr9Depois, igual)) + '|' + orfas(pr9Depois, igual),
  '1:MAT09-01:do_mapa 2:MAT09-02:do_mapa 3:MAT09-12:do_mapa 4:MAT09-08:corrigido 5:MAT09-09:do_mapa|');
const diferente = { 3: corr('Proporcionalidade', ['MAT09-08'], 'corrigiu', { quando: '2026-11-09T10:00:00.000Z' }),
  '4~x': corr('Proporcionalidade', ['MAT09-10'], 'corrigiu', { n: 4, quando: '2026-11-11T10:00:00.000Z' }) };
const r10 = resumo(B.mapaDoLivro(pr9Depois, diferente));
conf('duas que dizem coisas diferentes: vale a do mesmo número e título (a mais forte)', r10,
  '1:MAT09-01:do_mapa 2:MAT09-02:do_mapa 3:MAT09-12:do_mapa 4:MAT09-10:corrigido 5:MAT09-09:do_mapa');
if (MODO !== '--envenenado-orfa-some') conf('e a outra fica órfã, à vista', orfas(pr9Depois, diferente), '3=Proporcionalidade');

if (MODO) {
  // veneno pedido e não visto: a seção dele não rodou, e isso é falha
  conf('o veneno pedido foi visto pela seção dele', 'não visto', 'visto');
}
terminar();
