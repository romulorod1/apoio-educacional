/* testa_livros.js
 *
 * C15.1: os livros de referência. O pacote de prova é SINTÉTICO, gerado na
 * hora pelo próprio gerador (biblioteca/_amostra/fazer_amostra_livros.py
 * --pacote): três PDFs (um com marcadores e uma figura de 1,2 MB, um com o
 * sumário vindo do mapa, um sem sumário) e um EPUB de três capítulos. Nenhum
 * livro comercial.
 *
 * O que se prova:
 *   1. o banco sobe de 3 para 4 sem perder nada: montado pelo código da versão
 *      3 (o store.js deste commit sem os depósitos dos livros e com o número
 *      3), com dados fictícios em cada depósito; o código novo abre, sobe, as
 *      contagens são as mesmas, e os dois depósitos novos nascem vazios;
 *   2. "Importar biblioteca", em Ajustes, recebe o pacote de livros: os quatro
 *      vão para o depósito livros (e nenhum para os pacotes de exercícios), e
 *      a lista de Ajustes mostra cada um com o tamanho e o total;
 *   3. O ACEITE DO DONO: a cópia de segurança exportada não leva os livros. O
 *      tamanho dela é medido antes e depois de importar (pelo exportarTudo e
 *      pelo botão de verdade), e não cresce mais que alguns KB, com 1,2 MB de
 *      livro no tablet;
 *   4. o PDF abre pela aba Biblioteca, botão Livros; o Sumário leva ao
 *      capítulo 2 (página 3, a do retângulo azul); Próxima vai à 4; fechar e
 *      abrir de novo, e recarregar o aplicativo, abre na 4;
 *   5. o EPUB abre num leitor próprio, numa caixa isolada (sandbox sem
 *      scripts): o script, o onerror e o link para fora do capítulo 2 não
 *      rodam nem levam a lugar nenhum, nada vai para a rede; Próximo troca de
 *      capítulo, o link de dentro do livro leva ao capítulo 3, o Sumário leva
 *      ao meio do capítulo 2, e reabrir volta ao mesmo capítulo e rolagem;
 *   6. Remover um livro em Ajustes: o total cai exatamente o tamanho dele, e
 *      importar o mesmo pacote de novo devolve só o que faltava;
 *   7. memória (revisão do C15.1): um pacote de dez livros de 4 MB é lido
 *      livro a livro, em trechos; nenhuma leitura passa de um livro, e a
 *      memória dos processos do navegador não sobe o pacote inteiro;
 *   8. Apagar tudo: os livros ficam, a posição de leitura sai, e a pergunta
 *      diz que os livros ficam;
 *   9. nenhum erro de página.
 *
 * Modos envenenados:
 *   --envenenado-copia-com-livros  o store.js servido põe os livros na cópia
 *                                  de segurança: a cópia tem de crescer.
 *   --envenenado-epub-com-scripts  a caixa do EPUB deixa scripts rodarem
 *                                  (sandbox e CSP soltos): um script posto
 *                                  dentro dela tem de rodar.
 *   --envenenado-sem-posicao       o PDF não guarda a página: reabrir tem de
 *                                  voltar à página 1.
 *   --envenenado-destroy           o doc.destroy() do C14 de volta: o segundo
 *                                  PDF da sessão tem de falhar.
 *   --envenenado-zip-inteiro       o arquivo do pacote lido inteiro antes de
 *                                  abrir: a maior leitura tem de ser o pacote
 *                                  e a memória tem de subir mais que ele.
 *
 *   --prints <pasta>   grava três prints (a gestão em Ajustes, o PDF com o
 *                      sumário aberto, o EPUB aberto).
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const H = require('./_bib_navegador');
const { conf, secao, esperar, pausa } = H;

const PORTA = 8862;
const VENENOS = ['--envenenado-copia-com-livros', '--envenenado-epub-com-scripts', '--envenenado-sem-posicao',
  '--envenenado-destroy', '--envenenado-zip-inteiro'];
const MODO = VENENOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const iPrints = process.argv.indexOf('--prints');
const PRINTS = iPrints > 0 ? process.argv[iPrints + 1] : null;
const PYTHON = process.env.PYTHON || 'python';

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const STORE = fs.readFileSync(path.join(H.RAIZ, 'store.js'), 'utf8');
const V3 = 'var VERSAO_BANCO = 3;';
const V4 = 'var VERSAO_BANCO = 4;';
const CRIA_LIVROS = /    if \(!b\.objectStoreNames\.contains\('livros'\)\) \{\r?\n      s = b\.createObjectStore\('livros', \{ keyPath: 'id' \}\);\r?\n      s\.createIndex\('pacote', 'pacote'\);\r?\n    \}\r?\n    if \(!b\.objectStoreNames\.contains\('livros_posicoes'\)\) \{\r?\n      b\.createObjectStore\('livros_posicoes', \{ keyPath: 'id' \}\);\r?\n    \}\r?\n/;
// os pontos que os venenos trocam, cada um tem de existir exatamente uma vez
const COPIA_FECHA = /pacote\.biblioteca = \{ uso: bib\[0\] \|\| \[\], etiquetas: bib\[1\] \|\| \[\], listas: bib\[2\] \|\| \[\] \};\r?\n      return pacote;/;
const COPIA_COM_LIVROS = "pacote.biblioteca = { uso: bib[0] || [], etiquetas: bib[1] || [], listas: bib[2] || [] };\n" +
  "      return todosOsValores('livros').then(function (ls) { return Promise.all(ls.map(function (l) { return blobParaTexto(l.blob); })); })" +
  ".then(function (t) { pacote.livros = t; return pacote; });";
const SANDBOX = "quadro.setAttribute('sandbox', 'allow-same-origin');";
const GUARDA_PAGINA = "Store.gravarPosicaoLivro({ id: id, pagina: n })";

const STORE_V3 = STORE.replace(V4, V3).replace(CRIA_LIVROS, '');
const trocas = {};
let APP_SERVIDO = APP, STORE_SERVIDO = STORE;
if (MODO === '--envenenado-copia-com-livros') STORE_SERVIDO = STORE.replace(COPIA_FECHA, COPIA_COM_LIVROS);
/* A caixa do EPUB tem duas travas contra script: o sandbox sem allow-scripts
 * e a CSP sem script-src. O veneno solta as DUAS, para provar que o teste vê
 * um script rodando quando ele roda; cada trava sozinha é conferida no modo
 * normal (o atributo sandbox e a CSP lidos na página). */
