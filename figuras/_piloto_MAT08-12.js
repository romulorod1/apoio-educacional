/* figuras/_piloto_MAT08-12.js
 * Gera os documentos do MAT08-12, "Congruencia de triangulos", pelo caminho de
 * verdade: o gerarMaterialTema do pdf.js, lendo o tema do banco.
 *
 * Tudo o que e generico (a abertura do tema, o placar, os leitores de folha e as
 * travas 0 a 8) mora no _piloto_base.js. Aqui ficam so tres coisas: o ID, os
 * numeros editoriais deste tema e a medicao no fluxo da familia do painel, do
 * triangulo com ceviana e do quadrilatero com diagonal.
 *
 * Uso: node _piloto_MAT08-12.js [caminho de outro banco.json ou do retrato]
 *
 * Regra da casa: nunca usar travessao.
 */
const P = require('./_piloto_base.js');

const ID = 'MAT08-12';
const ctx = P.abrir({ id: ID, caminhoDoMd: 'temas/mat/08/' + ID + '.md' });

const conf = P.conf, medido = P.medido;
const textos = P.textos, tem = P.tem;
const dist = P.dist, n2 = P.n2, n4 = P.n4;
const porId = ctx.porId, explic = ctx.explic;
const docPT = ctx.docPT, docEN = ctx.docEN;

/* ================================================================ travas genericas
 *
 * Escolha editorial escrita: 2 na explicacao, 3 nos 20 enunciados, 0 no gabarito.
 *
 * ESTE TEMA ESTAVA NA LISTA (b) DO _varredura_banco.js, e o motivo esta no
 * roteiro da explicacao: "1. Identifique os dois triangulos que aparecem na
 * figura". O tema ensinava a olhar uma figura e nao desenhava nenhuma, nem na
 * explicacao nem em nenhum dos vinte exercicios. As cinco figuras deste lote
 * fecham exatamente isso: em cada uma delas ha DOIS triangulos para identificar,
 * e o roteiro passa a ter instancia.
 *
 * A regra que manda em todas elas e a da serie: nos anos finais a igualdade se
 * MARCA e nao se escreve. O painel do "o que significa congruente" nao tem
 * numero nenhum: os lados que se correspondem levam um, dois e tres tracinhos
 * nos DOIS triangulos, e e disso que a correspondencia A com D, B com E, C com F
 * se le. Escrever a medida ali resolveria o exercicio no lugar de quem o faz.
 *
 * Nos enunciados, os tres lugares em que os dois triangulos so existiam em
 * prosa: o 7 (a mediana do isosceles de 8, 8 e 5), o 10 (a diagonal AC do
 * quadrilatero ABCD) e o 17 (a bissetriz do isosceles de 10, 10 e 12). Nos tres
 * a figura traz a CONFIGURACAO e nao a resposta: nenhuma delas marca qual caso
 * de congruencia e, nem escreve o valor que o item pede (o AM do 17 fica sem
 * rotulo nenhum).
 *
 * O 10 sai com marcas=nao de proposito. O enunciado da AB = CD e AD = BC, e a
 * figura que trouxesse as setas de paralelismo estaria afirmando uma CONCLUSAO
 * que o item nao pediu, correta e fora de lugar. O contorno continua sendo o de
 * um paralelogramo porque e isso que a hipotese descreve; o que nao entra e a
 * marca que a afirma.
 *
 * Dezessete dos vinte ficam sem figura nenhuma, muito acima do terco. O 16 ficou
 * de fora ainda que peca a mesma construcao do 17: a figura do 17 ja mostra a
 * bissetriz do isosceles e repeti-la duas questoes antes gastaria meia folha
 * para nao dizer nada novo. O 18 e o 20 ficaram de fora por falta de kit, e nao
 * por escolha (ver o relatorio do lote): dois segmentos que se cortam num ponto
 * medio e um ponto sobre a bissetriz de um angulo com duas perpendiculares nao
 * sao construiveis por nenhuma receita de hoje.
 *
 * O gabarito nao tem figura nenhuma: nenhuma resposta deste tema E uma
 * construcao. Todas nomeiam um caso ou concluem uma igualdade, e sao argumento
 * escrito, nao desenho. */
