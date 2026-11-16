/* testa_celular_biblioteca.js
 *
 * 12b, parte A2: a aba Biblioteca do celular, SÓ PARA LER (desenho aprovado
 * em 15/11/2026). A aba de baixo deixa de se chamar "Livros" e passa a ser
 * "Biblioteca", com o mesmo ícone; no começo, a busca de assunto e Minhas
 * listas; o resultado da busca, com o ano e os sinais do #239; a página do
 * assunto em uma coluna (a mesma montarPaginaDoAssunto do tablet, com a opção
 * do celular); e o Ver lista, com os exercícios um embaixo do outro. O PDF é
 * da A3 e não aparece aqui.
 *
 * No Chrome de verdade, sem nuvem: o modo celular vem do tamanho da tela (a
 * mesma regra das testa_celular_*), e a Biblioteca do aparelho é a do pacote
 * SINTÉTICO (_pacote_sintetico.js), importado no tablet (1280 px) do mesmo
 * perfil, como na testa_navegacao_biblioteca. Aluno e listas sintéticos. Três
 * perfis: o principal (o pacote e três listas, uma completa, uma com um
 * exercício fora do aparelho e uma sem nenhum), o completo (o pacote e só a
 * lista completa) e o vazio (as listas, sem pacote nenhum). A marca escondida
 * da A1 (#modo-celular[data-pacotes]) é posta pela prova, com todos os
 * valores que a série do celular escreve; sem a marca e sem a conta, é o
 * celular que nunca recebe pacotes. O nome no alto do index.html é trocado
 * por "Professora Teste" no que o servidor entrega, e a prova confere que o
 * nome de verdade não aparece. O app.js servido ganha uma linha só da prova
 * (window.__provaRedesenhar, o desenharTudo de quando chega mudança da nuvem).
 *
 * O que se prova:
 *   1. a aba se chama Biblioteca, com o mesmo ícone de antes;
 *   2. o começo: a busca no alto e Minhas listas embaixo; nenhum PDF (A3);
 *   3. NO CELULAR, O QUE FALTA SÓ NÃO CHEGOU: em TODOS os valores da marca
 *      (trazendo, conferindo, sem-wifi, sem-internet, parou, falhou,
 *      sem-espaco, faltam, nada, prontos e sem marca) a tela nunca diz "não
 *      está mais na biblioteca"; a linha discreta e a linha curta do cartão
 *      dizem por que a lista espera, com o assunto à vista; enquanto os
 *      pacotes andam, o Ver lista da lista incompleta fica apagado; depois,
 *      ela abre com o que veio e a nota do resto; com nada faltando, a linha
 *      some; o celular que não recebe pacotes diz que eles ficam no tablet;
 *   4. a busca: os assuntos com material neste celular primeiro, com o ano e
 *      só os sinais que existem, a legenda uma vez no alto; os outros com a
 *      nota "sem material neste celular"; depois "Nas suas listas";
 *   5. a página do assunto: só a teoria, a lista de base (com "Ver lista"),
 *      os exercícios e os vizinhos, numa coluna; sem "Nos livros", sem "No
 *      material", sem Anexar e sem Comparar; sem pacote, diz que o material
 *      não chegou (ou que fica no tablet), nunca "no tablet" do aparelho;
 *   6. o Ver lista, e o Voltar do Android: o assunto, a busca com o termo, o
 *      começo; a raiz avisa e não sai; várias buscas são um passo só; o
 *      Limpar; a troca de aba; o Voltar duplo rápido; a recarga no meio; o
 *      Voltar dentro dos 180 ms da busca não deixa passo morto;
 *   7. a mudança que chega da nuvem não tira o foco do campo nem a rolagem do
 *      assunto, e a marca que anda não fecha o "Ver os outros";
 *   8. SÓ LÊ: o IndexedDB inteiro (todos os depósitos, com o conteúdo dos
 *      Blobs) igual byte a byte antes e depois de andar por todas as telas,
 *      nenhuma chamada de gravação ao Store, nenhuma transação de escrita e o
 *      localStorage igual;
 *   9. a trava de transbordo: a 360, 390 e 412 px, com a letra normal e a
 *      130%, nada passa da borda, nada rola de lado e a página não rola de
 *      lado, em cada uma das cinco telas;
 *  10. nenhum erro de página, e o nome de verdade em lugar nenhum.
 *
 * Venenos (a prova TEM de ver o defeito e passa dizendo que viu):
 *   --envenenado-celular-mostra-no-material  a página do assunto do celular
 *                         volta a ter a caixa "No material" (5 vê);
 *   --envenenado-celular-grava-ao-navegar  a miniatura volta a ser guardada no
 *                         celular, e andar pelas telas chama a gravação (8 vê);
 *   --envenenado-diz-que-sumiu  o cartão do celular usa a conta do tablet, que
 *                         diz que o exercício não está mais na biblioteca (3
 *                         vê, em todos os valores da marca).
 *
 *   --prints <pasta>   o começo, a linha "Trazendo", o "faltam", a busca, o
 *                      assunto, o Ver lista e o assunto antes dos pacotes, a
 *                      390 x 844 e a 412 x 915.
 *
 * Porta: 9131 (o app). Nenhum emulador.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 9131;
const PRINTS = (() => { const i = process.argv.indexOf('--prints'); return i >= 0 ? process.argv[i + 1] : ''; })();
if (PRINTS) fs.mkdirSync(PRINTS, { recursive: true });

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const INDEX = fs.readFileSync(path.join(H.RAIZ, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
// o nome do alto do index.html: lido daqui, nunca escrito na prova
const NOME_REAL = ((/<header class="cabecalho">[\s\S]*?<strong>([^<]+)<\/strong>/.exec(INDEX)) || [])[1] || '';
const NOME_TESTE = 'Professora Teste';
// a linha só da prova: o desenho de quando chega mudança da nuvem
const ANCORA_GANCHO = '  function desenharTudo() {\n';
const GANCHO = '  window.__provaRedesenhar = function () { desenharTudo(); };\n';

const VENENOS = {
  '--envenenado-celular-mostra-no-material': ['/app.js',
    '      if (cx.soLer) return null;   // 12b A2: o celular só lê, e a caixa "No material" mexe no material\n', ''],
  '--envenenado-celular-grava-ao-navegar': ['/app.js',
    '        if (aparelhoSoLe()) return dataUrl;   // 12b A2: no celular a miniatura só aparece, sem guardar: nada grava\n', ''],
  '--envenenado-diz-que-sumiu': ['/app.js',
    'return fraseDoCartaoNoCelular(e);   // nunca o "não está mais na biblioteca" do tablet (r.conta)', 'return r.conta;']
};
const MODO = Object.keys(VENENOS).filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && !VENENOS[a]);
let appServido = APP.split(ANCORA_GANCHO).join(GANCHO + ANCORA_GANCHO);
if (MODO) appServido = appServido.split(VENENOS[MODO][1]).join(VENENOS[MODO][2]);
const trocas = { '/index.html': NOME_REAL ? INDEX.split(NOME_REAL).join(NOME_TESTE) : INDEX, '/app.js': appServido };
const amb = H.criarAmbiente(PORTA, 'perfil_celular_biblioteca', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'celular_biblioteca_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

const ICONE_DA_ABA = ['M5 5.5A2.5 2.5 0 0 1 7.5 3H19v14.5H7.5A2.5 2.5 0 0 0 5 20z', 'M5 20a2 2 0 0 0 2 1.5H19'];
const BASE_N = Sintetico.LISTA_BASE.degraus.length;
const ASSUNTO = 'MAT09-04';     // "Equação do 2º grau: como resolver", ligado ao módulo das equações do 9º ano
const TERMO = 'equação';
const LETRA_130 = 'html{font-size:130%}';
const SUMIU = /não est(á|ão) mais/;
const FRASE = {
  trazendo: 'Trazendo os exercícios pelo Wi-Fi: 6 de 15.',
  conferindo: 'Trazendo os exercícios pelo Wi-Fi.',
  wifi: 'Os exercícios chegam a este celular no próximo Wi-Fi.',
  espaco: 'Os exercícios não cabem neste celular agora. Com espaço livre, eles chegam no próximo Wi-Fi.',
  parcial: 'Alguns exercícios ainda não chegaram a este celular.',
  tablet: 'Os exercícios ficam no tablet.'
};
const CARTAO = { chegando: 'Os exercícios estão chegando.', wifi: 'Chegam no próximo Wi-Fi.', espaco: 'Chegam quando houver espaço.',
  parcial: 'Alguns exercícios ainda não chegaram.', tablet: 'Os exercícios ficam no tablet.' };
// cada valor da marca: a linha, o motivo do cartão e se a lista incompleta fica apagada
const ESTADOS = [
  ['trazendo 6/15', FRASE.trazendo, CARTAO.chegando, true],
  ['conferindo', FRASE.conferindo, CARTAO.chegando, true],
  ['sem-wifi', FRASE.wifi, CARTAO.wifi, true],
  ['sem-internet', FRASE.wifi, CARTAO.wifi, true],
  ['parou', FRASE.wifi, CARTAO.wifi, true],
  ['falhou', FRASE.wifi, CARTAO.wifi, true],
  ['sem-espaco', FRASE.espaco, CARTAO.espaco, true],
  ['faltam', FRASE.parcial, CARTAO.parcial, false],
  ['nada', FRASE.parcial, CARTAO.parcial, false],
  ['prontos', FRASE.parcial, CARTAO.parcial, false],
  [null, FRASE.tablet, CARTAO.tablet, false]
];

/* ---------- as páginas ---------- */
async function novaPagina(ctx) {
  if (!ctx) return amb.pagina();
  const p = await ctx.newPage();
  p.setDefaultTimeout(60000);
  p.errosDePagina = [];
  p.on('pageerror', e => p.errosDePagina.push(e.message));
  p.on('dialog', async d => { try { await d.accept(); } catch (e) { /* ok */ } });
  return p;
}
async function semear(ctx, comPacote, listas) {
  const tab = await novaPagina(ctx);
  await tab.setViewport({ width: 1280, height: 800 });
  await H.abrirApp(tab, amb.ORIGEM);
  let imp = 'sem pacote';
  if (comPacote) {
    const zip = path.join(TMP, 'portal.zip');
    if (!fs.existsSync(zip)) Sintetico.gerar(zip, { listas: true, base: true });
    await H.irParaAba(tab, 'ajustes');
    await (await tab.$('#arquivo-biblioteca')).uploadFile(zip);
    imp = (await esperar('a importação', () => tab.evaluate(() => {
      const c = document.querySelector('#estado-importacao-biblioteca'); return c ? c.innerText.trim() : '';
    }), v => /^Biblioteca importada\.|não foi importado/.test(v || ''), 90000)).valor || '';
  }
  const r = await tab.evaluate(async quais => {
    const d = Store.bancoVazio();
    d.alunos = [{ id: 'alfa', nome: 'Aluno Alfa Teste', ativo: true, cor: '#1F3A5F', precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 100 }], mapeamentos: [] }];
    d.aulas = [{ id: 'x1', alunoId: 'alfa', serieId: null, data: '2026-11-10', hora: '14:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [], temNota: false }];
    await Store.salvar(d);
    // os ids do pacote sintético, quando há pacote; sem ele, os mesmos ids (que ainda não chegaram)
    let itens = (await Store.itensDaBiblioteca()).filter(i => /^9ano:equacoes-do-segundo-grau:/.test(i.id)).map(i => i.id).sort();
    if (!itens.length) itens = [1, 2, 3, 4, 5].map(n => '9ano:equacoes-do-segundo-grau:equacao-do-2o-grau-resultados-basicos:ex:' + n);
    const teoria = (await Store.teoriaDaBiblioteca()).filter(t => /^9ano:equacoes-do-segundo-grau/.test(t.id));
    const pagina = teoria[0] && teoria[0].paginas[1] ? teoria[0].paginas[1].id : null;
    const lista = (id, titulo, nivel, ids, paginas, quando) => Store.gravarListaBiblioteca({ id, titulo, nivel, itens: ids, paginas, origem: null,
      automatica: false, criadaEm: quando, editadaEm: quando });
    // a mais nova primeiro: a revisão (completa), a do desafio (com um exercício que ainda não chegou) e a de área (sem nenhum)
    if (quais.indexOf('revisao') >= 0) await lista('lista-revisao', 'Revisão de equações para a prova', 'regular', itens.slice(0, 4), pagina ? [pagina] : [], 1700000003000);
    if (quais.indexOf('desafio') >= 0) await lista('lista-desafio', 'Equação do 2º grau, desafio', 'aprofundamento', [itens[4], '9ano:modulo-que-chega-depois:lista:ex:1'], [], 1700000002000);
    if (quais.indexOf('area') >= 0) await lista('lista-area', 'Área de figuras planas', null, ['8ano:area-que-chega-depois:lista:ex:1', '8ano:area-que-chega-depois:lista:ex:2'], [], 1700000001000);
    return { pagina: !!pagina, listas: (await Store.listasDaBiblioteca()).length };
  }, listas);
  await tab.close();
  return Object.assign(r, { importou: /^Biblioteca importada\./.test(imp) || imp === 'sem pacote' });
}
async function prepararCelular(pag, largura, altura) {
  await pag.setViewport({ width: largura, height: altura, hasTouch: true, isMobile: true });
  await pag.evaluateOnNewDocument(() => {
    // as transações de escrita no banco do app, com os depósitos de cada uma
    window.__transacoes = [];
    const t0 = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (nomes, modo) {
      if (modo === 'readwrite' && this.name === 'apoio-educacional') window.__transacoes.push([].concat(nomes).map(String).sort().join('+'));
      return t0.apply(this, arguments);
    };
    // toda chamada de gravação ao Store, aceita ou recusada pela trava
    window.__gravacoes = [];
    const GRAVA = /^(gravar|salvar|apagar|registrar|remover|importar|limpar|substituir|restaurar|trocar|guardar|aplicar|escrever)/;
    let store;
    Object.defineProperty(window, 'Store', {
      configurable: true,
      get() { return store; },
      set(v) {
        if (v && typeof v === 'object' && !v.__embrulhado) {
          Object.keys(v).forEach(k => {
            if (typeof v[k] !== 'function' || !GRAVA.test(k)) return;
            const f = v[k];
            v[k] = function () { window.__gravacoes.push(k); return f.apply(this, arguments); };
          });
          v.__embrulhado = true;
        }
        store = v;
      }
    });
    // os avisos que aparecem (o "Toque em Voltar de novo para sair.")
    window.__avisos = [];
    document.addEventListener('DOMContentLoaded', () => {
      const t = document.querySelector('#aviso-texto');
      if (t) new MutationObserver(() => window.__avisos.push(t.textContent)).observe(t, { childList: true, characterData: true, subtree: true });
    });
  });
  await abrirCelular(pag);
}
async function abrirCelular(pag, recarregar) {
  if (recarregar) await pag.reload({ waitUntil: 'networkidle0' });
  else await pag.goto(amb.ORIGEM + '/index.html', { waitUntil: 'networkidle0' });
  const ok = await esperar('o celular abriu', () => pag.evaluate(() => document.body.classList.contains('modo-celular') &&
    !!document.querySelector('#cel-abas') && !document.querySelector('#cel-abas').hidden && typeof Store === 'object'), v => v === true, 30000);
  if (!ok.ok) {
    const estado = await pag.evaluate(() => JSON.stringify({ celular: document.body.classList.contains('modo-celular'), abas: !!document.querySelector('#cel-abas') && !document.querySelector('#cel-abas').hidden,
      store: typeof Store, ids: document.querySelectorAll('[id]').length, corpo: document.body.innerText.slice(0, 200), info: !!document.querySelector('#info-espaco'), url: location.href, tela: (document.querySelector('#modo-celular .cel-tela.ativa') || {}).id || '' })).catch(e => e.message);
    throw Object.assign(new Error('o celular não abriu: ' + estado + ' ' + (pag.errosDePagina || []).join(' | ')), { jaContado: false });
  }
  await pag.evaluate(() => { const b = document.querySelector('#entendi-novidades'); if (b && document.querySelector('#modal-novidades.aberto')) b.click(); });
  await pausa(600);
}
async function celular(ctx, w, h) {
  const p = await novaPagina(ctx);
  await prepararCelular(p, w, h);
  return p;
}
const clicar = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.click(); return true; }, sel);
const marcar = (pag, v) => pag.evaluate(x => {
  const c = document.querySelector('#modo-celular');
  if (x === null) c.removeAttribute('data-pacotes'); else c.setAttribute('data-pacotes', x);
}, v);
async function digitar(pag, sel, v) {
  await pag.evaluate((s, x) => {
    const e = document.querySelector(s);
    e.value = x;
    e.dispatchEvent(new Event('input', { bubbles: true }));
  }, sel, v);
  await pausa(600);
}
const letra = (pag, css) => pag.evaluate(c => {
  const v = document.querySelector('#prova-letra'); if (v) v.remove();
  if (c) { const s = document.createElement('style'); s.id = 'prova-letra'; s.textContent = c; document.head.appendChild(s); }
}, css);
const textoDa = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.trim() : null; }, sel);
const voltar = async (pag, ms) => { await pag.evaluate(() => history.back()); await pausa(ms === undefined ? 700 : ms); };
const ativa = pag => pag.evaluate(() => { const t = document.querySelector('#modo-celular .cel-tela.ativa'); return t ? t.id : ''; });

