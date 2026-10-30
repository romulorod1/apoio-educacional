/* testa_biblioteca_mirim.js
 *
 * Os pacotes de PROVAS do C12 (OBMEP Mirim e ENEM) na aba Biblioteca, no
 * Chrome de verdade, com pacotes SINTÉTICOS no formato que o
 * biblioteca/provas.py gera (o conteúdo real da OBMEP e do ENEM nunca entra
 * no repositório).
 *
 * O que prova:
 *   1. os três pacotes importam: Mirim 1 (nível m1, equivalente ao 2º e ao 3º
 *      ano), Mirim 2 (m2, 4º e 5º) e ENEM (3ª série, sem solução), e o resumo
 *      diz o nível com as séries;
 *   2. as abas de série vão do 2º ao 5º ano, na ordem escolar, antes da 3ª
 *      série do médio, e o nível ("Mirim 1") não vira aba;
 *   3. em cada série do 2º ao 5º ano aparecem os ASSUNTOS do aplicativo como
 *      módulos (título igual ao do banco/topicos/matematica.json), mais
 *      "Diversos"; no 3º médio, os do ENEM;
 *   4. o assunto abre a prova como lista, com as questões dela;
 *   5. a questão do ENEM (sem solução) mostra "Ver resposta" na tela cheia, e
 *      o toque mostra a letra do gabarito;
 *   6. material anexado numa aula com duas questões de "Diversos", uma de
 *      "Adição até 100" e uma do ENEM: a aula ganha os dois assuntos de
 *      verdade e não "Diversos", e o gabarito anexado traz "Resposta: A" no
 *      lugar da solução do ENEM.
 *
 * Modos envenenados:
 *   node _teste/testa_biblioteca_mirim.js --envenenado-equivalentes
 *     o app.js servido volta a espalhar pelas séries equivalentes só o item
 *     do Banco. A Mirim deixa de aparecer do 2º ao 5º ano (vira a aba crua do
 *     nível), e o teste tem de ENXERGAR isso.
 *   node _teste/testa_biblioteca_mirim.js --envenenado-diversos
 *     o app.js servido trata todo módulo de prova como assunto, e a aula tem
 *     de ganhar "Diversos" à vista do teste.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const VENENO = process.argv.indexOf('--envenenado-equivalentes') !== -1;
const VENENO_DIVERSOS = process.argv.indexOf('--envenenado-diversos') !== -1;
const PORTA = 8816;

const APP_REPO = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const LINHA = 'var series = it.series_equivalentes && it.series_equivalentes.length ? it.series_equivalentes : [it.serie];';
const LINHA_VELHA = 'var series = banco && it.series_equivalentes && it.series_equivalentes.length ? it.series_equivalentes : [it.serie];';
const LINHA_DIVERSOS = 'return FONTES_DE_PROVA[it.fonte] ? !!it.tema_app : true;';
const trocas = {};
if (VENENO) trocas['/app.js'] = APP_REPO.split(LINHA).join(LINHA_VELHA);
if (VENENO_DIVERSOS) trocas['/app.js'] = APP_REPO.split(LINHA_DIVERSOS).join('return true;');

const hojeIso = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();
const lerDados = pag => pag.evaluate(() => Store.carregar());
// O anexo guardado, em base64, para o Node ler (como no testa_biblioteca_compor_tela).
const lerAnexo = (pag, id) => pag.evaluate(i => new Promise(r => {
  const q = indexedDB.open('apoio-educacional');
  q.onsuccess = () => {
    const g = q.result.transaction('anexos', 'readonly').objectStore('anexos').get(i);
    g.onsuccess = () => {
      q.result.close();
      if (!g.result || !g.result.blob) { r(null); return; }
      g.result.blob.arrayBuffer().then(buf => {
        let s = ''; const b = new Uint8Array(buf);
        for (let k = 0; k < b.length; k += 0x8000) s += String.fromCharCode.apply(null, b.subarray(k, k + 0x8000));
        r(btoa(s));
      });
    };
  };
}), id);
// Os textos (Tj) do PDF, em ordem: o pdf.js não comprime os fluxos.
function textosDoPdf(bytes) {
  const bruto = Buffer.from(bytes).toString('latin1');
  const out = [];
  const rx = /\(((?:\\.|[^\\()])*)\)\s*Tj/g;
  let t;
  while ((t = rx.exec(bruto))) out.push(t[1].replace(/\\([\\()])/g, '$1'));
  return out;
}

const amb = H.criarAmbiente(PORTA, 'perfil_bib_mirim', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'bib_mirim_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

async function importar(pag, arquivo) {
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => { document.querySelector('#estado-importacao-biblioteca').innerHTML = ''; });
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar('importação de ' + path.basename(arquivo), () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca');
    return c ? c.innerText.trim() : '';
  }), v => /^Biblioteca importada\.|não foi importado/.test(v || ''), 60000);
  return r.valor || '';
}

const lerCorpo = pag => pag.evaluate(() => {
  const c = document.querySelector('#bib-corpo');
  const blocos = [];
  let atual = null;
  Array.from(c.children).forEach(n => {
    if (n.classList.contains('bloco-exercicios')) { atual = { titulo: n.textContent.trim(), linhas: [] }; blocos.push(atual); }
    else if (n.classList.contains('item-lista') && atual) atual.linhas.push(n.querySelector('.nome').textContent.trim());
  });
  return { texto: c.innerText, blocos };
});
const chips = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#bib-corpo .bib-series .chip-filtro'))
  .map(c => c.textContent + (c.classList.contains('ativo') ? '*' : '')));
async function escolherSerie(pag, rotulo) {
  const ok = await pag.evaluate(r => {
    const c = Array.from(document.querySelectorAll('#bib-corpo .bib-series .chip-filtro')).find(x => x.textContent === r);
    if (!c) return false;
    c.click();
    return true;
  }, rotulo);
  await pausa(150);
  return ok;
}
async function tocarLinha(pag, nome) {
  const ok = await pag.evaluate(n => {
    const l = Array.from(document.querySelectorAll('#bib-corpo .item-lista')).find(x => x.querySelector('.nome').textContent.trim() === n);
    if (!l) return false;
    l.click();
    return true;
  }, nome);
  await pausa(150);
  return ok;
}

(async () => {
  console.log(VENENO
    ? 'MODO ENVENENADO (equivalentes): o app.js servido só espalha o Banco pelas séries; a Mirim tem de sumir do 2º ao 5º ano e o teste tem de enxergar.'
    : VENENO_DIVERSOS ? 'MODO ENVENENADO (diversos): o app.js servido trata todo módulo de prova como assunto; a aula tem de ganhar "Diversos" e o teste tem de enxergar.'
    : 'MODO NORMAL: pacotes de provas da Mirim e do ENEM na Biblioteca.');
  secao('0. O veneno é de verdade, e o sintético usa os assuntos do aplicativo');
  if (VENENO || VENENO_DIVERSOS) {
    conf('o app.js servido ficou DIFERENTE do repositório', trocas['/app.js'] !== APP_REPO ? 'diferente' : 'IGUAL', 'diferente');
    conf('e o veneno trocou exatamente uma ocorrência', APP_REPO.split(VENENO ? LINHA : LINHA_DIVERSOS).length - 1, 1);
    if (trocas['/app.js'] === APP_REPO) throw Object.assign(new Error('veneno não aplicado'), { jaContado: true });
  }
  const catalogo = JSON.parse(fs.readFileSync(path.join(H.RAIZ, 'banco', 'topicos', 'matematica.json'), 'utf8'));
  const titulo = {};
  catalogo.temas.forEach(t => { titulo[t.id] = t.pt.titulo; });
  const errados = [];
  Object.keys(Sintetico.ASSUNTOS_PROVA).forEach(s => Sintetico.ASSUNTOS_PROVA[s].forEach(([id, t]) => {
    if (id && titulo[id] !== t) errados.push(id + ': ' + t + ' x ' + titulo[id]);
  }));
  conf('todo módulo sintético com assunto tem o título do catálogo', errados.join('; '), '');

  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('1. Os três pacotes importam, e o resumo diz o nível');
  const z1 = path.join(TMP, 'm1.zip'); Sintetico.gerarProva(z1, { serie: 'm1' });
  const z2 = path.join(TMP, 'm2.zip'); Sintetico.gerarProva(z2, { serie: 'm2' });
  const ze = path.join(TMP, 'enem.zip'); Sintetico.gerarProva(ze, { serie: '3em' });
  const r1 = await importar(pag, z1);
  conf('importou a Mirim 1', /^Biblioteca importada\./.test(r1), true);
  conf('o resumo diz Mirim 1 com o 2º e o 3º ano', /Mirim 1 \(2º ano, 3º ano\)/.test(r1), true);
  const r2 = await importar(pag, z2);
  conf('importou a Mirim 2', /^Biblioteca importada\./.test(r2), true);
  conf('o resumo diz Mirim 2 com o 4º e o 5º ano', /Mirim 2 \(4º ano, 5º ano\)/.test(r2), true);
  conf('importou o ENEM', /^Biblioteca importada\./.test(await importar(pag, ze)), true);

  // ================================================================
  secao('2. As séries do 2º ao 5º ano, em ordem, e o nível não vira aba');
  await H.irParaAba(pag, 'biblioteca');
  await esperar('lista de módulos', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .item-lista').length), v => v > 0, 10000);
  const abas = (await chips(pag)).join(',');
  if (VENENO) {
    conf('envenenado: sem espalhar pelos equivalentes, a Mirim some do 2º ao 5º ano (defeito detectado)',
      /[2-5]º ano/.test(abas) ? 'ainda aparece: ' + abas : 'sumiu', 'sumiu');
    conf('envenenado: e o nível cru vira aba', /Mirim 1/.test(abas), true);
    if (pag.errosDePagina.length) console.log('   erros de página: ' + pag.errosDePagina.join(' | ').slice(0, 400));
    return;
  }
  conf('abas de série', abas, '2º ano*,3º ano,4º ano,5º ano,3ª série do médio');

  // ================================================================
  secao('3. Os assuntos de cada série');
  const esperado = {
    '2º ano': 'Adição até 100 | Diversos | Multiplicação: a ideia e a tabuada',
    '3º ano': 'Adição até 100 | Diversos | Multiplicação: a ideia e a tabuada',
    '4º ano': 'Diversos | Múltiplos e divisores | Perímetro e área',
    '5º ano': 'Diversos | Múltiplos e divisores | Perímetro e área',
    '3ª série do médio': 'Diversos | Revisão: contagem e probabilidade'
  };
  for (const s of Object.keys(esperado)) {
    const achou = await escolherSerie(pag, s);
    const corpo = await lerCorpo(pag);
    conf('no ' + s + ', os assuntos como módulos', achou ? corpo.blocos.map(b => b.titulo + ':' + b.linhas.join(' | ')).join(' / ') : 'sem a aba',
      'Módulos:' + esperado[s]);
  }

  // ================================================================
  secao('4. O assunto abre a prova como lista');
  await escolherSerie(pag, '2º ano');
  const abriu = await tocarLinha(pag, 'Adição até 100');
  const corpo = await lerCorpo(pag);
  conf('Adição até 100 tem a lista da prova', abriu ? corpo.blocos.map(b => b.titulo + ':' + b.linhas.join(' | ')).join(' / ') : 'sem o assunto',
    'Exercícios:OBMEP Mirim 2099, 1ª fase');
  const abriuLista = await tocarLinha(pag, 'OBMEP Mirim 2099, 1ª fase');
  const cartoes = abriuLista ? await esperar('questões da prova', () => pag.evaluate(() =>
    document.querySelectorAll('#bib-corpo .bib-grade-exercicios > *').length), v => v >= 2, 10000) : { valor: 0 };
  conf('a lista mostra as duas questões de adição da prova sintética', cartoes.valor, 2);

  // ================================================================
  secao('5. ENEM na tela cheia: sem solução, "Ver resposta" mostra a letra do gabarito');
  // de volta da lista e do módulo até as abas de série
  for (let i = 0; i < 3 && !(await pag.evaluate(() => !!document.querySelector('#bib-corpo .bib-series'))); i++) {
    await pag.evaluate(() => { const b = document.querySelector('#bib-corpo .bib-voltar'); if (b) b.click(); });
    await pausa(150);
  }
  conf('a série do ENEM foi escolhida', await escolherSerie(pag, '3ª série do médio'), true);
  await tocarLinha(pag, 'Revisão: contagem e probabilidade');
  await tocarLinha(pag, 'ENEM 2099');
  await esperar('cartões do ENEM', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .bib-cartao').length), v => v >= 1, 10000);
  await pag.evaluate(() => document.querySelector('#bib-corpo .bib-cartao').click());
  await esperar('tela cheia', () => pag.$eval('#modal-biblioteca', e => e.classList.contains('aberto')), v => v === true, 5000);
  conf('o botão diz "Ver resposta"', await pag.$eval('#bib-solucao', e => getComputedStyle(e).display !== 'none' && e.textContent), 'Ver resposta');
  conf('antes do toque, a resposta não aparece', await pag.evaluate(() => !!document.querySelector('#bib-resposta')), false);
  await pag.click('#bib-solucao');
  await pausa(150);
  conf('depois do toque, a letra do gabarito', await pag.evaluate(() => (document.querySelector('#bib-resposta') || {}).textContent), 'Resposta: A');
  conf('e o botão volta a esconder', await pag.$eval('#bib-solucao', e => e.textContent), 'Esconder a resposta');
  await pag.click('#bib-fechar-visor');
  await pausa(200);

  // ================================================================
  secao('6. Material numa aula: "Diversos" não vira assunto, e o gabarito do ENEM traz a resposta');
  await pag.evaluate(async h => {
    const d = await Store.carregar();
    d.aulas.push({ id: 'aula-mirim', alunoId: d.alunos[0].id, serieId: null, destacada: false, data: h, hora: '10:00',
      duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', temNota: false, anexos: [], temas: [] });
    await Store.salvar(d);
  }, hojeIso);
  // dois de Diversos, um de "Adição até 100" e um do ENEM (assunto "Revisão: contagem e probabilidade", resposta A)
  const marcados = ['mirim:2099:f1:m1:1', 'mirim:2099:f1:m1:3', 'mirim:2099:f1:m1:6', 'enem:2099:136'];
  await pag.evaluate(i => localStorage.setItem('apoio-educacional:bib-carrinho', JSON.stringify({ itens: i, paginas: [] })), marcados);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'biblioteca');
  await esperar('seleção de volta', () => pag.evaluate(() => { const b = document.querySelector('#bib-carrinho-gerar'); return !!b && !b.disabled; }), v => v === true, 10000);
  await pag.click('#bib-carrinho-gerar');
  await esperar('janela Gerar material', () => pag.$eval('#modal-bib-gerar', e => e.classList.contains('aberto')), v => v === true, 5000);
  conf('o gabarito vem marcado', await pag.$eval('#bib-gerar-gabarito', e => e.checked), true);
  await pag.evaluate(() => { document.querySelector('#bib-gerar-aulas [data-aula="aula-mirim"]').click(); });
  await pag.click('#bib-gerar-anexar');
  const anexou = await esperar('material anexado', () => lerDados(pag).then(d => {
    const a = d.aulas.filter(x => x.id === 'aula-mirim')[0];
    return a && (a.anexos || []).filter(n => n.biblioteca).length >= 2 ? a : null;
  }), v => !!v, 30000);
  const aula = anexou.valor || { temas: [], anexos: [] };
  const titulos = (aula.temas || []).map(t => t.titulo).join(' | ');
  if (VENENO_DIVERSOS) {
    conf('envenenado: "Diversos" virou assunto da aula (defeito detectado)', /Diversos/.test(titulos), true);
    return;
  }
  conf('a aula ganhou os assuntos de verdade, e não "Diversos"', titulos, 'Adição até 100 | Revisão: contagem e probabilidade');
  const gab = (aula.anexos || []).filter(n => n.biblioteca && n.parte === 'gabarito')[0];
  const textos = gab ? textosDoPdf(Buffer.from(await lerAnexo(pag, gab.id) || '', 'base64')) : [];
  conf('no gabarito, a questão 4 (ENEM) traz "Resposta: A"', textos[textos.indexOf('Resposta: A') - 1], '4.');
  conf('e as três da Mirim, a solução (nenhum "Sem solução na fonte.")', textos.indexOf('Sem solução na fonte.'), -1);

  if (pag.errosDePagina.length) console.log('   erros de página: ' + pag.errosDePagina.join(' | ').slice(0, 400));
  conf('nenhum erro de JavaScript na página', pag.errosDePagina.length, 0);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
