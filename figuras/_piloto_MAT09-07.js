/* figuras/_piloto_MAT09-07.js
 * Gera os documentos do MAT09-07, "Teorema de Pitagoras", pelo caminho de
 * verdade: o gerarMaterialTema do pdf.js, lendo o tema do banco.
 *
 * Tudo o que e generico (a abertura do tema, o placar, os leitores de folha e as
 * travas 0 a 8) mora no _piloto_base.js. Aqui ficam so tres coisas: o ID, os
 * numeros editoriais deste tema e a medicao no fluxo da familia do triangulo e
 * do quadrilatero.
 *
 * Uso: node _piloto_MAT09-07.js [caminho de outro banco.json ou do retrato]
 *
 * Regra da casa: nunca usar travessao.
 */
const P = require('./_piloto_base.js');

const ID = 'MAT09-07';
const ctx = P.abrir({ id: ID, caminhoDoMd: 'temas/mat/09/' + ID + '.md' });

const conf = P.conf, medido = P.medido;
const textos = P.textos, tem = P.tem, quadradinhos = P.quadradinhos;
const dist = P.dist, n2 = P.n2, n4 = P.n4;
const porId = ctx.porId, gabPorId = ctx.gabPorId, explic = ctx.explic;
const docPT = ctx.docPT, docEN = ctx.docEN;

/* ================================================================ travas genericas
 *
 * Escolha editorial escrita: 3 na explicacao, 2 nos 18 enunciados, 1 no
 * gabarito.
 *
 * Na explicacao, as tres figuras sao as tres frases que descreviam um desenho.
 * "O lado oposto ao angulo reto se chama hipotenusa e e sempre o maior dos
 * tres" e uma definicao POSICIONAL: a figura poe o quadradinho no vertice reto
 * e o a no lado que fica em frente a ele, que e a unica maneira de ler quem e a
 * hipotenusa sem medir. Depois, "a diagonal divide o retangulo em dois
 * triangulos retangulos" e "a altura divide o triangulo equilatero em dois
 * triangulos retangulos, com a base partida ao meio" sao as duas decomposicoes
 * que o texto contava em palavras e que o desenho mostra de uma vez.
 *
 * As tres saem em LETRA, e isso e decisao e nao economia. Os numeros dos
 * exemplos (9 por 12 no retangulo, lado 10 no equilatero) sao exatamente os
 * dados dos exercicios 5 e 7: uma figura de explicacao com o 9, o 12 e o 15
 * dentro entregaria o exercicio 5 inteiro, e uma com o 10 entregaria o meio
 * lado 5, que e o passo que o exercicio 7 existe para cobrar.
 *
 * Nos enunciados, os dois em que a configuracao NAO cabe numa oracao, porque o
 * triangulo retangulo que resolve a questao esta escondido dentro de outra
 * figura: o 9 (a diagonal do retangulo, que e a hipotenusa dos dois lados) e o
 * 10 (o lado do losango, que e a hipotenusa das METADES das duas diagonais).
 * Nos dois, o que se PERGUNTA sai em letra e o que o enunciado DA sai em
 * numero: no 9 a diagonal e 26 e o lado dado e 10, e o outro lado e h; no 10 as
 * diagonais sao 16 e 30 e o lado e L.
 *
 * Dezesseis dos dezoito ficam sem figura nenhuma, muito acima do terco. O 11
 * (o triangulo 6, 7 e 10 e retangulo?) ficou de fora de proposito e e o caso
 * mais perigoso do tema: desenhado fiel, o angulo maior sai com 100,6 graus e
 * quem olha ja responde "obtuso" sem fazer conta nenhuma, que e exatamente o
 * que a questao cobra. O 7 e o 5 ficaram de fora porque a figura da explicacao
 * ja mostra a mesma decomposicao em letras. O 8 e o 12 (escada e poste) cabem
 * numa oracao cada um e sao o treino de traduzir texto em desenho.
 *
 * No gabarito, so o 9. A resposta dele E lida na propria figura: o outro lado
 * do retangulo sai da diagonal, e a camada de gabarito escreve "h = 24" em teal
 * sobre o mesmo desenho. O 10 ficou de fora por LIMITE DO KIT e nao por
 * escolha: a camada de gabarito do losango acrescenta os quatro valores de
 * angulo que os dados determinam, sao quatro marcas de uma vez, e a receita
 * recusa a figura por estouro do teto. Esta escrito na especificacao. */
