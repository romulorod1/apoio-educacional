/* figuras/_prova_receitas_plano.js
 * Folha de prova da familia (a) do kit: as chaves base=, altura= e diagonal= com
 * medida e letra, no triangulo e no quadrilatero. Uma pagina por caso, pelo
 * caminho de verdade: a diretiva @fig e lida pelo partesDeFigura do pdf.js e
 * desenhada pelo doc.figura, como no material do tema.
 *
 * A folha e o gate visual. Quem prova e a MEDICAO no fluxo de conteudo, ou seja
 * no que vai sair impresso, e nao no que a receita disse que ia desenhar:
 *
 *   altura      o segmento tracejado sai na escala da figura (uma altura=6 numa
 *               base=10 mede 6 unidades no papel), o quadradinho de angulo reto
 *               sai NO PE dele e nao flutuando, e quando o pe cai fora do lado o
 *               prolongamento tracejado existe e vai da ponta do lado ate o pe
 *   base        a medida sai por fora, no ponto medio, e quando o lado ja carrega
 *               tracinho ou seta de paralelismo ela sai em COTA, nao empilhada
 *   diagonal    linha CONTINUA e fina, nunca tracejada, e o valor numerico e
 *               conferido contra a conta (num retangulo, contra Pitagoras)
 *   escala      figura toda em letra sai do prototipo, que e exato por
 *               construcao, e NAO carrega a marca de fora de escala nem exige
 *               legenda; a mistura de numero e letra continua carregando as duas
 *
 * O par envenenado de cada trava esta na secao de recusas, cada um com o par
 * limpo ao lado: um teste que so olha a versao que passa nao prova nada.
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
const FIEL = 'escala=fiel';

/* ================================================================ os casos
 * Um caso por chave e por combinacao, mais as duas fases onde a fase muda alguma
 * coisa. O "mede" diz o que a secao de medicao vai procurar naquela pagina. */

const CASOS = [
  /* ---------------------------------------------------------- triangulo */
  { nome: 'tri base altura', titulo: 'triangulo: base 10 e altura 6, com o quadradinho no pe',
    fig: '@fig triangulo id=t1 base=10 altura=6', mede: 'triangulo' },
  { nome: 'tri rotulos', titulo: 'triangulo: a mesma figura com a base rotulada b e a altura rotulada h',
    fig: '@fig triangulo id=t2 base=10;b altura=6;h', mede: 'triangulo' },
  { nome: 'tri generico', titulo: 'triangulo: base b e altura h, tudo em letra (prototipo exato, sem legenda de escala)',
    fig: '@fig triangulo id=t3 base=b altura=h', mede: 'triangulo' },
  { nome: 'tri obtusangulo', titulo: 'triangulo obtusangulo de lados 4, 6 e 9, altura saindo de A com o pe FORA do lado',
    fig: '@fig triangulo id=t4 lado=4 lado=6 lado=9 altura=h;h;A ' + FIEL, mede: 'triangulo' },
  { nome: 'tri 345', titulo: 'triangulo 3, 4, 5 com a altura relativa a hipotenusa (a figura do MAT09-06)',
    fig: '@fig triangulo id=t5 lado=3 lado=4 lado=5 altura=h ' + FIEL, mede: 'triangulo' },
  { nome: 'tri base girada', titulo: 'triangulo: base 10 e altura 6 com a figura girada 24 graus',
    fig: '@fig triangulo id=t6 base=10 altura=6 giro=24', mede: 'triangulo' },

  /* ---------------------------------------------------------- quadrilatero */
  { nome: 'ret 4 3 5', titulo: 'retangulo de base 4 e altura 3 com a diagonal 5 rotulada d (Pitagoras fecha)',
    fig: '@fig quadrilatero id=q1 tipo=retangulo base=4 altura=3 diagonal=A;C;5;d', mede: 'quadrilatero' },
  { nome: 'ret b h d', titulo: 'o caso literal do MATEM3-12: retangulo de base b, altura h e diagonal d',
    fig: '@fig quadrilatero id=q2 tipo=retangulo base=b altura=h diagonal=A;C;d', mede: 'quadrilatero' },
  { nome: 'ret 4 3 d', titulo: 'retangulo 4 por 3 com a diagonal PEDIDA, sem valor na diretiva',
    fig: '@fig quadrilatero id=q3 tipo=retangulo base=4 altura=3 diagonal=A;C;d', mede: 'quadrilatero' },
  { nome: 'ret 4 3 d gab', titulo: 'a mesma figura no gabarito: d = 5 em teal, medido na propria figura',
    fig: '@fig id=q3 fase=gabarito', mede: 'quadrilatero',
    gabaritoDe: '@fig quadrilatero id=q3 tipo=retangulo base=4 altura=3 diagonal=A;C;d' },
  { nome: 'losango d', titulo: 'losango de lado 6 e altura 5 com a diagonal pedida',
    fig: '@fig quadrilatero id=q10 tipo=losango base=6;L altura=5;h diagonal=A;C;d', mede: 'quadrilatero' },
  { nome: 'trapezio', titulo: 'trapezio de bases 10 e 6 e altura 4, com a altura tracejada entre as duas bases',
    fig: '@fig quadrilatero id=q4 tipo=trapezio base=10;B base=6;b altura=4;h', mede: 'quadrilatero' },
  { nome: 'trapezio generico', titulo: 'trapezio de bases B e b e altura h, tudo em letra (o segundo caso do MATEM3-12)',
    fig: '@fig quadrilatero id=q5 tipo=trapezio base=B base=b altura=h', mede: 'quadrilatero' },
  { nome: 'paralelogramo', titulo: 'paralelogramo de base 10 e altura 6, com a altura entre as duas bases',
    fig: '@fig quadrilatero id=q6 tipo=paralelogramo base=10;b altura=6;h', mede: 'quadrilatero' },
  { nome: 'paralelogramo obtuso', titulo: 'paralelogramo de 120 graus: o pe da altura cai FORA da base e o lado sai prolongado',
    fig: '@fig quadrilatero id=q7 tipo=paralelogramo angulo=120 altura=h ' + FIEL, mede: 'quadrilatero' },
  { nome: 'quadrado', titulo: 'quadrado de lado 6: a base e a altura sao o mesmo lado, e a medida sai em cota',
    fig: '@fig quadrilatero id=q8 tipo=quadrado base=6;L', mede: 'quadrilatero' },
  { nome: 'diagonal de sempre', titulo: 'a diagonal como ela sempre foi: sem medida e sem letra, com a glosa das duas regioes',
    fig: '@fig quadrilatero id=q9 tipo=quadrilatero diagonal=A;C regioes=soma;180 regioes=soma;180', mede: 'quadrilatero' }
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
  medidas.push({ caso: caso, reg: (doc.figurasDesenhadas || [])[antes] || null, ops: pag.ops.slice(de) });
});

