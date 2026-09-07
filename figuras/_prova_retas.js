/* figuras/_prova_retas.js
 * Folha de prova da receita retas: retas soltas, paralelas com transversal,
 * angulos marcados nos cruzamentos e o feixe de Tales. Uma pagina por caso,
 * pelo caminho de verdade: a diretiva @fig e lida pelo partesDeFigura do pdf.js
 * e desenhada pelo doc.figura, como no material do tema.
 *
 * A folha e o gate visual. Quem prova e a MEDICAO no fluxo de conteudo, ou seja
 * no que vai sair impresso, e nao no que a receita disse que ia desenhar:
 *
 *   paralelismo   as duas retas do grupo saem com a MESMA inclinacao dentro de
 *                 um decimo de grau, medida nos proprios tracos da folha, e cada
 *                 uma leva a sua ponta de seta
 *   angulo        o angulo entre os dois tracos que se cruzam mede o que o
 *                 rotulo diz, e o arco varre esse mesmo angulo
 *   Tales         os segmentos que cada transversal recorta entre as paralelas
 *                 sao medidos na folha e guardam a razao escrita
 *
 * A parte que este arquivo nao mede sozinho e a que so o olho pega: o
 * _prova_retas_png.py rasteriza as paginas a 150 dpi para a folha ser OLHADA.
 *
 * ------------------------------------------------------------------ as recusas
 *
 * Cada trava aparece aqui TRES vezes e nao duas: o par envenenado, o par limpo,
 * e o caso em que o campo de que a trava precisa esta AUSENTE. O terceiro e o
 * que faltava na familia irma: la a conferencia de Pitagoras so rodava com base
 * E altura escritas, entao omitir a altura desligava a trava, e trava que nao
 * roda e indistinguivel de trava que aprova. Em cada caso de ausencia a
 * conferencia afirma qual das duas coisas aconteceu, que sao as unicas
 * permitidas: ou a receita DEDUZ o que falta e confere assim mesmo, ou ela
 * RECUSA dizendo qual campo falta. Desenhar calada nao e opcao.
 *
 * Regra da casa: nunca usar travessao.
 */
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');
const FigBase = require('./base.js');
const FigReceitas = require('./receitas.js');

const COR = PDFGen.COR;
const MARG_E = PDFGen.MARG_E, MARG_D = PDFGen.MARG_D;
const LARGURA = MARG_D - MARG_E - 40;
const LEG_ESCALA = 'legenda=Figura fora de escala.';

/* ================================================================ os casos */

const CASOS = [
  /* ------------------------------------------------- paralelas e transversal */
  { nome: 'base 35', titulo: 'retas: r e s paralelas, transversal t, o angulo agudo de 35 marcado',
    fig: '@fig retas id=r1 reta=r reta=s paralelas=r;s transversal=t angulo=35;1 nomeiaretas=sim' },
  { nome: 'base sem nomes', titulo: 'a mesma figura sem os nomes das retas: tres marcas a menos',
    fig: '@fig retas id=r2 reta=r reta=s paralelas=r;s transversal=t angulo=35;1' },
  { nome: 'oito A', titulo: 'MAT08-11 exercicio 8, figura (a): os quatro angulos de CIMA, dois por cruzamento',
    fig: '@fig retas id=r8a reta=r reta=s paralelas=r;s transversal=t angulo=35;1 incognita=b;2 incognita=e;5 incognita=f;6' },
  { nome: 'oito A gab', titulo: 'a figura (a) no gabarito: 145, 35 e 145 em teal, cada um no seu arco',
    fig: '@fig id=r8a fase=gabarito',
    gabaritoDe: '@fig retas id=r8a reta=r reta=s paralelas=r;s transversal=t angulo=35;1 incognita=b;2 incognita=e;5 incognita=f;6' },
  { nome: 'oito B', titulo: 'MAT08-11 exercicio 8, figura (b): os quatro de BAIXO, com o 35 construindo pela transversal',
    fig: '@fig retas id=r8b reta=r reta=s paralelas=r;s transversal=t;35 incognita=c;3 incognita=d;4 incognita=g;7 incognita=h;8' },
  { nome: 'oito B gab', titulo: 'a figura (b) no gabarito: 35, 145, 35 e 145 em teal',
    fig: '@fig id=r8b fase=gabarito',
    gabaritoDe: '@fig retas id=r8b reta=r reta=s paralelas=r;s transversal=t;35 incognita=c;3 incognita=d;4 incognita=g;7 incognita=h;8' },
  { nome: 'colaterais', titulo: 'colaterais internos: 110 em r e o suplemento em s, marcado x',
    fig: '@fig retas id=r3 reta=r reta=s paralelas=r;s transversal=t angulo=110;3 incognita=x;6' },
  { nome: 'colaterais gab', titulo: 'o mesmo no gabarito: x = 70 graus em teal',
    fig: '@fig id=r3 fase=gabarito',
    gabaritoDe: '@fig retas id=r3 reta=r reta=s paralelas=r;s transversal=t angulo=110;3 incognita=x;6' },
  { nome: 'correspondentes', titulo: 'correspondentes: 70 nas posicoes 1 e 5, os dois com um arco',
    fig: '@fig retas id=r4 reta=r reta=s paralelas=r;s transversal=t angulo=70;1 angulo=70;5 congruentes=1;5' },
  { nome: 'expressoes colaterais', titulo: 'MAT08-11 exercicio 6: (2x + 30) e (x + 30) colaterais internos',
    fig: '@fig retas id=r6 reta=r reta=s paralelas=r;s transversal=t angulo=2x+30;3 angulo=x+30;6' },
  { nome: 'expressoes correspondentes', titulo: 'MAT08-11 exercicio 7: (4x - 20) e (2x + 40) correspondentes',
    fig: '@fig retas id=r7 reta=r reta=s paralelas=r;s transversal=t angulo=4x-20;1 angulo=2x+40;5' },
  { nome: 'opostos', titulo: 'MAT07-11 exercicio 10: opostos pelo vertice, os dois com o mesmo arco',
    fig: '@fig retas id=r10 reta=r reta=s angulo=3x+10;1 incognita=x;3 oposto=sim' },
  { nome: 'quatro angulos', titulo: 'MAT06-09: duas concorrentes com 63 e 117 nos quatro angulos, dois grupos de arcos',
    fig: '@fig retas id=r5 reta=r reta=s angulo=63;1 angulo=117;2 angulo=63;3 angulo=117;4 congruentes=1;3 congruentes=2;4' },
  { nome: 'paralelas soltas', titulo: 'MAT04-07: duas paralelas sem transversal nenhuma, so as setinhas',
    fig: '@fig retas id=r14 reta=r reta=s paralelas=r;s nomeiaretas=sim' },
  { nome: 'perpendicular', titulo: 'MAT04-07 exercicio 3: duas retas perpendiculares, um quadradinho e nenhum arco',
    fig: '@fig retas id=r11 reta=r reta=s reto=sim nomeiaretas=sim' },
  { nome: 'girada', titulo: 'a mesma configuracao girada 20 graus, como o exercicio pede depois da explicacao',
    fig: '@fig retas id=r12 reta=r reta=s paralelas=r;s transversal=t angulo=118;1 giro=20' },
  { nome: 'cruzamentos nomeados', titulo: 'a figura base com os cruzamentos A e B nomeados, um angulo em cada',
    fig: '@fig retas id=r13 reta=r reta=s paralelas=r;s transversal=t angulo=75;4 incognita=x;5 ponto=A;B' },

  /* ------------------------------------------------- feixe de Tales */
  { nome: 'tales', titulo: 'MAT09-08 exercicio 8: feixe de tres paralelas, 6 e 10 numa transversal, 9 e x na outra',
    fig: '@fig retas id=r20 feixe=3;a;b;c transversal=t transversal=u corta=t;6 corta=t;10 corta=u;9 corta=u;x' },
  { nome: 'tales gab', titulo: 'o mesmo no gabarito: x = 15 em teal, e a cota continua preta',
    fig: '@fig id=r20 fase=gabarito',
    gabaritoDe: '@fig retas id=r20 feixe=3;a;b;c transversal=t transversal=u corta=t;6 corta=t;10 corta=u;9 corta=u;x' },
  { nome: 'tales letras', titulo: 'MAT09-08 explicacao: o feixe com a1, a2, b1 e b2, sem numero nenhum',
    fig: '@fig retas id=r21 feixe=3;a;b;c transversal=t transversal=u corta=t;3;a1 corta=t;5;a2 corta=u;3;b1 corta=u;5;b2 ' + LEG_ESCALA },

  /* ------------------------------------------------- as duas linguas */
  { nome: 'en', titulo: 'a mesma figura do 8 numa folha em ingles: os mesmos numeros e nenhuma palavra',
    fig: '@fig retas id=r30 reta=r reta=s paralelas=r;s transversal=t angulo=35;1 incognita=b;2 incognita=e;5 incognita=f;6',
    lingua: 'en' }
];

