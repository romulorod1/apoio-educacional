/* figuras/_casos_retas_temas.js
 * A diretiva @fig de cada figura de reta dos cinco temas que a receita retas
 * existe para atender, e a prova de que todas desenham limpas.
 *
 * Este arquivo existe por um motivo de verificabilidade e nao de teste. Os cinco
 * temas ainda NAO tem @fig escrita no banco: a receita chegou primeiro, e quem
 * for escrever as diretivas nos .md precisa de uma lista pronta para colar, e
 * quem for revisar precisa poder rodar a lista sem ter o tema na mao. Sem este
 * arquivo, a afirmacao "a familia serve aos cinco temas" nao seria reproduzivel
 * a partir do commit: ela viveria so no relatorio.
 *
 * O que ele roda: cada diretiva pelo caminho de verdade (partesDeFigura do
 * pdf.js mais doc.figura), e cobra que a figura saia, sem NENHUM aviso e sem
 * falha de conferencia. Uma diretiva que pare de valer aparece aqui antes de
 * chegar ao tema.
 *
 * O que ele NAO e: a folha de prova da receita, que e o _prova_retas.js, com as
 * travas, os pares envenenados e a medicao no fluxo.
 *
 * As figuras dos cinco temas que NAO sao de reta ficam de fora, com o motivo na
 * lista FORA no fim do arquivo: elas pedem outra receita e nao esta.
 *
 * Regra da casa: nunca usar travessao.
 */
const PDFGen = require('../pdf.js');
const FigReceitas = require('./receitas.js');

const MARG_E = PDFGen.MARG_E, MARG_D = PDFGen.MARG_D;
const LARGURA = MARG_D - MARG_E - 40;
const LEG_ESCALA = 'legenda=Figura fora de escala.';

/* Cada entrada e [tema, onde, diretiva]. As que chamam por id vem logo depois da
 * figura de origem, para o registro por id existir quando elas rodam. */