fs.writeFileSync(path.join(__dirname, '_prova_receitas_plano.pdf'), doc.finalizar());
console.log('_prova_receitas_plano.pdf: ' + CASOS.length + ' paginas');

/* ================================================================ utilidades */

let ok = 0, mau = 0;
function conf(rotulo, cond, extra) {
  if (cond) ok++; else mau++;
  console.log((cond ? '  OK    ' : '  FALHA ') + rotulo + (extra ? '   ' + extra : ''));
}
function medido(t) { console.log('        ' + t); }
function n2c(v) { return (Math.round(v * 100) / 100).toFixed(2); }

function achar(nome) {
  const m = medidas.filter((q) => q.caso.nome === nome)[0];
  if (!m) throw new Error('caso ' + nome + ' nao foi desenhado');
  return m;
}
function segs(m) { return ((m.reg && m.reg.medido && m.reg.medido.segmentos) || []); }
function textos(m) { return ((m.reg && m.reg.medido && m.reg.medido.textos) || []); }
function tem(m, txt) { return textos(m).filter((t) => t.txt === txt).length; }
function marcasDe(m, tipo) { return ((m.reg && m.reg.marcas) || []).filter((k) => k && k.tipo === tipo); }
const comp = (s) => Math.sqrt((s.x2 - s.x1) * (s.x2 - s.x1) + (s.y2 - s.y1) * (s.y2 - s.y1));
const dist = (a, b) => Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
function mesmaCor(c, alvo) {
  return c && Math.abs(c[0] - alvo[0]) + Math.abs(c[1] - alvo[1]) + Math.abs(c[2] - alvo[2]) < 0.01;
}
function corDe(m, txt) {
  const t = textos(m).filter((x) => x.txt === txt)[0];
  if (!t) return '(nao saiu)';
  return mesmaCor(t.cor, COR.teal) ? 'teal' : (mesmaCor(t.cor, COR.texto) ? 'preto' : t.cor.map((v) => v.toFixed(2)).join('/'));
}

/* O tracejado da altura e o [2 2] da guia de leitura, na tinta do contorno; o do
 * prolongamento e o mesmo padrao em COR.muted. Os dois no piso de 0,6 pt, que e o
 * unico nivel que a especificacao deixa para construcao. */
function altura(m) {
  return segs(m).filter((s) => Math.abs(s.w - 0.6) < 0.01 &&
    String(s.tracejado).indexOf('[2 2]') === 0 && mesmaCor(s.cor, COR.texto));
}
function prolongamento(m) {
  return segs(m).filter((s) => Math.abs(s.w - 0.6) < 0.01 &&
    String(s.tracejado).indexOf('[2 2]') === 0 && mesmaCor(s.cor, COR.muted));
}
function contorno(m) { return segs(m).filter((s) => Math.abs(s.w - 1.2) < 0.01); }

/* ================================================================ conferencias */

