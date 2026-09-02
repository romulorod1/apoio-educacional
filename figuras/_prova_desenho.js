/* figuras/_prova_desenho.js
 * Gera o _prova_desenho.pdf: uma pagina por funcao do nucleo de desenho, com os
 * casos normais e os casos dificeis lado a lado.
 *
 * Os casos dificeis nao sao enfeite. Cada um deles e um jeito conhecido de a
 * figura sair errada em silencio: triangulo obtuso (a letra cai dentro),
 * poligono girado (a letra cai em cima de um lado), angulo de 5 graus (o numero
 * encosta nos dois lados), angulo de 175 graus (o numero fica longe demais do
 * vertice), vertice apertado (duas letras se encostam) e regiao com furo (a
 * hachura vaza para dentro do buraco).
 *
 * A hachura deste arquivo NAO e a primitiva: hachurar() e da etapa das marcas e
 * de outro dono. O que esta aqui e o minimo para provar que o poligono com furo
 * e o arco entregam a ela o caminho de recorte de que ela precisa.
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

/* Duas figuras lado a lado na mesma faixa. O doc.y anda com a primeira, entao
 * ele volta ao topo da faixa antes da segunda e desce para a mais baixa das
 * duas. E a mesma mecanica que a especificacao pede para duas diretivas
 * seguidas no mesmo exercicio. */
function faixa(esq, dir) {
  const y0 = doc.y;
  esq(MARG_E, LARG);
  const y1 = doc.y;
  doc.y = y0;
  if (dir) dir(MARG_E + LARG + 16, LARG);
  doc.y = Math.min(y1, doc.y);
}

function cartao(x, largura, titulo, altura, unidades, desenhar) {
  doc.texto(titulo, x, doc.y, { tam: 7.5, bold: true, cor: COR.navy });
  doc.y -= 9;
  return B.figura(doc, {
    x: x, largura: largura, altura: altura, folga: 20, unidades: unidades, antes: 2, depois: 10
  }, desenhar);
}

/* Hachura de prova. A regiao entra como caminho de recorte (o base.js emite
 * W* n, regra par e impar, entao o furo fica de fora sem nenhuma conta de
 * intersecao) e a caixa envolvente e varrida por paralelas. */
function hachuraDeProva(doc, partes, angulo, espacamento) {
  const todos = [];
  for (let i = 0; i < partes.length; i++) for (let j = 0; j < partes[i].length; j++) todos.push(partes[i][j]);
  const cx = geo.caixa(todos);
  const diag = Math.sqrt(cx.largura * cx.largura + cx.altura * cx.altura) / 2 + 4;
  const u = { x: Math.cos(angulo * Math.PI / 180), y: Math.sin(angulo * Math.PI / 180) };
  const n = { x: -u.y, y: u.x };
  B.comEstado(doc, { recorte: partes, cor: COR.muted, espessura: 0.4 }, function () {
    let s = '0.40 w ';
    for (let t = -diag; t <= diag; t += espacamento) {
      const bx = cx.cx + n.x * t, by = cx.cy + n.y * t;
      s += (bx - u.x * diag).toFixed(2) + ' ' + (by - u.y * diag).toFixed(2) + ' m ' +
        (bx + u.x * diag).toFixed(2) + ' ' + (by + u.y * diag).toFixed(2) + ' l S ';
    }
    doc.op(s);
  });
}

/* ============================================================ 1. poligono */

pagina('poligono', 'caminho unico com m, l, h e um operador de fim, com furo por regra par e impar');

faixa(
  (x, L) => cartao(x, L, 'quadrado com contorno em 1,2 pt', 108, [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx) => {
    const q = ctx.pontos([{ x: 1, y: 1 }, { x: 9, y: 1 }, { x: 9, y: 9 }, { x: 1, y: 9 }]);
    ctx.contorno(() => D.poligono(ctx, q, { espessura: 1.2 }));
  }),
  (x, L) => cartao(x, L, 'o mesmo com quatro doc.linha: entalhe no canto', 108, [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx) => {
    const q = ctx.pontos([{ x: 1, y: 1 }, { x: 9, y: 1 }, { x: 9, y: 9 }, { x: 1, y: 9 }]);
    ctx.contorno(() => {
      for (let i = 0; i < 4; i++) {
        const A = q[i], C = q[(i + 1) % 4];
        doc.linha(A.x, A.y, C.x, C.y, COR.texto, 1.2);
      }
    });
  })
);

