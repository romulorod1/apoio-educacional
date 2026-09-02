/* figuras/_prova_receitas.js
 * Folha de prova das receitas, uma pagina por caso, feita pelo caminho de
 * verdade: a diretiva @fig e lida pelo partesDeFigura do pdf.js e desenhada pelo
 * doc.figura, do mesmo jeito que o material do tema.
 *
 * A folha e o gate, mas quem diz se a figura MENTE nao e o olho: e o
 * _prova_receitas_auditor.py, que abre este PDF com o MuPDF, recupera os
 * poligonos e os rotulos e mede o angulo interno de cada vertice na folha
 * impressa, sem importar uma linha do projeto. A receita vai do valor para o
 * desenho, o auditor vai do desenho para o valor.
 *
 * A pagina 3 e o CONSERTO DESLIGADO: o mesmo paralelogramo do exercicio 15
 * desenhado como a receita fazia antes, com o prototipo padrao e os rotulos
 * pendurados por cima. Ela existe para o auditor ter o que acusar: um teste que
 * so olha a versao consertada nao prova nada.
 *
 * Regra da casa: nunca usar travessao.
 */
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');
const FigBase = require('./base.js');
const FigReceitas = require('./receitas.js');

const COR = PDFGen.COR;
const MARG_E = PDFGen.MARG_E, MARG_D = PDFGen.MARG_D;
const LARGURA = MARG_D - MARG_E - 40;

const LEGENDA = 'legenda=Figura fora de escala: meca com a conta e nao com o transferidor.';

/* O exercicio 15 deixou de escrever a LEGENDA acima e passou a escrever
 * escala=fiel, e as paginas 1, 2 e 8 seguem o tema. A legenda afirmava que a
 * figura esta fora de escala e a figura sai exata: medido no contorno impresso
 * por produto escalar, 100,004 / 80,001 / 99,999 / 79,996 graus contra a resposta
 * 100 e 80. Enquanto essas paginas continuassem com a legenda, elas seriam a
 * prova de um defeito em vez da prova do conserto, e a trava nova da receita
 * (travaDaEscalaQueMente) acusaria as tres. A legenda continua viva na pagina 3,
 * que e o conserto DESLIGADO: la a figura mente mesmo. */
const FIEL = 'escala=fiel';

/* ================================================================ as paginas */

const CASOS = [
  { titulo: '1. exercicio 15 como o tema escreve, 3x+10 e 2x+20 em vertices consecutivos',
    espera: 'o vertice do 3x+10 mede 100 e o do 2x+20 mede 80 (3x+10 mais 2x+20 igual a 180 da x igual a 30), e sem legenda de escala, porque a figura sai exata',
    fig: '@fig quadrilatero id=p15 tipo=paralelogramo angulo=3x+10 angulo=2x+20 ' + FIEL },

  { titulo: '2. as mesmas duas expressoes na ordem trocada',
    espera: 'cada rotulo continua no vertice dele: 2x+20 em 80 e 3x+10 em 100, agora invertidos de lado',
    fig: '@fig quadrilatero id=p15b tipo=paralelogramo angulo=2x+20 angulo=3x+10 ' + FIEL },

  { titulo: '3. CONSERTO DESLIGADO: o prototipo padrao com os rotulos por cima',
    espera: 'e o que a receita desenhava antes: 3x+10 num vertice de 62 e 2x+20 num de 118, o agudo onde a resposta e obtusa',
    cru: true },

  { titulo: '4. exercicio 10, paralelogramo com 65 graus (nada podia mudar aqui)',
    espera: 'o 65 continua num vertice que mede 65',
    fig: '@fig quadrilatero id=p10 tipo=paralelogramo angulo=65' },

  { titulo: '5. o valor numerico escrito no SEGUNDO vertice',
    espera: 'o 65 vai para o vertice B e a figura e construida com 115 em A: antes a figura era recusada',
    fig: '@fig quadrilatero id=p10b tipo=paralelogramo incognita=A angulo=65' },

  { titulo: '6. trapezio generico',
    espera: 'escaleno: pernas de comprimentos visivelmente diferentes e angulos da base de 52 e 76',
    fig: '@fig quadrilatero id=ptrap tipo=trapezio' },

  { titulo: '7. trapezio isosceles do exercicio 12',
    espera: 'simetrico, com as duas pernas iguais e 72 nos dois angulos da base',
    fig: '@fig quadrilatero id=ptrapi tipo=trapezioisosceles angulo=72 angulo=72' },

  { titulo: '8. triangulo com os tres angulos em expressao, 2x, 3x e 4x',
    espera: 'o sistema fecha em x igual a 20: 40, 60 e 80, cada numero no vertice dele',
    fig: '@fig triangulo id=t2x angulo=2x angulo=3x angulo=4x ' + FIEL },

  { titulo: '9. exercicio 9, isosceles com 40 no apice (nada podia mudar aqui)',
    espera: '40 no apice, 70 nos dois da base, e a base continua na horizontal',
    fig: '@fig triangulo id=t9 angulo=40 incognita=B incognita=C congruentes=b;c' },

  { titulo: '10. quadrilatero irregular com os quatro angulos escritos fora da volta',
    espera: 'a receita escolhe a volta do prototipo em que a ordem bate, em vez de recusar',
    fig: null }   // montado abaixo, a partir do proprio prototipo
];

