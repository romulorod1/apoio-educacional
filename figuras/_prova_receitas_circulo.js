/* figuras/_prova_receitas_circulo.js
 * Folha de prova das receitas de curva do receitas.js (circulo, conica,
 * poligonoregular, pidesenrolado, pista, rodando), uma pagina por caso, pelo
 * caminho de verdade: a diretiva @fig e lida pelo partesDeFigura do pdf.js e
 * desenhada pelo doc.figura, como no material do tema.
 *
 * A folha e o gate visual. Quem prova e a MEDICAO no fluxo de conteudo, ou seja
 * no que vai sair impresso, e nao no que a receita disse que ia desenhar:
 *
 *   isotropia      a caixa envolvente da circunferencia mede 2r por 2r, com
 *                  desvio abaixo de 0,5 pt, em toda figura que tem circulo
 *   focos          na elipse desenhada, os dois pontos marcados como foco estao
 *                  a c = raiz(a2 - b2) do centro, com a e b lidos da caixa da
 *                  propria curva impressa; na hiperbole, a c = raiz(a2 + b2)
 *   parabola       o foco impresso esta a p/2 do vertice impresso e a diretriz
 *                  impressa a p/2 do outro lado; todo ponto da curva esta a
 *                  mesma distancia dos dois
 *   pi             no pi desenrolado, os cinco tacos marcam 0, d, 2d, 3d e o
 *                  fim do barbante, e o fim esta a pi vezes d do inicio com
 *                  erro abaixo de 0,5 pt
 *
 * O _audita_receitas_curvas.py refaz a isotropia e as distancias focais sem
 * importar uma linha do projeto, abrindo o PDF pronto com o MuPDF.
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
const LEG = 'legenda=A regiao hachurada e a regiao pedida.';
const LEG_ESCALA = 'legenda=Figura fora de escala.';

/* ================================================================ os casos
 * Um caso por chave nova, nas duas fases onde a fase muda alguma coisa. O
 * "mede" diz o que a secao de medicao vai procurar naquela pagina. */

const CASOS = [
  /* ---------------------------------------------------------- circulo */
  { nome: 'circulo r d O', titulo: 'circulo: raio, diametro e centro, tudo em letra',
    fig: '@fig circulo id=c1 raio=r diametro=d centro=O', mede: 'circulo' },
  { nome: 'circulo corda', titulo: 'circulo: corda de 6 num raio 5, cotada',
    fig: '@fig circulo id=c2 raio=5 corda=6 centro=O', mede: 'circulo' },
  { nome: 'setor 60', titulo: 'circulo: setor de 60 graus hachurado, raio 6, angulo central marcado',
    fig: '@fig circulo id=c3 raio=6 setor=60 centro=O ' + LEG, mede: 'circulo' },
  { nome: 'arco 60 x', titulo: 'circulo: arco de 60 graus destacado com a incognita x no angulo central',
    fig: '@fig circulo id=c4 raio=6 arco=60 incognita=x centro=O', mede: 'circulo' },
  { nome: 'arco 60 x gab', titulo: 'a mesma figura no gabarito: x = 60 em teal, com o arco',
    fig: '@fig id=c4 fase=gabarito', mede: 'circulo', gabaritoDe: '@fig circulo id=c4 raio=6 arco=60 incognita=x centro=O' },
  { nome: 'coroa', titulo: 'circulo: coroa com R igual a 10 e r igual a 6, hachurada',
    fig: '@fig circulo id=c5 raio=10 coroa=6 centro=O ' + LEG, mede: 'coroa' },
  { nome: 'inscrito', titulo: 'circulo: quadrado de lado 10, circulo inscrito, cantos hachurados, raio 5 ate a tangencia',
    fig: '@fig circulo id=c6 inscrito=10 raio=5 centro=O ' + LEG, mede: 'circulo' },
  { nome: 'inscrito e circunscrito', titulo: 'circulo: os dois circulos do quadrado de lado 10, com os dois raios',
    fig: '@fig circulo id=c7 inscrito=10 circunscrito=10 raio=5 raio=5√2 ' + LEG, mede: 'circulo' },
  { nome: 'inscrito com diametro', titulo: 'circulo: o quadrado inscrito com o diametro tambem cotado, os dois valendo 10',
    fig: '@fig circulo id=c12 inscrito=10 raio=5 diametro=10 ' + LEG, mede: 'circulo' },
  { nome: 'fatias', titulo: 'circulo: pizza de diametro 40 em 8 fatias, uma hachurada, angulo central pedido',
    fig: '@fig circulo id=c8 fatias=8 diametro=40 incognita=x ' + LEG, mede: 'circulo' },
  { nome: 'fatias gab', titulo: 'a pizza no gabarito: x = 45 em teal, sobre o arco',
    fig: '@fig id=c8 fase=gabarito', mede: 'circulo', gabaritoDe: '@fig circulo id=c8 fatias=8 diametro=40 incognita=x ' + LEG },
  { nome: 'aneis', titulo: 'circulo: o alvo de raios 2, 4 e 6, disco chapado e coroas em hachuras opostas',
    fig: '@fig circulo id=c9 aneis=2;4;6 centro=O ' + LEG, mede: 'aneis' },
  { nome: 'semicirculo', titulo: 'circulo: setor de 180 graus (o marcaAngulo recusa, o arco sai por conta da receita)',
    fig: '@fig circulo id=c10 raio=5 setor=180 centro=O ' + LEG, mede: 'circulo' },
  { nome: 'giro', titulo: 'circulo: setor de 60 girado 30 graus, raio em letra',
    fig: '@fig circulo id=c11 raio=r setor=60 giro=30 ' + LEG, mede: 'circulo' },

  /* ---------------------------------------------------------- conica */
  { nome: 'elipse definicao', titulo: 'conica: elipse com F1, F2, os quatro vertices, a e b cotados, P com os raios focais',
    fig: '@fig conica id=e1 tipo=elipse a=a b=b focos=F1;F2 vertices=sim ponto=P', mede: 'elipse' },
  { nome: 'elipse triangulo', titulo: 'conica: P na ponta do eixo menor, o triangulo de catetos b e c e hipotenusa a',
    fig: '@fig conica id=e2 tipo=elipse a=5 b=4;b c=c focos=sim ponto=P;5 incognita=a', mede: 'elipse' },
  { nome: 'elipse gab 18', titulo: 'conica: gabarito do 18, elipse 5 por 4 com os raios focais 7 e 3 em teal',
    fig: '@fig conica id=e3 tipo=elipse a=5 b=4 focos=F1;F2 ponto=P;7 incognita=d fase=gabarito', mede: 'elipse' },
  { nome: 'elipse eixos', titulo: 'conica: a mesma elipse com o plano cartesiano atras e os focos sobre o eixo x',
    fig: '@fig conica id=e4 tipo=elipse a=5 b=4 focos=F1;F2 eixos=sim', mede: 'elipse' },
  { nome: 'elipse transladada', titulo: 'conica: centro em (1, -2), linhas de centro tracejadas e as distancias cotadas',
    fig: '@fig conica id=e5 tipo=elipse a=5 b=4 eixos=sim centro=1;-2;C', mede: 'elipse' },
  { nome: 'elipse transladada 2 3', titulo: 'conica: a elipse transladada do MATEM3-04 (centro em (2, 3)), onde o C do centro saia grudado na cota do 3',
    fig: '@fig conica id=e6 tipo=elipse a=3 b=2 eixos=sim centro=2;3;C', mede: 'elipse' },
  { nome: 'hiperbole', titulo: 'conica: hiperbole 3 por 2 com focos, vertices, retangulo fundamental e assintotas',
    fig: '@fig conica id=h1 tipo=hiperbole a=3 b=2 focos=F1;F2 vertices=A1;A2 retangulo=c assintotas=sim', mede: 'hiperbole' },
  { nome: 'parabola definicao', titulo: 'conica: parabola com V, F, diretriz d e P com os dois segmentos iguais',
    fig: '@fig conica id=p1 tipo=parabola p=4 focos=F vertices=V diretriz=d ponto=P', mede: 'parabola' },
  { nome: 'parabola gab 20', titulo: 'conica: gabarito do 20, y2 = 12x, P a 8 do foco e a 8 da diretriz',
    fig: '@fig conica id=p2 tipo=parabola p=6 focos=F ponto=P;8 fase=gabarito', mede: 'parabola' },
  { nome: 'parabola eixos', titulo: 'conica: a parabola y2 = 12x no plano, foco (3, 0) sobre o eixo e o tique',
    fig: '@fig conica id=p3 tipo=parabola p=6 focos=F eixos=sim diretriz=sim', mede: 'parabola' },

  /* ---------------------------------------------------------- poligono regular */
  { nome: 'hexagono', titulo: 'poligonoregular: hexagono decomposto em seis triangulos de lado L, um chapado, apotema a',
    fig: '@fig poligonoRegular id=g1 lados=6 lado=L decomposto=sim centro=O apotema=a', mede: 'hexagono' },
  { nome: 'pentagono x', titulo: 'poligonoregular: pentagono de lado 6 com o angulo interno pedido',
    fig: '@fig poligonoRegular id=g2 lados=5 lado=6 incognita=x', mede: 'regular' },
  { nome: 'pentagono x gab', titulo: 'o pentagono no gabarito: x = 108 em teal',
    fig: '@fig id=g2 fase=gabarito', mede: 'regular', gabaritoDe: '@fig poligonoRegular id=g2 lados=5 lado=6 incognita=x' },
  { nome: 'octogono raio', titulo: 'poligonoregular: octogono com o raio cotado e decomposto',
    fig: '@fig poligonoRegular id=g3 lados=8 raio=r decomposto=sim incognita=x', mede: 'regular' },

  /* ---------------------------------------------------------- compostas */
  { nome: 'pi desenrolado', titulo: 'pidesenrolado: a circunferencia de diametro d e o barbante com tres d e a sobra',
    fig: '@fig pidesenrolado id=k1 diametro=d sobra=0.14·d', mede: 'pi' },
  { nome: 'pista', titulo: 'pista: retangulo 84 por 60 com um semicirculo em cada lado de 60',
    fig: '@fig pista id=k2 comprimento=84 largura=60', mede: 'pista' },
  { nome: 'rodando', titulo: 'rodando: a roda de raio r em tres posicoes, uma volta cotada C',
    fig: '@fig rodando id=k3 raio=r comprimento=C', mede: 'rodando' }
];

