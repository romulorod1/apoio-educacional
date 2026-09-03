/* figuras/_prova_receitas_solidos.js
 * Folha de prova das receitas solido e painelsolidos do receitas.js, a ponte
 * entre a diretiva @fig e o figuras/solidos.js, pelo caminho de verdade: a
 * diretiva e lida pelo partesDeFigura do pdf.js e desenhada pelo doc.figura,
 * como no material do tema. Um caso por tipo e por composicao, nas duas fases
 * onde a fase muda alguma coisa, em portugues e depois em ingles.
 *
 * A folha e o gate visual (o _prova_receitas_solidos_render.py rasteriza cada
 * pagina e cada figura). Quem prova e a MEDICAO no fluxo de conteudo:
 *
 *   fuga         no prisma, a aresta de profundidade A D sai a 45 graus com
 *                metade do comprimento da frontal A B, e no fluxo ela e a
 *                tracejada [2 2] de 0,60 w
 *   escala       uma escala so nos dois eixos: 6 por 10 na folha e 0,6000
 *   esfera       a circunferencia da esfera inscrita toca o centro das duas
 *                bases e a silhueta lateral, distancia medida no fluxo
 *   quadradinho  o angulo reto do triangulo interno esta no pe da altura e
 *                mede 90 na folha
 *   mudo         diretiva sem rotulo nao imprime texto nenhum
 *   gabarito     pelo id, a letra resolvida sai como "g = 13" em teal e o que
 *                ja estava impresso fica na tinta do texto
 *   medida       o que o alturaDoBloco mede antes e o que a figura gastou
 *   teto         nenhuma figura passa de cinco marcas ativas
 *   colada       a letra colada tem duas saidas e a folha cobra as duas: onde
 *                cabe na linha ela fica colada, e onde nao cabe ela desiste de
 *                ser colada e vai para o rotulo com halo, que foge e liga o fio
 *                de chamada. Nas duas a folha sai sem aviso: eram doze avisos
 *                aqui, e a tinta saia entre -0,60 e 1,36 pt da linha, ou seja
 *                por cima dela. O aviso ficou so para o degrau de baixo, o
 *                texto que nao acha lugar nem fugindo (tarja estreita).
 *   linguas      a rodada em ingles nao imprime palavra portuguesa
 *
 * Regra da casa: nunca usar travessao.
 */
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');
const FigBase = require('./base.js');
const FigReceitas = require('./receitas.js');
const S = require('./solidos.js');

const COR = PDFGen.COR;
const MARG_E = PDFGen.MARG_E, MARG_D = PDFGen.MARG_D;
const X = MARG_E + 20, LARGURA = MARG_D - MARG_E - 40;
const LEG = 'legenda=Figura fora de escala.';

/* ================================================================ os casos */

const CASOS = [
  /* ---------------------------------------------------- solidos simples */
  { nome: 'prisma 6 por 10', titulo: 'solido: prisma de aresta 6 e altura 10 (base quadrada, sem profundidade=)',
    fig: '@fig solido id=s1 tipo=prisma aresta=6 altura=10' },
  { nome: 'prisma letras', titulo: 'solido: prisma em letras, com a profundidade rotulada',
    fig: '@fig solido id=s2 tipo=prisma aresta=a profundidade=p altura=h' },
  { nome: 'cilindro letras', titulo: 'solido: cilindro em letras, r na tampa e h na lateral',
    fig: '@fig solido id=s3 tipo=cilindro raio=r altura=h' },
  { nome: 'piramide letras', titulo: 'solido: piramide em letras, a na aresta da frente e h no eixo',
    fig: '@fig solido id=s4 tipo=piramide aresta=a altura=h' },
  { nome: 'cone 5 12 g', titulo: 'solido: cone de raio 5 e altura 12, geratriz em letra',
    fig: '@fig solido id=s5 tipo=cone raio=5 altura=12 geratriz=g' },
  { nome: 'cone 5 12 g gab', titulo: 'o mesmo cone no gabarito: g = 13 em teal, 5 e 12 em preto',
    fig: '@fig id=s5 fase=gabarito', gabaritoDe: '@fig solido id=s5 tipo=cone raio=5 altura=12 geratriz=g' },
  { nome: 'cone h', titulo: 'solido: cone de raio 5 e geratriz 13, altura pedida',
    fig: '@fig solido id=s17 tipo=cone raio=5 geratriz=13 altura=h' },
  { nome: 'cone h gab', titulo: 'no gabarito: h = 12 em teal no eixo, com halo (foge com fio se nao couber colado)',
    fig: '@fig id=s17 fase=gabarito', gabaritoDe: '@fig solido id=s17 tipo=cone raio=5 geratriz=13 altura=h' },
  { nome: 'cone r gab', titulo: 'no gabarito: r = 5 em teal no raio da base',
    fig: '@fig id=s18 fase=gabarito', gabaritoDe: '@fig solido id=s18 tipo=cone altura=12 geratriz=13 raio=r' },
  { nome: 'esfera', titulo: 'solido: esfera de raio r com o centro O',
    fig: '@fig solido id=s6 tipo=esfera raio=r centro=O' },
  { nome: 'cone mudo', titulo: 'solido: cone sem rotulo nenhum (nenhuma frase pode nascer aqui)',
    fig: '@fig solido id=s15 tipo=cone' },
  { nome: 'cone chutado', titulo: 'solido: cone com raio 5 e altura em letra: a altura e chute, a figura sai fora de escala com a legenda do tema',
    fig: '@fig solido id=s16 tipo=cone raio=5 altura=h ' + LEG },

  { nome: 'prisma quadrado em letras', titulo: 'solido: prisma em letras SEM profundidade=, que e a base quadrada do padrao',
    fig: '@fig solido id=s19 tipo=prisma aresta=a altura=h' },
  { nome: 'cilindro esfera so altura', titulo: 'solido: esfera inscrita so com a altura, sem raio= na diretiva',
    fig: '@fig solido id=s21 tipo=cilindro esfera=inscrita altura=10' },
  { nome: 'piramide apotemabase', titulo: 'solido: piramide pelo apotema da base e pela altura, sem aresta= na diretiva',
    fig: '@fig solido id=s20 tipo=piramide triangulo=sim apotemabase=3 altura=4 apotema=m' },
  { nome: 'piramide apotemabase gab', titulo: 'no gabarito: m = 5, resolvido pela aresta que a diretiva nunca escreveu',
    fig: '@fig id=s20 fase=gabarito', gabaritoDe: '@fig solido id=s20 tipo=piramide triangulo=sim apotemabase=3 altura=4 apotema=m' },

  /* ---------------------------------------------------- composicoes */
  { nome: 'cone triangulo letras', titulo: 'solido: cone com o triangulo retangulo interno, r, h e g (explicacao do MATEM3-12)',
    fig: '@fig solido id=s7 tipo=cone triangulo=sim raio=r altura=h geratriz=g' },
  { nome: 'cone triangulo 5 12', titulo: 'solido: o cone com triangulo de raio 5 e altura 12, geratriz pedida',
    fig: '@fig solido id=s8 tipo=cone triangulo=sim raio=5 altura=12 geratriz=g' },
  { nome: 'cone triangulo 5 12 gab', titulo: 'no gabarito: g = 13 escrito (a composicao nao tem porta de cor por rotulo, ver o relatorio)',
    fig: '@fig id=s8 fase=gabarito', gabaritoDe: '@fig solido id=s8 tipo=cone triangulo=sim raio=5 altura=12 geratriz=g' },
  { nome: 'piramide triangulo', titulo: 'solido: piramide de aresta 10 e altura 12 com o triangulo interno, apotemas em letra',
    fig: '@fig solido id=s9 tipo=piramide triangulo=sim aresta=10 altura=12 apotema=m apotemabase=a' },
  { nome: 'piramide triangulo gab', titulo: 'no gabarito: m = 13 no apotema (com halo); o a colado fica letra, porque "a = 5" nao cabe colado',
    fig: '@fig id=s9 fase=gabarito', gabaritoDe: '@fig solido id=s9 tipo=piramide triangulo=sim aresta=10 altura=12 apotema=m apotemabase=a' },
  { nome: 'cilindro esfera', titulo: 'solido: cilindro com a esfera inscrita, raio 3 e altura 6 cotados (exercicio 18)',
    fig: '@fig solido id=s10 tipo=cilindro esfera=inscrita raio=3 altura=6 centro=O' },
  { nome: 'cilindro esfera h', titulo: 'solido: a mesma esfera inscrita com a altura em letra',
    fig: '@fig solido id=s11 tipo=cilindro esfera=inscrita raio=3 altura=h' },
  { nome: 'cilindro esfera h gab', titulo: 'no gabarito: h = 6',
    fig: '@fig id=s11 fase=gabarito', gabaritoDe: '@fig solido id=s11 tipo=cilindro esfera=inscrita raio=3 altura=h' },
  { nome: 'prisma triangular', titulo: 'solido: prisma triangular de lado 6 e altura 10 cotados (exercicio 15)',
    fig: '@fig solido id=s12 tipo=prismatriangular lado=6 altura=10' },
  { nome: 'planificacao', titulo: 'solido: o semicirculo de raio 10 que vira o cone de raio 5, altura 5 raiz de 3 e geratriz 10 (exercicio 17)',
    fig: '@fig solido id=s13 tipo=cone planificacao=sim setor=10 arco=10π raio=5 altura=5√3 geratriz=10' },
  { nome: 'planificacao letras', titulo: 'solido: o mesmo setor com o cone em letras',
    fig: '@fig solido id=s14 tipo=cone planificacao=sim setor=10 arco=10π raio=r altura=h geratriz=g' },
  { nome: 'planificacao gab', titulo: 'no gabarito: g = 10 na geratriz; r e h colados ficam letra (o valor nao cabe colado)',
    fig: '@fig id=s14 fase=gabarito', gabaritoDe: '@fig solido id=s14 tipo=cone planificacao=sim setor=10 arco=10π raio=r altura=h geratriz=g' },

  /* ---------------------------------------------------- painel */
  { nome: 'painel letras', titulo: 'painelsolidos: os cinco com a, r e h, nomes por parametro',
    fig: '@fig painelsolidos id=p1 nome=prisma;cilindro;pirâmide;cone;esfera aresta=a raio=r altura=h', painel: true },
  { nome: 'painel cotado', titulo: 'painelsolidos: os cinco com aresta 6, raio 3 e altura 10 cotados',
    fig: '@fig painelsolidos id=p2 nome=prisma;cilindro;pirâmide;cone;esfera aresta=6 raio=3 altura=10', painel: true },
  { nome: 'painel dois', titulo: 'painelsolidos: so o cone e o cilindro, pela ordem=',
    fig: '@fig painelsolidos id=p3 ordem=cone;cilindro nome=cone;cilindro raio=r altura=h', painel: true },
  { nome: 'painel cotado dois', titulo: 'painelsolidos: cone e cilindro com raio 3 e altura 10, celulas largas',
    fig: '@fig painelsolidos id=p4 ordem=cone;cilindro nome=cone;cilindro raio=3 altura=10', painel: true },

  /* ---------------------------------------------------- a rodada em ingles */
  { nome: 'en cone triangulo', titulo: 'English: the cone with the inner right triangle, labels from the directive',
    fig: '@fig solido id=e1 tipo=cone triangulo=sim raio=r altura=height geratriz=slant', en: true },
  { nome: 'en painel', titulo: 'English: the five solids, names from the directive',
    fig: '@fig painelsolidos id=e2 nome=prism;cylinder;pyramid;cone;sphere aresta=a raio=r altura=h', painel: true, en: true },
  { nome: 'en cilindro esfera', titulo: 'English: inscribed sphere, height as a word',
    fig: '@fig solido id=e6 tipo=cilindro esfera=inscrita raio=3 altura=height centro=O', en: true },
  { nome: 'en cone slant', titulo: 'English: cone of radius 5 and height 12, slant height asked',
    fig: '@fig solido id=e3 tipo=cone raio=5 altura=12 geratriz=slant', en: true },
  { nome: 'en cone slant gab', titulo: 'English answer key: slant = 13 in teal, 5 and 12 in text ink',
    fig: '@fig id=e3 fase=gabarito', gabaritoDe: '@fig solido id=e3 tipo=cone raio=5 altura=12 geratriz=slant', en: true },
  { nome: 'en prisma', titulo: 'English: prism with edge, depth and height as words',
    fig: '@fig solido id=e4 tipo=prisma aresta=edge profundidade=depth altura=height', en: true },
  { nome: 'en prisma gab nasce', titulo: 'English: a cone born in the answer key (no id of origin): every value in teal',
    fig: '@fig solido id=e5 tipo=cone raio=5 altura=12 geratriz=13 fase=gabarito', en: true }
];

