/* testa_versao_publicada.js (13f, sem navegador)
 *
 * A VERSAO, o CACHE e as NOVIDADES gerados na publicação
 * (_teste/versao_publicada.js). O que se garante, dos dois lados:
 *   - o contador SOBE no commit da main que muda o que o tablet baixa (arquivo
 *     do site, novidade ou o próprio gerador) e NÃO SOBE no que só muda prova,
 *     CI ou documentação; o merge na main conta uma vez, pelo que trouxe;
 *   - ele só cresce ao longo da main (nunca um nome de cache já publicado);
 *   - cada novidade leva a versão do commit que a trouxe, e o arquivo só de
 *     comentário não vira entrada;
 *   - a injeção troca a ÚNICA declaração, e recusa gerar VERSAO ou CACHE que não
 *     seja MAIOR que o do repositório, que é o que está no ar na migração
 *     (1.42.61 e apoio-educacional-v141): o tablet dela só atualiza com nome novo;
 *   - clone raso é erro, e não um número menor;
 *   - no repositório de verdade, a próxima publicação sai maior que o que está
 *     no ar, e o app.js e o sw.js gerados são JavaScript válido.
 * Os venenos trocam a regra de contagem: uma que conta todo commit (o tablet
 * veria "Versão nova pronta" por um PR só de prova) e uma que esquece o banco
 * (o banco novo ficaria preso no cache velho). Cada um TEM de reprovar.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');
const VP = require('./versao_publicada.js');

const RAIZ = path.join(__dirname, '..');
let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
const lanca = f => { try { f(); return ''; } catch (e) { return e.message; } };

console.log('\n=== 1. O que sobe ao site e o que conta para a publicacao ===');
[['app.js', true], ['sw.js', true], ['index.html', true], ['banco/topicos/fisica.json', true], ['figuras/solidos.js', true],
 ['icons/icon-192.png', true], ['_teste/testa_x.js', false], ['biblioteca/gerar.py', false], ['.github/workflows/portao.yml', false],
 ['functions/api/ia.js', false], ['servidor/ia.js', false], ['README.md', false], ['docs/notas.md', false], ['banco/_ids.json', false],
 ['novidades/x.txt', false], ['.gitignore', false], ['x.sh', false]].forEach(([f, esp]) => conf('ehDoSite(' + f + ') = ' + esp, VP.ehDoSite(f), esp));
conf('a novidade conta para a publicacao', VP.contaParaPublicacao('novidades/x.txt'), true);
conf('o montador conta para a publicacao', VP.contaParaPublicacao('.github/monta_site.sh'), true);
conf('o gerador conta para a publicacao', VP.contaParaPublicacao('_teste/versao_publicada.js'), true);
conf('prova nao conta', VP.contaParaPublicacao('_teste/testa_x.js'), false);
conf('workflow nao conta', VP.contaParaPublicacao('.github/workflows/portao.yml'), false);
conf('versaoDe(150)', VP.versaoDe(150), '1.43.150');
conf('cacheDe(150)', VP.cacheDe(150), 'apoio-educacional-v1150');
const ln = VP.lerNovidade('﻿Na aula, a janela abre em duas colunas.\r\n\r\n# comentario\n  Outro item.  \n');
conf('lerNovidade: dois itens, sem BOM, sem CR, sem comentario', JSON.stringify(ln.itens), JSON.stringify(['Na aula, a janela abre em duas colunas.', 'Outro item.']));
conf('lerNovidade: conta o comentario', ln.comentarios, 1);

console.log('\n=== 2. O contador e as novidades, num repositorio de mentira ===');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'versao_publicada_'));
const ENV = Object.assign({}, process.env, { GIT_AUTHOR_NAME: 'prova', GIT_AUTHOR_EMAIL: 'prova@invalid',
  GIT_COMMITTER_NAME: 'prova', GIT_COMMITTER_EMAIL: 'prova@invalid' });
const g = args => execFileSync('git', args, { cwd: tmp, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: ENV, maxBuffer: 64 * 1024 * 1024 });
const arq = (nome, texto) => { fs.mkdirSync(path.dirname(path.join(tmp, nome)), { recursive: true }); fs.writeFileSync(path.join(tmp, nome), texto); };
const apaga = nome => fs.rmSync(path.join(tmp, nome));
const commit = msg => { g(['add', '-A']); g(['commit', '-q', '-m', msg]); return g(['rev-parse', 'HEAD']).trim(); };
const APP = "(function () {\n  'use strict';\n  var VERSAO = '1.42.61';\n  var VERSAO_MINIMA_PROTOCOLO_MENSAGEM = '1.42.40';\n" +
  "  var NOVIDADES = [\n    {\n      versao: '1.42.61',\n      itens: ['item escrito a mao']\n    }\n  ];\n  globalThis.__r = { VERSAO: VERSAO, NOVIDADES: NOVIDADES };\n})();\n";
const SW = "/* comentario */\nvar CACHE = 'apoio-educacional-v141';\nvar ARQUIVOS = [\n  './',\n  './app.js'\n];\n";
const ns = {};
try {
  g(['init', '-q', '-b', 'main']);
  arq('app.js', APP); arq('sw.js', SW); arq('_teste/p.js', 'prova\n'); ns.c1 = commit('c1: o app');
  arq('_teste/p.js', 'prova nova\n'); ns.c2 = commit('c2: so prova');
  g(['checkout', '-q', '-b', 'pr']); arq('tela.js', 'tela 1\n'); commit('pr 1'); arq('tela.js', 'tela 2\n'); commit('pr 2');
  g(['checkout', '-q', 'main']); g(['merge', '-q', '--no-ff', '--no-edit', 'pr']); ns.c3 = g(['rev-parse', 'HEAD']).trim();
  arq('novidades/a.txt', 'Item da novidade A.\n'); ns.c4 = commit('c4: so a novidade');
  arq('README.md', 'leia\n'); arq('.github/workflows/w.yml', 'x\n'); ns.c5 = commit('c5: documentacao e CI');
  arq('banco/topicos/f.json', '{}\n'); arq('novidades/b.txt', '# nada muda para ela\n'); ns.c6 = commit('c6: banco e novidade so de comentario');
  arq('.github/monta_site.sh', 'echo\n'); arq('novidades/c.txt', 'Item C1.\nItem C2.\n'); ns.c7 = commit('c7: montador e novidade C');
  apaga('novidades/a.txt'); ns.c8 = commit('c8: a novidade A sai');

  const N = rev => VP.calcular(g, rev).n;
  conf('c1 (o app): N 1', N(ns.c1), 1);
  conf('c2 (so prova): N continua 1 (o tablet nao ve versao nova)', N(ns.c2), 1);
  conf('c3 (merge de um PR com dois commits na tela): N 2, conta uma vez', N(ns.c3), 2);
  conf('c4 (so a novidade): N 3', N(ns.c4), 3);
  conf('c5 (documentacao e CI): N continua 3', N(ns.c5), 3);
  conf('c6 (banco): N 4', N(ns.c6), 4);
  conf('c7 (montador): N 5', N(ns.c7), 5);
  conf('c8 (tirar uma novidade): N 6', N(ns.c8), 6);
  const hist = VP.historia(g, ns.c8);
  conf('a historia e de primeiro pai: 8 commits (os 2 do PR ficam de fora)', hist.length, 8);
  let cresce = true, sobeQuandoDeve = true, n = 0;
  hist.forEach(c => { const antes = n; if (c.mudancas.some(m => VP.contaParaPublicacao(m.caminho))) n++; if (n < antes) cresce = false; });
  const porCommit = [ns.c1, ns.c2, ns.c3, ns.c4, ns.c5, ns.c6, ns.c7, ns.c8].map(N);
  porCommit.forEach((x, i) => { if (i && x < porCommit[i - 1]) cresce = false; });
  [[1, false], [2, true], [3, true], [4, false], [5, true], [6, true], [7, true]].forEach(([i, deve]) => {
    if ((porCommit[i] > porCommit[i - 1]) !== deve) sobeQuandoDeve = false;
  });
  conf('o contador nunca desce ao longo da main', cresce, true);
  conf('ele sobe exatamente nos commits que mudam o que e publicado', sobeQuandoDeve, true);

  const c7 = VP.calcular(g, ns.c7);
  conf('c7: VERSAO 1.43.5 e CACHE v1005', c7.versao + ' ' + c7.cache, '1.43.5 apoio-educacional-v1005');
  conf('c7: novidades geradas, da mais nova para a mais antiga', JSON.stringify(c7.novidades),
    JSON.stringify([{ versao: '1.43.5', itens: ['Item C1.', 'Item C2.'] }, { versao: '1.43.3', itens: ['Item da novidade A.'] }]));
  conf('c7: a novidade so de comentario (b) nao vira entrada', c7.novidades.some(e => e.versao === '1.43.4'), false);
  const c8 = VP.calcular(g, ns.c8);
  conf('c8: a novidade tirada sai das geradas', c8.novidades.map(e => e.versao).join(','), '1.43.5');

  // A injecao, no app.js e sw.js do commit
  const r = VP.injetar(APP, SW, c7);
  conf('injetar: a VERSAO gerada', VP.lerValor(r.app, VP.RE_VERSAO), '1.43.5');
  conf('injetar: o CACHE gerado', VP.lerValor(r.sw, VP.RE_CACHE), 'apoio-educacional-v1005');
  conf('injetar: a VERSAO minima do protocolo fica como estava', /VERSAO_MINIMA_PROTOCOLO_MENSAGEM = '1\.42\.40'/.test(r.app), true);
  const ctx = {}; vm.runInNewContext(r.app, { globalThis: ctx });
  conf('injetar: o app.js gerado roda, com a VERSAO gerada', ctx.__r && ctx.__r.VERSAO, '1.43.5');
  conf('injetar: NOVIDADES com as geradas na frente e a escrita a mao no fim',
    ctx.__r && ctx.__r.NOVIDADES.map(e => e.versao).join(','), '1.43.5,1.43.3,1.42.61');
  conf('injetar: a janela de novidades acha os itens da versao que abriu',
    ctx.__r && JSON.stringify(ctx.__r.NOVIDADES.filter(e => e.versao === ctx.__r.VERSAO)[0].itens), JSON.stringify(['Item C1.', 'Item C2.']));
  vm.runInNewContext(r.sw, {});
  conf('injetar: o sw.js gerado roda', true, true);
  const semNov = VP.injetar(APP, SW, { versao: '1.43.9', cache: 'apoio-educacional-v1009', novidades: [] });
  conf('injetar sem novidade: o NOVIDADES fica como estava', semNov.app.indexOf("var NOVIDADES = [\n    {\n      versao: '1.42.61'") >= 0, true);
  conf('injetar com CRLF: mantem o CRLF', /\r\n/.test(VP.injetar(APP.replace(/\n/g, '\r\n'), SW, c7).app) && !/[^\r]\n/.test(VP.injetar(APP.replace(/\n/g, '\r\n'), SW, c7).app), true);
  // O piso: VERSAO e CACHE gerados TEM de ser maiores que os do repositorio (os do ar na migracao)
  conf('piso: VERSAO gerada igual a do repositorio recusa',
    /nao e maior/.test(lanca(() => VP.injetar(APP, SW, { versao: '1.42.61', cache: 'apoio-educacional-v1005', novidades: [] }))), true);
  conf('piso: VERSAO gerada menor (1.42.9) recusa, como numero',
    /nao e maior/.test(lanca(() => VP.injetar(APP, SW, { versao: '1.42.9', cache: 'apoio-educacional-v1005', novidades: [] }))), true);
  conf('piso: CACHE gerado igual ao do repositorio recusa',
    /nao e maior/.test(lanca(() => VP.injetar(APP, SW, { versao: '1.43.5', cache: 'apoio-educacional-v141', novidades: [] }))), true);
  conf('piso: CACHE v99 contra v141 recusa (numero, e nao texto)',
    /nao e maior/.test(lanca(() => VP.injetar(APP, SW, { versao: '1.43.5', cache: 'apoio-educacional-v99', novidades: [] }))), true);
  conf('controle: VERSAO 1.43.0 e CACHE v1000 passam o piso',
    lanca(() => VP.injetar(APP, SW, { versao: '1.43.0', cache: 'apoio-educacional-v1000', novidades: [] })), '');
  conf('duas declaracoes de VERSAO recusam',
    /esperava uma declaracao/.test(lanca(() => VP.injetar(APP.replace("var VERSAO = '1.42.61';", "var VERSAO = '1.42.61';\n  var VERSAO = '1.42.61';"), SW, c7))), true);
  conf('sem a linha do NOVIDADES, com novidade a gerar, recusa',
    /NOVIDADES/.test(lanca(() => VP.injetar(APP.replace('var NOVIDADES = [', 'var NOVAS = ['), SW, c7))), true);

  // Os venenos: outra regra de contagem
  const todos = VP.contar(hist, () => true);
  conf('VENENO visto: contando todo commit, o PR so de prova (c2) subiria a versao', todos.n > VP.contar(hist).n, true);
  const semBanco = VP.contar(VP.historia(g, ns.c6), f => /\.js$/.test(f) && VP.ehDoSite(f));
  conf('VENENO visto: esquecendo o banco, o c6 nao subiria o cache', semBanco.n < VP.contar(VP.historia(g, ns.c6)).n, true);

  // Clone raso: erro, e nao um numero menor
  const raso = path.join(os.tmpdir(), 'versao_publicada_raso_' + process.pid);
  execFileSync('git', ['clone', '-q', '--depth', '2', 'file://' + tmp.replace(/\\/g, '/'), raso], { env: ENV, stdio: 'pipe' });
  const gr = args => execFileSync('git', args, { cwd: raso, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: ENV });
  conf('clone raso: o calculo recusa', /clone raso/.test(lanca(() => VP.calcular(gr, 'HEAD'))), true);
  fs.rmSync(raso, { recursive: true, force: true });
} catch (e) {
  conf('o repositorio de mentira montou: ' + String(e.stderr || e.message).split('\n')[0], false, true);
}
fs.rmSync(tmp, { recursive: true, force: true });