/* ================================================================ a folha */

const doc = new PDFGen.Doc();
const medidas = [];

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
  doc.partesDeFigura(caso.fig).forEach(function (p) {
    if (p.tipo === 'figura') doc.figura(p.diretiva, { x: MARG_E + 20, largura: LARGURA });
  });
  const reg = (doc.figurasDesenhadas || [])[antes] || null;
  medidas.push({ caso: caso, reg: reg, ops: pag.ops.slice(de) });
});

fs.writeFileSync(path.join(__dirname, '_prova_receitas_circulo.pdf'), doc.finalizar());
console.log('_prova_receitas_circulo.pdf: ' + CASOS.length + ' paginas');

/* ================================================================ leitor de caminhos
 * O mesmo leitor da _prova_desenho_curvas: guarda os quatro pontos de controle
 * de cada Bezier para a curva ser avaliada onde ela realmente passa. */
function lerCaminhos(ops) {
  const toks = [];
  for (const s of ops) {
    if (s.indexOf('BT ') === 0) continue;
    for (const t of s.split(/\s+/)) if (t) toks.push(t);
  }
  const subs = [];
  let atual = null, pilha = [], w = 1, tracejado = '[] 0', cor = null;
  const num = (k) => { const v = pilha[pilha.length - k]; return v === undefined ? 0 : v; };
  for (const t of toks) {
    const v = parseFloat(t);
    if (!isNaN(v) && /^[-+]?[\d.]+$/.test(t)) { pilha.push(v); continue; }
    switch (t) {
      case 'w': w = num(1); break;
      case 'RG': cor = [num(3), num(2), num(1)]; break;
      case 'm': atual = { pts: [{ x: num(2), y: num(1) }], trechos: [], w: w, fechado: false, tracejado: tracejado, cor: cor }; subs.push(atual); break;
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
      case 'h': if (atual) atual.fechado = true; break;
      case 'S': case 'B': case 'B*': if (atual) { atual.pintado = 'traco'; atual.w = w; } atual = null; break;
      case 'f': case 'f*': if (atual) { atual.pintado = 'area'; } atual = null; break;
      case 'n': if (atual) { atual.pintado = 'recorte'; } atual = null; break;
      default: break;
    }
    pilha = [];
  }
  return subs;
}
function emBezier(tr, t) {
  const s = 1 - t, a = s * s * s, b = 3 * s * s * t, c = 3 * s * t * t, d = t * t * t;
  return { x: a * tr.p0.x + b * tr.c1.x + c * tr.c2.x + d * tr.p3.x,
           y: a * tr.p0.y + b * tr.c1.y + c * tr.c2.y + d * tr.p3.y };
}
function pontosDoSub(sub, porTrecho) {
  const saida = [];
  for (const tr of sub.trechos) for (let i = 0; i <= porTrecho; i++) saida.push(emBezier(tr, i / porTrecho));
  return saida;
}
function caixaDe(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
  return { x0, y0, x1, y1, largura: x1 - x0, altura: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
const dist = (a, b) => Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));

/* Os sub-caminhos curvos FECHADOS com quatro Beziers e caixa grande sao as
 * circunferencias e elipses; os pequenos preenchidos sao as bolinhas. */
function voltasInteiras(subs, minCaixa) {
  return subs.filter((s) => {
    if (s.pintado !== 'traco') return false;
    const curvos = s.trechos.filter((t) => !t.reta).length;
    if (curvos !== 4 || s.trechos.length !== 4) return false;
    return caixaDe(pontosDoSub(s, 8)).largura >= (minCaixa || 20);
  });
}
function bolinhas(subs) {
  return subs.filter((s) => {
    if (s.pintado !== 'area') return false;
    const curvos = s.trechos.filter((t) => !t.reta).length;
    if (curvos !== 4) return false;
    const c = caixaDe(pontosDoSub(s, 8));
    return c.largura < 8 && c.altura < 8;
  }).map((s) => caixaDe(pontosDoSub(s, 8)));
}

function achar(nome) {
  const m = medidas.filter((q) => q.caso.nome === nome)[0];
  if (!m) throw new Error('caso ' + nome + ' nao foi desenhado');
  return m;
}
function textos(m) { return ((m.reg && m.reg.medido && m.reg.medido.textos) || []); }
function tem(m, txt) { return textos(m).filter((t) => t.txt === txt).length; }
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
function medido(t) { console.log('        ' + t); }

console.log('\nisotropia: toda circunferencia sai redonda no fluxo de conteudo');
let piorAniso = 0, piorDesvio = 0, quantas = 0;
for (const m of medidas) {
  if (!m.reg) continue;
  const voltas = voltasInteiras(lerCaminhos(m.ops), 20);
  for (const v of voltas) {
    const pts = pontosDoSub(v, 24), c = caixaDe(pts);
    const r = (c.largura + c.altura) / 4;
    let radial = 0;
    for (const p of pts) radial = Math.max(radial, Math.abs(dist(p, { x: c.cx, y: c.cy }) - r));
    /* Elipse nao e circunferencia: so entra na conta de isotropia quem e
     * circulo de verdade, e a elipse e conferida na secao dela. */
    if (radial > 1) continue;
    quantas++;
    piorAniso = Math.max(piorAniso, Math.abs(c.largura - c.altura));
    piorDesvio = Math.max(piorDesvio, radial);
  }
}
medido(quantas + ' circunferencias medidas em ' + medidas.length + ' paginas');
conf('nenhuma tem anisotropia acima de 0,5 pt', piorAniso < 0.5, 'pior ' + piorAniso.toFixed(4) + ' pt');
conf('e o desvio radial do Bezier fica abaixo de 0,05 pt', piorDesvio < 0.05, 'pior ' + piorDesvio.toFixed(4) + ' pt');

{
  const m = achar('circulo corda');
  const k = m.reg.escala, r = 5 * k;
  const v = voltasInteiras(lerCaminhos(m.ops), 20)[0];
  const c = caixaDe(pontosDoSub(v, 24));
  medido('raio pedido 5 unidades = ' + r.toFixed(3) + ' pt; caixa ' + c.largura.toFixed(3) + ' por ' + c.altura.toFixed(3) + ' pt');
  conf('a caixa e 2r por 2r', Math.abs(c.largura - 2 * r) < 0.5 && Math.abs(c.altura - 2 * r) < 0.5,
    'desvios ' + Math.abs(c.largura - 2 * r).toFixed(4) + ' e ' + Math.abs(c.altura - 2 * r).toFixed(4) + ' pt');
  /* A corda de 6 num raio 5: o segmento de 0,9 pt com comprimento 6k. */
  const segs = lerCaminhos(m.ops).filter((s) => s.pintado === 'traco' && s.trechos.length === 1 && s.trechos[0].reta);
  const comp = segs.map((s) => dist(s.pts[0], s.pts[1]));
  const corda = comp.filter((L) => Math.abs(L - 6 * k) < 0.5);
  conf('a corda impressa mede 6 unidades', corda.length >= 1, 'achada ' + (corda[0] || 0).toFixed(3) + ' pt contra ' + (6 * k).toFixed(3));
}

{
  const m = achar('coroa');
  const voltas = voltasInteiras(lerCaminhos(m.ops), 20).map((v) => caixaDe(pontosDoSub(v, 24)));
  voltas.sort((a, b) => b.largura - a.largura);
  const R = voltas[0].largura / 2, r = voltas[1].largura / 2;
  medido('R = ' + R.toFixed(3) + ' pt, r = ' + r.toFixed(3) + ' pt, razao ' + (r / R).toFixed(4) + ' (pedido 0,6)');
  conf('a coroa tem os dois raios na razao 6 para 10', Math.abs(r / R - 0.6) < 0.002);
  conf('e os dois circulos sao concentricos', dist({ x: voltas[0].cx, y: voltas[0].cy }, { x: voltas[1].cx, y: voltas[1].cy }) < 0.05);
  conf('e o 10 e o 6 sairam impressos', tem(m, '10') === 1 && tem(m, '6') === 1);
}