/* ================================================================ a folha */

const doc = new PDFGen.Doc();
const medidas = [];

CASOS.forEach(function (caso) {
  doc.novaPagina();
  doc.lingua = caso.lingua || 'pt';
  doc.y -= 6;
  doc.texto(caso.titulo, MARG_E, doc.y, { tam: 10, bold: true, cor: COR.navy });
  doc.y -= 12;
  doc.texto(caso.fig, MARG_E, doc.y, { tam: 7.5, cor: COR.muted });
  doc.y -= 18;
  if (caso.gabaritoDe) doc.registrarFiguras(caso.gabaritoDe);
  const pag = doc.pag, de = pag.ops.length;
  const antes = (doc.figurasDesenhadas || []).length;
  doc.partesDeFigura(caso.fig).forEach(function (p) {
    if (p.tipo === 'figura') doc.figura(p.diretiva, { x: MARG_E + 20, largura: LARGURA });
  });
  medidas.push({ caso: caso, reg: (doc.figurasDesenhadas || [])[antes] || null, ops: pag.ops.slice(de) });
  doc.lingua = 'pt';
});

fs.writeFileSync(path.join(__dirname, '_prova_retas.pdf'), doc.finalizar());
console.log('_prova_retas.pdf: ' + CASOS.length + ' paginas');

/* ================================================================ leitor de caminhos
 * O mesmo leitor das outras folhas de prova: guarda cada subcaminho com a
 * espessura, a cor e os pontos, para a conferencia medir o que vai sair
 * impresso e nao o que a receita anotou. */
function lerCaminhos(ops) {
  const toks = [];
  for (const s of ops) {
    if (s.indexOf('BT ') === 0) continue;
    for (const t of s.split(/\s+/)) if (t) toks.push(t);
  }
  const subs = [];
  let atual = null, pilha = [], w = 1, cor = null;
  const num = (k) => { const v = pilha[pilha.length - k]; return v === undefined ? 0 : v; };
  for (const t of toks) {
    const v = parseFloat(t);
    if (!isNaN(v) && /^[-+]?[\d.]+$/.test(t)) { pilha.push(v); continue; }
    switch (t) {
      case 'w': w = num(1); break;
      case 'RG': cor = [num(3), num(2), num(1)]; break;
      case 'm': atual = { pts: [{ x: num(2), y: num(1) }], curvas: 0, w: w, fechado: false, cor: cor }; subs.push(atual); break;
      case 'l': if (atual) atual.pts.push({ x: num(2), y: num(1) }); break;
      case 'c': if (atual) { atual.pts.push({ x: num(2), y: num(1) }); atual.curvas++; } break;
      case 'h': if (atual) atual.fechado = true; break;
      case 'S': case 'B': case 'B*': if (atual) { atual.pintado = 'traco'; atual.w = w; } atual = null; break;
      case 'f': case 'f*': if (atual) atual.pintado = 'area'; atual = null; break;
      case 'n': if (atual) atual.pintado = 'recorte'; atual = null; break;
      default: break;
    }
    pilha = [];
  }
  return subs;
}

const dist = (a, b) => Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));

/* Teal contra a tinta do contorno. As tres componentes, e nao so a primeira:
 * navy e teal tem a componente vermelha quase igual, e comparar so ela dava
 * qualquer texto preto por teal, o que faz a trava do codigo de cor passar
 * sempre. */
function ehTeal(cor) {
  return Math.abs(cor[0] - COR.teal[0]) < 0.01 && Math.abs(cor[1] - COR.teal[1]) < 0.01 &&
         Math.abs(cor[2] - COR.teal[2]) < 0.01;
}

/* As retas da figura sao os subcaminhos retos de 1,2 pt e comprimento grande: e
 * a espessura de contorno, o unico nivel que a receita usa para elas. */
function retasDoFluxo(ops) {
  return lerCaminhos(ops).filter((s) => s.pintado === 'traco' && s.curvas === 0 &&
    s.pts.length === 2 && Math.abs(s.w - 1.2) < 0.01 && dist(s.pts[0], s.pts[1]) > 40)
    .map((s) => ({
      a: s.pts[0], b: s.pts[1],
      graus: ((Math.atan2(s.pts[1].y - s.pts[0].y, s.pts[1].x - s.pts[0].x) * 180 / Math.PI) % 180 + 180) % 180
    }));
}

/* As pontas de seta de paralelismo: polilinha aberta de tres pontos com os dois
 * bracos do mesmo tamanho, na espessura de marca. */
function setasDoFluxo(ops) {
  return lerCaminhos(ops).filter((s) => s.pintado === 'traco' && s.curvas === 0 &&
    s.pts.length === 3 && !s.fechado && Math.abs(s.w - 0.9) < 0.01 &&
    Math.abs(dist(s.pts[0], s.pts[1]) - dist(s.pts[1], s.pts[2])) < 0.3 &&
    dist(s.pts[0], s.pts[1]) < 9);
}

/* O quadradinho de angulo reto: polilinha de tres pontos com os dois bracos
 * iguais e PERPENDICULARES entre si. A seta de paralelismo tem tres pontos
 * tambem, e o que separa as duas e o angulo entre os bracos (35 graus na seta). */
