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
 * A regra que manda em tudo: na dúvida, a correção dela fica ÓRFÃ À VISTA
 * (com uma sugestão de um toque, quando há um capítulo provável), nunca
 * aplicada calada noutro capítulo. O que se prova, sempre dos dois lados:
 *   1. CONTROLE, nada muda quando nada muda: com o mesmo mapa e as
 *      correções de sempre (número e título), a saída é a da regra de antes
 *      (a da main, copiada aqui e executada), e o objeto das correções sai
 *      byte a byte igual;
 *   2. o Praticando 9 (12/11/2026: "Círculo e cilindro" entrou no meio, e os
 *      capítulos 3 e 4 viraram 4 e 5 com o mesmo título): com o mapa de hoje,
 *      sem chave, as duas ficam órfãs com a sugestão certa (um toque); com o
 *      mapa do gerador da 1b, que dá a chave, elas seguem a chave sozinhas;
 *   3. a chave: casa com o mesmo título (mesmo renumerado) e com o par da
 *      tabela de herança; com o título diferente fora da tabela, NÃO aplica e
 *      vira sugestão;
 *   4. o título só com acento novo, sem chave: sugestão, não aplicação;
 *   5. o capítulo sai do mapa: órfã, sem sugestão, nunca no vizinho;
 *   6. título repetido: dois "Revisão" no mapa novo, órfã sem sugestão; dois
 *      "Exercícios" no antigo e um só no novo, órfã COM sugestão, e não
 *      aplicada (o caso das lentes de 12/11);
 *   7. a unidade 8 do ga7 e do ga9 (a herança de títulos): a correção do
 *      título de arquivo cai no capítulo novo de MESMO assunto dentro da
 *      faixa antiga (o segundo, e não "Medições" nem "Algumas grandezas", que
 *      a tabela aponta); dois candidatos, nenhum, ou "nenhum assunto": órfã;
 *   8. gravar: a palavra nova sobre um capítulo substitui a correção que já
 *      vale nele (mesmo guardada sob outro número) e nunca a de OUTRO
 *      capítulo que mora no mesmo número, nem a órfã;
 *   9. o tablet na versão antiga lendo as correções novas (a regra da main,
 *      executada): não quebra, a correção gravada pelo app novo vale no mapa
 *      antigo pelo número e título de lá, e a chave "<n>~..." é ignorada;
 *  10. duas no mesmo capítulo: vence a mais RECENTE, qualquer que seja o
 *      passo; a outra fica órfã com o capítulo como sugestão (ocupado); a que
 *      diz o mesmo que a vencedora não aparece.
 *
 * Venenos (cada um tira uma regra; a prova TEM de ver o defeito):
 *   --envenenado-so-numero-e-titulo  sem a casa pela chave: o Praticando 9 com
 *                                    chave deixa de seguir sozinho;
 *   --envenenado-chave-sem-titulo    a chave aplica mesmo com o título
 *                                    diferente: o caso 3 move calado;
 *   --envenenado-titulo-aplica-calado  o título único volta a aplicar: o
 *                                    "Exercícios" do caso 6 cai calado;
 *   --envenenado-heranca-pelo-inicio  a herança cai no primeiro capítulo da
 *                                    faixa: o caso 7 vai para "Medições";
 *   --envenenado-mais-forte-vence    no mesmo destino, vence o passo mais
 *                                    forte e não a mais recente: o caso 10;
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
  '--envenenado-so-numero-e-titulo': ['var porChave = unica(entradas.filter(function (e) { return e.chave === c.chave; }));', 'var porChave = null;'],
  '--envenenado-chave-sem-titulo': ['if (mesmoTitulo || herdaPara(c, porChave)) {', 'if (true) {'],
  '--envenenado-titulo-aplica-calado': ['if (porTitulo) sugestoes[k] = porTitulo;', "if (porTitulo) { propostas[k] = { e: porTitulo, como: 'numero' }; return; }"],
  '--envenenado-heranca-pelo-inicio': ['if (!escolhidos.length) return [];', 'return naFaixa.slice(0, 1);'],
  '--envenenado-mais-forte-vence': ['return maisNova(a, b) || forca(a) - forca(b) ||', 'return forca(a) - forca(b) || maisNova(a, b) ||'],
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
const veneno = (rotulo, visto) => { secao('VENENO ' + MODO); conf('envenenado: ' + rotulo + ' (defeito enxergado)', visto, true); terminar(); };

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
// cada órfã: chave=título, e a sugestão (->n, com * quando o capítulo já tem outra correção)
const orfas = (meta, c) => B.correcoesOrfas(meta, c).map(o => o.chave + '=' + o.titulo +
  (o.sugestao ? '->' + o.sugestao.n + (o.sugestao.ocupado ? '*' : '') : '')).join(' ');
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
  conf('a de título velho é órfã, listada, sem sugestão (nunca aplicada no 5)', orfas(metaV1, correcoesV1), '5=Um capítulo que mudou de nome');
}
conf('sem correção nenhuma: igual à regra de antes e sem órfã', resumo(B.mapaDoLivro(metaV1, {})) + '|' + orfas(metaV1, {}),
  resumo(mapaDaVersaoAntiga(metaV1, {})) + '|');
