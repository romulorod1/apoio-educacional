/* testa_bloco_teoria_exercicios_navegador.js
 *
 * A T2 da frente "Listas de exercícios", na tela: o bloco "Teoria e
 * exercícios" da página do assunto (desenharBlocoTeoriaExercicios, no app.js),
 * desenhado com as fontes da Biblioteca.fontesDoAssunto. A página do assunto
 * em si é de outra executora e ainda não existe; esta prova monta uma PÁGINA DE
 * PROVA só aqui: o app.js servido ganha uma linha que expõe as duas funções
 * (window.__provaT2), e a prova desenha o bloco numa caixa dentro da
 * Biblioteca (no tablet) ou por cima da tela (no celular). Nada disso existe no
 * aplicativo publicado.
 *
 * O acervo é o sintético das provas (_pacote_sintetico.js): o 9º ano do Portal
 * com teoria e lista de base, o Banco do nível 2, a Mirim 2 e o ENEM,
 * importados pela tela de Ajustes, como ela faz. Nenhum dado real, perfil do
 * Chrome novo e apagado no fim.
 *
 * O que prova, a 1280x800, 800x1280 e 412x915:
 *   1. as quatro seções (Teoria, Lista de base, Exercícios, OBMEP) e o resumo;
 *   2. o exercício grande, numa coluna só, com a letra estimada entre 18 e 22
 *      px no tablet (D5), legível sem a tela cheia;
 *   3. tudo desmarcado ao abrir (D4): o bloco não põe nada no material;
 *   4. o selo graduado (D3): 1 a 3 pontos, tons diferentes, e o "Para mim"
 *      dela por cima do do pacote, com o desafio sinalizado;
 *   5. Abrir chama a tela cheia de sempre (teoria, exercício, lista de base) e
 *      Anexar, a caixa "No material" de sempre: o carrinho e a faixa mudam, e a
 *      caixa do bloco segue o que se marca na tela cheia; "Usar esta lista"
 *      leva à lista pronta, com o material trocado pela lista;
 *   6. o vazio numa linha, e as seções que faltam numa linha só no fim;
 *   7. nada transborda (100% e 130% da letra), alvos de 48 px, sem travessão;
 *   8. a seção do app.js do bloco não grava nada por conta própria.
 *
 *   --prints <pasta>   grava os prints dos três tamanhos (até 4).
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8981;
const iPrints = process.argv.indexOf('--prints');
const PRINTS = iPrints > 0 ? process.argv[iPrints + 1] : null;
if (PRINTS) fs.mkdirSync(PRINTS, { recursive: true });

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const ANCORA = '  function desenharBlocoTeoriaExercicios(elemento, fontes, contexto) {\n';
const GANCHO = '  window.__provaT2 = { desenhar: function (e, f, c) { return desenharBlocoTeoriaExercicios(e, f, c); },\n' +
  '    carregar: function (id, v) { return carregarFontesDoAssunto(id, v); } };\n';
const trocas = { '/app.js': APP.split(ANCORA).join(GANCHO + ANCORA) };

const amb = H.criarAmbiente(PORTA, 'perfil_bloco_teoria_exercicios', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 't2_bloco_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

const BANCO_EQ = 'banco:2020:n2:4';
const VINCULOS = [{ assunto: 'MAT09-04', item: BANCO_EQ }];
const EX = n => '9ano:equacoes-do-segundo-grau:equacao-do-2o-grau-resultados-basicos:ex:' + n;
const PARA_MIM = EX(2);           // o pacote diz fácil (1); ela marcou difícil (3)
const BASE_IDS = Sintetico.LISTA_BASE.degraus.map(d => d.item);
const LETRA_130 = 'html{font-size:130%}';

async function importar(pag, arquivo) {
  await H.irParaAba(pag, 'ajustes');
  await (await pag.$('#arquivo-biblioteca')).uploadFile(arquivo);
  const r = await esperar('importação de ' + path.basename(arquivo), () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca'); return c ? c.innerText.trim() : '';
  }), v => /^Biblioteca importada\.|não foi importado/.test(v || ''), 90000);
  // a mensagem da importação anterior não pode valer pela próxima
  await pag.evaluate(() => { const c = document.querySelector('#estado-importacao-biblioteca'); if (c) c.textContent = ''; });
  return r.valor || '';
}

const letra = (pag, css) => pag.evaluate(c => {
  const v = document.querySelector('#prova-letra'); if (v) v.remove();
  if (c) { const s = document.createElement('style'); s.id = 'prova-letra'; s.textContent = c; document.head.appendChild(s); }
}, css);

/* A caixa da página de prova: dentro da Biblioteca no tablet; por cima da
 * tela no celular, onde a Biblioteca do tablet não aparece. */
