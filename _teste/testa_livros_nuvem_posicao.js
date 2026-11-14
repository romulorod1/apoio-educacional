/* testa_livros_nuvem_posicao.js
 *
 * Fase 1a da biblioteca na nuvem (DESENHO 4.1 e 4.2), no Chrome de verdade:
 * a posição de leitura e a correção dela no mapa sobrevivem a qualquer troca
 * de meta ou de arquivo do livro. Livros SINTÉTICOS (PDFs de poucas páginas
 * montados aqui, e um "EPUB" que ninguém abre), gravados pelo
 * Store.gravarLivros de verdade, o mesmo que a importação do zip usa e que a
 * nuvem vai usar. Nenhum livro real, nenhum nome de criança, nenhuma conta.
 *
 * O que se prova:
 *   1. a posição de leitura numa troca (v1 para v2 do mesmo pacote):
 *      a. só o meta muda (mesmo arquivo, sumário novo): a posição fica, byte
 *         a byte;
 *      b. o arquivo muda E o sumário muda, a página existe: fica (era aqui
 *         que a main a soltava, o posicoesSoltas);
 *      c. o arquivo muda, sumário igual, a página existe: fica, com o sha do
 *         arquivo novo;
 *      d. o arquivo muda e a página não existe (8 num livro que ficou com 6):
 *         vai para a 6, com ajustadaDe { pagina: 8 };
 *      e. o EPUB das resoluções do FME remontado em PDF (mesmo id): a âncora
 *         page_7 da posição vira a p. 7;
 *      f. o mesmo sem âncora: a p. 1, com ajustadaDe { capitulo };
 *      g. o lado contrário: gravar o mesmo v2 de novo não muda NADA (as
 *         posições e os livros byte a byte), e livro sem posição não ganha
 *         posição;
 *      h. a regra pura (Store.posicaoNoArquivoNovo): o EPUB que encolhe, a
 *         ida e volta PDF, EPUB, PDF que termina na página dela, o ajuste que
 *         volta ao lugar de verdade quando ele existe, a página impressa;
 *      i. o livro que sai do pacote sai do tablet, e a posição dele FICA;
 *      j. o livro que volta com outro arquivo passa a posição velha pela regra
 *         da troca; com o mesmo arquivo, ela fica byte a byte;
 *   2. o aviso: a tela do livro d diz "Você estava na p. 8" e "Continuar na
 *      p. 6"; o leitor abre na p. 6 com a mesma frase no alto; só abrir não
 *      tira o ajuste; ela muda de página, e o aviso não volta;
 *   3. a palavra nova pela faixa do leitor (Confirmar) num capítulo cujo
 *      número guarda uma correção órfã dela: as duas ficam;
 *   4. as órfãs na tela do livro: a linha discreta com o número, a sugestão
 *      de um toque (só para a que tem capítulo provável), "Ligar a um
 *      capítulo" que PERGUNTA antes de trocar a correção de um capítulo
 *      (Cancelar não muda nada), "Descartar", o Desfazer que devolve SÓ o que
 *      a ação mexeu (uma correção feita entre a ação e o Desfazer fica), e a
 *      trava de transbordo da linha aberta (360, 390 e 412 px, fonte a 130%);
 *   5. nenhum erro de página.
 *
 * Venenos (a prova TEM de ver o defeito e passa dizendo que viu):
 *   --envenenado-solta-no-meta     a posição sai quando só o meta muda (1a);
 *   --envenenado-solta-no-sumario  o delete do posicoesSoltas de volta (1b);
 *   --envenenado-solta-na-troca    a posição sai em toda troca de arquivo (1c);
 *   --envenenado-nao-ajusta        a página que não existe fica (1d);
 *   --envenenado-sem-traducao      a âncora page_N é ignorada (1e);
 *   --envenenado-solta-no-removido o livro que sai do pacote leva a posição (1i);
 *   --envenenado-volta-sem-regra   o livro que volta com outro arquivo fica com a
 *                                  posição velha, sem a regra da troca (1j);
 *   --envenenado-sem-aviso         o leitor não diz onde ela estava (2);
 *   --envenenado-ajuste-sai-na-abertura  o ajuste sai só de abrir (2);
 *   --envenenado-grava-por-cima-na-tela  o Confirmar grava no número do
 *                                  capítulo e apaga a órfã (3);
 *   --envenenado-orfa-some-da-tela a linha das órfãs não aparece (4);
 *   --envenenado-troca-sem-perguntar  ligar a um capítulo com correção troca
 *                                  sem perguntar (4);
 *   --envenenado-desfazer-tudo     o Desfazer zera o livro e devolve só o que
 *                                  mexeu: as outras correções somem (4).
 *
 *   node _teste/testa_livros_nuvem_posicao.js [--envenenado-...]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const H = require('./_bib_navegador.js');
const { conf, secao, esperar, pausa } = H;

const PORTA = 8972;
const STORE = fs.readFileSync(path.join(H.RAIZ, 'store.js'), 'utf8').replace(/\r\n/g, '\n');
const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const VENENOS = {
  '--envenenado-solta-no-meta': ['store', 'if (mesmoArquivo) {\n              contas.iguais++;',
    "if (mesmoArquivo) {\n              contas.iguais++; t.objectStore('livros_posicoes').delete(l.meta.id);"],
  '--envenenado-solta-no-sumario': ['store', 'contas.sumariosMudados++;', "contas.sumariosMudados++; t.objectStore('livros_posicoes').delete(l.meta.id);"],
  '--envenenado-solta-na-troca': ['store', 'var nova = posicaoNoArquivoNovo(rp.result, atual.meta, l.meta);', 'var nova = null; ps.delete(l.meta.id);'],
  '--envenenado-nao-ajusta': ['store', 'if (inteiroPositivo(total) && pos.pagina > total) {', 'if (false) {'],
  '--envenenado-sem-traducao': ['store', 'var n = paginaDaAncora(pos.ancoraVista || pos.ancora);', 'var n = null;'],
  '--envenenado-sem-aviso': ['app', "var ondeEstava = !destino ? avisoDaPosicaoAjustada(pos) : '';", "var ondeEstava = '';"],
  '--envenenado-orfa-some-da-tela': ['app', 'if (orfas.length) lista.appendChild(blocoDasCorrecoesOrfas(l, orfas, mapa, nomeDoAssunto));', 'void 0;'],
  '--envenenado-grava-por-cima-na-tela': ['app', 'doLivro[Biblioteca.chaveParaGravarCorrecao(doLivro, entrada)] = registro;', 'doLivro[String(entrada.n)] = registro;'],
  '--envenenado-solta-no-removido': ['store', '            contas.removidos++;\n', "            contas.removidos++; t.objectStore('livros_posicoes').delete(c.value.id);\n"],
  '--envenenado-ajuste-sai-na-abertura': ['app', 'ajustadaDe: ajuste && !ajuste.mexeu ? ajuste.de : null })', 'ajustadaDe: null })'],
  '--envenenado-troca-sem-perguntar': ['app', 'if (entrada && entrada.correcaoChave && entrada.correcaoChave !== chaveOrfa && !confirmado) {', 'if (false) {'],
  '--envenenado-volta-sem-regra': ['store', 'var voltou = posicaoNoArquivoNovo(velha, null, l.meta);', 'var voltou = null;'],
  '--envenenado-desfazer-tudo': ['app', 'var agora = db.ajustes.mapaDosLivros[l.id] = db.ajustes.mapaDosLivros[l.id] || {};', 'var agora = db.ajustes.mapaDosLivros[l.id] = {};']
};
const MODO = Object.keys(VENENOS).filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && !VENENOS[a]);
const trocas = {};
let ancoraVezes = 1;
if (MODO) {
  const [qual, de, para] = VENENOS[MODO];
  const fonte = qual === 'store' ? STORE : APP;
  ancoraVezes = fonte.split(de).length - 1;
  trocas[qual === 'store' ? '/store.js' : '/app.js'] = fonte.split(de).join(para);
}
const amb = H.criarAmbiente(PORTA, 'nath_nuvem_posicao', trocas);

/* Um PDF de verdade, mínimo: n páginas com o número escrito, que o pdf.js do
 * leitor abre. As tabelas de posição (xref) são contadas aqui. */
