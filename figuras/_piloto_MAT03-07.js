/* figuras/_piloto_MAT03-07.js
 * Gera os documentos do MAT03-07, "Figuras planas e seus lados", pelo caminho de
 * verdade: o gerarMaterialTema do pdf.js, lendo o tema do banco.
 *
 * Tudo o que e generico (a abertura do tema, o placar, os leitores de folha e as
 * travas 0 a 8) mora no _piloto_base.js. Aqui ficam so tres coisas: o ID, os
 * numeros editoriais deste tema e a medicao no fluxo da familia de receitas que
 * ele usa (poligonoregular, painel, quadrilatero e circulo).
 *
 * Uso: node _piloto_MAT03-07.js [caminho de outro banco.json ou do retrato]
 *
 * Regra da casa: nunca usar travessao.
 */
const P = require('./_piloto_base.js');

const ID = 'MAT03-07';
const ctx = P.abrir({ id: ID, caminhoDoMd: 'temas/mat/03/' + ID + '.md' });

const conf = P.conf, medido = P.medido;
const textos = P.textos, tem = P.tem, quadradinhos = P.quadradinhos;
const dist = P.dist, n2 = P.n2;
const porId = ctx.porId, explic = ctx.explic;
const docPT = ctx.docPT, docEN = ctx.docEN;

/* ================================================================ travas genericas
 *
 * Escolha editorial escrita: 2 na explicacao, 3 nos 14 enunciados, 0 no gabarito.
 *
 * A serie manda em tudo aqui. O 3o ano nao le letra em vertice (van Hiele: a
 * crianca reconhece pela forma global e ainda nao le a figura por propriedade) e
 * nao le NUMERO sobre a figura (a medida na figura entra no 4o ano). Por isso
 * TODA figura deste tema sai sem letra e sem numero: o que a folha imprime, nas
 * cinco figuras da explicacao e do enunciado, sao dois nomes de forma e nada
 * mais. Quem carrega a informacao e a marca: o tracinho de lado congruente e o
 * quadradinho de canto reto.
 *
 * Na explicacao, as duas figuras sao as duas frases que descreviam um desenho:
 * "os lados, os vertices, e o fato de a figura ser fechada" (o pentagono, em que
 * se conta o contorno inteiro e os cantos) e "os dois tem 4 lados e 4 cantos
 * retos, a diferenca esta no tamanho dos lados" (o painel do quadrado e do
 * retangulo, em que a diferenca sai em tracinho e nao em palavra).
 *
 * A terceira figura da explicacao, o circulo de "figuras de contorno curvo",
 * FOI ESCRITA E DEPOIS MUDADA DE LUGAR, e o motivo esta na folha: com ela ali a
 * explicacao passava a tres paginas e a secao "Erros comuns" abria a pagina 3
 * sozinha, com dois tercos em branco. Ela vale mais no exercicio 10, que e onde
 * se pergunta quantos lados retos um circulo tem: ali a figura E a tarefa, e o
 * bloco de exercicios ja quebra pagina de qualquer jeito.
 *
 * Nos enunciados, os tres lugares em que a figura E a tarefa. O 2 traz o quadrado
 * GIRADO 30 graus, com os mesmos quatro tracinhos e os mesmos quatro
 * quadradinhos do painel da explicacao: e a exigencia de Hershkowitz, primeiro a
 * posicao prototipica e depois a girada, e a propriedade lida na marca e nao na
 * aparencia. O 7 traz as cinco pecas de papel do enunciado, tres triangulos
 * diferentes entre si e dois quadrados, porque "somando os lados de todas essas
 * pecas" e uma contagem sobre um conjunto que so existia em prosa. O 10 traz o
 * circulo, e a resposta dele e ZERO: nao ha outro jeito de mostrar a ausencia de
 * canto senao mostrando o contorno que nao tem nenhum.
 *
 * Onze dos catorze exercicios ficam sem figura nenhuma, muito acima do terco: os
 * de 1 a 6 e de 11 a 14 sao pergunta de nome e de conta, e desenhar ali entrega
 * a contagem que a pergunta cobra.
 *
 * O gabarito nao tem figura nenhuma, e isso e regra e nao esquecimento: nenhuma
 * resposta deste tema E uma construcao. Todas sao um numero ou uma justificativa
 * em palavras, e a figura ali gastaria meia folha para repetir o enunciado. */
