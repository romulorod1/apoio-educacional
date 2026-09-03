/* figuras/_prova_desenho_curvas.js
 * Gera o _prova_desenho_curvas.pdf e MEDE o que ele desenhou.
 *
 * As oito figuras aqui sao as que os tres temas mais exigentes do banco pedem e
 * que o nucleo nao tinha: circunferencia com raio, diametro e corda cotados,
 * coroa, setor de 60 graus, elipse com focos, parabola com foco e diretriz,
 * hiperbole com assintotas, hexagono regular decomposto e eixos cartesianos com
 * uma parabola plotada.
 *
 * A folha sozinha nao prova nada. O que prova e a medicao, e ela e feita no
 * FLUXO DE CONTEUDO, ou seja no que vai sair impresso, e nao no que a funcao
 * disse que ia desenhar:
 *
 *   isotropia   a caixa envolvente de uma circunferencia de raio r tem que ter
 *               2r por 2r. Escala diferente em x e em y sai como diferenca entre
 *               a largura e a altura dessa caixa, e nao ha como esconder.
 *   elipse      para todo ponto desenhado, a soma das distancias aos dois focos
 *               tem que valer duas vezes o semieixo maior, com c igual a raiz de
 *               a ao quadrado menos b ao quadrado.
 *   parabola    para todo ponto desenhado, a distancia ao foco tem que ser igual
 *               a distancia a diretriz, com o foco a p/2 do vertice.
 *   hiperbole   para todo ponto desenhado, o modulo da diferenca das distancias
 *               aos dois focos tem que valer duas vezes o semieixo a.
 *   vinco       a curva amostrada e lida de volta como Bezier e comparada com a
 *               conica de verdade em 24 pontos por trecho. O numero que importa
 *               e o desvio maximo em pontos, contra a espessura do traco.
 *
 * Regra da casa: nunca usar travessao.
 */
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');
const B = require('./base.js');
const D = require('./desenho.js');

const COR = PDFGen.COR;
const geo = B.geo;
const MARG_E = PDFGen.MARG_E, MARG_D = PDFGen.MARG_D;
const LARG = (MARG_D - MARG_E - 16) / 2;

const doc = new PDFGen.Doc();
const medidas = [];      // o que cada cartao devolveu, para a secao de medicao
const conferencias = []; // o que o conferirFigura achou em cada cartao

/* ------------------------------------------------------------ andaime */

function pagina(titulo, subtitulo) {
  doc.novaPagina();
  doc.texto(titulo, MARG_E, doc.y, { tam: 13, bold: true, cor: COR.navy });
  doc.y -= 13;
  if (subtitulo) {
    doc.texto(subtitulo, MARG_E, doc.y, { tam: 8, cor: COR.muted });
    doc.y -= 12;
  }
  doc.y -= 6;
}

function faixa(esq, dir) {
  const y0 = doc.y;
  esq(MARG_E, LARG);
  const y1 = doc.y;
  doc.y = y0;
  if (dir) dir(MARG_E + LARG + 16, LARG);
  doc.y = Math.min(y1, doc.y);
}

/* Cada cartao guarda o registro E o trecho de fluxo que ele emitiu, que e o que
 * a secao de medicao le depois. O nome vai junto para o relatorio dizer qual
 * figura falhou, e nao so que alguma falhou.
 *
 * O "out" existe por causa da ordem de pintura: o desenhar() so EMPILHA os
 * blocos nas camadas e devolve na hora, e as camadas so rodam depois, dentro do
 * figura(). Um "return E" dentro do desenhar devolveria o valor de antes de a
 * elipse existir, e a medicao mediria null em silencio. O out e preenchido
 * dentro das camadas e lido depois que o figura() voltou. */
function cartao(nome, x, largura, titulo, altura, unidades, desenhar) {
  doc.texto(titulo, x, doc.y, { tam: 7.5, bold: true, cor: COR.navy });
  doc.y -= 9;
  const pag = doc.pag, de = pag.ops.length;
  const out = {};
  const reg = B.figura(doc, {
    x: x, largura: largura, altura: altura, folga: 20, unidades: unidades, antes: 2, depois: 10
  }, (ctx) => { desenhar(ctx, out); });
  let ops = pag.ops.slice(de);
  if (doc.pag !== pag && doc.pag) ops = ops.concat(doc.pag.ops);
  medidas.push({ nome: nome, reg: reg, ops: ops, saida: out });
  conferencias.push({ nome: nome, falhas: reg.conferencia || [] });
  return reg;
}

/* Hachura de prova, igual a do _prova_desenho.js: a primitiva hachurar() e do
 * marcas.js e de outro dono. O que se prova aqui e que a coroa e o setor
 * entregam a ela o caminho de recorte de que ela precisa. */
function hachuraDeProva(partes, angulo, espacamento) {
  const todos = [];
  for (let i = 0; i < partes.length; i++) for (let j = 0; j < partes[i].length; j++) todos.push(partes[i][j]);
  const cx = geo.caixa(todos);
  const diag = Math.sqrt(cx.largura * cx.largura + cx.altura * cx.altura) / 2 + 4;
  const u = { x: Math.cos(angulo * Math.PI / 180), y: Math.sin(angulo * Math.PI / 180) };
  const n = { x: -u.y, y: u.x };
  /* UM S no fim, e nao um S por linha, que e o que o hachurar() do marcas.js
   * tambem faz: e essa forma que o lerFluxo do base.js le como varredura, ou
   * seja como textura e nao como um punhado de tracos de 0,4 pt abaixo do piso.
   * Com um S por linha, o conferirFigura acusa a hachura em toda figura. */
  B.comEstado(doc, { recorte: partes, cor: COR.muted, espessura: 0.4 }, function () {
    let s = '0 J 0.40 w ';
    for (let t = -diag; t <= diag; t += espacamento) {
      const bx = cx.cx + n.x * t, by = cx.cy + n.y * t;
      s += (bx - u.x * diag).toFixed(2) + ' ' + (by - u.y * diag).toFixed(2) + ' m ' +
        (bx + u.x * diag).toFixed(2) + ' ' + (by + u.y * diag).toFixed(2) + ' l ';
    }
    doc.op(s + 'S');
  });
}

/* ================================================== 1. circunferencia e coroa */

pagina('circulo', 'MAT08-13: raio, diametro, corda, coroa e setor, tudo por Bezier e nunca pelo doc.circulo');

faixa(
  (x, L) => cartao('circulo r d corda', x, L, 'raio, diametro e corda cotados', 132,
    [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx, out) => {
      const C = ctx.p({ x: 5, y: 5 }), r = 4 * ctx.k;
      out.C = C; out.r = r;
      const cor = D.arcoPontos(C, r, r, 205, 320, { passo: 6 });
      ctx.contorno(() => D.circunferencia(ctx, C, r, {}));
      ctx.marcas(() => {
        D.cotaRadial(ctx, C, r, 'r', { angulo: 62 });
        D.cotaRadial(ctx, C, r, 'd', { tipo: 'diametro', angulo: 160 });
        D.poligono(ctx, [cor[0], cor[cor.length - 1]], { fechado: false, espessura: 0.9, papel: 'objeto' });
      });
      ctx.rotulos(() => D.ponto(ctx, C, { rotulo: 'O', direcoes: [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }] }));
    }),
  (x, L) => cartao('coroa', x, L, 'coroa circular: as duas circunferencias e o R por fora', 132,
    [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx, out) => {
      const C = ctx.p({ x: 5, y: 5 }), R = 4.2 * ctx.k, r = 2.4 * ctx.k;
      out.C = C; out.R = R; out.r = r;
      const fora = D.arcoPontos(C, R, R, 0, 360, { passo: 6 });
      const dentro = D.arcoPontos(C, r, r, 0, 360, { passo: 6 });
      ctx.hachura(() => hachuraDeProva([fora, dentro], 60, 5));
      ctx.contorno(() => {
        D.circunferencia(ctx, C, R, {});
        D.circunferencia(ctx, C, r, {});
      });
      ctx.marcas(() => {
        D.cotaRadial(ctx, C, R, '10', { angulo: 118 });
        D.cotaRadial(ctx, C, r, '6', { angulo: 215 });
      });
      ctx.rotulos(() => D.ponto(ctx, C, { rotulo: 'O', direcoes: [{ x: 0.7071, y: -0.7071 }, { x: -0.7071, y: -0.7071 }] }));
    })
);