console.log('\naltura: o segmento tracejado, a medida dele e o quadradinho no pe');
/* A altura mede na FOLHA o que a diretiva escreveu. E a conferencia que separa
 * "desenhei um tracinho de cima para baixo" de "desenhei a altura": com base=10 e
 * altura=6 a razao entre os dois tem que ser 0,6 no papel, senao a aluna que
 * medir com a regua acha outro numero e o desenho deixa de valer. */
{
  const m = achar('tri base altura'), k = m.reg.escala;
  const alt = altura(m), base = contorno(m).sort((a, b) => comp(b) - comp(a));
  const baseH = contorno(m).filter((s) => Math.abs(s.y1 - s.y2) < 0.05).sort((a, b) => comp(b) - comp(a))[0];
  medido('escala ' + n2c(k) + ' pt por unidade; ' + alt.length + ' segmento(s) de altura, ' +
    'o mais longo com ' + n2c(alt.length ? comp(alt[0]) : 0) + ' pt (' +
    n2c(alt.length ? comp(alt[0]) / k : 0) + ' unidades)');
  conf('a altura sai como UM segmento tracejado [2 2] de 0,6 pt na tinta do contorno', alt.length === 1);
  conf('e ela mede 6 unidades na escala da figura', alt.length === 1 && Math.abs(comp(alt[0]) / k - 6) < 0.02,
    alt.length ? n2c(comp(alt[0]) / k) + ' unidades' : '(nenhuma)');
  conf('e a base desenhada mede 10 unidades', baseH && Math.abs(comp(baseH) / k - 10) < 0.02,
    baseH ? n2c(comp(baseH) / k) + ' unidades' : '(nao achei a base horizontal)');
  /* O quadradinho tem que estar NO PE e nao flutuando: a especificacao diz que
   * sem ele a altura vira uma ceviana qualquer e a aluna a confunde com mediana e
   * bissetriz, que e o erro classico desta serie. */
  const quad = marcasDe(m, 'anguloReto');
  const pes = alt.length ? [{ x: alt[0].x1, y: alt[0].y1 }, { x: alt[0].x2, y: alt[0].y2 }] : [];
  const vaoQuad = quad.length && pes.length
    ? Math.min.apply(null, pes.map((p) => dist(p, quad[0]))) : Infinity;
  medido('quadradinhos anotados: ' + quad.length + '; o mais perto de uma ponta da altura a ' +
    n2c(vaoQuad) + ' pt');
  conf('o quadradinho de angulo reto sai UMA vez', quad.length === 1, quad.length + ' quadradinho(s)');
  conf('e ele encosta numa ponta da altura (o pe), e nao flutua', vaoQuad < 0.05, n2c(vaoQuad) + ' pt');
  /* O pe e a ponta que esta SOBRE a base, e nao a que esta no vertice. */
  const naBase = baseH && quad.length ? Math.abs(quad[0].y - baseH.y1) : Infinity;
  conf('e o pe esta sobre a base e nao no vertice de cima', naBase < 0.05, n2c(naBase) + ' pt da linha da base');
  conf('a figura nao carrega marca de fora de escala', m.reg.foraDeEscala === false);
  conf('a base e a altura contam duas marcas, e o quadradinho a terceira',
    m.reg.marcasAtivas === 3, m.reg.marcasAtivas + ' marcas');
  conf('e os dois numeros da diretiva chegam na folha', tem(m, '10') === 1 && tem(m, '6') === 1);
}
{
  const m = achar('tri rotulos');
  medido('textos impressos: ' + textos(m).map((t) => t.txt).join(' '));
  conf('base=10;b constroi com 10 e escreve b', tem(m, 'b') === 1 && tem(m, '10') === 0);
  conf('altura=6;h constroi com 6 e escreve h', tem(m, 'h') === 1 && tem(m, '6') === 0);
  const k = m.reg.escala, alt = altura(m);
  conf('e a construcao continua sendo 10 por 6', alt.length === 1 && Math.abs(comp(alt[0]) / k - 6) < 0.02,
    alt.length ? n2c(comp(alt[0]) / k) + ' unidades de altura' : '(nenhuma)');
}

console.log('\nescala: figura toda em letra sai do prototipo e nao e fora de escala');
/* Ate esta rodada, letra em chave metrica ligava a marca de fora de escala mesmo
 * quando o desenho saia exato, e a outra trava reprovava a figura por isso: o
 * autor tinha que escrever escala=fiel a mao em toda figura generica, e esquecer
 * disso era silencioso do lado errado. */
{
  const m = achar('tri generico');
  medido('foraDeEscala: ' + m.reg.foraDeEscala + '; legenda: ' + (m.reg.legenda || '(nenhuma)') +
    '; avisos da figura: ' + (m.reg.avisos || []).length);
  conf('base=b altura=h NAO e fora de escala', m.reg.foraDeEscala === false);
  conf('e por isso a figura nao pede legenda de escala', (m.reg.avisos || [])
    .filter((a) => a.indexOf('fora de escala sem legenda') >= 0).length === 0);
  conf('e as duas letras chegam na folha', tem(m, 'b') === 1 && tem(m, 'h') === 1);
  const alt = altura(m);
  conf('a altura continua desenhada, com o quadradinho', alt.length === 1 && marcasDe(m, 'anguloReto').length === 1);
}
{
  const m = achar('trapezio generico');
  conf('e o trapezio de bases B e b e altura h tambem nao e fora de escala', m.reg.foraDeEscala === false);
  conf('com as tres letras na folha', tem(m, 'B') === 1 && tem(m, 'b') === 1 && tem(m, 'h') === 1,
    textos(m).map((t) => t.txt).join(' '));
}