const CASOS = [
  /* ---------------------------------------------------- MAT08-11, angulos em retas paralelas */
  ['MAT08-11', 'explicacao, a figura base, metade de cima',
   '@fig retas id=b8a reta=r reta=s paralelas=r;s transversal=t nomeiaangulos=a;b nomeiaretas=r;s'],
  ['MAT08-11', 'explicacao, a figura base, metade de baixo',
   '@fig retas id=b8b reta=r reta=s paralelas=r;s transversal=t;55 incognita=c;3 incognita=d;4 incognita=e;5 incognita=f;6'],
  /* UM par por figura, e nao os dois. A versao anterior era
   * "congruentes=1;3 congruentes=2;4", que marca as QUATRO cunhas do cruzamento,
   * e a folha rasterizada le como um circulo riscado por duas retas: nao se
   * conta quais arcos sao duplos sem ampliar seis vezes.
   *
   * Medido, porque o olho sozinho nao serve de argumento: as quatro cunhas somam
   * 610 graus de arco dentro de uma faixa de raio de 11,5 pt (14, 17,5 e 25,5),
   * e 500 desses graus ficam entre 14 e 17,5 pt, isto e duas voltas quase
   * completas separadas por 3,5 pt. Inverter a ordem dos grupos baixa para 470 e
   * nao resolve, porque a classe larga sozinha ja poe 250 graus num raio so.
   * Com um par, sao 250 graus num raio unico e a figura le limpa: dois arcos
   * claramente separados em angulos opostos.
   *
   * O piso do conferirFigura nao pega isto, e nem devia: ele mede o VAO entre
   * dois arcos (aqui 8 pt, acima do piso de 6) e o que estraga e outra coisa, a
   * COBERTURA ANGULAR somada numa faixa estreita de raio. Fica registrado como
   * falta de kit; a saida de autoria e esta, e nao esperar o kit.
   *
   * O par largo (2 e 4) foi o escolhido por ser o que sobra com o valor legivel
   * do lado de fora, e um par basta para ensinar: a explicacao diz por escrito
   * que o outro par tambem e igual. */
  ['MAT08-11', 'explicacao, um cruzamento ampliado, opostos pelo vertice',
   '@fig retas id=b8c reta=r reta=s congruentes=2;4'],
  ['MAT08-11', 'explicacao, painel do par: correspondentes',
   '@fig retas id=p1 reta=r reta=s paralelas=r;s transversal=t congruentes=1;5'],
  ['MAT08-11', 'explicacao, painel do par: alternos internos',
   '@fig retas id=p2 reta=r reta=s paralelas=r;s transversal=t congruentes=3;5'],
  ['MAT08-11', 'explicacao, painel do par: alternos externos',
   '@fig retas id=p3 reta=r reta=s paralelas=r;s transversal=t congruentes=1;7'],
  ['MAT08-11', 'explicacao, painel do par: colaterais internos',
   '@fig retas id=p4 reta=r reta=s paralelas=r;s transversal=t angulo=110;3 angulo=70;6'],
  ['MAT08-11', 'explicacao, painel do par: colaterais externos',
   '@fig retas id=p5 reta=r reta=s paralelas=r;s transversal=t angulo=110;1 angulo=70;8'],
  ['MAT08-11', 'exercicio 1',
   '@fig retas id=e1 reta=r reta=s paralelas=r;s transversal=t angulo=70;1 incognita=x;5'],
  ['MAT08-11', 'gabarito 1', '@fig id=e1 fase=gabarito'],
  ['MAT08-11', 'exercicio 2',
   '@fig retas id=e2 reta=r reta=s paralelas=r;s transversal=t angulo=70;3 incognita=x;6'],
  ['MAT08-11', 'exercicio 3 (o 11 e o mesmo com 118)',
   '@fig retas id=e3 reta=r reta=s paralelas=r;s transversal=t angulo=125;3 incognita=x;5 incognita=y;4'],
  ['MAT08-11', 'exercicio 4',
   '@fig retas id=e4 reta=r reta=s angulo=48;1 incognita=x;3 incognita=y;2'],
  ['MAT08-11', 'exercicio 5',
   '@fig retas id=e5 reta=r reta=s paralelas=r;s transversal=t angulo=3x+10;3 angulo=5x-30;5'],
  ['MAT08-11', 'exercicio 6',
   '@fig retas id=e6 reta=r reta=s paralelas=r;s transversal=t angulo=2x+30;3 angulo=x+30;6'],
  ['MAT08-11', 'exercicio 7',
   '@fig retas id=e7 reta=r reta=s paralelas=r;s transversal=t angulo=4x-20;1 angulo=2x+40;5'],
  ['MAT08-11', 'exercicio 8, figura (a), os quatro angulos de cima',
   '@fig retas id=e8a reta=r reta=s paralelas=r;s transversal=t angulo=35;1 incognita=b;2 incognita=e;5 incognita=f;6'],
  ['MAT08-11', 'exercicio 8, figura (b), os quatro de baixo',
   '@fig retas id=e8b reta=r reta=s paralelas=r;s transversal=t;35 incognita=c;3 incognita=d;4 incognita=g;7 incognita=h;8'],
  ['MAT08-11', 'gabarito 8, figura (a)', '@fig id=e8a fase=gabarito'],
  ['MAT08-11', 'gabarito 8, figura (b)', '@fig id=e8b fase=gabarito'],
  ['MAT08-11', 'exercicio 11',
   '@fig retas id=e11 reta=r reta=s paralelas=r;s transversal=t angulo=118;1 incognita=x;7 incognita=y;8'],
  ['MAT08-11', 'exercicio 12',
   '@fig retas id=e12 reta=r reta=s paralelas=r;s transversal=t angulo=3x;4 angulo=2x;5'],
  ['MAT08-11', 'exercicio 13',
   '@fig retas id=e13 reta=r reta=s paralelas=r;s transversal=t angulo=3x;3 angulo=x;6'],
  ['MAT08-11', 'exercicio 19',
   '@fig retas id=e19 reta=r reta=s paralelas=r;s transversal=t angulo=4x+10;1 angulo=6x+20;8'],

  /* ---------------------------------------------------- MAT09-08, semelhanca e Tales */
  ['MAT09-08', 'explicacao, o feixe de tres paralelas com duas transversais',
   '@fig retas id=t1 feixe=3;a;b;c transversal=t transversal=u corta=t;3;a1 corta=t;5;a2 corta=u;3;b1 corta=u;5;b2'],
  ['MAT09-08', 'exercicio 2',
   '@fig retas id=t2 feixe=3;a;b;c transversal=t transversal=u corta=t;4 corta=t;6 corta=u;x corta=u;9'],
  ['MAT09-08', 'gabarito 2', '@fig id=t2 fase=gabarito'],
  ['MAT09-08', 'exercicio 8',
   '@fig retas id=t8 feixe=3;a;b;c transversal=t transversal=u corta=t;6 corta=t;10 corta=u;9 corta=u;x'],
  ['MAT09-08', 'gabarito 8', '@fig id=t8 fase=gabarito'],
  /* ---------------------------------------------------- MAT06-09, angulos e retas */
  ['MAT06-09', 'explicacao, duas concorrentes com os quatro angulos',
   '@fig retas id=c4 reta=r reta=s angulo=63;1 angulo=117;2 angulo=63;3 angulo=117;4'],
  ['MAT06-09', 'explicacao, paralelas e transversal com os angulos nomeados',
   '@fig retas id=c5a reta=r reta=s paralelas=r;s transversal=t nomeiaangulos=a;b nomeiaretas=r;s'],
  ['MAT06-09', 'exercicio 4',
   '@fig retas id=c6 reta=r reta=s angulo=63;1 incognita=x;2 incognita=y;3 incognita=z;4'],
  ['MAT06-09', 'gabarito 4', '@fig id=c6 fase=gabarito'],
  /* O 65 tem que morar numa posicao INTERNA (3, 4, 5 ou 6): so angulo interno
   * tem alterno interno e colateral interno, que e o que o enunciado pede. Posto
   * na 1, que e externa, o "alterno interno" virava o oposto pelo vertice e o
   * colateral interno nao aparecia na figura; o gabarito ainda imprimiria 65 por
   * coincidencia, nomeando outro angulo. Com o 65 na 4: correspondente 8,
   * alterno interno 6, colateral interno 5. */
  ['MAT06-09', 'exercicio 8',
   '@fig retas id=c8 reta=r reta=s paralelas=r;s transversal=t angulo=65;4 incognita=x;8 incognita=y;6 incognita=z;5'],
  ['MAT06-09', 'exercicio 15',
   '@fig retas id=c15 reta=r reta=s paralelas=r;s transversal=t angulo=2x+30;3 angulo=3x+10;6'],
  /* SO o valor dado, sem incognita nenhuma, e a razao e o enunciado deste
   * exercicio em particular. Ele pergunta "quais sao as medidas possiveis e
   * QUANTOS angulos existem de cada medida", e o gabarito responde quatro de
   * cada. A versao anterior marcava quatro dos oito (143 na 2, mais x, y e z nas
   * posicoes 1, 5 e 6), e pela paridade isso imprime 143, 37, 37 e 143: quem
   * contasse pelo desenho responderia DOIS de cada, que e errado, e erraria
   * justamente a pergunta feita. Figura que conduz a resposta errada e pior que
   * figura ausente.
   *
   * Marcar os oito nao e saida: custa 9 marcas e o teto e 5, e a receita recusa
   * (medido). Com so o dado, a figura mostra a configuracao e o unico valor
   * conhecido, os oito angulos existem visualmente sem marca, e a contagem volta
   * a ser o raciocinio que o exercicio cobra. */
  ['MAT06-09', 'exercicio 17',
   '@fig retas id=c17 reta=r reta=s paralelas=r;s transversal=t angulo=143;2'],

  /* ---------------------------------------------------- MAT04-07, retas, angulos e giros */
  ['MAT04-07', 'explicacao, painel de retas: paralelas',
   '@fig retas id=q1 reta=r reta=s paralelas=r;s nomeiaretas=sim'],
  /* O painel do 4o ano mostra o que as retas SAO, e nao quanto medem: medida na
   * figura entra no 4o ano, mas aqui a celula do meio so precisa dizer "estas se
   * cruzam". O 55 seria numero sem pergunta. */
  ['MAT04-07', 'explicacao, painel de retas: concorrentes',
   '@fig retas id=q2 reta=r reta=s nomeiaretas=sim'],
  ['MAT04-07', 'explicacao, painel de retas: perpendiculares',
   '@fig retas id=q3 reta=r reta=s reto=sim nomeiaretas=sim'],
  /* O exercicio 3 do MAT04-07 SAI SEM FIGURA, e a diretiva que estava aqui foi
   * removida. Ela era "reta=r reta=s reto=sim nomeiaretas=sim", byte a byte a
   * mesma celula de perpendiculares da explicacao tres paragrafos acima, e o
   * enunciado pergunta "que nome recebem essas retas?". Com a mesma figura ja
   * rotulada "perpendiculares" na mesma folha, a pergunta deixa de ser pergunta
   * e vira consulta. Pior, o enunciado tem duas partes ("e como se chamam duas
   * retas que nunca se cruzam?") e a figura responde uma so, entao ela ainda
   * sugere que a resposta esta toda ali.
   *
   * E o enunciado descreve a configuracao por escrito ("duas retas se cruzam
   * formando quatro angulos retos"), o que ja atende a regra de que figura no
   * enunciado e excecao. */

  /* ---------------------------------------------------- MAT07-11, medir, somar e classificar */
  ['MAT07-11', 'explicacao, duas retas cruzadas com as duas classes de congruencia',
   '@fig retas id=m1 reta=r reta=s congruentes=1;3 congruentes=2;4'],
  ['MAT07-11', 'exercicio 4',
   '@fig retas id=m4 reta=r reta=s angulo=64;1 incognita=x;3'],
  ['MAT07-11', 'gabarito 4', '@fig id=m4 fase=gabarito'],
  ['MAT07-11', 'exercicio 10',
   '@fig retas id=m10 reta=r reta=s angulo=3x+10;1 angulo=5x-30;3'],
  ['MAT07-11', 'exercicio 17',
   '@fig retas id=m17 reta=r reta=s angulo=3x;1 angulo=2x+20;2 incognita=y;3 incognita=z;4'],
  ['MAT07-11', 'gabarito 17', '@fig id=m17 fase=gabarito']
];

