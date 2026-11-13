/* testa_gabarito_agente.js
 *
 * O gabarito resolvido por agente e conferido, no Chrome de verdade. Fonte
 * sem solução (os Cadernos de Apoio e Aprendizagem da SME-SP: o caderno do
 * aluno não traz respostas) pode trazer no item o campo aditivo
 *   gabarito: { origem: 'agente-conferido', respostas: [{ subitem, resposta }] }
 * que o gerador grava pelo --gabarito-externo (a resposta de duas IAs que
 * resolveram separadas e concordaram). Onde a resposta aparece, a marca
 * "Resposta conferida por duas IAs" vai SEMPRE junto; tocar nela diz o porquê.
 *
 * Usa um pacote SINTÉTICO (nenhum conteúdo real de caderno): o dos Cadernos do
 * _pacote_sintetico.js, com o campo `gabarito` escrito no PRIMEIRO item da
 * lista "Adição com reagrupamento" do 3º ano antes de montar o zip (o
 * importador o recebe como recebe qualquer campo aditivo). O SEGUNDO item da
 * mesma lista fica sem o campo.
 *
 * O que prova:
 *   visor   a tela cheia do item com gabarito: a marca à vista antes de abrir a
 *           resposta, o "Ver resposta", as respostas por subitem e a marca
 *           depois de abrir; tocar na marca mostra o porquê;
 *   pdf     o gabarito do material, com a caixa "origem" DESMARCADA: as
 *           respostas do 1 e a marca com o porquê, uma vez só; o 2 continua
 *           "Sem solução na fonte."; a lista não leva resposta nem marca;
 *   o item sem `gabarito` não mostra nada novo (nem marca, nem botão de
 *   resposta), e nenhum erro de JavaScript.
 *
 * Modos envenenados (a troca de UMA linha do arquivo servido; a prova tem de
 * ver a marca sumida naquela superfície, e só nela):
 *   node _teste/testa_gabarito_agente.js --envenenado-sem-marca-visor
 *   node _teste/testa_gabarito_agente.js --envenenado-sem-marca-pdf
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const H = require('./_bib_navegador.js');
const RELOGIO = H.relogioDaRodada('2026-11-16', '11:00');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8979;
const APP_REPO = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const PDF_REPO = fs.readFileSync(path.join(H.RAIZ, 'pdf.js'), 'utf8');

const MARCA = 'Resposta conferida por duas IAs';
const PORQUE = 'Este livro não traz gabarito. Duas IAs resolveram separadas e chegaram à mesma resposta.';

/* Cada veneno: o arquivo e a troca (de, para). */
const VENENOS = {
  'sem-marca-visor': { arq: '/app.js', de: '    if (doAgente) corpo.appendChild(marcaDoAgente());', para: '' },
  'sem-marca-pdf': { arq: '/pdf.js', de: '      marcaDoAgenteNaFolha(x, larg);', para: '' }
};
/* Os modos aceitos, por extenso: o testa_venenos_existem confere que cada
 * veneno que o portão chama aparece escrito nesta prova. */
const MODOS = {
  '--envenenado-sem-marca-visor': 'sem-marca-visor',
  '--envenenado-sem-marca-pdf': 'sem-marca-pdf'
};
const arg = process.argv.find(a => a.indexOf('--envenenado-') === 0);
if (arg && !MODOS[arg]) { console.error('veneno desconhecido: ' + arg); process.exit(2); }
const VENENO = arg ? MODOS[arg] : null;
const SUPERFICIE = VENENO === 'sem-marca-visor' ? 'visor' : VENENO === 'sem-marca-pdf' ? 'pdf' : null;
const trocas = {};
let contagemDoVeneno = 0;
if (VENENO) {
  const v = VENENOS[VENENO];
  const t = v.arq === '/pdf.js' ? PDF_REPO : APP_REPO;
  contagemDoVeneno = t.split(v.de).length - 1;
  trocas[v.arq] = t.split(v.de).join(v.para);
}

/* No modo normal a conferência tem de passar; no veneno daquela superfície,
 * tem de FALHAR (o defeito à vista); as outras continuam tendo de passar. */
