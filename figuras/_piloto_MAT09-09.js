/* figuras/_piloto_MAT09-09.js
 * Gera os documentos do MAT09-09, "Seno, cosseno e tangente", pelo caminho de
 * verdade: o gerarMaterialTema do pdf.js, lendo o tema do banco.
 *
 * Tudo o que e generico (a abertura do tema, o placar, os leitores de folha e as
 * travas 0 a 8) mora no _piloto_base.js. Aqui ficam so tres coisas: o ID, os
 * numeros editoriais deste tema e a medicao no fluxo da familia do triangulo e
 * do quadrilatero.
 *
 * Uso: node _piloto_MAT09-09.js [caminho de outro banco.json ou do retrato]
 *
 * Regra da casa: nunca usar travessao.
 */
const P = require('./_piloto_base.js');

const ID = 'MAT09-09';
const ctx = P.abrir({ id: ID, caminhoDoMd: 'temas/mat/09/' + ID + '.md' });

const conf = P.conf, medido = P.medido;
const textos = P.textos, tem = P.tem, quadradinhos = P.quadradinhos;
const dist = P.dist, n2 = P.n2, n4 = P.n4;
const porId = ctx.porId, explic = ctx.explic;
const docPT = ctx.docPT, docEN = ctx.docEN;

/* ================================================================ travas genericas
 *
 * Escolha editorial escrita: 3 na explicacao, 2 nos 18 enunciados, 0 no gabarito.
 *
 * Na explicacao, as tres figuras sao as tres frases que descreviam um desenho.
 * "Fixe um dos angulos agudos: a hipotenusa e o lado em frente ao angulo reto, o
 * cateto oposto e o que fica em frente ao angulo escolhido, e o cateto adjacente
 * e o que forma o angulo escolhido junto com a hipotenusa" e uma definicao
 * POSICIONAL, e posicao nao se le em prosa: a figura fixa qual angulo e o theta
 * e escreve em cada lado o papel que ele exerce em relacao a ele. E depois: "os
 * valores saem de duas figuras simples, a metade de um triangulo equilatero, que
 * da 30 e 60, e a metade de um quadrado cortado pela diagonal, que da 45". Sao
 * duas figuras nomeadas pelo proprio texto e que o tema nao desenhava, e sao
 * elas que transformam a tabela dos notaveis de coisa decorada em coisa
 * deduzida.
 *
 * Nos enunciados, os dois em que a configuracao tem TRES lados em jogo e nomes
 * diferentes para cada um: o 7 (escada, parede e chao) e o 18 (rampa, desnivel e
 * avanco na horizontal). Nos dois, o que se PERGUNTA sai em letra e o que o
 * enunciado DA sai em numero, que e a regra que impede a figura de responder a
 * questao: no 7 a escada e 8 e a altura e a distancia sao h e d; no 18 o
 * desnivel e 5 e o comprimento e o avanco sao c e d.
 *
 * Dezesseis dos dezoito ficam sem figura nenhuma, muito acima do terco. O 13
 * (altura do equilatero de lado 10) ficou de fora de proposito: a figura da
 * explicacao ja mostra o equilatero partido pela altura h, e repetir com o 10
 * entrega o meio-lado 5 que o exercicio existe para cobrar. O 9 e o 15, de
 * angulo de DEPRESSAO, ficaram de fora por falta de kit, e nao por escolha: o
 * angulo deles se mede entre a horizontal do TOPO e a linha de visada, e uma
 * figura que marcasse o mesmo numero no vertice do chao estaria correta e
 * responderia a outra pergunta.
 *
 * O gabarito nao tem figura nenhuma. Nenhuma resposta deste tema E uma
 * construcao: todas sao um valor, e quase todos irracionais. A camada de
 * gabarito escreve o valor MEDIDO na figura, arredondado, entao ela imprimiria
 * "h = 6,93" ao lado de um gabarito que diz 4 vezes raiz de 3. */
