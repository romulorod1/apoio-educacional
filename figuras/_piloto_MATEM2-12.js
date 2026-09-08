/* figuras/_piloto_MATEM2-12.js
 * Gera os documentos do MATEM2-12, "Cilindros, cones e esferas", pelo caminho de
 * verdade: o gerarMaterialTema do pdf.js, lendo o tema do banco.
 *
 * Tudo o que e generico (a abertura do tema, o placar, os leitores de folha e as
 * travas 0 a 8) mora no _piloto_base.js. Aqui ficam so tres coisas: o ID, os
 * numeros editoriais deste tema e a medicao no fluxo da familia do solido e do
 * painel de solidos.
 *
 * Uso: node _piloto_MATEM2-12.js [caminho de outro banco.json ou do retrato]
 *
 * Regra da casa: nunca usar travessao.
 */
const P = require('./_piloto_base.js');

const ID = 'MATEM2-12';
const ctx = P.abrir({ id: ID, caminhoDoMd: 'temas/mat/em2/' + ID + '.md' });

const conf = P.conf, medido = P.medido;
const textos = P.textos, tem = P.tem, quadradinhos = P.quadradinhos, triangulos = P.triangulos;
const dist = P.dist, n2 = P.n2, n4 = P.n4;
const porId = ctx.porId, explic = ctx.explic;
const docPT = ctx.docPT, docEN = ctx.docEN;

/* ================================================================ travas genericas
 *
 * Escolha editorial escrita: 2 diretivas na explicacao (4 registros, porque o
 * painel dos tres redondos sao tres celulas), 3 nos 18 enunciados, 0 no
 * gabarito.
 *
 * Na explicacao sao DUAS, e nao tres, e o motivo esta escrito abaixo em "o que
 * o kit nao desenha": a terceira frase que pedia desenho e "planificando a
 * superficie lateral do cilindro aparece um retangulo cuja base e o comprimento
 * da circunferencia", e planificacao no kit de hoje so existe para o CONE. As
 * duas que couberam sao as duas certas. "O cilindro tem duas bases circulares
 * iguais e paralelas, o cone tem uma base circular e um vertice, e a esfera e o
 * conjunto dos pontos a uma distancia fixa do centro": os tres lado a lado, na
 * mesma escala e com o mesmo r e o mesmo h das formulas. E "o raio, a altura e
 * a geratriz formam um triangulo retangulo, com a geratriz no papel de
 * hipotenusa": o triangulo interno do cone, que e o g2 = r2 + h2 que o texto so
 * contava e que e a origem do erro numero um do tema (usar a altura no lugar da
 * geratriz).
 *
 * Nos enunciados, tres, e nos tres a configuracao nao cabe numa oracao: o 10 (o
 * cone pela hipotenusa, que e a leitura INVERSA do triangulo interno: dados o
 * raio e a geratriz, achar a altura), o 12 (a esfera que toca a lateral e as
 * DUAS bases do cilindro, que sao tres oracoes subordinadas de posicao) e o 13
 * (o cilindro e o cone de MESMO raio e MESMA altura, que so se compara lado a
 * lado e na mesma escala).
 *
 * Quinze dos dezoito ficam sem figura nenhuma, muito acima do terco. Os que
 * ficaram de fora por LIMITE DO KIT: o 18 (cilindro furado ao longo do eixo) e
 * o 14 (cone com semiesfera colada), porque nao ha composicao de dois solidos
 * nem solido vazado; e o 16 (cone dado o volume e a altura), porque com um
 * unico comprimento numerico o raio sairia chutado e a figura sairia fora de
 * escala afirmando uma proporcao que o exercicio existe para achar.
 *
 * O gabarito nao tem figura nenhuma, e aqui a razao e uma limitacao MEDIDA do
 * kit e nao uma escolha de estilo. Na composicao `coneComTriangulo` so a
 * GERATRIZ recebe o valor resolvido na camada de gabarito; a altura e o raio
 * sao rotulos COLADOS e ficam como vieram (COLADOS_DA_COMPOSICAO no
 * receitas.js). O 10 pergunta justamente a ALTURA, entao "@fig id=s10
 * fase=gabarito" imprimiria a mesma figura do enunciado, com o mesmo h, sem
 * acrescentar nada: seria meia folha gasta para repetir o desenho. As outras
 * respostas do tema sao conta em funcao de pi. */