console.log('\naltura de pe externo: o prolongamento tracejado tem que existir');
/* "Se o triangulo for obtusangulo, desenhar o prolongamento do lado em tracejado
 * ate o pe, e o quadradinho vai sobre o prolongamento." Sem ele a altura aparece
 * flutuando fora da figura e nao se sustenta visualmente. */
{
  const m = achar('tri obtusangulo'), k = m.reg.escala;
  const alt = altura(m), pro = prolongamento(m);
  medido(pro.length + ' prolongamento(s) em COR.muted, o maior com ' +
    n2c(pro.length ? comp(pro[0]) : 0) + ' pt; altura de ' + n2c(alt.length ? comp(alt[0]) : 0) + ' pt');
  conf('o prolongamento tracejado existe', pro.length === 1);
  /* Ele vai da PONTA do lado ate o pe da altura, ou seja liga o contorno ao
   * quadradinho: um traco solto ao lado nao sustenta nada. */
  const quad = marcasDe(m, 'anguloReto');
  const pontas = pro.length ? [{ x: pro[0].x1, y: pro[0].y1 }, { x: pro[0].x2, y: pro[0].y2 }] : [];
  const doQuad = quad.length && pontas.length
    ? Math.min.apply(null, pontas.map((p) => dist(p, quad[0]))) : Infinity;
  conf('e ele termina no pe da altura, onde esta o quadradinho', doQuad < 0.05, n2c(doQuad) + ' pt');
  const noContorno = pontas.length ? Math.min.apply(null, pontas.map(
    (p) => Math.min.apply(null, contorno(m).map(
      (s) => Math.min(dist(p, { x: s.x1, y: s.y1 }), dist(p, { x: s.x2, y: s.y2 })))))) : Infinity;
  conf('e a outra ponta dele nasce num vertice do contorno', noContorno < 0.05, n2c(noContorno) + ' pt');
  /* A altura de um triangulo de lados 4, 6 e 9 relativa ao lado a (BC, que mede
   * 4) vale 2 vezes a area sobre 4. Area por Heron: s = 9,5. */
  const s = 9.5, area = Math.sqrt(s * (s - 4) * (s - 6) * (s - 9));
  medido('area por Heron ' + n2c(area) + ', altura relativa ao lado 4 vale ' + n2c(2 * area / 4));
  conf('e a altura desenhada mede o que a conta diz',
    alt.length === 1 && Math.abs(comp(alt[0]) / k - 2 * area / 4) < 0.05,
    alt.length ? n2c(comp(alt[0]) / k) + ' contra ' + n2c(2 * area / 4) : '(nenhuma)');
}

console.log('\ngabarito: o valor resolvido em teal, medido na propria figura');
{
  const m = achar('ret 4 3 d gab');
  conf('a diagonal do retangulo 4 por 3 sai resolvida', tem(m, 'd = 5') === 1,
    textos(m).map((t) => t.txt).join(' '));
  conf('e em teal', corDe(m, 'd = 5') === 'teal');
  /* Teal e o corpo do dado imprimem diferente: medido a 150 dpi, o teal deposita
   * 1.176 de tinta por ponto de largura contra 1.928 do preto, 39 por cento a
   * menos. Sem subir o corpo e o peso, a resposta sai mais fraca do que a
   * pergunta na folha fotocopiada. */
  const tD = textos(m).filter((x) => x.txt === 'd = 5')[0];
  const tDado = textos(m).filter((x) => x.txt === '4')[0];
  medido('resposta em ' + (tD ? tD.tam + ' pt bold=' + tD.bold : '(nao saiu)') +
    ', dado em ' + (tDado ? tDado.tam + ' pt bold=' + tDado.bold : '(nao saiu)'));
  conf('e em corpo de resposta e negrito, um degrau acima do dado',
    !!tD && !!tDado && tD.tam > tDado.tam && tD.bold === true && !tDado.bold);
  conf('e a base e a altura do enunciado continuam em preto',
    corDe(m, '4') === 'preto' && corDe(m, '3') === 'preto');
}
/* So o retangulo e o quadrado levam base, altura e diagonal ate o gabarito por
 * baixo do teto de cinco marcas. Nos outros tipos a camada de resposta acrescenta
 * os QUATRO valores de angulo, que ali sao deducao dos dados, e a figura passa de
 * cinco. No retangulo e no quadrado os quatro angulos sao retos e ja estao ditos
 * pelos quadradinhos da classe, entao a resposta nao repete nada. */
conf('o losango com base, altura e diagonal passa no enunciado',
  comAviso('@fig quadrilatero tipo=losango base=6;L altura=5;h diagonal=A;C;d', 'marcas ativas') === 0);
conf('e estoura o teto no gabarito, porque la os quatro angulos deduzidos entram junto',
  comAviso('@fig quadrilatero tipo=losango base=6;L altura=5;h diagonal=A;C;d fase=gabarito',
    'marcas ativas: 9') === 1);