/* As figuras que os cinco temas pedem e que NAO sao de reta. Ficam escritas aqui
 * para quem varrer o banco saber que elas foram vistas e por que nao entraram, e
 * nao para serem desenhadas. */
const FORA = [
  ['angulo isolado (duas semirretas com um vertice)',
   'MAT06-09 os dois angulos de 40 com lados de comprimentos diferentes, a tira agudo/reto/obtuso/raso, ' +
   'os adjacentes dentro de um reto, a bissetriz de 138; MAT07-11 o painel de classificacao, ' +
   'complementares e suplementares, a bissetriz de 116, os tres angulos sobre uma reta; MAT04-07 o painel ' +
   'de quatro angulos, o angulo raso partido, os angulos em volta de um ponto. Reta atravessa a moldura por ' +
   'decisao da especificacao, e semirreta com origem marcada e outra primitiva'],
  ['mostrador de relogio e rosa dos ventos',
   'MAT04-07 (duas figuras), MAT06-09 gabarito 16, MAT07-11 explicacao. E circulo com setor'],
  ['triangulo com reta auxiliar',
   'MAT08-11 a demonstracao da soma 180 e o teorema do angulo externo, e o exercicio 20. Pede contorno ' +
   'fechado; o angulo externo ja e triangulo com externo='],
  ['bissetriz tracada sobre o cruzamento',
   'MAT08-11 15 e 17. Cabe na gramatica de posicao desta receita e seria a chave bissetriz=posicao, que ' +
   'nao foi escrita'],
  ['segmento entre as paralelas com extremos nomeados',
   'MAT08-11 16. Pede poligono aberto'],
  ['paralelogramo', 'MAT08-11 14. E quadrilatero, que ja desenha'],
  ['painel ponto, reta, semirreta e segmento', 'MAT04-07 explicacao. Pede semirreta e segmento'],
  ['os dois triangulos semelhantes, a sombra do poste, o trapezio com as diagonais e a rampa',
   'MAT09-08. Sao triangulo e quadrilatero'],
  ['MAT09-08 exercicio 17, o feixe com x e x+4 numa transversal e 6 e 10 na outra',
   'a expressao "x+4" nao pode ser impressa: a trava (a) do conferirFigura classifica qualquer ' +
   'expressao algebrica dentro de uma figura como valor de ANGULO e cobra dela um arco, e a cota ' +
   'de um segmento nao tem arco. Rotular a segunda cota com outra letra faria a figura ' +
   'CONTRADIZER o enunciado, porque um y le como incognita independente e o exercicio diz que a ' +
   'segunda mede x mais 4, e diretiva que contradiz o texto nao pode sair colavel. O exercicio ' +
   'fica sem figura ate a trava do base.js distinguir rotulo de cota de valor de angulo']
];

