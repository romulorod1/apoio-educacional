/* figuras/_prova_marcas.js
 * Gera o PDF de prova das marcas de geometria, uma pagina por funcao, com os
 * casos normais e os DIFICEIS lado a lado: triangulo obtusangulo, poligono
 * girado, angulo de 5 graus, angulo de 175 graus, rotulo em vertice apertado e
 * hachura em regiao com furo.
 *
 * A folha e o gate: as conferencias do fim pegam o que o olho nao pega (q sem Q,
 * tracejado ligado fora de envelope, recorte que vaza), mas nenhuma delas
 * substitui olhar cada pagina. Marca que sai do lado errado produz uma figura
 * bonita dizendo outra coisa, e isso so aparece olhando.
 *
 * O contorno das figuras de teste e desenhado aqui mesmo, com caminho cru: o
 * poligono() e do desenho.js e ainda nao existe. Isto e codigo de prova e nao
 * repertorio.
 *
 * Regra da casa: nunca usar travessao.
 */
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');
const FigBase = require('./base.js');
const M = require('./marcas.js');

const COR = PDFGen.COR;
const geo = FigBase.geo;
const MARG_E = PDFGen.MARG_E, MARG_D = PDFGen.MARG_D, UTIL = PDFGen.UTIL;

/* ================================================================ apoio da folha */

function f2(v) { return (Math.round(v * 100) / 100).toFixed(2); }

/* Contorno como caminho unico, com 1 J 1 j: quatro doc.linha nao tem juncao de
 * canto e em 1,2 pt aparece um entalhe em cada vertice. */
function contorno(doc, pts, op) {
  op = op || {};
  /* COR.texto e 1,2 pt, que e o que o receitas.js ja usa no contorno do
   * triangulo: as marcas saem no mesmo tom, e assim a folha de prova mostra o
   * contraste que a figura de verdade vai ter. */
  FigBase.comEstado(doc, {
    cor: op.cor || COR.texto,
    espessura: op.espessura != null ? op.espessura : 1.2,
    tracejado: op.tracejado || false
  }, function () {
    let s = '1 J 1 j ';
    for (let i = 0; i < pts.length; i++) {
      s += f2(pts[i].x) + ' ' + f2(pts[i].y) + (i === 0 ? ' m ' : ' l ');
    }
    if (op.fechado !== false) s += 'h ';
    doc.op(s + 'S');
  });
}

function circunferencia(doc, c, r, op) {
  op = op || {};
  FigBase.comEstado(doc, {
    cor: op.cor || COR.texto, espessura: op.espessura != null ? op.espessura : 1.2
  }, function () {
    const k = 0.5523 * r;
    doc.op(f2(c.x + r) + ' ' + f2(c.y) + ' m ' +
      f2(c.x + r) + ' ' + f2(c.y + k) + ' ' + f2(c.x + k) + ' ' + f2(c.y + r) + ' ' + f2(c.x) + ' ' + f2(c.y + r) + ' c ' +
      f2(c.x - k) + ' ' + f2(c.y + r) + ' ' + f2(c.x - r) + ' ' + f2(c.y + k) + ' ' + f2(c.x - r) + ' ' + f2(c.y) + ' c ' +
      f2(c.x - r) + ' ' + f2(c.y - k) + ' ' + f2(c.x - k) + ' ' + f2(c.y - r) + ' ' + f2(c.x) + ' ' + f2(c.y - r) + ' c ' +
      f2(c.x + k) + ' ' + f2(c.y - r) + ' ' + f2(c.x + r) + ' ' + f2(c.y - k) + ' ' + f2(c.x + r) + ' ' + f2(c.y) + ' c S');
  });
}

/* Letra de vertice na bissetriz externa, empurrada para fora pelo raio do
 * centro: deslocamento fixo em x e y funciona na primeira figura e no triangulo
 * obtusangulo a letra cai dentro do desenho. */
function letras(doc, pts, nomes) {
  const c = geo.centroide(pts);
  for (let i = 0; i < nomes.length && i < pts.length; i++) {
    if (!nomes[i]) continue;
    const dx = pts[i].x - c.x, dy = pts[i].y - c.y;
    const n = Math.sqrt(dx * dx + dy * dy) || 1;
    const x = pts[i].x + dx / n * 9, y = pts[i].y + dy / n * 9;
    doc.texto(nomes[i], x, y - 3, {
      tam: 8.5, cor: COR.texto,
      align: dx / n > 0.25 ? null : (dx / n < -0.25 ? 'direita' : 'centro')
    });
  }
}

const paginas = [];
function pagina(titulo, subtitulo, casos) { paginas.push({ titulo, subtitulo, casos }); }

/* ================================================================ 1. marcaAngulo */

