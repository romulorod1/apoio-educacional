/* figuras/_marcas_folha.js
 * Folha de prova dos consertos do figuras/marcas.js, com os casos DIFICEIS lado
 * a lado: a esquerda, o comportamento ANTIGO, reproduzido a mao ou reativado por
 * opcao; a direita, o que o arquivo faz agora. E a folha que o auditor
 * (_marcas_auditor.js) tem que acusar do lado esquerdo e deixar quieta do lado
 * direito.
 *
 * As coordenadas dos casos 3 e 4 sao as MEDIDAS no piloto MAT07-12: o triangulo
 * 30/60/90 do gabarito do exercicio 11 e o triangulo do angulo externo da
 * pagina 3, com os vertices exatamente onde eles saem na folha impressa. Assim o
 * que a prova mostra e o defeito de verdade e nao um caso inventado que calha de
 * falhar.
 *
 * Regra da casa: nunca usar travessao.
 */
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');
const FigBase = require('./base.js');
const M = require('./marcas.js');

const COR = PDFGen.COR;
const doc = new PDFGen.Doc();

function f2(v) { return (Math.round(v * 100) / 100).toFixed(2); }
function pt(x, y) { return { x: x, y: y }; }
function versor(dx, dy) { const n = Math.hypot(dx, dy) || 1; return pt(dx / n, dy / n); }
function perp(u) { return pt(-u.y, u.x); }
function somar(P, u, k) { return pt(P.x + u.x * k, P.y + u.y * k); }

function contorno(pts, fechado) {
  FigBase.comEstado(doc, { cor: COR.texto, espessura: 1.2 }, function () {
    let s = '1 J 1 j ';
    for (let i = 0; i < pts.length; i++) s += f2(pts[i].x) + ' ' + f2(pts[i].y) + (i === 0 ? ' m ' : ' l ');
    doc.op(s + (fechado === false ? '' : 'h ') + 'S');
  });
}

function titulo(txt, y) {
  doc.texto(txt, 40, y, { tam: 12, bold: true, cor: COR.titulo || COR.texto });
}
function nota(txt, x, y) {
  doc.texto(txt, x, y, { tam: 8, cor: COR.muted });
}

/* ============================================================ pagina 1 */
doc.novaPagina();
titulo('1. seta de paralelismo: 3,5 pt (antes) contra 7,5 pt (agora)', 800);
nota('ANTES: folga 3,5 pt, as duas cabecas se sobrepoem em 1,4 pt', 40, 786);
nota('AGORA: folga sai do tamanho da seta, 4,91 de profundidade mais 2,6 de papel', 310, 786);

{
  const A = pt(60, 700), B = pt(250, 700);
  contorno([A, B], false);
  M.marcaLado(doc, A, B, { n: 2, tipo: 'seta', folga: 3.5, tamanho: 6 });

  const C = pt(330, 700), D = pt(520, 700);
  contorno([C, D], false);
  M.marcaLado(doc, C, D, { n: 2, tipo: 'seta' });
}

titulo('2. tracinho de congruencia: passo 2,5 pt (antes) contra 4,0 pt (agora)', 650);
nota('ANTES: tres tracos de 6 pt com vao de 1,6 pt', 40, 636);
nota('AGORA: tres tracos de 7,5 pt com vao de 3,1 pt', 310, 636);
{
  const A = pt(60, 560), B = pt(250, 560);
  contorno([A, B], false);
  M.marcaLado(doc, A, B, { n: 3, tamanho: 6, folga: 2.5 });

  const C = pt(330, 560), D = pt(520, 560);
  contorno([C, D], false);
  M.marcaLado(doc, C, D, { n: 3 });
}

titulo('3. dois arcos no mesmo vertice', 500);
nota('ANTES: raio pedido igual nos dois, eles emendam', 40, 486);
nota('AGORA: o registro do vertice afasta o segundo em 6 pt', 310, 486);
{
  /* Vertice com dois angulos vizinhos que dividem a semirreta do meio. */
  function parDeArcos(V, desloc, raioPedido) {
    const A = somar(V, versor(1, 0), 90);
    const meio = somar(V, versor(Math.cos(0.9), Math.sin(0.9)), 90);
    const B = somar(V, versor(Math.cos(1.9), Math.sin(1.9)), 90);
    contorno([A, V, B], false);
    contorno([V, meio], false);
    M.marcaAngulo(doc, V, A, meio, { rotulo: null, raio: raioPedido });
    M.marcaAngulo(doc, V, meio, B, { rotulo: null, raio: raioPedido });
    desloc;
  }
  parDeArcos(pt(70, 330), 0, 20);
  parDeArcos(pt(340, 330), 0, null);
}

