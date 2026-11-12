/* testa_ordem_versao.js
 *
 * A regra do merge para VERSAO, CACHE e NOVIDADES depois do 13f (12/11/2026).
 *
 * Até o 13f o PR subia VERSAO e CACHE, e a regra (#173) exigia que fossem
 * MAIORES que os da main. Todos os PRs editavam as mesmas linhas, e cada merge
 * deixava os outros em conflito. Agora os dois são gerados na publicação
 * (_teste/versao_publicada.js) e ficam FIXOS no repositório. A regra é
 * decidirPublicacao() e lerPublicacaoGit() do _teste/merge_seguro.js, usada aqui
 * e no merge (lá, contra a origin/main buscada na hora):
 *   1. VERSAO e CACHE da árvore do merge IGUAIS aos da main;
 *   2. o PR que leva arquivo que sobe ao site traz novidades/<nome>.txt, novo ou
 *      mudado (itens, ou só "#" para dizer que não há novidade para ela);
 *   3. em novidades/ só <nome>.txt direto na pasta, e nenhum vazio.
 * O que o PR leva sai do diff da main contra a árvore do merge (git merge-tree),
 * e não da base do merge.
 *
 *   node _teste/testa_ordem_versao.js                          a prova (tabela e repo de mentira)
 *   node _teste/testa_ordem_versao.js --envenenado-sem-novidade
 *        a regra sem a exigência da novidade: os casos de "muda o app sem
 *        novidade" TÊM de sair errados ("VENENO visto")
 *   node _teste/testa_ordem_versao.js --envenenado-versao-livre
 *        a regra antiga, que deixava o PR mexer na VERSAO e no CACHE: os casos de
 *        constante mudada TÊM de sair errados
 *   node _teste/testa_ordem_versao.js --conferir               a conferência do repositório:
 *        o HEAD (commitado) contra a origin/main, pela árvore do merge.
 *        Saída 0 passou, 1 reprovou, 2 sem main para comparar.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const M = require('./merge_seguro.js');

const MODOS = ['--envenenado-sem-novidade', '--envenenado-versao-livre', '--conferir'];
const desconhecidos = process.argv.slice(2).filter(a => MODOS.indexOf(a) < 0);
const SEM_NOVIDADE = process.argv.indexOf('--envenenado-sem-novidade') >= 0;
const VERSAO_LIVRE = process.argv.indexOf('--envenenado-versao-livre') >= 0;
const VENENO = SEM_NOVIDADE || VERSAO_LIVRE;

/* A regra, ou o veneno pedido. Os venenos tiram uma exigência de cada vez. */
function decidir(v) {
  const d = M.decidirPublicacao(v);
  if (!VENENO) return d;
  const recusas = d.recusas.filter(r => !(SEM_NOVIDADE && /nao traz novidades/.test(r)) && !(VERSAO_LIVRE && /mudou no PR/.test(r)));
  return { ok: !recusas.length, motivos: d.motivos, recusas };
}

/* A conferência de verdade. RAIZ é a pasta do repositório (a prova troca por
 * um repositório de mentira, para exercitar ESTE caminho, e não uma cópia). */
function conferir(raiz, env) {
  // maxBuffer largo: o app.js passa de 1 MB, e o padrão do node estoura calado.
  const g = args => execFileSync('git', args, { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024, env: env || process.env });
  const tenta = args => { try { return g(args).trim(); } catch (e) { return ''; } };
  const main = tenta(['rev-parse', '--verify', '-q', 'origin/main']) || tenta(['rev-parse', '--verify', '-q', 'main']);
  if (!main) {
    return { codigo: 2, linhas: ['  INSTAVEL versao no deploy        sem origin/main nem main para comparar'] };
  }
  let d;
  try {
    d = decidir(M.lerPublicacaoGit(g, 'HEAD', main));
  } catch (e) {
    return { codigo: 1, linhas: ['  FALHOU  versao no deploy         nao consegui ler o que o PR leva: ' + String(e.stderr || e.message).split('\n')[0]] };
  }
  const linhas = d.motivos.map(m => '  ok      ' + 'versao no deploy'.padEnd(24) + ' ' + m)
    .concat(d.recusas.map(m => '  FALHOU  ' + 'versao no deploy'.padEnd(24) + ' ' + m));
  return { codigo: d.ok ? 0 : 1, linhas };
}

