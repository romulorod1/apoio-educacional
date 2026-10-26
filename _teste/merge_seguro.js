/* merge_seguro.js
 *
 * O merge de um PR na main, so quando o processo foi cumprido:
 *
 *   sh _teste/merge_seguro.sh 74            confere e faz o merge
 *   sh _teste/merge_seguro.sh 74 --conferir so confere, nao faz merge
 *
 * Existe porque a protecao de branch do GitHub some quando o repositorio vira
 * privado no plano gratuito (onda 3, D1). Enquanto o repositorio e publico, a
 * protecao da main e o CI ja seguram; depois, quem segura e esta regra, usada
 * por toda sessao no lugar de `gh pr merge` direto (secao 8, item 16, das
 * instrucoes de 26/10/2026).
 *
 * Exige, todas para o MESMO commit da cabeca do PR:
 *   1. PR aberto, fora de rascunho, contra a main;
 *   2. o check portao-rapido verde, e nenhum check vermelho ou em andamento
 *      (de cada nome vale a rodada mais nova: abrir e rotular o PR disparam
 *      duas, e a mais velha sai cancelada);
 *   3. o portao inteiro verde: o check portao-navegador verde, OU um comentario
 *      "Portao inteiro" (com ou sem til) que cite o commit da cabeca e diga
 *      "TUDO PASSOU";
 *   4. revisao adversarial registrada em comentario DEPOIS do ultimo commit,
 *      com "veredito: aprova", e nenhum "veredito: reprova" depois do ultimo
 *      aprova. Revisao de antes do ultimo commit nao vale: ela leu outro codigo.
 *
 * O merge vai com --match-head-commit: se alguem empurrar um commit entre a
 * conferencia e o merge, o GitHub recusa, em vez de mergear o que ninguem
 * conferiu.
 */
'use strict';
const { execFileSync } = require('child_process');

const REPO = process.env.REPO_MERGE_SEGURO || 'romulorod1/apoio-educacional';
const GH = process.env.GH || 'gh';
const CAMPOS = 'number,state,isDraft,baseRefName,headRefOid,commits,comments,statusCheckRollup';

