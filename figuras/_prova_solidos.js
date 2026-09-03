/* figuras/_prova_solidos.js
 * Gera o _prova_solidos.pdf e MEDE o que ele desenhou.
 *
 * Um cartao por solido (prisma, cilindro, piramide, cone, esfera) e um por
 * composicao (painel dos cinco, cone com triangulo, piramide com triangulo,
 * cilindro com esfera inscrita, prisma triangular cotado, semicirculo que vira
 * cone). A folha sozinha nao prova nada: o que prova e a medicao no FLUXO DE
 * CONTEUDO, que e o que vai sair impresso, e nao no que a funcao disse que ia
 * desenhar:
 *
 *   fuga        a aresta de profundidade sai a 45 graus e com metade do
 *               comprimento da aresta frontal, medido nos operadores m e l.
 *   ocultas     toda aresta que a funcao declarou oculta tem, no fluxo, o
 *               padrao [2 2] e 0,60 w; toda visivel tem [] e 1,20 w.
 *   elipse      as ancoras da Bezier de cada base dao b/a = 0,4 exato.
 *   esfera      a circunferencia da esfera inscrita toca o centro das duas
 *               bases e a silhueta lateral, distancia medida.
 *   quadradinho o vertice do angulo reto do registro E do fluxo cai no pe da
 *               altura, com os dois lados iguais.
 *   teto        marcas ativas de cada figura, nenhuma acima de cinco.
 *   estado      todo q tem o seu Q e nenhum d sai de envelope.
 *   colado      a letra colada (h no eixo, r no raio, apotema da base) fica a
 *               FOLGA_COLADO da linha mais proxima, medida na TINTA. E quando
 *               nenhuma das posicoes cabe ela DESISTE de ser colada: cai para o
 *               rotulo com halo, foge e liga o fio de chamada. Os cartoes
 *               esbeltos do fim (cone 3 por 20, piramide 6 por 24) existem
 *               porque com as proporcoes que cabem uma busca viva e uma busca
 *               morta davam a mesma folha. Neles o que se cobra e a tinta acima
 *               do piso, com fio e sem aviso; o aviso ficou so para o degrau
 *               de baixo, o texto que nao acha lugar nem fugindo.
 *
 * O texto das figuras entra todo por parametro, aqui em portugues e no fim
 * tambem em ingles, para provar que o desenhador nao tem palavra propria.
 *
 * Regra da casa: nunca usar travessao.
 */
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');
const B = require('./base.js');
const D = require('./desenho.js');
const M = require('./marcas.js');
const S = require('./solidos.js');

const COR = PDFGen.COR;
const MARG_E = PDFGen.MARG_E, MARG_D = PDFGen.MARG_D;
const LARG = (MARG_D - MARG_E - 16) / 2;
const PAGINA_A = PDFGen.PAGINA_A;

const doc = new PDFGen.Doc();
const medidas = [];        // nome, registro, fluxo, saida
const clips = [];          // recortes para o render em PNG
let passou = 0, falhou = 0;

/* ------------------------------------------------------------ andaime */