faixa(
  (x, L) => cartao('setor 60', x, L, 'setor de 60 graus, com o arco destacado', 132,
    [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx, out) => {
      const C = ctx.p({ x: 5, y: 5 }), r = 4 * ctx.k;
      const A0 = 20, A1 = 80;
      out.C = C; out.r = r; out.de = A0; out.ate = A1;
      const setor = D.arcoPontos(C, r, r, A0, A1, { passo: 6, setor: true });
      const PA = { x: C.x + r * Math.cos(A0 * Math.PI / 180), y: C.y + r * Math.sin(A0 * Math.PI / 180) };
      const PB = { x: C.x + r * Math.cos(A1 * Math.PI / 180), y: C.y + r * Math.sin(A1 * Math.PI / 180) };
      ctx.hachura(() => hachuraDeProva([setor], 30, 4.5));
      ctx.contorno(() => {
        D.circunferencia(ctx, C, r, {});
        D.poligono(ctx, [PA, C, PB], { fechado: false, espessura: 0.9, papel: 'objeto' });
      });
      ctx.marcas(() => {
        D.arco(ctx, C, r, r, A0, A1, { espessura: 2.0, papel: 'marca' });
        D.arco(doc, C, 15, 15, A0, A1, { espessura: 0.9, papel: 'marca' });
      });
      ctx.rotulos(() => D.rotuloAngulo(ctx, '60°', C, PA, PB, { raioArco: 15 }));
    }),
  (x, L) => cartao('hexagono decomposto', x, L, 'seis triangulos de lado L, um preenchido, apotema', 132,
    [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx, out) => {
      const C = ctx.p({ x: 5, y: 5 }), r = 3.9 * ctx.k;
      /* A geometria e pedida uma vez, so calculando, porque o triangulo
       * preenchido mora na camada de PREENCHIMENTO, que roda antes da de
       * contorno. O desenho do hexagono vem depois, na camada dele, pela mesma
       * primitiva. */
      const H = D.poligonoRegular(ctx, C, 6, r, { desenhar: false });
      out.H = H;
      const V = H.pontos;
      ctx.preenchimento(() => D.poligono(ctx, [C, V[0], V[1]], { preenche: D.CINZA_AREA, contorno: false }));
      ctx.contorno(() => D.poligonoRegular(ctx, C, 6, r, {}));
      ctx.marcas(() => {
        for (let i = 0; i < 6; i++) D.poligono(ctx, [C, V[i]], { fechado: false, espessura: 0.6, papel: 'diagonal' });
        D.poligono(ctx, [C, H.pes[2]], { fechado: false, espessura: 0.9, papel: 'objeto' });
      });
      ctx.rotulos(() => {
        D.rotuloLado(ctx, 'L', V[0], V[1], { centro: C, tam: 8 });
      });
    })
);

pagina('conicas', 'MATEM3-04: elipse, parabola e hiperbole como caminhos amostrados suaves');

faixa(
  (x, L) => cartao('elipse focos', x, L, 'elipse com os dois focos e os semieixos', 178,
    [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx, out) => {
      const C = ctx.p({ x: 5, y: 5 });
      const a = 4.2 * ctx.k, b = 2.6 * ctx.k;
      ctx.contorno(() => { out.E = D.elipse(ctx, C, a, b, {}); });
      ctx.marcas(() => {
        D.poligono(ctx, [C, out.E.vertices[0]], { fechado: false, espessura: 0.9, papel: 'objeto' });
        D.poligono(ctx, [C, out.E.vertices[2]], { fechado: false, espessura: 0.9, papel: 'objeto' });
      });
      ctx.rotulos(() => {
        D.ponto(ctx, out.E.focos[0], { rotulo: 'F1', direcoes: [{ x: 0, y: -1 }, { x: 0, y: 1 }] });
        D.ponto(ctx, out.E.focos[1], { rotulo: 'F2', direcoes: [{ x: 0, y: -1 }, { x: 0, y: 1 }] });
      });
    }),
  (x, L) => cartao('parabola', x, L, 'parabola com foco e diretriz', 178,
    [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx, out) => {
      const V = ctx.p({ x: 5, y: 1.9 });
      const p = 2.2 * ctx.k;
      ctx.contorno(() => { out.Pb = D.parabola(ctx, V, p, { giro: 90, ate: 3.3 * ctx.k }); });
      ctx.marcas(() => D.poligono(ctx, out.Pb.diretriz, { fechado: false, espessura: 0.6, papel: 'guia' }));
      ctx.rotulos(() => {
        D.ponto(ctx, out.Pb.vertice, { rotulo: 'V', direcoes: [{ x: 1, y: 0 }, { x: -1, y: 0 }] });
        D.ponto(ctx, out.Pb.foco, { rotulo: 'F', direcoes: [{ x: 1, y: 0 }, { x: -1, y: 0 }] });
      });
    })
);

faixa(
  (x, L) => cartao('hiperbole', x, L, 'hiperbole com o retangulo fundamental e as assintotas', 178,
    [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx, out) => {
      const C = ctx.p({ x: 5, y: 5 });
      const a = 1.7 * ctx.k, b = 2.3 * ctx.k;
      const bloco = ctx.blocoInteiro
        ? { x0: ctx.blocoInteiro.x, y0: ctx.blocoInteiro.y,
            x1: ctx.blocoInteiro.x + ctx.blocoInteiro.largura,
            y1: ctx.blocoInteiro.y + ctx.blocoInteiro.altura }
        : null;
      ctx.contorno(() => { out.Hp = D.hiperbole(ctx, C, a, b, { ate: 3.0 * ctx.k }); });
      ctx.marcas(() => {
        D.poligono(ctx, out.Hp.retangulo, { espessura: 0.6, tracejado: 'oculta', cor: COR.muted, papel: 'apoio' });
        for (let i = 0; i < out.Hp.assintotas.length; i++) {
          D.poligono(ctx, out.Hp.assintotas[i], {
            fechado: false, espessura: 0.6, tracejado: 'guia', cor: COR.muted,
            papel: 'apoio', recorte: bloco
          });
        }
      });
      ctx.rotulos(() => {
        D.ponto(ctx, out.Hp.focos[0], { rotulo: 'F1', direcoes: [{ x: 0.7071, y: -0.7071 }, { x: 0.7071, y: 0.7071 }] });
        D.ponto(ctx, out.Hp.focos[1], { rotulo: 'F2', direcoes: [{ x: -0.7071, y: -0.7071 }, { x: -0.7071, y: 0.7071 }] });
      });
    }),
  null
);

/* ============================================================ 3. eixos */

pagina('eixos', 'escala unica nos dois sentidos, tique e nao malha, e a malha fraca como excecao');

faixa(
  (x, L) => cartao('eixos parabola', x, L, 'eixos com malha e a parabola y = x ao quadrado sobre 4', 168,
    null, (ctx, out) => {
      const u = 18;
      const O = { x: ctx.caixa.x + 3.1 * u, y: ctx.caixa.y + 1.5 * u };
      out.u = u;
      ctx.fundo(() => {
        out.ex = D.eixos(ctx, O, u, {
          xMin: -2.9, xMax: 2.9, yMin: -1.2, yMax: 3.6, passo: 1, malha: true
        });
      });
      ctx.contorno(() => {
        out.Pb = D.parabola(ctx, out.ex.p({ x: 0, y: 0 }), 2 * u, { giro: 90, ate: 2.6 * u });
      });
      ctx.rotulos(() => {
        D.ponto(ctx, out.Pb.foco, { rotulo: 'F', direcoes: [{ x: 1, y: 0 }, { x: -1, y: 0 }] });
      });
    }),
  (x, L) => cartao('eixos sem malha', x, L, 'os mesmos eixos so com tique, que e o padrao', 168,
    null, (ctx, out) => {
      const u = 18;
      const O = { x: ctx.caixa.x + 3.1 * u, y: ctx.caixa.y + 1.5 * u };
      out.u = u;
      ctx.fundo(() => {
        out.ex = D.eixos(ctx, O, u, { xMin: -2.9, xMax: 2.9, yMin: -1.2, yMax: 3.6, passo: 1 });
      });
      ctx.contorno(() => { out.El = D.elipse(ctx, out.ex.p({ x: 0, y: 1.8 }), 2.4 * u, 1.3 * u, {}); });
      ctx.rotulos(() => {
        D.ponto(ctx, out.El.focos[0], { rotulo: 'F1', direcoes: [{ x: 0, y: 1 }, { x: 0, y: -1 }] });
      });
    })
);

/* ------------------------------------------------------------ saida */

const saida = path.join(__dirname, '_prova_desenho_curvas.pdf');
fs.writeFileSync(saida, Buffer.from(doc.finalizar()));

/* ====================================================== leitor de caminhos
 *
 * O lerFluxo do base.js devolve os pontos de ANCORA de cada Bezier, que bastam
 * para a caixa envolvente e para as propriedades focais, mas nao respondem a
 * pergunta do vinco: o que a folha imprime entre duas ancoras e a curva de
 * Bezier, e nao a corda. Este leitor guarda os quatro pontos de controle de cada
 * trecho para a curva poder ser avaliada onde ela realmente passa. */