P.travasGenericas(ctx, {
  /* As palavras deste tema que so existem em portugues, mais a legenda de
   * escala, que a figura imprime pelo parametro da diretiva. */
  /* "diagonal" fica de fora de proposito: e a mesma palavra nas duas linguas, e
   * a trava A acusaria a folha inglesa por uma palavra que ela pode escrever. */
  palavrasPt: ['hipotenusa', 'cateto', 'escala', 'losango', 'retângulo',
    'quadrado', 'altura', 'equilátero', 'trapézio'],
  diretivasNaExplicacao: { n: 3, rotulo: 'a explicacao tem 3 figuras' },
  enunciadosComFigura: {
    n: '9 10',
    rotulo: 'os enunciados 9 e 10 carregam figura, e so eles'
  },
  registrosNoMaterial: { n: 5, rotulo: 'o material desenha 5 registros: 3 na explicacao e 2 nos enunciados' },
  figurasNoGabarito: { n: 1, rotulo: 'e o gabarito tem 1 (o 9)' },
  idsDoGabarito: { n: 'r9', rotulo: 'e o id do gabarito e o r9' },
  /* Uma so fora de escala, e ela E fora de escala de verdade: um angulo reto
   * mais tres lados em letra descreve QUALQUER triangulo retangulo, e o desenho
   * escolhe um. As outras quatro saem exatas por construcao. Duas ocorrencias
   * porque a conta varre as quatro folhas e o triangulo de a, b e c e desenhado
   * uma vez na folha portuguesa e uma vez na inglesa. */
  figurasForaDeEscala: {
    n: 'triangulo, triangulo',
    rotulo: 'so o triangulo generico de a, b e c sai marcado fora de escala, uma vez em cada lingua'
  }
});

/* ================================================================ medicao no fluxo
 * O que a folha AFIRMA com o desenho, medido no que vai sair impresso. */

console.log('\nmedicao no fluxo');

/* Os tres lados de contorno de um triangulo, com o comprimento de cada um e o
 * angulo interno de cada vertice, lidos nos segmentos de 1,2 pt do fluxo. E a
 * unica conferencia possivel de "a figura marca o elemento certo": o rotulo tem
 * que estar no lado que o enunciado descreve, e nao num vizinho dele. */
function trianguloDe(f) {
  const segs = ((f && f.medido && f.medido.segmentos) || [])
    .filter(function (s) { return !s.varredura && Math.abs(s.w - 1.2) < 0.05; });
  const pts = [];
  segs.forEach(function (s) {
    [{ x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 }].forEach(function (p) {
      if (!pts.some(function (q) { return dist(p, q) < 0.5; })) pts.push(p);
    });
  });
  if (pts.length !== 3) return null;
  function interno(i) {
    const V = pts[i], A = pts[(i + 1) % 3], B = pts[(i + 2) % 3];
    const u = { x: A.x - V.x, y: A.y - V.y }, w = { x: B.x - V.x, y: B.y - V.y };
    const c = (u.x * w.x + u.y * w.y) / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y));
    return Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI;
  }
  return {
    pts: pts,
    angulos: [interno(0), interno(1), interno(2)],
    /* lado[i] e o OPOSTO ao vertice i */
    lados: [dist(pts[1], pts[2]), dist(pts[2], pts[0]), dist(pts[0], pts[1])]
  };
}

/* Em que lado do triangulo um rotulo pousou. Devolve o indice do lado OPOSTO ao
 * vertice de mesmo indice, que e a convencao da casa. */
function ladoDoRotulo(T, texto, f) {
  const t = ((f.medido || {}).textos || []).find(function (x) { return String(x.txt) === texto; });
  if (!t) return -1;
  const c = { x: t.x + (t.largura || 0) / 2, y: t.y };
  let melhor = -1, dMin = Infinity;
  for (let i = 0; i < 3; i++) {
    const A = T.pts[(i + 1) % 3], B = T.pts[(i + 2) % 3];
    const vx = B.x - A.x, vy = B.y - A.y, L2 = vx * vx + vy * vy;
    let s = L2 ? ((c.x - A.x) * vx + (c.y - A.y) * vy) / L2 : 0;
    s = Math.max(0, Math.min(1, s));
    const d = Math.hypot(c.x - (A.x + s * vx), c.y - (A.y + s * vy));
    if (d < dMin) { dMin = d; melhor = i; }
  }
  return melhor;
}

