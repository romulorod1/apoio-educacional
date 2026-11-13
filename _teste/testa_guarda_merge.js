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
 *    Desde o 13f, a regra da publicação pelo guarda (novidade nova, VERSAO
 *    igual à da main) e a transição (main sem o gerador: VERSAO e CACHE
 *    maiores).
 * 2. A main andou: todos os PRs abertos são rejulgados. O caso da revisão, na
 *    regra do 13f: dois PRs do app trazem a MESMA novidade, o primeiro entra, e
 *    o segundo, que tinha success, passa a failure; o PR só de teste continua
 *    success, e com novidade de nome próprio o segundo também (controle).
 * 3. O guarda não julga a si mesmo (com controle sem a regra).
 * 4. O workflow: trava da PROPRIEDADE (três passos fixos, um run literal, sem
 *    ref, repository nem cache, sem ${{ }} no run, nada que puxe o PR fora do env
 *    e do if), rodada contra doze venenos que TÊM de ser vistos.
 * E a main que anda no meio do julgamento não deixa sair veredito velho; no
 * modo todos, o pending vai para todas as cabeças antes, e a leitura que falha
 * sai 1.
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
// Desde o 13f o merge_seguro carrega o versao_publicada.js ao lado.
fs.copyFileSync(path.join(__dirname, 'versao_publicada.js'), path.join(tmp, 'versao_publicada.js'));
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
  "  if (m.viewErro && m.viewErro[n] && !/statusCheckRollup/.test(campos)) { process.stderr.write('HTTP 502: Bad Gateway'); process.exit(1); }",
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
  "  process.stdout.write(JSON.stringify(Object.values(m.prs).filter(p => p.state === 'OPEN').map(p => ({ number: p.number, headRefOid: p.headRefOid, isCrossRepository: !!p.isCrossRepository }))));",
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
  // ls-remote da main: mainSha, e mainShaDepois a partir da segunda leitura (a
  // main que anda no meio do julgamento); mainErro faz a leitura falhar.
  "if (a[0] === 'ls-remote') {",
  "  if (m.mainErro) { process.stderr.write('fatal: unable to access origin'); process.exit(128); }",
  "  const arq = process.env.FALSO_VISTAS + '.main';",
  "  const n = (fs.existsSync(arq) ? Number(fs.readFileSync(arq, 'utf8')) : 0) + 1; fs.writeFileSync(arq, String(n));",
  "  const sha = n >= 2 && m.mainShaDepois ? m.mainShaDepois : (m.mainSha || 'e'.repeat(40));",
  "  process.stdout.write(sha + '\\trefs/heads/main\\n');",
  "} else if (a[0] === 'fetch') {}",
  "else if (a[0] === 'merge-tree') process.stdout.write(arvore(a[3]) + '\\n');",
  // 13f: o diff e o --name-status -z (com -c core.quotePath=false na frente); o
  // levado 'A caminho' e um arquivo adicionado, o resto sai como modificado.
  "else if (a[0] === '-c' && a[2] === 'diff') { const s = daArvore(a[a.length - 1]); process.stdout.write((m.merge[s].levados || []).map(f => /^A /.test(f) ? 'A\\0' + f.slice(2) + '\\0' : 'M\\0' + f + '\\0').join('')); }",
  // A transicao: a main sem o gerador (_teste/versao_publicada.js) julga pela regra antiga.
  "else if (a[0] === 'cat-file') { if (m.transicao) { process.stderr.write('fatal: path does not exist'); process.exit(128); } }",
  "else if (a[0] === 'show' && /:novidades\\//.test(a[1])) process.stdout.write('# nada muda para ela\\n');",
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
  if (fs.existsSync(vistas + '.main')) fs.unlinkSync(vistas + '.main');
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
// Desde o 13f a regra do merge e a da publicacao: VERSAO e CACHE iguais aos da
// main, e o PR que leva arquivo do site traz um novidades/<nome>.txt NOVO.
const NOVA = 'A novidades/pr9.txt';
const mundoUm = (prs, merge, main, extra) => Object.assign({ prs, merge, main }, extra || {});
const so = (r, sha) => r.status.filter(s => s.sha === sha).map(s => s.estado).join(',');
const merge = r => r.chamadas.some(c => c[0] === 'pr' && c[1] === 'merge');