faixa(
  (x, L) => cartao(x, L, 'pentagono regular, posicao prototipica', 108, geo.poligonoRegular({ x: 0, y: 0 }, 5, 5, 0), (ctx) => {
    const p = ctx.pontos(geo.poligonoRegular({ x: 0, y: 0 }, 5, 5, 0));
    ctx.contorno(() => D.poligono(ctx, p, {}));
  }),
  (x, L) => cartao(x, L, 'hexagono girado 20 graus: mesma primitiva', 108, geo.poligonoRegular({ x: 0, y: 0 }, 5, 6, 20), (ctx) => {
    const p = ctx.pontos(geo.poligonoRegular({ x: 0, y: 0 }, 5, 6, 20));
    ctx.contorno(() => D.poligono(ctx, p, {}));
  })
);

faixa(
  (x, L) => cartao(x, L, 'moldura: furo quadrado, preenchimento par e impar', 108, [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx) => {
    const fora = ctx.pontos([{ x: 0.5, y: 0.5 }, { x: 9.5, y: 0.5 }, { x: 9.5, y: 9.5 }, { x: 0.5, y: 9.5 }]);
    const dentro = ctx.pontos([{ x: 3, y: 3 }, { x: 7, y: 3 }, { x: 7, y: 7 }, { x: 3, y: 7 }]);
    ctx.preenchimento(() => D.poligono(ctx, fora, { furos: [dentro], preenche: D.CINZA_AREA, contorno: false }));
    ctx.contorno(() => { D.poligono(ctx, fora, {}); D.poligono(ctx, dentro, {}); });
  }),
  (x, L) => cartao(x, L, 'furo redondo: o furo vem do arcoPontos', 108, [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx) => {
    const fora = ctx.pontos([{ x: 0.5, y: 0.5 }, { x: 9.5, y: 0.5 }, { x: 9.5, y: 9.5 }, { x: 0.5, y: 9.5 }]);
    const C = ctx.p({ x: 5, y: 5 }), r = 3 * ctx.k;
    const dentro = D.arcoPontos(C, r, r, 0, 360, { passo: 6 });
    ctx.preenchimento(() => D.poligono(ctx, fora, { furos: [dentro], preenche: D.CINZA_AREA, contorno: false }));
    ctx.contorno(() => { D.poligono(ctx, fora, {}); D.arco(ctx, C, r, r, 0, 360, {}); });
  })
);

faixa(
  (x, L) => cartao(x, L, 'poligonal aberta, tracejado auxiliar', 108, [{ x: 0, y: 0 }, { x: 10, y: 8 }], (ctx) => {
    const p = ctx.pontos([{ x: 1, y: 1 }, { x: 3, y: 6 }, { x: 6, y: 2 }, { x: 9, y: 7 }]);
    ctx.contorno(() => D.poligono(ctx, p, { fechado: false, tracejado: 'auxiliar', espessura: 0.6, cor: COR.teal }));
  }),
  (x, L) => cartao(x, L, 'preenchido e contornado no mesmo caminho (B)', 108, [{ x: 0, y: 0 }, { x: 10, y: 8 }], (ctx) => {
    const p = ctx.pontos([{ x: 1, y: 1 }, { x: 9, y: 1 }, { x: 3.5, y: 7 }]);
    ctx.preenchimento(() => D.poligono(ctx, p, { preenche: D.CINZA_AREA }));
  })
);

/* ============================================================ 2. arco */

pagina('arco', 'Bezier cubica em trechos de ate 90 graus, raios independentes, setor e corda');

faixa(
  (x, L) => cartao(x, L, 'circunferencia em 0,6 pt (o doc.circulo trava em 1,6)', 108, [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx) => {
    const C = ctx.p({ x: 5, y: 5 });
    ctx.contorno(() => D.arco(ctx, C, 4 * ctx.k, null, 0, 360, { espessura: 0.6 }));
  }),
  (x, L) => cartao(x, L, 'elipse: base de solido em perspectiva', 108, [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx) => {
    const C = ctx.p({ x: 5, y: 5 });
    ctx.contorno(() => D.arco(ctx, C, 4 * ctx.k, 1.6 * ctx.k, 0, 360, {}));
  })
);

