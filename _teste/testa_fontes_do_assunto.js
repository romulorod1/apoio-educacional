/* testa_fontes_do_assunto.js
 *
 * A T2 da frente "Listas de exercícios": a Biblioteca.fontesDoAssunto, a
 * função pura que diz, para UM assunto do índice, o que o aparelho tem de
 * teoria, lista de base, exercícios avulsos e OBMEP (a página do assunto do
 * formato B). Sem navegador: o acervo é o sintético das provas
 * (_pacote_sintetico.js: o 9º ano do Portal com teoria e lista de base, o
 * Banco de Questões do nível 2, a Mirim 2 e o ENEM), e o índice de assuntos é
 * o banco/topicos/matematica.json de verdade, que é só índice (sem material).
 *
 * O que prova:
 *   1. assunto com módulo (MAT09-04): a teoria do módulo na ordem das aulas, a
 *      lista de base, os 48 exercícios na ordem da fonte, todos pelo vínculo
 *      'modulo', com o abrir e o anexar de cada um;
 *   2. assunto com tema_app (MATEM3-11, cujo módulo não está no aparelho): as
 *      questões do ENEM chegam pelo tema_app; e, com o módulo apagado do
 *      índice, as da Mirim também;
 *   3. item em dois assuntos (MAT09-04 e MAT09-05; MAT02-02, MAT02-12 e
 *      MAT03-02): aparece nos dois, uma vez em cada, e o vínculo mais forte
 *      fica escrito quando o item chega por duas camadas;
 *   4. assunto vazio: o porquê numa linha (sem pacote, pacote ausente, sem
 *      vínculo), e a lista de base com exercício faltando não aparece;
 *   5. assunto de série sem livro (MAT04-09, 4º ano): a Mirim aparece, sem
 *      teoria e sem exercício avulso, e sem vazio;
 *   6. a tabela de vínculos da C1 (opcoes.vinculos) liga um problema do Banco
 *      ao assunto, pela camada 'curadoria'; e a linha do CSV da C1, no formato
 *      dele e com dados sintéticos, entra só com confiança alta ou média;
 *   7. pura: não mexe na entrada e dá o mesmo resultado duas vezes;
 *   8. O VENENO: o mesmo item repetido na entrada, e ligado ao assunto pelas
 *      três camadas, aparece UMA vez só;
 *   9. o ENEM separado da OBMEP (contrato da orquestradora, 13/11): `obmep`
 *      só com o Banco e a Mirim, `enem` só com o ENEM, e o tipo segue a fonte;
 *  10. o tempo: os 171 assuntos de matemática num acervo sintético do tamanho
 *      do real (cerca de 5.800 exercícios), com teto por assunto.
 *
 * Modos envenenados (cada um TEM de ser visto: "VENENO visto"):
 *   --envenenado-repete-item     a fontesDoAssunto perde a guarda do id já visto;
 *   --envenenado-enem-na-obmep   o ENEM volta a cair dentro da `obmep`;
 *   --envenenado-base-com-buraco a lista de base com exercício faltando aparece;
 *   --envenenado-muda-entrada    a função ordena a lista de itens que recebeu,
 *                                no lugar (mexe na entrada de quem chamou).
 *
 *   node _teste/testa_fontes_do_assunto.js [--envenenado-repete-item]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const Module = require('module');
const Sintetico = require('./_pacote_sintetico.js');

const RAIZ = path.join(__dirname, '..');
const VENENOS = ['--envenenado-repete-item', '--envenenado-enem-na-obmep', '--envenenado-base-com-buraco', '--envenenado-muda-entrada'];
const MODO = VENENOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';

let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + String(obtido).slice(0, 300) + ' | esperado: ' + esperado + ']'));
  return ok;
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

/* O biblioteca.js do repositório, com a troca do veneno, carregado como módulo
 * do próprio lugar (o require('./zip.js') de dentro acha o zip.js de verdade).
 * A troca tem de existir exatamente uma vez. */