pagina('marcaAngulo', 'arco no lado do angulo menor que 180, valor na bissetriz por fora do arco', [
  {
    titulo: 'normal: os tres angulos do triangulo, cada valor no seu vertice',
    desenhar: function (ctx) {
      const p = geo.trianguloPorAngulos(52, 61, 100);
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () {
        M.marcaAngulo(ctx.doc, P[0], P[1], P[2], { rotulo: '52°', ctx: ctx });
        M.marcaAngulo(ctx.doc, P[1], P[2], P[0], { rotulo: '61°', ctx: ctx });
        M.marcaAngulo(ctx.doc, P[2], P[0], P[1], { rotulo: '67°', ctx: ctx });
      });
    },
    unidades: geo.caixa(geo.trianguloPorAngulos(52, 61, 100))
  },
  {
    titulo: 'dificil: obtusangulo de 125 graus, com o arco tambem nos dois agudos',
    desenhar: function (ctx) {
      const p = geo.trianguloPorAngulos(25, 30, 100);
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () {
        M.marcaAngulo(ctx.doc, P[0], P[1], P[2], { rotulo: '25°', ctx: ctx });
        M.marcaAngulo(ctx.doc, P[1], P[2], P[0], { rotulo: '30°', ctx: ctx });
        M.marcaAngulo(ctx.doc, P[2], P[0], P[1], { rotulo: '125°', ctx: ctx });
      });
    },
    unidades: geo.caixa(geo.trianguloPorAngulos(25, 30, 100))
  },
  {
    titulo: 'dificil: pentagono girado 25 graus, dois angulos internos marcados',
    desenhar: function (ctx) {
      const p = geo.girar(geo.poligonoRegular({ x: 0, y: 0 }, 50, 5, 0), 25);
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () {
        M.marcaAngulo(ctx.doc, P[0], P[4], P[1], { rotulo: '108°', ctx: ctx });
        M.marcaAngulo(ctx.doc, P[2], P[1], P[3], { rotulo: 'x', ctx: ctx });
      });
    },
    unidades: geo.caixa(geo.girar(geo.poligonoRegular({ x: 0, y: 0 }, 50, 5, 0), 25))
  },
  {
    titulo: 'dificil: angulo de 5 graus, o valor sai da cunha ligado por fio fino',
    desenhar: function (ctx) {
      const V = ctx.p({ x: 0, y: 20 });
      const A = ctx.p({ x: 100, y: 20 });
      const B = ctx.p({ x: 100 * Math.cos(5 * Math.PI / 180), y: 20 + 100 * Math.sin(5 * Math.PI / 180) });
      ctx.contorno(function () {
        contorno(ctx.doc, [A, V, B], { fechado: false });
      });
      ctx.marcas(function () {
        M.marcaAngulo(ctx.doc, V, A, B, { rotulo: '5°', ctx: ctx });
      });
    },
    unidades: { x0: 0, y0: 0, x1: 100, y1: 40 }
  },
  {
    titulo: 'dificil: angulo de 175 graus, o arco anda o caminho curto',
    desenhar: function (ctx) {
      const V = ctx.p({ x: 50, y: 10 });
      const A = ctx.p({ x: 0, y: 10 });
      const B = ctx.p({ x: 50 + 50 * Math.cos(5 * Math.PI / 180), y: 10 + 50 * Math.sin(5 * Math.PI / 180) });
      ctx.contorno(function () { contorno(ctx.doc, [A, V, B], { fechado: false }); });
      ctx.marcas(function () {
        M.marcaAngulo(ctx.doc, V, A, B, { rotulo: '175°', ctx: ctx });
      });
    },
    unidades: { x0: 0, y0: 0, x1: 100, y1: 30 }
  },
  {
    titulo: 'congruencia por contagem: um arco no par da base, dois no outro par',
    desenhar: function (ctx) {
      const p = geo.trianguloPorAngulos(70, 70, 100);
      const P = ctx.pontos(p);
      const q = geo.transladar(geo.trianguloPorAngulos(70, 70, 60), 0, 0);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () {
        M.marcaAngulo(ctx.doc, P[0], P[1], P[2], { ctx: ctx });
        M.marcaAngulo(ctx.doc, P[1], P[2], P[0], { ctx: ctx });
        M.marcaAngulo(ctx.doc, P[2], P[0], P[1], { voltas: 2, ctx: ctx });
      });
      void q;
    },
    unidades: geo.caixa(geo.trianguloPorAngulos(70, 70, 100))
  }
]);

/* ================================================================ 2. marcaAnguloReto */

pagina('marcaAnguloReto', 'quadradinho encaixado no vertice, nunca arco e nunca o texto 90 graus', [
  {
    titulo: 'normal: triangulo 3, 4, 5 na posicao prototipica',
    desenhar: function (ctx) {
      const p = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 3 }];
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () { M.marcaAnguloReto(ctx.doc, P[0], P[1], P[2], { ctx: ctx }); });
      ctx.rotulos(function () { letras(ctx.doc, P, ['C', 'B', 'A']); });
    },
    unidades: { x0: 0, y0: 0, x1: 4, y1: 3 }
  },
  {
    titulo: 'dificil: o mesmo triangulo girado 35 graus, o quadradinho acompanha',
    desenhar: function (ctx) {
      const p = geo.girar([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 3 }], 35);
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () { M.marcaAnguloReto(ctx.doc, P[0], P[1], P[2], { ctx: ctx }); });
      ctx.rotulos(function () { letras(ctx.doc, P, ['C', 'B', 'A']); });
    },
    unidades: geo.caixa(geo.girar([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 3 }], 35))
  },
  {
    titulo: 'convencao: um quadradinho por cruzamento, nao quatro',
    desenhar: function (ctx) {
      const O = ctx.p({ x: 50, y: 30 });
      const a1 = ctx.p({ x: 4, y: 30 }), a2 = ctx.p({ x: 96, y: 30 });
      const b1 = ctx.p({ x: 50, y: 2 }), b2 = ctx.p({ x: 50, y: 58 });
      ctx.contorno(function () {
        contorno(ctx.doc, [a1, a2], { fechado: false });
        contorno(ctx.doc, [b1, b2], { fechado: false });
      });
      ctx.marcas(function () { M.marcaAnguloReto(ctx.doc, O, a2, b2, { ctx: ctx }); });
    },
    unidades: { x0: 0, y0: 0, x1: 100, y1: 60 }
  },
  {
    titulo: 'dificil: vertice apertado, o lado do quadradinho encolhe sozinho',
    desenhar: function (ctx) {
      const p = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 9 }];
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () { M.marcaAnguloReto(ctx.doc, P[0], P[1], P[2], { ctx: ctx }); });
    },
    unidades: { x0: 0, y0: 0, x1: 100, y1: 9 }
  },
  {
    titulo: 'recusa: 172 graus, quase colineares, avisa em vez de desenhar',
    desenhar: function (ctx) {
      const V = ctx.p({ x: 50, y: 20 });
      const A = ctx.p({ x: 0, y: 20 });
      const B = ctx.p({ x: 50 + 45 * Math.cos(8 * Math.PI / 180), y: 20 + 45 * Math.sin(8 * Math.PI / 180) });
      ctx.contorno(function () { contorno(ctx.doc, [A, V, B], { fechado: false }); });
      ctx.marcas(function () { M.marcaAnguloReto(ctx.doc, V, A, B, { ctx: ctx }); });
    },
    unidades: { x0: 0, y0: 0, x1: 100, y1: 40 },
    esperaAviso: 'quase colineares'
  },
  {
    titulo: 'no pe da altura, que e onde ele nunca pode faltar',
    desenhar: function (ctx) {
      const p = geo.trianguloPorAngulos(58, 47, 100);
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () {
        M.ceviana(ctx.doc, P[2], P[0], P[1], { tipo: 'altura', ctx: ctx });
      });
    },
    unidades: geo.caixa(geo.trianguloPorAngulos(58, 47, 100))
  }
]);

