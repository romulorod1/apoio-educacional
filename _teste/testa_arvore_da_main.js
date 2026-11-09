/* testa_arvore_da_main.js (sem navegador)
 *
 * O nivel 3 da politica de testes: o portao da main reaproveita a bateria
 * inteira so quando o TREE do commit da main e IGUAL ao da cabeca de um PR cuja
 * bateria inteira passou. Prova a decisao pura e, ponta a ponta, a leitura da
 * API com um gh falso de caminho absoluto (sem rede e sem PATH sombreado), com
 * os venenos: tree diferente, bateria vermelha, sem check, sem PR, API que cai.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { decidir } = require('./arvore_da_main.js');

let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}

const MAIN = { sha: 'a'.repeat(40), tree: 't1' };
const pr = (extra) => Object.assign({ numero: 7, headSha: 'b'.repeat(40), headTree: 't1', bateria: 'success' }, extra || {});

console.log('\n=== 1. A decisao, dos dois lados ===');
let r = decidir(MAIN, [pr()]);
conf('tree igual e bateria verde: reaproveita', r.reaproveita, true);
conf('e o log diz o caminho e o PR', r.linhas.some(l => /CAMINHO: reaproveita/.test(l) && /#7/.test(l)), true);
r = decidir(MAIN, [pr({ headTree: 't2' })]);
conf('tree DIFERENTE: roda a bateria', r.reaproveita, false);
conf('e o log diz que o tree difere', r.linhas.some(l => /CAMINHO: roda a bateria/.test(l) && /difere/.test(l)), true);
r = decidir(MAIN, [pr({ bateria: 'failure' })]);
conf('tree igual mas bateria vermelha: roda', r.reaproveita, false);
r = decidir(MAIN, [pr({ bateria: 'skipped' })]);
conf('tree igual mas juncao pulada (PR sem o rotulo): roda', r.reaproveita, false);
r = decidir(MAIN, [pr({ bateria: null })]);
conf('tree igual mas sem o check: roda', r.reaproveita, false);
r = decidir(MAIN, [pr({ bateria: 'in_progress' })]);
conf('tree igual mas bateria ainda rodando: roda', r.reaproveita, false);
r = decidir(MAIN, []);
conf('commit que nao veio de PR: roda', r.reaproveita, false);
r = decidir({ sha: MAIN.sha, tree: '' }, [pr()]);
conf('tree da main ilegivel: roda', r.reaproveita, false);
r = decidir(MAIN, [pr({ numero: 1, headTree: 't9' }), pr({ numero: 2 })]);
conf('dois PRs no commit: vale o que tem o tree igual e a bateria verde', r.reaproveita + '/' + r.pr.numero, 'true/2');
r = decidir(MAIN, [pr({ headTree: '' })]);
conf('tree da cabeca ilegivel: roda', r.reaproveita, false);

console.log('\n=== 2. Ponta a ponta, com gh falso ===');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'arvore_main_'));
const falso = path.join(tmp, 'gh_falso.js');
const cenario = path.join(tmp, 'cenario.json');
const saida = path.join(tmp, 'saida.txt');
fs.writeFileSync(falso,
  "const fs = require('fs');\n" +
  "const a = process.argv.slice(2);\n" +
  "const c = JSON.parse(fs.readFileSync(process.env.FALSO_CENARIO, 'utf8'));\n" +
  "if (a[0] !== 'api') { process.stderr.write('chamada inesperada'); process.exit(3); }\n" +
  "const u = a[1];\n" +
  "if (c.cai) { process.stderr.write('HTTP 500'); process.exit(1); }\n" +
  "let m;\n" +
  "if ((m = /\\/commits\\/(\\w+)\\/pulls$/.exec(u))) process.stdout.write(JSON.stringify(c.pulls));\n" +
  "else if ((m = /\\/commits\\/(\\w+)\\/check-runs/.exec(u))) { if (/check_name=portao-navegador/.test(u) && /filter=latest/.test(u)) process.stdout.write(JSON.stringify({ check_runs: c.checks[m[1]] || [] })); else process.exit(4); }\n" +
  "else if ((m = /\\/commits\\/(\\w+)$/.exec(u))) process.stdout.write(JSON.stringify({ commit: { tree: { sha: c.trees[m[1]] } } }));\n" +
  "else { process.stderr.write('rota inesperada ' + u); process.exit(5); }\n");
const script = path.join(__dirname, 'arvore_da_main.js');
const SHA_MAIN = 'a'.repeat(40), SHA_PR = 'b'.repeat(40);
function rodar(c) {
  fs.writeFileSync(cenario, JSON.stringify(c));
  fs.writeFileSync(saida, '');
  const texto = execFileSync(process.execPath, [script, SHA_MAIN], {
    encoding: 'utf8',
    env: Object.assign({}, process.env, { GH: falso, FALSO_CENARIO: cenario, GITHUB_OUTPUT: saida, GITHUB_REPOSITORY: 'x/y' })
  });
  return { texto, out: fs.readFileSync(saida, 'utf8') };
}
const base = () => ({
  pulls: [{ number: 7, merged_at: '2026-11-09T10:00:00Z', base: { ref: 'main' }, head: { sha: SHA_PR } }],
  trees: { [SHA_MAIN]: 'ARV1', [SHA_PR]: 'ARV1' },
  checks: { [SHA_PR]: [{ name: 'portao-navegador', status: 'completed', conclusion: 'success' }] }
});
let x = rodar(base());
conf('tree igual e bateria verde grava reaproveita=sim', /reaproveita=sim/.test(x.out), true);
conf('e registra o PR', /pr=7/.test(x.out), true);
conf('e diz no log o caminho', /nivel 3: CAMINHO: reaproveita/.test(x.texto), true);
let c = base(); c.trees[SHA_PR] = 'ARV2';
x = rodar(c);
conf('tree diferente grava reaproveita=nao', /reaproveita=nao/.test(x.out), true);
conf('e diz no log que roda a bateria', /CAMINHO: roda a bateria/.test(x.texto), true);
c = base(); c.checks[SHA_PR][0].conclusion = 'failure';
conf('bateria vermelha na cabeca grava reaproveita=nao', /reaproveita=nao/.test(rodar(c).out), true);
c = base(); c.checks[SHA_PR] = [];
conf('sem o check na cabeca grava reaproveita=nao', /reaproveita=nao/.test(rodar(c).out), true);
c = base(); c.pulls = [];
conf('sem PR grava reaproveita=nao', /reaproveita=nao/.test(rodar(c).out), true);
c = base(); c.pulls[0].merged_at = null;
conf('PR que nao foi mergeado nao vale', /reaproveita=nao/.test(rodar(c).out), true);
c = base(); c.cai = true;
x = rodar(c);
conf('API que cai grava reaproveita=nao (na duvida, roda)', /reaproveita=nao/.test(x.out), true);
conf('e diz no log que nao consultou', /nao consegui consultar a API/.test(x.texto), true);
fs.rmSync(tmp, { recursive: true, force: true });

console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
