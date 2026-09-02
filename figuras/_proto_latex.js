/* _proto_latex.js
 * Prototipo, so para ver. Nao e implementacao.
 *
 * A pergunta era se vale escrever um renderizador de LaTeX em cima do kit de
 * figuras, em vez de trazer KaTeX ou MathJax. Este arquivo desenha a resposta:
 * as mesmas expressoes do jeito que saem hoje, em linha, e do jeito que sairiam
 * empilhadas.
 *
 * O modelo e o mesmo do TeX: toda coisa desenhavel e uma CAIXA com largura,
 * altura acima da linha de base e profundidade abaixo dela. Caixa se compoe com
 * caixa, e e isso que permite fracao dentro de raiz dentro de expoente.
 */
const PDFGen = require('../pdf.js');
const fs = require('fs');

const COR = PDFGen.COR;
const MARG_E = PDFGen.MARG_E;

/* Metricas da Helvetica que o pdf.js ja usa. Nao ha como perguntar a fonte,
 * entao ficam aqui as tres que o empilhamento precisa. */
const ALTURA = 0.717;      // topo da maiuscula acima da linha de base
const FUNDO = 0.21;        // quanto a perna do p desce
const EIXO = 0.25;         // altura do sinal de igual, onde a fracao se centra

function caixa(largura, altura, profundidade, desenhar) {
  return { largura: largura, altura: altura, profundidade: profundidade, desenhar: desenhar };
}

/* Um pedaco de texto. A caixa mais simples que existe. */
function atomo(txt, tam, bold) {
  tam = tam || 11;
  return caixa(
    PDFGen.medir(txt, tam, bold), tam * ALTURA, tam * FUNDO,
    function (doc, x, y) { doc.texto(txt, x, y, { tam: tam, bold: !!bold, cor: COR.texto }); }
  );
}

/* Caixas lado a lado na mesma linha de base. */
function linha(itens, folga) {
  folga = folga === undefined ? 0 : folga;
  var largura = itens.reduce(function (s, c) { return s + c.largura; }, 0) + folga * (itens.length - 1);
  var altura = Math.max.apply(null, itens.map(function (c) { return c.altura; }));
  var fundo = Math.max.apply(null, itens.map(function (c) { return c.profundidade; }));
  return caixa(largura, altura, fundo, function (doc, x, y) {
    var px = x;
    itens.forEach(function (c) { c.desenhar(doc, px, y); px += c.largura + folga; });
  });
}

/* A fracao empilhada, que e o caso que a fonte nao resolve.
 * O numerador sobe, o denominador desce, e a barra fica na altura do eixo, que
 * e onde o sinal de igual passa. E por isso que a fracao "parece" centrada. */
function fracao(num, den, tam) {
  tam = tam || 11;
  var larg = Math.max(num.largura, den.largura) + tam * 0.6;
  var eixo = tam * EIXO;
  var folga = tam * 0.22;
  var alturaNum = eixo + folga + num.profundidade + num.altura;
  var fundoDen = -eixo + folga + den.altura + den.profundidade;
  return caixa(larg, alturaNum, fundoDen, function (doc, x, y) {
    var meio = y + eixo;
    doc.linha(x, meio, x + larg, meio, COR.texto, 0.7);
    num.desenhar(doc, x + (larg - num.largura) / 2, meio + folga + num.profundidade);
    den.desenhar(doc, x + (larg - den.largura) / 2, meio - folga - den.altura);
  });
}

/* A raiz COM a barra sobre o radicando, que e o que o glifo da fonte nao tem.
 * O gancho e desenhado a mao com quatro segmentos, e a barra se estende pela
 * largura do que estiver dentro, qualquer que seja. */
function raiz(dentro, tam, indice) {
  tam = tam || 11;
  var folgaCima = tam * 0.18;
  var largGancho = tam * 0.62;
  var largIndice = indice ? PDFGen.medir(indice, tam * 0.6, false) + 1 : 0;
  var alt = dentro.altura + folgaCima;
  var larg = largIndice + largGancho + dentro.largura + tam * 0.22;
  return caixa(larg, alt, dentro.profundidade, function (doc, x, y) {
    var topo = y + alt;
    var base = y - dentro.profundidade;
    var g = x + largIndice;
    doc.linha(g, y + tam * 0.30, g + largGancho * 0.28, base, COR.texto, 0.8);
    doc.linha(g + largGancho * 0.28, base, g + largGancho * 0.62, topo, COR.texto, 1.0);
    doc.linha(g + largGancho * 0.62, topo, x + larg, topo, COR.texto, 0.8);
    if (indice) {
      doc.texto(indice, x, y + tam * 0.55, { tam: tam * 0.6, cor: COR.texto });
    }
    dentro.desenhar(doc, g + largGancho, y);
  });
}