function pdfMinimo(n, rotulo) {
  const objs = [];
  const fonte = 3 + 2 * n;
  const kids = [];
  for (let i = 0; i < n; i++) kids.push((3 + 2 * i) + ' 0 R');
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[2] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>';
  for (let i = 0; i < n; i++) {
    const texto = 'BT /F1 28 Tf 40 200 Td (' + rotulo + ' p ' + (i + 1) + ') Tj ET';
    objs[3 + 2 * i] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 400] /Resources << /Font << /F1 ' + fonte + ' 0 R >> >> /Contents ' + (4 + 2 * i) + ' 0 R >>';
    objs[4 + 2 * i] = '<< /Length ' + texto.length + ' >>\nstream\n' + texto + '\nendstream';
  }
  objs[fonte] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  let saida = '%PDF-1.4\n';
  const pos = [];
  for (let k = 1; k < objs.length; k++) { pos[k] = Buffer.byteLength(saida); saida += k + ' 0 obj\n' + objs[k] + '\nendobj\n'; }
  const xref = Buffer.byteLength(saida);
  saida += 'xref\n0 ' + objs.length + '\n0000000000 65535 f \n';
  for (let k = 1; k < objs.length; k++) saida += String(pos[k]).padStart(10, '0') + ' 00000 n \n';
  saida += 'trailer\n<< /Size ' + objs.length + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
  return Buffer.from(saida, 'latin1');
}
const hashDe = b => 'sha256:' + crypto.createHash('sha256').update(b).digest('hex');
const ARQ = {
  dez: pdfMinimo(10, 'Livro'), dezB: pdfMinimo(10, 'Livro novo'), seis: pdfMinimo(6, 'Livro curto'),
  epub: Buffer.from('PK sintetico epub de imagens ' + 'e'.repeat(800))
};
const PACOTE = 'prova-nuvem-posicao';
const SUM1 = [{ n: 1, nivel: 1, titulo: 'Parte A', pagina: 1, pagina_fim: 5 }, { n: 2, nivel: 1, titulo: 'Parte B', pagina: 6, pagina_fim: 10 }];
const SUM2 = [{ n: 1, nivel: 1, titulo: 'Números', pagina: 1, pagina_fim: 3 }, { n: 2, nivel: 1, titulo: 'Funções', pagina: 4, pagina_fim: 10 }];
const MAPA_ORFA = [
  { n: 1, titulo: 'Introdução', pagina: 1, pagina_fim: 3, assuntos: [{ id: 'MAT09-01', confianca: 'auto' }], origem: 'auto' },
  { n: 2, titulo: 'Funções', pagina: 4, pagina_fim: 6, assuntos: [{ id: 'MAT09-06', confianca: 'alta' }], origem: 'mapa' },
  { n: 3, titulo: 'Estatística', pagina: 7, pagina_fim: 10, assuntos: [{ id: 'MAT09-11', confianca: 'alta' }], origem: 'mapa' }];
const SUM_ORFA = MAPA_ORFA.map(e => ({ n: e.n, nivel: 1, titulo: e.titulo, pagina: e.pagina, pagina_fim: e.pagina_fim }));

function livro(id, arq, extra) {
  const b = ARQ[arq];
  return { id, b64: b.toString('base64'), meta: Object.assign({ id, formato: 'pdf', arquivo: 'livros/' + id + '.pdf', hash: hashDe(b), bytes: b.length,
    titulo: 'Prova ' + id, materia: 'matematica', series: ['09'], series_origem: 'mapa', mapa_disciplina: 'matematica',
    paginas: arq === 'seis' ? 6 : 10, sumario: SUM1, sumario_origem: 'marcadores', mapa: [] }, extra || {}) };
}
const epubMeta = id => ({ formato: 'epub', arquivo: 'livros/' + id + '.epub', paginas: undefined,
  epub: { espinha: ['OEBPS/parte1.xhtml', 'OEBPS/parte2.xhtml', 'OEBPS/parte3.xhtml'] }, sumario: [{ n: 1, nivel: 1, titulo: 'Exercícios', capitulo: 1 }] });