P.travasGenericas(ctx, {
  /* As palavras deste tema que so existem em portugues. O painel imprime ABC e
   * DEF, que sao neutros e saem iguais nas duas folhas. */
  palavrasPt: ['congruent[ea]', 'triângulo', 'mediana', 'bissetriz', 'quadrilátero',
    'ângulo', 'lado', 'ponto médio'],
  diretivasNaExplicacao: { n: 2, rotulo: 'a explicacao tem 2 figuras' },
  enunciadosComFigura: {
    n: '7 10 17',
    rotulo: 'os enunciados 7, 10 e 17 carregam figura, e so eles'
  },
  registrosNoMaterial: {
    n: 6,
    rotulo: 'o material desenha 6 registros: 1 figura mais as 2 celulas do painel na explicacao, e 3 nos enunciados'
  },
  figurasNoGabarito: { n: 0, rotulo: 'e o gabarito nao tem nenhuma' },
  idsDoGabarito: { n: '', rotulo: 'e portanto nenhum id de gabarito' },
  /* Nenhuma figura deste tema e chute: as tres numericas saem dos tres lados, o
   * isosceles em letra sai da proporcao dos simbolos e o quadrilatero sai do
   * prototipo, que e exato por construcao. */
  figurasForaDeEscala: { n: 'nenhuma', rotulo: 'nenhuma figura marcada fora de escala: todas saem exatas' }
});

/* ================================================================ medicao no fluxo */

console.log('\nmedicao no fluxo');

function ladosDe(f) {
  return ((f && f.medido && f.medido.segmentos) || [])
    .filter(function (s) { return !s.varredura && Math.abs(s.w - 1.2) < 0.05; })
    .map(function (s) { return Math.hypot(s.x2 - s.x1, s.y2 - s.y1); });
}

/* Os vertices do contorno, na ordem em que o caminho os visita. */
function verticesDe(f) {
  const segs = ((f && f.medido && f.medido.segmentos) || [])
    .filter(function (s) { return !s.varredura && Math.abs(s.w - 1.2) < 0.05; });
  const pts = [];
  segs.forEach(function (s) {
    [{ x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 }].forEach(function (p) {
      if (!pts.some(function (q) { return dist(p, q) < 0.5; })) pts.push(p);
    });
  });
  return pts;
}

/* A ceviana: o segmento de 0,9 pt que sai de um vertice e morre num ponto do
 * lado oposto. E o unico traco desse peso nestas figuras. */
function cevianaDe(f) {
  return ((f && f.medido && f.medido.segmentos) || [])
    .filter(function (s) { return !s.varredura && Math.abs(s.w - 0.9) < 0.05; });
}

/* Onde a ceviana toca o lado oposto ao vertice de onde ela parte, e quanto isso
 * dista do MEIO desse lado. E a conferencia de "a figura marca o elemento certo"
 * neste tema: mediana cai no meio, bissetriz nao. */
function peDaCeviana(f) {
  const pts = verticesDe(f);
  const c = cevianaDe(f)[0];
  if (!c || pts.length !== 3) return null;
  const A = { x: c.x1, y: c.y1 }, B = { x: c.x2, y: c.y2 };
  /* Qual extremidade e o vertice de partida: a que coincide com um vertice. */
  let vertice = null, pe = null;
  pts.forEach(function (p) {
    if (dist(p, A) < 0.5) { vertice = p; pe = B; }
    else if (dist(p, B) < 0.5) { vertice = p; pe = A; }
  });
  if (!vertice) return null;
  const outros = pts.filter(function (p) { return dist(p, vertice) > 0.5; });
  const meio = { x: (outros[0].x + outros[1].x) / 2, y: (outros[0].y + outros[1].y) / 2 };
  const L = dist(outros[0], outros[1]);
  return {
    vertice: vertice, pe: pe, meio: meio, ladoOposto: L,
    doMeio: dist(pe, meio),
    /* a razao em que o pe divide o lado oposto, a partir de outros[0] */
    razao: dist(pe, outros[0]) / L,
    ate0: dist(outros[0], vertice), ate1: dist(outros[1], vertice)
  };
}