{
  const m = achar('aneis');
  const voltas = voltasInteiras(lerCaminhos(m.ops), 20).map((v) => caixaDe(pontosDoSub(v, 24)));
  voltas.sort((a, b) => a.largura - b.largura);
  const raios = voltas.map((v) => v.largura / 2);
  medido('raios impressos: ' + raios.map((r) => r.toFixed(2)).join(', ') + ' pt');
  conf('o alvo tem tres circunferencias em 2 : 4 : 6', voltas.length === 3 &&
    Math.abs(raios[1] / raios[0] - 2) < 0.002 && Math.abs(raios[2] / raios[0] - 3) < 0.002);
  const areas = lerCaminhos(m.ops).filter((s) => s.pintado === 'area' && s.trechos.length === 4 && caixaDe(pontosDoSub(s, 4)).largura > 20);
  conf('e o disco central sai chapado', areas.length >= 1, areas.length + ' area(s) circular(es)');
  conf('marcas ativas no teto (tres raios mais o O)', m.reg.marcasAtivas <= 5, m.reg.marcasAtivas + ' marcas');
}

{
  const m = achar('inscrito');
  const k = m.reg.escala;
  const v = caixaDe(pontosDoSub(voltasInteiras(lerCaminhos(m.ops), 20)[0], 24));
  /* "m l l l h": tres trechos e o h fecha, entao o quadrado tem 4 pontos e 3 trechos. */
  const quad = lerCaminhos(m.ops).filter((s) => s.pintado === 'traco' && s.fechado && s.pts.length === 4 && s.trechos.every((t) => t.reta));
  const q = quad.length ? caixaDe(quad[0].pts) : null;
  medido('circulo ' + v.largura.toFixed(3) + ' pt, quadrado ' + (q ? q.largura.toFixed(3) : '?') + ' pt');
  conf('o circulo inscrito toca os quatro lados: 2r igual a L', !!q && Math.abs(v.largura - q.largura) < 0.05 && Math.abs(v.altura - q.altura) < 0.05);
  conf('e L igual a 10 unidades', !!q && Math.abs(q.largura - 10 * k) < 0.5);
  conf('o 10 e o 5 sairam impressos', tem(m, '10') === 1 && tem(m, '5') === 1);
}

{
  const m = achar('inscrito e circunscrito');
  const voltas = voltasInteiras(lerCaminhos(m.ops), 20).map((v) => caixaDe(pontosDoSub(v, 24)));
  voltas.sort((a, b) => a.largura - b.largura);
  medido('raios ' + voltas.map((v) => (v.largura / 2).toFixed(3)).join(' e ') + ' pt, razao ' + (voltas[1].largura / voltas[0].largura).toFixed(5));
  conf('o circunscrito tem raio raiz de 2 vezes o inscrito', voltas.length === 2 &&
    Math.abs(voltas[1].largura / voltas[0].largura - Math.SQRT2) < 1e-3);
  /* O simbolo sai pela fonte Symbol e o lerFluxo o le pelo byte WinAnsi: o que
   * importa aqui e que o rotulo de tres caracteres comecando por 5 e
   * terminando por 2 foi impresso, uma vez. */
  conf('e o segundo raio sai escrito 5√2', textos(m).filter((t) => /^5.2$/.test(t.txt)).length === 1,
    'textos: ' + textos(m).map((t) => t.txt).join(' '));
}

console.log('\nsetor, arco, fatias: o angulo central e o arco que o enxerga');
{
  const m = achar('setor 60');
  const arcos = (m.reg.medido.arcos || []).map((a) => a.abertura).sort((a, b) => a - b);
  medido('aberturas no fluxo: ' + arcos.map((a) => a.toFixed(2)).join(', '));
  conf('dois arcos de 60 graus (o destacado na circunferencia e o do angulo)', arcos.filter((a) => Math.abs(a - 60) < 1).length >= 2);
  conf('o valor 60 sai impresso e o 6 do raio tambem', tem(m, '60°') === 1 && tem(m, '6') === 1);
  conf('sem falha de conferencia', (m.reg.conferencia || []).length === 0, (m.reg.conferencia || []).join(' | '));
}
{
  const m = achar('arco 60 x');
  conf('a incognita x sai no angulo central', tem(m, 'x') === 1);
  conf('e nao esta solta (tem arco)', (m.reg.conferencia || []).filter((f) => f.indexOf('saiu solto') >= 0).length === 0);
  const g = achar('arco 60 x gab');
  conf('no gabarito sai x = 60 graus', tem(g, 'x = 60°') === 1);
  conf('em teal, porque e o que a resposta acrescenta', corDe(g, 'x = 60°') === 'teal');
  conf('e o 6 do raio continua preto, porque ja estava no enunciado', corDe(g, '6') === 'preto');
  conf('sem falha de conferencia no gabarito', (g.reg.conferencia || []).length === 0, (g.reg.conferencia || []).join(' | '));
}
{
  const m = achar('fatias');
  const radios = lerCaminhos(m.ops).filter((s) => s.pintado === 'traco' && s.trechos.length === 1 && s.trechos[0].reta && Math.abs(s.w - 0.9) < 0.01);
  medido('segmentos de 0,9 pt na pizza: ' + radios.length + ' (8 raios mais o diametro)');
  conf('a pizza tem os oito raios', radios.length >= 8);
  conf('x no angulo central de uma fatia', tem(m, 'x') === 1);
  const g = achar('fatias gab');
  conf('gabarito: x = 45 graus, em teal', tem(g, 'x = 45°') === 1 && corDe(g, 'x = 45°') === 'teal');
  const arco = (g.reg.medido.arcos || []).filter((a) => Math.abs(a.abertura - 45) < 1);
  conf('e o arco do angulo varre 45 graus na folha', arco.length >= 1);
}
{
  const m = achar('semicirculo');
  const arcos = (m.reg.medido.arcos || []).map((a) => a.abertura);
  conf('o semicirculo tem arco de 180 no fluxo', arcos.filter((a) => Math.abs(a - 180) < 1).length >= 1, arcos.map((a) => a.toFixed(1)).join(', '));
  conf('e o valor 180 nao fica solto nem grudado no O', (m.reg.conferencia || []).length === 0, (m.reg.conferencia || []).join(' | '));
}

