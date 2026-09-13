/* figuras/_piloto_MATEM2-11.js
 * Gera os documentos do MATEM2-11, "Prismas e piramides", pelo caminho de
 * verdade: o gerarMaterialTema do pdf.js, lendo o tema do banco.
 *
 * Tudo o que e generico (a abertura do tema, o placar, os leitores de folha e as
 * travas 0 a 8) mora no _piloto_base.js. Aqui ficam so tres coisas: o ID, os
 * numeros editoriais deste tema e a medicao no fluxo da familia do solido e do
 * painel de solidos, mais o poligono regular da base hexagonal.
 *
 * Uso: node _piloto_MATEM2-11.js [caminho de outro banco.json ou do retrato]
 *
 * Regra da casa: nunca usar travessao.
 */
const P = require('./_piloto_base.js');

const ID = 'MATEM2-11';
const ctx = P.abrir({ id: ID, caminhoDoMd: 'temas/mat/em2/' + ID + '.md' });

const conf = P.conf, medido = P.medido;
const textos = P.textos, tem = P.tem, quadradinhos = P.quadradinhos, triangulos = P.triangulos;
const dist = P.dist, n2 = P.n2, n4 = P.n4;
const porId = ctx.porId, gabPorId = ctx.gabPorId, explic = ctx.explic;
const docPT = ctx.docPT, docEN = ctx.docEN;

/* ================================================================ travas genericas
 *
 * Escolha editorial escrita: 4 diretivas na explicacao (5 registros, porque o
 * painel dos dois solidos e duas celulas), 3 nos 18 enunciados, 1 no gabarito.
 *
 * Solido e o conteudo que menos sobrevive a prosa, e este tema chegou sem uma
 * figura. As quatro da explicacao sao as quatro frases que descreviam um
 * desenho. "Um prisma tem duas bases iguais e paralelas... uma piramide tem uma
 * unica base e um vertice fora do plano dela": as duas familias lado a lado, na
 * mesma escala e com a mesma altura h, e a definicao passa a ser vista.
 * "Quando a base e um triangulo equilatero de lado L": o prisma que tem essa
 * base, que ninguem monta de cabeca a partir da formula da area. "O hexagono
 * regular se divide em seis triangulos equilateros": a decomposicao, que e o
 * argumento inteiro da area da base hexagonal. E "altura, metade do lado da
 * base e apotema da face lateral": o triangulo retangulo escondido dentro da
 * piramide, que o texto so contava e que e a origem do erro mais caro do tema.
 *
 * A quarta usa `poligonoregular`, que nao esta na lista de receitas deste lote.
 * Esta escrito no relatorio e e deliberado: a receita ja existe, a frase e
 * literalmente uma decomposicao desenhada, e o hexagono e a unica base do tema
 * que o `solido` nao sabe desenhar. Sem ela o paragrafo continuaria descrevendo
 * um desenho em palavras.
 *
 * Nos enunciados, dois, e nos dois a configuracao nao cabe numa oracao porque e
 * TRIDIMENSIONAL: o 9 (a piramide de base 6 e altura 4, com o triangulo interno
 * que da o apotema m) e o 13 (o prisma de base retangular 3 por 8 e altura 5,
 * que sao tres dimensoes a segurar de uma vez).
 *
 * Dezesseis dos dezoito ficam sem figura nenhuma, muito acima do terco, e a
 * maior parte disso e LIMITE DO KIT e nao escolha. Estao no relatorio; os que
 * mais doem: o 5 e o 12 (diagonal do bloco e diagonal do cubo), porque o
 * `solido` nao tem chave de diagonal, e a diagonal do bloco e o Pitagoras
 * aplicado duas vezes que o proprio texto anuncia; o 16 (piramide pela ARESTA
 * LATERAL), porque nao ha chave de aresta lateral, e e o segundo dos tres
 * triangulos escondidos que a explicacao lista; o 10 (prisma de base HEXAGONAL),
 * porque o `solido` so faz base quadrada, retangular e triangular; e o 14, o 15
 * e o 18 (solido composto, solido furado e nivel de agua), porque nao ha
 * composicao de solidos.
 *
 * O 17 e um caso a parte e vale escrever inteiro, porque ele TINHA a figura e
 * ela foi retirada por defeito do kit. "Um prisma e uma piramide de MESMA base
 * e MESMA altura" so se ve lado a lado e na mesma escala, e a unica receita que
 * garante a mesma escala entre duas celulas e o `painelsolidos` (duas diretivas
 * `solido` seguidas saem em 9,57 e 10,49 pt por unidade, medido). So que a cota
 * de `aresta=` numa celula do painel e impressa EM CIMA do nome da celula, com
 * 4,73 por 5,99 pt de caixa cruzada, e a trava 7 reprova, com razao. Sem
 * `aresta=` a base nao e cotada, o painel fica chutado na proporcao do
 * prototipo e sai fora de escala. Entao o 17 fica sem figura, e o conserto e
 * PR de kit.
 *
 * No gabarito, so o 9. A resposta dele E lida na propria figura: o apotema da
 * base a vale 3, metade do lado, e o apotema da face m sai por Pitagoras. As
 * outras dezessete respostas sao conta, e figura ali gastaria meia folha
 * ensinando a conferir por semelhanca visual em vez de por argumento. */