P.travasGenericas(ctx, {
  /* As palavras deste tema que so existem em portugues, inclusive as tres que a
   * figura imprime pelo parametro (hipotenusa, oposto, adjacente) e a legenda. */
  palavrasPt: ['hipotenusa', 'oposto', 'adjacente', 'cateto', 'escala', 'ângulo',
    'altura', 'rampa', 'escada'],
  diretivasNaExplicacao: { n: 3, rotulo: 'a explicacao tem 3 figuras' },
  enunciadosComFigura: {
    n: '7 18',
    rotulo: 'os enunciados 7 e 18 carregam figura, e so eles'
  },
  registrosNoMaterial: { n: 5, rotulo: 'o material desenha 5 registros: 3 na explicacao e 2 nos enunciados' },
  figurasNoGabarito: { n: 0, rotulo: 'e o gabarito nao tem nenhuma' },
  idsDoGabarito: { n: '', rotulo: 'e portanto nenhum id de gabarito' },
  /* Uma so fora de escala, e ela E fora de escala de verdade: com theta livre o
   * desenho e um triangulo retangulo qualquer, e a legenda diz isso. As outras
   * quatro saem exatas, inclusive o equilatero, que pede escala=fiel escrito
   * porque "dois angulos mais uma altura em letra" nao esta na lista de formas
   * determinadas do refinamento, ainda que a forma esteja determinada. */
  /* Duas ocorrencias porque a conta varre as quatro folhas e o triangulo de
   * theta e desenhado uma vez na folha portuguesa e uma vez na inglesa. */
  figurasForaDeEscala: {
    n: 'triangulo, triangulo',
    rotulo: 'so o triangulo generico de theta sai marcado fora de escala, uma vez em cada lingua'
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
 * vertice de mesmo indice, que e a convencao do tema inteiro. */
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
function verticeDoQuadradinho(T, f) {
  const q = quadradinhos(f)[0];
  if (!q) return -1;
  let melhor = -1, dMin = Infinity;
  for (let i = 0; i < 3; i++) {
    const d = dist(q, T.pts[i]);
    if (d < dMin) { dMin = d; melhor = i; }
  }
  return dMin < 1 ? melhor : -1;
}

console.log('\nexplicacao: o triangulo dos tres nomes');
{
  const f = explic('triangulo', 'hipotenusa')[0] || explic('triangulo')[0];
  const T = trianguloDe(f);
  const vReto = verticeDoQuadradinho(T, f);
  const iHip = ladoDoRotulo(T, 'hipotenusa', f);
  const iOp = ladoDoRotulo(T, 'oposto', f);
  const iAdj = ladoDoRotulo(T, 'adjacente', f);
  const iTheta = T.angulos.findIndex(function (a) { return Math.abs(a - 90) > 1; });
  medido('angulos internos ' + T.angulos.map(function (a) { return a.toFixed(1); }).join(' ') +
    '; quadradinho no vertice ' + vReto + '; hipotenusa no lado ' + iHip +
    ', oposto no ' + iOp + ', adjacente no ' + iAdj);
  conf('o quadradinho esta no vertice de 90 graus da folha',
    vReto >= 0 && Math.abs(T.angulos[vReto] - 90) < 0.01, true);
  conf('a hipotenusa esta no lado OPOSTO ao angulo reto, que e a definicao', iHip, vReto);
  const vTheta = ((f.medido || {}).textos || []).find(function (x) { return String(x.txt) === 'θ'; });
  let vT = -1, dT = Infinity;
  T.pts.forEach(function (p, i) {
    const d = dist({ x: vTheta.x + (vTheta.largura || 0) / 2, y: vTheta.y }, p);
    if (d < dT) { dT = d; vT = i; }
  });
  medido('theta escrito no vertice ' + vT + ' (angulo ' + T.angulos[vT].toFixed(1) + ' graus)');
  conf('theta esta num vertice AGUDO e nao no reto', vT !== vReto, true);
  conf('o cateto oposto esta no lado oposto ao vertice de theta, que e a definicao', iOp, vT);
  conf('e o cateto adjacente e o terceiro lado, o que toca theta e o vertice reto',
    iAdj === 3 - vReto - vT, true);
  conf('a hipotenusa e o maior dos tres lados na folha',
    T.lados[iHip] === Math.max.apply(null, T.lados), true);
  conf('a figura imprime exatamente os quatro rotulos do texto',
    textos(f).sort().join(' '), ['θ', 'hipotenusa', 'oposto', 'adjacente'].sort().join(' '));
  conf('e ela e a unica marcada fora de escala, com a legenda que a regra exige',
    f.foraDeEscala === true && !!f.legenda, true);
}

console.log('\nexplicacao: a metade do equilatero e a metade do quadrado');
{
  const eq = explic('triangulo', 'congruentes')[0];
  const T = trianguloDe(eq);
  medido('equilatero: angulos ' + T.angulos.map(function (a) { return a.toFixed(1); }).join(' ') +
    '; lados ' + T.lados.map(n2).join(' ') + ' pt; textos ' + textos(eq).join(' '));
  conf('os tres angulos saem com 60 graus de verdade',
    T.angulos.every(function (a) { return Math.abs(a - 60) < 0.05; }), true);
  conf('e os tres lados saem iguais na folha',
    Math.max.apply(null, T.lados) - Math.min.apply(null, T.lados) < 0.05, true);
  conf('a figura escreve os dois 60 e o h da altura, e nada mais',
    textos(eq).sort().join(' '), ['60°', '60°', 'h'].sort().join(' '));
  const q = quadradinhos(eq)[0];
  const meios = [0, 1, 2].map(function (i) {
    const A = T.pts[(i + 1) % 3], B = T.pts[(i + 2) % 3];
    return { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
  });
  const perto = meios.map(function (m) { return dist(q, m); });
  medido('quadradinho a ' + perto.map(n2).join(' / ') + ' pt do meio de cada lado');
  conf('o quadradinho da altura cai no PE dela, que no equilatero e o meio do lado',
    Math.min.apply(null, perto) < 0.05, true);
  conf('e a figura sai exata, sem legenda de escala', eq.foraDeEscala === false, true);

  const quad = explic('quadrilatero')[0];
  const diag = ((quad.medido || {}).segmentos || [])
    .filter(function (s) { return !s.varredura && Math.abs(s.w - 0.9) < 0.05; });
  const lados = ((quad.medido || {}).segmentos || [])
    .filter(function (s) { return !s.varredura && Math.abs(s.w - 1.2) < 0.05; })
    .map(function (s) { return Math.hypot(s.x2 - s.x1, s.y2 - s.y1); });
  medido('quadrado: ' + lados.length + ' lados de ' + lados.map(n2).join(' ') +
    ' pt, ' + diag.length + ' segmento(s) de 0,9 pt (a diagonal)');
  conf('os quatro lados saem iguais',
    lados.length === 4 && Math.max.apply(null, lados) - Math.min.apply(null, lados) < 0.02, true);
  conf('a diagonal e uma linha CONTINUA e fina, e ela existe na folha', diag.length >= 1, true);
  if (diag.length) {
    const d = Math.hypot(diag[0].x2 - diag[0].x1, diag[0].y2 - diag[0].y1);
    medido('diagonal de ' + n2(d) + ' pt contra lado de ' + n2(lados[0]) + ' pt (razao ' + n4(d / lados[0]) + ')');
    conf('e ela mede raiz de 2 vezes o lado, que e o que da os 45 graus',
      Math.abs(d / lados[0] - Math.SQRT2) < 0.01, true);
  }
  conf('o quadrado nao imprime numero nenhum: os 45 moram no texto', textos(quad).length, 0);
}

console.log('\nexercicio 7: a escada de 8 metros a 60 graus');
{
  const f = porId.t7;
  const T = trianguloDe(f);
  const vReto = verticeDoQuadradinho(T, f);
  const v60 = T.angulos.findIndex(function (a) { return Math.abs(a - 60) < 0.05; });
  const i8 = ladoDoRotulo(T, '8', f), ih = ladoDoRotulo(T, 'h', f), id = ladoDoRotulo(T, 'd', f);
  medido('angulos ' + T.angulos.map(function (a) { return a.toFixed(1); }).join(' ') +
    '; 8 no lado ' + i8 + ', h no ' + ih + ', d no ' + id + '; reto no vertice ' + vReto);
  conf('os 60 graus saem com 60 graus de verdade na folha', v60 >= 0, true);
  conf('o 8 esta na HIPOTENUSA, que e a escada: o lado oposto ao angulo reto', i8, vReto);
  conf('o h esta no cateto OPOSTO aos 60 graus, que e a parede', ih, v60);
  conf('e o d esta no cateto ADJACENTE, que e o chao', id === 3 - vReto - v60, true);
  conf('so o 8 sai em numero: as duas respostas saem em letra',
    textos(f).sort().join(' '), ['60°', '8', 'h', 'd'].sort().join(' '));
  /* A conta fecha na folha: a parede mede 8 vezes o seno de 60. */
  const k = T.lados[i8] / 8;
  medido('escala ' + n4(k) + ' pt por metro; parede ' + n2(T.lados[ih]) + ' pt = ' +
    n4(T.lados[ih] / k) + ' m (4 raiz de 3 = ' + n4(4 * Math.sqrt(3)) + '), chao ' +
    n4(T.lados[id] / k) + ' m (pedido 4)');
  conf('a parede desenhada mede 4 raiz de 3 metros', Math.abs(T.lados[ih] / k - 4 * Math.sqrt(3)) < 0.01, true);
  conf('e o chao desenhado mede 4 metros', Math.abs(T.lados[id] / k - 4) < 0.01, true);
}

console.log('\nexercicio 18: a rampa de desnivel 5 a 30 graus');
{
  const f = porId.t18;
  const T = trianguloDe(f);
  const vReto = verticeDoQuadradinho(T, f);
  const v30 = T.angulos.findIndex(function (a) { return Math.abs(a - 30) < 0.05; });
  const i5 = ladoDoRotulo(T, '5', f), ic = ladoDoRotulo(T, 'c', f), id = ladoDoRotulo(T, 'd', f);
  medido('angulos ' + T.angulos.map(function (a) { return a.toFixed(1); }).join(' ') +
    '; 5 no lado ' + i5 + ', c no ' + ic + ', d no ' + id + '; reto no vertice ' + vReto);
  conf('os 30 graus da inclinacao saem no vertice do CHAO, e nao no alto', v30 >= 0 && v30 !== vReto, true);
  conf('o 5 do desnivel esta no cateto OPOSTO aos 30 graus', i5, v30);
  conf('o c da rampa esta na hipotenusa, que e o lado inclinado', ic, vReto);
  conf('e o d do avanco esta no cateto adjacente, que e o chao', id === 3 - vReto - v30, true);
  conf('so o 5 sai em numero: as duas respostas saem em letra',
    textos(f).sort().join(' '), ['30°', '5', 'c', 'd'].sort().join(' '));
  const k = T.lados[i5] / 5;
  medido('escala ' + n4(k) + ' pt por metro; rampa ' + n4(T.lados[ic] / k) +
    ' m (pedido 10), avanco ' + n4(T.lados[id] / k) + ' m (5 raiz de 3 = ' + n4(5 * Math.sqrt(3)) + ')');
  conf('a rampa desenhada mede 10 metros', Math.abs(T.lados[ic] / k - 10) < 0.01, true);
  conf('e o avanco desenhado mede 5 raiz de 3 metros', Math.abs(T.lados[id] / k - 5 * Math.sqrt(3)) < 0.01, true);
}

/* ================================================================ pares envenenados */
console.log('\npares envenenados com o texto deste tema');
{
  const veneno = P.clonar(ctx.tema);
  const ex7 = veneno.pt.exercicios.find(function (e) { return e.n === 7; });
  ex7.enunciado = ex7.enunciado.replace(', como na figura', '');
  const ex1 = veneno.en.exercicios.find(function (e) { return e.n === 1; });
  ex1.enunciado = 'In the right triangle in the figure, find the leg opposite the angle of 30 degrees.';
  conf('par envenenado: o 7 sem "na figura" e o 1 falando de figura sem ter sao acusados',
    P.semRemissao(veneno).join('; '),
    'pt 7 tem figura e nao remete a ela; en 1 fala da figura e nao tem nenhuma');
}
{
  const veneno = P.clonar(ctx.tema);
  const ex18 = veneno.pt.exercicios.find(function (e) { return e.n === 18; });
  ex18.enunciado = ex18.enunciado.replace('de 5 metros', 'conhecido');
  conf('par envenenado: tirado o 5 do texto do 18, a figura que imprime 5 e acusada',
    P.numeroSoNoDesenho(veneno, 'pt', docPT.figurasDesenhadas || []).join('; '),
    'pt 18: a figura imprime 5 e o texto nao traz');
}
{
  /* A trava E rodada com o veneno deste tema: o triangulo de theta SEM a legenda
   * tem que ser acusado, senao a folha imprimiria um desenho arbitrario sem
   * dizer que ele e arbitrario. */
  const semLegenda = P.rascunho('@fig triangulo angulo=90 angulo=θ lado=hipotenusa lado=oposto lado=adjacente');
  conf('par envenenado: o triangulo de theta sem legenda sai com aviso de escala',
    semLegenda.avisos.filter(function (a) { return a.indexOf('fora de escala') >= 0; }).length, 1);
}

const saida = P.placar();
P.avisos(ctx);
process.exit(saida);
