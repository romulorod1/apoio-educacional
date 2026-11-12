/* testa_ordem_versao.js
 *
 * O CACHE do sw.js e a VERSAO do app.js do PR tem de ser MAIORES que os da
 * main ATUAL, e nao so diferentes dos da base do merge.
 *
 * O defeito (12/11/2026): a trava do nome do cache no confere_tudo.sh so
 * exigia nome DIFERENTE do da base do merge. Com varios PRs em paralelo, um
 * ramo com apoio-educacional-v130 integrado depois de a main estar em v134
 * passava verde, reaproveitando ou rebaixando um nome ja publicado, e o tablet
 * ja instalado podia nao receber o codigo novo. A VERSAO nao tinha trava.
 *
 * A regra e uma so, decidirOrdens() e lerOrdensGit() do _teste/merge_seguro.js,
 * usada aqui e no merge (la, contra a origin/main buscada na hora). A pergunta
 * e "o PR leva para a main algum arquivo que muda o que o tablet baixa?"
 * (app.js, sw.js ou um arquivo da lista ARQUIVOS), respondida pelo diff da
 * main contra a arvore do merge (git merge-tree), e NAO pela base do merge: a
 * revisao do #173 mostrou que, depois de o ramo trazer a main, a base vira a
 * ponta da main e um ramo que subiu para o MESMO valor que a main alcancou
 * parecia "nao mudou". Se leva, CACHE e VERSAO da arvore do merge tem de ser
 * ESTRITAMENTE maiores que os da main atual. Se nao leva, passa. O cache compara
 * o numero de apoio-educacional-vNNN (o unico nome que o sw.js reconhece); a
 * versao, x.y.z campo a campo como numero. Constante declarada duas vezes recusa.
 *
 *   node _teste/testa_ordem_versao.js                        a prova (tabela e repo de mentira)
 *   node _teste/testa_ordem_versao.js --envenenado-so-diferente
 *        a regra antiga ("mudou desde a base, entao passa") no lugar da nova: a
 *        tabela TEM de sair errada nos casos de menor, de igual e no da revisao
 *        ("VENENO visto")
 *   node _teste/testa_ordem_versao.js --conferir             a conferencia do repositorio:
 *        o HEAD (commitado) contra a origin/main, pela arvore do merge.
 *        Saida 0 passou, 1 reprovou, 2 sem main para comparar.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const M = require('./merge_seguro.js');

const MODOS = ['--envenenado-so-diferente', '--conferir'];
const desconhecidos = process.argv.slice(2).filter(a => MODOS.indexOf(a) < 0);
const VENENO = process.argv.indexOf('--envenenado-so-diferente') >= 0;

/* A conferencia de verdade. RAIZ e a pasta do repositorio (a prova troca por
 * um repositorio de mentira, para exercitar ESTE caminho, e nao uma copia). */
