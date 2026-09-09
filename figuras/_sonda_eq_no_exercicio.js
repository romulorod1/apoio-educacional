/* Prova: a diretiva @eq sobrevive DENTRO de um exercicio?
 *
 * Nasceu sonda e virou prova. Como sonda ela mediu o defeito: gerava as folhas
 * por uma copia do MATEM2-04 com @eq no enunciado, na resposta e, como CONTROLE,
 * na explicacao, e contava a string "@eq" no texto extraido. Deu material 3,
 * lista 2, gabarito 1 e explicacao 0. O controle com zero e o que fazia a
 * contagem valer: sem ele, um detector quebrado seria indistinguivel de um
 * detector que nao acha nada.
 *
 * A pergunta valia 33 exercicios indispensaveis. Os dois piores temas do banco
 * (MATEM2-04, 19 indispensaveis, e MATEM2-05, 14) descrevem matriz por extenso
 * porque "nao ha desenho aqui", e o figuras/formula.js desenha bmatrix, pmatrix
 * e vmatrix desde 02/09/2026, com 410 conferencias verdes. Passando a @eq dentro
 * do item, os dois temas custam zero linha de kit.
 *
 * Agora ela AFIRMA, com placar e com codigo de saida. Nao mede opiniao: gera o
 * PDF pelo caminho real (gerarMaterialTema, o mesmo que o tablet chama) e le o
 * texto de volta do proprio PDF, sem depender de ferramenta de fora.
 *
 * Toda contagem de ausencia vem com o par que a sustenta:
 *   . o detector de "@eq" acha "@eq" num texto que tem um, senao "zero
 *     ocorrencias" seria satisfeito por um detector quebrado;
 *   . a folha envenenada tem MAIS traco desenhado que a mesma folha sem as
 *     diretivas, senao "o LaTeX sumiu" seria satisfeito por uma folha em que a
 *     formula simplesmente desapareceu, que e trocar um defeito visivel por um
 *     invisivel;
 *   . e o enunciado continua escrito na folha, senao a formula teria levado o
 *     texto embora junto.
 */

const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');

let passes = 0, falhas = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}

const RAIZ = path.join(__dirname, '..');
const banco = JSON.parse(fs.readFileSync(path.join(RAIZ, 'banco', 'serie-em2.json'), 'utf8'));
const original = banco.temas.filter(function (t) { return t.id === 'MATEM2-04'; })[0];
if (!original) throw new Error('MATEM2-04 nao esta no banco/serie-em2.json');

const MATRIZ = '\\begin{bmatrix} 1 & 2 \\\\ 3 & 5 \\end{bmatrix}';
const TRANSPOSTA = '\\begin{bmatrix} 1 & 3 \\\\ 2 & 5 \\end{bmatrix}';
const TRIANGULO = '@fig triangulo lado=3 lado=4 lado=5';

/* ================================================== o tema envenenado e o limpo
 *
 * Os dois saem da MESMA funcao, e a unica diferenca entre eles e a diretiva.
 * Assim o par de contagens compara folha com folha, e nao folha com lembranca.
 *
 * A diretiva vai colada no fim do enunciado, que e exatamente a forma como o
 * gerar_banco.py entrega uma diretiva escrita em linha propria dentro do item
 * (medido no MATEM3-12, exercicio 8: "... apotema da face. @fig solido id=s8"). */
function preparar(tema, comDiretiva) {
  const t = JSON.parse(JSON.stringify(tema));
  function mais(texto, diretiva) { return comDiretiva ? texto + ' ' + diretiva : texto; }
  ['pt', 'en'].forEach(function (lg) {
    const ex = t[lg].exercicios;
    ex.length = 4;
    /* 1: uma @eq no fim do enunciado. */
    ex[0].enunciado = mais(lg === 'pt'
      ? 'Escreva o elemento da segunda linha e primeira coluna da matriz.'
      : 'Write the element in the second row and first column of the matrix.',
      '@eq A = ' + MATRIZ);
    ex[0].resposta = (lg === 'pt' ? 'O elemento vale 3.' : 'The element is 3.');
    /* 2: a @eq na RESPOSTA, que e o caminho do gabarito. */
    ex[1].enunciado = mais(lg === 'pt' ? 'Determine a transposta da matriz.'
                                       : 'Find the transpose of the matrix.', '@eq ' + MATRIZ);
    ex[1].resposta = mais(lg === 'pt' ? 'A transposta e' : 'The transpose is', '@eq ' + TRANSPOSTA);
    /* 3: DUAS @eq no mesmo item. A segunda so aparece se o fim da primeira for a
     * proxima diretiva, e nao o fim do item. */
    ex[2].enunciado = mais(lg === 'pt' ? 'Compare as duas matrizes.' : 'Compare the two matrices.',
      '@eq ' + MATRIZ + ' @eq ' + TRANSPOSTA);
    ex[2].resposta = (lg === 'pt' ? 'Elas sao transpostas uma da outra.'
                                  : 'They are transposes of each other.');
    /* 4: @eq e @fig no MESMO item, nesta ordem. As duas gramaticas convivem, e a
     * ordem em que aparecem e a ordem em que saem na folha. */
    ex[3].enunciado = mais(lg === 'pt' ? 'Olhe a matriz e depois o triangulo.'
                                       : 'Look at the matrix and then at the triangle.',
      '@eq ' + MATRIZ + ' ' + TRIANGULO);
    ex[3].resposta = (lg === 'pt' ? 'Sao dois objetos diferentes.' : 'They are different objects.');
    /* CONTROLE: uma @eq na EXPLICACAO, que e o caminho que sempre funcionou. Ela
     * e a linha de base da medida: se este caminho quebrar, a contagem de zero
     * nos outros nao quer dizer nada. */
    t[lg].explicacao = comDiretiva ? t[lg].explicacao + '\n\n@eq ' + MATRIZ + '\n'
                                   : t[lg].explicacao;
  });
  return t;
}