/* No paralelogramo e no trapezio escaleno a base e a altura NAO fecham a forma:
 * a inclinacao das pernas fica livre e sai do prototipo, e com ela sai a
 * diagonal. Medir a diagonal ali seria medir o chute. */
{
  const d3 = new PDFGen.Doc();
  d3.novaPagina();
  d3.partesDeFigura('@fig quadrilatero tipo=paralelogramo base=10 altura=6 diagonal=A;C;d fase=gabarito')
    .forEach(function (p) { if (p.tipo === 'figura') d3.figura(p.diretiva, { x: MARG_E + 20, largura: LARGURA }); });
  const reg = (d3.figurasDesenhadas || [])[0] || { medido: { textos: [] } };
  const t = (reg.medido.textos || []).map((x) => x.txt);
  conf('a diagonal do paralelogramo, que depende da inclinacao chutada, NAO vira resposta',
    t.indexOf('d') >= 0 && !t.filter((x) => x.indexOf('d =') === 0).length, t.join(' '));
}
/* O valor so vira resposta quando a forma foi DEDUZIDA dos dados. Com base=10 e
 * altura=h a altura vem da proporcao do prototipo, e escrever esse numero no
 * gabarito da professora seria entregar um chute como conta. */
{
  const d2 = new PDFGen.Doc();
  d2.novaPagina();
  d2.partesDeFigura('@fig triangulo base=10 altura=h fase=gabarito legenda=Figura fora de escala.')
    .forEach(function (p) { if (p.tipo === 'figura') d2.figura(p.diretiva, { x: MARG_E + 20, largura: LARGURA }); });
  const reg = (d2.figurasDesenhadas || [])[0] || { medido: { textos: [] } };
  const t = (reg.medido.textos || []).map((x) => x.txt);
  conf('a altura CHUTADA pelo prototipo nao vira resposta no gabarito',
    t.indexOf('h') >= 0 && !t.filter((x) => x.indexOf('h =') === 0).length, t.join(' '));
}

console.log('\ndiagonal: continua e fina, e o valor conferido contra a conta');
{
  const m = achar('ret 4 3 5'), k = m.reg.escala;
  /* A diagonal liga dois vertices OPOSTOS: no retangulo 4 por 3 ela mede 5 e sai
   * com o comprimento de 5 unidades no papel. Ela sai em 0,9 pt continuo, um
   * degrau abaixo do contorno de 1,2; o corte de comprimento e o que a separa dos
   * lados dos quatro quadradinhos da classe, que saem na mesma espessura e medem
   * poucos pontos. */
  const diag = segs(m).filter((s) => Math.abs(s.w - 0.9) < 0.01 &&
    String(s.tracejado).indexOf('[]') === 0 && comp(s) > 20);
  medido(diag.length + ' linha(s) continua(s) de 0,9 pt; comprimento ' +
    n2c(diag.length ? comp(diag[0]) / k : 0) + ' unidades (Pitagoras: 5)');
  conf('a diagonal sai como UMA linha continua e fina, nunca tracejada', diag.length === 1);
  conf('e ela mede exatamente 5 unidades, que e o que Pitagoras da',
    diag.length === 1 && Math.abs(comp(diag[0]) / k - 5) < 0.02,
    diag.length ? n2c(comp(diag[0]) / k) : '(nenhuma)');
  conf('e ela liga dois vertices opostos do contorno', diag.length === 1 &&
    Math.abs(comp(diag[0]) / k - Math.sqrt(16 + 9)) < 0.02);
  conf('o rotulo d sai na folha', tem(m, 'd') === 1);
  conf('e a base 4 e a altura 3 tambem', tem(m, '4') === 1 && tem(m, '3') === 1);
  /* No retangulo a altura E o lado DA, que ja tem os quatro quadradinhos da
   * classe: um segmento tracejado por dentro seria uma segunda linha por cima do
   * lado esquerdo, e um quinto quadradinho num canto que ja tem o seu. */
  conf('no retangulo a altura sai como medida do lado, sem segmento tracejado a mais',
    altura(m).length === 0);
  conf('e a figura fica com quatro marcas (base, altura, diagonal e os quatro quadradinhos)',
    m.reg.marcasAtivas === 4, m.reg.marcasAtivas + ' marcas');
}
{
  const m = achar('ret b h d');
  medido('textos: ' + textos(m).map((t) => t.txt).join(' '));
  conf('o caso do MATEM3-12 desenha: b, h e d na folha',
    tem(m, 'b') === 1 && tem(m, 'h') === 1 && tem(m, 'd') === 1);
  conf('e ele NAO e fora de escala, porque o retangulo do prototipo e exato',
    m.reg.foraDeEscala === false);
  conf('sem nenhuma falha de conferencia', (m.reg.conferencia || []).length === 0,
    (m.reg.conferencia || []).join(' | '));
}
{
  /* A forma antiga da chave, byte a byte: diagonal=A;C sem valor e sem rotulo
   * continua sendo o corte que parte o quadrilatero em dois triangulos. */
  const m = achar('diagonal de sempre');
  const glosas = textos(m).map((t) => t.txt).filter((t) => t.indexOf('180') >= 0);
  conf('diagonal=A;C continua sem medida e sem letra', tem(m, 'd') === 0 && glosas.join(' | ') === 'soma 180 | soma 180');
  conf('e as duas regioes continuam glosadas, uma em cada metade', m.reg.marcasAtivas === 2,
    m.reg.marcasAtivas + ' marcas');
}

