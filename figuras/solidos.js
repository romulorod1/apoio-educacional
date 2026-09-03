/* figuras/solidos.js
 * Os solidos da geometria espacial em perspectiva cavaleira: prisma, cilindro,
 * piramide, cone e esfera, e as seis composicoes que o MATEM3-12 pede em cima
 * deles: o painel dos cinco, o cone com o triangulo retangulo interno, a
 * piramide com o dela, o cilindro com a esfera inscrita, o prisma triangular
 * cotado e o semicirculo que vira cone.
 *
 * Nada aqui emite operador de PDF. Toda linha sai pelo poligono, pela elipse,
 * pela circunferencia, pelo arco, pela cota, pelo rotulo e pela seta do
 * desenho.js, e o quadradinho de angulo reto pelo marcaAnguloReto do marcas.js,
 * porque sao eles que registram o que desenharam: uma elipse escrita por conta
 * propria aqui seria invisivel para o conferirFigura do base.js, e funcao
 * duplicada e o sintoma de sobrescrita que o dono confere com grep.
 *
 * A convencao e a do livro didatico brasileiro, que e o que a aluna ve na prova.
 * Cada regra abaixo e uma constante deste arquivo, e uma so para a folha
 * inteira:
 *
 *   FUGA        a face da frente sai em verdadeira grandeza; a profundidade foge
 *               a 45 graus para cima e para a direita, reduzida a METADE. Um
 *               ponto (x, y, z), com z a profundidade (positivo para dentro da
 *               folha), cai em (x + z/2 cos 45, y + z/2 sen 45), ou seja
 *               (x + 0,3536 z, y + 0,3536 z). Dois solidos com fugas diferentes
 *               na mesma folha leem como vistos de lugares diferentes.
 *
 *   OCULTAS     a aresta escondida e DESENHADA, tracejada no padrao 'oculta' do
 *               base.js ([2 2]) e no peso auxiliar de 0,60 pt; a visivel sai
 *               continua no contorno de 1,20 pt, na mesma tinta. A distincao e
 *               por padrao e espessura e nunca por cor, que e o unico canal que
 *               sobrevive a fotocopia. Nao e [3 2]: [3 2] e o codigo da camada
 *               de gabarito, e o desenho.js o converte em traco continuo fora
 *               dela, entao uma aresta oculta pedida em [3 2] sairia impressa
 *               como visivel. Qual aresta esta escondida NAO e lista escrita a
 *               mao: sai do produto escalar da normal externa de cada face com
 *               a direcao do observador, que a propria fuga define (OLHO).
 *               Aresta cujas faces estao todas de costas e oculta. Trocar o
 *               sinal da fuga troca as ocultas sozinho, que e a armadilha que a
 *               especificacao registra ("solido de dentro para fora").
 *
 *   ACHATAMENTO a base circular de cilindro e cone, e o equador da esfera, saem
 *               como elipse alinhada aos eixos com b = 0,4 a. A projecao EXATA
 *               da cavaleira (45 graus, reducao 1/2) de uma circunferencia
 *               horizontal de raio r nao e essa elipse: e uma elipse inclinada
 *               7,0 graus, de semieixos 1,068 r e 0,331 r, e o livro didatico a
 *               substitui pela alinhada com a = r, que e a que a aluna
 *               reconhece. Alinhada, a altura que a propria fuga daria e b =
 *               0,354 r (a mesma reducao das arestas de profundidade), e a
 *               especificacao registra 0,34. Vale 0,4 aqui por pedido do dono
 *               e por um motivo medido: o que separa a metade de tras
 *               (tracejada [2 2]) da metade da frente e o vao entre os dois
 *               arcos, e ele e proporcional a b. Na menor base do painel
 *               (r = 14 pt) os dois arcos ficam a 9,9 pt no eixo e a 6,1 pt a
 *               3 pt do vertice com b = 0,354 r; com b = 0,4 r sobem para 11,2 e
 *               6,9 pt. E 0,4 ainda nao afasta a base da cavaleira a ponto de
 *               ela parecer vista de cima: a face de cima do prisma vizinho, de
 *               profundidade igual ao diametro, tem 0,354 d de altura na folha
 *               contra 0,4 d da elipse, 13 por cento a mais. A constante e uma
 *               so e vale para cilindro, cone e esfera; quem quiser 0,34 muda um
 *               numero neste arquivo e a folha inteira acompanha.
 *
 *   ESFERA      circunferencia de contorno (raio r) mais o equador como elipse
 *               (r por 0,4 r), metade da frente cheia e metade de tras
 *               tracejada. Inscrita num cilindro ela esta toda atras da
 *               superficie lateral, entao sai toda em 'oculta' e sem equador,
 *               porque dois tracejados cruzando-se nos pontos de tangencia leem
 *               como ruido e nao como esfera.
 *
 *   ANGULO RETO o quadradinho do marcas.js, nunca o numero 90. O triangulo
 *               retangulo interno do cone e da piramide e montado para que o
 *               angulo reto SAIA reto na folha: a altura e vertical e o raio
 *               (ou o apotema da base) vai ate o vertice da elipse ou ate o
 *               meio da aresta lateral direita, que se projetam na horizontal
 *               em verdadeira grandeza. Com o apotema indo ao meio da aresta da
 *               frente, o cateto sairia a 45 graus e com metade do comprimento,
 *               e o quadradinho viraria losango.
 *
 *   PREENCHIDO  so o triangulo interno das duas composicoes, no cinza de area
 *               do marcas.js (3,07:1 contra o branco, acima do piso de 3:1 que
 *               o conferirCor do desenho.js cobra). Nada mais e preenchido,
 *               porque preenchimento esconde as arestas que passam por baixo.
 *
 *   TEXTO       nenhuma palavra nasce aqui. Nome de solido, letra de vertice,
 *               cota e rotulo entram por parametro, nas duas linguas; sem o
 *               parametro o rotulo simplesmente nao sai e o painel avisa. Foi
 *               assim que a folha em ingles saiu com portugues uma vez.
 *
 * Pontos. Toda funcao de solido recebe e devolve PONTOS DE PAGINA, como as
 * primitivas do desenho.js: quem esta dentro de um figura() converte a origem
 * com ctx.p e as dimensoes com ctx.k (ha o emPontos para isso), e a caixa de
 * unidades que o figura() precisa ANTES de desenhar sai da geometria pura
 * (caixaDoSolido(tipo, dims)), que e a mesma conta em qualquer unidade porque a
 * projecao e linear. As composicoes fazem essa dobradinha inteira sozinhas.
 *
 * Roda no navegador por <script> (exporta FigSolidos no global) e no Node.
 *
 * Regra da casa: nunca usar travessao.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FigSolidos = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Ligacao tardia com a fundacao, com o nucleo de desenho e com as marcas, pelo
   * mesmo motivo do marcas.js: no navegador os tres entram por <script> e viram
   * globais; no Node a cadeia de require passa pelo pdf.js, que so termina de
   * carregar depois, e resolver no topo do arquivo devolveria um module.exports
   * pela metade, em silencio. */
  var cacheBase = null;
  function base() {
    if (cacheBase) return cacheBase;
    if (typeof FigBase !== 'undefined' && FigBase && FigBase.figura) cacheBase = FigBase;
    else if (typeof require === 'function') {
      try { cacheBase = require('./base.js'); } catch (e) { cacheBase = null; }
    }
    if (!cacheBase) throw new Error('figuras/solidos.js nao achou o figuras/base.js');
    return cacheBase;
  }
  var cacheDesenho = null;
  function desenho() {
    if (cacheDesenho) return cacheDesenho;
    if (typeof FigDesenho !== 'undefined' && FigDesenho && FigDesenho.elipse) cacheDesenho = FigDesenho;
    else if (typeof require === 'function') {
      try { cacheDesenho = require('./desenho.js'); } catch (e) { cacheDesenho = null; }
    }
    if (!cacheDesenho) throw new Error('figuras/solidos.js nao achou o figuras/desenho.js');
    return cacheDesenho;
  }
  var cacheMarcas = null;
  function marcas() {
    if (cacheMarcas) return cacheMarcas;
    if (typeof FigMarcas !== 'undefined' && FigMarcas && FigMarcas.marcaAnguloReto) cacheMarcas = FigMarcas;
    else if (typeof require === 'function') {
      try { cacheMarcas = require('./marcas.js'); } catch (e) { cacheMarcas = null; }
    }
    if (!cacheMarcas) throw new Error('figuras/solidos.js nao achou o figuras/marcas.js');
    return cacheMarcas;
  }
  function gerador() {
    var g = base().gerador();
    if (!g || !g.COR) throw new Error('figuras/solidos.js nao achou o pdf.js (nem PDFGen global nem require)');
    return g;
  }

  /* ============================================================ constantes */

  var FUGA = 45;            // graus, para cima e para a direita
  var REDUCAO = 0.5;        // a profundidade sai com metade do comprimento
  var ACHATAMENTO = 0.4;    // b = 0,4 a nas bases circulares e no equador
  var OCULTA = 'oculta';    // o [2 2] do base.js, por nome e nunca cru

  /* Os tres niveis de tinta, os mesmos do desenho.js e do marcas.js, e so
   * tres: a NBR 8403 pede que a linha larga seja no minimo o dobro da estreita
   * para uma informacao nao ser confundida com outra. */
  var ESPESSURA = { contorno: 1.2, marca: 0.9, auxiliar: 0.6 };

  function rad(g) { return g * Math.PI / 180; }
  var CO = Math.cos(rad(FUGA)) * REDUCAO;   // 0,353553
  var SE = Math.sin(rad(FUGA)) * REDUCAO;   // 0,353553

  /* Direcao do objeto para o observador, no sistema (x direita, y cima, z para
   * dentro da folha). Sai da propria projecao: dois pontos que diferem por
   * (-CO, -SE, 1) caem no mesmo lugar da folha, entao o observador esta em
   * (CO, SE, -1): a direita, acima e na frente. Uma face e visivel quando a
   * normal externa dela aponta para ca. */
  var OLHO = { x: CO, y: SE, z: -1 };

  /* Layout do painel, os mesmos numeros da receita painel do receitas.js, para
   * um painel de solidos e um de triangulos na mesma folha terem o mesmo
   * ritmo. */
  var CELULA_MIN = 92;
  var CELULA_MAX = 140;
  var VAO_CELULA = 8;
  var FOLGA_CELULA = 9;
  var FAIXA_NOME = 19;
  var TAM_NOME = 8.5;

  /* As composicoes: altura do bloco e anel de folga onde os rotulos externos
   * cabem. A cota de seta sai a 14 pt do lado e o numero em cima dela pede mais
   * uma meia caixa, entao as composicoes cotadas pedem um anel maior. */
  var ALTURA_COMPOSICAO = 150;
  var FOLGA_COMPOSICAO = 22;
  var FOLGA_COTADA = 28;
  var AFAST_COTA = 14;

  /* Dimensoes do painel quando quem chama nao diz: em unidades proprias, e o
   * que importa e a proporcao entre os cinco, que e a que o livro usa. */
  var DIMS_PAINEL = {
    prisma: { aresta: 1, profundidade: 0.8, altura: 1.25 },
    cilindro: { raio: 0.5, altura: 1.25 },
    piramide: { aresta: 1, altura: 1.3 },
    cone: { raio: 0.5, altura: 1.3 },
    esfera: { raio: 0.55 }
  };
  var ORDEM_PAINEL = ['prisma', 'cilindro', 'piramide', 'cone', 'esfera'];

  /* ============================================================ utilidades */

  function pt(x, y) { return { x: +x, y: +y }; }
  function norm(p) { return base().geo.normalizar(p); }
  function somar(P, Q) { return pt(P.x + Q.x, P.y + Q.y); }
  function dist(P, Q) { var dx = Q.x - P.x, dy = Q.y - P.y; return Math.sqrt(dx * dx + dy * dy); }
  function positivo(v) { var n = Number(v); return isFinite(n) && n > 0 ? n : null; }
  function ehCtx(a) { return !!(a && a.doc && typeof a.anota === 'function'); }
  function docDe(a) { return ehCtx(a) ? a.doc : a; }
  function avisar(alvo, texto) { base().avisar(docDe(alvo), texto); }
  function mesclar(a, b) {
    var o = {}, k;
    for (k in (a || {})) if (Object.prototype.hasOwnProperty.call(a, k)) o[k] = a[k];
    for (k in (b || {})) if (Object.prototype.hasOwnProperty.call(b, k)) o[k] = b[k];
    return o;
  }

  function caixaDePontos(pts) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (var i = 0; i < pts.length; i++) {
      x0 = Math.min(x0, pts[i].x); x1 = Math.max(x1, pts[i].x);
      y0 = Math.min(y0, pts[i].y); y1 = Math.max(y1, pts[i].y);
    }
    return { x0: x0, y0: y0, x1: x1, y1: y1, largura: x1 - x0, altura: y1 - y0 };
  }
  function caixaDeLimites(x0, y0, x1, y1) {
    return { x0: x0, y0: y0, x1: x1, y1: y1, largura: x1 - x0, altura: y1 - y0 };
  }
  function uniaoDeCaixas(lista) {
    var pts = [];
    for (var i = 0; i < lista.length; i++) {
      pts.push(pt(lista[i].x0, lista[i].y0));
      pts.push(pt(lista[i].x1, lista[i].y1));
    }
    return caixaDePontos(pts);
  }

  /* Multiplica as dimensoes metricas por k, para quem tem dims em unidades do
   * problema e precisa entrega-las em pontos a uma funcao de solido. */
  var METRICAS = ['raio', 'altura', 'aresta', 'lado', 'largura', 'profundidade'];
  function emPontos(dims, k) {
    var o = mesclar(dims, {});
    for (var i = 0; i < METRICAS.length; i++) {
      if (o[METRICAS[i]] != null) o[METRICAS[i]] = Number(o[METRICAS[i]]) * k;
    }
    return o;
  }

  /* ============================================================ projecao */

  function projetar(p) {
    return pt(Number(p.x) + Number(p.z) * CO, Number(p.y) + Number(p.z) * SE);
  }

  /* Normal EXTERNA de uma face, pela formula de Newell e orientada para longe do
   * centro do solido. Orientar pelo centro, e nao pela ordem dos vertices, e o
   * que faz a lista de faces poder ser escrita em qualquer sentido sem que uma
   * face invertida vire uma aresta oculta desenhada cheia. */
  function normalExterna(v3, face, centro) {
    var nx = 0, ny = 0, nz = 0, cx = 0, cy = 0, cz = 0, n = face.length;
    for (var i = 0; i < n; i++) {
      var p = v3[face[i]], q = v3[face[(i + 1) % n]];
      nx += (p.y - q.y) * (p.z + q.z);
      ny += (p.z - q.z) * (p.x + q.x);
      nz += (p.x - q.x) * (p.y + q.y);
      cx += p.x / n; cy += p.y / n; cz += p.z / n;
    }
    if (nx * (cx - centro.x) + ny * (cy - centro.y) + nz * (cz - centro.z) < 0) {
      nx = -nx; ny = -ny; nz = -nz;
    }
    var m = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    return { x: nx / m, y: ny / m, z: nz / m };
  }

  /* Poliedro convexo: vertices em 3D, faces como listas de indices. Devolve os
   * vertices projetados e cada aresta com a decisao de oculta, tirada das faces
   * que a compartilham: aresta cujas faces estao todas de costas para o
   * observador e oculta, qualquer outra e visivel (a de silhueta tem uma face
   * de cada lado). */
  function poliedro(v3, faces, nomes) {
    var c = { x: 0, y: 0, z: 0 }, i, f;
    for (i = 0; i < v3.length; i++) { c.x += v3[i].x / v3.length; c.y += v3[i].y / v3.length; c.z += v3[i].z / v3.length; }
    var visiveis = [];
    for (f = 0; f < faces.length; f++) {
      var nrm = normalExterna(v3, faces[f], c);
      visiveis.push(nrm.x * OLHO.x + nrm.y * OLHO.y + nrm.z * OLHO.z > 1e-9);
    }
    var mapa = {}, ordem = [];
    for (f = 0; f < faces.length; f++) {
      var face = faces[f];
      for (i = 0; i < face.length; i++) {
        var a = face[i], b = face[(i + 1) % face.length];
        var i0 = Math.min(a, b), i1 = Math.max(a, b), chave = i0 + '-' + i1;
        if (!mapa[chave]) { mapa[chave] = { i: i0, j: i1, faces: [] }; ordem.push(chave); }
        mapa[chave].faces.push(f);
      }
    }
    var arestas = [];
    for (i = 0; i < ordem.length; i++) {
      var e = mapa[ordem[i]], oculta = true;
      for (f = 0; f < e.faces.length; f++) if (visiveis[e.faces[f]]) oculta = false;
      arestas.push({ de: nomes[e.i], ate: nomes[e.j], i: e.i, j: e.j, oculta: oculta });
    }
    var v2 = [];
    for (i = 0; i < v3.length; i++) v2.push(projetar(v3[i]));
    return { v2: v2, arestas: arestas, facesVisiveis: visiveis, caixa: caixaDePontos(v2) };
  }

  /* ============================================================ geometria pura
   *
   * Cada funcao recebe as dimensoes e devolve os pontos ja projetados, relativos
   * ao CENTRO DA BASE (a esfera, ao centro dela), sem desenhar e sem tocar no
   * doc. E o que o figura() precisa antes de desenhar, para a caixa de unidades,
   * e e a mesma conta em qualquer unidade porque a projecao e linear: a caixa em
   * unidades vezes k e a caixa em pontos. */

  function geometriaPrisma(dims) {
    dims = dims || {};
    var tipoBase = String(dims.base || 'retangular').toLowerCase();
    var h = positivo(dims.altura);
    if (!h) return null;
    var v3, nomes, faces, a, d, i;
    if (tipoBase === 'triangular') {
      /* Base equilatera deitada no chao, com uma aresta na frente e o terceiro
       * vertice ao fundo, centrada no baricentro: z0 e a distancia do
       * baricentro a aresta da frente. */
      a = positivo(dims.aresta != null ? dims.aresta : dims.lado);
      if (!a) return null;
      var z0 = a * Math.sqrt(3) / 6;
      v3 = [
        { x: -a / 2, y: 0, z: -z0 }, { x: a / 2, y: 0, z: -z0 }, { x: 0, y: 0, z: a * Math.sqrt(3) / 2 - z0 }
      ];
      for (i = 0; i < 3; i++) v3.push({ x: v3[i].x, y: h, z: v3[i].z });
      nomes = ['A', 'B', 'C', 'D', 'E', 'F'];
      faces = [[0, 1, 2], [3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]];
      d = a * Math.sqrt(3) / 2;
    } else {
      /* A, B, C, D na base em sentido anti-horario a partir do canto da frente
       * a esquerda; E, F, G, H em cima, E sobre A. E a nomeacao da
       * especificacao, para o enunciado poder dizer "a diagonal AG". */
      a = positivo(dims.aresta != null ? dims.aresta : dims.largura);
      if (!a) return null;
      d = dims.profundidade != null ? positivo(dims.profundidade) : a;
      if (!d) return null;
      v3 = [
        { x: -a / 2, y: 0, z: -d / 2 }, { x: a / 2, y: 0, z: -d / 2 },
        { x: a / 2, y: 0, z: d / 2 }, { x: -a / 2, y: 0, z: d / 2 }
      ];
      for (i = 0; i < 4; i++) v3.push({ x: v3[i].x, y: h, z: v3[i].z });
      nomes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      faces = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
    }
    var P = poliedro(v3, faces, nomes);
    return {
      tipo: 'prisma', base: tipoBase, nomes: nomes, v3: v3, v2: P.v2, faces: faces,
      facesVisiveis: P.facesVisiveis, arestas: P.arestas, caixa: P.caixa,
      centroBase: pt(0, 0), centroTopo: pt(0, h),
      altura: h, aresta: a, profundidade: d, nBase: nomes.length / 2
    };
  }

  function geometriaPiramide(dims) {
    dims = dims || {};
    var a = positivo(dims.aresta != null ? dims.aresta : dims.lado), h = positivo(dims.altura);
    if (!a || !h) return null;
    var v3 = [
      { x: -a / 2, y: 0, z: -a / 2 }, { x: a / 2, y: 0, z: -a / 2 },
      { x: a / 2, y: 0, z: a / 2 }, { x: -a / 2, y: 0, z: a / 2 },
      { x: 0, y: h, z: 0 }
    ];
    var nomes = ['A', 'B', 'C', 'D', 'V'];
    var faces = [[0, 1, 2, 3], [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]];
    var P = poliedro(v3, faces, nomes);
    return {
      tipo: 'piramide', nomes: nomes, v3: v3, v2: P.v2, faces: faces,
      facesVisiveis: P.facesVisiveis, arestas: P.arestas, caixa: P.caixa,
      centroBase: pt(0, 0), vertice: pt(0, h), altura: h, aresta: a,
      /* Meio de cada aresta da base, projetado. O de BC e o que da o triangulo
       * retangulo com o angulo reto saindo reto na folha. */
      meios: {
        AB: projetar({ x: 0, y: 0, z: -a / 2 }), BC: projetar({ x: a / 2, y: 0, z: 0 }),
        CD: projetar({ x: 0, y: 0, z: a / 2 }), DA: projetar({ x: -a / 2, y: 0, z: 0 })
      },
      apotemaBase: a / 2,
      apotema: Math.sqrt(h * h + a * a / 4),
      arestaLateral: Math.sqrt(h * h + a * a / 2)
    };
  }

  function geometriaCilindro(dims) {
    dims = dims || {};
    var r = positivo(dims.raio), h = positivo(dims.altura);
    if (!r || !h) return null;
    var b = r * ACHATAMENTO;
    return {
      tipo: 'cilindro', raio: r, altura: h, semieixoMenor: b,
      centroBase: pt(0, 0), centroTopo: pt(0, h),
      baseEsq: pt(-r, 0), baseDir: pt(r, 0), topoEsq: pt(-r, h), topoDir: pt(r, h),
      caixa: caixaDeLimites(-r, -b, r, h + b)
    };
  }

  function geometriaCone(dims) {
    dims = dims || {};
    var r = positivo(dims.raio), h = positivo(dims.altura);
    if (!r || !h) return null;
    var b = r * ACHATAMENTO;
    return {
      tipo: 'cone', raio: r, altura: h, semieixoMenor: b,
      centroBase: pt(0, 0), vertice: pt(0, h),
      baseEsq: pt(-r, 0), baseDir: pt(r, 0),
      geratriz: Math.sqrt(h * h + r * r),
      caixa: caixaDeLimites(-r, -b, r, h)
    };
  }

  function geometriaEsfera(dims) {
    dims = dims || {};
    var r = positivo(dims.raio);
    if (!r) return null;
    return {
      tipo: 'esfera', raio: r, semieixoMenor: r * ACHATAMENTO,
      centro: pt(0, 0), caixa: caixaDeLimites(-r, -r, r, r)
    };
  }

  var GEOMETRIA = {
    prisma: geometriaPrisma, cilindro: geometriaCilindro, piramide: geometriaPiramide,
    cone: geometriaCone, esfera: geometriaEsfera
  };

  /* A caixa envolvente projetada de um solido, relativa ao centro da base, nas
   * mesmas unidades das dimensoes. E o que vira a caixa de unidades do figura(). */
  function caixaDoSolido(tipo, dims) {
    var f = GEOMETRIA[String(tipo || '').toLowerCase()];
    if (!f) return null;
    var G = f(dims);
    return G ? G.caixa : null;
  }

  /* ============================================================ tinta */

  /* A tinta de um solido, decidida num lugar so. tudoOculto e a esfera inscrita:
   * tudo o que ela desenharia como visivel sai no padrao de oculta. */
  function tintaDoSolido(op) {
    op = op || {};
    var COR = gerador().COR;
    var oc = op.oculta || {};
    return {
      cor: op.cor || COR.texto,
      espessura: op.espessura != null ? Number(op.espessura) : ESPESSURA.contorno,
      corOculta: oc.cor || op.cor || COR.texto,
      espOculta: oc.espessura != null ? Number(oc.espessura) : ESPESSURA.auxiliar,
      tudoOculto: op.tudoOculto === true
    };
  }
  function opOculta(t, extra) {
    return mesclar({ cor: t.corOculta, espessura: t.espOculta, tracejado: OCULTA, papel: 'oculta' }, extra);
  }
  function opContorno(t, extra) {
    if (t.tudoOculto) return opOculta(t, extra);
    return mesclar({ cor: t.cor, espessura: t.espessura, papel: 'contorno' }, extra);
  }

  /* Uma aresta como poligono aberto de dois pontos: o poligono do desenho.js
   * registra o traco e passa pela hierarquia de tinta, e o 1 J dele arredonda a
   * ponta, entao tres arestas que se encontram num vertice fecham limpo. */
  function aresta(alvo, P, Q, oculta, t) {
    var o = oculta ? opOculta(t, {}) : opContorno(t, {});
    o.fechado = false;
    return desenho().poligono(alvo, [P, Q], o);
  }

  /* Base circular em perspectiva: metade da frente (de 180 a 360, a de baixo na
   * folha) cheia, metade de tras (de 0 a 180) tracejada. E a elipse do
   * desenho.js nas duas metades, e nada mais. */
  function baseEmPerspectiva(alvo, C, a, b, t) {
    var D = desenho();
    var frente = D.elipse(alvo, C, a, b, opContorno(t, { de: 180, ate: 360 }));
    var tras = D.elipse(alvo, C, a, b, opOculta(t, { de: 0, ate: 180 }));
    return { centro: C, a: a, b: b, frente: frente, tras: tras };
  }

  /* Rotulo COLADO na linha que ele nomeia, sem halo, a 3 pt da borda da letra.
   *
   * E o caso da letra que mora DENTRO do solido: o h no eixo, o r no raio, o
   * apotema da base. Medido no painel (celula de 57 pt por unidade): a caixa
   * do halo do rotulo() tem 1,16 corpo de altura (9,9 pt) e folga lateral, e
   * com o afastamento padrao de 4 pt ela nao cabe entre o eixo da piramide e a
   * aresta oculta V D (a 10,7 pt do eixo a meia altura) nem entre o raio da
   * tampa do cilindro e o arco da elipse (11,5 pt acima do raio no meio dele,
   * contra os 13,9 que a caixa pede). O rotulo() faz o que promete: foge e
   * liga o fio de chamada, e a celula saia com tres fios de chamada onde o
   * livro poe tres letras. A LETRA cabe: o h tem 4,7 pt de largura e 6,1 de
   * altura. Sem halo nao ha caixa para colidir, e por dentro do solido nao ha
   * hachura nem malha que o halo precisasse cobrir. Quem quiser o halo de
   * volta passa halo: true.
   *
   * Sem halo nao ha fuga, entao ONDE na linha a letra pousa e decidido
   * aqui, pelo posicaoColada: quem chama oferece os pontos da linha em ordem de
   * preferencia (fracao de P ate Q) e o primeiro em que a TINTA da letra fica a
   * pelo menos FOLGA_COLADO de tudo o que a figura ja registrou (arestas, arcos,
   * linhas internas, o quadradinho) e o escolhido. Os casos medidos que
   * motivaram a busca, na celula do painel de 57 pt por unidade: o h da
   * piramide a meia altura ficava a 0,44 pt da aresta oculta V D e a 0,35 da
   * altura fica a 3,6 pt; o m do apotema da base a meio caminho era cruzado
   * pela aresta V B, que corta o apotema a 0,57 do centro, e a 0,35 fica
   * livre; o r da tampa do cilindro so cabe a 0,3 do raio, onde a elipse e
   * mais alta, a 1,5 pt da linha, porque a tampa tem so 2b = 0,8 r de altura
   * (22,8 pt na celula) e a letra r sobe so a altura de x (0,52 corpo); o r
   * do cone tem o arco de tras da base a 0,35 r acima do raio no meio dele
   * (10 pt na celula) e tambem so cabe a 1,5 pt da linha e a 0,35 do raio.
   * Toda letra de raio vai a 1,5 pt (AFAST_RAIO); as outras a 3.
   *
   * E quando NENHUM candidato cabe? Ha proporcao em que nao cabe mesmo: quanto
   * mais esbelto o solido, mais perto do eixo corre a silhueta, e num cone de
   * raio 3 e altura 20 as quatro posicoes do h dao vao NEGATIVO (medido: o "20"
   * a -0,60 pt da geratriz e o "3" a -0,30 pt do arco de tras da base), ou seja
   * letra por cima de traco. Ai o rotulo colado DESISTE DE SER COLADO e cai
   * para o rotulo com halo do desenho.js, que e o irmao que sabe resolver:
   * ele procura posicao livre, foge o minimo que baste, liga o fio de chamada
   * ate o ponto que nomeia e so avisa quando nem assim ha lugar (a tarja
   * estreita). Colado le melhor, entao a queda so acontece depois que as
   * posicoes da linha falharam todas: onde a letra cabe colada ela continua
   * colada, sem halo e sem fio.
   *
   * Duas versoes anteriores desta decisao estao registradas porque as duas
   * saem na folha e a diferenca se ve:
   *
   *   desistir calado    devolvia o primeiro candidato e imprimia por cima do
   *                      traco. O conferirFigura nao tem trava de texto sobre
   *                      traco, entao a folha saia com a letra em cima da
   *                      linha, registro.avisos zerado e conferencia limpa.
   *   desistir falando   passou a escolher o MENOS ruim (o candidato de maior
   *                      vao) e a avisar com o texto, o vao e o piso. Melhor
   *                      do que calar, mas a letra continuava saindo por cima
   *                      da linha, e o aviso acendia doze vezes na folha do
   *                      _prova_receitas_solidos, que cobra zero.
   *
   * O aviso sobrou so para o degrau de baixo, o texto que nao acha lugar nem
   * fugindo, e quem fala ali e o rotulo() do desenho.js, uma vez so, com a
   * tarja estreita. O rotuloColado nao avisa mais nada por conta propria: um
   * aviso daqui somado ao dele seria a mesma coisa dita duas vezes.
   *
   * O preco da queda esta medido e e menor do que o que ela paga. O halo e
   * branco chapado, entao quando a letra fugida para dentro do triangulo cinza
   * da composicao (o r do cone, por exemplo) ela abre ali um retangulo branco.
   * Isso e feio, e por isso o caminho colado existe. Mas o halo so entra depois
   * que a busca falhou, e nesse ponto a alternativa nao e a letra limpa sobre o
   * cinza: e a letra impressa em cima da geratriz. Buraco no preenchimento se
   * le; letra sobre traco, nao. A fuga tambem nao come contorno nenhum, porque
   * o rotulo() so para onde o halo esta livre. */
  var AFAST_COLADO = 3;
  var FOLGA_COLADO = 2;
  var EM_ALTURA_PIRAMIDE = [0.65, 0.5, 0.75, 0.4];   // fracao de V ate O
  var EM_APOTEMA_BASE = [0.35, 0.5, 0.25, 0.65];
  var EM_ALTURA_CONE = [0.5, 0.6, 0.4, 0.7];
  var EM_RAIO_CONE = [0.5, 0.35, 0.65];
  var EM_RAIO_TAMPA = [0.3, 0.4, 0.2];
  var AFAST_RAIO = 1.5;

  function rotuloColado(alvo, texto, P, Q, direcao, op) {
    op = op || {};
    var afast = op.afastamento != null ? Number(op.afastamento) : AFAST_COLADO;
    var em = op.em != null ? Number(op.em) : 0.5;
    var comHalo = op.halo === true;
    var caiu = false, coube = null;
    if (op.candidatos && op.candidatos.length) {
      /* A busca roda sempre, com halo ou sem: ela e quem escolhe ONDE na linha
       * a letra pousa, e essa escolha vale para os dois. O que muda entre eles
       * e so o que fazer quando ela nao acha lugar. */
      var pos = posicaoColada(alvo, texto, P, Q, direcao, afast, op.candidatos, op);
      coube = pos.livre;
      em = pos.em;
      if (!pos.livre && comHalo) {
        /* Quem ja pediu halo ja estava entregue ao rotulo(): dali para a frente
         * e ele quem foge, liga o fio e, se nem assim couber, avisa a tarja.
         * Mexer na posicao de partida so mudaria de onde a fuga sai, entao a
         * partida continua sendo o primeiro candidato, como sempre foi. */
        em = Number(op.candidatos[0]);
      } else if (!pos.livre) {
        /* Nenhuma posicao da linha ficou livre. Sai do modo colado e entrega ao
         * rotulo com halo, que foge, liga o fio de chamada e so entao avisa. A
         * partida e o candidato de MAIOR vao, e nao o primeiro da lista: a fuga
         * anda o minimo que baste, entao partir do menos ruim e o que devolve o
         * menor desvio.
         *
         * halo: false de quem chama NAO impede a queda, e isso e de proposito.
         * A chave chega dessas chamadas como um booleano de outra pergunta (o
         * receitas.js manda halo: m.resolvido, que e falso para toda letra que
         * nao veio do gabarito), e nao como uma proibicao. Tratar esse falso
         * como proibicao devolveria exatamente as doze letras por cima do traco
         * que esta queda existe para tirar da folha. */
        comHalo = true;
        caiu = true;
      }
    }
    var reg = desenho().rotuloLado(alvo, texto, P, Q, {
      direcao: direcao, halo: comHalo, afastamento: afast,
      tam: op.tam, cor: op.cor, bold: op.bold, em: em,
      /* Fugiu do lugar colado: o fio de chamada e o que mantem a leitura de a
       * quem a letra pertence, e sem ele um "h" solto ao lado do cone nao diz
       * mais qual segmento ele mede. Pedido explicito porque o criterio proprio
       * do rotulo() nao serve aqui: ele so liga o fio acima de FUGA_COM_CHAMADA
       * (8 pt, um corpo), e a fuga medida nestes casos vai de 6 a 20 pt, entao
       * o "10" do cone do painel (7 pt) e o "3" (8 pt) ficariam soltos. Para um
       * rotulo que nasceu para ficar EM CIMA da linha, um corpo de desvio ja
       * troca de dono: o "10" a 7 pt do eixo tem a geratriz do lado. */
      chamada: caiu ? true : undefined,
      /* Deslizar ao longo da propria linha e a segunda saida, depois de afastar
       * na normal: a letra continua nomeando o mesmo segmento e o fio fica
       * curto. Os candidatos ja tentaram isso em quatro pontos; o rotulo()
       * tenta de pt em pt e vai alem deles. */
      fuga: caiu ? pt(norm(Q).x - norm(P).x, norm(Q).y - norm(P).y) : undefined
    });
    /* Duas perguntas diferentes, dois campos: coubeColado diz se a BUSCA achou
     * posicao livre na linha (nulo quando nao houve busca, isto e, quem chamou
     * nao ofereceu candidatos), e caiuParaHalo diz se este rotulo desistiu de
     * ser colado. Um so campo confundiria o rotulo que ja nasceu com halo por
     * pedido de quem chama (o valor resolvido do gabarito) com o que caiu
     * porque nao coube, e sao coisas que a folha precisa distinguir. */
    if (reg) { reg.em = em; reg.coubeColado = coube; reg.caiuParaHalo = caiu; }
    return reg;
  }

  /* A caixa da TINTA de um rotulo posto pelo rotulo() em (cx, cy): a linha de
   * base fica 0,35 do corpo abaixo do centro optico, a letra com ascendente
   * sobe 0,72 do corpo e a sem ascendente 0,52. E o que a folha imprime, e nao
   * a caixa do halo, que e o que o rotulo() testa. */
  function caixaDaTinta(texto, cx, cy, tam, largura) {
    var alta = /[bdfhklt]|[A-Z0-9]/.test(String(texto));
    var base = cy - 0.35 * tam;
    return { x0: cx - largura / 2, x1: cx + largura / 2, y0: base, y1: base + tam * (alta ? 0.72 : 0.52) };
  }

  /* Onde a letra colada pousa, quanto vao sobrou ali e se esse vao chega ao
   * piso. Sao tres coisas porque quem chama precisa das tres: a fracao para
   * desenhar, o vao para relatar e o "livre" para decidir se ainda vale ficar
   * colado ou se e hora de cair para o rotulo com halo. Esta funcao so MEDE:
   * nao avisa, nao desenha e nao escolhe estrategia, e por isso pode ser
   * chamada de fora para conferir uma proporcao antes de aceita-la. */
  function posicaoColada(alvo, texto, P, Q, direcao, afast, candidatos, op) {
    op = op || {};
    if (!ehCtx(alvo) || !alvo.registro) return { em: Number(candidatos[0]), vao: Infinity, livre: true };
    var D = desenho(), g = gerador();
    var tam = Number(op.tam) || D.TAM_PADRAO;
    var cx = D.caixaDoRotulo(String(texto), { tam: tam, bold: !!op.bold });
    var largura = g.medir(String(texto), tam, !!op.bold);
    var dir = D.versor(direcao) || pt(0, 1);
    /* O suporte da caixa do halo na direcao pedida, que e como o rotulo()
     * afasta o texto: a folga vai ate a BORDA da caixa. */
    var sup = Math.abs(dir.x) * cx.largura / 2 + Math.abs(dir.y) * cx.altura / 2;
    var obst = obstaculosDoRegistro(alvo.registro);
    var Pn = norm(P), Qn = norm(Q);
    var melhor = Number(candidatos[0]), melhorVao = -Infinity;
    for (var i = 0; i < candidatos.length; i++) {
      var em = Number(candidatos[i]);
      var ax = Pn.x + (Qn.x - Pn.x) * em, ay = Pn.y + (Qn.y - Pn.y) * em;
      var caixa = caixaDaTinta(texto, ax + dir.x * (afast + sup), ay + dir.y * (afast + sup), tam, largura);
      var vao = vaoDaCaixa(caixa, obst);
      if (vao >= FOLGA_COLADO) return { em: em, vao: vao, livre: true };
      if (vao > melhorVao) { melhorVao = vao; melhor = em; }
    }
    /* Nenhum candidato livre. Devolve o MENOS ruim (o candidato de maior vao, e
     * nao o primeiro da lista, que so por acaso seria o melhor) com o aviso de
     * que ele nao serve. Quem decide o que fazer com isso e o rotuloColado. */
    return { em: melhor, vao: melhorVao, livre: false };
  }

  /* So a fracao, para quem quer a busca sem o resto. */
  function emLivre(alvo, texto, P, Q, direcao, afast, candidatos, op) {
    return posicaoColada(alvo, texto, P, Q, direcao, afast, candidatos, op).em;
  }

  /* Tudo o que a figura ja desenhou, como segmentos: tracos retos como estao,
   * arcos amostrados a cada 6 graus, o quadradinho pelos cantos dele. */
  function obstaculosDoRegistro(registro) {
    var saida = [], i, j;
    var tracos = registro.tracos || [];
    for (i = 0; i < tracos.length; i++) {
      var t = tracos[i];
      if (!t) continue;
      var w = Number(t.espessura) || 0;
      if (t.x1 != null) { saida.push({ P: pt(t.x1, t.y1), Q: pt(t.x2, t.y2), w: w }); continue; }
      if (t.tipo === 'arco' && t.centro) {
        var pts = desenho().arcoPontos(t.centro, t.rx, t.ry, t.de, t.ate, { giro: t.giro, passo: 6 });
        for (j = 1; j < pts.length; j++) saida.push({ P: pts[j - 1], Q: pts[j], w: w });
      }
    }
    var marcas = registro.marcas || [];
    for (i = 0; i < marcas.length; i++) {
      var m = marcas[i];
      if (m && m.cantos && m.cantos.length >= 2) {
        for (j = 1; j < m.cantos.length; j++) {
          saida.push({ P: norm(m.cantos[j - 1]), Q: norm(m.cantos[j]), w: Number(m.espessura) || 0 });
        }
      }
    }
    return saida;
  }

  function vaoDaCaixa(caixa, obst) {
    var menor = Infinity;
    for (var i = 0; i < obst.length; i++) {
      var o = obst[i];
      for (var k = 0; k <= 24; k++) {
        var t = k / 24, x = o.P.x + (o.Q.x - o.P.x) * t, y = o.P.y + (o.Q.y - o.P.y) * t;
        var dx = Math.max(caixa.x0 - x, 0, x - caixa.x1), dy = Math.max(caixa.y0 - y, 0, y - caixa.y1);
        menor = Math.min(menor, Math.sqrt(dx * dx + dy * dy) - o.w / 2);
      }
    }
    return menor;
  }

  /* Linha de construcao que corre por DENTRO do solido (altura no eixo, raio na
   * base, apotema da base): escondida pela superficie, sai como aresta oculta. */
  function linhaInterna(alvo, P, Q, op) {
    op = op || {};
    var COR = gerador().COR;
    return desenho().poligono(alvo, [P, Q], {
      fechado: false, cor: op.cor || COR.texto,
      espessura: ESPESSURA.auxiliar, tracejado: OCULTA, papel: 'oculta'
    });
  }

  /* ============================================================ os solidos
   *
   *   prisma(alvo, origem, {aresta, profundidade, altura, base}, op)
   *   cilindro(alvo, origem, {raio, altura}, op)
   *   piramide(alvo, origem, {aresta, altura}, op)
   *   cone(alvo, origem, {raio, altura}, op)
   *   esfera(alvo, centro, {raio}, op)
   *
   * alvo e o doc do pdf.js ou o ctx do figura(); origem e o centro da base, em
   * ponto de pagina; as dimensoes em pontos. op: {cor, espessura, oculta: {cor,
   * espessura}, tudoOculto}. Devolvem os pontos-chave em ponto de pagina para a
   * receita cotar em cima. */

  function desenharPoliedro(alvo, origem, G, op) {
    var O = norm(origem), t = tintaDoSolido(op), i;
    var V = {}, lista = [];
    for (i = 0; i < G.v2.length; i++) {
      var P = somar(O, G.v2[i]);
      V[G.nomes[i]] = P;
      lista.push(P);
    }
    var arestas = [], ocultas = 0;
    /* Ocultas primeiro, para o contorno pintar por cima nos vertices que os
     * dois tipos compartilham. */
    var passos = [true, false];
    for (var p = 0; p < 2; p++) {
      for (i = 0; i < G.arestas.length; i++) {
        var e = G.arestas[i];
        if (e.oculta !== passos[p]) continue;
        var reg = aresta(alvo, V[e.de], V[e.ate], e.oculta, t);
        arestas.push({ de: e.de, ate: e.ate, P: V[e.de], Q: V[e.ate], oculta: e.oculta, reg: reg });
        if (e.oculta) ocultas++;
      }
    }
    var saida = {
      tipo: G.tipo, nomes: G.nomes, vertices: V, pontos: lista, arestas: arestas,
      ocultas: ocultas, visiveis: arestas.length - ocultas,
      centroBase: somar(O, G.centroBase), altura: G.altura,
      caixa: caixaDePontos(lista)
    };
    if (G.tipo === 'prisma') {
      var nb = G.nBase;
      saida.base = G.base;
      saida.aresta = G.aresta;
      saida.profundidade = G.profundidade;
      saida.centroTopo = somar(O, G.centroTopo);
      saida.arestaFrente = [V[G.nomes[0]], V[G.nomes[1]]];
      saida.arestaAlturaEsquerda = [V[G.nomes[0]], V[G.nomes[nb]]];
      saida.arestaAlturaDireita = [V[G.nomes[1]], V[G.nomes[nb + 1]]];
    } else if (G.tipo === 'piramide') {
      saida.aresta = G.aresta;
      saida.vertice = V.V;
      saida.O = saida.centroBase;
      saida.meios = {
        AB: somar(O, G.meios.AB), BC: somar(O, G.meios.BC),
        CD: somar(O, G.meios.CD), DA: somar(O, G.meios.DA)
      };
      saida.apotemaBase = G.apotemaBase;
      saida.apotema = G.apotema;
      saida.arestaLateral = G.arestaLateral;
      saida.arestaFrente = [V.A, V.B];
    }
    return saida;
  }

  function prisma(alvo, origem, dims, op) {
    var G = geometriaPrisma(dims);
    if (!G) {
      avisar(alvo, 'prisma com dimensoes invalidas (aresta, profundidade e altura precisam ser positivas), nao desenha');
      return null;
    }
    return desenharPoliedro(alvo, origem, G, op);
  }

  function piramide(alvo, origem, dims, op) {
    var G = geometriaPiramide(dims);
    if (!G) {
      avisar(alvo, 'piramide com dimensoes invalidas (aresta e altura precisam ser positivas), nao desenha');
      return null;
    }
    return desenharPoliedro(alvo, origem, G, op);
  }

  function cilindro(alvo, origem, dims, op) {
    var G = geometriaCilindro(dims);
    if (!G) {
      avisar(alvo, 'cilindro com dimensoes invalidas (raio e altura precisam ser positivos), nao desenha');
      return null;
    }
    var D = desenho(), O = norm(origem), t = tintaDoSolido(op);
    var r = G.raio, h = G.altura, b = G.semieixoMenor;
    var T = somar(O, G.centroTopo);
    var saida = {
      tipo: 'cilindro', raio: r, altura: h, semieixoMenor: b, achatamento: ACHATAMENTO,
      centroBase: O, centroTopo: T,
      baseEsq: somar(O, G.baseEsq), baseDir: somar(O, G.baseDir),
      topoEsq: somar(O, G.topoEsq), topoDir: somar(O, G.topoDir),
      caixa: caixaDeLimites(O.x - r, O.y - b, O.x + r, O.y + h + b)
    };
    saida.base = baseEmPerspectiva(alvo, O, r, b, t);
    /* A tampa e vista de cima inteira: o observador esta acima. */
    saida.topo = D.elipse(alvo, T, r, b, opContorno(t, {}));
    saida.geratrizes = [
      aresta(alvo, saida.baseEsq, saida.topoEsq, false, t),
      aresta(alvo, saida.baseDir, saida.topoDir, false, t)
    ];
    return saida;
  }

  function cone(alvo, origem, dims, op) {
    var G = geometriaCone(dims);
    if (!G) {
      avisar(alvo, 'cone com dimensoes invalidas (raio e altura precisam ser positivos), nao desenha');
      return null;
    }
    var O = norm(origem), t = tintaDoSolido(op);
    var r = G.raio, h = G.altura, b = G.semieixoMenor;
    var V = somar(O, G.vertice);
    var saida = {
      tipo: 'cone', raio: r, altura: h, semieixoMenor: b, achatamento: ACHATAMENTO,
      geratriz: G.geratriz, centroBase: O, O: O, vertice: V,
      baseEsq: somar(O, G.baseEsq), baseDir: somar(O, G.baseDir),
      caixa: caixaDeLimites(O.x - r, O.y - b, O.x + r, O.y + h)
    };
    saida.base = baseEmPerspectiva(alvo, O, r, b, t);
    /* As duas geratrizes de silhueta vao ate os vertices da elipse, como no
     * livro. A tangente exata a partir do apice toca a elipse um pouco abaixo
     * (em (0,987 r; 0,064 r) para h = 2,5 r), e leva-la ate la faria a geratriz
     * do triangulo interno e a silhueta sairem como duas linhas a 1,9 pt uma da
     * outra num raio de 30 pt. */
    saida.geratrizes = [
      aresta(alvo, saida.baseEsq, V, false, t),
      aresta(alvo, saida.baseDir, V, false, t)
    ];
    return saida;
  }

  function esfera(alvo, centro, dims, op) {
    op = op || {};
    var G = geometriaEsfera(dims);
    if (!G) {
      avisar(alvo, 'esfera com raio invalido, nao desenha');
      return null;
    }
    var D = desenho(), C = norm(centro), t = tintaDoSolido(op);
    var r = G.raio, b = G.semieixoMenor;
    var saida = {
      tipo: 'esfera', raio: r, semieixoMenor: b, achatamento: ACHATAMENTO, centro: C,
      topo: pt(C.x, C.y + r), fundo: pt(C.x, C.y - r), dir: pt(C.x + r, C.y), esq: pt(C.x - r, C.y),
      caixa: caixaDeLimites(C.x - r, C.y - r, C.x + r, C.y + r)
    };
    saida.contorno = D.circunferencia(alvo, C, r, opContorno(t, {}));
    var querEquador = op.equador != null ? !!op.equador : !t.tudoOculto;
    saida.equador = querEquador ? baseEmPerspectiva(alvo, C, r, b, t) : null;
    return saida;
  }

  var DESENHO = { prisma: prisma, cilindro: cilindro, piramide: piramide, cone: cone, esfera: esfera };

  /* ============================================================ composicoes
   *
   * Cada uma abre o proprio figura(), monta a caixa de unidades a partir da
   * geometria pura, desenha nas camadas certas e devolve o registro do figura()
   * com um campo saida (os pontos-chave em ponto de pagina). Opcoes comuns:
   *
   *   dims     as dimensoes do solido, em unidades do problema
   *   rotulos  os textos, TODOS por parametro; o que nao vier nao sai
   *   bloco    {x, largura, altura, folga, antes, depois} do figura()
   *   legenda, foraDeEscala, fase, id, receita, travas, conferir: passam direto
   *   tinta    {cor, espessura, oculta} do solido */

  function abrirFigura(doc, op, unidades, altura, folga, desenhar) {
    var B = base();
    var bl = op.bloco || {};
    var saida = {};
    var reg = B.figura(doc, {
      x: bl.x, largura: bl.largura,
      altura: bl.altura != null ? bl.altura : altura,
      folga: bl.folga != null ? bl.folga : folga,
      antes: bl.antes, depois: bl.depois,
      unidades: unidades, legenda: op.legenda, foraDeEscala: op.foraDeEscala,
      fase: op.fase, id: op.id, receita: op.receita, travas: op.travas, conferir: op.conferir
    }, function (ctx) { desenhar(ctx, saida); });
    reg.saida = saida;
    return reg;
  }

  function cinzaDeArea() {
    var M = marcas();
    return M.corDeArea ? M.corDeArea() : M.COR_AREA;
  }

  /* ------------------------------------------------ cone com o triangulo
   *
   *   coneComTriangulo(doc, {dims: {raio, altura}, rotulos: {raio, altura,
   *                          geratriz, vertice, centro}, ...})
   *
   * Raio na base ate o vertice direito da elipse, altura no eixo, geratriz na
   * silhueta da direita; o triangulo preenchido no cinza de area e o quadradinho
   * no pe da altura. Com os tres rotulos e o quadradinho sao quatro marcas;
   * vertice e centro levam a seis e o teto de cinco recusa, de proposito. */
  function coneComTriangulo(doc, op) {
    op = op || {};
    var D = desenho(), M = marcas();
    var G = geometriaCone(op.dims);
    if (!G) { avisar(doc, 'coneComTriangulo: dims.raio e dims.altura precisam ser positivos'); return null; }
    var rot = op.rotulos || {};
    return abrirFigura(doc, op, G.caixa, ALTURA_COMPOSICAO, FOLGA_COMPOSICAO, function (ctx, saida) {
      var k = ctx.k, O = ctx.p(pt(0, 0));
      var dk = emPontos(op.dims, k);
      var V = pt(O.x, O.y + G.altura * k), P = pt(O.x + G.raio * k, O.y);
      var cinza = cinzaDeArea();
      saida.V = V; saida.O = O; saida.P = P; saida.cinza = cinza; saida.triangulo = [V, O, P];
      ctx.preenchimento(function () {
        D.poligono(ctx, [V, O, P], { preenche: cinza, contorno: false });
      });
      ctx.contorno(function () { saida.cone = cone(ctx, O, dk, op.tinta); });
      ctx.marcas(function () {
        saida.altura = linhaInterna(ctx, V, O);
        saida.raio = linhaInterna(ctx, O, P);
        saida.anguloReto = M.marcaAnguloReto(ctx.doc, O, P, V, { ctx: ctx });
      });
      ctx.rotulos(function () {
        if (rot.altura) rotuloColado(ctx, rot.altura, V, O, pt(-1, 0), { candidatos: EM_ALTURA_CONE });
        /* O r vai por cima do raio, dentro do triangulo cinza e sem halo: o
         * halo branco abriria um buraco no preenchimento, e a tinta do texto da
         * 5,57:1 contra o cinza de area. */
        if (rot.raio) rotuloColado(ctx, rot.raio, O, P, pt(0, 1), { candidatos: EM_RAIO_CONE, afastamento: AFAST_RAIO });
        if (rot.geratriz) D.rotuloLado(ctx, rot.geratriz, V, P, { centro: O });
        if (rot.vertice) D.rotulo(ctx, rot.vertice, V, { direcao: pt(0, 1) });
        if (rot.centro) D.rotulo(ctx, rot.centro, O, { direcao: pt(-0.7071, -0.7071) });
      });
    });
  }

  /* ------------------------------------------------ piramide com o triangulo
   *
   *   piramideComTriangulo(doc, {dims: {aresta, altura}, rotulos: {altura,
   *                              apotemaBase, apotema, vertice, centro}, ...})
   *
   * Altura no eixo, apotema da base do centro ao meio da aresta lateral direita
   * (BC), apotema da piramide como hipotenusa sobre a face da direita, que e
   * visivel. O apotema da base vai a BC e nao a AB porque so assim o cateto se
   * projeta na horizontal e o quadradinho sai quadrado. */
  function piramideComTriangulo(doc, op) {
    op = op || {};
    var D = desenho(), M = marcas();
    var G = geometriaPiramide(op.dims);
    if (!G) { avisar(doc, 'piramideComTriangulo: dims.aresta e dims.altura precisam ser positivos'); return null; }
    var rot = op.rotulos || {};
    return abrirFigura(doc, op, G.caixa, ALTURA_COMPOSICAO, FOLGA_COMPOSICAO, function (ctx, saida) {
      var k = ctx.k, O = ctx.p(pt(0, 0));
      var dk = emPontos(op.dims, k);
      var V = somar(O, pt(0, G.altura * k)), Mp = somar(O, pt(G.meios.BC.x * k, G.meios.BC.y * k));
      var cinza = cinzaDeArea();
      saida.V = V; saida.O = O; saida.M = Mp; saida.cinza = cinza; saida.triangulo = [V, O, Mp];
      ctx.preenchimento(function () {
        D.poligono(ctx, [V, O, Mp], { preenche: cinza, contorno: false });
      });
      ctx.contorno(function () { saida.piramide = piramide(ctx, O, dk, op.tinta); });
      ctx.marcas(function () {
        saida.altura = linhaInterna(ctx, V, O);
        saida.apotemaBase = linhaInterna(ctx, O, Mp);
        /* O apotema da piramide corre sobre a face da direita, que esta de
         * frente para o observador: linha visivel, e e o objeto da pergunta. */
        saida.apotema = D.poligono(ctx, [V, Mp], { fechado: false, espessura: ESPESSURA.marca, papel: 'objeto' });
        saida.anguloReto = M.marcaAnguloReto(ctx.doc, O, Mp, V, { ctx: ctx });
      });
      ctx.rotulos(function () {
        if (rot.altura) rotuloColado(ctx, rot.altura, V, O, pt(-1, 0), { candidatos: EM_ALTURA_PIRAMIDE });
        /* Por CIMA do apotema da base, dentro do triangulo: por baixo dele so
         * ha 0,177 a ate a aresta da frente (14,9 pt com a = 84), menos do que
         * a caixa do rotulo pede, e a letra saia empurrada para fora da
         * piramide com fio de chamada. E perto do centro, porque a aresta V B
         * cruza o apotema a 0,57 do centro. */
        if (rot.apotemaBase) rotuloColado(ctx, rot.apotemaBase, O, Mp, pt(0, 1), { candidatos: EM_APOTEMA_BASE });
        if (rot.apotema) D.rotuloLado(ctx, rot.apotema, V, Mp, { centro: O });
        if (rot.vertice) D.rotulo(ctx, rot.vertice, V, { direcao: pt(0, 1) });
        if (rot.centro) D.rotulo(ctx, rot.centro, O, { direcao: pt(-0.7071, -0.7071) });
      });
    });
  }

  /* ------------------------------------------------ cilindro com a esfera
   *
   *   cilindroComEsfera(doc, {dims: {raio}, rotulos: {raio, altura, centro}, ...})
   *
   * A altura do cilindro E o diametro da esfera: a esfera toca o centro das
   * duas bases e a lateral em (r, r). A esfera sai toda em oculta, porque esta
   * toda atras da superficie lateral. O raio e desenhado do centro ate o ponto
   * de tangencia lateral e a altura vai cotada por fora, a direita. */
  function cilindroComEsfera(doc, op) {
    op = op || {};
    var D = desenho();
    var r = positivo((op.dims || {}).raio);
    if (!r) { avisar(doc, 'cilindroComEsfera: dims.raio precisa ser positivo'); return null; }
    var G = geometriaCilindro({ raio: r, altura: 2 * r });
    var rot = op.rotulos || {};
    return abrirFigura(doc, op, G.caixa, ALTURA_COMPOSICAO, FOLGA_COTADA, function (ctx, saida) {
      var k = ctx.k, O = ctx.p(pt(0, 0)), rk = r * k;
      var C = pt(O.x, O.y + rk);
      saida.centro = C; saida.raio = rk;
      saida.contatos = { fundo: O, topo: pt(O.x, O.y + 2 * rk), dir: pt(O.x + rk, O.y + rk), esq: pt(O.x - rk, O.y + rk) };
      ctx.contorno(function () {
        saida.cilindro = cilindro(ctx, O, { raio: rk, altura: 2 * rk }, op.tinta);
        saida.esfera = esfera(ctx, C, { raio: rk }, mesclar(op.tinta, { tudoOculto: true }));
      });
      ctx.marcas(function () {
        if (rot.raio) saida.cotaRaio = D.cotaRadial(ctx, C, rk, rot.raio, { angulo: 0 });
        if (rot.altura) {
          saida.cotaAltura = D.cota(ctx, saida.cilindro.baseDir, saida.cilindro.topoDir, rot.altura,
            { fora: C, afastamento: AFAST_COTA });
        }
        saida.ponto = D.ponto(ctx, C, {
          raio: 1.8, rotulo: rot.centro || null,
          direcoes: [pt(-0.7071, 0.7071), pt(-1, 0), pt(0, 1)]
        });
      });
    });
  }

  /* ------------------------------------------------ prisma triangular cotado
   *
   *   prismaTriangular(doc, {dims: {lado, altura}, rotulos: {lado, altura}, ...})
   *
   * Cotas de seta por fora: o lado embaixo da aresta da frente e a altura a
   * ESQUERDA da aresta AD, porque a direita as arestas de fuga que saem de B
   * atravessariam a linha de cota. */
  function prismaTriangular(doc, op) {
    op = op || {};
    var D = desenho();
    var dims = op.dims || {};
    var G = geometriaPrisma({ base: 'triangular', aresta: dims.lado != null ? dims.lado : dims.aresta, altura: dims.altura });
    if (!G) { avisar(doc, 'prismaTriangular: dims.lado e dims.altura precisam ser positivos'); return null; }
    var rot = op.rotulos || {};
    return abrirFigura(doc, op, G.caixa, ALTURA_COMPOSICAO, FOLGA_COTADA, function (ctx, saida) {
      var k = ctx.k, O = ctx.p(pt(0, 0));
      ctx.contorno(function () {
        saida.prisma = prisma(ctx, O, { base: 'triangular', aresta: G.aresta * k, altura: G.altura * k }, op.tinta);
      });
      ctx.marcas(function () {
        var S = saida.prisma, dentro = pt(S.centroBase.x, S.centroBase.y + G.altura * k / 2);
        if (rot.lado) saida.cotaLado = D.cota(ctx, S.vertices.A, S.vertices.B, rot.lado, { fora: dentro, afastamento: AFAST_COTA });
        if (rot.altura) saida.cotaAltura = D.cota(ctx, S.vertices.A, S.vertices.D, rot.altura, { fora: dentro, afastamento: AFAST_COTA });
      });
    });
  }

  /* ------------------------------------------------ o semicirculo que vira cone
   *
   *   planificacaoDoCone(doc, {dims: {raio, angulo}, rotulos: {arco, raioSetor,
   *                             raio, altura, geratriz}, ...})
   *
   * A esquerda o setor plano (raio = geratriz, angulo em graus, 180 por padrao),
   * SEM perspectiva nenhuma, porque a planificacao esta deitada na mesa; a seta;
   * a direita o cone montado, com r = raio vezes angulo sobre 360 e h = raiz de
   * g ao quadrado menos r ao quadrado. Os cinco rotulos sao exatamente o teto de
   * marcas, entao a seta e as linhas internas entram como traco. */
  function planificacaoDoCone(doc, op) {
    op = op || {};
    var D = desenho();
    var dims = op.dims || {};
    var R = positivo(dims.raio);
    var ang = dims.angulo != null ? Number(dims.angulo) : 180;
    if (!R || !(ang > 0 && ang < 360)) {
      avisar(doc, 'planificacaoDoCone: dims.raio positivo e dims.angulo entre 0 e 360');
      return null;
    }
    var r = R * ang / 360, h = Math.sqrt(R * R - r * r);
    var Gc = geometriaCone({ raio: r, altura: h });
    var rot = op.rotulos || {};

    /* Layout em unidades: setor simetrico em torno do eixo y, com o centro na
     * origem; seta; cone a direita. */
    var a0 = 90 - ang / 2, a1 = 90 + ang / 2;
    var ptsSetor = D.arcoPontos(pt(0, 0), R, R, a0, a1, { passo: 5, setor: true });
    var cxSetor = caixaDePontos(ptsSetor);
    var VAO = R * 0.3, SETA = R * 0.8;
    var xSeta0 = cxSetor.x1 + VAO, xSeta1 = xSeta0 + SETA;
    var xCone = xSeta1 + VAO + r;
    var cxCone = caixaDeLimites(xCone + Gc.caixa.x0, Gc.caixa.y0, xCone + Gc.caixa.x1, Gc.caixa.y1);
    var unidades = uniaoDeCaixas([cxSetor, cxCone]);
    var ySeta = (unidades.y0 + unidades.y1) / 2;

    return abrirFigura(doc, op, unidades, 170, FOLGA_COMPOSICAO, function (ctx, saida) {
      var k = ctx.k;
      var Cs = ctx.p(pt(0, 0));
      var P0 = ctx.p(pt(R * Math.cos(rad(a0)), R * Math.sin(rad(a0))));
      var P1 = ctx.p(pt(R * Math.cos(rad(a1)), R * Math.sin(rad(a1))));
      var topoArco = ctx.p(pt(0, R));
      var S0 = ctx.p(pt(xSeta0, ySeta)), S1 = ctx.p(pt(xSeta1, ySeta));
      var Oc = ctx.p(pt(xCone, 0));
      var V = pt(Oc.x, Oc.y + h * k), P = pt(Oc.x + r * k, Oc.y);
      saida.centroSetor = Cs; saida.extremosSetor = [P0, P1]; saida.topoArco = topoArco;
      saida.seta = [S0, S1]; saida.O = Oc; saida.V = V; saida.P = P;
      saida.raioCone = r; saida.alturaCone = h; saida.geratriz = R; saida.escala = k;

      ctx.contorno(function () {
        /* O arco e o contorno de corte que vira a circunferencia da base; os
         * dois raios sao o corte que se cola na geratriz, um nivel abaixo. */
        saida.arco = D.arco(ctx, Cs, R * k, R * k, a0, a1, { espessura: ESPESSURA.contorno });
        saida.raios = D.poligono(ctx, [P0, Cs, P1], { fechado: false, espessura: ESPESSURA.marca, papel: 'contorno' });
        saida.cone = cone(ctx, Oc, { raio: r * k, altura: h * k }, op.tinta);
      });
      ctx.marcas(function () {
        D.seta(ctx, S0, S1, { tam: 7, espessura: ESPESSURA.marca, papel: 'traco' });
        saida.altura = linhaInterna(ctx, V, Oc);
        saida.raio = linhaInterna(ctx, Oc, P);
      });
      ctx.rotulos(function () {
        if (rot.arco) D.rotulo(ctx, rot.arco, topoArco, { direcao: pt(0, 1) });
        if (rot.raioSetor) D.rotuloLado(ctx, rot.raioSetor, Cs, P1, { direcao: pt(0, -1) });
        if (rot.altura) rotuloColado(ctx, rot.altura, V, Oc, pt(-1, 0), { candidatos: EM_ALTURA_CONE });
        if (rot.raio) rotuloColado(ctx, rot.raio, Oc, P, pt(0, 1), { candidatos: EM_RAIO_CONE, afastamento: AFAST_RAIO });
        if (rot.geratriz) D.rotuloLado(ctx, rot.geratriz, V, P, { centro: Oc });
      });
    });
  }

  /* ------------------------------------------------ painel dos cinco
   *
   *   painelDeSolidos(doc, {nomes: [5], cotas: {prisma: {aresta, altura},
   *                         cilindro: {raio, altura}, piramide: {aresta, altura},
   *                         cone: {raio, altura}, esfera: {raio}},
   *                         dims: {...}, ordem: [...], x, largura, ...})
   *
   * Desenhado POR CONTA PROPRIA, e nao pela receita painel do receitas.js: a
   * receita so entende celula de triangulo (lados, angulos) e de quadrilatero
   * (os prototipos), e nao aceita celula generica. O que se copia dela e a
   * disciplina: cada celula e uma figura propria, com o fundo branco dela e o
   * teto de cinco marcas dela; o painel reserva o bloco inteiro antes da
   * primeira celula e segura o doc.y entre uma e a seguinte. O que se acrescenta
   * e a ESCALA COMUM: os cinco solidos saem no mesmo k, senao o cone de uma
   * celula sai maior que o cilindro da vizinha e o painel deixa de comparar. A
   * caixa de unidades de cada celula e montada com a proporcao exata da celula,
   * entao o enquadramento isotropico do figura() devolve o mesmo k nas cinco. */
  function painelDeSolidos(doc, op) {
    op = op || {};
    var B = base(), g = gerador(), D = desenho();
    var ordem = op.ordem || ORDEM_PAINEL;
    var nomes = op.nomes || [];
    var cotas = op.cotas || {};
    var n = ordem.length, i;
    if (nomes.length !== n) {
      avisar(doc, 'painelDeSolidos: ' + n + ' solido(s) para ' + nomes.length +
        ' nome(s); o nome de cada solido entra por parametro, nas duas linguas');
    }
    var x = op.x != null ? Number(op.x) : g.MARG_E;
    var largura = op.largura != null ? Number(op.largura) : (g.MARG_D - x);
    var passo = largura / n;
    var folga = FOLGA_CELULA + VAO_CELULA / 2;
    var utilL = Math.max(1, passo - 2 * folga);

    var itens = [], maiorAltura = 0, k = Infinity;
    for (i = 0; i < n; i++) {
      var tipo = String(ordem[i]).toLowerCase();
      var dims = mesclar(DIMS_PAINEL[tipo] || {}, (op.dims && op.dims[tipo]) || {});
      var G = GEOMETRIA[tipo] ? GEOMETRIA[tipo](dims) : null;
      if (!G) {
        avisar(doc, 'painelDeSolidos: solido desconhecido ou com dimensoes invalidas: ' + ordem[i]);
        itens.push(null);
        continue;
      }
      itens.push({ tipo: tipo, dims: dims, G: G });
      k = Math.min(k, utilL / G.caixa.largura);
      maiorAltura = Math.max(maiorAltura, G.caixa.altura);
    }
    if (!isFinite(k) || !(maiorAltura > 0)) {
      avisar(doc, 'painelDeSolidos: nenhum solido valido, nao ha o que desenhar');
      return null;
    }
    var alturaCelula = Math.max(CELULA_MIN, Math.min(CELULA_MAX, maiorAltura * k + FAIXA_NOME + 2 * folga));
    var utilA = alturaCelula - 2 * folga;
    k = Math.min(k, (utilA - FAIXA_NOME) / maiorAltura);
    var W = utilL / k, H = utilA / k;

    var med = B.medidaDoBloco({
      x: x, largura: largura, altura: alturaCelula,
      legenda: op.legenda, foraDeEscala: !!op.foraDeEscala
    });
    doc.garanteEspaco(med.total);
    var yInicial = doc.y;
    var registros = [];
    for (i = 0; i < n; i++) {
      var item = itens[i];
      if (!item) continue;
      doc.y = yInicial;
      var cx = item.G.caixa;
      /* Os cinco assentam na mesma linha: a caixa de cada celula comeca no pe
       * do proprio solido menos a faixa do nome, e sobe H, que e a altura util
       * da celula em unidades. Largura W centrada no solido. */
      var meioX = (cx.x0 + cx.x1) / 2;
      var unidades = { x0: meioX - W / 2, x1: meioX + W / 2, y0: cx.y0 - FAIXA_NOME / k, y1: cx.y0 - FAIXA_NOME / k + H };
      var ultima = i === n - 1;
      registros.push(B.figura(doc, {
        x: x + i * passo, largura: passo, altura: alturaCelula, folga: folga,
        unidades: unidades,
        legenda: ultima ? op.legenda : null, foraDeEscala: ultima && !!op.foraDeEscala,
        fase: op.fase, id: null, receita: op.receita || null, travas: op.travas, conferir: op.conferir
      }, celulaDoPainel(D, item, nomes[i] != null ? String(nomes[i]) : '', cotas[item.tipo] || {})));
    }
    doc.y = yInicial - alturaCelula - med.alturaLegenda - med.antes - med.depois;
    return { registros: registros, alturaCelula: alturaCelula, escala: k, passo: passo, y: doc.y };
  }

  function celulaDoPainel(D, item, nome, cotas) {
    return function (ctx) {
      var k = ctx.k, O = ctx.p(pt(0, 0));
      var dk = emPontos(item.dims, k);
      var S = null;
      ctx.contorno(function () { S = DESENHO[item.tipo](ctx, O, dk, {}); ctx.registro.solido = S; });

      ctx.marcas(function () {
        if (!S) return;
        /* O raio da tampa e objeto (0,9 continuo), e o r vai colado nele: e a
         * mesma dupla do cotaRadial em estilo linha, so que com a letra sem
         * halo, ver o rotuloColado. */
        if (item.tipo === 'cilindro' && cotas.raio) {
          D.poligono(ctx, [S.centroTopo, S.topoDir], { fechado: false, espessura: ESPESSURA.marca, papel: 'objeto' });
        }
        if (item.tipo === 'piramide' && cotas.altura) linhaInterna(ctx, S.vertice, S.O);
        if (item.tipo === 'cone') {
          if (cotas.altura) linhaInterna(ctx, S.vertice, S.O);
          if (cotas.raio) linhaInterna(ctx, S.O, S.baseDir);
        }
        if (item.tipo === 'esfera') {
          /* A 50 graus o r cai acima do equador com folga: a 35 graus a caixa
           * dele encostava no arco tracejado de tras. */
          if (cotas.raio) D.cotaRadial(ctx, S.centro, S.raio, cotas.raio, { angulo: 50 });
          D.ponto(ctx, S.centro, { raio: 1.6 });
        }
      });

      ctx.rotulos(function () {
        if (S) {
          if (item.tipo === 'prisma') {
            if (cotas.aresta) D.rotuloLado(ctx, cotas.aresta, S.arestaFrente[0], S.arestaFrente[1], { centro: S.centroBase });
            if (cotas.altura) D.rotuloLado(ctx, cotas.altura, S.arestaAlturaDireita[0], S.arestaAlturaDireita[1], { direcao: pt(1, 0) });
          } else if (item.tipo === 'cilindro') {
            if (cotas.raio) rotuloColado(ctx, cotas.raio, S.centroTopo, S.topoDir, pt(0, 1), { candidatos: EM_RAIO_TAMPA, afastamento: AFAST_RAIO });
            if (cotas.altura) D.rotuloLado(ctx, cotas.altura, S.baseDir, S.topoDir, { direcao: pt(1, 0) });
          } else if (item.tipo === 'piramide') {
            if (cotas.aresta) D.rotuloLado(ctx, cotas.aresta, S.vertices.A, S.vertices.B, { centro: S.centroBase });
            if (cotas.altura) rotuloColado(ctx, cotas.altura, S.vertice, S.O, pt(-1, 0), { candidatos: EM_ALTURA_PIRAMIDE });
          } else if (item.tipo === 'cone') {
            if (cotas.altura) rotuloColado(ctx, cotas.altura, S.vertice, S.O, pt(-1, 0), { candidatos: EM_ALTURA_CONE });
            if (cotas.raio) rotuloColado(ctx, cotas.raio, S.O, S.baseDir, pt(0, 1), { candidatos: EM_RAIO_CONE, afastamento: AFAST_RAIO });
          }
        }
        if (!nome) return;
        /* Os cinco nomes na MESMA linha de base, medida do pe da celula e nao
         * do solido, que e o que a receita painel faz e pelo mesmo motivo. */
        var meio = pt(ctx.caixa.x + ctx.caixa.largura / 2, ctx.caixa.y + FAIXA_NOME * 0.42);
        D.rotulo(ctx, nome, meio, { direcao: null, afastamento: 0, tam: TAM_NOME });
      });
    };
  }

  return {
    prisma: prisma, cilindro: cilindro, piramide: piramide, cone: cone, esfera: esfera,
    painelDeSolidos: painelDeSolidos,
    coneComTriangulo: coneComTriangulo, piramideComTriangulo: piramideComTriangulo,
    cilindroComEsfera: cilindroComEsfera, prismaTriangular: prismaTriangular,
    planificacaoDoCone: planificacaoDoCone,
    rotuloColado: rotuloColado, linhaInterna: linhaInterna, emLivre: emLivre,
    posicaoColada: posicaoColada, FOLGA_COLADO: FOLGA_COLADO,
    geometria: GEOMETRIA, caixaDoSolido: caixaDoSolido, projetar: projetar, emPontos: emPontos,
    FUGA: FUGA, REDUCAO: REDUCAO, ACHATAMENTO: ACHATAMENTO, OLHO: OLHO,
    ESPESSURA: ESPESSURA, OCULTA: OCULTA,
    DIMS_PAINEL: DIMS_PAINEL, ORDEM_PAINEL: ORDEM_PAINEL, FAIXA_NOME: FAIXA_NOME,
    EM_ALTURA_PIRAMIDE: EM_ALTURA_PIRAMIDE, EM_ALTURA_CONE: EM_ALTURA_CONE, EM_RAIO_CONE: EM_RAIO_CONE,
    EM_RAIO_TAMPA: EM_RAIO_TAMPA, EM_APOTEMA_BASE: EM_APOTEMA_BASE, AFAST_RAIO: AFAST_RAIO, AFAST_COLADO: AFAST_COLADO
  };
});