P.travasGenericas(ctx, {
  /* As palavras deste tema que so existem em portugues, inclusive as duas que a
   * figura imprime pelo parametro nome= do painel. */
  palavrasPt: ['\\bquadrado\\b', 'retângulo', 'triângulo', 'pentágono', 'hexágono',
    'contorno', 'vértice', 'círculo', '\\blados\\b'],
  diretivasNaExplicacao: { n: 2, rotulo: 'a explicacao tem 2 figuras' },
  enunciadosComFigura: {
    n: '2 7 10',
    rotulo: 'os enunciados 2, 7 e 10 carregam figura, e so eles'
  },
  registrosNoMaterial: {
    n: 10,
    rotulo: 'o material desenha 10 registros: 1 figura mais as 2 celulas do painel na explicacao, e 2 mais as 5 celulas do painel nos enunciados'
  },
  figurasNoGabarito: { n: 0, rotulo: 'e o gabarito nao tem nenhuma' },
  idsDoGabarito: { n: '', rotulo: 'e portanto nenhum id de gabarito' },
  /* Nenhuma figura deste tema tem medida nenhuma: todas saem do prototipo, que e
   * exato por construcao, e nenhuma pode sair MARCADA fora de escala. */
  figurasForaDeEscala: { n: 'nenhuma', rotulo: 'nenhuma figura marcada fora de escala: todas saem exatas' }
});

/* ================================================================ medicao no fluxo
 * O que a folha AFIRMA com o desenho, medido no que vai sair impresso. */

console.log('\nmedicao no fluxo');

/* Os lados de contorno de uma figura, no peso 1,2 pt, com o comprimento de cada
 * um. E a conta que este tema inteiro cobra: quantos lados a forma tem. */
function ladosDe(f) {
  return ((f && f.medido && f.medido.segmentos) || [])
    .filter(function (s) { return !s.varredura && Math.abs(s.w - 1.2) < 0.05; })
    .map(function (s) { return Math.hypot(s.x2 - s.x1, s.y2 - s.y1); });
}

console.log('\nregra da serie: nenhuma letra e nenhum numero sobre figura nenhuma');
{
  const impressos = [];
  ctx.todasAsFiguras.forEach(function (f) {
    textos(f).forEach(function (t) { impressos.push(String(t)); });
  });
  const numeros = impressos.filter(function (t) { return /\d/.test(t); });
  const letras = impressos.filter(function (t) { return /^[A-Z]$/.test(t); });
  medido('as quatro folhas imprimem ' + impressos.length + ' rotulos de figura: ' +
    [...new Set(impressos)].join(', '));
  conf('nenhum numero sobre figura nenhuma (a medida na figura so entra no 4o ano)',
    numeros.join(', ') || 'nenhum', 'nenhum');
  conf('nenhuma letra de vertice (o 3o ano ainda nao le a figura por codigo ABC)',
    letras.join(', ') || 'nenhuma', 'nenhuma');
  conf('e os unicos rotulos sao os dois nomes de forma do painel, nas duas linguas',
    [...new Set(impressos)].sort().join(' '), 'quadrado rectangle retângulo square'.split(' ').sort().join(' '));
}

console.log('\nexplicacao: o pentagono fechado');
{
  const f = explic('poligonoregular')[0];
  const comp = ladosDe(f);
  medido('pentagono: ' + comp.length + ' lados de contorno, comprimentos ' + comp.map(n2).join(' ') + ' pt');
  conf('o pentagono tem cinco lados', comp.length, 5);
  conf('e os cinco saem iguais, que e o que torna a contagem confiavel',
    comp.length === 5 && Math.max.apply(null, comp) - Math.min.apply(null, comp) < 0.02, true);
  conf('a figura e grande: a menor dimensao passa dos 80 pt que a serie pede',
    Math.min(f.caixa.largura, f.caixa.altura) >= 80, true);
  conf('e ela nao imprime nada', textos(f).length, 0);
  /* Par envenenado da medida: o hexagono tem SEIS, e a mesma conta tem que
   * separar os dois. Uma conta de lados que devolvesse sempre cinco passaria
   * calada na figura de cima. */
  const h6 = P.rascunho('@fig poligonoregular lados=6').figs[0];
  medido('par envenenado, hexagono: ' + ladosDe(h6).length + ' lados');
  conf('a mesma conta distingue o hexagono', ladosDe(h6).length, 6);
}