async function irParaBiblioteca(pag, cartoesMinimos) {
  await clicar(pag, '#cel-abas .cel-aba[data-cel="biblioteca"]');
  return (await esperar('Minhas listas no celular', () => pag.evaluate(() => document.querySelectorAll('#cel-biblioteca.ativa .cel-bib-lista').length),
    v => v >= (cartoesMinimos || 1), 20000)).ok;
}
// o cartão de cada lista: o texto, o motivo, se tem a conta e o assunto, e se o Ver lista está apagado
const cartoes = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#cel-bib-miolo .cel-bib-lista')).map(c => ({
  id: c.dataset.lista, texto: c.innerText.trim(), motivo: ((c.querySelector('.cel-bib-lista-motivo') || {}).textContent || ''),
  conta: !!c.querySelector('.cel-bib-lista-conta'), assunto: ((c.querySelector('.cel-bib-lista-assunto') || {}).textContent || ''),
  apagado: !!(c.querySelector('[data-acao="ver-lista"]') || {}).disabled
})));
const porId = (cs, id) => cs.filter(c => c.id === id)[0] || {};
const linhaEstado = pag => pag.evaluate(() => { const l = document.querySelector('#cel-bib-estado'); return !l || l.hidden ? null : l.innerText.trim(); });
async function abrirAssunto(pag) {
  await clicar(pag, '#cel-bib-assuntos .item-lista[data-assunto="' + ASSUNTO + '"]');
  return (await esperar('a página do assunto no celular', () => pag.evaluate(() => !!document.querySelector('#cel-biblioteca .cel-bib-assunto .bte')),
    v => v === true, 20000)).ok;
}
async function buscar(pag, termo) {
  await digitar(pag, '#cel-bib-busca', termo || TERMO);
  return (await esperar('o resultado da busca', () => pag.evaluate(() => document.querySelectorAll('#cel-bib-assuntos .item-lista').length),
    v => v >= 1, 20000)).ok;
}
async function abrirBase(pag) {
  await clicar(pag, '#cel-biblioteca .bte-lista-ver');
  return (await esperar('o Ver lista da lista de base', () => pag.evaluate(() => document.querySelectorAll('#cel-biblioteca .cel-bib-ver-lista .cel-bib-ex').length),
    v => v >= 1, 20000)).ok;
}
const miniaturaPronta = (pag, rotulo) => esperar(rotulo, () => pag.evaluate(() =>
  !!document.querySelector('#cel-biblioteca img.bib-mini.pronta')), v => v === true, 20000);