faixa(
  (x, L) => cartao(x, L, 'base de cilindro: frente cheia, tras tracejada', 108, [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx) => {
    const C = ctx.p({ x: 5, y: 5 }), rx = 4 * ctx.k, ry = 1.5 * ctx.k;
    ctx.contorno(() => {
      D.arco(ctx, C, rx, ry, 180, 360, { espessura: 1.1 });
      D.arco(ctx, C, rx, ry, 0, 180, { espessura: 0.7, cor: COR.muted, tracejado: 'oculta' });
    });
  }),
  (x, L) => cartao(x, L, 'setor de 60 graus, preenchido e contornado', 108, [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx) => {
    const C = ctx.p({ x: 5, y: 5 }), r = 4 * ctx.k;
    ctx.preenchimento(() => D.arco(ctx, C, r, r, 20, 80, { setor: true, preenche: D.CINZA_AREA }));
    ctx.contorno(() => D.arco(ctx, C, r, r, 0, 360, {}));
  })
);

faixa(
  (x, L) => cartao(x, L, 'arco de 5 graus e arco de 355 graus', 108, [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx) => {
    const C = ctx.p({ x: 5, y: 5 }), r = 4 * ctx.k;
    ctx.contorno(() => {
      D.arco(ctx, C, r, r, 0, 355, { espessura: 0.7, cor: COR.muted });
      D.arco(ctx, C, r * 0.72, r * 0.72, 0, 5, { espessura: 1.8, cor: COR.teal });
    });
  }),
  (x, L) => cartao(x, L, 'corda: segmento circular preenchido', 108, [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx) => {
    const C = ctx.p({ x: 5, y: 5 }), r = 4 * ctx.k;
    ctx.preenchimento(() => D.arco(ctx, C, r, r, 200, 340, { corda: true, preenche: D.CINZA_AREA }));
    ctx.contorno(() => D.arco(ctx, C, r, r, 0, 360, {}));
  })
);

faixa(
  (x, L) => cartao(x, L, 'elipse girada 30 graus, sem conta propria', 108, [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx) => {
    const C = ctx.p({ x: 5, y: 5 });
    ctx.contorno(() => D.arco(ctx, C, 4 * ctx.k, 1.8 * ctx.k, 0, 360, { giro: 30 }));
  }),
  (x, L) => cartao(x, L, 'arco destacado sobre a propria circunferencia', 108, [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx) => {
    const C = ctx.p({ x: 5, y: 5 }), r = 4 * ctx.k;
    ctx.contorno(() => D.arco(ctx, C, r, r, 0, 360, { espessura: 1.2 }));
    ctx.marcas(() => D.arco(ctx, C, r, r, 30, 110, { espessura: 2.0, cor: COR.teal, papel: 'marca' }));
    ctx.rotulos(() => D.ponto(ctx, C, { rotulo: 'O', direcao: { x: 0, y: -1 }, raio: 2.2 }));
  })
);

/* ============================================================ 3. rotulo */

pagina('rotulo', 'posicao por vetor da geometria, halo branco, chamada e giro');

const OBTUSO = geo.trianguloPorAngulos(18, 22, 100);

faixa(
  (x, L) => cartao(x, L, 'triangulo obtuso: vertices na bissetriz externa', 118, OBTUSO, (ctx) => {
    const P = ctx.pontos(OBTUSO);
    ctx.contorno(() => D.poligono(ctx, P, {}));
    ctx.rotulos(() => D.rotularVertices(ctx, P, ['A', 'B', 'C']));
  }),
  (x, L) => cartao(x, L, 'o erro: deslocamento fixo de 8 pt em x e y', 118, OBTUSO, (ctx) => {
    const P = ctx.pontos(OBTUSO);
    ctx.contorno(() => D.poligono(ctx, P, {}));
    ctx.rotulos(() => {
      const nomes = ['A', 'B', 'C'];
      for (let i = 0; i < 3; i++) doc.texto(nomes[i], P[i].x + 8, P[i].y + 8, { tam: 8.5, cor: COR.texto });
    });
  })
);

