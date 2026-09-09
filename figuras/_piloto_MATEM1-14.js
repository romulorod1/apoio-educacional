/* figuras/_piloto_MATEM1-14.js
 * Gera os documentos do MATEM1-14, "Trigonometria no triangulo retangulo", pelo
 * caminho de verdade: o gerarMaterialTema do pdf.js, lendo o tema do banco.
 *
 * Tudo o que e generico (a abertura do tema, o placar, os leitores de folha e as
 * travas 0 a 8) mora no _piloto_base.js. Aqui ficam so tres coisas: o ID, os
 * numeros editoriais deste tema e a medicao no fluxo da familia do triangulo.
 *
 * Uso: node _piloto_MATEM1-14.js [caminho de outro banco.json ou do retrato]
 *
 * Regra da casa: nunca usar travessao.
 */
const P = require('./_piloto_base.js');

const ID = 'MATEM1-14';
const ctx = P.abrir({ id: ID, caminhoDoMd: 'temas/mat/em1/' + ID + '.md' });

const conf = P.conf, medido = P.medido;
const textos = P.textos, tem = P.tem, quadradinhos = P.quadradinhos;
const dist = P.dist, n2 = P.n2, n4 = P.n4;
const porId = ctx.porId, explic = ctx.explic;
const docPT = ctx.docPT, docEN = ctx.docEN;

/* ================================================================ travas genericas
 *
 * Escolha editorial escrita: 1 na explicacao, 4 nos 18 enunciados, 0 no gabarito.
 *
 * O ensino medio pede figura MINIMA e PORTADORA: so o contorno, a marca do
 * angulo reto e as duas ou tres grandezas em jogo. As cinco figuras deste tema
 * sao todas o mesmo triangulo retangulo, e e de proposito: o tema inteiro e uma
 * configuracao so, vista de angulos diferentes, e uma figura por configuracao
 * diferente seria ruido.
 *
 * Na explicacao, a figura unica e a definicao POSICIONAL que nao cabe em prosa:
 * "cateto oposto ao angulo e o que fica do outro lado dele, sem toca-lo; cateto
 * adjacente e o que forma o angulo junto com a hipotenusa". Ela fixa qual
 * vertice e o theta e escreve c, a e b nos tres lados, que sao os mesmos
 * simbolos que a secao da relacao fundamental usa (sen(theta) = a/c e
 * cos(theta) = b/c).
 *
 * UMA SEGUNDA FIGURA DA EXPLICACAO FOI ESCRITA E DEPOIS TIRADA, e o motivo esta
 * na folha. Era o angulo de ELEVACAO, com a altura h no cateto oposto e a
 * distancia no chao d no adjacente, na secao "Altura e distancia". Com ela a
 * explicacao passava a QUATRO paginas e a pagina 4 saia com dois paragrafos de
 * "Erros comuns" e o resto em branco: uma folha inteira de papel por duas
 * frases. Ela era tambem a mais dispensavel das seis, porque o exercicio 7
 * desenha a MESMA configuracao com os numeros de verdade (a torre, os 60 metros
 * no chao e o h da altura) duas paginas adiante. Tirada, a explicacao fecha em
 * tres paginas e o material inteiro em seis.
 *
 * A que ficou sai MARCADA fora de escala, com a legenda que a regra manda, e
 * isso esta certo: com theta livre o desenho e um triangulo retangulo qualquer,
 * e a folha precisa dizer que ele e qualquer. As quatro dos enunciados, ao
 * contrario, saem FIEIS: nelas ha um angulo numerico e um comprimento numerico,
 * e quem conferir com transferidor e com regua e recompensado.
 *
 * Nos enunciados, os quatro em que a configuracao tem nome diferente para cada
 * lado: o 3 (o cateto oposto ao angulo de 30 mede 5), o 6 (escada, parede e
 * chao), o 7 (a torre, a distancia no chao e a altura) e o 12 (o cateto de 12 e
 * o angulo ADJACENTE a ele). Nos quatro, o que o enunciado DA sai em numero e o
 * que ele PERGUNTA sai em letra: nenhuma figura deste tema imprime uma resposta.
 *
 * Catorze dos dezoito ficam sem figura nenhuma, muito acima do terco. O 4 ficou
 * de fora ainda que seja a imagem espelhada do 3, e de proposito: com os dois
 * desenhados a aluna deixaria de treinar a traducao de texto em desenho
 * justamente no par em que ela e mais barata. O 14, o 17 e o 18, que sao os DOIS
 * TRIANGULOS ENCAIXADOS, ficaram de fora por falta de kit e nao por escolha (ver
 * o relatorio do lote): a receita de hoje nao sabe desenhar uma segunda visada
 * partindo de um ponto sobre um lado. O 16 tambem, porque a altura dos olhos da
 * pessoa e um segmento a mais que nao existe como chave.
 *
 * O gabarito nao tem figura nenhuma. Nenhuma resposta deste tema E uma
 * construcao, e quase todas sao irracionais: a camada de gabarito escreve o valor
 * MEDIDO na figura, arredondado, entao ela imprimiria "h = 5,2" ao lado de um
 * gabarito que diz 3 vezes raiz de 3. */