/* ================================================================ a conferencia */

const doc = new PDFGen.Doc();
doc.novaPagina();
let ok = 0, mau = 0;

for (const [tema, onde, fig] of CASOS) {
  const nAvisos = (doc.avisosFigura || []).length;
  const antes = (doc.figurasDesenhadas || []).length;
  doc.partesDeFigura(fig).forEach(function (p) {
    if (p.tipo === 'figura') doc.figura(p.diretiva, { x: MARG_E + 20, largura: LARGURA });
  });
  const reg = (doc.figurasDesenhadas || [])[antes] || null;
  const avisos = (doc.avisosFigura || []).slice(nAvisos);
  const bom = !!reg && avisos.length === 0 && (reg.conferencia || []).length === 0;
  if (bom) ok++; else mau++;
  const textos = reg ? (reg.medido.textos || []).map((t) => t.txt).join(' ') : '(nao saiu)';
  console.log((bom ? '  OK    ' : '  FALHA ') + (tema + ' ' + onde).padEnd(58) +
    ' marcas=' + (reg ? reg.marcasAtivas : '-') + '  ' + textos);
  for (const a of avisos) console.log('          aviso: ' + a);
}

console.log('\nfiguras destes cinco temas que pedem OUTRA receita:');
for (const [o_que, porque] of FORA) console.log('  . ' + o_que + ': ' + porque);

console.log('\n' + ok + ' diretivas desenharam limpas, ' + mau + ' falharam.');
process.exit(mau ? 1 : 0);