async function desenhar(pag, assunto, vinculos, sobreposta) {
  return pag.evaluate((a, v, sobre) => {
    let caixa = document.querySelector('#prova-t2');
    if (caixa) caixa.remove();
    caixa = document.createElement('div');
    caixa.id = 'prova-t2';
    if (sobre) {
      caixa.style.cssText = 'position:fixed;inset:0;z-index:40;overflow:auto;background:var(--fundo);padding:16px;box-sizing:border-box';
      document.body.appendChild(caixa);
    } else {
      document.querySelector('#bib-corpo').replaceChildren(caixa);
    }
    return window.__provaT2.carregar(a, v).then(f => {
      window.__provaFontes = f;
      window.__provaT2.desenhar(caixa, f);
      return true;
    });
  }, assunto, vinculos || null, !!sobreposta);
}

const ler = pag => pag.evaluate(() => {
  const b = document.querySelector('#prova-t2 .bte');
  if (!b) return null;
  const txt = s => { const e = b.querySelector(s); return e ? e.textContent.trim() : null; };
  return {
    titulo: txt('.bte-titulo'), resumo: txt('.bte-resumo'), faltam: txt('.bte-faltam'),
    vazios: Array.from(b.querySelectorAll('.bte-vazio')).map(p => p.textContent.trim()),
    secoes: Array.from(b.querySelectorAll('.bte-secao')).map(s => s.dataset.secao + ':' + s.querySelector('h4').textContent.trim()),
    cartoes: b.querySelectorAll('.bte-ex').length,
    marcadas: Array.from(b.querySelectorAll('input.bte-marca')).filter(c => c.checked).length,
    caixas: b.querySelectorAll('input.bte-marca').length,
    mais: txt('.bte-mais'),
    texto: b.innerText
  };
});

const carrinho = pag => pag.evaluate(() => JSON.parse(localStorage.getItem('apoio-educacional:bib-carrinho') || 'null'));

/* O primeiro exercício: a largura do recorte na tela e a letra que ela dá. A
 * letra do corpo dos recortes do Portal fica em torno de 10,5 pt. */
const medirExercicio = pag => pag.evaluate(() => {
  const cards = Array.from(document.querySelectorAll('#prova-t2 .bte-ex'));
  const img = cards[0] && cards[0].querySelector('img.bib-mini');
  const caixa = document.querySelector('#prova-t2 .bte');
  const r = img ? img.getBoundingClientRect() : null;
  const esq = cards.map(c => Math.round(c.getBoundingClientRect().left));
  const topo = cards.map(c => Math.round(c.getBoundingClientRect().top));
  return {
    largura: r ? Math.round(r.width) : 0, caixa: caixa ? Math.round(caixa.getBoundingClientRect().width) : 0,
    letra: r ? Math.round(10 * 10.5 * r.width / 262) / 10 : 0,
    umaColuna: esq.every(x => x === esq[0]) && topo.every((t, i) => i === 0 || t > topo[i - 1])
  };
});

/* Nada passa da borda nem rola de lado dentro do bloco; alvos de 48 px. */
const varrer = pag => pag.evaluate(() => {
  const b = document.querySelector('#prova-t2 .bte');
  const largura = window.innerWidth;
  const ruins = [];
  b.querySelectorAll('*').forEach(e => {
    const r = e.getBoundingClientRect();
    if (!r.width && !r.height) return;
    if (r.right > largura + 1) ruins.push('passa da borda: ' + (e.className || e.tagName) + ' ' + Math.round(r.right - largura) + ' px');
    if (e.tagName !== 'IMG' && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== 'visible') {
      ruins.push('rola de lado: ' + (e.className || e.tagName));
    }
  });
  b.querySelectorAll('button, .bte-marcar').forEach(e => {
    const r = e.getBoundingClientRect();
    if (!r.width) return;
    if (r.height < 47.5) ruins.push('alvo baixo: ' + (e.className || e.tagName) + ' ' + Math.round(r.height) + ' px');
    if (e.tagName === 'BUTTON' && e.scrollWidth > e.clientWidth + 1) ruins.push('texto passa do botão: ' + e.textContent.trim());
  });
  const pagina = document.scrollingElement.scrollWidth > document.scrollingElement.clientWidth + 1;
  return { ruins: ruins.slice(0, 8), total: ruins.length, paginaRolaDeLado: pagina };
});