/* As celulas de painel de TODAS as folhas, na ordem em que a folha as desenha.
 * Nao da para separa-las por id: o painel desenha cada celula como uma figura
 * propria com id nulo (ver o desenharCelula do receitas.js), entao as cinco do
 * exercicio 7 caem na mesma lista das duas da explicacao. A ordem e o que
 * separa, porque o material escreve a explicacao antes dos enunciados. */
function celulasDePainel(doc) {
  return (doc.figurasDesenhadas || []).filter(function (f) { return f.receita === 'painel'; });
}

console.log('\nexplicacao: o painel do quadrado e do retangulo');
{
  const todas = celulasDePainel(docPT);
  conf('o material desenha 7 celulas de painel: 2 na explicacao e 5 no exercicio 7', todas.length, 7);
  const celulas = todas.slice(0, 2);
  const q = celulas[0], r = celulas[1];
  const lq = ladosDe(q), lr = ladosDe(r);
  medido('quadrado: lados ' + lq.map(n2).join(' ') + ' pt; retangulo: lados ' + lr.map(n2).join(' ') + ' pt');
  conf('os quatro lados do quadrado saem iguais na folha',
    lq.length === 4 && Math.max.apply(null, lq) - Math.min.apply(null, lq) < 0.02, true);
  conf('e os do retangulo saem dois a dois, com comprimento diferente da largura',
    lr.length === 4 && Math.max.apply(null, lr) - Math.min.apply(null, lr) > 20, true);
  conf('o quadrado leva os tracinhos de lado congruente e o retangulo nao leva nenhum',
    (q.marcas || []).filter(function (m) { return m.tipo === 'congruencia'; }).length === 1 &&
    (r.marcas || []).filter(function (m) { return m.tipo === 'congruencia'; }).length === 0, true);
  conf('e os dois levam os quatro quadradinhos de canto reto',
    (q.marcas || []).some(function (m) { return m.tipo === 'angulosRetos'; }) &&
    (r.marcas || []).some(function (m) { return m.tipo === 'angulosRetos'; }), true);
  conf('os nomes das duas celulas vieram da diretiva, em portugues',
    textos(q).concat(textos(r)).join(' '), 'quadrado retângulo');
  const celulasEN = celulasDePainel(docEN).slice(0, 2);
  conf('e em ingles tambem',
    celulasEN.reduce(function (o, c) { return o.concat(textos(c)); }, []).join(' '),
    'square rectangle');
}

console.log('\nexercicio 10: o circulo sem canto nenhum');
{
  const f = porId.c10;
  const voltas = [];
  (docPT.paginas || []).forEach(function (pag) {
    P.voltasInteiras(P.lerCaminhos(pag.ops || [])).forEach(function (v) {
      const pts = P.pontosDoSub(v, 24), c = P.caixaDe(pts);
      const raio = (c.largura + c.altura) / 4;
      let radial = 0;
      for (const p of pts) radial = Math.max(radial, Math.abs(dist(p, { x: c.cx, y: c.cy }) - raio));
      if (radial <= 0.05) voltas.push({ raio: raio, aniso: Math.abs(c.largura - c.altura) });
    });
  });
  medido('circunferencias inteiras e redondas no material: ' + voltas.length +
    (voltas.length ? ', raio ' + voltas.map(function (v) { return n2(v.raio); }).join(' e ') + ' pt' : ''));
  conf('o circulo do exercicio 10 e uma volta inteira e redonda', voltas.length >= 1, true);
  conf('sem nenhum lado reto de contorno, que e a resposta do item', ladosDe(f).length, 0);
  conf('e sem nenhum rotulo', textos(f).length, 0);
  conf('e sem marca ativa nenhuma: nao ha canto para marcar', f.marcasAtivas, 0);
}

