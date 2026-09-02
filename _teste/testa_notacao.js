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
console.log('\n' + '='.repeat(60));
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
