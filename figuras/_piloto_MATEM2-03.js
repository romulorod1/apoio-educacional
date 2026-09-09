/* figuras/_piloto_MATEM2-03.js
 * Gera os documentos do MATEM2-03, "Lei dos senos e lei dos cossenos", pelo
 * caminho de verdade: o gerarMaterialTema do pdf.js, lendo o tema do banco.
 *
 * Tudo o que e generico (a abertura do tema, o placar, os leitores de folha e as
 * travas 0 a 8) mora no _piloto_base.js. Aqui ficam so tres coisas: o ID, os
 * numeros editoriais deste tema e a medicao no fluxo da familia do triangulo.
 *
 * Uso: node _piloto_MATEM2-03.js [caminho de outro banco.json ou do retrato]
 *
 * Regra da casa: nunca usar travessao.
 */
const P = require('./_piloto_base.js');

const ID = 'MATEM2-03';
const ctx = P.abrir({ id: ID, caminhoDoMd: 'temas/mat/em2/' + ID + '.md' });

const conf = P.conf, medido = P.medido;
const textos = P.textos, tem = P.tem, quadradinhos = P.quadradinhos;
const dist = P.dist, n2 = P.n2, n4 = P.n4;
const porId = ctx.porId, explic = ctx.explic;
const docPT = ctx.docPT, docEN = ctx.docEN;

/* ================================================================ travas genericas
 *
 * Escolha editorial escrita: 3 na explicacao, 1 nos 19 enunciados, 0 no
 * gabarito.
 *
 * Na explicacao, as tres figuras sao as tres frases que descreviam um desenho.
 * A primeira e a CONVENCAO DA CASA, que este tema usa em cada linha e que a
 * especificacao cita nominalmente: vertice em maiuscula, lado oposto na
 * minuscula do mesmo nome. "O lado a oposto ao angulo A e assim por diante" e
 * uma correspondencia POSICIONAL, e posicao nao se le em prosa. A segunda e o
 * Exemplo 1, o par lado mais angulo oposto que a lei dos senos pede: o 30 tem o
 * 8 na frente e o 45 tem o b, e a proporcionalidade se ve. A terceira e o
 * Exemplo 3, tres lados com o angulo procurado marcado, que e a leitura que o
 * erro numero um do tema exige: o 60 e o angulo ENTRE o 5 e o 8, e nao um
 * angulo qualquer.
 *
 * Nos enunciados, um so: o 17, e ele e o unico exercicio do tema que NOMEIA os
 * vertices e pergunta por um lado pelas duas pontas ("o lado AC mede 60, calcule
 * o lado BC"). Sem a figura, casar AC e BC com os angulos de 45 e 60 e uma
 * segunda tarefa que a questao nao queria cobrar. A figura traz os tres
 * vertices e os dois angulos, e o 60 metros fica no texto: vertices mais dois
 * angulos mais um lado seriam SEIS marcas, e a especificacao ja registra esse
 * beco.
 *
 * Dezoito dos dezenove ficam sem figura nenhuma, muito acima do terco, e a
 * maior parte disso e limite do kit e nao escolha. Estao escritos no relatorio;
 * os tres que mais doem: (1) o 11, os dois barcos com 60 graus entre as rotas,
 * porque a receita nao constroi triangulo por DOIS LADOS E O ANGULO ENTRE ELES,
 * que e justamente a entrada da lei dos cossenos; (2) o 19, o caso ambiguo, que
 * pede DUAS solucoes na mesma figura; (3) o 9, o raio da circunferencia
 * circunscrita, que pede o triangulo inscrito.
 *
 * Tres ficaram de fora por ESCOLHA, e sao o caso do lote 1 de "a figura esta
 * correta e responde a outra pergunta": o 5 (o triangulo 6, 8 e 10 tem angulo
 * reto?), o 3 (lados 3, 5 e 7, o maior angulo) e o 8 (lados 7, 8 e 13). Nos
 * tres, tres lados numericos constroem a figura FIEL, e a figura fiel entrega a
 * resposta a quem olhar: no 5 o kit ainda poe o quadradinho de oficio, porque
 * 36 mais 64 fecha 100, e a folha do enunciado imprimiria a resposta.
 *
 * O gabarito nao tem figura nenhuma. Nenhuma resposta deste tema E uma
 * construcao: todas sao um valor, e quase todos irracionais (10 raiz de 2, 4
 * raiz de 6, 10 raiz de 13, 20 raiz de 6). A camada de gabarito escreve o valor
 * MEDIDO na figura, arredondado, entao ela imprimiria "d = 36,06" ao lado de um
 * gabarito que diz 10 raiz de 13. */
