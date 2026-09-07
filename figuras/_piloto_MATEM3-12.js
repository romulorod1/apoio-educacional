/* figuras/_piloto_MATEM3-12.js
 * Gera os documentos do MATEM3-12, "Revisao: geometria plana e espacial", pelo
 * caminho de verdade: o gerarMaterialTema do pdf.js, lendo o tema do
 * temas/banco.json, que e o mesmo arquivo que o tablet consome.
 *
 * Tudo o que e generico (a abertura do tema, o placar, os leitores de folha e
 * as travas 0 a 8) mora no _piloto_base.js. Aqui ficam so tres coisas: o ID, os
 * numeros editoriais deste tema e a medicao no fluxo que solidos e circulos
 * pedem (os modelos sao a _prova_receitas_solidos.js e a
 * _prova_receitas_circulo.js), mais os pares envenenados com o texto deste
 * tema.
 *
 * Uso: node _piloto_MATEM3-12.js [caminho de outro banco.json ou do retrato]
 *   O segundo argumento aceita o banco inteiro ({"temas": [...]}) ou o objeto
 *   de um tema so, do jeito que o gerar_banco.ler devolve. O retrato de um tema
 *   (figuras/_tema_MATEM3-12.json, gitignored) prova uma edicao do .md sem
 *   regravar o temas/banco.json enquanto outro autor escreve outro tema.
 *
 * Sai em quatro arquivos, tres em portugues e um em ingles:
 *   _exemplo_MATEM3-12_material.pdf   explicacao, lista e gabarito
 *   _exemplo_MATEM3-12_lista.pdf      so a lista, com espaco para responder
 *   _exemplo_MATEM3-12_gabarito.pdf   so o gabarito (a camada pelo id, sozinha)
 *   _exemplo_MATEM3-12_en.pdf         a folha inglesa inteira
 *
 * Regra da casa: nunca usar travessao.
 */
const P = require('./_piloto_base.js');
const PDFGen = P.PDFGen;

const ID = 'MATEM3-12';
const ctx = P.abrir({ id: ID, caminhoDoMd: 'temas/mat/em3/' + ID + '.md' });

const conf = P.conf, medido = P.medido;
const textos = P.textos, tem = P.tem, triangulos = P.triangulos, quadradinhos = P.quadradinhos;
const dist = P.dist, n2 = P.n2, n4 = P.n4;
const porId = ctx.porId, gabPorId = ctx.gabPorId, explic = ctx.explic;
const docPT = ctx.docPT, docGab = ctx.docGab, docEN = ctx.docEN;

/* ================================================================ travas genericas
 *
 * Escolha editorial escrita: 5 na explicacao, 7 nos 18 enunciados, 3 no
 * gabarito. O tema chegou sem UMA figura, num assunto em que o livro didatico
 * desenha em toda pagina, e a regua e essa: o que um bom livro do 3o ano traria
 * naquele ponto.
 *
 * Na explicacao, as cinco figuras sao as cinco frases que descreviam um
 * desenho em palavras: o hexagono "formado por seis triangulos equilateros"
 * (agora decomposto, com L no lado e L no raio, que e o argumento de o
 * triangulo ser equilatero); o setor "de angulo central alfa" (a fracao
 * alfa/360, com o arco destacado); os cinco solidos, lado a lado e com nome,
 * antes das formulas de cada um; a piramide com o triangulo interno, que e o
 * m2 = h2 + a2 que o texto so contava; e o cone com o triangulo interno, que e
 * o g2 = r2 + h2. O circulo sozinho com r e O ficou de fora: o setor ja traz
 * r e O, e uma segunda circunferencia na mesma pagina so repetiria.
 *
 * Nos enunciados, figura onde a configuracao nao cabe numa oracao: 8 e 9
 * (o triangulo interno, com m e g no lugar exato), 14 (o quadrado com os dois
 * circulos e a regiao hachurada, que o texto descrevia em tres oracoes), 15
 * (prisma de base triangular), 16 (o setor de 30 graus hachurado), 17 (o
 * semicirculo que vira cone, a figura mais necessaria do tema) e 18 (a esfera
 * inscrita). Os numeros continuam no texto, e o texto remete ("da figura"),
 * que e a forma do MAT08-13 e a regra de que nenhum dado numerico existe so
 * no desenho. O 12 (hexagono de lado 4) ficou SEM figura de proposito: a
 * figura da explicacao ja mostra a decomposicao em letras, dar de novo com o
 * 4 entrega o argumento que o exercicio existe para cobrar, e o enunciado e
 * uma oracao so. Onze exercicios ficam sem figura nenhuma, acima do terco.
 *
 * No gabarito, a figura volta so onde a resposta E uma construcao lida no
 * desenho: 8 (m = 5, com o a que o texto diz valer 3), 17 (g = 10, a geratriz
 * que e o raio do semicirculo, que o texto de antes nao dizia) e 18 (h = 6,
 * a altura que e o diametro da esfera). O 9 e conta pura sobre o triangulo
 * que o enunciado ja mostra, e fica em texto. */
