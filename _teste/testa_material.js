/* Gera o PDF de um tema de verdade e confere o resultado. */
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');

const banco = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'temas', 'banco.json'), 'utf8'));
const tema = banco.temas.find(t => t.id === 'MAT06-05');
console.log('tema:', tema.pt.titulo, '|', tema.pt.exercicios.length, 'exercicios');

function gerar(nome, op) {
  const bytes = PDFGen.gerarMaterialTema(Object.assign({ tema }, op));
  fs.writeFileSync(path.join(__dirname, nome), bytes);
  console.log('  ' + nome + ': ' + Math.round(bytes.length / 1024) + ' KB');
  return bytes;
}

gerar('tema_completo.pdf', { lingua: 'pt', incluirMaterial: true, incluirLista: true, incluirGabarito: true, aluno: 'Marcelo', data: '10/06/2026' });
gerar('tema_so_lista.pdf', { lingua: 'pt', incluirLista: true, aluno: 'Marcelo', espacoParaResposta: 26 });
gerar('tema_selecao.pdf', { lingua: 'pt', incluirLista: true, incluirGabarito: true, escolhidos: [1, 8, 13, 17, 18] });
gerar('tema_ingles.pdf', { lingua: 'en', incluirMaterial: true, incluirLista: true });
