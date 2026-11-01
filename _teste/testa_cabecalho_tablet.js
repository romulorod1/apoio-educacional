/* testa_cabecalho_tablet.js
 *
 * Prova estatica e de regras CSS para o item B5:
 * Cabecalho do tablet em pe em uma unica linha de 64 px e abas de toque de 44 px.
 */
'use strict';
const fs = require('fs');
const path = require('path');

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

const cssPath = path.join(__dirname, '..', 'styles.css');
const css = fs.readFileSync(cssPath, 'utf8');

secao('1. Presenca da media query B5 (721px a 900px)');

const temMediaQuery = /@media\s*\(\s*min-width:\s*721px\s*\)\s*and\s*\(\s*max-width:\s*900px\s*\)/.test(css);
conf('media query de 721 a 900 px declarada', temMediaQuery, true);

// Extrai o bloco da media query
const matchBloco = css.match(/@media\s*\(\s*min-width:\s*721px\s*\)\s*and\s*\(\s*max-width:\s*900px\s*\)\s*\{([\s\S]*?)\n\}/);
const bloco = matchBloco ? matchBloco[1] : '';

conf('bloco da media query B5 extraido com sucesso', Boolean(bloco.length), true);

secao('2. Regras do cabecalho compacto em 64 px');

const cabecalho64 = /\.cabecalho\s*\{[\s\S]*?(?:height:\s*64px|max-height:\s*64px)[\s\S]*?\}/.test(bloco);
conf('cabecalho possui altura fixada em 64px', cabecalho64, true);

const semSubtitulo = /\.marca\s+span\s*\{[\s\S]*?display:\s*none[\s\S]*?\}/.test(bloco);
conf('subtitulo da marca oculto na faixa tablet em pe', semSubtitulo, true);

const abasSemQuebra = /\.abas\s*\{[\s\S]*?flex-wrap:\s*nowrap[\s\S]*?\}/.test(bloco);
conf('abas com flex-wrap: nowrap para impedir quebra em duas linhas', abasSemQuebra, true);

const aba44 = /\.aba\s*\{[\s\S]*?height:\s*44px[\s\S]*?\}/.test(bloco);
conf('alvo de toque das abas com altura de 44px', aba44, true);

secao('3. Regra zero travessoes (em-dash e en-dash)');

const temEmDash = /\u2014/.test(bloco);
const temEnDash = /\u2013/.test(bloco);
conf('sem em-dash no bloco B5', temEmDash, false);
conf('sem en-dash no bloco B5', temEnDash, false);

secao('4. Venenos de controle (reprova caso regras sejam violadas)');

function validaBloco(conteudo) {
  const hasMq = /@media\s*\(\s*min-width:\s*721px\s*\)\s*and\s*\(\s*max-width:\s*900px\s*\)/.test(conteudo);
  const m = conteudo.match(/@media\s*\(\s*min-width:\s*721px\s*\)\s*and\s*\(\s*max-width:\s*900px\s*\)\s*\{([\s\S]*?)\n\}/);
  if (!hasMq || !m) return false;
  const b = m[1];
  const h64 = /\.cabecalho\s*\{[\s\S]*?(?:height:\s*64px|max-height:\s*64px)[\s\S]*?\}/.test(b);
  const noSub = /\.marca\s+span\s*\{[\s\S]*?display:\s*none[\s\S]*?\}/.test(b);
  const noWrap = /\.abas\s*\{[\s\S]*?flex-wrap:\s*nowrap[\s\S]*?\}/.test(b);
  const h44 = /\.aba\s*\{[\s\S]*?height:\s*44px[\s\S]*?\}/.test(b);
  return h64 && noSub && noWrap && h44;
}

conf('validador aprova o CSS real', validaBloco(css), true);
conf('veneno: sem media query reprova', validaBloco(css.replace(/@media\s*\(\s*min-width:\s*721px\s*\)/, '@media (min-width: 9999px)')), false);
conf('veneno: sem subtitulo oculto reprova', validaBloco(css.replace(/(min-width:\s*721px[\s\S]*?\.marca\s+span\s*\{[\s\S]*?)display:\s*none;/, '$1display: block;')), false);
conf('veneno: sem abas 44px reprova', validaBloco(css.replace(/(min-width:\s*721px[\s\S]*?\.aba\s*\{[\s\S]*?)height:\s*44px;/, '$1height: 32px;')), false);
conf('veneno: com flex-wrap: wrap reprova', validaBloco(css.replace(/(min-width:\s*721px[\s\S]*?\.abas\s*\{[\s\S]*?)flex-wrap:\s*nowrap;/, '$1flex-wrap: wrap;')), false);

console.log('\n' + '='.repeat(60));
console.log(passes + ' verificacoes passaram, ' + falhas + ' falharam.');
console.log('='.repeat(60));

if (falhas > 0) process.exit(1);
