/* provas_tocadas.js
 *
 * O nivel 1 da politica de testes por checkpoint (09/11/2026): dado o conjunto
 * de arquivos tocados por um PR, quais provas de NAVEGADOR rodam. O mapa e
 * _teste/mapa_provas.tsv (formato e ordem de decisao no cabecalho dele).
 *
 *   node _teste/provas_tocadas.js [--fatia K/N] [--saida ARQ] [arquivos...]
 *       os arquivos tocados vem dos argumentos, ou da entrada padrao (um por
 *       linha, como sai do `git diff --name-only`). Escreve em ARQ, uma por
 *       linha, as provas que rodam (com --fatia, so as que caem na fatia K de
 *       N, as mesmas que o `confere_tudo.sh --pedaco K/N` roda) e imprime o
 *       motivo de cada uma. Se $GITHUB_OUTPUT existir, grava nele:
 *         modo=nenhuma|lista|inteira   (da selecao inteira, nao so da fatia)
 *         quantas=N                    (provas desta fatia)
 *
 * Regras (conservadoras; na duvida, mais, nunca menos):
 *   1. arquivo que e uma prova de navegador: ela mesma;
 *   2. casa linhas do mapa: a uniao; "-" nao pede prova de navegador;
 *      "*" pede a bateria inteira;
 *   3. nao casa nada no mapa: a bateria inteira.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const MAPA = path.join(__dirname, 'mapa_provas.tsv');
const PORTAO = path.join(__dirname, 'confere_tudo.sh');

function leMapa(texto) {
  const linhas = [];
  String(texto).split(/\r?\n/).forEach((l, i) => {
    if (!l.trim() || l[0] === '#') return;
    const t = l.indexOf('\t');
    if (t < 1) throw new Error('mapa_provas: linha ' + (i + 1) + ' sem tabulacao: "' + l + '"');
    const padrao = l.slice(0, t).trim();
    const provas = l.slice(t + 1).trim().split(/\s+/).filter(Boolean);
    if (!padrao || !provas.length) throw new Error('mapa_provas: linha ' + (i + 1) + ' sem padrao ou sem provas');
    if ((provas.indexOf('-') >= 0 || provas.indexOf('*') >= 0) && provas.length > 1) {
      throw new Error('mapa_provas: linha ' + (i + 1) + ': "-" e "*" valem sozinhos');
    }
    const re = new RegExp('^' + padrao.split('*').map(x => x.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
    linhas.push({ padrao, re, provas });
  });
  return linhas;
}

/* navegador: { arquivos: [caminho...], nomes: { caminho: [nome...] } } (do --listar). */
function listaDoPortao() {
  const saida = execFileSync('sh', [PORTAO, '--listar'], { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const arquivos = [], nomes = {}, ordem = [];
  saida.split(/\r?\n/).forEach(l => {
    let m = /^ {2}vai {5}(\d+) (.*)$/.exec(l);
    if (m) { ordem.push(m[2]); return; }
    m = /^ {2}arq {5}(\d+) (.*)$/.exec(l);
    if (m) {
      const nome = ordem[Number(m[1]) - 1] || ordem[ordem.length - 1];
      if (arquivos.indexOf(m[2]) < 0) arquivos.push(m[2]);
      (nomes[m[2]] = nomes[m[2]] || []).push(nome);
    }
  });
  return { arquivos, nomes };
}

/* Pura. Devolve { modo: 'nenhuma'|'lista'|'inteira', provas: [...], motivos: [...] }. */
function provasTocadas(tocados, mapa, navegador) {
  const todas = navegador.arquivos;
  const uniao = new Set();
  const motivos = [];
  let inteira = false;
  const norm = f => String(f).trim().replace(/\\/g, '/').replace(/^\.\//, '');
  tocados.map(norm).filter(Boolean).forEach(f => {
    if (todas.indexOf(f) >= 0) { uniao.add(f); motivos.push(f + ': e prova de navegador, roda ela mesma'); return; }
    const casadas = mapa.filter(l => l.re.test(f));
    if (!casadas.length) { inteira = true; motivos.push(f + ': nao esta no mapa, bateria inteira'); return; }
    casadas.forEach(l => {
      if (l.provas[0] === '*') { inteira = true; motivos.push(f + ': ' + l.padrao + ' pede a bateria inteira'); }
      else if (l.provas[0] === '-') motivos.push(f + ': ' + l.padrao + ' sem prova de navegador (o portao-rapido cobre)');
      else { l.provas.forEach(p => uniao.add(p)); motivos.push(f + ': ' + l.provas.length + ' provas pelo mapa (' + l.padrao + ')'); }
    });
  });
  if (inteira) return { modo: 'inteira', provas: todas.slice(), motivos };
  const provas = todas.filter(p => uniao.has(p));
  // prova do mapa que o portao nao tem: erro do mapa, nao pulo calado
  uniao.forEach(p => { if (todas.indexOf(p) < 0) throw new Error('o mapa cita uma prova que o portao nao tem: ' + p); });
  return { modo: provas.length ? 'lista' : 'nenhuma', provas, motivos };
}

/* As provas da selecao que caem na fatia K de N, pelo mesmo divisor do portao. */
function daFatia(provas, navegador, k, n) {
  const { divide, leTempos, nomesDoPortao } = require('./divide_portao.js');
  const minhas = new Set(divide(nomesDoPortao(), leTempos(), n).fatias[k - 1]);
  return provas.filter(p => (navegador.nomes[p] || []).some(nm => minhas.has(nm)));
}

module.exports = { leMapa, listaDoPortao, provasTocadas, daFatia, MAPA };

if (require.main === module) {
  const a = process.argv.slice(2);
  let fatia = null, saida = null;
  const arquivos = [];
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--fatia') fatia = a[++i];
    else if (a[i] === '--saida') saida = a[++i];
    else arquivos.push(a[i]);
  }
  const tocados = arquivos.length ? arquivos : fs.readFileSync(0, 'utf8').split(/\r?\n/);
  const nav = listaDoPortao();
  const r = provasTocadas(tocados, leMapa(fs.readFileSync(MAPA, 'utf8')), nav);
  r.motivos.forEach(m => console.log('  ' + m));
  let minhas = r.provas;
  if (fatia) {
    const m = /^(\d+)\/(\d+)$/.exec(fatia);
    if (!m || +m[1] < 1 || +m[1] > +m[2]) { console.error('uso: --fatia K/N, K de 1 a N'); process.exit(2); }
    minhas = daFatia(r.provas, nav, +m[1], +m[2]);
  }
  console.log('modo: ' + r.modo + '; provas' + (fatia ? ' na fatia ' + fatia : '') + ': ' + minhas.length + ' de ' + nav.arquivos.length);
  if (saida) fs.writeFileSync(saida, minhas.join('\n') + (minhas.length ? '\n' : ''));
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, 'modo=' + r.modo + '\nquantas=' + minhas.length + '\n');
}
