/* testa_venenos_existem.js
 *
 * Um veneno com o nome escrito errado não reprova: a prova não reconhece o
 * modo, roda o caminho normal e passa. No portão, isso é uma linha que finge
 * provar e não prova nada, para sempre. Achado em 08/11, ao rodar à mão
 * `--envenenado-todos-os-digitos` (que não existe) no lugar de
 * `--envenenado-extracao-antiga`: passou como normal.
 *
 * Esta prova lê o confere_tudo.sh e, para cada linha `roda` que passa um
 * `--envenenado-...`, confere que o nome do veneno aparece no próprio arquivo
 * da prova chamada. Sem navegador.
 *
 * Veneno desta prova: --envenenado-nome-falso acrescenta ao portão lido uma
 * linha com um veneno inexistente, e a prova TEM de reprovar.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
let portao = fs.readFileSync(path.join(RAIZ, '_teste', 'confere_tudo.sh'), 'utf8');
/* O segundo veneno erra uma letra num nome que a prova monta de uma tabela
 * (`seta` vira `setta` no testa_biblioteca_listas), o caso mais difícil de ver. */
if (process.argv.indexOf('--envenenado-letra-trocada') >= 0) {
  portao = portao.replace('node "_teste/testa_biblioteca_listas.js" --envenenado-seta', 'node "_teste/testa_biblioteca_listas.js" --envenenado-setta');
}
/* O terceiro veneno é o buraco do prefixo (revisão do PR): "camadas" vira
 * "camada", que é prefixo de um nome real e aparece em comentário. */
if (process.argv.indexOf('--envenenado-prefixo') >= 0) {
  portao = portao.replace('node "_teste/testa_biblioteca_listas.js" --envenenado-camadas', 'node "_teste/testa_biblioteca_listas.js" --envenenado-camada');
}
if (process.argv.indexOf('--envenenado-nome-falso') >= 0) {
  portao += '\nroda "veneno de mentira" node "_teste/testa_nuvem.js" --envenenado-que-nao-existe\n';
}

let passes = 0, falhas = 0;
function conf(rotulo, ok, detalhe) {
  if (ok) { passes++; console.log('  OK    ' + rotulo); }
  else { falhas++; console.log('  FALHA ' + rotulo + (detalhe ? '  [' + detalhe + ']' : '')); }
}

/* Tira os comentários de bloco e as linhas de comentário (// ou # ou * no
 * começo), para um nome citado só na documentação da prova não contar. O //
 * dentro de uma string, como "https://", fica, porque só sai a linha que
 * COMEÇA com //. */
function semComentarios(t) {
  return t.replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/\r?\n/).filter(l => !/^\s*(\/\/|#|\*)/.test(l)).join('\n');
}

const linhas = portao.split(/\r?\n/).filter(l => /^\s*roda\s/.test(l) && /--envenenado-[A-Za-z0-9-]+/.test(l));
conf('o portão tem linhas de veneno (controle: mais de 50)', linhas.length > 50, String(linhas.length));

const faltam = [];
const cache = {};
linhas.forEach(l => {
  const arq = (l.match(/(_teste\/[A-Za-z0-9_.-]+\.(?:js|py|sh))/) || [])[1];
  /* Só as flags passadas à prova, DEPOIS do caminho do arquivo: o rótulo entre
   * aspas, antes dele, pode citar um nome abreviado ("folha impressa
   * --envenenado-contorno" roda --envenenado-contorno-no-papel). */
  const depois = arq ? l.slice(l.indexOf(arq) + arq.length) : l;
  const venenos = depois.match(/--envenenado-[A-Za-z0-9-]+/g) || [];
  if (!arq) { faltam.push('sem arquivo: ' + l.trim().slice(0, 80)); return; }
  const p = path.join(RAIZ, arq);
  if (!fs.existsSync(p)) { faltam.push(arq + ' não existe'); return; }
  const texto = cache[p] || (cache[p] = semComentarios(fs.readFileSync(p, 'utf8')));
  venenos.forEach(v => {
    const nome = v.slice('--envenenado-'.length).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    /* O arquivo da prova tem de citar o nome do veneno INTEIRO, fora de
     * comentário: com fronteira depois do nome, para "camada" não passar por
     * "camadas" nem "a" por qualquer nome que comece com a. */
    const inteiro = new RegExp('envenenado-' + nome + '(?![A-Za-z0-9-])');
    if (inteiro.test(texto)) return;
    // ...ou montá-lo de uma tabela: "'--envenenado-' + n" e a chave com o nome exato
    const monta = /['"]--envenenado-['"]\s*\+/.test(texto);
    const chave = new RegExp('(^|[\\s{,])([\'"]?)' + nome + '\\2\\s*:', 'm').test(texto);
    if (!(monta && chave)) faltam.push(arq + ' não conhece ' + v);
  });
});
/* Num modo envenenado, a prova TEM de ver a falha: no formato das outras
 * provas do portão, ver o veneno conta como verificação que passa, e não ver
 * é a falha. */
const ENVENENADA = process.argv.some(a => /^--envenenado-/.test(a));
if (ENVENENADA) {
  conf('VENENO visto: a prova acusa o veneno de nome que não existe (' + (faltam.join(' ; ') || 'nada acusado') + ')', faltam.length > 0);
} else {
  conf('todo veneno pedido pelo portão existe na prova chamada (' + linhas.length + ' linhas)', faltam.length === 0, faltam.slice(0, 5).join(' ; '));
}
console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