/* ================================================================ a folha */

const doc = new PDFGen.Doc();
const medidas = [];
const clips = [];

function cabecalho(caso) {
  doc.novaPagina();
  doc.y -= 6;
  doc.texto(caso.titulo, MARG_E, doc.y, { tam: 10, bold: true, cor: COR.navy });
  doc.y -= 12;
  doc.texto(caso.fig, MARG_E, doc.y, { tam: 7.5, cor: COR.muted });
  doc.y -= 18;
}

CASOS.forEach(function (caso) {
  cabecalho(caso);
  if (caso.gabaritoDe) doc.registrarFiguras(caso.gabaritoDe);
  const pag = doc.pag, de = pag.ops.length;
  const antes = (doc.figurasDesenhadas || []).length;
  const yAntes = doc.y;
  let alturaMedida = 0;
  doc.partesDeFigura(caso.fig).forEach(function (p) {
    if (p.tipo !== 'figura') return;
    alturaMedida += doc.alturaDeFigura(p.diretiva, { x: X, largura: LARGURA });
    doc.figura(p.diretiva, { x: X, largura: LARGURA });
  });
  const regs = (doc.figurasDesenhadas || []).slice(antes);
  const reg = regs[caso.painel ? regs.length - 1 : 0] || null;
  medidas.push({ caso: caso, reg: reg, regs: regs, ops: pag.ops.slice(de), gasto: yAntes - doc.y, medida: alturaMedida });
  if (regs.length) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const r of regs) {
      x0 = Math.min(x0, r.caixa.x); y0 = Math.min(y0, r.caixa.y);
      x1 = Math.max(x1, r.caixa.x + r.caixa.largura); y1 = Math.max(y1, r.caixa.y + r.caixa.altura);
    }
    clips.push({ nome: caso.nome, pagina: doc.paginas.length, x: x0, y: y0, largura: x1 - x0, altura: y1 - y0 });
  }
});

fs.writeFileSync(path.join(__dirname, '_prova_receitas_solidos.pdf'), doc.finalizar());
fs.writeFileSync(path.join(__dirname, '_prova_receitas_solidos_clips.json'),
  JSON.stringify({ paginaAltura: PDFGen.PAGINA_A, clips: clips }, null, 1));
console.log('_prova_receitas_solidos.pdf: ' + CASOS.length + ' paginas, ' + (doc.figurasDesenhadas || []).length + ' figuras');

/* ================================================================ conferencias */

