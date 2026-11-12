/* guarda_merge.js
 *
 * O guarda de merge no CI (item 13c da FILA). Refaz as conferências do
 * merge_seguro (bateria inteira verde na cabeça, revisão adversarial no sha7,
 * CACHE e VERSAO maiores que os da main, ramo em dia quando é risco, merge sem
 * conflito) e publica o veredito como STATUS de commit, de contexto
 * portao-merge, na cabeça que julgou. É esse status que a proteção da main pode
 * exigir, fechando o botão de merge do GitHub para o que o merge_seguro recusa.
 *
 * Por que status, e não o check do job: os eventos que disparam este guarda
 * rodam no commit da main, e o check cairia na main, e não no PR.
 *
 * Dois modos (MODO no ambiente):
 *   um     julga UM PR: o de PR_NUM, ou o aberto cuja cabeça é SHA_DO_EVENTO
 *          (workflow_run da bateria, que às vezes não traz o número);
 *   todos  a main andou: rejulga TODOS os PRs abertos contra a main. Três
 *          regras dependem da main atual (CACHE e VERSAO maiores, ramo em dia
 *          quando é risco, merge sem conflito); sem isto, dois PRs com o mesmo
 *          número de versão ficavam os dois com success, o primeiro entrava e o
 *          segundo seguia aprovado.
 *
 * Em cada PR: publica pending ("julgando") na cabeça, julga, relê a cabeça e só
 * publica o veredito se ela não andou. PR que vem de fork é pulado com o motivo
 * dito: o token do repositório não deve julgar código de fora.
 *
 * Costura das provas: GH e GIT terminados em .js rodam pelo node (falsos de
 * caminho absoluto, sem rede). Saída 1 só quando não conseguiu publicar.
 */
'use strict';
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = process.env.REPO_MERGE_SEGURO || 'romulorod1/apoio-educacional';
const GH = process.env.GH || 'gh';
const MERGE_SEGURO = path.join(__dirname, 'merge_seguro.js');

function gh(args) {
  const [bin, pre] = /\.js$/.test(GH) ? [process.execPath, [GH]] : [GH, []];
  return execFileSync(bin, pre.concat(args), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 });
}
const primeiraLinha = e => String((e && (e.stderr || e.message)) || e).split('\n')[0];
/* O GitHub corta a descrição em 140; cortada aqui, sem partir acento. */
function corta(s) {
  const a = Array.from(String(s));
  return a.length > 140 ? a.slice(0, 139).join('') + '.' : a.join('');
}
function verPR(numero) {
  return JSON.parse(gh(['pr', 'view', String(numero), '-R', REPO, '--json', 'number,headRefOid,isCrossRepository,state,baseRefName']));
}
let falhouPublicar = false;
function publicar(sha, estado, descricao) {
  try {
    gh(['api', '-X', 'POST', 'repos/' + REPO + '/statuses/' + sha, '-f', 'state=' + estado, '-f', 'context=portao-merge',
      '-f', 'description=' + corta(descricao), '-f', 'target_url=' + (process.env.URL_DA_RODADA || '')]);
    console.log('publicado portao-merge=' + estado + ' em ' + sha.slice(0, 7) + ': ' + corta(descricao));
    return true;
  } catch (e) {
    console.log('FALHOU    não consegui publicar portao-merge=' + estado + ' em ' + sha.slice(0, 7) + ': ' + primeiraLinha(e));
    falhouPublicar = true;
    return false;
  }
}
/* O primeiro motivo da recusa, que é o que se conserta primeiro. */
function primeiroMotivo(saida) {
  const linhas = String(saida).split('\n');
  const item = linhas.find(l => /^  - /.test(l));
  if (item) return item.replace(/^  - /, '');
  const recusa = linhas.find(l => /^RECUSADO  .*[^:]$/.test(l));
  return recusa ? recusa.replace(/^RECUSADO  /, '') : 'o merge_seguro recusou (veja a rodada)';
}