P.travasGenericas(ctx, {
  /* As palavras deste tema que so existem em portugues, inclusive as tres que o
   * painel imprime pelo parametro da diretiva. "volume" fica de fora de
   * proposito: e a mesma palavra nas duas linguas, e a trava A acusaria a folha
   * inglesa por uma palavra que ela pode escrever. */
  palavrasPt: ['cilindro', 'esfera', 'geratriz', 'raio', 'altura',
    'semiesfera', 'circunferência', 'redondos'],
  diretivasNaExplicacao: { n: 2, rotulo: 'a explicacao tem 2 diretivas de figura' },
  enunciadosComFigura: {
    n: '10 12 13',
    rotulo: 'os enunciados 10, 12 e 13 carregam figura, e so eles'
  },
  registrosNoMaterial: {
    n: 8,
    rotulo: 'o material desenha 8 registros: 1 figura mais as 3 celulas do painel na explicacao, e 2 mais 2 celulas nos enunciados'
  },
  figurasNoGabarito: { n: 0, rotulo: 'e o gabarito nao tem nenhuma' },
  idsDoGabarito: { n: '', rotulo: 'e portanto nenhum id de gabarito' },
  /* Nenhuma figura deste tema e chute: as numericas saem fieis por construcao e
   * as de letra saem do prototipo do painel, que e exato por construcao. */
  figurasForaDeEscala: { n: 'nenhuma', rotulo: 'nenhuma figura marcada fora de escala: todas saem exatas' }
});

/* ================================================================ medicao no fluxo
 * O que a folha AFIRMA com o desenho, medido no que vai sair impresso. */

/* Do triangulo interno preenchido: o cateto horizontal (o raio) sobre o
 * vertical (a altura), lidos nos pontos da area impressa. */
function catetosDoTriangulo(f) {
  const t = triangulos(f)[0];
  if (!t) return null;
  const Q = t.pts;
  let horizontal = 0, vertical = 0;
  for (let i = 0; i < 3; i++) {
    const a = Q[i], b = Q[(i + 1) % 3];
    if (Math.abs(a.y - b.y) < 0.05) horizontal = Math.abs(a.x - b.x);
    if (Math.abs(a.x - b.x) < 0.05) vertical = Math.abs(a.y - b.y);
  }
  return { horizontal: horizontal, vertical: vertical };
}

console.log('\nmedicao no fluxo');

console.log('\ntoda circunferencia da planificacao sai redonda, e as dos solidos sao elipses');
{
  let voltas = 0, elipses = 0, piorRadial = 0;
  (docPT.paginas || []).forEach(function (pag) {
    P.voltasInteiras(P.lerCaminhos(pag.ops || [])).forEach(function (v) {
      const pts = P.pontosDoSub(v, 24), c = P.caixaDe(pts);
      const r = (c.largura + c.altura) / 4;
      let radial = 0;
      for (const p of pts) radial = Math.max(radial, Math.abs(dist(p, { x: c.cx, y: c.cy }) - r));
      if (radial > 1) { elipses++; return; }
      voltas++;
      piorRadial = Math.max(piorRadial, radial);
    });
  });
  medido(voltas + ' voltas inteiras redondas e ' + elipses + ' voltas inteiras achatadas no material; pior desvio radial ' + n4(piorRadial) + ' pt');
  /* A conta so ve VOLTA INTEIRA, e a base de um solido em perspectiva sai
   * partida em duas metades (a de tras tracejada e a da frente cheia), entao
   * ela nao entra aqui. O que entra e a tampa do cilindro, que e elipse
   * fechada, e a silhueta da esfera, que e circunferencia de verdade. */
  conf('ha volta achatada no material: e a tampa do cilindro em perspectiva', elipses >= 2, true);
  conf('e a esfera sai redonda de verdade, e nao ovalada', voltas >= 1 && piorRadial < 0.05, true);
}