const CSP_DO_EPUB = "var EPUB_CSP = \"default-src 'none'; img-src";
if (MODO === '--envenenado-epub-com-scripts') {
  APP_SERVIDO = APP.split(SANDBOX).join("quadro.setAttribute('sandbox', 'allow-same-origin allow-scripts');")
    .split(CSP_DO_EPUB).join("var EPUB_CSP = \"default-src 'none'; script-src 'unsafe-inline'; img-src");
}
if (MODO === '--envenenado-sem-posicao') APP_SERVIDO = APP.split(GUARDA_PAGINA).join('Promise.resolve()');
// o C14 chamava doc.destroy(), que o PDF.js 6 não tem: o segundo PDF da sessão caía
const SOLTA_DOC = '    soltarDocPdf(velho);';
if (MODO === '--envenenado-destroy') APP_SERVIDO = APP.split(SOLTA_DOC).join('    velho.destroy();');
// a revisão do C15.1: o arquivo inteiro na memória antes de abrir o pacote
const ESPIA = 'Biblioteca.espiarPacote(arquivo).then(';
if (MODO === '--envenenado-zip-inteiro') {
  APP_SERVIDO = APP.split(ESPIA).join('arquivo.arrayBuffer().then(function (b) { return Biblioteca.espiarPacote(new Blob([b])); }).then(');
}
const amb = H.criarAmbiente(PORTA, 'nath_c15_livros', trocas);

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'c15_livros_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

function gerarPacote(opcao) {
  const r = spawnSync(PYTHON, ['-X', 'utf8', path.join(H.RAIZ, 'biblioteca', '_amostra', 'fazer_amostra_livros.py'), TMP,
    opcao || '--pacote'], { encoding: 'utf8' });
  const linhas = String(r.stdout || '').trim().split(/\r?\n/);
  const zip = linhas[linhas.length - 1];
  if (r.status !== 0 || !zip || !fs.existsSync(zip)) {
    console.log(String(r.stderr || '').slice(0, 800));
    return null;
  }
  return zip;
}

const lerEstado = pag => pag.evaluate(() => {
  const c = document.querySelector('#estado-importacao-biblioteca');
  return c ? c.innerText.trim() : null;
});

async function importar(pag, arquivo, rotulo) {
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => { document.querySelector('#estado-importacao-biblioteca').innerHTML = ''; });
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar(rotulo, () => Promise.all([lerEstado(pag), pag.$eval('#importar-biblioteca', b => b.disabled)]),
    v => !!v && !!v[0] && !/Conferindo|Gravando/.test(v[0]) && v[1] === false, 60000);
  return (r.valor && r.valor[0]) || '';
}

// o tamanho da cópia de segurança, em bytes: o mesmo JSON que o botão monta
const tamanhoDaCopia = pag => pag.evaluate(() => Store.carregar().then(d => Store.exportarTudo(d))
  .then(p => new Blob([JSON.stringify(p)]).size));
// e pelo botão de verdade: o aviso "Cópia pronta, N KB"
async function copiaPeloBotao(pag) {
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => { const a = document.querySelector('#aviso-texto'); if (a) a.textContent = ''; document.querySelector('#baixar-copia').click(); });
  const r = await esperar('o aviso da cópia pronta', () => pag.evaluate(() => (document.querySelector('#aviso-texto') || {}).textContent || ''),
    t => /Cópia pronta, \d+ KB/.test(t || ''), 20000);
  const m = /Cópia pronta, (\d+) KB/.exec(r.valor || '');
  return m ? Number(m[1]) : null;
}

