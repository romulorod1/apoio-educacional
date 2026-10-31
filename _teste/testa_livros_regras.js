/* testa_livros_regras.js
 *
 * As regras dos livros que não precisam de navegador (Node 18+, que tem Blob,
 * DecompressionStream e crypto como o Chrome do tablet). Roda no --rapido.
 *
 * Revisão do C15.1:
 *   1. o pacote CORTADO (o download que parou no meio) é recusado já na
 *      espiada, com a frase do download, e sem ler o arquivo inteiro: a maior
 *      leitura é a cauda do zip, e não o arquivo;
 *   2. o teto do aplicativo é 160 MB por livro, dos dois lados da fronteira, e
 *      a frase da recusa não manda trocar por versão mais leve.
 *
 * Modos envenenados (cada um tem de reprovar a trava dele):
 *   --envenenado-cortado-le-tudo  a espiada volta a engolir o erro do pacote
 *                                 cortado (devolve null), e o caminho de
 *                                 sempre leria o arquivo inteiro.
 *   --envenenado-teto-antigo      o teto do aplicativo de volta a 40 MB.
 *
 *   node _teste/testa_livros_regras.js [--envenenado-...]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const Module = require('module');
const Sintetico = require('./_pacote_sintetico.js');

const RAIZ = path.join(__dirname, '..');
const VENENOS = ['--envenenado-cortado-le-tudo', '--envenenado-teto-antigo'];
const MODO = VENENOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';

let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + String(obtido).slice(0, 300) + ' | esperado: ' + esperado + ']'));
  return ok;
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

/* Um arquivo do repositório, com uma troca (a do veneno), carregado como
 * módulo do próprio lugar: o require('./zip.js') de dentro continua achando o
 * zip.js de verdade. A troca tem de existir exatamente uma vez. */
function carregar(nome, troca) {
  const caminho = path.join(RAIZ, nome);
  let texto = fs.readFileSync(caminho, 'utf8');
  if (troca) {
    const vezes = texto.split(troca[0]).length - 1;
    if (!conf('o ponto do veneno existe uma vez em ' + nome, vezes, 1)) process.exit(1);
    texto = texto.split(troca[0]).join(troca[1]);
  }
  const m = new Module(caminho, module);
  m.filename = caminho;
  m.paths = Module._nodeModulePaths(path.dirname(caminho));
  m._compile(texto, caminho);
  return m.exports;
}

const RELANCA_CORTADO = "if (e && e.cortado) throw Recusa(e.message, 'download');";
const TETO = 'var TETO_POR_LIVRO = 160 * 1024 * 1024;';
const troca = MODO === '--envenenado-cortado-le-tudo' ? [RELANCA_CORTADO, '']
  : MODO === '--envenenado-teto-antigo' ? [TETO, 'var TETO_POR_LIVRO = 40 * 1024 * 1024;'] : null;
const Biblioteca = carregar('biblioteca.js', troca);