console.log('\nexplicacao: o painel dos dois triangulos congruentes');
{
  const celulas = (docPT.figurasDesenhadas || []).filter(function (f) { return f.receita === 'painel'; });
  conf('o painel tem duas celulas', celulas.length, 2);
  const A = celulas[0], B = celulas[1];
  const lA = ladosDe(A).map(function (v) { return Math.round(v * 100) / 100; }).sort();
  const lB = ladosDe(B).map(function (v) { return Math.round(v * 100) / 100; }).sort();
  medido('celula ABC: lados ' + lA.join(' ') + ' pt; celula DEF: lados ' + lB.join(' ') + ' pt');
  conf('os dois triangulos saem com os tres lados iguais, que e o que congruente quer dizer',
    lA.join(' '), lB.join(' '));
  conf('e eles sao escalenos: os tres lados diferem entre si', new Set(lA).size, 3);
  const marcasA = (A.marcas || []).filter(function (m) { return m.tipo === 'congruencia'; });
  const marcasB = (B.marcas || []).filter(function (m) { return m.tipo === 'congruencia'; });
  medido('tracinhos por celula: ABC ' + marcasA.map(function (m) { return m.n; }).join(',') +
    '  DEF ' + marcasB.map(function (m) { return m.n; }).join(','));
  conf('cada celula leva TRES grupos de tracinho, um, dois e tres', marcasA.length === 3 && marcasB.length === 3, true);
  conf('e os dois triangulos usam os mesmos tres numeros de tracinho, que e como a correspondencia se le',
    marcasA.map(function (m) { return m.n; }).sort().join(',') === marcasB.map(function (m) { return m.n; }).sort().join(',') &&
    marcasA.map(function (m) { return m.n; }).sort().join(',') === '1,2,3', true);
  conf('nenhuma medida escrita: a figura so imprime os dois nomes',
    textos(A).concat(textos(B)).join(' '), 'ABC DEF');
  const celulasEN = (docEN.figurasDesenhadas || []).filter(function (f) { return f.receita === 'painel'; });
  conf('e a folha inglesa imprime os mesmos dois nomes, que sao neutros',
    celulasEN.reduce(function (o, c) { return o.concat(textos(c)); }, []).join(' '), 'ABC DEF');
  /* Par envenenado da medida: um par de triangulos que NAO e congruente sai com
   * lados diferentes, e a mesma conta tem que dizer isso. */
  const outro = P.rascunho('@fig painel celula=lados;9;8;6 celula=lados;9;8;7 nome=ABC nome=DEF colunas=2').figs;
  const dif = ladosDe(outro[0]).map(function (v) { return Math.round(v * 100) / 100; }).sort().join(' ') !==
    ladosDe(outro[1]).map(function (v) { return Math.round(v * 100) / 100; }).sort().join(' ');
  medido('par envenenado, 9;8;6 contra 9;8;7: os conjuntos de lados batem? ' + (dif ? 'nao' : 'sim'));
  conf('a mesma conta separa um par que nao e congruente', dif, true);
}

console.log('\nexplicacao: o isosceles partido pela mediana');
{
  const f = explic('triangulo')[0];
  const c = peDaCeviana(f);
  const L = ladosDe(f).map(function (v) { return Math.round(v * 100) / 100; });
  medido('lados ' + L.join(' ') + ' pt; ceviana de ' + n2(dist(c.vertice, c.pe)) +
    ' pt, com o pe a ' + n4(c.doMeio) + ' pt do meio do lado oposto');
  conf('a figura sai isosceles: dois lados iguais e o terceiro diferente', new Set(L).size, 2);
  conf('a mediana cai no MEIO do lado oposto, e nao num ponto qualquer dele', c.doMeio < 0.02, true);
  conf('e ela parte do vertice entre os dois lados iguais, que e o A do texto',
    Math.abs(c.ate0 - c.ate1) < 0.02, true);
  conf('a figura escreve a, b e b, os simbolos do proprio enunciado do exemplo',
    textos(f).sort().join(' '), ['a', 'b', 'b'].sort().join(' '));
  conf('e nenhum numero: neste tema a hipotese e marca e simbolo, nao medida',
    textos(f).filter(function (t) { return /\d/.test(t); }).length, 0);
}