function lerCaminhos(ops) {
  const toks = [];
  for (const s of ops) {
    if (s.indexOf('BT ') === 0) continue;
    for (const t of s.split(/\s+/)) if (t) toks.push(t);
  }
  const subs = [];
  let atual = null, pilha = [];
  const num = (k) => {
    const v = pilha[pilha.length - k];
    return v === undefined ? 0 : v;
  };
  for (const t of toks) {
    const v = parseFloat(t);
    if (!isNaN(v) && /^[-+]?[\d.]+$/.test(t)) { pilha.push(v); continue; }
    switch (t) {
      case 'm': atual = { pts: [{ x: num(2), y: num(1) }], trechos: [] }; subs.push(atual); break;
      case 'l':
        if (atual) {
          const a = atual.pts[atual.pts.length - 1], b = { x: num(2), y: num(1) };
          atual.trechos.push({ p0: a, c1: a, c2: b, p3: b, reta: true });
          atual.pts.push(b);
        }
        break;
      case 'c':
        if (atual) {
          const a = atual.pts[atual.pts.length - 1];
          const c1 = { x: num(6), y: num(5) }, c2 = { x: num(4), y: num(3) };
          const p3 = { x: num(2), y: num(1) };
          atual.trechos.push({ p0: a, c1: c1, c2: c2, p3: p3, reta: false });
          atual.pts.push(p3);
        }
        break;
      default: break;
    }
    pilha = [];
  }
  return subs;
}

function emBezier(tr, t) {
  const s = 1 - t, a = s * s * s, b = 3 * s * s * t, c = 3 * s * t * t, d = t * t * t;
  return {
    x: a * tr.p0.x + b * tr.c1.x + c * tr.c2.x + d * tr.p3.x,
    y: a * tr.p0.y + b * tr.c1.y + c * tr.c2.y + d * tr.p3.y
  };
}

/* Todos os pontos por onde a curva REALMENTE passa, amostrados dentro de cada
 * Bezier e nao so nas ancoras. */
function pontosDoSub(sub, porTrecho) {
  const saida = [];
  for (const tr of sub.trechos) {
    for (let i = 0; i <= porTrecho; i++) saida.push(emBezier(tr, i / porTrecho));
  }
  return saida;
}

function caixaDe(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) {
    x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
  }
  return { x0, y0, x1, y1, largura: x1 - x0, altura: y1 - y0 };
}
const dist = (a, b) => Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));

/* A mesma parabola num doc de rascunho, com recorte falso: quantos caminhos de
 * recorte ela emite. Resposta esperada: nenhum, porque quem passa recorte falso
 * assumiu a responsabilidade. */
function rascunhoParabola() {
  const d = new PDFGen.Doc();
  d.novaPagina();
  const pag = d.pag, de = pag.ops.length;
  B.figura(d, { x: 40, largura: 240, altura: 140, folga: 20 }, (ctx) => {
    ctx.contorno(() => D.parabola(ctx, { x: 160, y: 500 }, 20, { giro: 90, ate: 60, recorte: false }));
  });
  return pag.ops.slice(de).filter((s) => s.indexOf('W* n') >= 0).length;
}

function achar(nome) {
  const m = medidas.filter((q) => q.nome === nome)[0];
  if (!m) throw new Error('cartao ' + nome + ' nao foi desenhado');
  return m;
}

/* O sub-caminho curvo com mais trechos e a curva principal do cartao. Serve para
 * achar a circunferencia, a elipse e a parabola sem depender da ordem em que as
 * camadas emitiram. */
function subsCurvos(ops, minTrechos) {
  return lerCaminhos(ops).filter((s) => {
    let curvos = 0;
    for (const t of s.trechos) if (!t.reta) curvos++;
    return curvos >= (minTrechos || 1);
  });
}

/* ------------------------------------------------------------ conferencias */

let passou = 0, falhou = 0;
function ok(cond, texto, extra) {
  if (cond) { passou++; console.log('  OK    ' + texto + (extra ? '   ' + extra : '')); }
  else { falhou++; console.log('  FALHA ' + texto + (extra ? '   ' + extra : '')); }
}
function medido(texto) { console.log('        ' + texto); }

console.log('');
console.log('isotropia: a circunferencia tem que sair redonda no fluxo de conteudo');

{
  const m = achar('circulo r d corda');
  const r = m.saida.r;
  const subs = subsCurvos(m.ops, 4);
  const cheio = subs.filter((s) => s.trechos.length === 4)[0];
  const pts = pontosDoSub(cheio, 24);
  const cx = caixaDe(pts);
  const desvioL = Math.abs(cx.largura - 2 * r);
  const desvioA = Math.abs(cx.altura - 2 * r);
  const anisotropia = Math.abs(cx.largura - cx.altura);
  medido('raio pedido ' + r.toFixed(3) + ' pt, caixa envolvente ' +
    cx.largura.toFixed(3) + ' por ' + cx.altura.toFixed(3) + ' pt');
  ok(desvioL < 0.5 && desvioA < 0.5,
    'a caixa e 2r por 2r com desvio abaixo de 0,5 pt',
    'largura ' + desvioL.toFixed(4) + ' pt, altura ' + desvioA.toFixed(4) + ' pt');
  ok(anisotropia < 0.5, 'e nao ha anisotropia entre os dois eixos',
    'diferenca ' + anisotropia.toFixed(4) + ' pt');

  /* Fidelidade do proprio Bezier: quatro trechos de 90 graus com k = 0,5523. */
  const C = m.saida.C;
  let pior = 0;
  for (const p of pts) pior = Math.max(pior, Math.abs(dist(p, C) - r));
  medido('desvio radial maximo do Bezier de 90 graus: ' + pior.toFixed(4) +
    ' pt em ' + pts.length + ' amostras (a espessura do traco e 1,20 pt)');
  ok(pior < 0.05, 'a circunferencia e circunferencia, e nao um poligono de muitos lados');
  ok(cheio.trechos.length === 4, 'e ela sai em quatro trechos de 90 graus, nao em um Bezier so');
}

{
  const m = achar('coroa');
  const subs = subsCurvos(m.ops, 4).filter((s) => s.trechos.length === 4);
  ok(subs.length >= 2, 'a coroa sai com as duas circunferencias por Bezier', subs.length + ' de 4 trechos');
  const raios = subs.map((s) => {
    const pts = pontosDoSub(s, 12), c = caixaDe(pts);
    return { r: (c.largura + c.altura) / 4, aniso: Math.abs(c.largura - c.altura) };
  }).sort((a, b) => b.r - a.r);
  medido('R medido ' + raios[0].r.toFixed(2) + ' pt (pedido ' + m.saida.R.toFixed(2) +
    '), r medido ' + raios[1].r.toFixed(2) + ' pt (pedido ' + m.saida.r.toFixed(2) + ')');
  ok(Math.abs(raios[0].r - m.saida.R) < 0.5 && Math.abs(raios[1].r - m.saida.r) < 0.5,
    'e as duas saem no raio pedido');
  ok(raios[0].aniso < 0.5 && raios[1].aniso < 0.5, 'as duas redondas',
    'anisotropia ' + raios[0].aniso.toFixed(4) + ' e ' + raios[1].aniso.toFixed(4) + ' pt');
}

{
  const m = achar('setor 60');
  const arcos = (m.reg.medido && m.reg.medido.arcos) || [];
  const varridos = arcos.map((a) => a.abertura).sort((a, b) => a - b);
  medido('aberturas medidas no fluxo: ' + varridos.map((v) => v.toFixed(2)).join(', '));
  const seis = varridos.filter((v) => Math.abs(v - 60) < 1);
  ok(seis.length >= 2, 'o arco destacado e o arco do angulo varrem 60 graus na folha',
    seis.length + ' arcos de 60');
  const rot = (m.reg.medido.textos || []).filter((t) => t.txt.indexOf('60') === 0)[0];
  ok(!!rot, 'e o valor 60 graus saiu impresso');
}

console.log('');
console.log('elipse: soma das distancias aos focos, medida nos pontos DESENHADOS');

{
  const m = achar('elipse focos');
  const E = m.saida.E;
  const a = Math.max(E.a, E.b), b = Math.min(E.a, E.b);
  const c = Math.sqrt(a * a - b * b);
  medido('a = ' + a.toFixed(3) + ' pt, b = ' + b.toFixed(3) + ' pt, c = raiz(a2 - b2) = ' + c.toFixed(3) + ' pt');
  ok(Math.abs(E.c - c) < 1e-9, 'a elipse devolve c = raiz(a ao quadrado menos b ao quadrado)',
    'devolveu ' + E.c.toFixed(6));
  ok(Math.abs(dist(E.focos[0], E.centro) - c) < 1e-9 && Math.abs(dist(E.focos[1], E.centro) - c) < 1e-9,
    'e os dois focos ficam a c do centro');

  const subs = subsCurvos(m.ops, 4).filter((s) => s.trechos.length === 4);
  const pts = pontosDoSub(subs[0], 24);
  let piorSoma = 0;
  for (const p of pts) piorSoma = Math.max(piorSoma, Math.abs(dist(p, E.focos[0]) + dist(p, E.focos[1]) - 2 * a));
  medido('desvio maximo de (PF1 + PF2 = 2a) em ' + pts.length + ' pontos desenhados: ' +
    piorSoma.toFixed(4) + ' pt');
  ok(piorSoma < 0.05, 'todo ponto desenhado cumpre PF1 mais PF2 igual a 2a');
  const cx = caixaDe(pts);
  medido('caixa da elipse: ' + cx.largura.toFixed(3) + ' por ' + cx.altura.toFixed(3) +
    ' pt (2a = ' + (2 * E.a).toFixed(3) + ', 2b = ' + (2 * E.b).toFixed(3) + ')');
  ok(Math.abs(cx.largura - 2 * E.a) < 0.5 && Math.abs(cx.altura - 2 * E.b) < 0.5,
    'e a caixa e 2a por 2b: o achatamento e o pedido, nao o da caixa da figura');
}