console.log('\nelipse: focos a c = raiz(a2 - b2), medidos na curva impressa');
function elipseDe(m) {
  const subs = lerCaminhos(m.ops);
  const curvas = subs.filter((s) => s.pintado === 'traco' && s.trechos.length === 4 && s.trechos.every((t) => !t.reta) && caixaDe(pontosDoSub(s, 8)).largura > 20);
  const c = caixaDe(pontosDoSub(curvas[0], 24));
  const a = c.largura / 2, b = c.altura / 2;
  return { caixa: c, a: a, b: b, c: Math.sqrt(Math.abs(a * a - b * b)), bolinhas: bolinhas(subs) };
}
for (const nome of ['elipse definicao', 'elipse triangulo', 'elipse gab 18', 'elipse eixos']) {
  const m = achar(nome);
  const E = elipseDe(m);
  const centro = { x: E.caixa.cx, y: E.caixa.cy };
  const focos = E.bolinhas.map((b) => ({ x: b.cx, y: b.cy })).filter((p) => Math.abs(p.y - centro.y) < 0.6);
  const erros = focos.map((f) => Math.abs(Math.abs(f.x - centro.x) - E.c));
  medido(nome + ': a = ' + E.a.toFixed(3) + ', b = ' + E.b.toFixed(3) + ', c = ' + E.c.toFixed(3) + ' pt; bolinhas sobre o eixo maior a ' +
    focos.map((f) => Math.abs(f.x - centro.x).toFixed(3)).join(' e ') + ' pt do centro');
  conf(nome + ': os dois focos estao a c do centro', focos.length >= 2 && erros.filter((e) => e < 0.5).length >= 2,
    'erros ' + erros.map((e) => e.toFixed(4)).join(', ') + ' pt');
}
{
  const m = achar('elipse gab 18');
  conf('gabarito do 18: d = 7 e 3 impressos em teal', tem(m, 'd = 7') === 1 && tem(m, '3') === 1 && corDe(m, 'd = 7') === 'teal' && corDe(m, '3') === 'teal');
  const E = elipseDe(m);
  const k = m.reg.escala;
  medido('a impressa = ' + (E.a / k).toFixed(3) + ' unidades, b = ' + (E.b / k).toFixed(3) + ', c = ' + (E.c / k).toFixed(3));
  conf('e a elipse impressa e a 5 por 4 pedida', Math.abs(E.a / k - 5) < 0.02 && Math.abs(E.b / k - 4) < 0.02);
  /* O ponto P: a bolinha fora do eixo maior. PF1 + PF2 = 2a. */
  const P = E.bolinhas.map((b) => ({ x: b.cx, y: b.cy })).filter((p) => Math.abs(p.y - E.caixa.cy) > 2)[0];
  const F1 = { x: E.caixa.cx + E.c, y: E.caixa.cy }, F2 = { x: E.caixa.cx - E.c, y: E.caixa.cy };
  if (P) {
    medido('PF1 = ' + (dist(P, F1) / k).toFixed(3) + ', PF2 = ' + (dist(P, F2) / k).toFixed(3) + ' unidades');
    conf('P esta a 7 de um foco e a 3 do outro, e a soma e 2a = 10',
      Math.abs(dist(P, F1) / k - 7) < 0.05 && Math.abs(dist(P, F2) / k - 3) < 0.05);
  } else conf('P foi impresso', false);
}
{
  const m = achar('elipse triangulo');
  const E = elipseDe(m), k = m.reg.escala;
  const P = E.bolinhas.map((b) => ({ x: b.cx, y: b.cy })).filter((p) => Math.abs(p.y - E.caixa.cy) > 2)[0];
  conf('ponto=P;5 poe P na ponta do eixo menor (x igual ao do centro)', !!P && Math.abs(P.x - E.caixa.cx) < 0.05 && Math.abs(Math.abs(P.y - E.caixa.cy) - E.b) < 0.05,
    P ? 'P a ' + Math.abs(P.x - E.caixa.cx).toFixed(3) + ' pt do eixo menor' : '');
  conf('e o triangulo tem b, c e a escritos, com P: quatro marcas mais o quadradinho', tem(m, 'b') === 1 && tem(m, 'c') === 1 && tem(m, 'a') === 1 && tem(m, 'P') === 1,
    m.reg.marcasAtivas + ' marcas');
  conf('o quadradinho no centro esta anotado', (m.reg.marcas || []).filter((x) => x.tipo === 'anguloReto').length === 1);
  conf('sem falha de conferencia', (m.reg.conferencia || []).length === 0, (m.reg.conferencia || []).join(' | '));
}
{
  const m = achar('elipse eixos');
  const finos = (m.reg.medido.segmentos || []).filter((s) => s.w < 0.6 - 1e-6 && !s.varredura);
  conf('sem malha, nenhum traco abaixo do piso', finos.length === 0);
  conf('a escala dos eixos conta duas marcas e os focos duas: quatro', m.reg.marcasAtivas === 4, m.reg.marcasAtivas + ' marcas');
  conf('e o foco sobre o eixo x nao e acusado como cruzamento nomeado', (m.reg.conferencia || []).length === 0, (m.reg.conferencia || []).join(' | '));
  medido('numeros da escala: ' + textos(m).map((t) => t.txt).join(' '));
}
{
  const m = achar('elipse transladada');
  conf('as distancias 1 e 2 ate os eixos saem cotadas', tem(m, '1') >= 1 && tem(m, '2') >= 1);
  conf('com o nome C do centro', tem(m, 'C') === 1);
  conf('e cabe no teto', m.reg.marcasAtivas <= 5, m.reg.marcasAtivas + ' marcas');
}

console.log('\nhiperbole: focos a c = raiz(a2 + b2)');
{
  const m = achar('hiperbole');
  const k = m.reg.escala;
  const subs = lerCaminhos(m.ops);
  const ramos = subs.filter((s) => s.pintado === 'traco' && s.trechos.length >= 30);
  const todos = [];
  for (const r of ramos) for (const p of pontosDoSub(r, 6)) todos.push(p);
  const cx = caixaDe(todos);
  const centro = { x: cx.cx, y: cx.cy };
  /* O vertice de cada ramo e o ponto mais proximo do centro. */
  let a = Infinity;
  for (const p of todos) a = Math.min(a, Math.abs(p.x - centro.x));
  const b = 2 * k, c = Math.sqrt(a * a + b * b);
  const focos = bolinhas(subs).map((q) => ({ x: q.cx, y: q.cy })).filter((p) => Math.abs(p.y - centro.y) < 0.6 && Math.abs(p.x - centro.x) > a + 1);
  medido('a impressa = ' + (a / k).toFixed(3) + ' unidades (pedido 3), c = raiz(a2 + b2) = ' + (c / k).toFixed(3) + ' unidades; focos a ' +
    focos.map((f) => (Math.abs(f.x - centro.x) / k).toFixed(3)).join(' e ') + ' unidades do centro');
  conf('os dois ramos sao desenhados', ramos.length === 2);
  conf('os focos estao a raiz(13) do centro', focos.length === 2 && focos.every((f) => Math.abs(Math.abs(f.x - centro.x) - c) < 0.5));
  let pior = 0;
  const F1 = { x: centro.x + c, y: centro.y }, F2 = { x: centro.x - c, y: centro.y };
  for (const p of todos) pior = Math.max(pior, Math.abs(Math.abs(dist(p, F1) - dist(p, F2)) - 2 * a));
  conf('todo ponto impresso cumpre |PF1 - PF2| = 2a', pior < 0.35, 'pior ' + pior.toFixed(4) + ' pt');
  conf('A1, A2, F1, F2 e c sairam impressos', tem(m, 'A1') === 1 && tem(m, 'A2') === 1 && tem(m, 'F1') === 1 && tem(m, 'F2') === 1 && tem(m, 'c') === 1);
  conf('sem tarja nem falha', (m.reg.conferencia || []).length === 0 && (m.reg.rotulos || []).every((r) => !r.tarja));
}

console.log('\nparabola: foco a p/2 do vertice, diretriz a p/2 do outro lado');
function parabolaDe(m) {
  const k = m.reg.escala;
  const subs = lerCaminhos(m.ops);
  const curva = subs.filter((s) => s.pintado === 'traco' && s.trechos.length >= 40)[0];
  const pts = pontosDoSub(curva, 6);
  let V = pts[0];
  for (const p of pts) if (p.x < V.x) V = p;
  /* p sai da propria curva: y2 = 2 p x em todo ponto. */
  let somaP = 0, n = 0;
  for (const p of pts) {
    const x = p.x - V.x, y = p.y - V.y;
    if (x > 2) { somaP += y * y / (2 * x); n++; }
  }
  const p = somaP / n;
  const dots = bolinhas(subs).map((q) => ({ x: q.cx, y: q.cy }));
  const foco = dots.filter((q) => Math.abs(q.y - V.y) < 0.6 && q.x > V.x)[0] || null;
  const verticais = subs.filter((s) => s.pintado === 'traco' && s.trechos.length === 1 && s.trechos[0].reta &&
    Math.abs(s.pts[0].x - s.pts[1].x) < 0.05 && Math.abs(s.pts[0].y - s.pts[1].y) > 20 && s.w < 0.7);
  const diretriz = verticais.filter((s) => s.pts[0].x < V.x)[0] || null;
  return { k, V, p, foco, diretriz, pts, dots };
}
for (const nome of ['parabola definicao', 'parabola gab 20', 'parabola eixos']) {
  const m = achar(nome);
  const P = parabolaDe(m);
  const pPedido = (nome === 'parabola definicao' ? 4 : 6) * P.k;
  medido(nome + ': p lido da curva = ' + (P.p / P.k).toFixed(3) + ' unidades (pedido ' + (pPedido / P.k) + '); foco a ' +
    (P.foco ? (P.foco.x - P.V.x).toFixed(3) : '?') + ' pt do vertice, diretriz a ' + (P.diretriz ? (P.V.x - P.diretriz.pts[0].x).toFixed(3) : '?') + ' pt (p/2 = ' + (pPedido / 2).toFixed(3) + ')');
  conf(nome + ': o foco impresso esta a p/2 do vertice impresso', !!P.foco && Math.abs(P.foco.x - P.V.x - pPedido / 2) < 0.5);
  conf(nome + ': a diretriz impressa esta a p/2 do outro lado', !!P.diretriz && Math.abs(P.V.x - P.diretriz.pts[0].x - pPedido / 2) < 0.5);
  if (P.foco && P.diretriz) {
    let pior = 0;
    for (const q of P.pts) pior = Math.max(pior, Math.abs(dist(q, P.foco) - Math.abs(q.x - P.diretriz.pts[0].x)));
    conf(nome + ': todo ponto impresso esta a mesma distancia do foco e da diretriz', pior < 0.35, 'pior ' + pior.toFixed(4) + ' pt');
  }
}
{
  const m = achar('parabola gab 20');
  conf('gabarito do 20: os dois 8 em teal', tem(m, '8') === 2 && corDe(m, '8') === 'teal');
  const P = parabolaDe(m);
  const ponto = P.dots.filter((q) => Math.abs(q.y - P.V.y) > 2)[0];
  if (ponto) {
    medido('P impresso em (' + ((ponto.x - P.V.x) / P.k).toFixed(3) + ', ' + ((ponto.y - P.V.y) / P.k).toFixed(3) + ') unidades; PF = ' + (dist(ponto, P.foco) / P.k).toFixed(3));
    conf('P esta em (5, 2 raiz de 15) e a 8 do foco', Math.abs((ponto.x - P.V.x) / P.k - 5) < 0.02 && Math.abs(dist(ponto, P.foco) / P.k - 8) < 0.02);
  } else conf('P foi impresso', false);
}
{
  const m = achar('parabola definicao');
  conf('a definicao: V, F, d e P impressos, e a notacao (dois tracinhos e quadradinho) conta uma marca: cinco',
    tem(m, 'V') === 1 && tem(m, 'F') === 1 && tem(m, 'd') === 1 && tem(m, 'P') === 1 && m.reg.marcasAtivas === 5, m.reg.marcasAtivas + ' marcas');
  const g = achar('parabola eixos');
  conf('no plano, o foco (3, 0) sobre o eixo e o tique nao e acusado como cruzamento', (g.reg.conferencia || []).length === 0, (g.reg.conferencia || []).join(' | '));
}