conf('correção null ou malformada não quebra e não vale', resumo(B.mapaDoLivro(metaV1, { 2: null, 3: 'x', 4: { titulo: 'Funções' } })),
  resumo(mapaDaVersaoAntiga(metaV1, {})));
conf('a entrada leva a chave do capítulo (null sem chave) e a chave da correção que vale', JSON.stringify(novo1.slice(0, 2).map(e => [e.chave, e.correcaoChave])),
  '[[null,"1"],[null,null]]');

// ------------------------------------------------------------------
secao('2. O Praticando 9 (12/11/2026): os capítulos 3 e 4 viraram 4 e 5');
const pr9Antes = pdf([cap(1, 'Números reais', 1, 40, ['MAT09-01']), cap(2, 'Potências e raízes', 41, 80, ['MAT09-02']),
  cap(3, 'Proporcionalidade', 81, 221, ['MAT09-07']), cap(4, 'Semelhança', 242, 273, ['MAT09-09'])]);
const pr9Depois = pdf([cap(1, 'Números reais', 1, 40, ['MAT09-01']), cap(2, 'Potências e raízes', 41, 80, ['MAT09-02']),
  cap(3, 'Círculo e cilindro', 222, 241, ['MAT09-12']), cap(4, 'Proporcionalidade', 81, 221, ['MAT09-07']),
  cap(5, 'Semelhança', 242, 273, ['MAT09-09'])]);
const correcoesPr9 = { 3: corr('Proporcionalidade', ['MAT09-08']), 4: corr('Semelhança', ['MAT09-09'], 'confirmou') };
conf('antes: as duas correções valem no 3 e no 4', resumo(B.mapaDoLivro(pr9Antes, correcoesPr9)),
  '1:MAT09-01:do_mapa 2:MAT09-02:do_mapa 3:MAT09-08:corrigido 4:MAT09-09:confirmado');
const fotoPr9 = JSON.stringify(correcoesPr9);
// o mapa de hoje, sem chave: nenhuma aplicada calada; as duas à vista, cada uma com a sugestão certa
if (MODO === '--envenenado-titulo-aplica-calado') {
  veneno('sem chave, as correções caíram caladas nos capítulos de mesmo título', /4:MAT09-08:corrigido/.test(resumo(B.mapaDoLivro(pr9Depois, correcoesPr9))));
}
conf('sem chave: nenhuma é aplicada calada no capítulo renumerado', resumo(B.mapaDoLivro(pr9Depois, correcoesPr9)),
  '1:MAT09-01:do_mapa 2:MAT09-02:do_mapa 3:MAT09-12:do_mapa 4:MAT09-07:do_mapa 5:MAT09-09:do_mapa');
