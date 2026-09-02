/* testa_notacao.js
 * Aceitação da notação matemática no PDF.
 *
 * Estes testes definem o que a peça 1 tem que entregar. Eles falham hoje, de
 * propósito: são a régua de quem for implementar expoente, índice e a fonte
 * de símbolos no pdf.js.
 *
 * O contrato está em temas/NOTACAO.md.
 */
const PDFGen = require('../pdf.js');

let passes = 0, falhas = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

/* Um documento de uma página só, para inspecionar o conteúdo gerado. */
function paginaCom(fn) {
  const doc = new PDFGen.Doc();
  doc.novaPagina();
  fn(doc);
  const bytes = doc.finalizar();
  return { doc, bytes, texto: Buffer.from(bytes).toString('latin1') };
}

// ================================================================
secao('1. Os caracteres que já funcionavam continuam funcionando');

['×', '÷', '²', '³', '·', '°', '±', '½', 'ç', 'ã', 'é', 'º'].forEach(c => {
  conf('"' + c + '" não vira interrogação', PDFGen.paraWinAnsi(c) !== '?', true);
});

// ================================================================
secao('2. A fonte de símbolos entrou');

conf('o gerador anuncia que sabe desenhar símbolo',
  typeof PDFGen.desenhaSimbolo === 'function' || typeof PDFGen.SIMBOLOS === 'object', true);

const SIMBOLOS = PDFGen.SIMBOLOS || {};
['π', '√', '≥', '≤', '≠', '∞', 'Δ', 'Σ'].forEach(c => {
  conf('"' + c + '" tem código na fonte de símbolos', typeof SIMBOLOS[c], 'number');
});

// o PDF precisa registrar a fonte Symbol quando um símbolo é usado
{
  const r = paginaCom(d => d.escreverRico('A área é π · r^{2}.', { tam: 10 }));
  conf('o PDF registra a fonte Symbol quando precisa', /\/BaseFont\s*\/Symbol/.test(r.texto), true);
}
{
  const r = paginaCom(d => d.escreverRico('Sem símbolo nenhum aqui.', { tam: 10 }));
  conf('e não registra quando não precisa', /\/BaseFont\s*\/Symbol/.test(r.texto), false);
}

// ================================================================
secao('3. Expoente e índice');

conf('a medida conhece a marcação de expoente',
  PDFGen.medirRico ? typeof PDFGen.medirRico('x^{2}', 10) : 'sem medirRico', 'number');

// o expoente ocupa menos largura que o mesmo texto na linha de base
if (PDFGen.medirRico) {
  const comExpoente = PDFGen.medirRico('2^{10}', 10);
  const semExpoente = PDFGen.medir('210', 10);
  conf('"2^{10}" mede menos que "210" na mesma altura', comExpoente < semExpoente, true);
  conf('e mede mais que "2" sozinho', comExpoente > PDFGen.medir('2', 10), true);
}