function pagina(titulo, subtitulo) {
  doc.novaPagina();
  doc.texto(titulo, MARG_E, doc.y, { tam: 13, bold: true, cor: COR.navy });
  doc.y -= 13;
  if (subtitulo) { doc.texto(subtitulo, MARG_E, doc.y, { tam: 8, cor: COR.muted }); doc.y -= 12; }
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
function titulo(texto, x) {
  doc.texto(texto, x, doc.y, { tam: 7.5, bold: true, cor: COR.navy });
  doc.y -= 9;
}
function guardar(nome, reg, ops, saida) {
  medidas.push({ nome: nome, reg: reg, ops: ops, saida: saida });
  if (reg && reg.caixa) {
    clips.push({ nome: nome, pagina: doc.paginas.length, x: reg.caixa.x, y: reg.caixa.y,
      largura: reg.caixa.largura, altura: reg.caixa.altura });
  }
}
function ok(cond, texto, detalhe) {
  if (cond) passou++; else falhou++;
  console.log('  ' + (cond ? 'OK     ' : 'FALHOU ') + texto + (detalhe ? '   [' + detalhe + ']' : ''));
}
function medido(texto) { console.log('         ' + texto); }
function achar(nome) {
  for (const m of medidas) if (m.nome === nome) return m;
  throw new Error('cartao nao encontrado: ' + nome);
}
function dist(P, Q) { return Math.sqrt((Q.x - P.x) * (Q.x - P.x) + (Q.y - P.y) * (Q.y - P.y)); }
function n2(v) { return (Math.round(v * 100) / 100).toFixed(2); }

/* Cartao de um solido: figura montada a mao, a prova fazendo o papel de receita
 * (converte origem e dimensoes, cota em cima do que a funcao devolveu). */
function cartao(nome, x, largura, tit, altura, tipo, dims, desenhar) {
  titulo(tit, x);
  const pag = doc.pag, de = pag.ops.length;
  const out = {};
  const cx = S.caixaDoSolido(tipo, dims);
  const reg = B.figura(doc, {
    x: x, largura: largura, altura: altura, folga: 22, unidades: cx, antes: 2, depois: 10
  }, (ctx) => {
    const O = ctx.p({ x: 0, y: 0 });
    const dk = S.emPontos(dims, ctx.k);
    ctx.contorno(() => { out.S = S[tipo](ctx, O, dk, {}); });
    desenhar(ctx, out);
  });
  let ops = pag.ops.slice(de);
  if (doc.pag !== pag && doc.pag) ops = ops.concat(doc.pag.ops);
  guardar(nome, reg, ops, out);
  return reg;
}
/* Composicao: a funcao abre o figura() sozinha; aqui so se captura o fluxo. */
function composicao(nome, x, largura, tit, fn) {
  titulo(tit, x);
  const pag = doc.pag, de = pag.ops.length;
  const reg = fn(x, largura);
  let ops = pag.ops.slice(de);
  if (doc.pag !== pag && doc.pag) ops = ops.concat(doc.pag.ops);
  guardar(nome, reg, ops, reg ? reg.saida : null);
  return reg;
}

/* ================================================== 1. um cartao por solido */

pagina('solidos em cavaleira', 'fuga de 45 graus a metade, ocultas em [2 2] 0,60, elipse b = 0,4 a; a prova cota em cima do que a funcao devolveu');

faixa(
  (x, L) => cartao('prisma', x, L, 'prisma reto de base quadrada: A a D embaixo, E a H em cima', 150,
    'prisma', { aresta: 1, profundidade: 1, altura: 1.2 }, (ctx, out) => {
      ctx.rotulos(() => {
        const V = out.S.vertices;
        D.rotularVertices(ctx, [V.A, V.B, V.C, V.D], ['A', 'B', 'C', 'D'], { tam: 8 });
      });
    }),
  (x, L) => cartao('cilindro', x, L, 'cilindro: tampa inteira, base com a metade de tras tracejada', 150,
    'cilindro', { raio: 0.5, altura: 1.2 }, (ctx, out) => {
      ctx.marcas(() => D.poligono(ctx, [out.S.centroTopo, out.S.topoDir], { fechado: false, espessura: 0.9, papel: 'objeto' }));
      ctx.rotulos(() => {
        S.rotuloColado(ctx, 'r', out.S.centroTopo, out.S.topoDir, { x: 0, y: 1 }, { candidatos: S.EM_RAIO_TAMPA, afastamento: S.AFAST_RAIO });
        D.rotuloLado(ctx, 'h', out.S.baseDir, out.S.topoDir, { direcao: { x: 1, y: 0 } });
      });
    })
);

faixa(
  (x, L) => cartao('piramide', x, L, 'piramide de base quadrada: tres ocultas morrem em D', 150,
    'piramide', { aresta: 1, altura: 1.3 }, (ctx, out) => {
      ctx.rotulos(() => {
        const V = out.S.vertices;
        D.rotularVertices(ctx, [V.A, V.B, V.C, V.D], ['A', 'B', 'C', 'D'], { tam: 8 });
        D.rotulo(ctx, 'V', V.V, { direcao: { x: 0, y: 1 }, tam: 8 });
      });
    }),
  (x, L) => cartao('cone', x, L, 'cone: geratrizes ate os vertices da elipse', 150,
    'cone', { raio: 0.5, altura: 1.3 }, (ctx, out) => {
      ctx.marcas(() => { S.linhaInterna(ctx, out.S.vertice, out.S.O); });
      ctx.rotulos(() => S.rotuloColado(ctx, 'h', out.S.vertice, out.S.O, { x: -1, y: 0 }, { candidatos: S.EM_ALTURA_CONE }));
    })
);

faixa(
  (x, L) => cartao('esfera', x, L, 'esfera: contorno mais equador com a metade de tras tracejada', 130,
    'esfera', { raio: 0.55 }, (ctx, out) => {
      ctx.marcas(() => {
        D.cotaRadial(ctx, out.S.centro, out.S.raio, 'r', { angulo: 50 });
        D.ponto(ctx, out.S.centro, { raio: 1.6 });
      });
    }),
  null
);

/* ================================================== 2. painel e triangulos */

pagina('painel e triangulos internos', 'MATEM3-12: os cinco lado a lado na mesma escala; cone e piramide com o triangulo retangulo preenchido');

/* O painel simula a diretiva que o tema escreveria, para a trava de texto
 * nascido no desenhador ter com o que comparar: os nomes vem de la. */
doc.figuraDaVez = B.lerDiretiva('@fig solidos nome=prisma;cilindro;pirâmide;cone;esfera cota=a;h;r');
{
  titulo('painel dos cinco solidos, nomes por parametro', MARG_E);
  const pag = doc.pag, de = pag.ops.length;
  const painel = S.painelDeSolidos(doc, {
    nomes: ['prisma', 'cilindro', 'pirâmide', 'cone', 'esfera'],
    cotas: {
      prisma: { aresta: 'a', altura: 'h' }, cilindro: { raio: 'r', altura: 'h' },
      piramide: { aresta: 'a', altura: 'h' }, cone: { raio: 'r', altura: 'h' }, esfera: { raio: 'r' }
    }
  });
  const ops = pag.ops.slice(de);
  medidas.push({ nome: 'painel', reg: null, ops: ops, saida: painel });
  for (let i = 0; i < painel.registros.length; i++) {
    const r = painel.registros[i];
    clips.push({ nome: 'painel' + i, pagina: doc.paginas.length, x: r.caixa.x, y: r.caixa.y, largura: r.caixa.largura, altura: r.caixa.altura });
  }
  clips.push({ nome: 'painel', pagina: doc.paginas.length, x: MARG_E, y: painel.registros[0].caixa.y,
    largura: MARG_D - MARG_E, altura: painel.alturaCelula });
}
doc.figuraDaVez = null;

faixa(
  (x, L) => composicao('cone triangulo', x, L, 'cone com o triangulo retangulo interno (r, h, g, quadradinho)', (x, L) =>
    S.coneComTriangulo(doc, {
      dims: { raio: 5, altura: 12 }, rotulos: { raio: 'r', altura: 'h', geratriz: 'g' },
      bloco: { x: x, largura: L, altura: 160 }
    })),
  (x, L) => composicao('piramide triangulo', x, L, 'piramide com o triangulo interno (h, apotema da base, apotema)', (x, L) =>
    S.piramideComTriangulo(doc, {
      dims: { aresta: 10, altura: 12 }, rotulos: { altura: 'h', apotemaBase: 'm', apotema: 'g' },
      bloco: { x: x, largura: L, altura: 160 }
    }))
);

/* ================================================== 3. as tres composicoes cotadas */

pagina('composicoes cotadas', 'esfera inscrita, prisma triangular e o semicirculo que vira cone, com as cotas por parametro');

faixa(
  (x, L) => composicao('cilindro esfera', x, L, 'cilindro com a esfera inscrita: raio 3, altura 6', (x, L) =>
    S.cilindroComEsfera(doc, {
      dims: { raio: 3 }, rotulos: { raio: 'r = 3', altura: '6', centro: 'O' },
      bloco: { x: x, largura: L, altura: 165 }
    })),
  (x, L) => composicao('prisma triangular', x, L, 'prisma reto de base equilatera: lado 6, altura 10', (x, L) =>
    S.prismaTriangular(doc, {
      dims: { lado: 6, altura: 10 }, rotulos: { lado: '6', altura: '10' },
      bloco: { x: x, largura: L, altura: 165 }
    }))
);

composicao('planificacao', MARG_E, MARG_D - MARG_E, 'semicirculo de raio 10 que vira o cone de raio 5, altura 5 raiz de 3 e geratriz 10', (x, L) =>
  S.planificacaoDoCone(doc, {
    dims: { raio: 10, angulo: 180 },
    rotulos: { arco: '10π', raioSetor: '10', raio: '5', altura: '5√3', geratriz: '10' },
    bloco: { x: x, largura: L, altura: 175 }
  }));

/* A mesma composicao com os rotulos em ingles: nenhuma palavra portuguesa pode
 * sobrar na folha, porque nenhuma nasceu no desenhador.
 *
 * O cone e de raio 7 e nao de 5 como o irmao em portugues, e a razao e medida:
 * "height" tem 24,2 pt de tinta, contra 4,7 pt do "h", e num cone de raio 5 e
 * altura 12 nenhuma das quatro posicoes do rotuloColado deixa a palavra livre.
 * Ela saia impressa POR CIMA da geratriz da esquerda, a -0,60 pt, e a folha nao
 * dizia nada: era o defeito do emLivre, que devolvia o primeiro candidato em
 * silencio. Com o aviso ligado o cartao apareceu. Abrindo o cone para raio 7 a
 * palavra cabe com 2,54 pt de vao, acima do piso de 2, e sem aviso nenhum: o
 * cartao continua provando que o texto e todo do parametro, e agora tambem
 * provando que a busca de posicao livre escolhe (a palavra vai para 0,7 da
 * altura, e nao para o primeiro candidato, 0,5). */
faixa(
  (x, L) => composicao('cone triangulo en', x, L, 'the same cone opened to radius 7, labels passed in English', (x, L) =>
    S.coneComTriangulo(doc, {
      dims: { raio: 7, altura: 12 }, rotulos: { raio: 'r', altura: 'height', geratriz: 'slant' },
      bloco: { x: x, largura: L, altura: 150 }
    })),
  null
);

/* ------------------------------------------------------------ saida */

const saida = path.join(__dirname, '_prova_solidos.pdf');
fs.writeFileSync(saida, Buffer.from(doc.finalizar()));
fs.writeFileSync(path.join(__dirname, '_prova_solidos_clips.json'), JSON.stringify({ paginaAltura: PAGINA_A, clips: clips }, null, 1));

/* ====================================================== leitor de caminhos
 *
 * O lerFluxo do base.js devolve segmentos e arcos AJUSTADOS; aqui e preciso
 * a Bezier crua (as ancoras da elipse e o padrao de traco em vigor em cada
 * caminho), entao o fluxo e lido de novo, com o estado grafico junto. */
function lerCaminhos(ops) {
  const toks = [];
  for (const s of ops) {
    if (s.indexOf('BT ') === 0) continue;
    /* O vetor de traco chega colado: "[2 2] 0 d" vira os tokens "[2" e "2]".
     * Os colchetes sao separados antes de partir, senao o padrao le como []
     * e toda aresta oculta passa por continua. */
    for (const t of s.replace(/\[/g, ' [ ').replace(/\]/g, ' ] ').split(/\s+/)) if (t) toks.push(t);
  }
  const subs = [];
  let atual = null, pilha = [], gs = { w: 1, d: '[] 0', cor: '0 0 0' }, pilhaGs = [], arr = null;
  const num = (k) => { const v = pilha[pilha.length - k]; return v === undefined ? 0 : v; };
  const fechar = (pinta, preenche) => {
    for (const s of subs) if (s.aberto) { s.aberto = false; s.w = gs.w; s.d = gs.d; s.cor = gs.cor; s.pinta = pinta; s.preenche = preenche; }
  };
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t === '[') { arr = []; continue; }
    if (arr && t !== ']') { arr.push(parseFloat(t)); continue; }
    if (t === ']') { pilha.push({ arr: arr }); arr = null; continue; }
    const v = parseFloat(t);
    if (!isNaN(v) && /^[-+]?[\d.]+$/.test(t)) { pilha.push(v); continue; }
    switch (t) {
      case 'q': pilhaGs.push({ w: gs.w, d: gs.d, cor: gs.cor }); break;
      case 'Q': if (pilhaGs.length) gs = pilhaGs.pop(); break;
      case 'w': gs.w = num(1); break;
      case 'd': { const a = pilha[pilha.length - 2]; gs.d = '[' + ((a && a.arr) ? a.arr.join(' ') : '') + '] ' + num(1); break; }
      case 'RG': gs.cor = [num(3), num(2), num(1)].map((c) => c.toFixed(2)).join(' '); break;
      case 'm': atual = { pts: [{ x: num(2), y: num(1) }], trechos: [], aberto: true, fechado: false }; subs.push(atual); break;
      case 'l':
        if (atual) { const a = atual.pts[atual.pts.length - 1], b = { x: num(2), y: num(1) }; atual.trechos.push({ p0: a, p3: b, reta: true }); atual.pts.push(b); }
        break;
      case 'c':
        if (atual) {
          const a = atual.pts[atual.pts.length - 1];
          const c1 = { x: num(6), y: num(5) }, c2 = { x: num(4), y: num(3) }, p3 = { x: num(2), y: num(1) };
          atual.trechos.push({ p0: a, c1: c1, c2: c2, p3: p3, reta: false });
          atual.pts.push(p3);
        }
        break;
      case 'h': if (atual) atual.fechado = true; break;
      case 're': {
        const x = num(4), y = num(3), l = num(2), a = num(1);
        atual = { pts: [{ x, y }, { x: x + l, y }, { x: x + l, y: y + a }, { x, y: y + a }], trechos: [], aberto: true, fechado: true, re: true };
        subs.push(atual); break;
      }
      case 'S': case 's': fechar(true, false); atual = null; break;
      case 'f': case 'f*': case 'F': fechar(false, true); atual = null; break;
      case 'B': case 'B*': case 'b': fechar(true, true); atual = null; break;
      case 'n': fechar(false, false); atual = null; break;
      default: break;
    }
    if (t !== 'Tf' && t !== 'Tj') pilha = [];
  }
  return subs;
}
/* O segmento reto do fluxo que liga P a Q (em qualquer ordem), com folga de
 * 0,02 pt, que e o arredondamento de duas casas. */
