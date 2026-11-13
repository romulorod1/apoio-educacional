/* testa_biblioteca_cadernos_sme.js
 *
 * O pacote dos Cadernos de Apoio e Aprendizagem da SME-SP (item C5 da frente
 * "Listas de exercícios") na aba Biblioteca, no Chrome de verdade, com um
 * pacote SINTÉTICO no formato que o biblioteca/cadernos_sme.py gera (o
 * conteúdo real dos cadernos nunca entra no repositório). O app.js NÃO muda
 * no C5: esta prova mostra que a versão publicada lê o formato novo.
 *
 * O que prova:
 *   1. o pacote importa, com os campos que este aplicativo não conhece (tom,
 *      licenca, atribuicao, origem_detalhe, tema_origem, manifest.licenca e
 *      manifest.tom) e com dificuldade null: o importador ignora o que não
 *      conhece e não recusa o pacote;
 *   2. as abas do 3º e do 7º ano aparecem, e em cada uma os ASSUNTOS do
 *      aplicativo como módulos (títulos do banco/topicos/matematica.json);
 *   3. a lista mostra os cartões com a etiqueta "sem solução" e a ATRIBUIÇÃO
 *      (origem_citada: Cadernos de Apoio e Aprendizagem, SME-SP, ano, página e
 *      licença) embaixo de cada cartão, e nenhuma etiqueta de dificuldade;
 *   4. a tela cheia mostra a atribuição;
 *   5. material numa aula: a aula ganha o assunto, e o gabarito diz "Sem
 *      solução na fonte." (o caderno do aluno não traz resposta);
 *   6. nenhum erro de JavaScript.
 *
 * Modo envenenado:
 *   node _teste/testa_biblioteca_cadernos_sme.js --envenenado-sem-origem
 *     o app.js servido deixa de desenhar a origem_citada no cartão; a
 *     atribuição some da lista, e o teste tem de ENXERGAR isso.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const RELOGIO = H.relogioDaRodada('2026-11-16', '11:00');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const VENENO = process.argv.indexOf('--envenenado-sem-origem') !== -1;
const PORTA = 8973;

const APP_REPO = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const LINHA = "it.origem_citada ? el('div', { class: 'bib-origem', texto: it.origem_citada }) : null";
const trocas = {};
if (VENENO) trocas['/app.js'] = APP_REPO.split(LINHA).join('null');

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

const amb = H.criarAmbiente(PORTA, 'perfil_bib_cadernos_sme', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'bib_cadernos_'));
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
    ? 'MODO ENVENENADO (sem origem): o app.js servido não desenha a origem_citada no cartão; a atribuição tem de sumir à vista do teste.'
    : 'MODO NORMAL: pacote dos Cadernos de Apoio da SME-SP na Biblioteca.');
  secao('0. O veneno é de verdade, e o sintético usa os assuntos do aplicativo');
  if (VENENO) {
    conf('o app.js servido ficou DIFERENTE do repositório', trocas['/app.js'] !== APP_REPO ? 'diferente' : 'IGUAL', 'diferente');
    conf('e o veneno trocou exatamente uma ocorrência', APP_REPO.split(LINHA).length - 1, 1);
    if (trocas['/app.js'] === APP_REPO) throw Object.assign(new Error('veneno não aplicado'), { jaContado: true });
  }
  const catalogo = JSON.parse(fs.readFileSync(path.join(H.RAIZ, 'banco', 'topicos', 'matematica.json'), 'utf8'));
  const titulo = {};
  catalogo.temas.forEach(t => { titulo[t.id] = t.pt.titulo; });
  conf('todo módulo sintético tem o título do catálogo',
    Sintetico.ASSUNTOS_CADERNOS.filter(([, id, t]) => titulo[id] !== t).map(a => a[1]).join(', '), '');

  await amb.subir();
  const pag = await amb.pagina();
  await RELOGIO.naPagina(pag);
  await H.abrirApp(pag, amb.ORIGEM);
  await RELOGIO.conferir(pag);

  // ================================================================
  secao('1. O pacote importa, com os campos novos e a dificuldade nula');
  const z = path.join(TMP, 'cadernos.zip');
  const gerado = Sintetico.gerarCadernos(z);
  conf('o sintético traz os campos aditivos do C5', ['tom', 'licenca', 'atribuicao', 'origem_detalhe', 'tema_origem']
    .filter(c => gerado.itens.some(i => !(c in i))).join(','), '');
  const r = await importar(pag, z);
  conf('importou', /^Biblioteca importada\./.test(r), true);
  conf('o resumo diz o 3º e o 7º ano e a fonte', /3º ano, 7º ano, Cadernos de Apoio e Aprendizagem, SME-SP/.test(r), true);
  conf('o resumo diz 6 exercícios, nenhum com solução', /6 exercícios, 0 com solução/.test(r), true);

  // ================================================================
  secao('2. As abas do 3º e do 7º ano, com os assuntos como módulos');
  await H.irParaAba(pag, 'biblioteca');
  await esperar('lista de módulos', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .item-lista').length), v => v > 0, 10000);
  conf('abas de série', (await chips(pag)).join(','), '3º ano*,7º ano');
  const esperado = { '3º ano': 'Adição com reagrupamento | Relógio e calendário', '7º ano': 'Sequências e regularidades' };
  for (const s of Object.keys(esperado)) {
    const achou = await escolherSerie(pag, s);
    const corpo = await lerCorpo(pag);
    conf('no ' + s + ', os assuntos como módulos', achou ? corpo.blocos.map(b => b.titulo + ':' + b.linhas.join(' | ')).join(' / ') : 'sem a aba',
      'Módulos:' + esperado[s]);
  }

  // ================================================================
  secao('3. A lista: "sem solução" e a atribuição em cada cartão');
  await escolherSerie(pag, '3º ano');
  await tocarLinha(pag, 'Adição com reagrupamento');
  const corpo = await lerCorpo(pag);
  conf('o assunto abre o caderno como lista', corpo.blocos.map(b => b.titulo + ':' + b.linhas.join(' | ')).join(' / '),
    'Exercícios:Cadernos de Apoio e Aprendizagem, 3º ano');
  await tocarLinha(pag, 'Cadernos de Apoio e Aprendizagem, 3º ano');
  await esperar('cartões', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .bib-cartao').length), v => v >= 2, 10000);
  const cartoes = await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-corpo .bib-cartao')).map(c => ({
    tags: Array.from(c.querySelectorAll('.tag')).map(t => t.textContent),
    origem: (c.querySelector('.bib-origem') || {}).textContent || ''
  })));
  conf('dois cartões', cartoes.length, 2);
  if (VENENO) {
    conf('envenenado: a atribuição sumiu dos cartões (defeito detectado)', cartoes.every(c => !c.origem) ? 'sumiu' : 'ainda aparece', 'sumiu');
    return;
  }
  conf('todo cartão diz "sem solução"', cartoes.every(c => c.tags.indexOf('sem solução') !== -1), true);
  conf('nenhum cartão inventa dificuldade', cartoes.some(c => c.tags.some(t => /estimada|revisada/.test(t))), false);
  conf('todo cartão traz a atribuição com a SME-SP, o ano, a página e a licença',
    cartoes.every(c => /SME-SP, 3º ano, p\. \d+\. Licença não comercial \(Decreto 52\.681\/2011\)/.test(c.origem)), true);

  // ================================================================
  secao('4. A tela cheia mostra a atribuição');
  await pag.evaluate(() => document.querySelector('#bib-corpo .bib-cartao').click());
  await esperar('tela cheia', () => pag.$eval('#modal-biblioteca', e => e.classList.contains('aberto')), v => v === true, 5000);
  const cheia = await pag.evaluate(() => (document.querySelector('#modal-biblioteca .bib-origem') || {}).textContent || '');
  conf('a tela cheia traz a atribuição', /Cadernos de Apoio e Aprendizagem, SME-SP/.test(cheia), true);
  await pag.click('#bib-fechar-visor');
  await pausa(200);

  // ================================================================
  secao('5. Material numa aula: o assunto, e "Sem solução na fonte." no gabarito');
  await pag.evaluate(async h => {
    const d = await Store.carregar();
    d.aulas.push({ id: 'aula-sme', alunoId: d.alunos[0].id, serieId: null, destacada: false, data: h, hora: '10:00',
      duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', temNota: false, anexos: [], temas: [] });
    await Store.salvar(d);
  }, hojeIso);
  const marcados = gerado.itens.filter(i => i.tema_app === 'MAT03-02').map(i => i.id);
  await pag.evaluate(i => localStorage.setItem('apoio-educacional:bib-carrinho', JSON.stringify({ itens: i, paginas: [] })), marcados);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'biblioteca');
  await esperar('seleção de volta', () => pag.evaluate(() => { const b = document.querySelector('#bib-carrinho-gerar'); return !!b && !b.disabled; }), v => v === true, 10000);
  await pag.click('#bib-carrinho-gerar');
  await esperar('janela Gerar material', () => pag.$eval('#modal-bib-gerar', e => e.classList.contains('aberto')), v => v === true, 5000);
  await pag.evaluate(() => { document.querySelector('#bib-gerar-aulas [data-aula="aula-sme"]').click(); });
  await pag.click('#bib-gerar-anexar');
  const anexou = await esperar('material anexado', () => lerDados(pag).then(d => {
    const a = d.aulas.filter(x => x.id === 'aula-sme')[0];
    return a && (a.anexos || []).filter(n => n.biblioteca).length >= 2 ? a : null;
  }), v => !!v, 30000);
  const aula = anexou.valor || { temas: [], anexos: [] };
  conf('a aula ganhou o assunto', (aula.temas || []).map(t => t.titulo).join(' | '), 'Adição com reagrupamento');
  const gab = (aula.anexos || []).filter(n => n.biblioteca && n.parte === 'gabarito')[0];
  const textos = gab ? textosDoPdf(Buffer.from(await lerAnexo(pag, gab.id) || '', 'base64')) : [];
  conf('o gabarito diz "Sem solução na fonte." para os dois', textos.filter(t => t === 'Sem solução na fonte.').length, 2);

  if (pag.errosDePagina.length) console.log('   erros de página: ' + pag.errosDePagina.join(' | ').slice(0, 400));
  conf('nenhum erro de JavaScript na página', pag.errosDePagina.length, 0);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
