/* testa_biblioteca_livros_tela.js
 *
 * A fatia B2 do redesenho: a aba Biblioteca do tablet por DISCIPLINA e ANO,
 * com os livros do tablet, o Continuar lendo e a tela do livro com o sumário
 * clicável. No Chrome de verdade, com o pacote de exercícios SINTÉTICO do 9º
 * ano (_pacote_sintetico.js) e os livros SINTÉTICOS do gerador
 * (biblioteca/_amostra/fazer_amostra_livros.py --pacote): três PDFs de
 * Matemática (um com sumário de capítulos e seção, um com o sumário vindo do
 * mapa e só do 6º ano, um sem sumário nem mapa) e um EPUB de Literatura do
 * médio. Nenhum livro de verdade, nenhum nome de criança.
 *
 * O que prova:
 *   1. sem livro, a seção de livros não aparece e os exercícios ficam como
 *      eram;
 *   2. com os livros, a aba diz quantos materiais e disciplinas há, lista as
 *      disciplinas na ordem do app com a quantidade e o sinal do mapa (com a
 *      legenda uma vez), e cada ano mostra os livros certos; o livro sem
 *      sumário diz isso, e o do 9º de Matemática traz o cartão dos exercícios;
 *   3. os caminhos dos exercícios continuam alcançáveis: o cartão leva ao 9º
 *      ano, o módulo abre, Minhas listas está lá, e a busca mostra o
 *      resultado (com os livros fora do caminho enquanto há termo);
 *   4. a tela do livro: o sumário com capítulos e seção clicáveis, a página do
 *      arquivo de cada um, o Voltar escrito; tocar no capítulo 2 abre o leitor
 *      na página 3 do arquivo, e a seção 2.1 na página 4;
 *   5. o Continuar lendo: depois de abrir e fechar o leitor, o livro e a
 *      posição certos aparecem, na tela do livro ("Continuar na p. 4", o
 *      capítulo 2 marcado) e na aba; o toque reabre o leitor na página 4; o
 *      EPUB abre no capítulo tocado e passa a ser o primeiro do Continuar;
 *   6. o livro sem sumário diz isso na tela dele;
 *   7. tablet 1280x800, com a letra a 100% e a 130%: nada transborda, alvo de
 *      48 px, sem travessão, e nenhum erro de página;
 *   7b. o topo é o do desenho (título, contagem e a busca dos exercícios numa
 *      linha, o Continuar lendo logo abaixo), o guia das listas e a contagem
 *      dos exercícios ficam na cabeça de "Exercícios e listas", e a navegação
 *      dos exercícios (módulo aberto, Material da aula) rola até eles em vez
 *      de cair em cima dos livros; numa largura estreita (800 px, tablet em
 *      pé) com a letra a 100% e a 130%, nada transborda;
 *   8. nada novo gravado: os depósitos têm, no fim, as mesmas chaves de antes
 *      dos toques, fora a posição de leitura que os leitores já guardavam.
 *   9. marcadores lixo e sumário vazio (livros SINTÉTICOS gravados direto no
 *      depósito, com o PDF de 6 páginas do livro-com-marcadores): o livro de
 *      marcadores "page1..page40" com mapa de 3 capítulos mostra os 3 do
 *      mapa no cartão, no resumo, no sumário (página, título, assuntos,
 *      aria-label), no painel, no Abrir, no sumário do leitor, na posição
 *      atual e no Continuar lendo; o livro sem marcadores com mapa de 1
 *      entrada ("Volume") mostra a entrada; o controle, marcadores lixo sem
 *      mapa, fica como está. O sumário do mapa é só da tela: o JSON do
 *      depósito livros fica idêntico depois da tela e do leitor, e
 *      livros_posicoes só ganha a posição dos livros lidos.
 *
 * Veneno:
 *   node _teste/testa_biblioteca_livros_tela.js --envenenado-capitulo-abre-pagina-errada
 *     o app.js servido abre todo capítulo do sumário na página 1: o toque no
 *     capítulo 2 tem de abrir na 1, e a prova TEM de ver ("VENENO visto").
 *   node _teste/testa_biblioteca_livros_tela.js --envenenado-sumario-dos-marcadores
 *     o app.js servido usa sempre o sumário do pacote (a main antes deste
 *     conserto): o livro de marcadores lixo tem de mostrar os 40 "pageN".
 *   Os venenos do leitor contínuo (seção 9), cada um tira uma peça do app.js
 *   servido, e a seção 9 TEM de ver o defeito ("VENENO visto"):
 *     --envenenado-zoom-sem-ancora       o zoom e o giro sem a volta à página do meio
 *     --envenenado-giro-sem-ancora-guardada  no giro, a âncora tirada com a janela nova
 *     --envenenado-largura-vai-ao-alto   o "Ajustar à largura" volta ao alto da página
 *     --envenenado-vizinhas-sem-desenho  depois do zoom e do giro, só a página do meio desenha
 *     --envenenado-canvas-sem-soltar     a página que sai de perto da tela não solta o canvas
 *
 *   9. o leitor contínuo, num livro sintético de 400 páginas: o "+", o "−", o
 *      "Ajustar à largura" e o giro de 800x1280 para 1280x800 deixam a página
 *      no meio, com o contador nela e o ponto do meio a menos de 24 px; toda
 *      página que encosta na tela tem canvas em até 1 s depois de cada um; e
 *      deitado, ou em pé com zoom perto de 2, 80 passos de 400 px para baixo e
 *      para cima deixam no máximo 4 canvases vivos.
 *
 *   --prints <pasta>   grava os prints do painel cego (tablet 1280x800 e
 *                      celular 412x915 e 360 a 130%, com escala 2).
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8940;
/* Os venenos do leitor contínuo (seção 9): cada um tira uma peça do app.js
 * servido, e a seção 9 TEM de ver o defeito que ela segura. */
const VENENOS_LEITOR = {
  // o zoom e o giro sem levar a rolagem de volta à página do meio
  'zoom-sem-ancora': ['voltarParaAncoraDoLeitor(estado, ancora);', 'void 0;'],
  // no giro, a âncora tirada com a janela NOVA (e não a da última rolagem)
  'giro-sem-ancora-guardada': ['if (guardada && (guardada.lc !== corpo.clientWidth || guardada.ac !== corpo.clientHeight)) return guardada;', 'void 0;'],
  // o "Ajustar à largura" volta ao alto da página em vez de manter o ponto
  'largura-vai-ao-alto': ['leitor.zoom = Math.min(LEITOR_ZOOM_MAX, Math.max(LEITOR_ZOOM_MIN, z));\n    desenharPaginaDoLeitor(false);',
    'leitor.zoom = Math.min(LEITOR_ZOOM_MAX, Math.max(LEITOR_ZOOM_MIN, z));\n    desenharPaginaDoLeitor(!fator);'],
  // depois do zoom e do giro, só a página do meio é desenhada
  'vizinhas-sem-desenho': ['    conciliarPaginasContinuas(estado, estado.pagina);\n    var p = estado.paginas[estado.pagina - 1];', '    var p = estado.paginas[estado.pagina - 1];'],
  // a página que sai de perto da tela não solta o canvas
  'canvas-sem-soltar': ['      } else if (pagina.visivel || pagina.desenhando || pagina.temCanvas) {', '      } else if (false) {']
};
const VENENOS = ['--envenenado-capitulo-abre-pagina-errada', '--envenenado-sumario-dos-marcadores', '--envenenado-pagina-presa', '--envenenado-zoom-sem-ancora', '--envenenado-giro-sem-ancora-guardada',
  '--envenenado-largura-vai-ao-alto', '--envenenado-vizinhas-sem-desenho', '--envenenado-canvas-sem-soltar'];
const VENENO_PAGINA = process.argv.indexOf('--envenenado-capitulo-abre-pagina-errada') !== -1;
const VENENO_LEITOR = Object.keys(VENENOS_LEITOR).find(k => process.argv.indexOf('--envenenado-' + k) !== -1) || null;
const VENENO_SUMARIO = process.argv.indexOf('--envenenado-sumario-dos-marcadores') !== -1;
/* B1 (revisão cega do #192): a navegação sai da página do assunto; o veneno faz
 * a saída não fazer nada, e a página volta no Limpar e no Voltar do módulo */
const VENENO_PAGINA_PRESA = process.argv.indexOf('--envenenado-pagina-presa') !== -1;
const ANCORA_PAGINA_PRESA = '  function sairDaPaginaDoAssunto() {\n';
const iPrints = process.argv.indexOf('--prints');
const PRINTS = iPrints > 0 ? process.argv[iPrints + 1] : null;
const PYTHON = process.env.PYTHON || 'python';

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const ANCORA_PAGINA = 'return abrirLivro(l.id, { pagina: paginaDoArquivo(l.meta, e) });';
const trocas = {};
if (VENENO_PAGINA) trocas['/app.js'] = APP.split(ANCORA_PAGINA).join('return abrirLivro(l.id, { pagina: 1 });');
// o sumário que a tela usa (sumarioDaTela): no veneno, sempre o do pacote, como na main antes do conserto
const ANCORA_SUMARIO = 'return Biblioteca.sumarioDoLivro(meta);';
if (VENENO_SUMARIO) trocas['/app.js'] = APP.split(ANCORA_SUMARIO).join('return Array.isArray(meta.sumario) ? meta.sumario : [];');
if (VENENO_LEITOR) trocas['/app.js'] = APP.split(VENENOS_LEITOR[VENENO_LEITOR][0]).join(VENENOS_LEITOR[VENENO_LEITOR][1]);
if (VENENO_PAGINA_PRESA) trocas['/app.js'] = APP.split(ANCORA_PAGINA_PRESA).join(ANCORA_PAGINA_PRESA + '    return;\n');

const amb = H.criarAmbiente(PORTA, 'perfil_biblioteca_livros_tela', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'b2_livros_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

const LETRA_130 = 'html{font-size:130%} body{font-size:20.8px}';
const letra = (pag, css) => pag.evaluate(c => {
  const v = document.querySelector('#prova-letra'); if (v) v.remove();
  if (c) { const s = document.createElement('style'); s.id = 'prova-letra'; s.textContent = c; document.head.appendChild(s); }
}, css);

function gerarLivros(modo, pasta) {
  const r = spawnSync(PYTHON, ['-X', 'utf8', path.join(H.RAIZ, 'biblioteca', '_amostra', 'fazer_amostra_livros.py'), pasta || TMP, modo || '--pacote'],
    { encoding: 'utf8' });
  const linhas = String(r.stdout || '').trim().split(/\r?\n/);
  const zip = linhas[linhas.length - 1];
  if (r.status !== 0 || !zip || !fs.existsSync(zip)) { console.log(String(r.stderr || '').slice(0, 800)); return null; }
  return zip;
}

async function importar(pag, arquivo) {
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => { document.querySelector('#estado-importacao-biblioteca').innerHTML = ''; });
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar('importação de ' + path.basename(arquivo), () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca');
    return [c ? c.innerText.trim() : '', document.querySelector('#importar-biblioteca').disabled];
  }), v => !!v[0] && !/Conferindo|Gravando/.test(v[0]) && v[1] === false, 60000);
  return (r.valor && r.valor[0]) || '';
}

async function abrirBiblioteca(pag) {
  await H.irParaAba(pag, 'biblioteca');
  await esperar('a aba Biblioteca desenhada', () => pag.evaluate(() => !!document.querySelector('#bib-corpo').children.length), v => v, 10000);
  await pausa(300);
}

// o que a seção de livros mostra agora
const lerSecao = pag => pag.evaluate(() => {
  const caixa = document.querySelector('#bib-livros');
  const vis = x => !!x && !x.hidden && getComputedStyle(x).display !== 'none';
  return {
    visivel: vis(caixa),
    tituloExercicios: vis(document.querySelector('#bib-exercicios-titulo')),
    contagem: (document.querySelector('#bib-livros-contagem') || {}).textContent || '',
    disciplinas: Array.from(caixa.querySelectorAll('.bibl-disciplina')).map(b => b.dataset.disciplina + ':' +
      b.querySelector('.bibl-apoio').textContent + (b.querySelector('.bibl-sinal-mapa') ? ':mapa' : '')).join(','),
    ativa: (caixa.querySelector('.bibl-disciplina.ativa') || { dataset: {} }).dataset.disciplina || '',
    legendas: caixa.querySelectorAll('.bibl-legenda').length,
    anos: Array.from(caixa.querySelectorAll('.bibl-ano')).map(b => b.dataset.ano + '=' + b.textContent).join(','),
    anoAtivo: (caixa.querySelector('.bibl-ano.ativo') || { dataset: {} }).dataset.ano || '',
    livros: Array.from(caixa.querySelectorAll('.bibl-grade [data-livro]')).map(b => b.dataset.livro).join(','),
    exercicios: Array.from(caixa.querySelectorAll('.bibl-grade [data-exercicios]')).map(b => b.dataset.exercicios + '|' + b.innerText.replace(/\s+/g, ' ').trim()).join(','),
    faltas: Array.from(caixa.querySelectorAll('.bibl-grade [data-livro]')).map(b => {
      const f = b.querySelector('[data-falta]'); return b.dataset.livro + '=' + (f ? f.dataset.falta + ':' + f.textContent : (b.querySelector('[data-mapa]') ? 'mapa' : '?'));
    }).join(','),
    continuar: Array.from(caixa.querySelectorAll('[data-continuar]')).map(b => b.dataset.continuar + '|' + b.querySelector('.bibl-onde').textContent).join(',')
  };
});