P.travasGenericas(ctx, {
  /* As palavras deste tema que so existem em portugues, inclusive as duas que o
   * painel imprime pelo parametro da diretiva (prisma e pirâmide). */
  palavrasPt: ['\\bprisma\\b', 'pirâmide', 'apótema', 'aresta', 'altura',
    'hexágono', 'equilátero', 'cubo', 'diagonal do bloco'],
  diretivasNaExplicacao: { n: 4, rotulo: 'a explicacao tem 4 diretivas de figura' },
  enunciadosComFigura: {
    n: '9 13',
    rotulo: 'os enunciados 9 e 13 carregam figura, e so eles'
  },
  registrosNoMaterial: {
    n: 7,
    rotulo: 'o material desenha 7 registros: 3 figuras mais as 2 celulas do painel na explicacao, e 2 nos enunciados'
  },
  figurasNoGabarito: { n: 1, rotulo: 'e o gabarito tem 1 (o 9)' },
  idsDoGabarito: { n: 's9', rotulo: 'e o id do gabarito e o s9' },
  /* Nenhuma figura deste tema e chute: as numericas saem fieis por construcao e
   * as de letra saem do prototipo do painel, que e exato por construcao. */
  figurasForaDeEscala: { n: 'nenhuma', rotulo: 'nenhuma figura marcada fora de escala: todas saem exatas' }
});

/* ================================================================ medicao no fluxo
 * O que a folha AFIRMA com o desenho, medido no que vai sair impresso, e nao no
 * que a receita disse que ia desenhar. Os pontos-chave sao os que o solidos.js
 * devolve "para a receita cotar em cima". */

/* Do triangulo interno preenchido: o cateto horizontal (apotema da base) sobre
 * o vertical (altura), lidos nos pontos da area impressa. */
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