if (process.argv.indexOf('--conferir') >= 0) {
  if (desconhecidos.length) { console.log('opcao desconhecida: ' + desconhecidos.join(' ')); process.exit(2); }
  const r = conferir(path.join(__dirname, '..'));
  r.linhas.forEach(l => console.log(l));
  process.exit(r.codigo);
}

let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
conf('nenhuma opcao desconhecida foi pedida (' + (desconhecidos.join(' ') || 'nenhuma') + ')', desconhecidos.length, 0);

console.log('\n=== 1. Leitura das constantes ===');
conf('le o CACHE do sw.js', M.lerCache("x\r\nvar CACHE = 'apoio-educacional-v134';\r\n"), 'apoio-educacional-v134');
conf('le a VERSAO do app.js', M.lerVersao("(function () {\n  var VERSAO = '1.42.53';\n  var VERSAO_MINIMA = '1.0.0';\n"), '1.42.53');
conf('DUAS declaracoes de CACHE recusam (null)', M.lerCache("var CACHE = 'apoio-educacional-v134';\nvar CACHE = 'apoio-educacional-v130';\n"), null);
conf('let CACHE depois do var conta como segunda declaracao', M.lerCache("var CACHE = 'apoio-educacional-v134';\n  let CACHE = 'x';\n"), null);
conf('DUAS declaracoes de VERSAO recusam (null)', M.lerVersao("  var VERSAO = '1.42.53';\n  var VERSAO = '1.42.60';\n"), null);
conf('controle: declaracao em comentario nao conta', M.lerCache("// var CACHE = 'velho';\nvar CACHE = 'apoio-educacional-v134';\n"), 'apoio-educacional-v134');

