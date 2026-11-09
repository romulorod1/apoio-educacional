/* testa_navegacao_biblioteca.js
 *
 * A fatia B1 do redesenho (a navegação com a Biblioteca) no Chrome de
 * verdade, com dados fictícios ("Aluno Alfa Teste") e o pacote SINTÉTICO do
 * 9º ano. Só navegação: nada aqui grava dado do app além do arranjo.
 *
 * O que prova:
 *   1. tablet 1280x800: o trilho lateral existe, com o "+" no alto e os
 *      destinos na ordem do desenho (Agenda, Alunos, Biblioteca, Fechamento)
 *      e Ajustes no pé; um ativo só, com aria-current; alvos de 48 px;
 *      trocar pelo trilho mostra a tela certa; nada transborda, também com a
 *      letra a 130%; o "+" abre a mesma janela de aula do "+ Nova aula";
 *   2. a Biblioteca abre pelo trilho; o módulo abre e o "Voltar" volta; a
 *      tela cheia do exercício cobre o trilho e fecha;
 *   3. celular a 360, 390 e 412 px, e a 360 com a letra a 130%: os destinos
 *      da barra de baixo (Hoje, Alunos, Biblioteca, Fechamento, Enviar), com
 *      ícone e rótulo, sem corte nem sobreposição, alvo de 48 px, um ativo
 *      só; a Biblioteca abre pela barra e diz onde ficam os livros.
 *
 * Veneno:
 *   node _teste/testa_navegacao_biblioteca.js --envenenado-rotulo-corta
 *     o styles.css servido deixa a coluna da barra do celular encolher abaixo
 *     do rótulo (minmax(0, 1fr)): a 360 px com a letra a 130% o "Fechamento"
 *     estoura o botão, e a prova TEM de ver ("VENENO visto").
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8920;
const VENENOS = ['--envenenado-rotulo-corta'];
const VENENO_ROTULO = process.argv.indexOf('--envenenado-rotulo-corta') !== -1;

const CSS = fs.readFileSync(path.join(H.RAIZ, 'styles.css'), 'utf8');
const ANCORA_ROTULO = 'grid-auto-columns: minmax(min-content, 1fr);';
const trocas = {};
if (VENENO_ROTULO) trocas['/styles.css'] = CSS.split(ANCORA_ROTULO).join('grid-auto-columns: minmax(0, 1fr);');

const amb = H.criarAmbiente(PORTA, 'perfil_navegacao_biblioteca', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'nav_bib_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

/* A letra a 130%: as variáveis de letra do app multiplicadas, como as outras
 * provas do celular fazem (testa_celular_avisos, testa_celular_fechamento_texto). */
const LETRA_130 = ':root{' + [11, 13, 14, 15, 16, 20].map((px, i) => '--letra-' + (i + 1) + ':' + Math.round(px * 13) / 10 + 'px').join(';') +
  '} body{font-size:20.8px}';
const letra = (pag, css) => pag.evaluate(c => {
  const v = document.querySelector('#prova-letra'); if (v) v.remove();
  if (c) { const s = document.createElement('style'); s.id = 'prova-letra'; s.textContent = c; document.head.appendChild(s); }
}, css);

/* A barra de baixo do celular, medida como a trava de transbordo mede:
 * caixa do botão, caixa do texto (Range) e a largura rolável do rótulo. */