const noAssunto = pag => pag.evaluate(a => !!document.querySelector('#cel-biblioteca.ativa .cel-bib-assunto[data-assunto="' + a + '"]'), ASSUNTO);
const naBusca = pag => pag.evaluate(() => {
  const c = document.querySelector('#cel-biblioteca.ativa #cel-bib-busca');
  return c ? c.value + '|' + document.querySelectorAll('#cel-bib-assuntos .item-lista').length : '';
});
const noComeco = pag => pag.evaluate(() => {
  const c = document.querySelector('#cel-biblioteca.ativa #cel-bib-busca');
  return !!c && c.value === '' && ((document.querySelector('#cel-bib-miolo .cel-bib-secao') || {}).textContent === 'Minhas listas');
});

/* Nada passa da borda nem rola de lado dentro do celular; a página não rola de lado. */
const varrer = pag => pag.evaluate(() => {
  const largura = window.innerWidth;
  const ruins = [];
  const nome = e => (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).join('.') : '') || e.tagName;
  document.querySelectorAll('#cel-conteudo, #cel-conteudo *').forEach(e => {
    const r = e.getBoundingClientRect();
    if (!r.width && !r.height) return;
    if (r.right > largura + 1) ruins.push('passa da borda: ' + nome(e) + ' ' + Math.round(r.right - largura) + ' px');
    if (e.tagName !== 'INPUT' && e.tagName !== 'IMG' && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== 'visible') {
      ruins.push('rola de lado: ' + nome(e) + ' ' + (e.scrollWidth - e.clientWidth) + ' px');
    }
    if (e.tagName === 'BUTTON' && e.scrollWidth > e.clientWidth + 1) ruins.push('texto passa do botão: ' + e.textContent.trim().slice(0, 40));
  });
  const pagina = document.scrollingElement.scrollWidth > document.scrollingElement.clientWidth + 1;
  return { ruins: ruins.slice(0, 6), total: ruins.length, paginaRolaDeLado: pagina };
});