faixa(
  (x, L) => cartao(x, L, 'pentagono girado 25 graus: nenhum caso particular', 118, geo.poligonoRegular({ x: 0, y: 0 }, 5, 5, 25), (ctx) => {
    const pts = geo.poligonoRegular({ x: 0, y: 0 }, 5, 5, 25);
    const P = ctx.pontos(pts);
    ctx.contorno(() => D.poligono(ctx, P, {}));
    ctx.rotulos(() => D.rotularVertices(ctx, P, ['A', 'B', 'C', 'D', 'E']));
  }),
  (x, L) => cartao(x, L, 'medida de lado na normal externa do ponto medio', 118, geo.trianguloPorLados(7, 5, 4), (ctx) => {
    const t = geo.trianguloPorLados(7, 5, 4);
    const P = ctx.pontos(t), C = geo.centroide(P);
    ctx.contorno(() => D.poligono(ctx, P, {}));
    ctx.rotulos(() => {
      D.rotuloLado(ctx, '7 cm', P[1], P[2], { centro: C });
      D.rotuloLado(ctx, '5 cm', P[2], P[0], { centro: C });
      D.rotuloLado(ctx, '4 cm', P[0], P[1], { centro: C });
    });
  })
);

faixa(
  (x, L) => cartao(x, L, 'rotulo girado, acompanhando o lado obliquo', 118, [{ x: 0, y: 0 }, { x: 10, y: 8 }], (ctx) => {
    const A = ctx.p({ x: 1, y: 1 }), C = ctx.p({ x: 9, y: 7 });
    ctx.contorno(() => D.poligono(ctx, [A, C], { fechado: false }));
    ctx.rotulos(() => D.rotuloLado(ctx, 'hipotenusa', A, C, { lado: 1, giro: 'lado', tam: 8 }));
  }),
  (x, L) => cartao(x, L, 'halo branco: a hachura nao corta a letra', 118, [{ x: 0, y: 0 }, { x: 10, y: 8 }], (ctx) => {
    const q = ctx.pontos([{ x: 1, y: 1 }, { x: 9, y: 1 }, { x: 9, y: 7 }, { x: 1, y: 7 }]);
    ctx.hachura(() => hachuraDeProva(doc, [q], 45, 4.5));
    ctx.contorno(() => D.poligono(ctx, q, {}));
    ctx.rotulos(() => D.rotulo(ctx, 'regiao pedida', ctx.p({ x: 5, y: 4 }), { tam: 8 }));
  })
);

faixa(
  (x, L) => cartao(x, L, 'rotulo puxado para dentro do bloco, com chamada', 118, [{ x: 0, y: 0 }, { x: 10, y: 8 }], (ctx) => {
    const P = ctx.pontos([{ x: 0.6, y: 4 }, { x: 5, y: 7.4 }, { x: 9.4, y: 4 }, { x: 5, y: 0.6 }]);
    ctx.contorno(() => D.poligono(ctx, P, {}));
    ctx.rotulos(() => {
      D.rotulo(ctx, 'vertice de cima', P[1], { direcao: { x: 0, y: 1 }, afastamento: 40, tam: 8 });
      D.rotulo(ctx, 'D', P[3], { direcao: { x: 0, y: -1 } });
    });
  }),
  (x, L) => cartao(x, L, 'valor do angulo na bissetriz, por fora do arco', 118, geo.trianguloPorAngulos(52, 61, 100), (ctx) => {
    const t = geo.trianguloPorAngulos(52, 61, 100);
    const P = ctx.pontos(t);
    ctx.contorno(() => D.poligono(ctx, P, {}));
    ctx.marcas(() => {
      for (let i = 0; i < 3; i++) {
        const v = D.varreDoAngulo(P[i], P[(i + 1) % 3], P[(i + 2) % 3]);
        D.arco(doc, P[i], 15, 15, v.de, v.ate, { espessura: 0.9, papel: 'marca' });
      }
    });
    ctx.rotulos(() => {
      const g = ['52°', '61°', '67°'];
      for (let i = 0; i < 3; i++) {
        D.rotuloAngulo(ctx, g[i], P[i], P[(i + 1) % 3], P[(i + 2) % 3], { raioArco: 15 });
      }
    });
  })
);

/* ============================================================ 4. ponto */

pagina('ponto', 'bolinha cheia e vazada, guias de leitura e a letra colada ao ponto');

