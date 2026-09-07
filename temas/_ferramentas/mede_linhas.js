/* Mede cada linha de um arquivo de texto com a Helvetica do pdf.js e aponta as que
 * passam da largura do bloco de citação (LARGURA_CITACAO, 473,28 pt). Uso:
 *   node mede_linhas.js arquivo.txt [arquivo2.txt ...]
 * Usa o pdf.js do diretório principal (só medir, que não muda). */
const fs = require('fs');
const P = require(require('path').join(__dirname, '..', '..', 'pdf.js'));
const LARG = 555.2756 - (40 + 36) - 6;
let ruins = 0, total = 0, maior = 0;
for (const arq of process.argv.slice(2)) {
  const linhas = fs.readFileSync(arq, 'utf8').split(/\r?\n/);
  let corpo = false, n = 0;
  linhas.forEach(function (l, i) {
    if (l.trim() === '---') { corpo = !corpo && i > 0 ? true : corpo; if (i === 0) corpo = false; return; }
    if (!corpo && i > 0) return;
    if (!l.trim()) return;
    n++; total++;
    const w = P.medirRico(l, 10, false);
    if (w > maior) maior = w;
    if (w > LARG) { ruins++; console.log('  LARGA  ' + arq + ':' + (i + 1) + '  ' + w.toFixed(1) + ' pt (' + (w - LARG).toFixed(1) + ' a mais): ' + l.slice(0, 60)); }
    if (/\t/.test(l)) console.log('  TAB    ' + arq + ':' + (i + 1));
  });
  console.log(arq + ': ' + n + ' linhas numeradas');
}
console.log('largura maior: ' + maior.toFixed(1) + ' pt de ' + LARG.toFixed(1) + '; ' + (total - ruins) + ' passaram, ' + ruins + ' falharam.');
