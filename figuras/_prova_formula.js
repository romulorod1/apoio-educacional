/* _prova_formula.js
 * Folha de prova do figuras/formula.js. Gera _prova_formula.pdf.
 *
 * Uma pagina por familia de construcao, e em cada uma o caso simples E o caso
 * composto, que e onde renderizador de formula costuma quebrar: fracao dentro
 * de fracao, raiz dentro de expoente, somatorio com fracao no corpo, matriz com
 * fracao dentro de celula.
 *
 * A ultima pagina e so de CASOS RUINS. Ela existe para provar a promessa que
 * mais importa na folha da aluna: comando que nao existe, chave que nao fecha e
 * argumento faltando saem com aviso visivel, e a folha continua legivel.
 *
 * Regra da casa: nunca usar travessao.
 */
const PDFGen = require('../pdf.js');
const Formula = require('./formula.js');
const fs = require('fs');

const COR = PDFGen.COR;
const MARG_E = PDFGen.MARG_E;
const MARG_D = PDFGen.MARG_D;
const UTIL = PDFGen.UTIL;

const doc = new PDFGen.Doc();
let totalAvisos = 0;

function pagina(titulo, subtitulo) {
  doc.novaPagina();
  doc.cabecalhoDeSecao(titulo, subtitulo);
  doc.y -= 8;
}

function nota(texto) {
  doc.y -= 6;
  doc.escreverRico(texto, { tam: 9, cor: COR.muted });
}

/* Um caso: o rotulo, a fonte em LaTeX, o desenho e os avisos que sairam. */
function caso(rotulo, latex, tamPedido) {
  let tam = tamPedido || 13;
  let m = Formula.medir(latex, tam);
  // encolhe ate caber na coluna, para nenhum caso da prova estourar a margem
  while (m.largura > UTIL - 26 && tam > 6) {
    tam -= 0.5;
    m = Formula.medir(latex, tam);
  }
  const linhasFonte = doc.quebrar(latex, UTIL - 30, 7.5, false);
  const linhasAviso = [];
  m.avisos.forEach(function (a) {
    doc.quebrar('aviso: ' + a, UTIL - 34, 7.5, false).forEach(function (l) { linhasAviso.push(l); });
  });
  totalAvisos += m.avisos.length;

  const preciso = 15 + linhasFonte.length * 10 + m.altura + m.profundidade + 10 +
    linhasAviso.length * 10;
  doc.garanteEspaco(preciso);

  doc.y -= 15;
  doc.texto(rotulo, MARG_E, doc.y, { tam: 8.5, bold: true, cor: COR.teal, tracking: 0.6 });
  linhasFonte.forEach(function (l) {
    doc.y -= 10;
    doc.texto(l, MARG_E + 12, doc.y, { tam: 7.5, cor: COR.muted });
  });
  doc.y -= m.altura + 9;
  const r = Formula.desenhar(doc, latex, MARG_E + 26, doc.y, tam);
  doc.y -= m.profundidade;
  linhasAviso.forEach(function (l) {
    doc.y -= 10;
    doc.texto(l, MARG_E + 26, doc.y, { tam: 7.5, cor: COR.gold });
  });
  return r;
}

/* ------------------------------------------------------------------ 1. fracao */
pagina('Fracao', 'o caso simples e o empilhamento aninhado');
nota('A barra fica na altura do eixo, que e por onde passa o sinal de igual: e o que faz a ' +
  'fracao parecer centrada ao lado do "=". Da segunda fracao aninhada em diante o corpo ' +
  'encolhe, senao a hierarquia some.');

caso('Fracao simples', '\\frac{1}{2} + \\frac{3}{4} = \\frac{5}{4}');
caso('Fracao com expressao nos dois andares', '\\frac{x + 1}{x - 1}');
caso('Fracao dentro de fracao', '\\frac{\\frac{1}{2}}{3} = \\frac{1}{6}');
caso('Fracao dentro de fracao, nos dois andares',
  '\\frac{\\frac{a}{b} + 1}{\\frac{c}{d} - 1}');
caso('A formula do 2o grau, que motivou o trabalho',
  'x = \\frac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}');
caso('Fracao dentro de parenteses que crescem',
  '\\left( \\frac{x+1}{2} \\right)^{2} = \\frac{(x+1)^{2}}{4}');