function quadradinhosDoFluxo(ops) {
  return lerCaminhos(ops).filter((s) => {
    if (s.pintado !== 'traco' || s.curvas !== 0 || s.pts.length !== 3 || s.fechado) return false;
    const u = { x: s.pts[1].x - s.pts[0].x, y: s.pts[1].y - s.pts[0].y };
    const v = { x: s.pts[2].x - s.pts[1].x, y: s.pts[2].y - s.pts[1].y };
    const nu = Math.sqrt(u.x * u.x + u.y * u.y), nv = Math.sqrt(v.x * v.x + v.y * v.y);
    if (nu < 3 || nv < 3 || Math.abs(nu - nv) > 0.3) return false;
    return Math.abs((u.x * v.x + u.y * v.y) / (nu * nv)) < 0.02;
  });
}

/* Onde duas retas do fluxo se cruzam, ou null quando elas sao paralelas. */
function cruzar(r1, r2) {
  const p = r1.a, r = { x: r1.b.x - r1.a.x, y: r1.b.y - r1.a.y };
  const q = r2.a, s = { x: r2.b.x - r2.a.x, y: r2.b.y - r2.a.y };
  const den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((q.x - p.x) * s.y - (q.y - p.y) * s.x) / den;
  return { x: p.x + t * r.x, y: p.y + t * r.y };
}

function achar(nome) {
  const m = medidas.filter((q) => q.caso.nome === nome)[0];
  if (!m) throw new Error('caso ' + nome + ' nao foi desenhado');
  return m;
}
function textos(m) { return ((m.reg && m.reg.medido && m.reg.medido.textos) || []); }
function tem(m, txt) { return textos(m).filter((t) => t.txt === txt).length; }
function arcos(m) { return ((m.reg && m.reg.medido && m.reg.medido.arcos) || []); }
function corDe(m, txt) {
  const t = textos(m).filter((x) => x.txt === txt)[0];
  if (!t) return '(nao saiu)';
  const perto = (a) => Math.abs(t.cor[0] - a[0]) + Math.abs(t.cor[1] - a[1]) + Math.abs(t.cor[2] - a[2]) < 0.01;
  return perto(COR.teal) ? 'teal' : (perto(COR.texto) ? 'preto' : t.cor.map((v) => v.toFixed(2)).join('/'));
}

/* ================================================================ conferencias */

let ok = 0, mau = 0;
function conf(rotulo, cond, extra) {
  if (cond) ok++; else mau++;
  console.log((cond ? '  OK    ' : '  FALHA ') + rotulo + (extra ? '   ' + extra : ''));
}

console.log('\nas paralelas sao paralelas na folha, e cada uma leva a sua seta');
{
  const m = achar('base 35');
  const rs = retasDoFluxo(m.ops);
  conf('a figura tem tres retas de contorno', rs.length === 3, rs.length + ' retas');
  const horizontais = rs.filter((r) => Math.min(r.graus, 180 - r.graus) < 1);
  conf('duas delas sao o grupo de paralelas', horizontais.length === 2);
  const desvio = horizontais.length === 2 ? Math.abs(horizontais[0].graus - horizontais[1].graus) : 99;
  conf('e saem com a MESMA inclinacao dentro de um decimo de grau',
    desvio < 0.1, 'desvio de ' + desvio.toFixed(4) + ' grau');
  conf('cada paralela leva uma ponta de seta, e a transversal nenhuma',
    setasDoFluxo(m.ops).length === 2, setasDoFluxo(m.ops).length + ' pontas');
  /* As duas setas apontam para o mesmo lado: cruas, uma apontaria para a
   * esquerda e a outra para a direita, o que se le como sentido e nao como
   * paralelismo. */
  const bicos = setasDoFluxo(m.ops).map((s) => {
    const meio = { x: (s.pts[0].x + s.pts[2].x) / 2, y: (s.pts[0].y + s.pts[2].y) / 2 };
    return Math.atan2(s.pts[1].y - meio.y, s.pts[1].x - meio.x) * 180 / Math.PI;
  });
  conf('e as duas apontam para o mesmo lado', bicos.length === 2 && Math.abs(bicos[0] - bicos[1]) < 1,
    bicos.map((b) => b.toFixed(1)).join(' e ') + ' graus');
  /* Reta que para nos dois pontos dados vira segmento e ensina que a solucao so
   * pode estar entre eles. A prova de que ela nao para e geometrica: as seis
   * pontas das tres retas caem todas na BORDA de um mesmo retangulo, que e a
   * moldura da figura, e nenhuma delas cai perto de um cruzamento. */
  {
    const pontas = [];
    for (const r of rs) { pontas.push(r.a); pontas.push(r.b); }
    const bx = {
      x0: Math.min(...pontas.map((p) => p.x)), x1: Math.max(...pontas.map((p) => p.x)),
      y0: Math.min(...pontas.map((p) => p.y)), y1: Math.max(...pontas.map((p) => p.y))
    };
    const naBorda = (p) => Math.min(Math.abs(p.x - bx.x0), Math.abs(p.x - bx.x1),
                                    Math.abs(p.y - bx.y0), Math.abs(p.y - bx.y1)) < 0.5;
    conf('as seis pontas das tres retas caem na borda da mesma moldura',
      pontas.every(naBorda), 'moldura de ' + (bx.x1 - bx.x0).toFixed(0) + ' por ' + (bx.y1 - bx.y0).toFixed(0) + ' pt');
    const cruz = [];
    for (let i = 0; i < rs.length; i++) {
      for (let j = i + 1; j < rs.length; j++) { const c = cruzar(rs[i], rs[j]); if (c) cruz.push(c); }
    }
    conf('e nenhuma ponta esta a menos de 25 pt de um cruzamento: a reta nao para neles',
      pontas.every((p) => cruz.every((c) => dist(p, c) > 25)),
      cruz.length + ' cruzamentos');
  }
  conf('r, s e t saem impressos, vindos da diretiva', tem(m, 'r') === 1 && tem(m, 's') === 1 && tem(m, 't') === 1);
  conf('no teto de cinco marcas (35, r, s, t e o paralelismo)', m.reg.marcasAtivas === 5, m.reg.marcasAtivas + ' marcas');
  conf('sem falha de conferencia', (m.reg.conferencia || []).length === 0, (m.reg.conferencia || []).join(' | '));
}

console.log('\no angulo de 35 e 35 na folha, medido entre os proprios tracos');
{
  const m = achar('base sem nomes');
  const rs = retasDoFluxo(m.ops);
  const hor = rs.filter((r) => Math.min(r.graus, 180 - r.graus) < 1)[0];
  const tr = rs.filter((r) => Math.min(r.graus, 180 - r.graus) >= 1)[0];
  const abre = Math.abs(tr.graus - hor.graus);
  conf('o angulo entre a paralela e a transversal mede 35 graus na folha',
    Math.abs(abre - 35) < 0.1, 'medido ' + abre.toFixed(3));
  const a = arcos(m);
  conf('e o arco varre os mesmos 35', a.length === 1 && Math.abs(a[0].abertura - 35) < 1,
    a.map((x) => x.abertura.toFixed(2)).join(', '));
  conf('o 35 sai com o simbolo de grau', tem(m, '35°') === 1);
  conf('sem falha de conferencia', (m.reg.conferencia || []).length === 0, (m.reg.conferencia || []).join(' | '));
}