const temaVenenoso = preparar(original, true);
const temaLimpo = preparar(original, false);

/* ================================================= o veneno pegou? */
console.log('\n=== o veneno pegou ===');
const brutoVenenoso = JSON.stringify(temaVenenoso);
const brutoLimpo = JSON.stringify(temaLimpo);
conf('o tema envenenado e diferente do limpo', brutoVenenoso !== brutoLimpo, true);
/* Sete por lingua: uma no enunciado 1, uma no enunciado 2, uma na resposta 2,
 * duas no enunciado 3, uma no enunciado 4, e a do CONTROLE na explicacao. */
conf('e ele traz 14 diretivas @eq (7 por lingua)',
  (brutoVenenoso.match(/@eq/g) || []).length, 14);
conf('e 2 diretivas @fig', (brutoVenenoso.match(/@fig/g) || []).length, 2);
conf('e o tema limpo nao traz nenhuma das duas',
  (brutoLimpo.match(/@(eq|fig)/g) || []).length, 0);

/* ================================================= a extracao, pedaco a pedaco */
console.log('\n=== a extracao devolve pedacos com tipo ===');

function partes(texto) { return new PDFGen.Doc().partesDeFigura(texto); }
function tipos(texto) {
  return partes(texto).map(function (p) { return p.tipo; }).join('+');
}

{
  const p = partes('Escreva o elemento. @eq A = ' + MATRIZ);
  conf('texto mais @eq viram dois pedacos', tipos('Escreva o elemento. @eq A = ' + MATRIZ),
    'texto+equacao');
  /* O espaco FAZ PARTE da formula, e e por isso que a @eq nao pode passar pelo
   * fim de diretiva do @fig: parando no primeiro token que nao casa chave=valor,
   * a formula sairia cortada em "A". */
  conf('e a formula chega inteira, com os espacos', p[1] && p[1].latex, 'A = ' + MATRIZ);
  conf('e o texto nao guarda resto da diretiva', p[0] && p[0].valor, 'Escreva o elemento.');
}
conf('duas @eq no mesmo item viram dois pedacos',
  tipos('Compare. @eq ' + MATRIZ + ' @eq ' + TRANSPOSTA), 'texto+equacao+equacao');
conf('e a segunda formula chega inteira',
  partes('Compare. @eq ' + MATRIZ + ' @eq ' + TRANSPOSTA)[2].latex, TRANSPOSTA);
conf('@eq antes de @fig sai nesta ordem',
  tipos('Olhe. @eq ' + MATRIZ + ' ' + TRIANGULO), 'texto+equacao+figura');
conf('@fig antes de @eq tambem',
  tipos('Olhe. ' + TRIANGULO + ' @eq ' + MATRIZ), 'texto+figura+equacao');
conf('e a formula depois do @fig nao engole a diretiva de figura',
  partes('Olhe. ' + TRIANGULO + ' @eq ' + MATRIZ)[2].latex, MATRIZ);

/* A trava de isolamento do arroba, a mesma que existe para o endereco de e-mail
 * escrito num tema nao virar diretiva e nao levar embora o resto da frase. */
conf('um e-mail no enunciado nao vira diretiva',
  tipos('Mande a duvida para contato@equipe.com e espere.'), 'texto');
conf('e o texto dele sai inteiro',
  partes('Mande a duvida para contato@equipe.com e espere.')[0].valor,
  'Mande a duvida para contato@equipe.com e espere.');