function deve(superficie, rotulo, obtido, esperado) {
  if (SUPERFICIE === superficie) {
    return conf('envenenado (' + superficie + '): ' + rotulo + ' QUEBROU (defeito detectado)',
      String(obtido) === String(esperado) ? 'passou' : 'quebrou', 'quebrou');
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

/* O pacote sintético dos Cadernos, com o campo `gabarito` no primeiro item
 * da lista: itens.json reescrito, o hash dele no manifest e a contagem. */
function pacoteComGabarito(saida) {
  const base = Sintetico.gerarCadernos(null);
  const itens = JSON.parse(JSON.stringify(base.itens));
  const daLista = itens.filter(i => i.tema_app === 'MAT03-02');
  const com = daLista[0], sem = daLista[1];
  com.gabarito = { origem: 'agente-conferido', respostas: [
    { subitem: '1', resposta: '38 figurinhas' }, { subitem: '2', resposta: '12 a mais que o Caio' }] };
  const json = o => Buffer.from(JSON.stringify(o, null, 1) + '\n', 'utf8');
  const sha = b => 'sha256:' + crypto.createHash('sha256').update(b).digest('hex');
  const arquivos = Object.assign({}, base.arquivos, { 'itens.json': { dados: json(itens), metodo: 8 } });
  const nomes = Object.keys(arquivos).sort();
  const manifest = JSON.parse(JSON.stringify(base.manifest));
  manifest.arquivos = {};
  nomes.forEach(n => { manifest.arquivos[n] = sha(arquivos[n].dados); });
  manifest.contagens.itens_com_gabarito_agente = 1;
  const zip = Sintetico.montarZip([{ nome: 'manifest.json', dados: json(manifest), metodo: 8 }]
    .concat(nomes.map(n => ({ nome: n, dados: arquivos[n].dados, metodo: arquivos[n].metodo }))));
  fs.writeFileSync(saida, zip);
  return { com, sem };
}

const amb = H.criarAmbiente(PORTA, 'perfil_gabarito_agente', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'gabarito_agente_'));
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
async function recarregar(pag) {
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'biblioteca');
  await esperar('biblioteca de volta', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .item-lista').length), v => v > 0, 10000);
}
async function escolherSerie(pag, rotulo) {
  for (let k = 0; k < 4 && !(await pag.$('#bib-corpo .bib-series')); k++) {
    await pag.evaluate(() => { const v = document.querySelector('#bib-corpo .bib-voltar'); if (v) v.click(); });
    await pausa(150);
  }
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
    const l = Array.from(document.querySelectorAll('#bib-corpo .item-lista')).filter(x => x.querySelector('.nome').textContent.trim() === n)[0];
    if (!l) return false;
    l.click();
    return true;
  }, nome);
  await pausa(200);
  return ok;
}
async function abrirVisorDe(pag, id) {
  const ok = await pag.evaluate(i => {
    const c = document.querySelector('#bib-corpo .bib-cartao[data-id="' + i + '"]');
    if (!c) return false;
    c.click();
    return true;
  }, id);
  if (ok) await esperar('tela cheia', () => pag.$eval('#modal-biblioteca', e => e.classList.contains('aberto')), v => v === true, 5000);
  return ok;
}
/* O que a tela cheia mostra: a marca (texto do resumo, aberta ou não, e se o
 * porquê está à vista), as respostas e o botão de resposta. */
const lerVisor = pag => pag.evaluate(() => {
  const m = document.querySelector('#modal-biblioteca #bib-marca-ia');
  const ex = document.querySelector('#modal-biblioteca #bib-marca-ia-explica');
  const r = document.querySelector('#modal-biblioteca #bib-resposta-agente');
  const b = document.querySelector('#bib-solucao');
  const corpo = document.querySelector('#corpo-modal-biblioteca');
  return {
    marca: m ? m.querySelector('summary').textContent : null,
    marcaVisivel: !!m && m.getClientRects().length > 0,
    porqueVisivel: !!ex && ex.getClientRects().length > 0 ? ex.innerText.trim() : '',
    respostas: r ? Array.from(r.children).map(x => x.textContent) : null,
    botao: b && b.style.display !== 'none' ? b.textContent : null,
    corpoTemIA: /IAs/.test(corpo ? corpo.innerText : '')
  };
});