console.log('\nMAT08-11 exercicio 8: os oito angulos em duas figuras de quatro');
{
  const a = achar('oito A'), b = achar('oito B');
  conf('a figura (a) fica no teto de cinco marcas', a.reg.marcasAtivas === 5, a.reg.marcasAtivas + ' marcas');
  conf('a figura (b) tambem', b.reg.marcasAtivas === 5, b.reg.marcasAtivas + ' marcas');
  conf('em (a) saem 35, b, e e f', tem(a, '35°') === 1 && tem(a, 'b') === 1 && tem(a, 'e') === 1 && tem(a, 'f') === 1);
  conf('em (b) saem c, d, g e h, sem numero: o 35 construiu pela inclinacao da transversal',
    tem(b, 'c') === 1 && tem(b, 'd') === 1 && tem(b, 'g') === 1 && tem(b, 'h') === 1 && tem(b, '35°') === 0);
  const arA = arcos(a).map((x) => x.abertura).sort((x, y) => x - y);
  conf('em (a) os quatro arcos varrem 35, 35, 145 e 145',
    arA.length === 4 && Math.abs(arA[0] - 35) < 1 && Math.abs(arA[1] - 35) < 1 &&
    Math.abs(arA[2] - 145) < 1 && Math.abs(arA[3] - 145) < 1, arA.map((v) => v.toFixed(1)).join(', '));
  conf('nenhuma das duas tem falha de conferencia',
    (a.reg.conferencia || []).length === 0 && (b.reg.conferencia || []).length === 0,
    (a.reg.conferencia || []).concat(b.reg.conferencia || []).join(' | '));
  /* Os arcos de um mesmo cruzamento nao podem se emendar: e a trava (c) do
   * conferirFigura, e ela e a razao de a receita usar dois niveis de raio. */
  const raios = arcos(a).map((x) => x.raio).sort((x, y) => x - y);
  conf('e os quatro arcos ficam em dois niveis de raio, com folga entre eles',
    raios.length === 4 && Math.abs(raios[0] - raios[1]) < 0.2 && raios[2] - raios[1] >= 6,
    'raios ' + raios.map((v) => v.toFixed(1)).join(', '));
  /* A divisao dos oito angulos e por METADE da folha e nao por cruzamento: assim
   * cada cruzamento leva DOIS arcos e nao quatro. Quatro arcos num vertice cobrem
   * os 360 graus e fecham um circulo com duas mordidas, que e o borrao que a
   * especificacao manda evitar; dois arcos adjacentes leem como "o angulo e o
   * suplemento dele", que e exatamente o que a questao pergunta. */
  const porVertice = {};
  for (const x of arcos(a)) {
    const ch = x.cx.toFixed(0) + ',' + x.cy.toFixed(0);
    porVertice[ch] = (porVertice[ch] || 0) + 1;
  }
  conf('e cada cruzamento leva DOIS arcos, nunca quatro',
    Object.keys(porVertice).length === 2 && Object.keys(porVertice).every((c) => porVertice[c] === 2),
    JSON.stringify(porVertice));

  const ga = achar('oito A gab'), gb = achar('oito B gab');
  conf('no gabarito de (a) as tres letras viram 145, 35 e 145',
    tem(ga, '145°') === 2 && tem(ga, '35°') === 2, textos(ga).map((t) => t.txt).join(' '));
  conf('e no de (b), que nao tinha numero escrito, as quatro letras viram 35, 145, 35 e 145',
    tem(gb, '145°') === 2 && tem(gb, '35°') === 2, textos(gb).map((t) => t.txt).join(' '));
  conf('as respostas saem em teal', corDe(ga, '145°') === 'teal');
  conf('e o 35 do enunciado continua preto',
    textos(ga).filter((t) => t.txt === '35°' && corDe({ reg: { medido: { textos: [t] } } }, '35°') === 'preto').length === 1);
  conf('o gabarito de (b) tambem fica no teto', gb.reg.marcasAtivas === 5, gb.reg.marcasAtivas + ' marcas');
  conf('sem falha de conferencia nos dois gabaritos',
    (ga.reg.conferencia || []).length === 0 && (gb.reg.conferencia || []).length === 0,
    (ga.reg.conferencia || []).concat(gb.reg.conferencia || []).join(' | '));
}

console.log('\ncolaterais internos somam 180, correspondentes sao iguais');
{
  const m = achar('colaterais');
  const a = arcos(m).map((x) => x.abertura).sort((x, y) => x - y);
  conf('os dois arcos varrem 70 e 110, que somam 180',
    a.length === 2 && Math.abs(a[0] + a[1] - 180) < 1, a.map((v) => v.toFixed(1)).join(' e '));
  conf('o dado 110 sai no enunciado e a incognita x tambem', tem(m, '110°') === 1 && tem(m, 'x') === 1);
  const g0 = achar('colaterais gab');
  conf('no gabarito o x vira 70 graus em teal', tem(g0, '70°') === 1 && corDe(g0, '70°') === 'teal');

  const c = achar('correspondentes');
  const ac = arcos(c).map((x) => x.abertura);
  conf('os correspondentes saem com a mesma abertura', ac.length === 2 && Math.abs(ac[0] - ac[1]) < 1,
    ac.map((v) => v.toFixed(1)).join(' e '));
  conf('e os dois com o mesmo raio, que e o que diz congruencia',
    Math.abs(arcos(c)[0].raio - arcos(c)[1].raio) < 0.2);
  conf('o 70 sai duas vezes', tem(c, '70°') === 2);
}

console.log('\nas expressoes fecham o sistema e a figura sai na ordem da resposta');
{
  const m = achar('expressoes colaterais');
  const a = arcos(m).map((x) => x.abertura).sort((x, y) => x - y);
  conf('(2x + 30) e (x + 30) dao 110 e 70 desenhados',
    a.length === 2 && Math.abs(a[0] - 70) < 1 && Math.abs(a[1] - 110) < 1, a.map((v) => v.toFixed(1)).join(' e '));
  conf('as duas expressoes saem impressas como o tema escreveu',
    tem(m, '2x+30') === 1 && tem(m, 'x+30') === 1);
  conf('sem falha de conferencia (a trava de ordem invertida nao acusa)',
    (m.reg.conferencia || []).length === 0, (m.reg.conferencia || []).join(' | '));

  const c = achar('expressoes correspondentes');
  const ac = arcos(c).map((x) => x.abertura);
  conf('(4x - 20) e (2x + 40) dao os dois com 100', ac.length === 2 &&
    Math.abs(ac[0] - 100) < 1 && Math.abs(ac[1] - 100) < 1, ac.map((v) => v.toFixed(1)).join(' e '));
}

