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

  /* A ORDEM DAS CAMADAS, e ela é a mesma no canvas e no PDF.
   *
   * O pdf.js sempre desenhou a folha em camadas (imagem, depois texto, depois
   * traço) enquanto o canvas desenhava na ordem do vetor. Quem manda é o PDF,
   * porque é ele que ela imprime, e a diferença ficava invisível até existir um
   * item cuja função é COBRIR: um retângulo que tapa no canvas e não tapa na
   * folha impressa seria a tela mentindo sobre o que vai sair. Por isso o
   * canvas passou a seguir a mesma ordem, e a lista está escrita num lugar só,
   * exportada, para a prova poder comparar os dois lados em vez de acreditar.
   *
   * `tapar` entra logo depois da imagem: ele existe para cobrir o recorte da
   * fonte, e nunca cobre o que ela escreveu por cima. Para tirar o que é dela
   * existe a borracha. */
  var ORDEM_CAMADAS = ['imagem', 'tapar', 'texto', 'traco'];

  var TAPAR_MINIMO = 12;        // menor que isto é toque seco, e não retângulo

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
    // tirar pela lixeira é mudança como qualquer outra: quem grava a folha precisa saber
    if (i >= 0) this._avisarMudanca();
  };

  /* O retângulo que tapa. Nasce arrastando, como o traço, e não centralizado
   * como a imagem: ela precisa pôr o branco exatamente em cima do pedaço errado
   * do enunciado, e um retângulo que nasce no meio da folha obrigaria a
   * arrastar e redimensionar depois de cada toque. */
  /* O RETÂNGULO FICA DENTRO DA FOLHA NOS TRÊS CAMINHOS: criar, mover e
   * redimensionar.
   *
   * O canvas desenha dentro de um `clip()` da folha e o PDF não recorta nada,
   * então um retângulo fora da folha aparece aparado na tela e sai INTEIRO no
   * papel, por cima do cabeçalho "Folha de aula". A tela mente sobre o que vai
   * sair, que é o que a unificação das camadas existe para impedir.
   *
   * A PRIMEIRA ESCRITA APAROU SÓ NA CRIAÇÃO, e o comentário dela afirmava que
   * isso "vale para os dois desenhos de uma vez". Valia para um caminho de
   * três: depois de criado, o item era livre, e bastava ela selecionar o branco
   * e arrastá-lo para cima da borda para o defeito voltar inteiro. Duas lentes
   * cegas acharam isso sozinhas, e a prova de então não pegava porque o arranjo
   * dela chamava `adicionarTapar` pela API e nunca movia nada.
   *
   * Criar e redimensionar APARAM (o retângulo encolhe na borda, porque é o
   * arrasto que define o tamanho); mover PRENDE (a posição para na borda e o
   * tamanho não muda, porque encolher o que ela já dimensionou seria mudar o
   * desenho dela sem pedir).
   *
   * E NÃO, OS DOIS NÃO DEVIAM SER IGUAIS. Parece inconsistência e não é: são
   * duas perguntas diferentes. No criar e no redimensionar é o ARRASTO que está
   * definindo o tamanho naquele instante, então aparar é obedecer ao que a mão
   * dela está fazendo agora. No mover o tamanho JÁ FOI decidido por ela antes,
   * e encolher ali seria o aplicativo mudar um desenho pronto porque ela
   * arrastou longe demais. Quem uniformizar os dois vai quebrar um dos dois. */
  function aparado(v, minimo, maximo) { return Math.max(minimo, Math.min(maximo, v)); }

  Editor.prototype.adicionarTapar = function (x, y, w, h) {
    var x1 = aparado(x, 0, FOLHA_L), y1 = aparado(y, 0, FOLHA_A);
    var x2 = aparado(x + w, 0, FOLHA_L), y2 = aparado(y + h, 0, FOLHA_A);
    x = Math.min(x1, x2); y = Math.min(y1, y2);
    w = Math.abs(x2 - x1); h = Math.abs(y2 - y1);
    if (w < TAPAR_MINIMO || h < TAPAR_MINIMO) return null;
    this.marcarPonto();
    var item = { t: 'tapar', x: x, y: y, w: w, h: h };
    this.pagina().itens.push(item);
    this.cacheValido = false; this.precisaRedesenhar = true;
    return item;
  };

  /* O QUE ELA PEGA É O QUE ELA VÊ, e por isso este teste de acerto percorre a
   * MESMA ordem em que a folha é pintada, de cima para baixo: a última camada
   * primeiro, e dentro dela o último item primeiro.
   *
   * Percorrer a ordem do vetor, que era o que estava aqui, passou a discordar
   * do desenho no dia em que a pintura virou camadas. O caso que isso quebra é
   * concreto e foi medido: um retângulo que tapa POSTO ANTES de a imagem
   * entrar no vetor aparece POR CIMA dela na folha (a camada do tapar vem
   * depois da imagem) e, pela ordem do vetor, a seleção agarrava a imagem que
   * está por baixo. Ela arrastaria o recorte inteiro tentando mover o branco.
   *
   * Achado pela conferência de uso da orquestradora, e não por teste: a
   * pergunta era se a borracha continuava alcançando o traço depois da mudança
   * de ordem, e a borracha estava certa; quem estava errada era a seleção. */
  Editor.prototype.itemEm = function (p) {
    var itens = this.pagina().itens;
    function pega(it) {
      if (it.t === 'imagem' || it.t === 'tapar') {
        return p.x >= it.x && p.x <= it.x + it.w && p.y >= it.y && p.y <= it.y + it.h;
      }
      if (it.t === 'texto') {
        var alturaAprox = it.tam * 1.3;
        var larguraAprox = String(it.txt).length * it.tam * 0.52;
        return p.x >= it.x - 6 && p.x <= it.x + larguraAprox && p.y >= it.y - 4 && p.y <= it.y + alturaAprox;
      }
      return false;
    }
    for (var c = ORDEM_CAMADAS.length - 1; c >= 0; c--) {
      for (var i = itens.length - 1; i >= 0; i--) {
        var it = itens[i];
        if (it && it.t === ORDEM_CAMADAS[c] && pega(it)) return it;
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
    /* CANCELAR NÃO É SOLTAR. O `pointercancel` ia para o `_aoSubir`, que
     * COMETE o que estava em andamento: o retângulo em construção virava item
     * na folha. Quando o sistema toma o gesto para si, e num tablet com a mão
     * apoiada no vidro isso acontece, ela ganhava um branco que não pediu. É a
     * mesma queixa da palma, por outra porta, e foi uma lente cega que a viu
     * depois de a primeira estar fechada. */
    c.addEventListener('pointercancel', function (e) { self._aoCancelarPonteiro(e); }, sinal);
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
      this.apagou = this.apagarEm(p, 14 / this.escala + 6);
      return;
    }
    if (this.ferramenta === 'tapar') {
      this.tapando = { x0: p.x, y0: p.y, x: p.x, y: p.y };
      this.precisaRedesenhar = true;
      return;
    }
    if (this.ferramenta === 'selecao') {
      var alvo = this.itemEm(p);
      var mudouSelecao = this.selecionado !== alvo;
      this.selecionado = alvo;
      /* QUEM SELECIONA PRECISA AVISAR, senão a lixeira nunca aparece.
       *
       * A barra de ferramentas só monta o botão de remover quando
       * `editorAtual.selecionado` existe, e ela só se redesenha quando a
       * ferramenta muda. Tocar num item na tela mudava a seleção e não dizia
       * nada a ninguém: a lixeira aparecia por acidente, quando ela tocava
       * numa cor ou numa espessura logo depois, que redesenham a barra por
       * outro motivo. Para o TAPAR isso é grave de um jeito que não era para os
       * outros: a borracha não alcança retângulo (ela só remove traço, de
       * propósito, para nunca danificar a imagem), então a seleção é a ÚNICA
       * saída, e ela estava atrás de um caminho que a interface não oferecia.
       * Ferramenta que ela cria e não consegue tirar não está pronta. */
      if (mudouSelecao && this.opcoes.aoSelecionar) this.opcoes.aoSelecionar(alvo);
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

    if (this.apagando) { if (this.apagarEm(p, 14 / this.escala + 6)) this.apagou = true; return; }

    if (this.tapando) {
      this.tapando.x = p.x;
      this.tapando.y = p.y;
      this.precisaRedesenhar = true;
      return;
    }

    if (this.arrasto) {
      var d = this.arrasto;
      if (d.alca && d.item.t === 'tapar') {
        /* O retângulo que tapa não guarda proporção: o pedaço errado do
         * enunciado é largo e baixo quase sempre, e forçar proporção obrigaria
         * a tapar linha de texto vizinha para cobrir uma palavra. */
        // a alça apara: o canto para na borda da folha, e não passa dela
        d.item.w = aparado(d.iw + (p.x - d.ox), TAPAR_MINIMO, FOLHA_L - d.item.x);
        d.item.h = aparado(d.ih + (p.y - d.oy), TAPAR_MINIMO, FOLHA_A - d.item.y);
      } else if (d.alca && d.item.t === 'imagem') {
        var nw = Math.max(40, d.iw + (p.x - d.ox));
        var proporcao = d.ih / d.iw;
        d.item.w = nw;
        d.item.h = nw * proporcao;
      } else if (d.item.t === 'tapar') {
        /* Mover PRENDE na borda e mantém o tamanho: o retângulo dela não
         * encolhe por ela ter arrastado longe demais. */
        d.item.x = aparado(d.ix + (p.x - d.ox), 0, Math.max(0, FOLHA_L - d.item.w));
        d.item.y = aparado(d.iy + (p.y - d.oy), 0, Math.max(0, FOLHA_A - d.item.h));
      } else {
        d.item.x = d.ix + (p.x - d.ox);
        d.item.y = d.iy + (p.y - d.oy);
      }
      d.moveu = true;
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
    if (this.tapando) {
      var t = this.tapando;
      this.tapando = null;
      var novo = this.adicionarTapar(Math.min(t.x0, t.x), Math.min(t.y0, t.y),
        Math.abs(t.x - t.x0), Math.abs(t.y - t.y0));
      /* Toque seco não vira retângulo: um branco de dois pixels ficaria
       * invisível na folha e aparecendo no desfazer, e ela não saberia o que
       * tinha feito. Sem retângulo não há o que avisar. */
      if (novo) this._avisarMudanca();
      this.precisaRedesenhar = true;
    }
    if (this.apagando) { this.apagando = false; this._avisarMudanca(); }
    if (this.arrasto) { this.arrasto = null; this._avisarMudanca(); }
    this.precisaRedesenhar = true;
  };

  /* O DEDO CANCELA O QUE O BICO ESTAVA FAZENDO, e o retângulo faltava nessa
   * conta. `_cancelarTraco` desfazia só o traço em andamento, e o `tapando`
   * seguia de pé: com a mão apoiada no vidro, o `pointerup` da PALMA caía no
   * fim do arrasto e fechava o retângulo com as coordenadas do bico naquele
   * instante, criando na folha um branco que ela não pediu e não viu nascer.
   * O comentário do `moverNoCarrinho` diz que ela usa o tablet com a mão
   * apoiada, então este é o gesto normal dela. Achado por uma lente cega. */
  /* Desiste de tudo o que estava em andamento, sem cometer nada. */
  Editor.prototype._aoCancelarPonteiro = function (e) {
    delete this.ponteiros[e.pointerId];
    // o _cancelarTraco ja desiste do retangulo em andamento, na primeira linha dele
    this._cancelarTraco();
    /* O QUE JÁ MUDOU NÃO VOLTA COM O CANCELAMENTO: a borracha já tirou o traço
     * e o arrasto já moveu o item, na tela e na nota. Sem avisar, a folha
     * ficava diferente do que está gravado até o próximo gesto dela, e
     * fechada antes disso perdia a mudança. Achado pela lente de correção do
     * PR #57. */
    var mudou = !!((this.apagando && this.apagou) || (this.arrasto && this.arrasto.moveu));
    if (this.arrasto) this.arrasto = null;
    this.apagando = false;
    this.apagou = false;
    this.precisaRedesenhar = true;
    if (mudou) this._avisarMudanca();
  };

  Editor.prototype._cancelarTapar = function () {
    if (!this.tapando) return;
    this.tapando = null;
    this.cacheValido = false; this.precisaRedesenhar = true;
  };

  Editor.prototype._cancelarTraco = function () {
    this._cancelarTapar();
    if (!this.tracoAtual) return;
    var itens = this.pagina().itens;
    var i = itens.indexOf(this.tracoAtual);
    if (i >= 0) itens.splice(i, 1);
    this.tracoAtual = null;
    if (this.pilhaDesfazer.length) this.pilhaDesfazer.pop();
    this.cacheValido = false; this.precisaRedesenhar = true;
  };

  Editor.prototype._alcaEm = function (p, item) {
    if (item.t !== 'imagem' && item.t !== 'tapar') return null;
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
    for (var c = 0; c < ORDEM_CAMADAS.length; c++) {
      for (var i = 0; i < itens.length; i++) {
        if (itens[i] && itens[i].t === ORDEM_CAMADAS[c]) this._desenharItem(ctx, itens[i]);
      }
    }
    /* O retângulo que ela está arrastando agora, ainda sem existir no vetor:
     * mostrado com contorno e sem branco, porque enquanto arrasta o que ela
     * precisa ver é O QUE VAI SUMIR, e não o branco por cima. */
    if (this.tapando) {
      var t = this.tapando;
      ctx.strokeStyle = '#2E7D6B';
      ctx.lineWidth = 2 / this.escala;
      ctx.setLineDash([8 / this.escala, 5 / this.escala]);
      ctx.strokeRect(Math.min(t.x0, t.x), Math.min(t.y0, t.y), Math.abs(t.x - t.x0), Math.abs(t.y - t.y0));
      ctx.setLineDash([]);
    }
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
    if (it.t === 'tapar') {
      /* Branco cheio e sem transparência: é a mesma mecânica com que o
       * compositor já cobre o rótulo original do recorte.
       *
       * E UM CONTORNO FINO, SÓ NA TELA. Medido: numa área vazia da folha de
       * fundo branco o retângulo pintava ZERO pixels distinguíveis, porque o
       * fundo já é branco puro. Numa ferramenta nova isso é armadilha de
       * primeiro uso: ela arrasta para ver o que a ferramenta faz, não vê nada
       * acontecer e conclui que está quebrada; e se criou sem querer, fica com
       * um objeto que não consegue achar para tirar.
       *
       * O contorno NÃO alcança o papel, e não por promessa: ele mora aqui, no
       * desenho do canvas, e o `pdf.js` não tem caminho até esta linha. No
       * papel o branco é justamente a função, e é disso que depende a prova de
       * que a folha impressa não mudou. */
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(it.x, it.y, it.w, it.h);
      ctx.strokeStyle = 'rgba(31, 58, 95, 0.35)';
      ctx.lineWidth = 1 / this.escala;
      ctx.strokeRect(it.x + 0.5 / this.escala, it.y + 0.5 / this.escala,
        Math.max(0, it.w - 1 / this.escala), Math.max(0, it.h - 1 / this.escala));
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
    if (it.t === 'imagem' || it.t === 'tapar') { w = it.w; h = it.h; }
    else { w = String(it.txt).length * it.tam * 0.52; h = it.tam * 1.3 * String(it.txt).split('\n').length; }
    ctx.strokeStyle = '#2E7D6B';
    ctx.lineWidth = 2 / this.escala;
    ctx.setLineDash([8 / this.escala, 5 / this.escala]);
    ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
    ctx.setLineDash([]);
    if (it.t === 'imagem' || it.t === 'tapar') {
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
    var todos = nota.paginas[0].itens || [];
    // a miniatura segue a mesma ordem de camadas da folha e do PDF
    var itens = [];
    ORDEM_CAMADAS.forEach(function (c) {
      todos.forEach(function (it) { if (it && it.t === c) itens.push(it); });
    });
    itens.forEach(function (it) {
      if (it.t === 'tapar') {
        /* A MINIATURA NÃO LEVA O CONTORNO, e é decisão e não esquecimento: o
         * contorno existe para ela achar, na folha aberta, o branco que criou
         * e não enxerga. A miniatura não é onde ela procura objeto para tirar,
         * e um fio de um pixel num cartão de cem e poucos pixels de largura é
         * sujeira, não sinal. */
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(it.x, it.y, it.w, it.h);
      } else if (it.t === 'traco' && it.pontos.length > 1) {
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
    FOLHA_L: FOLHA_L, FOLHA_A: FOLHA_A, ORDEM_CAMADAS: ORDEM_CAMADAS,
    notaVazia: notaVazia, paginaVazia: paginaVazia
  };
})(typeof self !== 'undefined' ? self : this);