P.travasGenericas(ctx, {
  /* As palavras deste tema que so existem em portugues, mais as da legenda de
   * escala, que a figura imprime pelo parametro. */
  palavrasPt: ['hipotenusa', 'cateto', 'escala', 'ângulo', 'altura', 'escada',
    'parede', 'torre', 'chão', 'visada'],
  diretivasNaExplicacao: { n: 1, rotulo: 'a explicacao tem 1 figura' },
  enunciadosComFigura: {
    n: '3 6 7 12',
    rotulo: 'os enunciados 3, 6, 7 e 12 carregam figura, e so eles'
  },
  registrosNoMaterial: { n: 5, rotulo: 'o material desenha 5 registros: 1 na explicacao e 4 nos enunciados' },
  figurasNoGabarito: { n: 0, rotulo: 'e o gabarito nao tem nenhuma' },
  idsDoGabarito: { n: '', rotulo: 'e portanto nenhum id de gabarito' },
  /* A da explicacao, uma vez em cada lingua. Ela e fora de escala de verdade:
   * theta e parametro livre e o desenho e arbitrario. As quatro dos enunciados
   * saem exatas e nenhuma delas pode aparecer nesta lista. */
  figurasForaDeEscala: {
    n: 'triangulo, triangulo',
    rotulo: 'so a figura de theta da explicacao sai marcada fora de escala, uma vez em cada lingua'
  }
});

/* ================================================================ medicao no fluxo */

console.log('\nmedicao no fluxo');

/* Os tres vertices, os tres angulos internos e os tres lados (lado[i] e o oposto
 * ao vertice i), lidos nos segmentos de 1,2 pt do fluxo. */
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
    lados: [dist(pts[1], pts[2]), dist(pts[2], pts[0]), dist(pts[0], pts[1])]
  };
}

function centroDoTexto(f, txt) {
  const t = ((f.medido || {}).textos || []).find(function (x) { return String(x.txt) === txt; });
  return t ? { x: t.x + (t.largura || 0) / 2, y: t.y } : null;
}

