/* testa_cartao.js
 * Aceitação do cartão do mês (cartao.js).
 *
 * Roda sem navegador. O canvas aqui é de mentira: ele guarda tudo o que foi
 * desenhado e mede texto por uma régua fixa. Não é o desenho que está sendo
 * conferido (isso se olha no PNG), é o ARRANJO: o que cabe, o que sai, o que o
 * cartão diz que saiu, e o que nunca pode aparecer numa imagem que se
 * encaminha com um toque.
 *
 * A régua de mentira é de propósito. Com ela o teste é determinístico e não
 * depende de a Lora estar instalada na máquina; e como o cartao.js tira toda
 * largura do measureText no momento de desenhar, um arranjo que fecha nesta
 * régua fecha em qualquer fonte, contanto que a conta de sobra seja feita e
 * não chutada.
 *
 * Regra da casa: nunca usar travessão.
 */
const Cartao = require('../cartao.js');

let passes = 0, falhas = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

// ================================================================ o canvas falso

/* Larguras por caractere, em fração do corpo. Não são as da Lora nem as da
 * Poppins: são uma média grosseira e um pouco GENEROSA de propósito, para o
 * teste apertar mais do que a folha aperta. Se o arranjo cabe aqui, sobra
 * espaço na fonte de verdade. */
const LARG_SERIF = 0.50;
const LARG_SANS = 0.545;

function CtxFalso() {
  this.font = '400 10px serif';
  this.fillStyle = '#000000';
  this.strokeStyle = '#000000';
  this.lineWidth = 1;
  this.globalAlpha = 1;
  this.textAlign = 'left';
  this.textBaseline = 'alphabetic';
  this.ops = [];        // tudo o que foi pedido, na ordem
  this.textos = [];     // só os fillText, com posição, cor e corpo
}
CtxFalso.prototype._corpo = function () {
  const m = /(\d+(?:\.\d+)?)px/.exec(this.font);
  return m ? parseFloat(m[1]) : 10;
};
CtxFalso.prototype._fator = function () {
  return /Poppins|sans-serif|Segoe|Roboto/.test(this.font) ? LARG_SANS : LARG_SERIF;
};
CtxFalso.prototype.measureText = function (t) {
  return { width: String(t == null ? '' : t).length * this._corpo() * this._fator() };
};
CtxFalso.prototype.fillText = function (t, x, y) {
  const s = String(t == null ? '' : t);
  this.textos.push({
    texto: s, x: x, y: y, cor: this.fillStyle, corpo: this._corpo(),
    alpha: this.globalAlpha, largura: this.measureText(s).width
  });
  this.ops.push(['fillText', s, x, y]);
};
CtxFalso.prototype.fillRect = function (x, y, l, a) { this.ops.push(['fillRect', x, y, l, a, this.fillStyle]); };

/* O save e o restore são de VERDADE, e não um registro vazio.
 *
 * Na primeira versão deste arquivo eles só anotavam a chamada, e o globalAlpha
 * de 4,5 por cento que a marca d'água acende ficava aceso no resto do cartão.
 * O efeito foi um teste que passava sem afirmar nada: a conferência de "todo
 * texto legível usa uma das quatro tintas medidas" filtrava por alpha alto,
 * não sobrava texto nenhum na lista e a comparação dava zero contra zero.
 * Alarme que nunca toca é pior do que alarme que falta. */
var ESTADO = ['fillStyle', 'strokeStyle', 'lineWidth', 'globalAlpha', 'font',
  'textAlign', 'textBaseline'];
CtxFalso.prototype.save = function () {
  if (!this._pilha) this._pilha = [];
  const copia = {};
  ESTADO.forEach(k => { copia[k] = this[k]; });
  this._pilha.push(copia);
  this.ops.push(['save']);
};
CtxFalso.prototype.restore = function () {
  const copia = (this._pilha || []).pop();
  if (copia) ESTADO.forEach(k => { this[k] = copia[k]; });
  this.ops.push(['restore']);
};
['beginPath', 'closePath', 'fill', 'stroke'].forEach(function (n) {
  CtxFalso.prototype[n] = function () { this.ops.push([n]); };
});
['moveTo', 'lineTo'].forEach(function (n) {
  CtxFalso.prototype[n] = function (x, y) { this.ops.push([n, x, y]); };
});
CtxFalso.prototype.arc = function (x, y, r) { this.ops.push(['arc', x, y, r, this.fillStyle, this.globalAlpha]); };
CtxFalso.prototype.arcTo = function (x1, y1, x2, y2, r) { this.ops.push(['arcTo', x1, y1, x2, y2, r]); };

function CanvasFalso() { this.width = 0; this.height = 0; this._ctx = new CtxFalso(); }
CanvasFalso.prototype.getContext = function () { return this._ctx; };

function medirFalso(t, tam, peso, familia, italico) {
  const c = new CtxFalso();
  c.font = (italico ? 'italic ' : '') + (peso || '400') + ' ' + tam + 'px ' + (familia || Cartao.SERIF);
  return c.measureText(t).width;
}

function pintar(fechamento, opcoes) {
  const cv = new CanvasFalso();
  const plano = Cartao.desenhar(cv, fechamento, opcoes);
  return { canvas: cv, ctx: cv._ctx, plano: plano, textos: cv._ctx.textos };
}

// ================================================================ fechamentos de mentira

function aula(data, temas, areas, extra) {
  const l = {
    id: 'a' + data, data: data, duracaoMin: 60, futura: false,
    status: 'realizada', cobravel: true, valorHora: 90, valor: 90,
    temas: (temas || []).map(function (t) {
      return typeof t === 'string' ? { id: t, titulo: t } : t;
    }),
    areas: areas || []
  };
  for (const k in (extra || {})) l[k] = extra[k];
  return l;
}

/* O mês simples: um aluno, matemática, três assuntos. É o primeiro protótipo
 * que ela viu. */
