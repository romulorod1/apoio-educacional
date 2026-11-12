/* testa_livros_indice.js
 *
 * B12: o motor do índice de texto dos livros (indice-livros.js). O pacote é
 * SINTÉTICO, gerado na hora (biblioteca/_amostra/fazer_amostra_livros.py
 * --indice): quatro livros de prova, nenhum livro comercial.
 *   Livro A curto     PDF de 6 páginas, 3 capítulos; a página 3 diz
 *                     "FRAÇÕES EQUIVALENTES", a 5 "A mediana é o valor
 *                     central", a 6 não tem texto nenhum;
 *   Livro B longo     PDF de 600 páginas, 2 partes; só a 200 diz
 *                     "paralelepípedo". É nele que a prova interrompe;
 *   Livro C sem texto PDF de 3 páginas só com desenho (o escaneado sem OCR);
 *   Livro D em EPUB   o EPUB de prova, 3 capítulos.
 *
 * O que se prova:
 *   1. o pacote importa por Ajustes e o índice começa sozinho, num Worker, com
 *      a linha "Preparando a busca: N de 4 livros" na Biblioteca, e a tela
 *      segue respondendo enquanto ele lê;
 *   2. a INTERRUPÇÃO: o aplicativo recarrega no meio do Livro B; na volta, o
 *      Livro A (pronto) não é lido de novo, e o B continua de onde parou;
 *   3. a consulta (buscarNosLivros) acha o termo sem acento e sem caixa, na
 *      página certa do arquivo, agrupado pelo capítulo do sumário; o EPUB
 *      responde pela parte; o filtro de ano e de disciplina vale;
 *   4. a página sem texto é contada (1 no A, 3 no C), e a linha some no fim;
 *   5. a cópia de segurança não contém o índice, e restaurá-la não o apaga;
 *   6. o banco principal segue na versão 6, com os dados da prova, abre com
 *      indexedDB.open(nome, 6) sem VersionError, e o store.js do commit pai
 *      (origin/main) lê os dados depois desta versão;
 *   7. o índice apagado à mão e o índice corrompido se refazem sozinhos, sem
 *      erro de página;
 *   8. o leitor de PDF aberto pausa o índice, que volta quando ele fecha;
 *   9. o PDF que não é PDF e o com senha saem como não lidos (permanente);
 *      o Worker que morre sem aviso no meio de um livro é falha PASSAGEIRA:
 *      a fila segue, e o livro termina na abertura seguinte; a consulta lista
 *      os não lidos mesmo sem acerto, e a busca não trava a tela;
 *      uma página (parte do EPUB) que SEMPRE falha de forma passageira sai
 *      sozinha, contada entre as não lidas, e o livro fica na busca;
 *  10. livro removido e livro trocado no meio da leitura;
 *  11. duas janelas abertas: a trava deixa uma só ler cada página;
 *  12. sem espaço (simulado pelo estimate): o índice não começa, sai e não
 *      insiste na abertura seguinte;
 *  13. o "Apagar tudo" com o Worker no meio de um livro e outra janela
 *      segurando o índice: o apagar termina, o principal fica vazio, e o
 *      índice some quando a outra janela fecha;
 *  14. nenhum erro de página.
 *
 * Modos envenenados (cada um serve um arquivo do app com o defeito, e a prova
 * TEM de ver o defeito: "VENENO visto"):
 *   --envenenado-indice-na-copia  o store.js servido põe as páginas do
 *                                 índice na cópia de segurança;
 *   --envenenado-refaz-indexado   o indice-livros.js servido refaz o livro
 *                                 pronto (decidir não reconhece o pronto);
 *   --envenenado-com-acento       a normalização não tira o acento: "fracoes"
 *                                 não acha "Frações";
 *   --envenenado-erro-vira-pronto todo erro conta como do arquivo: o livro
 *                                 cujo Worker morreu sai da leitura;
 *   --envenenado-apagar-espera-indice  o "Apagar tudo" espera a remoção do
 *                                 banco do índice, sem prazo: com outra
 *                                 janela segurando a conexão, não termina;
 *   --envenenado-pagina-ruim-derruba-livro  a página que sempre falha relança
 *                                 o erro, e o livro inteiro fica fora da busca;
 *   --envenenado-busca-sem-capitulos  o app.js servido não procura nos
 *                                 capítulos e assuntos do mapa: o livro
 *                                 escaneado some da busca (seção 3.2).
 *
 * Porta 8898. Relógio fixo da rodada (relogioDaRodada).
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');
const H = require('./_bib_navegador');
const { conf, secao, esperar, pausa } = H;

const PORTA = 8898;
const VENENOS = ['--envenenado-indice-na-copia', '--envenenado-refaz-indexado', '--envenenado-com-acento',
  '--envenenado-erro-vira-pronto', '--envenenado-apagar-espera-indice', '--envenenado-pagina-ruim-derruba-livro',
  '--envenenado-busca-sem-capitulos'];
const MODO = VENENOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const PYTHON = process.env.PYTHON || 'python';
const relogio = H.relogioDaRodada('2026-11-16', '10:00');

/* A regra que o veneno quebra: no modo normal ela tem de valer; no modo do
 * veneno dela, ela tem de QUEBRAR, e isso é o "VENENO visto". A rodada
 * envenenada termina ali: o que vem depois depende da regra quebrada (sem o
 * acento tirado, toda busca seguinte erra), e conferir o estrago em cascata
 * não diz nada novo. Veneno que NÃO aparece conta como falha e reprova. */
function prop(rotulo, ok, veneno) {
  if (MODO && MODO === veneno) {
    conf('VENENO visto: ' + rotulo + ', e quebrou', ok, false);
    throw Object.assign(new Error('fim da rodada envenenada'), { fimDoVeneno: true });
  }
  return conf(rotulo, ok, true);
}

const STORE = fs.readFileSync(path.join(H.RAIZ, 'store.js'), 'utf8');
const INDICE = fs.readFileSync(path.join(H.RAIZ, 'indice-livros.js'), 'utf8');
const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');

// as âncoras dos venenos: cada uma tem de aparecer exatamente uma vez
const COPIA_FECHA = /pacote\.biblioteca = \{ uso: \(bib\[0\] \|\| \[\]\)\.filter\(function \(r\) \{\r?\n        return idsAlunos\[r\.alunoId\] && idsAulas\[r\.aulaId\];\r?\n      \}\), etiquetas: bib\[1\] \|\| \[\], listas: bib\[2\] \|\| \[\] \};\r?\n      return pacote;/g;
const COPIA_COM_INDICE = "pacote.biblioteca = { uso: bib[0] || [], etiquetas: bib[1] || [], listas: bib[2] || [] };\n" +
  "      return new Promise(function (ok) { try { var q = indexedDB.open('indice-livros', 1); q.onsuccess = function () { var b = q.result; " +
  "try { var g = b.transaction('paginas').objectStore('paginas').getAll(); g.onsuccess = function () { b.close(); pacote.indiceLivros = g.result; ok(pacote); }; " +
  "g.onerror = function () { b.close(); ok(pacote); }; } catch (e) { b.close(); ok(pacote); } }; q.onerror = function () { ok(pacote); }; } catch (e) { ok(pacote); } });";
const PRONTO = "if (reg.pronto) return 'pronto';";
// a revisão do B12: a falha passageira não pode tirar o livro da leitura; o veneno trata todo erro como do arquivo
const PERMANENTE = 'function falhaPermanente(e) {';
// e a página que sempre falha não derruba o livro; o veneno relança o erro da página, como antes
const PAGINA_RUIM = "if (++tentativa >= TENTATIVAS_POR_PAGINA) return { texto: '', ilegivel: true };";
// e o "Apagar tudo" não espera o banco do índice; o veneno volta a esperar, sem prazo
const APAGA_SEM_ESPERAR = /      indiceDosLivros\('apagar'\);\r?\n      return r;/g;
const APAGA_ESPERANDO = "      return new Promise(function (ok) { var q = indexedDB.deleteDatabase('indice-livros'); " +
  "q.onsuccess = function () { ok(r); }; q.onerror = function () { ok(r); }; });";
const SEM_ACENTO = ".replace(/[\\u0300-\\u036f]/g, '')";
// 12/11/2026: a busca procura também nos capítulos e assuntos do mapa; o veneno desliga isso
const BUSCA_NOS_CAPITULOS = 'return Biblioteca.procurarNosCapitulos(indiceDosCapitulosDaBiblioteca(), termo, normalizadorDaBusca());';

secao('0. As âncoras e os venenos');
conf('a lista de venenos não está vazia', VENENOS.length > 0, true);
conf('a âncora da cópia (exportarTudo fecha o pacote) aparece uma vez no store.js', (STORE.match(COPIA_FECHA) || []).length, 1);
conf('a âncora do livro pronto (decidir) aparece uma vez no indice-livros.js', INDICE.split(PRONTO).length - 1, 1);
conf('a âncora do acento (normalizar) aparece uma vez no indice-livros.js', INDICE.split(SEM_ACENTO).length - 1, 1);
conf('a âncora da falha permanente aparece uma vez no indice-livros.js', INDICE.split(PERMANENTE).length - 1, 1);
conf('a âncora da página ruim aparece uma vez no indice-livros.js', INDICE.split(PAGINA_RUIM).length - 1, 1);
conf('a âncora do apagar sem esperar o índice aparece uma vez no store.js', (STORE.match(APAGA_SEM_ESPERAR) || []).length, 1);
conf('a âncora da busca nos capítulos aparece uma vez no app.js', APP.split(BUSCA_NOS_CAPITULOS).length - 1, 1);
conf('o banco principal continua na versão 6 no store.js', /var VERSAO_BANCO = 6;/.test(STORE), true);

const trocas = {};
if (MODO === '--envenenado-indice-na-copia') trocas['/store.js'] = STORE.replace(COPIA_FECHA, COPIA_COM_INDICE);
if (MODO === '--envenenado-refaz-indexado') trocas['/indice-livros.js'] = INDICE.split(PRONTO).join("if (reg.pronto) return 'refazer';");
if (MODO === '--envenenado-com-acento') trocas['/indice-livros.js'] = INDICE.split(SEM_ACENTO).join('');
if (MODO === '--envenenado-pagina-ruim-derruba-livro') trocas['/indice-livros.js'] = INDICE.split(PAGINA_RUIM).join('if (++tentativa >= TENTATIVAS_POR_PAGINA) throw e;');
if (MODO === '--envenenado-erro-vira-pronto') trocas['/indice-livros.js'] = INDICE.split(PERMANENTE).join(PERMANENTE + ' return true;');
if (MODO === '--envenenado-apagar-espera-indice') trocas['/store.js'] = STORE.replace(APAGA_SEM_ESPERAR, APAGA_ESPERANDO);
if (MODO === '--envenenado-busca-sem-capitulos') trocas['/app.js'] = APP.split(BUSCA_NOS_CAPITULOS).join('return [];');
if (MODO) {
  const servido = trocas['/store.js'] || trocas['/indice-livros.js'] || trocas['/app.js'];
  const original = trocas['/store.js'] ? STORE : trocas['/indice-livros.js'] ? INDICE : APP;
  conf('o arquivo servido ficou diferente do repositório (' + MODO + ')', !!servido && servido !== original, true);
}

