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
 *   8. o "Apagar tudo" apaga o banco do índice (os livros ficam);
 *   9. nenhum erro de página.
 *
 * Modos envenenados (cada um serve um arquivo do app com o defeito, e a prova
 * TEM de ver o defeito: "VENENO visto"):
 *   --envenenado-indice-na-copia  o store.js servido põe as páginas do
 *                                 índice na cópia de segurança;
 *   --envenenado-refaz-indexado   o indice-livros.js servido refaz o livro
 *                                 pronto (decidir não reconhece o pronto);
 *   --envenenado-com-acento       a normalização não tira o acento: "fracoes"
 *                                 não acha "Frações".
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
const VENENOS = ['--envenenado-indice-na-copia', '--envenenado-refaz-indexado', '--envenenado-com-acento'];
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

// as âncoras dos venenos: cada uma tem de aparecer exatamente uma vez
const COPIA_FECHA = /pacote\.biblioteca = \{ uso: \(bib\[0\] \|\| \[\]\)\.filter\(function \(r\) \{\r?\n        return idsAlunos\[r\.alunoId\] && idsAulas\[r\.aulaId\];\r?\n      \}\), etiquetas: bib\[1\] \|\| \[\], listas: bib\[2\] \|\| \[\] \};\r?\n      return pacote;/g;
const COPIA_COM_INDICE = "pacote.biblioteca = { uso: bib[0] || [], etiquetas: bib[1] || [], listas: bib[2] || [] };\n" +
  "      return new Promise(function (ok) { try { var q = indexedDB.open('indice-livros', 1); q.onsuccess = function () { var b = q.result; " +
  "try { var g = b.transaction('paginas').objectStore('paginas').getAll(); g.onsuccess = function () { b.close(); pacote.indiceLivros = g.result; ok(pacote); }; " +
  "g.onerror = function () { b.close(); ok(pacote); }; } catch (e) { b.close(); ok(pacote); } }; q.onerror = function () { ok(pacote); }; } catch (e) { ok(pacote); } });";
const PRONTO = "if (reg.pronto) return 'pronto';";
const SEM_ACENTO = ".replace(/[\\u0300-\\u036f]/g, '')";

secao('0. As âncoras e os venenos');
conf('a lista de venenos não está vazia', VENENOS.length > 0, true);
conf('a âncora da cópia (exportarTudo fecha o pacote) aparece uma vez no store.js', (STORE.match(COPIA_FECHA) || []).length, 1);
conf('a âncora do livro pronto (decidir) aparece uma vez no indice-livros.js', INDICE.split(PRONTO).length - 1, 1);
conf('a âncora do acento (normalizar) aparece uma vez no indice-livros.js', INDICE.split(SEM_ACENTO).length - 1, 1);
conf('o banco principal continua na versão 6 no store.js', /var VERSAO_BANCO = 6;/.test(STORE), true);

const trocas = {};
if (MODO === '--envenenado-indice-na-copia') trocas['/store.js'] = STORE.replace(COPIA_FECHA, COPIA_COM_INDICE);
if (MODO === '--envenenado-refaz-indexado') trocas['/indice-livros.js'] = INDICE.split(PRONTO).join("if (reg.pronto) return 'refazer';");
if (MODO === '--envenenado-com-acento') trocas['/indice-livros.js'] = INDICE.split(SEM_ACENTO).join('');
if (MODO) {
  const servido = trocas['/store.js'] || trocas['/indice-livros.js'];
  const original = trocas['/store.js'] ? STORE : INDICE;
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
const buscar = (pag, termo, filtros) => pag.evaluate((t, f) => buscarNosLivros(t, f), termo, filtros || {});

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

  await amb.subir();
  const pag = await amb.pagina();
  await relogio.naPagina(pag);
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
    await velha.goto(amb.ORIGEM + '/vazio-b12.html');
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

  secao('8. O "Apagar tudo"');
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => document.querySelector('#apagar-tudo').click());
  const sumiu = await esperar('o banco do índice sumir', () => bancosAbertos(pag), l => !!l && !l.some(n => n.indexOf('indice-livros@') === 0), 20000);
  conf('o "Apagar tudo" apagou o banco do índice', sumiu.ok, true);
  const depoisDeApagar = await esperar('os alunos saírem', () => pag.evaluate(() => Promise.all([Store.carregar(), Store.listarLivros()])
    .then(x => (x[0] ? x[0].alunos.length : '?') + '/' + x[1].length)), v => v === '0/4', 20000);
  conf('os alunos saíram e os quatro livros ficaram', depoisDeApagar.valor, '0/4');
  await pausa(1500);
  const aindaSemIndice = await bancosAbertos(pag);
  conf('o índice não volta na mesma sessão', aindaSemIndice.some(n => n.indexOf('indice-livros@') === 0), false);
  conf('o banco principal continua na versão 6 depois do "Apagar tudo"', aindaSemIndice.indexOf('apoio-educacional@6') >= 0, true);

  secao('9. Erros de página');
  conf('nenhum erro de página', pag.errosDePagina.join(' | '), '');
  if (MODO) conf('a rodada envenenada chegou ao ponto do veneno ' + MODO, 'não chegou', 'chegou');
})().then(() => H.fim(amb)(), e => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e)));
