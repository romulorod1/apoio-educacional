/* testa_celular_pdf.js
 *
 * 12b, parte A3: o PDF da lista no celular (desenho aprovado em 15/11/2026,
 * decisões de 16/11). Sem opção nenhuma, o padrão do tablet: a lista (com a
 * teoria, se a lista tiver) e o gabarito em arquivo separado, que é dela. O
 * botão PDF fica no cartão de Minhas listas, na lista de base da página do
 * assunto e preso no pé do Ver lista ("PDF da lista"). A montagem é a mesma
 * do tablet (gerarEAnexar), com a opção explícita op.soLer: sem o material
 * marcado (o carrinho), sem o registro de uso, sem anexo e sem gravar lista.
 * O resultado abre na janela PDF pronto, com o jeito do celular: Compartilhar
 * na linha inteira (em destaque só na lista) e Baixar e Ver na linha de baixo,
 * com o nome escrito; a frase do alto diz "celular".
 *
 * No Chrome de verdade, sem nuvem, como a testa_celular_biblioteca (o modo
 * celular vem do tamanho da tela; o pacote SINTÉTICO é importado no tablet do
 * mesmo perfil). Aluno e listas sintéticos. O navigator.share é falso e guarda
 * os arquivos que recebe. O nome no alto do index.html é trocado por
 * "Professora Teste" no que o servidor entrega, e a prova confere que o nome
 * de verdade não aparece.
 *
 * O que se prova:
 *   1. o botão PDF no cartão, na lista de base e no pé do Ver lista;
 *   2. ele segue a regra do cartão: apagado enquanto os exercícios chegam
 *      (com o motivo do cartão ligado ao botão), apagado na lista vazia, e
 *      apagado também na lista que abre só com o que veio (o PDF nunca sai
 *      pela metade);
 *   3. o PDF sai: dois arquivos, a lista (com a teoria) e o gabarito à parte,
 *      com nomes que dizem o que são; o compartilhar da lista recebe SÓ a
 *      lista, e o do gabarito, só o gabarito: dois arquivos no total, dois
 *      PDFs de verdade; baixar baixa o arquivo do botão; ver abre o leitor;
 *   4. a janela PDF pronto do celular: a frase diz "celular", Compartilhar
 *      ocupa a linha inteira sem nada cortado, Baixar e Ver dividem a linha de
 *      baixo, com o nome escrito; fechada, solta os PDFs;
 *   5. SÓ LÊ: o IndexedDB inteiro igual byte a byte antes e depois de gerar,
 *      compartilhar, baixar e ver, nenhuma chamada de gravação ao Store,
 *      nenhuma transação de escrita e o localStorage igual;
 *   6. a memória: uma lista de 20 exercícios e 2 páginas de teoria, com o
 *      processador 4 vezes mais lento; o pico do heap pelas métricas do CDP,
 *      um recorte desenhado por vez, e o heap de volta depois de fechar;
 *   7. a trava de transbordo a 360, 390 e 412 px, com a letra normal e a
 *      130%, no começo, no assunto, no Ver lista e na janela PDF pronto;
 *   8. nenhum erro de página, e o nome de verdade em lugar nenhum.
 *
 * Venenos (a prova TEM de ver o defeito e passa dizendo que viu):
 *   --envenenado-pdf-grava-no-celular   o PDF do celular volta a passar pelo
 *                         material marcado (usarMinhaLista, o carrinho), e o
 *                         localStorage ou o Store mudam (5 vê);
 *   --envenenado-pdf-sem-gabarito-separado  o celular junta o gabarito à lista
 *                         num PDF só (3 vê);
 *   --envenenado-pdf-pronto-tres-numa-linha  os três botões do celular voltam
 *                         a uma linha só, e o Compartilhar não ocupa a linha
 *                         nem cabe inteiro (4 vê).
 *
 *   --prints <pasta>   o cartão com o PDF, o Ver lista com o pé e a janela PDF
 *                      pronto, a 390 x 844 e a 412 x 915.
 *
 * Porta: 9132 (o app). Nenhum emulador.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 9132;
const PRINTS = (() => { const i = process.argv.indexOf('--prints'); return i >= 0 ? process.argv[i + 1] : ''; })();
if (PRINTS) fs.mkdirSync(PRINTS, { recursive: true });

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const CSS = fs.readFileSync(path.join(H.RAIZ, 'styles.css'), 'utf8').replace(/\r\n/g, '\n');
const INDEX = fs.readFileSync(path.join(H.RAIZ, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
// o nome do alto do index.html: lido daqui, nunca escrito na prova
const NOME_REAL = ((/<header class="cabecalho">[\s\S]*?<strong>([^<]+)<\/strong>/.exec(INDEX)) || [])[1] || '';
const NOME_TESTE = 'Professora Teste';

// cada veneno: [arquivo, [[âncora, troca], ...]]
const VENENOS = {
  '--envenenado-pdf-grava-no-celular': ['/app.js', [[
    '    // o celular não passa pelo material marcado nem pelo registro de uso: só monta o PDF\n',
    '    if (m.lista) usarMinhaLista(m.lista);\n']]],
  '--envenenado-pdf-sem-gabarito-separado': ['/app.js', [[
    '      var separa = !!(op.lista && op.gabarito && usaItens.length);\n',
    '      var separa = !op.soLer && !!(op.lista && op.gabarito && usaItens.length);\n']]],
  '--envenenado-pdf-pronto-tres-numa-linha': ['/styles.css', [
    ['.bib-pdf-acoes-celular { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));',
      '.bib-pdf-acoes-celular { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));'],
    ['.bib-pdf-acoes-celular [data-acao="compartilhar"] { grid-column: 1 / -1; }\n', '']]]
};
const MODO = Object.keys(VENENOS).filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && !VENENOS[a]);
const servidos = { '/app.js': APP, '/styles.css': CSS };
if (MODO) {
  const [arq, trocasDoVeneno] = VENENOS[MODO];
  trocasDoVeneno.forEach(([a, b]) => { servidos[arq] = servidos[arq].split(a).join(b); });
}
const trocas = { '/index.html': NOME_REAL ? INDEX.split(NOME_REAL).join(NOME_TESTE) : INDEX, '/app.js': servidos['/app.js'], '/styles.css': servidos['/styles.css'] };
const amb = H.criarAmbiente(PORTA, 'perfil_celular_pdf', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'celular_pdf_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

const ASSUNTO = 'MAT09-04';
const TERMO = 'equação';
const LETRA_130 = 'html{font-size:130%}';
const GRANDE_N = 20;

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
async function semear() {
  const tab = await novaPagina(null);
  await tab.setViewport({ width: 1280, height: 800 });
  await H.abrirApp(tab, amb.ORIGEM);
  const zip = path.join(TMP, 'portal.zip');
  Sintetico.gerar(zip, { listas: true, base: true });
  await H.irParaAba(tab, 'ajustes');
  await (await tab.$('#arquivo-biblioteca')).uploadFile(zip);
  const imp = (await esperar('a importação', () => tab.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca'); return c ? c.innerText.trim() : '';
  }), v => /^Biblioteca importada\.|não foi importado/.test(v || ''), 90000)).valor || '';
  const r = await tab.evaluate(async n => {
    const d = Store.bancoVazio();
    d.alunos = [{ id: 'alfa', nome: 'Aluno Alfa Teste', ativo: true, cor: '#1F3A5F', precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 100 }], mapeamentos: [] }];
    d.aulas = [{ id: 'x1', alunoId: 'alfa', serieId: null, data: '2026-11-10', hora: '14:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [], temNota: false }];
    await Store.salvar(d);
    const itens = (await Store.itensDaBiblioteca()).filter(i => /^9ano:equacoes-do-segundo-grau:/.test(i.id)).map(i => i.id).sort();
    const teoria = (await Store.teoriaDaBiblioteca()).filter(t => /^9ano:equacoes-do-segundo-grau/.test(t.id));
    const paginas = [];
    teoria.forEach(t => t.paginas.forEach(p => { if (!p.capa) paginas.push(p.id); }));
    const lista = (id, titulo, nivel, ids, pags, quando) => Store.gravarListaBiblioteca({ id, titulo, nivel, itens: ids, paginas: pags, origem: null,
      automatica: false, criadaEm: quando, editadaEm: quando });
    await lista('lista-revisao', 'Revisão de equações para a prova', 'regular', itens.slice(0, 4), paginas.slice(0, 1), 1700000004000);
    await lista('lista-desafio', 'Equação do 2º grau, desafio', 'aprofundamento', [itens[4], '7ano:modulo-que-chega-depois:lista:ex:1'], [], 1700000003000);
    await lista('lista-area', 'Área de figuras planas', null, ['8ano:area-que-chega-depois:lista:ex:1'], [], 1700000002000);
    await lista('lista-grande', 'Lista grande de equações', 'regular', itens.slice(0, n), paginas.slice(0, 2), 1700000001000);
    return { itens: itens.length, paginas: paginas.length, listas: (await Store.listasDaBiblioteca()).length };
  }, GRANDE_N);
  await tab.close();
  return Object.assign(r, { importou: /^Biblioteca importada\./.test(imp) });
}
async function prepararCelular(pag, largura, altura) {
  await pag.setViewport({ width: largura, height: altura, hasTouch: true, isMobile: true });
  await pag.evaluateOnNewDocument(() => {
    window.__transacoes = [];
    const t0 = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (nomes, modo) {
      if (modo === 'readwrite' && this.name === 'apoio-educacional') window.__transacoes.push([].concat(nomes).map(String).sort().join('+'));
      return t0.apply(this, arguments);
    };
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
    // o compartilhar falso: guarda cada envio, com os arquivos
    window.__compartilhados = [];
    Object.defineProperty(Navigator.prototype, 'share', { configurable: true, writable: true, value: function (d) {
      window.__compartilhados.push({ titulo: d && d.title, arquivos: ((d && d.files) || []).slice() });
      return Promise.resolve();
    } });
    Object.defineProperty(Navigator.prototype, 'canShare', { configurable: true, writable: true, value: function (d) { return !!(d && d.files && d.files.length); } });
    // o baixar: o nome e o arquivo, sem baixar de verdade
    window.__baixados = [];
    const clique = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.hasAttribute('download')) { window.__baixados.push({ nome: this.getAttribute('download'), href: this.href }); return; }
      return clique.apply(this, arguments);
    };
    window.__avisos = [];
    document.addEventListener('DOMContentLoaded', () => {
      const t = document.querySelector('#aviso-texto');
      if (t) new MutationObserver(() => window.__avisos.push(t.textContent)).observe(t, { childList: true, characterData: true, subtree: true });
    });
  });
  await pag.goto(amb.ORIGEM + '/index.html', { waitUntil: 'networkidle0' });
  const ok = await esperar('o celular abriu', () => pag.evaluate(() => document.body.classList.contains('modo-celular') &&
    !!document.querySelector('#cel-abas') && !document.querySelector('#cel-abas').hidden && typeof Store === 'object' && typeof PDFGen === 'object'), v => v === true, 30000);
  if (!ok.ok) throw Object.assign(new Error('o celular não abriu: ' + (pag.errosDePagina || []).join(' | ')), { jaContado: false });
  await pag.evaluate(() => { const b = document.querySelector('#entendi-novidades'); if (b && document.querySelector('#modal-novidades.aberto')) b.click(); });
  // os espiões da montagem: as partes que o compositor recebe, e quantos recortes desenham juntos
  await pag.evaluate(() => {
    window.__geracoes = [];
    const g = PDFGen.gerarMaterialBiblioteca;
    PDFGen.gerarMaterialBiblioteca = function (op) {
      window.__geracoes.push({ lista: !!op.incluirLista, gabarito: !!op.incluirGabarito, teoria: !!op.incluirTeoria,
        itens: (op.itens || []).length, paginas: (op.teoria || []).length, titulo: op.titulo });
      return g.apply(this, arguments);
    };
    window.__juntos = 0; window.__maxJuntos = 0; window.__desenhos = 0;
    ['rasterizarRecorte', 'rasterizarPagina'].forEach(nome => {
      const f = Biblioteca[nome];
      Biblioteca[nome] = function () {
        window.__juntos++; window.__desenhos++;
        window.__maxJuntos = Math.max(window.__maxJuntos, window.__juntos);
        return Promise.resolve(f.apply(this, arguments)).then(r => { window.__juntos--; return r; }, e => { window.__juntos--; throw e; });
      };
    });
  });
  await pausa(600);
}
async function celular(w, h) {
  const p = await novaPagina(null);
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

async function irParaBiblioteca(pag) {
  await clicar(pag, '#cel-abas .cel-aba[data-cel="hoje"]');
  await pausa(200);
  await clicar(pag, '#cel-abas .cel-aba[data-cel="biblioteca"]');
  return (await esperar('Minhas listas no celular', () => pag.evaluate(() => document.querySelectorAll('#cel-biblioteca.ativa .cel-bib-lista').length),
    v => v >= 4, 20000)).ok;
}
// o PDF de cada cartão: se está apagado e o motivo ligado a ele
const pdfsDosCartoes = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#cel-bib-miolo .cel-bib-lista')).map(c => {
  const b = c.querySelector('[data-acao="pdf"]');
  const ver = c.querySelector('[data-acao="ver-lista"]');
  const motivo = b && b.getAttribute('aria-describedby') ? document.getElementById(b.getAttribute('aria-describedby')) : null;
  return { id: c.dataset.lista, tem: !!b, texto: b ? b.textContent.trim() : '', apagado: !!(b && b.disabled), verApagado: !!(ver && ver.disabled),
    motivo: motivo ? motivo.textContent.trim() : '', linhaDoCartao: ((c.querySelector('.cel-bib-lista-motivo') || {}).textContent || '') };
}));
const porId = (cs, id) => cs.filter(c => c.id === id)[0] || {};
async function buscarEAbrirAssunto(pag) {
  await digitar(pag, '#cel-bib-busca', TERMO);
  await esperar('o resultado da busca', () => pag.evaluate(() => document.querySelectorAll('#cel-bib-assuntos .item-lista').length), v => v >= 1, 20000);
  await clicar(pag, '#cel-bib-assuntos .item-lista[data-assunto="' + ASSUNTO + '"]');
  return (await esperar('a página do assunto', () => pag.evaluate(() => !!document.querySelector('#cel-biblioteca .cel-bib-assunto .bte-lista-acoes')),
    v => v === true, 20000)).ok;
}
async function abrirVerLista(pag, id) {
  await clicar(pag, '#cel-bib-miolo .cel-bib-lista[data-lista="' + id + '"] [data-acao="ver-lista"]');
  return (await esperar('o Ver lista de ' + id, () => pag.evaluate(() => !!document.querySelector('#cel-biblioteca .cel-bib-ver-lista #cel-bib-pe-pdf')),
    v => v === true, 20000)).ok;
}
const janelaAberta = pag => pag.evaluate(() => document.querySelector('#modal-bib-compartilhar').classList.contains('aberto'));
async function esperarJanela(pag, rotulo, limite) {
  return (await esperar(rotulo || 'a janela PDF pronto', () => pag.evaluate(() =>
    document.querySelector('#modal-bib-compartilhar').classList.contains('aberto') ? document.querySelectorAll('#modal-bib-compartilhar .bib-pdf-item').length : 0),
  v => v >= 1, limite || 60000)).ok;
}
async function fecharJanela(pag) {
  await pag.evaluate(() => { const b = document.querySelector('#modal-bib-compartilhar [data-fechar], #modal-bib-compartilhar .modal-fechar'); if (b) b.click(); });
  await esperar('a janela fechou', () => janelaAberta(pag), v => v === false, 5000);
  await pausa(300);
}
const janela = pag => pag.evaluate(() => {
  const m = document.querySelector('#modal-bib-compartilhar');
  return {
    ajuda: (m.querySelector('#bib-pdf-ajuda') || {}).textContent || '',
    itens: Array.from(m.querySelectorAll('.bib-pdf-item')).map(i => ({
      parte: i.dataset.parte, nome: i.querySelector('.bib-compartilhar-nome').textContent,
      botoes: Array.from(i.querySelectorAll('.bib-pdf-acao')).map(b => ({ acao: b.dataset.acao, texto: b.textContent.trim(), principal: b.classList.contains('principal') }))
    }))
  };
});
/* O jeito do celular, pela geometria: Compartilhar na linha inteira, Baixar e
 * Ver juntos na linha de baixo, cada um com a metade, e nenhum texto cortado. */