/* O vertice em que o quadradinho de angulo reto pousou. */
function verticeDoQuadradinho(T, f, qual) {
  const q = quadradinhos(f)[qual || 0];
  if (!q) return -1;
  let melhor = -1, dMin = Infinity;
  for (let i = 0; i < 3; i++) {
    const d = dist(q, T.pts[i]);
    if (d < dMin) { dMin = d; melhor = i; }
  }
  return dMin < 1 ? melhor : -1;
}

/* As diagonais desenhadas: segmentos de 0,9 pt LONGOS. O filtro de comprimento
 * e obrigatorio e nao detalhe: o tracinho de congruencia tambem sai em 0,9 pt,
 * que e a espessura de marca da casa, e sem o piso os quatro tracinhos do
 * losango entrariam na lista como se fossem diagonais de 1 unidade. */
function diagonaisDe(f) {
  return ((f && f.medido && f.medido.segmentos) || [])
    .filter(function (s) { return !s.varredura && Math.abs(s.w - 0.9) < 0.05; })
    .map(function (s) { return Math.hypot(s.x2 - s.x1, s.y2 - s.y1); })
    .filter(function (L) { return L > 20; })
    .sort(function (a, b) { return a - b; });
}

/* Os quatro cantos do contorno de um quadrilatero, na volta em que foram
 * desenhados, lidos no unico sub-caminho fechado de 1,2 pt. */
function quadrilateroDe(f) {
  const segs = ((f && f.medido && f.medido.segmentos) || [])
    .filter(function (s) { return !s.varredura && Math.abs(s.w - 1.2) < 0.05; });
  const pts = [];
  segs.forEach(function (s) {
    [{ x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 }].forEach(function (p) {
      if (!pts.some(function (q) { return dist(p, q) < 0.5; })) pts.push(p);
    });
  });
  return pts.length === 4 ? pts : null;
}

console.log('\nexplicacao: o triangulo retangulo de a, b e c');
{
  const f = explic('triangulo', 'lado=a')[0];
  const T = trianguloDe(f);
  const vReto = verticeDoQuadradinho(T, f);
  const ia = ladoDoRotulo(T, 'a', f), ib = ladoDoRotulo(T, 'b', f), ic = ladoDoRotulo(T, 'c', f);
  medido('angulos internos ' + T.angulos.map(function (a) { return a.toFixed(1); }).join(' ') +
    '; quadradinho no vertice ' + vReto + '; a no lado ' + ia + ', b no ' + ib + ', c no ' + ic);
  conf('o quadradinho esta no vertice de 90 graus da folha',
    vReto >= 0 && Math.abs(T.angulos[vReto] - 90) < 0.01, true);
  conf('o a esta no lado OPOSTO ao angulo reto, que e a definicao de hipotenusa', ia, vReto);
  conf('o b e o c estao nos dois catetos, e nao na hipotenusa', ib !== vReto && ic !== vReto && ib !== ic, true);
  conf('o a e o maior dos tres lados na folha, como o texto afirma',
    T.lados[ia] === Math.max.apply(null, T.lados), true);
  conf('a figura imprime exatamente os tres rotulos da formula',
    textos(f).sort().join(' '), 'a b c');
  conf('e ela e a unica marcada fora de escala, com a legenda que a regra exige',
    f.foraDeEscala === true && !!f.legenda, true);
  /* Par envenenado da medida: o mesmo triangulo com a ordem trocada poe o a num
   * cateto, e a conta acima tem que dizer isso. Foi este o defeito que o lote 1
   * comprou caro: a figura fica perfeita e responde a outra pergunta. */
  const trocado = P.rascunho('@fig triangulo angulo=90 lado=b lado=a lado=c legenda=Figura fora de escala.').figs[0];
  const T2 = trianguloDe(trocado), v2 = verticeDoQuadradinho(T2, trocado);
  medido('par envenenado, ordem trocada: a caiu no lado ' + ladoDoRotulo(T2, 'a', trocado) +
    ' e o reto esta no vertice ' + v2);
  conf('a mesma medida acusa a ordem trocada, em que o a deixa de ser a hipotenusa',
    ladoDoRotulo(T2, 'a', trocado) !== v2, true);
}