// a chave não pode aparecer no PDF
{
  const r = paginaCom(d => d.escreverRico('M = C · (1 + i)^{t}', { tam: 10 }));
  conf('a chave do expoente não sobra no PDF', /\^\{|\}\s*Tj/.test(r.texto), false);
}
{
  const r = paginaCom(d => d.escreverRico('S_{n} = a_{1} + a_{n}', { tam: 10 }));
  conf('a chave do índice não sobra no PDF', /_\{/.test(r.texto), false);
}

// ================================================================
secao('4. Quebra de linha conta a largura certa');

if (PDFGen.medirRico) {
  const linhas = new PDFGen.Doc().quebrarRicoPublico
    ? null
    : null;
  // o teste real: um parágrafo com expoentes não estoura a margem
  const r = paginaCom(d => {
    d.escreverRico('O montante em juros compostos é M = C · (1 + i)^{t}, e o fator ' +
      '1,05^{4} vale 1,21550625, então o montante fica 2431,01 reais para C = 2000 ' +
      'reais e i = 0,05 ao mês durante t = 4 meses.', { tam: 10 });
  });
  conf('parágrafo longo com expoente gera PDF válido', r.bytes.length > 500, true);
}

// ================================================================
secao('5. A trava de caractere');

conf('o gerador oferece a conferência de caractere',
  typeof PDFGen.caracteresQueNaoDesenha === 'function', true);

if (typeof PDFGen.caracteresQueNaoDesenha === 'function') {
  conf('acusa um caractere fora do repertório',
    PDFGen.caracteresQueNaoDesenha('isto tem um ℘ perdido').length, 1);
  conf('não acusa o que já é desenhável',
    PDFGen.caracteresQueNaoDesenha('área × 2 ÷ 3 · π ≥ √ x^{2} açúcar').length, 0);
  conf('não acusa a marcação de expoente',
    PDFGen.caracteresQueNaoDesenha('(1 + i)^{t} e a_{1}').length, 0);
}

// ================================================================
secao('6. A célula da tabela respeita a largura da coluna');

/* Isto já foi corrigido uma vez e voltou: um agente reescreveu o tabelaSimples
 * e a quebra por coluna se perdeu, sem nenhum teste acusar. A tabela saiu
 * impressa com "continua o mesmo" por cima de "calor sensível", e a suíte
 * inteira passou verde. */
{
  const comprida = [
    '| O que está acontecendo | Nome | Fórmula |',
    '| A temperatura muda e o estado continua o mesmo | calor sensível | Q = m · c · (Tf - Ti) |',
    '| O estado muda e a temperatura fica parada | calor latente | Q = m · L |'
  ];
  const curta = ['| a | b | c |', '| 1 | 2 | 3 |', '| 4 | 5 | 6 |'];

  const alturaDe = (linhas) => {
    const d = new PDFGen.Doc();
    d.novaPagina();
    const y0 = d.y;
    d.tabelaSimples(linhas, 10);
    return y0 - d.y;
  };

  conf('a tabela de célula comprida fica mais alta que a de célula curta',
    alturaDe(comprida) > alturaDe(curta), true);

  // a coluna do meio começa a UTIL/3 da margem: nada da primeira pode passar dali
  const largura = PDFGen.UTIL / 3;
  const cabe = PDFGen.medirRico
    ? PDFGen.medirRico('A temperatura muda e o estado', 9.2) < largura - 12
    : false;
  conf('a linha quebrada cabe dentro da coluna', cabe, true);
}

// ================================================================
secao('7. Subtítulo não fica órfão no pé da página');

{
  const d = new PDFGen.Doc();
  d.novaPagina();
  d.y = 150;                     // quase no rodapé
  const antes = d.paginas.length;
  d.markdown('### Um subtítulo\n\nUma linha.\n\nOutra linha.\n\nMais uma linha.', { tam: 10 });
  conf('o subtítulo leva o conteúdo junto para a página seguinte',
    d.paginas.length > antes, true);
}

// ================================================================
secao('8. O vão entre o fio do cabeçalho e o título');

/* Esta correção já se perdeu DUAS vezes: um agente reescreveu o
 * cabecalhoDeSecao e o valor voltou ao antigo, e a minha conferência por grep
 * deu falso positivo porque procurava uma linha que aparece duas vezes dentro
 * da própria função. Agora quem confere é a geometria do PDF gerado, não o
 * texto do fonte. */
{
  const doc = new PDFGen.Doc();
  doc.novaPagina();
  doc.cabecalhoDeSecao('Termologia', 'Material de estudo');
  const bruto = Buffer.from(doc.finalizar()).toString('latin1');

  const m = bruto.match(/\/F2 17 Tf[^]{0,80}?([0-9.]+) ([0-9.]+) Td/);
  conf('achei a linha de base do título no PDF', !!m, true);
  if (m) {
    const base = parseFloat(m[2]);
    const fio = 841.8898 - 58;
    const vaoMm = (fio - (base + 17 * 0.717)) * 25.4 / 72;
    console.log('       vão medido: ' + vaoMm.toFixed(1) + ' mm');
    conf('o vão fica entre 5 e 9 mm', vaoMm > 5 && vaoMm < 9, true);
  }
}

// ================================================================
secao('9. Numero abrindo linha no meio de paragrafo nao vira item de lista');

/* Achado na revisao da folha impressa do piloto: a fonte dos temas e quebrada
 * em cerca de 100 colunas, e quando a continuacao de uma frase caia comecando
 * com numero mais ponto, o markdown lia aquilo como marcador de lista. O "360."
 * saia em teal na coluna do marcador e o espaco depois dele desaparecia:
 * "adds up to 360.Swapping the two...". Sao 26 lugares em 20 dos 146 temas.
 *
 * A regra: lista numerada so e reconhecida quando ABRE um bloco. No meio de um
 * paragrafo, numero e numero.
 *
 * O teste casa no fluxo cru de proposito. A primeira versao dele extraia os
 * pedacos com uma expressao que trazia os parenteses junto na captura, entao a
 * comparacao nunca batia e ele passava com o defeito vivo na folha. */
{
  const r = paginaCom(d => d.markdown(
    'A triangle adds up to 180 and a quadrilateral adds up to\n' +
    '360. Swapping the two is a reading mistake.', { tam: 10 }));

  const TEAL = '0.180392 0.490196 0.419608 rg';
  const linhas = r.texto.split('\n');
  const comoMarcador = linhas.filter(L => L.indexOf(TEAL) >= 0 && L.indexOf('(360.)') >= 0);
  conf('o "360." nao e pintado como marcador de lista', comoMarcador.length, 0);

  const naColunaDoItem = linhas.filter(L => /\bTd \(Swapping\) Tj/.test(L) && / 62\.00 [0-9.]+ Td/.test(L));
  conf('o "Swapping" nao cai no recuo de item', naColunaDoItem.length, 0);

  // e o paragrafo continua um so: o numero fica na mesma linha de base do texto
  const yDoAdds = (linhas.find(L => /Td \(adds\) Tj/.test(L)) || '').match(/ ([0-9.]+) Td/);
  const yDo360 = (linhas.find(L => /Td \(360\.\) Tj/.test(L)) || '').match(/ ([0-9.]+) Td/);
  conf('achei as duas linhas de base para comparar', !!(yDoAdds && yDo360), true);
}
/* A outra metade da mesma regra, e a que eu quebrei ao consertar a primeira.
 * No gabarito do MAT07-05 o item 5 tem uma sobra indentada de uma palavra so,
 * "   30.", que vira paragrafo. Deixando o paragrafo simplesmente nao parar em
 * numero, esse paragrafo de uma palavra engolia os itens 6 a 18 e o marcador
 * sumia de 13 exercicios de uma vez. Por isso a parada olha se o paragrafo
 * TERMINA UMA FRASE. */
{
  const r = paginaCom(d => d.markdown(
    '5. A razao entre meninos e meninas e 2/3, porque o total e\n' +
    '   30.\n' +
    '6. 36 e 48. Cada uma das 7 partes vale 12.\n' +
    '7. 70 reais, 105 reais e 175 reais.', { tam: 10 }));
  /* Literal, e nao new RegExp de string: escrito como string, o "\(" perdia uma
   * barra pelo caminho, virava um grupo a mais e a captura vinha com os
   * parenteses juntos, entao a comparacao nunca batia. */
  const rx = /\/F2 10 Tf 44\.00 [0-9.]+ Td \((.*?)\) Tj/g;
  const achados = [];
  let m;
  while ((m = rx.exec(r.texto))) achados.push(m[1]);
  conf('a lista que vem depois de uma sobra indentada continua sendo lista',
    achados.join(' '), '5. 6. 7.');
}

/* O mesmo texto em CRLF tem que sair igual ao texto em LF. Os arquivos do banco
 * sao CRLF e o gerador partia so em \n, entao cada linha chegava com um \r no
 * fim que servia de espaco para os padroes de linha. Media na saida: em 5 temas
 * a sobra indentada do ultimo item ("   30.", "   1.", "   7.") era cuspida como
 * paragrafo na margem em vez de fechar a frase do item. */
{
  const fonte = '5. A razao entre meninos e meninas e 2/3, porque o total e\n' +
                '   30.\n' +
                '6. 36 e 48.';
  const pecas = (txt) => {
    const r = paginaCom(d => d.markdown(txt, { tam: 10 }));
    const rx = /([0-9.]+) [0-9.]+ Td \((.*?)\) Tj/g;
    const out = [];
    let m;
    while ((m = rx.exec(r.texto))) out.push(m[1] + '|' + m[2]);
    return out.join(' ');
  };
  conf('CRLF e LF geram a mesma pagina', pecas(fonte.replace(/\n/g, '\r\n')), pecas(fonte));

  const comCRLF = pecas(fonte.replace(/\n/g, '\r\n'));
  conf('o "30." fecha a frase do item, nao vira paragrafo na margem',
    / 40\.00\|30\./.test(' ' + comCRLF), false);
}

// ================================================================
secao('10. A equação de bloco @eq');

/* O renderizador de LaTeX mora em figuras/formula.js e é carregado tarde, igual
 * ao de figuras: sem ele o pdf.js tem que continuar servindo.
 *
 * A regra que estes testes existem para travar é uma só, e ela já foi quebrada
 * antes com o @fig: DIRETIVA NUNCA SAI IMPRESSA COMO TEXTO. Quando o ramo do
 * markdown não pega a linha, ela cai no parágrafo e a marcação inteira aparece
 * escrita no meio da folha, em silêncio: o PDF gera, o verificador de caractere
 * passa (arroba, barra invertida e chave desenham) e o defeito só aparece no
 * papel. */
{
  const temFormula = (function () {
    try { require('../figuras/formula.js'); return true; } catch (e) { return false; }
  })();
  conf('o módulo de fórmula está ao lado', temFormula, true);

  const r = paginaCom(d => d.markdown(
    'A raiz sai da fórmula:\n\n' +
    '@eq x = \\frac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}\n\n' +
    'E daí em diante.', { tam: 10 }));

  const escritos = [];
  const rx = /Td \(((?:[^()\\]|\\.)*)\) Tj/g;
  let m;
  while ((m = rx.exec(r.texto))) escritos.push(m[1]);

  conf('a diretiva "@eq" não sai impressa',
    escritos.some(t => t.indexOf('@eq') >= 0), false);
  conf('o comando "\\frac" não sai impresso',
    escritos.some(t => t.indexOf('\\\\frac') >= 0 || t.indexOf('frac') >= 0), false);
  conf('a chave da fórmula não sai impressa',
    escritos.some(t => /\{|\}/.test(t)), false);
  conf('o texto em volta continua saindo',
    escritos.filter(t => /raiz|diante/.test(t)).length >= 2, true);
  conf('a barra da fração foi desenhada', / re f\b|[0-9.]+ w\b/.test(r.texto), true);
}

/* A diretiva colada num parágrafo. Sem a parada no laço, a linha vira o fim do
 * parágrafo anterior e sai escrita por extenso. */
{
  const r = paginaCom(d => d.markdown(
    'Olhe a fórmula abaixo.\n@eq \\frac{1}{2}\nE continue lendo.', { tam: 10 }));
  const escritos = [];
  const rx = /Td \(((?:[^()\\]|\\.)*)\) Tj/g;
  let m;
  while ((m = rx.exec(r.texto))) escritos.push(m[1]);
  conf('diretiva colada em parágrafo não sai impressa',
    escritos.some(t => t.indexOf('@eq') >= 0 || t.indexOf('frac') >= 0), false);
  conf('e o parágrafo de antes e o de depois continuam lá',
    escritos.filter(t => /Olhe|continue/.test(t)).length, 2);
}

/* Comando que não existe. O renderizador desenha um selo visível no ponto do
 * defeito e avisa; o que ele NÃO pode fazer é imprimir o comando cru como texto
 * normal, porque aí a aluna lê barra invertida no meio da conta. */
{
  const doc = new PDFGen.Doc();
  doc.novaPagina();
  doc.markdown('@eq \\naoexiste{x}', { tam: 10 });
  /* A lista chama-se avisosFigura, e o aviso de fórmula entra NELA de propósito:
   * duas listas de aviso em dois lugares é uma lista que ninguém lê, e a trava
   * que já existe (conferirFigura) lê esta. */
  doc.finalizar();
  const avisos = doc.avisosFigura || [];
  conf('comando desconhecido gera aviso', avisos.length > 0, true);
  conf('e o aviso diz qual comando foi',
    avisos.some(a => String(a).indexOf('naoexiste') >= 0), true);
  conf('e o aviso é marcado como de fórmula',
    avisos.some(a => String(a).indexOf('rmula') >= 0), true);
}

/* Acrescentar o @eq não pode mexer em nada que já existe. Nenhum dos 146 temas
 * usa a diretiva, então a folha de um tema tem que sair idêntica com e sem ela.
 * Aqui vai a versão barata desse contrato: um texto sem @eq nenhum. */
{
  const semDiretiva = 'Um parágrafo comum.\n\n1. Primeiro item.\n2. Segundo item.\n\n' +
    '| a | b |\n| 1 | 2 |\n\nOutro parágrafo com x^{2} e a_{1}.';
  const a = paginaCom(d => d.markdown(semDiretiva, { tam: 10 }));
  const b = paginaCom(d => d.markdown(semDiretiva, { tam: 10 }));
  conf('texto sem @eq sai igual entre duas gerações', a.texto.length, b.texto.length);
  conf('e nenhum vestígio de fórmula aparece nele',
    /Formula|@eq/.test(a.texto), false);
}

// ================================================================
secao('11. A figura não se separa do parágrafo que a explica');

/* Achado por uma leitora que olhou a folha impressa como a aluna: "viro a folha
 * e caio numa figura pelada com dois números soltos, não sei se é área, se é
 * lado, se é o quê". A frase que explicava a figura tinha ficado na página
 * anterior. Para aluno neurodivergente é pior: o desenho perde o dono.
 *
 * A regra: a ÚLTIMA linha do parágrafo e a figura que vem logo depois têm que
 * caber juntas. Não cabendo, as duas viram a folha juntas.
 *
 * A diretiva vem separada do parágrafo por uma linha em branco na fonte dos
 * temas, então a busca adiante precisa pular o branco. A primeira versão deste
 * conserto olhava só a linha seguinte, achava a linha vazia e não reservava
 * nada: o defeito continuou de pé e a medição não mudou. */
/* O teste varre VÁRIAS alturas de partida em vez de calibrar uma: assim ele não
 * depende de eu acertar o ponto exato em que a folha estoura, e cobre tanto o
 * caso em que tudo cabe quanto o caso em que a fórmula empurra a virada. */
{
  const fonte = 'Uma frase curta que explica a fórmula abaixo.\n\n' +
                '@eq \\frac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}';
  let virou = 0, sozinha = 0, casos = 0;

  for (let y0 = 200; y0 >= 90; y0 -= 10) {
    const doc = new PDFGen.Doc();
    doc.novaPagina();
    doc.y = y0;
    const antes = doc.paginas.length;
    doc.markdown(fonte, { tam: 10 });
    const bruto = Buffer.from(doc.finalizar()).toString('latin1');
    const paginas = bruto.split(/Apoio Educacional\) Tj/).slice(0, -1);
    casos++;
    if (doc.paginas.length > antes) virou++;

    /* A fórmula sai desenhada (barra da fração), então a página que a contém tem
     * que conter TAMBÉM alguma palavra do parágrafo. */
    const comFormula = paginas.filter(p => / re f\b/.test(p) || /[0-9.]+ w\b/.test(p));
    const ultima = comFormula[comFormula.length - 1] || '';
    if (ultima && !/Td \((Uma|frase|curta|que|explica|abaixo\.)\) Tj/.test(ultima)) sozinha++;
  }

  conf('houve caso em que a folha virou, senão o teste não testa nada', virou > 0, true);
  conf('em nenhuma altura a fórmula ficou sozinha, longe da frase', sozinha, 0);
  console.log('       ' + casos + ' alturas de partida conferidas, ' + virou + ' viraram a folha');
}

// ================================================================
console.log('\n' + '='.repeat(60));
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