console.log('\nhexagono e poligonos regulares');
{
  const m = achar('hexagono');
  const k = m.reg.escala;
  const hex = lerCaminhos(m.ops).filter((s) => s.pintado === 'traco' && s.fechado && s.pts.length === 6 && s.trechos.every((t) => t.reta))[0];
  const lados = [];
  for (let i = 0; i < 6; i++) lados.push(dist(hex.pts[i], hex.pts[(i + 1) % 6]));
  const c = caixaDe(hex.pts);
  medido('lados impressos: ' + lados.map((L) => L.toFixed(3)).join(', ') + ' pt; raio (do centro a um vertice) ' + dist(hex.pts[0], { x: c.cx, y: c.cy }).toFixed(3));
  conf('os seis lados sao iguais', Math.max.apply(null, lados) - Math.min.apply(null, lados) < 0.02);
  conf('e cada lado mede o raio, que e o argumento da decomposicao', Math.abs(lados[0] - dist(hex.pts[0], { x: c.cx, y: c.cy })) < 0.02);
  const diag = lerCaminhos(m.ops).filter((s) => s.pintado === 'traco' && s.trechos.length === 1 && s.trechos[0].reta && Math.abs(s.w - 0.9) < 0.01);
  conf('as seis diagonais pelo centro mais a apotema: sete segmentos de 0,9 pt', diag.length === 7, diag.length + ' segmentos');
  const areas = lerCaminhos(m.ops).filter((s) => s.pintado === 'area' && s.pts.length === 3 && s.fechado);
  conf('um triangulo chapado', areas.length === 1, areas.length + ' area(s)');
  conf('L, a e O impressos', tem(m, 'L') === 1 && tem(m, 'a') === 1 && tem(m, 'O') === 1);
  conf('o pe da apotema ganha o quadradinho (marca anotada)', (m.reg.marcas || []).filter((x) => x.tipo === 'anguloReto').length === 1);
  conf('sem falha de conferencia', (m.reg.conferencia || []).length === 0, (m.reg.conferencia || []).join(' | '));
}
{
  const m = achar('pentagono x'), g = achar('pentagono x gab');
  conf('pentagono: x no angulo interno, com arco', tem(m, 'x') === 1 && (m.reg.conferencia || []).length === 0);
  conf('gabarito: x = 108 graus em teal', tem(g, 'x = 108°') === 1 && corDe(g, 'x = 108°') === 'teal');
  const arco = (g.reg.medido.arcos || []).filter((a) => Math.abs(a.abertura - 108) < 1);
  conf('e o arco varre 108 na folha', arco.length >= 1);
  const o = achar('octogono raio');
  conf('octogono decomposto: x no angulo central de 45', tem(o, 'x') === 1 && (o.reg.medido.arcos || []).filter((a) => Math.abs(a.abertura - 45) < 1).length >= 1);
}

console.log('\npi desenrolado: tres d mais a sobra dao pi vezes d');
{
  const m = achar('pi desenrolado');
  const k = m.reg.escala;
  const subs = lerCaminhos(m.ops);
  const tacos = subs.filter((s) => s.pintado === 'traco' && s.trechos.length === 1 && s.trechos[0].reta &&
    Math.abs(s.pts[0].x - s.pts[1].x) < 0.05 && Math.abs(Math.abs(s.pts[0].y - s.pts[1].y) - 7) < 0.1).map((s) => s.pts[0].x).sort((a, b) => a - b);
  const d = k;
  medido('tacos em x = ' + tacos.map((x) => (x - tacos[0]).toFixed(3)).join(', ') + ' pt a partir do primeiro; d = ' + d.toFixed(3) + ' pt');
  conf('cinco tacos', tacos.length === 5);
  if (tacos.length === 5) {
    const erros = [1, 2, 3].map((i) => Math.abs(tacos[i] - tacos[0] - i * d));
    conf('os tres primeiros vaos medem d, d e d', Math.max.apply(null, erros) < 0.5, 'erros ' + erros.map((e) => e.toFixed(4)).join(', ') + ' pt');
    const total = tacos[4] - tacos[0];
    medido('barbante inteiro: ' + total.toFixed(3) + ' pt; pi vezes d = ' + (Math.PI * d).toFixed(3) + ' pt; sobra ' + (tacos[4] - tacos[3]).toFixed(3) + ' pt = ' + ((tacos[4] - tacos[3]) / d).toFixed(4) + ' d');
    conf('tres d mais a sobra dao pi vezes d, com erro abaixo de 0,5 pt', Math.abs(total - Math.PI * d) < 0.5, 'erro ' + Math.abs(total - Math.PI * d).toFixed(4) + ' pt');
  }
  const volta = voltasInteiras(subs, 20)[0];
  const c = caixaDe(pontosDoSub(volta, 24));
  conf('a circunferencia de cima tem diametro d', Math.abs(c.largura - d) < 0.5 && Math.abs(c.altura - d) < 0.5, 'caixa ' + c.largura.toFixed(3) + ' por ' + c.altura.toFixed(3));
  conf('quatro d e a sobra impressos: cinco marcas', tem(m, 'd') === 4 && tem(m, '0.14·d') === 1 && m.reg.marcasAtivas === 5, m.reg.marcasAtivas + ' marcas');

  /* A seta que liga a circunferencia ao barbante. Ela apontava reta para baixo
   * e pousava em x = 200,89 pt, o meio EXATO do primeiro intervalo d (que vai
   * de 155,71 a 246,06): 0,00 pt do meio do primeiro d contra 45,18 pt da marca
   * zero. Uma seta que sai do circulo e aterrissa no meio do primeiro pedaco diz
   * "esta circunferencia e este pedaco", que e a leitura errada inteira: a
   * circunferencia e o barbante TODO e o primeiro pedaco e um diametro. */
  const setas = (m.reg.tracos || []).filter((t) => t && t.tipo === 'seta');
  if (tacos.length === 5 && setas.length === 1) {
    const ponta = { x: setas[0].x2, y: setas[0].y2 };
    const inicio = tacos[0], meioDoPrimeiro = (tacos[0] + tacos[1]) / 2;
    medido('a seta pousa em x = ' + n2c(ponta.x) + ' pt: ' + n2c(Math.abs(ponta.x - inicio)) +
      ' pt da marca zero e ' + n2c(Math.abs(ponta.x - meioDoPrimeiro)) + ' pt do meio do primeiro d');
    conf('a seta do circulo para o barbante aterrissa na marca de INICIO (era o meio do primeiro d, a 45,18 pt daqui)',
      Math.abs(ponta.x - inicio) < 1);
    conf('e nao no meio do primeiro intervalo d', Math.abs(ponta.x - meioDoPrimeiro) > 10);
  } else {
    conf('a seta do circulo para o barbante foi registrada, uma so', false, setas.length + ' seta(s)');
  }
}