console.log('\n=== 1. Um PR ===');
let r = rodar(mundoUm({ 9: pr(9, A) }, { [A]: V(134, '1.42.54', ['app.js', NOVA]) }, V(134, '1.42.54')));
conf('aprovado sai 0', r.codigo, 0);
conf('pending no começo, success no fim, na cabeça que julgou', so(r, A), 'pending,success');
conf('contexto portao-merge e o link da rodada', r.status.every(s => s.contexto === 'portao-merge' && s.url === 'https://exemplo/rodada/1'), true);
conf('o merge nunca é chamado', merge(r), false);

p = pr(9, A); p.comments = [];
r = rodar(mundoUm({ 9: p }, { [A]: V(134, '1.42.54', ['app.js', NOVA]) }, V(134, '1.42.54')));
conf('recusado sai 0 (recusa não é erro do job)', r.codigo, 0);
conf('recusado: pending e depois failure', so(r, A), 'pending,failure');
conf('com o primeiro motivo na descrição', /falta revisao adversarial/.test(r.status[1] && r.status[1].descricao), true);
conf('a descrição cabe em 140', r.status.every(s => Array.from(s.descricao || '').length <= 140), true);
conf('recusado também nunca chama o merge', merge(r), false);

r = rodar(mundoUm({ 9: pr(9, A) }, { [A]: V(134, '1.42.54', ['app.js', NOVA]) }, V(134, '1.42.54'), { cabecaDepois: { 9: OUTRA } }));
conf('cabeça que andou durante a conferência: só o pending, sem veredito', so(r, A), 'pending');
conf('e diz por que', /a cabeça mudou de/.test(r.saida), true);

r = rodar(mundoUm({ 9: pr(9, A) }, { [A]: V(134, '1.42.54', ['app.js', NOVA]) }, V(134, '1.42.54')), { PR_NUM: '', SHA_DO_EVENTO: A });
conf('workflow_run sem número acha o PR pelo sha e publica', so(r, A), 'pending,success');
r = rodar(mundoUm({ 9: pr(9, A) }, { [A]: V(134, '1.42.54') }, V(134, '1.42.54')), { PR_NUM: '', SHA_DO_EVENTO: OUTRA });
conf('sem PR aberto para o sha: sai 0 e não publica', r.codigo === 0 && r.status.length === 0 && /nada a julgar/.test(r.saida), true);

r = rodar(mundoUm({ 9: pr(9, A, { isCrossRepository: true }) }, { [A]: V(134, '1.42.54') }, V(134, '1.42.54')));
conf('PR de fork: sai 0 e não publica nada', r.codigo === 0 && r.status.length === 0, true);
conf('PR de fork: diz por que', /vem de fork/.test(r.saida), true);
conf('PR de fork: nem roda o merge_seguro', r.chamadas.filter(c => c[0] === 'pr' && c[1] === 'view').length, 1);

r = rodar(mundoUm({ 9: pr(9, A) }, { [A]: V(134, '1.42.54') }, V(134, '1.42.54'), { statusErro: true }));
conf('publicar que falha sai 1', r.codigo, 1);
conf('e diz que não publicou', /não consegui publicar/.test(r.saida), true);

