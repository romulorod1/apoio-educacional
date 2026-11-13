/* testa_biblioteca_credito.js
 *
 * O crédito que a licença da fonte pede (item L6 da frente "Listas de
 * exercícios"), no Chrome de verdade. Os Cadernos de Apoio e Aprendizagem da
 * SME-SP (Decreto municipal 52.681/2011, equivale à CC BY-NC-SA) exigem
 * atribuição, e o gerador põe em cada item os campos `atribuicao`, `licenca`
 * e `link`. O aplicativo desenha o que o item traz (nenhum texto de fonte
 * escrito no app.js), e item sem os campos fica exatamente como era.
 *
 * Usa pacotes SINTÉTICOS (nenhum conteúdo real de livro ou caderno): o dos
 * Cadernos (_pacote_sintetico.js, gerarCadernos), cujos itens trazem os
 * campos, e o do Portal com listas prontas (gerar, listas: true), cujos itens
 * não trazem nenhum. Para a lista pronta ter um item com crédito, a prova
 * escreve os três campos num item do Portal depois de importar (a fonte
 * aberta "de amanhã": o app não sabe de onde o crédito veio).
 *
 * O que prova, superfície por superfície:
 *   cartao      o cartão da lista do assunto traz o crédito inteiro do próprio
 *               item (atribuição, licença e endereço); o do Portal não tem linha;
 *   visor       a tela cheia de CADA cartão traz o mesmo crédito;
 *   previa      a prévia da lista pronta: só o cartão do item com crédito tem a linha;
 *   edicao      a lista pronta em edição: idem;
 *   link        o endereço do item está no crédito do cartão e da folha;
 *   abrir       "Abrir como folha": o crédito vai QUEIMADO embaixo do recorte
 *               (a imagem colada cresce e a faixa nova tem tinta cinza); o
 *               recorte do Portal entra do tamanho de sempre;
 *   listafolha  "Abrir a lista como folha da aula": idem, por exercício;
 *   pdf         a lista e o gabarito (arquivos separados), com a caixa
 *               "origem" desmarcada: o bloco "Créditos" com exatamente uma
 *               linha, o texto INTEIRO do crédito com o número na folha;
 *   e nenhum erro de JavaScript.
 *
 * Modos envenenados (um por superfície; o veneno é a troca de UMA linha do
 * arquivo servido, e a prova tem de ver o defeito naquela superfície e só nela):
 *   node _teste/testa_biblioteca_credito.js --envenenado-<superfície>
 *   com <superfície> = cartao, visor, previa, edicao, link, abrir, listafolha, pdf.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const RELOGIO = H.relogioDaRodada('2026-11-16', '11:00');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8974;
const APP_REPO = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const PDF_REPO = fs.readFileSync(path.join(H.RAIZ, 'pdf.js'), 'utf8');
const NL = s => s.replace(/\n/g, APP_REPO.indexOf('\r\n') >= 0 ? '\r\n' : '\n');
const NLP = s => s.replace(/\n/g, PDF_REPO.indexOf('\r\n') >= 0 ? '\r\n' : '\n');

/* Cada veneno: o arquivo, as trocas (de, para) e o que ele quebra. */
const VENENOS = {
  cartao: { arq: '/app.js', trocas: [[NL("el('div', { class: 'bib-origem', texto: it.origem_citada }) : null,\n        linhaDeCredito(it)"),
    NL("el('div', { class: 'bib-origem', texto: it.origem_citada }) : null,\n        null")]] },
  visor: { arq: '/app.js', trocas: [["var credVisor = linhaDeCredito(peca.item, 'u-texto-centro');", 'var credVisor = null;']] },
  previa: { arq: '/app.js', trocas: [[NL("          etiquetaDesafio(it)\n        ]),\n        linhaDeCredito(it)"),
    NL("          etiquetaDesafio(it)\n        ]),\n        null")]] },
  edicao: { arq: '/app.js', trocas: [[NL("etiquetaDesafio(it) : null\n        ]),\n        linhaDeCredito(it)"),
    NL("etiquetaDesafio(it) : null\n        ]),\n        null")]] },
  link: { arq: '/app.js', trocas: [['    if (link) partes.push(link);', '']] },
  abrir: { arq: '/app.js', trocas: [['credito: peca.item ? creditoDaLicenca(peca.item) : null });', 'credito: null });']] },
  listafolha: { arq: '/app.js', trocas: [['imagemNumerada(p.enunciado, i + 1, 0, p.credito)', 'imagemNumerada(p.enunciado, i + 1, 0, null)']] },
  pdf: { arq: '/pdf.js', trocas: [[NLP("      creditos('lista');\n"), ''], [NLP("      creditos('gabarito');\n"), '']] }
};
const arg = process.argv.find(a => a.indexOf('--envenenado-') === 0);
const VENENO = arg ? arg.slice('--envenenado-'.length) : null;
if (VENENO && !VENENOS[VENENO]) { console.error('veneno desconhecido: ' + VENENO); process.exit(2); }
const trocas = {};
let contagemDoVeneno = [];
if (VENENO) {
  const v = VENENOS[VENENO];
  let t = v.arq === '/pdf.js' ? PDF_REPO : APP_REPO;
  contagemDoVeneno = v.trocas.map(([de]) => t.split(de).length - 1);
  v.trocas.forEach(([de, para]) => { t = t.split(de).join(para); });
  trocas[v.arq] = t;
}