console.log('\npista e roda');
{
  const m = achar('pista');
  const k = m.reg.escala;
  const arcos = (m.reg.medido.arcos || []).filter((a) => Math.abs(a.abertura - 180) < 1);
  medido('semicirculos: ' + arcos.map((a) => 'raio ' + (a.raio / k).toFixed(3)).join(', ') + ' unidades');
  conf('dois semicirculos de raio 30', arcos.length === 2 && arcos.every((a) => Math.abs(a.raio / k - 30) < 0.05));
  const longos = (m.reg.medido.segmentos || []).filter((s) => Math.abs(s.w - 1.2) < 0.01 && Math.abs(s.y1 - s.y2) < 0.05);
  conf('os dois lados de 84 em 1,2 pt', longos.length === 2 && longos.every((s) => Math.abs(Math.abs(s.x1 - s.x2) / k - 84) < 0.05));
  const curtos = (m.reg.medido.segmentos || []).filter((s) => Math.abs(s.w - 0.6) < 0.01 &&
    Math.abs(s.x1 - s.x2) < 0.05 && s.tracejado.indexOf('[2 2]') === 0);
  conf('e os dois lados de 60 em guia de 0,6 pt, que nao entram no perimetro', curtos.length === 2);
  conf('84 e 60 impressos', tem(m, '84') === 1 && tem(m, '60') === 1);

  /* O 84 e a armadilha do exercicio 16 e ele tem que ter comeco e fim
   * visiveis. Antes era um numero solto 9,84 pt abaixo da aresta, centrado
   * em x = 297,64 pt, que e ao mesmo tempo o meio do retangulo e o meio da
   * silhueta inteira: nada na folha dizia qual dos dois vaos ele mede, e ler
   * 84 como a pista toda faz o retangulo virar 84 menos 60. */
  const cotas84 = (m.reg.tracos || []).filter((t) => t && t.tipo === 'cota');
  const chamadas = (m.reg.medido.segmentos || []).filter((s) => Math.abs(s.w - 0.6) < 0.01 &&
    Math.abs(s.x1 - s.x2) < 0.05 && s.tracejado.indexOf('[]') === 0);
  const t84 = textos(m).filter((t) => t.txt === '84')[0];
  const meioRet = longos.length === 2 ? (longos[0].x1 + longos[0].x2) / 2 : NaN;
  const silhueta = (m.reg.medido.arcos || []).reduce((a, x) => Math.max(a, x.cx + x.raio), -Infinity) -
                   (m.reg.medido.arcos || []).reduce((a, x) => Math.min(a, x.cx - x.raio), Infinity);
  const vaoCotado = cotas84.length ? Math.abs(cotas84[0].x2 - cotas84[0].x1) : 0;
  medido('84: vao cotado ' + n2c(vaoCotado) + ' pt (retangulo ' + n2c(longos.length === 2 ? Math.abs(longos[0].x1 - longos[0].x2) : 0) +
    ' pt, silhueta inteira ' + n2c(silhueta) + ' pt); ' + chamadas.length + ' linha(s) de chamada; o texto centrado em x = ' +
    n2c(t84 ? (t84.x + t84.largura / 2) : NaN) + ' pt, o meio do retangulo em ' + n2c(meioRet));
  conf('o 84 sai em cota, e nao como numero solto embaixo da aresta', cotas84.length === 1);
  conf('a cota mede o RETANGULO (84 unidades) e nao a silhueta inteira',
    Math.abs(vaoCotado / k - 84) < 0.05 && Math.abs(silhueta / k - 144) < 0.5);
  conf('com um tracinho de extensao descendo de cada ponta do retangulo', chamadas.length === 2 &&
    chamadas.every((s) => longos.some((L) => Math.abs(s.x1 - L.x1) < 0.05 || Math.abs(s.x1 - L.x2) < 0.05)));
}
{
  const m = achar('rodando');
  const k = m.reg.escala;
  const voltas = voltasInteiras(lerCaminhos(m.ops), 20).map((v) => caixaDe(pontosDoSub(v, 24))).sort((a, b) => a.cx - b.cx);
  medido('tres rodas com centros em x = ' + voltas.map((v) => ((v.cx - voltas[0].cx) / k).toFixed(4)).join(', ') + ' unidades (pi = ' + Math.PI.toFixed(4) + ')');
  conf('tres rodas iguais', voltas.length === 3 && voltas.every((v) => Math.abs(v.largura - voltas[0].largura) < 0.05));
  conf('a segunda a meia volta e a terceira a uma volta inteira', voltas.length === 3 &&
    Math.abs((voltas[1].cx - voltas[0].cx) / k - Math.PI) < 0.01 && Math.abs((voltas[2].cx - voltas[0].cx) / k - 2 * Math.PI) < 0.01);
  conf('r e C impressos', tem(m, 'r') === 1 && tem(m, 'C') === 1);
}

console.log('\nas recusas: o que cada receita se nega a desenhar, e com que aviso');
function comAviso(texto, pedaco) {
  const d = new PDFGen.Doc();
  d.novaPagina();
  d.partesDeFigura(texto).forEach(function (p) {
    if (p.tipo === 'figura') d.figura(p.diretiva, { x: MARG_E + 20, largura: LARGURA });
  });
  return (d.avisosFigura || []).filter((a) => a.indexOf(pedaco) >= 0).length;
}
conf('raio=5 com inscrito=12 se contradizem e a figura nao sai', comAviso('@fig circulo raio=5 inscrito=12', 'nao contam a mesma historia') === 1);
conf('setor=400 nao e angulo central', comAviso('@fig circulo setor=400', 'nao e angulo central') === 1);
conf('incognita sem angulo para marcar e recusada', comAviso('@fig circulo raio=5 incognita=x', 'sem angulo central') === 1);
conf('coroa maior que o raio e recusada', comAviso('@fig circulo raio=5 coroa=7', 'menor do que o raio') === 1);
conf('corda maior que o diametro e recusada', comAviso('@fig circulo raio=5 corda=11', 'nao cabe') === 1);
conf('fatias=1 e recusado', comAviso('@fig circulo fatias=1', 'inteiro de fatias') === 1);
conf('aneis com letra e recusado', comAviso('@fig circulo aneis=a;b', 'pede so numeros') === 1);
conf('chave nao declarada e recusada com aviso', comAviso('@fig circulo raio=5 cor=azul', 'chave nao declarada') === 1);
conf('conica com incognita=x e recusada, porque x sozinho e lido como angulo', comAviso('@fig conica tipo=elipse ponto=P incognita=x', 'lido como valor de ANGULO') >= 1 || comAviso('@fig conica tipo=elipse ponto=P incognita=x', 'le x, alfa') >= 1);
conf('ponto=P;20 fora do alcance da elipse e recusado', comAviso('@fig conica tipo=elipse a=5 b=4 ponto=P;20', 'raio focal tem que ficar entre') === 1);
conf('diretriz numa elipse e recusada', comAviso('@fig conica tipo=elipse diretriz=sim', 'so na parabola') === 1);
conf('tipo desconhecido e recusado', comAviso('@fig conica tipo=circulo', 'nao e elipse') === 1);
conf('poligono de dois lados e recusado', comAviso('@fig poligonoRegular lados=2', 'inteiro de 3 a 24') === 1);
conf('lado=6 com raio=10 num hexagono se contradizem', comAviso('@fig poligonoRegular lados=6 lado=6 raio=10', 'da raio') === 1);
conf('pidesenrolado sem sobra= avisa que o rotulo vem do tema', comAviso('@fig pidesenrolado diametro=d', 'sobra=') === 1);
conf('rodando sem comprimento= avisa que o rotulo vem do tema', comAviso('@fig rodando raio=r', 'comprimento=') === 1);
conf('raio=10 coroa=r e chute e fica fora de escala, exigindo legenda', comAviso('@fig circulo raio=10 coroa=r', 'fora de escala sem legenda') === 1);
conf('e raio=r diametro=d, tudo em letra, nao e fora de escala', comAviso('@fig circulo raio=r diametro=d', 'fora de escala') === 0);
conf('e inscrito=10 raio=r, com o raio deduzido, tambem nao', comAviso('@fig circulo inscrito=10 raio=r', 'fora de escala') === 0);

console.log('\nlingua: nenhuma palavra nasce dentro das receitas');
{
  const d = new PDFGen.Doc();
  d.novaPagina();
  ['@fig circulo raio=r sector=60', '@fig circulo raio=6 setor=60 centro=O legenda=The hatched region is the sector.',
   '@fig conica tipo=parabola p=4 focos=F vertices=V diretriz=d ponto=P',
   '@fig pidesenrolado diametro=d sobra=0.14·d'].forEach(function (t) {
    d.partesDeFigura(t).forEach(function (p) { if (p.tipo === 'figura') d.figura(p.diretiva, { x: MARG_E + 20, largura: LARGURA }); });
  });
  const nascidas = (d.avisosFigura || []).filter((a) => a.indexOf('nao veio do tema') >= 0);
  conf('nenhum texto impresso que nao veio da diretiva', nascidas.length === 0, nascidas.join(' | '));
}

console.log('\nquem esta ao lado de quem: o rotulo de medida contra a linha que ele nomeia');
/* Estas conferencias nasceram de defeitos MEDIDOS na folha do MAT08-13 e do
 * MATEM3-04, e cada uma falha na receita de antes:
 *
 *   alvo    o "2" ficava a 1,48 pt da linha do raio 6 e a 10,40 pt da propria
 *           linha, ou seja sete vezes mais perto da linha errada, e ainda saia
 *           riscado por ela, porque o cotaRadial poe raio e rotulo juntos na
 *           camada de marcas e os tres pares se intercalavam
 *   pizza   o "40" do diametro pousava no meio de MEIA corda: 9,68 pt de um
 *           raio de 54,39 pt contra 10,32 pt do diametro de 108,78 que ele
 *           nomeia, e quem le raio onde esta escrito diametro erra a area por
 *           fator 4
 *   c       o segmento do c da hiperbole era desenhado EM CIMA da assintota
 *           (desvio perpendicular de 0,003 pt ao longo de 38,57 pt), e a folha
 *           saia com tres meias diagonais tracejadas e uma continua
 *   gabarito  a resposta em teal saia no mesmo corpo e sem negrito do dado em
 *           preto, ou seja mais fraca na fotocopia do que o dado que ela
 *           responde
 */