/* ================================================================ 3. marcaLado */

pagina('marcaLado', 'tracinho perpendicular ao lado para congruencia, ponta de seta para paralelismo', [
  {
    titulo: 'normal: isosceles, dois tracinhos nos dois lados iguais',
    desenhar: function (ctx) {
      const p = geo.trianguloPorAngulos(70, 70, 100);
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () {
        M.marcaLado(ctx.doc, P[0], P[2], { n: 2, ctx: ctx });
        M.marcaLado(ctx.doc, P[1], P[2], { n: 2, ctx: ctx });
      });
      ctx.rotulos(function () { letras(ctx.doc, P, ['A', 'B', 'C']); });
    },
    unidades: geo.caixa(geo.trianguloPorAngulos(70, 70, 100))
  },
  {
    titulo: 'tres grupos: um, dois e tres tracinhos, medidas diferentes',
    desenhar: function (ctx) {
      const p = geo.trianguloPorLados(9, 7, 5);
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () {
        M.marcaLado(ctx.doc, P[0], P[1], { n: 1, ctx: ctx });
        M.marcaLado(ctx.doc, P[1], P[2], { n: 2, ctx: ctx });
        M.marcaLado(ctx.doc, P[2], P[0], { n: 3, ctx: ctx });
      });
    },
    unidades: geo.caixa(geo.trianguloPorLados(9, 7, 5))
  },
  {
    titulo: 'paralelismo: seta simples nas duas bases do trapezio',
    desenhar: function (ctx) {
      const p = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 78, y: 45 }, { x: 22, y: 45 }];
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () {
        M.marcaLado(ctx.doc, P[0], P[1], { tipo: 'seta', n: 1, ctx: ctx });
        M.marcaLado(ctx.doc, P[3], P[2], { tipo: 'seta', n: 1, ctx: ctx });
        M.marcaLado(ctx.doc, P[1], P[2], { n: 1, ctx: ctx });
        M.marcaLado(ctx.doc, P[0], P[3], { n: 1, ctx: ctx });
      });
    },
    unidades: { x0: 0, y0: 0, x1: 100, y1: 45 }
  },
  {
    titulo: 'dois pares: seta simples num par, seta dupla no outro',
    desenhar: function (ctx) {
      const p = [{ x: 0, y: 0 }, { x: 90, y: 0 }, { x: 118, y: 45 }, { x: 28, y: 45 }];
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () {
        M.marcaLado(ctx.doc, P[0], P[1], { tipo: 'seta', n: 1, ctx: ctx });
        M.marcaLado(ctx.doc, P[3], P[2], { tipo: 'seta', n: 1, ctx: ctx });
        M.marcaLado(ctx.doc, P[1], P[2], { tipo: 'seta', n: 2, ctx: ctx });
        M.marcaLado(ctx.doc, P[0], P[3], { tipo: 'seta', n: 2, ctx: ctx });
      });
    },
    unidades: { x0: 0, y0: 0, x1: 118, y1: 45 }
  },
  {
    titulo: 'dificil: quadrado girado 40 graus, o tracinho e perpendicular ao lado',
    desenhar: function (ctx) {
      const p = geo.girar(geo.poligonoRegular({ x: 0, y: 0 }, 45, 4, 0), 40);
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () {
        for (let i = 0; i < 4; i++) M.marcaLado(ctx.doc, P[i], P[(i + 1) % 4], { n: 1, ctx: ctx });
      });
    },
    unidades: geo.caixa(geo.girar(geo.poligonoRegular({ x: 0, y: 0 }, 45, 4, 0), 40))
  },
  {
    titulo: 'dificil: lado curto, a folga encolhe; mais curto ainda, recusa',
    desenhar: function (ctx) {
      const p = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 6 }, { x: 0, y: 2.2 }];
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () {
        M.marcaLado(ctx.doc, P[1], P[2], { n: 3, ctx: ctx });   // cabe com folga reduzida
        M.marcaLado(ctx.doc, P[3], P[0], { n: 3, ctx: ctx });   // nao cabe, recusa
      });
    },
    unidades: { x0: 0, y0: 0, x1: 100, y1: 6 },
    esperaAviso: 'nao cabem',
    esperaAviso2: 'folga reduzida'
  }
]);

/* ================================================================ 4. hachurar */

