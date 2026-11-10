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
 *   2. com os livros, a aba diz quantos livros e disciplinas há, lista as
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
 *
 * Veneno:
 *   node _teste/testa_biblioteca_livros_tela.js --envenenado-capitulo-abre-pagina-errada
 *     o app.js servido abre todo capítulo do sumário na página 1: o toque no
 *     capítulo 2 tem de abrir na 1, e a prova TEM de ver ("VENENO visto").
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
const VENENOS = ['--envenenado-capitulo-abre-pagina-errada'];
const VENENO_PAGINA = process.argv.indexOf('--envenenado-capitulo-abre-pagina-errada') !== -1;
const iPrints = process.argv.indexOf('--prints');
const PRINTS = iPrints > 0 ? process.argv[iPrints + 1] : null;
const PYTHON = process.env.PYTHON || 'python';

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const ANCORA_PAGINA = 'return abrirLivro(l.id, { pagina: paginaDoArquivo(l.meta, e) });';
const trocas = {};
if (VENENO_PAGINA) trocas['/app.js'] = APP.split(ANCORA_PAGINA).join('return abrirLivro(l.id, { pagina: 1 });');

const amb = H.criarAmbiente(PORTA, 'perfil_biblioteca_livros_tela', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'b2_livros_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

const LETRA_130 = 'html{font-size:130%} body{font-size:20.8px}';
const letra = (pag, css) => pag.evaluate(c => {
  const v = document.querySelector('#prova-letra'); if (v) v.remove();
  if (c) { const s = document.createElement('style'); s.id = 'prova-letra'; s.textContent = c; document.head.appendChild(s); }
}, css);

function gerarLivros() {
  const r = spawnSync(PYTHON, ['-X', 'utf8', path.join(H.RAIZ, 'biblioteca', '_amostra', 'fazer_amostra_livros.py'), TMP, '--pacote'],
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
  if (/[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{5,}/.test(caixa.innerText)) ruins.push('caixa alta no texto');
  return ruins;
}, raiz);

(async () => {
  secao('0. A prova se confere');
  conf('a lista de venenos não está vazia', VENENOS.length > 0, true);
  conf('a âncora do veneno (o capítulo abre na página do arquivo) aparece uma vez só no app.js', APP.split(ANCORA_PAGINA).length - 1, 1);
  if (VENENO_PAGINA) conf('o app.js servido está envenenado', trocas['/app.js'].indexOf(ANCORA_PAGINA) === -1, true);
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
  conf('a contagem diz livros e disciplinas', s.contagem, '4 livros, 2 disciplinas');
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
  conf('a página aberta está desenhada', continuo.pagina3, true);
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
  await esperar('a tela do livro com a posição nova', () => lerLivro(pag), v => v.visivel && /p\. 3/.test(v.continuar), 5000);
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

  conf('nenhum erro de página', errosDePagina.join(' | '), '');
  await H.fim(amb)();
})().catch(H.fim(amb));