console.log('');
console.log('parabola: distancia ao foco igual a distancia a diretriz');

{
  const m = achar('parabola');
  const Pb = m.saida.Pb;
  medido('p = ' + Pb.p.toFixed(3) + ' pt, foco a ' + dist(Pb.foco, Pb.vertice).toFixed(4) +
    ' pt do vertice (p/2 = ' + (Pb.p / 2).toFixed(4) + ')');
  ok(Math.abs(dist(Pb.foco, Pb.vertice) - Pb.p / 2) < 1e-9, 'o foco fica a p/2 do vertice');
  ok(Math.abs(dist(Pb.peDaDiretriz, Pb.vertice) - Pb.p / 2) < 1e-9,
    'e a diretriz a p/2 do outro lado, ou seja p e a distancia do foco a diretriz');

  const subs = lerCaminhos(m.ops).filter((s) => s.trechos.length >= 40);
  const pts = pontosDoSub(subs[0], 8);
  const dq = Pb.peDaDiretriz, nrm = Pb.eixo;
  let pior = 0;
  for (const p of pts) {
    const aDiretriz = Math.abs((p.x - dq.x) * nrm.x + (p.y - dq.y) * nrm.y);
    pior = Math.max(pior, Math.abs(dist(p, Pb.foco) - aDiretriz));
  }
  medido('desvio maximo de (PF = P ate a diretriz) em ' + pts.length +
    ' pontos DENTRO dos Bezier: ' + pior.toFixed(4) + ' pt');
  ok(pior < 0.35, 'a curva desenhada e a parabola, e nao uma poligonal parecida com ela',
    'teto de 0,35 pt, que e um terco da espessura do traco');

  /* O recorte ao bloco. Uma parabola cresce quadraticamente e sem recorte o
   * traco sai do retangulo branco e cruza a marca d'agua e o texto do exercicio.
   * O que se confere e o operador: um W* n dentro do envelope da curva, com o
   * retangulo do bloco no caminho de recorte. */
  const bloco = m.reg.caixa;
  const comRecorte = m.ops.filter((s) => s.indexOf('W* n') >= 0).length;
  ok(comRecorte >= 1, 'a parabola sai recortada ao bloco', comRecorte + ' caminho(s) de recorte');
  /* O caminho de recorte e emitido no op ANTERIOR ao "W* n": o base.js escreve o
   * caminho e so entao liga o recorte. */
  let cantos = [];
  for (let i = 0; i < m.ops.length; i++) {
    if (m.ops[i].indexOf('W* n') >= 0 && i > 0) {
      cantos = (m.ops[i - 1].match(/-?\d+\.\d+/g) || []).map(Number);
      break;
    }
  }
  let rx0 = Infinity, ry0 = Infinity, rx1 = -Infinity, ry1 = -Infinity;
  for (let i = 0; i + 1 < cantos.length; i += 2) {
    rx0 = Math.min(rx0, cantos[i]); rx1 = Math.max(rx1, cantos[i]);
    ry0 = Math.min(ry0, cantos[i + 1]); ry1 = Math.max(ry1, cantos[i + 1]);
  }
  medido('caminho de recorte: ' + rx0.toFixed(1) + ' ate ' + rx1.toFixed(1) + ' em x, ' +
    ry0.toFixed(1) + ' ate ' + ry1.toFixed(1) + ' em y; bloco: ' +
    bloco.x.toFixed(1) + ' ate ' + (bloco.x + bloco.largura).toFixed(1) + ' em x, ' +
    bloco.y.toFixed(1) + ' ate ' + (bloco.y + bloco.altura).toFixed(1) + ' em y');
  ok(Math.abs(rx0 - bloco.x) < 0.01 && Math.abs(rx1 - (bloco.x + bloco.largura)) < 0.01 &&
     Math.abs(ry0 - bloco.y) < 0.01 && Math.abs(ry1 - (bloco.y + bloco.altura)) < 0.01,
    'e o recorte e exatamente o retangulo do bloco, sem quem chamou precisar dizer nada');

  /* Com recorte falso quem chama assume: nenhum W* n sai. */
  const semRecorte = rascunhoParabola();
  ok(semRecorte === 0, 'com recorte falso nenhum caminho de recorte e emitido',
    semRecorte + ' caminho(s)');
}

console.log('');
console.log('hiperbole: diferenca das distancias aos focos, e as assintotas');

{
  const m = achar('hiperbole');
  const Hp = m.saida.Hp;
  const c = Math.sqrt(Hp.a * Hp.a + Hp.b * Hp.b);
  medido('a = ' + Hp.a.toFixed(3) + ', b = ' + Hp.b.toFixed(3) + ', c = raiz(a2 + b2) = ' + c.toFixed(3) + ' pt');
  ok(Math.abs(Hp.c - c) < 1e-9, 'c e a raiz de a ao quadrado mais b ao quadrado');
  ok(Math.abs(dist(Hp.focos[0], Hp.centro) - c) < 1e-9, 'e o foco fica a c do centro');
  ok(Hp.ramos.length === 2, 'os dois ramos sao desenhados');

  const subs = lerCaminhos(m.ops).filter((s) => s.trechos.length >= 30);
  let pior = 0, n = 0;
  for (const s of subs) {
    for (const p of pontosDoSub(s, 8)) {
      pior = Math.max(pior, Math.abs(Math.abs(dist(p, Hp.focos[0]) - dist(p, Hp.focos[1])) - 2 * Hp.a));
      n++;
    }
  }
  medido('desvio maximo de (|PF1 - PF2| = 2a) em ' + n + ' pontos desenhados: ' + pior.toFixed(4) + ' pt');
  ok(subs.length === 2 && pior < 0.35, 'todo ponto desenhado cumpre a definicao da hiperbole');

  /* A assintota nao e barreira: a curva se aproxima dela e nunca a cruza. O que
   * se mede e se a distancia CAI quando o ponto se afasta do centro, contra a
   * assintota MAIS PROXIMA, porque cada ponta do ramo tem a sua: a de cima
   * persegue a que sobe e a de baixo persegue a que desce. */
  function aAssintota(P) {
    let melhor = Infinity;
    for (const A of Hp.assintotas) {
      const dir = { x: A[1].x - A[0].x, y: A[1].y - A[0].y };
      const dn = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
      const nA = { x: -dir.y / dn, y: dir.x / dn };
      melhor = Math.min(melhor, Math.abs((P.x - Hp.centro.x) * nA.x + (P.y - Hp.centro.y) * nA.y));
    }
    return melhor;
  }
  const ramo = Hp.ramos[0];
  const dPerto = aAssintota(ramo[Math.floor(ramo.length / 2)]);
  const dLonge = aAssintota(ramo[ramo.length - 1]);
  medido('distancia do ramo a assintota mais proxima: ' + dPerto.toFixed(2) +
    ' pt no vertice, ' + dLonge.toFixed(2) + ' pt na ponta');
  ok(dLonge < dPerto, 'o ramo se aproxima da assintota conforme se afasta do centro');
  /* Ordem declarada: a primeira sobe. Medido pelo sinal do y local da ponta. */
  const sobe = Hp.assintotas[0][1].y > Hp.assintotas[0][0].y;
  ok(sobe, 'e a primeira assintota devolvida e a que sobe, como a assinatura promete');
}

console.log('');
console.log('hexagono regular decomposto');

{
  const m = achar('hexagono decomposto');
  const H = m.saida.H;
  const lados = [];
  for (let i = 0; i < 6; i++) lados.push(dist(H.pontos[i], H.pontos[(i + 1) % 6]));
  const maiorLado = Math.max.apply(null, lados), menorLado = Math.min.apply(null, lados);
  medido('raio ' + H.raio.toFixed(3) + ', lado ' + H.lado.toFixed(3) +
    ', apotema ' + H.apotema.toFixed(3) + ' pt');
  ok(maiorLado - menorLado < 1e-9, 'os seis lados sao iguais',
    'variacao ' + (maiorLado - menorLado).toExponential(2) + ' pt');
  ok(Math.abs(H.lado - H.raio) < 1e-9, 'e no hexagono o lado vale o raio, que e o argumento da decomposicao');
  ok(Math.abs(H.apotema - H.raio * Math.sqrt(3) / 2) < 1e-9,
    'a apotema vale o raio vezes raiz de tres sobre dois');
  ok(Math.abs(dist(H.centro, H.pes[2]) - H.apotema) < 1e-9,
    'e o pe devolvido esta mesmo a uma apotema do centro');
  ok(H.n === 6 && H.anguloCentral === 60, 'seis triangulos de 60 graus no centro');
}