pagina('hachurar', 'recorte mais varredura: regiao com furo sem nenhuma conta de intersecao', [
  {
    titulo: 'dificil: regiao com furo, entre o quadrado e o circulo inscrito',
    desenhar: function (ctx) {
      const quad = ctx.pontos([{ x: 0, y: 0 }, { x: 90, y: 0 }, { x: 90, y: 90 }, { x: 0, y: 90 }]);
      const c = ctx.p({ x: 45, y: 45 });
      const r = 45 * ctx.k;
      ctx.hachura(function () {
        M.hachurar(ctx.doc, [quad, { centro: c, raio: r }], { angulo: 45, espacamento: 5, ctx: ctx });
      });
      ctx.contorno(function () {
        contorno(ctx.doc, quad);
        circunferencia(ctx.doc, c, r);
      });
    },
    unidades: { x0: 0, y0: 0, x1: 90, y1: 90 },
    legenda: 'A parte hachurada é a região pedida.'
  },
  {
    titulo: 'coroa circular: dois circulos, regra par e impar',
    desenhar: function (ctx) {
      const c = ctx.p({ x: 45, y: 45 });
      const R = 44 * ctx.k, r = 24 * ctx.k;
      ctx.hachura(function () {
        M.hachurar(ctx.doc, [{ centro: c, raio: R }, { centro: c, raio: r }],
          { angulo: 30, espacamento: 5, ctx: ctx });
      });
      ctx.contorno(function () {
        circunferencia(ctx.doc, c, R);
        circunferencia(ctx.doc, c, r);
      });
    },
    unidades: { x0: 0, y0: 0, x1: 90, y1: 90 },
    legenda: 'A coroa hachurada é a região pedida.'
  },
  {
    titulo: 'setor circular de 110 graus, fechado ate o centro',
    desenhar: function (ctx) {
      const c = ctx.p({ x: 45, y: 45 });
      const R = 42 * ctx.k;
      ctx.hachura(function () {
        M.hachurar(ctx.doc, { centro: c, raio: R, de: 20, ate: 130, setor: true },
          { angulo: 60, espacamento: 5, ctx: ctx });
      });
      ctx.contorno(function () {
        circunferencia(ctx.doc, c, R);
        /* Os dois raios do setor. Sem eles quem le ve uma hachura flutuando
         * dentro do circulo: a regiao existe, mas nada diz onde ela comeca. */
        [20, 130].forEach(function (a) {
          const t = a * Math.PI / 180;
          contorno(ctx.doc, [c, { x: c.x + R * Math.cos(t), y: c.y + R * Math.sin(t) }],
            { fechado: false });
        });
      });
    },
    unidades: { x0: 0, y0: 0, x1: 90, y1: 90 }
  },
  {
    titulo: 'regiao unica: cinza chapado no cinza novo da paleta, e nao hachura',
    desenhar: function (ctx) {
      const quad = ctx.pontos([{ x: 0, y: 0 }, { x: 90, y: 0 }, { x: 90, y: 90 }, { x: 0, y: 90 }]);
      const c = ctx.p({ x: 45, y: 45 });
      const r = 45 * ctx.k;
      ctx.preenchimento(function () {
        M.hachurar(ctx.doc, [quad, { centro: c, raio: r }], { estilo: 'chapado', ctx: ctx });
      });
      ctx.contorno(function () {
        contorno(ctx.doc, quad);
        circunferencia(ctx.doc, c, r);
      });
    },
    unidades: { x0: 0, y0: 0, x1: 90, y1: 90 },
    legenda: 'A região sombreada é a região pedida.'
  },
  {
    titulo: 'dificil: 45 pedidos num quadrado girado 45, a inclinacao troca sozinha',
    desenhar: function (ctx) {
      const p = geo.girar(geo.poligonoRegular({ x: 0, y: 0 }, 45, 4, 0), 45);
      const P = ctx.pontos(p);
      ctx.hachura(function () {
        M.hachurar(ctx.doc, P, { angulo: 45, espacamento: 5, ctx: ctx });
      });
      ctx.contorno(function () { contorno(ctx.doc, P); });
    },
    /* Nao espera aviso: trocar dentro da lista da convencao e o contrato do
     * hachurar sendo cumprido, e nao anomalia. Quem confere o resultado e o
     * bloco de conferencias sobre a inclinacao, la embaixo, que mede a folga em
     * graus contra as fronteiras da propria regiao. */
    unidades: geo.caixa(geo.girar(geo.poligonoRegular({ x: 0, y: 0 }, 45, 4, 0), 45))
  },
  {
    titulo: 'dificil: poligono nao convexo, com espacamento abaixo do piso',
    desenhar: function (ctx) {
      const p = [{ x: 0, y: 0 }, { x: 90, y: 0 }, { x: 90, y: 34 }, { x: 38, y: 34 },
        { x: 38, y: 90 }, { x: 0, y: 90 }];
      const P = ctx.pontos(p);
      ctx.hachura(function () {
        M.hachurar(ctx.doc, P, { angulo: 30, espacamento: 1.5, ctx: ctx });
      });
      ctx.contorno(function () { contorno(ctx.doc, P); });
    },
    unidades: { x0: 0, y0: 0, x1: 90, y1: 90 },
    esperaAviso: 'abaixo do piso'
  }
]);

/* ================================================================ 5. ceviana */