if (MODO !== '--envenenado-orfa-some') {
  conf('sem chave: as duas órfãs à vista, com a sugestão de um toque (o 4 e o 5)', orfas(pr9Depois, correcoesPr9),
    '3=Proporcionalidade->4 4=Semelhança->5');
}
conf('e o db não mudou', JSON.stringify(correcoesPr9), fotoPr9);
// o mapa do gerador da 1b, com a chave herdada pelo título: as duas seguem sozinhas
const comChaves = m => Object.assign({}, m, { mapa: m.mapa.map(e => Object.assign({}, e, { chave: 'k-' + e.titulo.slice(0, 4).toLowerCase() })) });
const pr9AntesK = comChaves(pr9Antes), pr9DepoisK = comChaves(pr9Depois);
const correcoesPr9K = { 3: corr('Proporcionalidade', ['MAT09-08'], 'corrigiu', { n: 3, chave: 'k-prop' }),
  4: corr('Semelhança', ['MAT09-09'], 'confirmou', { n: 4, chave: 'k-seme' }) };
const r2k = resumo(B.mapaDoLivro(pr9DepoisK, correcoesPr9K));
if (MODO === '--envenenado-so-numero-e-titulo') {
  veneno('sem a casa pela chave, o Praticando 9 com chave deixou de seguir sozinho', r2k === '1:MAT09-01:do_mapa 2:MAT09-02:do_mapa 3:MAT09-12:do_mapa 4:MAT09-07:do_mapa 5:MAT09-09:do_mapa');
}
conf('com a chave (mapa da 1b): as duas seguem o capítulo sozinhas', r2k,
  '1:MAT09-01:do_mapa 2:MAT09-02:do_mapa 3:MAT09-12:do_mapa 4:MAT09-08:corrigido 5:MAT09-09:confirmado');
conf('e sem órfã', orfas(pr9DepoisK, correcoesPr9K), '');
conf('a regra de antes perdia as duas (o defeito que a 1a conserta)', resumo(mapaDaVersaoAntiga(pr9Depois, correcoesPr9)),
  '1:MAT09-01:do_mapa 2:MAT09-02:do_mapa 3:MAT09-12:do_mapa 4:MAT09-07:do_mapa 5:MAT09-09:do_mapa');

// ------------------------------------------------------------------
secao('3. A chave confere o título');
const comChave = pdf([cap(1, 'Conjuntos', 1, 30, ['MAT09-01'], { chave: 'c1a2b' }), cap(2, 'Frações', 31, 60, ['MAT09-03'], { chave: 'c7f3a' })]);
const correcoesChave = { 2: corr('Frações', ['MAT09-04'], 'corrigiu', { n: 2, chave: 'c7f3a' }) };
const trocouTitulo = pdf([cap(1, 'Conjuntos numéricos', 1, 30, ['MAT09-01'], { chave: 'c1a2b' }),
  cap(2, 'Números racionais e frações', 31, 60, ['MAT09-03'], { chave: 'c7f3a' })]);
const r3 = resumo(B.mapaDoLivro(trocouTitulo, correcoesChave));
if (MODO === '--envenenado-chave-sem-titulo') {
  veneno('a chave levou a correção para o capítulo de outro título, calada', r3.indexOf('2:MAT09-04:corrigido') >= 0);
}
conf('a chave com o mesmo título vale (antes)', resumo(B.mapaDoLivro(comChave, correcoesChave)), '1:MAT09-01:do_mapa 2:MAT09-04:corrigido');
conf('a chave com o título diferente, fora da tabela de herança: NÃO aplica', r3, '1:MAT09-01:do_mapa 2:MAT09-03:do_mapa');
if (MODO !== '--envenenado-orfa-some') conf('e vira órfã com a sugestão do capítulo da chave', orfas(trocouTitulo, correcoesChave), '2=Frações->2');
const acentuou = pdf([cap(1, 'Introdução', 1, 10, []), cap(2, 'Conjuntos', 11, 30, ['MAT09-01'], { chave: 'c1a2b' }),
  cap(3, 'FRAÇÕES', 31, 60, ['MAT09-03'], { chave: 'c7f3a' })]);