console.log('\nopostos pelo vertice: mesmo numero de arcos, mesmo raio');
{
  const m = achar('opostos');
  const a = arcos(m);
  conf('os dois angulos opostos saem com a mesma abertura',
    a.length === 2 && Math.abs(a[0].abertura - a[1].abertura) < 1, a.map((x) => x.abertura.toFixed(1)).join(' e '));
  conf('e com o mesmo raio, que e a notacao de congruencia',
    a.length === 2 && Math.abs(a[0].raio - a[1].raio) < 0.2, a.map((x) => x.raio.toFixed(1)).join(' e '));
  /* So letras na diretiva: a receita RESOLVE o sistema, a construcao sai exata e
   * nao ha nada fora de escala, entao a figura nao pede legenda. E a regra de
   * tres saidas que o triangulo e o quadrilatero ja seguem. */
  conf('so com letras a figura NAO sai fora de escala, porque a construcao e exata',
    m.reg.foraDeEscala === false);

  /* Os quatro angulos rotulados saem com UM arco cada, e nao com as voltas de
   * congruencia: o valor escrito ao lado ja diz quais sao iguais, e o arco a mais
   * seria repeticao dentro do mesmo canal. Com as voltas eram seis arcos
   * empilhados num circulo de 24 pt de diametro, medido na rasterizacao a 150
   * dpi: um no em volta do cruzamento, exatamente o borrao que a especificacao
   * manda evitar. */
  const q = achar('quatro angulos');
  const aq = arcos(q);
  conf('os quatro angulos rotulados saem com um arco cada, e nao com as voltas',
    aq.length === 4, aq.length + ' arcos');
  const r63 = aq.filter((x) => Math.abs(x.abertura - 63) < 1).map((x) => x.raio);
  const r117 = aq.filter((x) => Math.abs(x.abertura - 117) < 1).map((x) => x.raio);
  conf('os dois de 63 no mesmo raio, que e o que diz que sao iguais',
    r63.length === 2 && Math.abs(r63[0] - r63[1]) < 0.2, r63.map((v) => v.toFixed(1)).join(', '));
  conf('e os dois de 117 no outro raio, com folga de pelo menos 6 pt para o primeiro',
    r117.length === 2 && Math.abs(r117[0] - r117[1]) < 0.2 && Math.abs(r117[0] - r63[0]) >= 6,
    r117.map((v) => v.toFixed(1)).join(', '));
  conf('sem falha de conferencia: nenhum par de arcos se emenda',
    (q.reg.conferencia || []).length === 0, (q.reg.conferencia || []).join(' | '));
  /* O par limpo da regra acima: sem valor escrito, a contagem de arcos volta a
   * ser o unico canal de congruencia e as voltas saem. */
  {
    const v = saiu('@fig retas reta=r reta=s congruentes=1;3 congruentes=2;4');
    const av = (v.medido.arcos || []);
    conf('sem valor nenhum, os mesmos grupos saem com uma e com duas voltas',
      av.length === 6, av.length + ' arcos');
    conf('e a figura custa duas marcas, uma por grupo de congruencia',
      v.marcasAtivas === 2, v.marcasAtivas + ' marcas');
  }
}

console.log('\nparalelas soltas: sem cruzamento nenhum, so as duas retas e as setas');
{
  const m = achar('paralelas soltas');
  const rs = retasDoFluxo(m.ops);
  conf('saem exatamente duas retas, e nenhuma transversal', rs.length === 2, rs.length + ' retas');
  conf('as duas com a mesma inclinacao',
    rs.length === 2 && Math.abs(rs[0].graus - rs[1].graus) < 0.1);
  conf('cada uma com a sua ponta de seta', setasDoFluxo(m.ops).length === 2);
  conf('e nenhum arco, porque nao ha cruzamento', arcos(m).length === 0);
  conf('r e s saem impressos', tem(m, 'r') === 1 && tem(m, 's') === 1);
  conf('sem falha de conferencia', (m.reg.conferencia || []).length === 0, (m.reg.conferencia || []).join(' | '));
  /* CAMPO AUSENTE: a transversal. A figura muda de especie e continua legitima,
   * mas a receita se recusa a aceitar chave de angulo ali: sem cruzamento nao
   * nasce angulo nenhum e o valor escrito nao chegaria na folha. */
  conf('envenenado: angulo= num grupo de paralelas sem transversal e recusado',
    comAviso('@fig retas reta=r reta=s paralelas=r;s angulo=35;1', 'nao chegaria na folha') === 1);
  conf('limpo: com transversal= o mesmo angulo passa',
    comAviso('@fig retas reta=r reta=s paralelas=r;s transversal=t angulo=35;1', 'nao chegaria na folha') === 0);
}

console.log('\nperpendicular: um quadradinho, nenhum arco e nenhum 90 escrito');
{
  const m = achar('perpendicular');
  conf('sai exatamente um quadradinho', quadradinhosDoFluxo(m.ops).length === 1,
    quadradinhosDoFluxo(m.ops).length + ' quadradinhos');
  conf('e nenhum arco', arcos(m).length === 0, arcos(m).length + ' arcos');
  conf('e o texto 90 nao aparece em lugar nenhum', tem(m, '90°') === 0 && tem(m, '90') === 0);
  const rs = retasDoFluxo(m.ops);
  const dif = rs.length === 2 ? Math.abs(rs[0].graus - rs[1].graus) : 0;
  conf('as duas retas cruzam a 90 graus na folha', Math.abs(dif - 90) < 0.1, 'medido ' + dif.toFixed(3));
  conf('sem falha de conferencia', (m.reg.conferencia || []).length === 0, (m.reg.conferencia || []).join(' | '));
}

console.log('\ngiro e cruzamento nomeado');
{
  const m = achar('girada');
  const rs = retasDoFluxo(m.ops);
  const hor = rs.filter((r) => Math.abs(r.graus - 20) < 1);
  conf('as duas paralelas saem a 20 graus da horizontal', hor.length === 2,
    rs.map((r) => r.graus.toFixed(1)).join(', '));
  conf('e o arco continua varrendo os 118 escritos',
    arcos(m).some((x) => Math.abs(x.abertura - 118) < 1), arcos(m).map((x) => x.abertura.toFixed(1)).join(', '));

  const p = achar('cruzamentos nomeados');
  conf('A e B saem impressos', tem(p, 'A') === 1 && tem(p, 'B') === 1);
  conf('cada um dos dois cruzamentos nomeados tem o seu arco',
    arcos(p).length === 2, arcos(p).length + ' arcos');
  conf('sem falha de conferencia: a letra nao gruda no valor nem falta arco',
    (p.reg.conferencia || []).length === 0, (p.reg.conferencia || []).join(' | '));
  /* CAMPO AUSENTE: o angulo NAQUELE cruzamento. A trava do conferirFigura que
   * cobra arco em cruzamento nomeado nao alcanca esta receita, porque la o laco
   * pula todo traco de papel 'contorno' e as retas daqui sao contorno. A receita
   * cobra por conta propria, e o caso que passava era exatamente este: um angulo
   * so, no OUTRO cruzamento. */
  conf('envenenado: ponto=A;B com angulo so no primeiro cruzamento e recusado',
    comAviso('@fig retas reta=r reta=s paralelas=r;s transversal=t angulo=75;4 ponto=A;B',
      'nao tem angulo nenhum marcado') === 1);
  conf('limpo: com um angulo em cada cruzamento os dois nomes passam',
    comAviso('@fig retas reta=r reta=s paralelas=r;s transversal=t angulo=75;4 incognita=x;5 ponto=A;B',
      'nao tem angulo nenhum marcado') === 0);
  conf('e nomear so o primeiro cruzamento tambem passa',
    comAviso('@fig retas reta=r reta=s paralelas=r;s transversal=t angulo=75;4 ponto=A',
      'nao tem angulo nenhum marcado') === 0);
}

