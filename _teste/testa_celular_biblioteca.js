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
 * perfil, como na testa_navegacao_biblioteca. Aluno e listas sintéticos. A
 * marca escondida da A1 (#modo-celular[data-pacotes]) é posta pela prova,
 * com os valores que a série do celular escreve ('trazendo 6/15', 'sem-wifi',
 * 'parou', 'prontos'): é ela que a linha e os cartões leem. O nome no alto do
 * index.html é trocado por "Professora Teste" no que o servidor entrega, e a
 * prova confere que o nome de verdade não aparece em página nenhuma.
 *
 * O que se prova, a 390 x 844:
 *   1. a aba se chama Biblioteca, com o mesmo ícone de antes;
 *   2. o começo: a busca no alto e Minhas listas embaixo, cada cartão com
 *      nome, nível, assunto, conta e o Ver lista; nenhum botão de PDF (A3);
 *   3. a linha discreta: "Trazendo os exercícios pelo Wi-Fi: 6 de 15.", "Os
 *      exercícios chegam a este celular no próximo Wi-Fi." e, com tudo
 *      dentro, nenhuma linha; enquanto falta pacote, o cartão da lista sem os
 *      exercícios mostra só nome e nível, o Ver lista apagado, e a tela NUNCA
 *      diz "não está mais na biblioteca";
 *   4. a busca: os assuntos com o ano, só os sinais que existem, a legenda uma
 *      vez no alto, e depois "Nas suas listas";
 *   5. a página do assunto: só a teoria, a lista de base (com "Ver lista"),
 *      os exercícios e os vizinhos, numa coluna; sem "Nos livros", sem "No
 *      material", sem Anexar e sem Comparar;
 *   6. o Ver lista (da lista de base e da lista dela), e o Voltar do Android
 *      (history.back) devolvendo o assunto, a busca com o termo e o começo;
 *   7. SÓ LÊ: o IndexedDB inteiro (todos os depósitos, com o conteúdo dos
 *      Blobs) igual byte a byte antes e depois de andar por todas as telas,
 *      nenhuma chamada de gravação ao Store, nenhuma transação de escrita e o
 *      localStorage igual;
 *   8. a trava de transbordo: a 360, 390 e 412 px, com a letra normal e a
 *      130%, nada passa da borda, nada rola de lado e a página não rola de
 *      lado, em cada uma das cinco telas;
 *   9. nenhum erro de página, e o nome de verdade em lugar nenhum.
 *
 * Venenos (a prova TEM de ver o defeito e passa dizendo que viu):
 *   --envenenado-celular-mostra-no-material  a página do assunto do celular
 *                         volta a ter a caixa "No material" (5 vê);
 *   --envenenado-celular-grava-ao-navegar  a miniatura volta a ser guardada no
 *                         celular, e andar pelas telas chama a gravação (7 vê);
 *   --envenenado-diz-que-sumiu  o cartão esquece que os pacotes ainda chegam e
 *                         diz que o exercício não está mais na biblioteca (3 vê).
 *
 *   --prints <pasta>   o começo, a linha "Trazendo", a busca, o assunto e o Ver
 *                      lista, a 390 x 844 e a 412 x 915.
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

const VENENOS = {
  '--envenenado-celular-mostra-no-material': ['/app.js',
    '      if (cx.soLer) return null;   // 12b A2: o celular só lê, e a caixa "No material" mexe no material\n', ''],
  '--envenenado-celular-grava-ao-navegar': ['/app.js',
    '        if (aparelhoSoLe()) return dataUrl;   // 12b A2: no celular a miniatura só aparece, sem guardar: nada grava\n', ''],
  '--envenenado-diz-que-sumiu': ['/app.js',
    'var esperando = listaEsperaOsExercicios(l);', 'var esperando = false;']
};
const MODO = Object.keys(VENENOS).filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && !VENENOS[a]);
const trocas = { '/index.html': NOME_REAL ? INDEX.split(NOME_REAL).join(NOME_TESTE) : INDEX };
if (MODO) trocas['/app.js'] = APP.split(VENENOS[MODO][1]).join(VENENOS[MODO][2]);
const amb = H.criarAmbiente(PORTA, 'perfil_celular_biblioteca', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'celular_biblioteca_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

const ICONE_DA_ABA = ['M5 5.5A2.5 2.5 0 0 1 7.5 3H19v14.5H7.5A2.5 2.5 0 0 0 5 20z', 'M5 20a2 2 0 0 0 2 1.5H19'];
const BASE_N = Sintetico.LISTA_BASE.degraus.length;
const ASSUNTO = 'MAT09-04';     // "Equação do 2º grau: como resolver", ligado ao módulo das equações do 9º ano
const TERMO = 'equação';
const LETRA_130 = 'html{font-size:130%}';
const SUMIU = /não est(á|ão) mais na biblioteca/;

/* ---------- a página do celular ---------- */
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
  });
  await pag.goto(amb.ORIGEM + '/index.html', { waitUntil: 'networkidle0' });
  const ok = await esperar('o celular abriu', () => pag.evaluate(() => document.body.classList.contains('modo-celular') &&
    !!document.querySelector('#cel-abas') && !document.querySelector('#cel-abas').hidden && typeof Store === 'object'), v => v === true, 30000);
  if (!ok.ok) throw Object.assign(new Error('o celular não abriu'), { jaContado: false });
  await pag.evaluate(() => { const b = document.querySelector('#entendi-novidades'); if (b && document.querySelector('#modal-novidades.aberto')) b.click(); });
  await pausa(600);
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