/* ============================================================ pagina 2 */
doc.novaPagina();
titulo('4. rotulo de 30 graus: as coordenadas do gabarito do exercicio 11', 800);
nota('ANTES: a conta aproximada reprovou por 0,07 pt e mandou o valor', 40, 786);
nota('para fora, com fio que atravessa a hipotenusa', 40, 776);
nota('AGORA: o arco cresce o tanto que falta e o valor fica na cunha', 300, 786);

{
  /* Os tres vertices medidos no _piloto_MAT07-12_material.pdf, pagina 8. */
  const A = pt(112.17, 480.89), B = pt(343.11, 480.89), C = pt(285.37, 580.89);
  contorno([A, B, C]);
  /* ANTES, reproduzido a mao: raio 20, d igual a externo mais 6 mais a meia
   * caixa na bissetriz, e a chamada do jeito antigo (bissetriz mais
   * perpendicular a ela), que e o que produzia o fio cruzando o contorno. */
  const g = PDFGen;
  const bis = versor(Math.cos(15 * Math.PI / 180), Math.sin(15 * Math.PI / 180));
  const largura = g.medir('30°', 8.5, false) + 2.8, altura = 8.5 * 1.08;
  const nor = perp(bis);
  const cx = A.x + bis.x * 28 + nor.x * (13 + altura / 2);
  const cy = A.y + bis.y * 28 + nor.y * (13 + altura / 2);
  FigBase.comEstado(doc, { cor: COR.texto, espessura: 0.9 }, function () {
    doc.op('1 J ' + arcoOps(A, 20, 0, 30) + 'S');
  });
  FigBase.comEstado(doc, { cor: COR.muted, espessura: 0.6 }, function () {
    const de = somar(A, bis, 21);
    const ate = pt(cx - nor.x * (altura / 2 + 1.5), cy - nor.y * (altura / 2 + 1.5));
    doc.op('1 J 1 j ' + f2(de.x) + ' ' + f2(de.y) + ' m ' + f2(ate.x) + ' ' + f2(ate.y) + ' l S');
  });
  doc.retangulo(cx - largura / 2 - 1.4, cy - 8.5 * 0.35 - 8.5 * 0.26, largura + 2.8, altura, COR.branco);
  doc.texto('30°', cx, cy - 8.5 * 0.35, { tam: 8.5, cor: COR.texto, align: 'centro' });
}
{
  const A = pt(320.17, 480.89), B = pt(551.11, 480.89), C = pt(493.37, 580.89);
  contorno([A, B, C]);
  M.marcaAngulo(doc, A, B, C, { rotulo: '30°' });
}

titulo('5. angulo externo de 115 graus: as coordenadas da pagina 3', 440);
nota('ANTES: o teto de 0,8 media contra o prolongamento de 26 pt', 40, 426);
nota('AGORA: o valor fica na bissetriz do externo, sem fio', 310, 426);
{
  function figuraExterna(dx, dy, antigo) {
    const A = pt(246.24 + dx, 574.89 + dy - 400);
    const B = pt(349.04 + dx, 574.89 + dy - 400);
    const C = pt(330.17 + dx, 645.31 + dy - 400);
    const ponta = somar(C, versor(C.x - B.x, C.y - B.y), 26.03);
    contorno([A, B, C]);
    contorno([C, ponta], false);
    if (antigo) {
      /* ANTES: deslocamento a partir do vertice, na perpendicular da bissetriz. */
      const bis = versor(Math.cos(162.5 * Math.PI / 180), Math.sin(162.5 * Math.PI / 180));
      const nor = perp(bis);
      const largura = PDFGen.medir('115°', 8.5, false) + 2.8, altura = 8.5 * 1.08;
      FigBase.comEstado(doc, { cor: COR.texto, espessura: 0.9 }, function () {
        doc.op('1 J ' + arcoOps(C, 12, 105, 220) + 'S');
      });
      const cx = C.x + bis.x * 20 + nor.x * (13 + altura / 2);
      const cy = C.y + bis.y * 20 + nor.y * (13 + altura / 2);
      FigBase.comEstado(doc, { cor: COR.muted, espessura: 0.6 }, function () {
        const de = somar(C, bis, 13);
        const ate = pt(cx - nor.x * (altura / 2 + 1.5), cy - nor.y * (altura / 2 + 1.5));
        doc.op('1 J 1 j ' + f2(de.x) + ' ' + f2(de.y) + ' m ' + f2(ate.x) + ' ' + f2(ate.y) + ' l S');
      });
      doc.retangulo(cx - largura / 2 - 1.4, cy - 8.5 * 0.35 - 8.5 * 0.26, largura + 2.8, altura, COR.branco);
      doc.texto('115°', cx, cy - 8.5 * 0.35, { tam: 8.5, cor: COR.texto, align: 'centro' });
    } else {
      M.marcaAngulo(doc, C, ponta, A, { rotulo: '115°' });
      M.marcaAngulo(doc, C, A, B, { rotulo: '65°' });
    }
  }
  figuraExterna(-160, 0, true);
  figuraExterna(100, 0, false);
}