/* O IndexedDB inteiro, de todos os depósitos: as chaves e os valores, com o
 * conteúdo de cada Blob pelo sha256. Lido de dentro da página, só leitura. */
const retratoDoBanco = pag => pag.evaluate(async () => {
  const b = await new Promise((r, j) => { const q = indexedDB.open('apoio-educacional'); q.onsuccess = () => r(q.result); q.onerror = () => j(q.error); });
  const hexDe = async buf => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buf))).map(x => x.toString(16).padStart(2, '0')).join('');
  const valor = async v => {
    if (v instanceof Blob) return { blob: v.type + ':' + v.size + ':' + await hexDe(await v.arrayBuffer()) };
    if (v instanceof ArrayBuffer) return { buffer: await hexDe(v) };
    if (ArrayBuffer.isView(v)) return { vista: await hexDe(v.buffer) };
    if (v instanceof Date) return { data: v.toISOString() };
    if (Array.isArray(v)) { const a = []; for (const x of v) a.push(await valor(x)); return a; }
    if (v && typeof v === 'object') { const o = {}; for (const k of Object.keys(v).sort()) o[k] = await valor(v[k]); return o; }
    return v;
  };
  const pedir = (n, f) => new Promise((r, j) => { const g = b.transaction(n, 'readonly').objectStore(n)[f](); g.onsuccess = () => r(g.result); g.onerror = () => j(g.error); });
  const nomes = Array.from(b.objectStoreNames).sort();
  const por = {};
  let registros = 0;
  for (const n of nomes) {
    const chaves = await pedir(n, 'getAllKeys');
    const valores = await pedir(n, 'getAll');
    registros += chaves.length;
    const lista = [];
    for (let i = 0; i < valores.length; i++) lista.push([chaves[i], await valor(valores[i])]);
    por[n] = await hexDe(new TextEncoder().encode(JSON.stringify(lista)));
  }
  b.close();
  return { depositos: nomes.length, registros, por, tudo: await hexDe(new TextEncoder().encode(JSON.stringify(por))) };
});
const retratoDoLocal = pag => pag.evaluate(() => {
  const o = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); }
  return JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]]));
});
const escritas = pag => pag.evaluate(() => ({ gravacoes: window.__gravacoes.slice(), transacoes: window.__transacoes.slice() }));
const zerarEscritas = pag => pag.evaluate(() => { window.__gravacoes = []; window.__transacoes = []; });
const gravacoesDoCelular = [], transacoesDoCelular = [];
async function juntarEscritas(pag) {
  const e = await escritas(pag);
  gravacoesDoCelular.push.apply(gravacoesDoCelular, e.gravacoes);
  transacoesDoCelular.push.apply(transacoesDoCelular, e.transacoes);
}

async function printar(pag, nome) {
  if (!PRINTS) return;
  await pausa(500);
  await pag.screenshot({ path: path.join(PRINTS, nome) });
  console.log('   print: ' + nome);
}