console.log('\no feixe de Tales: a razao medida na folha');
{
  const m = achar('tales');
  const rs = retasDoFluxo(m.ops);
  const paralelas = rs.filter((r) => Math.min(r.graus, 180 - r.graus) < 1);
  const transversais = rs.filter((r) => Math.min(r.graus, 180 - r.graus) >= 1);
  conf('tres paralelas e duas transversais', paralelas.length === 3 && transversais.length === 2,
    paralelas.length + ' e ' + transversais.length);
  paralelas.sort((a, b) => b.a.y - a.a.y);
  const razoes = transversais.map((t) => {
    const P = paralelas.map((p) => cruzar(t, p));
    return dist(P[0], P[1]) / dist(P[1], P[2]);
  });
  conf('na transversal t os segmentos recortados estao na razao 6 para 10',
    Math.abs(razoes[0] - 0.6) < 0.005, 'medido ' + razoes[0].toFixed(4));
  conf('e na transversal u a razao e a MESMA, que e o teorema',
    Math.abs(razoes[0] - razoes[1]) < 0.005, 'medido ' + razoes[1].toFixed(4));
  conf('os quatro valores saem cotados', tem(m, '6') === 1 && tem(m, '10') === 1 &&
    tem(m, '9') === 1 && tem(m, 'x') === 1);
  conf('cada paralela leva a sua seta de paralelismo', setasDoFluxo(m.ops).length === 3,
    setasDoFluxo(m.ops).length + ' pontas');
  conf('no teto de cinco marcas (quatro cotas e o paralelismo)', m.reg.marcasAtivas === 5,
    m.reg.marcasAtivas + ' marcas');
  conf('sem falha de conferencia', (m.reg.conferencia || []).length === 0, (m.reg.conferencia || []).join(' | '));

  const g = achar('tales gab');
  conf('no gabarito o x vira x = 15, pela razao de Tales', tem(g, 'x = 15') === 1,
    textos(g).map((t) => t.txt).join(' '));
  conf('e em teal', corDe(g, 'x = 15') === 'teal');
  /* A cota e feita de tres pecas e a mais leve delas sai a 0,6 pt: teal a 0,6
   * some na fotocopia, entao quem vira teal e o numero e nunca a linha. */
  const tealFinas = lerCaminhos(g.ops).filter((s) => s.cor && ehTeal(s.cor));
  conf('nenhuma LINHA sai em teal no gabarito, so o numero', tealFinas.length === 0,
    tealFinas.length + ' caminhos teal');

  const L = achar('tales letras');
  conf('o feixe so com letras sai com a1, a2, b1 e b2',
    tem(L, 'a1') === 1 && tem(L, 'a2') === 1 && tem(L, 'b1') === 1 && tem(L, 'b2') === 1);
}

console.log('\nas duas linguas: os mesmos numeros e nenhuma palavra na folha inglesa');
{
  const pt = achar('oito A'), en = achar('en');
  /* A folha inglesa desenha a MESMA diretiva da portuguesa, letra por letra: e
   * assim que o tema escreve, e o que se prova aqui e que o desenhador nao muda
   * nada por causa da lingua. */
  const tpt = textos(pt).map((t) => t.txt).sort().join(' ');
  const ten = textos(en).map((t) => t.txt).sort().join(' ');
  conf('a folha em ingles imprime exatamente os mesmos rotulos da portuguesa', tpt === ten,
    'PT: ' + tpt + '   EN: ' + ten);
  conf('e nenhum deles e palavra (nada de tres letras seguidas)',
    !textos(en).some((t) => /[A-Za-zÀ-ÿ]{3,}/.test(t.txt)), ten);
  conf('sem falha de conferencia na folha inglesa', (en.reg.conferencia || []).length === 0,
    (en.reg.conferencia || []).join(' | '));
}

/* ================================================================ as recusas
 *
 * Cada trava com o par envenenado, o par limpo, e o caso do campo AUSENTE. */

console.log('\nas recusas, cada uma com o par limpo e com o caso do campo ausente');
function desenhar(texto, lingua) {
  const d = new PDFGen.Doc();
  d.novaPagina();
  if (lingua) d.lingua = lingua;
  d.partesDeFigura(texto).forEach(function (p) {
    if (p.tipo === 'figura') d.figura(p.diretiva, { x: MARG_E + 20, largura: LARGURA });
  });
  return d;
}
function comAviso(texto, pedaco) {
  return (desenhar(texto).avisosFigura || []).filter((a) => a.indexOf(pedaco) >= 0).length;
}
function saiu(texto) {
  const d = desenhar(texto);
  return (d.figurasDesenhadas || []).length ? d.figurasDesenhadas[0] : null;
}

console.log('  trava: a transversal que nao corta o grupo');
conf('envenenado: transversal declarada com a inclinacao do grupo e recusada',
  comAviso('@fig retas reta=r reta=s paralelas=r;s transversal=t;0 angulo=35;1', 'paralela as outras') === 1);
conf('limpo: com 55 graus a mesma figura sai',
  comAviso('@fig retas reta=r reta=s paralelas=r;s transversal=t;55 angulo=35;1', 'paralela as outras') === 0);
/* CAMPO AUSENTE: a inclinacao. A trava olha o angulo JA RESOLVIDO e nao a
 * diretiva, entao sem inclinacao escrita ela continua rodando; o que muda e que
 * o padrao de 55 graus nunca produz uma transversal paralela, e ai nao ha o que
 * recusar. A figura sai desenhada com um cruzamento de verdade. */
{
  const r = saiu('@fig retas reta=r reta=s paralelas=r;s transversal=t');
  conf('ausente: sem inclinacao nenhuma a receita DESENHA, com o cruzamento padrao', !!r);
  conf('e o cruzamento e de verdade, nao de zero grau',
    !!r && (r.medido.arcos || []).length === 0 && r.medido.segmentos.length > 0);
}

console.log('  trava: valores que contradizem o paralelismo que a figura afirma');
conf('envenenado: colaterais internos 70 e 80 sao recusados',
  comAviso('@fig retas reta=r reta=s paralelas=r;s transversal=t angulo=70;3 angulo=80;6', 'nao cabem na mesma figura') === 1);
conf('limpo: 70 e 110 passam, porque somam 180',
  comAviso('@fig retas reta=r reta=s paralelas=r;s transversal=t angulo=70;3 angulo=110;6', 'nao cabem na mesma figura') === 0);
conf('envenenado: correspondentes 70 e 75 sao recusados',
  comAviso('@fig retas reta=r reta=s paralelas=r;s transversal=t angulo=70;1 angulo=75;5', 'nao cabem na mesma figura') === 1);
conf('limpo: correspondentes 70 e 70 passam',
  comAviso('@fig retas reta=r reta=s paralelas=r;s transversal=t angulo=70;1 angulo=70;5', 'nao cabem na mesma figura') === 0);