console.log('\nquadrilatero: a altura entre as duas bases paralelas');
{
  const m = achar('trapezio'), k = m.reg.escala;
  const alt = altura(m);
  medido('altura desenhada: ' + n2c(alt.length ? comp(alt[0]) / k : 0) + ' unidades (pedida 4)');
  conf('a altura do trapezio sai tracejada entre as duas bases', alt.length === 1);
  conf('e mede 4 unidades', alt.length === 1 && Math.abs(comp(alt[0]) / k - 4) < 0.02,
    alt.length ? n2c(comp(alt[0]) / k) : '(nenhuma)');
  conf('com o quadradinho no pe', marcasDe(m, 'anguloReto').length === 1);
  /* As duas bases saem com os comprimentos escritos, e a maior embaixo. */
  const horizontais = contorno(m).filter((s) => Math.abs(s.y1 - s.y2) < 0.05).sort((a, b) => comp(b) - comp(a));
  medido('bases horizontais: ' + horizontais.map((s) => n2c(comp(s) / k)).join(' e ') + ' unidades');
  conf('a base maior mede 10 e a menor 6', horizontais.length === 2 &&
    Math.abs(comp(horizontais[0]) / k - 10) < 0.02 && Math.abs(comp(horizontais[1]) / k - 6) < 0.02);
  conf('e a maior fica embaixo', horizontais.length === 2 && horizontais[0].y1 < horizontais[1].y1);
  conf('B, b e h chegam na folha', tem(m, 'B') === 1 && tem(m, 'b') === 1 && tem(m, 'h') === 1);
  conf('cinco marcas: as duas bases, a altura, o quadradinho e as setas de paralelismo',
    m.reg.marcasAtivas === 5, m.reg.marcasAtivas + ' marcas');
}
{
  const m = achar('paralelogramo'), k = m.reg.escala;
  const alt = altura(m);
  conf('o paralelogramo tem a altura entre as duas bases', alt.length === 1 &&
    Math.abs(comp(alt[0]) / k - 6) < 0.02, alt.length ? n2c(comp(alt[0]) / k) + ' unidades' : '(nenhuma)');
  conf('com o quadradinho no pe', marcasDe(m, 'anguloReto').length === 1);
  /* O lado de baixo do paralelogramo ja carrega a seta de paralelismo, entao a
   * medida da base sai em COTA e nao empilhada sobre a aresta. */
  const cotas = ((m.reg.tracos) || []).filter((t) => t && t.tipo === 'cota');
  medido(cotas.length + ' cota(s) na figura');
  conf('a base sai em cota, porque o lado ja carrega a seta de paralelismo', cotas.length === 1);
}
{
  const m = achar('paralelogramo obtuso');
  const pro = prolongamento(m);
  conf('no paralelogramo de 120 graus o pe cai fora e o lado sai prolongado', pro.length === 1);
  conf('e o quadradinho continua um so', marcasDe(m, 'anguloReto').length === 1);
}
{
  const m = achar('quadrado');
  conf('no quadrado a base sai em cota (os quatro lados ja levam tracinho)',
    ((m.reg.tracos) || []).filter((t) => t && t.tipo === 'cota').length === 1);
  conf('e o L chega na folha uma vez so', tem(m, 'L') === 1);
}
{
  const m = achar('tri base girada'), k = m.reg.escala;
  const alt = altura(m);
  conf('a figura girada mantem a altura em 6 unidades', alt.length === 1 &&
    Math.abs(comp(alt[0]) / k - 6) < 0.02, alt.length ? n2c(comp(alt[0]) / k) : '(nenhuma)');
  conf('e o quadradinho continua no pe', marcasDe(m, 'anguloReto').length === 1 &&
    Math.min(dist({ x: alt[0].x1, y: alt[0].y1 }, marcasDe(m, 'anguloReto')[0]),
             dist({ x: alt[0].x2, y: alt[0].y2 }, marcasDe(m, 'anguloReto')[0])) < 0.05);
}

console.log('\nas recusas: o que a receita se nega a desenhar, cada uma com o par limpo ao lado');
function comAviso(texto, pedaco) {
  const d = new PDFGen.Doc();
  d.novaPagina();
  d.partesDeFigura(texto).forEach(function (p) {
    if (p.tipo === 'figura') d.figura(p.diretiva, { x: MARG_E + 20, largura: LARGURA });
  });
  return (d.avisosFigura || []).filter((a) => a.indexOf(pedaco) >= 0).length;
}
conf('Pitagoras que nao fecha e recusado (d = 12 num retangulo de 4 por 3)',
  comAviso('@fig quadrilatero tipo=retangulo base=4 altura=3 diagonal=A;C;12;d',
    'mede 5 e nao 12') === 1);
