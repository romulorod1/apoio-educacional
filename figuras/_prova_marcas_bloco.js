/* figuras/_prova_marcas_bloco.js
 *
 * Banco de medida da regra do BLOCO: um valor de angulo nao pode estar mais
 * perto do rotulo de outra coisa do que do arco que ele mede, porque o olho
 * agrupa por proximidade antes de agrupar por significado.
 *
 * O caso que deu origem e o exercicio 17 do piloto, e ele vem do banco.json pelo
 * caminho de verdade: as bissetrizes de B e de C se encontram em I, o incentro
 * mora na bissetriz de A por definicao, e a bissetriz de A e exatamente a reta em
 * que o marcaAngulo pousa o valor do angulo A. Os dois rotulos nao colidiram por
 * arranjo, colidiram por teorema.
 *
 * Mede duas vezes o mesmo par de numeros, e as duas contas divergem de proposito:
 *
 *   no FLUXO   (registro.medido), que e de onde a trava do base.js le, com a
 *              caixa de texto que ela usa: altura de 0,717 do corpo;
 *   na CAIXA   (registro.rotulos), que e o halo branco que a folha imprime, com
 *              altura de 1,08 do corpo.
 *
 * No defeito original o fluxo dava 7,77 pt de vao e o halo dava 4,93 pt. Quem
 * produz tem que mirar na medida das CAIXAS, que e a folga menor.
 *
 * As duas contas que as travas cobram, e elas puxam em sentidos opostos:
 *
 *   vao entre as caixas de dois rotulos      piso: o corpo do rotulo, 8,5 pt
 *   distancia do valor ao arco que ele mede  teto: 12 pt mais meia largura
 *
 * Sai com codigo 1 quando algum valor reprova em qualquer uma das duas.
 *
 * Regra da casa: nunca usar travessao.
 */
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');

const RAIZ = path.join(__dirname, '..');
const banco = JSON.parse(fs.readFileSync(path.join(RAIZ, 'temas', 'banco.json'), 'utf8'));
const tema = banco.temas.find(function (t) { return t.id === 'MAT07-12'; });

function n2(v) { return isFinite(v) ? (Math.round(v * 100) / 100).toFixed(2) : 'inf'; }

/* Vao de papel branco entre dois retangulos, zero quando eles se tocam. A
 * distancia entre CENTROS nao serve, e a diferenca esta medida no proprio
 * exercicio 17: centro a centro 14,1 pt e vao 7,8 pt. Uma trava que olhasse o
 * centro nao acusaria o defeito. */
function vao(a, b) {
  var gx = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.l, b.x + b.l));
  var gy = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.a, b.y + b.a));
  return Math.sqrt(gx * gx + gy * gy);
}

function distAoArco(arco, p) {
  var menor = Infinity;
  for (var i = 0; i < arco.pontos.length; i++) {
    var q = arco.pontos[i];
    var d = Math.sqrt((p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y));
    if (d < menor) menor = d;
  }
  return menor;
}

/* O que conta como valor de angulo: o que traz o simbolo de grau e a incognita x
 * sozinha, que e a convencao deste material. Letra solta que nao e x e nome de
 * segmento (a, b, c, h, m) e nunca aparece com arco. */
function ehValor(s) { return /°/.test(String(s)) || String(s).trim() === 'x'; }

/* Um doc por caso, com a figura desenhada sozinha na folha: o que se mede aqui e
 * a figura, e nao o empilhamento da pagina. */
function desenhar(diretiva) {
  const doc = new PDFGen.Doc();
  doc.novaPagina();
  doc.registrarFiguras(diretiva);
  const partes = doc.partesDeFigura(diretiva);
  partes.forEach(function (p) {
    if (p.tipo === 'figura') {
      doc.figura(p.diretiva, { x: PDFGen.MARG_E + 20, largura: PDFGen.MARG_D - PDFGen.MARG_E - 20 });
    }
  });
  return { doc: doc, reg: (doc.figurasDesenhadas || [])[0] };
}

/* O exercicio 17 vem do banco e nao escrito a mao aqui: uma copia da diretiva
 * envelhece separada do tema e o caso deixaria de ser o caso. */
function diretivaDoBanco(n) {
  const doc = new PDFGen.Doc();
  const ex = tema.pt.exercicios.filter(function (e) { return e.n === n; })[0];
  let achada = null;
  doc.partesDeFigura(ex.enunciado).forEach(function (p) { if (p.tipo === 'figura') achada = p.bruto || null; });
  /* O partesDeFigura devolve a diretiva ja lida; para redesenhar basta o texto do
   * enunciado, que e o que o doc.figura consome. */
  return achada || ex.enunciado;
}

