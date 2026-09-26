/* testa_tapar_numeros.js
 *
 * O retângulo de tapar só vai para o papel com número de verdade.
 *
 * O laço do pdf.js que emite os retângulos brancos conferia a largura e a
 * altura, e não a posição: um item com `x` ou `y` ausente, NaN ou infinito
 * escrevia "NaN" dentro do operador `re` do PDF, e o que o leitor de PDF faz
 * com isso é problema dele (alguns descartam a página inteira). Achado pela
 * lente de correção do PR #57.
 *
 * Sem navegador: gera a folha pelo mesmo caminho do fechamento com folhas, com
 * quatro retângulos, três com posição que não é número e um bom, e confere o
 * texto do PDF (o gerador não comprime).
 *
 * Modo envenenado:
 *   node _teste/testa_tapar_numeros.js --envenenado-numeros
 *     o laço volta a conferir só largura e altura, e o PDF tem de sair com
 *     "NaN" dentro.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const VENENO = process.argv.indexOf('--envenenado-numeros') !== -1;
let passes = 0, falhas = 0;
function conf(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (ok) { passes++; console.log('  OK    ' + nome); }
  else { falhas++; console.log('  FALHA ' + nome + '  [obtido: ' + JSON.stringify(obtido) + ' | esperado: ' + JSON.stringify(esperado) + ']'); }
  return ok;
}

let fonte = fs.readFileSync(path.join(RAIZ, 'pdf.js'), 'utf8');
const NL = fonte.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
const ANCORA = [
  "      if (r.t !== 'tapar' || typeof r.x !== 'number' || typeof r.y !== 'number' ||",
  "        !isFinite(r.x) || !isFinite(r.y) || !(r.w > 0) || !(r.h > 0) || !isFinite(r.w) || !isFinite(r.h)) continue;"
].join(NL);
conf('a âncora do veneno casa exatamente uma vez no pdf.js', fonte.split(ANCORA).length - 1, 1);
if (VENENO) {
  const antes = fonte;
  fonte = fonte.split(ANCORA).join("      if (r.t !== 'tapar' || !(r.w > 0) || !(r.h > 0)) continue;");
  conf('o veneno mudou mesmo o pdf.js', fonte !== antes ? 'diferente' : 'IGUAL', 'diferente');
}
const raiz = {};
new Function('self', fonte + '\nreturn self;')(raiz);
const Core = require(path.join(RAIZ, 'core.js'));
const db = {
  alunos: [{ id: 'a1', nome: 'Aluno de Prova', valorHora: 100, cor: '#1F3A5F' }],
  aulas: [{ id: 'x1', alunoId: 'a1', data: '2026-09-10', hora: '08:00', duracaoMin: 60, status: 'realizada', cobravel: true }],
  resumos: []
};
const f = Core.calcularFechamento(db, 'a1', '2026-09');
function gera(itens) {
  const bytes = raiz.PDFGen.gerarFechamento(f, {
    incluirNotas: true, notas: [{ data: '2026-09-24', paginas: [{ fundo: 'branco', itens: itens }] }],
    imagens: {}, sempreResumo: true
  });
  return Buffer.from(bytes).toString('latin1');
}
const ruins = [
  { t: 'tapar', x: NaN, y: 100, w: 200, h: 60 },
  { t: 'tapar', y: 200, w: 200, h: 60 },
  { t: 'tapar', x: 10, y: Infinity, w: 200, h: 60 }
];
const bom = { t: 'tapar', x: 100, y: 400, w: 300, h: 80 };
const soBom = gera([bom]);
const comRuins = gera(ruins.concat([bom]));
/* O ALVO: o documento só com o retângulo bom. Os ruins não podem acrescentar
 * nada a ele, nem um operador. */
const conta = (t, re) => (t.match(re) || []).length;
const brancos = t => conta(t, / re f/g);
const semNada = gera([]);
console.log('   retângulos cheios: sem tapar ' + brancos(semNada) + ', só o bom ' + brancos(soBom) + ', com os ruins ' + brancos(comRuins));
if (VENENO) {
  conf('VENENO ENXERGADO: o PDF saiu com "NaN" dentro', /NaN|Infinity/.test(comRuins), true);
} else {
  conf('nenhum "NaN" nem "Infinity" no PDF', /NaN|Infinity/.test(comRuins), false);
  conf('e os três retângulos ruins não acrescentaram placa nenhuma', brancos(comRuins), brancos(soBom));
  conf('e o bom continua indo para o papel: um retângulo a mais que a folha sem tapar', brancos(soBom) - brancos(semNada), 1);
}
console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