console.log('\nexercicio 7: a mediana do isosceles de 8, 8 e 5');
{
  const f = porId.t7;
  const c = peDaCeviana(f);
  const L = ladosDe(f);
  const k = Math.max.apply(null, L) / 8;
  medido('lados na folha ' + L.map(n2).join(' ') + ' pt; em centimetros ' +
    L.map(function (v) { return n2(v / k); }).join(' ') +
    '; pe da mediana a ' + n4(c.doMeio) + ' pt do meio');
  conf('os tres lados desenhados sao 8, 8 e 5 centimetros',
    L.map(function (v) { return Math.round(v / k); }).sort().join(' '), '5 8 8');
  conf('a mediana cai no meio do lado oposto', c.doMeio < 0.02, true);
  conf('e o lado que ela corta e o de 5, que e o que o enunciado manda',
    Math.abs(c.ladoOposto / k - 5) < 0.05, true);
  conf('a figura imprime 5, 8 e 8, e mais nada: o caso de congruencia nao esta la',
    textos(f).sort().join(' '), ['5', '8', '8'].sort().join(' '));
  /* Par envenenado da medida: com a mediana saindo de B ela corta o lado de 8 e
   * nao o de 5, e a mesma conta tem que ver a diferenca. Uma figura assim estaria
   * correta e responderia a outra pergunta, que e o defeito que nenhuma trava
   * pega. */
  const errada = P.rascunho('@fig triangulo id=v1 lado=8 lado=8 lado=5 ceviana=mediana;A').figs[0];
  const ce = peDaCeviana(errada);
  const Le = ladosDe(errada);
  const ke = Math.max.apply(null, Le) / 8;
  medido('par envenenado, mediana saindo de A: ela corta o lado de ' + n2(ce.ladoOposto / ke) + ' cm');
  conf('a mesma conta ve que a mediana de A corta o lado errado', Math.abs(ce.ladoOposto / ke - 5) > 1, true);
}

console.log('\nexercicio 10: o quadrilatero ABCD com a diagonal AC');
{
  const f = porId.q10;
  const pts = verticesDe(f);
  const diag = cevianaDe(f);
  conf('o contorno tem quatro lados', ladosDe(f).length, 4);
  conf('e ha exatamente um traco de 0,9 pt dentro dele, que e a diagonal', diag.length, 1);
  const A = ((f.medido || {}).textos || []).find(function (t) { return t.txt === 'A'; });
  const C = ((f.medido || {}).textos || []).find(function (t) { return t.txt === 'C'; });
  const d = diag[0];
  const p1 = { x: d.x1, y: d.y1 }, p2 = { x: d.x2, y: d.y2 };
  const cA = { x: A.x + (A.largura || 0) / 2, y: A.y }, cC = { x: C.x + (C.largura || 0) / 2, y: C.y };
  const casaAC = Math.min(dist(p1, cA) + dist(p2, cC), dist(p2, cA) + dist(p1, cC));
  const casaOutro = Math.min(dist(p1, cA), dist(p2, cA)) +
    Math.min(dist(p1, cC), dist(p2, cC));
  medido('diagonal de (' + n2(p1.x) + ',' + n2(p1.y) + ') a (' + n2(p2.x) + ',' + n2(p2.y) +
    '); A em (' + n2(cA.x) + ',' + n2(cA.y) + '), C em (' + n2(cC.x) + ',' + n2(cC.y) +
    '); soma das duas distancias ' + n2(casaAC) + ' pt');
  conf('as duas pontas da diagonal sao os vertices A e C, e nao um par vizinho',
    casaAC < 60 && Math.abs(casaAC - casaOutro) < 0.01, true);
  /* Os dois vertices que a diagonal NAO toca sao B e D, e o par de triangulos
   * que ela cria e ABC e CDA, que e o que o enunciado nomeia. */
  const B = ((f.medido || {}).textos || []).find(function (t) { return t.txt === 'B'; });
  const D = ((f.medido || {}).textos || []).find(function (t) { return t.txt === 'D'; });
  const cB = { x: B.x + (B.largura || 0) / 2, y: B.y }, cD = { x: D.x + (D.largura || 0) / 2, y: D.y };
  const ladoDe = function (p) { return (p2.x - p1.x) * (p.y - p1.y) - (p2.y - p1.y) * (p.x - p1.x); };
  medido('B e D caem em lados opostos da diagonal? sinais ' +
    (ladoDe(cB) > 0 ? '+' : '-') + ' e ' + (ladoDe(cD) > 0 ? '+' : '-'));
  conf('B e D ficam em lados opostos da diagonal: sao dois triangulos e nao um',
    ladoDe(cB) * ladoDe(cD) < 0, true);
  conf('a figura imprime so as quatro letras de vertice, sem medida nenhuma',
    textos(f).sort().join(' '), 'A B C D');
  conf('e sem a seta de paralelismo, que seria a conclusao e nao a hipotese',
    (f.marcas || []).filter(function (m) { return m.tipo === 'paralelismo'; }).length, 0);
  /* Par envenenado: o mesmo quadrilatero SEM marcas=nao traz a seta, e a mesma
   * conta tem que ve-la. */
  const comSeta = P.rascunho('@fig quadrilatero id=v2 tipo=paralelogramo diagonal=A;C vertices=A;B;C;D').figs[0];
  conf('a mesma conta ve a seta quando ela existe',
    (comSeta.marcas || []).filter(function (m) { return m.tipo === 'paralelismo'; }).length, 1);
}