P.travasGenericas(ctx, {
  /* As palavras deste tema que so existem em portugues, inclusive as que a
   * figura imprime pelo parametro (os nomes do painel e a glosa da hachura). */
  palavrasPt: ['\\bprisma\\b', 'cilindro', 'pirâmide', 'esfera', 'geratriz',
    'apótema', 'hachurad', 'região', 'setor ', 'graus'],
  diretivasNaExplicacao: { n: 5, rotulo: 'a explicacao tem 5 figuras' },
  enunciadosComFigura: {
    n: '8 9 14 15 16 17 18',
    rotulo: 'os enunciados 8, 9, 14, 15, 16, 17 e 18 carregam figura, e so eles'
  },
  registrosNoMaterial: {
    n: 16,
    rotulo: 'o material desenha 16 registros: 4 figuras mais as 5 celulas do painel na explicacao, e 7 nos enunciados'
  },
  figurasNoGabarito: { n: 3, rotulo: 'e o gabarito tem 3 (8, 17 e 18)' },
  idsDoGabarito: { n: 's8 s17 s18', rotulo: 'as tres do gabarito sao as dos ids s8, s17 e s18' },
  hachurasMinimas: { n: 6, rotulo: 'ha hachura para glosar (o setor de alfa, o 14 e o 16, em cada lingua)' }
});

/* ================================================================ medicao no fluxo
 * O que a folha AFIRMA com o desenho, medido no que vai sair impresso, e nao no
 * que a receita disse que ia desenhar. Os leitores sao os das duas folhas de
 * prova: o de caminhos da _prova_receitas_circulo.js (toda circunferencia sai
 * redonda) e os pontos-chave que o solidos.js devolve "para a receita cotar em
 * cima" (_prova_receitas_solidos.js). */

/* Do triangulo interno preenchido: o cateto horizontal (raio ou apotema da
 * base) sobre o vertical (altura), lidos nos pontos da area impressa. */
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

console.log('\ntoda circunferencia sai redonda');
{
  let piorAniso = 0, piorRadial = 0, quantas = 0;
  [docPT, docGab].forEach(function (d) {
    (d.paginas || []).forEach(function (pag) {
      P.voltasInteiras(P.lerCaminhos(pag.ops || [])).forEach(function (v) {
        const pts = P.pontosDoSub(v, 24), c = P.caixaDe(pts);
        const r = (c.largura + c.altura) / 4;
        let radial = 0;
        for (const p of pts) radial = Math.max(radial, Math.abs(dist(p, { x: c.cx, y: c.cy }) - r));
        /* As elipses dos solidos em perspectiva nao sao circunferencias e
         * ficam de fora; quem e circulo de verdade tem desvio radial nulo. */
        if (radial > 1) return;
        quantas++;
        piorAniso = Math.max(piorAniso, Math.abs(c.largura - c.altura));
        piorRadial = Math.max(piorRadial, radial);
      });
    });
  });
  medido(quantas + ' circunferencias inteiras no material e no gabarito; pior anisotropia ' + n4(piorAniso) + ' pt, pior desvio radial ' + n4(piorRadial) + ' pt');
  conf('ha o que medir: ao menos 5 (o setor de alfa, as duas do 14, a do 16 e a esfera do 18)', quantas >= 5, true);
  conf('nenhuma anisotropia acima de 0,5 pt', piorAniso < 0.5, true);
  conf('e o desvio radial do Bezier fica abaixo de 0,05 pt', piorRadial < 0.05, true);
}