/* -------------------------------------------------------- 2. raiz e potencia */
pagina('Raiz, expoente e indice', 'a barra da raiz cobre o que estiver dentro');
nota('O glifo de raiz da fonte tem barra de largura fixa e nao cobre nem "b^2 - 4ac" nem ' +
  'uma fracao. Aqui o gancho e desenhado e a barra se estende pela largura do radicando, ' +
  'qualquer que seja.');

caso('Raiz simples', '\\sqrt{2} \\approx 1{,}41');
caso('Raiz de expressao', '\\sqrt{b^{2} - 4ac}');
caso('Raiz de indice', '\\sqrt[3]{8} = 2 \\quad \\sqrt[4]{16} = 2');
caso('Raiz dentro de expoente', '2^{\\sqrt{2}} \\cdot 2^{\\sqrt{2}} = 2^{2\\sqrt{2}}');
caso('Raiz de fracao, e fracao de raiz',
  '\\sqrt{\\frac{a}{b}} = \\frac{\\sqrt{a}}{\\sqrt{b}}');
caso('Raiz dentro de raiz', '\\sqrt{2 + \\sqrt{3}}');
caso('Expoente e indice no mesmo termo', 'a_{1}^{2} + a_{2}^{2} = a_{3}^{2}');
caso('Expoente de expoente', '2^{3^{2}} = 2^{9} = 512');
caso('Progressao com indice', 'a_{n} = a_{1} + (n - 1) \\cdot r');

/* -------------------------------------------------- 3. operador com limite */
pagina('Operador com limite', 'somatorio, produtorio, integral e limite');
nota('O Sigma da fonte e uma LETRA: em corpo de operador fica pequeno e com proporcao de ' +
  'texto. O produtorio e a integral a fonte nao tem de jeito nenhum. Os tres sao desenhados, ' +
  'e nascem centrados no eixo para o "=" depois deles alinhar.');

caso('Somatorio', '\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}');
caso('Somatorio com fracao no corpo', '\\sum_{k=1}^{n} \\frac{1}{k(k+1)}');
caso('Produtorio', '\\prod_{i=1}^{n} i = n!');
caso('Integral', '\\int_{0}^{1} x^{2} \\, dx = \\frac{1}{3}');
caso('Limite com fracao', '\\lim_{x \\to 2} \\frac{x^{2} - 4}{x - 2} = 4');
caso('Limite no infinito', '\\lim_{n \\to \\infty} \\frac{1}{n} = 0');
caso('Funcao com indice', '\\log_{2} 8 = 3 \\quad \\sen 30^{\\circ} = \\frac{1}{2}');

/* -------------------------------------------------------------- 4. matrizes */
pagina('Matriz e delimitador que cresce', 'bmatrix, pmatrix e vmatrix');
nota('A altura de cada linha da matriz e medida de verdade, e nao um salto fixo: com salto ' +
  'fixo uma celula com fracao invade a linha de cima. O delimitador e desenhado e nao escrito ' +
  'com o glifo da fonte, porque o glifo tem altura fixa.');

caso('Matriz entre colchetes', 'A = \\begin{bmatrix} 2 & -1 \\\\ 3 & 5 \\end{bmatrix}');
caso('Determinante, entre barras', '\\begin{vmatrix} 2 & -1 \\\\ 3 & 5 \\end{vmatrix} = 13');
caso('Matriz entre parenteses, 3 por 3',
  '\\begin{pmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 1 \\end{pmatrix}');
caso('Matriz com fracao dentro de celula',
  '\\begin{bmatrix} \\frac{1}{2} & \\frac{3}{4} \\\\ \\sqrt{2} & -\\frac{5}{6} \\end{bmatrix}');
caso('Delimitadores que crescem, um dentro do outro',
  '\\left[ \\left( \\frac{a}{b} \\right)^{2} + 1 \\right]');
caso('Chave que cresce', '\\left\\{ x \\in \\mathrm{R} \\; | \\; x \\geq \\frac{1}{2} \\right\\}');

/* ---------------------------------------------------- 5. simbolos e espacos */
pagina('Simbolo e espacamento', 'o que a fonte tem, o que foi desenhado');
nota('Conferido rodando node contra o pdf.js, e nao suposto. A Helvetica desenha os quatro ' +
  'primeiros e a fonte /Symbol acrescenta os da segunda linha. O resto sai como interrogacao ' +
  'na fonte e por isso foi desenhado a traco.');