(async () => {
  secao('0. A prova se confere');
  conf('nenhum veneno desconhecido foi pedido', desconhecidos.join(','), '');
  for (const m of Object.keys(VENENOS)) conf('a âncora de ' + m + ' aparece uma vez só no app.js', APP.split(VENENOS[m][1]).length - 1, 1);
  conf('o gancho da prova entrou uma vez no app.js servido', appServido.split(GANCHO).length - 1, 1);
  if (MODO) conf('o veneno ' + MODO + ' foi aplicado', appServido.indexOf(VENENOS[MODO][1]) < 0, true);
  conf('o nome do alto do index.html foi achado, e o servidor entrega "' + NOME_TESTE + '" no lugar dele',
    !!NOME_REAL && trocas['/index.html'].indexOf(NOME_REAL) < 0 && trocas['/index.html'].indexOf(NOME_TESTE) >= 0, true);
  if (H.placar.falhas) return H.fim(amb)();

  const nav = await amb.subir();

  secao('1. Os três perfis: o principal, o completo e o vazio');
  const s1 = await semear(null, true, ['revisao', 'desafio', 'area']);
  conf('o principal: o pacote sintético, o aluno e as três listas (com uma página de teoria)', s1.importou && s1.pagina && s1.listas === 3, true);
  const ctxCompleto = await nav.createBrowserContext();
  const s2 = await semear(ctxCompleto, true, ['revisao']);
  conf('o completo: o pacote e só a lista completa', s2.importou && s2.listas === 1, true);
  const ctxVazio = await nav.createBrowserContext();
  const s3 = await semear(ctxVazio, false, ['revisao', 'desafio', 'area']);
  conf('o vazio: as três listas, sem pacote nenhum', s3.listas, 3);

  secao('2. O celular a 390 x 844: a aba Biblioteca, com o mesmo ícone');
  const cel = await celular(null, 390, 844);
  conf('o celular está no modo celular, a 390 px', await cel.evaluate(() => document.body.classList.contains('modo-celular') && window.innerWidth === 390), true);
  const aba = await cel.evaluate(() => {
    const b = document.querySelector('#cel-abas .cel-aba[data-cel="biblioteca"]');
    return { rotulo: b.querySelector('.nav-rotulo').textContent, caminhos: Array.from(b.querySelectorAll('svg path')).map(p => p.getAttribute('d')) };
  });
  conf('a aba de baixo se chama Biblioteca', aba.rotulo, 'Biblioteca');
  conf('o ícone é o mesmo de antes (o livro)', JSON.stringify(aba.caminhos), JSON.stringify(ICONE_DA_ABA));
  conf('nenhuma aba de baixo diz mais "Livros"', await cel.evaluate(() => Array.from(document.querySelectorAll('#cel-abas .nav-rotulo')).some(r => r.textContent === 'Livros')), false);
  // o retrato do banco ANTES de andar pelas telas da Biblioteca
  await pausa(1500);
  const banco0 = await retratoDoBanco(cel);
  const local0 = await retratoDoLocal(cel);
  console.log('   o banco do celular: ' + banco0.depositos + ' depósitos, ' + banco0.registros + ' registros');
  await zerarEscritas(cel);

  secao('3. O começo; e o que falta só não chegou, em todos os valores da marca');
  conf('a aba Biblioteca abriu com os três cartões', await irParaBiblioteca(cel, 3), true);
  conf('o título, a busca no alto (com "Pitágoras") e "Minhas listas" embaixo', await cel.evaluate(() => {
    const c = document.querySelector('#cel-biblioteca');
    const busca = c.querySelector('#cel-bib-busca'), secao = c.querySelector('.cel-bib-secao');
    return [c.querySelector('.cel-titulo').textContent, busca ? busca.placeholder : '', secao ? secao.textContent : '',
      !!(busca && secao && (busca.compareDocumentPosition(secao) & Node.DOCUMENT_POSITION_FOLLOWING))].join('|');
  }), 'Biblioteca|Buscar um assunto (frações, Pitágoras...)|Minhas listas|true');
  let cs = await cartoes(cel);
  conf('os três cartões, a mais nova primeiro', cs.map(c => c.id).join(','), 'lista-revisao,lista-desafio,lista-area');
  conf('o cartão da lista completa: nome, nível, assunto, conta e o Ver lista aceso',
    /^Revisão de equações para a prova\nNível Regular\nEquações do Segundo Grau\n4 exercícios e 1 página de teoria/.test(cs[0].texto) && !cs[0].apagado && !cs[0].motivo, true);
  conf('nenhum botão de PDF na aba (o PDF é da A3)', await cel.evaluate(() =>
    Array.from(document.querySelectorAll('#cel-biblioteca button')).some(b => /PDF/.test(b.textContent))), false);
  conf('os livros ficam no tablet, numa linha no fim', await textoDa(cel, '#cel-bib-livros'), 'Os livros ficam no tablet.');
  const vistos = [];
  for (const [m, linha, motivo, apagaIncompleta] of ESTADOS) {
    await marcar(cel, m);
    await pausa(500);
    const tela = await textoDa(cel, '#cel-biblioteca');
    if (SUMIU.test(tela)) vistos.push(m === null ? 'sem marca' : m);
    if (MODO === '--envenenado-diz-que-sumiu') continue;
    const cc = await cartoes(cel);
    const d = porId(cc, 'lista-desafio'), a = porId(cc, 'lista-area'), r = porId(cc, 'lista-revisao');
    conf((m === null ? 'sem marca (o celular sem a conta)' : m) + ': a linha, o motivo nos dois cartões, o assunto mantido, e o Ver lista ' +
      (apagaIncompleta ? 'apagado' : 'aceso') + ' na incompleta',
      [await linhaEstado(cel), d.motivo, a.motivo, d.assunto, d.apagado, a.apagado, r.apagado || !!r.motivo].join(' | '),
      [linha, motivo, motivo, 'Equações do Segundo Grau', apagaIncompleta, true, false].join(' | '));
    if (m === 'trazendo 6/15') {
      await printar(cel, '390x844_2_linha_trazendo.png');
      await clicar(cel, '#cel-bib-miolo .cel-bib-lista[data-lista="lista-desafio"] [data-acao="ver-lista"]');
      await pausa(400);
      conf('o Ver lista apagado não abre nada', await cel.evaluate(() => !!document.querySelector('#cel-bib-miolo') && !document.querySelector('.cel-bib-ver-lista')), true);
    }
    if (m === 'faltam') {
      await printar(cel, '390x844_2b_faltam.png');
      await clicar(cel, '#cel-bib-miolo .cel-bib-lista[data-lista="lista-desafio"] [data-acao="ver-lista"]');
      await esperar('o Ver lista da lista incompleta', () => cel.evaluate(() => document.querySelectorAll('.cel-bib-ver-lista .cel-bib-ex').length), v => v >= 1, 10000);
      conf('faltam: a lista incompleta abre com o que veio e a nota do resto, sem dizer que sumiu', await cel.evaluate(() => {
        const t = document.querySelector('.cel-bib-ver-lista');
        return [t.querySelectorAll('.cel-bib-ex').length, (t.querySelector('#cel-bib-lista-nota') || {}).textContent, /não est(á|ão) mais/.test(t.innerText)].join('|');
      }), '1|' + CARTAO.parcial + '|false');
      await clicar(cel, '.cel-bib-ver-lista .bib-voltar');
      await esperar('voltou às listas', () => cel.evaluate(() => document.querySelectorAll('#cel-bib-miolo .cel-bib-lista').length), v => v >= 3, 10000);
    }
    if (m === null) await printar(cel, '390x844_1_inicio.png');
  }
  if (MODO === '--envenenado-diz-que-sumiu') {
    conf('VENENO visto: o celular disse que o exercício não está mais na biblioteca em ' + vistos.length + ' de ' + ESTADOS.length + ' valores (' + vistos.join(', ') + ')',
      vistos.length === ESTADOS.length, true);
    return H.fim(amb)();
  }
  conf('em nenhum dos ' + ESTADOS.length + ' valores da marca a tela disse que um exercício não está mais na biblioteca', vistos.join(','), '');
  await marcar(cel, 'prontos');
  await pausa(400);

  secao('4. A busca: o que tem material neste celular primeiro, os sinais, e "Nas suas listas"');
  conf('a busca achou assuntos', await buscar(cel), true);
  const busca = await cel.evaluate(a => {
    const c = document.querySelector('#cel-biblioteca');
    const linhas = Array.from(c.querySelectorAll('#cel-bib-assuntos .item-lista'));
    const sinais = l => Array.from(l.querySelectorAll('[data-tipo-sinal]')).filter(s => !s.hidden && !s.closest('[hidden]')).map(s => s.dataset.tipoSinal).join('+');
    const alvo = linhas.find(l => l.dataset.assunto === a);
    const semMaterial = linhas.map(l => l.dataset.semMaterial === 'true');
    const legendas = Array.from(c.querySelectorAll('.tema-legenda'));
    return {
      alvo: alvo ? alvo.querySelector('.detalhe').textContent + '|' + sinais(alvo) : '',
      primeirosComMaterial: semMaterial.indexOf(true) > 0 && semMaterial.slice(semMaterial.indexOf(true)).every(Boolean),
      notas: linhas.filter(l => l.dataset.semMaterial === 'true').every(l => /sem material neste celular$/.test(l.querySelector('.detalhe').textContent) && !sinais(l)),
      semNota: linhas.filter(l => l.dataset.semMaterial !== 'true').every(l => !/sem material/.test(l.querySelector('.detalhe').textContent) && !!sinais(l)),
      legendas: legendas.length, legendaVisivel: legendas.filter(l => !l.hidden).length,
      legendaNoAlto: !!(legendas[0] && linhas[0] && (legendas[0].compareDocumentPosition(linhas[0]) & Node.DOCUMENT_POSITION_FOLLOWING)),
      secoes: Array.from(c.querySelectorAll('.cel-bib-secao')).map(s => s.textContent).join(','),
      nasListas: Array.from(c.querySelectorAll('#cel-bib-miolo .cel-bib-lista')).map(l => l.dataset.lista).join(',')
    };
  }, ASSUNTO);
  console.log('   ' + JSON.stringify(busca));
  conf('o assunto do pacote mostra o ano e só os sinais que existem (teoria e exercícios)', busca.alvo, '9º ano|teoria+exercicios');
  conf('os assuntos com material neste celular vêm primeiro', busca.primeirosComMaterial, true);
  conf('os outros dizem "sem material neste celular", sem sinal; os primeiros, com sinal e sem a nota', busca.notas + '|' + busca.semNota, 'true|true');
  conf('a legenda aparece uma vez, no alto', busca.legendas + '|' + busca.legendaVisivel + '|' + busca.legendaNoAlto, '1|1|true');
  conf('primeiro "Assuntos", depois "Nas suas listas"', busca.secoes, 'Assuntos,Nas suas listas');
  conf('"Nas suas listas" traz as listas das equações', busca.nasListas, 'lista-revisao,lista-desafio');
  await printar(cel, '390x844_3_busca.png');
  // a marca que anda não fecha o "Ver os outros" aberto nem tira a rolagem
  if (await clicar(cel, '#cel-bib-assuntos .cel-bib-mais')) {
    await pausa(300);
    const antes = await cel.evaluate(() => { const c = document.querySelector('#cel-conteudo'); c.scrollTop = 300;
      return document.querySelectorAll('#cel-bib-assuntos .item-lista').length + '|' + c.scrollTop; });
    await marcar(cel, 'trazendo 2/15');
    await pausa(600);
    const depois = await cel.evaluate(() => document.querySelectorAll('#cel-bib-assuntos .item-lista').length + '|' + document.querySelector('#cel-conteudo').scrollTop);
    conf('a linha que anda (trazendo 2 de 15) não fecha o "Ver os outros" nem mexe na rolagem (' + antes + ')', depois + '|' + await linhaEstado(cel),
      antes + '|Trazendo os exercícios pelo Wi-Fi: 2 de 15.');
    await marcar(cel, 'prontos');
    await pausa(400);
  } else conf('(arranjo) a busca tem o "Ver os outros"', false, true);
  // a mudança que chega da nuvem não tira o foco nem o que ela digitou
  const foco = await cel.evaluate(() => {
    const c = document.querySelector('#cel-bib-busca');
    c.__daProva = true;
    c.focus();
    c.value = 'equaçõ';
    window.__provaRedesenhar();
    const agora = document.querySelector('#cel-bib-busca');
    return [document.activeElement === agora, !!(agora && agora.__daProva), agora ? agora.value : ''].join('|');
  });
  conf('a mudança da nuvem com ela digitando: o campo continua o mesmo, com o foco e o que ela escreveu', foco, 'true|true|equaçõ');
  await digitar(cel, '#cel-bib-busca', TERMO);

  secao('5. A página do assunto, em uma coluna e só para ler');
  conf('o assunto abriu', await abrirAssunto(cel), true);
  await miniaturaPronta(cel, 'a primeira miniatura do assunto');
  const pagina = await cel.evaluate(() => {
    const p = document.querySelector('#cel-biblioteca .cel-bib-assunto');
    const lefts = Array.from(p.querySelectorAll('.bte-ex')).map(e => Math.round(e.getBoundingClientRect().left));
    return {
      voltar: p.querySelector('.bib-voltar').textContent.trim(), caminho: p.querySelector('.bib-assunto-caminho').textContent,
      titulo: p.querySelector('.bib-assunto-titulo').textContent,
      secoes: Array.from(p.querySelectorAll('.bib-assunto-secao')).map(s => s.dataset.secao).join(','),
      blocos: Array.from(p.querySelectorAll('.bte-secao')).map(s => s.dataset.secao).join(','),
      caixas: p.querySelectorAll('input[type=checkbox]').length, texto: p.innerText,
      baseVerLista: (p.querySelector('.bte-lista-ver') || {}).textContent || '',
      botoesDeAbrir: p.querySelectorAll('button.bte-ex-abrir, button.bte-teoria-abrir').length,
      umaColuna: lefts.length > 1 && lefts.every(x => x === lefts[0])
    };
  });
  const proibidos = ['Nos livros', 'No material', 'Anexar', 'Comparar', 'Usar esta lista', 'no tablet'].filter(t => pagina.texto.indexOf(t) >= 0);
  if (MODO === '--envenenado-celular-mostra-no-material') {
    conf('VENENO visto: a página do assunto do celular mostra "No material" (' + pagina.caixas + ' caixas)', proibidos.indexOf('No material') >= 0 && pagina.caixas > 0, true);
    return H.fim(amb)();
  }
  conf('o Voltar diz "Voltar à busca", e o caminho e o título são do assunto',
    pagina.voltar + '|' + /9º ano/.test(pagina.caminho) + '|' + pagina.titulo, 'Voltar à busca|true|Equação do 2º grau: como resolver');
  conf('as seções: só "Teoria e exercícios" e os Vizinhos (sem "Nos livros")', pagina.secoes, 'teoria,vizinhos');
  conf('o bloco: teoria, lista de base e exercícios', pagina.blocos, 'teoria,lista-base,exercicios');
  conf('sem "Nos livros", "No material", Anexar, Comparar, "Usar esta lista" nem "no tablet"', proibidos.join(','), '');
  conf('nenhuma caixa de marcar, e nada que abra a tela cheia do tablet', pagina.caixas + '|' + pagina.botoesDeAbrir, '0|0');
  conf('a lista de base tem "Ver lista"', pagina.baseVerLista.trim(), 'Ver lista');
  conf('os exercícios numa coluna só', pagina.umaColuna, true);
  await printar(cel, '390x844_4_assunto.png');
  const rolagem = await cel.evaluate(() => {
    const c = document.querySelector('#cel-conteudo'); c.scrollTop = 500; const antes = c.scrollTop;
    window.__provaRedesenhar();
    return antes + '|' + c.scrollTop + '|' + !!document.querySelector('#cel-biblioteca.ativa .cel-bib-assunto');
  });
  conf('a mudança da nuvem no assunto não leva a rolagem ao topo nem refaz a página', rolagem.split('|')[0] === rolagem.split('|')[1] && /\|true$/.test(rolagem), true);
  await cel.evaluate(() => { document.querySelector('#cel-conteudo').scrollTop = 0; });

  secao('6. O Ver lista, e o Voltar do Android');
  conf('o Ver lista da lista de base abriu', await abrirBase(cel), true);
  await miniaturaPronta(cel, 'a primeira miniatura do Ver lista');
  const verBase = await cel.evaluate(() => {
    const t = document.querySelector('#cel-biblioteca .cel-bib-ver-lista');
    return {
      voltar: t.querySelector('.bib-voltar').textContent.trim(), titulo: t.querySelector('.cel-bib-lista-titulo').textContent,
      nivel: (t.querySelector('.cel-bib-nivel') || {}).textContent || '',
      nomes: Array.from(t.querySelectorAll('.cel-bib-ex .bte-ex-nome')).map(n => n.textContent),
      imagens: t.querySelectorAll('.cel-bib-ex img.bib-mini').length, pdf: /PDF/.test(t.innerText)
    };
  });
  conf('a lista de base: Voltar ao assunto, o título e o nível', verBase.voltar + '|' + verBase.titulo + '|' + verBase.nivel, 'Voltar ao assunto|Lista de base|Nível Base');
  conf('os exercícios da lista, um embaixo do outro, na ordem (' + BASE_N + ')',
    verBase.nomes.join(',') + '|' + verBase.imagens, Array.from({ length: BASE_N }, (x, i) => 'Exercício ' + (i + 1)).join(',') + '|' + BASE_N);
  conf('sem PDF na tela (A3)', verBase.pdf, false);
  await printar(cel, '390x844_5_ver_lista.png');
  await voltar(cel);
  conf('o Voltar do Android devolve o assunto', await noAssunto(cel), true);
  await voltar(cel);
  await esperar('a busca voltou', () => naBusca(cel), v => /\|[1-9]/.test(v || ''), 8000);
  conf('o seguinte devolve a busca, com o termo no campo', (await naBusca(cel)).split('|')[0], TERMO);
  await voltar(cel);
  await esperar('o começo voltou', () => noComeco(cel), v => v === true, 8000);
  conf('e o seguinte, o começo com Minhas listas', await noComeco(cel), true);
  await clicar(cel, '#cel-bib-miolo .cel-bib-lista[data-lista="lista-revisao"] [data-acao="ver-lista"]');
  await esperar('o Ver lista da lista dela', () => cel.evaluate(() => document.querySelectorAll('.cel-bib-ver-lista .cel-bib-ex').length), v => v >= 1, 10000);
  await miniaturaPronta(cel, 'a miniatura da lista dela');
  conf('a lista dela: Voltar às listas, o título, a página de teoria e os quatro exercícios, sem nota', await cel.evaluate(() => {
    const t = document.querySelector('.cel-bib-ver-lista');
    return [t.querySelector('.bib-voltar').textContent.trim(), t.querySelector('.cel-bib-lista-titulo').textContent,
      t.querySelectorAll('.cel-bib-pagina').length, t.querySelectorAll('.cel-bib-ex').length, !!t.querySelector('#cel-bib-lista-nota')].join('|');
  }), 'Voltar às listas|Revisão de equações para a prova|1|4|false');
  await pausa(1500);
  await juntarEscritas(cel);
  conf('nenhum erro de página no celular a 390', cel.errosDePagina.join(' | '), '');

  secao('7. O Voltar do Android em outra aba nova: a raiz, a pressa, as buscas, o Limpar, a aba, o duplo e a recarga');
  const hv = await celular(null, 390, 844);
  await zerarEscritas(hv);
  const avisoDeSair = () => hv.evaluate(() => (window.__avisos || []).join('|'));
  await irParaBiblioteca(hv, 3);
  await voltar(hv);
  conf('da Biblioteca, o Voltar vai a Hoje', await ativa(hv), 'cel-hoje');
  await voltar(hv);
  conf('em Hoje (a raiz), o Voltar avisa e o aplicativo não sai', /Toque em Voltar de novo para sair\./.test(await avisoDeSair()) + '|' +
    await hv.evaluate(() => document.body.classList.contains('modo-celular') && /index\.html/.test(location.href)), 'true|true');
  await pausa(4000);   // a guarda da saída volta (3,6 s)
  await irParaBiblioteca(hv, 3);
  await hv.evaluate(() => { window.__avisos = []; });
  // ela começa a busca e toca em Voltar antes dos 180 ms
  await hv.evaluate(() => {
    const c = document.querySelector('#cel-bib-busca');
    c.value = 'equação';
    c.dispatchEvent(new Event('input', { bubbles: true }));
    history.back();
  });
  await pausa(900);
  conf('o Voltar dentro dos 180 ms da busca: Hoje, sem passo de busca por cima', (await ativa(hv)) + '|' +
    await hv.evaluate(() => !!(history.state && history.state.retrato && history.state.retrato.celBib)), 'cel-hoje|false');
  await voltar(hv);
  conf('e o Voltar seguinte é o da raiz (nenhum toque morto)', /Toque em Voltar de novo para sair\./.test(await avisoDeSair()), true);
  await pausa(4000);
  await irParaBiblioteca(hv, 3);
  for (const t of ['equação', 'fração', 'pitágoras']) await digitar(hv, '#cel-bib-busca', t);
  await voltar(hv);
  conf('três buscas seguidas são um passo só: o Voltar devolve o começo', await noComeco(hv), true);
  await buscar(hv);
  await clicar(hv, '#cel-bib-limpar');
  await pausa(700);
  conf('o Limpar devolve o começo', await noComeco(hv), true);
  await voltar(hv);
  conf('e o Voltar depois do Limpar não volta à busca: vai a Hoje', await ativa(hv), 'cel-hoje');
  await pausa(4000);
  await irParaBiblioteca(hv, 3);
  await buscar(hv);
  await abrirAssunto(hv);
  await clicar(hv, '#cel-abas .cel-aba[data-cel="alunos"]');
  await pausa(600);
  await voltar(hv);
  await esperar('o assunto voltou', () => noAssunto(hv), v => v === true, 8000);
  conf('a troca de aba: Alunos e Voltar devolvem o assunto aberto', await noAssunto(hv), true);
  await abrirBase(hv);
  await hv.evaluate(() => { history.back(); history.back(); });
  await pausa(1500);
  await esperar('a busca depois do Voltar duplo', () => naBusca(hv), v => /\|[1-9]/.test(v || ''), 8000);
  conf('o Voltar duplo rápido, do Ver lista: a busca com o termo', (await naBusca(hv)).split('|')[0], TERMO);
  await abrirAssunto(hv);
  await juntarEscritas(hv);
  await abrirCelular(hv, true);
  await zerarEscritas(hv);
  await voltar(hv, 1200);
  await esperar('a busca depois da recarga', () => naBusca(hv), v => /\|[1-9]/.test(v || ''), 10000);
  conf('a recarga no meio (no assunto): o Voltar seguinte devolve a busca, com o termo', (await naBusca(hv)).split('|')[0], TERMO);
  await juntarEscritas(hv);
  conf('nenhum erro de página na aba dos Voltar', hv.errosDePagina.join(' | '), '');
  await hv.close();

  secao('8. A trava de transbordo: 360, 390 e 412 px, letra normal e 130%');
  for (const [w, hh] of [[360, 740], [390, 844], [412, 915]]) {
    const p = w === 390 ? cel : await celular(null, w, hh);
    if (p === cel) { await clicar(p, '#cel-abas .cel-aba[data-cel="hoje"]'); await pausa(300); }
    await zerarEscritas(p);
    await irParaBiblioteca(p, 3);
    const telas = [
      ['começo', async () => { await marcar(p, null); await pausa(500); }],
      ['começo com a linha', async () => { await marcar(p, 'trazendo 6/15'); await pausa(500); }],
      ['busca', async () => { await marcar(p, 'prontos'); await buscar(p); }],
      ['assunto', async () => { await abrirAssunto(p); await miniaturaPronta(p, 'a miniatura do assunto'); }],
      ['Ver lista', async () => { await abrirBase(p); await miniaturaPronta(p, 'a miniatura do Ver lista'); }]
    ];
    let n = 0;
    for (const [nome, ir] of telas) {
      await ir();
      n++;
      if (w === 412) await printar(p, '412x915_' + ['1_inicio', '2_linha_trazendo', '3_busca', '4_assunto', '5_ver_lista'][n - 1] + '.png');
      for (const [rotulo, css] of [['letra normal', ''], ['letra 130%', LETRA_130]]) {
        await letra(p, css);
        await pausa(250);
        const v = await varrer(p);
        conf(w + ' px, ' + rotulo + ', ' + nome + ': nada passa da borda, nada rola de lado, a página não rola de lado' +
          (v.total ? ' (' + v.ruins.join('; ') + ')' : ''), v.total + '|' + v.paginaRolaDeLado, '0|false');
      }
      await letra(p, '');
    }
    if (w === 360) {
      // controles: a varredura vê um elemento largo, e a letra de 130% cresce mesmo
      const largo = await p.evaluate(() => {
        const d = document.createElement('div'); d.id = 'prova-largo'; d.style.cssText = 'width:500px;height:10px';
        document.querySelector('#cel-biblioteca').appendChild(d); return true;
      }).then(() => varrer(p));
      await p.evaluate(() => document.querySelector('#prova-largo').remove());
      conf('controle: um elemento de 500 px a 360 é pego pela varredura', largo.total > 0, true);
      const letras = [];
      for (const css of ['', LETRA_130]) { await letra(p, css); await pausa(150); letras.push(await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.cel-bib-lista-titulo')).fontSize))); }
      await letra(p, '');
      conf('controle: a letra de 130% cresce de verdade (' + letras.join(' > ') + ' px)', letras[1] >= letras[0] * 1.25, true);
    }
    await pausa(1000);
    await juntarEscritas(p);
    conf('nenhum erro de página a ' + w + ' px', p.errosDePagina.join(' | '), '');
    if (p !== cel) await p.close();
  }

  secao('9. Nada faltando: a linha some; sem pacote nenhum: o que ainda não chegou e o que fica no tablet');
  const pc = await celular(ctxCompleto, 390, 844);
  await irParaBiblioteca(pc, 1);
  const linhasCompleto = [];
  for (const m of ['prontos', 'sem-wifi', 'faltam', null]) { await marcar(pc, m); await pausa(400); linhasCompleto.push(await linhaEstado(pc)); }
  await marcar(pc, 'trazendo 3/15');
  await pausa(400);
  linhasCompleto.push(await linhaEstado(pc));
  conf('com a lista toda no aparelho: sem linha em prontos, sem Wi-Fi, faltam e sem marca; com a série andando, a linha do andamento',
    linhasCompleto.map(String).join(' | '), 'null | null | null | null | Trazendo os exercícios pelo Wi-Fi: 3 de 15.');
  conf('nenhum erro de página no perfil completo', pc.errosDePagina.join(' | '), '');
  await pc.close();
  for (const [w, hh] of [[390, 844], [412, 915]]) {
    const pv = await celular(ctxVazio, w, hh);
    await irParaBiblioteca(pv, 3);
    if (w === 390) {
      const cv = await cartoes(pv);
      conf('sem pacote e sem a conta: a linha e os cartões dizem que os exercícios ficam no tablet, sem prometer o Wi-Fi',
        [await linhaEstado(pv)].concat(cv.map(c => c.motivo)).join(' | '), [FRASE.tablet, CARTAO.tablet, CARTAO.tablet, CARTAO.tablet].join(' | '));
      conf('e nada diz que sumiu', SUMIU.test(await textoDa(pv, '#cel-biblioteca')), false);
      await buscar(pv);
      conf('a busca sem pacote: o assunto aparece com "sem material neste celular"', await pv.evaluate(a =>
        (document.querySelector('#cel-bib-assuntos .item-lista[data-assunto="' + a + '"]') || {}).dataset.semMaterial, ASSUNTO), 'true');
      await abrirAssunto(pv);
      conf('o assunto sem pacote, no celular que não recebe pacotes: a teoria e os exercícios ficam no tablet',
        await textoDa(pv, '.cel-bib-assunto .bte-vazio'), 'A teoria e os exercícios ficam no tablet.');
      await clicar(pv, '.cel-bib-assunto .bib-voltar');
      await pausa(500);
    } else await buscar(pv);
    await marcar(pv, 'trazendo 6/15');
    await pausa(300);
    await abrirAssunto(pv);
    const sem = await pv.evaluate(() => {
      const p = document.querySelector('.cel-bib-assunto');
      return [(p.querySelector('.bte-vazio') || {}).textContent, (p.querySelector('#cel-bib-estado') || {}).innerText, /no tablet|não est(á|ão) mais/.test(p.innerText)].join('|');
    });
    conf(w + ' px, o assunto antes dos pacotes, com a série andando: o material ainda não chegou, a linha do andamento, e nem "no tablet" nem "sumiu"',
      sem, 'A teoria e os exercícios deste assunto ainda não chegaram a este celular.|' + FRASE.trazendo + '|false');
    await printar(pv, w + 'x' + hh + '_6_assunto_sem_pacotes.png');
    await juntarEscritas(pv);
    conf('nenhum erro de página no perfil vazio a ' + w + ' px', pv.errosDePagina.join(' | '), '');
    await pv.close();
  }

  secao('10. Só lê: o banco igual byte a byte, nenhuma gravação');
  await pausa(1000);
  const banco1 = await retratoDoBanco(cel);
  const local1 = await retratoDoLocal(cel);
  const mudaram = Object.keys(Object.assign({}, banco0.por, banco1.por)).filter(n => banco0.por[n] !== banco1.por[n]);
  if (MODO === '--envenenado-celular-grava-ao-navegar') {
    conf('VENENO visto: andar pelas telas da Biblioteca chamou a gravação no celular (' + gravacoesDoCelular.slice(0, 3).join(', ') + ')',
      gravacoesDoCelular.length > 0 || mudaram.length > 0, true);
    return H.fim(amb)();
  }
  conf('nenhuma chamada de gravação ao Store em nenhuma tela, em nenhum perfil', gravacoesDoCelular.join(','), '');
  conf('nenhuma transação de escrita no IndexedDB', transacoesDoCelular.join(' ; '), '');
  conf('o IndexedDB inteiro ficou igual byte a byte (' + banco1.depositos + ' depósitos, ' + banco1.registros + ' registros)',
    banco1.tudo + '|' + mudaram.join(','), banco0.tudo + '|');
  conf('o localStorage ficou igual', local1 === local0, true);

  secao('11. O nome de verdade em lugar nenhum');
  conf('o nome de verdade não aparece no celular, e "' + NOME_TESTE + '" está no lugar dele', await cel.evaluate((n, t) =>
    document.documentElement.outerHTML.indexOf(n) < 0 && document.documentElement.outerHTML.indexOf(t) >= 0, NOME_REAL, NOME_TESTE), true);
  conf('nenhum erro de página', cel.errosDePagina.join(' | '), '');
  return H.fim(amb)();
})().catch(H.fim(amb));
