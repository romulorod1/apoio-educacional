/* testa_sistema_visual.js
 *
 * Trava do item B12 (sistema visual), sem navegador, no portão rápido:
 * 1. Nenhuma cor literal (hexadecimal, rgb(), rgba(), hsl(), white, black)
 *    fora do :root no styles.css. Cor nova entra como variável no :root.
 * 2. No máximo 6 tamanhos de letra distintos no styles.css, já resolvidas as
 *    variáveis (--letra-1 a --letra-6).
 *
 * A contagem é a mesma do _teste/estatisticas_css.js, que gera o relatório de
 * antes e depois: a trava e o relatório não podem medir coisas diferentes.
 *
 * Venenos: uma cópia do CSS com uma cor solta e outra com um sétimo tamanho
 * TÊM de reprovar; e do outro lado, uma regra nova que usa variável, e uma cor
 * citada só em comentário, NÃO podem ser acusadas. Antes de acreditar no zero,
 * o instrumento prova que vê: as cores de dentro do :root existem e são
 * achadas quando o :root é tirado do caminho.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const E = require('./estatisticas_css.js');

const TETO_TAMANHOS = 6;
let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else {
    falhas++;
    console.error('  FALHA | ' + rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado);
  }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo);
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

/* O veredito da trava para um texto de CSS: lista de motivos (vazia = passa). */
function avaliar(css) {
  const lido = E.lerCss(css);
  const motivos = [];
  const soltas = E.coresSoltas(lido);
  soltas.forEach(s => motivos.push('cor solta ' + s.cor + ' (linha ' + s.linha + ' fora do :root)'));
  const tamanhos = Object.keys(E.tamanhosDeLetra(lido));
  if (tamanhos.length > TETO_TAMANHOS) motivos.push(tamanhos.length + ' tamanhos de letra: ' + tamanhos.join(', '));
  return { motivos, soltas: soltas.length, tamanhos: tamanhos.length };
}

const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

secao('1. O instrumento vê');
const lido = E.lerCss(css);
const coresNaRaiz = lido.root.join('\n').match(/#[0-9A-Fa-f]{6}\b/g) || [];
conf('o :root tem cores escritas (o que a trava deixa passar existe)', coresNaRaiz.length > 10, true);
const semRaiz = E.coresSoltas({ fora: lido.root.join('\n').replace(/:root\s*\{/, '.x {'), vars: {} });
conf('tirado o :root do caminho, as mesmas cores são achadas', semRaiz.length >= coresNaRaiz.length, true);
const tam = E.tamanhosDeLetra(lido);
conf('os tamanhos usados são achados (há font-size na folha)', Object.keys(tam).length > 0, true);
conf('os tamanhos saem resolvidos das variáveis, em px',
  Object.keys(tam).every(t => /^\d+(\.\d+)?px$/.test(t)), true);

secao('2. O styles.css de agora');
const real = avaliar(css);
real.motivos.slice(0, 10).forEach(m => console.log('    ' + m));
conf('nenhuma cor literal fora do :root', real.soltas, 0);
conf('tamanhos de letra distintos dentro do teto de ' + TETO_TAMANHOS, real.tamanhos <= TETO_TAMANHOS, true);

secao('3. Venenos que TÊM de reprovar');
const vCor = avaliar(css + '\n.veneno-cor { color: #123456; }\n');
conf('cópia com uma cor hexadecimal solta reprova', vCor.motivos.some(m => /#123456/.test(m)), true);
const vRgba = avaliar(css + '\n.veneno-sombra { box-shadow: 0 1px 2px rgba(0, 0, 0, .3); }\n');
conf('cópia com um rgba() solto numa sombra reprova', vRgba.soltas, 1);
const vNome = avaliar(css + '\n.veneno-nome { background: white; }\n');
conf('cópia com um nome de cor solto reprova', vNome.soltas, 1);
const vTam = avaliar(css + '\n.veneno-tamanho { font-size: 27px; }\n');
conf('cópia com um sétimo tamanho de letra reprova', vTam.motivos.some(m => /tamanhos de letra/.test(m)), true);
const vVar = avaliar(css.replace(/(:root\s*\{)/, '$1\n  --veneno-letra: 27px;') + '\n.veneno-var { font-size: var(--veneno-letra); }\n');
conf('cópia com um sétimo tamanho escondido numa variável nova reprova', vVar.motivos.some(m => /27px/.test(m)), true);

secao('4. Do outro lado: o que NÃO pode ser acusado');
const okVar = avaliar(css + '\n.nova { color: var(--navy); font-size: var(--letra-3); }\n');
conf('regra nova que usa variável de cor e degrau da escala passa', okVar.motivos.length, 0);
const okComent = avaliar(css + '\n/* antes era #ABCDEF e font-size: 27px */\n.nova { color: var(--teal); }\n');
conf('cor e tamanho citados só em comentário não são acusados', okComent.motivos.length, 0);
const okSeletor = avaliar(css + '\n.tag.gold:hover, #FFF000 { border-color: var(--gold); }\n');
conf('nome de cor num seletor ou id não vira cor solta', okSeletor.soltas, 0);
const okRaiz = avaliar(css.replace(/(:root\s*\{)/, '$1\n  --cor-nova: #ABCDEF;'));
conf('cor nova declarada no :root passa', okRaiz.motivos.length, 0);

console.log('\n' + '='.repeat(60));
console.log(passes + ' verificacoes passaram, ' + falhas + ' falharam.');
console.log('='.repeat(60));
if (falhas > 0) process.exit(1);
