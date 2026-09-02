/* Gera o PDF de um tema de verdade e confere o resultado.
 *
 * Este arquivo já esteve no portão de merge sem afirmar nada: ele gerava os
 * quatro PDFs, imprimia o tamanho e saía. Como não imprimia linha de resumo, o
 * confere_tudo.sh, que aprovava por AUSÊNCIA de falha, marcava "ok" toda vez.
 * Um gerador que só não estoura não é conferência: agora ele afirma.
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

const banco = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'temas', 'banco.json'), 'utf8'));
const tema = banco.temas.find(t => t.id === 'MAT06-05');
console.log('tema:', tema.pt.titulo, '|', tema.pt.exercicios.length, 'exercicios');

function gerar(nome, minKB, op) {
  const bytes = PDFGen.gerarMaterialTema(Object.assign({ tema }, op));
  fs.writeFileSync(path.join(__dirname, nome), bytes);
  const kb = Math.round(bytes.length / 1024);
  console.log('  ' + nome + ': ' + kb + ' KB');
  const bruto = Buffer.from(bytes).toString('latin1');

  conf(nome + ': é um PDF de verdade',
    bruto.slice(0, 5) === '%PDF-' && bruto.trim().slice(-5) === '%%EOF', true);
  /* Piso de tamanho por folha. Um gerador que perde uma seção inteira continua
   * escrevendo um PDF válido: sem piso, a perda passa calada. */
  conf(nome + ': tem pelo menos ' + minKB + ' KB', kb >= minKB, true);

  /* Marcação que vazou para a folha. O "@fig" já saiu impresso por extenso uma
   * vez, e o "^{" sairia igual se a tubulação rica não pegasse a linha. */
  ['@fig', '^{', '_{', '**'].forEach(function (m) {
    const escapado = m.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
    const rx = new RegExp('Td \\([^)]*' + escapado);
    conf(nome + ': a marcação "' + m + '" não sai impressa', rx.test(bruto), false);
  });

  return bytes;
}

const completo = gerar('tema_completo.pdf', 60, {
  lingua: 'pt', incluirMaterial: true, incluirLista: true, incluirGabarito: true,
  aluno: 'Marcelo', data: '10/06/2026'
});
const soLista = gerar('tema_so_lista.pdf', 12, {
  lingua: 'pt', incluirLista: true, aluno: 'Marcelo', espacoParaResposta: 26
});
const selecao = gerar('tema_selecao.pdf', 8, {
  lingua: 'pt', incluirLista: true, incluirGabarito: true, escolhidos: [1, 8, 13, 17, 18]
});
const ingles = gerar('tema_ingles.pdf', 40, {
  lingua: 'en', incluirMaterial: true, incluirLista: true
});

console.log('\n=== o que cada folha tem que conter ===');

/* A folha completa tem as três seções; a de lista só tem uma. Sem isto, perder o
 * gabarito inteiro passaria pelo piso de tamanho sem acusar nada. */
conf('a folha completa é maior que a de só lista', completo.length > soLista.length * 2, true);
conf('a seleção de 5 exercícios é menor que a lista dos 18', selecao.length < soLista.length, true);

const txtPt = Buffer.from(completo).toString('latin1');
const txtEn = Buffer.from(ingles).toString('latin1');
conf('a folha em português traz o nome do aluno', /Td \([^)]*Marcelo/.test(txtPt), true);

/* Palavra portuguesa presa no gerador e impressa na folha em inglês. Já
 * aconteceu: o desenhador de figuras escrevia "Figura fora de escala." cravado,
 * e a folha inglesa saiu com a frase portuguesa.
 *
 * As marcas têm que ser INEQUÍVOCAS. A primeira versão desta conferência usava
 * "Exerc" e acusava a folha inglesa por causa da palavra "Exercises": "Exerc" é
 * prefixo das duas línguas. Marca ambígua produz alarme falso, e alarme falso
 * aqui é exatamente o que treina a ignorar o alarme. */
['Gabarito', 'Material de estudo', 'Aluno:', 'Figura fora de escala'].forEach(function (palavra) {
  conf('a folha em inglês não imprime "' + palavra + '"',
    txtEn.indexOf('(' + palavra) >= 0 || txtEn.indexOf(palavra + ')') >= 0, false);
});

/* Todo caractere escrito tem que ser desenhável. É a mesma trava que o
 * verificar.py aplica na fonte dos temas, aqui aplicada na SAÍDA, que é o que a
 * aluna recebe. */
if (typeof PDFGen.caracteresQueNaoDesenha === 'function') {
  const escritos = [];
  const rx = /Td \(((?:[^()\\]|\\.)*)\) Tj/g;
  let m;
  while ((m = rx.exec(txtPt))) escritos.push(m[1]);
  const ruins = PDFGen.caracteresQueNaoDesenha(escritos.join(' '));
  conf('nenhum caractere indesenhável na folha gerada', ruins.length, 0);
}

console.log('\n' + '='.repeat(60));
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
