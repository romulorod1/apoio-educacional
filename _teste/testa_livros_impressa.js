/* testa_livros_impressa.js
 *
 * Prova da frente B3 (a página impressa do livro), sem navegador:
 *   1. livro sintético com capa sem número, páginas romanas ("i".."iv"),
 *      páginas arábicas (1..20), intervalo sem número e segundo trecho arábico
 *      em que a numeração muda no meio (101..108);
 *   2. ida e volta de paginaImpressa e paginaDoArquivo em todas as páginas do
 *      livro, mais maiúsculas/minúsculas em romanos, string numérica e estilo
 *      explícito quando há mais de um trecho;
 *   3. livro sem `numeracao`: tudo igual a hoje (página do arquivo no sumário,
 *      no painel do capítulo, no Continuar lendo, no contador e no "Ir para a
 *      página");
 *   4. tela e leitor (funções de app.js sobre Biblioteca): rótulo da coluna
 *      "página impressa", capítulos no sumário e no painel com a página
 *      impressa, "Abrir na p. X" abrindo na página do arquivo correspondente,
 *      contador "p. 18 de 35 (impressa 12)", "Ir para a página" aceitando a
 *      página impressa ("12", "iv"), e a posição guardada em livros_posicoes
 *      sempre em página do arquivo na gravação e na reabertura;
 *   5. `numeracao` inválida: sobreposição, fora de `paginas`, `inicio` não
 *      inteiro, trecho romano com `inicio < 1`, estilo desconhecido; só aquele
 *      livro é recusado num pacote com outros livros válidos, e pacote de um
 *      livro inválido só recusa com a frase da tela.
 *
 * Venenos:
 *   --envenenado-impressa-fora-por-um        paginaImpressa deslocada em +1
 *   --envenenado-posicao-lida-como-impressa  a posição guardada (página do
 *                                            arquivo) convertida como se fosse
 *                                            página impressa ao reabrir
 *   --envenenado-trecho-romano-zero          trecho romano com inicio < 1 passa
 *                                            sem recusar
 *
 * Uso: node _teste/testa_livros_impressa.js [--envenenado-...]
 */
'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const Zip = require(path.join(RAIZ, 'zip.js'));
const Sintetico = require('./_pacote_sintetico.js');

const VENENOS = {
  'impressa-fora-por-um': [
    'var n = t.inicio + (paginaArq - t.de);',
    'var n = t.inicio + (paginaArq - t.de) + 1;'
  ],
  'posicao-lida-como-impressa': [
    '  function paginaDaPosicao(meta, pos) {\n    var p = pos && inteiro(pos.pagina) && pos.pagina >= 1 ? pos.pagina : null;\n    return p;\n  }',
    '  function paginaDaPosicao(meta, pos) {\n    var p = pos && inteiro(pos.pagina) && pos.pagina >= 1 ? pos.pagina : null;\n    return p ? (paginaDoArquivo(meta, p) || p) : null;\n  }'
  ],
  'trecho-romano-zero': [
    'if (!inteiro(t.inicio) || t.inicio < 1 ||',
    'if (!inteiro(t.inicio) || (t.estilo === \'romano\' ? t.inicio < 0 : t.inicio < 1) ||'
  ]
};

let qualVeneno = null;
Object.keys(VENENOS).forEach(k => {
  if (process.argv.indexOf('--envenenado-' + k) !== -1) qualVeneno = k;
});

let passes = 0, falhas = 0;
const falhasLista = [];
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (!qualVeneno) {
    if (ok) passes++; else { falhas++; falhasLista.push(rotulo + ' [obtido: ' + obtido + ' | esperado: ' + esperado + ']'); }
    console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
  } else if (!ok) {
    falhas++;
    falhasLista.push(rotulo + ' [obtido: ' + obtido + ' | esperado: ' + esperado + ']');
  }
}

