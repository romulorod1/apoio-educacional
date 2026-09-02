/* figuras/desenho.js
 * O nucleo de desenho: poligono, arco, rotulo, ponto, seta e cota.
 *
 * Tudo aqui e escrito em cima do figuras/base.js: nenhuma funcao deste arquivo
 * liga tracejado, recorte, cor ou espessura fora de um comEstado, porque esses
 * quatro sao estado GLOBAL do fluxo de conteudo e o sintoma de um esquecimento
 * aparece longe de onde o erro foi cometido (um "[2 2] 0 d" sem o "[] 0 d"
 * tracejou o rodape e a figura seguinte; um "W n" sem o "Q" recortou o resto da
 * folha). O envelope tambem serve a um caso mais chato de achar: o doc.texto e o
 * doc.retangulo emitem "rg" proprio, entao um halo branco deixava "1 1 1 rg"
 * aceso e o preenchimento seguinte saia branco no branco.
 *
 * As duas primeiras funcoes existem porque o pdf.js tem dois buracos medidos:
 *
 *   - doc.retangulo emite "re f": so PREENCHE, e so retangulo alinhado aos
 *     eixos. Nao ha quadrado com contorno, nem face de solido em perspectiva.
 *     E desenhar poligono como quatro doc.linha nao resolve: cada chamada
 *     reemite cor e espessura e fecha um S proprio, entao nao ha juncao de canto
 *     e em 1,2 pt aparece um entalhe visivel em cada vertice. O poligono() emite
 *     m, l, l, h e um operador de fim so, com 1 J 1 j nas juncoes.
 *   - doc.circulo trava a espessura em 1.6 dentro do proprio operador quando nao
 *     preenche, so faz circunferencia INTEIRA e so de raio igual nos dois
 *     sentidos. O arco() faz curva de verdade por Bezier cubica, com raios
 *     independentes para a elipse dos solidos, tracejado, setor e corda. O
 *     doc.circulo fica so para a bolinha cheia do ponto(), que e o unico caso em
 *     que ele esta certo.
 *
 * A terceira e a que mais aparece, em 880 figuras, e a que mais erra: rotulo.
 * A regra e uma so e vale para as quatro variantes (vertice, lado, angulo e
 * texto solto): a posicao sai de um VETOR calculado da geometria, nunca de um
 * deslocamento literal em x e y. Deslocamento fixo funciona na primeira figura,
 * e no triangulo obtuso a letra cai dentro do desenho; em poligono girado, em
 * cima de um lado. O afastamento tambem nao pode ser distancia ate o CENTRO da
 * caixa do texto: assim "12 cm" encosta no lado onde "A" nao encostava, porque a
 * caixa e mais larga. Aqui o afastamento e o vao ate a BORDA da caixa, medido na
 * direcao em que o rotulo esta sendo empurrado, e por isso ele vale o mesmo para
 * uma letra, para um numero de quatro digitos e para qualquer inclinacao. A
 * caixa que vale e a do texto ja GIRADO e nao a envolvente dela: com a
 * envolvente, um rotulo deitado sobre um lado obliquo era empurrado quase 30 pt
 * para fora do lado que ele nomeia.
 *
 * E o halo do rotulo, que e branco chapado e sai por ultimo, nao pode comer a
 * figura: antes de pintar, o retangulo dele e testado contra o que ja foi
 * desenhado e o rotulo anda o minimo que baste para ficar livre. Ver a secao "o
 * halo contra o contorno".
 *
 * Roda no navegador por <script> (exporta FigDesenho no global) e no Node.
 *
 * Regra da casa: nunca usar travessao.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FigDesenho = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Ligacao tardia com a fundacao e com o gerador, pelo mesmo motivo escrito no
   * base.js: no Node a cadeia de require e circular (pdf.js -> receitas.js ->
   * base.js -> pdf.js) e resolver no topo do arquivo devolveria um
   * module.exports pela metade, com COR undefined e em silencio. No navegador os
   * tres entram por <script> e viram globais. */
  var cacheBase = null;
  function base() {
    if (cacheBase) return cacheBase;
    if (typeof FigBase !== 'undefined' && FigBase && FigBase.figura) cacheBase = FigBase;
    else if (typeof require === 'function') {
      try { cacheBase = require('./base.js'); } catch (e) { cacheBase = null; }
    }
    if (!cacheBase) throw new Error('figuras/desenho.js nao achou o figuras/base.js');
    return cacheBase;
  }
  function gerador() {
    var g = base().gerador();
    if (!g || !g.COR) throw new Error('figuras/desenho.js nao achou o pdf.js (nem PDFGen global nem require)');
    return g;
  }

  /* ============================================================ constantes
   *
   * Tres niveis de espessura e so tres, porque a NBR 8403 pede que a linha larga
   * seja no minimo o DOBRO da estreita justamente para uma informacao nao ser
   * confundida com outra: 1,2 contra 0,6 e exatamente dois. A marca de
   * congruencia fica em 0,9 porque ela e parte do enunciado e nao construcao,
   * entao precisa pesar quase como o contorno. O unico traco autorizado abaixo
   * do piso e a malha do plano, e so porque a figura por cima e quatro vezes
   * mais grossa; quem desenha malha passa abaixoDoPiso. */
  var ESPESSURA = {
    contorno: 1.2,
    marca: 0.9,
    auxiliar: 0.6,
    hachura: 0.4,
    malha: 0.3
  };
  var PISO_ESPESSURA = 0.6;
  var PISO_CORPO = 7.5;      // corpo minimo dentro da figura
  var TAM_PADRAO = 8.5;      // corpo do dado que resolve a questao

  /* Modelo da caixa do rotulo, em fracao do corpo. O y do Td e a LINHA DE BASE e
   * nao o centro optico do glifo: um rotulo "centrado" com o baseline no alvo
   * sai visivelmente alto, porque a tinta de uma maiuscula sobe 0,72 do corpo e
   * nao desce nada. Descontar 0,35 poe o meio da altura de maiuscula no alvo.
   * A caixa do halo e simetrica em volta desse mesmo ponto e um pouco mais alta
   * do que a tinta, para cobrir tambem a descida de um p ou de um g. */
  var CENTRO_OPTICO = 0.35;
  var MEIA_ALTURA = 0.58;    // meia altura da caixa, em fracao do corpo
  var PAD_HALO = 1.6;        // folga lateral do halo, em pontos
  var AFAST_PADRAO = 4;      // vao entre a ancora e a BORDA da caixa

  /* Fuga do halo. O passo de 1 pt e a menor busca que ainda vale a pena (meio
   * ponto nao muda nada visivel e dobra o custo) e o alcance de 26 pt e cerca de
   * tres corpos de texto: mais do que isso o rotulo ja nao pertence ao lugar de
   * onde saiu, e o que resolve deixa de ser mover e passa a ser a chamada. Acima
   * de 8 pt de desvio, que e um corpo, a chamada entra sozinha, porque a essa
   * altura o rotulo nao esta mais onde a geometria o pediu.
   * A tarja e o ultimo recurso: sem folga lateral e cobrindo so a faixa da tinta
   * (a maiuscula sobe 0,72 do corpo a partir da linha de base e a descida de um
   * p desce 0,21), ela apaga bem menos do que o halo cheio. */
  var FUGA_PASSO = 1;
  var FUGA_MAX = 26;
  var FUGA_COM_CHAMADA = 8;
  var MEIA_TARJA = 0.46;     // meia altura da tarja, em fracao do corpo

  /* Cinza de area, provisorio e local de proposito. A paleta do pdf.js nao tem
   * constante de area: soft da 1,12 de contraste, softEsc 1,17, marca 1,14, fio
   * 1,53 e gold 2,25, e nenhum deles serve para regiao pedida. A constante
   * definitiva mora no COR e e da etapa das marcas; enquanto ela nao existe,
   * quem passa preenche=true cai aqui, com aviso, em cerca de 27 por cento de
   * tinta. Ela nunca carrega informacao sozinha (da 1,86 contra o branco): quem
   * carrega e o contorno em 1,2 pt mais a glosa escrita no enunciado. */
  var CINZA_AREA = [0.73, 0.745, 0.77];

  /* Cabeca de seta: comprimento em pontos e meia largura como fracao dele. A
   * proporcao 1 para 2,8 e a do desenho tecnico; mais gorda vira bandeirinha e
   * mais fina some na fotocopia. */
  var CABECA = 6.5;
  var CABECA_MEIA = 0.36;

  /* Padrao da guia que CARREGA leitura, escrito cru de proposito. Ver o
   * comentario dentro do ponto(): [1 2] em cinza medio e o que mais some na
   * fotocopia, e o nome 'oculta' do base.js, que tem este mesmo [2 2], quer
   * dizer aresta escondida de solido e nao guia de plano. */
  var GUIA_LEITURA = '[2 2] 0';

  var EPS = 1e-9;

  /* ============================================================ utilidades */

  /* Duas casas bastam num PDF em pontos (0,01 pt e 3,5 micrometros) e o arquivo
   * fica menor. O isFinite existe porque um NaN escrito no fluxo nao e erro de
   * sintaxe para o leitor de PDF: ele descarta o operador e o traco some. */
  function n2(v) {
    v = Number(v);
    if (!isFinite(v)) return '0';
    return v.toFixed(2);
  }

  /* Escapador de string de texto. E o segundo pedaco de FORMATO copiado do
   * pdf.js, pelo mesmo criterio do cor3 no base.js: formato pode ser copiado,
   * dado nao. A paleta, as larguras de glifo e a lista de simbolos continuam
   * morando num lugar so e este arquivo pergunta por elas. */
  function escapar(wa) {
    return wa.replace(/([\\()])/g, '\\$1');
  }

  function norm(p) { return base().geo.normalizar(p); }
  function normLista(pts) {
    var saida = [];
    for (var i = 0; i < (pts || []).length; i++) saida.push(norm(pts[i]));
    return saida;
  }
  function pt(x, y) { return { x: +x, y: +y }; }
  function rad(g) { return g * Math.PI / 180; }

  /* Versor de um vetor, aceitando {x, y} e o par [x, y]. Devolve null quando o
   * vetor e nulo, e o chamador decide: chutar uma direcao aqui dentro produziria
   * rotulo empurrado para cima num vertice onde a geometria nao tinha direcao
   * nenhuma, e ninguem descobriria de onde veio. */
  function versor(v) {
    if (!v) return null;
    var q = norm(v);
    var n = Math.sqrt(q.x * q.x + q.y * q.y);
    if (n < EPS) return null;
    return pt(q.x / n, q.y / n);
  }
  function perp(u) { return pt(-u.y, u.x); }

  /* Mesma pergunta que o base.js faz no recorte, e pelo mesmo motivo: um ponto e
   * {x, y} ou o par [x, y], e o par TEM length, entao decidir "lista de listas"
   * por length faz uma lista de pares passar por lista de poligonos. */
  function ehPonto(v) {
    if (!v || typeof v !== 'object') return false;
    if (typeof v.x === 'number' && typeof v.y === 'number') return true;
    return v.length >= 2 && typeof +v[0] === 'number' && isFinite(+v[0]) && isFinite(+v[1]);
  }

  function avisar(doc, texto) { base().avisar(doc, texto); }

  /* Contraste WCAG contra o branco. Confere com o que a especificacao mediu no
   * proprio gerador: fio 1,53, gold 2,25, soft 1,12. A regra pede 3:1 para
   * objeto grafico que carrega significado, entao fio, soft, softEsc, marca e
   * gold estao proibidos como contorno, seta, aresta e texto. Preenchimento de
   * area e a excecao declarada: ali quem carrega a informacao e o contorno. */
  function luminancia(c) {
    var s = 0, canal = [0.2126, 0.7152, 0.0722];
    for (var i = 0; i < 3; i++) {
      var v = c[i];
      s += canal[i] * (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    }
    return s;
  }
  function contraste(c) { return 1.05 / (luminancia(c) + 0.05); }
  function conferirCor(doc, cor, onde) {
    if (!cor) return;
    /* O branco e fundo, e fundo nao carrega informacao. A dispensa e por
     * luminancia e nao por identidade com COR.branco, senao um [1, 1, 1] escrito
     * a mao seria acusado; e o corte em 0,95 separa o branco puro (1,00) dos
     * cinzas claros da paleta, que ficam todos abaixo de 0,90 e continuam
     * reprovados: soft, softEsc e marca sao apoio, nunca portadores. */
    if (luminancia(cor) > 0.95) return;
    var k = contraste(cor);
    if (k < 3) {
      avisar(doc, onde + ': cor com contraste ' + k.toFixed(2) +
        ':1 contra o branco, abaixo de 3:1, nao pode carregar informacao');
    }
  }
  function conferirEspessura(doc, e, onde, abaixoDoPiso) {
    if (abaixoDoPiso === true) return;
    if (e > 0 && e < PISO_ESPESSURA) {
      avisar(doc, onde + ': espessura ' + e + ' pt abaixo do piso de ' + PISO_ESPESSURA + ' pt');
    }
  }

  /* Aceita o doc do pdf.js OU o ctx que o figura() entrega a receita. Com o ctx,
   * a anotacao do que foi desenhado sai automatica, e e por isso que vale a pena:
   * o conferirFigura audita o REGISTRO, e uma auditoria que depende de a receita
   * lembrar de chamar ctx.anota vira intencao em vez de restricao no decimo tema.
   *
   * A politica de papel esta aqui e num lugar so. Marca ativa e o que a aluna
   * precisa LER (numero, letra, arco de angulo, seta de paralelismo, cota), e o
   * teto e cinco. Contorno nao conta. Por isso: poligono e arco entram como
   * traco, salvo papel 'marca' declarado por quem chama; rotulo entra sempre
   * como rotulo; a bolinha do ponto entra como ponto e a letra dela como rotulo;
   * a cota conta uma vez so, pelo texto. */
  function alvoDe(a) {
    if (a && a.doc && typeof a.anota === 'function') {
      var lim = a.blocoInteiro
        ? { x0: a.blocoInteiro.x, y0: a.blocoInteiro.y,
            x1: a.blocoInteiro.x + a.blocoInteiro.largura,
            y1: a.blocoInteiro.y + a.blocoInteiro.altura }
        : null;
      return { doc: a.doc, anota: a.anota, limites: lim, ctx: a };
    }
    return { doc: a, anota: function (t, d) { return d; }, limites: null, ctx: null };
  }

  /* ====================================================== hierarquia de tinta
   *
   * A tabela ESPESSURA acima diz QUANTO pesa cada nivel. Faltava dizer QUAL
   * linha merece qual nivel, e era ai que a folha estava invertida. Medido no
   * fluxo de conteudo do piloto: no exercicio 17 as duas bissetrizes, que SAO a
   * pergunta, saiam com 0,60 pt, em COR.teal (61 por cento de tinta) e
   * tracejadas [3 2]. O traco mais fraco das 23 paginas era o unico que
   * carregava a questao. Pior: [3 2] em teal e o codigo que a especificacao
   * reserva para a camada de GABARITO, entao o enunciado saia vestido de
   * resposta, e os dois codigos apareciam na mesma folha querendo dizer coisas
   * diferentes.
   *
   * Tres regras, e a FASE da figura diz qual delas vale: dentro do gabarito so a
   * terceira, fora dele a primeira ou a segunda, nesta ordem. Sem ctx a fase cai
   * em 'enunciado', que e o padrao do base.js e o lado seguro.
   *
   * Nenhuma das tres inventa nivel novo nem tinta nova:
   * as tres so escolhem entre os niveis que ja estao no ESPESSURA e entre as
   * cores que ja estao na paleta. A relacao 2 para 1 da NBR 8403 continua de pe,
   * porque quem sobe, sobe para 0,9, que e o nivel do meio e ja existia para a
   * marca de congruencia; o contorno segue em 1,2 e o auxiliar em 0,6.
   *
   *   OBJETO    papel de ceviana, de diagonal ou declarado 'objeto' e a linha
   *             que a pergunta manda olhar. Fora da fase de gabarito ela sai
   *             CONTINUA, em 0,9 pt (ou mais, se quem chamou pediu mais) e na
   *             tinta do contorno. Ela se distingue do contorno de 1,2 por
   *             ESPESSURA e nunca por cor, que e o unico canal que sobrevive a
   *             fotocopia em preto e branco: navy contra teal da 2,33 de
   *             contraste, e em cinza os dois viram 79 e 61 por cento de tinta.
   *   CODIGO    teal e [3 2] sao as duas metades do codigo da camada de
   *             gabarito. Fora dela nenhuma das duas pode aparecer, nem junta
   *             nem separada: teal vira a tinta do contorno e [3 2] vira traco
   *             continuo. A metade sozinha nao e inofensiva, e o que faz a
   *             aluna procurar a outra. Quem precisa dizer "construcao" no
   *             enunciado diz pela espessura, que e o canal que a folha
   *             fotocopiada mantem: 0,6 contra 1,2 do contorno. Esta e a mesma
   *             regra que o conferirFigura do base.js faz cumprir na saida, e
   *             ela esta aqui para a folha ja nascer certa em vez de nascer
   *             errada e ser acusada depois.
   *   DESTAQUE  dentro da fase de gabarito o teal e legitimo, e ai ele nao pode
   *             sair na espessura minima: teal e a tinta de "olhe aqui" e 0,6 e
   *             o peso de "isto e apoio", e a folha impressa resolve a
   *             contradicao pela mais fraca. Traco em teal pesa no minimo 0,9.
   *             Quem desenha malha passa abaixoDoPiso e fica de fora, que e a
   *             mesma excecao ja declarada no conferirEspessura.
   *
   * A correcao e CALADA de proposito, e nao por comodidade: ela nao e erro de
   * quem escreveu a receita, e uma regra de folha que o nucleo faz cumprir
   * sozinho, do mesmo jeito que o halo do rotulo se move sozinho em vez de
   * acusar quem pediu o rotulo. Um aviso aqui tambem seria um aviso por figura
   * em todo tema que ja usa ceviana, e o gate do piloto e "zero aviso de
   * figura". O que a correcao deixa e RASTRO: cada uma entra em
   * doc.tintaHierarquia com o antes e o depois, e e por ali que se confere que
   * ela aconteceu. Quem precisar desenhar o codigo do gabarito fora de uma
   * figura com fase declarada passa tintaLivre e responde por isso. */
  var PAPEL_OBJETO = {
    ceviana: 1, diagonal: 1, objeto: 1,
    /* Os quatro tipos de ceviana tambem valem escritos sozinhos, porque quem
     * chama nem sempre prefixa: papel 'bissetriz' e papel 'ceviana bissetriz'
     * sao a mesma linha na folha. */
    altura: 1, mediana: 1, bissetriz: 1, mediatriz: 1
  };

  function familiaDePapel(papel) {
    return String(papel == null ? '' : papel).trim().toLowerCase().split(/\s+/)[0];
  }

  /* Comparacao por VALOR e nao por identidade: uma receita pode escrever a cor a
   * mao, e [0.180392, 0.490196, 0.419608] escrito a mao e teal do mesmo jeito. A
   * folga de 0,002 e menor do que o passo entre duas cores da paleta e maior do
   * que qualquer arredondamento de duas casas. */
  function mesmaTinta(a, b) {
    if (!a || !b || a.length < 3 || b.length < 3) return false;
    for (var i = 0; i < 3; i++) if (Math.abs(a[i] - b[i]) > 0.002) return false;
    return true;
  }

  /* Decide a tinta final de um traco. Devolve sempre um objeto novo, com o campo
   * motivo preenchido quando alguma das tres regras mudou alguma coisa. */
  function tintaDePapel(A, op, papel, cor, espessura, tracejado) {
    var COR = gerador().COR;
    var saida = {
      cor: cor, espessura: Number(espessura), tracejado: tracejado || null, motivo: null
    };
    if (op && op.tintaLivre === true) return saida;
    /* Sem ctx nao ha fase declarada, e o padrao do base.js e 'enunciado': a folha
     * conservadora e a que nao deixa passar o codigo da resposta. */
    var fase = (A.ctx && A.ctx.fase) || 'enunciado';
    var antes = { cor: cor, espessura: saida.espessura, tracejado: saida.tracejado };
    var fino = !(op && op.abaixoDoPiso === true) &&
      saida.espessura > 0 && saida.espessura < ESPESSURA.marca;

    if (fase === 'gabarito') {
      /* Na camada de resposta o codigo e legitimo e fica como veio. Sobra a
       * hierarquia: destaque nao mora na espessura minima. */
      if (mesmaTinta(saida.cor, COR.teal) && fino) {
        saida.espessura = ESPESSURA.marca;
        saida.motivo = 'destaque';
      }
    } else if (PAPEL_OBJETO[familiaDePapel(papel)]) {
      saida.cor = COR.texto;
      saida.espessura = Math.max(saida.espessura, ESPESSURA.marca);
      saida.tracejado = null;
      saida.motivo = 'objeto';
    } else {
      if (mesmaTinta(saida.cor, COR.teal)) {
        saida.cor = COR.texto;
        saida.motivo = 'codigo';
      }
      if (ehAuxiliar(saida.tracejado)) {
        saida.tracejado = null;
        saida.motivo = 'codigo';
      }
    }
    if (saida.motivo) anotarTinta(A, papel, fase, antes, saida);
    return saida;
  }

  /* O tracejado chega pelo nome ('auxiliar') ou pelo padrao cru ('[3 2] 0'), e as
   * duas formas dizem a mesma coisa no fluxo de conteudo. Perguntar so pelo nome
   * deixaria passar quem escreveu o padrao a mao, que e o caso mais provavel de
   * quem esta copiando de uma figura antiga. */
  function ehAuxiliar(t) {
    if (!t) return false;
    if (t === true || t === 'auxiliar') return true;
    var s = typeof t === 'string' ? t : (t.length ? '[' + Array.prototype.join.call(t, ' ') + ']' : '');
    return s.replace(/\s+/g, ' ').indexOf('[3 2]') === 0;
  }

  /* O rastro. Fica no doc e nao no registro da figura porque ele serve para
   * conferir a FOLHA inteira de uma vez, inclusive o que foi desenhado sem
   * figura(). */
  function anotarTinta(A, papel, fase, antes, depois) {
    var doc = A.doc;
    if (!doc) return;
    if (!doc.tintaHierarquia) doc.tintaHierarquia = [];
    doc.tintaHierarquia.push({
      papel: papel || null, fase: fase, motivo: depois.motivo,
      de: { cor: antes.cor, espessura: antes.espessura, tracejado: antes.tracejado },
      para: { cor: depois.cor, espessura: depois.espessura, tracejado: depois.tracejado }
    });
  }

  /* ============================================================ poligono
   *
   *   poligono(doc, pontos, {cor, espessura, preenche, furos, fechado,
   *                          tracejado, contorno, recorte, papel})
   *
   * Caminho PDF unico: um m, uma sequencia de l, um h e UM operador de fim. E
   * essa unidade que da juncao de canto; quatro doc.linha nao dao, e o entalhe em
   * cada vertice aparece a olho nu em 1,2 pt.
   *
   * Os furos preenchem por regra par e impar (f*), que e o que da coroa
   * circular, moldura e regiao entre duas figuras sem uma unica conta de
   * intersecao. A regra par e impar nao olha o sentido de percurso, entao o furo
   * pode vir na mesma volta do contorno externo: e a diferenca entre isto
   * funcionar sempre e funcionar quando quem escreveu a receita lembrou de
   * inverter a volta. */
  function poligono(alvo, pontos, op) {
    op = op || {};
    var A = alvoDe(alvo), doc = A.doc;
    var B = base(), g = gerador(), COR = g.COR;

    var pts = normLista(pontos);
    if (pts.length < 2) {
      avisar(doc, 'poligono com menos de dois pontos, nao desenha');
      return null;
    }

    var fechado = op.fechado !== false;
    var contorna = op.contorno !== false;
    var espessura = op.espessura != null ? Number(op.espessura) : ESPESSURA.contorno;
    var cor = op.cor || COR.texto;
    var tracejado = op.tracejado || null;

    /* A hierarquia de tinta antes das conferencias e antes do comEstado: o que
     * vai ser conferido e o que vai para o fluxo tem que ser a MESMA linha. O
     * papel e lido aqui em cima, e nao la embaixo na hora de anotar, pelo mesmo
     * motivo. */
    var papel = op.papel || (contorna ? 'contorno' : 'preenchimento');
    if (contorna) {
      var tinta = tintaDePapel(A, op, papel, cor, espessura, tracejado);
      cor = tinta.cor; espessura = tinta.espessura; tracejado = tinta.tracejado;
    }

    var preenche = op.preenche;
    if (preenche === true) {
      /* Preenchimento sem cor era o pedido mais comum e o mais perigoso: cair em
       * COR.soft daria 1,12 de contraste e a regiao pedida sumiria na folha
       * impressa, que e exatamente o defeito que a especificacao proibe pelo
       * nome. Aqui ele grita e sai no cinza de area provisorio. */
      avisar(doc, 'poligono: preenche=true sem cor, usando o cinza de area provisorio');
      preenche = CINZA_AREA;
    }

    var furos = [];
    if (op.furos) {
      /* Um furo so pode chegar como lista de pontos, e nao como lista de listas.
       * A distincao nao pode ser feita por "o primeiro elemento tem length",
       * porque um ponto escrito como par [x, y] TAMBEM tem length: e o mesmo
       * defeito que o base.js mediu no recorte, onde uma lista de pares passava
       * por lista de poligonos e o recorte sumia inteiro, em silencio. Aqui a
       * pergunta e "o primeiro elemento e um ponto?", que responde certo nos dois
       * formatos. */
      var brutos = op.furos;
      if (brutos.length && ehPonto(brutos[0])) brutos = [brutos];
      for (var f = 0; f < brutos.length; f++) {
        var furo = normLista(brutos[f]);
        if (furo.length < 3) { avisar(doc, 'poligono: furo com menos de tres pontos, ignorado'); continue; }
        furos.push(furo);
      }
    }

    if (contorna) {
      conferirCor(doc, cor, 'poligono');
      conferirEspessura(doc, espessura, 'poligono', op.abaixoDoPiso);
    }

    var fim;
    if (preenche && contorna) fim = furos.length ? 'B*' : 'B';
    else if (preenche) fim = furos.length ? 'f*' : 'f';
    else if (contorna) fim = 'S';
    else {
      avisar(doc, 'poligono sem contorno e sem preenchimento, nada seria desenhado');
      return null;
    }

    B.comEstado(doc, {
      tracejado: tracejado,
      recorte: op.recorte || null,
      cor: cor,
      preenchimento: preenche || undefined,
      espessura: espessura
    }, function () {
      /* 1 J e ponta redonda, 1 j e juncao redonda. Sem a juncao, um vertice
       * agudo em 1,2 pt sai com o bico da meia esquadria comprido; com ela o
       * canto fica limpo em qualquer abertura, inclusive nos 5 graus. */
      doc.op('1 J 1 j');
      var caminho = caminhoPoligono(pts, fechado);
      for (var i = 0; i < furos.length; i++) caminho += caminhoPoligono(furos[i], true);
      doc.op(caminho + fim);
    });

    var reg = {
      tipo: 'poligono', pontos: pts, furos: furos, fechado: fechado,
      espessura: contorna ? espessura : 0, papel: papel,
      caixa: B.geo.caixa(pts)
    };
    /* Cada lado entra como um traco proprio no registro, e nao o poligono
     * inteiro: o conferirFigura testa rotulo cruzando ARESTA, e para isso ele
     * precisa dos segmentos, nao da caixa. Poligono so de preenchimento nao
     * anota traco nenhum: ele nao tem aresta desenhada, e um traco de espessura
     * zero no registro seria lido como traco abaixo do piso. */
    if (contorna) {
      var n = pts.length, ate = fechado ? n : n - 1;
      for (var s = 0; s < ate; s++) {
        var P = pts[s], Q = pts[(s + 1) % n];
        A.anota(papel === 'marca' ? 'marca' : 'traco', {
          x1: P.x, y1: P.y, x2: Q.x, y2: Q.y, espessura: espessura, papel: papel
        });
      }
    }
    return reg;
  }

  function caminhoPoligono(pts, fechado) {
    var s = '';
    for (var i = 0; i < pts.length; i++) {
      s += n2(pts[i].x) + ' ' + n2(pts[i].y) + (i === 0 ? ' m ' : ' l ');
    }
    if (fechado) s += 'h ';
    return s;
  }

  /* ============================================================ arco
   *
   *   arco(doc, centro, rx, ry, grau0, grau1, {cor, espessura, tracejado,
   *                                            setor, corda, giro, preenche,
   *                                            contorno, recorte, papel})
   *
   * Angulo em graus, zero no sentido do x que cresce, crescendo no anti-horario,
   * que e o sentido do plano cartesiano e o mesmo do resto do kit geometrico (o
   * y do PDF cresce para cima, entao nao ha inversao a fazer). ry ausente vale
   * ry igual a rx, que e o circulo.
   *
   * Um Bezier cubico NAO aproxima meia circunferencia: em 180 graus o erro
   * radial passa de 2,7 por cento do raio, o que num raio de 60 pt e mais de um
   * ponto e meio de desvio, visivel ao lado de uma reta. Em trechos de ate 90
   * graus com k igual a quatro tercos da tangente de um quarto do trecho o erro
   * cai para 0,027 por cento, ou 0,016 pt no mesmo raio: menos que a espessura
   * do traco.
   *
   * Raios independentes em x e em y dao a elipse dos solidos em perspectiva. Nao
   * e contradicao com a regra de escala unica: la a escala e do ENQUADRAMENTO da
   * figura e precisa ser isotropica, senao o quadradinho de angulo reto mente;
   * aqui o achatamento e a propria forma que se quer desenhar, e ele e decidido
   * pela folha inteira, para um cilindro nao parecer visto de cima ao lado de um
   * vizinho visto de lado. */
  function arco(alvo, centro, rx, ry, grau0, grau1, op) {
    op = op || {};
    var A = alvoDe(alvo), doc = A.doc;
    var B = base(), g = gerador(), COR = g.COR;

    var C = norm(centro);
    rx = Number(rx);
    ry = (ry === undefined || ry === null) ? rx : Number(ry);
    var g0 = Number(grau0), g1 = Number(grau1);
    if (!isFinite(rx) || !isFinite(ry) || rx <= 0 || ry <= 0) {
      avisar(doc, 'arco com raio invalido, nao desenha');
      return null;
    }
    if (!isFinite(g0) || !isFinite(g1)) { avisar(doc, 'arco com angulo invalido, nao desenha'); return null; }

    var varre = g1 - g0;
    if (Math.abs(varre) < 1e-6) { avisar(doc, 'arco de abertura zero, nao desenha'); return null; }
    if (Math.abs(varre) > 360) varre = varre > 0 ? 360 : -360;

    var setor = !!op.setor, corda = !!op.corda;
    if (setor && corda) { avisar(doc, 'arco com setor e corda ao mesmo tempo, vale o setor'); corda = false; }

    var contorna = op.contorno !== false;
    var espessura = op.espessura != null ? Number(op.espessura) : ESPESSURA.contorno;
    var cor = op.cor || COR.texto;
    var tracejado = op.tracejado || null;
    var papel = op.papel || 'contorno';
    /* Mesma ordem do poligono: hierarquia de tinta, depois conferencia, depois
     * fluxo. Vale tambem para o arco porque ceviana de figura curva e arco de
     * destaque caem aqui e nao la. */
    if (contorna) {
      var tinta = tintaDePapel(A, op, papel, cor, espessura, tracejado);
      cor = tinta.cor; espessura = tinta.espessura; tracejado = tinta.tracejado;
    }
    var preenche = op.preenche;
    if (preenche === true) {
      avisar(doc, 'arco: preenche=true sem cor, usando o cinza de area provisorio');
      preenche = CINZA_AREA;
    }
    /* Preencher arco aberto nao e erro de sintaxe: o PDF fecha o caminho pela
     * corda sozinho na hora do f, e o resultado e um segmento circular onde
     * quem chamou queria um setor. Como os dois sao figuras legitimas, a saida e
     * avisar e desenhar o que foi pedido, nao adivinhar. */
    if (preenche && !setor && !corda && Math.abs(varre) < 359.999) {
      avisar(doc, 'arco preenchido sem setor nem corda: o PDF fecha pela corda');
    }
    if (contorna) {
      conferirCor(doc, cor, 'arco');
      conferirEspessura(doc, espessura, 'arco', op.abaixoDoPiso);
    }

    var giro = Number(op.giro) || 0;
    var trechos = trechosDeArco(C, rx, ry, g0, g0 + varre, giro);
    var inicio = trechos[0].p0, fim = trechos[trechos.length - 1].p3;

    var operador;
    if (preenche && contorna) operador = 'B';
    else if (preenche) operador = 'f';
    else if (contorna) operador = 'S';
    else { avisar(doc, 'arco sem contorno e sem preenchimento, nada seria desenhado'); return null; }

    B.comEstado(doc, {
      tracejado: tracejado,
      recorte: op.recorte || null,
      cor: cor,
      preenchimento: preenche || undefined,
      espessura: espessura
    }, function () {
      doc.op('1 J 1 j');
      var s = '';
      if (setor) s += n2(C.x) + ' ' + n2(C.y) + ' m ' + n2(inicio.x) + ' ' + n2(inicio.y) + ' l ';
      else s += n2(inicio.x) + ' ' + n2(inicio.y) + ' m ';
      for (var i = 0; i < trechos.length; i++) {
        var t = trechos[i];
        s += n2(t.c1.x) + ' ' + n2(t.c1.y) + ' ' + n2(t.c2.x) + ' ' + n2(t.c2.y) + ' ' +
             n2(t.p3.x) + ' ' + n2(t.p3.y) + ' c ';
      }
      if (setor || corda || Math.abs(varre) >= 359.999) s += 'h ';
      doc.op(s + operador);
    });

    var reg = {
      tipo: 'arco', centro: C, rx: rx, ry: ry, de: g0, ate: g0 + varre, giro: giro,
      setor: setor, corda: corda, espessura: contorna ? espessura : 0,
      papel: papel, inicio: inicio, fim: fim
    };
    A.anota(reg.papel === 'marca' ? 'marca' : 'traco', reg);
    return reg;
  }

  /* Divide o arco em trechos de no maximo 90 graus e devolve os quatro pontos de
   * controle de cada um, ja levados para a pagina. A transformacao elipse mais
   * giro mais translacao e afim, e transformacao afim leva Bezier em Bezier com
   * os MESMOS parametros, entao basta mapear os quatro pontos de controle: e por
   * isso que a elipse girada nao precisa de conta propria. */
  function trechosDeArco(C, rx, ry, g0, g1, giro) {
    var co = Math.cos(rad(giro)), se = Math.sin(rad(giro));
    function mapa(x, y) {              // circulo unitario -> elipse girada na pagina
      var ex = x * rx, ey = y * ry;
      return pt(C.x + ex * co - ey * se, C.y + ex * se + ey * co);
    }
    var total = g1 - g0;
    var n = Math.max(1, Math.ceil(Math.abs(total) / 90 - 1e-9));
    var passo = total / n;
    var k = 4 / 3 * Math.tan(rad(passo) / 4);
    var saida = [];
    for (var i = 0; i < n; i++) {
      var a = rad(g0 + i * passo), b = rad(g0 + (i + 1) * passo);
      var ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      saida.push({
        p0: mapa(ca, sa),
        c1: mapa(ca - k * sa, sa + k * ca),
        c2: mapa(cb + k * sb, sb - k * cb),
        p3: mapa(cb, sb)
      });
    }
    return saida;
  }

  /* Poligonal que acompanha o arco, para quem precisa da REGIAO e nao do traco:
   * o caminho de recorte do base.js so entende m, l e h, entao a hachura de
   * setor e de coroa e feita recortando por esta poligonal. Passo de 9 graus da
   * flecha de 0,0031 do raio (0,19 pt num raio de 60), menos do que a espessura
   * da propria hachura. */
  function arcoPontos(centro, rx, ry, grau0, grau1, op) {
    op = op || {};
    var C = norm(centro);
    ry = (ry === undefined || ry === null) ? rx : Number(ry);
    var giro = Number(op.giro) || 0;
    var co = Math.cos(rad(giro)), se = Math.sin(rad(giro));
    var total = Number(grau1) - Number(grau0);
    if (Math.abs(total) > 360) total = total > 0 ? 360 : -360;
    var passo = Math.abs(Number(op.passo)) || 9;
    var n = Math.max(2, Math.ceil(Math.abs(total) / passo));
    var saida = [];
    if (op.setor) saida.push(pt(C.x, C.y));
    for (var i = 0; i <= n; i++) {
      var t = rad(Number(grau0) + total * i / n);
      var ex = Math.cos(t) * rx, ey = Math.sin(t) * ry;
      saida.push(pt(C.x + ex * co - ey * se, C.y + ex * se + ey * co));
    }
    return saida;
  }

  /* ================================================== o halo contra o contorno
   *
   * O halo e branco chapado e e pintado por ULTIMO: onde ele cai, o que estava
   * embaixo some. Medido em tres cartoes da prova deste modulo, ele estava
   * comendo justamente o contorno que a figura existe para mostrar: no furo
   * redondo o circulo saia com uma mordida na base, e na coroa circular o "R" da
   * cota apagava um pedaco inteiro da circunferencia interna, que e a linha que
   * define a coroa. Apagar o halo nao e saida (sem ele a hachura corta a letra) e
   * apagar o contorno e pior, entao o rotulo se MOVE: o minimo que baste para o
   * retangulo do halo ficar livre.
   *
   * O teste e feito contra o REGISTRO da figura, que na camada de rotulos ja tem
   * tudo o que o fundo, o preenchimento, a hachura e o contorno desenharam. Isso
   * tem uma consequencia que vale escrever: quem chama rotulo() com o doc cru, e
   * nao com o ctx do figura(), nao tem registro e por isso nao tem esse cuidado.
   * A auditoria e a fuga bebem da mesma fonte de proposito.
   */

  /* Segmento contra retangulo reto, por corte de faixas (Liang-Barsky). Devolve
   * verdadeiro tambem quando o segmento esta inteiro dentro do retangulo, que e o
   * caso do tracinho de congruencia curto por baixo de um numero. */
  function segmentoCruzaCaixa(ax, ay, bx, by, x0, y0, x1, y1) {
    var t0 = 0, t1 = 1, dx = bx - ax, dy = by - ay;
    var p = [-dx, dx, -dy, dy];
    var q = [ax - x0, x1 - ax, ay - y0, y1 - ay];
    for (var i = 0; i < 4; i++) {
      if (Math.abs(p[i]) < EPS) {
        if (q[i] < 0) return false;               // paralelo e fora da faixa
        continue;
      }
      var r = q[i] / p[i];
      if (p[i] < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
      else { if (r < t0) return false; if (r < t1) t1 = r; }
    }
    return true;
  }

  /* Tudo o que ja foi desenhado, reduzido a segmentos e levado para o sistema do
   * proprio rotulo (e1 ao longo do texto, e2 na normal dele). No sistema do
   * rotulo a caixa girada volta a ser um retangulo reto, e um teste so serve para
   * o texto na horizontal e para o texto deitado.
   *
   * O arco vira poligonal de 6 graus, que e a mesma aproximacao que o arcoPontos
   * ja usa para recorte: a flecha fica em 0,0014 do raio, muito abaixo da
   * espessura do traco, entao o teste nao erra por causa dela. */
  function obstaculosDoRotulo(ctx, cx, cy, e1, e2, exceto) {
    var saida = [];
    if (!ctx || !ctx.registro) return saida;
    var reg = ctx.registro;
    var listas = [reg.tracos, reg.marcas, reg.pontos];
    /* O que o halo TEM o direito de cobrir nao entra na lista, senao o conserto
     * derrubaria a razao de o halo existir: a regra escrita e "halo branco por
     * baixo, para hachura e malha nao cortarem o rotulo". Malha e hachura sao
     * apoio de leitura, nao portadores, e o mesmo vale para qualquer traco
     * abaixo do piso de 0,6 pt, que so e autorizado justamente para a malha. O
     * que nao pode ser comido e contorno, marca e aresta.
     *
     * A guia deixou de estar nessa lista por atacado. Ela entra so quando quem
     * a desenhou disse que ela e apoio (carrega falso): a guia que liga o ponto
     * ao eixo E a leitura, e apagar meio ponto dela com o halo devolve o mesmo
     * defeito que o [2 2] veio consertar. */
    function apoio(d) {
      if (d.papel === 'guia') return d.carrega !== true;
      if (d.papel === 'malha' || d.papel === 'hachura') return true;
      if (d.tipo === 'hachura') return true;
      return d.espessura > 0 && d.espessura < PISO_ESPESSURA;
    }
    function guardar(ax, ay, bx, by) {
      saida.push({
        ax: (ax - cx) * e1.x + (ay - cy) * e1.y, ay: (ax - cx) * e2.x + (ay - cy) * e2.y,
        bx: (bx - cx) * e1.x + (by - cy) * e1.y, by: (bx - cx) * e2.x + (by - cy) * e2.y
      });
    }
    for (var l = 0; l < listas.length; l++) {
      var lista = listas[l] || [];
      for (var i = 0; i < lista.length; i++) {
        var d = lista[i];
        if (!d || apoio(d) || dentroDaLista(exceto, d)) continue;
        if (d.tipo === 'arco' && d.centro) {
          var pts = arcoPontos(d.centro, d.rx, d.ry, d.de, d.ate, { passo: 6, giro: d.giro });
          for (var j = 0; j + 1 < pts.length; j++) guardar(pts[j].x, pts[j].y, pts[j + 1].x, pts[j + 1].y);
          if (d.setor) {
            guardar(d.centro.x, d.centro.y, pts[0].x, pts[0].y);
            guardar(d.centro.x, d.centro.y, pts[pts.length - 1].x, pts[pts.length - 1].y);
          }
        } else if (d.x1 != null && d.x2 != null) {
          guardar(d.x1, d.y1, d.x2, d.y2);
        } else if (d.raio != null && d.x != null) {
          /* Bolinha do ponto, pelo quadrado que a contem: apagar a bolinha
           * inteira e tao ruim quanto apagar um pedaco de contorno, e a diferenca
           * entre o quadrado e o circulo e menos de um ponto no raio de 2,2. */
          var r = d.raio;
          guardar(d.x - r, d.y - r, d.x + r, d.y - r);
          guardar(d.x + r, d.y - r, d.x + r, d.y + r);
          guardar(d.x + r, d.y + r, d.x - r, d.y + r);
          guardar(d.x - r, d.y + r, d.x - r, d.y - r);
        }
      }
    }
    return saida;
  }

  function dentroDaLista(lista, d) {
    for (var i = 0; i < (lista || []).length; i++) if (lista[i] === d) return true;
    return false;
  }

  /* O retangulo do halo, deslocado de (ox, oy) no sistema do rotulo, esta livre?
   * A margem de meio ponto existe porque o contorno tem 1,2 pt de largura e a
   * lista guarda o EIXO dele: encostar o halo no eixo ja comeria meia espessura. */
  function haloLivre(obst, ox, oy, hw, hh) {
    var x0 = ox - hw - 0.6, x1 = ox + hw + 0.6, y0 = oy - hh - 0.6, y1 = oy + hh + 0.6;
    for (var i = 0; i < obst.length; i++) {
      var o = obst[i];
      if (segmentoCruzaCaixa(o.ax, o.ay, o.bx, o.by, x0, y0, x1, y1)) return false;
    }
    return true;
  }

  /* Procura o MENOR deslocamento que libera o halo, testando os sentidos na
   * ordem em que quem chama os ofereceu e a distancia em passos crescentes: o
   * laco da distancia por fora e o dos sentidos por dentro, senao a busca acharia
   * 20 pt no primeiro sentido antes de achar 3 pt no segundo. Devolve null quando
   * nao ha posicao livre no alcance. */
  function fugirDoHalo(obst, dirs, hw, hh, e1, e2, cabe) {
    for (var s = FUGA_PASSO; s <= FUGA_MAX + EPS; s += FUGA_PASSO) {
      for (var d = 0; d < dirs.length; d++) {
        var dx = dirs[d].x * s, dy = dirs[d].y * s;
        if (cabe && !cabe(dx, dy)) continue;
        var ox = dx * e1.x + dy * e1.y, oy = dx * e2.x + dy * e2.y;
        if (haloLivre(obst, ox, oy, hw, hh)) return { x: dx, y: dy, dist: s };
      }
    }
    return null;
  }

  /* Distancia do centro da caixa ate a borda dela na direcao d, com a caixa
   * GIRADA junto com o texto. E o que faz o afastamento valer o mesmo para uma
   * letra, para "12,5 cm" e para qualquer inclinacao. */
  function suporteCaixa(d, e1, e2, hw, hh) {
    return Math.abs(d.x * e1.x + d.y * e1.y) * hw + Math.abs(d.x * e2.x + d.y * e2.y) * hh;
  }

  /* ============================================================ rotulo
   *
   *   rotulo(doc, texto, ancora, {direcao, afastamento, tam, cor, bold, halo,
   *                               chamada, giro, align, limites, papel,
   *                               fuga, exceto})
   *
   * Sem direcao o rotulo fica CENTRADO na ancora, que e o caso do texto dentro de
   * uma celula ou no meio de uma barra. Com direcao ele e empurrado para fora, e
   * o afastamento e o vao ate a BORDA da caixa e nao ate o centro dela: e essa
   * escolha que faz o mesmo numero valer para "A" e para "12,5 cm", e para uma
   * direcao diagonal tanto quanto para uma horizontal. O caso medido que obriga a
   * isso e o rotulo de lado num triangulo bem obtuso, onde a normal externa
   * chega quase paralela ao lado e um afastamento contado ate o centro empilhava
   * os numeros um sobre o outro no meio do desenho.
   *
   * O align sai do sinal da componente horizontal so quando quem chama pede: por
   * dentro o texto e sempre desenhado centrado na caixa que foi calculada, o que
   * ja e o comportamento certo. O align continua aceito porque grade, cota de
   * barra e reta numerica alinham coluna. */
  function rotulo(alvo, texto, ancora, op) {
    op = op || {};
    var A = alvoDe(alvo), doc = A.doc;
    var B = base(), g = gerador(), COR = g.COR;

    var txt = String(texto == null ? '' : texto);
    if (!txt.trim()) return null;

    var tam = Number(op.tam) || TAM_PADRAO;
    if (tam < PISO_CORPO) {
      avisar(doc, 'rotulo "' + txt + '" em ' + tam + ' pt, abaixo do piso de ' + PISO_CORPO + ' pt');
    }
    var cor = op.cor || COR.texto;
    conferirCor(doc, cor, 'rotulo "' + txt + '"');

    /* Simbolo que a fonte nao tem sai como interrogacao SILENCIOSA na folha
     * impressa: gama, fi, congruente, perpendicular, paralelo, angulo, o menos
     * tipografico e o circunflexo sobre B, C ou G. E o defeito que ja deixou 38
     * letras pi virarem interrogacao neste projeto porque a trava veio tarde.
     * Aqui a pergunta e feita ao proprio gerador, para nao existir uma segunda
     * lista que diverge da dele. */
    if (typeof g.caracteresQueNaoDesenha === 'function') {
      var fora = g.caracteresQueNaoDesenha(txt);
      if (fora && fora.length) {
        avisar(doc, 'rotulo "' + txt + '" tem caractere que a fonte nao desenha: ' + fora.join(' '));
      }
    }

    var largura = g.medir(txt, tam, !!op.bold);
    var hw = largura / 2 + PAD_HALO;
    var hh = MEIA_ALTURA * tam;

    /* O giro e decidido ANTES de posicionar, e nao depois, porque um rotulo
     * deitado ocupa outra caixa: "hipotenusa" a 40 graus e 25 pt mais alto e 25
     * pt menos largo do que deitado no eixo. Calculado depois, o recorte de
     * limites empurrava pela caixa errada e a palavra girada saia meio ponto
     * para fora do bloco branco, por cima da marca d'agua. */
    var giro = normalizarGiro(op.giro);
    if (giro && temSimbolo(g, txt)) {
      /* Texto girado so em latino, e com parcimonia. O trecho em Symbol dentro de
       * um Tm exigiria trocar de fonte no meio do mesmo BT com a matriz ja
       * aplicada, e o ganho nao paga: um pi deitado num rotulo de 8,5 pt nao se
       * le de qualquer jeito. */
      avisar(doc, 'rotulo "' + txt + '": texto com simbolo nao gira, saiu na horizontal');
      giro = 0;
    }
    /* Duas caixas, e confundir uma com a outra era o defeito do rotulo girado.
     * A caixa PROPRIA acompanha o texto e mora nos eixos e1 (ao longo) e e2 (na
     * normal): e ela que manda no afastamento, no halo e no teste de colisao. A
     * ENVOLVENTE alinhada aos eixos da pagina e a que vai para o registro e para
     * o recorte de limites, porque os dois sao testes de retangulo reto.
     *
     * Medido na prova: "hipotenusa" a 37 graus tem 16,7 pt de meia altura na
     * envolvente contra 4,6 na caixa deitada, e como o afastamento saia da
     * envolvente a palavra era empurrada quase 30 pt para fora do proprio lado
     * que ela nomeia, em vez dos 4 pt pedidos. Com a caixa girada o vao volta a
     * ser o mesmo do rotulo nao girado, medido na normal do ponto medio. */
    var e1 = pt(Math.cos(rad(giro)), Math.sin(rad(giro)));
    var e2 = pt(-e1.y, e1.x);
    var cg = Math.abs(e1.x), sg = Math.abs(e1.y);
    var ehw = cg * hw + sg * hh, ehh = sg * hw + cg * hh;

    var dir = op.direcao ? versor(op.direcao) : null;
    if (op.direcao && !dir) {
      /* Direcao nula quer dizer que a geometria nao tinha direcao: dois pontos
       * coincidentes, bissetriz de angulo raso. Chutar uma direcao aqui deixaria
       * a letra num lugar que ninguem consegue explicar depois. */
      avisar(doc, 'rotulo "' + txt + '": direcao nula, ficou centrado na ancora');
    }
    var afast = op.afastamento != null ? Number(op.afastamento) : (dir ? AFAST_PADRAO : 0);

    var anc = norm(ancora);
    var cx, cy;
    if (dir) {
      /* Funcao de suporte da caixa na direcao pedida: a distancia do centro ate
       * a borda, medida ao longo de dir. Somada ao afastamento, ela garante o
       * mesmo vao visivel em qualquer inclinacao e para qualquer comprimento de
       * texto. */
      var sup = suporteCaixa(dir, e1, e2, hw, hh);
      cx = anc.x + dir.x * (afast + sup);
      cy = anc.y + dir.y * (afast + sup);
    } else {
      cx = anc.x; cy = anc.y;
    }

    /* Rotulo que sai do bloco da figura nao pode simplesmente sair: o retangulo
     * branco do figura() nao chega la, entao a letra cruza a marca d'agua, o
     * texto do exercicio ou a figura seguinte. Puxado de volta para dentro, ele
     * deixa de estar na direcao exata e por isso ganha o fio de chamada, que e o
     * que mantem a leitura de a quem ele pertence. */
    var limites = op.limites !== undefined ? op.limites : A.limites;
    var puxou = false;
    if (limites && dir) {
      var nx = Math.min(Math.max(cx, limites.x0 + ehw), limites.x1 - ehw);
      var ny = Math.min(Math.max(cy, limites.y0 + ehh), limites.y1 - ehh);
      /* Bloco mais estreito do que o proprio rotulo: nao ha posicao que caiba, e
       * empurrar pelos dois lados ao mesmo tempo devolveria um valor sem sentido.
       * Centrar e o unico comportamento honesto, e o aviso deixa o conferirFigura
       * reprovar o tema em vez de a folha sair com a palavra passando da margem. */
      if (limites.x1 - limites.x0 < 2 * ehw) {
        nx = (limites.x0 + limites.x1) / 2;
        avisar(doc, 'rotulo "' + txt + '" mais largo do que o bloco da figura');
      }
      if (limites.y1 - limites.y0 < 2 * ehh) ny = (limites.y0 + limites.y1) / 2;
      if (Math.abs(nx - cx) > 1 || Math.abs(ny - cy) > 1) puxou = true;
      cx = nx; cy = ny;
    }

    /* O halo e pintado por ultimo e em branco chapado, entao onde ele cai o
     * contorno some. Antes de pintar, o retangulo dele e testado contra o que ja
     * foi desenhado e o rotulo e empurrado o minimo que baste para ficar livre.
     * A direcao da fuga e, em ordem: a direcao em que o rotulo ja estava sendo
     * empurrado (que e a que a geometria escolheu), depois o eixo que quem chama
     * declarou em fuga (a cota manda a propria linha de cota, para o numero
     * deslizar ao longo dela em vez de sair dela), e so entao os quatro sentidos
     * da pagina, para o rotulo centrado, que nao tem direcao nenhuma. */
    var haloW = hw, haloH = hh, desviou = 0, tarja = false;
    if (op.halo !== false) {
      var obst = obstaculosDoRotulo(A.ctx, cx, cy, e1, e2, op.exceto);
      if (obst.length && !haloLivre(obst, 0, 0, hw, hh)) {
        var dirs = [];
        if (dir) dirs.push(dir);
        var vf = op.fuga ? versor(op.fuga) : null;
        if (vf) { dirs.push(vf); dirs.push(pt(-vf.x, -vf.y)); }
        if (!dirs.length) dirs = [pt(0, 1), pt(0, -1), pt(1, 0), pt(-1, 0)];
        /* O limite do bloco so vira restricao da fuga quando o rotulo JA estava
         * dentro dele: exigir de uma posicao nova o que a antiga nao cumpria
         * reprovaria toda a busca e a tarja sairia sem necessidade. */
        var cabe = null;
        if (limites && cx - ehw >= limites.x0 && cx + ehw <= limites.x1 &&
            cy - ehh >= limites.y0 && cy + ehh <= limites.y1) {
          cabe = function (dx, dy) {
            return cx + dx - ehw >= limites.x0 && cx + dx + ehw <= limites.x1 &&
                   cy + dy - ehh >= limites.y0 && cy + dy + ehh <= limites.y1;
          };
        }
        var saiu = fugirDoHalo(obst, dirs, hw, hh, e1, e2, cabe);
        if (saiu) {
          cx += saiu.x; cy += saiu.y; desviou = saiu.dist;
          /* Desvio de mais de um corpo tira o rotulo de onde a geometria o
           * pediu, e ai a chamada e o que mantem a leitura de a quem ele
           * pertence. Abaixo disso o fio seria ruido: o rotulo continua colado
           * no lugar certo. */
          if (desviou > FUGA_COM_CHAMADA && op.chamada !== false) puxou = true;
        } else {
          /* Nao ha posicao livre no alcance. Entre apagar contorno com o halo
           * cheio e apagar menos com uma tarja estreita, a tarja perde menos, e o
           * aviso deixa o conferirFigura reprovar o tema em vez de a folha sair
           * com a figura mordida em silencio. */
          tarja = true;
          haloW = largura / 2;
          haloH = MEIA_TARJA * tam;
          avisar(doc, 'rotulo "' + txt + '": nao ha posicao livre para o halo, saiu em tarja estreita');
        }
      }
    }

    var precisaChamada = op.chamada === true || (puxou && op.chamada !== false);

    B.comEstado(doc, { cor: cor, preenchimento: COR.branco }, function () {
      if (precisaChamada) {
        /* O fio para na BORDA da caixa e nao no centro dela, senao ele passa por
         * baixo do halo e reaparece do outro lado do numero.
         *
         * Ele sai no nivel auxiliar e nao sobe: fio de chamada e andaime, e a
         * mesma ordem escrita na cota vale aqui (contorno 1,2 > o que carrega a
         * leitura 0,9 > chamada 0,6). O que ele nao pode e ser curto demais para
         * ler como fio, e isso quem resolve e o afastamento de quem chama. */
        var d = versor(pt(cx - anc.x, cy - anc.y));
        if (d) {
          var sup2 = suporteCaixa(d, e1, e2, hw, hh);
          var dist = Math.sqrt((cx - anc.x) * (cx - anc.x) + (cy - anc.y) * (cy - anc.y));
          var ate = Math.max(0, dist - sup2 - 0.5);
          if (ate > 2) {
            doc.op(n2(ESPESSURA.auxiliar) + ' w 1 J ' +
              n2(anc.x + d.x * 1.5) + ' ' + n2(anc.y + d.y * 1.5) + ' m ' +
              n2(anc.x + d.x * ate) + ' ' + n2(anc.y + d.y * ate) + ' l S');
          }
        }
      }
      if (op.halo !== false) desenharHalo(doc, COR, cx, cy, haloW, haloH, giro);
      if (giro) escreverGirado(doc, g, txt, cx, cy, tam, cor, !!op.bold, giro);
      else doc.texto(txt, cx, cy - CENTRO_OPTICO * tam, {
        tam: tam, bold: !!op.bold, cor: cor, align: 'centro'
      });
    });

    /* A caixa que vai para o registro e a ENVOLVENTE alinhada aos eixos, e nao a
     * caixa propria do texto: o conferirFigura testa sobreposicao por retangulo,
     * e com a caixa nao girada um rotulo deitado seria dado como livre enquanto
     * cruza a letra do vizinho. */
    var reg = {
      texto: txt, tam: tam, giro: giro, bold: !!op.bold,
      x: cx - ehw, y: cy - ehh, largura: 2 * ehw, altura: 2 * ehh,
      cx: cx, cy: cy, ancora: anc, chamada: precisaChamada,
      /* Quanto o halo teve que andar para nao comer a figura, e se sobrou tarja:
       * quem audita precisa distinguir um rotulo que ficou onde a geometria pediu
       * de um que so coube depois de fugir. */
      desviou: desviou, tarja: tarja,
      papel: op.papel || 'rotulo'
    };
    A.anota('rotulo', reg);
    return reg;
  }

  /* Halo branco por baixo, dimensionado por medir(). Sem ele o rotulo cruza a
   * hachura, a malha e o proprio lado do poligono, e o que sobra e um borrao que
   * nao se le em fotocopia. Girado, o halo tem que girar junto: um retangulo
   * alinhado aos eixos por baixo de um texto a 40 graus apaga um pedaco da
   * figura que ninguem pediu para apagar. */
  function desenharHalo(doc, COR, cx, cy, hw, hh, giro) {
    if (!giro) {
      doc.op(base().cor3(COR.branco) + ' rg ' +
        n2(cx - hw) + ' ' + n2(cy - hh) + ' ' + n2(2 * hw) + ' ' + n2(2 * hh) + ' re f');
      return;
    }
    var co = Math.cos(rad(giro)), se = Math.sin(rad(giro));
    var cantos = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]], s = '';
    for (var i = 0; i < 4; i++) {
      var x = cx + cantos[i][0] * co - cantos[i][1] * se;
      var y = cy + cantos[i][0] * se + cantos[i][1] * co;
      s += n2(x) + ' ' + n2(y) + (i === 0 ? ' m ' : ' l ');
    }
    doc.op(base().cor3(COR.branco) + ' rg ' + s + 'h f');
  }

  /* Texto girado sai por matriz Tm, e nao por cm: o cm escalaria a espessura de
   * tudo que viesse depois no mesmo bloco. A matriz e so rotacao, entao o corpo
   * do glifo nao muda. */
  function escreverGirado(doc, g, txt, cx, cy, tam, cor, bold, giro) {
    var co = Math.cos(rad(giro)), se = Math.sin(rad(giro));
    var largura = g.medir(txt, tam, bold);
    /* A origem do Tm e o inicio da LINHA DE BASE. O centro optico do trecho fica
     * em (largura/2, 0,35 do corpo) no sistema do texto, entao a origem e o
     * centro desejado menos essa distancia ja girada. */
    var ox = cx - (largura / 2 * co - CENTRO_OPTICO * tam * se);
    var oy = cy - (largura / 2 * se + CENTRO_OPTICO * tam * co);
    var wa = g.paraWinAnsi(txt);
    doc.op('BT ' + base().cor3(cor) + ' rg /' + (bold ? 'F2' : 'F1') + ' ' + tam + ' Tf ' +
      co.toFixed(6) + ' ' + se.toFixed(6) + ' ' + (-se).toFixed(6) + ' ' + co.toFixed(6) + ' ' +
      n2(ox) + ' ' + n2(oy) + ' Tm (' + escapar(wa) + ') Tj ET');
  }

  /* Normaliza o giro para o intervalo de menos 90 a mais 90 graus, para o texto
   * nunca sair de cabeca para baixo: um rotulo de lado a 200 graus e o mesmo
   * rotulo a 20. E abaixo de 20 graus nao gira: uma inclinacao pequena nao
   * acompanha o lado o suficiente para valer o custo de ler torto, e o texto
   * horizontal sempre le melhor. */
  function normalizarGiro(v) {
    var giro = Number(v) || 0;
    if (!giro) return 0;
    while (giro > 90) giro -= 180;
    while (giro <= -90) giro += 180;
    if (Math.abs(giro) < 20) return 0;
    return giro;
  }

  var reSimbolo = null;
  function temSimbolo(g, txt) {
    if (!g.SIMBOLOS) return false;
    if (!reSimbolo) {
      var chaves = [];
      for (var k in g.SIMBOLOS) if (Object.prototype.hasOwnProperty.call(g.SIMBOLOS, k)) chaves.push(k);
      reSimbolo = new RegExp('[' + chaves.join('') + ']');
    }
    return reSimbolo.test(txt);
  }

  /* Caixa que o rotulo VAI ocupar, sem desenhar nada. Quem monta uma figura
   * precisa disso antes de decidir onde cabe a cota e quanto vale o afastamento
   * do arco de angulo. */
  function caixaDoRotulo(texto, op) {
    op = op || {};
    var g = gerador();
    var tam = Number(op.tam) || TAM_PADRAO;
    var largura = g.medir(String(texto == null ? '' : texto), tam, !!op.bold);
    return { largura: largura + 2 * PAD_HALO, altura: 2 * MEIA_ALTURA * tam, tam: tam };
  }

  /* --------------------------------------------------- as tres posicoes do livro
   *
   * Vertice em maiuscula na bissetriz EXTERNA, lado em minuscula ou medida na
   * normal externa do ponto medio, angulo na bissetriz interna por fora do arco.
   * As tres existem como funcao para ninguem precisar montar o vetor na mao: e
   * na montagem do vetor que mora o erro, e ele se repete 880 vezes. */

  /* A direcao "do centroide para o vertice" so coincide com a bissetriz externa
   * no triangulo isosceles. Num triangulo bem obtuso ela empurra a letra na
   * direcao do vizinho, e as duas letras se encostam; a bissetriz externa e a
   * unica direcao que se afasta dos DOIS lados ao mesmo tempo. */
  function rotuloVertice(alvo, texto, pontos, i, op) {
    op = op || {};
    var geo = base().geo;
    var pts = normLista(pontos);
    var n = pts.length;
    if (n < 3) { avisar(alvoDe(alvo).doc, 'rotuloVertice pede pelo menos tres pontos'); return null; }
    var V = pts[i % n], A = pts[(i + 1) % n], B = pts[(i + n - 1) % n];
    var bi = geo.bissetriz(V, A, B);
    var dir = pt(-bi.x, -bi.y);
    var o = copiar(op);
    o.direcao = o.direcao || dir;
    if (o.afastamento == null) o.afastamento = AFAST_PADRAO;
    return rotulo(alvo, texto, V, o);
  }

  function rotularVertices(alvo, pontos, nomes, op) {
    var saida = [];
    for (var i = 0; i < (nomes || []).length; i++) {
      if (nomes[i] == null || nomes[i] === '') continue;
      saida.push(rotuloVertice(alvo, nomes[i], pontos, i, op));
    }
    return saida;
  }

  /* Normal externa de verdade ao lado, e nao a direcao do centro para o ponto
   * medio: as duas so coincidem no isosceles, e o desvio medido chega a quase 90
   * graus num triangulo de lados 100, 3 e 98, onde o rotulo saia empurrado
   * PARALELO ao lado em vez de para fora dele. */
  function rotuloLado(alvo, texto, A, B, op) {
    op = op || {};
    var geo = base().geo;
    var P = norm(A), Q = norm(B);
    var M = op.em != null ? geo.pontoNoSegmento(P, Q, op.em) : geo.pontoNoSegmento(P, Q, 0.5);
    var u = versor(pt(Q.x - P.x, Q.y - P.y));
    if (!u) { avisar(alvoDe(alvo).doc, 'rotuloLado com os dois extremos no mesmo ponto'); return null; }
    var nrm = perp(u);
    var dentro = op.centro ? norm(op.centro) : (op.pontos ? geo.centroide(op.pontos) : null);
    if (dentro) {
      var fx = M.x - dentro.x, fy = M.y - dentro.y;
      if (nrm.x * fx + nrm.y * fy < 0) nrm = pt(-nrm.x, -nrm.y);
      if (Math.abs(nrm.x * fx + nrm.y * fy) < 0.05 * Math.sqrt(fx * fx + fy * fy)) {
        /* O centro caiu praticamente EM CIMA do lado, entao nao ha lado de fora
         * que se possa deduzir. Acontece de verdade no triangulo quase
         * degenerado, e ali quem chama tem que dizer o lado. */
        avisar(alvoDe(alvo).doc, 'rotuloLado: o centro esta sobre o lado, o lado de fora foi chutado');
      }
    } else if (op.lado) {
      if (Number(op.lado) < 0) nrm = pt(-nrm.x, -nrm.y);
    }
    var o = copiar(op);
    o.direcao = o.direcao || nrm;
    if (o.afastamento == null) o.afastamento = AFAST_PADRAO;
    /* Rotulo de lado acompanhando a inclinacao e o que o livro faz com medida
     * longa em lado obliquo, e so vale a pena acima de 20 graus: abaixo disso o
     * normalizarGiro devolve zero sozinho. */
    if (o.giro === 'lado') o.giro = Math.atan2(u.y, u.x) * 180 / Math.PI;
    return rotulo(alvo, texto, M, o);
  }

  /* O valor do angulo na bissetriz, e o raio nunca fixo. Num vertice agudo o
   * rotulo com afastamento fixo encosta nos dois lados: a 5 graus de abertura,
   * uma caixa de 12 pt de largura so caberia dentro da cunha a 140 pt do
   * vertice, que e mais longe do que o triangulo inteiro. Por isso a conta e
   * geometrica (a meia largura da caixa projetada na normal da bissetriz dividida
   * pelo seno da metade da abertura) e, quando ela nao cabe no alcance do
   * vertice, o valor sai para FORA da figura ligado por fio de chamada, que e a
   * regra escrita para abaixo de 15 graus. */
  function rotuloAngulo(alvo, texto, V, A, B, op) {
    op = op || {};
    var geo = base().geo;
    var Vp = norm(V), Ap = norm(A), Bp = norm(B);
    var bis = geo.bissetriz(Vp, Ap, Bp);
    var abertura = geo.anguloEm(Vp, Ap, Bp);
    var perto = Math.min(geo.distancia(Vp, Ap), geo.distancia(Vp, Bp));

    var tam = Number(op.tam) || TAM_PADRAO;
    var cx = caixaDoRotulo(texto, { tam: tam, bold: op.bold });
    var hw = cx.largura / 2, hh = cx.altura / 2;
    /* Meia largura da caixa medida na direcao NORMAL a bissetriz: e essa que
     * disputa espaco com os dois lados da cunha. */
    var nb = perp(bis);
    var meia = Math.abs(nb.x) * hw + Math.abs(nb.y) * hh + 1.4;
    var sen = Math.max(0.04, Math.sin(rad(abertura) / 2));
    var precisa = meia / sen;

    /* Piso: o rotulo tem que ficar por FORA do arco de angulo, senao o arco corta
     * o numero. Quem ja desenhou o arco passa o raio dele; quem nao passou usa o
     * piso de 12 pt que a marcaAngulo tambem usa. */
    var raioArco = op.raioArco != null ? Number(op.raioArco) : 12;
    var piso = raioArco + Math.abs(bis.x) * hw + Math.abs(bis.y) * hh + 2;
    var teto = 0.62 * perto;

    var o = copiar(op);
    o.tam = tam;
    var reg, apertado = precisa > teto;

    if (apertado) {
      /* Nao existe distancia dentro da figura em que a caixa caiba na cunha, e o
       * valor tem que sair. Empurra-lo mais longe SOBRE a bissetriz nao resolve:
       * medido na prova impressa, num vertice de 5 graus o fio de chamada saia
       * correndo por dentro da propria fatia, entre os dois lados, e o desenho
       * ficava com uma terceira linha no meio que a aluna le como parte da
       * figura. A saida e sair de LADO: a ancora passa a ser o ponto do arco (que
       * e o que o fio precisa apontar, e nao o vertice) e a direcao e a normal a
       * bissetriz, que atravessa um dos lados e chega ao branco em poucos pontos.
       * A meia largura da cunha no raio do arco e r vezes o seno de metade da
       * abertura, ou seja meio ponto em 5 graus: qualquer afastamento lateral ja
       * poe o numero fora. */
      /* A ancora fica SOBRE o arco e nao 2 pt depois dele. Medido no cartao do
       * angulo de 5 graus da _prova_desenho.pdf: com a ancora 2 pt para fora e o
       * fio comecando 1,5 pt depois dela, sobravam 3,5 pt de papel branco entre
       * o arco e o inicio do fio, e num vertice de 4,5 graus o arco ja e um
       * risco de 1,13 pt escondido entre os dois lados de 1,2 pt. O fio saia
       * apontando para nada. */
      var ancora = pt(Vp.x + bis.x * raioArco, Vp.y + bis.y * raioArco);
      var lateral = perp(bis);
      if (op.lado != null) { if (Number(op.lado) < 0) lateral = pt(-lateral.x, -lateral.y); }
      else if (lateral.y < 0) lateral = pt(-lateral.x, -lateral.y);   // por cima, que e onde se espera anotacao
      o.direcao = lateral;
      /* O afastamento aqui e o que decide o COMPRIMENTO do fio, e nao so onde o
       * numero cai: o fio vai de 1,5 pt depois da ancora ate 0,5 pt antes da
       * borda da caixa, ou seja ele mede o afastamento menos 2. Com o 8 fixo de
       * antes sobrava um fio de 6,00 pt em 0,60 pt de espessura, o traco mais
       * curto e mais fino do cartao: na folha ele le como um tracinho da figura
       * e nao como chamada, e na segunda fotocopia e o primeiro a sumir. Um
       * corpo de texto e o minimo para um fio ler como fio, entao o afastamento
       * sai do tamanho do proprio rotulo e nao de um numero fixo. */
      o.afastamento = op.afastamento != null ? Number(op.afastamento) : (tam + 2);
      o.chamada = true;
      reg = rotulo(alvo, texto, ancora, o);
    } else {
      /* Aqui o afastamento e contado ate o CENTRO da caixa, porque a conta acima
       * ja e sobre o centro: o que precisa caber na cunha e a caixa inteira, e
       * nao o vao antes dela. A chamada nao e desligada, so nao e ligada: quando
       * o rotulo cabe na cunha mas sai do bloco da figura, quem decide e o
       * recorte de limites dentro do rotulo(). */
      var afast = Math.max(piso, precisa);
      var sup = Math.abs(bis.x) * hw + Math.abs(bis.y) * hh;
      o.direcao = bis;
      o.afastamento = Math.max(0, afast - sup);
      reg = rotulo(alvo, texto, Vp, o);
    }
    if (reg) { reg.abertura = abertura; reg.apertado = apertado; }
    return reg;
  }

  /* De onde ate onde o arco do angulo AVB tem que ir, pelo lado do angulo MENOR
   * que 180 graus. Existe aqui, e nao dentro de quem desenha a marca, porque e
   * geometria de arco e porque o arco sair do lado errado e o erro mais
   * silencioso da lista inteira: a figura fica bonita e diz outra coisa. O sinal
   * do varre e o sentido de percurso, que e o que o arco() espera. */
  function varreDoAngulo(V, A, Bp) {
    var v = norm(V), a = norm(A), b = norm(Bp);
    var a0 = Math.atan2(a.y - v.y, a.x - v.x) * 180 / Math.PI;
    var a1 = Math.atan2(b.y - v.y, b.x - v.x) * 180 / Math.PI;
    var d = a1 - a0;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return { de: a0, ate: a0 + d, varre: d };
  }

  function copiar(o) {
    var saida = {};
    for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) saida[k] = o[k];
    return saida;
  }

  /* ============================================================ ponto
   *
   *   ponto(doc, P, {rotulo, direcao, aberto, guias, raio, cor, espessura, tam})
   *
   * A bolinha vazada e a unica notacao disponivel para extremo que nao entra no
   * intervalo, para buraco de descontinuidade removivel e para valor que a funcao
   * nao assume, e por isso ela e opcao explicita e nao detalhe de estilo.
   *
   * O raio e 2,2 pt, e o numero vem do vazado: o anel e desenhado em 0,9 pt, o
   * nivel de marca, entao com raio 1,1 sobraria um furo de 1,3 pt de diametro,
   * mais estreito do que o proprio traco, e a bolinha vazada seria indistinguivel
   * da cheia justamente na fotocopia, que e onde a distincao precisa sobreviver.
   *
   * A cheia sai pelo doc.circulo, que e o unico uso em que ele esta certo: com
   * preenche verdadeiro ele nao tem a espessura cravada em 1.6. O anel da vazada
   * nao pode sair dele por causa dessa trava, e sai pelo arco(). */
  function ponto(alvo, P, op) {
    op = op || {};
    var A = alvoDe(alvo), doc = A.doc;
    var B = base(), g = gerador(), COR = g.COR;
    var p = norm(P);
    var raio = op.raio != null ? Number(op.raio) : 2.2;
    var cor = op.cor || COR.texto;
    var espessura = op.espessura != null ? Number(op.espessura) : ESPESSURA.marca;
    conferirCor(doc, cor, 'ponto');

    if (op.guias) {
      /* Guias de leitura ate os eixos. O destino chega de fora porque quem sabe
       * onde estao os eixos e o plano, e nao o ponto.
       *
       * Elas saiam em COR.muted e no tracejado 'guia' ([1 2]), isto e pontos de
       * 0,35 mm com vaos de 0,7 mm numa linha de 0,21 mm em cinza medio. Medido
       * na folha, e o elemento com maior chance de sumir por completo na
       * fotocopia, e a guia nao e enfeite: e ela que diz que a abscissa do ponto
       * e aquela e nao a do lado. Guia que carrega leitura vai em [2 2], que
       * imprime o dobro de tinta pelo mesmo comprimento, na tinta do contorno e
       * nos mesmos 0,6 pt, ou seja continua embaixo do contorno na hierarquia
       * por ESPESSURA, sem depender de cor.
       *
       * O padrao vai cru e nao pelo nome 'oculta': [2 2] no dicionario do
       * base.js e a aresta escondida de solido, e guia de plano nunca divide
       * figura com aresta de solido. Chamar pelo nome faria parecer que a guia
       * afirma "esta atras", que ela nao afirma.
       *
       * Quem quiser guia decorativa, que possa sumir sem prejuizo, passa
       * guiasApoio: ai ela volta para [1 2] em muted e o halo do rotulo pode
       * come-la. */
      var alvoG = norm(op.guias);
      var apoio = op.guiasApoio === true;
      var corG = apoio ? COR.muted : COR.texto;
      var padraoG = apoio ? 'guia' : GUIA_LEITURA;
      B.comEstado(doc, { tracejado: padraoG, cor: corG, espessura: ESPESSURA.auxiliar }, function () {
        doc.op(n2(ESPESSURA.auxiliar) + ' w ' +
          n2(p.x) + ' ' + n2(p.y) + ' m ' + n2(alvoG.x) + ' ' + n2(p.y) + ' l S ' +
          n2(p.x) + ' ' + n2(p.y) + ' m ' + n2(p.x) + ' ' + n2(alvoG.y) + ' l S');
      });
      A.anota('traco', { x1: p.x, y1: p.y, x2: alvoG.x, y2: p.y,
        espessura: ESPESSURA.auxiliar, papel: 'guia', carrega: !apoio });
      A.anota('traco', { x1: p.x, y1: p.y, x2: p.x, y2: alvoG.y,
        espessura: ESPESSURA.auxiliar, papel: 'guia', carrega: !apoio });
    }

    if (op.aberto) {
      /* Miolo branco primeiro e anel depois: invertido, o preenchimento apaga o
       * anel e a bolinha vazada vira um borrao branco. E a mesma ordem que o
       * figura() impoe em escala de figura. */
      B.comEstado(doc, { preenchimento: COR.branco }, function () {
        doc.circulo(p.x, p.y, raio, COR.branco, true);
      });
      /* O anel vai pelo doc e nao pelo ctx de proposito: quem entra no registro e
       * o ponto, uma vez so. Anotado tambem como arco, a mesma bolinha contaria
       * duas vezes e deslocaria o teto de cinco marcas. */
      arco(doc, p, raio, raio, 0, 360, { cor: cor, espessura: espessura, papel: 'ponto' });
    } else {
      B.comEstado(doc, { preenchimento: cor }, function () {
        doc.circulo(p.x, p.y, raio, cor, true);
      });
    }

    var reg = {
      tipo: 'ponto', x: p.x, y: p.y, raio: raio, aberto: !!op.aberto,
      papel: op.papel || 'ponto'
    };
    A.anota('ponto', reg);

    if (op.rotulo != null && op.rotulo !== '') {
      /* A letra encosta no ponto, e nunca em legenda separada: par de
       * coordenadas em legenda obriga a aluna a casar duas listas. O afastamento
       * conta a partir da borda da bolinha, senao a letra encosta nela. */
      var dir = op.direcao ? versor(op.direcao) : pt(0.7071, 0.7071);
      reg.rotulo = rotulo(alvo, op.rotulo, pt(p.x + dir.x * raio, p.y + dir.y * raio), {
        direcao: dir, afastamento: op.afastamento != null ? Number(op.afastamento) : 2.5,
        tam: op.tam || TAM_PADRAO, cor: op.corRotulo || COR.texto, bold: op.bold
      });
    }
    return reg;
  }

  /* ============================================================ seta
   *
   *   seta(doc, P, Q, {tam, cor, espessura, dupla, preenchida, tracejado, papel})
   *
   * Nao existe nada parecido no pdf.js hoje, e ela e a diferenca entre desenhar
   * um eixo e desenhar um segmento: a seta diz PARA ONDE cresce. Seta nos dois
   * sentidos do mesmo eixo e o erro classico, e por isso a ponta dupla e opcao
   * explicita, para reta indefinida e para cota, e nunca o padrao.
   *
   * A haste para na base da cabeca quando a cabeca e preenchida. Levada ate a
   * ponta, a extremidade redonda da haste (1 J) ultrapassa o bico do triangulo e
   * a seta sai com o nariz arredondado, que aparece em 1,2 pt. */
  function seta(alvo, P, Q, op) {
    op = op || {};
    var A = alvoDe(alvo), doc = A.doc;
    var B = base(), g = gerador(), COR = g.COR;
    var p = norm(P), q = norm(Q);
    var u = versor(pt(q.x - p.x, q.y - p.y));
    if (!u) { avisar(doc, 'seta com origem e destino no mesmo ponto, nao desenha'); return null; }
    var nrm = perp(u);

    var tam = op.tam != null ? Number(op.tam) : CABECA;
    var cor = op.cor || COR.texto;
    var espessura = op.espessura != null ? Number(op.espessura) : ESPESSURA.marca;
    var tracejado = op.tracejado || null;
    var papel = op.papel || 'traco';
    var preenchida = op.preenchida !== false;
    var dupla = !!op.dupla;
    /* A seta entra na hierarquia pela haste: a cabeca ja sai sem tracejado
     * sempre, e ela usa a mesma cor e a mesma espessura da haste. */
    var tinta = tintaDePapel(A, op, papel, cor, espessura, tracejado);
    cor = tinta.cor; espessura = tinta.espessura; tracejado = tinta.tracejado;
    conferirCor(doc, cor, 'seta');
    conferirEspessura(doc, espessura, 'seta', op.abaixoDoPiso);

    /* Cabeca maior do que o proprio segmento vira um losango sem haste. O caso
     * aparece de verdade em salto curto de reta numerica e em cota apertada. */
    var comprimento = Math.sqrt((q.x - p.x) * (q.x - p.x) + (q.y - p.y) * (q.y - p.y));
    if (tam > comprimento * (dupla ? 0.45 : 0.9)) {
      tam = Math.max(2.5, comprimento * (dupla ? 0.45 : 0.9));
    }
    var meia = tam * CABECA_MEIA;

    var recuo = preenchida ? tam * 0.92 : 0;
    var iniH = pt(p.x + u.x * (dupla ? recuo : 0), p.y + u.y * (dupla ? recuo : 0));
    var fimH = pt(q.x - u.x * recuo, q.y - u.y * recuo);

    B.comEstado(doc, {
      tracejado: tracejado, cor: cor, preenchimento: cor, espessura: espessura
    }, function () {
      doc.op('1 J 1 j ' + n2(iniH.x) + ' ' + n2(iniH.y) + ' m ' + n2(fimH.x) + ' ' + n2(fimH.y) + ' l S');
      /* A cabeca sai SEM tracejado, sempre: um triangulo preenchido nao tem
       * padrao de traco, mas a borda do B teria, e uma ponta de seta com o
       * contorno picotado nao se le. */
      doc.op('[] 0 d');
      doc.op(cabeca(q, u, nrm, tam, meia, preenchida, espessura));
      if (dupla) doc.op(cabeca(p, pt(-u.x, -u.y), nrm, tam, meia, preenchida, espessura));
    });

    var reg = {
      tipo: 'seta', x1: p.x, y1: p.y, x2: q.x, y2: q.y,
      espessura: espessura, dupla: dupla, papel: papel
    };
    A.anota(reg.papel === 'marca' ? 'marca' : 'traco', reg);
    return reg;
  }

  function cabeca(ponta, u, nrm, tam, meia, preenchida, espessura) {
    var bx = ponta.x - u.x * tam, by = ponta.y - u.y * tam;
    var a = pt(bx + nrm.x * meia, by + nrm.y * meia);
    var b = pt(bx - nrm.x * meia, by - nrm.y * meia);
    if (preenchida) {
      return n2(ponta.x) + ' ' + n2(ponta.y) + ' m ' + n2(a.x) + ' ' + n2(a.y) + ' l ' +
        n2(b.x) + ' ' + n2(b.y) + ' l h f';
    }
    /* Cabeca aberta e o V do desenho a mao, e serve para vetor sobre eixo ja
     * carregado de marcas: ela nao tapa o que esta atras. Sai com S e nao com f,
     * entao ela herda a espessura ja ligada pelo comEstado. */
    return n2(a.x) + ' ' + n2(a.y) + ' m ' + n2(ponta.x) + ' ' + n2(ponta.y) + ' l ' +
      n2(b.x) + ' ' + n2(b.y) + ' l S';
  }

  /* ============================================================ cota
   *
   *   cota(doc, P, Q, texto, {afastamento, estilo, cor, lado, fora, tam,
   *                           raioChave, espessura, desde})
   *
   * Mede um vao POR FORA da figura: linha paralela ao segmento, afastada, com
   * duas linhas de chamada finas nos extremos e o texto no meio. Existe porque
   * medida que nao se refere a um lado desenhado nao pode ser escrita sobre o
   * traco, e porque quando o lado ja carrega outra marca (um tracinho de
   * congruencia, uma seta de paralelismo) a medida tem que sair para fora em vez
   * de empilhar sobre a aresta.
   *
   * O texto e SEMPRE horizontal, inclusive em cota obliqua, e fica sobre a linha
   * com halo. Ele nao vai "acima da linha" porque acima nao quer dizer nada numa
   * cota inclinada: deslocar pela normal joga o texto para dentro da figura de um
   * lado e para fora do bloco do outro. O halo apaga o trecho de linha por baixo,
   * que e a propria convencao de desenho tecnico de interromper a linha de cota.
   *
   * O estilo 'chave' e o agrupamento de partes que os anos iniciais usam, e o
   * 'seta' e a cota de desenho tecnico. Sao a mesma primitiva porque fazem o
   * mesmo trabalho: dizer que um vao inteiro vale tal coisa.
   *
   * ------------------------------------------------ a ordem dos tres pesos
   *
   * A cota tem tres pecas com tres papeis diferentes e elas NAO podem sair no
   * mesmo peso. Medido no fluxo de conteudo do piloto, na figura do "existe
   * triangulo com lados 4, 7 e 12" (material p3 e ingles p3), onde a cota mede o
   * vao de 1,000 unidade que E a resposta da questao:
   *
   *   as tres varetas, que sao so contexto   1,20 pt  #1A1C1F  17,08:1
   *   os tracinhos de extremidade            0,90 pt  #1A1C1F  17,08:1
   *   a linha de cota, que e a resposta      0,60 pt  #1A1C1F  17,08:1
   *
   * Ou seja: o traco que carregava a resposta saia com METADE da espessura do
   * traco que so dava contexto, e empatado com o piso da folha. A regra do
   * projeto e a mesma que ja esta escrita na secao da hierarquia de tinta: o
   * elemento que carrega a pergunta ou a resposta nunca e o mais fraco da
   * figura. Havia ainda uma incoerencia interna, e ela e a prova de que o 0,6
   * nao era decisao e sim descuido: a MESMA primitiva ja emitia a chave do
   * estilo 'chave' em 0,9 pt e a linha do estilo 'seta' em 0,6 pt, e as duas
   * dizem exatamente a mesma coisa.
   *
   * O conserto NAO e igualar tudo a 0,9. Linha de chamada em desenho tecnico e
   * deliberadamente mais leve do que o contorno justamente para nao competir com
   * ele: igualada a linha de cota, ela some como chamada e a cota deixa de se
   * destacar do proprio andaime. O que a folha precisa e de ORDEM, e ela sai dos
   * niveis que o ESPESSURA ja tem, sem inventar nivel novo:
   *
   *   contorno da figura   1,20 pt   o que a figura E
   *   linha de cota        0,90 pt   o que a figura RESPONDE   (era 0,60)
   *   linha de chamada     0,60 pt   o andaime que amarra as duas
   *
   * Sao 2 para 1,5 para 1. Entre o mais largo e o mais estreito da exatamente o
   * dobro que a NBR 8403 pede, e a chamada fica no piso de 0,6 pt e nao abaixo
   * dele, continua e na tinta do contorno: 17,08:1, quase seis vezes o minimo de
   * 3:1. Tracejado ela nunca sai, e este e o ponto que a fotocopia decide: um
   * [1 2] deposita um terco da tinta pelo mesmo comprimento, e na segunda
   * geracao de copia some antes de qualquer outra coisa da figura. Quem quiser
   * uma cota mais pesada passa espessura; mais leve do que 0,9 nao existe, pelo
   * mesmo Math.max que a regra OBJETO da hierarquia de tinta ja usa.
   *
   * O op.desde e a outra metade do mesmo defeito. A cota mede um vao que quase
   * sempre se refere a uma aresta que esta LONGE dela (na figura do 4, 7 e 12 o
   * vao esta na regua de cima e a resposta so quer dizer alguma coisa contra a
   * base de 12, 60 pt abaixo). Quem desenha essa amarracao por fora, como guia
   * solta, desenha a peca mais importante da figura no elemento mais fraco dela.
   * Com op.desde a amarracao passa a ser o que ela e no desenho tecnico, a
   * propria linha de chamada da cota: nasce na aresta de referencia, passa pelo
   * ponto medido e vai ate depois da linha de cota, num traco so, em 0,6 pt
   * continuo na tinta do contorno. */
  function cota(alvo, P, Q, texto, op) {
    op = op || {};
    var A = alvoDe(alvo), doc = A.doc;
    var B = base(), g = gerador(), COR = g.COR;
    var p = norm(P), q = norm(Q);
    var u = versor(pt(q.x - p.x, q.y - p.y));
    if (!u) { avisar(doc, 'cota com os dois extremos no mesmo ponto, nao desenha'); return null; }
    var comprimento = Math.sqrt((q.x - p.x) * (q.x - p.x) + (q.y - p.y) * (q.y - p.y));
    var nrm = perp(u);

    /* De que lado a cota sai. Com 'fora' quem chama diz um ponto de DENTRO da
     * figura e a cota vai para o lado contrario, que e o jeito que nao depende de
     * a figura estar girada. O lado numerico continua aceito para quem ja sabe. */
    if (op.fora) {
      var d = norm(op.fora);
      var mx = (p.x + q.x) / 2 - d.x, my = (p.y + q.y) / 2 - d.y;
      if (nrm.x * mx + nrm.y * my < 0) nrm = pt(-nrm.x, -nrm.y);
    } else if (op.lado != null && Number(op.lado) < 0) {
      nrm = pt(-nrm.x, -nrm.y);
    }

    var afast = op.afastamento != null ? Number(op.afastamento) : 14;
    var cor = op.cor || COR.texto;
    var estilo = op.estilo === 'chave' ? 'chave' : 'seta';
    var tam = Number(op.tam) || TAM_PADRAO;
    conferirCor(doc, cor, 'cota');

    /* Os dois pesos da cota, decididos num lugar so e antes de qualquer traco
     * sair, para a chave e a seta nao divergirem de novo. O Math.max e o mesmo
     * da regra OBJETO da hierarquia de tinta: quem carrega a resposta pode subir,
     * nunca descer. A chamada fica um nivel abaixo e no piso. */
    var espCota = op.espessura != null
      ? Math.max(ESPESSURA.marca, Number(op.espessura)) : ESPESSURA.marca;
    var espChamada = ESPESSURA.auxiliar;

    var a0 = pt(p.x + nrm.x * afast, p.y + nrm.y * afast);
    var a1 = pt(q.x + nrm.x * afast, q.y + nrm.y * afast);

    /* De onde a linha de chamada PARTE. Sem op.desde ela parte do proprio ponto
     * medido, com uma folga, que e a cota comum. Com op.desde ela parte da
     * aresta de referencia que quem chama declarou e passa POR DENTRO do ponto
     * medido: o recuo e a projecao da referencia na normal da cota, entao ele
     * vale para cota deitada, em pe ou obliqua sem nenhum caso particular. Os
     * dois extremos usam o mesmo recuo, o mais fundo, senao as duas chamadas
     * comecariam em alturas diferentes e a amarracao ficaria torta. */
    var folga = 2, sobra = 2.5, recuo = 0;
    if (op.desde) {
      var R = norm(op.desde);
      recuo = Math.min((R.x - p.x) * nrm.x + (R.y - p.y) * nrm.y,
                       (R.x - q.x) * nrm.x + (R.y - q.y) * nrm.y);
      if (recuo > 0) {
        /* A referencia caiu do lado da linha de cota: a chamada nasceria depois
         * do que ela deveria amarrar. E erro de quem chamou, e desenhar do jeito
         * pedido faria a figura afirmar uma amarracao que nao existe. */
        avisar(doc, 'cota: o desde= esta do mesmo lado da linha de cota, a chamada nao recua');
        recuo = 0;
      }
    }
    B.comEstado(doc, { cor: cor, espessura: espChamada }, function () {
      doc.op('1 J ' + n2(espChamada) + ' w ' +
        chamadaDeCota(p, nrm, recuo + folga, afast + sobra) + ' ' +
        chamadaDeCota(q, nrm, recuo + folga, afast + sobra) + ' S');
    });

    var meio, tipRot;
    if (estilo === 'chave') {
      var r = Math.min(op.raioChave != null ? Number(op.raioChave) : 3.4, comprimento / 4);
      B.comEstado(doc, { cor: cor, espessura: espCota }, function () {
        doc.op('1 J 1 j ' + caminhoChave(p, u, nrm, comprimento, afast, r) + ' S');
      });
      meio = pt(p.x + u.x * comprimento / 2 + nrm.x * (afast + 2 * r),
                p.y + u.y * comprimento / 2 + nrm.y * (afast + 2 * r));
      tipRot = { direcao: nrm, afastamento: 2 };
    } else {
      /* Vao curto demais para caber as duas cabecas mais o numero: as pontas
       * viram para fora e apontam para dentro, que e a saida do desenho tecnico
       * e a unica que nao sobrepoe as duas cabecas uma na outra. */
      var precisa = g.medir(String(texto == null ? '' : texto), tam, false) + 2 * CABECA + 6;
      /* As setas vao pelo doc e nao pelo ctx pelo mesmo motivo do anel do ponto:
       * a cota inteira ja entrou no registro como um traco so, e o que a aluna le
       * nela e o numero. */
      if (comprimento >= precisa || !String(texto == null ? '' : texto).trim()) {
        seta(doc, a0, a1, { cor: cor, espessura: espCota, dupla: true, tam: CABECA, papel: 'traco' });
      } else {
        var f = CABECA + 3;
        var e0 = pt(a0.x - u.x * f, a0.y - u.y * f), e1 = pt(a1.x + u.x * f, a1.y + u.y * f);
        B.comEstado(doc, { cor: cor, espessura: espCota }, function () {
          doc.op('1 J ' + n2(espCota) + ' w ' +
            n2(e0.x) + ' ' + n2(e0.y) + ' m ' + n2(e1.x) + ' ' + n2(e1.y) + ' l S');
        });
        seta(doc, e0, a0, { cor: cor, espessura: espCota, tam: CABECA, papel: 'traco' });
        seta(doc, e1, a1, { cor: cor, espessura: espCota, tam: CABECA, papel: 'traco' });
      }
      meio = pt((a0.x + a1.x) / 2, (a0.y + a1.y) / 2);
      tipRot = { direcao: null, afastamento: 0 };
    }

    var reg = {
      tipo: 'cota', x1: p.x, y1: p.y, x2: q.x, y2: q.y,
      afastamento: afast, estilo: estilo, papel: 'traco'
    };
    A.anota('traco', reg);

    if (texto != null && String(texto).trim()) {
      /* A cota conta UMA marca ativa, e ela e o numero. As linhas e as pontas
       * sao contorno de medida, nao dado a ler. */
      reg.rotulo = rotulo(alvo, texto, meio, {
        direcao: tipRot.direcao, afastamento: tipRot.afastamento,
        tam: tam, cor: op.corTexto || COR.texto, bold: op.bold, halo: true,
        /* A propria cota fica de fora do teste do halo: interromper a linha de
         * cota por baixo do numero E a convencao do desenho tecnico, e nao um
         * defeito. O que o numero nao pode e comer o contorno da figura, e por
         * isso so este vao sai da lista. Quando ele precisa se mexer, desliza AO
         * LONGO da linha de cota, que e onde ele continua sendo a medida daquele
         * vao: foi o que resolveu o "R" da coroa circular, que apagava um pedaco
         * da circunferencia interna. */
        fuga: u, exceto: [reg]
      });
    }
    return reg;
  }

  /* O 'de' e medido na normal a partir do ponto cotado e pode ser NEGATIVO: e
   * assim que o op.desde faz a chamada nascer na aresta de referencia, do outro
   * lado do ponto medido, e passar por ele num traco so. */
  function chamadaDeCota(P, nrm, de, ate) {
    return n2(P.x + nrm.x * de) + ' ' + n2(P.y + nrm.y * de) + ' m ' +
      n2(P.x + nrm.x * ate) + ' ' + n2(P.y + nrm.y * ate) + ' l';
  }

  /* A chave de verdade, com os quatro quartos de circunferencia: as duas pontas
   * curvam para um lado e o bico do meio para o outro, que e o que a distingue de
   * um colchete. As coordenadas sao montadas no sistema (ao longo, para fora) do
   * proprio vao e so entao levadas para a pagina, o que faz a chave acompanhar
   * qualquer inclinacao sem nenhum caso particular. */
  function caminhoChave(P, u, nrm, L, s, r) {
    var k = 0.5523 * r;
    function m(a, o) {
      return { x: P.x + u.x * a + nrm.x * o, y: P.y + u.y * a + nrm.y * o };
    }
    function cv(c1, c2, p3) {
      return n2(c1.x) + ' ' + n2(c1.y) + ' ' + n2(c2.x) + ' ' + n2(c2.y) + ' ' +
        n2(p3.x) + ' ' + n2(p3.y) + ' c ';
    }
    var meio = L / 2;
    var ini = m(0, s);
    var caminho = n2(ini.x) + ' ' + n2(ini.y) + ' m ';
    caminho += cv(m(k, s), m(r, s + r - k), m(r, s + r));                    // ponta esquerda
    var reta1 = m(meio - r, s + r);
    caminho += n2(reta1.x) + ' ' + n2(reta1.y) + ' l ';
    caminho += cv(m(meio - r, s + r + k), m(meio - k, s + 2 * r), m(meio, s + 2 * r));  // sobe ao bico
    caminho += cv(m(meio + k, s + 2 * r), m(meio + r, s + r + k), m(meio + r, s + r));  // desce do bico
    var reta2 = m(L - r, s + r);
    caminho += n2(reta2.x) + ' ' + n2(reta2.y) + ' l ';
    caminho += cv(m(L - r, s + r - k), m(L - k, s), m(L, s));                // ponta direita
    return caminho;
  }

  /* A mesma decisao de tinta, oferecida a quem desenha por fora deste arquivo. E
   * o caso da diagonal e da ceviana do marcas.js, que emitem o proprio caminho e
   * nao passam pelo poligono daqui: em vez de a regra ser copiada e envelhecer
   * em dois lugares, ela e perguntada. Recebe o ctx (ou o doc) e o mesmo objeto
   * de opcoes das primitivas; devolve cor, espessura e tracejado ja decididos,
   * mais o motivo, que e nulo quando nada mudou. */
  function tintaDe(alvo, op) {
    op = op || {};
    var A = alvoDe(alvo), COR = gerador().COR;
    var papel = op.papel || 'contorno';
    var cor = op.cor || COR.texto;
    var espessura = op.espessura != null ? Number(op.espessura) : ESPESSURA.contorno;
    var t = tintaDePapel(A, op, papel, cor, espessura, op.tracejado || null);
    return { cor: t.cor, espessura: t.espessura, tracejado: t.tracejado, motivo: t.motivo };
  }

  return {
    poligono: poligono,
    arco: arco, arcoPontos: arcoPontos, trechosDeArco: trechosDeArco,
    varreDoAngulo: varreDoAngulo,
    rotulo: rotulo, caixaDoRotulo: caixaDoRotulo,
    rotuloVertice: rotuloVertice, rotularVertices: rotularVertices,
    rotuloLado: rotuloLado, rotuloAngulo: rotuloAngulo,
    ponto: ponto, seta: seta, cota: cota,
    versor: versor, perp: perp, contraste: contraste,
    tintaDe: tintaDe, PAPEL_OBJETO: PAPEL_OBJETO, GUIA_LEITURA: GUIA_LEITURA,
    ESPESSURA: ESPESSURA, PISO_ESPESSURA: PISO_ESPESSURA, PISO_CORPO: PISO_CORPO,
    TAM_PADRAO: TAM_PADRAO, CINZA_AREA: CINZA_AREA, CABECA: CABECA
  };
});