/* O código de ANTES desta versão: o store.js do commit pai (origin/main, ou
 * a base do ramo), servido numa página à parte para ler o banco. */
function storeDoPai() {
  for (const ref of ['origin/main', 'HEAD~1']) {
    try {
      const base = execFileSync('git', ['merge-base', 'HEAD', ref], { cwd: H.RAIZ, encoding: 'utf8' }).trim();
      const txt = execFileSync('git', ['show', base + ':store.js'], { cwd: H.RAIZ, encoding: 'utf8', maxBuffer: 1 << 26 });
      if (txt) return { ref: ref + ' (' + base.slice(0, 7) + ')', txt };
    } catch (e) { /* tenta a próxima */ }
  }
  return null;
}
const PAI = storeDoPai();

const amb = H.criarAmbiente(PORTA, 'nath_b12_indice', trocas);
amb.extras['/vazio-b12.html'] = { tipo: 'text/html; charset=utf-8', corpo: '<!doctype html><meta charset="utf-8"><title>vazio</title>' };
if (PAI) amb.extras['/store-pai-b12.js'] = { tipo: 'application/javascript; charset=utf-8', corpo: PAI.txt };

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'b12_indice_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

function gerarPacote() {
  const r = spawnSync(PYTHON, ['-X', 'utf8', path.join(H.RAIZ, 'biblioteca', '_amostra', 'fazer_amostra_livros.py'), TMP, '--indice'],
    { encoding: 'utf8' });
  const linhas = String(r.stdout || '').trim().split(/\r?\n/);
  const zip = linhas[linhas.length - 1];
  if (r.status !== 0 || !zip || !fs.existsSync(zip)) { console.log(String(r.stderr || '').slice(0, 800)); return null; }
  return zip;
}

const estado = pag => pag.evaluate(() => (window.IndiceLivros ? IndiceLivros.estado() : null));
const linhaDeProgresso = pag => pag.evaluate(() => {
  const l = document.querySelector('#indice-livros-progresso');
  return l ? { visivel: !l.hidden && l.offsetParent !== null, oculta: l.hidden, texto: l.textContent,
    transborda: l.scrollWidth > l.clientWidth + 1 } : null;
});
const registrosDoIndice = pag => pag.evaluate(() => new Promise(r => {
  const q = indexedDB.open('indice-livros', 1);
  q.onupgradeneeded = () => { q.transaction.abort(); };
  q.onsuccess = () => {
    const b = q.result;
    if (!b.objectStoreNames.contains('livros')) { b.close(); r(null); return; }
    const t = b.transaction(['livros', 'paginas'], 'readonly');
    const saida = { livros: {}, paginas: 0, porLivro: {} };
    t.objectStore('livros').getAll().onsuccess = e => { e.target.result.forEach(x => { saida.livros[x.id] = x; }); };
    t.objectStore('paginas').getAll().onsuccess = e => {
      saida.paginas = e.target.result.length;
      e.target.result.forEach(p => { saida.porLivro[p.id] = (saida.porLivro[p.id] || 0) + 1; });
    };
    t.oncomplete = () => { b.close(); r(saida); };
    t.onerror = () => { b.close(); r(null); };
  };
  q.onerror = () => r(null);
}));
const bancosAbertos = pag => pag.evaluate(() => indexedDB.databases().then(l => l.map(d => d.name + '@' + d.version).sort()));
const tudoPronto = v => !!v && v.total === 4 && v.prontos === 4 && !v.rodando && v.fila.length === 0;
const parado = (total, prontos) => v => !!v && v.total === total && v.prontos === prontos && !v.rodando && v.fila.length === 0;
/* Grava livros direto no banco principal (o caminho da importação, sem o
 * pacote): os PDFs de prova servidos pelo servidor da rodada. */
const gravarLivros = (pag, pacote, livros) => pag.evaluate((pc, ls) => Promise.all(ls.map(l => fetch(l.url).then(r => r.blob())
  .then(blob => ({ meta: Object.assign({ formato: 'pdf', sumario: [], series: ['08'], materia: 'matematica' }, l.meta), blob }))))
  .then(lista => Store.gravarLivros({ manifest: { pacote: pc, versao: 1 }, livros: lista })).then(() => IndiceLivros.sincronizar()), pacote, livros);
const apagarIndiceAMao = pag => pag.evaluate(() => new Promise(r => {
  const q = indexedDB.deleteDatabase('indice-livros');
  q.onsuccess = () => r('apagou'); q.onerror = () => r('erro');
}));
const buscar = (pag, termo, filtros) => pag.evaluate((t, f) => buscarNosLivros(t, f), termo, filtros || {});

/* Uma página numa JANELA à parte: uma aba nova na mesma janela põe a
 * primeira em segundo plano, e o índice dela para de ler. */
async function novaJanela(pag) {
  const nav = pag.browser();
  const antes = new Set(nav.targets());
  const cdpNav = await nav.target().createCDPSession();
  await cdpNav.send('Target.createTarget', { url: 'about:blank', newWindow: true });
  const alvo = await nav.waitForTarget(t => t.type() === 'page' && !antes.has(t));
  const nova = await alvo.page();
  nova.setDefaultTimeout(60000);
  nova.errosDePagina = [];
  nova.on('pageerror', e => nova.errosDePagina.push(e.message));
  nova.on('dialog', async d => { try { await d.accept(); } catch (e) { /* ok */ } });
  return nova;
}

async function importar(pag, arquivo) {
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => { document.querySelector('#estado-importacao-biblioteca').innerHTML = ''; });
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar('a importação do pacote de livros', () => Promise.all([
    pag.$eval('#estado-importacao-biblioteca', c => c.innerText.trim()), pag.$eval('#importar-biblioteca', b => b.disabled)]),
  v => !!v && !!v[0] && !/Conferindo|Gravando/.test(v[0]) && v[1] === false, 60000);
  return (r.valor && r.valor[0]) || '';
}