console.log('');
console.log('eixos: uma escala so nos dois sentidos');

{
  const m = achar('eixos parabola');
  const ex = m.saida.ex;
  const dx = ex.px(1) - ex.px(0), dy = ex.py(1) - ex.py(0);
  medido('uma unidade vale ' + dx.toFixed(4) + ' pt em x e ' + dy.toFixed(4) + ' pt em y');
  ok(Math.abs(dx - dy) < 1e-9, 'a unidade e a MESMA nos dois eixos: nao ha como pedir escala diferente');
  ok(ex.u === m.saida.u, 'e a escala devolvida e a que foi pedida');

  const textos = m.reg.medido.textos || [];
  const corpos = textos.map((t) => t.tam);
  medido('a folha escreveu ' + textos.length + ' textos, corpo minimo ' +
    Math.min.apply(null, corpos).toFixed(2) + ' pt');
  ok(Math.min.apply(null, corpos) >= 7.5 - 1e-6, 'nenhum numero abaixo do piso de 7,5 pt');
  medido('marcas ativas: ' + m.reg.marcasAtivas + ' (a escala dos dois eixos conta duas)');
  ok(m.reg.marcasAtivas <= 5, 'o plano cheio com malha, numeros e um ponto cabe no teto de cinco');

  /* A malha tem que sair como VARREDURA, senao cada linha dela e acusada de
   * traco abaixo do piso e de contraste abaixo de 3:1, uma vez por figura. */
  const finos = (m.reg.medido.segmentos || []).filter((s) => s.w < 0.6 - 1e-6);
  const finosSoltos = finos.filter((s) => !s.varredura);
  medido('segmentos abaixo de 0,6 pt: ' + finos.length + ', deles fora de varredura: ' + finosSoltos.length);
  ok(finos.length > 0 && finosSoltos.length === 0,
    'a malha de 0,3 pt sai como varredura unica, que e a excecao declarada ao piso');

  /* O zero contra o menos um. Na primeira tirada desta folha o halo do zero,
   * pintado por ultimo, apagou o "-1" do eixo x por inteiro: o numero sumia da
   * escala e ninguem via, porque a falta de um numero nao dispara nada. A
   * medicao e o vao entre as caixas IMPRESSAS, que e o que a folha mostra. */
  const caixas = textos.map((t) => {
    const c = D.caixaDoRotulo(t.txt, { tam: t.tam, bold: t.bold });
    return {
      txt: t.txt,
      x0: t.x - (c.largura - (t.largura || 0)) / 2, y0: t.y - (c.altura - t.tam * 0.717) / 2,
      l: c.largura, h: c.altura
    };
  });
  let pior = null, vaoPior = Infinity;
  for (let i = 0; i < caixas.length; i++) {
    for (let j = i + 1; j < caixas.length; j++) {
      const a = caixas[i], b = caixas[j];
      const gx = Math.max(0, Math.max(a.x0, b.x0) - Math.min(a.x0 + a.l, b.x0 + b.l));
      const gy = Math.max(0, Math.max(a.y0, b.y0) - Math.min(a.y0 + a.h, b.y0 + b.h));
      const v = Math.sqrt(gx * gx + gy * gy);
      if (v < vaoPior) { vaoPior = v; pior = a.txt + ' e ' + b.txt; }
    }
  }
  medido('o par de numeros mais apertado da escala: ' + pior + ' a ' + vaoPior.toFixed(2) + ' pt');
  ok(vaoPior > 0, 'nenhuma caixa de numero da escala se sobrepoe a outra, o zero incluido');
  const temMenosUm = textos.filter((t) => t.txt === '-1').length;
  medido('numeros escritos: ' + textos.map((t) => t.txt).join(' '));
  ok(temMenosUm === 2, 'e os dois -1 foram mesmo escritos no fluxo', temMenosUm + ' de 2');

  const Pb = m.saida.Pb;
  const noEixo = Math.abs(Pb.vertice.x - ex.px(0)) + Math.abs(Pb.vertice.y - ex.py(0));
  ok(noEixo < 1e-9, 'a parabola plotada tem o vertice na origem dos eixos');
  const fx = ex.inverso(Pb.foco);
  medido('foco em unidades do plano: (' + fx.x.toFixed(3) + ', ' + fx.y.toFixed(3) + ')');
  ok(Math.abs(fx.x) < 1e-9 && Math.abs(fx.y - 1) < 1e-9,
    'y = x ao quadrado sobre 4 tem foco em (0, 1), e e onde ele saiu');
}

{
  const m = achar('eixos sem malha');
  const finos = (m.reg.medido.segmentos || []).filter((s) => s.w < 0.6 - 1e-6);
  ok(finos.length === 0, 'sem malha nao sobra nenhum traco abaixo do piso');
  ok(m.reg.marcasAtivas <= 5, 'e o plano sem malha tambem cabe no teto',
    m.reg.marcasAtivas + ' marcas');
}

console.log('');
console.log('direcao livre: a caixa que a busca testa e a caixa que a folha imprime');

/* O ponto com rotulo, num bloco de rascunho, com um traco de CONTORNO cruzando a
 * 12 pt dele na direcao preferida: a preferida esta bloqueada e a lista oferece
 * uma segunda. Devolve o que a medicao precisa, tudo lido do registro: em qual
 * das duas o rotulo saiu, o que o direcaoLivre responde quando a pergunta e
 * feita na caixa DESENHADA (ancora no proprio ponto, raio somado ao afastamento,
 * que e o idioma do nomearPonto do receitas.js), quanto o rotulo teve que fugir
 * depois e se a fuga ligou o fio de chamada.
 *
 * Este cartao existe porque faltava exatamente ele. O ponto() perguntava com uma
 * ancora deslocada de raio na direcao de PARTIDA, que e fixa (a diagonal de 45
 * graus quando ninguem passa op.direcao) enquanto a candidata varia: a caixa
 * testada nao era a desenhada e, pior, caia em cima da bolinha do proprio ponto,
 * que duas linhas antes ja tinha entrado na lista de obstaculos. Toda candidata
 * apontando contra a diagonal de partida saia como bloqueada e o direcaoLivre
 * devolvia a primeira da lista, ou seja op.direcoes virava sinonimo de
 * direcao=direcoes[0]. Quem salvava era a fuga de halo do rotulo(), que empurra
 * e, acima de um corpo de desvio, ainda liga o fio de chamada. */
function pontoComBarreira(pref, alt) {
  const d = new PDFGen.Doc();
  d.novaPagina();
  let reg = null, resposta = null;
  B.figura(d, { x: 40, largura: 300, altura: 200, folga: 20 }, (ctx) => {
    const P = { x: ctx.caixa.x + ctx.caixa.largura / 2, y: ctx.caixa.y + ctx.caixa.altura / 2 };
    const c = { x: P.x + pref.x * 12, y: P.y + pref.y * 12 };
    const t = { x: -pref.y, y: pref.x };
    ctx.contorno(() => D.poligono(ctx, [
      { x: c.x - t.x * 40, y: c.y - t.y * 40 }, { x: c.x + t.x * 40, y: c.y + t.y * 40 }
    ], { fechado: false, espessura: 1.2 }));
    ctx.rotulos(() => {
      reg = D.ponto(ctx, P, { rotulo: 'A', direcoes: [pref, alt] });
      resposta = D.direcaoLivre(ctx, 'A', P, [pref, alt],
        { tam: D.TAM_PADRAO, afastamento: 2.5 + reg.raio });
    });
  });
  const r = reg.rotulo;
  const v = { x: r.cx - reg.x, y: r.cy - reg.y };
  const n = Math.sqrt(v.x * v.x + v.y * v.y);
  const saiu = ((v.x * pref.x + v.y * pref.y) / n) > ((v.x * alt.x + v.y * alt.y) / n) ? 0 : 1;
  const esperada = (resposta.x * pref.x + resposta.y * pref.y) > 0.999 ? 0 : 1;
  return { saiu: saiu, esperada: esperada, desviou: r.desviou, chamada: r.chamada };
}

