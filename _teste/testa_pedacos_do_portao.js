/* testa_pedacos_do_portao.js
 *
 * O portão inteiro roda no CI em fatias, uma por máquina
 * (`confere_tudo.sh --pedaco K/N`, hoje N = 8), divididas pelo TEMPO medido de
 * cada prova (`divide_portao.js` + `tempos_do_portao.tsv`). Uma fatia que
 * pulasse uma prova deixaria essa prova sem rodar em lugar nenhum, com todas as
 * fatias verdes; uma prova em duas fatias só custaria tempo. A prova aqui é de
 * PARTIÇÃO: para cada N, toda prova de navegador do portão cai em exatamente
 * uma fatia, e nenhuma fatia inventa prova que o portão não tem.
 *
 * Sem navegador: usa o `--listar`, que diz o que rodaria sem rodar nada.
 *
 * Também prova que as 8 fatias de hoje juntam EXATAMENTE as mesmas provas que
 * as 4 fatias de antes (a regra antiga, ((i - 1) mod 4) + 1, refeita aqui) e
 * que o portão inteiro, e imprime a contagem e o tempo previsto de cada fatia.
 *
 * Controles: (1) copias do portão com a pertença à fatia quebrada, para um
 * lado (nenhuma prova casa) e para o outro (toda prova casa), TÊM de reprovar
 * a partição; (2) uma divisão com uma prova tirada, e outra com uma prova
 * duplicada, TÊM de reprovar a conferência. Sem isso, "toda prova em uma
 * fatia" não se distinguiria de uma conferência que sempre diz sim.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { divide, leTempos, mediana } = require('./divide_portao.js');

let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}

const PORTAO = path.join(__dirname, 'confere_tudo.sh');
/* Cada listagem sobe um sh e um node; no Windows isso leva dezenas de segundos.
 * As do portão de verdade (as copias de controle não) ficam em memória. */