conf('arroba colado em palavra tambem nao vira diretiva', tipos('valor de x@eqy no item'), 'texto');
{
  /* @eq sem formula nenhuma some COM AVISO, nunca impressa: diretiva vazia na
   * folha e ruido que a aluna nao tem como interpretar. */
  const d = new PDFGen.Doc();
  const p = d.partesDeFigura('Nada aqui. @eq');
  conf('@eq sem formula nao vira pedaco', p.length, 1);
  conf('e ela avisa em vez de sumir calada',
    (d.avisosFigura || []).some(function (a) { return /@eq sem f/.test(a); }), true);
}

/* A frase que vem DEPOIS da formula.
 *
 * "Ir ate o fim do trecho" e a regra certa para a diretiva escrita onde os temas
 * a escrevem, que e no fim do item, e destrutiva no meio de uma frase: ela
 * engolia "e explique o metodo usado." para dentro do LaTeX, e o item saia com
 * "eexpliqueometodousado." em italico matematico, colado na matriz e sem aviso
 * nenhum. O @fig na mesma posicao preserva o texto, porque o fim de diretiva
 * dele para no primeiro token que nao e par: era assimetria silenciosa.
 *
 * O corte e conservador de proposito. Cortar demais apagaria formula legitima,
 * que e o defeito pior dos dois. */
{
  const meio = 'Calcule o determinante de @eq ' + MATRIZ + ' e explique o metodo usado.';
  conf('a frase depois da formula volta a ser texto', tipos(meio), 'texto+equacao+texto');
  conf('e a formula fica sem a prosa', partes(meio)[1].latex, MATRIZ);
  conf('e a frase volta inteira', partes(meio)[2].valor, 'e explique o metodo usado.');
  const d = new PDFGen.Doc();
  d.partesDeFigura(meio);
  conf('e o corte AVISA, para nao ser mais uma coisa silenciosa',
    (d.avisosFigura || []).some(function (a) { return /engoliu texto/.test(a); }), true);
}
/* O SILENCIO que sobra do corte, e que e mais largo do que o corte.
 *
 * O corte anda de tras para frente e para no primeiro token que nao e palavra
 * de prosa pura, entao UM token estranho no meio bloqueia a recuperacao da
 * oracao inteira: nove palavras podem ficar dentro da formula por causa de um
 * "(em metros)". Sai colado, em italico matematico, e nenhuma outra trava deste
 * repositorio ve: nao tem arroba, nao tem "\begin", nao perde palavra. Por isso
 * o aviso e INDEPENDENTE do corte.
 *
 * Achado pela frente 1 em 08/09/2026, com os sete casos abaixo medidos. Dois
 * continuam calados de proposito, e estao aqui escritos como calados: sao de
 * palavra curta, onde "sair feio" ainda se sustenta. */
console.log('\n=== palavra solta dentro da formula avisa ===');
{
  function avisosDeSolta(texto) {
    const d = new PDFGen.Doc();
    d.partesDeFigura(texto);
    return (d.avisosFigura || []).filter(function (a) { return /palavra solta/.test(a); }).length;
  }
  [['token estranho no meio', 'Calcule @eq x^{2} + 1 e explique o metodo (em metros).', 1],
   ['hifen', 'Calcule @eq x^{2} + 1 e explique passo-a-passo.', 1],
   ['aspas', 'Calcule @eq x^{2} + 1 e explique o "porque".', 1],
   ['cifrao', 'Calcule @eq x^{2} + 1 e diga se custa R$ 30 reais.', 1],
   ['recuperacao parcial da frase', 'Calcule @eq x^{2} + 1 e some 2 ao total.', 1],
   ['palavra curta, CALADO de proposito', 'Calcule @eq ' + MATRIZ + ' no fim.', 0],
   ['palavra curta 2, CALADO de proposito', 'Calcule @eq x + 1 ate o fim.', 0]
  ].forEach(function (caso) {
    conf('palavra solta, ' + caso[0], avisosDeSolta(caso[1]), caso[2]);
  });

  /* Alarme falso e o que treina a ignorar alarme, entao o outro lado do par sai
   * das formulas DE VERDADE do banco, e nao de uma lista escrita a mao aqui:
   * lista a mao so cobre o que quem escreveu imaginou. */
  const doBanco = [];
  banco.temas.forEach(function (t) {
    ['pt', 'en'].forEach(function (lg) {
      if (!t[lg]) return;
      String(t[lg].explicacao || '').split(/\r?\n/).forEach(function (l) {
        if (/^@eq(\s|$)/.test(l.trim())) doBanco.push(l.trim().slice(3).trim());
      });
    });
  });
  conf('a serie tem formula @eq de verdade para conferir', doBanco.length >= 10, true);
  conf('e nenhuma delas dispara alarme falso',
    doBanco.filter(function (f) { return avisosDeSolta('Veja. @eq ' + f); }).join(' | ') || 0, 0);
  const LEGITIMAS = [
    'x = \\frac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}',
    '\\begin{vmatrix} 2 & -1 \\\\ 3 & 5 \\end{vmatrix} = 13',
    '\\left\\{ x \\in \\mathrm{R} \\; | \\; x \\geq \\frac{1}{2} \\right\\}',
    '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}',
    '\\lim_{x \\to 0} \\frac{\\sen(x)}{x} = 1',
    'V = b h', 'd = 30 km', 'AB = CD',
    /* O \text{} e o lugar CERTO de escrever palavra dentro de formula, e por
     * isso ele nao pode disparar o aviso, nem com comando aninhado dentro. */
    '\\text{area do triangulo} = \\frac{b \\cdot h}{2}',
    '\\text{raiz de \\sqrt{2}}'
  ];
  conf('nem as ' + LEGITIMAS.length + ' escritas a mao, com \\text{} entre elas',
    LEGITIMAS.filter(function (f) { return avisosDeSolta('Veja. @eq ' + f); }).join(' | ') || 0, 0);
}