// A main que anda no meio do julgamento: o veredito foi contra a main velha e
// não sai; fica o pending, e o job do push decide.
const M0 = '0'.repeat(39) + '1', M1 = '0'.repeat(39) + '2';
r = rodar(mundoUm({ 9: pr(9, A) }, { [A]: V(134, '1.42.54', ['app.js', NOVA]) }, V(134, '1.42.54'), { mainSha: M0, mainShaDepois: M1 }));
conf('main que anda no meio: só o pending, nenhum success', so(r, A), 'pending');
conf('main que anda no meio: diz que o job do push decide', /a main andou de 0000000 para 0000000/.test(r.saida) && /job do push na main decide/.test(r.saida), true);
conf('main que anda no meio: sai 0 (não é erro)', r.codigo, 0);
p = pr(9, A); p.comments = [];
r = rodar(mundoUm({ 9: p }, { [A]: V(134, '1.42.54', ['app.js', NOVA]) }, V(134, '1.42.54'), { mainSha: M0, mainShaDepois: M1 }));
conf('main que anda no meio: também não publica failure velho', so(r, A), 'pending');
r = rodar(mundoUm({ 9: pr(9, A) }, { [A]: V(134, '1.42.54', ['app.js', NOVA]) }, V(134, '1.42.54'), { mainSha: M0 }));
conf('controle: main parada, o mesmo PR recebe success', so(r, A), 'pending,success');
r = rodar(mundoUm({ 9: pr(9, A) }, { [A]: V(134, '1.42.54', ['app.js', NOVA]) }, V(134, '1.42.54'), { mainErro: true }));
conf('main que não se lê: sai 1, só o pending', r.codigo === 1 && so(r, A) === 'pending', true);
r = rodar(mundoUm({ 9: pr(9, A) }, { [A]: V(134, '1.42.54') }, V(134, '1.42.54'), { viewErro: { 9: true } }));
conf('modo um, PR que não se lê: sai 1 e diz', r.codigo === 1 && /não consegui ler o PR #9/.test(r.saida), true);
// Regra nova pelo guarda, dos dois lados: o PR do app sem novidade nova recusa,
// e o que muda a VERSAO recusa.
r = rodar(mundoUm({ 9: pr(9, A) }, { [A]: V(134, '1.42.54', ['app.js']) }, V(134, '1.42.54')));
conf('regra nova: PR do app sem novidade NOVA vira failure', so(r, A) === 'pending,failure' && /NOVO/.test(r.status[1] && r.status[1].descricao), true);
r = rodar(mundoUm({ 9: pr(9, A) }, { [A]: V(134, '1.42.55', ['app.js', NOVA]) }, V(134, '1.42.54')));
conf('regra nova: PR que muda a VERSAO vira failure', so(r, A) === 'pending,failure' && /VERSAO mudou/.test(r.status[1] && r.status[1].descricao), true);
// A transicao (a main ainda sem o gerador, o merge do proprio 13f): vale a regra
// antiga, VERSAO e CACHE MAIORES que os da main; igual recusa.
r = rodar(mundoUm({ 9: pr(9, A) }, { [A]: V(135, '1.42.55', ['app.js', NOVA]) }, V(134, '1.42.54'), { transicao: true }));
conf('transição: VERSAO e CACHE maiores que os da main, success', so(r, A), 'pending,success');
r = rodar(mundoUm({ 9: pr(9, A) }, { [A]: V(134, '1.42.54', ['app.js', NOVA]) }, V(134, '1.42.54'), { transicao: true }));
conf('transição: iguais aos da main, failure com o motivo', so(r, A) === 'pending,failure' && /nao e MAIOR/.test(r.status[1] && r.status[1].descricao), true);

console.log('\n=== 2. A main andou: todos os PRs abertos são rejulgados ===');
// Desde o 13f a versao nao e mais do PR, e o caso da revisao (dois PRs que sobem
// para a MESMA versao) vira o equivalente da regra nova: dois PRs do app que
// trazem a MESMA novidades/igual.txt. Antes: os dois a adicionam; o #12 e so de
// teste. Os tres recebem success.
const IGUAL = 'A novidades/igual.txt';
const prs = { 10: pr(10, A), 11: pr(11, B), 12: pr(12, C) };
const antes = { [A]: V(134, '1.42.54', ['app.js', IGUAL]), [B]: V(134, '1.42.54', ['tela.js', IGUAL]), [C]: V(134, '1.42.54', ['_teste/x.js']) };
r = rodar(mundoUm(prs, antes, V(134, '1.42.54')), { MODO: 'todos' });
conf('antes: os três aprovados', [so(r, A), so(r, B), so(r, C)].join(' | '), 'pending,success | pending,success | pending,success');
// O #10 entra: a main ganha a novidades/igual.txt, e o push dispara o
// rejulgamento. No merge do #11 ela ja nao e NOVA (a main tem a mesma).
const depois = { 11: prs[11], 12: prs[12] };
const mergeDepois = { [B]: V(134, '1.42.54', ['tela.js']), [C]: V(134, '1.42.54', ['_teste/x.js']) };
r = rodar(mundoUm(depois, mergeDepois, V(134, '1.42.54')), { MODO: 'todos' });
conf('depois do push: rejulga os PRs abertos', /rejulgo 2 PR/.test(r.saida), true);
conf('o #11, com a MESMA novidade que entrou, vira failure', so(r, B), 'pending,failure');
conf('e o motivo é a novidade que não é nova', /NOVO/.test((r.status.find(s => s.sha === B && s.estado === 'failure') || {}).descricao), true);
// Controle: com novidade de nome proprio, o mesmo #11 segue success depois do
// push (o 13f tira o conflito de versao entre PRs do app).
r = rodar(mundoUm(depois, { [B]: V(134, '1.42.54', ['tela.js', 'A novidades/pr11.txt']), [C]: V(134, '1.42.54', ['_teste/x.js']) }, V(134, '1.42.54')), { MODO: 'todos' });
conf('controle: com novidade de nome próprio, o #11 segue success', so(r, B), 'pending,success');
conf('o #12, só de teste, segue success', so(r, C), 'pending,success');
conf('nenhum merge', merge(r), false);
// Controle: sem o rejulgamento (só o modo "um" do #11 antigo), nada muda no #11.
conf('controle: sem push na main, ninguém publica no #11', rodar(mundoUm(depois, mergeDepois, V(134, '1.42.54')), { PR_NUM: '12' }).status.some(s => s.sha === B), false);
r = rodar(mundoUm(prs, antes, V(133, '1.42.53'), { listaErro: true }), { MODO: 'todos' });
conf('lista que falha no modo todos sai 1, sem publicar', r.codigo === 1 && r.status.length === 0, true);
r = rodar(mundoUm({ 11: pr(11, B, { isCrossRepository: true }), 12: prs[12] }, mergeDepois, V(134, '1.42.54')), { MODO: 'todos' });
conf('no modo todos, o fork é pulado e o resto julgado', !r.status.some(s => s.sha === B) && so(r, C) === 'pending,success', true);
// Pending em TODAS as cabeças antes de julgar qualquer uma, e o PR que não se
// lê fica pending (não com o success velho), com saída 1.
r = rodar(mundoUm({ 11: prs[11], 12: prs[12] }, mergeDepois, V(134, '1.42.54'), { viewErro: { 11: true } }), { MODO: 'todos' });
const ordemEstados = r.status.map(s => s.sha.slice(0, 1) + ':' + s.estado).join(' ');
conf('modo todos: os dois pendings vêm antes de qualquer veredito (' + ordemEstados + ')',
  r.status.slice(0, 2).every(s => s.estado === 'pending') && new Set(r.status.slice(0, 2).map(s => s.sha)).size === 2, true);
conf('modo todos: o #11, que não se lê, fica só com o pending', so(r, B), 'pending');
conf('modo todos: o #12 é julgado mesmo assim (sem pending repetido)', so(r, C), 'pending,success');
conf('modo todos: a leitura que falhou sai 1 e diz', r.codigo === 1 && /não consegui ler o PR #11/.test(r.saida), true);

console.log('\n=== 4. O workflow: a trava é da PROPRIEDADE, e roda contra venenos ===');
const yml = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'guarda-merge.yml'), 'utf8').replace(/\r/g, '');
/* A trava devolve a lista do que viola a propriedade "só código da main, num
 * único caminho". Os extremos (um checkout sem ref, nada de head.sha) deixavam
 * passar cinco jeitos de rodar código do PR; por isso a forma é fixa: três
 * passos, nessa ordem, um run só e literal, e nenhuma palavra que puxe o PR fora
 * do env e do if. */