const V1 = [
  livro('pos-meta', 'dez'),
  livro('pos-arquivo-sumario', 'dez'),
  livro('pos-arquivo', 'dez'),
  livro('pos-encolhe', 'dez'),
  livro('pos-fme', 'epub', epubMeta('pos-fme')),
  livro('pos-fme-sem-ancora', 'epub', epubMeta('pos-fme-sem-ancora')),
  livro('pos-sem-posicao', 'dez'),
  livro('orfa-livro', 'dez', { sumario: SUM_ORFA, mapa: MAPA_ORFA }),
  livro('pos-sai', 'dez'),
  livro('pos-volta-igual', 'dez')
];
const V2 = [
  livro('pos-meta', 'dez', { sumario: SUM2 }),
  livro('pos-arquivo-sumario', 'dezB', { sumario: SUM2 }),
  livro('pos-arquivo', 'dezB'),
  livro('pos-encolhe', 'seis', { sumario: [{ n: 1, nivel: 1, titulo: 'Parte A', pagina: 1, pagina_fim: 6 }] }),
  livro('pos-fme', 'dez', { sumario: [{ n: 1, nivel: 1, titulo: 'Exercícios', pagina: 1, pagina_fim: 10 }] }),
  livro('pos-fme-sem-ancora', 'dez', { sumario: [{ n: 1, nivel: 1, titulo: 'Exercícios', pagina: 1, pagina_fim: 10 }] }),
  livro('pos-sem-posicao', 'dezB'),
  livro('orfa-livro', 'dez', { sumario: SUM_ORFA, mapa: MAPA_ORFA })
];
const CORRECOES = { 'orfa-livro': {
  // gravada quando "Funções" era o capítulo 1: o mapa renumerou; sem chave, ela fica órfã com a sugestão do 2
  1: { titulo: 'Funções', assuntos: ['MAT09-07'], acao: 'corrigiu', quando: '2026-11-10T10:00:00.000Z' },
  // a do capítulo 3, de mesmo número e título: vale
  3: { titulo: 'Estatística', assuntos: ['MAT09-12'], acao: 'corrigiu', quando: '2026-11-09T10:00:00.000Z' },
  // de um capítulo que saiu do mapa: órfã
  5: { titulo: 'Capítulo que saiu', assuntos: ['MAT09-04'], acao: 'corrigiu', quando: '2026-11-10T10:00:00.000Z' }
} };

const gravar = (pag, versao, lista) => pag.evaluate(async (versao, lista) => {
  const livros = lista.map(l => {
    const bin = atob(l.b64); const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return { meta: l.meta, blob: new Blob([u], { type: l.meta.formato === 'epub' ? 'application/epub+zip' : 'application/pdf' }) };
  });
  return Store.gravarLivros({ manifest: { pacote: 'prova-nuvem-posicao', versao }, livros });
}, versao, lista);

// o JSON cru de 'livros' (sem o Blob) e de 'livros_posicoes', direto do IndexedDB
const retrato = pag => pag.evaluate(() => new Promise((ok, falha) => {
  const q = indexedDB.open('apoio-educacional');
  q.onerror = () => falha(q.error);
  q.onsuccess = () => {
    const b = q.result; const tr = b.transaction(['livros', 'livros_posicoes'], 'readonly');
    const r = { livros: {}, posicoes: {} };
    tr.objectStore('livros').getAll().onsuccess = e => {
      e.target.result.forEach(x => { r.livros[x.id] = JSON.stringify(Object.assign({}, x, { blob: x.blob ? x.blob.size : null })); });
    };
    tr.objectStore('livros_posicoes').getAll().onsuccess = e => {
      e.target.result.forEach(p => { r.posicoes[p.id] = JSON.stringify(p); });
    };
    tr.oncomplete = () => { b.close(); ok(r); };
    tr.onerror = () => { b.close(); falha(tr.error); };
  };
}));
const posicao = (pag, id) => pag.evaluate(i => Store.lerPosicaoLivro(i).then(p => p ? JSON.stringify(p) : null), id);
const resumoPos = p => { if (!p) return 'nenhuma'; const o = JSON.parse(p);
  return [o.pagina != null ? 'p' + o.pagina : '', o.capitulo != null ? 'c' + o.capitulo : '',
    o.ajustadaDe ? 'de:' + JSON.stringify(o.ajustadaDe) : ''].filter(Boolean).join(' '); };
const db = pag => pag.evaluate(() => Store.carregar().then(d => JSON.stringify(((d.ajustes || {}).mapaDosLivros || {})['orfa-livro'] || null)));
const clicar = (pag, sel) => pag.evaluate(s => { const b = document.querySelector(s); if (!b) return false; b.click(); return true; }, sel);