console.log('\nexplicacao: o painel dos tres solidos redondos');
{
  /* O painelsolidos nao repassa o id= para as celulas, entao o painel do
   * exercicio 13 tambem cai na lista "sem id" que o explic() usa. A separacao
   * possivel e pela propria diretiva, e ela esta escrita aqui em vez de
   * escondida: a da explicacao e a de raio=r. */
  const celulas = explic('painelsolidos', 'raio=r');
  const ks = celulas.map(function (c) { return c.escala; });
  const nomes = [];
  celulas.forEach(function (c) { textos(c).forEach(function (t) { nomes.push(t); }); });
  medido('painel: ' + celulas.length + ' celulas, escala ' + ks.map(function (k) { return k.toFixed(4); }).join(' ') +
    '; textos ' + nomes.join(' '));
  conf('tres celulas, e as tres na MESMA escala', celulas.length === 3 && Math.max.apply(null, ks) - Math.min.apply(null, ks) < 1e-9, true);
  conf('os tres nomes em portugues vieram da diretiva, e nao do desenhador',
    ['cilindro', 'cone', 'esfera'].every(function (n) { return nomes.indexOf(n) >= 0; }), true);
  const celulasEN = (docEN.figurasDesenhadas || []).filter(function (f) {
    return f.receita === 'painelsolidos' && String(f.diretiva).indexOf('raio=r') >= 0;
  });
  const nomesEN = [];
  celulasEN.forEach(function (c) { textos(c).forEach(function (t) { nomesEN.push(t); }); });
  conf('e os tres em ingles tambem', ['cylinder', 'cone', 'sphere'].every(function (n) { return nomesEN.indexOf(n) >= 0; }), true);
  conf('a esfera nao ganha altura: so o cilindro e o cone tem h',
    nomes.filter(function (t) { return t === 'h'; }).length === 2 &&
    nomes.filter(function (t) { return t === 'r'; }).length === 3, true);
}

console.log('\nexplicacao: o triangulo interno do cone');
{
  const f = explic('solido', 'raio=r')[0];
  const q = quadradinhos(f)[0], O = f.saida.O;
  medido('cone em letras: textos ' + textos(f).join(' ') + '; quadradinho ' +
    (q && O ? 'a ' + n2(dist(q, O)) + ' pt do pe, abertura ' + n2(q.abertura) : 'ausente'));
  conf('a figura imprime exatamente g, h e r', textos(f).sort().join(' '), 'g h r');
  conf('o quadradinho esta no PE da altura, no centro da base, e mede 90 graus na folha',
    !!q && !!O && dist(q, O) < 0.01 && Math.abs(q.abertura - 90) < 0.01, true);
  conf('o triangulo interno e a unica area preenchida', triangulos(f).length, 1);
  conf('e ele sai exato, sem legenda de escala', f.foraDeEscala === false, true);
}

console.log('\nexercicio 10: o cone de raio 6 e geratriz 10');
{
  const f = porId.s10, c = catetosDoTriangulo(f), q = quadradinhos(f)[0];
  medido('cateto horizontal ' + n2(c.horizontal) + ' pt (o raio), vertical ' + n2(c.vertical) +
    ' pt (a altura), razao ' + n4(c.horizontal / c.vertical) + ' (pedido 6/8 = 0,7500); textos ' + textos(f).join(' '));
  conf('raio por altura na folha e 6 por 8: a altura DESENHADA e o 8 que o exercicio pergunta',
    Math.abs(c.horizontal / c.vertical - 0.75) < 1e-3, true);
  conf('o 6 do raio e o 10 da geratriz saem em numero, e a altura pedida sai em letra',
    textos(f).sort().join(' '), ['10', '6', 'h'].sort().join(' '));
  conf('quadradinho no pe da altura, reto na folha',
    !!q && dist(q, f.saida.O) < 0.01 && Math.abs(q.abertura - 90) < 0.01, true);
  /* A conta fecha na folha: a geratriz desenhada e a hipotenusa do 6 com o 8. */
  const k = c.horizontal / 6;
  medido('escala ' + n4(k) + ' pt por unidade; geratriz medida ' +
    n4(Math.hypot(c.horizontal, c.vertical) / k) + ' (pedida 10)');
  conf('a geratriz desenhada mede 10, que e o dado do enunciado',
    Math.abs(Math.hypot(c.horizontal, c.vertical) / k - 10) < 0.01, true);
  /* Par envenenado da medida: o cone de raio 6 e geratriz 12 nao pode passar
   * pelo de geratriz 10, porque a altura muda com ela. */
  const outro = catetosDoTriangulo(P.rascunho('@fig solido tipo=cone triangulo=sim raio=6 geratriz=12 altura=h').figs[0]);
  medido('par envenenado, geratriz 12: razao ' + n4(outro.horizontal / outro.vertical));
  conf('a mesma medida distingue o cone de geratriz 12', Math.abs(outro.horizontal / outro.vertical - 0.75) > 0.05, true);
}