const GUARDA = '      if (vistos[it.id]) return;\n';
function carregar(troca) {
  const caminho = path.join(RAIZ, 'biblioteca.js');
  let texto = fs.readFileSync(caminho, 'utf8').replace(/\r\n/g, '\n');
  if (troca) {
    if (!conf('o ponto do veneno existe uma vez no biblioteca.js', texto.split(troca[0]).length - 1, 1)) process.exit(1);
    texto = texto.split(troca[0]).join(troca[1]);
  }
  const m = new Module(caminho, module);
  m.filename = caminho;
  m.paths = Module._nodeModulePaths(path.dirname(caminho));
  m._compile(texto, caminho);
  return m.exports;
}
const TROCAS = {
  '--envenenado-repete-item': [GUARDA, ''],
  '--envenenado-enem-na-obmep': ["return fonte === 'enem' ? 'enem' : FONTES_DE_OLIMPIADA[fonte] ? 'obmep' : 'exercicio';",
    "return FONTES_DE_OLIMPIADA[fonte] ? 'obmep' : 'exercicio';"],
  '--envenenado-base-com-buraco': ["if (!ids.length || ids.some(function (x) { return typeof x !== 'string' || !itemPorId[x]; })) return;",
    'if (!ids.length) return;'],
  '--envenenado-muda-entrada': ['var itens = Array.isArray(o.itens) ? o.itens : [];',
    'var itens = Array.isArray(o.itens) ? o.itens.sort(function (a, b) { return a.id < b.id ? -1 : 1; }) : [];']
};
const Biblioteca = carregar(TROCAS[MODO] || null);
const F = Biblioteca.fontesDoAssunto;

// ------------------------------------------------------------------ o acervo sintético
const TEMAS = JSON.parse(fs.readFileSync(path.join(RAIZ, 'banco', 'topicos', 'matematica.json'), 'utf8')).temas;
const comPacote = (lista, pacote) => lista.map(it => Object.assign({ pacote }, it));
const portal = Sintetico.gerar(null, { listas: true, base: true });
const banco = Sintetico.gerarBanco(null);
const mirim1 = Sintetico.gerarProva(null, { serie: 'm1' });
const mirim2 = Sintetico.gerarProva(null, { serie: 'm2' });
const enem = Sintetico.gerarProva(null, { serie: '3em' });
const ITENS = [].concat(
  comPacote(portal.itens, portal.manifest.pacote), comPacote(banco.itens, banco.manifest.pacote),
  comPacote(mirim1.itens, mirim1.manifest.pacote), comPacote(mirim2.itens, mirim2.manifest.pacote),
  comPacote(enem.itens, enem.manifest.pacote));
const TEORIA = comPacote(portal.teoria, portal.manifest.pacote);
const LISTAS = [Sintetico.LISTA_BASE].concat(Sintetico.LISTAS);
const ACERVO = { temas: TEMAS, itens: ITENS, teoria: TEORIA, listas: LISTAS };

const MOD_EQ = '9ano:equacoes-do-segundo-grau';

/* Uma cópia profunda e congelada do acervo: com 'use strict' no
 * biblioteca.js, qualquer escrita na entrada lança erro. */
function congelada(o) {
  const c = JSON.parse(JSON.stringify(o));
  (function gela(x) { if (x && typeof x === 'object') { Object.values(x).forEach(gela); Object.freeze(x); } })(c);
  return c;
}
const ITENS_SEM_UM_DA_BASE = () => ITENS.filter(it => it.id !== Sintetico.LISTA_BASE.degraus[1].item);
function venenoVisto(rotulo, visto, detalhe) {
  secao('VENENO: ' + MODO);
  if (conf(MODO.slice(2) + ': ' + rotulo + ' (defeito detectado)', visto, true)) console.log('VENENO visto: ' + detalhe);
  console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
  process.exit(falhas ? 1 : 0);
}
if (MODO === '--envenenado-enem-na-obmep') {
  const r = F('MATEM3-11', ACERVO);
  venenoVisto('o ENEM caiu dentro da obmep', r.obmep.some(q => q.fonte === 'enem') && !(r.enem || []).length,
    r.obmep.length + ' questões do ENEM na obmep');
}
if (MODO === '--envenenado-base-com-buraco') {
  const r = F('MAT09-04', Object.assign({}, ACERVO, { itens: ITENS_SEM_UM_DA_BASE() }));
  venenoVisto('a lista de base com buraco apareceu', !!r.listaBase, 'lista ' + (r.listaBase && r.listaBase.id) + ' com um exercício faltando');
}
if (MODO === '--envenenado-muda-entrada') {
  let erro = null;
  try { F('MAT09-04', congelada(ACERVO)); } catch (e) { erro = e; }
  const copia = Object.assign({}, ACERVO, { itens: ITENS.slice().reverse() });
  const antes = JSON.stringify(copia.itens.map(it => it.id));
  F('MAT09-04', copia);
  const mexeu = JSON.stringify(copia.itens.map(it => it.id)) !== antes;
  venenoVisto('a função mexeu na entrada', !!erro && mexeu, 'na entrada congelada: ' + (erro && erro.message));
}
const ids = lista => lista.map(x => x.id);
const semRepetir = lista => new Set(ids(lista)).size === lista.length;

