/* entrada.js: o que o esbuild empacota em vendor/mathjax-4.1.3/mathjax-svg.min.js.
 *
 * Só o MathJax: LaTeX para o texto de um <svg>, de forma SÍNCRONA, sem DOM
 * (adaptador lite) e sem rede. O tradutor do SVG para operadores de PDF
 * (svg-para-pdf.js) e as escolhas da casa (macros do português, número com
 * vírgula, hora, arco) moram no aplicativo, no formula.js, e não aqui: mudar
 * uma delas não pede um vendor novo.
 *
 * O pacote põe um global só, MathJaxDoApp, com:
 *   versao             '4.1.3'
 *   criar(opcoesTex)   um conversor novo: { latexParaSvg(latex, display) },
 *                      que devolve UM <svg> por fórmula,
 *                      com a entrada TeX configurada por opcoesTex (macros,
 *                      digits, ...), por cima do padrão daqui
 *   blocosCarregados   os blocos dinâmicos da fonte que já foram pedidos
 *   aoMhchem(fn)       fn(tex) recebe o TeX que o mhchem gerou para um \ce{} e
 *                      devolve o TeX a usar (é onde o formula.js empilha a
 *                      carga sobre o índice, como nos livros brasileiros)
 *
 * TeX com base, ams, mhchem, color, cancel, newcommand, boldsymbol e
 * configmacros; SEM noundefined e sem noerrors: comando que não existe dá erro
 * (que o formula.js transforma em falha alta), nunca sai escrito na folha.
 * Saída SVG com fontCache 'local': os glifos vêm em <defs>, citados por <use>,
 * que é o que deixa o pdf.js registrar cada glifo uma vez por documento.
 *
 * Os blocos dinâmicos da fonte New Computer Modern (letra acentuada, conjunto
 * numérico, caligráfica, fraktur, script, símbolos de matemática) entram
 * empacotados e são servidos pelo carregador síncrono abaixo. Bloco fora da
 * lista dá erro com o nome dele (falha alta), e não letra sumida.
 *
 * Regra da casa: nunca usar travessão.
 */
'use strict';
var mathjax = require('@mathjax/src/js/mathjax.js').mathjax;
var TeX = require('@mathjax/src/js/input/tex.js').TeX;
var SVG = require('@mathjax/src/js/output/svg.js').SVG;
var liteAdaptor = require('@mathjax/src/js/adaptors/liteAdaptor.js').liteAdaptor;
var RegisterHTMLHandler = require('@mathjax/src/js/handlers/html.js').RegisterHTMLHandler;
var Fonte = require('@mathjax/mathjax-newcm-font/js/svg.js').MathJaxNewcmFont;
/* O MESMO arquivo que o MhchemConfiguration do cjs pede ('#mhchem/*' aponta
 * para mhchemparser/dist/ no cjs/package.json do @mathjax/src). Pela cópia
 * esm/ o gancho do aoMhchem caía noutro objeto e nunca era chamado. */
var Mhchem = require('mhchemparser/dist/mhchemParser.js').mhchemParser;

require('@mathjax/src/js/input/tex/base/BaseConfiguration.js');
require('@mathjax/src/js/input/tex/ams/AmsConfiguration.js');
require('@mathjax/src/js/input/tex/mhchem/MhchemConfiguration.js');
require('@mathjax/src/js/input/tex/color/ColorConfiguration.js');
require('@mathjax/src/js/input/tex/cancel/CancelConfiguration.js');
require('@mathjax/src/js/input/tex/newcommand/NewcommandConfiguration.js');
require('@mathjax/src/js/input/tex/boldsymbol/BoldsymbolConfiguration.js');
require('@mathjax/src/js/input/tex/configmacros/ConfigMacrosConfiguration.js');