/* Em qual dos tres lados um rotulo pousou, pelo indice do vertice OPOSTO. */
function ladoDoRotulo(T, f, txt) {
  const c = centroDoTexto(f, txt);
  if (!c) return -1;
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

function verticeDoTexto(T, f, txt) {
  const c = centroDoTexto(f, txt);
  if (!c) return -1;
  let melhor = -1, dMin = Infinity;
  for (let i = 0; i < 3; i++) {
    const d = dist(c, T.pts[i]);
    if (d < dMin) { dMin = d; melhor = i; }
  }
  return melhor;
}

function verticeReto(T, f) {
  const q = quadradinhos(f)[0];
  if (!q) return -1;
  let melhor = -1, dMin = Infinity;
  for (let i = 0; i < 3; i++) {
    const d = dist(q, T.pts[i]);
    if (d < dMin) { dMin = d; melhor = i; }
  }
  return dMin < 1 ? melhor : -1;
}

console.log('\nexplicacao: o triangulo de c, a e b');
{
  const f = explic('triangulo', 'lado=c')[0];
  const T = trianguloDe(f);
  const vReto = verticeReto(T, f);
  const vTheta = verticeDoTexto(T, f, 'θ');
  const ic = ladoDoRotulo(T, f, 'c'), ia = ladoDoRotulo(T, f, 'a'), ib = ladoDoRotulo(T, f, 'b');
  medido('angulos ' + T.angulos.map(function (x) { return x.toFixed(1); }).join(' ') +
    '; reto no vertice ' + vReto + ', theta no ' + vTheta + '; c no lado ' + ic +
    ', a no ' + ia + ', b no ' + ib);
  conf('o quadradinho esta num vertice que mede 90 graus na folha',
    vReto >= 0 && Math.abs(T.angulos[vReto] - 90) < 0.01, true);
  conf('theta esta num vertice agudo, e nao no reto',
    vTheta !== vReto && T.angulos[vTheta] < 89, true);
  conf('c esta no lado oposto ao angulo reto, ou seja na hipotenusa', ic, vReto);
  conf('a esta no lado oposto a theta, que e a definicao de cateto oposto', ia, vTheta);
  conf('e b e o terceiro lado, o que toca theta e o vertice reto: o cateto adjacente',
    ib === 3 - vReto - vTheta, true);
  conf('c e o maior dos tres lados na folha, como a hipotenusa tem que ser',
    T.lados[ic] === Math.max.apply(null, T.lados), true);
  conf('a figura imprime exatamente theta, c, a e b', textos(f).sort().join(' '),
    ['θ', 'c', 'a', 'b'].sort().join(' '));
  conf('e ela sai marcada fora de escala com legenda, porque theta e livre',
    f.foraDeEscala === true && !!f.legenda, true);
}

/* A conferencia que vale por todas as outras neste tema: em cada figura de
 * enunciado, cada rotulo esta no lado que o texto do item descreve, o numero
 * dado esta no lado que o enunciado da, e a letra esta no lado que ele pergunta.
 * Nao ha trava do kit que pegue isso: uma figura pode estar inteira certa e
 * responder a outra pergunta. */
function conferirItem(rot, id, esperado) {
  console.log('\n' + rot);
  const f = porId[id];
  const T = trianguloDe(f);
  const vReto = verticeReto(T, f);
  const vAng = T.angulos.findIndex(function (a, i) {
    return i !== vReto && Math.abs(a - esperado.angulo) < 0.05;
  });
  medido('angulos ' + T.angulos.map(function (x) { return x.toFixed(1); }).join(' ') +
    '; reto no vertice ' + vReto + ', ' + esperado.angulo + ' graus no vertice ' + vAng);
  conf(esperado.angulo + ' graus sai com ' + esperado.angulo + ' graus de verdade, num vertice agudo', vAng >= 0, true);
  conf('a figura sai FIEL, sem legenda de escala', f.foraDeEscala === false && !f.legenda, true);
  conf('imprime exatamente os rotulos previstos', textos(f).sort().join(' '),
    esperado.rotulos.slice().sort().join(' '));
  /* hipotenusa = lado oposto ao reto; oposto = lado oposto ao vertice do angulo;
   * adjacente = o terceiro. */
  const papel = { hipotenusa: vReto, oposto: vAng, adjacente: 3 - vReto - vAng };
  Object.keys(esperado.papeis).forEach(function (txt) {
    const querem = esperado.papeis[txt];
    conf('"' + txt + '" esta na ' + querem + ', que e o que o enunciado descreve',
      ladoDoRotulo(T, f, txt), papel[querem]);
  });
  /* E a escala fecha: fixada pelo comprimento numerico da figura, todo outro
   * lado sai com o valor que a conta do gabarito da. */
  const k = T.lados[papel[esperado.escalaPor]] / esperado.escalaValor;
  Object.keys(esperado.valores).forEach(function (papelNome) {
    const alvo = esperado.valores[papelNome];
    const medida = T.lados[papel[papelNome]] / k;
    medido('a ' + papelNome + ' desenhada mede ' + n4(medida) + ' (o gabarito da ' + n4(alvo) + ')');
    conf('a ' + papelNome + ' desenhada bate com o gabarito', Math.abs(medida - alvo) < 0.01, true);
  });
}

conferirItem('exercicio 3: cateto oposto ao angulo de 30 mede 5, hipotenusa x', 'e3', {
  angulo: 30,
  rotulos: ['30°', 'x', '5'],
  papeis: { '5': 'oposto', 'x': 'hipotenusa' },
  escalaPor: 'oposto', escalaValor: 5,
  valores: { hipotenusa: 10 }
});

conferirItem('exercicio 6: escada de 6 metros a 60 graus', 'e6', {
  angulo: 60,
  rotulos: ['60°', '6', 'h', 'd'],
  papeis: { '6': 'hipotenusa', 'h': 'oposto', 'd': 'adjacente' },
  escalaPor: 'hipotenusa', escalaValor: 6,
  valores: { oposto: 3 * Math.sqrt(3), adjacente: 3 }
});

conferirItem('exercicio 7: torre vista a 60 metros sob 30 graus', 'e7', {
  angulo: 30,
  rotulos: ['30°', '60', 'h'],
  papeis: { '60': 'adjacente', 'h': 'oposto' },
  escalaPor: 'adjacente', escalaValor: 60,
  valores: { oposto: 20 * Math.sqrt(3) }
});

conferirItem('exercicio 12: cateto 12 com o angulo ADJACENTE de 30 graus', 'e12', {
  angulo: 30,
  rotulos: ['30°', 'c', 'x', '12'],
  papeis: { '12': 'adjacente', 'x': 'oposto', 'c': 'hipotenusa' },
  escalaPor: 'adjacente', escalaValor: 12,
  valores: { oposto: 4 * Math.sqrt(3), hipotenusa: 8 * Math.sqrt(3) }
});

console.log('\no par envenenado do defeito que nenhuma trava pega');
{
  /* O 12 diz que o angulo de 30 e ADJACENTE ao cateto de 12. A figura em que o
   * 12 vai para o cateto OPOSTO desenha um triangulo perfeitamente correto e
   * responde a OUTRA pergunta: ali a hipotenusa seria 24 e o outro cateto
   * 12 raiz de 3, e o gabarito de 4 raiz de 3 e 8 raiz de 3 ficaria errado. A
   * unica conferencia possivel e a de cima, lado a lado com o texto do item. */
  const errada = P.rascunho('@fig triangulo id=v1 angulo=90 angulo=30 lado=c lado=12 lado=x').figs[0];
  const T = trianguloDe(errada);
  const vReto = verticeReto(T, errada);
  const vAng = T.angulos.findIndex(function (a, i) { return i !== vReto && Math.abs(a - 30) < 0.05; });
  const i12 = ladoDoRotulo(T, errada, '12');
  const k = T.lados[i12] / 12;
  medido('na versao trocada o 12 cai no lado ' + i12 + ' (o oposto e o ' + vAng +
    ', o adjacente e o ' + (3 - vReto - vAng) + '), e a hipotenusa desenhada mede ' +
    n4(T.lados[vReto] / k) + ' em vez de ' + n4(8 * Math.sqrt(3)));
  conf('a figura trocada nao gera aviso nenhum do kit: ela esta correta',
    P.rascunho('@fig triangulo id=v1 angulo=90 angulo=30 lado=c lado=12 lado=x').avisos.length, 0);
  conf('e mesmo assim ela responde a outra pergunta: o 12 sai no cateto OPOSTO', i12, vAng);
  conf('e a hipotenusa dela seria 24, e nao 8 raiz de 3',
    Math.abs(T.lados[vReto] / k - 24) < 0.02, true);
  conf('enquanto a figura do tema poe o 12 no cateto ADJACENTE, como o texto manda',
    ladoDoRotulo(trianguloDe(porId.e12), porId.e12, '12'),
    3 - verticeReto(trianguloDe(porId.e12), porId.e12) -
      trianguloDe(porId.e12).angulos.findIndex(function (a, i) {
        return i !== verticeReto(trianguloDe(porId.e12), porId.e12) && Math.abs(a - 30) < 0.05;
      }));
}

/* ================================================================ pares envenenados */
console.log('\npares envenenados com o texto deste tema');
{
  const veneno = P.clonar(ctx.tema);
  const ex6 = veneno.pt.exercicios.find(function (e) { return e.n === 6; });
  ex6.enunciado = ex6.enunciado.replace(', como na figura', '');
  const ex2 = veneno.en.exercicios.find(function (e) { return e.n === 2; });
  ex2.enunciado = 'Using the figure below, write sin(45), cos(45) and tan(45).';
  conf('par envenenado: o 6 sem "na figura" e o 2 falando de figura sem ter sao acusados',
    P.semRemissao(veneno).join('; '),
    'pt 6 tem figura e nao remete a ela; en 2 fala da figura e nao tem nenhuma');
}
{
  const veneno = P.clonar(ctx.tema);
  const ex7 = veneno.pt.exercicios.find(function (e) { return e.n === 7; });
  ex7.enunciado = ex7.enunciado.replace('a 60 metros da base', 'a certa distância da base');
  conf('par envenenado: tirado o 60 do texto do 7, a figura que imprime 60 e acusada',
    P.numeroSoNoDesenho(veneno, 'pt', docPT.figurasDesenhadas || []).join('; '),
    'pt 7: a figura imprime 60 e o texto nao traz');
}
{
  const semLegenda = P.rascunho('@fig triangulo angulo=90 angulo=θ lado=c lado=a lado=b');
  conf('par envenenado: o triangulo de theta sem legenda sai com aviso de escala',
    semLegenda.avisos.filter(function (a) { return a.indexOf('fora de escala') >= 0; }).length, 1);
}

const saida = P.placar();
P.avisos(ctx);
process.exit(saida);
