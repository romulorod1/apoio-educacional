/* testa_provas_tocadas.js
 *
 * Prova, sem navegador, a logica do nivel 1 do CI (provas_tocadas.js e
 * mapa_provas.tsv): dado o conjunto de arquivos tocados, quais provas de
 * navegador rodam. O que se garante:
 *   - todo arquivo rastreado tem prova, esta no mapa com "-" de proposito, ou
 *     cai na bateria inteira (nunca fica sem decisao);
 *   - nenhuma prova da lista some: cada uma, tocada, roda ela mesma, e todos os
 *     arquivos juntos pedem a bateria inteira;
 *   - as ligacoes do mapa apontam para provas que o portao tem;
 *   - as fatias do nivel 1 particionam a selecao (nenhuma prova em duas, nenhuma
 *     perdida);
 * e os controles que reprovam (arquivo fora do mapa, linha apagada, prova que
 * nao existe).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { leMapa, listaDoPortao, provasTocadas, daFatia, MAPA } = require('./provas_tocadas.js');

let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
const RAIZ = path.join(__dirname, '..');

console.log('\n=== 1. O instrumento ve ===');
const nav = listaDoPortao();
conf('o portao lista mais de 50 arquivos de prova de navegador', nav.arquivos.length > 50, true);
conf('e todos existem em disco', nav.arquivos.filter(a => !fs.existsSync(path.join(RAIZ, a))).length, 0);
const mapa = leMapa(fs.readFileSync(MAPA, 'utf8'));
conf('o mapa tem linhas', mapa.length > 20, true);
const rastreados = execFileSync('git', ['ls-files'], { cwd: RAIZ, encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
conf('o git lista os arquivos do repositorio', rastreados.length > 100, true);

console.log('\n=== 2. Toda ligacao do mapa aponta para prova que o portao tem ===');
const citadas = new Set();
mapa.forEach(l => l.provas.forEach(p => { if (p !== '-' && p !== '*') citadas.add(p); }));
conf('nenhuma prova do mapa fora do portao', [...citadas].filter(p => nav.arquivos.indexOf(p) < 0).join(' '), '');

console.log('\n=== 3. Todo arquivo do repositorio tem prova, "-" de proposito ou a bateria inteira ===');
const semDecisao = [];
rastreados.forEach(f => {
  if (nav.arquivos.indexOf(f) >= 0) return;
  const r = provasTocadas([f], mapa, nav);
  const casadas = mapa.filter(l => l.re.test(f));
  const semProva = r.modo === 'nenhuma' && casadas.some(l => l.provas[0] === '-');
  if (!(r.modo === 'inteira' || r.provas.length > 0 || semProva)) semDecisao.push(f);
});
conf('nenhum arquivo rastreado sem decisao', semDecisao.join(' '), '');
const sempre = ['app.js', 'store.js', 'nuvem.js', 'core.js', 'sw.js', 'index.html', 'styles.css'];
sempre.forEach(f => {
  const r = provasTocadas([f], mapa, nav);
  conf('arquivo central ' + f + ' roda provas de navegador (' + r.provas.length + ')', r.provas.length >= 5 && r.modo !== 'nenhuma', true);
});
conf('app.js roda o e2e, que abre o aplicativo inteiro', provasTocadas(['app.js'], mapa, nav).provas.indexOf('_teste/e2e.js') >= 0, true);
conf('sw.js roda a prova da atualizacao', provasTocadas(['sw.js'], mapa, nav).provas.indexOf('_teste/testa_atualizacao_apos_fechar.js') >= 0, true);

console.log('\n=== 4. Nenhuma prova da lista some ===');
const somem = [];
nav.arquivos.forEach(p => {
  const r = provasTocadas([p], mapa, nav);
  if (!(r.modo === 'lista' && r.provas.length === 1 && r.provas[0] === p)) somem.push(p);
});
conf('cada prova tocada roda a propria prova', somem.join(' '), '');
const todosJuntos = provasTocadas(rastreados, mapa, nav);
conf('todos os arquivos juntos pedem a bateria inteira', todosJuntos.provas.length + '/' + todosJuntos.modo, nav.arquivos.length + '/inteira');
conf('a bateria inteira e exatamente a lista do portao',
  todosJuntos.provas.slice().sort().join('\n'), nav.arquivos.slice().sort().join('\n'));
conf('prova de navegador mais um arquivo com mapa: a uniao, sem perder a propria',
  (() => { const r = provasTocadas(['_teste/testa_busca.js', 'busca.js'], mapa, nav); return r.provas.indexOf('_teste/testa_busca.js') >= 0 && r.provas.length > 1; })(), true);
conf('alem do mapa, toda prova do mapa existe entre as listadas', [...citadas].every(p => nav.arquivos.indexOf(p) >= 0), true);

console.log('\n=== 5. Casos de decisao ===');
let r = provasTocadas(['README.md'], mapa, nav);
conf('README nao pede prova de navegador', r.modo, 'nenhuma');
r = provasTocadas(['.github/workflows/portao.yml', '_teste/mapa_provas.tsv'], mapa, nav);
conf('workflow e mapa nao pedem prova de navegador', r.modo, 'nenhuma');
r = provasTocadas(['_teste/testa_merge_seguro.js'], mapa, nav);
conf('prova que nao abre navegador fica com o portao-rapido', r.modo, 'nenhuma');
r = provasTocadas(['_teste/confere_tudo.sh'], mapa, nav);
conf('mexer no portao pede a bateria inteira', r.modo, 'inteira');
r = provasTocadas(['_teste/testa_busca.js'], mapa, nav);
conf('prova de navegador tocada roda so ela', r.provas.join(','), '_teste/testa_busca.js');
r = provasTocadas([], mapa, nav);
conf('nada tocado, nada de navegador', r.modo, 'nenhuma');
r = provasTocadas(['busca.js'], mapa, nav);
conf('arquivo mapeado roda as provas do mapa e nao a bateria', r.modo === 'lista' && r.provas.length < nav.arquivos.length, true);
r = provasTocadas(['app.js', 'arquivo_novo_que_ninguem_mapeou.js'], mapa, nav);
conf('um arquivo fora do mapa leva a bateria inteira junto', r.modo + '/' + r.provas.length, 'inteira/' + nav.arquivos.length);
conf('caminho com barra invertida e ./ vale igual', provasTocadas(['.\\busca.js'], mapa, nav).provas.join(), provasTocadas(['busca.js'], mapa, nav).provas.join());

console.log('\n=== 6. Venenos: o controle tem de reprovar ===');
const semApp = mapa.filter(l => l.padrao !== 'app.js');
r = provasTocadas(['app.js'], semApp, nav);
conf('mapa sem a linha do app.js: o app.js cai na bateria inteira (nunca sem prova)', r.modo, 'inteira');
const mapaFalso = leMapa(fs.readFileSync(MAPA, 'utf8') + 'busca.js\t_teste/testa_que_nao_existe.js\n');
let erro = '';
try { provasTocadas(['busca.js'], mapaFalso, nav); } catch (e) { erro = e.message; }
conf('mapa que cita prova inexistente grita', /o mapa cita uma prova que o portao nao tem/.test(erro), true);
erro = '';
try { leMapa('app.js\n'); } catch (e) { erro = e.message; }
conf('linha sem tabulacao grita', /sem tabulacao/.test(erro), true);
erro = '';
try { leMapa('app.js\t- _teste/e2e.js\n'); } catch (e) { erro = e.message; }
conf('"-" misturado com prova grita', /valem sozinhos/.test(erro), true);

console.log('\n=== 7. As fatias do nivel 1 particionam a selecao ===');
const sel = provasTocadas(['app.js'], mapa, nav).provas;
const porFatia = [];
for (let k = 1; k <= 8; k++) porFatia.push(daFatia(sel, nav, k, 8));
const soma = [].concat.apply([], porFatia);
// o arquivo pode aparecer em mais de uma fatia: cada variante dele (nome do portao) e uma prova, e cai em uma so
conf('a uniao das 8 fatias e a selecao inteira', [...new Set(soma)].sort().join('\n'), sel.slice().sort().join('\n'));
conf('nenhuma fatia leva arquivo fora da selecao', soma.filter(p => sel.indexOf(p) < 0).length, 0);
const inteira = nav.arquivos;
const soma2 = [].concat.apply([], [1, 2, 3, 4, 5, 6, 7, 8].map(k => daFatia(inteira, nav, k, 8)));
conf('a bateria inteira, pelas 8 fatias, cobre todas as provas', new Set(soma2).size, inteira.length);

console.log('\n=== 8. O confere_tudo.sh --provas escolhe so as da lista ===');
const lista = path.join(require('os').tmpdir(), 'provas_tocadas_' + process.pid + '.txt');
fs.writeFileSync(lista, '_teste/testa_busca.js\n_teste/testa_cartao_navegador.js\n');
const listado = execFileSync('sh', [path.join(__dirname, 'confere_tudo.sh'), '--listar', '--provas', lista], { cwd: RAIZ, encoding: 'utf8' });
const arqs = listado.split(/\r?\n/).map(l => /^ {2}arq {5}\d+ (.*)$/.exec(l)).filter(Boolean).map(m => m[1]);
conf('o --listar --provas diz so as provas da lista', [...new Set(arqs)].sort().join(','),
  ['_teste/testa_busca.js', '_teste/testa_cartao_navegador.js'].filter(p => nav.arquivos.indexOf(p) >= 0).sort().join(','));
fs.writeFileSync(lista, '');
let codigo = 0;
try { execFileSync('sh', [path.join(__dirname, 'confere_tudo.sh'), '--provas', lista], { cwd: RAIZ, encoding: 'utf8', stdio: 'pipe' }); } catch (e) { codigo = e.status; }
conf('lista vazia sai com 2, e nao vira a bateria inteira calada', codigo, 2);
fs.rmSync(lista, { force: true });

console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
