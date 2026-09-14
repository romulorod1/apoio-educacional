const fs = require('fs');
const path = require('path');

const baseDir = 'H:/My Drive/Vida Pessoal/Família/Material pra Nath/Aplicativo/Base de Dados';

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) results = results.concat(getFiles(full));
    else if (file.endsWith('.json')) results.push(full);
  });
  return results;
}

const files = getFiles(baseDir);
console.log('Total files found:', files.length);

let errors = 0;
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  try {
    JSON.parse(content);
  } catch (e) {
    errors++;
    console.error('ERRO em ' + f + ':\n' + e.message);
  }
});

console.log('Arquivos com erro de JSON:', errors);