console.log('\nexercicio 2: o quadrado girado');
{
  const f = porId.q2;
  const comp = ladosDe(f);
  const segs = ((f.medido || {}).segmentos || [])
    .filter(function (s) { return !s.varredura && Math.abs(s.w - 1.2) < 0.05; });
  const horizontais = segs.filter(function (s) { return Math.abs(s.y1 - s.y2) < 0.5; });
  medido('quadrado girado: ' + comp.length + ' lados de ' + comp.map(n2).join(' ') +
    ' pt, ' + horizontais.length + ' deles horizontais na pagina');
  conf('continua sendo um quadrado: quatro lados iguais',
    comp.length === 4 && Math.max.apply(null, comp) - Math.min.apply(null, comp) < 0.02, true);
  conf('e esta MESMO girado: nenhum lado sai paralelo a margem', horizontais.length, 0);
  conf('com os tracinhos e os quadradinhos que o painel da explicacao ja tinha, para a propriedade ser lida na marca',
    (f.marcas || []).map(function (m) { return m.tipo; }).sort().join(' '), 'angulosRetos congruencia');
  conf('e sem numero e sem letra', textos(f).length, 0);
  /* Par envenenado da medida: o mesmo quadrado SEM giro tem dois lados
   * horizontais, e a mesma conta tem que dizer isso. */
  const reto = P.rascunho('@fig quadrilatero tipo=quadrado').figs[0];
  const h0 = ((reto.medido || {}).segmentos || [])
    .filter(function (s) { return !s.varredura && Math.abs(s.w - 1.2) < 0.05 && Math.abs(s.y1 - s.y2) < 0.5; });
  medido('par envenenado, quadrado sem giro: ' + h0.length + ' lados horizontais');
  conf('a mesma conta ve que o quadrado sem giro esta apoiado no lado', h0.length, 2);
}

console.log('\nexercicio 7: as cinco pecas de papel');
{
  /* As duas primeiras sao as do painel da explicacao; as cinco seguintes sao as
   * do exercicio 7, na ordem em que a folha as desenha. */
  const doSete = celulasDePainel(docPT).slice(2);
  conf('o exercicio 7 desenha cinco pecas', doSete.length, 5);
  const contagem = doSete.map(function (f) { return ladosDe(f).length; });
  medido('lados de cada peca, na ordem: ' + contagem.join(' ') + '  (soma ' +
    contagem.reduce(function (s, v) { return s + v; }, 0) + ')');
  conf('tres triangulos e depois dois quadrados', contagem.join(' '), '3 3 3 4 4');
  conf('e a soma dos lados desenhados e a resposta do item, 17',
    contagem.reduce(function (s, v) { return s + v; }, 0), 17);
  /* Os tres triangulos sao diferentes entre si de proposito: tres copias do
   * mesmo desenho ensinariam que triangulo e uma forma so. */
  const perfis = doSete.slice(0, 3).map(function (f) {
    return ladosDe(f).map(function (v) { return Math.round(v * 100) / 100; }).sort().join('/');
  });
  medido('perfis dos tres triangulos: ' + perfis.join('  |  '));
  conf('os tres triangulos tem formatos diferentes entre si',
    new Set(perfis).size, 3);
  conf('nenhuma das cinco pecas imprime numero ou letra',
    doSete.reduce(function (o, f) { return o.concat(textos(f)); }, []).length, 0);
}

/* ================================================================ pares envenenados
 * As travas 3 e 4 rodam na base com veneno sintetico. Aqui elas rodam de novo
 * com o TEXTO DESTE TEMA envenenado: o detector generico tem que acusar a frase
 * real, e nao so o tema de laboratorio. */
console.log('\npares envenenados com o texto deste tema');
{
  const veneno = P.clonar(ctx.tema);
  const ex7 = veneno.pt.exercicios.find(function (e) { return e.n === 7; });
  ex7.enunciado = ex7.enunciado.replace(', como na figura', '');
  const ex1 = veneno.en.exercicios.find(function (e) { return e.n === 1; });
  ex1.enunciado = 'How many sides does the triangle in the figure have?';
  conf('par envenenado: o 7 sem "na figura" e o 1 falando de figura sem ter sao acusados',
    P.semRemissao(veneno).join('; '),
    'pt 7 tem figura e nao remete a ela; en 1 fala da figura e nao tem nenhuma');
}
{
  /* A trava 4 passa vazia neste tema porque nenhuma figura imprime numero, e
   * trava que passa vazia precisa provar que ainda enxerga: o veneno poe uma
   * figura com numero num enunciado que nao traz o numero. */
  const comNumero = P.rascunho('@fig triangulo id=v1 lado=3 lado=4 lado=5').figs;
  const veneno = P.clonar(ctx.tema);
  const ex1 = veneno.pt.exercicios.find(function (e) { return e.n === 1; });
  ex1.enunciado = 'Quantos lados tem o triângulo da figura? @fig triangulo id=v1 lado=3 lado=4 lado=5';
  conf('par envenenado: uma figura com 3, 4 e 5 num enunciado sem numero e acusada tres vezes',
    P.numeroSoNoDesenho(veneno, 'pt', comNumero).length, 3);
}

const saida = P.placar();
P.avisos(ctx);
process.exit(saida);