var casos = [
  ['exercicio 17 do piloto, o "70°" contra o "I" do encontro', diretivaDoBanco(17)],
  /* Sem id= nas diretivas escritas aqui: as nove figuras dividem uma folha so, e
   * dois id iguais na mesma folha acendem o aviso de id repetido, que e ruido
   * nesta medicao e nao defeito da figura. */
  ['externo de 130 com incognita, o "55°" contra o "x"',
    '@fig triangulo angulo=55 externo=C;130 incognita=B'],
  ['isosceles com duas incognitas respondidas, os dois "x = 70°" na mesma base',
    '@fig triangulo angulo=40 incognita=B incognita=C congruentes=b;c fase=gabarito'],
  ['uma incognita respondida', '@fig triangulo angulo=52 angulo=61 incognita=C fase=gabarito'],
  ['angulo externo do exercicio 8', '@fig triangulo angulo=45 externo=C;125 incognita=B'],
  ['paralelogramo do gabarito do exercicio 10',
    '@fig quadrilatero tipo=paralelogramo angulo=65 fase=gabarito'],
  ['losango do gabarito do exercicio 18',
    '@fig quadrilatero tipo=losango angulo=60 angulo=120 fase=gabarito'],
  ['triangulo em escala da explicacao', '@fig triangulo angulo=52 angulo=61 angulo=67'],
  ['externo de 115 da explicacao', '@fig triangulo angulo=40 angulo=75 angulo=65 externo=C;115']
];

var reprovas = 0;

/* Uma folha com todos os casos, uma pagina por caso, para a conferencia que
 * nenhuma conta faz: OLHAR a figura e ver se o valor nao foi parar em cima de um
 * traco nem para fora do desenho. A ordem das paginas e a ordem dos casos. */
const folha = new PDFGen.Doc();

casos.forEach(function (caso, iCaso) {
  const r = desenhar(caso[1]);
  const reg = r.reg;
  folha.novaPagina();
  folha.partesDeFigura(caso[1]).forEach(function (p) {
    if (p.tipo === 'figura') {
      folha.figura(p.diretiva, { x: PDFGen.MARG_E + 20, largura: PDFGen.MARG_D - PDFGen.MARG_E - 20 });
    }
  });
  console.log('\n=== [pagina ' + (iCaso + 1) + '] ' + caso[0] + ' ===');
  if (!reg) { console.log('  a figura nao saiu'); reprovas++; return; }
  const med = reg.medido || { textos: [], arcos: [] };

  /* No fluxo: a caixa da trava do base.js, altura de 0,717 do corpo. */
  med.textos.forEach(function (t) {
    if (!ehValor(t.txt)) return;
    var ancora = { x: t.cx != null ? t.cx : t.x, y: t.cy != null ? t.cy : t.y };
    var perto = Infinity, qual = null;
    med.arcos.forEach(function (a) {
      var d = distAoArco(a, ancora);
      if (d < perto) { perto = d; qual = a; }
    });
    var dOutro = Infinity, viz = null;
    med.textos.forEach(function (o) {
      if (o === t) return;
      var d = vao({ x: t.x, y: t.y, l: t.largura || 0, a: (t.tam || 8.5) * 0.717 },
        { x: o.x, y: o.y, l: o.largura || 0, a: (o.tam || 8.5) * 0.717 });
      if (d < dOutro) { dOutro = d; viz = o; }
    });
    var alcance = 12 + (t.largura || 0) / 2;
    var bloco = viz && dOutro < (t.tam || 8.5) && dOutro < perto;
    var solto = !qual || perto > alcance;
    if (bloco || solto) reprovas++;
    console.log('  "' + t.txt + '": vao ate "' + (viz ? viz.txt : 'nenhum') + '" = ' + n2(dOutro) +
      ' (piso ' + n2(t.tam) + ')  |  arco de ' + (qual ? n2(qual.abertura) : '?') + ' graus a ' +
      n2(perto) + ' (teto ' + n2(alcance) + ')  |  ' +
      (bloco ? 'BLOCO' : '') + (solto ? ' SOLTO' : '') + (bloco || solto ? '' : 'passa'));
    if (med.arcos.length > 1) {
      console.log('      a cada arco: ' + med.arcos.map(function (a, i) {
        return n2(a.abertura) + ' graus: ' + n2(distAoArco(a, ancora));
      }).join('  |  '));
    }
  });

  /* Na caixa impressa: o halo de verdade, altura de 1,08 do corpo. */
  (reg.rotulos || []).forEach(function (t) {
    if (!ehValor(t.texto)) return;
    var centro = { x: t.x + t.largura / 2, y: t.y + t.altura / 2 };
    var perto = Infinity;
    med.arcos.forEach(function (a) { perto = Math.min(perto, distAoArco(a, centro)); });
    var dOutro = Infinity, viz = null;
    (reg.rotulos || []).forEach(function (o) {
      if (o === t) return;
      var d = vao({ x: t.x, y: t.y, l: t.largura, a: t.altura },
        { x: o.x, y: o.y, l: o.largura, a: o.altura });
      if (d < dOutro) { dOutro = d; viz = o; }
    });
    console.log('    halo "' + t.texto + '": vao ate "' + (viz ? viz.texto : 'nenhum') + '" = ' +
      n2(dOutro) + '  |  arco a ' + n2(perto));
  });

  const av = reg.conferencia || [];
  console.log('  conferencia: ' + (av.length ? av.join(' / ') : 'sem falha'));
  if (av.length) reprovas++;
});

fs.writeFileSync(path.join(__dirname, '_prova_marcas_bloco.pdf'), folha.finalizar());
console.log('\nfolha para olhar: _prova_marcas_bloco.pdf, ' + casos.length + ' paginas');

console.log('\n' + (reprovas ? reprovas + ' reprova(s)' : 'nenhuma reprova'));
process.exit(reprovas ? 1 : 0);