function mesSimples() {
  return {
    alunoNome: 'Marcelo', mes: '2026-09', mesExtenso: 'Setembro de 2026',
    qtdEncontros: 12, totalValor: 1234.56, valorFeito: 1234.56,
    minutosDadosSemCobrar: 120, minutosDesmarcados: 60,
    faixas: [{ valorHora: 90, minutos: 720, valor: 1080 }],
    resumoTexto: 'Ele encontrou sozinho três dos quatro erros da própria lista, o que não acontecia em julho. Seguimos com produtos notáveis.',
    linhas: [
      aula('2026-09-01', ['Equações do primeiro grau'], ['base-anterior']),
      aula('2026-09-03', ['Equações do primeiro grau', 'Produtos notáveis'], ['correcao-prova']),
      aula('2026-09-08', ['Produtos notáveis'], ['estrategia-prova']),
      aula('2026-09-10', ['Fatoração de polinômios'], ['correcao-prova'])
    ],
    areasDoMes: [
      { id: 'base-anterior', rotulo: 'Retomada de base de anos anteriores', vezes: 1 },
      { id: 'correcao-prova', rotulo: 'Correção de prova e análise de erros', vezes: 2 },
      { id: 'estrategia-prova', rotulo: 'Estratégia de prova', vezes: 1 }
    ]
  };
}

/* O mês com três matérias: é o segundo protótipo, o do mês cheio. */
function mesCheio() {
  return {
    alunoNome: 'Cecília', mes: '2026-10', mesExtenso: 'Outubro de 2026',
    qtdEncontros: 9, totalValor: 2700, valorHora: 100,
    resumoTexto: 'A Cecília passou a chegar com as dúvidas já anotadas, e isso mudou o rendimento das nossas horas.',
    linhas: [
      aula('2026-10-02', [
        { id: 't1', titulo: 'Semelhança de triângulos', disciplina: 'matematica' },
        { id: 't2', titulo: 'Trigonometria no triângulo retângulo', disciplina: 'matematica' }
      ], ['estrategia-prova']),
      aula('2026-10-05', [{ id: 't1', titulo: 'Semelhança de triângulos', disciplina: 'matematica' }], ['metodo']),
      aula('2026-10-07', [{ id: 't3', titulo: 'Razão e proporção', disciplina: 'matematica' }], ['horarios']),
      aula('2026-10-09', [{ id: 't4', titulo: 'Áreas de figuras planas', disciplina: 'matematica' }], []),
      aula('2026-10-12', [{ id: 'f1', titulo: 'Cinemática, movimento uniforme', disciplina: 'fisica' }], ['metodo']),
      aula('2026-10-15', [{ id: 'f2', titulo: 'Leis de Newton', disciplina: 'fisica' }], []),
      aula('2026-10-19', [{ id: 'i1', titulo: 'Present perfect e past simple', disciplina: 'ingles' }], ['estrategia-prova']),
      aula('2026-10-23', [{ id: 'i2', titulo: 'Vocabulário de rotina', disciplina: 'ingles' }], []),
      aula('2026-10-27', [{ id: 'i3', titulo: 'Leitura de texto longo', disciplina: 'ingles' }], ['metodo'])
    ],
    areasDoMes: [
      { id: 'estrategia-prova', rotulo: 'Estratégia de prova', vezes: 2 },
      { id: 'metodo', rotulo: 'Método de estudo', vezes: 3 },
      { id: 'horarios', rotulo: 'Organização dos horários', vezes: 1 },
      { id: 'x1', rotulo: 'Leitura de enunciado', vezes: 1 },
      { id: 'x2', rotulo: 'Autonomia na tarefa', vezes: 1 },
      { id: 'x3', rotulo: 'Constância na rotina', vezes: 1 },
      { id: 'x4', rotulo: 'Confiança na prova', vezes: 1 }
    ]
  };
}

/* Um mês com N assuntos, para medir o que acontece quando ela dá muita coisa. */
function mesCom(n, disciplinas) {
  const discs = disciplinas || ['matematica'];
  const linhas = [];
  for (let i = 0; i < n; i++) {
    const dia = String(1 + (i % 28)).padStart(2, '0');
    linhas.push(aula('2026-11-' + dia, [{
      id: 't' + i, titulo: 'Assunto de número ' + (i + 1), disciplina: discs[i % discs.length]
    }], []));
  }
  return {
    alunoNome: 'Teste', mes: '2026-11', mesExtenso: 'Novembro de 2026',
    qtdEncontros: linhas.length,
    resumoTexto: 'Foi um mês de muita coisa e ele acompanhou o ritmo até o fim.',
    linhas: linhas,
    areasDoMes: [
      { id: 'a1', rotulo: 'Estratégia de prova', vezes: 3 },
      { id: 'a2', rotulo: 'Método de estudo', vezes: 2 },
      { id: 'a3', rotulo: 'Organização dos horários', vezes: 1 }
    ]
  };
}

// ================================================================ contraste

