/* figuras/marcas.js
 * As marcas de geometria: marcaAngulo, marcaAnguloReto, marcaLado, hachurar,
 * ceviana e diagonais. Mais a constante de cinza de area que faltava na paleta.
 *
 * Estas seis nao sao enfeite do desenho: elas SAO a notacao. Testado um a um no
 * proprio pdf.js, o sinal de congruente, o de perpendicular, o de paralelo e o de
 * angulo saem como interrogacao silenciosa na base-14. Ou seja, escrever a
 * hipotese em simbolos nao e uma alternativa disponivel neste gerador: o
 * tracinho, o arco e o quadradinho deixam de ser reforco e passam a ser o unico
 * canal. Sem estas seis funcoes, congruencia, semelhanca, paralelismo e altura
 * nao tem como ser ditos numa figura.
 *
 * Tres regras medidas mandam em tudo o que esta aqui:
 *
 *   - A marca NAO escala junto com a figura. A figura e descrita em unidades do
 *     problema e ajustada a caixa; o raio do arco, o lado do quadradinho, o
 *     comprimento do tracinho e o afastamento do rotulo ficam em PONTOS, fixos.
 *     Escalados, um triangulo pequeno ganha um quadradinho de angulo reto do
 *     tamanho dele. Por isso toda funcao daqui recebe ponto de PAGINA, ja
 *     convertido pelo ctx.p da figura, e nunca ponto do problema.
 *
 *   - Congruencia se diz por CONTAGEM e nunca por cor. Navy contra teal da 2,33
 *     de contraste: os dois quase nao se distinguem por luminosidade, so por
 *     matiz, e em preto e branco viram 79 e 61 por cento de tinta,
 *     indistinguiveis numa fotocopia de terceira geracao. Um tracinho, dois,
 *     tres; um arco, dois, tres. Isso sobrevive a fotocopia.
 *
 *   - Angulo reto e o quadradinho, nunca o arco e nunca o texto 90 graus. O
 *     quadradinho e simbolo, nao medida: ele diz que o angulo e reto por
 *     hipotese. Arco com 90 escrito faz a aluna ler mais um dado numerico entre
 *     os outros e perder a distincao entre o que a figura da e o que ela tem que
 *     calcular. O marcaAngulo faz cumprir isso sozinho, ver o comentario la.
 *
 * Todo desenho daqui roda dentro de um comEstado do base.js: o padrao de traco e
 * o caminho de recorte sao estado global do fluxo de conteudo, e um "[2 2] 0 d"
 * sem o "[] 0 d" tracejou o rodape e a figura seguinte. O hachurar e o pior caso
 * dos seis, porque ele liga recorte: um "W n" sem o "Q" recorta o resto da folha
 * e o sintoma aparece na pagina 3, longe de onde o erro foi cometido.
 *
 * Roda no navegador por <script> (exporta FigMarcas no global) e no Node.
 *
 * Regra da casa: nunca usar travessao.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FigMarcas = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Ligacao tardia com a fundacao, pelo mesmo motivo do base.js e do
   * receitas.js: no navegador o base.js entra por <script> e vira o global
   * FigBase; no Node a cadeia de require passa pelo pdf.js, que so termina de
   * carregar depois. Resolvido no topo do arquivo, o COR sairia undefined em
   * silencio. */
  var cacheBase = null;
  function base() {
    if (cacheBase) return cacheBase;
    if (typeof FigBase !== 'undefined' && FigBase && FigBase.figura) cacheBase = FigBase;
    else if (typeof require === 'function') {
      try { cacheBase = require('./base.js'); } catch (e) { cacheBase = null; }
    }
    if (!cacheBase) throw new Error('figuras/marcas.js nao achou o figuras/base.js');
    return cacheBase;
  }
  function ger() {
    var g = base().gerador();
    if (!g || !g.COR) throw new Error('figuras/marcas.js nao achou o pdf.js (nem PDFGen global nem require)');
    return g;
  }
  function avisar(doc, texto) { base().avisar(doc, texto); }

  /* ============================================================ a paleta que faltava
   *
   * O cinza de area, criado aqui porque a paleta do pdf.js nao tem nenhum.
   *
   * Medido antes de escolher, com a formula de contraste da WCAG contra o
   * branco: COR.soft da 1,12, softEsc 1,17, marca 1,14, fio 1,53 e gold 2,25.
   * Nenhum dos cinco chega aos 3:1 que a WCAG 1.4.11 pede para objeto grafico
   * que carrega significado, e uma regiao sombreada carrega significado por
   * definicao: ela E a pergunta ("qual e a area da regiao sombreada").
   *
   * Aqui houve um conflito de especificacao que vale registrar em vez de
   * esconder. A especificacao pede o cinza "em torno de 25 a 30 por cento de
   * tinta" E os 3:1 da WCAG, no mesmo paragrafo. Refiz a conta: 30 por cento de
   * tinta da 2,11 de contraste e 25 por cento da 1,83, ou seja, a faixa pedida
   * nao alcanca o criterio pedido. Os 3:1 exigem cerca de 41 por cento de tinta.
   * Entre um numero que se mede e um numero estimado, vale o que se mede, entao
   * este cinza tem 41,4 por cento de tinta e 3,07:1 contra o branco, com folga
   * para arredondamento.
   *
   * Escolhido azulado e nao neutro para pertencer a familia da paleta, que e
   * fria (fio #C9D2DD, muted #6B7280). As outras duas medidas que importam:
   * 3,74:1 contra o contorno navy, entao o contorno de 1,2 pt continua se
   * destacando por cima da area, e 5,57:1 contra COR.texto, entao um rotulo de
   * 7,5 pt pousado sobre a area ainda se le mesmo se o halo branco falhar.
   *
   * Nao instala isto dentro do COR do pdf.js na marra: se um dia a paleta ganhar
   * um area proprio, o dela vence e este vira alias, sem duas verdades. */
  var COR_AREA = [0.545098, 0.580392, 0.631373];   // #8B94A1
  function corDeArea() {
    var COR = ger().COR;
    return COR.area || COR_AREA;
  }

  /* Os tres niveis de espessura, e so tres. A NBR 8403 exige que a linha larga
   * seja no minimo o dobro da estreita justamente para uma informacao nao ser
   * confundida com outra, e 1,2 contra 0,6 e exatamente dois. A marca fica em
   * 0,9 porque ela e parte do enunciado e nao construcao: precisa pesar quase
   * como o contorno. */
  var ESPESSURA = { contorno: 1.2, marca: 0.9, auxiliar: 0.6, hachura: 0.5 };

  /* Constantes em PONTOS, nunca em unidades do problema. Ver a primeira regra do
   * cabecalho: marca escalada com a figura vira quadradinho do tamanho do
   * triangulo. */
  var RAIO_MIN = 12;        // piso do raio do arco de angulo
  var RAIO_MAX = 20;
  var PASSO_ARCO = 3.5;     // folga entre arcos concentricos; encostados viram borrao
  var LADO_RETO = 7;        // lado do quadradinho de angulo reto

  /* O passo do grupo de tracinhos e o comprimento deles, medidos contra a
   * FOTOCOPIA e nao contra a tela. Estavam em 6 e 2,5 pt, que e o numero escrito
   * na especificacao, e a revisao mediu o resultado na folha: tres tracos de
   * 0,9 pt (0,32 mm) separados por vaos de 2,5 menos 0,9, ou seja 1,6 pt, que da
   * 0,56 mm de papel branco entre um traco e o vizinho. Uma laser domestica ja
   * engorda o traco, e a segunda geracao de fotocopia fecha 0,56 mm: o par vira
   * um tracinho gordo e o trio vira dois. Justamente no painel cuja unica funcao
   * e ensinar que um, dois e tres tracinhos significam medidas diferentes.
   *
   * Aqui vale o mesmo criterio do COR_AREA vinte linhas acima: entre um numero
   * escrito na especificacao e um numero medido na folha, vale o medido. Com
   * passo 4,0 o vao vira 3,1 pt (1,09 mm), cerca de tres vezes e meia a
   * espessura do proprio traco, que e a folga que sobrevive a mais uma geracao
   * de copia. O tracinho sobe junto, de 6 para 7,5 pt, para o trio continuar
   * lendo-se como grupo e nao como um quadrado de tinta: com passo 4 o trio
   * ocupa 8 pt ao longo do lado e 7,5 pt atravessado nele.
   *
   * A seta de paralelismo tem constante PROPRIA porque o problema dela e outro,
   * e a revisao mediu os dois separados: o tracinho nao tem profundidade ao
   * longo do lado e a ponta de seta tem. Com braco de 6 pt a 35 graus, cada
   * cabeca recua 6 vezes cosseno de 35, ou seja 4,91 pt ao longo do lado. Duas
   * cabecas espacadas de 3,5 pt se sobrepoem em 1,4 pt: viram um borrao de cinco
   * riscos em leque, e como o simbolo de paralelo nao desenha nesta fonte a
   * setinha dupla e o UNICO canal para dizer que o segundo par tambem e
   * paralelo. O espacamento tem que ser a profundidade da propria seta mais
   * folga, e nao o passo do tracinho: 4,91 mais 2,6 da 7,5 pt. */
  var TAM_TRACO = 7.5;      // comprimento do tracinho de congruencia
  var FOLGA_TRACO = 4.0;    // passo entre tracinhos paralelos

  /* Os pisos da FOTOCOPIA, e nao do gosto. Sao os mesmos numeros que o
   * conferirFigura do base.js cobra (folgaTracinho 3,4 e folgaSeta 7,0), e estao
   * repetidos aqui porque quem PRODUZ tem que conhecer o piso de quem CONFERE:
   * encolher abaixo deles e desenhar uma figura que a trava do projeto reprova
   * na linha seguinte, com o agravante de o desenho ja estar no fluxo. */
  var PISO_FOTOCOPIA_TRACO = 3.4;
  var PISO_FOTOCOPIA_SETA = 7.0;
  var TAM_SETA = 6;         // braco da ponta de seta de paralelismo
  var FOLGA_SETA = 7.5;     // distancia entre as pontas de seta de paralelismo
  var RECUO_SETA = Math.cos(35 * Math.PI / 180);  // profundidade da cabeca por unidade de braco
  var FOLGA_ENTRE_SETAS = 2.6;                    // papel branco entre a cauda de uma e o bico da outra

  /* Separacao radial minima entre dois arcos que dividem o MESMO vertice mas nao
   * sao concentricos do mesmo grupo (o 115 externo e o 65 interno, por exemplo).
   * O PASSO_ARCO de 3,5 serve para arcos do mesmo grupo, que o olho ja le como
   * grupo; dois arcos de significados diferentes encostados emendam num
   * semicirculo continuo e a figura passa a mostrar um arco so varrendo 180
   * graus. Medido na p3 do piloto: os dois arcos do vertice C ficaram a 8 pt um
   * do outro por acidente (o raio do externo caiu para 12 porque o
   * prolongamento e curto), e nao por regra: com o prolongamento um pouco maior
   * os dois saiam com o mesmo raio de 20 e colavam.
   *
   * SETE e nao seis, e a diferenca foi medida. O piso do conferirFigura e 6,0 pt
   * e este numero e o que o desenhador PEDE; pedindo exatamente 6 o fluxo saiu
   * com 5,9984 pt entre as duas curvas e a propria trava do projeto reprovou a
   * figura. Nao e erro de conta: o arco e aproximado por Bezier de 90 graus e as
   * coordenadas vao para o fluxo com duas casas decimais, entao a folga impressa
   * fica alguns milesimos abaixo da pedida. Quem produz nao pode mirar no piso
   * de quem confere. Com 7 sobra 1 pt de margem, que e mais do que a soma de
   * todos os arredondamentos do caminho. */
  var SEPARA_ARCO = 7;
  var ANG_ESTREITO = 15;    // abaixo disto o valor sai do arco, ligado por fio
  /* Folga entre a BORDA do arco e a borda da caixa do rotulo, em pontos e fixa.
   * Fixa porque a revisao mediu, numa mesma figura de tres angulos, 6,1 pt de
   * folga no vertice de 125 graus contra 13 pt no de 25: a distancia saia do
   * calculo da cunha (quanto mais agudo o angulo, mais longe o texto tinha que
   * ir para caber entre os dois lados) e o olho lia os valores como se
   * pertencessem a arcos diferentes. Agora a cunha decide SE o valor cabe, nunca
   * a que distancia ele fica. */
  var FOLGA_ROTULO = 6;
  var TAM_ROTULO = 8.5;     // corpo do dado que resolve a questao
  var PISO_CORPO = 7.5;     // o mesmo piso de corpo do desenho.js
  var MARGEM_ROTULO = 2;    // papel branco entre a caixa do rotulo e o lado do angulo

  /* Papel branco entre a caixa do VALOR de um angulo e a caixa de qualquer outro
   * rotulo da figura. Nao e o mesmo numero do MARGEM_ROTULO acima, e a diferenca
   * nao e de grau, e de natureza: os 2 pt de la impedem que duas caixas se
   * ENCOSTEM, e este impede que duas caixas leiam como UM BLOCO SO. O olho
   * agrupa por proximidade antes de agrupar por significado, e o piso do
   * agrupamento e a altura de uma linha.
   *
   * Medido no exercicio 17 do piloto, que e a figura em que o defeito aparece
   * inteiro: as bissetrizes de B e de C se encontram em I, e o incentro esta
   * SOBRE a bissetriz de A por definicao, que e exatamente a reta onde o
   * marcaAngulo pousa o valor do angulo A. Os dois nao colidiram por azar de
   * arranjo, colidiram por teorema. Na folha o "70°" saiu com 4,93 pt de vao ate
   * a caixa do "I" (7,77 pt pela caixa mais baixa que a trava do base.js usa) e
   * 14,71 pt ate o arco que ele mede: o valor estava tres vezes mais perto do
   * rotulo de OUTRA coisa do que do proprio arco. A aluna le o bloco "I / 70°" e
   * responde que o angulo em I mede 70, que e a resposta errada que o exercicio
   * existe para pegar (o certo e 125). E o "I" desta fonte e uma barrinha
   * vertical de 8,5 pt: empilhado sobre o "70" ele ainda le como "170".
   *
   * O piso e o corpo do proprio rotulo, que e o mesmo numero que o
   * conferirFigura cobra, MAIS 1,5 pt. O acrescimo segue o criterio ja escrito no
   * SEPARA_ARCO umas linhas acima: quem produz nao mira no piso de quem confere.
   * Aqui a folga tem uma segunda razao medida: a trava do base.js mede a caixa do
   * rotulo com altura de 0,717 do corpo e a folha imprime o halo com 1,08, entao
   * as duas contas divergem em ate 3,1 pt no eixo vertical. Mirando na caixa
   * IMPRESSA, que e a maior, o numero da trava sai sempre maior que o nosso, e
   * nao ao contrario. */
  var SEPARA_BLOCO = 1.5;

  /* De quanto o valor pode GIRAR em torno do vertice, em graus, procurando lugar.
   *
   * Este e o grau de liberdade que faltava. Afastar o rotulo na propria bissetriz
   * nao resolve colisao com quem tambem mora na bissetriz: empurrado para fora
   * ele anda PARA CIMA do estorvo, e puxado para dentro ele sai do alcance do
   * proprio arco, que sao os 12 pt mais meia largura do rotulo que a trava
   * vizinha cobra ("o valor de angulo saiu solto na figura, sem arco"). A faixa
   * util entre as duas travas tem menos de 8 pt de largura, e no exercicio 17 nao
   * ha posicao dentro dela na bissetriz.
   *
   * Girando, o rotulo desliza AO LONGO do arco: a distancia radial ate ele nao
   * muda, entao a trava do arco continua satisfeita de graca, e o vao ate o outro
   * rotulo cresce com o raio vezes o seno do giro. No exercicio 17, 12 graus de
   * giro a 34,7 pt do vertice valem 7,2 pt de deslocamento, que e o que faltava.
   *
   * O teto de 22 graus e o do auditor independente menos folga: o
   * _audita_marcas.py reprova rotulo a mais de 25 graus da bissetriz do arco dele
   * ("o numero pousa fora da cunha e passa a apontar outro angulo"), e produzir
   * acima do teto de quem audita e o mesmo erro do paragrafo anterior. O passo de
   * 3 graus e o que permite parar no primeiro giro que serve em vez de saltar
   * para o maximo: no exercicio 17 ele para em 12 e nao em 22. */
  var GIRO_MAX = 22;
  var GIRO_PASSO = 3;

  /* Ate onde o valor pode ir, contado do vertice. Este teto e a OUTRA metade da
   * faixa estreita: o SEPARA_BLOCO acima empurra o rotulo para longe do vizinho e
   * este impede que o empurrao o tire do alcance do proprio arco, que e a trava
   * vizinha do conferirFigura ("o valor de angulo saiu solto na figura, sem
   * arco"). As duas tem que ser satisfeitas ao mesmo tempo, e uma sozinha so
   * troca de defeito.
   *
   * Os 12 pt sao o alcanceDoArco do base.js, repetidos aqui pela mesma razao dos
   * PISO_FOTOCOPIA umas linhas acima: quem PRODUZ tem que conhecer o teto de quem
   * CONFERE. A meia largura entra porque a trava a soma tambem, e ela mede a
   * largura do TEXTO, sem os 2,8 pt de folga lateral do halo, entao a conta aqui
   * desconta os 2,8 antes de dividir por dois. O 1,5 de margem e o de sempre.
   *
   * Sem este teto o giro tem efeito colateral medido: girado para perto de um dos
   * lados, o rotulo precisa de mais distancia para a caixa continuar cabendo
   * entre os dois (a conta da cunha divide pelo seno do angulo ate o lado, e o
   * seno vai a zero), e ele voa. No gabarito do isosceles com duas incognitas o
   * segundo "x = 70°" saiu a 36,07 pt do arco mais proximo, contra um teto de
   * 25,40, e a trava do valor solto acusou. */
  var ALCANCE_ARCO = 12;
  var FOLGA_ALCANCE = 1.5;

  var ESPACAMENTO_MIN = 4;  // piso de espacamento da hachura
  var HACHURA_MAX = 0.5;    // teto de espessura da hachura
  var TOL_PARALELA = 7;     // graus: abaixo disto a hachura desaparece contra o lado

  /* ============================================================ ferramentas locais
   *
   * O que vem abaixo e o minimo de desenho de que as seis marcas precisam. O
   * desenho.js e quem vai ter poligono, arco, rotulo, ponto, seta e cota; aqui
   * ficam versoes curtas e privadas pelo mesmo motivo que o receitas.js tem a
   * dele: os dois modulos estao sendo escritos ao mesmo tempo, e a marca nao
   * pode ficar refem da convencao de angulo de outro arquivo. O lado em que o
   * arco sai e o erro mais silencioso da lista inteira, porque a figura fica
   * bonita e diz outra coisa. */

  function f2(v) { return (Math.round(v * 100) / 100).toFixed(2); }
  function rad(g) { return g * Math.PI / 180; }
  function grausDe(r) { return r * 180 / Math.PI; }
  function pt(x, y) { return { x: +x, y: +y }; }
  function nrm(p) { return base().geo.normalizar(p); }
  function lista(ps) {
    var saida = [];
    for (var i = 0; i < (ps || []).length; i++) saida.push(nrm(ps[i]));
    return saida;
  }
  function dist(A, B) { return Math.sqrt((B.x - A.x) * (B.x - A.x) + (B.y - A.y) * (B.y - A.y)); }
  function versor(dx, dy) {
    var n = Math.sqrt(dx * dx + dy * dy);
    if (n < 1e-9) return pt(1, 0);
    return pt(dx / n, dy / n);
  }
  function somar(P, u, k) { return pt(P.x + u.x * k, P.y + u.y * k); }
  function perp(u) { return pt(-u.y, u.x); }
  function meio(A, B) { return pt((A.x + B.x) / 2, (A.y + B.y) / 2); }

  /* Poligonal como caminho UNICO (m, sequencia de l, S), com 1 J 1 j nas
   * juncoes. Nunca uma sequencia de doc.linha: cada doc.linha reemite cor e
   * espessura e faz um S proprio, entao nao ha juncao de canto e no quadradinho
   * de angulo reto aparece um entalhe visivel no vertice do meio. */
  function traco(doc, pts, fechado) {
    if (!pts || pts.length < 2) return;
    var s = '1 J 1 j ';
    for (var i = 0; i < pts.length; i++) {
      s += f2(pts[i].x) + ' ' + f2(pts[i].y) + (i === 0 ? ' m ' : ' l ');
    }
    if (fechado) s += 'h ';
    doc.op(s + 'S');
  }

  /* Bezier de ate 90 graus por trecho, com k igual a quatro tercos da tangente de
   * um quarto do trecho. Um Bezier so nao aproxima meia circunferencia: com 180
   * graus num unico trecho o raio erra mais de 20 por cento no meio, e o arco de
   * 175 graus da pagina de prova sairia visivelmente ovalado. */
  function opsArco(cx, cy, r, a0, a1) {
    var total = a1 - a0;
    var n = Math.max(1, Math.ceil(Math.abs(total) / (Math.PI / 2)));
    var d = total / n;
    var k = 4 / 3 * Math.tan(d / 4);
    var s = f2(cx + r * Math.cos(a0)) + ' ' + f2(cy + r * Math.sin(a0)) + ' m ';
    for (var i = 0; i < n; i++) {
      var t0 = a0 + i * d, t1 = t0 + d;
      var x0 = cx + r * Math.cos(t0), y0 = cy + r * Math.sin(t0);
      var x1 = cx + r * Math.cos(t1), y1 = cy + r * Math.sin(t1);
      s += f2(x0 - k * r * Math.sin(t0)) + ' ' + f2(y0 + k * r * Math.cos(t0)) + ' ' +
        f2(x1 + k * r * Math.sin(t1)) + ' ' + f2(y1 - k * r * Math.cos(t1)) + ' ' +
        f2(x1) + ' ' + f2(y1) + ' c ';
    }
    return s;
  }

  /* Rotulo com halo branco por baixo, dimensionado por medir(). Sem o halo a
   * letra cruza o lado da figura e a hachura, e o que sobra e um borrao que nao
   * se le em fotocopia. O y desconta cerca de 0,26 do corpo porque o Td
   * posiciona a linha de base e nao o centro optico do glifo.
   *
   * Vai dentro de um comEstado proprio porque o doc.retangulo acende "1 1 1 rg" e
   * o doc.texto acende a cor do texto: fora de envelope os dois ficam ligados
   * para quem desenhar depois. Dentro de uma figura o q/Q do figura() ja cobriria
   * isso, mas estas seis funcoes tambem sao chamadas soltas.
   *
   * Some quando o desenho.js entregar rotulo(), que faz o mesmo trabalho e ainda
   * resolve giro, colisao e fio de chamada. */
  function escrever(doc, texto, x, y, op) {
    op = op || {};
    var B = base(), g = ger();
    var tam = op.tam || TAM_ROTULO;
    var largura = g.medir(texto, tam, !!op.bold);
    var x0 = op.align === 'centro' ? x - largura / 2 : (op.align === 'direita' ? x - largura : x);
    var y0 = y - tam * 0.26;
    var caixa = {
      texto: texto, tam: tam,
      x: x0 - 1.4, y: y0, largura: largura + 2.8, altura: tam * 1.08
    };
    B.comEstado(doc, {}, function () {
      if (op.halo !== false) doc.retangulo(caixa.x, caixa.y, caixa.largura, caixa.altura, g.COR.branco);
      doc.texto(texto, x, y, { tam: tam, bold: !!op.bold, cor: op.cor || g.COR.texto, align: op.align });
    });
    return caixa;
  }

  /* Meia largura da caixa do rotulo projetada numa direcao. E a conta que decide
   * se o valor cabe dentro da abertura do angulo ou se ele tem que sair com fio
   * de chamada. */
  function projecao(caixa, u) {
    return Math.abs(u.x) * (caixa.largura / 2) + Math.abs(u.y) * (caixa.altura / 2);
  }

  /* Um segmento CRUZA a caixa de um rotulo? E a conta que decide se o halo
   * branco vai abrir um buraco no contorno. Feita pelo algoritmo de Liang e
   * Barsky, que resolve o segmento inteiro contra o retangulo alinhado aos
   * eixos numa passada, em vez das quatro intersecoes de reta com reta mais o
   * caso do segmento inteiramente dentro, que e o que costuma ficar de fora. */
  function cruzaCaixa(caixa, P, Q) {
    if (!caixa) return false;
    var x0 = caixa.x, y0 = caixa.y, x1 = caixa.x + caixa.largura, y1 = caixa.y + caixa.altura;
    var dx = Q.x - P.x, dy = Q.y - P.y;
    var t0 = 0, t1 = 1;
    var p = [-dx, dx, -dy, dy];
    var q = [P.x - x0, x1 - P.x, P.y - y0, y1 - P.y];
    for (var i = 0; i < 4; i++) {
      if (Math.abs(p[i]) < 1e-12) { if (q[i] < 0) return false; continue; }
      var r = q[i] / p[i];
      if (p[i] < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
      else { if (r < t0) return false; if (r < t1) t1 = r; }
    }
    return t1 >= t0;
  }

  /* Registro dos arcos ja desenhados em cada vertice de cada pagina, guardado no
   * proprio doc pelo mesmo padrao do avisosFigura do base.js. Serve a uma coisa
   * so: dois arcos que dividem o mesmo vertice e nao pertencem ao mesmo grupo
   * concentrico precisam de folga radial, senao emendam. Como as duas chamadas
   * saem de lugares diferentes da receita e nao se conhecem, quem tem que
   * lembrar e o vertice.
   *
   * A chave inclui o numero da pagina porque a mesma figura sai na mesma posicao
   * em paginas diferentes (o piloto tem a figura do angulo externo na p3 e na
   * p6, com coordenadas iguais): sem a pagina, o arco da p6 acharia que ja tem
   * vizinho e sairia empurrado sem motivo. */
  function arcosDoVertice(doc, V) {
    if (!doc) return null;
    if (!doc.arcosPorVertice) doc.arcosPorVertice = {};
    var pagina = doc.paginas && doc.paginas.length ? doc.paginas.length : 0;
    var chave = pagina + ':' + Math.round(V.x * 2) + ':' + Math.round(V.y * 2);
    if (!doc.arcosPorVertice[chave]) doc.arcosPorVertice[chave] = [];
    return doc.arcosPorVertice[chave];
  }

  /* Dois intervalos angulares se tocam? Trabalha em graus, com os dois inicios
   * trazidos para a mesma volta. Arcos que nao se tocam podem ter o raio que
   * quiserem: eles saem em setores diferentes do vertice e nunca se emendam. */
  function tocaAngular(a0, a1, b0, b1, folgaGraus) {
    var ia0 = Math.min(a0, a1), ia1 = Math.max(a0, a1);
    var ib0 = Math.min(b0, b1), ib1 = Math.max(b0, b1);
    for (var volta = -1; volta <= 1; volta++) {
      var d0 = ib0 + volta * 360, d1 = ib1 + volta * 360;
      if (d0 - folgaGraus <= ia1 && d1 + folgaGraus >= ia0) return true;
    }
    return false;
  }

  /* Os dois arcos varrem o MESMO setor? Ai eles nao sao dois angulos que dividem
   * um vertice, sao o mesmo angulo marcado duas vezes, e o par concentrico e
   * justamente a notacao de congruencia: afastar os dois de 6 pt destruiria o
   * grupo que o passo de 3,5 pt existe para formar. */
  function mesmoSetor(a0, a1, b0, b1) {
    var ia0 = Math.min(a0, a1), ia1 = Math.max(a0, a1);
    var ib0 = Math.min(b0, b1), ib1 = Math.max(b0, b1);
    for (var volta = -1; volta <= 1; volta++) {
      if (Math.abs(ib0 + volta * 360 - ia0) < 2 && Math.abs(ib1 + volta * 360 - ia1) < 2) return true;
    }
    return false;
  }

  /* Tudo o que o halo de um rotulo nao pode cobrir, reunido num lugar so.
   *
   * Antes esta lista era [V,A], [V,B] e o que o chamador lembrasse de passar em
   * op.evitar. Na pratica ninguem passava op.evitar, entao a trava do halo
   * enxergava dois segmentos numa figura de doze e ficava calada justamente nos
   * casos que importam: o lado OPOSTO do triangulo, que e onde a bissetriz vai
   * dar quando o angulo e agudo, a ceviana que atravessa a cunha e a diagonal.
   *
   * Esses tres o registro da figura ja conhece: o contorno e desenhado na camada
   * anterior a das marcas e cada segmento entra em registro.tracos pelo anota().
   * Ler dali e o que torna a trava verdadeira sem obrigar quem escreve receita a
   * lembrar de nada.
   *
   * A dependencia que fica, e vale escrita: o desvio so enxerga o que a receita
   * ANOTOU. Uma receita que desenhe o contorno por doc.op sem anotar continua
   * invisivel aqui, e o rotulo volta a pousar em cima da linha. Medido nas duas
   * pontas: com o contorno anotado, o "h" da altura de um triangulo de 100 por
   * 26 sai limpo; sem anotar, o mesmo "h" abre um buraco de 7,5 por 9,2 pt num
   * lado de 1,20 w. Quem escreve receita anota o traco de qualquer jeito, porque
   * e por ali que o conferirFigura conta; aqui esse habito passa a valer tambem
   * para o rotulo achar lugar. */
  function obstaculosDe(op, extras) {
    var segs = [];
    for (var e = 0; e < (extras || []).length; e++) segs.push(extras[e]);
    var reg = op && op.ctx && op.ctx.registro ? op.ctx.registro : null;
    var i, t;
    if (reg && reg.tracos) {
      for (i = 0; i < reg.tracos.length; i++) {
        t = reg.tracos[i];
        if (!t || t.x1 == null || t.x2 == null) continue;
        if (dist(pt(t.x1, t.y1), pt(t.x2, t.y2)) < 0.5) continue;
        segs.push([pt(t.x1, t.y1), pt(t.x2, t.y2)]);
      }
    }
    for (i = 0; i < (op && op.evitar ? op.evitar.length : 0); i++) {
      var seg = op.evitar[i];
      if (seg && seg.length === 2) segs.push([nrm(seg[0]), nrm(seg[1])]);
    }
    return segs;
  }

  /* Os rotulos que ja sairam nesta figura. Dois valores de VERTICES diferentes
   * encostados um no outro leem-se como uma lista de numeros e nao como duas
   * medidas ligadas a dois cantos, e foi assim que o 65 e o 75 da figura do
   * angulo externo acabaram empilhados na mesma faixa estreita. */
  function caixasDe(op) {
    var reg = op && op.ctx && op.ctx.registro ? op.ctx.registro : null;
    return reg && reg.rotulos ? reg.rotulos : [];
  }

  function caixasSeTocam(a, b, folga) {
    return Math.min(a.x + a.largura, b.x + b.largura) - Math.max(a.x, b.x) > -folga &&
      Math.min(a.y + a.altura, b.y + b.altura) - Math.max(a.y, b.y) > -folga;
  }

  /* A caixa que o escrever() vai desenhar se o rotulo for centrado em (cx, cy).
   * Calculada aqui e nao adivinhada: a conta e a mesma do escrever, com o mesmo
   * desconto de 0,26 do corpo para a linha de base e o mesmo 1,4 de folga
   * lateral, senao a trava mede uma caixa e a folha imprime outra. */
  function caixaEm(cx, cy, med) {
    return {
      x: cx - med.caixa.largura / 2, y: cy - med.tam * 0.35 - med.tam * 0.26,
      largura: med.caixa.largura, altura: med.caixa.altura
    };
  }

  /* O folgaVizinha e o unico parametro novo, e ele existe porque as duas
   * exigencias sao diferentes: TODO rotulo precisa de 2 pt para nao encostar no
   * vizinho, e o VALOR de um angulo precisa de uma altura de linha para nao ler
   * junto com ele. Quem chama sem o parametro continua com os 2 pt de sempre, que
   * e o caso do rotulo da ceviana. */
  function caixaLivre(caixa, obstaculos, vizinhas, folgaVizinha) {
    var i;
    var folga = folgaVizinha != null ? folgaVizinha : MARGEM_ROTULO;
    for (i = 0; i < obstaculos.length; i++) {
      if (cruzaCaixa(caixa, obstaculos[i][0], obstaculos[i][1])) return false;
    }
    for (i = 0; i < vizinhas.length; i++) {
      var v = vizinhas[i];
      if (!v || v.largura == null) continue;
      if (caixasSeTocam(caixa, v, folga)) return false;
    }
    return true;
  }

  /* O piso de papel branco entre o valor de um angulo e a caixa de outro rotulo,
   * na posicao candidata.
   *
   * A conta e a MESMA do conferirFigura, e nao uma parecida: la o valor so e
   * reprovado quando esta a menos de um corpo do outro rotulo E mais perto dele
   * do que do proprio arco. Copiar as duas condicoes importa para nao proibir o
   * que a trava permite: num vertice apertado o valor pode legitimamente encostar
   * a 4 pt do vizinho se estiver a 3 pt do arco dele, porque ai o olho ja agrupou
   * o valor com o arco. Exigir os 8,5 pt sempre empurraria esse valor para fora
   * da cunha para resolver um problema que nao existe.
   *
   * O caixasSeTocam mede em Chebyshev (folga em CADA eixo) e o conferirFigura
   * mede em Euclides (a hipotenusa dos dois vaos). Passar no primeiro implica
   * passar no segundo, porque a hipotenusa nunca e menor que o maior cateto,
   * entao a diferenca esta a favor de quem produz. */
  function folgaDeBloco(tam, aoArco) {
    return Math.max(MARGEM_ROTULO, Math.min(tam, Math.max(0, aoArco)) + SEPARA_BLOCO);
  }

  /* Gira um versor por um angulo em graus, no mesmo sentido positivo do resto do
   * arquivo (anti-horario com o y para cima do PDF). */
  function girar(u, graus) {
    var c = Math.cos(rad(graus)), s = Math.sin(rad(graus));
    return pt(u.x * c - u.y * s, u.x * s + u.y * c);
  }

  /* Os giros a tentar, do mais barato para o mais caro: primeiro o lugar natural
   * (giro zero, na bissetriz), depois de tres em tres graus para os dois lados
   * alternando, ate o teto. Alternar em vez de varrer um lado inteiro primeiro e
   * o que mantem o rotulo o mais perto possivel da bissetriz: o lado em que sobra
   * espaco depende da figura e nao de uma convencao. */
  function girosDoRotulo(abertura) {
    var teto = Math.min(GIRO_MAX, Math.max(0, abertura / 2 - 1));
    var saida = [0];
    for (var g = GIRO_PASSO; g <= teto + 1e-9; g += GIRO_PASSO) { saida.push(-g); saida.push(g); }
    return saida;
  }

  /* Para ir do vertice ate o numero, o olho nao pode atravessar traco nenhum.
   *
   * Esta e a forma geral do defeito que o revisor achou no 30 graus do gabarito:
   * o valor tinha ido parar do lado de FORA do triangulo, acima da hipotenusa, e
   * a caixa dele nao encostava em lado nenhum, entao nenhuma trava de
   * sobreposicao pegava. O que estava errado nao era a caixa, era o caminho: o
   * numero pertencia a um vertice e morava na outra regiao da figura, e a unica
   * forma de liga-lo ao arco era um fio de chamada cortando o contorno.
   *
   * A conta e curta e exata: o segmento que vai do arco ate o centro da caixa,
   * andando pela bissetriz, nao cruza nenhum traco da figura. Comeca a alguns
   * pontos do vertice porque os dois lados do angulo NASCEM nele, e um encontro
   * no proprio vertice nao e travessia. */
  function caminhoLivre(V, bis, distancia, obstaculos) {
    var de = somar(V, bis, Math.min(3, distancia * 0.5));
    var ate = somar(V, bis, distancia);
    for (var i = 0; i < obstaculos.length; i++) {
      if (cruzamento(de, ate, obstaculos[i][0], obstaculos[i][1])) return false;
    }
    return true;
  }

  /* Anota no registro da figura, quando a marca foi chamada de dentro de uma
   * receita. E o que permite ao conferirFigura contar as marcas ativas e achar
   * rotulo sobreposto sem que quem escreve a receita precise lembrar.
   *
   * A regra de contagem: marca ativa e o que a aluna precisa LER. Um arco com o
   * valor ao lado e UM item (o valor; o arco so diz qual angulo e), entao entra
   * como rotulo e nao como os dois. Um arco sem valor e a propria notacao de
   * congruencia, e ai ele e o item. Contando os dois, o teto de cinco caia com
   * tres angulos rotulados e a figura legitima era reprovada. */
  function anotar(op, tipo, dado) {
    if (op && op.ctx && typeof op.ctx.anota === 'function') op.ctx.anota(tipo, dado);
    return dado;
  }

  /* ============================================================ marcaAngulo
   *
   *   marcaAngulo(doc, V, A, B, {voltas, rotulo, raio, passo, cor, espessura,
   *                              tam, lado, corRotulo, boldRotulo, evitar, ctx})
   *
   * O boldRotulo existe para a camada de resposta, onde peso mais cor e o par
   * que sobrevive a fotocopia; ele entra na MEDIDA do halo e nao so na impressao.
   * O evitar acrescenta segmentos a lista do que o valor nao pode cobrir, e hoje
   * quase nunca e preciso: com ctx, a lista sai sozinha do registro da figura.
   *
   * De um a tres arcos concentricos no vertice V, entre as semirretas VA e VB,
   * SEMPRE pelo lado do angulo menor que 180 graus, com o rotulo na bissetriz por
   * fora do arco. Devolve o que desenhou.
   *
   * O lado do arco e o erro mais silencioso da lista inteira: sai uma figura
   * bonita dizendo outra coisa. Por isso o sentido nao vem de comparacao de
   * angulos absolutos, que troca de sinal ao cruzar o corte do atan2, e sim da
   * diferenca normalizada para o intervalo de menos 180 a mais 180: assim o arco
   * anda sempre o caminho curto, independente de onde as duas semirretas cairam. */
  function marcaAngulo(doc, V, A, B, op) {
    op = op || {};
    var Bs = base(), g = ger(), COR = g.COR;
    V = nrm(V); A = nrm(A); B = nrm(B);

    var dA = dist(V, A), dB = dist(V, B);
    if (dA < 1e-6 || dB < 1e-6) {
      avisar(doc, 'marcaAngulo: semirreta de comprimento zero, nada a marcar');
      return null;
    }

    var a0 = Math.atan2(A.y - V.y, A.x - V.x);
    var a1 = Math.atan2(B.y - V.y, B.x - V.x);
    var delta = a1 - a0;
    while (delta <= -Math.PI) delta += 2 * Math.PI;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    var abertura = Math.abs(grausDe(delta));

    if (abertura < 0.5 || abertura > 179.5) {
      avisar(doc, 'marcaAngulo: as duas semirretas sao quase colineares (' +
        abertura.toFixed(1) + ' graus), o arco nao diz nada');
      return null;
    }

    var texto = op.rotulo === undefined || op.rotulo === null ? null : String(op.rotulo);

    /* Angulo reto e o quadradinho, nunca o arco. Aqui a regra e cumprida em vez
     * de recomendada, mas com uma excecao que importa: se o rotulo e uma
     * incognita, o vertice mede 90 no desenho por consequencia dos outros dois
     * dados e a aluna e quem tem que descobrir isso. Trocar pelo quadradinho ali
     * entregaria a resposta e ainda contradiria o proprio x escrito ao lado.
     * Entao a troca so acontece quando nao ha rotulo nenhum ou quando o rotulo e
     * literalmente o valor 90, que e a redundancia que a especificacao proibe. */
    /* O sinal de grau entra na expressao pelo escape u00b0 e nao pelo glifo: assim o
     * arquivo inteiro fica em ASCII e atravessa qualquer editor ou pipeline que
     * releia o fonte em latin-1 sem o caractere virar dois. O grau em si desenha
     * na base-14, e ele chega aqui dentro do rotulo, vindo do tema. */
    var soNumero = texto === null ? '' : texto.replace(/[\s\u00b0]/g, '');
    if (Math.abs(abertura - 90) < 0.5 && (texto === null || soNumero === '90') && !op.forcarArco) {
      avisar(doc, 'marcaAngulo: angulo reto sai como quadradinho, nunca como arco com 90 escrito');
      return marcaAnguloReto(doc, V, A, B, {
        lado: op.lado, cor: op.cor, espessura: op.espessura, ctx: op.ctx
      });
    }

    var voltas = Math.max(1, Math.min(3, Math.round(Number(op.voltas) || 1)));
    var passo = op.passo != null ? Number(op.passo) : PASSO_ARCO;
    var perto = Math.min(dA, dB);

    /* O raio e fracao da menor distancia do vertice aos vizinhos, com piso de 12
     * pt, e nunca fixo: com raio fixo, num vertice de lados curtos o arco passa
     * do vertice oposto e deixa de dizer a que angulo pertence. O teto de 0,55
     * da menor distancia e o que o conferirFigura audita depois (arco maior que a
     * distancia do vertice ao vizinho reprova o tema). */
    var raioPedido = op.raio != null ? Number(op.raio) : null;
    var raio = raioPedido != null ? raioPedido
      : Math.max(RAIO_MIN, Math.min(0.30 * perto, RAIO_MAX));
    var teto = 0.55 * perto;
    var externo = raio + (voltas - 1) * passo;
    if (externo > teto) {
      raio = teto - (voltas - 1) * passo;
      externo = teto;
      if (raio < 6) {
        avisar(doc, 'marcaAngulo: nao cabe arco neste vertice (a menor distancia e ' +
          perto.toFixed(1) + ' pt para ' + voltas + ' volta(s))');
        return null;
      }
    }

    var meiaDir = a0 + delta / 2;
    var bis = pt(Math.cos(meiaDir), Math.sin(meiaDir));
    var u1 = versor(A.x - V.x, A.y - V.y);
    var u2 = versor(B.x - V.x, B.y - V.y);
    var n1 = perp(u1), n2 = perp(u2);

    /* ---------------------------------------------------------------- o rotulo
     *
     * Onde o valor fica: na bissetriz, a FOLGA_ROTULO da borda do arco, SEMPRE
     * dentro da cunha. As tres coisas juntas, porque o orcamento de espaco e o
     * mesmo para arco e rotulo: quem decide o raio e o rotulo que vai por fora
     * dele, e por isso esta conta vem ANTES de desenhar o arco.
     *
     * Cabe ou nao cabe e conta exata, e nao mais aproximada. A caixa do halo e
     * um retangulo alinhado aos eixos; a distancia dela a cada um dos dois lados
     * do angulo, medida na normal daquele lado, e a projecao da caixa nessa
     * normal (funcao de apoio de um retangulo). O centro da caixa esta a d do
     * vertice sobre a bissetriz, entao a distancia do centro a cada lado vale d
     * vezes o seno da metade da abertura. A caixa esta livre quando
     *
     *     d * sen(abertura/2)  >=  max(projecao(caixa, n1), projecao(caixa, n2)) + MARGEM
     *
     * A versao anterior usava a projecao na perpendicular da BISSETRIZ, que nao
     * e a normal de nenhum dos dois lados, e um teto de 0,8 da menor distancia
     * do vertice aos vizinhos. Os dois erraram, e erraram na folha: no 30 graus
     * do gabarito do exercicio 11 a conta aproximada reprovou a posicao por 0,07
     * pt e mandou o valor para fora com fio de chamada que ATRAVESSA a
     * hipotenusa; no 115 do angulo externo o teto de 0,8 se media contra o
     * PROLONGAMENTO, que tem 26 pt, entao qualquer rotulo a mais de 20,8 pt do
     * vertice era reprovado, e o 115 saia deitado em cima do lado AC com o halo
     * comendo um pedaco do contorno.
     *
     * Quando nao cabe, a ordem e a que a revisao pediu e nesta ordem: primeiro
     * cresce o RAIO DO ARCO (o rotulo continua a 6 pt dele, so que mais longe do
     * vertice, e a folga arco-rotulo continua igual em todos os vertices da
     * folha), depois encolhe o CORPO ate o piso de 7,5 pt, e so entao a chamada.
     * Crescer o arco fica proibido quando o raio veio pedido de fora: dois arcos
     * de raio igual e o que afirma que dois angulos sao congruentes, e o
     * ceviana() conta com isso. */
    var tamPedido = op.tam || TAM_ROTULO;
    var sen = Math.max(0.02, Math.sin(rad(abertura) / 2));
    /* O peso do rotulo entra na MEDIDA e nao so na hora de imprimir. A camada de
     * resposta pede negrito (peso mais cor e o par que sobrevive a fotocopia,
     * porque navy contra teal da 2,33 de contraste sozinho nao sobrevive), e o
     * negrito da Helvetica e mais largo: medindo o halo em regular e imprimindo
     * em negrito, a caixa sai estreita e a letra passa por fora do halo, que e o
     * mesmo buraco que a trava do fim desta funcao existe para impedir. */
    var negrito = !!(op.boldRotulo || op.bold);

    /* O ate1 e o ate2 sao a mesma conta do precisa, guardada LADO A LADO em vez
     * de reduzida ao pior dos dois. O precisa continua existindo e continua sendo
     * o maximo, porque na bissetriz os dois lados estao a mesma distancia e o
     * pior manda; girado, nao: o rotulo fica mais perto de um e mais longe do
     * outro, e cobrar o pior dos dois nos dois lados proibiria justamente o giro
     * que resolve a colisao. */
    function medidasDoRotulo(tam) {
      var cx = { largura: g.medir(texto, tam, negrito) + 2.8, altura: tam * 1.08 };
      var a1 = projecao(cx, n1) + MARGEM_ROTULO;
      var a2 = projecao(cx, n2) + MARGEM_ROTULO;
      return {
        tam: tam, caixa: cx,
        aoLongo: projecao(cx, bis),
        ate1: a1, ate2: a2,
        precisa: Math.max(a1, a2)
      };
    }

    var med = null, dRotulo = 0, comFio = false;
    if (texto !== null) {
      var tamAtual = tamPedido;
      while (true) {
        med = medidasDoRotulo(tamAtual);
        var dCunha = med.precisa / sen;
        var dNatural = externo + FOLGA_ROTULO + med.aoLongo;
        if (abertura >= ANG_ESTREITO && dNatural >= dCunha) { dRotulo = dNatural; break; }
        var externoPreciso = dCunha - FOLGA_ROTULO - med.aoLongo;
        if (abertura >= ANG_ESTREITO && raioPedido === null && externoPreciso <= teto) {
          externo = externoPreciso;
          raio = externo - (voltas - 1) * passo;
          dRotulo = dCunha;
          break;
        }
        if (tamAtual - 0.5 >= PISO_CORPO) { tamAtual -= 0.5; continue; }
        comFio = true;
        break;
      }
    }

    /* --------------------------------------------- dois arcos no mesmo vertice
     *
     * O 115 externo e o 65 interno dividem o vertice C e sao dois arcos de
     * significados diferentes. Encostados, emendam num semicirculo continuo e a
     * figura passa a mostrar um arco so varrendo 180 graus. Como as duas
     * chamadas nascem em pontos diferentes da receita e nao se conhecem, quem
     * lembra e o vertice: o registro guarda a faixa radial e a faixa angular de
     * cada arco ja desenhado ali.
     *
     * So empurra quando as faixas angulares se TOCAM: dois arcos em setores
     * separados do mesmo vertice nunca se emendam, e empurrar um deles so
     * gastaria espaco. E nunca empurra quando o raio veio pedido de fora, pelo
     * mesmo motivo do bloco acima. */
    var grausIni = grausDe(a0), grausFim = grausDe(a0 + delta);
    var registro = arcosDoVertice(doc, V);
    if (registro && raioPedido === null) {
      for (var passada = 0; passada < 4; passada++) {
        var mexeu = false;
        for (var k = 0; k < registro.length; k++) {
          var viz = registro[k];
          if (!tocaAngular(grausIni, grausFim, viz.ini, viz.fim, 2)) continue;
          if (mesmoSetor(grausIni, grausFim, viz.ini, viz.fim)) continue;
          if (raio - viz.externo >= SEPARA_ARCO || viz.raio - externo >= SEPARA_ARCO) continue;
          var paraFora = viz.externo + SEPARA_ARCO;
          if (paraFora + (voltas - 1) * passo <= teto) {
            raio = paraFora; externo = raio + (voltas - 1) * passo; mexeu = true;
          } else {
            var paraDentro = viz.raio - SEPARA_ARCO - (voltas - 1) * passo;
            if (paraDentro >= 6) {
              raio = paraDentro; externo = raio + (voltas - 1) * passo; mexeu = true;
            } else {
              avisar(doc, 'marcaAngulo: dois arcos no mesmo vertice a menos de ' +
                SEPARA_ARCO + ' pt e nao ha espaco para afastar (raios ' +
                raio.toFixed(1) + ' e ' + viz.raio.toFixed(1) + ' pt)');
            }
          }
        }
        if (!mexeu) break;
      }
      registro.push({ raio: raio, externo: externo, ini: grausIni, fim: grausFim });
      /* O rotulo segue o arco: se o arco foi empurrado, a folga de 6 pt entre a
       * borda dele e a caixa do valor tem que continuar valendo. */
      if (med && !comFio) dRotulo = Math.max(externo + FOLGA_ROTULO + med.aoLongo, med.precisa / sen);
    }

    var cor = op.cor || COR.texto;
    var espessura = op.espessura != null ? Number(op.espessura) : ESPESSURA.marca;

    Bs.comEstado(doc, { cor: cor, espessura: espessura }, function () {
      for (var i = 0; i < voltas; i++) {
        doc.op('1 J ' + opsArco(V.x, V.y, raio + i * passo, a0, a0 + delta) + 'S');
      }
    });

    var resultado = {
      tipo: 'anguloArco', x: V.x, y: V.y, raio: raio, externo: externo,
      voltas: voltas, abertura: abertura, bissetriz: bis, espessura: espessura,
      rotulo: null, chamada: false
    };

    if (texto === null) {
      /* Arco sem valor e a notacao de congruencia: ele e o item que se le. */
      anotar(op, 'marca', resultado);
      return resultado;
    }

    /* --------------------------- o valor nao cobre traco nem cola em outro rotulo
     *
     * Duas coisas, e a busca e uma so porque o orcamento de espaco e o mesmo.
     *
     * A primeira: o halo do rotulo e um retangulo BRANCO pintado por baixo da
     * letra. Onde ele pousa em cima de um traco, o traco some naquele pedaco: nao
     * e um detalhe de estetica, e um buraco no contorno da figura, e a aluna le o
     * lado interrompido como dois segmentos ou como um lado que acaba ali.
     *
     * A segunda: o valor tem que estar mais perto do arco DELE do que de qualquer
     * outro rotulo, e a pelo menos uma altura de linha desse outro rotulo. Ver o
     * SEPARA_BLOCO no topo do arquivo para o caso medido (o "70°" e o "I" do
     * exercicio 17) e para por que a colisao ali e por teorema e nao por azar: o
     * incentro mora na bissetriz de todo vertice, que e a reta em que este bloco
     * pousa o valor.
     *
     * Isto era so um AVISO no fim da funcao, depois de o buraco ja estar
     * impresso, e com uma lista de obstaculos que na pratica tinha dois
     * segmentos. Agora e conserto, e a ordem das tentativas segue o mesmo
     * criterio do orcamento de espaco que manda no resto do arquivo: primeiro o
     * que nao custa nada a leitura, por ultimo o que custa mais.
     *
     *   1. o lugar natural, na bissetriz, a FOLGA_ROTULO da borda do arco;
     *   2. PUXAR PARA DENTRO, ate 3 pt da borda do arco, que e o movimento mais
     *      barato quando o estorvo e o lado oposto do triangulo (a bissetriz de
     *      um angulo agudo vai dar nele);
     *   3. empurrar para fora, ate 10 pt alem do natural;
     *   4. GIRAR em torno do vertice, de tres em tres graus para os dois lados,
     *      refazendo os passos 1 a 3 em cada giro;
     *   5. encolher o corpo de meio em meio ponto ate o piso de 7,5 e refazer a
     *      varredura inteira;
     *   6. o fio de chamada, que por construcao sai por fora do poligono.
     *
     * O passo 4 e o que faltava, e ele nao e "afastar mais": quem tenta resolver
     * colisao afastando pela bissetriz, quando o estorvo TAMBEM esta na
     * bissetriz, so anda para cima dele, e puxando para dentro sai do alcance do
     * proprio arco. Girar mantem o raio, entao a distancia ao arco nao muda e a
     * trava do arco continua satisfeita sem custo nenhum; o que muda e o vao ate
     * o outro rotulo, que cresce com o raio vezes o seno do giro. Ver o GIRO_MAX
     * no topo do arquivo.
     *
     * A cunha continua mandando, agora LADO A LADO: nenhum candidato desce abaixo
     * da distancia em que a caixa deixa de caber entre os dois lados do angulo, e
     * girado o rotulo responde a cada lado pela distancia que ele tem daquele
     * lado. Mover o valor para um lugar onde ele nao cobre traco mas encosta no
     * lado nao seria conserto, seria trocar de defeito. */
    var obstaculos = obstaculosDe(op, [[V, A], [V, B]]);
    var vizinhas = caixasDe(op);
    var dirRotulo = bis;
    if (!comFio) {
      var achouLugar = false;
      while (!achouLugar) {
        var giros = girosDoRotulo(abertura);
        for (var gi = 0; gi < giros.length && !achouLugar; gi++) {
          var u = girar(bis, giros[gi]);
          /* Os dois angulos sao medidos da direcao candidata para cada lado do
           * angulo, e nao deduzidos do sinal do giro: o delta pode ser negativo e
           * ai o giro positivo aproxima do outro lado. Fora da cunha a soma dos
           * dois passa da abertura, e o candidato nem chega a ser testado. */
          var ang1 = Math.abs(grausDe(Math.atan2(u.x * u1.y - u.y * u1.x, u.x * u1.x + u.y * u1.y)));
          var ang2 = Math.abs(grausDe(Math.atan2(u.x * u2.y - u.y * u2.x, u.x * u2.x + u.y * u2.y)));
          if (ang1 < 0.5 || ang2 < 0.5 || ang1 + ang2 > abertura + 0.5) continue;
          var meiaU = projecao(med.caixa, u);
          var dCunhaAqui = Math.max(med.ate1 / Math.sin(rad(ang1)), med.ate2 / Math.sin(rad(ang2)));
          var dBase = Math.max(externo + FOLGA_ROTULO + meiaU, dCunhaAqui);
          var piso = Math.max(dCunhaAqui, externo + 3 + meiaU);
          /* O teto do alcance do arco. Girado, o candidato mais barato pode estar
           * a 36 pt do proprio arco (ver o ALCANCE_ARCO no topo): ai o giro nao e
           * uma posicao melhor, e outro defeito. */
          var dTeto = externo + ALCANCE_ARCO + (med.caixa.largura - 2.8) / 2 - FOLGA_ALCANCE;
          if (piso > dTeto) continue;
          var candidatos = [dBase], passoBusca;
          for (passoBusca = dBase - 1.5; passoBusca >= piso; passoBusca -= 1.5) candidatos.push(passoBusca);
          for (passoBusca = dBase + 1.5; passoBusca <= dBase + 10; passoBusca += 1.5) candidatos.push(passoBusca);
          for (var cd = 0; cd < candidatos.length; cd++) {
            var d = candidatos[cd];
            if (d > dTeto) continue;
            var teste = caixaEm(V.x + u.x * d, V.y + u.y * d, med);
            if (caixaLivre(teste, obstaculos, vizinhas, folgaDeBloco(med.tam, d - externo)) &&
                caminhoLivre(V, u, d, obstaculos)) {
              dRotulo = d;
              dirRotulo = u;
              achouLugar = true;
              break;
            }
          }
        }
        if (achouLugar) break;
        if (med.tam - 0.5 >= PISO_CORPO) {
          med = medidasDoRotulo(med.tam - 0.5);
          continue;
        }
        /* Nem encolhido o valor acha lugar limpo dentro da cunha. Sair por fora
         * com um fio curto e pior do que o lugar natural e melhor do que um
         * buraco no contorno, que e o que a versao anterior imprimia. */
        comFio = true;
        break;
      }
    }

    var cx, cy;
    if (!comFio) {
      cx = V.x + dirRotulo.x * dRotulo; cy = V.y + dirRotulo.y * dRotulo;
    } else {
      /* Angulo estreito demais para o valor caber na cunha, mesmo com o arco
       * crescido e o corpo no piso. O valor sai POR FORA do poligono, encostado
       * no lado, e o fio de chamada e um risco curto e perpendicular ao lado que
       * comeca exatamente na PONTA DO ARCO e anda para fora.
       *
       * A versao anterior empurrava o valor pela bissetriz e depois pela
       * perpendicular a ela, o que joga a caixa para o outro lado do contorno e
       * obriga o fio a atravessar o proprio lado do triangulo. Um fio que cruza o
       * contorno acrescenta a figura um quarto risco que nao e lado, nem altura,
       * nem bissetriz, e some na fotocopia deixando o numero colado no angulo
       * errado. Este fio nao cruza nada por construcao: ele nasce em cima do lado
       * (na ponta do arco) e anda na normal para o semiplano onde o outro lado do
       * angulo nao esta, ou seja, para fora da cunha. */
      var uR = (op.lado === 'direita' || op.lado === -1) ? u2 : u1;
      var outro = uR === u1 ? u2 : u1;
      var nFora = perp(uR);
      if (nFora.x * outro.x + nFora.y * outro.y > 0) nFora = pt(-nFora.x, -nFora.y);
      var meiaFora = projecao(med.caixa, nFora);
      var ancora = somar(V, uR, externo);
      cx = ancora.x + nFora.x * (meiaFora + 7);
      cy = ancora.y + nFora.y * (meiaFora + 7);
      var ateFio = somar(ancora, nFora, 5.5);
      Bs.comEstado(doc, { cor: COR.muted, espessura: ESPESSURA.auxiliar }, function () {
        traco(doc, [ancora, ateFio], false);
      });
    }

    resultado.chamada = comFio;
    resultado.rotulo = escrever(doc, texto, cx, cy - med.tam * 0.35,
      { tam: med.tam, align: 'centro', bold: negrito, cor: op.corRotulo || COR.texto });
    anotar(op, 'rotulo', resultado.rotulo);

    /* Trava final, medida no que FOI desenhado e nao no que se pretendia. Depois
     * da busca acima ela so dispara quando nem o fio de chamada escapou, e ai o
     * aviso vai para o doc para o conferirFigura reprovar o tema em vez de a
     * folha sair com um buraco branco no meio de um lado. */
    for (var o = 0; o < obstaculos.length; o++) {
      if (cruzaCaixa(resultado.rotulo, obstaculos[o][0], obstaculos[o][1])) {
        avisar(doc, 'marcaAngulo: o halo do rotulo "' + texto +
          '" cobre um traco da figura (vertice ' + f2(V.x) + ' ' + f2(V.y) + ')');
        break;
      }
    }
    return resultado;
  }

  /* ============================================================ marcaAnguloReto
   *
   *   marcaAnguloReto(doc, V, A, B, {lado, cor, espessura, ctx})
   *
   * O quadradinho de dois segmentos encaixado no vertice, construido com os
   * VERSORES de VA e VB, para acompanhar qualquer rotacao da figura. Nunca um
   * retangulo alinhado aos eixos: no triangulo girado 35 graus dos exercicios o
   * retangulo alinhado sai torto em relacao aos dois lados e vira um quadrado
   * solto perto do vertice.
   *
   * E a unica forma de dizer perpendicular neste gerador, porque o glifo sai como
   * interrogacao. Por isso ele avisa em vez de desenhar quando os dois lados sao
   * quase colineares: um quadradinho achatado num vertice de 170 graus afirma uma
   * perpendicularidade que nao existe. */
  function marcaAnguloReto(doc, V, A, B, op) {
    op = op || {};
    var Bs = base(), COR = ger().COR;
    V = nrm(V); A = nrm(A); B = nrm(B);

    var dA = dist(V, A), dB = dist(V, B);
    if (dA < 1e-6 || dB < 1e-6) {
      avisar(doc, 'marcaAnguloReto: semirreta de comprimento zero');
      return null;
    }
    var u = versor(A.x - V.x, A.y - V.y);
    var w = versor(B.x - V.x, B.y - V.y);
    var cosseno = u.x * w.x + u.y * w.y;
    var abertura = grausDe(Math.acos(Math.max(-1, Math.min(1, cosseno))));

    if (abertura < 20 || abertura > 160) {
      avisar(doc, 'marcaAnguloReto: os dois lados sao quase colineares (' +
        abertura.toFixed(1) + ' graus), o quadradinho nao sai');
      return null;
    }
    /* Fora de 90 o quadradinho vira losango e passa a mentir. Ainda desenha,
     * porque a figura pode estar declarada fora de escala, mas o aviso fica no
     * doc para o conferirFigura reprovar o tema em vez de a folha sair afirmando
     * uma perpendicular que a construcao nao tem. */
    if (Math.abs(abertura - 90) > 1.5) {
      avisar(doc, 'marcaAnguloReto: o vertice mede ' + abertura.toFixed(1) +
        ' graus e nao 90, o quadradinho sai como losango');
    }

    /* O lado nunca passa de um terco da menor semirreta: no vertice apertado o
     * quadradinho de 7 pt cobria o vizinho e encostava no rotulo dele. */
    var lado = op.lado != null ? Number(op.lado) : LADO_RETO;
    lado = Math.min(lado, 0.34 * Math.min(dA, dB));
    if (lado < 3) {
      avisar(doc, 'marcaAnguloReto: nao cabe quadradinho neste vertice (lado de ' +
        lado.toFixed(1) + ' pt)');
      return null;
    }

    var P1 = somar(V, u, lado);
    var P3 = somar(V, w, lado);
    var P2 = pt(V.x + u.x * lado + w.x * lado, V.y + u.y * lado + w.y * lado);
    var cor = op.cor || COR.texto;
    var espessura = op.espessura != null ? Number(op.espessura) : ESPESSURA.marca;

    Bs.comEstado(doc, { cor: cor, espessura: espessura }, function () {
      traco(doc, [P1, P2, P3], false);
    });

    return anotar(op, 'marca', {
      tipo: 'anguloReto', x: V.x, y: V.y, lado: lado,
      abertura: abertura, espessura: espessura, cantos: [P1, P2, P3]
    });
  }

  /* ============================================================ marcaLado
   *
   *   marcaLado(doc, P, Q, {n, tipo, tamanho, folga, cor, espessura, t, ctx})
   *
   * De um a tres tracinhos PERPENDICULARES ao segmento, centrados no ponto medio,
   * ou de uma a tres pontas de seta apontando ao longo dele. As duas sao a mesma
   * primitiva com tipos diferentes porque fazem o mesmo trabalho: dizer uma
   * hipotese sem gastar numero.
   *
   * Perpendicular ao lado e nao vertical na pagina: num lado obliquo o tracinho
   * vertical parece um lado a mais saindo do poligono. E no ponto medio, longe
   * dos vertices, para nao competir com a letra do vertice.
   *
   * A ponta de seta e aberta, dois riscos e nao um triangulo cheio: cheia ela
   * compete em peso com o contorno de 1,2 pt e o olho a le como parte da figura.
   * E a notacao de paralelismo porque o glifo de paralelo sai como interrogacao. */
  function marcaLado(doc, P, Q, op) {
    op = op || {};
    var Bs = base(), COR = ger().COR;
    P = nrm(P); Q = nrm(Q);

    var comprimento = dist(P, Q);
    if (comprimento < 1e-6) {
      avisar(doc, 'marcaLado: segmento de comprimento zero');
      return null;
    }
    var n = Math.max(1, Math.min(3, Math.round(Number(op.n) || 1)));
    var tipo = op.tipo === 'seta' || op.tipo === 'paralela' ? 'seta' : 'traco';
    var tamanho = op.tamanho != null ? Number(op.tamanho)
      : (tipo === 'seta' ? TAM_SETA : TAM_TRACO);
    /* O espacamento da SETA sai do tamanho dela e nao de uma constante solta: a
     * cabeca recua tamanho vezes cosseno de 35 ao longo do lado, e duas cabecas
     * espacadas de menos que isso se sobrepoem. Quem muda o tamanho por op nao
     * precisa lembrar de mudar a folga junto, que foi como as duas setas do
     * segundo par de paralelas acabaram a 3,53 pt uma da outra com 4,91 pt de
     * profundidade cada. */
    var folgaSeta = Math.max(FOLGA_SETA, tamanho * RECUO_SETA + FOLGA_ENTRE_SETAS);
    var folga = op.folga != null ? Number(op.folga) : (tipo === 'seta' ? folgaSeta : FOLGA_TRACO);
    var t = op.t != null ? Number(op.t) : 0.5;

    var u = versor(Q.x - P.x, Q.y - P.y);
    var nor = perp(u);
    var centro = pt(P.x + (Q.x - P.x) * t, P.y + (Q.y - P.y) * t);

    /* O grupo de marcas ocupa (n - 1) folgas ao longo do lado, mais o proprio
     * comprimento da ponta de seta. Num lado curto isso encosta nos dois
     * vertices e as marcas se confundem com o contorno.
     *
     * O que cede e a MARGEM DE PONTA, e nao a folga entre as marcas. Isto e uma
     * correcao, e o numero que a motivou esta medido: o piso do encolhimento era
     * 1,6 pt para o tracinho e 5,9 pt para a seta, os dois ABAIXO do que o
     * conferirFigura cobra (3,4 e 7,0), entao num lado de 12,3 pt o trio saia
     * desenhado a 2,15 pt e a propria trava do projeto reprovava a figura logo
     * depois. Produzir abaixo do piso de quem confere nao e encolher, e entregar
     * um borrao com aviso.
     *
     * A folga entre marcas e o unico canal de congruencia nesta fonte e nao pode
     * descer do piso da fotocopia. Os 4 pt de papel reservados junto a cada
     * vertice sao conforto e podem cair para 2: o tracinho e perpendicular ao
     * lado e nao encosta no vertice, so fica perto dele. No lado de 12,3 pt isso
     * troca um trio ilegivel a 2,15 por um trio legivel a 3,4 com 2,75 pt de
     * folga ate cada ponta.
     *
     * Esgotadas as duas, avisa e nao desenha: apagar uma marca mudaria o que a
     * figura afirma, que e quantas congruencias existem, e desenhar a mancha
     * afirma o mesmo em cima de um borrao. */
    var recuo = tipo === 'seta' ? tamanho * RECUO_SETA : 0;
    var pisoFolga = tipo === 'seta' ? PISO_FOTOCOPIA_SETA : PISO_FOTOCOPIA_TRACO;
    var MARGEM_CHEIA = 4, MARGEM_APERTADA = 2;
    function ocupaCom(f) { return (n - 1) * f + recuo; }
    if (ocupaCom(folga) > comprimento - 2 * MARGEM_CHEIA) {
      var cabe = n > 1 ? (comprimento - 2 * MARGEM_CHEIA - recuo) / (n - 1) : 0;
      var novo = Math.max(pisoFolga, Math.min(folga, cabe));
      if (ocupaCom(novo) > comprimento - 2 * MARGEM_APERTADA) {
        avisar(doc, 'marcaLado: o lado tem ' + comprimento.toFixed(1) +
          ' pt e nao cabem ' + n + ' marca(s) com a folga minima de ' +
          pisoFolga.toFixed(1) + ' pt');
        return null;
      }
      if (novo < folga) {
        avisar(doc, 'marcaLado: folga reduzida de ' + folga.toFixed(1) + ' para ' +
          novo.toFixed(1) + ' pt, o lado tem so ' + comprimento.toFixed(1) + ' pt');
        folga = novo;
      } else {
        avisar(doc, 'marcaLado: margem de ponta reduzida para ' +
          ((comprimento - ocupaCom(folga)) / 2).toFixed(1) + ' pt de cada lado, ' +
          'para a folga de ' + folga.toFixed(1) + ' pt caber no lado de ' +
          comprimento.toFixed(1) + ' pt');
      }
    }

    var cor = op.cor || COR.texto;
    var espessura = op.espessura != null ? Number(op.espessura) : ESPESSURA.marca;
    var marcas = [];

    Bs.comEstado(doc, { cor: cor, espessura: espessura }, function () {
      for (var i = 0; i < n; i++) {
        var s = (i - (n - 1) / 2) * folga;
        var c = somar(centro, u, s);
        if (tipo === 'traco') {
          var a = somar(c, nor, tamanho / 2);
          var b = somar(c, nor, -tamanho / 2);
          traco(doc, [a, b], false);
          marcas.push([a, b]);
        } else {
          /* Ponta de seta apontando de P para Q: duas hastes de 35 graus saindo
           * do bico para tras. */
          var co = Math.cos(rad(35)), se = Math.sin(rad(35));
          var recuo = tamanho * co, meiaAbertura = tamanho * se;
          var b1 = pt(c.x - u.x * recuo + nor.x * meiaAbertura, c.y - u.y * recuo + nor.y * meiaAbertura);
          var b2 = pt(c.x - u.x * recuo - nor.x * meiaAbertura, c.y - u.y * recuo - nor.y * meiaAbertura);
          traco(doc, [b1, c, b2], false);
          marcas.push([b1, c, b2]);
        }
      }
    });

    return anotar(op, 'marca', {
      tipo: tipo === 'seta' ? 'ladoSeta' : 'ladoTraco',
      x: centro.x, y: centro.y, n: n, tamanho: tamanho, folga: folga,
      espessura: espessura, marcas: marcas
    });
  }

  /* ============================================================ hachurar
   *
   *   hachurar(doc, caminhos, {angulo, espacamento, cor, espessura, estilo, ctx})
   *
   * Recorta a regiao como caminho de clipe e varre a caixa envolvente com
   * paralelas na inclinacao pedida. Como o recorte aceita caminho com curva,
   * hachura setor circular, coroa e regiao entre duas figuras sem NENHUMA conta
   * de intersecao de reta com poligono, que e a conta que da errado justamente em
   * regiao com furo e em poligono nao convexo.
   *
   * O caminho aceita, em qualquer combinacao:
   *   lista de pontos                  uma regiao simples
   *   lista de listas de pontos        regiao com furo (regra par e impar)
   *   {centro, raio}                   circulo, com rx e ry opcionais para elipse
   *   {centro, raio, de, ate, setor}   setor circular, em graus
   *
   * Duas coisas que este arquivo faz cumprir e nao apenas recomenda:
   *
   *   - Regiao unica pedida vai em CINZA CHAPADO e nao em hachura. Hachura
   *     acrescenta dezenas de linhas paralelas que competem com os lados, com as
   *     diagonais e com o arco, e para dificuldade visual isso vira textura que o
   *     olho tenta ler como conteudo. Ela entra so quando duas regioes distintas
   *     da mesma figura precisam se distinguir entre si. Por isso o estilo
   *     'chapado' mora aqui dentro, no mesmo lugar: quem quer marcar uma regiao
   *     encontra as duas opcoes juntas e a certa e a que esta por perto.
   *
   *   - Hachura paralela a um lado desaparece contra o contorno. A inclinacao
   *     pedida e conferida contra todos os lados retos da regiao e trocada
   *     sozinha quando colide, na ordem que a convencao manda (45, depois 30 ou
   *     60).
   *
   *   - A GLOSA nunca entra dentro da area. Ver o glosaDaHachura logo abaixo. */
  function hachurar(doc, caminhos, op) {
    op = op || {};
    var Bs = base(), COR = ger().COR;
    var partes = normalizarPartes(doc, caminhos);
    if (!partes || !partes.length) return null;

    var cx = caixaDasPartes(partes);
    if (cx.largura < 1 || cx.altura < 1) {
      avisar(doc, 'hachurar: regiao sem area, nada a hachurar');
      return null;
    }
    var glosa = glosaDaHachura(doc, op);

    var caminho = '';
    for (var i = 0; i < partes.length; i++) caminho += opsDaParte(partes[i]);

    /* Cinza chapado: o preenchimento por regra par e impar (f*) e o que da a
     * coroa e a moldura de graca, com os dois contornos no mesmo sentido de
     * percurso e sem calcular intersecao nenhuma. */
    if (op.estilo === 'chapado' || op.estilo === 'cinza') {
      var tinta = op.cor || corDeArea();
      Bs.comEstado(doc, { preenchimento: tinta }, function () {
        doc.op(caminho + 'f*');
      });
      return anotar(op, 'marca', {
        tipo: 'areaChapada', x: cx.cx, y: cx.cy, caixa: cx, cor: tinta, glosa: glosa
      });
    }

    /* Pisos duros. O espacamento vem da NBR (0,7 mm entre paralelas, cerca de 2
     * pt) aberto para 4 pt porque hachura densa vira mancha, e mancha esconde o
     * contorno da regiao que era justamente o assunto; e ela bate com a trama da
     * fotocopiadora. A regra de seis vezes a espessura e o que impede a hachura
     * fechar e virar area cheia. */
    var espessura = Math.min(HACHURA_MAX,
      op.espessura != null ? Number(op.espessura) : ESPESSURA.hachura);
    var espacamento = op.espacamento != null ? Number(op.espacamento) : 5;
    if (espacamento < ESPACAMENTO_MIN) {
      avisar(doc, 'hachurar: espacamento de ' + espacamento.toFixed(1) +
        ' pt abaixo do piso, subido para ' + ESPACAMENTO_MIN);
      espacamento = ESPACAMENTO_MIN;
    }
    /* Com as constantes de hoje esta trava nunca dispara, e isso e de proposito:
     * espessura no teto de 0,5 pede espacamento de 3, e o piso de 4 ja passa
     * disso. Ela fica escrita porque a razao de seis para um e o que impede a
     * hachura fechar e virar area cheia, e quem um dia mexer no HACHURA_MAX ou no
     * ESPACAMENTO_MIN precisa esbarrar nela em vez de descobrir na folha. */
    if (espacamento < 6 * espessura) {
      avisar(doc, 'hachurar: espacamento menor que seis vezes a espessura, subido para ' +
        (6 * espessura).toFixed(1));
      espacamento = 6 * espessura;
    }

    var angulo = escolherInclinacao(doc, partes, op.angulo != null ? Number(op.angulo) : 45);
    if (angulo === null) return null;

    /* COR.fio, que a convencao antiga sugeria aqui, mede 1,53 de contraste contra
     * o branco e seria reprovada pelo proprio conferirFigura, que exige 3:1 para
     * portador de significado. COR.muted da 4,84 e ainda recua para segundo plano
     * por ser quatro vezes mais fina que o contorno. */
    var cor = op.cor || COR.muted;
    var dir = pt(Math.cos(rad(angulo)), Math.sin(rad(angulo)));
    var nor = perp(dir);
    var centro = pt(cx.cx, cx.cy);
    var raio = Math.sqrt(cx.largura * cx.largura + cx.altura * cx.altura) / 2 + 2;
    var passos = Math.ceil(raio / espacamento);
    var linhas = 0;

    Bs.comEstado(doc, { cor: cor, espessura: espessura }, function () {
      doc.op(caminho + 'W* n');
      var s = '';
      for (var k = -passos; k <= passos; k++) {
        var c = somar(centro, nor, k * espacamento);
        var a = somar(c, dir, -raio), b = somar(c, dir, raio);
        s += f2(a.x) + ' ' + f2(a.y) + ' m ' + f2(b.x) + ' ' + f2(b.y) + ' l ';
        linhas++;
      }
      if (s) doc.op('0 J ' + s + 'S');
    });

    return anotar(op, 'marca', {
      tipo: 'hachura', x: cx.cx, y: cx.cy, caixa: cx, glosa: glosa,
      angulo: angulo, espacamento: espacamento, espessura: espessura, linhas: linhas
    });
  }

  /* A glosa da hachura ("a parte hachurada e a regiao pedida") e uma das DUAS
   * unicas legendas que a convencao permite, a outra sendo o aviso de fora de
   * escala. Ela mora ABAIXO do bloco, em 7,5 pt COR.muted, escrita pelo proprio
   * figura() a partir da chave legenda. Nunca dentro da area preenchida.
   *
   * A revisao encontrou a frase impressa como rotulo dentro da regiao, encostada
   * na base e por cima do contorno do furo. Ali ela erra tres vezes de uma so.
   * Primeira: o rotulo abre um halo branco por baixo de si, e esse halo e um
   * buraco na tinta da propria regiao que a pergunta esta apontando, ou seja, a
   * glosa apaga um pedaco do que ela descreve. Segunda: dentro da area ela cruza
   * o contorno, e num furo o contorno e a fronteira que separa o que conta do que
   * nao conta. Terceira: rotulo dentro do desenho conta como marca ativa no teto
   * de cinco do conferirFigura, e gasta com uma frase de servico o lugar de um
   * dado que a aluna precisa ler.
   *
   * Entao esta funcao ACEITA a glosa e NAO a desenha: se o bloco ja tem legenda,
   * cala; se nao tem, avisa com a linha pronta para copiar. Aceitar e recusar no
   * mesmo lugar e o que impede a proxima receita de resolver no braco com um
   * rotulo solto, que e exatamente como o defeito entrou. Escrever a legenda
   * daqui nao e alternativa: a altura dela e reservada pelo medidaDoBloco ANTES
   * do primeiro traco, e um texto emitido no meio do desenho cairia no vao de
   * seis pontos que separa esta figura do que vem depois. */
  function glosaDaHachura(doc, op) {
    var texto = op.glosa != null ? op.glosa
      : (op.legenda != null ? op.legenda : op.rotulo);
    if (texto === null || texto === undefined || texto === '') return null;
    texto = String(texto);
    var reg = op.ctx && op.ctx.registro ? op.ctx.registro : null;
    if (reg && reg.legenda) return texto;
    avisar(doc, 'hachurar: a glosa "' + texto + '" nao se escreve dentro da area, ' +
      'ela e legenda do bloco: passe legenda=' + texto + ' ao figura() ou a diretiva @fig');
    return texto;
  }

  /* Aceita as quatro formas de caminho sem adivinhar pela forma do primeiro
   * elemento: um par [x, y] TEM length e um {x, y} nao tem, e decidir "lista de
   * listas" por caminhos[0].length fazia uma lista de pares passar por lista de
   * regioes, com o recorte sumindo inteiro e a hachura vazando para fora. */
  function normalizarPartes(doc, caminhos) {
    if (!caminhos) { avisar(doc, 'hachurar: sem regiao'); return null; }
    var bruto = ehLista(caminhos) ? caminhos : [caminhos];
    if (ehPonto(bruto[0])) bruto = [bruto];
    var saida = [];
    for (var i = 0; i < bruto.length; i++) {
      var p = bruto[i];
      if (!p) continue;
      if (ehLista(p)) {
        if (p.length < 3) { avisar(doc, 'hachurar: regiao com menos de tres pontos'); return null; }
        saida.push({ tipo: 'poligono', pontos: lista(p) });
      } else if (p.pontos) {
        if (p.pontos.length < 3) { avisar(doc, 'hachurar: regiao com menos de tres pontos'); return null; }
        saida.push({ tipo: 'poligono', pontos: lista(p.pontos) });
      } else if (p.centro && (p.raio != null || p.rx != null)) {
        var c = nrm(p.centro);
        var rx = Number(p.rx != null ? p.rx : p.raio);
        var ry = Number(p.ry != null ? p.ry : p.raio);
        if (!(rx > 0) || !(ry > 0)) { avisar(doc, 'hachurar: raio invalido'); return null; }
        saida.push({
          tipo: 'arco', centro: c, rx: rx, ry: ry,
          de: p.de != null ? Number(p.de) : 0,
          ate: p.ate != null ? Number(p.ate) : 360,
          setor: !!p.setor
        });
      } else {
        avisar(doc, 'hachurar: parte em formato desconhecido, recusada');
        return null;
      }
    }
    return saida;
  }
  function ehLista(v) {
    return Array.isArray ? Array.isArray(v) : Object.prototype.toString.call(v) === '[object Array]';
  }
  function ehPonto(p) {
    if (!p || typeof p !== 'object') return false;
    if (typeof p.x === 'number' && typeof p.y === 'number') return true;
    return ehLista(p) && p.length >= 2 && isFinite(+p[0]) && isFinite(+p[1]);
  }

  function opsDaParte(parte) {
    if (parte.tipo === 'poligono') {
      var s = '';
      for (var i = 0; i < parte.pontos.length; i++) {
        s += f2(parte.pontos[i].x) + ' ' + f2(parte.pontos[i].y) + (i === 0 ? ' m ' : ' l ');
      }
      return s + 'h ';
    }
    /* Elipse por Bezier com raios independentes: a mesma conta do circulo com o
     * y multiplicado por ry sobre rx. E o unico lugar do modulo onde x e y podem
     * ter fatores diferentes, e ali esta certo porque a elipse e a projecao de um
     * circulo e nao uma figura esticada. */
    var c = parte.centro, k = parte.ry / parte.rx;
    var a0 = rad(parte.de), a1 = rad(parte.ate);
    var arcoOps = opsArco(0, 0, parte.rx, a0, a1);
    var saida = '', partes = arcoOps.split(' '), buffer = [];
    /* Reescreve as coordenadas do arco unitario para o centro e o achatamento.
     * Feito sobre o texto porque o opsArco ja resolveu a quebra em trechos de 90
     * graus, que e a parte que erra facil. */
    for (var t = 0; t < partes.length; t++) {
      var tok = partes[t];
      if (tok === 'm' || tok === 'l' || tok === 'c') {
        for (var b = 0; b < buffer.length; b += 2) {
          saida += f2(c.x + buffer[b]) + ' ' + f2(c.y + buffer[b + 1] * k) + ' ';
        }
        saida += tok + ' ';
        buffer = [];
      } else if (tok.length) {
        buffer.push(parseFloat(tok));
      }
    }
    if (parte.setor && Math.abs(parte.ate - parte.de) < 359.9) {
      saida += f2(c.x) + ' ' + f2(c.y) + ' l ';
    }
    return saida + 'h ';
  }

  function caixaDasPartes(partes) {
    var pts = [];
    for (var i = 0; i < partes.length; i++) {
      var p = partes[i];
      if (p.tipo === 'poligono') pts = pts.concat(p.pontos);
      else {
        pts.push(pt(p.centro.x - p.rx, p.centro.y - p.ry));
        pts.push(pt(p.centro.x + p.rx, p.centro.y + p.ry));
      }
    }
    return base().geo.caixa(pts);
  }

  /* Todos os lados retos da regiao, em graus no intervalo de 0 a 180: a
   * inclinacao da hachura e comparada com eles. */
  function ladosDe(partes) {
    var angs = [];
    for (var i = 0; i < partes.length; i++) {
      if (partes[i].tipo !== 'poligono') continue;
      var pts = partes[i].pontos;
      for (var j = 0; j < pts.length; j++) {
        var A = pts[j], B = pts[(j + 1) % pts.length];
        if (dist(A, B) < 2) continue;
        var a = grausDe(Math.atan2(B.y - A.y, B.x - A.x));
        a = ((a % 180) + 180) % 180;
        angs.push(a);
      }
    }
    return angs;
  }

  function distanciaAngular(a, b) {
    var d = Math.abs(((a - b) % 180 + 180) % 180);
    return Math.min(d, 180 - d);
  }

  function escolherInclinacao(doc, partes, pedida) {
    var lados = ladosDe(partes);
    var candidatas = [pedida, 30, 60, 15, 75, 45, 0, 90];
    var melhor = null, folgaMelhor = -1;
    for (var i = 0; i < candidatas.length; i++) {
      var a = ((candidatas[i] % 180) + 180) % 180;
      var pior = 180;
      for (var j = 0; j < lados.length; j++) {
        var d = distanciaAngular(a, lados[j]);
        if (d < pior) pior = d;
      }
      if (pior > folgaMelhor) { folgaMelhor = pior; melhor = a; }
      if (pior >= TOL_PARALELA) {
        if (i > 0) {
          avisar(doc, 'hachurar: ' + pedida + ' graus fica paralela a um lado, trocada para ' + a);
        }
        return a;
      }
    }
    avisar(doc, 'hachurar: nenhuma inclinacao escapa dos lados da regiao, ' +
      'a melhor fica a ' + folgaMelhor.toFixed(1) + ' graus de um deles');
    return melhor;
  }

  /* ============================================================ ceviana
   *
   *   ceviana(doc, V, A, B, {tipo, prolongamento, rotulo, cor, espessura,
   *                          tracejado, n, ctx})
   *
   * Traca altura, mediana, bissetriz ou mediatriz a partir do vertice pedido,
   * calcula o pe e o MARCA conforme o tipo: quadradinho para a altura, tracinhos
   * iguais para a mediana, arquinhos iguais para a bissetriz. Devolve o pe, para
   * o chamador rotular as projecoes.
   *
   * A marca no pe nao e detalhe: sem o quadradinho a altura vira uma ceviana
   * qualquer e a aluna confunde com mediana e com bissetriz, que e o erro
   * classico desta serie. Os tres tipos saem do mesmo vertice e do mesmo lado, e
   * a unica coisa que os distingue na folha e a marca.
   *
   * Quando o pe cai FORA do segmento, o prolongamento tracejado em COR.muted vem
   * antes, senao a altura do obtusangulo aparece flutuando fora da figura e nao
   * se sustenta visualmente. E o caso onde a literatura de figura prototipica diz
   * que o aluno erra, porque so viu altura vertical caindo dentro.
   *
   * DECISAO, valida para os quatro tipos: a ceviana sai CONTINUA, 0,90 w, na
   * tinta do contorno. A regra anterior era o contrario, TODA ceviana tracejada
   * em teal 0,60, e foi revista com numero na mao.
   *
   * O que ela acertava: precisa haver um criterio unico, e nao o habito de
   * tracejar o que tem quadradinho no pe. O que ela errava: escolheu o codigo
   * errado. Teal mais tracejado [3 2] e o par reservado a camada de RESPOSTA
   * nesta folha, e o conferirFigura reprova hoje qualquer figura de enunciado que
   * use um dos dois ("linha em teal tracejada [3 2] 0 e 0.60 w numa figura de
   * enunciado"). Vestida assim, a bissetriz que E o objeto da pergunta dizia ao
   * aluno que aquilo ja era a solucao, que foi o defeito medido no exercicio 17
   * do piloto. Pior: em 0,60 w e teal ela ficava a linha MENOS legivel de uma
   * figura que ela propria sustenta, e navy contra teal da 2,33 de contraste,
   * abaixo do minimo, ou seja o unico canal que distinguia ceviana de lado
   * sumia na fotocopia.
   *
   * O que distingue construcao de contorno passa a ser a ESPESSURA, 0,90 contra
   * 1,20, exatamente como ja acontece com a diagonal do diagonais() logo abaixo,
   * e esse par sobrevive a copia. Quem desenha a ceviana na camada de gabarito
   * pede o codigo de resposta por op.cor e op.tracejado.
   *
   * O que continua tracejado e so o PROLONGAMENTO do lado, em COR.muted: ele e a
   * unica linha da funcao que representa o que nao esta la, que e o significado
   * do tracejado em todo o resto do material (aresta escondida de solido).
   *
   * Fica registrado que a trava (b) do conferirFigura reprova QUALQUER [3 2] em
   * figura de enunciado, e portanto reprova tambem este prolongamento: medido
   * com a altura de um obtusangulo, ela devolve "linha em tinta de contorno
   * tracejada [3 2] 0 e 0.60 w numa figura de enunciado". A trava foi escrita
   * contra o par teal mais tracejado e apanha de tabela a unica linha do
   * material que o tracejado descreve com exatidao. Nao se mexe nela daqui: o
   * caso esta no relatorio para quem cuida do base.js. */
  function ceviana(doc, V, A, B, op) {
    op = op || {};
    var Bs = base(), geo = Bs.geo, COR = ger().COR;
    V = nrm(V); A = nrm(A); B = nrm(B);

    var tipo = String(op.tipo || 'altura').toLowerCase();
    if (tipo !== 'altura' && tipo !== 'mediana' && tipo !== 'bissetriz' && tipo !== 'mediatriz') {
      avisar(doc, 'ceviana: tipo desconhecido ' + tipo + ', use altura, mediana, bissetriz ou mediatriz');
      return null;
    }
    if (dist(A, B) < 1e-6) { avisar(doc, 'ceviana: o lado oposto tem comprimento zero'); return null; }
    if (dist(V, A) < 1e-6 || dist(V, B) < 1e-6) {
      avisar(doc, 'ceviana: o vertice coincide com um extremo do lado oposto');
      return null;
    }

    /* Continua, 0,90 w, na TINTA DO CONTORNO. Ver a DECISAO revista no cabecalho
     * desta funcao: o teal tracejado que estava aqui e o codigo da camada de
     * resposta, e o conferirFigura reprova qualquer figura de enunciado que o
     * use. Quem desenha a ceviana na camada de gabarito passa op.cor e
     * op.tracejado e recebe o codigo de resposta de volta. */
    var cor = op.cor || COR.texto;
    var espessura = op.espessura != null ? Number(op.espessura) : ESPESSURA.marca;
    var tracejado = op.tracejado !== undefined ? op.tracejado : false;

    /* O segmento desenhado e sempre [de, ate], com o pe P em algum ponto dele.
     * Guardar as duas pontas separadas do vertice importa por causa da
     * mediatriz, que e a unica que NAO passa por V: ela atravessa o ponto medio
     * para os dois lados, e escrever o traco como [V, P] deixaria a metade de
     * baixo dela de fora. */
    var P, dentro = true, tPe = 0.5, de = V, ate = null, pontaLivre = V;

    if (tipo === 'altura') {
      var r = geo.pe(V, A, B);
      P = pt(r.x, r.y); dentro = r.dentro; tPe = r.t; ate = P;
    } else if (tipo === 'mediana') {
      P = meio(A, B); tPe = 0.5; ate = P;
    } else if (tipo === 'bissetriz') {
      /* Teorema da bissetriz interna: o pe divide AB na razao dos lados
       * adjacentes. Calculado e nao desenhado no olho, para o desenho fechar com
       * o que a propriedade afirma. */
      var c = dist(V, A), b = dist(V, B);
      tPe = c / (c + b);
      P = pt(A.x + (B.x - A.x) * tPe, A.y + (B.y - A.y) * tPe);
      ate = P;
    } else {
      /* Mediatriz: perpendicular a AB pelo ponto medio. Ela nao parte do
       * vertice, entao V serve so para dizer para que lado ela se estende mais, e
       * o pe e o proprio ponto medio. */
      P = meio(A, B); tPe = 0.5;
      var nAB = perp(versor(B.x - A.x, B.y - A.y));
      /* O MESMO alcance para os dois lados do ponto medio. Antes eram 0,45 do
       * alcance para um lado e 1,0 para o outro, e a revisao mediu o resultado na
       * folha: 23 pt abaixo da base e parando antes do apice. Uma reta cortada
       * curta de um lado e longa do outro nao le como reta, le como traco que
       * alguem esqueceu de terminar, e a mediatriz e justamente a unica das
       * quatro cevianas que E uma reta e nao um segmento com dois extremos
       * definidos pela figura. Simetrica, o ponto medio fica no meio do traco, que
       * e o que a construcao afirma. */
      var alcance = dist(A, B) * 0.4;
      var paraV = (V.x - P.x) * nAB.x + (V.y - P.y) * nAB.y >= 0 ? 1 : -1;
      de = somar(P, nAB, -paraV * alcance);
      ate = somar(P, nAB, paraV * alcance);
      pontaLivre = ate;
    }

    var resultado = {
      tipo: 'ceviana', ceviana: tipo, pe: P, dentro: dentro, t: tPe,
      prolongou: false, espessura: espessura,
      projecoes: [dist(A, P), dist(P, B)]
    };

    /* Prolongamento primeiro, para o tracejado mais claro ficar por baixo do pe e
     * do quadradinho. Mais claro e mais fino de proposito: ele nao e o objeto do
     * exercicio, e sim o apoio que faz o pe existir. */
    if (!dentro && op.prolongamento !== false && tipo === 'altura') {
      var deProlonga = tPe < 0 ? A : B;
      Bs.comEstado(doc, { cor: COR.muted, espessura: ESPESSURA.auxiliar, tracejado: 'auxiliar' }, function () {
        traco(doc, [deProlonga, P], false);
      });
      resultado.prolongou = true;
      resultado.prolongamento = [deProlonga, P];
    }

    Bs.comEstado(doc, { cor: cor, espessura: espessura, tracejado: tracejado }, function () {
      traco(doc, [de, ate], false);
    });
    anotar(op, 'traco', {
      x1: de.x, y1: de.y, x2: ate.x, y2: ate.y,
      espessura: espessura, papel: 'ceviana ' + tipo
    });

    /* A marca do pe, que e o que distingue os tres tipos na folha. */
    if (tipo === 'altura' || tipo === 'mediatriz') {
      var uAB2 = versor(B.x - A.x, B.y - A.y);
      /* O quadradinho fica do lado de dentro da figura, e nao do lado que
       * calhar: no obtusangulo, com o pe fora do segmento, o lado "de dentro" e o
       * que aponta para o corpo do triangulo, e e o unico em que o quadradinho
       * encosta no prolongamento em vez de sair no vazio. */
      var alvo = geo.centroide([V, A, B]);
      var sinal = (alvo.x - P.x) * uAB2.x + (alvo.y - P.y) * uAB2.y >= 0 ? 1 : -1;
      var noLado = somar(P, uAB2, sinal * 12);
      resultado.marcaPe = marcaAnguloReto(doc, P, noLado, pontaLivre,
        { lado: op.ladoQuadradinho, cor: op.corMarca || COR.texto, ctx: op.ctx });
      if (tipo === 'mediatriz') {
        /* A mediatriz afirma DUAS coisas, e as duas precisam estar na folha: o
         * angulo reto e a divisao de AB em duas partes iguais. Sem os tracinhos
         * ela e indistinguivel de uma perpendicular qualquer tirada de um ponto
         * de AB. */
        resultado.marcaLados = [
          marcaLado(doc, A, P, { n: 1, cor: op.corMarca || COR.texto, ctx: op.ctx }),
          marcaLado(doc, P, B, { n: 1, cor: op.corMarca || COR.texto, ctx: op.ctx })
        ];
      }
    } else if (tipo === 'mediana') {
      var nTracos = Math.max(1, Math.min(3, Math.round(Number(op.n) || 1)));
      resultado.marcaPe = [
        marcaLado(doc, A, P, { n: nTracos, cor: op.corMarca || COR.texto, ctx: op.ctx }),
        marcaLado(doc, P, B, { n: nTracos, cor: op.corMarca || COR.texto, ctx: op.ctx })
      ];
    } else {
      /* Os dois arquinhos da bissetriz PRECISAM ter o mesmo raio: e a igualdade
       * dos dois que a figura esta afirmando. Deixando cada marcaAngulo escolher
       * o raio dele, um sai de 15 e o outro de 18 pt e a figura passa a dizer que
       * os dois angulos sao diferentes. */
      var nArcos = Math.max(1, Math.min(3, Math.round(Number(op.n) || 1)));
      var perto = Math.min(dist(V, A), dist(V, B), dist(V, P));
      var raioIgual = Math.max(RAIO_MIN, Math.min(0.30 * perto, RAIO_MAX));
      if (raioIgual + (nArcos - 1) * PASSO_ARCO > 0.55 * perto) {
        raioIgual = Math.max(6, 0.55 * perto - (nArcos - 1) * PASSO_ARCO);
      }
      resultado.marcaPe = [
        marcaAngulo(doc, V, A, P, { voltas: nArcos, raio: raioIgual, cor: op.corMarca || COR.texto, ctx: op.ctx }),
        marcaAngulo(doc, V, P, B, { voltas: nArcos, raio: raioIgual, cor: op.corMarca || COR.texto, ctx: op.ctx })
      ];
    }

    if (op.rotulo) {
      /* O rotulo da ceviana sai na normal ao proprio segmento, empurrado para
       * longe do centro da figura: colado no segmento ele fica em cima da linha,
       * e do lado do centro ele encosta na hachura e nas diagonais.
       *
       * E anda ate achar lugar limpo, pela mesma razao do rotulo do marcaAngulo:
       * o halo dele e branco e o "h" da altura de um triangulo pequeno pousava em
       * cima do contorno, abrindo um buraco de 7,5 por 9,2 pt num lado de 1,20 w.
       * Aqui a saida e mais simples que la, porque o rotulo nao esta preso a
       * nenhuma cunha: basta afastar mais na propria normal, que e a direcao em
       * que ele ja estava indo. */
      var texto = String(op.rotulo);
      var m = meio(de, ate);
      var uSeg = versor(ate.x - de.x, ate.y - de.y);
      var nSeg = perp(uSeg);
      var centroFig = geo.centroide([V, A, B]);
      var fora = (m.x - centroFig.x) * nSeg.x + (m.y - centroFig.y) * nSeg.y >= 0 ? 1 : -1;
      var tam = op.tam || TAM_ROTULO;
      var medCev = {
        tam: tam,
        caixa: { largura: ger().medir(texto, tam, false) + 2.8, altura: tam * 1.08 }
      };
      var obstCev = obstaculosDe(op, []);
      var vizCev = caixasDe(op);
      var afasta = 8 + tam * 0.3, anc = somar(m, nSeg, fora * afasta);
      for (var tent = 0; tent < 8; tent++) {
        anc = somar(m, nSeg, fora * (afasta + tent * 2.5));
        if (caixaLivre(caixaEm(anc.x, anc.y, medCev), obstCev, vizCev)) break;
      }
      resultado.rotulo = escrever(doc, texto, anc.x, anc.y - tam * 0.35,
        { tam: tam, align: 'centro', cor: op.corRotulo || COR.texto });
      anotar(op, 'rotulo', resultado.rotulo);
    }

    return resultado;
  }

  /* ============================================================ diagonais
   *
   *   diagonais(doc, pontos, {quais, deVertice, destaque, nomes, cor, tracejado,
   *                           encontro, rotuloEncontro, anguloEncontro,
   *                           rotuloAngulo, corMarca, espessura, ctx})
   *
   * O trio encontro, anguloEncontro e rotuloAngulo anda junto: o primeiro marca
   * o ponto, o segundo diz QUAL dos quatro angulos que nascem ali a pergunta
   * pede (por padrao o do par de menor indice, que no quadrilatero ABCD e o
   * AOB), e o terceiro escreve a incognita nele. O corMarca e a tinta do arco do
   * cruzamento, que por padrao e a do contorno e nao a da bolinha.
   *
   * Gera os pares de vertices nao adjacentes e desenha os selecionados: todas, so
   * as que partem de um vertice, ou uma lista escrita a mao. No peso de linha
   * auxiliar, 0,6 pt, e CONTINUA.
   *
   * Continua e nao tracejada de proposito, e isso e uma decisao e nao um
   * esquecimento: a diagonal de um quadrilatero existe de verdade dentro da
   * figura, ela e objeto do exercicio. Tracejado neste material significa uma
   * coisa so, o que nao esta la ou o que e construcao (altura, prolongamento,
   * aresta escondida de solido). Se a diagonal tambem virasse tracejada, a leitura
   * de profundidade dos solidos ia junto.
   *
   * O destaque existe porque e ele que torna contavel o "n menos 3 dividido por
   * 2": as que saem de um vertice em cor cheia e as demais recuadas mostram, sem
   * formula, quantas partem de cada vertice e que cada uma foi contada duas
   * vezes. */
  function diagonais(doc, pontos, op) {
    op = op || {};
    var Bs = base(), COR = ger().COR;
    var pts = lista(pontos);
    var n = pts.length;
    if (n < 4) {
      avisar(doc, 'diagonais: poligono de ' + n + ' lados nao tem diagonal');
      return null;
    }
    var nomes = op.nomes && op.nomes.length ? op.nomes : null;

    function indiceDe(v) {
      if (v === null || v === undefined) return -1;
      if (typeof v === 'number') return (v % n + n) % n;
      var alvo = String(v).toUpperCase();
      if (nomes) {
        for (var i = 0; i < n; i++) if (String(nomes[i]).toUpperCase() === alvo) return i;
      }
      var cod = alvo.charCodeAt(0) - 65;
      return cod >= 0 && cod < n ? cod : -1;
    }

    var todos = [];
    for (var i = 0; i < n; i++) {
      for (var j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;   // lado, nao diagonal
        todos.push([i, j]);
      }
    }

    var escolhidos = todos;
    if (op.deVertice !== undefined && op.deVertice !== null) {
      var v0 = indiceDe(op.deVertice);
      if (v0 < 0) {
        avisar(doc, 'diagonais: deVertice=' + op.deVertice + ' nao e vertice deste poligono');
        return null;
      }
      escolhidos = [];
      for (var t = 0; t < todos.length; t++) {
        if (todos[t][0] === v0 || todos[t][1] === v0) escolhidos.push(todos[t]);
      }
    } else if (op.quais && op.quais !== 'todas') {
      escolhidos = [];
      var pedidos = ehLista(op.quais) ? op.quais : String(op.quais).split(';');
      for (var q = 0; q < pedidos.length; q++) {
        var par = pedidos[q], a, b;
        if (ehLista(par)) { a = indiceDe(par[0]); b = indiceDe(par[1]); }
        else {
          var duas = String(par).split(/[-:]/);
          a = indiceDe(duas[0]); b = indiceDe(duas[1]);
        }
        if (a < 0 || b < 0 || a === b) {
          avisar(doc, 'diagonais: par invalido ' + par);
          continue;
        }
        /* Par adjacente pedido como diagonal e erro de quem escreveu o tema, e
         * calado ele desenha um LADO por cima do contorno, em outra cor e mais
         * fino: fica parecendo um lado com problema de impressao. */
        var vizinhos = Math.abs(a - b) === 1 || Math.abs(a - b) === n - 1;
        if (vizinhos) {
          avisar(doc, 'diagonais: ' + par + ' e um lado do poligono e nao uma diagonal');
          continue;
        }
        escolhidos.push([Math.min(a, b), Math.max(a, b)]);
      }
    }
    if (!escolhidos.length) {
      avisar(doc, 'diagonais: nenhuma diagonal selecionada');
      return null;
    }

    var iDestaque = op.destaque !== undefined && op.destaque !== null ? indiceDe(op.destaque) : -1;
    /* Peso da diagonal: 0,9 pt na que carrega o argumento, 0,6 pt na recuada.
     *
     * Estava tudo em 0,6, o piso, e isso contradizia a propria decisao escrita no
     * cabecalho desta funcao: a diagonal e CONTINUA porque ela existe de verdade
     * dentro da figura e e objeto do exercicio, ao contrario da altura e do
     * prolongamento, que sao construcao. Se ela e objeto, ela pertence ao nivel
     * da marca (0,9) e nao ao nivel do auxiliar (0,6). Medido na p4 do piloto: a
     * diagonal que sustenta o argumento inteiro da secao ("todo quadrilatero se
     * parte em dois triangulos, entao a soma da 360") saia em 0,60 w na tinta
     * mais clara da figura, ou seja, era a linha MENOS legivel de uma figura que
     * ela propria explica. Em 0,90 ela vira a segunda coisa mais legivel, atras
     * so do contorno de 1,20.
     *
     * As recuadas ficam em 0,6 de proposito: no poligono de sete lados as
     * catorze diagonais em 0,9 viram uma teia que compete com o contorno. Assim
     * o destaque passa a ser dito duas vezes, por cor e por espessura, que e o
     * unico par que sobrevive a fotocopia. */
    var espessura = op.espessura != null ? Number(op.espessura) : ESPESSURA.marca;
    var espessuraFraca = op.espessura != null ? Number(op.espessura) : ESPESSURA.auxiliar;
    /* E na TINTA DO CONTORNO, nao em teal. Teal e o tracejado [3 2] sao o codigo
     * da camada de resposta, e uma diagonal do enunciado vestida de resposta diz
     * ao aluno que aquilo ja e a solucao. O que separa a diagonal do lado passa a
     * ser a espessura, 0,9 contra 1,2, que e o canal que sobrevive a fotocopia;
     * navy contra teal da 2,33 de contraste e nao sobrevive. Quem quiser a
     * diagonal em teal na camada de gabarito continua passando op.cor. */
    var corPrincipal = op.cor || COR.texto;
    var corSecundaria = op.corSecundaria || COR.muted;

    var fortes = [], fracas = [];
    for (var e = 0; e < escolhidos.length; e++) {
      var par2 = escolhidos[e];
      var seg = [pts[par2[0]], pts[par2[1]]];
      if (iDestaque >= 0 && par2[0] !== iDestaque && par2[1] !== iDestaque) fracas.push(seg);
      else fortes.push(seg);
    }

    function desenharGrupo(segs, cor, peso) {
      if (!segs.length) return;
      Bs.comEstado(doc, { cor: cor, espessura: peso, tracejado: op.tracejado || false }, function () {
        for (var s = 0; s < segs.length; s++) traco(doc, segs[s], false);
      });
      for (var s2 = 0; s2 < segs.length; s2++) {
        anotar(op, 'traco', {
          x1: segs[s2][0].x, y1: segs[s2][0].y, x2: segs[s2][1].x, y2: segs[s2][1].y,
          espessura: peso, papel: 'diagonal'
        });
      }
    }
    /* As recuadas primeiro, para as em destaque ficarem por cima no cruzamento. */
    desenharGrupo(fracas, corSecundaria, espessuraFraca);
    desenharGrupo(fortes, corPrincipal, espessura);

    var resultado = {
      tipo: 'diagonais', pares: escolhidos,
      total: todos.length, desenhadas: escolhidos.length, encontro: null
    };

    if (op.encontro && escolhidos.length >= 2) {
      var P = cruzamento(pts[escolhidos[0][0]], pts[escolhidos[0][1]],
        pts[escolhidos[1][0]], pts[escolhidos[1][1]]);
      if (!P) {
        avisar(doc, 'diagonais: as duas primeiras diagonais nao se cruzam, sem ponto de encontro');
      } else {
        /* ------------------------------------------- o arco do cruzamento
         *
         * Um cruzamento NOMEADO e sempre um angulo pedido: batizar o ponto onde
         * duas diagonais se encontram e o unico motivo de ele existir no
         * desenho, e a pergunta que vem depois e sempre sobre um dos angulos que
         * nascem ali. Quatro angulos nascem num cruzamento, e ate aqui a figura
         * saia com bolinha e letra e nenhum arco: ela apontava o PONTO e nao
         * dizia qual dos quatro a pergunta quer. A aluna olha e nao sabe por onde
         * comecar, que e o mesmo defeito do valor solto sem arco, so que sem
         * numero nenhum para servir de pista.
         *
         * Qual dos quatro, por padrao: o formado pelas duas semirretas que vao
         * para os vertices de MENOR indice de cada diagonal. No quadrilatero
         * ABCD, com as diagonais AC e BD cruzando em O, isso da o angulo AOB, que
         * e como o exercicio pergunta. Quem quiser outro escreve
         * anguloEncontro='B-C', na mesma sintaxe de quais.
         *
         * O arco sai ANTES da bolinha e da letra de proposito: desenhado depois,
         * ele passaria por cima do halo do nome do ponto.
         *
         * Contagem: o arco entra sem ctx quando nao tem rotulo proprio, pela
         * mesma regra que ja vale no marcaAngulo, o arco nao e dado a ler, e o
         * que diz de qual angulo o dado fala. Aqui o dado e a letra do
         * cruzamento, que o rotuloEncontro logo abaixo ja conta. */
        var ra = -1, rb = -1;
        if (op.anguloEncontro) {
          var duasR = ehLista(op.anguloEncontro) ? op.anguloEncontro
            : String(op.anguloEncontro).split(/[-:;]/);
          ra = indiceDe(duasR[0]); rb = indiceDe(duasR[1]);
          if (ra < 0 || rb < 0 || ra === rb) {
            avisar(doc, 'diagonais: anguloEncontro=' + op.anguloEncontro +
              ' nao nomeia dois vertices deste poligono');
            ra = rb = -1;
          }
        }
        if (ra < 0 || rb < 0) { ra = escolhidos[0][0]; rb = escolhidos[1][0]; }
        resultado.arcoEncontro = marcaAngulo(doc, P, pts[ra], pts[rb], {
          rotulo: op.rotuloAngulo != null ? op.rotuloAngulo : null,
          tam: op.tam, cor: op.corMarca || COR.texto,
          corRotulo: op.corRotulo || COR.texto,
          ctx: op.rotuloAngulo != null ? op.ctx : null
        });

        /* Bolinha cheia pelo doc.circulo, que e o unico uso dele que sobrou: com
         * preenche falso a espessura fica cravada em 1,6 dentro do proprio
         * operador e ele so faz circunferencia inteira. */
        Bs.comEstado(doc, {}, function () {
          doc.circulo(P.x, P.y, 2.0, op.cor || COR.teal, true);
        });
        resultado.encontro = anotar(op, 'marca', { tipo: 'encontro', x: P.x, y: P.y, raio: 2.0 });
        if (op.rotuloEncontro) {
          /* O nome do ponto sai do lado CONTRARIO ao do arco. Antes ele saia na
           * direcao que vai do centro do poligono para o cruzamento, que no
           * quadrilatero cai quase no zero e virava um "para baixo" fixo, ou
           * seja, dentro do angulo recem marcado: a letra pousava na cunha do
           * arco e passava a ser lida como o rotulo daquele angulo, e nao como o
           * nome do ponto. Sao duas coisas diferentes e cada uma tem o seu lado. */
          var dir;
          if (resultado.arcoEncontro && resultado.arcoEncontro.bissetriz) {
            dir = pt(-resultado.arcoEncontro.bissetriz.x, -resultado.arcoEncontro.bissetriz.y);
          } else {
            var centro = Bs.geo.centroide(pts);
            dir = versor(P.x - centro.x, P.y - centro.y);
            if (Math.abs(P.x - centro.x) + Math.abs(P.y - centro.y) < 1) dir = pt(0, -1);
          }
          var tam = op.tam || TAM_ROTULO;
          var anc = somar(P, dir, 9);
          resultado.rotulo = escrever(doc, String(op.rotuloEncontro), anc.x, anc.y - tam * 0.35,
            { tam: tam, align: 'centro', cor: op.corRotulo || COR.texto });
          anotar(op, 'rotulo', resultado.rotulo);
        }
      }
    }

    return resultado;
  }

  /* Cruzamento de dois segmentos. Devolve null quando sao paralelos ou quando o
   * ponto cai fora dos dois, para nao marcar bolinha no vazio. */
  function cruzamento(A, B, C, D) {
    var r = pt(B.x - A.x, B.y - A.y), s = pt(D.x - C.x, D.y - C.y);
    var den = r.x * s.y - r.y * s.x;
    if (Math.abs(den) < 1e-9) return null;
    var t = ((C.x - A.x) * s.y - (C.y - A.y) * s.x) / den;
    var u = ((C.x - A.x) * r.y - (C.y - A.y) * r.x) / den;
    if (t < -1e-6 || t > 1 + 1e-6 || u < -1e-6 || u > 1 + 1e-6) return null;
    return pt(A.x + r.x * t, A.y + r.y * t);
  }

  return {
    marcaAngulo: marcaAngulo,
    marcaAnguloReto: marcaAnguloReto,
    marcaLado: marcaLado,
    hachurar: hachurar,
    ceviana: ceviana,
    diagonais: diagonais,
    COR_AREA: COR_AREA, corDeArea: corDeArea,
    ESPESSURA: ESPESSURA,
    RAIO_MIN: RAIO_MIN, RAIO_MAX: RAIO_MAX, PASSO_ARCO: PASSO_ARCO,
    LADO_RETO: LADO_RETO, TAM_TRACO: TAM_TRACO, FOLGA_TRACO: FOLGA_TRACO,
    TAM_SETA: TAM_SETA, FOLGA_SETA: FOLGA_SETA, SEPARA_ARCO: SEPARA_ARCO,
    ESPACAMENTO_MIN: ESPACAMENTO_MIN, HACHURA_MAX: HACHURA_MAX,
    ANG_ESTREITO: ANG_ESTREITO, FOLGA_ROTULO: FOLGA_ROTULO,
    PISO_CORPO: PISO_CORPO, MARGEM_ROTULO: MARGEM_ROTULO,
    /* Os tres da faixa em que o valor de angulo cabe: o piso de vao ate outro
     * rotulo, o giro maximo em torno do vertice e o teto de alcance do arco.
     * Exportados pelo mesmo motivo dos outros pisos, que e quem escreve prova
     * poder cobrar o numero em vez de repetir a constante. */
    SEPARA_BLOCO: SEPARA_BLOCO, GIRO_MAX: GIRO_MAX, ALCANCE_ARCO: ALCANCE_ARCO
  };
});
