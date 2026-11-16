/* svg-para-pdf.js
 * Tradutor do SVG que o MathJax gera para operadores de conteúdo de PDF.
 *
 * Veio do spike da D2 (spike_mathjax/svg_para_pdf.js, 16/11/2026) sem mudar o
 * código; quem o chama no aplicativo é o formula.js. É do aplicativo, e não do
 * vendor: está no ARQUIVOS do sw.js e no index.html, e só roda quando um
 * documento tem fórmula.
 *
 * Sem dependência, ES5, roda no Node e no navegador. Recebe o TEXTO do <svg>
 * (não precisa de DOM) e devolve os operadores já em pontos, com a origem na
 * ponta esquerda da LINHA DE BASE da fórmula:
 *
 *   { ops, largura, altura, profundidade, avisos }
 *
 * altura é quanto a fórmula sobe acima da linha de base e profundidade quanto
 * desce abaixo dela, as duas positivas e em pontos. Para pôr a fórmula na linha
 * de texto basta envolver os operadores num translate até (x, y da base):
 *
 *   'q 1 0 0 1 ' + x + ' ' + y + ' cm ' + r.ops + ' Q'   (veja posicionar())
 *
 * O que o tradutor entende, porque é o que o MathJax (3 e 4) escreve no modo SVG:
 *   path (d com M L H V C S Q T A Z, absolutos e relativos), use com href ou
 *   xlink:href apontando para os glifos de <defs>, g aninhado, transform
 *   (translate, scale, matrix, rotate, skewX, skewY, em qualquer sequência),
 *   rect (traço da fração, barra da raiz, linha de matriz), line e polyline e
 *   polygon (menclose), svg aninhado com viewBox (recorta), text (letra que a
 *   fonte do MathJax não tem, como á: vai para uma função de texto que quem
 *   chama pode trocar), e a cor de preenchimento herdada.
 *
 * Elemento desconhecido NÃO some calado: entra na lista de avisos.
 *
 * Regra da casa: nunca usar travessão.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SvgParaPdf = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ================= leitor de XML mínimo =================
  // O MathJax escreve um XML regular: atributos sempre entre aspas duplas, sem
  // CDATA nem comentário. Mesmo assim aspas simples e comentário são aceitos.

  var ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  function desentidade(s) {
    return s.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-z]+);/g, function (m, e) {
      if (e.charAt(0) === '#') {
        var cp = e.charAt(1) === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return String.fromCodePoint ? String.fromCodePoint(cp) : String.fromCharCode(cp);
      }
      return ENTIDADES.hasOwnProperty(e) ? ENTIDADES[e] : m;
    });
  }

  function analisarXml(s) {
    var raiz = { nome: '#raiz', attrs: {}, filhos: [] };
    var pilha = [raiz];
    var re = /<!--[\s\S]*?-->|<\/([\w:.-]+)\s*>|<([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
    var reAttr = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    var m;
    while ((m = re.exec(s))) {
      var topo = pilha[pilha.length - 1];
      if (m[1]) {
        if (topo.nome !== m[1]) throw new Error('XML: fecha ' + m[1] + ' mas o aberto é ' + topo.nome);
        pilha.pop();
      } else if (m[2]) {
        var no = { nome: m[2], attrs: {}, filhos: [] };
        var a;
        reAttr.lastIndex = 0;
        while ((a = reAttr.exec(m[3] || ''))) no.attrs[a[1]] = desentidade(a[2] != null ? a[2] : a[3]);
        topo.filhos.push(no);
        if (!m[4]) pilha.push(no);
      } else if (m[5] != null) {
        if (/\S/.test(m[5])) topo.filhos.push({ nome: '#texto', texto: desentidade(m[5]) });
      }
    }
    if (pilha.length !== 1) throw new Error('XML: ' + pilha[pilha.length - 1].nome + ' não fechou');
    return raiz;
  }

  // ================= números =================

  /* Coordenada de glifo: o MathJax trabalha em milésimos de em, então uma casa
   * decimal é 0,0012 pt num corpo de 12 pt. */
  function n1(v) {
    var r = Math.round(v * 10) / 10;
    if (r === 0) return '0';
    return String(r);
  }
  /* Coeficiente de matriz: mais casas, porque multiplica coordenadas grandes. */
  function n4(v) {
    var r = Math.round(v * 10000) / 10000;
    if (r === 0) return '0';
    return String(r);
  }

  // ================= transform =================

  function mult(a, b) { // a depois de b no sentido do SVG: resultado = a x b
    return [
      a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
      a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
      a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]
    ];
  }
  var IDENT = [1, 0, 0, 1, 0, 0];
  function ehIdentidade(m) {
    return m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1 && m[4] === 0 && m[5] === 0;
  }

  function lerTransform(s, avisos) {
    var m = IDENT;
    if (!s) return m;
    var re = /([a-zA-Z]+)\s*\(([^)]*)\)/g, t;
    while ((t = re.exec(s))) {
      var v = t[2].split(/[\s,]+/).filter(function (x) { return x.length; }).map(Number);
      var k;
      switch (t[1]) {
        case 'translate': k = [1, 0, 0, 1, v[0] || 0, v[1] || 0]; break;
        case 'scale': k = [v[0], 0, 0, v.length > 1 ? v[1] : v[0], 0, 0]; break;
        case 'matrix': k = v.slice(0, 6); break;
        case 'rotate':
          var ang = (v[0] || 0) * Math.PI / 180, c = Math.cos(ang), sn = Math.sin(ang);
          k = [c, sn, -sn, c, 0, 0];
          if (v.length >= 3) k = mult(mult([1, 0, 0, 1, v[1], v[2]], k), [1, 0, 0, 1, -v[1], -v[2]]);
          break;
        case 'skewX': k = [1, 0, Math.tan(v[0] * Math.PI / 180), 1, 0, 0]; break;
        case 'skewY': k = [1, Math.tan(v[0] * Math.PI / 180), 0, 1, 0, 0]; break;
        default:
          avisos.push('transform desconhecido: ' + t[1]);
          k = IDENT;
      }
      m = mult(m, k);
    }
    return m;
  }
  function opCm(m) {
    return m.map(n4).join(' ') + ' cm';
  }

  // ================= path =================
  // O PDF só tem reta e cúbica. A quadrática do SVG vira cúbica com os pontos
  // de controle a 2/3 do caminho; T e S refletem o controle anterior; o arco A
  // vira cúbicas de até 90 graus.

  function tokensDoPath(d) {
    var re = /([MmLlHhVvCcSsQqTtAaZz])|([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;
    var out = [], t;
    while ((t = re.exec(d))) out.push(t[1] ? t[1] : Number(t[2]));
    return out;
  }

  function arcoParaCubicas(x1, y1, rx, ry, phi, fa, fs, x2, y2) {
    // Conversão do apêndice F.6 da especificação do SVG.
    var res = [];
    if (rx === 0 || ry === 0) return [[x1, y1, x2, y2, x2, y2]];
    rx = Math.abs(rx); ry = Math.abs(ry);
    var cp = Math.cos(phi), sp = Math.sin(phi);
    var dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
    var xp = cp * dx + sp * dy, yp = -sp * dx + cp * dy;
    var lam = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);
    if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
    var num = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp;
    var den = rx * rx * yp * yp + ry * ry * xp * xp;
    var co = Math.sqrt(Math.max(0, num / den)) * (fa === fs ? -1 : 1);
    var cxp = co * rx * yp / ry, cyp = -co * ry * xp / rx;
    var cx = cp * cxp - sp * cyp + (x1 + x2) / 2, cy = sp * cxp + cp * cyp + (y1 + y2) / 2;
    function ang(ux, uy, vx, vy) {
      var a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
      return a;
    }
    var t1 = ang(1, 0, (xp - cxp) / rx, (yp - cyp) / ry);
    var dt = ang((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry);
    if (!fs && dt > 0) dt -= 2 * Math.PI;
    if (fs && dt < 0) dt += 2 * Math.PI;
    var nseg = Math.ceil(Math.abs(dt) / (Math.PI / 2));
    var passo = dt / nseg, k = 4 / 3 * Math.tan(passo / 4);
    for (var i = 0; i < nseg; i++) {
      var a0 = t1 + i * passo, a1 = a0 + passo;
      var p = function (a) { return [Math.cos(a), Math.sin(a)]; };
      var e0 = p(a0), e1 = p(a1);
      var pts = [
        [e0[0] - k * e0[1], e0[1] + k * e0[0]],
        [e1[0] + k * e1[1], e1[1] - k * e1[0]],
        [e1[0], e1[1]]
      ].map(function (q) {
        var X = q[0] * rx, Y = q[1] * ry;
        return [cp * X - sp * Y + cx, sp * X + cp * Y + cy];
      });
      res.push([pts[0][0], pts[0][1], pts[1][0], pts[1][1], pts[2][0], pts[2][1]]);
    }
    return res;
  }

  function pathParaPdf(d) {
    var tk = tokensDoPath(d), i = 0, out = [];
    var cx = 0, cy = 0, sx = 0, sy = 0;   // ponto atual e começo do subcaminho
    var ctrlC = null, ctrlQ = null;       // último controle, para S e T
    var cmd = null;
    function num() {
      if (typeof tk[i] !== 'number') throw new Error('path: número esperado em ' + i);
      return tk[i++];
    }
    function cubica(x1, y1, x2, y2, x, y) {
      out.push(n1(x1) + ' ' + n1(y1) + ' ' + n1(x2) + ' ' + n1(y2) + ' ' + n1(x) + ' ' + n1(y) + ' c');
    }
    while (i < tk.length) {
      if (typeof tk[i] === 'string') cmd = tk[i++];
      else if (cmd === null) throw new Error('path: começa sem comando');
      var rel = cmd === cmd.toLowerCase() && cmd !== 'z' ? true : false;
      var C = cmd.toUpperCase();
      var ox = rel ? cx : 0, oy = rel ? cy : 0;
      var x, y, x1, y1, x2, y2;
      switch (C) {
        case 'M':
          x = ox + num(); y = oy + num();
          out.push(n1(x) + ' ' + n1(y) + ' m');
          cx = sx = x; cy = sy = y;
          cmd = rel ? 'l' : 'L'; // pares seguintes do M são L
          ctrlC = ctrlQ = null;
          continue;
        case 'L':
          x = ox + num(); y = oy + num();
          out.push(n1(x) + ' ' + n1(y) + ' l');
          cx = x; cy = y; ctrlC = ctrlQ = null; break;
        case 'H':
          x = ox + num();
          out.push(n1(x) + ' ' + n1(cy) + ' l');
          cx = x; ctrlC = ctrlQ = null; break;
        case 'V':
          y = (rel ? cy : 0) + num();
          out.push(n1(cx) + ' ' + n1(y) + ' l');
          cy = y; ctrlC = ctrlQ = null; break;
        case 'C':
          x1 = ox + num(); y1 = oy + num(); x2 = ox + num(); y2 = oy + num(); x = ox + num(); y = oy + num();
          cubica(x1, y1, x2, y2, x, y);
          ctrlC = [x2, y2]; ctrlQ = null; cx = x; cy = y; break;
        case 'S':
          x1 = ctrlC ? 2 * cx - ctrlC[0] : cx; y1 = ctrlC ? 2 * cy - ctrlC[1] : cy;
          x2 = ox + num(); y2 = oy + num(); x = ox + num(); y = oy + num();
          cubica(x1, y1, x2, y2, x, y);
          ctrlC = [x2, y2]; ctrlQ = null; cx = x; cy = y; break;
        case 'Q':
        case 'T':
          var qx, qy;
          if (C === 'Q') { qx = ox + num(); qy = oy + num(); }
          else { qx = ctrlQ ? 2 * cx - ctrlQ[0] : cx; qy = ctrlQ ? 2 * cy - ctrlQ[1] : cy; }
          x = ox + num(); y = oy + num();
          cubica(cx + 2 / 3 * (qx - cx), cy + 2 / 3 * (qy - cy), x + 2 / 3 * (qx - x), y + 2 / 3 * (qy - y), x, y);
          ctrlQ = [qx, qy]; ctrlC = null; cx = x; cy = y; break;
        case 'A':
          var rx = num(), ry = num(), rot = num(), fa = num(), fs = num();
          x = ox + num(); y = oy + num();
          arcoParaCubicas(cx, cy, rx, ry, rot * Math.PI / 180, fa, fs, x, y).forEach(function (c) {
            cubica(c[0], c[1], c[2], c[3], c[4], c[5]);
          });
          ctrlC = ctrlQ = null; cx = x; cy = y; break;
        case 'Z':
          out.push('h');
          cx = sx; cy = sy; ctrlC = ctrlQ = null;
          cmd = null;
          continue;
        default:
          throw new Error('path: comando ' + cmd);
      }
    }
    return out.join(' ');
  }

  // ================= cor =================

  var NOMES = {
    black: [0, 0, 0], white: [1, 1, 1], red: [1, 0, 0], green: [0, 0.5, 0], blue: [0, 0, 1],
    gray: [0.5, 0.5, 0.5], grey: [0.5, 0.5, 0.5], orange: [1, 0.647, 0], purple: [0.5, 0, 0.5],
    brown: [0.647, 0.165, 0.165], magenta: [1, 0, 1], cyan: [0, 1, 1], yellow: [1, 1, 0]
  };
  /* atual: o que vem herdado; corrente: a cor do texto (o currentColor), que
   * para o traço NÃO é o traço herdado. */
  function lerCor(v, atual, corrente) {
    if (v == null) return atual;
    v = String(v).trim().toLowerCase();
    if (v === 'inherit') return atual;
    if (v === 'currentcolor') return corrente === undefined ? atual : corrente;
    if (v === 'none' || v === 'transparent') return null;
    if (NOMES[v]) return NOMES[v];
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(v);
    if (m) {
      var h = m[1];
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
    }
    m = /^rgb\(\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*\)$/.exec(v);
    if (m) {
      return [m[1], m[2], m[3]].map(function (c) {
        return /%$/.test(c) ? parseFloat(c) / 100 : parseFloat(c) / 255;
      });
    }
    return atual;
  }
  function opCor(c, traco) {
    return c.map(function (x) { return n4(x); }).join(' ') + (traco ? ' RG' : ' rg');
  }
  function mesmaCor(a, b) {
    return a && b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  }

  // ================= texto que a fonte do MathJax não tem =================
  /* O espaço aqui é o do SVG (y para baixo, porque o <text> traz scale(1,-1)).
   * O padrão desenha na Helvetica /F1 do pdf.js, que toda página do app tem,
   * com o byte Latin-1 (que coincide com o WinAnsi nas letras acentuadas). */
  function textoPadrao(txt, x, y, corpo) {
    var b = '';
    for (var i = 0; i < txt.length; i++) {
      var c = txt.charCodeAt(i);
      var ch = c < 256 ? txt.charAt(i) : '?';
      if (ch === '(' || ch === ')' || ch === '\\') ch = '\\' + ch;
      b += ch;
    }
    return 'q 1 0 0 -1 ' + n1(x) + ' ' + n1(y) + ' cm BT /F1 ' + n1(corpo) + ' Tf 0 0 Td (' + b + ') Tj ET Q';
  }

  // ================= o tradutor =================

  function chaveDoGlifo(id) { return String(id).replace(/^MJX-\d+-/, ''); }

  /* opcoes: tam (corpo em pt, padrão 12), cor ([r,g,b] de 0 a 1, padrão preto),
   * glifos (objeto que guarda os glifos já traduzidos; passe o mesmo para o
   * documento inteiro), texto (função de texto, veja textoPadrao),
   * glifoXObject (função (chave, contorno) -> nome do Form XObject, opcional). */
  function svgParaPdf(svgTexto, opcoes) {
    opcoes = opcoes || {};
    var tam = opcoes.tam || 12;
    var corBase = opcoes.cor || [0, 0, 0];
    var glifos = opcoes.glifos || {};
    var fTexto = opcoes.texto || textoPadrao;
    var fXObj = typeof opcoes.glifoXObject === 'function' ? opcoes.glifoXObject : null;
    var avisos = [];
    var arvore = analisarXml(svgTexto);
    var svg = null;
    (function acha(no) {
      if (svg) return;
      if (no.nome === 'svg') { svg = no; return; }
      (no.filhos || []).forEach(acha);
    })(arvore);
    if (!svg) throw new Error('sem <svg> no texto');
    var vb = (svg.attrs.viewBox || '').split(/[\s,]+/).map(Number);
    if (vb.length !== 4 || vb.some(isNaN)) throw new Error('svg sem viewBox');

    // Primeiro os <defs>, em qualquer lugar da árvore: o <use> pode vir antes.
    var locais = {};
    (function defs(no) {
      if (no.nome === 'defs') {
        no.filhos.forEach(function (p) {
          if (p.nome === 'path' && p.attrs.id) {
            var k = chaveDoGlifo(p.attrs.id);
            if (!glifos.hasOwnProperty(k)) glifos[k] = pathParaPdf(p.attrs.d || '');
            locais[p.attrs.id] = k;
          } else if (p.nome !== '#texto') avisos.push('defs com ' + p.nome + ' ignorado');
        });
        return;
      }
      (no.filhos || []).forEach(defs);
    })(svg);

    var out = [];
    /* Glifos citados por esta fórmula. Quem usa glifoXObject precisa deles
     * para declarar o recurso na PÁGINA onde a fórmula cair, que pode não ser a
     * página em vigor na hora da conversão (os operadores podem ser guardados e
     * desenhados depois). */
    var usados = {};

    function atributoNum(no, nome) {
      var v = no.attrs[nome];
      return v == null ? 0 : parseFloat(v);
    }

    /* As propriedades de pintura que o MathJax põe na folha de estilo, e não
     * no atributo: sem elas o fio da tabela (\hline, coluna com |) sai com
     * espessura zero. Valem as do mtable.js do MathJax 3. */
    function estiloDaFolha(no) {
      var e = {};
      var cls = ' ' + (no.attrs['class'] || '') + ' ';
      if (no.attrs['data-line'] != null || no.attrs['data-frame'] != null) { e.sw = 70; e.semFundo = true; }
      if (/ mjx-dashed /.test(cls)) e.dash = [140];
      if (/ mjx-dotted /.test(cls)) { e.dash = [0, 140]; e.cap = 1; }
      return e;
    }
    /* O atributo style="stroke-width: 67" do menclose. */
    function lerStyle(s) {
      var r = {};
      String(s || '').split(';').forEach(function (par) {
        var i = par.indexOf(':');
        if (i > 0) r[par.slice(0, i).trim()] = par.slice(i + 1).trim();
      });
      return r;
    }
    function ehNumero(v) { return v != null && !isNaN(parseFloat(v)); }

    /* cor: preenchimento em vigor; estado.pdf: o que o PDF tem como rg agora;
     * estado.traco, sw, dash, cap: o traço herdado. */
    function andar(no, cor, estado) {
      var nome = no.nome;
      if (nome === '#texto' || nome === 'defs' || nome === 'title' || nome === 'desc') return;
      var st = lerStyle(no.attrs.style);
      var folha = estiloDaFolha(no);
      var cor2 = lerCor(st.fill || no.attrs.fill, cor, corBase);
      if (folha.semFundo) cor2 = null;
      var traco = lerCor(st.stroke || no.attrs.stroke, estado.traco, corBase);
      var swAttr = st['stroke-width'] || no.attrs['stroke-width'];
      var sw = folha.sw != null ? folha.sw : (ehNumero(swAttr) ? parseFloat(swAttr) : estado.sw);
      var dashAttr = st['stroke-dasharray'] || no.attrs['stroke-dasharray'];
      var dash = folha.dash || (dashAttr ? String(dashAttr).split(/[\s,]+/).filter(function (x) { return x.length; }).map(Number) : estado.dash);
      var capAttr = st['stroke-linecap'] || no.attrs['stroke-linecap'];
      var cap = folha.cap != null ? folha.cap : (capAttr ? ({ butt: 0, round: 1, square: 2 }[capAttr] || 0) : estado.cap);
      var m = lerTransform(no.attrs.transform, avisos);
      var abre = !ehIdentidade(m) || !mesmaCor(cor2, estado.pdf) && cor2;
      var est = { pdf: estado.pdf, traco: traco, sw: sw, dash: dash, cap: cap };
      if (abre) {
        out.push('q');
        if (!ehIdentidade(m)) out.push(opCm(m));
        /* A cor nova entra já na abertura: assim os filhos sabem que ela está
         * em vigor e não abrem outro q só para repeti-la. */
        if (cor2 && !mesmaCor(cor2, est.pdf)) { out.push(opCor(cor2)); est.pdf = cor2; }
      }
      function garanteCor() {
        if (cor2 && !mesmaCor(cor2, est.pdf)) { out.push(opCor(cor2)); est.pdf = cor2; }
      }
      /* Pinta uma geometria já em operadores: preenche, traça ou os dois (B),
       * pelo que o SVG pede. O traço vai dentro de q/Q, com cor, espessura,
       * ponta e tracejado próprios, para não vazar para o resto. */
      function pintar(geom, podeEncher) {
        var enche = !!(cor2 && podeEncher);
        var traca = !!(traco && sw > 0);
        if (!enche && !traca) return;
        if (enche) garanteCor();
        if (!traca) { out.push(geom + ' f'); return; }
        out.push('q ' + opCor(traco, true) + ' ' + n1(sw) + ' w ' + (cap || 0) + ' J ' +
          (dash && dash.length ? '[' + dash.map(n1).join(' ') + '] 0 d ' : '') +
          geom + (enche ? ' B' : ' S') + ' Q');
      }
      switch (nome) {
        case 'svg': // aninhado: viewport com recorte
          var x = atributoNum(no, 'x'), y = atributoNum(no, 'y');
          var w = atributoNum(no, 'width'), h = atributoNum(no, 'height');
          var v = (no.attrs.viewBox || '').split(/[\s,]+/).map(Number);
          if (!abre) { out.push('q'); abre = true; }
          if (no.attrs.overflow !== 'visible') out.push(n1(x) + ' ' + n1(y) + ' ' + n1(w) + ' ' + n1(h) + ' re W n');
          if (v.length === 4 && !v.some(isNaN) && v[2] && v[3]) {
            var par = no.attrs.preserveAspectRatio || 'xMidYMid meet';
            var ex = w / v[2], ey = h / v[3];
            if (par !== 'none') { var e = Math.min(ex, ey); ex = ey = e; }
            out.push(opCm([ex, 0, 0, ey, x - v[0] * ex, y - v[1] * ey]));
          } else {
            out.push(opCm([1, 0, 0, 1, x, y]));
          }
          no.filhos.forEach(function (f) { andar(f, cor2, est); });
          break;
        case 'g':
        case 'a':
        case 'switch':
          no.filhos.forEach(function (f) { andar(f, cor2, est); });
          break;
        case 'use':
          var href = no.attrs.href || no.attrs['xlink:href'] || '';
          var id = href.replace(/^#/, '');
          var k = locais[id] || chaveDoGlifo(id);
          if (!glifos.hasOwnProperty(k)) { avisos.push('use sem glifo: ' + href); break; }
          if (!cor2) break;
          var ux = atributoNum(no, 'x'), uy = atributoNum(no, 'y');
          garanteCor();
          /* Com glifoXObject quem chama registra o glifo uma vez por documento
           * como Form XObject e devolve o nome do recurso; a cor de
           * preenchimento em vigor vale dentro do Form, porque ele herda o
           * estado gráfico. Sem a função, o contorno vai inteiro aqui. O glifo
           * sai só preenchido, como no TeX impresso (a folha de estilo do
           * MathJax põe um traço de 3 milésimos de em na tela, que aqui não
           * entra). */
          usados[k] = true;
          var nomeX = fXObj ? fXObj(k, glifos[k]) : null;
          var corpoGlifo = nomeX ? '/' + nomeX + ' Do' : glifos[k] + ' f';
          if (ux || uy) out.push('q ' + opCm([1, 0, 0, 1, ux, uy]) + ' ' + corpoGlifo + ' Q');
          else out.push(corpoGlifo);
          break;
        case 'path':
          pintar(pathParaPdf(no.attrs.d || ''), true);
          break;
        case 'rect':
          if (ehNumero(no.attrs.rx) && parseFloat(no.attrs.rx) > 0) avisos.push('rect com canto redondo saiu com canto reto');
          pintar(n1(atributoNum(no, 'x')) + ' ' + n1(atributoNum(no, 'y')) + ' ' +
            n1(atributoNum(no, 'width')) + ' ' + n1(atributoNum(no, 'height')) + ' re', true);
          break;
        case 'ellipse':
        case 'circle':
          var cx = atributoNum(no, 'cx'), cy = atributoNum(no, 'cy');
          var rx = nome === 'circle' ? atributoNum(no, 'r') : atributoNum(no, 'rx');
          var ry = nome === 'circle' ? rx : atributoNum(no, 'ry');
          pintar(pathParaPdf('M' + (cx + rx) + ' ' + cy + 'A' + rx + ' ' + ry + ' 0 1 1 ' + (cx - rx) + ' ' + cy +
            'A' + rx + ' ' + ry + ' 0 1 1 ' + (cx + rx) + ' ' + cy + 'Z'), true);
          break;
        case 'line':
        case 'polyline':
        case 'polygon':
          var pts;
          if (nome === 'line') {
            pts = [atributoNum(no, 'x1'), atributoNum(no, 'y1'), atributoNum(no, 'x2'), atributoNum(no, 'y2')];
          } else {
            pts = (no.attrs.points || '').split(/[\s,]+/).filter(function (s) { return s.length; }).map(Number);
          }
          var segs = [];
          for (var p = 0; p + 1 < pts.length; p += 2) segs.push(n1(pts[p]) + ' ' + n1(pts[p + 1]) + (p ? ' l' : ' m'));
          if (nome === 'polygon') segs.push('h');
          pintar(segs.join(' '), nome !== 'line');
          break;
        case 'text':
          if (!cor2) break;
          garanteCor();
          var txt = '';
          no.filhos.forEach(function (f) { if (f.nome === '#texto') txt += f.texto; });
          var corpo = parseFloat(no.attrs['font-size']) || 1000;
          out.push(fTexto(txt, atributoNum(no, 'x'), atributoNum(no, 'y'), corpo, no.attrs));
          avisos.push('texto sem glifo vetorial no MathJax, desenhado pela função de texto: ' + txt);
          break;
        default:
          avisos.push('elemento ignorado: ' + nome);
      }
      if (abre) out.push('Q');
    }

    var s = tam / 1000;
    var raizCor = corBase;
    var corpoOps = [];
    out = corpoOps;
    // O <svg> de fora: o viewBox em milésimos de em, y para baixo, base em y=0.
    svg.filhos.forEach(function (f) { andar(f, raizCor, { pdf: raizCor, traco: null, sw: 1, dash: null, cap: 0 }); });

    var ops = 'q ' + opCm([s, 0, 0, -s, -vb[0] * s, 0]) + ' ' + opCor(corBase) + ' ' + corpoOps.join(' ') + ' Q';
    return {
      ops: ops,
      largura: vb[2] * s,
      altura: -vb[1] * s,
      profundidade: (vb[3] + vb[1]) * s,
      avisos: avisos,
      glifosUsados: Object.keys(usados)
    };
  }

  function posicionar(r, x, y) {
    return 'q 1 0 0 1 ' + n4(x) + ' ' + n4(y) + ' cm ' + r.ops + ' Q';
  }

  return {
    svgParaPdf: svgParaPdf,
    posicionar: posicionar,
    pathParaPdf: pathParaPdf,
    analisarXml: analisarXml,
    lerTransform: lerTransform
  };
});