console.log('\nexplicacao: o painel das duas familias');
{
  const celulas = explic('painelsolidos');
  const ks = celulas.map(function (c) { return c.escala; });
  const nomes = [];
  celulas.forEach(function (c) { textos(c).forEach(function (t) { nomes.push(t); }); });
  medido('painel: ' + celulas.length + ' celulas, escala ' + ks.map(function (k) { return k.toFixed(4); }).join(' ') +
    '; textos ' + nomes.join(' '));
  conf('duas celulas, e as duas na MESMA escala: e o que faz a comparacao existir',
    celulas.length === 2 && Math.max.apply(null, ks) - Math.min.apply(null, ks) < 1e-9, true);
  conf('os dois nomes em portugues vieram da diretiva, e nao do desenhador',
    nomes.indexOf('prisma') >= 0 && nomes.indexOf('pirâmide') >= 0, true);
  const celulasEN = (docEN.figurasDesenhadas || []).filter(function (f) { return f.receita === 'painelsolidos'; });
  const nomesEN = [];
  celulasEN.forEach(function (c) { textos(c).forEach(function (t) { nomesEN.push(t); }); });
  conf('e os dois em ingles tambem, na mesma posicao',
    nomesEN.indexOf('prism') >= 0 && nomesEN.indexOf('pyramid') >= 0, true);
  conf('cada celula escreve so o nome e a altura h', nomes.sort().join(' '), 'h h pirâmide prisma');
  conf('as duas celulas saem com a MESMA altura desenhada, que e o que a palavra "mesma" afirma',
    Math.abs(celulas[0].caixa.altura - celulas[1].caixa.altura) < 1e-9, true);
}

console.log('\nexplicacao: o prisma de base triangular e o hexagono decomposto');
{
  const pt3 = explic('solido', 'prismatriangular')[0];
  const Q = pt3.saida.prisma;
  const lado = dist(Q.vertices.A, Q.vertices.B), alt = dist(Q.vertices.A, Q.vertices.D);
  /* O prototipo do prisma triangular vem do painel do solidos.js, e a razao
   * lado por altura dele e o que a figura em letras afirma. Nao se mede
   * igualdade das tres arestas da BASE na folha: em perspectiva cavaleira a
   * aresta de fuga sai reduzida a metade de proposito, entao a base equilatera
   * NAO sai equilatera na pagina, e essa e a convencao e nao um defeito. */
  medido('prisma triangular: lado ' + n2(lado) + ' pt, altura ' + n2(alt) + ' pt, razao ' +
    n4(lado / alt) + '; textos ' + textos(pt3).join(' '));
  conf('a figura escreve o L do lado e o h da altura, e nada mais', textos(pt3).sort().join(' '), 'L h');
  conf('as duas cotas de seta saem, uma para o lado e outra para a altura',
    pt3.tracos.filter(function (t) { return t.tipo === 'cota'; }).length, 2);
  conf('e ele sai exato, sem legenda de escala', pt3.foraDeEscala === false, true);

  const hex = explic('poligonoregular')[0];
  const lados = ((hex.medido || {}).segmentos || [])
    .filter(function (s) { return !s.varredura && Math.abs(s.w - 1.2) < 0.01; });
  const comp = lados.map(function (s) { return Math.hypot(s.x2 - s.x1, s.y2 - s.y1); });
  let cx = 0, cy = 0;
  lados.forEach(function (s) { cx += s.x1 + s.x2; cy += s.y1 + s.y2; });
  cx /= Math.max(1, 2 * lados.length); cy /= Math.max(1, 2 * lados.length);
  const raio = lados.length ? dist({ x: lados[0].x1, y: lados[0].y1 }, { x: cx, y: cy }) : 0;
  medido('hexagono: ' + lados.length + ' lados de contorno, comprimentos ' + comp.map(n2).join(' ') +
    ' pt; raio (centro a vertice) ' + n2(raio) + ' pt; textos ' + textos(hex).join(' '));
  conf('o hexagono tem seis lados iguais',
    lados.length === 6 && Math.max.apply(null, comp) - Math.min.apply(null, comp) < 0.02, true);
  conf('e cada lado mede o raio, que e o argumento de os seis triangulos serem equilateros',
    lados.length === 6 && Math.abs(comp[0] - raio) < 0.02, true);
  conf('L impresso duas vezes, no lado e no raio', tem(hex, 'L'), 2);
}