function segmentoEntre(subs, P, Q) {
  for (const s of subs) {
    if (!s.pinta) continue;
    for (const t of s.trechos) {
      if (!t.reta) continue;
      const direto = dist(t.p0, P) < 0.02 && dist(t.p3, Q) < 0.02;
      const inverso = dist(t.p0, Q) < 0.02 && dist(t.p3, P) < 0.02;
      if (direto || inverso) return { sub: s, trecho: t };
    }
  }
  return null;
}
/* As elipses do fluxo: subcaminhos so de Bezier, com o centro e os semieixos
 * lidos das ANCORAS (o desenho.js ancora a cada 90 graus, entao os extremos
 * dos eixos sao ancoras). */
function elipsesDe(subs) {
  const saida = [];
  for (const s of subs) {
    if (!s.pinta || s.trechos.length < 2 || s.trechos.some((t) => t.reta)) continue;
    const xs = s.pts.map((p) => p.x), ys = s.pts.map((p) => p.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    /* Elipse inteira (quatro trechos ou caminho fechado): o semieixo vertical e
     * metade da altura das ancoras. Meia elipse (dois trechos, aberta): a
     * altura das ancoras JA e o semieixo. */
    const inteira = s.fechado || s.trechos.length >= 4;
    saida.push({ sub: s, a: (x1 - x0) / 2, b: inteira ? (y1 - y0) / 2 : (y1 - y0), cx: (x0 + x1) / 2, cy: inteira ? (y0 + y1) / 2 : null,
      x0, x1, y0, y1, d: s.d, w: s.w, trechos: s.trechos.length, fechado: s.fechado });
  }
  return saida;
}
function conferirArestas(nome, S, subs) {
  let ocultasOk = 0, visiveisOk = 0, erros = [];
  for (const e of S.arestas) {
    const seg = segmentoEntre(subs, e.P, e.Q);
    if (!seg) { erros.push(e.de + e.ate + ' nao esta no fluxo'); continue; }
    const d = seg.sub.d, w = seg.sub.w;
    if (e.oculta) {
      if (d.indexOf('[2 2]') === 0 && Math.abs(w - 0.6) < 1e-6) ocultasOk++;
      else erros.push(e.de + e.ate + ' oculta saiu com ' + d + ' e ' + w + ' w');
    } else {
      if (d.indexOf('[]') === 0 && Math.abs(w - 1.2) < 1e-6) visiveisOk++;
      else erros.push(e.de + e.ate + ' visivel saiu com ' + d + ' e ' + w + ' w');
    }
  }
  medido(nome + ': ' + S.ocultas + ' ocultas em [2 2] 0,60 w e ' + S.visiveis + ' visiveis em [] 1,20 w, lidas no fluxo: ' +
    ocultasOk + ' e ' + visiveisOk + (erros.length ? '; ' + erros.join('; ') : ''));
  return erros.length === 0 && ocultasOk === S.ocultas && visiveisOk === S.visiveis;
}
function conferirFuga(nome, S, A, Bp, Dp) {
  const frente = dist(A, Bp), fundo = dist(A, Dp);
  const ang = Math.atan2(Dp.y - A.y, Dp.x - A.x) * 180 / Math.PI;
  medido(nome + ': aresta frontal ' + n2(frente) + ' pt, aresta de profundidade ' + n2(fundo) +
    ' pt (razao ' + (fundo / frente).toFixed(4) + '), angulo ' + n2(ang) + ' graus');
  ok(Math.abs(fundo - frente / 2) < 0.5, nome + ': a profundidade tem metade da frontal (desvio ' + n2(Math.abs(fundo - frente / 2)) + ' pt, teto 0,5)');
  ok(Math.abs(ang - 45) < 0.5, nome + ': e foge a 45 graus (desvio ' + (Math.abs(ang - 45)).toFixed(3) + ' graus, teto 0,5)');
}

/* ====================================================== medicao */

console.log('medicao no fluxo de conteudo');
console.log('');
console.log('prisma');
{
  const m = achar('prisma'), P = m.saida.S, subs = lerCaminhos(m.ops);
  const V = P.vertices;
  const nomes = P.arestas.filter((e) => e.oculta).map((e) => e.de + e.ate).sort().join(' ');
  medido('vertices: ' + Object.keys(V).join(' ') + '; ocultas: ' + nomes);
  ok(P.ocultas === 3 && P.visiveis === 9, 'tres arestas ocultas e nove visiveis', P.ocultas + ' e ' + P.visiveis);
  ok(nomes === 'AD CD DH', 'as tres ocultas morrem em D, o vertice de tras, embaixo e a esquerda', nomes);
  ok(conferirArestas('prisma', P, subs), 'cada aresta saiu no fluxo com o padrao e a espessura que a funcao declarou');
  /* A D liga o vertice da frente ao de tras no fluxo: essa e a fuga. */
  const segAD = segmentoEntre(subs, V.A, V.D), segAB = segmentoEntre(subs, V.A, V.B);
  conferirFuga('prisma', P, segAB.trecho.p0.x < segAB.trecho.p3.x ? segAB.trecho.p0 : segAB.trecho.p3,
    segAB.trecho.p0.x < segAB.trecho.p3.x ? segAB.trecho.p3 : segAB.trecho.p0,
    dist(segAD.trecho.p0, V.A) < 0.02 ? segAD.trecho.p3 : segAD.trecho.p0);
  medido('marcas ativas: ' + m.reg.marcasAtivas);
  ok(m.reg.marcasAtivas <= 5, 'prisma dentro do teto de cinco');
}

console.log('');
console.log('piramide');
{
  const m = achar('piramide'), P = m.saida.S, subs = lerCaminhos(m.ops);
  const V = P.vertices;
  const nomes = P.arestas.filter((e) => e.oculta).map((e) => e.de + e.ate).sort().join(' ');
  ok(P.ocultas === 3 && P.visiveis === 5, 'tres ocultas e cinco visiveis', P.ocultas + ' e ' + P.visiveis);
  ok(nomes === 'AD CD DV', 'as ocultas sao AD, CD e DV', nomes);
  ok(conferirArestas('piramide', P, subs), 'padrao e espessura de cada aresta conferem no fluxo');
  const segAD = segmentoEntre(subs, V.A, V.D);
  conferirFuga('piramide', P, V.A, V.B, dist(segAD.trecho.p0, V.A) < 0.02 ? segAD.trecho.p3 : segAD.trecho.p0);
  medido('marcas ativas: ' + m.reg.marcasAtivas);
  ok(m.reg.marcasAtivas <= 5, 'piramide dentro do teto');
}

console.log('');
console.log('cilindro e cone: a elipse das bases');
for (const nome of ['cilindro', 'cone']) {
  const m = achar(nome), Sd = m.saida.S, subs = lerCaminhos(m.ops);
  const els = elipsesDe(subs);
  let texto = [];
  for (const e of els) texto.push('a ' + n2(e.a) + ' b ' + n2(e.b) + ' b/a ' + (e.b / e.a).toFixed(4) + ' ' + e.d + ' ' + e.w + ' w');
  medido(nome + ': ' + els.length + ' arcos de elipse no fluxo: ' + texto.join(' | '));
  /* Metade de elipse tem a como semieixo e b como a altura da metade: b/a
   * continua 0,4. A tampa inteira do cilindro tambem. */
  const razoes = els.map((e) => e.b / e.a);
  ok(razoes.every((r) => Math.abs(r - S.ACHATAMENTO) < 0.002), nome + ': toda elipse tem b/a = ' + S.ACHATAMENTO + ' (desvio maximo ' +
    Math.max(...razoes.map((r) => Math.abs(r - S.ACHATAMENTO))).toFixed(4) + ')');
  const tras = els.filter((e) => e.d.indexOf('[2 2]') === 0), frente = els.filter((e) => e.d.indexOf('[]') === 0);
  ok(tras.length === 1 && Math.abs(tras[0].w - 0.6) < 1e-6, nome + ': a metade de tras da base e a unica tracejada, em 0,60 w', tras.length + ' tracejada(s)');
  ok(frente.every((e) => Math.abs(e.w - 1.2) < 1e-6), nome + ': as metades da frente saem em 1,20 w');
  /* A metade de tras fica ACIMA do centro (y maior), a da frente abaixo. */
  const base = Sd.centroBase;
  ok(tras[0].y0 >= base.y - 0.02 && frente.some((e) => e.y1 <= base.y + 0.02),
    nome + ': a tracejada e a de cima (tras) e a cheia a de baixo (frente), como o observador ve');
  medido(nome + ': marcas ativas ' + m.reg.marcasAtivas);
  ok(m.reg.marcasAtivas <= 5, nome + ' dentro do teto');
}

console.log('');
console.log('esfera');
{
  const m = achar('esfera'), E = m.saida.S, subs = lerCaminhos(m.ops);
  const els = elipsesDe(subs).filter((e) => e.trechos >= 2);
  const circ = els.filter((e) => Math.abs(e.a - e.b) < 0.02 && e.fechado);
  const eq = els.filter((e) => Math.abs(e.b / e.a - S.ACHATAMENTO) < 0.002);
  medido('circunferencia de raio ' + (circ.length ? n2(circ[0].a) : '?') + ' pt; equador com ' + eq.length + ' metades: ' +
    eq.map((e) => 'b/a ' + (e.b / e.a).toFixed(3) + ' ' + e.d).join(' | '));
  ok(circ.length === 1 && Math.abs(circ[0].a - E.raio) < 0.02, 'o contorno e uma circunferencia do raio pedido');
  ok(eq.length === 2 && eq.filter((e) => e.d.indexOf('[2 2]') === 0).length === 1, 'o equador tem uma metade cheia e uma tracejada');
  ok(m.reg.marcasAtivas <= 5, 'esfera dentro do teto', m.reg.marcasAtivas + ' marcas');
}

console.log('');
console.log('painel dos cinco');
{
  const m = achar('painel'), P = m.saida;
  const escalas = P.registros.map((r) => r.escala);
  medido('escala de cada celula: ' + escalas.map((k) => k.toFixed(4)).join(' '));
  ok(Math.max(...escalas) - Math.min(...escalas) < 1e-6, 'os cinco saem na MESMA escala (variacao ' + (Math.max(...escalas) - Math.min(...escalas)).toExponential(1) + ')');
  const marcas = P.registros.map((r) => r.marcasAtivas);
  medido('marcas ativas por celula: ' + marcas.join(' ') + '; altura da celula ' + n2(P.alturaCelula) + ' pt');
  ok(marcas.every((n) => n <= 5), 'nenhuma celula passa de cinco marcas');
  const textos = [];
  for (const r of P.registros) for (const t of r.medido.textos) textos.push(t.txt);
  medido('textos impressos: ' + textos.join(' '));
  ok(['prisma', 'cilindro', 'pirâmide', 'cone', 'esfera'].every((n) => textos.indexOf(n) >= 0), 'os cinco nomes passados por parametro estao no fluxo');
  const conf = P.registros.map((r) => r.conferencia.length);
  medido('falhas do conferirFigura por celula: ' + conf.join(' '));
  ok(conf.every((c) => c === 0), 'o conferirFigura nao acusa nada em nenhuma celula');
  /* A base de todos assenta na mesma altura: o pe da caixa de unidades de cada
   * celula e o pe do solido menos a faixa do nome, entao os cinco nomes e as
   * cinco bases ficam alinhados. */
  const pes = P.registros.map((r) => r.solido.caixa.y0);
  medido('pe de cada solido na folha: ' + pes.map(n2).join(' '));
  /* Nenhum rotulo do painel precisou fugir nem ganhar fio de chamada: a letra
   * colada cabe onde o livro a poe. */
  let chamadas = 0, desvioMax = 0;
  for (const r of P.registros) for (const t of r.rotulos) { if (t.chamada) chamadas++; desvioMax = Math.max(desvioMax, t.desviou || 0); }
  medido('rotulos com fio de chamada: ' + chamadas + '; maior desvio do halo: ' + n2(desvioMax) + ' pt');
  ok(chamadas === 0 && desvioMax === 0, 'nenhum rotulo do painel fugiu nem ganhou fio de chamada');
  /* As letras coladas (sem halo) contra TUDO o que a celula registrou: arestas,
   * arcos, linhas internas, quadradinho. O vao e da tinta da letra, com meia
   * espessura da linha descontada, e o piso e o FOLGA_COLADO do solidos.js. */
  const th = P.registros[2].medido.textos.filter((t) => t.txt === 'h')[0];
  const cxH = D.caixaDoRotulo('h', { tam: th.tam });
  medido('a letra h tem ' + n2(th.largura) + ' por ' + n2(th.tam * 0.72) + ' pt de tinta; a caixa do halo teria ' + n2(cxH.largura) + ' por ' + n2(cxH.altura));
  const ORDEM = ['prisma', 'cilindro', 'piramide', 'cone', 'esfera'];
  const coladas = [[1, 'r'], [2, 'h'], [3, 'h'], [3, 'r']];
  const vaos = coladas.map(([i, txt]) => [ORDEM[i] + ' ' + txt, vaoDaLetra(P.registros[i], txt)]);
  medido('vao da tinta de cada letra colada ate a linha mais proxima: ' + vaos.map(([n, v]) => n + ' ' + n2(v)).join(', ') + ' pt');
  ok(vaos.every(([n, v]) => v >= S.FOLGA_COLADO), 'toda letra colada do painel fica a pelo menos ' + S.FOLGA_COLADO + ' pt de qualquer linha');
}
/* Qual das grafias aceitas para o MESMO texto saiu na folha. A raiz e o pi
 * viajam pela fonte Symbol, e conforme o leitor de fluxo do base.js o texto
 * medido volta com o caractere de verdade ("5√3") ou com o byte cru do Symbol
 * lido como Latin-1 ("5Ö3"). A tinta impressa e a mesma nas duas, entao a prova
 * aceita qualquer uma em vez de fixar a forma de hoje e quebrar no dia em que o
 * leitor melhorar. */
function comoSaiu(reg, alternativas) {
  const alts = Array.isArray(alternativas) ? alternativas : [alternativas];
  for (const a of alts) if (reg.medido.textos.some((t) => t.txt === a)) return a;
  return null;
}
/* O menor vao entre a tinta de um rotulo e qualquer traco, arco ou canto de
 * quadradinho do registro, descontada meia espessura da linha. Aceita uma
 * grafia ou a lista de grafias equivalentes. */
function vaoDaLetra(reg, txt) {
  const alts = Array.isArray(txt) ? txt : [txt];
  let t = null;
  for (const a of alts) { t = reg.medido.textos.filter((x) => x.txt === a)[0]; if (t) break; }
  if (!t) return -Infinity;
  const caixa = tintaDoTexto(t);
  let menor = Infinity;
  const segs = [];
  for (const tr of reg.tracos) {
    if (!tr) continue;
    const w = Number(tr.espessura) || 0;
    if (tr.x1 != null) segs.push([{ x: tr.x1, y: tr.y1 }, { x: tr.x2, y: tr.y2 }, w]);
    else if (tr.tipo === 'arco' && tr.centro) {
      const pts = D.arcoPontos(tr.centro, tr.rx, tr.ry, tr.de, tr.ate, { giro: tr.giro, passo: 4 });
      for (let j = 1; j < pts.length; j++) segs.push([pts[j - 1], pts[j], w]);
    }
  }
  for (const m of reg.marcas) {
    if (m && m.cantos) for (let j = 1; j < m.cantos.length; j++) segs.push([m.cantos[j - 1], m.cantos[j], m.espessura || 0]);
  }
  for (const [Pp, Qq, w] of segs) menor = Math.min(menor, vaoCaixaSegmento(caixa, Pp, Qq) - w / 2);
  return menor;
}
/* A caixa da TINTA de um rotulo de uma letra: h e as outras com ascendente sobem
 * 0,72 do corpo; r e m sobem so a altura de x, 0,52. E o que a folha imprime,
 * e nao a caixa do halo. */
function tintaDoTexto(t) {
  const alta = /[bdfhklt]|[A-Z0-9]/.test(t.txt);
  return { x0: t.x, x1: t.x + t.largura, y0: t.y, y1: t.y + t.tam * (alta ? 0.72 : 0.52) };
}
function vaoCaixaElipse(cx, C, a, b) {
  let menor = Infinity;
  for (let i = 0; i < 360; i += 2) {
    const x = C.x + a * Math.cos(i * Math.PI / 180), y = C.y + b * Math.sin(i * Math.PI / 180);
    const dx = Math.max(cx.x0 - x, 0, x - cx.x1), dy = Math.max(cx.y0 - y, 0, y - cx.y1);
    menor = Math.min(menor, Math.sqrt(dx * dx + dy * dy));
  }
  return menor;
}
function vaoCaixaSegmento(cx, P, Q) {
  let menor = Infinity;
  for (let i = 0; i <= 40; i++) {
    const t = i / 40, x = P.x + (Q.x - P.x) * t, y = P.y + (Q.y - P.y) * t;
    const dx = Math.max(cx.x0 - x, 0, x - cx.x1), dy = Math.max(cx.y0 - y, 0, y - cx.y1);
    menor = Math.min(menor, Math.sqrt(dx * dx + dy * dy));
  }
  return menor;
}
function dentroDoTriangulo(p, a, b, c) {
  const s1 = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
  const s2 = (c.x - b.x) * (p.y - b.y) - (c.y - b.y) * (p.x - b.x);
  const s3 = (a.x - c.x) * (p.y - c.y) - (a.y - c.y) * (p.x - c.x);
  return (s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0);
}

console.log('');
console.log('cone com o triangulo retangulo interno');
{
  const m = achar('cone triangulo'), reg = m.reg, sd = m.saida, subs = lerCaminhos(m.ops);
  const O = sd.O, V = sd.V, P = sd.P;
  const ar = reg.marcas.filter((k) => k && k.tipo === 'anguloReto');
  ok(ar.length === 1, 'um quadradinho de angulo reto no registro');
  const q = ar[0];
  medido('quadradinho: vertice em (' + n2(q.x) + ', ' + n2(q.y) + '), pe da altura em (' + n2(O.x) + ', ' + n2(O.y) + '), distancia ' + n2(dist(q, O)) + ' pt, lado ' + n2(q.lado) + ' pt, abertura ' + n2(q.abertura) + ' graus');
  ok(dist(q, O) < 0.01, 'o quadradinho esta no pe da altura');
  ok(Math.abs(q.abertura - 90) < 0.01, 'e o angulo entre o raio e a altura mede 90 na folha, sem losango');
  /* No fluxo: uma poligonal de tres pontos, os dois extremos a "lado" de O. */
  const polis = subs.filter((s) => s.pinta && s.trechos.length === 2 && s.trechos.every((t) => t.reta) && !s.fechado);
  const quad = polis.filter((s) => Math.abs(dist(s.pts[0], O) - q.lado) < 0.02 && Math.abs(dist(s.pts[2], O) - q.lado) < 0.02);
  ok(quad.length === 1 && Math.abs(quad[0].w - 0.9) < 1e-6, 'o quadradinho esta no fluxo, com os dois lados iguais e 0,90 w', quad.length + ' poligonal(is)');
  /* O preenchimento: uma area so, o triangulo V O P, no cinza de area. */
  const areas = reg.medido.areas.filter((a) => a.pts.length >= 3 && !(a.pts.length === 4 && Math.abs(a.pts[0].y - a.pts[1].y) < 1e-6 && a.cor[0] > 0.99));
  medido('areas preenchidas alem do fundo branco: ' + areas.length + '; cor ' + (areas[0] ? areas[0].cor.map((c) => c.toFixed(3)).join(' ') : '?') +
    ', contraste ' + (areas[0] ? D.contraste(areas[0].cor).toFixed(2) : '?') + ':1 contra o branco');
  ok(areas.length === 1, 'o triangulo e o unico preenchimento da figura');
  ok(areas[0] && D.contraste(areas[0].cor) >= 3, 'e o cinza passa do piso de 3:1 do desenho.js');
  const tri = areas[0].pts;
  const casa = [V, O, P].every((X) => tri.some((p) => dist(p, X) < 0.02));
  ok(casa, 'os tres vertices da area sao V, O e P');
  /* g e a silhueta: o segmento V P esta no fluxo em 1,20 continuo; h e r estao
   * em [2 2] 0,60, porque correm por dentro do solido. */
  const sVP = segmentoEntre(subs, V, P), sVO = segmentoEntre(subs, V, O), sOP = segmentoEntre(subs, O, P);
  ok(sVP && sVP.sub.d.indexOf('[]') === 0 && Math.abs(sVP.sub.w - 1.2) < 1e-6, 'a geratriz do triangulo e a propria silhueta, 1,20 w continua');
  ok(sVO && sVO.sub.d.indexOf('[2 2]') === 0 && sOP && sOP.sub.d.indexOf('[2 2]') === 0, 'altura e raio saem em [2 2], por dentro do solido');
  medido('marcas ativas: ' + reg.marcasAtivas + ' (r, h, g e o quadradinho); conferirFigura: ' + (reg.conferencia.length ? reg.conferencia.join(' | ') : 'limpo'));
  ok(reg.marcasAtivas === 4, 'quatro marcas ativas, dentro do teto');
  const textos = reg.medido.textos.map((t) => t.txt);
  ok(textos.indexOf('r') >= 0 && textos.indexOf('h') >= 0 && textos.indexOf('g') >= 0 && textos.indexOf('90') < 0, 'r, h e g impressos e nenhum 90', textos.join(' '));
  const tr = reg.medido.textos.filter((t) => t.txt === 'r')[0];
  ok(dentroDoTriangulo({ x: tr.cx, y: tr.cy }, V, O, P), 'o r esta dentro do triangulo cinza');
  ok(reg.rotulos.every((t) => !t.chamada), 'nenhum rotulo com fio de chamada', reg.rotulos.filter((t) => t.chamada).map((t) => t.texto).join(' '));
  const vaos = ['h', 'r'].map((t) => [t, vaoDaLetra(reg, t)]);
  medido('vao da tinta ate a linha mais proxima: ' + vaos.map(([t, v]) => t + ' ' + n2(v)).join(', ') + ' pt');
  ok(vaos.every(([t, v]) => v >= S.FOLGA_COLADO), 'h e r colados ficam a pelo menos ' + S.FOLGA_COLADO + ' pt de qualquer linha');
}

console.log('');
console.log('piramide com o triangulo');
{
  const m = achar('piramide triangulo'), reg = m.reg, sd = m.saida, subs = lerCaminhos(m.ops);
  const O = sd.O, V = sd.V, Mp = sd.M;
  const q = reg.marcas.filter((k) => k && k.tipo === 'anguloReto')[0];
  medido('quadradinho em (' + n2(q.x) + ', ' + n2(q.y) + '), O em (' + n2(O.x) + ', ' + n2(O.y) + '), distancia ' + n2(dist(q, O)) + ' pt; abertura ' + n2(q.abertura) + ' graus');
  ok(dist(q, O) < 0.01 && Math.abs(q.abertura - 90) < 0.01, 'quadradinho no pe da altura e reto na folha');
  const ang = Math.atan2(Mp.y - O.y, Mp.x - O.x) * 180 / Math.PI;
  medido('apotema da base O M: ' + n2(dist(O, Mp)) + ' pt na folha, angulo ' + n2(ang) + ' graus (horizontal, verdadeira grandeza); aresta ' + n2(sd.piramide.aresta) + ' pt, metade ' + n2(sd.piramide.aresta / 2));
  ok(Math.abs(ang) < 0.01 && Math.abs(dist(O, Mp) - sd.piramide.aresta / 2) < 0.02, 'o apotema da base sai horizontal e em verdadeira grandeza (metade da aresta)');
  const areas = reg.medido.areas.filter((a) => a.pts.length === 3);
  ok(areas.length === 1, 'o triangulo V O M e o unico preenchimento', areas.length + ' area(s) de tres pontos');
  const sVM = segmentoEntre(subs, V, Mp), sVO = segmentoEntre(subs, V, O), sOM = segmentoEntre(subs, O, Mp);
  ok(sVM && sVM.sub.d.indexOf('[]') === 0 && Math.abs(sVM.sub.w - 0.9) < 1e-6, 'o apotema da piramide sai continuo em 0,90 w sobre a face visivel');
  ok(sVO && sVO.sub.d.indexOf('[2 2]') === 0 && sOM && sOM.sub.d.indexOf('[2 2]') === 0, 'altura e apotema da base em [2 2], por dentro');
  ok(conferirArestas('piramide composta', sd.piramide, subs), 'as oito arestas conferem no fluxo');
  medido('marcas ativas: ' + reg.marcasAtivas + '; conferirFigura: ' + (reg.conferencia.length ? reg.conferencia.join(' | ') : 'limpo'));
  ok(reg.marcasAtivas === 4, 'quatro marcas ativas');
  const tm = reg.medido.textos.filter((t) => t.txt === 'm')[0];
  ok(dentroDoTriangulo({ x: tm.cx, y: tm.cy }, V, O, Mp), 'o apotema da base (m) esta escrito dentro do triangulo cinza');
  const vaos = ['h', 'm'].map((t) => [t, vaoDaLetra(reg, t)]);
  medido('vao da tinta ate a linha mais proxima: ' + vaos.map(([t, v]) => t + ' ' + n2(v)).join(', ') + ' pt; ' +
    'o h ficou a ' + reg.rotulos.filter((t) => t.texto === 'h')[0].em + ' de V ate O e o m a ' + reg.rotulos.filter((t) => t.texto === 'm')[0].em + ' de O ate M');
  ok(vaos.every(([t, v]) => v >= S.FOLGA_COLADO) && reg.rotulos.every((t) => !t.chamada), 'h e m colados ficam a pelo menos ' + S.FOLGA_COLADO + ' pt de qualquer linha (a aresta V B cruza o apotema da base), sem fio de chamada');
}

console.log('');
console.log('cilindro com a esfera inscrita');
{
  const m = achar('cilindro esfera'), reg = m.reg, sd = m.saida, subs = lerCaminhos(m.ops);
  const els = elipsesDe(subs);
  const circ = els.filter((e) => Math.abs(e.a - e.b) < 0.02 && e.fechado && e.a > 5);
  const bases = els.filter((e) => Math.abs(e.b / e.a - S.ACHATAMENTO) < 0.002);
  ok(circ.length === 1, 'uma circunferencia no fluxo (a esfera)', circ.length);
  const c = circ[0];
  const topoCentroY = sd.cilindro.centroTopo.y, baseCentroY = sd.cilindro.centroBase.y;
  const dTopo = Math.abs(c.y1 - topoCentroY), dFundo = Math.abs(c.y0 - baseCentroY);
  const silhueta = segmentoEntre(subs, sd.cilindro.baseDir, sd.cilindro.topoDir);
  const dLat = Math.abs(c.x1 - silhueta.trecho.p0.x);
  medido('esfera: centro (' + n2(c.cx) + ', ' + n2(c.cy) + ') raio ' + n2(c.a) + '; topo da esfera a ' + n2(dTopo) + ' pt do centro da tampa, fundo a ' + n2(dFundo) +
    ' pt do centro da base, lado a ' + n2(dLat) + ' pt da silhueta');
  ok(dTopo < 0.011 && dFundo < 0.011 && dLat < 0.011, 'a esfera toca as duas bases e a lateral (distancia zero ao arredondamento de 0,01 pt)');
  ok(c.d.indexOf('[2 2]') === 0 && Math.abs(c.w - 0.6) < 1e-6, 'a esfera sai toda em [2 2] 0,60 w, porque esta atras da superficie lateral');
  medido('bases: ' + bases.map((e) => e.d + ' ' + e.w + ' w').join(' | '));
  ok(bases.length === 3, 'tampa inteira mais as duas metades da base', bases.length);
  medido('marcas ativas: ' + reg.marcasAtivas + '; conferirFigura: ' + (reg.conferencia.length ? reg.conferencia.join(' | ') : 'limpo'));
  ok(reg.marcasAtivas <= 5, 'dentro do teto');
  const cotas = reg.tracos.filter((t) => t.tipo === 'cota');
  ok(cotas.length === 1 && Math.abs(cotas[0].y2 - cotas[0].y1 - 2 * sd.raio) < 0.02, 'a cota da altura mede o diametro da esfera', cotas.length ? n2(cotas[0].y2 - cotas[0].y1) + ' contra ' + n2(2 * sd.raio) : 'sem cota');
}

console.log('');
console.log('prisma triangular cotado');
{
  const m = achar('prisma triangular'), reg = m.reg, sd = m.saida, subs = lerCaminhos(m.ops);
  const P = sd.prisma;
  const nomes = P.arestas.filter((e) => e.oculta).map((e) => e.de + e.ate).sort().join(' ');
  ok(P.ocultas === 3 && P.visiveis === 6, 'tres ocultas e seis visiveis', P.ocultas + ' e ' + P.visiveis);
  ok(nomes === 'AC BC CF', 'as ocultas morrem em C, o vertice de tras da base', nomes);
  ok(conferirArestas('prisma triangular', P, subs), 'padrao e espessura conferem no fluxo');
  const cotas = reg.tracos.filter((t) => t.tipo === 'cota');
  medido('cotas: ' + cotas.map((c) => n2(dist({ x: c.x1, y: c.y1 }, { x: c.x2, y: c.y2 })) + ' pt').join(' e ') + '; lado AB ' + n2(dist(P.vertices.A, P.vertices.B)) + ' pt, altura AD ' + n2(dist(P.vertices.A, P.vertices.D)) + ' pt');
  ok(cotas.length === 2, 'duas cotas de seta');
  const lado = dist(P.vertices.A, P.vertices.B), alt = dist(P.vertices.A, P.vertices.D);
  medido('lado/altura na folha ' + (lado / alt).toFixed(4) + ', pedido 6/10 = 0,6000');
  ok(Math.abs(lado / alt - 0.6) < 1e-6, 'a proporcao lado por altura e a pedida: escala unica nos dois eixos');
  medido('marcas ativas: ' + reg.marcasAtivas + '; conferirFigura: ' + (reg.conferencia.length ? reg.conferencia.join(' | ') : 'limpo'));
  ok(reg.marcasAtivas === 2, 'duas marcas ativas');
}

console.log('');
console.log('semicirculo que vira cone');
{
  const m = achar('planificacao'), reg = m.reg, sd = m.saida, subs = lerCaminhos(m.ops);
  medido('setor de raio ' + sd.geratriz + ' e 180 graus: arco = ' + (Math.PI * sd.geratriz).toFixed(4) + '; cone r = ' + sd.raioCone + ', 2 pi r = ' + (2 * Math.PI * sd.raioCone).toFixed(4) + ', h = ' + sd.alturaCone.toFixed(4) + ' (5 raiz 3 = ' + (5 * Math.sqrt(3)).toFixed(4) + ')');
  ok(Math.abs(Math.PI * sd.geratriz - 2 * Math.PI * sd.raioCone) < 1e-9, 'o arco do setor mede a circunferencia da base');
  ok(Math.abs(sd.alturaCone - 5 * Math.sqrt(3)) < 1e-9, 'a altura sai 5 raiz de 3');
  const els = elipsesDe(subs);
  const arcoPlano = els.filter((e) => Math.abs(e.a - sd.geratriz * sd.escala) < 0.05 && !e.fechado);
  medido('arco do setor no fluxo: a ' + (arcoPlano[0] ? n2(arcoPlano[0].a) : '?') + ' b ' + (arcoPlano[0] ? n2(arcoPlano[0].b) : '?') + ' (semicirculo: b/a = 1, sem perspectiva)');
  ok(arcoPlano.length === 1 && Math.abs(arcoPlano[0].b / arcoPlano[0].a - 1) < 0.002, 'a planificacao nao tem perspectiva: o arco e de circunferencia');
  const baseCone = els.filter((e) => Math.abs(e.b / e.a - S.ACHATAMENTO) < 0.002);
  ok(baseCone.length === 2, 'e a base do cone montado tem as duas metades achatadas a 0,4', baseCone.length);
  const setas = reg.tracos.filter((t) => t.tipo === 'seta');
  ok(setas.length === 1, 'uma seta entre as duas partes');
  medido('marcas ativas: ' + reg.marcasAtivas + ' (' + reg.medido.textos.map((t) => t.txt).join(', ') + '); conferirFigura: ' + (reg.conferencia.length ? reg.conferencia.join(' | ') : 'limpo'));
  ok(reg.marcasAtivas === 5, 'cinco marcas, exatamente no teto');
  /* No fluxo a raiz sai pela fonte Symbol, byte 0xD6; o leitor do base.js
   * devolve ou o proprio "√" ou a letra O com trema, e as duas sao a mesma
   * tinta. Ver o comoSaiu. */
  const RAIZ = ['5√3', '5Ö3'];
  const vaos = [RAIZ, ['5']].map((alts) => [comoSaiu(reg, alts) || alts[0], vaoDaLetra(reg, alts)]);
  medido('vao da tinta ate a linha mais proxima: ' + vaos.map(([t, v]) => t + ' ' + n2(v)).join(', ') + ' pt');
  ok(!!comoSaiu(reg, RAIZ), 'a altura do cone montado esta impressa na folha, em alguma das grafias do Symbol',
    reg.medido.textos.map((t) => t.txt).join(' '));
  ok(vaos.every(([t, v]) => v >= S.FOLGA_COLADO), 'a altura e o raio do cone montado ficam a pelo menos ' + S.FOLGA_COLADO + ' pt de qualquer linha');
  const fora = PDFGen.caracteresQueNaoDesenha('10π 5√3');
  ok(!fora || fora.length === 0, 'pi e raiz desenham na fonte', fora && fora.join(' '));
}

console.log('');
console.log('a mesma composicao em ingles');
{
  const m = achar('cone triangulo en'), reg = m.reg;
  const textos = reg.medido.textos.map((t) => t.txt);
  medido('textos impressos: ' + textos.join(' '));
  ok(textos.indexOf('height') >= 0 && textos.indexOf('slant') >= 0 && !textos.some((t) => /altura|geratriz|raio/.test(t)), 'nenhuma palavra portuguesa sobrou: o texto e todo do parametro');
  /* A palavra longa e o caso que exercita a BUSCA de posicao, e nao so a
   * primeira posicao da lista: "height" nao cabe a meia altura e a busca a
   * empurra para 0,7 do eixo, onde o cone ja alargou. */
  const rh = reg.rotulos.filter((t) => t.texto === 'height')[0];
  medido('"height" mede ' + n2(reg.medido.textos.filter((t) => t.txt === 'height')[0].largura) + ' pt e ficou a ' +
    rh.em + ' de V ate O (primeiro candidato ' + S.EM_ALTURA_CONE[0] + '); vao ate a linha mais proxima ' + n2(vaoDaLetra(reg, 'height')) + ' pt');
  ok(rh.em !== S.EM_ALTURA_CONE[0], 'a busca recusou o primeiro candidato e escolheu outro: o ramo de recusa do emLivre roda de verdade');
  ok(vaoDaLetra(reg, 'height') >= S.FOLGA_COLADO, 'e a palavra escolhida fica a pelo menos ' + S.FOLGA_COLADO + ' pt de qualquer linha');
}

console.log('');
console.log('letra colada que NAO cabe: desiste de ser colada e foge com fio');
/* Os cartoes acima usam proporcoes em que a letra colada cabe, e por isso nao
 * distinguiam uma busca viva de uma busca morta. Estes dois sao esbeltos de
 * proposito (cone 3 por 20, piramide 6 por 24): neles NENHUMA das posicoes da
 * linha fica livre, e e ai que se ve o que a cadeia faz quando desiste.
 *
 * A resposta ja foi outra duas vezes, e as duas saem na folha:
 *
 *   desistir calado    devolvia o primeiro candidato e imprimia a letra em cima
 *                      do traco (medido: -0,60 pt), com a conferencia limpa.
 *   desistir falando   passou a escolher o candidato de maior vao e a avisar
 *                      com o vao e o piso. A folha ganhou voz, mas a letra
 *                      continuou saindo por cima do traco, e o aviso acendia
 *                      doze vezes na folha do _prova_receitas_solidos.
 *
 * Hoje ela nao desiste de escrever, desiste de ser COLADA: cai para o rotulo
 * com halo do desenho.js, que foge, liga o fio de chamada ate o ponto que
 * nomeia e so fala quando nem assim ha lugar. Entao o que esta secao cobra
 * mudou de lado: a letra tem que sair ACIMA do piso, com fio, e sem aviso
 * nenhum. As tres conferencias do bloco falham na versao de antes.
 *
 * Fica num Doc de rascunho, como a secao de recusas, so porque estes cartoes
 * nao entram na folha de prova. */
{
  const d = new PDFGen.Doc(); d.novaPagina();
  const cone = S.coneComTriangulo(d, {
    dims: { raio: 3, altura: 20 }, rotulos: { raio: '3', altura: '20', geratriz: 'g' },
    bloco: { x: MARG_E, largura: LARG, altura: 160 }
  });
  const pir = S.piramideComTriangulo(d, {
    dims: { aresta: 6, altura: 24 }, rotulos: { altura: '24', apotemaBase: 'a', apotema: 'g' },
    bloco: { x: MARG_E, largura: LARG, altura: 160 }
  });
  const avisos = d.avisosFigura || [];
  const casos = [[cone, '20'], [cone, '3'], [pir, '24'], [pir, 'a']];
  const rot = (reg, t) => reg.rotulos.filter((x) => x.texto === t)[0] || {};
  const vaos = casos.map(([reg, t]) => [t, vaoDaLetra(reg, t)]);
  medido('vao da tinta de cada letra: ' + vaos.map(([t, v]) => t + ' ' + n2(v)).join(', ') +
    ' pt, contra o piso de ' + S.FOLGA_COLADO + ' (antes: -0,60, -0,30, -0,60, -0,25)');
  medido('fuga de cada uma: ' + casos.map(([reg, t]) => t + ' desviou ' + n2(rot(reg, t).desviou || 0) +
    ' pt, fio ' + (rot(reg, t).chamada ? 'sim' : 'nao')).join('; '));
  medido('avisos: ' + (avisos.length ? avisos.join(' | ') : 'nenhum'));
  ok(casos.every(([reg, t]) => rot(reg, t).coubeColado === false),
    'premissa: nestas proporcoes nenhuma das posicoes da linha fica livre para as quatro letras');
  ok(casos.every(([reg, t]) => rot(reg, t).caiuParaHalo === true && (rot(reg, t).desviou || 0) > 0 && rot(reg, t).chamada === true),
    'as quatro desistem de ser coladas, fogem com o halo e ficam ligadas por fio de chamada');
  ok(vaos.every(([t, v]) => v >= S.FOLGA_COLADO),
    'e a tinta que a folha imprime fica acima do piso de ' + S.FOLGA_COLADO + ' pt, em vez de sobre o traco');
  ok(avisos.length === 0, 'e a cadeia nao precisa avisar nada: a letra achou lugar', avisos.length + ' aviso(s)');
  /* A busca de posicao continua viva e continua escolhendo, e isto se ve mesmo
   * agora que ninguem fala: no cone de raio 6 e altura 12 a palavra "height"
   * reprova nas quatro posicoes e a queda para o halo parte da MENOS ruim (0,7
   * do eixo), que nao e a primeira da lista (0,5). Partir do menos ruim e o que
   * deixa a fuga andar o minimo. */
  const d2 = new PDFGen.Doc(); d2.novaPagina();
  const magro = S.coneComTriangulo(d2, {
    dims: { raio: 6, altura: 12 }, rotulos: { raio: 'r', altura: 'height', geratriz: 'slant' },
    bloco: { x: MARG_E, largura: LARG, altura: 150 }
  });
  const rh = magro.rotulos.filter((t) => t.texto === 'height')[0];
  const rr = magro.rotulos.filter((t) => t.texto === 'r')[0];
  medido('cone 6 por 12 com "height": nenhuma posicao livre, partiu de ' + rh.em + ' de V ate O; candidatos ' +
    S.EM_ALTURA_CONE.join(' ') + '; desviou ' + n2(rh.desviou || 0) + ' pt e a tinta ficou a ' + n2(vaoDaLetra(magro, 'height')) + ' pt da linha');
  medido('no mesmo cartao o "r" cabe colado, em ' + rr.em + ', e a ' + n2(vaoDaLetra(magro, 'r')) + ' pt da linha');
  ok(rh.em === S.EM_ALTURA_CONE[S.EM_ALTURA_CONE.length - 1] && rh.em !== S.EM_ALTURA_CONE[0],
    'a queda parte do candidato de maior vao, e nao do primeiro da lista', 'em = ' + rh.em);
  ok(rh.caiuParaHalo === true && rr.coubeColado === true && !rr.chamada,
    'e no MESMO cartao a palavra longa foge enquanto a letra curta continua colada, sem fio');
  ok((d2.avisosFigura || []).length === 0, 'sem aviso nenhum nos dois casos', (d2.avisosFigura || []).length + ' aviso(s)');
}

console.log('');
console.log('letra colada que nao cabe nem fugindo: ai sim a folha fala');
/* O degrau de baixo, e o unico que ainda avisa. A piramide de aresta 6 por
 * altura 24 e a mesma de cima, mas o bloco tem 90 pt em vez de 249: a fuga do
 * halo e obrigada a caber dentro do bloco, e um texto de quase 61 pt de tinta
 * nao acha lugar nenhum la dentro. Quem fala e o rotulo() do desenho.js, com a
 * tarja estreita, uma vez so. Na MESMA figura o "24", que e curto, nao cabe
 * colado e foge calado: o que decide nao e a proporcao nem a largura do bloco
 * sozinhas, e o tamanho do texto contra o lugar que sobra. */
{
  const d = new PDFGen.Doc(); d.novaPagina();
  const pir = S.piramideComTriangulo(d, {
    dims: { aresta: 6, altura: 24 }, rotulos: { altura: '24', apotemaBase: 'apotemadabase', apotema: 'g' },
    bloco: { x: MARG_E, largura: 90, altura: 160 }
  });
  const avisos = d.avisosFigura || [];
  const rot = (t) => pir.rotulos.filter((x) => x.texto === t)[0] || {};
  medido('"apotemadabase" mede ' + n2(PDFGen.medir('apotemadabase', 8.5, false)) + ' pt num bloco de 90 pt e saiu ' +
    (rot('apotemadabase').tarja ? 'em tarja estreita' : 'com halo inteiro') + '; "24" desviou ' + n2(rot('24').desviou || 0) + ' pt sem tarja');
  medido('avisos: ' + (avisos.length ? avisos.join(' | ') : 'nenhum'));
  ok(rot('apotemadabase').coubeColado === false && rot('apotemadabase').tarja === true,
    'o texto longo nao cabe colado nem acha lugar para o halo, e sai na tarja estreita');
  ok(avisos.length === 1 && /apotemadabase.*nao ha posicao livre para o halo.*tarja estreita/.test(avisos[0]),
    'e a folha fala uma vez so, pelo aviso do desenho.js, nomeando o texto', avisos.join(' | ') || 'nenhum');
  ok(rot('24').caiuParaHalo === true && !rot('24').tarja,
    'enquanto o rotulo curto da mesma figura foge calado, sem tarja');
}

console.log('');
console.log('teto de cinco marcas, figura por figura');
{
  const todas = doc.figurasDesenhadas || [];
  const lista = todas.map((r) => r.marcasAtivas);
  medido(todas.length + ' figuras: ' + lista.join(' '));
  ok(lista.every((n) => n <= 5), 'nenhuma figura passa de cinco marcas ativas (maximo ' + Math.max(...lista) + ')');
}

console.log('');
console.log('recusas');
{
  const d = new PDFGen.Doc(); d.novaPagina();
  const r1 = S.cone(d, { x: 100, y: 100 }, { raio: -3, altura: 10 }, {});
  const r2 = S.prisma(d, { x: 100, y: 100 }, { aresta: 0, altura: 10 }, {});
  const r3 = S.esfera(d, { x: 100, y: 100 }, {}, {});
  const r4 = S.planificacaoDoCone(d, { dims: { raio: 10, angulo: 360 } });
  const r5 = S.painelDeSolidos(d, { nomes: ['a', 'b'] });
  const avisos = d.avisosFigura || [];
  ok(r1 === null && r2 === null && r3 === null && r4 === null, 'raio negativo, aresta zero, esfera sem raio e setor de 360 graus nao desenham');
  ok(avisos.some((a) => a.indexOf('cone com dimensoes invalidas') >= 0) && avisos.some((a) => a.indexOf('planificacaoDoCone') >= 0), 'e avisam com nome');
  ok(r5 !== null && avisos.some((a) => a.indexOf('5 solido(s) para 2 nome(s)') >= 0), 'painel com nomes de menos desenha e avisa que faltou nome');
  medido('avisos do rascunho: ' + avisos.length);
}

console.log('');
console.log('estado grafico');
function conferirEstado() {
  const problemas = [];
  for (let i = 0; i < doc.paginas.length; i++) {
    let prof = 0;
    const ops = doc.paginas[i].ops;
    for (let j = 0; j < ops.length; j++) {
      const s = ops[j];
      if (s.indexOf('BT ') === 0) continue;
      for (const k of s.split(/\s+/)) {
        if (k === 'q') prof++;
        else if (k === 'Q') { prof--; if (prof < 0) { problemas.push('pagina ' + (i + 1) + ': Q sem q'); prof = 0; } }
        else if (k === 'd' && prof === 0) problemas.push('pagina ' + (i + 1) + ': tracejado fora de envelope');
        else if ((k === 'W' || k === 'W*') && prof === 0) problemas.push('pagina ' + (i + 1) + ': recorte fora de envelope');
      }
    }
    if (prof !== 0) problemas.push('pagina ' + (i + 1) + ': ' + prof + ' q sem Q');
  }
  return problemas;
}
const vaz = conferirEstado();
ok(vaz.length === 0, 'todo q tem o seu Q e nenhum d sai de envelope', vaz.join(' | '));
const avisos = doc.avisosFigura || [];
console.log('avisos das primitivas na folha: ' + avisos.length);
for (const a of avisos) console.log('  . ' + a);
ok(avisos.length === 0, 'nenhuma primitiva reclamou');

console.log('');
console.log(passou + ' conferencias passaram, ' + falhou + ' falharam.');
console.log('paginas: ' + doc.paginas.length + '   figuras: ' + (doc.figurasDesenhadas || []).length);
console.log(saida);
process.exitCode = falhou ? 1 : 0;