const geometriaDaJanela = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#modal-bib-compartilhar .bib-pdf-item')).map(i => {
  const caixa = i.querySelector('.bib-pdf-acoes').getBoundingClientRect();
  const r = a => { const b = i.querySelector('[data-acao="' + a + '"]'); return b ? Object.assign(b.getBoundingClientRect().toJSON(), { cortado: b.scrollWidth > b.clientWidth + 1 || b.scrollHeight > b.clientHeight + 1 }) : null; };
  const c = r('compartilhar'), bx = r('baixar'), v = r('ver');
  const perto = (x, y) => Math.abs(x - y) <= 2;
  return {
    parte: i.dataset.parte,
    compartilharNaLinhaInteira: !!c && perto(c.left, caixa.left) && perto(c.right, caixa.right),
    baixarEVerNaLinhaDeBaixo: !!c && !!bx && !!v && perto(bx.top, v.top) && bx.top >= c.bottom - 1 && perto(bx.left, caixa.left) && perto(v.right, caixa.right) && Math.abs(bx.width - v.width) <= 2,
    nadaCortado: [c, bx, v].every(x => x && !x.cortado),
    dentroDaTela: [c, bx, v].every(x => x && x.right <= window.innerWidth + 1 && x.left >= -1)
  };
}));

/* Nada passa da borda nem rola de lado dentro do celular (e da janela, quando aberta). */
const varrer = pag => pag.evaluate(() => {
  const largura = window.innerWidth;
  const ruins = [];
  const nome = e => (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).join('.') : '') || e.tagName;
  const janelaAberta = document.querySelector('#modal-bib-compartilhar.aberto');
  const sel = '#cel-conteudo, #cel-conteudo *' + (janelaAberta ? ', #modal-bib-compartilhar .modal, #modal-bib-compartilhar .modal *' : '');
  document.querySelectorAll(sel).forEach(e => {
    const r = e.getBoundingClientRect();
    if (!r.width && !r.height) return;
    if (r.right > largura + 1) ruins.push('passa da borda: ' + nome(e) + ' ' + Math.round(r.right - largura) + ' px');
    if (e.tagName !== 'INPUT' && e.tagName !== 'IMG' && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== 'visible') {
      ruins.push('rola de lado: ' + nome(e) + ' ' + (e.scrollWidth - e.clientWidth) + ' px');
    }
    if (e.tagName === 'BUTTON' && e.scrollWidth > e.clientWidth + 1) ruins.push('texto passa do botão: ' + e.textContent.trim().slice(0, 40));
  });
  const pagina = document.scrollingElement.scrollWidth > document.scrollingElement.clientWidth + 1;
  return { ruins: ruins.slice(0, 6), total: ruins.length, paginaRolaDeLado: pagina, janela: !!janelaAberta };
});

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
// os envios do compartilhar falso: o nome, o tipo, o tamanho e se começa por %PDF-
const compartilhados = pag => pag.evaluate(async () => {
  const saida = [];
  for (const c of window.__compartilhados) {
    const arquivos = [];
    for (const f of c.arquivos) {
      const cabeca = new TextDecoder('latin1').decode(await f.slice(0, 5).arrayBuffer());
      arquivos.push({ nome: f.name, tipo: f.type, tamanho: f.size, pdf: cabeca === '%PDF-' });
    }
    saida.push({ titulo: c.titulo, arquivos });
  }
  return saida;
});