/* O caso 10 se escreve a partir da forma do prototipo, para a prova nao decorar
 * numero: os quatro angulos do irregular, escritos comecando pelo terceiro. */
(function montarCaso10() {
  const P = FigReceitas.PROTOTIPOS.quadrilatero();
  const geo = FigBase.geo;
  const angs = [];
  for (let i = 0; i < 4; i++) {
    angs.push(geo.anguloEm(P[i], P[(i + 1) % 4], P[(i + 3) % 4]));
  }
  const fora = [angs[2], angs[3], angs[0], angs[1]].map(function (a) {
    return (Math.round(a * 100) / 100);
  });
  CASOS[9].fig = '@fig quadrilatero id=pirr tipo=quadrilatero ' +
    fora.map(function (a) { return 'angulo=' + a; }).join(' ');
  CASOS[9].espera = 'os quatro angulos escritos na ordem ' + fora.join(', ') +
    ' saem cada um no seu vertice, com a volta girada';
})();

/* ================================================================ a folha */

const doc = new PDFGen.Doc();

function cabecalho(caso) {
  doc.novaPagina();
  doc.y -= 6;
  doc.texto(caso.titulo, MARG_E, doc.y, { tam: 11, bold: true, cor: COR.navy });
  doc.y -= 14;
  doc.texto('o que tem que sair: ' + caso.espera, MARG_E, doc.y, { tam: 9, cor: COR.muted });
  doc.y -= 20;
}

/* O paralelogramo do conserto desligado, desenhado a mao com o prototipo padrao
 * e os dois rotulos por cima, que e exatamente o que saia antes: o primeiro
 * numero da diretiva escolhia a forma, e como nao havia numero nenhum, ficava o
 * padrao de 62 graus. */
function paralelogramoCru(x, largura) {
  const P = FigReceitas.PROTOTIPOS.paralelogramo(null);
  const geo = FigBase.geo;
  return FigBase.figura(doc, {
    x: x, largura: largura, altura: 150, unidades: geo.caixa(P),
    legenda: 'Figura fora de escala: meca com a conta e nao com o transferidor.',
    foraDeEscala: true, fase: 'enunciado', id: 'p15cru', receita: 'quadrilatero'
  }, function (ctx) {
    const Q = ctx.pontos(P);
    ctx.contorno(function () {
      for (let i = 0; i < 4; i++) {
        const A = Q[i], B = Q[(i + 1) % 4];
        ctx.doc.linha(A.x, A.y, B.x, B.y, COR.texto, 1.2);
        ctx.anota('traco', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, espessura: 1.2, papel: 'contorno' });
      }
    });
    ctx.rotulos(function () {
      const c = FigBase.geo.centroide(Q);
      [['3x+10', 0], ['2x+20', 1]].forEach(function (par) {
        const V = Q[par[1]];
        const dx = c.x - V.x, dy = c.y - V.y, n = Math.sqrt(dx * dx + dy * dy) || 1;
        ctx.doc.texto(par[0], V.x + dx / n * 26, V.y + dy / n * 26, { tam: 8.5, align: 'centro' });
      });
    });
  });
}