// ================================================================
secao('0. O índice de assuntos tem os vínculos que a prova usa');
const tema = id => TEMAS.filter(t => t.id === id)[0] || {};
conf('MAT09-04 e MAT09-05 apontam para o módulo das equações do 9º ano',
  tema('MAT09-04').modulo + ' | ' + tema('MAT09-05').modulo, MOD_EQ + ' | ' + MOD_EQ);
conf('MAT02-02, MAT02-12 e MAT03-02 apontam para o mesmo módulo da Mirim 1',
  [tema('MAT02-02').modulo, tema('MAT02-12').modulo, tema('MAT03-02').modulo].join(' | '),
  'm1:mirim-adicao-ate-100 | m1:mirim-adicao-ate-100 | m1:mirim-adicao-ate-100');
conf('MAT04-09 (4º ano, sem livro mapeado) aponta para a Mirim 2', tema('MAT04-09').modulo, 'm2:mirim-perimetro-e-area');
conf('MATEM3-11 aponta para um módulo que o acervo NÃO tem', tema('MATEM3-11').modulo, '2em:introducao-a-probabilidade');

// ================================================================
secao('1. Assunto com módulo: MAT09-04');
const eq = F('MAT09-04', ACERVO);
conf('o título e a série saem do índice', eq.titulo + ' | ' + eq.serie, 'Equação do 2º grau: como resolver | 09');
conf('a teoria: as 4 aulas do módulo, na ordem das aulas', eq.teoria.map(t => t.titulo).join(' | '),
  'Resultados Básicos - Parte I | Resultados Básicos - Parte II | Soma e Produto das Raízes | Equações Biquadradas');
conf('a quantidade da teoria é o número de páginas', eq.teoria.map(t => t.quantidade).join(','), '5,4,3,3');
conf('a teoria de outro módulo que cita "segundo grau" no título NÃO entra (o vínculo é exato)',
  eq.teoria.some(t => /Fatoração/.test(t.titulo)), false);
conf('a lista de base é a do módulo', eq.listaBase && eq.listaBase.id, Sintetico.LISTA_BASE.id);
conf('com os exercícios dela, na ordem dela', eq.listaBase && eq.listaBase.itens.join(','),
  Sintetico.LISTA_BASE.degraus.map(d => d.item).join(','));
conf('as listas prontas que não são de base NÃO viram lista de base', eq.listaBase && eq.listaBase.titulo, 'Lista de base');
conf('os exercícios avulsos: os 48 do módulo (40 e 8)', eq.exercicios.length, 48);
conf('na ordem da fonte: a lista 1 inteira, depois a 2', eq.exercicios.slice(38, 42).map(e => e.lista.n + ':' + e.numero).join(','),
  '1:39,1:40,2:1,2:2');
conf('todos pelo vínculo do módulo', eq.exercicios.every(e => e.vinculo === 'modulo'), true);
conf('sem OBMEP: nenhuma prova está ligada às equações', eq.obmep.length, 0);
conf('sem vazio', eq.vazio, null);
secao('1b. A forma de cada fonte: tipo, id, título, série, quantidade, abrir e anexar');
const todas = [].concat(eq.teoria, [eq.listaBase], eq.exercicios);
conf('toda fonte tem os campos do contrato',
  todas.every(x => x.tipo && x.id && typeof x.titulo === 'string' && x.titulo && x.serie && x.quantidade >= 1 && x.abrir && x.anexar), true);