/* Julga um PR. Devolve o estado publicado, ou null quando não publicou. */
function julgar(numero) {
  let pr;
  try { pr = verPR(numero); } catch (e) {
    console.log('não julgo o PR #' + numero + ': não consegui lê-lo: ' + primeiraLinha(e));
    return null;
  }
  if (pr.isCrossRepository) {
    console.log('pulo o PR #' + numero + ': vem de fork, e o token deste repositório não julga código de fora');
    return null;
  }
  if (pr.state !== 'OPEN' || pr.baseRefName !== 'main') {
    console.log('pulo o PR #' + numero + ': não está aberto contra a main (' + pr.state + ', ' + pr.baseRefName + ')');
    return null;
  }
  const cabeca = String(pr.headRefOid || '');
  if (!/^[0-9a-f]{40}$/.test(cabeca)) { console.log('não julgo o PR #' + numero + ': cabeça ilegível'); return null; }
  // Pending logo no começo: o veredito anterior não vale enquanto este julga.
  publicar(cabeca, 'pending', 'julgando o commit ' + cabeca.slice(0, 7));
  let codigo = 0, saida = '';
  try {
    saida = execFileSync(process.execPath, [MERGE_SEGURO, String(numero), '--guarda'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: process.env, maxBuffer: 16 * 1024 * 1024 });
  } catch (e) { codigo = e.status === null || e.status === undefined ? 1 : e.status; saida = String(e.stdout || '') + String(e.stderr || ''); }
  console.log(saida.trimEnd());
  const julgada = (saida.match(/^cabeca +([0-9a-f]{40})$/m) || [])[1];
  if (julgada !== cabeca) {
    console.log('não publico o veredito do PR #' + numero + ': o merge_seguro julgou ' + (julgada || 'nada') + ', e a cabeça lida era ' + cabeca);
    return null;
  }
  let agora = '';
  try { agora = verPR(numero).headRefOid; } catch (e) { agora = ''; }
  if (agora !== cabeca) {
    console.log('não publico o veredito do PR #' + numero + ': a cabeça mudou de ' + cabeca.slice(0, 7) + ' para ' + (agora || '?').slice(0, 7) + ' durante a conferência');
    return null;
  }
  if (codigo === 0) return publicar(cabeca, 'success', 'cumpre o processo no commit ' + cabeca.slice(0, 7)) ? 'success' : null;
  return publicar(cabeca, 'failure', primeiroMotivo(saida)) ? 'failure' : null;
}

function principal() {
  const modo = process.env.MODO || 'um';
  if (modo === 'todos') {
    let abertos;
    try {
      abertos = JSON.parse(gh(['pr', 'list', '-R', REPO, '--state', 'open', '--base', 'main', '--limit', '200', '--json', 'number']));
    } catch (e) {
      console.log('FALHOU    não consegui listar os PRs abertos: ' + primeiraLinha(e));
      return 1;
    }
    console.log('a main andou: rejulgo ' + abertos.length + ' PR(s) aberto(s)');
    abertos.forEach(p => julgar(p.number));
    return falhouPublicar ? 1 : 0;
  }
  let numero = String(process.env.PR_NUM || '').trim();
  const sha = String(process.env.SHA_DO_EVENTO || '').trim();
  if (!numero && sha) {
    try {
      const achados = JSON.parse(gh(['pr', 'list', '-R', REPO, '--state', 'open', '--search', sha, '--json', 'number,headRefOid']));
      const p = achados.find(x => x.headRefOid === sha);
      if (p) numero = String(p.number);
    } catch (e) { console.log('não consegui procurar o PR do sha ' + sha + ': ' + primeiraLinha(e)); }
  }
  if (!/^[0-9]+$/.test(numero)) {
    console.log('nada a julgar: o evento não traz PR aberto (sha ' + (sha || 'nenhum') + ')');
    return 0;
  }
  julgar(numero);
  return falhouPublicar ? 1 : 0;
}

if (require.main === module) process.exit(principal());
module.exports = { principal, corta, primeiroMotivo };