const versaoEDepositos = pag => pag.evaluate(() => new Promise(r => {
  const q = indexedDB.open('apoio-educacional');
  q.onsuccess = () => { const b = q.result; const s = { versao: b.version, depositos: Array.from(b.objectStoreNames).sort() }; b.close(); r(s); };
  q.onerror = () => r(null);
}));
const contagens = pag => pag.evaluate(() => new Promise(r => {
  const q = indexedDB.open('apoio-educacional');
  q.onsuccess = () => {
    const b = q.result;
    const nomes = Array.from(b.objectStoreNames).sort();
    const t = b.transaction(nomes, 'readonly');
    const saida = {};
    nomes.forEach(n => { const c = t.objectStore(n).count(); c.onsuccess = () => { saida[n] = c.result; }; });
    const g = t.objectStore('dados').get('principal');
    g.onsuccess = () => { const d = g.result || {}; saida.alunos = (d.alunos || []).length; saida.aulas = (d.aulas || []).length; };
    t.oncomplete = () => { b.close(); r(saida); };
  };
}));

// pixels perto de uma cor no canvas do leitor de PDF, um a cada sete
const pixelsDaCor = (pag, rgb) => pag.evaluate(cor => {
  const c = document.querySelector('#corpo-modal-leitor-pdf canvas');
  if (!c) return -1;
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 4 * 7) {
    if (Math.abs(d[i] - cor[0]) < 40 && Math.abs(d[i + 1] - cor[1]) < 40 && Math.abs(d[i + 2] - cor[2]) < 40) n++;
  }
  return n;
}, rgb);
const AZUL = [26, 51, 217];

const paginaDesenhada = pag => pag.evaluate(() => {
  const c = document.querySelector('#corpo-modal-leitor-pdf');
  return c && document.querySelector('#modal-leitor-pdf.aberto') ? (c.dataset.paginaDesenhada || '') : 'fechado';
});
const epubAberto = pag => pag.evaluate(() => {
  const c = document.querySelector('#corpo-modal-leitor-epub');
  return c && document.querySelector('#modal-leitor-epub.aberto') ? (c.dataset.capituloAberto || '') : 'fechado';
});
const noQuadro = (pag, f) => pag.evaluate(f);

async function abrirPelaEstante(pag, id) {
  await H.irParaAba(pag, 'biblioteca');
  await esperar('o botão Livros na aba Biblioteca', () => pag.evaluate(() => !!document.querySelector('#btn-livros')), v => v, 10000);
  await pag.evaluate(() => document.querySelector('#btn-livros').click());
  await esperar('a estante com o livro ' + id, () => pag.evaluate(i => !!document.querySelector('#corpo-modal-livros [data-livro="' + i + '"]'), id), v => v, 10000);
  await pag.evaluate(i => document.querySelector('#corpo-modal-livros [data-livro="' + i + '"]').click(), id);
}

async function fecharModal(pag, id) {
  await pag.evaluate(i => { const b = document.querySelector('#' + i + ' .modal-rodape [data-fechar]'); if (b) b.click(); }, id);
  await esperar('a janela ' + id + ' fechou', () => pag.evaluate(i => !document.querySelector('#' + i + '.aberto'), id), v => v, 5000);
}

async function printar(pag, nome) {
  if (!PRINTS) return;
  fs.mkdirSync(PRINTS, { recursive: true });
  // o aviso da cópia, de um passo anterior, não entra no print
  await pag.evaluate(() => { const a = document.querySelector('#aviso'); if (a) a.classList.remove('aberto'); });
  await pausa(300);
  await pag.screenshot({ path: path.join(PRINTS, nome) });
  console.log('   print: ' + path.join(PRINTS, nome));
}