/* CAMPO AUSENTE: o SEGUNDO valor. E aqui que a familia irma se perdeu. Um valor
 * numerico ja fixa a figura inteira, entao a conferencia nao precisa de dois:
 * ela roda contra a configuracao deduzida. A prova disso e medir as OITO
 * posicoes com um dado so e cobrar que elas fechem. */
{
  const d = desenhar('@fig retas reta=r reta=s paralelas=r;s transversal=t angulo=70;3 incognita=x;6');
  const r = d.figurasDesenhadas[0];
  const a = (r.medido.arcos || []).map((x) => x.abertura).sort((x, y) => x - y);
  conf('ausente: com UM valor so a figura sai e os outros sete angulos sao deduzidos',
    !!r && a.length === 2 && Math.abs(a[0] - 70) < 1 && Math.abs(a[1] - 110) < 1,
    a.map((v) => v.toFixed(1)).join(' e '));
  conf('e a conferencia rodou: o arco do colateral varre 110 e nao um valor qualquer',
    Math.abs(a[1] - 110) < 1);
}
/* CAMPO AUSENTE: a POSICAO. Sem ela o valor cai na proxima livre, na volta, e
 * continua sendo conferido: 35 e 70 caem em 1 e 2, que sao suplementares, e a
 * mesma recusa acontece. Omitir a posicao nao desliga a trava. */
conf('ausente: sem posicao escrita, angulo=35 angulo=70 cai em 1 e 2 e e recusado igual',
  comAviso('@fig retas reta=r reta=s paralelas=r;s transversal=t angulo=35 angulo=70', 'nao cabem na mesma figura') === 1);
conf('e angulo=35 angulo=145, que sao suplementares, passa',
  comAviso('@fig retas reta=r reta=s paralelas=r;s transversal=t angulo=35 angulo=145', 'nao cabem na mesma figura') === 0);
/* CAMPO AUSENTE: nenhum valor. A figura sai do padrao, nao esta deduzida, e a
 * camada de gabarito se RECUSA a escrever numero: escrever seria medir o chute. */
{
  const g = saiu('@fig retas reta=r reta=s paralelas=r;s transversal=t incognita=x fase=gabarito');
  const nums = (g.medido.textos || []).filter((t) => /\d/.test(t.txt));
  conf('ausente: sem dado nenhum, o gabarito nao inventa numero para a incognita',
    nums.length === 0, (g.medido.textos || []).map((t) => t.txt).join(' '));
  conf('e o x continua escrito', (g.medido.textos || []).some((t) => t.txt === 'x'));
}

console.log('  trava: reta citada em paralelas= que ninguem declarou');
conf('envenenado: paralelas=r;z com z nao declarada e recusado',
  comAviso('@fig retas reta=r reta=s paralelas=r;z transversal=t angulo=35;1', 'nao foi declarada') === 1);
conf('limpo: paralelas=r;s passa',
  comAviso('@fig retas reta=r reta=s paralelas=r;s transversal=t angulo=35;1', 'nao foi declarada') === 0);
/* CAMPO AUSENTE: a propria chave paralelas=. Nao ha conferencia desligada: a
 * figura muda de especie (duas concorrentes, quatro posicoes) e a receita se
 * recusa a desenhar a setinha de paralelismo, que e a afirmacao que nao foi
 * feita. */
{
  const r = saiu('@fig retas reta=r reta=s angulo=35;1');
  conf('ausente: sem paralelas= a figura sai como duas concorrentes', !!r);
  conf('e sem nenhuma seta de paralelismo, porque ninguem afirmou paralelismo',
    !!r && !(r.marcas || []).some((mk) => mk.tipo === 'paralelismo'),
    (r.marcas || []).map((mk) => mk.tipo).join(', '));
}

console.log('  trava: o cruzamento reto e o quadradinho');
conf('envenenado: um cruzamento de 90 graus sem reto=sim e recusado',
  comAviso('@fig retas reta=r reta=s paralelas=r;s transversal=t angulo=90;1', 'Escreva reto=sim') === 1);
conf('limpo: reto=sim sozinho passa',
  comAviso('@fig retas reta=r reta=s reto=sim', 'Escreva reto=sim') === 0);
conf('envenenado: reto=sim com angulo escrito e recusado, porque o valor nao chega na folha',
  comAviso('@fig retas reta=r reta=s reto=sim angulo=90;1', 'nao chegariam na folha') === 1);
/* CAMPO AUSENTE: reto=. Sem ele, a receita nao desenha 90 em arco calada: ela
 * recusa e diz qual chave falta. */
conf('ausente: reto= omitido nao faz a figura passar calada com arco de 90',
  comAviso('@fig retas reta=r reta=s transversal=t;90', 'Escreva reto=sim') === 1);

console.log('  trava: o feixe de Tales');
conf('envenenado: 6 e 10 contra 9 e 12 nao guardam a razao e sao recusados',
  comAviso('@fig retas feixe=3;a;b;c transversal=t transversal=u corta=t;6 corta=t;10 corta=u;9 corta=u;12',
    'nao guardam a razao de Tales') === 1);
conf('limpo: 6 e 10 contra 9 e 15 passam',
  comAviso('@fig retas feixe=3;a;b;c transversal=t transversal=u corta=t;6 corta=t;10 corta=u;9 corta=u;15',
    'nao guardam a razao de Tales') === 0);
conf('envenenado: feixe=1 nao e feixe',
  comAviso('@fig retas feixe=1;a transversal=t transversal=u', 'pelo menos duas paralelas') === 1);
conf('envenenado: feixe com uma transversal so nao tem o que comparar',
  comAviso('@fig retas feixe=3;a;b;c transversal=t corta=t;6 corta=t;10', 'DUAS transversais') === 1);
/* CAMPO AUSENTE: os numeros da segunda transversal. A trava nao tem par para
 * conferir, e a receita nao fica calada: ela DEDUZ o que falta pela razao e o
 * gabarito escreve o valor. */
conf('ausente: com 9 e uma letra na segunda transversal, a receita deduz e o gabarito responde',
  tem({ reg: saiu('@fig retas feixe=3;a;b;c transversal=t transversal=u corta=t;6 corta=t;10 corta=u;9 corta=u;x fase=gabarito') }, 'x = 15') === 1);
/* CAMPO AUSENTE: os numeros das DUAS transversais. Ai nao ha razao nenhuma, os
 * vaos saem iguais, e isso e uma AFIRMACAO: a receita avisa em vez de desenhar
 * calada uma figura que diz que os segmentos sao congruentes. */
conf('ausente: sem numero em transversal nenhuma, a receita AVISA que os vaos saem iguais',
  comAviso('@fig retas feixe=3;a;b;c transversal=t transversal=u corta=t;a1 corta=t;a2 corta=u;b1 corta=u;b2',
    'os vaos saem IGUAIS') === 1);
conf('e com os numeros de uma delas o aviso some',
  comAviso('@fig retas feixe=3;a;b;c transversal=t transversal=u corta=t;3;a1 corta=t;5;a2',
    'os vaos saem IGUAIS') === 0);
conf('corta= sem valor nenhum e recusado, porque a cota sairia sem numero',
  comAviso('@fig retas feixe=3;a;b;c transversal=t transversal=u corta=t', 'sem o valor a cota') === 1);
conf('corta= fora do feixe e recusado, dizendo qual chave falta',
  comAviso('@fig retas reta=r reta=s paralelas=r;s transversal=t corta=t;6', 'nao tem feixe=') === 1);

