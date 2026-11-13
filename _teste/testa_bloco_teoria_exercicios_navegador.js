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
 *   1. as quatro seções (Teoria, Lista de base, Exercícios, OBMEP), com a contagem;
 *   2. o exercício grande, numa coluna só, com a letra estimada entre 18 e 22
 *      px no tablet (D5), legível sem a tela cheia;
 *   3. tudo desmarcado ao abrir (D4): o bloco não põe nada no material;
 *   4. o selo graduado (D3): 1 a 3 pontos, tons diferentes, e o "Para mim"
 *      dela por cima do do pacote; o desafio sinalizado é o do pacote, o mesmo
 *      das listas prontas;
 *   5. Abrir chama a tela cheia de sempre (teoria, exercício, lista de base) e
 *      Anexar, a caixa "No material" de sempre: o carrinho e a faixa mudam, e a
 *      caixa do bloco segue o que se marca na tela cheia; "Usar esta lista"
 *      leva à lista pronta, com o material trocado pela lista;
 *   6. o vazio numa linha, e as seções que faltam numa linha só no fim;
 *   7. nada transborda (100% e 130% da letra), alvos de 48 px, sem travessão;
 *   8. a seção do app.js do bloco não grava nada por conta própria.
 *
 *   9. a marca ", de outro ano": um assunto do 8º ano ligado (pela tabela de
 *      vínculos) ao módulo do 9º ano mostra a marca no cartão do exercício, na
 *      linha da teoria e na lista de base, e o do 9º ano não a mostra.
 *
 *   --prints <pasta>   grava os prints dos três tamanhos (até 4).
 *
 * Veneno (TEM de ser visto: "VENENO visto"):
 *   --envenenado-sem-outro-ano   o adaptador nunca marca a fonte de outro ano.
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
const MODO = ['--envenenado-sem-outro-ano'].filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const MARCA_OUTRO_ANO = '      f.outroAno = !!(serieDoAno && m && !m.series[serieDoAno]);\n';
const trocas = { '/app.js': APP.split(ANCORA).join(GANCHO + ANCORA) };
if (MODO === '--envenenado-sem-outro-ano') {
  if (APP.split(MARCA_OUTRO_ANO).length !== 2) { console.log('  FALHA o ponto do veneno não existe uma vez no app.js'); process.exit(1); }
  trocas['/app.js'] = trocas['/app.js'].split(MARCA_OUTRO_ANO).join('      f.outroAno = false;\n');
}

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
    titulo: txt('.bte-titulo'), faltam: txt('.bte-faltam'),
    vazios: Array.from(b.querySelectorAll('.bte-vazio')).map(p => p.textContent.trim()),
    secoes: Array.from(b.querySelectorAll('.bte-secao')).map(s => s.dataset.secao + ':' + s.querySelector('.bte-secao-nome').textContent.trim() +
      (s.querySelector('.bte-secao-quantos') ? ' ' + s.querySelector('.bte-secao-quantos').textContent.trim() : '')),
    cartoes: b.querySelectorAll('.bte-ex').length,
    marcadas: Array.from(b.querySelectorAll('input.bte-marca')).filter(c => c.checked).length,
    caixas: b.querySelectorAll('input.bte-marca').length,
    mais: Array.from(b.querySelectorAll('.bte-mais')).map(m => m.textContent.trim()).join(' | ') || null,
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
  // a faixa do material fica presa no alto da Biblioteca: o print desce menos, para ela não tapar o título
  await pag.evaluate(s => {
    const e = document.querySelector(s);
    if (!e) return;
    e.scrollIntoView({ block: 'start' });
    const faixa = document.querySelector('#bib-carrinho');
    const area = document.querySelector('.conteudo');
    if (faixa && !faixa.hidden && faixa.offsetParent && area) area.scrollTop -= faixa.getBoundingClientRect().height + 16;
  }, seletor || '#prova-t2');
  await pausa(600);
  await pag.screenshot({ path: path.join(PRINTS, nome) });
  console.log('   print: ' + nome);
}