(async () => {
  secao('0. As âncoras e o veneno');
  conf('o store.js está na versão 4', STORE.split(V4).length, 2);
  conf('o store.js cria os depósitos dos livros uma vez', (STORE.match(new RegExp(CRIA_LIVROS.source, 'g')) || []).length, 1);
  conf('o código da versão 3 ficou sem os livros', STORE_V3.indexOf("createObjectStore('livros'") < 0 && STORE_V3.split(V3).length === 2, true);
  conf('a cópia fecha num lugar só', (STORE.match(new RegExp(COPIA_FECHA.source, 'g')) || []).length, 1);
  conf('a caixa do EPUB nasce num lugar só', APP.split(SANDBOX).length, 2);
  conf('e a CSP dela também', APP.split(CSP_DO_EPUB).length, 2);
  conf('a página do PDF é guardada num lugar só', APP.split(GUARDA_PAGINA).length, 2);
  conf('o documento velho do PDF é solto num lugar só', APP.split(SOLTA_DOC).length, 2);
  conf('o pacote é espiado num lugar só', APP.split(ESPIA).length, 2);
  if (MODO) {
    conf('um arquivo servido ficou diferente do repositório (' + MODO + ')',
      (APP_SERVIDO !== APP ? 1 : 0) + (STORE_SERVIDO !== STORE ? 1 : 0), 1);
  }
  const ZIP = gerarPacote();
  conf('o gerador fez o pacote de prova', !!ZIP, true);
  if (!ZIP) throw Object.assign(new Error('sem pacote'), { jaContado: true });
  // o manifest lido pelo mesmo leitor de zip do aplicativo (zip.js roda no Node)
  const Zip = require(path.join(H.RAIZ, 'zip.js'));
  const zipLido = Zip.ler(fs.readFileSync(ZIP));
  const manifest = JSON.parse(Buffer.from(await Zip.extrair(zipLido,
    zipLido.entradas.find(e => e.nome === 'manifest.json'))).toString('utf8'));
  const bytesDe = {};
  manifest.livros.forEach(l => { bytesDe[l.id] = l.bytes; });
  const totalDosLivros = manifest.livros.reduce((s, l) => s + l.bytes, 0);
  console.log('   pacote: ' + manifest.livros.length + ' livros, ' + totalDosLivros + ' bytes');
  conf('o pacote de prova tem mais de 1 MB de livro', totalDosLivros > 1024 * 1024, true);

  await amb.subir();
  const pedidos = [];

  // ================================================================
  secao('1. A subida de 3 para 4 não perde nada');
  trocas['/store.js'] = STORE_V3;
  const pag = await amb.pagina();
  await pag.setBypassServiceWorker(true);
  await H.abrirApp(pag, amb.ORIGEM);
  await pausa(800);
  const v3 = await versaoEDepositos(pag);
  conf('o banco montado pelo código de antes está na versão 3', v3 && v3.versao, 3);
  conf('e não tem os depósitos dos livros', v3 && v3.depositos.filter(d => /^livros/.test(d)).length, 0);
  await pag.evaluate(async () => {
    const d = await Store.carregar();
    d.alunos = [1, 2].map(k => ({ id: 'a' + k, nome: 'Aluna Livro Teste ' + k, ativo: true, precos: [] }));
    d.aulas = [];
    for (let k = 0; k < 30; k++) d.aulas.push({ id: 'aula' + k, alunoId: 'a' + (1 + k % 2), data: '2026-06-' + String(1 + k % 28).padStart(2, '0'),
      hora: '10:00', duracaoMin: 60, status: 'realizada', cobravel: true, temas: [], areas: [], anexos: [] });
    await Store.salvar(d);
    await Store.salvarNota('aula1', { paginas: [{ itens: [] }] });
    await Store.registrarUsoBiblioteca({ itemId: 'x:1', alunoId: 'a1', aulaId: 'aula1', data: '2026-06-02' });
    await Store.gravarEtiquetaBiblioteca({ itemId: 'x:1', dificuldade: 2, data: '2026-06-02' });
    await Store.gravarListaBiblioteca({ id: 'l1', titulo: 'Lista de prova', nivel: null, itens: ['x:1'], paginas: [], criadaEm: 1, editadaEm: 1 });
    await Store.registrarHistorico('ponto de prova', d);
  });
  const antes = await contagens(pag);
  await pag.close();
  trocas['/store.js'] = STORE_SERVIDO;
  if (APP_SERVIDO !== APP) trocas['/app.js'] = APP_SERVIDO;
  const p = await amb.pagina();
  await p.setBypassServiceWorker(true);
  p.on('request', r => pedidos.push(r.url()));
  await H.abrirApp(p, amb.ORIGEM);
  await pausa(800);
  const v4 = await versaoEDepositos(p);
  conf('o código novo subiu o banco para a versão 4', v4 && v4.versao, 4);
  conf('com os dois depósitos dos livros', v4 && v4.depositos.filter(d => /^livros/.test(d)).join(','), 'livros,livros_posicoes');
  const depois = await contagens(p);
  const chaves = Object.keys(antes).sort();
  conf('as contagens de antes, depósito por depósito, são as de depois',
    chaves.map(k => k + '=' + antes[k]).join(' '), chaves.map(k => k + '=' + depois[k]).join(' '));
  conf('e os depósitos novos começam vazios', depois.livros + '+' + depois.livros_posicoes, '0+0');
  conf('sem livro, a aba Biblioteca não ganha o botão Livros', await p.evaluate(() => !!document.querySelector('#btn-livros')), false);

  // ================================================================
  secao('2. Importar o pacote de livros em Ajustes');
  const copiaAntes = await tamanhoDaCopia(p);
  const kbAntes = await copiaPeloBotao(p);
  const estado = await importar(p, ZIP, 'a importação dos livros');
  console.log('   estado: ' + JSON.stringify(estado));
  conf('a tela diz que os livros entraram', /Livros importados\./.test(estado) && /4 livros novos/.test(estado), true);
  conf('os quatro estão no depósito livros', await H.contarDeposito(p, 'livros'), 4);
  conf('e nenhum foi para os pacotes de exercícios', await H.contarDeposito(p, 'biblioteca_pacotes'), 0);
  const gestao = await p.evaluate(() => ({
    linhas: Array.from(document.querySelectorAll('#lista-livros-biblioteca [data-livro]')).map(x => x.innerText.replace(/\s+/g, ' ')),
    total: (document.querySelector('#livros-total') || {}).textContent || '',
    bytes: Number((document.querySelector('#livros-total') || { dataset: {} }).dataset.bytes)
  }));
  console.log('   gestão: ' + JSON.stringify(gestao));
  conf('Ajustes lista os quatro livros', gestao.linhas.length, 4);
  conf('cada um com o tamanho em MB e o Remover', gestao.linhas.every(t => /MB/.test(t) && /Remover/.test(t)), true);
  conf('e o total dos quatro', gestao.bytes, totalDosLivros);
  conf('o total escrito', /^4 livros, 1,2 MB no total$/.test(gestao.total), true);
  await p.evaluate(() => document.querySelector('#lista-livros-biblioteca').scrollIntoView({ block: 'center' }));
  await printar(p, 'c15_gestao_livros.png');

  // ================================================================
  secao('3. A cópia de segurança não leva os livros (aceite do dono)');
  const copiaDepois = await tamanhoDaCopia(p);
  const kbDepois = await copiaPeloBotao(p);
  console.log('   cópia: ' + copiaAntes + ' bytes antes, ' + copiaDepois + ' depois (' + (copiaDepois - copiaAntes) +
    '); pelo botão: ' + kbAntes + ' KB antes, ' + kbDepois + ' KB depois; livros: ' + totalDosLivros + ' bytes');
  if (MODO === '--envenenado-copia-com-livros') {
    secao('VENENO: a cópia leva os livros');
    conf('envenenado: a cópia cresceu mais que o livro de 1,2 MB (defeito enxergado)', copiaDepois - copiaAntes > 1024 * 1024, true);
    throw Object.assign(new Error('fim'), { fimDoVeneno: true });
  }
  conf('a cópia não cresce mais que 4 KB com 1,2 MB de livro no tablet', copiaDepois - copiaAntes <= 4096, true);
  conf('nem pelo botão (no máximo 4 KB a mais)', kbAntes !== null && kbDepois !== null && kbDepois - kbAntes <= 4, true);
  const texto = await p.evaluate(() => Store.carregar().then(d => Store.exportarTudo(d)).then(x => JSON.stringify(x)));
  conf('e a cópia não cita livro nem traz PDF', /livro-com-marcadores|livros_posicoes|JVBERi0/.test(texto), false);

  // ================================================================
  secao('4. O PDF: sumário, capítulo 2, e abre onde parou');
  await abrirPelaEstante(p, 'livro-com-marcadores');
  const p1 = await esperar('a página 1 desenhada', () => paginaDesenhada(p), v => v === '1', 30000);
  conf('o PDF abre na página 1 da primeira vez', p1.ok, true);
  conf('com o botão Sumário', await p.evaluate(() => !document.querySelector('#leitor-sumario').hidden), true);
  await p.evaluate(() => document.querySelector('#leitor-sumario').click());
  const entradas = await p.evaluate(() => Array.from(document.querySelectorAll('#leitor-sumario-lista [data-entrada]')).map(b => b.textContent));
  console.log('   sumário: ' + JSON.stringify(entradas));
  conf('o sumário traz as quatro entradas do livro', entradas.length, 4);
  await printar(p, 'c15_pdf_sumario.png');
  await p.evaluate(() => Array.from(document.querySelectorAll('#leitor-sumario-lista [data-entrada]'))
    .find(b => /Capítulo 2/.test(b.textContent)).click());
  const p3 = await esperar('a página 3 desenhada', () => paginaDesenhada(p), v => v === '3', 15000);
  conf('o toque no capítulo 2 leva à página 3', p3.ok, true);
  conf('a página 3 é a do capítulo 2 (o retângulo azul)', (await pixelsDaCor(p, AZUL)) > 500, true);
  conf('e o sumário fecha', await p.evaluate(() => document.querySelector('#leitor-sumario-lista').hidden), true);
  await p.evaluate(() => document.querySelector('#leitor-proxima').click());
  conf('Próxima vai à 4', (await esperar('a página 4', () => paginaDesenhada(p), v => v === '4', 15000)).ok, true);
  await pausa(300);
  await fecharModal(p, 'modal-leitor-pdf');
  await abrirPelaEstante(p, 'livro-com-marcadores');
  const reaberto = await esperar('a página reaberta', () => paginaDesenhada(p), v => /^\d+$/.test(v || ''), 30000);
  if (MODO === '--envenenado-destroy') {
    secao('VENENO: o doc.destroy() do C14 de volta');
    conf('envenenado: o segundo PDF da sessão não abre (defeito enxergado)', reaberto.ok, false);
    throw Object.assign(new Error('fim'), { fimDoVeneno: true });
  }
  if (MODO === '--envenenado-sem-posicao') {
    secao('VENENO: o PDF não guarda a página');
    conf('envenenado: reabre na página 1 (defeito enxergado)', reaberto.valor, '1');
    throw Object.assign(new Error('fim'), { fimDoVeneno: true });
  }
  conf('fechar e abrir de novo volta à página 4', reaberto.valor, '4');
  await fecharModal(p, 'modal-leitor-pdf');
  await H.abrirApp(p, amb.ORIGEM);
  await abrirPelaEstante(p, 'livro-com-marcadores');
  conf('e depois de recarregar o aplicativo também', (await esperar('a página depois de recarregar', () => paginaDesenhada(p),
    v => /^\d+$/.test(v || ''), 30000)).valor, '4');
  await fecharModal(p, 'modal-leitor-pdf');
  await abrirPelaEstante(p, 'livro-sem-sumario');
  await esperar('o livro sem sumário aberto', () => paginaDesenhada(p), v => v === '1', 30000);
  conf('o livro sem sumário não mostra o botão, e diz por quê', await p.evaluate(() =>
    document.querySelector('#leitor-sumario').hidden && /não tem sumário/.test(document.querySelector('#leitor-dica').textContent)), true);
  await fecharModal(p, 'modal-leitor-pdf');

  // ================================================================
  secao('5. O EPUB: caixa isolada, capítulos, sumário e posição');
  await p.evaluate(() => { window.__epubRodou = undefined; });
  const antesDoEpub = pedidos.length;
  await abrirPelaEstante(p, 'livro-de-prova');
  conf('o EPUB abre no capítulo 1', (await esperar('o capítulo 1', () => epubAberto(p), v => v === '1', 20000)).ok, true);
  const q1 = await noQuadro(p, () => {
    const q = document.querySelector('#epub-quadro');
    const d = q && q.contentDocument;
    const img = d && d.querySelector('img');
    return { sandbox: q && q.getAttribute('sandbox'), texto: d ? d.body.innerText.slice(0, 60) : '',
      img: img ? { blob: /^blob:/.test(img.src), largura: img.naturalWidth } : null,
      csp: d ? (d.querySelector('meta[http-equiv="Content-Security-Policy"]') || {}).content || '' : '' };
  });
  console.log('   capítulo 1: ' + JSON.stringify(q1));
  if (MODO !== '--envenenado-epub-com-scripts') {
    conf('o capítulo vai numa caixa com sandbox sem scripts', q1.sandbox, 'allow-same-origin');
  }
  conf('com o texto do capítulo 1', /Capítulo 1: O começo/.test(q1.texto), true);
  conf('a figura do livro aparece, de dentro do próprio livro', !!q1.img && q1.img.blob && q1.img.largura === 40, true);
  conf('e a página proíbe a rede', /default-src 'none'/.test(q1.csp), true);
  if (MODO !== '--envenenado-epub-com-scripts') {
    conf('e script de qualquer tipo (a CSP não abre script-src)', /script-src/.test(q1.csp), false);
  }
  await p.evaluate(() => document.querySelector('#epub-proximo').click());
  conf('Próximo leva ao capítulo 2', (await esperar('o capítulo 2', () => epubAberto(p), v => v === '2', 15000)).ok, true);
  await pausa(500);
  const q2 = await noQuadro(p, () => {
    const d = document.querySelector('#epub-quadro').contentDocument;
    return { texto: d.body.innerText.slice(0, 40), scripts: d.querySelectorAll('script').length,
      comHref: d.querySelectorAll('[href]').length, comOn: d.querySelectorAll('[onerror]').length,
      internos: Array.from(d.querySelectorAll('[data-epub-href]')).map(a => a.getAttribute('data-epub-href')),
      rodou: window.__epubRodou === undefined ? null : window.__epubRodou, titulo: document.title };
  });
  console.log('   capítulo 2: ' + JSON.stringify(q2));
  if (MODO === '--envenenado-epub-com-scripts') {
    // o veneno solta só a caixa; a limpeza tira o <script>, então quem tem de
    // rodar é o que sobra de código: aqui, um script posto pelo próprio teste
    const rodou = await noQuadro(p, () => {
      const d = document.querySelector('#epub-quadro').contentDocument;
      const s = d.createElement('script');
      s.textContent = 'window.parent.__epubRodou = "veneno";';
      d.body.appendChild(s);
      return window.__epubRodou || null;
    });
    secao('VENENO: a caixa deixa scripts rodarem');
    conf('envenenado: um script dentro da caixa rodou (defeito enxergado)', rodou, 'veneno');
    throw Object.assign(new Error('fim'), { fimDoVeneno: true });
  }
  conf('o capítulo 2 aparece', /Capítulo 2: O meio/.test(q2.texto), true);
  conf('sem o <script> do livro', q2.scripts, 0);
  conf('sem atributo de evento', q2.comOn, 0);
  conf('nenhum link com endereço (o de fora não leva a lugar nenhum)', q2.comHref, 0);
  conf('o link de dentro do livro vira toque para o capítulo 3', q2.internos.join(','), 'OEBPS/texto/cap3.xhtml#meio');
  conf('nada do livro rodou', q2.rodou, null);
  // e um script posto à força dentro da caixa também não roda
  const forcado = await noQuadro(p, () => {
    const d = document.querySelector('#epub-quadro').contentDocument;
    const s = d.createElement('script');
    s.textContent = 'window.parent.__epubRodou = "forcado";';
    d.body.appendChild(s);
    return window.__epubRodou === undefined ? null : window.__epubRodou;
  });
  conf('nem um script posto à força dentro da caixa', forcado, null);
  await noQuadro(p, () => document.querySelector('#epub-quadro').contentDocument.querySelector('[data-epub-href]').click());
  conf('o link de dentro do livro leva ao capítulo 3', (await esperar('o capítulo 3', () => epubAberto(p), v => v === '3', 15000)).ok, true);
  await p.evaluate(() => document.querySelector('#epub-sumario').click());
  const entradasEpub = await p.evaluate(() => Array.from(document.querySelectorAll('#epub-sumario-lista [data-entrada]')).map(b => b.textContent));
  conf('o sumário do EPUB traz as quatro entradas', entradasEpub.length, 4);
  await p.evaluate(() => Array.from(document.querySelectorAll('#epub-sumario-lista [data-entrada]'))
    .find(b => /Meio do capítulo 2/.test(b.textContent)).click());
  conf('o sumário leva ao capítulo 2', (await esperar('o capítulo 2 pelo sumário', () => epubAberto(p), v => v === '2', 15000)).ok, true);
  const rolado = await noQuadro(p, () => document.querySelector('#epub-quadro').contentWindow.scrollY);
  conf('e ao meio dele (a página rolou até a âncora)', rolado > 300, true);
  await printar(p, 'c15_epub_aberto.png');
  await pausa(1500);   // o leitor guarda a rolagem a cada segundo
  const salvo = await p.evaluate(() => Store.lerPosicaoLivro('livro-de-prova'));
  console.log('   posição guardada: ' + JSON.stringify(salvo));
  await fecharModal(p, 'modal-leitor-epub');
  await abrirPelaEstante(p, 'livro-de-prova');
  conf('reabrir volta ao capítulo 2', (await esperar('o capítulo reaberto', () => epubAberto(p), v => /^\d+$/.test(v || ''), 15000)).valor, '2');
  const rolado2 = await noQuadro(p, () => document.querySelector('#epub-quadro').contentWindow.scrollY);
  console.log('   rolagem: ' + rolado + ' px antes, ' + rolado2 + ' px depois de reabrir');
  conf('e à mesma rolagem (menos de 40 px de diferença)', Math.abs(rolado2 - rolado) < 40, true);
  const fora = pedidos.slice(antesDoEpub).filter(u => !/^(blob|data|about):/.test(u) && u.indexOf(amb.ORIGEM) !== 0);
  conf('o EPUB não pediu nada à rede de fora', fora.join(' '), '');
  conf('nem ao aplicativo (a imagem quebrada não virou pedido)', pedidos.slice(antesDoEpub).filter(u => /nao-existe|exemplo\.invalid/.test(u)).length, 0);
  await fecharModal(p, 'modal-leitor-epub');

  // ================================================================
  secao('6. Remover um livro e ver o total cair; importar de novo devolve só ele');
  await H.irParaAba(p, 'ajustes');
  const totalAntes = await p.evaluate(() => Number(document.querySelector('#livros-total').dataset.bytes));
  await p.evaluate(() => document.querySelector('[data-remover-livro="livro-sem-sumario"]').click());
  const caiu = await esperar('o total depois de remover', () => p.evaluate(() => {
    const t = document.querySelector('#livros-total');
    return t ? { texto: t.textContent, bytes: Number(t.dataset.bytes) } : null;
  }), v => !!v && /^3 livros/.test(v.texto), 10000);
  conf('a lista diz 3 livros', caiu.ok, true);
  conf('e o total caiu exatamente o tamanho do livro removido', caiu.valor && totalAntes - caiu.valor.bytes, bytesDe['livro-sem-sumario']);
  conf('o livro saiu do depósito', await H.contarDeposito(p, 'livros'), 3);
  conf('o botão da Biblioteca diz 3', await p.evaluate(() => (document.querySelector('#btn-livros') || {}).textContent), 'Livros (3)');
  const de_novo = await importar(p, ZIP, 'a segunda importação');
  console.log('   estado: ' + JSON.stringify(de_novo));
  conf('importar de novo devolve só o que faltava', /1 livro novo/.test(de_novo) && /3 já estavam no tablet/.test(de_novo), true);
  conf('e são quatro de novo', await H.contarDeposito(p, 'livros'), 4);
  conf('a posição do PDF continua lá', ((await p.evaluate(() => Store.lerPosicaoLivro('livro-com-marcadores'))) || {}).pagina, 4);

  // ================================================================
  secao('7. Memória: um pacote de dez livros de 4 MB é lido livro a livro');
  /* Dois instrumentos. O page.metrics() e o performance.memory medem só a
   * pilha do JavaScript e NÃO enxergam ArrayBuffer (conferido em 30/10: 100 MB
   * alocados, os dois continuaram em 2 e 4 MB). Por isso:
   *   - a MAIOR LEITURA de uma vez, contada em toda chamada de arrayBuffer()
   *     de Blob e de File da página: é a causa, e é exata;
   *   - a memória do processo da página (renderer), no sistema, amostrada a
   *     cada 100 ms durante a importação: é o efeito, e tem ruído. */
  const ZIP_VARIOS = gerarPacote('--varios');
  conf('o gerador fez o pacote de vários livros', !!ZIP_VARIOS, true);
  if (!ZIP_VARIOS) throw Object.assign(new Error('sem pacote'), { jaContado: true });
  const zipV = Zip.ler(fs.readFileSync(ZIP_VARIOS));
  const manV = JSON.parse(Buffer.from(await Zip.extrair(zipV, zipV.entradas.find(e => e.nome === 'manifest.json'))).toString('utf8'));
  const maiorLivro = Math.max.apply(null, manV.livros.map(l => l.bytes));
  const tamPacote = fs.statSync(ZIP_VARIOS).size;
  console.log('   pacote: ' + manV.livros.length + ' livros, ' + tamPacote + ' bytes; maior livro ' + maiorLivro + ' bytes');
  conf('o pacote tem pelo menos cinco vezes o maior livro', tamPacote > 5 * maiorLivro, true);
  await p.evaluate(() => {
    window.__maiorLeitura = 0;
    const ab = Blob.prototype.arrayBuffer;
    Blob.prototype.arrayBuffer = function () { window.__maiorLeitura = Math.max(window.__maiorLeitura, this.size); return ab.call(this); };
    const fr = FileReader.prototype.readAsArrayBuffer;
    FileReader.prototype.readAsArrayBuffer = function (b) { window.__maiorLeitura = Math.max(window.__maiorLeitura, b.size); return fr.call(this, b); };
    // o leitor "byob" lê o livro em trechos para dentro de um buffer só: conta o tamanho de cada trecho
    if (typeof ReadableStreamBYOBReader === 'function') {
      const rd = ReadableStreamBYOBReader.prototype.read;
      ReadableStreamBYOBReader.prototype.read = function (v) {
        window.__maiorLeitura = Math.max(window.__maiorLeitura, (v && v.byteLength) || 0);
        window.__trechosByob = (window.__trechosByob || 0) + 1;
        return rd.apply(this, arguments);
      };
    }
  });
  const sessao = await p.browser().target().createCDPSession();
  const processos = (await sessao.send('SystemInfo.getProcessInfo')).processInfo.map(x => x.id);   // todos: o Blob em memória mora no processo do navegador
  const memoriaDoNavegador = () => {
    if (process.platform === 'win32') {
      const r = spawnSync('tasklist', ['/FO', 'CSV', '/NH'], { encoding: 'utf8' });
      let soma = 0;
      String(r.stdout || '').split(/\r?\n/).forEach(l => {
        const c = l.split('","').map(x => x.replace(/"/g, ''));
        if (c.length >= 5 && processos.indexOf(Number(c[1])) >= 0) soma += Number(c[4].replace(/\D/g, '')) * 1024;
      });
      return soma;
    }
    return processos.reduce((s, id) => {
      try { return s + Number((/VmRSS:\s*(\d+)/.exec(fs.readFileSync('/proc/' + id + '/status', 'utf8')) || [0, 0])[1]) * 1024; }
      catch (e) { return s; }
    }, 0);
  };
  const base = memoriaDoNavegador();
  let pico = base, amostrando = true;
  const amostras = (async () => { while (amostrando) { pico = Math.max(pico, memoriaDoNavegador()); await pausa(50); } })();
  const estV = await importar(p, ZIP_VARIOS, 'a importação dos dez livros');
  amostrando = false;
  await amostras;
  const maiorLeitura = await p.evaluate(() => window.__maiorLeitura);
  const MB = x => (x / 1048576).toFixed(1) + ' MB';
  console.log('   estado: ' + JSON.stringify(estV));
  console.log('   maior leitura de uma vez: ' + MB(maiorLeitura) + ' (maior livro ' + MB(maiorLivro) + ', pacote ' + MB(tamPacote) + ')');
  console.log('   memória dos processos do navegador: ' + MB(base) + ' antes, pico ' + MB(pico) + ' (+' + MB(pico - base) + ')' +
    (processos.length ? '' : ' [sem processo de página achado]'));
  if (MODO === '--envenenado-zip-inteiro') {
    secao('VENENO: o arquivo inteiro na memória');
    conf('envenenado: a maior leitura é o pacote inteiro (defeito enxergado)', maiorLeitura >= tamPacote, true);
    if (processos.length && base > 0) {
      conf('envenenado: e a memória do navegador sobe mais que o pacote (defeito enxergado)', pico - base >= tamPacote, true);
    }
    throw Object.assign(new Error('fim'), { fimDoVeneno: true });
  }
  conf('os dez entraram', /10 livros novos/.test(estV), true);
  // o contador enxerga: os livros passaram por ele, em trechos (sem isto, "nada grande" passaria com o contador cego)
  conf('o contador viu os livros sendo lidos (trechos ou fatias)', (await p.evaluate(() => window.__trechosByob || 0)) >= 10 ||
    maiorLeitura >= 1024 * 1024, true);
  conf('nenhuma leitura passou de um livro (mais a cauda do zip)', maiorLeitura <= maiorLivro + 65557, true);
  conf('e a maior leitura não é o pacote', maiorLeitura < tamPacote / 2, true);
  /* O efeito, com margem larga de propósito (a memória do processo tem
   * ruído): o código de antes subia 2 a 2,5 vezes o pacote (medido em 30/10:
   * +103 MB com este pacote de 38 MB), e o de agora sobe menos que meio. */
  if (processos.length && base > 0) {
    conf('a memória do navegador não sobe o pacote inteiro (pico ' + MB(pico - base) + ' acima da base)', pico - base < tamPacote, true);
  }

  // ================================================================
  secao('8. Apagar tudo: os livros ficam, a posição de leitura sai');
  const mensagens = [];
  p.on('dialog', d => mensagens.push(d.message()));
  await H.irParaAba(p, 'ajustes');
  const livrosAntes = await H.contarDeposito(p, 'livros');
  conf('há posição de leitura guardada antes', (await H.contarDeposito(p, 'livros_posicoes')) > 0, true);
  await p.evaluate(() => document.querySelector('#apagar-tudo').click());
  await esperar('as posições apagadas', () => H.contarDeposito(p, 'livros_posicoes'), v => v === 0, 10000);
  conf('as posições de leitura saíram', await H.contarDeposito(p, 'livros_posicoes'), 0);
  conf('os livros ficaram', await H.contarDeposito(p, 'livros'), livrosAntes);
  conf('e a pergunta disse que os livros ficam', /Os livros importados ficam no tablet/.test(mensagens[0] || ''), true);

  secao('9. Nenhum erro de página');
  conf('nenhum erro', p.errosDePagina.join(' | '), '');
})().then(() => H.fim(amb)(), e => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e)));