conf('renumerado, com o título igual normalizado (caixa e acento), a chave aplica', resumo(B.mapaDoLivro(acentuou, correcoesChave)),
  '1::do_mapa 2:MAT09-01:do_mapa 3:MAT09-04:corrigido');
// o par antigo para novo da tabela de herança, com a mesma chave: aplica
const herdouComChave = pdf([cap(1, 'Conjuntos', 1, 30, ['MAT09-01'], { chave: 'c1a2b' })], {
  heranca_titulos: [{ titulo_antigo: 'GA_X_U1_001A030', titulo_novo: 'Conjuntos', pag_arquivo_inicio_antiga: 1 }] });
conf('chave com o par da tabela de herança (título antigo para o novo): aplica', resumo(B.mapaDoLivro(herdouComChave,
  { 1: corr('GA_X_U1_001A030', ['MAT09-02'], 'corrigiu', { chave: 'c1a2b' }) })), '1:MAT09-02:corrigido');
const chaveDupla = pdf([cap(1, 'A', 1, 10, [], { chave: 'c7f3a' }), cap(2, 'B', 11, 20, [], { chave: 'c7f3a' })]);
if (MODO !== '--envenenado-orfa-some') {
  conf('a mesma chave em duas entradas (mapa defeituoso): nenhuma, órfã sem sugestão', orfas(chaveDupla, correcoesChave), '2=Frações');
}

// ------------------------------------------------------------------
secao('4. O título só ganha acento, sem chave: sugestão, não aplicação');
const semAcento = { 2: corr('Fracoes  e   decimais', ['MAT06-06']) };
const comAcento = pdf([cap(1, 'Números naturais', 1, 10, ['MAT06-02']), cap(2, 'Geometria', 11, 20, []), cap(3, 'Frações e Decimais', 21, 30, ['MAT06-05'])]);
conf('nenhum capítulo muda', resumo(B.mapaDoLivro(comAcento, semAcento)), '1:MAT06-02:do_mapa 2::do_mapa 3:MAT06-05:do_mapa');
if (MODO !== '--envenenado-orfa-some') conf('a sugestão é o capítulo de mesmo título normalizado', orfas(comAcento, semAcento), '2=Fracoes  e   decimais->3');

// ------------------------------------------------------------------
secao('5. O capítulo sai do mapa: órfã, nunca no vizinho');
const saiu = pdf([cap(1, 'Números reais', 1, 40, ['MAT09-01']), cap(2, 'Potências e raízes', 41, 80, ['MAT09-02']),
  cap(3, 'Funções', 121, 160, ['MAT09-06'])]);
const correcoesSaiu = { 3: corr('Equações do 2º grau', ['MAT09-04']), 2: corr('Potências e raízes', ['MAT09-03']) };
const fotoSaiu = JSON.stringify(correcoesSaiu);
const r5 = resumo(B.mapaDoLivro(saiu, correcoesSaiu)), o5 = B.correcoesOrfas(saiu, correcoesSaiu);
conf('o capítulo 3 de agora (outro) não recebe a correção do que saiu', r5, '1:MAT09-01:do_mapa 2:MAT09-03:corrigido 3:MAT09-06:do_mapa');
if (MODO === '--envenenado-orfa-some') veneno('a correção do capítulo que saiu não aparece em lugar nenhum', o5.length === 0);
conf('ela é listada como órfã, com o que ela escolheu, sem sugestão', JSON.stringify(o5.map(o => [o.chave, o.titulo, o.assuntos.join('+'), o.acao, o.n, o.sugestao])),
  '[["3","Equações do 2º grau","MAT09-04","corrigiu",3,null]]');
conf('o db não mudou', JSON.stringify(correcoesSaiu), fotoSaiu);