const memo = {};
function listar(script, args) {
  const chave = script === PORTAO ? (args || []).join(' ') : null;
  if (chave !== null && memo[chave]) return memo[chave];
  const r = listarSemMemo(script, args);
  if (chave !== null) memo[chave] = r;
  return r;
}
function listarSemMemo(script, args) {
  let saida = '';
  try {
    saida = execFileSync('sh', [script, '--listar'].concat(args || []), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    return { status: e.status, numeros: [], nomes: [], saida: String(e.stdout || '') + String(e.stderr || '') };
  }
  const achadas = [];
  saida.split(/\r?\n/).forEach(l => {
    const m = /^ {2}vai {5}(\d+) (.*)$/.exec(l);
    if (m) achadas.push({ n: Number(m[1]), nome: m[2] });
  });
  return { status: 0, numeros: achadas.map(a => a.n), nomes: achadas.map(a => a.nome), saida };
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

/* A mesma conferência, sobre uma divisão já feita (lista de listas de nomes). */
function confereDivisao(nomes, fatias) {
  const vistas = {};
  let inventadas = 0;
  fatias.forEach(f => f.forEach(x => {
    if (nomes.indexOf(x) < 0) inventadas++;
    vistas[x] = (vistas[x] || 0) + 1;
  }));
  return {
    faltam: nomes.filter(x => !vistas[x]).length,
    repetidas: Object.keys(vistas).filter(x => vistas[x] > 1).length,
    inventadas
  };
}
const dizParticao = p => p.faltam + ' faltam, ' + p.repetidas + ' repetem, ' + p.inventadas + ' inventadas';
const BOM = '0 faltam, 0 repetem, 0 inventadas';

console.log('\n=== 1. O portão lista as provas de navegador ===');
const todas = listar(PORTAO);
conf('o --listar sai sem erro', todas.status, 0);
conf('e lista mais de cem provas de navegador', todas.numeros.length > 100, true);
conf('numeradas de 1 em diante, sem buraco', todas.numeros.join(',') === todas.numeros.map((_, i) => i + 1).join(','), true);
conf('nenhum nome de prova se repete (a divisão é por nome)', new Set(todas.nomes).size, todas.nomes.length);

console.log('\n=== 2. Para cada N, toda prova cai em exatamente uma fatia ===');
[3, 8].forEach(n => {
  const p = particao(PORTAO, n);
  conf(n + ' fatias: nenhuma falta, nenhuma repete, nenhuma inventada', dizParticao(p), BOM);
});

console.log('\n=== 3. As 8 fatias de hoje juntam exatamente as 4 de antes e o portão inteiro ===');
{
  const total = todas.nomes.length;
  // a regra das 4 fatias de antes: a prova de número i ia para a fatia ((i - 1) mod 4) + 1
  const antes = [1, 2, 3, 4].map(k => todas.nomes.filter((_, i) => (i % 4) + 1 === k));
  const uniaoAntes = [].concat.apply([], antes);
  const oito = [1, 2, 3, 4, 5, 6, 7, 8].map(k => listar(PORTAO, ['--pedaco', k + '/8']).nomes);
  const uniaoOito = [].concat.apply([], oito);
  console.log('  provas de navegador: ' + total + ' no portão; ' + uniaoAntes.length + ' nas 4 fatias de antes (' +
    antes.map(f => f.length).join('+') + '); ' + uniaoOito.length + ' nas 8 de hoje (' + oito.map(f => f.length).join('+') + ')');
  conf('as 4 de antes somam o portão inteiro', uniaoAntes.length, total);
  conf('as 8 de hoje somam o mesmo número de provas', uniaoOito.length, total);
  conf('nenhuma duplicada nas 8', new Set(uniaoOito).size, uniaoOito.length);
  conf('o conjunto das 8 é EXATAMENTE o das 4 de antes',
    uniaoOito.slice().sort().join('\n') === uniaoAntes.slice().sort().join('\n'), true);
  conf('e é exatamente o portão inteiro',
    uniaoOito.slice().sort().join('\n') === todas.nomes.slice().sort().join('\n'), true);
  conf('nenhuma das 8 fatias fica vazia', oito.every(f => f.length > 0), true);
}

console.log('\n=== 4. O tempo previsto de cada fatia (tabela medida) fica equilibrado ===');
{
  const tempos = leTempos();
  const semTempo = todas.nomes.filter(x => !Object.prototype.hasOwnProperty.call(tempos, x));
  console.log('  provas sem tempo medido (recebem a mediana da tabela): ' + semTempo.length);
  const r = divide(todas.nomes, tempos, 8);
  const min = r.tempos.map(s => (s / 60).toFixed(1));
  console.log('  previsto por fatia (min): ' + min.join(' | ') + ' | soma ' + (r.tempos.reduce((a, b) => a + b, 0) / 60).toFixed(1));
  const media = r.tempos.reduce((a, b) => a + b, 0) / 8;
  const maior = Math.max.apply(null, r.tempos), menor = Math.min.apply(null, r.tempos);
  conf('a maior fatia passa da média em no máximo 10%', maior <= media * 1.10, true);
  conf('a diferença entre a maior e a menor fatia é de no máximo 3 minutos', maior - menor <= 180, true);
  // as fatias que o script entrega são as mesmas que a função devolve
  const doScript = [1, 2, 3, 4, 5, 6, 7, 8].map(k => listar(PORTAO, ['--pedaco', k + '/8']).nomes.slice().sort().join('\n'));
  conf('o --pedaco entrega a divisão da função, fatia por fatia',
    doScript.join('|') === r.fatias.map(f => todas.nomes.filter(x => f.indexOf(x) >= 0).sort().join('\n')).join('|'), true);
  // prova nova, sem tempo medido: cai em exatamente uma fatia, com a mediana
  const parcial = {};
  Object.keys(tempos).forEach((k, i) => { if (i % 2) parcial[k] = tempos[k]; });
  const nova = divide(todas.nomes.concat(['prova_nova_sem_tempo']), parcial, 8);
  conf('com metade da tabela e uma prova nova, a divisão ainda é partição',
    dizParticao(confereDivisao(todas.nomes.concat(['prova_nova_sem_tempo']), nova.fatias)), BOM);
  conf('a mediana é a de uma tabela de tempos', mediana([5, 1, 3]) + ',' + mediana([1, 2, 3, 10]), '3,2.5');
}

console.log('\n=== 5. Fatia inválida é recusada, e não vira fatia vazia verde ===');
/* "1/" e "/4" passavam pela primeira validação, que testava as duas metades
 * juntas, e viravam o portão inteiro (achado da revisão adversarial); "01/4" e
 * "1/010" porque a conta do shell lê zero à esquerda como octal. */
['5/4', '0/4', 'x/4', '4', '', '1/', '/4', '01/4', '1/010', '1/4/4', '9/8'].forEach(f => {
  const r = listar(PORTAO, ['--pedaco', f]);
  conf('--pedaco "' + f + '" recusa com saída 2', r.status, 2);
});
// a fatia e o rápido não combinam: o rápido pula o navegador, e a fatia diria que rodou o que pulou
let rapidoComFatia = 0;
try {
  // com --listar: se a recusa sumir, a prova falha em um segundo, em vez de rodar o --rapido inteiro antes (A4c)
  execFileSync('sh', [PORTAO, '--listar', '--rapido', '--pedaco', '1/4'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
} catch (e) { rapidoComFatia = e.status; }
conf('--rapido com --pedaco recusa com saída 2', rapidoComFatia, 2);

console.log('\n=== 6. Controles (veneno): prova tirada ou duplicada reprova ===');
{
  const nomes = todas.nomes;
  const r = divide(nomes, leTempos(), 8);
  conf('controle positivo: a divisão de verdade passa na conferência', dizParticao(confereDivisao(nomes, r.fatias)), BOM);
  const tirada = r.fatias.map(f => f.slice());
  tirada[3].pop();
  conf('veneno: uma prova tirada de uma fatia reprova (falta uma)', dizParticao(confereDivisao(nomes, tirada)), '1 faltam, 0 repetem, 0 inventadas');
  const duplicada = r.fatias.map(f => f.slice());
  duplicada[5].push(duplicada[0][0]);
  conf('veneno: uma prova duplicada em duas fatias reprova (repete uma)', dizParticao(confereDivisao(nomes, duplicada)), '0 faltam, 1 repetem, 0 inventadas');
  const inventada = r.fatias.map(f => f.slice());
  inventada[1].push('prova_que_o_portao_nao_tem');
  conf('veneno: prova inventada reprova', dizParticao(confereDivisao(nomes, inventada)), '0 faltam, 0 repetem, 1 inventadas');
}

console.log('\n=== 7. Controle no script: a pertença à fatia quebrada reprova a partição ===');
/* As cópias moram ao lado do original, porque o portão faz cd para a pasta
 * acima da dele; e saem no fim, aconteça o que acontecer. */
const pertenca = '! printf \'%s\\n\' "$minhas_provas" | grep -Fxq -- "$nome"';
const texto = fs.readFileSync(PORTAO, 'utf8');
conf('a pertença à fatia aparece uma vez no portão', texto.split(pertenca).length, 2);
[
  ['nenhuma prova casa com a fatia', '! printf \'%s\\n\' "$minhas_provas" | grep -Fxq -- "x$nome"', p => p.faltam > 0],
  ['toda prova casa com toda fatia', 'false', p => p.repetidas > 0]
].forEach(([rotulo, troca, reprova], i) => {
  const copia = path.join(__dirname, '_confere_tudo_controle_tmp' + i + '.sh');
  try {
    fs.writeFileSync(copia, texto.split(pertenca).join(troca));
    const p = particao(copia, 2);
    conf('controle: com ' + rotulo + ', a partição reprova', reprova(p), true);
  } finally {
    try { fs.unlinkSync(copia); } catch (e) { /* já saiu */ }
  }
});

console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