const lerLivro = pag => pag.evaluate(() => {
  const t = document.querySelector('#bib-livro');
  const vis = !!t && !t.hidden && getComputedStyle(t).display !== 'none';
  if (!vis) return { visivel: false };
  return {
    visivel: true, livro: t.dataset.livro,
    voltar: (document.querySelector('#bib-livro-voltar') || {}).textContent || '',
    resumo: (document.querySelector('#bib-livro-resumo') || {}).textContent || '',
    continuar: (document.querySelector('#bib-livro-continuar') || {}).textContent || '',
    rotulo: (t.querySelector('.bibl-sumario-cabeca .bibl-apoio') || {}).textContent || '',
    linhas: Array.from(t.querySelectorAll('.bibl-cap, .bibl-sec')).map(b => (b.classList.contains('bibl-cap') ? 'cap' : 'sec') + b.dataset.n + '@' +
      (b.dataset.pagina || b.dataset.capitulo) + '[' + b.querySelector('.bibl-cap-n').textContent + ']' + (b.classList.contains('atual') ? '*' : '')).join(','),
    assuntosDosCapitulos: Array.from(t.querySelectorAll('.bibl-cap .bibl-cap-assuntos')).map(s => s.textContent).join(' | '),
    semSumario: (document.querySelector('#bib-livro-sem-sumario') || {}).textContent || '',
    painel: (t.querySelector('.bibl-livro-painel') || {}).innerText || '',
    cobreOTrilho: (() => { const e = document.elementFromPoint(48, 400); return !!e && !!e.closest('#bib-livro'); })()
  };
});

const paginaDesenhada = pag => pag.evaluate(() => {
  const c = document.querySelector('#corpo-modal-leitor-pdf');
  return c && document.querySelector('#modal-leitor-pdf.aberto') ? (c.dataset.paginaDesenhada || '') : 'fechado';
});
const epubAberto = pag => pag.evaluate(() => {
  const c = document.querySelector('#corpo-modal-leitor-epub');
  return c && document.querySelector('#modal-leitor-epub.aberto') ? (c.dataset.capituloAberto || '') : 'fechado';
});
async function fecharModal(pag, id) {
  await pag.evaluate(i => { const b = document.querySelector('#' + i + ' .modal-rodape [data-fechar]'); if (b) b.click(); }, id);
  await esperar('a janela ' + id + ' fechou', () => pag.evaluate(i => !document.querySelector('#' + i + '.aberto'), id), v => v, 5000);
  await pausa(400);
}
/* A posição de um elemento na área que rola (.conteudo), em px a partir do alto dela. */
const altoNaArea = (pag, sel) => pag.evaluate(s => {
  const e = document.querySelector(s); const c = document.querySelector('.conteudo');
  if (!e || !c) return null;
  return Math.round(e.getBoundingClientRect().top - c.getBoundingClientRect().top);
}, sel);
let hojeIso = '';
async function abrirAulaDeHoje(pag, hora) {
  await H.irParaAba(pag, 'agenda');
  for (let i = 0; i < 24; i++) {
    if (await pag.evaluate(h => !!document.querySelector('[data-dia="' + h + '"]'), hojeIso)) break;
    await pag.click(i < 12 ? '#mes-seguinte' : '#mes-anterior');
    await pausa(120);
  }
  const ok = await pag.evaluate((h, hr) => {
    const alvo = Array.from(document.querySelectorAll('[data-dia="' + h + '"] .pilula')).find(p => p.textContent.indexOf(hr) === 0);
    if (!alvo) return false; alvo.click(); return true;
  }, hojeIso, hora);
  await esperar('aula das ' + hora + ' aberta', () => pag.evaluate(() => document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);
  return ok;
}
const clicar = (pag, sel) => pag.evaluate(s => { const b = document.querySelector(s); if (!b) return false; b.click(); return true; }, sel);

/* A trava de transbordo no que a fatia desenha: botão e texto dentro da
 * caixa, nada fora da tela, página sem rolagem de lado, alvos de 48 px. */
const medir = (pag, raiz) => pag.evaluate(sel => {
  const ruins = [];
  const caixa = document.querySelector(sel);
  if (!caixa) return ['sem ' + sel];
  const cr = caixa.getBoundingClientRect();
  const nome = e => (e.id || e.dataset.livro || e.dataset.n || e.dataset.disciplina || e.dataset.ano || e.className || e.tagName) + '';
  caixa.querySelectorAll('button, .bibl-forte, .bibl-apoio, .bibl-capa-topo, .bibl-capa-pe, .bibl-cap-titulo, .bibl-cap-assuntos, .bibl-falta, h2, h3').forEach(e => {
    const r = e.getBoundingClientRect();
    if (!r.width && !r.height) return;
    if (r.left < cr.left - 0.5 || r.right > cr.right + 0.5 || r.right > innerWidth + 0.5) ruins.push(nome(e) + ' sai da área (' + Math.round(r.left) + '-' + Math.round(r.right) + ')');
    if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).textOverflow !== 'ellipsis') ruins.push(nome(e) + ' transborda por dentro');
    if (e.tagName === 'BUTTON') {
      if (r.height < 47.5 || r.width < 47.5) ruins.push(nome(e) + ' com alvo de ' + Math.round(r.width) + 'x' + Math.round(r.height));
      const rg = document.createRange(); rg.selectNodeContents(e);
      const t = rg.getBoundingClientRect();
      if (t.width && (t.left < r.left - 0.5 || t.right > r.right + 0.5)) ruins.push(nome(e) + ': o texto sai do botão (' + [t.left, t.right, r.left, r.right].map(Math.round).join(',') + ')');
    }
  });
  if (document.documentElement.scrollWidth > innerWidth) ruins.push('a página rola de lado');
  if (/—|–/.test(caixa.innerText)) ruins.push('travessão no texto');
  if (/[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{5,}/.test(caixa.innerText.replace(/\b(OBMEP|ENEM|BNCC)\b/g, ''))) ruins.push('caixa alta no texto');
  return ruins;
}, raiz);