/* A altura da equacao na RESERVA do bloco.
 *
 * E a conta que impede a formula de se separar do texto na virada da folha, e o
 * alturaDeFigura passou a atende-la para os quatro ramos do markdown. Sem caso,
 * desligar esse ramo devolveria zero e ninguem veria: a folha voltaria a partir
 * o item ao meio, que e defeito de folha impressa. */
console.log('\n=== a reserva conhece a altura da equacao ===');
{
  const d = new PDFGen.Doc();
  d.novaPagina();
  const bloco = { tipo: 'equacao', latex: MATRIZ };
  const alto = d.alturaDeFigura(bloco, { x: PDFGen.MARG_E, largura: PDFGen.UTIL, tamEq: 11 });
  conf('a altura de um bloco de equacao nao e zero', alto > 20, true);
  conf('e e a MESMA que o alturaDeEquacao devolve', alto, d.alturaDeEquacao(MATRIZ, { tam: 11 }));
  conf('e ela cresce com o corpo da formula',
    d.alturaDeFigura(bloco, { tamEq: 22 }) > alto, true);
  /* E uma diretiva de figura solta continua passando por ali, que e o caminho
   * de sempre e nao podia mudar. */
  conf('e uma diretiva de figura continua medindo pelo caminho dela',
    d.alturaDeFigura(partes('Veja. ' + TRIANGULO)[1].diretiva,
      { x: PDFGen.MARG_E, largura: PDFGen.UTIL }) > 20, true);
}

/* E o outro lado do corte: formula legitima que TERMINA em letra nao e cortada. */
[['A = B', 'A = B'],
 ['V = b h', 'V = b h'],
 ['d = 30 km', 'd = 30 km'],
 ['A = ' + MATRIZ, 'A = ' + MATRIZ],
 ['x = \\frac{1}{2}', 'x = \\frac{1}{2}']].forEach(function (par) {
  conf('a formula "' + par[0] + '" sai inteira, sem corte',
    partes('Veja. @eq ' + par[0])[1].latex, par[1]);
});

/* ================================================= as folhas de verdade */
console.log('\n=== as folhas, pelo caminho de verdade ===');

function gerar(nome, tema, op) {
  const bytes = PDFGen.gerarMaterialTema(Object.assign({ tema: tema }, op));
  if (nome) {
    fs.writeFileSync(path.join(__dirname, nome), bytes);
    console.log('  ' + nome + ': ' + Math.round(bytes.length / 1024) + ' KB');
  }
  return bytes;
}

/* O texto sai do proprio PDF, com a mesma leitura que o _teste/testa_material.js
 * usa: cada peca escrita e um "Td (...) Tj" do fluxo de conteudo. */
function pecasDaFolha(bytes) {
  const cru = Buffer.from(bytes).toString('latin1');
  const rx = /Td \(((?:[^()\\]|\\.)*)\) Tj/g;
  let m; const pecas = [];
  while ((m = rx.exec(cru))) pecas.push(m[1]);
  return pecas;
}
function textoDaFolha(bytes) { return pecasDaFolha(bytes).join(' '); }

/* As palavras escritas na folha, na ordem.
 *
 * Duas coisas ficam de fora, e nenhuma das duas por conveniencia. O rodape de
 * pagina, porque uma formula a mais empurra a folha para uma pagina a mais e
 * "Pagina 1 de 2" vira "Pagina 1 de 3": e a paginacao mudando, nao texto
 * perdido. E a marca d'agua, porque a palavra dela e descartada POR PROJETO
 * quando uma placa branca fatia a caixa de tinta, que e o que a placa de uma
 * formula faz: sem isto a conferencia reprovaria com "NW (0 de 1)" so por o
 * veneno cair perto do meio da folha, e alarme falso e o que treina a ignorar
 * alarme. Medido pela frente 1 em 08/09/2026. */