const medirBarra = pag => pag.evaluate(() => {
  const ruins = [];
  const bar = document.querySelector('#cel-abas');
  const br = bar.getBoundingClientRect();
  const itens = Array.from(bar.querySelectorAll('.cel-aba')).filter(b => !b.hidden).map(b => {
    const r = b.getBoundingClientRect();
    const rot = b.querySelector('.nav-rotulo');
    const rg = document.createRange(); rg.selectNodeContents(rot);
    const t = rg.getBoundingClientRect();
    return { cel: b.dataset.cel, texto: b.textContent, l: r.left, r: r.right, top: r.top, bottom: r.bottom, w: r.width, h: r.height,
      tl: t.left, tr: t.right, tt: t.top, tb: t.bottom, sw: rot.scrollWidth, cw: rot.clientWidth,
      ativa: b.classList.contains('ativa'), atual: b.getAttribute('aria-current') };
  });
  let folga = 999;
  itens.forEach((i, k) => {
    if (i.h < 48 || i.w < 48) ruins.push(i.cel + ' com alvo de ' + Math.round(i.w) + 'x' + Math.round(i.h));
    if (i.tl < i.l - 0.5 || i.tr > i.r + 0.5) ruins.push(i.cel + ': o rótulo sai do botão (' + Math.round(i.tl) + '-' + Math.round(i.tr) + ' em ' + Math.round(i.l) + '-' + Math.round(i.r) + ')');
    if (i.sw > i.cw + 0.5) ruins.push(i.cel + ': o rótulo está cortado (' + i.sw + ' em ' + i.cw + ')');
    if (i.tt < i.top - 0.5 || i.tb > i.bottom + 0.5) ruins.push(i.cel + ': o rótulo sai do botão na altura');
    if (k > 0) {
      const a = itens[k - 1];
      if (i.l < a.r - 0.5) ruins.push(a.cel + ' e ' + i.cel + ' se sobrepõem');
      folga = Math.min(folga, i.tl - a.tr);
    }
  });
  if (folga < 2) ruins.push('rótulos a ' + folga.toFixed(1) + ' px um do outro');
  if (br.left < -0.5 || br.right > innerWidth + 0.5 || br.bottom > innerHeight + 0.5) ruins.push('a barra sai da tela');
  if (document.documentElement.scrollWidth > innerWidth) ruins.push('a página rola de lado');
  return { ruins, rotulos: itens.map(i => i.texto).join(','), folga: Math.round(folga * 10) / 10,
    ativos: itens.filter(i => i.ativa).map(i => i.cel).join(','), atuais: itens.filter(i => i.atual === 'page').map(i => i.cel).join(',') };
});

const lerTrilho = pag => pag.evaluate(() => {
  const nav = document.querySelector('#abas');
  const r = nav.getBoundingClientRect();
  const filhos = Array.from(nav.children);
  const botoes = Array.from(nav.querySelectorAll('button'));
  const ruins = [];
  botoes.forEach(b => {
    const q = b.getBoundingClientRect();
    if (q.width < 48 || q.height < 48) ruins.push((b.dataset.tela || b.id) + ' com alvo de ' + Math.round(q.width) + 'x' + Math.round(q.height));
    if (q.left < r.left - 0.5 || q.right > r.right + 0.5) ruins.push((b.dataset.tela || b.id) + ' sai do trilho');
    const rot = b.querySelector('.nav-rotulo');
    if (rot) {
      const rg = document.createRange(); rg.selectNodeContents(rot);
      const t = rg.getBoundingClientRect();
      if (rot.scrollWidth > rot.clientWidth + 0.5 || t.left < q.left - 0.5 || t.right > q.right + 0.5) ruins.push(b.dataset.tela + ': o rótulo não cabe');
    }
  });
  for (let k = 1; k < botoes.length; k++) {
    if (botoes[k].getBoundingClientRect().top < botoes[k - 1].getBoundingClientRect().bottom - 0.5) ruins.push('itens do trilho se sobrepõem');
  }
  if (nav.scrollHeight > nav.clientHeight + 0.5) ruins.push('o trilho rola');
  if (document.documentElement.scrollWidth > innerWidth) ruins.push('a página rola de lado');
  const conteudo = document.querySelector('.conteudo').getBoundingClientRect();
  const cab = document.querySelector('.cabecalho').getBoundingClientRect();
  if (conteudo.left < r.right - 0.5 || cab.left < r.right - 0.5) ruins.push('o conteúdo fica por baixo do trilho');
  const mais = document.querySelector('#nav-marcar-aula');
  return {
    pos: getComputedStyle(nav).position, caixa: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)].join(','),
    alto: innerHeight,
    ordem: filhos.map(f => f.dataset.tela || f.id).join(','),
    rotulos: Array.from(nav.querySelectorAll('.aba')).map(b => b.textContent).join(','),
    maisNoAlto: Array.from(nav.querySelectorAll('.aba')).every(b => b.getBoundingClientRect().top >= mais.getBoundingClientRect().bottom),
    maisRotulo: mais.getAttribute('aria-label'),
    ajustesNoPe: Math.round(innerHeight - nav.querySelector('.aba[data-tela="ajustes"]').getBoundingClientRect().bottom),
    ativos: Array.from(nav.querySelectorAll('.aba.ativa')).map(b => b.dataset.tela).join(','),
    atuais: Array.from(nav.querySelectorAll('[aria-current="page"]')).map(b => b.dataset.tela).join(','),
    telas: Array.from(document.querySelectorAll('.tela.ativa')).map(t => t.id).join(','),
    ruins
  };
});

