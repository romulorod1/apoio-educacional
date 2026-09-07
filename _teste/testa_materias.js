/* A tabela de matérias é uma só, e as cópias têm que bater com ela.
 *
 * Existe porque o aplicativo tinha quatro vocabulários de matéria que não se
 * falavam (core.js, cartao.js, pdf.js e banco/topicos/indice.json), e foi
 * isso que deixou "matemática" escrita à mão em oito pontos do app.js. Enquanto
 * as cópias existirem, este teste é o que impede que voltem a divergir; quando
 * o cartao.js e o pdf.js passarem a ler o Core, as conferências deles viram
 * prova de que leem.
 *
 *   node _teste/testa_materias.js
 */
const fs = require('fs');
const path = require('path');
const RAIZ = path.join(__dirname, '..');
const Core = require(path.join(RAIZ, 'core.js'));

let passaram = 0, falharam = 0;
function conf(rotulo, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (ok) passaram++; else falharam++;
  console.log((ok ? '  OK    ' : '  FALHA ') + rotulo +
    (ok ? '' : '  [obtido: ' + JSON.stringify(obtido) + ' | esperado: ' + JSON.stringify(esperado) + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }
function le(rel) { return fs.readFileSync(path.join(RAIZ, rel), 'utf8'); }

/* Lê um objeto literal { chave: 'rótulo', ... } de dentro de um arquivo JS sem
 * executá-lo: o cartao.js e o pdf.js têm efeitos de módulo que não interessam
 * aqui, e o que se quer conferir é o TEXTO da cópia. */
function tabelaLiteral(texto, nomeDaVar) {
  const ini = texto.indexOf('var ' + nomeDaVar + ' = {');
  if (ini < 0) return null;
  const fim = texto.indexOf('};', ini);
  const corpo = texto.slice(ini, fim);
  const out = {};
  const rx = /^\s*'?([A-Za-z\-]+)'?:\s*'([^']*)'/gm;
  let m;
  while ((m = rx.exec(corpo))) out[m[1]] = m[2];
  return out;
}

const M = Core.MATERIAS;
const porId = {};
M.forEach(m => { porId[m.id] = m; });

secao('1. A tabela em si');
conf('todo id é único', new Set(M.map(m => m.id)).size, M.length);
conf('todo id é minúsculo sem acento', M.every(m => /^[a-z\-]+$/.test(m.id)), true);
conf('matemática existe, com escada e banco de temas', !!(porId.matematica && porId.matematica.escada && porId.matematica.temas), true);
conf('a raiz da matemática é o caminho legado, e nunca outra coisa', porId.matematica.temas.raiz, 'banco/');
conf('português e literatura têm banco declarado, só em pt',
  ['portugues', 'literatura'].map(id => porId[id] && porId[id].temas && porId[id].temas.linguas.join(',')), ['pt', 'pt']);
conf('matéria nova com banco nasce em banco/<id>/',
  Core.materiasComTemas().filter(m => m.id !== 'matematica').every(m => m.temas.raiz === 'banco/' + m.id + '/'), true);
conf('prefixos de tema são únicos', new Set(Core.materiasComTemas().map(m => m.temas.prefixo)).size, Core.materiasComTemas().length);
conf('nenhum prefixo é começo de outro (senão o dono do id fica ambíguo)',
  Core.materiasComTemas().every(a => Core.materiasComTemas().every(b => a === b || b.temas.prefixo.indexOf(a.temas.prefixo) !== 0)), true);
conf('toda matéria com banco tem pelo menos duas unidades com rótulo',
  Core.materiasComTemas().every(m => Object.keys(m.temas.unidades).length >= 2 && Object.values(m.temas.unidades).every(r => r && r.length > 2)), true);
conf('só matéria com citação liberada é a que tem texto de autor (por e lit)',
  Core.materiasComTemas().filter(m => m.temas.citacao).map(m => m.id), ['portugues', 'literatura']);

secao('2. O dono do identificador de tema');
conf('MAT07-12 é da matemática', (Core.materiaDoTema('MAT07-12') || {}).id, 'matematica');
conf('MATEM3-04 também', (Core.materiaDoTema('MATEM3-04') || {}).id, 'matematica');
conf('POR07-01 é do português', (Core.materiaDoTema('POR07-01') || {}).id, 'portugues');
conf('LITEM2-03 é da literatura', (Core.materiaDoTema('LITEM2-03') || {}).id, 'literatura');
conf('identificador de tópico (com -T) nunca é tema', Core.materiaDoTema('POR07-T12'), null);
conf('lixo não é de ninguém', Core.materiaDoTema('xyz'), null);