console.log('  trava: o teto de cinco marcas');
conf('envenenado: os oito rotulos numa figura so sao reprovados pelo conferirFigura',
  comAviso('@fig retas reta=r reta=s paralelas=r;s transversal=t nomeiaangulos=a;b;c;d;e;f;g;h',
    'marcas ativas: 9') === 1);
conf('limpo: quatro rotulos por figura passam',
  comAviso('@fig retas reta=r reta=s paralelas=r;s transversal=t nomeiaangulos=a;b;c;d', 'marcas ativas') === 0);
conf('e a figura dos quatro fica exatamente no teto',
  saiu('@fig retas reta=r reta=s paralelas=r;s transversal=t nomeiaangulos=a;b;c;d').marcasAtivas === 5);

console.log('  trava: o codigo de cor do gabarito fora da fase gabarito');
{
  /* Teal e o tracejado [3 2] sao o codigo reservado a camada de resposta. Numa
   * figura de enunciado o conferirFigura reprova qualquer linha assim, e a
   * receita nao emite nenhuma: a conferencia abaixo mede o fluxo inteiro. */
  const d = desenhar('@fig retas reta=r reta=s paralelas=r;s transversal=t angulo=110;3 incognita=x;6');
  const r = d.figurasDesenhadas[0];
  const tealNoEnunciado = (r.medido.segmentos || []).filter((s) => s.cor && ehTeal(s.cor));
  conf('limpo: nenhuma linha teal na figura de enunciado', tealNoEnunciado.length === 0,
    tealNoEnunciado.length + ' segmentos');
  const textoTeal = (r.medido.textos || []).filter((t) => t.cor && ehTeal(t.cor));
  conf('e nenhum texto teal tambem', textoTeal.length === 0, textoTeal.map((t) => t.txt).join(' '));
  /* O par envenenado: a MESMA figura na camada de gabarito tem que trazer teal,
   * senao a conferencia acima passaria por uma receita que simplesmente nunca
   * pinta. A camada e chamada PELO ID, que e como o tema escreve: assim a folha
   * do gabarito e a do enunciado MAIS a resposta, e o teal separa uma da outra.
   *
   * Escrita direta, sem id, "fase=gabarito" quer dizer que a figura INTEIRA e
   * resposta, e ai o dado tambem sai teal: e a regra do corDaCamada e vale para
   * o kit todo. Medir por ali daria dois textos teal e nao um, e a conferencia
   * deixaria de dizer o que quer dizer. */
  const d2 = new PDFGen.Doc();
  d2.novaPagina();
  d2.registrarFiguras('@fig retas id=g9 reta=r reta=s paralelas=r;s transversal=t angulo=110;3 incognita=x;6');
  d2.partesDeFigura('@fig id=g9 fase=gabarito').forEach(function (p) {
    if (p.tipo === 'figura') d2.figura(p.diretiva, { x: MARG_E + 20, largura: LARGURA });
  });
  const g = d2.figurasDesenhadas[0];
  const tealNoGab = (g.medido.textos || []).filter((t) => t.cor && ehTeal(t.cor));
  conf('envenenado ao contrario: na camada de gabarito o teal aparece, e so na resposta',
    tealNoGab.length === 1 && tealNoGab[0].txt === '70°', tealNoGab.map((t) => t.txt).join(' '));
  conf('e o dado de 110 continua preto na mesma folha',
    (g.medido.textos || []).some((t) => t.txt === '110°' && !ehTeal(t.cor)));
}

console.log('  outras recusas');
conf('chave nao declarada e recusada com aviso',
  comAviso('@fig retas reta=r reta=s cor=azul', 'chave nao declarada') === 1);
conf('posicao 9 num cruzamento de quatro angulos e recusada',
  comAviso('@fig retas reta=r reta=s angulo=35;9', 'posicoes') === 1);
conf('duas retas sem cruzamento nenhum sao recusadas',
  comAviso('@fig retas reta=r', 'duas retas que se cruzem') === 1);
conf('paralelas= com uma reta so e recusado',
  comAviso('@fig retas reta=r paralelas=r transversal=t', 'grupo de uma reta so') === 1);
conf('duas posicoes com o mesmo endereco sao recusadas',
  comAviso('@fig retas reta=r reta=s angulo=35;1 angulo=40;1', 'recebeu dois valores') === 1);
conf('duas transversais fora do feixe sao recusadas',
  comAviso('@fig retas reta=r reta=s paralelas=r;s transversal=t transversal=u', 'tem uma so') === 1);

console.log('\nlingua: nenhuma palavra nasce dentro da receita');
{
  const d = new PDFGen.Doc();
  d.novaPagina();
  d.lingua = 'en';
  ['@fig retas reta=r reta=s paralelas=r;s transversal=t angulo=35;1 nomeiaretas=sim',
   '@fig retas feixe=3;a;b;c transversal=t transversal=u corta=t;6 corta=t;10 corta=u;9 corta=u;x',
   '@fig retas reta=r reta=s reto=sim'].forEach(function (t) {
    d.partesDeFigura(t).forEach(function (p) { if (p.tipo === 'figura') d.figura(p.diretiva, { x: MARG_E + 20, largura: LARGURA }); });
  });
  const nascidas = (d.avisosFigura || []).filter((a) => a.indexOf('nao veio do tema') >= 0);
  conf('nenhum texto impresso que nao veio da diretiva', nascidas.length === 0, nascidas.join(' | '));
}

console.log('\na folha inteira');
{
  const avisos = doc.avisosFigura || [];
  conf('todas as ' + CASOS.length + ' diretivas foram desenhadas',
    (doc.figurasDesenhadas || []).length === CASOS.length, (doc.figurasDesenhadas || []).length + ' figuras');
  conf('nenhuma passa do teto de cinco marcas',
    (doc.figurasDesenhadas || []).every((r) => r.marcasAtivas <= 5),
    'marcas por figura: ' + (doc.figurasDesenhadas || []).map((r) => r.marcasAtivas).join(' '));
  conf('nenhum aviso de figura na folha inteira', avisos.length === 0);
  for (const a of avisos) console.log('  aviso . ' + a);

  const problemas = [];
  for (let i = 0; i < doc.paginas.length; i++) {
    let prof = 0;
    for (const s of doc.paginas[i].ops) {
      if (s.indexOf('BT ') === 0) continue;
      for (const k of s.split(/\s+/)) {
        if (k === 'q') prof++;
        else if (k === 'Q') { prof--; if (prof < 0) { problemas.push('p' + (i + 1) + ': Q sem q'); prof = 0; } }
        else if (k === 'd' && prof === 0) problemas.push('p' + (i + 1) + ': tracejado fora de envelope');
        else if ((k === 'W' || k === 'W*') && prof === 0) problemas.push('p' + (i + 1) + ': recorte fora de envelope');
      }
    }
    if (prof !== 0) problemas.push('p' + (i + 1) + ': ' + prof + ' q sem Q');
  }
  conf('todo q tem o seu Q e nenhum estado vaza', problemas.length === 0, problemas.join(' | '));
}

console.log('\n' + ok + ' conferencias passaram, ' + mau + ' falharam.');
process.exit(mau ? 1 : 0);