{
  const rosa = [];
  for (let g = 0; g < 360; g += 45) {
    rosa.push({ x: Math.cos(g * Math.PI / 180), y: Math.sin(g * Math.PI / 180) });
  }

  /* Primeiro os oito pares OPOSTOS, onde a alternativa esta comprovadamente
   * livre: o traco cruza de um lado so, entao o outro lado nao tem nada. Aqui
   * nao ha tolerancia a discutir, o rotulo tem que sair na livre nas oito. */
  let naBloqueada = 0, comFio = 0, maiorDesvio = 0;
  for (const pref of rosa) {
    const q = pontoComBarreira(pref, { x: -pref.x, y: -pref.y });
    if (q.saiu === 0) naBloqueada++;
    if (q.chamada) comFio++;
    maiorDesvio = Math.max(maiorDesvio, q.desviou);
  }
  medido('oito sentidos da rosa, traco de contorno a 12 pt na preferida e nada na oposta');
  ok(naBloqueada === 0, 'o rotulo do ponto nasce na direcao LIVRE nas oito',
    naBloqueada + ' de 8 ficaram na bloqueada');
  ok(maiorDesvio === 0 && comFio === 0,
    'e nasce onde a geometria pediu: nenhuma fuga de halo e nenhum fio de chamada',
    'maior desvio ' + maiorDesvio.toFixed(2) + ' pt, ' + comFio + ' com fio');

  /* Depois os 56 pares da rosa inteira. Aqui a alternativa nem sempre esta
   * livre (a vizinha de 45 graus costuma estar sob o mesmo traco), entao contar
   * quantas ficaram na bloqueada nao diz nada sozinho. O que se mede e a
   * COERENCIA: a direcao em que o rotulo saiu tem que ser a mesma que o
   * direcaoLivre responde para a caixa desenhada. Divergir e o defeito, porque
   * quer dizer que o ponto perguntou por uma caixa e imprimiu outra. */
  let n = 0, divergiu = 0, fio = 0, soma = 0;
  for (const a of rosa) {
    for (const b of rosa) {
      if (Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9) continue;
      const q = pontoComBarreira(a, b);
      n++;
      if (q.saiu !== q.esperada) divergiu++;
      if (q.chamada) fio++;
      soma += q.desviou;
    }
  }
  medido('rosa inteira: ' + n + ' pares (preferida bloqueada), desvio medio de fuga ' +
    (soma / n).toFixed(2) + ' pt, ' + fio + ' rotulos com fio de chamada');
  ok(divergiu === 0,
    'a direcao em que o ponto imprime e a que o direcaoLivre responde para a caixa desenhada',
    divergiu + ' de ' + n + ' divergiram');
}

/* E o mesmo, medido no cartao que vai para a folha. Os dois focos da hiperbole
 * oferecem duas direcoes cada um e a PRIMEIRA de cada lista esta livre: e onde
 * se ve que op.direcoes nao virou sinonimo de nada. Com a pergunta errada a
 * primeira era dada como bloqueada pela bolinha do proprio ponto e as letras
 * nasciam na segunda, 18 pt acima de onde a receita pediu, sem que ninguem
 * reclamasse, porque um rotulo que nao foge nao deixa rastro no registro. */
{
  const m = achar('hiperbole');
  /* As mesmas direcoes que o cartao ofereceu, ja como versores: comparar com o
   * par 0,7071 cru daria 0,26 grau de erro que e da lista e nao do desenho. */
  const preferida = { F1: D.versor({ x: 0.7071, y: -0.7071 }), F2: D.versor({ x: -0.7071, y: -0.7071 }) };
  let vistos = 0, naPreferida = 0, piorDesvio = 0;
  for (const p of m.reg.pontos || []) {
    const r = p.rotulo, esperada = r && preferida[r.texto];
    if (!esperada) continue;
    vistos++;
    const v = { x: r.cx - p.x, y: r.cy - p.y };
    const n = Math.sqrt(v.x * v.x + v.y * v.y);
    const cos = (v.x * esperada.x + v.y * esperada.y) / n;
    if (cos > 0.999) naPreferida++;
    piorDesvio = Math.max(piorDesvio, r.desviou);
    medido('foco ' + r.texto + ': o rotulo saiu a ' +
      (Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI).toFixed(1) +
      ' graus da direcao que a receita preferia, com desvio de fuga ' + r.desviou.toFixed(2) + ' pt');
  }
  ok(vistos === 2, 'os dois focos da hiperbole foram nomeados', vistos + ' de 2');
  ok(naPreferida === 2 && piorDesvio === 0,
    'e cada letra saiu na PRIMEIRA direcao da lista, que esta livre, sem fugir do halo');

  /* Os outros dois cartoes de conica ficam onde estavam e continuam fugindo: no
   * F1 e no F2 da elipse e no V da parabola as DUAS direcoes ofertadas estao
   * mesmo bloqueadas pela curva desenhada, e escolher melhor entre duas
   * bloqueadas nao existe. Quem resolve ali e a receita, ofertando mais
   * direcoes, e nao esta primitiva. O numero fica escrito para nao se confundir
   * o que a correcao faz com o que ela nao faz. */
  const fujoes = [];
  for (const q of medidas) {
    for (const r of q.reg.rotulos || []) {
      if (r.desviou > 0) fujoes.push(q.nome + ' "' + r.texto + '" ' + r.desviou.toFixed(0) + ' pt');
    }
  }
  medido('rotulos que ainda fogem do halo nesta folha: ' + (fujoes.join(', ') || 'nenhum'));
}

console.log('');
console.log('as recusas: o que cada primitiva se nega a desenhar, e com que aviso');

/* Um doc de rascunho, para os avisos destas conferencias nao entrarem na folha
 * que vai para a impressora. */
function rascunho(fn) {
  const d = new PDFGen.Doc();
  d.novaPagina();
  let saida = null;
  B.figura(d, { x: 40, largura: 240, altura: 120, folga: 20 }, (ctx) => {
    ctx.contorno(() => { saida = fn(ctx, d); });
  });
  return { avisos: d.avisosFigura || [], saida: saida };
}
function avisou(lista, trecho) {
  for (const a of lista) if (a.indexOf(trecho) >= 0) return true;
  return false;
}