const VENENO_NOME = SEM_NOVIDADE ? 'sem a novidade' : VERSAO_LIVRE ? 'versao livre' : '';
console.log('\n=== 2. A tabela, dos dois lados' + (VENENO ? ' (ENVENENADA: ' + VENENO_NOME + ')' : '') + ' ===');
const mud = (...l) => l.map(x => typeof x === 'string' ? { estado: 'M', caminho: x } : x);
const add = c => ({ estado: 'A', caminho: c });
const del = c => ({ estado: 'D', caminho: c });
const fixo = { versao: { agora: '1.42.61', main: '1.42.61' }, cache: { agora: 'apoio-educacional-v141', main: 'apoio-educacional-v141' } };
const caso = (mudancas, novidades, outro) => Object.assign({ mudancas, novidades: novidades || {} }, fixo, outro || {});
const NOV = 'novidades/f6-janela.txt';
// [rotulo, v, esperado, qual veneno o erra]
const TABELA = [
  ['muda o app.js e traz novidade: passa', caso(mud('app.js', add(NOV)), { [NOV]: 'Na aula, a janela abre em duas colunas.\n' }), 'passa'],
  ['muda o app.js sem novidade: recusa', caso(mud('app.js')), 'reprova', 'sem'],
  ['muda so o banco (sobe ao site) sem novidade: recusa', caso(mud('banco/topicos/fisica.json')), 'reprova', 'sem'],
  ['muda o sw.js (lista) sem novidade: recusa', caso(mud('sw.js')), 'reprova', 'sem'],
  ['apaga arquivo do site sem novidade: recusa', caso([del('figuras/velha.js')]), 'reprova', 'sem'],
  ['muda o app com novidade so de comentario (nada para ela): passa', caso(mud('app.js', add('novidades/x.txt')), { 'novidades/x.txt': '# refatoracao, nada muda para ela\n' }), 'passa'],
  ['so EDITAR uma novidade antiga nao vale: recusa', caso(mud('styles.css', 'novidades/x.txt'), { 'novidades/x.txt': 'item\n' }), 'reprova', 'sem'],
  ['editar uma antiga e trazer uma nova: passa', caso(mud('styles.css', 'novidades/x.txt', add(NOV)), { 'novidades/x.txt': 'item\n', [NOV]: 'novo\n' }), 'passa'],
  ['novidade vazia: recusa', caso(mud('app.js', add(NOV)), { [NOV]: '\n  \n' }), 'reprova'],
  ['novidade fora de .txt: recusa', caso(mud('app.js', add(NOV), add('novidades/x.md')), { [NOV]: 'item\n' }), 'reprova'],
  ['novidade em subpasta: recusa', caso(mud('app.js', add(NOV), add('novidades/a/b.txt')), { [NOV]: 'item\n' }), 'reprova'],
  ['so apagar a novidade nao vale como novidade: recusa', caso(mud('app.js', del(NOV))), 'reprova', 'sem'],
  ['PR so de prova e CI, sem novidade: passa', caso(mud('_teste/testa_x.js', '.github/workflows/portao.yml', 'README.md')), 'passa'],
  ['PR so de prova que traz novidade: passa', caso(mud('_teste/testa_x.js', add(NOV)), { [NOV]: 'item\n' }), 'passa'],
  ['PR que muda a VERSAO: recusa', caso(mud('app.js', add(NOV)), { [NOV]: 'item\n' }, { versao: { agora: '1.42.62', main: '1.42.61' } }), 'reprova', 'livre'],
  ['PR que muda o CACHE: recusa', caso(mud('sw.js', add(NOV)), { [NOV]: 'item\n' }, { cache: { agora: 'apoio-educacional-v142', main: 'apoio-educacional-v141' } }), 'reprova', 'livre'],
  ['PR que BAIXA a VERSAO, so de prova: recusa', caso(mud('_teste/x.js'), {}, { versao: { agora: '1.42.60', main: '1.42.61' } }), 'reprova', 'livre'],
  ['VERSAO ilegivel (null): recusa', caso(mud('_teste/x.js'), {}, { versao: { agora: null, main: '1.42.61' } }), 'reprova'],
  // A TRANSICAO (a main sem o gerador: o merge do proprio 13f): vale a regra antiga, MAIORES.
  ['transicao: VERSAO e CACHE maiores, com novidade: passa', caso(mud('app.js', add(NOV)), { [NOV]: '# nada\n' }, { transicao: true,
    versao: { agora: '1.42.69', main: '1.42.63' }, cache: { agora: 'apoio-educacional-v149', main: 'apoio-educacional-v143' } }), 'passa'],
  ['transicao: VERSAO igual a da main: recusa', caso(mud('app.js', add(NOV)), { [NOV]: '# nada\n' }, { transicao: true,
    versao: { agora: '1.42.63', main: '1.42.63' }, cache: { agora: 'apoio-educacional-v149', main: 'apoio-educacional-v143' } }), 'reprova'],
  ['transicao: VERSAO 1.42.9 contra 1.42.10 (numero): recusa', caso(mud('app.js', add(NOV)), { [NOV]: '# nada\n' }, { transicao: true,
    versao: { agora: '1.42.9', main: '1.42.10' }, cache: { agora: 'apoio-educacional-v149', main: 'apoio-educacional-v143' } }), 'reprova'],
  ['transicao: CACHE v99 contra v143 (numero): recusa', caso(mud('app.js', add(NOV)), { [NOV]: '# nada\n' }, { transicao: true,
    versao: { agora: '1.42.69', main: '1.42.63' }, cache: { agora: 'apoio-educacional-v99', main: 'apoio-educacional-v143' } }), 'reprova'],
  ['transicao: maiores mas sem novidade: recusa', caso(mud('app.js'), {}, { transicao: true,
    versao: { agora: '1.42.69', main: '1.42.63' }, cache: { agora: 'apoio-educacional-v149', main: 'apoio-educacional-v143' } }), 'reprova', 'sem']
];
const errados = [];
TABELA.forEach(([rot, v, esp]) => {
  const obtido = decidir(v).ok ? 'passa' : 'reprova';
  if (VENENO) { if (obtido !== esp) errados.push(rot); }
  else conf(rot, obtido, esp);
});
if (VENENO) {
  const qual = SEM_NOVIDADE ? 'sem' : 'livre';
  const deviam = TABELA.filter(t => t[3] === qual).map(t => t[0]);
  deviam.forEach(rot => conf('VENENO visto: com a regra ' + VENENO_NOME + ', "' + rot + '" sai errado', errados.indexOf(rot) >= 0, true));
  conf('e nenhum outro caso muda', errados.filter(r => deviam.indexOf(r) < 0).join(' | '), '');
}
if (!VENENO) {
  const d = M.decidirPublicacao(caso(mud('app.js')));
  conf('o motivo diz o que leva e pede a novidade', d.recusas.some(r => /leva app\.js/.test(r) && /novidades\/<nome>\.txt/.test(r)), true);
  const d2 = M.decidirPublicacao(caso(mud('app.js', add(NOV)), { [NOV]: 'item\n' }, { versao: { agora: '1.42.62', main: '1.42.61' } }));
  conf('a VERSAO mudada recusa sozinha, com a novidade presente', d2.recusas.length === 1 && /VERSAO mudou no PR/.test(d2.recusas[0]), true);
}