function caixaDoTexto(t) {
  const alta = /[bdfhklt]|[A-Z0-9]/.test(t.txt);
  return { x0: t.x, x1: t.x + t.largura, y0: t.y, y1: t.y + t.tam * (alta ? 0.72 : 0.52) };
}
function centroDoTexto(t) { const c = caixaDoTexto(t); return { x: (c.x0 + c.x1) / 2, y: (c.y0 + c.y1) / 2 }; }
function vaoEntreCaixas(a, b) {
  const dx = Math.max(a.x0 - b.x1, 0, b.x0 - a.x1), dy = Math.max(a.y0 - b.y1, 0, b.y0 - a.y1);
  return Math.sqrt(dx * dx + dy * dy);
}
/* Distancia de um ponto ao segmento, que e a conta que decide de que linha um
 * rotulo esta ao lado. */
function ateOSegmento(P, s) {
  const vx = s.x2 - s.x1, vy = s.y2 - s.y1, wx = P.x - s.x1, wy = P.y - s.y1;
  const L2 = vx * vx + vy * vy;
  let t = L2 ? (wx * vx + wy * vy) / L2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt(Math.pow(P.x - (s.x1 + t * vx), 2) + Math.pow(P.y - (s.y1 + t * vy), 2));
}
function comprimento(s) { return Math.sqrt(Math.pow(s.x2 - s.x1, 2) + Math.pow(s.y2 - s.y1, 2)); }
/* Declaracao e nao const: as secoes de cima (pista, pi desenrolado) tambem
 * imprimem numero medido, e um const daqui ficaria na zona morta para elas. */
function n2c(v) { return (Math.round(v * 100) / 100).toFixed(2); }
/* Onde o rotulo pousa ao longo do vao que ele nomeia, de 0 a 1. E a conta que
 * separa "no meio da medida inteira" de "no meio de uma das metades". */
function ondeAoLongo(P, s) {
  const vx = s.x2 - s.x1, vy = s.y2 - s.y1, wx = P.x - s.x1, wy = P.y - s.y1;
  const L2 = vx * vx + vy * vy;
  return L2 ? Math.max(0, Math.min(1, (wx * vx + wy * vy) / L2)) : 0;
}

{
  const m = achar('aneis'), reg = m.reg, k = reg.escala;
  const raios = (reg.medido.segmentos || []).filter((s) => Math.abs(s.w - 0.9) < 0.01);
  const centro = raios.length ? { x: raios[0].x1, y: raios[0].y1 } : null;
  conf('o alvo desenha um raio cotado por anel', raios.length === 3, raios.length + ' segmentos de 0,9 pt');
  /* Cada raio e identificado pelo COMPRIMENTO: 2, 4 e 6 unidades. */
  const porValor = {};
  for (const s of raios) porValor[Math.round(comprimento(s) / k)] = s;
  let pior = Infinity, piorNome = '', menorFolga = Infinity;
  const foraDoAnel = [];
  for (const valor of [2, 4, 6]) {
    const t = textos(m).filter((x) => x.txt === String(valor))[0];
    const meu = porValor[valor];
    if (!t || !meu) { conf('o rotulo ' + valor + ' e o raio ' + valor + ' existem', false); continue; }
    const c = centroDoTexto(t);
    const dMeu = ateOSegmento(c, meu);
    let dOutro = Infinity;
    for (const s of raios) if (s !== meu) dOutro = Math.min(dOutro, ateOSegmento(c, s));
    const cx = caixaDoTexto(t);
    const meiaDiagonal = Math.sqrt(Math.pow(cx.x1 - cx.x0, 2) + Math.pow(cx.y1 - cx.y0, 2)) / 2;
    const raioDoRotulo = Math.sqrt(Math.pow(c.x - centro.x, 2) + Math.pow(c.y - centro.y, 2)) / k;
    const interno = valor === 2 ? 0 : valor - 2;
    if (!(raioDoRotulo > interno && raioDoRotulo < valor)) foraDoAnel.push(valor + ' em ' + n2c(raioDoRotulo));
    medido('rotulo ' + valor + ': ' + n2c(dMeu) + ' pt do proprio raio, ' + n2c(dOutro) + ' pt do outro raio mais proximo, meia diagonal da caixa ' +
      n2c(meiaDiagonal) + ' pt, pousa a ' + n2c(raioDoRotulo) + ' unidades do centro (anel de ' + interno + ' a ' + valor + ')');
    if (dOutro - dMeu < pior) { pior = dOutro - dMeu; piorNome = String(valor); }
    menorFolga = Math.min(menorFolga, dOutro - meiaDiagonal);
  }
  conf('o raio mais proximo de cada rotulo e o raio que ele nomeia (pior sobra ' + n2c(pior) + ' pt, no ' + piorNome + ')', pior > 0);
  conf('e nenhum outro raio chega a entrar na caixa do rotulo (folga ' + n2c(menorFolga) + ' pt), que era o "2" saindo riscado', menorFolga > 0);
  conf('cada rotulo pousa DENTRO do anel que ele mede', foraDoAnel.length === 0, foraDoAnel.join(', ') || 'os tres dentro');
  let vaoMin = Infinity, par = '';
  const ts = textos(m);
  for (let i = 0; i < ts.length; i++) {
    for (let j = i + 1; j < ts.length; j++) {
      const v = vaoEntreCaixas(caixaDoTexto(ts[i]), caixaDoTexto(ts[j]));
      if (v < vaoMin) { vaoMin = v; par = ts[i].txt + ' e ' + ts[j].txt; }
    }
  }
  medido('menor vao entre duas caixas de rotulo do alvo: ' + n2c(vaoMin) + ' pt (' + par + ')');
  conf('nenhum par de rotulos do alvo se atropela (piso de 20 pt; antes o 2 e o 4 saiam empilhados na mesma coluna)', vaoMin >= 20);
}

{
  const m = achar('fatias'), reg = m.reg, k = reg.escala;
  const t = textos(m).filter((x) => x.txt === '40')[0];
  const c = centroDoTexto(t);
  const raios = (reg.medido.segmentos || []).filter((s) => Math.abs(s.w - 0.9) < 0.01 && Math.abs(comprimento(s) / k - 20) < 0.5);
  const cotas = (reg.tracos || []).filter((x) => x && x.tipo === 'cota');
  let dRaio = Infinity;
  for (const s of raios) dRaio = Math.min(dRaio, ateOSegmento(c, s));
  /* A MEDIDA do diametro: a cota quando ela existe, senao o proprio segmento de
   * 40 unidades que a receita antiga desenhava. E dela que o "40" tem que estar
   * mais perto, e nao de um raio. */
  const medidaDoDiametro = (reg.medido.segmentos || [])
    .filter((s) => Math.abs(s.w - 0.9) < 0.01 && comprimento(s) / k > 30);
  let dDiam = Infinity;
  for (const s of medidaDoDiametro) dDiam = Math.min(dDiam, ateOSegmento(c, s));
  medido('pizza: ' + raios.length + ' raios de 20 unidades; o "40" esta a ' + n2c(dDiam) + ' pt da medida do diametro e a ' + n2c(dRaio) + ' pt do raio mais proximo');
  conf('a pizza tem os oito raios de 20 unidades', raios.length === 8);
  conf('o diametro sai como cota, com as duas pontas marcadas', cotas.length === 1, cotas.length + ' cota(s)');
  conf('e o "40" esta mais perto da medida do diametro do que de qualquer raio (era 10,32 pt do diametro contra 9,68 pt de um raio)', dDiam < dRaio);
}