var BLOCOS = {
  '@mathjax/mathjax-newcm-font/js/svg/dynamic/latin.js': function () { return require('@mathjax/mathjax-newcm-font/js/svg/dynamic/latin.js'); },
  '@mathjax/mathjax-newcm-font/js/svg/dynamic/double-struck.js': function () { return require('@mathjax/mathjax-newcm-font/js/svg/dynamic/double-struck.js'); },
  '@mathjax/mathjax-newcm-font/js/svg/dynamic/calligraphic.js': function () { return require('@mathjax/mathjax-newcm-font/js/svg/dynamic/calligraphic.js'); },
  '@mathjax/mathjax-newcm-font/js/svg/dynamic/math.js': function () { return require('@mathjax/mathjax-newcm-font/js/svg/dynamic/math.js'); },
  '@mathjax/mathjax-newcm-font/js/svg/dynamic/script.js': function () { return require('@mathjax/mathjax-newcm-font/js/svg/dynamic/script.js'); },
  '@mathjax/mathjax-newcm-font/js/svg/dynamic/fraktur.js': function () { return require('@mathjax/mathjax-newcm-font/js/svg/dynamic/fraktur.js'); }
};
var blocosCarregados = [];
mathjax.asyncLoad = function (arquivo) {
  if (!BLOCOS[arquivo]) throw new Error('bloco de fonte fora do pacote: ' + String(arquivo).split('/').pop());
  blocosCarregados.push(String(arquivo).split('/').pop());
  return BLOCOS[arquivo]();
};
mathjax.asyncIsSynchronous = true;
Fonte.addExtension(require('@mathjax/mathjax-mhchem-font-extension/cjs/svg.js').MathJaxMhchemFontExtension);

var posMhchem = null;
var toTexOriginal = Mhchem.toTex;
Mhchem.toTex = function () {
  var tex = toTexOriginal.apply(this, arguments);
  return posMhchem ? posMhchem(tex) : tex;
};

var PACOTES = ['base', 'ams', 'mhchem', 'color', 'cancel', 'newcommand', 'boldsymbol', 'configmacros'];
var registrado = null, fonteUnica = null;

function criar(opcoesTex) {
  /* Um adaptador e um tratador de HTML para o pacote inteiro: registrar o
   * tratador de novo a cada criar() empilharia um por chamada. */
  if (!registrado) { registrado = liteAdaptor({ fontSize: 16 }); RegisterHTMLHandler(registrado); }
  var adaptor = registrado;
  var conf = { packages: PACOTES.slice(), formatError: function (jax, err) { throw err; } };
  for (var k in (opcoesTex || {})) if (Object.prototype.hasOwnProperty.call(opcoesTex, k)) conf[k] = opcoesTex[k];
  var tex = new TeX(conf);
  /* Sem a quebra automática da fórmula em linha, que o MathJax 4 liga por
   * padrão: com ela a fórmula vira VÁRIOS <svg> (um por pedaço) e o tradutor,
   * que lê um, desenhava só o primeiro ("x^{2} - 4 = 0" saía "x²"). Quem quebra
   * a linha da folha é o pdf.js, com a fórmula inteira como uma palavra. */
  /* Uma fonte só para o pacote inteiro: o segundo criar() com uma fonte NOVA
   * estourava a pilha (RangeError no getChar) na primeira letra de bloco
   * dinâmico que a primeira fonte já tinha carregado (medido: 66 de 396 do
   * corpus, e parava). Com a instância reusada, as duas dão o corpus inteiro. */
  var svg = new SVG({ fontCache: 'local', fontData: fonteUnica || Fonte, linebreaks: { inline: false } });
  if (!fonteUnica) fonteUnica = svg.font;
  var doc = mathjax.document('', { InputJax: tex, OutputJax: svg });
  return {
    latexParaSvg: function (latex, display) {
      var no = doc.convert(String(latex), { display: display !== false, em: 16, ex: 8, containerWidth: 1280 });
      return adaptor.innerHTML(no);
    }
  };
}

var alvo = typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this);
alvo.MathJaxDoApp = {
  versao: '4.1.3',
  criar: criar,
  blocosCarregados: blocosCarregados,
  aoMhchem: function (fn) { posMhchem = typeof fn === 'function' ? fn : null; }
};
