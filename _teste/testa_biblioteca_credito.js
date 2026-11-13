/* testa_biblioteca_credito.js
 *
 * O crédito que a licença da fonte pede (item L6 da frente "Listas de
 * exercícios"), no Chrome de verdade. Os Cadernos de Apoio e Aprendizagem da
 * SME-SP (Decreto municipal 52.681/2011, equivale à CC BY-NC-SA) exigem
 * atribuição, e o gerador põe em cada item os campos `atribuicao` e `licenca`.
 * O aplicativo desenha o que o item traz (nenhum texto de fonte escrito no
 * app.js), e item sem os dois campos fica exatamente como era.
 *
 * Usa dois pacotes SINTÉTICOS (nenhum conteúdo real de livro ou caderno): o
 * dos Cadernos (_pacote_sintetico.js, gerarCadernos), cujos itens trazem os
 * dois campos, e o do Portal (gerar), cujos itens não trazem nenhum.
 *
 * O que prova:
 *   1. o cartão de cada exercício dos Cadernos traz a linha de crédito com a
 *      atribuição e a licença do PRÓPRIO item (texto lido do pacote);
 *   2. a tela cheia traz o mesmo crédito;
 *   3. o cartão do Portal (item sem os campos) não tem linha de crédito;
 *   4. material com um exercício de cada, com a caixa "Mostrar a origem"
 *      DESMARCADA (o padrão): a lista e o gabarito, cada um no seu arquivo,
 *      trazem o bloco "Créditos" com exatamente uma linha, a do exercício dos
 *      Cadernos, com o número dele na folha; o do Portal não ganha linha;
 *   5. nenhum erro de JavaScript.
 *
 * Modo envenenado:
 *   node _teste/testa_biblioteca_credito.js --envenenado-sem-credito
 *     o pdf.js servido não desenha o bloco de créditos; a lista sai sem o
 *     crédito, e o teste tem de ENXERGAR isso.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const RELOGIO = H.relogioDaRodada('2026-11-16', '11:00');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const VENENO = process.argv.indexOf('--envenenado-sem-credito') !== -1;
const PORTA = 8974;

const PDF_REPO = fs.readFileSync(path.join(H.RAIZ, 'pdf.js'), 'utf8');
const LINHAS = ["      creditos('lista');", "      creditos('gabarito');"];
const trocas = {};
if (VENENO) trocas['/pdf.js'] = LINHAS.reduce((t, l) => t.split(l).join(''), PDF_REPO);

const hojeIso = RELOGIO.dia(0);
const lerDados = pag => pag.evaluate(() => Store.carregar());
function textosDoPdf(bytes) {
  const bruto = Buffer.from(bytes).toString('latin1');
  const out = [];
  const rx = /\(((?:\\.|[^\\()])*)\)\s*Tj/g;
  let t;
  while ((t = rx.exec(bruto))) out.push(t[1].replace(/\\([\\()])/g, '$1'));
  return out;
}
/* O bloco de créditos: as linhas depois do título "Créditos", juntas de novo
 * (o compositor quebra a linha longa em várias, sempre num espaço). */
function blocoDeCreditos(textos) {
  const k = textos.indexOf('Créditos');
  if (k < 0) return null;
  const linhas = [];
  textos.slice(k + 1).forEach(t => {
    if (/^(Exercício )?\d+\. /.test(t) || !linhas.length) linhas.push(t);
    else linhas[linhas.length - 1] += ' ' + t;
  });
  return linhas.filter(l => !/^Página \d+ de \d+$/.test(l));
}
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

const amb = H.criarAmbiente(PORTA, 'perfil_bib_credito', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'bib_credito_'));
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
const lerCartoes = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#bib-corpo .bib-cartao')).map(c => ({
  id: c.getAttribute('data-id'),
  creditos: Array.from(c.querySelectorAll('.bib-credito')).map(x => x.textContent)
})));
/* O começo da primeira linha, do tamanho do esperado: depois do bloco a página
 * ainda desenha a marca ("NW APOIO EDUCACIONAL"), que cai junto na leitura. */
const comeco = (linhas, esperado) => linhas && linhas[0] ? linhas[0].slice(0, esperado.length) : 'sem linha';
const creditoEsperado = it => 'Fonte: ' + it.atribuicao + ' Licença: ' + it.licenca;