console.log('\nexplicacao: o triangulo escondido na piramide');
{
  const f = explic('solido', 'tipo=piramide')[0];
  const q = quadradinhos(f)[0], O = f.saida.O;
  medido('piramide em letras: textos ' + textos(f).join(' ') + '; quadradinho ' +
    (q && O ? 'a ' + n2(dist(q, O)) + ' pt do pe, abertura ' + n2(q.abertura) : 'ausente'));
  conf('a figura imprime exatamente a, h e m', textos(f).sort().join(' '), 'a h m');
  conf('o quadradinho esta no PE da altura e mede 90 graus na folha',
    !!q && !!O && dist(q, O) < 0.01 && Math.abs(q.abertura - 90) < 0.01, true);
  conf('o triangulo interno e a unica area preenchida', triangulos(f).length, 1);
  conf('e o apotema da base sai em verdadeira grandeza, do centro ate o meio de um lado',
    Math.abs(dist(f.saida.O, f.saida.M) - f.saida.piramide.aresta / 2) < 0.02, true);
}

console.log('\nexercicio 9: a piramide de base 6 e altura 4, e o seu gabarito');
{
  const f = porId.s9, sd = f.saida, q = quadradinhos(f)[0], c = catetosDoTriangulo(f);
  medido('apotema da base ' + n2(dist(sd.O, sd.M)) + ' pt contra metade da aresta ' +
    n2(sd.piramide.aresta / 2) + ' pt; catetos ' + n2(c.horizontal) + ' por ' + n2(c.vertical) +
    ' (razao ' + n4(c.horizontal / c.vertical) + ', pedido 3/4); textos ' + textos(f).join(' '));
  conf('o apotema da base desenhado e metade da aresta, que e o 3 da resposta',
    Math.abs(dist(sd.O, sd.M) - sd.piramide.aresta / 2) < 0.02, true);
  conf('o triangulo interno sai com os catetos na razao 3 por 4, que sao o apotema da base e a altura',
    Math.abs(c.horizontal / c.vertical - 0.75) < 1e-3, true);
  conf('quadradinho no pe da altura, reto na folha',
    !!q && dist(q, sd.O) < 0.01 && Math.abs(q.abertura - 90) < 0.01, true);
  conf('enunciado: so o 4 sai em numero, e o a e o m saem em letra (a aresta 6 mora no texto)',
    textos(f).sort().join(' '), '4 a m');
  const g = gabPorId.s9;
  medido('gabarito: textos ' + textos(g).join(' | '));
  conf('gabarito: m = 5 resolvido no apotema da face, que e o que o enunciado pergunta', tem(g, 'm = 5'), 1);
  conf('gabarito: o a colado fica letra, e o 4 continua', tem(g, 'a') === 1 && tem(g, '4') === 1, true);
  conf('gabarito: mesma escala e mesma caixa do enunciado',
    Math.abs(g.escala - f.escala) < 1e-9 && g.caixa.altura === f.caixa.altura, true);
  /* Par envenenado da medida: a piramide de base 8 e altura 4 nao pode passar
   * pela de base 6, porque o apotema da base muda com ela. */
  const outro = catetosDoTriangulo(P.rascunho('@fig solido tipo=piramide triangulo=sim aresta=8 altura=4 apotema=m apotemabase=a').figs[0]);
  medido('par envenenado, base 8 e altura 4: razao ' + n4(outro.horizontal / outro.vertical));
  conf('a mesma medida distingue a piramide de base 8', Math.abs(outro.horizontal / outro.vertical - 0.75) > 0.05, true);
}

console.log('\nexercicio 13: o prisma de base 3 por 8 e altura 5');
{
  const f = porId.s13;
  medido('textos ' + textos(f).join(' ') + '; marcas ativas ' + f.marcasAtivas);
  conf('as tres dimensoes do enunciado saem impressas, e nada mais',
    textos(f).sort().join(' '), ['3', '5', '8'].sort().join(' '));
  conf('e sao tres marcas, uma por dimensao', f.marcasAtivas, 3);
  conf('a figura sai exata, sem legenda de escala', f.foraDeEscala === false, true);
}

