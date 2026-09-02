/* figuras/_prova_desenho_tinta.js
 * A prova da hierarquia de tinta do figuras/desenho.js, com o conserto ligado e
 * com o conserto desligado, na mesma rodada.
 *
 * Sai em dois PDFs com as MESMAS chamadas, na mesma ordem:
 *
 *   _prova_desenho_tinta_sem.pdf   toda chamada leva tintaLivre, que e a valvula
 *                                  documentada do desenho.js, e desenha a folha
 *                                  como ela era antes: ceviana em 0,60 pt, teal,
 *                                  [3 2], e guia em [1 2] muted.
 *   _prova_desenho_tinta_com.pdf   as mesmas chamadas sem a valvula.
 *
 * Quem julga os dois nao e este arquivo e nao e o desenho.js: e o
 * _prova_desenho_auditor.js, que abre o PDF escrito e le espessura, cor e
 * tracejado de cada traco direto do fluxo de conteudo. A prova passa quando o
 * auditor ACUSA a folha "sem" e fica QUIETO na folha "com".
 *
 * A pagina 1 e a que a professora olha: o exercicio 17 do piloto (triangulo ABC
 * com as bissetrizes de B e de C e o ponto I) desenhado quatro vezes, com a
 * tinta de antes, com a de agora, na fase de gabarito e no plano com guias.
 *
 * Regra da casa: nunca usar travessao.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');
const B = require('./base.js');
const D = require('./desenho.js');
const auditor = require('./_prova_desenho_auditor.js');

const COR = PDFGen.COR;
const MARG_E = PDFGen.MARG_E, MARG_D = PDFGen.MARG_D;
const LARG = (MARG_D - MARG_E - 16) / 2;

/* ------------------------------------------------------------ a figura do 17 */

/* Os mesmos numeros do exercicio 17: triangulo de angulos 76, 54 e 50 com as
 * bissetrizes de B e de C. A geometria nao interessa a esta prova, a tinta sim,
 * entao ela e fixa e escrita aqui. */
const TRI = [{ x: 0.5, y: 0 }, { x: 9.5, y: 0 }, { x: 3.4, y: 7.2 }];

function bissetrizPe(V, A, Bp) {
  const d = (P, Q) => Math.hypot(Q.x - P.x, Q.y - P.y);
  const c = d(V, A), b = d(V, Bp);
  const t = c / (c + b);
  return { x: A.x + (Bp.x - A.x) * t, y: A.y + (Bp.y - A.y) * t };
}

/* A MESMA chamada que o receitas.js faz em desenharCevianas. Nada aqui repete a
 * decisao do desenho.js: quem decide continua sendo ele. */
function cevianasComoNoTema(ctx, P, livre) {
  const peB = bissetrizPe(TRI[1], TRI[2], TRI[0]);
  const peC = bissetrizPe(TRI[2], TRI[0], TRI[1]);
  [[P[1], ctx.p(peB)], [P[2], ctx.p(peC)]].forEach(function (seg) {
    D.poligono(ctx, seg, {
      fechado: false, cor: COR.teal, espessura: 0.6, tracejado: 'auxiliar',
      papel: 'ceviana bissetriz', tintaLivre: livre
    });
  });
}

/* ------------------------------------------------------------ a folha */