(async () => {
  // ------------------------------------------------------------------
  secao('1. O pacote cortado é recusado na espiada, sem ler o arquivo inteiro');
  const manifest = Buffer.from(JSON.stringify({ esquema: 1, pacote: 'livros-prova', versao: 1, conteudo: 'livros', arquivos: {} }));
  const livro = Buffer.alloc(3 * 1024 * 1024, 7);    // 3 MB: bem maior que a cauda que a espiada lê
  const inteiro = Sintetico.montarZip([{ nome: 'manifest.json', dados: manifest, metodo: 0 },
    { nome: 'livros/um-livro.pdf', dados: livro, metodo: 0 }]);
  const cortado = inteiro.subarray(0, Math.floor(inteiro.length * 0.6));
  // toda leitura de Blob é medida: a espiada só pode ler a cauda e o começo
  let maior = 0, leituras = 0;
  const ab = Blob.prototype.arrayBuffer;
  Blob.prototype.arrayBuffer = function () { maior = Math.max(maior, this.size); leituras++; return ab.call(this); };
  // o controle: o pacote inteiro é espiado, e o contador enxerga as leituras
  const espiado = await Biblioteca.espiarPacote(new Blob([inteiro])).catch(e => e);
  conf('o pacote inteiro é espiado (manifest lido)', !!(espiado && espiado.manifest && espiado.manifest.pacote === 'livros-prova'), true);
  conf('o contador viu as leituras da espiada', leituras > 0 && maior > 0, true);
  maior = 0; leituras = 0;
  let resultado;
  try { resultado = { valor: await Biblioteca.espiarPacote(new Blob([cortado])) }; } catch (e) { resultado = { erro: e }; }
  Blob.prototype.arrayBuffer = ab;
  console.log('   cortado: ' + cortado.length + ' bytes; maior leitura ' + maior + ' bytes em ' + leituras + ' leituras; ' +
    (resultado.erro ? 'recusa: ' + resultado.erro.message : 'devolveu ' + JSON.stringify(resultado.valor)));
  if (MODO === '--envenenado-cortado-le-tudo') {
    secao('VENENO: a espiada engole o pacote cortado');
    conf('envenenado: a espiada não recusou, e o caminho de sempre leria o arquivo inteiro (defeito enxergado)',
      !resultado.erro && resultado.valor === null, true);
  } else {
    conf('o pacote cortado é recusado já na espiada', !!resultado.erro && resultado.erro.recusa === true, true);
    conf('como download pela metade (a tela manda baixar de novo)', resultado.erro && resultado.erro.tipo, 'download');
    conf('com a frase clara', /chegou cortado/.test(resultado.erro && resultado.erro.message), true);
    conf('e sem ler o arquivo inteiro (a maior leitura é a cauda, menos de 70 KB)', maior > 0 && maior < 70 * 1024 && maior < cortado.length / 10, true);
  }
  // o que não é zip continua sendo "não é pacote", e não "cortado"
  const naoZip = await Biblioteca.espiarPacote(new Blob([Buffer.alloc(5000, 65)])).catch(e => e);
  conf('um arquivo que não é zip não vira "pacote cortado"', naoZip === null, true);

  // ------------------------------------------------------------------
  secao('2. O teto do aplicativo: 160 MB por livro, dos dois lados');
  const MB = 1024 * 1024;
  /* Um pacote de mentira, só com o diretório: o teto é conferido ANTES de ler
   * livro nenhum, pelo tamanho que o diretório do zip diz. Com o livro no teto
   * exato, a importação passa do teto e falha depois, ao ler o arquivo (que
   * aqui não existe): a falha não pode ser a do teto. */
  function espiadoCom(tamanho) {
    const nome = 'livros/um-livro.pdf';
    const hash = 'sha256:' + '0'.repeat(64);
    return {
      zip: { arquivo: new Blob([Buffer.alloc(64)]), entradas: [
        { nome: 'manifest.json', metodo: 8, crc: 0, comprimido: 10, tamanho: 10, local: 0 },
        { nome: nome, metodo: 0, crc: 0, comprimido: tamanho, tamanho: tamanho, local: 0 }] },
      manifest: { esquema: 1, pacote: 'livros-prova', versao: 1, conteudo: 'livros', arquivos: { [nome]: hash },
        livros: [{ id: 'um-livro', arquivo: nome, formato: 'pdf', titulo: 'Um livro', hash: hash, paginas: 10, sumario: [] }] }
    };
  }
  const acima = await Biblioteca.abrirLivrosDoArquivo(espiadoCom(160 * MB + 1)).then(() => null, e => e);
  const noTeto = await Biblioteca.abrirLivrosDoArquivo(espiadoCom(160 * MB)).then(() => null, e => e);
  const doTamanhoAntigo = await Biblioteca.abrirLivrosDoArquivo(espiadoCom(100 * MB)).then(() => null, e => e);
  console.log('   acima: ' + (acima && acima.message) + '\n   no teto: ' + (noTeto && noTeto.message));
  const doTeto = e => !!e && /acima do teto/.test(e.message);
  if (MODO === '--envenenado-teto-antigo') {
    secao('VENENO: o teto antigo de 40 MB');
    conf('envenenado: um livro de 100 MB é recusado pelo teto (defeito enxergado)', doTeto(doTamanhoAntigo), true);
  } else {
    conf('um livro de 160 MB e um byte é recusado pelo teto', doTeto(acima), true);
    conf('com a frase do teto de 160 MB', /acima do teto de 160 MB por livro/.test(acima && acima.message), true);
    conf('sem mandar trocar por versão mais leve', /mais leve/.test(acima && acima.message), false);
    conf('o livro de 160 MB exatos passa do teto (a falha, se houver, é outra)', doTeto(noTeto), false);
    conf('e o de 100 MB também', doTeto(doTamanhoAntigo), false);
    conf('o teto exportado é 160 MB', Biblioteca.TETO_POR_LIVRO, 160 * MB);
  }

  console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