/* O que cobre o meio do trilho: a janela aberta tem de ficar por cima dele. */
const quemCobreOTrilho = pag => pag.evaluate(() => {
  const e = document.elementFromPoint(48, 400);
  if (!e) return 'nada';
  if (e.closest('#abas')) return 'trilho';
  const m = e.closest('.fundo-modal');
  return m ? m.id : (e.id || e.tagName);
});

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
async function tocarLinha(pag, nome) {
  return pag.evaluate(n => {
    const l = Array.from(document.querySelectorAll('#bib-corpo .item-lista')).find(x => x.querySelector('.nome').textContent.trim() === n);
    if (!l) return false;
    l.click();
    return true;
  }, nome);
}
const linhasDaBiblioteca = pag => pag.evaluate(() =>
  Array.from(document.querySelectorAll('#bib-corpo .item-lista .nome')).map(n => n.textContent.trim()).join(' | '));

async function semear(pag) {
  const hoje = await pag.evaluate(() => Core.hojeIso());
  await pag.evaluate(async (hoje) => {
    const d = await Store.carregar();
    d.alunos = [{ id: 'al_alfa', nome: 'Aluno Alfa Teste', ano: '6', anoEscolar: '6º ano do Ensino Fundamental', responsavel: 'Responsável Alfa',
      grade: 'quarta-feira, 10:00', vigencias: [{ id: 'v1', inicio: '2026-01-01', fim: '2027-12-31', valorHora: 100 }] }];
    d.aulas = [{ id: 'au1', alunoId: 'al_alfa', serieId: null, data: hoje, hora: '10:00', duracaoMin: 60, status: 'agendada', cobravel: true,
      notaTexto: '', notaPrivada: '', temNota: false, anexos: [] }];
    await Store.salvar(d);
  }, hoje);
}

async function abrirCelular(w, h) {
  const cel = await amb.pagina();
  await cel.setViewport({ width: w, height: h, hasTouch: true, isMobile: true });
  await cel.goto(amb.ORIGEM + '/index.html', { waitUntil: 'networkidle0' });
  await esperar('o celular abriu em Hoje', () => cel.evaluate(() => document.body.classList.contains('modo-celular') &&
    !!document.querySelector('#cel-hoje.ativa') && !document.querySelector('#cel-abas').hidden), v => v === true, 30000);
  await cel.evaluate(() => { const b = document.querySelector('#entendi-novidades'); if (b && document.querySelector('#modal-novidades.aberto')) b.click(); });
  await pausa(300);
  return cel;
}