function carregarBiblioteca() {
  let codigo = fs.readFileSync(path.join(RAIZ, 'biblioteca.js'), 'utf8').replace(/\r\n/g, '\n');
  if (qualVeneno) {
    const [de, para] = VENENOS[qualVeneno];
    if (codigo.indexOf(de) < 0) {
      console.error('FALHA: âncora do veneno ' + qualVeneno + ' não encontrada em biblioteca.js');
      process.exit(1);
    }
    codigo = codigo.replace(de, para);
  }
  const ctx = { Zip, crypto: crypto.webcrypto, TextDecoder, Uint8Array, ArrayBuffer, Blob, Promise, Math, JSON, Object, Array, String, Number, Error, RegExp, parseInt, isFinite };
  ctx.self = ctx;
  vm.runInNewContext(codigo, ctx, { filename: 'biblioteca.js' });
  return ctx.Biblioteca;
}

const Biblioteca = carregarBiblioteca();

/* Extrai as funções de tela e leitor do app.js para exercitá-las diretamente
 * sobre o Biblioteca carregado acima (inclusive quando envenenado). */
function carregarFuncoesDeTela(Bib) {
  const appCodigo = fs.readFileSync(path.join(RAIZ, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
  const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  conf('campo Ir p. usa teclado de texto para aceitar algarismos romanos', /id="leitor-ir-pagina"[^>]*inputmode="text"/.test(html), true);
  function extrair(inicio, fim) {
    const i = appCodigo.indexOf(inicio);
    const j = appCodigo.indexOf(fim, i);
    if (i < 0 || j < 0) throw new Error('Trecho não encontrado em app.js: ' + inicio);
    return appCodigo.slice(i, j);
  }
  const trechoImportarLivros = extrair('  function importarLivros(aberto, andamento) {', '  function tituloDoLivro(meta)');
  const trechoBib = extrair('  var ROTULO_COM_NUMERO =', '  function mostrarSecaoDeLivros');
  const trechoTelaLivro = extrair('  function entradaDoMapaDoCapitulo(', '  /* ---- B6: o assunto lado a lado');
  const trechoAbrirLivro = extrair('  function tituloDoLivro(', '  /* ---------------------------------- "Este capítulo cobre"');
  const trechoPlural = extrair('  function plural(', '  /* ------------------------- a Biblioteca');
  const trechoEntradaSumario = extrair('  function desenharSumario(', '  function fecharSumarioEpub');
  const trechoContador = extrair('  function textoDoContadorDoLeitor(', '  /* Desenha a página atual num canvas');

  const elementos = {};
  function criarNo(tag, attrs, filhos) {
    const no = {
      tag: String(tag || 'div').toLowerCase(),
      attrs: Object.assign({}, attrs || {}),
      dataset: {},
      style: { setProperty: function (k, v) { this[k] = v; } },
      classList: {
        contains: function () { return false; },
        add: function () {},
        remove: function () {},
        toggle: function () {}
      },
      children: [],
      hidden: false,
      disabled: false,
      value: '',
      _text: '',
      appendChild: function (f) {
        if (f === null || f === undefined) return f;
        if (typeof f === 'string') f = { tag: '#text', textContent: f, children: [] };
        this.children.push(f);
        if (f.attrs && f.attrs.id) elementos['#' + f.attrs.id] = f;
        return f;
      },
      setAttribute: function (k, v) { this.attrs[k] = String(v); },
      getAttribute: function (k) { return this.attrs[k] || null; }
    };
    Object.defineProperty(no, 'firstChild', { get: function () { return this.children[0] || null; } });
    Object.defineProperty(no, 'innerHTML', {
      get: function () { return this._html || ''; },
      set: function (v) { this._html = v; if (v === '') this.children = []; }
    });
    Object.defineProperty(no, 'textContent', {
      get: function () {
        if (this.children.length) return this.children.map(c => c.textContent || '').join('');
        return this._text || '';
      },
      set: function (v) { this._text = String(v == null ? '' : v); this.children = []; }
    });
    if (attrs) {
      if (attrs.texto !== undefined) no._text = String(attrs.texto);
      if (attrs.id) elementos['#' + attrs.id] = no;
    }
    (filhos || []).forEach(f => { if (f !== null && f !== undefined) no.appendChild(f); });
    return no;
  }

  ['#leitor-contador', '#leitor-ir-pagina', '#leitor-ir-caixa', '#leitor-anterior', '#leitor-proxima',
   '#leitor-menos', '#leitor-mais', '#leitor-largura', '#leitor-como-folha', '#leitor-sumario',
   '#leitor-exportar', '#leitor-sumario-lista', '#bib-livro', '#tela-biblioteca', '#bib-livros'].forEach(sel => {
    elementos[sel] = criarNo('div', { id: sel.slice(1) });
  });

  let ultimoDesenho = null;
  let ultimoLeitorPdf = null;
  let ultimaPosicaoGravada = null;
  const livrosGuardados = {};
  const posicoesGuardadas = {};
  const ctx = {
    Biblioteca: Bib,
    Store: {
      lerLivro: id => Promise.resolve(livrosGuardados[id] || null),
      lerPosicaoLivro: id => Promise.resolve(posicoesGuardadas[id] || null),
      gravarPosicaoLivro: pos => { ultimaPosicaoGravada = pos; posicoesGuardadas[pos.id] = pos; return Promise.resolve(); },
      listarLivros: () => Promise.resolve(Object.keys(livrosGuardados).map(k => livrosGuardados[k])),
      estimarEspaco: () => Promise.resolve(null),
      tornarPersistente: () => Promise.resolve(),
      gravarLivros: () => Promise.resolve({ novos: 1, atualizados: 0, iguais: 0, maisNovos: 0, removidos: 0, posicoesSoltas: 0, deOutroPacote: [] })
    },
    Core: { materiaPorId: () => ({ rotulo: 'Matemática' }), MATERIA_PADRAO: 'matematica' },
    SERIES_NOMES: [['06', '6º ano'], ['07', '7º ano']],
    CORES_DAS_CAPAS: ['var(--capa-alfa)'],
    SEM_ANO: 'sem-ano',
    LEITOR_ZOOM_MIN: 0.5,
    LEITOR_ZOOM_MAX: 3,
    leitor: null,
    bibLivroAberto: null,
    bibLivrosCache: {},
    assuntosDosLivros: { porId: {}, lista: [] },
    modoCelular: false,
    importandoBiblioteca: false,
    nomeDoAno: a => a === '06' ? '6º ano' : a,
    correcoesDosLivros: () => ({}),
    livrosPorAssunto: () => () => 0,
    carregarAssuntosDosLivros: () => Promise.resolve({ porId: {}, lista: [] }),
    fecharTelaDoLivro: () => {},
    desenharLivrosDaBiblioteca: () => Promise.resolve(),
    desenharLivrosAjustes: () => Promise.resolve(),
    abrirLadoALado: () => {},
    icone: nome => criarNo('svg', { 'data-icone-nome': nome }),
    avisar: () => {},
    confirmar: () => true,
    mostrarCobre: () => {},
    abrirLeitorEpub: () => Promise.resolve(true),
    abrirLeitorPdf: function (blob, opcoes) {
      ultimoLeitorPdf = opcoes;
      return Promise.resolve(true);
    },
    el: criarNo,
    $: sel => elementos[sel] || null,
    desenharPaginaDoLeitor: function (paraOAlto) {
      ultimoDesenho = { pagina: ctx.leitor ? ctx.leitor.pagina : null, paraOAlto: !!paraOAlto };
      ctx.atualizarBarraDoLeitor();
      return Promise.resolve(true);
    },
    elementos,
    livrosGuardados,
    posicoesGuardadas,
    lerUltimoDesenho: () => ultimoDesenho,
    lerUltimoLeitorPdf: () => ultimoLeitorPdf,
    lerUltimaPosicaoGravada: () => ultimaPosicaoGravada
  };
  vm.runInNewContext([trechoPlural, trechoImportarLivros, trechoBib, trechoTelaLivro, trechoAbrirLivro, trechoEntradaSumario, trechoContador].join('\n'), ctx, { filename: 'app_b3_trecho.js' });
  return ctx;
}

function sha256Hex(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

/* Monta um zip válido de livros (sem compressão, método 0) como Blob. */
function pacoteDeLivros(livrosMeta, conteudoPorId) {
  const arquivos = {};
  const entradas = [];
  livrosMeta.forEach(l => {
    const bytes = conteudoPorId[l.id] || Buffer.from('%PDF-1.4\n', 'utf8');
    const hash = 'sha256:' + sha256Hex(bytes);
    l.hash = hash;
    l.bytes = bytes.length;
    arquivos[l.arquivo] = hash;
    entradas.push({ nome: l.arquivo, dados: bytes, metodo: 0 });
  });
  const manifest = {
    esquema: 1,
    conteudo: 'livros',
    pacote: 'livros-teste-b3',
    versao: 1,
    gerado_em: '2026-11-09T12:00:00Z',
    arquivos,
    livros: livrosMeta
  };
  entradas.unshift({ nome: 'manifest.json', dados: Buffer.from(JSON.stringify(manifest), 'utf8'), metodo: 0 });
  const zipBytes = Sintetico.montarZip(entradas);
  return new Blob([zipBytes], { type: 'application/zip' });
}

const LIVRO_COM_NUMERACAO = {
  id: 'mat-6-sintetico',
  titulo: 'Matemática do 6º Ano',
  formato: 'pdf',
  arquivo: 'livros/mat-6-sintetico.pdf',
  paginas: 35,
  series: ['06'],
  materia: 'matematica',
  /* Páginas 1..2: capa e folha de rosto (sem número impresso)
   * Páginas 3..6: prefácio em romanos ("i".."iv")
   * Páginas 7..26: miolo em arábicos (1..20)
   * Página 27: divisória sem número
   * Páginas 28..35: apêndice em que a numeração muda no meio para 101..108 */
  numeracao: [
    { de: 3, ate: 6, inicio: 1, estilo: 'romano' },
    { de: 7, ate: 26, inicio: 1, estilo: 'arabico' },
    { de: 28, ate: 35, inicio: 101, estilo: 'arabico' }
  ],
  sumario: [
    { n: 1, nivel: 1, titulo: 'Prefácio', pagina: 3, pagina_fim: 6 },
    { n: 2, nivel: 1, titulo: 'Capítulo 1: Números naturais', pagina: 7, pagina_fim: 17 },
    { n: 3, nivel: 1, titulo: 'Capítulo 2: Frações', pagina: 18, pagina_fim: 26 },
    { n: 4, nivel: 1, titulo: 'Apêndice: Tabelas', pagina: 28, pagina_fim: 35 }
  ]
};

const LIVRO_SEM_NUMERACAO = {
  id: 'mat-6-sem-num',
  titulo: 'Caderno de Exercícios',
  formato: 'pdf',
  arquivo: 'livros/mat-6-sem-num.pdf',
  paginas: 20,
  series: ['06'],
  materia: 'matematica',
  sumario: [
    { n: 1, nivel: 1, titulo: 'Capítulo 1: Revisão', pagina: 2, pagina_fim: 8 },
    { n: 2, nivel: 1, titulo: 'Capítulo 2: Problemas', pagina: 9, pagina_fim: 20 }
  ]
};

(async () => {
  console.log('\n=== 1. Conversão pura: capa, romanas, arábicas e mudança no meio ===');
  conf('capa (p. 1 do arquivo) não tem página impressa', Biblioteca.paginaImpressa(LIVRO_COM_NUMERACAO, 1), null);
  conf('folha de rosto (p. 2 do arquivo) não tem página impressa', Biblioteca.paginaImpressa(LIVRO_COM_NUMERACAO, 2), null);
  conf('p. 3 do arquivo é "i"', Biblioteca.paginaImpressa(LIVRO_COM_NUMERACAO, 3), 'i');
  conf('p. 4 do arquivo é "ii"', Biblioteca.paginaImpressa(LIVRO_COM_NUMERACAO, 4), 'ii');
  conf('p. 5 do arquivo é "iii"', Biblioteca.paginaImpressa(LIVRO_COM_NUMERACAO, 5), 'iii');
  conf('p. 6 do arquivo é "iv"', Biblioteca.paginaImpressa(LIVRO_COM_NUMERACAO, 6), 'iv');
  conf('p. 7 do arquivo abre o trecho arábico em 1', Biblioteca.paginaImpressa(LIVRO_COM_NUMERACAO, 7), 1);
  conf('p. 18 do arquivo (Cap. 2) é a página impressa 12', Biblioteca.paginaImpressa(LIVRO_COM_NUMERACAO, 18), 12);
  conf('p. 26 do arquivo fecha o primeiro trecho arábico em 20', Biblioteca.paginaImpressa(LIVRO_COM_NUMERACAO, 26), 20);
  conf('p. 27 do arquivo (divisória entre trechos) devolve null', Biblioteca.paginaImpressa(LIVRO_COM_NUMERACAO, 27), null);
  conf('p. 28 do arquivo abre o segundo trecho arábico em 101', Biblioteca.paginaImpressa(LIVRO_COM_NUMERACAO, 28), 101);
  conf('p. 35 do arquivo fecha o segundo trecho arábico em 108', Biblioteca.paginaImpressa(LIVRO_COM_NUMERACAO, 35), 108);
  conf('página 0 ou acima de paginas devolve null',
    [Biblioteca.paginaImpressa(LIVRO_COM_NUMERACAO, 0), Biblioteca.paginaImpressa(LIVRO_COM_NUMERACAO, 36)].join(','), ',');

  console.log('\n=== 2. Ida e volta em todas as páginas do livro ===');
  let falhasIdaEVolta = 0;
  for (let arq = 1; arq <= LIVRO_COM_NUMERACAO.paginas; arq++) {
    const imp = Biblioteca.paginaImpressa(LIVRO_COM_NUMERACAO, arq);
    if (arq === 1 || arq === 2 || arq === 27) {
      if (imp !== null) falhasIdaEVolta++;
    } else {
      const volta = Biblioteca.paginaDoArquivo(LIVRO_COM_NUMERACAO, imp);
      if (volta !== arq) falhasIdaEVolta++;
    }
  }
  conf('ida e volta bate nas 35 páginas do livro sintético', falhasIdaEVolta, 0);
  conf('paginaDoArquivo aceita romano em maiúsculas ("IV" -> 6)', Biblioteca.paginaDoArquivo(LIVRO_COM_NUMERACAO, 'IV'), 6);
  conf('paginaDoArquivo aceita número arábico como string ("12" -> 18)', Biblioteca.paginaDoArquivo(LIVRO_COM_NUMERACAO, '12'), 18);
  conf('paginaDoArquivo aceita estilo explícito ("romano", 4 -> 6)', Biblioteca.paginaDoArquivo(LIVRO_COM_NUMERACAO, 4, 'romano'), 6);
  conf('paginaDoArquivo aceita estilo explícito ("arabico", 4 -> 10)', Biblioteca.paginaDoArquivo(LIVRO_COM_NUMERACAO, 4, 'arabico'), 10);
  conf('paginaDoArquivo devolve null para página impressa inexistente (50, "ix")',
    [Biblioteca.paginaDoArquivo(LIVRO_COM_NUMERACAO, 50), Biblioteca.paginaDoArquivo(LIVRO_COM_NUMERACAO, 'ix')].join(','), ',');

  console.log('\n=== 3. Livro sem numeracao: igual ao comportamento atual ===');
  conf('paginaImpressa sem numeracao devolve null', Biblioteca.paginaImpressa(LIVRO_SEM_NUMERACAO, 5), null);
  conf('paginaDoArquivo sem numeracao devolve null', Biblioteca.paginaDoArquivo(LIVRO_SEM_NUMERACAO, 5), null);

  const tela = carregarFuncoesDeTela(Biblioteca);
  conf('rótulo da coluna com numeracao é "página impressa"', tela.rotuloDaPaginaDoLivro(LIVRO_COM_NUMERACAO), 'página impressa');
  conf('rótulo da coluna sem numeracao continua "página do arquivo"', tela.rotuloDaPaginaDoLivro(LIVRO_SEM_NUMERACAO), 'página do arquivo');
  conf('paginaParaMostrar usa a impressa quando existe (p. 18 -> 12)', tela.paginaParaMostrar(LIVRO_COM_NUMERACAO, { pagina: 18 }), 12);
  conf('paginaParaMostrar usa a impressa romana no prefácio (p. 3 -> "i")', tela.paginaParaMostrar(LIVRO_COM_NUMERACAO, { pagina: 3 }), 'i');
  conf('paginaParaMostrar cai na página do arquivo fora de trecho (capa p. 1 -> 1)', tela.paginaParaMostrar(LIVRO_COM_NUMERACAO, { pagina: 1 }), 1);
  conf('paginaParaMostrar sem numeracao mantém a página do arquivo (p. 9 -> 9)', tela.paginaParaMostrar(LIVRO_SEM_NUMERACAO, { pagina: 9 }), 9);

  console.log('\n=== 4. Continuar lendo, posição guardada, contador e Ir para a página ===');
  conf('ondeParou com numeracao mostra a página impressa ("Cap. 2, Frações · p. 12")',
    tela.ondeParou({ meta: LIVRO_COM_NUMERACAO, pos: { pagina: 18, quando: 100 } }), 'Cap. 2, Frações · p. 12');
  conf('ondeParou sem numeracao mostra a página do arquivo ("Cap. 2, Problemas · p. 9")',
    tela.ondeParou({ meta: LIVRO_SEM_NUMERACAO, pos: { pagina: 9, quando: 100 } }), 'Cap. 2, Problemas · p. 9');

  /* A posição guardada em livros_posicoes está em página do ARQUIVO (18).
   * Ao reabrir o livro por abrirLivro, o leitor abre na página 18 do arquivo
   * sem passá-la por paginaDoArquivo (que a deslocaria para 24). */
  tela.livrosGuardados[LIVRO_COM_NUMERACAO.id] = { id: LIVRO_COM_NUMERACAO.id, meta: LIVRO_COM_NUMERACAO, blob: new Blob(['%PDF']) };
  tela.posicoesGuardadas[LIVRO_COM_NUMERACAO.id] = { id: LIVRO_COM_NUMERACAO.id, pagina: 18, quando: 100 };
  await tela.abrirLivro(LIVRO_COM_NUMERACAO.id);
  const opcoesLeitor = tela.lerUltimoLeitorPdf();
  conf('reabrir o livro na posição guardada (arquivo 18) abre na página 18 do arquivo', opcoesLeitor && opcoesLeitor.pagina, 18);
  opcoesLeitor.aoMudarPagina(19);
  conf('mudar de página no leitor grava a página do ARQUIVO (19) em livros_posicoes',
    tela.lerUltimaPosicaoGravada() && tela.lerUltimaPosicaoGravada().pagina, 19);

  tela.desenharTelaDoLivro({ id: LIVRO_COM_NUMERACAO.id, meta: LIVRO_COM_NUMERACAO, pos: { pagina: 18, quando: 100 } });
  conf('botão #bib-livro-continuar mostra a página impressa ("Continuar na p. 12")',
    tela.elementos['#bib-livro-continuar'] && tela.elementos['#bib-livro-continuar'].textContent, 'Continuar na p. 12');
  conf('botão #bib-livro-abrir-capitulo mostra a página impressa ("Abrir na p. 12")',
    tela.elementos['#bib-livro-abrir-capitulo'] && tela.elementos['#bib-livro-abrir-capitulo'].textContent, 'Abrir na p. 12');
  await tela.elementos['#bib-livro-abrir-capitulo'].attrs.aoClick();
  conf('tocar em "Abrir na p. 12" abre o leitor na página 18 do arquivo',
    tela.lerUltimoLeitorPdf() && tela.lerUltimoLeitorPdf().pagina, 18);

  conf('contador do leitor com numeracao mostra as duas ("p. 18 de 35 (impressa 12)")',
    tela.textoDoContadorDoLeitor(LIVRO_COM_NUMERACAO, 18, 35), 'p. 18 de 35 (impressa 12)');
  conf('contador do leitor em trecho romano mostra ("p. 4 de 35 (impressa ii)")',
    tela.textoDoContadorDoLeitor(LIVRO_COM_NUMERACAO, 4, 35), 'p. 4 de 35 (impressa ii)');
  conf('contador do leitor na capa sem número impresso mostra só a do arquivo ("Página 1 de 35")',
    tela.textoDoContadorDoLeitor(LIVRO_COM_NUMERACAO, 1, 35), 'Página 1 de 35');
  conf('contador do leitor em livro sem numeracao fica como hoje ("Página 9 de 20")',
    tela.textoDoContadorDoLeitor(LIVRO_SEM_NUMERACAO, 9, 20), 'Página 9 de 20');

  const caixaSumario = tela.el('div');
  tela.desenharSumario(caixaSumario, LIVRO_COM_NUMERACAO.sumario, LIVRO_COM_NUMERACAO.sumario[2], () => {}, LIVRO_COM_NUMERACAO);
  const rotulosSumario = caixaSumario.children.map(b => b.children.map(c => c.textContent || '').join(' | '));
  conf('sumário do leitor mostra páginas impressas ("p. i", "p. 1", "p. 12", "p. 101")',
    rotulosSumario.join(' ; '),
    'Prefácio | p. i ; Capítulo 1: Números naturais | p. 1 ; Capítulo 2: Frações | p. 12 ; Apêndice: Tabelas | p. 101');

  tela.leitor = { doc: {}, pagina: 7, total: 35, zoom: 1, opcoes: { livro: { id: LIVRO_COM_NUMERACAO.id, meta: LIVRO_COM_NUMERACAO } } };
  tela.atualizarBarraDoLeitor();
  conf('barra do leitor preenche #leitor-ir-pagina com a página impressa atual ("1")',
    tela.elementos['#leitor-ir-pagina'].value, '1');
  conf('irParaPaginaDoLeitor("12") leva à página 18 do arquivo',
    tela.irParaPaginaDoLeitor('12') && tela.leitor.pagina, 18);
  conf('irParaPaginaDoLeitor("iv") leva à página 6 do arquivo',
    tela.irParaPaginaDoLeitor('iv') && tela.leitor.pagina, 6);
  conf('irParaPaginaDoLeitor em livro sem numeracao usa a página do arquivo ("9" -> 9)',
    (() => {
      tela.leitor = { doc: {}, pagina: 1, total: 20, zoom: 1, opcoes: { livro: { id: LIVRO_SEM_NUMERACAO.id, meta: LIVRO_SEM_NUMERACAO } } };
      return tela.irParaPaginaDoLeitor('9') && tela.leitor.pagina;
    })(), 9);

  console.log('\n=== 5. Validação de numeracao no pacote: inválida recusa só aquele livro ===');
  const invalidos = [
    ['trecho romano com inicio 0', [{ de: 2, ate: 5, inicio: 0, estilo: 'romano' }], /início inválido/],
    ['trecho arábico com inicio não inteiro', [{ de: 2, ate: 10, inicio: 1.5, estilo: 'arabico' }], /início inválido/],
    ['sobreposição de trechos', [{ de: 2, ate: 10, inicio: 1, estilo: 'arabico' }, { de: 10, ate: 15, inicio: 10, estilo: 'arabico' }], /sobrepõe ou inverte/],
    ['trechos fora de ordem', [{ de: 10, ate: 15, inicio: 1, estilo: 'arabico' }, { de: 2, ate: 8, inicio: 1, estilo: 'romano' }], /sobrepõe ou inverte/],
    ['trecho além de paginas', [{ de: 2, ate: 40, inicio: 1, estilo: 'arabico' }], /aponta para fora dele/],
    ['trecho com de < 1', [{ de: 0, ate: 5, inicio: 1, estilo: 'arabico' }], /aponta para fora dele/],
    ['estilo desconhecido', [{ de: 2, ate: 10, inicio: 1, estilo: 'grego' }], /estilo desconhecido/],
    ['numeracao que não é lista', { de: 2, ate: 10, inicio: 1, estilo: 'arabico' }, /não é uma lista/]
  ];

  for (const [nome, numInvalida, padrao] of invalidos) {
    const ruim = Object.assign({}, LIVRO_COM_NUMERACAO, {
      id: 'livro-ruim',
      arquivo: 'livros/livro-ruim.pdf',
      numeracao: numInvalida
    });
    const bom = Object.assign({}, LIVRO_SEM_NUMERACAO);

    // 1) Num pacote com um livro bom e um livro com numeracao inválida, só o inválido é recusado
    const blobMisto = pacoteDeLivros([bom, ruim], {});
    const espiadoMisto = await Biblioteca.espiarPacote(blobMisto);
    let abertoMisto = null, erroMisto = null;
    try { abertoMisto = await Biblioteca.abrirLivrosDoArquivo(espiadoMisto); } catch (e) { erroMisto = e; }
    const soRuimRecusado = !erroMisto && abertoMisto && abertoMisto.livros.length === 1 &&
      abertoMisto.livros[0].meta.id === bom.id &&
      abertoMisto.recusados && abertoMisto.recusados.length === 1 &&
      abertoMisto.recusados[0].id === 'livro-ruim' &&
      padrao.test(abertoMisto.recusados[0].motivo);
    conf('pacote misto (' + nome + '): recusa só o livro inválido e preserva o válido', soRuimRecusado, true);

    // 2) Num pacote só com o livro inválido, abrirLivrosDoArquivo recusa com a frase da tela
    const blobSoRuim = pacoteDeLivros([Object.assign({}, ruim)], {});
    const espiadoSoRuim = await Biblioteca.espiarPacote(blobSoRuim);
    let erroSoRuim = null;
    try { await Biblioteca.abrirLivrosDoArquivo(espiadoSoRuim); } catch (e) { erroSoRuim = e; }
    conf('pacote de 1 livro (' + nome + '): recusa com frase clara',
      !!(erroSoRuim && erroSoRuim.recusa && erroSoRuim.tipo === 'defeito' && padrao.test(erroSoRuim.message)), true);
  }

  const semTotalDePaginas = Object.assign({}, LIVRO_COM_NUMERACAO, { paginas: undefined });
  conf('numeracao exige total de paginas valido', !!Biblioteca.conferirNumeracao(semTotalDePaginas), true);
  const resultadoParcial = await tela.importarLivros({
    bytesTotais: 0,
    recusados: [{ id: 'livro-ruim', motivo: 'Numeracao impressa invalida no livro-ruim.' }]
  }, () => {});
  const avisoParcial = resultadoParcial.linhas.join(' ');
  conf('importacao mista avisa que o livro recusado nao entrou',
    /livro n\u00e3o foi importado por numera\u00e7\u00e3o impressa inv\u00e1lida/i.test(avisoParcial) && /livro-ruim/.test(avisoParcial), true);

  if (qualVeneno) {
    console.log('\n=== Modo envenenado: ' + qualVeneno + ' ===');
    if (falhas > 0) {
      console.log('  OK    VENENO visto (' + falhas + ' falha(s)): ' + falhasLista[0]);
      console.log('\n1 passaram, 0 falharam.');
      process.exit(0);
    } else {
      console.log('  FALHA VENENO NÃO VISTO: ' + qualVeneno);
      console.log('\n0 passaram, 1 falharam.');
      process.exit(1);
    }
  }

  console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
  process.exit(falhas ? 1 : 0);
})();
