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
 * A regra e uma so, decidirOrdens() do _teste/merge_seguro.js, usada aqui e no
 * merge (la, contra a origin/main buscada na hora, logo antes do merge). Para
 * cada constante: se o PR NAO a mexeu (igual a da base), passa, porque o merge
 * leva a da main; se mexeu, tem de ser ESTRITAMENTE maior que a da main atual.
 * O cache compara o numero do vNNN; a versao, x.y.z campo a campo como numero.
 *
 *   node _teste/testa_ordem_versao.js                        a prova (tabela e repo de mentira)
 *   node _teste/testa_ordem_versao.js --envenenado-so-diferente
 *        a regra antiga ("mudou, entao passa") no lugar da nova: a tabela TEM
 *        de sair errada nos casos de menor e de igual ("VENENO visto")
 *   node _teste/testa_ordem_versao.js --conferir             a conferencia do repositorio:
 *        sw.js e app.js do disco contra a base do merge (git merge-base HEAD
 *        origin/main) e a origin/main. Saida 0 passou, 1 reprovou, 2 sem base.
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
function conferir(raiz) {
  // maxBuffer largo: o app.js passa de 1 MB, e o padrao do node estoura calado
  // dentro do tenta(), que viraria "nao consegui ler" em vez do erro.
  const g = args => execFileSync('git', args, { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }).trim();
  const tenta = args => { try { return g(args); } catch (e) { return ''; } };
  const main = tenta(['rev-parse', '--verify', '-q', 'origin/main']) || tenta(['rev-parse', '--verify', '-q', 'main']);
  const base = main ? tenta(['merge-base', 'HEAD', main]) : '';
  if (!main || !base) {
    return { codigo: 2, linhas: ['  INSTAVEL ordem do cache         sem origin/main ou sem base de merge para comparar'] };
  }
  const disco = arq => { try { return fs.readFileSync(path.join(raiz, arq), 'utf8'); } catch (e) { return ''; } };
  const show = (rev, arq) => tenta(['show', rev + ':' + arq]);
  const v = {
    cache: { agora: M.lerCache(disco('sw.js')), base: M.lerCache(show(base, 'sw.js')), main: M.lerCache(show(main, 'sw.js')) },
    versao: { agora: M.lerVersao(disco('app.js')), base: M.lerVersao(show(base, 'app.js')), main: M.lerVersao(show(main, 'app.js')) }
  };
  const d = M.decidirOrdens(v);
  const linhas = [];
  [['CACHE', d.motivos[0]], ['VERSAO', d.motivos[1]]].forEach(([nome, motivo]) => {
    const ok = d.recusas.indexOf(motivo) < 0;
    linhas.push('  ' + (ok ? 'ok      ' : 'FALHOU  ') + ('ordem ' + (nome === 'CACHE' ? 'do cache' : 'da versao')).padEnd(24) + ' ' + motivo);
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

/* A regra ANTIGA, que e o veneno: so exigia mudar. */
function decidirVelha(nome, agora, base) {
  return { ok: true, motivo: nome + (agora !== base ? ' mudou desde a base' : ' nao mudou') };
}
const decide = (nome, agora, base, main, cmp) =>
  (VENENO ? decidirVelha(nome, agora, base) : M.decidirOrdem(nome, agora, base, main, cmp)).ok ? 'passa' : 'reprova';

console.log('\n=== 1. Comparacao como numero, e nao como texto ===');
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
conf('le o CACHE do sw.js', M.lerCache("x\r\nvar CACHE = 'apoio-educacional-v134';\r\n"), 'apoio-educacional-v134');
conf('le a VERSAO do app.js', M.lerVersao("(function () {\n  var VERSAO = '1.42.53';\n  var VERSAO_MINIMA = '1.0.0';\n"), '1.42.53');

console.log('\n=== 2. A tabela, dos dois lados' + (VENENO ? ' (ENVENENADA: regra antiga)' : '') + ' ===');
const c = n => 'apoio-educacional-v' + n;
// [rotulo, nome, agora (PR), base do merge, main atual, comparador, esperado]
const TABELA = [
  ['CACHE v134 sobre main v133 passa', 'CACHE', c(134), c(133), c(133), M.compararCache, 'passa'],
  ['CACHE v130 sobre main v134 e recusado', 'CACHE', c(130), c(129), c(134), M.compararCache, 'reprova'],
  ['CACHE igual ao da main (v134) e recusado', 'CACHE', c(134), c(133), c(134), M.compararCache, 'reprova'],
  ['CACHE v135 sobre main v134 passa', 'CACHE', c(135), c(133), c(134), M.compararCache, 'passa'],
  ['CACHE v1000 sobre main v999 passa (numero)', 'CACHE', c(1000), c(998), c(999), M.compararCache, 'passa'],
  ['PR que nao mexe no CACHE, atras da main, passa', 'CACHE', c(133), c(133), c(134), M.compararCache, 'passa'],
  ['CACHE sem numero e recusado', 'CACHE', 'apoio-educacional-novo', c(133), c(134), M.compararCache, 'reprova'],
  ['VERSAO 1.42.10 sobre main 1.42.9 passa (numero)', 'VERSAO', '1.42.10', '1.42.8', '1.42.9', M.compararSemver, 'passa'],
  ['VERSAO 1.42.9 sobre main 1.42.10 e recusada', 'VERSAO', '1.42.9', '1.42.8', '1.42.10', M.compararSemver, 'reprova'],
  ['VERSAO igual a da main e recusada', 'VERSAO', '1.42.54', '1.42.53', '1.42.54', M.compararSemver, 'reprova'],
  ['VERSAO 1.43.0 sobre main 1.42.99 passa', 'VERSAO', '1.43.0', '1.42.98', '1.42.99', M.compararSemver, 'passa'],
  ['PR que nao mexe na VERSAO, atras da main, passa', 'VERSAO', '1.42.53', '1.42.53', '1.42.60', M.compararSemver, 'passa'],
  ['VERSAO fora de x.y.z e recusada', 'VERSAO', '1.43', '1.42.53', '1.42.53', M.compararSemver, 'reprova']
];
const errados = [];
TABELA.forEach(([rot, nome, agora, base, main, cmp, esp]) => {
  const obtido = decide(nome, agora, base, main, cmp);
  if (VENENO) { if (obtido !== esp) errados.push(rot); }
  else conf(rot, obtido, esp);
});
if (VENENO) {
  const deviam = ['CACHE v130 sobre main v134 e recusado', 'CACHE igual ao da main (v134) e recusado',
    'VERSAO 1.42.9 sobre main 1.42.10 e recusada', 'VERSAO igual a da main e recusada'];
  deviam.forEach(rot => conf('VENENO visto: sob a regra antiga, "' + rot + '" sai errado', errados.indexOf(rot) >= 0, true));
  console.log('    (a regra antiga erra ' + errados.length + ' de ' + TABELA.length + ' casos da tabela)');
}
// As duas constantes juntas: uma recusada basta para recusar.
if (!VENENO) {
  const d = M.decidirOrdens({ cache: { agora: c(135), base: c(133), main: c(134) }, versao: { agora: '1.42.9', base: '1.42.8', main: '1.42.10' } });
  conf('cache maior e versao menor: recusa', d.ok, false);
  conf('e so a versao sai nas recusas', d.recusas.length === 1 && /^VERSAO /.test(d.recusas[0]), true);
  const ilegivel = M.decidirOrdens({ cache: { agora: null, base: c(133), main: c(134) }, versao: { agora: '1.0.0', base: '1.0.0', main: '1.0.0' } });
  conf('CACHE ilegivel recusa, e nao passa calado', ilegivel.ok, false);
}

console.log('\n=== 3. O caminho real do --conferir, num repositorio de mentira ===');
// O --conferir le o disco e o git de verdade. Aqui ele roda sobre um repo
// montado na hora, com a main em v134 / 1.42.10 e ramos de cada caso.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ordem_versao_'));
// Identidade pelo ambiente, para TODO comando (commit e merge): a maquina do CI
// nao tem user.name, e o merge do caso "trazer a main errado" morria ali.
const ID = { GIT_AUTHOR_NAME: 'prova', GIT_AUTHOR_EMAIL: 'prova@invalid', GIT_COMMITTER_NAME: 'prova', GIT_COMMITTER_EMAIL: 'prova@invalid' };
const g = args => execFileSync('git', args, { cwd: tmp, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: Object.assign({}, process.env, ID) });
const escreve = (cache, versao) => {
  fs.writeFileSync(path.join(tmp, 'sw.js'), "var ARQUIVOS = [];\nvar CACHE = 'apoio-educacional-v" + cache + "';\n");
  // Com mais de 1 MB, como o app.js de verdade: a primeira versao do --conferir
  // estourava o buffer padrao do execFileSync e lia a VERSAO da base como vazia.
  fs.writeFileSync(path.join(tmp, 'app.js'), "(function () {\n  var VERSAO = '" + versao + "';\n  // " +
    'x'.repeat(1300000) + "\n})();\n");
};
const commit = msg => { g(['add', '-A']); g(['commit', '-q', '-m', msg]); };
let real = !VENENO;
if (real) {
  try {
    g(['init', '-q', '-b', 'main']);
    escreve(129, '1.42.8'); commit('base');
    g(['branch', 'ramo-velho']); g(['branch', 'ramo-sem-app']); g(['branch', 'ramo-igual']);
    escreve(134, '1.42.10'); fs.writeFileSync(path.join(tmp, 'outro.txt'), 'main andou\n'); commit('main em v134');
    g(['update-ref', 'refs/remotes/origin/main', 'main']);
    // v130 sobre main v134: o ramo subiu de v129 para v130 e a main ja estava em v134.
    g(['checkout', '-q', 'ramo-velho']); escreve(130, '1.42.9'); commit('ramo sobe para v130');
    let r = conferir(tmp);
    conf('--conferir: v130 / 1.42.9 sobre main v134 / 1.42.10 sai 1', r.codigo, 1);
    conf('--conferir: as duas recusas aparecem', r.linhas.filter(l => /FALHOU/.test(l)).length, 2);
    // o mesmo ramo trazendo a main com a resolucao ERRADA do conflito (fica v130):
    // a base do merge passa a ser a main, e a regra antiga daria "diferente, ok".
    g(['merge', '-q', '-s', 'ours', '--no-edit', 'main']);
    r = conferir(tmp);
    conf('--conferir: v130 depois de trazer a main errado sai 1', r.codigo, 1);
    escreve(135, '1.42.11'); commit('sobe para a proxima livre');
    r = conferir(tmp);
    conf('--conferir: v135 / 1.42.11 sobre main v134 / 1.42.10 sai 0', r.codigo, 0);
    // igual: o ramo subiu de v129 para v134 enquanto a main tambem chegava em v134.
    g(['checkout', '-q', 'ramo-igual']); escreve(134, '1.42.10'); commit('igual a main');
    r = conferir(tmp);
    conf('--conferir: igual a main (o ramo mexeu) sai 1', r.codigo, 1);
    // PR que nao toca o app, atras da main: passa sem subir nada.
    g(['checkout', '-q', 'ramo-sem-app']); fs.writeFileSync(path.join(tmp, 'prova.txt'), 'so prova\n'); commit('so prova');
    r = conferir(tmp);
    conf('--conferir: PR sem app, atras da main (v129 x v134), sai 0', r.codigo, 0);
    conf('--conferir: e diz que o merge leva a da main', r.linhas.every(l => /nao mudou desde a base/.test(l)), true);
    // sem origin/main nem main: INSTAVEL, nunca ok.
    g(['update-ref', '-d', 'refs/remotes/origin/main']); g(['branch', '-q', '-m', 'main', 'outra']);
    r = conferir(tmp);
    conf('--conferir: sem main para comparar sai 2 (INSTAVEL)', r.codigo, 2);
  } catch (e) {
    conf('o repositorio de mentira montou: ' + String(e.stderr || e.message).split('\n')[0], false, true);
  }
}
fs.rmSync(tmp, { recursive: true, force: true });

console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
