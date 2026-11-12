/* divide_portao.js
 *
 * Divide as provas de navegador do portao em N fatias pelo TEMPO, nao pela
 * contagem (a divisao por contagem deixou a fatia 1 em 32 min e a 2 em 47).
 *
 *   node _teste/divide_portao.js K N     imprime, uma por linha, o nome das
 *                                        provas da fatia K de N
 *                                        (com PORTAO_SELECAO=ARQ, so os nomes
 *                                        de ARQ, um por linha: o nivel 1)
 *   node _teste/divide_portao.js --estima N
 *                                        o tempo previsto de cada fatia
 *
 * Gulosa: a prova mais demorada primeiro, para a fatia mais leve naquele
 * momento (empate: a prova de menor numero, a fatia de menor numero). E
 * deterministica: a mesma lista e a mesma tabela dao a mesma divisao em toda
 * maquina, que e o que faz as fatias nao se cruzarem.
 *
 * Os tempos vem de _teste/tempos_do_portao.tsv. Prova sem tempo medido (nova)
 * recebe a MEDIANA da tabela, para nao cair toda na mesma fatia. Os nomes das
 * provas vem do proprio `confere_tudo.sh --listar` (sem fatia), entao nao ha
 * segunda lista para ficar velha.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const TABELA = path.join(__dirname, 'tempos_do_portao.tsv');
const PORTAO = path.join(__dirname, 'confere_tudo.sh');

function leTempos(arquivo) {
  const t = {};
  fs.readFileSync(arquivo || TABELA, 'utf8').split(/\r?\n/).forEach(l => {
    if (!l || l[0] === '#') return;
    const i = l.lastIndexOf('\t');
    const s = Number(l.slice(i + 1));
    if (i < 1 || !isFinite(s) || s < 0) throw new Error('linha invalida na tabela de tempos: "' + l + '"');
    t[l.slice(0, i)] = s;
  });
  return t;
}

function mediana(v) {
  if (!v.length) return 1;
  const o = v.slice().sort((a, b) => a - b);
  const m = o.length >> 1;
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
}

/* nomes: lista na ordem do portao. Devolve { fatias: [[nome...] x n], tempos: [s x n] }. */
function divide(nomes, tempos, n) {
  const vistos = {};
  nomes.forEach(x => { if (vistos[x]) throw new Error('prova com nome repetido no portao: ' + x); vistos[x] = 1; });
  const padrao = mediana(Object.keys(tempos).map(k => tempos[k]));
  const peso = nomes.map((nome, i) => ({ nome, i, s: Object.prototype.hasOwnProperty.call(tempos, nome) ? tempos[nome] : padrao }));
  peso.sort((a, b) => (b.s - a.s) || (a.i - b.i));
  const fatias = [], soma = [];
  for (let k = 0; k < n; k++) { fatias.push([]); soma.push(0); }
  peso.forEach(p => {
    let k = 0;
    for (let j = 1; j < n; j++) if (soma[j] < soma[k]) k = j;
    fatias[k].push(p.nome);
    soma[k] += p.s;
  });
  return { fatias, tempos: soma };
}

function nomesDoPortao() {
  const saida = execFileSync('sh', [PORTAO, '--listar'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const nomes = [];
  saida.split(/\r?\n/).forEach(l => {
    const m = /^ {2}vai {5}(\d+) (.*)$/.exec(l);
    if (m) nomes.push(m[2]);
  });
  return nomes;
}

module.exports = { divide, leTempos, mediana, nomesDoPortao };

if (require.main === module) {
  const a = process.argv.slice(2);
  const falha = msg => { process.stderr.write(msg + '\n'); process.exit(2); };
  if (a[0] === '--estima') {
    const n = Number(a[1]);
    if (!(n >= 1)) falha('uso: divide_portao.js --estima N');
    const r = divide(nomesDoPortao(), leTempos(), n);
    r.fatias.forEach((f, k) => console.log('fatia ' + (k + 1) + '/' + n + ': ' + f.length + ' provas, ' + (r.tempos[k] / 60).toFixed(1) + ' min'));
  } else {
    const k = Number(a[0]), n = Number(a[1]);
    if (!(Number.isInteger(k) && Number.isInteger(n) && k >= 1 && k <= n)) falha('uso: divide_portao.js K N (K de 1 a N)');
    let nomes = nomesDoPortao();
    if (!nomes.length) falha('o portao nao listou prova nenhuma');
    // Nivel 1 (provas_tocadas.js, job portao-tocadas): PORTAO_SELECAO aponta
    // para a lista de NOMES que o nivel 1 escolheu, e so eles se dividem em N
    // fatias, na ordem do portao. So o job do nivel 1 a define (o
    // testa_provas_tocadas confere no portao.yml que a bateria nunca a tem).
    // Nome que o portao nao tem, ou lista vazia: falha, nunca a bateria inteira
    // nem "nenhuma prova" calada.
    const sel = process.env.PORTAO_SELECAO;
    if (sel) {
      let txt;
      try { txt = fs.readFileSync(sel, 'utf8'); } catch (e) { falha('PORTAO_SELECAO ilegivel: ' + sel); }
      const quero = txt.split(/\r?\n/).filter(Boolean);
      if (!quero.length) falha('PORTAO_SELECAO vazia: ' + sel);
      const fora = quero.filter(x => nomes.indexOf(x) < 0);
      if (fora.length) falha('PORTAO_SELECAO cita prova que o portao nao tem: ' + fora.join(' | '));
      const q = new Set(quero);
      nomes = nomes.filter(x => q.has(x));
      process.stderr.write('divide_portao: nivel 1, so os ' + nomes.length + ' nomes de PORTAO_SELECAO\n');
    }
    const r = divide(nomes, leTempos(), n);
    // sem saida de erro calada: fatia vazia sai com erro, nao como fatia verde
    if (!r.fatias[k - 1].length) falha('a fatia ' + k + ' de ' + n + ' ficou sem prova');
    process.stdout.write(r.fatias[k - 1].join('\n') + '\n');
  }
}
