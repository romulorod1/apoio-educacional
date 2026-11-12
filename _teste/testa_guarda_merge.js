/* testa_guarda_merge.js
 *
 * O guarda de merge no CI (_teste/guarda_merge.sh e .github/workflows/guarda-merge.yml),
 * sem rede: gh e git FALSOS de caminho absoluto (GH=, GIT= terminados em .js).
 *
 * 1. Ponta a ponta do guarda_merge.sh: aprovado publica success na cabeca;
 *    recusado publica failure com o motivo; cabeca que andou durante a conferencia
 *    nao publica; workflow_run sem numero acha o PR pelo sha; sem PR nao publica;
 *    publicar que falha sai 1; o merge NUNCA e chamado; descricao ate 140.
 * 2. O guarda nao julga a si mesmo: o status portao-merge vermelho e o job
 *    guarda-merge em andamento nao recusam (com controle: sem a regra, recusam).
 * 3. O workflow: os tres gatilhos, a permissao de status, o mesmo grupo de
 *    concorrencia para os tres, e nada de strict nem de exigir portao-navegador.
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

const CABECA = 'abc1234def5678abc1234def5678abc1234def56';
const OUTRA = '9999999def5678abc1234def5678abc1234def56';
function prBom() {
  return {
    number: 9, state: 'OPEN', isDraft: false, baseRefName: 'main', headRefOid: CABECA,
    labels: [{ name: 'navegador' }],
    commits: [{ oid: CABECA, committedDate: '2026-10-26T12:00:00Z' }],
    statusCheckRollup: [
      { __typename: 'CheckRun', name: 'portao-rapido', status: 'COMPLETED', conclusion: 'SUCCESS', startedAt: '2026-10-26T12:02:00Z' },
      { __typename: 'CheckRun', name: 'portao-navegador', status: 'COMPLETED', conclusion: 'SUCCESS', startedAt: '2026-10-26T12:02:00Z' }
    ],
    comments: [{ body: 'Revisão adversarial, commit abc1234.\nveredito: aprova', createdAt: '2026-10-26T12:40:00Z', authorAssociation: 'OWNER' }]
  };
}

console.log('\n=== 2. O guarda nao julga a si mesmo ===');
let p = prBom();
p.statusCheckRollup.push({ __typename: 'StatusContext', context: 'portao-merge', state: 'FAILURE', createdAt: '2026-10-26T12:30:00Z' });
p.statusCheckRollup.push({ __typename: 'CheckRun', name: 'guarda-merge', status: 'IN_PROGRESS', conclusion: '', startedAt: '2026-10-26T12:50:00Z' });
conf('status portao-merge vermelho e job guarda-merge em andamento nao recusam', decidir(p).ok, true);
p = prBom();
p.statusCheckRollup.push({ __typename: 'StatusContext', context: 'outro-ci', state: 'FAILURE', createdAt: '2026-10-26T12:30:00Z' });
conf('controle: outro status vermelho continua recusando', decidir(p).ok, false);
// Controle da regra: a mesma fonte sem a linha do GUARDA recusa o caso acima.
const fonte = fs.readFileSync(path.join(__dirname, 'merge_seguro.js'), 'utf8');
const semRegra = fonte.replace('    if (GUARDA.indexOf(nome) >= 0) return;\n', '').replace('    if (GUARDA.indexOf(nome) >= 0) return;\r\n', '');
conf('controle: achei a regra do guarda para tirar', semRegra !== fonte, true);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'guarda_merge_'));
fs.writeFileSync(path.join(tmp, 'merge_seguro_sem_regra.js'), semRegra);
const semRegraMod = require(path.join(tmp, 'merge_seguro_sem_regra.js'));
p = prBom();
p.statusCheckRollup.push({ __typename: 'StatusContext', context: 'portao-merge', state: 'FAILURE', createdAt: '2026-10-26T12:30:00Z' });
conf('controle: sem a regra, o proprio status vermelho recusaria para sempre', semRegraMod.decidir(p).ok, false);

console.log('\n=== 1. Ponta a ponta do guarda_merge.sh ===');
const ghFalso = path.join(tmp, 'gh_falso.js');
const gitFalso = path.join(tmp, 'git_falso.js');
const log = path.join(tmp, 'gh.txt');
const prJson = path.join(tmp, 'pr.json');
fs.writeFileSync(ghFalso,
  "const fs = require('fs');\n" +
  "const a = process.argv.slice(2);\n" +
  "fs.appendFileSync(process.env.FALSO_LOG, JSON.stringify(a) + '\\n');\n" +
  "const pr = JSON.parse(fs.readFileSync(process.env.FALSO_PR, 'utf8'));\n" +
  "if (a[0] === 'pr' && a[1] === 'view' && a.indexOf('headRefOid') >= 0 && a.indexOf('--jq') >= 0) process.stdout.write((process.env.FALSO_CABECA_DEPOIS || pr.headRefOid) + '\\n');\n" +
  "else if (a[0] === 'pr' && a[1] === 'view') process.stdout.write(JSON.stringify(pr));\n" +
  "else if (a[0] === 'pr' && a[1] === 'list') process.stdout.write(process.env.FALSO_LISTA || '');\n" +
  "else if (a[0] === 'api' && a[1] === '-X' && /\\/statuses\\//.test(a[3])) { if (process.env.FALSO_STATUS === 'erro') { process.stderr.write('HTTP 403'); process.exit(1); } process.stdout.write('{}'); }\n" +
  "else if (a[0] === 'api') process.stdout.write(JSON.stringify({ behind_by: 0 }));\n" +
  "else { process.stderr.write('gh: chamada inesperada ' + a.join(' ')); process.exit(3); }\n");
fs.writeFileSync(gitFalso,
  "const a = process.argv.slice(2);\n" +
  "const ARVORE = 'a'.repeat(40);\n" +
  "if (a[0] === 'fetch') {}\n" +
  "else if (a[0] === 'merge-tree') process.stdout.write(ARVORE + '\\n');\n" +
  "else if (a[0] === 'diff') process.stdout.write('');\n" +
  "else if (a[0] === 'show' && /sw\\.js$/.test(a[1])) process.stdout.write(\"var ARQUIVOS = [\\n  './'\\n];\\nvar CACHE = 'apoio-educacional-v133';\\n\");\n" +
  "else if (a[0] === 'show' && /app\\.js$/.test(a[1])) process.stdout.write(\"  var VERSAO = '1.42.53';\\n\");\n" +
  "else { process.stderr.write('git: chamada inesperada ' + a.join(' ')); process.exit(3); }\n");
const script = path.join(__dirname, 'guarda_merge.sh');
function rodar(pr, env) {
  fs.writeFileSync(prJson, JSON.stringify(pr));
  fs.writeFileSync(log, '');
  let codigo = 0, saida = '';
  try {
    saida = execFileSync('sh', [script], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: Object.assign({}, process.env,
      { GH: ghFalso, GIT: gitFalso, FALSO_LOG: log, FALSO_PR: prJson, REPO_MERGE_SEGURO: 'dono/repo',
        PR_NUM: '9', SHA_DO_EVENTO: '', URL_DA_RODADA: 'https://exemplo/rodada/1' }, env || {}) });
  } catch (e) {
    // sem sh no PATH (PowerShell puro) o status vem null: diz isso, em vez de
    // quinze falhas que parecem do guarda
    if (e.status === null || e.status === undefined) throw new Error('nao consegui rodar o sh: ' + e.message);
    codigo = e.status; saida = String(e.stdout || '') + String(e.stderr || '');
  }
  const chamadas = fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
  const status = chamadas.filter(c => c[0] === 'api' && c[1] === '-X');
  const campo = (c, k) => { const i = c.indexOf(k + '=') >= 0 ? -1 : c.findIndex(x => String(x).indexOf(k + '=') === 0); return i >= 0 ? String(c[i]).slice(k.length + 1) : null; };
  return { codigo, saida, chamadas, status, campo };
}
let r = rodar(prBom());
conf('aprovado sai 0', r.codigo, 0);
conf('aprovado publica UM status', r.status.length, 1);
conf('na cabeca que julgou', r.status[0] && r.status[0][3], 'repos/dono/repo/statuses/' + CABECA);
conf('estado success, contexto portao-merge', r.status[0] && [r.campo(r.status[0], 'state'), r.campo(r.status[0], 'context')].join(' '), 'success portao-merge');
conf('com o link da rodada', r.status[0] && r.campo(r.status[0], 'target_url'), 'https://exemplo/rodada/1');
conf('o merge nunca e chamado', r.chamadas.some(c => c[0] === 'pr' && c[1] === 'merge'), false);

p = prBom(); p.comments = [];
r = rodar(p);
conf('recusado sai 0 (recusa nao e erro do job)', r.codigo, 0);
conf('recusado publica failure', r.status[0] && r.campo(r.status[0], 'state'), 'failure');
conf('com o primeiro motivo na descricao', /falta revisao adversarial/.test(r.status[0] && r.campo(r.status[0], 'description')), true);
conf('a descricao cabe em 140', Array.from((r.status[0] && r.campo(r.status[0], 'description')) || '').length <= 140, true);
conf('recusado tambem nunca chama o merge', r.chamadas.some(c => c[0] === 'pr' && c[1] === 'merge'), false);

r = rodar(prBom(), { FALSO_CABECA_DEPOIS: OUTRA });
conf('cabeca que andou durante a conferencia: sai 0 e NAO publica', r.codigo === 0 && r.status.length === 0, true);
conf('e diz por que', /mudou de/.test(r.saida), true);

r = rodar(prBom(), { PR_NUM: '', SHA_DO_EVENTO: CABECA, FALSO_LISTA: '9\n' });
conf('workflow_run sem numero acha o PR pelo sha e publica', r.status.length === 1 && r.chamadas.some(c => c[0] === 'pr' && c[1] === 'list'), true);
r = rodar(prBom(), { PR_NUM: '', SHA_DO_EVENTO: CABECA, FALSO_LISTA: '' });
conf('sem PR aberto para o sha: sai 0 e nao publica', r.codigo === 0 && r.status.length === 0 && /nada a julgar/.test(r.saida), true);

r = rodar(prBom(), { FALSO_STATUS: 'erro' });
conf('publicar que falha sai 1', r.codigo, 1);
conf('e diz que nao publicou', /nao consegui publicar/.test(r.saida), true);

p = prBom(); p.comments = []; p.statusCheckRollup = [];
r = rodar(p);
conf('recusa com varios motivos publica so o primeiro, inteiro e curto',
  r.status.length === 1 && Array.from(r.campo(r.status[0], 'description') || '').length <= 140, true);

console.log('\n=== 3. O workflow ===');
const yml = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'guarda-merge.yml'), 'utf8').replace(/\r/g, '');
const semComentario = yml.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
conf('dispara em pull_request', /^  pull_request:/m.test(semComentario), true);
conf('dispara em issue_comment', /^  issue_comment:/m.test(semComentario), true);
conf('dispara na conclusao da bateria (workflow_run do portao)', /^  workflow_run:\n    workflows: \[portao\]\n    types: \[completed\]/m.test(semComentario), true);
conf('pode publicar status', /^  statuses: write$/m.test(semComentario), true);
conf('nao pede escrita alem do status', (semComentario.match(/: write$/gm) || []).length, 1);
conf('roda o guarda_merge.sh', /run: sh _teste\/guarda_merge\.sh/.test(semComentario), true);
const grupo = (semComentario.match(/group: (.*)/) || [])[1] || '';
conf('um grupo de concorrencia so para os tres eventos (numero do PR em todos)',
  ['pull_request.number', 'issue.number', 'workflow_run.pull_requests[0].number'].every(s => grupo.indexOf(s) >= 0), true);
conf('nada de strict', /strict/i.test(semComentario), false);
conf('nao exige nem cita o portao-navegador fora dos comentarios', /portao-navegador/.test(semComentario), false);
const mesmoNome = /^  guarda-merge:/m.test(semComentario);
conf('o job se chama guarda-merge, o nome que o merge_seguro ignora', mesmoNome, true);

fs.rmSync(tmp, { recursive: true, force: true });
console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