async function printar(pag, nome) {
  if (!PRINTS) return;
  await pausa(500);
  await pag.screenshot({ path: path.join(PRINTS, nome) });
  console.log('   print: ' + nome);
}

(async () => {
  secao('0. A prova se confere');
  conf('nenhum veneno desconhecido foi pedido', desconhecidos.join(','), '');
  for (const m of Object.keys(VENENOS)) {
    const fonte = VENENOS[m][0] === '/app.js' ? APP : CSS;
    VENENOS[m][1].forEach(([a], k) => conf('a âncora ' + (k + 1) + ' de ' + m + ' aparece uma vez só em ' + VENENOS[m][0], fonte.split(a).length - 1, 1));
  }
  if (MODO) conf('o veneno ' + MODO + ' foi aplicado', servidos[VENENOS[MODO][0]] !== (VENENOS[MODO][0] === '/app.js' ? APP : CSS), true);
  conf('o nome do alto do index.html foi achado, e o servidor entrega "' + NOME_TESTE + '" no lugar dele',
    !!NOME_REAL && trocas['/index.html'].indexOf(NOME_REAL) < 0 && trocas['/index.html'].indexOf(NOME_TESTE) >= 0, true);
  if (H.placar.falhas) return H.fim(amb)();

  await amb.subir();

  secao('1. O perfil: o pacote sintético, o aluno e quatro listas');
  const s = await semear();
  conf('o pacote, a revisão (4 e 1 página), a do desafio (1 a caminho), a de área (nada aqui) e a grande (' + GRANDE_N + ' e 2 páginas)',
    s.importou && s.itens >= GRANDE_N && s.paginas >= 2 && s.listas === 4, true);

  secao('2. O celular a 390 x 844: o PDF no cartão, e a regra do cartão');
  const cel = await celular(390, 844);
  conf('o celular está no modo celular, a 390 px', await cel.evaluate(() => document.body.classList.contains('modo-celular') && window.innerWidth === 390), true);
  await pausa(1500);
  const banco0 = await retratoDoBanco(cel);
  const local0 = await retratoDoLocal(cel);
  console.log('   o banco do celular: ' + banco0.depositos + ' depósitos, ' + banco0.registros + ' registros');
  await cel.evaluate(() => { window.__gravacoes = []; window.__transacoes = []; });
  conf('a aba Biblioteca abriu com os quatro cartões', await irParaBiblioteca(cel), true);

  await marcar(cel, 'trazendo 6/15');
  await pausa(500);
  let ps = await pdfsDosCartoes(cel);
  conf('cada cartão tem o botão PDF, com o nome escrito', ps.map(p => p.tem + ':' + p.texto).join(','), ps.map(() => 'true:PDF').join(','));
  conf('o botão PDF do cartão tem o ícone do documento, e não o de compartilhar (o toque monta o PDF e abre a janela)', await cel.evaluate(() =>
    Array.from(document.querySelectorAll('#cel-bib-miolo [data-acao="pdf"] svg')).map(s => s.getAttribute('data-icone-nome')).filter((x, i, a) => a.indexOf(x) === i).join(',')), 'folha');
  conf('trazendo: o PDF da lista completa aceso; o da que espera exercício e o da vazia apagados, como o Ver lista',
    ['lista-revisao', 'lista-desafio', 'lista-area', 'lista-grande'].map(id => porId(ps, id).apagado + '/' + porId(ps, id).verApagado).join(','),
    'false/false,true/true,true/true,false/false');
  conf('trazendo: o PDF apagado aponta para o motivo do cartão', [porId(ps, 'lista-desafio').motivo, porId(ps, 'lista-area').motivo].join(' | '),
    ['Os exercícios estão chegando.', 'Os exercícios estão chegando.'].join(' | '));
  await printar(cel, '390x844_0_cartoes_trazendo.png');
  await clicar(cel, '#cel-bib-miolo .cel-bib-lista[data-lista="lista-desafio"] [data-acao="pdf"]');
  await pausa(800);
  conf('o PDF apagado não monta nada', [await janelaAberta(cel), await cel.evaluate(() => window.__geracoes.length)].join('|'), 'false|0');

  await marcar(cel, 'faltam');
  await pausa(500);
  ps = await pdfsDosCartoes(cel);
  conf('faltam: a lista do desafio abre (Ver lista aceso), mas o PDF fica apagado, com o mesmo motivo: nunca pela metade',
    [porId(ps, 'lista-desafio').verApagado, porId(ps, 'lista-desafio').apagado, porId(ps, 'lista-desafio').motivo].join('|'),
    'false|true|Alguns exercícios ainda não chegaram.');
  conf('(arranjo) o motivo ligado ao PDF é a mesma linha curta do cartão', porId(ps, 'lista-desafio').motivo, porId(ps, 'lista-desafio').linhaDoCartao);
  conf('(arranjo) o Ver lista da do desafio abriu', await abrirVerLista(cel, 'lista-desafio'), true);
  conf('faltam: no Ver lista da do desafio, o "PDF da lista" do pé também fica apagado, com a nota do resto', await cel.evaluate(() => {
    const b = document.querySelector('#cel-bib-pdf-lista');
    return [b.textContent.trim(), b.disabled, b.getAttribute('aria-describedby'), (document.querySelector('#cel-bib-lista-nota') || {}).textContent].join('|');
  }), 'PDF da lista|true|cel-bib-lista-nota|Alguns exercícios ainda não chegaram.');
  await clicar(cel, '.cel-bib-ver-lista .bib-voltar');
  await pausa(600);

  secao('3. O PDF da lista dela: a lista e o gabarito à parte, e o compartilhar');
  await marcar(cel, 'prontos');
  await pausa(500);
  await printar(cel, '390x844_1_cartao_pdf.png');
  await clicar(cel, '#cel-bib-miolo .cel-bib-lista[data-lista="lista-revisao"] [data-acao="pdf"]');
  const abriu1 = await esperarJanela(cel);
  if (MODO === '--envenenado-pdf-grava-no-celular') {
    const e0 = await escritas(cel), l0 = await retratoDoLocal(cel);
    conf('VENENO visto: o PDF do celular passou pelo material marcado (gravações: ' + (e0.gravacoes.slice(0, 3).join(', ') || 'nenhuma') +
      '; localStorage ' + (l0 === local0 ? 'igual' : 'mudou') + ')', e0.gravacoes.length > 0 || e0.transacoes.length > 0 || l0 !== local0, true);
    return H.fim(amb)();
  }
  conf('a janela PDF pronto abriu', abriu1, true);
  const j1 = await janela(cel);
  const ger1 = await cel.evaluate(() => window.__geracoes.slice());
  if (MODO === '--envenenado-pdf-sem-gabarito-separado') {
    conf('VENENO visto: o celular juntou o gabarito à lista (' + j1.itens.map(i => i.nome).join(', ') + ')',
      j1.itens.length !== 2 || ger1.some(g => g.lista && g.gabarito), true);
    return H.fim(amb)();
  }
  conf('dois arquivos, a lista e o gabarito, com nomes diferentes que começam pelo que são ("Lista" e "Gabarito", como no Drive)', j1.itens.map(i => i.parte + '=' + i.nome).join(' | '),
    'lista=Lista_Revisao_de_equacoes_para_a_prova.pdf | gabarito=Gabarito_Revisao_de_equacoes_para_a_prova.pdf');
  conf('o gabarito à parte: a lista sai com a teoria e sem o gabarito; o gabarito sai sem a lista e sem a teoria',
    ger1.map(g => [g.lista, g.gabarito, g.teoria, g.itens, g.paginas].join('/')).join(' ; '), 'true/false/true/4/1 ; false/true/false/4/0');
  conf('o título do PDF é o nome da lista', ger1.map(g => g.titulo).join(' | '), 'Revisão de equações para a prova | Revisão de equações para a prova');
  conf('a frase do alto diz "celular", e não "tablet"', j1.ajuda, 'Mande a lista ao aluno e guarde o gabarito no celular.');
  conf('cada arquivo com Compartilhar, Baixar e Ver, com o nome escrito; Compartilhar em destaque só na lista',
    j1.itens.map(i => i.botoes.map(b => b.acao + ':' + b.texto + (b.principal ? '*' : '')).join(',')).join(' | '),
    'compartilhar:Compartilhar*,baixar:Baixar,ver:Ver | compartilhar:Compartilhar o gabarito,baixar:Baixar,ver:Ver');
  conf('nada fala em imprimir', /imprim/i.test(await textoDa(cel, '#modal-bib-compartilhar')), false);
  conf('o gabarito diz que é só dela, com a linha calma, e a lista não leva nada disso', await cel.evaluate(() => {
    const g = document.querySelector('#modal-bib-compartilhar .bib-pdf-item[data-parte="gabarito"]');
    const l = document.querySelector('#modal-bib-compartilhar .bib-pdf-item[data-parte="lista"]');
    return [(g.querySelector('.bib-pdf-so-voce') || {}).textContent, (g.querySelector('.bib-pdf-aviso-gabarito') || {}).textContent,
      !!l.querySelector('.bib-pdf-so-voce, .bib-pdf-aviso-gabarito'), g.querySelector('[data-acao="compartilhar"]').classList.contains('principal')].join('|');
  }), 'Gabarito: só para você|Não envie ao aluno.|false|false');
  conf('o nome do arquivo quebra nos sublinhados: a última linha nunca fica só com o "pdf"', await cel.evaluate(() =>
    Array.from(document.querySelectorAll('#modal-bib-compartilhar .bib-compartilhar-nome')).map(n => {
      const r = document.createRange();
      const ultimo = n.lastChild;
      r.setStart(ultimo, Math.max(0, ultimo.textContent.length - 3)); r.setEnd(ultimo, ultimo.textContent.length);
      const fim = r.getBoundingClientRect();
      const linhas = Array.from(n.getClientRects ? (() => { const t = document.createRange(); t.selectNodeContents(n); return t.getClientRects(); })() : []);
      const daUltima = linhas.filter(x => Math.abs(x.top - fim.top) < 2);
      const largura = daUltima.reduce((m, x) => Math.max(m, x.right), 0) - daUltima.reduce((m, x) => Math.min(m, x.left), 1e9);
      return n.querySelectorAll("wbr").length > 0 && largura > fim.width * 1.5;
    }).join(',')), 'true,true');
  const g1 = await geometriaDaJanela(cel);
  await printar(cel, '390x844_3_pdf_pronto.png');
  if (MODO === '--envenenado-pdf-pronto-tres-numa-linha') {
    conf('VENENO visto: os três botões numa linha só (' + JSON.stringify(g1[0]) + ')',
      g1.some(g => !g.compartilharNaLinhaInteira || !g.baixarEVerNaLinhaDeBaixo || !g.nadaCortado), true);
    return H.fim(amb)();
  }
  conf('o jeito do celular, nos dois arquivos: Compartilhar na linha inteira, Baixar e Ver dividindo a linha de baixo, nada cortado, tudo na tela',
    g1.map(g => [g.parte, g.compartilharNaLinhaInteira, g.baixarEVerNaLinhaDeBaixo, g.nadaCortado, g.dentroDaTela].join('/')).join(' | '),
    'lista/true/true/true/true | gabarito/true/true/true/true');
  await clicar(cel, '#bib-pdf-compartilhar-lista');
  await pausa(500);
  await clicar(cel, '#bib-pdf-compartilhar-gabarito');
  await pausa(500);
  const env = await compartilhados(cel);
  conf('o compartilhar da lista recebe só a lista; o do gabarito, só o gabarito',
    env.map(e => e.arquivos.map(a => a.nome).join('+')).join(' | '),
    'Lista_Revisao_de_equacoes_para_a_prova.pdf | Gabarito_Revisao_de_equacoes_para_a_prova.pdf');
  conf('o título de cada envio começa pelo que ele é, e os dois são diferentes', env.map(e => e.titulo).join(' | '),
    'Lista, Revisão de equações para a prova | Gabarito, Revisão de equações para a prova');
  const todos = [].concat(...env.map(e => e.arquivos));
  conf('dois arquivos no total, os dois PDFs de verdade (application/pdf, começam por %PDF-, com conteúdo), e diferentes',
    [todos.length, todos.every(a => a.tipo === 'application/pdf' && a.pdf && a.tamanho > 1000), new Set(todos.map(a => a.nome)).size].join('|'), '2|true|2');
  console.log('   os tamanhos: ' + todos.map(a => a.nome + ' ' + Math.round(a.tamanho / 1024) + ' KB').join(', '));
  await clicar(cel, '#bib-pdf-baixar-gabarito');
  await pausa(300);
  conf('baixar baixa o arquivo do botão', await cel.evaluate(() => window.__baixados.map(b => b.nome).join(',')), 'Gabarito_Revisao_de_equacoes_para_a_prova.pdf');
  await clicar(cel, '#bib-pdf-ver-lista');
  const leitor = await esperar('o leitor abriu', () => cel.evaluate(() => document.querySelector('#modal-leitor-pdf').classList.contains('aberto')), v => v === true, 15000);
  conf('ver abre o leitor do aplicativo, com a janela embaixo', leitor.ok && await janelaAberta(cel), true);
  await cel.evaluate(() => history.back());
  await esperar('o leitor fechou', () => cel.evaluate(() => document.querySelector('#modal-leitor-pdf').classList.contains('aberto')), v => v === false, 10000);
  await pausa(400);
  conf('o Voltar fecha o leitor, e a janela PDF pronto continua', await janelaAberta(cel), true);
  await fecharJanela(cel);
  conf('fechada, a janela solta os PDFs (o corpo vazio, sem os botões)', await cel.evaluate(() =>
    document.querySelector('#corpo-modal-bib-compartilhar').childElementCount + '|' + document.querySelectorAll('.bib-pdf-acao').length), '0|0');

  secao('4. O PDF da lista de base, na página do assunto');
  conf('(arranjo) a página do assunto abriu', await buscarEAbrirAssunto(cel), true);
  conf('a lista de base tem Ver lista e PDF, e nada de "Usar esta lista"', await cel.evaluate(() =>
    Array.from(document.querySelectorAll('.cel-bib-assunto .bte-lista-acoes button')).map(b => b.textContent.trim()).join(',')), 'Ver lista,PDF');
  await cel.evaluate(() => { window.__geracoes = []; window.__compartilhados = []; });
  await clicar(cel, '.cel-bib-assunto .bte-lista-pdf');
  conf('a janela PDF pronto abriu com a lista de base', await esperarJanela(cel), true);
  const j2 = await janela(cel);
  conf('a lista de base: a lista e o gabarito à parte, os nomes começando por "Lista" e "Gabarito" e com "de base"',
    j2.itens.map(i => i.parte + '=' + (i.parte === 'lista' ? /^Lista_.*_de_base\.pdf$/ : /^Gabarito_.*_de_base\.pdf$/).test(i.nome)).join(' | '), 'lista=true | gabarito=true');
  conf('a lista de base: sem teoria, a lista e o gabarito separados', (await cel.evaluate(() => window.__geracoes.map(g => [g.lista, g.gabarito, g.teoria].join('/')))).join(' ; '),
    'true/false/false ; false/true/false');
  await fecharJanela(cel);

  secao('5. O "PDF da lista" preso no pé do Ver lista');
  await clicar(cel, '.cel-bib-assunto .bib-voltar');
  await pausa(500);
  await clicar(cel, '#cel-bib-limpar');
  await esperar('Minhas listas de novo', () => cel.evaluate(() => document.querySelectorAll('#cel-bib-miolo .cel-bib-lista').length), v => v >= 4, 10000);
  conf('(arranjo) o Ver lista da revisão abriu', await abrirVerLista(cel, 'lista-revisao'), true);
  await pausa(800);
  const pe = await cel.evaluate(() => {
    const p = document.querySelector('#cel-bib-pe-pdf'), c = document.querySelector('#cel-conteudo');
    const b = p.querySelector('button');
    const rp = p.getBoundingClientRect(), rc = c.getBoundingClientRect();
    return { sticky: getComputedStyle(p).position, rente: Math.abs(rp.bottom - rc.bottom) <= 2, rola: c.scrollHeight > c.clientHeight,
      texto: b.textContent.trim(), aceso: !b.disabled, largura: Math.abs(b.getBoundingClientRect().width - (rc.width - 32)) <= 2 };
  });
  conf('o pé fica preso rente ao fim da área que rola, com "PDF da lista" aceso na linha inteira',
    [pe.sticky, pe.rola, pe.rente, pe.texto, pe.aceso, pe.largura].join('|'), 'sticky|true|true|PDF da lista|true|true');
  await printar(cel, '390x844_2_ver_lista_pe.png');
  await cel.evaluate(() => { const c = document.querySelector('#cel-conteudo'); c.scrollTop = c.scrollHeight; });
  await pausa(300);
  conf('rolando até o fim, o último exercício fica inteiro acima do pé', await cel.evaluate(() => {
    const ex = Array.from(document.querySelectorAll('.cel-bib-ver-lista .cel-bib-ex'));
    const ultimo = ex[ex.length - 1].getBoundingClientRect(), pe = document.querySelector('#cel-bib-pe-pdf').getBoundingClientRect();
    return ultimo.bottom <= pe.top + 1 && ultimo.top >= document.querySelector('#cel-conteudo').getBoundingClientRect().top - 1;
  }), true);
  await cel.evaluate(() => { const c = document.querySelector('#cel-conteudo'); c.scrollTop = c.scrollHeight / 2; });
  await pausa(300);
  conf('rolando até o meio, o pé continua rente ao fim', await cel.evaluate(() =>
    Math.abs(document.querySelector('#cel-bib-pe-pdf').getBoundingClientRect().bottom - document.querySelector('#cel-conteudo').getBoundingClientRect().bottom) <= 2), true);
  await cel.evaluate(() => { window.__geracoes = []; window.__compartilhados = []; });
  await clicar(cel, '#cel-bib-pdf-lista');
  conf('o "PDF da lista" abre a janela PDF pronto com os dois arquivos', await esperarJanela(cel) && (await janela(cel)).itens.map(i => i.parte).join(','), 'lista,gabarito');
  await clicar(cel, '#bib-pdf-compartilhar-lista');
  await pausa(400);
  conf('e o compartilhar da lista recebe só ela', (await compartilhados(cel)).map(e => e.arquivos.map(a => a.nome).join('+')).join(' | '), 'Lista_Revisao_de_equacoes_para_a_prova.pdf');
  await fecharJanela(cel);
  await clicar(cel, '.cel-bib-ver-lista .bib-voltar');
  await pausa(500);

  secao('6. A memória: ' + GRANDE_N + ' exercícios e 2 páginas de teoria, com o processador 4 vezes mais lento');
  /* Duas réguas. A do CDP, de dentro da página: o heap do JavaScript mais o
   * que fica fora dele e pesa aqui (os ArrayBuffers dos recortes e dos PDFs,
   * pelo Runtime.getHeapUsage). E a do sistema: a memória privada de todos os
   * processos deste Chrome (a página, a GPU, que guarda os canvas, e o
   * navegador, que guarda os Blobs), amostrada a cada 100 ms. */
  const cdp = await cel.target().createCDPSession();
  await cdp.send('Performance.enable');
  await cdp.send('HeapProfiler.enable');
  const heap = async () => {
    const u = await cdp.send('Runtime.getHeapUsage');
    const m = (await cdp.send('Performance.getMetrics')).metrics;
    const v = n => (m.filter(x => x.name === n)[0] || {}).value || 0;
    return { js: u.usedSize, fora: (u.embedderHeapUsedSize || 0) + (u.backingStorageSize || 0), jsMetrica: v('JSHeapUsedSize') };
  };
  const somaDe = h => h.js + h.fora;
  const navegador = await cel.browser().target().createCDPSession();
  const pids = ((await navegador.send('SystemInfo.getProcessInfo')).processInfo || []).map(p => p.id).filter(Boolean);
  await navegador.detach();
  const { spawn } = require('child_process');
  const leituras = [];
  const amostrador = spawn('powershell', ['-NoProfile', '-Command',
    '$ids=@(' + pids.join(',') + '); while ($true) { $s=0; foreach ($i in $ids) { try { $s += (Get-Process -Id $i -ErrorAction Stop).PrivateMemorySize64 } catch {} }; ' +
    '[Console]::Out.WriteLine($s); [Console]::Out.Flush(); Start-Sleep -Milliseconds 100 }']);
  amostrador.stdout.on('data', d => String(d).split(/\r?\n/).forEach(l => { if (/^\d+$/.test(l.trim())) leituras.push(Number(l.trim())); }));
  const esperarLeitura = () => esperar('uma leitura do sistema', () => leituras.length, v => v > 0, 20000);
  await esperarLeitura();
  await cdp.send('HeapProfiler.collectGarbage');
  await pausa(1000);
  const base = await heap();
  const baseSistema = leituras[leituras.length - 1];
  const nAntes = leituras.length;
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cel.evaluate(() => { window.__geracoes = []; window.__maxJuntos = 0; window.__desenhos = 0; });
  let pico = base, medindo = true;
  const amostras = (async () => {
    while (medindo) {
      try { const h = await heap(); if (somaDe(h) > somaDe(pico)) pico = h; } catch (e) { /* entre páginas */ }
      await pausa(50);
    }
  })();
  const t0 = Date.now();
  await clicar(cel, '#cel-bib-miolo .cel-bib-lista[data-lista="lista-grande"] [data-acao="pdf"]');
  const saiu = await esperarJanela(cel, 'o PDF da lista grande', 180000);
  const ms = Date.now() - t0;
  await pausa(300);
  medindo = false;
  await amostras;
  const picoSistema = Math.max.apply(null, leituras.slice(nAntes).concat([baseSistema]));
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const jg = await janela(cel);
  const ger3 = await cel.evaluate(() => ({ g: window.__geracoes.slice(), max: window.__maxJuntos, desenhos: window.__desenhos }));
  const tamanhos = await cel.evaluate(() => Array.from(document.querySelectorAll('#modal-bib-compartilhar .bib-compartilhar-nome')).map(n => n.textContent).join(', '));
  const MB = x => Math.round(x / 1048576 * 10) / 10;
  console.log('   CDP, antes: heap do JS ' + MB(base.js) + ' MB, fora do heap ' + MB(base.fora) + ' MB; no pico: ' + MB(pico.js) + ' MB e ' + MB(pico.fora) +
    ' MB (subiu ' + MB(somaDe(pico) - somaDe(base)) + ' MB; JSHeapUsedSize do Performance ' + MB(pico.jsMetrica) + ' MB)');
  console.log('   sistema, os ' + pids.length + ' processos do Chrome: antes ' + MB(baseSistema) + ' MB, pico ' + MB(picoSistema) + ' MB (subiu ' + MB(picoSistema - baseSistema) + ' MB)');
  console.log('   ' + Math.round(ms / 100) / 10 + ' s com o processador 4 vezes mais lento; ' + ger3.desenhos + ' recortes e páginas desenhados; ' + tamanhos);
  conf('o PDF da lista grande saiu: a lista com as 2 páginas de teoria e os ' + GRANDE_N + ' exercícios, e o gabarito à parte',
    [saiu, jg.itens.map(i => i.parte).join(','), ger3.g.map(g => [g.lista, g.gabarito, g.itens, g.paginas].join('/')).join(' ; ')].join('|'),
    ['true', 'lista,gabarito', 'true/false/' + GRANDE_N + '/2 ; false/true/' + GRANDE_N + '/0'].join('|'));
  conf('um recorte desenhado por vez no celular (o pico de desenhos juntos é 1)', ger3.max, 1);
  conf('pelo CDP, a página subiu menos de 120 MB no pico (subiu ' + MB(somaDe(pico) - somaDe(base)) + ' MB)', somaDe(pico) - somaDe(base) < 120 * 1048576, true);
  conf('pelo sistema, o Chrome inteiro subiu menos de 300 MB no pico (subiu ' + MB(picoSistema - baseSistema) + ' MB)', picoSistema - baseSistema < 300 * 1048576, true);
  await fecharJanela(cel);
  await cdp.send('HeapProfiler.collectGarbage');
  await pausa(800);
  await cdp.send('HeapProfiler.collectGarbage');
  await pausa(500);
  const depois = await heap();
  amostrador.kill();
  console.log('   CDP, depois de fechar e coletar: heap do JS ' + MB(depois.js) + ' MB, fora do heap ' + MB(depois.fora) + ' MB');
  conf('fechada a janela, a página volta para perto do começo (até 16 MB acima; ficou ' + MB(somaDe(depois) - somaDe(base)) + ' MB)', somaDe(depois) - somaDe(base) < 16 * 1048576, true);
  await cdp.detach();

  secao('7. Só lê: o banco igual byte a byte, nenhuma gravação');
  await pausa(1000);
  const banco1 = await retratoDoBanco(cel);
  const local1 = await retratoDoLocal(cel);
  const esc = await escritas(cel);
  const mudaram = Object.keys(Object.assign({}, banco0.por, banco1.por)).filter(n => banco0.por[n] !== banco1.por[n]);
  conf('nenhuma chamada de gravação ao Store ao gerar, compartilhar, baixar e ver', esc.gravacoes.join(','), '');
  conf('nenhuma transação de escrita no IndexedDB', esc.transacoes.join(' ; '), '');
  conf('o IndexedDB inteiro ficou igual byte a byte (' + banco1.depositos + ' depósitos, ' + banco1.registros + ' registros)',
    banco1.tudo + '|' + mudaram.join(','), banco0.tudo + '|');
  conf('o localStorage ficou igual', local1 === local0, true);
  conf('nenhum erro de página no celular a 390 px', cel.errosDePagina.join(' | '), '');

  secao('8. A trava de transbordo: 360, 390 e 412 px, letra normal e 130%');
  for (const [w, hh] of [[360, 740], [390, 844], [412, 915]]) {
    const p = w === 390 ? cel : await celular(w, hh);
    await irParaBiblioteca(p);
    await marcar(p, 'prontos');
    await pausa(500);
    const telas = [
      ['começo', async () => {}],
      ['assunto', async () => { await buscarEAbrirAssunto(p); }],
      ['Ver lista', async () => {
        await clicar(p, '.cel-bib-assunto .bib-voltar'); await pausa(400);
        await clicar(p, '#cel-bib-limpar');
        await esperar('Minhas listas', () => p.evaluate(() => document.querySelectorAll('#cel-bib-miolo .cel-bib-lista').length), v => v >= 4, 10000);
        await abrirVerLista(p, 'lista-revisao');
      }],
      ['PDF pronto', async () => { await clicar(p, '#cel-bib-pdf-lista'); await esperarJanela(p); }]
    ];
    for (const [nome, ir] of telas) {
      await ir();
      await pausa(400);
      if (w === 412) {
        if (nome === 'começo') await printar(p, '412x915_1_cartao_pdf.png');
        if (nome === 'Ver lista') await printar(p, '412x915_2_ver_lista_pe.png');
        if (nome === 'PDF pronto') await printar(p, '412x915_3_pdf_pronto.png');
      }
      for (const [rotulo, css] of [['letra normal', ''], ['letra 130%', LETRA_130]]) {
        await letra(p, css);
        await pausa(250);
        const v = await varrer(p);
        conf(w + ' px, ' + rotulo + ', ' + nome + ': nada passa da borda, nada rola de lado, a página não rola de lado' +
          (v.total ? ' (' + v.ruins.join('; ') + ')' : ''), v.total + '|' + v.paginaRolaDeLado, '0|false');
        if (nome === 'PDF pronto') {
          const g = await geometriaDaJanela(p);
          conf(w + ' px, ' + rotulo + ', PDF pronto: Compartilhar na linha inteira, Baixar e Ver embaixo, nada cortado',
            g.map(x => [x.compartilharNaLinhaInteira, x.baixarEVerNaLinhaDeBaixo, x.nadaCortado, x.dentroDaTela].join('/')).join(' | '), 'true/true/true/true | true/true/true/true');
        }
      }
      await letra(p, '');
    }
    if (w === 360) {
      const largo = await p.evaluate(() => {
        const d = document.createElement('div'); d.id = 'prova-largo'; d.style.cssText = 'width:500px;height:10px';
        document.querySelector('#corpo-modal-bib-compartilhar').appendChild(d); return true;
      }).then(() => varrer(p));
      await p.evaluate(() => document.querySelector('#prova-largo').remove());
      conf('controle: um elemento de 500 px na janela a 360 é pego pela varredura', largo.total > 0 && largo.janela, true);
    }
    await fecharJanela(p);
    const esc2 = await escritas(p);
    conf('nenhuma gravação a ' + w + ' px', esc2.gravacoes.join(',') + '|' + esc2.transacoes.join(';'), '|');
    conf('nenhum erro de página a ' + w + ' px', p.errosDePagina.join(' | '), '');
    if (p !== cel) await p.close();
  }

  secao('9. O nome de verdade em lugar nenhum');
  conf('o nome de verdade não aparece no celular, e "' + NOME_TESTE + '" está no lugar dele', await cel.evaluate((n, t) =>
    document.documentElement.outerHTML.indexOf(n) < 0 && document.documentElement.outerHTML.indexOf(t) >= 0, NOME_REAL, NOME_TESTE), true);
  return H.fim(amb)();
})().catch(H.fim(amb));
