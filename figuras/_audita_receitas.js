/* figuras/_audita_receitas.js
 * Medicao das figuras do MAT07-12 no FLUXO do PDF, e nao no registro que a
 * receita quis anotar. Serve para provar numero, e nao para achar bonito.
 *
 * Imprime, por figura: id, receita, fase, marcas ativas, arcos medidos (centro e
 * abertura), textos medidos (conteudo e centro), o polígono do contorno e os
 * angulos internos reconstruidos por produto escalar.
 *
 * Uso:  node _audita_receitas.js            todas as figuras, resumo
 *       node _audita_receitas.js q15        so a figura de id q15, detalhada
 *
 * Regra da casa: nunca usar travessao.
 */
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');

const RAIZ = path.join(__dirname, '..');
const banco = JSON.parse(fs.readFileSync(path.join(RAIZ, 'temas', 'banco.json'), 'utf8'));
const tema = banco.temas.find(function (t) { return t.id === 'MAT07-12'; });

const alvo = (process.argv[2] || '').toLowerCase();

function comDoc(lingua, op) {
  const doc = new PDFGen.Doc();
  const dados = tema[lingua];
  doc.novaPagina();
  doc.registrarFiguras(dados.explicacao);
  dados.exercicios.forEach(function (ex) { doc.registrarFiguras(ex.enunciado); });
  if (op.material) doc.markdown(dados.explicacao, { tam: 10 });
  dados.exercicios.forEach(function (ex) {
    const partes = doc.partesDeFigura(op.gabarito ? ex.resposta : ex.enunciado);
    partes.forEach(function (p) {
      if (p.tipo === 'figura') {
        doc.figura(p.diretiva, { x: PDFGen.MARG_E + 20, largura: PDFGen.MARG_D - PDFGen.MARG_E - 20 });
      }
    });
  });
  return doc;
}

const docPT = comDoc('pt', { material: true });
const docGab = comDoc('pt', { gabarito: true });

function n2(v) { return (Math.round(v * 100) / 100).toFixed(2); }
function dist(a, b) { return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)); }

/* Angulo em B do caminho A-B-C, por produto escalar. */
function anguloEm(A, B, C) {
  const u = { x: A.x - B.x, y: A.y - B.y }, v = { x: C.x - B.x, y: C.y - B.y };
  const nu = Math.hypot(u.x, u.y), nv = Math.hypot(v.x, v.y);
  if (nu < 1e-9 || nv < 1e-9) return NaN;
  let c = (u.x * v.x + u.y * v.y) / (nu * nv);
  c = Math.max(-1, Math.min(1, c));
  return Math.acos(c) * 180 / Math.PI;
}

/* Reconstroi o contorno a partir dos segmentos de 1,2 pt do fluxo: a espessura e
 * o unico canal que separa contorno (1,2) de marca (0,9) e de auxiliar (0,6). */
function contornoDoFluxo(med) {
  const grossos = (med.segmentos || []).filter(function (s) {
    return !s.varredura && Math.abs(s.w - 1.2) < 0.05 &&
      dist({ x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 }) > 0.5;
  });
  if (!grossos.length) return [];
  /* Encadeia ponta com ponta, com tolerancia de 0,4 pt. */
  const usados = new Array(grossos.length).fill(false);
  const volta = [{ x: grossos[0].x1, y: grossos[0].y1 }, { x: grossos[0].x2, y: grossos[0].y2 }];
  usados[0] = true;
  let mexeu = true;
  while (mexeu) {
    mexeu = false;
    for (let i = 0; i < grossos.length; i++) {
      if (usados[i]) continue;
      const s = grossos[i];
      const a = { x: s.x1, y: s.y1 }, b = { x: s.x2, y: s.y2 };
      const fim = volta[volta.length - 1];
      if (dist(fim, a) < 0.4) { volta.push(b); usados[i] = true; mexeu = true; }
      else if (dist(fim, b) < 0.4) { volta.push(a); usados[i] = true; mexeu = true; }
    }
  }
  if (volta.length > 2 && dist(volta[0], volta[volta.length - 1]) < 0.4) volta.pop();
  return volta;
}

function relatar(reg) {
  const med = reg.medido || {};
  console.log('\n=== ' + (reg.id || '(sem id)') + '  receita=' + reg.receita +
    '  fase=' + reg.fase + '  marcasAtivas=' + reg.marcasAtivas +
    '  foraDeEscala=' + reg.foraDeEscala);
  console.log('    diretiva: ' + (reg.diretiva || '').slice(0, 160));
  const P = contornoDoFluxo(med);
  if (P.length >= 3) {
    console.log('    contorno (' + P.length + ' vertices):');
    for (let i = 0; i < P.length; i++) {
      const ang = anguloEm(P[(i + P.length - 1) % P.length], P[i], P[(i + 1) % P.length]);
      console.log('      V' + i + ' (' + n2(P[i].x) + ', ' + n2(P[i].y) + ')  interno=' +
        n2(ang) + '  lado seguinte=' + n2(dist(P[i], P[(i + 1) % P.length])));
    }
  }
  (med.arcos || []).forEach(function (a, i) {
    console.log('    arco ' + i + ': centro (' + n2(a.cx) + ', ' + n2(a.cy) + ') abertura=' +
      n2(a.abertura) + ' raio=' + n2(a.raio != null ? a.raio : NaN));
  });
  (med.textos || []).forEach(function (t) {
    const c = { x: t.cx != null ? t.cx : t.x, y: t.cy != null ? t.cy : t.y };
    let melhor = null, perto = Infinity;
    (med.arcos || []).forEach(function (a) {
      let d = Infinity;
      (a.pontos || []).forEach(function (p) { d = Math.min(d, dist(p, c)); });
      if (d < perto) { perto = d; melhor = a; }
    });
    console.log('    texto "' + t.txt + '" tam=' + n2(t.tam) + ' centro (' + n2(c.x) + ', ' +
      n2(c.y) + ')' + (melhor ? '  arco mais proximo a ' + n2(perto) +
        ' pt varrendo ' + n2(melhor.abertura) : '  SEM ARCO'));
  });
  (reg.conferencia || []).forEach(function (f) { console.log('    FALHA: ' + f); });
}