/* Expoente e indice: mesma caixa, menor, deslocada. */
function nivel(base, cima, baixo, tam) {
  tam = tam || 11;
  var menor = tam * 0.62;
  var sobe = tam * 0.42, desce = tam * 0.20;
  var extra = Math.max(cima ? cima.largura : 0, baixo ? baixo.largura : 0);
  return caixa(base.largura + extra + 1,
    base.altura + (cima ? sobe : 0), base.profundidade + (baixo ? desce : 0),
    function (doc, x, y) {
      base.desenhar(doc, x, y);
      if (cima) cima.desenhar(doc, x + base.largura + 1, y + sobe);
      if (baixo) baixo.desenhar(doc, x + base.largura + 1, y - desce);
    });
}

/* Operador grande com limite em cima e embaixo: somatorio, limite, integral.
 * O sinal fica no meio e os limites centrados nele. */
function operador(sinal, cima, baixo, tam) {
  tam = tam || 11;
  var s = sinal(tam);
  var larg = Math.max(s.largura, cima ? cima.largura : 0, baixo ? baixo.largura : 0);
  var folga = tam * 0.14;
  return caixa(larg + tam * 0.2,
    s.altura + (cima ? folga + cima.altura + cima.profundidade : 0),
    s.profundidade + (baixo ? folga + baixo.altura + baixo.profundidade : 0),
    function (doc, x, y) {
      s.desenhar(doc, x + (larg - s.largura) / 2, y);
      if (cima) cima.desenhar(doc, x + (larg - cima.largura) / 2, y + s.altura + folga + cima.profundidade);
      if (baixo) baixo.desenhar(doc, x + (larg - baixo.largura) / 2, y - s.profundidade - folga - baixo.altura);
    });
}

/* O sigma de somatorio, desenhado. O Sigma grego da fonte existe, mas e uma
 * letra: fica pequeno demais e com proporcao de texto, nao de operador. */
function sigmaGrande(tam) {
  var h = tam * 1.15, w = tam * 0.78;
  return caixa(w, h * 0.78, h * 0.22, function (doc, x, y) {
    var topo = y + h * 0.78, base = y - h * 0.22, meio = (topo + base) / 2;
    doc.linha(x, topo, x + w, topo, COR.texto, 1.0);
    doc.linha(x + w, topo, x + w * 0.16, meio, COR.texto, 1.0);
    doc.linha(x + w * 0.16, meio, x + w, base, COR.texto, 1.0);
    doc.linha(x, base, x + w, base, COR.texto, 1.0);
  });
}

/* A seta do limite. A fonte nao tem: sai como interrogacao. */
function seta(tam) {
  var w = tam * 1.0;
  return caixa(w + tam * 0.3, tam * 0.4, 0, function (doc, x, y) {
    var m = y + tam * 0.26;
    doc.linha(x + tam * 0.15, m, x + w, m, COR.texto, 0.8);
    doc.linha(x + w - tam * 0.22, m + tam * 0.13, x + w, m, COR.texto, 0.8);
    doc.linha(x + w - tam * 0.22, m - tam * 0.13, x + w, m, COR.texto, 0.8);
  });
}

/* Matriz entre colchetes que crescem com o conteudo. */
function matriz(linhasM, tam) {
  tam = tam || 11;
  var salto = tam * 1.5;
  var colunas = linhasM[0].length;
  var largCol = [];
  for (var c = 0; c < colunas; c++) {
    largCol.push(Math.max.apply(null, linhasM.map(function (l) { return l[c].largura; })) + tam * 0.7);
  }
  var largTotal = largCol.reduce(function (a, b) { return a + b; }, 0);
  var alt = (linhasM.length - 1) * salto / 2 + tam * 0.7;
  var colchete = tam * 0.28;
  return caixa(largTotal + colchete * 2 + tam * 0.4, alt + tam * 0.1, alt - tam * 0.1,
    function (doc, x, y) {
      var meio = y + tam * EIXO;
      var topo = meio + alt, base = meio - alt;
      var xi = x + colchete;
      [[xi, 1], [x + largTotal + colchete * 2 + tam * 0.4 - colchete, -1]].forEach(function (par) {
        doc.linha(par[0], topo, par[0], base, COR.texto, 0.9);
        doc.linha(par[0], topo, par[0] + colchete * par[1], topo, COR.texto, 0.9);
        doc.linha(par[0], base, par[0] + colchete * par[1], base, COR.texto, 0.9);
      });
      linhasM.forEach(function (l, i) {
        var py = meio + (linhasM.length - 1) * salto / 2 - i * salto - tam * 0.25;
        var px = x + colchete + tam * 0.2;
        l.forEach(function (cel, j) {
          cel.desenhar(doc, px + (largCol[j] - cel.largura) / 2, py);
          px += largCol[j];
        });
      });
    });
}