const ex3 = eq.exercicios[2];
conf('o exercício diz como abrir hoje: a tela cheia, na lista da fonte', JSON.stringify(ex3.abrir),
  JSON.stringify({ como: 'visor', tipo: 'exercicio', modulo: MOD_EQ, lista: 'equacao-do-2o-grau-resultados-basicos', id: ex3.id }));
conf('e o que vai para o material', JSON.stringify(ex3.anexar), JSON.stringify({ tipo: 'itens', ids: [ex3.id] }));
conf('o recorte do enunciado, com o pacote, para o desenho', [ex3.imagem.pacote, ex3.imagem.caminho, ex3.imagem.medidas.largura_pt].join(' | '),
  'matematica-sintetico-9ano | assets/9ano/equacoes-do-segundo-grau/equacao-do-2o-grau-resultados-basicos/ex-03.svg | 262');
conf('a dificuldade do pacote e de onde ela vem', ex3.dificuldade + ' ' + ex3.dificuldadeOrigem, '1 proxy');
conf('o desafio é a dificuldade 3 do pacote', eq.exercicios.filter(e => e.desafio).every(e => e.dificuldade === 3) &&
  eq.exercicios.some(e => e.desafio), true);
conf('a objetiva vem marcada (os exercícios 3 e 6 da Soma e Produto)',
  eq.exercicios.filter(e => e.objetiva).map(e => e.lista.n + ':' + e.numero).join(','), '2:3,2:6');
const t1 = eq.teoria[0];
conf('a teoria abre na primeira página, na tela cheia', JSON.stringify(t1.abrir),
  JSON.stringify({ como: 'visor', tipo: 'teoria', id: t1.id, indice: 0 }));
conf('e leva todas as páginas da aula para o material', t1.anexar.tipo + ' ' + t1.anexar.ids.length, 'paginas 5');
conf('a lista de base abre como lista pronta e vai inteira para o material',
  eq.listaBase.abrir.como + ' ' + eq.listaBase.anexar.tipo + ' ' + eq.listaBase.anexar.ids.length, 'lista-pronta lista-pronta 3');

// ================================================================
secao('2. Assunto com tema_app');
const prob = F('MATEM3-11', ACERVO);
conf('MATEM3-11: as questões do ENEM chegam pelo tema_app', prob.enem.length + ' ' + prob.enem.map(q => q.vinculo).join(','),
  '3 tema_app,tema_app,tema_app');
conf('e são do ENEM, no grupo do ENEM, com o tipo da fonte', prob.enem.every(q => q.fonte === 'enem' && q.tipo === 'enem'), true);
conf('e nenhuma na obmep', prob.obmep.length, 0);
conf('a questão do ENEM sem solução vem dita', prob.enem.every(q => q.semSolucao), true);
conf('o título da questão de prova', prob.enem[0].titulo, 'Questão 136');
const semModulo = TEMAS.map(t => t.id === 'MAT04-09' ? Object.assign({}, t, { modulo: undefined }) : t);
const peri = F('MAT04-09', Object.assign({}, ACERVO, { temas: semModulo }));
conf('com o módulo apagado do índice, a Mirim de MAT04-09 chega pelo tema_app',
  peri.obmep.map(q => q.vinculo).join(','), 'tema_app,tema_app');

// ================================================================
secao('3. Item em dois assuntos: aparece nos dois, uma vez em cada');
const eq2 = F('MAT09-05', ACERVO);
conf('MAT09-04 e MAT09-05 têm os MESMOS 48 exercícios', ids(eq.exercicios).join() === ids(eq2.exercicios).join() && eq2.exercicios.length === 48, true);
conf('e a mesma teoria', ids(eq.teoria).join(), ids(eq2.teoria).join());
conf('uma vez em cada (MAT09-04)', semRepetir(eq.exercicios) && semRepetir(eq.teoria), true);
conf('uma vez em cada (MAT09-05)', semRepetir(eq2.exercicios) && semRepetir(eq2.teoria), true);
const ad = ['MAT02-02', 'MAT02-12', 'MAT03-02'].map(a => F(a, ACERVO));
conf('a adição da Mirim 1 nos três assuntos que apontam para o módulo', ad.map(x => x.obmep.length).join(','), '2,2,2');
conf('as mesmas questões nos três', ids(ad[0].obmep).join() === ids(ad[1].obmep).join() && ids(ad[1].obmep).join() === ids(ad[2].obmep).join(), true);
conf('MAT02-02: chega pelo módulo E pelo tema_app, e o vínculo escrito é o do módulo',
  ad[0].obmep.map(q => q.vinculo).join(','), 'modulo,modulo');
