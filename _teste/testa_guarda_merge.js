/* testa_guarda_merge.js
 *
 * O guarda de merge no CI (_teste/guarda_merge.js e .github/workflows/guarda-merge.yml),
 * sem rede: gh e git FALSOS de caminho absoluto (GH=, GIT= terminados em .js).
 *
 * 1. Um PR: pending no começo e o veredito no fim, na cabeça que julgou;
 *    recusado publica failure com o primeiro motivo; cabeça que andou não
 *    publica o veredito; workflow_run sem número acha o PR pelo sha; sem PR não
 *    publica; fork é pulado sem publicar nada; publicar que falha sai 1; o
 *    merge NUNCA é chamado; descrição até 140.
 * 2. A main andou: todos os PRs abertos são rejulgados. O caso da revisão: dois
 *    PRs sobem para a MESMA versão, o primeiro entra, e o segundo, que tinha
 *    success, passa a failure; o PR só de teste continua success.
 * 3. O guarda não julga a si mesmo (com controle sem a regra).
 * 4. O workflow: só código da main (pull_request_target, nunca pull_request),
 *    nenhum checkout da cabeça do PR, os quatro gatilhos, o modo "todos" no push,
 *    um grupo por PR, só a escrita de status, fork fora, e nada de strict.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { decidir } = require('./merge_seguro.js');

let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}

// A árvore do merge falsa é a cabeça de trás para frente: distinta para cada
// cabeça e reconhecível no diff e no show.
const A = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
const B = 'b1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
const C = 'c1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
const OUTRA = 'd1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
function pr(numero, cabeca, extra) {
  return Object.assign({
    number: numero, state: 'OPEN', isDraft: false, baseRefName: 'main', headRefOid: cabeca, isCrossRepository: false,
    labels: [{ name: 'navegador' }],
    commits: [{ oid: cabeca, committedDate: '2026-10-26T12:00:00Z' }],
    statusCheckRollup: [
      { __typename: 'CheckRun', name: 'portao-rapido', status: 'COMPLETED', conclusion: 'SUCCESS', startedAt: '2026-10-26T12:02:00Z' },
      { __typename: 'CheckRun', name: 'portao-navegador', status: 'COMPLETED', conclusion: 'SUCCESS', startedAt: '2026-10-26T12:02:00Z' }
    ],
    comments: [{ body: 'Revisão adversarial, commit ' + cabeca.slice(0, 7) + '.\nveredito: aprova', createdAt: '2026-10-26T12:40:00Z', authorAssociation: 'OWNER' }]
  }, extra || {});
}

console.log('\n=== 3. O guarda não julga a si mesmo ===');
let p = pr(9, A);
p.statusCheckRollup.push({ __typename: 'StatusContext', context: 'portao-merge', state: 'FAILURE', createdAt: '2026-10-26T12:30:00Z' });
p.statusCheckRollup.push({ __typename: 'CheckRun', name: 'guarda-merge', status: 'IN_PROGRESS', conclusion: '', startedAt: '2026-10-26T12:50:00Z' });
conf('status portao-merge vermelho e job guarda-merge em andamento não recusam', decidir(p).ok, true);
p = pr(9, A);
p.statusCheckRollup.push({ __typename: 'StatusContext', context: 'outro-ci', state: 'FAILURE', createdAt: '2026-10-26T12:30:00Z' });
conf('controle: outro status vermelho continua recusando', decidir(p).ok, false);
const fonte = fs.readFileSync(path.join(__dirname, 'merge_seguro.js'), 'utf8');
const semRegra = fonte.replace(/ *if \(GUARDA\.indexOf\(nome\) >= 0\) return;\r?\n/, '');
conf('controle: achei a regra do guarda para tirar', semRegra !== fonte, true);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'guarda_merge_'));
fs.writeFileSync(path.join(tmp, 'merge_seguro_sem_regra.js'), semRegra);
p = pr(9, A);
p.statusCheckRollup.push({ __typename: 'StatusContext', context: 'portao-merge', state: 'FAILURE', createdAt: '2026-10-26T12:30:00Z' });
conf('controle: sem a regra, o próprio status vermelho recusaria para sempre', require(path.join(tmp, 'merge_seguro_sem_regra.js')).decidir(p).ok, false);

// gh e git falsos. O estado do mundo vem de um JSON (MUNDO): os PRs abertos, os
// valores da main e, por cabeça, o que o merge leva e os valores dele.
const ghFalso = path.join(tmp, 'gh_falso.js');
const gitFalso = path.join(tmp, 'git_falso.js');
const log = path.join(tmp, 'gh.txt');
const mundoArq = path.join(tmp, 'mundo.json');
const vistas = path.join(tmp, 'vistas.json');
fs.writeFileSync(ghFalso, [
  "const fs = require('fs');",
  "const a = process.argv.slice(2);",
  "fs.appendFileSync(process.env.FALSO_LOG, JSON.stringify(a) + '\\n');",
  "const m = JSON.parse(fs.readFileSync(process.env.FALSO_MUNDO, 'utf8'));",
  "const campos = a[a.indexOf('--json') + 1] || '';",
  "if (a[0] === 'pr' && a[1] === 'view') {",
  "  const n = a[2]; const p = m.prs[n];",
  "  if (!p) { process.stderr.write('no pull requests found'); process.exit(1); }",
  "  if (/statusCheckRollup/.test(campos)) { process.stdout.write(JSON.stringify(p)); process.exit(0); }",
  // a segunda leitura curta do guarda pode ver a cabeça nova (cabecaDepois)
  "  const v = fs.existsSync(process.env.FALSO_VISTAS) ? JSON.parse(fs.readFileSync(process.env.FALSO_VISTAS, 'utf8')) : {};",
  "  v[n] = (v[n] || 0) + 1; fs.writeFileSync(process.env.FALSO_VISTAS, JSON.stringify(v));",
  "  const cab = v[n] >= 2 && m.cabecaDepois && m.cabecaDepois[n] ? m.cabecaDepois[n] : p.headRefOid;",
  "  process.stdout.write(JSON.stringify({ number: p.number, headRefOid: cab, isCrossRepository: !!p.isCrossRepository, state: p.state, baseRefName: p.baseRefName }));",
  "} else if (a[0] === 'pr' && a[1] === 'list' && a.indexOf('--search') >= 0) {",
  "  const sha = a[a.indexOf('--search') + 1];",
  "  process.stdout.write(JSON.stringify(Object.values(m.prs).filter(p => p.headRefOid === sha).map(p => ({ number: p.number, headRefOid: p.headRefOid }))));",
  "} else if (a[0] === 'pr' && a[1] === 'list') {",
  "  if (m.listaErro) { process.stderr.write('HTTP 502'); process.exit(1); }",
  "  process.stdout.write(JSON.stringify(Object.values(m.prs).filter(p => p.state === 'OPEN').map(p => ({ number: p.number }))));",
  "} else if (a[0] === 'api' && a[1] === '-X' && /\\/statuses\\//.test(a[3])) {",
  "  if (m.statusErro) { process.stderr.write('HTTP 403'); process.exit(1); }",
  "  process.stdout.write('{}');",
  "} else if (a[0] === 'api') process.stdout.write(JSON.stringify({ behind_by: 0 }));",
  "else { process.stderr.write('gh: chamada inesperada ' + a.join(' ')); process.exit(3); }"
].join('\n') + '\n');
fs.writeFileSync(gitFalso, [
  "const fs = require('fs');",
  "const a = process.argv.slice(2);",
  "const m = JSON.parse(fs.readFileSync(process.env.FALSO_MUNDO, 'utf8'));",
  "const arvore = s => s.split('').reverse().join('');",
  "const daArvore = t => Object.keys(m.merge).find(s => arvore(s) === t);",
  "const sw = c => \"var ARQUIVOS = [\\n  './',\\n  './tela.js'\\n];\\nvar CACHE = 'apoio-educacional-v\" + c + \"';\\n\";",
  "const app = v => \"  var VERSAO = '\" + v + \"';\\n\";",
  "if (a[0] === 'fetch') {}",
  "else if (a[0] === 'merge-tree') process.stdout.write(arvore(a[3]) + '\\n');",
  "else if (a[0] === 'diff') { const s = daArvore(a[4]); process.stdout.write((m.merge[s].levados || []).map(f => f + '\\0').join('')); }",
  "else if (a[0] === 'show') {",
  "  const [rev, arq] = a[1].split(':');",
  "  const v = rev === 'origin/main' ? m.main : m.merge[daArvore(rev)];",
  "  if (!v) { process.stderr.write('fatal: revisao inesperada ' + rev); process.exit(128); }",
  "  process.stdout.write(arq === 'sw.js' ? sw(v.cache) : app(v.versao));",
  "} else { process.stderr.write('git: chamada inesperada ' + a.join(' ')); process.exit(3); }"
].join('\n') + '\n');

const script = path.join(__dirname, 'guarda_merge.js');
function rodar(mundo, env) {
  fs.writeFileSync(mundoArq, JSON.stringify(mundo));
  fs.writeFileSync(log, '');
  if (fs.existsSync(vistas)) fs.unlinkSync(vistas);
  let codigo = 0, saida = '';
  try {
    saida = execFileSync(process.execPath, [script], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: Object.assign({}, process.env,
      { GH: ghFalso, GIT: gitFalso, FALSO_LOG: log, FALSO_MUNDO: mundoArq, FALSO_VISTAS: vistas, REPO_MERGE_SEGURO: 'dono/repo',
        MODO: 'um', PR_NUM: '9', SHA_DO_EVENTO: '', URL_DA_RODADA: 'https://exemplo/rodada/1' }, env || {}) });
  } catch (e) { codigo = e.status; saida = String(e.stdout || '') + String(e.stderr || ''); }
  const chamadas = fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
  const campo = (c, k) => { const x = c.find(v => String(v).indexOf(k + '=') === 0); return x === undefined ? null : String(x).slice(k.length + 1); };
  const status = chamadas.filter(c => c[0] === 'api' && c[1] === '-X')
    .map(c => ({ sha: c[3].split('/').pop(), estado: campo(c, 'state'), contexto: campo(c, 'context'), descricao: campo(c, 'description'), url: campo(c, 'target_url') }));
  return { codigo, saida, chamadas, status };
}
const V = (cache, versao, levados) => ({ cache, versao, levados: levados || [] });
const mundoUm = (prs, merge, main, extra) => Object.assign({ prs, merge, main }, extra || {});
const so = (r, sha) => r.status.filter(s => s.sha === sha).map(s => s.estado).join(',');
const merge = r => r.chamadas.some(c => c[0] === 'pr' && c[1] === 'merge');

console.log('\n=== 1. Um PR ===');
let r = rodar(mundoUm({ 9: pr(9, A) }, { [A]: V(135, '1.42.55', ['app.js']) }, V(134, '1.42.54')));
conf('aprovado sai 0', r.codigo, 0);
conf('pending no começo, success no fim, na cabeça que julgou', so(r, A), 'pending,success');
conf('contexto portao-merge e o link da rodada', r.status.every(s => s.contexto === 'portao-merge' && s.url === 'https://exemplo/rodada/1'), true);
conf('o merge nunca é chamado', merge(r), false);

p = pr(9, A); p.comments = [];
r = rodar(mundoUm({ 9: p }, { [A]: V(135, '1.42.55', ['app.js']) }, V(134, '1.42.54')));
conf('recusado sai 0 (recusa não é erro do job)', r.codigo, 0);
conf('recusado: pending e depois failure', so(r, A), 'pending,failure');
conf('com o primeiro motivo na descrição', /falta revisao adversarial/.test(r.status[1] && r.status[1].descricao), true);
conf('a descrição cabe em 140', r.status.every(s => Array.from(s.descricao || '').length <= 140), true);
conf('recusado também nunca chama o merge', merge(r), false);

r = rodar(mundoUm({ 9: pr(9, A) }, { [A]: V(135, '1.42.55', ['app.js']) }, V(134, '1.42.54'), { cabecaDepois: { 9: OUTRA } }));
conf('cabeça que andou durante a conferência: só o pending, sem veredito', so(r, A), 'pending');
conf('e diz por que', /a cabeça mudou de/.test(r.saida), true);

r = rodar(mundoUm({ 9: pr(9, A) }, { [A]: V(135, '1.42.55', ['app.js']) }, V(134, '1.42.54')), { PR_NUM: '', SHA_DO_EVENTO: A });
conf('workflow_run sem número acha o PR pelo sha e publica', so(r, A), 'pending,success');
r = rodar(mundoUm({ 9: pr(9, A) }, { [A]: V(135, '1.42.55') }, V(134, '1.42.54')), { PR_NUM: '', SHA_DO_EVENTO: OUTRA });
conf('sem PR aberto para o sha: sai 0 e não publica', r.codigo === 0 && r.status.length === 0 && /nada a julgar/.test(r.saida), true);

r = rodar(mundoUm({ 9: pr(9, A, { isCrossRepository: true }) }, { [A]: V(135, '1.42.55') }, V(134, '1.42.54')));
conf('PR de fork: sai 0 e não publica nada', r.codigo === 0 && r.status.length === 0, true);
conf('PR de fork: diz por que', /vem de fork/.test(r.saida), true);
conf('PR de fork: nem roda o merge_seguro', r.chamadas.filter(c => c[0] === 'pr' && c[1] === 'view').length, 1);

r = rodar(mundoUm({ 9: pr(9, A) }, { [A]: V(135, '1.42.55') }, V(134, '1.42.54'), { statusErro: true }));
conf('publicar que falha sai 1', r.codigo, 1);
conf('e diz que não publicou', /não consegui publicar/.test(r.saida), true);

console.log('\n=== 2. A main andou: todos os PRs abertos são rejulgados ===');
// Antes: main em v133 / 1.42.53. O #10 e o #11 sobem os dois para v134 / 1.42.54;
// o #12 é só de teste. Os três recebem success.
const prs = { 10: pr(10, A), 11: pr(11, B), 12: pr(12, C) };
const antes = { [A]: V(134, '1.42.54', ['app.js', 'sw.js']), [B]: V(134, '1.42.54', ['app.js', 'sw.js']), [C]: V(133, '1.42.53') };
r = rodar(mundoUm(prs, antes, V(133, '1.42.53')), { MODO: 'todos' });
conf('antes: os três aprovados', [so(r, A), so(r, B), so(r, C)].join(' | '), 'pending,success | pending,success | pending,success');
// O #10 entra: a main vai a v134 / 1.42.54 e o push dispara o rejulgamento.
const depois = { 11: prs[11], 12: prs[12] };
const mergeDepois = { [B]: V(134, '1.42.54', ['app.js', 'sw.js']), [C]: V(134, '1.42.54') };
r = rodar(mundoUm(depois, mergeDepois, V(134, '1.42.54')), { MODO: 'todos' });
conf('depois do push: rejulga os PRs abertos', /rejulgo 2 PR/.test(r.saida), true);
conf('o #11, com a MESMA versão que entrou, vira failure', so(r, B), 'pending,failure');
conf('e o motivo é a versão igual', /igual/.test((r.status.find(s => s.sha === B && s.estado === 'failure') || {}).descricao), true);
conf('o #12, só de teste, segue success', so(r, C), 'pending,success');
conf('nenhum merge', merge(r), false);
// Controle: sem o rejulgamento (só o modo "um" do #11 antigo), nada muda no #11.
conf('controle: sem push na main, ninguém publica no #11', rodar(mundoUm(depois, mergeDepois, V(134, '1.42.54')), { PR_NUM: '12' }).status.some(s => s.sha === B), false);
r = rodar(mundoUm(prs, antes, V(133, '1.42.53'), { listaErro: true }), { MODO: 'todos' });
conf('lista que falha no modo todos sai 1, sem publicar', r.codigo === 1 && r.status.length === 0, true);
r = rodar(mundoUm({ 11: pr(11, B, { isCrossRepository: true }), 12: prs[12] }, mergeDepois, V(134, '1.42.54')), { MODO: 'todos' });
conf('no modo todos, o fork é pulado e o resto julgado', !r.status.some(s => s.sha === B) && so(r, C) === 'pending,success', true);

console.log('\n=== 4. O workflow ===');
const yml = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'guarda-merge.yml'), 'utf8').replace(/\r/g, '');
const codigoYml = yml.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
conf('dispara em pull_request_target', /^  pull_request_target:/m.test(codigoYml), true);
conf('NÃO dispara em pull_request (código do PR)', /^  pull_request:/m.test(codigoYml), false);
conf('dispara em issue_comment', /^  issue_comment:/m.test(codigoYml), true);
conf('dispara na conclusão da bateria (workflow_run do portao)', /^  workflow_run:\n    workflows: \[portao\]\n    types: \[completed\]/m.test(codigoYml), true);
conf('dispara no push da main', /^  push:\n    branches: \[main\]/m.test(codigoYml), true);
conf('o push roda o modo todos', /MODO: \$\{\{ github\.event_name == 'push' && 'todos' \|\| 'um' \}\}/.test(codigoYml), true);
// Nenhum checkout da cabeça do PR: um checkout só, sem ref nem repository, e
// nenhuma menção à cabeça ou ao ramo do PR fora do "if" do fork.
const checkouts = codigoYml.match(/uses: actions\/checkout@/g) || [];
conf('um checkout só', checkouts.length, 1);
const blocoCheckout = (codigoYml.match(/uses: actions\/checkout@v4\n(?:        .*\n)*/) || [''])[0];
conf('o checkout não escolhe ref nem repositório (fica a main)', /\bref:|repository:/.test(blocoCheckout), false);
const semIfDoFork = codigoYml.replace("github.event.pull_request.head.repo.full_name == github.repository", '');
conf('nada de head.sha, head.ref ou refs/pull no workflow', /head\.sha|head\.ref|head_ref|refs\/pull|pull_request\.head/.test(semIfDoFork), false);
conf('o fork fica de fora no próprio if', /github\.event\.pull_request\.head\.repo\.full_name == github\.repository/.test(codigoYml), true);
conf('pode publicar status', /^  statuses: write$/m.test(codigoYml), true);
conf('não pede escrita além do status', (codigoYml.match(/: write$/gm) || []).length, 1);
conf('roda o guarda_merge.js', /run: node _teste\/guarda_merge\.js/.test(codigoYml), true);
const grupo = (codigoYml.match(/group: (.*)/) || [])[1] || '';
conf('um grupo por PR para os três eventos de PR, e um para o push',
  ['pull_request.number', 'issue.number', 'workflow_run.pull_requests[0].number', "github.event_name == 'push' && 'main'"].every(s => grupo.indexOf(s) >= 0), true);
conf('nada de strict', /strict/i.test(codigoYml), false);
conf('não exige nem cita o portao-navegador fora dos comentários', /portao-navegador/.test(codigoYml), false);
conf('o job se chama guarda-merge, o nome que o merge_seguro ignora', /^  guarda-merge:/m.test(codigoYml), true);

fs.rmSync(tmp, { recursive: true, force: true });
console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
