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
function textoDaFolha(bytes) {
  const cru = Buffer.from(bytes).toString('latin1');
  const rx = /Td \(((?:[^()\\]|\\.)*)\) Tj/g;
  let m; const pecas = [];
  while ((m = rx.exec(cru))) pecas.push(m[1]);
  return pecas.join(' ');
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

console.log('\n' + '='.repeat(60));
console.log(passes + ' passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(function (e) { console.log(' - ' + e); }); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