/* ============================================================ pagina 3 */
doc.novaPagina();
titulo('6. angulo de 8 graus: a chamada tem que sair por fora do poligono', 800);
nota('ANTES: valor empurrado pela perpendicular da bissetriz, fio cruzando o lado', 40, 786);
nota('AGORA: fio curto na normal do lado, comecando na ponta do arco', 40, 776);
{
  function cunha(V, antigo) {
    const A = somar(V, versor(1, 0), 150);
    const B = somar(V, versor(Math.cos(8 * Math.PI / 180), Math.sin(8 * Math.PI / 180)), 150);
    contorno([A, V, B], false);
    contorno([A, B], false);
    if (antigo) {
      const bis = versor(Math.cos(4 * Math.PI / 180), Math.sin(4 * Math.PI / 180));
      const nor = perp(bis);
      const largura = PDFGen.medir('8°', 8.5, false) + 2.8, altura = 8.5 * 1.08;
      FigBase.comEstado(doc, { cor: COR.texto, espessura: 0.9 }, function () {
        doc.op('1 J ' + arcoOps(V, 20, 0, 8) + 'S');
      });
      const cx = V.x + bis.x * 28 + nor.x * (13 + altura / 2);
      const cy = V.y + bis.y * 28 + nor.y * (13 + altura / 2);
      FigBase.comEstado(doc, { cor: COR.muted, espessura: 0.6 }, function () {
        const de = somar(V, bis, 21);
        const ate = pt(cx - nor.x * (altura / 2 + 1.5), cy - nor.y * (altura / 2 + 1.5));
        doc.op('1 J 1 j ' + f2(de.x) + ' ' + f2(de.y) + ' m ' + f2(ate.x) + ' ' + f2(ate.y) + ' l S');
      });
      doc.retangulo(cx - largura / 2 - 1.4, cy - 8.5 * 0.35 - 8.5 * 0.26, largura + 2.8, altura, COR.branco);
      doc.texto('8°', cx, cy - 8.5 * 0.35, { tam: 8.5, cor: COR.texto, align: 'centro' });
    } else {
      M.marcaAngulo(doc, V, A, B, { rotulo: '8°' });
    }
  }
  cunha(pt(60, 680), true);
  cunha(pt(60, 560), false);
}

titulo('7. diagonal do quadrilatero: 0,6 teal (antes) contra 0,9 na tinta do contorno', 480);
{
  const Q = [pt(60, 300), pt(215, 310), pt(186, 400), pt(78, 379)];
  contorno(Q);
  M.diagonais(doc, Q, { quais: 'A-C', cor: COR.teal, espessura: 0.6 });
  const R = [pt(330, 300), pt(485, 310), pt(456, 400), pt(348, 379)];
  contorno(R);
  M.diagonais(doc, R, { quais: 'A-C' });
  nota('ANTES: 0,60 w em teal', 60, 285);
  nota('AGORA: 0,90 w na tinta do contorno', 330, 285);
}

/* Arco em graus, escrito aqui para a folha poder desenhar o caso ANTIGO sem
 * chamar nada do marcas.js. */
function arcoOps(C, r, g0, g1) {
  const a0 = g0 * Math.PI / 180, a1 = g1 * Math.PI / 180;
  const total = a1 - a0;
  const n = Math.max(1, Math.ceil(Math.abs(total) / (Math.PI / 2)));
  const d = total / n, k = 4 / 3 * Math.tan(d / 4);
  let s = f2(C.x + r * Math.cos(a0)) + ' ' + f2(C.y + r * Math.sin(a0)) + ' m ';
  for (let i = 0; i < n; i++) {
    const t0 = a0 + i * d, t1 = t0 + d;
    const x0 = C.x + r * Math.cos(t0), y0 = C.y + r * Math.sin(t0);
    const x1 = C.x + r * Math.cos(t1), y1 = C.y + r * Math.sin(t1);
    s += f2(x0 - k * r * Math.sin(t0)) + ' ' + f2(y0 + k * r * Math.cos(t0)) + ' ' +
      f2(x1 + k * r * Math.sin(t1)) + ' ' + f2(y1 - k * r * Math.cos(t1)) + ' ' +
      f2(x1) + ' ' + f2(y1) + ' c ';
  }
  return s;
}

const bytes = doc.finalizar();
const saida = path.join(__dirname, '_marcas_folha.pdf');
fs.writeFileSync(saida, bytes);
console.log('PDF: ' + saida + '  (' + Math.round(bytes.length / 1024) + ' KB)');
if ((doc.avisosFigura || []).length) {
  console.log('avisos:');
  (doc.avisosFigura || []).forEach(function (a) { console.log('  . ' + a); });
}