function luminancia(hex) {
  const v = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
function contraste(a, b) {
  const L1 = luminancia(a), L2 = luminancia(b);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

// ================================================================
secao('1. O tamanho é fixo e é 1080 por 1080');

{
  const r = pintar(mesSimples());
  conf('o canvas sai com 1080 de largura', r.canvas.width, 1080);
  conf('o canvas sai com 1080 de altura', r.canvas.height, 1080);
  conf('o módulo anuncia o mesmo lado', Cartao.LADO, 1080);

  const fundo = r.ctx.ops.filter(o => o[0] === 'fillRect')[0];
  conf('o fundo cobre o cartão inteiro',
    fundo && fundo[1] === 0 && fundo[2] === 0 && fundo[3] === 1080 && fundo[4] === 1080, true);

  /* Nada pode nascer fora da imagem, nem por cima do rodapé. O 1046 é a linha
   * de base do rodapé mais folga; o 0 é a borda de cima. */
  const forax = r.textos.filter(t => t.x < 0 || t.x + t.largura > 1080);
  conf('nenhum texto passa da borda lateral', forax.length, 0);
  const foray = r.textos.filter(t => t.y < 0 || t.y > 1046);
  conf('nenhum texto passa da borda de cima ou de baixo', foray.length, 0);
}

// ================================================================
secao('2. O contraste do texto sobre o fundo');

{
  /* O cartão tem dois fundos: o marfim da folha e o branco das duas caixas. */
  const IVORY = Cartao.COR.ivory, BRANCO = Cartao.COR.branco;
  [['navy', Cartao.COR.navy], ['texto', Cartao.COR.texto],
  ['teal', Cartao.COR.teal], ['muted', Cartao.COR.muted]].forEach(function (par) {
    const cIv = contraste(par[1], IVORY), cBr = contraste(par[1], BRANCO);
    console.log('        ' + par[0].padEnd(6) + ' ' + par[1] +
      '  marfim ' + cIv.toFixed(2) + ':1   branco ' + cBr.toFixed(2) + ':1');
    conf(par[0] + ' passa de 4,5:1 sobre o marfim', cIv >= 4.5, true);
    conf(par[0] + ' passa de 4,5:1 sobre o branco', cBr >= 4.5, true);
  });

  /* E a trava que importa de verdade: nenhuma cor de texto que o cartão
   * REALMENTE usa pode estar fora dessa lista aprovada. Medir a paleta e
   * desenhar com outra tinta é o jeito de o teste passar e a folha reprovar. */
  const aprovadas = [Cartao.COR.navy, Cartao.COR.texto, Cartao.COR.teal, Cartao.COR.muted];
  const r = pintar(mesCheio());
  const estranhas = r.textos
    .filter(t => t.alpha > 0.2)                       // a marca d'água não é texto de ler
    .map(t => t.cor)
    .filter(c => aprovadas.indexOf(c) < 0);
  conf('todo texto legível usa uma das quatro tintas medidas',
    estranhas.length ? estranhas.join(',') : 0, 0);

  /* A marca d'água é a exceção, e ela é exceção por ser invisível de propósito:
   * navy a 4,5 por cento de opacidade. Se um dia ela subir, vira texto por
   * cima do conteúdo. */
  const marca = r.textos.filter(t => t.texto === 'NW')[0];
  conf('a marca d\'água existe', !!marca, true);
  conf('e é quase invisível', marca && marca.alpha <= 0.05, true);
}

// ================================================================
secao('3. O mês simples: o desenho do primeiro protótipo');

{
  const r = pintar(mesSimples());
  const ditos = r.textos.map(t => t.texto);

  conf('o nome do aluno aparece', ditos.indexOf('Marcelo') >= 0, true);
  conf('o mês aparece em maiúsculas', r.plano.dados.mes, 'Setembro de 2026');
  conf('a contagem de encontros é a do fechamento', r.plano.pilula.numero, '12');
  conf('com uma disciplina só, a legenda não fala de disciplina',
    r.plano.pilula.legenda, 'encontros no mês');
  conf('e nenhuma linha vira cabeçalho de disciplina',
    r.plano.linhas.filter(l => l.tipo === 'disciplina').length, 0);

  const temas = r.plano.linhas.filter(l => l.tipo === 'tema').map(l => l.texto);
  conf('os três assuntos do mês cabem', temas.length, 3);
  conf('e o que mais apareceu vem primeiro', temas[0], 'Equações do primeiro grau');
  conf('nada ficou de fora', r.plano.foraTema, 0);
  conf('não há linha de sobra quando nada sobrou',
    r.plano.linhas.filter(l => l.tipo === 'resto').length, 0);

  const areas = r.plano.linhas.filter(l => l.tipo === 'area').map(l => l.texto);
  conf('as três áreas cabem', areas.length, 3);
  conf('a seção das áreas tem título',
    r.plano.linhas.filter(l => l.tipo === 'titulo' && l.texto === 'ALÉM DO CONTEÚDO').length, 1);

  /* Com pouco conteúdo o cartão respira, em vez de ficar espremido no alto com
   * meio cartão vazio embaixo. É a diferença de ritmo entre os dois protótipos:
   * no mês simples os assuntos ficam de 46 em 46 px, no mês cheio de 33 em 33. */
  conf('sobrando espaço, a lista ganha respiro', r.plano.respiro > 0, true);
}

// ================================================================
secao('4. O mês com três matérias: agrupa por matéria');

{
  const r = pintar(mesCheio());
  const cabecalhos = r.plano.linhas.filter(l => l.tipo === 'disciplina').map(l => l.texto);
  conf('as três matérias aparecem com nome', cabecalhos.length, 3);
  conf('a matéria de mais encontros vem primeiro', cabecalhos[0], 'Matemática');
  conf('e as outras duas estão lá',
    cabecalhos.indexOf('Física') >= 0 && cabecalhos.indexOf('Inglês') >= 0, true);

  conf('a legenda diz quantas disciplinas, por extenso',
    r.plano.pilula.legenda, 'encontros no mês, em três disciplinas');

  const comEncontros = r.plano.linhas.filter(l => l.tipo === 'disciplina' && /encontro/.test(l.extra || ''));
  conf('cada matéria diz quantos encontros teve', comEncontros.length, 3);
  const mat = r.plano.linhas.filter(l => l.tipo === 'disciplina' && l.texto === 'Matemática')[0];
  conf('e a conta é de dias distintos, não de assuntos', mat.extra, '4 encontros');

  conf('sobraram assuntos e o cartão diz quantos', r.plano.foraTema > 0, true);
  const resto = r.plano.linhas.filter(l => l.tipo === 'resto')[0];
  conf('a linha de sobra manda para o fechamento',
    /na lista completa do fechamento/.test(resto.texto), true);
  conf('e o número dela bate com o que ficou de fora',
    new RegExp('e mais ' + r.plano.foraTema + ' assuntos').test(resto.texto), true);
}

// ================================================================
secao('5. Um, cinco, doze e quarenta assuntos no mês');

[1, 5, 12, 40].forEach(function (n) {
  const r = pintar(mesCom(n));
  const mostrados = r.plano.linhas.filter(l => l.tipo === 'tema').length;
  const rotulo = n + ' assunto' + (n === 1 ? '' : 's');

  /* A conta que não pode falhar nunca: o que apareceu mais o que o cartão diz
   * que ficou de fora tem que ser o mês inteiro. É isto que impede o cartão de
   * mentir por omissão. */
  conf(rotulo + ': mostrados mais os de fora dão o total',
    mostrados + r.plano.foraTema, n);
  conf(rotulo + ': pelo menos um assunto aparece', mostrados >= 1, true);
  conf(rotulo + ': a lista termina antes da frase dela',
    r.plano.fundoLista <= r.plano.limiteLista + 1, true);
  if (r.plano.foraTema > 0) {
    const resto = r.plano.linhas.filter(l => l.tipo === 'resto' && /fechamento/.test(l.texto));
    conf(rotulo + ': e o cartão avisa quantos ficaram de fora', resto.length, 1);
  } else {
    conf(rotulo + ': nada de fora, nada a avisar',
      r.plano.linhas.filter(l => l.tipo === 'resto' && /fechamento/.test(l.texto)).length, 0);
  }
  console.log('        ' + rotulo + ': ' + mostrados + ' na imagem, ' +
    r.plano.foraTema + ' no fechamento, fundo da lista em ' + r.plano.fundoLista + ' px');
});

/* E o pior caso de todos: muitos assuntos espalhados em muitas matérias, que é
 * o que faz a lista de cabeçalhos sozinha estourar o cartão. */
{
  const doze = ['matematica', 'portugues', 'ingles', 'fisica', 'quimica', 'biologia',
    'historia', 'geografia', 'redacao', 'literatura', 'ciencias', 'estudo'];
  const r = pintar(mesCom(40, doze));
  const mostrados = r.plano.linhas.filter(l => l.tipo === 'tema').length;
  conf('40 assuntos em 12 matérias: a conta continua fechando',
    mostrados + r.plano.foraTema, 40);
  conf('40 assuntos em 12 matérias: a lista termina antes da frase',
    r.plano.fundoLista <= r.plano.limiteLista + 1, true);
  conf('40 assuntos em 12 matérias: alguma matéria ainda aparece com nome',
    r.plano.linhas.filter(l => l.tipo === 'disciplina').length >= 1, true);
  console.log('        12 matérias: ' + r.plano.linhas.filter(l => l.tipo === 'disciplina').length +
    ' matérias nomeadas, ' + mostrados + ' assuntos na imagem, ' + r.plano.foraTema + ' no fechamento');
}

// ================================================================
secao('6. A frase é dela, e sai inteira');

{
  const texto = 'Ele encontrou sozinho três dos quatro erros da própria lista, o que não acontecia em julho. Seguimos com produtos notáveis. Ele já pergunta antes de travar!';
  const frases = Cartao.frasesDoResumo(texto);
  conf('o resumo vira três opções', frases.length, 3);
  conf('a primeira opção é a primeira frase, sem uma palavra trocada',
    frases[0], 'Ele encontrou sozinho três dos quatro erros da própria lista, o que não acontecia em julho.');
  conf('e nenhuma opção foi encurtada',
    frases.every(f => texto.indexOf(f) >= 0), true);

  conf('resumo vazio não vira opção nenhuma', Cartao.frasesDoResumo('').length, 0);
  conf('resumo ausente não quebra', Cartao.frasesDoResumo(undefined).length, 0);
  conf('número com ponto não parte a frase ao meio',
    Cartao.frasesDoResumo('Ele acertou 1.500 pontos na simulada de outubro.').length, 1);
  conf('quebra de linha também separa frase',
    Cartao.frasesDoResumo('Primeira anotação do mês\nSegunda anotação do mês').length, 2);
  conf('sobra curta de pontuação não vira opção',
    Cartao.frasesDoResumo('Sim. Foi um mês muito bom para ele.').length, 1);

  /* A frase escolhida chega inteira ao cartão, palavra por palavra e na ordem.
   * Esta é a trava do "o que ela já escreveu não pode mudar de sentido nem
   * sumir": a lista de assuntos encolhe, a frase dela nunca. */
  const r = pintar(mesSimples(), { frase: frases[0] });
  const juntas = r.plano.frase.linhas.join(' ');
  conf('a frase escolhida chega ao cartão sem perder palavra',
    juntas.replace(/\s+/g, ' ').trim(), frases[0].replace(/\s+/g, ' ').trim());
  conf('e ela é desenhada em navy sobre a caixa branca',
    r.textos.filter(t => t.texto === r.plano.frase.linhas[0])[0].cor, Cartao.COR.navy);

  /* Frase muito longa: a caixa cresce para cima e a LISTA é que encolhe. */
  const longa = 'Ele chegou em setembro travando na primeira linha de qualquer questão de equação e terminou o mês resolvendo sozinho a lista inteira da escola, inclusive as três questões que a professora tinha marcado como as mais difíceis do bimestre, e ainda conferiu as próprias contas antes de me mostrar.';
  const rl = pintar(mesSimples(), { frase: longa });
  conf('frase longa sai inteira mesmo assim',
    rl.plano.frase.linhas.join(' ').replace(/\s+/g, ' ').trim(), longa);
  conf('e quem encolhe é a lista, não ela',
    rl.plano.linhas.filter(l => l.tipo === 'tema').length <= 3, true);
  conf('a caixa da frase não invade o rodapé',
    rl.plano.frase.topo + rl.plano.frase.altura <= 968, true);
  conf('nem sobe acima do teto', rl.plano.frase.topo >= 470, true);

  /* Sem resumo escrito, o cartão sai sem caixa de frase, e não com uma caixa
   * vazia nem com um texto inventado. */
  const semResumo = mesSimples();
  semResumo.resumoTexto = '';
  const rs = pintar(semResumo);
  conf('sem resumo, não há caixa de frase', rs.plano.frase, null);
  conf('e a lista usa o espaço que sobrou', rs.plano.limiteLista, 968);
}

// ================================================================
secao('7. O que nunca pode aparecer numa imagem');

{
  const f = mesCheio();
  f.totalValor = 2700;
  f.valorFeito = 2700;
  f.minutosDadosSemCobrar = 180;
  f.minutosDesmarcados = 120;
  f.responsavel = 'Fulana de Tal';
  f.faixas = [{ valorHora: 100, minutos: 1620, valor: 2700 }];
  f.linhas.forEach(function (l) { l.notaTexto = 'anotação interna da aula'; });

  const r = pintar(f);
  const tudo = r.textos.map(t => t.texto).join(' | ');

  conf('nenhum cifrão no cartão', /R\$/.test(tudo), false);
  conf('nenhum total do mês', /2700|2\.700|2\.700,00/.test(tudo), false);
  conf('nenhum valor da hora', /\b100,00\b|\bR\$ ?100\b/.test(tudo), false);
  conf('nada do que ela deu e não cobrou', /não cobrad|sem cobrar|desmarcad/i.test(tudo), false);
  conf('nenhum nome de responsável', /Fulana/.test(tudo), false);
  conf('nenhuma anotação de aula', /anotação interna/.test(tudo), false);
  conf('nenhuma data de aula em formato de banco', /\d{4}-\d{2}-\d{2}/.test(tudo), false);

  /* E a regra da casa: travessão nenhum no que é desenhado. Ela lê isso, e a
   * família também.
   *
   * Os dois sinais entram por escape e não pelo glifo, pelo mesmo motivo que o
   * portão de merge não escreve o nome do aluno dentro de si: escritos por
   * extenso, os dois arquivos que fazem a conferência seriam eles próprios
   * reprovados por ela, e a trava passaria a acusar a si mesma. */
  const TRAVESSAO = /[\u2013\u2014]/;
  conf('nenhum travessão no que é desenhado', TRAVESSAO.test(tudo), false);
  const leia = n => require('fs').readFileSync(require('path').join(__dirname, n), 'utf8');
  conf('nem no cartao.js inteiro', TRAVESSAO.test(leia('../cartao.js')), false);
  conf('nem neste teste', TRAVESSAO.test(leia('testa_cartao.js')), false);
}

// ================================================================
secao('8. Campo que falta não derruba o cartão');

{
  /* Nasce tudo opcional. Um aluno de antes deste item, um mês sem nada
   * registrado, um fechamento vindo por outro caminho: todos têm que sair. */
  const casos = [
    ['fechamento vazio', {}],
    ['sem linhas', { alunoNome: 'Ana', mesExtenso: 'Março de 2026', qtdEncontros: 0 }],
    ['sem assunto nenhum', {
      alunoNome: 'Ana', mesExtenso: 'Março de 2026', qtdEncontros: 3,
      linhas: [aula('2026-03-02', [], []), aula('2026-03-04', [], [])], areasDoMes: []
    }],
    ['assunto sem disciplina', {
      alunoNome: 'Ana', mesExtenso: 'Março de 2026', qtdEncontros: 2,
      linhas: [aula('2026-03-02', ['Frações'], [])]
    }],
    ['só temasDoMes, sem linhas detalhadas', {
      alunoNome: 'Ana', mesExtenso: 'Março de 2026', qtdEncontros: 2,
      temasDoMes: [{ titulo: 'Frações', datas: ['2026-03-02'] }]
    }],
    ['área sem rótulo', {
      alunoNome: 'Ana', mesExtenso: 'Março de 2026', qtdEncontros: 1,
      linhas: [aula('2026-03-02', ['Frações'], ['x'])],
      areasDoMes: [{ id: 'x', rotulo: '', vezes: 1 }, { id: 'y', vezes: 1 }]
    }],
    ['aluno sem nome', { mesExtenso: 'Março de 2026', qtdEncontros: 1, linhas: [] }]
  ];
  casos.forEach(function (c) {
    let ok = true, erro = '';
    try {
      const r = pintar(c[1]);
      ok = r.canvas.width === 1080 && r.canvas.height === 1080 && r.textos.length > 0;
    } catch (e) { ok = false; erro = e.message; }
    conf(c[0] + ': o cartão sai assim mesmo', ok || erro, true);
  });

  /* Aula cancelada não é encontro e não empresta assunto para o cartão. */
  const comCancelada = {
    alunoNome: 'Ana', mesExtenso: 'Março de 2026', qtdEncontros: 1,
    linhas: [
      aula('2026-03-02', ['Frações'], []),
      aula('2026-03-04', ['Nunca demos isto'], [], { status: 'cancelada', cobravel: false })
    ]
  };
  const rc = pintar(comCancelada);
  conf('aula cancelada não põe assunto no cartão',
    rc.plano.linhas.filter(l => l.tipo === 'tema' && /Nunca demos/.test(l.texto)).length, 0);

  /* Assunto digitado com caixa diferente é o mesmo assunto, e não duas linhas. */
  const comCaixa = {
    alunoNome: 'Ana', mesExtenso: 'Março de 2026', qtdEncontros: 2,
    linhas: [aula('2026-03-02', ['Frações'], []), aula('2026-03-04', ['frações'], [])]
  };
  const rk = pintar(comCaixa);
  conf('o mesmo assunto em caixas diferentes vira uma linha só',
    rk.plano.linhas.filter(l => l.tipo === 'tema').length, 1);
  conf('e vale pelos dois encontros', rk.plano.dados.disciplinas[0].encontros, 2);
}

// ================================================================
secao('9. Nome comprido e assunto comprido não estouram a caixa');

{
  const f = mesSimples();
  f.alunoNome = 'Maria Aparecida da Conceição Nascimento Filha';
  const r = pintar(f);
  const nome = r.textos.filter(t => /^Maria/.test(t.texto))[0];
  conf('o nome comprido é desenhado', !!nome, true);
  conf('o nome comprido cabe na largura útil', nome.largura <= 936, true);
  conf('e não estoura a margem direita', nome.x + nome.largura <= 1008, true);
  conf('o corpo encolheu para caber, mas não abaixo do piso', nome.corpo >= 34, true);
  conf('e o nome não foi cortado', nome.texto, f.alunoNome);

  /* Nome que não cabe nem no corpo mínimo vira o primeiro nome, que é como os
   * dois protótipos mostram o aluno de qualquer jeito. */
  const h = mesSimples();
  h.alunoNome = 'Wolfeschlegelsteinhausenbergerdorff Ana Beatriz de Albuquerque Cavalcanti Menezes';
  const rh = pintar(h);
  const so = rh.textos.filter(t => t.corpo >= 34 && t.cor === Cartao.COR.navy && t.alpha > 0.2 && t.y < 300)[0];
  conf('nome que não cabe de jeito nenhum vira o primeiro nome',
    so.texto, 'Wolfeschlegelsteinhausenbergerdorff');
  conf('e mesmo assim não estoura a margem', so.x + so.largura <= 1008, true);

  const g = mesSimples();
  g.linhas = [aula('2026-09-01', [
    'Trigonometria no triângulo retângulo e as razões seno, cosseno e tangente aplicadas a problemas de altura inacessível'
  ], [])];
  const rg = pintar(g);
  const linha = rg.plano.linhas.filter(l => l.tipo === 'tema')[0];
  const desenhado = rg.textos.filter(t => /Trigonometria/.test(t.texto))[0];
  conf('o assunto comprido é encurtado com reticências', /\.\.\.$/.test(desenhado.texto), true);
  conf('e o que sobrou cabe na linha', desenhado.x + desenhado.largura <= 1008, true);
  conf('o começo do assunto continua legível', /^Trigonometria no triângulo/.test(desenhado.texto), true);
  conf('a linha existe no plano com o título inteiro', /altura inacessível$/.test(linha.texto), true);
}

// ================================================================
secao('10. O mesmo mês sai sempre o mesmo cartão');

{
  /* Ela vê antes de mandar. Se o desenho mudasse entre a prévia e o arquivo,
   * a promessa do documento ("é exatamente essa imagem que a família recebe")
   * seria falsa. */
  const a = pintar(mesCheio());
  const b = pintar(mesCheio());
  conf('duas passadas desenham exatamente a mesma coisa',
    JSON.stringify(a.ctx.ops) === JSON.stringify(b.ctx.ops), true);

  /* E o planejar não depende do canvas: é a mesma conta com a mesma régua. */
  const dados = Cartao.montar(mesCheio(), {});
  const p1 = Cartao.planejar(dados, medirFalso);
  const p2 = Cartao.planejar(dados, medirFalso);
  conf('e o planejamento é o mesmo fora do canvas',
    JSON.stringify(p1.linhas) === JSON.stringify(p2.linhas), true);
}

// ================================================================
secao('11. A aula que ainda não aconteceu não conta como acontecida');

/* Aqui o fechamento não é de mentira: quem monta é o motor de verdade, com o
 * dia de hoje fixado. É o único jeito de a conferência valer alguma coisa, já
 * que o defeito era exatamente o cartão contar diferente do motor no MESMO mês.
 * A aula nasce marcada como realizada, inclusive a que está lá na frente no
 * calendário, e no dia três de setembro a família lia onze encontros. */
const Core = require('../core.js');

function bancoDoMarcelo(diasFeitos, diasAFrente, comTemaNaFrente) {
  const db = {
    alunos: [{
      id: 'al1', nome: 'Marcelo',
      precos: [{ inicio: '2026-01-01', valorHora: 90 }]
    }],
    aulas: [],
    resumos: [{
      alunoId: 'al1', mes: '2026-09',
      texto: 'Ele encontrou sozinho três dos quatro erros da própria lista. Seguimos com produtos notáveis.'
    }]
  };
  diasFeitos.forEach(function (d) {
    db.aulas.push({
      id: 'f' + d, alunoId: 'al1', data: '2026-09-' + d, hora: '14:00', duracaoMin: 60,
      status: 'realizada',
      temas: [{ id: 't1', titulo: 'Equações do primeiro grau', disciplina: 'matematica' }]
    });
  });
  diasAFrente.forEach(function (d) {
    db.aulas.push({
      id: 'p' + d, alunoId: 'al1', data: '2026-09-' + d, hora: '14:00', duracaoMin: 60,
      status: 'realizada',
      temas: comTemaNaFrente
        ? [{ id: 't9', titulo: 'Ainda não demos isto', disciplina: 'matematica' }]
        : []
    });
  });
  return db;
}

{
  /* O caso medido: três encontros dados e oito marcados à frente, conferido no
   * dia 03/09/2026. O motor sabe separar os dois desde o item que criou o par
   * qtdEncontrosFeitos e qtdEncontrosPrevistos. */
  const db = bancoDoMarcelo(['01', '02', '03'],
    ['04', '08', '09', '10', '11', '15', '16', '17'], false);
  const f = Core.calcularFechamento(db, 'al1', '2026-09', '2026-09-03');

  conf('o motor conta 3 encontros feitos', f.qtdEncontrosFeitos, 3);
  conf('o motor conta 8 marcados à frente', f.qtdEncontrosPrevistos, 8);
  conf('e o mês inteiro dá 11', f.qtdEncontros, 11);

  const r = pintar(f);
  /* O número grande é o que a família lê de relance na conversa. Ele é medido
   * no que foi DESENHADO, e não no plano: o defeito anterior passava pelo plano
   * e pelo desenho igual. */
  const grande = r.textos.filter(t => t.corpo === 44 && t.alpha > 0.2)[0];
  conf('o número grande do cartão é o que aconteceu, e não o mês inteiro',
    grande && grande.texto, '3');
  conf('o cartão não desenha o 11 em lugar nenhum',
    r.textos.filter(t => /\b11\b/.test(t.texto)).length, 0);
  conf('a legenda diz até onde a conta vai',
    r.plano.pilula.legenda, 'encontros até aqui');

  /* E o previsto não some: sumir com ele seria o mesmo erro ao contrário. */
  const desenhados = r.textos.map(t => t.texto);
  conf('o que está marcado à frente é dito com todas as letras',
    desenhados.indexOf('mais 8 marcados à frente') >= 0, true);
  console.log('        motor: ' + f.qtdEncontrosFeitos + ' feitos, ' +
    f.qtdEncontrosPrevistos + ' previstos, ' + f.qtdEncontros + ' no mês inteiro' +
    '   cartão: "' + grande.texto + ' ' + r.plano.pilula.legenda + ', ' +
    r.plano.pilula.legenda2 + '"');

  /* As duas linhas moram dentro da pílula, que vai de 296 a 376. */
  const naPilula = r.textos.filter(t => t.texto === r.plano.pilula.legenda ||
    t.texto === r.plano.pilula.legenda2);
  conf('as duas linhas da legenda foram desenhadas', naPilula.length, 2);
  conf('e nenhuma delas escapa da pílula',
    naPilula.every(t => t.y - t.corpo >= 296 && t.y + 6 <= 376), true);
  conf('nem estoura a margem direita',
    naPilula.every(t => t.x + t.largura <= 1008), true);
}

{
  /* O mês vencido é o caso de sempre, e ele não pode mudar de cara: previsto e
   * realizado são a mesma coisa depois que o mês acaba. */
  const db = bancoDoMarcelo(['01', '02', '03', '08', '09'], [], false);
  const f = Core.calcularFechamento(db, 'al1', '2026-09', '2026-10-01');
  const r = pintar(f);
  conf('mês vencido: o número é o mês inteiro', r.plano.pilula.numero, '5');
  conf('mês vencido: a legenda volta a ser a de sempre',
    r.plano.pilula.legenda, 'encontros no mês');
  conf('mês vencido: não há segunda linha', r.plano.pilula.legenda2, '');
}

{
  /* Um encontro dado e um marcado à frente: o singular das duas linhas. */
  const db = bancoDoMarcelo(['01'], ['20'], false);
  const f = Core.calcularFechamento(db, 'al1', '2026-09', '2026-09-01');
  const r = pintar(f);
  conf('um encontro só: o número é 1', r.plano.pilula.numero, '1');
  conf('um encontro só: legenda no singular', r.plano.pilula.legenda, 'encontro até aqui');
  conf('um marcado à frente: segunda linha no singular',
    r.plano.pilula.legenda2, 'mais 1 marcado à frente');
}

{
  /* A lista se chama "O QUE TRABALHAMOS", no passado. O assunto de uma aula que
   * ainda não houve não pode entrar nela, e a contagem de encontros da matéria
   * também não pode contá-la. */
  const db = bancoDoMarcelo(['01', '02'], ['20', '21'], true);
  const f = Core.calcularFechamento(db, 'al1', '2026-09', '2026-09-02');
  const r = pintar(f);
  const ditos = r.textos.map(t => t.texto).join(' | ');
  conf('assunto de aula marcada à frente não entra na lista',
    /Ainda não demos isto/.test(ditos), false);
  conf('e o assunto das aulas dadas entra',
    /Equações do primeiro grau/.test(ditos), true);
  conf('o cartão não fica sem lista por causa disso',
    r.plano.linhas.filter(l => l.tipo === 'tema').length, 1);

  /* E o caminho de trás: quando TODAS as aulas com assunto estão à frente, o
   * cartão não pode cair no temasDoMes, que é do mês inteiro e não sabe separar
   * o que aconteceu. Sai sem lista, que é a verdade. */
  const dbSo = bancoDoMarcelo([], ['20', '21'], true);
  const fSo = Core.calcularFechamento(dbSo, 'al1', '2026-09', '2026-09-02');
  conf('o motor entrega o assunto futuro no temasDoMes',
    (fSo.temasDoMes || []).length, 1);
  const rSo = pintar(fSo);
  conf('e mesmo assim ele não chega ao cartão pela porta dos fundos',
    /Ainda não demos isto/.test(rSo.textos.map(t => t.texto).join(' | ')), false);
  conf('o cartão sai assim mesmo, com o número zerado', rSo.plano.pilula.numero, '0');
}

{
  /* Fechamento antigo, sem nenhum dos campos novos, continua lendo o que sempre
   * leu. Isto é o "campo novo nasce opcional" visto do lado de quem lê. */
  const velho = mesSimples();
  delete velho.qtdEncontrosFeitos;
  delete velho.qtdEncontrosPrevistos;
  velho.linhas.forEach(function (l) { delete l.futura; });
  const r = pintar(velho);
  conf('fechamento antigo: o número é o qtdEncontros de sempre',
    r.plano.pilula.numero, '12');
  conf('fechamento antigo: e a legenda é a de sempre',
    r.plano.pilula.legenda, 'encontros no mês');

  /* E o degrau do meio: linhas que sabem o que é futuro, mas sem os campos
   * novos do fechamento. A conta é refeita pelas linhas. */
  const meio = mesSimples();
  delete meio.qtdEncontrosFeitos;
  meio.linhas[3].futura = true;
  const rm = pintar(meio);
  conf('sem o campo novo, a conta é refeita pelas linhas', rm.plano.pilula.numero, '3');
  conf('e o previsto sai delas também', rm.plano.pilula.legenda2, 'mais 1 marcado à frente');
}

{
  /* A legenda de duas linhas é a mais comprida que o cartão tem, e ela divide a
   * pílula com o número grande. Doze disciplinas e dois dígitos de cada lado é
   * o pior caso, e ele tem que caber medido, não no olho. */
  const doze = ['matematica', 'portugues', 'ingles', 'fisica', 'quimica', 'biologia',
    'historia', 'geografia', 'redacao', 'literatura', 'ciencias', 'estudo'];
  const f = mesCom(24, doze);
  f.qtdEncontrosFeitos = 12;
  f.qtdEncontrosPrevistos = 12;
  const r = pintar(f);
  const naPilula = r.textos.filter(t => t.texto === r.plano.pilula.legenda ||
    t.texto === r.plano.pilula.legenda2);
  conf('pior caso: as duas linhas da legenda cabem na pílula',
    naPilula.length === 2 && naPilula.every(t => t.x + t.largura <= 1008), true);
  conf('pior caso: e não encolheram abaixo do piso legível',
    r.plano.pilula.tam >= 16, true);
  console.log('        pior caso: "' + r.plano.pilula.legenda + '" / "' +
    r.plano.pilula.legenda2 + '" em ' + r.plano.pilula.tam + ' px, ' +
    Math.round(Math.max.apply(null, naPilula.map(t => t.x + t.largura))) + ' px de borda direita');
}

// ================================================================
secao('12. A frase é dela, e o valor em reais que ela escreveu não vai na imagem');

{
  /* O resumo do mês é onde ela escreve o combinado de preço, junto com o resto.
   * A lista de escolha é o resumo partido em frases, então sem filtro nenhum a
   * frase do preço virava opção e ia para a imagem com um toque. */
  const comPreco = 'Ele fechou o mês resolvendo sozinho a lista inteira da escola. Combinamos R$ 137,50 a hora a partir do dia quinze. Seguimos com produtos notáveis em outubro.';
  const frases = Cartao.frasesDoResumo(comPreco);

  conf('a frase do preço não é oferecida na lista',
    frases.filter(f => /137,50/.test(f)).length, 0);
  conf('e as outras duas continuam sendo', frases.length, 2);
  conf('sem uma palavra trocada nelas',
    frases.every(f => comPreco.indexOf(f) >= 0), true);

  /* A medida que importa é no DESENHO, e não no código: mesmo entrando por
   * opcoes.frase, que é por fora da lista de escolha, o valor não é desenhado. */
  const r = pintar(mesSimples(), { frase: 'Combinamos R$ 137,50 a hora a partir do dia quinze.' });
  const tudo = r.textos.map(t => t.texto).join(' | ');
  conf('a frase com preço não é desenhada nem vindo pronta', /137,50/.test(tudo), false);
  conf('nenhum cifrão chega à imagem', /R\$/.test(tudo), false);
  conf('e o cartão sai assim mesmo, sem a caixa da frase', r.plano.frase, null);
  conf('dizendo numa linha por que ela não entrou',
    /valor em reais/.test(r.plano.dados.fraseOmitida), true);

  /* E o mês inteiro, do resumo ao desenho, sem ninguém escolher frase nenhuma:
   * é assim que a tela dela chama o cartão quando abre. */
  const f = mesSimples();
  f.resumoTexto = comPreco;
  const rf = pintar(f);
  const desenhado = rf.textos.map(t => t.texto).join(' | ');
  conf('abrindo o cartão do mês, o preço não aparece',
    /R\$|137,50/.test(desenhado), false);
  conf('e a frase que aparece é a primeira que sobrou',
    rf.plano.frase.linhas.join(' ').indexOf('Ele fechou o mês') === 0, true);

  /* As outras formas de escrever o mesmo combinado. */
  [
    'Combinamos 137,50 a hora a partir do dia quinze.',
    'Combinamos noventa reais a hora neste semestre.',
    'Ficou em cento e trinta e sete reais a partir de outubro.',
    'O combinado agora é 90/h, como conversamos.',
    'Passa a ser R$137,50 por hora em novembro.'
  ].forEach(function (frase) {
    conf('barrada: "' + frase.slice(0, 34) + '..."', Cartao.temValorEmReais(frase), true);
    const rr = pintar(mesSimples(), { frase: frase });
    conf('  e nada dela é desenhado',
      rr.textos.filter(t => t.texto.indexOf(frase.slice(0, 20)) >= 0).length, 0);
  });

  /* E o que NÃO pode ser barrado, que é o outro jeito de errar: ela dá aula de
   * matemática, e "números reais" é assunto de nono ano. Barrar a palavra
   * sozinha comeria frase legítima dela todo mês. */
  [
    'Ele finalmente entendeu a reta dos números reais.',
    'Trabalhamos situações reais para dar sentido à conta.',
    'Ele acertou 8 das 10 questões da prova de outubro.',
    'Chegou 10 minutos antes em todas as aulas do mês.'
  ].forEach(function (frase) {
    conf('não barrada: "' + frase.slice(0, 34) + '..."', Cartao.temValorEmReais(frase), false);
    const rr = pintar(mesSimples(), { frase: frase });
    conf('  e ela é desenhada inteira',
      rr.plano.frase.linhas.join(' ').replace(/\s+/g, ' ').trim(), frase);
  });

  conf('texto vazio não é confundido com valor', Cartao.temValorEmReais(''), false);
  conf('texto ausente não quebra', Cartao.temValorEmReais(undefined), false);
}

// ================================================================
console.log('\n' + '='.repeat(60));
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