(async () => {
  const zip = gerarPacote();
  conf('o pacote sintético do índice foi gerado', !!zip, true);
  if (!zip) throw Object.assign(new Error('sem pacote'), { jaContado: true });

  // os PDFs de prova servidos à parte (as seções de falha gravam livros sem pacote)
  const raizIndice = path.join(TMP, 'Indice', 'matematica');
  amb.extras['/b12-longo.pdf'] = { tipo: 'application/pdf', corpo: fs.readFileSync(path.join(raizIndice, 'indice-longo.pdf')) };
  amb.extras['/b12-curto.pdf'] = { tipo: 'application/pdf', corpo: fs.readFileSync(path.join(raizIndice, 'indice-curto.pdf')) };
  amb.extras['/b12-corrompido.pdf'] = { tipo: 'application/pdf', corpo: Buffer.from('%PDF-1.7\n' + 'isto não é um PDF de verdade. '.repeat(80)) };
  const senha = path.join(TMP, 'com-senha.pdf');
  const rs = spawnSync(PYTHON, ['-X', 'utf8', '-c', 'import sys, pymupdf\nd = pymupdf.open()\np = d.new_page()\n' +
    'p.insert_text((72, 90), "Livro com senha: mediana trancada.")\n' +
    'd.save(sys.argv[1], encryption=pymupdf.PDF_ENCRYPT_AES_256, user_pw="segredo", owner_pw="dono")', senha], { encoding: 'utf8' });
  conf('o PDF com senha foi gerado', rs.status === 0 && fs.existsSync(senha), true);
  const enorme = path.join(TMP, 'enorme.pdf');
  spawnSync(PYTHON, ['-X', 'utf8', '-c', 'import sys, pymupdf\nd = pymupdf.open()\nfor n in range(2400):\n' +
    '    d.new_page().insert_text((72, 90), "Livro enorme, pagina %d." % (n + 1))\nd.save(sys.argv[1], garbage=3, deflate=True)', enorme], { encoding: 'utf8' });
  conf('o PDF enorme foi gerado', fs.existsSync(enorme), true);
  amb.extras['/b12-enorme.pdf'] = { tipo: 'application/pdf', corpo: fs.existsSync(enorme) ? fs.readFileSync(enorme) : Buffer.from('') };
  amb.extras['/b12-senha.pdf'] = { tipo: 'application/pdf', corpo: fs.existsSync(senha) ? fs.readFileSync(senha) : Buffer.from('') };

  await amb.subir();
  const pag = await amb.pagina();
  await relogio.naPagina(pag);
  // prazos curtos para a prova: o Worker calado por 8 s conta como morto
  await pag.evaluateOnNewDocument(() => { window.INDICE_LIVROS_CONFIG = { semNoticiaMs: 8000 }; });
  /* O tablet sem espaço, simulado: com a marca da prova, o estimate da página
   * diz que sobram só 20 MB (o override de cota do Chrome pelo protocolo não
   * muda o que o estimate responde, medido nesta máquina). */
  await pag.evaluateOnNewDocument(() => {
    try {
      if (localStorage.getItem('b12-cota-baixa') && navigator.storage && navigator.storage.estimate) {
        const original = navigator.storage.estimate.bind(navigator.storage);
        navigator.storage.estimate = () => original().then(e => Object.assign({}, e, { quota: (e.usage || 0) + 20 * 1048576 }));
      }
    } catch (e) { /* sem marca */ }
  });
  await H.abrirApp(pag, amb.ORIGEM);

  secao('1. Os dados da prova e a importação');
  await pag.evaluate(() => Store.carregar().then(d => {
    d.alunos.push({ id: 'b12-alfa', nome: 'Aluno Alfa Teste', ativo: true, precos: [] });
    d.alunos.push({ id: 'b12-beta', nome: 'Aluno Beta Teste', ativo: true, precos: [] });
    return Store.salvar(d);
  }));
  await H.abrirApp(pag, amb.ORIGEM);
  const ALUNOS = await pag.evaluate(() => Store.carregar().then(d => d.alunos.map(x => x.nome).sort().join(',')));
  conf('os dois alunos de teste estão no banco principal', /Aluno Alfa Teste,Aluno Beta Teste/.test(ALUNOS), true);

  /* A interrupção, dentro da página: quando o Livro B passa da página 30, a
   * prova finge o aplicativo em segundo plano (o mesmo visibilitychange que o
   * tablet dispara), e o índice tem de parar depois da página que lia. Antes,
   * mede a maior espera da tela enquanto o Worker lê. */
  await pag.evaluate(() => {
    window.__b12 = { atraso: null, escondeuEm: null };
    let medindo = false;
    IndiceLivros.aoMudar(e => {
      if (!medindo && e.rodando && e.pagina) {
        medindo = true;
        let maior = 0, ultimo = performance.now(), n = 0;
        (function volta() {
          const agora = performance.now(); maior = Math.max(maior, agora - ultimo); ultimo = agora;
          if (++n < 40) setTimeout(volta, 20); else window.__b12.atraso = Math.round(maior);
        })();
      }
      if (window.__b12.escondeuEm === null && e.livro === 'indice-longo' && e.pagina >= 30) {
        window.__b12.escondeuEm = e.pagina;
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
        document.dispatchEvent(new Event('visibilitychange'));
      }
    });
  });

  const msg = await importar(pag, zip);
  conf('o pacote de livros entrou', /Livros importados/.test(msg), true);
  await H.irParaAba(pag, 'biblioteca');

  // a linha aparece com o trabalho andando
  const vistaLinha = await esperar('a linha de progresso aparece na Biblioteca', () => linhaDeProgresso(pag),
    v => !!v && v.visivel && /^Preparando a busca: \d de 4 livros$/.test(v.texto), 20000);
  conf('a linha diz "Preparando a busca: N de 4 livros"', vistaLinha.ok, true);
  conf('a linha não transborda', vistaLinha.valor && vistaLinha.valor.transborda, false);
  conf('a linha não está em caixa alta', vistaLinha.valor && vistaLinha.valor.texto !== String(vistaLinha.valor.texto).toUpperCase(), true);

  secao('2. A interrupção no meio do Livro B');
  const parou = await esperar('o índice parar em segundo plano no meio do Livro B', () => estado(pag),
    v => !!v && v.pausado && !v.rodando, 60000);
  conf('o índice parou quando o aplicativo foi para segundo plano', parou.ok, true);
  const b12 = (await esperar('a medida da tela durante a leitura', () => pag.evaluate(() => window.__b12),
    v => !!v && v.atraso !== null, 10000)).valor || {};
  console.log('   maior espera da tela durante a leitura: ' + b12.atraso + ' ms; segundo plano na página ' + b12.escondeuEm + ' do Livro B');
  conf('a tela responde enquanto o índice lê (maior espera abaixo de 250 ms)', b12.atraso !== null && b12.atraso < 250, true);
  // a trava de transbordo da linha (PRINCIPIOS): 360, 390 e 412 px, com a fonte a 130%
  for (const largura of [360, 390, 412]) {
    await pag.setViewport({ width: largura, height: 800, hasTouch: true });
    const medida = await pag.evaluate(() => {
      document.documentElement.style.fontSize = '130%';
      const l = document.querySelector('#indice-livros-progresso');
      const r = l.getBoundingClientRect();
      const m = { visivel: !l.hidden, transborda: l.scrollWidth > l.clientWidth + 1, foraDaTela: r.right > window.innerWidth + 1,
        rolagem: document.documentElement.scrollWidth > window.innerWidth + 1 };
      document.documentElement.style.fontSize = '';
      return m;
    });
    conf('a ' + largura + ' px com a fonte a 130%, a linha aparece inteira, sem transbordo nem rolagem para o lado',
      JSON.stringify(medida), JSON.stringify({ visivel: true, transborda: false, foraDaTela: false, rolagem: false }));
  }
  await pag.setViewport({ width: 1280, height: 1000, hasTouch: true });
  const antes = await registrosDoIndice(pag);
  await pausa(1000);
  const antes2 = await registrosDoIndice(pag);
  const bAntes = antes && antes.livros['indice-longo'];
  console.log('   antes de recarregar: Livro B em ' + (bAntes ? bAntes.proxima : '?') + ' de ' + (bAntes ? bAntes.total : '?'));
  conf('em segundo plano nenhuma página nova é lida', antes2 && antes2.paginas, antes && antes.paginas);
  conf('o Livro A já estava pronto antes da interrupção', !!(antes && antes.livros['indice-curto'] && antes.livros['indice-curto'].pronto), true);
  conf('o Livro B estava começado e não pronto', !!bAntes && !bAntes.pronto && bAntes.proxima > 30 && bAntes.proxima < 600, true);

  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'biblioteca');
  const fim = await esperar('os quatro livros prontos depois da volta', () => estado(pag), tudoPronto, 120000);
  conf('os quatro livros ficaram prontos', fim.ok, true);
  const lidas = (fim.valor && fim.valor.lidasNaSessao) || {};
  console.log('   páginas lidas depois da volta: ' + JSON.stringify(lidas));
  prop('o Livro A (pronto) não foi lido de novo depois da volta', !lidas['indice-curto'], '--envenenado-refaz-indexado');
  conf('o Livro B continuou de onde parou (leu só as páginas que faltavam)',
    lidas['indice-longo'], 600 - (bAntes ? bAntes.proxima - 1 : 0));
  const depois = await registrosDoIndice(pag);
  conf('o Livro B tem as 600 páginas no índice, sem repetição', depois && depois.porLivro['indice-longo'], 600);

  secao('3. A consulta');
  let r = await buscar(pag, 'fracoes');
  let a = (r.livros || []).find(l => l.id === 'indice-curto');
  prop('"fracoes" (sem acento) acha "Frações" no Livro A',
    !!a && JSON.stringify(a.capitulos.map(c => [c.titulo, c.paginas])) === JSON.stringify([['Capítulo 2: Frações', [3, 4]]]),
    '--envenenado-com-acento');
  r = await buscar(pag, 'FRAÇÕES');
  a = (r.livros || []).find(l => l.id === 'indice-curto');
  conf('"FRAÇÕES" (caixa alta, com acento) acha as páginas 3 e 4 do arquivo', a ? JSON.stringify(a.paginas) : '', '[3,4]');
  r = await buscar(pag, 'Mediana');
  a = (r.livros || []).find(l => l.id === 'indice-curto');
  conf('"Mediana" cai na página 5, no Capítulo 3: Estatística',
    a ? JSON.stringify(a.capitulos.map(c => [c.titulo, c.paginas])) : '', JSON.stringify([['Capítulo 3: Estatística', [5]]]));
  conf('o Livro A diz que 1 página não pôde ser lida', a && a.semTexto, 1);
  r = await buscar(pag, 'paralelepipedo');
  const b = (r.livros || []).find(l => l.id === 'indice-longo');
  conf('"paralelepipedo" cai na página 200 do Livro B, na Parte 2',
    b ? JSON.stringify(b.capitulos.map(c => [c.titulo, c.paginas])) : '', JSON.stringify([['Parte 2: Espaço', [200]]]));
  conf('e só no Livro B', (r.livros || []).map(l => l.id).join(','), 'indice-longo');
  r = await buscar(pag, 'paragrafo 3 do capitulo 2');
  const d = (r.livros || []).find(l => l.id === 'livro-de-prova');
  conf('o EPUB responde pela parte 2, no Capítulo 2: O meio',
    d ? JSON.stringify([d.unidade, d.capitulos.map(c => [c.titulo, c.paginas])]) : '', JSON.stringify(['parte', [['Capítulo 2: O meio', [2]]]]));
  r = await buscar(pag, 'paragrafo', { disciplina: 'literatura' });
  conf('o filtro de disciplina deixa só o livro de literatura', (r.livros || []).map(l => l.id).join(','), 'livro-de-prova');
  r = await buscar(pag, 'mediana', { ano: '08' });
  conf('o filtro de ano 08 acha o Livro A', (r.livros || []).map(l => l.id).join(','), 'indice-curto');
  r = await buscar(pag, 'mediana', { ano: 'em2' });
  conf('o filtro de ano em2 não acha livro de matemática dos anos finais', (r.livros || []).length, 0);
  r = await buscar(pag, 'palavra que não existe');
  conf('termo que não existe não acha nada, sem erro', (r.livros || []).length + '/' + (r.pendentes || []).length, '0/0');

  secao('3.1. A busca na tela da Biblioteca');
  await H.irParaAba(pag, 'biblioteca');
  const campoUnico = await esperar('o campo de busca da Biblioteca', () => pag.evaluate(() => {
    const c = document.querySelector('#busca-biblioteca'), cartao = document.querySelector('#bib-busca-cartao');
    return { visivel: !!cartao && getComputedStyle(cartao).display !== 'none', rotulo: c.getAttribute('aria-label'), campos: document.querySelectorAll('.bibl-busca input').length };
  }), v => !!v && v.visivel, 10000);
  conf('só com livros (sem pacote de exercícios), o campo único aparece e diz que busca nos livros', JSON.stringify(campoUnico.valor),
    JSON.stringify({ visivel: true, rotulo: 'Buscar nos livros', campos: 1 }));
  /* buscar não grava: o banco principal inteiro (livros_posicoes junto)
   * fica idêntico antes e depois de uma busca com resultado */
  const fotoDoBanco = () => pag.evaluate(() => new Promise((res, rej) => {
    const q = indexedDB.open('apoio-educacional');
    q.onerror = () => rej(q.error);
    q.onsuccess = () => {
      const b = q.result, nomes = Array.from(b.objectStoreNames).sort(), saida = {};
      const t = b.transaction(nomes, 'readonly');
      nomes.forEach(n => { const r = t.objectStore(n).getAll(); r.onsuccess = () => { saida[n] = r.result; }; });
      t.oncomplete = () => { b.close(); res(JSON.stringify(saida)); };
      t.onerror = () => rej(t.error);
    };
  }));
  const bancoAntes = await fotoDoBanco();
  await pag.evaluate(() => { const c = document.querySelector('#busca-biblioteca'); c.value = 'mediana'; c.dispatchEvent(new Event('input', { bubbles: true })); });
  await esperar('a busca por "mediana" com resultado', () => pag.evaluate(() =>
    (document.querySelector('#bib-corpo [data-grupo="livros"] .bib-busca-livros-status') || {}).textContent || ''), v => /encontrada/.test(v), 10000);
  await pausa(600);
  const bancoDepois = await fotoDoBanco();
  conf('buscar não grava: o banco principal e livros_posicoes ficam idênticos', bancoDepois === bancoAntes && bancoAntes.indexOf('livros_posicoes') >= 0, true);
  await pag.evaluate(() => {
    const campo = document.querySelector('#busca-biblioteca');
    campo.value = 'FRAÇÕES';
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const telaBusca = await esperar('a tela acha as páginas do livro', () => pag.evaluate(() => ({
    status: document.querySelector('#bib-corpo [data-grupo="livros"] .bib-busca-livros-status').textContent,
    livro: [...document.querySelectorAll('#bib-corpo [data-grupo="livros"] .bib-busca-livros-resultados [data-livro="indice-curto"] .bib-busca-pagina')].map(b => b.getAttribute('aria-label')).join('|'),
    botao: (document.querySelector('#bib-corpo [data-grupo="livros"] .bib-busca-livros-resultados [data-livro="indice-curto"] .bib-busca-pagina') || { getAttribute: () => '' }).getAttribute('aria-label')
  })), v => !!v && (MODO === '--envenenado-busca-sem-capitulos' ? /2 páginas encontradas/ : /^1 capítulo e 2 páginas em 1 livro\./).test(v.status) &&
    v.livro === 'Abrir na p. 3|Abrir na p. 4' && v.botao === 'Abrir na p. 3', 10000);
  // "FRAÇÕES" casa o texto das p. 3 e 4 e o título "Capítulo 2: Frações": o capítulo é um bloco só, marcado das duas formas
  conf('a busca mostra o livro, o capítulo, as páginas e o atalho para a página encontrada', telaBusca.ok, true);
  await pag.setViewport({ width: 360, height: 800, hasTouch: true });
  const larguraBusca = await pag.evaluate(() => {
    document.documentElement.style.fontSize = '130%';
    const caixa = document.querySelector('#bib-corpo [data-grupo="livros"] .bib-busca-livros-resultados [data-livro="indice-curto"]');
    const botao = caixa && caixa.querySelector('.bib-busca-pagina');
    const r = botao && botao.getBoundingClientRect();
    const medida = { rolaDeLado: document.documentElement.scrollWidth > innerWidth + 1,
      botaoFora: !!r && (r.left < 0 || r.right > innerWidth + 1), botaoPequeno: !!r && r.height < 47.5 };
    document.documentElement.style.fontSize = '';
    return medida;
  });
  conf('a busca e a página tocável cabem a 360 px com a letra a 130%', JSON.stringify(larguraBusca), JSON.stringify({ rolaDeLado: false, botaoFora: false, botaoPequeno: false }));
  await pag.setViewport({ width: 1280, height: 1000, hasTouch: true });
  await pag.evaluate(() => document.querySelector('#bib-corpo [data-grupo="livros"] .bib-busca-livros-resultados [data-livro="indice-curto"] .bib-busca-pagina').click());
  const leitorBusca = await esperar('o resultado abre na página 3', () => pag.evaluate(() =>
    document.querySelector('#corpo-modal-leitor-pdf').dataset.paginaDesenhada || ''), v => v === '3', 10000);
  conf('abrir o resultado leva à página encontrada no livro', leitorBusca.ok, true);
  await pag.evaluate(() => document.querySelector('#modal-leitor-pdf [data-fechar]').click());
  await esperar('o leitor da busca fecha', () => pag.evaluate(() => !document.querySelector('#modal-leitor-pdf.aberto')), v => v, 5000);
  // cada página da lista abre o leitor nela: a segunda, a 4
  await pag.evaluate(() => document.querySelector('#bib-corpo [data-grupo="livros"] .bib-busca-livros-resultados [data-livro="indice-curto"] .bib-busca-pagina[data-pagina="4"]').click());
  const leitor4 = await esperar('o toque na página 4 abre nela', () => pag.evaluate(() =>
    document.querySelector('#corpo-modal-leitor-pdf').dataset.paginaDesenhada || ''), v => v === '4', 10000);
  conf('tocar na segunda página da lista abre o leitor nela (4)', leitor4.ok, true);
  await pag.evaluate(() => document.querySelector('#modal-leitor-pdf [data-fechar]').click());
  await esperar('o leitor da página 4 fecha', () => pag.evaluate(() => !document.querySelector('#modal-leitor-pdf.aberto')), v => v, 5000);
  /* a palavra que só existe no texto de um livro (a página 200 do Livro B,
   * de 600): a tela acha, diz a parte e a página, e o toque abre nela; o
   * livro escaneado (C) não aparece, e o aviso diz que há texto que não foi lido */
  await pag.evaluate(() => {
    const campo = document.querySelector('#busca-biblioteca');
    campo.value = 'Paralelepípedo';
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const telaLongo = await esperar('a tela acha a página 200 do Livro B', () => pag.evaluate(() => {
    const caixa = document.querySelector('#bib-corpo [data-grupo="livros"] .bib-busca-livros-resultados [data-livro="indice-longo"]');
    const aviso = document.querySelector('#bib-corpo [data-grupo="livros"] .bib-busca-livros-sem-texto');
    return { status: document.querySelector('#bib-corpo [data-grupo="livros"] .bib-busca-livros-status').textContent,
      livros: [...document.querySelectorAll('#bib-corpo [data-grupo="livros"] .bib-busca-livros-resultados .bib-busca-livro[data-livro]')].map(x => x.dataset.livro).join(','),
      grupo: caixa ? caixa.querySelector('.bib-busca-livro-paginas').textContent : '',
      botao: caixa && caixa.querySelector('.bib-busca-pagina') ? caixa.querySelector('.bib-busca-pagina').getAttribute('aria-label') : '',
      aviso: aviso ? aviso.querySelector('summary').textContent : '', avisoAberto: aviso ? aviso.open : null,
      quais: aviso ? [...aviso.querySelectorAll('li')].map(li => li.dataset.livro + '=' + li.textContent).join('|') : '' };
  }), v => !!v && /1 página encontrada em 1 livro/.test(v.status) && /Abrir na p\. 200/.test(v.botao), 10000);
  conf('só o texto do Livro B tem "paralelepípedo": um livro, a parte e a página 200',
    telaLongo.valor && telaLongo.valor.livros + ' | ' + /Parte 2/.test(telaLongo.valor.grupo) + ' | ' + /1 página$/.test(telaLongo.valor.grupo) + ' | ' + telaLongo.valor.botao, 'indice-longo | true | true | Abrir na p. 200');
  conf('o livro escaneado não aparece no resultado, e o aviso diz que há texto que não foi lido',
    telaLongo.valor && telaLongo.valor.aviso + ' | ' + telaLongo.valor.avisoAberto + ' | ' + /indice-sem-texto/.test(telaLongo.valor.livros),
    '1 livro escaneado entra só pelos capítulos e assuntos; 1 livro tem páginas sem texto. | false | false');
  conf('o aviso diz QUAIS livros: o escaneado inteiro e o de uma página sem texto', telaLongo.valor && telaLongo.valor.quais,
    'indice-sem-texto=Livro C sem texto: o livro inteiro|indice-curto=Livro A curto: 1 página de 6');
  conf('o aviso e os grupos têm a seta de recolher', await pag.evaluate(() =>
    !!document.querySelector('#bib-corpo [data-grupo="livros"] > summary .bib-grupo-seta svg') &&
    !!document.querySelector('#bib-corpo .bib-busca-livros-sem-texto > summary .bib-grupo-seta svg')), true);
  await pag.evaluate(() => document.querySelector('#bib-corpo .bib-busca-livros-sem-texto .bib-busca-livros-dispensar').click());
  await pag.evaluate(() => { const c = document.querySelector('#busca-biblioteca'); c.value = 'paralelepipedo'; c.dispatchEvent(new Event('input', { bubbles: true })); });
  await esperar('a busca de novo, sem acento', () => pag.evaluate(() =>
    (document.querySelector('#bib-corpo [data-grupo="livros"] .bib-busca-livros-status') || {}).textContent || ''), v => /1 página encontrada/.test(v), 10000);
  await pausa(300);
  conf('o aviso dispensado não volta na busca seguinte', await pag.evaluate(() => !document.querySelector('#bib-corpo .bib-busca-livros-sem-texto')), true);
  await pag.evaluate(() => document.querySelector('#bib-corpo [data-grupo="livros"] .bib-busca-livros-resultados [data-livro="indice-longo"] .bib-busca-pagina').click());
  const leitorLongo = await esperar('o resultado abre na página 200', () => pag.evaluate(() =>
    document.querySelector('#corpo-modal-leitor-pdf').dataset.paginaDesenhada || ''), v => v === '200', 20000);
  conf('abrir o resultado do Livro B leva à página 200 do arquivo', leitorLongo.ok, true);
  await pag.evaluate(() => document.querySelector('#modal-leitor-pdf [data-fechar]').click());
  await esperar('o leitor do Livro B fecha', () => pag.evaluate(() => !document.querySelector('#modal-leitor-pdf.aberto')), v => v, 5000);
  /* o ponto único dos capítulos: quando existe Biblioteca.sumarioDoLivro (o
   * sumário que a tela do livro mostra, PR #169), o resultado usa o nome dele,
   * e não o marcador cru do PDF; sem ele, volta ao cru. Nada é gravado. */
  const comSumarioEfetivo = await pag.evaluate(async () => {
    const tinha = Object.prototype.hasOwnProperty.call(Biblioteca, 'sumarioDoLivro'), antes = Biblioteca.sumarioDoLivro;
    Biblioteca.sumarioDoLivro = meta => meta && meta.titulo === 'Livro B longo'
      ? [{ n: 1, nivel: 1, titulo: 'Capítulo do mapa: Geometria espacial', pagina: 150, pagina_fim: 250 }] : (meta.sumario || []);
    try {
      const r = await buscarNosLivros('paralelepipedo', {});
      const b = (r.livros || []).find(l => l.id === 'indice-longo');
      return b ? JSON.stringify(b.capitulos.map(c => [c.titulo, c.paginas])) : '';
    } finally { if (tinha) Biblioteca.sumarioDoLivro = antes; else delete Biblioteca.sumarioDoLivro; }
  });
  conf('com o sumário efetivo da tela, o resultado nomeia o capítulo por ele', comSumarioEfetivo, JSON.stringify([['Capítulo do mapa: Geometria espacial', [200]]]));
  const semSumarioEfetivo = await buscar(pag, 'paralelepipedo');
  const bCru = (semSumarioEfetivo.livros || []).find(l => l.id === 'indice-longo');
  conf('com o sumarioDoLivro de verdade, o livro de marcadores bons segue com o sumário do PDF', bCru ? JSON.stringify(bCru.capitulos.map(c => [c.titulo, c.paginas])) : '', JSON.stringify([['Parte 2: Espaço', [200]]]));
  /* com a leitura dos livros ainda em andamento, o grupo "Nos livros" diz
   * isso, e não "nenhum resultado" (a consulta é dublada só aqui) */
  const preparando = await pag.evaluate(async () => {
    const original = IndiceLivros.buscarNosLivros;
    IndiceLivros.buscarNosLivros = () => Promise.resolve({ livros: [], pendentes: ['indice-longo'], naoLidos: [] });
    try {
      const c = document.querySelector('#busca-biblioteca');
      c.value = 'termo da leitura em curso';
      c.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 900));
      const g = document.querySelector('#bib-corpo [data-grupo="livros"]');
      return g ? g.querySelector('.bib-grupo-contagem').textContent + ' | ' + g.querySelector('.bib-busca-livros-status').textContent : 'sem o grupo';
    } finally { IndiceLivros.buscarNosLivros = original; }
  });
  conf('com a leitura em andamento, o grupo "Nos livros" diz que está preparando, e não zero',
    preparando, 'preparando | A busca nos livros ainda está sendo preparada em 1 livro. O resultado aparece aqui quando a leitura terminar.');
  /* a busca se refaz quando um LIVRO termina, e não a cada página indexada
   * (o caso da lente: páginas a cada 500 ms davam 120 buscas inteiras em
   * 60 s). Roda o ligarBuscaAoIndice do app.js de verdade, com relógio falso. */
  {
    const app = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
    const ini = app.indexOf('  function precisaRefazerABusca(');
    const corpoLigar = app.indexOf('  function ligarBuscaAoIndice() {');
    const fim = app.indexOf('\n  }\n', corpoLigar) + 4;
    conf('o ligarBuscaAoIndice e a regra dele estão no app.js', ini > 0 && corpoLigar > ini && fim > corpoLigar, true);
    const simular = (intervaloMs, duracaoMs, livroACadaMs) => {
      let agora = 0, id = 0, timers = [], buscas = 0, ouvinte = null;
      const setT = (f, ms) => { const x = { id: ++id, em: agora + ms, f }; timers.push(x); return x.id; };
      const clearT = n => { timers = timers.filter(x => x.id !== n); };
      const janela = { IndiceLivros: { aoMudar: fn => { ouvinte = fn; } } };
      const fabrica = new Function('window', 'setTimeout', 'clearTimeout', 'buscarTextoNosLivros', 'buscaLivrosAtual', 'bibTermo',
        app.slice(ini, fim) + '\nreturn ligarBuscaAoIndice;');
      fabrica(janela, setT, clearT, () => { buscas++; }, { termo: 'volume', caixa: { grupo: { isConnected: true } } }, 'volume')();
      for (agora = 0; agora <= duracaoMs + 1000; agora += 10) {
        if (agora <= duracaoMs && agora % intervaloMs === 0) {
          ouvinte({ prontos: Math.floor(agora / livroACadaMs), total: 4, rodando: agora < duracaoMs });
        }
        timers.filter(x => x.em <= agora).forEach(x => { clearT(x.id); x.f(); });
      }
      return buscas;
    };
    const porLivro = simular(500, 60000, 20000);
    const controle = simular(500, 60000, 500);
    console.log('   página a cada 500 ms por 60 s, um livro a cada 20 s: ' + porLivro + ' buscas; controle (um livro por página): ' + controle);
    conf('páginas a cada 500 ms por 60 s refazem a busca só quando um livro termina (no máximo 5 vezes)', porLivro <= 5, true);
    conf('controle: com um livro novo a cada evento, o mesmo relógio conta mais de 100 buscas', controle > 100, true);
  }
  // a consulta superada para cedo: a varredura confere a vez entre um lote e outro
  const cancelamento = await pag.evaluate(async () => {
    let n = 0;
    const r = await IndiceLivros.buscarNosLivros('paralelepipedo', {}, { cancelada: () => ++n > 1 });
    return { cancelada: !!r.cancelada, livros: (r.livros || []).length, perguntas: n };
  });
  conf('a consulta superada para no meio, sem resultado, e diz que foi cancelada',
    cancelamento.cancelada + ' | ' + cancelamento.livros + ' | ' + (cancelamento.perguntas < 12), 'true | 0 | true');
  await pag.evaluate(() => { const campo = document.querySelector('#busca-biblioteca'); campo.value = ''; campo.dispatchEvent(new Event('input', { bubbles: true })); });

  const norm = await pag.evaluate(() => [IndiceLivros.normalizar('multipli-' + String.fromCharCode(10) + 'cação'),
    IndiceLivros.normalizar('multi' + String.fromCharCode(0xAD) + 'plicação'), IndiceLivros.normalizar('Frações  EQUIVALENTES'),
    IndiceLivros.normalizar('bem-vindo')].join('|'));
  conf('a palavra partida no fim da linha e o hífen invisível voltam a ser uma palavra; o hífen do meio fica',
    norm, 'multiplicacao|multiplicacao|fracoes equivalentes|bem-vindo');

  secao('3.2. A busca pelos capítulos e assuntos do mapa (também no livro escaneado)');
  /* Dois livros SINTÉTICOS gravados à parte, e tirados no fim da seção:
   *   Livro K com texto  4 páginas; "volume" no texto das páginas 3 e 4; o
   *                      sumário dos marcadores tem "Capítulo 2: Volume e
   *                      capacidade" na p. 3, e o mapa liga o mesmo capítulo
   *                      ao assunto MAT08-15;
   *   Livro L escaneado  o PDF de 3 páginas sem texto; o mapa tem "Volume e
   *                      capacidade" nas p. 2 a 3, ligado ao MAT08-15, e
   *                      "Ângulos" na p. 1, ligado a outro assunto do 8º ano.
   * A busca "volume" mostra o L pelo capítulo e o K uma vez só, com o
   * capítulo marcado pelo capítulo e no texto. */
  const temas = JSON.parse(fs.readFileSync(path.join(H.RAIZ, 'banco', 'topicos', 'matematica.json'), 'utf8')).temas;
  const semAcento = t => String(t).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const volume = temas.find(t => t.id === 'MAT08-15');
  const palavrasDe = t => ' ' + semAcento(t.pt.titulo + ' ' + ((t.chaves && (t.chaves.r + ' ' + t.chaves.d)) || '')) + ' ';
  // o assunto do outro capítulo não pode casar "volume" (nem a chave escolhida abaixo)
  const outro = temas.find(t => /^MAT08-/.test(t.id) && t.id !== 'MAT08-15' && palavrasDe(t).indexOf(' volume') < 0);
  /* o termo que casa SÓ a chave do assunto: uma palavra-chave do MAT08-15
   * que não está no título dele nem no título dos capítulos de prova */
  const titulosDaProva = ['capitulo 1: numeros', 'capitulo 2: volume e capacidade', 'volume e capacidade', 'angulos', semAcento(volume.pt.titulo), semAcento(outro.pt.titulo)];
  const daChave = ((volume.chaves && (volume.chaves.d + ' ' + volume.chaves.r)) || '').split(' ')
    .filter(w => w.length >= 8 && titulosDaProva.every(t => t.indexOf(w) < 0) && palavrasDe(outro).indexOf(' ' + w) < 0)
    .sort((a, b) => (b === 'reservatorio') - (a === 'reservatorio'))[0];
  conf('há uma palavra-chave do MAT08-15 fora dos títulos (' + daChave + ')', !!daChave, true);
  const textoK = path.join(TMP, 'livro-k-texto.pdf');
  const rk = spawnSync(PYTHON, ['-X', 'utf8', '-c', 'import sys, pymupdf\nd = pymupdf.open()\n' +
    'for t in ["Numeros naturais e operacoes.", "A reta numerica e a ordem.", "O volume do cubo: aresta vezes aresta vezes aresta.", "A capacidade da caixa em litros mede o volume interno."]:\n' +
    '    d.new_page().insert_text((72, 90), t)\nd.save(sys.argv[1])', textoK], { encoding: 'utf8' });
  conf('o PDF do Livro K foi gerado', rk.status === 0 && fs.existsSync(textoK), true);
  amb.extras['/cap-texto.pdf'] = { tipo: 'application/pdf', corpo: fs.existsSync(textoK) ? fs.readFileSync(textoK) : Buffer.from('') };
  amb.extras['/cap-escaneado.pdf'] = { tipo: 'application/pdf', corpo: fs.readFileSync(path.join(raizIndice, 'indice-sem-texto.pdf')) };
  await gravarLivros(pag, 'prova-capitulos', [
    { url: '/cap-texto.pdf', meta: { id: 'cap-com-texto', hash: 'sha256:k', titulo: 'Livro K com texto', paginas: 4, sumario_origem: 'marcadores',
      sumario: [{ n: 1, nivel: 1, titulo: 'Capítulo 1: Números', pagina: 1 }, { n: 2, nivel: 1, titulo: 'Capítulo 2: Volume e capacidade', pagina: 3 }],
      mapa: [{ n: 2, titulo: 'Capítulo 2: Volume e capacidade', pagina: 3, pagina_fim: 4, assuntos: [{ id: 'MAT08-15' }] }] } },
    { url: '/cap-escaneado.pdf', meta: { id: 'cap-escaneado', hash: 'sha256:l', titulo: 'Livro L escaneado', paginas: 3,
      mapa: [{ n: 1, titulo: 'Ângulos', pagina: 1, pagina_fim: 1, assuntos: [{ id: outro.id }] },
        { n: 2, titulo: 'Volume e capacidade', pagina: 2, pagina_fim: 3, assuntos: [{ id: 'MAT08-15' }] }] } }]);
  const seis = await esperar('os dois livros da prova lidos pelo índice', () => estado(pag), parado(6, 6), 60000);
  conf('os dois livros da prova foram lidos pelo índice (6 de 6)', seis.ok, true);
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'biblioteca');
  await esperar('os livros da prova na Biblioteca', () => pag.evaluate(() => !!document.querySelector('#bib-busca-cartao') &&
    getComputedStyle(document.querySelector('#bib-busca-cartao')).display !== 'none'), v => v, 10000);
  const lerNosLivros = () => pag.evaluate(() => {
    const g = document.querySelector('#bib-corpo [data-grupo="livros"]');
    if (!g) return null;
    const livro = id => {
      const c = g.querySelector('.bib-busca-livros-resultados .bib-busca-livro[data-livro="' + id + '"]');
      return c ? [...c.querySelectorAll('.bib-busca-livro-grupo')].map(b => [b.querySelector('.bib-busca-livro-paginas strong').textContent,
        b.dataset.pelo, (b.querySelector('.bib-busca-como') || {}).textContent || '',
        !!b.querySelector('.bib-busca-abrir-capitulo'), [...b.querySelectorAll('.bib-busca-pagina')].map(x => x.dataset.pagina).join(',')]) : null;
    };
    return { status: g.querySelector('.bib-busca-livros-status').textContent, contagem: g.querySelector('.bib-grupo-contagem').textContent,
      livros: [...g.querySelectorAll('.bib-busca-livros-resultados .bib-busca-livro[data-livro]')].map(x => x.dataset.livro),
      K: livro('cap-com-texto'), L: livro('cap-escaneado'),
      aviso: (g.querySelector('.bib-busca-livros-sem-texto > summary') || {}).textContent || '' };
  });
  const digitar = termo => pag.evaluate(t => { const c = document.querySelector('#busca-biblioteca'); c.value = t; c.dispatchEvent(new Event('input', { bubbles: true })); }, termo);
  const fotoAntes = await fotoDoBanco(), indiceAntes = JSON.stringify(await registrosDoIndice(pag));
  await digitar('volume');
  const vol = await esperar('a busca "volume" com os dois livros', lerNosLivros,
    v => !!v && !/Buscando/.test(v.status) && !!v.L && !!v.K && /assunto/.test(JSON.stringify(v.L)), 15000);
  const V = vol.valor || {};
  console.log('   "volume": ' + JSON.stringify(V));
  prop('o livro escaneado aparece pelo capítulo "Volume e capacidade", com o botão "Abrir no capítulo"',
    JSON.stringify(V.L) === JSON.stringify([['Volume e capacidade', 'capitulo', 'Pelo capítulo, assunto: ' + volume.pt.titulo, true, '']]),
    '--envenenado-busca-sem-capitulos');
  conf('o livro com texto aparece UMA vez, com o capítulo marcado pelo capítulo e no texto, e as páginas 3 e 4',
    JSON.stringify(V.K), JSON.stringify([['Capítulo 2: Volume e capacidade', 'capitulo texto', 'Pelo capítulo, assunto: ' + volume.pt.titulo + '·No texto', true, '3,4']]));
  conf('cada livro aparece uma vez só', V.livros && V.livros.length === new Set(V.livros).size && V.livros.filter(x => /^cap-/.test(x)).length, 2);
  conf('a contagem do grupo e a linha-resumo dizem capítulos, páginas e livros',
    V.contagem + ' | ' + V.status + ' | ' + await pag.evaluate(() => (document.querySelector('#bib-busca-resumo') || {}).textContent || '(sem resumo)'),
    '2 capítulos e 2 páginas em 2 livros | 2 capítulos e 2 páginas em 2 livros. | (sem resumo)');
  conf('o aviso dos escaneados diz que eles entram pelos capítulos e assuntos', /livros escaneados entram só pelos capítulos e assuntos/.test(V.aviso), true);
  await pausa(400);
  conf('buscar pelos capítulos não grava: o banco principal (meta e posição) e o índice ficam idênticos',
    (await fotoDoBanco()) === fotoAntes && JSON.stringify(await registrosDoIndice(pag)) === indiceAntes, true);
  // os prints do resultado, só quando pedidos (PRINTS_BUSCA_CAPITULOS=<pasta>), no tablet de pé e deitado
  if (process.env.PRINTS_BUSCA_CAPITULOS) {
    for (const [w, h] of [[800, 1280], [1280, 800]]) {
      await pag.setViewport({ width: w, height: h, hasTouch: true });
      await pausa(400);
      await pag.evaluate(() => {
        const alvo = document.querySelector('#bib-corpo .bib-busca-livro[data-livro="cap-com-texto"]');
        const cont = document.querySelector('.conteudo');
        if (alvo && cont) cont.scrollTop += alvo.getBoundingClientRect().top - cont.getBoundingClientRect().top - 120;
      });
      await pausa(300);
      await pag.screenshot({ path: path.join(process.env.PRINTS_BUSCA_CAPITULOS, 'busca-volume-' + w + 'x' + h + '.png') });
    }
    await pag.setViewport({ width: 1280, height: 1000, hasTouch: true });
  }
  // "Abrir no capítulo" do livro escaneado abre na página em que o capítulo começa (a 2)
  await pag.evaluate(() => document.querySelector('#bib-corpo .bib-busca-livro[data-livro="cap-escaneado"] .bib-busca-abrir-capitulo').click());
  const abriuCap = await esperar('o capítulo do escaneado abre na página 2', () => pag.evaluate(() =>
    (document.querySelector('#modal-leitor-pdf.aberto') && document.querySelector('#corpo-modal-leitor-pdf').dataset.paginaDesenhada) || ''), v => v === '2', 15000);
  conf('"Abrir no capítulo" abre o livro escaneado na página inicial do capítulo (2)', abriuCap.valor, '2');
  await pag.evaluate(() => document.querySelector('#modal-leitor-pdf [data-fechar]').click());
  await esperar('o leitor do capítulo fecha', () => pag.evaluate(() => !document.querySelector('#modal-leitor-pdf.aberto')), v => v, 5000);
  // o termo que casa só a chave do assunto (não o título dele, nem o do capítulo)
  await digitar(daChave);
  const chave = await esperar('a busca pela chave do assunto', lerNosLivros, v => !!v && !/Buscando/.test(v.status) && !!v.L, 15000);
  console.log('   "' + daChave + '": ' + JSON.stringify(chave.valor));
  conf('um termo que casa só a chave do assunto acha o capítulo ligado a ele, e diz qual assunto',
    JSON.stringify(chave.valor && chave.valor.L), JSON.stringify([['Volume e capacidade', 'capitulo', 'Pelo capítulo, assunto: ' + volume.pt.titulo, true, '']]));
  // o lado oposto: um termo que não está em nada não acha nada
  await digitar('zqxjkw capitulo');
  const nada = await esperar('a busca por um termo que não existe', lerNosLivros, v => !!v && !/Buscando/.test(v.status), 15000);
  conf('um termo que não está em nada não acha capítulo nem página', nada.valor && nada.valor.livros.length + ' | ' + nada.valor.contagem, '0 | 0');
  // a busca por capítulo é instantânea: 79 livros e cerca de 1.500 capítulos, montar o índice e consultar abaixo de 50 ms
  const tempo = await pag.evaluate(() => {
    const porId = {};
    for (let i = 0; i < 400; i++) porId['A' + i] = { titulo: 'Assunto ' + i + ' de geometria e medidas', chaves: { r: 'raiz' + i + ' calcular medir volume', d: 'agua altura area base caixa centimetro cubico cubo exemplo largura metro qual quanto raio' } };
    const livros = [];
    for (let l = 0; l < 79; l++) {
      const mapa = [];
      for (let c = 1; c <= 19; c++) mapa.push({ n: c, titulo: 'Capítulo ' + c + ': Tema ' + l + '.' + c + ' de frações e ângulos', pagina: c * 10, pagina_fim: c * 10 + 9,
        assuntos: [{ id: 'A' + ((l * 19 + c) % 400) }, { id: 'A' + ((l + c) % 400) }] });
      livros.push({ id: 'L' + l, meta: { formato: 'pdf', paginas: 200, sumario: [], mapa } });
    }
    const t0 = performance.now();
    const ind = Biblioteca.indiceDeCapitulos(livros, {}, { porId }, IndiceLivros.normalizar);
    const t1 = performance.now();
    const r = Biblioteca.procurarNosCapitulos(ind, 'angulos', IndiceLivros.normalizar);
    const t2 = performance.now();
    return { capitulos: ind.capitulos, montar: Math.round((t1 - t0) * 10) / 10, buscar: Math.round((t2 - t1) * 10) / 10, achados: r.length };
  });
  console.log('   desempenho: ' + JSON.stringify(tempo));
  conf('79 livros e ' + tempo.capitulos + ' capítulos: montar o índice e consultar ficam abaixo de 50 ms cada', tempo.capitulos >= 1500 && tempo.montar < 50 && tempo.buscar < 50 && tempo.achados === 79, true);
  await digitar('');
  // os livros da prova saem, e o índice volta aos quatro do pacote
  await pag.evaluate(() => Promise.all([Store.removerLivro('cap-com-texto'), Store.removerLivro('cap-escaneado')]).then(() => IndiceLivros.sincronizar()));
  const quatro = await esperar('o índice de volta aos quatro livros', () => estado(pag), parado(4, 4), 30000);
  conf('os livros da prova saíram, e o índice voltou aos quatro do pacote', quatro.ok, true);

  secao('4. A página sem texto e a linha no fim');
  const c = depois && depois.livros['indice-sem-texto'];
  conf('o Livro C ficou pronto com as 3 páginas contadas como sem texto', c ? c.pronto + '/' + c.semTexto.length + '/' + c.total : '', 'true/3/3');
  conf('nenhuma página do Livro C entrou no índice', depois && (depois.porLivro['indice-sem-texto'] || 0), 0);
  const a6 = depois && depois.livros['indice-curto'];
  conf('a página 6 do Livro A é a contada como sem texto', a6 ? JSON.stringify(a6.semTexto) : '', '[6]');
  const linhaFim = await esperar('a linha de progresso some', () => linhaDeProgresso(pag), v => !!v && v.oculta, 5000);
  conf('a linha de progresso sumiu com tudo pronto', linhaFim.ok, true);

  secao('5. A cópia de segurança e a restauração');
  const copia = await pag.evaluate(() => Store.carregar().then(d => Store.exportarTudo(d)).then(p => JSON.stringify(p)));
  prop('a cópia de segurança não contém o índice (nem a palavra "paralelepipedo" do texto indexado)',
    copia.indexOf('paralelepipedo') < 0 && !/"indice/i.test(copia), '--envenenado-indice-na-copia');
  const antesRestaurar = await registrosDoIndice(pag);
  const restaurou = await pag.evaluate(() => Store.carregar().then(d => Store.exportarTudoZip(d))
    .then(z => Store.importarZip(new File([z], 'copia.zip', { type: 'application/zip' }))).then(() => 'ok', e => 'erro: ' + e.message));
  conf('a cópia restaurou', restaurou, 'ok');
  const depoisRestaurar = await registrosDoIndice(pag);
  conf('restaurar não apagou nem mudou o índice (páginas antes e depois)',
    (antesRestaurar && antesRestaurar.paginas) + '/' + (depoisRestaurar && depoisRestaurar.paginas), (antesRestaurar && antesRestaurar.paginas) + '/' + (antesRestaurar && antesRestaurar.paginas));
  r = await buscar(pag, 'mediana');
  conf('a busca segue achando depois da restauração', (r.livros || []).map(l => l.id).join(','), 'indice-curto');

  secao('6. O banco principal e o código de antes');
  const bancos = await bancosAbertos(pag);
  console.log('   bancos: ' + bancos.join(', '));
  conf('o banco principal segue na versão 6', bancos.indexOf('apoio-educacional@6') >= 0, true);
  conf('o índice mora no banco à parte, na versão 1', bancos.indexOf('indice-livros@1') >= 0, true);
  const abre6 = await pag.evaluate(() => new Promise(r => {
    const q = indexedDB.open('apoio-educacional', 6);
    q.onsuccess = () => { q.result.close(); r('abriu'); };
    q.onerror = () => r(q.error ? q.error.name : 'erro');
    q.onupgradeneeded = () => r('subiu');
  }));
  conf('indexedDB.open("apoio-educacional", 6) abre sem VersionError', abre6, 'abriu');
  const alunos = await pag.evaluate(() => Store.carregar().then(d => d.alunos.map(x => x.nome).sort().join(',')));
  conf('os dados da prova estão intactos', alunos, ALUNOS);
  conf('o store.js do commit pai foi achado no git', !!PAI, true);
  if (PAI) {
    console.log('   código de antes: store.js de ' + PAI.ref);
    const velha = await amb.pagina();
    // sem o service worker: com ele, a navegação a um endereço fora do pacote recebe o index.html do app
    await velha.setBypassServiceWorker(true);
    await velha.goto(amb.ORIGEM + '/vazio-b12.html');
    conf('a página do código de antes não é o aplicativo', await velha.evaluate(() => typeof window.IndiceLivros), 'undefined');
    await velha.addScriptTag({ url: amb.ORIGEM + '/store-pai-b12.js' });
    const lidoPeloPai = await velha.evaluate(() => Store.carregar().then(d => 'ok:' + d.alunos.map(x => x.nome).sort().join(','),
      e => 'erro:' + (e && (e.name || e.message))));
    conf('o código de antes abre o banco e lê os dados depois desta versão', lidoPeloPai, 'ok:' + ALUNOS);
    conf('a página do código de antes não teve erro', velha.errosDePagina.join(' | '), '');
    await velha.close();
  }

  secao('7. O índice apagado à mão e o corrompido se refazem');
  const apagou = await pag.evaluate(() => new Promise(r => {
    const q = indexedDB.deleteDatabase('indice-livros');
    q.onsuccess = () => r('apagou'); q.onerror = () => r('erro'); q.onblocked = () => { /* a conexão do app sai sozinha */ };
  }));
  conf('o banco do índice foi apagado à mão', apagou, 'apagou');
  await H.abrirApp(pag, amb.ORIGEM);
  let refeito = await esperar('o índice refeito depois de apagado', () => estado(pag), tudoPronto, 120000);
  conf('o índice apagado à mão se refez sozinho', refeito.ok, true);
  r = await buscar(pag, 'mediana');
  conf('e a busca volta a achar', (r.livros || []).map(l => l.id).join(','), 'indice-curto');
  // corrompido: o banco existe na versão 1, mas sem os depósitos
  const corrompeu = await pag.evaluate(() => new Promise(r => {
    const q = indexedDB.deleteDatabase('indice-livros');
    q.onsuccess = () => {
      const c = indexedDB.open('indice-livros', 1);
      c.onupgradeneeded = () => { c.result.createObjectStore('lixo'); };
      c.onsuccess = () => { c.result.close(); r('corrompido'); };
      c.onerror = () => r('erro');
    };
    q.onerror = () => r('erro');
  }));
  conf('o banco do índice ficou corrompido (sem os depósitos)', corrompeu, 'corrompido');
  await H.abrirApp(pag, amb.ORIGEM);
  refeito = await esperar('o índice refeito depois de corrompido', () => estado(pag), tudoPronto, 120000);
  conf('o índice corrompido se refez sozinho', refeito.ok, true);
  r = await buscar(pag, 'paralelepipedo');
  conf('e a busca acha no índice refeito', (r.livros || []).map(l => l.id).join(','), 'indice-longo');

  secao('8. O leitor aberto pausa o índice');
  conf('o índice foi apagado à mão para ler de novo', await apagarIndiceAMao(pag), 'apagou');
  await H.abrirApp(pag, amb.ORIGEM);
  await pag.evaluate(() => {
    window.__b12l = null;
    IndiceLivros.aoMudar(e => {
      if (window.__b12l === null && e.livro === 'indice-longo' && e.pagina >= 30) {
        window.__b12l = e.pagina;
        document.querySelector('[data-abrir-livro="indice-curto"]').click();
      }
    });
  });
  const pausouNoLeitor = await esperar('o índice parar com o leitor aberto', () => estado(pag), v => !!v && v.ocupado && !v.rodando, 60000);
  conf('com o leitor de PDF aberto, o índice para no meio do livro', pausouNoLeitor.ok, true);
  const comLeitor1 = await registrosDoIndice(pag);
  await pausa(2500);
  const comLeitor2 = await registrosDoIndice(pag);
  conf('com o leitor aberto, nenhuma página nova é lida', comLeitor2 && comLeitor2.paginas, comLeitor1 && comLeitor1.paginas);
  await pag.evaluate(() => document.querySelector('#modal-leitor-pdf [data-fechar]').click());
  const voltou = await esperar('o índice voltar com o leitor fechado', () => estado(pag), tudoPronto, 120000);
  conf('o leitor fechado, o índice volta sozinho e termina', voltou.ok, true);
  conf('e o Livro B foi lido uma vez só, sem repetir página (600)', voltou.valor && voltou.valor.lidasNaSessao['indice-longo'], 600);

  secao('9. Falha permanente, falha passageira e o Worker que morre');
  /* E (não é PDF) e F (com senha) são do ARQUIVO: saem da leitura e aparecem
   * como não lidos. G é o livro longo cujo Worker morre na página 30, sem
   * aviso nenhum: a falha é passageira, e G continua na abertura seguinte.
   * H vem depois e tem de ser lido mesmo assim. */
  const aoNascerWorker = async w => {
    try {
      await w.evaluate(() => {
        const original = self.postMessage.bind(self);
        self.postMessage = function (m) {
          original(m);
          if (m && m.tipo === 'pagina' && m.id === 'livro-g-longo' && m.pagina >= 30 && !self.__morreu) { self.__morreu = true; self.close(); }
        };
      });
    } catch (e) { /* o Worker já foi */ }
  };
  pag.on('workercreated', aoNascerWorker);
  await gravarLivros(pag, 'prova-falhas', [
    { url: '/b12-corrompido.pdf', meta: { id: 'livro-e-corrompido', hash: 'sha256:e', titulo: 'Livro E corrompido' } },
    { url: '/b12-senha.pdf', meta: { id: 'livro-f-senha', hash: 'sha256:f', titulo: 'Livro F com senha' } },
    { url: '/b12-longo.pdf', meta: { id: 'livro-g-longo', hash: 'sha256:g', titulo: 'Livro G longo',
      sumario: [{ n: 1, nivel: 1, titulo: 'Parte única', pagina: 1, pagina_fim: 600 }] } },
    { url: '/b12-curto.pdf', meta: { id: 'livro-h-normal', hash: 'sha256:h', titulo: 'Livro H normal' } }]);
  const falhas = await esperar('a fila passar pelos quatro livros novos', () => estado(pag),
    v => !!v && v.total === 8 && v.prontos >= 7 && !v.rodando && v.fila.length === 0, 120000);
  pag.off('workercreated', aoNascerWorker);
  conf('a fila passou pelos quatro livros novos', falhas.ok, true);
  const rf = await registrosDoIndice(pag);
  const E = rf && rf.livros['livro-e-corrompido'], F = rf && rf.livros['livro-f-senha'];
  const G = rf && rf.livros['livro-g-longo'], Hh = rf && rf.livros['livro-h-normal'];
  console.log('   E: ' + JSON.stringify(E && E.erro) + '; F: ' + JSON.stringify(F && F.erro) + '; G em ' + (G && G.proxima) + ', falha da página ' + JSON.stringify(G && G.falhaDaPagina));
  conf('o PDF que não é PDF saiu da leitura com erro permanente', !!(E && E.pronto && E.erro && E.erro.permanente), true);
  conf('o PDF com senha saiu da leitura com erro permanente', !!(F && F.pronto && F.erro && F.erro.permanente && /Password/.test(F.erro.nome)), true);
  prop('o Livro G, cujo Worker morreu no meio, NÃO saiu da leitura (falha passageira, contada uma vez para a página de agora)',
    !!G && !G.pronto && !G.erro && !!G.falhaDaPagina && G.falhaDaPagina.vezes === 1 && G.falhaDaPagina.n === G.proxima && G.proxima > 30 && falhas.valor.prontos === 7, '--envenenado-erro-vira-pronto');
  conf('nenhuma página do Livro G foi marcada como sem texto pela morte do Worker', G && G.semTexto.length, 0);
  conf('o Livro H, depois das falhas, foi lido mesmo assim', !!(Hh && Hh.pronto && !Hh.erro) + '/' + (rf && rf.porLivro['livro-h-normal']), 'true/5');
  const rn = await buscar(pag, 'mediana');
  const nl = {};
  (rn.naoLidos || []).forEach(x => { nl[x.id] = x.naoLidas + '/' + x.livroInteiro + '/' + x.motivo; });
  console.log('   não lidos: ' + JSON.stringify(nl));
  conf('a consulta lista o livro sem texto mesmo sem acerto (C: 3 páginas)', nl['indice-sem-texto'], '3/false/sem-texto');
  conf('e os dois livros que não abrem, como não lidos inteiros',
    [nl['livro-e-corrompido'], nl['livro-f-senha']].map(x => String(x).split('/').slice(1).join('/')).join(','), 'true/arquivo,true/arquivo');
  conf('e o Livro A com a página sem texto', nl['indice-curto'], '1/false/sem-texto');
  conf('o livro com senha não aparece como acerto', (rn.livros || []).map(l => l.id).sort().join(','), 'indice-curto,livro-h-normal');
  // a busca não trava a tela: a maior espera durante uma busca que varre todos os livros
  const atrasoBusca = await pag.evaluate(() => new Promise(r => {
    let maior = 0, ultimo = performance.now(), fim = false;
    (function volta() { const a = performance.now(); maior = Math.max(maior, a - ultimo); ultimo = a; if (!fim) setTimeout(volta, 10); })();
    buscarNosLivros('texto corrido').then(x => { fim = true; r({ maior: Math.round(maior), livros: x.livros.map(l => l.paginas.length) }); });
  }));
  console.log('   a busca de "texto corrido": ' + JSON.stringify(atrasoBusca));
  conf('a busca que varre os livros longos não trava a tela (maior espera abaixo de 250 ms)', atrasoBusca.maior < 250, true);
  await H.abrirApp(pag, amb.ORIGEM);
  const gVolta = await esperar('o Livro G terminar na abertura seguinte', () => estado(pag), parado(8, 8), 120000);
  conf('na abertura seguinte o Livro G continuou e terminou', gVolta.ok, true);
  const rg = await registrosDoIndice(pag);
  const Gv = rg && rg.livros['livro-g-longo'];
  conf('o Livro G tem as 600 páginas, sem erro, e a conta de falhas zerou',
    (rg && rg.porLivro['livro-g-longo']) + '/' + !!(Gv && Gv.erro) + '/' + (Gv && Gv.falhas), '600/false/0');
  conf('na volta, E, F e H não foram lidos de novo', ['livro-e-corrompido', 'livro-f-senha', 'livro-h-normal']
    .map(id => (gVolta.valor && gVolta.valor.lidasNaSessao[id]) || 0).join(','), '0,0,0');

  secao('9b. Uma página que sempre falha não derruba o livro');
  /* A parte 2 do EPUB falha SEMPRE, de forma passageira (RangeError, como a
   * falta de memória só naquela página): o Worker é ajustado ao nascer para
   * o texto dela nunca sair. O livro tem de ser lido nas outras partes, ficar
   * na busca e contar 1 parte que não pôde ser lida. */
  const paginaRuim = async w => {
    try {
      await w.evaluate(() => {
        const original = TextDecoder.prototype.decode;
        TextDecoder.prototype.decode = function () {
          const t = original.apply(this, arguments);
          if (t.indexOf('Meio do capítulo 2') >= 0) throw new RangeError('sem memória só nesta página (prova)');
          return t;
        };
      });
    } catch (e) { /* o Worker já foi */ }
  };
  conf('o índice foi apagado à mão para ler de novo', await apagarIndiceAMao(pag), 'apagou');
  pag.on('workercreated', paginaRuim);
  await H.abrirApp(pag, amb.ORIGEM);
  const comRuim = await esperar('a fila passar com a página ruim', () => estado(pag),
    v => !!v && v.total === 8 && v.prontos >= 7 && !v.rodando && v.fila.length === 0, 120000);
  pag.off('workercreated', paginaRuim);
  conf('a fila passou', comRuim.ok, true);
  const rr = await registrosDoIndice(pag);
  const D = rr && rr.livros['livro-de-prova'];
  console.log('   EPUB: ' + JSON.stringify(D && { pronto: D.pronto, erro: D.erro, ilegiveis: D.ilegiveis, falhas: D.falhas, total: D.total }) +
    ', partes no índice: ' + (rr && rr.porLivro['livro-de-prova']));
  prop('o EPUB com uma parte que sempre falha ficou pronto, sem erro, com SÓ a parte 2 de fora',
    !!D && D.pronto && !D.erro && JSON.stringify(D.ilegiveis) === '[2]' && rr.porLivro['livro-de-prova'] === 2,
    '--envenenado-pagina-ruim-derruba-livro');
  r = await buscar(pag, 'paragrafo 1 do capitulo 3');
  const d3 = (r.livros || []).find(l => l.id === 'livro-de-prova');
  conf('a busca acha o termo nas outras partes do livro (parte 3)', d3 ? JSON.stringify([d3.paginas, d3.naoLidas]) : '', '[[3],1]');
  const naoLidoD = (r.naoLidos || []).find(l => l.id === 'livro-de-prova');
  conf('e o livro diz 1 parte que não pôde ser lida, sem sair da busca',
    naoLidoD ? naoLidoD.naoLidas + '/' + naoLidoD.livroInteiro + '/' + naoLidoD.motivo : '', '1/false/leitura');

  secao('10. Livro removido e livro trocado no meio da leitura');
  conf('o índice foi apagado à mão para ler de novo', await apagarIndiceAMao(pag), 'apagou');
  await H.abrirApp(pag, amb.ORIGEM);
  await pag.evaluate(() => {
    window.__b12t = { trocou: false, removeu: false };
    IndiceLivros.aoMudar(e => {
      if (!window.__b12t.trocou && e.livro === 'indice-longo' && e.pagina >= 30) {
        window.__b12t.trocou = true;
        Promise.all([Store.lerLivro('indice-longo'), Store.lerLivro('indice-curto')]).then(x => Store.gravarLivros({
          manifest: { pacote: x[0].pacote, versao: x[0].versao },
          livros: [{ meta: Object.assign({}, x[0].meta, { hash: 'sha256:trocado', sumario: x[1].meta.sumario }), blob: x[1].blob }]
        })).then(() => IndiceLivros.sincronizar());
      }
      if (!window.__b12t.removeu && e.livro === 'livro-g-longo' && e.pagina >= 30) {
        window.__b12t.removeu = true;
        Store.removerLivro('livro-g-longo').then(() => IndiceLivros.sincronizar());
      }
    });
  });
  const trocados = await esperar('a fila terminar com um livro trocado e um removido', () => estado(pag), parado(7, 7), 120000);
  conf('a fila terminou (7 livros, 7 prontos)', trocados.ok, true);
  conf('as duas trocas aconteceram no meio da leitura', JSON.stringify(await pag.evaluate(() => window.__b12t)), JSON.stringify({ trocou: true, removeu: true }));
  const rt = await registrosDoIndice(pag);
  const Bt = rt && rt.livros['indice-longo'];
  conf('o livro trocado no meio foi refeito pelo arquivo novo (hash novo, 6 páginas, 5 com texto)',
    Bt ? Bt.hash + '/' + Bt.total + '/' + rt.porLivro['indice-longo'] + '/' + Bt.pronto : '', 'sha256:trocado/6/5/true');
  conf('o livro removido no meio saiu do índice sem deixar registro nem página',
    !!(rt && !rt.livros['livro-g-longo'] && !rt.porLivro['livro-g-longo']), true);
  r = await buscar(pag, 'paralelepipedo');
  conf('o texto do arquivo velho não é mais achado', (r.livros || []).length, 0);
  r = await buscar(pag, 'mediana');
  conf('e o do arquivo novo é', (r.livros || []).map(l => l.id).sort().join(','), 'indice-curto,indice-longo,livro-h-normal');

  secao('11. Duas janelas: a trava deixa uma só ler');
  // um livro de 2400 páginas, para a leitura durar o bastante
  await gravarLivros(pag, 'prova-falhas', [{ url: '/b12-enorme.pdf', meta: { id: 'livro-i-enorme', hash: 'sha256:i', titulo: 'Livro I enorme' } }]);
  conf('o índice foi apagado à mão para ler de novo', await apagarIndiceAMao(pag), 'apagou');
  /* As duas janelas abrem quase juntas e começam a fila a um segundo e pouco
   * uma da outra; a leitura toda leva vários segundos (o livro enorme), então
   * uma delas TEM de esperar a trava. A segunda numa JANELA à parte: numa aba
   * da mesma janela, a primeira iria para segundo plano e pararia de ler. */
  const aba2 = await novaJanela(pag);
  await Promise.all([H.abrirApp(aba2, amb.ORIGEM), H.abrirApp(pag, amb.ORIGEM)]);
  // cada janela olha a trava a cada 25 ms e anota se viu uma delas lendo e a outra esperando
  const olharTrava = () => {
    window.__viuEspera = false;
    const t = setInterval(() => navigator.locks.query().then(q => {
      if (q.held.some(x => x.name === 'indice-livros-trabalho') && q.pending.some(x => x.name === 'indice-livros-trabalho')) {
        window.__viuEspera = true; clearInterval(t);
      }
    }), 25);
  };
  await aba2.evaluate(olharTrava);
  await pag.evaluate(olharTrava);
  const esperou = await esperar('uma janela esperar a trava da outra', () => Promise.all([pag, aba2].map(x => x.evaluate(() => window.__viuEspera)))
    .then(v => v.some(Boolean)), v => v === true, 30000);
  conf('com as duas lendo, uma ficou esperando a trava da outra', esperou.ok, true);
  const fim1 = await esperar('as duas abas pararem', () => Promise.all([estado(pag), estado(aba2)]),
    v => !!v && v.every(x => x && !x.rodando && x.fila.length === 0 && x.prontos === x.total && x.total === 8), 120000);
  conf('as duas abas terminaram', fim1.ok, true);
  const rd = await registrosDoIndice(pag);
  const somas = Object.keys(rd ? rd.livros : {}).sort().map(id => {
    const l1 = (fim1.valor && fim1.valor[0].lidasNaSessao[id]) || 0, l2 = (fim1.valor && fim1.valor[1].lidasNaSessao[id]) || 0;
    const total = rd.livros[id].erro ? 0 : rd.livros[id].total;
    return id + ':' + (l1 + l2 === total ? 'ok' : 'repetiu') + ' (' + l1 + '+' + l2 + ' de ' + total + ')';
  });
  console.log('   leituras por livro nas duas abas: ' + somas.join(', '));
  conf('cada página foi lida uma vez só, somando as duas janelas', somas.length === 8 && somas.every(x => /:ok /.test(x)), true);
  conf('a segunda janela não teve erro de página', aba2.errosDePagina.join(' | '), '');
  await aba2.close();
  await pag.evaluate(() => Store.removerLivro('livro-i-enorme').then(() => IndiceLivros.sincronizar()));

  secao('12. Sem espaço');
  await pag.evaluate(() => localStorage.setItem('b12-cota-baixa', '1'));
  conf('o índice foi apagado à mão para ler de novo', await apagarIndiceAMao(pag), 'apagou');
  await H.abrirApp(pag, amb.ORIGEM);
  const semLugar = await esperar('o índice desistir por falta de espaço', () => estado(pag), v => !!v && v.parado && v.motivo === 'sem-espaco', 20000);
  conf('com menos que a folga livre, o índice não começa e para calado', semLugar.ok, true);
  const linhaSem = await linhaDeProgresso(pag);
  conf('a linha de progresso não aparece', linhaSem && linhaSem.oculta, true);
  conf('nenhuma página foi lida', Object.keys((semLugar.valor && semLugar.valor.lidasNaSessao) || {}).length, 0);
  conf('a decisão de não tentar ficou guardada no aparelho', await pag.evaluate(() => Number(localStorage.getItem('indice-livros-sem-espaco-ate')) > Date.now()), true);
  await pag.evaluate(() => localStorage.removeItem('b12-cota-baixa'));
  await H.abrirApp(pag, amb.ORIGEM);
  await pausa(4500);
  const aindaSem = await estado(pag);
  conf('na abertura seguinte, com espaço de volta, ele não insiste (a decisão fica por uns dias)',
    aindaSem.parado + '/' + aindaSem.motivo + '/' + Object.keys(aindaSem.lidasNaSessao).length, 'true/sem-espaco/0');
  await pag.evaluate(() => localStorage.removeItem('indice-livros-sem-espaco-ate'));

  secao('13. O "Apagar tudo" com a leitura em curso e outra janela segurando o índice');
  await gravarLivros(pag, 'prova-falhas', [{ url: '/b12-longo.pdf', meta: { id: 'livro-g-longo', hash: 'sha256:g2', titulo: 'Livro G longo' } }]);
  // do zero, para a leitura estar no meio do G quando ela apagar
  conf('o índice foi apagado à mão para ler de novo', await apagarIndiceAMao(pag), 'apagou');
  const segura = await novaJanela(pag);
  await segura.setBypassServiceWorker(true);
  await segura.goto(amb.ORIGEM + '/vazio-b12.html');
  conf('a janela que segura o índice não é o aplicativo', await segura.evaluate(() => typeof window.IndiceLivros), 'undefined');
  const segurou = await segura.evaluate(() => new Promise(r => {
    // a janela "congelada": abre o índice e nunca fecha, nem quando pedem
    const q = indexedDB.open('indice-livros', 1);
    q.onupgradeneeded = () => { q.result.createObjectStore('livros', { keyPath: 'id' }); q.result.createObjectStore('paginas', { keyPath: ['id', 'pagina'] }); };
    q.onsuccess = () => { window.__presa = q.result; r('segura'); };
    q.onerror = () => r('erro');
  }));
  conf('outra janela segura uma conexão com o índice', segurou, 'segura');
  await H.abrirApp(pag, amb.ORIGEM);
  await pag.evaluate(() => {
    window.__b12a = null;
    IndiceLivros.aoMudar(e => {
      if (window.__b12a === null && e.livro === 'livro-g-longo' && e.pagina >= 30) {
        window.__b12a = e.pagina;
        document.querySelector('#apagar-tudo').click();
      }
    });
  });
  const apagado = await esperar('o "Apagar tudo" terminar', () => pag.evaluate(() => ({
    aviso: (document.querySelector('#aviso-texto') || {}).textContent || '', clicou: window.__b12a })),
  v => !!v && /Todos os dados foram apagados/.test(v.aviso), 30000);
  conf('o "Apagar tudo" foi pedido com o Worker no meio de um livro', !!(apagado.valor && apagado.valor.clicou), true);
  prop('o "Apagar tudo" terminou, com a outra janela segurando o índice', apagado.ok, '--envenenado-apagar-espera-indice');
  const depoisDeApagar = await esperar('os alunos saírem', () => pag.evaluate(() => Promise.all([Store.carregar(), Store.listarLivros()])
    .then(x => (x[0] ? x[0].alunos.length : '?') + '/' + x[1].length)), v => v === '0/8', 20000);
  conf('os alunos saíram e os oito livros ficaram', depoisDeApagar.valor, '0/8');
  const parouTudo = await estado(pag);
  conf('a leitura parou e não volta na mesma sessão', parouTudo.parado + '/' + parouTudo.rodando, 'true/false');
  await segura.evaluate(() => window.__presa.close());
  await segura.close();
  const sumiu = await esperar('o banco do índice sumir', () => bancosAbertos(pag), l => !!l && !l.some(n => n.indexOf('indice-livros@') === 0), 20000);
  conf('fechada a outra janela, o banco do índice sumiu', sumiu.ok, true);
  await pausa(1500);
  const aindaSemIndice = await bancosAbertos(pag);
  conf('o índice não volta na mesma sessão', aindaSemIndice.some(n => n.indexOf('indice-livros@') === 0), false);
  conf('o banco principal continua na versão 6 depois do "Apagar tudo"', aindaSemIndice.indexOf('apoio-educacional@6') >= 0, true);

  secao('14. Erros de página');
  conf('nenhum erro de página', pag.errosDePagina.join(' | '), '');
  if (MODO) conf('a rodada envenenada chegou ao ponto do veneno ' + MODO, 'não chegou', 'chegou');
})().then(() => H.fim(amb)(), e => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e)));
