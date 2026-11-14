/* testa_biblioteca_tela_principal.js
 *
 * A fatia P3 da Biblioteca por assunto: a TELA PRINCIPAL nova. No Chrome de
 * verdade, com o pacote de exercícios SINTÉTICO do 9º ano
 * (_pacote_sintetico.js) e três livros SINTÉTICOS gravados direto no tablet
 * (dois de Matemática do 8º ano ligados ao MAT08-15 pelo mapa, um de Física
 * do 1º médio). Nenhum livro de verdade, nenhum nome de criança.
 *
 * O que prova:
 *   1. a Biblioteca abre na Matemática, por assunto: as pílulas são os anos do
 *      índice (banco/topicos/matematica.json), do 2º ano ao 3º médio; as capas,
 *      o Continuar lendo, o "Comparar livros por assunto" e o começo dos
 *      exercícios NÃO estão no caminho principal; a etiqueta "Outro" não
 *      aparece em lugar nenhum; o campo de busca continua no alto;
 *   2. no 8º ano, TODO assunto do índice aparece, uma linha por assunto, no
 *      grupo da unidade dele e na ordem das unidades; o MAT08-15 diz o material
 *      dele (1 capítulo e 1 livro inteiro); e a PARTIÇÃO: cada linha cai em
 *      exatamente um balde (com material, ou apagada com "ainda sem material"),
 *      e o balde bate com a própria página do assunto, aberta linha a linha
 *      (livro ligado, ou teoria e exercícios);
 *   3. o toque no MAT08-15 abre a página do assunto (P1), que traz "Comparar os
 *      livros" e abre a comparação; o Voltar devolve a lista no 8º ano;
 *   4. a Estante, a um toque: as capas do 8º ano, o Continuar lendo do livro
 *      lido, Minhas listas e os exercícios por série; o toque na capa abre a
 *      tela do livro, e o Continuar lendo abre o leitor na página guardada;
 *   5. as outras disciplinas abrem a estante delas, e a tela diz, sem jargão,
 *      que por enquanto só a Matemática está por assunto;
 *   6. a trava de transbordo da tela principal a 1280x800 e a 800x1280, com a
 *      letra a 100% e a 130%: nada sai da caixa, alvo de 48 px, sem travessão;
 *   7. NADA NOVO GRAVADO: o banco inteiro (todos os depósitos menos o dos
 *      arquivos dos livros e o das posições de leitura, que o leitor já
 *      guardava) e o localStorage ficam iguais do começo ao fim dos toques.
 *
 * Venenos (cada um TEM de ser visto: "VENENO visto"):
 *   --envenenado-some-sem-material   o assunto sem material some da lista
 *   --envenenado-tudo-apagado        todo assunto aparece apagado, com material ou não
 *   --envenenado-estante-nao-abre    o toque na capa da estante não abre o livro
 *   --controle-pai                   serve o app.js, o styles.css e o index.html
 *                                    da origin/main (o commit pai da fatia): a
 *                                    tela antiga, sem lista de assuntos, tem de
 *                                    ser vista
 *
 *   --prints <pasta>   grava os prints da tela principal (1280x800, 800x1280
 *                      e 412x915, com escala 2), para o painel cego.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8977;
const PYTHON = process.env.PYTHON || 'python';
const iPrints = process.argv.indexOf('--prints');
const PRINTS = iPrints > 0 ? process.argv[iPrints + 1] : null;
const VENENOS = ['--envenenado-some-sem-material', '--envenenado-tudo-apagado', '--envenenado-estante-nao-abre',
  '--envenenado-continuar-de-outra-materia', '--envenenado-minhas-listas-dobrada', '--controle-pai'];
const MODO = VENENOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const ANCORA_SOME = "if (!m.tem) { l.classList.add('sem-material');";
const ANCORA_APAGADO = 'm.tem = m.capitulos + m.inteiros + m.teoria + m.exercicios > 0;';
const ANCORA_ESTANTE = "aoClick: function () { abrirTelaDoLivro(l.id); } }, [\n        capaDoLivro(l),";
/* Os dois médios da revisão cega do #211: o Continuar lendo da estante é só o
 * da disciplina, e Minhas listas aparece num lugar só (a aba). */
