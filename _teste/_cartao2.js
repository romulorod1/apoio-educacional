/* Segundo protótipo do cartão, respondendo à pergunta do Rômulo:
   e quando o mês tem mais de três temas e mais de uma disciplina?
   A regra é: o cartão mostra o topo por ocorrência e diz quantos ficaram de
   fora. A lista completa fica no PDF do fechamento, que continua saindo. */

var NAVY = '#1F3A5F', TEAL = '#2E7D6B', GOLD = '#C9A961';
var IVORY = '#FBF9F5', MUTED = '#6B7280', FIO = '#DCE2E8';

var DADOS = {
  aluno: 'Cecília',
  mes: 'Outubro de 2026',
  encontros: 9,
  disciplinas: [
    { nome: 'Matemática', temas: ['Semelhança de triângulos', 'Trigonometria no triângulo retângulo'], total: 4 },
    { nome: 'Física', temas: ['Cinemática, movimento uniforme'], total: 2 },
    { nome: 'Inglês', temas: ['Present perfect e past simple'], total: 2 }
  ],
  temasDeFora: 3,
  areas: ['Estratégia de prova', 'Método de estudo', 'Organização dos horários'],
  areasDeFora: 4,
  linha: 'A Cecília passou a chegar com as dúvidas já anotadas, e isso mudou o rendimento das nossas horas.'
};

var c = document.getElementById('cartao');
var x = c.getContext('2d');

function texto(t, px, py, tam, cor, peso, familia) {
  x.fillStyle = cor;
  x.font = (peso || '400') + ' ' + tam + 'px ' + (familia || "'Lora', Georgia, serif");
  x.fillText(t, px, py);
}

function quebrar(t, largura, tam, peso) {
  x.font = (peso || '400') + ' ' + tam + "px 'Lora', Georgia, serif";
  var palavras = t.split(' '), linhas = [], atual = '';
  for (var i = 0; i < palavras.length; i++) {
    var tenta = atual ? atual + ' ' + palavras[i] : palavras[i];
    if (x.measureText(tenta).width > largura && atual) { linhas.push(atual); atual = palavras[i]; }
    else atual = tenta;
  }
  if (atual) linhas.push(atual);
  return linhas;
}

function eyebrow(t, py) {
  x.fillStyle = TEAL;
  x.font = "600 19px 'Poppins', sans-serif";
  var cx = 72;
  for (var i = 0; i < t.length; i++) { x.fillText(t[i], cx, py); cx += x.measureText(t[i]).width + 2.8; }
}

