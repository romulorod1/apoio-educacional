/* arvore_da_main.js
 *
 * O nivel 3 da politica de testes por checkpoint (09/11/2026): o portao da main
 * nao roda a bateria inteira de novo quando ela ja passou, na MESMA arvore.
 *
 *   node _teste/arvore_da_main.js <sha do commit da main>
 *
 * Acha, pela API do commit (commits/<sha>/pulls), o PR que entrou naquele commit
 * e compara o TREE (a arvore de arquivos) do commit da main com o tree da
 * cabeca do PR. Se for IGUAL (o ramo estava em dia com a main no merge) e o check
 * portao-navegador (o juntador das oito fatias) da cabeca do PR terminou
 * "success", a bateria inteira ja passou NESTES arquivos: reaproveita. Se o tree
 * difere (a main andou entre a bateria e o merge, o merge trouxe outra coisa),
 * ou o PR nao tem a bateria verde, ou qualquer consulta falha: NAO reaproveita,
 * e a bateria roda como sempre. Na duvida, roda.
 *
 * Usa o `gh api` com o GITHUB_TOKEN do Actions (variavel GH_TOKEN). Grava
 * reaproveita=sim|nao em $GITHUB_OUTPUT, quando ele existe, e diz no log qual
 * caminho tomou e por que.
 */
'use strict';
const fs = require('fs');
const { execFileSync } = require('child_process');

const GH = process.env.GH || 'gh';
const JUNTADOR = 'portao-navegador';

/* Pura. main = { sha, tree }; prs = [{ numero, headSha, headTree, bateria }]
 * (bateria: a conclusao do check portao-navegador da cabeca, ou null).
 * Devolve { reaproveita, pr, linhas }. */
function decidir(main, prs) {
  const linhas = [];
  if (!main || !main.tree) return { reaproveita: false, pr: null, linhas: ['nao li o tree do commit da main: roda a bateria'] };
  if (!prs || !prs.length) return { reaproveita: false, pr: null, linhas: ['o commit ' + main.sha.slice(0, 7) + ' nao veio de PR (nenhum PR na API do commit): roda a bateria'] };
  let achado = null;
  prs.forEach(p => {
    const igual = p.headTree && p.headTree === main.tree;
    const verde = p.bateria === 'success';
    linhas.push('PR #' + p.numero + ' cabeca ' + String(p.headSha).slice(0, 7) + ': tree ' + (igual ? 'IGUAL' : 'DIFERENTE') +
      ' ao da main; bateria inteira ' + (p.bateria || 'sem check'));
    if (igual && verde && !achado) achado = p;
  });
  if (achado) {
    linhas.push('CAMINHO: reaproveita. O tree da main e o da cabeca do PR #' + achado.numero + ', que passou a bateria inteira: publica sem rodar de novo');
    return { reaproveita: true, pr: achado, linhas };
  }
  const algumIgual = prs.some(p => p.headTree && p.headTree === main.tree);
  linhas.push('CAMINHO: roda a bateria. ' + (algumIgual
    ? 'O tree confere, mas a cabeca do PR nao tem a bateria inteira verde'
    : 'O tree da main difere do da cabeca do PR (o ramo nao estava em dia ou o merge trouxe outra coisa)'));
  return { reaproveita: false, pr: null, linhas };
}

function gh(args) {
  const [bin, pre] = /\.js$/.test(GH) ? [process.execPath, [GH]] : [GH, []];
  return execFileSync(bin, pre.concat(args), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
const api = caminho => JSON.parse(gh(['api', caminho]));

/* Le a API e monta a entrada de decidir(). Qualquer erro sobe: quem chama roda a bateria. */
function leDaApi(repo, sha) {
  const commit = api('repos/' + repo + '/commits/' + sha);
  const main = { sha, tree: commit.commit && commit.commit.tree && commit.commit.tree.sha };
  const lista = api('repos/' + repo + '/commits/' + sha + '/pulls');
  const prs = lista.filter(p => p.merged_at && p.base && p.base.ref === 'main').map(p => {
    const headSha = p.head.sha;
    const cabeca = api('repos/' + repo + '/commits/' + headSha);
    const checks = api('repos/' + repo + '/commits/' + headSha + '/check-runs?check_name=' + JUNTADOR + '&filter=latest');
    const run = (checks.check_runs || []).filter(c => c.name === JUNTADOR)[0];
    return { numero: p.number, headSha, headTree: cabeca.commit && cabeca.commit.tree && cabeca.commit.tree.sha,
      bateria: run ? (run.status === 'completed' ? String(run.conclusion) : run.status) : null };
  });
  return { main, prs };
}

function principal(argv) {
  const sha = argv[0];
  const repo = process.env.GITHUB_REPOSITORY || process.env.REPO_MERGE_SEGURO || 'romulorod1/apoio-educacional';
  if (!/^[0-9a-f]{40}$/.test(sha || '')) { console.log('uso: node _teste/arvore_da_main.js <sha completo>'); return 2; }
  let r;
  try {
    const d = leDaApi(repo, sha);
    r = decidir(d.main, d.prs);
  } catch (e) {
    r = { reaproveita: false, pr: null, linhas: ['nao consegui consultar a API (' + String(e.stderr || e.message).split('\n')[0] + '). CAMINHO: roda a bateria'] };
  }
  r.linhas.forEach(l => console.log('nivel 3: ' + l));
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, 'reaproveita=' + (r.reaproveita ? 'sim' : 'nao') + '\n' +
      'pr=' + (r.pr ? r.pr.numero : '') + '\n');
  }
  return 0;
}

if (require.main === module) process.exit(principal(process.argv.slice(2)));
module.exports = { decidir, leDaApi, principal };