conf('a Diversos da Mirim (sem tema_app) não entra em assunto nenhum',
  ad.every(x => x.obmep.every(q => !/diversos/.test(q.modulo.chave))), true);

// ================================================================
secao('4. Assunto vazio: o porquê numa linha');
const fora = F('MAT07-01', ACERVO);
conf('MAT07-01 (o pacote do 7º ano não está): pacote ausente', fora.vazio && fora.vazio.motivo, 'pacote-ausente');
conf('e as quatro listas vazias', [fora.teoria.length, fora.listaBase, fora.exercicios.length, fora.obmep.length].join(','), '0,,0,0');
const semNada = F('XX99-99', ACERVO);
conf('assunto que não existe: sem vínculo', semNada.vazio && semNada.vazio.motivo, 'sem-vinculo');
const vazioDeTudo = F('MAT09-04', { temas: TEMAS });
conf('aparelho sem pacote nenhum: sem pacote', vazioDeTudo.vazio && vazioDeTudo.vazio.motivo, 'sem-pacote');
conf('a frase do vazio é uma linha, com acento e sem travessão',
  [fora, semNada, vazioDeTudo].every(x => x.vazio.texto && !/\n/.test(x.vazio.texto) && !/[\u2013\u2014]/.test(x.vazio.texto) && /[ãçáéíóú]/.test(x.vazio.texto)), true);
conf('sem argumento nenhum não quebra', JSON.stringify(Object.keys(F())), JSON.stringify(['assunto', 'titulo', 'serie', 'teoria', 'listaBase', 'exercicios', 'obmep', 'enem', 'vazio']));
const furada = F('MAT09-04', Object.assign({}, ACERVO, { itens: ITENS_SEM_UM_DA_BASE() }));
conf('a lista de base com um exercício que saiu do aparelho NÃO aparece (como no app)', furada.listaBase, null);

// ================================================================
secao('5. Assunto de série sem livro: MAT04-09, 4º ano');
const p4 = F('MAT04-09', ACERVO);
conf('a Mirim 2 aparece, pelo módulo', p4.obmep.length + ' ' + p4.obmep.map(q => q.vinculo).join(','), '2 modulo,modulo');
conf('sem teoria, sem lista de base e sem exercício avulso', [p4.teoria.length, p4.listaBase, p4.exercicios.length].join(','), '0,,0');
conf('e não é vazio', p4.vazio, null);
conf('a série de cada questão é a do pacote (m2)', p4.obmep.every(q => q.serie === 'm2'), true);

// ================================================================
secao('6. A tabela de vínculos da C1 entra por opcoes.vinculos');
const BANCO_EQ = 'banco:2020:n2:4';
const comC1 = F('MAT09-04', Object.assign({}, ACERVO, { vinculos: [
  { assunto: 'MAT09-04', item: BANCO_EQ },
  { assunto: 'MAT09-04', modulo: 'm1:mirim-multiplicacao-a-ideia-e-a-tabuada' },
  { assunto: 'MAT05-07', item: 'banco:2019:n2:1' }
] }));
conf('o problema do Banco ligado pela tabela entra na OBMEP, pela curadoria',
  comC1.obmep.filter(q => q.id === BANCO_EQ).map(q => q.vinculo + ' | ' + q.titulo).join(), 'curadoria | Problema 4: As raízes escondidas');