{
  const r1 = rascunho((ctx) => D.circunferencia(ctx, ctx.p({ x: 0, y: 0 }), -3, {}));
  ok(r1.saida === null && avisou(r1.avisos, 'circunferencia com raio invalido'),
    'circunferencia de raio negativo nao desenha e avisa');

  const r2 = rascunho((ctx) => D.elipse(ctx, ctx.p({ x: 0, y: 0 }), 40, 0, {}));
  ok(r2.saida === null && avisou(r2.avisos, 'elipse com semieixo invalido'),
    'elipse com semieixo zero nao desenha e avisa');

  const r3 = rascunho((ctx) => D.parabola(ctx, ctx.p({ x: 0, y: 0 }), 0, {}));
  ok(r3.saida === null && avisou(r3.avisos, 'parabola com parametro p invalido'),
    'parabola com p zero nao desenha e avisa: p e a distancia do foco a diretriz');

  const r4 = rascunho((ctx) => D.poligonoRegular(ctx, ctx.p({ x: 0, y: 0 }), 2, 30, {}));
  ok(r4.saida === null && avisou(r4.avisos, 'o minimo e tres'),
    'poligono regular de dois lados nao desenha e avisa');

  const r5 = rascunho((ctx) => D.curvaSuave(ctx, [ctx.p({ x: 0, y: 0 })], {}));
  ok(r5.saida === null && avisou(r5.avisos, 'curvaSuave com menos de dois pontos'),
    'curva com um ponto so nao desenha e avisa');

  /* Uma curva amostrada anotada como MARCA contaria uma marca ativa por trecho e
   * estouraria o teto de cinco sozinha. Ela sai como traco e avisa. */
  const r6 = rascunho((ctx) => {
    const pts = [];
    for (let i = 0; i <= 30; i++) pts.push({ x: 60 + i * 3, y: 400 + Math.sin(i / 4) * 10 });
    return D.curvaSuave(ctx, pts, { papel: 'marca' });
  });
  ok(r6.saida && r6.saida.papel === 'contorno' && avisou(r6.avisos, 'estouraria o teto de cinco'),
    'curva pedida como marca sai como traco e avisa, em vez de estourar o teto');

  /* A escala densa demais para o corpo do numero: o canto do terceiro quadrante
   * e onde o numero do eixo x e o do eixo y se encontram, e o piso e a folga
   * mais tres meias alturas, que com corpo de 7,5 pt da 17,55 pt por passo. */
  const r7 = rascunho((ctx, d) => D.eixos(ctx, { x: 200, y: 500 }, 11.5,
    { xMin: -3, xMax: 3, yMin: -2, yMax: 3, passo: 1 }));
  ok(avisou(r7.avisos, 'se sobrepoem ali'),
    'a 11,5 pt por unidade a escala avisa que os dois numeros do canto se sobrepoem');
  const r8 = rascunho((ctx) => D.eixos(ctx, { x: 200, y: 500 }, 18,
    { xMin: -3, xMax: 3, yMin: -2, yMax: 3, passo: 1 }));
  ok(!avisou(r8.avisos, 'se sobrepoem ali'), 'e a 18 pt por unidade ela fica quieta');
  medido('as duas medidas: 11.50 pt por passo contra o piso de ' +
    (4.5 + 3 * 0.58 * 7.5).toFixed(2) + ' pt, e 18.00 pt por passo contra o mesmo piso');

  /* O EMPILHAMENTO no eixo y, que e outra conta e nao a mesma. O que separa dois
   * numeros do eixo y e a ALTURA impressa da caixa, 2 vezes 0,58 do corpo, ou
   * 8,70 pt no corpo padrao de 7,5. Enquanto so a largura do x era conferida
   * havia uma faixa cega: de 7,37 pt por passo (a largura do numero de um digito,
   * abaixo disso a conta do x acusa) ate 8,70 pt, a escala do y saia com os
   * digitos colados e nada dizia nada. O plano de PRIMEIRO QUADRANTE e onde isso
   * doi, porque ali a trava do canto do terceiro quadrante nao e armada: nao ha
   * canto nenhum para ela guardar. */
  const alturaNumero = D.caixaDoRotulo('1', { tam: 7.5 }).altura;
  const larguraNumero = D.caixaDoRotulo('8', { tam: 7.5 }).largura;
  const r7b = rascunho((ctx) => D.eixos(ctx, { x: 200, y: 500 }, 8,
    { xMin: 0, xMax: 5, yMin: 0, yMax: 5, passo: 1 }));
  medido('primeiro quadrante a 8,00 pt por passo: caixa do numero ' +
    larguraNumero.toFixed(2) + ' pt de largura por ' + alturaNumero.toFixed(2) +
    ' pt de altura, ou seja ' + (alturaNumero - 8).toFixed(2) + ' pt de sobreposicao no y');
  ok(avisou(r7b.avisos, 'se empilham'),
    'a 8,00 pt por passo a escala do y avisa que os numeros se empilham');
  ok(!avisou(r7b.avisos, 'encavalam'),
    'e a conta da largura do x fica quieta ali, que e por isso que a faixa era cega');
  const r7c = rascunho((ctx) => D.eixos(ctx, { x: 200, y: 500 }, 8.75,
    { xMin: 0, xMax: 5, yMin: 0, yMax: 5, passo: 1 }));
  ok(!avisou(r7c.avisos, 'se empilham'),
    'e a 8,75 pt por passo, um fio acima da altura da caixa, ela fica quieta');
  /* A borda de baixo da faixa cega, pelo outro lado: com passo maior do que a
   * altura da caixa nada e dito, com passo menor a conta do y acusa, e as duas
   * bordas sao numero medido e nao chute. */
  let primeiroQueAvisa = null;
  for (let uu = 8.80; uu >= 7.20; uu -= 0.05) {
    const q = rascunho((ctx) => D.eixos(ctx, { x: 200, y: 500 }, uu,
      { xMin: 0, xMax: 5, yMin: 0, yMax: 5, passo: 1 }));
    if (avisou(q.avisos, 'se empilham')) { primeiroQueAvisa = uu; break; }
  }
  medido('varrendo de 8,80 pt para baixo, a primeira unidade que acusa empilhamento e ' +
    (primeiroQueAvisa === null ? 'nenhuma' : primeiroQueAvisa.toFixed(2) + ' pt'));
  ok(primeiroQueAvisa !== null && Math.abs(primeiroQueAvisa - alturaNumero) < 0.06,
    'e o limiar medido e a propria altura da caixa impressa, nao um numero escolhido a mao');

  /* Por que a trava do CANTO continua pedindo os dois minimos negativos, e nao
   * virou uma terceira rede para todo mundo: o piso dela e 17,55 pt por passo,
   * mais que o dobro da altura da caixa. Cobrado de um plano de primeiro
   * quadrante, ele reprovaria folha que mede limpa. O vao abaixo e medido entre
   * as caixas IMPRESSAS, que e o que a folha mostra, e nao entre as intencoes. */
  function menorVaoDoPlano(u, xMin, yMin) {
    const d = new PDFGen.Doc();
    d.novaPagina();
    const reg = B.figura(d, { x: 60, largura: 260, altura: 200, folga: 12 }, (ctx) => {
      ctx.fundo(() => D.eixos(ctx, { x: ctx.caixa.x + 60, y: ctx.caixa.y + 60 }, u,
        { xMin: xMin, xMax: 5, yMin: yMin, yMax: 5, passo: 1 }));
    });
    const cxs = (reg.medido.textos || []).map((t) => {
      const c = D.caixaDoRotulo(t.txt, { tam: t.tam, bold: t.bold });
      return {
        txt: t.txt, l: c.largura, h: c.altura,
        x0: t.x - (c.largura - (t.largura || 0)) / 2,
        y0: t.y - (c.altura - t.tam * 0.717) / 2
      };
    });
    let vao = Infinity, par = '';
    for (let i = 0; i < cxs.length; i++) {
      for (let j = i + 1; j < cxs.length; j++) {
        const a = cxs[i], b = cxs[j];
        const gx = Math.max(0, Math.max(a.x0, b.x0) - Math.min(a.x0 + a.l, b.x0 + b.l));
        const gy = Math.max(0, Math.max(a.y0, b.y0) - Math.min(a.y0 + a.h, b.y0 + b.h));
        const v = Math.sqrt(gx * gx + gy * gy);
        if (v < vao) { vao = v; par = a.txt + ' e ' + b.txt; }
      }
    }
    return { vao: vao, par: par, avisos: (d.avisosFigura || []).length };
  }
  for (const uu of [8, 12, 17]) {
    const q = menorVaoDoPlano(uu, 0, 0);
    medido('primeiro quadrante a ' + uu.toFixed(2) + ' pt por passo: menor vao entre caixas ' +
      'impressas ' + q.vao.toFixed(2) + ' pt (' + q.par + '), avisos ' + q.avisos);
  }
  const cantoReal = menorVaoDoPlano(17, -2, -2);
  medido('o mesmo plano COM terceiro quadrante a 17,00 pt por passo: menor vao ' +
    cantoReal.vao.toFixed(2) + ' pt (' + cantoReal.par + '), avisos ' + cantoReal.avisos +
    ': ali o canto existe mesmo e a trava dele e que acusa');

  const r9 = rascunho((ctx) => D.eixos(ctx, { x: 200, y: 500 }, 18,
    { xMin: -2, xMax: 2, yMin: -1, yMax: 2, passo: 0.5 }));
  ok(avisou(r9.avisos, 'separador decimal e decisao de lingua'),
    'tique fracionario sem op.formatar avisa: virgula ou ponto e decisao de lingua');
  const r10 = rascunho((ctx) => D.eixos(ctx, { x: 200, y: 500 }, 18,
    { xMin: -2, xMax: 2, yMin: -1, yMax: 2, passo: 0.5, formatar: (v) => String(v).replace('.', ',') }));
  ok(!avisou(r10.avisos, 'separador decimal e decisao de lingua'),
    'e com op.formatar vindo do tema ela fica quieta');
}

/* ============================================================ o halo branco
 *
 * Duas medicoes no fluxo, as duas vindas da folha impressa do MAT08-13.
 *
 * A primeira e a cota do resto no pi desenrolado (material p1 e ingles p1). O
 * halo do rotulo "0.14·d" tem 26,83 pt de largura para cotar um vao de 12,79 pt
 * entre as pontas de seta, e como ele e branco chapado e sai por ULTIMO, ele
 * apagava as duas cabecas e o miolo da linha. Sobrava na folha um "- 0.14·d -"
 * solto no ar entre dois toquinhos de 3,52 pt, sem seta e sem ligacao com nada,
 * na pagina que ensina que o contorno e um pouco MAIOR que tres diametros.
 *
 * A segunda e o rotulo "2" do alvo (material p7 e lista p4). O halo abria uma
 * caixa branca de 7,93 por 9,86 pt dentro do disco central, que sai em #8B94A1
 * cheio, com o canto a 1,25 pt do eixo da circunferencia de raio 2.
 *
 * As duas sao medidas no que vai sair impresso, e nao no que a funcao disse que
 * ia desenhar: o retangulo do halo e lido do proprio fluxo de conteudo, com a
 * tinta que estava ligada na hora de pinta-lo. */
console.log('');
console.log('o halo branco: contra as pontas da cota e dentro de regiao pintada');

/* Todo retangulo cheio do fluxo, com a tinta com que foi pintado. O halo sai num
 * op so ("r g b rg x y w h re f"), entao a tinta e lida da mesma linha. */
