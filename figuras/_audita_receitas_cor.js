/* figuras/_audita_receitas_cor.js
 *
 * Mede tres coisas no FLUXO DE CONTEUDO do PDF, e nao no registro que a receita
 * quis anotar:
 *
 *   1. cor e posicao de cada valor impresso nas figuras de gabarito do MAT07-12
 *      (q10, t11, t14 e q18), para o codigo de cor poder ser lido de fora: teal
 *      (0, 0.42, 0.45 mais ou menos) contra preto.
 *   2. os angulos internos do quadrilatero do exercicio 15, reconstruidos por
 *      produto escalar sobre os quatro vertices do CONTORNO impresso, para saber
 *      se a legenda "figura fora de escala" diz a verdade.
 *   3. os rotulos de regiao do quadrilatero cortado pela diagonal.
 *
 * Le o tema do banco.json, o mesmo caminho do piloto: assim a medida vale sobre
 * o que a folha vai imprimir e nao sobre uma diretiva reescrita aqui.
 *
 * Regra da casa: nunca usar travessao.
 */
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');
const FigBase = require('./base.js');

const RAIZ = path.join(__dirname, '..');
const banco = JSON.parse(fs.readFileSync(path.join(RAIZ, 'temas', 'banco.json'), 'utf8'));
const tema = banco.temas.find(function (t) { return t.id === 'MAT07-12'; });

function n2(v) { return (Math.round(v * 1000) / 1000).toFixed(3); }
function n1(v) { return (Math.round(v * 100) / 100).toFixed(2); }

/* A paleta do pdf.js, para dizer o NOME da cor medida em vez de tres decimais. */
const COR = PDFGen.COR;
function nomeDaCor(c) {
  if (!c) return '?';
  let melhor = null;
  Object.keys(COR).forEach(function (k) {
    const alvo = PDFGen.cor3 ? PDFGen.cor3(COR[k]) : null;
    if (!alvo) return;
    const d = Math.abs(alvo[0] - c[0]) + Math.abs(alvo[1] - c[1]) + Math.abs(alvo[2] - c[2]);
    if (!melhor || d < melhor.d) melhor = { d: d, k: k };
  });
  if (melhor && melhor.d < 0.02) return melhor.k;
  return '(' + c.map(n2).join(', ') + ')';
}

/* ================================================================ o documento */

function docDe(lingua, fase) {
  const doc = new PDFGen.Doc();
  const dados = tema[lingua];
  doc.novaPagina();
  doc.registrarFiguras(dados.explicacao);
  dados.exercicios.forEach(function (ex) { doc.registrarFiguras(ex.enunciado); });
  const regs = [];
  const textos = [];
  doc.partesDeFigura(dados.explicacao).forEach(function (p) {
    if (p.tipo === 'figura') regs.push(doc.figura(p.diretiva, {}));
  });
  dados.exercicios.forEach(function (ex, i) {
    const fonte = fase === 'gabarito' ? ex.resposta : ex.enunciado;
    doc.partesDeFigura(fonte).forEach(function (p) {
      if (p.tipo === 'figura') {
        const r = doc.figura(p.diretiva, { x: PDFGen.MARG_E + 20, largura: PDFGen.MARG_D - PDFGen.MARG_E - 20 });
        if (r) { r.exercicio = i + 1; regs.push(r); }
      }
    });
  });
  return { doc: doc, regs: regs, textos: textos };
}

/* ================================================================ 1. cor do gabarito */

console.log('===== 1. cor e posicao de cada valor do gabarito =====');
const gab = docDe('pt', 'gabarito');
gab.regs.forEach(function (r) {
  if (!r || !r.medido) return;
  console.log('\nexercicio ' + r.exercicio + '  id=' + r.id + '  receita=' + r.receita +
    '  fase=' + r.fase + '  foraDeEscala=' + r.foraDeEscala + '  marcasAtivas=' + r.marcasAtivas);
  (r.medido.textos || []).forEach(function (t) {
    console.log('   "' + t.txt + '"  cor=' + nomeDaCor(t.cor) +
      '  centro (' + n1(t.cx) + ', ' + n1(t.cy) + ')  tam=' + n1(t.tam) + (t.bold ? ' bold' : ''));
  });
  /* o quadradinho do angulo reto nao tem texto: sai como dois segmentos finos */
  const quad = (r.medido.segmentos || []).filter(function (s) {
    return Math.abs(s.w - 0.9) < 0.2 && nomeDaCor(s.cor) !== 'texto';
  });
  quad.forEach(function (s) {
    console.log('   segmento w=' + n1(s.w) + ' cor=' + nomeDaCor(s.cor) +
      ' de (' + n1(s.x1) + ', ' + n1(s.y1) + ') a (' + n1(s.x2) + ', ' + n1(s.y2) + ')');
  });
  (r.avisos || []).forEach(function (a) { console.log('   AVISO: ' + a); });
  (r.conferencia || []).forEach(function (a) { console.log('   FALHA: ' + a); });
});