faixa(
  (x, L) => cartao(x, L, 'centro de circunferencia: ponto cheio com a letra O', 110, [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx) => {
    const C = ctx.p({ x: 5, y: 5 }), r = 3.6 * ctx.k;
    ctx.contorno(() => D.arco(ctx, C, r, r, 0, 360, {}));
    ctx.rotulos(() => D.ponto(ctx, C, { rotulo: 'O', direcao: { x: -0.7, y: -0.7 } }));
  }),
  (x, L) => cartao(x, L, 'extremo que entra e cheio, o que fica de fora e vazado', 110, [{ x: 0, y: 0 }, { x: 10, y: 4 }], (ctx) => {
    const A = ctx.p({ x: 2, y: 2 }), Bp = ctx.p({ x: 8, y: 2 });
    ctx.contorno(() => D.poligono(ctx, [ctx.p({ x: 0.4, y: 2 }), ctx.p({ x: 9.6, y: 2 })], { fechado: false, espessura: 0.9 }));
    ctx.marcas(() => D.poligono(ctx, [A, Bp], { fechado: false, espessura: 2.0, cor: COR.teal, papel: 'marca' }));
    ctx.rotulos(() => {
      D.ponto(ctx, A, { rotulo: '2', direcao: { x: 0, y: -1 } });
      D.ponto(ctx, Bp, { aberto: true, rotulo: '8', direcao: { x: 0, y: -1 } });
    });
  })
);

faixa(
  (x, L) => cartao(x, L, 'guias de leitura do ponto ate os dois eixos', 130, [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx) => {
    const O = ctx.p({ x: 1, y: 1 });
    const P = ctx.p({ x: 6.5, y: 7 });
    ctx.contorno(() => {
      D.seta(ctx, O, ctx.p({ x: 9.6, y: 1 }), { espessura: 0.9 });
      D.seta(ctx, O, ctx.p({ x: 1, y: 9.6 }), { espessura: 0.9 });
    });
    ctx.rotulos(() => {
      D.ponto(ctx, P, { guias: O, rotulo: 'P', direcao: { x: 0.7, y: 0.7 } });
      D.rotulo(ctx, 'x', ctx.p({ x: 9.6, y: 1 }), { direcao: { x: 1, y: 0 }, tam: 8 });
      D.rotulo(ctx, 'y', ctx.p({ x: 1, y: 9.6 }), { direcao: { x: 0, y: 1 }, tam: 8 });
    });
  }),
  (x, L) => cartao(x, L, 'vertices contados, sem letra: anos iniciais', 130, [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx) => {
    const P = ctx.pontos(geo.poligonoRegular({ x: 5, y: 5 }, 4, 5, 0));
    ctx.contorno(() => D.poligono(ctx, P, {}));
    ctx.marcas(() => { for (let i = 0; i < P.length; i++) D.ponto(ctx, P[i], { raio: 2.6, cor: COR.navy }); });
  })
);

/* ============================================================ 5. seta */

pagina('seta', 'a seta diz para onde cresce, e por isso ponta dupla e opcao e nunca padrao');

faixa(
  (x, L) => cartao(x, L, 'eixo: seta so na ponta positiva, nome depois dela', 100, [{ x: 0, y: 0 }, { x: 10, y: 4 }], (ctx) => {
    ctx.contorno(() => D.seta(ctx, ctx.p({ x: 0.5, y: 2 }), ctx.p({ x: 9, y: 2 }), { espessura: 0.9 }));
    ctx.rotulos(() => D.rotulo(ctx, 'x', ctx.p({ x: 9, y: 2 }), { direcao: { x: 1, y: 0 }, tam: 8 }));
  }),
  (x, L) => cartao(x, L, 'reta indefinida (duas pontas) e semirreta (uma)', 100, [{ x: 0, y: 0 }, { x: 10, y: 5 }], (ctx) => {
    ctx.contorno(() => {
      D.seta(ctx, ctx.p({ x: 1, y: 3.6 }), ctx.p({ x: 9, y: 3.6 }), { dupla: true, espessura: 0.9 });
      D.seta(ctx, ctx.p({ x: 1, y: 1.4 }), ctx.p({ x: 9, y: 1.4 }), { espessura: 0.9 });
    });
    ctx.rotulos(() => {
      D.rotulo(ctx, 'reta', ctx.p({ x: 5, y: 3.6 }), { direcao: { x: 0, y: 1 }, tam: 7.5 });
      D.rotulo(ctx, 'semirreta', ctx.p({ x: 5, y: 1.4 }), { direcao: { x: 0, y: -1 }, tam: 7.5 });
    });
  })
);

