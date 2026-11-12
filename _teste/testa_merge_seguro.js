/* testa_merge_seguro.js
 *
 * A regra do merge seguro (_teste/merge_seguro.js), sem rede e sem o gh de
 * verdade. Duas partes:
 *
 * 1. A decisao, pura: o PR que cumpre tudo passa, e cada exigencia tirada uma
 *    de cada vez TEM de recusar, pelo motivo dela. Um caso que so passa nao
 *    prova nada: uma regra que aprovasse tudo passaria nele.
 * 2. Ponta a ponta com um gh FALSO de caminho absoluto (GH=<arquivo .js>):
 *    recusado nao chama merge; aprovado chama merge com --match-head-commit e
 *    o commit da cabeca. O falso grava cada chamada num arquivo, e e esse
 *    arquivo que se confere.
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
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}

const CABECA = 'abc1234def5678abc1234def5678abc1234def56';
function prBom() {
  return {
    number: 9, state: 'OPEN', isDraft: false, baseRefName: 'main', headRefOid: CABECA,
    labels: [{ name: 'navegador' }, { name: 'risco' }],
    commits: [{ oid: 'velho', committedDate: '2026-10-26T10:00:00Z' },
              { oid: CABECA, committedDate: '2026-10-26T12:00:00Z' }],
    statusCheckRollup: [
      { __typename: 'CheckRun', name: 'portao-rapido', status: 'COMPLETED', conclusion: 'CANCELLED', startedAt: '2026-10-26T12:01:00Z' },
      { __typename: 'CheckRun', name: 'portao-rapido', status: 'COMPLETED', conclusion: 'SUCCESS', startedAt: '2026-10-26T12:02:00Z' },
      { __typename: 'CheckRun', name: 'portao-navegador', status: 'COMPLETED', conclusion: 'SUCCESS', startedAt: '2026-10-26T12:02:00Z' }
    ],
    comments: [
      { body: 'Rodado nesta máquina, porta 8777.\nPortão inteiro abc1234: TUDO PASSOU.\nPode seguir para o merge.', createdAt: '2026-10-26T12:30:00Z', authorAssociation: 'OWNER' },
      { body: 'Revisão adversarial (lente backend), commit abc1234. Nada bloqueia.\nveredito: aprova', createdAt: '2026-10-26T12:40:00Z', authorAssociation: 'OWNER' }
    ]
  };
}
const motivo = (pr, trecho) => decidir(pr).motivos.some(m => m.indexOf(trecho) >= 0);

console.log('\n=== 1. A decisao, dos dois lados ===');
conf('o PR que cumpre tudo passa', decidir(prBom()).ok, true);

let p = prBom(); p.state = 'MERGED';
conf('PR fechado recusa', motivo(p, 'nao esta aberto'), true);
p = prBom(); p.isDraft = true;
conf('rascunho recusa', motivo(p, 'rascunho'), true);
p = prBom(); p.baseRefName = 'outra';
conf('base que nao e main recusa', motivo(p, 'nao main'), true);

p = prBom(); p.statusCheckRollup[1].conclusion = 'FAILURE';
conf('portao-rapido vermelho recusa', motivo(p, 'portao-rapido nao esta verde'), true);
p = prBom(); p.statusCheckRollup = p.statusCheckRollup.filter(c => c.name !== 'portao-rapido');
conf('portao-rapido ausente recusa', motivo(p, 'portao-rapido nao esta verde (AUSENTE)'), true);
// A rodada mais NOVA decide: cancelada depois de verde recusa.
p = prBom(); p.statusCheckRollup[0].startedAt = '2026-10-26T12:09:00Z';
conf('rodada nova cancelada vence a velha verde', motivo(p, 'CANCELLED'), true);
p = prBom(); p.statusCheckRollup[2] = { __typename: 'CheckRun', name: 'portao-navegador', status: 'IN_PROGRESS', conclusion: '', startedAt: '2026-10-26T12:02:00Z' };
conf('check em andamento recusa', motivo(p, 'portao-navegador esta EM_ANDAMENTO'), true);

// POLITICA DE TESTES POR CHECKPOINT (09/11/2026): a bateria inteira roda no CI
// quando o PR leva o rotulo "pronto", e o merge exige o juntador portao-navegador
// VERDE na cabeca. Sem o rotulo o juntador nao roda: ausente ou pulado recusa.
// O comentario "Portão inteiro ... TUDO PASSOU" (rodado na maquina de quem
// trabalha) deixou de valer: o prBom ainda o traz, de proposito, e os casos
// abaixo tiram o check e provam que o comentario nao o substitui.
const semCheckInteiro = () => { const q = prBom(); q.statusCheckRollup = q.statusCheckRollup.filter(c => c.name !== 'portao-navegador'); return q; };
p = semCheckInteiro();
conf('PR sem a bateria inteira (check portao-navegador AUSENTE) e RECUSADO', decidir(p).ok, false);
conf('e o motivo diz ausente', motivo(p, 'portao-navegador esta AUSENTE'), true);
p = prBom(); p.statusCheckRollup[2].conclusion = 'SKIPPED';
conf('PR sem a bateria inteira (juncao PULADA) e RECUSADO', decidir(p).ok, false);
conf('e o motivo diz SKIPPED', motivo(p, 'portao-navegador esta SKIPPED'), true);
p = semCheckInteiro(); p.comments[0].body = 'Portão inteiro abc1234def5678: TUDO PASSOU';
conf('comentario "Portão inteiro ... TUDO PASSOU" nao substitui o check (ausente)', motivo(p, 'falta o portao inteiro'), true);
p = prBom(); p.statusCheckRollup[2].conclusion = 'SKIPPED';
conf('comentario "Portão inteiro ... TUDO PASSOU" nao substitui o check (pulado)', motivo(p, 'falta o portao inteiro'), true);
p = prBom(); p.statusCheckRollup[2].conclusion = 'NEUTRAL';
conf('juncao neutra nao e verde', decidir(p).ok, false);
p = prBom(); p.statusCheckRollup[2].conclusion = 'FAILURE';
conf('juncao vermelha recusa', decidir(p).ok, false);
conf('o PR com a juncao verde e a revisao passa', decidir(prBom()).ok, true);
// Rodada pulada mais nova (evento de rotulo que o workflow ignora) nao
// desbanca a rodada que terminou verde no mesmo commit...
p = prBom(); p.statusCheckRollup.push({ __typename: 'CheckRun', name: 'portao-navegador', status: 'COMPLETED', conclusion: 'SKIPPED', startedAt: '2026-10-26T12:20:00Z' });
conf('pulada mais nova nao desbanca a juncao verde do mesmo commit', decidir(p).ok, true);
// ...mas nao faz o contrario: pulada mais nova que uma VERMELHA nao a apaga,
p = prBom(); p.statusCheckRollup[2].conclusion = 'FAILURE';
p.statusCheckRollup.push({ __typename: 'CheckRun', name: 'portao-navegador', status: 'COMPLETED', conclusion: 'SKIPPED', startedAt: '2026-10-26T12:20:00Z' });
conf('pulada mais nova nao apaga a juncao vermelha', motivo(p, 'portao-navegador esta FAILURE'), true);
// e a verde mais nova vence a pulada mais velha.
p = prBom(); p.statusCheckRollup[2].conclusion = 'SKIPPED'; p.statusCheckRollup[2].startedAt = '2026-10-26T12:00:30Z';
p.statusCheckRollup.push({ __typename: 'CheckRun', name: 'portao-navegador', status: 'COMPLETED', conclusion: 'SUCCESS', startedAt: '2026-10-26T12:30:00Z' });
conf('verde mais nova vence a pulada mais velha', decidir(p).ok, true);
// So pulada, em todas as rodadas: continua pulada, e recusa.
p = prBom(); p.statusCheckRollup[2].conclusion = 'SKIPPED';
p.statusCheckRollup.push({ __typename: 'CheckRun', name: 'portao-navegador', status: 'COMPLETED', conclusion: 'SKIPPED', startedAt: '2026-10-26T12:20:00Z' });
conf('so rodadas puladas continuam recusando', decidir(p).ok, false);
// O portao em fatias (A4b, PR #80): uma fatia vermelha recusa, mesmo com a
// juncao verde por engano.
p = prBom();
p.statusCheckRollup.push({ __typename: 'CheckRun', name: 'portao-navegador (fatia 2 de 4)', status: 'COMPLETED', conclusion: 'FAILURE', startedAt: '2026-10-26T12:02:00Z' });
conf('uma fatia vermelha recusa', motivo(p, 'portao-navegador (fatia 2 de 4)'), true);
// O check do nivel 1 (provas mapeadas) pulado ou ausente nao atrapalha: quem
// vale e o juntador da bateria inteira.
p = prBom(); p.statusCheckRollup.push({ __typename: 'CheckRun', name: 'portao-tocadas', status: 'COMPLETED', conclusion: 'SKIPPED', startedAt: '2026-10-26T12:02:00Z' });
conf('o check do nivel 1 pulado nao recusa', decidir(p).ok, true);
p = prBom(); p.statusCheckRollup.push({ __typename: 'CheckRun', name: 'portao-tocadas', status: 'COMPLETED', conclusion: 'FAILURE', startedAt: '2026-10-26T12:02:00Z' });
conf('o check do nivel 1 vermelho recusa', motivo(p, 'portao-tocadas esta FAILURE'), true);

p = prBom(); p.comments = p.comments.filter(c => !/Revis/.test(c.body));
conf('sem revisao recusa', motivo(p, 'falta revisao adversarial'), true);
p = prBom(); p.comments[1].createdAt = '2026-10-26T11:00:00Z';
conf('revisao ANTES do ultimo commit recusa', motivo(p, 'falta revisao adversarial'), true);
p = prBom(); p.comments.push({ body: 'Revisão adversarial, segunda mão, abc1234.\nveredito: reprova', createdAt: '2026-10-26T12:50:00Z', authorAssociation: 'OWNER' });
conf('reprova depois do aprova recusa', motivo(p, 'mais recente reprova'), true);
p = prBom(); p.comments.push({ body: 'Revisão adversarial, segunda mão, abc1234.\nveredito: reprova', createdAt: '2026-10-26T12:35:00Z', authorAssociation: 'OWNER' });
conf('aprova depois do reprova passa', decidir(p).ok, true);
p = prBom(); p.comments[1].body = 'Nada bloqueia, abc1234. veredito: aprova';
conf('veredito fora de comentario de revisao adversarial nao vale', motivo(p, 'falta revisao adversarial'), true);
// Os dois furos que a revisao de 26/10 achou, como venenos.
// V1: revisao feita sobre o commit ANTERIOR, com data posterior ao relogio do
// commit novo (committedDate e a hora de quem commitou, nao a do push).
p = prBom(); p.comments[1].body = 'Revisão adversarial (lente backend), commit 9f9f9f9.\nveredito: aprova';
conf('revisao que cita outro commit recusa, mesmo com data depois', motivo(p, 'falta revisao adversarial'), true);
p = prBom(); p.comments[1].body = 'Revisão adversarial (lente backend). Nada bloqueia.\nveredito: aprova';
conf('revisao que nao cita commit nenhum recusa', motivo(p, 'falta revisao adversarial'), true);
// V2: a reprova que cita a regra antes de dar o veredito.
p = prBom(); p.comments[1].body = 'Revisão adversarial de abc1234. A regra pede "veredito: aprova"; não é o caso.\nveredito: reprova';
conf('vale o ULTIMO veredito do comentario', motivo(p, 'mais recente reprova'), true);
p = prBom(); p.comments[1].body = 'Revisão adversarial de abc1234. Por ora: veredito: aprova, falta conferir o resto.';
conf('veredito no meio de frase nao conta', motivo(p, 'falta revisao adversarial'), true);
p = prBom(); p.comments[1].body = 'Lido o diff de abc1234. Revisão adversarial feita.\nveredito: aprova';
conf('comentario que nao COMECA por "Revisão adversarial" nao vale', motivo(p, 'falta revisao adversarial'), true);
p = prBom(); p.commits[1].committedDate = '2026-10-26T12:45:00Z';
conf('revisao com data antes do ultimo commit recusa, mesmo citando a cabeca', motivo(p, 'falta revisao adversarial'), true);

console.log('\n=== 1a. Quem comenta, e onde o veredito mora (B13) ===');
// O repositorio e publico: comentario de conta de fora nao destrava nada.
p = prBom(); p.comments[1].authorAssociation = 'NONE';
conf('revisao de conta de fora recusa', motivo(p, 'falta revisao adversarial'), true);
p = prBom(); p.comments[1].authorAssociation = 'CONTRIBUTOR';
conf('revisao de quem so contribuiu um dia recusa', motivo(p, 'falta revisao adversarial'), true);
p = prBom(); delete p.comments[1].authorAssociation;
conf('revisao sem o campo de autor recusa', motivo(p, 'falta revisao adversarial'), true);
p = prBom(); p.comments[1].authorAssociation = 'COLLABORATOR';
conf('revisao de colaborador vale', decidir(p).ok, true);
// O veredito e a ULTIMA linha nao vazia, e uma reprova no corpo nao se desfaz.
p = prBom(); p.comments[1].body = 'Revisão adversarial de abc1234.\nveredito: aprova\n\nQualquer coisa me chama.';
conf('veredito que nao e a ultima linha nao vale', motivo(p, 'falta revisao adversarial'), true);
p = prBom(); p.comments[1].body = 'Revisão adversarial de abc1234.\nveredito: aprova\n\n';
conf('linhas vazias depois do veredito nao atrapalham', decidir(p).ok, true);
p = prBom(); p.comments[1].body = 'Revisão adversarial de abc1234.\nveredito: reprova\n\nParecer antigo, colado aqui:\nveredito: aprova';
conf('aprova antigo colado depois de um reprova recusa', motivo(p, 'mais recente reprova'), true);
p = prBom(); p.comments[1].body = 'Revisão adversarial de abc1234.\nveredito: reprova\n\n> veredito: aprova';
conf('citacao com > no fim nao e veredito', motivo(p, 'falta revisao adversarial'), true);

console.log('\n=== 1b. Datas nulas e StatusContext ===');
// O gh devolve 0001-01-01 em data nula. A rodada enfileirada do mesmo nome,
// sem data, e a mais nova: nao pode perder para a verde antiga.
p = prBom(); p.statusCheckRollup.push({ __typename: 'CheckRun', name: 'portao-rapido', status: 'QUEUED',
  conclusion: '', startedAt: '0001-01-01T00:00:00Z', completedAt: '0001-01-01T00:00:00Z' });
conf('rodada enfileirada com data zero vence a verde antiga', motivo(p, 'portao-rapido nao esta verde (EM_ANDAMENTO)'), true);
p = prBom(); p.statusCheckRollup.push({ __typename: 'StatusContext', context: 'outro-ci', state: 'PENDING', createdAt: '2026-10-26T12:03:00Z' });
conf('StatusContext pendente recusa', motivo(p, 'outro-ci esta PENDING'), true);
p = prBom(); p.statusCheckRollup.push({ __typename: 'StatusContext', context: 'outro-ci', state: 'SUCCESS', createdAt: '2026-10-26T12:03:00Z' });
conf('StatusContext verde passa', decidir(p).ok, true);

console.log('\n=== 2. Ponta a ponta com gh falso ===');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'merge_seguro_'));
const falso = path.join(tmp, 'gh_falso.js');
const log = path.join(tmp, 'chamadas.txt');
const json = path.join(tmp, 'pr.json');
fs.writeFileSync(falso,
  "const fs = require('fs');\n" +
  "const a = process.argv.slice(2);\n" +
  "fs.appendFileSync(process.env.FALSO_LOG, a.join(' ') + '\\n');\n" +
  "if (a[0] === 'api') {\n" +
  "  if (process.env.FALSO_BEHIND === 'erro') { process.stderr.write('HTTP 403: sem permissao'); process.exit(1); }\n" +
  "  process.stdout.write(JSON.stringify({ behind_by: Number(process.env.FALSO_BEHIND || 0), ahead_by: 1 }));\n" +
  "} else if (a[0] === 'pr' && a[1] === 'view') process.stdout.write(fs.readFileSync(process.env.FALSO_PR, 'utf8'));\n" +
  "else if (a[0] === 'pr' && a[1] === 'merge') process.stdout.write('merged\\n');\n" +
  "else { process.stderr.write('chamada inesperada'); process.exit(3); }\n");
// O git FALSO (GIT=<arquivo .js>): o fetch ok ou com erro, e o show devolve o
// arquivo que a prova diz ser o da main. Caminho absoluto, sem rede.
const gitFalso = path.join(tmp, 'git_falso.js');
const logGit = path.join(tmp, 'git_chamadas.txt');
fs.writeFileSync(gitFalso,
  "const fs = require('fs');\n" +
  "const a = process.argv.slice(2);\n" +
  "fs.appendFileSync(process.env.FALSO_GIT_LOG, a.join(' ') + '\\n');\n" +
  // A ordem do CACHE e da VERSAO: o merge-tree da main com a cabeca devolve a
  // arvore ARVORE, o diff dela contra a main devolve os levados, e o show de
  // sw.js e app.js sai da tabela FALSO_ORDEM (levados, merge, main). Sem a
  // tabela, nada e levado e os valores sao iguais (PR que nao toca o app).
  "const ARVORE = 'a'.repeat(40);\n" +
  "const t = process.env.FALSO_ORDEM ? JSON.parse(process.env.FALSO_ORDEM) : {};\n" +
  "if (a[0] === 'fetch') {\n" +
  "  if (process.env.FALSO_FETCH === 'erro') { process.stderr.write('fatal: unable to access origin'); process.exit(128); }\n" +
  "} else if (a[0] === 'show' && a[1] === 'origin/main:_teste/merge_seguro.js') {\n" +
  "  if (process.env.FALSO_SHOW === 'erro') { process.stderr.write('fatal: path not in origin/main'); process.exit(128); }\n" +
  "  process.stdout.write(fs.readFileSync(process.env.FALSO_MAIN, 'utf8'));\n" +
  "} else if (a[0] === 'merge-tree') {\n" +
  "  if (process.env.FALSO_ORDEM_ERRO === 'merge-tree') { process.stderr.write('CONFLICT (content): Merge conflict in sw.js'); process.exit(1); }\n" +
  "  if (a[2] !== 'origin/main' || a[3] !== process.env.FALSO_CABECA) { process.stderr.write('merge-tree inesperado ' + a.join(' ')); process.exit(3); }\n" +
  "  process.stdout.write(ARVORE + '\\n');\n" +
  "} else if (a[0] === 'diff') {\n" +
  "  if (a.join(' ') !== 'diff --name-only -z origin/main ' + ARVORE) { process.stderr.write('diff inesperado ' + a.join(' ')); process.exit(3); }\n" +
  "  process.stdout.write((t.levados || []).map(f => f + '\\0').join(''));\n" +
  "} else if (a[0] === 'show' && /:(sw|app)\\.js$/.test(a[1])) {\n" +
  "  const [rev, arq] = a[1].split(':');\n" +
  "  const qual = rev === 'origin/main' ? 'main' : rev === ARVORE ? 'merge' : null;\n" +
  "  if (!qual) { process.stderr.write('fatal: revisao inesperada ' + rev); process.exit(128); }\n" +
  "  const v = t[qual] || { cache: 133, versao: '1.42.53' };\n" +
  "  if (arq === 'sw.js') process.stdout.write(\"var ARQUIVOS = [\\n  './',\\n  './tela.js'\\n];\\nvar CACHE = 'apoio-educacional-v\" + v.cache + \"';\\n\");\n" +
  "  else process.stdout.write(\"(function () {\\n  var VERSAO = '\" + v.versao + \"';\\n})();\\n\");\n" +
  "} else { process.stderr.write('git: chamada inesperada'); process.exit(3); }\n");
const script = path.join(__dirname, 'merge_seguro.js');
function rodar(pr, extra, behind, scriptAlvo, git) {
  git = git || {};
  fs.writeFileSync(json, JSON.stringify(pr));
  fs.writeFileSync(log, '');
  fs.writeFileSync(logGit, '');
  let codigo = 0, saida = '';
  try {
    saida = execFileSync(process.execPath, [scriptAlvo || script, '9'].concat(extra || []), {
      encoding: 'utf8',
      env: Object.assign({}, process.env, { GH: falso, FALSO_LOG: log, FALSO_PR: json, FALSO_BEHIND: String(behind === undefined ? 0 : behind),
        GIT: gitFalso, FALSO_GIT_LOG: logGit, FALSO_MAIN: git.main || scriptAlvo || script,
        FALSO_FETCH: git.fetch || '', FALSO_SHOW: git.show || '',
        FALSO_CABECA: CABECA, FALSO_ORDEM: git.ordem ? JSON.stringify(git.ordem) : '', FALSO_ORDEM_ERRO: git.ordemErro || '' })
    });
  } catch (e) { codigo = e.status; saida = String(e.stdout || ''); }
  return { codigo, saida, chamadas: fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean),
    chamadasGit: fs.readFileSync(logGit, 'utf8').trim().split('\n').filter(Boolean) };
}
let r = rodar(prBom());
conf('aprovado sai 0', r.codigo, 0);
conf('e chama o merge', r.chamadas.filter(c => /^pr merge 9 /.test(c)).length, 1);
conf('com --match-head-commit e a cabeca',
  r.chamadas.some(c => c.indexOf('--match-head-commit ' + CABECA) >= 0), true);
p = prBom(); p.comments = [];
r = rodar(p);
conf('recusado sai 1', r.codigo, 1);
conf('e NAO chama o merge', r.chamadas.some(c => /^pr merge/.test(c)), false);
conf('e diz por que', /falta revisao adversarial/.test(r.saida), true);
// Ponta a ponta, o caso da politica de checkpoint: PR sem a bateria inteira
// (juncao pulada, ou ausente) e RECUSADO e o merge nao e chamado.
['SKIPPED', 'AUSENTE'].forEach(estadoJuncao => {
  p = prBom();
  if (estadoJuncao === 'AUSENTE') p.statusCheckRollup = p.statusCheckRollup.filter(c => c.name !== 'portao-navegador');
  else p.statusCheckRollup[2].conclusion = 'SKIPPED';
  r = rodar(p);
  conf('PR com a juncao ' + estadoJuncao + ' sai 1', r.codigo, 1);
  conf('PR com a juncao ' + estadoJuncao + ' NAO chama o merge', r.chamadas.some(c => /^pr merge/.test(c)), false);
  conf('PR com a juncao ' + estadoJuncao + ': a saida e RECUSADO e cita o portao inteiro', /RECUSADO/.test(r.saida) && /falta o portao inteiro/.test(r.saida), true);
});
r = rodar(prBom(), ['--conferir']);
conf('--conferir aprovado sai 0', r.codigo, 0);
conf('--conferir nunca chama o merge', r.chamadas.some(c => /^pr merge/.test(c)), false);
console.log('\n=== 3. Ramo atras da main (compare behind_by) ===');
r = rodar(prBom(), [], 3);
conf('atras recusa, sai 1', r.codigo, 1);
conf('com a mensagem e o N', /o ramo está 3 commits atrás da main: traga a main e espere o CI/.test(r.saida), true);
conf('atras NAO chama o merge', r.chamadas.some(c => /^pr merge/.test(c)), false);
conf('a medida usou o compare main...cabeca', r.chamadas.some(c => c.indexOf('api repos/') === 0 && c.indexOf('/compare/main...' + CABECA) >= 0), true);
r = rodar(prBom(), ['--conferir'], 3);
conf('atras recusa tambem no --conferir', r.codigo, 1);
r = rodar(prBom(), [], 0);
conf('em dia passa, sai 0', r.codigo, 0);
conf('em dia chama o merge', r.chamadas.filter(c => /^pr merge 9 /.test(c)).length, 1);
r = rodar(prBom(), [], 'erro');
conf('API que falha recusa, sai 1', r.codigo, 1);
conf('mostra a mensagem do erro', /HTTP 403: sem permissao/.test(r.saida), true);
conf('API que falha NAO chama o merge', r.chamadas.some(c => /^pr merge/.test(c)), false);
// Sem o rótulo risco (PR de tela, prova ou CI): atrás da main passa e nem mede.
function semRisco() { const q = prBom(); q.labels = [{ name: 'navegador' }]; return q; }
r = rodar(semRisco(), [], 3);
conf('sem risco, 3 atras passa e mergeia', r.codigo === 0 && r.chamadas.filter(c => /^pr merge 9 /.test(c)).length === 1, true);
conf('sem risco nem chama o compare', r.chamadas.some(c => /^api/.test(c)), false);
conf('sem risco avisa que nao conferiu', /sem o rótulo risco: não confiro se está atrás da main/.test(r.saida), true);
r = rodar(semRisco(), [], 'erro');
conf('sem risco, API quebrada nao importa: passa', r.codigo, 0);
p = semRisco(); delete p.labels;
r = rodar(p, ['--conferir'], 3);
conf('sem campo labels conta como sem risco', r.codigo, 0);
p = prBom(); p.labels = [{ name: 'RISCO' }];
r = rodar(p, [], 3);
conf('rotulo RISCO em maiuscula tambem recusa atras', r.codigo, 1);
p = prBom(); p.labels = [{ name: 'risco-baixo' }];
r = rodar(p, [], 3);
conf('rotulo parecido (risco-baixo) NAO e risco: passa', r.codigo, 0);
// A checagem vem depois das outras: PR recusado por outro motivo nem chama o compare.
p = prBom(); p.comments = [];
r = rodar(p, [], 3);
conf('recusa anterior vem antes e nao chama o compare', r.chamadas.some(c => /^api/.test(c)), false);
// Controle (veneno com nome): o mesmo caso ATRAS, num merge_seguro.js sem o
// bloco da checagem, PASSA e faz o merge. Prova que e a checagem que recusa.
const fonte = fs.readFileSync(script, 'utf8');
const sem = fonte.replace(/ *\/\/ BEHIND-INICIO[\s\S]*?\/\/ BEHIND-FIM\r?\n/, '');
conf('controle: achei o bloco da checagem para tirar', sem !== fonte, true);
const semBloco = path.join(tmp, 'merge_seguro_sem_atras.js');
fs.writeFileSync(semBloco, sem);
r = rodar(prBom(), [], 3, semBloco);
conf('controle: sem a checagem, o caso ATRAS passa e mergeia', r.codigo === 0 && r.chamadas.filter(c => /^pr merge/.test(c)).length === 1, true);
// Controle do rótulo: com ehRisco sempre falso, o PR de risco atrás passaria.
const semRotulo = fonte.replace(/function ehRisco\(pr\) \{\r?\n  return /, 'function ehRisco(pr) {\n  return false && ');
conf('controle: achei o ehRisco para envenenar', semRotulo !== fonte, true);
const arqSemRotulo = path.join(tmp, 'merge_seguro_sem_rotulo.js');
fs.writeFileSync(arqSemRotulo, semRotulo);
r = rodar(prBom(), [], 3, arqSemRotulo);
conf('controle: ignorando o rotulo, o risco ATRAS passa e mergeia', r.codigo === 0 && r.chamadas.filter(c => /^pr merge/.test(c)).length === 1, true);

console.log('\n=== 4. O merge_seguro e o da main? (cópia velha recusa) ===');
r = rodar(prBom(), ['--conferir']);
conf('cópia igual à da main passa para as checagens seguintes', r.codigo === 0 && /^ok /m.test(r.saida), true);
conf('fez o fetch da origin main e o show do arquivo', r.chamadasGit.slice(0, 2).join('|'), 'fetch origin main|show origin/main:_teste/merge_seguro.js');
// Fim de linha: a main em CRLF e a cópia em LF (e o inverso) são o mesmo conteúdo.
const principalMain = path.join(tmp, 'main_crlf.js');
fs.writeFileSync(principalMain, fonte.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n'));
r = rodar(prBom(), ['--conferir'], 0, undefined, { main: principalMain });
conf('só o fim de linha diferente (CRLF x LF) passa', r.codigo, 0);
// A cópia de antes do #137: sem o bloco BEHIND. Aqui, com a checagem de versão
// (a que a main passa a ter), mas desatualizada em relação à main.
const FRASE = 'este merge_seguro não é o da main atualizada: rode-o de uma pasta com a main em dia (git pull) e tente de novo';
const velha = path.join(tmp, 'merge_seguro.js');
fs.writeFileSync(velha, sem.replace(/\r\n/g, '\n').replace("const GIT = ", "const GIT = /* copia antiga */ "));
// A velha precisa achar os módulos como a main: __dirname é a tmp, sem dependências.
r = rodar(prBom(), ['--conferir'], 0, velha, { main: script });
conf('cópia DIFERENTE da main recusa, sai 1', r.codigo, 1);
conf('com a frase da regra', r.saida.indexOf(FRASE) >= 0, true);
conf('e sem dizer ok', /^ok /m.test(r.saida), false);
r = rodar(prBom(), [], 0, velha, { main: script });
conf('cópia diferente recusa também sem --conferir e NAO chama o merge', r.codigo === 1 && !r.chamadas.some(c => /^pr merge/.test(c)), true);
r = rodar(prBom(), ['--conferir'], 0, script, { fetch: 'erro' });
conf('fetch que falha recusa, sai 1', r.codigo, 1);
conf('mostra o erro do fetch', /unable to access origin/.test(r.saida), true);
conf('fetch que falha não vira ok', /^ok /m.test(r.saida), false);
r = rodar(prBom(), ['--conferir'], 0, script, { show: 'erro' });
conf('git show que falha recusa, sai 1', r.codigo, 1);
conf('mostra o erro do show', /path not in origin\/main/.test(r.saida), true);
// O CASO REAL: cópia velha, PR atrasado 9 commits por merge de outro PR.
r = rodar(prBom(), ['--conferir'], 9, velha, { main: script });
conf('CASO REAL: cópia velha + PR 9 atrás recusa, sai 1', r.codigo, 1);
conf('CASO REAL: a recusa é a da versão, na primeira checagem', r.saida.indexOf(FRASE) >= 0, true);
conf('CASO REAL: nunca diz ok nem "cumpre o processo"', /^ok |cumpre o processo/m.test(r.saida), false);
conf('CASO REAL: nem chegou a ler o PR no gh', r.chamadas.length, 0);
// Controle: a mesma cópia velha, se a checagem de versão não existisse, diria ok.
const semVersao = path.join(tmp, 'sem_versao', 'merge_seguro.js');
fs.mkdirSync(path.dirname(semVersao));
fs.writeFileSync(semVersao, sem.replace("  const velho = conferirVersao();", "  const velho = null;"));
r = rodar(prBom(), ['--conferir'], 9, semVersao, { main: script });
conf('controle: sem a checagem de versão e sem BEHIND, o PR 9 atrás diz ok', r.codigo === 0 && /^ok /m.test(r.saida), true);