pagina('ceviana', 'altura, mediana, bissetriz e mediatriz: o que as distingue na folha e a marca do pe', [
  {
    titulo: 'normal: altura em acutangulo, o pe cai dentro',
    desenhar: function (ctx) {
      const p = geo.trianguloPorAngulos(64, 58, 100);
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () {
        M.ceviana(ctx.doc, P[2], P[0], P[1], { tipo: 'altura', rotulo: 'h', ctx: ctx });
      });
      ctx.rotulos(function () { letras(ctx.doc, P, ['A', 'B', 'C']); });
    },
    unidades: geo.caixa(geo.trianguloPorAngulos(64, 58, 100))
  },
  {
    titulo: 'dificil: altura em obtusangulo, o pe cai fora e o lado se prolonga',
    desenhar: function (ctx) {
      const p = geo.trianguloPorAngulos(28, 132, 100);
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () {
        M.ceviana(ctx.doc, P[2], P[0], P[1], { tipo: 'altura', rotulo: 'h', ctx: ctx });
      });
      ctx.rotulos(function () { letras(ctx.doc, P, ['A', 'B', 'C']); });
    },
    unidades: null,
    calcularUnidades: function () {
      const p = geo.trianguloPorAngulos(28, 132, 100);
      const pe = geo.pe(p[2], p[0], p[1]);
      return geo.caixa(p.concat([{ x: pe.x, y: pe.y }]));
    }
  },
  {
    titulo: 'mediana: os dois tracinhos dizem que o pe e o ponto medio',
    desenhar: function (ctx) {
      const p = geo.trianguloPorAngulos(64, 44, 100);
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () {
        M.ceviana(ctx.doc, P[2], P[0], P[1], { tipo: 'mediana', ctx: ctx });
      });
      ctx.rotulos(function () { letras(ctx.doc, P, ['A', 'B', 'C']); });
    },
    unidades: geo.caixa(geo.trianguloPorAngulos(64, 44, 100))
  },
  {
    titulo: 'bissetriz: os dois arquinhos saem com o MESMO raio',
    desenhar: function (ctx) {
      const p = geo.trianguloPorAngulos(64, 44, 100);
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () {
        M.ceviana(ctx.doc, P[2], P[0], P[1], { tipo: 'bissetriz', ctx: ctx });
      });
      ctx.rotulos(function () { letras(ctx.doc, P, ['A', 'B', 'C']); });
    },
    unidades: geo.caixa(geo.trianguloPorAngulos(64, 44, 100))
  },
  {
    titulo: 'mediatriz: quadradinho no meio e um tracinho em cada metade',
    desenhar: function (ctx) {
      const p = geo.trianguloPorAngulos(56, 62, 100);
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () {
        M.ceviana(ctx.doc, P[2], P[0], P[1], { tipo: 'mediatriz', ctx: ctx });
      });
    },
    unidades: geo.caixa(geo.trianguloPorAngulos(56, 62, 100))
  },
  {
    titulo: 'dificil: rotulo em vertice apertado, altura sobre a hipotenusa',
    desenhar: function (ctx) {
      const p = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 26 }];
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () {
        M.marcaAnguloReto(ctx.doc, P[0], P[1], P[2], { ctx: ctx });
        M.ceviana(ctx.doc, P[0], P[1], P[2], { tipo: 'altura', rotulo: 'h', ctx: ctx });
      });
      ctx.rotulos(function () { letras(ctx.doc, P, ['A', 'B', 'C']); });
    },
    unidades: { x0: 0, y0: 0, x1: 100, y1: 26 }
  }
]);

/* ================================================================ 6. diagonais */

pagina('diagonais', 'pares nao adjacentes em linha auxiliar continua de 0,6 pt, nunca tracejada', [
  {
    titulo: 'normal: as cinco diagonais do pentagono',
    desenhar: function (ctx) {
      const p = geo.poligonoRegular({ x: 0, y: 0 }, 48, 5, 0);
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () { M.diagonais(ctx.doc, P, { ctx: ctx }); });
    },
    unidades: geo.caixa(geo.poligonoRegular({ x: 0, y: 0 }, 48, 5, 0))
  },
  {
    titulo: 'de um vertice so: as tres do hexagono, que dao os quatro triangulos',
    desenhar: function (ctx) {
      const p = geo.poligonoRegular({ x: 0, y: 0 }, 48, 6, 0);
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () {
        M.diagonais(ctx.doc, P, { deVertice: 'A', nomes: ['A', 'B', 'C', 'D', 'E', 'F'], ctx: ctx });
      });
      ctx.rotulos(function () { letras(ctx.doc, P, ['A', 'B', 'C', 'D', 'E', 'F']); });
    },
    unidades: geo.caixa(geo.poligonoRegular({ x: 0, y: 0 }, 48, 6, 0))
  },
  {
    titulo: 'destaque: as tres de um vertice em cheio, as demais recuadas',
    desenhar: function (ctx) {
      const p = geo.poligonoRegular({ x: 0, y: 0 }, 48, 6, 0);
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () {
        M.diagonais(ctx.doc, P, { destaque: 0, ctx: ctx });
      });
    },
    unidades: geo.caixa(geo.poligonoRegular({ x: 0, y: 0 }, 48, 6, 0))
  },
  {
    titulo: 'encontro: as duas diagonais do retangulo e o ponto O',
    desenhar: function (ctx) {
      const p = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 62 }, { x: 0, y: 62 }];
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () {
        M.diagonais(ctx.doc, P, { encontro: true, rotuloEncontro: 'O', ctx: ctx });
      });
      ctx.rotulos(function () { letras(ctx.doc, P, ['A', 'B', 'C', 'D']); });
    },
    unidades: { x0: 0, y0: 0, x1: 100, y1: 62 }
  },
  {
    titulo: 'dificil: heptagono girado 20 graus, todas as catorze',
    desenhar: function (ctx) {
      const p = geo.girar(geo.poligonoRegular({ x: 0, y: 0 }, 48, 7, 0), 20);
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () { M.diagonais(ctx.doc, P, { ctx: ctx }); });
    },
    unidades: geo.caixa(geo.girar(geo.poligonoRegular({ x: 0, y: 0 }, 48, 7, 0), 20))
  },
  {
    titulo: 'recusa: A-C desenha, A-B e lado do poligono e nao entra',
    desenhar: function (ctx) {
      const p = geo.poligonoRegular({ x: 0, y: 0 }, 48, 5, 0);
      const P = ctx.pontos(p);
      ctx.contorno(function () { contorno(ctx.doc, P); });
      ctx.marcas(function () {
        M.diagonais(ctx.doc, P, {
          quais: ['A-C', 'A-B'], nomes: ['A', 'B', 'C', 'D', 'E'], ctx: ctx
        });
      });
      ctx.rotulos(function () { letras(ctx.doc, P, ['A', 'B', 'C', 'D', 'E']); });
    },
    unidades: geo.caixa(geo.poligonoRegular({ x: 0, y: 0 }, 48, 5, 0)),
    esperaAviso: 'e um lado do poligono'
  }
]);

/* ================================================================ montagem */