const FORA_DA_CONTA = { 'NW': 1, 'APOIO': 1, 'EDUCACIONAL': 1 };
function palavrasDaFolha(bytes) {
  const saida = [];
  pecasDaFolha(bytes).forEach(function (p) {
    if (/^P.gina \d+ de \d+$/.test(p) || /^Page \d+ of \d+$/.test(p)) return;
    String(p).split(/\s+/).forEach(function (w) { if (w && !FORA_DA_CONTA[w]) saida.push(w); });
  });
  return saida;
}

/* Que palavras ESPERADAS sumiram. Contagem e nao igualdade: a folha com a
 * formula tem palavras A MAIS, e e assim que tem que ser, porque o renderizador
 * escreve os numeros da matriz como texto. O que nao pode e ter palavra A
 * MENOS. E a conferencia que mede a PRESENCA do que importa, e nao a ausencia
 * do defeito. */
function faltando(todas, esperadas) {
  const tem = {};
  todas.forEach(function (w) { tem[w] = (tem[w] || 0) + 1; });
  const quer = {};
  esperadas.forEach(function (w) { quer[w] = (quer[w] || 0) + 1; });
  const perdidas = [];
  Object.keys(quer).forEach(function (w) {
    if ((tem[w] || 0) < quer[w]) perdidas.push(w + ' (' + (tem[w] || 0) + ' de ' + quer[w] + ')');
  });
  return perdidas;
}

/* Quanto traco a folha tem. O colchete da matriz e DESENHADO, nao e glifo de
 * fonte, entao ele aparece aqui e nao no texto: e esta contagem que separa "a
 * formula foi desenhada" de "a formula sumiu". */
function tracos(bytes) {
  const cru = Buffer.from(bytes).toString('latin1');
  return (cru.match(/(?:^|\s)[ml](?=\s)/g) || []).length;
}

/* O detector, e a prova de que ele detecta. Sem esta segunda linha, "zero
 * ocorrencias" seria satisfeito por um detector quebrado. */
function contarArroba(texto, marca) {
  return (String(texto).match(new RegExp(marca, 'g')) || []).length;
}
conf('o detector acha "@eq" num texto que tem tres',
  contarArroba('a @eq b @eq c @eq', '@eq'), 3);
conf('e o detector generico acha arroba seguida de letra',
  contarArroba('a @eq b @fig c @tabela', '@[A-Za-z]'), 3);

const OPCOES = {
  material: { lingua: 'pt', incluirMaterial: true, incluirLista: true, incluirGabarito: true,
              data: '07/09/2026' },
  lista: { lingua: 'pt', incluirLista: true, espacoParaResposta: 26 },
  gabarito: { lingua: 'pt', incluirGabarito: true }
};

console.log('sonda @eq dentro de exercicio, sobre uma copia do MATEM2-04');
const folha = {
  material: gerar('_sonda_eq_material.pdf', temaVenenoso, OPCOES.material),
  lista: gerar('_sonda_eq_lista.pdf', temaVenenoso, OPCOES.lista),
  gabarito: gerar('_sonda_eq_gabarito.pdf', temaVenenoso, OPCOES.gabarito)
};
const limpa = {
  material: gerar(null, temaLimpo, OPCOES.material),
  lista: gerar(null, temaLimpo, OPCOES.lista),
  gabarito: gerar(null, temaLimpo, OPCOES.gabarito)
};

/* A medida de antes, para o relatorio nao virar memoria: com o caminho do
 * exercicio sem o ramo de @eq, estas tres folhas traziam 3, 2 e 1 ocorrencia da
 * string "@eq" impressa, e a explicacao trazia 0. */
['material', 'lista', 'gabarito'].forEach(function (qual) {
  const txt = textoDaFolha(folha[qual]);
  conf('a folha ' + qual + ' nao imprime "@eq"', contarArroba(txt, '@eq'), 0);
  conf('a folha ' + qual + ' nao imprime arroba seguida de letra nenhuma',
    contarArroba(txt, '@[A-Za-z]'), 0);
  /* E nao sobrou LaTeX cru, que sairia sem arroba nenhuma e passaria pela trava
   * de cima. */
  conf('a folha ' + qual + ' nao imprime LaTeX cru',
    /bmatrix|\\begin|\\frac/.test(txt), false);
  /* Controle positivo de desenho. */
  conf('a folha ' + qual + ' ganhou traco em relacao a mesma folha sem @eq',
    tracos(folha[qual]) > tracos(limpa[qual]), true);
});

/* CONTROLE: a explicacao sempre funcionou, e continua funcionando. Ela e a folha
 * que diz que a contagem de zero acima mede o defeito e nao o instrumento. */
{
  const soMaterial = gerar(null, temaVenenoso, { lingua: 'pt', incluirMaterial: true });
  const soMaterialLimpo = gerar(null, temaLimpo, { lingua: 'pt', incluirMaterial: true });
  conf('CONTROLE: a explicacao nao imprime "@eq" (nunca imprimiu)',
    contarArroba(textoDaFolha(soMaterial), '@eq'), 0);
  conf('CONTROLE: e ela desenha a formula que ganhou',
    tracos(soMaterial) > tracos(soMaterialLimpo), true);
}