(async () => {
  console.log(VENENO
    ? 'MODO ENVENENADO (sem crédito): o pdf.js servido não desenha os créditos; a lista tem de sair sem eles à vista do teste.'
    : 'MODO NORMAL: o crédito da licença no cartão, na tela cheia, na lista e no gabarito.');
  secao('0. O veneno é de verdade, e os pacotes sintéticos têm o que a prova precisa');
  if (VENENO) {
    conf('o pdf.js servido ficou DIFERENTE do repositório', trocas['/pdf.js'] !== PDF_REPO ? 'diferente' : 'IGUAL', 'diferente');
    conf('e o veneno tirou exatamente as duas chamadas', LINHAS.map(l => PDF_REPO.split(l).length - 1).join(','), '1,1');
    if (trocas['/pdf.js'] === PDF_REPO) throw Object.assign(new Error('veneno não aplicado'), { jaContado: true });
  }
  const zc = path.join(TMP, 'cadernos.zip');
  const zp = path.join(TMP, 'portal.zip');
  const cadernos = Sintetico.gerarCadernos(zc);
  const portal = Sintetico.gerar(zp);
  conf('todo item dos Cadernos traz atribuicao e licenca', cadernos.itens.every(i => i.atribuicao && i.licenca), true);
  conf('nenhum item do Portal traz atribuicao ou licenca', portal.itens.some(i => 'atribuicao' in i || 'licenca' in i), false);

  await amb.subir();
  const pag = await amb.pagina();
  await RELOGIO.naPagina(pag);
  await H.abrirApp(pag, amb.ORIGEM);
  await RELOGIO.conferir(pag);
  conf('importou os Cadernos', /^Biblioteca importada\./.test(await importar(pag, zc)), true);
  conf('importou o Portal', /^Biblioteca importada\./.test(await importar(pag, zp)), true);

  // ================================================================
  secao('1. O cartão dos Cadernos traz a atribuição e a licença do item');
  await H.irParaAba(pag, 'biblioteca');
  await esperar('lista de módulos', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .item-lista').length), v => v > 0, 10000);
  conf('aba do 3º ano', await escolherSerie(pag, '3º ano'), true);
  await tocarLinha(pag, 'Adição com reagrupamento');
  await tocarLinha(pag, 'Cadernos de Apoio e Aprendizagem, 3º ano');
  await esperar('cartões dos Cadernos', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .bib-cartao').length), v => v >= 2, 10000);
  const deCadernos = await lerCartoes(pag);
  const porId = {};
  cadernos.itens.forEach(i => { porId[i.id] = i; });
  conf('dois cartões dos Cadernos', deCadernos.length, 2);
  conf('cada cartão tem UMA linha de crédito', deCadernos.map(c => c.creditos.length).join(','), '1,1');
  conf('a linha é a atribuição e a licença do próprio item',
    deCadernos.filter(c => porId[c.id] && c.creditos[0] === creditoEsperado(porId[c.id])).length, 2);
  conf('o crédito diz a fonte, a SME-SP e a licença',
    deCadernos.every(c => /^Fonte: Cadernos de Apoio e Aprendizagem: Matemática, 3º ano \(SME-SP, 2014\), p\. \d+, .* Licença: Uso não comercial.*CC BY-NC-SA/.test(c.creditos[0] || '')), true);
  conf('o texto do crédito não tem travessão nem " - "', deCadernos.some(c => /[–—]| - /.test(c.creditos.join(' '))), false);

  // ================================================================
  secao('2. A tela cheia traz o mesmo crédito');
  await pag.evaluate(() => document.querySelector('#bib-corpo .bib-cartao').click());
  await esperar('tela cheia', () => pag.$eval('#modal-biblioteca', e => e.classList.contains('aberto')), v => v === true, 5000);
  const cheia = await pag.evaluate(() => Array.from(document.querySelectorAll('#modal-biblioteca .bib-credito')).map(x => x.textContent));
  conf('a tela cheia traz o crédito do primeiro cartão', cheia.join(' | '), deCadernos[0].creditos[0]);
  await pag.click('#bib-fechar-visor');
  await pausa(200);

  // ================================================================
  secao('3. O cartão do Portal (sem os campos) não tem linha de crédito');
  // volta da lista para os módulos da série, onde ficam as abas
  for (let k = 0; k < 3 && !(await pag.$('#bib-corpo .bib-series')); k++) {
    await pag.evaluate(() => { const v = document.querySelector('#bib-corpo .bib-voltar'); if (v) v.click(); });
    await pausa(150);
  }
  conf('aba do 9º ano', await escolherSerie(pag, '9º ano'), true);
  await tocarLinha(pag, 'Produtos Notáveis e Fatoração');
  // "Produtos Notáveis" é também a aula de teoria do módulo: a lista é a do bloco Exercícios, que vem por último
  await pag.evaluate(() => {
    const ls = Array.from(document.querySelectorAll('#bib-corpo .item-lista')).filter(x => x.querySelector('.nome').textContent.trim() === 'Produtos Notáveis');
    if (ls.length) ls[ls.length - 1].click();
  });
  await pausa(150);
  await esperar('cartões do Portal', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .bib-cartao').length), v => v >= 6, 10000);
  const doPortal = await lerCartoes(pag);
  conf('seis cartões do Portal', doPortal.length, 6);
  conf('nenhum deles tem linha de crédito', doPortal.filter(c => c.creditos.length).length, 0);
  conf('e nenhum .bib-credito na tela', await pag.evaluate(() => document.querySelectorAll('#bib-corpo .bib-credito').length), 0);

  // ================================================================
  secao('4. Material: o crédito na lista e no gabarito, sem depender da caixa "origem"');
  const idCad = cadernos.itens.filter(i => i.tema_app === 'MAT03-02')[0];
  const idPor = portal.itens.filter(i => /:produtos-notaveis:ex:1$/.test(i.id))[0];
  await pag.evaluate(async h => {
    const d = await Store.carregar();
    d.aulas.push({ id: 'aula-credito', alunoId: d.alunos[0].id, serieId: null, destacada: false, data: h, hora: '10:00',
      duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', temNota: false, anexos: [], temas: [] });
    await Store.salvar(d);
  }, hojeIso);
  await pag.evaluate(i => localStorage.setItem('apoio-educacional:bib-carrinho', JSON.stringify({ itens: i, paginas: [] })), [idPor.id, idCad.id]);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'biblioteca');
  await esperar('seleção de volta', () => pag.evaluate(() => { const b = document.querySelector('#bib-carrinho-gerar'); return !!b && !b.disabled; }), v => v === true, 10000);
  await pag.click('#bib-carrinho-gerar');
  await esperar('janela Gerar material', () => pag.$eval('#modal-bib-gerar', e => e.classList.contains('aberto')), v => v === true, 5000);
  const caixas = await pag.evaluate(() => ['lista', 'gabarito', 'origem'].map(k => k + ':' + document.querySelector('#bib-gerar-' + k).checked).join(','));
  conf('lista e gabarito marcados, origem DESMARCADA', caixas, 'lista:true,gabarito:true,origem:false');
  await pag.evaluate(() => { document.querySelector('#bib-gerar-aulas [data-aula="aula-credito"]').click(); });
  await pag.click('#bib-gerar-anexar');
  const anexou = await esperar('material anexado', () => lerDados(pag).then(d => {
    const a = d.aulas.filter(x => x.id === 'aula-credito')[0];
    return a && (a.anexos || []).filter(n => n.biblioteca).length >= 2 ? a : null;
  }), v => !!v, 30000);
  const aula = anexou.valor || { anexos: [] };
  const ler = async parte => {
    const a = (aula.anexos || []).filter(n => n.biblioteca && n.parte === parte)[0];
    return a ? textosDoPdf(Buffer.from(await lerAnexo(pag, a.id) || '', 'base64')) : [];
  };
  const lista = await ler('lista');
  const gabarito = await ler('gabarito');
  conf('a lista tem os dois exercícios', ['Exercício 1.', 'Exercício 2.'].filter(t => lista.indexOf(t) >= 0).length, 2);
  const credL = blocoDeCreditos(lista);
  if (VENENO) {
    conf('envenenado: a lista saiu sem créditos (defeito detectado)', credL === null ? 'sem créditos' : 'ainda tem', 'sem créditos');
    return;
  }
  const esperado = creditoEsperado(idCad);
  conf('a lista tem o bloco "Créditos" com UMA linha', credL ? credL.length : 'sem bloco', 1);
  conf('a linha é a do exercício 2 (o dos Cadernos), com a atribuição e a licença dele',
    comeco(credL, 'Exercício 2. ' + esperado), 'Exercício 2. ' + esperado);
  conf('o exercício 1 (Portal, sem os campos) não ganhou linha', (credL || []).some(l => /^Exercício 1\. /.test(l)), false);
  const credG = blocoDeCreditos(gabarito);
  conf('o gabarito, em arquivo separado, também tem o bloco com UMA linha', credG ? credG.length : 'sem bloco', 1);
  conf('a linha do gabarito é a do 2', comeco(credG, '2. ' + esperado), '2. ' + esperado);
  conf('a lista não traz a origem curta (a caixa estava desmarcada)', lista.some(t => /^Portal da OBMEP, /.test(t)), false);

  if (pag.errosDePagina.length) console.log('   erros de página: ' + pag.errosDePagina.join(' | ').slice(0, 400));
  conf('nenhum erro de JavaScript na página', pag.errosDePagina.length, 0);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
