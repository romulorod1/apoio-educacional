const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let res = [];
  if (!fs.existsSync(dir)) return res;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) res = res.concat(getFiles(full));
    else if (e.name.endsWith('.json')) res.push(full);
  }
  return res;
}

function limparTexto(str) {
  if (typeof str !== 'string') return str;

  return str
    // 1. Remover menções "DICA NINJA DA NATH"
    .replace(/💡\s*DICA NINJA DA NATH:?\s*/gi, '💡 Dica de Fixação: ')
    .replace(/DICA NINJA DA NATH:?\s*/gi, 'Dica de Fixação: ')
    .replace(/DICA NINJA:?\s*/gi, 'Dica de Fixação: ')

    // 2. Limpar comandos LaTeX para notação limpa e legível do app
    .replace(/\\log_b\(a\) = x \\iff b\^x = a, com logaritmando a > 0 e base b > 0 com b != 1\. As propriedades operatórias essenciais são: \\log_b\(xy\) = \\log_b\(x\) \+ \\log_b\(y\); \\log_b\(x\/y\) = \\log_b\(x\) - \\log_b\(y\); \\log_b\(x\^k\) = k \\cdot \\log_b\(x\); Mudança de base: \\log_b\(a\) = \\frac\{\\log_c\(a\)\}\{\\log_c\(b\)\}\./g,
      'log_{b}(a) = x ⇔ b^{x} = a, com logaritmando a > 0 e base b > 0 com b ≠ 1. As propriedades operatórias essenciais são: log_{b}(x · y) = log_{b}(x) + log_{b}(y); log_{b}(x / y) = log_{b}(x) - log_{b}(y); log_{b}(x^{k}) = k · log_{b}(x); Mudança de base: log_{b}(a) = log_{c}(a) / log_{c}(b).')

    // Regras gerais de substituição de LaTeX
    .replace(/\\iff/g, '⇔')
    .replace(/\\implies/g, '⇒')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\pm/g, '±')
    .replace(/\\pi/g, 'π')
    .replace(/\\theta/g, 'θ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\omega/g, 'ω')
    .replace(/\\rho/g, 'ρ')
    .replace(/\\sum/g, 'Σ')
    .replace(/\\approx/g, '≈')
    .replace(/\\sin/g, 'sen')
    .replace(/\\cos/g, 'cos')
    .replace(/\\tan/g, 'tg')
    .replace(/\\arg/g, 'arg')
    .replace(/\\bar\{([^}]+)\}/g, '$1*')
    // \frac{A}{B}
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / ($2)')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1) / ($2)')
    .replace(/\\frac/g, '')
    // \sqrt{A}
    .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')
    .replace(/\\sqrt/g, '√')
    // \log_b(x)
    .replace(/\\log_([a-zA-Z0-9]+)\(([^)]+)\)/g, 'log_{$1}($2)')
    .replace(/\\log_\{([^}]+)\}\(([^)]+)\)/g, 'log_{$1}($2)')
    .replace(/\\log_([a-zA-Z0-9]+)/g, 'log_{$1}')
    .replace(/\\log_\{([^}]+)\}/g, 'log_{$1}')
    .replace(/\\log/g, 'log')
    // simplificar frações como ((1 + i)^8)/((1 - i)^4) -> (1 + i)^{8} / (1 - i)^{4}
    .replace(/\(\(([^\)]+)\)\)\/\(\(([^\)]+)\)\)/g, '($1) / ($2)')
    .replace(/\(([a-zA-Z0-9]+)\)\/\(([a-zA-Z0-9]+)\)/g, '$1 / $2');
}

function processarObjeto(obj) {
  if (!obj) return obj;
  if (typeof obj === 'string') {
    return limparTexto(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(processarObjeto);
  }
  if (typeof obj === 'object') {
    const res = {};
    for (const k of Object.keys(obj)) {
      let novaChave = k;
      if (k === 'dica_ninja') {
        novaChave = 'dica_fixacao';
      }
      res[novaChave] = processarObjeto(obj[k]);
      // manter dica_ninja como alias para retrocompatibilidade
      if (k === 'dica_ninja') {
        res.dica_ninja = res.dica_fixacao;
      }
    }
    return res;
  }
  return obj;
}

// 1. Processar arquivos no Google Drive
const driveDir = 'H:/My Drive/Vida Pessoal/Família/Material pra Nath/Aplicativo/Base de Dados';
const driveFiles = getFiles(driveDir);
console.log(`Processando ${driveFiles.length} arquivos no Google Drive...`);

let modificadosDrive = 0;
driveFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const parsed = JSON.parse(content);
  const processado = processarObjeto(parsed);
  const novoJson = JSON.stringify(processado, null, 2);
  if (novoJson !== content) {
    fs.writeFileSync(f, novoJson, 'utf8');
    modificadosDrive++;
  }
});
console.log(`${modificadosDrive} arquivos atualizados no Google Drive.`);

// 2. Processar lote1_matematica.js e adicionar_mapas_mentais.js
const pMapas = path.join(__dirname, 'adicionar_mapas_mentais.js');
if (fs.existsSync(pMapas)) {
  let c = fs.readFileSync(pMapas, 'utf8');
  c = c.replace(/💡\s*DICA NINJA DA NATH:?\s*/g, '💡 Dica de Fixação: ')
       .replace(/DICA NINJA DA NATH:?\s*/g, 'Dica de Fixação: ')
       .replace(/DICA NINJA:?\s*/g, 'Dica de Fixação: ')
       .replace(/dica_ninja:/g, 'dica_fixacao:');
  fs.writeFileSync(pMapas, c, 'utf8');
  console.log('adicionar_mapas_mentais.js limpo.');
}

const pLote1 = path.join(__dirname, 'expansao/lote1_matematica.js');
if (fs.existsSync(pLote1)) {
  let c = fs.readFileSync(pLote1, 'utf8');
  c = limparTexto(c);
  fs.writeFileSync(pLote1, c, 'utf8');
  console.log('lote1_matematica.js limpo.');
}

console.log('Limpeza concluída com sucesso!');