conf('e o mesmo retangulo com d = 5 passa',
  comAviso('@fig quadrilatero tipo=retangulo base=4 altura=3 diagonal=A;C;5;d', 'quadrilatero:') === 0);
conf('base= tres vezes num quadrilatero e recusada',
  comAviso('@fig quadrilatero tipo=trapezio base=10 base=6 base=4', 'e cabem 2 nesta figura') === 1);
conf('e o trapezio com as duas bases passa',
  comAviso('@fig quadrilatero tipo=trapezio base=10;B base=6;b altura=4;h', 'quadrilatero:') === 0);
conf('base= duas vezes num triangulo e recusada',
  comAviso('@fig triangulo base=10 base=6', 'e cabem 1 nesta figura') === 1);
conf('e o triangulo com uma base passa', comAviso('@fig triangulo base=10 altura=6', 'triangulo:') === 0);
conf('base= duas vezes fora do trapezio e recusada, porque so o trapezio tem duas bases',
  comAviso('@fig quadrilatero tipo=retangulo base=10 base=6', 'so o trapezio tem duas bases') === 1);
conf('altura= num vertice que nao existe e recusada',
  comAviso('@fig triangulo base=10 altura=6;h;Z', 'nao e um dos vertices') === 1);
conf('e altura=6;h;B, num vertice que existe, passa',
  comAviso('@fig triangulo base=10 altura=6;h;B', 'triangulo:') === 0);
conf('altura=h;B e recusada por ambigua (rotulo ou vertice)',
  comAviso('@fig triangulo lado=4 lado=6 lado=9 altura=h;B ' + FIEL, 'e ambigua') === 1);
conf('e altura=h;h;B, que diz as duas coisas, passa',
  comAviso('@fig triangulo lado=4 lado=6 lado=9 altura=h;h;B ' + FIEL, 'triangulo:') === 0);
conf('diagonal entre vertices vizinhos e recusada, porque e um lado e nao uma diagonal',
  comAviso('@fig quadrilatero tipo=retangulo base=4 altura=3 diagonal=A;B;d', 'liga dois vertices VIZINHOS') === 1);
conf('e a diagonal entre vertices opostos passa',
  comAviso('@fig quadrilatero tipo=retangulo base=4 altura=3 diagonal=A;C;d', 'quadrilatero:') === 0);
conf('base=10 com lado=7 que se contradizem e recusada, com os dois valores no aviso',
  comAviso('@fig triangulo base=10 lado=7', 'os lados 7 e 10 nao saem nessa proporcao') === 1);
conf('e o triangulo so com a base passa', comAviso('@fig triangulo base=10', 'triangulo:') === 0);
conf('base e altura que contradizem os angulos sao recusadas',
  comAviso('@fig triangulo angulo=50 angulo=60 base=10 altura=9 ' + FIEL,
    'nao saem nessa proporcao no desenho') === 1);
conf('e com a altura que os angulos dao (7,06 para uma base de 10) passa',
  comAviso('@fig triangulo angulo=50 angulo=60 base=10 altura=7.06 ' + FIEL, 'triangulo:') === 0);
/* O triangulo deduzido dos TRES lados nao carrega altura ate o gabarito: la o
 * desenharAngulos acrescenta os tres angulos que os lados determinam, e com a
 * base, a altura e o quadradinho a figura passa de cinco marcas. E a combinacao
 * que o autor de tema vai tentar, e ele precisa ver isso antes de imprimir. */
conf('o 3, 4, 5 com altura passa no enunciado',
  comAviso('@fig triangulo lado=3 lado=4 lado=5 altura=h ' + FIEL, 'marcas ativas') === 0);
conf('e estoura o teto no gabarito, porque la os tres angulos deduzidos entram junto',
  comAviso('@fig triangulo lado=3 lado=4 lado=5 altura=h ' + FIEL + ' fase=gabarito',
    'marcas ativas: 8') === 1);
conf('altura= num quadrilatero irregular e recusada, porque ele nao tem bases paralelas',
  comAviso('@fig quadrilatero tipo=quadrilatero base=10 altura=4', 'pede um tipo com par de lados paralelos') === 1);
conf('e a mesma altura num trapezio passa',
  comAviso('@fig quadrilatero tipo=trapezio base=10 altura=4', 'quadrilatero:') === 0);
conf('altura=4 com base=6 num quadrado e recusada, porque ali os dois sao o mesmo lado',
  comAviso('@fig quadrilatero tipo=quadrado base=6 altura=4', 'no quadrado os dois sao o mesmo lado') === 1);
conf('e o quadrado com base=6 altura=6 passa',
  comAviso('@fig quadrilatero tipo=quadrado base=6 altura=6', 'quadrilatero:') === 0);
conf('altura maior que o lado do losango e recusada',
  comAviso('@fig quadrilatero tipo=losango base=6 altura=9', 'nao cabe num losango') === 1);
conf('e a altura de 5 num losango de lado 6 passa',
  comAviso('@fig quadrilatero tipo=losango base=6 altura=5', 'quadrilatero:') === 0);
