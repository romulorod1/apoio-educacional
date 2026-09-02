/* figuras/formula.js
 * Renderizador de um subconjunto de LaTeX, para o material de matematica.
 *
 * Nao e o TeX inteiro: e o que a matematica de escola brasileira usa, do
 * fundamental ao 3o ano do medio. Fracao, raiz, expoente, indice, delimitador
 * que cresce, operador com limite, matriz, os simbolos da lista e as palavras
 * dentro da formula.
 *
 * O modelo e o do TeX e foi herdado do _proto_latex.js, que ja foi aprovado em
 * folha: toda coisa desenhavel e uma CAIXA com largura, altura acima da linha
 * de base e profundidade abaixo dela. Caixa se compoe com caixa, e e isso que
 * permite fracao dentro de raiz dentro de expoente. O que este arquivo
 * acrescenta ao prototipo e o ANALISADOR: receber a string
 * "\frac{-b \pm \sqrt{b^2-4ac}}{2a}" e montar as caixas sozinho.
 *
 * Tres promessas que valem por construcao, e nao por disciplina de quem escreve
 * o tema:
 *
 *   1. NADA de falha silenciosa. Comando desconhecido, chave que nao fecha e
 *      argumento faltando nunca saem impressos como se fossem texto normal, nem
 *      somem: viram um selo visivel na folha e uma linha no registro de avisos,
 *      do mesmo jeito que a trava de caractere do temas/_ferramentas/verificar.py
 *      faz com o que o PDF nao desenha.
 *   2. Simbolo que a fonte nao tem e DESENHADO (a seta, o pertence, a integral).
 *      Se nao houver nem fonte nem desenho, vira aviso. Nunca se emite um
 *      caractere para virar interrogacao muda na folha da aluna.
 *   3. medir() e desenhar() usam exatamente o mesmo caminho de montagem, entao a
 *      largura que quem chama usa para quebrar linha e centralizar e a largura
 *      que sai no papel.
 *
 * Roda no Node dos testes e no navegador do tablet, ES5, sem dependencia.
 *
 * Regra da casa: nunca usar travessao.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Formula = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ============================================================== o gerador
   *
   * A ligacao com o pdf.js e tardia, pelo mesmo motivo do figuras/base.js: no
   * Node a cadeia de require pode ficar circular, e resolvida no topo do arquivo
   * o module.exports do pdf.js chegaria pela metade, com COR undefined e em
   * silencio. No navegador o pdf.js entra por <script> e vira o global PDFGen,
   * que e o caminho tentado primeiro. */
  var cacheGerador = null;
  function gerador() {
    if (cacheGerador) return cacheGerador;
    if (typeof PDFGen !== 'undefined' && PDFGen && PDFGen.COR) cacheGerador = PDFGen;
    else if (typeof require === 'function') {
      try { cacheGerador = require('../pdf.js'); } catch (e) { cacheGerador = null; }
    }
    return cacheGerador;
  }

  /* Paleta e medida vem do gerador, sempre. Lista repetida em dois lugares
   * diverge no dia em que alguem mexe em um so. O fallback existe para o codigo
   * nao explodir sem o gerador, e ele mesmo vira aviso na entrada da API. */
  var CINZA = [0.101961, 0.109804, 0.121569];
  function cor(nome) {
    var g = gerador();
    return (g && g.COR && g.COR[nome]) ? g.COR[nome] : CINZA;
  }
  function medirNaFonte(txt, tam, bold) {
    var g = gerador();
    if (!g || !g.medir) return String(txt).length * tam * 0.5;
    return g.medir(txt, tam, bold);
  }
  /* Os caracteres que o PDF nao desenha. E a mesma pergunta que o verificar.py
   * faz antes de aprovar um tema, e aqui ela e feita atomo a atomo, na hora de
   * montar a caixa: e o ultimo ponto em que ainda da para trocar a interrogacao
   * muda por um aviso. */
  function naoDesenha(txt) {
    var g = gerador();
    if (!g || !g.caracteresQueNaoDesenha) return [];
    return g.caracteresQueNaoDesenha(txt);
  }

  /* O que o gerador nao ve, e que tambem nao pode chegar na folha.
   *
   *  - travessao e meia risca: o CP1252 tem os dois e a Helvetica desenha, entao
   *    a trava do pdf.js aprova. A regra da casa proibe travessao em qualquer
   *    coisa que a aluna ve, e um "\text{de 1 a 5}" com travessao no lugar do
   *    "a", colado do Word, e o caminho
   *    real por onde ele entra. Este e o ultimo ponto em que da para pegar.
   *  - codigos de controle e o NUL: o pdf.js nao os reconhece como indesenhaveis
   *    e eles iam crus para dentro da string do fluxo de conteudo.
   *  - par substituto (emoji): contado como UM codepoint, e nao como duas
   *    metades. O aviso antigo dizia "U+D83D, U+DE42", que sao metades e nao
   *    existem: quem fosse procurar no tema nao achava nada. */
  var PROIBIDO = {
    '–': 'meia risca',
    '—': 'travessao',
    '―': 'barra horizontal'
  };
  function codigoDe(cp) {
    var h = cp.toString(16).toUpperCase();
    while (h.length < 4) h = '0' + h;
    return 'U+' + h;
  }
  function foraDaFolha(txt) {
    var fora = [], visto = {}, i;
    function anota(cp) {
      var s = codigoDe(cp);
      if (!temPropria.call(visto, s)) { visto[s] = 1; fora.push(s); }
    }
    for (i = 0; i < txt.length; i++) {
      var cp = txt.charCodeAt(i);
      if (cp >= 0xD800 && cp <= 0xDBFF && i + 1 < txt.length) {
        var baixo = txt.charCodeAt(i + 1);
        if (baixo >= 0xDC00 && baixo <= 0xDFFF) {
          cp = (cp - 0xD800) * 0x400 + (baixo - 0xDC00) + 0x10000;
          i++;
        }
      }
      /* Meia metade de par substituto SOZINHA tambem entra: ela nao forma
       * caractere nenhum, o PDF nao a desenha e o laco de baixo a ignora de
       * proposito para nao devolver codigo que nao existe. Sem esta linha ela
       * atravessava sem aviso algum. */
      if (cp < 32 || (cp >= 0x7F && cp <= 0x9F) || cp > 0xFFFF ||
          (cp >= 0xD800 && cp <= 0xDFFF)) { anota(cp); continue; }
      if (temPropria.call(PROIBIDO, String.fromCharCode(cp))) anota(cp);
    }
    var g = naoDesenha(txt);
    for (i = 0; i < g.length; i++) {
      var c = g[i].charCodeAt(0);
      /* Meia metade de par substituto ja foi contada como codepoint inteiro
       * la em cima; contar de novo devolveria o codigo que nao existe. */
      if (c >= 0xD800 && c <= 0xDFFF) continue;
      anota(c);
    }
    return fora;
  }
  /* O trecho ofensor tambem entra no aviso, e o aviso pode ser impresso: um
   * caractere de controle dentro da mensagem levaria o defeito adiante. */
  function eco(txt) {
    return String(txt).replace(/[\u0000-\u001F\u007F-\u009F]/g, '?');
  }
  function cor3(c) {
    return c[0].toFixed(6) + ' ' + c[1].toFixed(6) + ' ' + c[2].toFixed(6);
  }

  /* ======================================== consulta de tabela, com trava
   *
   * Toda tabela deste arquivo e objeto literal, e objeto literal HERDA o
   * Object.prototype. Consultada com colchete cru, OP_GRANDE['toString'] devolve
   * a funcao herdada, que e verdadeira, e "\toString" passava por comando
   * conhecido: a palavra "toString" saia impressa na folha em peso normal, sem
   * aviso e sem selo, que e exatamente o que este arquivo existe para impedir.
   * Sao sete nomes (constructor, toString, valueOf, hasOwnProperty,
   * isPrototypeOf, propertyIsEnumerable, toLocaleString) e todos vinham da
   * string que o autor do tema digita, entao nenhum deles e hipotese.
   *
   * Daqui em diante nenhuma tabela e consultada com colchete cru quando a chave
   * vem do texto do autor: passa por aqui, que so responde pelo que a tabela
   * tem de proprio. */
  var temPropria = Object.prototype.hasOwnProperty;
  function pega(tabela, chave) {
    if (chave === null || chave === undefined) return undefined;
    return temPropria.call(tabela, chave) ? tabela[chave] : undefined;
  }
  function temNaTabela(tabela, chave) {
    if (chave === null || chave === undefined) return false;
    return temPropria.call(tabela, chave);
  }

  /* ====================================================== metricas da fonte
   *
   * Nao ha como perguntar a altura de um glifo ao pdf.js, entao ficam aqui as
   * medidas da Helvetica que o empilhamento precisa, em fracao do corpo.
   *
   * O prototipo usava 0.717 de altura e 0.21 de profundidade para QUALQUER
   * texto. Numa fracao isso reserva espaco de maiuscula e de perna de "p" mesmo
   * quando o numerador e "1": a barra fica longe do numero dos dois lados e a
   * fracao cresce sem motivo. Aqui a medida e por caractere, e "\frac{1}{2}"
   * sai justa. */
  var ALTURA = 0.717;     // topo da maiuscula e do algarismo
  var FUNDO = 0.21;       // quanto a perna do "p" desce
  var EIXO = 0.25;        // altura do sinal de igual, onde a fracao se centra
  var X_ALTURA = 0.523;   // altura do "x" da Helvetica, o sigma5 do Appendix G

  /* Os parametros de empilhamento do Appendix G do TeXbook, em fracao do corpo.
   *
   * Eles estavam escolhidos a mao (0.20 de folga dos dois lados da barra, 0.40
   * de subida do expoente) e o resultado divergia do LaTeX de um jeito visivel:
   * o numerador ficava 33 por cento mais baixo e os expoentes de "a^2 + b^2 =
   * c^2" saiam em degrau, um por letra. Aqui ficam com o nome que o TeXbook usa,
   * para quem for conferir poder abrir a tabela e comparar. */
  var SIGMA = {
    num1: 0.676508, num2: 0.393732,     // subida do numerador, display e texto
    denom1: 0.685951, denom2: 0.344841, // descida do denominador
    sup1: 0.412892, sup2: 0.362892,     // linha de base do expoente
    sub1: 0.15, sub2: 0.247217,         // linha de base do indice
    supDrop: 0.386108, subDrop: 0.05,   // sigma18 e sigma19, da base que e CAIXA
    nulo: 0.12                          // \nulldelimiterspace, 1.2pt em corpo 10
  };
  /* Os xi do Appendix G que o operador grande usa (Regra 13). */
  var XI = { op1: 0.111111, op2: 0.166667, op3: 0.2, op4: 0.2, op5: 0.1 };

  var ALT_CAR = {
    ' ': 0,
    'a': 0.523, 'c': 0.523, 'e': 0.523, 'm': 0.523, 'n': 0.523, 'o': 0.523,
    'r': 0.523, 's': 0.523, 'u': 0.523, 'v': 0.523, 'w': 0.523, 'x': 0.523,
    'z': 0.523, 'g': 0.523, 'p': 0.523, 'q': 0.523, 'y': 0.523,
    'b': 0.718, 'd': 0.718, 'f': 0.718, 'h': 0.718, 'k': 0.718, 'l': 0.718,
    'i': 0.718, 'j': 0.718, 't': 0.720,
    '(': 0.733, ')': 0.733, '[': 0.733, ']': 0.733, '{': 0.740, '}': 0.740,
    '|': 0.730, '/': 0.730, '\\': 0.730,
    '+': 0.505, '-': 0.290, '=': 0.390, '<': 0.500, '>': 0.500,
    '±': 0.550, '×': 0.440, '÷': 0.440, '·': 0.320,
    '.': 0.100, ',': 0.100, ':': 0.520, ';': 0.520, '!': 0.718, '?': 0.727,
    '°': 0.730, 'µ': 0.523,
    /* Os glifos da fonte Symbol. Sem eles um "\pi" no numerador media como
     * maiuscula e empurrava a barra da fracao para cima. */
    'π': 0.523, '√': 0.730, '≥': 0.550, '≤': 0.550,
    '≠': 0.550, '∞': 0.450, 'Δ': 0.690, 'Σ': 0.690,
    'α': 0.523, 'β': 0.730, 'θ': 0.730
  };
  var PROF_CAR = {
    'g': 0.212, 'j': 0.212, 'p': 0.212, 'q': 0.212, 'y': 0.212,
    '(': 0.207, ')': 0.207, '[': 0.207, ']': 0.207, '{': 0.210, '}': 0.210,
    '|': 0.210, '/': 0.210, '\\': 0.210, ',': 0.115, ';': 0.115,
    'ç': 0.210, 'Ç': 0.210, 'µ': 0.210,
    'β': 0.210, 'θ': 0.010, 'Σ': 0.020, 'α': 0.010
  };

  function metricaTexto(txt, tam) {
    var a = 0, p = 0;
    for (var i = 0; i < txt.length; i++) {
      var c = txt.charAt(i);
      var ac = pega(ALT_CAR, c);
      if (ac === undefined) ac = ALTURA;
      var pc = pega(PROF_CAR, c) || 0;
      if (ac > a) a = ac;
      if (pc > p) p = pc;
    }
    return { altura: a * tam, profundidade: p * tam };
  }

  /* ================================================================= caixas */

  function nada() { }

  function caixa(largura, altura, profundidade, desenhar) {
    return {
      largura: largura, altura: altura, profundidade: profundidade,
      desenhar: desenhar || nada
    };
  }

  function caixaVazia(largura) { return caixa(largura || 0, 0, 0, nada); }

  /* A caixa mais simples: um pedaco de texto na fonte do documento.
   *
   * Ela guarda txt, tam, bold e cor porque caixas de texto vizinhas com folga
   * zero sao FUNDIDAS numa so na hora de montar a linha (ver hbox). "2a" sai
   * como um Tj em vez de dois, e o fluxo do PDF de uma folha inteira de
   * exercicios encolhe sem mudar um ponto de posicao: o pdf.js soma largura de
   * caractere sem kerning, entao medir("2a") e medir("2") + medir("a"). */
  function caixaTexto(txt, tam, bold, c, reg) {
    txt = String(txt == null ? '' : txt);
    /* Promessa 2, no ponto exato em que ainda da para cumprir: se o caractere
     * nao desenha, ele NAO vai para a folha virar interrogacao muda. */
    var fora = foraDaFolha(txt);
    if (fora.length && reg) {
      reg.avisar('caractere que o PDF nao desenha ou que a regra da casa proibe: ' +
        fora.join(', ') + ' em "' + eco(txt) + '"');
      return caixaSelo(fora.join(' '), tam, reg);
    }
    var m = metricaTexto(txt, tam);
    var b = caixa(medirNaFonte(txt, tam, bold), m.altura, m.profundidade,
      function (doc, x, y) {
        if (!txt) return;
        doc.texto(txt, x, y, { tam: tam, bold: !!bold, cor: c });
      });
    b.txt = txt; b.tam = tam; b.bold = !!bold; b.cor = c;
    return b;
  }

  function podeFundir(a, b) {
    return a && b && a.txt !== undefined && b.txt !== undefined &&
      a.tam === b.tam && a.bold === b.bold && a.cor === b.cor;
  }

  /* Caixas lado a lado na mesma linha de base, com a folga pedida entre elas. */
  function hbox(itens, folgas) {
    var juntos = [];
    for (var i = 0; i < itens.length; i++) {
      var g = i > 0 ? (folgas && folgas[i - 1] ? folgas[i - 1] : 0) : 0;
      var ult = juntos.length ? juntos[juntos.length - 1] : null;
      if (ult && g === 0 && podeFundir(ult.c, itens[i])) {
        ult.c = caixaTexto(ult.c.txt + itens[i].txt, ult.c.tam, ult.c.bold, ult.c.cor, null);
        continue;
      }
      juntos.push({ c: itens[i], g: g });
    }
    var largura = 0, altura = 0, prof = 0;
    for (var j = 0; j < juntos.length; j++) {
      largura += juntos[j].g + juntos[j].c.largura;
      if (juntos[j].c.altura > altura) altura = juntos[j].c.altura;
      if (juntos[j].c.profundidade > prof) prof = juntos[j].c.profundidade;
    }
    return caixa(largura, altura, prof, function (doc, x, y) {
      var px = x;
      for (var k = 0; k < juntos.length; k++) {
        px += juntos[k].g;
        juntos[k].c.desenhar(doc, px, y);
        px += juntos[k].c.largura;
      }
    });
  }

  /* ================================================ desenho de traco cru
   *
   * Um caminho unico por glifo, com junta e ponta redondas, em vez de uma
   * chamada de linha() por segmento: a seta e o pertence sao poligonais de doze
   * pontos, e doze "m ... l S" por simbolo pesam no fluxo da pagina e ainda
   * deixam cantos vivos no encontro dos segmentos. */
  function tracar(doc, pts, c, esp) {
    if (!pts || pts.length < 2) return;
    /* Tudo dentro de um q/Q proprio. Cor de traco, espessura, ponta e junta sao
     * estado GLOBAL do fluxo de conteudo: sem o Q, a ponta redonda e a
     * espessura do glifo continuariam valendo no que fosse desenhado depois na
     * mesma pagina, e o defeito apareceria longe daqui. E a mesma disciplina do
     * comEstado do figuras/base.js. */
    var s = 'q ' + cor3(c) + ' RG ' + esp.toFixed(2) + ' w 1 J 1 j ' +
      pts[0][0].toFixed(2) + ' ' + pts[0][1].toFixed(2) + ' m ';
    for (var i = 1; i < pts.length; i++) {
      s += pts[i][0].toFixed(2) + ' ' + pts[i][1].toFixed(2) + ' l ';
    }
    doc.op(s + 'S Q');
  }

  /* Bezier quadratica amostrada. Serve para o parentese e para a chave que
   * crescem: os dois sao curva, e curva feita de segmento reto aparece como
   * quina justamente no tamanho grande, que e quando o delimitador importa. */
  function qbez(p0, p1, p2, n) {
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n, u = 1 - t;
      pts.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
                u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]);
    }
    return pts;
  }

  /* Arco de elipse, de a0 a a1 em graus. a0 pode ser maior que a1. */
  function arco(cx, cy, rx, ry, a0, a1, n) {
    var pts = [], g = Math.PI / 180;
    for (var i = 0; i <= n; i++) {
      var a = (a0 + (a1 - a0) * i / n) * g;
      pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    return pts;
  }

  function junta() {
    var pts = [];
    for (var i = 0; i < arguments.length; i++) pts = pts.concat(arguments[i]);
    return pts;
  }

  function espessura(tam) { return Math.max(0.5, tam * 0.075); }

  /* A espessura de REGRA, que e outra coisa: no TeX a barra da fracao e a barra
   * da raiz sao a mesma default_rule_thickness (xi8). Aqui elas eram calculadas
   * em dois lugares e saiam diferentes: numa fracao com raiz no numerador as
   * duas linhas apareciam empilhadas, uma 22 por cento mais grossa que a outra.
   * Agora e uma funcao so, e quem quiser mudar muda num lugar. */
  function regra(tam) { return Math.max(0.5, tam * 0.055); }

  /* ====================================== os glifos que a fonte nao tem
   *
   * A lista foi conferida rodando node contra o pdf.js, e nao suposta. A
   * Helvetica com WinAnsi desenha + - = < > ( ) [ ] e ainda ± × ÷ · ° µ; a base
   * 14 /Symbol acrescenta π √ ≥ ≤ ≠ ∞ Δ Σ α β θ. Todo o resto da lista do
   * subconjunto (≈ → ⇒ ∈ ⊂ ∪ ∩ ∠ ⊥ ∥ λ φ ω ∏ ∫) sai como interrogacao e por
   * isso e desenhado aqui.
   *
   * Cada funcao devolve uma caixa. Simbolo de relacao nasce centrado no EIXO,
   * que e por onde passa o sinal de igual: e o que faz "x ≈ 3" alinhar com
   * "x = 3" na mesma linha. */

  function glifoRelacao(tam, larguraRel, alturaRel, profRel, pintar) {
    var eixo = tam * EIXO;
    return caixa(tam * larguraRel, eixo + tam * alturaRel, tam * profRel,
      function (doc, x, y) { pintar(doc, x, y, y + eixo, tam); });
  }

  var GLIFO = {};

  /* A seta do limite: "x \to 2". A fonte nao tem, e sai como interrogacao. */
  GLIFO.seta = function (tam, c) {
    return glifoRelacao(tam, 1.10, 0.15, 0, function (doc, x, y, m) {
      var e = espessura(tam), w = tam * 1.10;
      tracar(doc, [[x + tam * 0.08, m], [x + w - tam * 0.06, m]], c, e);
      tracar(doc, [[x + w - tam * 0.30, m + tam * 0.13], [x + w - tam * 0.06, m],
                   [x + w - tam * 0.30, m - tam * 0.13]], c, e);
    });
  };

  /* A seta dupla da implicacao: "x = 2 \Rightarrow x^2 = 4". */
  GLIFO.setaDupla = function (tam, c) {
    return glifoRelacao(tam, 1.16, 0.17, 0, function (doc, x, y, m) {
      var e = espessura(tam) * 0.85, w = tam * 1.16, d = tam * 0.06;
      tracar(doc, [[x + tam * 0.08, m + d], [x + w - tam * 0.22, m + d]], c, e);
      tracar(doc, [[x + tam * 0.08, m - d], [x + w - tam * 0.22, m - d]], c, e);
      tracar(doc, [[x + w - tam * 0.34, m + tam * 0.16], [x + w - tam * 0.06, m],
                   [x + w - tam * 0.34, m - tam * 0.16]], c, espessura(tam));
    });
  };

  /* Aproximadamente: dois tis empilhados. */
  GLIFO.aprox = function (tam, c) {
    return glifoRelacao(tam, 0.78, 0.20, 0.02, function (doc, x, y, m) {
      var e = espessura(tam) * 0.9, w = tam * 0.60, x0 = x + tam * 0.09;
      var onda = function (yy) {
        return [[x0, yy - tam * 0.03], [x0 + w * 0.25, yy + tam * 0.045],
                [x0 + w * 0.55, yy - tam * 0.045], [x0 + w, yy + tam * 0.03]];
      };
      tracar(doc, onda(m + tam * 0.10), c, e);
      tracar(doc, onda(m - tam * 0.10), c, e);
    });
  };

  /* Pertence: o arco aberto para a direita com a barra no meio. */
  GLIFO.pertence = function (tam, c) {
    return glifoRelacao(tam, 0.72, 0.29, 0.03, function (doc, x, y, m) {
      var e = espessura(tam) * 0.9, cx = x + tam * 0.42, rx = tam * 0.25, ry = tam * 0.28;
      tracar(doc, arco(cx, m, rx, ry, 50, 310, 16), c, e);
      tracar(doc, [[cx - rx * 0.85, m], [cx + rx * 0.80, m]], c, e);
    });
  };

  /* Contido: o mesmo arco, sem a barra e mais aberto. */
  GLIFO.contido = function (tam, c) {
    return glifoRelacao(tam, 0.72, 0.29, 0.03, function (doc, x, y, m) {
      tracar(doc, arco(x + tam * 0.44, m, tam * 0.27, tam * 0.28, 55, 305, 16),
        c, espessura(tam) * 0.9);
    });
  };

  /* Contido ou igual: o arco com o tracinho embaixo. Ele existe porque
   * "\subseteq" saia com o MESMO desenho de "\subset", e a diferenca entre
   * contido e contido ou igual e o proprio exercicio de conjuntos do 1o ano:
   * a aluna leria o enunciado errado sem nada na folha indicando o problema. */
  GLIFO.contidoIgual = function (tam, c) {
    return glifoRelacao(tam, 0.72, 0.33, 0.10, function (doc, x, y, m) {
      var e = espessura(tam) * 0.9, cy = m + tam * 0.07;
      tracar(doc, arco(x + tam * 0.44, cy, tam * 0.27, tam * 0.26, 55, 305, 16), c, e);
      tracar(doc, [[x + tam * 0.15, m - tam * 0.28], [x + tam * 0.65, m - tam * 0.28]], c, e);
    });
  };

  /* A bolinha da composicao de funcoes, "f \circ g". Ela saia como sinal de
   * GRAU, que e outro simbolo: quem corrigisse a lista lia "f grau g". */
  GLIFO.bolinha = function (tam, c) {
    return glifoRelacao(tam, 0.46, 0.15, 0, function (doc, x, y, m) {
      tracar(doc, arco(x + tam * 0.23, m, tam * 0.135, tam * 0.135, 0, 360, 16),
        c, espessura(tam) * 0.75);
    });
  };

  /* O menos e mais, "\mp". Ele saia com o glifo do "\pm": duas contas
   * diferentes com o mesmo desenho, sem aviso e sem selo, que e pior do que a
   * interrogacao muda porque ninguem consegue notar. Uma raiz que era
   * "a \mp b" saia impressa como "a \pm b" e o sinal da resposta invertia. */
  GLIFO.menosMais = function (tam, c) {
    return glifoRelacao(tam, 0.68, 0.34, 0.08, function (doc, x, y, m) {
      var e = espessura(tam) * 0.9, w = tam * 0.52, x0 = x + tam * 0.08;
      var cima = m + tam * 0.22, baixo = m - tam * 0.14;
      tracar(doc, [[x0, cima], [x0 + w, cima]], c, e);          // o menos, em cima
      tracar(doc, [[x0, baixo], [x0 + w, baixo]], c, e);        // a barra do mais
      tracar(doc, [[x0 + w / 2, baixo - tam * 0.16], [x0 + w / 2, baixo + tam * 0.16]], c, e);
    });
  };

  GLIFO.uniao = function (tam, c) {
    return glifoRelacao(tam, 0.72, 0.28, 0.02, function (doc, x, y, m) {
      var cx = x + tam * 0.36, rx = tam * 0.24, ry = tam * 0.20, topo = m + tam * 0.26;
      tracar(doc, junta([[cx - rx, topo]], arco(cx, m - tam * 0.05, rx, ry, 180, 360, 14),
        [[cx + rx, topo]]), c, espessura(tam) * 0.9);
    });
  };

  GLIFO.interseccao = function (tam, c) {
    return glifoRelacao(tam, 0.72, 0.28, 0.02, function (doc, x, y, m) {
      var cx = x + tam * 0.36, rx = tam * 0.24, ry = tam * 0.20, base = m - tam * 0.26;
      tracar(doc, junta([[cx - rx, base]], arco(cx, m + tam * 0.05, rx, ry, 180, 0, 14),
        [[cx + rx, base]]), c, espessura(tam) * 0.9);
    });
  };

  /* Angulo, perpendicular e paralelo assentam na linha de base, como letra, e
   * nao no eixo: "\angle ABC" e "r \perp s" se leem como palavra. */
  GLIFO.angulo = function (tam, c) {
    return caixa(tam * 0.78, tam * 0.58, 0, function (doc, x, y) {
      var e = espessura(tam) * 0.9, w = tam * 0.66;
      tracar(doc, [[x + tam * 0.06, y], [x + tam * 0.06 + w, y]], c, e);
      tracar(doc, [[x + tam * 0.06, y], [x + tam * 0.06 + w * 0.92, y + tam * 0.56]], c, e);
    });
  };

  GLIFO.perp = function (tam, c) {
    return caixa(tam * 0.72, tam * 0.62, 0, function (doc, x, y) {
      var e = espessura(tam) * 0.9, w = tam * 0.60, x0 = x + tam * 0.06;
      tracar(doc, [[x0, y], [x0 + w, y]], c, e);
      tracar(doc, [[x0 + w / 2, y], [x0 + w / 2, y + tam * 0.62]], c, e);
    });
  };

  GLIFO.paralelo = function (tam, c) {
    return caixa(tam * 0.48, tam * 0.68, 0, function (doc, x, y) {
      var e = espessura(tam) * 0.9;
      tracar(doc, [[x + tam * 0.16, y], [x + tam * 0.16, y + tam * 0.68]], c, e);
      tracar(doc, [[x + tam * 0.34, y], [x + tam * 0.34, y + tam * 0.68]], c, e);
    });
  };

  /* As tres gregas que faltam na /Symbol do pdf.js. Sao aproximacoes de traco,
   * e assumidamente aproximacoes: ao lado do alfa e do beta da fonte elas tem
   * peso um pouco diferente. Ainda assim e o certo a fazer, porque a alternativa
   * e o lambda da funcao afim sair como interrogacao. */
  GLIFO.lambda = function (tam, c) {
    return caixa(tam * 0.60, tam * 0.74, 0, function (doc, x, y) {
      var e = espessura(tam) * 0.95, w = tam * 0.56, x0 = x + tam * 0.02;
      tracar(doc, [[x0 + w * 0.06, y + tam * 0.72], [x0 + w * 0.26, y + tam * 0.74],
                   [x0 + w * 0.40, y + tam * 0.60], [x0 + w * 0.94, y]], c, e);
      tracar(doc, [[x0 + w * 0.52, y + tam * 0.36], [x0 + w * 0.04, y]], c, e);
    });
  };

  GLIFO.phi = function (tam, c) {
    return caixa(tam * 0.64, tam * 0.72, tam * 0.18, function (doc, x, y) {
      var e = espessura(tam) * 0.9, cx = x + tam * 0.32;
      tracar(doc, arco(cx, y + tam * 0.26, tam * 0.24, tam * 0.26, 0, 360, 20), c, e);
      tracar(doc, [[cx, y - tam * 0.16], [cx, y + tam * 0.70]], c, e);
    });
  };

  /* O Omega maiusculo: o espaco amostral de probabilidade do 2o ano, que e
   * conteudo do subconjunto declarado. Ele nao estava na tabela e a formula
   * "P(A) = n(A)/n(\Omega)", que e padrao de aula, saia com selo de comando
   * desconhecido no meio do denominador. A /Symbol do pdf.js nao tem o glifo,
   * entao ele e desenhado, como o lambda e o phi. */
  GLIFO.omegaMaiusc = function (tam, c) {
    return caixa(tam * 0.82, tam * 0.72, 0, function (doc, x, y) {
      var e = espessura(tam) * 0.95;
      var cx = x + tam * 0.41, cy = y + tam * 0.40;
      tracar(doc, junta([[cx + tam * 0.38, y], [cx + tam * 0.13, y]],
        arco(cx, cy, tam * 0.30, tam * 0.32, -55, 235, 24),
        [[cx - tam * 0.13, y], [cx - tam * 0.38, y]]), c, e);
    });
  };

  GLIFO.omega = function (tam, c) {
    return caixa(tam * 0.86, tam * 0.53, 0, function (doc, x, y) {
      var e = espessura(tam) * 0.9, rx = tam * 0.20, ry = tam * 0.26;
      var cy = y + ry, ce = x + tam * 0.04 + rx, cd = ce + rx * 2;
      tracar(doc, junta(arco(ce, cy, rx, ry, 165, 375, 16),
                        arco(cd, cy, rx, ry, 165, 375, 16)), c, e);
    });
  };

  /* A tinta de um traco e pintada METADE para cada lado da linha de centro, e
   * nenhum glifo desenhado contava essa metade na propria caixa: a seta, o
   * pertence, o sigma e todos os outros vazavam meia pena para fora do que
   * medir() prometia (0.39 ponto em corpo 11, 0.71 em corpo 20), sempre para
   * fora, e duas formulas coladas encostavam. A promessa 3 do cabecalho e que a
   * largura medida e a largura desenhada.
   *
   * O conserto e em um lugar so, e nao vinte: cada glifo continua desenhado
   * exatamente como estava, e o embrulho reserva a meia pena nos quatro lados,
   * empurrando o desenho para dentro. */
  function comPena(f) {
    return function (tam, c) {
      var b = f(tam, c), meia = espessura(tam) * 1.1 / 2;
      return caixa(b.largura + meia * 2, b.altura + meia, b.profundidade + meia,
        function (doc, x, y) { b.desenhar(doc, x + meia, y); });
    };
  }

  /* ============================ os operadores grandes, desenhados
   *
   * O Sigma e o Delta da fonte existem, mas sao LETRA: em corpo de operador
   * ficam pequenos e com proporcao de texto. O somatorio de "\sum_{k=1}^{n}" tem
   * que ter altura de operador, e o produtorio e a integral a fonte nao tem de
   * jeito nenhum. Todos nascem centrados no eixo, para o "= " depois deles
   * alinhar. */
  function caixaOperador(tam, larguraRel, metadeRel, pintar) {
    var eixo = tam * EIXO, metade = tam * metadeRel;
    return caixa(tam * larguraRel, eixo + metade, metade - eixo,
      function (doc, x, y) {
        var meio = y + eixo;
        pintar(doc, x, meio + metade, meio - metade, tam);
      });
  }

  GLIFO.somatorio = function (tam, c) {
    return caixaOperador(tam, 0.86, 0.60, function (doc, x, topo, base) {
      var w = tam * 0.78, e = espessura(tam) * 1.1, meio = (topo + base) / 2;
      tracar(doc, [[x + w, topo], [x, topo], [x + w * 0.46, meio],
                   [x, base], [x + w, base]], c, e);
    });
  };

  GLIFO.produtorio = function (tam, c) {
    return caixaOperador(tam, 0.94, 0.60, function (doc, x, topo, base) {
      var w = tam * 0.86, e = espessura(tam) * 1.1, x0 = x + tam * 0.04;
      tracar(doc, [[x0, topo], [x0 + w, topo]], c, e);
      tracar(doc, [[x0 + w * 0.20, topo], [x0 + w * 0.20, base]], c, e);
      tracar(doc, [[x0 + w * 0.80, topo], [x0 + w * 0.80, base]], c, e);
    });
  };

  GLIFO.integral = function (tam, c) {
    return caixaOperador(tam, 0.66, 0.78, function (doc, x, topo, base) {
      var w = tam * 0.58, e = espessura(tam), h = topo - base;
      var pts = junta(
        qbez([x + w * 0.86, topo - h * 0.04], [x + w * 0.72, topo],
             [x + w * 0.56, topo - h * 0.24], 8),
        qbez([x + w * 0.56, topo - h * 0.24], [x + w * 0.50, topo - h * 0.50],
             [x + w * 0.44, base + h * 0.24], 8),
        qbez([x + w * 0.44, base + h * 0.24], [x + w * 0.28, base],
             [x + w * 0.14, base + h * 0.04], 8));
      tracar(doc, pts, c, e);
    });
  };

  /* Toda a lista de glifos passa a reservar a meia pena, de uma vez. Fica aqui,
   * depois da ultima definicao e antes do primeiro uso, para nenhum glifo novo
   * escapar por esquecimento de quem o acrescentar. */
  (function () {
    for (var g in GLIFO) if (temPropria.call(GLIFO, g)) GLIFO[g] = comPena(GLIFO[g]);
  })();

  /* ============================================= a tabela de simbolos
   *
   * Para cada comando: usa a FONTE se ela tiver o glifo, senao DESENHA, e se
   * nao houver nem um nem outro registra aviso (o ramo do desconhecido, la
   * embaixo). Nenhum simbolo desta tabela cai no terceiro caso, e o
   * testa_formula.js confere isso caractere a caractere contra o pdf.js. */
  var SIMBOLO = {
    // operadores binarios que a Helvetica desenha direto
    'pm': { txt: '±', classe: 'bin' },
    'mp': { glifo: 'menosMais', classe: 'bin' },
    'times': { txt: '×', classe: 'bin' },
    'cdot': { txt: '·', classe: 'bin' },
    'div': { txt: '÷', classe: 'bin' },
    // relacoes: as quatro primeiras vem da /Symbol, o resto e desenho
    'leq': { txt: '≤', classe: 'rel' },
    'le': { txt: '≤', classe: 'rel' },
    'geq': { txt: '≥', classe: 'rel' },
    'ge': { txt: '≥', classe: 'rel' },
    'neq': { txt: '≠', classe: 'rel' },
    'ne': { txt: '≠', classe: 'rel' },
    'approx': { glifo: 'aprox', classe: 'rel' },
    'to': { glifo: 'seta', classe: 'rel' },
    'rightarrow': { glifo: 'seta', classe: 'rel' },
    'Rightarrow': { glifo: 'setaDupla', classe: 'rel' },
    'implies': { glifo: 'setaDupla', classe: 'rel' },
    'in': { glifo: 'pertence', classe: 'rel' },
    'subset': { glifo: 'contido', classe: 'rel' },
    'subseteq': { glifo: 'contidoIgual', classe: 'rel' },
    'perp': { glifo: 'perp', classe: 'rel' },
    'parallel': { glifo: 'paralelo', classe: 'rel' },
    'cup': { glifo: 'uniao', classe: 'bin' },
    'cap': { glifo: 'interseccao', classe: 'bin' },
    // ordinarios
    'infty': { txt: '∞', classe: 'ord' },
    'angle': { glifo: 'angulo', classe: 'ord' },
    'circ': { glifo: 'bolinha', classe: 'bin' },
    'degree': { txt: '°', classe: 'ord' },
    'ldots': { txt: '...', classe: 'ord' },
    'cdots': { txt: '...', classe: 'ord' },
    'dots': { txt: '...', classe: 'ord' },
    // gregas: pi, alpha, beta, theta, Delta e Sigma vem da /Symbol;
    // lambda, phi e omega sao desenho, porque a /Symbol do pdf.js nao as tem.
    'pi': { txt: 'π', classe: 'ord' },
    'alpha': { txt: 'α', classe: 'ord' },
    'beta': { txt: 'β', classe: 'ord' },
    'theta': { txt: 'θ', classe: 'ord' },
    'Delta': { txt: 'Δ', classe: 'ord' },
    'Sigma': { txt: 'Σ', classe: 'ord' },
    'Omega': { glifo: 'omegaMaiusc', classe: 'ord' },
    'lambda': { glifo: 'lambda', classe: 'ord' },
    'phi': { glifo: 'phi', classe: 'ord' },
    'varphi': { glifo: 'phi', classe: 'ord' },
    'omega': { glifo: 'omega', classe: 'ord' },
    /* O micro do WinAnsi tem o desenho do mu minusculo na Helvetica, e e o
     * unico jeito de escrever mu sem desenhar: a /Symbol do pdf.js nao carrega
     * a letra grega mu. */
    'mu': { txt: 'µ', classe: 'ord' }
  };

  /* Operadores grandes: sinal desenhado e limites em cima e embaixo. */
  var OP_GRANDE = {
    'sum': { glifo: 'somatorio' },
    'prod': { glifo: 'produtorio' },
    'int': { glifo: 'integral' },
    'lim': { nome: 'lim' },
    'max': { nome: 'max' },
    'min': { nome: 'min' }
  };

  /* Nomes de funcao: texto em pe, e o expoente vai para o lado, nao para cima.
   * "\log_{2} 8" e "\sen 30" aparecem no material do fundamental ao medio. */
  var OP_NOME = {
    'sin': 'sen', 'sen': 'sen', 'cos': 'cos', 'tan': 'tg', 'tg': 'tg',
    'log': 'log', 'ln': 'ln', 'exp': 'exp'
  };

  /* Espacos explicitos, em fracao do corpo (a conta do TeX e em mu, 1/18 do em). */
  var ESPACO_CMD = {
    ',': 3 / 18, ':': 4 / 18, ';': 5 / 18, '!': -3 / 18,
    'quad': 1, 'qquad': 2, ' ': 0.278
  };

  /* Escapes de caractere literal. */
  var ESCAPE = {
    '{': { txt: '{', classe: 'abre' }, '}': { txt: '}', classe: 'fecha' },
    '%': { txt: '%', classe: 'ord' }, '&': { txt: '&', classe: 'ord' },
    '_': { txt: '_', classe: 'ord' }, '$': { txt: '$', classe: 'ord' },
    '#': { txt: '#', classe: 'ord' }
  };

  /* ================================================ classes e espacamento
   *
   * A tabela do TeX, em mu (1 mu = 1/18 do corpo). 0 nenhum, 1 fino (3 mu),
   * 2 medio (4 mu), 3 grosso (5 mu). E o que faz "a+b" parecer certo contra
   * "a + b": o autor do tema nao precisa acertar espaco na mao, e nao adianta
   * ele tentar, porque em modo matematico o espaco digitado e ignorado.
   *
   * O prototipo nao fazia isso e a folha ficou apertada em alguns pontos. */
  var LARGURA_ESPACO = { 0: 0, 1: 3 / 18, 2: 4 / 18, 3: 5 / 18 };
  var TABELA = {
    ord:   { ord: 0, op: 1, bin: 2, rel: 3, abre: 0, fecha: 0, pont: 0, inner: 1 },
    op:    { ord: 1, op: 1, bin: 0, rel: 3, abre: 0, fecha: 0, pont: 0, inner: 1 },
    bin:   { ord: 2, op: 2, bin: 0, rel: 0, abre: 2, fecha: 0, pont: 0, inner: 2 },
    rel:   { ord: 3, op: 3, bin: 0, rel: 0, abre: 3, fecha: 0, pont: 0, inner: 3 },
    abre:  { ord: 0, op: 0, bin: 0, rel: 0, abre: 0, fecha: 0, pont: 0, inner: 0 },
    fecha: { ord: 0, op: 1, bin: 2, rel: 3, abre: 0, fecha: 0, pont: 0, inner: 1 },
    pont:  { ord: 1, op: 1, bin: 0, rel: 1, abre: 1, fecha: 1, pont: 1, inner: 1 },
    inner: { ord: 1, op: 1, bin: 2, rel: 3, abre: 1, fecha: 0, pont: 1, inner: 1 }
  };

  function folgaEntre(a, b, ctx) {
    var linha = TABELA[a] || TABELA.ord;
    var v = linha[b];
    if (v === undefined) v = 0;
    if (!v) return 0;
    var w = LARGURA_ESPACO[v] * tamDe(ctx);
    /* Dentro de expoente, indice e limite o TeX corta o espaco de binario e de
     * relacao. Aqui ele so encolhe pela metade: o material e de crianca, e
     * "k=1" embaixo do somatorio com zero folga em corpo 7 fica colado demais
     * para ler. E um desvio consciente da tabela original. */
    if (ctx.nivel > 0) w = w * 0.5;
    return w;
  }

  /* ================================================================ registro
   *
   * O aviso segue o formato do verificar.py: o que aconteceu, onde, e o trecho
   * que causou. Ele vai para tres lugares: o registro devolvido pela API, o
   * doc (para quem gera a folha poder travar antes de imprimir) e o console. */
  function Registro(fonte) {
    this.avisos = [];
    this.fonte = String(fonte == null ? '' : fonte);
    this.doc = null;
  }
  Registro.prototype.avisar = function (texto, pos) {
    var msg = texto;
    if (pos !== undefined && pos !== null) {
      msg += ' | ' + trecho(this.fonte, pos);
    }
    this.avisos.push(msg);
    /* O MESMO defeito nao pode entrar duas vezes no registro do documento.
     *
     * Quem gera a folha mede antes de desenhar, que e o caminho que este
     * arquivo recomenda, e montar() refaz a analise inteira nas duas chamadas:
     * cada aviso chegava em dobro em doc.avisosFormula e em doc.avisoDeFigura,
     * e uma trava que conta avisos contava o dobro.
     *
     * A chave e a formula MAIS a POSICAO MAIS a mensagem, e a posicao esta ali
     * por um motivo: em "$x^{2}$" os dois cifroes geram mensagens de texto
     * identico, porque o trecho citado e a formula inteira nos dois casos. Sao
     * dois defeitos de verdade, em lugares diferentes, e os dois tem que
     * aparecer. So a mesma queixa no mesmo ponto e que e repeticao. */
    var chave = this.fonte + '|' + (pos === undefined || pos === null ? '' : pos) +
      '|' + texto;
    if (this.doc) {
      var vistos = this.doc.avisosFormulaVistos ||
        (this.doc.avisosFormulaVistos = {});
      if (!temPropria.call(vistos, chave)) {
        vistos[chave] = 1;
        (this.doc.avisosFormula = this.doc.avisosFormula || []).push(msg);
        if (typeof this.doc.avisoDeFigura === 'function') this.doc.avisoDeFigura('formula: ' + msg);
      }
    }
    /* O eco no console tambem sai uma vez so. Quem gera a folha costuma medir
     * SEM doc e desenhar COM doc, e o mesmo defeito aparecia tres vezes na
     * tela: duas do formula e uma do figura. O array devolvido por medir() e o
     * registro do documento continuam completos, entao nada se perde aqui. */
    if (ecoNovo(chave) && typeof console !== 'undefined' && console.warn) {
      console.warn('[formula] ' + msg);
    }
  };

  /* A memoria do eco, com teto: no tablet a pagina fica aberta o dia inteiro e
   * um mapa que so cresce e vazamento. Ao encher, ela esquece tudo e recomeca,
   * o que no pior caso repete um aviso na tela e nao perde nenhum. */
  var ecoVisto = {}, ecoQuantos = 0;
  function ecoNovo(chave) {
    if (temPropria.call(ecoVisto, chave)) return false;
    if (ecoQuantos > 500) { ecoVisto = {}; ecoQuantos = 0; }
    ecoVisto[chave] = 1; ecoQuantos++;
    return true;
  }
  function trecho(fonte, pos) {
    var de = Math.max(0, pos - 16), ate = Math.min(fonte.length, pos + 20);
    return (de > 0 ? '...' : '') + fonte.slice(de, ate) + (ate < fonte.length ? '...' : '');
  }

  /* O selo de aviso na folha.
   *
   * Ele existe porque as duas saidas faceis sao as duas erradas: imprimir o
   * comando cru manda "\raizz{2}" para a folha da aluna como se fosse texto, e
   * descartar em silencio some com um pedaco da conta sem ninguem notar. O selo
   * e legivel, cabe na linha e nao se confunde com formula. */
  function caixaSelo(codigo, tam, reg) {
    var t = Math.max(5.5, tam * 0.72);
    var texto = eco(String(codigo));
    if (texto.length > 18) texto = texto.slice(0, 17) + '.';
    /* O proprio selo passa pela trava de caractere: um aviso que sai como
     * interrogacao nao avisa nada. */
    var fora = naoDesenha(texto);
    for (var i = 0; i < fora.length; i++) texto = texto.split(fora[i]).join('?');
    var larg = medirNaFonte(texto, t, true) + Math.max(tam * 0.5, t * 0.36);
    /* A moldura acompanha o TEXTO, e nao so o corpo pedido. O texto tem piso de
     * 5.5 pontos (senao o aviso fica ilegivel) e a moldura nao tinha piso
     * nenhum: no fundo de um poco, com o corpo travado no minimo, as letras
     * furavam a borda dourada em cima e embaixo e o aviso que devia ser o mais
     * legivel da folha virava borrao. */
    var alt = Math.max(tam * 0.72, t * 0.80), prof = Math.max(tam * 0.16, t * 0.24);
    return caixa(larg, alt, prof, function (doc, x, y) {
      var y0 = y - prof, h = alt + prof;
      doc.retangulo(x, y0, larg, h, cor('softEsc'));
      var b = cor('gold');
      doc.linha(x, y0, x + larg, y0, b, 0.6);
      doc.linha(x, y0 + h, x + larg, y0 + h, b, 0.6);
      doc.linha(x, y0, x, y0 + h, b, 0.6);
      doc.linha(x + larg, y0, x + larg, y0 + h, b, 0.6);
      doc.texto(texto, x + tam * 0.25, y0 + prof * 0.9, { tam: t, bold: true, cor: cor('navy') });
    });
  }

  /* ============================================================ tokenizador */

  /* Os caracteres RESERVADOS do LaTeX, que nao sao conteudo em lugar nenhum.
   *
   * Eles chegavam como caractere comum e iam para a folha em peso normal, sem
   * aviso e sem selo, porque a Helvetica desenha todos e a trava do pdf.js
   * aprovava. O caso mais comum de todos e o cifrao: quem escreve tema em LaTeX
   * embrulha formula em $...$ por habito de decada, e a folha saia com "$x²$"
   * impresso ao lado da conta. O "%" e pior: no TeX ele comeria o resto da
   * linha, e aqui ele ia inteiro para o papel.
   *
   * Nenhum deles e adivinhado: cada um vira aviso com a dica do que escrever no
   * lugar, mais o selo, e o resto da formula continua sendo desenhado. */
  var RESERVADO = {
    '$': 'a formula ja esta em modo matematico, tire os cifroes',
    '%': 'para o sinal de porcentagem escreva \\%, que o % sozinho e comentario no LaTeX',
    '#': 'para o sinal escreva \\#',
    '~': 'para espaco escreva \\, ou \\quad'
  };

  function tokenizar(s, reg) {
    var toks = [], i = 0, n = s.length;
    while (i < n) {
      var c = s.charAt(i);
      if (c === '\\') {
        var m = /^[A-Za-z]+/.exec(s.slice(i + 1));
        if (m) {
          toks.push({ t: 'cmd', v: m[0], bruto: '\\' + m[0], pos: i });
          i += 1 + m[0].length;
          // o TeX come o espaco depois do nome do comando: "\pi r" e "\pi" e "r"
          while (i < n && /\s/.test(s.charAt(i))) i++;
          continue;
        }
        var d = s.charAt(i + 1);
        if (!d) {
          if (reg && reg.avisar) reg.avisar('barra invertida solta no fim da formula', i);
          toks.push({ t: 'erro', v: '\\', pos: i });
          i++;
          continue;
        }
        toks.push({ t: 'cmd', v: d, bruto: '\\' + d, pos: i });
        i += 2;
        continue;
      }
      if (c === '{' || c === '}' || c === '^' || c === '_' || c === '&') {
        /* O v e o bruto vao junto de proposito. Sem eles o token de pontuacao
         * nao tinha como se identificar: o selo dentro do \text saia como "??"
         * para o & e para o ^, defeitos diferentes com a mesma marca ilegivel,
         * e o "_" sumia do nome de ambiente ("small_matrix" virava
         * "smallmatrix" no aviso, e quem fosse procurar no tema nao achava). */
        toks.push({ t: c, v: c, bruto: c, pos: i }); i++; continue;
      }
      if (temPropria.call(RESERVADO, c)) {
        toks.push({ t: 'reservado', v: c, bruto: c, pos: i }); i++; continue;
      }
      if (/\s/.test(c)) {
        /* O espaco digitado nao vale medida em modo matematico, mas precisa
         * existir como token: dentro de \text{a de b} ele e conteudo. */
        toks.push({ t: 'esp', pos: i });
        while (i < n && /\s/.test(s.charAt(i))) i++;
        continue;
      }
      /* Par substituto vai INTEIRO num token so. Partido em duas metades, cada
       * uma virava um atomo de meio caractere, a checagem de codepoint nunca
       * conseguia remontar o emoji e ele atravessava a folha sem aviso nenhum. */
      var alto = s.charCodeAt(i);
      if (alto >= 0xD800 && alto <= 0xDBFF && i + 1 < n) {
        var baixo = s.charCodeAt(i + 1);
        if (baixo >= 0xDC00 && baixo <= 0xDFFF) {
          toks.push({ t: 'car', v: s.substr(i, 2), pos: i }); i += 2; continue;
        }
      }
      toks.push({ t: 'car', v: c, pos: i }); i++;
    }
    return toks;
  }

  /* ============================================================ o analisador */

  var CLASSE_CAR = {
    '+': 'bin', '-': 'bin', '*': 'bin',
    '=': 'rel', '<': 'rel', '>': 'rel',
    '(': 'abre', '[': 'abre',
    ')': 'fecha', ']': 'fecha',
    ',': 'pont', ';': 'pont',
    '|': 'rel'
  };

  /* Fundo maximo de aninhamento.
   *
   * O pedido exige 10 niveis e a folha de escola nao chega perto disso. O que
   * este limite impede e outra coisa: sem ele a recursao do analisador estourava
   * a pilha (RangeError perto de 1700 fracoes ou 1900 chaves aninhadas) e a
   * excecao subia por medir() e desenhar() sem tratamento, derrubando a GERACAO
   * DA FOLHA INTEIRA. Formula torta tem que virar selo, e nao matar a folha. */
  var FUNDO_MAXIMO = 48;

  function Est(toks, reg) {
    this.toks = toks; this.reg = reg; this.i = 0;
    this.prof = 0; this.avisouFundo = false;
  }
  Est.prototype.olhar = function () { return this.toks[this.i] || null; };
  Est.prototype.comer = function () { return this.toks[this.i++] || null; };
  Est.prototype.pular = function () {
    while (this.toks[this.i] && this.toks[this.i].t === 'esp') this.i++;
  };
  Est.prototype.fim = function () { this.pular(); return this.i >= this.toks.length; };
  Est.prototype.pos = function () {
    var t = this.toks[this.i] || this.toks[this.toks.length - 1];
    return t ? t.pos : 0;
  };

  function noErro(codigo) { return { tipo: 'erro', codigo: codigo }; }

  /* Pendura um selo ao lado de um no que ficou de pe apesar do defeito. E o
   * caso da matriz sem \end e do \text{ sem fechar: o conteudo continua legivel
   * na folha, mas ninguem pode imprimir aquilo achando que esta certo. */
  function comSelo(no, codigo, antes) {
    return { tipo: 'lista', filhos: antes ? [noErro(codigo), no] : [no, noErro(codigo)] };
  }

  /* Uma lista de nos ate o token de parada. parar recebe o token e decide. */
  function lerLista(est, parar) {
    var filhos = [];
    while (true) {
      est.pular();
      var t = est.olhar();
      if (!t) break;
      if (parar && parar(t)) break;
      if (t.t === '}') {
        est.comer();
        est.reg.avisar('chave } fechada sem abrir', t.pos);
        filhos.push(noErro('}?'));
        continue;
      }
      var antes = est.i;
      var no = lerUnidade(est);
      if (no) filhos.push(no);
      if (est.i === antes) est.comer();   // trava contra laco infinito
    }
    return { tipo: 'lista', filhos: filhos };
  }

  /* Um atomo com o que estiver pendurado nele por ^ e _. */
  function lerUnidade(est) {
    var base = lerAtomo(est);
    if (!base) return null;
    var extras = null, cima = null, baixo = null;
    while (true) {
      est.pular();
      var t = est.olhar();
      if (!t || (t.t !== '^' && t.t !== '_')) break;
      est.comer();
      var qual = t.t === '^' ? 'expoente' : 'indice';
      var arg = lerArgumento(est, qual, t.pos);
      if (t.t === '^') {
        if (cima) {
          est.reg.avisar('dois expoentes no mesmo termo', t.pos);
          extras = extras || [];
          extras.push(noErro('^?'));
        } else cima = arg;
      } else {
        if (baixo) {
          est.reg.avisar('dois indices no mesmo termo', t.pos);
          extras = extras || [];
          extras.push(noErro('_?'));
        } else baixo = arg;
      }
    }
    var no = base;
    if (cima || baixo) {
      if (base.tipo === 'opGrande') { base.cima = cima; base.baixo = baixo; }
      else no = { tipo: 'nivel', base: base, cima: cima, baixo: baixo };
    }
    if (extras) return { tipo: 'lista', filhos: [no].concat(extras) };
    return no;
  }

  /* Argumento de comando: um grupo {..} ou um unico atomo, como no TeX. */
  function lerArgumento(est, oque, pos) {
    est.pular();
    var t = est.olhar();
    if (!t || t.t === '}' || t.t === '&' || (t.t === 'cmd' && (t.v === '\\' || t.v === 'end'))) {
      est.reg.avisar(oque + ' faltando', t ? t.pos : pos);
      return noErro('{?}');
    }
    var no = lerAtomo(est);
    if (!no) {
      est.reg.avisar(oque + ' faltando', pos);
      return noErro('{?}');
    }
    return no;
  }

  function lerGrupo(est) {
    var abre = est.comer();           // consome o {
    var dentro = lerLista(est, function (t) { return t.t === '}'; });
    est.pular();
    var t = est.olhar();
    if (!t) {
      est.reg.avisar('chave { aberta e nunca fechada', abre.pos);
      dentro.filhos.push(noErro('{?'));
    } else est.comer();               // consome o }
    return { tipo: 'grupo', lista: dentro };
  }

  /* O contador de fundo fica AQUI porque todo aninhamento passa por lerAtomo:
   * grupo, argumento de \frac, \left, \begin. O try/finally garante que ele
   * desce mesmo quando um ramo devolve no meio. */
  function lerAtomo(est) {
    est.prof++;
    try { return lerAtomoInterno(est); }
    finally { est.prof--; }
  }

  function lerAtomoInterno(est) {
    est.pular();
    var t = est.olhar();
    if (!t) return null;
    if (est.prof > FUNDO_MAXIMO) {
      if (!est.avisouFundo) {
        est.reg.avisar('formula aninhada fundo demais: mais de ' + FUNDO_MAXIMO +
          ' niveis, o resto foi descartado', t.pos);
        est.avisouFundo = true;
      }
      /* Descarta o que sobrou de uma vez. Consumir um token por vez aqui
       * encheria o registro de mil avisos de chave orfa, um por nivel. */
      est.i = est.toks.length;
      return noErro('fundo?');
    }
    if (t.t === 'reservado') {
      est.comer();
      est.reg.avisar('caractere reservado do LaTeX fora de lugar: ' + t.v +
        ' (' + RESERVADO[t.v] + ')', t.pos);
      return noErro(t.v + '?');
    }
    if (t.t === '{') return lerGrupo(est);
    if (t.t === '^' || t.t === '_') {
      est.comer();
      est.reg.avisar((t.t === '^' ? 'expoente' : 'indice') + ' sem nada antes', t.pos);
      lerArgumento(est, t.t === '^' ? 'expoente' : 'indice', t.pos);
      return noErro(t.t + '?');
    }
    if (t.t === '&') {
      est.comer();
      est.reg.avisar('& fora de matriz', t.pos);
      return noErro('&?');
    }
    if (t.t === 'erro') { est.comer(); return noErro('\\?'); }
    if (t.t === 'car') {
      est.comer();
      return { tipo: 'car', txt: t.v, classe: pega(CLASSE_CAR, t.v) || 'ord', pos: t.pos };
    }
    return lerComando(est);
  }

  /* Argumento que existe mas esta VAZIO.
   *
   * "1 + \frac{}{} + 2" desenhava um traco de 7 pontos na altura do eixo, que e
   * exatamente onde mora o sinal de menos: a folha saia com "1 + - + 2" e nada
   * avisava. O "\sqrt{}" desenhava um gancho atrofiado entre os dois mais. Os
   * dois viram selo, que e o que diz que ali faltou alguma coisa. */
  function vazio(no) {
    if (!no) return true;
    if (no.tipo === 'grupo') return vazio(no.lista);
    if (no.tipo === 'lista') return !(no.filhos && no.filhos.length);
    return false;
  }
  function seVazio(est, no, oque, pos) {
    if (!vazio(no)) return no;
    est.reg.avisar(oque + ' vazio', pos);
    return noErro('{}?');
  }

  function lerComando(est) {
    var t = est.comer();
    var nome = t.v;

    if (nome === 'frac' || nome === 'dfrac' || nome === 'tfrac' || nome === 'cfrac') {
      var num = lerArgumento(est, 'numerador de \\' + nome, t.pos);
      var den = lerArgumento(est, 'denominador de \\' + nome, t.pos);
      num = seVazio(est, num, 'numerador de \\' + nome, t.pos);
      den = seVazio(est, den, 'denominador de \\' + nome, t.pos);
      return { tipo: 'frac', num: num, den: den, pos: t.pos };
    }
    if (nome === 'sqrt') {
      var indice = null;
      est.pular();
      var p = est.olhar();
      if (p && p.t === 'car' && p.v === '[') {
        est.comer();
        indice = lerLista(est, function (x) { return x.t === 'car' && x.v === ']'; });
        est.pular();
        var fecha = est.olhar();
        if (!fecha) {
          est.reg.avisar('indice de raiz com [ que nunca fecha', p.pos);
          indice.filhos.push(noErro('[?'));
        } else est.comer();
      }
      var corpo = lerArgumento(est, 'radicando de \\sqrt', t.pos);
      corpo = seVazio(est, corpo, 'radicando de \\sqrt', t.pos);
      return { tipo: 'raiz', indice: indice, corpo: corpo, pos: t.pos };
    }
    if (nome === 'text' || nome === 'textrm' || nome === 'mathrm' || nome === 'mbox' ||
        nome === 'operatorname') {
      return lerTexto(est, t);
    }
    if (nome === 'left') return lerCerca(est, t);
    if (nome === 'right') {
      est.pular();
      if (est.olhar()) est.comer();   // engole o delimitador orfao
      est.reg.avisar('\\right sem \\left antes', t.pos);
      return noErro('\\right?');
    }
    if (nome === 'begin') return lerAmbiente(est, t);
    if (nome === 'end') {
      lerNomeDeAmbiente(est, t);
      est.reg.avisar('\\end sem \\begin antes', t.pos);
      return noErro('\\end?');
    }
    if (nome === '\\') {
      est.reg.avisar('quebra de linha \\\\ fora de matriz', t.pos);
      return noErro('\\\\?');
    }
    /* Daqui para baixo a chave vem da string do autor, entao toda consulta e de
     * propriedade PROPRIA: ver o comentario de pega(), la em cima. */
    var d = pega(OP_GRANDE, nome);
    if (d) {
      return { tipo: 'opGrande', nome: nome, glifo: d.glifo, rotulo: d.nome,
        cima: null, baixo: null, pos: t.pos };
    }
    var fn = pega(OP_NOME, nome);
    if (fn) return { tipo: 'opNome', txt: fn, pos: t.pos };
    var s = pega(SIMBOLO, nome);
    if (s) {
      return { tipo: 'simbolo', nome: nome, txt: s.txt, glifo: s.glifo,
        classe: s.classe, pos: t.pos };
    }
    var esp = pega(ESPACO_CMD, nome);
    if (esp !== undefined) {
      return { tipo: 'espaco', quanto: esp, pos: t.pos };
    }
    var ec = pega(ESCAPE, nome);
    if (ec) {
      return { tipo: 'car', txt: ec.txt, classe: ec.classe, pos: t.pos };
    }
    /* O ramo que nao pode ser silencioso. Um "\raizz{9}" digitado errado sairia
     * na folha como texto, com barra e chave, se este ramo devolvesse o bruto. */
    est.reg.avisar('comando desconhecido: ' + t.bruto, t.pos);
    return noErro(t.bruto + '?');
  }

  /* \text{...}: palavra dentro de formula. Le token a token porque aqui o
   * espaco digitado E conteudo, ao contrario do resto do modo matematico. */
  function lerTexto(est, t) {
    est.pular();
    var abre = est.olhar();
    if (!abre || abre.t !== '{') {
      est.reg.avisar('\\text sem { logo depois', t.pos);
      return noErro('\\text?');
    }
    est.comer();
    var partes = [], txt = '', prof = 0, fechou = false;
    function despejar() {
      if (!txt) return;
      partes.push({ tipo: 'texto', txt: txt, pos: t.pos });
      txt = '';
    }
    while (est.i < est.toks.length) {
      var k = est.comer();
      /* A chave dentro do \text agrupa e nao imprime, como no LaTeX. Imprimir
       * "{2}" na folha seria o defeito que este arquivo existe para impedir. */
      if (k.t === '{') { prof++; continue; }
      if (k.t === '}') {
        if (!prof) { fechou = true; break; }
        prof--; continue;
      }
      if (k.t === 'esp') { txt += ' '; continue; }
      if (k.t === 'car') { txt += k.v; continue; }
      if (k.t === 'reservado') {
        est.reg.avisar('caractere reservado do LaTeX dentro de \\text: ' + k.v +
          ' (' + RESERVADO[k.v] + ')', k.pos);
        despejar();
        partes.push(noErro(k.v + '?'));
        continue;
      }
      /* Consulta de propriedade propria, sempre. Com colchete cru,
       * "\text{a \constructor b}" fazia txt += ESCAPE['constructor'].txt, que e
       * o .txt da funcao Object, e a folha da aluna recebia a palavra literal
       * "a undefinedb". */
      var esc = k.t === 'cmd' ? pega(ESCAPE, k.v) : null;
      if (esc) { txt += esc.txt; continue; }
      var sim = k.t === 'cmd' ? pega(SIMBOLO, k.v) : null;
      if (sim && sim.txt) { txt += sim.txt; continue; }
      /* Formula dentro de \text nao vale: o \text e para palavra, e a palavra
       * e o que muda de lingua na folha em ingles. Some do texto, mas nao some
       * da folha: fica o selo no lugar exato de onde estava. */
      est.reg.avisar('dentro de \\text so cabe texto, e veio ' + (k.bruto || k.t), k.pos);
      despejar();
      /* O bruto do token de pontuacao existe desde o tokenizador, entao o "&" e
       * o "^" ganham selos diferentes: os dois saiam como "??" e quem olhava so
       * a folha nao sabia qual caractere tinha ofendido. */
      partes.push(noErro((k.bruto || k.t || '?') + '?'));
    }
    despejar();
    if (!fechou) {
      est.reg.avisar('\\text{ que nunca fecha', abre.pos);
      partes.push(noErro('\\text{?'));
    }
    if (partes.length === 1) return partes[0];
    return { tipo: 'lista', filhos: partes };
  }

  /* \left( ... \right) e as variantes com [ ] { } | */
  var DELIM = {
    '(': 'parenE', ')': 'parenD', '[': 'colcheteE', ']': 'colcheteD',
    '{': 'chaveE', '}': 'chaveD', '|': 'barra', '.': null,
    'lvert': 'barra', 'rvert': 'barra', 'vert': 'barra',
    'lbrace': 'chaveE', 'rbrace': 'chaveD',
    'langle': 'anguloE', 'rangle': 'anguloD'
  };

  function lerDelimitador(est, quem) {
    est.pular();
    var t = est.olhar();
    if (!t) {
      est.reg.avisar(quem + ' sem delimitador depois');
      return { falta: true, tipo: null };
    }
    var chave = (t.t === 'car' || t.t === 'cmd') ? t.v : null;
    /* Propriedade propria: o DELIM['.'] vale null de proposito (o "\left."
     * invisivel), entao a pergunta e se a tabela TEM a chave, e nao se o valor
     * e diferente de undefined. Com colchete cru, "\left\valueOf x \right\valueOf"
     * desenhava o x com os dois delimitadores sumidos e sem um aviso. */
    if (temNaTabela(DELIM, chave)) {
      est.comer();
      return { tipo: DELIM[chave], bruto: chave };
    }
    est.reg.avisar(quem + ' com delimitador que nao existe: ' +
      (t.bruto || t.v || t.t), t.pos);
    return { falta: true, tipo: null };
  }

  function lerCerca(est, t) {
    var esq = lerDelimitador(est, '\\left');
    var dentro = lerLista(est, function (k) { return k.t === 'cmd' && k.v === 'right'; });
    est.pular();
    var fim = est.olhar();
    var dir = { tipo: null };
    if (!fim) {
      est.reg.avisar('\\left sem o \\right que fecha', t.pos);
      dentro.filhos.push(noErro('\\right?'));
    } else {
      est.comer();
      dir = lerDelimitador(est, '\\right');
    }
    /* Delimitador que nao existe some da folha sem o selo: "\left# x \right#"
     * sairia como um "x" solto, e quem escreveu acharia que o parentese nao
     * cresceu. O "\left." continua invisivel de proposito, que e o que ele quer
     * dizer no LaTeX. */
    if (esq.falta) dentro.filhos.unshift(noErro('\\left?'));
    if (dir.falta) dentro.filhos.push(noErro('\\right?'));
    return { tipo: 'cerca', esq: esq.tipo, dir: dir.tipo, lista: dentro, pos: t.pos };
  }

  /* \begin{bmatrix} ... \end{bmatrix} */
  var AMBIENTE = {
    'matrix': { esq: null, dir: null },
    'bmatrix': { esq: 'colcheteE', dir: 'colcheteD' },
    'pmatrix': { esq: 'parenE', dir: 'parenD' },
    'vmatrix': { esq: 'barra', dir: 'barra' },
    'Vmatrix': { esq: 'barra', dir: 'barra' },
    'Bmatrix': { esq: 'chaveE', dir: 'chaveD' },
    /* O cases alinha pela ESQUERDA, e nao pelo centro como a matriz. E o que o
     * LaTeX faz, e num sistema de duas equacoes o alinhamento nao e enfeite: e
     * por ele que a aluna confere a conta, coluna por coluna. Centrado, o "x" da
     * segunda linha saia deslocado em relacao ao da primeira. */
    'cases': { esq: 'chaveE', dir: null, alinha: 'esq' }
  };

  /* Devolve null quando NAO havia "{ nome }" nenhum, e { nome, fechou } quando
   * havia. A diferenca entre "nao havia" e "havia mas nao fechou" e o que
   * faltava: com um null so, o "\end" pelado (sem o {nome}) era lido como
   * "fechou certo" e a matriz saia impecavel na folha, sem aviso e sem selo,
   * que era o unico defeito de ambiente que escapava inteiro. */
  function lerNomeDeAmbiente(est, t) {
    est.pular();
    var abre = est.olhar();
    if (!abre || abre.t !== '{') return null;
    est.comer();
    var nome = '';
    while (est.i < est.toks.length) {
      var k = est.comer();
      if (k.t === '}') return { nome: nome, fechou: true };
      if (k.t === 'esp') continue;
      /* O v de todo token, inclusive o do "_": sem ele o "small_matrix" virava
       * "smallmatrix" no aviso e no selo, e quem fosse procurar o nome digitado
       * no tema nao achava. */
      nome += (k.t === 'cmd' ? (k.bruto || '') : (k.v !== undefined ? k.v : ''));
    }
    est.reg.avisar('nome de ambiente com { que nunca fecha', t.pos);
    return { nome: nome, fechou: false };
  }

  /* As letras logo depois de um "\end" pelado formam o nome do ambiente aberto?
   * Se formam, engole; se nao, nao toca em nada. */
  function comerNomeSemChave(est, nome) {
    var i = est.i, lido = '';
    while (i < est.toks.length && lido.length < nome.length) {
      var k = est.toks[i];
      if (k.t !== 'car' && k.t !== '_') break;
      lido += k.v; i++;
    }
    if (lido !== nome) return false;
    est.i = i;
    return true;
  }

  function lerAmbiente(est, t) {
    var achado = lerNomeDeAmbiente(est, t);
    if (achado === null) {
      est.reg.avisar('\\begin sem { nome } depois', t.pos);
      return noErro('\\begin?');
    }
    var nome = achado.nome;
    /* O aviso da chave que nunca fecha ja saiu no leitor do nome, mas ele
     * sozinho nao bastava: a promessa e que todo defeito aparece em DOIS
     * lugares, o registro e a folha. Era o unico caso em que o aviso existia e
     * o selo nao, e ele e o erro de digitacao mais comum de todos. */
    var nomeAberto = !achado.fechou;
    var amb = pega(AMBIENTE, nome), desconhecido = false;
    if (!amb) {
      desconhecido = true;
      /* Ambiente que nao existe no subconjunto. O conteudo continua sendo lido e
       * desenhado como matriz sem delimitador, para a conta nao sumir da folha,
       * e o selo diz qual ambiente foi. */
      est.reg.avisar('ambiente fora do subconjunto: ' + nome +
        ', lido como matriz sem delimitador', t.pos);
      amb = AMBIENTE.matrix;
    }
    var linhas = [], atual = [], fechou = false, trocado = false;
    while (true) {
      var celula = lerLista(est, function (k) {
        return k.t === '&' || (k.t === 'cmd' && (k.v === '\\' || k.v === 'end'));
      });
      atual.push(celula);
      est.pular();
      var k2 = est.olhar();
      if (!k2) break;
      if (k2.t === '&') { est.comer(); continue; }
      if (k2.v === '\\') { est.comer(); linhas.push(atual); atual = []; continue; }
      // \end
      est.comer();
      var qual = lerNomeDeAmbiente(est, k2);
      fechou = true;
      if (qual === null) {
        /* "\end" pelado. Antes ele fechava o ambiente em silencio total.
         *
         * O caso irmao e "\end bmatrix", sem as chaves: o nome ficava no fluxo
         * de tokens e o outro lado do analisador o desenhava como PALAVRA ao
         * lado da matriz, em peso normal. Aqui ele e engolido, mas so quando as
         * letras seguintes sao exatamente o nome do ambiente aberto: em
         * "\end x + 1" o "x" continua sendo conta e nao pode sumir. */
        if (comerNomeSemChave(est, nome)) {
          est.reg.avisar('\\end{' + nome + '} escrito sem as chaves: escreva \\end{' +
            nome + '}', k2.pos);
        } else {
          est.reg.avisar('\\end sem o { nome } do ambiente: faltou escrever \\end{' +
            nome + '}', k2.pos);
        }
        trocado = true;
      } else if (!qual.fechou) {
        trocado = true;              // o aviso da chave aberta ja saiu
      } else if (qual.nome !== nome) {
        est.reg.avisar('\\begin{' + nome + '} fechado com \\end{' + qual.nome + '}', k2.pos);
        trocado = true;
      }
      break;
    }
    linhas.push(atual);
    if (!fechou) est.reg.avisar('\\begin{' + nome + '} sem o \\end{' + nome + '}', t.pos);
    /* Um "\\" antes do \end deixa uma linha vazia no fim, e no TeX ela nao
     * conta. Uma linha vazia no MEIO conta, e por isso a poda e so na ultima. */
    if (linhas.length > 1 && linhaVazia(linhas[linhas.length - 1])) linhas.pop();
    // linhas de tamanhos diferentes: completa e avisa, para a folha continuar legivel
    var colunas = 0, i;
    for (i = 0; i < linhas.length; i++) colunas = Math.max(colunas, linhas[i].length);
    for (i = 0; i < linhas.length; i++) {
      if (linhas[i].length === colunas) continue;
      est.reg.avisar('linha ' + (i + 1) + ' da matriz tem ' + linhas[i].length +
        ' celula(s) e a maior tem ' + colunas, t.pos);
      while (linhas[i].length < colunas) linhas[i].push({ tipo: 'lista', filhos: [noErro('?')] });
    }
    var no = { tipo: 'matriz', nome: nome, esq: amb.esq, dir: amb.dir,
      alinha: amb.alinha || 'centro',
      linhas: linhas, colunas: colunas, fechou: fechou, pos: t.pos };
    if (desconhecido) return comSelo(no, nome + '?', true);
    if (!fechou || trocado || nomeAberto) return comSelo(no, '\\end?');
    return no;
  }

  function linhaVazia(linha) {
    for (var i = 0; i < linha.length; i++) {
      if (linha[i].filhos && linha[i].filhos.length) return false;
    }
    return true;
  }

  /* ============================================================== a montagem
   *
   * O contexto carrega o corpo base, a profundidade de fracao e o nivel de
   * script. O corpo de cada pedaco sai dos dois:
   *
   *   - nivel de script: expoente e indice em 0.70 do corpo, e o segundo nivel
   *     em 0.55. Nao e composicao infinita: "2^{3^{4}}" para de encolher no
   *     segundo, senao o quatro sai com 3 pontos e ninguem le.
   *   - profundidade de fracao: a escada de estilo do TeX. A Regra 15a manda por
   *     o numerador "using style T or T' if C is D or D', otherwise using style
   *     C-up", ou seja, a primeira fracao mantem o corpo (display vira texto, e
   *     os dois valem 1) e da segunda em diante cai para script (0.7) e depois
   *     para scriptscript (0.5), que e onde para.
   *
   *     A tabela anterior era [1, 1, 0.78, 0.68], escolhida a mao, e saturava no
   *     indice 3: em "\frac{\frac{\frac{\frac{1}{2}}{3}}{4}}{5}" TRES niveis
   *     saiam com o mesmo corpo e sumia justamente a hierarquia que este
   *     comentario diz querer. Com a escada do TeX os corpos saem
   *     11 / 11 / 7.7 / 5.5 / 5.5. */
  var FATOR_SCRIPT = [1, 0.70, 0.55];
  var FATOR_FRACAO = [1, 1, 0.70, 0.50];
  var CORPO_MINIMO = 4.5;

  function tamDe(ctx) {
    var t = ctx.base *
      FATOR_SCRIPT[Math.min(ctx.nivel, FATOR_SCRIPT.length - 1)] *
      FATOR_FRACAO[Math.min(ctx.frac, FATOR_FRACAO.length - 1)];
    return Math.max(CORPO_MINIMO, t);
  }
  function comNivel(ctx) {
    return { base: ctx.base, nivel: Math.min(ctx.nivel + 1, 2), frac: ctx.frac,
      cor: ctx.cor, bold: ctx.bold, reg: ctx.reg };
  }
  function comFracao(ctx) {
    return { base: ctx.base, nivel: ctx.nivel, frac: ctx.frac + 1,
      cor: ctx.cor, bold: ctx.bold, reg: ctx.reg };
  }

  function montarLista(lista, ctx) {
    var nos = lista.filhos || [];
    var itens = [];
    for (var i = 0; i < nos.length; i++) {
      var m = montarNo(nos[i], ctx);
      if (m) itens.push(m);
    }
    return juntar(itens, ctx);
  }

  /* Junta os itens aplicando a tabela de espacamento e a regra do binario. */
  function juntar(itens, ctx) {
    var i;
    /* A regra do TeX que faz "-b" ficar colado e "a - b" ficar espacado: um
     * binario no comeco da lista, ou depois de outro binario, de relacao, de
     * operador, de abre-parentese ou de pontuacao, e na verdade um sinal, e
     * sinal nao leva folga. Sem ela o menos de "\frac{-b \pm ...}{2a}" ganharia
     * folga dos dois lados e a formula de Bhaskara sairia frouxa. */
    for (i = 0; i < itens.length; i++) {
      if (itens[i].classe !== 'bin') continue;
      var ant = null;
      for (var j = i - 1; j >= 0; j--) {
        if (itens[j].classe === 'esp') continue;
        ant = itens[j].classe; break;
      }
      var prox = null;
      for (var k = i + 1; k < itens.length; k++) {
        if (itens[k].classe === 'esp') continue;
        prox = itens[k].classe; break;
      }
      if (!ant || ant === 'bin' || ant === 'op' || ant === 'rel' ||
          ant === 'abre' || ant === 'pont' || !prox) {
        itens[i].classe = 'ord';
      }
    }
    var caixas = [], folgas = [];
    for (i = 0; i < itens.length; i++) {
      caixas.push(itens[i].caixa);
      if (i > 0) {
        var a = itens[i - 1].classe, b = itens[i].classe;
        folgas.push((a === 'esp' || b === 'esp') ? 0 : folgaEntre(a, b, ctx));
      }
    }
    return { caixa: hbox(caixas, folgas), classe: classeDaLista(itens) };
  }

  function classeDaLista(itens) {
    var uteis = [];
    for (var i = 0; i < itens.length; i++) if (itens[i].classe !== 'esp') uteis.push(itens[i]);
    if (uteis.length === 1) return uteis[0].classe;
    return 'ord';
  }

  function montarNo(no, ctx) {
    if (!no) return null;
    var tam = tamDe(ctx);
    switch (no.tipo) {
      case 'lista': return montarLista(no, ctx);
      case 'grupo': {
        var m = montarLista(no.lista, ctx);
        /* Um grupo e um atomo ordinario no TeX: "{a+b}c" nao vaza o espaco de
         * binario para fora das chaves. */
        return { caixa: m.caixa, classe: 'ord' };
      }
      case 'car':
        return { caixa: caixaTexto(no.txt, tam, ctx.bold, ctx.cor, ctx.reg), classe: no.classe };
      case 'texto':
        return { caixa: caixaTexto(no.txt, tam, ctx.bold, ctx.cor, ctx.reg), classe: 'ord' };
      case 'simbolo': return montarSimbolo(no, ctx, tam);
      case 'espaco':
        return { caixa: caixaVazia(no.quanto * tam), classe: 'esp' };
      case 'erro':
        return { caixa: caixaSelo(no.codigo, tam, ctx.reg), classe: 'ord' };
      case 'frac': return montarFracao(no, ctx, tam);
      case 'raiz': return montarRaiz(no, ctx, tam);
      case 'nivel': return montarNivel(no, ctx, tam);
      case 'opGrande': return montarOpGrande(no, ctx, tam);
      case 'opNome':
        return { caixa: caixaTexto(no.txt, tam, ctx.bold, ctx.cor, ctx.reg), classe: 'op' };
      case 'cerca': return montarCerca(no, ctx, tam);
      case 'matriz': return montarMatriz(no, ctx, tam);
    }
    ctx.reg.avisar('no de tipo desconhecido na arvore: ' + no.tipo);
    return { caixa: caixaSelo('?', tam, ctx.reg), classe: 'ord' };
  }

  function montarSimbolo(no, ctx, tam) {
    if (no.txt) {
      return { caixa: caixaTexto(no.txt, tam, ctx.bold, ctx.cor, ctx.reg), classe: no.classe };
    }
    var f = GLIFO[no.glifo];
    if (!f) {
      /* Terceiro caso da promessa 2: sem fonte e sem desenho, avisa. Nenhum
       * simbolo da tabela cai aqui hoje; o ramo existe para o dia em que alguem
       * acrescentar um nome a tabela e esquecer o desenho. */
      ctx.reg.avisar('simbolo sem glifo na fonte e sem desenho: \\' + no.nome, no.pos);
      return { caixa: caixaSelo('\\' + no.nome + '?', tam, ctx.reg), classe: no.classe };
    }
    return { caixa: f(tam, ctx.cor), classe: no.classe };
  }

  /* A fracao empilhada, que e o caso que a fonte nao resolve. O numerador sobe,
   * o denominador desce, e a barra fica na altura do eixo, que e onde o sinal de
   * igual passa: e por isso que a fracao "parece" centrada ao lado do igual. */
  function montarFracao(no, ctx, tam) {
    var interno = comFracao(ctx);
    var num = montarNo(no.num, interno).caixa;
    var den = montarNo(no.den, interno).caixa;
    var eixo = tam * EIXO;
    var traco = regra(tam);
    /* Regra 15a: a barra tem EXATAMENTE a largura do maior dos dois andares. A
     * folga lateral e o \nulldelimiterspace do TeX e fica FORA da barra.
     *
     * Antes a beirada era 0.30 do corpo de cada lado e a barra ia de ponta a
     * ponta: "\frac{1}{2}" em corpo 16 desenhava 16.58 pontos de barra sobre
     * 8.90 de conteudo, 86 por cento a mais. Numa soma de fracoes a barra
     * comprida encosta na fracao seguinte e a folha fica com cara de erro. */
    var conteudo = Math.max(num.largura, den.largura);
    var beirada = tam * SIGMA.nulo;
    var larg = conteudo + beirada * 2;
    /* Regra 15b: a subida e a descida saem de num1/denom1 (display) ou
     * num2/denom2, e so DEPOIS a 15d confere a folga minima contra a barra. E
     * assimetrico de proposito: no TeX o numerador fica mais longe da barra do
     * que o denominador, e era essa assimetria que faltava. A conta antiga usava
     * 0.20 do corpo fixo dos dois lados, e o numerador ficava 33 por cento mais
     * baixo do que no TeX.
     *
     * Display so vale para a fracao de FORA: no TeX o numerador de uma fracao
     * display ja esta em estilo de texto, e fracao em estilo de texto usa
     * num2/denom2, que sao os valores apertados. */
    var display = (ctx.nivel === 0 && ctx.frac === 0);
    var sobe = tam * (display ? SIGMA.num1 : SIGMA.num2);
    var desce = tam * (display ? SIGMA.denom1 : SIGMA.denom2);
    var minima = display ? traco * 3 : traco;
    var vaoCima = (sobe - num.profundidade) - (eixo + traco / 2);
    if (vaoCima < minima) sobe += minima - vaoCima;
    var vaoBaixo = (eixo - traco / 2) - (den.altura - desce);
    if (vaoBaixo < minima) desce += minima - vaoBaixo;
    var alt = sobe + num.altura;
    var prof = desce + den.profundidade;
    var c = ctx.cor;
    return {
      classe: 'inner',
      caixa: caixa(larg, alt, prof, function (doc, x, y) {
        var meio = y + eixo, x0 = x + beirada;
        doc.linha(x0, meio, x0 + conteudo, meio, c, traco);
        num.desenhar(doc, x0 + (conteudo - num.largura) / 2, y + sobe);
        den.desenhar(doc, x0 + (conteudo - den.largura) / 2, y - desce);
      })
    };
  }

  /* A raiz COM a barra sobre o radicando, que e o que o glifo da fonte nao tem:
   * a /Symbol desenha o gancho, mas a barra tem largura fixa e nao cobre nem
   * "b^2 - 4ac" nem uma fracao. Aqui o gancho e desenhado e a barra se estende
   * pela largura do que estiver dentro, qualquer que seja. */
  function montarRaiz(no, ctx, tam) {
    var dentro = montarNo(no.corpo, ctx).caixa;
    var folgaCima = Math.max(1.6, tam * 0.16);
    var traco = regra(tam);
    var alt = dentro.altura + folgaCima + traco;
    var prof = dentro.profundidade;
    /* O V engorda com a altura do radicando.
     *
     * Com largura fixa em 0.60 do corpo o gancho virava uma espicula: em
     * "\sqrt{\frac{\frac{1}{2}}{\frac{3}{4}}}" a razao altura sobre largura ia a
     * 9.75, contra 2.50 de um "\sqrt{2}", e na folha o V lia como um risco
     * vertical. No TeX o radical e glifo extensivel de uma familia de tamanhos e
     * a largura cresce junto. O crescimento e limitado em 1.15 do corpo: sem o
     * teto, uma raiz de fracao de fracao ganharia um gancho de dedo de largura e
     * empurraria o radicando para longe. */
    var largGancho = Math.max(tam * 0.60, Math.min(tam * 1.60, (alt + prof) * 0.36));
    var indice = null, largIndice = 0;
    if (no.indice) {
      var ctxI = { base: ctx.base, nivel: 2, frac: ctx.frac, cor: ctx.cor,
        bold: ctx.bold, reg: ctx.reg };
      indice = montarLista(no.indice, ctxI).caixa;
      largIndice = indice.largura + tam * 0.06;
    }
    var larg = largIndice + largGancho + dentro.largura + tam * 0.20;
    var c = ctx.cor;
    /* O indice da raiz cubica pode ser mais alto do que a propria barra quando o
     * radicando e baixo: "\sqrt[3]{8}" tem o tres acima do topo do gancho. A
     * altura da caixa tem que contar com ele, senao a linha de cima encosta. */
    var altCaixa = Math.max(alt, indice ? tam * 0.34 + indice.altura : 0);
    /* A tinta e pintada METADE para cada lado da linha de centro do traco, e a
     * caixa nao contava essa metade: a barra da raiz vazava 0.37 ponto acima e a
     * direita do que medir() prometia, e duas formulas coladas encostavam. */
    var meiaPena = Math.max(traco, espessura(tam) * 0.9) / 2;
    return {
      classe: 'ord',
      /* A meia pena entra nos DOIS lados: a ponta de baixo do gancho fica
       * exatamente na borda esquerda da caixa, e a tinta dela vazava para fora
       * pela esquerda do mesmo jeito que a barra vazava pela direita. */
      caixa: caixa(larg + meiaPena * 2, altCaixa + meiaPena, prof, function (doc, xe, y) {
        var x = xe + meiaPena;
        var topo = y + alt, base = y - prof, H = alt + prof;
        var g = x + largIndice;
        var e = espessura(tam);
        /* O gancho e a barra sao dois tracos, e nao um so, porque tem pesos
         * diferentes: no TeX a barra da raiz e a mesma default_rule_thickness da
         * barra da fracao, e o glifo do radical e mais pesado que ela. Desenhados
         * juntos, numa fracao com raiz no numerador apareciam duas linhas
         * horizontais empilhadas, a de cima 22 por cento mais grossa. */
        tracar(doc, [[g, base + H * 0.42], [g + largGancho * 0.30, base + H * 0.04],
                     [g + largGancho * 0.60, topo]], c, e * 0.9);
        tracar(doc, [[g + largGancho * 0.58, topo], [x + larg, topo]], c, traco);
        if (indice) indice.desenhar(doc, x, y + tam * 0.34);
        dentro.desenhar(doc, g + largGancho, y);
      })
    };
  }

  /* A base do expoente e um CARACTERE, ou uma caixa?
   *
   * A pergunta parece de detalhe e nao e: dela sai a Regra 18a do Appendix G,
   * que diz, literalmente, "If the translation of the nucleus is a character
   * box, possibly followed by a kern, set u and v equal to zero". Quer dizer que
   * para base que e letra o deslocamento NAO olha a altura do glifo, e por isso
   * os tres "2" de "a^2 + b^2 = c^2" saem todos na mesma linha.
   *
   * A implementacao anterior usava a regra da base que e caixa para tudo, entao
   * o expoente de "b" (letra alta) subia 0.42 ponto a mais que o de "a" e o de
   * "c": um degrau de 9.5 por cento no meio da identidade de Pitagoras. No
   * indice era pior, 73 por cento entre "a_1" e "p_1", porque a perna do "p"
   * empurrava o um para baixo.
   *
   * O grupo de um elemento so conta como caractere, o que e um desvio consciente
   * do TeX: quem escreve "{a}^{2}" no tema quer o mesmo resultado de "a^{2}", e
   * ninguem entenderia um degrau nascido de um par de chaves. */
  function baseEhCaractere(no) {
    if (!no) return false;
    if (no.tipo === 'car' || no.tipo === 'texto' || no.tipo === 'simbolo' ||
        no.tipo === 'opNome') return true;
    if (no.tipo === 'grupo') return baseEhCaractere(no.lista);
    if (no.tipo === 'lista') {
      return !!(no.filhos && no.filhos.length === 1 && baseEhCaractere(no.filhos[0]));
    }
    return false;
  }

  /* Expoente e indice: a mesma caixa, em corpo menor, deslocada. Os dois vao no
   * mesmo x, empilhados, e quando aparecem juntos o afastamento cresce para o
   * "2" de cima nao encostar no "1" de baixo. */
  function montarNivel(no, ctx, tam) {
    var base = montarNo(no.base, ctx);
    var filho = comNivel(ctx);
    var cima = no.cima ? montarNo(no.cima, filho).caixa : null;
    var baixo = no.baixo ? montarNo(no.baixo, filho).caixa : null;
    var b = base.caixa;
    var xh = tam * X_ALTURA;
    var car = baseEhCaractere(no.base);
    // Regra 18a: base que e caractere nao contribui com u nem com v
    var u = car ? 0 : Math.max(0, b.altura - tam * SIGMA.supDrop);
    var v = car ? 0 : Math.max(0, b.profundidade + tam * SIGMA.subDrop);
    var padraoCima = tam * (ctx.nivel === 0 ? SIGMA.sup1 : SIGMA.sup2);
    var sobe = 0, desce = 0;
    // Regra 18c: o expoente nunca desce abaixo de um quarto da altura do "x"
    if (cima) sobe = Math.max(u, padraoCima, cima.profundidade + xh * 0.25);
    // Regra 18b: o indice sozinho nao sobe acima de quatro quintos dessa altura
    if (baixo && !cima) desce = Math.max(v, tam * SIGMA.sub1, baixo.altura - xh * 0.8);
    else if (baixo) desce = Math.max(v, tam * SIGMA.sub2);
    if (cima && baixo) {
      /* Regra 18e: os dois juntos guardam quatro espessuras de regra entre a
       * barriga do de cima e o topo do de baixo, senao "x_{1}^{2}" sai colado.
       * O acerto vai primeiro todo para o indice, e so depois o expoente sobe,
       * que e a ordem do TeX. */
      var minimo = 4 * regra(tam);
      var vao = (sobe - cima.profundidade) - (baixo.altura - desce);
      if (vao < minimo) {
        desce += minimo - vao;
        var psi = xh * 0.8 - (sobe - cima.profundidade);
        if (psi > 0) { sobe += psi; desce -= psi; }
      }
    }
    var extra = Math.max(cima ? cima.largura : 0, baixo ? baixo.largura : 0);
    var folga = tam * 0.05;
    return {
      classe: base.classe,
      caixa: caixa(b.largura + folga + extra,
        Math.max(b.altura, cima ? sobe + cima.altura : 0),
        Math.max(b.profundidade, baixo ? desce + baixo.profundidade : 0),
        function (doc, x, y) {
          b.desenhar(doc, x, y);
          var px = x + b.largura + folga;
          if (cima) cima.desenhar(doc, px, y + sobe);
          if (baixo) baixo.desenhar(doc, px, y - desce);
        })
    };
  }

  /* Operador grande com limite em cima e embaixo: somatorio, produtorio,
   * integral, limite. O sinal fica no meio e os limites centrados nele.
   *
   * A integral com limite em cima e embaixo e escolha do subconjunto, escrita no
   * pedido: em livro de calculo ela sai do lado, mas aqui o material e de
   * escola e a forma empilhada e a que a professora usa no quadro. */
  function montarOpGrande(no, ctx, tam) {
    var sinal;
    if (no.glifo) sinal = GLIFO[no.glifo](tam, ctx.cor);
    else sinal = caixaTexto(no.rotulo || no.nome, tam, ctx.bold, ctx.cor, ctx.reg);
    var filho = comNivel(ctx);
    var cima = no.cima ? montarNo(no.cima, filho).caixa : null;
    var baixo = no.baixo ? montarNo(no.baixo, filho).caixa : null;
    /* Regra 13: a folga entre o sinal e o limite nao e fixa. Ela e
     * max(xi9, xi11 - d(limite)) em cima e max(xi10, xi12 - h(limite)) embaixo,
     * mais um respiro de xi13 nas duas pontas. Com a folga fixa em 0.16 do corpo
     * o "n" de "\sum_{k=1}^{n}" ficava a 1.76 ponto do topo do sigma em corpo
     * 11, 20 por cento abaixo do minimo do TeX, e na folha ele encostava. */
    var folgaC = cima ? Math.max(tam * XI.op1, tam * XI.op3 - cima.profundidade) : 0;
    var folgaB = baixo ? Math.max(tam * XI.op2, tam * XI.op4 - baixo.altura) : 0;
    var respiro = tam * XI.op5;
    var larg = Math.max(sinal.largura, cima ? cima.largura : 0, baixo ? baixo.largura : 0);
    return {
      classe: 'op',
      caixa: caixa(larg + tam * 0.16,
        sinal.altura + (cima ? folgaC + cima.altura + cima.profundidade + respiro : 0),
        sinal.profundidade + (baixo ? folgaB + baixo.altura + baixo.profundidade + respiro : 0),
        function (doc, x, y) {
          var x0 = x + tam * 0.08;
          sinal.desenhar(doc, x0 + (larg - sinal.largura) / 2, y);
          if (cima) {
            cima.desenhar(doc, x0 + (larg - cima.largura) / 2,
              y + sinal.altura + folgaC + cima.profundidade);
          }
          if (baixo) {
            baixo.desenhar(doc, x0 + (larg - baixo.largura) / 2,
              y - sinal.profundidade - folgaB - baixo.altura);
          }
        })
    };
  }

  /* ================================== delimitadores que crescem
   *
   * Todos sao desenhados, e nao escritos com o glifo da fonte, porque o glifo
   * tem altura fixa: um parentese de fonte em volta de uma fracao sobra por
   * dentro e falta por fora. Eles sao centrados no eixo, como no TeX. */
  function pintarDelim(tipo, doc, x, meio, metade, larg, tam, c) {
    var topo = meio + metade, base = meio - metade;
    var e = espessura(tam) * 0.95;
    var n = Math.max(8, Math.round(metade / 2));
    if (tipo === 'parenE') {
      tracar(doc, qbez([x + larg * 0.82, topo], [x - larg * 0.30, meio],
        [x + larg * 0.82, base], n * 2), c, e);
    } else if (tipo === 'parenD') {
      tracar(doc, qbez([x + larg * 0.18, topo], [x + larg * 1.30, meio],
        [x + larg * 0.18, base], n * 2), c, e);
    } else if (tipo === 'colcheteE') {
      tracar(doc, [[x + larg * 0.85, topo], [x + larg * 0.22, topo],
                   [x + larg * 0.22, base], [x + larg * 0.85, base]], c, e);
    } else if (tipo === 'colcheteD') {
      tracar(doc, [[x + larg * 0.15, topo], [x + larg * 0.78, topo],
                   [x + larg * 0.78, base], [x + larg * 0.15, base]], c, e);
    } else if (tipo === 'chaveE' || tipo === 'chaveD') {
      var s = tipo === 'chaveE' ? 1 : -1;
      var xr = tipo === 'chaveE' ? x + larg * 0.92 : x + larg * 0.08;
      var xm = xr - s * larg * 0.42;
      var xp = xr - s * larg * 0.84;
      var q = Math.min(metade * 0.35, tam * 0.55);
      tracar(doc, junta(
        qbez([xr, topo], [xm, topo], [xm, topo - q], 6),
        [[xm, meio + q]],
        qbez([xm, meio + q], [xm, meio], [xp, meio], 6),
        qbez([xp, meio], [xm, meio], [xm, meio - q], 6),
        [[xm, base + q]],
        qbez([xm, base + q], [xm, base], [xr, base], 6)), c, e);
    } else if (tipo === 'anguloE') {
      tracar(doc, [[x + larg * 0.85, topo], [x + larg * 0.15, meio],
                   [x + larg * 0.85, base]], c, e);
    } else if (tipo === 'anguloD') {
      tracar(doc, [[x + larg * 0.15, topo], [x + larg * 0.85, meio],
                   [x + larg * 0.15, base]], c, e);
    } else if (tipo === 'barra') {
      tracar(doc, [[x + larg * 0.5, topo], [x + larg * 0.5, base]], c, e);
    }
  }

  function larguraDelim(tipo, metade, tam) {
    if (!tipo) return 0;
    if (tipo === 'barra') return tam * 0.30;
    if (tipo === 'anguloE' || tipo === 'anguloD') return tam * 0.34 + metade * 0.10;
    if (tipo === 'colcheteE' || tipo === 'colcheteD') return tam * 0.32;
    if (tipo === 'chaveE' || tipo === 'chaveD') return tam * 0.42 + metade * 0.04;
    return tam * 0.30 + metade * 0.10;    // parentese engorda com a altura
  }

  /* O caractere da fonte que corresponde a cada delimitador desenhado.
   *
   * No TeX o "\left(" em volta de conteudo pequeno devolve EXATAMENTE o
   * parentese de tamanho normal, e so troca por um glifo maior quando o
   * conteudo nao cabe. Aqui ele era sempre desenhado, com piso de altura, e
   * "\left( x \right)" saia com um parentese de peso uniforme e 5 por cento mais
   * alto que o "(x)" da linha de cima: dava para ver os dois na mesma folha.
   * O angulo nao entra na tabela porque a Helvetica nao tem o glifo. */
  var DELIM_FONTE = {
    parenE: '(', parenD: ')', colcheteE: '[', colcheteD: ']',
    chaveE: '{', chaveD: '}', barra: '|'
  };

  /* Ate onde o glifo da fonte cobre, medido do eixo para os dois lados. */
  function alcanceDoGlifo(tipo, tam, eixo) {
    var ch = pega(DELIM_FONTE, tipo);
    if (!ch) return null;
    var m = metricaTexto(ch, tam);
    return { ch: ch, meia: Math.max(m.altura - eixo, m.profundidade + eixo) };
  }

  /* Envolve uma caixa qualquer com os delimitadores, centrados no eixo. */
  function cercar(dentro, esq, dir, ctx, tam) {
    var eixo = tam * EIXO;
    var c = ctx.cor;
    var precisa = Math.max(dentro.altura - eixo, dentro.profundidade + eixo);
    /* Cabe no glifo da fonte? So vale quando os DOIS lados cabem: um parentese
     * de fonte fechando um colchete desenhado sairia com dois pesos na mesma
     * expressao, que e pior do que os dois desenhados. */
    var ge = esq ? alcanceDoGlifo(esq, tam, eixo) : { ch: '', meia: Infinity };
    var gd = dir ? alcanceDoGlifo(dir, tam, eixo) : { ch: '', meia: Infinity };
    if (ge && gd && precisa <= Math.min(ge.meia, gd.meia)) {
      var pecas = [];
      if (esq) pecas.push(caixaTexto(ge.ch, tam, ctx.bold, c, ctx.reg));
      pecas.push(dentro);
      if (dir) pecas.push(caixaTexto(gd.ch, tam, ctx.bold, c, ctx.reg));
      return hbox(pecas, null);
    }
    var metade = Math.max(precisa, tam * 0.42) + tam * 0.10;
    var le = larguraDelim(esq, metade, tam);
    var ld = larguraDelim(dir, metade, tam);
    var larg = le + dentro.largura + ld;
    /* Meia espessura de pena de cada lado: o traco e pintado centrado na linha
     * que pintarDelim recebe, e topo e base sao exatamente a borda da caixa.
     * Sem esta sobra a tinta passava 0.39 ponto para fora do que medir() dizia. */
    var meiaPena = espessura(tam) * 0.95 / 2;
    return caixa(larg, eixo + metade + meiaPena, metade - eixo + meiaPena,
      function (doc, x, y) {
        var meio = y + eixo;
        if (esq) pintarDelim(esq, doc, x, meio, metade, le, tam, c);
        dentro.desenhar(doc, x + le, y);
        if (dir) pintarDelim(dir, doc, x + le + dentro.largura, meio, metade, ld, tam, c);
      });
  }

  function montarCerca(no, ctx, tam) {
    var dentro = montarLista(no.lista, ctx).caixa;
    return { caixa: cercar(dentro, no.esq, no.dir, ctx, tam), classe: 'inner' };
  }

  /* Matriz.
   *
   * A altura de cada linha e medida de verdade, e nao um salto fixo como no
   * prototipo: com salto fixo uma celula com fracao invade a linha de cima. E o
   * caso "matriz com fracao dentro de celula" da folha de prova. */
  function montarMatriz(no, ctx, tam) {
    var linhas = [], i, j;
    for (i = 0; i < no.linhas.length; i++) {
      var linha = [];
      for (j = 0; j < no.linhas[i].length; j++) {
        linha.push(montarLista(no.linhas[i][j], ctx).caixa);
      }
      linhas.push(linha);
    }
    var colunas = no.colunas || 0;
    var largCol = [];
    for (j = 0; j < colunas; j++) {
      var w = 0;
      for (i = 0; i < linhas.length; i++) {
        if (linhas[i][j] && linhas[i][j].largura > w) w = linhas[i][j].largura;
      }
      largCol.push(w);
    }
    var vaoCol = tam * 0.70, vaoLinha = tam * 0.42;
    var altLinha = [], profLinha = [];
    for (i = 0; i < linhas.length; i++) {
      var a = tam * 0.30, p = tam * 0.10;
      for (j = 0; j < linhas[i].length; j++) {
        if (linhas[i][j].altura > a) a = linhas[i][j].altura;
        if (linhas[i][j].profundidade > p) p = linhas[i][j].profundidade;
      }
      altLinha.push(a); profLinha.push(p);
    }
    var largTotal = 0;
    for (j = 0; j < colunas; j++) largTotal += largCol[j];
    largTotal += vaoCol * Math.max(0, colunas - 1) + tam * 0.30;
    var altTotal = 0;
    for (i = 0; i < linhas.length; i++) altTotal += altLinha[i] + profLinha[i];
    altTotal += vaoLinha * Math.max(0, linhas.length - 1);
    var meia = altTotal / 2;
    var eixo = tam * EIXO;
    var esquerda = no.alinha === 'esq';
    var corpo = caixa(largTotal, eixo + meia, meia - eixo, function (doc, x, y) {
      var meio = y + eixo;
      var topo = meio + meia;
      var py = topo;
      for (var a2 = 0; a2 < linhas.length; a2++) {
        py -= altLinha[a2];
        var px = x + tam * 0.15;
        for (var b2 = 0; b2 < colunas; b2++) {
          var cel = linhas[a2][b2];
          if (cel) cel.desenhar(doc, px + (esquerda ? 0 : (largCol[b2] - cel.largura) / 2), py);
          px += largCol[b2] + vaoCol;
        }
        py -= profLinha[a2] + vaoLinha;
      }
    });
    return { caixa: cercar(corpo, no.esq, no.dir, ctx, tam), classe: 'inner' };
  }

  /* ================================================================== a API */

  function analisar(latex) {
    var reg = new Registro(latex);
    var arvore = arvoreCom(latex, reg);
    arvore.avisos = reg.avisos;
    arvore.fonte = reg.fonte;
    return arvore;
  }

  function arvoreCom(latex, reg) {
    var s = String(latex == null ? '' : latex);
    var est = new Est(tokenizar(s, reg), reg);
    var arvore = lerLista(est, null);
    return arvore;
  }

  var CORPO_PADRAO = 11;

  /* O corpo pedido, conferido.
   *
   * "base: tam || 11" salvava 0, null e NaN e deixava passar a STRING: tamDe()
   * multiplicava e devolvia NaN, que descia ate doc.linha e saia escrito dentro
   * do fluxo de conteudo do PDF como "NaN NaN m", que nao e operando valido de
   * PDF nenhum. E corpo negativo caia no CORPO_MINIMO e imprimia miudo, calado. */
  function corpoValido(tam, reg) {
    if (tam === undefined || tam === null) return CORPO_PADRAO;
    if (typeof tam !== 'number' || !isFinite(tam) || tam <= 0) {
      reg.avisar('corpo invalido para a formula: ' + eco(String(tam)) +
        ', usando ' + CORPO_PADRAO);
      return CORPO_PADRAO;
    }
    return tam;
  }

  /* A formula em si, conferida antes de virar texto na folha.
   *
   * String(objeto) da "[object Object]", e a Helvetica desenha os colchetes e as
   * letras: a trava de caractere aprovava e a folha da aluna recebia a palavra.
   * O numero e o mesmo caso. Nao virar nada tambem e defeito: uma formula
   * ausente some da folha sem deixar rastro. */
  function fonteValida(latex, reg) {
    if (typeof latex === 'string') return latex;
    if (latex === null || latex === undefined) {
      reg.avisar('formula ausente: veio ' + (latex === null ? 'null' : 'undefined'));
      return '';
    }
    reg.avisar('formula que nao e texto: veio ' + (typeof latex) +
      ', lido como "' + eco(String(latex)) + '"');
    return String(latex);
  }

  function contexto(tam, opcoes, reg) {
    opcoes = opcoes || {};
    return {
      base: tam,
      nivel: 0,
      frac: 0,
      cor: opcoes.cor || cor('texto'),
      bold: !!opcoes.bold,
      reg: reg
    };
  }

  /* ============================================== a formula cabe na folha?
   *
   * Este arquivo nao tinha nocao nenhuma de pagina, e o comentario de medir()
   * dizia que a medida existe "para quebrar linha e para centralizar, sem ela a
   * formula estoura a margem": ninguem comparava a largura com coisa nenhuma.
   * Uma Bhaskara desenvolvida media 600.9 pontos contra 515.3 de coluna util e
   * saia cortada pela borda do papel, com zero avisos. Centralizada era pior,
   * comecava em x negativo, fora da folha pelos dois lados.
   *
   * O limite vem do gerador, e nao de constante repetida aqui. Quem desenha
   * dentro de uma caixa mais estreita passa opcoes.larguraMaxima. */
  function larguraLimite(opcoes) {
    /* Quem passa larguraMaxima manda: um numero positivo e a caixa dele, e
     * qualquer outra coisa (0, null) desliga a conferencia. O desligamento
     * existe para quem JA confere a largura por conta propria, como o
     * Doc.equacao do pdf.js: dois avisos dizendo a mesma coisa viram ruido e
     * ninguem le nenhum dos dois. */
    if (temPropria.call(opcoes, 'larguraMaxima')) {
      var l = opcoes.larguraMaxima;
      return (typeof l === 'number' && l > 0) ? l : 0;
    }
    var g = gerador();
    return (g && typeof g.UTIL === 'number') ? g.UTIL : 0;
  }

  function conferirLargura(largura, opcoes, reg) {
    var lim = larguraLimite(opcoes);
    if (!lim || largura <= lim + 0.01) return;
    reg.avisar('a formula nao cabe na largura disponivel: ' + largura.toFixed(1) +
      ' pontos contra ' + lim.toFixed(1) + '. Quebre em duas linhas, ' +
      'reduza o corpo ou passe opcoes.larguraMaxima');
  }

  /* A mesma pergunta na vertical, e so em desenhar(), que e quem conhece o y.
   * Uma matriz 4x3 com fracao mede 114 pontos de altura: desenhada a 30 pontos
   * do fim do conteudo, ela atravessava o fio do rodape e escorria para fora da
   * folha, tambem sem aviso. Quem chama reserva com doc.garanteEspaco(altura +
   * profundidade) ANTES, e este aviso e a rede que pega quem esqueceu. */
  function conferirAltura(y, alt, prof, opcoes, reg) {
    var g = gerador();
    var baixo = typeof opcoes.limiteBaixo === 'number' ? opcoes.limiteBaixo
      : (g && typeof g.Y_LIMITE === 'number' ? g.Y_LIMITE : null);
    var alto = typeof opcoes.limiteAlto === 'number' ? opcoes.limiteAlto
      : (g && typeof g.Y_TOPO === 'number' ? g.Y_TOPO : null);
    if (baixo !== null && y - prof < baixo - 0.01) {
      reg.avisar('a formula passa do fim do conteudo da pagina: o fundo dela cai em ' +
        (y - prof).toFixed(1) + ' e a pagina acaba em ' + baixo.toFixed(1) +
        '. Reserve altura + profundidade antes de desenhar');
    }
    if (alto !== null && y + alt > alto + 0.01) {
      reg.avisar('a formula passa do topo do conteudo da pagina: o topo dela sobe a ' +
        (y + alt).toFixed(1) + ' e o conteudo comeca em ' + alto.toFixed(1));
    }
  }

  /* Monta a caixa e devolve tudo o que quem chama precisa. E o unico caminho:
   * medir() e desenhar() passam por aqui, entao a largura medida e a largura
   * desenhada por construcao, e nao por coincidencia. */
  function montar(latex, tam, opcoes) {
    opcoes = opcoes || {};
    var reg = new Registro(typeof latex === 'string' ? latex : '');
    reg.doc = opcoes.doc || null;
    if (!gerador()) reg.avisar('gerador de PDF ausente: a formula nao pode ser medida');
    var fonte = fonteValida(latex, reg);
    reg.fonte = fonte;
    var corpo = corpoValido(tam, reg);
    var c, arvore;
    /* A rede de baixo.
     *
     * O analisador ja tem o FUNDO_MAXIMO e nao deveria mais estourar a pilha,
     * mas a promessa deste arquivo e que formula torta vira SELO, e nunca
     * excecao: um RangeError escapando por aqui derrubava a geracao da folha
     * inteira, e nao so aquela conta. Se algum dia sobrar um caminho que ninguem
     * previu, ele sai como aviso mais selo, e a folha continua saindo. */
    try {
      arvore = arvoreCom(fonte, reg);
      c = montarLista(arvore, contexto(corpo, opcoes, reg)).caixa;
    } catch (e) {
      reg.avisar('a formula nao pode ser montada: ' + eco(e && e.message ? e.message : String(e)));
      arvore = { tipo: 'lista', filhos: [] };
      c = caixaSelo('formula?', corpo, null);
    }
    conferirLargura(c.largura, opcoes, reg);
    return {
      largura: c.largura, altura: c.altura, profundidade: c.profundidade,
      avisos: reg.avisos, arvore: arvore, caixa: c, registro: reg,
      desenhar: function (doc, x, y) { c.desenhar(doc, x, y); return this; }
    };
  }

  /* A medida, separada de proposito: quem chama precisa da largura ANTES de
   * desenhar, para quebrar linha e para centralizar. Sem ela a formula estoura a
   * margem, e no papel isso aparece como conta cortada no meio. */
  function medir(latex, tam, opcoes) {
    var r = montar(latex, tam, opcoes);
    return { largura: r.largura, altura: r.altura, profundidade: r.profundidade,
      avisos: r.avisos };
  }

  /* A pergunta que quem gera a folha faz ANTES de desenhar: cabe no que sobrou
   * da pagina? Ela existe porque a alternativa era o chamador lembrar sozinho de
   * somar altura mais profundidade, e quem esquece descobre no papel. */
  function cabe(doc, latex, tam, opcoes) {
    opcoes = opcoes || {};
    var g = gerador();
    var r = montar(latex, tam, opcoes);
    var baixo = typeof opcoes.limiteBaixo === 'number' ? opcoes.limiteBaixo
      : (g && typeof g.Y_LIMITE === 'number' ? g.Y_LIMITE : 0);
    var sobra = (doc && typeof doc.y === 'number') ? doc.y - baixo : Infinity;
    var lim = larguraLimite(opcoes);
    return {
      cabe: (r.altura + r.profundidade <= sobra) && (!lim || r.largura <= lim + 0.01),
      altura: r.altura, profundidade: r.profundidade, largura: r.largura,
      precisa: r.altura + r.profundidade, sobra: sobra, avisos: r.avisos
    };
  }

  function desenhar(doc, latex, x, y, tam, opcoes) {
    opcoes = opcoes || {};
    var op = {};
    for (var k in opcoes) if (Object.prototype.hasOwnProperty.call(opcoes, k)) op[k] = opcoes[k];
    op.doc = doc;
    var r = montar(latex, tam, op);
    var px = x;
    if (opcoes.align === 'centro') px = x - r.largura / 2;
    else if (opcoes.align === 'direita') px = x - r.largura;
    conferirAltura(y, r.altura, r.profundidade, op, r.registro);
    r.caixa.desenhar(doc, px, y);
    return { largura: r.largura, altura: r.altura, profundidade: r.profundidade,
      avisos: r.avisos, x: px, y: y };
  }

  return {
    analisar: analisar,
    medir: medir,
    desenhar: desenhar,
    montar: montar,
    cabe: cabe,
    /* Expostos para o teste e para a folha de prova poderem conferir a lista sem
     * repetir tabela propria. */
    SIMBOLO: SIMBOLO, OP_GRANDE: OP_GRANDE, OP_NOME: OP_NOME,
    AMBIENTE: AMBIENTE, DELIM: DELIM, ESPACO_CMD: ESPACO_CMD,
    GLIFO: GLIFO, TABELA: TABELA,
    ALTURA: ALTURA, FUNDO: FUNDO, EIXO: EIXO,
    tokenizar: tokenizar
  };
});