/* E o enunciado continua na folha: sem isto, "o LaTeX sumiu" seria satisfeito
 * por um item que perdeu o texto junto com a formula. */
{
  const txt = textoDaFolha(folha.lista);
  conf('o enunciado do exercicio 1 continua escrito', /Escreva/.test(txt) && /matriz/.test(txt), true);
  conf('o enunciado do exercicio 4 continua escrito', /tri.ngulo|triangulo/.test(txt), true);
  conf('e o gabarito continua trazendo a resposta',
    /transposta/.test(textoDaFolha(folha.gabarito)), true);
}

/* ====================================== os OUTROS caminhos, um por um
 *
 * A extracao da @eq acontece dentro do separarFiguras, e ele tem QUATRO
 * consumidores de verdade no pdf.js: o subtitulo, o item de lista, o paragrafo e
 * a celula de tabela (a definicao nao e consumidor). Mais o textoComFiguras, que
 * e o quinto e desenha sozinho, e o caminho do exercicio, que passa pelo
 * separarPorTipo. Estas conferencias existem porque a prova estava verde por
 * AUSENCIA DE CASO: ela media o exercicio, que e o caminho consertado, e nao
 * media nenhum dos outros. Apontado pela frente 1 em 08/09/2026.
 *
 * E a conferencia NAO e "nao sai cru e avisa". Foi essa formulacao que deixou
 * passar o pior defeito deste PR: os quatro ramos pararam de imprimir a formula
 * e passaram a APAGAR O RESTO DA FRASE, e a prova ficou verde afirmando que
 * estava tudo bem, porque "nao saiu cru" e "avisou" eram as duas coisas
 * verdadeiras. "A matriz @eq ... fecha o assunto de hoje." saia da folha como
 * "A matriz". O pai imprimia feio e COMPLETO, entao aquilo era regressao.
 *
 * A conferencia certa e a PRESENCA do que importa: o texto que nao e diretiva
 * chega inteiro a folha, comparado com o MESMO markdown sem a diretiva. */
console.log('\n=== os quatro ramos do markdown, e a linha propria ===');
{
  const M = '\\begin{bmatrix} 1 & 2 \\\\ 3 & 5 \\end{bmatrix}';
  /* Cada caso e um PAR: o mesmo markdown com a diretiva e sem ela. O texto de
   * fora da diretiva tem que sair identico nos dois. */
  const RAMOS = [
    ['linha propria (como os 148 temas escrevem)',
     'Antes da formula.\n\n@eq ' + M + '\n\nDepois da formula.',
     'Antes da formula.\n\nDepois da formula.', 0],
    ['meio de paragrafo',
     'A matriz @eq ' + M + ' fecha o assunto de hoje.',
     'A matriz fecha o assunto de hoje.', 1],
    ['subtitulo',
     '#### Titulo com formula @eq ' + M + '\n\nCorpo do texto.',
     '#### Titulo com formula\n\nCorpo do texto.', 0],
    ['item de lista',
     '- Item com @eq ' + M + ' no fim da frase.\n- Outro item.',
     '- Item com no fim da frase.\n- Outro item.', 1],
    ['celula de tabela',
     '| um | dois |\n|---|---|\n| @eq ' + M + ' | quatro |',
     '| um | dois |\n|---|---|\n|  | quatro |', 0],
    ['ramo do @fig, que desenha sozinho (o textoComFiguras)',
     'Olhe.\n\n' + TRIANGULO + ' @eq ' + M + '\n\nFim do trecho.',
     'Olhe.\n\n' + TRIANGULO + '\n\nFim do trecho.', 0]
  ];
  function folhaDeMarkdown(md) {
    const d = new PDFGen.Doc();
    d.novaPagina();
    d.markdown(md, {});
    const bytes = d.finalizar();
    return { bytes: bytes, doc: d, palavras: palavrasDaFolha(bytes) };
  }
  RAMOS.forEach(function (r) {
    const nome = r[0], com = folhaDeMarkdown(r[1]), sem = folhaDeMarkdown(r[2]);
    const avisosEsperados = r[3];
    conf(nome + ': LaTeX cru NAO sai impresso',
      /@eq|bmatrix|\\begin/.test(com.palavras.join(' ')), false);
    /* A conferencia que o revisor pediu, e a que teria pego a frase sumindo. */
    conf(nome + ': o texto que nao e diretiva chega INTEIRO a folha',
      faltando(com.palavras, sem.palavras).join(' ') || 'nada faltou', 'nada faltou');
    conf(nome + ': e a formula foi DESENHADA (ganhou traco)',
      tracos(com.bytes) > tracos(sem.bytes), true);
    /* Aviso so onde houve corte de prosa: a diretiva no meio da frase engole o
     * que vem depois dela, e o aviso e o que conta que isso aconteceu. */
    conf(nome + ': avisos', (com.doc.avisosFigura || []).length, avisosEsperados);
  });
}