console.log('\nexercicio 12: a esfera inscrita no cilindro de raio 3 e altura 6');
{
  const f = porId.s12, sd = f.saida;
  const circ = ((f.medido || {}).arcos || []).filter(function (a) {
    return a.abertura > 359 && Math.abs(a.raio - sd.raio) < 0.1;
  });
  conf('a esfera esta no fluxo como uma circunferencia de raio 3k', circ.length, 1);
  if (circ.length) {
    const c = circ[0];
    const dFundo = Math.abs((c.cy - c.raio) - sd.cilindro.centroBase.y);
    const dTopo = Math.abs((c.cy + c.raio) - sd.cilindro.centroTopo.y);
    const dLat = Math.abs((c.cx + c.raio) - sd.cilindro.baseDir.x);
    medido('esfera: fundo a ' + n2(dFundo) + ' pt do centro da base, topo a ' + n2(dTopo) +
      ' pt do centro da tampa, lado a ' + n2(dLat) + ' pt da silhueta');
    conf('a esfera TOCA as duas bases e a lateral, que sao as tres oracoes do enunciado (teto 0,05 pt)',
      dFundo < 0.05 && dTopo < 0.05 && dLat < 0.05, true);
  }
  const cotas = f.tracos.filter(function (t) { return t.tipo === 'cota'; });
  conf('a cota da altura mede o diametro da esfera, que e por que o 6 e o dobro do 3',
    cotas.length === 1 && Math.abs(Math.abs(cotas[0].y2 - cotas[0].y1) - 2 * sd.raio) < 0.02, true);
  conf('a figura imprime o 3 do raio e o 6 da altura, e nada mais',
    textos(f).sort().join(' '), ['3', '6'].sort().join(' '));
  conf('e nenhum volume aparece desenhado: os tres valores sao o que a questao pergunta',
    textos(f).filter(function (t) { return t === '18π' || t === '54π' || t === '36π'; }).length, 0);
}

console.log('\nexercicio 13: o cilindro e o cone de mesmo raio e mesma altura');
{
  const celulas = (docPT.figurasDesenhadas || []).filter(function (f) {
    return f.receita === 'painelsolidos' && String(f.diretiva).indexOf('raio=6') >= 0;
  });
  const ks = celulas.map(function (c) { return c.escala; });
  const nomes = [];
  celulas.forEach(function (c) { textos(c).forEach(function (t) { nomes.push(t); }); });
  medido('painel do 13: ' + celulas.length + ' celulas, escala ' + ks.map(function (k) { return k.toFixed(4); }).join(' ') +
    '; textos ' + nomes.join(' '));
  conf('duas celulas na MESMA escala: sem isso o "mesmo raio e mesma altura" do enunciado nao se ve',
    celulas.length === 2 && Math.max.apply(null, ks) - Math.min.apply(null, ks) < 1e-9, true);
  conf('as duas escrevem o 6 do raio e o 9 da altura',
    nomes.filter(function (t) { return t === '6'; }).length === 2 &&
    nomes.filter(function (t) { return t === '9'; }).length === 2, true);
  /* A trava 4 generica NAO cobre esta figura, porque o painelsolidos nao
   * repassa o id= para as celulas e o casamento figura com exercicio e feito
   * pelo id. Entao a conferencia e feita aqui a mao, nas duas linguas: todo
   * numero que o painel imprime tem que estar no texto do item 13. */
  const item13 = { pt: ctx.tema.pt.exercicios.find(function (e) { return e.n === 13; }).enunciado,
    en: ctx.tema.en.exercicios.find(function (e) { return e.n === 13; }).enunciado };
  const soltos = [];
  ['pt', 'en'].forEach(function (lg) {
    const doc = lg === 'pt' ? docPT : docEN;
    (doc.figurasDesenhadas || []).filter(function (f) {
      return f.receita === 'painelsolidos' && String(f.diretiva).indexOf('raio=6') >= 0;
    }).forEach(function (f) {
      textos(f).forEach(function (t) {
        if (/^-?\d+([.,]\d+)?$/.test(String(t)) && item13[lg].indexOf(String(t)) < 0) {
          soltos.push(lg + ' 13: a figura imprime ' + t + ' e o texto nao traz');
        }
      });
    });
  });
  medido('trava 4 refeita a mao (o painel nao tem id e a generica fica cega): ' + (soltos.join('; ') || 'nenhum numero solto'));
  conf('todo numero que o painel do 13 imprime esta no texto do item, nas duas linguas',
    soltos.join('; ') || 'nenhum', 'nenhum');
}