function retangulosCheios(pagina) {
  const saida = [];
  pagina.ops.forEach(function (linha) {
    const s = String(linha);
    const m = s.match(/(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+rg\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+re\s+f/);
    if (!m) return;
    saida.push({
      cor: [+m[1], +m[2], +m[3]],
      x0: +m[4], y0: +m[5], x1: +m[4] + +m[6], y1: +m[5] + +m[7]
    });
  });
  return saida;
}
/* Segmento contra retangulo reto, por corte de faixas. */
function cruza(ax, ay, bx, by, r) {
  let t0 = 0, t1 = 1;
  const p = [-(bx - ax), bx - ax, -(by - ay), by - ay];
  const q = [ax - r.x0, r.x1 - ax, ay - r.y0, r.y1 - ay];
  for (let i = 0; i < 4; i++) {
    if (Math.abs(p[i]) < 1e-9) { if (q[i] < 0) return false; continue; }
    const s = q[i] / p[i];
    if (p[i] < 0) { if (s > t1) return false; if (s > t0) t0 = s; }
    else { if (s < t0) return false; if (s < t1) t1 = s; }
  }
  return true;
}

{
  const t = new PDFGen.Doc(); t.novaPagina();
  const TXT = '0.14·d', TAM = 8.5, VAO = 12.79, AFAST = 14;
  const P = { x: 200, y: 400 }, Q = { x: 200 + VAO, y: 400 };
  D.cota(t, P, Q, TXT, { afastamento: AFAST, lado: 1, tam: TAM });

  /* A linha de cota e o vao que ela mede: as duas pontas de seta ficam nos
   * extremos deste segmento, apontando para dentro. */
  const a0 = { x: P.x, y: P.y + AFAST }, a1 = { x: Q.x, y: Q.y + AFAST };
  const larguraHalo = PDFGen.medir(TXT, TAM, false) + 2 * 1.6;
  const halos = retangulosCheios(t.paginas[0])
    .filter(function (r) { return Math.abs((r.x1 - r.x0) - larguraHalo) < 0.6; });

  ok(halos.length === 1, 'a cota curta pinta um halo so, de ' + larguraHalo.toFixed(2) + ' pt',
    'achados: ' + halos.length);
  const h = halos[0];
  medido('vao entre as pontas: ' + VAO.toFixed(2) + ' pt   halo: ' + larguraHalo.toFixed(2) + ' pt');
  if (h) {
    medido('halo em x de ' + h.x0.toFixed(2) + ' a ' + h.x1.toFixed(2) +
      ', y de ' + h.y0.toFixed(2) + ' a ' + h.y1.toFixed(2) +
      '   linha de cota em y = ' + a0.y.toFixed(2));
    ok(!cruza(a0.x, a0.y, a1.x, a1.y, h),
      'o halo do numero nao toca a linha de cota nem as duas pontas de seta',
      'folga do halo ate a linha: ' + (h.y0 - a0.y).toFixed(2) + ' pt');
    /* As linhas de chamada passam 2,5 pt da linha de cota: o halo tem que ficar
     * acima disso tambem, senao ele come o andaime de que acabou de sair. */
    ok(h.y0 > a0.y + 2.5,
      'e fica acima das pontas das duas linhas de chamada, que sobram 2,5 pt',
      'borda de baixo do halo a ' + (h.y0 - a0.y).toFixed(2) + ' pt da linha');
  }
}

{
  const t = new PDFGen.Doc(); t.novaPagina();
  const C = { x: 300, y: 400 }, R = 26;
  const TINTA = [0.545098, 0.580392, 0.631373];      // #8B94A1, o cinza de area
  D.arco(t, C, R, R, 0, 360, { preenche: TINTA, espessura: 1.2 });
  D.rotulo(t, '2', C, { tam: 8.5 });

  const cheios = retangulosCheios(t.paginas[0]);
  const halo = cheios[cheios.length - 1];
  ok(!!halo, 'o rotulo dentro do disco pintado desenha o halo dele');
  if (halo) {
    const dist = Math.min(
      Math.hypot(halo.x0 - C.x, halo.y0 - C.y), Math.hypot(halo.x1 - C.x, halo.y0 - C.y),
      Math.hypot(halo.x0 - C.x, halo.y1 - C.y), Math.hypot(halo.x1 - C.x, halo.y1 - C.y));
    medido('halo de ' + (halo.x1 - halo.x0).toFixed(2) + ' por ' + (halo.y1 - halo.y0).toFixed(2) +
      ' pt, canto mais longe a ' + (R - dist).toFixed(2) + ' pt do contorno de raio ' + R);
    const branco = halo.cor[0] > 0.99 && halo.cor[1] > 0.99 && halo.cor[2] > 0.99;
    ok(!branco, 'o halo dentro da regiao pintada NAO sai branco, que abriria um buraco nela',
      'tinta do halo: ' + halo.cor.join(' '));
    ok(Math.abs(halo.cor[0] - TINTA[0]) < 1e-4 && Math.abs(halo.cor[1] - TINTA[1]) < 1e-4 &&
       Math.abs(halo.cor[2] - TINTA[2]) < 1e-4,
      'ele sai na tinta da propria regiao, entao some de vista e continua protegendo o numero',
      'tinta do halo: ' + halo.cor.join(' '));
    ok(D.contrasteEntre(PDFGen.COR.texto, TINTA) >= 4.5,
      'e o numero continua legivel sobre essa tinta, pelos 4,5:1 da WCAG para texto',
      D.contrasteEntre(PDFGen.COR.texto, TINTA).toFixed(2) + ':1');
  }

  /* Fora de regiao pintada nada muda: o halo continua branco, byte por byte. */
  const t2 = new PDFGen.Doc(); t2.novaPagina();
  D.rotulo(t2, '2', { x: 300, y: 400 }, { tam: 8.5 });
  const soltos = retangulosCheios(t2.paginas[0]);
  ok(soltos.length === 1 && soltos[0].cor[0] === 1 && soltos[0].cor[1] === 1 && soltos[0].cor[2] === 1,
    'sobre papel branco o halo continua branco, sem regra nova nenhuma',
    soltos.length ? 'tinta: ' + soltos[0].cor.join(' ') : 'nenhum halo');
}

console.log('');
console.log('achados que NAO sao deste arquivo (o conferirFigura mora no base.js)');
{
  /* 1. Uma letra minuscula sozinha e lida como expressao linear. */
  const comoExpressao = ['r', 'd', 'a', 'b', 'c', 'p', 'x', 'y']
    .filter((s) => B.expressaoLinear(s) !== null);
  medido('lidas como valor de angulo: ' + comoExpressao.join(' ') +
    ' (sao ' + comoExpressao.length + ' das 8 letras que a notacao das conicas e do circulo usa)');
  medido('efeito: toda figura vinda de RECEITA que escreva r, d, a, b, c, p, x ou y ' +
    'e reprovada por "valor de angulo solto na figura, sem arco"');

  /* 2. A distancia entre dois arcos e medida entre as AMOSTRAS de Bezier. */
  const passo1 = 2 * 36.8 * Math.sin(2.5 * Math.PI / 180);
  const passo2 = 2 * 36.8 * Math.sin(7.5 * Math.PI / 180);
  medido('arco destacado sobre a propria circunferencia, raio 36,80 pt nos dois, vao real 0,00 pt:');
  medido('  arco de 60 graus a partir de 20:  a trava mede ' + passo1.toFixed(2) + ' pt e REPROVA (piso 6)');
  medido('  arco de 80 graus a partir de 30:  a trava mede ' + passo2.toFixed(2) + ' pt e aprova');
  medido('  ou seja o veredito sai de onde caiu a ancora do Bezier, e nao do vao entre os arcos');
}

console.log('');
console.log('estado grafico: nenhum tracejado nem recorte ligado fora de envelope');

function conferirEstado() {
  const problemas = [];
  for (let i = 0; i < doc.paginas.length; i++) {
    let prof = 0;
    const ops = doc.paginas[i].ops;
    for (let j = 0; j < ops.length; j++) {
      const s = ops[j];
      if (s.indexOf('BT ') === 0) continue;
      const toks = s.split(/\s+/);
      for (let t = 0; t < toks.length; t++) {
        const k = toks[t];
        if (k === 'q') prof++;
        else if (k === 'Q') {
          prof--;
          if (prof < 0) { problemas.push('pagina ' + (i + 1) + ': Q sem q'); prof = 0; }
        } else if (k === 'd' && prof === 0) {
          problemas.push('pagina ' + (i + 1) + ': tracejado ligado fora de envelope');
        } else if ((k === 'W' || k === 'W*') && prof === 0) {
          problemas.push('pagina ' + (i + 1) + ': recorte ligado fora de envelope');
        }
      }
    }
    if (prof !== 0) problemas.push('pagina ' + (i + 1) + ': ' + prof + ' q sem Q no fim da folha');
  }
  return problemas;
}
const vazamentos = conferirEstado();
ok(vazamentos.length === 0, 'todo q tem o seu Q e nenhum estado vaza', vazamentos.join(' | '));

const avisos = doc.avisosFigura || [];
console.log('');
console.log('avisos das primitivas: ' + avisos.length);
for (const a of avisos) console.log('  . ' + a);
ok(avisos.length === 0, 'nenhuma primitiva reclamou');

console.log('');
console.log('o que o conferirFigura acha de cada cartao (figura montada a mao nao reprova tema)');
for (const c of conferencias) {
  if (!c.falhas.length) { console.log('  limpo   ' + c.nome); continue; }
  for (const f of c.falhas) console.log('  acusa   ' + c.nome + ': ' + f);
}

console.log('');
console.log(passou + ' conferencias passaram, ' + falhou + ' falharam.');
console.log('paginas: ' + doc.paginas.length + '   figuras: ' + (doc.figurasDesenhadas || []).length);
console.log(saida);