faixa(
  (x, L) => cartao(x, L, 'prolongamento do lado para o angulo externo', 118, geo.trianguloPorAngulos(58, 47, 100), (ctx) => {
    const t = geo.trianguloPorAngulos(58, 47, 100);
    const P = ctx.pontos(t);
    ctx.contorno(() => D.poligono(ctx, P, {}));
    ctx.marcas(() => {
      const u = D.versor({ x: P[1].x - P[0].x, y: P[1].y - P[0].y });
      D.seta(ctx, P[1], { x: P[1].x + u.x * 34, y: P[1].y + u.y * 34 },
        { espessura: 0.6, cor: COR.teal, tracejado: 'auxiliar', tam: 5.5, papel: 'marca' });
    });
    ctx.rotulos(() => D.rotularVertices(ctx, P, ['A', 'B', 'C']));
  }),
  (x, L) => cartao(x, L, 'cabeca aberta, cabeca curta e seta de paralelismo', 118, [{ x: 0, y: 0 }, { x: 10, y: 8 }], (ctx) => {
    ctx.contorno(() => {
      D.seta(ctx, ctx.p({ x: 1, y: 6.4 }), ctx.p({ x: 9, y: 6.4 }), { preenchida: false, espessura: 0.9 });
      D.seta(ctx, ctx.p({ x: 4.4, y: 4.4 }), ctx.p({ x: 5.6, y: 4.4 }), { espessura: 0.9 });
      D.poligono(ctx, [ctx.p({ x: 1, y: 2.6 }), ctx.p({ x: 9, y: 2.6 })], { fechado: false });
      D.poligono(ctx, [ctx.p({ x: 1, y: 1 }), ctx.p({ x: 9, y: 1 })], { fechado: false });
    });
    ctx.marcas(() => {
      D.seta(ctx, ctx.p({ x: 4.6, y: 2.6 }), ctx.p({ x: 5.6, y: 2.6 }), { espessura: 0.9, tam: 5, papel: 'marca' });
      D.seta(ctx, ctx.p({ x: 4.6, y: 1 }), ctx.p({ x: 5.6, y: 1 }), { espessura: 0.9, tam: 5, papel: 'marca' });
    });
  })
);

faixa(
  (x, L) => cartao(x, L, 'sentido de giro: arco com ponta na chegada', 118, [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx) => {
    const C = ctx.p({ x: 5, y: 5 }), r = 3.4 * ctx.k;
    ctx.contorno(() => D.arco(ctx, C, r, r, 200, 480, { espessura: 0.9, cor: COR.teal }));
    ctx.marcas(() => {
      const a = 480 * Math.PI / 180;
      const fim = { x: C.x + r * Math.cos(a), y: C.y + r * Math.sin(a) };
      const tg = { x: -Math.sin(a), y: Math.cos(a) };
      D.seta(ctx, { x: fim.x - tg.x * 6, y: fim.y - tg.y * 6 }, fim,
        { cor: COR.teal, espessura: 0.9, tam: 6, papel: 'marca' });
    });
    ctx.rotulos(() => D.rotulo(ctx, 'anti-horario', C, { tam: 8 }));
  }),
  null
);

/* ============================================================ 6. cota */

pagina('cota', 'medida por fora, texto sempre na horizontal, chave para os anos iniciais');

faixa(
  (x, L) => cartao(x, L, 'cota de lado, com linhas de chamada', 118, [{ x: 0, y: 0 }, { x: 10, y: 8 }], (ctx) => {
    const q = ctx.pontos([{ x: 1, y: 2.5 }, { x: 9, y: 2.5 }, { x: 9, y: 6.5 }, { x: 1, y: 6.5 }]);
    ctx.contorno(() => D.poligono(ctx, q, {}));
    ctx.marcas(() => {
      D.cota(ctx, q[0], q[1], '12 cm', { fora: geo.centroide(q) });
      D.cota(ctx, q[1], q[2], '6 cm', { fora: geo.centroide(q) });
    });
  }),
  (x, L) => cartao(x, L, 'cota obliqua: o numero continua na horizontal', 118, [{ x: 0, y: 0 }, { x: 10, y: 8 }], (ctx) => {
    const t = ctx.pontos([{ x: 1.2, y: 1.4 }, { x: 8.6, y: 1.4 }, { x: 8.6, y: 6.2 }]);
    ctx.contorno(() => D.poligono(ctx, t, {}));
    ctx.marcas(() => D.cota(ctx, t[2], t[0], '10 m', { fora: geo.centroide(t), afastamento: 13 }));
  })
);

