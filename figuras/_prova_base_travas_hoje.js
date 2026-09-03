/* figuras/_prova_base_travas_hoje.js
 * As travas do conferirFigura que mudaram em 02/09/2026, provadas pelo canal
 * que elas LEEM: o registro (ctx.anota) e o fluxo do PDF.
 *
 * Cada caso tem os dois lados, porque trava que so foi vista acusando pode estar
 * acusando tudo:
 *   1. letra minuscula sozinha: r, d, a, b, c, p, h nao sao angulo; x, alfa,
 *      beta e theta sao. E o x sozinho so conta quando a diretiva declarou
 *      incognita= (senao e nome de eixo);
 *   2. distancia entre arcos e analitica (centro, raio, inicio, varrido), nao
 *      entre ancoras de Bezier; arco destacado SOBRE a circunferencia (mesmo
 *      centro e raio, um deles inteiro) nao e "dois arcos no mesmo vertice";
 *      duas circunferencias INTEIRAS quase coincidentes sao; dois arcos
 *      parciais de raios 20 e 23 continuam medidos a 3,00 pt;
 *   3. cruzamento nomeado: traco que PASSA pelo ponto conta, traco que TERMINA
 *      nele (raio focal em P) nao, e o mesmo X no papel conta igual, venha ele
 *      de dois segmentos soltos ou de duas polilinhas com o ponto no meio.
 *
 * Nada aqui e conferido no nivel da funcao pura. A primeira versao provava o
 * alfabeto grego chamando B.expressaoLinear('θ') direto, e essa string nunca
 * chega ao conferirFigura: o pdf.js manda alfa, beta e teta para a base-14
 * /Symbol e o fluxo entrega os BYTES de "a", "b" e "q". O caso ficava verde
 * enquanto a trava estava cega para as tres gregas, que e pior do que nao ter
 * prova nenhuma, porque quem le o verde conclui que alfa e teta estao cobertos.
 *
 * Roda com: node figuras/_prova_base_travas_hoje.js
 *
 * Regra da casa: nunca usar travessao.
 */
const path = require('path');
const B = require(path.join(__dirname, 'base.js'));
const M = require(path.join(__dirname, 'marcas.js'));
const D = require(path.join(__dirname, 'desenho.js'));
const P = require(path.join(__dirname, '..', 'pdf.js'));
const geo = B.geo;