/* ====================================== a marca d'agua fora da conta
 *
 * A conferencia de "o texto chega inteiro" podia dar ALARME FALSO, e o alarme
 * falso em portao e o que treina a ignorar alarme. A palavra da marca d'agua e
 * descartada por projeto quando uma placa branca fatia a caixa de tinta dela, e
 * a @eq desloca a figura cuja placa faz isso: a mesma folha, com e sem a
 * diretiva, "perdia" o NW. Varrido em 42 combinacoes de item e espaco de
 * resposta: reproduz em 8 delas, sempre como "NW (0 de 1)" ou "NW (1 de 2)".
 *
 * O caso guarda as DUAS metades: que a conta de hoje nao acusa, e que a conta
 * SEM pular a marca acusaria. Sem a segunda metade, o dia em que alguem tirar o
 * FORA_DA_CONTA a suite fica vermelha sem defeito nenhum, e ninguem vai saber
 * por que. */
console.log('\n=== a marca d\'agua nao entra na conta de palavras ===');
{
  const M = '\\begin{bmatrix} 1 & 2 \\\\ 3 & 5 \\end{bmatrix}';
  function comFigura(comEq) {
    const ex = [];
    for (let i = 0; i < 2; i++) {
      ex.push({
        enunciado: 'Item numero ' + (i + 1) + ' com desenho. ' + TRIANGULO +
          (comEq && i === 0 ? ' @eq ' + M : ''),
        resposta: 'Resposta ' + (i + 1) + '.'
      });
    }
    return { fontes: {}, pt: { titulo: 't', resumo: 'r', explicacao: 'Um paragrafo.', exercicios: ex } };
  }
  const op = { lingua: 'pt', incluirLista: true, espacoParaResposta: 50 };
  const com = PDFGen.gerarMaterialTema(Object.assign({ tema: comFigura(true) }, op));
  const sem = PDFGen.gerarMaterialTema(Object.assign({ tema: comFigura(false) }, op));
  conf('a conta de hoje nao acusa nada nesta folha',
    faltando(palavrasDaFolha(com), palavrasDaFolha(sem)).join(' ') || 'nada faltou', 'nada faltou');
  /* A outra metade: sem pular a marca, a MESMA folha acusaria. */
  function comMarca(bytes) {
    const saida = [];
    pecasDaFolha(bytes).forEach(function (p) {
      if (/^P.gina \d+ de \d+$/.test(p)) return;
      String(p).split(/\s+/).forEach(function (w) { if (w) saida.push(w); });
    });
    return saida;
  }
  conf('e sem pular a marca ela acusaria, que e o motivo de pular',
    faltando(comMarca(com), comMarca(sem)).some(function (f) { return /^NW/.test(f); }), true);
}

/* ====================================== a legenda que engolia a equacao
 *
 * "ate a proxima diretiva" so conhecia o @fig, nos DOIS lugares que leem legenda
 * (pdf.js e figuras/base.js). Uma @eq escrita depois de uma legenda ia parar
 * DENTRO dela, e a folha saia com o LaTeX inteiro impresso embaixo do desenho.
 * Pre-existente, e e a garantia de manchete deste PR. */
console.log('\n=== a legenda para na proxima diretiva, seja ela qual for ===');
{
  const M = '\\begin{bmatrix} 1 & 2 \\\\ 3 & 5 \\end{bmatrix}';
  const comLegenda = TRIANGULO + ' legenda=A parte pedida e a de baixo. @eq ' + M;
  const p = partes(comLegenda);
  conf('a legenda e a equacao viram dois pedacos', tipos(comLegenda), 'figura+equacao');
  conf('e a legenda para antes do @eq',
    p[0] && p[0].diretiva && p[0].diretiva.legenda, 'A parte pedida e a de baixo.');
  conf('e a equacao sai inteira do outro lado', p[1] && p[1].latex, M);
  const d = new PDFGen.Doc();
  d.novaPagina();
  d.markdown('Olhe.\n\n' + comLegenda + '\n', {});
  const palavras = palavrasDaFolha(d.finalizar()).join(' ');
  conf('e na folha nao sai LaTeX cru embaixo do desenho',
    /@eq|bmatrix|\\begin/.test(palavras), false);
  conf('e a legenda continua escrita', /parte pedida/.test(palavras), true);
}

/* ====================================== o gabarito estruturado e a alternativa
 *
 * O SETIMO consumidor. Quando o exercicio tem gabarito.letra ou espera_se, o
 * texto ia direto para o quebrarRico, sem separador nenhum, e sao 101 exercicios
 * do banco de portugues que passam por esse ramo. Mesma coisa para o texto das
 * alternativas. */
