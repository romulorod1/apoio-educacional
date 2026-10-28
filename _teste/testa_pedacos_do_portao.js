/* testa_pedacos_do_portao.js
 *
 * O portão inteiro roda no CI em fatias, uma por máquina
 * (`confere_tudo.sh --pedaco K/N`). Uma fatia que pulasse uma prova deixaria
 * essa prova sem rodar em lugar nenhum, com todas as fatias verdes; uma prova
 * em duas fatias só custaria tempo. A prova aqui é de PARTIÇÃO: para cada N,
 * toda prova de navegador do portão cai em exatamente uma fatia, e nenhuma
 * fatia inventa prova que o portão não tem.
 *
 * Sem navegador: usa o `--listar`, que diz o que rodaria sem rodar nada.
 *
 * Controle: uma cópia do portão com a conta da fatia errada (o `+ 1` tirado,
 * que é o erro mais provável de quem mexer nela) TEM de reprovar a partição.
 * Sem isso, "toda prova em uma fatia" não se distinguiria de uma conferência
 * que sempre diz sim.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}

const PORTAO = path.join(__dirname, 'confere_tudo.sh');
function listar(script, args) {
  let saida = '';
  try {
    saida = execFileSync('sh', [script, '--listar'].concat(args || []), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    return { status: e.status, numeros: [], saida: String(e.stdout || '') + String(e.stderr || '') };
  }
  const numeros = (saida.match(/^ {2}vai {5}(\d+) /gm) || []).map(l => Number(l.trim().split(/\s+/)[1]));
  return { status: 0, numeros, saida };
}

/* A partição de uma cópia do portão para N fatias: quantas provas há, e quais
 * números faltam, sobram ou se repetem. */
function particao(script, n) {
  const todas = listar(script).numeros;
  const vistas = {};
  let inventadas = 0;
  for (let k = 1; k <= n; k++) {
    listar(script, ['--pedaco', k + '/' + n]).numeros.forEach(x => {
      if (todas.indexOf(x) < 0) inventadas++;
      vistas[x] = (vistas[x] || 0) + 1;
    });
  }
  const faltam = todas.filter(x => !vistas[x]).length;
  const repetidas = Object.keys(vistas).filter(x => vistas[x] > 1).length;
  return { total: todas.length, faltam, repetidas, inventadas };
}

console.log('\n=== 1. O portão lista as provas de navegador ===');
const todas = listar(PORTAO);
conf('o --listar sai sem erro', todas.status, 0);
conf('e lista mais de cem provas de navegador', todas.numeros.length > 100, true);
conf('numeradas de 1 em diante, sem buraco', todas.numeros.join(',') === todas.numeros.map((_, i) => i + 1).join(','), true);

console.log('\n=== 2. Para cada N, toda prova cai em exatamente uma fatia ===');
[2, 3, 4, 5, 7].forEach(n => {
  const p = particao(PORTAO, n);
  conf(n + ' fatias: nenhuma falta, nenhuma repete, nenhuma inventada',
    p.faltam + ' faltam, ' + p.repetidas + ' repetem, ' + p.inventadas + ' inventadas', '0 faltam, 0 repetem, 0 inventadas');
});
const quatro = [1, 2, 3, 4].map(k => listar(PORTAO, ['--pedaco', k + '/4']).numeros.length);
conf('as quatro fatias do CI ficam do mesmo tamanho, com diferença de no máximo uma prova',
  Math.max.apply(null, quatro) - Math.min.apply(null, quatro) <= 1, true);

console.log('\n=== 3. Fatia inválida é recusada, e não vira fatia vazia verde ===');
['5/4', '0/4', 'x/4', '4', ''].forEach(f => {
  const r = listar(PORTAO, ['--pedaco', f]);
  conf('--pedaco "' + f + '" recusa com saída 2', r.status, 2);
});

console.log('\n=== 4. Controle: a conta da fatia errada reprova a partição ===');
/* A cópia mora ao lado do original, porque o portão faz cd para a pasta acima
 * da dele; e sai no fim, aconteça o que acontecer. */
const ERRADO = path.join(__dirname, '_confere_tudo_controle_tmp.sh');
try {
  const texto = fs.readFileSync(PORTAO, 'utf8');
  const conta = '% pn + 1 )) -ne "$pk"';
  conf('a conta da fatia aparece uma vez no portão', texto.split(conta).length, 2);
  fs.writeFileSync(ERRADO, texto.split(conta).join('% pn )) -ne "$pk"'));
  const p = particao(ERRADO, 4);
  conf('controle: com a conta errada, a partição reprova (há prova sem fatia)', p.faltam > 0, true);
} finally {
  try { fs.unlinkSync(ERRADO); } catch (e) { /* já saiu */ }
}

console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