/* ================================================================ pares envenenados */
console.log('\npares envenenados com o texto deste tema');
{
  const veneno = P.clonar(ctx.tema);
  const ex13 = veneno.pt.exercicios.find(function (e) { return e.n === 13; });
  ex13.enunciado = ex13.enunciado.replace('da figura', 'a seguir');
  const ex3 = veneno.en.exercicios.find(function (e) { return e.n === 3; });
  ex3.enunciado = 'Find the volume of the cube in the figure, of edge 4.';
  conf('par envenenado: o 13 sem "da figura" e o 3 falando de figura sem ter sao acusados',
    P.semRemissao(veneno).join('; '),
    'pt 13 tem figura e nao remete a ela; en 3 fala da figura e nao tem nenhuma');
}
{
  const veneno = P.clonar(ctx.tema);
  const ex13 = veneno.pt.exercicios.find(function (e) { return e.n === 13; });
  ex13.enunciado = ex13.enunciado.replace('altura 5', 'altura dada');
  conf('par envenenado: tirado o 5 do texto do 13, a figura que imprime 5 e acusada',
    P.numeroSoNoDesenho(veneno, 'pt', docPT.figurasDesenhadas || []).join('; '),
    'pt 13: a figura imprime 5 e o texto nao traz');
}
{
  /* Os limites do kit que decidiram a lista de "ficou de fora" deste tema,
   * provados aqui para nao serem redescobertos. Cada um deles avisa e IGNORA a
   * chave, em vez de trocar a figura por baixo do pano. */
  const semDiagonal = P.rascunho('@fig solido tipo=prisma aresta=4 profundidade=3 altura=12 diagonal=d');
  medido('diagonal= no solido: ' + semDiagonal.figs.length + ' figura(s), avisos ' + semDiagonal.avisos.join(' | '));
  conf('limite do kit: diagonal= nao e chave declarada do solido, e a diretiva e acusada (bloqueia o 5 e o 12)',
    semDiagonal.avisos.filter(function (a) { return a.indexOf('chave nao declarada') >= 0 && a.indexOf('diagonal') >= 0; }).length, 1);
  const planifPrisma = P.rascunho('@fig solido tipo=prisma aresta=4 altura=6 planificacao=sim');
  conf('limite do kit: planificacao=sim so vale para o cone, e o kit avisa em vez de calar',
    planifPrisma.avisos.filter(function (a) { return a.indexOf('planificacao=sim so vale para cone') >= 0; }).length, 1);
  /* O defeito que tirou a figura do exercicio 17, provado nos dois sentidos: a
   * cota de aresta numa celula do painel sai EM CIMA do nome da celula, e a
   * mesma diretiva sem `aresta=` sai limpa. */
  const comAresta = P.rascunho('@fig painelsolidos ordem=prisma;piramide nome=prisma;pirâmide aresta=6 altura=10');
  const semAresta = P.rascunho('@fig painelsolidos ordem=prisma;piramide nome=prisma;pirâmide altura=h');
  medido('painel com aresta=6: ' + P.rotulosSobrepostos(comAresta.figs).join(' | '));
  conf('limite do kit: a cota de aresta= no painel e impressa em cima do nome da celula (bloqueia o 17)',
    P.rotulosSobrepostos(comAresta.figs).length, 2);
  conf('e a mesma diretiva sem aresta= sai sem rotulo nenhum sobreposto',
    P.rotulosSobrepostos(semAresta.figs).length, 0);
  /* E o outro defeito do painel, que e por que o 17 nao teria trava mesmo se a
   * cota nao colidisse: o painelsolidos nao repassa o id para as celulas, entao
   * as travas 3, 4 e 5, que casam figura com exercicio pelo id, ficam cegas
   * numa figura de enunciado feita com ele. */
  const comId = P.rascunho('@fig painelsolidos id=p9 ordem=prisma;piramide nome=prisma;pirâmide altura=h');
  conf('limite do kit: o painelsolidos nao repassa o id= para as celulas',
    comId.figs.filter(function (f) { return f.id === 'p9'; }).length, 0);
}

const saida = P.placar();
P.avisos(ctx);
process.exit(saida);