conf('o módulo ligado pela tabela traz as questões dele', comC1.obmep.filter(q => /multiplicacao/.test(q.modulo.chave)).length, 2);
conf('a Mirim vem antes do Banco', comC1.obmep.map(q => q.fonte).join(','), 'obmep-mirim,obmep-mirim,obmep-banco');
conf('a linha de outro assunto não entra', comC1.obmep.some(q => q.id === 'banco:2019:n2:1'), false);
conf('o resto não muda', comC1.exercicios.length + ' ' + comC1.teoria.length, '48 4');
// as linhas do vinculos-exercicios-C1.csv como estão (pacote;item_id;ano;assuntos;confianca;justificativa),
// com dados sintéticos: a tabela de verdade fica no Drive e não entra no repositório
const LINHA = (item, assuntos, confianca) => ({ pacote: 'matematica-sintetico-banco-n2', item_id: item, ano: '9º ano',
  assuntos, confianca, justificativa: 'linha sintética da prova' });
const csv = F('MAT09-04', Object.assign({}, ACERVO, { vinculos: [
  LINHA('banco:2020:n2:1', 'MAT05-07|MAT09-04', 'alta'),
  LINHA('banco:2020:n2:2', 'MAT09-04', 'média'),
  LINHA('banco:2020:n2:3', 'MAT09-04', 'baixa'),
  LINHA('banco:2020:n2:5', '', 'alta'),
  LINHA('banco:2020:n2:6', 'MAT09-05', 'alta')
] }));
conf('na linha da C1, alta e média entram, inclusive como segundo assunto', ids(csv.obmep).join(','), 'banco:2020:n2:1,banco:2020:n2:2');
conf('a baixa, a sem assunto e a de outro assunto ficam fora', csv.obmep.some(q => /:(3|5|6)$/.test(q.id)), false);
conf('e entram pela curadoria', csv.obmep.map(q => q.vinculo).join(','), 'curadoria,curadoria');

// ================================================================
secao('6b. As bordas: cópias por camadas diferentes, Diversos, ENEM neutro, teoria sem página, tabelas');
const outraCopia = Object.assign({}, ITENS[0], { serie: '8ano', modulo: { slug: 'z', titulo: 'Outro' }, tema_app: 'MAT09-04' });
const ida = F('MAT09-04', Object.assign({}, ACERVO, { itens: [outraCopia].concat(ITENS) }));
const volta = F('MAT09-04', Object.assign({}, ACERVO, { itens: ITENS.concat([outraCopia]) }));
const daCopia = r => r.exercicios.filter(e => e.id === ITENS[0].id).map(e => e.vinculo + ' ' + e.modulo.chave).join();
conf('o mesmo id por duas camadas: fica a mais forte, em qualquer ordem da entrada', daCopia(ida) + ' | ' + daCopia(volta),
  'modulo ' + MOD_EQ + ' | modulo ' + MOD_EQ);
const diversos = mirim2.itens.filter(q => /diversos/.test(q.modulo.slug))[0];
const comTemaNoDiversos = Object.assign({ pacote: 'x' }, diversos, { tema_app: 'MAT04-09' });
const p4d = F('MAT04-09', Object.assign({}, ACERVO, { itens: ITENS.filter(it => it.id !== diversos.id).concat([comTemaNoDiversos]) }));
conf('questão de prova no Diversos não entra pelo tema_app (a regra do eDiversos)', p4d.obmep.some(q => q.id === diversos.id), false);
const p4c = F('MAT04-09', Object.assign({}, ACERVO, { vinculos: [{ assunto: 'MAT04-09', item: diversos.id }] }));
conf('mas entra pela linha da tabela que cita o item (é o que a C1 faz)', p4c.obmep.filter(q => q.id === diversos.id).map(q => q.vinculo).join(), 'curadoria');
conf('o ENEM com a dificuldade neutra não ganha dificuldade', prob.enem.every(q => q.dificuldade === null && q.dificuldadeNeutra && !q.desafio), true);
const p4g = F('MAT04-09', ACERVO);
conf('a Mirim, graduada, ganha', p4g.obmep.every(q => q.dificuldade >= 1 && !q.dificuldadeNeutra), true);
const semPagina = Object.assign({}, TEORIA[0], { id: TEORIA[0].id + '-vazia', paginas: [] });
conf('aula de teoria sem página não aparece', F('MAT09-04', Object.assign({}, ACERVO, { teoria: TEORIA.concat([semPagina]) })).teoria.length, 4);
const estranho = Object.assign({}, banco.itens[1], { pacote: 'x', fonte: 'constructor' });
const tab = F('MAT09-04', Object.assign({}, ACERVO, { itens: ITENS.filter(it => it.id !== estranho.id).concat([estranho]),
  vinculos: [{ item_id: 'banco:2020:n2:1', assuntos: 'MAT09-04', confianca: 'constructor' },
    { assunto: 'MAT09-04', item: estranho.id }] }));