// ------------------------------------------------------------------
secao('6. Título repetido');
const repetido = pdf([cap(1, 'Revisão', 1, 10, ['MAT09-01']), cap(2, 'Funções', 11, 40, ['MAT09-06']), cap(3, 'Revisão', 41, 50, ['MAT09-06'])]);
const correcoesRep = { 5: corr('Revisão', ['MAT09-11']) };
conf('dois "Revisão" no mapa novo: nenhum recebe', resumo(B.mapaDoLivro(repetido, correcoesRep)), '1:MAT09-01:do_mapa 2:MAT09-06:do_mapa 3:MAT09-06:do_mapa');
conf('e a órfã fica sem sugestão (não há um capítulo provável)', orfas(repetido, correcoesRep), '5=Revisão');
conf('a do mesmo número e título vale pela regra de antes, mesmo com o título repetido', resumo(B.mapaDoLivro(repetido, { 3: corr('Revisão', ['MAT09-02']) })),
  '1:MAT09-01:do_mapa 2:MAT09-06:do_mapa 3:MAT09-02:corrigido');
// o caso das lentes: o antigo tinha dois "Exercícios" (2 e 4), ela corrigiu o 4; o novo tem um só, o 2
const exAntigo = pdf([cap(1, 'Números', 1, 10, []), cap(2, 'Exercícios', 11, 20, ['MAT09-01']), cap(3, 'Funções', 21, 40, ['MAT09-06']),
  cap(4, 'Exercícios', 41, 50, ['MAT09-06'])]);
const exNovo = pdf([cap(1, 'Números', 1, 10, []), cap(2, 'Exercícios', 11, 20, ['MAT09-01']), cap(3, 'Funções', 21, 50, ['MAT09-06'])]);
const correcoesEx = { 4: corr('Exercícios', ['MAT09-07']) };
conf('controle: no mapa antigo ela vale no 4', resumo(B.mapaDoLivro(exAntigo, correcoesEx)),
  '1::do_mapa 2:MAT09-01:do_mapa 3:MAT09-06:do_mapa 4:MAT09-07:corrigido');
const r6 = resumo(B.mapaDoLivro(exNovo, correcoesEx));
if (MODO === '--envenenado-titulo-aplica-calado') veneno('a correção do segundo "Exercícios" caiu calada no primeiro', /2:MAT09-07:corrigido/.test(r6));
conf('no novo, com um "Exercícios" só: NÃO cai nele calada', r6, '1::do_mapa 2:MAT09-01:do_mapa 3:MAT09-06:do_mapa');
if (MODO !== '--envenenado-orfa-some') conf('fica órfã, com o "Exercícios" de agora como sugestão', orfas(exNovo, correcoesEx), '4=Exercícios->2');

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
const U8_7 = 'GA_MAT_7_LP_4ED_PNLD24_OB1_U8_278A307_FECHADO';
const u8ga7 = { 26: corr(U8_7, ['MAT06-12'], 'confirmou') };
const u8ga9 = { 26: corr('GA_MAT_9_LP_4ED_PNLD24_OB1_U8_282A307_FECHADO', ['MAT09-12'], 'confirmou') };
const r7a = resumo(B.mapaDoLivro(ga7, u8ga7)), r7b = resumo(B.mapaDoLivro(ga9, u8ga9));
console.log('   ga7: ' + r7a);
console.log('   ga9: ' + r7b);
if (MODO === '--envenenado-heranca-pelo-inicio') {
  veneno('a correção do volume caiu em "Medições" e em "Algumas grandezas"',
    r7a.indexOf('31:MAT06-12:confirmado') >= 0 && r7b.indexOf('29:MAT09-12:confirmado') >= 0);
}
conf('ga7: a correção cai no capítulo do volume (MAT06-12), e não em "Medições"', r7a,
  '30:MAT07-14:do_mapa 31:MAT07-12:do_mapa 32:MAT06-12:confirmado 33::do_mapa');
