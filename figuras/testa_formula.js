/* testa_formula.js
 * Aceitacao do figuras/formula.js.
 *
 * Cobre as quatro coisas que o renderizador promete: a arvore que sai da
 * analise, a medida que quem chama usa para quebrar linha, a composicao
 * aninhada (fracao dentro de fracao, raiz dentro de expoente) e TODOS os casos
 * ruins, que sao os que nao podem sair calados na folha da aluna.
 *
 * Roda com: node testa_formula.js
 *
 * Regra da casa: nunca usar travessao.
 */
const PDFGen = require('../pdf.js');
const Formula = require('./formula.js');

/* O registro grita no console.warn de proposito, para quem gera a folha ver o
 * aviso mesmo sem olhar o retorno. Num teste que exercita 40 casos ruins isso
 * enterra o resultado, entao aqui ele fica mudo e o que vale e o array. */
const warnDeVerdade = console.warn;
console.warn = function () { };

let passes = 0, falhas = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado); }
  warnDeVerdade((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { warnDeVerdade('\n=== ' + t + ' ==='); }

/* Um doc espiao: guarda tudo o que foi desenhado, sem gerar PDF. E como se
 * confere a promessa de nunca emitir caractere que a fonte nao tem, porque a
 * pergunta e sobre o texto que chegou ao gerador, e nao sobre o fonte. */
function espiao() {
  const e = {
    pag: { ops: [] }, textos: [], linhas: [], retangulos: [], ops: [],
    texto: function (txt, x, y, o) { e.textos.push({ txt: String(txt), x: x, y: y, o: o || {} }); },
    linha: function (x1, y1, x2, y2, c, esp) { e.linhas.push({ x1: x1, y1: y1, x2: x2, y2: y2, c: c, esp: esp }); },
    retangulo: function (x, y, l, a, c) { e.retangulos.push({ x: x, y: y, l: l, a: a, c: c }); },
    circulo: function () { },
    op: function (s) { e.ops.push(String(s)); }
  };
  return e;
}
function desenhaNoEspiao(latex, tam) {
  const e = espiao();
  const r = Formula.desenhar(e, latex, 100, 400, tam || 11);
  return { esp: e, r: r };
}
function nada(v) { return v === null || v === undefined; }

// ================================================================
secao('1. A arvore que sai da analise');

{
  const a = Formula.analisar('\\frac{1}{2}');
  conf('a raiz da arvore e uma lista', a.tipo, 'lista');
  conf('com um filho so', a.filhos.length, 1);
  conf('e o filho e uma fracao', a.filhos[0].tipo, 'frac');
  conf('o numerador e um grupo', a.filhos[0].num.tipo, 'grupo');
  conf('o denominador tambem', a.filhos[0].den.tipo, 'grupo');
  conf('e nao avisou nada', a.avisos.length, 0);
}
{
  const a = Formula.analisar('\\sqrt[3]{8}');
  conf('\\sqrt[3]{8} vira raiz', a.filhos[0].tipo, 'raiz');
  conf('com indice', nada(a.filhos[0].indice), false);
  conf('e sem aviso', a.avisos.length, 0);
}
{
  const a = Formula.analisar('\\sqrt{8}');
  conf('\\sqrt{8} vira raiz sem indice', nada(a.filhos[0].indice), true);
}
{
  const a = Formula.analisar('x^{2}');
  conf('x^{2} vira nivel', a.filhos[0].tipo, 'nivel');
  conf('com expoente', nada(a.filhos[0].cima), false);
  conf('e sem indice', nada(a.filhos[0].baixo), true);
}
{
  const a = Formula.analisar('a_{1}');
  conf('a_{1} tem indice', nada(a.filhos[0].baixo), false);
  conf('e nao tem expoente', nada(a.filhos[0].cima), true);
}
{
  const a = Formula.analisar('x_{1}^{2}');
  conf('x_{1}^{2} carrega os dois', !nada(a.filhos[0].cima) && !nada(a.filhos[0].baixo), true);
}
{
  const a = Formula.analisar('\\sum_{k=1}^{n} k');
  conf('\\sum vira operador grande', a.filhos[0].tipo, 'opGrande');
  conf('com limite embaixo', nada(a.filhos[0].baixo), false);
  conf('e limite em cima', nada(a.filhos[0].cima), false);
  conf('o limite fica NO operador, e nao vira expoente ao lado',
    a.filhos[0].tipo === 'opGrande' && a.filhos.length === 2, true);
}
['sum', 'prod', 'int', 'lim', 'max', 'min'].forEach(function (nome) {
  const a = Formula.analisar('\\' + nome + '_{a}^{b}');
  conf('\\' + nome + ' aceita limite em cima e embaixo',
    a.filhos[0].tipo === 'opGrande' && !nada(a.filhos[0].cima) && !nada(a.filhos[0].baixo), true);
});
{
  const a = Formula.analisar('\\begin{bmatrix} 2 & -1 \\\\ 3 & 5 \\end{bmatrix}');
  const m = a.filhos[0];
  conf('\\begin{bmatrix} vira matriz', m.tipo, 'matriz');
  conf('com 2 linhas', m.linhas.length, 2);
  conf('e 2 colunas', m.colunas, 2);
  conf('entre colchetes', m.esq + '/' + m.dir, 'colcheteE/colcheteD');
  conf('e sem aviso', a.avisos.length, 0);
}
{
  const p = Formula.analisar('\\begin{pmatrix} 1 \\end{pmatrix}').filhos[0];
  const v = Formula.analisar('\\begin{vmatrix} 1 \\end{vmatrix}').filhos[0];
  conf('pmatrix usa parenteses', p.esq, 'parenE');
  conf('vmatrix usa barras', v.esq + '/' + v.dir, 'barra/barra');
}
{
  const a = Formula.analisar('\\left( x + 1 \\right)');
  conf('\\left ... \\right vira cerca', a.filhos[0].tipo, 'cerca');
  conf('com parenteses dos dois lados', a.filhos[0].esq + '/' + a.filhos[0].dir, 'parenE/parenD');
  conf('e sem aviso', a.avisos.length, 0);
}
['(:parenE', '[:colcheteE', '\\{:chaveE', '|:barra'].forEach(function (par) {
  const p = par.split(':');
  const a = Formula.analisar('\\left' + p[0] + ' x \\right.');
  conf('\\left' + p[0] + ' cresce como ' + p[1], a.filhos[0].esq, p[1]);
});
{
  const a = Formula.analisar('\\text{altura da casa}');
  conf('\\text vira texto', a.filhos[0].tipo, 'texto');
  conf('com o espaco preservado', a.filhos[0].txt, 'altura da casa');
}
{
  const a = Formula.analisar('a \\, b \\quad c');
  const espacos = a.filhos.filter(function (f) { return f.tipo === 'espaco'; });
  conf('\\, e \\quad viram espaco', espacos.length, 2);
  conf('e o \\quad e maior que o \\,', espacos[1].quanto > espacos[0].quanto, true);
}
{
  const a = Formula.analisar('a + b = c');
  conf('o mais e binario', a.filhos[1].classe, 'bin');
  conf('o igual e relacao', a.filhos[3].classe, 'rel');
  conf('e a letra e ordinaria', a.filhos[0].classe, 'ord');
}
{
  const a = Formula.analisar('\\pi \\to \\lambda');
  conf('\\pi sai da fonte', a.filhos[0].txt, 'π');
  conf('\\to e desenhado', a.filhos[1].glifo, 'seta');
  conf('\\lambda e desenhado', a.filhos[2].glifo, 'lambda');
}

// ================================================================
secao('2. A medida, que e o que segura a margem');

{
  const m = Formula.medir('\\frac{1}{2}', 11);
  conf('medir devolve largura, altura e profundidade',
    typeof m.largura + '/' + typeof m.altura + '/' + typeof m.profundidade,
    'number/number/number');
  conf('e devolve a lista de avisos', Array.isArray(m.avisos), true);
  conf('a fracao e mais larga que o numerador sozinho',
    m.largura > Formula.medir('1', 11).largura, true);
  conf('sobe mais que o numerador sozinho',
    m.altura > Formula.medir('1', 11).altura, true);
  conf('e desce abaixo da linha de base', m.profundidade > 0, true);
}
{
  /* Nenhuma medida pode sair NaN: quem chama usa isso para posicionar, e um NaN
   * vira "NaN 400 Td" no fluxo do PDF, que apaga a linha inteira em silencio. */
  const casos = ['x', '\\frac{1}{2}', '\\sqrt[3]{x}', '\\sum_{k=1}^{n}',
    '\\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}', '\\left( x \\right)',
    '\\text{ok}', '\\, \\; \\quad', '', '   ', '\\frac{}{}', '\\sqrt{}',
    '\\begin{bmatrix} \\end{bmatrix}'];
  let ruins = 0;
  casos.forEach(function (c) {
    const m = Formula.medir(c, 11);
    if (isNaN(m.largura) || isNaN(m.altura) || isNaN(m.profundidade)) ruins++;
    if (m.largura < 0) ruins++;
  });
  conf('nenhuma medida sai NaN nem negativa, nem no vazio', ruins, 0);
}
{
  const a = Formula.medir('\\frac{1}{2}', 11).largura;
  const b = Formula.medir('\\frac{1}{2}', 22).largura;
  conf('dobrar o corpo dobra a largura', Math.abs(b - a * 2) < 0.001, true);
}
{
  const e = desenhaNoEspiao('x = \\frac{-b \\pm \\sqrt{b^{2}-4ac}}{2a}', 12);
  const m = Formula.medir('x = \\frac{-b \\pm \\sqrt{b^{2}-4ac}}{2a}', 12);
  conf('a largura medida e a largura desenhada', e.r.largura, m.largura);
  conf('e a altura tambem', e.r.altura, m.altura);
}
{
  const m = Formula.medir('x', 11);
  conf('a altura de "x" e a altura de x, e nao a de maiuscula',
    Math.abs(m.altura - 11 * 0.523) < 0.001, true);
  conf('e "x" nao desce abaixo da linha de base', m.profundidade, 0);
  conf('ja "y" desce', Formula.medir('y', 11).profundidade > 0, true);
  conf('e "X" sobe mais que "x"',
    Formula.medir('X', 11).altura > Formula.medir('x', 11).altura, true);
}
{
  const r = Formula.desenhar(espiao(), '\\frac{1}{2}', 100, 400, 11, { align: 'centro' });
  conf('align centro recua meia largura', Math.abs((100 - r.largura / 2) - r.x) < 0.001, true);
  const d = Formula.desenhar(espiao(), '\\frac{1}{2}', 100, 400, 11, { align: 'direita' });
  conf('align direita recua a largura inteira', Math.abs((100 - d.largura) - d.x) < 0.001, true);
}

// ================================================================
secao('3. Composicao aninhada');

function larg(s) { return Formula.medir(s, 11).largura; }
function alt(s) { return Formula.medir(s, 11).altura; }
function prof(s) { return Formula.medir(s, 11).profundidade; }

conf('fracao dentro de fracao sobe mais que a fracao sozinha',
  alt('\\frac{\\frac{1}{2}}{3}') > alt('\\frac{1}{2}'), true);
conf('e a de dentro encolhe, entao nao fica duas vezes mais larga',
  larg('\\frac{\\frac{1}{2}}{3}') < larg('\\frac{1}{2}') * 2, true);
conf('raiz de fracao e mais alta que raiz de letra',
  alt('\\sqrt{\\frac{a}{b}}') > alt('\\sqrt{a}'), true);
conf('e desce, porque o denominador desce',
  prof('\\sqrt{\\frac{a}{b}}') > 0, true);
conf('raiz dentro de expoente sobe mais que o expoente simples',
  alt('2^{\\sqrt{2}}') > alt('2^{2}'), true);
conf('e o expoente encolhe: nao chega a somar as duas alturas inteiras',
  alt('2^{\\sqrt{2}}') < alt('2') + alt('\\sqrt{2}'), true);
/* O somatorio com limites e mais alto que a fracao, entao a altura do conjunto
 * e a dele: o que se confere aqui e que a fracao no corpo cabe inteira dentro
 * dessa altura, e nao que ela mande na altura. */
conf('somatorio com fracao no corpo cobre a altura do somatorio',
  alt('\\sum_{k=1}^{n} \\frac{1}{k}') >= alt('\\sum_{k=1}^{n} k'), true);
conf('e cobre tambem a altura da fracao',
  alt('\\sum_{k=1}^{n} \\frac{1}{k}') >= alt('\\frac{1}{k}'), true);
conf('e o conjunto fica mais largo que o somatorio sozinho',
  larg('\\sum_{k=1}^{n} \\frac{1}{k}') > larg('\\sum_{k=1}^{n}'), true);
conf('matriz com fracao na celula e mais alta que a matriz de numeros',
  alt('\\begin{bmatrix} \\frac{1}{2} & 1 \\\\ 3 & 4 \\end{bmatrix}') >
  alt('\\begin{bmatrix} 1 & 1 \\\\ 3 & 4 \\end{bmatrix}'), true);
conf('parenteses que crescem ficam mais altos com fracao dentro',
  alt('\\left( \\frac{1}{2} \\right)') > alt('\\left( x \\right)'), true);
conf('e mais largos tambem, porque o parentese engorda com a altura',
  larg('\\left( \\frac{1}{2} \\right)') - larg('\\frac{1}{2}') >
  larg('\\left( x \\right)') - larg('x'), true);
conf('o limite embaixo do lim cabe: a caixa desce',
  prof('\\lim_{x \\to 2} x') > 0, true);
conf('raiz dentro de raiz cresce',
  alt('\\sqrt{2 + \\sqrt{3}}') > alt('\\sqrt{2 + 3}'), true);
conf('e nada disso avisou nada',
  Formula.medir('\\frac{\\frac{1}{2}}{3} + \\sqrt{\\frac{a}{b}} + 2^{\\sqrt{2}}', 11).avisos.length, 0);

// ================================================================
secao('4. Espacamento por classe de simbolo');

const FINO = 11 * 3 / 18, MEDIO = 11 * 4 / 18, GROSSO = 11 * 5 / 18;
conf('"a+b" e mais largo que "ab": o binario leva folga',
  larg('a+b') > larg('ab'), true);
conf('e a folga do binario e de 4/18 do corpo dos dois lados',
  Math.abs(larg('a+b') - (PDFGen.medir('a+b', 11) + 2 * MEDIO)) < 0.01, true);
conf('"a=b" leva folga maior que "a+b": relacao passa na frente de binario',
  larg('a=b') > larg('a+b'), true);
conf('e a folga da relacao e de 5/18 do corpo dos dois lados',
  Math.abs(larg('a=b') - (PDFGen.medir('a=b', 11) + 2 * GROSSO)) < 0.01, true);
conf('"-b" nao leva folga nenhuma: menos no comeco e sinal, e nao operacao',
  Math.abs(larg('-b') - PDFGen.medir('-b', 11)) < 0.01, true);
conf('mas "a-b" leva, porque ali o menos e operacao',
  larg('a-b') > larg('-b') + larg('a'), true);
conf('depois de abre-parenteses o menos volta a ser sinal',
  Math.abs(larg('(-b)') - PDFGen.medir('(-b)', 11)) < 0.01, true);
conf('e depois de relacao tambem: "x=-1" nao abre espaco em volta do menos',
  Math.abs(larg('x=-1') - (PDFGen.medir('x=-1', 11) + 2 * GROSSO)) < 0.01, true);
conf('simbolo solto nao leva folga: "ab" mede o que a fonte mede',
  Math.abs(larg('ab') - PDFGen.medir('ab', 11)) < 0.001, true);
conf('\\, acrescenta 3/18 do corpo',
  Math.abs(larg('a\\,b') - (PDFGen.medir('ab', 11) + FINO)) < 0.01, true);
conf('\\quad acrescenta um corpo inteiro',
  Math.abs(larg('a\\quad b') - (PDFGen.medir('ab', 11) + 11)) < 0.01, true);
conf('dentro do expoente tudo encolhe, o glifo e a folga',
  larg('x^{a+b}') - larg('x^{ab}') < larg('a+b') - larg('ab'), true);
conf('e a folga do binario no expoente fica na metade da tabela',
  Math.abs((larg('x^{a+b}') - larg('x^{ab}') - PDFGen.medir('+', 11 * 0.7)) -
    2 * (11 * 0.7 * 4 / 18) * 0.5) < 0.01, true);
conf('a virgula leva folga so depois: "f(x,y)" abre um fino',
  Math.abs(larg('f(x,y)') - (PDFGen.medir('f(x,y)', 11) + FINO)) < 0.01, true);

// ================================================================
secao('5. Nada sai como interrogacao muda');

{
  /* A promessa que mais importa: todo simbolo da lista ou vem da fonte, ou e
   * desenhado. Aqui cada um e desenhado num doc espiao e o texto que chegou ao
   * gerador passa pela mesma trava de caractere do verificar.py. */
  let semGlifo = [], indesenhavel = [], mudos = [];
  Object.keys(Formula.SIMBOLO).forEach(function (nome) {
    const d = desenhaNoEspiao('\\' + nome, 11);
    if (d.r.avisos.length) semGlifo.push(nome + ': ' + d.r.avisos[0]);
    d.esp.textos.forEach(function (t) {
      if (PDFGen.caracteresQueNaoDesenha(t.txt).length) indesenhavel.push(nome + ' -> ' + t.txt);
    });
    if (!d.esp.textos.length && !d.esp.ops.length && !d.esp.linhas.length) mudos.push(nome);
    if (d.r.largura <= 0) mudos.push(nome + ' (largura zero)');
  });
  conf('nenhum simbolo da tabela ficou sem fonte e sem desenho', semGlifo.join(' | '), '');
  conf('nenhum simbolo mandou caractere que o PDF nao desenha', indesenhavel.join(' | '), '');
  conf('nenhum simbolo saiu vazio da folha', mudos.join(' | '), '');
  conf('e a tabela tem os 30 e poucos do subconjunto',
    Object.keys(Formula.SIMBOLO).length >= 30, true);
}
{
  const pedidos = ['\\pm', '\\times', '\\cdot', '\\div', '\\leq', '\\geq', '\\neq',
    '\\approx', '\\infty', '\\to', '\\Rightarrow', '\\in', '\\subset', '\\cup',
    '\\cap', '\\angle', '\\perp', '\\parallel', '\\pi', '\\alpha', '\\beta',
    '\\theta', '\\Delta', '\\Sigma', '\\lambda', '\\mu', '\\phi', '\\omega'];
  let faltando = [];
  pedidos.forEach(function (p) {
    const m = Formula.medir(p, 11);
    if (m.avisos.length || m.largura <= 0) faltando.push(p);
  });
  conf('todos os simbolos pedidos no subconjunto respondem', faltando.join(' '), '');
}
{
  /* O somatorio, o produtorio e a integral sao desenho de traco, entao tem que
   * sair operador cru, e nao texto. Se um dia alguem trocar por caractere, isto
   * cai antes da folha. */
  ['\\sum', '\\prod', '\\int'].forEach(function (op) {
    const d = desenhaNoEspiao(op, 11);
    conf(op + ' e desenhado a traco', d.esp.ops.length > 0, true);
    conf(op + ' nao manda texto nenhum para a fonte', d.esp.textos.length, 0);
  });
  const l = desenhaNoEspiao('\\lim', 11);
  conf('\\lim sai como palavra em pe', l.esp.textos.length && l.esp.textos[0].txt, 'lim');
}
{
  /* A fonte /Symbol so entra no PDF quando alguma pagina precisou dela. */
  function pdfCom(latex) {
    const doc = new PDFGen.Doc();
    doc.novaPagina();
    Formula.desenhar(doc, latex, 60, 700, 12);
    return Buffer.from(doc.finalizar()).toString('latin1');
  }
  conf('o PDF registra a fonte Symbol quando a formula tem pi',
    /\/BaseFont\s*\/Symbol/.test(pdfCom('A = \\pi r^{2}')), true);
  conf('e nao registra quando a formula nao precisa',
    /\/BaseFont\s*\/Symbol/.test(pdfCom('a + b = c')), false);
  conf('a formula desenhada deixa marca no fluxo da pagina',
    pdfCom('\\frac{1}{2}').indexOf('Tj') > 0, true);
}
{
  const d = desenhaNoEspiao('a ≈ b', 11);
  conf('caractere indesenhavel digitado direto vira aviso', d.r.avisos.length, 1);
  let vazou = 0;
  d.esp.textos.forEach(function (t) {
    if (PDFGen.caracteresQueNaoDesenha(t.txt).length) vazou++;
  });
  conf('e nao chega ao gerador', vazou, 0);
}

// ================================================================
secao('6. Casos ruins: nenhum sai calado');

const RUINS = [
  ['chave que nunca fecha', '\\frac{1}{2 + \\sqrt{3}', /chave \{ aberta/],
  ['chave fechada sem abrir', 'x + 1}', /fechada sem abrir/],
  ['comando que nao existe', 'A = \\raizz{9}', /comando desconhecido/],
  ['comando que nao existe, sem chave', 'A = \\qqq + 1', /comando desconhecido/],
  ['\\frac com um argumento so', '2 + \\frac{3}', /denominador/],
  ['\\frac sem argumento nenhum', '\\frac', /numerador/],
  ['\\sqrt sem argumento', '1 + \\sqrt', /radicando/],
  ['matriz com linhas de tamanhos diferentes',
    '\\begin{bmatrix} 1 & 2 & 3 \\\\ 4 & 5 \\end{bmatrix}', /linha 2 da matriz/],
  ['matriz sem o \\end', '\\begin{bmatrix} 1 & 2 \\\\ 3 & 4', /sem o \\end/],
  ['matriz fechada com outro ambiente',
    '\\begin{bmatrix} 1 \\end{pmatrix}', /fechado com/],
  ['ambiente fora do subconjunto', '\\begin{align} x = 1 \\end{align}', /fora do subconjunto/],
  ['\\begin sem nome', '\\begin x', /sem \{ nome \}/],
  ['\\left sem \\right', '\\left( \\frac{a}{b}', /\\left sem o \\right/],
  ['\\right sem \\left', 'x \\right)', /\\right sem \\left/],
  ['\\left com delimitador que nao existe', '\\left# x \\right#', /delimitador que nao existe/],
  ['expoente sem nada antes', '^{2} + x', /expoente sem nada antes/],
  ['indice sem nada antes', '_{2} + x', /indice sem nada antes/],
  ['expoente que nao veio', 'x^{2} + y^', /expoente faltando/],
  ['dois expoentes no mesmo termo', '2^3^4', /dois expoentes/],
  ['dois indices no mesmo termo', 'a_1_2', /dois indices/],
  ['& fora de matriz', 'a & b', /& fora de matriz/],
  ['quebra de linha fora de matriz', 'a \\\\ b', /fora de matriz/],
  ['barra invertida solta no fim', 'x + \\', /barra invertida solta/],
  ['\\text sem chave', '\\text abc', /\\text sem \{/],
  ['\\text que nunca fecha', '\\text{abc', /nunca fecha/],
  ['formula dentro de \\text', '\\text{raiz de \\sqrt{2}}', /so cabe texto/],
  ['caractere que o PDF nao desenha', 'a \\approx 3, b ≈ 4', /nao desenha/],
  ['indice de raiz com [ que nunca fecha', '\\sqrt[3{8}', /nunca fecha/]
];

RUINS.forEach(function (caso) {
  const rotulo = caso[0], latex = caso[1], espera = caso[2];
  const m = Formula.medir(latex, 11);
  conf(rotulo + ': avisou', m.avisos.length > 0, true);
  conf(rotulo + ': avisou o que era', espera.test(m.avisos.join(' | ')), true);
  let quebrou = '';
  let d = null;
  try { d = desenhaNoEspiao(latex, 11); } catch (e) { quebrou = e && e.message ? e.message : String(e); }
  conf(rotulo + ': desenhar nao explode', quebrou, '');
  if (!d) return;
  conf(rotulo + ': a folha continua com algo legivel',
    d.esp.textos.length + d.esp.ops.length + d.esp.linhas.length > 0, true);
  conf(rotulo + ': o desenho avisa o mesmo que a medida', d.r.avisos.length, m.avisos.length);
  /* A marcacao nunca pode sair impressa como se fosse texto normal. O selo de
   * aviso escreve o comando ofensor de proposito, e ele e reconhecivel: sai em
   * negrito, dentro de um retangulo. O que nao pode e barra, chave, circunflexo
   * ou "e comercial" no texto comum da formula. */
  const vazados = d.esp.textos.filter(function (t) {
    return !t.o.bold && /[\\{}^&]/.test(t.txt);
  }).map(function (t) { return t.txt; });
  conf(rotulo + ': nao imprimiu marcacao como texto normal', vazados.join(' '), '');
  conf(rotulo + ': desenhou o selo de aviso', d.esp.retangulos.length > 0, true);
});

{
  /* O contrario tambem tem que valer: formula boa nao acende luz nenhuma, senao
   * o aviso vira ruido e ninguem olha. */
  const boas = ['\\frac{-b \\pm \\sqrt{b^{2}-4ac}}{2a}', '\\sum_{k=1}^{n} \\frac{1}{k(k+1)}',
    '\\begin{bmatrix} \\frac{1}{2} & -1 \\\\ 3 & 5 \\end{bmatrix}',
    '\\left( \\frac{x+1}{2} \\right)^{2}', '\\lim_{x \\to 2} \\frac{x^{2}-4}{x-2}',
    '\\text{area} = \\frac{b \\times h}{2}', '\\sqrt[3]{8} = 2',
    '\\int_{0}^{1} x^{2} \\, dx', 'x \\in A \\cup B', '\\angle ABC = 90^{\\circ}',
    'f(x) = \\lambda x + \\mu', '\\left\\{ x \\; | \\; x \\geq \\frac{1}{2} \\right\\}'];
  let acenderam = [];
  boas.forEach(function (b) {
    const m = Formula.medir(b, 11);
    if (m.avisos.length) acenderam.push(b + ' -> ' + m.avisos[0]);
    const d = desenhaNoEspiao(b, 11);
    if (d.esp.retangulos.length) acenderam.push(b + ' -> desenhou selo sem motivo');
  });
  conf('formula boa nao avisa nada e nao ganha selo', acenderam.join(' | '), '');
}
{
  /* A matriz torta continua matriz: a celula que faltava vira selo, e nao some,
   * senao a aluna le uma matriz 2 por 2 onde o autor quis 2 por 3. */
  const a = Formula.analisar('\\begin{bmatrix} 1 & 2 & 3 \\\\ 4 & 5 \\end{bmatrix}');
  const m = a.filhos[0];
  conf('a linha curta foi completada', m.linhas[1].length, 3);
  conf('e a celula que faltava e um erro, e nao um vazio',
    m.linhas[1][2].filhos[0].tipo, 'erro');
}
{
  const a = Formula.analisar('\\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\\\ \\end{bmatrix}');
  conf('o \\\\ antes do \\end nao cria linha vazia', a.filhos[0].linhas.length, 2);
  conf('e nao avisa nada por isso', a.avisos.length, 0);
}
{
  /* Entrada que nao e string nao pode derrubar quem gera a folha. */
  let quebrou = '';
  try {
    Formula.medir(null, 11); Formula.medir(undefined, 11);
    Formula.medir(12, 11); Formula.desenhar(espiao(), '', 0, 0, 11);
  } catch (e) { quebrou = e && e.message ? e.message : String(e); }
  conf('null, undefined, numero e vazio nao explodem', quebrou, '');
}

// ================================================================
secao('7. Um teste para cada defeito que a refutacao achou');

/* Tudo daqui para baixo nasceu de um defeito real, achado por quem refutou o
 * arquivo com a folha impressa na mao. O teste fica aqui para o defeito nao
 * voltar: neste projeto ja voltou duas vezes.
 *
 * Cada bloco cita o que acontecia ANTES, porque um teste que so diz "tem que
 * ser 7.44" nao explica a ninguem por que 7.44 importa. */

function selos(e) { return e.retangulos.length; }
function normais(e) {
  return e.textos.filter(function (t) { return !t.o.bold; }).map(function (t) { return t.txt; });
}
function marcados(e) {
  return e.textos.filter(function (t) { return t.o.bold; }).map(function (t) { return t.txt; });
}
function pontosDeOps(ops) {
  const p = [];
  ops.join(' ').replace(/(-?[\d.]+) (-?[\d.]+) [ml]/g, function (_, a, b) {
    p.push([Number(a), Number(b)]); return '';
  });
  return p;
}
function penaMaxima(ops) {
  let w = 0;
  ops.forEach(function (s) {
    const m = /([\d.]+) w/.exec(s);
    if (m && Number(m[1]) > w) w = Number(m[1]);
  });
  return w;
}
function avisou(latex, re, tam, opcoes) {
  return re.test(Formula.medir(latex, tam || 11, opcoes).avisos.join(' | '));
}
function todos(latex, tam) {
  const m = Formula.medir(latex, tam || 11);
  const d = desenhaNoEspiao(latex, tam || 11);
  return { avisos: m.avisos.join(' | '), esp: d.esp, r: d.r };
}

{
  /* Toda tabela deste arquivo e objeto literal e herda o Object.prototype.
   * Consultada com colchete cru, OP_GRANDE['toString'] devolvia a funcao
   * herdada: "\toString" passava por comando conhecido e a palavra "toString"
   * saia impressa na folha, em peso normal, sem aviso e sem selo. */
  const herdados = ['constructor', 'toString', 'valueOf', 'hasOwnProperty',
    'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString'];
  let calados = [], vazados = [];
  herdados.forEach(function (n) {
    const c = todos('\\' + n);
    if (!/comando desconhecido/.test(c.avisos)) calados.push('\\' + n + ' sem aviso');
    if (!selos(c.esp)) calados.push('\\' + n + ' sem selo');
    if (normais(c.esp).join(' ').indexOf(n) >= 0) vazados.push('\\' + n);
  });
  conf('nome herdado do Object.prototype nao passa por comando conhecido', calados.join(' | '), '');
  conf('e nunca sai impresso como texto normal', vazados.join(' | '), '');
}
{
  /* As quatro outras tabelas consultadas com colchete cru, uma por uma. */
  conf('nome herdado no numerador de \\frac avisa',
    avisou('\\frac{\\toString}{2}', /comando desconhecido/), true);
  const t = todos('\\text{a \\constructor b}');
  conf('nome herdado dentro de \\text nao imprime "undefined" na folha',
    normais(t.esp).join('').indexOf('undefined'), -1);
  conf('e avisa em vez de emendar na palavra', /so cabe texto/.test(t.avisos), true);
  const d = todos('\\left\\constructor x + 1 \\right\\constructor');
  conf('nome herdado como delimitador avisa em vez de sumir',
    /delimitador que nao existe/.test(d.avisos), true);
  conf('e ganha selo', selos(d.esp) > 0, true);
  const a = todos('\\begin{constructor}1 & 2\\end{constructor}');
  conf('nome herdado como ambiente avisa que ele nao existe',
    /ambiente fora do subconjunto/.test(a.avisos), true);
  conf('e ganha selo tambem', selos(a.esp) > 0, true);
}
{
  /* Os caracteres reservados do LaTeX. A Helvetica desenha todos, entao a trava
   * do pdf.js aprovava e eles iam para a folha em peso normal: o cifrao ao lado
   * da conta, e o "%" levando junto o resto da linha, que no TeX sumiria. */
  const casos = [['$\\frac{1}{2}$', '$'], ['x = 2 % resposta', '%'],
    ['\\frac{#1}{2}', '#'], ['f~(x)', '~']];
  let calados = [], vazados = [];
  casos.forEach(function (c) {
    const r = todos(c[0]);
    if (!/caractere reservado/.test(r.avisos)) calados.push(c[0] + ' sem aviso');
    if (!selos(r.esp)) calados.push(c[0] + ' sem selo');
    if (normais(r.esp).join('').indexOf(c[1]) >= 0) vazados.push(c[0]);
  });
  conf('caractere reservado do LaTeX avisa e ganha selo', calados.join(' | '), '');
  conf('e nenhum deles sai desenhado em peso normal', vazados.join(' | '), '');
  conf('o aviso do cifrao diz o que fazer', avisou('$x^{2}$', /tire os cifroes/), true);
  conf('e o do porcento lembra do \\%', avisou('x = 2 % resposta', /comentario no LaTeX/), true);
  conf('ja o \\% escapado desenha o sinal e nao avisa nada',
    Formula.medir('50\\%', 11).avisos.length, 0);
}
{
  /* "\end" pelado fechava o ambiente em silencio total: a matriz saia impecavel
   * na folha e nada dizia que faltava o {bmatrix}. Era o unico defeito de
   * ambiente que escapava inteiro. */
  const p = todos('\\begin{bmatrix}1 & 2\\end');
  conf('\\end sem o { nome } avisa', /\\end sem o \{ nome \}/.test(p.avisos), true);
  conf('e ganha selo', selos(p.esp) > 0, true);
  const s = todos('\\begin{bmatrix}1\\end bmatrix');
  conf('\\end sem as chaves avisa que faltaram as chaves',
    /escrito sem as chaves/.test(s.avisos), true);
  conf('e o nome do ambiente nao escapa para a folha como palavra',
    normais(s.esp).join(' ').indexOf('bmatrix'), -1);
  const x = desenhaNoEspiao('\\end x + 1', 11);
  conf('mas o que vem depois de um \\end orfao continua sendo conta',
    normais(x.esp).join(''), 'x+1');
}
{
  /* A chave final esquecida, que e o erro de digitacao mais comum de todos. O
   * aviso saia e o selo nao: era o unico caso em que o defeito aparecia num
   * lugar so, e quem olhasse a folha via uma matriz limpa. */
  const c = todos('\\begin{bmatrix}1 & 2\\end{bmatrix');
  conf('nome de ambiente com { que nunca fecha avisa', /nunca fecha/.test(c.avisos), true);
  conf('e ganha selo, e nao so o aviso', selos(c.esp) > 0, true);
}
{
  /* "1 + \frac{}{} + 2" desenhava a barra da fracao vazia na altura do eixo,
   * que e exatamente onde mora o sinal de menos: a folha saia com "1 + - + 2". */
  const f = todos('1 + \\frac{}{} + 2');
  conf('\\frac{}{} avisa numerador vazio', /numerador de \\frac vazio/.test(f.avisos), true);
  conf('e denominador vazio', /denominador de \\frac vazio/.test(f.avisos), true);
  conf('e ganha selo, para o traco nao se ler como menos', selos(f.esp) > 0, true);
  const r = todos('1 + \\sqrt{} + 2');
  conf('\\sqrt{} avisa radicando vazio', /radicando de \\sqrt vazio/.test(r.avisos), true);
  conf('e ganha selo', selos(r.esp) > 0, true);
}
{
  /* Aninhamento fundo estourava a pilha e o RangeError subia por medir() e por
   * desenhar() sem tratamento, derrubando a geracao da FOLHA INTEIRA em vez de
   * sair um selo naquela conta. */
  const fundos = [['2000 chaves', '{'.repeat(2000)],
    ['1800 fracoes', '\\frac{1}{'.repeat(1800)],
    ['2600 \\left(', '\\left('.repeat(2600)],
    ['1500 \\begin', '\\begin{bmatrix}'.repeat(1500)]];
  let quebrou = [], calados = [];
  fundos.forEach(function (c) {
    try {
      const m = Formula.medir(c[1], 11);
      if (!m.avisos.length) calados.push(c[0] + ' sem aviso');
      const d = desenhaNoEspiao(c[1], 11);
      if (!selos(d.esp)) calados.push(c[0] + ' sem selo');
    } catch (e) { quebrou.push(c[0] + ': ' + (e && e.message ? e.message : e)); }
  });
  conf('aninhamento fundo nao joga excecao para fora de medir nem de desenhar',
    quebrou.join(' | '), '');
  conf('e vira aviso mais selo, como toda entrada torta', calados.join(' | '), '');
  conf('o aviso diz que a formula esta funda demais',
    avisou('\\frac{1}{'.repeat(200), /fundo demais/), true);
  conf('e os 10 niveis que o pedido exige continuam limpos',
    Formula.medir('\\frac{1}{'.repeat(10) + '2' + '}'.repeat(10), 11).avisos.length, 0);
}
{
  /* O "_" nao tem bruto e sumia do nome do ambiente: o aviso dizia
   * "smallmatrix" e quem fosse procurar "small_matrix" no tema nao achava. */
  conf('o nome do ambiente chega no aviso como foi digitado',
    avisou('\\begin{small_matrix}1\\end{small_matrix}', /small_matrix/), true);
}
{
  /* Dois defeitos diferentes recebiam o mesmo selo ilegivel, "??", porque o
   * token de pontuacao nao tinha bruto para se identificar. */
  const a = desenhaNoEspiao('\\text{a & b}', 11);
  const b = desenhaNoEspiao('\\text{a^b}', 11);
  conf('o selo do & dentro do \\text diz que foi o &', marcados(a.esp).join(' '), '&?');
  conf('e o do ^ diz que foi o ^', marcados(b.esp).join(' '), '^?');
}
{
  /* Codigo de controle e NUL atravessavam sem aviso e iam crus para dentro da
   * string do fluxo de conteudo. E o emoji virava dois avisos com codigos que
   * nao existem, "U+D83D" e "U+DE42", que sao metades de par substituto. */
  conf('o NUL nao atravessa calado',
    avisou('a' + String.fromCharCode(0) + 'b', /U\+0000/), true);
  conf('o U+0001 tambem nao',
    avisou('a' + String.fromCharCode(1) + 'b', /U\+0001/), true);
  const emoji = Formula.medir('x = \u{1F642}', 11).avisos.join(' ');
  conf('o emoji vira UM codepoint, e nao duas metades de par substituto',
    /U\+1F642/.test(emoji) && !/U\+D83D/.test(emoji), true);
  conf('e o espaco de largura zero continua sendo pego', avisou('a​b', /U\+200B/), true);
}
{
  /* A Regra 18a do Appendix G: "If the translation of the nucleus is a character
   * box ... set u and v equal to zero". A conta antiga era a da base que e
   * CAIXA, aplicada tambem a caractere, e os expoentes ficavam em degrau: 0.42
   * ponto entre o "2" de "a" e o de "b" no meio da identidade de Pitagoras, e
   * 1.45 ponto entre "a_1" e "p_1" por causa da perna do "p". */
  const d = desenhaNoEspiao('a^{2} + b^{2} = c^{2}', 11);
  const ys = d.esp.textos.filter(function (t) { return t.txt === '2'; }).map(function (t) { return t.y; });
  conf('os tres expoentes de Pitagoras ficam na MESMA linha', ys.length + ' ' +
    (Math.max.apply(null, ys) - Math.min.apply(null, ys) < 0.001), '3 true');
  conf('e na linha que o TeX manda, o sup1',
    Math.abs((ys[0] - 400) - 11 * 0.412892) < 0.01, true);
  const i = desenhaNoEspiao('a_{1} + b_{1} + p_{1}', 11);
  const yi = i.esp.textos.filter(function (t) { return t.txt === '1'; }).map(function (t) { return t.y; });
  conf('e os tres indices tambem, mesmo com a perna do "p"', yi.length + ' ' +
    (Math.max.apply(null, yi) - Math.min.apply(null, yi) < 0.001), '3 true');
  conf('base que e CAIXA continua olhando a altura dela, que e a outra metade da regra',
    Formula.medir('\\frac{1}{2}^{2}', 11).altura > Formula.medir('a^{2}', 11).altura, true);
}
{
  /* "\mp" saia com o MESMO glifo do "\pm": nao virava interrogacao nem selo,
   * virava OUTRO simbolo, que e pior porque ninguem nota. Uma raiz que era
   * "a \mp b" saia impressa como "a \pm b" e o sinal da resposta invertia. */
  const pm = desenhaNoEspiao('a \\pm b', 11);
  const mp = desenhaNoEspiao('a \\mp b', 11);
  conf('\\pm sai com o glifo da fonte', pm.esp.textos.map(function (t) { return t.txt; }).join('').indexOf('±') >= 0, true);
  conf('e o \\mp NAO sai com o mesmo desenho', mp.esp.textos.map(function (t) { return t.txt; }).join('').indexOf('±'), -1);
  conf('e sim desenhado a traco', mp.esp.ops.length > 0, true);
  conf('e nenhum dos dois avisa nada', pm.r.avisos.length + mp.r.avisos.length, 0);
}
{
  /* "\subseteq" apontava para o desenho do "\subset", e a diferenca entre
   * contido e contido ou igual e o proprio exercicio de conjuntos do 1o ano. E
   * "\circ" saia como sinal de GRAU: quem corrigisse a lista lia "f grau g". */
  const sub = desenhaNoEspiao('A \\subset B', 11);
  const sube = desenhaNoEspiao('A \\subseteq B', 11);
  conf('\\subseteq nao e o mesmo desenho do \\subset',
    sub.esp.ops.join('') === sube.esp.ops.join(''), false);
  const circ = desenhaNoEspiao('f \\circ g', 11);
  conf('\\circ nao sai como sinal de grau',
    circ.esp.textos.map(function (t) { return t.txt; }).join('').indexOf('°'), -1);
  conf('e sim desenhado', circ.esp.ops.length > 0, true);
}
{
  /* Regra 15a: a barra tem EXATAMENTE a largura do maior dos dois andares, e a
   * folga lateral fica FORA dela. A barra ia de ponta a ponta de uma beirada de
   * 0.30 do corpo: em corpo 16 sobravam 7.68 pontos de traco, 86 por cento a
   * mais que o conteudo. */
  const d = desenhaNoEspiao('\\frac{1}{2}', 16);
  const barra = d.esp.linhas[0].x2 - d.esp.linhas[0].x1;
  conf('a barra da fracao tem a largura do conteudo, e nao mais',
    Math.abs(barra - PDFGen.medir('1', 16)) < 0.01, true);
  conf('e a folga lateral e o \\nulldelimiterspace, que e pequeno',
    Formula.medir('\\frac{1}{2}', 16).largura - barra < 16 * 0.30, true);
  const e = desenhaNoEspiao('\\frac{a+b}{2}', 16);
  conf('e numa fracao mais larga a barra acompanha o numerador',
    Math.abs((e.esp.linhas[0].x2 - e.esp.linhas[0].x1) - Formula.medir('a+b', 16).largura) < 0.01, true);
}
{
  /* Regra 15b: a subida sai do num1 e a descida do denom1, e a fracao e
   * assimetrica de proposito. A conta antiga usava 0.20 do corpo fixo dos dois
   * lados, e o numerador ficava 33 por cento mais baixo que no TeX. */
  const d = desenhaNoEspiao('\\frac{1}{2}', 11);
  const num = d.esp.textos.filter(function (t) { return t.txt === '1'; })[0];
  const den = d.esp.textos.filter(function (t) { return t.txt === '2'; })[0];
  conf('o numerador sobe o num1 do TeX', Math.abs((num.y - 400) - 11 * 0.676508) < 0.01, true);
  conf('e o denominador desce o denom1', Math.abs((400 - den.y) - 11 * 0.685951) < 0.01, true);
  conf('e a fracao e assimetrica, como no TeX', (num.y - 400) === (400 - den.y), false);
}
{
  /* A escada de estilo da Regra 15a. A tabela antiga saturava e TRES niveis
   * saiam com o mesmo corpo: sumia a hierarquia que a fracao aninhada precisa. */
  const d = desenhaNoEspiao('\\frac{\\frac{\\frac{\\frac{1}{2}}{3}}{4}}{5}', 11);
  const corpo = {};
  d.esp.textos.forEach(function (t) { corpo[t.txt] = t.o.tam; });
  conf('display e texto valem o mesmo corpo', corpo['5'].toFixed(2), '11.00');
  conf('do segundo nivel em diante cai para script', corpo['4'].toFixed(2), '7.70');
  conf('e depois para scriptscript', corpo['3'].toFixed(2), '5.50');
  conf('que e onde para de encolher', corpo['2'].toFixed(2), '5.50');
}
{
  /* No TeX a barra da fracao e a barra da raiz sao a mesma
   * default_rule_thickness. Aqui eram calculadas em dois lugares e saiam
   * diferentes: numa fracao com raiz no numerador as duas linhas apareciam
   * empilhadas, a de cima 22 por cento mais grossa. */
  const d = desenhaNoEspiao('\\frac{\\sqrt{2}}{3}', 11);
  const espFrac = d.esp.linhas[0].esp;
  let igual = false;
  d.esp.ops.forEach(function (s) {
    const m = /([\d.]+) w/.exec(s);
    if (m && Math.abs(Number(m[1]) - espFrac) < 0.02) igual = true;
  });
  conf('a barra da raiz tem a mesma espessura da barra da fracao', igual, true);
}
{
  /* Com largura fixa o gancho da raiz virava uma espicula: a razao altura sobre
   * largura do V ia de 2.50 num "\sqrt{2}" a 9.75 numa raiz de fracao de
   * fracao, e na folha o V lia como um risco vertical. */
  function razaoDoV(latex) {
    const d = desenhaNoEspiao(latex, 16);
    const p = pontosDeOps([d.esp.ops[0]]);
    const xs = p.map(function (q) { return q[0]; }), ys = p.map(function (q) { return q[1]; });
    return (Math.max.apply(null, ys) - Math.min.apply(null, ys)) /
      (Math.max.apply(null, xs) - Math.min.apply(null, xs));
  }
  conf('a raiz simples mantem a proporcao de sempre', razaoDoV('\\sqrt{2}') < 3, true);
  conf('e o gancho engorda quando o radicando cresce',
    razaoDoV('\\sqrt{\\frac{\\frac{1}{2}}{\\frac{3}{4}}}') < 5, true);
}
{
  /* Regra 13: a folga entre o sinal e o limite e max(xi9, xi11 - d), e nao um
   * numero fixo. Com 0.16 do corpo o "n" encostava no topo do sigma. */
  const d = desenhaNoEspiao('\\sum_{k=1}^{n} \\frac{1}{k(k+1)}', 11);
  const n = d.esp.textos.filter(function (t) { return t.txt === 'n'; })[0];
  const ys = pontosDeOps([d.esp.ops[0]]).map(function (q) { return q[1]; });
  conf('o limite de cima nao encosta no sigma',
    (n.y - Math.max.apply(null, ys)) >= 11 * 0.2 - 0.01, true);
}
{
  /* No TeX o "\left(" em volta de conteudo pequeno devolve EXATAMENTE o
   * parentese de tamanho normal. Aqui ele era sempre desenhado, e dava para ver
   * os dois pesos lado a lado na mesma expressao. */
  const a = Formula.medir('\\left( x \\right)', 11).largura;
  const b = Formula.medir('(x)', 11).largura;
  conf('\\left( em volta de conteudo baixo e o parentese da fonte',
    Math.abs(a - b) < 0.001, true);
  conf('e nao um traco desenhado', desenhaNoEspiao('\\left( x \\right)', 11).esp.ops.length, 0);
  conf('mas em volta de fracao ele volta a ser desenhado, para poder crescer',
    desenhaNoEspiao('\\left( \\frac{a}{b} \\right)', 11).esp.ops.length > 0, true);
}
{
  /* O cases alinha pela esquerda no LaTeX. Centrado, o "x" da segunda equacao
   * saia deslocado em relacao ao da primeira, e e por esse alinhamento que a
   * aluna confere a conta num sistema linear. */
  const d = desenhaNoEspiao('\\begin{cases} x + y = 3 \\\\ x - y = 1 \\end{cases}', 11);
  const xs = d.esp.textos.filter(function (t) { return t.txt.charAt(0) === 'x'; })
    .map(function (t) { return t.x; });
  conf('o cases alinha as duas equacoes pela esquerda',
    xs.length + ' ' + (Math.abs(xs[0] - xs[1]) < 0.001), '2 true');
  const m = desenhaNoEspiao('\\begin{bmatrix} 1 & 2 \\\\ 333 & 4 \\end{bmatrix}', 11);
  const c = m.esp.textos.filter(function (t) { return t.txt === '1' || t.txt === '333'; })
    .map(function (t) { return t.x; });
  conf('e a matriz continua centrando a coluna', Math.abs(c[0] - c[1]) > 0.5, true);
}
{
  /* O travessao e a meia risca existem no CP1252 e a Helvetica desenha os dois,
   * entao a trava do pdf.js aprovava. A regra da casa proibe travessao em tudo
   * o que a aluna ve, e este arquivo e o ultimo ponto onde da para pegar. */
  conf('a meia risca colada do Word avisa', avisou('a – b', /U\+2013/), true);
  conf('e o travessao dentro do \\text tambem', avisou('\\text{de 1 — 5}', /U\+2014/), true);
  conf('e nenhum dos dois sai desenhado',
    normais(desenhaNoEspiao('a – b', 11).esp).join('').indexOf('–'), -1);
}
{
  /* O Omega do espaco amostral e conteudo do subconjunto declarado (probabilidade
   * do 2o ano) e saia com selo de comando desconhecido no meio do denominador. */
  const m = Formula.medir('P(A) = \\frac{n(A)}{n(\\Omega)}', 11);
  conf('o \\Omega da probabilidade nao e mais comando desconhecido', m.avisos.length, 0);
  const d = desenhaNoEspiao('\\Omega', 11);
  conf('ele e desenhado, e nao emitido para virar interrogacao', d.esp.ops.length > 0, true);
  conf('e nao ganha selo', selos(d.esp), 0);
}
{
  /* Formula mais larga que a coluna saia cortada pelo canto do papel, com zero
   * avisos. Centralizada era pior: comecava em x negativo, fora da folha. */
  const longa = 'x = \\frac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a} = ' +
    '\\frac{-5 \\pm \\sqrt{25 - 4 \\cdot 2 \\cdot 3}}{2 \\cdot 2} = ' +
    '\\frac{-5 \\pm \\sqrt{1}}{4} \\Rightarrow x_{1} = -1 \\quad \\text{e} \\quad ' +
    'x_{2} = -\\frac{3}{2} \\quad \\text{e a soma das raizes vale } ' +
    'x_{1} + x_{2} = -\\frac{b}{a} = -\\frac{5}{2}';
  const m = Formula.medir(longa, 11);
  conf('a formula mais larga que a coluna avisa', /nao cabe na largura/.test(m.avisos.join(' ')), true);
  conf('e ela e mesmo mais larga que a coluna util', m.largura > PDFGen.UTIL, true);
  conf('quem desenha numa caixa mais estreita passa a largura dela',
    avisou('\\frac{1}{2}', /nao cabe na largura/, 30, { larguraMaxima: 5 }), true);
  conf('e a formula que cabe continua sem avisar nada',
    Formula.medir('\\frac{1}{2}', 11).avisos.length, 0);
  conf('e quem ja confere a largura sozinho desliga a conferencia',
    Formula.medir(longa, 11, { larguraMaxima: 0 }).avisos.length, 0);
}
{
  /* Formula mais alta do que a sobra da pagina imprimia por cima do rodape e
   * escorria para fora da folha, tambem sem aviso. */
  const alta = '\\begin{bmatrix} \\frac{1}{2} & \\frac{3}{4} \\\\ ' +
    '\\sqrt{2} & \\frac{7}{8} \\end{bmatrix}';
  const r = Formula.desenhar(espiao(), alta, 60, PDFGen.Y_LIMITE + 6, 11);
  conf('a formula que passa do fim do conteudo avisa',
    /passa do fim do conteudo/.test(r.avisos.join(' ')), true);
  conf('e no meio da pagina ela nao avisa nada',
    Formula.desenhar(espiao(), alta, 60, 400, 11).avisos.length, 0);
  const c = Formula.cabe({ y: PDFGen.Y_LIMITE + 6 }, alta, 11);
  conf('e da para perguntar ANTES, com cabe()', c.cabe, false);
  conf('que responde quanto ela precisa contra quanto sobra', c.precisa > c.sobra, true);
  conf('e diz que sim quando a pagina inteira esta livre',
    Formula.cabe({ y: PDFGen.Y_TOPO }, alta, 11).cabe, true);
}
{
  /* "base: tam || 11" salvava 0 e NaN mas deixava passar a STRING: tamDe()
   * devolvia NaN, que descia ate doc.linha e saia escrito no fluxo do PDF como
   * "NaN NaN m", que nao e operando valido de PDF nenhum. */
  const e = espiao();
  const r = Formula.desenhar(e, '\\frac{1}{2}', 100, 400, 'grande');
  conf('corpo que nao e numero avisa', /corpo invalido/.test(r.avisos.join(' ')), true);
  conf('e a largura nao sai NaN', isNaN(r.largura), false);
  const fluxo = e.ops.join(' ') + ' ' + e.linhas.map(function (l) {
    return l.x1 + ' ' + l.y1 + ' ' + l.x2 + ' ' + l.y2;
  }).join(' ');
  conf('e nenhum NaN chega ao fluxo de conteudo', fluxo.indexOf('NaN'), -1);
  conf('corpo negativo tambem avisa, em vez de imprimir miudo e calado',
    avisou('1', /corpo invalido/, -5), true);
  conf('mas o corpo bom continua calado', Formula.medir('1', 11).avisos.length, 0);
}
{
  /* String(objeto) da "[object Object]", e a Helvetica desenha os colchetes e as
   * letras: a trava de caractere aprovava e a folha da aluna recebia a palavra. */
  conf('objeto no lugar da formula avisa',
    /nao e texto/.test(Formula.medir({}, 11).avisos.join(' ')), true);
  conf('numero tambem', /nao e texto/.test(Formula.medir(12, 11).avisos.join(' ')), true);
  conf('e formula ausente avisa que faltou',
    /formula ausente/.test(Formula.medir(null, 11).avisos.join(' ')), true);
  conf('mas a string vazia e vazia mesmo, e nao avisa', Formula.medir('', 11).avisos.length, 0);
}
{
  /* medir() e desenhar() constroem cada um o seu registro e chamam montar() de
   * novo, e o proprio arquivo instrui quem chama a medir antes de desenhar: o
   * caminho recomendado registrava cada defeito duas vezes, e uma trava que
   * conta avisos contava o dobro. */
  const doc = espiao();
  const vistos = [];
  doc.avisoDeFigura = function (m) { vistos.push(m); };
  Formula.medir('\\raizz{9}', 11, { doc: doc });
  Formula.desenhar(doc, '\\raizz{9}', 100, 400, 11);
  conf('medir antes de desenhar nao registra o defeito duas vezes no doc',
    doc.avisosFormula.length, 1);
  conf('e a trava de figura tambem recebe uma vez so', vistos.length, 1);
  Formula.desenhar(doc, '\\naoexiste{2}', 100, 400, 11);
  conf('mas um defeito DIFERENTE continua entrando', doc.avisosFormula.length, 2);
  /* Em "$x^{2}$" os dois cifroes geram mensagens de texto IDENTICO, porque o
   * trecho citado e a formula inteira nos dois casos. Sao dois defeitos de
   * verdade, em lugares diferentes, e nenhum dos dois pode ser engolido pela
   * juncao de avisos repetidos. */
  const outro = espiao();
  Formula.desenhar(outro, '$x^{2}$', 100, 400, 11);
  conf('e dois defeitos iguais em lugares diferentes contam os dois',
    outro.avisosFormula.length, 2);
}
{
  /* A tinta e pintada metade para cada lado da linha de centro do traco, e nem
   * cercar(), nem a raiz, nem os glifos contavam essa metade: o desvio era
   * sistematico e sempre para fora, e duas formulas coladas encostavam. E a
   * terceira promessa do cabecalho, medir e desenhar batendo. */
  const casos = [['\\left( \\frac{a}{b} \\right)', 11], ['\\sqrt{2}', 11], ['\\sqrt{2}', 20],
    ['\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}', 11], ['a \\to b', 11],
    ['x \\in A \\cup B', 11], ['\\sum_{k=1}^{n} k', 11]];
  let fora = [];
  casos.forEach(function (c) {
    const e = espiao();
    Formula.desenhar(e, c[0], 0, 0, c[1]);
    const m = Formula.medir(c[0], c[1]);
    const p = pontosDeOps(e.ops);
    if (!p.length) return;
    const meia = penaMaxima(e.ops) / 2;
    const xs = p.map(function (q) { return q[0]; }), ys = p.map(function (q) { return q[1]; });
    if (Math.max.apply(null, ys) + meia > m.altura + 0.01) fora.push(c[0] + ' @' + c[1] + ' topo');
    if (Math.min.apply(null, ys) - meia < -m.profundidade - 0.01) fora.push(c[0] + ' @' + c[1] + ' fundo');
    if (Math.max.apply(null, xs) + meia > m.largura + 0.01) fora.push(c[0] + ' @' + c[1] + ' direita');
    if (Math.min.apply(null, xs) - meia < -0.01) fora.push(c[0] + ' @' + c[1] + ' esquerda');
  });
  conf('a tinta do traco nao passa da caixa que medir() prometeu', fora.join(' | '), '');
}

// ================================================================
console.warn = warnDeVerdade;
console.log('\n' + '='.repeat(60));
console.log(passes + ' verificacoes passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(function (e) { console.log(' - ' + e); }); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