async function abrirTela(pag, id) {
  await H.irParaAba(pag, 'biblioteca');
  await esperar('o livro ' + id + ' na aba Biblioteca', () => pag.evaluate(i => {
    const sel = '#bib-livros [data-livro="' + i + '"]';
    if (document.querySelector(sel)) return true;
    const d = document.querySelector('#bib-livros .bibl-disciplina[data-disciplina="matematica"]'); if (d) d.click();
    // P3: a Matemática abre por assunto; os livros dela ficam na Estante, a um toque
    const e = document.querySelector('#bib-abrir-estante'); if (e) e.click();
    const a = document.querySelector('#bib-livros .bibl-ano[data-ano="09"]'); if (a) a.click();
    return !!document.querySelector(sel);
  }, id), v => v, 10000);
  await clicar(pag, '#bib-livros [data-livro="' + id + '"]');
  await esperar('a tela do livro ' + id, () => pag.evaluate(i => {
    const t = document.querySelector('#bib-livro'); return !!t && !t.hidden && t.dataset.livro === i;
  }, id), v => v, 10000);
}
const tela = pag => pag.evaluate(() => {
  const q = s => document.querySelector(s);
  return { ondeEstava: (q('#bib-livro-onde-estava') || {}).textContent || '', continuar: (q('#bib-livro-continuar') || {}).textContent || '',
    orfas: q('#bib-livro-orfas') ? q('#bib-livro-orfas').dataset.orfas : '', linha: (q('#bib-livro-orfas-linha') || {}).textContent || '',
    aberta: (q('#bib-livro-orfas-linha') || { getAttribute: () => '' }).getAttribute('aria-expanded'),
    itens: Array.from(document.querySelectorAll('#bib-livro .bibl-orfa')).map(e => e.dataset.orfa + '|' + e.querySelector('.bibl-orfa-texto').textContent).join(' ; '),
    sugestoes: Array.from(document.querySelectorAll('#bib-livro [data-sugestao]')).map(e => e.dataset.sugestao + '=' + e.textContent).join(' ; '),
    pergunta: Array.from(document.querySelectorAll('#bib-livro .bibl-orfa-pergunta .bibl-orfa-texto')).map(e => e.textContent).join(' ; '),
    capitulos: Array.from(document.querySelectorAll('#bib-livro .bibl-orfa-capitulo')).map(e => e.dataset.ligarEm + '=' + e.textContent).join(' ; '),
    assuntos: Array.from(document.querySelectorAll('#bib-livro .bibl-cap')).map(b => b.dataset.n + ':' + ((b.querySelector('.bibl-cap-assuntos') || {}).textContent || '')).join(' | ') };
});
async function fecharModal(pag, id) {
  await pag.evaluate(i => { const b = document.querySelector('#' + i + ' .modal-rodape [data-fechar]') || document.querySelector('#' + i + ' [data-fechar]'); if (b) b.click(); }, id);
  await esperar('a janela ' + id + ' fechou', () => pag.evaluate(i => !document.querySelector('#' + i + '.aberto'), id), v => v, 5000);
}
const paginaDesenhada = pag => pag.evaluate(() => {
  const c = document.querySelector('#corpo-modal-leitor-pdf');
  return c && document.querySelector('#modal-leitor-pdf.aberto') ? (c.dataset.paginaDesenhada || '') : 'fechado';
});
const desfazer = async (pag, rotulo) => {
  const r = await esperar('o Desfazer de "' + rotulo + '"', () => pag.evaluate(() => {
    const b = document.querySelector('#aviso-acao'); const t = document.querySelector('#aviso-texto');
    return b && b.offsetParent !== null && /Desfazer/.test(b.textContent) ? t.textContent : '';
  }), v => !!v, 5000);
  await clicar(pag, '#aviso-acao');
  return r.valor;
};
const LETRA_130 = 'html{font-size:130%} body{font-size:20.8px}';
const medirOrfas = (pag, largura) => pag.evaluate(w => {
  const v = document.querySelector('#prova-largura'); if (v) v.remove();
  const s = document.createElement('style'); s.id = 'prova-largura';
  s.textContent = '.bibl-sumario{flex:0 0 ' + w + 'px !important;max-width:' + w + 'px !important;padding-left:16px !important;padding-right:16px !important}';
  document.head.appendChild(s);
  const ruins = [];
  const caixa = document.querySelector('#bib-livro-orfas');
  if (!caixa) return ['sem a caixa das órfãs'];
  const cr = caixa.getBoundingClientRect();
  caixa.querySelectorAll('button, p').forEach(e => {
    const r = e.getBoundingClientRect();
    if (!r.width && !r.height) return;
    const nome = e.dataset.orfa || e.dataset.ligar || e.dataset.descartar || e.dataset.ligarEm || e.id || e.className;
    if (r.left < cr.left - 0.5 || r.right > cr.right + 0.5) ruins.push(nome + ' sai da caixa');
    if (e.scrollWidth > e.clientWidth + 1) ruins.push(nome + ' transborda por dentro');
    if (e.tagName === 'BUTTON') {
      if (r.height < 43.5) ruins.push(nome + ' com alvo de ' + Math.round(r.height) + ' px de altura');
      const rg = document.createRange(); rg.selectNodeContents(e); const t = rg.getBoundingClientRect();
      if (t.width && (t.left < r.left - 0.5 || t.right > r.right + 0.5)) ruins.push(nome + ': o texto sai do botão');
    }
  });
  if (cr.right > document.querySelector('.bibl-sumario').getBoundingClientRect().right + 0.5) ruins.push('a caixa sai do sumário');
  if (/—|–/.test(caixa.innerText)) ruins.push('travessão no texto');
  s.remove();
  return ruins;
}, largura);