conf('as duas bases do trapezio com a menor primeiro sao recusadas',
  comAviso('@fig quadrilatero tipo=trapezio base=6;b base=10;B altura=4', 'com a MAIOR primeiro') === 1);
conf('e com a maior primeiro passa',
  comAviso('@fig quadrilatero tipo=trapezio base=10;B base=6;b altura=4', 'quadrilatero:') === 0);
/* O teto de cinco marcas e a combinacao que o autor de tema vai tentar primeiro:
 * base, altura, quadradinho e as tres letras de vertice somam seis. */
conf('a figura que estoura o teto de cinco marcas e recusada pelo conferirFigura',
  comAviso('@fig triangulo base=10;b altura=6;h vertices=A;B;C', 'marcas ativas: 6') === 1);
conf('e a mesma figura sem as letras de vertice passa',
  comAviso('@fig triangulo base=10;b altura=6;h', 'marcas ativas') === 0);

console.log('\nescala: as tres saidas da regra, cada uma com o par ao lado');
conf('so letra: base=b altura=h nao pede legenda de escala',
  comAviso('@fig triangulo base=b altura=h', 'fora de escala sem legenda') === 0);
conf('so numero: base=10 altura=6 tambem nao',
  comAviso('@fig triangulo base=10 altura=6', 'fora de escala sem legenda') === 0);
conf('mistura: base=10 altura=h E fora de escala e cobra a legenda',
  comAviso('@fig triangulo base=10 altura=h', 'fora de escala sem legenda') === 1);
conf('e com a legenda escrita no tema ela passa',
  comAviso('@fig triangulo base=10 altura=h legenda=Figura fora de escala.', 'fora de escala') === 0);
conf('o rotulo NAO conta como letra: base=10;b altura=6;h continua fiel',
  comAviso('@fig triangulo base=10;b altura=6;h', 'fora de escala') === 0);
conf('e o rotulo da diagonal tambem nao: base=4 altura=3 diagonal=A;C;d continua fiel',
  comAviso('@fig quadrilatero tipo=retangulo base=4 altura=3 diagonal=A;C;d', 'fora de escala') === 0);

console.log('\nlingua: nenhuma palavra nasce dentro das receitas');
{
  const d = new PDFGen.Doc();
  d.novaPagina();
  ['@fig triangulo base=10 altura=6', '@fig triangulo base=base altura=height',
   '@fig quadrilatero tipo=retangulo base=b altura=h diagonal=A;C;d',
   '@fig quadrilatero tipo=trapezio base=10;B base=6;b altura=4;h'].forEach(function (t) {
    d.partesDeFigura(t).forEach(function (p) { if (p.tipo === 'figura') d.figura(p.diretiva, { x: MARG_E + 20, largura: LARGURA }); });
  });
  const nascidas = (d.avisosFigura || []).filter((a) => a.indexOf('nao veio do tema') >= 0);
  conf('nenhum texto impresso que nao veio da diretiva', nascidas.length === 0, nascidas.join(' | '));
}

console.log('\na folha inteira');
const avisos = doc.avisosFigura || [];
conf('todas as ' + CASOS.length + ' diretivas foram desenhadas',
  (doc.figurasDesenhadas || []).length === CASOS.length, (doc.figurasDesenhadas || []).length + ' figuras');
conf('nenhuma passa do teto de cinco marcas', (doc.figurasDesenhadas || []).every((r) => r.marcasAtivas <= 5),
  'marcas por figura: ' + (doc.figurasDesenhadas || []).map((r) => r.marcasAtivas).join(' '));
conf('nenhum aviso de figura na folha inteira', avisos.length === 0);
for (const a of avisos) console.log('  aviso . ' + a);
for (const m of medidas) {
  if (m.reg && (m.reg.conferencia || []).length) {
    for (const f of m.reg.conferencia) console.log('  acusa   ' + m.caso.nome + ': ' + f);
  }
}
/* Nada abaixo do piso: 7,5 pt de corpo e 0,6 pt de traco, que e o que a folha
 * fotocopiada ainda entrega. */
{
  let piorCorpo = Infinity, piorTraco = Infinity;
  for (const m of medidas) {
    for (const t of textos(m)) piorCorpo = Math.min(piorCorpo, t.tam);
    for (const s of segs(m)) if (!s.varredura && comp(s) > 0.05) piorTraco = Math.min(piorTraco, s.w);
  }
  medido('menor corpo ' + n2c(piorCorpo) + ' pt, menor traco ' + n2c(piorTraco) + ' pt');
  conf('nenhum texto abaixo de 7,5 pt', piorCorpo >= 7.5 - 1e-6, n2c(piorCorpo) + ' pt');
  conf('nenhum traco abaixo de 0,6 pt', piorTraco >= 0.6 - 1e-6, n2c(piorTraco) + ' pt');
}
/* Estado grafico: nenhum q sem Q, nenhum tracejado nem recorte fora de envelope.
 * A altura acende tracejado no meio do desenho, e um tracejado que vaza deixa o
 * texto da folha seguinte pontilhado em silencio. */
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