console.log('\n=== 3. No repositorio de verdade: a migracao ===');
const gR = args => execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 });
const appRepo = gR(['show', 'HEAD:app.js']), swRepo = gR(['show', 'HEAD:sw.js']);
// O que esta no ar quando o 13f entra: 1.42.61 e v141 (conferido no app.js e no
// sw.js publicados em 12/11/2026). O valor fixo do repositorio TEM de ser esse,
// porque e ele o piso da injecao.
conf('a VERSAO fixa do repositorio e a do ar na migracao (1.42.61)', VP.lerValor(appRepo, VP.RE_VERSAO), '1.42.61');
conf('o CACHE fixo do repositorio e o do ar na migracao (v141)', VP.lerValor(swRepo, VP.RE_CACHE), 'apoio-educacional-v141');
let real = null;
try { real = VP.calcular(gR, 'HEAD'); } catch (e) { conf('o calculo no repositorio de verdade: ' + e.message, false, true); }
if (real) {
  const [a, b, cc] = real.versao.split('.').map(Number);
  conf('a proxima publicacao sai com VERSAO maior que 1.42.61 (' + real.versao + ')', a > 1 || (a === 1 && (b > 42 || (b === 42 && cc > 61))), true);
  conf('e com CACHE maior que v141 (' + real.cache + ')', Number(real.cache.split('-v')[1]) > 141, true);
  const r = VP.injetar(appRepo, swRepo, real);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'versao_publicada_real_'));
  fs.writeFileSync(path.join(dir, 'app.js'), r.app); fs.writeFileSync(path.join(dir, 'sw.js'), r.sw);
  let sintaxe = '';
  try { execFileSync(process.execPath, ['--check', path.join(dir, 'app.js')], { stdio: 'pipe' }); execFileSync(process.execPath, ['--check', path.join(dir, 'sw.js')], { stdio: 'pipe' }); }
  catch (e) { sintaxe = String(e.stderr || e.message).split('\n').slice(0, 3).join(' '); }
  conf('o app.js e o sw.js gerados sao JavaScript valido', sintaxe, '');
  conf('o sw.js gerado tem o CACHE gerado e uma declaracao so', (r.sw.match(/^var CACHE = /gm) || []).length + ' ' + VP.lerValor(r.sw, VP.RE_CACHE), '1 ' + real.cache);
  conf('o sw.js gerado reconhece o proprio cache (VERSAO_DO_APP)', /^apoio-educacional-v\d+$/.test(real.cache), true);
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