conf('ga9: a correção cai no capítulo do volume (MAT09-12), e não em "Algumas grandezas"', r7b,
  '28:MAT09-14:do_mapa 29:MAT09-13:do_mapa 30:MAT09-12:confirmado 31::do_mapa');
conf('a correção para o assunto de "Medições" cai em "Medições"', resumo(B.mapaDoLivro(ga7, { 26: corr(U8_7, ['MAT07-12']) })),
  '30:MAT07-14:do_mapa 31:MAT07-12:corrigido 32:MAT06-12:do_mapa 33::do_mapa');
conf('assunto que nenhum capítulo da faixa tem: órfã', orfas(ga7, { 26: corr(U8_7, ['MAT07-14']) }), '26=' + U8_7);
conf('"nenhum assunto do índice": órfã, e não "Medições"', orfas(ga7, { 26: corr(U8_7, []) }), '26=' + U8_7);
const doisNaFaixa = Object.assign({}, ga7, { mapa: ga7.mapa.map(e => e.n === 31 ? cap(31, 'Medições', 392, 405, ['MAT06-12']) : e) });
conf('dois capítulos da faixa com o mesmo assunto: órfã', orfas(doisNaFaixa, u8ga7), '26=' + U8_7);
conf('sem a tabela de herança no meta: órfã', orfas(Object.assign({}, ga7, { heranca_titulos: undefined }), u8ga7), '26=' + U8_7);
const naInteracao = Object.assign({}, ga7, { mapa: ga7.mapa.map(e => e.n === 32 ? cap(32, 'Volume e capacidade', 406, 421, []) :
  e.n === 33 ? cap(33, 'Interação: Vamos reciclar?', 422, 424, ['MAT06-12']) : e) });
conf('o assunto só na Interação (fora da faixa, p. 422): órfã', orfas(naInteracao, u8ga7), '26=' + U8_7);

// ------------------------------------------------------------------
secao('8. Gravar: a palavra nova nunca toma o lugar de outra correção');
// o app.js grava assim (gravarCorrecaoDoMapa): a chave de Biblioteca.chaveParaGravarCorrecao, com n e chave
const gravar = (meta, todas, n, ids, acao) => {
  const e = B.mapaDoLivro(meta, todas).filter(x => x.n === n)[0];
  const r = { titulo: e.titulo, assuntos: ids, acao, quando: '2026-11-12T20:00:00.000Z', n: e.n };
  if (e.chave) r.chave = e.chave;
  todas[B.chaveParaGravarCorrecao(todas, e)] = r;
};
const c8 = JSON.parse(JSON.stringify(correcoesPr9K));   // guardadas nos números de antes (3 e 4), com a chave
gravar(pr9DepoisK, c8, 3, ['MAT09-13'], 'corrigiu');   // o capítulo novo do meio, cujo número (3) guarda a de "Proporcionalidade"
if (MODO === '--envenenado-grava-por-cima') {
  veneno('a correção de "Proporcionalidade" foi apagada pela do capítulo novo', !Object.keys(c8).some(k => c8[k].titulo === 'Proporcionalidade'));
}
conf('a correção de "Proporcionalidade" continua no db, no 3', Object.keys(c8).filter(k => c8[k].titulo === 'Proporcionalidade').join(','), '3');
conf('a nova foi para uma chave nova do número 3, com a chave do capítulo', Object.keys(c8).sort().join(','), '3,3~k-círc,4');
conf('as três valem, cada uma no seu capítulo', resumo(B.mapaDoLivro(pr9DepoisK, c8)),
  '1:MAT09-01:do_mapa 2:MAT09-02:do_mapa 3:MAT09-13:corrigido 4:MAT09-08:corrigido 5:MAT09-09:confirmado');
gravar(pr9DepoisK, c8, 4, ['MAT09-07'], 'confirmou');   // a palavra nova sobre "Proporcionalidade", agora o 4
conf('a palavra nova sobre o 4 substitui a dela mesma, guardada no 3', JSON.stringify([c8['3'].titulo, c8['3'].acao, c8['3'].n, c8['4'].titulo]),
  '["Proporcionalidade","confirmou",4,"Semelhança"]');