const doc = new PDFGen.Doc();
const registros = [];

paginas.forEach(function (pg) {
  doc.novaPagina();
  doc.texto(pg.titulo, MARG_E, doc.y - 4, { tam: 14, bold: true, cor: COR.navy });
  doc.texto(pg.subtitulo, MARG_E, doc.y - 18, { tam: 8, cor: COR.muted });
  doc.y -= 34;

  const larguraCol = UTIL / 2 - 8;
  let yLinha = doc.y, menorY = doc.y, col = 0;

  pg.casos.forEach(function (caso) {
    const x = MARG_E + col * (UTIL / 2 + 8);
    doc.y = yLinha;
    doc.texto(caso.titulo, x, doc.y, { tam: 7, cor: COR.muted });
    doc.y -= 9;
    const unidades = caso.calcularUnidades ? caso.calcularUnidades() : caso.unidades;
    const r = FigBase.figura(doc, {
      x: x, largura: larguraCol, altura: 168, folga: 22,
      legenda: caso.legenda, id: pg.titulo + ':' + caso.titulo.slice(0, 24),
      unidades: unidades
    }, caso.desenhar);
    registros.push({
      pagina: pg.titulo, caso: caso.titulo,
      esperaAviso: caso.esperaAviso, esperaAviso2: caso.esperaAviso2, r: r
    });
    if (doc.y < menorY) menorY = doc.y;
    col++;
    if (col === 2) { col = 0; yLinha = menorY - 12; menorY = yLinha; }
  });
});

const bytes = doc.finalizar();
const saida = path.join(__dirname, '_prova_marcas.pdf');
fs.writeFileSync(saida, bytes);
console.log('PDF: ' + saida + '  (' + Math.round(bytes.length / 1024) + ' KB), ' +
  doc.paginas.length + ' paginas');

/* ================================================================ conferencias */