/* Decide sobre o JSON do `gh pr view --json`. Pura: devolve { ok, motivos }. */
function decidir(pr) {
  const motivos = [];
  if (!pr || typeof pr !== 'object') return { ok: false, motivos: ['nao consegui ler o PR'] };
  if (pr.state !== 'OPEN') motivos.push('o PR nao esta aberto (' + pr.state + ')');
  if (pr.isDraft) motivos.push('o PR esta em rascunho');
  if (pr.baseRefName !== 'main') motivos.push('a base do PR e ' + pr.baseRefName + ', e nao main');

  const cabeca = String(pr.headRefOid || '');
  const commits = pr.commits || [];
  const ultimo = commits[commits.length - 1];
  if (!cabeca || !ultimo) {
    motivos.push('nao achei o commit da cabeca do PR');
    return { ok: false, motivos };
  }
  if (ultimo.oid && ultimo.oid !== cabeca) motivos.push('o ultimo commit da lista nao e a cabeca do PR');
  const dataUltimo = Date.parse(ultimo.committedDate);
  if (!Number.isFinite(dataUltimo)) motivos.push('nao consegui ler a data do ultimo commit');

  // 2. checks: de cada nome, a rodada mais nova.
  const porNome = {};
  (pr.statusCheckRollup || []).forEach(c => {
    const nome = c.name || c.context || '?';
    const quando = Date.parse(c.startedAt || c.completedAt || '') || 0;
    if (!porNome[nome] || quando >= porNome[nome].quando) porNome[nome] = { quando, c };
  });
  const estado = nome => {
    const r = porNome[nome];
    if (!r) return 'AUSENTE';
    const c = r.c;
    if (c.__typename === 'StatusContext') return String(c.state || '').toUpperCase();
    if (c.status !== 'COMPLETED') return 'EM_ANDAMENTO';
    return String(c.conclusion || '').toUpperCase();
  };
  if (estado('portao-rapido') !== 'SUCCESS') {
    motivos.push('o check portao-rapido nao esta verde (' + estado('portao-rapido') + ')');
  }
  Object.keys(porNome).forEach(nome => {
    const e = estado(nome);
    if (['SUCCESS', 'SKIPPED', 'NEUTRAL'].indexOf(e) < 0 && nome !== 'portao-rapido') {
      motivos.push('o check ' + nome + ' esta ' + e);
    }
  });

  // 3. o portao inteiro, no commit da cabeca.
  const comentarios = (pr.comments || []).map(c => ({
    corpo: String(c.body || ''), quando: Date.parse(c.createdAt) || 0
  }));
  const sha7 = cabeca.slice(0, 7);
  const inteiroNoCi = estado('portao-navegador') === 'SUCCESS';
  const inteiroLocal = comentarios.some(c =>
    /Port[aã]o inteiro/i.test(c.corpo) && c.corpo.indexOf(sha7) >= 0 && /TUDO PASSOU/.test(c.corpo));
  if (!inteiroNoCi && !inteiroLocal) {
    motivos.push('falta o portao inteiro verde no commit ' + sha7 +
      ' (check portao-navegador, ou comentario "Portao inteiro" citando ' + sha7 + ' com "TUDO PASSOU")');
  }

  // 4. revisao adversarial depois do ultimo commit.
  const vereditos = comentarios
    .filter(c => c.quando > dataUltimo && /revis[aã]o adversarial/i.test(c.corpo))
    .map(c => {
      const m = /veredito:\s*(aprova|reprova)/i.exec(c.corpo);
      return m ? { quando: c.quando, v: m[1].toLowerCase() } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.quando - b.quando);
  if (!vereditos.length) {
    motivos.push('falta revisao adversarial registrada depois do ultimo commit (comentario com "veredito: aprova")');
  } else if (vereditos[vereditos.length - 1].v !== 'aprova') {
    motivos.push('a revisao adversarial mais recente reprova');
  }

  return { ok: motivos.length === 0, motivos, cabeca };
}

/* GH terminado em .js roda pelo node: e a costura da prova, que troca o gh
 * por um falso de caminho absoluto, sem PATH sombreado e sem rede. */
function gh(args) {
  const [bin, pre] = /\.js$/.test(GH) ? [process.execPath, [GH]] : [GH, []];
  return execFileSync(bin, pre.concat(args), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function principal(argv) {
  const numero = argv[0];
  const soConferir = argv.indexOf('--conferir') >= 0;
  if (!/^[0-9]+$/.test(numero || '')) {
    console.log('uso: sh _teste/merge_seguro.sh <numero do PR> [--conferir]');
    return 2;
  }
  let pr;
  try {
    pr = JSON.parse(gh(['pr', 'view', numero, '-R', REPO, '--json', CAMPOS]));
  } catch (e) {
    console.log('RECUSADO  nao consegui ler o PR #' + numero + ': ' + String(e.message).split('\n')[0]);
    return 1;
  }
  const r = decidir(pr);
  if (!r.ok) {
    console.log('RECUSADO  PR #' + numero + ':');
    r.motivos.forEach(m => console.log('  - ' + m));
    return 1;
  }
  console.log('ok        PR #' + numero + ' cumpre o processo no commit ' + r.cabeca.slice(0, 7));
  if (soConferir) return 0;
  try {
    process.stdout.write(gh(['pr', 'merge', numero, '-R', REPO, '--merge', '--match-head-commit', r.cabeca]));
  } catch (e) {
    console.log('RECUSADO  o GitHub recusou o merge: ' + String(e.stderr || e.message).split('\n')[0]);
    return 1;
  }
  console.log('mergeado  agora confira o ar: workflow conferencia-no-ar, ou sh _teste/confere_no_ar.sh');
  return 0;
}

if (require.main === module) process.exit(principal(process.argv.slice(2)));
module.exports = { decidir, principal };
