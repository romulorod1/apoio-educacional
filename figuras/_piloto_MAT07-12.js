/* figuras/_piloto_MAT07-12.js
 * Gera os tres documentos do MAT07-12, "Triangulos e quadrilateros", pelo
 * caminho de verdade: o gerarMaterialTema do pdf.js, lendo o tema do
 * temas/banco.json, que e o mesmo arquivo que o tablet consome.
 *
 * Nao ha atalho aqui de proposito. Um gerador proprio de folha de prova
 * desenharia as figuras certas e nao provaria a unica coisa que esta etapa
 * precisa provar: que a diretiva sobrevive ao percurso inteiro, do .md ao
 * gerar_banco.py, do JSON ao partesDeFigura, do medirItem a reserva do bloco e
 * do enunciado a camada de gabarito chamada pelo id.
 *
 * Sai em quatro arquivos, tres em portugues e um em ingles. O ingles existe
 * porque a quebra bilingue e silenciosa por definicao: uma palavra portuguesa
 * presa dentro de um desenhador nao aparece em nenhuma conferencia de conta, so
 * na folha impressa em ingles.
 *
 * Regra da casa: nunca usar travessao.
 */
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');

const RAIZ = path.join(__dirname, '..');
const banco = JSON.parse(fs.readFileSync(path.join(RAIZ, 'temas', 'banco.json'), 'utf8'));
const tema = banco.temas.find(function (t) { return t.id === 'MAT07-12'; });
if (!tema) throw new Error('MAT07-12 nao esta no banco.json: rode gerar_banco.py antes');

console.log('tema: ' + tema.pt.titulo + '  |  ' + tema.pt.exercicios.length + ' exercicios');

/* ================================================================ os documentos */

function gerar(nome, op) {
  const bytes = PDFGen.gerarMaterialTema(Object.assign({ tema: tema }, op));
  const saida = path.join(__dirname, nome);
  fs.writeFileSync(saida, bytes);
  console.log('  ' + nome + ': ' + Math.round(bytes.length / 1024) + ' KB');
  return bytes;
}

const material = gerar('_piloto_MAT07-12_material.pdf', {
  lingua: 'pt', incluirMaterial: true, incluirLista: true, incluirGabarito: true,
  aluno: 'Nathália', data: '02/09/2026'
});
/* A lista sai sozinha, com espaco para responder, que e o formato que ela leva
 * para a mesa. E o caso em que a figura tem que se sustentar sem a explicacao ao
 * lado: se um exercicio so fica legivel depois de ler o material, a figura dele
 * esta errada. */
const lista = gerar('_piloto_MAT07-12_lista.pdf', {
  lingua: 'pt', incluirLista: true, aluno: 'Nathália', espacoParaResposta: 26
});
/* O gabarito sozinho e o teste da camada de resposta pelo id: sem a lista na
 * frente, o "@fig id=q10 fase=gabarito" so acha a receita de origem porque o
 * gerarMaterialTema varre os enunciados antes de escrever qualquer coisa. */
const gabarito = gerar('_piloto_MAT07-12_gabarito.pdf', {
  lingua: 'pt', incluirGabarito: true
});
const ingles = gerar('_piloto_MAT07-12_en.pdf', {
  lingua: 'en', incluirMaterial: true, incluirLista: true, incluirGabarito: true
});

/* ================================================================ conferencias
 *
 * A folha e o gate desta etapa, e nenhuma trava abaixo substitui olhar cada
 * pagina. Estas pegam o que o olho nao pega: diretiva impressa como texto, q sem
 * Q, tracejado ligado fora de envelope e figura que nao chegou a ser desenhada. */