let ok = 0, mau = 0;
function conf(rotulo, obtido, esperado) {
  const bom = String(obtido) === String(esperado);
  if (bom) ok++; else mau++;
  console.log((bom ? '  OK    ' : '  FALHA ') + rotulo +
    (bom ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}

conf('desenhou as 36 figuras', registros.length, 36);

/* A trava que mais importa neste modulo: o hachurar liga recorte e o ceviana
 * liga tracejado, e os dois sao estado GLOBAL do fluxo de conteudo. Um W n sem
 * Q recorta o resto da folha e o sintoma aparece na pagina seguinte. */
let desequilibrio = 0, tracejadoSolto = 0, recorteSolto = 0;
doc.paginas.forEach(function (pag) {
  let profundidade = 0, tracejadoNaRaiz = false, recorteNaRaiz = false;
  pag.ops.forEach(function (linha) {
    const toks = String(linha).split(/\s+/);
    toks.forEach(function (tok) {
      if (tok === 'q') profundidade++;
      else if (tok === 'Q') profundidade--;
      else if (tok === 'd' && profundidade === 0) {
        const padrao = String(linha).slice(0, String(linha).lastIndexOf('d'));
        if (!/\[\s*\]/.test(padrao)) tracejadoNaRaiz = true;
      } else if ((tok === 'W' || tok === 'W*') && profundidade === 0) recorteNaRaiz = true;
    });
  });
  if (profundidade !== 0) desequilibrio++;
  if (tracejadoNaRaiz) tracejadoSolto++;
  if (recorteNaRaiz) recorteSolto++;
});
conf('todo q tem o seu Q em todas as paginas', desequilibrio, 0);
conf('nenhum tracejado ligado fora de envelope', tracejadoSolto, 0);
conf('nenhum recorte ligado fora de envelope', recorteSolto, 0);

/* Cada caso que espera aviso tem que ter avisado, e nenhum outro pode avisar por
 * conta propria. O teto de cinco marcas fica de fora da conta: as paginas de
 * prova mostram varias marcas de proposito. */
const avisos = (doc.avisosFigura || []).filter(function (a) { return !/marcas ativas/.test(a); });
const esperados = [];
registros.forEach(function (reg) {
  [reg.esperaAviso, reg.esperaAviso2].forEach(function (esperado) {
    if (!esperado) return;
    esperados.push(esperado);
    const achou = avisos.some(function (a) { return a.indexOf(esperado) >= 0; });
    conf('avisou "' + esperado + '"', achou, true);
  });
});
const inesperados = avisos.filter(function (a) {
  return !esperados.some(function (esperado) { return a.indexOf(esperado) >= 0; });
});
conf('nenhum aviso inesperado', inesperados.join(' | '), '');

/* O cinza de area precisa passar nos 3:1 da WCAG contra o branco, que e o
 * criterio que motivou a constante existir. Medido aqui e nao estimado. */
function lum(c) {
  const f = c.map(function (v) {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
}
function contraste(a, b) {
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
const cArea = contraste(M.COR_AREA, COR.branco);
conf('cinza de area passa dos 3:1 contra o branco (' + cArea.toFixed(2) + ')', cArea >= 3, true);
const cNavy = contraste(M.COR_AREA, COR.navy);
conf('e o contorno navy ainda se destaca sobre ele (' + cNavy.toFixed(2) + ')', cNavy >= 3, true);
const tinta = (3 - M.COR_AREA[0] - M.COR_AREA[1] - M.COR_AREA[2]) / 3;
console.log('        tinta do cinza de area: ' + (tinta * 100).toFixed(1) + ' por cento');
console.log('        COR.soft: ' + contraste(COR.soft, COR.branco).toFixed(2) +
  ', COR.fio: ' + contraste(COR.fio, COR.branco).toFixed(2) +
  ', COR.muted: ' + contraste(COR.muted, COR.branco).toFixed(2));

/* O arco sai sempre do lado do angulo menor que 180, que e o erro mais
 * silencioso da lista: a figura fica bonita e diz outra coisa. Conferido pela
 * abertura devolvida, com as semirretas nas duas ordens possiveis. */
{
  const t = new PDFGen.Doc(); t.novaPagina();
  const V = { x: 100, y: 100 }, A = { x: 180, y: 90 }, Bp = { x: 90, y: 180 };
  const r1 = M.marcaAngulo(t, V, A, Bp, {});
  const r2 = M.marcaAngulo(t, V, Bp, A, {});
  conf('a abertura nao depende da ordem das semirretas',
    Math.abs(r1.abertura - r2.abertura) < 1e-6, true);
  conf('e ela e sempre menor que 180', r1.abertura < 180 && r2.abertura < 180, true);
  const bis = r1.bissetriz;
  const dA = Math.atan2(A.y - V.y, A.x - V.x), dB = Math.atan2(Bp.y - V.y, Bp.x - V.x);
  const dBis = Math.atan2(bis.y, bis.x);
  function ang(a, b) { let d = Math.abs(a - b); return d > Math.PI ? 2 * Math.PI - d : d; }
  conf('a bissetriz fica entre as duas semirretas',
    Math.abs(ang(dBis, dA) - ang(dBis, dB)) < 1e-6 &&
    ang(dBis, dA) < r1.abertura * Math.PI / 180, true);
}

/* Angulo reto nunca sai como arco com 90 escrito. */
{
  const t = new PDFGen.Doc(); t.novaPagina();
  const r = M.marcaAngulo(t, { x: 0, y: 0 }, { x: 60, y: 0 }, { x: 0, y: 60 }, { rotulo: '90°' });
  conf('marcaAngulo em vertice reto devolve o quadradinho', r && r.tipo, 'anguloReto');
  const t2 = new PDFGen.Doc(); t2.novaPagina();
  const r2 = M.marcaAngulo(t2, { x: 0, y: 0 }, { x: 60, y: 0 }, { x: 0, y: 60 }, { rotulo: 'x' });
  conf('mas com incognita ele mantem o arco, para nao entregar a resposta',
    r2 && r2.tipo, 'anguloArco');
}

/* A marca NAO escala com a figura: a mesma marca em duas figuras de tamanhos
 * diferentes tem que sair com o mesmo raio em pontos. */
{
  const t = new PDFGen.Doc(); t.novaPagina();
  const grande = M.marcaAngulo(t, { x: 0, y: 0 }, { x: 200, y: 0 }, { x: 0, y: 200 }, { rotulo: 'a' });
  const medio = M.marcaAngulo(t, { x: 0, y: 0 }, { x: 70, y: 0 }, { x: 0, y: 70 }, { rotulo: 'b' });
  conf('o raio do arco fica no teto de ' + M.RAIO_MAX + ' pt na figura grande', grande.raio, M.RAIO_MAX);
  conf('e nao escala junto: na figura media ele so encolhe se precisar',
    medio.raio <= M.RAIO_MAX && medio.raio >= M.RAIO_MIN, true);
}

/* Os pisos da hachura sao duros, e nao recomendacao. */
{
  const t = new PDFGen.Doc(); t.novaPagina();
  const quad = [{ x: 40, y: 400 }, { x: 140, y: 400 }, { x: 140, y: 500 }, { x: 40, y: 500 }];
  const h = M.hachurar(t, quad, { angulo: 0, espacamento: 1, espessura: 3 });
  conf('espacamento sobe para o piso de 4 pt', h.espacamento >= M.ESPACAMENTO_MIN, true);
  conf('espessura cai para o teto de 0,6 pt', h.espessura, M.HACHURA_MAX);
  conf('e a inclinacao 0, paralela ao lado de baixo, e trocada', h.angulo !== 0, true);
}

/* ---------------------------------------------- a inclinacao escolhida por regiao
 *
 * Hachura paralela a uma fronteira da propria regiao e erro de desenho tecnico:
 * a listra mais externa passa a poder ser lida como o limite da regiao e o
 * limite como mais uma listra. A revisao mediu isso na fatia da pizza do
 * MAT08-13 (exercicio 7): hachura a 45 graus dentro de um setor de 0 a 45, ou
 * seja uma linha de hachura COLINEAR com o corte que limita a fatia, folga de
 * 0,0 grau. E no setor de 60 graus da p3, folga de 15,0 graus, com a primeira
 * linha convergindo para o raio e fechando uma fresta que afina ate sumir.
 *
 * Os dois passavam porque o ladosDe so enxergava lado de POLIGONO: setor nao
 * tem lado, tem raio, e arco parcial fecha pela corda. Este bloco cobra a folga
 * em graus, que e a medida do defeito, e nao a lista de fronteiras, que e a
 * implementacao. */
{
  const t = new PDFGen.Doc(); t.novaPagina();
  const C = { x: 300, y: 400 };
  function folga(angulo, fronteiras) {
    let pior = 180;
    fronteiras.forEach(function (f) {
      const d = Math.abs(((angulo - f) % 180 + 180) % 180);
      pior = Math.min(pior, Math.min(d, 180 - d));
    });
    return pior;
  }
  const PISO = 20;

  const fatia = M.hachurar(t, { centro: C, raio: 60, de: 0, ate: 45, setor: true }, { angulo: 45 });
  conf('fatia de 0 a 45 com 45 pedidos: a hachura sai longe dos dois raios (' +
    folga(fatia.angulo, [0, 45]).toFixed(1) + ' graus)',
    folga(fatia.angulo, [0, 45]) >= PISO, true);
  conf('e nenhuma linha da fatia fica colinear com o corte', fatia.angulo !== 45, true);

  const setor60 = M.hachurar(t, { centro: C, raio: 60, de: 0, ate: 60, setor: true }, { angulo: 45 });
  conf('setor de 60 graus com 45 pedidos: folga de ' +
    folga(setor60.angulo, [0, 60]).toFixed(1) + ' graus contra os raios',
    folga(setor60.angulo, [0, 60]) >= PISO, true);

  /* Arco parcial SEM setor fecha pela corda, que e reta igual: de 0 a 90 num
   * circulo a corda sai a 135 graus. */
  const seg = M.hachurar(t, { centro: C, raio: 60, de: 0, ate: 90, setor: false }, { angulo: 135 });
  conf('segmento circular: a hachura nao sai paralela a corda (' +
    folga(seg.angulo, [135]).toFixed(1) + ' graus)',
    folga(seg.angulo, [135]) >= PISO, true);

  const losango = M.hachurar(t, geo.girar(geo.poligonoRegular(C, 45, 4, 0), 45), { angulo: 45 });
  conf('quadrado girado 45: a hachura escapa dos dois pares de lados (' +
    folga(losango.angulo, [45, 135]).toFixed(1) + ' graus)',
    folga(losango.angulo, [45, 135]) >= PISO, true);

  /* Regiao que a convencao inteira nao resolve: o dodecagono regular tem seis
   * direcoes de lado distintas, de 30 em 30 graus, entao 45, 30, 60, 135, 120,
   * 150, 90 e 0 caem todos a 15 graus ou menos de alguma. Aqui o fallback entra
   * e AVISA, que e o unico caso em que avisar ainda faz sentido: houve um pedido
   * que a figura nao comporta. A folga maxima possivel e metade do vao de 30
   * entre direcoes vizinhas, ou seja 15 graus, e e nela que ele sai. */
  const antes = (t.avisosFigura || []).length;
  const p12 = geo.poligonoRegular(C, 45, 12, 0);
  const lados12 = p12.map(function (A, i) {
    const B = p12[(i + 1) % p12.length];
    return ((Math.atan2(B.y - A.y, B.x - A.x) * 180 / Math.PI) % 180 + 180) % 180;
  });
  const doze = M.hachurar(t, p12, { angulo: 45 });
  conf('dodecagono: sai na folga maxima possivel, ' + folga(doze.angulo, lados12).toFixed(1) +
    ' graus, que e metade do vao de 30 entre direcoes vizinhas de lado',
    Math.abs(folga(doze.angulo, lados12) - 15) < 0.51, true);
  conf('e esse caso, que a convencao nao resolve, avisa',
    (t.avisosFigura || []).slice(antes).some(function (a) { return /nenhuma inclinacao/.test(a); }), true);
}

/* A hachura tem PISO e nao so teto, e este bloco reprovava antes de o piso
 * existir: a hachura saia a 0,500 pt, meio decimo abaixo dos 0,6 pt que o
 * conferirFigura cobra de todo traco que carrega significado.
 *
 * A medida esta escrita por extenso no HACHURA_MAX do marcas.js. O resumo: a
 * 150 dpi, que e a resolucao tipica de fotocopiadora, 0,5 pt vale 1,04 pixel e
 * o traco cai entre a grade. Nas seis regioes hachuradas do tema do circulo,
 * 4150 travessias medidas, o pixel mais escuro do traco ficava em 133 de 255
 * (3,69 de contraste) e 21,37 por cento dos tracos nem chegavam aos 3:1 da
 * WCAG, um em cada tres na coroa e no anel interno do alvo. Com 0,6 pt: 123 de
 * 255, 4,23 de contraste, e 4,08 por cento abaixo de 3:1.
 *
 * As quatro primeiras conferencias sao o mesmo numero visto de quatro lados, e
 * e por isso que elas fecham a faixa em vez de so cobrar um valor: 0,6 e o piso
 * do projeto, e a metade exata do contorno de 1,2 pt (o dobro que a NBR 8403
 * exige entre linha larga e estreita) e e o maior teto que ainda cabe na regra
 * de seis por um contra o piso de espacamento de 4 pt. Subir para 0,7 quebra as
 * duas ultimas de uma vez, e por isso a prova reprova tanto quem desce quanto
 * quem sobe. */
{
  const t = new PDFGen.Doc(); t.novaPagina();
  const quad = [{ x: 40, y: 400 }, { x: 140, y: 400 }, { x: 140, y: 500 }, { x: 40, y: 500 }];
  const h = M.hachurar(t, quad, { angulo: 45, espacamento: 5 });
  const piso = FigBase.TRAVAS.minEspessura;
  conf('a hachura padrao sai no piso de espessura do projeto (' + piso + ' pt)',
    h.espessura >= piso - 1e-9, true);
  conf('e o teto da hachura tambem nao fica abaixo desse piso',
    M.HACHURA_MAX >= piso - 1e-9, true);
  conf('o teto para na metade do contorno de 1,2 pt, para nao competir com ele',
    M.HACHURA_MAX <= 1.2 / 2 + 1e-9, true);
  conf('e o piso de espacamento continua mandando na regra de seis por um',
    M.ESPACAMENTO_MIN >= 6 * M.HACHURA_MAX - 1e-9, true);
  conf('entao a hachura padrao cobre 12 por cento da regiao, longe de encher',
    Math.round(h.espessura / h.espacamento * 100), 12);
}

/* Diagonais: a contagem tem que fechar com n vezes n menos 3 sobre 2. */
{
  const t = new PDFGen.Doc(); t.novaPagina();
  [4, 5, 6, 7, 8].forEach(function (n) {
    const p = geo.poligonoRegular({ x: 300, y: 400 }, 60, n, 0);
    const r = M.diagonais(t, p, {});
    conf('poligono de ' + n + ' lados tem ' + (n * (n - 3) / 2) + ' diagonais', r.total, n * (n - 3) / 2);
  });
}

console.log('\n' + ok + ' conferencias passaram, ' + mau + ' falharam.');
if ((doc.avisosFigura || []).length) {
  console.log('\navisos registrados no doc (os esperados incluidos):');
  (doc.avisosFigura || []).forEach(function (a) { console.log('  . ' + a); });
}
process.exit(mau ? 1 : 0);