faixa(
  (x, L) => cartao(x, L, 'chave: agrupamento de partes', 118, [{ x: 0, y: 0 }, { x: 10, y: 8 }], (ctx) => {
    const y0 = 3.2, y1 = 5.4;
    const barras = [[0.8, 4.2], [4.2, 6.4], [6.4, 9.2]];
    ctx.contorno(() => {
      for (let i = 0; i < barras.length; i++) {
        D.poligono(ctx, ctx.pontos([
          { x: barras[i][0], y: y0 }, { x: barras[i][1], y: y0 },
          { x: barras[i][1], y: y1 }, { x: barras[i][0], y: y1 }
        ]), {});
      }
    });
    ctx.marcas(() => D.cota(ctx, ctx.p({ x: 0.8, y: y0 }), ctx.p({ x: 9.2, y: y0 }), 'o todo',
      { estilo: 'chave', lado: -1, afastamento: 10 }));
  }),
  (x, L) => cartao(x, L, 'vao curto: as pontas viram para fora', 118, [{ x: 0, y: 0 }, { x: 10, y: 8 }], (ctx) => {
    const q = ctx.pontos([{ x: 3.6, y: 2 }, { x: 6.4, y: 2 }, { x: 6.4, y: 6 }, { x: 3.6, y: 6 }]);
    ctx.contorno(() => D.poligono(ctx, q, {}));
    ctx.marcas(() => {
      D.cota(ctx, q[0], q[1], '2,8 cm', { fora: geo.centroide(q), afastamento: 12 });
      D.cota(ctx, q[1], q[2], '4 cm', { fora: geo.centroide(q), afastamento: 12 });
    });
  })
);

/* ============================================================ 7. casos dificeis */

pagina('casos dificeis', 'cada um destes e um jeito conhecido de a figura sair errada em silencio');

faixa(
  (x, L) => cartao(x, L, 'angulo de 5 graus: o valor sai por fora, com fio', 120, geo.trianguloPorAngulos(5, 40, 100), (ctx) => {
    const t = geo.trianguloPorAngulos(5, 40, 100);
    const P = ctx.pontos(t);
    ctx.contorno(() => D.poligono(ctx, P, {}));
    ctx.marcas(() => {
      const v = D.varreDoAngulo(P[0], P[1], P[2]);
      D.arco(doc, P[0], 13, 13, v.de, v.ate, { espessura: 0.9, papel: 'marca' });
    });
    ctx.rotulos(() => D.rotuloAngulo(ctx, '5°', P[0], P[1], P[2], { raioArco: 13 }));
  }),
  (x, L) => cartao(x, L, 'angulo de 175 graus: o valor cabe na cunha', 120, [{ x: 0, y: 0 }, { x: 10, y: 5 }], (ctx) => {
    const V = ctx.p({ x: 5, y: 2 }), A = ctx.p({ x: 0.6, y: 2 }), C = ctx.p({ x: 9.4, y: 2.38 });
    ctx.contorno(() => { D.poligono(ctx, [A, V], { fechado: false }); D.poligono(ctx, [V, C], { fechado: false }); });
    /* O varre com sinal e o que impede o arco de sair pelo lado de baixo, que e
     * onde ele saiu na primeira tirada desta folha: a figura ficava bonita e
     * marcava o angulo de 185 graus em vez do de 175. */
    ctx.marcas(() => {
      const v = D.varreDoAngulo(V, A, C);
      D.arco(doc, V, 14, 14, v.de, v.ate, { espessura: 0.9, papel: 'marca' });
    });
    ctx.rotulos(() => D.rotuloAngulo(ctx, '175°', V, A, C, { raioArco: 14 }));
  })
);