CASOS.forEach(function (caso) {
  cabecalho(caso);
  if (caso.cru) { paralelogramoCru(MARG_E + 20, LARGURA); return; }
  const partes = doc.partesDeFigura(caso.fig);
  partes.forEach(function (p) {
    if (p.tipo === 'figura') doc.figura(p.diretiva, { x: MARG_E + 20, largura: LARGURA });
  });
});

fs.writeFileSync(path.join(__dirname, '_prova_receitas.pdf'), doc.finalizar());
console.log('_prova_receitas.pdf: ' + CASOS.length + ' paginas');

/* ================================================================ conferencias
 *
 * O que se confere aqui e o que nao aparece na folha: figura recusada, aviso
 * escrito e a trava do clone. O angulo desenhado quem confere e o auditor, no
 * PDF pronto. */

let ok = 0, mau = 0;
function conf(rotulo, obtido, esperado) {
  const bom = String(obtido) === String(esperado);
  if (bom) ok++; else mau++;
  console.log((bom ? '  OK    ' : '  FALHA ') + rotulo +
    (bom ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}

function desenhar(texto) {
  const d = new PDFGen.Doc();
  d.novaPagina();
  d.partesDeFigura(texto).forEach(function (p) {
    if (p.tipo === 'figura') d.figura(p.diretiva, { x: MARG_E + 20, largura: LARGURA });
  });
  return d;
}

function comAviso(texto, pedaco) {
  const d = desenhar(texto);
  return (d.avisosFigura || []).filter(function (a) { return a.indexOf(pedaco) >= 0; }).length;
}

console.log('\nfiguras que tem que ser RECUSADAS');
/* Sistema sobredeterminado e contraditorio, e todo ele em EXPRESSAO: 2x, 2x e 3x
 * em tres vertices de um paralelogramo pedem dois valores diferentes do mesmo
 * vertice. O conferirRotulos nao ve nada aqui, porque nenhum rotulo e numero, e
 * antes a figura saia calada com o prototipo padrao. */
conf('sistema contraditorio escrito so em expressao e recusado',
  comAviso('@fig quadrilatero tipo=paralelogramo angulo=2x angulo=2x angulo=3x ' + LEGENDA,
    'saiu desenhado com') >= 1, true);
/* 100 graus na base de um trapezio isosceles pede a base menor embaixo, que o
 * prototipo nao desenha: antes saia 68 com 100 escrito ao lado. */
conf('angulo fora do intervalo desenhavel do tipo e recusado',
  comAviso('@fig quadrilatero tipo=trapezioisosceles angulo=100 angulo=100', 'so se desenha entre') >= 1, true);

const geo = FigBase.geo;
const Pirr = FigReceitas.PROTOTIPOS.quadrilatero();
const angsIrr = [0, 1, 2, 3].map(function (i) {
  return Math.round(geo.anguloEm(Pirr[i], Pirr[(i + 1) % 4], Pirr[(i + 3) % 4]) * 100) / 100;
});
/* A ordem ao contrario nao se resolve girando a volta (a volta so gira, nao
 * espelha), entao a figura sai recusada em vez de sair invertida. */
const aoContrario = angsIrr.slice().reverse();
conf('ordem que nenhuma volta do prototipo atende e recusada',
  comAviso('@fig quadrilatero tipo=quadrilatero ' +
    aoContrario.map(function (a) { return 'angulo=' + a; }).join(' '), 'ordem invertida') >= 1, true);

console.log('\na escala que mente');
/* "Figura fora de escala" e afirmacao sobre o proprio desenho. No exercicio 15 ela
 * era falsa: os quatro angulos do contorno impresso mediam 100,004 / 80,001 /
 * 99,999 / 79,996 graus, contra a resposta 100 e 80. A frase sobrou de quando a
 * figura saia com 62 e 118, e a rodada passada consertou o desenho sem tirar a
 * desculpa. Agora a receita acusa em vez de deixar a folha afirmar o contrario do
 * que ela desenha. */
conf('figura exata marcada fora de escala pela letra e acusada',
  comAviso('@fig quadrilatero tipo=paralelogramo angulo=3x+10 angulo=2x+20 ' + LEGENDA,
    'marcada fora de escala so porque a diretiva traz letra') >= 1, true);
conf('e a mesma figura com escala=fiel escrita no tema passa calada',
  comAviso('@fig quadrilatero tipo=paralelogramo angulo=3x+10 angulo=2x+20 escala=fiel',
    'marcada fora de escala') , 0);
/* Onde a letra NAO determina a figura, a marca automatica continua sendo verdade
 * e nao ha o que avisar: aqui o prototipo e chute e o desenho e mesmo generico. */
conf('e a figura que a letra nao determina continua fora de escala, sem aviso',
  comAviso('@fig quadrilatero tipo=quadrilatero angulo=2x ' + LEGENDA,
    'marcada fora de escala'), 0);
{
  /* Medido na propria folha: com escala=fiel o desenho continua exato. */
  const dFiel = desenhar('@fig quadrilatero id=pfiel tipo=paralelogramo angulo=3x+10 angulo=2x+20 escala=fiel');
  const reg = (dFiel.figurasDesenhadas || [])[0] || {};
  const P = FigReceitas.PROTOTIPOS.paralelogramo(100);
  const medidos = [0, 1, 2, 3].map(function (i) {
    return Math.round(geo.anguloEm(P[i], P[(i + 1) % 4], P[(i + 3) % 4]) * 1000) / 1000;
  });
  conf('o paralelogramo do 15 sai com 100 e 80 de verdade',
    medidos.slice(0, 2).every(function (a, i) { return Math.abs(a - [100, 80][i]) < 0.01; }), true);
  conf('e a figura nao carrega mais a marca de fora de escala', reg.foraDeEscala, false);
}

console.log('\nglosa de regiao, que nao e medida de angulo');
/* O quadrilatero cortado pela diagonal escrevia "180°" no centro de cada metade,
 * e um numero com simbolo de grau solto dentro de uma area se le como medida de
 * UM angulo: a figura afirmava que existem ali dois angulos rasos, o contrario
 * exato do argumento que ela ilustra. O 180 e a soma dos angulos de cada
 * sub-triangulo, e quem escreve a unidade e o paragrafo ao lado. */
{
  const dReg = desenhar('@fig quadrilatero tipo=quadrilatero diagonal=A;C regioes=180;180');
  const reg = (dReg.figurasDesenhadas || [])[0] || { medido: { textos: [] }, conferencia: [] };
  const comCento = ((reg.medido || {}).textos || []).map(function (t) { return t.txt; })
    .filter(function (t) { return t.indexOf('180') >= 0; });
  conf('a glosa de regiao sai sem o simbolo de grau', comCento.join(' '), '180 180');
  conf('e a figura da diagonal nao tem valor de angulo solto',
    (reg.conferencia || []).filter(function (f) { return f.indexOf('saiu solto') >= 0; }).length, 0);
}
/* Grau escrito na propria diretiva nao passa calado: quem escreveu o tema
 * precisa saber que ali o valor nao e medida de angulo. */
conf('regioes com grau escrito no tema e acusado',
  comAviso('@fig quadrilatero tipo=quadrilatero diagonal=A;C regioes=180°;180°',
    'nao e medida de angulo') >= 1, true);
/* Numero pelado tambem nao passa calado, e este e o defeito que duas leitoras
 * independentes acharam depois de o grau sair: "viro a folha e caio numa figura
 * pelada com dois numeros soltos, nao sei se e area, se e lado, se e o que". */
conf('regioes so com numero, sem palavra, e acusado',
  comAviso('@fig quadrilatero tipo=quadrilatero diagonal=A;C regioes=180;180',
    'numero solto dentro de uma regiao') >= 1, true);
{
  /* A forma que o tema passou a escrever: uma ocorrencia por regiao, com a
   * palavra vinda do tema nas duas linguas. */
  const dPal = desenhar('@fig quadrilatero tipo=quadrilatero diagonal=A;C regioes=soma;180 regioes=soma;180');
  const reg = (dPal.figurasDesenhadas || [])[0] || { medido: { textos: [] }, conferencia: [] };
  const glosas = ((reg.medido || {}).textos || []).map(function (t) { return t.txt; })
    .filter(function (t) { return t.indexOf('180') >= 0; });
  conf('a glosa de regiao sai com a palavra do tema junto do valor', glosas.join(' | '), 'soma 180 | soma 180');
  conf('e sem o simbolo de grau, que a trava do valor solto cobraria com arco',
    glosas.join(' ').indexOf('°') < 0, true);
  conf('e a figura da diagonal continua sem valor de angulo solto',
    (reg.conferencia || []).filter(function (f) { return f.indexOf('saiu solto') >= 0; }).length, 0);
  conf('e sem aviso de numero pelado',
    (dPal.avisosFigura || []).filter(function (a) { return a.indexOf('numero solto') >= 0; }).length, 0);
  const dEn = desenhar('@fig quadrilatero tipo=quadrilatero diagonal=A;C regioes=sum;180 regioes=sum;180');
  const regEn = (dEn.figurasDesenhadas || [])[0] || { medido: { textos: [] } };
  conf('e a mesma figura em ingles traz a palavra em ingles',
    ((regEn.medido || {}).textos || []).map(function (t) { return t.txt; })
      .filter(function (t) { return t.indexOf('180') >= 0; }).join(' | '), 'sum 180 | sum 180');
}

console.log('\ncodigo de cor do gabarito: teal e o que a resposta ACRESCENTA');
/* Uma cor, um sentido. Antes o mesmo teal queria dizer RESPOSTA no exercicio 10 e
 * nada no 18, e o preto queria dizer DADO no 10 e RESPOSTA no 11. */
const TEAL = COR.teal, PRETO = COR.texto;
function corDoTexto(reg, txt) {
  const t = ((reg.medido || {}).textos || []).filter(function (x) { return x.txt === txt; });
  if (!t.length) return '(nao saiu)';
  const c = t[0].cor;
  const perto = function (a) { return Math.abs(c[0] - a[0]) + Math.abs(c[1] - a[1]) + Math.abs(c[2] - a[2]) < 0.01; };
  return perto(TEAL) ? 'teal' : (perto(PRETO) ? 'preto' : c.map(function (v) { return v.toFixed(3); }).join('/'));
}
function coresDosTextos(reg) {
  return ((reg.medido || {}).textos || []).map(function (t) { return t.txt + '=' + corDoTexto(reg, t.txt); }).join(' ');
}
{
  /* Exercicio 10: a figura do enunciado rechamada pelo id. O 65 ja estava
   * impresso na folha da aluna e continua preto; os outros tres sao a resposta. */
  const d10 = new PDFGen.Doc();
  d10.novaPagina();
  d10.registrarFiguras('@fig quadrilatero id=z10 tipo=paralelogramo angulo=65');
  d10.partesDeFigura('@fig id=z10 fase=gabarito').forEach(function (p) {
    if (p.tipo === 'figura') d10.figura(p.diretiva, { x: MARG_E + 20, largura: LARGURA });
  });
  const reg = (d10.figurasDesenhadas || [])[0] || { medido: { textos: [] } };
  conf('o dado do enunciado continua preto no gabarito rechamado pelo id', corDoTexto(reg, '65°'), 'preto');
  conf('e os valores que a resposta acrescenta saem em teal', corDoTexto(reg, '115°'), 'teal');
}
{
  /* Exercicio 11: figura que NASCE no gabarito, sem par no enunciado. Os tres
   * valores sao a resposta, e antes 30 e 60 saiam pretos. */
  const d11 = desenhar('@fig triangulo id=z11 angulo=30 angulo=60 angulo=90 fase=gabarito');
  const reg = (d11.figurasDesenhadas || [])[0] || { medido: { textos: [], segmentos: [] } };
  conf('figura nascida no gabarito pinta tambem o valor declarado: 30',
    corDoTexto(reg, '30°'), 'teal');
  conf('e o 60', corDoTexto(reg, '60°'), 'teal');
  /* O 90 nao sai como texto: ele e o quadradinho, que ocupa o lugar do valor e
   * por isso carrega o mesmo codigo de cor. */
  const quad = ((reg.medido || {}).segmentos || []).filter(function (s) {
    return Math.abs(s.cor[0] - TEAL[0]) + Math.abs(s.cor[1] - TEAL[1]) + Math.abs(s.cor[2] - TEAL[2]) < 0.01;
  });
  conf('e o quadradinho do angulo reto sai em teal junto', quad.length >= 2, true);
  console.log('       cores medidas: ' + coresDosTextos(reg));
}
{
  /* Exercicio 18: losango de 60 e 120 declarado direto no gabarito. Antes saiam
   * dois angulos em teal e dois em preto, sem significado nenhum. */
  const d18 = desenhar('@fig quadrilatero id=z18 tipo=losango angulo=60 angulo=120 fase=gabarito');
  const reg = (d18.figurasDesenhadas || [])[0] || { medido: { textos: [] } };
  const cores = ((reg.medido || {}).textos || []).map(function (t) { return corDoTexto(reg, t.txt); });
  conf('os quatro valores do losango do gabarito saem na mesma cor',
    cores.length === 4 && cores.every(function (c) { return c === 'teal'; }), true);
  console.log('       cores medidas: ' + coresDosTextos(reg));
}
{
  /* E a folha de ENUNCIADO nao pode ter nenhum valor em teal, senao a cor volta a
   * ter dois sentidos na mesma folha. */
  const dEn = desenhar('@fig quadrilatero id=z18e tipo=losango angulo=60 angulo=120');
  const reg = (dEn.figurasDesenhadas || [])[0] || { medido: { textos: [] } };
  conf('no enunciado nenhum valor sai em teal',
    ((reg.medido || {}).textos || []).filter(function (t) { return corDoTexto(reg, t.txt) === 'teal'; }).length, 0);
}
{
  /* A ceviana pedia teal tracejado dentro de uma figura de enunciado, que e o
   * codigo da camada de resposta. Ela pede a tinta do contorno agora. */
  const dCev = desenhar('@fig triangulo angulo=70 vertices=A;B;C ceviana=bissetriz;B ceviana=bissetriz;C encontro=I');
  const reg = (dCev.figurasDesenhadas || [])[0] || { medido: { segmentos: [] } };
  const emTeal = ((reg.medido || {}).segmentos || []).filter(function (s) {
    return Math.abs(s.cor[0] - TEAL[0]) + Math.abs(s.cor[1] - TEAL[1]) + Math.abs(s.cor[2] - TEAL[2]) < 0.01;
  });
  conf('nenhum traco em teal na figura das bissetrizes do enunciado', emTeal.length, 0);
}

console.log('\nas duas linhas mais fracas da figura do 4, 7 e 12');
/* Elas amarravam o vao de 1 unidade, que E a resposta da questao, a base de 12, e
 * saiam a 0,60 pt em #6B7280 com padrao [1 2], 60,00 pt de comprimento cada. Um
 * [1 2] deposita um terco da tinta pelo mesmo caminho e some na segunda geracao
 * de fotocopia. */
{
  const dVao = desenhar('@fig triangulo lado=4 lado=7 lado=12');
  const reg = (dVao.figurasDesenhadas || [])[0] || { medido: { segmentos: [] } };
  const segs = (reg.medido || {}).segmentos || [];
  conf('nenhuma guia no padrao [1 2]',
    segs.filter(function (s) { return /\[1 2\]/.test(String(s.tracejado)); }).length, 0);
  conf('e nenhum traco em COR.muted',
    segs.filter(function (s) { return Math.abs(s.cor[0] - COR.muted[0]) < 0.01 && Math.abs(s.cor[1] - COR.muted[1]) < 0.01; }).length, 0);
  /* A amarracao continua existindo: uma vertical de ponta a ponta entre a regua de
   * cima e a de baixo, agora como linha de chamada da propria cota. */
  const compridas = segs.filter(function (s) {
    return Math.abs(s.x1 - s.x2) < 0.5 && Math.abs(s.y1 - s.y2) > 40;
  });
  conf('e a amarracao entre as duas reguas continua na folha', compridas.length >= 2, true);
  conf('continua e na tinta do contorno',
    compridas.every(function (s) {
      return String(s.tracejado) === '[] 0' && Math.abs(s.cor[0] - COR.texto[0]) < 0.01;
    }), true);
  conf('e no peso de chamada, abaixo da linha de cota',
    compridas.every(function (s) { return s.w <= 0.6 + 1e-9; }), true);
  console.log('       verticais medidas: ' + compridas.map(function (s) {
    return 'w=' + s.w + ' altura=' + (Math.abs(s.y1 - s.y2)).toFixed(2) + ' d=' + s.tracejado;
  }).join(' | '));
}
{
  /* O degenerado exato nao tem cota (o vao e zero) e a vertical continua sendo
   * desenhada aqui, com a mesma tinta e o mesmo peso. */
  const dEx = desenhar('@fig triangulo lado=16 lado=8 lado=8 legenda=Os dois lados iguais cobrem a base exatamente.');
  const reg = (dEx.figurasDesenhadas || [])[0] || { medido: { segmentos: [] } };
  const segs = (reg.medido || {}).segmentos || [];
  conf('no degenerado exato tambem nao ha guia [1 2]',
    segs.filter(function (s) { return /\[1 2\]/.test(String(s.tracejado)); }).length, 0);
  const vert = segs.filter(function (s) { return Math.abs(s.x1 - s.x2) < 0.5 && Math.abs(s.y1 - s.y2) > 40; });
  conf('e a vertical que mostra o encontro exato continua la', vert.length, 1);
  conf('continua e na tinta do contorno',
    vert.length === 1 && String(vert[0].tracejado) === '[] 0' &&
    Math.abs(vert[0].cor[0] - COR.texto[0]) < 0.01, true);
}

console.log('\ncamada de resposta do gabarito, com arco como a de enunciado');
/* Vertice que o enunciado deixou em branco. Antes a resposta saia escrita solta
 * na bissetriz: no gabarito do exercicio 10 os tres numeros ficaram a 154,53,
 * 208,69 e 79,24 pt do unico arco da figura. */
{
  const dGab = desenhar('@fig quadrilatero tipo=paralelogramo angulo=65 fase=gabarito');
  const reg = (dGab.figurasDesenhadas || [])[0] || { medido: { arcos: [] }, conferencia: [] };
  conf('os tres vertices em branco ganham arco', ((reg.medido || {}).arcos || []).length, 4);
  conf('e nenhum valor do gabarito fica solto',
    (reg.conferencia || []).filter(function (f) { return f.indexOf('saiu solto') >= 0; }).length, 0);
  conf('sem estourar o teto de cinco marcas ativas', reg.marcasAtivas <= 5, true);
}
/* Incognita. O valor achado entra no rotulo do PROPRIO arco, e nao como um
 * segundo numero empurrado para fora na mesma direcao: empurrado, ele saia a
 * 22,34 e 27,90 pt do arco que responde, e no triangulo girado chegou mais perto
 * do arco do vizinho (12,13 pt do arco de 104) do que do seu. */
{
  const dInc = desenhar('@fig triangulo angulo=52 angulo=61 incognita=C fase=gabarito');
  const reg = (dInc.figurasDesenhadas || [])[0] || { medido: { textos: [] }, conferencia: [] };
  const textos = ((reg.medido || {}).textos || []).map(function (t) { return t.txt; }).join(' | ');
  conf('a resposta da incognita sai colada ao x', /x = 67°/.test(textos), true);
  conf('e sem valor de angulo solto',
    (reg.conferencia || []).filter(function (f) { return f.indexOf('saiu solto') >= 0; }).length, 0);
}
/* Duas incognitas no mesmo triangulo: antes o gabarito somava seis itens (40, x,
 * 70, x, 70) e estourava o teto por causa da notacao, e nao do conteudo. */
{
  const dDuas = desenhar('@fig triangulo angulo=40 incognita=B incognita=C congruentes=b;c fase=gabarito');
  const reg = (dDuas.figurasDesenhadas || [])[0] || { conferencia: [] };
  conf('duas incognitas respondidas cabem no teto de cinco', reg.marcasAtivas <= 5, true);
  conf('e sem nenhuma falha de conferencia', (reg.conferencia || []).length, 0);
}

console.log('\ncruzamento nomeado de duas construcoes');
/* Quatro angulos nascem no ponto onde duas cevianas se cruzam, e batizar o ponto
 * so tem um motivo, que e perguntar por um deles. Sem arco a figura marcava o
 * dado (o 70 do vertice A) e deixava a incognita sem marca. */
{
  const dEnc = desenhar('@fig triangulo angulo=70 vertices=A;B;C ' +
    'ceviana=bissetriz;B ceviana=bissetriz;C encontro=I');
  const reg = (dEnc.figurasDesenhadas || [])[0] || { conferencia: [] };
  conf('o ponto do encontro ganha o arco do angulo BIC',
    (reg.conferencia || []).filter(function (f) { return f.indexOf('cruzamento nomeado') >= 0; }).length, 0);
  conf('e o arco nao vira item novo, o teto continua em cinco', reg.marcasAtivas <= 5, true);
}

console.log('\ntrava do clone, ligada e desligada');
/* Ligada: a figura da explicacao (sem id) e a do exercicio (com id) constroem o
 * mesmo triangulo, e o exemplo resolvido ja traz o 75 impresso. */
const docClone = new PDFGen.Doc();
docClone.novaPagina();
['@fig triangulo angulo=40 angulo=75 angulo=65 externo=C;115',
 '@fig triangulo id=t8 angulo=40 externo=C;115 incognita=B'].forEach(function (t) {
  docClone.partesDeFigura(t).forEach(function (p) {
    if (p.tipo === 'figura') docClone.figura(p.diretiva, { x: MARG_E + 20, largura: LARGURA });
  });
});
conf('acusa quando o exercicio repete a forma da explicacao',
  (docClone.avisosFigura || []).filter(function (a) { return a.indexOf('repete a forma') >= 0; }).length, 1);

/* Desligada: o mesmo par com os valores que o leitor sugeriu para o exercicio,
 * externo 130 e interno nao adjacente 55. */
const docLimpo = new PDFGen.Doc();
docLimpo.novaPagina();
['@fig triangulo angulo=40 angulo=75 angulo=65 externo=C;115',
 '@fig triangulo id=t8 angulo=55 externo=C;130 incognita=B'].forEach(function (t) {
  docLimpo.partesDeFigura(t).forEach(function (p) {
    if (p.tipo === 'figura') docLimpo.figura(p.diretiva, { x: MARG_E + 20, largura: LARGURA });
  });
});
conf('fica quieta quando os valores do exercicio sao outros',
  (docLimpo.avisosFigura || []).filter(function (a) { return a.indexOf('repete a forma') >= 0; }).length, 0);
conf('e a figura do exercicio com os outros valores sai mesmo assim',
  (docLimpo.figurasDesenhadas || []).length, 2);

/* Duas figuras iguais DENTRO da explicacao nao acusam: ali a repeticao nao
 * entrega resposta nenhuma, e acusar isso seria ruido. */
const docDupla = new PDFGen.Doc();
docDupla.novaPagina();
['@fig triangulo angulo=40 angulo=75 angulo=65 externo=C;115',
 '@fig triangulo angulo=40 angulo=75 angulo=65 externo=C;115'].forEach(function (t) {
  docDupla.partesDeFigura(t).forEach(function (p) {
    if (p.tipo === 'figura') docDupla.figura(p.diretiva, { x: MARG_E + 20, largura: LARGURA });
  });
});
conf('duas figuras iguais dentro da explicacao nao acusam',
  (docDupla.avisosFigura || []).filter(function (a) { return a.indexOf('repete a forma') >= 0; }).length, 0);

/* A conferencia olha o aviso que NASCE na receita (triangulo:, quadrilatero:,
 * painel: e a trava do clone). Aviso de vizinho em obra apareceria aqui como
 * falha desta folha, e esta folha nao tem o que dizer sobre o arquivo do
 * vizinho. */
function avisosDaReceita(d) {
  return (d.avisosFigura || []).filter(function (a) {
    return /^(triangulo|quadrilatero|painel):/.test(a) || a.indexOf('repete a forma') >= 0;
  });
}

console.log('\nnenhuma das 10 paginas pode ter saido com aviso da receita');
conf('a folha de prova sai sem aviso de receita', avisosDaReceita(doc).length, 0);
conf('e com as 10 figuras desenhadas', (doc.figurasDesenhadas || []).length, CASOS.length);

console.log('\n' + ok + ' conferencias passaram, ' + mau + ' falharam.');
avisosDaReceita(doc).forEach(function (a) { console.log('  aviso . ' + a); });
const alheios = (doc.avisosFigura || []).length - avisosDaReceita(doc).length;
if (alheios) console.log('  (' + alheios + ' aviso(s) de outros arquivos, fora do escopo desta folha)');
process.exit(mau ? 1 : 0);