async function esperarMiniatura(pag) {
  const r = await esperar('a primeira miniatura do bloco', () => pag.evaluate(() =>
    !!document.querySelector('#prova-t2 .bte-ex img.bib-mini.pronta')), v => v, 20000);
  if (!r.ok) {
    console.log('   miniaturas: ' + JSON.stringify(await pag.evaluate(() =>
      Array.from(document.querySelectorAll('#prova-t2 img.bib-mini')).slice(0, 6).map(i => ({
        obs: !!i._bteObservada, pedida: !!i._btePedida, classe: i.className, src: (i.getAttribute('src') || '').slice(0, 20),
        topo: Math.round(i.getBoundingClientRect().top), alto: Math.round(i.getBoundingClientRect().height) })))));
  }
  conf('a primeira miniatura do bloco chegou', r.ok, true);
  return r;
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
  secao('1b. A marca ", de outro ano"');
  /* MAT08-01 é do 8º ano; a tabela de vínculos liga a ele o módulo das
   * equações, que no aparelho só serve ao 9º: a teoria, a lista de base e os
   * exercícios vêm de outro ano. */
  await desenhar(pag, 'MAT08-01', [{ assunto: 'MAT08-01', modulo: '9ano:equacoes-do-segundo-grau' }]);
  const outroAno = await pag.evaluate(() => {
    const b = document.querySelector('#prova-t2 .bte');
    const ex = b.querySelector('.bte-ex .bte-ex-de'), teo = b.querySelector('.bte-teoria .detalhe'), base = b.querySelector('.bte-lista .nome');
    return { ex: ex ? ex.textContent : '', teo: teo ? teo.textContent : '', base: base ? base.textContent : '' };
  });
  console.log('   ' + JSON.stringify(outroAno));
  const marcas = [outroAno.ex, outroAno.teo, outroAno.base].map(t => /, de outro ano$/.test(t));
  if (MODO === '--envenenado-sem-outro-ano') {
    secao('VENENO: ' + MODO);
    if (conf('envenenado-sem-outro-ano: a marca sumiu do exercício, da teoria e da lista de base (defeito detectado)',
      marcas.every(x => !x), true)) console.log('VENENO visto: nenhuma das três fontes de outro ano disse isso');
    await H.fim(amb)();
    return;
  }
  conf('o exercício de outro ano diz isso na origem', marcas[0], true);
  conf('a teoria de outro ano diz isso, com vírgula', marcas[1], true);
  conf('a lista de base de outro ano diz isso', marcas[2], true);
  await desenhar(pag, 'MAT09-04', VINCULOS);
  conf('no assunto do 9º ano, nada é de outro ano', await pag.evaluate(() =>
    /de outro ano/i.test(document.querySelector('#prova-t2 .bte').innerText)), false);

  // ================================================================
  secao('2. MAT09-04 a 1280x800: as quatro seções');
  const antes = await carrinho(pag);
  await desenhar(pag, 'MAT09-04', VINCULOS);
  await esperarMiniatura(pag);
  let b = await ler(pag);
  conf('o título do bloco', b.titulo, 'Teoria e exercícios');
  conf('as quatro seções, nesta ordem, cada uma com a contagem', b.secoes.join(' | '), 'teoria:Teoria 4 | lista-base:Lista de base | exercicios:Exercícios 48 | obmep:OBMEP 1');
  conf('a teoria mostra 2 das 4 aulas', await pag.evaluate(() => document.querySelectorAll('#prova-t2 .bte-teoria').length), 2);
  conf('sem linha de falta (nada falta)', b.faltam, null);
  conf('os exercícios: os 5 primeiros à vista e 1 da OBMEP', b.cartoes, 6);
  conf('e o resto atrás do "Ver mais"', b.mais, 'Ver mais 2 aulas de teoria | Ver mais 43 exercícios');

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
  conf('o desafio continua o do pacote, como nas listas prontas (o pacote diz fácil: sem desafio)', dela.desafio, false);
  conf('e o rótulo para quem ouve diz de quem é', /sua etiqueta/.test(dela.rotulo), true);
  await pag.evaluate(() => document.querySelector('#prova-t2 [data-secao="exercicios"] .bte-mais').click());
  await pausa(300);
  b = await ler(pag);
  conf('o "Ver mais" mostra os 48 e a questão da OBMEP', b.cartoes + ' ' + b.mais, '49 Ver mais 2 aulas de teoria');
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
  const desafios = await pag.evaluate(() => {
    const doPacote = {};
    window.__provaFontes.exercicios.concat(window.__provaFontes.obmep, window.__provaFontes.enem).forEach(e => { doPacote[e.id] = e.dificuldade; });
    const cards = Array.from(document.querySelectorAll('#prova-t2 .bte-ex'));
    return { certos: cards.every(c => (doPacote[c.dataset.id] === 3) === !!c.querySelector('.bte-desafio')),
      quantos: cards.filter(c => c.querySelector('.bte-desafio')).length };
  });
  conf('o desafio aparece exatamente nos de dificuldade 3 do pacote', desafios.certos && desafios.quantos > 0, true);

  secao('6. Transbordo, alvos e travessão a 1280x800, 100% e 130%');
  let v = await varrer(pag);
  conf('nada passa da borda nem rola de lado (100%)', v.total + (v.total ? ' ' + v.ruins.join('; ') : ''), '0');
  conf('a página não rola de lado', v.paginaRolaDeLado, false);
  conf('sem travessão no bloco', /[\u2013\u2014]/.test(b.texto), false);
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
  conf('MAT04-09 (4º ano, sem livro): só a OBMEP', b.secoes.join(' | '), 'obmep:OBMEP 2');
  conf('e o que falta numa linha só', b.faltam, 'Ainda sem teoria, lista de base e exercícios avulsos para este assunto.');
  await desenhar(pag, 'MAT07-01');
  b = await ler(pag);
  conf('MAT07-01 (o pacote não está): nenhuma seção', b.secoes.length, 0);
  conf('e uma linha só, com o porquê', b.vazios.join(' | '), 'O pacote com a teoria e os exercícios deste assunto ainda não está neste aparelho.');
  await desenhar(pag, 'MATEM3-11');
  b = await ler(pag);
  conf('MATEM3-11 (só ENEM): a seção própria do ENEM', b.secoes.join(' | '), 'enem:ENEM 3');
  conf('o ENEM, de dificuldade neutra, fica sem selo', await pag.evaluate(() =>
    document.querySelectorAll('#prova-t2 .bte-selo').length), 0);
  await desenhar(pag, 'MATEM3-11', [{ assunto: 'MATEM3-11', item: 'banco:2019:n2:1' }]);
  b = await ler(pag);
  conf('com uma questão do Banco ligada, a OBMEP e o ENEM em seções separadas', b.secoes.join(' | '), 'obmep:OBMEP 1 | enem:ENEM 3');

  // ================================================================
  secao('8b. As miniaturas do bloco não dependem da fila da Biblioteca');
  // a Biblioteca por baixo, na tela de um módulo (a que se redesenha ao fechar a tela cheia):
  // sair e voltar à aba redesenha a Biblioteca na lista pronta, e o Voltar dela leva ao módulo
  await H.irParaAba(pag, 'ajustes');
  await H.irParaAba(pag, 'biblioteca');
  await pausa(600);
  await pag.evaluate(() => { const v = document.querySelector('#bib-corpo .bib-voltar'); if (v) v.click(); });
  await pausa(400);
  conf('a Biblioteca está na tela do módulo', await pag.evaluate(() => !!document.querySelector('#bib-marcar-modulo')), true);
  await desenhar(pag, 'MAT09-04', VINCULOS, true);
  await esperarMiniatura(pag);
  await pag.evaluate(() => document.querySelectorAll('#prova-t2 .bte-mais').forEach(m => m.click()));
  await pag.evaluate(id => document.querySelector('#prova-t2 .bte-ex[data-id="' + id + '"] .bte-ex-abrir').click(), EX(1));
  await abrirModal(pag);
  await fecharModal(pag);
  // rola o bloco até o fim, devagar, e toda miniatura tem de chegar
  await pag.evaluate(async () => {
    const c = document.querySelector('#prova-t2');
    for (let y = 0; y <= c.scrollHeight; y += 600) { c.scrollTop = y; await new Promise(r => setTimeout(r, 120)); }
  });
  const todas = await esperar('todas as miniaturas do bloco', () => pag.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('#prova-t2 img.bib-mini'));
    return imgs.filter(i => i.classList.contains('pronta')).length + '/' + imgs.length;
  }), v => { const [a, t] = String(v).split('/'); return +t > 0 && a === t; }, 60000);
  conf('depois de fechar a tela cheia por cima da Biblioteca, todas as miniaturas chegam', todas.ok + ' ' + todas.valor,
    'true 53/53');

  // ================================================================
  secao('9. 800x1280 (tablet em pé)');
  await pag.setViewport({ width: 800, height: 1280 });
  await pausa(300);
  await desenhar(pag, 'MAT09-04', VINCULOS);
  await esperarMiniatura(pag);
  b = await ler(pag);
  conf('as quatro seções', b.secoes.length, 4);
  // os exercícios da lista de base são os três primeiros da Soma e Produto, abaixo do "Ver mais"
  await pag.evaluate(() => document.querySelector('#prova-t2 [data-secao="exercicios"] .bte-mais').click());
  await pausa(200);
  conf('os cartões marcados ganham a marca deles (os mesmos três)', await pag.evaluate(() =>
    Array.from(document.querySelectorAll('#prova-t2 .bte-ex.bte-marcado')).map(c => c.dataset.id).join(',')), BASE_IDS.join(','));
  conf('as caixas seguem o material de agora: os três da lista de base, e só eles', await pag.evaluate(() =>
    Array.from(document.querySelectorAll('#prova-t2 .bte-ex')).filter(c => c.querySelector('input.bte-marca').checked)
      .map(c => c.dataset.id).join(',')), BASE_IDS.join(','));
  // a página do assunto pode montar o bloco fora do documento e inserir depois: as marcas nascem certas
  conf('desenhado fora do documento, o bloco já nasce com as marcas do material', await pag.evaluate(() => {
    const d = document.createElement('div');
    window.__provaT2.desenhar(d, window.__provaFontes);
    d.querySelector('[data-secao="exercicios"] .bte-mais').click();
    return d.querySelectorAll('.bte-ex.bte-marcado').length + ' ' +
      Array.from(d.querySelectorAll('input.bte-marca')).filter(c => c.checked).length;
  }), '3 3');
  await desenhar(pag, 'MAT09-04', VINCULOS);
  await esperarMiniatura(pag);
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
    await pag.evaluate(() => document.querySelector('#prova-t2 [data-secao="exercicios"] .bte-mais').click());
    await pausa(300);
    await printar(pag, 't2-800x1280-degraus.png', '#prova-t2 .bte-ex[data-id$=":ex:26"]');
  }

  // ================================================================
  secao('10. 412x915 (celular): o mesmo bloco, em uma coluna');
  const cel = await amb.pagina();
  await cel.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });
  await H.abrirApp(cel, amb.ORIGEM);
  conf('o aplicativo abriu no modo celular', await cel.evaluate(() => document.body.classList.contains('modo-celular')), true);
  await desenhar(cel, 'MAT09-04', VINCULOS, true);
  await esperarMiniatura(cel);
  b = await ler(cel);
  conf('as quatro seções', b.secoes.join(' | '), 'teoria:Teoria 4 | lista-base:Lista de base | exercicios:Exercícios 48 | obmep:OBMEP 1');
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