secao('3. A cópia para o Python é gerada, e bate');
const { execFileSync } = require('child_process');
let confere = '';
try {
  confere = execFileSync(process.execPath, [path.join(RAIZ, 'temas', '_ferramentas', 'exporta_materias.js'), '--confere'], { encoding: 'utf8' });
} catch (e) { confere = (e.stdout || '') + (e.stderr || ''); }
conf('materias.json bate com o core.js (senão: node temas/_ferramentas/exporta_materias.js)', /bate com o core\.js/.test(confere) && !/NAO bate/.test(confere), true);

secao('4. O catálogo de tópicos aponta para matérias da tabela');
const indice = JSON.parse(le('banco/topicos/indice.json'));
const chavesDoCatalogo = indice.disciplinas.map(d => d.chave);
const chavesDaTabela = M.filter(m => m.topicos).map(m => m.topicos);
conf('toda disciplina do catálogo é apontada por alguma matéria', chavesDoCatalogo.filter(c => chavesDaTabela.indexOf(c) < 0), []);
conf('toda chave de tópicos da tabela existe no catálogo', chavesDaTabela.filter(c => chavesDoCatalogo.indexOf(c) < 0), []);
indice.disciplinas.forEach(d => {
  const donas = M.filter(m => m.topicos === d.chave);
  if (donas.length === 1) {
    conf('rótulo de ' + d.chave + ' igual nos dois lados', donas[0].rotulo, d.nome);
  } else {
    conf(d.chave + ' é compartilhada por duas matérias, de propósito', donas.map(m => m.id), ['filosofia', 'sociologia']);
  }
});

secao('5. As cópias no cartao.js e no pdf.js não divergem do Core');
const cartao = tabelaLiteral(le('cartao.js'), 'DISCIPLINAS');
const pdf = tabelaLiteral(le('pdf.js'), 'MATERIAS_ROTULO');
conf('achei a tabela do cartão', !!cartao && Object.keys(cartao).length > 5, true);
conf('achei a tabela da folha', !!pdf && Object.keys(pdf).length > 5, true);
/* Para cada id que a cópia conhece, o rótulo tem que ser o do Core. A chave
 * composta 'filosofia-sociologia' do cartão é o legado do catálogo: aceita,
 * com o nome do catálogo. */
Object.keys(cartao || {}).forEach(id => {
  const esperado = porId[id] ? porId[id].rotulo
    : (id === 'filosofia-sociologia' ? 'Filosofia e Sociologia' : null);
  conf('cartão: ' + id, cartao[id], esperado);
});
Object.keys(pdf || {}).forEach(id => {
  conf('folha: ' + id, pdf[id], porId[id] ? porId[id].rotulo : null);
});
/* E toda matéria que chega ao cartão ou à folha precisa estar lá: a que tem
 * tópicos ou temas aparece em aula e em mapeamento. 'outra' fica de fora do
 * cartão de propósito (ele já trata o rótulo livre). */
const precisamEstar = M.filter(m => m.topicos || m.temas).map(m => m.id);
conf('cartão conhece toda matéria com tópicos ou temas (ou a chave composta dela)',
  precisamEstar.filter(id => !(cartao[id] || (porId[id].topicos && cartao[porId[id].topicos]))), []);
conf('folha conhece toda matéria com tópicos ou temas', precisamEstar.filter(id => !pdf[id]), []);

secao('6. O banco gerado não contradiz a tabela');
const bancoIndice = JSON.parse(le('banco/indice.json'));
conf('todo tema do índice de matemática é MAT e, se declarar matéria, é matematica',
  bancoIndice.temas.filter(t => !/^MAT/.test(t.id) || (t.materia && t.materia !== 'matematica')).map(t => t.id), []);
conf('toda unidade do índice existe na tabela da matemática',
  Array.from(new Set(bancoIndice.temas.map(t => t.unidade))).filter(u => !porId.matematica.temas.unidades[u]), []);

console.log('\n' + passaram + ' passaram, ' + falharam + ' falharam.');
process.exit(falharam ? 1 : 0);