async function printar(pag, nome, seletor) {
  if (!PRINTS) return;
  await pag.evaluate(s => { const e = document.querySelector(s); if (e) e.scrollIntoView({ block: 'start' }); }, seletor || '#prova-t2');
  await pausa(600);
  await pag.screenshot({ path: path.join(PRINTS, nome) });
  console.log('   print: ' + nome);
}

async function esperarMiniatura(pag) {
  return esperar('a primeira miniatura do bloco', () => pag.evaluate(() =>
    !!document.querySelector('#prova-t2 .bte-ex img.bib-mini.pronta')), v => v, 20000);
}

const abrirModal = pag => esperar('a tela cheia abriu', () => pag.evaluate(() => {
  const m = document.querySelector('#modal-biblioteca');
  return m && m.classList.contains('aberto') ? document.querySelector('#titulo-modal-biblioteca').textContent.trim() : '';
}), v => !!v, 8000);
const fecharModal = async pag => {
  await pag.evaluate(() => document.querySelector('#bib-fechar-visor').click());
  await esperar('a tela cheia fechou', () => pag.evaluate(() => !document.querySelector('#modal-biblioteca').classList.contains('aberto')), v => v, 8000);
};

(async () => {
  // ================================================================
  secao('0. A seção do bloco no app.js não grava nada por conta própria');
  const ini = APP.indexOf('  // ---------- página do assunto: o bloco "Teoria e exercícios" (T2) ----------');
  const fimSecao = APP.indexOf('  // ---------- miniaturas ----------', ini);
  const trecho = ini >= 0 && fimSecao > ini ? APP.slice(ini, fimSecao) : '';
  conf('a seção do bloco existe no app.js', trecho.length > 1000, true);
  conf('sem Store (nenhuma gravação nova)', /Store\./.test(trecho), false);
  conf('sem localStorage nem atribuição ao carrinho (a porta é o marcarNoCarrinho)', /localStorage|bibCarrinho\s*=/.test(trecho), false);
  conf('Abrir é a tela cheia de sempre e Anexar, a caixa de sempre',
    /verNaBiblioteca\(/.test(trecho) && /marcarNoCarrinho\(/.test(trecho) && /pedirParaUsarLista\(/.test(trecho), true);
  conf('o gancho da página de prova entrou uma vez no app.js servido', trocas['/app.js'].split(GANCHO).length, 2);

  await amb.subir();
  const pag = await amb.pagina();
  pag.on('dialog', d => d.accept());
  await pag.setViewport({ width: 1280, height: 800 });
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('1. O acervo sintético importa pela tela');
  const pacotes = [
    ['portal.zip', z => Sintetico.gerar(z, { listas: true, base: true })],
    ['banco.zip', z => Sintetico.gerarBanco(z)],
    ['mirim2.zip', z => Sintetico.gerarProva(z, { serie: 'm2' })],
    ['enem.zip', z => Sintetico.gerarProva(z, { serie: '3em' })]
  ];
  for (const [nome, gerar] of pacotes) {
    const z = path.join(TMP, nome);
    gerar(z);
    conf('importou ' + nome, /^Biblioteca importada\./.test(await importar(pag, z)), true);
  }
  // o "Para mim" dela, gravado como a tela da lista grava (no perfil de teste)
  await pag.evaluate(id => window.Store.gravarEtiquetaBiblioteca({ itemId: id, dificuldade: 3, data: '2026-11-12' }), PARA_MIM);
  await H.irParaAba(pag, 'biblioteca');
  await pausa(400);

  // ================================================================
  secao('2. MAT09-04 a 1280x800: as quatro seções');
  const antes = await carrinho(pag);
  await desenhar(pag, 'MAT09-04', VINCULOS);
  await esperarMiniatura(pag);
  let b = await ler(pag);
  conf('o título do bloco', b.titulo, 'Teoria e exercícios');
  conf('o resumo conta as quatro fontes', b.resumo, '4 aulas de teoria · lista de base · 48 exercícios · 1 da OBMEP');
  conf('as quatro seções, nesta ordem', b.secoes.join(' | '), 'teoria:Teoria | lista-base:Lista de base | exercicios:Exercícios | obmep:OBMEP');
  conf('sem linha de falta (nada falta)', b.faltam, null);
  conf('os exercícios: os 5 primeiros à vista e 1 da OBMEP', b.cartoes, 6);
  conf('e o resto atrás do "Ver mais"', b.mais, 'Ver mais 43 exercícios');

  secao('3. Tudo desmarcado ao abrir (D4)');
  conf('nenhuma caixa marcada', b.marcadas + ' de ' + b.caixas, '0 de ' + b.caixas);
  conf('o bloco não pôs nada no material', JSON.stringify(await carrinho(pag)), JSON.stringify(antes));

  secao('4. O exercício grande, numa coluna (D5)');
  let m = await medirExercicio(pag);
  console.log('   ' + JSON.stringify(m));
  conf('o recorte de 262 pt fica com cerca de 498 px', Math.abs(m.largura - 498) <= 2, true);
  conf('a letra estimada do enunciado fica entre 18 e 22 px', m.letra >= 18 && m.letra <= 22, true);
  conf('uma coluna só: os cartões um embaixo do outro, alinhados', m.umaColuna, true);

  secao('5. O selo graduado e o "Para mim" por cima (D3)');
  await esperar('o selo dela chegou', () => pag.evaluate(id => {
    const s = document.querySelector('#prova-t2 .bte-ex[data-id="' + id + '"] .bte-selo');
    return s ? s.dataset.de : '';
  }, PARA_MIM), v => v === 'dela', 8000);
  const dela = await pag.evaluate(id => {
    const c = document.querySelector('#prova-t2 .bte-ex[data-id="' + id + '"]');
    const s = c.querySelector('.bte-selo');
    return { d: s.dataset.dificuldade, texto: s.textContent.trim(), cheios: s.querySelectorAll('.bte-ponto.cheio').length,
      desafio: !!c.querySelector('.bte-desafio'), rotulo: s.getAttribute('aria-label') };
  }, PARA_MIM);
  console.log('   ' + JSON.stringify(dela));
  const pacoteDiz = await pag.evaluate(id => (window.__provaFontes.exercicios.filter(e => e.id === id)[0] || {}).dificuldade, PARA_MIM);
  conf('o pacote diz fácil', pacoteDiz, 1);
  conf('o selo vale o dela: difícil, três pontos, "para mim"', dela.d + ' ' + dela.cheios + ' ' + /para mim/.test(dela.texto), '3 3 true');
  conf('com o desafio sinalizado', dela.desafio, true);
  conf('e o rótulo para quem ouve diz de quem é', /sua etiqueta/.test(dela.rotulo), true);
  await pag.evaluate(() => document.querySelector('#prova-t2 .bte-mais').click());
  await pausa(300);
  b = await ler(pag);
  conf('o "Ver mais" mostra os 48 e a questão da OBMEP', b.cartoes + ' ' + b.mais, '49 null');
  const graus = await pag.evaluate(() => {
    const porNivel = {};
    document.querySelectorAll('#prova-t2 .bte-selo[data-de="pacote"]').forEach(s => {
      const d = s.dataset.dificuldade;
      const p = s.querySelector('.bte-ponto.cheio');
      porNivel[d] = { cheios: s.querySelectorAll('.bte-ponto.cheio').length, cor: getComputedStyle(p).backgroundColor,
        fundo: getComputedStyle(s).backgroundColor };
    });
    return porNivel;
  });
  console.log('   ' + JSON.stringify(graus));
  conf('os três níveis do pacote aparecem', Object.keys(graus).sort().join(','), '1,2,3');
  conf('com 1, 2 e 3 pontos', [1, 2, 3].map(d => graus[d] && graus[d].cheios).join(','), '1,2,3');
  conf('e três tons diferentes nos pontos', new Set([1, 2, 3].map(d => graus[d] && graus[d].cor)).size, 3);
  conf('o desafio aparece nos de nível 3', await pag.evaluate(() =>
    Array.from(document.querySelectorAll('#prova-t2 .bte-ex')).every(c => {
      const s = c.querySelector('.bte-selo');
      return !s || (s.dataset.dificuldade === '3') === !!c.querySelector('.bte-desafio');
    })), true);

  secao('6. Transbordo, alvos e travessão a 1280x800, 100% e 130%');
  let v = await varrer(pag);
  conf('nada passa da borda nem rola de lado (100%)', v.total + (v.total ? ' ' + v.ruins.join('; ') : ''), '0');
  conf('a página não rola de lado', v.paginaRolaDeLado, false);
  conf('sem travessão no bloco', /[–—]/.test(b.texto), false);
  await letra(pag, LETRA_130);
  v = await varrer(pag);
  conf('nada passa da borda nem rola de lado (130%)', v.total + (v.total ? ' ' + v.ruins.join('; ') : ''), '0');
  await letra(pag, '');
  await desenhar(pag, 'MAT09-04', VINCULOS);
  await esperarMiniatura(pag);
  await printar(pag, 't2-1280x800.png');

  // ================================================================
  secao('7. Abrir e Anexar pelos caminhos de sempre');
  await pag.evaluate(id => document.querySelector('#prova-t2 .bte-ex[data-id="' + id + '"] .bte-ex-abrir').click(), EX(1));
  let t = await abrirModal(pag);
  conf('Abrir o exercício 1: a tela cheia, na lista da fonte', t.valor, 'Equações do Segundo Grau: Resultados Básicos, exercício 1 (1 de 40)');
  await pag.evaluate(() => document.querySelector('#bib-marcar-visor').click());
  await pausa(200);
  await fecharModal(pag);
  conf('marcado na tela cheia: o carrinho tem o exercício 1', (await carrinho(pag)).itens.join(','), EX(1));
  conf('e a caixa do bloco seguiu', await pag.evaluate(id =>
    document.querySelector('#prova-t2 .bte-ex[data-id="' + id + '"] input.bte-marca').checked, EX(1)), true);
  await pag.evaluate(id => document.querySelector('#prova-t2 .bte-ex[data-id="' + id + '"] input.bte-marca').click(), EX(3));
  await pausa(200);
  conf('Anexar o exercício 3 pela caixa: vai para o material', (await carrinho(pag)).itens.join(','), EX(1) + ',' + EX(3));
  conf('e a faixa do material diz', await pag.evaluate(() => (document.querySelector('#bib-carrinho-contagem') || {}).textContent),
    'Material marcado: 2 exercícios');
  await pag.evaluate(id => document.querySelector('#prova-t2 .bte-ex[data-id="' + id + '"] input.bte-marca').click(), EX(3));
  await pausa(200);
  conf('tirar pela caixa tira do material', (await carrinho(pag)).itens.join(','), EX(1));

  const TEO = '9ano:equacoes-do-segundo-grau:resultados-basicos-parte-i:teo';
  await pag.evaluate(id => document.querySelector('#prova-t2 .bte-teoria[data-id="' + id + '"] .bte-teoria-abrir').click(), TEO);
  t = await abrirModal(pag);
  conf('Abrir a teoria: a tela cheia na capa', t.valor, 'Resultados Básicos - Parte I, capa de 5');
  await fecharModal(pag);
  await pag.evaluate(id => document.querySelector('#prova-t2 .bte-teoria[data-id="' + id + '"] input.bte-marca').click(), TEO);
  await pausa(200);
  conf('Anexar a teoria leva as 5 páginas', (await carrinho(pag)).paginas.length, 5);
  // tirar uma página pela tela cheia: a caixa da aula fica pela metade
  await pag.evaluate(id => document.querySelector('#prova-t2 .bte-teoria[data-id="' + id + '"] .bte-teoria-abrir').click(), TEO);
  await abrirModal(pag);
  await pag.evaluate(() => document.querySelector('#bib-marcar-visor').click());
  await pausa(200);
  await fecharModal(pag);
  conf('com 4 das 5 páginas, a caixa da aula fica pela metade', await pag.evaluate(id => {
    const c = document.querySelector('#prova-t2 .bte-teoria[data-id="' + id + '"] input.bte-marca');
    return c.indeterminate + ' ' + c.checked;
  }, TEO), 'true false');

  await pag.evaluate(() => document.querySelector('#prova-t2 .bte-lista-ver').click());
  t = await abrirModal(pag);
  conf('Ver a lista de base: a tela cheia nos exercícios dela', t.valor, 'Lista de base, exercício 1 (1 de 3)');
  await fecharModal(pag);
  await pag.evaluate(() => document.querySelector('#prova-t2 .bte-lista-usar').click());
  await esperar('a lista pronta abriu', () => pag.evaluate(() => !document.querySelector('#prova-t2')), x => x, 8000);
  conf('Usar esta lista: o material vira a lista de base, na ordem dela',
    JSON.stringify(await carrinho(pag)), JSON.stringify({ itens: BASE_IDS, paginas: [] }));
  conf('e a Biblioteca abre a lista pronta, onde ela mexe', await pag.evaluate(() =>
    /Lista de base/.test((document.querySelector('#bib-corpo .bib-titulo') || {}).textContent || '')), true);

  // ================================================================
  secao('8. O vazio numa linha');
  await desenhar(pag, 'MAT04-09');
  b = await ler(pag);
  conf('MAT04-09 (4º ano, sem livro): só a OBMEP', b.secoes.join(' | '), 'obmep:OBMEP');
  conf('e o que falta numa linha só', b.faltam, 'Ainda sem teoria, lista de base e exercícios avulsos para este assunto.');
  await desenhar(pag, 'MAT07-01');
  b = await ler(pag);
  conf('MAT07-01 (o pacote não está): nenhuma seção', b.secoes.length, 0);
  conf('e uma linha só, com o porquê', b.vazios.join(' | '), 'O pacote com a teoria e os exercícios deste assunto ainda não está neste aparelho.');
  await desenhar(pag, 'MATEM3-11');
  b = await ler(pag);
  conf('MATEM3-11: a seção leva o nome do ENEM quando ele está', b.secoes.join(' | '), 'obmep:OBMEP e ENEM');

  // ================================================================
  secao('9. 800x1280 (tablet em pé)');
  await pag.setViewport({ width: 800, height: 1280 });
  await pausa(300);
  await desenhar(pag, 'MAT09-04', VINCULOS);
  await esperarMiniatura(pag);
  b = await ler(pag);
  conf('as quatro seções', b.secoes.length, 4);
  conf('as caixas seguem o material de agora (a lista de base)', b.marcadas, 3);
  m = await medirExercicio(pag);
  console.log('   ' + JSON.stringify(m));
  conf('o exercício continua com cerca de 498 px e a letra entre 18 e 22', Math.abs(m.largura - 498) <= 2 && m.letra >= 18 && m.letra <= 22, true);
  conf('numa coluna', m.umaColuna, true);
  v = await varrer(pag);
  conf('nada transborda (100%)', v.total + (v.total ? ' ' + v.ruins.join('; ') : ''), '0');
  await letra(pag, LETRA_130);
  v = await varrer(pag);
  conf('nada transborda (130%)', v.total + (v.total ? ' ' + v.ruins.join('; ') : ''), '0');
  await letra(pag, '');
  await printar(pag, 't2-800x1280.png');
  // o degrau da dificuldade, para o painel ver os três tons lado a lado
  if (PRINTS) {
    await pag.evaluate(() => document.querySelector('#prova-t2 .bte-mais').click());
    await pausa(300);
    await printar(pag, 't2-800x1280-degraus.png', '#prova-t2 .bte-ex[data-id$=":ex:13"]');
  }

  // ================================================================
  secao('10. 412x915 (celular): o mesmo bloco, em uma coluna');
  const cel = await amb.pagina();
  cel.on('dialog', d => d.accept());
  await cel.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });
  await H.abrirApp(cel, amb.ORIGEM);
  conf('o aplicativo abriu no modo celular', await cel.evaluate(() => document.body.classList.contains('modo-celular')), true);
  await desenhar(cel, 'MAT09-04', VINCULOS, true);
  await esperarMiniatura(cel);
  b = await ler(cel);
  conf('as quatro seções', b.secoes.join(' | '), 'teoria:Teoria | lista-base:Lista de base | exercicios:Exercícios | obmep:OBMEP');
  m = await medirExercicio(cel);
  console.log('   ' + JSON.stringify(m));
  conf('o exercício cabe na coluna', m.largura > 300 && m.largura <= m.caixa, true);
  conf('numa coluna', m.umaColuna, true);
  for (const [rotulo, css] of [['100%', ''], ['130%', LETRA_130]]) {
    await letra(cel, css);
    v = await varrer(cel);
    conf('nada transborda (' + rotulo + ')', v.total + (v.total ? ' ' + v.ruins.join('; ') : ''), '0');
  }
  await letra(cel, '');
  await cel.evaluate(id => document.querySelector('#prova-t2 .bte-ex[data-id="' + id + '"] .bte-ex-abrir').click(), EX(2));
  t = await abrirModal(cel);
  conf('Abrir no celular: a mesma tela cheia', t.valor, 'Equações do Segundo Grau: Resultados Básicos, exercício 2 (2 de 40)');
  await fecharModal(cel);
  await printar(cel, 't2-412x915.png');
  await cel.close();

  await H.fim(amb)();
})().catch(H.fim(amb));