/* ------------------------------------------------------------------ folha */

const doc = new PDFGen.Doc();
doc.novaPagina();
doc.cabecalhoDeSecao('LaTeX no material', 'Como sai hoje e como sairia');
doc.y -= 18;
doc.escreverRico('Cada par abaixo mostra a MESMA expressao. Em cima, do jeito que o gerador ' +
  'escreve hoje, com a fonte. Embaixo, do jeito que sairia com o subconjunto de LaTeX ' +
  'desenhado pelo kit de figuras.', { tam: 10 });
doc.y -= 6;

const A = function (t, tam) { return atomo(t, tam || 11); };

function par(titulo, fonte, latex, montado) {
  doc.y -= 22;
  doc.texto(titulo, MARG_E, doc.y, { tam: 9, bold: true, cor: COR.teal, tracking: 0.8 });
  doc.y -= 15;
  doc.texto('hoje', MARG_E, doc.y, { tam: 7.5, cor: COR.muted });
  doc.escreverRico(fonte, { x: MARG_E + 42, tam: 11 });
  doc.y -= 10;
  doc.texto('em LaTeX', MARG_E, doc.y, { tam: 7.5, cor: COR.muted });
  doc.texto(latex, MARG_E + 42, doc.y, { tam: 8, cor: COR.muted });
  doc.y -= montado.altura + 6;
  doc.texto('sairia', MARG_E, doc.y, { tam: 7.5, cor: COR.muted });
  montado.desenhar(doc, MARG_E + 42, doc.y);
  doc.y -= montado.profundidade + 4;
}

// 1. fracao simples
par('Fracao',
  '1/2 + 3/4 = 5/4',
  '\\frac{1}{2} + \\frac{3}{4} = \\frac{5}{4}',
  linha([fracao(A('1'), A('2')), A(' + '), fracao(A('3'), A('4')),
         A(' = '), fracao(A('5'), A('4'))], 2));

// 2. a formula de Bhaskara, o caso que motivou a pergunta
par('A formula do 2o grau',
  'x = (-b ± √(b^{2} - 4·a·c)) / (2·a)',
  'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
  linha([A('x'), A(' = '),
         fracao(linha([A('-b '), A('±'), A(' '),
                       raiz(linha([nivel(A('b'), A('2', 7), null), A(' - 4ac')]))]),
                A('2a'))], 2));

// 3. limite com fracao dentro
par('Limite',
  'lim quando x tende a 2 de (x^{2} - 4)/(x - 2)',
  '\\lim_{x \\to 2} \\frac{x^2-4}{x-2}',
  linha([operador(function (t) { return atomo('lim', t); },
                  null, linha([A('x', 8), seta(8), A('2', 8)])),
         A(' '),
         fracao(linha([nivel(A('x'), A('2', 7), null), A(' - 4')]),
                linha([A('x - 2')]))], 3));

// 4. somatorio
par('Somatorio',
  'Σ de k=1 ate n de k = n·(n+1)/2',
  '\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}',
  linha([operador(sigmaGrande, A('n', 8), A('k=1', 8)), A(' k'), A(' = '),
         fracao(A('n(n+1)'), A('2'))], 3));

// 5. matriz
par('Matriz e determinante',
  'A = [[2, -1], [3, 5]], det A = 13',
  'A = \\begin{bmatrix} 2 & -1 \\\\ 3 & 5 \\end{bmatrix}',
  linha([A('A'), A(' = '),
         matriz([[A('2'), A('-1')], [A('3'), A('5')]]),
         A('   det A = 13')], 2));

// 6. raiz de indice, dentro de fracao
par('Raiz cubica dentro de fracao',
  '(raiz cubica de 8) / 4',
  '\\frac{\\sqrt[3]{8}}{4}',
  linha([fracao(raiz(A('8'), 11, '3'), A('4'))], 2));

doc.y -= 26;
doc.escreverRico('**O que muda.** A fonte resolve simbolo solto e nao resolve estrutura. ' +
  'Fracao, raiz com barra, matriz e operador com limite sao desenho, e o kit de figuras ja ' +
  'tem tudo que eles precisam. A seta do limite e um exemplo direto: a fonte nao tem, sai ' +
  'como interrogacao, e desenhada custa tres segmentos.', { tam: 10 });

fs.writeFileSync('_proto_latex.pdf', doc.finalizar());
console.log('_proto_latex.pdf gerado');