console.log('\nexercicio 17: a bissetriz do isosceles de 10, 10 e 12');
{
  const f = porId.t17;
  const c = peDaCeviana(f);
  const L = ladosDe(f);
  const k = Math.max.apply(null, L) / 12;
  medido('lados na folha ' + L.map(n2).join(' ') + ' pt; em centimetros ' +
    L.map(function (v) { return n2(v / k); }).join(' ') +
    '; pe da bissetriz a ' + n4(c.doMeio) + ' pt do meio, razao ' + n4(c.razao));
  conf('os tres lados desenhados sao 10, 10 e 12 centimetros',
    L.map(function (v) { return Math.round(v / k); }).sort().join(' '), '10 10 12');
  conf('a bissetriz sai do vertice entre os dois lados de 10, que e o A do texto',
    Math.abs(c.ate0 - c.ate1) < 0.05, true);
  conf('e no isosceles ela cai no meio do lado de 12, que e a propria conclusao do item', c.doMeio < 0.05, true);
  const am = dist(c.vertice, c.pe) / k;
  medido('AM desenhado mede ' + n4(am) + ' centimetros (a resposta do item e 8)');
  conf('o AM desenhado mede 8 centimetros de verdade, e a figura nao o escreve',
    Math.abs(am - 8) < 0.02 && P.tem(f, '8') === 0, true);
  conf('a figura imprime 12, 10 e 10, e nada mais',
    textos(f).sort().join(' '), ['12', '10', '10'].sort().join(' '));
}

/* ================================================================ pares envenenados */
console.log('\npares envenenados com o texto deste tema');
{
  const veneno = P.clonar(ctx.tema);
  const ex7 = veneno.pt.exercicios.find(function (e) { return e.n === 7; });
  ex7.enunciado = ex7.enunciado.replace('e a figura mostra a mediana', 'e traca-se a mediana');
  const ex1 = veneno.en.exercicios.find(function (e) { return e.n === 1; });
  ex1.enunciado = 'The two triangles in the figure are congruent. Find the perimeter of each one.';
  conf('par envenenado: o 7 sem "figura" e o 1 falando de figura sem ter sao acusados',
    P.semRemissao(veneno).join('; '),
    'pt 7 tem figura e nao remete a ela; en 1 fala da figura e nao tem nenhuma');
}
{
  const veneno = P.clonar(ctx.tema);
  const ex17 = veneno.pt.exercicios.find(function (e) { return e.n === 17; });
  ex17.enunciado = ex17.enunciado.replace('BC = 12 centímetros', 'BC conhecido');
  conf('par envenenado: tirado o 12 do texto do 17, a figura que imprime 12 e acusada',
    P.numeroSoNoDesenho(veneno, 'pt', docPT.figurasDesenhadas || []).join('; '),
    'pt 17: a figura imprime 12 e o texto nao traz');
}

const saida = P.placar();
P.avisos(ctx);
process.exit(saida);