(async () => {
  secao('0. A prova se confere');
  conf('a lista de venenos não está vazia', VENENOS.length > 0, true);
  conf('a âncora da página do assunto presa aparece uma vez no app.js', APP.split(ANCORA_PAGINA_PRESA).length - 1, 1);
  if (VENENO_PAGINA_PRESA) conf('o app.js servido está envenenado (página presa)', trocas['/app.js'] !== APP, true);
  conf('a âncora do veneno (o capítulo abre na página do arquivo) aparece uma vez só no app.js', APP.split(ANCORA_PAGINA).length - 1, 1);
  if (VENENO_PAGINA) conf('o app.js servido está envenenado', trocas['/app.js'].indexOf(ANCORA_PAGINA) === -1, true);
  if (VENENO_SUMARIO) {
    conf('a âncora do veneno do sumário aparece uma vez só no app.js', APP.split(ANCORA_SUMARIO).length - 1, 1);
    conf('o app.js servido está envenenado no sumário', trocas['/app.js'].indexOf(ANCORA_SUMARIO) === -1, true);
  }
  conf('cada âncora dos venenos do leitor contínuo aparece uma vez só no app.js',
    Object.keys(VENENOS_LEITOR).map(k => k + ':' + (APP.split(VENENOS_LEITOR[k][0]).length - 1)).join(','),
    Object.keys(VENENOS_LEITOR).map(k => k + ':1').join(','));
  if (VENENO_LEITOR) conf('o app.js servido está envenenado (' + VENENO_LEITOR + ')', trocas['/app.js'].indexOf(VENENOS_LEITOR[VENENO_LEITOR][0]) === -1, true);
  const zipEx = path.join(TMP, 'pacote_9ano.zip');
  Sintetico.gerar(zipEx);
  const zipLivros = gerarLivros();
  conf('os pacotes sintéticos foram gerados', !!zipLivros && fs.existsSync(zipEx), true);
  if (!zipLivros) throw Object.assign(new Error('sem pacote de livros'), { jaContado: true });

  await amb.subir();
  const pag = await amb.pagina();
  const errosDePagina = [];
  pag.on('pageerror', e => errosDePagina.push(e.message));
  pag.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errosDePagina.push(m.text()); });
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true, deviceScaleFactor: PRINTS ? 2 : 1 });
  await H.abrirApp(pag, amb.ORIGEM);
  hojeIso = await pag.evaluate(() => Core.hojeIso());
  await pag.evaluate(async h => {
    const d = await Store.carregar();
    d.alunos = [{ id: 'al_alfa', nome: 'Aluno Alfa Teste', ano: '6', anoEscolar: '6º ano do Ensino Fundamental', responsavel: 'Responsável Alfa',
      grade: 'quarta-feira, 10:00', vigencias: [{ id: 'v1', inicio: '2026-01-01', fim: '2027-12-31', valorHora: 100 }] }];
    // a aula de hoje com um assunto que o pacote do 9º tem: o Material dela leva aos exercícios
    d.aulas = [{ id: 'au_material', alunoId: 'al_alfa', serieId: null, data: h, hora: '10:00', duracaoMin: 60, status: 'agendada',
      cobravel: true, notaTexto: '', notaPrivada: '', temNota: false, anexos: [], temas: [{ titulo: 'Bhaskara', fonte: 'livre' }] }];
    await Store.salvar(d);
  }, hojeIso);
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('1. Sem livro: a aba fica como era');
  const imp1 = await importar(pag, zipEx);
  conf('o pacote de exercícios do 9º ano entrou', /^Biblioteca importada\./.test(imp1), true);
  await abrirBiblioteca(pag);
  let s = await lerSecao(pag);
  conf('sem livro, a seção de livros não aparece', s.visivel, false);
  conf('nem o título "Exercícios e listas"', s.tituloExercicios, false);
  conf('e a contagem de livros fica vazia e escondida', s.contagem + '|' + await pag.evaluate(() => document.querySelector('#bib-livros-contagem').hidden), '|true');
  conf('o guia das listas e a contagem dos exercícios continuam na aba, na cabeça dos exercícios', await pag.evaluate(() =>
    !!document.querySelector('#bib-exercicios-cabeca #btn-guia-listas') && /exercícios/.test(document.querySelector('#bib-exercicios-cabeca #bib-contagem').textContent)), true);
  conf('a busca diz que é dos exercícios', await pag.evaluate(() => {
    const i = document.querySelector('#busca-biblioteca'); return i.getAttribute('aria-label') + ' | ' + i.placeholder;
  }), 'Buscar nos exercícios | Buscar nos exercícios (bhaskara, pitágoras...)');
  const modulosAntes = await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-corpo .item-lista .nome')).map(n => n.textContent.trim()).join(' | '));
  conf('os módulos do 9º ano estão à vista, como antes', modulosAntes, 'Equações do Segundo Grau | Produtos Notáveis e Fatoração | Teorema de Pitágoras');

  // ================================================================
  secao('2. Com os livros: disciplina, ano e livros');
  const imp2 = await importar(pag, zipLivros);
  conf('os livros sintéticos entraram', /Livros importados\./.test(imp2), true);
  conf('o aviso da importação diz onde ler', /abra a aba Biblioteca e toque no livro\./.test(imp2), true);
  await abrirBiblioteca(pag);
  await esperar('a seção de livros', () => lerSecao(pag), v => v.visivel && !!v.livros, 10000);
  s = await lerSecao(pag);
  conf('a contagem diz materiais e disciplinas', s.contagem, '4 materiais, 2 disciplinas');
  conf('as disciplinas, na ordem do app, com a quantidade e o sinal do mapa', s.disciplinas, 'matematica:3:mapa,literatura:1:mapa');
  conf('a legenda do mapa aparece uma vez só', s.legendas, 1);
  conf('abre em Matemática', s.ativa, 'matematica');
  conf('os anos de Matemática: os dos livros e o dos exercícios', s.anos, '06=6º,07=7º,08=8º,09=9º');
  conf('abre no 6º ano', s.anoAtivo, '06');
  conf('o 6º ano mostra os três livros de Matemática', s.livros, 'livro-com-marcadores,livro-sem-marcadores,livro-sem-sumario');
  conf('o 6º ano não tem exercícios no tablet: sem cartão', s.exercicios, '');
  conf('cada livro diz o que tem e o que falta', s.faltas,
    'livro-com-marcadores=mapa,livro-sem-marcadores=mapa,livro-sem-sumario=sumario:sem sumário nem mapa de assuntos');
  conf('sem leitura ainda, sem Continuar lendo', s.continuar, '');
  // os anos são um grupo de rádio: a seta para a direita leva ao 7º
  await pag.focus('#bib-livros .bibl-ano[data-ano="06"]');
  await pag.keyboard.press('ArrowRight');
  s = await lerSecao(pag);
  conf('a seta troca o ano e o foco vai junto', s.anoAtivo + '|' + await pag.evaluate(() => (document.activeElement || { dataset: {} }).dataset.ano),
    '07|07');
  conf('só o ano escolhido entra no Tab', await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-livros .bibl-ano'))
    .map(b => b.dataset.ano + ':' + b.getAttribute('tabindex')).join(',')), '06:-1,07:0,08:-1,09:-1');
  await clicar(pag, '#bib-livros .bibl-ano[data-ano="09"]');
  s = await lerSecao(pag);
  conf('o 9º ano mostra só os livros do 9º (o do mapa é só do 6º)', s.livros, 'livro-com-marcadores,livro-sem-sumario');
  conf('e o cartão dos exercícios do 9º ano', s.exercicios, '9ano|Exercícios 9º ano Exercícios e listas 3 módulos · 60 exercícios');
  await clicar(pag, '#bib-livros .bibl-disciplina[data-disciplina="literatura"]');
  s = await lerSecao(pag);
  conf('Literatura: os anos do médio', s.anos, 'em1=1º médio,em2=2º médio,em3=3º médio');
  conf('e o livro de Literatura', s.livros, 'livro-de-prova');
  await clicar(pag, '#bib-livros .bibl-disciplina[data-disciplina="matematica"]');

  // ================================================================
  secao('3. Os exercícios continuam alcançáveis');
  await clicar(pag, '#bib-livros .bibl-ano[data-ano="09"]');
  conf('o cartão dos exercícios do 9º ano está lá', await clicar(pag, '#bib-livros [data-exercicios="9ano"]'), true);
  await pausa(300);
  const serieAtiva = await pag.evaluate(() => (document.querySelector('#bib-corpo .bib-series .chip-filtro.ativo, #bib-corpo .chip-filtro.ativo') || {}).textContent || '');
  const modulos = await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-corpo .item-lista .nome')).map(n => n.textContent.trim()).join(' | '));
  conf('o cartão leva aos módulos do 9º ano', modulos, 'Equações do Segundo Grau | Produtos Notáveis e Fatoração | Teorema de Pitágoras');
  const altoCartao = await altoNaArea(pag, '#bib-exercicios-cabeca');
  // a área rola até o título; se a página acaba antes, ela fica no fim (não dá para subir mais), com o título à vista
  const noFim = await pag.evaluate(() => { const c = document.querySelector('.conteudo'); return c.scrollTop > 0 && c.scrollTop >= c.scrollHeight - c.clientHeight - 1; });
  conf('e rola até "Exercícios e listas" (no alto da área, ou no fim dela)', altoCartao !== null && altoCartao >= -2 && (altoCartao <= 40 || noFim), true);
  console.log('   "Exercícios e listas" a ' + altoCartao + ' px do alto');
  console.log('   série ativa: ' + serieAtiva);
  conf('Minhas listas continua na aba', await pag.evaluate(() => !!document.querySelector('#bib-corpo #bib-abas [data-aba="minhas"]')), true);
  const abriu = await pag.evaluate(() => {
    const l = Array.from(document.querySelectorAll('#bib-corpo .item-lista')).find(x => x.querySelector('.nome').textContent.trim() === 'Equações do Segundo Grau');
    if (!l) return false; l.click(); return true;
  });
  await pausa(300);
  const dentro = await pag.evaluate(() => ({ titulo: (document.querySelector('#bib-corpo .bib-titulo') || {}).textContent || '',
    texto: (document.querySelector('#bib-corpo') || {}).innerText || '' }));
  conf('o módulo abre, com a teoria e os exercícios dele', abriu && dentro.titulo === 'Equações do Segundo Grau' &&
    /Teoria/.test(dentro.texto) && /Exercícios/.test(dentro.texto), true);
  const altoModulo = await altoNaArea(pag, '#bib-exercicios-cabeca');
  conf('o módulo aberto não cai em cima dos livros: "Exercícios e listas" no alto', altoModulo !== null && altoModulo >= -2 && altoModulo <= 40, true);
  console.log('   módulo aberto: "Exercícios e listas" a ' + altoModulo + ' px do alto');
  await pag.evaluate(() => { const i = document.querySelector('#busca-biblioteca'); i.value = 'bhaskara'; i.dispatchEvent(new Event('input', { bubbles: true })); });
  const busca = await esperar('o resultado da busca', () => pag.evaluate(() => [document.querySelector('#bib-corpo').innerText,
    !!document.querySelector('#bib-corpo .bib-titulo')]), v => !v[1] && /Equações do Segundo Grau/.test(v[0]), 5000);
  conf('a busca "bhaskara" mostra o resultado', busca.ok, true);
  // B12: um campo só; com livro no tablet, o resultado tem dois grupos, primeiro Exercícios e depois Nos livros
  const grupos = await esperar('os dois grupos da busca', () => pag.evaluate(() => ({
    campo: document.querySelector('#busca-biblioteca').getAttribute('aria-label'),
    campos: document.querySelectorAll('.bibl-busca input').length,
    grupos: Array.from(document.querySelectorAll('#bib-corpo > .bib-grupo-busca')).map(d => d.dataset.grupo + ':' +
      d.querySelector('.bib-grupo-titulo').textContent + ':' + d.open).join(','),
    livros: (document.querySelector('#bib-corpo [data-grupo="livros"] .bib-busca-livros-status') || {}).textContent || ''
  })), v => !!v && /Buscando|Nenhum livro|preparada|encontrada|em \d+ livros?\./.test(v.livros) && !/Buscando/.test(v.livros), 10000);
  conf('um campo de busca só, e ele diz que busca nos exercícios e nos livros',
    grupos.valor.campos + ' | ' + grupos.valor.campo, '1 | Buscar nos exercícios e nos livros');
  conf('o resultado tem dois grupos abertos: Exercícios e depois Nos livros', grupos.valor.grupos,
    'exercicios:Exercícios:true,livros:Nos livros:true');
  const leGrupoEx = () => pag.evaluate(() => {
    const g = document.querySelector('#bib-corpo [data-grupo="exercicios"]');
    const visiveis = Array.from(g.querySelectorAll('.item-lista')).filter(e => e.offsetParent !== null);
    const livros = document.querySelector('#bib-corpo [data-grupo="livros"] > summary');
    return { contagem: g.querySelector('.bib-grupo-contagem').textContent, linhas: visiveis.length, todas: g.querySelectorAll('.item-lista').length,
      blocos: Array.from(g.querySelectorAll('.bloco-exercicios')).filter(b => b.offsetParent !== null).map(b => b.textContent).join(','),
      resumo: (document.querySelector('#bib-busca-resumo') || {}).textContent || '',
      verTodos: (g.querySelector('.bib-grupo-ver-todos') || {}).textContent || '',
      livrosNoAlto: livros ? Math.round(livros.getBoundingClientRect().top) : null, altura: innerHeight };
  });
  const gx = await leGrupoEx();
  conf('a contagem dos exercícios tem unidade e conta as linhas do grupo (as à vista e as do "Ver todos")',
    /^\d+ (lista|listas|resultado|resultados|módulo|módulos|aula de teoria|aulas de teoria|problema|problemas)$/.test(gx.contagem) &&
    parseInt(gx.contagem, 10) === gx.todas ? 'ok' : JSON.stringify(gx), 'ok');
  conf('dentro do grupo, o bloco das listas não repete "Exercícios"', /(^|,)Exercícios(,|$)/.test(gx.blocos), false);
  conf('a linha-resumo no alto diz os dois grupos', /^Exercícios.+·Nos livros/.test(gx.resumo), true);
  // um termo curto e comum: muitos exercícios, e os livros continuam na primeira tela
  for (const [w, h] of [[1280, 800], [800, 1280]]) {
    await pag.setViewport({ width: w, height: h, hasTouch: true, deviceScaleFactor: 1 });
    await pag.evaluate(() => { const i = document.querySelector('#busca-biblioteca'); i.value = 'de'; i.dispatchEvent(new Event('input', { bubbles: true })); });
    await esperar('a busca por "de" a ' + w + 'x' + h, () => pag.evaluate(() =>
      (document.querySelector('#bib-corpo [data-grupo="livros"] .bib-busca-livros-status') || {}).textContent || ''), v => !!v && !/Buscando/.test(v), 10000);
    await pausa(300);
    const gd = await leGrupoEx();
    console.log('   "de" a ' + w + 'x' + h + ': ' + gd.contagem + ', ' + gd.linhas + ' linhas à vista, "Nos livros" a ' + gd.livrosNoAlto + ' px de ' + gd.altura);
    conf('a ' + w + 'x' + h + ', com mais de 3 linhas, o grupo mostra 3 e "Ver todos os N"', gd.linhas + ' | ' + (gd.verTodos === 'Ver todos os ' + gd.todas), '3 | true');
    conf('a ' + w + 'x' + h + ', o cabeçalho "Nos livros" fica na primeira tela', gd.livrosNoAlto !== null && gd.livrosNoAlto < gd.altura - 48, true);
    const ruinsB = await medir(pag, '#bib-corpo');
    conf('a ' + w + 'x' + h + ', o resultado não transborda', ruinsB.join('; '), '');
  }
  // nada nos dois grupos: um estado vazio só, com a frase e o caminho de sempre
  await pag.evaluate(() => { const i = document.querySelector('#busca-biblioteca'); i.value = 'zqxjkw'; i.dispatchEvent(new Event('input', { bubbles: true })); });
  const vazio = await esperar('o estado vazio único', () => pag.evaluate(() => ({
    vazios: document.querySelectorAll('#bib-corpo .vazio').length, grupos: document.querySelectorAll('#bib-corpo .bib-grupo-busca').length,
    texto: (document.querySelector('#bib-corpo .vazio') || {}).textContent || '' })), v => !!v && v.vazios === 1 && v.grupos === 0, 10000);
  conf('sem nada nos exercícios nem nos livros, uma frase só, com o caminho de procurar outra palavra',
    vazio.ok && /Procure por outra palavra, ou navegue pela série\./.test(vazio.valor.texto), true);
  await pag.evaluate(() => { const i = document.querySelector('#busca-biblioteca'); i.value = 'de'; i.dispatchEvent(new Event('input', { bubbles: true })); });
  await pausa(500);
  for (const w of [360, 390, 412]) {
    await pag.setViewport({ width: w, height: 800, hasTouch: true, deviceScaleFactor: 1 });
    await letra(pag, LETRA_130);
    await pausa(300);
    const ruinsB = await medir(pag, '#bib-corpo');
    conf('a ' + w + ' px com a letra a 130%, o resultado da busca não transborda', ruinsB.join('; '), '');
    await letra(pag, '');
  }
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true, deviceScaleFactor: PRINTS ? 2 : 1 });
  s = await lerSecao(pag);
  conf('com termo na busca, os livros saem do caminho', s.visivel, false);
  await pag.evaluate(() => { const i = document.querySelector('#busca-biblioteca'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); });
  await pausa(400);
  s = await lerSecao(pag);
  conf('busca vazia: os livros voltam', s.visivel, true);
  await abrirBiblioteca(pag);
  await clicar(pag, '#bib-livros .bibl-ano[data-ano="06"]');

  // ================================================================
  secao('4. A tela do livro: o sumário clicável');
  await clicar(pag, '#bib-livros [data-livro="livro-com-marcadores"]');
  await esperar('a tela do livro', () => lerLivro(pag), v => v.visivel, 5000);
  let lv = await lerLivro(pag);
  conf('a tela do livro é a do livro tocado', lv.livro, 'livro-com-marcadores');
  conf('o Voltar é escrito', lv.voltar, 'Voltar');
  conf('a tela cobre o trilho (tela cheia)', lv.cobreOTrilho, true);
  conf('o resumo: páginas, capítulos e assuntos ligados', lv.resumo, '6 páginas · 3 capítulos · 2 assuntos ligados');
  conf('a coluna diz que a página é a do arquivo', lv.rotulo, 'página do arquivo');
  conf('o sumário tem a coluna do numeral e o título limpo', await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-livro .bibl-cap'))
    .map(b => b.querySelector('.bibl-cap-n').textContent + ' ' + b.querySelector('.bibl-cap-titulo').textContent).join(' | ')),
  '1 Números naturais | 2 Frações | 3 Geometria plana');
  conf('capítulos e seção, com a página do arquivo de cada um (o primeiro marcado)', lv.linhas, 'cap1@1[1]*,cap2@3[2],sec3@4[2.1],cap4@5[3]');
  conf('o capítulo sem assunto diz isso', /nenhum assunto ligado ainda$/.test(lv.assuntosDosCapitulos), true);
  conf('sem leitura, o botão do alto é "Abrir o livro"', lv.continuar, 'Abrir o livro');
  await clicar(pag, '#bib-livro .bibl-cap[data-n="2"]');
  const r2 = await esperar('o leitor na página do capítulo 2', () => paginaDesenhada(pag), v => v !== 'fechado' && v !== '', 20000);
  if (VENENO_PAGINA) {
    secao('VENENO: o capítulo abre na página 1');
    const visto = r2.valor === '1';
    conf('envenenado-capitulo-abre-pagina-errada: o capítulo 2 abriu na página 1 (defeito detectado)', visto, true);
    if (visto) console.log('VENENO visto: o capítulo abriu na página errada.');
    await H.fim(amb)();
    return;
  }
  conf('tocar no capítulo 2 abre o leitor na página 3 do arquivo', r2.valor, '3');
  const continuo = await pag.evaluate(() => ({
    paginas: document.querySelectorAll('#corpo-modal-leitor-pdf .leitor-pdf-pagina').length,
    sliderMax: document.querySelector('#leitor-slider-pagina').max,
    pagina3: !!document.querySelector('#corpo-modal-leitor-pdf [data-pagina-arquivo="3"] canvas')
  }));
  conf('o leitor do livro prepara as seis páginas em rolagem contínua', continuo.paginas, 6);
  conf('a barra de página cobre o livro inteiro', continuo.sliderMax, '6');
  /* no leitor contínuo, data-pagina-desenhada marca a página atual antes de o
   * canvas dela terminar de desenhar: espera o canvas em vez de ler na hora */
  const canvasInicial = continuo.pagina3 ? { valor: true } : await esperar('o canvas da página aberta',
    () => pag.evaluate(() => !!document.querySelector('#corpo-modal-leitor-pdf [data-pagina-arquivo="3"] canvas')), Boolean, 15000);
  conf('a página aberta está desenhada', canvasInicial.valor, true);
  await pag.evaluate(() => document.querySelector('#corpo-modal-leitor-pdf [data-pagina-arquivo="5"]').scrollIntoView({ block: 'start' }));
  const r5 = await esperar('rolagem contínua até a página 5', () => paginaDesenhada(pag), v => v === '5', 5000);
  conf('rolar atualiza a página guardada', r5.valor, '5');
  await pag.evaluate(() => {
    const slider = document.querySelector('#leitor-slider-pagina');
    slider.value = '6';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const r6 = await esperar('a barra leva à página 6', () => paginaDesenhada(pag), v => v === '6', 5000);
  conf('a barra leva à página escolhida', r6.valor, '6');
  await pag.evaluate(() => document.querySelector('#corpo-modal-leitor-pdf [data-pagina-arquivo="3"]').scrollIntoView({ block: 'start' }));
  const volta3 = await esperar('rolagem contínua de volta à página 3', () => paginaDesenhada(pag), v => v === '3', 5000);
  conf('a página do capítulo continua sendo a atual', volta3.valor, '3');
  await fecharModal(pag, 'modal-leitor-pdf');
  await pag.evaluate(() => { window.__intersectionObserverOriginal = window.IntersectionObserver; window.IntersectionObserver = undefined; });
  await clicar(pag, '#bib-livro .bibl-cap[data-n="2"]');
  await esperar('continuous reader without IntersectionObserver', () => paginaDesenhada(pag), v => v === '3', 20000);
  await pag.evaluate(() => document.querySelector('#corpo-modal-leitor-pdf [data-pagina-arquivo="5"]').scrollIntoView({ block: 'start' }));
  const fallbackP5 = await esperar('scroll without observer draws page 5', () => pag.evaluate(() => ({
    atual: document.querySelector('#corpo-modal-leitor-pdf').dataset.paginaDesenhada,
    desenho: !!document.querySelector('#corpo-modal-leitor-pdf [data-pagina-arquivo="5"] canvas')
  })), v => v && v.atual === '5' && v.desenho, 5000);
  conf('without IntersectionObserver, scroll renders page 5 instead of a blank spacer', fallbackP5.ok, true);
  await fecharModal(pag, 'modal-leitor-pdf');
  await pag.evaluate(() => { window.IntersectionObserver = window.__intersectionObserverOriginal; delete window.__intersectionObserverOriginal; });
  // a última rolagem (sem IntersectionObserver) parou na página 5: é ela a posição guardada
  const posNova = await esperar('a tela do livro com a posição nova', () => lerLivro(pag), v => v.visivel && /p\. 5/.test(v.continuar), 5000);
  conf('depois de fechar, a tela do livro guarda a última página lida (5)', posNova.ok, true);
  await clicar(pag, '#bib-livro .bibl-sec[data-n="3"]');
  const r3 = await esperar('o leitor na página da seção 2.1', () => paginaDesenhada(pag), v => v !== 'fechado' && v !== '', 20000);
  conf('tocar na seção 2.1 abre na página 4 do arquivo', r3.valor, '4');
  await fecharModal(pag, 'modal-leitor-pdf');

  // ================================================================
  secao('5. Continuar lendo');
  await esperar('a tela do livro com a página 4', () => lerLivro(pag), v => v.visivel && /p\. 4/.test(v.continuar), 5000);
  lv = await lerLivro(pag);
  conf('depois de ler, o botão do alto diz onde ela parou', lv.continuar, 'Continuar na p. 4');
  conf('e o capítulo onde ela está fica marcado', lv.linhas, 'cap1@1[1],cap2@3[2]*,sec3@4[2.1],cap4@5[3]');
  conf('o painel mostra o capítulo 2, as páginas e o assunto', /^Capítulo 2\s+Frações\s+Páginas do arquivo 3 a 4 · 2 páginas[\s\S]*Assuntos ligados[\s\S]*Abrir na p\. 3/.test(lv.painel), true);
  await clicar(pag, '#bib-livro-voltar');
  await esperar('a aba de volta', () => lerSecao(pag), v => v.visivel && !!v.continuar, 5000);
  lv = await lerLivro(pag);
  conf('o Voltar fecha a tela do livro', lv.visivel, false);
  s = await lerSecao(pag);
  conf('o Continuar lendo aponta o livro e a posição', s.continuar, 'livro-com-marcadores|Cap. 2, Frações · p. 4');
  await clicar(pag, '#bib-livros [data-continuar="livro-com-marcadores"]');
  const r4 = await esperar('o leitor pelo Continuar lendo', () => paginaDesenhada(pag), v => v !== 'fechado' && v !== '', 20000);
  conf('o toque no Continuar lendo reabre na página 4', r4.valor, '4');
  await fecharModal(pag, 'modal-leitor-pdf');
  await clicar(pag, '#bib-livros .bibl-disciplina[data-disciplina="literatura"]');
  await clicar(pag, '#bib-livros [data-livro="livro-de-prova"]');
  await esperar('a tela do EPUB', () => lerLivro(pag), v => v.visivel && v.livro === 'livro-de-prova', 5000);
  lv = await lerLivro(pag);
  conf('o EPUB: os capítulos levam à parte do livro', lv.linhas, 'cap1@1[1]*,cap2@2[2],sec3@2[2.1],cap4@3[3]');
  await clicar(pag, '#bib-livro .bibl-cap[data-n="4"]');
  const e3 = await esperar('o EPUB no capítulo 3', () => epubAberto(pag), v => v !== 'fechado' && v !== '', 20000);
  conf('tocar no capítulo 3 abre o EPUB nele', e3.valor, '3');
  await fecharModal(pag, 'modal-leitor-epub');
  await esperar('a tela do EPUB com a posição', () => lerLivro(pag), v => v.visivel && /capítulo 3/.test(v.continuar), 5000);
  conf('a tela do EPUB diz onde ela parou', (await lerLivro(pag)).continuar, 'Continuar no capítulo 3');
  await clicar(pag, '#bib-livro-voltar');
  await esperar('a aba de volta', () => lerSecao(pag), v => v.visivel && /livro-de-prova/.test(v.continuar), 5000);
  s = await lerSecao(pag);
  conf('o Continuar lendo põe o último lido primeiro', s.continuar, 'livro-de-prova|Cap. 3, O fim,livro-com-marcadores|Cap. 2, Frações · p. 4');

  // ================================================================
  secao('6. O livro sem sumário diz isso');
  await clicar(pag, '#bib-livros .bibl-disciplina[data-disciplina="matematica"]');
  await clicar(pag, '#bib-livros .bibl-ano[data-ano="06"]');
  await clicar(pag, '#bib-livros [data-livro="livro-sem-sumario"]');
  await esperar('a tela do livro sem sumário', () => lerLivro(pag), v => v.visivel && v.livro === 'livro-sem-sumario', 5000);
  lv = await lerLivro(pag);
  conf('a tela diz que não há sumário nem mapa', lv.semSumario, 'Este livro não tem sumário nem mapa de assuntos. Abra o livro e use Anterior e Próxima.');
  conf('sem linhas de capítulo', lv.linhas, '');
  conf('o resumo diz que não há mapa', lv.resumo, '2 páginas · sem mapa de assuntos');
  conf('o livro ainda abre pelo botão do alto', lv.continuar, 'Abrir o livro');
  let ruins = await medir(pag, '#bib-livro');
  conf('a tela do livro sem sumário não transborda', ruins.join('; '), '');
  await clicar(pag, '#bib-livro-voltar');
  await pausa(300);

  // ================================================================
  secao('7. Tablet 1280x800: sem transbordo a 100% e a 130%');
  await clicar(pag, '#bib-livros .bibl-ano[data-ano="09"]');
  for (const [rot, css] of [['100%', ''], ['130%', LETRA_130]]) {
    await letra(pag, css);
    await pausa(300);
    ruins = await medir(pag, '#bib-livros');
    conf('a aba a ' + rot + ': nada transborda, alvos de 48 px, sem travessão', ruins.join('; '), '');
    await clicar(pag, '#bib-livros [data-livro="livro-com-marcadores"]');
    await esperar('a tela do livro', () => lerLivro(pag), v => v.visivel, 5000);
    await pausa(200);
    ruins = await medir(pag, '#bib-livro');
    conf('a tela do livro a ' + rot + ': nada transborda, alvos de 48 px, sem travessão', ruins.join('; '), '');
    await clicar(pag, '#bib-livro-voltar');
    await pausa(300);
  }
  await letra(pag, '');

  // ================================================================
  secao('7b. O topo do desenho, a largura estreita e o Material da aula');
  await H.irParaAba(pag, 'biblioteca');
  await pausa(400);
  const topo = await pag.evaluate(() => {
    const t = document.querySelector('.bibl-topo .titulo').getBoundingClientRect();
    const c = document.querySelector('#bib-livros-contagem').getBoundingClientRect();
    const b = document.querySelector('#bib-busca-cartao').getBoundingClientRect();
    const cont = document.querySelector('.bibl-continuar').getBoundingClientRect();
    const area = document.querySelector('.conteudo').getBoundingClientRect();
    const meio = r => r.top + r.height / 2;
    return { umaLinha: Math.abs(meio(t) - meio(c)) < 12 && Math.abs(meio(t) - meio(b)) < 12,
      lupa: !!document.querySelector('#bib-busca-cartao svg[data-icone-nome="search"]'),
      continuar: Math.round(cont.top - area.top) };
  });
  conf('título, contagem e busca (com a lupa) numa linha só', topo.umaLinha && topo.lupa, true);
  conf('o Continuar lendo logo abaixo do topo (a menos de 120 px do alto)', topo.continuar < 120, true);
  console.log('   Continuar lendo a ' + topo.continuar + ' px do alto');
  ruins = await medir(pag, '.bibl-topo');
  conf('o topo não transborda', ruins.join('; '), '');
  await pag.setViewport({ width: 800, height: 1280, hasTouch: true });
  for (const [rot, css] of [['100%', ''], ['130%', LETRA_130]]) {
    await letra(pag, css);
    await pausa(300);
    ruins = (await medir(pag, '#bib-livros')).concat(await medir(pag, '.bibl-topo'));
    conf('800 px de largura a ' + rot + ': a aba não transborda', ruins.join('; '), '');
    await clicar(pag, '#bib-livros [data-livro="livro-com-marcadores"]');
    await esperar('a tela do livro', () => lerLivro(pag), v => v.visivel, 5000);
    await pausa(200);
    ruins = await medir(pag, '#bib-livro');
    conf('800 px de largura a ' + rot + ': a tela do livro não transborda', ruins.join('; '), '');
    await clicar(pag, '#bib-livro-voltar');
    await pausa(300);
  }
  await letra(pag, '');
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true, deviceScaleFactor: PRINTS ? 2 : 1 });
  await pausa(300);
  conf('a aula de hoje abriu', await abrirAulaDeHoje(pag, '10:00'), true);
  const material = await esperar('o botão Material do assunto', () => pag.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#corpo-modal-aula .item-assunto-aula button')).find(x => x.textContent.trim() === 'Material');
    if (!b) return false; b.click(); return true;
  }), v => v === true, 10000);
  conf('o Material do assunto foi tocado', material.ok, true);
  await esperar('a Biblioteca com a faixa da aula', () => pag.evaluate(() => {
    const c = document.querySelector('#bib-contexto'); return !!c && !c.hidden && document.querySelector('#tela-biblioteca').classList.contains('ativa');
  }), v => v, 10000);
  await pausa(600);
  const altoContexto = await altoNaArea(pag, '#bib-contexto');
  const tituloDoModulo = await pag.evaluate(() => (document.querySelector('#bib-corpo .bib-titulo') || {}).textContent || '');
  conf('vindo do Material, a aba abre no módulo do assunto', tituloDoModulo, 'Equações do Segundo Grau');
  conf('e a faixa da aula fica no alto da área, e não abaixo dos livros', altoContexto !== null && altoContexto >= -2 && altoContexto <= 40, true);
  console.log('   vindo do Material: a faixa da aula a ' + altoContexto + ' px do alto');
  // a tela do livro fecha ao trocar de aba (o trilho por baixo dela não fica preso)
  await clicar(pag, '#bib-livros [data-livro="livro-com-marcadores"]');
  await esperar('a tela do livro', () => lerLivro(pag), v => v.visivel, 5000);
  await H.irParaAba(pag, 'agenda');
  conf('trocar de aba fecha a tela do livro', (await lerLivro(pag)).visivel, false);

  // ================================================================
  secao('8. Nada novo gravado');
  const chaves = await pag.evaluate(() => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => {
      const b = q.result; const t = b.transaction('livros_posicoes', 'readonly');
      const c = t.objectStore('livros_posicoes').getAllKeys();
      c.onsuccess = () => { b.close(); r(c.result.slice().sort().join(',')); };
    };
  }));
  conf('livros_posicoes só tem a posição de cada livro lido (o que os leitores já guardavam)', chaves, 'livro-com-marcadores,livro-de-prova');
  const ajustes = await pag.evaluate(() => Store.carregar().then(d => JSON.stringify((d.ajustes || {}).mapaDosLivros || null)));
  conf('o mapa dos livros dela continua sem correção nenhuma', ajustes, 'null');

  // ================================================================
  secao('9. Marcadores lixo e sumário vazio: a tela usa o sumário do mapa');
  /* Três livros SINTÉTICOS gravados direto no depósito, com o PDF de 6
   * páginas do livro-com-marcadores e um pacote próprio (não mexe nos de
   * cima): marcadores "page1..page40" com mapa de 3 capítulos; sem marcadores
   * com mapa de 1 entrada ("Volume", como o Araribá 8); e o controle,
   * marcadores lixo SEM mapa, que fica como está. */
  const gravados = await pag.evaluate(async () => {
    const base = await Store.lerLivro('livro-com-marcadores');
    const cap = (n, titulo, ini, fim, ids) => ({ n, titulo, pagina: ini, pagina_fim: fim,
      assuntos: ids.map(id => ({ id, confianca: 'alta' })), origem: 'mapa' });
    const lixo = Array.from({ length: 40 }, (_, i) => ({ n: i + 1, nivel: 1, titulo: 'page' + (i + 1), pagina: (i % 6) + 1 }));
    const livro = (id, titulo, extra) => ({ blob: base.blob, meta: Object.assign({}, base.meta, { id, titulo, volume: '',
      hash: 'prova-' + id, numeracao: undefined, gabarito_origem: undefined, gabarito_secoes: undefined }, extra) });
    const c = await Store.gravarLivros({ manifest: { pacote: 'prova-sumario-do-mapa', versao: 1 }, livros: [
      livro('prova-marcadores-lixo', 'Prova marcadores lixo', { sumario: lixo, sumario_origem: 'marcadores',
        mapa: [cap(1, 'Números naturais', 1, 2, ['MAT06-02']), cap(2, 'Frações', 3, 4, ['MAT06-05']), cap(3, 'Geometria plana', 5, 6, [])] }),
      livro('prova-sem-marcadores', 'Prova sem marcadores', { sumario: [], sumario_origem: 'nenhum',
        mapa: [cap(1, 'Volume', 4, 6, ['MAT06-05'])] }),
      livro('prova-lixo-sem-mapa', 'Prova lixo sem mapa', { sumario: lixo, sumario_origem: 'marcadores', mapa: [] })
    ] });
    return c.novos;
  });
  conf('os três livros de prova entraram no depósito', gravados, 3);
  /* O sumário do mapa é calculado NA TELA e nunca gravado: gravar mudaria o
   * JSON do sumário, e o gravarLivros solta a posição de leitura quando o
   * sumário muda (posicoesSoltas). O retrato é o JSON cru dos depósitos
   * 'livros' (o registro inteiro, menos o Blob) e 'livros_posicoes'. */
  const retrato = () => pag.evaluate(() => new Promise((ok, falha) => {
    const q = indexedDB.open('apoio-educacional');
    q.onerror = () => falha(q.error);
    q.onsuccess = () => {
      const b = q.result; const tr = b.transaction(['livros', 'livros_posicoes'], 'readonly');
      const r = {};
      tr.objectStore('livros').getAll().onsuccess = e => {
        r.livros = JSON.stringify(e.target.result.map(x => Object.assign({}, x, { blob: x.blob ? x.blob.size : null })));
      };
      tr.objectStore('livros_posicoes').getAll().onsuccess = e => {
        r.posicoes = {}; e.target.result.forEach(p => { r.posicoes[p.id] = JSON.stringify(p); });
      };
      tr.oncomplete = () => { b.close(); ok(r); };
      tr.onerror = () => { b.close(); falha(tr.error); };
    };
  }));
  const antes = await retrato();
  conf('o retrato enxerga os livros de prova e o sumário gravado deles', /"id":"prova-marcadores-lixo"/.test(antes.livros) &&
    /"titulo":"page40"/.test(antes.livros) && /"sumario":\[\],"sumario_origem":"nenhum"/.test(antes.livros), true);
  await H.irParaAba(pag, 'biblioteca');
  await pausa(300);
  await clicar(pag, '#bib-livros .bibl-disciplina[data-disciplina="matematica"]');
  await clicar(pag, '#bib-livros .bibl-ano[data-ano="06"]');
  await esperar('os livros de prova na aba', () => lerSecao(pag), v => /prova-marcadores-lixo/.test(v.livros), 10000);
  const cartao = id => pag.evaluate(i => {
    const b = document.querySelector('#bib-livros [data-livro="' + i + '"]');
    if (!b) return '';
    const f = b.querySelector('[data-falta]');
    return b.querySelectorAll('.bibl-apoio')[0].textContent + '|' + (f ? 'falta:' + f.dataset.falta : (b.querySelector('[data-mapa]') ? 'mapa' : '?'));
  }, id);
  const cLixo = await cartao('prova-marcadores-lixo');

  if (VENENO_SUMARIO) {
    secao('VENENO: a tela usa o sumário do pacote (o da main)');
    await clicar(pag, '#bib-livros [data-livro="prova-marcadores-lixo"]');
    await esperar('a tela do livro de prova', () => lerLivro(pag), v => v.visivel && v.livro === 'prova-marcadores-lixo', 5000);
    const lvv = await lerLivro(pag);
    const visto = /40 capítulos/.test(lvv.resumo) && /^cap1@1\[1\]\*,cap2@2\[2\]/.test(lvv.linhas);
    conf('envenenado-sumario-dos-marcadores: a tela lista os 40 "pageN" como capítulos (defeito detectado)', visto, true);
    if (visto) console.log('VENENO visto: o sumário dos marcadores lixo voltou à tela.');
    await H.fim(amb)();
    return;
  }

  conf('o cartão do livro de marcadores lixo conta os capítulos do mapa', cLixo, '6 p. · 3 capítulos|mapa');
  conf('o cartão do livro sem marcadores com mapa não diz "sem sumário"', await cartao('prova-sem-marcadores'), '6 p. · 1 capítulo|mapa');
  conf('controle: o cartão do lixo sem mapa fica como está', await cartao('prova-lixo-sem-mapa'), '6 p. · 40 capítulos|falta:mapa');

  await clicar(pag, '#bib-livros [data-livro="prova-marcadores-lixo"]');
  await esperar('a tela do livro de marcadores lixo', () => lerLivro(pag), v => v.visivel && v.livro === 'prova-marcadores-lixo', 5000);
  await esperar('os nomes dos assuntos', () => lerLivro(pag), v => !/MAT06-/.test(v.assuntosDosCapitulos), 10000);
  lv = await lerLivro(pag);
  let depois = await retrato();
  conf('só a tela aberta, com o sumário do mapa: o depósito livros fica idêntico (o JSON)', depois.livros === antes.livros, true);
  conf('e livros_posicoes também', JSON.stringify(depois.posicoes) === JSON.stringify(antes.posicoes), true);
  conf('o resumo: 3 capítulos do mapa, e não 40', lv.resumo, '6 páginas · 3 capítulos · 2 assuntos ligados');
  conf('o sumário são os capítulos do mapa, cada um na página dele (o primeiro marcado)', lv.linhas, 'cap1@1[1]*,cap2@3[2],cap3@5[3]');
  conf('os títulos do mapa', await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-livro .bibl-cap .bibl-cap-titulo'))
    .map(b => b.textContent).join(' | ')), 'Números naturais | Frações | Geometria plana');
  const ass = lv.assuntosDosCapitulos.split(' | ');
  conf('os assuntos ligados de cada capítulo (os dois primeiros com nome, o terceiro sem)', ass.length + '|' +
    (ass[0] !== 'nenhum assunto ligado ainda' && !!ass[0]) + '|' + (ass[1] !== 'nenhum assunto ligado ainda' && !!ass[1]) + '|' + ass[2], '3|true|true|nenhum assunto ligado ainda');
  conf('o aria-label do capítulo 2', await pag.evaluate(() => document.querySelector('#bib-livro .bibl-cap[data-n="2"]').getAttribute('aria-label')),
    'Capítulo 2, Frações, página 3');
  conf('o painel: Capítulo 1, as páginas, os assuntos e o Abrir na p. 1',
    /^Capítulo 1\s+Números naturais\s+Páginas do arquivo 1 a 2 · 2 páginas[\s\S]*Assuntos ligados[\s\S]*Abrir na p\. 1$/.test(lv.painel.trim()) &&
    !/Nenhum assunto ligado/.test(lv.painel), true);
  await clicar(pag, '#bib-livro .bibl-cap[data-n="2"]');
  const rl = await esperar('o leitor no capítulo 2 do mapa', () => paginaDesenhada(pag), v => v !== 'fechado' && v !== '', 20000);
  conf('tocar no capítulo 2 abre o leitor na página 3', rl.valor, '3');
  await clicar(pag, '#leitor-sumario');
  await pausa(200);
  conf('o sumário do leitor também é o do mapa, com o capítulo atual marcado', await pag.evaluate(() =>
    Array.from(document.querySelectorAll('#leitor-sumario-lista button')).map(b => b.dataset.entrada + (b.classList.contains('atual') ? '*' : '')).join(',')),
  '1,2*,3');
  await clicar(pag, '#leitor-sumario');
  await fecharModal(pag, 'modal-leitor-pdf');
  await esperar('a tela com a posição nova', () => lerLivro(pag), v => v.visivel && /p\. 3/.test(v.continuar), 5000);
  lv = await lerLivro(pag);
  conf('a posição atual: o capítulo 2 marcado e o painel nele', lv.linhas + '|' + /^Capítulo 2\s+Frações[\s\S]*Abrir na p\. 3$/.test(lv.painel.trim()),
    'cap1@1[1],cap2@3[2]*,cap3@5[3]|true');
  ruins = await medir(pag, '#bib-livro');
  conf('a tela do livro de marcadores lixo não transborda', ruins.join('; '), '');
  await clicar(pag, '#bib-livro-voltar');
  await esperar('a aba de volta', () => lerSecao(pag), v => v.visivel && /prova-marcadores-lixo/.test(v.continuar), 5000);
  s = await lerSecao(pag);
  conf('o Continuar lendo diz o capítulo do mapa', /(^|,)prova-marcadores-lixo\|Cap\. 2, Frações · p\. 3(,|$)/.test(s.continuar), true);

  await clicar(pag, '#bib-livros [data-livro="prova-sem-marcadores"]');
  await esperar('a tela do livro sem marcadores', () => lerLivro(pag), v => v.visivel && v.livro === 'prova-sem-marcadores', 5000);
  await esperar('o nome do assunto', () => lerLivro(pag), v => !/MAT06-/.test(v.assuntosDosCapitulos), 10000);
  lv = await lerLivro(pag);
  conf('sem marcadores e com mapa de 1 entrada: não diz que falta sumário', lv.semSumario, '');
  conf('o resumo: 1 capítulo e 1 assunto ligado', lv.resumo, '6 páginas · 1 capítulo · 1 assunto ligado');
  conf('o sumário é a entrada do mapa', lv.linhas + '|' + await pag.evaluate(() => document.querySelector('#bib-livro .bibl-cap .bibl-cap-titulo').textContent),
    'cap1@4[1]*|Volume');
  conf('com o assunto ligado', !!lv.assuntosDosCapitulos && lv.assuntosDosCapitulos !== 'nenhum assunto ligado ainda', true);
  conf('o painel: páginas 4 a 6 e Abrir na p. 4', /^Capítulo 1\s+Volume\s+Páginas do arquivo 4 a 6 · 3 páginas[\s\S]*Abrir na p\. 4$/.test(lv.painel.trim()), true);
  await clicar(pag, '#bib-livro-abrir-capitulo');
  const rv = await esperar('o leitor no Volume', () => paginaDesenhada(pag), v => v !== 'fechado' && v !== '', 20000);
  conf('o Abrir na p. 4 abre o leitor na página 4', rv.valor, '4');
  await fecharModal(pag, 'modal-leitor-pdf');
  await clicar(pag, '#bib-livro-voltar');
  await pausa(300);

  await clicar(pag, '#bib-livros [data-livro="prova-lixo-sem-mapa"]');
  await esperar('a tela do lixo sem mapa', () => lerLivro(pag), v => v.visivel && v.livro === 'prova-lixo-sem-mapa', 5000);
  lv = await lerLivro(pag);
  conf('controle: sem mapa, os 40 marcadores ficam como estão', lv.resumo, '6 páginas · 40 capítulos · sem mapa de assuntos');
  await clicar(pag, '#bib-livro-voltar');
  await pausa(300);

  depois = await retrato();
  conf('depois da tela e do leitor com o sumário do mapa: o depósito livros fica idêntico (o JSON, sumário incluído)',
    depois.livros === antes.livros, true);
  const novas = Object.keys(depois.posicoes).filter(k => !(k in antes.posicoes)).sort().join(',');
  // controle positivo: o retrato vê a posição que o leitor grava, como sempre gravou
  conf('livros_posicoes ganhou só a posição dos dois livros lidos (o que o leitor sempre gravou)', novas, 'prova-marcadores-lixo,prova-sem-marcadores');
  conf('e as posições que já estavam ficam idênticas (nenhuma solta)', Object.keys(antes.posicoes).length > 0 &&
    Object.keys(antes.posicoes).every(k => depois.posicoes[k] === antes.posicoes[k]), true);

  if (PRINTS) {
    secao('Prints');
    fs.mkdirSync(PRINTS, { recursive: true });
    await H.irParaAba(pag, 'biblioteca');
    await pausa(500);
    await clicar(pag, '#bib-livros .bibl-disciplina[data-disciplina="matematica"]');
    await clicar(pag, '#bib-livros .bibl-ano[data-ano="09"]');
    await pag.evaluate(() => { const a = document.querySelector('#aviso'); if (a) a.classList.remove('aberto'); });
    await pausa(400);
    await pag.screenshot({ path: path.join(PRINTS, 'tab_biblioteca.png') });
    await clicar(pag, '#bib-livros [data-livro="livro-com-marcadores"]');
    await esperar('a tela do livro', () => lerLivro(pag), v => v.visivel, 5000);
    await pausa(500);
    await pag.screenshot({ path: path.join(PRINTS, 'tab_livro_sumario.png') });
    await clicar(pag, '#bib-livro-voltar');
    for (const [nome, w, h, css] of [['cel_biblioteca.png', 412, 915, ''], ['cel_biblioteca_360_130.png', 360, 780, LETRA_130]]) {
      const cel = await amb.pagina();
      await cel.setViewport({ width: w, height: h, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
      await cel.goto(amb.ORIGEM + '/index.html', { waitUntil: 'networkidle0' });
      await esperar('o celular abriu', () => cel.evaluate(() => document.body.classList.contains('modo-celular') && !document.querySelector('#cel-abas').hidden), v => v === true, 30000);
      await cel.evaluate(() => { const b = document.querySelector('#entendi-novidades'); if (b && document.querySelector('#modal-novidades.aberto')) b.click(); });
      await letra(cel, css);
      await cel.evaluate(() => document.querySelector('#cel-abas [data-cel="biblioteca"]').click());
      await pausa(600);
      await cel.screenshot({ path: path.join(PRINTS, nome) });
      await cel.close();
    }
    console.log('   prints em ' + PRINTS);
  }

  secao('9. O leitor contínuo: a página não foge, as vizinhas aparecem e o canvas solta');
  /* Livro sintético de 400 páginas. Antes: o "+" na p. 206 deixava a p. 165
   * no meio; o giro na p. 266 mostrava a p. 164 com o contador em 266; depois
   * do zoom e do giro, as vizinhas ficavam em branco; e deitado, 80 passos de
   * rolagem deixavam 19 canvases vivos (cerca de 150 Mpx). Em modo veneno,
   * cada verificação marcada com o nome do veneno TEM de reprovar. */
  const visto = {};
  const checa = (rotulo, obtido, esperado, veneno) => {
    if (VENENO_LEITOR) {
      if (veneno === VENENO_LEITOR && String(obtido) !== String(esperado)) {
        visto[veneno] = (visto[veneno] ? visto[veneno] + ' ; ' : '') + rotulo + ' [obtido: ' + obtido + ']';
      }
      return;
    }
    conf(rotulo, obtido, esperado);
  };
  const pastaLeitor = path.join(TMP, 'leitor');
  fs.mkdirSync(pastaLeitor, { recursive: true });
  const zipLeitor = gerarLivros('--leitor', pastaLeitor);
  conf('o livro sintético de 400 páginas foi gerado', !!zipLeitor, true);
  if (!zipLeitor) throw Object.assign(new Error('sem o livro do leitor'), { jaContado: true });
  await pag.setViewport({ width: 800, height: 1280, hasTouch: true, deviceScaleFactor: 1 });
  await importar(pag, zipLeitor);
  await abrirBiblioteca(pag);
  await clicar(pag, '#bib-livros .bibl-disciplina[data-disciplina="matematica"]');
  let achou = false;
  for (const ano of await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-livros .bibl-ano')).map(b => b.dataset.ano))) {
    await clicar(pag, '#bib-livros .bibl-ano[data-ano="' + ano + '"]');
    await pausa(150);
    if (await clicar(pag, '#bib-livros [data-livro="livro-leitor-400"]')) { achou = true; break; }
  }
  conf('o livro de 400 páginas está na Biblioteca', achou, true);
  await esperar('a tela do livro de 400 páginas', () => lerLivro(pag), v => v.visivel && v.livro === 'livro-leitor-400', 5000);
  await clicar(pag, '#bib-livro-continuar');
  await esperar('o leitor do livro de 400 páginas', () => paginaDesenhada(pag), v => v === '1', 30000);
  // a página no meio da área de leitura, o ponto dentro dela, o contador, as páginas à vista sem canvas e os canvases vivos
  const meioDoLeitor = () => pag.evaluate(() => {
    const c = document.querySelector('#corpo-modal-leitor-pdf'), r = c.getBoundingClientRect();
    const y = r.top + c.clientHeight / 2, e = document.elementFromPoint(r.left + c.clientWidth / 2, y);
    const caixa = e && e.closest('[data-pagina-arquivo]');
    const rc = caixa ? caixa.getBoundingClientRect() : null;
    const vazias = Array.from(c.querySelectorAll('.leitor-pdf-pagina')).filter(b => {
      const q = b.getBoundingClientRect(); return q.bottom > r.top + 1 && q.top < r.top + c.clientHeight - 1 && !b.querySelector('canvas');
    }).map(b => b.dataset.paginaArquivo);
    return { meio: caixa ? +caixa.dataset.paginaArquivo : null, contador: document.querySelector('#leitor-contador').textContent,
      fy: rc ? (y - rc.top) / rc.height : null, altura: rc ? rc.height : null, largura: rc ? Math.round(rc.width) : null,
      canvas: !!(caixa && caixa.querySelector('canvas')), vazias: vazias.join(','),
      vivos: Array.from(c.querySelectorAll('canvas')).filter(k => k.width > 0).length,
      pixels: Array.from(c.querySelectorAll('canvas')).reduce((s, k) => s + k.width * k.height, 0) };
  });
  const irParaPagina = async n => {
    await pag.evaluate(v => { const i = document.querySelector('#leitor-ir-pagina'); i.value = String(v); i.dispatchEvent(new Event('change')); }, n);
    const r = await esperar('a página ' + n + ' no meio', meioDoLeitor, v => v.meio === n && v.canvas, 20000);
    await pausa(300);
    return r;
  };
  // toda página que encosta na tela tem canvas em até 1 s
  const vizinhasDesenhadas = async rotulo => (await esperar(rotulo + ': as páginas à vista desenhadas', meioDoLeitor, v => v.vazias === '', 1000)).ok;
  const desvio = (antes, depois) => depois.fy === null || antes.fy === null ? null : Math.abs(depois.fy - antes.fy) * depois.altura;
  const contaDiz = (m, n) => new RegExp('(Página|p\\.) ' + n + ' de 400').test(m.contador);

  // ---- arrastar a barra da p. 50 à 350: rolagem direta, quase nenhum canvas de passagem e uma gravação só, ao soltar
  await irParaPagina(50);
  await pausa(600);
  await pag.evaluate(() => {
    window.__canvasCriados = 0;
    window.__createElementOriginal = document.createElement;
    document.createElement = function (nome) {
      if (String(nome).toLowerCase() === 'canvas') window.__canvasCriados++;
      return window.__createElementOriginal.apply(document, arguments);
    };
    window.__posicoesGravadas = [];
    window.__gravarPosicaoOriginal = Store.gravarPosicaoLivro;
    Store.gravarPosicaoLivro = function (pos) { window.__posicoesGravadas.push(pos && pos.pagina); return window.__gravarPosicaoOriginal.apply(Store, arguments); };
  });
  await pag.evaluate(async () => {
    const s = document.querySelector('#leitor-slider-pagina');
    for (let v = 51; v <= 350; v++) { s.value = String(v); s.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 16)); }
    s.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await pausa(1500);
  const arrasto = await pag.evaluate(() => {
    const r = { criados: window.__canvasCriados, gravadas: window.__posicoesGravadas.join(','),
      contador: document.querySelector('#leitor-contador').textContent };
    document.createElement = window.__createElementOriginal;
    Store.gravarPosicaoLivro = window.__gravarPosicaoOriginal;
    return r;
  });
  const m350 = await meioDoLeitor();
  console.log('   barra de 50 a 350: ' + arrasto.criados + ' canvases criados; posições gravadas: ' + arrasto.gravadas);
  conf('arrastar a barra de 50 a 350 cria no máximo 12 canvases (sem desenhar o caminho)', arrasto.criados <= 12, true);
  conf('e grava a posição uma vez só, a 350, ao soltar', arrasto.gravadas, '350');
  conf('e a página 350 fica no meio, com o contador nela', m350.meio + '|' + contaDiz(m350, 350), '350|true');

  // ---- o "+" na p. 206
  const a206 = await irParaPagina(206);
  conf('o Ir p. leva à página 206, no meio da tela', a206.ok, true);
  await clicar(pag, '#leitor-mais');
  const z = await esperar('o "+" na página 206', meioDoLeitor, v => v.largura > a206.valor.largura && v.canvas, 8000);
  await pausa(300);
  const dz = await meioDoLeitor();
  conf('o "+" aumentou a página (o zoom aconteceu)', z.ok, true);
  checa('depois do "+", a página 206 continua no meio', dz.meio, 206, 'zoom-sem-ancora');
  checa('e o contador diz 206', contaDiz(dz, 206), true, 'zoom-sem-ancora');
  const dvz = desvio(a206.valor, dz);
  checa('o ponto do meio se desloca menos de 24 px no "+"', dvz !== null && dvz < 24, true, 'zoom-sem-ancora');
  console.log('   zoom na p. 206: o ponto do meio andou ' + (dvz === null ? '?' : Math.round(dvz)) + ' px');
  checa('depois do "+", toda página à vista tem canvas em até 1 s', await vizinhasDesenhadas('o "+"'), true, 'vizinhas-sem-desenho');

  // ---- o "Ajustar à largura", com o ponto do meio fora do alto da página
  await pag.evaluate(() => { document.querySelector('#corpo-modal-leitor-pdf').scrollTop += 300; });
  await pausa(500);
  const antesL = await meioDoLeitor();
  await clicar(pag, '#leitor-largura');
  const dl = await esperar('o "Ajustar à largura" na página 206', meioDoLeitor, v => v.largura < antesL.largura && v.canvas, 8000);
  await pausa(300);
  const dlv = await meioDoLeitor();
  const dvl = desvio(antesL, dlv);
  conf('o "Ajustar à largura" voltou à largura (a troca aconteceu)', dl.ok, true);
  checa('o "Ajustar à largura" deixa a mesma página no meio, com o contador nela',
    dlv.meio + '|' + contaDiz(dlv, antesL.meio), antesL.meio + '|true', 'zoom-sem-ancora');
  checa('e o ponto do meio se desloca menos de 24 px', dvl !== null && dvl < 24, true, 'largura-vai-ao-alto');
  console.log('   ajustar à largura: o ponto do meio andou ' + (dvl === null ? '?' : Math.round(dvl)) + ' px');
  checa('depois do "Ajustar à largura", toda página à vista tem canvas em até 1 s', await vizinhasDesenhadas('a largura'), true, 'vizinhas-sem-desenho');

  // ---- o "Ajustar à largura" sem mudar nada, na divisa entre duas páginas: a rolagem nem se mexe
  const a100 = await irParaPagina(100);
  await pag.evaluate(() => { const c = document.querySelector('#corpo-modal-leitor-pdf'); c.scrollTop += Math.round(c.clientHeight * 0.6); });
  await esperar('a divisa entre a 100 e a 101 à vista', meioDoLeitor, v => v.vazias === '' && v.meio >= 100, 3000);
  await clicar(pag, '#leitor-largura');
  await pausa(150);
  checa('na divisa, o "Ajustar à largura" redesenha as duas páginas à vista em até 1 s', await vizinhasDesenhadas('a divisa'), true, 'vizinhas-sem-desenho');
  void a100;

  // ---- o "−" na p. 300
  const a300 = await irParaPagina(300);
  await clicar(pag, '#leitor-menos');
  await esperar('o "−" na página 300', meioDoLeitor, v => v.largura < a300.valor.largura && v.canvas, 8000);
  await pausa(300);
  const dm = await meioDoLeitor();
  checa('depois do "−", a página 300 continua no meio', dm.meio, 300, 'zoom-sem-ancora');
  checa('depois do "−", toda página à vista tem canvas em até 1 s', await vizinhasDesenhadas('o "−"'), true, 'vizinhas-sem-desenho');
  /* o redimensionamento sozinho desenha as páginas à vista, sem a ajuda do
   * evento de rolagem: com o evento segurado antes do leitor, o "−" de novo (agora
   * duas páginas à vista) ainda deixa as duas desenhadas */
  await pag.evaluate(() => {
    // o evento de rolagem do leitor para antes de chegar nele (fase de captura no documento)
    window.__seguraRolagem = e => { if (e.target && e.target.id === 'corpo-modal-leitor-pdf') e.stopImmediatePropagation(); };
    document.addEventListener('scroll', window.__seguraRolagem, true);
  });
  await clicar(pag, '#leitor-menos');
  await pausa(150);
  const semQuadro = await vizinhasDesenhadas('o "−" sem o evento de rolagem');
  await pag.evaluate(() => { document.removeEventListener('scroll', window.__seguraRolagem, true); delete window.__seguraRolagem; });
  checa('sem o evento de rolagem, o "−" também redesenha as páginas à vista em até 1 s', semQuadro, true, 'vizinhas-sem-desenho');
  await clicar(pag, '#leitor-largura');
  await pausa(600);

  // ---- o giro na p. 266
  const a266 = await irParaPagina(266);
  conf('o Ir p. leva à página 266', a266.ok, true);
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true, deviceScaleFactor: 1 });
  const g = await esperar('o giro para deitado na página 266', meioDoLeitor, v => v.largura > a266.valor.largura && v.canvas, 8000);
  await pausa(300);
  const dg = await meioDoLeitor();
  const dvg = desvio(a266.valor, dg);
  conf('o giro alargou a página (a troca de tamanho aconteceu)', g.ok, true);
  checa('deitado, a página 266 continua no meio', dg.meio, 266, 'zoom-sem-ancora');
  checa('e o contador diz 266', contaDiz(dg, 266), true, 'zoom-sem-ancora');
  console.log('   giro na p. 266: o ponto do meio andou ' + (dvg === null ? '?' : Math.round(dvg)) + ' px');
  checa('o ponto do meio se desloca menos de 24 px no giro', dvg !== null && dvg < 24, true, 'giro-sem-ancora-guardada');
  checa('depois do giro, toda página à vista tem canvas em até 1 s', await vizinhasDesenhadas('o giro'), true, 'vizinhas-sem-desenho');

  // ---- o canvas solta: deitado, 80 passos de 400 px para baixo e 80 para cima
  const rolar = async (passo, vezes) => {
    for (let i = 0; i < vezes; i++) {
      await pag.evaluate(p => { document.querySelector('#corpo-modal-leitor-pdf').scrollTop += p; }, passo);
      await pausa(60);
    }
    await pausa(800);
    return meioDoLeitor();
  };
  const desce = await rolar(400, 80);
  console.log('   deitado, depois de 80 passos: ' + desce.vivos + ' canvases vivos, p. ' + desce.meio);
  checa('deitado, depois de 80 passos de 400 px, no máximo 4 canvases vivos', desce.vivos <= 4, true, 'canvas-sem-soltar');
  const sobe = await rolar(-400, 80);
  console.log('   deitado, depois de voltar: ' + sobe.vivos + ' canvases vivos, p. ' + sobe.meio);
  checa('e depois de voltar, no máximo 4', sobe.vivos <= 4, true, 'canvas-sem-soltar');
  checa('e as páginas à vista continuam desenhadas', await vizinhasDesenhadas('a volta'), true, 'canvas-sem-soltar');
  // em pé com zoom perto de 2 (três toques no "+")
  await pag.setViewport({ width: 800, height: 1280, hasTouch: true, deviceScaleFactor: 1 });
  await pausa(800);
  for (let i = 0; i < 3; i++) { await clicar(pag, '#leitor-mais'); await pausa(400); }
  await pausa(600);
  const desceZ = await rolar(400, 80);
  console.log('   em pé com zoom 1,95, depois de 80 passos: ' + desceZ.vivos + ' canvases vivos');
  checa('em pé com zoom perto de 2, depois de 80 passos, no máximo 4 canvases vivos', desceZ.vivos <= 4, true, 'canvas-sem-soltar');
  const sobeZ = await rolar(-400, 80);
  checa('e depois de voltar, no máximo 4', sobeZ.vivos <= 4, true, 'canvas-sem-soltar');
  // no zoom 4 a página é muito maior que a tela: a vizinha longe não fica viva
  for (let i = 0; i < 5; i++) { await clicar(pag, '#leitor-mais'); await pausa(400); }
  await pausa(800);
  /* Desde a fatia 3 do leitor, o que se conta no zoom 4 são os PIXELS, e não
   * os canvases: há o canvas de detalhe por cima da página à vista e a página
   * seguinte pré-desenhada na direção da rolagem, e o leitor segura o total no
   * orçamento de 16 milhões. A vizinha longe, do lado de trás, continua solta. */
  let picoZ4 = 0, picoPx = 0;
  for (let i = 0; i < 12; i++) {
    await pag.evaluate(() => { document.querySelector('#corpo-modal-leitor-pdf').scrollTop += 300; });
    await pausa(250);
    const m = await meioDoLeitor();
    picoZ4 = Math.max(picoZ4, m.vivos);
    picoPx = Math.max(picoPx, m.pixels);
  }
  console.log('   zoom 4: pico de ' + picoZ4 + ' canvases vivos e ' + (picoPx / 1e6).toFixed(2) + ' milhões de pixels rolando de 300 em 300 px');
  /* com o veneno canvas-sem-soltar a pré-desenhada de cada passo fica viva e
   * o orçamento estoura: aqui também é a falha que o veneno tem de dar */
  checa('no zoom 4, o pico fica em no máximo 16 milhões de pixels de canvas vivos', picoPx <= 16000000, true, 'canvas-sem-soltar');
  checa('e em no máximo 5 canvases (as à vista, os detalhes delas e a pré-desenhada)', picoZ4 <= 5, true, 'canvas-sem-soltar');
  conf('e a página à vista segue desenhada', (await esperar('o zoom 4: a página à vista desenhada', meioDoLeitor, v => v.vazias === '', 8000)).ok, true);
  await clicar(pag, '#leitor-largura');
  await pausa(400);

  if (VENENO_LEITOR) {
    secao('VENENO: ' + VENENO_LEITOR);
    conf('envenenado-' + VENENO_LEITOR + ': a seção 9 viu o defeito', !!visto[VENENO_LEITOR], true);
    if (visto[VENENO_LEITOR]) console.log('VENENO visto: ' + visto[VENENO_LEITOR]);
    await H.fim(amb)();
    return;
  }
  await fecharModal(pag, 'modal-leitor-pdf');

  secao('10. B1: a página do assunto');
  /* Um livro SINTÉTICO a mais, gravado direto no tablet: 4 páginas, e o mapa
   * liga o capítulo "Pitágoras e aplicações" (p. 2 a 3) ao MAT09-07, "Teorema
   * de Pitágoras", e o livro INTEIRO ao MAT08-15 (obra inteira). No pacote
   * sintético do 9º ano, dois exercícios de outro módulo viram questões de
   * prova da OBMEP do MAT09-07, e um terceiro, do ENEM (só no banco desta
   * prova), para os blocos OBMEP e ENEM aparecerem. */
  const pdfB1 = path.join(TMP, 'b1-livro.pdf');
  const rB1 = spawnSync(PYTHON, ['-X', 'utf8', '-c', 'import sys, pymupdf\nd = pymupdf.open()\n' +
    'for t in ["Capa.", "Pitagoras: o quadrado da hipotenusa.", "Aplicacoes do teorema.", "Fim."]:\n' +
    '    d.new_page().insert_text((72, 90), t)\nd.save(sys.argv[1])', pdfB1], { encoding: 'utf8' });
  conf('o PDF do livro da página do assunto foi gerado', rB1.status === 0 && fs.existsSync(pdfB1), true);
  amb.extras['/b1-livro.pdf'] = { tipo: 'application/pdf', corpo: fs.existsSync(pdfB1) ? fs.readFileSync(pdfB1) : Buffer.from('') };
  await pag.evaluate(() => fetch('/b1-livro.pdf').then(r => r.blob()).then(blob => Store.gravarLivros({ manifest: { pacote: 'prova-b1', versao: 1 }, livros: [{
    blob, meta: { id: 'b1-livro', hash: 'sha256:b1', titulo: 'Livro B1 de prova', formato: 'pdf', paginas: 4, series: ['09'], materia: 'matematica',
      mapa_disciplina: 'matematica', sumario: [],
      mapa: [{ n: 1, titulo: 'Pitágoras e aplicações', pagina: 2, pagina_fim: 3, assuntos: [{ id: 'MAT09-07' }] },
        { n: 2, titulo: 'Livro B1 de prova', obra_inteira: true, assuntos: [{ id: 'MAT08-15' }] }] } }] })));
  const ligados = await pag.evaluate(() => new Promise((res, rej) => {
    const q = indexedDB.open('apoio-educacional');
    q.onerror = () => rej(q.error);
    q.onsuccess = () => {
      const b = q.result, t = b.transaction('biblioteca_itens', 'readwrite'), s = t.objectStore('biblioteca_itens');
      const feito = { obmep: 0, enem: 0 };
      s.getAll().onsuccess = e => {
        const itens = e.target.result;
        // de fora do módulo de Pitágoras: duas questões da OBMEP (prova) e uma do ENEM
        const fora = itens.filter(it => String(it.id).indexOf('banco:') !== 0 && it.modulo && !/pitagoras/.test(it.modulo.slug));
        fora.slice(0, 2).forEach(it => { it.fonte = 'obmep-mirim'; it.tema_app = 'MAT09-07'; s.put(it); feito.obmep++; });
        fora.slice(2, 3).forEach(it => { it.fonte = 'enem'; it.tema_app = 'MAT09-07'; s.put(it); feito.enem++; });
      };
      t.oncomplete = () => { b.close(); res(feito); };
      t.onerror = () => rej(t.error);
    };
  }));
  conf('a prova ligou 2 questões da OBMEP e 1 do ENEM ao MAT09-07', JSON.stringify(ligados), JSON.stringify({ obmep: 2, enem: 1 }));
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true, deviceScaleFactor: 1 });
  await H.abrirApp(pag, amb.ORIGEM);
  await abrirBiblioteca(pag);
  const fotoB1 = () => pag.evaluate(() => new Promise((res, rej) => {
    const q = indexedDB.open('apoio-educacional');
    q.onerror = () => rej(q.error);
    q.onsuccess = () => {
      const b = q.result, nomes = Array.from(b.objectStoreNames).filter(n => n !== 'livros').sort(), saida = {};
      const t = b.transaction(nomes, 'readonly');
      nomes.forEach(n => { const r = t.objectStore(n).getAll(); r.onsuccess = () => { saida[n] = r.result; }; });
      t.oncomplete = () => { b.close(); res(JSON.stringify(saida)); };
      t.onerror = () => rej(t.error);
    };
  }));
  const digitarB1 = termo => pag.evaluate(t => { const i = document.querySelector('#busca-biblioteca'); i.value = t; i.dispatchEvent(new Event('input', { bubbles: true })); }, termo);
  const lerAssuntos = () => pag.evaluate(() => {
    const c = document.querySelector('#bib-assuntos-da-busca');
    return c && !c.hidden ? [...c.querySelectorAll('[data-assunto]')].map(l => l.dataset.assunto + '=' + l.querySelector('.nome').textContent + '|' + l.querySelector('.detalhe').textContent) : null;
  });
  const bancoB1 = await fotoB1();
  await digitarB1('pitagoras');
  const assuntos = await esperar('o bloco Assuntos da busca', lerAssuntos, v => !!v && v.length > 0, 10000);
  console.log('   "pitagoras": ' + JSON.stringify(assuntos.valor));
  conf('a busca "pitagoras" mostra o assunto Teorema de Pitágoras no alto, com a matéria, o ano e os capítulos nos livros',
    (assuntos.valor || []).filter(x => /^MAT09-07=/.test(x)).join(''), 'MAT09-07=Teorema de Pitágoras|Matemática · 9º ano · 1 capítulo nos livros');
  conf('o bloco Assuntos vem antes dos grupos de exercícios e de livros', await pag.evaluate(() => {
    const filhos = [...document.querySelector('#bib-corpo').children];
    return filhos.indexOf(document.querySelector('#bib-assuntos-da-busca')) < filhos.indexOf(document.querySelector('#bib-corpo [data-grupo="exercicios"]'));
  }), true);
  // a pergunta do dono: "volume para o 8º ano" chega ao assunto do 8º ano, em primeiro
  for (const termo of ['volume 8', 'volume do 8º ano', 'volume oitavo ano']) {
    await digitarB1(termo);
    const v = await esperar('os assuntos de "' + termo + '"', lerAssuntos, x => !!x && x.length > 0 && !/^MAT09-07/.test(x[0]), 10000);
    console.log('   "' + termo + '": ' + JSON.stringify(v.valor));
    conf('"' + termo + '" põe o MAT08-15 (Volume e capacidade, 8º ano) em primeiro, com o livro inteiro ligado contado',
      (v.valor || [])[0], 'MAT08-15=Volume e capacidade: bloco retangular e cilindro|Matemática · 8º ano · 1 livro inteiro');
    // os grupos de baixo procuram sem o ano: nada diz "Nenhum exercício com "volume 8""
    const grupos = await esperar('os grupos de "' + termo + '"', () => pag.evaluate(() => {
      const g = document.querySelector('#bib-corpo [data-grupo="livros"] .bib-busca-livros-status');
      return g && !/Buscando/.test(g.textContent)
        ? [...document.querySelectorAll('#bib-corpo [data-grupo], #bib-corpo > .vazio, #bib-busca-resumo')].map(x => x.innerText).join(' | ') : null;
    }), x => !!x, 10000);
    conf('com "' + termo + '", os grupos de exercícios e de livros não falam do termo com o ano', /volume 8|volume do 8|oitavo/.test(grupos.valor || ''), false);
  }
  // "equação do 2º grau" não é o 2º ano: os exercícios do módulo aparecem, e o assunto do 9º ano vem primeiro
  await digitarB1('equação do 2º grau');
  const grau = await esperar('a busca "equação do 2º grau"', () => pag.evaluate(() => {
    const c = document.querySelector('#bib-assuntos-da-busca');
    const ex = document.querySelector('#bib-corpo [data-grupo="exercicios"] .bib-grupo-contagem');
    return c && !c.hidden && ex ? { primeiro: c.querySelector('[data-assunto]').dataset.assunto, exercicios: ex.textContent } : null;
  }), x => !!x && x.primeiro !== 'MAT08-15', 10000);
  console.log('   "equação do 2º grau": ' + JSON.stringify(grau.valor));
  conf('"equação do 2º grau" não vira o 2º ano: o assunto do 9º ano vem primeiro, e os exercícios aparecem',
    !!grau.valor && /^MAT09-0[45]$/.test(grau.valor.primeiro) && grau.valor.exercicios !== '0', true);
  // os grupos de baixo mostram as palavras dela, com acento e sem o ano: "frações 6" vira "frações", e nunca "fracoes"
  await digitarB1('frações 6');
  const acento = await esperar('os grupos de "frações 6"', () => pag.evaluate(() => {
    const g = document.querySelector('#bib-corpo [data-grupo="livros"] .bib-busca-livros-status');
    const ex = document.querySelector('#bib-corpo [data-grupo="exercicios"]');
    return g && ex && !/Buscando/.test(g.textContent)
      ? [...document.querySelectorAll('#bib-corpo [data-grupo], #bib-corpo > .vazio')].map(x => x.innerText).join(' | ') : null;
  }), x => !!x && !/equa/i.test(x), 10000);
  console.log('   "frações 6": ' + String(acento.valor || '').slice(0, 300).replace(/\s+/g, ' '));
  conf('com "frações 6", os grupos de baixo não mostram "fracoes" nem o ano', /fracoes|frações 6/.test(acento.valor || ''), false);
  /* "volume" casa 8 assuntos (4 pelo título em Matemática, 1 em Química e 3 pelas palavras-chave): com
   * mais de 5, três no alto, os do título primeiro, e "Ver os outros N" mostra o resto; "volume 8" escolhe o ano */
  await digitarB1('volume');
  const todosVolume = await esperar('os assuntos de "volume"', () => pag.evaluate(() => {
    const c = document.querySelector('#bib-assuntos-da-busca');
    return c && !c.hidden ? { linhas: c.querySelectorAll('[data-assunto]').length, mais: (c.querySelector('.bib-assuntos-mais') || {}).textContent || '' } : null;
  }), x => !!x && x.mais !== '', 10000);
  const nOutros = parseInt(String((todosVolume.valor || {}).mais).replace(/\D+/g, ''), 10) || 0;
  conf('com mais de 5 assuntos, o bloco mostra 3 e "Ver os outros N"', (todosVolume.valor || {}).linhas + '|' + (nOutros > 2), '3|true');
  await clicar(pag, '#bib-assuntos-da-busca .bib-assuntos-mais');
  conf('"Ver os outros N" mostra todos', await pag.evaluate(() => document.querySelectorAll('#bib-assuntos-da-busca [data-assunto]').length), 3 + nOutros);
  await digitarB1('pitagoras');
  await esperar('o bloco Assuntos de novo', lerAssuntos, v => !!v && v.some(x => /^MAT09-07=/.test(x)), 10000);
  await pag.evaluate(() => document.querySelector('#bib-assuntos-da-busca [data-assunto="MAT09-07"]').click());
  const lerPagina = () => pag.evaluate(() => {
    const p = document.querySelector('#bib-corpo .bib-assunto[data-assunto]');
    if (!p || !p.querySelector('.bib-assunto-titulo')) return null;
    const secao = k => p.querySelector('[data-secao="' + k + '"]');
    const vis = s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && !e.hidden; };
    return { id: p.dataset.assunto, titulo: p.querySelector('.bib-assunto-titulo').textContent,
      caminho: p.querySelector('.bib-assunto-caminho').textContent,
      tambem: (secao('tambem') || {}).textContent || '',
      livros: [...p.querySelectorAll('[data-secao="livros"] .bib-assunto-livro')].map(c => c.dataset.livro + ':' + c.querySelector('strong').textContent + ':' + ((c.querySelector('.bib-busca-livro-quantas') || {}).textContent || '') + ':' + c.querySelector('button').textContent),
      livrosVazio: ((secao('livros') || document).querySelector('.bib-assunto-vazio') || {}).textContent || '',
      fontes: [...p.querySelectorAll('[data-secao="teoria"] [data-fonte]')].map(f => f.dataset.fonte),
      obmep: secao('obmep') ? [...secao('obmep').querySelectorAll('[data-fonte]')].map(f => f.querySelector('.detalhe').textContent) : null,
      enem: secao('enem') ? [...secao('enem').querySelectorAll('[data-fonte]')].map(f => f.querySelector('.detalhe').textContent) : null,
      vizinhos: [...p.querySelectorAll('[data-secao="vizinhos"] [data-assunto]')].map(b => b.dataset.assunto),
      campo: document.querySelector('#busca-biblioteca').value,
      livrosDaEstante: vis('#bib-livros'), topo: vis('#bib-exercicios-cabeca') || vis('#bib-carrinho'),
      // a página é o começo do miolo (a linha de andamento do índice, se aparecer, fica acima e não conta)
      alto: Math.round(p.getBoundingClientRect().top - document.querySelector('#bib-corpo').getBoundingClientRect().top) };
  });
  const pg = await esperar('a página do assunto', lerPagina, v => !!v && v.id === 'MAT09-07', 10000);
  const P = pg.valor || {};
  console.log('   página: ' + JSON.stringify(P));
  conf('a página abre com o caminho (matéria, ano e tema) e o título do assunto', P.titulo + ' | ' + /^Matemática› 9º ano› /.test(P.caminho.replace(/\s+›/g, '›').replace(/›\s+/g, '› ')), 'Teorema de Pitágoras | true');
  conf('"Também aparece como" traz o nome do capítulo no mapa', /Pitágoras e aplicações/.test(P.tambem), true);
  conf('"Nos livros" traz o capítulo ligado, com a faixa de páginas (1 vínculo, como na busca)', (P.livros || []).join(','), 'b1-livro:Pitágoras e aplicações:p. 2 a 3:Abrir');
  conf('"Teoria e exercícios" traz as fontes do módulo do assunto', (P.fontes || []).length > 0, true);
  conf('o bloco OBMEP aparece com as questões ligadas, e diz quantas são de quantas', !!P.obmep && P.obmep.length > 0 &&
    P.obmep.every(d => /^(\d+ questões?|\d+ questões? ligadas?, numa lista de \d+) · /.test(d)), true);
  conf('a questão do ENEM fica no bloco ENEM, e não no da OBMEP', !!P.enem && P.enem.length === 1 && /^1 questão ligada, numa lista de \d+ · /.test(P.enem[0]), true);
  conf('os vizinhos são do mesmo tema e ano, e não o próprio assunto', (P.vizinhos || []).length > 0 && (P.vizinhos || []).every(v => /^MAT09-/.test(v) && v !== 'MAT09-07'), true);
  conf('a busca deu lugar à página; a estante, o topo dos exercícios e a faixa saem, e a página começa no alto',
    P.campo + '|' + P.livrosDaEstante + '|' + P.topo + '|' + (P.alto <= 2), '|false|false|true');
  // a trava de transbordo da página: tablet de pé e deitado, celular, e a letra a 130% a 360 px
  for (const [w, h, css] of [[1280, 800, ''], [800, 1280, ''], [412, 915, ''], [360, 800, LETRA_130]]) {
    await pag.setViewport({ width: w, height: h, hasTouch: true, deviceScaleFactor: 1 });
    await letra(pag, css);
    await pausa(300);
    const ruins = await medir(pag, '#bib-corpo');
    conf('a página do assunto a ' + w + 'x' + h + (css ? ' com a letra a 130%' : '') + ' não transborda', ruins.join('; '), '');
    if (PRINTS && !css) await pag.screenshot({ path: path.join(PRINTS, 'b1-pagina-do-assunto-' + w + 'x' + h + '.png') });
    await letra(pag, '');
  }
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true, deviceScaleFactor: 1 });
  await pausa(300);
  conf('abrir a página do assunto não grava nada', (await fotoB1()) === bancoB1, true);
  // Abrir leva ao começo do capítulo no livro
  await pag.evaluate(() => document.querySelector('#bib-corpo [data-secao="livros"] .bib-assunto-livro[data-livro="b1-livro"] .bib-assunto-abrir').click());
  const leitorB1 = await esperar('o capítulo abre na página 2', () => pag.evaluate(() =>
    (document.querySelector('#modal-leitor-pdf.aberto') && document.querySelector('#corpo-modal-leitor-pdf').dataset.paginaDesenhada) || ''), v => v === '2', 15000);
  conf('"Abrir" leva ao começo do capítulo (p. 2)', leitorB1.valor, '2');
  await fecharModal(pag, 'modal-leitor-pdf');
  // o Voltar do aparelho (o history.back do Android, #179) volta à página do assunto depois de abrir uma fonte dela
  await pausa(600);
  await clicar(pag, '#bib-corpo [data-secao="teoria"] [data-fonte^="teoria:"]');
  const naTeoria = await esperar('a teoria aberta pela página', () => pag.evaluate(() =>
    !document.querySelector('#bib-corpo .bib-assunto') && !!document.querySelector('#bib-corpo .bib-titulo')), v => v, 10000);
  conf('a teoria abre a partir da página do assunto', naTeoria.ok, true);
  await pausa(700);
  await pag.evaluate(() => history.back());
  const deVolta = await esperar('a página do assunto de volta', lerPagina, v => !!v && v.id === 'MAT09-07', 10000);
  conf('o Voltar do aparelho, numa teoria aberta pela página, volta à página do assunto', deVolta.ok, true);
  await pausa(600);
  // um vizinho abre a página dele; o Voltar devolve a busca como estava
  const vizinho = (P.vizinhos || [])[0];
  if (vizinho) {
    await clicar(pag, '#bib-corpo [data-secao="vizinhos"] [data-assunto="' + vizinho + '"]');
    const pv = await esperar('a página do vizinho', lerPagina, v => !!v && v.id === vizinho, 10000);
    conf('o vizinho abre a página dele', pv.ok, true);
    conf('sem livro mapeado, "Nos livros" diz isso numa linha (ou mostra os capítulos)',
      !!pv.valor && (pv.valor.livros.length > 0 || /^Sem livro mapeado para o 9º ano neste tablet\.$/.test(pv.valor.livrosVazio)), true);
  }
  await clicar(pag, '#bib-corpo .bib-assunto .bib-voltar');
  const volta = await esperar('a busca de volta', () => pag.evaluate(() => ({ campo: document.querySelector('#busca-biblioteca').value,
    pagina: !!document.querySelector('#bib-corpo .bib-assunto') })), v => !!v && v.campo === 'pitagoras' && !v.pagina, 10000);
  conf('o Voltar da página devolve a busca "pitagoras"', volta.ok, true);

  /* A PÁGINA NÃO PRENDE A NAVEGAÇÃO (revisão cega do #192). Com a página
   * aberta: o Limpar de uma busca nova não a ressuscita; o Material da aula
   * leva ao módulo, e o Voltar do módulo à lista da série, e não à página.
   * O veneno --envenenado-pagina-presa faz a navegação não sair da página. */
  const naPagina = () => pag.evaluate(() => !!document.querySelector('#bib-corpo .bib-assunto'));
  const presa = {};
  await esperar('o bloco Assuntos de "pitagoras"', lerAssuntos, v => !!v && v.some(x => /^MAT09-07=/.test(x)), 10000);
  await pag.evaluate(() => document.querySelector('#bib-assuntos-da-busca [data-assunto="MAT09-07"]').click());
  await esperar('a página do assunto', lerPagina, v => !!v && v.id === 'MAT09-07', 10000);
  await digitarB1('equacao');
  await pausa(700);
  await clicar(pag, '#limpar-busca-biblioteca');
  await pausa(900);
  presa.limpar = await naPagina();
  if (!VENENO_PAGINA_PRESA) conf('o Limpar de uma busca feita sobre a página não ressuscita a página', presa.limpar, false);
  await digitarB1('pitagoras');
  await esperar('o bloco Assuntos de "pitagoras"', lerAssuntos, v => !!v && v.some(x => /^MAT09-07=/.test(x)), 10000);
  await pag.evaluate(() => document.querySelector('#bib-assuntos-da-busca [data-assunto="MAT09-07"]').click());
  await esperar('a página do assunto', lerPagina, v => !!v && v.id === 'MAT09-07', 10000);
  conf('a aula de hoje abriu, com a página do assunto aberta na Biblioteca', await abrirAulaDeHoje(pag, '10:00'), true);
  const material2 = await esperar('o botão Material do assunto', () => pag.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#corpo-modal-aula .item-assunto-aula button')).find(x => x.textContent.trim() === 'Material');
    if (!b) return false; b.click(); return true;
  }), v => v === true, 10000);
  conf('o Material do assunto foi tocado', material2.ok, true);
  const modMaterial = await esperar('o módulo do Material', () => pag.evaluate(() => (document.querySelector('#bib-corpo .bib-titulo') || {}).textContent || ''),
    v => v === 'Equações do Segundo Grau', 10000);
  conf('o Material da aula, depois da página do assunto, abre o módulo do assunto da aula', modMaterial.valor, 'Equações do Segundo Grau');
  await clicar(pag, '#bib-corpo .bib-voltar');
  await pausa(700);
  presa.voltarDoModulo = await naPagina();
  if (!VENENO_PAGINA_PRESA) conf('o Voltar do módulo vai à lista da série, e não à página do assunto de antes', presa.voltarDoModulo, false);
  if (VENENO_PAGINA_PRESA) {
    secao('VENENO: a página do assunto presa');
    conf('envenenado-pagina-presa: a página voltou no Limpar ou no Voltar do módulo (defeito detectado)', presa.limpar || presa.voltarDoModulo, true);
    console.log('VENENO visto: a página do assunto ' + (presa.limpar ? 'voltou no Limpar' : 'voltou no Voltar do módulo'));
    await H.fim(amb)();
    return;
  }
  // um termo que não casa assunto nenhum não mostra o bloco
  await digitarB1('zqxjkw');
  await pausa(900);
  conf('um termo que não casa assunto nenhum não mostra o bloco Assuntos', await pag.evaluate(() => {
    const c = document.querySelector('#bib-assuntos-da-busca'); return !c || c.hidden;
  }), true);
  await digitarB1('');
  await pausa(400);

  conf('nenhum erro de página', errosDePagina.join(' | '), '');
  await H.fim(amb)();
})().catch(H.fim(amb));