console.log('\nexplicacao: o hexagono e o setor');
{
  const h = explic('poligonoregular')[0];
  const lados = ((h && h.medido && h.medido.segmentos) || []).filter((s) => !s.varredura && Math.abs(s.w - 1.2) < 0.01);
  const comp = lados.map((s) => Math.hypot(s.x2 - s.x1, s.y2 - s.y1));
  let cx = 0, cy = 0;
  lados.forEach((s) => { cx += s.x1 + s.x2; cy += s.y1 + s.y2; });
  cx /= Math.max(1, 2 * lados.length); cy /= Math.max(1, 2 * lados.length);
  const raio = lados.length ? dist({ x: lados[0].x1, y: lados[0].y1 }, { x: cx, y: cy }) : 0;
  medido('hexagono: ' + lados.length + ' lados de contorno, comprimentos ' + comp.map(n2).join(' ') + ' pt; raio (centro a vertice) ' + n2(raio) + ' pt');
  conf('o hexagono tem seis lados iguais', lados.length === 6 && Math.max.apply(null, comp) - Math.min.apply(null, comp) < 0.02, true);
  conf('e cada lado mede o raio, que e o argumento de o triangulo ser equilatero', lados.length === 6 && Math.abs(comp[0] - raio) < 0.02, true);
  conf('L impresso duas vezes (no lado e no raio) e um triangulo chapado', tem(h, 'L') === 2 && triangulos(h).length === 1, true);
  /* Par envenenado da medida: no pentagono o lado NAO mede o raio, e a mesma
   * conta tem que dizer isso. */
  const p5 = P.rascunho('@fig poligonoregular lados=5 lado=L raio=L decomposto=sim').figs[0];
  const l5 = ((p5 && p5.medido && p5.medido.segmentos) || []).filter((s) => !s.varredura && Math.abs(s.w - 1.2) < 0.01);
  let c5x = 0, c5y = 0;
  l5.forEach((s) => { c5x += s.x1 + s.x2; c5y += s.y1 + s.y2; });
  c5x /= Math.max(1, 2 * l5.length); c5y /= Math.max(1, 2 * l5.length);
  const lado5 = l5.length ? Math.hypot(l5[0].x2 - l5[0].x1, l5[0].y2 - l5[0].y1) : 0;
  const raio5 = l5.length ? dist({ x: l5[0].x1, y: l5[0].y1 }, { x: c5x, y: c5y }) : 0;
  medido('par envenenado, pentagono: lado ' + n2(lado5) + ' pt contra raio ' + n2(raio5) + ' pt');
  conf('a mesma medida acusa o pentagono, em que lado e raio diferem', l5.length === 5 && Math.abs(lado5 - raio5) > 2, true);

  const s = explic('circulo')[0];
  const arcos = ((s && s.medido && s.medido.arcos) || []).map((a) => a.abertura);
  medido('setor de alfa: aberturas no fluxo ' + arcos.map((a) => a.toFixed(1)).join(', ') + '; textos ' + textos(s).join(' '));
  conf('o setor de alfa imprime alfa, r e O, e nada mais', textos(s).sort().join(' '), 'O r α');
  conf('e tem os dois arcos do angulo central (o destacado e o da marca)', arcos.filter((a) => a > 10 && a < 350).length >= 2, true);
  conf('o setor esta hachurado', P.ehHachurada(s), true);
}

console.log('\nexplicacao: o painel e os dois triangulos internos');
{
  const celulas = explic('painelsolidos');
  const ks = celulas.map((c) => c.escala);
  medido('painel: ' + celulas.length + ' celulas, escala ' + ks.map((k) => k.toFixed(4)).join(' '));
  conf('cinco celulas na mesma escala', celulas.length === 5 && Math.max.apply(null, ks) - Math.min.apply(null, ks) < 1e-9, true);
  const nomesPT = [];
  celulas.forEach((c) => textos(c).forEach((t) => nomesPT.push(t)));
  conf('os cinco nomes em portugues vieram da diretiva', ['prisma', 'cilindro', 'pirâmide', 'cone', 'esfera'].every((n) => nomesPT.indexOf(n) >= 0), true);
  const celulasEN = (docEN.figurasDesenhadas || []).filter((f) => f.receita === 'painelsolidos');
  const nomesEN = [];
  celulasEN.forEach((c) => textos(c).forEach((t) => nomesEN.push(t)));
  conf('e os cinco em ingles tambem', ['prism', 'cylinder', 'pyramid', 'cone', 'sphere'].every((n) => nomesEN.indexOf(n) >= 0), true);
  conf('as celulas so escrevem r e h alem do nome', nomesPT.filter((t) => t === 'r' || t === 'h').length === 7 && nomesPT.length === 12, true);

  const pir = explic('solido', 'tipo=piramide')[0], cone = explic('solido', 'tipo=cone')[0];
  [['piramide', pir, 'a h m'], ['cone', cone, 'g h r']].forEach(function (par) {
    const f = par[1], q = quadradinhos(f)[0], O = f && f.saida ? f.saida.O : null;
    medido(par[0] + ' em letras: textos ' + textos(f).join(' ') + '; quadradinho ' + (q && O ? 'a ' + n2(dist(q, O)) + ' pt do pe, abertura ' + n2(q.abertura) : 'ausente'));
    conf(par[0] + ' em letras imprime exatamente ' + par[2], textos(f).sort().join(' '), par[2]);
    conf(par[0] + ': o quadradinho esta no pe da altura e mede 90 na folha', !!q && !!O && dist(q, O) < 0.01 && Math.abs(q.abertura - 90) < 0.01, true);
    conf(par[0] + ': o triangulo interno e a unica area preenchida', triangulos(f).length, 1);
  });
}