{
  /* A figura que existe PARA separar raio de diametro (material p2 do
   * MAT08-13, tres linhas abaixo de "d = 2 x r"). O "d" pousava sobre a corda,
   * no em padrao de 0,72, que e quase o meio da segunda metade: 25,92 pt do
   * centro, contra 28,90 pt do "r", ou seja dois rotulos iguais grudados em
   * dois pedacos do mesmo tamanho. Levar o texto para o meio da corda inteira
   * nao resolve, porque la esta o centro com a bolinha e a letra O. */
  const m = achar('circulo r d O'), reg = m.reg, k = reg.escala;
  const segs = reg.medido.segmentos || [];
  const cotas = (reg.tracos || []).filter((x) => x && x.tipo === 'cota');
  const corda = segs.filter((s) => Math.abs(s.w - 0.9) < 0.01 && Math.abs(comprimento(s) / k - 10) < 0.2)[0];
  const raio = segs.filter((s) => Math.abs(s.w - 0.9) < 0.01 && Math.abs(comprimento(s) / k - 5) < 0.2)[0];
  const medida = cotas.length ? { x1: cotas[0].x1, y1: cotas[0].y1, x2: cotas[0].x2, y2: cotas[0].y2 } : corda;
  const td = textos(m).filter((t) => t.txt === 'd')[0];
  const tr = textos(m).filter((t) => t.txt === 'r')[0];
  conf('a corda do diametro continua desenhada, com o dobro do raio', !!corda && !!raio);
  conf('e a medida dele sai em cota, com tracinho nas duas pontas (era rotulo na propria linha)', cotas.length === 1, cotas.length + ' cota(s)');
  if (td && tr && corda && raio && medida) {
    const cd = centroDoTexto(td), cr = centroDoTexto(tr);
    const centro = { x: raio.x1, y: raio.y1 };
    const onde = ondeAoLongo(cd, medida);
    const doCentroD = Math.sqrt(Math.pow(cd.x - centro.x, 2) + Math.pow(cd.y - centro.y, 2));
    const doCentroR = Math.sqrt(Math.pow(cr.x - centro.x, 2) + Math.pow(cr.y - centro.y, 2));
    const rp = comprimento(raio);
    medido('circulo r d O: o "d" pousa a ' + n2c(onde) + ' do vao que ele mede e a ' + n2c(doCentroD) +
      ' pt do centro (o "r" a ' + n2c(doCentroR) + ' pt); raio impresso ' + n2c(rp) + ' pt');
    conf('o "d" pousa no MEIO da medida inteira, e nao no meio de uma das metades (era 0,72, o meio da segunda metade)',
      Math.abs(onde - 0.5) < 0.08);
    conf('e sai para fora da circunferencia, longe de onde o "r" mora (os dois estavam a 25,92 e 28,90 pt do centro)',
      doCentroD > rp + 2);
    conf('o "d" continua mais perto da medida que ele nomeia do que do raio desenhado',
      ateOSegmento(cd, medida) < ateOSegmento(cd, raio));
  } else {
    conf('a figura tem corda, raio, "d" e "r"', false);
  }
}

{
  /* Com quadrado, a cota do diametro tem que sair do lado CONTRARIO ao rotulo
   * do lado do quadrado, que mora sempre embaixo. Levando a cota do diametro
   * para fora sem virar de lado, os dois "10" (o do lado e o do diametro, que
   * na figura inscrita valem a mesma coisa e nao sao a mesma medida) caiam a
   * 6,41 pt um do outro, contra 40,10 pt de antes da cota existir. */
  const m = achar('inscrito com diametro');
  const dez = textos(m).filter((t) => t.txt === '10');
  const vao = dez.length === 2 ? vaoEntreCaixas(caixaDoTexto(dez[0]), caixaDoTexto(dez[1])) : -1;
  medido('inscrito com diametro: os dois "10" ficam a ' + n2c(vao) + ' pt um do outro');
  conf('os dois "10" (lado do quadrado e diametro) nao se atropelam (piso de 14 pt; com a cota do mesmo lado davam 6,41 pt)',
    dez.length === 2 && vao >= 14);
}

{
  /* O C do centro da elipse transladada (material p4 do MATEM3-04). As duas
   * linhas de cota da translacao saem com fora= na origem, ou seja para o lado
   * de LA do centro; o C ia para a mesma diagonal e encostava na vertical: 0,88
   * pt da linha de cota do valor 3 contra 11,42 pt da bolinha que ele nomeia,
   * treze vezes mais perto da cota do que do ponto. De cima para baixo lia-se
   * seta, C, traco, 3, seta. */
  const m = achar('elipse transladada 2 3'), reg = m.reg;
  const segs = reg.medido.segmentos || [];
  const linhasDeCota = segs.filter((s) => Math.abs(s.w - 0.9) < 0.01 && comprimento(s) > 20 &&
    (Math.abs(s.x1 - s.x2) < 0.05 || Math.abs(s.y1 - s.y2) < 0.05) &&
    comprimento(s) < 90);
  const bolas = bolinhas(lerCaminhos(m.ops));
  const tC = textos(m).filter((t) => t.txt === 'C')[0];
  if (tC && bolas.length && linhasDeCota.length >= 2) {
    const cC = centroDoTexto(tC);
    let doPonto = Infinity;
    for (const b of bolas) doPonto = Math.min(doPonto, Math.sqrt(Math.pow(cC.x - b.cx, 2) + Math.pow(cC.y - b.cy, 2)));
    let daCota = Infinity, qual = '';
    for (const s of linhasDeCota) {
      const v = ateOSegmento(cC, s);
      if (v < daCota) { daCota = v; qual = Math.abs(s.x1 - s.x2) < 0.05 ? 'a vertical (o 3)' : 'a horizontal (o 2)'; }
    }
    medido('elipse transladada: o "C" esta a ' + n2c(doPonto) + ' pt da bolinha do centro e a ' + n2c(daCota) +
      ' pt da linha de cota mais proxima, ' + qual + ' (eram 11,42 e 0,88 pt)');
    conf('o C esta mais perto do PONTO que ele nomeia do que de qualquer linha de cota', doPonto < daCota);
    conf('e fora da faixa da linha de cota, com folga de leitura (piso de 6 pt)', daCota > 6);
  } else {
    conf('a elipse transladada tem o C, a bolinha do centro e as duas linhas de cota', false,
      'C ' + (tC ? 'sim' : 'nao') + ', bolinhas ' + bolas.length + ', cotas ' + linhasDeCota.length);
  }
}

{
  const m = achar('hiperbole'), reg = m.reg;
  const segs = reg.medido.segmentos || [];
  const assintotas = segs.filter((s) => s.tracejado.indexOf('[2 2]') === 0 && comprimento(s) > 150);
  const linhaC = segs.filter((s) => Math.abs(s.w - 0.9) < 0.01 && comprimento(s) > 20);
  conf('as duas assintotas saem inteiras e tracejadas', assintotas.length === 2, assintotas.length + ' assintota(s)');
  let menor = Infinity;
  for (const s of linhaC) {
    const meio = { x: (s.x1 + s.x2) / 2, y: (s.y1 + s.y2) / 2 };
    for (const a of assintotas) menor = Math.min(menor, ateOSegmento(meio, a));
  }
  medido('a linha que carrega o c passa a ' + n2c(menor) + ' pt da assintota mais proxima (antes 0,00 pt, ou seja em cima dela)');
  conf('a linha que carrega o c nao e desenhada em cima da assintota', menor > 2);
  const lados = segs.filter((s) => s.tracejado.indexOf('[2 2]') === 0 && comprimento(s) > 40 && comprimento(s) < 120);
  const emMuted = lados.filter((s) => s.cor && Math.abs(s.cor[0] - COR.muted[0]) < 0.02 && Math.abs(s.cor[1] - COR.muted[1]) < 0.02);
  conf('o retangulo fundamental sai na tinta do contorno, e nao em muted', lados.length === 4 && emMuted.length === 0,
    lados.length + ' lados, ' + emMuted.length + ' em muted');
}

{
  /* A hierarquia da folha de gabarito: o que carrega a RESPOSTA nunca pode ser
   * a marca mais fraca da figura. O teal do gabarito da 4,93:1 contra 17,08:1
   * da tinta do texto, entao no mesmo corpo e sem negrito a resposta imprime
   * mais clara do que o dado que ela responde. */
  const m = achar('elipse gab 18');
  const resp = textos(m).filter((t) => t.txt === 'd = 7' || t.txt === '3');
  const dado = textos(m).filter((t) => t.txt === 'F1' || t.txt === 'F2' || t.txt === 'P');
  medido('gabarito do 18: resposta ' + resp.map((t) => t.txt + ' em ' + t.tam + ' pt' + (t.bold ? ' negrito' : '')).join(', ') +
    '; dado ' + dado.map((t) => t.txt + ' em ' + t.tam + ' pt' + (t.bold ? ' negrito' : '')).join(', '));
  conf('a resposta do gabarito sai em negrito', resp.length === 2 && resp.every((t) => t.bold === true));
  conf('e num corpo maior do que o do dado', resp.length === 2 && resp.every((t) => dado.every((q) => t.tam > q.tam)));
  conf('o dado continua sem negrito, para a diferenca ser visivel', dado.length === 3 && dado.every((t) => !t.bold));
}

console.log('\na folha inteira');
const avisos = doc.avisosFigura || [];
conf('todas as ' + CASOS.length + ' figuras foram desenhadas', (doc.figurasDesenhadas || []).length === CASOS.length, (doc.figurasDesenhadas || []).length + ' figuras');
conf('nenhuma passa do teto de cinco marcas', (doc.figurasDesenhadas || []).every((r) => r.marcasAtivas <= 5),
  'marcas por figura: ' + (doc.figurasDesenhadas || []).map((r) => r.marcasAtivas).join(' '));
conf('nenhum aviso de figura na folha inteira', avisos.length === 0);
for (const a of avisos) console.log('  aviso . ' + a);
for (const m of medidas) {
  if (m.reg && (m.reg.conferencia || []).length) {
    for (const f of m.reg.conferencia) console.log('  acusa   ' + m.caso.nome + ': ' + f);
  }
}

/* Estado grafico: nenhum q sem Q, nenhum tracejado nem recorte fora de envelope. */
{
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