function gerar(livre, nome) {
  const doc = new PDFGen.Doc();
  doc.novaPagina();
  doc.texto('Hierarquia de tinta' + (livre ? ': como era' : ': como fica'),
    MARG_E, doc.y, { tam: 13, bold: true, cor: COR.navy });
  doc.y -= 20;

  function cartao(x, largura, titulo, altura, desenhar, fase) {
    doc.texto(titulo, x, doc.y, { tam: 7.5, bold: true, cor: COR.navy });
    doc.y -= 9;
    return B.figura(doc, {
      x: x, largura: largura, altura: altura,
      unidades: { x0: 0, y0: 0, x1: 10, y1: 8 },
      fase: fase || 'enunciado', receita: 'prova'
    }, desenhar);
  }
  function faixa(esq, dir) {
    const y0 = doc.y;
    esq(MARG_E, LARG);
    const y1 = doc.y;
    doc.y = y0;
    if (dir) dir(MARG_E + LARG + 16, LARG);
    doc.y = Math.min(y1, doc.y);
  }

  faixa(
    (x, L) => cartao(x, L, 'exercicio 17: bissetrizes de B e de C', 120, (ctx) => {
      const P = ctx.pontos(TRI);
      ctx.contorno(() => D.poligono(ctx, P, {}));
      ctx.marcas(() => cevianasComoNoTema(ctx, P, livre));
      ctx.rotulos(() => D.rotularVertices(ctx, P, ['A', 'B', 'C']));
    }),
    (x, L) => cartao(x, L, 'as mesmas duas, na fase de gabarito', 120, (ctx) => {
      const P = ctx.pontos(TRI);
      ctx.contorno(() => D.poligono(ctx, P, {}));
      ctx.marcas(() => cevianasComoNoTema(ctx, P, livre));
      ctx.rotulos(() => D.rotularVertices(ctx, P, ['A', 'B', 'C']));
    }, 'gabarito')
  );
  doc.y -= 14;

  faixa(
    (x, L) => cartao(x, L, 'ponto do plano com as guias ate os eixos', 130, (ctx) => {
      const O = ctx.p({ x: 0.6, y: 0.6 });
      ctx.contorno(() => {
        D.seta(ctx, O, ctx.p({ x: 9.4, y: 0.6 }), { espessura: 0.9 });
        D.seta(ctx, O, ctx.p({ x: 0.6, y: 7.6 }), { espessura: 0.9 });
      });
      ctx.marcas(() => D.ponto(ctx, ctx.p({ x: 6.2, y: 5.2 }), {
        guias: O, rotulo: 'P', direcao: { x: 0.7, y: 0.7 }, guiasApoio: livre
      }));
    }),
    (x, L) => cartao(x, L, 'seta de prolongamento e diagonal declarada objeto', 130, (ctx) => {
      const P = ctx.pontos([{ x: 1, y: 1 }, { x: 9, y: 1 }, { x: 8, y: 6.6 }, { x: 2, y: 6.6 }]);
      ctx.contorno(() => D.poligono(ctx, P, {}));
      ctx.marcas(() => {
        D.poligono(ctx, [P[0], P[2]], {
          fechado: false, cor: COR.teal, espessura: 0.6, papel: 'diagonal', tintaLivre: livre
        });
        D.seta(ctx, P[1], ctx.p({ x: 9.8, y: 1 }), {
          espessura: 0.6, cor: COR.teal, tracejado: 'auxiliar', tam: 5.5,
          papel: 'marca', tintaLivre: livre
        });
      });
    })
  );

  const bytes = doc.finalizar();
  const saida = path.join(__dirname, nome);
  fs.writeFileSync(saida, bytes);
  return { caminho: saida, doc: doc };
}

/* ------------------------------------------------------------ o julgamento */

const TEAL = auditor.TEAL, MUTED = auditor.MUTED;
function ehTeal(c) { return auditor.mesmaCor(c, TEAL); }
function ehMuted(c) { return auditor.mesmaCor(c, MUTED); }
function tracejado(d) { return d && auditor.padrao(d) !== '[]'; }

function contar(caminho) {
  const t = auditor.tracosDoPdf(caminho);
  return {
    total: t.length,
    tealTracejado: t.filter(x => ehTeal(x.cor) && tracejado(x.dash)).length,
    tealFino: t.filter(x => ehTeal(x.cor) && x.w < 0.9 - 1e-9).length,
    guia12: t.filter(x => auditor.padrao(x.dash) === '[1 2]').length,
    guia22muted: t.filter(x => auditor.padrao(x.dash) === '[2 2]' && ehMuted(x.cor)).length,
    guia22texto: t.filter(x => auditor.padrao(x.dash) === '[2 2]' && auditor.mesmaCor(x.cor, auditor.TEXTO)).length,
    cevianaCerta: t.filter(x => auditor.mesmaCor(x.cor, auditor.TEXTO) &&
      Math.abs(x.w - 0.9) < 1e-9 && !tracejado(x.dash)).length
  };
}

const sem = gerar(true, '_prova_desenho_tinta_sem.pdf');
const com = gerar(false, '_prova_desenho_tinta_com.pdf');
const S = contar(sem.caminho), C = contar(com.caminho);