let ok = 0, mau = 0;
function conf(rotulo, obtido, esperado) {
  const bom = String(obtido) === String(esperado);
  if (bom) ok++; else mau++;
  console.log((bom ? '  OK    ' : '  FALHA ') + rotulo +
    (bom ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}

console.log('\nconferencias');

/* A mais importante: o fluxo de conteudo nao e comprimido, entao uma diretiva
 * impressa apareceria aqui dentro de um (...) Tj. O tema nao escreve a marcacao
 * por extenso em lugar nenhum, entao qualquer ocorrencia e defeito. */
[['material', material], ['lista', lista], ['gabarito', gabarito], ['ingles', ingles]]
  .forEach(function (par) {
    const cru = Buffer.from(par[1]).toString('latin1');
    conf('nenhuma diretiva saiu impressa no ' + par[0], /@fig/.test(cru), false);
  });

/* A trava bilingue, e a que so a folha impressa denunciava ate agora. O fluxo de
 * conteudo nao e comprimido, entao uma palavra portuguesa que tenha nascido
 * DENTRO de um desenhador aparece aqui como texto na folha em ingles. A
 * verificacao com sympy nunca pegaria: ela so confere conta.
 *
 * Foi assim que este piloto achou a unica quebra bilingue que existia: o
 * "Figura fora de escala." que o medidaDoBloco do base.js escreve sozinho quando
 * a figura recebe fora de escala e a diretiva nao trouxe legenda. Enquanto essa
 * frase padrao morar no desenhador, todo tema com figura algebrica precisa
 * escrever legenda= nas duas linguas, que e o que o exercicio 15 faz. */
/* A conferencia e ESTRUTURAL e nao uma lista de palavras escolhida a dedo.
 *
 * A versao anterior era uma lista de quinze palavras, e ela falhou duas vezes
 * pelo mesmo motivo: lista so pega o que quem escreveu ja imaginou. Escapou o
 * "Pagina N de M" do rodape, que saia nas nove paginas da folha inglesa de TODOS
 * os temas, e escapou a glosa "soma" que a receita do quadrilatero passou a
 * escrever. As duas foram achadas por gente olhando a folha impressa, nao pelo
 * teste.
 *
 * Agora varre TODA peca de texto desenhada e recusa marca de portugues, seja
 * ela qual for. Nome proprio e marca nao se traduzem e ficam de fora. */
const NAO_TRADUZ = ['Nathália Wajsenzon', 'APOIO EDUCACIONAL',
  'Nathália Wajsenzon · Apoio Educacional', 'NW'];
const MARCA_PT = /ção|ções|ângul|Página|Aluno|Gabarito|Exercícios|equilát|isósc|escalen|trapéz|losang|paralelogram|soma |graus|ê|õ|ç/;

function pecasDeTexto(bytes) {
  const cru = Buffer.from(bytes).toString('latin1');
  const rx = /Td \(((?:[^()\\]|\\.)*)\) Tj/g;
  let m, o = [];
  while ((m = rx.exec(cru))) o.push(m[1]);
  return o;
}
const vazou = pecasDeTexto(ingles)
  .filter(function (t) { return NAO_TRADUZ.indexOf(t) < 0 && MARCA_PT.test(t); });
conf('nenhuma palavra portuguesa na folha em ingles',
  [...new Set(vazou)].join(', ') || 'nenhuma', 'nenhuma');

/* A trava da trava: se o padrao parasse de achar portugues na folha PORTUGUESA,
 * ele teria virado um teste que passa sempre. */
const achouNoPt = pecasDeTexto(material)
  .filter(function (t) { return NAO_TRADUZ.indexOf(t) < 0 && MARCA_PT.test(t); });
conf('e o mesmo padrao acha portugues na folha em portugues',
  achouNoPt.length >= 10, true);

/* Reexecuta o material com um Doc proprio, para poder olhar o registro de cada
 * figura antes de o finalizar() juntar tudo. */
function comDoc(lingua, op) {
  const doc = new PDFGen.Doc();
  const dados = tema[lingua];
  doc.novaPagina();
  doc.registrarFiguras(dados.explicacao);
  dados.exercicios.forEach(function (ex) { doc.registrarFiguras(ex.enunciado); });
  if (op.material) doc.markdown(dados.explicacao, { tam: 10 });
  dados.exercicios.forEach(function (ex) {
    const partes = doc.partesDeFigura(op.gabarito ? ex.resposta : ex.enunciado);
    partes.forEach(function (p) {
      if (p.tipo === 'figura') doc.figura(p.diretiva, { x: PDFGen.MARG_E + 20, largura: PDFGen.MARG_D - PDFGen.MARG_E - 20 });
    });
  });
  return doc;
}

const docPT = comDoc('pt', { material: true });
const docGab = comDoc('pt', { gabarito: true });
const docEN = comDoc('en', { material: true });

const figs = (docPT.figurasDesenhadas || []).concat(docGab.figurasDesenhadas || []);

/* Cada celula do painel e uma figura PROPRIA, com fundo branco e teto de marcas
 * proprios, entao a contagem de registros nao e a contagem de diretivas: os tres
 * paineis da explicacao valem 11 celulas. A conta abaixo cruza os dois numeros,
 * porque e justamente a diferenca entre eles que denuncia uma celula que nao
 * chegou a ser desenhada. */
const diretivasPT = receitasDe(tema.pt.explicacao).split(' ').filter(function (s) { return s; }).length;
const celulasEsperadas = 11;   // 3 no painel dos lados, 3 no dos angulos, 5 no da familia
const soltasEsperadas = diretivasPT - 3;   // as tres diretivas de painel viram celulas
conf('a explicacao tem tres paineis e ' + soltasEsperadas + ' figuras soltas', diretivasPT, 7);
conf('e as ' + celulasEsperadas + ' celulas dos paineis foram desenhadas',
  (docPT.figurasDesenhadas || []).filter(function (f) { return f.receita === 'painel'; }).length,
  celulasEsperadas);
conf('mais as 6 figuras dos enunciados',
  (docPT.figurasDesenhadas || []).length - celulasEsperadas - soltasEsperadas, 6);
conf('e as 4 do gabarito', (docGab.figurasDesenhadas || []).length, 4);
conf('nenhuma figura falhou', figs.filter(function (f) { return f.erro; }).length, 0);
conf('nenhum aviso de figura no material', (docPT.avisosFigura || []).length, 0);
conf('nenhum aviso de figura no gabarito', (docGab.avisosFigura || []).length, 0);
conf('nenhum aviso de figura na folha em ingles', (docEN.avisosFigura || []).length, 0);

/* O teto de cinco marcas ativas nao e intencao, e restricao: com cerca de quatro
 * itens simultaneos de memoria de trabalho, uma figura com nove numeros nao e
 * dificil, e inutilizavel. Conferido figura a figura, e nao na media. */
let acimaDoTeto = [];
figs.forEach(function (f) {
  if (f.marcasAtivas > 5) acimaDoTeto.push((f.id || f.receita || '?') + ':' + f.marcasAtivas);
});
conf('nenhuma figura passa do teto de cinco marcas ativas', acimaDoTeto.join(', ') || 'nenhuma', 'nenhuma');
console.log('  marcas ativas por figura: ' +
  figs.map(function (f) { return f.marcasAtivas; }).join(' '));

/* As duas linguas recebem as MESMAS receitas na MESMA ordem. A trava vale item a
 * item, e nao no total: trocada a ordem de duas diretivas dentro do mesmo
 * exercicio, o total continua batendo e a folha em ingles sai com a figura do
 * enunciado seguinte. */
function receitasDe(texto) {
  const nomes = [];
  new PDFGen.Doc().partesDeFigura(texto).forEach(function (p) {
    if (p.tipo === 'figura') nomes.push(p.diretiva.receita || ('id:' + p.diretiva.id));
  });
  return nomes.join(' ');
}
let pareado = true;
tema.pt.exercicios.forEach(function (ex, i) {
  const en = tema.en.exercicios[i];
  if (receitasDe(ex.enunciado) !== receitasDe(en.enunciado)) pareado = false;
  if (receitasDe(ex.resposta) !== receitasDe(en.resposta)) pareado = false;
});
conf('as duas linguas usam as mesmas receitas na mesma ordem, item a item', pareado, true);
conf('a explicacao tambem', receitasDe(tema.pt.explicacao), receitasDe(tema.en.explicacao));

/* Um q sem Q recorta ou tracejada o resto da folha, e o sintoma aparece paginas
 * adiante, longe de onde o erro foi cometido. */
[['material', docPT], ['gabarito', docGab], ['ingles', docEN]].forEach(function (par) {
  let desbalanceada = 0, tracejadoAberto = 0;
  (par[1].paginas || []).forEach(function (pag) {
    let nivel = 0, tracejado = false, fundo = 0;
    (pag.ops || []).forEach(function (o) {
      const s = String(o);
      if (/(^|\s)q(\s|$)/.test(s)) nivel++;
      if (/(^|\s)Q(\s|$)/.test(s)) { nivel--; if (nivel === 0) { tracejado = false; } }
      if (/\[[\d\s.]+\]\s+\d+(\.\d+)?\s+d/.test(s)) tracejado = true;
      if (nivel === 0 && tracejado) tracejadoAberto++;
      fundo += 0;
    });
    if (nivel !== 0) desbalanceada++;
  });
  conf('todo q tem o seu Q no ' + par[0], desbalanceada, 0);
  conf('nenhum tracejado ligado fora de envelope no ' + par[0], tracejadoAberto, 0);
});

/* A quantidade de exercicios COM figura no enunciado e uma escolha editorial, e
 * ela precisa continuar visivel quando alguem mexer no tema. Um terco sem figura
 * nenhuma e o piso escrito na especificacao, para o treino de traduzir texto em
 * desenho continuar existindo. */
const comFigura = tema.pt.exercicios.filter(function (e) { return receitasDe(e.enunciado); }).length;
const semNada = tema.pt.exercicios.filter(function (e) {
  return !receitasDe(e.enunciado) && !receitasDe(e.resposta);
}).length;
console.log('\neditorial: ' + comFigura + ' de ' + tema.pt.exercicios.length +
  ' enunciados com figura, ' + semNada + ' exercicios sem figura nenhuma');
conf('pelo menos um terco dos exercicios sem figura nenhuma',
  semNada >= Math.ceil(tema.pt.exercicios.length / 3), true);

console.log('\n' + ok + ' conferencias passaram, ' + mau + ' falharam.');
if ((docPT.avisosFigura || []).length || (docGab.avisosFigura || []).length ||
    (docEN.avisosFigura || []).length) {
  console.log('\navisos registrados:');
  (docPT.avisosFigura || []).forEach(function (a) { console.log('  pt . ' + a); });
  (docGab.avisosFigura || []).forEach(function (a) { console.log('  gb . ' + a); });
  (docEN.avisosFigura || []).forEach(function (a) { console.log('  en . ' + a); });
}
process.exit(mau ? 1 : 0);
