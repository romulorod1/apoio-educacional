/* testa_lista_de_base.js
 *
 * C2b: a terceira lista pronta por assunto, a LISTA DE BASE (regra base-v1,
 * nível 1), e a etiqueta de nível nas três listas (Base, Regular e
 * Aprofundamento, decisão D14 do dono). Pacote sintético com a opção `base`;
 * a regra em si (primeiro terço de cada lista de origem, uma aula) é julgada
 * pelo biblioteca/confere_kits.py, do lado do gerador, e não aqui.
 *
 * O que se prova:
 *   1. o pacote com lista de base importa;
 *   2. no módulo, a lista de base vem primeiro, chamada "Lista de base", e as
 *      outras duas mantêm os nomes de sempre (a de base não entra no desempate
 *      dos desafios); cada uma com a etiqueta do nível;
 *   3. a frase da lista de base diz posição na fonte, e não avaliação, sem as
 *      palavras que a tela não pode dizer;
 *   4. o módulo sem lista de base não ganha a frase;
 *   5. a tela da lista de base tem o nome e a etiqueta, e "Editar exercícios antes"
 *      põe os exercícios no material, na ordem dela.
 *   C13: no módulo, as listas prontas vêm antes do "Marcar os N" (UX07); na
 *      janela Gerar material, a caixa desligada tem a frase do porquê (UX08).
 *
 * Modos envenenados:
 *   --envenenado-base-recusada  o aplicativo não conhece a base-v1 e recusa o
 *                               pacote inteiro.
 *   --envenenado-sem-etiqueta   as listas perdem a etiqueta de nível.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8844;
const MODO = ['--envenenado-base-recusada', '--envenenado-sem-etiqueta']
  .filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const BIB = fs.readFileSync(path.join(H.RAIZ, 'biblioteca.js'), 'utf8');
const REGRAS = "var REGRAS_DE_LISTA = ['listas-v1', 'listas-v2', 'base-v1'];";
const ETIQUETA = "  var ETIQUETA_DO_NIVEL = { 1: 'Base', 2: 'Regular', 3: 'Aprofundamento' };";
// as palavras que a tela das listas prontas não pode dizer (as mesmas da testa_biblioteca_listas)
const PROIBIDAS = ['curad', 'sugest', 'recomend', 'selecion', 'escolhid', 'melhor'];

secao('0. As âncoras');
conf('a regra base-v1 está entre as que o aplicativo conhece, uma vez', BIB.split(REGRAS).length, 2);
conf('a tabela das etiquetas está no app.js, uma vez', APP.split(ETIQUETA).length, 2);

const trocas = {};
if (MODO === '--envenenado-base-recusada') trocas['/biblioteca.js'] = BIB.split(REGRAS).join("var REGRAS_DE_LISTA = ['listas-v1', 'listas-v2'];");
if (MODO === '--envenenado-sem-etiqueta') trocas['/app.js'] = APP.split(ETIQUETA).join('  var ETIQUETA_DO_NIVEL = {};');
const amb = H.criarAmbiente(PORTA, 'perfil_lista_de_base', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'c2b_base_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

const MOD_TITULO = 'Equações do Segundo Grau';
const MOD_PIT = 'Teorema de Pitágoras';
const BASE_IDS = Sintetico.LISTA_BASE.degraus.map(d => d.item);

async function importar(pag, arquivo) {
  await H.irParaAba(pag, 'ajustes');
  await (await pag.$('#arquivo-biblioteca')).uploadFile(arquivo);
  const r = await esperar('importação', () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca'); return c ? c.innerText.trim() : '';
  }), v => /^Biblioteca importada\.|não foi importado/.test(v || ''), 90000);
  return r.valor || '';
}
const tocarLinha = (pag, nome) => pag.evaluate(n => {
  const l = Array.from(document.querySelectorAll('#bib-corpo .item-lista'))
    .find(x => x.querySelector('.nome').textContent.trim() === n);
  if (!l) return false; l.click(); return true;
}, nome);
const linhasDasListas = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#bib-corpo .bib-lista-pronta')).map(l => ({
  nome: l.querySelector('.nome').textContent.trim(),
  nivel: (l.querySelector('.bib-lp-nivel') || {}).textContent || ''
})));
const fim = () => Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });

(async () => {
  if (MODO) {
    secao('O veneno é de verdade');
    conf('um arquivo servido ficou diferente do repositório (' + MODO + ')', Object.keys(trocas).length, 1);
  }
  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('1. O pacote com lista de base importa');
  const zip = path.join(TMP, 'com-base.zip');
  Sintetico.gerar(zip, { listas: true, base: true });
  const msg = await importar(pag, zip);
  if (MODO === '--envenenado-base-recusada') {
    secao('VENENO: o aplicativo não conhece a base-v1');
    conf('envenenado: o pacote foi recusado (defeito enxergado)', /^Biblioteca importada\./.test(msg), false);
    throw fim();
  }
  conf('o pacote com a lista de base importou', /^Biblioteca importada\./.test(msg), true);

  // ================================================================
  secao('2. No módulo: a lista de base primeiro, os nomes de sempre, a etiqueta de cada uma');
  await H.irParaAba(pag, 'biblioteca');
  await pausa(400);
  conf('abriu o módulo das equações', await tocarLinha(pag, MOD_TITULO), true);
  await pausa(400);
  const linhas = await linhasDasListas(pag);
  console.log('   linhas: ' + JSON.stringify(linhas));
  if (MODO === '--envenenado-sem-etiqueta') {
    secao('VENENO: as listas perdem a etiqueta de nível');
    conf('envenenado: nenhuma linha diz o nível (defeito enxergado)', linhas.every(l => !l.nivel), true);
    throw fim();
  }
  conf('três listas prontas no módulo', linhas.length, 3);
  conf('a primeira se chama "Lista de base"', (linhas[0] || {}).nome, 'Lista de base');
  conf('as outras duas mantêm os nomes de sempre', linhas.slice(1).map(l => l.nome).join(' | '),
    'Lista com 1 desafio | Lista com 2 desafios');
  conf('cada uma com a etiqueta do nível', linhas.map(l => l.nivel).join(' | '),
    'Nível Base | Nível Regular | Nível Aprofundamento');
  // C13 (UX07): as listas prontas vêm antes do "Marcar os N deste módulo"
  conf('as listas prontas vêm antes do "Marcar os N"', await pag.evaluate(() => {
    const bloco = Array.from(document.querySelectorAll('#bib-corpo .bloco-exercicios'))
      .find(b => b.textContent.trim() === 'Listas prontas');
    const marcar = document.querySelector('#bib-marcar-modulo');
    return !!(bloco && marcar && (bloco.compareDocumentPosition(marcar) & Node.DOCUMENT_POSITION_FOLLOWING));
  }), true);

  // ================================================================
  secao('3. A frase da lista de base: posição na fonte, e não avaliação');
  const frase = await pag.evaluate(() => (document.querySelector('#bib-lp-ajuda-base') || {}).textContent || '');
  console.log('   frase: ' + JSON.stringify(frase));
  conf('a frase está na tela', frase.length > 0, true);
  conf('e diz posição na fonte', /começo de cada lista da OBMEP/.test(frase) && /posição/.test(frase), true);
  conf('sem as palavras que a tela não pode dizer', PROIBIDAS.filter(p => frase.toLowerCase().indexOf(p) >= 0).join(','), '');
  conf('sem travessão', /[\u2013\u2014]/.test(frase), false);
  if (process.env.SALVAR_PRINTS) {
    await pag.screenshot({ path: path.join(process.env.SALVAR_PRINTS, 'depois_listas_do_modulo.png') });
  }

  // ================================================================
  secao('4. O módulo sem lista de base não ganha a frase');
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(300);
  conf('abriu o módulo de Pitágoras', await tocarLinha(pag, MOD_PIT), true);
  await pausa(400);
  conf('sem a frase da lista de base', await pag.evaluate(() => !!document.querySelector('#bib-lp-ajuda-base')), false);
  conf('e sem lista chamada "Lista de base"', (await linhasDasListas(pag)).some(l => l.nome === 'Lista de base'), false);
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(300);

  // ================================================================
  secao('5. A tela da lista de base, e pôr no material');
  await tocarLinha(pag, MOD_TITULO);
  await pausa(400);
  await tocarLinha(pag, 'Lista de base');
  await pausa(500);
  const tela = await pag.evaluate(() => ({
    titulo: (document.querySelector('#bib-corpo .bib-titulo') || {}).textContent || '',
    nivel: (document.querySelector('#bib-corpo .bib-lp-nivel-titulo') || {}).textContent || ''
  }));
  conf('o título é o nome', tela.titulo, 'Lista de base');
  conf('e a etiqueta vem ao lado', tela.nivel, 'Nível Base');
  // "Editar exercícios antes" (#bib-lp-usar) põe a lista no material, como nas outras listas prontas
  const usou = await pag.evaluate(() => {
    const b = document.querySelector('#bib-lp-usar');
    if (!b) return false; b.click(); return true;
  });
  conf('a tela oferece pôr a lista no material', usou, true);
  await pausa(600);
  const material = await pag.evaluate(() => JSON.parse(localStorage.getItem('apoio-educacional:bib-carrinho') || 'null'));
  conf('o material é a lista de base, na ordem dela', ((material || {}).itens || []).join('|'), BASE_IDS.join('|'));

  // ================================================================
  secao('5b. C13 (UX08): a caixa desligada diz por quê');
  await pag.evaluate(() => { const b = document.querySelector('#bib-carrinho-gerar'); if (b) b.click(); });
  await esperar('janela Gerar material', () => pag.$eval('#modal-bib-gerar', e => e.classList.contains('aberto')), v => v === true, 8000);
  const porQue = () => pag.evaluate(() => {
    const m = k => { const s = document.querySelector('#bib-gerar-motivo-' + k); return s && !s.hidden ? s.textContent : ''; };
    return {
      teoria: document.querySelector('#bib-gerar-teoria').disabled + ' ' + m('teoria'),
      lista: m('lista'),
      folha: document.querySelector('#bib-gerar-folha').disabled + ' ' + m('folha')
    };
  });
  let pq = await porQue();
  conf('Teoria desligada diz por quê, na própria linha', pq.teoria, 'true (nenhuma página de teoria foi marcada)');
  conf('a Lista, ligada, não ganha motivo', pq.lista, '');
  conf('Folha desligada pede a aula', pq.folha, 'true (liga quando você escolher a aula, logo abaixo)');
  await pag.evaluate(() => document.querySelector('#bib-gerar-lista').click());
  pq = await porQue();
  conf('sem a Lista e sem aula, a Folha pede as duas coisas', pq.folha,
    'true (liga quando a Lista estiver marcada e você escolher a aula, logo abaixo)');

  // ================================================================
  secao('6. Nenhum erro');
  conf('nenhum erro de página', pag.errosDePagina.join(' | '), '');
  conf('nenhum pedido deu 404', amb.quatrocentos.join(', '), '');
})().then(() => H.fim(amb)(), e => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e)));