async function irParaBiblioteca(pag) {
  await clicar(pag, '#cel-abas .cel-aba[data-cel="biblioteca"]');
  return (await esperar('Minhas listas no celular', () => pag.evaluate(() => document.querySelectorAll('#cel-biblioteca.ativa .cel-bib-lista').length),
    v => v >= 3, 20000)).ok;
}
// o cartão de cada lista: a classe, o texto, e se o Ver lista está apagado
const cartoes = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#cel-bib-miolo .cel-bib-lista')).map(c => ({
  id: c.dataset.lista, esperando: c.classList.contains('esperando'), texto: c.innerText.trim(),
  conta: !!c.querySelector('.cel-bib-lista-conta'), assunto: !!c.querySelector('.cel-bib-lista-assunto'),
  apagado: !!(c.querySelector('[data-acao="ver-lista"]') || {}).disabled
})));
const linhaEstado = pag => pag.evaluate(() => { const l = document.querySelector('#cel-bib-estado'); return !l || l.hidden ? null : l.innerText.trim(); });
async function esperarLinha(pag, rotulo, cond) {
  await pausa(300);
  return (await esperar(rotulo, () => linhaEstado(pag), cond, 8000)).valor;
}
async function abrirAssunto(pag) {
  await clicar(pag, '#cel-bib-assuntos .item-lista[data-assunto="' + ASSUNTO + '"]');
  return (await esperar('a página do assunto no celular', () => pag.evaluate(() => !!document.querySelector('#cel-biblioteca .cel-bib-assunto .bte')),
    v => v === true, 20000)).ok;
}
async function buscar(pag) {
  await digitar(pag, '#cel-bib-busca', TERMO);
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
async function voltarDoAndroid(pag) {
  await pag.evaluate(() => history.back());
  await pausa(700);
}

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
  if (MODO) conf('o veneno ' + MODO + ' foi aplicado', trocas['/app.js'] !== APP, true);
  conf('o nome do alto do index.html foi achado, e o servidor entrega "' + NOME_TESTE + '" no lugar dele',
    !!NOME_REAL && trocas['/index.html'].indexOf(NOME_REAL) < 0 && trocas['/index.html'].indexOf(NOME_TESTE) >= 0, true);
  if (H.placar.falhas) return H.fim(amb)();

  await amb.subir();

  secao('1. O tablet do mesmo perfil: o pacote sintético, um aluno e três listas');
  const tab = await amb.pagina();
  await tab.setViewport({ width: 1280, height: 800 });
  await H.abrirApp(tab, amb.ORIGEM);
  const zip = path.join(TMP, 'portal.zip');
  Sintetico.gerar(zip, { listas: true, base: true });
  await H.irParaAba(tab, 'ajustes');
  await (await tab.$('#arquivo-biblioteca')).uploadFile(zip);
  const imp = await esperar('a importação', () => tab.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca'); return c ? c.innerText.trim() : '';
  }), v => /^Biblioteca importada\.|não foi importado/.test(v || ''), 90000);
  conf('o pacote sintético entrou no tablet', /^Biblioteca importada\./.test(imp.valor || ''), true);
  const semeado = await tab.evaluate(async () => {
    const d = Store.bancoVazio();
    d.alunos = [{ id: 'alfa', nome: 'Aluno Alfa Teste', ativo: true, cor: '#1F3A5F', precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 100 }], mapeamentos: [] }];
    d.aulas = [{ id: 'x1', alunoId: 'alfa', serieId: null, data: '2026-11-10', hora: '14:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [], temNota: false }];
    await Store.salvar(d);
    const itens = (await Store.itensDaBiblioteca()).filter(i => /^9ano:equacoes-do-segundo-grau:/.test(i.id)).map(i => i.id).sort();
    const teoria = (await Store.teoriaDaBiblioteca()).filter(t => /^9ano:equacoes-do-segundo-grau/.test(t.id));
    const pagina = teoria[0] && teoria[0].paginas[1] ? teoria[0].paginas[1].id : null;
    const lista = (id, titulo, nivel, ids, paginas, quando) => Store.gravarListaBiblioteca({ id, titulo, nivel, itens: ids, paginas, origem: null,
      automatica: false, criadaEm: quando, editadaEm: quando });
    // a mais nova primeiro: a revisão (completa), a do desafio (com um exercício que falta) e a de área (sem nenhum)
    await lista('lista-revisao', 'Revisão de equações para a prova', 'regular', itens.slice(0, 4), pagina ? [pagina] : [], 1700000003000);
    await lista('lista-desafio', 'Equação do 2º grau, desafio', 'aprofundamento', [itens[4], '9ano:modulo-que-chega-depois:lista:ex:1'], [], 1700000002000);
    await lista('lista-area', 'Área de figuras planas', null, ['8ano:area-que-chega-depois:lista:ex:1', '8ano:area-que-chega-depois:lista:ex:2'], [], 1700000001000);
    return { itens: itens.length, pagina: !!pagina, listas: (await Store.listasDaBiblioteca()).length };
  });
  conf('o aluno e as três listas entraram (com exercícios do pacote e uma página de teoria)',
    semeado.itens >= 5 && semeado.pagina && semeado.listas === 3, true);
  await tab.close();

  secao('2. O celular a 390 x 844: a aba Biblioteca, com o mesmo ícone');
  const cel = await amb.pagina();
  await prepararCelular(cel, 390, 844);
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
  const gravacoesDoCelular = [];

  secao('3. O começo: a busca no alto e Minhas listas embaixo');
  conf('a aba Biblioteca abriu com os três cartões', await irParaBiblioteca(cel), true);
  conf('o título, a busca no alto e "Minhas listas" embaixo', await cel.evaluate(() => {
    const c = document.querySelector('#cel-biblioteca');
    const busca = c.querySelector('#cel-bib-busca'), secao = c.querySelector('.cel-bib-secao');
    return [c.querySelector('.cel-titulo').textContent, !!busca, secao ? secao.textContent : '',
      !!(busca && secao && (busca.compareDocumentPosition(secao) & Node.DOCUMENT_POSITION_FOLLOWING))].join('|');
  }), 'Biblioteca|true|Minhas listas|true');
  let cs = await cartoes(cel);
  conf('os três cartões, a mais nova primeiro', cs.map(c => c.id).join(','), 'lista-revisao,lista-desafio,lista-area');
  conf('o cartão da lista completa: nome, nível, assunto, conta e o Ver lista aceso',
    /^Revisão de equações para a prova\nNível Regular\nEquações do Segundo Grau\n4 exercícios e 1 página de teoria/.test(cs[0].texto) && !cs[0].apagado, true);
  conf('nenhum botão de PDF na aba (o PDF é da A3)', await cel.evaluate(() =>
    Array.from(document.querySelectorAll('#cel-biblioteca button')).some(b => /PDF/.test(b.textContent))), false);
  conf('sem a marca dos pacotes e com os pacotes no aparelho, nenhuma linha', await linhaEstado(cel), null);
  conf('(controle) com tudo dentro, o cartão diz o que não está mais na biblioteca, como no tablet',
    SUMIU.test(cs[1].texto) && cs[2].apagado, true);
  conf('os livros ficam no tablet, numa linha no fim', await textoDa(cel, '#cel-bib-livros'), 'Os livros ficam no tablet.');
  await printar(cel, '390x844_1_inicio.png');

  secao('4. A linha dos exercícios, pela marca da A1');
  await marcar(cel, 'trazendo 6/15');
  const trazendo = await esperarLinha(cel, 'a linha do andamento', v => !!v);
  cs = await cartoes(cel);
  const telaTrazendo = await textoDa(cel, '#cel-biblioteca');
  if (MODO === '--envenenado-diz-que-sumiu') {
    conf('VENENO visto: com os pacotes ainda chegando, a tela diz que o exercício não está mais na biblioteca', SUMIU.test(telaTrazendo), true);
    return H.fim(amb)();
  }
  conf('trazendo: "Trazendo os exercícios pelo Wi-Fi: 6 de 15."', trazendo, 'Trazendo os exercícios pelo Wi-Fi: 6 de 15.');
  conf('a linha fica logo abaixo da busca', await cel.evaluate(() => {
    const b = document.querySelector('.cel-bib-busca'); return !!b && b.nextElementSibling === document.querySelector('#cel-bib-estado');
  }), true);
  conf('as duas listas sem os exercícios: só nome e nível, Ver lista apagado',
    cs.slice(1).map(c => [c.esperando, c.apagado, c.conta, c.assunto].join(',')).join(' | '), 'true,true,false,false | true,true,false,false');
  conf('o cartão que espera diz só o nome e o nível', cs[1].texto.split('\n').filter(Boolean).slice(0, 2).join(' | '), 'Equação do 2º grau, desafio | Nível Aprofundamento');
  conf('a lista completa continua acesa', cs[0].esperando + ',' + cs[0].apagado, 'false,false');
  conf('enquanto os pacotes chegam, nada diz que um exercício não está mais na biblioteca', SUMIU.test(telaTrazendo), false);
  await printar(cel, '390x844_2_linha_trazendo.png');
  await clicar(cel, '#cel-bib-miolo .cel-bib-lista[data-lista="lista-area"] [data-acao="ver-lista"]');
  await pausa(400);
  conf('o Ver lista apagado não abre nada', await cel.evaluate(() => !!document.querySelector('#cel-bib-miolo') && !document.querySelector('.cel-bib-ver-lista')), true);
  await marcar(cel, 'sem-wifi');
  conf('sem Wi-Fi: "Os exercícios chegam a este celular no próximo Wi-Fi."',
    await esperarLinha(cel, 'a linha sem Wi-Fi', v => /próximo Wi-Fi/.test(v || '')), 'Os exercícios chegam a este celular no próximo Wi-Fi.');
  cs = await cartoes(cel);
  conf('sem Wi-Fi, as duas continuam esperando, e nada diz que sumiu',
    cs.slice(1).every(c => c.esperando && c.apagado) && !SUMIU.test(await textoDa(cel, '#cel-biblioteca')), true);
  await marcar(cel, 'parou');
  conf('a série que parou no meio também espera o próximo Wi-Fi',
    await esperarLinha(cel, 'a linha depois de parar', v => /próximo Wi-Fi/.test(v || '')), 'Os exercícios chegam a este celular no próximo Wi-Fi.');
  await marcar(cel, 'prontos');
  await pausa(600);
  conf('com tudo dentro, a linha some', await linhaEstado(cel), null);
  cs = await cartoes(cel);
  conf('e os cartões voltam a dizer o que têm', cs.map(c => c.esperando).join(','), 'false,false,false');

  secao('5. A busca: os assuntos com o ano e os sinais, e "Nas suas listas"');
  conf('a busca achou assuntos', await buscar(cel), true);
  const busca = await cel.evaluate(a => {
    const c = document.querySelector('#cel-biblioteca');
    const linhas = Array.from(c.querySelectorAll('#cel-bib-assuntos .item-lista'));
    const sinais = l => Array.from(l.querySelectorAll('[data-tipo-sinal]')).filter(s => !s.hidden && !s.closest('[hidden]')).map(s => s.dataset.tipoSinal).join('+');
    const alvo = linhas.find(l => l.dataset.assunto === a);
    const secoes = Array.from(c.querySelectorAll('.cel-bib-secao')).map(s => s.textContent);
    const legendas = Array.from(c.querySelectorAll('.tema-legenda'));
    return {
      linhas: linhas.length, alvo: alvo ? alvo.querySelector('.detalhe').textContent + '|' + sinais(alvo) : '',
      semSinal: linhas.filter(l => !sinais(l)).length, semSinalComIcone: linhas.filter(l => !sinais(l) && l.querySelector('.tema-sinais:not([hidden])')).length,
      legendas: legendas.length, legendaVisivel: legendas.filter(l => !l.hidden).length,
      legendaNoAlto: !!(legendas[0] && linhas[0] && (legendas[0].compareDocumentPosition(linhas[0]) & Node.DOCUMENT_POSITION_FOLLOWING)),
      secoes: secoes.join(','),
      nasListas: Array.from(c.querySelectorAll('#cel-bib-miolo .cel-bib-lista')).map(l => l.dataset.lista).join(',')
    };
  }, ASSUNTO);
  console.log('   ' + JSON.stringify(busca));
  conf('o assunto do pacote mostra o ano e só os sinais que existem (teoria e exercícios)', busca.alvo, '9º ano|teoria+exercicios');
  conf('o assunto sem material não mostra sinal nenhum (há ' + busca.semSinal + ')', busca.semSinal > 0 && busca.semSinalComIcone === 0, true);
  conf('a legenda aparece uma vez, no alto', busca.legendas + '|' + busca.legendaVisivel + '|' + busca.legendaNoAlto, '1|1|true');
  conf('primeiro "Assuntos", depois "Nas suas listas"', busca.secoes, 'Assuntos,Nas suas listas');
  conf('"Nas suas listas" traz as listas das equações', busca.nasListas, 'lista-revisao,lista-desafio');
  await printar(cel, '390x844_3_busca.png');

  secao('6. A página do assunto, em uma coluna e só para ler');
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
  const proibidos = ['Nos livros', 'No material', 'Anexar', 'Comparar', 'Usar esta lista'].filter(t => pagina.texto.indexOf(t) >= 0);
  if (MODO === '--envenenado-celular-mostra-no-material') {
    conf('VENENO visto: a página do assunto do celular mostra "No material" (' + pagina.caixas + ' caixas)', proibidos.indexOf('No material') >= 0 && pagina.caixas > 0, true);
    return H.fim(amb)();
  }
  conf('o Voltar diz "Voltar à busca", e o caminho e o título são do assunto',
    pagina.voltar + '|' + /9º ano/.test(pagina.caminho) + '|' + pagina.titulo, 'Voltar à busca|true|Equação do 2º grau: como resolver');
  conf('as seções: só "Teoria e exercícios" e os Vizinhos (sem "Nos livros")', pagina.secoes, 'teoria,vizinhos');
  conf('o bloco: teoria, lista de base e exercícios', pagina.blocos, 'teoria,lista-base,exercicios');
  conf('sem "Nos livros", "No material", Anexar, Comparar nem "Usar esta lista"', proibidos.join(','), '');
  conf('nenhuma caixa de marcar, e nada que abra a tela cheia do tablet', pagina.caixas + '|' + pagina.botoesDeAbrir, '0|0');
  conf('a lista de base tem "Ver lista"', pagina.baseVerLista.trim(), 'Ver lista');
  conf('os exercícios numa coluna só', pagina.umaColuna, true);
  await printar(cel, '390x844_4_assunto.png');

  secao('7. O Ver lista, e o Voltar do Android');
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
  await voltarDoAndroid(cel);
  conf('o Voltar do Android devolve o assunto', await cel.evaluate(a => !!document.querySelector('#cel-biblioteca .cel-bib-assunto[data-assunto="' + a + '"]'), ASSUNTO), true);
  await voltarDoAndroid(cel);
  await esperar('a busca voltou', () => cel.evaluate(() => document.querySelectorAll('#cel-bib-assuntos .item-lista').length), v => v >= 1, 8000);
  conf('o seguinte devolve a busca, com o termo no campo', await cel.evaluate(() => (document.querySelector('#cel-bib-busca') || {}).value), TERMO);
  await voltarDoAndroid(cel);
  await esperar('o começo voltou', () => cel.evaluate(() => !!document.querySelector('#cel-bib-miolo .cel-bib-lista')), v => v === true, 8000);
  conf('e o seguinte, o começo com Minhas listas', await cel.evaluate(() => (document.querySelector('#cel-bib-busca') || {}).value + '|' +
    (document.querySelector('#cel-bib-miolo .cel-bib-secao') || {}).textContent), '|Minhas listas');
  await clicar(cel, '#cel-bib-miolo .cel-bib-lista[data-lista="lista-revisao"] [data-acao="ver-lista"]');
  await esperar('o Ver lista da lista dela', () => cel.evaluate(() => document.querySelectorAll('.cel-bib-ver-lista .cel-bib-ex').length), v => v >= 1, 10000);
  await miniaturaPronta(cel, 'a miniatura da lista dela');
  conf('a lista dela: Voltar às listas, o título, a página de teoria e os quatro exercícios', await cel.evaluate(() => {
    const t = document.querySelector('.cel-bib-ver-lista');
    return [t.querySelector('.bib-voltar').textContent.trim(), t.querySelector('.cel-bib-lista-titulo').textContent,
      t.querySelectorAll('.cel-bib-pagina').length, t.querySelectorAll('.cel-bib-ex').length].join('|');
  }), 'Voltar às listas|Revisão de equações para a prova|1|4');
  await pausa(1500);
  const esc390 = await escritas(cel);
  gravacoesDoCelular.push.apply(gravacoesDoCelular, esc390.gravacoes);
  conf('nenhum erro de página no celular a 390', cel.errosDePagina.join(' | '), '');

  secao('8. A trava de transbordo: 360, 390 e 412 px, letra normal e 130%');
  const transacoesDoCelular = esc390.transacoes.slice();
  for (const [w, hh] of [[360, 740], [390, 844], [412, 915]]) {
    const p = w === 390 ? cel : await amb.pagina();
    if (p !== cel) await prepararCelular(p, w, hh);
    else { await clicar(p, '#cel-abas .cel-aba[data-cel="hoje"]'); await pausa(300); }
    await zerarEscritas(p);
    await irParaBiblioteca(p);
    const telas = [
      ['começo', async () => { await marcar(p, null); await pausa(500); }],
      ['começo com a linha', async () => { await marcar(p, 'trazendo 6/15'); await esperarLinha(p, 'a linha', v => !!v); }],
      ['busca', async () => { await marcar(p, 'prontos'); await buscar(p); }],
      ['assunto', async () => { await abrirAssunto(p); await miniaturaPronta(p, 'a miniatura do assunto'); }],
      ['Ver lista', async () => { await abrirBase(p); await miniaturaPronta(p, 'a miniatura do Ver lista'); }]
    ];
    let n = 0;
    for (const [nome, ir] of telas) {
      await ir();
      n++;
      if (w === 412) {
        const arq = ['1_inicio', '2_linha_trazendo', '3_busca', '4_assunto', '5_ver_lista'][n - 1];
        await printar(p, '412x915_' + arq + '.png');
      }
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
    const esc = await escritas(p);
    gravacoesDoCelular.push.apply(gravacoesDoCelular, esc.gravacoes);
    transacoesDoCelular.push.apply(transacoesDoCelular, esc.transacoes);
    conf('nenhum erro de página a ' + w + ' px', p.errosDePagina.join(' | '), '');
    if (p !== cel) await p.close();
  }

  secao('9. Só lê: o banco igual byte a byte, nenhuma gravação');
  await pausa(1000);
  const banco1 = await retratoDoBanco(cel);
  const local1 = await retratoDoLocal(cel);
  const mudaram = Object.keys(Object.assign({}, banco0.por, banco1.por)).filter(n => banco0.por[n] !== banco1.por[n]);
  if (MODO === '--envenenado-celular-grava-ao-navegar') {
    conf('VENENO visto: andar pelas telas da Biblioteca chamou a gravação no celular (' + gravacoesDoCelular.slice(0, 3).join(', ') + ')',
      gravacoesDoCelular.length > 0 || mudaram.length > 0, true);
    return H.fim(amb)();
  }
  conf('nenhuma chamada de gravação ao Store em nenhuma tela', gravacoesDoCelular.join(','), '');
  conf('nenhuma transação de escrita no IndexedDB', transacoesDoCelular.join(' ; '), '');
  conf('o IndexedDB inteiro ficou igual byte a byte (' + banco1.depositos + ' depósitos, ' + banco1.registros + ' registros)',
    banco1.tudo + '|' + mudaram.join(','), banco0.tudo + '|');
  conf('o localStorage ficou igual', local1 === local0, true);

  secao('10. O nome de verdade em lugar nenhum');
  conf('o nome de verdade não aparece no celular, e "' + NOME_TESTE + '" está no lugar dele', await cel.evaluate((n, t) =>
    document.documentElement.outerHTML.indexOf(n) < 0 && document.documentElement.outerHTML.indexOf(t) >= 0, NOME_REAL, NOME_TESTE), true);
  conf('nenhum erro de página', cel.errosDePagina.join(' | '), '');
  return H.fim(amb)();
})().catch(H.fim(amb));