(async () => {
  console.log(VENENO ? 'MODO ENVENENADO (' + VENENO + '): a marca some na superfície ' + SUPERFICIE + ', e a prova tem de ver.'
    : 'MODO NORMAL: as respostas e a marca na tela cheia e no gabarito do PDF.');
  secao('0. O veneno é de verdade, e o pacote sintético tem o que a prova precisa');
  if (VENENO) {
    const v = VENENOS[VENENO];
    conf('o arquivo servido ficou DIFERENTE do repositório', trocas[v.arq] !== (v.arq === '/pdf.js' ? PDF_REPO : APP_REPO) ? 'diferente' : 'IGUAL', 'diferente');
    conf('e a troca do veneno casou exatamente uma vez', contagemDoVeneno, 1);
    if (contagemDoVeneno !== 1) throw Object.assign(new Error('veneno não aplicado'), { jaContado: true });
  }
  const zc = path.join(TMP, 'cadernos-gabarito.zip');
  const { com, sem } = pacoteComGabarito(zc);
  conf('o primeiro item da lista tem gabarito agente-conferido e o segundo não', [!!com.gabarito, 'gabarito' in sem].join(','), 'true,false');
  conf('os dois são sem solução', [com, sem].every(i => i.sem_solucao && !i.assets.solucao), true);

  await amb.subir();
  const pag = await amb.pagina();
  await RELOGIO.naPagina(pag);
  await H.abrirApp(pag, amb.ORIGEM);
  await RELOGIO.conferir(pag);
  conf('importou os Cadernos com o gabarito', /^Biblioteca importada\./.test(await importar(pag, zc)), true);
  await pag.evaluate(async h => {
    const d = await Store.carregar();
    d.aulas.push({ id: 'aula-gabarito', alunoId: d.alunos[0].id, serieId: null, destacada: false, data: h, hora: '10:00',
      duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', temNota: false, anexos: [], temas: [] });
    await Store.salvar(d);
  }, hojeIso);
  await recarregar(pag);

  // ================================================================
  secao('1. A tela cheia do item com gabarito (visor)');
  conf('aba do 3º ano', await escolherSerie(pag, '3º ano'), true);
  await tocarLinha(pag, 'Adição com reagrupamento');
  await tocarLinha(pag, 'Cadernos de Apoio e Aprendizagem, 3º ano');
  await esperar('cartões dos Cadernos', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .bib-cartao').length), v => v >= 2, 10000);
  conf('o cartão do item sem gabarito não ganhou nada sobre IAs',
    await pag.evaluate(i => /IAs/.test((document.querySelector('#bib-corpo .bib-cartao[data-id="' + i + '"]') || {}).innerText || 'x IAs'), sem.id), false);
  conf('abriu a tela cheia do item com gabarito', await abrirVisorDe(pag, com.id), true);
  let v = await lerVisor(pag);
  deve('visor', 'antes de abrir a resposta, a marca já está à vista', v.marcaVisivel && v.marca, MARCA);
  conf('e o porquê fica fechado até tocar', v.porqueVisivel, '');
  conf('as respostas ainda não aparecem', v.respostas, null);
  conf('o botão diz "Ver resposta"', v.botao, 'Ver resposta');
  await pag.click('#bib-solucao');
  await pausa(150);
  v = await lerVisor(pag);
  conf('depois do toque, as respostas por subitem', (v.respostas || []).join(' | '), '1) 38 figurinhas | 2) 12 a mais que o Caio');
  deve('visor', 'com as respostas abertas, a marca continua embaixo', v.marcaVisivel && v.marca, MARCA);
  conf('e o botão vira "Esconder a resposta"', v.botao, 'Esconder a resposta');
  if (SUPERFICIE !== 'visor') {
    await pag.click('#bib-marca-ia summary');
    await pausa(150);
    v = await lerVisor(pag);
    deve('visor', 'tocar na marca mostra o porquê', v.porqueVisivel, PORQUE);
  }
  await pag.click('#bib-fechar-visor');
  await pausa(200);

  secao('2. A tela cheia do item SEM gabarito: nada novo');
  conf('abriu a tela cheia do item sem gabarito', await abrirVisorDe(pag, sem.id), true);
  v = await lerVisor(pag);
  conf('sem marca, sem respostas, sem botão de resposta, nada sobre IAs',
    JSON.stringify([v.marca, v.respostas, v.botao, v.corpoTemIA]), JSON.stringify([null, null, null, false]));
  await pag.click('#bib-fechar-visor');
  await pausa(200);

  // ================================================================
  secao('3. O gabarito do material em PDF, com a caixa "origem" desmarcada (pdf)');
  await pag.evaluate(i => localStorage.setItem('apoio-educacional:bib-carrinho', JSON.stringify({ itens: i, paginas: [] })), [com.id, sem.id]);
  await recarregar(pag);
  await esperar('seleção de volta', () => pag.evaluate(() => { const b = document.querySelector('#bib-carrinho-gerar'); return !!b && !b.disabled; }), v => v === true, 10000);
  await pag.click('#bib-carrinho-gerar');
  await esperar('janela Gerar material', () => pag.$eval('#modal-bib-gerar', e => e.classList.contains('aberto')), v => v === true, 5000);
  conf('lista e gabarito marcados, origem DESMARCADA', await pag.evaluate(() => ['lista', 'gabarito', 'origem']
    .map(k => k + ':' + document.querySelector('#bib-gerar-' + k).checked).join(',')), 'lista:true,gabarito:true,origem:false');
  await pag.evaluate(() => { document.querySelector('#bib-gerar-aulas [data-aula="aula-gabarito"]').click(); });
  await pausa(150);
  await pag.click('#bib-gerar-anexar');
  const anexou = await esperar('material anexado', () => lerDados(pag).then(d => {
    const a = d.aulas.filter(x => x.id === 'aula-gabarito')[0];
    return a && (a.anexos || []).filter(n => n.biblioteca).length >= 2 ? a : null;
  }), v => !!v, 30000);
  const aula = anexou.valor || { anexos: [] };
  const ler = async parte => {
    const a = (aula.anexos || []).filter(n => n.biblioteca && n.parte === parte)[0];
    return a ? textosDoPdf(Buffer.from(await lerAnexo(pag, a.id) || '', 'base64')) : [];
  };
  const lista = await ler('lista');
  const gabarito = await ler('gabarito');
  const g = gabarito.join(' ');
  conf('o gabarito traz as respostas do 1, por subitem',
    ['1) 38 figurinhas', '2) 12 a mais que o Caio'].filter(t => gabarito.indexOf(t) >= 0).length, 2);
  deve('pdf', 'e a marca com o porquê, uma vez só (é um item com gabarito)',
    g.split(MARCA + '. ' + PORQUE).length - 1, 1);
  conf('a resposta vem antes da marca, depois do número 1',
    gabarito.indexOf('1.') >= 0 && gabarito.indexOf('1.') < gabarito.indexOf('1) 38 figurinhas'), true);
  conf('o 2 (sem gabarito) continua "Sem solução na fonte."', gabarito.indexOf('Sem solução na fonte.') > gabarito.indexOf('2) 12 a mais que o Caio'), true);
  conf('só uma vez "Sem solução na fonte." (o do 2)', gabarito.filter(t => t === 'Sem solução na fonte.').length, 1);
  conf('a lista não leva resposta nem marca', /IAs|38 figurinhas/.test(lista.join(' ')), false);
  conf('a lista tem os dois exercícios', ['Exercício 1.', 'Exercício 2.'].filter(t => lista.indexOf(t) >= 0).length, 2);
  conf('nada de travessão nem " - " no gabarito', /[–—]| - /.test(g), false);

  if (pag.errosDePagina.length) console.log('   erros de página: ' + pag.errosDePagina.join(' | ').slice(0, 400));
  conf('nenhum erro de JavaScript na página', pag.errosDePagina.length, 0);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