/* ================================================================ 2. angulos do 15 */

console.log('\n===== 2. angulos do exercicio 15, por produto escalar no contorno =====');

/* O contorno e o unico traco de 1,2 pt na cor do texto: os quatro segmentos dele
 * sao remontados em ciclo e o angulo de cada vertice sai do produto escalar dos
 * dois lados que ali se encontram. Medir assim, e nao pelos pontos que a receita
 * calculou, e o que responde a pergunta que a legenda faz: o transferidor
 * apoiado na folha impressa acha o valor do enunciado? */
function anguloDeContorno(reg) {
  const segs = (reg.medido.segmentos || []).filter(function (s) {
    return Math.abs(s.w - 1.2) < 0.05 && s.tracejado === '[] 0';
  });
  if (segs.length < 3) return null;
  /* remonta o ciclo pelos extremos coincidentes */
  const pontos = [];
  function mesmo(a, b) { return Math.hypot(a.x - b.x, a.y - b.y) < 0.05; }
  let atual = { x: segs[0].x1, y: segs[0].y1 };
  const usados = segs.map(function () { return false; });
  pontos.push(atual);
  for (let passo = 0; passo < segs.length; passo++) {
    let achou = false;
    for (let i = 0; i < segs.length; i++) {
      if (usados[i]) continue;
      const a = { x: segs[i].x1, y: segs[i].y1 }, b = { x: segs[i].x2, y: segs[i].y2 };
      if (mesmo(a, atual)) { usados[i] = true; atual = b; pontos.push(b); achou = true; break; }
      if (mesmo(b, atual)) { usados[i] = true; atual = a; pontos.push(a); achou = true; break; }
    }
    if (!achou) break;
  }
  if (pontos.length > 1 && mesmo(pontos[pontos.length - 1], pontos[0])) pontos.pop();
  if (pontos.length < 3) return null;
  const n = pontos.length, angs = [];
  for (let i = 0; i < n; i++) {
    const V = pontos[i], A = pontos[(i + 1) % n], B = pontos[(i + n - 1) % n];
    const u = { x: A.x - V.x, y: A.y - V.y }, w = { x: B.x - V.x, y: B.y - V.y };
    const cos = (u.x * w.x + u.y * w.y) / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y));
    angs.push(Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI);
  }
  return { pontos: pontos, angs: angs };
}

const enun = docDe('pt', 'enunciado');
enun.regs.forEach(function (r) {
  if (!r || !r.medido || r.id !== 'q15') return;
  const m = anguloDeContorno(r);
  console.log('\nid=q15  foraDeEscala=' + r.foraDeEscala + '  legenda="' + (r.legenda || '') + '"');
  if (!m) { console.log('   contorno nao remontado'); return; }
  m.pontos.forEach(function (p, i) {
    console.log('   vertice ' + i + ' (' + n1(p.x) + ', ' + n1(p.y) + ')  angulo medido = ' + n2(m.angs[i]));
  });
  console.log('   soma = ' + n2(m.angs.reduce(function (a, b) { return a + b; }, 0)));
  (r.medido.textos || []).forEach(function (t) {
    console.log('   texto "' + t.txt + '" cor=' + nomeDaCor(t.cor) + ' centro (' + n1(t.cx) + ', ' + n1(t.cy) + ')');
  });
  (r.avisos || []).forEach(function (a) { console.log('   AVISO: ' + a); });
  (r.conferencia || []).forEach(function (a) { console.log('   FALHA: ' + a); });
});

/* ================================================================ 3. rotulo de regiao */

console.log('\n===== 3. rotulos de regiao do quadrilatero da diagonal =====');
['pt', 'en'].forEach(function (lg) {
  const d = docDe(lg, 'enunciado');
  d.regs.forEach(function (r) {
    if (!r || !r.medido || r.receita !== 'quadrilatero' || r.exercicio) return;
    console.log('\n[' + lg + '] diretiva: ' + (r.diretiva || '(sem)'));
    (r.medido.textos || []).forEach(function (t) {
      console.log('   texto "' + t.txt + '" cor=' + nomeDaCor(t.cor) +
        ' tam=' + n1(t.tam) + ' centro (' + n1(t.cx) + ', ' + n1(t.cy) + ')');
    });
    console.log('   arcos: ' + (r.medido.arcos || []).length +
      '  marcasAtivas: ' + r.marcasAtivas);
    (r.avisos || []).forEach(function (a) { console.log('   AVISO: ' + a); });
    (r.conferencia || []).forEach(function (a) { console.log('   FALHA: ' + a); });
  });
});

console.log('\navisosFigura pt(enunciado): ' + (enun.doc.avisosFigura || []).length);
(enun.doc.avisosFigura || []).forEach(function (a) { console.log('  . ' + a); });
console.log('avisosFigura pt(gabarito): ' + (gab.doc.avisosFigura || []).length);
(gab.doc.avisosFigura || []).forEach(function (a) { console.log('  . ' + a); });