let ok = 0, mau = 0;
function conf(rotulo, obtido, esperado) {
  if (esperado === undefined) esperado = true;
  const bom = String(obtido) === String(esperado);
  if (bom) ok++; else mau++;
  console.log((bom ? '  OK    ' : '  FALHA ') + rotulo + (bom ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function medido(texto) { console.log('        ' + texto); }
function achar(nome) {
  for (const m of medidas) if (m.caso.nome === nome) return m;
  throw new Error('caso nao encontrado: ' + nome);
}
const dist = (a, b) => Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
const n2 = (v) => (Math.round(v * 100) / 100).toFixed(2);
const n4 = (v) => (Math.round(v * 10000) / 10000).toFixed(4);
function textos(reg) { return ((reg && reg.medido && reg.medido.textos) || []); }
function texto(reg, txt) { return textos(reg).filter((t) => t.txt === txt); }
/* A cor de um texto no fluxo e o [r, g, b] de 0 a 1, o mesmo formato da COR. */
function mesma(a, b) { return a && b && Math.abs(a[0] - b[0]) < 0.02 && Math.abs(a[1] - b[1]) < 0.02 && Math.abs(a[2] - b[2]) < 0.02; }
const TEAL = COR.teal, TEXTO = COR.texto;
/* O menor vao entre a TINTA de um rotulo e qualquer traco, arco ou canto de
 * quadradinho do registro, descontada meia espessura da linha: negativo e
 * texto por cima de linha. E a mesma medida do _prova_solidos.js. */
function vaoDaLetra(reg, txt) {
  const D = require('./desenho.js');
  const t = textos(reg).filter((x) => x.txt === txt)[0];
  if (!t) return -Infinity;
  const alta = /[bdfhklt]|[A-Z0-9]/.test(t.txt);
  const cx = { x0: t.x, x1: t.x + t.largura, y0: t.y, y1: t.y + t.tam * (alta ? 0.72 : 0.52) };
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
  for (const mk of reg.marcas) {
    if (mk && mk.cantos) for (let j = 1; j < mk.cantos.length; j++) segs.push([mk.cantos[j - 1], mk.cantos[j], mk.espessura || 0]);
  }
  let menor = Infinity;
  for (const [P, Q, w] of segs) {
    for (let i = 0; i <= 40; i++) {
      const u = i / 40, x = P.x + (Q.x - P.x) * u, y = P.y + (Q.y - P.y) * u;
      const dx = Math.max(cx.x0 - x, 0, x - cx.x1), dy = Math.max(cx.y0 - y, 0, y - cx.y1);
      menor = Math.min(menor, Math.sqrt(dx * dx + dy * dy) - w / 2);
    }
  }
  return menor;
}
/* O segmento do fluxo que liga P a Q, em qualquer ordem, com 0,05 pt de folga. */
function segmento(reg, P, Q) {
  for (const s of reg.medido.segmentos) {
    const a = { x: s.x1, y: s.y1 }, b = { x: s.x2, y: s.y2 };
    if ((dist(a, P) < 0.05 && dist(b, Q) < 0.05) || (dist(a, Q) < 0.05 && dist(b, P) < 0.05)) return s;
  }
  return null;
}

console.log('\nconferencias');

console.log('\nprisma 6 por 10: fuga, ocultas e escala');
{
  const m = achar('prisma 6 por 10'), reg = m.reg, P = reg.solido, V = P.vertices;
  const AB = dist(V.A, V.B), AD = dist(V.A, V.D), AE = dist(V.A, V.E);
  const ang = Math.atan2(V.D.y - V.A.y, V.D.x - V.A.x) * 180 / Math.PI;
  medido('A B ' + n2(AB) + ' pt, A D ' + n2(AD) + ' pt (razao ' + n4(AD / AB) + '), A D a ' + n2(ang) + ' graus; A E ' + n2(AE) + ' pt');
  conf('a aresta de fuga tem metade da frontal (desvio ' + n2(Math.abs(AD - AB / 2)) + ' pt, teto 0,05)', Math.abs(AD - AB / 2) < 0.05);
  conf('e foge a 45 graus (desvio ' + n4(Math.abs(ang - 45)) + ')', Math.abs(ang - 45) < 0.01);
  conf('sem profundidade= a base e quadrada: profundidade igual a aresta', Math.abs(P.profundidade - P.aresta) < 1e-9);
  conf('aresta por altura na folha ' + n4(AB / AE) + ', pedido 6/10 = 0,6000 (escala unica)', Math.abs(AB / AE - 0.6) < 1e-6);
  const sAD = segmento(reg, V.A, V.D), sAB = segmento(reg, V.A, V.B);
  medido('no fluxo: A D ' + (sAD ? sAD.tracejado + ' ' + sAD.w + ' w' : 'ausente') + '; A B ' + (sAB ? sAB.tracejado + ' ' + sAB.w + ' w' : 'ausente'));
  conf('A D esta no fluxo tracejada [2 2] em 0,60 w (oculta)', !!sAD && sAD.tracejado.indexOf('[2 2]') === 0 && Math.abs(sAD.w - 0.6) < 1e-6);
  conf('A B esta no fluxo continua em 1,20 w (visivel)', !!sAB && sAB.tracejado.indexOf('[]') === 0 && Math.abs(sAB.w - 1.2) < 1e-6);
  conf('tres arestas ocultas e nove visiveis', P.ocultas === 3 && P.visiveis === 9);
  medido('textos impressos: ' + textos(reg).map((t) => t.txt).join(' ') + '; marcas ' + reg.marcasAtivas);
  conf('so 6 e 10 impressos, nenhuma palavra', textos(reg).map((t) => t.txt).sort().join(' '), '10 6');
  conf('sem falha de conferencia', (reg.conferencia || []).length === 0, true);
}

console.log('\nsolidos simples em letras');
for (const [nome, esperado] of [['prisma letras', 'a h p'], ['cilindro letras', 'h r'], ['piramide letras', 'a h'], ['esfera', 'O r']]) {
  const m = achar(nome), reg = m.reg;
  const tx = textos(reg).map((t) => t.txt).sort().join(' ');
  conf(nome + ': imprime exatamente ' + esperado, tx, esperado);
  conf(nome + ': sem fio de chamada e sem falha', (reg.rotulos || []).every((r) => !r.chamada) && (reg.conferencia || []).length === 0);
  conf(nome + ': nao esta fora de escala (prototipo, nada foi chutado contra numero)', reg.foraDeEscala, false);
}
{
  const m = achar('cilindro letras'), reg = m.reg;
  const r = texto(reg, 'r')[0], h = texto(reg, 'h')[0];
  medido('cilindro: r em (' + n2(r.cx) + ', ' + n2(r.cy) + ') e h em (' + n2(h.cx) + ', ' + n2(h.cy) + '); tampa ' + n2(reg.solido.centroTopo.y) + ', silhueta direita x ' + n2(reg.solido.topoDir.x));
  conf('cilindro: o r esta acima do raio da tampa, dentro da elipse', r.cy > reg.solido.centroTopo.y && r.cx < reg.solido.topoDir.x && r.cx > reg.solido.centroTopo.x);
  conf('cilindro: o h esta a direita da silhueta', h.cx > reg.solido.topoDir.x);
}

console.log('\ncone mudo e cone chutado');
{
  const m = achar('cone mudo'), reg = m.reg;
  medido('textos impressos: ' + (textos(reg).length ? textos(reg).map((t) => t.txt).join(' ') : '(nenhum)') + '; marcas ' + reg.marcasAtivas + '; tracos ' + reg.tracos.length);
  conf('diretiva sem rotulo nao imprime texto nenhum', textos(reg).length, 0);
  conf('e nao poe linha interna nenhuma (so o cone: duas geratrizes e a base)', reg.tracos.filter((t) => t.papel === 'oculta').length, 1);
  const c = achar('cone chutado'), rc = c.reg;
  conf('raio=5 altura=h: a altura e chute e a figura sai fora de escala', rc.foraDeEscala, true);
  conf('com a legenda do tema, e sem aviso', (rc.avisos || []).length, 0);
  medido('altura chutada: ' + n2(rc.solido.altura / rc.escala) + ' unidades para raio 5 (proporcao do prototipo 1,3/0,5 = 2,6)');
  conf('a altura chutada segue a proporcao do prototipo', Math.abs(rc.solido.altura / rc.escala - 13) < 1e-6);
}

console.log('\ncone 5 12 g: escala e camada de gabarito');
{
  const m = achar('cone 5 12 g'), reg = m.reg, Sd = reg.solido;
  const r = Sd.baseDir.x - Sd.O.x, h = Sd.vertice.y - Sd.O.y;
  medido('raio ' + n2(r) + ' pt, altura ' + n2(h) + ' pt, razao ' + n4(r / h) + ' (pedido 5/12 = ' + n4(5 / 12) + ')');
  conf('raio por altura na folha e 5/12', Math.abs(r / h - 5 / 12) < 1e-6);
  const g = texto(reg, 'g')[0];
  conf('enunciado: g impresso em letra, na tinta do texto', !!g && mesma(g.cor, TEXTO));
  conf('enunciado: 5 e 12 impressos', texto(reg, '5').length === 1 && texto(reg, '12').length === 1);
  conf('enunciado: nao esta fora de escala (g se deduz)', reg.foraDeEscala, false);
  const gb = achar('cone 5 12 g gab').reg;
  const gres = texto(gb, 'g = 13')[0];
  medido('gabarito: textos ' + textos(gb).map((t) => t.txt + (mesma(t.cor, TEAL) ? '(teal)' : '(preto)')).join(' '));
  conf('gabarito: g = 13 impresso', !!gres);
  conf('gabarito: g = 13 sai em teal', !!gres && mesma(gres.cor, TEAL));
  conf('gabarito: 5 e 12 continuam em preto', texto(gb, '5').every((t) => mesma(t.cor, TEXTO)) && texto(gb, '12').every((t) => mesma(t.cor, TEXTO)));
  conf('gabarito: mesma escala e mesma caixa do enunciado', Math.abs(gb.escala - reg.escala) < 1e-9 && gb.caixa.altura === reg.caixa.altura);
  conf('gabarito: sem falha de conferencia', (gb.conferencia || []).length === 0);
  const gl = texto(gb, 'g = 13')[0], base = gb.solido;
  medido('gabarito: g = 13 em (' + n2(gl.cx) + ', ' + n2(gl.cy) + '), a direita da silhueta que vai de (' + n2(base.baseDir.x) + ', ' + n2(base.baseDir.y) + ') a (' + n2(base.vertice.x) + ', ' + n2(base.vertice.y) + ')');
  conf('gabarito: o valor esta fora do cone, a direita da geratriz', gl.cx > base.baseDir.x + (gl.cy - base.baseDir.y) * (base.vertice.x - base.baseDir.x) / (base.vertice.y - base.baseDir.y));
  /* O valor resolvido numa posicao COLADA do caminho simples: com halo ele
   * foge e liga o fio em vez de atravessar a silhueta. */
  const hg = achar('cone h gab').reg, hh = texto(hg, 'h = 12')[0];
  const rot = (hg.rotulos || []).filter((r) => r.texto === 'h = 12')[0] || {};
  medido('cone h gab: h = 12 em (' + n2(hh.cx) + ', ' + n2(hh.cy) + '), largura ' + n2(hh.largura) + ' pt, vao ate a linha mais proxima ' + n2(vaoDaLetra(hg, 'h = 12')) + ' pt, fio de chamada ' + (rot.chamada ? 'sim' : 'nao') + ', desviou ' + n2(rot.desviou || 0) + ' pt');
  conf('cone h gab: h = 12 sai em teal', mesma(hh.cor, TEAL));
  conf('cone h gab: e nao atravessa linha nenhuma (vao acima de 1 pt)', vaoDaLetra(hg, 'h = 12') > 1);
  conf('cone h gab: sem falha e sem aviso', (hg.conferencia || []).length === 0 && (hg.avisos || []).length === 0);
  conf('cone h: o enunciado nao esta fora de escala (h se deduz de r e g)', achar('cone h').reg.foraDeEscala, false);
  const rg = achar('cone r gab').reg, rr = texto(rg, 'r = 5')[0];
  const rot2 = (rg.rotulos || []).filter((r) => r.texto === 'r = 5')[0] || {};
  medido('cone r gab: r = 5 em (' + n2(rr.cx) + ', ' + n2(rr.cy) + '), vao ' + n2(vaoDaLetra(rg, 'r = 5')) + ' pt, fio de chamada ' + (rot2.chamada ? 'sim' : 'nao') + ', desviou ' + n2(rot2.desviou || 0) + ' pt');
  conf('cone r gab: r = 5 em teal e sem atravessar linha', mesma(rr.cor, TEAL) && vaoDaLetra(rg, 'r = 5') > 1);
}

console.log('\ncone com o triangulo interno');
{
  const m = achar('cone triangulo 5 12'), reg = m.reg, sd = reg.saida;
  const q = (reg.marcas || []).filter((k) => k && k.tipo === 'anguloReto');
  conf('um quadradinho de angulo reto no registro', q.length, 1);
  medido('quadradinho em (' + n2(q[0].x) + ', ' + n2(q[0].y) + '), pe da altura O em (' + n2(sd.O.x) + ', ' + n2(sd.O.y) + '), distancia ' + n2(dist(q[0], sd.O)) + ' pt, abertura ' + n2(q[0].abertura) + ' graus');
  conf('o quadradinho esta no pe da altura', dist(q[0], sd.O) < 0.01);
  conf('e o angulo entre raio e altura mede 90 na folha', Math.abs(q[0].abertura - 90) < 0.01);
  conf('o triangulo e a unica area preenchida alem do fundo', reg.medido.areas.filter((a) => a.pts.length === 3).length, 1);
  conf('quatro marcas: r, h, g e o quadradinho', reg.marcasAtivas, 4);
  conf('sem falha de conferencia', (reg.conferencia || []).length === 0);
  const l = achar('cone triangulo letras').reg;
  conf('em letras: r, h e g impressos e nenhum 90', textos(l).map((t) => t.txt).sort().join(' '), 'g h r');
  const gb = achar('cone triangulo 5 12 gab').reg;
  const gres = texto(gb, 'g = 13')[0];
  medido('gabarito da composicao: ' + textos(gb).map((t) => t.txt + (mesma(t.cor, TEAL) ? '(teal)' : '(preto)')).join(' '));
  conf('gabarito da composicao: g = 13 escrito', !!gres);
  conf('gabarito da composicao: SEM teal, porque a composicao nao tem porta de cor por rotulo (gap declarado no relatorio)', !!gres && mesma(gres.cor, TEXTO));
  conf('gabarito da composicao: caixa e escala iguais as do enunciado', gb.escala === reg.escala && gb.caixa.altura === reg.caixa.altura);
}

console.log('\npiramide com o triangulo interno');
{
  const m = achar('piramide triangulo'), reg = m.reg, sd = reg.saida;
  const q = (reg.marcas || []).filter((k) => k && k.tipo === 'anguloReto')[0];
  medido('quadradinho a ' + n2(dist(q, sd.O)) + ' pt de O, abertura ' + n2(q.abertura) + '; apotema da base ' + n2(dist(sd.O, sd.M)) + ' pt contra metade da aresta ' + n2(sd.piramide.aresta / 2));
  conf('quadradinho no pe da altura, reto na folha', dist(q, sd.O) < 0.01 && Math.abs(q.abertura - 90) < 0.01);
  conf('o apotema da base sai em verdadeira grandeza (metade da aresta)', Math.abs(dist(sd.O, sd.M) - sd.piramide.aresta / 2) < 0.02);
  conf('enunciado: 12, a e m impressos', textos(reg).map((t) => t.txt).sort().join(' '), '12 a m');
  const gb = achar('piramide triangulo gab').reg;
  medido('gabarito: ' + textos(gb).map((t) => t.txt).join(' | ') + '; vao do m = 13 ' + n2(vaoDaLetra(gb, 'm = 13')) + ' pt, do a ' + n2(vaoDaLetra(gb, 'a')) + ' pt');
  conf('gabarito: m = 13 resolvido no apotema (posicao com halo)', texto(gb, 'm = 13').length, 1);
  conf('gabarito: o a colado fica letra ("a = 5" tem ' + n2(PDFGen.medir('a = 5', 8.5, false)) + ' pt e caia sobre o quadradinho)', texto(gb, 'a').length === 1 && texto(gb, 'a = 5').length === 0);
  conf('gabarito: nada atravessa linha (vaos acima de 1 pt)', vaoDaLetra(gb, 'm = 13') > 1 && vaoDaLetra(gb, 'a') > 1);
  conf('gabarito: sem falha de conferencia e no teto', (gb.conferencia || []).length === 0 && gb.marcasAtivas <= 5);
}

console.log('\ncilindro com a esfera inscrita');
{
  const m = achar('cilindro esfera'), reg = m.reg, sd = reg.saida;
  const circ = reg.medido.arcos.filter((a) => a.abertura > 359 && Math.abs(a.raio - sd.raio) < 0.1);
  conf('a esfera esta no fluxo como uma circunferencia de raio 3k', circ.length, 1);
  const c = circ[0];
  const dFundo = Math.abs((c.cy - c.raio) - sd.cilindro.centroBase.y);
  const dTopo = Math.abs((c.cy + c.raio) - sd.cilindro.centroTopo.y);
  const dLat = Math.abs((c.cx + c.raio) - sd.cilindro.baseDir.x);
  medido('esfera: centro (' + n2(c.cx) + ', ' + n2(c.cy) + ') raio ' + n2(c.raio) + '; fundo a ' + n2(dFundo) + ' pt do centro da base, topo a ' + n2(dTopo) + ' pt do centro da tampa, lado a ' + n2(dLat) + ' pt da silhueta');
  conf('a esfera toca as duas bases e a lateral (teto 0,05 pt)', dFundo < 0.05 && dTopo < 0.05 && dLat < 0.05);
  conf('e sai toda tracejada [2 2] em 0,60 w', c.tracejado.indexOf('[2 2]') === 0 && Math.abs(c.w - 0.6) < 1e-6);
  const cotas = reg.tracos.filter((t) => t.tipo === 'cota');
  conf('a cota da altura mede o diametro da esfera', cotas.length === 1 && Math.abs(Math.abs(cotas[0].y2 - cotas[0].y1) - 2 * sd.raio) < 0.02);
  conf('3, 6 e O impressos', textos(reg).map((t) => t.txt).sort().join(' '), '3 6 O');
  conf('raio=3 altura=6 concordam: nao esta fora de escala', reg.foraDeEscala, false);
  const gb = achar('cilindro esfera h gab').reg;
  conf('altura em letra no gabarito: h = 6', texto(gb, 'h = 6').length, 1);
  conf('e o enunciado dela nao esta fora de escala (h se deduz de r)', achar('cilindro esfera h').reg.foraDeEscala, false);
}

console.log('\nprisma triangular cotado');
{
  const m = achar('prisma triangular'), reg = m.reg, P = reg.saida.prisma;
  const lado = dist(P.vertices.A, P.vertices.B), alt = dist(P.vertices.A, P.vertices.D);
  medido('lado ' + n2(lado) + ' pt, altura ' + n2(alt) + ' pt, razao ' + n4(lado / alt) + ' (pedido 0,6000)');
  conf('lado por altura na folha e 6/10', Math.abs(lado / alt - 0.6) < 1e-6);
  conf('duas cotas de seta e duas marcas', reg.tracos.filter((t) => t.tipo === 'cota').length === 2 && reg.marcasAtivas === 2);
  conf('as ocultas morrem em C', P.arestas.filter((e) => e.oculta).map((e) => e.de + e.ate).sort().join(' '), 'AC BC CF');
}

console.log('\no setor que vira cone');
{
  const m = achar('planificacao'), reg = m.reg, sd = reg.saida;
  medido('setor de raio ' + sd.geratriz + ' e 180 graus; cone r ' + sd.raioCone + ', h ' + n4(sd.alturaCone) + ' (5 raiz de 3 = ' + n4(5 * Math.sqrt(3)) + ')');
  conf('o cone montado tem raio 5 e altura 5 raiz de 3', sd.raioCone === 5 && Math.abs(sd.alturaCone - 5 * Math.sqrt(3)) < 1e-9);
  conf('cinco marcas, exatamente no teto', reg.marcasAtivas, 5);
  conf('altura=5√3 (letra) nao poe a figura fora de escala: ela se deduz do setor', reg.foraDeEscala, false);
  conf('sem falha de conferencia', (reg.conferencia || []).length === 0);
  const l = achar('planificacao letras').reg;
  /* O 10π sai pela fonte Symbol e o que o registro guarda depende do caminho
   * de codificacao do texto, que nao e desta receita: ja saiu como "10p" pelo
   * byte WinAnsi e ja saiu com o proprio π. O que esta folha cobra e o que e
   * dela: os cinco rotulos da diretiva impressos, e o do arco sendo o 10 mais
   * UM simbolo. E a mesma saida que o _prova_receitas_circulo.js ja usa para o
   * 5√2 do circunscrito. */
  const tl = textos(l).map((t) => t.txt).sort();
  medido('planificacao em letras, textos impressos: ' + tl.join(' '));
  conf('em letras: 10π, 10, r, h e g impressos (o arco sai como 10 mais um simbolo)',
    tl.length === 5 && tl.filter((t) => /^10.$/.test(t)).length === 1 &&
    ['10', 'g', 'h', 'r'].every((q) => tl.indexOf(q) >= 0));
  const gb = achar('planificacao gab').reg;
  medido('gabarito: ' + textos(gb).map((t) => t.txt).join(' | ') + '; vaos: g = 10 ' + n2(vaoDaLetra(gb, 'g = 10')) + ', h ' + n2(vaoDaLetra(gb, 'h')) + ', r ' + n2(vaoDaLetra(gb, 'r')) + ' pt');
  conf('gabarito: g = 10 resolvido na geratriz (posicao com halo)', texto(gb, 'g = 10').length, 1);
  conf('gabarito: r e h colados ficam letra ("h = 8.66" tem ' + n2(PDFGen.medir('h = 8.66', 8.5, false)) + ' pt e atravessava a silhueta)', texto(gb, 'r').length === 1 && texto(gb, 'h').length === 1);
  conf('gabarito: nada atravessa linha (vaos acima de 1 pt)', vaoDaLetra(gb, 'g = 10') > 1 && vaoDaLetra(gb, 'h') > 1 && vaoDaLetra(gb, 'r') > 1);
  conf('gabarito: ainda cinco marcas e sem falha', gb.marcasAtivas === 5 && (gb.conferencia || []).length === 0);
}

console.log('\npainel dos solidos');
{
  const m = achar('painel letras');
  const ks = m.regs.map((r) => r.escala);
  medido('cinco celulas, escala ' + ks.map((k) => k.toFixed(4)).join(' ') + '; altura da celula ' + n2(m.reg.caixa.altura));
  conf('cinco celulas desenhadas', m.regs.length, 5);
  conf('as cinco na MESMA escala', Math.max(...ks) - Math.min(...ks) < 1e-9);
  const nomes = [];
  for (const r of m.regs) for (const t of textos(r)) nomes.push(t.txt);
  conf('os cinco nomes da diretiva estao impressos', ['prisma', 'cilindro', 'pirâmide', 'cone', 'esfera'].every((n) => nomes.indexOf(n) >= 0));
  conf('nenhuma celula passa de cinco marcas', m.regs.every((r) => r.marcasAtivas <= 5));
  conf('nenhuma celula com falha', m.regs.every((r) => (r.conferencia || []).length === 0));
  const c = achar('painel cotado');
  const kc = c.regs.map((r) => r.escala);
  medido('painel cotado: escala ' + kc.map((k) => k.toFixed(4)).join(' ') + '; prisma ' + n2(c.regs[0].solido.aresta / kc[0]) + ' por ' + n2(c.regs[0].solido.profundidade / kc[0]) + ' por ' + n2(c.regs[0].solido.altura / kc[0]) + ' unidades');
  conf('painel cotado: mesma escala nas cinco', Math.max(...kc) - Math.min(...kc) < 1e-9);
  conf('painel cotado: prisma 6 por 6 por 10 (base quadrada com aresta numerica)', Math.abs(c.regs[0].solido.profundidade - c.regs[0].solido.aresta) < 1e-6 && Math.abs(c.regs[0].solido.altura / c.regs[0].solido.aresta - 10 / 6) < 1e-9);
  conf('painel cotado: 6, 3 e 10 impressos e nao esta fora de escala', texto(c.regs[3], '3').length === 1 && texto(c.regs[3], '10').length === 1 && !c.reg.foraDeEscala);
  const d2 = achar('painel dois');
  conf('ordem=cone;cilindro: duas celulas, cone primeiro', d2.regs.length === 2 && d2.regs[0].solido.tipo === 'cone' && d2.regs[1].solido.tipo === 'cilindro');
  /* Limite MEDIDO da celula do painelDeSolidos, e nao da receita: a celula poe
   * o numero colado onde o livro poe a letra, e num cone de raio 3 por altura
   * 10 (r/h = 0,3; na celula, raio de 23 pt) o "10" de 9,5 pt de largura nao
   * cabe entre o eixo e a silhueta, com duas ou com cinco celulas: a escala
   * e a mesma nos dois paineis porque quem a limita e o teto de 140 pt da
   * celula, e nao a largura.
   *
   * O que a folha cobrava aqui era o dano: "o vao fica abaixo do piso", isto e,
   * o numero saia impresso em cima da linha (medido: -0,30 e -0,60 pt) e a
   * folha registrava isso como limite conhecido. Nao e limite, e defeito. Hoje
   * o rotuloColado desiste de ser colado e cai para o rotulo com halo, que foge
   * e liga o fio de chamada, entao a premissa continua a mesma (nao cabe
   * COLADO) e a consequencia mudou: a tinta impressa passou a ficar acima do
   * piso, sem aviso nenhum. Sao as duas coisas que se cobram abaixo, e a
   * segunda falha na versao de antes. */
  const rot = (r, t) => (r.rotulos || []).filter((x) => x.texto === t)[0] || {};
  const CASOS5 = [['piramide', c.regs[2], '10'], ['cone', c.regs[3], '10'], ['cone', c.regs[3], '3'], ['cilindro', c.regs[1], '3']];
  const v5 = CASOS5.map(([n, r, t]) => [n + ' ' + t, vaoDaLetra(r, t)]);
  medido('painel cotado, cinco celulas (escala ' + kc[0].toFixed(2) + ' pt/unidade, cone com raio ' + n2(3 * kc[0]) + ' pt): vao da tinta ate a linha mais proxima: ' + v5.map(([n, v]) => n + ' ' + n2(v)).join(', ') + ' pt');
  const p4 = achar('painel cotado dois');
  const CASOS2 = [['cone', p4.regs[0], '10'], ['cone', p4.regs[0], '3'], ['cilindro', p4.regs[1], '3'], ['cilindro', p4.regs[1], '10']];
  const v2 = CASOS2.map(([n, r, t]) => [n + ' ' + t, vaoDaLetra(r, t)]);
  medido('painel cotado, duas celulas (escala ' + p4.regs[0].escala.toFixed(2) + ' pt/unidade): ' + v2.map(([n, v]) => n + ' ' + n2(v)).join(', ') + ' pt');
  conf('a escala do painel numerico e a mesma com duas e com cinco celulas: o teto da celula manda, nao a largura', Math.abs(p4.regs[0].escala - kc[0]) < 1e-9);
  const fugiu5 = CASOS5.filter(([n, r, t]) => rot(r, t).caiuParaHalo === true);
  const fugiu2 = CASOS2.filter(([n, r, t]) => rot(r, t).caiuParaHalo === true);
  medido('quem nao coube colado e saiu com halo: ' +
    fugiu5.concat(fugiu2).map(([n, r, t]) => n + ' ' + t + ' (desviou ' + n2(rot(r, t).desviou || 0) + ' pt, fio ' + (rot(r, t).chamada ? 'sim' : 'nao') + ')').join(', '));
  conf('o numero colado num cone de r/h = 0,3 nao cabe COLADO, com duas ou com cinco celulas: limite da celula registrado',
    fugiu5.length > 0 && fugiu2.length > 0);
  conf('e mesmo assim nenhum deles sai por cima da linha: a tinta fica acima do piso de ' + S.FOLGA_COLADO + ' pt (antes: -0,60 pt, letra sobre traco)',
    v5.every(([n, v]) => v >= S.FOLGA_COLADO) && v2.every(([n, v]) => v >= S.FOLGA_COLADO));
  conf('e todo numero que saiu do lugar colado esta ligado por fio de chamada ao que nomeia',
    fugiu5.concat(fugiu2).every(([n, r, t]) => rot(r, t).chamada === true));
  conf('e a receita nao acrescenta aviso nem falha a esse painel', c.regs.concat(p4.regs).every((r) => (r.avisos || []).length === 0 && (r.conferencia || []).length === 0));
}

console.log('\na rodada em ingles');
{
  const PT = /altura|raio|geratriz|apotema|aresta|profundidade|pirâmide|esfera|cilindro|prisma\b/;
  let sobrou = [];
  for (const m of medidas) {
    if (!m.caso.en) continue;
    for (const r of m.regs) for (const t of textos(r)) if (PT.test(t.txt)) sobrou.push(m.caso.nome + ': ' + t.txt);
  }
  conf('nenhuma palavra portuguesa nas figuras em ingles', sobrou.join(', ') || 'nenhuma', 'nenhuma');
  const e1 = achar('en cone triangulo').reg;
  conf('height e slant impressos no cone', texto(e1, 'height').length === 1 && texto(e1, 'slant').length === 1);
  const e2 = achar('en painel');
  const nomes = [];
  for (const r of e2.regs) for (const t of textos(r)) nomes.push(t.txt);
  conf('prism, cylinder, pyramid, cone e sphere no painel', ['prism', 'cylinder', 'pyramid', 'cone', 'sphere'].every((n) => nomes.indexOf(n) >= 0));
  const e6 = achar('en cilindro esfera').reg;
  conf('inscribed sphere: height as a word on the cota, 3 and O', textos(e6).map((t) => t.txt).sort().join(' '), '3 O height');
  const e3 = achar('en cone slant gab').reg;
  const sl = texto(e3, 'slant = 13')[0];
  medido('answer key: ' + textos(e3).map((t) => t.txt + (mesma(t.cor, TEAL) ? '(teal)' : '(preto)')).join(' ') + (sl ? '; slant = 13 mede ' + n2(sl.largura) + ' pt' : ''));
  conf('answer key: slant = 13 in teal', !!sl && mesma(sl.cor, TEAL));
  conf('answer key: 5 and 12 stay in text ink', texto(e3, '5').every((t) => mesma(t.cor, TEXTO)) && texto(e3, '12').every((t) => mesma(t.cor, TEXTO)));
  conf('answer key: no fio de chamada and no failure', (e3.rotulos || []).every((r) => !r.chamada) && (e3.conferencia || []).length === 0);
  const e5 = achar('en prisma gab nasce').reg;
  medido('nascida no gabarito: ' + textos(e5).map((t) => t.txt + (mesma(t.cor, TEAL) ? '(teal)' : '(preto)')).join(' '));
  conf('figura que nasce no gabarito: 5, 12 e 13 todos em teal', textos(e5).length === 3 && textos(e5).every((t) => mesma(t.cor, TEAL)));
  conf('e nao esta fora de escala (13 bate com 5 e 12)', e5.foraDeEscala, false);
}

console.log('\na medida que a diretiva nao escreveu ainda CONSTROI o desenho');
/* Estas conferencias nasceram de defeitos medidos na ponte, e cada uma falha na
 * receita de antes. A chave que o tema nao escreve nao e so rotulo que falta: e
 * tambem a dimensao que levanta a figura. Quando o deduzir() saia fora por nao
 * achar a entrada, o valor certo era jogado no lixo e o solido caia no
 * prototipo, com o numero da diretiva impresso em cima de uma medida que valia
 * outra coisa. */
{
  const m = achar('piramide apotemabase'), reg = m.reg, sd = reg.saida;
  const apo = dist(sd.O, sd.M) / reg.escala;
  const ar = sd.piramide.aresta / reg.escala, al = sd.piramide.altura / reg.escala;
  medido('apotema da base desenhado ' + n2(apo) + ' unidades, aresta ' + n2(ar) + ', altura ' + n2(al) + ' (antes: 1,54 e 3,08, com o 3 impresso em cima do 1,54)');
  conf('apotemabase=3 altura=4 sem aresta= na diretiva desenha o apotema da base 3', Math.abs(apo - 3) < 0.01);
  conf('e a aresta sai 6, deduzida de uma chave que a diretiva nao escreveu', Math.abs(ar - 6) < 0.01);
  conf('a figura NAO esta fora de escala, porque nada foi chutado', reg.foraDeEscala, false);
  conf('e a aresta muda nao imprime rotulo nenhum', textos(reg).map((t) => t.txt).sort().join(' '), '3 4 m');
  const gb = achar('piramide apotemabase gab').reg;
  medido('gabarito: ' + textos(gb).map((t) => t.txt).join(' | '));
  conf('no gabarito o m resolve para 5 (raiz de 16 mais 9)', texto(gb, 'm = 5').length, 1);
  conf('e nenhum rotulo vazio nasce da entrada muda', textos(gb).every((t) => t.txt.trim() && t.txt.indexOf('= 6') < 0));
}
{
  const m = achar('cilindro esfera so altura'), reg = m.reg, sd = reg.saida;
  const r = sd.raio / reg.escala;
  medido('esfera inscrita so com altura=10: raio desenhado ' + n2(r) + ' unidades (antes 4, o prototipo, com a figura declarada fora de escala)');
  conf('o raio sai 5, metade da altura, sem raio= na diretiva', Math.abs(r - 5) < 0.01);
  conf('e a figura nao e declarada fora de escala, porque a proporcao esta certa', reg.foraDeEscala, false);
  conf('so o 10 impresso', textos(reg).map((t) => t.txt).sort().join(' '), '10');
}
{
  const m = achar('prisma quadrado em letras'), reg = m.reg, P = reg.solido;
  const a = P.aresta / reg.escala, p = P.profundidade / reg.escala, h = P.altura / reg.escala;
  medido('prisma em letras sem profundidade=: ' + n2(a) + ' por ' + n2(p) + ' por ' + n2(h) + ' unidades (antes 1 por 0,80 por 1,25)');
  conf('sem profundidade= a base e quadrada tambem em LETRAS, como o cabecalho da receita promete', Math.abs(P.profundidade - P.aresta) < 1e-9);
  conf('e a figura nao se declara fiel mostrando base retangular', reg.foraDeEscala, false);
  conf('so a e h impressos, sem rotulo de profundidade', textos(reg).map((t) => t.txt).sort().join(' '), 'a h');
}

console.log('\nmedida antes e gasto depois');
{
  let piorDesvio = 0, pior = '';
  for (const m of medidas) {
    const dv = Math.abs(m.gasto - m.medida);
    if (dv > piorDesvio) { piorDesvio = dv; pior = m.caso.nome; }
  }
  medido('maior desvio entre alturaDoBloco e o que a figura gastou: ' + n2(piorDesvio) + ' pt (' + pior + ')');
  conf('o alturaDoBloco mede o que a figura gasta, em todos os casos (teto 0,01 pt)', piorDesvio < 0.01);
}

console.log('\nletra colada na folha inteira: quem cabe fica colada, quem nao cabe foge com fio');
/* O rotulo colado tem duas saidas e a folha cobra as duas, porque so a soma
 * delas e o comportamento: onde a letra cabe na linha ela fica COLADA (le
 * melhor, sem halo e sem fio), e onde nao cabe ela DESISTE de ser colada e vai
 * para o rotulo com halo, que foge e liga o fio de chamada ate o ponto que
 * nomeia. Nas duas saidas a folha sai sem aviso, e e essa a diferenca para a
 * versao de antes: la a letra que nao coubesse saia impressa por cima do traco,
 * primeiro em silencio e depois com aviso, e eram doze avisos nesta folha.
 *
 * Cada uma das quatro conferencias abaixo falha na versao de antes: a primeira
 * por vacuidade (nenhum rotulo caia para o halo), as outras tres porque a tinta
 * ficava sobre a linha, sem fio e com aviso. */
{
  const todas = doc.figurasDesenhadas || [];
  const colados = [], fugidos = [];
  for (const r of todas) for (const t of (r.rotulos || [])) {
    if (t.coubeColado === true) colados.push([r, t]);
    else if (t.caiuParaHalo === true) fugidos.push([r, t]);
  }
  medido(colados.length + ' letra(s) coube(ram) colada(s) e ' + fugidos.length + ' cairam para o halo');
  medido('coladas: ' + colados.map(([r, t]) => '"' + t.texto + '" em ' + t.em).join(', '));
  medido('fugidas: ' + fugidos.map(([r, t]) => '"' + t.texto + '" desviou ' + n2(t.desviou || 0) + ' pt, vao da tinta ' + n2(vaoDaLetra(r, t.texto)) + ' pt').join('; '));
  conf('a folha exercita as duas saidas: ha letra colada e ha letra que caiu para o halo',
    colados.length > 0 && fugidos.length > 0);
  conf('quem coube colado ficou colado: sem fuga de halo e sem fio de chamada',
    colados.every(([r, t]) => !t.desviou && !t.chamada && !t.tarja));
  conf('quem nao coube esta ligado por fio de chamada ao ponto que nomeia',
    fugidos.every(([r, t]) => t.chamada === true));
  /* Duas cobrancas e nao uma, porque sao duas afirmacoes de forca diferente.
   *
   * A primeira e o defeito: NENHUMA letra pode sair impressa por cima de um
   * traco, e por cima e vao negativo. Antes desta rodada as doze letras que nao
   * cabiam saiam entre -0,60 e 1,36 pt.
   *
   * A segunda e o piso, e ela vem com 0,15 pt de tolerancia por uma razao
   * medida: o piso e conferido aqui por um amostrador diferente do que o
   * solidos.js usa para escolher a posicao (este anda o arco de 4 em 4 graus e
   * o segmento em 40 passos, o de la anda o arco de 6 em 6), e as duas contas
   * divergem no ultimo decimo. O caso e o h da piramide do painel em letras,
   * que a busca aceita com 2,00 e este amostrador mede em 1,91: a divergencia e
   * de resolucao, nao de posicao, e exigir igualdade entre dois amostradores
   * diferentes so ensinaria a folha a reprovar sem defeito. Quem nao cabe e
   * foge tem folga sobrando (o menor medido e 2,56) e passa sem tolerancia
   * nenhuma. */
  const vaos = colados.concat(fugidos).map(([r, t]) => [t.texto, vaoDaLetra(r, t.texto)]);
  medido('menor vao da folha: ' + n2(Math.min(...vaos.map(([t, v]) => v))) + ' pt; abaixo do piso: ' +
    (vaos.filter(([t, v]) => v < S.FOLGA_COLADO).map(([t, v]) => '"' + t + '" ' + n2(v)).join(', ') || 'nenhuma'));
  conf('nenhuma letra colada da folha sai por cima de um traco (vao negativo): eram 12 antes',
    vaos.every(([t, v]) => v > 0));
  conf('e toda letra fica no piso de ' + S.FOLGA_COLADO + ' pt, com 0,15 pt de tolerancia de amostragem',
    vaos.every(([t, v]) => v >= S.FOLGA_COLADO - 0.15));
  conf('quem fugiu fica no piso sem tolerancia nenhuma',
    fugidos.every(([r, t]) => vaoDaLetra(r, t.texto) >= S.FOLGA_COLADO));
  /* O fio de chamada e reconstruido da geometria que o registro guarda (ancora,
   * centro e caixa envolvente), que e a mesma conta do rotulo() do desenho.js:
   * ele parte a 1,5 pt da ancora e para na BORDA da caixa, meio ponto antes.
   * O que se cobra dele e nao passar por dentro da caixa de OUTRO rotulo: o fio
   * cruza silhueta, sim, e tem que cruzar mesmo, porque a letra so sai de um
   * solido esbelto atravessando a silhueta dele; o que ele nao pode e riscar
   * outra letra e deixar o leitor sem saber de quem e cada fio. */
  function fioDe(t) {
    const dx = t.cx - t.ancora.x, dy = t.cy - t.ancora.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (!d) return null;
    const u = { x: dx / d, y: dy / d };
    const sup = Math.abs(u.x) * t.largura / 2 + Math.abs(u.y) * t.altura / 2;
    const ate = Math.max(0, d - sup - 0.5);
    if (!(ate > 2)) return null;
    return { P: { x: t.ancora.x + u.x * 1.5, y: t.ancora.y + u.y * 1.5 },
             Q: { x: t.ancora.x + u.x * ate, y: t.ancora.y + u.y * ate } };
  }
  let riscados = [];
  for (const [r, t] of fugidos) {
    const f = fioDe(t);
    if (!f) continue;
    for (const o of (r.rotulos || [])) {
      if (o === t) continue;
      for (let i = 0; i <= 60; i++) {
        const u = i / 60, x = f.P.x + (f.Q.x - f.P.x) * u, y = f.P.y + (f.Q.y - f.P.y) * u;
        if (x >= o.x && x <= o.x + o.largura && y >= o.y && y <= o.y + o.altura) { riscados.push('"' + t.texto + '" risca "' + o.texto + '"'); i = 999; break; }
      }
    }
  }
  medido('fio de chamada desenhado em ' + fugidos.filter(([r, t]) => fioDe(t)).length + ' das ' + fugidos.length + ' letras fugidas');
  conf('e nenhum fio de chamada passa por cima de outro rotulo', riscados.join(', ') || 'nenhum', 'nenhum');
}

console.log('\nteto, avisos e estado');
{
  const todas = doc.figurasDesenhadas || [];
  medido(todas.length + ' figuras, marcas: ' + todas.map((r) => r.marcasAtivas).join(' '));
  conf('nenhuma figura passa de cinco marcas ativas', todas.every((r) => r.marcasAtivas <= 5));
  conf('nenhuma figura com falha de conferencia', todas.every((r) => (r.conferencia || []).length === 0));
  const avisos = doc.avisosFigura || [];
  for (const a of avisos) console.log('  aviso . ' + a);
  conf('nenhum aviso de figura na folha inteira', avisos.length, 0);
  conf('todas as figuras registram a receita', todas.every((r) => r.receita === 'solido' || r.receita === 'painelsolidos'));
  let problemas = 0;
  for (const pag of doc.paginas) {
    let prof = 0;
    for (const s of pag.ops) {
      if (s.indexOf('BT ') === 0) continue;
      for (const k of s.split(/\s+/)) {
        if (k === 'q') prof++;
        else if (k === 'Q') { prof--; if (prof < 0) { problemas++; prof = 0; } }
        else if ((k === 'd' || k === 'W' || k === 'W*') && prof === 0) problemas++;
      }
    }
    if (prof !== 0) problemas++;
  }
  conf('todo q tem o seu Q e nenhum d ou W sai de envelope', problemas, 0);
  const cru = Buffer.from(fs.readFileSync(path.join(__dirname, '_prova_receitas_solidos.pdf'))).toString('latin1');
  conf('nenhuma diretiva saiu impressa como texto de figura (so no cabecalho de cada pagina)', (cru.match(/@fig/g) || []).length, CASOS.length);
}

console.log('\nrecusas e avisos, num doc de rascunho');
{
  function rascunho(fig, registra, largura) {
    const d = new PDFGen.Doc(); d.novaPagina();
    if (registra) d.registrarFiguras(registra);
    let regs = 0;
    d.partesDeFigura(fig).forEach((p) => { if (p.tipo === 'figura') { if (d.figura(p.diretiva, { x: X, largura: largura || LARGURA })) regs++; } });
    return { avisos: d.avisosFigura || [], regs: regs, figs: d.figurasDesenhadas || [] };
  }
  let r;
  r = rascunho('@fig solido tipo=cubo aresta=3');
  conf('tipo=cubo e recusado com aviso', r.regs === 0 && r.avisos.some((a) => /tipo=cubo nao e um de/.test(a)));
  r = rascunho('@fig solido tipo=cone raio=5 altura=12 geratriz=12');
  conf('geratriz=12 com raio 5 e altura 12 e recusada (nao bate com 13)', r.regs === 0 && r.avisos.some((a) => /geratriz=12 nao bate/.test(a)));
  r = rascunho('@fig solido tipo=cone raio=5 geratriz=4');
  conf('geratriz menor que o raio e recusada', r.regs === 0 && r.avisos.some((a) => /nao pode ser menor ou igual ao raio/.test(a)));
  r = rascunho('@fig solido tipo=cilindro esfera=inscrita raio=3 altura=7');
  conf('esfera inscrita com altura diferente de 2r e recusada', r.regs === 0 && r.avisos.some((a) => /altura=7 nao bate/.test(a)));
  r = rascunho('@fig solido tipo=painel nome=a;b;c;d;e');
  conf('tipo=painel manda para a receita painelsolidos', r.regs === 0 && r.avisos.some((a) => /receita painelsolidos/.test(a)));
  r = rascunho('@fig solido tipo=cone raio=5 altura=12 giro=30');
  conf('giro= nao e chave da receita: aviso de chave nao declarada, e a figura sai', r.regs === 1 && r.avisos.some((a) => /chave nao declarada por solido: giro/.test(a)));
  r = rascunho('@fig painelsolidos aresta=a raio=r altura=h');
  conf('painel sem nome= desenha mudo e o painelDeSolidos avisa', r.figs.length === 5 && r.avisos.some((a) => /5 solido\(s\) para 0 nome\(s\)/.test(a)));
  const semNome = [];
  for (const f of r.figs) for (const t of textos(f)) if (/[a-z]{3,}/i.test(t.txt)) semNome.push(t.txt);
  conf('e nenhum nome nasce no desenhador', semNome.join(' ') || 'nenhum', 'nenhum');
  r = rascunho('@fig solido tipo=prisma aresta=6 altura=10 triangulo=sim');
  conf('triangulo=sim no prisma e ignorado com aviso', r.regs === 1 && r.avisos.some((a) => /triangulo=sim so vale para cone e piramide/.test(a)));
  r = rascunho('@fig solido tipo=cone raio=5 altura=h');
  conf('cone com altura chutada e sem legenda reprova pela falta do aviso de escala', r.avisos.some((a) => /fora de escala sem legenda/.test(a)));
  r = rascunho('@fig solido tipo=cone planificacao=sim setor=10 raio=6');
  conf('setor 10 com raio 6 (o setor de 180 da raio 5) e recusado', r.regs === 0 && r.avisos.some((a) => /raio da raio do setor 12 e setor da 10/.test(a)));
  r = rascunho('@fig id=zz fase=gabarito');
  conf('gabarito de id desconhecido avisa e nao desenha', r.regs === 0 && r.avisos.some((a) => /id sem figura de origem/.test(a)));
  /* Limite medido da composicao, e nao da receita: a cota da altura do
   * cilindroComEsfera sai a 14 pt da silhueta e o numero fica centrado nela,
   * entao um rotulo com mais de 28 pt de largura atravessa a silhueta e o
   * desenho.js o recolhe numa tarja estreita, com aviso. "h = 6" cabe;
   * "height = 6" nao. Em portugues a altura pedida e uma letra; a folha em
   * ingles que quiser a palavra na resposta escreve altura=h tambem. */
  r = rascunho('@fig id=e6 fase=gabarito', '@fig solido id=e6 tipo=cilindro esfera=inscrita raio=3 altura=height centro=O');
  const lHeight = PDFGen.medir('height = 6', 8.5, false), lH = PDFGen.medir('h = 6', 8.5, false);
  medido('"height = 6" mede ' + n2(lHeight) + ' pt (metade ' + n2(lHeight / 2) + ', a cota esta a 14 pt da silhueta); "h = 6" mede ' + n2(lH) + ' pt (metade ' + n2(lH / 2) + ')');
  conf('"height = 6" na cota do cilindroComEsfera nao cabe: o desenho.js avisa a tarja estreita', r.regs === 1 && r.avisos.some((a) => /height = 6.*tarja estreita/.test(a)));
  conf('e "h = 6" cabe, sem aviso', rascunho('@fig id=e7 fase=gabarito', '@fig solido id=e7 tipo=cilindro esfera=inscrita raio=3 altura=h centro=O').avisos.length, 0);
  /* O ULTIMO degrau da letra colada, e o unico em que ela ainda fala.
   *
   * A escada tem tres degraus: cabe colada (a maioria), nao cabe colada mas
   * cabe fugindo com halo e fio de chamada (as doze desta folha), e nao cabe
   * nem fugindo. So o terceiro avisa, e quem avisa e o rotulo() do desenho.js,
   * com a tarja estreita, uma vez so.
   *
   * O caso e construido de proposito e nao sai de tema nenhum: uma piramide de
   * aresta 6 por altura 24 (esbelta, entao nem a altura nem o apotema da base
   * cabem colados) num bloco de 90 pt (estreito, porque a fuga do halo e
   * obrigada a ficar dentro do bloco). A MESMA figura mostra os dois degraus de
   * cima: o "24", curto, foge calado; o "apotemadabase", de quase 61 pt de tinta, nao
   * acha lugar nem fugindo e cai na tarja, que e quem fala. O que decide nao e
   * a proporcao sozinha nem a largura do bloco sozinha: e o tamanho do texto
   * contra o lugar que sobra. */
  r = rascunho('@fig solido tipo=piramide triangulo=sim aresta=6 altura=24 apotemabase=apotemadabase apotema=g', null, 90);
  const rots = (r.figs[0] || {}).rotulos || [];
  const acha = (t) => rots.filter((x) => x.texto === t)[0] || {};
  medido('piramide 6 por 24 num bloco de 90 pt: "apotemadabase" mede ' + n2(PDFGen.medir('apotemadabase', 8.5, false)) +
    ' pt e saiu ' + (acha('apotemadabase').tarja ? 'em tarja' : 'inteiro') + '; "24" desviou ' + n2(acha('24').desviou || 0) +
    ' pt sem tarja; avisos: ' + (r.avisos.length ? r.avisos.join(' | ') : 'nenhum'));
  conf('quando nem o halo acha lugar a folha volta a falar, uma vez so, pela tarja estreita do desenho.js',
    r.regs === 1 && r.avisos.length === 1 && /apotemadabase.*nao ha posicao livre para o halo.*tarja estreita/.test(r.avisos[0]));
  conf('e na mesma figura o rotulo curto que tambem nao coube colado foge calado, sem tarja e sem aviso',
    acha('24').caiuParaHalo === true && !acha('24').tarja && (acha('24').desviou || 0) > 0);
  /* A escala do painel e UMA para os cinco. A referencia era por SOLIDO: quem
   * nao tinha nenhuma chave numerica sua saia no prototipo cru, ordem de
   * grandeza 1, enquanto os vizinhos saiam multiplicados por 6 a 10, e o painel
   * desenha os cinco na mesma escala. Medido antes: com altura=10 a esfera saia
   * com 7,30 pt de altura contra 66,32 pt dos outros quatro, 9,1 vezes menor, e
   * a celula encolhida nem marcava chute. O painel existe para o aluno
   * RECONHECER o solido pelo nome, e um solido do tamanho de um pingo nao serve
   * para isso. Estas tres diretivas sao as tres formas do defeito: cada uma
   * deixa de fora um grupo de solidos diferente. */
  function alturasDoPainel(fig) {
    const s = rascunho(fig);
    return {
      avisos: s.avisos,
      alturas: s.figs.map((f) => {
        const sd = f.solido || {};
        return (sd.altura != null ? sd.altura : 2 * sd.raio) / f.escala;
      })
    };
  }
  for (const [fig, quem] of [
    ['@fig painelsolidos nome=a;b;c;d;e altura=10 ' + LEG, 'altura=10 sozinha (a esfera nao tem altura)'],
    ['@fig painelsolidos nome=a;b;c;d;e aresta=6 ' + LEG, 'aresta=6 sozinha (cilindro, cone e esfera nao tem aresta)'],
    ['@fig painelsolidos nome=a;b;c;d;e raio=3 ' + LEG, 'raio=3 sozinho (prisma e piramide nao tem raio)']
  ]) {
    const A = alturasDoPainel(fig);
    const maior = Math.max.apply(null, A.alturas), menor = Math.min.apply(null, A.alturas);
    medido('painel com ' + quem + ': alturas em unidades ' + A.alturas.map((v) => n2(v)).join(' ') + '; maior por menor ' + n2(maior / menor));
    conf('painel com ' + quem + ': nenhuma celula sai como um pingo (razao abaixo de 2; era ate 9,08)', maior / menor < 2);
  }
  r = rascunho('@fig solido tipo=piramide triangulo=sim altura=4 apotema=5 apotemabase=99 ' + LEG);
  conf('apotemabase=99 com altura 4 e apotema 5 e recusado sem precisar de aresta= na diretiva (o valor certo e 3)',
    r.regs === 0 && r.avisos.some((a) => /apotemabase=99 nao bate com o que as outras medidas dao, 3/.test(a)));
  r = rascunho('@fig solido tipo=piramide triangulo=sim altura=4 apotema=5 apotemabase=3');
  conf('e com apotemabase=3, que e o valor certo, a mesma diretiva desenha sem aviso', r.regs === 1 && r.avisos.length === 0);
}

console.log('\n' + ok + ' conferencias passaram, ' + mau + ' falharam.');
process.exit(mau ? 1 : 0);