console.log('\n=== 3. O caminho real do --conferir, num repositorio de mentira ===');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'versao_deploy_'));
// Identidade pelo ambiente, para TODO comando (commit e merge): a máquina do CI
// não tem user.name.
const ENV = Object.assign({}, process.env, { GIT_AUTHOR_NAME: 'prova', GIT_AUTHOR_EMAIL: 'prova@invalid',
  GIT_COMMITTER_NAME: 'prova', GIT_COMMITTER_EMAIL: 'prova@invalid' });
const g = args => execFileSync('git', args, { cwd: tmp, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: ENV });
const escreve = (versao, cache) => {
  fs.writeFileSync(path.join(tmp, 'sw.js'), "var ARQUIVOS = [\n  './',\n  './app.js'\n];\nvar CACHE = '" + cache + "';\n");
  // Com mais de 1 MB, como o app.js de verdade: o buffer padrão do execFileSync estoura calado.
  fs.writeFileSync(path.join(tmp, 'app.js'), "(function () {\n  var VERSAO = '" + versao + "';\n  // " + 'x'.repeat(1300000) + "\n})();\n");
};
const arq = (nome, texto) => { fs.mkdirSync(path.dirname(path.join(tmp, nome)), { recursive: true }); fs.writeFileSync(path.join(tmp, nome), texto); };
const commit = msg => { g(['add', '-A']); g(['commit', '-q', '-m', msg]); };
const ramo = (nome, de) => g(['checkout', '-q', '-b', nome, de || 'main']);
const roda = () => conferir(tmp, ENV);
if (!VENENO) {
  try {
    g(['init', '-q', '-b', 'main']);
    escreve('1.42.61', 'apoio-educacional-v141'); arq('tela.js', 'tela\n'); arq('_teste/p.js', 'prova\n'); commit('antes do 13f');
    g(['tag', 'antes-do-13f']);
    arq('_teste/versao_publicada.js', '// o gerador\n'); commit('base: a main ja tem o gerador');
    g(['update-ref', 'refs/remotes/origin/main', 'main']);

    ramo('tela-sem'); arq('tela.js', 'tela nova\n'); commit('tela sem novidade');
    let r = roda();
    conf('--conferir: tela.js mudada sem novidade sai 1', r.codigo, 1);
    conf('--conferir: e diz que leva tela.js', r.linhas.some(l => /FALHOU .*leva tela\.js/.test(l)), true);
    arq('novidades/tela.txt', 'A tela nova.\n'); commit('com novidade');
    r = roda();
    conf('--conferir: com novidades/tela.txt sai 0', r.codigo, 0);

    // A main anda com OUTRO PR do app e a sua novidade; o ramo não conflita,
    // porque ninguém mexe em VERSAO e CACHE: o caso que o 13f existe para resolver.
    g(['checkout', '-q', 'main']); arq('outra.js', 'outra\n'); arq('novidades/outra.txt', 'A outra.\n'); commit('main andou'); g(['update-ref', 'refs/remotes/origin/main', 'main']);
    g(['checkout', '-q', 'tela-sem']);
    r = roda();
    conf('--conferir: depois de a main andar com outro PR do app, o ramo atras nao conflita e sai 0', r.codigo, 0);

    ramo('sobe-versao'); escreve('1.42.62', 'apoio-educacional-v141'); arq('novidades/v.txt', 'item\n'); commit('sobe a versao');
    r = roda();
    conf('--conferir: PR que sobe a VERSAO sai 1', r.codigo, 1);
    conf('--conferir: e o motivo e a VERSAO gerada na publicacao', r.linhas.some(l => /FALHOU .*VERSAO mudou no PR/.test(l)), true);

    ramo('so-prova'); arq('_teste/p.js', 'prova nova\n'); commit('so prova');
    r = roda();
    conf('--conferir: PR so de prova, sem novidade, sai 0', r.codigo, 0);
    conf('--conferir: e diz que nao leva arquivo do site', r.linhas.some(l => /nao leva arquivo do site/.test(l)), true);

    ramo('vazia'); arq('tela.js', 'outra tela\n'); arq('novidades/v.txt', '\n'); commit('novidade vazia');
    r = roda();
    conf('--conferir: novidade vazia sai 1', r.codigo, 1);

    ramo('duas'); arq('tela.js', 'tela 3\n'); arq('novidades/d.txt', 'item\n');
    fs.appendFileSync(path.join(tmp, 'sw.js'), "var CACHE = 'apoio-educacional-v141';\n"); commit('duas declaracoes');
    r = roda();
    conf('--conferir: duas declaracoes de CACHE saem 1', r.codigo, 1);
    conf('--conferir: e o motivo cita a declaracao', r.linhas.some(l => /mais de uma/.test(l)), true);

    ramo('edita-antiga'); arq('tela.js', 'tela 4\n'); arq('novidades/outra.txt', 'A outra, revista.\n'); commit('so edita a novidade antiga (a outra.txt esta na main)');
    r = roda();
    conf('--conferir: tela mudada editando so uma novidade que ja esta na main sai 1', r.codigo, 1);
    // A TRANSICAO: a main sem o gerador (o merge do proprio 13f) julga pela regra antiga.
    g(['update-ref', 'refs/remotes/origin/main', 'antes-do-13f']);
    ramo('transicao-igual', 'antes-do-13f'); arq('tela.js', 'tela 13f\n'); arq('_teste/versao_publicada.js', '// o gerador\n'); arq('novidades/13f.txt', '# nada\n'); commit('13f sem subir');
    r = roda();
    conf('--conferir: transicao (main sem o gerador), VERSAO igual a da main, sai 1', r.codigo, 1);
    conf('--conferir: e o motivo e a regra antiga da transicao', r.linhas.some(l => /FALHOU .*transicao/.test(l)), true);
    escreve('1.42.69', 'apoio-educacional-v149'); commit('13f sobe para a proxima livre');
    r = roda();
    conf('--conferir: transicao com VERSAO e CACHE maiores e novidade sai 0', r.codigo, 0);
    g(['update-ref', '-d', 'refs/remotes/origin/main']); g(['branch', '-q', '-m', 'main', 'outra']);
    r = roda();
    conf('--conferir: sem main para comparar sai 2 (INSTAVEL)', r.codigo, 2);
  } catch (e) {
    conf('o repositorio de mentira montou: ' + String(e.stderr || e.message).split('\n')[0], false, true);
  }
}
fs.rmSync(tmp, { recursive: true, force: true });

console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