let ok = 0, mau = 0;
function conf(rotulo, obtido, esperado) {
  const passou = String(obtido) === String(esperado);
  if (passou) ok++; else mau++;
  console.log((passou ? '  OK    ' : '  FALHA ') + rotulo +
    (passou ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
/* A diretiva entra por doc.figuraDaVez, que e como o pdf.js a entrega. */
function figura(diretiva, desenhar) {
  const doc = new P.Doc();
  doc.novaPagina();
  doc.figuraDaVez = { bruto: diretiva, args: {} };
  const r = B.figura(doc, { x: 40, largura: 250, altura: 160, id: 'p' }, desenhar);
  doc.finalizar();
  return { conf: (r.conferencia || []).map(String), r: r };
}
const conta = (f, re) => f.conf.filter(x => re.test(x));
function traco(ctx, a, b) {
  D.poligono(ctx.doc, [a, b], {});
  ctx.anota('traco', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, papel: 'construcao' });
}
function pontoNomeado(ctx, q, nome) {
  ctx.anota('ponto', { tipo: 'ponto', x: q.x, y: q.y, rotulo: nome });
}
/* Pelo caminho de verdade: o D.poligono e quem anota, um traco por aresta. E
 * dai que vem a diferenca entre o X de dois segmentos e o X de duas polilinhas. */
function construcao(ctx, pts) {
  D.poligono(ctx, pts, { fechado: false, papel: 'ceviana' });
}

console.log('=== 1. letras, medidas no fluxo ===');
/* Uma letra solta no meio do triangulo, sem arco nenhum, com incognita=
 * declarada na diretiva. E o rotulo passa pelo desenhador de verdade, entao o
 * que a trava le e o que a folha imprime. */
function letraSolta(letra) {
  return figura('@fig triangulo angulo=52 incognita=C', function (ctx) {
    const pts = ctx.pontos(geo.trianguloPorAngulos(52, 61, 100));
    ctx.contorno(function () { D.poligono(ctx.doc, pts, {}); });
    ctx.marcas(function () {
      D.rotulo(ctx.doc, letra, {
        x: (pts[0].x + pts[1].x + pts[2].x) / 3,
        y: (pts[0].y + pts[1].y + pts[2].y) / 3
      }, { ctx: ctx });
    });
  });
}
const acusada = (s) => conta(letraSolta(s), /solto na figura, sem arco/).length > 0;

const comprimentos = ['r', 'd', 'a', 'b', 'c', 'p', 'y', 'h'].filter(acusada);
conf('nenhuma letra de comprimento e lida como angulo',
  comprimentos.join(' ') || 'nenhuma', 'nenhuma');
const cegas = ['x', 'α', 'β', 'θ'].filter(s => !acusada(s));
conf('x e as tres gregas soltas, sem arco, sao todas acusadas',
  cegas.join(' ') || 'nenhuma', 'nenhuma');
/* O que a trava LE tem que ser o caractere da folha e nao o byte da Symbol:
 * sem a traducao no lerFluxo, teta chega aqui como "q" e cai na lista das
 * letras de comprimento. */
conf('o fluxo entrega o caractere grego, nao o byte da Symbol',
  letraSolta('θ').r.medido.textos.map(t => t.txt).join(''), 'θ');
{
  const f = figura('@fig circulo raio=3', function (ctx) {
    const C = ctx.p({ x: 3, y: 3 });
    ctx.contorno(function () { D.circunferencia(ctx.doc, C, 40, {}); });
    ctx.marcas(function () { D.rotulo(ctx.doc, 'r', { x: C.x + 20, y: C.y + 12 }, { ctx: ctx }); });
  });
  conf('"r" num circulo nao e valor solto', conta(f, /solto na figura, sem arco/).length, 0);
}
{
  const f = figura('@fig conica tipo=parabola eixos=sim', function (ctx) {
    const O = ctx.p({ x: 3, y: 3 });
    ctx.contorno(function () { D.poligono(ctx.doc, [{ x: O.x - 60, y: O.y }, { x: O.x + 60, y: O.y }], {}); });
    ctx.marcas(function () { D.rotulo(ctx.doc, 'x', { x: O.x + 70, y: O.y }, { ctx: ctx }); });
  });
  conf('"x" como nome de eixo, sem incognita= na diretiva, nao e acusado', conta(f, /solto na figura, sem arco/).length, 0);
}
{
  const f = figura('@fig circulo raio=6 arco=60 incognita=α', function (ctx) {
    const C = ctx.p({ x: 3, y: 3 });
    ctx.contorno(function () { D.circunferencia(ctx.doc, C, 40, {}); });
    ctx.marcas(function () {
      M.marcaAngulo(ctx.doc, C, { x: C.x + 40, y: C.y }, { x: C.x + 20, y: C.y + 34.6 },
        { rotulo: 'α', raio: 18, ctx: ctx });
    });
  });
  conf('alfa NO arco dele continua passando', conta(f, /solto na figura, sem arco/).length, 0);
}

console.log('=== 2. arcos ===');
function arcoSobre(de) {
  return figura('@fig circulo raio=3 arco=60', function (ctx) {
    const C = ctx.p({ x: 3, y: 3 });
    ctx.contorno(function () { D.circunferencia(ctx.doc, C, 36.8, {}); });
    ctx.marcas(function () { D.arco(ctx.doc, C, 36.8, 36.8, de, de + 60, { espessura: 0.9 }); });
  });
}
conf('arco de 60 a partir de 85 sobre a circunferencia (ancora a 90): nao reprova', conta(arcoSobre(85), /dois arcos no mesmo vertice/).length, 0);
conf('arco de 60 a partir de 20 sobre a circunferencia: nao reprova', conta(arcoSobre(20), /dois arcos no mesmo vertice/).length, 0);
{
  const f = figura('@fig triangulo angulo=52 angulo=61', function (ctx) {
    const pts = ctx.pontos(geo.trianguloPorAngulos(52, 61, 100));
    ctx.contorno(function () { D.poligono(ctx.doc, pts, {}); });
    ctx.marcas(function () {
      M.marcaAngulo(ctx.doc, pts[0], pts[1], pts[2], { raio: 20, ctx: ctx });
      M.marcaAngulo(ctx.doc, pts[0], pts[2], pts[1], { raio: 23, ctx: ctx });
    });
  });
  const v = conta(f, /dois arcos no mesmo vertice/);
  conf('raios 20 e 23 no mesmo vertice: reprovado', v.length >= 1, true);
  const m = /a ([0-9.]+) pt um do outro/.exec(v[0] || '');
  conf('e a distancia medida e a diferenca dos raios, 3,00 pt', m ? Math.abs(parseFloat(m[1]) - 3) < 0.05 : false, true);
}
{
  /* Duas circunferencias INTEIRAS quase coincidentes, que e a coroa fina de um
   * erro de digitacao no tema (@fig circulo raio=10 coroa=9.93). O pulo do arco
   * destacado sobre a circunferencia vale para inteiro MAIS parcial; escrito com
   * OU em vez de OU EXCLUSIVO, este par entrava nele e a distancia entre duas
   * concentricas deixava de ser medida. Elas imprimem como uma linha unica um
   * pouco mais grossa e a hachura da coroa some entre elas. */
  const f = figura('@fig circulo raio=10 coroa=9.93', function (ctx) {
    const C = ctx.p({ x: 3, y: 3 });
    ctx.contorno(function () {
      D.circunferencia(ctx.doc, C, 50, {});
      D.circunferencia(ctx.doc, C, 49.65, {});
    });
  });
  const v = conta(f, /dois arcos no mesmo vertice/);
  conf('duas circunferencias inteiras a 0,35 pt: reprovado', v.length >= 1, true);
  const m = /a ([0-9.]+) pt um do outro/.exec(v[0] || '');
  conf('e a distancia medida e a diferenca dos raios, 0,35 pt',
    m ? Math.abs(parseFloat(m[1]) - 0.35) < 0.05 : false, true);
  const folgada = figura('@fig circulo raio=10 aneis=5;10', function (ctx) {
    const C = ctx.p({ x: 3, y: 3 });
    ctx.contorno(function () {
      D.circunferencia(ctx.doc, C, 50, {});
      D.circunferencia(ctx.doc, C, 25, {});
    });
  });
  conf('duas circunferencias inteiras com folga de verdade: nao reprova',
    conta(folgada, /dois arcos no mesmo vertice/).length, 0);
}

console.log('=== 3. cruzamento nomeado ===');
{
  const passa = figura('@fig triangulo ceviana=bissetriz;B encontro=I', function (ctx) {
    const I = ctx.p({ x: 3, y: 3 });
    ctx.marcas(function () {
      traco(ctx, ctx.p({ x: 0.5, y: 0.5 }), ctx.p({ x: 5.5, y: 5.5 }));
      traco(ctx, ctx.p({ x: 5.5, y: 0.5 }), ctx.p({ x: 0.5, y: 5.5 }));
      pontoNomeado(ctx, I, 'I');
    });
  });
  conf('dois tracos PASSANDO por I, sem arco: reprova', conta(passa, /cruzamento nomeado/).length >= 1, true);
  const termina = figura('@fig conica tipo=elipse a=5 b=4 focos=F1;F2 ponto=P', function (ctx) {
    const Pp = ctx.p({ x: 3, y: 5 }), F1 = ctx.p({ x: 1, y: 2 }), F2 = ctx.p({ x: 5, y: 2 });
    ctx.marcas(function () {
      traco(ctx, F1, Pp);
      traco(ctx, F2, Pp);
      pontoNomeado(ctx, Pp, 'P');
    });
  });
  conf('dois raios focais TERMINANDO em P, sem arco: nao reprova', conta(termina, /cruzamento nomeado/).length, 0);
}
{
  /* A MESMA tinta na folha, emitida de outro jeito. O D.poligono anota um traco
   * por aresta, entao a reta desenhada como polilinha com I no meio vira dois
   * tracos que TERMINAM em I. O veredito tem que ser o mesmo: quem decide e a
   * geometria da folha, e nao como o traco saiu. Enquanto o criterio olhava
   * "traco que passa pelo ponto", este caso ficava CALADO e o de cima acusava. */
  const partido = figura('@fig triangulo ceviana=bissetriz;B encontro=I', function (ctx) {
    const I = ctx.p({ x: 3, y: 3 });
    ctx.marcas(function () {
      construcao(ctx, [ctx.p({ x: 0.5, y: 0.5 }), I, ctx.p({ x: 5.5, y: 5.5 })]);
      construcao(ctx, [ctx.p({ x: 5.5, y: 0.5 }), I, ctx.p({ x: 0.5, y: 5.5 })]);
      pontoNomeado(ctx, I, 'I');
    });
  });
  conf('o mesmo X partido em I, emitido como duas polilinhas: reprova igual',
    conta(partido, /cruzamento nomeado/).length >= 1, true);
  /* E o lado limpo do mesmo jeito de emitir: tres cevianas que so TERMINAM no
   * ponto nomeado nao fazem cruzamento nenhum, e continuam passando. */
  const leque = figura('@fig conica tipo=elipse a=5 b=4 focos=F1;F2 ponto=P', function (ctx) {
    const Pp = ctx.p({ x: 3, y: 5 });
    ctx.marcas(function () {
      construcao(ctx, [ctx.p({ x: 0.5, y: 0.5 }), Pp]);
      construcao(ctx, [ctx.p({ x: 5.5, y: 0.5 }), Pp]);
      construcao(ctx, [ctx.p({ x: 3, y: 0.5 }), Pp]);
      pontoNomeado(ctx, Pp, 'P');
    });
  });
  conf('tres cevianas TERMINANDO em P, pelo mesmo caminho de emissao: nao reprova',
    conta(leque, /cruzamento nomeado/).length, 0);
}

console.log('\n' + ok + ' conferencias passaram, ' + mau + ' falharam.');
process.exit(mau ? 1 : 0);