const todas = (docPT.figurasDesenhadas || []).concat(docGab.figurasDesenhadas || []);
todas.forEach(function (reg) {
  if (alvo && String(reg.id || reg.receita || '').toLowerCase().indexOf(alvo) < 0) return;
  relatar(reg);
});

/* ---------------------------------------------------------------- o teste do 15
 *
 * O decisivo: o angulo DESENHADO no vertice do "3x+10" tem que ser MAIOR que o do
 * "2x+20", porque 3 vezes 30 mais 10 da 100 contra 2 vezes 30 mais 20 igual a 80.
 * Medido pelo arco que cada rotulo pertence, que e o mesmo criterio da trava. */
const q15 = todas.filter(function (r) { return r.id === 'q15'; })[0];
if (q15 && q15.medido) {
  const med = q15.medido;
  const achar = function (alvoTxt) {
    let saida = null;
    (med.textos || []).forEach(function (t) {
      if (String(t.txt).replace(/\s/g, '') !== alvoTxt) return;
      const c = { x: t.cx != null ? t.cx : t.x, y: t.cy != null ? t.cy : t.y };
      let perto = Infinity, melhor = null;
      (med.arcos || []).forEach(function (a) {
        let d = Infinity;
        (a.pontos || []).forEach(function (p) { d = Math.min(d, dist(p, c)); });
        if (d < perto) { perto = d; melhor = a; }
      });
      saida = { texto: t.txt, centro: c, arco: melhor, dist: perto };
    });
    return saida;
  };
  const A = achar('3x+10'), Bq = achar('2x+20');
  console.log('\n---------------- teste do exercicio 15 (paralelogramo 3x+10 e 2x+20)');
  if (!A || !Bq || !A.arco || !Bq.arco) {
    console.log('  nao foi possivel medir: ' + (A ? '' : 'falta 3x+10 ') + (Bq ? '' : 'falta 2x+20 ') +
      ((A && !A.arco) ? '3x+10 sem arco ' : '') + ((Bq && !Bq.arco) ? '2x+20 sem arco' : ''));
  } else {
    console.log('  3x+10 vale 100 e esta desenhado com ' + n2(A.arco.abertura) + ' graus');
    console.log('  2x+20 vale  80 e esta desenhado com ' + n2(Bq.arco.abertura) + ' graus');
    console.log('  ordem ' + (A.arco.abertura > Bq.arco.abertura ? 'CERTA' : 'INVERTIDA') +
      ' (o vertice da expressao maior tem que sair maior)');
    console.log('  soma dos dois arcos: ' + n2(A.arco.abertura + Bq.arco.abertura) +
      ' (consecutivos de paralelogramo somam 180)');
  }
}

/* --------------------------------------------------- o trapezio generico
 *
 * O prototipo nao pode sair isosceles: a definicao ao lado dele fala em "pelo
 * menos um par de lados paralelos", e o desenho simetrico ensina que a simetria
 * faz parte da definicao. Mede as duas pernas e os dois angulos da base. */
const FR = require('./receitas.js');
const geoT = FR.PROTOTIPOS.trapezio(null);
const geoI = FR.PROTOTIPOS.trapezioisosceles(null);
function medirQuad(nome, P) {
  const lado = [];
  const ang = [];
  for (let i = 0; i < 4; i++) {
    lado.push(dist(P[i], P[(i + 1) % 4]));
    ang.push(anguloEm(P[(i + 3) % 4], P[i], P[(i + 1) % 4]));
  }
  console.log('  ' + nome + ':');
  console.log('    lados  a=' + n2(lado[0]) + '  b=' + n2(lado[1]) + '  c=' + n2(lado[2]) +
    '  d=' + n2(lado[3]) + '   pernas b e d diferem em ' + n2(Math.abs(lado[1] - lado[3])) +
    ' (' + n2(100 * Math.abs(lado[1] - lado[3]) / Math.max(lado[1], lado[3])) + ' por cento)');
  console.log('    angulos A=' + n2(ang[0]) + '  B=' + n2(ang[1]) + '  C=' + n2(ang[2]) +
    '  D=' + n2(ang[3]) + '   base A e B diferem em ' + n2(Math.abs(ang[0] - ang[1])) + ' graus');
}
console.log('\n---------------- prototipos da familia');
medirQuad('trapezio generico', geoT);
medirQuad('trapezio isosceles', geoI);