function travaYml(texto) {
  /* O WORKFLOW APROVADO, linha a linha, sem comentário, sem linha vazia e sem
   * espaço no fim. A trava compara o arquivo INTEIRO com isto: qualquer chave a
   * mais (shell, working-directory, defaults, um env novo, um passo, um uses
   * local) reprova, e mudar o workflow de propósito pede mudar este literal no
   * mesmo PR, à vista do revisor. As conferências de propriedade abaixo ficam
   * como segunda camada, e dizem POR QUE uma diferença importa. */
  const LITERAL_YML = [
    "name: guarda-merge",
    "on:",
    "  pull_request_target:",
    "    branches: [main]",
    "    types: [opened, synchronize, reopened, labeled, unlabeled]",
    "  issue_comment:",
    "    types: [created, edited, deleted]",
    "  workflow_run:",
    "    workflows: [portao]",
    "    types: [completed]",
    "  push:",
    "    branches: [main]",
    "concurrency:",
    "  group: guarda-merge-${{ github.event_name == 'push' && 'main' || github.event.pull_request.number || github.event.issue.number || github.event.workflow_run.pull_requests[0].number || github.event.workflow_run.head_branch || github.run_id }}",
    "  cancel-in-progress: true",
    "permissions:",
    "  contents: read",
    "  pull-requests: read",
    "  checks: read",
    "  statuses: write",
    "jobs:",
    "  guarda-merge:",
    "    if: >-",
    "      (github.event_name == 'push') ||",
    "      (github.event_name == 'pull_request_target' && github.event.pull_request.head.repo.full_name == github.repository) ||",
    "      (github.event_name == 'issue_comment' && github.event.issue.pull_request) ||",
    "      (github.event_name == 'workflow_run' && github.event.workflow_run.event == 'pull_request')",
    "    runs-on: ubuntu-latest",
    "    timeout-minutes: 10",
    "    steps:",
    "      - uses: actions/checkout@v4",
    "        with:",
    "          fetch-depth: 0",
    "      - uses: actions/setup-node@v4",
    "        with:",
    "          node-version: '24.14.1'",
    "      - name: Julga e publica o status portao-merge",
    "        env:",
    "          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}",
    "          REPO_MERGE_SEGURO: ${{ github.repository }}",
    "          MODO: ${{ github.event_name == 'push' && 'todos' || 'um' }}",
    "          PR_NUM: ${{ github.event.pull_request.number || github.event.issue.number || github.event.workflow_run.pull_requests[0].number || '' }}",
    "          SHA_DO_EVENTO: ${{ github.event.workflow_run.head_sha || '' }}",
    "          URL_DA_RODADA: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}",
    "        run: node _teste/guarda_merge.js"
  ].join('\n');
  const normalizaYml = texto => texto.replace(/\r/g, '').split('\n').map(l => l.replace(/\s+$/, ''))
    .filter(l => l && !/^\s*#/.test(l)).join('\n');
  const v = [];
  const n = normalizaYml(texto).split('\n'), lit = LITERAL_YML.split('\n');
  const dif = Math.max(n.length, lit.length);
  for (let i = 0; i < dif; i++) {
    if (n[i] !== lit[i]) { v.push('difere do literal aprovado na linha ' + (i + 1) + ': [' + (n[i] === undefined ? 'fim' : n[i].trim()) + ']'); break; }
  }
  const linhas = texto.replace(/\r/g, '').split('\n').filter(l => !/^\s*#/.test(l));
  const codigo = linhas.join('\n');
  if (!/^  pull_request_target:\n    branches: \[main\]\n/m.test(codigo)) v.push('pull_request_target sem branches: [main] logo abaixo');
  if (/^  pull_request:/m.test(codigo)) v.push('dispara em pull_request (código do PR)');
  if (!/^  issue_comment:/m.test(codigo)) v.push('sem issue_comment');
  if (!/^  workflow_run:\n    workflows: \[portao\]\n    types: \[completed\]/m.test(codigo)) v.push('sem workflow_run do portao');
  if (!/^  push:\n    branches: \[main\]/m.test(codigo)) v.push('sem push na main');
  if (!/MODO: \$\{\{ github\.event_name == 'push' && 'todos' \|\| 'um' \}\}/.test(codigo)) v.push('o push não roda o modo todos');
  if (!/^  statuses: write$/m.test(codigo)) v.push('sem statuses: write');
  if ((codigo.match(/: write\s*$/gm) || []).length !== 1) v.push('escrita além do status');
  if (/strict/i.test(codigo)) v.push('strict');
  if (/portao-navegador/.test(codigo)) v.push('cita o portao-navegador');
  if (!/^  guarda-merge:/m.test(codigo)) v.push('o job não se chama guarda-merge');
  // Passos: exatamente três, nesta ordem.
  const iSteps = linhas.findIndex(l => /^    steps:\s*$/.test(l));
  const itens = iSteps < 0 ? [] : linhas.slice(iSteps + 1).filter(l => /^      - /.test(l));
  if (itens.length !== 3) v.push('são ' + itens.length + ' passos, e não 3');
  if (itens[0] !== '      - uses: actions/checkout@v4') v.push('o 1º passo não é o checkout');
  if (itens[1] !== '      - uses: actions/setup-node@v4') v.push('o 2º passo não é o setup-node');
  if (!/^      - name: /.test(itens[2] || '')) v.push('o 3º passo não é o do guarda');
  const runs = linhas.filter(l => /^\s*(- )?run:/.test(l));
  if (runs.length !== 1 || runs[0] !== '        run: node _teste/guarda_merge.js') v.push('o run não é só "node _teste/guarda_merge.js"');
  if (runs.some(l => /\$\{\{/.test(l))) v.push('${{ }} dentro de run');
  if (/^\s*(- )?(ref|repository|cache[\w-]*)\s*:/m.test(codigo)) v.push('chave ref, repository ou cache');
  // Fora do env e do if: nenhuma palavra que puxe o PR ou instale algo.
  const fora = [];
  let pular = -1;
  linhas.forEach(l => {
    const ind = l.length - l.trimStart().length;
    if (pular >= 0 && (ind > pular || !l.trim())) return;
    pular = -1;
    if (/^\s*(env|if):/.test(l)) { pular = ind; return; }
    fora.push(l);
  });
  const foraTexto = fora.filter(l => l !== '      - uses: actions/checkout@v4').join('\n');
  ['checkout', 'npm', 'pull/', 'title', 'body', 'head_ref', 'head_sha', 'head.sha', 'head.ref', 'refs/pull', 'pull_request.head']
    .forEach(p => { if (foraTexto.indexOf(p) >= 0) v.push('"' + p + '" fora do env e do if'); });
  return v;
}
conf('o yml de verdade passa a trava (' + (travaYml(yml).join('; ') || 'nada') + ')', travaYml(yml).length, 0);
const troca = (de, para) => { if (yml.indexOf(de) < 0) throw new Error('veneno não achou: ' + de); return yml.replace(de, para); };
const CK = '      - uses: actions/checkout@v4\n        with:\n          fetch-depth: 0\n';
const GUARDA = '      - name: Julga e publica o status portao-merge\n';
const RUN = '        run: node _teste/guarda_merge.js';
const ENV = '        env:\n          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n';
const VENENOS = [
  ['with: ref: head_sha antes do uses', troca(CK, '      - with:\n          ref: ${{ github.event.workflow_run.head_sha }}\n          fetch-depth: 0\n        uses: actions/checkout@v4\n')],
  ['gh pr checkout num passo separado', troca(GUARDA, '      - run: gh pr checkout ${{ github.event.pull_request.number }}\n' + GUARDA)],
  ['git fetch pull/N/head e checkout do FETCH_HEAD', troca(GUARDA, '      - run: git fetch origin pull/1/head && git checkout FETCH_HEAD\n' + GUARDA)],
  ['título do PR dentro do run', troca(RUN, '        run: node _teste/guarda_merge.js "${{ github.event.pull_request.title }}"')],
  ['npm install', troca(RUN, '        run: npm install && node _teste/guarda_merge.js')],
  ['gatilho pull_request', troca('  pull_request_target:\n', '  pull_request:\n')],
  ['ref da cabeça no checkout', troca(CK, CK + '          ref: ${{ github.event.pull_request.head.sha }}\n')],
  ['repository do fork no checkout', troca(CK, CK + '          repository: ${{ github.event.pull_request.head.repo.full_name }}\n')],
  ['um segundo checkout', troca(GUARDA, '      - uses: actions/checkout@v4\n' + GUARDA)],
  ['refs/pull no run', troca(RUN, '        run: git fetch origin refs/pull/1/head && node _teste/guarda_merge.js')],
  ['strict', troca(CK, CK + '          strict: true\n')],
  ['escrita além do status', troca('  statuses: write\n', '  statuses: write\n  contents: write\n')],
  ['N1 ação local uses ./.github/actions/x', troca(GUARDA, '      - uses: ./.github/actions/x\n' + GUARDA)],
  ['N2 working-directory no passo do guarda', troca(RUN, '        working-directory: ${{ github.workspace }}/pr\n' + RUN)],
  ['N3 shell próprio com gh co (alias do checkout)', troca(RUN, "        shell: bash -c 'gh co \"$PR_NUM\" >&2 && bash {0}'\n" + RUN)],
  ['N4 BASH_ENV com substituição de comando no env', troca(ENV, ENV + '          BASH_ENV: $(gh co \"$PR_NUM\" >&2)\n')],
  ['N5 NODE_OPTIONS no env', troca(ENV, ENV + '          NODE_OPTIONS: --require ./pr/x.js\n')],
  ['N6 defaults.run.shell no job', troca('    runs-on: ubuntu-latest\n', "    runs-on: ubuntu-latest\n    defaults:\n      run:\n        shell: bash -c 'gh co \"$PR_NUM\" >&2 && bash {0}'\n")],
  ['N7 env no nível do workflow', troca('permissions:\n', 'env:\n  BASH_ENV: ./pr/x.sh\npermissions:\n')],
  ['N8 valor do env trocado (PR_NUM com o título)', troca('          PR_NUM: ${{ github.event.pull_request.number', '          PR_NUM: ${{ github.event.pull_request.title')]
];
VENENOS.forEach(([nome, texto]) => {
  const v = travaYml(texto);
  conf('VENENO visto: ' + nome + ' (' + (v[0] || 'nada acusado') + ')', v.length > 0, true);
});

fs.rmSync(tmp, { recursive: true, force: true });
console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
