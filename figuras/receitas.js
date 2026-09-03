/* figuras/receitas.js
 * As receitas que a marcacao @fig chama.
 *
 * Tres receitas, e o criterio de quantas ser tres: cada uma cobre uma FAMILIA de
 * configuracoes do banco, nunca uma figura so.
 *
 *   triangulo     tres lados, tres angulos, lado prolongado com angulo externo,
 *                 marcas de congruencia, cevianas com ponto de encontro e o
 *                 triangulo que NAO existe (o null da desigualdade triangular
 *                 desenhado como duas reguas que nao se alcancam).
 *   quadrilatero  a familia inteira por paralelismo: trapezio, trapezio
 *                 isosceles, paralelogramo, retangulo, losango, quadrado e o
 *                 irregular, com a diagonal que decompoe em dois triangulos.
 *   painel        varias figurinhas lado a lado com o nome de cada uma embaixo.
 *                 E a figura de CLASSIFICAR, que e o que uma tabela de nomes
 *                 nunca entrega: os tres triangulos por lados, os tres por
 *                 angulos e os cinco quadrilateros da familia.
 *
 * Mais as receitas de curva, escritas em cima das primitivas circunferencia,
 * elipse, parabola, hiperbole, eixos, poligonoRegular e cotaRadial do
 * desenho.js (secao "receitas de curva", mais abaixo):
 *
 *   circulo          raio, diametro e corda cotados, setor e arco com o angulo
 *                    central, coroa, quadrado inscrito e circunscrito, pizza em
 *                    fatias e o alvo de aneis concentricos (MAT08-13, MATEM3-12).
 *   conica           elipse, hiperbole e parabola com focos, vertices, diretriz,
 *                    assintotas, retangulo fundamental, um ponto sobre a curva
 *                    com os raios focais e o plano cartesiano atras (MATEM3-04).
 *   poligonoregular  o poligono de n lados com lado, raio e apotema cotados e a
 *                    decomposicao em n triangulos pelo centro (MATEM3-12).
 *   pidesenrolado    a circunferencia de diametro d desenrolada num segmento com
 *                    tres copias de d e a sobra cotada: o pi como "3 e um pouco".
 *   pista            o retangulo com um semicirculo em cada lado menor.
 *   rodando          a roda em tres posicoes sobre a reta, uma volta cotada.
 *
 * Mais as duas receitas de espaco, que sao a ponte entre a diretiva e o
 * figuras/solidos.js (secao "solido", mais abaixo):
 *
 *   solido           prisma, cilindro, piramide, cone, esfera e prisma
 *                    triangular em cavaleira, com as composicoes do MATEM3-12:
 *                    o triangulo retangulo interno do cone e da piramide, a
 *                    esfera inscrita no cilindro e o setor que vira cone.
 *   painelsolidos    os cinco solidos lado a lado, nome por parametro.
 *
 * Duas decisoes deste arquivo, tomadas no piloto do MAT07-12 e validas para o
 * resto do banco:
 *
 *   1. O painel nao e UMA figura com quinze marcas: cada celula e uma figura
 *      propria, com fundo branco proprio e teto de cinco marcas proprio. O que o
 *      painel faz e segurar o doc.y entre uma celula e a seguinte para elas
 *      sairem lado a lado em vez de empilhadas. O teto de cinco vem da memoria
 *      de trabalho, que se gasta no que o olho abarca de uma vez, e tres celulas
 *      separadas por espaco em branco sao lidas uma de cada vez.
 *
 *   2. Palavra nenhuma nasce aqui dentro. Nome de classe (equilatero, rhombus),
 *      glosa de hachura e aviso de legenda entram por parametro, vindos do tema,
 *      porque o banco e bilingue e a verificacao com sympy so confere conta: um
 *      "altura" escrito dentro da funcao de desenho quebra a folha em ingles em
 *      silencio. Letra de vertice, numero e o sinal de grau sao neutros e ficam.
 *
 *   3. Uma cor, um sentido. O teal e a tinta da camada de resposta e diz uma
 *      coisa so: ISTO A RESPOSTA ACRESCENTOU. Preto e o que ja estava impresso
 *      na folha do exercicio. A regra inteira, com os tres casos medidos que a
 *      obrigaram, esta na secao "codigo de cor do gabarito", mais abaixo.
 *
 * Este arquivo tambem e a fachada que o pdf.js enxerga: ele repassa a leitura da
 * marcacao para o figuras/base.js, para o gerador ter uma dependencia so.
 *
 * Roda no navegador por <script> (exporta FigReceitas no global) e no Node.
 *
 * Regra da casa: nunca usar travessao.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FigReceitas = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Ligacao tardia com a fundacao, pelo mesmo motivo do base.js: no navegador o
   * base.js entra por <script> e vira o global FigBase; no Node a cadeia de
   * require passa pelo pdf.js e so fecha depois que ele terminou de carregar. */
  var cacheBase = null;
  function base() {
    if (cacheBase) return cacheBase;
    if (typeof FigBase !== 'undefined' && FigBase && FigBase.figura) cacheBase = FigBase;
    else if (typeof require === 'function') {
      try { cacheBase = require('./base.js'); } catch (e) { cacheBase = null; }
    }
    return cacheBase;
  }

  /* As marcas e o desenho entram pela MESMA ligacao tardia, e pelo mesmo motivo:
   * no navegador eles chegam por <script> e viram FigMarcas e FigDesenho; no
   * Node a cadeia de require passa pelo pdf.js e so fecha depois que ele
   * terminou de carregar. Resolvidos no topo do arquivo, os dois sairiam
   * undefined em silencio e o arco de angulo simplesmente nao apareceria.
   *
   * Os dois devolvem null quando nao estao disponiveis, em vez de lancar: a
   * receita tem caminho de recuo escrito para esse caso, porque uma folha com o
   * valor do angulo sem arco ainda e melhor do que uma folha sem figura. */
  var cacheMarcas = null;
  function marcas() {
    if (cacheMarcas) return cacheMarcas;
    if (typeof FigMarcas !== 'undefined' && FigMarcas && FigMarcas.marcaAngulo) cacheMarcas = FigMarcas;
    else if (typeof require === 'function') {
      try { cacheMarcas = require('./marcas.js'); } catch (e) { cacheMarcas = null; }
    }
    return cacheMarcas;
  }

  var cacheDesenho = null;
  function desenho() {
    if (cacheDesenho) return cacheDesenho;
    if (typeof FigDesenho !== 'undefined' && FigDesenho && FigDesenho.cota) cacheDesenho = FigDesenho;
    else if (typeof require === 'function') {
      try { cacheDesenho = require('./desenho.js'); } catch (e) { cacheDesenho = null; }
    }
    return cacheDesenho;
  }

  /* Os solidos em cavaleira, pela mesma ligacao tardia: FigSolidos no navegador,
   * require no Node. Null quando nao carregou, e a receita solido avisa em vez
   * de lancar, como as receitas de curva fazem com o desenho.js. */
  var cacheSolidos = null;
  function solidos() {
    if (cacheSolidos) return cacheSolidos;
    if (typeof FigSolidos !== 'undefined' && FigSolidos && FigSolidos.cone) cacheSolidos = FigSolidos;
    else if (typeof require === 'function') {
      try { cacheSolidos = require('./solidos.js'); } catch (e) { cacheSolidos = null; }
    }
    return cacheSolidos;
  }

  /* ============================================================ apoio */

  var TAM_DADO = 8.5;        // corpo do dado que resolve a questao
  /* O corpo da RESPOSTA na camada de gabarito. O teal do gabarito da 4,93:1
   * contra o 17,08:1 da tinta do texto, e em tons de cinza (fotocopia) o
   * mesmo corpo nas duas tintas faz a resposta imprimir mais fraca do que o
   * dado: medido a 150 dpi, 1.176 de tinta por ponto de largura contra 1.928
   * do dado, 39 por cento a menos. A cor e do pdf.js e e o codigo de todo o
   * gabarito; o que a receita pode dar e peso e corpo. */
  var TAM_RESPOSTA = 9.5;
  var TAM_NOME = 8.5;        // nome da classe, embaixo da celula do painel
  var AFAST_VERTICE = 4.5;   // vao entre a letra e o vertice, ate a BORDA da caixa

  function versor(dx, dy) {
    var n = Math.sqrt(dx * dx + dy * dy);
    if (n < 1e-9) return { x: 0, y: 1 };
    return { x: dx / n, y: dy / n };
  }

  function arredondar(n) {
    return String(Math.round(n * 100) / 100);
  }

  /* Grau desenha na base-14 (0xB0), e numero mais simbolo de grau sao neutros nas
   * duas linguas. Expressao algebrica (2x, 3x+10) sai como veio: escrever 2x
   * seguido do grau seria correto, mas a diretiva ja e o lugar onde o autor
   * decide isso. */
  function rotuloDeAngulo(bruto, B) {
    return B.ehNumero(bruto) ? bruto + '°' : String(bruto);
  }

  /* Rotulo de REGIAO, que nao e rotulo de angulo e por isso sai por outra porta.
   *
   * O caso medido, a figura do quadrilatero cortado pela diagonal na explicacao.
   * Ela ja escreveu esse rotulo de duas formas erradas, uma em cada rodada, e as
   * duas pelo mesmo motivo de fundo: um rotulo de regiao tem que dizer DE QUE
   * GRANDEZA ele fala, e nenhuma das duas dizia.
   *
   *   "180°" no centro de cada metade. Numero com simbolo de grau solto dentro de
   *   uma area se le como medida de UM angulo, e a figura passava a afirmar que
   *   existem ali dois angulos rasos, o contrario exato do argumento que ela
   *   ilustra. Tirar o grau foi certo e continua valendo.
   *
   *   "180" pelado, que e o que a rodada seguinte deixou. Duas leitoras
   *   independentes tropecaram, e uma delas escreveu: "viro a folha e caio numa
   *   figura pelada com dois numeros soltos, nao sei se e area, se e lado, se e o
   *   que". Sem o grau o numero parou de mentir e continuou mudo.
   *
   * A saida e a PALAVRA, e nao o arco. Marcar os tres angulos de cada
   * sub-triangulo custaria SEIS arcos na mesma figura, e arco sem valor e a
   * notacao de CONGRUENCIA neste kit (esta escrito no marcasPorAngulos, mais
   * abaixo): seis arcos vazios diriam que os seis angulos sao iguais, o que e
   * falso, e trocariam um rotulo mudo por uma afirmacao errada. Com a palavra na
   * frente, "soma 180" nao tem como ser lido como area nem como lado, e o grau
   * continua de fora porque a trava do valor solto do base.js classifica QUALQUER
   * texto com "°" como valor de angulo e cobra dele o arco que uma soma de regiao
   * nao tem. Quem escreve a unidade por extenso e o paragrafo ao lado da figura.
   *
   * A palavra vem do TEMA, como toda palavra deste arquivo: regioes=soma;180 em
   * portugues e regioes=sum;180 em ingles. Cada ocorrencia da chave e UMA regiao e
   * os pedacos dela saem juntos separados por espaco, que e o unico jeito de
   * escrever mais de uma palavra num valor de diretiva (a sintaxe corta em espaco
   * e so a legenda= engole a linha). */
  function rotuloDeRegiao(pedacos, B, doc) {
    var partes = [];
    var lista = [].concat(pedacos === null || pedacos === undefined ? [] : pedacos);
    for (var i = 0; i < lista.length; i++) {
      var t = String(lista[i] === null || lista[i] === undefined ? '' : lista[i]).trim();
      if (t) partes.push(t);
    }
    var s = partes.join(' ');
    if (s.indexOf('°') >= 0) {
      B.avisar(doc, 'quadrilatero: regioes=' + s + ' traz o simbolo de grau, e a glosa de uma ' +
        'regiao nao e medida de angulo: o valor ali e a soma dos angulos daquele ' +
        'sub-triangulo, e com o simbolo a figura afirma que existe um angulo raso dentro ' +
        'da regiao. Escreva a palavra do tema junto do valor (regioes=soma;180), sem o simbolo.');
      s = s.split('°').join('').trim();
    }
    if (s && !/[^0-9\s.+\-]/.test(s)) {
      B.avisar(doc, 'quadrilatero: regioes=' + s + ' e numero pelado no meio de uma area, e ' +
        'numero solto dentro de uma regiao nao diz se e area, lado ou soma. Escreva a palavra ' +
        'junto, vinda do tema nas duas linguas (regioes=soma;' + s + ' e regioes=sum;' + s + ').');
    }
    return s;
  }

  /* Cada ocorrencia de regioes= e UMA regiao, e os pedacos dela chegam separados
   * por ponto e virgula, como em externo=C;115: regioes=soma;180 regioes=soma;180.
   *
   * A forma antiga, "regioes=180;180" numa ocorrencia so, continua sendo lida
   * como duas regioes de um valor cada. Apagar a glosa de um tema ja escrito
   * seria trocar um defeito por outro, e o aviso de numero pelado que o
   * rotuloDeRegiao emite ja diz o que consertar. */
  function regioesDaDiretiva(B, d) {
    var brutos = pares(B, d.args, 'regioes');
    if (brutos.length !== 1 || brutos[0].length < 2) return brutos;
    for (var i = 0; i < brutos[0].length; i++) {
      if (!/^-?\d+(\.\d+)?°?$/.test(String(brutos[0][i]).trim())) return brutos;
    }
    var saida = [];
    for (var j = 0; j < brutos[0].length; j++) saida.push([brutos[0][j]]);
    return saida;
  }

  /* Rotulo empurrado para fora na direcao dada pela GEOMETRIA, nunca por
   * deslocamento literal em x e y: deslocamento fixo funciona na primeira figura
   * e em triangulo obtuso a letra cai dentro do desenho.
   *
   * Quem faz o trabalho e o rotulo() do desenho.js, que ja resolve halo medido,
   * linha de base, fuga de colisao e fio de chamada. O caminho de recuo existe
   * porque o desenho.js pode faltar no navegador, e uma folha com o valor sem
   * halo ainda e melhor do que uma folha sem o valor. */
  function escrever(ctx, texto, ancora, dir, afastamento, op) {
    op = op || {};
    var D = desenho();
    if (D) {
      return D.rotulo(ctx, texto, ancora, {
        direcao: dir || null,
        afastamento: afastamento,
        tam: op.tam || TAM_DADO, cor: op.cor, bold: !!op.bold
      });
    }
    var B = base(), g = B.gerador();
    var tam = op.tam || TAM_DADO;
    var d = dir || { x: 0, y: 0 };
    var px = ancora.x + d.x * (afastamento + 4);
    var py = ancora.y + d.y * (afastamento + 4) - tam * 0.35;
    var largura = g.medir(texto, tam, !!op.bold);
    var x0 = px - largura / 2;
    ctx.doc.retangulo(x0 - 1.4, py - tam * 0.26, largura + 2.8, tam * 1.08, g.COR.branco);
    ctx.doc.texto(texto, px, py, { tam: tam, bold: !!op.bold, cor: op.cor || g.COR.texto, align: 'centro' });
    return ctx.anota('rotulo', {
      texto: texto, tam: tam,
      x: x0 - 1.4, y: py - tam * 0.26, largura: largura + 2.8, altura: tam * 1.08
    });
  }

  /* Letra de vertice na BISSETRIZ EXTERNA, que e a unica direcao que se afasta
   * dos dois lados ao mesmo tempo. A direcao "centro para vertice" so coincide
   * com ela no poligono regular: em triangulo muito obtuso ela empurra a letra na
   * direcao do vizinho e as duas letras se encostam. */
  function letrasDeVertice(ctx, pontos, nomes) {
    var D = desenho();
    if (!nomes || !nomes.length) return;
    for (var i = 0; i < nomes.length && i < pontos.length; i++) {
      if (!nomes[i]) continue;
      if (D) {
        D.rotuloVertice(ctx, nomes[i], pontos, i, { tam: TAM_DADO, afastamento: AFAST_VERTICE });
      } else {
        var geo = base().geo;
        var n = pontos.length;
        var bi = geo.bissetriz(pontos[i], pontos[(i + 1) % n], pontos[(i + n - 1) % n]);
        escrever(ctx, nomes[i], pontos[i], { x: -bi.x, y: -bi.y }, AFAST_VERTICE, { tam: TAM_DADO });
      }
    }
  }

  /* Medida de lado no ponto medio e na NORMAL externa, e nao na direcao do centro
   * para o ponto medio: as duas so coincidem no isosceles, e o desvio medido
   * chega a 87 graus num triangulo de lados 100, 3 e 98, onde o rotulo saia
   * empurrado paralelo ao lado e os numeros se empilhavam no meio do desenho. */
  function medidaDeLado(ctx, texto, A, Bp, pontos, cor) {
    var D = desenho();
    if (D) {
      return D.rotuloLado(ctx, texto, A, Bp, {
        pontos: pontos, tam: TAM_DADO, afastamento: 5, cor: cor || undefined
      });
    }
    var geo = base().geo;
    var C = geo.centroide(pontos);
    var m = { x: (A.x + Bp.x) / 2, y: (A.y + Bp.y) / 2 };
    var nrm = versor(Bp.y - A.y, -(Bp.x - A.x));
    if (nrm.x * (m.x - C.x) + nrm.y * (m.y - C.y) < 0) { nrm.x = -nrm.x; nrm.y = -nrm.y; }
    return escrever(ctx, texto, m, nrm, 5, { tam: TAM_DADO, cor: cor || undefined });
  }

  /* Valor de angulo com o arco que diz A QUAL angulo ele se refere. Sem o arco a
   * folha nao tem como ser lida: foi o defeito achado nas primeiras 16 folhas
   * impressas, com 52, 61, 67, 38, 104 e a incognita x saindo como numero solto
   * perto do vertice.
   *
   * Quem desenha e o marcaAngulo() do marcas.js, e nao um arco escrito aqui, por
   * tres coisas que ele ja resolve e que uma copia local erraria: o arco sai
   * SEMPRE pelo lado do angulo menor que 180 (o erro mais silencioso da lista,
   * porque a figura fica bonita e diz outra coisa), o raio e fracao da menor
   * distancia do vertice aos vizinhos em vez de fixo, e o valor que nao cabe na
   * cunha sai para fora ligado por fio fino em vez de deitar em cima do lado.
   *
   * Contagem de marcas ativas: o marcaAngulo anota UM item, o valor, e nao dois.
   * O arco nao e dado a ler, e sim o que diz de qual angulo o dado fala. */
  function valorDeAngulo(ctx, V, A, Bp, texto, op) {
    op = op || {};
    var M = marcas();
    if (M) {
      return M.marcaAngulo(ctx.doc, V, A, Bp, {
        rotulo: texto, tam: op.tam || TAM_DADO, voltas: op.voltas,
        cor: op.cor, corRotulo: op.corRotulo, ctx: op.semContar ? null : ctx
      });
    }
    var geo = base().geo;
    var bis = geo.bissetriz(V, A, Bp);
    escrever(ctx, texto, V, bis, 16, { tam: op.tam || TAM_DADO });
    return null;
  }

  /* ============================================================ expressao do primeiro grau
   *
   * O valor de um angulo chega como numero (65) ou como expressao numa incognita
   * (3x+10, 2x+20, x, 180-x). Ler a expressao nao e luxo: quando o sistema que
   * elas formam e DETERMINADO, a figura tem que ser construida com os valores
   * achados, senao ela sai INVERTIDA, que e pior do que nao sair.
   *
   * O caso medido, exercicio 15 do MAT07-12: paralelogramo com 3x+10 e 2x+20 em
   * vertices consecutivos. O sistema fecha (3x+10 mais 2x+20 igual a 180 da x
   * igual a 30), a resposta e 100 no vertice do 3x+10 e 80 no do 2x+20, e o
   * desenho saia com 62 e 118, o agudo exatamente onde a resposta e obtusa. A
   * legenda "fora de escala" cobre imprecisao e NAO cobre inversao: a aluna que
   * resolve certo e olha o desenho conclui que errou, e o gabarito do 15 e so
   * texto, entao ela nao tem como se reconciliar com a figura.
   *
   * Devolve {a, b, letra} para "a vezes letra mais b", com letra null quando e
   * numero puro, e null quando a expressao nao e do primeiro grau numa incognita
   * so (x ao quadrado, 2x/3, alfa, duas letras). Ali a figura nao adivinha: cai
   * no caminho de recuo de sempre, que e o prototipo do tipo. */
  function lerLinear(bruto) {
    var s = String(bruto === null || bruto === undefined ? '' : bruto).replace(/\s+/g, '');
    if (!s) return null;
    var a = 0, b = 0, letra = null, termos = 0, i = 0;
    while (i < s.length) {
      var sinal = 1, ch = s.charAt(i);
      if (ch === '+' || ch === '-') { sinal = ch === '-' ? -1 : 1; i++; }
      else if (termos > 0) return null;   // termo colado sem operador: 3x10
      var num = '';
      while (i < s.length && /[0-9.]/.test(s.charAt(i))) { num += s.charAt(i); i++; }
      var lt = null;
      if (i < s.length && /[a-zA-Z]/.test(s.charAt(i))) { lt = s.charAt(i); i++; }
      if (num === '' && lt === null) return null;
      var v = num === '' ? null : parseFloat(num);
      if (num !== '' && !isFinite(v)) return null;
      if (lt !== null) {
        /* Duas letras diferentes na mesma folha nao formam sistema numa
         * incognita, e chutar uma delas seria inventar dado. */
        if (letra !== null && letra !== lt) return null;
        letra = lt;
        a += sinal * (v === null ? 1 : v);
      } else {
        b += sinal * v;
      }
      termos++;
    }
    return termos ? { a: a, b: b, letra: letra } : null;
  }

  /* Resolve o sistema "a x menos s t igual a rhs" pelo par de equacoes com maior
   * determinante, que e o par numericamente mais estavel. Devolve {x, t} com o
   * que conseguiu achar e null no que ficou indeterminado. */
  function resolverSistema(eqs) {
    var x = null, t = null, k, l;
    /* Uma equacao sem incognita algebrica (angulo numerico escrito num vertice)
     * ja fixa o t sozinha: e o caso do "angulo=65" num paralelogramo, escrito no
     * vertice A ou em qualquer outro. */
    for (k = 0; k < eqs.length; k++) {
      if (Math.abs(eqs[k].a) < 1e-9 && Math.abs(eqs[k].s) > 1e-9) { t = -eqs[k].rhs / eqs[k].s; break; }
    }
    var melhor = null;
    for (k = 0; k < eqs.length; k++) {
      for (l = k + 1; l < eqs.length; l++) {
        var det = -eqs[k].a * eqs[l].s + eqs[k].s * eqs[l].a;
        if (melhor === null || Math.abs(det) > Math.abs(melhor.det)) {
          melhor = { det: det, k: eqs[k], l: eqs[l] };
        }
      }
    }
    if (melhor && Math.abs(melhor.det) > 1e-9) {
      var e1 = melhor.k, e2 = melhor.l;
      x = (-e1.rhs * e2.s + e1.s * e2.rhs) / melhor.det;
      if (t === null) t = (e1.a * e2.rhs - e2.a * e1.rhs) / melhor.det;
    }
    /* Tipo de forma fixa (retangulo, quadrado): a equacao nao fala de t, e a
     * unica coisa que ela determina e a propria incognita. */
    if (x === null) {
      for (k = 0; k < eqs.length; k++) {
        if (Math.abs(eqs[k].a) > 1e-9 && Math.abs(eqs[k].s) < 1e-9) { x = eqs[k].rhs / eqs[k].a; break; }
      }
    }
    return { x: x, t: t };
  }

  /* ============================================================ escala
   *
   * A escala sai automatica da propria diretiva: se algum valor metrico nao e
   * numero (3x+10, x, alfa), a figura recebe fora de escala sem o autor precisar
   * lembrar. O foraDeEscala() do base.js olha uma lista de chaves inteiras, e
   * aqui algumas chaves misturam letra de vertice com numero (externo=C;115), o
   * que faria o "C" reprovar a escala de uma figura perfeitamente medivel. Estes
   * valores extras entram um a um. */
  function escalaFora(B, d, chavesMetricas, extras) {
    if (d.escala === 'fora') return true;
    if (d.escala === 'fiel') return false;
    if (B.foraDeEscala(d, chavesMetricas)) return true;
    for (var i = 0; i < (extras || []).length; i++) {
      var v = extras[i];
      if (v !== null && v !== undefined && v !== '' && !B.ehNumero(v)) return true;
    }
    return false;
  }

  /* ============================================================ leitura de pares
   *
   * Varias chaves carregam um par "quem;quanto" no mesmo valor (externo=C;115,
   * ceviana=bissetriz;B). O ponto e virgula ja e o separador de lista da
   * sintaxe, entao a leitura e um split proprio e nao o B.lista, que achataria os
   * pares de todas as ocorrencias numa lista unica e perderia quem vai com quem. */
  function pares(B, args, chave) {
    var brutos = B.valores(args, chave), saida = [];
    for (var i = 0; i < brutos.length; i++) {
      var partes = String(brutos[i]).split(';');
      var limpos = [];
      for (var j = 0; j < partes.length; j++) {
        var t = partes[j].trim();
        if (t) limpos.push(t);
      }
      if (limpos.length) saida.push(limpos);
    }
    return saida;
  }

  function indiceDeVertice(nomes, alvo, n) {
    var padrao = ['A', 'B', 'C', 'D', 'E', 'F'];
    var quero = String(alvo || '').toUpperCase();
    for (var i = 0; i < n; i++) {
      var nome = String((nomes && nomes[i]) || padrao[i]).toUpperCase();
      if (nome === quero) return i;
    }
    return -1;
  }

  function nomeDoVertice(nomes, i) {
    // sem vertices= a receita ainda entende incognita=C, porque a volta e sempre
    // A, B, C, D na ordem em que a construcao devolveu os pontos
    var padrao = ['A', 'B', 'C', 'D', 'E', 'F'];
    return String((nomes && nomes[i]) || padrao[i]).toUpperCase();
  }

  /* ============================================================ congruencia
   *
   * congruentes=b;c e um GRUPO: os lados b e c recebem a mesma marca. Cada
   * ocorrencia nova da chave e outro grupo e ganha um tracinho a mais, que e a
   * notacao do livro: mesma marca significa mesma medida, marcas diferentes
   * significam medidas diferentes.
   *
   * O grupo inteiro anota UMA marca, e nao uma por lado. E a mesma regra de
   * contagem do arco com valor: o que a aluna le nao sao tres tracinhos, e a
   * afirmacao "estes tres lados sao iguais". Contando um por lado, um triangulo
   * equilatero legitimo estourava o teto de cinco sozinho. */
  function marcarCongruentes(ctx, grupos, lados) {
    var M = marcas();
    if (!M || !grupos.length) return 0;
    var contadas = 0;
    for (var g = 0; g < grupos.length; g++) {
      var indices = grupos[g];
      for (var i = 0; i < indices.length; i++) {
        var lado = lados[indices[i]];
        if (!lado) continue;
        M.marcaLado(ctx.doc, lado[0], lado[1], { n: Math.min(3, g + 1) });
      }
      if (indices.length) {
        ctx.anota('marca', { tipo: 'congruencia', n: Math.min(3, g + 1), lados: indices.length });
        contadas++;
      }
    }
    return contadas;
  }

  /* Setas de paralelismo, pelo mesmo criterio de contagem: o par inteiro e uma
   * afirmacao so ("estes dois lados sao paralelos") e anota uma marca. O glifo de
   * paralelo sai como interrogacao na base-14, entao a setinha nao e reforco: e o
   * unico canal que existe para dizer paralelo nesta folha.
   *
   * As duas setas de um par apontam para o MESMO lado, e isso da trabalho porque
   * lados opostos de um poligono sao percorridos em sentidos contrarios na volta:
   * desenhadas cruas, a de cima do trapezio apontava para a esquerda e a de baixo
   * para a direita, o que se le como sentido e nao como paralelismo. O sentido de
   * cada lado e comparado com o do primeiro do par e invertido quando discorda.
   *
   * O conjunto inteiro conta como UMA marca, mesmo com dois pares. E a mesma
   * conta dos quatro quadradinhos do retangulo: o que a aluna le nao sao dois
   * fatos independentes, e a frase "esta figura tem os lados paralelos", que a
   * setinha simples e a dupla escrevem juntas. Contando um por par, o gabarito do
   * paralelogramo com os tres angulos respondidos estourava o teto de cinco
   * marcas por causa da notacao, e nao por causa da resposta. */
  function marcarParalelas(ctx, pares2, lados) {
    var M = marcas();
    if (!M || !pares2.length) return 0;
    for (var g = 0; g < pares2.length; g++) {
      var par = pares2[g];
      var ref = null;
      for (var i = 0; i < par.length; i++) {
        var lado = lados[par[i]];
        if (!lado) continue;
        var u = versor(lado[1].x - lado[0].x, lado[1].y - lado[0].y);
        var de = lado[0], ate = lado[1];
        if (ref === null) ref = u;
        else if (u.x * ref.x + u.y * ref.y < 0) { de = lado[1]; ate = lado[0]; }
        M.marcaLado(ctx.doc, de, ate, { n: Math.min(3, g + 1), tipo: 'seta' });
      }
    }
    ctx.anota('marca', { tipo: 'paralelismo', pares: pares2.length });
    return 1;
  }

  /* ============================================================ trava do clone
   *
   * Duas figuras com a MESMA forma no mesmo documento, uma na explicacao e outra
   * num exercicio, entregam a resposta. O caso medido no MAT07-12: a figura do
   * exercicio 8 e a figura do exemplo resolvido da pagina 3, mesmos 40 e 115
   * graus, mesmo enquadramento, so sem os rotulos; como o exemplo traz o 75
   * impresso, a resposta do exercicio 8 esta na folha do proprio material tres
   * paginas antes.
   *
   * Trocar os valores do exercicio e do TEMA e nao do desenhador: uma receita que
   * inventa numero deixa de desenhar o que o autor escreveu. O que o desenhador
   * pode fazer, e faz aqui, e se recusar a deixar isso passar em silencio.
   *
   * A impressao digital e a FORMA (os angulos internos ordenados, mais os angulos
   * externos marcados) e nao o texto da diretiva: "angulo=40 angulo=75 angulo=65
   * externo=C;115" e "angulo=40 externo=C;115 incognita=B" sao escritas
   * diferentes e constroem o mesmo triangulo. E ela e invariante por giro e por
   * escala de proposito: girar o exercicio muda o enquadramento e nao muda o fato
   * de a resposta estar impressa na outra folha.
   *
   * Explicacao e exercicio se distinguem pelo id: a figura da explicacao nao tem
   * id porque nada a chama de volta, e a do exercicio tem, porque a camada de
   * gabarito a chama por ele. Duas figuras iguais dentro da explicacao, ou dois
   * exercicios com a mesma forma, nao acusam: ali a repeticao nao entrega
   * resposta nenhuma. */
  function impressaoDaForma(geo, receita, pontos, extras) {
    var n = pontos.length, angs = [];
    for (var i = 0; i < n; i++) {
      var m = geo.anguloEm(pontos[i], pontos[(i + 1) % n], pontos[(i + n - 1) % n]);
      angs.push(Math.round(m * 10) / 10);
    }
    angs.sort(function (p, q) { return p - q; });
    var cauda = [];
    for (var e = 0; e < (extras || []).length; e++) {
      if (extras[e] !== null && extras[e] !== undefined && extras[e] !== '') cauda.push(String(extras[e]));
    }
    cauda.sort();
    return receita + ' ' + angs.join('/') + (cauda.length ? ' ext ' + cauda.join('/') : '');
  }

  function travaDeClone(B, doc, d, chave) {
    if (!doc || d.fase === 'gabarito') return;
    var vistas = doc.formasDeFigura || (doc.formasDeFigura = {});
    var papel = d.id ? 'exercicio' : 'explicacao';
    var antes = vistas[chave];
    if (!antes) { vistas[chave] = { papel: papel, id: d.id || null, avisou: false }; return; }
    if (antes.papel === papel || antes.avisou) return;
    antes.avisou = true;
    var qual = papel === 'exercicio' ? d.id : antes.id;
    B.avisar(doc, 'a figura do exercicio ' + (qual || '(sem id)') + ' repete a forma da figura da ' +
      'explicacao (' + chave + '): o exemplo resolvido ja traz os valores calculados, entao a ' +
      'figura do exercicio entrega a resposta. Troque os valores do exercicio no tema, ou tire a ' +
      'figura do exercicio.');
  }

  /* ============================================================ codigo de cor do gabarito
   *
   * UMA cor, UM sentido, e o sentido e este: TEAL marca o que a RESPOSTA
   * ACRESCENTA a folha, PRETO marca o que ja estava impresso no enunciado. Lida
   * assim, a figura do gabarito se le num relance como "a sua folha, mais isto",
   * e nao como a mesma figura outra vez.
   *
   * A folha do piloto tinha o mesmo codigo com DOIS sentidos, que e pior do que
   * codigo nenhum: quem aprende que teal quer dizer resposta num exercicio le
   * errado o exercicio seguinte. Os tres casos, medidos no fluxo de conteudo do
   * _piloto_MAT07-12_gabarito.pdf antes deste conserto:
   *
   *   exercicio 10, "@fig id=q10 fase=gabarito", a figura do enunciado rechamada
   *     pelo id: "65°" em (0.102, 0.110, 0.122) e "115°", "65°" e "115°" em
   *     (0.180, 0.490, 0.420). Certo, e e este o caso que define a regra: o 65 e o
   *     dado impresso na folha da aluna, os outros tres sao a resposta.
   *   exercicio 18, "@fig quadrilatero tipo=losango angulo=60 angulo=120
   *     fase=gabarito": "60°" e "120°" em preto e outro "60°" e outro "120°" em
   *     teal, sem significado nenhum. O exercicio 18 nao tem figura no enunciado:
   *     o losango inteiro e o contraexemplo que a resposta acrescenta, e os quatro
   *     valores sao resposta. A divisao em duas cores nascia de um detalhe de
   *     escrita da diretiva, dois valores declarados e dois deduzidos.
   *   exercicio 11, "@fig triangulo angulo=30 angulo=60 angulo=90 fase=gabarito":
   *     "30°" e "60°" em preto (e o 90 no quadradinho, tambem preto). Ou seja,
   *     preto querendo dizer RESPOSTA na mesma folha em que no 10 ele quer dizer
   *     DADO.
   *
   * A regra resolve os tres de uma vez: a figura que NASCE no gabarito nao tem
   * folha de exercicio nenhuma para repetir, entao tudo nela e acrescimo e sai em
   * teal; a figura rechamada pelo id repete o enunciado, e ali so o que ela
   * ACRESCENTA muda de cor.
   *
   * Como se sabe qual e qual sem adivinhar: o guardarPorId do base.js guarda a
   * PRIMEIRA diretiva de cada id, e a fase dela diz onde a figura nasceu. Sem id,
   * ou com id que ninguem registrou, a figura so existe aqui e tambem nasceu no
   * gabarito.
   *
   * O codigo vale sobre VALOR: numero, expressao, medida de lado, glosa de regiao
   * e o quadradinho de angulo reto, que neste kit ocupa o lugar do "90°" escrito.
   * Nao vale sobre o ALFABETO da figura, que e a letra de vertice, o tracinho de
   * congruencia, a seta de paralelismo, a diagonal, a ceviana e o contorno: essas
   * dizem a mesma coisa nas duas folhas, e pintar de teal uma delas devolveria a
   * cor o segundo sentido que este conserto acabou de tirar. Pela mesma razao os
   * quatro quadradinhos que o TIPO traz de fabrica (retangulo, quadrado) ficam
   * pretos: eles sao a notacao da classe e nao o valor de um vertice.
   *
   * A instrucao de desenho tambem nao entra, e por um motivo medido e nao por
   * gosto: a cota do desenho.js e feita de tres pecas e a mais leve delas, a linha
   * de chamada, sai a 0,6 pt; teal a 0,6 pt e exatamente o que a regra R2 do
   * _prova_desenho_auditor.js proibe, porque teal e a tinta de "olhe aqui" e 0,6 e
   * o peso de "isto e andaime". */
  function corDaCamada(doc, d, COR) {
    if (!d || d.fase !== 'gabarito') return null;
    var origem = d.id && doc && doc.figurasPorId ? doc.figurasPorId[d.id] : null;
    return (!origem || origem.fase === 'gabarito') ? COR.teal : null;
  }

  /* ============================================================ a escala que mente
   *
   * "Figura fora de escala" e afirmacao sobre o proprio desenho, e a folha do
   * piloto trazia essa afirmacao FALSA. Medido no exercicio 15, reconstruindo os
   * quatro angulos por produto escalar sobre os vertices do contorno impresso:
   * 100,004 / 80,001 / 99,999 / 79,996 graus, contra a resposta 100 e 80. Erro de
   * quatro milesimos de grau, e a legenda dizendo "meca com a conta e nao com o
   * transferidor".
   *
   * A frase nasceu quando a figura estava mesmo errada: antes de a receita
   * resolver o sistema, o exercicio 15 saia com 62 e 118, o agudo exatamente onde
   * a resposta e obtusa, e a legenda cobria o estrago. Consertado o desenho na
   * rodada passada, a desculpa ficou para tras.
   *
   * Das duas saidas coerentes o tema passou a escrever escala=fiel, e nao o
   * desenho deliberadamente enganoso. O argumento didatico, para quem for mexer:
   *
   *   1. A folha INTEIRA e mensuravel. O exercicio 10 desenha o paralelogramo de
   *      65 graus em escala e entrega 115 a quem medir; o 12 desenha o trapezio de
   *      72 e entrega 108. A politica deste kit esta escrita neste arquivo, na
   *      secao do quadrilatero: "a aluna que conferir com transferidor e
   *      recompensada". Sob essa politica o 15 nao e diferente em especie do 10
   *      nem do 12, e seria a UNICA figura da folha que mente. Uma figura que
   *      mente no meio de vinte e quatro que nao mentem nao custa so a si mesma:
   *      custa a confianca nas outras vinte e quatro, e o desenho deixa de ser
   *      ferramenta para virar enfeite.
   *   2. Ha turma com aluno neurodivergente, e para quem le ao pe da letra um
   *      desenho que contradiz a propria resposta e armadilha e nao licao: ele
   *      obriga a segurar "a figura esta errada de proposito" na memoria de
   *      trabalho ao mesmo tempo em que se resolve a equacao.
   *   3. O transferidor nao entrega a questao. Os arcos do 15 carregam "3x+10" e
   *      "2x+20", nao numeros: medir da 100 e 80 e ainda e preciso escrever
   *      3x+10 = 100 para achar x. O que se perde e um atalho de um passo; o que
   *      se ganharia com a mentira e uma folha em que o desenho deixa de valer.
   *   4. Desenhar fora de escala de proposito desliga a unica trava que pegou a
   *      inversao da rodada passada. O conferirRotulos, a trava do fam.temT e o
   *      _prova_receitas_auditor.py cobram todos a MESMA coisa, que o rotulo pouse
   *      num vertice que o mede. Trocada por "a ordem tem que bater", a trava para
   *      de distinguir 100 e 80 de 118 e 62.
   *
   * O que fica no desenhador e a trava que torna esse defeito impossivel de sair
   * calado outra vez. Quem marca fora de escala aqui e a chave escala= e o
   * automatico do escalaFora, que liga a marca quando algum valor metrico nao e
   * numero. O automatico nasceu de uma epoca em que letra na diretiva significava
   * figura chutada, e desde que a receita RESOLVE o sistema isso deixou de ser
   * verdade. A marca continua onde esta, porque letra em LADO continua sem
   * proporcao possivel e porque mexer no automatico calaria a marca tambem na
   * figura que ainda e chute; o que passa a existir e o aviso: quando cada valor
   * que a figura imprime sai no vertice que o mede, a receita se recusa a deixar a
   * folha afirmar o contrario e manda o tema decidir entre escala=fiel e
   * escala=fora. */
  function travaDaEscalaQueMente(B, doc, geo, receita, d, pontos, porVertice, valores) {
    if (!d || d.escala === 'fora' || d.escala === 'fiel') return false;
    /* Letra em LADO nao tem proporcao possivel: ali a marca automatica e verdade
     * e nao ha o que avisar. */
    var lados = B.lista(d.args, 'lado');
    for (var s = 0; s < lados.length; s++) if (!B.ehNumero(lados[s])) return false;
    var n = pontos.length, comLetra = 0;
    for (var v = 0; v < n; v++) {
      var bruto = porVertice[v];
      if (bruto === null || bruto === undefined || B.ehNumero(bruto)) continue;
      comLetra++;
      var val = valores ? valores[v] : null;
      if (val === null || val === undefined) return false;   // letra que ninguem resolveu
      var medido = geo.anguloEm(pontos[v], pontos[(v + 1) % n], pontos[(v + n - 1) % n]);
      if (Math.abs(medido - val) > 0.5) return false;
    }
    if (!comLetra) return false;
    B.avisar(doc, receita + ': esta figura esta marcada fora de escala so porque a diretiva traz ' +
      'letra, e o desenho saiu EXATO, cada valor no vertice que o mede. "Fora de escala" e ' +
      'afirmacao sobre o proprio desenho, e assim ela e falsa. Escreva escala=fiel na diretiva e ' +
      'tire a legenda de escala do tema, ou escreva escala=fora se o desenho enganoso for mesmo o ' +
      'que voce quer.');
    return true;
  }

  /* ============================================================ triangulo */

  var ALTURA_VAO = 92;

  var triangulo = {
    chaves: ['angulo', 'lado', 'vertices', 'incognita', 'giro',
             'congruentes', 'externo', 'ceviana', 'encontro'],
    metricas: ['angulo', 'lado'],

    /* Quanto o bloco vai ocupar, sem desenhar nada. Quem escreve o exercicio
     * precisa disto ANTES de escrever o numero: reservado so o espaco da figura,
     * o enunciado ficava no pe de uma folha e o desenho dele aparecia no topo da
     * seguinte, acima de nada e antes do numero do exercicio seguinte. */
    medir: function (d, op) {
      var B = base(), geo = B.geo;
      var lados = B.numeros(d.args, 'lado');
      var ladosBrutos = B.lista(d.args, 'lado');
      var ehVao = ladosBrutos.length >= 3 && lados.length >= 3 &&
        lados[0] > 0 && lados[1] > 0 && lados[2] > 0 &&
        !geo.trianguloPorLados(lados[0], lados[1], lados[2]);
      return {
        altura: op.altura != null ? op.altura : (ehVao ? ALTURA_VAO : null),
        legenda: d.legenda || null,
        foraDeEscala: escalaFora(B, d, triangulo.metricas, valoresExtras(B, d))
      };
    },

    desenhar: function (doc, d, op) {
      var B = base(), g = B.gerador(), geo = B.geo, COR = g.COR;

      var angulosBrutos = B.lista(d.args, 'angulo');
      var ladosBrutos = B.lista(d.args, 'lado');
      var lados = B.numeros(d.args, 'lado');
      var nomes = B.lista(d.args, 'vertices');
      var incognitas = B.lista(d.args, 'incognita');
      var giro = B.numero(d.args, 'giro') || 0;
      var fora = escalaFora(B, d, triangulo.metricas, valoresExtras(B, d));

      /* Um rotulo por vertice, decidido ANTES de construir. Os valores de angulo
       * preenchem os vertices na ordem, pulando os da incognita: assim
       * "angulo=52 angulo=61 incognita=C" poe 52 em A, 61 em B e x em C, e
       * "angulo=52 angulo=61 incognita=A" poe x em A, 52 em B e 61 em C, sem o
       * autor precisar contar posicao. */
      var ehIncognita = [false, false, false];
      for (var q = 0; q < incognitas.length; q++) {
        var iq = indiceDeVertice(nomes, incognitas[q], 3);
        /* Incognita que nao e vertice nenhum some da folha em silencio, e a
         * questao que pede "o valor de x" sai sem o x em lugar nenhum. */
        if (iq < 0) {
          B.avisar(doc, 'triangulo: incognita=' + incognitas[q] + ' nao e um dos vertices (' +
            [nomeDoVertice(nomes, 0), nomeDoVertice(nomes, 1), nomeDoVertice(nomes, 2)].join(', ') + ')');
          return null;
        }
        ehIncognita[iq] = true;
      }
      var nIncognitas = incognitas.length;

      /* Valor escrito na diretiva que nao chega na folha e SEMPRE erro de quem
       * escreveu o tema. O laco de preenchimento so tem tres posicoes, entao o
       * quarto angulo, ou o angulo que sobra por causa da incognita, ia para o
       * lixo em silencio: "angulo=52 angulo=61 angulo=67 angulo=90" desenhava e
       * jogava o 90 fora sem ninguem ver. */
      var cabemAngulos = 3 - nIncognitas;
      if (angulosBrutos.length > cabemAngulos) {
        B.avisar(doc, 'triangulo: sobraram valores de angulo que nenhum vertice recebe (' +
          angulosBrutos.join(', ') + ' para ' + cabemAngulos + ' vertice(s) livre(s))');
        return null;
      }
      if (ladosBrutos.length > 3) {
        B.avisar(doc, 'triangulo: sobraram valores de lado (' + ladosBrutos.join(', ') + ')');
        return null;
      }

      /* A trava da soma 180 e conferida sobre os valores ESCRITOS e nao sobre os
       * slots de porVertice: o slot da incognita guarda a string "x", entao
       * exigir os tres slots numericos deixava a chave incognita desligar a
       * trava, e "angulo=52 angulo=61 angulo=70 incognita=C" desenhava 52, 61 e x
       * tranquilo, com o 70 sumindo da folha. */
      var angNum = [];
      for (var an = 0; an < angulosBrutos.length; an++) {
        if (B.ehNumero(angulosBrutos[an])) angNum.push(parseFloat(angulosBrutos[an]));
      }
      var somaEscrita = angNum.reduce(function (s, v) { return s + v; }, 0);
      if (angNum.length >= 3 && Math.abs(somaEscrita - 180) > 0.5) {
        B.avisar(doc, 'triangulo: os angulos ' + angulosBrutos.join(', ') + ' somam ' +
          arredondar(somaEscrita) + ' e nao 180');
        return null;
      }
      if (angNum.length === 2 && somaEscrita >= 180 - 0.5) {
        B.avisar(doc, 'triangulo: os angulos ' + angulosBrutos.join(', ') + ' somam ' +
          arredondar(somaEscrita) + ' e nao sobra nada para o terceiro');
        return null;
      }

      var porVertice = [null, null, null];
      for (var iv2 = 0, prox = 0; iv2 < 3; iv2++) {
        if (ehIncognita[iv2]) { porVertice[iv2] = 'x'; continue; }
        if (prox < angulosBrutos.length) porVertice[iv2] = angulosBrutos[prox++];
      }

      /* O angulo externo entra na CONSTRUCAO e nao so no desenho: com
       * "externo=C;115" o vertice C mede 65 por dentro, e sem isso o triangulo
       * saia com o C chutado pelo caminho de recuo e o arco de 115 aparecia num
       * vertice cujo suplementar era outro numero. A figura ficava bonita e
       * dizia outra coisa, que e o defeito que este arquivo inteiro existe para
       * impedir. */
      var externos = [];
      var pex = pares(B, d.args, 'externo');
      for (var e = 0; e < pex.length; e++) {
        var ie = indiceDeVertice(nomes, pex[e][0], 3);
        if (ie < 0) {
          B.avisar(doc, 'triangulo: externo=' + pex[e].join(';') + ' nao comeca por um vertice');
          return null;
        }
        externos.push({ i: ie, bruto: pex[e].length > 1 ? pex[e][1] : null });
      }

      var congruentes = gruposDeLados(B, d, doc, 3);
      if (congruentes === null) return null;

      var pontos = null, vao = null, deduzido = [false, false, false];
      /* Os valores que os DADOS determinam em cada vertice, e nao os que o
       * caminho de recuo chutou. Declarado aqui em cima e nao dentro do ramo
       * porque a trava da escala que mente, la embaixo, precisa dele para saber
       * se o desenho saiu exato. */
      var conhecidos = [null, null, null];

      if (ladosBrutos.length >= 3) {
        pontos = lados.length >= 3 ? geo.trianguloPorLados(lados[0], lados[1], lados[2]) : null;
        /* Com os tres lados numericos a construcao consome tudo, entao os tres
         * angulos da figura sao deducao dos dados e o gabarito pode escrever o
         * valor medido. */
        if (pontos) deduzido = [true, true, true];
        /* O null da desigualdade triangular e resultado didatico; o null de lado
         * zero ou negativo nao e, e os dois entravam pela mesma porta: "lado=-5
         * lado=7 lado=12" desenhava a segunda regua VOLTANDO para tras, e
         * "lado=0" pendurava um rotulo numa regua de comprimento zero, os dois
         * marcados como escala fiel. */
        if (!pontos && lados.length >= 3) {
          if (lados[0] > 0 && lados[1] > 0 && lados[2] > 0 &&
              isFinite(lados[0]) && isFinite(lados[1]) && isFinite(lados[2])) {
            vao = lados.slice(0, 3).sort(function (a, b) { return b - a; });
          } else {
            B.avisar(doc, 'triangulo: lado que nao e comprimento (' + lados.join(', ') + ')');
            return null;
          }
        }
      }
      if (!pontos && !vao) {
        /* Cada angulo tem que sair no SEU vertice, inclusive quando um deles e
         * expressao (3x+10, alfa). Se a construcao apenas empurrasse os numeros
         * na ordem de chegada, o 61 iria parar num vertice de 62 graus e a
         * figura mentiria justamente no dado que a aluna vai medir. */
        for (var kc = 0; kc < 3; kc++) {
          if (porVertice[kc] !== null && B.ehNumero(porVertice[kc])) conhecidos[kc] = parseFloat(porVertice[kc]);
        }
        for (var ke = 0; ke < externos.length; ke++) {
          if (externos[ke].bruto === null || !B.ehNumero(externos[ke].bruto)) continue;
          var interno = 180 - parseFloat(externos[ke].bruto);
          var ja = conhecidos[externos[ke].i];
          if (ja !== null && Math.abs(ja - interno) > 0.5) {
            B.avisar(doc, 'triangulo: o vertice ' + nomeDoVertice(nomes, externos[ke].i) +
              ' esta escrito com ' + ja + ' por dentro e ' + externos[ke].bruto +
              ' por fora, e os dois nao sao suplementares');
            return null;
          }
          conhecidos[externos[ke].i] = interno;
        }
        /* A simetria sai dos grupos de congruencia e e lida ANTES de a resolucao
         * algebrica preencher os slots vazios. Lida depois, o isosceles do
         * exercicio 9 (angulo=40 com x nos dois angulos da base) deixaria de ser
         * reconhecido como isosceles na hora de assentar a figura sobre a base, e
         * sairia deitado de lado, com os numeros certos e sem se ler como
         * isosceles, que e a unica coisa que ele precisa dizer. */
        var simetria = simetriaDeCongruentes(congruentes, conhecidos);
        resolverTriangulo(B, porVertice, conhecidos, simetria);
        var vals = aberturas(conhecidos, simetria);
        /* trianguloPorAngulos(100, 95) devolve null pelo mesmo motivo do
         * trianguloPorLados(4, 7, 12): os dois lados nunca se encontram. Nao ha
         * receita de vao para angulo, entao a figura nao sai e o aviso fica no
         * doc. Desenhar um triangulo qualquer no lugar seria desenhar uma
         * configuracao que nao existe, com aparencia de verdade. */
        if (vals.impossivel) { B.avisar(doc, 'triangulo: ' + vals.aviso); return null; }
        pontos = geo.trianguloPorAngulos(vals.a, vals.b, 100);
        if (!pontos) {
          B.avisar(doc, 'triangulo: os angulos ' + angulosBrutos.join(' e ') + ' nao fecham');
          return null;
        }
        /* O trianguloPorAngulos deita SEMPRE o lado entre os dois primeiros
         * vertices na horizontal, entao o vertice de indice 2 e que fica no
         * apice. Num isosceles com o apice dado em A, isso punha o apice num dos
         * cantos de baixo e o triangulo saia deitado de lado: a figura estava
         * certa nos numeros e mesmo assim nao se lia como isosceles, que era a
         * unica coisa que ela precisava dizer. Com os dois angulos iguais
         * identificados, a figura e assentada sobre a base deles. */
        if (vals.simetria) pontos = assentarSobre(geo, pontos, vals.simetria[0], vals.simetria[1]);
        deduzido = vals.deduzido;
      }

      var corGab = corDaCamada(doc, d, COR);

      if (vao) return desenharVao(doc, B, g, d, op, vao, ladosBrutos, fora, corGab);

      /* Lado e angulo no mesmo triangulo sao dado redundante: ou concordam, ou um
       * dos dois esta errado e a folha nao pode escolher em silencio. Sem esta
       * conferencia, "lado=3 lado=4 lado=5 angulo=50" construia o 3-4-5 de
       * verdade e imprimia "50 graus" num vertice que mede 36,87, e "lado=6
       * lado=8 angulo=90" desenhava o lado rotulado 6 com 41 por cento a mais de
       * comprimento que o rotulado 8, os dois marcados como escala fiel.
       *
       * A unica saida e a chave escala=fora escrita a mao, que e o caso do
       * desenho enganoso de proposito previsto na especificacao: ali o autor
       * assume a diferenca e a folha ja avisa em legenda. O fora automatico, o
       * que nasce de um valor nao numerico, NAO abre essa porta: ninguem pediu
       * desenho enganoso. */
      var briga = d.escala === 'fora' ? null
        : conferirRotulos(geo, B, pontos, porVertice, ladosBrutos, externos, congruentes, nomes);
      if (briga) { B.avisar(doc, 'triangulo: ' + briga); return null; }

      if (giro) pontos = geo.girar(pontos, giro);

      /* As cevianas e o prolongamento do angulo externo saem da figura, entao a
       * caixa de enquadramento precisa conhecer os pontos deles ANTES do
       * enquadrar: enquadrada so pelo triangulo, a ponta do prolongamento caia
       * fora do bloco e por cima do texto seguinte. */
      var cevianas = lerCevianas(B, doc, d, nomes, pontos);
      if (cevianas === null) return null;
      var extremos = pontos.slice();
      var prolongamentos = [];
      for (var pe = 0; pe < externos.length; pe++) {
        var raio = prolongar(pontos, externos[pe].i);
        prolongamentos.push(raio);
        extremos.push(raio.ponta);
      }
      for (var pc = 0; pc < cevianas.length; pc++) extremos.push(cevianas[pc].pe);

      var cx = geo.caixa(extremos);

      travaDeClone(B, doc, d, impressaoDaForma(geo, 'triangulo', pontos, valoresExtras(B, d)));
      if (fora) travaDaEscalaQueMente(B, doc, geo, 'triangulo', d, pontos, porVertice, conhecidos);

      return B.figura(doc, {
        x: op.x, largura: op.largura, altura: op.altura,
        unidades: cx, legenda: d.legenda, foraDeEscala: fora,
        fase: d.fase, id: d.id, receita: 'triangulo'
      }, function (ctx) {
        var P = ctx.pontos(pontos);
        var ladosP = [[P[1], P[2]], [P[2], P[0]], [P[0], P[1]]];

        /* Contorno em COR.texto e 1,2 pt: e o nivel grosso da hierarquia de tres
         * espessuras (1,2 contorno, 0,9 marca, 0,6 auxiliar), e a NBR 8403 pede
         * que a larga seja no minimo o dobro da estreita justamente para uma
         * informacao nao ser confundida com outra. */
        ctx.contorno(function () {
          contornoDe(ctx, P);
          /* O prolongamento e do mesmo peso do contorno: ele E um lado do
           * triangulo continuado, e nao uma construcao acrescentada. A ponta de
           * seta diz que a semirreta segue, que e o que faz o angulo do lado de
           * fora existir. */
          var D = desenho();
          for (var i = 0; i < prolongamentos.length; i++) {
            var V = ctx.p(prolongamentos[i].vertice), Q = ctx.p(prolongamentos[i].ponta);
            if (D) D.seta(ctx, V, Q, { espessura: 1.2, tam: 5 });
            else ctx.doc.linha(V.x, V.y, Q.x, Q.y, COR.texto, 1.2);
          }
        });

        /* O angulo mora na camada de MARCAS e nao na de rotulos, porque o que se
         * desenha aqui e o arco: o numero e o rotulo DELE e sai junto, na mesma
         * chamada. Pintado na camada certa, o arco fica por baixo dos halos das
         * letras de vertice e das medidas de lado, que e a ordem que a
         * especificacao fixa (fundo, preenchimento, hachura, contorno, marcas,
         * rotulos). */
        ctx.marcas(function () {
          marcarCongruentes(ctx, congruentes, ladosP);
          desenharCevianas(ctx, cevianas, P, d);
          desenharAngulos(ctx, geo, B, P, porVertice, ehIncognita, nomes, d, fora, deduzido,
            { corDeclarada: corGab });
          for (var i = 0; i < prolongamentos.length; i++) {
            var v = externos[i].i;
            if (externos[i].bruto === null) continue;
            /* Dos quatro angulos que aparecem no vertice depois do
             * prolongamento, so um deles e "o angulo externo": o que fica entre a
             * ponta do prolongamento e o OUTRO lado que sai do vertice, o lado
             * que nao foi prolongado. O prolongar() sempre continua o lado que
             * chega vindo do vertice anterior na volta, entao o lado nao
             * prolongado e o que vai para o vertice seguinte. */
            valorDeAngulo(ctx, P[v], ctx.p(prolongamentos[i].ponta), P[(v + 1) % 3],
              rotuloDeAngulo(externos[i].bruto, B),
              { cor: corGab || undefined, corRotulo: corGab || undefined });
          }
        });

        ctx.rotulos(function () {
          letrasDeVertice(ctx, P, nomes);
          for (var s = 0; s < ladosBrutos.length && s < 3; s++) {
            /* lado a e o oposto ao vertice A: a = BC, b = CA, c = AB. */
            medidaDeLado(ctx, String(ladosBrutos[s]), ladosP[s][0], ladosP[s][1], P, corGab);
          }
        });
      });
    }
  };

  /* Preenche os angulos que as EXPRESSOES determinam, pela mesma regra do
   * quadrilatero: sistema determinado vira construcao, e nao prototipo chutado.
   * No triangulo a relacao e a soma 180, mais a igualdade dos dois angulos da
   * base quando as marcas de congruencia dizem que ela existe: com "angulo=2x
   * incognita=B congruentes=b;c" as marcas dao o terceiro valor e o sistema
   * fecha em 90, 45 e 45.
   *
   * Mexe em conhecidos SO onde ele esta null, e so quando os tres valores achados
   * sao angulos de verdade: qualquer coisa fora do intervalo volta pelo caminho
   * de recuo, que ja tem os avisos dele escritos. Devolve se resolveu, para o
   * teste poder cobrar. */
  function resolverTriangulo(B, porVertice, conhecidos, simetria) {
    var formas = [null, null, null], letra = null, i;
    for (i = 0; i < 3; i++) {
      if (conhecidos[i] !== null) { formas[i] = { a: 0, b: conhecidos[i], letra: null }; continue; }
      if (porVertice[i] === null || porVertice[i] === undefined) continue;
      var lin = lerLinear(porVertice[i]);
      if (!lin) continue;
      if (lin.letra) {
        if (letra !== null && letra !== lin.letra) return false;
        letra = lin.letra;
      }
      formas[i] = lin;
    }
    if (simetria) {
      var si = simetria[0], sj = simetria[1];
      if (formas[si] && !formas[sj]) formas[sj] = formas[si];
      else if (formas[sj] && !formas[si]) formas[si] = formas[sj];
    }
    if (!formas[0] || !formas[1] || !formas[2]) return false;
    var somaA = 0, somaB = 0;
    for (i = 0; i < 3; i++) { somaA += formas[i].a; somaB += formas[i].b; }
    if (Math.abs(somaA) < 1e-9) return false;
    var x = (180 - somaB) / somaA;
    var valores = [];
    for (i = 0; i < 3; i++) {
      var v = formas[i].a * x + formas[i].b;
      if (!(v > 0.5) || !(v < 179.5)) return false;
      if (conhecidos[i] !== null && Math.abs(conhecidos[i] - v) > 0.5) return false;
      valores.push(v);
    }
    var mexeu = false;
    for (i = 0; i < 3; i++) if (conhecidos[i] === null) { conhecidos[i] = valores[i]; mexeu = true; }
    return mexeu;
  }

  /* Os valores que misturam letra e numero num mesmo par, para a decisao de
   * escala poder olhar so a parte numerica. */
  function valoresExtras(B, d) {
    var saida = [], p = pares(B, d.args, 'externo');
    for (var i = 0; i < p.length; i++) if (p[i].length > 1) saida.push(p[i][1]);
    return saida;
  }

  /* congruentes=b;c e um grupo de lados pelo nome (a, b, c no triangulo; a, b, c,
   * d no quadrilatero, na volta A-B, B-C, C-D, D-A). Devolve null quando um nome
   * nao existe, porque um grupo silenciosamente vazio apagaria justamente a marca
   * que carrega a hipotese do exercicio. */
  function gruposDeLados(B, d, doc, n) {
    var letras = ['a', 'b', 'c', 'd', 'e', 'f'];
    var brutos = pares(B, d.args, 'congruentes'), saida = [];
    for (var g = 0; g < brutos.length; g++) {
      var grupo = [];
      for (var i = 0; i < brutos[g].length; i++) {
        var nome = String(brutos[g][i]).toLowerCase();
        var idx = -1;
        for (var k = 0; k < n; k++) if (letras[k] === nome) idx = k;
        if (idx < 0) {
          B.avisar(doc, 'congruentes=' + brutos[g].join(';') + ': "' + brutos[g][i] +
            '" nao e um lado (use ' + letras.slice(0, n).join(', ') + ')');
          return null;
        }
        grupo.push(idx);
      }
      if (grupo.length) saida.push(grupo);
    }
    return saida;
  }

  /* No triangulo, o lado a e oposto ao vertice A. Um grupo de congruencia com
   * exatamente dois lados diz que os dois ANGULOS opostos a eles sao iguais, e e
   * isso que transforma o chute do caminho de recuo em deducao: com o apice de 40
   * escrito e os lados b e c marcados iguais, os dois angulos da base medem 70 de
   * verdade e nao por acaso do desenho. */
  function simetriaDeCongruentes(grupos, conhecidos) {
    for (var g = 0; g < (grupos || []).length; g++) {
      if (grupos[g].length !== 2) continue;
      var i = grupos[g][0], j = grupos[g][1];
      if (conhecidos[i] === null && conhecidos[j] === null) return [i, j];
    }
    return null;
  }

  /* Onde termina o prolongamento de um lado alem do vertice V. O lado prolongado
   * e o que CHEGA em V vindo do vertice anterior na volta, e nao um dos dois a
   * escolher: fixada a regra, "externo=C" quer dizer sempre a mesma figura, e o
   * autor do tema nao precisa adivinhar qual dos dois angulos externos ele vai
   * receber. */
  function prolongar(pontos, v) {
    var origem = pontos[(v + 2) % 3];
    var V = pontos[v];
    var u = versor(V.x - origem.x, V.y - origem.y);
    var comprimento = Math.sqrt((V.x - origem.x) * (V.x - origem.x) + (V.y - origem.y) * (V.y - origem.y));
    var t = Math.max(0.42 * comprimento, 26);
    return { vertice: V, origem: origem, ponta: { x: V.x + u.x * t, y: V.y + u.y * t } };
  }

  /* ceviana=bissetriz;B, repetivel, mais encontro=I. Devolve o pe de cada uma e o
   * ponto onde elas se cruzam, ja em unidades do problema, para o enquadramento
   * poder incluir tudo antes do primeiro traco. */
  function lerCevianas(B, doc, d, nomes, pontos) {
    var geo = B.geo;
    var brutos = pares(B, d.args, 'ceviana'), saida = [];
    for (var i = 0; i < brutos.length; i++) {
      var tipo = String(brutos[i][0]).toLowerCase();
      if (tipo !== 'altura' && tipo !== 'mediana' && tipo !== 'bissetriz') {
        B.avisar(doc, 'ceviana=' + brutos[i].join(';') +
          ': o tipo tem que ser altura, mediana ou bissetriz');
        return null;
      }
      var v = indiceDeVertice(nomes, brutos[i].length > 1 ? brutos[i][1] : '', 3);
      if (v < 0) {
        B.avisar(doc, 'ceviana=' + brutos[i].join(';') + ': o vertice nao existe neste triangulo');
        return null;
      }
      var A = pontos[(v + 1) % 3], C = pontos[(v + 2) % 3], V = pontos[v];
      var pe;
      if (tipo === 'altura') pe = geo.pe(V, A, C);
      else if (tipo === 'mediana') pe = geo.pontoNoSegmento(A, C, 0.5);
      else {
        /* O pe da bissetriz divide o lado oposto na razao dos lados vizinhos, que
         * e o teorema da bissetriz interna. Calculado assim, e nao por
         * intersecao aproximada, o desenho fecha com a conta. */
        var lA = geo.distancia(V, A), lC = geo.distancia(V, C);
        pe = geo.pontoNoSegmento(A, C, lA / (lA + lC));
      }
      saida.push({ tipo: tipo, v: v, pe: { x: pe.x, y: pe.y } });
    }
    var letra = B.primeiro(d.args, 'encontro');
    if (letra && saida.length >= 2) {
      var X = cruzar(pontos[saida[0].v], saida[0].pe, pontos[saida[1].v], saida[1].pe);
      if (!X) B.avisar(doc, 'encontro=' + letra + ': as duas cevianas nao se cruzam');
      else saida.encontro = { ponto: X, letra: String(letra) };
    } else if (letra) {
      B.avisar(doc, 'encontro=' + letra + ' pede pelo menos duas cevianas');
    }
    return saida;
  }

  function cruzar(A, Bp, C, D) {
    var r = { x: Bp.x - A.x, y: Bp.y - A.y }, s = { x: D.x - C.x, y: D.y - C.y };
    var den = r.x * s.y - r.y * s.x;
    if (Math.abs(den) < 1e-9) return null;
    var t = ((C.x - A.x) * s.y - (C.y - A.y) * s.x) / den;
    return { x: A.x + t * r.x, y: A.y + t * r.y };
  }

  /* A ceviana sai na TINTA DO CONTORNO e se separa dele pela ESPESSURA, e nao
   * pela cor: o triangulo do enunciado tem tres lados e a bissetriz e uma linha
   * acrescentada por cima dele, o que na folha se diz com peso e nao com pigmento.
   *
   * Ela pedia COR.teal tracejada, e isso era o codigo da camada de RESPOSTA
   * pedido dentro de uma figura de ENUNCIADO: no exercicio 17 as duas bissetrizes
   * sao dado da questao, e teal ali queria dizer exatamente o contrario do que
   * quer dizer no gabarito do exercicio 10. Mesmo codigo com dois sentidos na
   * mesma folha e pior do que codigo nenhum, e a secao "codigo de cor do
   * gabarito" acima decide a favor do gabarito: teal so na resposta.
   *
   * Na pratica a folha ja saia certa, porque a regra OBJETO da hierarquia de
   * tinta do desenho.js corrigia o pedido em silencio (medido no t17: 0,90 pt,
   * #1A1C1F, continuo, e nao 0,60 teal tracejado). O pedido e que continuava
   * mentindo, e um pedido errado que so nao aparece porque alguem o conserta
   * depois volta a aparecer no dia em que o conserto mudar de lugar. A espessura
   * continua vindo daqui em 0,6, o piso auxiliar, e quem a sobe para 0,9 e a regra
   * OBJETO, que e de quem tem a tabela.
   *
   * Os arquinhos que dizem "esta ceviana divide o angulo ao meio" NAO entram
   * aqui. Com duas bissetrizes eles somam quatro arcos que competem com o arco do
   * dado do enunciado, e a propria especificacao nomeia "cinco arcos na mesma
   * figura" como o resultado tipico de quem tem primitiva boa e nenhum criterio.
   * Quem diz que sao bissetrizes e o texto do exercicio, e redundancia entre os
   * dois canais, texto e desenho, e justamente a que ajuda quem le com
   * dificuldade. */
  function desenharCevianas(ctx, cevianas, P, d) {
    var B = base(), D = desenho(), COR = B.gerador().COR;
    if (!cevianas || !cevianas.length || !D) return;
    for (var i = 0; i < cevianas.length; i++) {
      D.poligono(ctx, [P[cevianas[i].v], ctx.p(cevianas[i].pe)], {
        fechado: false, cor: COR.texto, espessura: 0.6,
        papel: 'ceviana ' + cevianas[i].tipo
      });
    }
    if (cevianas.encontro) {
      var X = ctx.p(cevianas.encontro.ponto);
      var centro = B.geo.centroide(P);
      /* O arco do angulo que o cruzamento batiza. Batizar o ponto onde duas
       * construcoes se encontram so tem um motivo, que e perguntar por um dos
       * QUATRO angulos que nascem ali, e sem arco nada na figura diz qual deles:
       * medido no exercicio 17, a figura marcava o 70 do vertice A com arco e
       * deixava o angulo BIC, que e a pergunta, com um "I" solto ao lado do
       * cruzamento. Marcava o dado e deixava a incognita sem marca.
       *
       * O arco vai entre as semirretas que saem do cruzamento na direcao dos dois
       * VERTICES de onde as construcoes partiram, que e exatamente o angulo que o
       * par de letras nomeia: com as bissetrizes de B e de C, o angulo BIC.
       *
       * Ele nao anota item proprio, pela mesma regra ja escrita para o arco com
       * valor: o arco nao e dado a ler, e o que diz de qual angulo o dado fala, e
       * aqui o dado e a propria letra do cruzamento, que o ponto abaixo ja anota.
       * Contando os dois, o exercicio 17 passaria de cinco itens (70, A, B, C e I)
       * para seis e estouraria o teto por causa da notacao, e nao do conteudo.
       *
       * Sai antes do ponto de proposito: os dois moram na camada de marcas, e
       * desenhado depois o arco passaria por cima do halo da letra. */
      var M = marcas();
      if (M && cevianas.length >= 2) {
        M.marcaAngulo(ctx.doc, X, P[cevianas[0].v], P[cevianas[1].v], { tam: TAM_DADO });
      }
      D.ponto(ctx, X, {
        rotulo: cevianas.encontro.letra, tam: TAM_DADO,
        direcao: versor(X.x - centro.x, X.y - centro.y)
      });
    }
  }

  function contornoDe(ctx, P) {
    var D = desenho(), COR = base().gerador().COR;
    if (D) { D.poligono(ctx, P, { cor: COR.texto, espessura: 1.2 }); return; }
    for (var i = 0; i < P.length; i++) {
      var A = P[i], Bp = P[(i + 1) % P.length];
      ctx.doc.linha(A.x, A.y, Bp.x, Bp.y, COR.texto, 1.2);
      ctx.anota('traco', { x1: A.x, y1: A.y, x2: Bp.x, y2: Bp.y, espessura: 1.2, papel: 'contorno' });
    }
  }

  /* ============================================================ arco de angulo */

  function desenharAngulos(ctx, geo, B, P, porVertice, ehIncognita, nomes, d, fora, deduzido, op) {
    var COR = B.gerador().COR;
    var n = P.length;
    op = op || {};

    for (var v = 0; v < n; v++) {
      var bruto = porVertice[v];

      /* Camada de resposta num vertice que o enunciado deixou EM BRANCO. E o caso
       * do paralelogramo com um angulo dado: o enunciado marca so o 65, porque
       * descobrir qual dos outros e o oposto e qual e o consecutivo e a questao
       * inteira, e a resposta "115, 65 e 115" e ambigua em texto porque nao diz
       * qual e qual. Aqui ela sai onde e medida, e a figura do gabarito passa a
       * ser a do enunciado MAIS a resposta, em vez de a mesma figura de novo.
       *
       * E ela sai COM ARCO, pela mesma obrigacao da camada de enunciado. Escrito
       * solto na bissetriz, como estava, o valor nao dizia a qual angulo pertencia:
       * medido no gabarito do exercicio 10, os tres numeros da resposta ("115",
       * "65" e "115") sairam a 154,53, 208,69 e 79,24 pt do unico arco da figura,
       * e no do exercicio 18 o "60" e o "120" da resposta sairam a 73,79 e 69,01
       * pt. Um numero perto de um vertice pode ser o angulo interno, o externo ou
       * o do triangulo da diagonal, e o teto de marcas nao muda com a troca: o
       * marcaAngulo anota UM item, o valor, exatamente como o escrever anotava. */
      if ((bruto === null || bruto === undefined) && d.fase === 'gabarito' && !fora && deduzido[v]) {
        var Vg = P[v], G1 = P[(v + 1) % n], G2 = P[(v + n - 1) % n];
        var med = geo.anguloEm(Vg, G1, G2);
        var Mg = marcas();
        /* Angulo reto continua sendo o quadradinho tambem na resposta: "90°"
         * escrito ao lado de um quadradinho e a redundancia que a especificacao
         * proibe. Nos tipos que ja marcam os quatro cantos (retangulo, quadrado) a
         * resposta ja esta desenhada no enunciado, e repetir o quadradinho por
         * cima seria a mesma marca duas vezes no mesmo canto. */
        if (Math.abs(med - 90) < 0.5) {
          if (Mg && !op.retosProntos) {
            Mg.marcaAnguloReto(ctx.doc, Vg, G1, G2, { cor: COR.teal, ctx: ctx });
          }
          continue;
        }
        if (Mg) {
          Mg.marcaAngulo(ctx.doc, Vg, G1, G2, {
            rotulo: arredondar(med) + '°', tam: TAM_DADO,
            cor: COR.teal, corRotulo: COR.teal, ctx: ctx
          });
          continue;
        }
        /* Caminho de recuo, sem o marcas.js: valor sem arco ainda e melhor do que
         * gabarito sem resposta. */
        var bisV = geo.bissetriz(Vg, G1, G2);
        escrever(ctx, arredondar(med) + '°', Vg, bisV, 17,
          { tam: TAM_DADO, bold: true, cor: COR.teal });
        continue;
      }
      if (bruto === null || bruto === undefined) continue;

      var V = P[v], A1 = P[(v + 1) % n], A2 = P[(v + n - 1) % n];
      var abertura = geo.anguloEm(V, A1, A2);
      var texto = rotuloDeAngulo(bruto, B);
      var res = null;
      var M = marcas();
      /* Valor DECLARADO na diretiva numa figura que nasceu no gabarito. Ele
       * tambem e resposta: nao ha folha de exercicio com essa figura, entao o
       * valor nao foi lido antes em lugar nenhum. E o caso do exercicio 11 (os
       * angulos 30, 60 e 90 achados pela aluna) e do 18 (o losango de 60 e 120 que
       * e o contraexamplo pedido). Ver a secao "codigo de cor do gabarito". O arco
       * vai junto, porque nessas figuras o arco tambem e acrescimo: no gabarito
       * rechamado pelo id o arco ja esta impresso no enunciado e continua preto,
       * com so o valor mudando de cor. */
      var corDaResposta = op.corDeclarada || null;

      /* Camada de resposta na INCOGNITA. Ela sai colada ao proprio x, no rotulo
       * do arco que ja marca aquele angulo, e nao como um segundo numero
       * empurrado mais para fora na mesma direcao, que era como estava. Tres
       * coisas medidas obrigaram a troca, e as tres vem da mesma causa, o valor
       * ser um item solto:
       *
       *   1. Ele caia FORA do alcance do arco que responde. Medido: 26,51 pt no
       *      "67°" do gabarito de "angulo=52 angulo=61 incognita=C", 22,34 pt em
       *      cada um dos dois "70°" do isosceles com duas incognitas e 27,90 pt
       *      no valor do vertice pedido de um triangulo com angulo externo,
       *      contra os 12 pt mais meia largura do rotulo que a trava aceita.
       *      Numero solto perto de um vertice nao diz se e o interno, o externo
       *      ou o do triangulo da diagonal.
       *   2. Empurrado para fora, ele chegava mais perto do arco do VIZINHO: no
       *      gabarito de "angulo=38 angulo=104 incognita=C giro=22" o "38°" da
       *      resposta ficou a 12,13 pt do arco de 104 graus, e a folha passou a
       *      afirmar que um arco de 104 mede 38.
       *   3. Ele dobrava a contagem de itens do vertice. No isosceles com duas
       *      incognitas o gabarito somava seis itens (40, x, 70, x, 70) e
       *      estourava o teto de cinco por causa da notacao, e nao do conteudo.
       *
       * Escrito "x = 67°" o valor e UM item, esta dentro da cunha do proprio arco
       * por construcao (quem posiciona e o marcaAngulo) e diz de que x ele e a
       * resposta. A diferenca entre a folha do enunciado e a do gabarito continua
       * codificada duas vezes: a cor teal e o proprio texto a mais.
       *
       * Medir na figura, e nao numa conta paralela, e o que garante que o
       * gabarito nunca escreve um valor que o desenho nao mostra. Mas so vale
       * quando a abertura foi DEDUZIDA dos dados: o caminho de recuo serve para
       * desenhar o formato e nao pode virar resposta, senao "angulo=52
       * incognita=C" escreve 64 graus, que veio de (180-52)/2, na folha que a
       * professora usa para corrigir. */
      if (ehIncognita[v] && d.fase === 'gabarito' && !fora) {
        if (deduzido[v]) {
          texto = texto + ' = ' + arredondar(abertura) + '°';
          corDaResposta = COR.teal;
        } else {
          ctx.anota('aviso', 'o gabarito nao tem resposta para ' +
            nomeDoVertice(nomes, v) + ': os dados nao determinam esse angulo');
        }
      }

      if (M) {
        /* Angulo reto e o quadradinho, nunca arco e nunca o texto 90 graus,
         * mesmo quando o valor 90 vem escrito na diretiva: arco com 90 ao lado
         * faz a aluna ler mais um dado numerico entre os outros e perder a
         * distincao entre o que a figura DA e o que ela tem que calcular. A
         * excecao e a incognita: ali o vertice medir 90 e consequencia dos
         * outros dados e e justamente o que ela tem que descobrir, entao o
         * quadradinho entregaria a resposta e ainda contradiria o x ao lado. */
        if (!ehIncognita[v] && B.ehNumero(bruto) &&
            Math.abs(parseFloat(bruto) - 90) < 0.5 && Math.abs(abertura - 90) < 1.5) {
          /* O quadradinho ocupa o lugar do "90°" escrito, entao ele carrega o
           * codigo de cor pelo valor que substitui: no gabarito do exercicio 11 o
           * angulo reto e parte da resposta tanto quanto o 30 e o 60. */
          res = M.marcaAnguloReto(ctx.doc, V, A1, A2,
            { ctx: ctx, cor: op.corDeclarada || undefined });
        } else {
          res = M.marcaAngulo(ctx.doc, V, A1, A2, {
            rotulo: texto, tam: TAM_DADO, ctx: ctx,
            cor: op.corDeclarada || undefined, corRotulo: corDaResposta
          });
        }
      }

      /* Caminho de recuo, para o valor nunca sumir da folha. Valor escrito na
       * diretiva que nao chega na folha e SEMPRE erro de quem escreveu o tema, e
       * o marcaAngulo devolve null em dois casos legitimos: o vertice em que nao
       * cabe arco nenhum, e o marcas.js ausente no navegador. Nesses o numero
       * volta a sair sozinho na bissetriz, que e pior que o arco mas nao e
       * silencio. */
      if (!res || (res.tipo !== 'anguloReto' && !res.rotulo)) {
        var bis = geo.bissetriz(V, A1, A2);
        escrever(ctx, texto, V, bis, 16,
          { tam: TAM_DADO, cor: corDaResposta || undefined, bold: !!corDaResposta });
      }
    }
  }

  /* O foraDaCaixa(), que pousava a resposta do gabarito logo depois da caixa do x
   * do enunciado, saiu daqui junto com o segundo rotulo que ele posicionava: a
   * resposta agora entra no proprio rotulo do arco ("x = 67°") e quem a posiciona
   * e o marcaAngulo, que ja resolve cunha estreita, fio de chamada e colisao. O
   * defeito que a funcao carregava esta medido no comentario do desenharAngulos:
   * empurrado para fora, o valor saia a 22,34, 26,51 e 27,90 pt do arco que
   * responde, e no caso do 38 girado chegou mais perto do arco de 104 do que do
   * seu proprio. */

  /* Com que abertura os dois primeiros vertices sao construidos, a partir do que
   * se sabe. Devolve tambem o aviso de soma: tres angulos numericos que nao somam
   * 180 sao erro de quem escreveu o tema, e a figura sairia impossivel sem
   * ninguem ver. */
  function aberturas(conhecidos, simetria) {
    var a = conhecidos[0], b = conhecidos[1], c = conhecidos[2];
    var escritos = [];
    for (var i = 0; i < 3; i++) if (conhecidos[i] !== null) escritos.push(conhecidos[i]);

    /* Quais vertices tem valor DEDUZIDO dos dados, e nao chutado pelo caminho de
     * recuo. Com dois angulos conhecidos o terceiro sai de 180 menos os dois; com
     * um so, a divisao abaixo e chute, salvo quando as marcas de congruencia
     * dizem que os dois que faltam sao iguais. */
    var numericos = escritos.length;
    var deduzido = [
      a !== null || numericos >= 2 || !!simetria,
      b !== null || numericos >= 2 || !!simetria,
      c !== null || numericos >= 2 || !!simetria
    ];

    /* Tres angulos numericos que nao somam 180 sao erro de quem escreveu o tema.
     * Desenhar assim mesmo produziria uma figura em que o rotulo diz uma coisa e
     * o traco diz outra, que e o pior defeito possivel: a aluna que confere com
     * transferidor conclui que o material esta errado e para de usar figura como
     * ferramenta nas questoes seguintes. */
    if (a !== null && b !== null && c !== null && Math.abs(a + b + c - 180) > 0.5) {
      return {
        a: a, b: b, impossivel: true, deduzido: deduzido,
        aviso: 'os angulos ' + escritos.join(', ') + ' somam ' + arredondar(a + b + c) + ' e nao 180'
      };
    }
    if (a === null && b !== null && c !== null) a = 180 - b - c;
    if (b === null && a !== null && c !== null) b = 180 - a - c;
    if (c === null && a !== null && b !== null) c = 180 - a - b;

    if (numericos === 1) {
      /* Um angulo so nao determina o triangulo, e a repartição do que sobra e
       * escolha do desenhador. Ela NAO pode ser meio a meio por padrao: um
       * isosceles desenhado onde ninguem pediu isosceles afirma na folha uma
       * congruencia que o enunciado nao deu, e a aluna que mede com regua conclui
       * que os dois lados sao iguais. A divisao desigual sai visivelmente
       * escalena. Meio a meio so quando as marcas de congruencia pedem, que e o
       * caso do isosceles com o apice dado. */
      var sobra = 180 - escritos[0];
      var faltam = [];
      for (var k = 0; k < 3; k++) if (conhecidos[k] === null) faltam.push(k);
      var parte = simetria ? [0.5, 0.5] : [0.46, 0.54];
      var valores = [a, b, c];
      valores[faltam[0]] = sobra * parte[0];
      valores[faltam[1]] = sobra * parte[1];
      a = valores[0]; b = valores[1];
    }
    /* Sem numero nenhum a figura e um triangulo generico: ela ainda serve para
     * mostrar formato, letra de vertice e incognita. */
    if (a === null && b === null) { a = 58; b = 62; }
    if (a === null) a = 180 - b - (c === null ? 60 : c);
    if (b === null) b = 180 - a - (c === null ? 60 : c);

    if (!(a > 0) || !(b > 0) || a + b >= 180) {
      return {
        a: a, b: b, impossivel: true, deduzido: deduzido,
        aviso: 'os angulos ' + escritos.join(', ') + ' nao fecham um triangulo'
      };
    }
    return { a: a, b: b, aviso: null, deduzido: deduzido, simetria: simetria || null };
  }

  /* Gira a figura ate o segmento P[i]P[j] ficar na horizontal, com o resto da
   * figura POR CIMA dele. E a posicao prototipica: um poligono apoiado num lado e
   * nao equilibrado num bico. Gira a lista de pontos antes de desenhar, e nunca
   * por cm no PDF, senao a espessura das linhas escalaria junto e os rotulos
   * deitariam com a figura. */
  function assentarSobre(geo, pontos, i, j) {
    var A = pontos[i], Bp = pontos[j];
    var ang = Math.atan2(Bp.y - A.y, Bp.x - A.x) * 180 / Math.PI;
    var girado = geo.girar(pontos, -ang);
    var apoio = (girado[i].y + girado[j].y) / 2;
    var acima = 0;
    for (var k = 0; k < girado.length; k++) acima += girado[k].y - apoio;
    if (acima < 0) girado = geo.girar(girado, 180);
    return girado;
  }

  /* Cruza o que esta ESCRITO na diretiva com o que a construcao produziu.
   * Devolve o motivo da briga, ou null quando os dois contam a mesma historia.
   *
   * O angulo e absoluto e vai comparado direto, com a mesma tolerancia de 0,5
   * grau da soma. O lado e comparado por PROPORCAO, porque o enquadramento decide
   * o tamanho na folha: dois lados rotulados 6 e 8 tem que sair com a mesma razao
   * no desenho, e um lado sozinho nunca briga com ninguem. */
  function conferirRotulos(geo, B, pontos, porVertice, ladosBrutos, externos, congruentes, nomes) {
    var v, n = pontos.length;
    for (v = 0; v < n; v++) {
      if (!B.ehNumero(porVertice[v])) continue;
      var escrito = parseFloat(porVertice[v]);
      var medido = geo.anguloEm(pontos[v], pontos[(v + 1) % n], pontos[(v + n - 1) % n]);
      if (Math.abs(medido - escrito) > 0.5) {
        return 'o angulo escrito ' + porVertice[v] + ' esta num vertice que mede ' +
          arredondar(medido) + ' no desenho';
      }
    }
    for (var e = 0; e < (externos || []).length; e++) {
      if (externos[e].bruto === null || !B.ehNumero(externos[e].bruto)) continue;
      var iv = externos[e].i;
      var interno = geo.anguloEm(pontos[iv], pontos[(iv + 1) % n], pontos[(iv + n - 1) % n]);
      if (Math.abs(180 - interno - parseFloat(externos[e].bruto)) > 0.5) {
        return 'o angulo externo ' + externos[e].bruto + ' esta num vertice cujo suplementar mede ' +
          arredondar(180 - interno) + ' no desenho';
      }
    }
    var lados = [];
    for (var s = 0; s < n; s++) lados.push(geo.distancia(pontos[(s + 1) % n], pontos[(s + n - 1) % n]));
    if (n !== 3) {
      lados = [];
      for (var s2 = 0; s2 < n; s2++) lados.push(geo.distancia(pontos[s2], pontos[(s2 + 1) % n]));
    }
    /* Marca de congruencia e afirmacao sobre a figura, igual ao numero: marcados
     * como iguais dois lados que o desenho traz diferentes, a folha mente na
     * notacao em vez de mentir no numero, e o estrago e o mesmo. */
    for (var gi = 0; gi < (congruentes || []).length; gi++) {
      var grupo = congruentes[gi];
      for (var k = 1; k < grupo.length; k++) {
        var l0 = lados[grupo[0]], lk = lados[grupo[k]];
        if (Math.abs(l0 - lk) > 0.01 * Math.max(l0, lk)) {
          return 'os lados marcados como congruentes saem com comprimentos diferentes no desenho';
        }
      }
    }
    var ref = null;
    for (var s3 = 0; s3 < ladosBrutos.length && s3 < n; s3++) {
      if (!B.ehNumero(ladosBrutos[s3])) continue;
      var val = parseFloat(ladosBrutos[s3]);
      if (!(val > 0)) return 'lado que nao e comprimento: ' + ladosBrutos[s3];
      var comp = lados[s3];
      if (ref === null) { ref = { val: val, comp: comp }; continue; }
      var esperado = ref.comp / ref.val * val;
      if (Math.abs(comp - esperado) > 0.01 * Math.max(comp, esperado)) {
        return 'os lados ' + ref.val + ' e ' + val + ' nao saem nessa proporcao no desenho' +
          ' (dois lados soltos nao definem triangulo)';
      }
    }
    return null;
  }

  /* ============================================================ o triangulo que nao existe
   *
   * Os dois lados menores saem deitados em fila sobre o maior, alinhados a
   * esquerda: e a unica forma em que a desigualdade se ve em vez de se decorar,
   * porque 4 mais 7 termina antes de 12 e a sobra fica na folha.
   *
   * A AMARRACAO ENTRE AS DUAS REGUAS era a linha mais fraca da folha inteira, e
   * era a linha que carrega a resposta. Medido no fluxo de conteudo do piloto,
   * material p3 e ingles p3: duas verticais de 0,60 pt em #6B7280, contraste
   * 4,83:1, padrao tracejado [1 2] e 60,00 pt de comprimento cada. Um [1 2]
   * deposita um terco da tinta pelo mesmo caminho, entao na segunda geracao de
   * fotocopia a ligacao entre o vao e a base de 12 some, e a figura para de
   * explicar exatamente o que ela existe para explicar. O
   * _prova_desenho_auditor.js ja acusava as tres ocorrencias pela regra R3.
   *
   * Elas sairam. Quem amarra agora e a propria LINHA DE CHAMADA da cota, pelo
   * op.desde do desenho.js: a chamada nasce na aresta de referencia (a base do
   * lado maior), passa pelo ponto medido e vai ate depois da linha de cota, num
   * traco so, 0,60 pt continuo na tinta do contorno, 17,08:1. Deixa de ser guia
   * solta e passa a ser o que ela e no desenho tecnico, a chamada da propria cota,
   * e a hierarquia da figura fica com os tres niveis na ordem certa: contorno
   * 1,20, linha de cota 0,90, chamada 0,60.
   *
   * No degenerado exato nao ha cota (o vao e zero), e ali a amarracao continua
   * sendo desenhada aqui, mas com a mesma tinta e o mesmo peso da chamada: 0,60 pt
   * continuo em COR.texto. Ela e a unica coisa que mostra que as duas reguas de
   * cima terminam EXATAMENTE onde a de baixo termina, que e a resposta daquele
   * caso, e nao pode ser o traco mais apagado da figura. */
  function desenharVao(doc, B, g, d, op, tres, brutos, fora, corGab) {
    var COR = g.COR, D = desenho();
    var L = tres[0], m1 = tres[1], m2 = tres[2];
    /* O degenerado exato (5, 5 e 10; 8, 8 e 16) e didaticamente OUTRO caso. A
     * figura inteira existe para mostrar que a soma dos menores nao alcanca o
     * maior, e ali ela mostra que alcanca exatamente: as duas reguas cobrem a de
     * baixo de ponta a ponta, vao zero, e as duas guias tracejadas caem no mesmo
     * x. Sem dizer o que aconteceu ali, o desenho confirma o contrario da
     * resposta, e por isso a glosa e obrigatoria neste caso.
     *
     * A glosa vem da DIRETIVA e nao daqui: ela e uma frase, e frase escrita
     * dentro do desenhador quebra a folha em ingles em silencio. */
    var exato = Math.abs(m1 + m2 - L) <= 1e-9 * Math.max(L, 1);
    if (exato && !d.legenda) {
      B.avisar(doc, 'triangulo: o caso degenerado exato (' + brutos.join(', ') +
        ') precisa de legenda= na diretiva dizendo que os tres vertices ficam alinhados');
    }
    /* A distancia entre as duas reguas e curta de proposito. Na primeira prova
     * impressa ela era 0,30 do lado maior e as duas barras liam como duas coisas
     * sem relacao, no meio de meia folha vazia: a comparacao que a questao pede
     * so acontece quando uma esta logo acima da outra. */
    var alto = L * 0.14;

    return B.figura(doc, {
      x: op.x, largura: op.largura, altura: op.altura != null ? op.altura : ALTURA_VAO,
      unidades: { x0: 0, y0: 0, x1: L, y1: alto },
      legenda: d.legenda, foraDeEscala: fora,
      fase: d.fase, id: d.id, receita: 'triangulo'
    }, function (ctx) {
      var base0 = ctx.p({ x: 0, y: 0 }), base1 = ctx.p({ x: L, y: 0 });
      var c0 = ctx.p({ x: 0, y: alto }), c1 = ctx.p({ x: m1, y: alto });
      var c2 = ctx.p({ x: m1 + m2, y: alto });

      ctx.contorno(function () {
        doc.linha(base0.x, base0.y, base1.x, base1.y, COR.texto, 1.2);
        doc.linha(c0.x, c0.y, c1.x, c1.y, COR.texto, 1.2);
        doc.linha(c1.x, c1.y, c2.x, c2.y, COR.texto, 1.2);
        ctx.anota('traco', { x1: base0.x, y1: base0.y, x2: base1.x, y2: base1.y, espessura: 1.2, papel: 'contorno' });
        ctx.anota('traco', { x1: c0.x, y1: c0.y, x2: c1.x, y2: c1.y, espessura: 1.2, papel: 'contorno' });
        ctx.anota('traco', { x1: c1.x, y1: c1.y, x2: c2.x, y2: c2.y, espessura: 1.2, papel: 'contorno' });
        /* Tacos de extremo nas duas reguas: sem eles os dois lados menores leem
         * como um segmento so, e o extremo direito do maior nao se ve. */
        [c0, c1, c2, base0, base1].forEach(function (p) {
          doc.linha(p.x, p.y - 3.5, p.x, p.y + 3.5, COR.texto, 0.9);
        });
      });

      /* O vao aberto sem cota mostrava que sobra pedaco, mas nao dizia QUANTO, e
       * o quanto e a resposta da questao (4 mais 7 da 11 contra 12, entao falta
       * 1). Medida que nao se refere a um lado desenhado vai em cota e nunca
       * escrita sobre o traco, e este vao nao e lado de ninguem.
       *
       * No degenerado exato o vao e zero: cotar zero seria desenhar duas cabecas
       * de seta em cima do mesmo ponto, e quem diz o que aconteceu e a legenda. */
      if (!exato && D) {
        ctx.marcas(function () {
          var fim = ctx.p({ x: L, y: alto });
          /* O 'fora' recebe um ponto de DENTRO da figura e a cota sai pelo lado
           * contrario: assim ela sobe para o vazio acima das reguas sem depender
           * de a figura estar em pe ou girada. O 'desde' recebe a aresta de
           * REFERENCIA, a base do lado maior, e e ela que faz a chamada da cota
           * descer os 60 pt ate a regua de baixo num traco continuo, no lugar das
           * duas guias tracejadas que sairam daqui. */
          D.cota(ctx, c2, fim, arredondar(L - m1 - m2), {
            fora: { x: (base0.x + base1.x) / 2, y: base0.y },
            desde: base0, afastamento: 11, tam: TAM_DADO
          });
        });
      } else {
        ctx.marcas(function () {
          /* Duas situacoes caem aqui, e as duas pedem a mesma vertical.
           *
           * O degenerado exato, que nao tem cota porque o vao e zero: as duas
           * reguas de cima terminam no mesmo x em que a de baixo termina, e sem
           * esta vertical o encontro dos dois extremos nao se ve, que e a resposta
           * daquele caso.
           *
           * E o caminho de recuo sem o desenho.js, em que nao ha cota nenhuma: ali
           * a vertical e a unica coisa que ainda liga as duas reguas, e figura com
           * amarracao fraca ainda e melhor do que figura sem amarracao.
           *
           * Nos dois a linha sai com a tinta e o peso da linha de chamada da cota
           * do outro ramo, 0,60 pt continuo em COR.texto, para os dois casos da
           * mesma figura nao serem desenhados com dois vocabularios diferentes. */
          function amarrar(x) {
            if (D) {
              D.poligono(ctx, [{ x: x, y: base0.y }, { x: x, y: c2.y + 3.5 }],
                { fechado: false, cor: COR.texto, espessura: 0.6, papel: 'chamada' });
            } else {
              doc.linha(x, base0.y, x, c2.y + 3.5, COR.texto, 0.6);
            }
          }
          amarrar(c2.x);
          if (!exato) amarrar(base1.x);
        });
      }

      ctx.rotulos(function () {
        var cima = { x: 0, y: 1 }, baixo = { x: 0, y: -1 };
        var tinta = { tam: TAM_DADO, cor: corGab || undefined };
        escrever(ctx, String(maiorBruto(brutos)), { x: (base0.x + base1.x) / 2, y: base0.y }, baixo, 5, tinta);
        escrever(ctx, String(m1), { x: (c0.x + c1.x) / 2, y: c0.y }, cima, 5, tinta);
        escrever(ctx, String(m2), { x: (c1.x + c2.x) / 2, y: c1.y }, cima, 5, tinta);
      });
    });
  }

  function maiorBruto(brutos) {
    var maior = null;
    for (var i = 0; i < brutos.length; i++) {
      var n = parseFloat(brutos[i]);
      if (!isFinite(n)) continue;
      if (maior === null || n > parseFloat(maior)) maior = brutos[i];
    }
    return maior === null ? brutos[0] : maior;
  }

  /* ============================================================ quadrilatero
   *
   * A familia inteira numa receita so, porque ela E uma familia: cada figura e a
   * anterior com uma condicao a mais, e sao as MARCAS que dizem qual condicao.
   * Por isso a notacao sai automatica do tipo e nao precisa ser escrita a mao:
   * paralelogramo ganha as duas setas de paralelismo, losango ganha os quatro
   * tracinhos, retangulo ganha os quadradinhos, quadrado ganha os dois. Escrita a
   * mao, ela seria esquecida justamente na figura em que a condicao importa.
   *
   * A volta e sempre A, B, C, D no sentido anti-horario, com AB na base. Os lados
   * chamam-se a (AB), b (BC), c (CD) e d (DA), na mesma ordem da volta, e nao
   * "oposto ao vertice" como no triangulo: num quadrilatero nao ha lado oposto a
   * vertice, e inventar uma segunda convencao daria dois nomes ao mesmo lado. */

  var PROTOTIPOS = {
    quadrilatero: function () { return [pt(0, 0), pt(118, 8), pt(96, 76), pt(14, 60)]; },
    /* O trapezio generico e ESCALENO de proposito, e as duas pernas tem que sair
     * visivelmente diferentes. Desenhado simetrico, como estava (pernas de 67,2 e
     * 68,0, angulos da base de 67,2 e 65,7 graus, diferenca de 1,5 grau que
     * ninguem ve), ele contradiz a definicao escrita ao lado dele, "pelo menos um
     * par de lados paralelos": a aluna guarda o prototipo simetrico como se a
     * simetria fizesse parte da definicao, que e o erro classico desta serie, e
     * depois nao reconhece como trapezio o que nao for isosceles. Pior no painel
     * da familia, onde o trapezio generico e o trapezio isosceles do exercicio 12
     * sairiam com o MESMO formato e a diferenca entre os dois viraria so os
     * tracinhos das pernas.
     *
     * Os dois angulos da base saem separados por 24 graus. Nenhum dos dois chega
     * perto de 90, senao a figura viraria o outro caso particular, o trapezio
     * retangulo, e o prototipo ensinaria outro preconceito no lugar do primeiro.
     * A altura sai dos dois angulos, e nao fixa, para o lado de cima nunca
     * encolher ate sumir: com o recuo das duas pernas limitado a 55 por cento da
     * base, sobram 45 por cento de lado menor em qualquer inclinacao. */
    trapezio: function (a) {
      var L = 126;
      var angA = (a > 12 && a < 84) ? a : 52;
      var angB = angA + 24 < 84 ? angA + 24 : angA - 24;
      var cotA = 1 / Math.tan(angA * Math.PI / 180), cotB = 1 / Math.tan(angB * Math.PI / 180);
      var h = Math.min(0.50 * L, 0.55 * L / Math.max(cotA + cotB, 1e-6));
      return [pt(0, 0), pt(L, 0), pt(L - h * cotB, h), pt(h * cotA, h)];
    },
    trapezioisosceles: function (a) {
      /* O angulo da base maior manda no desenho, e a altura sai dele: com 72
       * graus o trapezio e alto e fechado, com 50 ele e baixo e aberto, e a aluna
       * que medir com transferidor acha o valor do enunciado. O recuo tem teto,
       * senao um angulo de 85 graus produziria uma figura tres vezes mais alta do
       * que larga e o enquadramento a encolheria ate o rotulo nao caber. */
      var L = 120, ang = (a > 5 && a < 89) ? a : 68;
      var alturaAlvo = 0.62 * L;
      var recuo = alturaAlvo / Math.tan(ang * Math.PI / 180);
      if (recuo > 0.30 * L) { recuo = 0.30 * L; alturaAlvo = recuo * Math.tan(ang * Math.PI / 180); }
      return [pt(0, 0), pt(L, 0), pt(L - recuo, alturaAlvo), pt(recuo, alturaAlvo)];
    },
    paralelogramo: function (a) {
      var L = 112, lado = 66, ang = (a > 5 && a < 175) ? a : 62;
      var t = ang * Math.PI / 180;
      return [pt(0, 0), pt(L, 0), pt(L + lado * Math.cos(t), lado * Math.sin(t)), pt(lado * Math.cos(t), lado * Math.sin(t))];
    },
    retangulo: function () { return [pt(0, 0), pt(116, 0), pt(116, 70), pt(0, 70)]; },
    losango: function (a) {
      var lado = 82, ang = (a > 5 && a < 175) ? a : 62;
      var t = ang * Math.PI / 180;
      return [pt(0, 0), pt(lado, 0), pt(lado + lado * Math.cos(t), lado * Math.sin(t)), pt(lado * Math.cos(t), lado * Math.sin(t))];
    },
    quadrado: function () { return [pt(0, 0), pt(84, 0), pt(84, 84), pt(0, 84)]; }
  };

  /* Que notacao cada tipo carrega. paralelas e uma lista de pares de lados, e
   * congruentes uma lista de grupos, os dois pelo indice do lado na volta. */
  var NOTACAO = {
    quadrilatero: { paralelas: [], congruentes: [], retos: false },
    trapezio: { paralelas: [[0, 2]], congruentes: [], retos: false },
    trapezioisosceles: { paralelas: [[0, 2]], congruentes: [[1, 3]], retos: false },
    paralelogramo: { paralelas: [[0, 2], [1, 3]], congruentes: [], retos: false },
    retangulo: { paralelas: [], congruentes: [], retos: true },
    losango: { paralelas: [], congruentes: [[0, 1, 2, 3]], retos: false },
    quadrado: { paralelas: [], congruentes: [[0, 1, 2, 3]], retos: true }
  };

  /* Como cada vertice se escreve em funcao do angulo de construcao t, que e o
   * angulo em A: ang(i) igual a s[i] vezes t mais c[i]. O s null marca o vertice
   * que o TIPO nao amarra (os dois de cima do trapezio generico, os quatro do
   * irregular), e sobre esse vertice a receita nao afirma nada.
   *
   * Esta tabela e o que permite RESOLVER em vez de chutar: com uma expressao em
   * cada vertice, cada linha vira uma equacao "a x menos s t igual a c menos b", e
   * duas equacoes independentes dao a incognita e a forma de uma vez. E o mesmo
   * intervalo que o prototipo aceita fica escrito aqui, para um t fora dele virar
   * aviso em vez de virar figura calada com o prototipo padrao no lugar.
   *
   * Retangulo e quadrado tem os quatro angulos fixos em 90: ali t nao existe, e a
   * unica coisa que a expressao pode determinar e a propria incognita. */
  var FAMILIA = {
    quadrilatero:      { s: [null, null, null, null], c: [0, 0, 0, 0], temT: false },
    trapezio:          { s: [1, null, null, -1], c: [0, 0, 0, 180], temT: true, min: 12, max: 84 },
    trapezioisosceles: { s: [1, 1, -1, -1], c: [0, 0, 180, 180], temT: true, min: 5, max: 89 },
    paralelogramo:     { s: [1, -1, 1, -1], c: [0, 180, 0, 180], temT: true, min: 5, max: 175 },
    retangulo:         { s: [0, 0, 0, 0], c: [90, 90, 90, 90], temT: false },
    losango:           { s: [1, -1, 1, -1], c: [0, 180, 0, 180], temT: true, min: 5, max: 175 },
    quadrado:          { s: [0, 0, 0, 0], c: [90, 90, 90, 90], temT: false }
  };

  /* O angulo de construcao e o valor pretendido em cada vertice, a partir do que
   * a diretiva escreveu. Devolve {t, valores, determinado} com t null quando o
   * sistema nao fecha, e ali quem constroi e o prototipo de sempre. */
  function resolverQuadrilatero(tipo, porVertice) {
    var fam = FAMILIA[tipo] || FAMILIA.quadrilatero;
    var formas = [null, null, null, null], eqs = [], letra = null, misturou = false, i;
    for (i = 0; i < 4; i++) {
      if (porVertice[i] === null || porVertice[i] === undefined) continue;
      var lin = lerLinear(porVertice[i]);
      if (!lin) continue;
      if (lin.letra) {
        if (letra !== null && letra !== lin.letra) misturou = true;
        else letra = lin.letra;
      }
      formas[i] = lin;
      if (fam.s[i] !== null) eqs.push({ i: i, a: lin.a, s: fam.s[i], rhs: fam.c[i] - lin.b });
    }
    /* Com duas letras diferentes na folha nao ha sistema numa incognita so, e as
     * equacoes que ainda valem sao as dos vertices com valor numerico. */
    if (misturou) {
      var soNumericas = [];
      for (i = 0; i < eqs.length; i++) if (Math.abs(eqs[i].a) < 1e-9) soNumericas.push(eqs[i]);
      eqs = soNumericas;
    }
    var sol = resolverSistema(eqs);
    var valores = [null, null, null, null], determinado = false;
    for (i = 0; i < 4; i++) {
      if (!formas[i]) continue;
      if (Math.abs(formas[i].a) < 1e-9) { valores[i] = formas[i].b; continue; }
      if (sol.x === null || !isFinite(sol.x)) continue;
      valores[i] = formas[i].a * sol.x + formas[i].b;
      determinado = true;
    }
    var t = sol.t;
    if (t !== null && (!isFinite(t) || !fam.temT)) t = null;
    return { t: t, valores: valores, determinado: determinado, fam: fam, x: sol.x };
  }

  /* A ORDEM, que e a regra para quando o sistema nao fecha: o vertice da
   * expressao maior tem que ser o vertice desenhado maior. Devolve quantos pares
   * saem invertidos entre o que a diretiva pretende e o que a construcao produziu.
   * Pares empatados nao contam: dois vertices com o mesmo valor podem sair em
   * qualquer ordem sem mentir. */
  function inversoesDeOrdem(geo, pontos, valores) {
    var n = pontos.length, medidos = [], i, j, ruins = 0;
    for (i = 0; i < n; i++) {
      medidos.push(geo.anguloEm(pontos[i], pontos[(i + 1) % n], pontos[(i + n - 1) % n]));
    }
    for (i = 0; i < n; i++) {
      for (j = i + 1; j < n; j++) {
        if (valores[i] === null || valores[j] === null) continue;
        if (Math.abs(valores[i] - valores[j]) <= 0.5) continue;
        if (Math.abs(medidos[i] - medidos[j]) <= 0.5) { ruins++; continue; }
        if ((valores[i] - valores[j]) * (medidos[i] - medidos[j]) < 0) ruins++;
      }
    }
    return ruins;
  }

  /* Das voltas possiveis do prototipo de forma fixa, fica a que inverte menos
   * pares. Trocar qual canto e o A nao muda a forma nem a notacao, e e a unica
   * liberdade que sobra quando o tipo nao tem angulo de construcao. O passo 2
   * existe para o trapezio: com passo 1 o par de lados paralelos deixaria de ser
   * o par [0, 2] que a notacao marca. Empate mantem a volta original. */
  function melhorVolta(geo, pontos, valores, passo) {
    var n = pontos.length;
    var ruimMelhor = inversoesDeOrdem(geo, pontos, valores);
    if (!ruimMelhor) return pontos;
    var melhor = pontos;
    for (var v = passo; v < n; v += passo) {
      var cand = [];
      for (var i = 0; i < n; i++) cand.push(pontos[(i + v) % n]);
      var ruim = inversoesDeOrdem(geo, cand, valores);
      if (ruim < ruimMelhor) { ruimMelhor = ruim; melhor = cand; }
    }
    return melhor;
  }

  function pt(x, y) { return { x: x, y: y }; }

  var quadrilatero = {
    chaves: ['tipo', 'angulo', 'lado', 'vertices', 'incognita', 'giro',
             'diagonal', 'regioes', 'marcas', 'congruentes'],
    metricas: ['angulo', 'lado'],

    medir: function (d, op) {
      var B = base();
      return {
        altura: op.altura != null ? op.altura : null,
        legenda: d.legenda || null,
        foraDeEscala: escalaFora(B, d, quadrilatero.metricas, [])
      };
    },

    desenhar: function (doc, d, op) {
      var B = base(), g = B.gerador(), geo = B.geo, COR = g.COR;
      var D = desenho(), M = marcas();

      var tipo = String(B.primeiro(d.args, 'tipo') || 'quadrilatero').toLowerCase();
      if (!PROTOTIPOS[tipo]) {
        B.avisar(doc, 'quadrilatero: tipo desconhecido "' + tipo + '" (use ' +
          Object.keys(PROTOTIPOS).join(', ') + ')');
        return null;
      }
      var angulosBrutos = B.lista(d.args, 'angulo');
      var ladosBrutos = B.lista(d.args, 'lado');
      var nomes = B.lista(d.args, 'vertices');
      var incognitas = B.lista(d.args, 'incognita');
      var giro = B.numero(d.args, 'giro') || 0;
      var semMarcas = String(B.primeiro(d.args, 'marcas') || '').toLowerCase() === 'nao';
      var fora = escalaFora(B, d, quadrilatero.metricas, []);

      var ehIncognita = [false, false, false, false];
      for (var q = 0; q < incognitas.length; q++) {
        var iq = indiceDeVertice(nomes, incognitas[q], 4);
        if (iq < 0) {
          B.avisar(doc, 'quadrilatero: incognita=' + incognitas[q] + ' nao e um dos vertices');
          return null;
        }
        ehIncognita[iq] = true;
      }
      var cabem = 4 - incognitas.length;
      if (angulosBrutos.length > cabem) {
        B.avisar(doc, 'quadrilatero: sobraram valores de angulo que nenhum vertice recebe (' +
          angulosBrutos.join(', ') + ')');
        return null;
      }

      var porVertice = [null, null, null, null];
      for (var iv = 0, prox = 0; iv < 4; iv++) {
        if (ehIncognita[iv]) { porVertice[iv] = 'x'; continue; }
        if (prox < angulosBrutos.length) porVertice[iv] = angulosBrutos[prox++];
      }

      /* O que decide a forma nao e "o primeiro numero escrito", e o SISTEMA que
       * os valores dos vertices formam com as relacoes do proprio tipo. Nos tipos
       * cuja forma depende de um angulo (paralelogramo, losango, trapezio) e ele
       * que decide a inclinacao, e por isso a figura sai fiel ao enunciado: 65
       * graus na diretiva viram 65 graus na folha e a aluna que conferir com
       * transferidor e recompensada.
       *
       * Com EXPRESSAO no lugar do numero valia a mesma exigencia e ela nao estava
       * sendo cumprida. O exercicio 15 do MAT07-12 escreve 3x+10 e 2x+20 em
       * vertices consecutivos de um paralelogramo: o sistema fecha em x igual a
       * 30, a resposta e 100 no vertice do 3x+10 e 80 no do 2x+20, e a figura
       * saia com 62 e 118, ou seja, com o agudo exatamente onde a resposta e
       * obtusa. Resolvido o sistema, a construcao usa os valores achados e a
       * legenda de fora de escala continua onde estava: ela cobre a imprecisao do
       * desenho, nunca a inversao. */
      var fam = FAMILIA[tipo];
      if (!fam) {
        /* Tipo novo no PROTOTIPOS e esquecido aqui: sem a linha da familia a
         * receita nao sabe que angulo cada vertice carrega e resolveria a
         * expressao contra uma relacao que nao existe. */
        B.avisar(doc, 'quadrilatero: o tipo "' + tipo + '" nao tem linha na tabela FAMILIA');
        return null;
      }
      var res = resolverQuadrilatero(tipo, porVertice);
      var pontos;
      if (res.t !== null) {
        if (!(res.t > fam.min) || !(res.t < fam.max)) {
          B.avisar(doc, 'quadrilatero: os valores escritos determinam ' + arredondar(res.t) +
            ' graus no primeiro vertice, e o ' + tipo + ' so se desenha entre ' +
            fam.min + ' e ' + fam.max + ' graus');
          return null;
        }
        pontos = PROTOTIPOS[tipo](res.t);
      } else {
        /* Sistema indeterminado: fica o prototipo do tipo, e a unica liberdade
         * que sobra e a ORIENTACAO. Ela vai escolhida pela ordem: o vertice do
         * valor maior tem que ser o vertice desenhado maior. */
        pontos = PROTOTIPOS[tipo](null);
        if (fam.temT) {
          var t0 = geo.anguloEm(pontos[0], pontos[1], pontos[3]);
          var alt = 180 - t0;
          if (inversoesDeOrdem(geo, pontos, res.valores) > 0 && alt > fam.min && alt < fam.max) {
            var outro = PROTOTIPOS[tipo](alt);
            if (inversoesDeOrdem(geo, outro, res.valores) < inversoesDeOrdem(geo, pontos, res.valores)) {
              pontos = outro;
            }
          }
        } else {
          pontos = melhorVolta(geo, pontos, res.valores, 1);
        }
      }

      /* As duas travas contra a figura invertida, na ordem da mais forte para a
       * mais fraca. A primeira so vale onde o tipo AMARRA o vertice: no
       * quadrilatero irregular o prototipo nao tem como valer 4 angulos dados, e
       * cobrar isso dele seria apagar a figura toda vez. */
      var im;
      if (fam.temT) {
        for (im = 0; im < 4; im++) {
          if (res.valores[im] === null || fam.s[im] === null) continue;
          var medido = geo.anguloEm(pontos[im], pontos[(im + 1) % 4], pontos[(im + 3) % 4]);
          if (Math.abs(medido - res.valores[im]) > 0.5) {
            B.avisar(doc, 'quadrilatero: o vertice de "' + porVertice[im] + '" vale ' +
              arredondar(res.valores[im]) + ' e saiu desenhado com ' + arredondar(medido));
            return null;
          }
        }
      }
      if (inversoesDeOrdem(geo, pontos, res.valores) > 0) {
        B.avisar(doc, 'quadrilatero: os valores escritos (' + porVertice.join(', ') +
          ') saem em ordem invertida no desenho, e desenhar invertido e pior do que nao desenhar');
        return null;
      }

      var notacao = NOTACAO[tipo];
      var congruentes = gruposDeLados(B, d, doc, 4);
      if (congruentes === null) return null;
      if (!congruentes.length) congruentes = notacao.congruentes;

      /* O que o desenho AFIRMA tem que bater com o que a diretiva ESCREVE, do
       * mesmo jeito que no triangulo: um "angulo=70" num paralelogramo construido
       * com 65 imprimiria 70 num vertice que mede 65, e a aluna que medisse
       * concluiria que o material esta errado. */
      if (d.escala !== 'fora') {
        var briga = conferirRotulos(geo, B, pontos, porVertice, ladosBrutos, [], congruentes, nomes);
        if (briga) { B.avisar(doc, 'quadrilatero: ' + briga); return null; }
      }

      if (giro) pontos = geo.girar(pontos, giro);

      /* A diagonal e o argumento da soma 360: sem ela nao ha os dois triangulos, e
       * a demonstracao por decomposicao nao existe. Ela vai CONTINUA e fina, e
       * nao tracejada, porque liga dois vertices que a figura ja tem e e ela
       * propria o objeto do exercicio. */
      var diag = pares(B, d.args, 'diagonal');
      var regioes = regioesDaDiretiva(B, d);
      var corGab = corDaCamada(doc, d, COR);

      var cx = geo.caixa(pontos);

      travaDeClone(B, doc, d, impressaoDaForma(geo, 'quadrilatero ' + tipo, pontos, []));
      if (fora) travaDaEscalaQueMente(B, doc, geo, 'quadrilatero', d, pontos, porVertice, res.valores);

      return B.figura(doc, {
        x: op.x, largura: op.largura, altura: op.altura,
        unidades: cx, legenda: d.legenda, foraDeEscala: fora,
        fase: d.fase, id: d.id, receita: 'quadrilatero'
      }, function (ctx) {
        var P = ctx.pontos(pontos);
        var ladosP = [[P[0], P[1]], [P[1], P[2]], [P[2], P[3]], [P[3], P[0]]];

        ctx.contorno(function () { contornoDe(ctx, P); });

        ctx.marcas(function () {
          if (diag.length && M) {
            var quais = [];
            for (var i = 0; i < diag.length; i++) quais.push(diag[i].join('-'));
            M.diagonais(ctx.doc, P, { quais: quais, nomes: nomes.length ? nomes : null, ctx: ctx });
          }
          if (!semMarcas) {
            marcarParalelas(ctx, notacao.paralelas, ladosP);
            marcarCongruentes(ctx, congruentes, ladosP);
            if (notacao.retos && M) {
              /* Os quatro quadradinhos sao UMA afirmacao ("os quatro angulos sao
               * retos") e por isso anotam uma marca so, pela mesma regra do grupo
               * de tracinhos. Desenhar um so bastaria para a vista, mas nao para
               * a definicao: o retangulo e o paralelogramo com QUATRO angulos
               * retos, e e essa a frase que a figura esta escrevendo. */
              for (var r = 0; r < 4; r++) {
                M.marcaAnguloReto(ctx.doc, P[r], P[(r + 1) % 4], P[(r + 3) % 4], {});
              }
              ctx.anota('marca', { tipo: 'angulosRetos', quantos: 4 });
            }
          }
          desenharAngulos(ctx, geo, B, P, porVertice, ehIncognita, nomes, d, fora,
            [true, true, true, true],
            { retosProntos: !!notacao.retos && !semMarcas, corDeclarada: corGab });
        });

        ctx.rotulos(function () {
          letrasDeVertice(ctx, P, nomes);
          for (var s = 0; s < ladosBrutos.length && s < 4; s++) {
            medidaDeLado(ctx, String(ladosBrutos[s]), ladosP[s][0], ladosP[s][1], P, corGab);
          }
          /* A glosa de cada regiao criada pela diagonal, no centro dela. E o que
           * transforma "some 2 vezes 180" numa coisa que se le no desenho, sem
           * uma linha de texto a mais. */
          if (regioes.length && diag.length) {
            var i0 = indiceDeVertice(nomes, diag[0][0], 4);
            var i1 = indiceDeVertice(nomes, diag[0].length > 1 ? diag[0][1] : '', 4);
            if (i0 >= 0 && i1 >= 0) {
              var partes = partirPelaDiagonal(P, i0, i1);
              for (var k = 0; k < partes.length && k < regioes.length; k++) {
                escrever(ctx, rotuloDeRegiao(regioes[k], B, ctx.doc), geo.centroide(partes[k]),
                  null, 0, { tam: TAM_DADO, cor: corGab || undefined });
              }
            }
          }
        });
      });
    }
  };

  /* Os dois poligonos em que a diagonal parte o quadrilatero, na volta. */
  function partirPelaDiagonal(P, i, j) {
    var n = P.length, um = [], dois = [];
    var k;
    for (k = i; ; k = (k + 1) % n) { um.push(P[k]); if (k === j) break; }
    for (k = j; ; k = (k + 1) % n) { dois.push(P[k]); if (k === i) break; }
    return [um, dois];
  }

  /* ============================================================ painel
   *
   * Varias figurinhas lado a lado com o nome de cada uma embaixo. E a figura de
   * CLASSIFICAR, e ela nao tem substituto em texto: a tabela do tema define
   * equilatero, isosceles e escaleno por escrito e a aluna nunca ve a notacao de
   * tracinhos, que e como toda prova de colegio marca lado congruente. Sem o
   * painel ela fica sem o alfabeto da geometria e nao le o enunciado da prova
   * ainda que saiba a materia.
   *
   * Cada celula e uma figura PROPRIA, com o fundo branco dela e o teto de cinco
   * marcas dela. O painel so segura o doc.y entre uma celula e a seguinte para
   * elas sairem lado a lado em vez de empilhadas, e reserva o bloco inteiro antes
   * da primeira, para a segunda linha do painel nao cair na folha seguinte.
   *
   * Uma celula e escrita como celula=<que>;<parametros>:
   *   lados;7;7;7          triangulo pelos tres lados
   *   angulos;65;70;45     triangulo pelos tres angulos
   *   paralelogramo        um dos tipos do quadrilatero, no prototipo dele
   *
   * O nome embaixo vem de nome=, um por celula, na ordem, e nunca de dentro do
   * codigo: equilatero e equilateral sao a mesma celula em duas folhas. */

  var CELULA_MIN = 92;     // celula nunca mais baixa do que isto
  var CELULA_MAX = 140;    // nem mais alta, senao um painel come a folha
  var VAO_CELULA = 8;      // ar entre duas celulas vizinhas, em pontos
  var VAO_LINHA = 10;
  var FOLGA_CELULA = 9;    // anel onde os rotulos que saem da forma cabem
  var FAIXA_NOME = 19;     // altura reservada ao nome, embaixo, em pontos

  /* A altura da celula sai da forma que vai dentro dela, e nao de uma constante.
   * Com altura fixa, o painel dos angulos (triangulos quase tao altos quanto
   * largos) saia com as figuras encolhidas pela metade e os valores dos dois
   * angulos da base encostados um no outro, enquanto o painel dos quadrilateros
   * (formas achatadas) desperdicava meia celula em branco. Aqui a celula fica com
   * a altura que a forma mais alta do painel pede para ocupar a largura toda, com
   * piso e teto. */
  function layoutDoPainel(B, d, op) {
    var g = B.gerador();
    var celulas = pares(B, d.args, 'celula');
    var colunas = Math.max(1, Math.min(6, B.numero(d.args, 'colunas') || celulas.length || 1));
    var linhas = Math.max(1, Math.ceil(celulas.length / colunas));
    var x = op.x != null ? Number(op.x) : g.MARG_E;
    var largura = op.largura != null ? Number(op.largura) : (g.MARG_D - x);
    var passo = largura / colunas;
    var larguraCelula = passo - VAO_CELULA;

    var maiorAspecto = 0.45;
    for (var i = 0; i < celulas.length; i++) {
      var forma = formaDaCelula(B, null, celulas[i]);
      if (!forma) continue;
      var u = B.geo.caixa(forma.pontos);
      if (u.largura > 1e-9) maiorAspecto = Math.max(maiorAspecto, u.altura / u.largura);
    }
    var util = Math.max(1, larguraCelula - 2 * FOLGA_CELULA);
    var alturaCelula = Math.max(CELULA_MIN,
      Math.min(CELULA_MAX, util * maiorAspecto + FAIXA_NOME + 2 * FOLGA_CELULA));

    return {
      celulas: celulas, colunas: colunas, linhas: linhas,
      x: x, largura: largura, passo: passo, larguraCelula: larguraCelula,
      alturaCelula: alturaCelula,
      altura: linhas * alturaCelula + (linhas - 1) * VAO_LINHA
    };
  }

  var painel = {
    chaves: ['celula', 'nome', 'colunas'],
    metricas: [],

    medir: function (d, op) {
      var B = base();
      return {
        altura: op.altura != null ? op.altura : layoutDoPainel(B, d, op).altura,
        legenda: d.legenda || null,
        foraDeEscala: d.escala === 'fora'
      };
    },

    desenhar: function (doc, d, op) {
      var B = base();
      var L = layoutDoPainel(B, d, op);
      var celulas = L.celulas;
      var titulos = B.valores(d.args, 'nome');
      if (!celulas.length) {
        B.avisar(doc, 'painel sem celula=, nao ha o que desenhar');
        return null;
      }
      if (titulos.length && titulos.length !== celulas.length) {
        /* Nome a menos deixa uma celula anonima no meio de um painel de
         * classificacao, que e exatamente a informacao que o painel existe para
         * dar. Nome a mais e nome que nao chega na folha. */
        B.avisar(doc, 'painel: ' + celulas.length + ' celula(s) para ' +
          titulos.length + ' nome(s)');
      }

      var colunas = L.colunas, linhas = L.linhas;
      var x = L.x, largura = L.largura, passo = L.passo, larguraCelula = L.larguraCelula;
      var ALTURA_CELULA = L.alturaCelula;

      var med = B.medidaDoBloco({
        x: x, largura: largura, altura: L.altura,
        legenda: d.legenda, foraDeEscala: d.escala === 'fora'
      });
      /* A reserva do bloco INTEIRO vem antes da primeira celula. Reservada celula
       * a celula, um painel de duas linhas no pe da folha punha a primeira linha
       * numa pagina e a segunda na outra, e um painel de classificacao partido ao
       * meio deixa de comparar, que e a unica coisa que ele faz. */
      doc.garanteEspaco(med.total);
      var yInicial = doc.y;
      var registros = [];

      for (var i = 0; i < celulas.length; i++) {
        var linha = Math.floor(i / colunas), coluna = i % colunas;
        var ultima = i === celulas.length - 1;
        doc.y = yInicial - linha * (ALTURA_CELULA + VAO_LINHA);
        /* A celula ocupa o PASSO inteiro e o ar entre uma e a vizinha sai da
         * folga, e nao de um vao sem dono. A diferenca aparece na folha: o fundo
         * branco de cada figura cobre so a largura que ela declara, entao com um
         * vao de oito pontos sem dono a marca d'agua atravessava por ali, entre
         * uma celula e a seguinte, bem no meio do painel. */
        registros.push(desenharCelula(doc, B, d, celulas[i], titulos[i] || null, {
          x: x + coluna * passo, largura: passo, altura: ALTURA_CELULA,
          /* A legenda do painel e uma so e sai na ultima celula, alinhada a
           * direita: e a borda direita do bloco, que e onde o figura() ja escreve
           * legenda. Uma legenda por celula repetiria o aviso de escala tres
           * vezes na mesma faixa. */
          legenda: ultima ? d.legenda : null,
          foraDeEscala: ultima && d.escala === 'fora'
        }));
      }

      doc.y = yInicial - linhas * ALTURA_CELULA - (linhas - 1) * VAO_LINHA
        - med.alturaLegenda - med.antes - med.depois;
      return registros[registros.length - 1] || null;
    }
  };

  /* A geometria de uma celula, sem desenhar nada e sem tocar no doc. Existe
   * separada porque o layout precisa dela ANTES de a primeira celula ser
   * desenhada, para saber que altura a linha do painel vai pedir. */
  function formaDaCelula(B, doc, spec) {
    var geo = B.geo;
    var que = String(spec[0]).toLowerCase();
    var params = spec.slice(1);

    if (que === 'lados') {
      var nums = [];
      for (var i = 0; i < 3; i++) nums.push(parseFloat(params[i]));
      var p = geo.trianguloPorLados(nums[0], nums[1], nums[2]);
      if (!p) {
        if (doc) B.avisar(doc, 'painel: celula=lados;' + params.join(';') + ' nao fecha triangulo');
        return null;
      }
      return { que: que, pontos: p, angulos: null, tipoQuad: null };
    }
    if (que === 'angulos') {
      var angulos = [parseFloat(params[0]), parseFloat(params[1]), parseFloat(params[2])];
      var pa = geo.trianguloPorAngulos(angulos[0], angulos[1], 100);
      if (!pa) {
        if (doc) B.avisar(doc, 'painel: celula=angulos;' + params.join(';') + ' nao fecha triangulo');
        return null;
      }
      return { que: que, pontos: pa, angulos: angulos, tipoQuad: null };
    }
    if (PROTOTIPOS[que]) {
      return {
        que: que, tipoQuad: que, angulos: null,
        pontos: PROTOTIPOS[que](params.length ? parseFloat(params[0]) : null)
      };
    }
    if (doc) {
      B.avisar(doc, 'painel: celula=' + spec.join(';') +
        ' nao e lados, angulos nem um tipo de quadrilatero');
    }
    return null;
  }

  function desenharCelula(doc, B, d, spec, nome, caixa) {
    var geo = B.geo, M = marcas();
    var forma = formaDaCelula(B, doc, spec);
    if (!forma) return null;
    var que = forma.que, pontos = forma.pontos;
    var tipoQuad = forma.tipoQuad, angulos = forma.angulos;

    /* O nome mora ABAIXO da figura, dentro da mesma caixa. Para abrir o lugar
     * dele, a caixa de unidades desce um pedaco por baixo da figura: como o
     * enquadramento e isotropico e centra o que recebe, a forma sobe para a parte
     * de cima da celula e a faixa de baixo fica livre.
     *
     * O tamanho desse pedaco e medido em PONTOS DA FOLHA e nao em unidades do
     * problema, e a diferenca nao e detalhe: o primeiro rascunho reservava 18
     * unidades, o que num triangulo de lados 7, 7 e 7 (seis unidades de altura)
     * pedia uma faixa TRES vezes mais alta do que a propria figura, e os tres
     * triangulos do painel sairam do tamanho de uma unha. Como a escala so e
     * conhecida depois do enquadramento e o enquadramento depende da faixa, o
     * ponto fixo sai por iteracao, que converge em duas ou tres voltas. */
    var u = geo.caixa(pontos);
    var folga = FOLGA_CELULA + VAO_CELULA / 2;
    var alvoL = Math.max(1, caixa.largura - 2 * folga);
    var alvoA = Math.max(1, caixa.altura - 2 * folga);
    var respiro = 0;
    for (var it = 0; it < 4; it++) {
      var k = Math.min(u.largura > 1e-9 ? alvoL / u.largura : Infinity,
        (u.altura + respiro) > 1e-9 ? alvoA / (u.altura + respiro) : Infinity);
      if (!isFinite(k) || k <= 0) break;
      respiro = FAIXA_NOME / k;
    }
    var unidades = { x0: u.x0, y0: u.y0 - respiro, x1: u.x1, y1: u.y1 };

    return B.figura(doc, {
      x: caixa.x, largura: caixa.largura, altura: caixa.altura, folga: folga,
      unidades: unidades, legenda: caixa.legenda, foraDeEscala: caixa.foraDeEscala,
      fase: d.fase, id: null, receita: 'painel'
    }, function (ctx) {
      var P = ctx.pontos(pontos);
      var n = P.length;
      var lados = [];
      for (var s = 0; s < n; s++) lados.push([P[s], P[(s + 1) % n]]);

      ctx.contorno(function () { contornoDe(ctx, P); });

      ctx.marcas(function () {
        if (que === 'lados') marcasPorLados(ctx, pontos, lados);
        else if (que === 'angulos') marcasPorAngulos(ctx, B, P, angulos);
        else if (tipoQuad && M) {
          var notacao = NOTACAO[tipoQuad];
          marcarParalelas(ctx, notacao.paralelas, lados);
          marcarCongruentes(ctx, notacao.congruentes, lados);
          if (notacao.retos) {
            for (var r = 0; r < 4; r++) {
              M.marcaAnguloReto(ctx.doc, P[r], P[(r + 1) % 4], P[(r + 3) % 4], {});
            }
            ctx.anota('marca', { tipo: 'angulosRetos', quantos: 4 });
          }
        }
      });

      ctx.rotulos(function () {
        if (!nome) return;
        /* Os nomes das celulas ficam todos na MESMA linha de base, medida a
         * partir do pe da celula e nao da figura que esta dentro dela. Ancorado
         * na figura, cada nome saia numa altura diferente, porque o
         * enquadramento centra formas de proporcoes diferentes em pontos
         * diferentes: os tres nomes do painel dos lados saiam em tres alturas e o
         * painel deixava de ler como uma linha de coisas comparaveis. */
        var meio = {
          x: ctx.caixa.x + ctx.caixa.largura / 2,
          y: ctx.caixa.y + FAIXA_NOME * 0.42
        };
        escrever(ctx, String(nome), meio, null, 0, { tam: TAM_NOME });
      });
    });
  }

  /* Painel dos lados: quem tem a mesma medida recebe a mesma marca.
   *
   * Duas regras, e a segunda e a que se esquece. Havendo lados congruentes, so
   * eles sao marcados: no isosceles de 7, 7 e 10, marcar tambem a base com dois
   * tracinhos gasta uma marca para dizer o que ja se ve, que a base e outra
   * coisa. Nao havendo nenhum par congruente, TODOS recebem marcas diferentes,
   * porque essa e a outra metade da mesma convencao: marcas diferentes
   * significam medidas diferentes. Sem isso o escaleno seria a unica celula do
   * painel sem notacao nenhuma e a aluna leria "escaleno" como "o triangulo em
   * que ninguem marcou nada". */
  function marcasPorLados(ctx, pontos, lados) {
    var geo = base().geo;
    var n = pontos.length;
    var comp = [];
    for (var s = 0; s < n; s++) comp.push(geo.distancia(pontos[(s + 1) % n], pontos[(s + 2) % n]));
    var grupos = [];
    for (var i = 0; i < n; i++) {
      var achou = false;
      for (var gj = 0; gj < grupos.length; gj++) {
        if (Math.abs(comp[grupos[gj][0]] - comp[i]) <= 1e-6 * Math.max(comp[i], 1)) {
          grupos[gj].push(i); achou = true; break;
        }
      }
      if (!achou) grupos.push([i]);
    }
    var temPar = false;
    for (var gk = 0; gk < grupos.length; gk++) if (grupos[gk].length > 1) temPar = true;
    if (temPar) {
      var soOsPares = [];
      for (var gm = 0; gm < grupos.length; gm++) if (grupos[gm].length > 1) soOsPares.push(grupos[gm]);
      grupos = soOsPares;
    }
    /* Os lados do triangulo na convencao brasileira: a = BC, b = CA, c = AB, ou
     * seja o lado de indice s liga os vertices s+1 e s+2. */
    var segmentos = [];
    for (var k = 0; k < n; k++) segmentos.push([lados[(k + 1) % n][0], lados[(k + 1) % n][1]]);
    marcarCongruentes(ctx, grupos, segmentos);
  }

  /* Painel dos angulos: a celula marca o que DEFINE a classe, e so isso. No
   * acutangulo os tres valores, porque a classe fala dos tres; no retangulo o
   * quadradinho sozinho, porque a classe fala de um angulo so; no obtusangulo o
   * valor do obtuso. Marcar os tres em toda celula encheria o retangulo e o
   * obtusangulo de numeros que nao dizem nada sobre a classificacao deles.
   *
   * Arco vazio esta proibido aqui de proposito: arco sem valor e a notacao de
   * congruencia, e tres arcos vazios num triangulo de 65, 70 e 45 diriam que os
   * tres angulos sao iguais. */
  function marcasPorAngulos(ctx, B, P, angulos) {
    var M = marcas();
    if (!M) return;
    var especial = -1;
    for (var i = 0; i < 3; i++) if (angulos[i] >= 89.5) especial = i;
    for (var v = 0; v < 3; v++) {
      if (especial >= 0 && v !== especial) continue;
      if (Math.abs(angulos[v] - 90) < 0.5) {
        M.marcaAnguloReto(ctx.doc, P[v], P[(v + 1) % 3], P[(v + 2) % 3], { ctx: ctx });
      } else {
        M.marcaAngulo(ctx.doc, P[v], P[(v + 1) % 3], P[(v + 2) % 3],
          { rotulo: rotuloDeAngulo(String(angulos[v]), B), tam: TAM_DADO, ctx: ctx });
      }
    }
  }

  /* ============================================================ receitas de curva
   *
   * Tudo daqui para baixo e escrito em cima das primitivas de curva do
   * desenho.js (circunferencia, elipse, parabola, hiperbole, eixos,
   * poligonoRegular, cotaRadial) e das marcas do marcas.js (marcaAngulo,
   * marcaAnguloReto, marcaLado, hachurar). Nenhuma conta de Bezier mora aqui.
   *
   * Tres decisoes que valem para as seis receitas:
   *
   *   1. A primitiva devolve a geometria e a RECEITA compoe. A parabola do
   *      desenho.js nao desenha foco nem diretriz e a hiperbole nao desenha
   *      assintota nem retangulo: quem sabe quantas marcas cabem e a receita,
   *      porque e ela que sabe o que a questao pede. Cada uma dessas coisas so
   *      entra quando a diretiva a pede por chave.
   *
   *   2. A regiao marcada (hachura ou cinza chapado) sai pelo marcas.js com o
   *      DOC e nao com o ctx, entao ela NAO conta como marca ativa. A definicao
   *      escrita na especificacao e "todo elemento que o aluno precisa ler:
   *      numero, letra de vertice, arco, quadradinho, tracinho, seta de
   *      paralelismo, rotulo de regiao"; a textura de uma area nao se le um a um,
   *      e quem diz o que ela significa e a legenda, que tambem nao conta. Sem
   *      isso o alvo de tres aneis (tres raios cotados mais tres regioes) passava
   *      de cinco so pela notacao. A hachura continua obrigada a glosa: ela vem
   *      pela legenda= do tema, como o hachurar() do marcas.js ja cobra.
   *
   *   3. Rotulo de medida vem da diretiva e nunca daqui (ver lerMedida): a letra
   *      r, d, L ou a e neutra, mas quem decide entre a letra e o numero e o
   *      tema, e "r" numa folha que pede "raio" em ingles nao e da conta deste
   *      arquivo. */

  /* ------------------------------------------------------ medida com rotulo
   *
   * Uma medida tem duas metades, o numero que CONSTROI e o texto que a folha
   * IMPRIME, e as duas chegam pela mesma chave:
   *
   *   raio=5        constroi com 5 e imprime 5
   *   raio=r        imprime r; nao e numero, entao o tamanho e o padrao
   *   raio=5;r      constroi com 5 e imprime r
   *
   * Devolve {valor, rotulo, letra, explicito}: letra e verdadeiro quando o que
   * veio nao e numero, explicito quando o rotulo foi escrito depois do ponto e
   * virgula. As conicas usam o explicito para decidir se a, b e p aparecem na
   * folha: "a=5" so da a forma, "a=a" ou "a=5;5" tambem escreve. */
  function medidaDe(B, bruto) {
    var partes = String(bruto === null || bruto === undefined ? '' : bruto).split(';');
    var v = partes[0].trim();
    var r = partes.length > 1 ? partes[1].trim() : '';
    var valor = B.ehNumero(v) ? parseFloat(v) : null;
    return { bruto: v, valor: valor, rotulo: r || v, letra: valor === null, explicito: !!r };
  }
  function lerMedida(B, args, chave) {
    var brutos = B.valores(args, chave);
    return brutos.length ? medidaDe(B, brutos[0]) : null;
  }
  function lerMedidas(B, args, chave) {
    var brutos = B.valores(args, chave), saida = [];
    for (var i = 0; i < brutos.length; i++) saida.push(medidaDe(B, brutos[i]));
    return saida;
  }

  /* "sim" nunca sai impresso, entao pode viver aqui: e o valor de uma chave que
   * so liga alguma coisa (diretriz=sim, eixos=sim, decomposto=sim). Aceita
   * tambem yes e true para o tema em ingles nao precisar de portugues. */
  function ehSim(v) {
    return /^(sim|yes|true)$/i.test(String(v === null || v === undefined ? '' : v).trim());
  }

  /* Fora de escala nestas receitas so quando a figura tem NUMERO e ao mesmo
   * tempo alguma medida saiu CHUTADA: "raio=10 coroa=r" desenha a coroa com um
   * raio interno de 0,6 R que ninguem pediu, e a folha tem que dizer isso. Uma
   * figura toda em letras (raio=r diametro=d) e o prototipo generico e nao esta
   * fora de escala de nada; toda em numeros e fiel por construcao; e uma letra
   * numa medida que se DEDUZ das outras (inscrito=10 raio=r, ou o segundo
   * raio=5√2 do circunscrito) tambem nao e chute. A regra do base.js (qualquer
   * letra liga a marca) nasceu do triangulo, onde letra em lado e chute; aqui a
   * letra e o rotulo normal da explicacao. Quem sabe o que foi chutado e a
   * geometria de cada receita, e e ela que responde. escala=fora e escala=fiel
   * continuam mandando por cima. */
  function escalaDe(d, numerico, chute) {
    if (d.escala === 'fora') return true;
    if (d.escala === 'fiel') return false;
    return !!numerico && !!chute;
  }

  /* A altura do bloco sai da PROPORCAO da caixa de unidades, com piso e teto:
   * um circulo quer ser tao alto quanto largo e ganharia a folha inteira sem o
   * teto; a pista de atletismo e achatada e desperdicaria meia folha em branco
   * sem o piso. A mesma conta vale antes de desenhar (medir) e no desenho. */
  function alturaParaCaixa(B, op, unid, minimo, maximo, folga) {
    var g = B.gerador();
    var x = op.x != null ? Number(op.x) : g.MARG_E;
    var largura = op.largura != null ? Number(op.largura) : (g.MARG_D - x);
    /* A folga e a do figura() salvo quando a receita pede outra: o solido leva
     * o anel maior das composicoes, e a conta tem que ser feita com o mesmo. */
    var anel = folga != null ? Number(folga) : B.FOLGA_PADRAO;
    var util = Math.max(1, largura - 2 * anel);
    var lu = unid.x1 - unid.x0, au = unid.y1 - unid.y0;
    if (!(lu > 1e-9) || !(au > 1e-9)) return minimo;
    var alt = au * (util / lu) + 2 * anel;
    return Math.max(minimo, Math.min(maximo, Math.round(alt)));
  }

  function polar(C, r, graus) {
    var t = graus * Math.PI / 180;
    return pt(C.x + r * Math.cos(t), C.y + r * Math.sin(t));
  }

  /* Bolinha com letra, na direcao livre entre as oferecidas.
   *
   * Com op.separado a letra sai pelo rotulo() e nao pelo rotulo do proprio
   * ponto(). A trava do "cruzamento nomeado" do base.js le dois tracos que nao
   * sao contorno passando por um ponto com nome como o encontro de duas
   * cevianas, e cobra dele um arco de angulo. Ela foi escrita para o incentro
   * do exercicio 17 e acerta la; numa conica ela dispara em TODO ponto com nome,
   * porque nenhum deles e encontro de construcao e todos estao, por definicao,
   * onde dois segmentos se tocam. Medido na primeira tirada desta receita:
   *
   *   P    os dois raios focais PF1 e PF2 terminam nele: 0,00 e 0,00 pt
   *   F1   o raio focal PF1 termina nele e o semieixo a passa por ele (o foco
   *        esta sobre o eixo maior): 0,00 e 0,00 pt
   *   F    com o plano atras, o eixo x passa pelo foco (3, 0) e o tique de x
   *        igual a 3 tambem: 0,00 e 0,00 pt (o cartao "eixos parabola" da
   *        _prova_desenho_curvas e acusado por isto, com o F em (0, 1))
   *   O    no hexagono decomposto as seis diagonais nascem no centro
   *
   * Nenhum desses pontos tem angulo pedido, e um arco neles seria a marca a
   * mais que a especificacao proibe. O ponto continua anotado e a letra
   * continua contando UMA marca; o que muda e que a letra nao fica pendurada no
   * registro do ponto, que e o unico lugar onde aquela trava procura. A trava
   * fica ligada onde ela acerta, no triangulo e no quadrilatero. */
  function nomearPonto(ctx, P, nome, direcoes, op) {
    op = op || {};
    var D = desenho();
    var dirs = direcoes && direcoes.length ? direcoes : [{ x: 0.7071, y: 0.7071 }];
    if (!D) {
      if (nome) escrever(ctx, nome, P, dirs[0], 3, { tam: TAM_DADO, cor: op.cor });
      return null;
    }
    if (!nome) return D.ponto(ctx, P, { cor: op.corPonto });
    if (!op.separado) {
      return D.ponto(ctx, P, {
        rotulo: nome, direcoes: dirs, tam: TAM_DADO, cor: op.corPonto, corRotulo: op.cor
      });
    }
    var reg = D.ponto(ctx, P, { cor: op.corPonto });
    var raio = reg && reg.raio != null ? reg.raio : 2.2;
    var dir = D.direcaoLivre(ctx, nome, P, dirs, { tam: TAM_DADO, afastamento: 2.5 + raio }) || dirs[0];
    D.rotulo(ctx, nome, { x: P.x + dir.x * raio, y: P.y + dir.y * raio }, {
      direcao: dir, afastamento: 2.5, tam: TAM_DADO, cor: op.cor
    });
    return reg;
  }

  /* Regiao hachurada ou chapada pelo marcas.js, com o DOC (ver a decisao 2 no
   * cabecalho desta secao). O angulo pedido e conferido pelo proprio hachurar
   * contra os lados retos da regiao e trocado quando fica paralelo. */
  function hachurarRegiao(ctx, partes, angulo) {
    var M = marcas();
    if (!M) return null;
    return M.hachurar(ctx.doc, partes, { angulo: angulo });
  }
  function chaparRegiao(ctx, partes, cor) {
    var M = marcas();
    if (!M) return null;
    return M.hachurar(ctx.doc, partes, { estilo: 'chapado', cor: cor || undefined });
  }

  /* Segmento de construcao que CARREGA leitura (diretriz, assintota, linha de
   * centro): 0,6 pt continuo ou no padrao [2 2] da guia de leitura, na tinta do
   * contorno. Nunca [3 2] nem teal, que sao o codigo do gabarito. */
  function guia(ctx, A, Bp, tracejada, cor) {
    var D = desenho(), COR = base().gerador().COR;
    if (!D) return null;
    return D.poligono(ctx, [A, Bp], {
      fechado: false, espessura: 0.6, papel: 'guia',
      tracejado: tracejada ? D.GUIA_LEITURA : null, cor: cor || COR.texto
    });
  }

  /* O angulo central com o valor, pelo marcaAngulo do marcas.js: raio entre 12 e
   * 20 pt, rotulo na bissetriz por fora do arco, fuga de colisao. O marcaAngulo
   * se recusa acima de 179,5 graus, e o semicirculo e uma figura legitima do
   * tema (a pista, a meia pizza): ali o arco sai pelo arco() do desenho.js e o
   * valor pela direcao media, a mesma folga de 6 pt da borda do arco. Nos dois
   * caminhos o valor conta UMA marca e o arco nao conta, que e a regra do
   * valorDeAngulo la em cima. */
  function anguloCentral(ctx, C, PA, PB, de, ate, texto, op) {
    op = op || {};
    var M = marcas(), D = desenho();
    var abertura = Math.abs(ate - de);
    if (abertura < 179.5 && M) {
      var res = M.marcaAngulo(ctx.doc, C, PA, PB, {
        rotulo: texto, tam: TAM_DADO, ctx: ctx,
        cor: op.cor || undefined, corRotulo: op.corRotulo || undefined
      });
      if (res && (res.rotulo || res.tipo === 'anguloReto')) return res;
    }
    if (!D) { escrever(ctx, texto, C, polar({ x: 0, y: 0 }, 1, (de + ate) / 2), 16, { tam: TAM_DADO, cor: op.corRotulo }); return null; }
    /* Raio 16 e o valor a 8 pt da borda do arco: medido na primeira tirada, com
     * 14 e 6 o "180°" caia a 6,82 pt da letra O do centro e a trava do rotulo
     * grudado acusava. Assim o vao ate o O passa de um corpo e o valor continua
     * a 13 pt do arco dele, dentro do alcance de 12 pt mais meia largura. */
    var raio = 16;
    D.arco(ctx.doc, C, raio, raio, de, ate, { espessura: 0.9, papel: 'marca', cor: op.cor || undefined });
    var meio = polar({ x: 0, y: 0 }, 1, (de + ate) / 2);
    escrever(ctx, texto, C, meio, raio + 8, { tam: TAM_DADO, cor: op.corRotulo });
    return null;
  }

  /* ============================================================ circulo
   *
   * A familia do MAT08-13 e do MATEM3-12 numa receita so: a circunferencia com
   * o que se cota nela (raio, diametro, corda), o setor e o arco com o angulo
   * central, a coroa, o quadrado inscrito e o circunscrito, a pizza em fatias
   * iguais e o alvo de aneis concentricos.
   *
   * Tudo e construido em unidades do problema numa caixa quadrada em volta do
   * centro, e o enquadramento isotropico do figura() e o que faz o circulo sair
   * REDONDO: a caixa envolvente da circunferencia no fluxo mede 2r por 2r (a
   * _prova_receitas_circulo.js mede, com desvio abaixo de 0,5 pt).
   *
   * Chaves:
   *   raio=V[;R]         raio cotado do centro ate a circunferencia (cotaRadial)
   *   diametro=V[;R]     diametro atravessando, com a medida em cota por FORA
   *                      da circunferencia (o rotulo na propria linha pousa no
   *                      meio de MEIA corda e le como raio; ver a decisao no
   *                      geometriaDoCirculo)
   *   corda=V[;R]        corda de comprimento V (numero) ou generica, rotulada R
   *   centro=O           a letra do centro
   *   arco=G             arco de G graus destacado sobre a circunferencia, com os
   *                      dois raios e o angulo central marcado
   *   setor=G            o mesmo, com a regiao do setor hachurada
   *   coroa=V[;R]        segunda circunferencia concentrica de raio V por dentro,
   *                      a coroa hachurada, os dois raios cotados (raio= e coroa=)
   *   inscrito=L         quadrado de lado L com o circulo tocando os quatro lados
   *                      (r = L/2), os cantos hachurados, o lado rotulado L
   *   circunscrito=L     quadrado de lado L com o circulo pelos quatro vertices
   *                      (r = L raiz de 2 sobre 2); com inscrito=, o segundo raio=
   *                      cota o raio do circunscrito
   *   fatias=n           n fatias iguais pelos raios, uma hachurada, o angulo
   *                      central de uma fatia marcado (360/n)
   *   aneis=r1;r2;r3     circunferencias concentricas, o disco central chapado e
   *                      as coroas hachuradas em inclinacoes opostas, cada raio
   *                      cotado dentro do seu anel
   *   incognita=x        a letra do angulo central pedido (setor, arco, fatias)
   *   giro=G             gira a figura inteira
   *
   * O primeiro valor numerico CONSTROI: raio=5 da r igual a 5, inscrito=10 da r
   * igual a 5 tambem, e os dois juntos so passam se concordarem. */

  var circulo = {
    chaves: ['raio', 'diametro', 'corda', 'centro', 'arco', 'setor', 'coroa', 'inscrito',
             'circunscrito', 'fatias', 'aneis', 'incognita', 'giro'],
    metricas: ['raio', 'diametro', 'corda', 'coroa', 'inscrito', 'circunscrito'],

    medir: function (d, op) {
      var B = base();
      var G = geometriaDoCirculo(B, null, d);
      return {
        altura: op.altura != null ? op.altura
          : (G ? alturaParaCaixa(B, op, G.unidades, 120, G.alturaMax) : null),
        legenda: d.legenda || null,
        foraDeEscala: G ? G.fora : d.escala === 'fora'
      };
    },

    desenhar: function (doc, d, op) {
      var B = base(), g = B.gerador(), COR = g.COR, D = desenho(), M = marcas();
      var G = geometriaDoCirculo(B, doc, d);
      if (!G) return null;
      if (!D) {
        B.avisar(doc, 'circulo: o figuras/desenho.js nao carregou, e sem ele nao ha circunferencia');
        return null;
      }
      var fora = G.fora;
      var corGab = corDaCamada(doc, d, COR);
      var corValor = corGab || undefined;

      return B.figura(doc, {
        x: op.x, largura: op.largura,
        altura: op.altura != null ? op.altura : alturaParaCaixa(B, op, G.unidades, 120, G.alturaMax),
        unidades: G.unidades, legenda: d.legenda, foraDeEscala: fora,
        fase: d.fase, id: d.id, receita: 'circulo'
      }, function (ctx) {
        var k = ctx.k;
        var C = ctx.p(pt(0, 0));
        var rp = G.r * k;
        function pp(rr, graus) { return polar(C, rr * k, graus); }
        var i;

        /* ---------------------------------------------------- regioes */
        if (G.aneis) {
          ctx.preenchimento(function () { chaparRegiao(ctx, { centro: C, raio: G.aneis[0] * k }); });
        }
        ctx.hachura(function () {
          if (G.hachuraSetor) {
            hachurarRegiao(ctx, { centro: C, raio: rp, de: G.a0, ate: G.a1, setor: true }, 45);
          }
          if (G.coroa !== null) {
            hachurarRegiao(ctx, [{ centro: C, raio: rp }, { centro: C, raio: G.coroa * k }], 60);
          }
          if (G.rIn !== null) {
            hachurarRegiao(ctx, [ctx.pontos(G.quadrado), { centro: C, raio: G.rIn * k }], 45);
          }
          if (G.aneis) {
            for (i = 1; i < G.aneis.length; i++) {
              hachurarRegiao(ctx, [{ centro: C, raio: G.aneis[i] * k }, { centro: C, raio: G.aneis[i - 1] * k }],
                i % 2 === 1 ? 45 : 135);
            }
          }
        });

        /* ---------------------------------------------------- contorno */
        ctx.contorno(function () {
          if (G.quadrado) D.poligono(ctx, ctx.pontos(G.quadrado), { cor: COR.texto, espessura: 1.2 });
          for (i = 0; i < G.circunferencias.length; i++) D.circunferencia(ctx, C, G.circunferencias[i] * k, {});
          /* Os raios do setor e das fatias sao OBJETO (0,9 pt, continuos): sao
           * as linhas que a pergunta manda olhar. O raio que leva o rotulo e
           * desenhado pelo cotaRadial, na camada de marcas, para nao sair duas
           * vezes por cima de si mesmo. */
          if (G.temAngulo) {
            if (!G.raioNoSetor) D.poligono(ctx, [pp(G.r, G.a0), C], { fechado: false, espessura: 0.9, papel: 'objeto' });
            D.poligono(ctx, [C, pp(G.r, G.a1)], { fechado: false, espessura: 0.9, papel: 'objeto' });
          }
          if (G.fatias) {
            for (i = 2; i < G.fatias; i++) {
              D.poligono(ctx, [C, pp(G.r, G.a0 + i * 360 / G.fatias)], { fechado: false, espessura: 0.9, papel: 'objeto' });
            }
          }
          if (G.corda) {
            D.poligono(ctx, [pp(G.r, G.corda.de), pp(G.r, G.corda.ate)], { fechado: false, espessura: 0.9, papel: 'objeto' });
          }
          /* O diametro em pessoa. Ele e OBJETO, e por isso e desenhado aqui e
           * nao pelo cotaRadial: a medida dele sai por fora, em cota (ver a
           * decisao no geometriaDoCirculo), e o cotaRadial em estilo 'cota' nao
           * desenha a linha. Na pizza ele nao entra por aqui porque os proprios
           * cortes ja o desenham, e um segundo traco por cima do mesmo lugar
           * viraria um corte que nao divide fatia nenhuma. */
          if (G.diametroAngulo !== null) {
            D.poligono(ctx, [pp(G.r, G.diametroAngulo + 180), pp(G.r, G.diametroAngulo)],
              { fechado: false, espessura: 0.9, papel: 'objeto' });
          }
        });

        /* ---------------------------------------------------- marcas */
        ctx.marcas(function () {
          /* O arco destacado sobre a propria circunferencia, em 2,0 pt: e o que
           * amarra o angulo central ao arco que ele enxerga (convencao escrita
           * na especificacao para setor, arco e angulo central). Mesmo centro e
           * mesmo raio da circunferencia, que e o caso que o conferirFigura
           * deixou de contar como dois arcos no mesmo vertice. Sai como OBJETO,
           * nao como marca: o que se le e o valor do angulo, uma vez. */
          if (G.temAngulo) {
            D.arco(ctx, C, rp, rp, G.a0, G.a1, { espessura: 2.0, papel: 'objeto', cor: corValor });
          }
          for (i = 0; i < G.cotas.length; i++) {
            var ct = G.cotas[i];
            D.cotaRadial(ctx, C, ct.raio * k, ct.rotulo, {
              tipo: ct.tipo, angulo: ct.angulo, lado: ct.lado, em: ct.em,
              estilo: ct.fora ? 'cota' : undefined,
              afastamento: ct.fora ? rp + 10 : ct.afastamento,
              tam: TAM_DADO, corTexto: corValor
            });
          }
          if (G.temAngulo) {
            var texto = G.anguloTexto;
            var corResposta = undefined;
            if (d.fase === 'gabarito' && G.anguloLetra && G.ang !== null) {
              texto = G.anguloLetra + ' = ' + arredondar(G.ang) + '°';
              corResposta = COR.teal;
            }
            anguloCentral(ctx, C, pp(G.r, G.a0), pp(G.r, G.a1), G.a0, G.a1, texto,
              { cor: corValor, corRotulo: corResposta || corValor });
          }
          /* O quadradinho no ponto de tangencia: e o que diz que o raio chega
           * perpendicular ao lado, ou seja, que r e metade de L. So sai quando o
           * raio foi desenhado ate la. */
          if (G.tangencia && M) {
            var T = ctx.p(G.tangencia.ponto);
            M.marcaAnguloReto(ctx.doc, T, C, ctx.p(G.tangencia.aoLongo), { ctx: ctx });
          }
        });

        /* ---------------------------------------------------- rotulos */
        ctx.rotulos(function () {
          if (G.centro) {
            nomearPonto(ctx, C, G.centro, [
              { x: -0.7071, y: -0.7071 }, { x: 0.7071, y: -0.7071 },
              { x: -0.7071, y: 0.7071 }, { x: 0.7071, y: 0.7071 }
            ], {});
          }
          if (G.corda) {
            D.rotuloLado(ctx, G.corda.rotulo, pp(G.r, G.corda.de), pp(G.r, G.corda.ate),
              { centro: C, tam: TAM_DADO, afastamento: 5, cor: corValor });
          }
          if (G.quadrado && G.ladoRotulo) {
            var Q = ctx.pontos(G.quadrado);
            D.rotuloLado(ctx, G.ladoRotulo, Q[0], Q[1], { centro: C, tam: TAM_DADO, afastamento: 5, cor: corValor });
          }
        });
      });
    }
  };

  /* Toda a geometria do circulo em unidades do problema, sem desenhar nada. E
   * chamada duas vezes, para medir e para desenhar, e por isso os avisos so
   * saem quando ha doc. Devolve null quando a diretiva se contradiz. */
  function geometriaDoCirculo(B, doc, d) {
    function recusarCirculo(t) { if (doc) B.avisar(doc, 'circulo: ' + t); return null; }
    var raios = lerMedidas(B, d.args, 'raio');
    var raio = raios.length ? raios[0] : null;
    var diam = lerMedida(B, d.args, 'diametro');
    var corda = lerMedida(B, d.args, 'corda');
    var coroa = lerMedida(B, d.args, 'coroa');
    var insc = lerMedida(B, d.args, 'inscrito');
    var circ = lerMedida(B, d.args, 'circunscrito');
    var setor = lerMedida(B, d.args, 'setor');
    var arco = lerMedida(B, d.args, 'arco');
    var fatiasBruto = B.primeiro(d.args, 'fatias');
    var aneisBrutos = B.lista(d.args, 'aneis');
    var centro = B.primeiro(d.args, 'centro');
    var incognita = B.primeiro(d.args, 'incognita');
    var giro = B.numero(d.args, 'giro') || 0;

    /* ---------------------------------------------- o raio, uma vez so */
    var r = null, origem = null;
    function fixarRaioDoCirculo(v, de) {
      if (v === null || v === undefined) return true;
      if (!(v > 0)) { recusarCirculo(de + ' tem que ser positivo'); return false; }
      if (r === null) { r = v; origem = de; return true; }
      if (Math.abs(r - v) > 0.005 * Math.max(r, v)) {
        recusarCirculo(de + ' da raio ' + arredondar(v) + ' e ' + origem + ' da raio ' + arredondar(r) +
          ': os dois nao contam a mesma historia');
        return false;
      }
      return true;
    }
    var aneis = null;
    if (aneisBrutos.length) {
      aneis = [];
      for (var an = 0; an < aneisBrutos.length; an++) {
        if (!B.ehNumero(aneisBrutos[an])) return recusarCirculo('aneis=' + aneisBrutos.join(';') + ' pede so numeros');
        aneis.push(parseFloat(aneisBrutos[an]));
      }
      aneis.sort(function (p, q) { return p - q; });
      if (aneis.length < 2) return recusarCirculo('aneis= pede pelo menos dois raios');
      if (!(aneis[0] > 0)) return recusarCirculo('aneis= com raio nao positivo');
    }
    var L = null;
    if (insc && insc.valor !== null) L = insc.valor;
    if (circ && circ.valor !== null) {
      if (L !== null && Math.abs(L - circ.valor) > 1e-9) return recusarCirculo('inscrito e circunscrito com lados diferentes');
      L = circ.valor;
    }
    var rIn = null, rOut = null;
    /* O circulo PRINCIPAL e o inscrito quando ha quadrado inscrito: e ele que
     * o raio= cota e e nele que setor, corda e diametro se apoiam. */
    if (insc) {
      if (L !== null) rIn = L / 2;
      else if (raio && raio.valor !== null) { rIn = raio.valor; L = 2 * rIn; }
      else if (diam && diam.valor !== null) { rIn = diam.valor / 2; L = 2 * rIn; }
      if (rIn !== null && !fixarRaioDoCirculo(rIn, 'inscrito')) return null;
    }
    if (circ) {
      if (L !== null) rOut = L * Math.SQRT1_2;
      else if (!insc && raio && raio.valor !== null) { rOut = raio.valor; L = rOut * Math.SQRT2; }
      if (!insc && rOut !== null && !fixarRaioDoCirculo(rOut, 'circunscrito')) return null;
    }
    if (!fixarRaioDoCirculo(raio && raio.valor !== null ? raio.valor : null, 'raio')) return null;
    if (!fixarRaioDoCirculo(diam && diam.valor !== null ? diam.valor / 2 : null, 'diametro')) return null;
    if (aneis && !fixarRaioDoCirculo(aneis[aneis.length - 1], 'aneis')) return null;
    var rChutado = r === null;
    if (r === null) r = 5;
    if (insc && rIn === null) { rIn = r; L = 2 * r; }
    if (circ && rOut === null) { rOut = insc ? r * Math.SQRT2 : r; if (L === null) L = rOut * Math.SQRT2; }
    /* Um raio so para dois circulos: o rotulo vai no inscrito, e o do
     * circunscrito fica sem cota. Nao e erro, e o teto de marcas que decide. */

    /* ---------------------------------------------- o angulo central */
    var ang = null, angLetra = null, temAngulo = false, hachuraSetor = false, fatias = null;
    function anguloDe(m, nome) {
      if (!m) return true;
      temAngulo = true;
      if (m.valor !== null) {
        if (!(m.valor > 0) || m.valor >= 360) { recusarCirculo(nome + '=' + m.bruto + ' nao e angulo central'); return false; }
        if (ang !== null && Math.abs(ang - m.valor) > 1e-9) { recusarCirculo('arco e setor com angulos diferentes'); return false; }
        ang = m.valor;
      } else {
        angLetra = m.rotulo;
      }
      return true;
    }
    if (!anguloDe(setor, 'setor')) return null;
    if (!anguloDe(arco, 'arco')) return null;
    if (setor) hachuraSetor = true;
    if (fatiasBruto !== null) {
      if (!B.ehNumero(fatiasBruto) || Math.round(parseFloat(fatiasBruto)) < 2) {
        return recusarCirculo('fatias=' + fatiasBruto + ' pede um numero inteiro de fatias, de 2 para cima');
      }
      fatias = Math.round(parseFloat(fatiasBruto));
      if (temAngulo) return recusarCirculo('fatias nao combina com setor nem com arco na mesma figura');
      temAngulo = true; hachuraSetor = true;
      ang = 360 / fatias;
    }
    if (incognita) {
      if (!temAngulo) return recusarCirculo('incognita=' + incognita + ' sem angulo central para marcar (use setor, arco ou fatias)');
      angLetra = String(incognita);
    }
    var a0 = giro, a1 = giro + (ang !== null ? ang : 60);
    var anguloTexto = angLetra ? angLetra : (ang !== null ? arredondar(ang) + '°' : null);

    /* ---------------------------------------------- a coroa e a corda */
    var coroaR = null;
    if (coroa) {
      coroaR = coroa.valor !== null ? coroa.valor : 0.6 * r;
      if (!(coroaR > 0) || coroaR >= r) return recusarCirculo('coroa=' + coroa.bruto + ' tem que ser menor do que o raio ' + arredondar(r));
    }
    var cordaG = null;
    if (corda) {
      var meia = 50;
      if (corda.valor !== null) {
        if (!(corda.valor > 0) || corda.valor > 2 * r + 1e-9) return recusarCirculo('corda=' + corda.bruto + ' nao cabe num circulo de raio ' + arredondar(r));
        meia = Math.asin(Math.min(1, corda.valor / (2 * r))) * 180 / Math.PI;
      }
      cordaG = { de: 270 + giro - meia, ate: 270 + giro + meia, rotulo: corda.rotulo };
    }

    /* ---------------------------------------------- as cotas radiais */
    var cotas = [], raioNoSetor = false, cotaForaDoDiametro = false, diametroAngulo = null;
    if (raio) {
      var rr = insc ? rIn : (circ ? rOut : r);
      if (temAngulo) {
        /* Sobre o primeiro raio do setor, com o texto por FORA da cunha. */
        cotas.push({ raio: rr, rotulo: raio.rotulo, tipo: 'raio', angulo: a0, lado: -1 });
        raioNoSetor = true;
      } else if (insc) {
        cotas.push({ raio: rr, rotulo: raio.rotulo, tipo: 'raio', angulo: 90 + giro, lado: 1 });
      } else if (circ) {
        cotas.push({ raio: rr, rotulo: raio.rotulo, tipo: 'raio', angulo: 45 + giro, lado: 1 });
      } else if (coroa) {
        /* O R da coroa pousa DENTRO da coroa, no meio do anel que ele mede:
         * no meio do raio ele caia dentro do disco branco de r, e um 10
         * escrito dentro do circulo de 6 le como medida do circulo errado. */
        cotas.push({ raio: rr, rotulo: raio.rotulo, tipo: 'raio', angulo: 118 + giro, lado: 1,
          em: (coroaR + rr) / (2 * rr) });
      } else {
        cotas.push({ raio: rr, rotulo: raio.rotulo, tipo: 'raio', angulo: 55 + giro, lado: 1 });
      }
    }
    if (insc && circ && raios.length >= 2) {
      /* O raio do circunscrito vai ao canto de baixo a direita, longe do raio
       * do inscrito (que sobe ate a tangencia de cima) e do seu quadradinho, e
       * o rotulo fica do lado de fora da diagonal, na parte branca entre o
       * circulo inscrito e o canto. */
      cotas.push({ raio: rOut, rotulo: raios[1].rotulo, tipo: 'raio', angulo: -45 + giro, lado: 1, em: 0.6 });
    }
    if (diam) {
      /* Perpendicular a bissetriz do setor, para cruzar a regiao so no centro;
       * na pizza, SOBRE um dos cortes (o primeiro raio mais 90), senao o
       * diametro vira um nono corte que nao divide fatia nenhuma. */
      var angD = fatias ? a0 + 90 : (temAngulo ? (a0 + a1) / 2 + 90 : 160 + giro);
      /* O rotulo do diametro NAO pode ficar na linha, e isso vale em toda
       * figura e nao so na pizza. O diametro passa pelo centro, entao cada
       * metade dele e do tamanho de um raio, e o texto na linha pousa no meio
       * de UMA das metades (o em padrao do cotaRadial e 0,72, que e quase o
       * meio da segunda metade, 0,75).
       *
       * Medido nas duas figuras onde isso doi:
       *
       *   pizza (fatias=8 diametro=40)   o "40" ficava a 9,68 pt de um raio de
       *     54,39 pt e a 10,32 pt do diametro de 108,78 pt que ele nomeia
       *   circulo r d O (MAT08-13 p2)    a figura existe justamente para
       *     separar raio de diametro, e o "d" pousava a 25,92 pt do centro,
       *     sobre a metade esquerda da corda de 108,77 pt, do mesmo jeito e
       *     quase a mesma distancia que o "r" (28,90 pt do centro). Tres linhas
       *     acima o texto diz d = 2r, e a figura mostrava dois rotulos iguais
       *     grudados em dois pedacos do mesmo tamanho.
       *
       * Quem le assim monta a area com o raio errado e erra por fator 4, que e
       * o erro mais comum do assunto. Entao o diametro sai sempre como cota por
       * FORA, com a chamada nos dois extremos: a medida passa a ter comeco e
       * fim visiveis, e o rotulo mora no meio do vao inteiro. Levar o texto
       * para o meio da corda inteira nao resolve: la esta o centro, que quase
       * sempre ja tem a bolinha e a letra O. */
      cotaForaDoDiametro = true;
      /* Fora da pizza a linha do diametro passa a ser desenhada pela receita,
       * porque o cotaRadial em estilo 'cota' so desenha a medida. */
      diametroAngulo = fatias ? null : angD;
      /* Com quadrado a cota vai para o outro lado do diametro. O rotulo do LADO
       * do quadrado mora sempre embaixo (aresta Q0 Q1, lado -1), e a cota do
       * diametro no lado padrao cai ali tambem: medido em inscrito=10 raio=5
       * diametro=10, os dois "10" ficavam a 6,41 pt um do outro, contra 40,10
       * pt antes desta rodada. Do outro lado eles voltam a 40 pt de folga. */
      cotas.push({ raio: r, rotulo: diam.rotulo, tipo: 'diametro', angulo: angD,
        lado: (insc || circ) ? -1 : 1, fora: true });
    }
    if (coroa) cotas.push({ raio: coroaR, rotulo: coroa.rotulo, tipo: 'raio', angulo: 215 + giro, lado: 1 });
    if (aneis) {
      /* Cada raio do alvo e cotado DENTRO do proprio anel: o rotulo do raio de
       * 4 fica entre 2 e 4, onde ele mede alguma coisa, e nao em cima do disco
       * de 2. O em e a fracao do raio em que o texto pousa.
       *
       * O leque e a ordem sao o resto da mesma decisao, e nasceram medidos. Com
       * passo de 38 graus e todos os rotulos empurrados para o mesmo lado
       * (lado: 1, ou seja para a normal a mais 90), cada rotulo era empurrado
       * NA DIRECAO do raio seguinte: o "2" ficava a 1,48 pt da linha do 6 e a
       * 10,40 pt da propria linha, sete vezes mais longe do que ele nomeia, e
       * o "4" ficava a 8,92 pt da sua e a 9,76 pt da do 6, empate pratico.
       * Agora o passo e de 62 graus e cada rotulo foge do leque: o de dentro
       * para a normal de menos 90, os de fora para a de mais 90.
       *
       * A ordem e de FORA para dentro pelo mesmo motivo que a pilha de camadas
       * do base.js existe: o cotaRadial poe o raio e o rotulo juntos na camada
       * de marcas, entao os tres pares se intercalam e um raio desenhado
       * DEPOIS risca o rotulo pintado antes. Foi o "2" saindo cortado por uma
       * barra de 0,9 pt do raio de 6. Do maior para o menor isso nao acontece:
       * o raio que ainda falta desenhar e sempre mais curto do que a distancia
       * do rotulo ja pintado ao centro. */
      var rotulosAneis = B.lista(d.args, 'aneis');
      for (var ai = aneis.length - 1; ai >= 0; ai--) {
        var interno = ai === 0 ? 0 : aneis[ai - 1];
        cotas.push({
          raio: aneis[ai], rotulo: String(aneis[ai]), tipo: 'raio',
          angulo: 40 + giro + ai * 62, lado: ai === 0 ? -1 : 1,
          /* O anel de DENTRO e o unico cuja regiao encosta no ponto em que os
           * tres raios se encontram, e ali a distancia do rotulo as outras duas
           * linhas nao passa da distancia dele ao centro. Por isso ele ganha os
           * dois ajustes que os outros nao precisam: pousa mais longe do centro
           * (o piso do em) e cola na propria linha (afastamento curto, que o
           * halo do rotulo resolve). Medido no alvo de 2, 4 e 6: o "2" passou a
           * ficar a 7,75 pt da sua linha contra 12,17 pt das outras duas, e
           * continua a 1,34 unidades do centro, ou seja dentro do disco de 2
           * que ele mede. */
          afastamento: ai === 0 ? 1.5 : undefined,
          em: Math.max((interno + aneis[ai]) / 2 / aneis[ai], 0.68)
        });
      }
      if (rotulosAneis.length !== aneis.length) return recusarCirculo('aneis= com valor repetido');
    }

    /* ---------------------------------------------- o quadrado e a caixa */
    var quadrado = null, tangencia = null, ladoRotulo = null;
    if (L !== null && (insc || circ)) {
      var h = L / 2;
      quadrado = B.geo.girar([pt(-h, -h), pt(h, -h), pt(h, h), pt(-h, h)], giro, pt(0, 0));
      ladoRotulo = insc ? insc.rotulo : circ.rotulo;
      if (insc && raio && !temAngulo) {
        /* O quadradinho no ponto de tangencia T, entre o raio (T ate o centro)
         * e o lado (T ate o canto). O segundo ponto e o CANTO do quadrado, e
         * nao um passo qualquer ao longo do lado: o marcaAnguloReto limita o
         * lado do quadradinho a um terco da menor semirreta, e um passo de uma
         * unidade (8 pt na folha) dava um quadradinho de 2,7 pt, que ele
         * recusa. */
        var T = polar(pt(0, 0), rIn, 90 + giro);
        tangencia = { ponto: T, aoLongo: polar(T, h, giro) };
      }
    }
    /* O que foi CHUTADO, para a decisao de escala (ver escalaDe). */
    var numerico = !rChutado || (coroa && coroa.valor !== null) || (corda && corda.valor !== null) || !!aneis;
    var chute = (coroa && coroa.letra) || (corda && corda.letra) ||
      (rChutado && !!(raio || diam || insc || circ));
    var circunferencias = [];
    if (insc) circunferencias.push(rIn); else if (!aneis) circunferencias.push(r);
    if (circ) circunferencias.push(rOut);
    if (coroaR !== null) circunferencias.push(coroaR);
    if (aneis) for (var ac = 0; ac < aneis.length; ac++) circunferencias.push(aneis[ac]);

    var R = Math.max(r, rOut !== null ? rOut : 0, quadrado ? L * Math.SQRT1_2 : 0);
    /* A cota por fora do diametro sai a um raio e um pouco do centro, e o numero
     * mora nela: sem folga o desenho encostaria na borda do bloco. */
    var margem = cotaForaDoDiametro ? 0.40 * R : (quadrado ? 0.30 * R : 0.14 * R);
    var unidades = { x0: -R - margem, y0: -R - margem, x1: R + margem, y1: R + margem };

    return {
      r: r, rIn: rIn, rOut: rOut, L: L, giro: giro,
      ang: ang, anguloLetra: angLetra, anguloTexto: anguloTexto, temAngulo: temAngulo,
      a0: a0, a1: a1, hachuraSetor: hachuraSetor, fatias: fatias,
      coroa: coroaR, corda: cordaG, aneis: aneis, centro: centro ? String(centro) : null,
      cotas: cotas, raioNoSetor: raioNoSetor, diametroAngulo: diametroAngulo,
      quadrado: quadrado, tangencia: tangencia,
      ladoRotulo: ladoRotulo, circunferencias: circunferencias,
      unidades: unidades, alturaMax: quadrado ? 176 : 156,
      fora: escalaDe(d, numerico, chute)
    };
  }

  /* ============================================================ conica
   *
   * Elipse, hiperbole e parabola do MATEM3-04, na forma do livro brasileiro:
   * x2/a2 + y2/b2 = 1, x2/a2 - y2/b2 = 1 e y2 = 2px (a parabola abre para a
   * direita, com o foco a p/2 do vertice e a diretriz a p/2 do outro lado).
   *
   * As primitivas devolvem focos, vertices, diretriz, assintotas e retangulo
   * fundamental SEM desenhar nada disso, e cada um so entra quando a chave pede,
   * porque o teto e cinco marcas e uma parabola com foco, diretriz e vertice
   * marcados ja gastou tres.
   *
   * Chaves:
   *   tipo=elipse|hiperbole|parabola
   *   a=V[;R] b=V[;R]    semieixos; p=V[;R] o parametro da parabola. O numero
   *                      constroi; o texto so e ESCRITO quando e letra (a=a) ou
   *                      quando vem depois do ponto e virgula (a=5;5), porque a
   *                      e b definem a forma de toda elipse e nem toda elipse
   *                      quer os dois cotados
   *   focos=F1;F2        os focos com nome (focos=sim: bolinhas sem nome)
   *   c=c                a distancia focal, do centro ao primeiro foco, cotada
   *                      com a letra; com b e c escritos e P na ponta do eixo
   *                      menor sai o triangulo da relacao fundamental, com o
   *                      quadradinho no centro (b e c catetos, a hipotenusa
   *                      pela incognita=a sobre PF1)
   *   vertices=A1;A2;B1;B2   os vertices com nome (vertices=sim: so bolinhas);
   *                      na hiperbole dois, na parabola um
   *   diretriz=sim|d     a diretriz da parabola, com rotulo quando for letra
   *   assintotas=sim     as duas assintotas da hiperbole
   *   retangulo=sim|c    o retangulo fundamental 2a por 2b tracejado; com letra,
   *                      a meia diagonal (que mede c) sai cotada com ela
   *   ponto=P[;r]        um ponto P sobre a curva com os raios focais; r e a
   *                      distancia de P ao primeiro foco, em unidades, e escolhe
   *                      ONDE P fica (ponto=P;7 na elipse de a=5 e c=3 poe P a 7
   *                      de F1 e a 3 de F2). Na parabola sai tambem a
   *                      perpendicular ate a diretriz, com os tracinhos de
   *                      congruencia e o quadradinho no pe. No gabarito os raios
   *                      focais ganham o valor, em teal
   *   eixos=sim          o plano cartesiano atras, na escala da figura
   *   centro=h;k[;C]     a conica transladada para (h, k), com as linhas de
   *                      centro tracejadas ate os eixos e as distancias cotadas
   *   incognita=d        a letra do raio focal PF1 pedido (precisa de ponto=)
   *
   * O primeiro foco e o do lado positivo do eixo maior: F1 = (c, 0). */

  var conica = {
    chaves: ['tipo', 'a', 'b', 'p', 'c', 'focos', 'vertices', 'diretriz', 'assintotas', 'retangulo',
             'ponto', 'eixos', 'centro', 'incognita'],
    metricas: ['a', 'b', 'p'],

    medir: function (d, op) {
      var B = base();
      var G = geometriaDaConica(B, null, d);
      return {
        altura: op.altura != null ? op.altura
          : (G ? alturaParaCaixa(B, op, G.unidades, 130, 190) : null),
        legenda: d.legenda || null,
        foraDeEscala: G ? G.fora : d.escala === 'fora'
      };
    },

    desenhar: function (doc, d, op) {
      var B = base(), g = B.gerador(), COR = g.COR, D = desenho(), M = marcas();
      var G = geometriaDaConica(B, doc, d);
      if (!G) return null;
      if (!D) {
        B.avisar(doc, 'conica: o figuras/desenho.js nao carregou, e sem ele nao ha curva');
        return null;
      }
      var fora = G.fora;
      var corGab = corDaCamada(doc, d, COR);
      var corValor = corGab || undefined;

      return B.figura(doc, {
        x: op.x, largura: op.largura,
        altura: op.altura != null ? op.altura : alturaParaCaixa(B, op, G.unidades, 130, 190),
        unidades: G.unidades, legenda: d.legenda, foraDeEscala: fora,
        fase: d.fase, id: d.id, receita: 'conica'
      }, function (ctx) {
        var k = ctx.k;
        var C = ctx.p(G.C);
        var bloco = ctx.blocoInteiro
          ? { x0: ctx.blocoInteiro.x, y0: ctx.blocoInteiro.y,
              x1: ctx.blocoInteiro.x + ctx.blocoInteiro.largura,
              y1: ctx.blocoInteiro.y + ctx.blocoInteiro.altura }
          : null;
        var saida = {};
        var i;

        /* -------------------------------------------------- o plano atras */
        if (G.eixos) {
          ctx.fundo(function () {
            /* Um passo inteiro que caiba no canto do terceiro quadrante, onde o
             * eixos() mede que os dois "menos um" precisam de 17,55 pt: o passo
             * sobe ate a unidade caber, em vez de o tema receber o aviso. */
            var passo = 1;
            while (passo * k < 17.6 && passo < 50) passo += 1;
            D.eixos(ctx, ctx.p(pt(0, 0)), k, {
              xMin: G.unidades.x0 + 0.05, xMax: G.unidades.x1 - 0.05,
              yMin: G.unidades.y0 + 0.05, yMax: G.unidades.y1 - 0.05,
              passo: passo
            });
          });
        }

        /* -------------------------------------------------- a curva */
        ctx.contorno(function () {
          if (G.tipo === 'elipse') saida.E = D.elipse(ctx, C, G.a * k, G.b * k, {});
          else if (G.tipo === 'hiperbole') saida.H = D.hiperbole(ctx, C, G.a * k, G.b * k, { ate: G.alcanceY * k });
          else saida.P = D.parabola(ctx, C, G.p * k, { giro: 0, ate: G.alcanceY * k });
        });

        /* -------------------------------------------------- construcoes */
        ctx.marcas(function () {
          var F1 = ctx.p(G.F1), F2 = G.F2 ? ctx.p(G.F2) : null;
          if (G.retangulo && saida.H) {
            /* O retangulo fundamental CARREGA leitura: o texto manda ler que
             * ele tem lados 2a e 2b e que a meia diagonal mede c. Por isso ele
             * sai na tinta do contorno, e nao em muted, seguindo a regra que o
             * proprio desenho.js ja escreveu para a guia de leitura ("[2 2] na
             * tinta do contorno e nos mesmos 0,6 pt"): em muted, medido a 150
             * dpi em tons de cinza, 27 por cento da tinta do lado de cima e 34
             * por cento da do lado de baixo caiam ABAIXO do piso de 3:1, com
             * percentil 90 em 1,40:1 e 1,18:1, e na fotocopia o retangulo ficava
             * com tres lados. O tracejado continua sendo o que o separa da
             * conica. */
            D.poligono(ctx, saida.H.retangulo, {
              espessura: 0.6, tracejado: D.GUIA_LEITURA, cor: COR.texto, papel: 'apoio'
            });
            if (G.retanguloRotulo) {
              var canto = saida.H.retangulo[0];
              if (G.assintotas) {
                /* Com as assintotas na folha a meia diagonal E um pedaco de
                 * assintota: o segmento solido de 0,9 pt cobria os 48,46 pt
                 * inteiros da meia diagonal superior direita, ou seja 22,8 por
                 * cento daquela assintota, e a folha saia com tres meias
                 * diagonais pontilhadas e uma continua, como se a assintota
                 * comecasse no canto do retangulo. A cota diz a mesma coisa sem
                 * cobrir nada: ela sai ao lado, com a chamada nos dois extremos,
                 * e ainda delimita onde o c comeca e acaba. */
                D.cota(ctx, C, canto, G.retanguloRotulo, {
                  afastamento: 11, lado: 1, tam: TAM_DADO, corTexto: corValor
                });
              } else {
                D.poligono(ctx, [C, canto], { fechado: false, espessura: 0.9, papel: 'objeto' });
                D.rotuloLado(ctx, G.retanguloRotulo, C, canto, { lado: 1, tam: TAM_DADO, afastamento: 4, cor: corValor });
              }
            }
          }
          if (G.assintotas && saida.H) {
            for (i = 0; i < saida.H.assintotas.length; i++) {
              D.poligono(ctx, saida.H.assintotas[i], {
                fechado: false, espessura: 0.6, tracejado: D.GUIA_LEITURA, cor: COR.texto,
                papel: 'guia', recorte: bloco
              });
            }
          }
          if (G.diretriz) {
            var d0 = ctx.p(pt(G.diretrizX, G.unidades.y0 + 0.08 * (G.unidades.y1 - G.unidades.y0)));
            var d1 = ctx.p(pt(G.diretrizX, G.unidades.y1 - 0.08 * (G.unidades.y1 - G.unidades.y0)));
            guia(ctx, d0, d1, false);
            if (G.diretrizRotulo) {
              D.rotuloLado(ctx, G.diretrizRotulo, d0, d1, { em: 0.9, lado: 1, tam: TAM_DADO, afastamento: 4 });
            }
          }
          /* Semieixos escritos: a do centro ao vertice, b do centro ao co-vertice. */
          if (G.mostraA) {
            var Va = ctx.p(pt(G.C.x + G.a, G.C.y));
            D.poligono(ctx, [C, Va], { fechado: false, espessura: 0.9, papel: 'objeto' });
            D.rotuloLado(ctx, G.ma.rotulo, C, Va, { lado: -1, tam: TAM_DADO, afastamento: 4, cor: corValor });
          }
          if (G.mostraB) {
            var Vb = ctx.p(pt(G.C.x, G.C.y + G.b));
            D.poligono(ctx, [C, Vb], { fechado: false, espessura: 0.9, papel: 'objeto' });
            D.rotuloLado(ctx, G.mb.rotulo, C, Vb, { lado: 1, tam: TAM_DADO, afastamento: 4, cor: corValor });
          }
          if (G.mostraC && G.tipo !== 'parabola') {
            D.poligono(ctx, [C, F1], { fechado: false, espessura: 0.9, papel: 'objeto' });
            D.rotuloLado(ctx, G.mc.rotulo, C, F1, { lado: -1, tam: TAM_DADO, afastamento: 4, cor: corValor });
            /* A relacao fundamental: com b e c escritos e P na ponta do eixo
             * menor, o triangulo CPF1 e retangulo em C, e o quadradinho e o que
             * diz que a hipotenusa e a (e nao c, que e o erro comum numero um
             * do tema, o de trocar a relacao da elipse pela da hiperbole). */
            if (G.mostraB && G.P && Math.abs(G.P.x - G.C.x) < 1e-6 && M) {
              M.marcaAnguloReto(ctx.doc, C, ctx.p(G.P), F1, { ctx: ctx });
            }
          }
          if (G.mostraP && G.tipo === 'parabola') {
            /* p e a distancia do foco a diretriz, medida sobre o eixo. */
            var pe0 = ctx.p(pt(G.diretrizX, G.C.y)), pe1 = F1;
            D.poligono(ctx, [pe0, pe1], { fechado: false, espessura: 0.9, papel: 'objeto' });
            D.rotuloLado(ctx, G.mp.rotulo, pe0, pe1, { lado: -1, tam: TAM_DADO, afastamento: 4, cor: corValor });
          }
          /* As linhas de centro da conica transladada, com as distancias. */
          if (G.linhasDeCentro) {
            var Cx = ctx.p(pt(G.C.x, 0)), Cy = ctx.p(pt(0, G.C.y)), O = ctx.p(pt(0, 0));
            if (Math.abs(G.C.y) > 1e-9) {
              guia(ctx, C, Cx, true);
              D.cota(ctx, C, Cx, arredondar(Math.abs(G.C.y)), { fora: O, afastamento: 9, tam: TAM_DADO, corTexto: corValor });
            }
            if (Math.abs(G.C.x) > 1e-9) {
              guia(ctx, C, Cy, true);
              D.cota(ctx, C, Cy, arredondar(Math.abs(G.C.x)), { fora: O, afastamento: 9, tam: TAM_DADO, corTexto: corValor });
            }
          }
          /* Os raios focais do ponto P. */
          if (G.P) {
            var Pp = ctx.p(G.P);
            var gab = d.fase === 'gabarito';
            var t1 = G.incognita ? String(G.incognita) : null;
            var t2 = null;
            if (gab) {
              t1 = (G.incognita ? G.incognita + ' = ' : '') + arredondar(G.r1);
              t2 = arredondar(G.r2);
            }
            var corResp = gab ? COR.teal : corValor;
            /* No gabarito o raio focal E a resposta, e a folha e fotocopiada. O
             * teal do gabarito da 4,93:1 contra o 17,08:1 da tinta do texto, ou
             * seja em tons de cinza a resposta imprime mais CLARA do que o dado
             * que ela responde (medido a 150 dpi: cinza 112 contra 27), com os
             * dois no mesmo corpo de 8,5 pt. Isso inverte a hierarquia que o
             * proprio projeto escreve: o que carrega a resposta nunca e a marca
             * mais fraca da figura. A paleta e do pdf.js e o teal e o codigo de
             * cor de todo o gabarito; o que a receita pode dar e PESO, e e o
             * mesmo bold que o caminho de recuo do valor de angulo ja usa
             * quando ha cor de resposta. */
            var negritoResp = gab === true, tamResp = gab ? TAM_RESPOSTA : TAM_DADO;
            D.poligono(ctx, [Pp, F1], { fechado: false, espessura: 0.9, papel: 'objeto' });
            if (t1) D.rotuloLado(ctx, t1, Pp, F1, { centro: C, tam: tamResp, afastamento: 4, cor: corResp, bold: negritoResp });
            if (G.tipo === 'parabola') {
              var Dp = ctx.p(G.peDiretriz);
              D.poligono(ctx, [Pp, Dp], { fechado: false, espessura: 0.9, papel: 'objeto' });
              if (t2) D.rotuloLado(ctx, t2, Pp, Dp, { lado: 1, tam: tamResp, afastamento: 4, cor: corResp, bold: negritoResp });
              if (M) {
                /* A definicao da parabola e UMA afirmacao, "P esta a mesma
                 * distancia do foco e da diretriz", e ela se escreve com tres
                 * pecas: o tracinho num segmento, o tracinho no outro e o
                 * quadradinho no pe (sem ele "distancia a diretriz" nao e a
                 * perpendicular). As tres anotam uma marca so, pela mesma regra
                 * do grupo de tracinhos do marcarCongruentes; contadas uma a
                 * uma, a figura da definicao (V, F, d, P) estourava o teto so
                 * pela notacao. O pe do quadradinho aponta para a PONTA da
                 * diretriz e nao para um passo de uma unidade, senao no plano
                 * cartesiano o lado do quadradinho cai abaixo dos 3 pt e o
                 * marcaAnguloReto recusa. */
                M.marcaLado(ctx.doc, Pp, F1, { n: 1 });
                M.marcaLado(ctx.doc, Pp, Dp, { n: 1 });
                var pontaD = ctx.p(pt(G.diretrizX, G.P.y >= G.C.y ? G.unidades.y0 + 0.08 * (G.unidades.y1 - G.unidades.y0)
                  : G.unidades.y1 - 0.08 * (G.unidades.y1 - G.unidades.y0)));
                M.marcaAnguloReto(ctx.doc, Dp, Pp, pontaD, {});
                ctx.anota('marca', { tipo: 'definicaoDaParabola', congruentes: 2, anguloReto: 1 });
              }
            } else if (F2) {
              D.poligono(ctx, [Pp, F2], { fechado: false, espessura: 0.9, papel: 'objeto' });
              if (t2) D.rotuloLado(ctx, t2, Pp, F2, { centro: C, tam: tamResp, afastamento: 4, cor: corResp, bold: negritoResp });
            }
          }
        });

        /* -------------------------------------------------- os nomes
         * Todos separados (ver o nomearPonto): numa conica todo ponto com nome
         * esta onde dois segmentos se tocam, e nenhum deles tem angulo pedido. */
        ctx.rotulos(function () {
          var sep = true;
          var F1 = ctx.p(G.F1), F2 = G.F2 ? ctx.p(G.F2) : null;
          /* Com o plano atras, os numeros da escala moram ABAIXO do eixo x e a
           * ESQUERDA do eixo y (o eixos() nao os registra como obstaculo), entao
           * o nome do foco sobe: embaixo ele cobria o "3" do tique de x igual a
           * 3, que e justamente a abscissa do foco. */
          var baixo = G.eixos ? [{ x: 0, y: 1 }, { x: 0, y: -1 }] : [{ x: 0, y: -1 }, { x: 0, y: 1 }];
          var lateral = G.tipo === 'elipse' && !G.horizontal ? [{ x: 1, y: 0 }, { x: -1, y: 0 }] : baixo;
          if (G.focos) {
            nomearPonto(ctx, F1, G.focos[0], lateral, { separado: sep });
            if (F2) nomearPonto(ctx, F2, G.focos[1], lateral, { separado: sep });
          }
          if (G.vertices) {
            for (i = 0; i < G.verticesPontos.length; i++) {
              var V = G.verticesPontos[i];
              var ux = V.x - G.C.x, uy = V.y - G.C.y, n = Math.sqrt(ux * ux + uy * uy) || 1;
              var fora2 = { x: ux / n, y: uy / n };
              var dirs;
              if (G.tipo === 'parabola') {
                dirs = G.eixos
                  ? [{ x: -0.7071, y: 0.7071 }, { x: -0.7071, y: -0.7071 }, { x: -1, y: 0 }]
                  : [{ x: -1, y: 0 }, { x: -0.7071, y: -0.7071 }, { x: -0.7071, y: 0.7071 }];
              } else if (G.tipo === 'hiperbole') {
                /* Para DENTRO, entre os dois ramos: por fora o vertice esta
                 * espremido entre o ramo, que sobe quase vertical dali, e o
                 * lado do retangulo fundamental, que passa exatamente por ele.
                 * Medido na primeira tirada: A1 e A2 sairam em tarja estreita
                 * por nao haver posicao livre em 26 pt de busca. */
                dirs = [{ x: -fora2.x, y: -fora2.y },
                        { x: -fora2.x * 0.7071 + fora2.y * 0.7071, y: -fora2.x * 0.7071 - fora2.y * 0.7071 },
                        { x: -fora2.x * 0.7071 - fora2.y * 0.7071, y: fora2.x * 0.7071 - fora2.y * 0.7071 }];
              } else {
                dirs = [{ x: fora2.x * 0.7071 - fora2.y * 0.7071, y: fora2.x * 0.7071 + fora2.y * 0.7071 },
                        { x: fora2.x * 0.7071 + fora2.y * 0.7071, y: -fora2.x * 0.7071 + fora2.y * 0.7071 },
                        fora2];
              }
              nomearPonto(ctx, ctx.p(V), G.verticesNomes[i], dirs, { separado: sep });
            }
          }
          if (G.P) {
            var ux2 = G.P.x - G.C.x, uy2 = G.P.y - G.C.y, n2 = Math.sqrt(ux2 * ux2 + uy2 * uy2) || 1;
            var foraP = G.tipo === 'hiperbole' ? { x: -0.5, y: 0.866 } : { x: ux2 / n2, y: uy2 / n2 };
            if (G.tipo === 'parabola') foraP = { x: -0.45, y: 0.89 };
            nomearPonto(ctx, ctx.p(G.P), G.pontoNome, [foraP, { x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }], { separado: sep });
          }
          if (G.centroNome) {
            /* O nome do centro foge das DUAS linhas de cota da translacao, e
             * elas nao estao em lugar qualquer: as duas saem com fora= na
             * origem, ou seja sao empurradas para o lado de LA da origem. A do
             * valor de k (a vertical) fica do lado do sinal de h, e a do valor
             * de h (a horizontal) fica do lado do sinal de k. Entao a diagonal
             * que aponta de volta PARA a origem e a unica que nao encosta em
             * nenhuma das duas, e ela vai na frente da fila.
             *
             * Medido na elipse transladada do MATEM3-04 (centro em (2, 3), o
             * material p4): o "C" saia a 0,80 pt da linha de cota vertical do
             * valor 3 e a 11,25 pt da bolinha que ele nomeia, quatorze vezes
             * mais perto da cota do que do ponto. De cima para baixo lia-se
             * seta, C, traco, 3, seta, e nao dava para saber se o C nomeava o
             * ponto ou a medida. */
            var dirCentro = [
              { x: 0.7071, y: -0.7071 }, { x: -0.7071, y: -0.7071 },
              { x: 0.7071, y: 0.7071 }, { x: -0.7071, y: 0.7071 }
            ];
            if (G.linhasDeCentro) {
              var sx = G.C.x > 1e-9 ? -0.7071 : (G.C.x < -1e-9 ? 0.7071 : 0.7071);
              var sy = G.C.y > 1e-9 ? -0.7071 : (G.C.y < -1e-9 ? 0.7071 : -0.7071);
              /* Na folha o y cresce para cima e o ctx.p ja fez a conversao, mas
               * o sinal do lado vem das unidades do problema: a diagonal para a
               * origem em unidades e a mesma diagonal na folha. */
              dirCentro = [{ x: sx, y: sy }].concat(dirCentro);
            }
            nomearPonto(ctx, C, G.centroNome, dirCentro, { separado: sep });
          }
        });
      });
    }
  };

  /* A geometria da conica em unidades do problema, sem desenhar. Centro em
   * (h, k), eixo maior no x. Devolve null quando a diretiva nao fecha. */
  function geometriaDaConica(B, doc, d) {
    function recusarConica(t) { if (doc) B.avisar(doc, 'conica: ' + t); return null; }
    var tipo = String(B.primeiro(d.args, 'tipo') || 'elipse').toLowerCase();
    if (tipo !== 'elipse' && tipo !== 'hiperbole' && tipo !== 'parabola') {
      return recusarConica('tipo=' + tipo + ' nao e elipse, hiperbole nem parabola');
    }
    var ma = lerMedida(B, d.args, 'a'), mb = lerMedida(B, d.args, 'b'), mp = lerMedida(B, d.args, 'p');
    var mc = lerMedida(B, d.args, 'c');
    if (mc && mc.valor !== null) return recusarConica('c=' + mc.bruto + ': a distancia focal se deduz de a e b (ou de p), escreva so a letra');
    var a = ma && ma.valor !== null ? ma.valor : (tipo === 'hiperbole' ? 3 : 5);
    var b = mb && mb.valor !== null ? mb.valor : (tipo === 'hiperbole' ? 2 : 3.5);
    var p = mp && mp.valor !== null ? mp.valor : 4;
    if (!(a > 0) || !(b > 0)) return recusarConica('a e b tem que ser positivos');
    if (!(p > 0)) return recusarConica('p tem que ser positivo (e a distancia do foco a diretriz)');

    var cen = B.lista(d.args, 'centro');
    var h = 0, kk = 0, centroNome = null;
    if (cen.length) {
      if (cen.length < 2 || !B.ehNumero(cen[0]) || !B.ehNumero(cen[1])) {
        return recusarConica('centro=' + cen.join(';') + ' pede h;k numericos e, opcionalmente, o nome');
      }
      h = parseFloat(cen[0]); kk = parseFloat(cen[1]);
      if (cen.length > 2) centroNome = String(cen[2]);
    }
    var C = pt(h, kk);
    var eixos = ehSim(B.primeiro(d.args, 'eixos'));
    var medidasDoTipo = tipo === 'parabola' ? [mp] : [ma, mb];
    var numerico = false, chute = false;
    for (var md = 0; md < medidasDoTipo.length; md++) {
      if (medidasDoTipo[md] && medidasDoTipo[md].valor !== null) numerico = true;
      if (medidasDoTipo[md] && medidasDoTipo[md].letra) chute = true;
    }
    var G = {
      tipo: tipo, a: a, b: b, p: p, C: C, ma: ma, mb: mb, mp: mp, eixos: eixos,
      fora: escalaDe(d, numerico, chute),
      centroNome: centroNome, linhasDeCentro: eixos && (Math.abs(h) > 1e-9 || Math.abs(kk) > 1e-9),
      mostraA: !!ma && (ma.letra || ma.explicito) && tipo !== 'parabola',
      mostraB: !!mb && (mb.letra || mb.explicito) && tipo !== 'parabola',
      mostraC: !!mc && tipo !== 'parabola', mc: mc,
      mostraP: !!mp && (mp.letra || mp.explicito) && tipo === 'parabola'
    };

    /* ---------------------------------------------- focos, vertices, caixa */
    var caixa;
    if (tipo === 'elipse') {
      G.horizontal = a >= b;
      G.maior = Math.max(a, b); G.menor = Math.min(a, b);
      G.c = Math.sqrt(G.maior * G.maior - G.menor * G.menor);
      G.e = G.c / G.maior;
      G.F1 = G.horizontal ? pt(h + G.c, kk) : pt(h, kk + G.c);
      G.F2 = G.horizontal ? pt(h - G.c, kk) : pt(h, kk - G.c);
      G.verticesPontos = [pt(h + a, kk), pt(h - a, kk), pt(h, kk + b), pt(h, kk - b)];
      caixa = { x0: h - a, y0: kk - b, x1: h + a, y1: kk + b };
    } else if (tipo === 'hiperbole') {
      G.c = Math.sqrt(a * a + b * b);
      G.e = G.c / a;
      G.F1 = pt(h + G.c, kk); G.F2 = pt(h - G.c, kk);
      G.verticesPontos = [pt(h + a, kk), pt(h - a, kk)];
      G.alcanceY = 2.0 * b;
      var xMax = a * Math.sqrt(1 + (G.alcanceY / b) * (G.alcanceY / b));
      caixa = { x0: h - xMax, y0: kk - G.alcanceY, x1: h + xMax, y1: kk + G.alcanceY };
    } else {
      G.c = p / 2;
      G.F1 = pt(h + p / 2, kk); G.F2 = null;
      G.diretrizX = h - p / 2;
      G.verticesPontos = [pt(h, kk)];
      G.alcanceY = 1.6 * p;
      caixa = { x0: h - p / 2, y0: kk - G.alcanceY, x1: h + G.alcanceY * G.alcanceY / (2 * p), y1: kk + G.alcanceY };
    }

    /* ---------------------------------------------- o que a diretiva nomeia */
    var focos = B.lista(d.args, 'focos');
    if (focos.length) {
      G.focos = ehSim(focos[0]) ? [null, null] : [focos[0], focos.length > 1 ? focos[1] : null];
      if (!ehSim(focos[0]) && tipo !== 'parabola' && focos.length < 2) {
        return recusarConica('focos=' + focos.join(';') + ': a ' + tipo + ' tem dois focos, de nome aos dois');
      }
    }
    var vert = B.lista(d.args, 'vertices');
    if (vert.length) {
      G.vertices = true;
      G.verticesNomes = [];
      for (var vi = 0; vi < G.verticesPontos.length; vi++) {
        G.verticesNomes.push(ehSim(vert[0]) ? null : (vert[vi] || null));
      }
    }
    var dir = B.primeiro(d.args, 'diretriz');
    if (dir !== null) {
      if (tipo !== 'parabola') return recusarConica('diretriz so na parabola');
      G.diretriz = true;
      G.diretrizRotulo = ehSim(dir) ? null : String(dir);
    }
    if (B.primeiro(d.args, 'assintotas') !== null) {
      if (tipo !== 'hiperbole') return recusarConica('assintotas so na hiperbole');
      G.assintotas = true;
    }
    var ret = B.primeiro(d.args, 'retangulo');
    if (ret !== null) {
      if (tipo !== 'hiperbole') return recusarConica('retangulo fundamental so na hiperbole');
      G.retangulo = true;
      G.retanguloRotulo = ehSim(ret) ? null : String(ret);
    }
    G.incognita = B.primeiro(d.args, 'incognita');
    if (G.incognita !== null && /^[xαβθ]$/.test(String(G.incognita))) {
      return recusarConica('incognita=' + G.incognita + ': a trava do base.js le x, alfa, beta e teta sozinhos como ' +
        'valor de ANGULO e cobra um arco que um raio focal nao tem; use outra letra (d, r, m)');
    }

    /* ---------------------------------------------- o ponto sobre a curva */
    var pv = pares(B, d.args, 'ponto');
    if (pv.length) {
      var nome = pv[0][0];
      var rf = pv[0].length > 1 ? pv[0][1] : null;
      if (rf !== null && !B.ehNumero(rf)) return recusarConica('ponto=' + pv[0].join(';') + ': o segundo valor e a distancia de P ao primeiro foco, numerica');
      var P = null;
      if (tipo === 'elipse') {
        if (rf !== null) {
          var r1 = parseFloat(rf);
          if (G.e < 1e-9) return recusarConica('ponto=' + pv[0].join(';') + ': com a igual a b a distancia ao foco nao escolhe ponto nenhum');
          if (r1 < G.maior - G.c - 1e-9 || r1 > G.maior + G.c + 1e-9) {
            return recusarConica('ponto=' + pv[0].join(';') + ': o raio focal tem que ficar entre ' +
              arredondar(G.maior - G.c) + ' e ' + arredondar(G.maior + G.c));
          }
          var s = (G.maior - r1) / G.e;
          var outro = G.menor * Math.sqrt(Math.max(0, 1 - s * s / (G.maior * G.maior)));
          P = G.horizontal ? pt(h + s, kk + outro) : pt(h + outro, kk + s);
        } else {
          var t = 55 * Math.PI / 180;
          P = pt(h + a * Math.cos(t), kk + b * Math.sin(t));
        }
      } else if (tipo === 'hiperbole') {
        var xh;
        if (rf !== null) {
          xh = (parseFloat(rf) + a) / G.e;
          if (xh < a - 1e-9) return recusarConica('ponto=' + pv[0].join(';') + ': o raio focal tem que ser pelo menos ' + arredondar(G.c - a));
        } else xh = 1.5 * a;
        if (xh > caixa.x1 - h) G.alcanceY = b * Math.sqrt(xh * xh / (a * a) - 1) * 1.15;
        P = pt(h + xh, kk + b * Math.sqrt(Math.max(0, xh * xh / (a * a) - 1)));
        var xM = a * Math.sqrt(1 + (G.alcanceY / b) * (G.alcanceY / b));
        caixa = { x0: h - xM, y0: kk - G.alcanceY, x1: h + xM, y1: kk + G.alcanceY };
      } else {
        var xp;
        if (rf !== null) {
          xp = parseFloat(rf) - p / 2;
          if (xp < -1e-9) return recusarConica('ponto=' + pv[0].join(';') + ': a distancia ao foco e no minimo p/2 = ' + arredondar(p / 2));
        } else xp = 0.8 * p;
        P = pt(h + xp, kk + Math.sqrt(2 * p * Math.max(0, xp)));
        if (P.y - kk > G.alcanceY * 0.9) {
          G.alcanceY = (P.y - kk) * 1.15;
          caixa = { x0: h - p / 2, y0: kk - G.alcanceY, x1: h + G.alcanceY * G.alcanceY / (2 * p), y1: kk + G.alcanceY };
        }
        G.peDiretriz = pt(G.diretrizX, P.y);
        G.diretriz = true;
        if (!G.diretrizRotulo) G.diretrizRotulo = G.diretrizRotulo || null;
      }
      G.P = P;
      G.pontoNome = nome;
      G.r1 = B.geo.distancia(P, G.F1);
      G.r2 = tipo === 'parabola' ? Math.abs(P.x - G.diretrizX) : B.geo.distancia(P, G.F2);
    } else if (G.incognita !== null) {
      return recusarConica('incognita=' + G.incognita + ' pede ponto= para haver raio focal a marcar');
    }

    /* ---------------------------------------------- a caixa de unidades */
    var lu = caixa.x1 - caixa.x0, au = caixa.y1 - caixa.y0;
    var m = 0.14 * Math.max(lu, au);
    var u = { x0: caixa.x0 - m, y0: caixa.y0 - m, x1: caixa.x1 + m, y1: caixa.y1 + m };
    if (G.diretriz) u.x0 = Math.min(u.x0, G.diretrizX - 0.6 * m);
    if (eixos) {
      /* A origem fica dentro, com folga para os numeros da escala e para a
       * ponta da seta. */
      u.x0 = Math.min(u.x0, -0.8 * m); u.y0 = Math.min(u.y0, -0.8 * m);
      u.x1 = Math.max(u.x1, 0.8 * m); u.y1 = Math.max(u.y1, 0.8 * m);
    }
    G.unidades = u;
    return G;
  }

  /* ============================================================ poligono regular
   *
   * O hexagono decomposto em seis triangulos equilateros do MATEM3-12, e o resto
   * da familia pela mesma porta: n lados, lado ou raio cotado, a apotema com o
   * quadradinho no pe, as diagonais pelo centro com um triangulo preenchido.
   *
   * Chaves:
   *   lados=n            o numero de lados (padrao 6)
   *   lado=V[;R]         o lado, cotado no lado de baixo; raio=V[;R] o raio do
   *                      circulo circunscrito, cotado ate um vertice
   *   apotema=V[;R]      a apotema ate o meio de um lado, com o quadradinho
   *   decomposto=sim     as n diagonais pelo centro e o triangulo de baixo chapado
   *   centro=O           a letra do centro
   *   incognita=x        o angulo central de um triangulo (com decomposto) ou o
   *                      angulo interno de um vertice
   *
   * O poligono nasce apoiado num lado, que e a posicao prototipica (o
   * geo.poligonoRegular do base.js ja faz isso para n par e impar). */

  var poligonoregular = {
    chaves: ['lados', 'lado', 'raio', 'apotema', 'decomposto', 'centro', 'incognita'],
    metricas: ['lado', 'raio', 'apotema'],

    medir: function (d, op) {
      var B = base();
      var G = geometriaDoRegular(B, null, d);
      return {
        altura: op.altura != null ? op.altura
          : (G ? alturaParaCaixa(B, op, G.unidades, 120, 156) : null),
        legenda: d.legenda || null,
        /* Todas as medidas do regular se deduzem de uma so (lado, raio e
         * apotema estao amarrados por n), entao letra nunca e chute aqui. */
        foraDeEscala: d.escala === 'fora'
      };
    },

    desenhar: function (doc, d, op) {
      var B = base(), g = B.gerador(), COR = g.COR, D = desenho(), M = marcas();
      var G = geometriaDoRegular(B, doc, d);
      if (!G) return null;
      if (!D) {
        B.avisar(doc, 'poligonoregular: o figuras/desenho.js nao carregou');
        return null;
      }
      var fora = d.escala === 'fora';
      var corGab = corDaCamada(doc, d, COR);
      var corValor = corGab || undefined;

      return B.figura(doc, {
        x: op.x, largura: op.largura,
        altura: op.altura != null ? op.altura : alturaParaCaixa(B, op, G.unidades, 120, 156),
        unidades: G.unidades, legenda: d.legenda, foraDeEscala: fora,
        fase: d.fase, id: d.id, receita: 'poligonoregular'
      }, function (ctx) {
        var k = ctx.k, n = G.n;
        var C = ctx.p(pt(0, 0));
        var H = D.poligonoRegular(ctx, C, n, G.r * k, { desenhar: false });
        var V = H.pontos;
        var i;

        if (G.decomposto) {
          ctx.preenchimento(function () {
            chaparRegiao(ctx, [C, V[G.iBase], V[(G.iBase + 1) % n]]);
          });
        }
        ctx.contorno(function () { D.poligonoRegular(ctx, C, n, G.r * k, {}); });

        ctx.marcas(function () {
          if (G.decomposto) {
            for (i = 0; i < n; i++) D.poligono(ctx, [C, V[i]], { fechado: false, espessura: 0.6, papel: 'diagonal' });
          }
          if (G.raio) {
            var iv = G.decomposto ? (G.iBase + 2) % n : (G.iBase + 1) % n;
            if (!G.decomposto) D.poligono(ctx, [C, V[iv]], { fechado: false, espessura: 0.9, papel: 'objeto' });
            D.rotuloLado(ctx, G.raio.rotulo, C, V[iv], { lado: -1, tam: TAM_DADO, afastamento: 4, cor: corValor });
          }
          if (G.apotema) {
            var pe = H.pes[G.iApotema];
            D.poligono(ctx, [C, pe], { fechado: false, espessura: 0.9, papel: 'objeto' });
            D.rotuloLado(ctx, G.apotema.rotulo, C, pe, { lado: 1, tam: TAM_DADO, afastamento: 4, cor: corValor });
            if (M) M.marcaAnguloReto(ctx.doc, pe, C, V[G.iApotema], { ctx: ctx });
          }
          if (G.incognita) {
            var texto = G.incognita, corResp = corValor;
            if (d.fase === 'gabarito') {
              texto = G.incognita + ' = ' + arredondar(G.decomposto ? 360 / n : 180 - 360 / n) + '°';
              corResp = COR.teal;
            }
            if (M) {
              if (G.decomposto) {
                M.marcaAngulo(ctx.doc, C, V[G.iBase], V[(G.iBase + 1) % n],
                  { rotulo: texto, tam: TAM_DADO, ctx: ctx, cor: corValor, corRotulo: corResp });
              } else {
                var iv2 = (G.iBase + 1) % n;
                M.marcaAngulo(ctx.doc, V[iv2], V[(iv2 + 1) % n], V[(iv2 + n - 1) % n],
                  { rotulo: texto, tam: TAM_DADO, ctx: ctx, cor: corValor, corRotulo: corResp });
              }
            }
          }
        });

        ctx.rotulos(function () {
          if (G.lado) {
            D.rotuloLado(ctx, G.lado.rotulo, V[G.iBase], V[(G.iBase + 1) % n],
              { centro: C, tam: TAM_DADO, afastamento: 5, cor: corValor });
          }
          if (G.centro) {
            /* Separado (ver o nomearPonto): as diagonais, o raio e a apotema
             * nascem todos no centro, e nenhum angulo e pedido ali salvo pela
             * incognita, que ja traz o arco dela. */
            nomearPonto(ctx, C, G.centro, [
              { x: 0.7071, y: 0.7071 }, { x: -0.7071, y: 0.7071 },
              { x: 0.7071, y: -0.7071 }, { x: -0.7071, y: -0.7071 }
            ], { separado: true });
          }
        });
      });
    }
  };

  function geometriaDoRegular(B, doc, d) {
    function recusarRegular(t) { if (doc) B.avisar(doc, 'poligonoregular: ' + t); return null; }
    var nBruto = B.primeiro(d.args, 'lados');
    var n = nBruto === null ? 6 : Math.round(parseFloat(nBruto));
    if (!B.ehNumero(nBruto === null ? 6 : nBruto) || n < 3 || n > 24) return recusarRegular('lados=' + nBruto + ' pede um inteiro de 3 a 24');
    var lado = lerMedida(B, d.args, 'lado'), raio = lerMedida(B, d.args, 'raio');
    var apotema = lerMedida(B, d.args, 'apotema');
    var seno = Math.sin(Math.PI / n), cosseno = Math.cos(Math.PI / n);
    var r = null, origem = null;
    function fixarRaioDoRegular(v, de) {
      if (v === null) return true;
      if (!(v > 0)) { recusarRegular(de + ' tem que ser positivo'); return false; }
      if (r === null) { r = v; origem = de; return true; }
      if (Math.abs(r - v) > 0.005 * Math.max(r, v)) {
        recusarRegular(de + ' da raio ' + arredondar(v) + ' e ' + origem + ' da raio ' + arredondar(r));
        return false;
      }
      return true;
    }
    if (!fixarRaioDoRegular(raio && raio.valor !== null ? raio.valor : null, 'raio')) return null;
    if (!fixarRaioDoRegular(lado && lado.valor !== null ? lado.valor / (2 * seno) : null, 'lado')) return null;
    if (!fixarRaioDoRegular(apotema && apotema.valor !== null ? apotema.valor / cosseno : null, 'apotema')) return null;
    if (r === null) r = 5;
    /* O lado de baixo e o de indice (n - 1) / 2 arredondado para baixo na volta
     * do geo.poligonoRegular; a apotema vai para o lado oposto a ele, para nao
     * cruzar o triangulo chapado nem o rotulo do lado. */
    var iBase = Math.floor((n - 1) / 2);
    var iApotema = (iBase + Math.floor(n / 2)) % n;
    if (n % 2 === 1) iApotema = (iBase + Math.floor(n / 2) + 1) % n;
    var margem = 0.32 * r;
    return {
      n: n, r: r, lado: lado, raio: raio, apotema: apotema,
      decomposto: ehSim(B.primeiro(d.args, 'decomposto')),
      centro: B.primeiro(d.args, 'centro') ? String(B.primeiro(d.args, 'centro')) : null,
      incognita: B.primeiro(d.args, 'incognita') ? String(B.primeiro(d.args, 'incognita')) : null,
      iBase: iBase, iApotema: iApotema,
      unidades: { x0: -r - margem, y0: -r - margem, x1: r + margem, y1: r + margem }
    };
  }

  /* ============================================================ pi desenrolado
   *
   * A figura mais didatica do MAT08-13: a circunferencia de diametro d, e
   * abaixo dela o barbante esticado, com tres copias de d enfileiradas e a
   * sobra cotada. E a unica forma de VER por que pi e "3 e um pouco".
   *
   * Chaves:
   *   diametro=d[;R]     o rotulo do diametro (e das tres copias)
   *   sobra=R            o rotulo da sobra; vem do tema. Escreva 0.14·d (com o
   *                      ponto de multiplicar) e nao 0.14d: numero colado em
   *                      letra e a forma de "2x", e a trava do valor solto do
   *                      base.js le isso como valor de angulo sem arco
   *
   * O segmento mede pi vezes d por construcao, em unidades, e a
   * _prova_receitas_circulo.js confere no fluxo que tres d mais a sobra dao pi
   * vezes d com erro abaixo de 0,5 pt. Cinco marcas, e sao as cinco: o d do
   * diametro, os tres d das copias e a sobra. Nao ha cota do comprimento
   * inteiro porque ela seria a sexta; o nome do comprimento (C, pi vezes d)
   * mora no paragrafo ao lado, que e onde o tema o define.
   *
   * A conta foi REFEITA nesta rodada, com o pedido em maos de cotar o segmento
   * inteiro como C: com a cota a figura sai com seis marcas ativas contra o
   * teto de cinco, e o conferirFigura reprova o tema com "marcas ativas: 6, o
   * teto e 5" (medido). Nao ha marca sobrando para trocar, porque as tres
   * copias do d e a sobra sao o que a figura existe para mostrar. Cotar o C
   * aqui e decisao de teto e de tema, nao de receita: pede uma chave nova na
   * diretiva (comprimento=, como a da receita rodando, para o nome vir do tema
   * e nao nascer no desenhador) e alguem que abra mao de uma das cinco. O que
   * ESTA consertado aqui e a seta, que era a metade do problema que ensinava
   * errado. */

  var pidesenrolado = {
    chaves: ['diametro', 'sobra'],
    metricas: [],

    medir: function (d, op) {
      var B = base();
      return {
        altura: op.altura != null ? op.altura : alturaParaCaixa(B, op, caixaDoPi(), 150, 210),
        legenda: d.legenda || null,
        foraDeEscala: d.escala === 'fora'
      };
    },

    desenhar: function (doc, d, op) {
      var B = base(), g = B.gerador(), COR = g.COR, D = desenho(), M = marcas();
      if (!D) { B.avisar(doc, 'pidesenrolado: o figuras/desenho.js nao carregou'); return null; }
      var diam = lerMedida(B, d.args, 'diametro');
      var rotuloD = diam ? diam.rotulo : 'd';
      var sobra = B.primeiro(d.args, 'sobra');
      if (sobra === null) {
        B.avisar(doc, 'pidesenrolado: a sobra e o que a figura existe para mostrar e o rotulo dela vem do tema: escreva sobra=0.14d (ou o texto da sua lingua)');
      }
      var corGab = corDaCamada(doc, d, COR);
      var corValor = corGab || undefined;
      var U = caixaDoPi();

      return B.figura(doc, {
        x: op.x, largura: op.largura,
        altura: op.altura != null ? op.altura : alturaParaCaixa(B, op, U, 150, 210),
        unidades: U, legenda: d.legenda, foraDeEscala: d.escala === 'fora',
        fase: d.fase, id: d.id, receita: 'pidesenrolado'
      }, function (ctx) {
        var k = ctx.k;
        var C = ctx.p(pt(0.5, 0.85));
        var y0 = 0;
        var marcos = [0, 1, 2, 3, Math.PI];
        var Pm = [];
        for (var i = 0; i < marcos.length; i++) Pm.push(ctx.p(pt(marcos[i], y0)));

        ctx.contorno(function () {
          D.circunferencia(ctx, C, 0.5 * k, {});
          D.poligono(ctx, [Pm[0], Pm[4]], { fechado: false, cor: COR.texto, espessura: 1.2 });
          /* Tacos de extremo em cada marco: sem eles as tres copias leem como um
           * segmento so, e a sobra some. Sao contorno da regua, nao marca a ler
           * (anotados como marca eles sozinhos passavam do teto). */
          for (var t = 0; t < Pm.length; t++) {
            D.poligono(ctx, [pt(Pm[t].x, Pm[t].y - 3.5), pt(Pm[t].x, Pm[t].y + 3.5)],
              { fechado: false, espessura: 0.9 });
          }
        });

        ctx.marcas(function () {
          D.cotaRadial(ctx, C, 0.5 * k, rotuloD, { tipo: 'diametro', angulo: 0, lado: 1, em: 0.72, tam: TAM_DADO, corTexto: corValor });
          /* Do circulo para o barbante: a seta diz que e o mesmo comprimento
           * desenrolado, e ela aponta para a marca de INICIO da regua.
           *
           * Ela apontava para baixo, reta, e pousava em x = 200,89 pt: o meio
           * exato do primeiro intervalo d (que vai de 155,71 a 246,06). Medido
           * assim, a seta ficava a 0,00 pt do meio do primeiro d e a 45,18 pt
           * da marca zero, ou seja dizia "esta circunferencia e este pedaco
           * aqui", que e justamente a leitura errada: a circunferencia e o
           * segmento INTEIRO, e o primeiro pedaco e um diametro. Apontando para
           * a marca zero ela passa a dizer onde o desenrolar comeca. */
          D.seta(ctx, ctx.p(pt(0.5, 0.35)), ctx.p(pt(0, 0.09)), { espessura: 0.6, tam: 5 });
          if (sobra !== null) {
            D.cota(ctx, Pm[3], Pm[4], String(sobra), { lado: 1, afastamento: 12, tam: TAM_DADO, corTexto: corValor });
          }
        });

        ctx.rotulos(function () {
          for (var s = 0; s < 3; s++) {
            D.rotuloLado(ctx, rotuloD, Pm[s], Pm[s + 1], { lado: -1, tam: TAM_DADO, afastamento: 5, cor: corValor });
          }
        });
      });
    }
  };

  function caixaDoPi() {
    return { x0: -0.12, y0: -0.5, x1: Math.PI + 0.12, y1: 1.47 };
  }

  /* ============================================================ pista
   *
   * O retangulo com um semicirculo colado em cada lado menor (exercicio 16 do
   * MAT08-13). O perimetro sai em 1,2 pt; os dois lados menores, que NAO entram
   * no perimetro, saem em guia [2 2] de 0,6 pt por dentro, e e essa diferenca
   * de traco que mostra a armadilha da questao. O interior vai em COR.soft, que
   * e apoio e nao regiao pedida.
   *
   * Chaves: comprimento=V[;R] e largura=V[;R], cotados nos dois lados. */

  var pista = {
    chaves: ['comprimento', 'largura'],
    metricas: ['comprimento', 'largura'],

    medir: function (d, op) {
      var B = base();
      var G = geometriaDaPista(B, null, d);
      return {
        altura: op.altura != null ? op.altura : (G ? alturaParaCaixa(B, op, G.unidades, 100, 150) : null),
        legenda: d.legenda || null,
        foraDeEscala: G ? G.fora : d.escala === 'fora'
      };
    },

    desenhar: function (doc, d, op) {
      var B = base(), g = B.gerador(), COR = g.COR, D = desenho();
      var G = geometriaDaPista(B, doc, d);
      if (!G) return null;
      if (!D) { B.avisar(doc, 'pista: o figuras/desenho.js nao carregou'); return null; }
      var fora = G.fora;
      var corGab = corDaCamada(doc, d, COR);
      var corValor = corGab || undefined;

      return B.figura(doc, {
        x: op.x, largura: op.largura,
        altura: op.altura != null ? op.altura : alturaParaCaixa(B, op, G.unidades, 100, 150),
        unidades: G.unidades, legenda: d.legenda, foraDeEscala: fora,
        fase: d.fase, id: d.id, receita: 'pista'
      }, function (ctx) {
        var k = ctx.k, L = G.L, W = G.W;
        var A = ctx.p(pt(0, 0)), Bq = ctx.p(pt(L, 0)), Cq = ctx.p(pt(L, W)), Dq = ctx.p(pt(0, W));
        var CE = ctx.p(pt(0, W / 2)), CD = ctx.p(pt(L, W / 2));

        ctx.preenchimento(function () {
          chaparRegiao(ctx, [
            [A, Bq, Cq, Dq],
            { centro: CE, raio: W / 2 * k, de: 90, ate: 270, setor: false },
            { centro: CD, raio: W / 2 * k, de: -90, ate: 90, setor: false }
          ], COR.soft);
        });
        ctx.contorno(function () {
          D.poligono(ctx, [A, Bq], { fechado: false, cor: COR.texto, espessura: 1.2 });
          D.poligono(ctx, [Dq, Cq], { fechado: false, cor: COR.texto, espessura: 1.2 });
          D.arco(ctx, CE, W / 2 * k, W / 2 * k, 90, 270, { espessura: 1.2 });
          D.arco(ctx, CD, W / 2 * k, W / 2 * k, -90, 90, { espessura: 1.2 });
          guia(ctx, A, Dq, true);
          guia(ctx, Bq, Cq, true);
        });
        ctx.marcas(function () {
          /* O comprimento e a armadilha da questao, e por isso ele sai em COTA
           * e nao em rotulo de lado. Medido na folha do MAT08-13 (exercicio
           * 16): o "84" era um numero solto 9,84 pt abaixo da aresta de baixo,
           * centrado num x que e ao mesmo tempo o meio do retangulo (297,64 pt)
           * e o meio da silhueta inteira (297,64 pt tambem, porque os dois
           * semicirculos sao iguais). Nada dizia onde a medida comeca e onde
           * ela acaba, e a aluna lia 84 como a pista toda, o que faz o
           * retangulo virar 84 menos 60 e derruba a questao inteira.
           *
           * Com a cota, as duas linhas de chamada descem das PONTAS do
           * retangulo, que e exatamente onde os semicirculos comecam: o vao
           * medido tem inicio e fim visiveis. E o mesmo tratamento que o C do
           * exercicio 17 (a receita rodando) ja tinha. */
          D.cota(ctx, A, Bq, G.mL.rotulo, { lado: -1, afastamento: 12, tam: TAM_DADO, corTexto: corValor });
        });
        ctx.rotulos(function () {
          D.rotuloLado(ctx, G.mW.rotulo, A, Dq, { lado: -1, tam: TAM_DADO, afastamento: 5, cor: corValor });
        });
      });
    }
  };

  function geometriaDaPista(B, doc, d) {
    var mL = lerMedida(B, d.args, 'comprimento') || medidaDe(B, '84');
    var mW = lerMedida(B, d.args, 'largura') || medidaDe(B, '60');
    var L = mL.valor !== null ? mL.valor : 84;
    var W = mW.valor !== null ? mW.valor : 60;
    if (!(L > 0) || !(W > 0)) { if (doc) B.avisar(doc, 'pista: comprimento e largura tem que ser positivos'); return null; }
    var m = 0.16 * W;
    return {
      L: L, W: W, mL: mL, mW: mW,
      fora: escalaDe(d, mL.valor !== null || mW.valor !== null, mL.letra || mW.letra),
      unidades: { x0: -W / 2 - m, y0: -m, x1: L + W / 2 + m, y1: W + m }
    };
  }

  /* ============================================================ rodando
   *
   * A roda rolando: a circunferencia em tres posicoes sobre a reta (no inicio,
   * depois de meia volta e depois de uma volta inteira), a marca no aro
   * acompanhando o giro (embaixo, em cima, embaixo) e o trecho da reta entre a
   * primeira e a ultima posicao cotado: uma volta e um comprimento.
   *
   * Chaves: raio=V[;R] ou diametro=V[;R] (cotado na primeira roda) e
   * comprimento=R, o rotulo da cota de uma volta, que vem do tema. */

  var rodando = {
    chaves: ['raio', 'diametro', 'comprimento'],
    metricas: ['raio', 'diametro'],

    medir: function (d, op) {
      var B = base();
      var G = geometriaDaRoda(B, null, d);
      return {
        altura: op.altura != null ? op.altura : (G ? alturaParaCaixa(B, op, G.unidades, 100, 150) : null),
        legenda: d.legenda || null,
        /* Uma medida so (o raio ou o diametro), entao nada e chute aqui. */
        foraDeEscala: d.escala === 'fora'
      };
    },

    desenhar: function (doc, d, op) {
      var B = base(), g = B.gerador(), COR = g.COR, D = desenho();
      var G = geometriaDaRoda(B, doc, d);
      if (!G) return null;
      if (!D) { B.avisar(doc, 'rodando: o figuras/desenho.js nao carregou'); return null; }
      var fora = d.escala === 'fora';
      var corGab = corDaCamada(doc, d, COR);
      var corValor = corGab || undefined;

      return B.figura(doc, {
        x: op.x, largura: op.largura,
        altura: op.altura != null ? op.altura : alturaParaCaixa(B, op, G.unidades, 100, 150),
        unidades: G.unidades, legenda: d.legenda, foraDeEscala: fora,
        fase: d.fase, id: d.id, receita: 'rodando'
      }, function (ctx) {
        var k = ctx.k, r = G.r;
        var volta = 2 * Math.PI * r;
        var centros = [ctx.p(pt(0, r)), ctx.p(pt(volta / 2, r)), ctx.p(pt(volta, r))];
        var chao0 = ctx.p(pt(-1.4 * r, 0)), chao1 = ctx.p(pt(volta + 1.4 * r, 0));
        var marcas3 = [ctx.p(pt(0, 0)), ctx.p(pt(volta / 2, 2 * r)), ctx.p(pt(volta, 0))];

        ctx.contorno(function () {
          D.poligono(ctx, [chao0, chao1], { fechado: false, cor: COR.texto, espessura: 1.2 });
          for (var i = 0; i < 3; i++) D.circunferencia(ctx, centros[i], r * k, {});
        });
        ctx.marcas(function () {
          if (G.medida) {
            D.cotaRadial(ctx, centros[0], r * k, G.medida.rotulo, {
              tipo: G.medida.tipo, angulo: G.medida.tipo === 'diametro' ? 0 : 60, lado: 1,
              em: G.medida.tipo === 'diametro' ? 0.72 : 0.5, tam: TAM_DADO, corTexto: corValor
            });
          }
          if (G.comprimento !== null) {
            D.cota(ctx, marcas3[0], marcas3[2], G.comprimento, { lado: -1, afastamento: 12, tam: TAM_DADO, corTexto: corValor });
          }
        });
        ctx.rotulos(function () {
          for (var i = 0; i < 3; i++) D.ponto(ctx, marcas3[i], {});
        });
      });
    }
  };

  function geometriaDaRoda(B, doc, d) {
    var raio = lerMedida(B, d.args, 'raio'), diam = lerMedida(B, d.args, 'diametro');
    var r = 1;
    if (raio && raio.valor !== null) r = raio.valor;
    else if (diam && diam.valor !== null) r = diam.valor / 2;
    if (!(r > 0)) { if (doc) B.avisar(doc, 'rodando: o raio tem que ser positivo'); return null; }
    var comprimento = B.primeiro(d.args, 'comprimento');
    if (comprimento === null && doc) {
      B.avisar(doc, 'rodando: a cota de uma volta e o que a figura mostra e o rotulo dela vem do tema: escreva comprimento=C (ou o texto da sua lingua)');
    }
    var medida = raio ? { rotulo: raio.rotulo, tipo: 'raio' } : (diam ? { rotulo: diam.rotulo, tipo: 'diametro' } : null);
    var volta = 2 * Math.PI * r;
    return {
      r: r, medida: medida, comprimento: comprimento === null ? null : String(comprimento),
      unidades: { x0: -1.5 * r, y0: -0.75 * r, x1: volta + 1.5 * r, y1: 2.3 * r }
    };
  }

  /* ============================================================ solido
   *
   * A ponte entre a diretiva @fig e o figuras/solidos.js. Nenhum solido e
   * desenhado aqui: cada tipo vira UMA chamada a funcao de solido (prisma,
   * cilindro, piramide, cone, esfera) ou a composicao (coneComTriangulo,
   * piramideComTriangulo, cilindroComEsfera, prismaTriangular,
   * planificacaoDoCone) do solidos.js, e o que mora nesta receita e regra de
   * receita: ler as chaves, resolver o que a diretiva deixou em letra, decidir
   * a escala, escolher a tinta da camada de gabarito, medir o bloco e passar
   * id, fase, legenda e receita para o figura() registrar. O solido simples e
   * rotulado com o que o solidos.js exporta para isso (rotuloColado,
   * linhaInterna e as posicoes EM_*), nas mesmas posicoes da celula do painel
   * dele, porque as funcoes de solido devolvem os pontos-chave justamente
   * "para a receita cotar em cima".
   *
   * Chaves:
   *   tipo=T             prisma, cilindro, piramide, cone, esfera, prismatriangular
   *   aresta=V[;R]       a aresta da base (prisma, piramide); lado= e a mesma chave
   *   profundidade=V[;R] a aresta de fuga do prisma; sem ela a base e quadrada,
   *                      que e o padrao do proprio solidos.js
   *   altura=V[;R]       a altura
   *   raio=V[;R]         o raio (cilindro, cone, esfera)
   *   geratriz=V[;R]     a geratriz do cone, na silhueta da direita
   *   apotema=V[;R]      piramide com triangulo: o apotema da face (a hipotenusa)
   *   apotemabase=V[;R]  piramide com triangulo: do centro ao meio do lado
   *   triangulo=sim      cone ou piramide: o triangulo retangulo interno,
   *                      preenchido, com o quadradinho no pe da altura
   *   esfera=inscrita    cilindro: a esfera que toca as duas bases e a lateral;
   *                      a altura E o diametro dela e sai cotada por fora
   *   planificacao=sim   cone: o setor plano a esquerda, a seta e o cone montado
   *                      a direita; angulo=G e o angulo do setor (180 por
   *                      padrao), setor=V[;R] rotula o raio do setor e arco=R
   *                      rotula o arco (10π), que e o que vira a circunferencia
   *                      da base
   *   centro=O           a letra do centro (esfera; cilindro com esfera; cone e
   *                      piramide com triangulo)
   *
   * O primeiro valor numerico CONSTROI e a letra so rotula: raio=5 altura=12
   * geratriz=g desenha o cone de 5 por 12 e escreve g na geratriz. Nenhuma
   * palavra nasce aqui: altura=h escreve h, altura=height escreve height, e
   * sem a chave a medida nao e rotulada.
   *
   * Deduzido nao e chute. A geratriz de raio=5 altura=12, a altura 2r do
   * cilindro com esfera, o raio do cone que o setor monta e o apotema da base
   * (metade da aresta) saem da conta e a figura continua fiel; a altura de um
   * cone que so trouxe o raio nao sai de nada, e chutada na proporcao do
   * prototipo do painel e a figura sai fora de escala, com a legenda que o
   * tema escreve. Numero dado que contradiz a conta (geratriz=12 com raio=5 e
   * altura=12) recusa a figura com aviso, em vez de desenhar uma que mente.
   *
   * Camada de gabarito. Pela regra do codigo de cor deste arquivo, teal marca
   * o que a resposta ACRESCENTA: na figura rechamada pelo id, a letra que a
   * conta resolve sai como "g = 13" em teal e o que ja estava impresso fica
   * preto; na figura que nasce no gabarito todo valor sai em teal. Isso vale
   * inteiro nos tipos que esta receita rotula com as primitivas (os cinco
   * solidos simples): la o valor resolvido vai com halo, e foge com fio de
   * chamada quando nao cabe onde a letra cabia. Nas cinco COMPOSICOES valem
   * duas restricoes, as duas do lado do solidos.js: o texto resolvido sai na
   * tinta do contorno, porque elas recebem os rotulos como texto e nao tem
   * porta para a cor de cada um (a receita manda a cor em op.cores, com as
   * mesmas chaves de op.rotulos, para o dia em que o solidos.js ler esse
   * campo); e so os rotulos que elas poem com halo recebem o valor resolvido,
   * porque a letra colada nao tem lugar para "a = 5" (ver
   * COLADOS_DA_COMPOSICAO). A folha do gabarito de uma composicao fica sem
   * teal e com a letra colada como veio, e nao fica errada.
   *
   * Sem giro: a fuga e uma constante da folha inteira, por decisao escrita no
   * cabecalho do solidos.js, e um solido girado teria a altura fora da vertical
   * e o quadradinho do triangulo interno virando losango. */

  var FOLGA_SOLIDO = 22;          // o anel das composicoes com letra colada
  var FOLGA_SOLIDO_COTADO = 28;   // o anel das composicoes com cota de seta por fora
  var ALTURA_SOLIDO_MIN = 120;
  var ALTURA_SOLIDO_MAX = 160;
  var ALTURA_PLANIFICACAO = 170;  // a mesma da composicao, que e larga e baixa
  var TIPOS_DE_SOLIDO = ['prisma', 'cilindro', 'piramide', 'cone', 'esfera', 'prismatriangular'];
  var DIMS_POR_TIPO = {
    prisma: ['aresta', 'profundidade', 'altura'], cilindro: ['raio', 'altura'],
    piramide: ['aresta', 'altura'], cone: ['raio', 'altura'], esfera: ['raio'],
    prismatriangular: ['lado', 'altura']
  };
  /* Qual rotulo de cada composicao vem de qual medida da diretiva. */
  var ROTULOS_DA_COMPOSICAO = {
    coneComTriangulo: { raio: 'raio', altura: 'altura', geratriz: 'geratriz' },
    piramideComTriangulo: { altura: 'altura', apotemaBase: 'apotemabase', apotema: 'apotema' },
    cilindroComEsfera: { raio: 'raio', altura: 'altura' },
    prismaTriangular: { lado: 'aresta', altura: 'altura' },
    planificacaoDoCone: { raioSetor: 'setor', raio: 'raio', altura: 'altura', geratriz: 'geratriz' }
  };

  /* A proporcao do prototipo de cada solido, que e a do painel do solidos.js,
   * mais as medidas que se deduzem dela, para a diretiva que so trouxe a
   * geratriz ou o apotema ainda chutar as outras na mesma proporcao. */
  function prototipoDoSolido(S, tipo) {
    var d = S.DIMS_PAINEL;
    if (tipo === 'prisma') return { aresta: d.prisma.aresta, profundidade: d.prisma.profundidade, altura: d.prisma.altura };
    if (tipo === 'prismatriangular') return { lado: d.prisma.aresta, altura: d.prisma.altura };
    if (tipo === 'cilindro') return { raio: d.cilindro.raio, altura: d.cilindro.altura };
    if (tipo === 'piramide') {
      return {
        aresta: d.piramide.aresta, altura: d.piramide.altura, apotemabase: d.piramide.aresta / 2,
        apotema: Math.sqrt(d.piramide.altura * d.piramide.altura + d.piramide.aresta * d.piramide.aresta / 4)
      };
    }
    if (tipo === 'cone') {
      return { raio: d.cone.raio, altura: d.cone.altura, geratriz: Math.sqrt(d.cone.raio * d.cone.raio + d.cone.altura * d.cone.altura) };
    }
    return { raio: d.esfera.raio };
  }

  /* Uma medida com sinonimo (aresta e lado): qualquer um dos dois serve, e os
   * dois juntos e numericos tem que concordar. Devolve false na discordancia. */
  function lerMedidaDupla(B, args, a, b, recusar) {
    var ma = lerMedida(B, args, a), mb = lerMedida(B, args, b);
    if (ma && mb && ma.valor !== null && mb.valor !== null && Math.abs(ma.valor - mb.valor) > 1e-9) {
      recusar(a + '=' + ma.bruto + ' e ' + b + '=' + mb.bruto + ' nao concordam');
      return false;
    }
    return ma || mb;
  }

  /* O numero de uma medida: o dado, ou o deduzido pela conta. */
  function numeroDaMedida(m) {
    if (!m) return null;
    if (m.valor !== null) return m.valor;
    return m.deduzido != null ? m.deduzido : null;
  }

  /* Fecha uma medida pela conta: med[k] e a entrada, que pode nem existir.
   *
   * A medida nao e so rotulo, e tambem a dimensao que constroi o desenho: uma
   * chave que o tema nao escreveu ainda assim CONTA, porque apotemabase=3
   * altura=4 apotema=m tem a aresta 6 escondida na conta e sem ela a figura
   * desenha 1,54 onde imprime 3. Por isso a chave ausente ganha aqui a entrada
   * MUDA (a mesma forma da profundidade calada do prisma): dimensao correta,
   * rotulo nenhum. As mudas saem da lista no fim do geometriaDoSolido, antes
   * de virar rotulo.
   *
   * Numero dado tem que bater com a conta (meio por cento), senao a figura e
   * recusada; letra ganha o valor deduzido, que e o que a camada de gabarito
   * escreve. */
  function deduzir(med, k, valor, recusar) {
    if (!(valor > 0) || !isFinite(valor)) return true;
    var m = med[k];
    if (!m) {
      med[k] = { bruto: '', valor: null, rotulo: '', letra: true, explicito: false, deduzido: valor, calada: true };
      return true;
    }
    if (m.valor !== null) {
      if (Math.abs(m.valor - valor) > 0.005 * Math.max(m.valor, valor)) {
        recusar(k + '=' + m.bruto + ' nao bate com o que as outras medidas dao, ' + arredondar(valor));
        return false;
      }
      return true;
    }
    m.deduzido = valor;
    return true;
  }

  /* As entradas mudas levantaram a dimensao e nao tem rotulo para imprimir:
   * saem da lista antes de o desenhar montar os rotulos. */
  function calarMudas(med) {
    for (var k in med) {
      if (Object.prototype.hasOwnProperty.call(med, k) && med[k] && med[k].calada) med[k] = null;
    }
  }

  /* As dimensoes que o solidos.js vai desenhar: o numero dado, o deduzido, ou
   * o prototipo na escala do primeiro numero que a diretiva trouxe. So o
   * terceiro caso e chute, e so ele poe a figura fora de escala.
   *
   * refPadrao e a referencia de escala de FORA, que so o painel passa: o
   * solido que nao tem numero nenhum seu desenha o prototipo no fator do
   * painel, e nao no fator 1, senao ele sai na ordem de grandeza 1 contra 6 a
   * 10 dos vizinhos e vira um pingo na escala comum. */
  function dimensoesDoSolido(proto, med, chaves, refPadrao) {
    var ref = null, k, i;
    for (k in med) {
      if (!Object.prototype.hasOwnProperty.call(med, k)) continue;
      if (med[k] && med[k].valor !== null && proto[k]) { ref = med[k].valor / proto[k]; break; }
    }
    if (ref === null && refPadrao != null && isFinite(refPadrao) && refPadrao > 0) ref = refPadrao;
    var dims = {}, chute = false;
    for (i = 0; i < chaves.length; i++) {
      k = chaves[i];
      var v = numeroDaMedida(med[k]);
      if (v !== null) dims[k] = v;
      else { dims[k] = proto[k] * (ref !== null ? ref : 1); if (ref !== null) chute = true; }
    }
    return { dims: dims, chute: chute, numerico: ref !== null };
  }

  /* Toda a leitura e a conta do solido, sem desenhar nada. E chamada para medir
   * e para desenhar, e por isso os avisos so saem quando ha doc. Devolve null
   * quando a diretiva se contradiz. */
  function geometriaDoSolido(B, S, doc, d) {
    function recusarSolido(t) { if (doc) B.avisar(doc, 'solido: ' + t); return null; }
    function avisarSolido(t) { if (doc) B.avisar(doc, 'solido: ' + t); }
    var tipo = String(B.primeiro(d.args, 'tipo') || '').toLowerCase();
    if (tipo === 'painel') return recusarSolido('o painel dos cinco e a receita painelsolidos');
    if (TIPOS_DE_SOLIDO.indexOf(tipo) < 0) {
      return recusarSolido('tipo=' + (tipo || '(vazio)') + ' nao e um de ' + TIPOS_DE_SOLIDO.join(', '));
    }

    var aresta = lerMedidaDupla(B, d.args, 'aresta', 'lado', recusarSolido);
    if (aresta === false) return null;
    var med = {
      aresta: aresta, profundidade: lerMedida(B, d.args, 'profundidade'),
      altura: lerMedida(B, d.args, 'altura'), raio: lerMedida(B, d.args, 'raio'),
      geratriz: lerMedida(B, d.args, 'geratriz'), apotema: lerMedida(B, d.args, 'apotema'),
      apotemabase: lerMedida(B, d.args, 'apotemabase'), setor: lerMedida(B, d.args, 'setor')
    };
    var k;
    for (k in med) {
      if (med[k] && med[k].valor !== null && !(med[k].valor > 0)) return recusarSolido(k + '=' + med[k].bruto + ' tem que ser positivo');
    }
    var centro = B.primeiro(d.args, 'centro');
    centro = centro === null ? null : String(centro);
    var arco = B.primeiro(d.args, 'arco');
    arco = arco === null ? null : String(arco);
    var triangulo = ehSim(B.primeiro(d.args, 'triangulo'));
    var esferaBruto = B.primeiro(d.args, 'esfera');
    var esfera = esferaBruto !== null && (ehSim(esferaBruto) || /^(inscrita|inscribed)$/i.test(String(esferaBruto).trim()));
    var planif = ehSim(B.primeiro(d.args, 'planificacao'));
    var anguloBruto = B.primeiro(d.args, 'angulo');
    var angulo = anguloBruto === null ? 180 : (B.ehNumero(anguloBruto) ? parseFloat(anguloBruto) : NaN);

    /* Chave que so faz sentido num tipo avisa nos outros e e ignorada, em vez
     * de trocar o tipo por baixo do pano. */
    if (triangulo && tipo !== 'cone' && tipo !== 'piramide') { avisarSolido('triangulo=sim so vale para cone e piramide, ignorado em ' + tipo); triangulo = false; }
    if (esfera && tipo !== 'cilindro') { avisarSolido('esfera=inscrita so vale para cilindro, ignorada em ' + tipo); esfera = false; }
    if (planif && tipo !== 'cone') { avisarSolido('planificacao=sim so vale para cone, ignorada em ' + tipo); planif = false; }
    if ((med.apotema || med.apotemabase) && !(tipo === 'piramide' && triangulo)) avisarSolido('apotema= e apotemabase= so saem na piramide com triangulo=sim, ignorados');
    if (med.geratriz && tipo !== 'cone') avisarSolido('geratriz= so vale para cone, ignorada em ' + tipo);
    if (med.setor && !planif) avisarSolido('setor= so vale com planificacao=sim, ignorado');
    if (arco && !planif) avisarSolido('arco= so vale com planificacao=sim, ignorado');
    var temCentro = tipo === 'esfera' || (tipo === 'cilindro' && esfera) || ((tipo === 'cone' || tipo === 'piramide') && triangulo);
    if (centro && !temCentro) avisarSolido('centro= nao tem onde sair em ' + tipo + ' sem composicao, ignorado');

    var proto = prototipoDoSolido(S, tipo);
    var comp = null, dims = null, dimsComp = null, unidades = null;
    var folga = FOLGA_SOLIDO, numerico = false, chute = false, res;
    var va, vh, vm, vr, vg;

    if (tipo === 'cone' && planif) {
      /* O setor monta o cone: R e o raio do setor e a geratriz, r = R vezes o
       * angulo sobre 360 e h fecha por Pitagoras. R vem do primeiro numero que
       * o diga (geratriz, setor, raio ou altura) e os outros tem que bater. */
      comp = 'planificacaoDoCone';
      if (!(angulo > 0 && angulo < 360)) return recusarSolido('angulo=' + anguloBruto + ' pede um numero entre 0 e 360');
      var fr = angulo / 360, R = null, origemR = null;
      var candidatos = [
        ['geratriz', med.geratriz && med.geratriz.valor !== null ? med.geratriz.valor : null],
        ['setor', med.setor && med.setor.valor !== null ? med.setor.valor : null],
        ['raio', med.raio && med.raio.valor !== null ? med.raio.valor / fr : null],
        ['altura', med.altura && med.altura.valor !== null ? med.altura.valor / Math.sqrt(1 - fr * fr) : null]
      ];
      for (k = 0; k < candidatos.length; k++) {
        var cv = candidatos[k][1];
        if (cv === null) continue;
        if (R === null) { R = cv; origemR = candidatos[k][0]; continue; }
        if (Math.abs(R - cv) > 0.005 * Math.max(R, cv)) {
          return recusarSolido(candidatos[k][0] + ' da raio do setor ' + arredondar(cv) + ' e ' + origemR + ' da ' + arredondar(R));
        }
      }
      numerico = R !== null;
      if (R === null) R = 1;
      var rc = R * fr, hc = Math.sqrt(R * R - rc * rc);
      if (numerico) {
        if (!deduzir(med, 'geratriz', R, recusarSolido)) return null;
        if (!deduzir(med, 'setor', R, recusarSolido)) return null;
        if (!deduzir(med, 'raio', rc, recusarSolido)) return null;
        if (!deduzir(med, 'altura', hc, recusarSolido)) return null;
      }
      dims = { raio: rc, altura: hc };
      dimsComp = { raio: R, angulo: angulo };
    } else if (tipo === 'cone') {
      /* g ao quadrado igual a r ao quadrado mais h ao quadrado: duas medidas
       * numericas fecham a terceira. */
      vr = med.raio ? med.raio.valor : null; vh = med.altura ? med.altura.valor : null; vg = med.geratriz ? med.geratriz.valor : null;
      if (vr !== null && vh !== null) { if (!deduzir(med, 'geratriz', Math.sqrt(vr * vr + vh * vh), recusarSolido)) return null; }
      else if (vr !== null && vg !== null) {
        if (vg <= vr) return recusarSolido('geratriz=' + med.geratriz.bruto + ' nao pode ser menor ou igual ao raio ' + med.raio.bruto);
        if (!deduzir(med, 'altura', Math.sqrt(vg * vg - vr * vr), recusarSolido)) return null;
      } else if (vh !== null && vg !== null) {
        if (vg <= vh) return recusarSolido('geratriz=' + med.geratriz.bruto + ' nao pode ser menor ou igual a altura ' + med.altura.bruto);
        if (!deduzir(med, 'raio', Math.sqrt(vg * vg - vh * vh), recusarSolido)) return null;
      }
      res = dimensoesDoSolido(proto, med, DIMS_POR_TIPO.cone);
      dims = res.dims; numerico = res.numerico; chute = res.chute;
      if (triangulo) { comp = 'coneComTriangulo'; dimsComp = dims; }
    } else if (tipo === 'piramide') {
      /* O apotema da base e metade da aresta; o apotema da face fecha com a
       * altura por Pitagoras.
       *
       * A altura e o apotema da face fecham o apotema da BASE direto, sem
       * passar pela aresta: assim apotemabase= numerico e conferido mesmo
       * quando a diretiva nao escreve aresta=, e as tres combinacoes de duas
       * medidas fecham as outras duas, como o cone ja faz. Antes disso
       * altura=4 apotema=5 apotemabase=99 saia DESENHADO, com 99 impresso em
       * cima de uma medida que valia 1,54 e cujo valor certo e 3. */
      vh = med.altura ? med.altura.valor : null; vm = med.apotema ? med.apotema.valor : null;
      if (vh !== null && vm !== null && vm > vh) {
        if (!deduzir(med, 'apotemabase', Math.sqrt(vm * vm - vh * vh), recusarSolido)) return null;
      }
      va = med.aresta ? med.aresta.valor : null;
      if (va === null && numeroDaMedida(med.apotemabase) !== null) {
        if (!deduzir(med, 'aresta', 2 * numeroDaMedida(med.apotemabase), recusarSolido)) return null;
        va = numeroDaMedida(med.aresta);
      }
      if (va !== null && vh !== null) { if (!deduzir(med, 'apotema', Math.sqrt(vh * vh + va * va / 4), recusarSolido)) return null; }
      else if (va !== null && vm !== null) {
        if (vm <= va / 2) return recusarSolido('apotema=' + med.apotema.bruto + ' nao pode ser menor ou igual a metade da aresta ' + arredondar(va));
        if (!deduzir(med, 'altura', Math.sqrt(vm * vm - va * va / 4), recusarSolido)) return null;
      } else if (vh !== null && vm !== null) {
        if (vm <= vh) return recusarSolido('apotema=' + med.apotema.bruto + ' nao pode ser menor ou igual a altura ' + med.altura.bruto);
        if (!deduzir(med, 'aresta', 2 * Math.sqrt(vm * vm - vh * vh), recusarSolido)) return null;
      }
      if (numeroDaMedida(med.aresta) !== null) {
        if (!deduzir(med, 'apotemabase', numeroDaMedida(med.aresta) / 2, recusarSolido)) return null;
      }
      res = dimensoesDoSolido(proto, med, DIMS_POR_TIPO.piramide);
      dims = res.dims; numerico = res.numerico; chute = res.chute;
      if (triangulo) { comp = 'piramideComTriangulo'; dimsComp = dims; }
    } else if (tipo === 'cilindro' && esfera) {
      /* A altura E o diametro da esfera inscrita. */
      vr = med.raio ? med.raio.valor : null; vh = med.altura ? med.altura.valor : null;
      if (vr !== null) { if (!deduzir(med, 'altura', 2 * vr, recusarSolido)) return null; }
      else if (vh !== null) { if (!deduzir(med, 'raio', vh / 2, recusarSolido)) return null; }
      res = dimensoesDoSolido(proto, med, ['raio']);
      dims = { raio: res.dims.raio, altura: 2 * res.dims.raio };
      numerico = res.numerico; chute = res.chute;
      comp = 'cilindroComEsfera'; dimsComp = { raio: dims.raio }; folga = FOLGA_SOLIDO_COTADO;
    } else if (tipo === 'prismatriangular') {
      /* O lado da base equilatera entra como aresta na leitura e como lado na
       * composicao. */
      res = dimensoesDoSolido(proto, { lado: med.aresta, altura: med.altura }, DIMS_POR_TIPO.prismatriangular);
      dims = res.dims; numerico = res.numerico; chute = res.chute;
      comp = 'prismaTriangular'; dimsComp = dims; folga = FOLGA_SOLIDO_COTADO;
    } else {
      /* prisma, cilindro e esfera simples: nada a deduzir. No prisma sem
       * profundidade= a base e QUADRADA, que e o padrao do solidos.js escrito
       * no cabecalho desta receita e nao um chute: a diretiva que quer outra
       * profundidade a escreve. Vale com numero e com letra, e por isso a
       * profundidade fica fora da conta de dimensoesDoSolido e sai da aresta
       * ja resolvida: pelo prototipo ela sairia em 0,8 da aresta, que e o 0,8
       * do PAINEL, decidido para o painel de letras nao parecer um cubo, e o
       * prisma simples em letras saia com base retangular se dizendo fiel. */
      var quadrada = tipo === 'prisma' && !med.profundidade;
      res = dimensoesDoSolido(proto, med, quadrada ? ['aresta', 'altura'] : DIMS_POR_TIPO[tipo]);
      dims = res.dims; numerico = res.numerico; chute = res.chute;
      if (quadrada) dims.profundidade = dims.aresta;
    }

    calarMudas(med);

    if (comp === 'prismaTriangular') unidades = S.caixaDoSolido('prisma', { base: 'triangular', aresta: dims.lado, altura: dims.altura });
    else if (comp !== 'planificacaoDoCone') unidades = S.caixaDoSolido(tipo, dims);
    if (comp !== 'planificacaoDoCone' && !unidades) return recusarSolido('dimensoes invalidas para ' + tipo);

    return {
      tipo: tipo, comp: comp, dims: dims, dimsComp: dimsComp, med: med,
      centro: centro, arco: arco, angulo: angulo, unidades: unidades, folga: folga,
      fora: escalaDe(d, numerico, chute)
    };
  }

  function alturaDoSolido(B, op, G) {
    if (op.altura != null) return op.altura;
    if (G.comp === 'planificacaoDoCone' || !G.unidades) return ALTURA_PLANIFICACAO;
    return alturaParaCaixa(B, op, G.unidades, ALTURA_SOLIDO_MIN, ALTURA_SOLIDO_MAX, G.folga);
  }

  /* O texto que a folha imprime para uma medida, e a tinta dele. No enunciado
   * e o rotulo como veio (o numero ou a letra). No gabarito a letra que a conta
   * resolveu vira "g = 13" e sai em teal; o que ja estava impresso fica preto;
   * e na figura que NASCE no gabarito (corGab) todo valor e acrescimo. */
  function rotuloDaMedida(m, d, COR, corGab) {
    if (!m) return null;
    var texto = m.rotulo, cor = corGab || undefined, resolvido = false;
    if (d.fase === 'gabarito' && m.letra && m.deduzido != null) {
      texto = m.rotulo + ' = ' + arredondar(m.deduzido);
      cor = COR.teal;
      resolvido = true;
    }
    return { texto: texto, letra: m.rotulo, cor: cor, resolvido: resolvido };
  }

  /* Os rotulos que cada composicao poe COLADOS na linha (sem halo, a 3 pt,
   * dentro do solido). Ali cabe uma letra e nao cabe um valor resolvido:
   * medido na primeira tirada do gabarito, "a = 5" (19,1 pt de largura) caiu
   * sobre o quadradinho do apotema da base da piramide e "h = 8.66" (33 pt)
   * atravessou a silhueta esquerda do cone montado. Nessas posicoes a receita
   * manda a letra como veio; o valor resolvido so vai para os rotulos que a
   * composicao poe com halo e fuga (geratriz, apotema, as cotas, o raio do
   * setor), e a resposta em texto fica com o resto. */
  var COLADOS_DA_COMPOSICAO = {
    coneComTriangulo: { altura: 1, raio: 1 },
    piramideComTriangulo: { altura: 1, apotemaBase: 1 },
    planificacaoDoCone: { altura: 1, raio: 1 }
  };

  /* O solido simples dentro do figura() da receita: a funcao do solidos.js
   * desenha o solido e devolve os pontos-chave; a receita poe a linha interna
   * e a letra onde a celula do painel dele as poe, com as posicoes EM_* que o
   * proprio solidos.js exporta, e com a tinta da camada. */
  function desenharSolidoSimples(ctx, S, D, G, R) {
    var tipo = G.tipo, O = ctx.p(pt(0, 0));
    var dk = S.emPontos(G.dims, ctx.k);
    var Sd = null;
    ctx.contorno(function () { Sd = S[tipo](ctx, O, dk, {}); ctx.registro.solido = Sd; });

    ctx.marcas(function () {
      if (!Sd) return;
      if (tipo === 'cilindro' && R.raio) {
        D.poligono(ctx, [Sd.centroTopo, Sd.topoDir], { fechado: false, espessura: 0.9, papel: 'objeto' });
      }
      if (tipo === 'piramide' && R.altura) S.linhaInterna(ctx, Sd.vertice, Sd.O);
      if (tipo === 'cone') {
        if (R.altura) S.linhaInterna(ctx, Sd.vertice, Sd.O);
        if (R.raio) S.linhaInterna(ctx, Sd.O, Sd.baseDir);
      }
      if (tipo === 'esfera') {
        if (R.raio) D.cotaRadial(ctx, Sd.centro, Sd.raio, R.raio.texto, { angulo: 50, tam: TAM_DADO, corTexto: R.raio.cor });
        D.ponto(ctx, Sd.centro, {
          raio: 1.6, rotulo: G.centro || null,
          direcoes: [pt(-0.7071, -0.7071), pt(-1, 0), pt(0.7071, -0.7071)]
        });
      }
    });

    ctx.rotulos(function () {
      if (!Sd) return;
      function lado(m, A, Bq, op) {
        if (!m) return;
        op.tam = TAM_DADO; op.cor = m.cor;
        D.rotuloLado(ctx, m.texto, A, Bq, op);
      }
      /* A letra vai colada, como na celula do painel do solidos.js; o valor
       * resolvido do gabarito ("g = 13") e largo demais para a posicao colada
       * e vai com halo, que e o que o faz fugir com fio de chamada em vez de
       * atravessar a silhueta. */
      function colado(m, P, Q, dir, candidatos, afast) {
        if (!m) return;
        S.rotuloColado(ctx, m.texto, P, Q, dir, {
          candidatos: candidatos, afastamento: afast, tam: TAM_DADO, cor: m.cor, halo: m.resolvido === true
        });
      }
      if (tipo === 'prisma') {
        lado(R.aresta, Sd.arestaFrente[0], Sd.arestaFrente[1], { centro: Sd.centroBase });
        lado(R.altura, Sd.arestaAlturaDireita[0], Sd.arestaAlturaDireita[1], { direcao: pt(1, 0) });
        lado(R.profundidade, Sd.vertices.B, Sd.vertices.C, { centro: Sd.centroBase });
      } else if (tipo === 'cilindro') {
        colado(R.raio, Sd.centroTopo, Sd.topoDir, pt(0, 1), S.EM_RAIO_TAMPA, S.AFAST_RAIO);
        lado(R.altura, Sd.baseDir, Sd.topoDir, { direcao: pt(1, 0) });
      } else if (tipo === 'piramide') {
        lado(R.aresta, Sd.vertices.A, Sd.vertices.B, { centro: Sd.centroBase });
        colado(R.altura, Sd.vertice, Sd.O, pt(-1, 0), S.EM_ALTURA_PIRAMIDE, undefined);
      } else if (tipo === 'cone') {
        colado(R.altura, Sd.vertice, Sd.O, pt(-1, 0), S.EM_ALTURA_CONE, undefined);
        colado(R.raio, Sd.O, Sd.baseDir, pt(0, 1), S.EM_RAIO_CONE, S.AFAST_RAIO);
        lado(R.geratriz, Sd.vertice, Sd.baseDir, { centro: Sd.O });
      }
    });
  }

  /* A composicao do solidos.js abre o proprio figura(); a receita so traduz os
   * rotulos e passa o bloco, a fase, o id, a legenda e o nome da receita. */
  function chamarComposicao(doc, S, G, d, op, R, altura) {
    var mapa = ROTULOS_DA_COMPOSICAO[G.comp], colados = COLADOS_DA_COMPOSICAO[G.comp] || {};
    var rot = {}, cores = {}, k;
    for (k in mapa) {
      if (!Object.prototype.hasOwnProperty.call(mapa, k)) continue;
      var m = R[mapa[k]];
      if (!m) continue;
      rot[k] = colados[k] ? m.letra : m.texto;
      if (m.cor && !(colados[k] && m.resolvido)) cores[k] = m.cor;
    }
    if (G.comp === 'planificacaoDoCone' && G.arco) rot.arco = G.arco;
    if (G.centro && G.comp !== 'prismaTriangular' && G.comp !== 'planificacaoDoCone') rot.centro = G.centro;
    return S[G.comp](doc, {
      dims: G.dimsComp, rotulos: rot, cores: cores,
      bloco: { x: op.x, largura: op.largura, altura: altura, folga: G.folga },
      legenda: d.legenda, foraDeEscala: G.fora, fase: d.fase, id: d.id, receita: 'solido'
    });
  }

  var solido = {
    chaves: ['tipo', 'aresta', 'lado', 'profundidade', 'altura', 'raio', 'geratriz', 'apotema', 'apotemabase',
             'triangulo', 'esfera', 'planificacao', 'angulo', 'setor', 'arco', 'centro'],
    metricas: ['aresta', 'lado', 'profundidade', 'altura', 'raio', 'geratriz', 'apotema', 'apotemabase', 'setor'],

    medir: function (d, op) {
      var B = base(), S = solidos();
      var G = S ? geometriaDoSolido(B, S, null, d) : null;
      return {
        altura: G ? alturaDoSolido(B, op, G) : (op.altura != null ? op.altura : null),
        legenda: d.legenda || null,
        foraDeEscala: G ? G.fora : d.escala === 'fora'
      };
    },

    desenhar: function (doc, d, op) {
      var B = base(), g = B.gerador(), COR = g.COR, D = desenho(), S = solidos();
      if (!S) { B.avisar(doc, 'solido: o figuras/solidos.js nao carregou, e sem ele nao ha solido'); return null; }
      if (!D) { B.avisar(doc, 'solido: o figuras/desenho.js nao carregou'); return null; }
      var G = geometriaDoSolido(B, S, doc, d);
      if (!G) return null;
      var corGab = corDaCamada(doc, d, COR);
      var R = {}, k;
      for (k in G.med) if (Object.prototype.hasOwnProperty.call(G.med, k)) R[k] = rotuloDaMedida(G.med[k], d, COR, corGab);
      var altura = alturaDoSolido(B, op, G);
      if (G.comp) return chamarComposicao(doc, S, G, d, op, R, altura);
      return B.figura(doc, {
        x: op.x, largura: op.largura, altura: altura, folga: G.folga,
        unidades: G.unidades, legenda: d.legenda, foraDeEscala: G.fora,
        fase: d.fase, id: d.id, receita: 'solido'
      }, function (ctx) { desenharSolidoSimples(ctx, S, D, G, R); });
    }
  };

  /* ============================================================ painelsolidos
   *
   * Os cinco solidos lado a lado, na mesma escala, com o nome de cada um
   * embaixo, pelo painelDeSolidos do solidos.js. E a figura de RECONHECER o
   * solido pelo nome, e o nome vem do tema, nas duas linguas: nome=prisma;
   * cilindro;pirâmide;cone;esfera numa folha e nome=prism;cylinder;pyramid;
   * cone;sphere na outra. Sem nome= o painel sai mudo e o painelDeSolidos
   * avisa.
   *
   * Chaves:
   *   nome=N1;N2;...     um nome por solido, na ordem
   *   ordem=T1;T2;...    quais solidos e em que ordem (os cinco por padrao)
   *   aresta=V[;R] raio=V[;R] altura=V[;R]
   *                      a cota de cada dimensao, em todo solido que a tem:
   *                      altura=h escreve h no prisma, no cilindro, na piramide
   *                      e no cone; o numero, quando vem, da a dimensao a todos
   *                      eles (raio=3 altura=10 aresta=6), e a que faltar e
   *                      chutada na proporcao do prototipo, com a figura fora
   *                      de escala
   *
   * A altura da celula e a mesma conta do painelDeSolidos (escala comum, faixa
   * do nome, piso e teto da celula), feita aqui ANTES de desenhar para o bloco
   * poder ser medido; o desenhar confere que as duas contas dao o mesmo. */

  var SOLIDOS_DO_PAINEL = ['prisma', 'cilindro', 'piramide', 'cone', 'esfera'];

  /* UMA referencia de escala para o painel inteiro: o primeiro solido da ordem
   * que tem numero proprio na diretiva da o fator, dividindo o numero pelo
   * prototipo da medida a que ele pertence. Quem nao tem numero nenhum seu
   * desenha o prototipo NESSE fator.
   *
   * Sem isso a referencia era por solido e o solido sem chave sua saia no
   * prototipo cru, ordem de grandeza 1, contra a ordem de 6 a 10 dos vizinhos:
   * "altura=10" nos cinco desenhava a esfera com 7,30 pt de altura contra
   * 66,32 pt dos outros quatro, 9,1 vezes menor, e o painel existe justamente
   * para o aluno reconhecer o solido pelo nome. Painel todo em letras nao tem
   * numero nenhum, devolve null e continua no prototipo cru, como sempre. */
  function referenciaDoPainel(S, ordem, med) {
    for (var i = 0; i < ordem.length; i++) {
      var proto = prototipoDoSolido(S, ordem[i]), chaves = DIMS_POR_TIPO[ordem[i]] || [];
      for (var j = 0; j < chaves.length; j++) {
        var m = med[chaves[j]];
        if (m && m.valor !== null && proto[chaves[j]]) return m.valor / proto[chaves[j]];
      }
    }
    return null;
  }

  function layoutDoPainelDeSolidos(B, S, doc, d, op) {
    function recusarPainel(t) { if (doc) B.avisar(doc, 'painelsolidos: ' + t); return null; }
    var g = B.gerador(), i, k;
    var ordem = B.lista(d.args, 'ordem');
    if (!ordem.length) ordem = S.ORDEM_PAINEL.slice();
    for (i = 0; i < ordem.length; i++) {
      ordem[i] = String(ordem[i]).toLowerCase();
      if (SOLIDOS_DO_PAINEL.indexOf(ordem[i]) < 0) return recusarPainel('ordem= aceita ' + SOLIDOS_DO_PAINEL.join(', ') + ', e nao ' + ordem[i]);
    }
    var aresta = lerMedidaDupla(B, d.args, 'aresta', 'lado', recusarPainel);
    if (aresta === false) return null;
    var med = { aresta: aresta, raio: lerMedida(B, d.args, 'raio'), altura: lerMedida(B, d.args, 'altura') };
    for (k in med) {
      if (med[k] && med[k].valor !== null && !(med[k].valor > 0)) return recusarPainel(k + '=' + med[k].bruto + ' tem que ser positivo');
    }

    var dims = {}, cotas = {}, numerico = false, chute = false;
    var x = op.x != null ? Number(op.x) : g.MARG_E;
    var largura = op.largura != null ? Number(op.largura) : (g.MARG_D - x);
    var passo = largura / ordem.length;
    var folga = FOLGA_CELULA + VAO_CELULA / 2;
    var utilL = Math.max(1, passo - 2 * folga);
    var escala = Infinity, maior = 0, refPainel = referenciaDoPainel(S, ordem, med);
    for (i = 0; i < ordem.length; i++) {
      var tipo = ordem[i], chaves = DIMS_POR_TIPO[tipo];
      var medTipo = {};
      for (k = 0; k < chaves.length; k++) medTipo[chaves[k]] = med[chaves[k]] || null;
      var res = dimensoesDoSolido(prototipoDoSolido(S, tipo), medTipo, chaves, refPainel);
      /* No prisma com aresta numerica a base e quadrada (o padrao do
       * solidos.js), e nao o 0,8 do prototipo, que so existe para o painel de
       * letras nao parecer um cubo. */
      if (tipo === 'prisma' && med.aresta && med.aresta.valor !== null) {
        res.dims.profundidade = res.dims.aresta;
        res.chute = !(med.altura && med.altura.valor !== null);
      }
      dims[tipo] = res.dims;
      numerico = numerico || res.numerico;
      chute = chute || res.chute;
      cotas[tipo] = {};
      for (k = 0; k < chaves.length; k++) if (med[chaves[k]]) cotas[tipo][chaves[k]] = med[chaves[k]].rotulo;
      var cx = S.caixaDoSolido(tipo, res.dims);
      if (!cx) return recusarPainel('dimensoes invalidas para ' + tipo);
      escala = Math.min(escala, utilL / cx.largura);
      maior = Math.max(maior, cx.altura);
    }
    var alturaCelula = Math.max(CELULA_MIN, Math.min(CELULA_MAX, maior * escala + S.FAIXA_NOME + 2 * folga));
    return {
      ordem: ordem, nomes: B.lista(d.args, 'nome'), dims: dims, cotas: cotas,
      alturaCelula: alturaCelula, fora: escalaDe(d, numerico, chute)
    };
  }

  var painelsolidos = {
    chaves: ['nome', 'ordem', 'aresta', 'lado', 'raio', 'altura'],
    metricas: ['aresta', 'lado', 'raio', 'altura'],

    medir: function (d, op) {
      var B = base(), S = solidos();
      var L = S ? layoutDoPainelDeSolidos(B, S, null, d, op) : null;
      return {
        altura: L ? L.alturaCelula : null,
        legenda: d.legenda || null,
        foraDeEscala: L ? L.fora : d.escala === 'fora'
      };
    },

    desenhar: function (doc, d, op) {
      var B = base(), S = solidos();
      if (!S) { B.avisar(doc, 'painelsolidos: o figuras/solidos.js nao carregou, e sem ele nao ha painel'); return null; }
      var L = layoutDoPainelDeSolidos(B, S, doc, d, op);
      if (!L) return null;
      var P = S.painelDeSolidos(doc, {
        nomes: L.nomes, cotas: L.cotas, dims: L.dims, ordem: L.ordem,
        x: op.x, largura: op.largura, legenda: d.legenda, foraDeEscala: L.fora,
        fase: d.fase, receita: 'painelsolidos'
      });
      if (!P) return null;
      /* A medida feita antes de desenhar e a celula desenhada tem que ser a
       * mesma conta: divergindo, o bloco reservado pelo exercicio nao e o que
       * saiu na folha, e isso tem que gritar. */
      if (Math.abs(P.alturaCelula - L.alturaCelula) > 0.5) {
        B.avisar(doc, 'painelsolidos: a medida do bloco deu ' + arredondar(L.alturaCelula) +
          ' pt e a celula desenhada tem ' + arredondar(P.alturaCelula) + ' pt');
      }
      return P.registros[P.registros.length - 1] || null;
    }
  };

  /* ============================================================ despacho */

  var receitas = {
    triangulo: triangulo, quadrilatero: quadrilatero, painel: painel,
    circulo: circulo, conica: conica, poligonoregular: poligonoregular,
    pidesenrolado: pidesenrolado, pista: pista, rodando: rodando,
    solido: solido, painelsolidos: painelsolidos
  };

  function existe(nome) { return !!(nome && receitas[String(nome).toLowerCase()]); }
  function nomes() { var s = []; for (var k in receitas) s.push(k); return s.sort(); }
  function chavesDe(nome) {
    var r = receitas[String(nome || '').toLowerCase()];
    if (!r) return null;
    var B = base(), saida = r.chaves.slice();
    for (var k in B.RESERVADAS) saida.push(k);
    return saida;
  }

  /* Quanto a figura desta diretiva vai gastar de folha, sem desenhar nada e sem
   * mexer em nada: quem escreve o exercicio precisa somar isto ao texto e ao
   * espaco de resposta e reservar tudo de uma vez, ANTES do numero do exercicio.
   *
   * A resolucao pelo id e feita na mao aqui, e nao pelo resolverPorId, de
   * proposito: aquele guarda id e empurra aviso, e medir nao pode ter efeito
   * nenhum, senao o mesmo aviso sai duas vezes e um aviso que conta dois desloca
   * qualquer limiar do conferirFigura. */
  function alturaDoBloco(doc, diretiva, op) {
    var B = base();
    if (!B || !diretiva) return 0;
    op = op || {};
    var d = diretiva;
    if (!d.receita && d.id && doc && doc.figurasPorId && doc.figurasPorId[d.id]) {
      d = doc.figurasPorId[d.id];
    }
    var receita = d.receita ? receitas[String(d.receita).toLowerCase()] : null;
    if (!receita) return 0;
    var m = receita.medir ? receita.medir(d, op) : {};
    return B.medidaDoBloco({
      x: op.x, largura: op.largura,
      altura: m.altura != null ? m.altura : op.altura,
      legenda: m.legenda, foraDeEscala: m.foraDeEscala
    }).total;
  }

  /* Ponto unico de desenho a partir de uma diretiva ja lida. Resolve a camada de
   * gabarito pelo id, confere a receita e as chaves, e chama a receita. As duas
   * conferencias existem porque a diretiva nunca sai impressa: sem elas um erro
   * de digitacao no nome da receita apagaria a figura em silencio. */
  function desenhar(doc, diretiva, op) {
    var B = base();
    if (!B) return null;
    var d = B.resolverPorId(doc, diretiva);
    for (var a = 0; a < (d.avisos || []).length; a++) B.avisar(doc, d.avisos[a]);

    var nome = d.receita ? String(d.receita).toLowerCase() : null;
    var receita = nome ? receitas[nome] : null;
    if (!receita) {
      B.avisar(doc, 'receita inexistente: ' + (nome || '(diretiva sem receita e sem id conhecido)'));
      return null;
    }
    for (var chave in d.args) {
      if (receita.chaves.indexOf(chave) < 0 && !B.RESERVADAS[chave]) {
        B.avisar(doc, 'chave nao declarada por ' + nome + ': ' + chave);
      }
    }
    return receita.desenhar(doc, d, op || {});
  }

  /* Fachada da leitura, para o pdf.js ter uma dependencia so. */
  function partirEnunciado(texto) { var B = base(); return B ? B.partirEnunciado(texto) : []; }
  function registrarIds(doc, texto) { var B = base(); return B ? B.registrarIds(doc, texto) : 0; }
  function temDiretiva(texto) { var B = base(); return B ? B.temDiretiva(texto) : false; }
  function lerDiretiva(linha) { var B = base(); return B ? B.lerDiretiva(linha) : null; }

  return {
    receitas: receitas, desenhar: desenhar, existe: existe, nomes: nomes, chavesDe: chavesDe,
    alturaDoBloco: alturaDoBloco,
    partirEnunciado: partirEnunciado, registrarIds: registrarIds,
    temDiretiva: temDiretiva, lerDiretiva: lerDiretiva, base: base,
    PROTOTIPOS: PROTOTIPOS, NOTACAO: NOTACAO
  };
});
