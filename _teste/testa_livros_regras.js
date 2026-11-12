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
 *   --envenenado-respostas-no-capitulo  o capítulo exportado leva as páginas
 *                                 de respostas do livro junto, mesmo sem o
 *                                 gabarito pedido.
 *   --envenenado-fim-do-capitulo-tira  o gabarito do fim do capítulo (achado
 *                                 só pelo lugar) volta a tirar a página do
 *                                 capítulo exportado.
 *
 * C15.4 e C15.5 (biblioteca.js, sem tela):
 *   5. o que vai no PDF exportado: o capítulo sem as respostas do livro, e o
 *      gabarito DAQUELE capítulo depois, só quando pedido e localizado;
 *      gabarito fora do livro não vale; as páginas escolhidas ("3-5, 8"); o
 *      rodapé de fonte, sem travessão.
 *
 * O sumário que a tela usa (biblioteca.js, sumarioDoLivro, sem tela):
 *   6. marcadores lixo ("page1..page40", "Blank Page", nome de arquivo)
 *      e sumário vazio dão lugar ao mapa; marcadores bons, livro sem mapa,
 *      EPUB e mapa feito do próprio lixo ficam como estão; a fronteira da
 *      metade, dos dois lados.
 *   --envenenado-sumario-dos-marcadores  sumarioDoLivro devolve sempre o
 *                                 sumário do pacote, como a main antes do
 *                                 conserto: os "pageN" continuam.
 *   6b. diante de marcadores, só um mapa de verdade os substitui: 2 capítulos
 *      ou mais, cobrindo pelo menos 25% das páginas. O Praticando 9 (lixo e
 *      1 entrada boa de 5%) fica; Teláris e Matemática e Realidade trocam;
 *      o vazio com 1 entrada troca; a fronteira de 24% e 25%, e de 1 e 2
 *      capítulos.
 *   --envenenado-mapa-parcial-troca  sem a exigência de 2 capítulos e 25%:
 *                                 o Praticando 9 perde os marcadores.
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
  '--envenenado-correcao-ignorada', '--envenenado-correcao-sem-titulo', '--envenenado-respostas-no-capitulo',
  '--envenenado-fim-do-capitulo-tira', '--envenenado-sumario-dos-marcadores', '--envenenado-mapa-parcial-troca'];
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
const TIRA_AS_RESPOSTAS = 'var semRespostas = todas.filter(function (u) { return respostas.indexOf(u) < 0; });';
const SUMARIO_DO_MAPA = 'if (!doMapa) return sumario;';
const SO_MAPA_DE_VERDADE = 'if (caps.length < MINIMO_DE_CAPITULOS_DO_MAPA || coberturaDoMapa(meta, caps) < COBERTURA_MINIMA_DO_MAPA) return false;';
const GAB_SO_DO_LIVRO = "var doLivro = g && g.como !== 'fim_do_capitulo' ? g.faixas : [];";
const TROCAS = {
  '--envenenado-cortado-le-tudo': [RELANCA_CORTADO, ''],
  '--envenenado-teto-antigo': [TETO, 'var TETO_POR_LIVRO = 40 * 1024 * 1024;'],
  '--envenenado-sem-ano': [FILTRO_DE_ANO, 'return true;'],
  '--envenenado-correcao-ignorada': [CORRECAO_VALE, 'var vale = false;'],
  '--envenenado-correcao-sem-titulo': [CORRECAO_VALE, 'var vale = !!c && Array.isArray(c.assuntos);'],
  '--envenenado-respostas-no-capitulo': [TIRA_AS_RESPOSTAS, 'var semRespostas = todas;'],
  '--envenenado-fim-do-capitulo-tira': [GAB_SO_DO_LIVRO, 'var doLivro = g ? g.faixas : [], doFim = [];'],
  '--envenenado-sumario-dos-marcadores': [SUMARIO_DO_MAPA, 'return sumario;'],
  '--envenenado-mapa-parcial-troca': [SO_MAPA_DE_VERDADE, '']
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

  secao('5. Exportar o capítulo (C15.4) e o gabarito dele (C15.5)');
  // capítulos 1 a 3 nas páginas 1-2, 3-4 e 5-6; "Respostas" 7-9 com o gabarito de cada um
  const gab = (p) => ({ paginas: p, certeza: 'alta', como: 'fim_do_livro' });
  const metaG = { formato: 'pdf', paginas: 9, titulo: 'Livro com gabarito', volume: 'Volume 2', autoria: 'Autora de Prova',
    editora: 'Editora de Prova', ano: 2026, gabarito_origem: 'auto', gabarito_secoes: [[7, 9]],
    mapa: [Object.assign(cap(1, 'Capítulo 1: Números naturais', 1, 2, []), { gabarito: gab([[7, 7]]) }),
      Object.assign(cap(2, 'Capítulo 2: Frações', 3, 4, []), { gabarito: gab([[8, 8]]) }),
      Object.assign(cap(3, 'Capítulo 3: Geometria plana', 5, 6, []), { gabarito: gab([[9, 9]]) }),
      cap(4, 'Respostas', 7, 9, [])] };
  const mG = Biblioteca.mapaDoLivro(metaG, {});
  const partes = (n, com) => { const p = Biblioteca.partesDoCapitulo(metaG, mG[n - 1], com); return p.capitulo.join(',') + '|' + p.gabarito.join(','); };
  conf('o capítulo 2 com o gabarito: as páginas 3 e 4, depois a 8 (a dele, e não a 7 do capítulo 1)', partes(2, true), '3,4|8');
  conf('sem o gabarito: só as páginas do capítulo', partes(2, false), '3,4|');
  conf('o "Respostas" do sumário, que é só respostas, vai como está', partes(4, true), '7,8,9|');
  conf('livro com gabarito localizado', Biblioteca.livroTemGabarito(metaG), true);
  // o último capítulo do sumário vai até o fim do livro: as respostas saem dele
  const metaFim = Object.assign({}, metaG, { mapa: [Object.assign(cap(1, 'Capítulo 1', 1, 9, []), { gabarito: gab([[8, 9]]) })] });
  const pFim = Biblioteca.partesDoCapitulo(metaFim, Biblioteca.mapaDoLivro(metaFim, {})[0], false);
  if (MODO === '--envenenado-respostas-no-capitulo') {
    secao('VENENO: as páginas de respostas ficam dentro do capítulo');
    conf('envenenado: o capítulo sem gabarito levou as respostas junto (defeito enxergado)', pFim.capitulo.join(','), '1,2,3,4,5,6,7,8,9');
  } else {
    conf('capítulo que vai até o fim do livro: sem o gabarito, as respostas do livro ficam de fora', pFim.capitulo.join(','), '1,2,3,4,5,6');
  }
  // revisão do C15.5: o gabarito do FIM do capítulo (achado só pelo lugar) nunca tira página do capítulo
  const fimCap = secoes => ({ formato: 'pdf', paginas: 9, gabarito_origem: 'auto', gabarito_secoes: secoes,
    mapa: [Object.assign(cap(1, 'Capítulo 1', 1, 4, []), { gabarito: { paginas: [[4, 4]], certeza: 'média', como: 'fim_do_capitulo' } })] });
  const pFimCap = m => { const x = Biblioteca.partesDoCapitulo(m, Biblioteca.mapaDoLivro(m, {})[0], true); return x.capitulo.join(',') + '|' + x.gabarito.join(','); };
  const fimNovo = pFimCap(fimCap([])), fimVelho = pFimCap(fimCap([[4, 4]]));
  if (MODO === '--envenenado-fim-do-capitulo-tira') {
    secao('VENENO: o gabarito do fim do capítulo tira a página do capítulo');
    conf('envenenado: a página 4 saiu do capítulo (defeito enxergado)', fimNovo + ' ' + fimVelho, '1,2,3|4 1,2,3|4');
  } else {
    conf('gabarito do fim do capítulo: o capítulo vai inteiro, e o gabarito só acrescenta (pacote novo e antigo)',
      fimNovo + ' ' + fimVelho, '1,2,3,4|4 1,2,3,4|4');
  }
  // o tamanho estimado: o aviso de 20 MB dos dois lados da fronteira
  const passa = n => Biblioteca.estimarPdfExportado('pdf', n) > Biblioteca.AVISO_DE_TAMANHO_EXPORTADO;
  conf('o aviso de 20 MB: 40 páginas não passam, 41 passam; 130 partes de EPUB não passam',
    [passa(40), passa(41), Biblioteca.estimarPdfExportado('epub', 130) > Biblioteca.AVISO_DE_TAMANHO_EXPORTADO].join(','), 'false,true,false');
  const metaSem =Object.assign({}, metaG, { gabarito_origem: 'nenhum', gabarito_secoes: [], mapa: metaG.mapa.map(e => Object.assign({}, e, { gabarito: undefined })) });
  conf('livro sem gabarito localizado: nenhum capítulo leva gabarito',
    Biblioteca.livroTemGabarito(metaSem) + '|' + Biblioteca.partesDoCapitulo(metaSem, Biblioteca.mapaDoLivro(metaSem, {})[1], true).gabarito.join(','), 'false|');
  const metaFora = Object.assign({}, metaG, { mapa: [Object.assign(cap(1, 'Capítulo 1', 1, 2, []), { gabarito: gab([[7, 99]]) })] });
  conf('gabarito fora do livro não vale (o gabarito errado é pior que nenhum)', Biblioteca.mapaDoLivro(metaFora, {})[0].gabarito, null);
  const epubG = { formato: 'epub', epub: { espinha: ['a', 'b', 'c', 'd'] }, gabarito_origem: 'auto', gabarito_secoes: [[4, 4]],
    mapa: [{ n: 1, titulo: 'Parte um', capitulo: 1, capitulo_fim: 2, assuntos: [], origem: 'auto', gabarito: { partes: [[4, 4]], certeza: 'média', como: 'fim_do_livro' } }] };
  const pE = Biblioteca.partesDoCapitulo(epubG, Biblioteca.mapaDoLivro(epubG, {})[0], true);
  conf('no EPUB, por partes da espinha', pE.capitulo.join(',') + '|' + pE.gabarito.join(','), '1,2|4');

  const esc = t => { const r = Biblioteca.paginasEscolhidas(t, 9); return r.erro ? 'erro: ' + r.erro : r.paginas.join(','); };
  conf('páginas escolhidas: "3-5, 8"', esc('3-5, 8'), '3,4,5,8');
  conf('"2 a 3 e 9", repetidas e fora de ordem', esc('9; 2 a 3 e 3'), '2,3,9');
  conf('página fora do livro é recusada com a frase', esc('8-12'), 'erro: O livro vai da página 1 à 9.');
  conf('texto que não é página é recusado', esc('três'), 'erro: Não entendi "três". Escreva as páginas assim: 3-5, 8.');
  conf('mais páginas que o teto, recusado', Biblioteca.paginasEscolhidas('1-500', 600).erro, 'No máximo ' + Biblioteca.TETO_DE_PAGINAS_EXPORTADAS + ' páginas por PDF.');

  const fonte = Biblioteca.fonteDoLivro(Object.assign({}, metaG, { titulo: 'Livro ' + String.fromCharCode(0x2013) + ' com gabarito' }),
    'Capítulo 2: Frações', [3, 4], [8]);
  conf('o rodapé de fonte: título, volume, autoria, editora, ano, capítulo, páginas e as do gabarito', fonte,
    'Fonte: Livro - com gabarito, Volume 2, Autora de Prova, Editora de Prova, 2026, Capítulo 2: Frações, páginas 3 a 4; gabarito: página 8');
  conf('e nenhum travessão nem meia-risca nele', new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']').test(fonte), false);
  conf('no EPUB, as partes', Biblioteca.fonteDoLivro({ formato: 'epub', titulo: 'Livro', ano: 2026 }, 'Parte dois', [2, 3, 5], null),
    'Fonte: Livro, 2026, Parte dois, partes 2 a 3 e 5');

  secao('6. O sumário que a tela usa: marcadores lixo e sumário vazio dão lugar ao mapa');
  /* Livros SINTÉTICOS, no feitio dos pacotes reais (nenhum livro de verdade):
   * marcadores "page1..page40", "Blank Page" e nome de arquivo; o mapa com
   * capítulos titulados e páginas do arquivo. */
  const marcadores = (titulos) => titulos.map((t, i) => ({ n: i + 1, nivel: 1, titulo: t, pagina: i + 1 }));
  const paginas40 = Array.from({ length: 40 }, (_, i) => 'page' + (i + 1));
  const mapa3 = [cap(1, 'Números naturais', 3, 12, ['MAT06-02']), cap(2, 'Frações', 13, 25, ['MAT06-05']),
    cap(3, 'Geometria plana', 26, 40, [])];
  const livroPdf = (sumario, origem, mapa) => ({ formato: 'pdf', paginas: 40, titulo: 'Livro de prova', series: ['06'],
    sumario: sumario, sumario_origem: origem, mapa: mapa });
  const linha = s => s.map(e => e.n + ':' + e.titulo + '@' + e.pagina + '-' + (e.pagina_fim || '') + (e.mapa_n != null ? '#' + e.mapa_n : '')).join(' | ');

  const lixo40 = livroPdf(marcadores(paginas40), 'marcadores', mapa3);
  const sumLixo = Biblioteca.sumarioDoLivro(lixo40);
  const bons = livroPdf([{ n: 1, nivel: 1, titulo: 'Capítulo 1: Números naturais', pagina: 3 },
    { n: 2, nivel: 2, titulo: 'Leitura de números', pagina: 5 },
    { n: 3, nivel: 1, titulo: 'Capítulo 2: Frações', pagina: 13 }, { n: 4, nivel: 1, titulo: 'Sumário', pagina: 2 },
    { n: 5, nivel: 1, titulo: 'Capítulo 3: Geometria plana', pagina: 26 }], 'marcadores', mapa3);
  const semMapa = livroPdf(marcadores(paginas40), 'marcadores', []);
  const mapa22 = Array.from({ length: 22 }, (_, i) => cap(i + 1, 'Capítulo de prova ' + (i + 1), 3 + i, 3 + i, []));
  const blank = livroPdf(marcadores(['Blank Page', 'Blank Page']), 'marcadores', mapa22);
  const vazio1 = livroPdf([], 'nenhum', [cap(1, 'Volume', 31, 37, ['MAT06-05'])]);
  const vazioSemMapa = livroPdf([], 'nenhum', []);

  if (MODO === '--envenenado-sumario-dos-marcadores') {
    secao('VENENO: a tela usa sempre o sumário do pacote (o da main antes deste conserto)');
    conf('envenenado: os 40 marcadores "pageN" continuam como sumário (defeito enxergado)', sumLixo.length, 40);
    conf('envenenado: o livro sem marcadores e com mapa de 1 entrada fica sem sumário (defeito enxergado)',
      Biblioteca.sumarioDoLivro(vazio1).length, 0);
  } else {
    conf('marcadores "page1..page40" e mapa de 3 capítulos: o sumário é o do mapa', linha(sumLixo),
      '1:Números naturais@3-12#1 | 2:Frações@13-25#2 | 3:Geometria plana@26-40#3');
    conf('e o critério diz que os marcadores são inúteis', Biblioteca.sumarioDosMarcadoresInutil(lixo40), true);
    conf('controle: marcadores bons (com um "Sumário" no meio) continuam', Biblioteca.sumarioDoLivro(bons) === bons.sumario, true);
    conf('controle: sem mapa, os marcadores lixo ficam como estão', Biblioteca.sumarioDoLivro(semMapa) === semMapa.sumario, true);
    conf('"Blank Page" com 2 itens e mapa de 22 capítulos: o do mapa', Biblioteca.sumarioDoLivro(blank).length + '|' +
      Biblioteca.sumarioDoLivro(blank)[21].titulo, '22|Capítulo de prova 22');
    conf('sumário vazio e mapa de 1 entrada: o sumário é a entrada do mapa', linha(Biblioteca.sumarioDoLivro(vazio1)), '1:Volume@31-37#1');
    conf('controle: sem sumário e sem mapa, o sumário continua vazio', Biblioteca.sumarioDoLivro(vazioSemMapa).length, 0);
    conf('controle: o EPUB fica como está, mesmo com marcadores lixo',
      Biblioteca.sumarioDoLivro(Object.assign({}, lixo40, { formato: 'epub' })) === lixo40.sumario, true);
    conf('controle: sumário que já veio do mapa fica como está',
      Biblioteca.sumarioDoLivro(Object.assign({}, lixo40, { sumario_origem: 'mapa' })) === lixo40.sumario, true);
    // o mapa feito dos próprios marcadores lixo não serve: troca lixo por lixo
    const mapaLixo = livroPdf(marcadores(['GA_MAT_7_LP_4ED_PNLD24_OB1_U8_278A307_FECHADO', 'PMR9_1capa']), 'marcadores',
      [cap(1, 'GA_MAT_7_LP_4ED_PNLD24_OB1_U8_278A307_FECHADO', 1, 20, []), cap(2, 'PMR9_1capa', 21, 40, [])]);
    conf('controle: o mapa com os mesmos nomes de arquivo não substitui nada', Biblioteca.sumarioDoLivro(mapaLixo) === mapaLixo.sumario, true);
    // poucos marcadores com sentido contra um mapa grande: "Parte 1" e "Parte 2" de um livro de 17 capítulos
    const partes = livroPdf(marcadores(['Parte 1 (p.1-20)', 'Parte 2 (p.21-40)']), 'marcadores',
      Array.from({ length: 17 }, (_, i) => cap(i + 1, 'Tópico ' + (i + 1), 1 + 2 * i, 2 + 2 * i, [])));
    conf('2 marcadores com sentido e mapa de 17: menos da metade, vale o mapa', Biblioteca.sumarioDoLivro(partes).length, 17);
    // a fronteira da metade, dos dois lados
    const metade = (uteis, nCaps) => Biblioteca.sumarioDosMarcadoresInutil(livroPdf(
      marcadores(Array.from({ length: uteis }, (_, i) => 'Unidade ' + (i + 1))), 'marcadores',
      Array.from({ length: nCaps }, (_, i) => cap(i + 1, 'Cap ' + (i + 1), 1 + 4 * i, 4 + 4 * i, []))));
    conf('5 marcadores bons para 10 capítulos (a metade): ficam os marcadores', metade(5, 10), false);
    conf('4 marcadores bons para 10 capítulos (menos da metade): vale o mapa', metade(4, 10), true);
    const misto = (lixo, bons) => Biblioteca.sumarioDosMarcadoresInutil(livroPdf(
      marcadores(Array.from({ length: lixo }, (_, i) => 'page' + i).concat(Array.from({ length: bons }, (_, i) => 'Unidade ' + i))),
      'marcadores', [cap(1, 'Um capítulo', 1, 20, []), cap(2, 'Outro capítulo', 21, 40, [])]));
    conf('metade lixo e metade bom: ficam os marcadores', misto(3, 3), false);
    conf('mais da metade lixo: vale o mapa', misto(4, 3), true);
    const sem = t => Biblioteca.marcadorSemSentido(t);
    conf('títulos sem sentido', ['page1', 'page2_2', 'Page 12', 'p12', 'Blank Page', 'Sem nome', 'Sumário', 'SUMÁRIO', '',
      'GA_MAT_9_LP_4ED_PNLD24_OB', 'PMR9_001_272', 'livro.pdf', '  '].filter(sem).length, 13);
    conf('títulos com sentido', ['Frações', 'Capítulo 1: Números', 'Parte 1 (p.1-340)', '1', 'x', 'Paginação e leitura',
      'Página 7 de exercícios', 'Volume'].filter(sem).join(','), '');
  }

  secao('6b. Diante de marcadores, só um mapa de verdade: 2 capítulos ou mais, cobrindo 25% do livro');
  const comPaginas = (meta, paginas) => Object.assign(meta, { paginas });
  // o Praticando 9: 4 marcadores lixo (um deles leva ao manual do professor, na p. 274) e um mapa de 4 lixo e 1 boa
  const praticando = comPaginas(livroPdf([{ n: 1, nivel: 1, titulo: 'PMR9_1capa', pagina: 1 },
    { n: 2, nivel: 1, titulo: 'PMR9_001_272', pagina: 2 }, { n: 3, nivel: 1, titulo: 'PMR9_MP_001_120', pagina: 274 },
    { n: 4, nivel: 1, titulo: 'PMR9_MP_121_120', pagina: 394 }], 'marcadores',
  [cap(1, 'PMR9_1capa', 1, 1, []), cap(2, 'PMR9_001_272', 2, 221, []), cap(3, 'Círculo e cilindro', 222, 241, ['MAT09-12']),
    cap(4, 'PMR9_MP_001_120', 274, 393, []), cap(5, 'PMR9_MP_121_120', 394, 394, [])]), 394);
  const cobPrat = Biblioteca.coberturaDoMapa(praticando, [praticando.mapa[2]]);
  if (MODO === '--envenenado-mapa-parcial-troca') {
    secao('VENENO: o mapa parcial toma o lugar dos marcadores');
    conf('envenenado: o Praticando 9 fica com 1 capítulo e perde o atalho da p. 274 (defeito enxergado)',
      Biblioteca.sumarioDoLivro(praticando).length, 1);
  } else if (MODO !== '--envenenado-sumario-dos-marcadores') {
    // (o veneno do sumário do pacote já foi enxergado na seção 6; aqui ele desligaria a troca de todos)
    conf('o Praticando 9: 1 entrada boa de 20 das 394 páginas (' + (100 * cobPrat).toFixed(1) + '%)', cobPrat.toFixed(4), (20 / 394).toFixed(4));
    conf('o Praticando 9 NÃO troca: os marcadores ficam, com o atalho da p. 274',
      Biblioteca.sumarioDoLivro(praticando) === praticando.sumario && praticando.sumario[2].pagina === 274, true);
    // o Teláris: 600 marcadores "pageN" e 9 capítulos de 33 páginas a partir da 13 (297 de 492, 60%)
    const telaris = comPaginas(livroPdf(Array.from({ length: 600 }, (_, i) => ({ n: i + 1, nivel: 1, titulo: 'page' + (i + 1), pagina: (i % 492) + 1 })),
      'marcadores', Array.from({ length: 9 }, (_, i) => cap(i + 1, 'Capítulo do Teláris ' + (i + 1), 13 + 33 * i, 45 + 33 * i, []))), 492);
    conf('o Teláris sintético cobre 297 de 492 páginas', Biblioteca.coberturaDoMapa(telaris, telaris.mapa).toFixed(4), (297 / 492).toFixed(4));
    conf('o Teláris continua trocando: 9 capítulos', Biblioteca.sumarioDoLivro(telaris).length, 9);
    // o Matemática e Realidade: 2 "Blank Page" e 22 capítulos de 16 páginas a partir da 14 (352 de 500, 70%)
    const mer = comPaginas(livroPdf(marcadores(['Blank Page', 'Blank Page']), 'marcadores',
      Array.from({ length: 22 }, (_, i) => cap(i + 1, 'Capítulo da coleção ' + (i + 1), 14 + 16 * i, 29 + 16 * i, []))), 500);
    conf('o Matemática e Realidade continua trocando: 22 capítulos', Biblioteca.sumarioDoLivro(mer).length, 22);
    // o Araribá 8: sumário vazio, uma entrada só, de 7 das 442 páginas (1,6%)
    const ararib = comPaginas(livroPdf([], 'nenhum', [cap(1, 'Volume', 191, 197, ['MAT08-05'])]), 442);
    conf('o vazio com 1 entrada de 1,6% continua trocando (sem sumário não há atalho a perder)',
      linha(Biblioteca.sumarioDoLivro(ararib)), '1:Volume@191-197#1');
    // a fronteira da cobertura: 100 páginas, 10 marcadores lixo, 2 capítulos
    const fronteira = (fim2) => comPaginas(livroPdf(marcadores(Array.from({ length: 10 }, (_, i) => 'page' + (i + 1))), 'marcadores',
      [cap(1, 'Primeiro capítulo', 1, 12, []), cap(2, 'Segundo capítulo', 51, fim2, [])]), 100);
    const abaixo = fronteira(62), acima = fronteira(63);
    conf('logo abaixo: 24 de 100 páginas (24%), ficam os marcadores',
      Biblioteca.coberturaDoMapa(abaixo, abaixo.mapa) + '|' + Biblioteca.sumarioDosMarcadoresInutil(abaixo), '0.24|false');
    conf('logo acima: 25 de 100 páginas (25%), vale o mapa',
      Biblioteca.coberturaDoMapa(acima, acima.mapa) + '|' + Biblioteca.sumarioDosMarcadoresInutil(acima), '0.25|true');
    conf('o limiar é 25%', Biblioteca.COBERTURA_MINIMA_DO_MAPA, 0.25);
    // a fronteira dos capítulos: 1 capítulo do livro inteiro não troca, 2 trocam
    const umCap = comPaginas(livroPdf(marcadores(['page1', 'page2']), 'marcadores', [cap(1, 'O livro todo', 1, 100, [])]), 100);
    const doisCaps = comPaginas(livroPdf(marcadores(['page1', 'page2']), 'marcadores',
      [cap(1, 'Metade um', 1, 50, []), cap(2, 'Metade dois', 51, 100, [])]), 100);
    conf('1 capítulo cobrindo 100%: ficam os marcadores', Biblioteca.sumarioDosMarcadoresInutil(umCap), false);
    conf('2 capítulos cobrindo 100%: vale o mapa', Biblioteca.sumarioDosMarcadoresInutil(doisCaps), true);
    // a união das faixas: capítulos que se cruzam não contam a mesma página duas vezes
    conf('a cobertura é a união: 1 a 20 e 10 a 30 dão 30 páginas',
      Biblioteca.coberturaDoMapa({ paginas: 100 }, [cap(1, 'a', 1, 20, []), cap(2, 'b', 10, 30, []), cap(3, 'c', 12, 15, [])]), 0.3);
    conf('sem meta.paginas não há como medir: 0, e os marcadores ficam',
      Biblioteca.coberturaDoMapa({}, [cap(1, 'a', 1, 20, [])]) + '|' +
      Biblioteca.sumarioDosMarcadoresInutil(Object.assign({}, lixo40, { paginas: undefined })), '0|false');
  }

  console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