console.log('\nexplicacao: o quadrado com a diagonal e o equilatero com a altura');
{
  const r = explic('quadrilatero')[0];
  const Q = quadrilateroDe(r);
  const diag = diagonaisDe(r);
  const lados = [0, 1, 2, 3].map(function (i) { return dist(Q[i], Q[(i + 1) % 4]); }).sort(function (a, b) { return a - b; });
  medido('quadrado: lados ' + lados.map(n2).join(' ') + ' pt; ' + diag.length +
    ' diagonal(is) longa(s) de 0,9 pt, ' + diag.map(n2).join(' ') + ' pt; textos ' + textos(r).join(' '));
  conf('os quatro lados saem iguais na folha', Math.max.apply(null, lados) - Math.min.apply(null, lados) < 0.02, true);
  conf('a diagonal e uma linha CONTINUA e fina, e ela e UMA so', diag.length, 1);
  medido('razao diagonal por lado ' + n4(diag[0] / lados[0]) + ' (raiz de 2 = ' + n4(Math.SQRT2) + ')');
  conf('e ela mede raiz de 2 vezes o lado, que e o d = L raiz de 2 do texto',
    Math.abs(diag[0] / lados[0] - Math.SQRT2) < 0.01, true);
  conf('a diagonal liga vertices OPOSTOS, e nao vizinhos: ela e maior que qualquer lado',
    diag[0] > lados[3] + 1, true);
  conf('o quadrado imprime L e d, e nada mais', textos(r).sort().join(' '), 'L d');
  conf('e ele sai exato, sem legenda de escala', r.foraDeEscala === false, true);

  const eq = explic('triangulo', 'lado=L')[0];
  const T = trianguloDe(eq);
  medido('equilatero: angulos ' + T.angulos.map(function (a) { return a.toFixed(1); }).join(' ') +
    '; lados ' + T.lados.map(n2).join(' ') + ' pt; textos ' + textos(eq).join(' '));
  conf('os tres angulos saem com 60 graus de verdade',
    T.angulos.every(function (a) { return Math.abs(a - 60) < 0.05; }), true);
  conf('e os tres lados saem iguais na folha',
    Math.max.apply(null, T.lados) - Math.min.apply(null, T.lados) < 0.05, true);
  conf('a figura escreve o L nos tres lados e o h da altura, e nada mais',
    textos(eq).sort().join(' '), ['L', 'L', 'L', 'h'].sort().join(' '));
  const q = quadradinhos(eq)[0];
  const meios = [0, 1, 2].map(function (i) {
    const A = T.pts[(i + 1) % 3], B = T.pts[(i + 2) % 3];
    return { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
  });
  const perto = meios.map(function (m) { return dist(q, m); });
  medido('quadradinho a ' + perto.map(n2).join(' / ') + ' pt do meio de cada lado');
  conf('o quadradinho da altura cai no PE dela, que e o MEIO do lado: a base partida ao meio',
    Math.min.apply(null, perto) < 0.05, true);
  conf('e a figura sai exata, sem legenda de escala', eq.foraDeEscala === false, true);
}

console.log('\nexercicio 9: o retangulo de diagonal 26 e lado 10, e o seu gabarito');
{
  const f = porId.r9, Q = quadrilateroDe(f), k = f.escala;
  const lados = [0, 1, 2, 3].map(function (i) { return dist(Q[i], Q[(i + 1) % 4]); }).sort(function (a, b) { return a - b; });
  const d = diagonaisDe(f)[0];
  medido('escala ' + n4(k) + ' pt por unidade; lados ' + n4(lados[0] / k) + ' e ' + n4(lados[3] / k) +
    ' (pedidos 10 e 24), diagonal ' + n4(d / k) + ' (pedida 26); textos ' + textos(f).join(' '));
  conf('o lado menor desenhado mede 10, que e o dado do enunciado', Math.abs(lados[0] / k - 10) < 0.01, true);
  conf('o lado maior desenhado mede 24, que e a resposta deduzida da diagonal', Math.abs(lados[3] / k - 24) < 0.01, true);
  conf('e a diagonal desenhada mede 26', Math.abs(d / k - 26) < 0.01, true);
  conf('so o 10 e o 26 saem em numero: o lado pedido sai em letra',
    textos(f).sort().join(' '), ['10', '26', 'h'].sort().join(' '));
  const g = gabPorId.r9;
  medido('gabarito: textos ' + textos(g).join(' | '));
  conf('gabarito: h = 24 resolvido no lado que o enunciado pergunta', tem(g, 'h = 24'), 1);
  conf('gabarito: o 10 e o 26 continuam como vieram', tem(g, '10') === 1 && tem(g, '26') === 1, true);
  conf('gabarito: mesma escala e mesma caixa do enunciado',
    Math.abs(g.escala - f.escala) < 1e-9 && g.caixa.altura === f.caixa.altura, true);
  /* Par envenenado da medida: 10 com 26 da 24, e nao 25. */
  const outro = P.rascunho('@fig quadrilatero tipo=retangulo base=10 diagonal=A;C;28 altura=h').figs[0];
  const Qo = quadrilateroDe(outro);
  const lo = [0, 1, 2, 3].map(function (i) { return dist(Qo[i], Qo[(i + 1) % 4]); }).sort(function (a, b) { return a - b; });
  medido('par envenenado, diagonal 28: lado maior ' + n4(lo[3] / outro.escala));
  conf('a mesma medida distingue a diagonal 28, que da outro lado',
    Math.abs(lo[3] / outro.escala - 24) > 1, true);
}

console.log('\nexercicio 10: o losango de diagonais 16 e 30');
{
  const f = porId.q10, Q = quadrilateroDe(f), k = f.escala;
  const diag = diagonaisDe(f);
  const lados = [0, 1, 2, 3].map(function (i) { return dist(Q[i], Q[(i + 1) % 4]); });
  medido('escala ' + n4(k) + ' pt por unidade; diagonais ' + diag.map(function (v) { return n4(v / k); }).join(' e ') +
    ' (pedidas 16 e 30); lados ' + lados.map(function (v) { return n4(v / k); }).join(' ') +
    ' (a resposta e 17); textos ' + textos(f).join(' '));
  conf('as duas diagonais desenhadas medem 16 e 30',
    Math.abs(diag[0] / k - 16) < 0.01 && Math.abs(diag[1] / k - 30) < 0.01, true);
  conf('os quatro lados saem iguais, que e o que faz dele um losango',
    Math.max.apply(null, lados) - Math.min.apply(null, lados) < 0.02, true);
  conf('e cada lado mede 17, a hipotenusa das METADES 8 e 15',
    Math.abs(lados[0] / k - 17) < 0.01, true);
  conf('so o 16 e o 30 saem em numero: o lado pedido sai em letra',
    textos(f).sort().join(' '), ['16', '30', 'L'].sort().join(' '));
  conf('e a figura nao imprime nenhum valor de angulo, que a questao nao pede',
    textos(f).filter(function (t) { return String(t).indexOf('°') >= 0; }).length, 0);
}

/* ================================================================ pares envenenados */
console.log('\npares envenenados com o texto deste tema');
{
  const veneno = P.clonar(ctx.tema);
  const ex10 = veneno.pt.exercicios.find(function (e) { return e.n === 10; });
  ex10.enunciado = ex10.enunciado.replace('da figura', 'qualquer');
  const ex1 = veneno.en.exercicios.find(function (e) { return e.n === 1; });
  ex1.enunciado = 'Find the hypotenuse of the right triangle in the figure, with legs 6 and 8.';
  conf('par envenenado: o 10 sem "da figura" e o 1 falando de figura sem ter sao acusados',
    P.semRemissao(veneno).join('; '),
    'pt 10 tem figura e nao remete a ela; en 1 fala da figura e nao tem nenhuma');
}
{
  const veneno = P.clonar(ctx.tema);
  const ex9 = veneno.pt.exercicios.find(function (e) { return e.n === 9; });
  ex9.enunciado = ex9.enunciado.replace('diagonal 26', 'diagonal conhecida');
  conf('par envenenado: tirado o 26 do texto do 9, a figura que imprime 26 e acusada',
    P.numeroSoNoDesenho(veneno, 'pt', docPT.figurasDesenhadas || []).join('; '),
    'pt 9: a figura imprime 26 e o texto nao traz');
}
{
  /* A trava E rodada com o veneno deste tema: o triangulo de a, b e c SEM a
   * legenda tem que ser acusado, senao a folha imprimiria um triangulo
   * retangulo arbitrario sem dizer que ele e arbitrario. */
  const semLegenda = P.rascunho('@fig triangulo angulo=90 lado=a lado=b lado=c');
  conf('par envenenado: o triangulo de a, b e c sem legenda sai com aviso de escala',
    semLegenda.avisos.filter(function (a) { return a.indexOf('fora de escala') >= 0; }).length, 1);
}
{
  /* O kit recusa a congruencia que o desenho nao cumpre: e a trava que impede
   * "marcar os tres lados iguais" num triangulo que sai escaleno. */
  const mentira = P.rascunho('@fig triangulo congruentes=a;b;c lado=L altura=h;h;C');
  conf('par envenenado: tres lados marcados congruentes num desenho que nao os cumpre sao acusados',
    mentira.avisos.filter(function (a) { return a.indexOf('congruentes') >= 0; }).length, 1);
}

const saida = P.placar();
P.avisos(ctx);
process.exit(saida);