console.log('\n=== o gabarito estruturado e as alternativas ===');
{
  const M = '\\begin{bmatrix} 1 & 2 \\\\ 3 & 5 \\end{bmatrix}';
  function temaComGabarito(comDiretiva) {
    const mais = function (t, d) { return comDiretiva ? t + ' ' + d : t; };
    return {
      fontes: {},
      pt: {
        titulo: 'Gabarito estruturado', resumo: 'r', explicacao: 'Um paragrafo.',
        exercicios: [{
          enunciado: 'Qual alternativa esta certa?',
          alternativas: [
            { letra: 'a', texto: mais('A primeira alternativa.', '@eq ' + M) },
            { letra: 'b', texto: 'A segunda alternativa.' }
          ],
          gabarito: {
            letra: 'a', porque: mais('Porque a conta fecha.', '@eq ' + M)
          },
          resposta: 'a'
        }, {
          enunciado: 'Explique com suas palavras.',
          gabarito: {
            espera_se: mais('Espera-se a conta feita.', '@eq ' + M),
            aceita_se: [mais('Aceita-se a forma curta.', '@eq ' + M)],
            nao_aceita: ['Nao se aceita so o resultado.']
          },
          resposta: 'aberta'
        }]
      }
    };
  }
  const comEq = PDFGen.gerarMaterialTema({
    tema: temaComGabarito(true), lingua: 'pt', incluirLista: true, incluirGabarito: true
  });
  const semEq = PDFGen.gerarMaterialTema({
    tema: temaComGabarito(false), lingua: 'pt', incluirLista: true, incluirGabarito: true
  });
  conf('o gabarito estruturado nao imprime arroba seguida de letra',
    (palavrasDaFolha(comEq).join(' ').match(/@[A-Za-z]/g) || []).length, 0);
  conf('nem LaTeX cru', /bmatrix|\\begin/.test(palavrasDaFolha(comEq).join(' ')), false);
  conf('e o texto do gabarito e das alternativas chega INTEIRO',
    faltando(palavrasDaFolha(comEq), palavrasDaFolha(semEq)).join(' ') || 'nada faltou',
    'nada faltou');
  conf('e as quatro formulas foram DESENHADAS', tracos(comEq) > tracos(semEq), true);
}

/* ====================================== a formula larga demais para a coluna
 *
 * O aviso de largura passou a comparar com a COLUNA do item e nao com a folha.
 * Sem caso, desligar o aviso nao reprovaria nada. */
console.log('\n=== a formula mais larga que a coluna avisa ===');
{
  const Formula = require('./formula.js');
  const COLUNA = PDFGen.MARG_D - PDFGen.MARG_E - 20;   // a coluna do item
  const FOLHA = PDFGen.UTIL;                           // a folha inteira

  /* A formula do caso tem que cair ENTRE as duas larguras. Uma que estoura as
   * duas avisaria dos dois lados e nao separaria nada: seria um caso verde por
   * sorte, e desligar a medida pela coluna continuaria passando. A faixa entre
   * a coluna e a folha e estreita (cerca de 20 pt), entao ela e PROCURADA, e
   * nao chutada. */
  let entre = null;
  for (let n = 1; n < 200 && !entre; n++) {
    let f = 'x = 1';
    for (let i = 0; i < n; i++) f += ' + 1';
    const larg = Formula.medir(f, 11, {}).largura;
    if (larg > COLUNA && larg <= FOLHA) entre = { latex: f, largura: larg };
  }
  conf('existe formula que cabe na folha e nao na coluna do item', !!entre, true);

  function avisosDeLargura(latex, op) {
    const d = new PDFGen.Doc();
    d.novaPagina();
    d.equacao(latex, op);
    return (d.avisosFigura || []).filter(function (a) { return /mais larga que a coluna/.test(a); }).length;
  }
  if (entre) {
    conf('ela avisa na coluna estreita do item',
      avisosDeLargura(entre.latex, { tam: 11, x: PDFGen.MARG_E + 20, largura: COLUNA }), 1);
    /* O outro lado do par: na folha inteira a MESMA formula nao avisa. Sem esta
     * linha, a medida podia estar comparando com a folha e ninguem veria. */
    conf('e nao avisa na folha inteira, que e o outro lado do par',
      avisosDeLargura(entre.latex, { tam: 11 }), 0);
  }
  conf('e uma formula curta nao avisa em nenhuma das duas',
    avisosDeLargura('x = 1', { tam: 11, x: PDFGen.MARG_E + 20, largura: COLUNA }) +
    avisosDeLargura('x = 1', { tam: 11 }), 0);
}

console.log('\n' + '='.repeat(60));
console.log(passes + ' passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(function (e) { console.log(' - ' + e); }); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