console.log('\nexercicio 9: o cone de 6 por 8');
{
  const f = porId.s9, c = catetosDoTriangulo(f), q = quadradinhos(f)[0];
  medido('cateto horizontal ' + n2(c.horizontal) + ' pt, vertical ' + n2(c.vertical) + ' pt, razao ' + n4(c.horizontal / c.vertical) + ' (pedido 6/8 = 0,7500); textos ' + textos(f).join(' '));
  conf('raio por altura na folha e 6/8', Math.abs(c.horizontal / c.vertical - 0.75) < 1e-3, true);
  conf('6 e 8 impressos, g em letra', tem(f, '6') === 1 && tem(f, '8') === 1 && tem(f, 'g') === 1, true);
  conf('quadradinho no pe da altura, reto na folha', !!q && dist(q, f.saida.O) < 0.01 && Math.abs(q.abertura - 90) < 0.01, true);
  /* Par envenenado da medida: o cone de 6 por 9 nao pode passar por 6 por 8. */
  const outro = catetosDoTriangulo(P.rascunho('@fig solido tipo=cone triangulo=sim raio=6 altura=9 geratriz=g').figs[0]);
  medido('par envenenado, cone 6 por 9: razao ' + n4(outro.horizontal / outro.vertical));
  conf('a mesma medida distingue o cone de 6 por 9', Math.abs(outro.horizontal / outro.vertical - 0.75) > 0.05, true);
}

console.log('\nexercicio 8: a piramide de 6 por 4 e o seu gabarito');
{
  const f = porId.s8, sd = f.saida, q = quadradinhos(f)[0], c = catetosDoTriangulo(f);
  medido('apotema da base ' + n2(dist(sd.O, sd.M)) + ' pt contra metade da aresta ' + n2(sd.piramide.aresta / 2) + ' pt; catetos ' + n2(c.horizontal) + ' por ' + n2(c.vertical) + ' (razao ' + n4(c.horizontal / c.vertical) + ', pedido 3/4); textos ' + textos(f).join(' '));
  conf('o apotema da base sai em verdadeira grandeza, metade da aresta', Math.abs(dist(sd.O, sd.M) - sd.piramide.aresta / 2) < 0.02, true);
  conf('quadradinho no pe da altura, reto na folha', !!q && dist(q, sd.O) < 0.01 && Math.abs(q.abertura - 90) < 0.01, true);
  conf('enunciado: 4 impresso, a e m em letra (a aresta 6 mora no texto)', textos(f).sort().join(' '), '4 a m');
  const g = gabPorId.s8;
  medido('gabarito: textos ' + textos(g).join(' | '));
  conf('gabarito: m = 5 resolvido no apotema da face', tem(g, 'm = 5'), 1);
  conf('gabarito: o a colado fica letra, e o 4 continua', tem(g, 'a') === 1 && tem(g, '4') === 1, true);
  conf('gabarito: mesma escala e mesma caixa do enunciado', Math.abs(g.escala - f.escala) < 1e-9 && g.caixa.altura === f.caixa.altura, true);
}

