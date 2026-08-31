/* draw.js
 * Editor da folha de aula: escrita à mão com a S Pen, imagem colada e texto digitado.
 *
 * Ergonomia igual à do Samsung Notes, de propósito:
 *   caneta  escreve
 *   dedo    arrasta a folha, e com dois dedos aproxima ou afasta
 * Assim a mão apoiada na tela nunca risca a folha.
 *
 * O conteúdo é guardado em vetor, não em imagem. É o que faz a letra dela
 * sair nítida no PDF do fechamento, em qualquer tamanho.
 */
(function (root) {
  'use strict';

  var FOLHA_L = 1000, FOLHA_A = 1343;   // mesma proporção da área útil do PDF

  var PALETA = [
    { nome: 'Preto', cor: '#1A1C1F' },
    { nome: 'Azul', cor: '#1F3A5F' },
    { nome: 'Verde', cor: '#2E7D6B' },
    { nome: 'Dourado', cor: '#C9A961' },
    { nome: 'Vermelho', cor: '#B4453C' }
  ];
  var ESPESSURAS = [
    { nome: 'Fina', valor: 2.2 },
    { nome: 'Média', valor: 4 },
    { nome: 'Grossa', valor: 7 }
  ];

  function paginaVazia(fundo) {
    return { fundo: fundo || 'pautado', itens: [] };
  }

  function notaVazia(fundo) {
    return { paginas: [paginaVazia(fundo)] };
  }

  function Editor(canvas, opcoes) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.opcoes = opcoes || {};
    this.nota = this.opcoes.nota || notaVazia();
    this.indicePagina = 0;

    this.ferramenta = 'caneta';       // caneta | marcatexto | borracha | texto | selecao
    this.cor = PALETA[0].cor;
    this.espessura = ESPESSURAS[1].valor;

    this.escala = 1;
    this.deslocX = 0;
    this.deslocY = 0;

    this.tracoAtual = null;
    this.ponteiros = {};
    this.selecionado = null;
    this.arrasto = null;
    this.pilhaDesfazer = [];
    this.pilhaRefazer = [];
    this.midias = this.opcoes.midias || {};   // ref -> { dataUrl, w, h, img }

    this.precisaRedesenhar = true;
    this.cacheValido = false;
    this.offscreen = document.createElement('canvas');

    this._ligarEventos();
    this.ajustarTamanho();
    if (typeof ResizeObserver !== 'undefined') {
      var self = this;
      this._observador = new ResizeObserver(function () { self.ajustarTamanho(); });
      this._observador.observe(canvas);
    }
    this._laco();
  }

  Editor.prototype.pagina = function () { return this.nota.paginas[this.indicePagina]; };

  // ---------- geometria ----------

  Editor.prototype.ajustarTamanho = function () {
    var r = this.canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
    this.dpr = dpr;
    this.larguraVista = r.width;
    this.alturaVista = r.height;
    this.offscreen.width = this.canvas.width;
    this.offscreen.height = this.canvas.height;
    // Enquanto ela não tiver ajustado o zoom na mão, a folha continua
    // se encaixando sozinha. É o que faz a folha caber inteira quando o
    // painel termina de abrir e só então ganha a altura definitiva.
    if (!this.zoomManual) this.ajustarNaTela();
    this.cacheValido = false;
    this.precisaRedesenhar = true;
  };

  Editor.prototype.ajustarNaTela = function () {
    this.zoomManual = false;
    var margem = 8;
    var ex = (this.larguraVista - margem * 2) / FOLHA_L;
    var ey = (this.alturaVista - margem * 2) / FOLHA_A;
    this.escala = Math.min(ex, ey);
    this.deslocX = (this.larguraVista - FOLHA_L * this.escala) / 2;
    this.deslocY = (this.alturaVista - FOLHA_A * this.escala) / 2;
    this.cacheValido = false;
    this.precisaRedesenhar = true;
  };

  Editor.prototype.zoom = function (fator, cx, cy) {
    this.zoomManual = true;
    var antes = this.escala;
    var nova = Math.max(0.15, Math.min(6, this.escala * fator));
    if (nova === antes) return;
    if (cx === undefined) { cx = this.larguraVista / 2; cy = this.alturaVista / 2; }
    this.deslocX = cx - (cx - this.deslocX) * (nova / antes);
    this.deslocY = cy - (cy - this.deslocY) * (nova / antes);
    this.escala = nova;
    this.cacheValido = false;
    this.precisaRedesenhar = true;
  };

  Editor.prototype.paraFolha = function (x, y) {
    return { x: (x - this.deslocX) / this.escala, y: (y - this.deslocY) / this.escala };
  };

  Editor.prototype.posicaoDoEvento = function (e) {
    var r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  // ---------- desfazer ----------

  Editor.prototype.marcarPonto = function () {
    this.pilhaDesfazer.push(JSON.stringify(this.nota));
    if (this.pilhaDesfazer.length > 40) this.pilhaDesfazer.shift();
    this.pilhaRefazer.length = 0;
    this._avisarMudanca();
  };

  Editor.prototype.desfazer = function () {
    if (!this.pilhaDesfazer.length) return;
    this.pilhaRefazer.push(JSON.stringify(this.nota));
    this.nota = JSON.parse(this.pilhaDesfazer.pop());
    if (this.indicePagina >= this.nota.paginas.length) this.indicePagina = this.nota.paginas.length - 1;
    this.selecionado = null;
    this.cacheValido = false; this.precisaRedesenhar = true;
    this._avisarMudanca();
  };

  Editor.prototype.refazer = function () {
    if (!this.pilhaRefazer.length) return;
    this.pilhaDesfazer.push(JSON.stringify(this.nota));
    this.nota = JSON.parse(this.pilhaRefazer.pop());
    if (this.indicePagina >= this.nota.paginas.length) this.indicePagina = this.nota.paginas.length - 1;
    this.selecionado = null;
    this.cacheValido = false; this.precisaRedesenhar = true;
    this._avisarMudanca();
  };

  Editor.prototype._avisarMudanca = function () {
    if (this.opcoes.aoMudar) this.opcoes.aoMudar(this.nota);
  };

  // ---------- páginas ----------

  Editor.prototype.novaPagina = function () {
    this.marcarPonto();
    this.nota.paginas.splice(this.indicePagina + 1, 0, paginaVazia(this.pagina().fundo));
    this.indicePagina++;
    this.selecionado = null;
    this.cacheValido = false; this.precisaRedesenhar = true;
  };

  Editor.prototype.removerPagina = function () {
    if (this.nota.paginas.length <= 1) {
      this.marcarPonto();
      this.pagina().itens = [];
      this.cacheValido = false; this.precisaRedesenhar = true;
      return;
    }
    this.marcarPonto();
    this.nota.paginas.splice(this.indicePagina, 1);
    if (this.indicePagina >= this.nota.paginas.length) this.indicePagina = this.nota.paginas.length - 1;
    this.selecionado = null;
    this.cacheValido = false; this.precisaRedesenhar = true;
  };

  Editor.prototype.irParaPagina = function (i) {
    if (i < 0 || i >= this.nota.paginas.length) return;
    this.indicePagina = i;
    this.selecionado = null;
    this.cacheValido = false; this.precisaRedesenhar = true;
  };

  Editor.prototype.trocarFundo = function (fundo) {
    this.marcarPonto();
    this.pagina().fundo = fundo;
    this.cacheValido = false; this.precisaRedesenhar = true;
  };

  // ---------- itens ----------

  Editor.prototype.adicionarTexto = function (txt, x, y, tam) {
    if (!txt) return;
    this.marcarPonto();
    this.pagina().itens.push({
      t: 'texto', x: x, y: y, tam: tam || 30, cor: this.cor, txt: txt
    });
    // Volta para a caneta: escrever à mão é o uso normal, e assim ela nunca
    // fica presa abrindo o painel de texto a cada toque.
    this.ferramenta = 'caneta';
    this.cacheValido = false; this.precisaRedesenhar = true;
    if (this.opcoes.aoTrocarFerramenta) this.opcoes.aoTrocarFerramenta('caneta');
  };

  /* A imagem entra centralizada e proporcional, ocupando no máximo 70% da folha. */
  Editor.prototype.adicionarImagem = function (ref, larguraPx, alturaPx) {
    this.marcarPonto();
    var maxL = FOLHA_L * 0.7, maxA = FOLHA_A * 0.5;
    var escala = Math.min(maxL / larguraPx, maxA / alturaPx, 1);
    var l = larguraPx * escala, a = alturaPx * escala;
    var item = {
      t: 'imagem', ref: ref,
      x: (FOLHA_L - l) / 2, y: Math.max(40, (FOLHA_A - a) / 3),
      w: l, h: a
    };
    this.pagina().itens.push(item);
    this.selecionado = item;
    this.ferramenta = 'selecao';
    this.cacheValido = false; this.precisaRedesenhar = true;
    if (this.opcoes.aoTrocarFerramenta) this.opcoes.aoTrocarFerramenta('selecao');
    return item;
  };

  Editor.prototype.registrarMidia = function (ref, dataUrl, w, h) {
    var img = new Image();
    var self = this;
    img.onload = function () { self.cacheValido = false; self.precisaRedesenhar = true; };
    img.src = dataUrl;
    this.midias[ref] = { dataUrl: dataUrl, w: w, h: h, img: img };
  };

  Editor.prototype.removerSelecionado = function () {
    if (!this.selecionado) return;
    this.marcarPonto();
    var itens = this.pagina().itens;
    var i = itens.indexOf(this.selecionado);
    if (i >= 0) itens.splice(i, 1);
    this.selecionado = null;
    this.cacheValido = false; this.precisaRedesenhar = true;
  };

  Editor.prototype.itemEm = function (p) {
    var itens = this.pagina().itens;
    for (var i = itens.length - 1; i >= 0; i--) {
      var it = itens[i];
      if (it.t === 'imagem' && p.x >= it.x && p.x <= it.x + it.w && p.y >= it.y && p.y <= it.y + it.h) return it;
      if (it.t === 'texto') {
        var alturaAprox = it.tam * 1.3;
        var larguraAprox = it.txt.length * it.tam * 0.52;
        if (p.x >= it.x - 6 && p.x <= it.x + larguraAprox && p.y >= it.y - 4 && p.y <= it.y + alturaAprox) return it;
      }
    }
    return null;
  };

  /* A borracha remove o traço inteiro que encostar. É mais previsível
   * do que apagar pedaço por pedaço numa tela pequena. */
  Editor.prototype.apagarEm = function (p, raio) {
    var itens = this.pagina().itens;
    var removeu = false;
    for (var i = itens.length - 1; i >= 0; i--) {
      var it = itens[i];
      if (it.t !== 'traco') continue;
      for (var j = 0; j < it.pontos.length; j++) {
        var dx = it.pontos[j][0] - p.x, dy = it.pontos[j][1] - p.y;
        if (dx * dx + dy * dy <= raio * raio) { itens.splice(i, 1); removeu = true; break; }
      }
    }
    if (removeu) { this.cacheValido = false; this.precisaRedesenhar = true; }
    return removeu;
  };

  // ---------- eventos ----------

  /* A tela de desenho é sempre o mesmo elemento, reaproveitado a cada folha
   * que ela abre. Por isso todos os ouvintes ficam presos a um AbortController:
   * ao fechar a folha eles são removidos de uma vez. Sem isso, o editor da folha
   * anterior continuaria escutando os toques junto com o novo, e a ferramenta
   * antiga voltaria a agir sozinha. */
  Editor.prototype._ligarEventos = function () {
    var self = this;
    var c = this.canvas;
    c.style.touchAction = 'none';

    this._parador = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var sinal = this._parador ? { signal: this._parador.signal } : undefined;
    var sinalAtivo = this._parador ? { signal: this._parador.signal, passive: false } : { passive: false };

    c.addEventListener('pointerdown', function (e) { self._aoDescer(e); }, sinal);
    c.addEventListener('pointermove', function (e) { self._aoMover(e); }, sinal);
    c.addEventListener('pointerup', function (e) { self._aoSubir(e); }, sinal);
    c.addEventListener('pointercancel', function (e) { self._aoSubir(e); }, sinal);
    c.addEventListener('pointerleave', function (e) { self._aoSubir(e); }, sinal);
    c.addEventListener('contextmenu', function (e) { e.preventDefault(); }, sinal);
    c.addEventListener('wheel', function (e) {
      e.preventDefault();
      var p = self.posicaoDoEvento(e);
      self.zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, p.x, p.y);
    }, sinalAtivo);
  };

  Editor.prototype._eDedo = function (e) { return e.pointerType === 'touch'; };

  Editor.prototype._aoDescer = function (e) {
    if (this.destruido) return;
    var pos = this.posicaoDoEvento(e);
    this.ponteiros[e.pointerId] = { x: pos.x, y: pos.y, tipo: e.pointerType };
    var dedos = Object.keys(this.ponteiros).filter(function (k) { return true; });

    if (this._eDedo(e)) {
      // dedo nunca desenha: move a folha, e com dois dedos dá zoom
      this._cancelarTraco();
      if (dedos.length === 2) this._iniciarPinca();
      return;
    }

    var p = this.paraFolha(pos.x, pos.y);

    // O texto abre um painel próprio: prender o ponteiro aqui deixaria a tela de
    // desenho recebendo todos os toques seguintes, inclusive os dos botões.
    if (this.ferramenta === 'texto') {
      delete this.ponteiros[e.pointerId];
      if (this.opcoes.aoPedirTexto) this.opcoes.aoPedirTexto(p);
      return;
    }

    try { this.canvas.setPointerCapture(e.pointerId); } catch (err) { /* sem captura, segue */ }
    if (this.ferramenta === 'borracha') {
      this.marcarPonto();
      this.apagando = true;
      this.apagarEm(p, 14 / this.escala + 6);
      return;
    }
    if (this.ferramenta === 'selecao') {
      var alvo = this.itemEm(p);
      this.selecionado = alvo;
      if (alvo) {
        var alca = this._alcaEm(p, alvo);
        this.marcarPonto();
        this.arrasto = { item: alvo, ox: p.x, oy: p.y, ix: alvo.x, iy: alvo.y, alca: alca, iw: alvo.w, ih: alvo.h };
      }
      this.precisaRedesenhar = true;
      return;
    }

    // caneta e marca-texto
    this.marcarPonto();
    var base = this.ferramenta === 'marcatexto' ? this.espessura * 3.2 : this.espessura;
    this.tracoAtual = {
      t: 'traco',
      cor: this.cor,
      marcatexto: this.ferramenta === 'marcatexto',
      pontos: [[p.x, p.y, this._espessuraDe(e, base)]]
    };
    this.pagina().itens.push(this.tracoAtual);
    this.precisaRedesenhar = true;
  };

  Editor.prototype._espessuraDe = function (e, base) {
    var pressao = (e.pressure && e.pressure > 0 && e.pressure < 1) ? e.pressure : 0.5;
    if (e.pointerType === 'mouse') pressao = 0.5;
    return base * (0.45 + 1.15 * pressao);
  };

  Editor.prototype._iniciarPinca = function () {
    var ids = Object.keys(this.ponteiros);
    if (ids.length < 2) return;
    var a = this.ponteiros[ids[0]], b = this.ponteiros[ids[1]];
    this.pinca = {
      dist: Math.hypot(a.x - b.x, a.y - b.y),
      cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2
    };
  };

  Editor.prototype._aoMover = function (e) {
    if (this.destruido) return;
    var pos = this.posicaoDoEvento(e);
    var anterior = this.ponteiros[e.pointerId];
    if (!anterior) return;

    if (this._eDedo(e)) {
      var ids = Object.keys(this.ponteiros);
      this.ponteiros[e.pointerId] = { x: pos.x, y: pos.y, tipo: 'touch' };
      if (ids.length >= 2 && this.pinca) {
        var a = this.ponteiros[ids[0]], b = this.ponteiros[ids[1]];
        var dist = Math.hypot(a.x - b.x, a.y - b.y);
        var cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
        if (this.pinca.dist > 0) this.zoom(dist / this.pinca.dist, cx, cy);
        this.deslocX += cx - this.pinca.cx;
        this.deslocY += cy - this.pinca.cy;
        this.pinca = { dist: dist, cx: cx, cy: cy };
        this.cacheValido = false; this.precisaRedesenhar = true;
      } else {
        this.deslocX += pos.x - anterior.x;
        this.deslocY += pos.y - anterior.y;
        this.zoomManual = true;
        this.cacheValido = false; this.precisaRedesenhar = true;
      }
      return;
    }

    this.ponteiros[e.pointerId] = { x: pos.x, y: pos.y, tipo: e.pointerType };
    var p = this.paraFolha(pos.x, pos.y);

    if (this.apagando) { this.apagarEm(p, 14 / this.escala + 6); return; }

    if (this.arrasto) {
      var d = this.arrasto;
      if (d.alca && d.item.t === 'imagem') {
        var nw = Math.max(40, d.iw + (p.x - d.ox));
        var proporcao = d.ih / d.iw;
        d.item.w = nw;
        d.item.h = nw * proporcao;
      } else {
        d.item.x = d.ix + (p.x - d.ox);
        d.item.y = d.iy + (p.y - d.oy);
      }
      this.cacheValido = false; this.precisaRedesenhar = true;
      return;
    }

    if (this.tracoAtual) {
      var pts = this.tracoAtual.pontos;
      var ult = pts[pts.length - 1];
      // ignora micro movimento, para o traço não ficar pesado à toa
      if (Math.hypot(p.x - ult[0], p.y - ult[1]) < 1.2 / this.escala) return;
      var base = this.tracoAtual.marcatexto ? this.espessura * 3.2 : this.espessura;
      pts.push([p.x, p.y, this._espessuraDe(e, base)]);
      this.precisaRedesenhar = true;
    }
  };

  Editor.prototype._aoSubir = function (e) {
    if (this.destruido) return;
    if (this.ponteiros[e.pointerId]) delete this.ponteiros[e.pointerId];
    if (Object.keys(this.ponteiros).length < 2) this.pinca = null;
    try { this.canvas.releasePointerCapture(e.pointerId); } catch (err) { /* nada a fazer */ }

    if (this.tracoAtual) {
      if (this.tracoAtual.pontos.length < 2) {
        // toque seco vira um ponto redondo
        this.tracoAtual.pontos.push([
          this.tracoAtual.pontos[0][0] + 0.6,
          this.tracoAtual.pontos[0][1],
          this.tracoAtual.pontos[0][2]
        ]);
      }
      this.tracoAtual = null;
      this.cacheValido = false;
      this._avisarMudanca();
    }
    if (this.apagando) { this.apagando = false; this._avisarMudanca(); }
    if (this.arrasto) { this.arrasto = null; this._avisarMudanca(); }
    this.precisaRedesenhar = true;
  };

  Editor.prototype._cancelarTraco = function () {
    if (!this.tracoAtual) return;
    var itens = this.pagina().itens;
    var i = itens.indexOf(this.tracoAtual);
    if (i >= 0) itens.splice(i, 1);
    this.tracoAtual = null;
    if (this.pilhaDesfazer.length) this.pilhaDesfazer.pop();
    this.cacheValido = false; this.precisaRedesenhar = true;
  };

  Editor.prototype._alcaEm = function (p, item) {
    if (item.t !== 'imagem') return null;
    var tol = 22 / this.escala;
    return (Math.abs(p.x - (item.x + item.w)) < tol && Math.abs(p.y - (item.y + item.h)) < tol);
  };

  // ---------- desenho ----------

  Editor.prototype._laco = function () {
    var self = this;
    function quadro() {
      if (self.precisaRedesenhar) { self.desenhar(); self.precisaRedesenhar = false; }
      self._raf = requestAnimationFrame(quadro);
    }
    quadro();
  };

  Editor.prototype.destruir = function () {
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    if (this._observador) { this._observador.disconnect(); this._observador = null; }
    if (this._parador) { this._parador.abort(); this._parador = null; }
    this.destruido = true;
    // solta qualquer ponteiro que tenha ficado preso na tela de desenho
    var self = this;
    Object.keys(this.ponteiros).forEach(function (id) {
      try { self.canvas.releasePointerCapture(+id); } catch (e) { /* já solto */ }
    });
    this.ponteiros = {};
    this.tracoAtual = null;
  };

  Editor.prototype.desenhar = function () {
    var ctx = this.ctx;
    var dpr = this.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#DDE3EA';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.save();
    ctx.translate(this.deslocX, this.deslocY);
    ctx.scale(this.escala, this.escala);

    // folha
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(20,40,70,0.18)';
    ctx.shadowBlur = 14 / this.escala;
    ctx.shadowOffsetY = 3 / this.escala;
    ctx.fillRect(0, 0, FOLHA_L, FOLHA_A);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    this._desenharFundo(ctx);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, FOLHA_L, FOLHA_A);
    ctx.clip();
    var itens = this.pagina().itens;
    for (var i = 0; i < itens.length; i++) this._desenharItem(ctx, itens[i]);
    ctx.restore();

    if (this.selecionado) this._desenharSelecao(ctx, this.selecionado);
    ctx.restore();
  };

  Editor.prototype._desenharFundo = function (ctx) {
    var p = this.pagina();
    if (p.fundo === 'pautado') {
      ctx.strokeStyle = '#C9D2DD';
      ctx.lineWidth = 1;
      var passo = FOLHA_A / 26;
      ctx.beginPath();
      for (var i = 1; i < 26; i++) {
        var y = i * passo;
        ctx.moveTo(8, y); ctx.lineTo(FOLHA_L - 8, y);
      }
      ctx.stroke();
    } else if (p.fundo === 'pontilhado') {
      ctx.fillStyle = '#C9D2DD';
      var pc = FOLHA_L / 22;
      for (var x = pc; x < FOLHA_L - 1; x += pc) {
        for (var y2 = pc; y2 < FOLHA_A - 1; y2 += pc) {
          ctx.fillRect(x - 1, y2 - 1, 2, 2);
        }
      }
    }
  };

  Editor.prototype._desenharItem = function (ctx, it) {
    if (it.t === 'traco') {
      var pts = it.pontos;
      if (!pts.length) return;
      ctx.strokeStyle = it.cor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = it.marcatexto ? 0.32 : 1;
      if (pts.length === 1) {
        ctx.fillStyle = it.cor;
        ctx.beginPath();
        ctx.arc(pts[0][0], pts[0][1], Math.max(0.5, pts[0][2] / 2), 0, Math.PI * 2);
        ctx.fill();
      } else {
        for (var i = 1; i < pts.length; i++) {
          ctx.lineWidth = Math.max(0.4, (pts[i - 1][2] + pts[i][2]) / 2);
          ctx.beginPath();
          ctx.moveTo(pts[i - 1][0], pts[i - 1][1]);
          ctx.lineTo(pts[i][0], pts[i][1]);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      return;
    }
    if (it.t === 'imagem') {
      var m = this.midias[it.ref];
      if (m && m.img && m.img.complete) {
        ctx.drawImage(m.img, it.x, it.y, it.w, it.h);
      } else {
        ctx.fillStyle = '#EFF3F7';
        ctx.fillRect(it.x, it.y, it.w, it.h);
        ctx.strokeStyle = '#C9D2DD';
        ctx.lineWidth = 2;
        ctx.strokeRect(it.x, it.y, it.w, it.h);
      }
      return;
    }
    if (it.t === 'texto') {
      ctx.fillStyle = it.cor;
      ctx.font = it.tam + 'px Helvetica, Arial, sans-serif';
      ctx.textBaseline = 'top';
      var linhas = String(it.txt).split('\n');
      for (var j = 0; j < linhas.length; j++) {
        ctx.fillText(linhas[j], it.x, it.y + j * it.tam * 1.3);
      }
    }
  };

  Editor.prototype._desenharSelecao = function (ctx, it) {
    var x = it.x, y = it.y, w, h;
    if (it.t === 'imagem') { w = it.w; h = it.h; }
    else { w = String(it.txt).length * it.tam * 0.52; h = it.tam * 1.3 * String(it.txt).split('\n').length; }
    ctx.strokeStyle = '#2E7D6B';
    ctx.lineWidth = 2 / this.escala;
    ctx.setLineDash([8 / this.escala, 5 / this.escala]);
    ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
    ctx.setLineDash([]);
    if (it.t === 'imagem') {
      ctx.fillStyle = '#2E7D6B';
      var r = 9 / this.escala;
      ctx.beginPath();
      ctx.arc(x + w, y + h, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  /* Miniatura para a lista de aulas. */
  Editor.miniatura = function (nota, midias, largura) {
    var c = document.createElement('canvas');
    var alt = Math.round(largura * FOLHA_A / FOLHA_L);
    c.width = largura; c.height = alt;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, largura, alt);
    if (!nota || !nota.paginas || !nota.paginas.length) return c;
    var esc = largura / FOLHA_L;
    ctx.scale(esc, esc);
    var itens = nota.paginas[0].itens || [];
    itens.forEach(function (it) {
      if (it.t === 'traco' && it.pontos.length > 1) {
        ctx.strokeStyle = it.cor;
        ctx.lineCap = 'round';
        ctx.globalAlpha = it.marcatexto ? 0.32 : 1;
        ctx.lineWidth = it.pontos[0][2];
        ctx.beginPath();
        ctx.moveTo(it.pontos[0][0], it.pontos[0][1]);
        for (var i = 1; i < it.pontos.length; i++) ctx.lineTo(it.pontos[i][0], it.pontos[i][1]);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (it.t === 'imagem') {
        var m = midias && midias[it.ref];
        if (m && m.img && m.img.complete) ctx.drawImage(m.img, it.x, it.y, it.w, it.h);
        else { ctx.fillStyle = '#EFF3F7'; ctx.fillRect(it.x, it.y, it.w, it.h); }
      } else if (it.t === 'texto') {
        ctx.fillStyle = it.cor;
        ctx.font = it.tam + 'px Helvetica, Arial, sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillText(String(it.txt).split('\n')[0], it.x, it.y);
      }
    });
    return c;
  };

  root.Draw = {
    Editor: Editor, PALETA: PALETA, ESPESSURAS: ESPESSURAS,
    FOLHA_L: FOLHA_L, FOLHA_A: FOLHA_A,
    notaVazia: notaVazia, paginaVazia: paginaVazia
  };
})(typeof self !== 'undefined' ? self : this);
