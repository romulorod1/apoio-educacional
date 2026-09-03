/* figuras/base.js
 * Fundacao das figuras: o envelope de bloco, o envelope de estado grafico, o kit
 * de geometria pura e a leitura da marcacao @fig.
 *
 * Nada desenha fora do figura(). Nenhum operador de estado (tracejado, recorte,
 * cor, espessura) sobrevive a uma figura: o figura() envolve o desenho inteiro,
 * o fundo branco incluido, num q/Q proprio com o Q no finally, e o comEstado faz
 * o mesmo em volta de cada bloco. A promessa vale por construcao e nao por
 * disciplina de quem escreve receita, que e o que importa com 24 primitivas
 * ainda por escrever. As duas regras existem porque os dois defeitos que elas
 * evitam aparecem longe de onde foram cometidos:
 *
 *   - A marca d'agua do gerador e um circulo de raio 96 com um NW de 82 pt em
 *     COR.marca, que tem 1,14 de contraste. Onde ela cruza uma malha em COR.fio
 *     a malha some. Ja aconteceu neste projeto, no grafico de ebulicao de uma prova de fisica:
 *     a faixa que sumiu era justamente a de 100 a 120 graus que a questao mandava
 *     ler. Por isso o retangulo branco vem antes do primeiro traco.
 *
 *   - O padrao de traco e o caminho de recorte sao estado global do fluxo de
 *     conteudo. Um "[2 2] 0 d" sem o "[] 0 d" tracejou o rodape e a figura
 *     seguinte; um "W n" sem o "Q" recortou o resto da folha. E pior neste
 *     gerador do que parece: o finalizar() concatena a moldura DEPOIS do
 *     conteudo (antes.concat(this.pag.ops)), entao um tracejado esquecido no meio
 *     da pagina sai tracejando o fio do rodape da mesma folha.
 *
 * Roda no navegador por <script> (exporta FigBase no global) e no Node.
 *
 * Regra da casa: nunca usar travessao.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FigBase = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ============================================================ o gerador
   *
   * A ligacao com o pdf.js e tardia de proposito. No Node a cadeia de require e
   * circular (pdf.js -> figuras/receitas.js -> figuras/base.js -> pdf.js): se a
   * resolucao acontecesse no topo do arquivo, o module.exports do pdf.js ainda
   * estaria pela metade e COR sairia undefined, em silencio. Resolvendo na
   * primeira chamada de desenho, o pdf.js ja terminou de carregar. No navegador
   * o pdf.js entra por <script> e vira o global PDFGen, que este teste acha
   * primeiro. */
  var cacheGerador = null;
  function gerador() {
    if (cacheGerador) return cacheGerador;
    if (typeof PDFGen !== 'undefined' && PDFGen && PDFGen.COR) cacheGerador = PDFGen;
    else if (typeof require === 'function') {
      try { cacheGerador = require('../pdf.js'); } catch (e) { cacheGerador = null; }
    }
    return cacheGerador;
  }

  /* O desenhador, para a conferencia poder perguntar a ELE o tamanho da caixa
   * que ele imprime em volta de um rotulo, em vez de guardar copia da constante.
   * A ligacao e tardia e tem que ser: o desenho.js depende deste arquivo, entao
   * pedi-lo no topo fecha um ciclo e devolve um module.exports pela metade.
   * Pedido na hora de conferir, o ciclo ja se resolveu.
   *
   * A conferencia funciona sem ele: cai numa aproximacao, com o porque escrito
   * no lugar onde ela e usada. */
  var cacheDesenho = null;
  function moduloDesenho() {
    if (cacheDesenho) return cacheDesenho;
    if (typeof FigDesenho !== 'undefined' && FigDesenho && FigDesenho.caixaDoRotulo) {
      cacheDesenho = FigDesenho;
    } else if (typeof require === 'function') {
      try { cacheDesenho = require('./desenho.js'); } catch (e) { cacheDesenho = null; }
    }
    return cacheDesenho;
  }

  /* Formatador de cor. E o unico pedaco do pdf.js copiado aqui, e e copiado
   * porque e formato e nao dado: a paleta continua morando num lugar so, no
   * COR do pdf.js, e este arquivo pergunta por ela em vez de manter lista
   * propria. Lista repetida em dois lugares diverge no dia em que alguem mexe
   * em um so. */
  function cor3(c) {
    return c[0].toFixed(6) + ' ' + c[1].toFixed(6) + ' ' + c[2].toFixed(6);
  }

  /* Quando o desenho de uma figura falha, o padrao e nao derrubar a folha
   * inteira da aluna por causa de um triangulo: o erro fica registrado no
   * doc.avisosFigura, para o conferirFigura e o verificar.py reprovarem o tema
   * na geracao. Quem esta depurando liga o estrito e recebe a excecao crua. */
  var estado = { estrito: false };

  /* ============================================================ estado grafico */

  /* Os tres tracejados tem nome porque nao podem se confundir entre si: um
   * tracejado significa uma coisa so, e qual coisa depende do padrao. */
  var TRACEJADO = {
    auxiliar: '[3 2] 0',   // construcao acrescentada pelo gabarito
    oculta: '[2 2] 0',     // aresta escondida de solido
    guia: '[1 2] 0',       // linha de leitura, do ponto ao eixo
    nenhum: '[] 0'
  };

  /* O operador d exige DOIS operandos, o vetor de traco e a fase: "[2 2] 0 d".
   * Escrito "[2 2] d" o leitor daqui ignorou o operador inteiro e a linha saiu
   * CONTINUA, em silencio, ou seja uma aresta oculta impressa como aresta
   * visivel; um leitor mais estrito pode abortar o resto do fluxo de conteudo.
   * Por isso a forma crua e validada antes de ser aceita, e a fase que falta e
   * completada com zero em vez de sair na folha como operador invalido. */
  var RE_TRACEJADO = /^\[[\d\s.]*\]\s+\d+(\.\d+)?$/;
  var RE_TRACEJADO_SEM_FASE = /^\[[\d\s.]*\]$/;

  /* Nome que nao esta no dicionario NAO pode virar tracejado nenhum. Antes,
   * qualquer string desconhecida caia em TRACEJADO.auxiliar: um "oculto" com
   * erro de digitacao saia [3 2], que e o padrao de construcao do gabarito, numa
   * aresta escondida de solido; e um "nenhuma" pedindo linha continua devolvia
   * linha tracejada. E o mesmo defeito do COR.vermelho: nome errado cai em
   * silencio. Aqui ele grita e a linha sai continua, que e o unico erro visivel
   * de longe. */
  function padraoTracejado(t, doc) {
    if (!t) return TRACEJADO.nenhum;
    if (t === true) return TRACEJADO.auxiliar;
    if (typeof t === 'string') {
      var s = t.trim();
      if (TRACEJADO[s]) return TRACEJADO[s];
      if (s.charAt(0) === '[') {
        if (RE_TRACEJADO.test(s)) return s;
        if (RE_TRACEJADO_SEM_FASE.test(s)) return s + ' 0';
        avisar(doc, 'tracejado invalido, o operador d pede padrao e fase: ' + t);
        return TRACEJADO.nenhum;
      }
      avisar(doc, 'tracejado desconhecido: ' + t);
      return TRACEJADO.nenhum;
    }
    if (t.length) {
      for (var i = 0; i < t.length; i++) {
        if (!isFinite(Number(t[i])) || Number(t[i]) < 0) {
          avisar(doc, 'tracejado com valor invalido: ' + t.join(' '));
          return TRACEJADO.nenhum;
        }
      }
      return '[' + t.join(' ') + '] 0';
    }
    return TRACEJADO.nenhum;
  }

  /* Um ponto e {x, y} ou o par [x, y]. A distincao importa aqui porque um par
   * TEM length e um {x, y} nao tem: decidir "lista de listas" por
   * recorte[0].length fazia uma lista de pares passar por lista de poligonos, o
   * recorte sumia inteiro e o desenho vazava para fora da regiao, em silencio. */
  function ehPonto(p) {
    if (!p || typeof p !== 'object') return false;
    if (typeof p.x === 'number' && typeof p.y === 'number') return true;
    return isLista(p) && typeof +p[0] === 'number' && p.length >= 2 &&
      isFinite(+p[0]) && isFinite(+p[1]);
  }
  function isLista(v) {
    return Array.isArray ? Array.isArray(v) : Object.prototype.toString.call(v) === '[object Array]';
  }

  /* Normaliza a entrada do recorte em lista de partes, sem adivinhar pela forma
   * do primeiro elemento. Aceita: lista de pontos (um poligono), lista de listas
   * de pontos (regiao com furo) e a caixa {x0, y0, x1, y1}, que antes entrava no
   * ramo errado e produzia um caminho de recorte VAZIO, cujo efeito depende do
   * leitor de PDF (aqui nao recortou nada; um leitor estrito apaga tudo). */
  function partesDoRecorte(doc, recorte) {
    if (!recorte) return null;
    if (!isLista(recorte)) {
      if (recorte.x0 !== undefined && recorte.y0 !== undefined &&
          recorte.x1 !== undefined && recorte.y1 !== undefined) {
        return [[
          ponto(recorte.x0, recorte.y0), ponto(recorte.x1, recorte.y0),
          ponto(recorte.x1, recorte.y1), ponto(recorte.x0, recorte.y1)
        ]];
      }
      avisar(doc, 'recorte em formato desconhecido, recusado');
      return null;
    }
    if (ehPonto(recorte[0])) return [recorte];
    var partes = [];
    for (var i = 0; i < recorte.length; i++) {
      if (!isLista(recorte[i]) || !ehPonto(recorte[i][0])) {
        avisar(doc, 'recorte com parte em formato desconhecido, recusado');
        return null;
      }
      partes.push(recorte[i]);
    }
    return partes.length ? partes : null;
  }

  /* Caminho de recorte. Um recorte que nao recorta tem que gritar, nunca sumir:
   * parte com menos de tres pontos recusa o recorte INTEIRO, em vez de emitir um
   * "W n" com caminho parcial ou vazio. E a regra par e impar (W* n) e a que da a
   * regiao com furo com os dois contornos no mesmo sentido de percurso, que e
   * como o hachurar desenha; com uma parte so as duas regras dao o mesmo
   * resultado, entao emitir sempre W* n casa com o comentario e nao muda o
   * poligono simples. */
  function caminhoDeRecorte(doc, recorte) {
    var partes = partesDoRecorte(doc, recorte);
    if (!partes) return false;
    var s = '';
    for (var i = 0; i < partes.length; i++) {
      var pts = partes[i];
      if (!pts || pts.length < 3) {
        avisar(doc, 'recorte com parte de menos de tres pontos, recusado');
        return false;
      }
      for (var j = 0; j < pts.length; j++) {
        var p = normalizar(pts[j]);
        s += p.x.toFixed(2) + ' ' + p.y.toFixed(2) + (j === 0 ? ' m ' : ' l ');
      }
      s += 'h ';
    }
    if (!s) { avisar(doc, 'recorte vazio, recusado'); return false; }
    doc.op(s.trim());
    return true;
  }

  /* Envelope unico de estado grafico: liga, desenha e DESLIGA sempre, inclusive
   * quando o bloco de desenho lanca no meio. Sem o finally, um tracejado
   * esquecido contamina o resto da folha e o sintoma aparece tres paginas
   * adiante, longe de onde o erro foi cometido.
   *
   * Aviso ao chamador: cor e espessura aqui valem para os caminhos emitidos com
   * doc.op cru. O doc.linha reemite a propria cor (c || COR.fio) e a propria
   * espessura a cada chamada, entao ele passa por cima do que este envelope
   * ligou. Nao e defeito deste arquivo: e o motivo de o poligono() da etapa 2
   * existir como caminho unico. */
  var CHAVES_ESTADO = { tracejado: 1, recorte: 1, cor: 1, preenchimento: 1, espessura: 1 };
  var ESPESSURA_BASE = 0.7;

  function comEstado(doc, est, desenhar) {
    /* Erro de aridade de quem escreve rapido: comEstado(doc, function(){...}).
     * Antes isso produzia exatamente "q | Q" e nenhum traco, sem aviso e sem
     * excecao, porque o est virava a funcao e o desenhar ficava undefined. */
    if (typeof est === 'function' && desenhar === undefined) { desenhar = est; est = {}; }
    est = est || {};
    /* Chave com erro de digitacao (traceado, expessura) era ignorada em silencio
     * e a linha saia continua e fina. Num modulo cuja regra e que silencio e o
     * inimigo, isso e um silencio a menos. */
    for (var k in est) {
      if (Object.prototype.hasOwnProperty.call(est, k) && !CHAVES_ESTADO[k]) {
        avisar(doc, 'comEstado: chave desconhecida ' + k);
      }
    }
    if (typeof desenhar !== 'function') avisar(doc, 'comEstado sem bloco de desenho');
    if (!doc.pag) doc.novaPagina();
    var pagAberta = doc.pag;
    doc.op('q');
    try {
      /* Estado BASE conhecido, para nenhuma primitiva herdar em silencio o que a
       * figura anterior deixou ligado. O caso medido: o fundo branco do figura()
       * deixava "1 1 1 rg" na raiz do fluxo e um "re f" sem cor propria dentro
       * daqui saia branco no branco, sumindo da folha. Como isto esta dentro do
       * q/Q, nao custa nada para quem esta fora. */
      doc.op('[] 0 d');
      doc.op('0 0 0 RG');
      doc.op('0 0 0 rg');
      doc.op(ESPESSURA_BASE.toFixed(2) + ' w');
      if (est.recorte) { if (caminhoDeRecorte(doc, est.recorte)) doc.op('W* n'); }
      if (est.tracejado) doc.op(padraoTracejado(est.tracejado, doc) + ' d');
      if (est.cor) doc.op(cor3(est.cor) + ' RG');
      if (est.preenchimento) doc.op(cor3(est.preenchimento) + ' rg');
      if (est.espessura) doc.op(Number(est.espessura).toFixed(2) + ' w');
      if (typeof desenhar === 'function') desenhar(doc);
    } finally {
      /* Se o bloco virou a pagina no meio, o Q iria para o fluxo da folha
       * seguinte e a folha aberta ficaria com um q pendurado. Cada pagina tem
       * fluxo de conteudo proprio, entao o estado nao vaza de uma para a outra,
       * mas a folha aberta ficaria desbalanceada. O Q volta para ela na mao.
       *
       * O balanco fica certo, mas a metade de baixo do desenho perde o
       * significado: o estado NAO segue para a folha nova, entao um bloco
       * tracejado que atravessa a quebra sai tracejado em cima e continuo
       * embaixo. Reaplicar aqui deixaria um q pendurado sem dono; avisar deixa o
       * conferirFigura reprovar em vez de a folha sair meia tracejada. */
      if (doc.pag === pagAberta) doc.op('Q');
      else {
        pagAberta.ops.push('Q');
        avisar(doc, 'comEstado atravessou quebra de pagina, o estado nao seguiu');
      }
    }
  }

  /* ============================================================ kit geometrico
   *
   * Matematica pura: recebe os numeros do enunciado e devolve pontos, sem
   * desenhar nada. O ponto e sempre {x, y}; uma lista [x, y] tambem e aceita na
   * entrada, para os modulos vizinhos nao precisarem converter. */

  var EPS = 1e-9;

  function normalizar(p) {
    if (p == null) return { x: 0, y: 0 };
    if (typeof p.x === 'number') return p;
    if (p.length >= 2) return { x: +p[0], y: +p[1] };
    return { x: +p.x || 0, y: +p.y || 0 };
  }
  function normalizarLista(pts) {
    var saida = [];
    for (var i = 0; i < (pts || []).length; i++) saida.push(normalizar(pts[i]));
    return saida;
  }
  function ponto(x, y) { return { x: +x, y: +y }; }
  function rad(g) { return g * Math.PI / 180; }
  function graus(r) { return r * 180 / Math.PI; }
  function distancia(A, B) {
    A = normalizar(A); B = normalizar(B);
    return Math.sqrt((B.x - A.x) * (B.x - A.x) + (B.y - A.y) * (B.y - A.y));
  }

  /* Angulo em V, entre VA e VB, em graus, sempre o menor que 180. */
  function anguloEm(V, A, B) {
    V = normalizar(V); A = normalizar(A); B = normalizar(B);
    var ax = A.x - V.x, ay = A.y - V.y, bx = B.x - V.x, by = B.y - V.y;
    var na = Math.sqrt(ax * ax + ay * ay), nb = Math.sqrt(bx * bx + by * by);
    if (na < EPS || nb < EPS) return 0;
    var c = (ax * bx + ay * by) / (na * nb);
    return graus(Math.acos(Math.max(-1, Math.min(1, c))));
  }

  /* Versor da bissetriz interna do angulo em V. E por aqui que sai a posicao do
   * rotulo de angulo: na bissetriz e a unica direcao que nao encosta em nenhum
   * dos dois lados. */
  function bissetriz(V, A, B) {
    V = normalizar(V); A = normalizar(A); B = normalizar(B);
    var ax = A.x - V.x, ay = A.y - V.y, bx = B.x - V.x, by = B.y - V.y;
    var na = Math.sqrt(ax * ax + ay * ay) || 1, nb = Math.sqrt(bx * bx + by * by) || 1;
    var ux = ax / na + bx / nb, uy = ay / na + by / nb;
    var n = Math.sqrt(ux * ux + uy * uy);
    if (n < EPS) return { x: -ay / na, y: ax / na };  // lados opostos: pega a normal
    return { x: ux / n, y: uy / n };
  }

  /* Triangulo pelos dois angulos e pelo lado entre eles. Devolve null quando a
   * configuracao nao existe, e o null e o resultado didatico e nao um erro:
   * trianguloPorAngulos(100, 95) tem que sair null para o exercicio poder mostrar
   * que os dois lados nunca se encontram. */
  function trianguloPorAngulos(gA, gB, base) {
    gA = Number(gA); gB = Number(gB);
    base = (base === undefined || base === null) ? 100 : Number(base);
    if (!isFinite(gA) || !isFinite(gB) || !isFinite(base)) return null;
    if (gA <= 0 || gB <= 0 || base <= 0) return null;
    var gC = 180 - gA - gB;
    if (gC <= 1e-6) return null;
    // lei dos senos: o lado CA e o oposto ao angulo B
    var b = base * Math.sin(rad(gB)) / Math.sin(rad(gC));
    return [
      ponto(0, 0),
      ponto(base, 0),
      ponto(b * Math.cos(rad(gA)), b * Math.sin(rad(gA)))
    ];
  }

  /* Triangulo pelos tres lados, com a convencao brasileira: a e o lado oposto ao
   * vertice A, b o oposto a B, c o oposto a C. Devolve null quando a
   * desigualdade triangular falha, inclusive no caso degenerado em que a soma de
   * dois lados iguala o terceiro: 4 + 7 = 11 nao alcanca 12, e 5 + 5 = 10 nao
   * fecha triangulo nenhum, fecha um segmento. */
  function trianguloPorLados(a, b, c) {
    a = Number(a); b = Number(b); c = Number(c);
    if (!isFinite(a) || !isFinite(b) || !isFinite(c)) return null;
    if (a <= 0 || b <= 0 || c <= 0) return null;
    var tol = 1e-9 * Math.max(a, b, c);
    if (a + b <= c + tol || b + c <= a + tol || a + c <= b + tol) return null;
    var cosA = (b * b + c * c - a * a) / (2 * b * c);
    cosA = Math.max(-1, Math.min(1, cosA));
    var senA = Math.sqrt(1 - cosA * cosA);
    return [ponto(0, 0), ponto(c, 0), ponto(b * cosA, b * senA)];
  }

  /* Poligono regular de n lados. O giro zero e a posicao prototipica: base
   * paralela a margem nos dois casos. Com n impar o primeiro vertice fica no
   * topo (o triangulo aponta para cima); com n par a volta anda meio passo, para
   * o quadrado nao sair apoiado num bico. A explicacao usa giro zero e o
   * exercicio gira de proposito, que e o que impede a aluna de aprender que um
   * quadrado girado deixa de ser quadrado. */
  function poligonoRegular(centro, raio, n, giro) {
    centro = normalizar(centro);
    n = Math.max(3, Math.round(Number(n) || 3));
    raio = Number(raio) || 1;
    var passo = 360 / n;
    var inicio = 90 + (Number(giro) || 0) + (n % 2 === 0 ? passo / 2 : 0);
    var pts = [];
    for (var i = 0; i < n; i++) {
      var t = rad(inicio + i * passo);
      pts.push(ponto(centro.x + raio * Math.cos(t), centro.y + raio * Math.sin(t)));
    }
    return pts;
  }

  function centroide(pontos) {
    var pts = normalizarLista(pontos);
    if (!pts.length) return ponto(0, 0);
    var sx = 0, sy = 0;
    for (var i = 0; i < pts.length; i++) { sx += pts[i].x; sy += pts[i].y; }
    return ponto(sx / pts.length, sy / pts.length);
  }

  function caixa(pontos) {
    var pts = normalizarLista(pontos);
    if (!pts.length) return { x0: 0, y0: 0, x1: 0, y1: 0, largura: 0, altura: 0, cx: 0, cy: 0 };
    var x0 = pts[0].x, x1 = pts[0].x, y0 = pts[0].y, y1 = pts[0].y;
    for (var i = 1; i < pts.length; i++) {
      if (pts[i].x < x0) x0 = pts[i].x;
      if (pts[i].x > x1) x1 = pts[i].x;
      if (pts[i].y < y0) y0 = pts[i].y;
      if (pts[i].y > y1) y1 = pts[i].y;
    }
    return {
      x0: x0, y0: y0, x1: x1, y1: y1,
      largura: x1 - x0, altura: y1 - y0,
      cx: (x0 + x1) / 2, cy: (y0 + y1) / 2
    };
  }

  /* As transformacoes agem sobre a lista de pontos ANTES de desenhar, e nunca
   * por cm no PDF. Um cm escalaria junto a espessura das linhas e deitaria os
   * rotulos com a figura; aqui a geometria gira e o traco e a letra continuam
   * como estavam. */
  function girar(pontos, grausGiro, centro) {
    var pts = normalizarLista(pontos);
    var c = centro ? normalizar(centro) : centroide(pts);
    var t = rad(Number(grausGiro) || 0), co = Math.cos(t), se = Math.sin(t);
    return pts.map(function (p) {
      var dx = p.x - c.x, dy = p.y - c.y;
      return ponto(c.x + dx * co - dy * se, c.y + dx * se + dy * co);
    });
  }

  function transladar(pontos, dx, dy) {
    dx = Number(dx) || 0; dy = Number(dy) || 0;
    return normalizarLista(pontos).map(function (p) { return ponto(p.x + dx, p.y + dy); });
  }

  /* Escala com um fator so, de proposito. Fator diferente em x e em y e o
   * defeito herdado do graficos.js, onde esta certo porque temperatura contra
   * calor nao tem proporcao; em geometria o quadrado vira retangulo e o
   * quadradinho de angulo reto passa a mentir.
   *
   * Fator zero ou nao finito e sempre erro de quem chamou, e devolvia a figura
   * inalterada em silencio: agora devolve null, como o resto do kit devolve null
   * para configuracao que nao existe, e o chamador trata. Fator negativo E
   * aceito e reflete a lista pelo centro (escalar([{0,0},{2,0}], -2) devolve
   * [{3,0}, {-1,0}]), o que inverte a orientacao da figura: esta escrito aqui
   * porque antes o unico jeito de descobrir era medindo. */
  function escalar(pontos, k, centro) {
    var pts = normalizarLista(pontos);
    k = Number(k);
    if (!isFinite(k) || k === 0) return null;
    var c = centro ? normalizar(centro) : centroide(pts);
    return pts.map(function (p) {
      return ponto(c.x + (p.x - c.x) * k, c.y + (p.y - c.y) * k);
    });
  }

  /* Espelha na reta paralela a um eixo. eixo 'x' reflete na horizontal y = em
   * (o de cima vira o de baixo); eixo 'y' reflete na vertical x = em. */
  function espelhar(pontos, eixo, em) {
    var pts = normalizarLista(pontos);
    var cx = caixa(pts);
    var vertical = String(eixo || 'y').toLowerCase() === 'y';
    var linha = (em === undefined || em === null) ? (vertical ? cx.cx : cx.cy) : Number(em);
    return pts.map(function (p) {
      return vertical ? ponto(2 * linha - p.x, p.y) : ponto(p.x, 2 * linha - p.y);
    });
  }

  /* Pe da perpendicular baixada de P sobre a reta AB. Devolve tambem o parametro
   * t ao longo de AB e se ele caiu dentro do segmento: e esse "dentro" que decide
   * se a altura do triangulo obtusangulo precisa do prolongamento tracejado. */
  function pe(P, A, B) {
    P = normalizar(P); A = normalizar(A); B = normalizar(B);
    var vx = B.x - A.x, vy = B.y - A.y;
    var den = vx * vx + vy * vy;
    if (den < EPS) return { x: A.x, y: A.y, t: 0, dentro: true };
    var t = ((P.x - A.x) * vx + (P.y - A.y) * vy) / den;
    return { x: A.x + t * vx, y: A.y + t * vy, t: t, dentro: t >= -1e-9 && t <= 1 + 1e-9 };
  }

  function pontoNoSegmento(A, B, t) {
    A = normalizar(A); B = normalizar(B);
    t = Number(t); if (!isFinite(t)) t = 0.5;
    return ponto(A.x + (B.x - A.x) * t, A.y + (B.y - A.y) * t);
  }

  /* Enquadramento isotropico: leva a caixa do problema para a caixa da pagina com
   * UM fator de escala so, k igual ao menor dos dois, e a sobra vai para margem e
   * nao para esticamento. O eixo y do problema e o do PDF crescem os dois para
   * cima, entao nao ha inversao aqui; quem desce e o doc.y, conforme a pagina
   * avanca, e disso cuida o figura(). */
  function enquadrar(unidades, alvo) {
    var u = unidades || { x0: 0, y0: 0, x1: 1, y1: 1 };
    var lu = (u.x1 - u.x0), au = (u.y1 - u.y0);
    var kx = lu > EPS ? alvo.largura / lu : Infinity;
    var ky = au > EPS ? alvo.altura / au : Infinity;
    var k = Math.min(kx, ky);
    if (!isFinite(k) || k <= 0) k = 1;
    var ox = alvo.x + (alvo.largura - lu * k) / 2 - u.x0 * k;
    var oy = alvo.y + (alvo.altura - au * k) / 2 - u.y0 * k;
    return {
      k: k,
      p: function (p) { var q = normalizar(p); return ponto(ox + q.x * k, oy + q.y * k); },
      pontos: function (lista) {
        var saida = [], pts = normalizarLista(lista);
        for (var i = 0; i < pts.length; i++) saida.push(ponto(ox + pts[i].x * k, oy + pts[i].y * k));
        return saida;
      },
      inverso: function (p) { var q = normalizar(p); return ponto((q.x - ox) / k, (q.y - oy) / k); }
    };
  }

  var geo = {
    ponto: ponto, distancia: distancia, anguloEm: anguloEm, bissetriz: bissetriz,
    trianguloPorAngulos: trianguloPorAngulos, trianguloPorLados: trianguloPorLados,
    poligonoRegular: poligonoRegular,
    girar: girar, transladar: transladar, escalar: escalar, espelhar: espelhar,
    centroide: centroide, caixa: caixa, pe: pe, pontoNoSegmento: pontoNoSegmento,
    enquadrar: enquadrar, rad: rad, graus: graus, normalizar: normalizar
  };

  /* ============================================================ o bloco */

  var TAM_LEGENDA = 7.5;
  var FOLGA_PADRAO = 16;     // anel em pontos onde os rotulos externos cabem
  var ALTURA_PADRAO = 132;
  var MAX_MARCAS = 5;

  /* A ordem de pintura e imposta pelo figura(), e nao pela disciplina de quem
   * escreve a receita: invertida, o preenchimento apaga o contorno e o
   * quadradinho, e a hachura risca as letras. A receita empilha o que quer em
   * cada camada e o figura() executa as filas nesta ordem. */
  var CAMADAS = ['fundo', 'preenchimento', 'hachura', 'contorno', 'marcas', 'rotulos'];

  var DESTINO = {
    traco: 'tracos', rotulo: 'rotulos', marca: 'marcas',
    ponto: 'pontos', aviso: 'avisos'
  };

  function caixaDeUnidades(u) {
    if (!u) return null;
    if (u.length) return caixa(u);                       // lista de pontos
    if (u.x0 !== undefined) {
      return {
        x0: +u.x0, y0: +u.y0, x1: +u.x1, y1: +u.y1,
        largura: u.x1 - u.x0, altura: u.y1 - u.y0,
        cx: (u.x0 + u.x1) / 2, cy: (u.y0 + u.y1) / 2
      };
    }
    return null;
  }

  /* Quanto a folha inteira do bloco vai gastar, ANTES de escrever qualquer
   * coisa. Existe separada do figura() porque quem escreve o exercicio precisa
   * reservar numero, enunciado e figura de uma vez so: reservada so a figura,
   * o enunciado ficava no pe de uma folha e o desenho dele aparecia no topo da
   * seguinte, acima de nada. Uma medida so, num lugar so, para as duas nao
   * divergirem no dia em que alguem mexer em uma. */
  function medidaDoBloco(opcoes) {
    opcoes = opcoes || {};
    var g = gerador();
    if (!g || !g.COR) throw new Error('figuras/base.js nao achou o pdf.js (nem PDFGen global nem require)');

    var x = opcoes.x != null ? Number(opcoes.x) : g.MARG_E;
    var largura = opcoes.largura != null ? Number(opcoes.largura) : (g.MARG_D - x);
    var altura = opcoes.altura != null ? Number(opcoes.altura) : ALTURA_PADRAO;
    var folga = opcoes.folga != null ? Number(opcoes.folga) : FOLGA_PADRAO;
    var antes = opcoes.antes != null ? Number(opcoes.antes) : 6;
    var depois = opcoes.depois != null ? Number(opcoes.depois) : 6;

    /* A legenda vem SEMPRE do tema, o aviso de escala incluido. Aqui morava a
     * unica frase em portugues do kit inteiro que saia IMPRESSA na folha: o
     * "Figura fora de escala." nascia dentro do desenhador toda vez que a
     * diretiva pedia fora de escala sem trazer legenda, e a folha em INGLES saia
     * com uma frase portuguesa no pe da figura. Nenhuma conferencia de conta
     * pegaria isso, porque conta nao tem lingua, e a folha em ingles do
     * exercicio 15 so passou porque alguem lembrou de escrever legenda= nas duas
     * linguas. Enquanto a frase morar no desenhador, todo tema com figura
     * algebrica depende dessa lembranca.
     *
     * Agora o desenhador RECUSA inventar texto: quando falta a frase, a medida
     * diz que falta (faltaAvisoDeEscala) e quem reprova o tema e o figura(), uma
     * vez so. Recusar aqui, no medidaDoBloco, seria pior do que o defeito: o
     * alturaDoBloco do receitas.js chama esta funcao SO para medir, e um aviso
     * emitido na medicao sairia duas vezes por figura. */
    var legenda = opcoes.legenda ? String(opcoes.legenda) : '';
    var alturaLegenda = legenda ? TAM_LEGENDA * 1.7 : 0;

    /* A caixa nunca pode ser mais alta do que uma folha inteira: o garanteEspaco
     * so sabe virar a pagina uma vez, e uma figura maior que a folha ficaria
     * caindo por cima do rodape em toda pagina nova. Encolher e o unico
     * comportamento honesto aqui. */
    var cabeNaFolha = (g.Y_TOPO - g.Y_LIMITE) - antes - depois - alturaLegenda;
    if (altura > cabeNaFolha) altura = cabeNaFolha;
    if (altura < 24) altura = 24;
    if (folga * 2 > altura - 8) folga = Math.max(0, (altura - 8) / 2);

    return {
      x: x, largura: largura, altura: altura, folga: folga,
      antes: antes, depois: depois, legenda: legenda, alturaLegenda: alturaLegenda,
      faltaAvisoDeEscala: !!opcoes.foraDeEscala && !legenda,
      total: antes + altura + alturaLegenda + depois
    };
  }

  /* Unico ponto de entrada de desenho.
   *
   *   figura(doc, {x, largura, altura, folga, unidades, legenda, foraDeEscala,
   *                fase, id, receita, antes, depois}, desenhar)
   *
   * Reserva o bloco antes do primeiro traco, pinta o fundo branco, instala o
   * sistema de coordenadas isotropico, executa as camadas na ordem fixa, escreve
   * a legenda e devolve o registro do que foi desenhado, com o novo doc.y dentro
   * dele. O registro e o que o conferirFigura audita depois. */
  function figura(doc, opcoes, desenhar) {
    opcoes = opcoes || {};
    var g = gerador();
    /* Sem o gerador nao ha paleta, nem medir(), nem os limites da folha. Falhar
     * aqui, com nome, e melhor do que um TypeError trinta linhas adiante. */
    if (!g || !g.COR) throw new Error('figuras/base.js nao achou o pdf.js (nem PDFGen global nem require)');
    var COR = g.COR;
    if (!doc.pag) doc.novaPagina();

    var med = medidaDoBloco(opcoes);
    var x = med.x, largura = med.largura, altura = med.altura, folga = med.folga;
    var antes = med.antes, depois = med.depois;
    var legenda = med.legenda, alturaLegenda = med.alturaLegenda;

    var total = med.total;
    /* A reserva acontece ANTES do primeiro traco. O doc.y so pode ser lido
     * depois desta chamada: quando ela vira a pagina, o cursor volta para o
     * topo, e coordenadas calculadas antes desenhariam metade da figura na folha
     * seguinte, ou por cima do rodape. */
    var quebrou = doc.garanteEspaco(total);
    var topo = doc.y - antes;
    var base = topo - altura;

    var registro = {
      id: opcoes.id || null,
      receita: opcoes.receita || null,
      fase: opcoes.fase || 'enunciado',
      foraDeEscala: !!opcoes.foraDeEscala,
      legenda: legenda || null,
      quebrouPagina: !!quebrou,
      caixa: { x: x, y: base, largura: largura, altura: altura },
      unidades: null, escala: 1,
      tracos: [], rotulos: [], marcas: [], pontos: [], avisos: [],
      marcasAtivas: 0, y: doc.y,
      /* O texto bruto da diretiva que gerou esta figura. E a unica fonte
       * autorizada de PALAVRA dentro do desenho: a trava (e) do conferirFigura
       * compara o que foi impresso com o que o tema escreveu, e o que nao veio
       * do tema nasceu no desenhador. Comparar com o tema em vez de procurar
       * palavra portuguesa e o que faz a trava valer nas duas linguas. */
      diretiva: textoDaDiretiva(doc, opcoes),
      medido: null, conferencia: null
    };

    /* O aviso de escala e TEXTO, e texto vem do tema. Aqui o desenhador recusa
     * inventar a frase e reprova o tema, uma vez so, em vez de imprimir
     * portugues numa folha em ingles. */
    if (med.faltaAvisoDeEscala) {
      registro.avisos.push('figura fora de escala sem legenda: o aviso de escala e ' +
        'frase, e frase vem do tema. Escreva legenda= na diretiva @fig, nas duas linguas.');
    }

    var unidades = caixaDeUnidades(opcoes.unidades);
    var alvo = {
      x: x + folga, y: base + folga,
      largura: Math.max(1, largura - 2 * folga),
      altura: Math.max(1, altura - 2 * folga)
    };
    /* Sem unidades a receita ja desenha em pontos da pagina: a conversao vira a
     * identidade e a escala e 1. */
    var enq = unidades
      ? enquadrar(unidades, alvo)
      : { k: 1, p: normalizar, pontos: normalizarLista, inverso: normalizar };
    registro.unidades = unidades;
    registro.escala = enq.k;

    var filas = {};
    for (var c = 0; c < CAMADAS.length; c++) filas[CAMADAS[c]] = [];

    var ctx = {
      doc: doc,
      p: enq.p,
      pontos: enq.pontos,
      k: enq.k,
      caixa: alvo,
      blocoInteiro: registro.caixa,
      unidades: unidades,
      fase: registro.fase,
      registro: registro,
      /* anota o que foi desenhado, para o conferirFigura poder auditar depois:
       * contar as marcas ativas, achar rotulo sobreposto, traco abaixo do piso. */
      anota: function (tipo, dado) {
        var destino = DESTINO[tipo];
        if (!destino) destino = 'avisos';
        registro[destino].push(dado);
        return dado;
      }
    };
    for (var c2 = 0; c2 < CAMADAS.length; c2++) {
      (function (nome) {
        ctx[nome] = function (fn) { if (typeof fn === 'function') filas[nome].push(fn); };
      })(CAMADAS[c2]);
    }

    /* Envelope q/Q da figura INTEIRA, o fundo branco incluido. E o que torna
     * verdadeira por construcao a promessa do cabecalho deste arquivo, em vez de
     * depender da disciplina de quem escreve receita, com 24 primitivas ainda por
     * escrever. O caso medido: uma receita que liga tracejado e lanca no meio
     * deixava o "[3 2] 0 d" ligado em profundidade ZERO, e como o finalizar()
     * concatena a moldura DEPOIS do conteudo (antes.concat(this.pag.ops)), o
     * texto seguinte, o fio do cabecalho e o fio do rodape da MESMA folha saiam
     * todos tracejados. O fundo branco entra aqui pelo mesmo motivo: ele acendia
     * "1 1 1 rg" na raiz do fluxo e a cor de preenchimento branca ficava ligada
     * pelo resto da pagina. */
    var erroDaReceita = null;
    var pagAberta = doc.pag;
    /* Onde comeca o fluxo de conteudo DESTA figura. E por aqui que o
     * conferirFigura mede: o registro conta o que a receita quis anotar, o fluxo
     * conta o que vai sair impresso, e os trinta defeitos que passaram
     * silenciosos foram todos achados medindo o segundo e nao o primeiro. Uma
     * marca que a receita esqueceu de anotar continua no fluxo; um numero que
     * nasceu dentro do desenhador tambem. */
    var deOps = pagAberta.ops.length;
    doc.op('q');
    try {
      /* Fundo branco antes de qualquer traco, e antes de qualquer titulo. Cobre a
       * caixa inteira, inclusive o anel de folga onde os rotulos externos moram,
       * porque e la que a marca d'agua mais atrapalha: COR.marca tem 1,14 de
       * contraste e COR.fio tem 1,53, quase a mesma tinta. */
      var rx = Math.max(2, x);
      var rl = Math.min(g.PAGINA_L - 2, x + largura) - rx;
      doc.retangulo(rx, base, rl, altura, COR.branco);

      if (typeof desenhar === 'function') desenhar(ctx);
      for (var i = 0; i < CAMADAS.length; i++) {
        var fila = filas[CAMADAS[i]];
        for (var j = 0; j < fila.length; j++) fila[j](ctx);
      }
    } catch (erro) {
      /* So empurra em registro.avisos: o laco do fim e o unico que chama o
       * avisar(). Antes o mesmo erro entrava duas vezes no doc.avisosFigura, e um
       * erro que conta dois desloca qualquer limiar do conferirFigura. */
      erroDaReceita = erro;
      registro.erro = String(erro && erro.message ? erro.message : erro);
      registro.avisos.push('a receita falhou: ' + registro.erro);
    } finally {
      /* O Q sai SEMPRE, inclusive quando a receita lancou no meio: e ele que
       * desliga tracejado, recorte, cor e espessura que a receita tenha deixado
       * acesos. Se o bloco virou a pagina, o Q volta na mao para a folha aberta,
       * pelo mesmo motivo do comEstado. */
      if (doc.pag === pagAberta) doc.op('Q');
      else pagAberta.ops.push('Q');
    }

    /* O fluxo desta figura, e so dele. Quando a receita virou a pagina no meio, a
     * metade de baixo esta no fluxo da folha nova: as duas entram, senao a
     * medicao auditaria meia figura e daria a outra metade por limpa. */
    var fluxo = pagAberta.ops.slice(deOps);
    if (doc.pag !== pagAberta && doc.pag) fluxo = fluxo.concat(doc.pag.ops);

    /* Legenda em 7,5 pt COR.muted, abaixo e a direita, e so nos dois casos que a
     * convencao permite: o aviso de escala e a glosa da hachura. Legenda
     * descritiva viraria um segundo texto para ler. */
    if (legenda) {
      doc.texto(legenda, x + largura, base - TAM_LEGENDA - 2,
        { tam: TAM_LEGENDA, cor: COR.muted, align: 'direita' });
    }

    registro.marcasAtivas = registro.rotulos.length + registro.marcas.length;

    /* As travas. Rodam em TODA figura desenhada, e nao quando alguem lembra de
     * chamar: os trinta defeitos serios e fatais que a revisao achou passaram
     * todos por aqui sem uma linha de aviso, e o que os deixou passar nao foi o
     * criterio, foi a ausencia de conferencia.
     *
     * Quem REPROVA e a figura que nasceu de uma receita, ou seja, a que veio de
     * um tema: e o tema que precisa ser reprovado, e e ele que o verificar.py
     * segura antes de virar folha. Figura montada na mao (pagina de prova,
     * experimento) recebe a mesma medicao em registro.conferencia e nao reprova
     * ninguem, porque ali nao ha tema para reprovar. O opcoes.conferir manda por
     * cima nos dois sentidos, para uma prova poder exigir a reprovacao. */
    try {
      registro.medido = lerFluxo(fluxo);
      registro.conferencia = conferirFigura(registro, opcoes.travas || null);
    } catch (eMed) {
      registro.conferencia = ['a medicao do fluxo falhou: ' +
        (eMed && eMed.message ? eMed.message : eMed)];
    }
    var reprova = opcoes.conferir != null ? !!opcoes.conferir : !!registro.receita;
    for (var t = 0; t < registro.conferencia.length; t++) {
      /* O teto de marcas ja reprovava TODA figura antes destas travas existirem,
       * inclusive a montada na mao, e continua reprovando: tirar aviso e mudanca
       * de contrato com quem ja depende dele. */
      if (reprova || registro.conferencia[t].indexOf('marcas ativas') === 0) {
        registro.avisos.push(registro.conferencia[t]);
      }
    }

    if (registro.avisos.length) {
      for (var a = 0; a < registro.avisos.length; a++) {
        avisar(doc, 'figura ' + (registro.id || registro.receita || '?') + ': ' + registro.avisos[a]);
      }
    }

    doc.y = base - alturaLegenda - depois;
    registro.y = doc.y;
    (doc.figurasDesenhadas = doc.figurasDesenhadas || []).push(registro);
    /* O estrito sobe a excecao SO aqui, depois de o doc.y avancar e de o registro
     * entrar em figurasDesenhadas: subindo antes, depurar em estrito produzia uma
     * folha com layout diferente da folha real, que e o oposto do que se quer de
     * um modo de depuracao. */
    if (erroDaReceita && estado.estrito) throw erroDaReceita;
    return registro;
  }

  /* O doc pode faltar: o padraoTracejado e o caminhoDeRecorte tambem sao
   * chamados de fora de um desenho, e um aviso que derruba o processo por causa
   * disso seria pior do que o defeito que ele denuncia. Sem doc o aviso ainda sai
   * no console, que e o unico canal que existe ali. */
  function avisar(doc, texto) {
    if (doc) (doc.avisosFigura = doc.avisosFigura || []).push(texto);
    if (typeof console !== 'undefined' && console.warn) console.warn('[figura] ' + texto);
  }

  /* A diretiva que o tema escreveu para ESTA figura. O caminho da diretiva ate o
   * desenho passa pelo receitas.js, que entrega ao figura() so id, fase e
   * legenda: a ponte de volta fica aqui porque as duas pontas, a leitura da
   * diretiva e o desenho, sao deste arquivo. */
  function diretivaDaVez(doc, opcoes) {
    var d = null;
    if (doc && opcoes.id && doc.figurasPorId) d = doc.figurasPorId[opcoes.id];
    if (!d && doc && doc.figuraDaVez) {
      var v = doc.figuraDaVez;
      if (!opcoes.receita || !v.receita ||
          String(v.receita).toLowerCase() === String(opcoes.receita).toLowerCase()) d = v;
    }
    return d;
  }

  /* O texto que o TEMA escreveu para esta figura, diretiva crua mais valores mais
   * legenda. E a unica origem autorizada de palavra dentro do desenho. */
  function textoDaDiretiva(doc, opcoes) {
    var d = diretivaDaVez(doc, opcoes), k;
    var partes = [];
    if (opcoes.legenda) partes.push(String(opcoes.legenda));
    if (d) {
      partes.push(String(d.bruto || ''));
      if (d.legenda) partes.push(String(d.legenda));
      for (k in (d.args || {})) {
        if (Object.prototype.hasOwnProperty.call(d.args, k)) {
          partes.push(k + ' ' + [].concat(d.args[k]).join(' '));
        }
      }
    }
    return partes.join(' ');
  }

  /* O que o TEMA PEDIU, em forma de incognita, lido da propria diretiva. Duas
   * fontes, as duas neutras de lingua porque sao chave e valor de argumento e nao
   * prosa: a chave incognita=<vertice>, que nomeia o angulo perguntado, e
   * qualquer valor de argumento que seja uma expressao numa incognita (3x+10).
   *
   * Existe porque a trava (a) precisa enxergar a incognita que a figura NAO
   * desenhou, e uma incognita ausente nao deixa rastro nem no registro nem no
   * fluxo: o unico lugar onde ela ainda existe e o texto que o tema escreveu. */
  function pedidosDaDiretiva(doc, opcoes) {
    var saida = { expressoes: [], nomeadas: 0 };
    var d = diretivaDaVez(doc, opcoes);
    if (!d) return saida;
    var args = d.args || {}, k;
    for (k in args) {
      if (!Object.prototype.hasOwnProperty.call(args, k)) continue;
      var vals = [].concat(args[k]);
      for (var i = 0; i < vals.length; i++) {
        var partes = String(vals[i]).split(';');
        for (var j = 0; j < partes.length; j++) {
          var v = partes[j].trim();
          if (!v) continue;
          if (k === 'incognita') { saida.nomeadas++; continue; }
          if (expressaoLinear(v) && saida.expressoes.indexOf(v) < 0) saida.expressoes.push(v);
        }
      }
    }
    return saida;
  }

  /* ============================================================ medicao do fluxo
   *
   * O que sai impresso, lido do proprio fluxo de conteudo, sem perguntar a quem
   * desenhou. Existe porque o registro conta a INTENCAO da receita e a folha
   * mostra o RESULTADO, e os trinta defeitos serios e fatais da revisao vivem
   * exatamente na diferenca entre os dois: um arco que a receita nao anotou
   * continua no fluxo, um numero que nasceu dentro do desenhador tambem, e a
   * espessura de verdade e a que o operador w acendeu, nao a que a receita
   * pretendia.
   *
   * A revisao inteira foi feita medindo aqui, e nao no olho. A conferencia
   * tambem tem que ser. */

  /* Tokenizador de fluxo de conteudo. Cobre o que este gerador emite: numero,
   * nome (/F1), literal de texto entre parenteses com escape, vetor de traco
   * entre colchetes e operador. */
  function tokensDoFluxo(s) {
    var t = [], i = 0, n = s.length;
    while (i < n) {
      var c = s.charAt(i);
      if (c === ' ' || c === '\n' || c === '\r' || c === '\t') { i++; continue; }
      if (c === '(') {
        var j = i + 1, nivel = 1, txt = '';
        while (j < n) {
          var d = s.charAt(j);
          if (d === '\\') { txt += d + s.charAt(j + 1); j += 2; continue; }
          if (d === '(') nivel++;
          if (d === ')') { nivel--; if (!nivel) { j++; break; } }
          txt += d; j++;
        }
        t.push({ t: 'str', v: txt }); i = j; continue;
      }
      if (c === '[') {
        var f = s.indexOf(']', i);
        if (f < 0) f = n;
        t.push({ t: 'arr', v: s.slice(i + 1, f).trim() });
        i = f + 1; continue;
      }
      if (c === '/') {
        var g2 = i + 1;
        while (g2 < n && ' \n\r\t/[]()'.indexOf(s.charAt(g2)) < 0) g2++;
        t.push({ t: 'nome', v: s.slice(i + 1, g2) });
        i = g2; continue;
      }
      var h2 = i;
      while (h2 < n && ' \n\r\t/[]()'.indexOf(s.charAt(h2)) < 0) h2++;
      if (h2 === i) { i++; continue; }
      var w = s.slice(i, h2);
      i = h2;
      if (/^[-+]?(\d+\.?\d*|\.\d+)$/.test(w)) t.push({ t: 'num', v: parseFloat(w) });
      else t.push({ t: 'op', v: w });
    }
    return t;
  }

  /* Literal de texto do PDF de volta para caracteres. O gerador escreve WinAnsi
   * com escape de barra, e os acentos que interessam moram de 0xC0 para cima,
   * onde WinAnsi e Latin-1 coincidem. */
  function textoDoLiteral(bruto) {
    var out = '', i = 0;
    while (i < bruto.length) {
      var c = bruto.charAt(i);
      if (c !== '\\') { out += c; i++; continue; }
      var p = bruto.charAt(i + 1);
      if (p >= '0' && p <= '7') {
        var oct = p, j = i + 2;
        while (j < bruto.length && oct.length < 3 && bruto.charAt(j) >= '0' && bruto.charAt(j) <= '7') {
          oct += bruto.charAt(j); j++;
        }
        out += String.fromCharCode(parseInt(oct, 8)); i = j; continue;
      }
      if (p === 'n') { out += '\n'; i += 2; continue; }
      out += p; i += 2;
    }
    return out;
  }

  /* O texto que a folha IMPRIME, e nao o byte que o fluxo carrega.
   *
   * O pdf.js manda pi, alfa, beta e teta para a base-14 /Symbol, onde eles
   * viajam como os BYTES 0x70, 0x61, 0x62 e 0x71, ou seja como "p", "a", "b" e
   * "q" em ASCII (pdf.js, mapa SIMBOLOS, e o partirSimbolo que ja entrega o
   * trecho com o byte da Symbol). Lido cru, o rotulo "α" chega ate aqui como
   * "a": a trava do valor de angulo sem arco, que exclui a letra de comprimento
   * sozinha (r, d, a, b, c, p, h), ficava CEGA para as tres gregas, e alfa e
   * teta sao a notacao corrente dos temas (MAT08-13 escreve o angulo central
   * como alfa, MAT09-09 escreve o agudo como teta). Uma figura de setor com a
   * incognita solta, sem arco, passava calada pelo portao.
   *
   * A traducao acontece aqui porque este e o unico lugar que sabe QUAL fonte
   * estava acesa no Tj. Depois dela a trava compara contra o caractere de
   * verdade, e nao contra o byte, e o mapa continua morando num lugar so, no
   * SIMBOLOS do pdf.js, em vez de virar copia que diverge. De quebra a largura
   * medida no ET passa a ser a da Symbol (alfa mede 631 e nao os 556 do "a"). */
  var cacheSimbolos = null;
  function deSimbolo(txt) {
    if (!cacheSimbolos) {
      var g = gerador();
      if (!g || !g.SIMBOLOS) return txt;   // sem o gerador, o byte cru e o que ha
      cacheSimbolos = {};
      for (var k in g.SIMBOLOS) {
        if (Object.prototype.hasOwnProperty.call(g.SIMBOLOS, k)) {
          cacheSimbolos[String.fromCharCode(g.SIMBOLOS[k])] = k;
        }
      }
    }
    var out = '';
    for (var i = 0; i < txt.length; i++) {
      var c = txt.charAt(i);
      out += (cacheSimbolos[c] !== undefined ? cacheSimbolos[c] : c);
    }
    return out;
  }

  function lum(c) {
    function f(v) { return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  }
  function contrasteNoBranco(c) {
    return 1.05 / (lum(c) + 0.05);
  }
  function nomeDaCor(c) {
    var g = gerador();
    if (!g || !g.COR) return null;
    for (var k in g.COR) {
      if (!Object.prototype.hasOwnProperty.call(g.COR, k)) continue;
      var v = g.COR[k];
      if (Math.abs(v[0] - c[0]) < 0.002 && Math.abs(v[1] - c[1]) < 0.002 &&
          Math.abs(v[2] - c[2]) < 0.002) return k;
    }
    return null;
  }

  /* Circulo por minimos quadrados sobre os pontos do sub-caminho. Tres pontos
   * bastariam, mas tres pontos de um arco quase reto dao centro no infinito e o
   * ajuste em cima de todos e estavel. Devolve null quando o residuo mostra que
   * aquilo nao e arco de circunferencia (uma curva de rotulo girado, por
   * exemplo). */
  function ajustarCirculo(pts) {
    var n = pts.length;
    if (n < 3) return null;
    var Sx = 0, Sy = 0, Sxx = 0, Syy = 0, Sxy = 0, Sz = 0, Szx = 0, Szy = 0;
    for (var i = 0; i < n; i++) {
      var x = pts[i].x, y = pts[i].y, z = x * x + y * y;
      Sx += x; Sy += y; Sxx += x * x; Syy += y * y; Sxy += x * y;
      Sz += z; Szx += z * x; Szy += z * y;
    }
    var A = [[Sxx, Sxy, Sx], [Sxy, Syy, Sy], [Sx, Sy, n]];
    var b = [-Szx, -Szy, -Sz];
    var sol = resolver3(A, b);
    if (!sol) return null;
    var cx = -sol[0] / 2, cy = -sol[1] / 2;
    var r2 = cx * cx + cy * cy - sol[2];
    if (!(r2 > 0)) return null;
    var r = Math.sqrt(r2);
    var pior = 0;
    for (var j = 0; j < n; j++) {
      var dx = pts[j].x - cx, dy = pts[j].y - cy;
      pior = Math.max(pior, Math.abs(Math.sqrt(dx * dx + dy * dy) - r));
    }
    if (pior > Math.max(0.35, 0.03 * r)) return null;
    /* O varrido sai da soma dos passos entre pontos consecutivos, cada um menor
     * que 90 graus por construcao do emissor de arco: somar assim nao tropeca no
     * corte do atan2, que e onde uma conta de "angulo final menos inicial" erra
     * o sinal e devolve 300 onde varreu 60. */
    var varre = 0, ang0 = null, angAnt = null;
    for (var k = 0; k < n; k++) {
      var a = Math.atan2(pts[k].y - cy, pts[k].x - cx);
      if (angAnt !== null) {
        var d2 = a - angAnt;
        while (d2 <= -Math.PI) d2 += 2 * Math.PI;
        while (d2 > Math.PI) d2 -= 2 * Math.PI;
        varre += d2;
      } else ang0 = a;
      angAnt = a;
    }
    return {
      cx: cx, cy: cy, raio: r, de: graus(ang0), varre: graus(varre),
      abertura: Math.abs(graus(varre)), pontos: pts
    };
  }

  function resolver3(A, b) {
    var M = [A[0].concat([b[0]]), A[1].concat([b[1]]), A[2].concat([b[2]])];
    for (var i = 0; i < 3; i++) {
      var p = i;
      for (var r = i + 1; r < 3; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
      if (Math.abs(M[p][i]) < 1e-12) return null;
      var tmp = M[i]; M[i] = M[p]; M[p] = tmp;
      for (var r2 = 0; r2 < 3; r2++) {
        if (r2 === i) continue;
        var f = M[r2][i] / M[i][i];
        for (var c = i; c < 4; c++) M[r2][c] -= f * M[i][c];
      }
    }
    return [M[0][3] / M[0][0], M[1][3] / M[1][1], M[2][3] / M[2][2]];
  }

  /* Interpretador do fluxo. Devolve o que sera impresso: arcos com centro, raio e
   * varrido, segmentos retos, textos com corpo e posicao, e a lista de espessuras
   * e cores realmente acesas. Caminho usado como recorte (W n) nao conta como
   * traco: ele nao pinta nada. */
  function lerFluxo(ops) {
    var tk = tokensDoFluxo([].concat(ops || []).join('\n'));
    var pilha = [];
    var gs = { w: 1, traco: [0, 0, 0], preench: [0, 0, 0], tracejado: '[] 0' };
    var pilhaGs = [];
    var subs = [], atual = null, recorte = false;
    var saida = {
      arcos: [], segmentos: [], textos: [], areas: [],
      espessuras: [], varreduras: 0
    };
    var bt = null;

    function num(k) {
      var v = pilha[pilha.length - k];
      return v && v.t === 'num' ? v.v : 0;
    }
    function abrir(x, y) { atual = { pts: [{ x: x, y: y }], curvo: false, fechado: false }; subs.push(atual); }
    function limpar() { subs = []; atual = null; recorte = false; }

    function pintar(traca, preenche) {
      var vale = [];
      for (var i = 0; i < subs.length; i++) if (subs[i].pts.length > 1) vale.push(subs[i]);
      if (recorte || (!traca && !preenche)) { limpar(); return; }
      if (traca) {
        /* Uma varredura e um unico S com muitos sub-caminhos: e a assinatura da
         * hachura e da malha, os dois unicos tracos autorizados abaixo do piso de
         * espessura. Contar aqui e o que separa "textura" de "linha que carrega
         * informacao" sem depender de a receita declarar. */
        var varredura = vale.length >= 3;
        if (varredura) saida.varreduras++;
        for (var j = 0; j < vale.length; j++) {
          var sub = vale[j];
          if (sub.curvo) {
            var arco = ajustarCirculo(sub.pts);
            if (arco) {
              arco.w = gs.w; arco.cor = gs.traco.slice(); arco.tracejado = gs.tracejado;
              saida.arcos.push(arco);
              continue;
            }
          }
          var reais = [];
          for (var r3 = 0; r3 < sub.pts.length; r3++) if (!sub.pts[r3].amostra) reais.push(sub.pts[r3]);
          for (var s = 1; s < reais.length; s++) {
            saida.segmentos.push({
              x1: reais[s - 1].x, y1: reais[s - 1].y,
              x2: reais[s].x, y2: reais[s].y,
              w: gs.w, cor: gs.traco.slice(), tracejado: gs.tracejado, varredura: varredura
            });
          }
          if (sub.fechado && reais.length > 2) {
            var a = reais[reais.length - 1], b = reais[0];
            saida.segmentos.push({
              x1: a.x, y1: a.y, x2: b.x, y2: b.y,
              w: gs.w, cor: gs.traco.slice(), tracejado: gs.tracejado, varredura: varredura
            });
          }
        }
        if (saida.espessuras.indexOf(gs.w) < 0) saida.espessuras.push(gs.w);
      }
      if (preenche) {
        for (var p = 0; p < vale.length; p++) {
          saida.areas.push({ pts: vale[p].pts, cor: gs.preench.slice() });
        }
      }
      limpar();
    }

    for (var i2 = 0; i2 < tk.length; i2++) {
      var t = tk[i2];
      if (t.t !== 'op') { pilha.push(t); continue; }
      var o = t.v;
      switch (o) {
        case 'q': pilhaGs.push({ w: gs.w, traco: gs.traco, preench: gs.preench, tracejado: gs.tracejado }); break;
        case 'Q': if (pilhaGs.length) gs = pilhaGs.pop(); break;
        case 'w': gs.w = num(1); break;
        case 'd':
          var arr = pilha[pilha.length - 2];
          gs.tracejado = '[' + (arr && arr.t === 'arr' ? arr.v : '') + '] ' + num(1);
          break;
        case 'RG': gs.traco = [num(3), num(2), num(1)]; break;
        case 'rg': gs.preench = [num(3), num(2), num(1)]; break;
        case 'G': gs.traco = [num(1), num(1), num(1)]; break;
        case 'g': gs.preench = [num(1), num(1), num(1)]; break;
        case 'm': abrir(num(2), num(1)); break;
        case 'l': if (atual) atual.pts.push({ x: num(2), y: num(1) }); break;
        case 'c':
          if (atual) {
            /* O meio do Bezier tambem entra, marcado como amostra. Sem ele um
             * arco de menos de 90 graus chega aqui com DOIS pontos, tres e o
             * minimo para ajustar circunferencia, e todo arco de angulo agudo (a
             * maioria da folha) passava por reta em silencio: o ajuste devolvia
             * null e a trava do valor sem arco acusava a figura inteira. O ponto
             * medio de um Bezier que aproxima arco de ate 90 graus fica sobre a
             * circunferencia com erro de milesimo de ponto. */
            var p0 = atual.pts[atual.pts.length - 1];
            var c1x = num(6), c1y = num(5), c2x = num(4), c2y = num(3);
            var p3x = num(2), p3y = num(1);
            atual.pts.push({
              x: (p0.x + 3 * c1x + 3 * c2x + p3x) / 8,
              y: (p0.y + 3 * c1y + 3 * c2y + p3y) / 8,
              amostra: true
            });
            atual.pts.push({ x: p3x, y: p3y });
            atual.curvo = true;
          }
          break;
        case 'v': case 'y':
          if (atual) { atual.pts.push({ x: num(2), y: num(1) }); atual.curvo = true; }
          break;
        case 'h': if (atual) atual.fechado = true; break;
        case 're':
          abrir(num(4), num(3));
          atual.pts.push({ x: num(4) + num(2), y: num(3) });
          atual.pts.push({ x: num(4) + num(2), y: num(3) + num(1) });
          atual.pts.push({ x: num(4), y: num(3) + num(1) });
          atual.fechado = true;
          break;
        case 'W': case 'W*': recorte = true; break;
        case 'n': pintar(false, false); break;
        case 'S': pintar(true, false); break;
        case 's': if (atual) atual.fechado = true; pintar(true, false); break;
        case 'f': case 'F': case 'f*': pintar(false, true); break;
        case 'B': case 'B*': pintar(true, true); break;
        case 'b': case 'b*': if (atual) atual.fechado = true; pintar(true, true); break;
        case 'BT': bt = { x: 0, y: 0, tam: 10, bold: false, cor: gs.preench.slice(), txt: '' }; break;
        case 'Tf':
          if (bt) {
            var nm = pilha[pilha.length - 2];
            bt.tam = num(1);
            bt.bold = !!(nm && nm.t === 'nome' && nm.v === 'F2');
            bt.simbolo = !!(nm && nm.t === 'nome' && nm.v === 'F3');
          }
          break;
        case 'Td': case 'TD': if (bt) { bt.x = num(2); bt.y = num(1); } break;
        case 'Tm': if (bt) { bt.x = num(2); bt.y = num(1); } break;
        case 'Tj':
          if (bt) {
            var lit = pilha[pilha.length - 1];
            if (lit && lit.t === 'str') {
              /* O bt.simbolo vale para ESTE Tj: o Tf vem antes de cada trecho,
               * entao "π · r" traduz so o pedaco que saiu na /F3. */
              var cru = textoDoLiteral(lit.v);
              bt.txt += bt.simbolo ? deSimbolo(cru) : cru;
              bt.cor = gs.preench.slice();
            }
          }
          break;
        case 'ET':
          if (bt && bt.txt) {
            /* O Td ancora a LINHA DE BASE e a borda ESQUERDA, sempre: o align do
             * doc.texto ja virou coordenada antes de chegar ao fluxo. O centro
             * optico e o que interessa para medir distancia ate um arco, e ele
             * sai da largura medida pela mesma tabela de larguras que escreveu o
             * texto. Medir do canto esquerdo dava meia caixa de erro, e meia
             * caixa de "115" e quase dez pontos. */
            var larg = 0;
            var gg = gerador();
            if (gg && gg.medir) { try { larg = gg.medir(bt.txt, bt.tam, bt.bold); } catch (eL) { larg = 0; } }
            saida.textos.push({
              txt: bt.txt, x: bt.x, y: bt.y, tam: bt.tam, bold: bt.bold, cor: bt.cor,
              largura: larg, cx: bt.x + larg / 2, cy: bt.y + bt.tam * 0.35
            });
          }
          bt = null;
          break;
        default: break;
      }
      if (o !== 'Tf' && o !== 'Tj') pilha = [];
      else pilha = [];
    }
    return saida;
  }

  /* ============================================================ conferirFigura
   *
   *   conferirFigura(registro, {maxMarcas, minCorpo, minEspessura, minContraste, ...})
   *
   * Devolve a lista de falhas. Lista vazia e figura aprovada. Quem chama de
   * dentro do figura() empurra cada falha para registro.avisos, e a partir dai o
   * tema e reprovado na geracao, do mesmo jeito que ja acontece com receita
   * inexistente e chave nao declarada. Aviso que so aparece no console vira
   * ruido e todo mundo aprende a ignorar, entao aqui nada e so aviso.
   *
   * As travas nasceram uma a uma dos trinta defeitos serios e fatais que os tres
   * leitores acharam no piloto MAT07-12. Cada uma tem o numero medido do defeito
   * que a motivou escrito ao lado, para quem for mexer no limiar saber o que
   * volta a passar. */

  var TRAVAS = {
    maxMarcas: MAX_MARCAS,
    minCorpo: 7.5,
    minEspessura: 0.6,
    minContraste: 3,
    /* 2,5 pt entre tracinhos, medido no painel que ENSINA a notacao: tres tracos
     * de 0,32 mm com vao de 0,56 mm, que a fotocopia de segunda geracao fecha. */
    folgaTracinho: 3.4,
    /* 3,53 pt entre os apices das duas setas de paralelismo, com 4,87 pt de
     * profundidade cada: elas se cruzam em 1,4 pt e viram borrao. */
    folgaSeta: 7.0,
    /* Dois arcos de angulos DIFERENTES no mesmo vertice, extremidades a 2,5 pt. */
    folgaEntreArcos: 6.0,
    /* Arcos concentricos do MESMO angulo (a notacao de congruencia). */
    folgaEntreVoltas: 3.0,
    /* Ate onde um valor de angulo ainda pertence ao arco ao lado dele. Soma-se
     * meia largura do proprio rotulo, porque o valor sai a uma folga fixa da
     * borda do arco medida ate o CENTRO da caixa: um "3x+10" fica naturalmente
     * mais longe do arco do que um "40°". Medido no piloto: rotulo no lugar fica
     * de 15,0 a 19,0 pt do arco dele; rotulo solto ou empurrado para o lado
     * errado fica de 25,2 a 208,7. */
    alcanceDoArco: 12,
    /* Fidelidade do arco ao numero escrito, em graus. */
    toleranciaAngulo: 3,
    /* Ordem invertida so acusa acima disto, para nao brigar com arredondamento. */
    ordemMinima: 4
  };

  var RE_LETRA = /[A-Za-zÀ-ɏ]/;
  var RE_PALAVRA = /[A-Za-zÀ-ɏ]{3,}/g;
  /* Abreviacao matematica e unidade sao neutras nas duas linguas e podem nascer
   * no desenhador. Palavra, nao. */
  var NEUTROS = {
    sen: 1, sin: 1, cos: 1, tan: 1, tg: 1, cot: 1, log: 1, ln: 1, exp: 1,
    max: 1, min: 1, mmc: 1, mdc: 1, cm: 1, mm: 1, dm: 1, km: 1, kg: 1, ml: 1
  };

  function semAcento(s) {
    return String(s)
      .replace(/[à-åÀ-Å]/g, 'a').replace(/[è-ëÈ-Ë]/g, 'e')
      .replace(/[ì-ïÌ-Ï]/g, 'i').replace(/[ò-öÒ-Ö]/g, 'o')
      .replace(/[ù-üÙ-Ü]/g, 'u').replace(/[çÇ]/g, 'c')
      .replace(/[ñÑ]/g, 'n').toLowerCase();
  }

  /* Expressao linear numa incognita: x, 2x, 3x+10, x-5, 10+2x. Devolve
   * {a, b, incognita} ou null. Serve a trava da ORDEM: com duas expressoes na
   * mesma incognita e os dois arcos desenhados, o sistema fecha e da para saber
   * qual dos dois angulos e o maior de verdade. */
  function expressaoLinear(txt) {
    /* A incognita e sempre MINUSCULA, e essa e a linha que separa "x" de "A". A
     * maiuscula sozinha e nome de vertice, e nome de vertice nao e valor de
     * angulo: tratando as duas igual, a trava do valor sem arco acusava as
     * letras A, B e C de todo triangulo da folha e virava ruido em um dia. */
    var s = String(txt).replace(/\s/g, '');
    if (!s || /°/.test(s)) return null;
    /* Letra SOZINHA so e angulo no alfabeto de angulo (x e as gregas). O
     * circulo e as conicas escrevem r, d, a, b, c, p e h como comprimento e
     * parametro, e a regra antiga (qualquer minuscula) acusava as oito de
     * "valor de angulo solto sem arco": um eixo chamado x reprovava o tema.
     * Expressao com digito (3x+10) continua valendo com qualquer letra. */
    if (/^[a-zαβθ]$/.test(s) && !/^[xαβθ]$/.test(s)) return null;
    if (!/^[-+]?[\d.]*[a-zαβθ](?:[-+][\d.]+)?$|^[-+]?[\d.]+[-+][\d.]*[a-zαβθ]$/.test(s)) return null;
    var a = 0, b = 0, inc = null, ok = true;
    var termos = s.replace(/([-+])/g, ' $1').trim().split(/\s+/);
    for (var i = 0; i < termos.length; i++) {
      var t = termos[i];
      var m = /^([-+]?)([\d.]*)([a-zαβθ])$/.exec(t);
      if (m) {
        var sinal = m[1] === '-' ? -1 : 1;
        var coef = m[2] === '' ? 1 : parseFloat(m[2]);
        if (inc && inc !== m[3]) { ok = false; break; }
        inc = m[3]; a += sinal * coef; continue;
      }
      var m2 = /^([-+]?)([\d.]+)$/.exec(t);
      if (m2) { b += (m2[1] === '-' ? -1 : 1) * parseFloat(m2[2]); continue; }
      ok = false; break;
    }
    if (!ok || !inc) return null;
    return { a: a, b: b, incognita: inc };
  }

  function valorDeAngulo(txt) {
    var s = String(txt);
    if (/°/.test(s)) {
      var m = /(-?\d+(?:\.\d+)?)/.exec(s);
      return m ? { numero: parseFloat(m[1]) } : null;
    }
    var e = expressaoLinear(s);
    return e ? { expressao: e } : null;
  }

  function meio2(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
  function dist2(a, b) { return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)); }
  /* Distancia de um ponto ao SEGMENTO, e nao a reta que o contem: uma bissetriz
   * e a reta dela passam pelos mesmos lugares, mas a reta continua fora da
   * figura e daria cruzamento onde nao ha traco nenhum. */
  function distDoSegmento(p, seg) {
    var vx = seg.x2 - seg.x1, vy = seg.y2 - seg.y1;
    var den = vx * vx + vy * vy;
    if (den < 1e-9) return dist2(p, { x: seg.x1, y: seg.y1 });
    var t = ((p.x - seg.x1) * vx + (p.y - seg.y1) * vy) / den;
    t = Math.max(0, Math.min(1, t));
    return dist2(p, { x: seg.x1 + t * vx, y: seg.y1 + t * vy });
  }

  /* Distancia de um ponto ao ARCO, analitica: pelo centro, raio, inicio e
   * varrido. A versao anterior media ate as ancoras de Bezier registradas, e
   * nao ate o arco: onde a ancora caia decidia o veredito (um arco comecando
   * a 85 graus, com a ancora da circunferencia a 90, media 3,21 pt e
   * reprovava; o mesmo arco comecando a 80 media 6,42 e passava). */
  function pontoDoArco(arco, grausAbs) {
    var t = grausAbs * Math.PI / 180;
    return { x: arco.cx + arco.raio * Math.cos(t), y: arco.cy + arco.raio * Math.sin(t) };
  }
  function distAoArco(arco, p) {
    var dx = p.x - arco.cx, dy = p.y - arco.cy;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (arco.abertura >= 359.9) return Math.abs(d - arco.raio);
    var ang = Math.atan2(dy, dx) * 180 / Math.PI;
    var s = arco.varre >= 0 ? 1 : -1;
    var rel = (((ang - arco.de) * s) % 360 + 360) % 360;   // 0..360 no sentido do varrido
    if (rel <= arco.abertura) return Math.abs(d - arco.raio);
    var e1 = pontoDoArco(arco, arco.de), e2 = pontoDoArco(arco, arco.de + arco.varre);
    return Math.min(dist2(e1, p), dist2(e2, p));
  }
  /* Amostra o arco de 6 em 6 graus (o passo que o desenhador usa para o
   * halo), para a trava de arcos vizinhos medir o arco e nao a ancora. */
  function amostraArco(arco, passo) {
    var out = [], n = Math.max(2, Math.ceil(arco.abertura / (passo || 6)));
    for (var i = 0; i <= n; i++) out.push(pontoDoArco(arco, arco.de + arco.varre * i / n));
    return out;
  }

  /* As marcas de lado reconstruidas a partir do que foi impresso, sem depender de
   * a receita ter anotado nada. Um tracinho de congruencia e um segmento curto no
   * peso de marca; uma ponta de seta de paralelismo sao dois segmentos curtos
   * saindo do mesmo bico, com 70 graus entre eles (2 vezes os 35 do desenhador).
   * O quadradinho de angulo reto tambem sao dois segmentos saindo do mesmo canto,
   * e por isso a abertura entra na conta: 90 graus e quadradinho e nao seta, e
   * confundir os dois faria a trava acusar todo angulo reto da folha. */
  function agruparMarcasDoFluxo(segmentos) {
    var cand = [];
    for (var i = 0; i < segmentos.length; i++) {
      var s = segmentos[i];
      if (s.varredura || s.tracejado.indexOf('[]') !== 0) continue;
      if (s.w < 0.7 || s.w > 1.05) continue;
      var L = dist2({ x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 });
      if (L < 3 || L > 13) continue;
      cand.push({ a: { x: s.x1, y: s.y1 }, b: { x: s.x2, y: s.y2 }, L: L, usado: false });
    }
    var setas = [], tracinhos = [];
    for (var j = 0; j < cand.length; j++) {
      for (var k = j + 1; k < cand.length; k++) {
        if (cand[j].usado || cand[k].usado) continue;
        var bico = compartilham(cand[j], cand[k]);
        if (!bico) continue;
        var u1 = versorEntre(bico.p, bico.q1), u2 = versorEntre(bico.p, bico.q2);
        var ab = graus(Math.acos(Math.max(-1, Math.min(1, u1.x * u2.x + u1.y * u2.y))));
        if (ab < 55 || ab > 82) continue;      // 90 graus e o quadradinho, nao a seta
        cand[j].usado = cand[k].usado = true;
        var ex = { x: u1.x + u2.x, y: u1.y + u2.y };
        var n = Math.sqrt(ex.x * ex.x + ex.y * ex.y) || 1;
        setas.push({ p: bico.p, eixo: { x: ex.x / n, y: ex.y / n } });
      }
    }
    for (var m = 0; m < cand.length; m++) {
      if (cand[m].usado) continue;
      tracinhos.push({
        p: meio2(cand[m].a, cand[m].b),
        dir: versorEntre(cand[m].a, cand[m].b)
      });
    }
    return juntar(setas, 'seta', 20, function (A, B) {
      return A.eixo.x * B.eixo.x + A.eixo.y * B.eixo.y > 0.98;
    }).concat(juntar(tracinhos, 'traco', 20, function (A, B) {
      if (Math.abs(A.dir.x * B.dir.x + A.dir.y * B.dir.y) < 0.985) return false;
      var v = versorEntre(A.p, B.p);
      return Math.abs(v.x * A.dir.x + v.y * A.dir.y) < 0.35;   // enfileirados, nao empilhados
    }));
  }

  function compartilham(s1, s2) {
    var pares = [['a', 'b', 'a', 'b'], ['a', 'b', 'b', 'a'], ['b', 'a', 'a', 'b'], ['b', 'a', 'b', 'a']];
    for (var i = 0; i < pares.length; i++) {
      var p = pares[i];
      if (dist2(s1[p[0]], s2[p[2]]) < 0.06) {
        return { p: s1[p[0]], q1: s1[p[1]], q2: s2[p[3]] };
      }
    }
    return null;
  }
  function versorEntre(A, B) {
    var dx = B.x - A.x, dy = B.y - A.y, n = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: dx / n, y: dy / n };
  }
  function juntar(itens, tipo, alcance, mesmo) {
    var saida = [], visto = [];
    for (var i = 0; i < itens.length; i++) {
      if (visto[i]) continue;
      var grupo = [itens[i]];
      visto[i] = 1;
      for (var j = i + 1; j < itens.length; j++) {
        if (visto[j]) continue;
        var perto = false;
        for (var k = 0; k < grupo.length; k++) {
          if (dist2(grupo[k].p, itens[j].p) <= alcance && mesmo(grupo[k], itens[j])) { perto = true; break; }
        }
        if (perto) { grupo.push(itens[j]); visto[j] = 1; }
      }
      if (grupo.length < 2) continue;
      var menor = Infinity;
      for (var a = 0; a < grupo.length; a++) {
        for (var b = a + 1; b < grupo.length; b++) menor = Math.min(menor, dist2(grupo[a].p, grupo[b].p));
      }
      saida.push({ tipo: tipo, n: grupo.length, menor: menor });
    }
    return saida;
  }

  function conferirFigura(registro, opcoes) {
    var op = {}, k;
    for (k in TRAVAS) op[k] = TRAVAS[k];
    for (k in (opcoes || {})) if (opcoes[k] != null) op[k] = opcoes[k];

    var falhas = [];
    function falhar(s) { falhas.push(s); }
    var med = registro.medido || { arcos: [], segmentos: [], textos: [], areas: [], espessuras: [] };
    var gabarito = registro.fase === 'gabarito';
    var n2 = function (v) { return (Math.round(v * 100) / 100).toFixed(2); };

    /* --------------------------------------------- teto de marcas ativas */
    if (registro.marcasAtivas > op.maxMarcas) {
      falhar('marcas ativas: ' + registro.marcasAtivas + ', o teto e ' + op.maxMarcas);
    }

    /* --------------------------------------------- (e) texto nascido no desenho
     *
     * A comparacao e com o TEMA e nao com um dicionario de portugues: o que
     * importa nao e a lingua da palavra, e de onde ela veio. Uma frase inglesa
     * inventada dentro do desenhador quebra a folha portuguesa exatamente do
     * mesmo jeito. */
    var doTema = semAcento(registro.diretiva || '');
    for (var i = 0; i < med.textos.length; i++) {
      var txt = med.textos[i].txt;
      /* O piso de corpo vale para TODO texto, e o teste vem antes do de palavra:
       * escondido depois do "continue" que pula texto sem letra, ele nunca via
       * um numero, e numero e justamente o que a figura mais escreve. */
      if (med.textos[i].tam < op.minCorpo - 1e-6) {
        falhar('texto "' + txt + '" saiu em ' + n2(med.textos[i].tam) +
          ' pt, abaixo do corpo minimo de ' + op.minCorpo + ' pt');
      }
      if (!RE_LETRA.test(txt)) continue;
      var palavras = txt.match(RE_PALAVRA);
      if (!palavras) continue;
      for (var p = 0; p < palavras.length; p++) {
        var pal = semAcento(palavras[p]);
        if (NEUTROS[pal]) continue;
        if (doTema.indexOf(pal) >= 0) continue;
        falhar('texto "' + txt + '" saiu impresso dentro da figura e nao veio do tema: ' +
          'palavra dentro do desenhador quebra a outra lingua em silencio, ' +
          'ela tem que entrar por parametro da diretiva');
        break;
      }
    }

    /* --------------------------------------------- piso de espessura e de tinta */
    var vistas = {};
    for (var s2 = 0; s2 < med.segmentos.length; s2++) {
      var seg = med.segmentos[s2];
      if (dist2({ x: seg.x1, y: seg.y1 }, { x: seg.x2, y: seg.y2 }) < 0.05) continue;
      if (!seg.varredura) {
        if (seg.w < op.minEspessura - 1e-6) {
          if (!vistas['w' + seg.w]) {
            vistas['w' + seg.w] = 1;
            falhar('traco em ' + n2(seg.w) + ' w, abaixo do piso de ' +
              op.minEspessura + ' pt (so hachura e malha, que saem em varredura, podem descer daqui)');
          }
        }
        var ct = contrasteNoBranco(seg.cor);
        if (ct < op.minContraste) {
          var nome = nomeDaCor(seg.cor);
          if (!vistas['c' + (nome || seg.cor.join(','))]) {
            vistas['c' + (nome || seg.cor.join(','))] = 1;
            falhar('traco em ' + (nome || seg.cor.join(' ')) + ' da ' + ct.toFixed(2) +
              ' de contraste contra o branco, abaixo dos ' + op.minContraste +
              ':1 que a WCAG pede de objeto grafico que carrega significado');
          }
        }
      }
      /* --------------------------------------- (b) codigo do gabarito no enunciado */
      if (!gabarito) {
        var tealAqui = nomeDaCor(seg.cor) === 'teal';
        var auxAqui = seg.tracejado.indexOf('[3 2]') === 0;
        if (tealAqui || auxAqui) {
          var chave = 'g' + tealAqui + auxAqui;
          if (!vistas[chave]) {
            vistas[chave] = 1;
            falhar('linha em ' + (tealAqui ? 'teal' : 'tinta de contorno') +
              (auxAqui ? ' tracejada ' + seg.tracejado : ' continua') + ' e ' + n2(seg.w) +
              ' w numa figura de enunciado: teal e o tracejado [3 2] sao o codigo ' +
              'reservado a camada de gabarito, e o objeto do exercicio vestido de ' +
              'resposta some na fotocopia. Contorno ou ceviana do enunciado sai ' +
              'continua, 0,90 w, na tinta do contorno');
          }
        }
      }
    }

    /* --------------------------------------------- (c) marcas perto demais
     *
     * Medido nas coordenadas que foram DESENHADAS, e nao na folga que a receita
     * pediu: o que sobrevive a fotocopia e a distancia na folha. */
    for (var m = 0; m < registro.marcas.length; m++) {
      var mk = registro.marcas[m];
      if (!mk || !mk.marcas || mk.marcas.length < 2) continue;
      var ehSeta = mk.tipo === 'ladoSeta';
      var piso = ehSeta ? op.folgaSeta : op.folgaTracinho;
      var centros = [];
      for (var c2 = 0; c2 < mk.marcas.length; c2++) {
        var g3 = mk.marcas[c2];
        centros.push(ehSeta ? normalizar(g3[1]) : meio2(normalizar(g3[0]), normalizar(g3[1])));
      }
      var menor = Infinity;
      for (var a2 = 1; a2 < centros.length; a2++) menor = Math.min(menor, dist2(centros[a2 - 1], centros[a2]));
      if (menor < piso - 1e-6) {
        falhar((ehSeta ? 'as pontas de seta de paralelismo' : 'os tracinhos de congruencia') +
          ' saem a ' + n2(menor) + ' pt uma da outra, abaixo do piso de ' + piso +
          ' pt: nessa distancia a fotocopia funde as marcas e a CONTAGEM, que e o ' +
          'unico canal de congruencia nesta fonte, deixa de ser contavel');
      }
    }

    /* A mesma medida, agora no FLUXO. As duas existem porque a receita so anota a
     * marca quando passa o ctx adiante, e a do piloto nao passa: o registro fica
     * com um resumo ("paralelismo, 2 pares") e a geometria some. O fluxo nao tem
     * como sumir, e a distancia que sobrevive a fotocopia e a da folha. */
    var grupos = agruparMarcasDoFluxo(med.segmentos);
    for (var gm = 0; gm < grupos.length; gm++) {
      var gr = grupos[gm];
      var pisoG = gr.tipo === 'seta' ? op.folgaSeta : op.folgaTracinho;
      if (gr.menor < pisoG - 1e-6) {
        falhar((gr.tipo === 'seta' ? 'as pontas de seta de paralelismo' : 'os tracinhos de congruencia') +
          ' saem a ' + n2(gr.menor) + ' pt uma da outra (medido no fluxo, ' + gr.n +
          ' marcas no grupo), abaixo do piso de ' + pisoG + ' pt: nessa distancia a ' +
          'fotocopia funde as marcas e a CONTAGEM, unico canal de congruencia nesta ' +
          'fonte, deixa de ser contavel');
      }
    }

    /* --------------------------------------------- (c) arcos perto demais */
    for (var x1 = 0; x1 < med.arcos.length; x1++) {
      for (var x2 = x1 + 1; x2 < med.arcos.length; x2++) {
        var A1 = med.arcos[x1], A2 = med.arcos[x2];
        if (dist2({ x: A1.cx, y: A1.cy }, { x: A2.cx, y: A2.cy }) > 2) continue;
        /* Mesmo centro E mesmo raio e o arco destacado SOBRE a circunferencia (a
         * convencao da especificacao para setor, arco e angulo central), e nao
         * dois angulos disputando um vertice: a distancia entre eles e zero por
         * construcao e nao diz nada.
         *
         * O pulo e por OU EXCLUSIVO, e nao por OU: a convencao e um arco INTEIRO
         * mais um arco PARCIAL. Escrito com OU, o par de duas circunferencias
         * INTEIRAS de raio quase igual tambem entrava no pulo e a distancia entre
         * concentricas deixava de ser medida. O caso medido, pelo caminho de
         * verdade: @fig circulo raio=10 coroa=9.93 sai com as duas circunferencias
         * em raio 54,39 e 54,01, ou seja a 0,38 pt uma da outra; elas imprimem
         * como uma linha unica um pouco mais grossa, a hachura da coroa some entre
         * elas e o exercicio pede a area de um anel que nao existe no papel. A
         * receita nao tem outra defesa: o coroa so exige 0 < coroaR < raio e o
         * aneis nao tem trava de espacamento nenhuma. */
        if (Math.abs(A1.raio - A2.raio) < 0.5 &&
            (A1.abertura >= 359.9) !== (A2.abertura >= 359.9)) continue;
        /* Dois arcos PARCIAIS de mesmo raio no mesmo vertice continuam medidos: e
         * exatamente o caso de emendarem num semicirculo, que a trava existe para
         * pegar. Uma primeira versao pulava qualquer par de mesmo raio e a prova
         * _base_prova_travas acusou. */
        /* Mesmo vertice. Dois arcos que varrem a MESMA abertura sao as voltas da
         * notacao de congruencia; varrendo aberturas diferentes, sao angulos
         * diferentes, e ai eles precisam de folga de verdade para nao se
         * emendarem num semicirculo unico na fotocopia. */
        /* A segunda metade compara os angulos de INICIO. A expressao mapeia a
         * diferenca para o intervalo de -180 a 180, entao duas voltas
         * concentricas, que comecam no mesmo lugar, dao 0.
         *
         * Estava escrito "> 178", ou seja, exigia que os dois arcos comecassem
         * em lados OPOSTOS para serem considerados o mesmo angulo, que e o
         * contrario do que o comentario acima diz. Efeito medido: com
         * voltas=2 os arcos saem em raio 20,00 e 23,52, o vao e de 3,50 pt, o
         * piso certo (folgaEntreVoltas) e 3,0 e o vao caia no piso de angulos
         * diferentes, 6,0. A conferencia reprovava com "dois arcos no mesmo
         * vertice a 3.50 pt um do outro (52.00 e 51.96 graus), abaixo do piso
         * de 6 pt". Ou seja, a notacao de congruencia por CONTAGEM de arcos,
         * que o cabecalho do marcas.js chama de unico canal disponivel nesta
         * fonte (cor nao serve: navy contra teal da 2,33 de contraste), nao
         * podia ser usada.
         *
         * A tolerancia de 2 graus na abertura fica: as duas voltas saem com
         * 52,00 e 51,96 graus, porque o raio maior amostra a curva em outros
         * pontos. */
        var mesmoAngulo = Math.abs(A1.abertura - A2.abertura) < 2 &&
          Math.abs(((A1.de - A2.de) % 360 + 540) % 360 - 180) < 2;
        var pisoArco = mesmoAngulo ? op.folgaEntreVoltas : op.folgaEntreArcos;
        var vao = Infinity;
        var amostra = amostraArco(A1, 6);
        for (var q = 0; q < amostra.length; q++) vao = Math.min(vao, distAoArco(A2, amostra[q]));
        if (vao < pisoArco - 1e-6) {
          falhar('dois arcos no mesmo vertice a ' + n2(vao) + ' pt um do outro (' +
            n2(A1.abertura) + ' e ' + n2(A2.abertura) + ' graus), abaixo do piso de ' +
            pisoArco + ' pt: emendados eles leem como um arco so');
        }
      }
    }

    /* --------------------------------------------- (a) a incognita sem arco
     *
     * A figura marca o dado e deixa o pedido sem marca, que e o contrario do que
     * deveria: o aluno olha o desenho e nao sabe por onde comecar. */
    var comArco = [];
    var declarouIncognita = /\bincognita=/.test(doTema);
    for (var t2 = 0; t2 < med.textos.length; t2++) {
      var tx = med.textos[t2];
      var val = valorDeAngulo(tx.txt);
      if (!val) continue;
      /* Um x sozinho so e incognita de angulo se a diretiva declarou
       * incognita=. Sem isso ele e nome de eixo ou de variavel, e o eixo x
       * de toda conica reprovava o tema. */
      if (val.expressao && /^\s*[xαβθ]\s*$/.test(String(tx.txt)) && !declarouIncognita) continue;
      var ancora = { x: tx.cx != null ? tx.cx : tx.x, y: tx.cy != null ? tx.cy : tx.y };
      var melhor = null, perto = Infinity;
      for (var y2 = 0; y2 < med.arcos.length; y2++) {
        var d3 = distAoArco(med.arcos[y2], ancora);
        if (d3 < perto) { perto = d3; melhor = med.arcos[y2]; }
      }
      var alcance = op.alcanceDoArco + (tx.largura || 0) / 2;
      if (!melhor || perto > alcance) {
        falhar('o valor de angulo "' + tx.txt + '" saiu solto na figura, sem arco: ' +
          (melhor ? 'o arco mais proximo esta a ' + n2(perto) + ' pt' : 'nao ha arco nenhum') +
          '. Numero solto perto de um vertice nao diz se e o interno, o externo ou o ' +
          'do triangulo da diagonal, e a camada de resposta tem que ganhar arco igual ' +
          'a camada de enunciado');
        continue;
      }
      /* --------------------------------------- (a2) o valor GRUDADO em outro rotulo
       *
       * Nao basta o valor estar perto do arco dele: ele tem que estar mais perto
       * do arco DELE do que de qualquer outro rotulo da figura. O olho agrupa
       * por proximidade antes de agrupar por significado.
       *
       * Medido no exercicio 17 do piloto: o "70 graus", que mede o vertice A,
       * ficou a 5,0 pt do rotulo "I" e a 14 pt do proprio arco. A aluna le o
       * bloco "I / 70" e responde que o angulo em I mede 70, que e exatamente a
       * resposta errada que o exercicio existe para pegar (o certo e 125). E o
       * "I" desta fonte e uma barrinha vertical: "I" em cima de "70" tambem le
       * como "170".
       *
       * A folga de 8 pt e o corpo do rotulo (8,5 pt) menos um pouco: abaixo
       * disso as duas caixas ficam a menos de uma altura de linha e passam a ler
       * como um bloco so. */
      /* O que conta e o VAO ENTRE AS CAIXAS, e nao a distancia entre os centros.
       * Medido no exercicio 17: vao de 7,8 pt e centro a centro de 14,1 pt. Uma
       * trava que olhasse o centro nao acusaria, e o defeito esta no vao: 7,8 pt
       * e menos que a altura de uma linha de 8,5 pt. */
      /* A caixa tem que ser a que a folha IMPRIME, e não a do glifo.
       *
       * A primeira versão desta trava usava altura de 0,717 do corpo, que é a
       * altura da letra. O que sai no papel é o halo, com 1,16 do corpo de
       * altura e uma folga lateral de cada lado. Medido no exercício 17: a trava
       * lia 7,77 pt de vão onde o papel tinha 4,93. Ela SUBESTIMAVA o defeito em
       * cerca de 3 pt no eixo vertical, então um par a 8,6 pt na conta dela podia
       * estar a 5,5 pt na folha e ela ficava calada.
       *
       * A medida vem do desenho.js, que é quem desenha o halo, em vez de ser
       * copiada para cá: duas cópias da mesma constante divergem no dia em que
       * alguém mexe numa só. Sem o módulo, cai para a fração do halo com o
       * porquê escrito, e não para a altura da letra. */
      function caixaImpressa(t) {
        var tam = t.tam || 8.5;
        var d = moduloDesenho && moduloDesenho();
        if (d && d.caixaDoRotulo) {
          try {
            var c = d.caixaDoRotulo(t.txt, { tam: tam, bold: t.bold });
            return { l: c.largura, h: c.altura };
          } catch (e) { /* cai no ramo de baixo */ }
        }
        return { l: (t.largura || 0) + 3, h: 1.16 * tam };
      }
      function vaoEntreCaixas(a, b) {
        var ca = caixaImpressa(a), cb = caixaImpressa(b);
        /* O x,y registrado é o canto do glifo; o halo é simétrico em volta dele,
         * então a caixa impressa sobra para os dois lados. */
        var ax = a.x - (ca.l - (a.largura || 0)) / 2, ay = a.y - (ca.h - (a.tam || 8.5) * 0.717) / 2;
        var bx = b.x - (cb.l - (b.largura || 0)) / 2, by = b.y - (cb.h - (b.tam || 8.5) * 0.717) / 2;
        var gx = Math.max(0, Math.max(ax, bx) - Math.min(ax + ca.l, bx + cb.l));
        var gy = Math.max(0, Math.max(ay, by) - Math.min(ay + ca.h, by + cb.h));
        return Math.sqrt(gx * gx + gy * gy);
      }
      var pertoDeOutro = null, dOutro = Infinity;
      for (var t3 = 0; t3 < med.textos.length; t3++) {
        if (t3 === t2) continue;
        var dd = vaoEntreCaixas(tx, med.textos[t3]);
        if (dd < dOutro) { dOutro = dd; pertoDeOutro = med.textos[t3]; }
      }
      /* O piso e o corpo do proprio rotulo: abaixo de uma altura de linha as
       * duas caixas leem como um bloco so. */
      if (pertoDeOutro && dOutro < (tx.tam || 8.5) && dOutro < perto) {
        falhar('o valor de angulo "' + tx.txt + '" esta a ' + n2(dOutro) +
          ' pt do rotulo "' + pertoDeOutro.txt + '" e a ' + n2(perto) +
          ' pt do arco que ele mede: o olho agrupa os dois num bloco so e o valor ' +
          'passa a ler como se fosse daquele outro rotulo');
      }

      comArco.push({ texto: tx.txt, val: val, arco: melhor });
    }

    /* Cruzamento NOMEADO e sempre angulo pedido: batizar o ponto onde duas
     * construcoes se encontram e o unico motivo de ele existir no desenho, e a
     * pergunta que vem depois e sempre sobre um dos angulos que nascem ali.
     * Quatro angulos nascem num cruzamento e, sem arco, nada na figura diz qual
     * deles a pergunta quer: o aluno olha e nao sabe por onde comecar. Esta e a
     * unica trava do grupo que enxerga a incognita que NAO foi escrita, e por
     * isso ela olha o cruzamento e nao o rotulo. */
    var cruzamentos = [];
    for (var e2 = 0; e2 < registro.marcas.length; e2++) {
      var enc = registro.marcas[e2];
      if (enc && enc.tipo === 'encontro') cruzamentos.push({ x: enc.x, y: enc.y });
    }
    for (var e3 = 0; e3 < registro.pontos.length; e3++) {
      var pn = registro.pontos[e3];
      if (!pn || !pn.rotulo || pn.x == null) continue;
      /* Cruzar e ter tinta dos DOIS lados do ponto, em duas direcoes distintas.
       * Quem decide e a geometria da folha, e nao o jeito de emitir o traco.
       *
       * A versao anterior contava traco que PASSA pelo ponto, exigindo que ele
       * nao terminasse ali. Isso lia a emissao e nao o desenho: o D.poligono
       * anota um traco por aresta, entao a mesma reta desenhada como polilinha
       * com o ponto nomeado no meio (A ate I ate C) vira dois tracos que
       * TERMINAM em I, e o mesmo X no papel recebia dois vereditos opostos.
       * Medido: o X emitido como dois segmentos era acusado, o X emitido como
       * duas polilinhas ficava calado.
       *
       * Agora cada traco vizinho declara de que LADO do ponto ele tem tinta,
       * pela direcao do proprio segmento (que nao depende de onde o ponto caiu),
       * os lados se somam por eixo e so conta como reta o eixo servido dos dois
       * lados. Com isso o raio focal continua liberado: F1 ate P e F2 ate P dao
       * um lado cada, em eixos diferentes, e nenhuma reta atravessa P. */
      var eixos = [];
      for (var e4 = 0; e4 < registro.tracos.length; e4++) {
        var tr = registro.tracos[e4];
        if (!tr || tr.x1 == null) continue;
        if (String(tr.papel || '').indexOf('contorno') === 0) continue;
        if (distDoSegmento(pn, tr) >= 1.2) continue;
        var pA = { x: tr.x1, y: tr.y1 }, pB = { x: tr.x2, y: tr.y2 };
        var dir = versorEntre(pA, pB);
        if (!isFinite(dir.x) || (dir.x === 0 && dir.y === 0)) continue;
        /* Ponta a menos de 2 pt do ponto nao e tinta de um lado: e o traco
         * terminando ali, que era a distincao certa da versao anterior e que
         * continua valendo aqui, agora por lado e nao por traco inteiro. */
        var lados = 0;
        if (dist2(pn, pA) > 2) lados |= ((pA.x - pn.x) * dir.x + (pA.y - pn.y) * dir.y) > 0 ? 1 : 2;
        if (dist2(pn, pB) > 2) lados |= ((pB.x - pn.x) * dir.x + (pB.y - pn.y) * dir.y) > 0 ? 1 : 2;
        if (!lados) continue;
        var caiu = false;
        for (var e6 = 0; e6 < eixos.length; e6++) {
          var pr = dir.x * eixos[e6].u.x + dir.y * eixos[e6].u.y;
          if (Math.abs(pr) < 0.99) continue;    // ate 8 graus e o mesmo eixo
          /* Eixo guardado ao contrario: os lados trocam de nome junto. */
          eixos[e6].lados |= (pr > 0 ? lados : ((lados & 1) ? 2 : 0) | ((lados & 2) ? 1 : 0));
          caiu = true; break;
        }
        if (!caiu) eixos.push({ u: dir, lados: lados });
      }
      var retas = 0;
      for (var e7 = 0; e7 < eixos.length; e7++) if (eixos[e7].lados === 3) retas++;
      if (retas >= 2) cruzamentos.push({ x: pn.x, y: pn.y });
    }
    for (var e5 = 0; e5 < cruzamentos.length; e5++) {
      var achou = false;
      for (var z = 0; z < med.arcos.length; z++) {
        if (dist2({ x: med.arcos[z].cx, y: med.arcos[z].cy }, cruzamentos[e5]) < 3) { achou = true; break; }
      }
      if (!achou) {
        falhar('o cruzamento nomeado das construcoes nao tem arco nenhum: quatro ' +
          'angulos nascem naquele ponto e a figura nao aponta qual deles a pergunta ' +
          'pede. A figura esta marcando o dado e deixando a incognita sem marca');
      }
    }

    /* --------------------------------------------- (d) o desenho contradiz a conta
     *
     * Fidelidade medida no proprio arco: o numero escrito ao lado de um arco e
     * uma afirmacao sobre o angulo que aquele arco varre. Figura que mente e pior
     * do que figura feia, porque o aluno que confere com transferidor conclui que
     * o material esta errado e para de usar figura em todas as questoes
     * seguintes. */
    var expr = [];
    for (var f2 = 0; f2 < comArco.length; f2++) {
      var it = comArco[f2];
      if (it.val.numero != null && !registro.foraDeEscala) {
        var erro = Math.abs(it.val.numero - it.arco.abertura);
        if (erro > op.toleranciaAngulo) {
          falhar('o arco rotulado "' + it.texto + '" varre ' + n2(it.arco.abertura) +
            ' graus na folha: a figura diz um numero e o rotulo diz outro, e o aluno ' +
            'que confere com transferidor conclui que o material esta errado');
        }
      }
      if (it.val.expressao) expr.push(it);
    }
    /* Duas ou mais expressoes na mesma incognita: o sistema fecha pela soma dos
     * proprios arcos desenhados, e ai da para saber qual angulo e o maior DE
     * VERDADE. Se a ordem do desenho for a inversa da ordem da resposta, a
     * legenda de fora de escala nao cobre: ela cobre imprecisao, nunca inversao. */
    if (expr.length >= 2) {
      var inc = expr[0].val.expressao.incognita, todosIguais = true;
      var somaA = 0, somaB = 0, somaVarre = 0;
      for (var g4 = 0; g4 < expr.length; g4++) {
        var ex = expr[g4].val.expressao;
        if (ex.incognita !== inc) { todosIguais = false; break; }
        somaA += ex.a; somaB += ex.b; somaVarre += expr[g4].arco.abertura;
      }
      if (todosIguais && Math.abs(somaA) > 1e-9) {
        var xv = (somaVarre - somaB) / somaA;
        for (var h3 = 0; h3 < expr.length; h3++) {
          for (var h4 = h3 + 1; h4 < expr.length; h4++) {
            var v1 = expr[h3].val.expressao.a * xv + expr[h3].val.expressao.b;
            var v2 = expr[h4].val.expressao.a * xv + expr[h4].val.expressao.b;
            var d1 = expr[h3].arco.abertura, d2 = expr[h4].arco.abertura;
            if ((v1 - v2) * (d1 - d2) < 0 &&
                Math.abs(v1 - v2) > op.ordemMinima && Math.abs(d1 - d2) > op.ordemMinima) {
              falhar('a figura inverte a ordem da resposta: "' + expr[h3].texto + '" vale ' +
                n2(v1) + ' e esta desenhado com ' + n2(d1) + ' graus, "' + expr[h4].texto +
                '" vale ' + n2(v2) + ' e esta desenhado com ' + n2(d2) +
                ' graus. Fora de escala cobre imprecisao, nunca inversao: quem resolver ' +
                'certo e olhar o desenho vai achar que errou');
            }
          }
        }
      }
    }

    return falhas;
  }

  /* ============================================================ a marcacao @fig
   *
   * Sintaxe: uma linha comecando por "@fig ", o nome da receita e pares
   * chave=valor separados por espaco. Uma linha, sempre, porque o itens_numerados
   * do verificar.py cola cada linha de continuacao no mesmo item com um espaco
   * (atual += ' ' + linha.strip()): dentro do exercicio a diretiva chega
   * pendurada no fim do enunciado, na mesma string. Sem crase, porque o
   * numeros_de apaga o conteudo entre crases antes de comparar PT com EN, e e
   * justamente essa comparacao que impede a folha em ingles sair com 52 onde a
   * portuguesa tem 62. Sem virgula, porque o numeros_de trata virgula como
   * separador decimal e leria 52,61 como o numero 52.61. */

  var RE_CHAVE_VALOR = /^([a-zA-Z]+)=(.*)$/;
  var RE_PROIBIDO = /[,#|{}^_]/;
  var RESERVADAS = { id: 1, fase: 1, escala: 1, legenda: 1 };

  /* Acha a proxima diretiva a partir de "de". O arroba so vale como inicio de
   * diretiva quando esta isolado: sem esta trava um endereco de e-mail escrito
   * num tema (contato@figuras.com) viraria uma figura, e as palavras seguintes
   * do enunciado sumiriam da folha engolidas como argumentos. */
  function acharDiretiva(s, de) {
    var pos = s.indexOf('@fig', de || 0);
    while (pos >= 0) {
      var antes = pos === 0 || /\s/.test(s.charAt(pos - 1));
      var depois = pos + 4 >= s.length || /\s/.test(s.charAt(pos + 4));
      if (antes && depois) return pos;
      pos = s.indexOf('@fig', pos + 4);
    }
    return -1;
  }

  /* Le uma diretiva a partir da posicao do "@fig". Devolve a diretiva e o indice
   * onde ela terminou, para o chamador saber o que ainda e texto. */
  function lerDiretivaEm(texto, inicio) {
    var d = {
      bruto: '', receita: null, args: {}, id: null, fase: 'enunciado',
      escala: null, legenda: null, avisos: []
    };
    var i = inicio + 4;   // pula o "@fig"
    var n = texto.length;
    function pularEspaco() { while (i < n && /\s/.test(texto.charAt(i))) i++; }
    function proximoToken() {
      pularEspaco();
      var j = i;
      while (j < n && !/\s/.test(texto.charAt(j))) j++;
      return { txt: texto.slice(i, j), fim: j };
    }

    pularEspaco();
    var t = proximoToken();
    if (t.txt && !/=/.test(t.txt)) {
      /* Sem receita a diretiva e a chamada da camada de gabarito
       * (@fig id=t1 fase=gabarito), que reexecuta a MESMA receita com os MESMOS
       * argumentos guardados no id. */
      if (/^[A-Za-z][A-Za-z0-9]*$/.test(t.txt)) { d.receita = t.txt.toLowerCase(); i = t.fim; }
      else { d.avisos.push('nome de receita invalido: ' + t.txt); i = t.fim; }
    }

    while (i < n) {
      var antes = i;
      var tk = proximoToken();
      if (!tk.txt) { i = tk.fim; break; }
      var m = RE_CHAVE_VALOR.exec(tk.txt);
      if (!m) { i = antes; break; }               // acabou a diretiva, o resto e texto
      var chave = m[1].toLowerCase(), valor = m[2];

      if (chave === 'legenda') {
        /* A legenda e a unica chave cujo valor tem espaco: ela e uma frase e vai
         * sempre por ultimo. Engole ate a proxima diretiva ou ate o fim. */
        var resto = texto.slice(i + m[1].length + 1);
        var prox = acharDiretiva(resto, 0);
        var frase = (prox >= 0 ? resto.slice(0, prox) : resto).trim();
        d.legenda = frase;
        i = prox >= 0 ? i + m[1].length + 1 + prox : n;
        continue;
      }

      i = tk.fim;
      if (RE_PROIBIDO.test(valor)) {
        /* Nunca devolver a diretiva quebrada para o texto: ela sairia impressa
         * no meio da folha, em silencio. Consome, registra e segue. */
        d.avisos.push('valor com caractere proibido em ' + chave + '=' + valor);
      }
      if (chave === 'id') d.id = valor;
      else if (chave === 'fase') d.fase = valor.toLowerCase() === 'gabarito' ? 'gabarito' : 'enunciado';
      else if (chave === 'escala') d.escala = valor.toLowerCase() === 'fora' ? 'fora' : 'fiel';
      else {
        if (!d.args[chave]) d.args[chave] = [];
        d.args[chave].push(valor);
      }
    }

    d.bruto = texto.slice(inicio, i).trim();
    return { diretiva: d, fim: i };
  }

  function lerDiretiva(linha) {
    var texto = String(linha == null ? '' : linha);
    var pos = acharDiretiva(texto, 0);
    if (pos < 0) return null;
    return lerDiretivaEm(texto, pos).diretiva;
  }

  function temDiretiva(texto) {
    return acharDiretiva(String(texto == null ? '' : texto), 0) >= 0;
  }

  /* Parte um enunciado nos pedacos de texto e nas diretivas de figura. E o que o
   * gerador chama antes de escrever qualquer coisa: dentro do exercicio a
   * diretiva nao e texto, e sem esta separacao ela sai impressa no meio da folha
   * porque nenhum ramo do markdown comeca por arroba. */
  function partirEnunciado(texto) {
    var s = String(texto == null ? '' : texto);
    var partes = [], i = 0;
    while (i < s.length) {
      var pos = acharDiretiva(s, i);
      if (pos < 0) { empurrarTexto(partes, s.slice(i)); break; }
      empurrarTexto(partes, s.slice(i, pos));
      var lido = lerDiretivaEm(s, pos);
      partes.push({ tipo: 'figura', diretiva: lido.diretiva });
      i = lido.fim > pos ? lido.fim : pos + 4;
    }
    return partes;
  }

  function empurrarTexto(partes, txt) {
    var t = String(txt || '').trim();
    if (t) partes.push({ tipo: 'texto', valor: t });
  }

  /* ============================================================ leitura dos args */

  function valores(args, chave) {
    var v = args && args[String(chave).toLowerCase()];
    return v ? v.slice() : [];
  }
  function primeiro(args, chave) {
    var v = valores(args, chave);
    return v.length ? v[0] : null;
  }
  /* Lista dentro de um valor: vertices=A;B;C. O separador e ponto e virgula
   * porque a virgula esta proibida na sintaxe. */
  function lista(args, chave) {
    var saida = [], v = valores(args, chave);
    for (var i = 0; i < v.length; i++) {
      var partes = String(v[i]).split(';');
      for (var j = 0; j < partes.length; j++) {
        var t = partes[j].trim();
        if (t) saida.push(t);
      }
    }
    return saida;
  }
  /* Decimal com ponto, nas duas linguas: quem imprime a folha decide a virgula.
   * Aqui um "0,4" nem chega, porque a virgula esta proibida no valor. */
  function ehNumero(v) {
    return typeof v === 'number' ? isFinite(v) : /^-?\d+(\.\d+)?$/.test(String(v).trim());
  }
  function numeros(args, chave) {
    var saida = [], v = lista(args, chave);
    for (var i = 0; i < v.length; i++) if (ehNumero(v[i])) saida.push(parseFloat(v[i]));
    return saida;
  }
  function numero(args, chave) {
    var n = numeros(args, chave);
    return n.length ? n[0] : null;
  }

  /* A escala sai automatica da propria diretiva: se algum valor metrico nao e
   * numero (3x+10, x, alfa), a figura recebe fora de escala sem o autor precisar
   * lembrar; se todos sao numeros, ela sai fiel e a aluna que conferir com
   * transferidor e recompensada. A chave escala=fora manda por cima, para o caso
   * do desenho enganoso de proposito. */
  function foraDeEscala(diretiva, chavesMetricas) {
    if (diretiva.escala === 'fora') return true;
    if (diretiva.escala === 'fiel') return false;
    for (var i = 0; i < (chavesMetricas || []).length; i++) {
      var v = lista(diretiva.args, chavesMetricas[i]);
      for (var j = 0; j < v.length; j++) if (!ehNumero(v[j])) return true;
    }
    return false;
  }

  /* ============================================================ camada de gabarito
   *
   * A resposta nao repete os dados: ela chama a mesma figura pelo id, so trocando
   * a fase. O gerador reexecuta a MESMA receita com os MESMOS argumentos, o que
   * torna impossivel o gabarito sair com outra escala ou outro enquadramento e a
   * aluna gastar a atencao reconhecendo que e a mesma figura. */
  /* Assinatura dos dados de uma diretiva, com as chaves em ordem, para dois
   * registros do MESMO id poderem ser comparados sem depender da ordem em que o
   * autor escreveu os pares. */
  function assinaturaDeArgs(d) {
    var chaves = [], k;
    for (k in (d.args || {})) if (Object.prototype.hasOwnProperty.call(d.args, k)) chaves.push(k);
    chaves.sort();
    var partes = [String(d.receita)];
    for (var i = 0; i < chaves.length; i++) {
      partes.push(chaves[i] + '=' + [].concat(d.args[chaves[i]]).join(';'));
    }
    return partes.join(' ');
  }

  /* Dois enunciados com o mesmo id sao erro de quem escreveu o tema, e o defeito
   * que sai dai e o pior da lista: o gabarito desenha a figura de OUTRO
   * exercicio, com aparencia de verdade, dizendo outra coisa. Medido: com dois
   * exercicios id=t1, a resposta "x vale 67" saia ao lado de um triangulo de 30,
   * 40 e x = 110, sem aviso nenhum, porque o ultimo registrado vencia em
   * silencio. Agora a PRIMEIRA e a que vale e a colisao grita uma vez so. */
  function guardarPorId(doc, diretiva) {
    if (!diretiva || !diretiva.id || !diretiva.receita) return;
    doc.figurasPorId = doc.figurasPorId || {};
    var ja = doc.figurasPorId[diretiva.id];
    if (ja) {
      if (ja === diretiva) return;
      if (assinaturaDeArgs(ja) === assinaturaDeArgs(diretiva)) return;
      doc.figurasIdEmConflito = doc.figurasIdEmConflito || {};
      if (!doc.figurasIdEmConflito[diretiva.id]) {
        doc.figurasIdEmConflito[diretiva.id] = true;
        avisar(doc, 'id repetido com dados diferentes: ' + diretiva.id +
          ' (vale a primeira figura, "' + assinaturaDeArgs(ja) + '")');
      }
      return;
    }
    doc.figurasPorId[diretiva.id] = diretiva;
  }

  /* A diretiva resolvida fica guardada no doc, e o figura() a le de volta. Sem
   * ela o desenho nao teria como saber o que o TEMA escreveu, e a trava do texto
   * nascido no desenhador nao existiria: o caminho da diretiva ate o desenho
   * passa pelo receitas.js, que entrega ao figura() so id, fase e legenda. A
   * ponte fica aqui e nao la porque as duas pontas, a leitura da diretiva e o
   * desenho, sao deste arquivo. */
  function lembrarDaVez(doc, d) {
    if (doc) doc.figuraDaVez = d;
    return d;
  }

  function resolverPorId(doc, diretiva) {
    if (!diretiva) return diretiva;
    if (diretiva.receita) { guardarPorId(doc, diretiva); return lembrarDaVez(doc, diretiva); }
    var guardada = diretiva.id && doc.figurasPorId ? doc.figurasPorId[diretiva.id] : null;
    if (!guardada) {
      if (diretiva.id) diretiva.avisos.push('id sem figura de origem: ' + diretiva.id);
      return diretiva;
    }
    return {
      bruto: diretiva.bruto,
      receita: guardada.receita,
      args: guardada.args,
      id: guardada.id,
      fase: diretiva.fase,
      escala: diretiva.escala || guardada.escala,
      legenda: diretiva.legenda || guardada.legenda,
      avisos: diretiva.avisos.slice()
    };
  }

  /* Varre um texto so para guardar os ids, sem desenhar nada. O gabarito pode ser
   * gerado sozinho, sem a lista: sem esta varredura previa, um
   * "@fig id=t7 fase=gabarito" ficaria sem a receita de origem. */
  function registrarIds(doc, texto) {
    var partes = partirEnunciado(texto);
    for (var i = 0; i < partes.length; i++) {
      if (partes[i].tipo === 'figura') guardarPorId(doc, partes[i].diretiva);
    }
    return partes.length;
  }

  return {
    figura: figura, comEstado: comEstado, geo: geo, medidaDoBloco: medidaDoBloco,
    padraoTracejado: padraoTracejado,
    TRACEJADO: TRACEJADO, CAMADAS: CAMADAS, MAX_MARCAS: MAX_MARCAS,
    TAM_LEGENDA: TAM_LEGENDA, FOLGA_PADRAO: FOLGA_PADRAO, ALTURA_PADRAO: ALTURA_PADRAO,
    gerador: gerador, cor3: cor3, estado: estado, avisar: avisar,
    conferirFigura: conferirFigura, lerFluxo: lerFluxo, TRAVAS: TRAVAS,
    contrasteNoBranco: contrasteNoBranco, expressaoLinear: expressaoLinear,
    lerDiretiva: lerDiretiva, partirEnunciado: partirEnunciado, temDiretiva: temDiretiva,
    valores: valores, primeiro: primeiro, lista: lista, numero: numero, numeros: numeros,
    ehNumero: ehNumero, foraDeEscala: foraDeEscala, RESERVADAS: RESERVADAS,
    guardarPorId: guardarPorId, resolverPorId: resolverPorId, registrarIds: registrarIds
  };
});
