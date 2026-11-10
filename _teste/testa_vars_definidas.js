/* testa_vars_definidas.js
 *
 * Um var(--x) sem definição não dá erro em lugar nenhum: o navegador usa o
 * valor herdado (ou o inicial) e a tela muda calada. Achado em 09/11/2026: a
 * F1 trocou a escala de letra (--letra-1 a --letra-6, em px, viraram
 * --letra-12 a --letra-24, em rem), e o aviso do celular do #136, que citava
 * a --letra-3, entrou sem conflito no styles.css, com a letra caindo na
 * herdada. Nenhuma prova de tela pegaria, porque a diferença era de 14 px para
 * a letra do pai.
 *
 * Esta prova junta todo var(--x) do styles.css, do index.html e do app.js, e
 * confere que cada um tem uma definição "--x:" no styles.css ou no index.html,
 * ou está na lista de EXCEÇÕES: as variáveis que o JS põe em cada elemento,
 * pelo atributo style ou com setProperty. Cada exceção TEM de aparecer no
 * app.js como "'--x:" ou "setProperty('--x'" (o JS a pondo de verdade), para
 * a lista não envelhecer calada.
 * Sem navegador.
 *
 * Venenos:
 *   --envenenado-letra-3        planta uma regra com var(--letra-3) no
 *                               styles.css lido; a prova TEM de acusar.
 *   --envenenado-excecao-velha  põe na lista uma exceção que o JS não põe
 *                               mais; a prova TEM de acusar.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const ler = a => fs.readFileSync(path.join(RAIZ, a), 'utf8');

/* As variáveis que o app.js põe no atributo style de cada elemento: não têm
 * definição no CSS, e a regra que as usa só vale dentro desse elemento. */
const EXCECOES = ['--cor-aluno', '--lado-colunas', '--sobe'];

const MODOS = ['--envenenado-letra-3', '--envenenado-excecao-velha'];
const MODO = MODOS.filter(m => process.argv.indexOf(m) >= 0)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && MODOS.indexOf(a) < 0);

let css = ler('styles.css');
const html = ler('index.html');
const app = ler('app.js');
const excecoes = EXCECOES.slice();
if (MODO === '--envenenado-letra-3') css += '\n.prova-veneno { font-size: var(--letra-3); }\n';
if (MODO === '--envenenado-excecao-velha') excecoes.push('--cor-que-o-js-nao-poe');

let passes = 0, falhas = 0;
function conf(rotulo, ok, detalhe) {
  if (ok) { passes++; console.log('  OK    ' + rotulo); }
  else { falhas++; console.log('  FALHA ' + rotulo + (detalhe ? '  [' + detalhe + ']' : '')); }
}

/* O comentário de bloco sai: um var(--x) citado só na documentação não é uso,
 * e um "--x:" citado só em comentário não é definição. */
// Cada comentário vira as mesmas quebras de linha, para o número da linha acusada bater com o arquivo.
const vazioIgual = c => c.replace(/[^\n]/g, '');
const semComentario = t => t.replace(/\/\*[\s\S]*?\*\//g, vazioIgual);
const cssLimpo = semComentario(css);
const htmlLimpo = html.replace(/<!--[\s\S]*?-->/g, vazioIgual);
const appLimpo = semComentario(app);

const usos = new Map();
function juntarUsos(texto, onde) {
  const re = /var\(\s*(--[A-Za-z0-9_-]+)/g;
  let m;
  while ((m = re.exec(texto))) {
    const linha = texto.slice(0, m.index).split('\n').length;
    if (!usos.has(m[1])) usos.set(m[1], []);
    usos.get(m[1]).push(onde + ':' + linha);
  }
}
juntarUsos(cssLimpo, 'styles.css');
juntarUsos(htmlLimpo, 'index.html');
juntarUsos(appLimpo, 'app.js');

const definidas = new Set();
[cssLimpo, htmlLimpo].forEach(t => {
  const re = /(--[A-Za-z0-9_-]+)\s*:/g;
  let m;
  while ((m = re.exec(t))) definidas.add(m[1]);
});

conf('nenhum --envenenado- desconhecido foi pedido (' + (desconhecidos.join(' ') || 'nenhum') + ')', desconhecidos.length === 0);
// Controle: a prova enxerga os usos e as definições (a escala da F1 entre elas).
conf('a prova enxerga os usos (controle: mais de 50 nomes)', usos.size > 50, String(usos.size));
conf('a prova enxerga as definições (controle: a --letra-14 está lá)', definidas.has('--letra-14'));

const semDefinicao = [...usos.keys()].filter(v => !definidas.has(v) && excecoes.indexOf(v) < 0).sort();
// O JS põe a variável no atributo style ('--x:...') ou com setProperty('--x', ...).
const excecaoVelha = excecoes.filter(v => appLimpo.indexOf("'" + v + ':') < 0 && appLimpo.indexOf("setProperty('" + v + "'") < 0);
const excecaoDefinida = excecoes.filter(v => definidas.has(v));
const descreve = l => l.map(v => v + ' em ' + (usos.get(v) || ['nenhum uso']).slice(0, 3).join(',')).join(' ; ');

if (MODO === '--envenenado-letra-3') {
  conf('VENENO visto: o var(--letra-3) plantado é acusado (' + (descreve(semDefinicao) || 'nada acusado') + ')',
    semDefinicao.indexOf('--letra-3') >= 0);
} else if (MODO === '--envenenado-excecao-velha') {
  conf('VENENO visto: a exceção que o JS não põe é acusada (' + (excecaoVelha.join(' ') || 'nada acusado') + ')',
    excecaoVelha.indexOf('--cor-que-o-js-nao-poe') >= 0);
} else {
  conf('todo var(--x) tem definição ou é exceção nomeada (' + usos.size + ' nomes)', semDefinicao.length === 0, descreve(semDefinicao));
  conf('cada exceção é posta de verdade pelo app.js (' + excecoes.join(' ') + ')', excecaoVelha.length === 0, excecaoVelha.join(' '));
  conf('nenhuma exceção ganhou definição no CSS (sairia da lista)', excecaoDefinida.length === 0, excecaoDefinida.join(' '));
}

console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