faixa(
  (x, L) => cartao(x, L, 'vertice apertado: as duas letras nao se encostam', 120, geo.trianguloPorLados(100, 51, 51), (ctx) => {
    const t = geo.trianguloPorLados(100, 51, 51);
    const P = ctx.pontos(t);
    ctx.contorno(() => D.poligono(ctx, P, {}));
    ctx.rotulos(() => D.rotularVertices(ctx, P, ['A', 'B', 'C']));
  }),
  (x, L) => cartao(x, L, 'triangulo bem obtuso: medida na normal do lado', 120, geo.trianguloPorLados(100, 52, 50), (ctx) => {
    const t = geo.trianguloPorLados(100, 52, 50);
    const P = ctx.pontos(t), C = geo.centroide(P);
    ctx.contorno(() => D.poligono(ctx, P, {}));
    ctx.rotulos(() => {
      D.rotuloLado(ctx, '100', P[1], P[2], { centro: C, tam: 8 });
      D.rotuloLado(ctx, '52', P[2], P[0], { centro: C, tam: 8 });
      D.rotuloLado(ctx, '50', P[0], P[1], { centro: C, tam: 8 });
    });
  })
);

faixa(
  (x, L) => cartao(x, L, 'hachura em regiao com furo: o buraco fica limpo', 128, [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx) => {
    const fora = ctx.pontos([{ x: 0.6, y: 0.6 }, { x: 9.4, y: 0.6 }, { x: 9.4, y: 9.4 }, { x: 0.6, y: 9.4 }]);
    const C = ctx.p({ x: 5, y: 5 }), r = 2.8 * ctx.k;
    const furo = D.arcoPontos(C, r, r, 0, 360, { passo: 6 });
    ctx.hachura(() => hachuraDeProva(doc, [fora, furo], 30, 5));
    ctx.contorno(() => { D.poligono(ctx, fora, {}); D.arco(ctx, C, r, r, 0, 360, {}); });
    ctx.rotulos(() => D.rotulo(ctx, 'regiao hachurada', ctx.p({ x: 5, y: 2.1 }), { tam: 7.5 }));
  }),
  (x, L) => cartao(x, L, 'coroa circular: os dois contornos vem do arco', 128, [{ x: 0, y: 0 }, { x: 10, y: 10 }], (ctx) => {
    const C = ctx.p({ x: 5, y: 5 }), R = 4.2 * ctx.k, r = 2.2 * ctx.k;
    const fora = D.arcoPontos(C, R, R, 0, 360, { passo: 6 });
    const dentro = D.arcoPontos(C, r, r, 0, 360, { passo: 6 });
    ctx.hachura(() => hachuraDeProva(doc, [fora, dentro], 60, 5));
    ctx.contorno(() => { D.arco(ctx, C, R, R, 0, 360, {}); D.arco(ctx, C, r, r, 0, 360, {}); });
    ctx.marcas(() => D.cota(ctx, C, { x: C.x + R, y: C.y }, 'R', { afastamento: 0, estilo: 'seta', lado: 1 }));
  })
);

/* ------------------------------------------------------------ saida */

const saida = path.join(__dirname, '_prova_desenho.pdf');
fs.writeFileSync(saida, Buffer.from(doc.finalizar()));

/* A folha nao prova sozinha o que mais importa: tracejado e recorte sao estado
 * global e um esquecimento aparece TRES paginas adiante, longe de onde foi
 * cometido, e num tamanho que o olho perde numa miniatura. Entao o fluxo de
 * conteudo e lido operador a operador: nenhum "d" e nenhum "W" pode acontecer em
 * profundidade zero, e cada q precisa do seu Q na mesma pagina. A conferencia e
 * feita DEPOIS do finalizar, que e quando a moldura ja foi concatenada, para o
 * fio do rodape entrar no teste. */
function conferirEstado() {
  const problemas = [];
  for (let i = 0; i < doc.paginas.length; i++) {
    let prof = 0;
    const ops = doc.paginas[i].ops;
    for (let j = 0; j < ops.length; j++) {
      const s = ops[j];
      if (s.indexOf('BT ') === 0) continue;    // texto: o conteudo entre parenteses nao e operador
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

const avisos = doc.avisosFigura || [];
const vazamentos = conferirEstado();
console.log('paginas: ' + doc.paginas.length);
console.log('figuras: ' + (doc.figurasDesenhadas || []).length);
console.log('avisos: ' + avisos.length);
for (let i = 0; i < avisos.length; i++) console.log('  ' + avisos[i]);
console.log('vazamentos de estado: ' + vazamentos.length);
for (let i = 0; i < vazamentos.length; i++) console.log('  ' + vazamentos[i]);
console.log(saida);