function conferir(raiz, env) {
  // maxBuffer largo: o app.js passa de 1 MB, e o padrao do node estoura calado.
  const g = args => execFileSync('git', args, { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024, env: env || process.env });
  const tenta = args => { try { return g(args).trim(); } catch (e) { return ''; } };
  const main = tenta(['rev-parse', '--verify', '-q', 'origin/main']) || tenta(['rev-parse', '--verify', '-q', 'main']);
  if (!main) {
    return { codigo: 2, linhas: ['  INSTAVEL ordem do cache         sem origin/main nem main para comparar'] };
  }
  let d;
  try {
    d = M.decidirOrdens(M.lerOrdensGit(g, 'HEAD', main));
  } catch (e) {
    return { codigo: 1, linhas: ['  FALHOU  ordem do cache           nao consegui ler o que o PR leva: ' + String(e.stderr || e.message).split('\n')[0]] };
  }
  const linhas = [];
  [['do cache', d.motivos[0]], ['da versao', d.motivos[1]]].forEach(([nome, motivo]) => {
    const ok = d.recusas.indexOf(motivo) < 0;
    linhas.push('  ' + (ok ? 'ok      ' : 'FALHOU  ') + ('ordem ' + nome).padEnd(24) + ' ' + motivo);
  });
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

console.log('\n=== 1. Comparacao como numero, formato e leitura ===');
conf('1.42.9 contra 1.42.10: menor', M.compararSemver('1.42.9', '1.42.10') < 0, true);
conf('1.42.10 contra 1.42.9: maior', M.compararSemver('1.42.10', '1.42.9') > 0, true);
conf('controle: como TEXTO, 1.42.9 sairia maior que 1.42.10', '1.42.9' > '1.42.10', true);
conf('1.43.0 contra 1.42.99: maior', M.compararSemver('1.43.0', '1.42.99') > 0, true);
conf('2.0.0 contra 1.99.99: maior', M.compararSemver('2.0.0', '1.99.99') > 0, true);
conf('1.42.53 contra 1.42.53: igual', M.compararSemver('1.42.53', '1.42.53'), 0);
conf('fora de x.y.z (1.42) nao compara', M.compararSemver('1.42', '1.42.0'), null);
conf('v1000 contra v999: maior', M.compararCache('apoio-educacional-v1000', 'apoio-educacional-v999') > 0, true);
conf('controle: como TEXTO, v999 sairia maior que v1000', 'apoio-educacional-v999' > 'apoio-educacional-v1000', true);
conf('cache sem -vNNN nao compara', M.compararCache('apoio-educacional', 'apoio-educacional-v1'), null);
conf('cache com outro prefixo (o sw.js nao o reconhece) nao compara', M.compararCache('apoio-v135', 'apoio-educacional-v134'), null);
conf('cache com sufixo depois do numero nao compara', M.compararCache('apoio-educacional-v135-b', 'apoio-educacional-v134'), null);
conf('main fora do padrao tambem nao compara', M.compararCache('apoio-educacional-v135', 'outro-v134'), null);
conf('le o CACHE do sw.js', M.lerCache("x\r\nvar CACHE = 'apoio-educacional-v134';\r\n"), 'apoio-educacional-v134');
conf('le a VERSAO do app.js', M.lerVersao("(function () {\n  var VERSAO = '1.42.53';\n  var VERSAO_MINIMA = '1.0.0';\n"), '1.42.53');
conf('DUAS declaracoes de CACHE recusam (null)', M.lerCache("var CACHE = 'apoio-educacional-v134';\nvar CACHE = 'apoio-educacional-v130';\n"), null);
conf('let CACHE depois do var conta como segunda declaracao', M.lerCache("var CACHE = 'apoio-educacional-v134';\n  let CACHE = 'x';\n"), null);
conf('DUAS declaracoes de VERSAO recusam (null)', M.lerVersao("  var VERSAO = '1.42.53';\n  var VERSAO = '1.42.60';\n"), null);
conf('controle: declaracao em comentario nao conta', M.lerCache("// var CACHE = 'velho';\nvar CACHE = 'apoio-educacional-v134';\n"), 'apoio-educacional-v134');
conf('a lista ARQUIVOS sai sem a raiz e sem o ./',
  M.listaArquivos("var ARQUIVOS = [\n  './',\n  './index.html',\n  './figuras/a.js', // comentario nao casa\n  'b.js'\n];\nvar X = ['./fora.js'];\n").join(' '),
  'index.html b.js');

console.log('\n=== 2. A tabela, dos dois lados' + (VENENO ? ' (ENVENENADA: regra antiga)' : '') + ' ===');
const c = n => 'apoio-educacional-v' + n;
/* A regra ANTIGA, que e o veneno: so olhava se o valor mudou desde a base. */
const decide = (nome, agora, main, levados, base, cmp) =>
  (VENENO ? { ok: true } : M.decidirOrdem(nome, agora, main, levados, cmp)).ok ? 'passa' : 'reprova';
const APP = ['app.js', 'sw.js', 'tela.js'];
// [rotulo, nome, agora (arvore do merge), main atual, levados, base (so o veneno usa), comparador, esperado]
const TABELA = [
  ['CACHE v134 sobre main v133, levando o app, passa', 'CACHE', c(134), c(133), APP, c(133), M.compararCache, 'passa'],
  ['CACHE v130 sobre main v134 e recusado', 'CACHE', c(130), c(134), APP, c(129), M.compararCache, 'reprova'],
  ['CACHE igual ao da main (v134), levando o app, e recusado', 'CACHE', c(134), c(133 + 1), APP, c(133), M.compararCache, 'reprova'],
  ['REVISAO: o ramo trouxe a main e ficou igual (v134), levando tela.js, e recusado', 'CACHE', c(134), c(134), ['tela.js'], c(134), M.compararCache, 'reprova'],
  ['CACHE v1000 sobre main v999 passa (numero)', 'CACHE', c(1000), c(999), APP, c(998), M.compararCache, 'passa'],
  ['PR so de teste, CACHE igual ao da main, passa', 'CACHE', c(134), c(134), [], c(133), M.compararCache, 'passa'],
  ['CACHE fora do padrao e recusado mesmo sem levar o app', 'CACHE', 'apoio-educacional-novo', c(134), [], c(133), M.compararCache, 'reprova'],
  ['VERSAO 1.42.10 sobre main 1.42.9 passa (numero)', 'VERSAO', '1.42.10', '1.42.9', APP, '1.42.8', M.compararSemver, 'passa'],
  ['VERSAO 1.42.9 sobre main 1.42.10 e recusada', 'VERSAO', '1.42.9', '1.42.10', APP, '1.42.8', M.compararSemver, 'reprova'],
  ['VERSAO igual a da main, levando o app, e recusada', 'VERSAO', '1.42.54', '1.42.54', APP, '1.42.53', M.compararSemver, 'reprova'],
  ['REVISAO: o ramo trouxe a main e a VERSAO ficou igual, e recusada', 'VERSAO', '1.42.54', '1.42.54', ['tela.js'], '1.42.54', M.compararSemver, 'reprova'],
  ['PR so de teste, VERSAO igual a da main, passa', 'VERSAO', '1.42.60', '1.42.60', [], '1.42.53', M.compararSemver, 'passa'],
  ['VERSAO fora de x.y.z e recusada', 'VERSAO', '1.43', '1.42.53', APP, '1.42.53', M.compararSemver, 'reprova'],
  ['VERSAO ilegivel (null) e recusada', 'VERSAO', null, '1.42.53', [], '1.42.53', M.compararSemver, 'reprova']
];
const errados = [];
TABELA.forEach(([rot, nome, agora, main, levados, base, cmp, esp]) => {
  const obtido = decide(nome, agora, main, levados, base, cmp);
  if (VENENO) { if (obtido !== esp) errados.push(rot); }
  else conf(rot, obtido, esp);
});
if (VENENO) {
  const deviam = ['CACHE v130 sobre main v134 e recusado', 'CACHE igual ao da main (v134), levando o app, e recusado',
    'REVISAO: o ramo trouxe a main e ficou igual (v134), levando tela.js, e recusado',
    'VERSAO 1.42.9 sobre main 1.42.10 e recusada', 'VERSAO igual a da main, levando o app, e recusada',
    'REVISAO: o ramo trouxe a main e a VERSAO ficou igual, e recusada'];
  deviam.forEach(rot => conf('VENENO visto: sob a regra antiga, "' + rot + '" sai errado', errados.indexOf(rot) >= 0, true));
  console.log('    (a regra antiga erra ' + errados.length + ' de ' + TABELA.length + ' casos da tabela)');
}
if (!VENENO) {
  const d = M.decidirOrdens({ levados: APP, cache: { agora: c(135), main: c(134) }, versao: { agora: '1.42.9', main: '1.42.10' } });
  conf('cache maior e versao menor: recusa', d.ok, false);
  conf('e so a versao sai nas recusas', d.recusas.length === 1 && /^VERSAO /.test(d.recusas[0]), true);
  const semApp = M.decidirOrdens({ levados: [], cache: { agora: c(134), main: c(134) }, versao: { agora: '1.42.53', main: '1.42.53' } });
  conf('sem arquivo do app levado, igual passa', semApp.ok, true);
}

console.log('\n=== 3. O caminho real do --conferir, num repositorio de mentira ===');
// O --conferir le o git de verdade (merge-tree, diff, show). Aqui ele roda sobre
// um repo montado na hora, com a main em v134 / 1.42.10 e um ramo por caso.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ordem_versao_'));
// Identidade pelo ambiente, para TODO comando (commit e merge): a maquina do CI
// nao tem user.name, e o merge do caso "trazer a main errado" morria ali.
const ENV = Object.assign({}, process.env, { GIT_AUTHOR_NAME: 'prova', GIT_AUTHOR_EMAIL: 'prova@invalid',
  GIT_COMMITTER_NAME: 'prova', GIT_COMMITTER_EMAIL: 'prova@invalid' });
const g = args => execFileSync('git', args, { cwd: tmp, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: ENV });
const LISTA = "var ARQUIVOS = [\n  './',\n  './index.html',\n  './app.js',\n  './tela.js'\n];\n";
const escreve = (cache, versao, extraSw) => {
  fs.writeFileSync(path.join(tmp, 'sw.js'), LISTA + "var CACHE = 'apoio-educacional-v" + cache + "';\n" + (extraSw || ''));
  // Com mais de 1 MB, como o app.js de verdade: a primeira versao do --conferir
  // estourava o buffer padrao do execFileSync e lia a VERSAO como vazia.
  fs.writeFileSync(path.join(tmp, 'app.js'), "(function () {\n  var VERSAO = '" + versao + "';\n  // " +
    'x'.repeat(1300000) + "\n})();\n");
};
const arq = (nome, texto) => fs.writeFileSync(path.join(tmp, nome), texto);
const commit = msg => { g(['add', '-A']); g(['commit', '-q', '-m', msg]); };
// De 'base' o ramo fica atras da main; de 'main', em dia (sem conflito na linha do CACHE).
const ramo = (nome, de) => g(['checkout', '-q', '-b', nome, de || 'base']);
const roda = () => conferir(tmp, ENV);
if (!VENENO) {
  try {
    g(['init', '-q', '-b', 'main']);
    escreve(129, '1.42.8'); arq('tela.js', 'tela de antes\n'); arq('index.html', '<p>\n'); commit('base');
    g(['tag', 'base']);
    escreve(134, '1.42.10'); arq('outro.txt', 'main andou\n'); commit('main em v134');
    g(['update-ref', 'refs/remotes/origin/main', 'main']);

    // v130 sobre main v134: o ramo subiu de v129 para v130. Sem trazer a main,
    // a linha do CACHE conflita, e conflito recusa.
    ramo('ramo-velho'); escreve(130, '1.42.9'); arq('tela.js', 'tela nova\n'); commit('ramo sobe para v130');
    let r = roda();
    conf('--conferir: v130 / 1.42.9 sobre main v134 / 1.42.10 (conflito) sai 1', r.codigo, 1);
    conf('--conferir: e o motivo e o conflito', r.linhas.some(l => /conflito com a main/.test(l)), true);
    // trazendo a main com a resolucao ERRADA (fica v130): sem conflito, menor, recusa.
    g(['merge', '-q', '-s', 'ours', '--no-edit', 'main']);
    r = roda();
    conf('--conferir: v130 depois de trazer a main errado sai 1', r.codigo, 1);
    conf('--conferir: e as duas recusas dizem menor', r.linhas.filter(l => /FALHOU .*menor/.test(l)).length, 2);
    escreve(135, '1.42.11'); commit('sobe para a proxima livre');
    r = roda();
    conf('--conferir: v135 / 1.42.11 sobre main v134 / 1.42.10 sai 0', r.codigo, 0);

    // O CASO DA REVISAO: o ramo sobe v129 para v134 e 1.42.10, com tela.js nova;
    // a main chega aos mesmos valores por outro PR; o ramo traz a main.
    ramo('ramo-igual'); escreve(134, '1.42.10'); arq('tela.js', 'codigo novo do ramo\n'); commit('ramo sobe igual');
    r = roda();
    conf('--conferir: igual a main, antes de trazer a main, sai 1', r.codigo, 1);
    g(['merge', '-q', '--no-edit', 'main']);
    r = roda();
    conf('--conferir: REVISAO, depois de trazer a main e igual, sai 1', r.codigo, 1);
    conf('--conferir: e diz que leva tela.js', r.linhas.some(l => /FALHOU .*igual.*leva tela\.js/.test(l)), true);

    // Controle 1: PR so de teste, atras da main, com valor igual ao da base.
    ramo('ramo-teste'); arq('prova.txt', 'so prova\n'); commit('so prova');
    r = roda();
    conf('--conferir: PR so de teste, atras da main (v129 x v134), sai 0', r.codigo, 0);
    conf('--conferir: e diz que nao leva arquivo do app', r.linhas.every(l => /nao leva arquivo do app/.test(l)), true);
    // e o mesmo PR so de teste depois de trazer a main (valor igual ao da main).
    g(['merge', '-q', '--no-edit', 'main']);
    r = roda();
    conf('--conferir: PR so de teste que trouxe a main (igual a main) sai 0', r.codigo, 0);

    // Controle 2: app.js mudado e valores maiores.
    ramo('ramo-app', 'main');escreve(135, '1.42.11'); commit('app novo e versao nova');
    r = roda();
    conf('--conferir: app.js mudado com v135 / 1.42.11 sai 0', r.codigo, 0);

    // Arquivo da lista mudado SEM subir nada: recusa, mesmo sem tocar sw.js e app.js.
    ramo('ramo-so-tela'); arq('tela.js', 'so a tela\n'); commit('so a tela');
    r = roda();
    conf('--conferir: tela.js (da lista) sem subir CACHE e VERSAO sai 1', r.codigo, 1);

    // Duas declaracoes do CACHE: recusa, mesmo com a primeira maior.
    ramo('ramo-duas', 'main');escreve(135, '1.42.11', "var CACHE = 'apoio-educacional-v130';\n"); commit('duas declaracoes');
    r = roda();
    conf('--conferir: duas declaracoes de CACHE saem 1', r.codigo, 1);
    conf('--conferir: e o motivo cita a declaracao', r.linhas.some(l => /mais de uma/.test(l)), true);

    // CACHE fora do padrao que o sw.js reconhece: recusa.
    ramo('ramo-nome', 'main'); escreve(134, '1.42.11'); commit('nome curto');
    fs.writeFileSync(path.join(tmp, 'sw.js'), fs.readFileSync(path.join(tmp, 'sw.js'), 'utf8').replace('apoio-educacional-v134', 'apoio-v135'));
    commit('nome fora do padrao');
    r = roda();
    conf('--conferir: CACHE apoio-v135 (fora do padrao) sai 1', r.codigo, 1);
    conf('--conferir: e o motivo e o formato', r.linhas.some(l => /FALHOU .*CACHE fora do formato/.test(l)), true);

    // sem origin/main nem main: INSTAVEL, nunca ok.
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
