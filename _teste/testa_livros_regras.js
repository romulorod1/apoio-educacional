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
 * C15.2 e C15.3 (biblioteca.js, sem tela):
 *   3. o mapa que vale é o do pacote com a correção dela por cima, só no
 *      capítulo de mesmo número e título; o capítulo de cada página;
 *   4. "Abrir no livro": só os livros do ano com o assunto no mapa (com as
 *      correções), um por capítulo; sem ano, nenhum filtro.
 *
 * Modos envenenados (cada um tem de reprovar a trava dele):
 *   --envenenado-cortado-le-tudo  a espiada volta a engolir o erro do pacote
 *                                 cortado (devolve null), e o caminho de
 *                                 sempre leria o arquivo inteiro.
 *   --envenenado-teto-antigo      o teto do aplicativo de volta a 40 MB.
 *   --envenenado-sem-ano          o "Abrir no livro" ignora o ano do livro.
 *   --envenenado-correcao-ignorada  a correção dela não vale.
 *   --envenenado-correcao-sem-titulo  a correção vale sem conferir o título
 *                                 (a velha cai no capítulo renumerado).
 *
 *   node _teste/testa_livros_regras.js [--envenenado-...]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const Module = require('module');
const Sintetico = require('./_pacote_sintetico.js');

const RAIZ = path.join(__dirname, '..');
const VENENOS = ['--envenenado-cortado-le-tudo', '--envenenado-teto-antigo', '--envenenado-sem-ano',
  '--envenenado-correcao-ignorada', '--envenenado-correcao-sem-titulo'];
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
const FILTRO_DE_ANO = 'if (!ano) return true;';
const CORRECAO_VALE = 'var vale = !!c && c.titulo === e.titulo && Array.isArray(c.assuntos);';
const TROCAS = {
  '--envenenado-cortado-le-tudo': [RELANCA_CORTADO, ''],
  '--envenenado-teto-antigo': [TETO, 'var TETO_POR_LIVRO = 40 * 1024 * 1024;'],
  '--envenenado-sem-ano': [FILTRO_DE_ANO, 'return true;'],
  '--envenenado-correcao-ignorada': [CORRECAO_VALE, 'var vale = false;'],
  '--envenenado-correcao-sem-titulo': [CORRECAO_VALE, 'var vale = !!c && Array.isArray(c.assuntos);']
};
const troca = TROCAS[MODO] || null;
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

  // ------------------------------------------------------------------
  secao('3. O mapa (C15.2): o do pacote com a correção dela por cima');
  const pdf = (series, mapa) => ({ formato: 'pdf', titulo: 'x', series: series, mapa: mapa });
  const cap = (n, titulo, ini, fim, ids, origem) => ({ n, titulo, pagina: ini, pagina_fim: fim,
    assuntos: ids.map(id => ({ id, confianca: origem === 'auto' ? 'auto' : 'alta' })), origem: origem || 'mapa' });
  const metaD = pdf(['06'], [cap(1, 'Frações', 1, 10, ['MAT06-05'], 'auto'), cap(2, 'Decimais', 11, 20, ['MAT06-07'], 'auto'),
    cap(3, 'Geometria plana', 21, 30, [], 'auto')]);
  const correcoesD = {
    1: { titulo: 'Frações', assuntos: ['MAT06-06'], acao: 'corrigiu' },
    2: { titulo: 'Decimais', assuntos: ['MAT06-07'], acao: 'confirmou' },
    // correção velha, de um sumário em que o capítulo 3 tinha outro título: não vale
    3: { titulo: 'Capítulo que mudou de nome', assuntos: ['MAT06-11'], acao: 'corrigiu' }
  };
  const mD = Biblioteca.mapaDoLivro(metaD, correcoesD);
  const resumo = m => m.map(e => e.n + ':' + e.assuntos.join('+') + ':' + e.estado).join(' ');
  console.log('   mapa com as correções: ' + resumo(mD));
  conf('sem correção, o passe automático fica a confirmar', resumo(Biblioteca.mapaDoLivro(metaD, {})),
    '1:MAT06-05:a_confirmar 2:MAT06-07:a_confirmar 3::a_confirmar');
  // nos venenos da correção, quem diz que o defeito foi enxergado é a seção 4
  if (!/correcao/.test(MODO)) {
    conf('a correção dela vale por cima do mapa, a confirmação também, e a de título velho não',
      resumo(mD), '1:MAT06-06:corrigido 2:MAT06-07:confirmado 3::a_confirmar');
  }
  conf('o mapa do pacote não mudou', metaD.mapa[0].assuntos.map(a => a.id).join(','), 'MAT06-05');
  const metaOrq = pdf(['06'], [cap(1, 'Unidade A', 1, 2, ['MAT06-05'])]);
  conf('o mapa da orquestradora sem palavra dela fica "do mapa"', resumo(Biblioteca.mapaDoLivro(metaOrq, null)), '1:MAT06-05:do_mapa');
  conf('o capítulo da página 10 é o 1, o da 11 é o 2, a 31 fica fora',
    [10, 11, 31].map(p => (Biblioteca.entradaDoMapa(mD, 'pdf', p) || { n: '-' }).n).join(','), '1,2,-');
  const epubMapa = Biblioteca.mapaDoLivro({ formato: 'epub', mapa: [{ n: 1, titulo: 'Obra', capitulo: 1, capitulo_fim: 3,
    obra_inteira: true, assuntos: [{ id: 'LITEM2-T02' }], origem: 'mapa' }] }, {});
  conf('no EPUB, a parte 3 está na obra inteira (1 a 3), a 4 não',
    [3, 4].map(c => (Biblioteca.entradaDoMapa(epubMapa, 'epub', c) || { n: '-' }).n).join(','), '1,-');

  secao('4. "Abrir no livro" (C15.3): os livros do ano com o assunto');
  const livros = [
    { id: 'a-sexto', meta: Object.assign(pdf(['06'], [cap(1, 'Frações', 1, 9, ['MAT06-05'])]), { titulo: 'A do sexto' }) },
    { id: 'b-setimo', meta: Object.assign(pdf(['07'], [cap(1, 'Revisão de frações', 1, 9, ['MAT06-05'])]), { titulo: 'B do sétimo' }) },
    { id: 'c-sem-ano', meta: Object.assign(pdf([], [cap(1, 'Frações', 1, 9, ['MAT06-05'])]), { titulo: 'C sem ano' }) },
    { id: 'd-corrigido', meta: Object.assign(metaD, { titulo: 'D corrigido' }) },
    { id: 'e-dois', meta: Object.assign(pdf(['06'], [cap(1, 'Frações I', 1, 9, ['MAT06-05']), cap(2, 'Frações II', 10, 19, ['MAT06-05'])]), { titulo: 'E dois capítulos' }) }
  ];
  const correcoes = { 'd-corrigido': correcoesD };
  const quem = (id, ano) => Biblioteca.livrosComAssunto(livros, correcoes, id, ano).map(a => a.id + '#' + a.entrada.n).join(' ');
  const do6 = quem('MAT06-05', '06');
  console.log('   MAT06-05 no 6º ano: ' + do6);
  if (MODO === '--envenenado-sem-ano') {
    secao('VENENO: o "Abrir no livro" que ignora o ano');
    conf('envenenado: o livro do 7º e o sem ano aparecem para o aluno do 6º (defeito enxergado)',
      /b-setimo/.test(do6) && /c-sem-ano/.test(do6), true);
  } else if (MODO === '--envenenado-correcao-ignorada') {
    secao('VENENO: a correção dela ignorada');
    conf('envenenado: o livro corrigido continua aparecendo pelo mapa velho (defeito enxergado)', /d-corrigido/.test(do6), true);
  } else if (MODO === '--envenenado-correcao-sem-titulo') {
    secao('VENENO: a correção vale sem conferir o título do capítulo');
    conf('envenenado: a correção velha do capítulo 3 tomou o capítulo novo (defeito enxergado)',
      resumo(Biblioteca.mapaDoLivro(metaD, correcoesD)).indexOf('3:MAT06-11:corrigido') >= 0, true);
  } else {
    conf('para o aluno do 6º: só os livros do 6º com o assunto, um por capítulo, sem o corrigido',
      do6, 'a-sexto#1 e-dois#1 e-dois#2');
    conf('o livro do 7º (série vizinha) aparece para o aluno do 7º', quem('MAT06-05', '07'), 'b-setimo#1');
    conf('a correção dela leva o livro para o assunto escolhido', quem('MAT06-06', '06'), 'd-corrigido#1');
    conf('e o capítulo confirmado continua', quem('MAT06-07', '06'), 'd-corrigido#2');
    conf('sem ano nenhum, não há o que filtrar', quem('MAT06-05', null), 'a-sexto#1 b-setimo#1 c-sem-ano#1 e-dois#1 e-dois#2');
    conf('assunto que nenhum livro tem: lista vazia (o botão não aparece)', quem('MAT06-13', '06'), '');
    conf('a entrada leva a página do começo do capítulo', Biblioteca.livrosComAssunto(livros, correcoes, 'MAT06-05', '06')[2].entrada.pagina, 10);
  }

  console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