(async () => {
  secao('0. A prova se confere');
  conf('a lista de venenos não está vazia', VENENOS.length > 0, true);
  conf('a âncora do veneno do rótulo aparece uma vez só no styles.css', CSS.split(ANCORA_ROTULO).length - 1, 1);
  if (VENENO_ROTULO) conf('o styles.css servido está envenenado', trocas['/styles.css'].indexOf(ANCORA_ROTULO) === -1, true);

  await amb.subir();
  const pag = await amb.pagina();
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  await H.abrirApp(pag, amb.ORIGEM);
  await semear(pag);
  await H.abrirApp(pag, amb.ORIGEM);

  if (VENENO_ROTULO) {
    secao('VENENO: a coluna da barra encolhe abaixo do rótulo');
    const cel = await abrirCelular(360, 780);
    await letra(cel, LETRA_130);
    await pausa(300);
    const m = await medirBarra(cel);
    console.log('   360 a 130%: ' + (m.ruins.join('; ') || 'nenhum defeito'));
    const visto = m.ruins.some(r => /rótulo (está cortado|sai do botão)/.test(r));
    conf('envenenado-rotulo-corta: a 360 px com 130% o rótulo estoura o botão (defeito detectado)', visto, true);
    if (visto) console.log('VENENO visto: o rótulo cortado foi detectado.');
    await H.fim(amb)();
    return;
  }

  // ================================================================
  secao('1. Tablet 1280x800: o trilho lateral');
  let t = await lerTrilho(pag);
  conf('o trilho é fixo, à esquerda, com 96 px e a altura inteira', t.pos + ' ' + t.caixa, 'fixed 0,0,96,' + t.alto);
  conf('a ordem: o "+" no alto, Agenda, Alunos, Biblioteca, Fechamento e Ajustes', t.ordem, 'nav-marcar-aula,agenda,alunos,biblioteca,fechamento,ajustes');
  conf('os rótulos são o texto de cada destino', t.rotulos, 'Agenda,Alunos,Biblioteca,Fechamento,Ajustes');
  conf('o "+" fica acima de todos os destinos', t.maisNoAlto, true);
  conf('o "+" se chama "Marcar aula"', t.maisRotulo, 'Marcar aula');
  conf('Ajustes fica no pé do trilho (a até 24 px do fim)', t.ajustesNoPe >= 0 && t.ajustesNoPe <= 24, true);
  conf('um ativo só, a Agenda, com aria-current', t.ativos + '|' + t.atuais, 'agenda|agenda');
  conf('alvos de 48 px, rótulos inteiros e nada transborda (' + (t.ruins.join('; ') || 'nada') + ')', t.ruins.length, 0);

  /* Ajustes é um item como os outros: ícone de traço 1,75 na grade 24, a
   * pílula de 56x32 e o alvo de 48 px (o painel cego viu "texto solto"). */
  const lerItem = tela => pag.evaluate(t => {
    const b = document.querySelector('#abas .aba[data-tela="' + t + '"]');
    const ind = b.querySelector('.nav-ind'), ico = ind && ind.querySelector('svg.nav-ico');
    const r = b.getBoundingClientRect(), q = ind ? ind.getBoundingClientRect() : { width: 0, height: 0 };
    return { ico: !!ico && ico.getAttribute('viewBox') === '0 0 24 24' && getComputedStyle(ico).strokeWidth === '1.75px' && ico.getBoundingClientRect().width === 20,
      pilula: Math.round(q.width) + 'x' + Math.round(q.height), alvo: r.width >= 48 && r.height >= 48,
      fundo: ind ? getComputedStyle(ind).backgroundColor : '', rotulo: getComputedStyle(b.querySelector('.nav-rotulo')).fontSize };
  }, tela);
  let aj = await lerItem('ajustes');
  const ag = await lerItem('agenda');
  conf('Ajustes tem o ícone de traço 1,75 na grade 24, como os outros', aj.ico, true);
  conf('Ajustes tem a mesma pílula, o mesmo rótulo e o alvo de 48 px', aj.pilula + ' ' + aj.rotulo + ' ' + aj.alvo, ag.pilula + ' ' + ag.rotulo + ' true');

  for (const tela of ['alunos', 'biblioteca', 'fechamento', 'ajustes', 'agenda']) {
    await pag.click('#abas .aba[data-tela="' + tela + '"]');
    await pausa(250);
    t = await lerTrilho(pag);
    conf('pelo trilho, ' + tela + ': a tela certa aparece e só ela fica ativa e atual', t.telas + '|' + t.ativos + '|' + t.atuais,
      'tela-' + tela + '|' + tela + '|' + tela);
    if (tela === 'ajustes') {
      aj = await lerItem('ajustes');
      conf('Ajustes ativo acende a pílula como os outros', aj.fundo, ag.fundo);
    }
  }

  await letra(pag, LETRA_130);
  await pausa(200);
  t = await lerTrilho(pag);
  conf('com a letra a 130%, os rótulos cabem no trilho e nada transborda (' + (t.ruins.join('; ') || 'nada') + ')', t.ruins.length, 0);
  await letra(pag, '');

  await pag.click('#nav-marcar-aula');
  const janela = await esperar('a janela de aula abriu pelo "+"', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 10000);
  conf('o "+" do trilho abre a mesma janela do "+ Nova aula"', janela.ok, true);
  conf('a janela fica por cima do trilho', await quemCobreOTrilho(pag), 'modal-aula');
  await pag.evaluate(() => document.querySelector('#modal-aula .fechar').click());
  await pausa(200);
  conf('fechada, nada mudou na agenda (a aula de teste segue uma só)', await pag.evaluate(async () => (await Store.carregar()).aulas.length), 1);

  // ================================================================
  secao('2. A Biblioteca pelo trilho, o Voltar e a tela cheia');
  const z9 = path.join(TMP, 'nono.zip'); Sintetico.gerar(z9);
  conf('importou o pacote sintético do 9º ano', /^Biblioteca importada\./.test(await importar(pag, z9)), true);
  await pag.click('#abas .aba[data-tela="biblioteca"]');
  await esperar('a lista de módulos', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .item-lista').length), v => v > 0, 10000);
  t = await lerTrilho(pag);
  conf('a Biblioteca abriu pelo trilho e é a atual', t.telas + '|' + t.atuais, 'tela-biblioteca|biblioteca');
  const modulos = await linhasDaBiblioteca(pag);
  conf('o módulo abre', await tocarLinha(pag, 'Equações do Segundo Grau'), true);
  await esperar('as listas do módulo', () => linhasDaBiblioteca(pag), v => /Soma e Produto/.test(v || ''), 10000);
  // o voltar da Biblioteca diz para onde volta ("‹ 9º ano"), como já dizia antes desta fatia
  conf('o módulo tem o botão de voltar escrito', await pag.evaluate(() => (document.querySelector('.bib-voltar') || {}).textContent || ''), '‹ 9º ano');
  conf('a lista do módulo abre', await tocarLinha(pag, 'Soma e Produto'), true);
  await esperar('os exercícios da lista', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .bib-cartao').length), v => v > 0, 10000);
  await pag.evaluate(() => document.querySelector('#bib-corpo .bib-cartao').click());
  const cheia = await esperar('a tela cheia do exercício', () => pag.evaluate(() =>
    document.querySelector('#modal-biblioteca').classList.contains('aberto')), v => v === true, 10000);
  conf('a tela cheia abre', cheia.ok, true);
  conf('a tela cheia fica por cima do trilho', await quemCobreOTrilho(pag), 'modal-biblioteca');
  await pag.click('#bib-fechar-visor');
  await pausa(200);
  conf('e fecha', await pag.$eval('#modal-biblioteca', e => e.classList.contains('aberto')), false);
  await pag.evaluate(() => document.querySelector('.bib-voltar').click());
  await pausa(200);
  await pag.evaluate(() => { const v = document.querySelector('.bib-voltar'); if (v) v.click(); });
  await esperar('de volta aos módulos', () => linhasDaBiblioteca(pag), v => v === modulos, 10000);
  conf('o Voltar volta à lista de módulos', await linhasDaBiblioteca(pag), modulos);

  // ================================================================
  secao('3. Celular: a barra de baixo com a Biblioteca');
  conf('o "+" de Hoje no celular é o de antes ("Marcar aula neste dia")',
    fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8').split("botaoDeAcaoCelular('marcar-aula', { class: 'cel-fab', id: 'cel-marcar-aula', 'aria-label': 'Marcar aula neste dia', texto: '+'").length - 1, 1);
  for (const [w, h, l] of [[360, 780, ''], [390, 844, ''], [412, 915, ''], [360, 780, LETRA_130], [390, 844, LETRA_130]]) {
    const nome = w + ' px' + (l ? ' com a letra a 130%' : '');
    const cel = await abrirCelular(w, h);
    await letra(cel, l);
    await pausa(250);
    const m = await medirBarra(cel);
    console.log('   ' + nome + ': rótulos a ' + m.folga + ' px um do outro no mais apertado');
    conf(nome + ': os destinos, na ordem', m.rotulos, 'Hoje,Alunos,Biblioteca,Fechamento,Enviar');
    conf(nome + ': um ativo só, Hoje, com aria-current', m.ativos + '|' + m.atuais, 'hoje|hoje');
    conf(nome + ': rótulos sem corte nem sobreposição, alvo de 48 px (' + (m.ruins.join('; ') || 'nada') + ')', m.ruins.length, 0);
    if (w === 412 && !l) {
      await cel.click('#cel-abas .cel-aba[data-cel="biblioteca"]');
      await pausa(250);
      const b = await cel.evaluate(() => ({ ativa: !!document.querySelector('#cel-biblioteca.ativa'), texto: document.querySelector('#cel-biblioteca').textContent }));
      conf('a Biblioteca abre pela barra', b.ativa, true);
      conf('e diz onde ficam os livros', /ficam no tablet/.test(b.texto), true);
      const m2 = await medirBarra(cel);
      conf('a Biblioteca passa a ser a única ativa e atual', m2.ativos + '|' + m2.atuais, 'biblioteca|biblioteca');
      await cel.click('#cel-abas .cel-aba[data-cel="hoje"]');
      await pausa(250);
      conf('e Hoje volta pela barra', await cel.evaluate(() => !!document.querySelector('#cel-hoje.ativa')), true);
    }
    await cel.close();
  }

  conf('nenhum erro de página', pag.errosDePagina.join(' | '), '');
  await H.fim(amb)();
})().catch(H.fim(amb));