(async () => {
  secao('0. A prova se confere');
  conf('nenhum veneno desconhecido foi pedido', desconhecidos.join(','), '');
  Object.keys(VENENOS).forEach(m => {
    const [qual, de] = VENENOS[m];
    conf('a âncora de ' + m + ' aparece uma vez só no ' + qual + '.js', (qual === 'store' ? STORE : APP).split(de).length - 1, 1);
  });
  if (MODO) conf('envenenado: o arquivo servido mudou', ancoraVezes === 1 && Object.keys(trocas).length === 1, true);
  conf('os PDFs sintéticos têm 10, 10 e 6 páginas e hashes diferentes', [ARQ.dez, ARQ.dezB, ARQ.seis].map(hashDe).filter((h, i, a) => a.indexOf(h) === i).length, 3);

  await amb.subir();
  const pag = await amb.pagina();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.setViewport({ width: 1280, height: 800 });
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('1. A posição de leitura numa troca de meta ou de arquivo');
  const c1 = await gravar(pag, 1, V1);
  conf('o v1 entrou inteiro', c1.novos, V1.length);
  await pag.evaluate(async (c, hashDez) => {
    await Store.gravarPosicaoLivro({ id: 'pos-meta', pagina: 7 });
    await Store.gravarPosicaoLivro({ id: 'pos-arquivo-sumario', pagina: 7 });
    await Store.gravarPosicaoLivro({ id: 'pos-arquivo', pagina: 7, sha: 'sha256:antigo' });
    await Store.gravarPosicaoLivro({ id: 'pos-encolhe', pagina: 8 });
    await Store.gravarPosicaoLivro({ id: 'pos-fme', capitulo: 2, fracao: 0.4, ancoraVista: 'page_7' });
    await Store.gravarPosicaoLivro({ id: 'pos-fme-sem-ancora', capitulo: 2, fracao: 0.4 });
    await Store.gravarPosicaoLivro({ id: 'pos-sai', pagina: 8, sha: hashDez });
    await Store.gravarPosicaoLivro({ id: 'pos-volta-igual', pagina: 8, sha: hashDez });
    const d = await Store.carregar();
    d.ajustes = d.ajustes || {};
    d.ajustes.mapaDosLivros = c;
    await Store.salvar(d);
  }, CORRECOES, hashDe(ARQ.dez));
  const antes = await retrato(pag);
  conf('controle: o retrato enxerga as sete posições gravadas', Object.keys(antes.posicoes).sort().join(','),
    'pos-arquivo,pos-arquivo-sumario,pos-encolhe,pos-fme,pos-fme-sem-ancora,pos-meta,pos-sai,pos-volta-igual');
  conf('controle: a âncora do EPUB ficou gravada na posição', JSON.parse(antes.posicoes['pos-fme']).ancoraVista, 'page_7');
  const c2 = await gravar(pag, 2, V2);
  console.log('   contas do v2: ' + JSON.stringify(c2));
  const depois = await retrato(pag);
  const P = id => resumoPos(depois.posicoes[id] || null);
  const veneno = (rotulo, visto) => { conf('VENENO visto: ' + rotulo, visto, true); };
  if (MODO === '--envenenado-solta-no-meta') { veneno('a posição do livro de meta novo sumiu', P('pos-meta') === 'nenhuma'); return H.fim(amb)(); }
  if (MODO === '--envenenado-solta-no-sumario') { veneno('a posição do livro de arquivo e sumário novos sumiu', P('pos-arquivo-sumario') === 'nenhuma'); return H.fim(amb)(); }
  if (MODO === '--envenenado-solta-na-troca') { veneno('a posição do livro de arquivo novo sumiu', P('pos-arquivo') === 'nenhuma'); return H.fim(amb)(); }
  if (MODO === '--envenenado-nao-ajusta') { veneno('a posição ficou na p. 8 de um livro de 6', P('pos-encolhe') === 'p8'); return H.fim(amb)(); }
  if (MODO === '--envenenado-sem-traducao') { veneno('a âncora page_7 foi ignorada e o livro abre na p. 1', P('pos-fme') === 'p1 de:{"capitulo":2}'); return H.fim(amb)(); }
  if (MODO === '--envenenado-solta-no-removido') { veneno('a posição do livro que saiu do pacote sumiu sem ação dela', P('pos-sai') === 'nenhuma'); return H.fim(amb)(); }
  conf('as contas: 6 de arquivo novo, 2 de mesmo arquivo (meta novo), 2 que saíram do pacote, 4 sumários mudados, 2 posições ajustadas',
    [c2.atualizados, c2.iguais, c2.removidos, c2.sumariosMudados, c2.posicoesAjustadas].join('/'), '6/2/2/4/2');
  conf('a. só o meta mudou: a posição ficou byte a byte', depois.posicoes['pos-meta'] === antes.posicoes['pos-meta'], true);
  conf('a. e o meta trocou (o sumário novo entrou)', JSON.parse(depois.livros['pos-meta']).meta.sumario[0].titulo, 'Números');
  conf('b. o arquivo e o sumário mudaram, a página existe: a posição ficou na 7', P('pos-arquivo-sumario'), 'p7');
  conf('c. o arquivo mudou, a página existe: ficou na 7', P('pos-arquivo'), 'p7');
  conf('c. com o sha do arquivo novo', JSON.parse(depois.posicoes['pos-arquivo']).sha, V2[2].meta.hash);
  conf('d. a página 8 não existe no arquivo de 6: vai para a 6, com onde ela estava', P('pos-encolhe'), 'p6 de:{"pagina":8}');
  conf('e. o FME remontado em PDF: a âncora page_7 vira a p. 7, sem aviso', P('pos-fme'), 'p7');
  conf('e. e o registro não guarda mais capítulo, fração nem âncora', ['capitulo', 'fracao', 'ancoraVista'].filter(k => k in JSON.parse(depois.posicoes['pos-fme'])).join(','), '');
  conf('f. sem âncora: a p. 1, com a parte onde ela estava', P('pos-fme-sem-ancora'), 'p1 de:{"capitulo":2}');
  conf('g. o livro sem posição continua sem posição', P('pos-sem-posicao'), 'nenhuma');
  conf('i. o livro que saiu do pacote sai do tablet, e a posição dele FICA, byte a byte', !depois.livros['pos-sai'] + '|' + (depois.posicoes['pos-sai'] === antes.posicoes['pos-sai']), 'true|true');
  const c3 = await gravar(pag, 2, V2);
  const outraVez = await retrato(pag);
  conf('g. gravar o mesmo v2 de novo: tudo igual, nada regravado', c3.iguais + '/' + c3.atualizados + '/' + c3.posicoesAjustadas, V2.length + '/0/0');
  conf('g. as posições byte a byte', JSON.stringify(outraVez.posicoes) === JSON.stringify(depois.posicoes), true);
  conf('g. e os livros byte a byte', JSON.stringify(outraVez.livros) === JSON.stringify(depois.livros), true);
  // j. os dois que saíram VOLTAM no v3: um com outro arquivo (6 páginas), outro com o mesmo de antes
  const c4 = await gravar(pag, 3, V2.concat([livro('pos-sai', 'seis'), livro('pos-volta-igual', 'dez')]));
  const voltou = await retrato(pag);
  const PV = id => resumoPos(voltou.posicoes[id] || null);
  if (MODO === '--envenenado-volta-sem-regra') { veneno('o livro que voltou com 6 páginas ficou com a posição na p. 8', PV('pos-sai') === 'p8'); return H.fim(amb)(); }
  conf('j. os dois voltaram como novos', c4.novos, 2);
  conf('j. o que voltou com outro arquivo passa pela regra da troca: a p. 8 não existe, vai para a 6 com o aviso', PV('pos-sai'), 'p6 de:{"pagina":8}');
  conf('j. e leva o sha do arquivo novo', JSON.parse(voltou.posicoes['pos-sai']).sha, hashDe(ARQ.seis));
  conf('j. o que voltou com o MESMO arquivo: a posição fica byte a byte', voltou.posicoes['pos-volta-igual'] === depois.posicoes['pos-volta-igual'], true);
  const pura = await pag.evaluate(() => {
    const ep = n => ({ formato: 'epub', hash: 'sha256:novo', epub: { espinha: Array.from({ length: n }, (_, i) => 'p' + i + '.xhtml') } });
    const pdf = (n, extra) => Object.assign({ formato: 'pdf', paginas: n, hash: 'sha256:h' + n }, extra || {});
    const f = (pos, a, b) => JSON.stringify(Store.posicaoNoArquivoNovo(pos, a, b));
    // a ida e volta: PDF p. 40, vira EPUB, volta a PDF de 100 páginas
    const ida = Store.posicaoNoArquivoNovo({ id: 'x', pagina: 40 }, pdf(100), ep(3));
    return [
      f({ id: 'x', capitulo: 5, fracao: 0.3 }, ep(9), ep(3)),
      f({ id: 'x', capitulo: 2, fracao: 0.3 }, ep(9), ep(3)),
      JSON.stringify(ida),
      f(ida, ep(3), pdf(100)),
      f({ id: 'x', pagina: 30, ajustadaDe: { pagina: 312 } }, pdf(30), pdf(29)),
      f({ id: 'x', pagina: 30, ajustadaDe: { pagina: 312 } }, pdf(30), pdf(400)),
      f({ id: 'x', pagina: 3, ajustadaDe: { capitulo: 5 } }, pdf(10), ep(9)),
      f({ id: 'x', pagina: 8 }, pdf(10, { id: 'x', numeracao: [{ estilo: 'arabico', inicio: 1, de: 3, ate: 10 }] }), pdf(6)),
      f(null, { formato: 'pdf' }, pdf(3))
    ].join(' ; ');
  });
  conf('h. a regra pura: o EPUB que encolhe, o que não encolhe, a ida e a volta, o ajuste que fica, o que volta para o lugar dela, a página impressa e a falta de posição', pura,
    '{"id":"x","capitulo":3,"fracao":0,"sha":"sha256:novo","ajustadaDe":{"capitulo":5}} ; ' +
    '{"id":"x","capitulo":2,"fracao":0.3,"sha":"sha256:novo"} ; ' +
    '{"id":"x","sha":"sha256:novo","capitulo":1,"fracao":0,"ajustadaDe":{"pagina":40}} ; ' +
    '{"id":"x","sha":"sha256:h100","pagina":40} ; ' +
    '{"id":"x","pagina":29,"ajustadaDe":{"pagina":312},"sha":"sha256:h29"} ; ' +
    '{"id":"x","pagina":312,"sha":"sha256:h400"} ; ' +
    '{"id":"x","sha":"sha256:novo","capitulo":5,"fracao":0} ; ' +
    '{"id":"x","pagina":6,"sha":"sha256:h6","ajustadaDe":{"pagina":8,"impressa":"6"}} ; null');
  conf('a tela da importação diz que o livro não abre mais onde ela parou', await pag.evaluate(c => Biblioteca.resumoDeLivros(c).join(' '), c2),
    '6 atualizados, 2 já estavam no tablet, 2 saíram do pacote e do tablet 2 livros atualizados não abrem mais onde você parou; ao abrir, cada um diz onde você estava.');

  // ================================================================
  secao('2. O aviso de onde ela estava');
  await H.abrirApp(pag, amb.ORIGEM);
  await abrirTela(pag, 'pos-encolhe');
  let t = await tela(pag);
  if (MODO !== '--envenenado-sem-aviso') {
    conf('a tela do livro diz onde ela estava e continua na última página', t.ondeEstava + ' | ' + t.continuar,
      'Este livro foi atualizado. Você estava na p. 8. | Continuar na p. 6');
  }
  await clicar(pag, '#bib-livro-continuar');
  await esperar('o leitor na p. 6', () => paginaDesenhada(pag), v => v === '6', 30000);
  const dica = await pag.evaluate(() => { const d = document.querySelector('#leitor-dica'); return d && !d.hidden ? d.textContent : ''; });
  if (MODO === '--envenenado-sem-aviso') {
    veneno('o leitor abriu na p. 6 sem dizer onde ela estava', dica === '');
    return H.fim(amb)();
  }
  conf('o leitor abre na p. 6 com a frase no alto', dica, 'Este livro foi atualizado. Você estava na p. 8.');
  // a gravação automática da página aberta (leva o sha do arquivo) repassa o ajuste
  const aberta = await esperar('a posição regravada ao abrir', () => posicao(pag, 'pos-encolhe'), v => !!v && JSON.parse(v).sha === V2[3].meta.hash, 10000);
  if (MODO === '--envenenado-ajuste-sai-na-abertura') {
    veneno('o ajuste saiu só de abrir o livro, sem ela mudar de página', !/ajustadaDe/.test(aberta.valor));
    return H.fim(amb)();
  }
  conf('só de abrir, o ajuste fica (ela ainda não mudou de página)', resumoPos(aberta.valor), 'p6 de:{"pagina":8}');
  await clicar(pag, '#leitor-anterior');
  const lida = await esperar('a posição depois de ela ir para a p. 5', () => posicao(pag, 'pos-encolhe'), v => !!v && JSON.parse(v).pagina === 5, 10000);
  conf('ela mudou de página: o ajuste sai, e o sha do arquivo fica', resumoPos(lida.valor) + ' ' + JSON.parse(lida.valor).sha, 'p5 ' + V2[3].meta.hash);
  await fecharModal(pag, 'modal-leitor-pdf');
  await esperar('a tela do livro redesenhada sem o aviso', () => tela(pag), v => v.ondeEstava === '' && /Continuar na p\. 5/.test(v.continuar), 10000);
  conf('o aviso não volta', (await tela(pag)).ondeEstava, '');

  // ================================================================
  secao('3. A palavra nova pela faixa do leitor, num número que guarda outra correção');
  const db0 = await db(pag);
  conf('controle: o db tem as três correções do livro', Object.keys(JSON.parse(db0)).join(','), '1,3,5');
  await abrirTela(pag, 'orfa-livro');
  const valendo = await pag.evaluate(() => Store.lerLivro('orfa-livro').then(r => Store.carregar().then(d =>
    Biblioteca.mapaDoLivro(r.meta, d.ajustes.mapaDosLivros['orfa-livro']).map(e => e.n + ':' + e.estado + ':' + e.assuntos.join('+')).join(' '))));
  conf('o mapa que vale: a do "1" antigo (Funções) NÃO cai calada no 2; a do 3 vale', valendo, '1:a_confirmar:MAT09-01 2:do_mapa:MAT09-06 3:corrigido:MAT09-12');
  conf('só abrir a tela não muda o db', await db(pag), db0);
  await clicar(pag, '#bib-livro .bibl-cap[data-n="1"]');
  await esperar('o leitor na p. 1', () => paginaDesenhada(pag), v => v === '1', 30000);
  const faixa = await esperar('a faixa do capítulo 1 com Confirmar', () => pag.evaluate(() => {
    const c = document.querySelector('#leitor-cobre');
    return c && !c.hidden ? c.dataset.capitulo + ':' + c.dataset.estado + ':' + !!c.querySelector('#cobre-confirmar') : '';
  }), v => v === '1:a_confirmar:true', 10000);
  conf('a faixa do capítulo 1 (Introdução) está a confirmar', faixa.valor, '1:a_confirmar:true');
  await clicar(pag, '#cobre-confirmar');
  const gravado = await esperar('a confirmação no db', () => db(pag), v => !!v && v !== db0, 5000);
  const dg = JSON.parse(gravado.valor);
  if (MODO === '--envenenado-grava-por-cima-na-tela') {
    veneno('o Confirmar do capítulo 1 apagou a correção órfã de "Funções"', !Object.keys(dg).some(k => dg[k].titulo === 'Funções'));
    return H.fim(amb)();
  }
  conf('a órfã de "Funções" ficou no "1", e a de "Introdução" foi para uma chave nova',
    Object.keys(dg).sort().join(',') + '|' + dg['1'].titulo + '|' + (dg['1~introducao'] || {}).titulo + '/' + (dg['1~introducao'] || {}).acao + '/' + (dg['1~introducao'] || {}).n,
    '1,1~introducao,3,5|Funções|Introdução/confirmou/1');
  await fecharModal(pag, 'modal-leitor-pdf');

  // ================================================================
  secao('4. A correção órfã na tela do livro');
  const db1 = await db(pag);
  await esperar('os nomes dos assuntos', () => tela(pag), v => !/MAT09-/.test(v.assuntos) && v.orfas !== '', 10000);
  t = await tela(pag);
  if (MODO === '--envenenado-orfa-some-da-tela') {
    veneno('a tela do livro não mostra as correções órfãs', t.orfas === '' && t.linha === '');
    return H.fim(amb)();
  }
  conf('a linha discreta, recolhida, com o número', t.orfas + '|' + t.linha + '|' + t.aberta,
    '2|2 correções suas não acharam o capítulo depois da atualização|false');
  await clicar(pag, '#bib-livro-orfas-linha');
  t = (await esperar('a linha aberta', () => tela(pag), v => v.aberta === 'true', 5000)).valor;
  conf('aberta, cada uma diz o título e o que ela escolheu (com o nome do assunto)',
    /^1\|Capítulo “Funções”: .+ \(corrigido por você\) ; 5\|Capítulo “Capítulo que saiu”: .+ \(corrigido por você\)$/.test(t.itens) && !/MAT09-0/.test(t.itens), true);
  conf('a de "Funções" traz a sugestão de um toque; a do capítulo que saiu, não', t.sugestoes, '1=Ligar a “Funções” (p. 4)');
  // a sugestão de um toque
  await clicar(pag, '#bib-livro [data-sugestao="1"]');
  const sug = JSON.parse((await esperar('a sugestão aceita no db', () => db(pag), v => !!v && /"2":/.test(v), 5000)).valor);
  conf('um toque na sugestão: a órfã vai para o capítulo 2, com de onde veio', Object.keys(sug).sort().join(',') + '|' +
    [sug['2'].titulo, sug['2'].assuntos.join('+'), sug['2'].n, sug['2'].ligadaDe].join('/'), '1~introducao,2,3,5|Funções/MAT09-07/2/Funções');
  conf('o Desfazer da sugestão', await desfazer(pag, 'sugestão'), 'Correção ligada ao capítulo “Funções”.');
  if (MODO === '--envenenado-desfazer-tudo') {
    const dv = JSON.parse((await esperar('o Desfazer envenenado', () => db(pag), v => !!v && !/"2":/.test(v), 5000)).valor);
    veneno('o Desfazer apagou as correções do livro que a ação não mexeu', !dv['3'] && !dv['1~introducao']);
    return H.fim(amb)();
  }
  await esperar('o db de volta', () => db(pag), v => v === db1, 5000);
  conf('Desfazer devolve o db byte a byte', await db(pag), db1);
  t = (await esperar('a linha de volta', () => tela(pag), v => v.orfas === '2', 5000)).valor;
  if (t.aberta !== 'true') await clicar(pag, '#bib-livro-orfas-linha');
  await esperar('a linha aberta', () => tela(pag), v => v.aberta === 'true' && !!v.itens, 5000);
  // ligar a um capítulo que já tem correção: pergunta antes
  await clicar(pag, '#bib-livro [data-ligar="5"]');
  t = (await esperar('a lista dos capítulos', () => tela(pag), v => !!v.capitulos, 5000)).valor;
  conf('"Ligar a um capítulo" lista os capítulos do mapa de agora', t.capitulos, '1=Introdução (p. 1) ; 2=Funções (p. 4) ; 3=Estatística (p. 7)');
  await pag.evaluate(c => { const s = document.createElement('style'); s.id = 'prova-letra'; s.textContent = c; document.head.appendChild(s); }, LETRA_130);
  for (const w of [360, 390, 412]) conf('a trava de transbordo da linha aberta a ' + w + ' px, fonte a 130%', (await medirOrfas(pag, w)).join('; '), '');
  await pag.evaluate(() => { const s = document.querySelector('#prova-letra'); if (s) s.remove(); });
  await clicar(pag, '#bib-livro .bibl-orfa-capitulos [data-ligar-em="3"]');
  await pausa(300);
  t = await tela(pag);
  if (MODO === '--envenenado-troca-sem-perguntar') {
    veneno('ligar ao capítulo 3 trocou a correção dela sem perguntar', /"3":\{"titulo":"Estatística","assuntos":\["MAT09-04"\]/.test(await db(pag)));
    return H.fim(amb)();
  }
  conf('o capítulo 3 já tem correção dela: a linha pergunta, e o db não muda', t.pergunta + '|' + ((await db(pag)) === db1),
    '“Estatística” já tem uma correção sua. Trocar pela desta?|true');
  await clicar(pag, '#bib-livro [data-cancelar="5"]');
  t = (await esperar('a pergunta some', () => tela(pag), v => v.pergunta === '', 5000)).valor;
  conf('Cancelar: nada muda', (await db(pag)) === db1, true);
  if (!(await tela(pag)).capitulos) await clicar(pag, '#bib-livro [data-ligar="5"]');
  await esperar('a lista dos capítulos de novo', () => tela(pag), v => !!v.capitulos, 5000);
  await clicar(pag, '#bib-livro .bibl-orfa-capitulos [data-ligar-em="3"]');
  await esperar('a pergunta de novo', () => tela(pag), v => !!v.pergunta, 5000);
  await clicar(pag, '#bib-livro [data-trocar="5"]');
  const dt = JSON.parse((await esperar('a troca no db', () => db(pag), v => !!v && !/"5":/.test(v), 5000)).valor);
  conf('Trocar: o capítulo 3 recebe a da órfã, e a órfã sai da chave velha', Object.keys(dt).sort().join(',') + '|' +
    [dt['3'].titulo, dt['3'].assuntos.join('+'), dt['3'].ligadaDe].join('/'), '1,1~introducao,3|Estatística/MAT09-04/Capítulo que saiu');
  // o Desfazer da troca, guardado; ENTRE a troca e o Desfazer, outra correção dela (a sugestão de "Funções")
  await esperar('o Desfazer da troca à vista', () => pag.evaluate(() => {
    const b = document.querySelector('#aviso-acao'); return !!b && b.offsetParent !== null && /Desfazer/.test(b.textContent);
  }), v => v, 5000);
  await pag.evaluate(() => { window.__desfazerTroca = document.querySelector('#aviso-acao').onclick; });
  t = (await esperar('a linha com uma órfã', () => tela(pag), v => v.orfas === '1', 5000)).valor;
  if (t.aberta !== 'true') await clicar(pag, '#bib-livro-orfas-linha');
  await esperar('a sugestão à vista', () => tela(pag), v => /^1=/.test(v.sugestoes), 5000);
  await clicar(pag, '#bib-livro [data-sugestao="1"]');
  await esperar('a correção feita no meio', () => db(pag), v => !!v && /"2":/.test(v), 5000);
  await pag.evaluate(() => window.__desfazerTroca());
  const dd = JSON.parse((await esperar('o Desfazer da troca', () => db(pag), v => !!v && /"5":/.test(v), 5000)).valor);
  conf('o Desfazer da troca devolve o 3 e a órfã como estavam', JSON.stringify([dd['3'], dd['5']]),
    JSON.stringify([JSON.parse(db1)['3'], JSON.parse(db1)['5']]));
  conf('e a correção feita no meio (a do 2) fica', !!dd['2'] && dd['2'].titulo === 'Funções' && !dd['1'], true);
  // descartar, com Desfazer
  t = (await esperar('a linha com a órfã do capítulo que saiu', () => tela(pag), v => v.orfas === '1', 5000)).valor;
  if (t.aberta !== 'true') await clicar(pag, '#bib-livro-orfas-linha');
  await esperar('o Descartar à vista', () => pag.evaluate(() => !!document.querySelector('#bib-livro [data-descartar="5"]')), v => v, 5000);
  const dAntes = await db(pag);
  await clicar(pag, '#bib-livro [data-descartar="5"]');
  await esperar('a correção descartada no db', () => db(pag), v => !!v && !/"5":/.test(v), 5000);
  conf('o aviso de descartar tem Desfazer', await desfazer(pag, 'descartar'), 'Correção descartada.');
  await esperar('o db de volta', () => db(pag), v => v === dAntes, 5000);
  conf('Desfazer devolve o db byte a byte', await db(pag), dAntes);

  secao('5. Nenhum erro de página');
  conf('nenhum erro de página', erros.join(' | '), '');
  await H.fim(amb)();
})().catch(H.fim(amb));