/* testa_livros_entre_materias.js
 *
 * Item 12c: a ligação de assunto entre matérias. O capítulo de química que
 * trata de unidades do SI liga o assunto de física (FISEM1-T01), e a tela diz
 * de que matéria ele é: "Física: Unidades do SI e conversões". No Chrome de
 * verdade, com dois livros SINTÉTICOS da 1ª série gravados aqui (PDFs de
 * texto escritos pela prova, sem conteúdo de terceiro) e os ids do banco de
 * verdade (os casos pendentes da revisão L3, Q3 e Q16):
 *   livro-qui  Química de prova, mapa da orquestradora:
 *              1 Grandezas e medidas   QUIEM1-T02 e FISEM1-T01 (física)
 *              2 Ácidos nucleicos      BIOEM1-T07 (biologia)
 *              3 Estrutura atômica     QUIEM1-T01 (só química)
 *              4 Capítulo de id fora   FISEM1-T99 (o prefixo de física, sem
 *                                      o assunto no índice)
 *   livro-fis  Física de prova: 1 Medidas, FISEM1-T01.
 * Nenhum aluno, nenhum livro de verdade.
 *
 * O que se prova:
 *   1. a tela do livro: o capítulo 1 mostra o assunto de química como sempre
 *      e o de física com a matéria na frente; o 2, "Biologia: ..."; o 3, só
 *      química, sem matéria nenhuma; o 4 mostra o id como veio, SEM "Física:"
 *      (quem diz a matéria é o índice, não o prefixo);
 *   2. a busca da Biblioteca acha o capítulo de química pelo assunto de
 *      física ("conversões") e diz "Física: ..." no "Pelo capítulo";
 *   3. o leitor: a faixa "Este capítulo cobre" diz "Física: ..."; o Corrigir
 *      traz o de física primeiro, marcado como atual, e depois os de química
 *      da 1ª série; um toque nele grava a correção (db.ajustes.mapaDosLivros)
 *      com o id de física, e depois de recarregar a tela continua dizendo
 *      "Física: ..."; o mapa do pacote não muda;
 *   4. "Abrir no livro" (Biblioteca.livrosComAssunto) acha os dois livros pelo
 *      FISEM1-T01 na 1ª série; o lado a lado do FISEM1-T01 tem as duas
 *      colunas, e a do livro de química diz "livro de Química" (e não "de
 *      outro ano"), com o resumo contando a de outra matéria;
 *   5. nenhum travessão na tela, nenhum erro de página.
 *
 * Venenos (cada um TEM de ser visto: "VENENO visto"):
 *   --envenenado-sem-materia-no-nome  o nome do assunto de outra matéria sai
 *                                     sem a matéria ("Unidades do SI..."),
 *                                     como antes do 12c;
 *   --envenenado-materia-pelo-prefixo o id fora do índice ganha a matéria
 *                                     pelo prefixo ("Física: FISEM1-T99");
 *   --envenenado-propria-materia-marcada  todo assunto ganha a matéria, até o
 *                                     da química num livro de química;
 *   --envenenado-corrigir-sem-a-de-fora   o Corrigir lista só a química: o
 *                                     assunto de física some da escolha.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8993;
const VENENOS = ['--envenenado-sem-materia-no-nome', '--envenenado-materia-pelo-prefixo',
  '--envenenado-propria-materia-marcada', '--envenenado-corrigir-sem-a-de-fora'];
const MODO = VENENOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && VENENOS.indexOf(a) < 0);

const BIB = fs.readFileSync(path.join(H.RAIZ, 'biblioteca.js'), 'utf8').replace(/\r\n/g, '\n');
const ANCORAS = {
  '--envenenado-sem-materia-no-nome': ["return materia + ': ' + titulo;", 'return titulo;'],
  '--envenenado-materia-pelo-prefixo': ['if (!a) return String(id);',
    "if (!a) return /^FIS/.test(String(id)) ? 'Física: ' + id : String(id);"],
  '--envenenado-propria-materia-marcada': ['return !!(a && a.disciplina && d && a.disciplina !== d);', 'return !!(a && a.disciplina);'],
  '--envenenado-corrigir-sem-a-de-fora': ['return deFora.concat(daMateria);', 'return daMateria;']
};
const trocas = {};
if (MODO) trocas['/biblioteca.js'] = BIB.split(ANCORAS[MODO][0]).join(ANCORAS[MODO][1]);
const amb = H.criarAmbiente(PORTA, 'perfil_entre_materias', trocas);

async function venenoVisto(rotulo, visto, detalhe) {
  secao('VENENO: ' + MODO);
  conf(MODO.slice(2) + ': ' + rotulo + ' (defeito detectado)', visto, true);
  if (visto) console.log('VENENO visto: ' + detalhe);
  await H.fim(amb)();
}

/* Um PDF de texto com n páginas ("Pagina k" em cada uma), escrito aqui. */
function pdfDePaginas(n) {
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const kids = [];
  for (let i = 1; i <= n; i++) {
    const txt = 'BT /F1 36 Tf 72 700 Td (Pagina ' + i + ') Tj ET';
    objs.push('<< /Length ' + txt.length + ' >>\nstream\n' + txt + '\nendstream');
    const c = objs.length;
    objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ' + c + ' 0 R /Resources << /Font << /F1 3 0 R >> >> >>');
    kids.push(objs.length);
  }
  objs[1] = '<< /Type /Pages /Kids [' + kids.map(k => k + ' 0 R').join(' ') + '] /Count ' + n + ' >>';
  let out = '%PDF-1.4\n';
  const offs = [];
  objs.forEach((o, i) => { offs.push(Buffer.byteLength(out)); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
  const xref = Buffer.byteLength(out);
  out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
  return Buffer.from(out, 'latin1').toString('base64');
}

// um livro sintético da 1ª série: capítulos [titulo, pagina, pagina_fim, [ids]], o mapa da orquestradora
function livro(id, titulo, materia, caps, paginas) {
  return {
    id, titulo, formato: 'pdf', paginas, materia, series: ['em1'], series_origem: 'mapa', mapa_disciplina: materia, hash: 'sintetico-' + id,
    sumario: caps.map((c, i) => ({ n: i + 1, nivel: 1, titulo: c[0], pagina: c[1], pagina_fim: c[2] })), sumario_origem: 'marcadores',
    mapa: caps.map((c, i) => ({ n: i + 1, titulo: c[0], pagina: c[1], pagina_fim: c[2], assuntos: c[3].map(x => ({ id: x, confianca: 'alta' })), origem: 'mapa' })),
    mapa_origem: 'mapa'
  };
}
const LIVROS = [
  livro('livro-qui', 'Química de prova', 'quimica', [
    ['Grandezas e medidas', 1, 2, ['QUIEM1-T02', 'FISEM1-T01']],
    ['Ácidos nucleicos', 3, 4, ['BIOEM1-T07']],
    ['Estrutura atômica', 5, 6, ['QUIEM1-T01']],
    ['Capítulo de id fora', 7, 8, ['FISEM1-T99']]], 8),
  livro('livro-fis', 'Física de prova', 'fisica', [['Medidas', 1, 2, ['FISEM1-T01']]], 2)
];

async function gravarLivros(pag, livros) {
  return pag.evaluate(async ls => {
    const aberto = { manifest: { pacote: 'prova-12c', versao: 1 }, livros: ls.map(l => {
      const bin = atob(l.pdf); const u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      return { meta: l.meta, blob: new Blob([u], { type: 'application/pdf' }) };
    }) };
    const c = await Store.gravarLivros(aberto);
    return c.novos;
  }, livros.map(m => ({ meta: m, pdf: pdfDePaginas(m.paginas) })));
}

const clicar = (pag, sel) => pag.evaluate(s => { const b = document.querySelector(s); if (!b) return false; b.click(); return true; }, sel);

async function abrirLivroNaBiblioteca(pag) {
  await H.irParaAba(pag, 'biblioteca');
  await esperar('a seção de livros', () => pag.evaluate(() => !!document.querySelector('#bib-livros .bibl-disciplina')), v => v, 10000);
  await clicar(pag, '#bib-livros .bibl-disciplina[data-disciplina="quimica"]');
  await pausa(200);
  await clicar(pag, '#bib-livros .bibl-ano[data-ano="em1"]');
  await esperar('o livro de química na grade', () => pag.evaluate(() => !!document.querySelector('#bib-livros [data-livro="livro-qui"]')), v => v, 10000);
  await clicar(pag, '#bib-livros [data-livro="livro-qui"]');
}

// as linhas de assunto do sumário da tela do livro, capítulo a capítulo
const assuntosDaTela = pag => pag.evaluate(() => {
  const t = document.querySelector('#bib-livro');
  if (!t || t.hidden) return null;
  return Array.from(t.querySelectorAll('.bibl-cap')).map(b => b.dataset.n + '=' + ((b.querySelector('.bibl-cap-assuntos') || {}).textContent || '')).join(' ; ');
});
const cobre = pag => pag.evaluate(() => {
  const c = document.querySelector('#leitor-cobre');
  if (!c || c.hidden) return null;
  return { capitulo: c.dataset.capitulo || '', assuntos: c.dataset.assuntos || '',
    texto: c.querySelector('.cobre-texto') ? c.querySelector('.cobre-texto').textContent : '' };
});

(async () => {
  secao('0. A prova se confere');
  conf('nenhum veneno desconhecido foi pedido', desconhecidos.join(','), '');
  Object.keys(ANCORAS).forEach(m => conf('a âncora de ' + m.slice(2) + ' aparece uma vez só no biblioteca.js', BIB.split(ANCORAS[m][0]).length - 1, 1));
  if (MODO) conf('o biblioteca.js servido está envenenado', trocas['/biblioteca.js'] !== BIB, true);

  await amb.subir();
  const pag = await amb.pagina();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  pag.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) erros.push(m.text()); });
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  await H.abrirApp(pag, amb.ORIGEM);
  const nomes = await pag.evaluate(() => Promise.all(['fisica', 'quimica', 'biologia'].map(k => fetch('banco/topicos/' + k + '.json').then(r => r.json())))
    .then(js => {
      const t = {};
      js.forEach(j => (j.grupos || []).forEach(g => (g.blocos || []).forEach(b => (b.ids || []).forEach((id, i) => { t[id] = b.topicos[i]; }))));
      return t;
    }));
  conf('os ids da prova estão no índice servido, e o FISEM1-T99 não',
    ['FISEM1-T01', 'BIOEM1-T07', 'QUIEM1-T01', 'QUIEM1-T02'].every(id => !!nomes[id]) && !nomes['FISEM1-T99'], true);
  const FIS = 'Física: ' + nomes['FISEM1-T01'], BIO = 'Biologia: ' + nomes['BIOEM1-T07'];
  conf('os dois livros sintéticos entraram', await gravarLivros(pag, LIVROS), 2);
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('1. A tela do livro de química');
  await abrirLivroNaBiblioteca(pag);
  const tela = (await esperar('a tela do livro com os nomes dos assuntos', () => assuntosDaTela(pag), v => !!v && v.indexOf(nomes['QUIEM1-T01']) >= 0, 10000)).valor;
  console.log('   ' + tela);
  if (MODO === '--envenenado-sem-materia-no-nome') return venenoVisto('o assunto de física sem a matéria', tela.indexOf(FIS) < 0, tela);
  if (MODO === '--envenenado-materia-pelo-prefixo') return venenoVisto('o id fora do índice ganhou "Física:"', /Física: FISEM1-T99/.test(tela), tela);
  if (MODO === '--envenenado-propria-materia-marcada') return venenoVisto('o assunto de química ganhou "Química:"', /Química: /.test(tela), tela);
  conf('capítulo 1: o de química como sempre e o de física com a matéria', tela.split(' ; ')[0], '1=' + nomes['QUIEM1-T02'] + ', ' + FIS);
  conf('capítulo 2: o de biologia com a matéria', tela.split(' ; ')[1], '2=' + BIO);
  conf('capítulo 3: o da própria matéria sem mudança, sem matéria nenhuma', tela.split(' ; ')[2], '3=' + nomes['QUIEM1-T01']);
  conf('capítulo 4: o id fora do índice como veio, sem "Física:" pelo prefixo', tela.split(' ; ')[3], '4=FISEM1-T99');
  conf('nenhum travessão na tela do livro', await pag.evaluate(() => /—|–/.test(document.querySelector('#bib-livro').innerText)), false);

  // ================================================================
  secao('2. A busca acha o capítulo de química pelo assunto de física');
  await clicar(pag, '#bib-livro-voltar');
  await pausa(300);
  const termo = 'conversões';
  conf('o termo ("' + termo + '") está no título do FISEM1-T01 e não no de capítulo nenhum', nomes['FISEM1-T01'].indexOf(termo) >= 0 &&
    LIVROS.every(l => l.mapa.every(e => e.titulo.toLowerCase().indexOf('convers') < 0)), true);
  await pag.evaluate(t => { const c = document.querySelector('#busca-biblioteca'); c.value = t; c.dispatchEvent(new Event('input', { bubbles: true })); }, termo);
  const lerBusca = () => pag.evaluate(() => {
    const g = document.querySelector('#bib-corpo [data-grupo="livros"]');
    if (!g) return null;
    const como = id => Array.from(g.querySelectorAll('.bib-busca-livros-resultados .bib-busca-livro-grupo[data-livro="' + id + '"]'))
      .map(b => b.querySelector('.bib-busca-livro-paginas strong').textContent + ' | ' + ((b.querySelector('.bib-busca-como') || {}).textContent || '')).join(' ; ');
    return { status: g.querySelector('.bib-busca-livros-status').textContent, qui: como('livro-qui'), fis: como('livro-fis') };
  });
  const busca = (await esperar('a busca com os dois livros', lerBusca, v => !!v && !/Buscando/.test(v.status) && !!v.qui && !!v.fis, 15000)).valor || {};
  console.log('   ' + JSON.stringify(busca));
  conf('o livro de química aparece pelo capítulo, com "Física:" no assunto', busca.qui, 'Grandezas e medidas | Pelo capítulo, assunto: ' + FIS);
  conf('o livro de física aparece com o assunto sem matéria (é a dele)', busca.fis, 'Medidas | Pelo capítulo, assunto: ' + nomes['FISEM1-T01']);
  await pag.evaluate(() => { const c = document.querySelector('#busca-biblioteca'); c.value = ''; c.dispatchEvent(new Event('input', { bubbles: true })); });
  await pausa(300);

  // ================================================================
  secao('3. O leitor: a faixa e o Corrigir');
  await abrirLivroNaBiblioteca(pag);
  await esperar('a tela do livro', () => assuntosDaTela(pag), v => !!v, 10000);
  await clicar(pag, '#bib-livro .bibl-cap[data-n="1"]');
  const faixa = (await esperar('a faixa do capítulo 1', () => cobre(pag), v => !!v && v.capitulo === '1' && v.texto.indexOf('abrindo') < 0 && v.texto.indexOf(FIS) >= 0, 20000)).valor || {};
  conf('a faixa diz o de química e o de física com a matéria', faixa.texto && faixa.texto.replace(/\s+/g, ' ').trim().indexOf('Este capítulo cobre: ' + nomes['QUIEM1-T02'] + '; ' + FIS) === 0, true);
  await clicar(pag, '#cobre-corrigir');
  const lista = (await esperar('a lista do Corrigir', () => pag.evaluate(() =>
    Array.from(document.querySelectorAll('#leitor-cobre .cobre-escolha [data-assunto]')).map(b => b.getAttribute('data-assunto') + '=' +
      b.textContent.trim() + (b.getAttribute('aria-current') === 'true' ? '*' : ''))), v => !!v && v.length > 2, 10000)).valor || [];
  console.log('   Corrigir: ' + lista.slice(0, 4).join(' | ') + ' ... (' + lista.length + ')');
  if (MODO === '--envenenado-corrigir-sem-a-de-fora') return venenoVisto('o assunto de física sumiu do Corrigir', lista.length > 2 && !lista.some(x => x.indexOf('FISEM1-T01=') === 0), lista.slice(0, 3).join(' | '));
  conf('o primeiro do Corrigir é o de física, com a matéria, marcado como atual', lista[0], 'FISEM1-T01=' + FIS + '*');
  const resto = lista.slice(1, -1);
  conf('depois, só assuntos de química da 1ª série', resto.length > 0 && resto.every(x => /^QUIEM1-/.test(x)), true);
  conf('o de química do capítulo também vem marcado', resto.some(x => x === 'QUIEM1-T02=' + nomes['QUIEM1-T02'] + '*'), true);
  conf('o último é "Nenhum assunto do índice"', lista[lista.length - 1].indexOf('=Nenhum assunto do índice') >= 0, true);
  await clicar(pag, '#leitor-cobre .cobre-escolha [data-assunto="FISEM1-T01"]');
  const gravada = (await esperar('a correção gravada', () => pag.evaluate(() => Store.carregar().then(d =>
    JSON.stringify((((d.ajustes || {}).mapaDosLivros || {})['livro-qui'] || {})['1'] || null))), v => v !== 'null', 10000)).valor;
  const c1 = JSON.parse(gravada);
  conf('a correção do capítulo 1 tem o id de física, com o título e a ação', c1.titulo + '|' + c1.assuntos.join('+') + '|' + c1.acao, 'Grandezas e medidas|FISEM1-T01|corrigiu');
  await pag.evaluate(() => { const b = document.querySelector('#modal-leitor-pdf [data-fechar]'); if (b) b.click(); });
  await pausa(300);
  await H.abrirApp(pag, amb.ORIGEM);
  await abrirLivroNaBiblioteca(pag);
  const depois = (await esperar('a tela do livro depois de recarregar', () => assuntosDaTela(pag), v => !!v && v.indexOf(nomes['QUIEM1-T01']) >= 0, 10000)).valor;
  conf('depois de recarregar, o capítulo 1 corrigido diz só "Física: ..."', depois.split(' ; ')[0], '1=' + FIS);
  conf('e os outros capítulos ficam como estavam', depois.split(' ; ').slice(1).join(' ; '), '2=' + BIO + ' ; 3=' + nomes['QUIEM1-T01'] + ' ; 4=FISEM1-T99');
  conf('o mapa do pacote, no depósito dos livros, não mudou', await pag.evaluate(() => Store.lerLivro('livro-qui').then(r =>
    r.meta.mapa.map(e => e.assuntos.map(a => a.id).join('+')).join(' | '))), 'QUIEM1-T02+FISEM1-T01 | BIOEM1-T07 | QUIEM1-T01 | FISEM1-T99');

  // ================================================================
  secao('4. "Abrir no livro" e o lado a lado pelo assunto de física');
  const abrir = await pag.evaluate(() => Store.carregar().then(d => Store.listarLivros().then(ls =>
    Biblioteca.livrosComAssunto(ls, (d.ajustes || {}).mapaDosLivros || {}, 'FISEM1-T01', 'em1').map(x => x.id + '#' + x.entrada.n).join(','))));
  conf('"Abrir no livro" acha os dois livros pelo FISEM1-T01 na 1ª série', abrir, 'livro-fis#1,livro-qui#1');
  await clicar(pag, '#bib-livro [data-comparar="FISEM1-T01"]');
  const lado = (await esperar('o lado a lado do FISEM1-T01', () => pag.evaluate(() => {
    const t = document.querySelector('#lado-a-lado');
    if (!t || t.hidden || t.dataset.modo !== 'tabela') return null;
    return { colunas: Array.from(t.querySelectorAll('.lado-livro')).map(c => c.dataset.livro + '=' +
      Array.from(c.querySelectorAll('.bibl-apoio')).map(s => s.textContent).join('|')).join(' ; '),
      resumo: ((t.querySelector('#lado-resumo') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
      travessao: /—|–/.test(t.innerText) };
  }), v => !!v && !!v.colunas, 10000)).valor || {};
  console.log('   ' + JSON.stringify(lado));
  conf('as duas colunas; a de química diz "livro de Química", e nenhuma "de outro ano"',
    /livro-qui=[^;]*livro de Química/.test(lado.colunas) && /livro-fis=/.test(lado.colunas) && lado.colunas.indexOf('de outro ano') < 0, true);
  conf('o resumo conta a de outra matéria', /1 de outra matéria, com capítulo ligado/.test(lado.resumo), true);
  conf('nenhum travessão no lado a lado', lado.travessao, false);

  secao('5. Nenhum erro de página');
  conf('nenhum erro de página', erros.join(' | ') || 'nenhum', 'nenhum');
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
