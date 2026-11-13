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
 *          segundo seguia aprovado. Antes de julgar qualquer um, publica
 *          pending em TODAS as cabeças: um PR que depois não se consegue ler
 *          não fica com o success velho.
 *
 * Em cada PR: publica pending ("julgando"), lê a main, julga, relê a cabeça e a
 * main, e só publica o veredito se nenhuma das duas andou. Se a main andou, o
 * veredito foi dado contra uma main que já não existe: fica o pending, e o job
 * do push na main, que rejulga todos, decide. PR que vem de fork é pulado com
 * o motivo dito: o token deste repositório não julga código de fora.
 *
 * Costura das provas: GH e GIT terminados em .js rodam pelo node (falsos de
 * caminho absoluto, sem rede). Saída 1 quando não conseguiu ler um PR, ler a
 * main, listar os PRs ou publicar; recusa do merge_seguro não é erro do job.
 */
'use strict';
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = process.env.REPO_MERGE_SEGURO || 'romulorod1/apoio-educacional';
const GH = process.env.GH || 'gh';
const GIT = process.env.GIT || 'git';
const MERGE_SEGURO = path.join(__dirname, 'merge_seguro.js');
const RAIZ = path.join(__dirname, '..');

function roda(bin0, args, cwd) {
  const [bin, pre] = /\.js$/.test(bin0) ? [process.execPath, [bin0]] : [bin0, []];
  return execFileSync(bin, pre.concat(args), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024, cwd });
}
const gh = args => roda(GH, args);
const git = args => roda(GIT, args, RAIZ);
const primeiraLinha = e => String((e && (e.stderr || e.message)) || e).split('\n')[0];
/* O GitHub corta a descrição em 140; cortada aqui, sem partir acento. */
function corta(s) {
  const a = Array.from(String(s));
  return a.length > 140 ? a.slice(0, 139).join('') + '.' : a.join('');
}
function verPR(numero) {
  return JSON.parse(gh(['pr', 'view', String(numero), '-R', REPO, '--json', 'number,headRefOid,isCrossRepository,state,baseRefName']));
}
/* O sha da main AGORA, no servidor (não o da cópia local). Lança se não conseguir. */
function mainAgora() {
  const sha = (git(['ls-remote', 'origin', 'refs/heads/main']).split(/\s/)[0] || '').trim();
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error('o ls-remote não devolveu o sha da main: [' + sha + ']');
  return sha;
}
let erro = false;
function publicar(sha, estado, descricao) {
  try {
    gh(['api', '-X', 'POST', 'repos/' + REPO + '/statuses/' + sha, '-f', 'state=' + estado, '-f', 'context=portao-merge',
      '-f', 'description=' + corta(descricao), '-f', 'target_url=' + (process.env.URL_DA_RODADA || '')]);
    console.log('publicado portao-merge=' + estado + ' em ' + sha.slice(0, 7) + ': ' + corta(descricao));
    return true;
  } catch (e) {
    console.log('FALHOU    não consegui publicar portao-merge=' + estado + ' em ' + sha.slice(0, 7) + ': ' + primeiraLinha(e));
    erro = true;
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

/* Julga um PR. Devolve o estado publicado, ou null quando não publicou
 * veredito. jaPendente: o modo todos já publicou o pending nesta cabeça. */
function julgar(numero, jaPendente) {
  let pr;
  try { pr = verPR(numero); } catch (e) {
    console.log('FALHOU    não consegui ler o PR #' + numero + ': ' + primeiraLinha(e));
    erro = true;
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
  if (!/^[0-9a-f]{40}$/.test(cabeca)) {
    console.log('FALHOU    o PR #' + numero + ' veio com a cabeça ilegível');
    erro = true;
    return null;
  }
  // Pending logo no começo: o veredito anterior não vale enquanto este julga.
  if (jaPendente !== cabeca) publicar(cabeca, 'pending', 'julgando o commit ' + cabeca.slice(0, 7));
  let main0;
  try { main0 = mainAgora(); } catch (e) {
    console.log('FALHOU    não consegui ler a main antes de julgar o PR #' + numero + ': ' + primeiraLinha(e));
    erro = true;
    return null;
  }
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
  let main1 = '';
  try { main1 = mainAgora(); } catch (e) { main1 = ''; }
  if (main1 !== main0) {
    // O veredito foi contra a main0. Publicá-lo agora poderia cobrir, por último,
    // o que o job do push na main1 acabou de decidir.
    console.log('não publico o veredito do PR #' + numero + ': a main andou de ' + main0.slice(0, 7) + ' para ' + (main1 || '?').slice(0, 7) +
      ' durante o julgamento; fica o pending, e o job do push na main decide');
    if (!main1) erro = true;
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
      abertos = JSON.parse(gh(['pr', 'list', '-R', REPO, '--state', 'open', '--base', 'main', '--limit', '200', '--json', 'number,headRefOid,isCrossRepository']));
    } catch (e) {
      console.log('FALHOU    não consegui listar os PRs abertos: ' + primeiraLinha(e));
      return 1;
    }
    console.log('a main andou: rejulgo ' + abertos.length + ' PR(s) aberto(s)');
    // Primeiro o pending em TODAS as cabeças, e só depois o julgamento: o PR
    // que não se consegue ler fica pending, e não com o success de antes.
    const pendentes = {};
    abertos.filter(p => !p.isCrossRepository && /^[0-9a-f]{40}$/.test(String(p.headRefOid || ''))).forEach(p => {
      if (publicar(p.headRefOid, 'pending', 'a main andou: rejulgando o commit ' + p.headRefOid.slice(0, 7))) pendentes[p.number] = p.headRefOid;
    });
    abertos.forEach(p => julgar(p.number, pendentes[p.number]));
    return erro ? 1 : 0;
  }
  let numero = String(process.env.PR_NUM || '').trim();
  const sha = String(process.env.SHA_DO_EVENTO || '').trim();
  if (!numero && sha) {
    try {
      const achados = JSON.parse(gh(['pr', 'list', '-R', REPO, '--state', 'open', '--search', sha, '--json', 'number,headRefOid']));
      const p = achados.find(x => x.headRefOid === sha);
      if (p) numero = String(p.number);
    } catch (e) {
      console.log('FALHOU    não consegui procurar o PR do sha ' + sha + ': ' + primeiraLinha(e));
      return 1;
    }
  }
  if (!/^[0-9]+$/.test(numero)) {
    console.log('nada a julgar: o evento não traz PR aberto (sha ' + (sha || 'nenhum') + ')');
    return 0;
  }
  julgar(numero);
  return erro ? 1 : 0;
}

if (require.main === module) process.exit(principal());
module.exports = { principal, corta, primeiroMotivo };
