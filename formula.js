/* formula.js
 * Fórmula LaTeX como VETOR no PDF do aplicativo (D2), pelo MathJax 4.1.3.
 *
 * É o módulo que o pdf.js procura (moduloFormula: o global Formula no
 * navegador, require('./formula.js') no Node), com a interface de sempre:
 *
 *   Formula.medir(latex, tam, opcoes)              -> { largura, altura, profundidade, avisos, falhou }
 *   Formula.desenhar(doc, latex, x, y, tam, opcoes) -> { largura, altura, profundidade, avisos, falhou, x, y }
 *
 * em pontos, com y na LINHA DE BASE (altura para cima, profundidade para
 * baixo). opcoes: display (padrão true: fórmula de bloco; false é a fórmula
 * dentro da frase), cor ([r, g, b] de 0 a 1: preto na folha, vermelho no
 * gabarito), align ('centro' ou 'direita', a partir do x), lingua.
 *
 * O ÚNICO PASSO ASSÍNCRONO é carregar o MathJax:
 *
 *   if (Formula.temFormula(texto)) {
 *     await Formula.pronto({ aoDemorar: mostrarAviso, depoisDe: 3000,
 *       formulas: Formula.formulasDoTexto(texto) });
 *   }
 *
 * antes de gerar um documento que tem fórmula (formulas é opcional: converte
 * de antemão, em lotes, as fórmulas do documento). Depois disso medir e desenhar
 * são síncronos, e o pdf.js continua síncrono. No navegador o pronto() injeta
 * o <script> do vendor/mathjax-4.1.3/mathjax-svg.min.js (2,6 MB; fora do
 * ARQUIVOS do sw.js, vai para o BAIXADOS na primeira vez, como o leitor de
 * PDF); no Node é um require. Nada disto roda ao abrir o aplicativo nem ao gerar
 * um PDF sem fórmula: o vendor só é pedido pelo pronto(), e o pdf.js só procura
 * este módulo quando encontra uma fórmula. O aoDemorar é o gancho do
 * "Preparando as fórmulas...": chamado uma vez se a carga (mais a conversão de
 * antemão) passar de depoisDe ms. Nenhum lugar do aplicativo gera PDF com
 * fórmula ainda: quem vai chamar o pronto() é o gerador de listas da D3, antes
 * de montar a lista.
 *
 * FALHA ALTA. Fórmula que o MathJax não monta (comando que não existe, chave
 * que não fecha, bloco de fonte fora do pacote, MathJax não carregado) não
 * some e não vira texto cru calado: sai o TeX entre colchetes, em cinza, na
 * fonte do texto, com falhou: true e o motivo nos avisos, que o pdf.js põe no
 * avisoDeFigura do documento. O documento guarda a lista em
 * doc.formulasQueFalharam ({ latex, motivo }), que é o que a prova lista.
 *
 * GLIFO UMA VEZ POR DOCUMENTO. Cada glifo do MathJax vira um Form XObject do
 * documento (doc.registraForma), citado por nome a cada uso e marcado na página
 * onde a fórmula caiu (doc.usaForma). O PDF do corpus fica cerca de 3 vezes
 * menor que com o contorno repetido, e a imagem é a mesma.
 *
 * AS ESCOLHAS DA CASA, aqui e não no vendor:
 *   - macros do português: \sen, \tg, \cotg, \cossec, \arcsen, \arctg, como
 *     \operatorname (reto, com o espaço de função);
 *   - número com vírgula decimal (0,5 e 2,50) e hora (14:35) são UM número,
 *     sem o espaço que o TeX põe depois da vírgula e em volta dos dois-pontos
 *     (a opção digits do TeX; o {,} e o {:} continuam valendo);
 *   - \overset{\frown}{AB} vira \overparen{AB}, o arco que estica;
 *   - no \ce{} a carga fica EMPILHADA sobre o índice (SO4^2- como nos livros
 *     brasileiros: o 2- em cima do 4, e não depois dele).
 * \newcommand feito numa fórmula vale nas seguintes da mesma sessão (é o
 * MathJax); por isso as macros da casa vêm predefinidas.
 *
 * Corpo: a fórmula sai a CORPO_RELATIVO vezes o corpo pedido, porque a New
 * Computer Modern tem o olho bem menor que o da Helvetica do texto.
 *
 * Regra da casa: nunca usar travessão.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else root.Formula = factory(root);
  /* O global de verdade (no Node, o this do módulo seria o module.exports): é
   * nele que o vendor põe o MathJaxDoApp. */
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this), function (root) {
  'use strict';

  var VENDOR = 'vendor/mathjax-4.1.3/mathjax-svg.min.js';
  var CORPO_RELATIVO = 1.1;
  var COR_FALHA = [0.419608, 0.447059, 0.501961];   // o COR.muted do pdf.js
  var ESPERA_DO_AVISO = 3000;

  var MACROS = {
    sen: '\\operatorname{sen}', tg: '\\operatorname{tg}', cotg: '\\operatorname{cotg}',
    cossec: '\\operatorname{cossec}', arcsen: '\\operatorname{arcsen}', arctg: '\\operatorname{arctg}'
  };
  /* O padrão do MathJax é /^(?:[0-9]+(?:\{,\}[0-9]{3})*(?:\.[0-9]*)?|\.[0-9]+)/.
   * Aqui a vírgula entre algarismos também faz parte do número (0,5; 2,50;
   * 2,8,8,1), e dois algarismos depois de dois-pontos também (14:35). Com
   * espaço depois da vírgula ("1, 2") a vírgula volta a ser pontuação. */
  var DIGITOS = /^(?:[0-9]+(?:(?:\{,\}|,)[0-9]+)*(?:(?:\{:\}|:)[0-9]{2}(?![0-9]))?(?:\.[0-9]*)?|\.[0-9]+)/;

  var estado = { cargas: 0, conversor: null, promessa: null, falhaCarga: '' };
  /* O cache do SVG: até LIMITE_CACHE fórmulas (cada SVG pesa até uns 18 KB; 300
   * dão uns 5 MB no pior caso, uma lista inteira com folga). A chave leva a
   * geração das macros: fórmula que define ou redefine comando (\newcommand,
   * \renewcommand, \def...) muda o que as seguintes significam, e a mesma
   * fórmula depois dela não pode sair do cache de antes.
   *
   * A geração é o ESTADO das definições (que fórmula definiu cada comando por
   * último), e não um contador: a mesma definição vista de novo (a fórmula
   * medida e depois desenhada, o documento gerado duas vezes) não muda nada, e
   * o cache continua valendo; voltar a uma definição de antes volta à geração
   * de antes. Por isso a fórmula que define nunca sai do cache: o MathJax tem
   * de passar por ela de novo, para o estado dele andar junto com o daqui. */
  var cacheSvg = new Map(), LIMITE_CACHE = 300, geracao = 0;
  var RE_DEFINE = /\\(?:re)?newcommand\b|\\(?:re)?newenvironment\b|\\def\b|\\let\b|\\DeclareMathOperator\b/;
  var RE_NOME_DEFINIDO = /\\(?:(?:re)?newcommand|(?:re)?newenvironment|DeclareMathOperator\*?)\s*\{?\s*\\?([A-Za-z]+)|\\(?:def|let)\s*\\([A-Za-z]+)/g;
  var definidas = {}, idDaDefinicao = {}, nDefinicoes = 0, estadosVistos = { '': 0 }, nEstados = 0;
  function anotarDefinicoes(latex) {
    if (!idDaDefinicao.hasOwnProperty(latex)) idDaDefinicao[latex] = ++nDefinicoes;
    var id = idDaDefinicao[latex], mudou = false, m;
    RE_NOME_DEFINIDO.lastIndex = 0;
    while ((m = RE_NOME_DEFINIDO.exec(latex))) {
      var nome = m[1] || m[2];
      if (definidas[nome] !== id) { definidas[nome] = id; mudou = true; }
    }
    if (!mudou) return;
    var chave = Object.keys(definidas).sort().map(function (n) { return n + '=' + definidas[n]; }).join(',');
    if (!estadosVistos.hasOwnProperty(chave)) estadosVistos[chave] = ++nEstados;
    geracao = estadosVistos[chave];
  }

  // ---------------------------------------------------------------- vizinhos
  function tradutor() {
    if (root && root.SvgParaPdf && root.SvgParaPdf.svgParaPdf) return root.SvgParaPdf;
    return require('./svg-para-pdf.js');
  }
  function gerador() {
    if (root && root.PDFGen && root.PDFGen.medir) return root.PDFGen;
    if (typeof require === 'function') { try { return require('./pdf.js'); } catch (e) { return null; } }
    return null;
  }

  // ---------------------------------------------------------------- carga
  /* O prazo da carga do vendor (rede), e a frase que ela lê quando ele vence ou
   * a rede falha. O sw.js já corta em 3 s o pedido que não começa a responder;
   * este prazo pega o que começa e não termina (o sinal de uma barrinha). */
  var PRAZO_DA_CARGA = 40000;
  var SEM_SINAL = 'Não consegui preparar as fórmulas: a internet está lenta ou fora. Tente de novo com sinal melhor.';
  var COM_DEFEITO = 'Não consegui preparar as fórmulas: o arquivo das fórmulas chegou com defeito. Tente de novo.';
  /* Quanto cada lote da conversão de antemão segura a página, em ms. */
  var LOTE_MS = 40;

  /* Uma volta ao navegador: deixa o temporizador do aviso disparar e a tela
   * desenhar entre um pedaço pesado e o seguinte. */
  function ceder() { return new Promise(function (r) { setTimeout(r, 0); }); }

  /* Em dois passos, com uma volta entre eles: criar o conversor e o primeiro
   * uso (que aquece a fonte) são os dois blocos mais pesados depois do script. */
  function montarConversor() {
    var MJ = root && root.MathJaxDoApp;
    if (!MJ || !MJ.criar) throw new Error('o vendor do MathJax não expôs MathJaxDoApp');
    MJ.aoMhchem(empilharCarga);
    var c = MJ.criar({ macros: MACROS, digits: DIGITOS });
    return ceder().then(function () {
      c.latexParaSvg('x', true);   // aquece a fonte: o primeiro uso é o mais lento
      estado.conversor = c;
      estado.versao = MJ.versao;
    });
  }

  function carregarNoNavegador() {
    return new Promise(function (ok, falha) {
      var doc = root.document;
      if (!doc || !doc.createElement) { falha(new Error('sem document para injetar o vendor')); return; }
      /* Uma carga anterior que venceu o prazo pode ter terminado depois: o
       * global já está aqui, e outro <script> seria o mesmo arquivo de novo. */
      if (root.MathJaxDoApp && root.MathJaxDoApp.criar) { ok(); return; }
      var s = doc.createElement('script');
      s.src = VENDOR;
      s.async = true;
      s.onload = function () { ok(); };
      s.onerror = function () { falha(new Error('não deu para baixar o ' + VENDOR + ' (sem sinal na primeira vez?)')); };
      (doc.head || doc.documentElement).appendChild(s);
    });
  }

  /* Carrega o MathJax uma vez e, se opcoes.formulas vier, já converte as
   * fórmulas do documento. Devolve Promise.
   *
   * opcoes.formulas: [{ latex, display }] (ou só o texto, que é de bloco). A
   * conversão do LaTeX é a parte cara (a tradução para o PDF é barata); feita
   * aqui, em lotes de uns 40 ms com uma volta ao navegador entre eles, a tela
   * não congela e o aviso pode aparecer, e a geração do PDF depois do pronto()
   * só traduz o que já está no cache.
   *
   * opcoes.aoDemorar(): chamado uma vez se a carga mais a conversão passarem de
   * opcoes.depoisDe ms (padrão 3000). É o gancho do "Preparando as fórmulas...".
   * Para ele disparar NA HORA, e não quando a conversão inteira acabar, nenhum
   * pedaço segura a página por muito tempo: o script, o criar(), o primeiro uso
   * e cada lote de LOTE_MS têm uma volta ao navegador entre eles, e o lote em
   * que o prazo vence para ali mesmo e cede.
   *
   * opcoes.prazo: o prazo da CARGA do vendor (padrão PRAZO_DA_CARGA). Vencido,
   * ou com a rede falhando, rejeita com a frase SEM_SINAL (a mensagem do erro;
   * o motivo técnico fica em erro.detalhe e em estado().falhaCarga). Falha de
   * carga é esquecida: o pronto() seguinte tenta de novo (o sinal pode ter
   * voltado). */
  function pronto(opcoes) {
    opcoes = opcoes || {};
    var espera = opcoes.depoisDe == null ? ESPERA_DO_AVISO : Number(opcoes.depoisDe);
    var aviso = typeof opcoes.aoDemorar === 'function' ? { limite: Date.now() + espera, disparado: false } : null;
    var p = carregar(opcoes.prazo == null ? PRAZO_DA_CARGA : Number(opcoes.prazo));
    var lista = opcoes.formulas;
    if (lista && lista.length) p = p.then(function () { return preconverter(lista, aviso); }).then(function () { return estado; });
    if (aviso) {
      var acabou = false;
      var t = setTimeout(function () { if (!acabou) { aviso.disparado = true; opcoes.aoDemorar(); } }, espera);
      var fim = function () { acabou = true; clearTimeout(t); };
      p.then(fim, fim);
    }
    return p;
  }

  /* aviso: { limite, disparado } do pronto(), ou null. Começa cedendo (a
   * carga pode ter acabado de segurar a página) e cede entre os lotes; o lote
   * em que o prazo do aviso vence para na hora, para o temporizador rodar. */
  function preconverter(lista, aviso) {
    return new Promise(function (ok) {
      var i = 0;
      function lote() {
        var t0 = Date.now();
        while (i < lista.length && Date.now() - t0 < LOTE_MS) {
          var f = lista[i++];
          if (f != null) {
            if (typeof f === 'string') converter(f, true);
            else converter(String(f.latex), f.display !== false);
          }
          if (aviso && !aviso.disparado && Date.now() >= aviso.limite) break;
        }
        if (i < lista.length) setTimeout(lote, 0); else ok();
      }
      setTimeout(lote, 0);
    });
  }

  function erroDeCarga(frase, motivo) {
    var e = new Error(frase);
    e.detalhe = motivo;
    return e;
  }

  function carregar(prazo) {
    if (estado.conversor) return Promise.resolve(estado);
    if (!estado.promessa) {
      estado.cargas++;
      var carga;
      if (typeof module === 'object' && module.exports && typeof require === 'function' && !(root && root.document)) {
        carga = new Promise(function (ok) {
          require('./' + VENDOR);
          ok();
        });
      } else {
        carga = carregarNoNavegador();
      }
      var vence;
      var limite = new Promise(function (ok, falha) {
        vence = setTimeout(function () { falha(new Error('a carga do vendor passou de ' + prazo + ' ms')); }, prazo);
      });
      estado.promessa = Promise.race([carga, limite]).then(function () {
        clearTimeout(vence);
        return ceder();
      }, function (e) {
        clearTimeout(vence);
        throw erroDeCarga(SEM_SINAL, e && e.message ? String(e.message) : String(e));
      }).then(function () {
        return Promise.resolve().then(montarConversor).catch(function (e) {
          throw erroDeCarga(COM_DEFEITO, e && e.message ? String(e.message) : String(e));
        });
      }).then(function () {
        estado.falhaCarga = '';
        return estado;
      }).catch(function (e) {
        estado.promessa = null;
        estado.falhaCarga = e.detalhe || (e && e.message ? String(e.message) : String(e));
        throw e;
      });
    }
    return estado.promessa;
  }

  /* Se o texto pede o MathJax: fórmula em linha ("\(" com o "\)" de fechar) ou
   * a diretiva @eq isolada. É a pergunta que quem gera o documento faz antes
   * de chamar o pronto(): documento sem fórmula não carrega nada. */
  function temFormula(texto) {
    var s = String(texto == null ? '' : texto);
    return /\\\([\s\S]*?\\\)/.test(s) || /(^|\s)@eq(\s|$)/.test(s);
  }

  /* As fórmulas de um texto, no formato do pronto({ formulas }): as em linha
   * ("\( ... \)", display false) e as @eq (display true). Quem lê é o pdf.js
   * (PDFGen.formulasDoTexto), pela mesma regra com que ele desenha: duas regras
   * em dois lugares dariam fórmula convertida de antemão que a folha não usa.
   * Sem o pdf.js ao lado, só as em linha. */
  function formulasDoTexto(texto) {
    var G = gerador();
    if (G && G.formulasDoTexto) return G.formulasDoTexto(texto);
    var s = String(texto == null ? '' : texto), saida = [], re = /\\\(([\s\S]*?)\\\)/g, m;
    while ((m = re.exec(s))) if (m[1].trim()) saida.push({ latex: m[1].trim(), display: false });
    return saida;
  }

  // ---------------------------------------------------------------- TeX da casa
  function preparar(latex) {
    return String(latex).replace(/\\overset\s*\{\s*\\frown\s*\}/g, '\\overparen');
  }
  /* O mhchem escreve SO4^2- como {\mathrm{SO}{\vphantom{A}}_{\smash[t]{4}}{\vphantom{A}}^{2-}}:
   * o segundo \vphantom{A} abre um átomo novo e a carga vai para DEPOIS do
   * índice. Sem ele, índice e carga ficam no mesmo átomo, empilhados. */
  function empilharCarga(tex) {
    return String(tex).replace(/(_\{\\smash\[t\]\{[^{}]*\}\})\{\\vphantom\{A\}\}\^/g, '$1^');
  }

  // ---------------------------------------------------------------- conversão
  /* O tradutor lê UM <svg>. Se o MathJax devolver mais de um (a quebra
   * automática da fórmula em linha, desligada no vendor), o resto sumiria
   * calado: vira erro, e erro vira falha alta. */
  function umSvgSo(svg) {
    var re = /<(\/?)svg\b[^>]*?(\/?)>/g, m, nivel = 0, fim = -1;
    while ((m = re.exec(svg))) {
      if (m[2]) continue;
      nivel += m[1] ? -1 : 1;
      if (nivel === 0) { fim = re.lastIndex; break; }
    }
    if (fim < 0 || /<svg\b/.test(svg.slice(fim))) throw new Error('o MathJax devolveu a fórmula em mais de um pedaço');
    return svg;
  }

  /* Do LaTeX ao SVG e às medidas a 1000 pt, com cache por (display, latex): o
   * SVG não depende de corpo nem de cor. Erro também fica no cache, para a
   * fórmula quebrada repetida não ir ao MathJax de novo. */
  function converter(latex, display) {
    var chave = geracao + (display ? '|D|' : '|I|') + latex;
    var define = RE_DEFINE.test(latex);
    if (!define && cacheSvg.has(chave)) return cacheSvg.get(chave);
    var r;
    if (!estado.conversor) {
      r = { erro: 'o MathJax não foi carregado (falta await Formula.pronto() antes de gerar' +
        (estado.falhaCarga ? '; a carga falhou: ' + estado.falhaCarga : '') + ')' };
      return r;   // não guarda: depois do pronto() a mesma fórmula monta
    }
    try {
      var svg = umSvgSo(estado.conversor.latexParaSvg(preparar(latex), display));
      var m = tradutor().svgParaPdf(svg, { tam: 1000, glifos: {} });
      r = { svg: svg, l: m.largura, a: m.altura, p: m.profundidade, avisos: m.avisos };
    } catch (e) {
      r = { erro: e && e.message ? String(e.message) : String(e) };
    }
    estado.convertidas = (estado.convertidas || 0) + 1;
    /* Cheio, sai a mais antiga (o Map guarda a ordem de entrada): apagar
     * tudo jogaria fora o que o pronto() acabou de converter. */
    if (!define) {
      if (cacheSvg.size >= LIMITE_CACHE) cacheSvg.delete(cacheSvg.keys().next().value);
      cacheSvg.set(chave, r);
    }
    /* Depois de uma definição nova, o que vier é de outra geração. */
    if (define && estado.conversor) anotarDefinicoes(latex);
    return r;
  }

  function corpoDaFormula(tam) { return (Number(tam) > 0 ? Number(tam) : 11) * CORPO_RELATIVO; }
  function ehDisplay(opcoes) { return !opcoes || opcoes.display !== false; }

  // ---------------------------------------------------------------- falha alta
  function textoDaFalha(latex) { return '[' + String(latex) + ']'; }
  function medidaDaFalha(latex, tam) {
    var G = gerador();
    var t = Number(tam) > 0 ? Number(tam) : 11;
    return { largura: G ? G.medir(textoDaFalha(latex), t, false) : textoDaFalha(latex).length * t * 0.5,
      altura: t * 0.75, profundidade: t * 0.25 };
  }
  function avisoDaFalha(latex, motivo) {
    return 'a fórmula não montou (' + motivo + ') e saiu entre colchetes: ' + latex;
  }
  function desenharFalha(doc, latex, x, y, tam) {
    doc.texto(textoDaFalha(latex), x, y, { tam: Number(tam) > 0 ? Number(tam) : 11, cor: COR_FALHA });
  }

  // ---------------------------------------------------------------- interface
  function medir(latex, tam, opcoes) {
    latex = String(latex == null ? '' : latex);
    var c = converter(latex, ehDisplay(opcoes));
    if (c.erro) {
      var f = medidaDaFalha(latex, tam);
      return { largura: f.largura, altura: f.altura, profundidade: f.profundidade,
        avisos: [avisoDaFalha(latex, c.erro)], falhou: true };
    }
    var k = corpoDaFormula(tam) / 1000;
    return { largura: c.l * k, altura: c.a * k, profundidade: c.p * k, avisos: c.avisos.slice(), falhou: false };
  }

  /* A caixa do Form de um glifo: os números do contorno, em milésimos de em,
   * cobrem x e y; a caixa é o menor quadrado que contém todos, com folga. */
  function caixaDoContorno(contorno) {
    var nums = String(contorno).match(/-?\d+(?:\.\d+)?/g) || ['0'];
    var lo = 0, hi = 0;
    for (var i = 0; i < nums.length; i++) { var v = Number(nums[i]); if (v < lo) lo = v; if (v > hi) hi = v; }
    return [Math.floor(lo) - 10, Math.floor(lo) - 10, Math.ceil(hi) + 10, Math.ceil(hi) + 10];
  }

  function doDocumento(doc) {
    return doc.formulasDoDoc || (doc.formulasDoDoc = { glifos: {}, pdf: {} });
  }

  function desenhar(doc, latex, x, y, tam, opcoes) {
    opcoes = opcoes || {};
    latex = String(latex == null ? '' : latex);
    var display = ehDisplay(opcoes);
    var c = converter(latex, display);
    var px = x, r, largura;
    if (c.erro) {
      var f = medidaDaFalha(latex, tam);
      largura = f.largura;
      if (opcoes.align === 'centro') px = x - largura / 2;
      else if (opcoes.align === 'direita') px = x - largura;
      desenharFalha(doc, latex, px, y, tam);
      (doc.formulasQueFalharam = doc.formulasQueFalharam || []).push({ latex: latex, motivo: c.erro });
      return { largura: largura, altura: f.altura, profundidade: f.profundidade,
        avisos: [avisoDaFalha(latex, c.erro)], falhou: true, x: px, y: y };
    }
    var corpo = corpoDaFormula(tam);
    var cor = opcoes.cor || [0, 0, 0];
    var dd = doDocumento(doc);
    var chave = geracao + '|' + corpo + '|' + cor.join(',') + '|' + (display ? 'D' : 'I') + '|' + latex;
    r = dd.pdf[chave];
    if (!r) {
      var T = tradutor();
      r = T.svgParaPdf(c.svg, { tam: corpo, cor: cor, glifos: dd.glifos,
        glifoXObject: function (k, contorno) {
          return doc.registraForma('glifo:' + k, contorno + ' f', caixaDoContorno(contorno));
        } });
      dd.pdf[chave] = r;
    }
    if (opcoes.align === 'centro') px = x - r.largura / 2;
    else if (opcoes.align === 'direita') px = x - r.largura;
    doc.op(tradutor().posicionar(r, px, y));
    /* O recurso vai para a página em que a fórmula CAIU, que é a página em
     * vigor agora, e não a da conversão (o resultado vem do cache). */
    for (var i = 0; i < r.glifosUsados.length; i++) doc.usaForma('glifo:' + r.glifosUsados[i]);
    return { largura: r.largura, altura: r.altura, profundidade: r.profundidade,
      avisos: r.avisos.slice(), falhou: false, x: px, y: y };
  }

  return {
    pronto: pronto,
    medir: medir,
    desenhar: desenhar,
    temFormula: temFormula,
    formulasDoTexto: formulasDoTexto,
    /* Para as provas: quantas vezes o vendor foi pedido, se está montado, a
     * versão, e os blocos de fonte que o MathJax já carregou. */
    estado: function () {
      var MJ = root && root.MathJaxDoApp;
      return { cargas: estado.cargas, carregado: !!estado.conversor, versao: estado.versao || null, noCache: cacheSvg.size, convertidas: estado.convertidas || 0, geracao: geracao,
        falhaCarga: estado.falhaCarga, blocos: MJ && MJ.blocosCarregados ? MJ.blocosCarregados.slice() : [] };
    },
    /* O SVG que o MathJax dá para a fórmula, já com as escolhas da casa (para
     * as provas compararem o vendor em outro contexto). Lança se não montar. */
    latexParaSvg: function (latex, display) {
      if (!estado.conversor) throw new Error('o MathJax não foi carregado');
      return umSvgSo(estado.conversor.latexParaSvg(preparar(latex), display !== false));
    },
    OPCOES_TEX: { macros: MACROS, digits: DIGITOS },
    VENDOR: VENDOR,
    CORPO_RELATIVO: CORPO_RELATIVO,
    preparar: preparar,
    empilharCarga: empilharCarga
  };
});