console.log('\n=== 5. CACHE e VERSAO do PR MAIORES que os da main buscada na hora ===');
// A regra pura esta provada no testa_ordem_versao.js; aqui, o caminho do merge:
// a busca na hora, a recusa sem chamar o merge, e o controle sem o bloco.
// ordem(levados, merge, main): os arquivos do app que o PR leva, e os valores
// na arvore do merge e na origin/main.
const ordem = (levados, merge, main) => ({ levados, merge, main });
const V = (cache, versao) => ({ cache, versao });
const LEVA = ['app.js', 'sw.js'];
r = rodar(semRisco(), [], 0, undefined, { ordem: ordem(LEVA, V(134, '1.42.54'), V(133, '1.42.53')) });
conf('v134 / 1.42.54 sobre main v133 / 1.42.53 passa e mergeia', r.codigo === 0 && r.chamadas.filter(c => /^pr merge 9 /.test(c)).length === 1, true);
conf('buscou a origin/main e a cabeca do PR na hora', r.chamadasGit.indexOf('fetch origin main refs/pull/9/head') >= 0, true);
conf('a busca da ordem vem DEPOIS da conferencia da copia', r.chamadasGit.indexOf('fetch origin main refs/pull/9/head') > r.chamadasGit.indexOf('fetch origin main'), true);
conf('a arvore e a do merge da origin/main com a cabeca', r.chamadasGit.indexOf('merge-tree --write-tree origin/main ' + CABECA) >= 0, true);
conf('leu o sw.js e o app.js da origin/main', ['show origin/main:sw.js', 'show origin/main:app.js'].every(c => r.chamadasGit.indexOf(c) >= 0), true);
conf('nao usa mais a base do merge', r.chamadasGit.some(c => /^merge-base/.test(c)), false);
const CASO_V130 = ordem(LEVA, V(130, '1.42.54'), V(134, '1.42.53'));
r = rodar(semRisco(), [], 0, undefined, { ordem: CASO_V130 });
conf('v130 sobre main v134 recusa, sai 1', r.codigo, 1);
conf('v130 sobre main v134 NAO chama o merge', r.chamadas.some(c => /^pr merge/.test(c)), false);
conf('e diz que o CACHE nao e MAIOR que o da main', /CACHE apoio-educacional-v130 do PR nao e MAIOR que o da main atual, apoio-educacional-v134/.test(r.saida), true);
r = rodar(semRisco(), ['--conferir'], 0, undefined, { ordem: CASO_V130 });
conf('v130 sobre main v134 recusa tambem no --conferir', r.codigo === 1 && !/^ok /m.test(r.saida), true);
r = rodar(semRisco(), [], 0, undefined, { ordem: ordem(LEVA, V(134, '1.42.54'), V(134, '1.42.54')) });
conf('igual a main (v134 / 1.42.54) recusa e nao mergeia', r.codigo === 1 && !r.chamadas.some(c => /^pr merge/.test(c)), true);
conf('e as duas recusas aparecem', /CACHE .*igual/.test(r.saida) && /VERSAO .*igual/.test(r.saida), true);
// O caso da revisao: o ramo trouxe a main e ficou igual; so tela.js e levada.
r = rodar(prBom(), [], 0, undefined, { ordem: ordem(['tela.js'], V(134, '1.42.54'), V(134, '1.42.54')) });
conf('REVISAO: ramo que trouxe a main, igual, levando tela.js, recusa e nao mergeia', r.codigo === 1 && !r.chamadas.some(c => /^pr merge/.test(c)), true);
conf('REVISAO: e o motivo cita o que e levado', /leva tela\.js/.test(r.saida), true);
// Arquivo fora da lista ARQUIVOS (o tablet nao baixa) nao pede subir nada.
r = rodar(semRisco(), [], 0, undefined, { ordem: ordem(['functions/ia.js'], V(134, '1.42.54'), V(134, '1.42.54')) });
conf('arquivo fora da lista (functions/ia.js), valor igual, passa', r.codigo, 0);
r = rodar(semRisco(), [], 0, undefined, { ordem: ordem(LEVA, V(135, '1.42.9'), V(134, '1.42.10')) });
conf('VERSAO 1.42.9 sobre main 1.42.10 recusa (numero, e nao texto)', r.codigo === 1 && /VERSAO 1\.42\.9 do PR nao e MAIOR/.test(r.saida), true);
r = rodar(semRisco(), [], 0, undefined, { ordem: ordem(LEVA, V(135, '1.42.10'), V(134, '1.42.9')) });
conf('VERSAO 1.42.10 sobre main 1.42.9 passa', r.codigo, 0);
r = rodar(semRisco(), [], 3, undefined, { ordem: ordem([], V(134, '1.42.54'), V(134, '1.42.54')) });
conf('PR so de teste, atras da main, com valor igual, passa e mergeia', r.codigo === 0 && r.chamadas.filter(c => /^pr merge 9 /.test(c)).length === 1, true);
r = rodar(semRisco(), [], 0, undefined, { ordem: CASO_V130, ordemErro: 'merge-tree' });
conf('conflito com a main recusa e nao mergeia', r.codigo === 1 && !r.chamadas.some(c => /^pr merge/.test(c)) && /conflito com a main/.test(r.saida), true);
// Controle: sem o bloco da ordem, o mesmo v130 sobre v134 passaria e mergearia.
const semOrdem = fonte.replace(/ *\/\/ ORDEM-INICIO[\s\S]*?\/\/ ORDEM-FIM\r?\n/, '');
conf('controle: achei o bloco da ordem para tirar', semOrdem !== fonte, true);
const arqSemOrdem = path.join(tmp, 'merge_seguro_sem_ordem.js');
fs.writeFileSync(arqSemOrdem, semOrdem);
r = rodar(semRisco(), [], 0, arqSemOrdem, { main: arqSemOrdem, ordem: CASO_V130 });
conf('controle: sem o bloco, v130 sobre main v134 passa e mergeia', r.codigo === 0 && r.chamadas.filter(c => /^pr merge/.test(c)).length === 1, true);

fs.rmSync(tmp, { recursive: true, force: true });

console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