P.travasGenericas(ctx, {
  /* As palavras deste tema que so existem em portugues. Nenhuma figura deste
   * tema imprime palavra: todas so escrevem letra, numero e grau. */
  palavrasPt: ['senos', 'cossenos', 'triângulo', 'ângulo', 'terreno', 'vértice',
    'barcos', 'circunscrita', 'oposto'],
  diretivasNaExplicacao: { n: 3, rotulo: 'a explicacao tem 3 figuras' },
  enunciadosComFigura: {
    n: '17',
    rotulo: 'so o enunciado 17 carrega figura'
  },
  registrosNoMaterial: { n: 4, rotulo: 'o material desenha 4 registros: 3 na explicacao e 1 no enunciado' },
  figurasNoGabarito: { n: 0, rotulo: 'e o gabarito nao tem nenhuma' },
  idsDoGabarito: { n: '', rotulo: 'e portanto nenhum id de gabarito' },
  /* Nenhuma figura deste tema e chute. As tres numericas saem fieis por
   * construcao, e a de letras sai do prototipo, que e exato por construcao e
   * nao esta fora de escala de nada. */
  figurasForaDeEscala: { n: 'nenhuma', rotulo: 'nenhuma figura marcada fora de escala: todas saem exatas' }
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

/* Em que lado do triangulo um rotulo pousou (indice do lado OPOSTO ao vertice
 * de mesmo indice). */
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

/* Em que vertice do triangulo um rotulo pousou. Serve para a letra de vertice e
 * para o valor de angulo, que sai na bissetriz, perto do vertice dele. */
function verticeDoRotulo(T, texto, f) {
  const t = ((f.medido || {}).textos || []).find(function (x) { return String(x.txt) === texto; });
  if (!t) return -1;
  const c = { x: t.x + (t.largura || 0) / 2, y: t.y };
  let melhor = -1, dMin = Infinity;
  for (let i = 0; i < 3; i++) {
    const d = dist(c, T.pts[i]);
    if (d < dMin) { dMin = d; melhor = i; }
  }
  return melhor;
}

console.log('\nexplicacao: a convencao de vertice maiusculo e lado oposto minusculo');
{
  const f = explic('triangulo', 'vertices=A;B;C')[0];
  const T = trianguloDe(f);
  const vA = verticeDoRotulo(T, 'A', f), vB = verticeDoRotulo(T, 'B', f), vC = verticeDoRotulo(T, 'C', f);
  const ia = ladoDoRotulo(T, 'a', f), ib = ladoDoRotulo(T, 'b', f);
  medido('A no vertice ' + vA + ', B no ' + vB + ', C no ' + vC + '; a no lado ' + ia + ', b no lado ' + ib);
  conf('as tres letras de vertice pousam em tres vertices diferentes',
    vA >= 0 && vB >= 0 && vC >= 0 && vA !== vB && vB !== vC && vA !== vC, true);
  conf('o lado a fica em frente ao vertice A, que e a convencao que as duas leis usam', ia, vA);
  conf('e o lado b fica em frente ao vertice B', ib, vB);
  conf('a figura imprime as tres letras de vertice e os dois lados, e nada mais',
    textos(f).sort().join(' '), ['A', 'B', 'C', 'a', 'b'].sort().join(' '));
  conf('e ela sai exata, sem legenda de escala', f.foraDeEscala === false, true);
  /* LIMITE DO KIT, medido e escrito aqui para nao ficar escondido: sem numero
   * nenhum, o triangulo cai no PROTOTIPO GENERICO do receitas.js, que e de 58 e
   * 62 graus, ou seja quase equilatero. Num tema que abre dizendo "a maioria
   * dos triangulos do mundo nao tem angulo reto" e que resolve triangulo
   * QUALQUER, um desenho que se le como equilatero insinua um caso particular
   * que a figura nao afirma. A mitigacao possivel na autoria e esta: a figura
   * nao imprime medida nenhuma, so letra livre, entao ela nao AFIRMA lado igual
   * a lado; e as outras duas figuras da explicacao, com numero, saem
   * visivelmente escalenas. O conserto e do kit, e esta no relatorio: o
   * prototipo do trapezio ja foi corrigido pelo mesmo motivo, e o do triangulo
   * nao. */
  const razao = Math.max.apply(null, T.lados) / Math.min.apply(null, T.lados);
  medido('LIMITE DO KIT: sem numero a figura sai no prototipo de 58 e 62 graus; angulos ' +
    T.angulos.map(function (a) { return a.toFixed(1); }).join(' ') + ', maior lado sobre menor ' +
    n4(razao) + ' (le-se como equilatero)');
  conf('a mitigacao: a figura nao imprime NUMERO nenhum, entao nao afirma lado igual a lado',
    textos(f).filter(function (t) { return /\d/.test(String(t)); }).length, 0);
  /* Par envenenado da medida: trocada a ordem dos lados, o a deixa de ser o
   * oposto ao A e a mesma conta tem que dizer isso. E o defeito que o lote 1
   * comprou caro: a figura fica perfeita e responde a outra pergunta. */
  const trocado = P.rascunho('@fig triangulo vertices=A;B;C lado=b lado=a').figs[0];
  const T2 = trianguloDe(trocado);
  medido('par envenenado, ordem trocada: a caiu no lado ' + ladoDoRotulo(T2, 'a', trocado) +
    ' e o A esta no vertice ' + verticeDoRotulo(T2, 'A', trocado));
  conf('a mesma medida acusa a ordem trocada, em que o a deixa de ser o lado oposto ao A',
    ladoDoRotulo(T2, 'a', trocado) !== verticeDoRotulo(T2, 'A', trocado), true);
}

console.log('\nexplicacao: o Exemplo 1, a lei dos senos');
{
  const f = explic('triangulo', 'angulo=30 angulo=45')[0];
  const T = trianguloDe(f);
  const v30 = verticeDoRotulo(T, '30°', f), v45 = verticeDoRotulo(T, '45°', f);
  const i8 = ladoDoRotulo(T, '8', f), ib = ladoDoRotulo(T, 'b', f);
  medido('angulos internos ' + T.angulos.map(function (a) { return a.toFixed(1); }).join(' ') +
    '; 30 no vertice ' + v30 + ', 45 no ' + v45 + '; 8 no lado ' + i8 + ', b no lado ' + ib);
  conf('os 30 e os 45 graus saem com 30 e 45 graus de verdade na folha',
    Math.abs(T.angulos[v30] - 30) < 0.01 && Math.abs(T.angulos[v45] - 45) < 0.01, true);
  conf('o 8 esta no lado OPOSTO aos 30 graus, que e o par que a lei dos senos usa', i8, v30);
  conf('e o b esta no lado oposto aos 45 graus, que e o segundo par', ib, v45);
  conf('so o 8 sai em numero entre os dois lados: a resposta sai em letra',
    textos(f).sort().join(' '), ['30°', '45°', '8', 'b'].sort().join(' '));
  /* A conta fecha na folha: b vale 8 vezes o seno de 45 sobre o seno de 30. */
  const k = T.lados[i8] / 8;
  medido('escala ' + n4(k) + ' pt por unidade; b desenhado ' + n4(T.lados[ib] / k) +
    ' (8 raiz de 2 = ' + n4(8 * Math.SQRT2) + ')');
  conf('o b desenhado mede 8 raiz de 2, que e a resposta do proprio exemplo',
    Math.abs(T.lados[ib] / k - 8 * Math.SQRT2) < 0.01, true);
}

console.log('\nexplicacao: o Exemplo 3, a lei dos cossenos');
{
  const f = explic('triangulo', 'lado=7')[0];
  const T = trianguloDe(f);
  const v60 = verticeDoRotulo(T, '60°', f);
  const i7 = ladoDoRotulo(T, '7', f), i5 = ladoDoRotulo(T, '5', f), i8 = ladoDoRotulo(T, '8', f);
  medido('angulos internos ' + T.angulos.map(function (a) { return a.toFixed(2); }).join(' ') +
    '; 60 no vertice ' + v60 + '; 7 no lado ' + i7 + ', 5 no ' + i5 + ', 8 no ' + i8);
  conf('o angulo de 60 graus sai com 60 graus de verdade na folha',
    Math.abs(T.angulos[v60] - 60) < 0.01, true);
  conf('o 7 esta no lado OPOSTO ao angulo de 60, que e o lado a da formula', i7, v60);
  conf('e o 5 e o 8 sao os dois lados que FORMAM o angulo de 60, que e o b e o c',
    i5 !== v60 && i8 !== v60 && i5 !== i8, true);
  const k = T.lados[i7] / 7;
  medido('escala ' + n4(k) + ' pt por unidade; lados desenhados ' +
    [i7, i5, i8].map(function (i) { return n4(T.lados[i] / k); }).join(' / ') + ' (pedidos 7, 5 e 8)');
  conf('os tres lados desenhados medem 7, 5 e 8',
    Math.abs(T.lados[i5] / k - 5) < 0.01 && Math.abs(T.lados[i8] / k - 8) < 0.01, true);
  /* O cuidado de nao insinuar: nenhum angulo desta figura passa perto de 90, e
   * nenhum par de lados sai igual. Uma figura de triangulo QUALQUER que se
   * lesse como retangula ou como isosceles ensinaria o contrario do tema. */
  const perto90 = T.angulos.filter(function (a) { return Math.abs(a - 90) < 5; }).length;
  medido('angulos a menos de 5 graus de 90: ' + perto90 + '; menor diferenca entre dois lados ' +
    n2(Math.min(Math.abs(T.lados[0] - T.lados[1]), Math.abs(T.lados[1] - T.lados[2]), Math.abs(T.lados[0] - T.lados[2]))) + ' pt');
  conf('nenhum angulo desta figura flerta com o reto, que o tema justamente nao afirma', perto90, 0);
}

console.log('\nexercicio 17: o terreno ABC de 45 e 60 graus');
{
  const f = porId.t17;
  const T = trianguloDe(f);
  const vA = verticeDoRotulo(T, 'A', f), vB = verticeDoRotulo(T, 'B', f), vC = verticeDoRotulo(T, 'C', f);
  const v45 = verticeDoRotulo(T, '45°', f), v60 = verticeDoRotulo(T, '60°', f);
  medido('A no vertice ' + vA + ', B no ' + vB + ', C no ' + vC +
    '; 45 no vertice ' + v45 + ', 60 no ' + v60 +
    '; angulos internos ' + T.angulos.map(function (a) { return a.toFixed(1); }).join(' '));
  conf('o arco de 45 graus esta no vertice que se chama A, como o enunciado diz', v45, vA);
  conf('e o arco de 60 graus esta no vertice que se chama B', v60, vB);
  conf('o terceiro vertice, o C, fica sem arco: ele e o que a soma 180 devolve',
    vC !== vA && vC !== vB, true);
  conf('os dois angulos saem com 45 e 60 graus de verdade na folha',
    Math.abs(T.angulos[vA] - 45) < 0.01 && Math.abs(T.angulos[vB] - 60) < 0.01, true);
  /* O lado AC e o oposto a B e o lado BC e o oposto a A: a razao entre eles na
   * folha e sen(60)/sen(45), que e de onde sai o 20 raiz de 6 do gabarito. */
  const AC = T.lados[vB], BC = T.lados[vA];
  medido('AC ' + n2(AC) + ' pt, BC ' + n2(BC) + ' pt, razao ' + n4(BC / AC) +
    ' (sen 45 sobre sen 60 = ' + n4(Math.sin(Math.PI / 4) / Math.sin(Math.PI / 3)) + ')');
  conf('BC por AC na folha e o seno de 45 sobre o seno de 60, que e a lei dos senos deste item',
    Math.abs(BC / AC - Math.sin(Math.PI / 4) / Math.sin(Math.PI / 3)) < 1e-3, true);
  conf('e com AC igual a 60 metros o BC desenhado vale 20 raiz de 6',
    Math.abs(60 * BC / AC - 20 * Math.sqrt(6)) < 0.01, true);
  conf('a figura nao imprime medida nenhuma de lado: o 60 metros mora no texto',
    textos(f).sort().join(' '), ['45°', '60°', 'A', 'B', 'C'].sort().join(' '));
}

/* ================================================================ pares envenenados */
console.log('\npares envenenados com o texto deste tema');
{
  const veneno = P.clonar(ctx.tema);
  const ex17 = veneno.pt.exercicios.find(function (e) { return e.n === 17; });
  ex17.enunciado = ex17.enunciado.replace('da figura', 'a seguir descrito');
  const ex2 = veneno.en.exercicios.find(function (e) { return e.n === 2; });
  ex2.enunciado = 'Two sides of the triangle in the figure measure 5 and 8, and the angle between them measures 60 degrees.';
  conf('par envenenado: o 17 sem "da figura" e o 2 falando de figura sem ter sao acusados',
    P.semRemissao(veneno).join('; '),
    'pt 17 tem figura e nao remete a ela; en 2 fala da figura e nao tem nenhuma');
}
{
  const veneno = P.clonar(ctx.tema);
  const ex17 = veneno.pt.exercicios.find(function (e) { return e.n === 17; });
  ex17.enunciado = ex17.enunciado.replace('mede 45°', 'e agudo');
  conf('par envenenado: tirado o 45 do texto do 17, a figura que imprime 45 e acusada',
    P.numeroSoNoDesenho(veneno, 'pt', docPT.figurasDesenhadas || []).join('; '),
    'pt 17: a figura imprime 45° e o texto nao traz');
}
{
  /* O limite do kit que decidiu quase toda a lista de "ficou de fora" deste
   * tema, provado aqui para nao ser redescoberto: dois lados e o angulo ENTRE
   * eles, que e a entrada da lei dos cossenos, nao constroem triangulo nenhum.
   * O 11 (barcos), o 12, o 15 e o Exemplo 2 vivem dessa configuracao. */
  const lal = P.rascunho('@fig triangulo angulo=60 lado=d lado=30 lado=40');
  conf('limite do kit: dois lados e o angulo entre eles nao constroem a figura, e o kit avisa',
    lal.avisos.filter(function (a) { return a.indexOf('nao saem nessa proporcao') >= 0; }).length, 1);
  conf('e nenhuma figura sai desse pedido, em vez de sair uma figura que mente', lal.figs.length, 0);
}
{
  /* O outro motivo de "ficou de fora": tres lados numericos que fecham
   * Pitagoras ganham o quadradinho de oficio, entao a figura do exercicio 5
   * imprimiria a resposta dele. */
  const seis810 = P.rascunho('@fig triangulo lado=10 lado=6 lado=8').figs[0];
  conf('par envenenado: o triangulo 6, 8 e 10 do exercicio 5 sai com o quadradinho de oficio',
    quadradinhos(seis810).length, 1);
}

const saida = P.placar();
P.avisos(ctx);
process.exit(saida);