console.log('\nexercicio 14: o quadrado com os dois circulos');
{
  const f = porId.q14, k = f.escala;
  const voltas = ((f.medido || {}).arcos || []).filter((a) => a.abertura > 359).sort((a, b) => a.raio - b.raio);
  const lados = ((f.medido || {}).segmentos || []).filter((s) => !s.varredura && Math.abs(s.w - 1.2) < 0.01);
  const comp = lados.map((s) => Math.hypot(s.x2 - s.x1, s.y2 - s.y1));
  medido('circunferencias de raio ' + voltas.map((v) => n2(v.raio)).join(' e ') + ' pt (razao ' + (voltas.length === 2 ? n4(voltas[1].raio / voltas[0].raio) : '?') + '); quadrado com ' + lados.length + ' lados de ' + comp.map(n2).join(' ') + ' pt; 10 unidades = ' + n2(10 * k) + ' pt');
  conf('duas circunferencias, a circunscrita com raio raiz de 2 vezes a inscrita', voltas.length === 2 && Math.abs(voltas[1].raio / voltas[0].raio - Math.SQRT2) < 1e-3, true);
  conf('o quadrado tem quatro lados de 10 unidades', lados.length === 4 && comp.every((L) => Math.abs(L - 10 * k) < 0.05), true);
  conf('e a inscrita toca os lados: o raio dela e metade do lado', voltas.length === 2 && Math.abs(voltas[0].raio - 5 * k) < 0.05, true);
  conf('10 impresso, r e R em letra, quadradinho na tangencia', tem(f, '10') === 1 && tem(f, 'r') === 1 && tem(f, 'R') === 1 && quadradinhos(f).length === 1, true);
  conf('a regiao entre o quadrado e a inscrita esta hachurada', P.ehHachurada(f), true);
}

console.log('\nexercicio 15: o prisma triangular de 6 por 10');
{
  const f = porId.s15, Q = f.saida.prisma;
  const lado = dist(Q.vertices.A, Q.vertices.B), alt = dist(Q.vertices.A, Q.vertices.D);
  medido('lado ' + n2(lado) + ' pt, altura ' + n2(alt) + ' pt, razao ' + n4(lado / alt) + ' (pedido 0,6000)');
  conf('lado por altura na folha e 6/10', Math.abs(lado / alt - 0.6) < 1e-6, true);
  conf('duas cotas de seta, 6 e 10, e duas marcas', f.tracos.filter((t) => t.tipo === 'cota').length === 2 && tem(f, '6') === 1 && tem(f, '10') === 1 && f.marcasAtivas === 2, true);
}

console.log('\nexercicio 16: o setor de 30 graus');
{
  const f = porId.c16;
  const arcos = ((f.medido || {}).arcos || []).map((a) => a.abertura);
  medido('aberturas no fluxo: ' + arcos.map((a) => a.toFixed(2)).join(', ') + '; textos ' + textos(f).join(' '));
  conf('dois arcos de 30 graus (o destacado na circunferencia e o da marca)', arcos.filter((a) => Math.abs(a - 30) < 1).length >= 2, true);
  conf('12, 30 graus e O impressos', tem(f, '12') === 1 && tem(f, '30°') === 1 && tem(f, 'O') === 1, true);
  conf('o setor esta hachurado', P.ehHachurada(f), true);
}

console.log('\nexercicio 17: o semicirculo que vira cone, e o seu gabarito');
{
  const f = porId.s17, sd = f.saida;
  medido('setor de raio ' + sd.geratriz + ' e 180 graus; cone montado com r ' + sd.raioCone + ' e h ' + n4(sd.alturaCone) + ' (5 raiz de 3 = ' + n4(5 * Math.sqrt(3)) + '); textos ' + textos(f).join(' '));
  conf('o cone montado tem raio 5 e altura 5 raiz de 3', sd.raioCone === 5 && Math.abs(sd.alturaCone - 5 * Math.sqrt(3)) < 1e-9, true);
  conf('enunciado: 10 no raio do setor, r, h e g em letra', textos(f).sort().join(' '), '10 g h r');
  const g = gabPorId.s17;
  medido('gabarito: textos ' + textos(g).join(' | '));
  conf('gabarito: g = 10 resolvido na geratriz', tem(g, 'g = 10'), 1);
  conf('gabarito: r e h colados ficam letra', tem(g, 'r') === 1 && tem(g, 'h') === 1, true);
  conf('gabarito: mesma escala e mesma caixa do enunciado', Math.abs(g.escala - f.escala) < 1e-9 && g.caixa.altura === f.caixa.altura, true);
}