document.fonts.ready.then(function () {
  x.fillStyle = IVORY;
  x.fillRect(0, 0, 1080, 1080);

  x.save();
  x.globalAlpha = 0.045;
  x.strokeStyle = NAVY; x.lineWidth = 4;
  x.beginPath(); x.arc(858, 700, 172, 0, Math.PI * 2); x.stroke();
  x.fillStyle = NAVY;
  x.font = "600 136px 'Lora', Georgia, serif";
  x.textAlign = 'center';
  x.fillText('NW', 858, 750);
  x.restore();
  x.textAlign = 'left';

  texto('Nathália Wajsenzon', 72, 104, 33, NAVY, '600');
  x.fillStyle = TEAL;
  x.font = "500 19px 'Poppins', sans-serif";
  var s1 = 'APOIO EDUCACIONAL', larg = 0, i;
  for (i = 0; i < s1.length; i++) larg += x.measureText(s1[i]).width + 3.2;
  var cx = 1008 - larg;
  for (i = 0; i < s1.length; i++) { x.fillText(s1[i], cx, 100); cx += x.measureText(s1[i]).width + 3.2; }
  x.strokeStyle = NAVY; x.lineWidth = 2.5;
  x.beginPath(); x.moveTo(72, 128); x.lineTo(1008, 128); x.stroke();

  texto(DADOS.aluno, 72, 226, 68, NAVY, '600');
  x.fillStyle = TEAL;
  x.font = "500 23px 'Poppins', sans-serif";
  cx = 72;
  for (i = 0; i < DADOS.mes.length; i++) {
    var ch = DADOS.mes.toUpperCase()[i];
    x.fillText(ch, cx, 268); cx += x.measureText(ch).width + 2.4;
  }

  x.fillStyle = '#FFFFFF';
  x.strokeStyle = FIO; x.lineWidth = 2;
  x.beginPath(); x.roundRect(72, 296, 936, 80, 14); x.fill(); x.stroke();
  x.fillStyle = TEAL;
  x.beginPath(); x.roundRect(72, 296, 6, 80, 3); x.fill();
  texto(String(DADOS.encontros), 106, 350, 44, NAVY, '600');
  texto('encontros no mês, em três disciplinas',
    106 + x.measureText(String(DADOS.encontros)).width + 60, 348, 24, MUTED, '400');

  /* Orcamento de espaco. O cartao tem tamanho fixo, entao o conteudo nao pode
     crescer: ele se ajusta. Monta a lista de linhas, mede, e corta do fim ate
     caber, dizendo quantas ficaram de fora. A lista completa continua saindo no
     PDF do fechamento, que nao tem esse limite. */
  var TOPO_CITACAO = 858;
  var LIMITE = TOPO_CITACAO - 26;

  function montarLinhas(porDisciplina, quantasAreas) {
    var L = [];
    var foraTema = 0;
    DADOS.disciplinas.forEach(function (d) {
      L.push({ tipo: 'disciplina', texto: d.nome, extra: d.total + (d.total === 1 ? ' encontro' : ' encontros'), h: 32 });
      d.temas.forEach(function (t, i) {
        if (i < porDisciplina) L.push({ tipo: 'tema', texto: t, h: 33 });
        else foraTema++;
      });
      L.push({ tipo: 'espaco', h: 6 });
    });
    foraTema += DADOS.temasDeFora;
    if (foraTema) L.push({ tipo: 'resto', texto: 'e mais ' + foraTema + (foraTema === 1 ? ' tema' : ' temas') + ', na lista completa do fechamento', h: 30 });
    L.push({ tipo: 'titulo', texto: 'ALÉM DO CONTEÚDO', h: 46 });
    var foraArea = DADOS.areasDeFora;
    DADOS.areas.forEach(function (a, i) {
      if (i < quantasAreas) L.push({ tipo: 'area', texto: a, h: 32 });
      else foraArea++;
    });
    if (foraArea) L.push({ tipo: 'resto', texto: 'e mais ' + foraArea + (foraArea === 1 ? ' área' : ' áreas'), h: 26 });
    return L;
  }

  function altura(L) { var t = 0; for (var i = 0; i < L.length; i++) t += L[i].h; return t; }

  var inicioConteudo = 440;
  var linhas = null;
  var combinacoes = [[2, 3], [1, 3], [1, 2], [1, 1], [0, 1]];
  for (var ci = 0; ci < combinacoes.length; ci++) {
    linhas = montarLinhas(combinacoes[ci][0], combinacoes[ci][1]);
    if (inicioConteudo + altura(linhas) <= LIMITE) break;
  }

  eyebrow('O QUE TRABALHAMOS', 402);
  var y = inicioConteudo;
  linhas.forEach(function (l) {
    if (l.tipo === 'disciplina') {
      x.fillStyle = NAVY;
      x.font = "600 25px 'Lora', Georgia, serif";
      x.fillText(l.texto, 72, y);
      var w = x.measureText(l.texto).width;
      x.fillStyle = MUTED;
      x.font = "400 19px 'Poppins', sans-serif";
      x.fillText(l.extra, 72 + w + 16, y - 1);
    } else if (l.tipo === 'tema') {
      x.fillStyle = GOLD;
      x.beginPath(); x.arc(92, y - 8, 5, 0, Math.PI * 2); x.fill();
      texto(l.texto, 114, y, 27, '#26313F', '400');
    } else if (l.tipo === 'area') {
      x.fillStyle = TEAL;
      x.beginPath(); x.arc(84, y - 8, 5, 0, Math.PI * 2); x.fill();
      texto(l.texto, 110, y, 26, '#26313F', '400');
    } else if (l.tipo === 'resto') {
      texto(l.texto, 72, y - 4, 21, MUTED, '400');
    } else if (l.tipo === 'titulo') {
      eyebrow(l.texto, y + 10);
    }
    y += l.h;
  });

  // linha dela
  var linhasCitacao = quebrar(DADOS.linha, 828, 27, '400');
  var alturaCitacao = 46 + linhasCitacao.length * 38;
  var topo = TOPO_CITACAO;
  x.fillStyle = '#FFFFFF';
  x.strokeStyle = FIO; x.lineWidth = 2;
  x.beginPath(); x.roundRect(72, topo, 936, alturaCitacao, 14); x.fill(); x.stroke();
  x.fillStyle = GOLD;
  x.beginPath(); x.roundRect(72, topo, 6, alturaCitacao, 3); x.fill();
  var ly = topo + 50;
  linhasCitacao.forEach(function (l) {
    x.fillStyle = NAVY;
    x.font = "400 italic 27px 'Lora', Georgia, serif";
    x.fillText(l, 110, ly);
    ly += 38;
  });

  x.strokeStyle = FIO; x.lineWidth = 2;
  x.beginPath(); x.moveTo(72, 1000); x.lineTo(1008, 1000); x.stroke();
  x.fillStyle = MUTED;
  x.font = "400 20px 'Poppins', sans-serif";
  x.fillText('Nathália Wajsenzon · Apoio Educacional', 72, 1034);

  document.title = 'pronto';
});