conf('a confiança "constructor" não entra (tabela sem herança)', tab.obmep.some(q => q.id === 'banco:2020:n2:1'), false);
conf('a fonte "constructor" não vira OBMEP', tab.exercicios.some(e => e.id === estranho.id) && !tab.obmep.some(q => q.id === estranho.id), true);
const nulo = F('MAT09-04', Object.assign({}, ACERVO, { vinculos: [{ assunto: null, item_id: 'banco:2020:n2:3', assuntos: 'MAT09-04', confianca: 'alta' }] }));
conf('a linha com assunto nulo e assuntos preenchido vale (leitor de CSV que preenche com null)', nulo.obmep.some(q => q.id === 'banco:2020:n2:3'), true);
const semIndice = F('MAT09-04', Object.assign({}, ACERVO, { temas: [] }));
conf('sem o índice de assuntos, o vazio diz isso, e não que não há nada', semIndice.vazio && semIndice.vazio.motivo, 'sem-indice');
const renomeado = TEMAS.map(t => t.id === 'MAT09-04' ? Object.assign({}, t, { modulo: '9ano:chave-antiga' }) : t);
const eqv = F('MAT09-04', Object.assign({}, ACERVO, { temas: renomeado, modulosEquivalentes: [MOD_EQ] }));
conf('o módulo de mesmo título que o app achou entra pela camada do módulo', eqv.exercicios.length + ' ' + eqv.exercicios[0].vinculo, '48 modulo');
conf('sem ele, a chave que não está no aparelho dá pacote ausente', (F('MAT09-04', Object.assign({}, ACERVO, { temas: renomeado })).vazio || {}).motivo, 'pacote-ausente');

// ================================================================
secao('7. Pura: não mexe na entrada e repete o resultado');
const antes = JSON.stringify(ACERVO);
const r1 = JSON.stringify(F('MAT09-04', ACERVO)), r2 = JSON.stringify(F('MAT09-04', ACERVO));
conf('a entrada ficou igual', JSON.stringify(ACERVO) === antes, true);
conf('duas chamadas, o mesmo resultado', r1 === r2, true);
const embaralhado = Object.assign({}, ACERVO, { itens: ITENS.slice().reverse(), teoria: TEORIA.slice().reverse() });
conf('a ordem da entrada não muda a ordem da saída', JSON.stringify(F('MAT09-04', embaralhado)) === r1, true);
let erroCongelada = null, rCongelada = null;
try { rCongelada = JSON.stringify(F('MAT09-04', congelada(ACERVO))); } catch (e) { erroCongelada = e.message; }
conf('com a entrada inteira congelada, nada é escrito nela e o resultado é o mesmo', erroCongelada || (rCongelada === r1), true);

// ================================================================
secao('8. O veneno: o mesmo item repetido aparece UMA vez só');
const alvo = Object.assign({}, ITENS[0], { tema_app: 'MAT09-04' });   // o 1º exercício das equações
// o MESMO objeto duas vezes (a guarda do id já visto) e mais uma cópia (a escolha da cópia mais forte)
const repetido = Object.assign({}, ACERVO, {
  itens: [alvo].concat(ITENS.slice(1), [alvo, Object.assign({}, alvo)]),
  vinculos: [{ assunto: 'MAT09-04', item: alvo.id }, { assunto: 'MAT09-04', item: alvo.id }]
});
const rep = F('MAT09-04', repetido);
const vezes = rep.exercicios.filter(e => e.id === alvo.id).length;
if (MODO === '--envenenado-repete-item') {
  secao('VENENO: sem a guarda do id já visto');
  if (conf('envenenado: o item repetido aparece mais de uma vez (defeito detectado)', vezes > 1, true)) {
    console.log('VENENO visto: o exercício ' + alvo.id + ' apareceu ' + vezes + ' vezes no mesmo assunto.');
  }
} else {
  conf('o item ligado por três camadas e repetido três vezes na entrada aparece uma vez', vezes, 1);
  conf('pelo vínculo mais forte, o do módulo', rep.exercicios.filter(e => e.id === alvo.id)[0].vinculo, 'modulo');
  conf('e o assunto continua com 48 exercícios', rep.exercicios.length, 48);
}