let ok = 0, mau = 0;
function conf(rotulo, obtido, esperado) {
  const bom = String(obtido) === String(esperado);
  if (bom) ok++; else mau++;
  console.log((bom ? '  OK    ' : '  FALHA ') + rotulo +
    (bom ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}

console.log('medido no fluxo de conteudo dos dois PDFs\n');
console.log('  sem o conserto: ' + JSON.stringify(S));
console.log('  com o conserto: ' + JSON.stringify(C) + '\n');

console.log('o auditor acusa a folha de antes');
/* Cinco tracos em teal tracejado: as duas bissetrizes do enunciado, as duas da
 * fase de gabarito e a seta de prolongamento. So as duas do gabarito seriam
 * legitimas. E seis em teal abaixo de 0,9 pt: esses cinco mais a diagonal. */
conf('teal tracejado na folha inteira, antes: 5', S.tealTracejado, 5);
conf('teal abaixo de 0,9 pt, antes: 6', S.tealFino, 6);
conf('guia no padrao [1 2], antes: 2', S.guia12, 2);

console.log('\ne fica quieto na folha de agora');
conf('nenhum teal tracejado fora do gabarito', C.tealTracejado - 2, 0);
conf('nenhum traco em teal abaixo de 0,9 pt, em fase nenhuma', C.tealFino, 0);
conf('nenhuma guia no padrao [1 2]', C.guia12, 0);
conf('as duas guias saem em [2 2] na tinta do contorno', C.guia22texto, 2);

console.log('\ne o que sobrou na folha e o que a especificacao manda');
conf('a fase de gabarito guarda as suas duas cevianas em teal tracejado', C.tealTracejado, 2);
conf('as duas bissetrizes do enunciado saem continuas, 0,9 pt, tinta do contorno',
  C.cevianaCerta >= 2, true);
conf('o total de tracos nao mudou entre as duas folhas', C.total, S.total);

/* O rastro que o desenho.js deixa no doc, que e o outro canal: ele diz QUANTAS
 * linhas a regra tocou e por que motivo. */
const rastro = com.doc.tintaHierarquia || [];
const motivos = {};
rastro.forEach(r => { motivos[r.motivo] = (motivos[r.motivo] || 0) + 1; });
console.log('\nrastro em doc.tintaHierarquia: ' + rastro.length + ' correcao(oes) ' + JSON.stringify(motivos));
rastro.forEach(r => console.log('   ' + r.papel + ' [' + r.motivo + '] ' +
  r.de.espessura + ' pt ' + JSON.stringify(r.de.cor) + ' ' + (r.de.tracejado || 'continua') +
  '  ->  ' + r.para.espessura + ' pt ' + JSON.stringify(r.para.cor) + ' ' + (r.para.tracejado || 'continua')));
conf('o rastro registra as tres correcoes de objeto', motivos.objeto, 3);
conf('mais a metade do codigo que sobrou na seta', motivos.codigo, 1);
conf('e as duas do gabarito, que so subiram de espessura', motivos.destaque, 2);
conf('e a valvula tintaLivre nao deixa rastro nenhum', (sem.doc.tintaHierarquia || []).length, 0);

/* O outro juiz e o conferirFigura do base.js, que audita a figura pela saida e
 * nao pela chamada. So os avisos de TINTA interessam aqui: os outros sao de
 * outras travas e de outros donos, e a folha desta prova nao existe para
 * passar neles.
 *
 * Ele e juiz de fora, e juiz de fora pode estar indisponivel: quando o base.js
 * nao consegue medir o fluxo, esta parte da prova nao roda em vez de reprovar,
 * porque reprovar aqui acusaria o dono errado. A prova do auditor acima nao
 * depende dele e continua valendo. */
function avisosDeTinta(doc) {
  return (doc.avisosFigura || []).filter(a => /teal|\[3 2\]|tinta de contorno|0,90 w/.test(String(a)));
}
function mediu(doc) {
  return !(doc.avisosFigura || []).some(a => /a medicao do fluxo falhou/.test(String(a)));
}
console.log('');
if (!mediu(sem.doc) || !mediu(com.doc)) {
  console.log('   o conferirFigura do base.js nao conseguiu medir o fluxo nesta rodada, ' +
    'esta parte da prova nao roda');
} else {
  avisosDeTinta(sem.doc).forEach(a => console.log('   base.js acusa a folha de antes: ' + String(a).slice(0, 150)));
  avisosDeTinta(com.doc).forEach(a => console.log('   base.js acusa a folha de agora: ' + String(a).slice(0, 150)));
  conf('o conferirFigura do base.js acusa a folha de antes', avisosDeTinta(sem.doc).length > 0, true);
  conf('e nao tem o que dizer da folha de agora', avisosDeTinta(com.doc).length, 0);
}

console.log('\n' + ok + ' conferencias passaram, ' + mau + ' falharam.');
console.log(sem.caminho);
console.log(com.caminho);
process.exit(mau ? 1 : 0);