/* ================================================================ pares envenenados */
console.log('\npares envenenados com o texto deste tema');
{
  const veneno = P.clonar(ctx.tema);
  const ex12 = veneno.pt.exercicios.find(function (e) { return e.n === 12; });
  ex12.enunciado = ex12.enunciado.replace('da figura', 'a seguir');
  const ex1 = veneno.en.exercicios.find(function (e) { return e.n === 1; });
  ex1.enunciado = 'Find the volume of the cylinder in the figure, of radius 3 and height 10.';
  conf('par envenenado: o 12 sem "da figura" e o 1 falando de figura sem ter sao acusados',
    P.semRemissao(veneno).join('; '),
    'pt 12 tem figura e nao remete a ela; en 1 fala da figura e nao tem nenhuma');
}
{
  const veneno = P.clonar(ctx.tema);
  const ex10 = veneno.pt.exercicios.find(function (e) { return e.n === 10; });
  ex10.enunciado = ex10.enunciado.replace('geratriz 10', 'geratriz conhecida');
  conf('par envenenado: tirado o 10 do texto do exercicio 10, a figura que imprime 10 e acusada',
    P.numeroSoNoDesenho(veneno, 'pt', docPT.figurasDesenhadas || []).join('; '),
    'pt 10: a figura imprime 10 e o texto nao traz');
}
{
  /* Os limites do kit que decidiram a lista de "ficou de fora" deste tema,
   * provados aqui para nao serem redescobertos. O primeiro e o que custou a
   * terceira figura da explicacao: planificacao so existe para o cone, e a
   * frase do texto que pedia desenho fala da planificacao do CILINDRO. */
  const planifCilindro = P.rascunho('@fig solido tipo=cilindro raio=3 altura=10 planificacao=sim');
  conf('limite do kit: planificacao=sim so vale para o cone, e o cilindro so avisa e ignora',
    planifCilindro.avisos.filter(function (a) { return a.indexOf('planificacao=sim so vale para cone') >= 0; }).length, 1);
  /* O segundo e o que tirou a figura do 16: com um unico comprimento numerico o
   * resto sai chutado e a figura sai fora de escala, cobrando legenda. */
  const soAltura = P.rascunho('@fig solido tipo=cone triangulo=sim altura=8 raio=r geratriz=g');
  medido('cone so com a altura numerica: fora de escala = ' + (soAltura.figs[0] || {}).foraDeEscala);
  conf('limite do kit: cone com um unico comprimento numerico sai FORA DE ESCALA, e por isso o 16 fica sem figura',
    (soAltura.figs[0] || {}).foraDeEscala, true);
  /* E o terceiro, que vale para os dois temas de solido: o painelsolidos nao
   * repassa o id= para as celulas, entao uma figura de enunciado feita com ele
   * fica invisivel para as travas 3, 4 e 5, que casam figura com exercicio pelo
   * id. Por isso a trava 4 do 13 foi refeita a mao, acima. */
  const comId = P.rascunho('@fig painelsolidos id=p13 ordem=cilindro;cone nome=cilindro;cone raio=6 altura=9');
  conf('limite do kit: o painelsolidos nao repassa o id= para as celulas',
    comId.figs.filter(function (f) { return f.id === 'p13'; }).length, 0);
}

const saida = P.placar();
P.avisos(ctx);
process.exit(saida);
