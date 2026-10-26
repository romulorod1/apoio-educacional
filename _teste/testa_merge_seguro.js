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
      { __typename: 'CheckRun', name: 'portao-navegador', status: 'COMPLETED', conclusion: 'SKIPPED', startedAt: '2026-10-26T12:02:00Z' }
    ],
    comments: [
      { body: 'Portão inteiro local em abc1234: TUDO PASSOU. Pode seguir para o merge.', createdAt: '2026-10-26T12:30:00Z' },
      { body: 'Revisão adversarial (lente backend). Nada bloqueia.\nveredito: aprova', createdAt: '2026-10-26T12:40:00Z' }
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

p = prBom(); p.comments = p.comments.filter(c => !/Port/.test(c.body));
conf('sem portao inteiro recusa', motivo(p, 'falta o portao inteiro'), true);
p = prBom(); p.comments[0].body = 'Portão inteiro local em 9999999: TUDO PASSOU.';
conf('portao inteiro de OUTRO commit recusa', motivo(p, 'falta o portao inteiro'), true);
p = prBom(); p.comments[0].body = 'Portão inteiro local em abc1234: HA FALHA.';
conf('portao inteiro vermelho recusa', motivo(p, 'falta o portao inteiro'), true);
p = prBom(); p.comments = p.comments.filter(c => !/Port/.test(c.body));
p.statusCheckRollup[2].conclusion = 'SUCCESS';
conf('portao-navegador verde no CI basta sem o comentario', decidir(p).ok, true);

p = prBom(); p.comments = p.comments.filter(c => !/Revis/.test(c.body));
conf('sem revisao recusa', motivo(p, 'falta revisao adversarial'), true);
p = prBom(); p.comments[1].createdAt = '2026-10-26T11:00:00Z';
conf('revisao ANTES do ultimo commit recusa', motivo(p, 'falta revisao adversarial'), true);
p = prBom(); p.comments.push({ body: 'Revisão adversarial, segunda mão.\nveredito: reprova', createdAt: '2026-10-26T12:50:00Z' });
conf('reprova depois do aprova recusa', motivo(p, 'mais recente reprova'), true);
p = prBom(); p.comments.push({ body: 'Revisão adversarial, segunda mão.\nveredito: reprova', createdAt: '2026-10-26T12:35:00Z' });
conf('aprova depois do reprova passa', decidir(p).ok, true);
p = prBom(); p.comments[1].body = 'Nada bloqueia. veredito: aprova';
conf('veredito fora de comentario de revisao adversarial nao vale', motivo(p, 'falta revisao adversarial'), true);

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
r = rodar(prBom(), ['--conferir']);
conf('--conferir aprovado sai 0', r.codigo, 0);
conf('--conferir nunca chama o merge', r.chamadas.some(c => /^pr merge/.test(c)), false);
fs.rmSync(tmp, { recursive: true, force: true });

console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
