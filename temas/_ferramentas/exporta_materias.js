#!/usr/bin/env node
/* Exporta a tabela de matérias do core.js para o Python.
 *
 * O verificador e o gerador do banco são em Python e não conseguem ler o
 * core.js. Em vez de uma segunda tabela escrita à mão, que é exatamente o que
 * deixou o aplicativo com quatro vocabulários de matéria, a cópia é GERADA
 * daqui e conferida pelo _teste/testa_materias.js: se alguém editar o
 * materias.json à mão, ou editar o core.js e esquecer de rodar isto, o portão
 * reprova.
 *
 *   node temas/_ferramentas/exporta_materias.js            escreve materias.json
 *   node temas/_ferramentas/exporta_materias.js --confere  só compara, sem escrever
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..');
const SAIDA = path.join(__dirname, 'materias.json');
const Core = require(path.join(RAIZ, 'core.js'));

/* Só o que o Python precisa, com as chaves em ordem fixa para o arquivo não
 * mudar de byte a cada exportação. */
function exportavel() {
  return Core.MATERIAS.map(function (m) {
    const t = m.temas;
    return {
      id: m.id,
      rotulo: m.rotulo,
      topicos: m.topicos || null,
      temas: t ? {
        pasta: t.pasta,
        prefixo: t.prefixo,
        raiz: t.raiz,
        linguas: t.linguas.slice(),
        unidades: t.unidades,
        citacao: !!t.citacao
      } : null
    };
  });
}

const texto = JSON.stringify({ origem: 'core.js, via exporta_materias.js', materias: exportavel() }, null, 2) + '\n';

if (process.argv.indexOf('--confere') !== -1) {
  const atual = fs.existsSync(SAIDA) ? fs.readFileSync(SAIDA, 'utf8').replace(/\r\n/g, '\n') : '';
  if (atual === texto) {
    console.log('materias.json bate com o core.js');
    process.exit(0);
  }
  console.log('materias.json NAO bate com o core.js: rode node temas/_ferramentas/exporta_materias.js');
  process.exit(1);
}

fs.writeFileSync(SAIDA, texto);
console.log('escrito ' + path.relative(RAIZ, SAIDA) + ' com ' + Core.MATERIAS.length + ' matérias, ' +
  Core.MATERIAS.filter(m => m.temas).length + ' com banco de temas');