console.log('\nexercicio 18: a esfera inscrita, e o seu gabarito');
{
  const f = porId.s18, sd = f.saida;
  const circ = ((f.medido || {}).arcos || []).filter((a) => a.abertura > 359 && Math.abs(a.raio - sd.raio) < 0.1);
  conf('a esfera esta no fluxo como uma circunferencia de raio 3k', circ.length, 1);
  if (circ.length) {
    const c = circ[0];
    const dFundo = Math.abs((c.cy - c.raio) - sd.cilindro.centroBase.y);
    const dTopo = Math.abs((c.cy + c.raio) - sd.cilindro.centroTopo.y);
    const dLat = Math.abs((c.cx + c.raio) - sd.cilindro.baseDir.x);
    medido('esfera: fundo a ' + n2(dFundo) + ' pt do centro da base, topo a ' + n2(dTopo) + ' pt do centro da tampa, lado a ' + n2(dLat) + ' pt da silhueta');
    conf('a esfera toca as duas bases e a lateral (teto 0,05 pt)', dFundo < 0.05 && dTopo < 0.05 && dLat < 0.05, true);
  }
  const cotas = f.tracos.filter((t) => t.tipo === 'cota');
  conf('a cota da altura mede o diametro da esfera', cotas.length === 1 && Math.abs(Math.abs(cotas[0].y2 - cotas[0].y1) - 2 * sd.raio) < 0.02, true);
  conf('enunciado: 3, h e O impressos', textos(f).sort().join(' '), '3 O h');
  const g = gabPorId.s18;
  medido('gabarito: textos ' + textos(g).join(' | '));
  conf('gabarito: h = 6 na cota', tem(g, 'h = 6'), 1);
  conf('gabarito: mesma escala e mesma caixa do enunciado', Math.abs(g.escala - f.escala) < 1e-9 && g.caixa.altura === f.caixa.altura, true);
}

/* ================================================================ pares envenenados
 * As travas 3, 4 e 5 rodam na base, com os venenos sinteticos do
 * _prova_piloto_base.js. Aqui elas rodam mais uma vez com o TEXTO DESTE TEMA
 * envenenado: o detector generico tem que acusar a frase real que a revisao
 * escreveu, e nao so o tema de laboratorio. Foi assim que os tres defeitos
 * apareceram na primeira folha, e e o que impede a lista deste tema de perder a
 * remissao, o numero ou a glosa numa edicao futura sem ninguem ver. */
console.log('\npares envenenados com o texto deste tema');
{
  const veneno = P.clonar(ctx.tema);
  const ex9 = veneno.pt.exercicios.find((e) => e.n === 9);
  ex9.enunciado = ex9.enunciado.replace('da figura', 'reto');
  const ex1 = veneno.en.exercicios.find((e) => e.n === 1);
  ex1.enunciado = 'The right triangle in the figure has legs 9 and 12 centimetres.';
  conf('par envenenado: o 9 sem "da figura" e o 1 falando de figura sem ter sao acusados',
    P.semRemissao(veneno).join('; '), 'pt 9 tem figura e nao remete a ela; en 1 fala da figura e nao tem nenhuma');
}
{
  const veneno = P.clonar(ctx.tema);
  const ex16 = veneno.pt.exercicios.find((e) => e.n === 16);
  ex16.enunciado = ex16.enunciado.replace('raio 12 centímetros', 'raio dado');
  conf('par envenenado: tirado o 12 do texto do 16, a figura que imprime 12 e acusada',
    P.numeroSoNoDesenho(veneno, 'pt', docPT.figurasDesenhadas || []).join('; '),
    'pt 16: a figura imprime 12 e o texto nao traz');
}
{
  const semLegenda = P.rascunho('@fig circulo id=v1 raio=6 setor=60 centro=O').figs;
  const veneno = P.clonar(ctx.tema);
  const ex14 = veneno.pt.exercicios.find((e) => e.n === 14);
  ex14.enunciado = ex14.enunciado.replace('região hachurada', 'região');
  conf('par envenenado: o setor sem legenda e o 14 sem "hachurada" no texto sao acusados',
    P.hachuraSemGlosa(veneno, 'pt', semLegenda.concat([porId.q14])).join('; '),
    'pt v1 hachurada sem legenda; pt q14: o enunciado nao diz que ha regiao hachurada');
}

const saida = P.placar();
P.avisos(ctx);
process.exit(saida);