conf('sem órfã', orfas(pr9DepoisK, c8) + '|' + Object.keys(c8).length, '|3');
// a órfã também não é tomada: o número dela guarda uma correção que não casou com nada
const comOrfa = { 2: corr('Um capítulo que saiu', ['MAT09-11']) };
conf('o número de uma órfã não é tomado', B.chaveParaGravarCorrecao(comOrfa, B.mapaDoLivro(saiu, comOrfa)[1]), '2~potencias-e-raizes');
const ocupada = { 3: corr('Outro', []), '3~circulo-e-cilindro': corr('Outro ainda', []) };
conf('a chave "<n>~..." ocupada leva a "<n>~...~2"', B.chaveParaGravarCorrecao(ocupada, B.mapaDoLivro(pr9Depois, ocupada)[2]), '3~circulo-e-cilindro~2');
conf('número livre: o número, como sempre foi', B.chaveParaGravarCorrecao({}, B.mapaDoLivro(comChave, {})[1]), '2');

// ------------------------------------------------------------------
secao('9. O tablet na versão antiga lendo as correções novas');
let quebrou = null, velho = '';
try { velho = resumo(mapaDaVersaoAntiga(pr9Antes, c8)); } catch (e) { quebrou = e.message; }
conf('a regra antiga lê as correções novas sem quebrar', quebrou, null);
// no mapa antigo (Proporcionalidade é o 3), a correção que o app novo regravou no "3" vale pelo número e título de lá
conf('no mapa antigo, a palavra nova de "Proporcionalidade" vale no 3 de lá, e a "3~..." é ignorada', velho,
  '1:MAT09-01:do_mapa 2:MAT09-02:do_mapa 3:MAT09-07:confirmado 4:MAT09-09:confirmado');

// ------------------------------------------------------------------
secao('10. Duas correções no mesmo capítulo: vence a mais recente');
const destino = pdf([cap(1, 'Números', 1, 10, []), cap(4, 'Proporcionalidade', 81, 221, ['MAT09-07'], { chave: 'kp' })]);
// A pela chave (o passo mais forte), mais velha; B pelo número e título, mais nova
const duas = { '9~a': corr('Proporcionalidade', ['MAT09-08'], 'corrigiu', { n: 9, chave: 'kp', quando: '2026-11-09T10:00:00.000Z' }),
  4: corr('Proporcionalidade', ['MAT09-10'], 'corrigiu', { quando: '2026-11-11T10:00:00.000Z' }) };
const r10 = resumo(B.mapaDoLivro(destino, duas));
if (MODO === '--envenenado-mais-forte-vence') veneno('venceu a mais velha, pela chave', r10.indexOf('4:MAT09-08:corrigido') >= 0);
conf('vence a mais recente (MAT09-10), mesmo vindo do passo mais fraco', r10, '1::do_mapa 4:MAT09-10:corrigido');
conf('a outra fica órfã, com o capítulo como sugestão, marcado ocupado', orfas(destino, duas), '9~a=Proporcionalidade->4*');
const iguais = { '9~a': corr('Proporcionalidade', ['MAT09-10'], 'corrigiu', { n: 9, chave: 'kp', quando: '2026-11-09T10:00:00.000Z' }),
  4: corr('Proporcionalidade', ['MAT09-10'], 'corrigiu', { quando: '2026-11-11T10:00:00.000Z' }) };
conf('a que diz o mesmo que a vencedora não aparece (nada a decidir) e não sai do db',
  resumo(B.mapaDoLivro(destino, iguais)) + '|' + orfas(destino, iguais) + '|' + B.resolverCorrecoes(destino, iguais).absorvidas.join(',') + '|' + Object.keys(iguais).length,
  '1::do_mapa 4:MAT09-10:corrigido||9~a|2');

if (MODO) conf('o veneno pedido foi visto pela seção dele', 'não visto', 'visto');
terminar();