// ================================================================
if (!MODO) {
  secao('9. O ENEM separado da OBMEP, em todos os assuntos');
  const comTabela = Object.assign({}, ACERVO, { vinculos: [{ assunto: 'MATEM3-11', item: 'banco:2019:n2:1' }] });
  const todos = TEMAS.map(t => F(t.id, comTabela));
  conf('a obmep só traz Banco e Mirim, com o tipo obmep',
    todos.every(r => r.obmep.every(q => (q.fonte === 'obmep-banco' || q.fonte === 'obmep-mirim') && q.tipo === 'obmep')), true);
  conf('o enem só traz o ENEM, com o tipo enem', todos.every(r => r.enem.every(q => q.fonte === 'enem' && q.tipo === 'enem')), true);
  const m311 = F('MATEM3-11', comTabela);
  conf('no mesmo assunto, os dois grupos lado a lado', m311.obmep.length + ' OBMEP e ' + m311.enem.length + ' ENEM', '1 OBMEP e 3 ENEM');
  conf('e ninguém nos dois', m311.obmep.some(q => m311.enem.some(e => e.id === q.id)), false);

  // ================================================================
  secao('10. O tempo: os 171 assuntos num acervo do tamanho do real');
  /* O acervo grande é feito aqui, de um exercício e uma aula de teoria do
   * sintético: 34 exercícios e uma aula por assunto, no módulo dele, cerca de
   * 5.800 exercícios (o acervo real tinha 5.539 em 12/11). */
  const ex = ITENS[0], te = TEORIA[0], grandes = [], aulas = [];
  TEMAS.forEach((t, ti) => {
    const k = t.modulo || ('9ano:sem-modulo-' + ti);
    const [serie, slug] = k.split(':');
    for (let n = 1; n <= 34; n++) {
      grandes.push(Object.assign({}, ex, { id: k + ':lista:ex:' + n + ':' + ti, serie, modulo: { slug, titulo: 'Módulo ' + ti },
        aula: { slug: 'lista-' + (n % 3), titulo: 'Lista', n: n % 3 }, numero: n, tema_app: n % 7 ? null : t.id }));
    }
    aulas.push(Object.assign({}, te, { id: k + ':aula:teo:' + ti, serie, modulo: { slug, titulo: 'Módulo ' + ti } }));
  });
  const grande = { temas: TEMAS, itens: grandes, teoria: aulas, listas: LISTAS };
  TEMAS.slice(0, 5).forEach(t => F(t.id, grande));   // aquece o JIT
  const tempos = TEMAS.map(t => {
    const t0 = process.hrtime.bigint();
    F(t.id, grande);
    return Number(process.hrtime.bigint() - t0) / 1e6;
  });
  const total = tempos.reduce((a, b) => a + b, 0), maior = Math.max.apply(null, tempos);
  console.log('   ' + grandes.length + ' exercícios: ' + total.toFixed(1) + ' ms nos ' + TEMAS.length + ' assuntos, ' +
    (total / TEMAS.length).toFixed(2) + ' ms por assunto, o mais lento ' + maior.toFixed(2) + ' ms');
  /* O TETO: medido em 13/11 nesta máquina, 1,6 ms por assunto. O tablet é
   * umas 5 a 10 vezes mais lento que um PC; 25 ms por assunto (um quadro e
   * meio de tela) deixa a folga para isso e para a máquina do CI ocupada. */
  conf('o acervo grande tem o tamanho do real', grandes.length > 5000, true);
  conf('cada assunto sai em média em até 25 ms', total / TEMAS.length <= 25, true);
  conf('e nenhum passa de 100 ms', maior <= 100, true);
}

console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
