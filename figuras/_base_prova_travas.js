/* figuras/_base_prova_travas.js
 * Folha de prova do base.js: o aviso de escala que deixou de nascer dentro do
 * desenhador, e as travas do conferirFigura.
 *
 * Duas regras valem aqui e as duas existem porque prova que passa sempre e pior
 * do que prova nenhuma:
 *
 *   1. Toda trava e provada NOS DOIS SENTIDOS. O mesmo par de figuras sai com o
 *      defeito e sem ele, e a trava tem que acusar a primeira e ficar calada na
 *      segunda. Uma trava que so foi vista acusando pode estar acusando tudo.
 *
 *   2. O aviso de escala e conferido por FORA, nos bytes do PDF terminado, e nao
 *      pelo registro que o proprio base.js devolve. Se a conferencia usasse a
 *      mesma leitura que o conserto usa, ela concordaria com o conserto por
 *      construcao. Aqui ela le a folha, que e o que a aluna recebe.
 *
 * Regra da casa: nunca usar travessao.
 */
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');
const B = require('./base.js');
const M = require('./marcas.js');
const D = require('./desenho.js');
const COR = PDFGen.COR;
const geo = B.geo;

let ok = 0, mau = 0;
function conf(rotulo, obtido, esperado) {
  const bom = String(obtido) === String(esperado);
  if (bom) ok++; else mau++;
  console.log((bom ? '  OK    ' : '  FALHA ') + rotulo +
    (bom ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function contem(lista, trecho) {
  return (lista || []).some(function (s) { return String(s).indexOf(trecho) >= 0; });
}

/* ================================================================ parte 1
 *
 * O "Figura fora de escala." era a UNICA frase em portugues do kit inteiro que
 * saia impressa na folha, e ela nascia dentro do medidaDoBloco. A folha em
 * ingles saia com ela e nenhuma conferencia de conta pegava, porque conta nao
 * tem lingua. */

console.log('parte 1: o aviso de escala vem do tema, nunca do desenhador\n');

function folhaDe(bruto, op) {
  const doc = new PDFGen.Doc();
  doc.novaPagina();
  doc.texto('prova do aviso de escala', PDFGen.MARG_E, doc.y, { tam: 9, cor: COR.muted });
  doc.y -= 14;
  const r = doc.figura(B.lerDiretiva(bruto), op || {});
  return { doc: doc, registro: r, bytes: doc.finalizar() };
}

/* Sem legenda na diretiva: o desenhador RECUSA inventar a frase. */
const semLegenda = folhaDe('@fig triangulo angulo=3x+10 angulo=61 angulo=52');
conf('a figura sai mesmo assim', !!semLegenda.registro, true);
conf('e ela sabe que esta fora de escala', semLegenda.registro.foraDeEscala, true);
conf('mas o desenhador nao inventa legenda', semLegenda.registro.legenda, 'null');
conf('e reprova o tema, uma vez so',
  (semLegenda.doc.avisosFigura || []).filter(function (a) {
    return a.indexOf('fora de escala sem legenda') >= 0;
  }).length, 1);

/* O auditor independente: le os BYTES da folha terminada, sem passar por nada
 * que este arquivo consertou. */
function achouNaFolha(bytes, frase) {
  return Buffer.from(bytes).toString('latin1').indexOf(frase) >= 0;
}
conf('e a frase portuguesa nao esta na folha impressa',
  achouNaFolha(semLegenda.bytes, 'fora de escala'), false);

/* Com legenda na diretiva, nada mudou para quem ja passava legenda=. E o mesmo
 * auditor, na mesma folha, ACHA a frase: sem isto a conferencia acima poderia
 * estar passando por nao saber procurar. */
const comLegenda = folhaDe('@fig triangulo angulo=3x+10 angulo=61 angulo=52 legenda=Figure not to scale.');
conf('quem passa legenda= continua com a legenda dele',
  comLegenda.registro.legenda, 'Figure not to scale.');
conf('e ela sai impressa na folha', achouNaFolha(comLegenda.bytes, 'Figure not to scale.'), true);
conf('sem sobrar o aviso de legenda faltando',
  contem(comLegenda.doc.avisosFigura, 'fora de escala sem legenda'), false);

/* A reserva de folha acompanha: legenda que nao sai nao pode ocupar altura. */
const medSem = B.medidaDoBloco({ foraDeEscala: true });
const medCom = B.medidaDoBloco({ foraDeEscala: true, legenda: 'Figure not to scale.' });
conf('sem legenda o bloco nao reserva linha de legenda', medSem.alturaLegenda, 0);
conf('com legenda ele reserva', medCom.alturaLegenda > 0, true);
conf('e a medida denuncia a falta para quem for reprovar', medSem.faltaAvisoDeEscala, true);
conf('e nao denuncia quando o tema escreveu a frase', medCom.faltaAvisoDeEscala, false);

/* ================================================================ parte 2
 *
 * As travas. Cada caso desenha a MESMA figura duas vezes, com o defeito e sem
 * ele, na mesma pagina, para o par tambem poder ser olhado impresso. */

console.log('\nparte 2: as travas do conferirFigura\n');

const doc = new PDFGen.Doc();
doc.novaPagina();
const UTIL = PDFGen.MARG_D - PDFGen.MARG_E;
const LARG = UTIL / 2 - 10;
let col = 0, linhaY = doc.y;

function cartao(titulo, desenhar, op) {
  const x = PDFGen.MARG_E + col * (LARG + 20);
  doc.y = linhaY;
  doc.texto(titulo, x, doc.y, { tam: 7, cor: COR.muted });
  doc.y -= 9;
  const r = B.figura(doc, Object.assign({
    x: x, largura: LARG, altura: 150, folga: 26, conferir: true
  }, op || {}), desenhar);
  const fim = doc.y;
  col++;
  if (col === 2) { col = 0; linhaY = fim - 10; }
  else doc.y = linhaY;
  return r;
}
function parDeCasos(nome, trecho, comDefeito, semDefeito, op) {
  const mau2 = cartao(nome + ': com o defeito', comDefeito, op);
  const bom2 = cartao(nome + ': sem o defeito', semDefeito, op);
  conf(nome + ': acusa com o defeito', contem(mau2.conferencia, trecho), true);
  conf(nome + ': fica quieta sem ele', contem(bom2.conferencia, trecho), false);
  return [mau2, bom2];
}

/* ------------------------------------------------ (e) texto nascido no desenho */
const FRASE = 'Figura fora de escala.';
parDeCasos('(e) texto nascido no desenhador', 'nao veio do tema',
  function (ctx) {
    ctx.contorno(function () { D.poligono(ctx, triangulo(ctx), { fechado: true }); });
    ctx.rotulos(function () { D.rotulo(ctx, FRASE, centro(ctx), { tam: 8.5 }); });
  },
  function (ctx) {
    ctx.contorno(function () { D.poligono(ctx, triangulo(ctx), { fechado: true }); });
    ctx.rotulos(function () { D.rotulo(ctx, FRASE, centro(ctx), { tam: 8.5 }); });
  },
  null
);
/* O par acima usa a MESMA frase nos dois lados de proposito: o que muda nao e a
 * frase, e de onde ela veio. Como o cartao nao aceita opcoes diferentes por
 * lado, o lado limpo e refeito aqui com a frase declarada pelo tema. */
const vindaDoTema = cartao('(e) a mesma frase, vinda do tema', function (ctx) {
  ctx.contorno(function () { D.poligono(ctx, triangulo(ctx), { fechado: true }); });
  ctx.rotulos(function () { D.rotulo(ctx, FRASE, centro(ctx), { tam: 8.5 }); });
}, { legenda: FRASE });
conf('(e) a mesma palavra passa quando o tema a escreveu',
  contem(vindaDoTema.conferencia, 'nao veio do tema'), false);

/* ------------------------------------------------ (a) valor de angulo sem arco */
parDeCasos('(a) valor de angulo sem arco', 'saiu solto na figura, sem arco',
  function (ctx) {
    const P = triangulo(ctx);
    ctx.contorno(function () { D.poligono(ctx, P, { fechado: true }); });
    ctx.rotulos(function () { D.rotulo(ctx, '50°', P[0], { tam: 8.5, direcao: { x: 0.3, y: 0.9 }, afastamento: 10 }); });
  },
  function (ctx) {
    const P = triangulo(ctx);
    ctx.contorno(function () { D.poligono(ctx, P, { fechado: true }); });
    ctx.marcas(function () { M.marcaAngulo(ctx.doc, P[0], P[1], P[2], { rotulo: '50°', ctx: ctx }); });
  }
);

/* ------------------------------------------------ (a) cruzamento sem arco */
parDeCasos('(a) cruzamento nomeado sem arco', 'cruzamento nomeado das construcoes',
  function (ctx) { cruzamento(ctx, false); },
  function (ctx) { cruzamento(ctx, true); }
);

/* ------------------------------------------------ (b) codigo de gabarito */
const codigo = function (ctx) {
  const P = triangulo(ctx);
  ctx.contorno(function () { D.poligono(ctx, P, { fechado: true }); });
  /* Cru de proposito: o desenho.js ja recusa teal fora do gabarito, e a trava
   * precisa valer para QUALQUER caminho que chegue ao fluxo, inclusive o que
   * nao passa por ele. */
  ctx.marcas(function () {
    B.comEstado(ctx.doc, { cor: COR.teal, espessura: 0.6, tracejado: 'auxiliar' }, function () {
      ctx.doc.op(P[0].x.toFixed(2) + ' ' + P[0].y.toFixed(2) + ' m ' +
        P[1].x.toFixed(2) + ' ' + P[1].y.toFixed(2) + ' l S');
    });
  });
};
const bMau = cartao('(b) teal tracejado no enunciado', codigo, { fase: 'enunciado' });
const bBom = cartao('(b) o mesmo traco no gabarito', codigo, { fase: 'gabarito' });
conf('(b) acusa o codigo de gabarito na fase de enunciado',
  contem(bMau.conferencia, 'codigo reservado a camada de gabarito'), true);
conf('(b) e aceita o mesmo traco na fase de gabarito',
  contem(bBom.conferencia, 'codigo reservado a camada de gabarito'), false);

/* ------------------------------------------------ (c) marcas perto demais */
parDeCasos('(c) tracinhos perto demais', 'os tracinhos de congruencia',
  function (ctx) { ladoMarcado(ctx, 'traco', 2.5); },
  function (ctx) { ladoMarcado(ctx, 'traco', M.FOLGA_TRACO); }
);
parDeCasos('(c) setas de paralelismo perto demais', 'as pontas de seta de paralelismo',
  function (ctx) { ladoMarcado(ctx, 'seta', 3.5); },
  function (ctx) { ladoMarcado(ctx, 'seta', M.FOLGA_SETA); }
);

/* ------------------------------------------------ (c) arcos perto demais */
parDeCasos('(c) dois arcos no mesmo vertice', 'dois arcos no mesmo vertice',
  function (ctx) { doisArcos(ctx, 12, 14); },
  function (ctx) { doisArcos(ctx, 12, 20); }
);

/* ------------------------------------------------ (d) ordem invertida */
parDeCasos('(d) a figura inverte a ordem', 'inverte a ordem da resposta',
  function (ctx) { paralelogramo(ctx, true); },
  function (ctx) { paralelogramo(ctx, false); },
  { foraDeEscala: true, legenda: 'Figure not to scale.' }
);

/* ------------------------------------------------ pisos de espessura e de tinta */
parDeCasos('piso de espessura', 'abaixo do piso de 0.6',
  function (ctx) { risco(ctx, 0.4, COR.texto); },
  function (ctx) { risco(ctx, 0.6, COR.texto); }
);
parDeCasos('piso de contraste', 'de contraste contra o branco',
  function (ctx) { risco(ctx, 1.2, COR.fio); },
  function (ctx) { risco(ctx, 1.2, COR.texto); }
);
parDeCasos('piso de corpo', 'abaixo do corpo minimo',
  function (ctx) { numeroSolto(ctx, 6.5); },
  function (ctx) { numeroSolto(ctx, 8.5); }
);

/* ------------------------------------------------ helpers de figura */
function triangulo(ctx) {
  const c = ctx.caixa;
  return [
    { x: c.x + 10, y: c.y + 8 },
    { x: c.x + c.largura - 10, y: c.y + 8 },
    { x: c.x + c.largura * 0.42, y: c.y + c.altura - 8 }
  ];
}
function centro(ctx) {
  return { x: ctx.caixa.x + ctx.caixa.largura / 2, y: ctx.caixa.y + ctx.caixa.altura / 2 };
}
function cruzamento(ctx, comArco) {
  const P = triangulo(ctx);
  const I = geo.centroide(P);
  ctx.contorno(function () { D.poligono(ctx, P, { fechado: true }); });
  ctx.marcas(function () {
    D.poligono(ctx, [P[1], geo.pontoNoSegmento(P[0], P[2], 0.5)], { fechado: false, papel: 'ceviana' });
    D.poligono(ctx, [P[2], geo.pontoNoSegmento(P[0], P[1], 0.5)], { fechado: false, papel: 'ceviana' });
    if (comArco) M.marcaAngulo(ctx.doc, I, P[1], P[2], { rotulo: 'x', raio: 13, ctx: ctx });
  });
  ctx.rotulos(function () { D.ponto(ctx, I, { rotulo: 'I' }); });
}
function ladoMarcado(ctx, tipo, folga) {
  const c = ctx.caixa;
  const P = { x: c.x + 6, y: c.y + c.altura / 2 };
  const Q = { x: c.x + c.largura - 6, y: c.y + c.altura / 2 };
  ctx.contorno(function () { D.poligono(ctx, [P, Q], { fechado: false }); });
  ctx.marcas(function () {
    M.marcaLado(ctx.doc, P, Q, { n: 3, tipo: tipo, folga: folga, ctx: ctx });
  });
}
function doisArcos(ctx, r1, r2) {
  const c = ctx.caixa;
  const V = { x: c.x + 12, y: c.y + 12 };
  const A = { x: c.x + c.largura - 10, y: c.y + 12 };
  const meio = { x: V.x + 70, y: V.y + 70 };
  const alto = { x: V.x, y: c.y + c.altura - 10 };
  ctx.contorno(function () {
    D.poligono(ctx, [A, V, alto], { fechado: false });
  });
  ctx.marcas(function () {
    M.marcaAngulo(ctx.doc, V, A, meio, { raio: r1, ctx: ctx });
    M.marcaAngulo(ctx.doc, V, A, alto, { raio: r2, ctx: ctx });
  });
}
function paralelogramo(ctx, invertido) {
  const c = ctx.caixa;
  const base = 118, lado = 62, g = 62 * Math.PI / 180;
  const P = [
    { x: c.x + 8, y: c.y + 14 },
    { x: c.x + 8 + base, y: c.y + 14 },
    { x: c.x + 8 + base + lado * Math.cos(g), y: c.y + 14 + lado * Math.sin(g) },
    { x: c.x + 8 + lado * Math.cos(g), y: c.y + 14 + lado * Math.sin(g) }
  ];
  ctx.contorno(function () { D.poligono(ctx, P, { fechado: true }); });
  ctx.marcas(function () {
    /* O vertice 0 mede 62 graus na folha e o vertice 1 mede 118. Resolvido o
     * sistema (3x+10 mais 2x+20 igual a 180), 3x+10 vale 100 e 2x+20 vale 80:
     * pendurar o 3x+10 no vertice de 62 e desenhar a resposta ao contrario. */
    M.marcaAngulo(ctx.doc, P[0], P[1], P[3], { rotulo: invertido ? '3x+10' : '2x+20', ctx: ctx });
    M.marcaAngulo(ctx.doc, P[1], P[2], P[0], { rotulo: invertido ? '2x+20' : '3x+10', ctx: ctx });
  });
}
function risco(ctx, espessura, cor) {
  const c = ctx.caixa;
  ctx.contorno(function () {
    B.comEstado(ctx.doc, { cor: cor, espessura: espessura }, function () {
      ctx.doc.op((c.x + 6).toFixed(2) + ' ' + (c.y + c.altura / 2).toFixed(2) + ' m ' +
        (c.x + c.largura - 6).toFixed(2) + ' ' + (c.y + c.altura / 2).toFixed(2) + ' l S');
    });
  });
}
function numeroSolto(ctx, tam) {
  const P = triangulo(ctx);
  ctx.contorno(function () { D.poligono(ctx, P, { fechado: true }); });
  ctx.marcas(function () { M.marcaAngulo(ctx.doc, P[0], P[1], P[2], { rotulo: '50°', tam: tam, ctx: ctx }); });
  ctx.rotulos(function () {
    ctx.doc.texto('7', ctx.caixa.x + ctx.caixa.largura / 2, ctx.caixa.y + 4, { tam: tam });
  });
}

/* ================================================================ a folha */

const bytes = doc.finalizar();
const saida = path.join(__dirname, '_base_prova_travas.pdf');
fs.writeFileSync(saida, bytes);
console.log('\nPDF: ' + saida + '  (' + Math.round(bytes.length / 1024) + ' KB), ' +
  doc.paginas.length + ' paginas');

/* A folha de prova desenha defeito de proposito, entao ela tem avisos. O que
 * nao pode e um q sem Q: isso vaza para o resto da folha. */
let desbalanceada = 0;
(doc.paginas || []).forEach(function (pag) {
  let nivel = 0;
  (pag.ops || []).forEach(function (o) {
    const s = String(o);
    if (/(^|\s)q(\s|$)/.test(s)) nivel++;
    if (/(^|\s)Q(\s|$)/.test(s)) nivel--;
  });
  if (nivel !== 0) desbalanceada++;
});
conf('todo q tem o seu Q', desbalanceada, 0);

console.log('\n' + ok + ' conferencias passaram, ' + mau + ' falharam.');
process.exit(mau ? 1 : 0);
