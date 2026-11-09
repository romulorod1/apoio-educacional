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
  "if (a[0] === 'pr' && a[1] === 'view') process.stdout.write(fs.readFileSync(process.env.FALSO_PR, 'utf8'));\n" +
  "else if (a[0] === 'pr' && a[1] === 'merge') process.stdout.write('merged\\n');\n" +
  "else { process.stderr.write('chamada inesperada'); process.exit(3); }\n");
const script = path.join(__dirname, 'merge_seguro.js');
function rodar(pr, extra) {
  fs.writeFileSync(json, JSON.stringify(pr));
  fs.writeFileSync(log, '');
  let codigo = 0, saida = '';
  try {
    saida = execFileSync(process.execPath, [script, '9'].concat(extra || []), {
      encoding: 'utf8',
      env: Object.assign({}, process.env, { GH: falso, FALSO_LOG: log, FALSO_PR: json })
    });
  } catch (e) { codigo = e.status; saida = String(e.stdout || ''); }
  return { codigo, saida, chamadas: fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean) };
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
fs.rmSync(tmp, { recursive: true, force: true });

console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