caso('Fonte Helvetica: mais, menos, vezes, dividido',
  'a \\pm b \\quad a \\times b \\quad a \\cdot b \\quad a \\div b');
caso('Fonte /Symbol: as relacoes e o infinito',
  'a \\leq b \\quad a \\geq b \\quad a \\neq b \\quad n \\to \\infty');
caso('Fonte /Symbol: as gregas que existem',
  '\\pi \\quad \\alpha \\quad \\beta \\quad \\theta \\quad \\Delta \\quad \\Sigma');
caso('Desenhados: as gregas que faltam na fonte',
  '\\lambda \\quad \\phi \\quad \\omega \\quad \\mu');
caso('Desenhados: relacao e conjunto',
  'x \\approx 3 \\quad x \\to 2 \\quad p \\Rightarrow q \\quad x \\in A \\quad A \\subset B');
caso('Desenhados: uniao, interseccao e geometria',
  'A \\cup B \\quad A \\cap B \\quad \\angle ABC \\quad r \\perp s \\quad r \\parallel s');
caso('Palavra dentro da formula',
  '\\text{area} = \\frac{\\text{base} \\times \\text{altura}}{2}');
caso('Espacamento automatico por classe de simbolo',
  'a+b \\quad a=b \\quad -b \\quad 2a+3b=0');
nota('Nas quatro acima ninguem digitou espaco: "a+b" tem folga de operador binario, "a=b" ' +
  'tem folga maior de relacao, e o menos de "-b" e sinal e nao leva folga nenhuma. O ' +
  'prototipo nao fazia isso e a folha ficava apertada em alguns pontos.');
caso('Espacamento pedido a mao', 'a \\, b \\; c \\quad d \\qquad e');

/* ------------------------------------------------------------ 6. casos ruins */
pagina('Casos ruins', 'nenhum sai calado, e a folha continua legivel');
nota('O selo em fundo claro com borda dourada marca o ponto exato do defeito, e a linha ' +
  'dourada embaixo repete o aviso que foi para o registro. Nenhum destes casos imprime o ' +
  'comando cru como se fosse texto, e nenhum some em silencio.');

caso('Chave que nunca fecha', '\\frac{1}{2 + \\sqrt{3}');
caso('Comando que nao existe', 'A = \\raizz{9} + \\frac{1}{2}');
/* "\frac{1} + 2" NAO entra aqui: o TeX le o "+" como denominador, e o nosso
 * analisador tambem, entao aquilo e uma fracao valida e nao um caso ruim. O caso
 * ruim de verdade e a fracao que acaba sem o segundo argumento. */
caso('Fracao com um argumento so', '2 + \\frac{3}');
caso('Matriz com linhas de tamanhos diferentes',
  '\\begin{bmatrix} 1 & 2 & 3 \\\\ 4 & 5 \\end{bmatrix}');
caso('Matriz sem o \\end', '\\begin{bmatrix} 1 & 2 \\\\ 3 & 4');
caso('Ambiente fora do subconjunto', '\\begin{align} x = 1 \\end{align}');
caso('Delimitador aberto e nunca fechado', '\\left( \\frac{a}{b}');
caso('Expoente sem nada para elevar', '^{2} + x');
/* "x^ + 1" tambem NAO entra: o TeX eleva o proprio "+" e o nosso analisador
 * faz igual, entao aquilo nao e argumento faltando. Faltando de verdade e o
 * circunflexo que termina a formula. */
caso('Expoente sem expoente', 'x^{2} + y^');
caso('Dois expoentes no mesmo termo', '2^3^4');
caso('Chave fechada sem abrir', 'x + 1}');
caso('Caractere que o PDF nao desenha, digitado direto', 'a \\approx 3, b ≈ 4');
caso('Comando dentro de \\text que nao e texto', '\\text{raiz de \\sqrt{2}}');

doc.y -= 20;
doc.garanteEspaco(60);
doc.escreverRico('**Contagem.** A folha inteira gerou ' + totalAvisos + ' aviso(s), e todos ' +
  'estao nesta pagina e na de simbolos. Nenhuma pagina das cinco primeiras avisou nada, que e ' +
  'o resultado esperado: material bem escrito nao acende luz nenhuma.', { tam: 9 });

fs.writeFileSync('_prova_formula.pdf', doc.finalizar());
console.log('_prova_formula.pdf gerado, ' + totalAvisos + ' aviso(s) no total');
