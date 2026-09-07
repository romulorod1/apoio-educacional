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
  ['MAT08-11', 'explicacao, um cruzamento ampliado, opostos pelo vertice',
   '@fig retas id=b8c reta=r reta=s congruentes=1;3 congruentes=2;4'],
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
  /* O 17 pede "x e x+4" numa transversal e "6 e 10" na outra. A expressao x+4
   * NAO pode ser impressa: a trava (a) do conferirFigura classifica qualquer
   * expressao algebrica numa figura como valor de ANGULO e cobra dela um arco, e
   * a cota de um segmento nao tem arco. A figura sai construida com a resposta
   * (x = 6) e rotulada com letras simples; o enunciado e que diz que a segunda
   * mede x + 4. */
  ['MAT09-08', 'exercicio 17',
   '@fig retas id=t17 feixe=3;a;b;c transversal=t transversal=u corta=t;6;x corta=t;10;y corta=u;6 corta=u;10'],

  /* ---------------------------------------------------- MAT06-09, angulos e retas */
  ['MAT06-09', 'explicacao, duas concorrentes com os quatro angulos',
   '@fig retas id=c4 reta=r reta=s angulo=63;1 angulo=117;2 angulo=63;3 angulo=117;4'],
  ['MAT06-09', 'explicacao, paralelas e transversal com os angulos nomeados',
   '@fig retas id=c5a reta=r reta=s paralelas=r;s transversal=t nomeiaangulos=a;b nomeiaretas=r;s'],
  ['MAT06-09', 'exercicio 4',
   '@fig retas id=c6 reta=r reta=s angulo=63;1 incognita=x;2 incognita=y;3 incognita=z;4'],
  ['MAT06-09', 'gabarito 4', '@fig id=c6 fase=gabarito'],
  ['MAT06-09', 'exercicio 8',
   '@fig retas id=c8 reta=r reta=s paralelas=r;s transversal=t angulo=65;1 incognita=x;5 incognita=y;3'],
  ['MAT06-09', 'exercicio 15',
   '@fig retas id=c15 reta=r reta=s paralelas=r;s transversal=t angulo=2x+30;3 angulo=3x+10;6'],
  ['MAT06-09', 'exercicio 17',
   '@fig retas id=c17 reta=r reta=s paralelas=r;s transversal=t angulo=143;2 incognita=x;1 incognita=y;5 incognita=z;6'],

  /* ---------------------------------------------------- MAT04-07, retas, angulos e giros */
  ['MAT04-07', 'explicacao, painel de retas: paralelas',
   '@fig retas id=q1 reta=r reta=s paralelas=r;s nomeiaretas=sim'],
  ['MAT04-07', 'explicacao, painel de retas: concorrentes',
   '@fig retas id=q2 reta=r reta=s nomeiaretas=sim angulo=55;1'],
  ['MAT04-07', 'explicacao, painel de retas: perpendiculares',
   '@fig retas id=q3 reta=r reta=s reto=sim nomeiaretas=sim'],
  ['MAT04-07', 'exercicio 3',
   '@fig retas id=q4 reta=r reta=s reto=sim nomeiaretas=sim'],

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
   'MAT09-08. Sao triangulo e quadrilatero']
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
