/* pdf.js
 * Gerador de PDF sem dependencias, com a identidade visual do Apoio Educacional.
 * Fontes base-14 (Helvetica / Helvetica-Bold) com WinAnsiEncoding: acentuacao pt-BR completa.
 * Roda no navegador e no Node (para testes).
 *
 * Regra da casa aplicada aos textos fixos: nunca usar travessao.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PDFGen = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ================= metricas das fontes base-14 =================
  // Larguras oficiais (1/1000 em) para os codigos 32..126.
  var W_REG = [
    278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
    556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
    1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
    667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
    333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
    556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584
  ];
  var W_BOLD = [
    278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
    556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
    975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
    667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
    333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
    611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584
  ];
  // Acentuados das fontes base-14 tem a largura do caractere base.
  var BASE_ACENTO = {
    0xC0: 'A', 0xC1: 'A', 0xC2: 'A', 0xC3: 'A', 0xC4: 'A', 0xC5: 'A', 0xC7: 'C',
    0xC8: 'E', 0xC9: 'E', 0xCA: 'E', 0xCB: 'E', 0xCC: 'I', 0xCD: 'I', 0xCE: 'I', 0xCF: 'I',
    0xD1: 'N', 0xD2: 'O', 0xD3: 'O', 0xD4: 'O', 0xD5: 'O', 0xD6: 'O',
    0xD9: 'U', 0xDA: 'U', 0xDB: 'U', 0xDC: 'U', 0xDD: 'Y',
    0xE0: 'a', 0xE1: 'a', 0xE2: 'a', 0xE3: 'a', 0xE4: 'a', 0xE5: 'a', 0xE7: 'c',
    0xE8: 'e', 0xE9: 'e', 0xEA: 'e', 0xEB: 'e', 0xEC: 'i', 0xED: 'i', 0xEE: 'i', 0xEF: 'i',
    0xF1: 'n', 0xF2: 'o', 0xF3: 'o', 0xF4: 'o', 0xF5: 'o', 0xF6: 'o',
    0xF9: 'u', 0xFA: 'u', 0xFB: 'u', 0xFC: 'u', 0xFD: 'y', 0xFF: 'y'
  };
  var W_EXTRA = {
    0xA0: 278, 0xA7: 556, 0xAA: 370, 0xAB: 556, 0xB0: 400, 0xB7: 278, 0xBA: 365, 0xBB: 556,
    0x80: 556, 0x85: 1000, 0x91: 222, 0x92: 222, 0x93: 333, 0x94: 333, 0x95: 350,
    0x96: 556, 0x97: 1000, 0x99: 1000
  };
  var W_EXTRA_BOLD = {
    0xA0: 278, 0xA7: 556, 0xAA: 370, 0xAB: 556, 0xB0: 400, 0xB7: 278, 0xBA: 365, 0xBB: 556,
    0x80: 556, 0x85: 1000, 0x91: 278, 0x92: 278, 0x93: 500, 0x94: 500, 0x95: 350,
    0x96: 556, 0x97: 1000, 0x99: 1000
  };

  // Unicode que nao esta em latin1 mas existe no cp1252 (WinAnsi).
  var CP1252 = {
    0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86,
    0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C,
    0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95,
    0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B,
    0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F
  };

  function paraWinAnsi(str) {
    var out = '';
    str = String(str == null ? '' : str);
    for (var i = 0; i < str.length; i++) {
      var c = str.codePointAt(i);
      if (c > 0xFFFF) { i++; out += '?'; continue; }
      if (c === 9) { out += '    '; continue; }
      if (c < 32) { out += ' '; continue; }
      if (c < 256) { out += String.fromCharCode(c); continue; }
      if (CP1252[c] !== undefined) { out += String.fromCharCode(CP1252[c]); continue; }
      out += '?';
    }
    return out;
  }

  function larguraByte(code, bold) {
    if (code >= 32 && code <= 126) return (bold ? W_BOLD : W_REG)[code - 32];
    var base = BASE_ACENTO[code];
    if (base) return (bold ? W_BOLD : W_REG)[base.charCodeAt(0) - 32];
    var ex = (bold ? W_EXTRA_BOLD : W_EXTRA)[code];
    if (ex !== undefined) return ex;
    return (bold ? W_BOLD : W_REG)[31]; // largura de '?'
  }

  /* Mede uma string ja convertida para WinAnsi, em pontos. */
  function medirWA(wa, tamanho, bold, tracking) {
    var soma = 0;
    for (var i = 0; i < wa.length; i++) soma += larguraByte(wa.charCodeAt(i), bold);
    var w = soma * tamanho / 1000;
    if (tracking) w += tracking * wa.length;
    return w;
  }

  function medir(texto, tamanho, bold, tracking) {
    return medirWA(paraWinAnsi(texto), tamanho, bold, tracking);
  }

  function escapar(wa) {
    return wa.replace(/([\\()])/g, '\\$1');
  }

  // ================= writer =================

  function bytesLatin1(s) {
    var a = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 0xFF;
    return a;
  }

  function Writer() {
    this.objs = [];
    this.root = 0;
  }
  Writer.prototype.alloc = function () { this.objs.push(null); return this.objs.length; };
  Writer.prototype.set = function (n, data) { this.objs[n - 1] = data; };
  Writer.prototype.add = function (data) { var n = this.alloc(); this.set(n, data); return n; };
  Writer.prototype.addStream = function (dict, dados) {
    var corpo = (dados instanceof Uint8Array) ? dados : bytesLatin1(dados);
    var cab = bytesLatin1('<< ' + dict + ' /Length ' + corpo.length + ' >>\nstream\n');
    var fim = bytesLatin1('\nendstream');
    var out = new Uint8Array(cab.length + corpo.length + fim.length);
    out.set(cab, 0); out.set(corpo, cab.length); out.set(fim, cab.length + corpo.length);
    return this.add(out);
  };
  Writer.prototype.build = function () {
    var partes = [], total = 0;
    function push(d) {
      var b = (d instanceof Uint8Array) ? d : bytesLatin1(d);
      partes.push(b); total += b.length;
    }
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    var offsets = [];
    for (var i = 0; i < this.objs.length; i++) {
      offsets.push(total);
      push((i + 1) + ' 0 obj\n');
      push(this.objs[i] === null ? '<< >>' : this.objs[i]);
      push('\nendobj\n');
    }
    var inicioXref = total;
    var x = 'xref\n0 ' + (this.objs.length + 1) + '\n0000000000 65535 f \n';
    for (var j = 0; j < offsets.length; j++) {
      x += ('0000000000' + offsets[j]).slice(-10) + ' 00000 n \n';
    }
    push(x);
    push('trailer\n<< /Size ' + (this.objs.length + 1) + ' /Root ' + this.root + ' 0 R >>\n' +
      'startxref\n' + inicioXref + '\n%%EOF\n');
    var out = new Uint8Array(total), p = 0;
    for (var k = 0; k < partes.length; k++) { out.set(partes[k], p); p += partes[k].length; }
    return out;
  };

  // ================= identidade visual =================

  var PAGINA_L = 595.2756, PAGINA_A = 841.8898;
  var MARG_E = 40, MARG_D = 555.2756;
  var UTIL = MARG_D - MARG_E;                 // 515.2756
  var Y_FIO_CAB = PAGINA_A - 58;              // 783.89
  var Y_FIO_ROD = PAGINA_A - 795.89;          // 46.00
  var Y_TOPO = Y_FIO_CAB - 30;                // inicio do conteudo
  var Y_LIMITE = Y_FIO_ROD + 18;              // fim do conteudo

  var COR = {
    navy: [0.121569, 0.227451, 0.372549],   // #1F3A5F
    teal: [0.180392, 0.490196, 0.419608],   // #2E7D6B
    gold: [0.788235, 0.662745, 0.380392],   // #C9A961
    muted: [0.419608, 0.447059, 0.501961],  // #6B7280
    fio: [0.788235, 0.823529, 0.866667],    // #C9D2DD
    soft: [0.937255, 0.952941, 0.968627],   // #EFF3F7
    softEsc: [0.909804, 0.933333, 0.956863],// #E8EEF4
    branco: [1, 1, 1],
    texto: [0.101961, 0.109804, 0.121569],  // #1A1C1F
    marca: [0.925, 0.945, 0.965]            // marca d'agua
  };

  function cor3(c) { return c[0].toFixed(6) + ' ' + c[1].toFixed(6) + ' ' + c[2].toFixed(6); }

  // ================= documento =================

  function Doc() {
    this.w = new Writer();
    this.paginas = [];
    this.imagens = {};       // ref -> {obj, w, h}
    this.fonteRegular = 0;
    this.fonteBold = 0;
    this.pag = null;
  }

  Doc.prototype.novaPagina = function (opcoes) {
    opcoes = opcoes || {};
    this.pag = { ops: [], usaImg: {}, semMoldura: !!opcoes.semMoldura };
    this.paginas.push(this.pag);
    this.y = Y_TOPO;
    if (!opcoes.semMarca) this.marcaDagua();
    return this.pag;
  };

  Doc.prototype.op = function (s) { this.pag.ops.push(s); };

  Doc.prototype.texto = function (txt, x, y, opcoes) {
    opcoes = opcoes || {};
    var tam = opcoes.tam || 10;
    var bold = !!opcoes.bold;
    var c = opcoes.cor || COR.texto;
    var tr = opcoes.tracking || 0;
    var wa = paraWinAnsi(txt);
    if (!wa.length) return;
    var largura = medirWA(wa, tam, bold, tr);
    var px = x;
    if (opcoes.align === 'centro') px = x - largura / 2;
    else if (opcoes.align === 'direita') px = x - largura;
    this.op('BT ' + cor3(c) + ' rg /' + (bold ? 'F2' : 'F1') + ' ' + tam + ' Tf ' +
      (tr ? tr.toFixed(3) + ' Tc ' : '') +
      px.toFixed(2) + ' ' + y.toFixed(2) + ' Td (' + escapar(wa) + ') Tj ' +
      (tr ? '0 Tc ' : '') + 'ET');
    return largura;
  };

  Doc.prototype.linha = function (x1, y1, x2, y2, c, espessura) {
    this.op(cor3(c || COR.fio) + ' RG ' + (espessura || 0.7).toFixed(2) + ' w ' +
      x1.toFixed(2) + ' ' + y1.toFixed(2) + ' m ' + x2.toFixed(2) + ' ' + y2.toFixed(2) + ' l S');
  };

  Doc.prototype.retangulo = function (x, y, largura, altura, c) {
    this.op(cor3(c) + ' rg ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' ' +
      largura.toFixed(2) + ' ' + altura.toFixed(2) + ' re f');
  };

  Doc.prototype.circulo = function (cx, cy, r, c, preenche) {
    var k = 0.5523 * r;
    this.op((preenche ? cor3(c) + ' rg ' : cor3(c) + ' RG 1.6 w ') +
      (cx + r).toFixed(2) + ' ' + cy.toFixed(2) + ' m ' +
      (cx + r).toFixed(2) + ' ' + (cy + k).toFixed(2) + ' ' + (cx + k).toFixed(2) + ' ' + (cy + r).toFixed(2) + ' ' + cx.toFixed(2) + ' ' + (cy + r).toFixed(2) + ' c ' +
      (cx - k).toFixed(2) + ' ' + (cy + r).toFixed(2) + ' ' + (cx - r).toFixed(2) + ' ' + (cy + k).toFixed(2) + ' ' + (cx - r).toFixed(2) + ' ' + cy.toFixed(2) + ' c ' +
      (cx - r).toFixed(2) + ' ' + (cy - k).toFixed(2) + ' ' + (cx - k).toFixed(2) + ' ' + (cy - r).toFixed(2) + ' ' + cx.toFixed(2) + ' ' + (cy - r).toFixed(2) + ' c ' +
      (cx + k).toFixed(2) + ' ' + (cy - r).toFixed(2) + ' ' + (cx + r).toFixed(2) + ' ' + (cy - k).toFixed(2) + ' ' + (cx + r).toFixed(2) + ' ' + cy.toFixed(2) + ' c ' +
      (preenche ? 'f' : 'S'));
  };

  Doc.prototype.marcaDagua = function () {
    var cx = PAGINA_L / 2, cy = PAGINA_A / 2;
    this.circulo(cx, cy, 96, COR.marca, false);
    this.texto('NW', cx, cy - 26, { tam: 82, bold: true, cor: COR.marca, align: 'centro' });
    this.texto('APOIO EDUCACIONAL', cx, cy - 62, { tam: 10, cor: COR.marca, align: 'centro', tracking: 2.4 });
  };

  Doc.prototype.moldura = function (numero, total) {
    // Cabecalho identico ao samsung_template_branco.
    this.texto('Nathália Wajsenzon', MARG_E, PAGINA_A - 46.5, { tam: 12, bold: true, cor: COR.navy });
    var tr = 1.3;
    var lg = medir('APOIO EDUCACIONAL', 8, false, tr);
    this.texto('APOIO EDUCACIONAL', MARG_D - lg, PAGINA_A - 45.2, { tam: 8, cor: COR.teal, tracking: tr });
    this.linha(MARG_E, Y_FIO_CAB, MARG_D, Y_FIO_CAB, COR.navy, 1.0);
    // Rodape.
    this.linha(MARG_E, Y_FIO_ROD, MARG_D, Y_FIO_ROD, COR.fio, 0.7);
    this.texto('Nathália Wajsenzon · Apoio Educacional', MARG_E, PAGINA_A - 809.4, { tam: 7.5, cor: COR.muted });
    this.texto('Página ' + numero + ' de ' + total, MARG_D, PAGINA_A - 809.4, { tam: 7.5, cor: COR.muted, align: 'direita' });
  };

  Doc.prototype.garanteEspaco = function (altura) {
    if (this.y - altura < Y_LIMITE) { this.novaPagina(); return true; }
    return false;
  };

  /* Quebra texto em linhas que cabem na largura. */
  Doc.prototype.quebrar = function (txt, largura, tam, bold) {
    var paragrafos = String(txt == null ? '' : txt).split(/\r?\n/);
    var linhas = [];
    for (var p = 0; p < paragrafos.length; p++) {
      var palavras = paragrafos[p].split(/\s+/).filter(function (s) { return s.length; });
      if (!palavras.length) { linhas.push(''); continue; }
      var atual = '';
      for (var i = 0; i < palavras.length; i++) {
        var tentativa = atual ? atual + ' ' + palavras[i] : palavras[i];
        if (medir(tentativa, tam, bold) <= largura) { atual = tentativa; continue; }
        if (atual) { linhas.push(atual); atual = palavras[i]; }
        else {
          // palavra unica maior que a linha: quebra por caractere
          var pedaco = '';
          for (var c = 0; c < palavras[i].length; c++) {
            if (medir(pedaco + palavras[i][c], tam, bold) > largura && pedaco) {
              linhas.push(pedaco); pedaco = '';
            }
            pedaco += palavras[i][c];
          }
          atual = pedaco;
        }
      }
      if (atual) linhas.push(atual);
    }
    return linhas;
  };

  Doc.prototype.paragrafo = function (txt, opcoes) {
    opcoes = opcoes || {};
    var tam = opcoes.tam || 10.5;
    var bold = !!opcoes.bold;
    var c = opcoes.cor || COR.texto;
    var x = opcoes.x || MARG_E;
    var largura = opcoes.largura || UTIL;
    var alturaLinha = opcoes.alturaLinha || (tam * 1.45);
    var linhas = this.quebrar(txt, largura, tam, bold);
    for (var i = 0; i < linhas.length; i++) {
      this.garanteEspaco(alturaLinha);
      this.y -= alturaLinha;
      if (linhas[i]) this.texto(linhas[i], x, this.y, { tam: tam, bold: bold, cor: c });
    }
    return linhas.length;
  };

  // ================= imagens JPEG =================

  Doc.prototype.registraImagem = function (ref, bytes, larguraPx, alturaPx) {
    if (this.imagens[ref]) return this.imagens[ref];
    var obj = this.w.addStream(
      '/Type /XObject /Subtype /Image /Width ' + larguraPx + ' /Height ' + alturaPx +
      ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode', bytes);
    this.imagens[ref] = { obj: obj, w: larguraPx, h: alturaPx, nome: 'Im' + (Object.keys(this.imagens).length + 1) };
    return this.imagens[ref];
  };

  Doc.prototype.desenhaImagem = function (ref, x, y, largura, altura) {
    var im = this.imagens[ref];
    if (!im) return;
    this.pag.usaImg[ref] = true;
    this.op('q ' + largura.toFixed(2) + ' 0 0 ' + altura.toFixed(2) + ' ' +
      x.toFixed(2) + ' ' + y.toFixed(2) + ' cm /' + im.nome + ' Do Q');
  };

  // ================= saida =================

  Doc.prototype.finalizar = function () {
    var total = this.paginas.length;
    // moldura por pagina, inserida no inicio do fluxo de cada uma
    for (var i = 0; i < total; i++) {
      this.pag = this.paginas[i];
      if (this.pag.semMoldura) continue;
      var antes = this.pag.ops;
      this.pag.ops = [];
      this.moldura(i + 1, total);
      this.pag.ops = antes.concat(this.pag.ops);
    }
    var w = this.w;
    this.fonteRegular = w.add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    this.fonteBold = w.add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    var numPaginas = w.alloc();
    var refs = [];
    for (var j = 0; j < this.paginas.length; j++) {
      var pg = this.paginas[j];
      var conteudo = w.addStream('', pg.ops.join('\n'));
      var xo = [];
      for (var ref in pg.usaImg) {
        if (this.imagens[ref]) xo.push('/' + this.imagens[ref].nome + ' ' + this.imagens[ref].obj + ' 0 R');
      }
      var recursos = '/Font << /F1 ' + this.fonteRegular + ' 0 R /F2 ' + this.fonteBold + ' 0 R >>' +
        (xo.length ? ' /XObject << ' + xo.join(' ') + ' >>' : '');
      var pgNum = w.add('<< /Type /Page /Parent ' + numPaginas + ' 0 R /MediaBox [0 0 ' +
        PAGINA_L.toFixed(4) + ' ' + PAGINA_A.toFixed(4) + '] /Resources << ' + recursos +
        ' >> /Contents ' + conteudo + ' 0 R >>');
      refs.push(pgNum + ' 0 R');
    }
    w.set(numPaginas, '<< /Type /Pages /Count ' + refs.length + ' /Kids [' + refs.join(' ') + '] >>');
    w.root = w.add('<< /Type /Catalog /Pages ' + numPaginas + ' 0 R >>');
    return w.build();
  };

  // ================= folha de aula (notas manuscritas) =================
  // Pagina logica da nota: 1000 x 1343 (mesmo formato da area util do PDF).

  var NOTA_L = 1000, NOTA_A = 1343;

  function desenhaFundo(doc, tipo, x0, y0, largura, altura) {
    if (tipo === 'pautado') {
      var passo = altura / 26;
      for (var i = 1; i < 26; i++) {
        var yy = y0 + altura - i * passo;
        doc.linha(x0 + 6, yy, x0 + largura - 6, yy, COR.fio, 0.4);
      }
    } else if (tipo === 'pontilhado') {
      var pc = largura / 22;
      doc.op(cor3(COR.fio) + ' rg');
      var s = '';
      for (var cx = x0 + pc; cx < x0 + largura - 1; cx += pc) {
        for (var cy = y0 + pc; cy < y0 + altura - 1; cy += pc) {
          s += (cx - 0.5).toFixed(2) + ' ' + (cy - 0.5).toFixed(2) + ' 1 1 re ';
        }
      }
      if (s) doc.op(s + 'f');
    }
  }

  function desenhaTracos(doc, itens, x0, y0, largura, altura, escala) {
    for (var i = 0; i < itens.length; i++) {
      var it = itens[i];
      if (it.t !== 'traco' || !it.pontos || it.pontos.length < 1) continue;
      var c = hexParaRgb(it.cor || '#1A1C1F');
      var pts = it.pontos;
      // agrupa em sequencias de espessura semelhante
      var atual = null, buffer = [];
      function despeja() {
        if (!buffer.length || atual === null) { buffer = []; return; }
        var s = cor3(c) + ' RG ' + Math.max(0.3, atual * escala).toFixed(2) + ' w 1 J 1 j ';
        for (var k = 0; k < buffer.length; k++) {
          var seg = buffer[k];
          s += seg[0].toFixed(2) + ' ' + seg[1].toFixed(2) + ' m ' + seg[2].toFixed(2) + ' ' + seg[3].toFixed(2) + ' l ';
        }
        doc.op(s + 'S');
        buffer = [];
      }
      if (pts.length === 1) {
        var p = pts[0];
        var r = Math.max(0.3, (p[2] || 2) * escala) / 2;
        doc.circulo(x0 + p[0] * escala, y0 + altura - p[1] * escala, r, c, true);
        continue;
      }
      for (var j = 1; j < pts.length; j++) {
        var a = pts[j - 1], b = pts[j];
        var esp = Math.round((((a[2] || 2) + (b[2] || 2)) / 2) * 10) / 10;
        if (atual === null) atual = esp;
        else if (Math.abs(esp - atual) > 0.15) { despeja(); atual = esp; }
        buffer.push([
          x0 + a[0] * escala, y0 + altura - a[1] * escala,
          x0 + b[0] * escala, y0 + altura - b[1] * escala
        ]);
      }
      despeja();
    }
  }

  function hexParaRgb(hex) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return COR.texto;
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  /* Desenha uma pagina de nota dentro da area util.
   * imagens: mapa ref -> { bytes, w, h } */
  function desenhaNota(doc, pagina, imagens) {
    var x0 = MARG_E, largura = UTIL;
    var altura = largura * (NOTA_A / NOTA_L);
    var y0 = Y_TOPO - altura;
    if (y0 < Y_LIMITE) { altura = Y_TOPO - Y_LIMITE; y0 = Y_LIMITE; }
    var escala = largura / NOTA_L;

    desenhaFundo(doc, pagina.fundo || 'branco', x0, y0, largura, altura);

    var itens = pagina.itens || [];
    // imagens primeiro, para o traco ficar por cima
    for (var i = 0; i < itens.length; i++) {
      var it = itens[i];
      if (it.t !== 'imagem') continue;
      var info = imagens && imagens[it.ref];
      if (!info) continue;
      doc.registraImagem(it.ref, info.bytes, info.w, info.h);
      doc.desenhaImagem(it.ref, x0 + it.x * escala, y0 + altura - (it.y + it.h) * escala,
        it.w * escala, it.h * escala);
    }
    for (var j = 0; j < itens.length; j++) {
      var t = itens[j];
      if (t.t !== 'texto' || !t.txt) continue;
      var tam = (t.tam || 26) * escala;
      var linhas = doc.quebrar(t.txt, largura - t.x * escala - 4, tam, false);
      for (var k = 0; k < linhas.length; k++) {
        doc.texto(linhas[k], x0 + t.x * escala,
          y0 + altura - t.y * escala - (k + 1) * tam * 1.3,
          { tam: tam, cor: hexParaRgb(t.cor || '#1A1C1F') });
      }
    }
    desenhaTracos(doc, itens, x0, y0, largura, altura, escala);
  }

  // ================= fechamento mensal =================

  function fmtMoedaLocal(v) {
    var n = Math.abs(Math.round(v * 100)) / 100;
    var inteiro = Math.floor(n);
    var cent = Math.round((n - inteiro) * 100);
    if (cent === 100) { inteiro += 1; cent = 0; }
    var s = String(inteiro), out = '';
    while (s.length > 3) { out = '.' + s.slice(-3) + out; s = s.slice(0, -3); }
    return (v < 0 ? '-' : '') + 'R$ ' + s + out + ',' + (cent < 10 ? '0' : '') + cent;
  }
  function fmtDur(min) {
    if (min < 60) return min + 'min';
    if (min % 60 === 0) return (min / 60) + 'h';
    return Math.floor(min / 60) + 'h' + (min % 60 < 10 ? '0' : '') + (min % 60);
  }
  function ddmmL(iso) { var p = String(iso).split('-'); return p[2] + '/' + p[1]; }

  var COLUNAS = [
    { chave: 'data', rotulo: 'Data', largura: 52, align: 'esq' },
    { chave: 'dia', rotulo: 'Dia', largura: 38, align: 'esq' },
    { chave: 'hora', rotulo: 'Horário', largura: 55, align: 'esq' },
    { chave: 'dur', rotulo: 'Duração', largura: 58, align: 'esq' },
    { chave: 'situacao', rotulo: 'Situação', largura: 132, align: 'esq' },
    { chave: 'vh', rotulo: 'R$/hora', largura: 88, align: 'dir' },
    { chave: 'valor', rotulo: 'Valor', largura: 92.2756, align: 'dir' }
  ];

  function cabecalhoTabela(doc) {
    var alturaCab = 20;
    doc.garanteEspaco(alturaCab + 16);
    doc.y -= alturaCab;
    doc.retangulo(MARG_E, doc.y, UTIL, alturaCab, COR.navy);
    var x = MARG_E;
    for (var i = 0; i < COLUNAS.length; i++) {
      var col = COLUNAS[i];
      if (col.align === 'dir') {
        doc.texto(col.rotulo, x + col.largura - 7, doc.y + 6.5, { tam: 8.5, bold: true, cor: COR.branco, align: 'direita' });
      } else {
        doc.texto(col.rotulo, x + 7, doc.y + 6.5, { tam: 8.5, bold: true, cor: COR.branco });
      }
      x += col.largura;
    }
  }

  function linhaTabela(doc, valores, indice, destaque) {
    var alturaLinha = 18;
    if (doc.y - alturaLinha < Y_LIMITE) { doc.novaPagina(); cabecalhoTabela(doc); }
    doc.y -= alturaLinha;
    if (destaque) doc.retangulo(MARG_E, doc.y, UTIL, alturaLinha, COR.softEsc);
    else if (indice % 2 === 1) doc.retangulo(MARG_E, doc.y, UTIL, alturaLinha, COR.soft);
    var x = MARG_E;
    for (var i = 0; i < COLUNAS.length; i++) {
      var col = COLUNAS[i];
      var v = valores[col.chave];
      if (v !== undefined && v !== null && v !== '') {
        var op = { tam: 9, bold: !!destaque, cor: destaque ? COR.navy : COR.texto };
        if (col.align === 'dir') { op.align = 'direita'; doc.texto(v, x + col.largura - 7, doc.y + 5.5, op); }
        else doc.texto(v, x + 7, doc.y + 5.5, op);
      }
      x += col.largura;
    }
    doc.linha(MARG_E, doc.y, MARG_D, doc.y, COR.fio, 0.4);
  }

  /* dados = resultado de Core.calcularFechamento
   * opcoes = { incluirNotas: bool, notas: [{data, paginas:[...]}], imagens: {ref:{bytes,w,h}} } */
  function gerarFechamento(dados, opcoes) {
    opcoes = opcoes || {};
    var doc = new Doc();
    doc.novaPagina();

    // titulo
    doc.y -= 26;
    doc.texto('Controle de aulas', PAGINA_L / 2, doc.y, { tam: 19, bold: true, cor: COR.navy, align: 'centro' });
    doc.y -= 12;
    doc.texto(dados.mesExtenso, PAGINA_L / 2, doc.y, { tam: 10, cor: COR.teal, align: 'centro', tracking: 1.1 });

    // bloco de identificacao
    doc.y -= 22;
    var linhasId = [];
    linhasId.push(['Aluno', dados.alunoNome]);
    if (dados.responsavel) linhasId.push(['Responsável', dados.responsavel]);
    if (dados.grade) linhasId.push(['Dias e horário', dados.grade]);
    var alturaBloco = 14 + linhasId.length * 15;
    doc.y -= alturaBloco;
    doc.retangulo(MARG_E, doc.y, UTIL, alturaBloco, COR.soft);
    doc.retangulo(MARG_E, doc.y, 3, alturaBloco, COR.teal);
    var yy = doc.y + alturaBloco - 15;
    for (var i = 0; i < linhasId.length; i++) {
      doc.texto(linhasId[i][0] + ':', MARG_E + 14, yy, { tam: 9.5, bold: true, cor: COR.navy });
      doc.texto(linhasId[i][1], MARG_E + 96, yy, { tam: 9.5, cor: COR.texto });
      yy -= 15;
    }

    // tabela
    doc.y -= 24;
    doc.texto('Datas trabalhadas', MARG_E, doc.y, { tam: 11.5, bold: true, cor: COR.navy });
    doc.y -= 6;
    cabecalhoTabela(doc);

    var linhas = dados.linhas || [];
    for (var j = 0; j < linhas.length; j++) {
      var l = linhas[j];
      linhaTabela(doc, {
        data: ddmmL(l.data),
        dia: l.dia,
        hora: l.hora || '',
        dur: fmtDur(l.duracaoMin),
        situacao: l.statusRotulo + (l.cobravel ? '' : ' (não cobrada)'),
        vh: l.valorHora !== null ? fmtMoedaLocal(l.valorHora) : 'sem preço',
        valor: fmtMoedaLocal(l.cobravel ? l.valor : 0)
      }, j, false);
    }
    if (!linhas.length) {
      doc.y -= 18;
      doc.texto('Nenhuma aula registrada neste mês.', MARG_E + 7, doc.y + 5.5, { tam: 9, cor: COR.muted });
    }

    // total
    linhaTabela(doc, {
      data: 'Total',
      dur: dados.totalHoras + ' h',
      situacao: dados.qtdEncontros + ' encontro' + (dados.qtdEncontros === 1 ? '' : 's'),
      vh: dados.precoUnico !== null ? fmtMoedaLocal(dados.precoUnico) : 'vários',
      valor: fmtMoedaLocal(dados.totalValor)
    }, 0, true);

    // composicao por faixa, quando houve reajuste no mes
    if (dados.faixas && dados.faixas.length > 1) {
      doc.y -= 16;
      doc.texto('Composição por valor vigente:', MARG_E, doc.y, { tam: 9, bold: true, cor: COR.navy });
      for (var k = 0; k < dados.faixas.length; k++) {
        var fx = dados.faixas[k];
        doc.y -= 13;
        var h = Math.floor(fx.minutos / 60) + ':' + (fx.minutos % 60 < 10 ? '0' : '') + (fx.minutos % 60);
        doc.texto(h + ' h a ' + fmtMoedaLocal(fx.valorHora) + ' por hora: ' + fmtMoedaLocal(fx.valor),
          MARG_E + 12, doc.y, { tam: 9, cor: COR.texto });
      }
    }
    if (dados.minutosNaoCobrados > 0) {
      doc.y -= 15;
      var hn = Math.floor(dados.minutosNaoCobrados / 60) + ':' +
        (dados.minutosNaoCobrados % 60 < 10 ? '0' : '') + (dados.minutosNaoCobrados % 60);
      doc.texto('Horas não cobradas no mês: ' + hn + ' h.', MARG_E, doc.y, { tam: 9, cor: COR.muted });
    }
    if (dados.semPreco && dados.semPreco.length) {
      doc.y -= 15;
      doc.texto('Atenção: sem valor por hora vigente em ' + dados.semPreco.map(ddmmL).join(', ') + '.',
        MARG_E, doc.y, { tam: 9, bold: true, cor: COR.gold });
    }

    // resumo do mes
    var resumo = (dados.resumoTexto || '').trim();
    if (resumo || opcoes.sempreResumo) {
      doc.y -= 28;
      doc.garanteEspaco(46);
      doc.texto('Resumo do mês', MARG_E, doc.y, { tam: 11.5, bold: true, cor: COR.navy });
      doc.y -= 4;
      doc.linha(MARG_E, doc.y, MARG_E + 70, doc.y, COR.teal, 1.2);
      doc.y -= 8;
      doc.paragrafo(resumo || ' ', { tam: 10.5, alturaLinha: 15.5 });
    }

    // folhas de aula
    if (opcoes.incluirNotas && opcoes.notas && opcoes.notas.length) {
      for (var n = 0; n < opcoes.notas.length; n++) {
        var nota = opcoes.notas[n];
        var pgs = nota.paginas || [];
        for (var p = 0; p < pgs.length; p++) {
          doc.novaPagina({ semMarca: true });
          doc.texto('Folha de aula · ' + ddmmL(nota.data) +
            (pgs.length > 1 ? ' (' + (p + 1) + '/' + pgs.length + ')' : ''),
            MARG_E, doc.y + 12, { tam: 9.5, bold: true, cor: COR.teal });
          doc.y -= 6;
          desenhaNota(doc, pgs[p], opcoes.imagens || {});
        }
      }
    }

    return doc.finalizar();
  }

  /* Resumo do mes inteiro, uma pagina com todos os alunos. */
  function gerarResumoMes(fechs, mesExtenso) {
    var doc = new Doc();
    doc.novaPagina();
    doc.y -= 26;
    doc.texto('Fechamento do mês', PAGINA_L / 2, doc.y, { tam: 19, bold: true, cor: COR.navy, align: 'centro' });
    doc.y -= 12;
    doc.texto(mesExtenso, PAGINA_L / 2, doc.y, { tam: 10, cor: COR.teal, align: 'centro', tracking: 1.1 });
    doc.y -= 30;

    var cols = [
      { rotulo: 'Aluno', largura: 200, align: 'esq' },
      { rotulo: 'Encontros', largura: 85, align: 'dir' },
      { rotulo: 'Horas', largura: 85, align: 'dir' },
      { rotulo: 'Valor', largura: 145.2756, align: 'dir' }
    ];
    function cab() {
      doc.y -= 20;
      doc.retangulo(MARG_E, doc.y, UTIL, 20, COR.navy);
      var x = MARG_E;
      cols.forEach(function (c) {
        if (c.align === 'dir') doc.texto(c.rotulo, x + c.largura - 8, doc.y + 6.5, { tam: 8.5, bold: true, cor: COR.branco, align: 'direita' });
        else doc.texto(c.rotulo, x + 8, doc.y + 6.5, { tam: 8.5, bold: true, cor: COR.branco });
        x += c.largura;
      });
    }
    function lin(vals, i, destaque) {
      if (doc.y - 19 < Y_LIMITE) { doc.novaPagina(); cab(); }
      doc.y -= 19;
      if (destaque) doc.retangulo(MARG_E, doc.y, UTIL, 19, COR.softEsc);
      else if (i % 2 === 1) doc.retangulo(MARG_E, doc.y, UTIL, 19, COR.soft);
      var x = MARG_E;
      cols.forEach(function (c, k) {
        var op = { tam: 9.5, bold: !!destaque, cor: destaque ? COR.navy : COR.texto };
        if (c.align === 'dir') { op.align = 'direita'; doc.texto(vals[k], x + c.largura - 8, doc.y + 6, op); }
        else doc.texto(vals[k], x + 8, doc.y + 6, op);
        x += c.largura;
      });
      doc.linha(MARG_E, doc.y, MARG_D, doc.y, COR.fio, 0.4);
    }
    cab();
    var tm = 0, tv = 0, te = 0;
    fechs.forEach(function (f, i) {
      tm += f.totalMin; tv += f.totalValor; te += f.qtdEncontros;
      lin([f.alunoNome, String(f.qtdEncontros), f.totalHoras + ' h', fmtMoedaLocal(f.totalValor)], i, false);
    });
    var th = Math.floor(tm / 60) + ':' + (tm % 60 < 10 ? '0' : '') + (tm % 60);
    lin(['Total', String(te), th + ' h', fmtMoedaLocal(tv)], 0, true);

    doc.y -= 24;
    doc.texto('Alunos ativos no mês: ' + fechs.length + '.', MARG_E, doc.y, { tam: 9.5, cor: COR.muted });
    doc.y -= 14;
    doc.texto('Valor médio por hora no mês: ' + (tm > 0 ? fmtMoedaLocal(tv / (tm / 60)) : fmtMoedaLocal(0)) + '.',
      MARG_E, doc.y, { tam: 9.5, cor: COR.muted });
    return doc.finalizar();
  }

  return {
    Doc: Doc, COR: COR, medir: medir, paraWinAnsi: paraWinAnsi,
    gerarFechamento: gerarFechamento, gerarResumoMes: gerarResumoMes,
    NOTA_L: NOTA_L, NOTA_A: NOTA_A,
    PAGINA_L: PAGINA_L, PAGINA_A: PAGINA_A, MARG_E: MARG_E, MARG_D: MARG_D, UTIL: UTIL
  };
});