/* A conferência de uma superfície: no modo normal ela tem de passar; no modo
 * envenenado daquela superfície ela tem de FALHAR (o defeito à vista); as
 * outras superfícies continuam tendo de passar. */
function deve(superficie, rotulo, obtido, esperado) {
  if (VENENO === superficie) {
    return conf('envenenado (' + superficie + '): ' + rotulo + ' QUEBROU (defeito detectado)', String(obtido) === String(esperado) ? 'passou' : 'quebrou', 'quebrou');
  }
  return conf(rotulo, obtido, esperado);
}

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
/* As linhas do bloco "Créditos": cada uma começa por "Exercício N. " (lista)
 * ou "N. " (gabarito); a continuação de uma linha quebrada vem nos Tj
 * seguintes. Devolve, para cada linha, o texto juntado de volta enquanto ele
 * continua o começo de um dos esperados (o que sobrar fica de fora, e a
 * comparação exata diz). */
function linhasDeCredito(textos, esperados) {
  const k = textos.indexOf('Créditos');
  if (k < 0) return null;
  const linhas = [];
  let i = k + 1;
  while (i < textos.length && /^(Exercício )?\d+\. Fonte: /.test(textos[i])) {
    let junto = textos[i++];
    while (i < textos.length && esperados.some(e => e.indexOf(junto + ' ' + textos[i]) === 0)) junto += ' ' + textos[i++];
    linhas.push(junto);
  }
  return linhas;
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

/* A imagem colada na folha: largura e altura, quanto ela passa da altura do
 * recorte (em px), e quantos pixels de tinta cinza (a cor do crédito
 * queimado) há nessa sobra. */
const analisarMidia = (pag, ref, razaoRecorte) => pag.evaluate((r, razao) => Store.lerMidia(r).then(m => new Promise(ok => {
  if (!m || !m.dataUrl) { ok(null); return; }
  const im = new Image();
  im.onload = () => {
    const cv = document.createElement('canvas');
    cv.width = im.width; cv.height = im.height;
    const cx = cv.getContext('2d');
    cx.drawImage(im, 0, 0);
    const doRecorte = Math.round(im.width * razao);
    const sobra = im.height - doRecorte;
    let cinza = 0;
    if (sobra > 2) {
      const d = cx.getImageData(0, doRecorte + 1, im.width, sobra - 1).data;
      for (let p = 0; p < d.length; p += 4) {
        const R = d[p], G = d[p + 1], B = d[p + 2];
        if (Math.max(R, G, B) < 200 && Math.abs(R - G) < 30 && Math.abs(G - B) < 40) cinza++;
      }
    }
    ok({ w: im.width, h: im.height, sobra, cinza, guardado: { w: m.w, h: m.h } });
  };
  im.onerror = () => ok(null);
  im.src = m.dataUrl;
})), ref, razaoRecorte);

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
async function voltarAsSeries(pag) {
  for (let k = 0; k < 4 && !(await pag.$('#bib-corpo .bib-series')); k++) {
    await pag.evaluate(() => { const v = document.querySelector('#bib-corpo .bib-voltar'); if (v) v.click(); });
    await pausa(150);
  }
}
async function escolherSerie(pag, rotulo) {
  await voltarAsSeries(pag);
  const ok = await pag.evaluate(r => {
    const c = Array.from(document.querySelectorAll('#bib-corpo .bib-series .chip-filtro')).find(x => x.textContent === r);
    if (!c) return false;
    c.click();
    return true;
  }, rotulo);
  await pausa(150);
  return ok;
}
/* A linha com aquele nome; com `ultima`, a última (a lista vem depois da teoria de mesmo nome). */
async function tocarLinha(pag, nome, ultima) {
  const ok = await pag.evaluate((n, u) => {
    const ls = Array.from(document.querySelectorAll('#bib-corpo .item-lista')).filter(x => x.querySelector('.nome').textContent.trim() === n);
    if (!ls.length) return false;
    ls[u ? ls.length - 1 : 0].click();
    return true;
  }, nome, !!ultima);
  await pausa(200);
  return ok;
}
const lerCartoes = (pag, sel) => pag.evaluate(s => Array.from(document.querySelectorAll(s + ' .bib-cartao')).map(c => ({
  id: c.getAttribute('data-id'),
  creditos: Array.from(c.querySelectorAll('.bib-credito')).map(x => x.textContent)
})), sel);
const creditoDe = it => 'Fonte: ' + it.atribuicao + ' Licença: ' + it.licenca + ' ' + it.link;
/* O crédito sem o endereço do fim: cada superfície confere o texto assim, e a
 * superfície "link" confere o endereço à parte (um veneno, uma falha). */
const semLink = t => String(t).replace(/ https:\/\/\S+$/, '');
async function abrirVisor(pag, sel, k) {
  await pag.evaluate((s, i) => document.querySelectorAll(s + ' .bib-cartao')[i].click(), sel, k);
  await esperar('tela cheia', () => pag.$eval('#modal-biblioteca', e => e.classList.contains('aberto')), v => v === true, 5000);
}
const creditoDoVisor = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#modal-biblioteca .bib-credito')).map(x => x.textContent).join(' | '));
async function fecharVisor(pag) {
  await pag.click('#bib-fechar-visor');
  await pausa(200);
}
async function recarregar(pag) {
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'biblioteca');
  await esperar('biblioteca de volta', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .item-lista').length), v => v > 0, 10000);
}
/* As imagens da folha da aula, na ordem das páginas. */
const imagensDaFolha = (pag, aulaId) => pag.evaluate(a => Store.lerNota(a).then(n =>
  ((n && n.paginas) || []).reduce((l, p) => l.concat((p.itens || []).filter(i => i.t === 'imagem')), [])), aulaId);

(async () => {
  console.log(VENENO ? 'MODO ENVENENADO (' + VENENO + '): a superfície envenenada tem de quebrar à vista da prova, e só ela.'
    : 'MODO NORMAL: o crédito da licença em todas as superfícies.');
  secao('0. O veneno é de verdade, e os pacotes sintéticos têm o que a prova precisa');
  if (VENENO) {
    const v = VENENOS[VENENO];
    conf('o arquivo servido ficou DIFERENTE do repositório', trocas[v.arq] !== (v.arq === '/pdf.js' ? PDF_REPO : APP_REPO) ? 'diferente' : 'IGUAL', 'diferente');
    conf('e cada troca do veneno casou exatamente uma vez', contagemDoVeneno.join(','), v.trocas.map(() => 1).join(','));
    if (contagemDoVeneno.some(n => n !== 1)) throw Object.assign(new Error('veneno não aplicado'), { jaContado: true });
  }
  const zc = path.join(TMP, 'cadernos.zip');
  const zp = path.join(TMP, 'portal.zip');
  const cadernos = Sintetico.gerarCadernos(zc);
  const portal = Sintetico.gerar(zp, { listas: true });
  conf('todo item dos Cadernos traz atribuicao, licenca e link', cadernos.itens.every(i => i.atribuicao && i.licenca && /^https:\/\//.test(i.link)), true);
  conf('nenhum item do Portal traz atribuicao, licenca ou link', portal.itens.some(i => 'atribuicao' in i || 'licenca' in i || 'link' in i), false);
  const LISTA = Sintetico.LISTAS.filter(l => l.nivel === 2 && l.modulo.indexOf('equacoes') >= 0)[0];
  const ID_ABERTO = LISTA.degraus[1].item;   // o 2º da lista pronta ganha os campos
  const ABERTO = { atribuicao: 'Fonte aberta sintética, exercício de teste (Autoria Sintética, 2026).',
    /* o endereço é UMA palavra muito mais larga que o recorte de 262 pt: no
     * crédito queimado ela tem de quebrar por caractere, e não sair cortada na borda */
    licenca: 'Licença aberta sintética, com atribuição (equivale a CC BY-NC-SA).', link: 'https://example.invalid/fonte-aberta/' + 'x'.repeat(600) };
  /* O 2º item dos Cadernos fica SEM `link`, como num pacote importado antes do
   * campo: o crédito usa o fonte.url do manifest do pacote. */
  const SEM_LINK = cadernos.itens.filter(i => i.tema_app === 'MAT03-02')[1];
  const URL_DO_MANIFEST = cadernos.manifest.fonte.url;

  await amb.subir();
  const pag = await amb.pagina();
  await RELOGIO.naPagina(pag);
  await H.abrirApp(pag, amb.ORIGEM);
  await RELOGIO.conferir(pag);
  conf('importou os Cadernos', /^Biblioteca importada\./.test(await importar(pag, zc)), true);
  conf('importou o Portal', /^Biblioteca importada\./.test(await importar(pag, zp)), true);
  /* O item do Portal com os campos de uma fonte aberta, escrito no depósito
   * como o importador o teria gravado, e uma aula de hoje para as folhas. */
  const escreveu = await pag.evaluate((id, campos) => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => {
      const t = q.result.transaction('biblioteca_itens', 'readwrite');
      const s = t.objectStore('biblioteca_itens');
      const g = s.get(id);
      g.onsuccess = () => { if (g.result) s.put(Object.assign(g.result, campos)); };
      t.oncomplete = () => { q.result.close(); r(!!g.result); };
      t.onerror = () => r(false);
    };
  }), ID_ABERTO, ABERTO);
  conf('o item aberto da lista pronta ganhou os campos', escreveu, true);
  const tirou = await pag.evaluate(id => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => {
      const t = q.result.transaction('biblioteca_itens', 'readwrite');
      const s = t.objectStore('biblioteca_itens');
      const g = s.get(id);
      g.onsuccess = () => { if (g.result) { delete g.result.link; s.put(g.result); } };
      t.oncomplete = () => { q.result.close(); r(!!g.result); };
      t.onerror = () => r(false);
    };
  }), SEM_LINK.id);
  conf('o 2º item dos Cadernos ficou sem link, e o manifest tem url', tirou && /^https:\/\//.test(URL_DO_MANIFEST), true);
  await pag.evaluate(async h => {
    const d = await Store.carregar();
    d.aulas.push({ id: 'aula-credito', alunoId: d.alunos[0].id, serieId: null, destacada: false, data: h, hora: '10:00',
      duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', temNota: false, anexos: [], temas: [] });
    await Store.salvar(d);
  }, hojeIso);
  await recarregar(pag);
  const porId = {};
  cadernos.itens.forEach(i => { porId[i.id] = i; });
  porId[ID_ABERTO] = ABERTO;
  porId[SEM_LINK.id] = Object.assign({}, SEM_LINK, { link: URL_DO_MANIFEST });

  // ================================================================
  secao('1. Cartões e tela cheia dos Cadernos (cartao, visor, link)');
  conf('aba do 3º ano', await escolherSerie(pag, '3º ano'), true);
  await tocarLinha(pag, 'Adição com reagrupamento');
  await tocarLinha(pag, 'Cadernos de Apoio e Aprendizagem, 3º ano');
  await esperar('cartões dos Cadernos', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .bib-cartao').length), v => v >= 2, 10000);
  const deCadernos = await lerCartoes(pag, '#bib-corpo');
  conf('dois cartões dos Cadernos', deCadernos.length, 2);
  deve('cartao', 'cada cartão tem UMA linha de crédito, com o texto inteiro do próprio item',
    deCadernos.map(c => c.creditos.length === 1 && semLink(c.creditos[0]) === semLink(creditoDe(porId[c.id]))).join(','), 'true,true');
  if (VENENO !== 'cartao') {
    deve('link', 'o crédito do cartão termina no endereço do item', deCadernos.map(c => c.creditos[0] === creditoDe(porId[c.id])).join(','), 'true,true');
  }
  if (VENENO !== 'cartao') {
    deve('link', 'o item sem link mostra o endereço do manifest do pacote',
      (deCadernos.filter(c => c.id === SEM_LINK.id)[0] || { creditos: [] }).creditos[0], creditoDe(porId[SEM_LINK.id]));
  }
  conf('o crédito não tem travessão nem " - "', deCadernos.some(c => /[–—]| - /.test(c.creditos.join(' '))), false);
  const visores = [];
  for (let k = 0; k < deCadernos.length; k++) {
    await abrirVisor(pag, '#bib-corpo', k);
    visores.push(await creditoDoVisor(pag));
    await fecharVisor(pag);
  }
  deve('visor', 'a tela cheia de CADA cartão traz o crédito do item',
    visores.map((v, k) => semLink(v) === semLink(creditoDe(porId[deCadernos[k].id]))).join(','), 'true,true');

  // ================================================================
  secao('2. Cartões do Portal, sem os campos: nenhuma linha de crédito');
  conf('aba do 9º ano', await escolherSerie(pag, '9º ano'), true);
  await tocarLinha(pag, 'Produtos Notáveis e Fatoração');
  await tocarLinha(pag, 'Produtos Notáveis', true);
  await esperar('cartões do Portal', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .bib-cartao').length), v => v >= 6, 10000);
  const doPortal = await lerCartoes(pag, '#bib-corpo');
  conf('seis cartões do Portal', doPortal.length, 6);
  conf('nenhum deles tem linha de crédito', doPortal.filter(c => c.creditos.length).length, 0);
  await abrirVisor(pag, '#bib-corpo', 0);
  conf('a tela cheia do Portal não tem crédito', await creditoDoVisor(pag), '');
  await fecharVisor(pag);

  // ================================================================
  secao('3. A lista pronta: a prévia e a edição (previa, edicao)');
  await escolherSerie(pag, '9º ano');
  await tocarLinha(pag, 'Equações do Segundo Grau');
  const abriu = await pag.evaluate(id => {
    const l = document.querySelector('#bib-corpo [data-lista-pronta="' + id + '"]');
    if (!l) return false; l.click(); return true;
  }, LISTA.id);
  conf('abriu a lista pronta do nível 2', abriu, true);
  await esperar('prévia da lista pronta', () => pag.evaluate(() => document.querySelectorAll('#bib-lp-previa .bib-cartao').length), v => v >= 2, 10000);
  const previa = await lerCartoes(pag, '#bib-lp-previa');
  deve('previa', 'na prévia, só o item aberto tem a linha, com o crédito inteiro dele',
    previa.filter(c => c.creditos.length).map(c => c.id + '=' + (semLink(c.creditos[0]) === semLink(creditoDe(ABERTO)))).join(','), ID_ABERTO + '=true');
  conf('a prévia mostra os ' + LISTA.degraus.length + ' exercícios', previa.length, LISTA.degraus.length);
  await pag.evaluate(() => document.querySelector('#bib-lp-usar').click());
  await esperar('lista pronta em edição', () => pag.evaluate(() => document.querySelectorAll('#bib-lp-grade .bib-cartao').length), v => v >= 2, 10000);
  const edicao = await lerCartoes(pag, '#bib-lp-grade');
  deve('edicao', 'na edição, só o item aberto tem a linha, com o crédito inteiro dele',
    edicao.filter(c => c.creditos.length).map(c => c.id + '=' + (semLink(c.creditos[0]) === semLink(creditoDe(ABERTO)))).join(','), ID_ABERTO + '=true');
  if (VENENO !== 'edicao') deve('link', 'o crédito da lista pronta termina no endereço do item aberto', (edicao.filter(c => c.id === ID_ABERTO)[0] || { creditos: [] }).creditos[0], creditoDe(ABERTO));
  const kAberto = edicao.map(c => c.id).indexOf(ID_ABERTO);
  await abrirVisor(pag, '#bib-lp-grade', kAberto);
  deve('visor', 'a tela cheia do item aberto da lista pronta traz o crédito', semLink(await creditoDoVisor(pag)), semLink(creditoDe(ABERTO)));
  await fecharVisor(pag);

  // ================================================================
  secao('4. "Abrir como folha": o crédito queimado embaixo do recorte (abrir)');
  const cad = cadernos.itens.filter(i => i.tema_app === 'MAT03-02')[0];
  const razaoCad = cad.medidas.enunciado.altura_pt / cad.medidas.enunciado.largura_pt;
  async function abrirComoFolha(serie, modulo, lista, ultima, indice) {
    await recarregar(pag);
    await escolherSerie(pag, serie);
    await tocarLinha(pag, modulo);
    await tocarLinha(pag, lista, ultima);
    await esperar('cartões', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .bib-cartao').length), v => v >= 1, 10000);
    const antes = (await imagensDaFolha(pag, 'aula-credito')).length;
    await abrirVisor(pag, '#bib-corpo', indice);
    await pag.click('#bib-como-folha');
    await esperar('escolha da aula', () => pag.$eval('#modal-bib-folha', e => e.classList.contains('aberto')), v => v === true, 5000);
    await pag.evaluate(() => document.querySelector('#corpo-modal-bib-folha .item-lista').click());
    const r = await esperar('recorte colado na folha', () => imagensDaFolha(pag, 'aula-credito'), v => v && v.length > antes, 20000);
    return (r.valor || [])[antes] || null;
  }
  const colCad = await abrirComoFolha('3º ano', 'Adição com reagrupamento', 'Cadernos de Apoio e Aprendizagem, 3º ano', false, 0);
  const imgCad = colCad ? await analisarMidia(pag, colCad.ref, razaoCad) : null;
  console.log('   recorte dos Cadernos colado: ' + JSON.stringify(imgCad));
  deve('abrir', 'o recorte dos Cadernos cresceu com a faixa do crédito, e a faixa tem tinta',
    !!imgCad && imgCad.sobra > imgCad.w * 0.03 && imgCad.cinza > 200, true);
  conf('a caixa na folha tem a proporção da imagem (nada esticado)',
    !!colCad && !!imgCad && Math.abs(colCad.h / colCad.w - imgCad.h / imgCad.w) < 0.01, true);
  conf('o registro da mídia diz o tamanho da imagem', !!imgCad && imgCad.guardado.w === imgCad.w && imgCad.guardado.h === imgCad.h, true);
  const por1 = portal.itens.filter(i => /:produtos-notaveis:ex:1$/.test(i.id))[0];
  const colPor = await abrirComoFolha('9º ano', 'Produtos Notáveis e Fatoração', 'Produtos Notáveis', true, 0);
  const imgPor = colPor ? await analisarMidia(pag, colPor.ref, por1.medidas.enunciado.altura_pt / por1.medidas.enunciado.largura_pt) : null;
  console.log('   recorte do Portal colado: ' + JSON.stringify(imgPor));
  conf('o recorte do Portal (sem crédito) entra do tamanho de sempre', !!imgPor && Math.abs(imgPor.sobra) <= 2 && imgPor.cinza === 0, true);
  /* O endereço longo do item aberto, num recorte de 262 pt: quebrado por
   * caractere, ele toma várias linhas (cortado na borda, tomaria uma só). */
  const ab = portal.itens.filter(i => i.id === ID_ABERTO)[0];
  const colAb = await abrirComoFolha('9º ano', 'Equações do Segundo Grau', 'Soma e Produto', false, 0);
  const imgAb = colAb ? await analisarMidia(pag, colAb.ref, ab.medidas.enunciado.altura_pt / ab.medidas.enunciado.largura_pt) : null;
  const linhaPx = imgAb ? Math.ceil(6.5 * (imgAb.w / ab.medidas.enunciado.largura_pt) * 1.35) : 1;
  console.log('   recorte do item aberto colado: ' + JSON.stringify(imgAb) + ', linha de ' + linhaPx + ' px');
  // sem o endereço (veneno link) não há palavra larga para quebrar
  if (VENENO !== 'link') deve('abrir', 'o endereço mais largo que o recorte quebra por caractere (mais de 8 linhas de crédito)',
    !!imgAb && imgAb.sobra > 8 * linhaPx && imgAb.cinza > 200, true);

  // ================================================================
  secao('5. Material: lista e gabarito em PDF, e a lista como folha (pdf, listafolha)');
  await pag.evaluate(i => localStorage.setItem('apoio-educacional:bib-carrinho', JSON.stringify({ itens: i, paginas: [] })), [por1.id, cad.id]);
  await recarregar(pag);
  await esperar('seleção de volta', () => pag.evaluate(() => { const b = document.querySelector('#bib-carrinho-gerar'); return !!b && !b.disabled; }), v => v === true, 10000);
  await pag.click('#bib-carrinho-gerar');
  await esperar('janela Gerar material', () => pag.$eval('#modal-bib-gerar', e => e.classList.contains('aberto')), v => v === true, 5000);
  conf('lista e gabarito marcados, origem DESMARCADA', await pag.evaluate(() => ['lista', 'gabarito', 'origem']
    .map(k => k + ':' + document.querySelector('#bib-gerar-' + k).checked).join(',')), 'lista:true,gabarito:true,origem:false');
  await pag.evaluate(() => { document.querySelector('#bib-gerar-aulas [data-aula="aula-credito"]').click(); });
  await esperar('caixa da folha liga', () => pag.evaluate(() => !document.querySelector('#bib-gerar-folha').disabled), v => v === true, 5000);
  await pag.evaluate(() => { const c = document.querySelector('#bib-gerar-folha'); if (!c.checked) c.click(); });
  const antesLista = (await imagensDaFolha(pag, 'aula-credito')).length;
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
  const espL = 'Exercício 2. ' + creditoDe(cad), espG = '2. ' + creditoDe(cad);
  const credL = linhasDeCredito(lista, [espL, semLink(espL)]);
  const credG = linhasDeCredito(gabarito, [espG, semLink(espG)]);
  deve('pdf', 'a lista tem o bloco "Créditos" com UMA linha, o texto INTEIRO do exercício 2 (o dos Cadernos)',
    credL ? credL.map(semLink).join(' || ') : 'sem bloco', semLink(espL));
  deve('pdf', 'o gabarito, em arquivo separado, também: UMA linha, a do 2, inteira',
    credG ? credG.map(semLink).join(' || ') : 'sem bloco', semLink(espG));
  if (VENENO !== 'pdf') {
    deve('link', 'a linha da lista e a do gabarito terminam no endereço', [credL && credL[0] === espL, credG && credG[0] === espG].join(','), 'true,true');
  }
  conf('a lista não traz a origem curta (a caixa estava desmarcada)', lista.some(t => /^Portal da OBMEP, /.test(t)), false);

  const novas = (await esperar('a lista na folha', () => imagensDaFolha(pag, 'aula-credito'), v => v && v.length >= antesLista + 2, 20000)).valor || [];
  const [fPor, fCad] = novas.slice(antesLista);
  // na folha o número vai numa faixa de 16 pt em cima quando o rótulo não cabe no lugar (o dos Cadernos não tem rótulo)
  const aCad = fCad ? await analisarMidia(pag, fCad.ref, (cad.medidas.enunciado.altura_pt + 16) / cad.medidas.enunciado.largura_pt) : null;
  console.log('   lista como folha, o dos Cadernos: ' + JSON.stringify(aCad));
  deve('listafolha', 'na lista como folha, o recorte dos Cadernos leva o crédito queimado embaixo',
    !!aCad && aCad.sobra > aCad.w * 0.03 && aCad.cinza > 200, true);
  conf('e a caixa dele na folha tem a proporção da imagem', !!fCad && !!aCad && Math.abs(fCad.h / fCad.w - aCad.h / aCad.w) < 0.01, true);
  const aPor = fPor ? await analisarMidia(pag, fPor.ref, 1) : null;
  conf('o do Portal não ganha faixa de crédito (altura do recorte com ou sem a faixa do número)',
    !!aPor && [0, 16].some(f => Math.abs(aPor.h - Math.round(aPor.w * (por1.medidas.enunciado.altura_pt + f) / por1.medidas.enunciado.largura_pt)) <= 2), true);

  if (pag.errosDePagina.length) console.log('   erros de página: ' + pag.errosDePagina.join(' | ').slice(0, 400));
  conf('nenhum erro de JavaScript na página', pag.errosDePagina.length, 0);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