const ANCORA_CONTINUAR = 'return l.pos && l.pos.quando && disciplinaDoLivro(l.meta).id === disc.id; })';
const ANCORA_MINHAS = '    // Minhas listas mora num lugar só: a aba "Por série / Minhas listas", logo abaixo da estante\n';
const trocas = {};
if (MODO === '--envenenado-continuar-de-outra-materia') trocas['/app.js'] = APP.split(ANCORA_CONTINUAR).join('return l.pos && l.pos.quando; })');
if (MODO === '--envenenado-minhas-listas-dobrada') trocas['/app.js'] = APP.split(ANCORA_MINHAS).join(
  "    painel.appendChild(el('button', { type: 'button', class: 'btn', id: 'bib-estante-minhas', texto: 'Minhas listas (' + quantasMinhasListas() + ')' }));\n");
if (MODO === '--envenenado-some-sem-material') trocas['/app.js'] = APP.split(ANCORA_SOME).join('if (!m.tem) { return;');
if (MODO === '--envenenado-tudo-apagado') trocas['/app.js'] = APP.split(ANCORA_APAGADO).join('m.tem = false;');
if (MODO === '--envenenado-estante-nao-abre') trocas['/app.js'] = APP.split(ANCORA_ESTANTE).join("aoClick: function () {} }, [\n        capaDoLivro(l),");
if (MODO === '--controle-pai') {
  /* o commit pai FIXO: a main de logo antes da P3 entrar (e1929b9, o #219).
   * Não o merge-base com a origin/main: depois do merge da P3, na main e em
   * todo PR que a traz, o merge-base já tem a tela nova, e o controle deixa
   * de ver o que deve ver. Mesma solução do testa_leitor_voltar (PAI fixo). */
  const base = 'e1929b9';
  for (const arq of ['app.js', 'styles.css', 'index.html']) {
    trocas['/' + arq] = execFileSync('git', ['show', base + ':' + arq], { cwd: H.RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  }
}

const amb = H.criarAmbiente(PORTA, 'perfil_biblioteca_tela_principal', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'bib_p3_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

const LETRA_130 = 'html{font-size:130%} body{font-size:20.8px}';
const letra = (pag, css) => pag.evaluate(c => {
  const v = document.querySelector('#prova-letra'); if (v) v.remove();
  if (c) { const s = document.createElement('style'); s.id = 'prova-letra'; s.textContent = c; document.head.appendChild(s); }
}, css);
const clicar = (pag, sel) => pag.evaluate(s => { const b = document.querySelector(s); if (!b) return false; b.click(); return true; }, sel);

async function venenoVisto(rotulo, visto, detalhe) {
  secao('VENENO: ' + MODO);
  conf(MODO.slice(2) + ': ' + rotulo + ' (defeito detectado)', visto, true);
  if (visto) console.log('VENENO visto: ' + String(detalhe).slice(0, 400));
  await H.fim(amb)();
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

// o banco inteiro, menos os arquivos dos livros e as posições de leitura (que o leitor já guardava)
const fotoDoBanco = pag => pag.evaluate(() => new Promise((res, rej) => {
  const q = indexedDB.open('apoio-educacional');
  q.onerror = () => rej(q.error);
  q.onsuccess = () => {
    const b = q.result, nomes = Array.from(b.objectStoreNames).filter(n => n !== 'livros' && n !== 'livros_posicoes').sort(), saida = {};
    const t = b.transaction(nomes, 'readonly');
    nomes.forEach(n => { const r = t.objectStore(n).getAll(); r.onsuccess = () => { saida[n] = r.result; }; });
    t.oncomplete = () => {
      b.close();
      const ls = {};
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); }
      res(JSON.stringify({ banco: saida, localStorage: ls }));
    };
    t.onerror = () => rej(t.error);
  };
}));

// o que a tela principal mostra agora
const lerTela = pag => pag.evaluate(() => {
  const caixa = document.querySelector('#bib-livros');
  const vis = x => !!x && !x.hidden && getComputedStyle(x).display !== 'none' && x.getClientRects().length > 0;
  const visiveis = sel => Array.from(document.querySelectorAll(sel)).filter(vis);
  return {
    secao: vis(caixa),
    ativa: (caixa.querySelector('.bibl-disciplina.ativa') || { dataset: {} }).dataset.disciplina || '',
    estanteBotao: vis(document.querySelector('#bib-abrir-estante')),
    anos: visiveis('#bib-livros .bibl-ano').map(b => b.dataset.ano).join(','),
    anoAtivo: (caixa.querySelector('.bibl-ano.ativo') || { dataset: {} }).dataset.ano || '',
    linhas: visiveis('#bib-livros .bibl-assunto-linha[data-assunto]').map(l => ({
      id: l.dataset.assunto, unidade: l.closest('.bibl-unidade') ? l.closest('.bibl-unidade').dataset.unidade : '',
      nome: l.querySelector('.nome').textContent, detalhe: (l.querySelector('.detalhe') || {}).textContent || '',
      apagada: l.classList.contains('sem-material'), marca: l.dataset.semMaterial === 'true',
      cor: getComputedStyle(l.querySelector('.nome')).color })),
    unidades: visiveis('#bib-livros .bibl-unidade').map(u => u.dataset.unidade + '=' + u.querySelector('.bibl-unidade-titulo').textContent).join(','),
    capas: visiveis('#bib-livros .bibl-grade [data-livro]').map(b => b.dataset.livro).join(','),
    continuar: visiveis('#bib-livros [data-continuar]').map(b => b.dataset.continuar).join(','),
    comparar: visiveis('#bib-comparar, .bibl-comparar').length,
    outro: Array.from(document.querySelectorAll('#tela-biblioteca .bibl-tipo-selo')).filter(s => /^\s*Outro\s*$/.test(s.textContent)).length,
    corpo: vis(document.querySelector('#bib-corpo')),
    cabecaExercicios: vis(document.querySelector('#bib-exercicios-cabeca')),
    minhas: visiveis('#bib-corpo [data-aba="minhas"]').length > 0,
    // quantas vezes "Minhas listas" aparece à vista na aba inteira (a faixa do material marcado conta)
    minhasVezes: Array.from(document.querySelectorAll('#tela-biblioteca button')).filter(b => vis(b) && /^\s*Minhas listas/.test(b.textContent)).length,
    modulos: visiveis('#bib-corpo .item-lista .nome').map(n => n.textContent.trim()).join(' | '),
    soMatematica: (visiveis('#bib-so-matematica')[0] || {}).textContent || '',
    busca: vis(document.querySelector('#busca-biblioteca')),
    texto: caixa.innerText
  };
});

const lerPagina = pag => pag.evaluate(() => {
  const p = document.querySelector('#bib-corpo .bib-assunto[data-assunto]');
  if (!p || !p.querySelector('.bib-assunto-titulo')) return null;
  return { id: p.dataset.assunto, titulo: p.querySelector('.bib-assunto-titulo').textContent,
    livros: p.querySelectorAll('[data-secao="livros"] .bib-assunto-livro').length,
    fontes: p.querySelectorAll('[data-secao="teoria"] [data-fonte], [data-secao="obmep"] [data-fonte], [data-secao="enem"] [data-fonte]').length,
    comparar: (p.querySelector('#bib-assunto-comparar') || {}).textContent || '' };
});

/* A trava de transbordo no que a fatia desenha: botão e texto dentro da
 * caixa, nada fora da tela, página sem rolagem de lado, alvos de 48 px. */
const medir = (pag, raiz) => pag.evaluate(sel => {
  const ruins = [];
  const caixa = document.querySelector(sel);
  if (!caixa) return ['sem ' + sel];
  const cr = caixa.getBoundingClientRect();
  const nome = e => (e.id || e.dataset.assunto || e.dataset.livro || e.dataset.disciplina || e.dataset.ano || e.className || e.tagName) + '';
  caixa.querySelectorAll('button, .item-lista, .nome, .detalhe, .bibl-forte, .bibl-apoio, .bibl-pequena, h3, h4').forEach(e => {
    const r = e.getBoundingClientRect();
    if (!r.width && !r.height) return;
    if (r.left < cr.left - 0.5 || r.right > cr.right + 0.5 || r.right > innerWidth + 0.5) ruins.push(nome(e) + ' sai da área (' + Math.round(r.left) + '-' + Math.round(r.right) + ')');
    if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).textOverflow !== 'ellipsis') ruins.push(nome(e) + ' transborda por dentro');
    if (e.tagName === 'BUTTON' || e.getAttribute('role') === 'button') {
      if (r.height < 47.5 || r.width < 47.5) ruins.push(nome(e) + ' com alvo de ' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
  });
  if (document.documentElement.scrollWidth > innerWidth) ruins.push('a página rola de lado');
  if (/—|–/.test(caixa.innerText)) ruins.push('travessão no texto');
  return ruins;
}, raiz);

(async () => {
  secao('0. A prova se confere');
  conf('a lista de venenos não está vazia', VENENOS.length > 0, true);
  conf('cada âncora dos venenos aparece uma vez só no app.js',
    [ANCORA_SOME, ANCORA_APAGADO, ANCORA_ESTANTE, ANCORA_CONTINUAR, ANCORA_MINHAS].map(a => APP.split(a).length - 1).join(','), '1,1,1,1,1');
  if (MODO && MODO !== '--controle-pai') conf('o app.js servido está envenenado (' + MODO + ')', trocas['/app.js'] !== APP && !!trocas['/app.js'], true);
  if (MODO === '--controle-pai') conf('o app.js servido é o do commit pai, e não o desta fatia', trocas['/app.js'].replace(/\r\n/g, '\n') !== APP, true);

  // o índice do 8º ano, lido do catálogo, sem passar pelo app
  const catalogo = JSON.parse(fs.readFileSync(path.join(H.RAIZ, 'banco', 'topicos', 'matematica.json'), 'utf8')).temas;
  const ORDEM_SERIES = ['02', '03', '04', '05', '06', '07', '08', '09', 'em1', 'em2', 'em3'];
  const seriesDoCatalogo = ORDEM_SERIES.filter(s => catalogo.some(t => t.serie === s));
  const do8 = catalogo.filter(t => t.serie === '08');
  const UNIDADES = ['numeros', 'algebra', 'geometria', 'grandezas', 'estatistica'];
  const unidadesDo8 = UNIDADES.filter(u => do8.some(t => t.unidade === u));
  conf('o catálogo tem o 8º ano e o MAT08-15 nele', do8.length > 10 && do8.some(t => t.id === 'MAT08-15'), true);

  const zipEx = path.join(TMP, 'pacote_9ano.zip');
  Sintetico.gerar(zipEx);
  const pdf = path.join(TMP, 'p3-livro.pdf');
  const rPdf = spawnSync(PYTHON, ['-X', 'utf8', '-c', 'import sys, pymupdf\nd = pymupdf.open()\n' +
    'for t in ["Capa.", "Volume do bloco retangular.", "Volume do cilindro.", "Fim."]:\n' +
    '    d.new_page().insert_text((72, 90), t)\nd.save(sys.argv[1])', pdf], { encoding: 'utf8' });
  conf('o pacote de exercícios e o PDF sintéticos foram gerados', fs.existsSync(zipEx) && rPdf.status === 0 && fs.existsSync(pdf), true);
  amb.extras['/p3-livro.pdf'] = { tipo: 'application/pdf', corpo: fs.existsSync(pdf) ? fs.readFileSync(pdf) : Buffer.from('') };

  await amb.subir();
  const pag = await amb.pagina();
  const errosDePagina = [];
  pag.on('pageerror', e => errosDePagina.push(e.message));
  pag.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errosDePagina.push(m.text()); });
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true, deviceScaleFactor: PRINTS ? 2 : 1 });
  await H.abrirApp(pag, amb.ORIGEM);
  const imp = await importar(pag, zipEx);
  conf('o pacote de exercícios do 9º ano entrou', /^Biblioteca importada\./.test(imp), true);
  // três livros SINTÉTICOS direto no tablet, e a posição de leitura de um deles (o Continuar lendo)
  const gravados = await pag.evaluate(() => fetch('/p3-livro.pdf').then(r => r.blob()).then(blob => Store.gravarLivros({ manifest: { pacote: 'prova-p3', versao: 1 }, livros: [
    { blob, meta: { id: 'p3-mat8a', hash: 'sha256:p3a', titulo: 'Matemática Oito A de prova', formato: 'pdf', paginas: 4, series: ['08'], materia: 'matematica',
      mapa_disciplina: 'matematica', sumario: [], tipo_material: 'livro-didatico',
      mapa: [{ n: 1, titulo: 'Volume do bloco e do cilindro', pagina: 2, pagina_fim: 3, assuntos: [{ id: 'MAT08-15' }] }] } },
    { blob, meta: { id: 'p3-mat8b', hash: 'sha256:p3b', titulo: 'Matemática Oito B de prova', formato: 'pdf', paginas: 4, series: ['08'], materia: 'matematica',
      mapa_disciplina: 'matematica', sumario: [],
      mapa: [{ n: 1, titulo: 'Matemática Oito B de prova', obra_inteira: true, assuntos: [{ id: 'MAT08-15' }] }] } },
    { blob, meta: { id: 'p3-fis', hash: 'sha256:p3f', titulo: 'Física Um de prova', formato: 'pdf', paginas: 4, series: ['em1'], materia: 'fisica', sumario: [] } }
  ] })).then(() => Store.gravarPosicaoLivro({ id: 'p3-mat8a', pagina: 3 })).then(() => true, e => String(e)));
  conf('os três livros sintéticos e a posição de leitura entraram', gravados, true);

  await H.abrirApp(pag, amb.ORIGEM);
  const bancoAntes = await fotoDoBanco(pag);
  await H.irParaAba(pag, 'biblioteca');

  // ================================================================
  secao('1. A Biblioteca abre na Matemática, por assunto');
  const t1 = await esperar('a lista de assuntos', () => lerTela(pag), v => v.secao && v.linhas.length > 0, 15000);
  let T = t1.valor || {};
  if (MODO === '--controle-pai') {
    return venenoVisto('a tela do commit pai não tem lista de assuntos nem Estante, e tem as capas no caminho principal',
      !t1.ok && !T.estanteBotao && !!T.capas, JSON.stringify({ linhas: (T.linhas || []).length, estante: T.estanteBotao, capas: T.capas }));
  }
  console.log('   tela: ' + JSON.stringify(Object.assign({}, T, { linhas: (T.linhas || []).length, texto: undefined })));
  conf('abre na Matemática', T.ativa, 'matematica');
  conf('as pílulas são os anos do índice, do 2º ano ao 3º médio', T.anos, seriesDoCatalogo.join(','));
  conf('o ano aberto é o do livro de Matemática lido por último (8º)', T.anoAtivo, '08');
  conf('o botão da Estante está à vista', T.estanteBotao, true);
  conf('as capas não estão no caminho principal', T.capas, '');
  conf('o Continuar lendo não está no caminho principal', T.continuar, '');
  conf('"Comparar livros por assunto" não é seção da tela principal', T.comparar, 0);
  conf('a etiqueta "Outro" não aparece', T.outro, 0);
  conf('o começo dos exercícios e a cabeça "Exercícios e listas" ficam fora do caminho principal', T.corpo + '|' + T.cabecaExercicios, 'false|false');
  conf('o campo de busca continua no alto', T.busca, true);

  // ================================================================
  secao('2. O 8º ano: todo assunto aparece, no grupo da unidade, apagado só sem material');
  if (MODO === '--envenenado-some-sem-material') {
    return venenoVisto('o assunto sem material sumiu da lista', (T.linhas || []).length < do8.length, (T.linhas || []).length + ' de ' + do8.length);
  }
  conf('uma linha por assunto do 8º no índice, na ordem do catálogo dentro de cada unidade',
    (T.linhas || []).map(l => l.id).join(','), unidadesDo8.map(u => do8.filter(t => t.unidade === u).map(t => t.id).join(',')).join(','));
  conf('cada assunto está no grupo da unidade dele', (T.linhas || []).every(l => l.unidade === do8.find(t => t.id === l.id).unidade), true);
  conf('os grupos seguem a ordem das unidades, com o nome delas', T.unidades.split(',').map(x => x.split('=')[0]).join(','), unidadesDo8.join(','));
  conf('os grupos têm o nome da unidade', /Números/.test(T.unidades) && /Álgebra/.test(T.unidades) && /Grandezas/.test(T.unidades), true);
  const l15 = (T.linhas || []).find(l => l.id === 'MAT08-15') || {};
  if (MODO === '--envenenado-tudo-apagado') {
    return venenoVisto('o MAT08-15, com dois livros ligados, aparece apagado', l15.apagada === true, JSON.stringify(l15));
  }
  conf('o MAT08-15 diz o material dele: 1 capítulo e 1 livro inteiro, e não está apagado', l15.detalhe + '|' + l15.apagada, '1 capítulo · 1 livro inteiro|false');
  conf('a marca de apagado e a classe andam juntas em toda linha', (T.linhas || []).every(l => l.apagada === l.marca), true);
  const apagadas = (T.linhas || []).filter(l => l.apagada), acesas = (T.linhas || []).filter(l => !l.apagada);
  conf('há linhas dos dois baldes no 8º ano (com material e sem)', apagadas.length > 0 && acesas.length > 0, true);
  conf('toda linha apagada diz "ainda sem material", e nenhuma acesa diz', apagadas.every(l => l.detalhe === 'ainda sem material') && acesas.every(l => l.detalhe !== 'ainda sem material' && !!l.detalhe), true);
  conf('a linha apagada tem outra cor no nome (o apagado se vê)', apagadas.length && acesas.length && apagadas[0].cor !== acesas[0].cor, true);
  /* A PARTIÇÃO, conferida pela página do assunto (P1), que é a verdade: cada
   * linha abre a página, e a linha está acesa se, e só se, a página traz livro
   * ligado ou fonte de teoria e exercícios. */
  const baldes = { acesaComMaterial: [], apagadaSemMaterial: [], errada: [] };
  for (const l of T.linhas || []) {
    await clicar(pag, '#bib-livros .bibl-assunto-linha[data-assunto="' + l.id + '"]');
    const pg = await esperar('a página do ' + l.id, () => lerPagina(pag), v => !!v && v.id === l.id, 10000);
    const tem = !!pg.valor && (pg.valor.livros + pg.valor.fontes) > 0;
    (tem && !l.apagada ? baldes.acesaComMaterial : !tem && l.apagada ? baldes.apagadaSemMaterial : baldes.errada).push(l.id);
    await clicar(pag, '#bib-corpo .bib-assunto .bib-voltar');
    await esperar('a lista de volta', () => lerTela(pag), v => v.linhas.length > 0 && v.anoAtivo === '08', 10000);
  }
  console.log('   baldes: ' + JSON.stringify(baldes));
  conf('partição: toda linha cai num balde só, e o balde bate com a página do assunto',
    baldes.acesaComMaterial.length + baldes.apagadaSemMaterial.length + '|' + baldes.errada.join(','), (T.linhas || []).length + '|');

  // ================================================================
  secao('3. O assunto abre a página dele, com Comparar');
  await clicar(pag, '#bib-livros .bibl-assunto-linha[data-assunto="MAT08-15"]');
  const p15 = await esperar('a página do MAT08-15', () => lerPagina(pag), v => !!v && v.id === 'MAT08-15', 10000);
  conf('a página do MAT08-15 abre com o título e os dois livros', (p15.valor || {}).titulo + '|' + (p15.valor || {}).livros,
    do8.find(t => t.id === 'MAT08-15').pt.titulo + '|2');
  conf('a página traz "Comparar os livros"', (p15.valor || {}).comparar, 'Comparar os livros');
  conf('a lista de assuntos sai de cena enquanto a página está aberta', (await lerTela(pag)).secao, false);
  await clicar(pag, '#bib-assunto-comparar');
  const lado = await esperar('a comparação lado a lado', () => pag.evaluate(() => {
    const t = document.querySelector('#lado-a-lado');
    return !!t && !t.hidden && t.querySelectorAll('.lado-livro').length;
  }), v => v >= 2, 10000);
  conf('o Comparar abre a comparação com os dois livros', lado.valor, 2);
  await clicar(pag, '#lado-voltar');
  await esperar('a comparação fechou', () => pag.evaluate(() => document.querySelector('#lado-a-lado').hidden), v => v, 5000);
  await clicar(pag, '#bib-corpo .bib-assunto .bib-voltar');
  const volta = await esperar('a lista de volta', () => lerTela(pag), v => v.linhas.length > 0, 10000);
  conf('o Voltar devolve a lista no 8º ano', (volta.valor || {}).anoAtivo, '08');

  if (PRINTS) {
    fs.mkdirSync(PRINTS, { recursive: true });
    for (const [w, h] of [[1280, 800], [800, 1280]]) {
      await pag.setViewport({ width: w, height: h, hasTouch: true, deviceScaleFactor: 2 });
      await pausa(600);
      await pag.evaluate(() => { const c = document.querySelector('.conteudo'); if (c) c.scrollTop = 0; });
      await pag.screenshot({ path: path.join(PRINTS, 'depois-principal-' + w + 'x' + h + '.png') });
    }
    await pag.setViewport({ width: 1280, height: 800, hasTouch: true, deviceScaleFactor: 2 });
    await pausa(600);
  }

  // ================================================================
  secao('6. A trava de transbordo da tela principal');
  for (const [w, h, css] of [[1280, 800, ''], [800, 1280, ''], [1280, 800, LETRA_130], [800, 1280, LETRA_130]]) {
    await pag.setViewport({ width: w, height: h, hasTouch: true, deviceScaleFactor: PRINTS ? 2 : 1 });
    await letra(pag, css);
    await pausa(400);
    const ruins = await medir(pag, '#bib-livros');
    conf('a tela principal a ' + w + 'x' + h + (css ? ' com a letra a 130%' : '') + ' não transborda', ruins.slice(0, 6).join('; '), '');
    await letra(pag, '');
  }
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true, deviceScaleFactor: PRINTS ? 2 : 1 });
  await pausa(300);

  // ================================================================
  secao('4. A Estante, a um toque');
  await clicar(pag, '#bib-abrir-estante');
  const e1 = await esperar('a estante', () => lerTela(pag), v => !!v.capas, 10000);
  T = e1.valor || {};
  console.log('   estante: ' + JSON.stringify(Object.assign({}, T, { linhas: T.linhas.length, texto: undefined })));
  conf('a estante mostra as capas do 8º ano de Matemática', T.capas, 'p3-mat8a,p3-mat8b');
  conf('a estante tem o Continuar lendo do livro lido', T.continuar, 'p3-mat8a');
  conf('a estante tem Minhas listas', T.minhas, true);
  if (MODO === '--envenenado-minhas-listas-dobrada') return venenoVisto('"Minhas listas" aparece duas vezes na estante', T.minhasVezes > 1, T.minhasVezes);
  conf('"Minhas listas" aparece uma vez só na estante (a aba)', T.minhasVezes, 1);
  conf('a estante tem os exercícios por série, logo abaixo', T.corpo && /Equações do Segundo Grau/.test(T.modulos), true);
  conf('na estante a lista de assuntos sai', T.linhas.length, 0);
  conf('a estante não tem a etiqueta "Outro" nem a seção de comparar', T.outro + '|' + T.comparar, '0|0');
  if (PRINTS) {
    for (const [w, h] of [[1280, 800], [800, 1280]]) {
      await pag.setViewport({ width: w, height: h, hasTouch: true, deviceScaleFactor: 2 });
      await pausa(600);
      await pag.evaluate(() => { const c = document.querySelector('.conteudo'); if (c) c.scrollTop = 0; });
      await pag.screenshot({ path: path.join(PRINTS, 'depois-estante-' + w + 'x' + h + '.png') });
    }
    await pag.setViewport({ width: 1280, height: 800, hasTouch: true, deviceScaleFactor: 2 });
    await pausa(600);
  }
  await clicar(pag, '#bib-livros .bibl-grade [data-livro="p3-mat8a"]');
  const livro = await esperar('a tela do livro', () => pag.evaluate(() => {
    const t = document.querySelector('#bib-livro'); return !!t && !t.hidden ? t.dataset.livro : '';
  }), v => v === 'p3-mat8a', 6000);
  if (MODO === '--envenenado-estante-nao-abre') return venenoVisto('o toque na capa da estante não abriu o livro', !livro.ok, livro.valor);
  conf('o toque na capa abre a tela do livro', livro.valor, 'p3-mat8a');
  await clicar(pag, '#bib-livro-voltar');
  await esperar('a estante de volta', () => lerTela(pag), v => !!v.capas, 6000);
  await clicar(pag, '#bib-livros [data-continuar="p3-mat8a"]');
  const leitor = await esperar('o leitor na página guardada', () => pag.evaluate(() =>
    (document.querySelector('#modal-leitor-pdf.aberto') && document.querySelector('#corpo-modal-leitor-pdf').dataset.paginaDesenhada) || ''), v => v === '3', 15000);
  conf('o Continuar lendo abre o leitor na página guardada (3)', leitor.valor, '3');
  await pag.evaluate(() => { const b = document.querySelector('#modal-leitor-pdf .modal-rodape [data-fechar]'); if (b) b.click(); });
  await esperar('o leitor fechou', () => pag.evaluate(() => !document.querySelector('#modal-leitor-pdf.aberto')), v => v, 5000);
  await pausa(500);
  await clicar(pag, '#bib-livros .bibl-painel-estante > .bib-voltar');
  const deVolta = await esperar('os assuntos de volta', () => lerTela(pag), v => v.linhas.length > 0, 6000);
  conf('o Voltar da estante devolve os assuntos', deVolta.ok && !deVolta.valor.capas, true);

  // ================================================================
  secao('5. As outras disciplinas abrem a estante delas');
  await clicar(pag, '#bib-livros .bibl-disciplina[data-disciplina="fisica"]');
  const f = await esperar('a estante da Física', () => lerTela(pag), v => v.ativa === 'fisica' && !!v.capas, 6000);
  T = f.valor || {};
  conf('a Física abre a estante dela, com a capa', T.capas, 'p3-fis');
  if (MODO === '--envenenado-continuar-de-outra-materia') return venenoVisto('o livro de Matemática lido aparece no Continuar lendo da Física', T.continuar === 'p3-mat8a', T.continuar);
  conf('o Continuar lendo da Física não traz o livro de Matemática (nenhum de Física lido: sem o bloco)', T.continuar + '|' +
    await pag.evaluate(() => document.querySelectorAll('#bib-livros .bibl-continuar').length), '|0');
  conf('sem lista de assuntos nem botão da Estante', T.linhas.length + '|' + T.estanteBotao, '0|false');
  conf('a tela diz, sem jargão, que por enquanto só a Matemática está por assunto', T.soMatematica,
    'Por enquanto, só a Matemática está organizada por assunto. Aqui ficam os livros de Física, por ano.');
  await clicar(pag, '#bib-livros .bibl-disciplina[data-disciplina="matematica"]');
  const deNovo = await esperar('a Matemática de novo', () => lerTela(pag), v => v.ativa === 'matematica' && v.linhas.length > 0, 6000);
  conf('voltar à Matemática é voltar aos assuntos', deNovo.ok, true);

  // ================================================================
  secao('7. Nada novo gravado');
  await pausa(800);
  const bancoDepois = await fotoDoBanco(pag);
  if (bancoDepois !== bancoAntes) {
    const a = JSON.parse(bancoAntes), d = JSON.parse(bancoDepois);
    const dif = Object.keys(Object.assign({}, a.banco, d.banco)).filter(k => JSON.stringify(a.banco[k]) !== JSON.stringify(d.banco[k]))
      .concat(Object.keys(Object.assign({}, a.localStorage, d.localStorage)).filter(k => a.localStorage[k] !== d.localStorage[k]).map(k => 'localStorage:' + k));
    console.log('   mudou: ' + dif.join(', '));
  }
  conf('o banco (fora os arquivos e as posições dos livros) e o localStorage ficaram iguais', bancoDepois === bancoAntes, true);
  conf('nenhum erro de página', errosDePagina.join(' | '), '');
  if (PRINTS) {
    // o celular por último: a 412 px o app vira o do celular, e a Biblioteca de lá é outra tela
    await pag.setViewport({ width: 412, height: 915, hasTouch: true, deviceScaleFactor: 2 });
    await pausa(1500);
    await pag.screenshot({ path: path.join(PRINTS, 'depois-412x915.png') });
    console.log('   prints em ' + PRINTS);
  }
  await H.fim(amb)();
})().catch(H.fim(amb));
