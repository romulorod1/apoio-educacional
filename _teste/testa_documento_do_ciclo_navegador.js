/* testa_documento_do_ciclo_navegador.js
 *
 * C9: o documento do ciclo, na tela de verdade. Dados fictícios ("Aluno Alfa
 * Teste") com três meses de aulas até hoje, um mapeamento com três pontos de
 * atenção e uma trilha ativa. Porta 8865.
 *
 * O que se prova:
 *   1. ANTES (o código da origin/main, servido no lugar do de hoje, com os
 *      mesmos dados): quantas janelas, avisos, faixas e diálogos abrem
 *      sozinhos ao abrir o aplicativo e ao abrir a ficha; e que o botão novo
 *      não existe lá (o "antes" é mesmo o código de antes);
 *   2. DEPOIS (o código de hoje): a mesma contagem, igual; a entrada é um
 *      botão comum na aba Histórico da ficha, sem cor de destaque;
 *   3. a janela abre com o rascunho das quatro seções, a prévia com as quatro
 *      e os pontos de atenção todos desmarcados; abrir sem mexer não grava;
 *   4. editar uma seção grava na hora; marcar um ponto grava;
 *   5. recarregar: o texto dela e a marca continuam, no banco e na tela;
 *   6. o texto e o PDF, pelos botões de verdade: as quatro seções, o texto
 *      dela, os rótulos de família, o ponto marcado (controle positivo: o
 *      instrumento vê) e nada interno (rótulo interno de área, ponto não
 *      marcado, notas da aula, dinheiro, travessão);
 *   7. a cópia de segurança, pelo botão de Ajustes, leva o ciclo;
 *   8. depois de tudo, abrir de novo não abre nada sozinho; nenhum diálogo
 *      nativo na rodada inteira; nenhum erro de página.
 *
 * SALVAR_PRINTS=<pasta> guarda três prints: a entrada na ficha, o editor das
 * quatro seções e a primeira página do PDF (rasterizada pelo PyMuPDF).
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const H = require('./_bib_navegador');
const Core = require('../core.js');

const RAIZ = path.join(__dirname, '..');
/* O código de antes, lido da origin/main. Os arquivos que esta mudança toca
 * são servidos de lá; o resto é o mesmo nos dois lados. */
function daMain(arquivo) {
  return execFileSync('git', ['-C', RAIZ, 'show', 'origin/main:' + arquivo], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}
const ANTES = {};
['app.js', 'core.js', 'pdf.js', 'index.html', 'styles.css'].forEach(a => { ANTES['/' + a] = daMain(a); });
const trocas = {};
const amb = H.criarAmbiente(8865, 'nath_c9_ciclo', trocas);
const { secao, esperar, pausa } = H;
function conf(rotulo, obtido, esperado) {
  const a = JSON.stringify(obtido), b = JSON.stringify(esperado);
  const ok = a === b;
  if (ok) H.placar.passes++; else H.placar.falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + String(a).slice(0, 300) + ' | esperado: ' + b + ']'));
  return ok;
}
const SALVAR = process.env.SALVAR_PRINTS || '';
const TRAVESSOES = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']');

const ALUNO = 'aluno_c9_alfa';
function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
const HOJE = iso(new Date());
const PERIODO = Core.periodoPadraoDoCiclo(HOJE);
// uma aula por semana, do começo do período até hoje
const DATAS = (() => {
  const l = [];
  const d = Core.dataLocal(PERIODO.inicio);
  while (iso(d) <= HOJE) { l.push(iso(d)); d.setDate(d.getDate() + 7); }
  return l;
})();
const AREAS = ['ansiedade', 'base', 'frustracao', 'disciplina'];
const FAMILIA = AREAS.map(id => Core.rotuloAreaFamilia(id));
const INTERNOS = AREAS.map(id => Core.rotuloArea(id));
const PONTOS = { vespera: 'Estuda só na véspera', chuta: 'Chuta sem tentar', sinal: 'Erros de sinal' };
const TEXTO_DELA = 'Neste ciclo ele ganhou segurança para começar a questão sem esperar ajuda.';

function textoDoPdf(base64) {
  const bruto = Buffer.from(base64, 'base64').toString('latin1');
  const rx = /\(((?:\\.|[^\\()])*)\)\s*Tj/g;
  const partes = [];
  let m;
  while ((m = rx.exec(bruto))) partes.push(m[1].replace(/\\([\\()])/g, '$1'));
  return partes.join(' ');
}

async function semear(pag) {
  return pag.evaluate(async (d0) => {
    const d = await Store.carregar() || { alunos: [], series: [], aulas: [], resumos: [], ajustes: {}, pagamentos: [] };
    d.alunos = (d.alunos || []).filter(a => a.id !== d0.ALUNO);
    d.alunos.push({
      id: d0.ALUNO, nome: 'Aluno Alfa Teste', anoEscolar: '06', responsavel: 'Responsavel Alfa', ativo: true, cor: '#2E7D6B',
      obs: 'OBS_SENTINELA', obsPedagogicas: 'OBSPED_SENTINELA',
      precos: [{ id: 'p_c9', inicio: '2026-01-01', fim: null, valorHora: 137 }],
      etapas: [{ id: 'e1', frente: 'autonomia', etapa: 'apoio-parcial', desde: d0.DATAS[0] },
        { id: 'e2', frente: 'autonomia', etapa: 'supervisao', desde: d0.DATAS[Math.floor(d0.DATAS.length / 2)] }],
      mapeamentos: [{ id: 'm_c9', data: d0.DATAS[0], aulaId: null, escola: '', anoEscolar: '06', anoEscolarOutro: '',
        prioridades: 'PRIORIDADE_SENTINELA', nivel: '', objetivo: { tipo: '', descricao: '', dataProva: '' },
        marcados: { fortes: [], atencao: ['vespera', 'chuta', 'sinal'], lacunas: ['fracoes'], rotina: [], aprende: [] }, porMateria: {} }],
      trilhas: [{ id: 'tr_c9', alunoId: d0.ALUNO, titulo: 'Operações com frações', alvoId: 'X', materia: 'matematica',
        criadaEm: d0.DATAS[0], origem: 'manual', encerradaEm: null, motivo: '',
        passos: [{ temaId: 'T1', titulo: 'Frações equivalentes', feitoEm: null, aulaId: null },
          { temaId: 'T2', titulo: 'Soma de frações', feitoEm: null, aulaId: null }] }]
    });
    d.aulas = (d.aulas || []).filter(a => a.alunoId !== d0.ALUNO);
    d0.DATAS.forEach((data, i) => {
      const temas = [{ id: 'T1', titulo: 'Frações equivalentes', fonte: 'banco', disciplina: 'matematica',
        dominio: i < d0.DATAS.length - 2 ? 'andamento' : 'domina' }];
      if (i % 2) temas.push({ id: 'T3', titulo: 'Porcentagem', fonte: 'banco', disciplina: 'matematica', dominio: 'andamento' });
      d.aulas.push({ id: 'a_c9_' + i, alunoId: d0.ALUNO, serieId: null, destacada: false, data: data, hora: '15:30',
        duracaoMin: 60, status: 'realizada', cobravel: true, temNota: false, anexos: [],
        notaTexto: 'RELATO_ALFA_SENTINELA', notaPrivada: 'NOTA_SO_MINHA_SENTINELA',
        temas: temas, areas: [d0.AREAS[i % d0.AREAS.length]] });
    });
    d.ajustes = d.ajustes || {};
    d.ajustes.ultimaCopia = d0.HOJE;
    await Store.salvar(d);
    return d.aulas.filter(a => a.alunoId === d0.ALUNO).length;
  }, { ALUNO, DATAS, AREAS, HOJE });
}

const doBanco = pag => pag.evaluate(async (id) => {
  const d = await Store.carregar();
  const a = (d.alunos || []).find(x => x.id === id);
  return a ? (a.ciclos || null) : 'sem aluno';
}, ALUNO);

/* O que está aberto sem ninguém ter pedido: janelas, o aviso flutuante e as
 * faixas visíveis. Os diálogos nativos são contados à parte, no evento. */
const abertosSozinhos = pag => pag.evaluate(() => {
  const visivel = e => !!(e.offsetParent || e.getClientRects().length) && getComputedStyle(e).visibility !== 'hidden';
  return {
    janelas: Array.from(document.querySelectorAll('.fundo-modal.aberto')).map(m => m.id).sort(),
    aviso: !!document.querySelector('#aviso.aberto'),
    faixas: Array.from(document.querySelectorAll('[class*="faixa"], [id*="faixa"]'))
      .filter(e => !e.closest('.fundo-modal') && visivel(e) && e.textContent.trim())
      .map(e => e.id || e.className).sort()
  };
});

async function abrirSemAjuda(pag) {
  await pag.goto(amb.ORIGEM + '/index.html', { waitUntil: 'networkidle0' });
  await esperar('o aplicativo abriu', () => pag.evaluate(() =>
    !!document.querySelector('#abas .aba') && typeof Store === 'object'), v => v === true, 40000);
  // o tempo de qualquer coisa que abra sozinha depois de carregar
  await pausa(3500);
}

async function fecharModais(pag) {
  await pag.evaluate(() => {
    document.querySelectorAll('.fundo-modal.aberto').forEach(m => {
      const f = m.querySelector('.fechar') || m.querySelector('[data-fechar]');
      if (f) f.click();
    });
  });
  await pausa(300);
}

async function abrirFicha(pag) {
  await fecharModais(pag);
  await H.irParaAba(pag, 'alunos');
  const abriu = await pag.evaluate(id => {
    const l = document.querySelector('#lista-alunos .item-lista[data-aluno="' + id + '"]');
    if (!l) return false; l.click(); return true;
  }, ALUNO);
  await esperar('ficha aberta', () => pag.evaluate(() => document.querySelector('#modal-aluno').classList.contains('aberto')), v => v === true, 5000);
  await pag.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#modal-aluno .aba-perfil')).find(x => x.textContent.trim() === 'Histórico');
    if (b) b.click();
  });
  await pausa(400);
  return abriu;
}

async function abrirCiclo(pag) {
  await abrirFicha(pag);
  await pag.evaluate(() => document.querySelector('#abrir-documento-ciclo').click());
  const r = await esperar('a janela do ciclo', () => pag.evaluate(() =>
    document.querySelector('#modal-documento-ciclo').classList.contains('aberto') && !!document.querySelector('#ciclo-texto-aconteceu')), v => v === true, 5000);
  return r.ok;
}

async function printDe(pag, seletor, nome, folga) {
  if (!SALVAR) return;
  fs.mkdirSync(SALVAR, { recursive: true });
  await pag.evaluate(s => { const e = document.querySelector(s); if (e) e.scrollIntoView({ block: 'start' }); }, seletor);
  await pausa(400);
  const caixa = await pag.evaluate(s => {
    const r = document.querySelector(s).getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: Math.min(r.height, window.innerHeight - Math.max(0, r.top)) };
  }, seletor);
  const f = folga || 0;
  await pag.screenshot({ path: path.join(SALVAR, nome), clip: {
    x: Math.max(0, caixa.x - f), y: Math.max(0, caixa.y - f), width: caixa.w + 2 * f, height: caixa.h + 2 * f } });
  console.log('       print: ' + path.join(SALVAR, nome));
}

(async () => {
  await amb.subir();
  const pag = await amb.pagina();
  await pag.setViewport({ width: 1280, height: 1000, hasTouch: true });
  /* Sem service worker: o "antes" e o "depois" são servidos pela mesma porta,
   * e o cache dele entregaria o código de um no lugar do outro. */
  await pag.setBypassServiceWorker(true);
  const dialogos = [];
  pag.on('dialog', d => dialogos.push(d.type() + ': ' + d.message()));
  await pag.evaluateOnNewDocument(() => {
    window.__gerados = [];
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    const criar = URL.createObjectURL.bind(URL);
    URL.createObjectURL = function (b) { window.__ultimoBlob = b; return criar(b); };
    const clicar = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.hasAttribute('download')) {
        const blob = window.__ultimoBlob;
        const nome = this.getAttribute('download');
        const leitor = new FileReader();
        leitor.onload = () => window.__gerados.push({ nome: nome, base64: leitor.result.split(',')[1] });
        leitor.readAsDataURL(blob);
        return;
      }
      return clicar.call(this);
    };
  });

  // ================================================================
  secao('1. ANTES: o código da origin/main, com os mesmos dados');
  Object.assign(trocas, ANTES);
  await abrirSemAjuda(pag);
  conf('três meses de aulas semeados (uma por semana)', await semear(pag), DATAS.length);
  await abrirSemAjuda(pag);
  const antesAoAbrir = await abertosSozinhos(pag);
  console.log('       antes, ao abrir: ' + JSON.stringify(antesAoAbrir));
  await abrirFicha(pag);
  const antesNaFicha = await abertosSozinhos(pag);
  conf('controle: no código de antes, o botão do ciclo não existe', await pag.evaluate(() => !!document.querySelector('#abrir-documento-ciclo')), false);
  const dialogosAntes = dialogos.length;

  // ================================================================
  secao('2. DEPOIS: o código de hoje, a mesma contagem');
  Object.keys(trocas).forEach(k => { delete trocas[k]; });
  await abrirSemAjuda(pag);
  conf('o código servido é o de hoje', await pag.evaluate(() => typeof Core.documentoDoCiclo), 'function');
  const depoisAoAbrir = await abertosSozinhos(pag);
  conf('ao abrir o aplicativo, abre sozinho o mesmo que antes', depoisAoAbrir, antesAoAbrir);
  await abrirFicha(pag);
  const depoisNaFicha = await abertosSozinhos(pag);
  conf('ao abrir a ficha, o mesmo que antes (só a ficha)', depoisNaFicha, antesNaFicha);
  conf('nenhum diálogo nativo até aqui, nos dois códigos', [dialogosAntes, dialogos.length], [0, 0]);
  const botao = await pag.evaluate(() => {
    const b = document.querySelector('#abrir-documento-ciclo');
    return b ? { texto: b.textContent.trim(), classe: b.className, naAba: !!b.closest('#modal-aluno'), visivel: !!b.offsetParent } : null;
  });
  conf('a entrada: o botão "Documento do ciclo", na ficha, visível na aba Histórico', botao && [botao.texto, botao.naAba, botao.visivel], ['Documento do ciclo', true, true]);
  conf('discreta: botão comum, sem a cor de ação principal', botao && botao.classe, 'btn pequeno');
  await printDe(pag, '#modal-aluno .modal', '01_entrada_na_ficha.png', 0);

  // ================================================================
  secao('3. A janela: o rascunho das quatro seções');
  conf('a janela do ciclo abriu pelo botão', await abrirCiclo(pag), true);
  const tela = await pag.evaluate(() => ({
    secoes: Array.from(document.querySelectorAll('#editor-ciclo .ciclo-texto')).map(t => ({ chave: t.dataset.secao, texto: t.value })),
    previa: Array.from(document.querySelectorAll('#conteudo-previa-doc-ciclo .previa-doc-secao-titulo')).map(x => x.textContent),
    pontos: Array.from(document.querySelectorAll('#ciclo-pontos .ciclo-ponto')).map(c => ({ id: c.dataset.ponto, marcado: c.checked }))
  }));
  conf('quatro seções, na ordem do roteiro', tela.secoes.map(s => s.chave), ['aconteceu', 'significa', 'atencao', 'proximo']);
  conf('cada uma com rascunho', tela.secoes.filter(s => s.texto.trim()).length, 4);
  const aconteceu = tela.secoes[0].texto;
  conf('o rascunho conta as aulas do período', aconteceu.indexOf('foram ' + DATAS.length + ' aulas.') >= 0, true);
  conf('e traz as habilidades e hábitos com o rótulo de família', FAMILIA.filter(f => aconteceu.indexOf(f) < 0), []);
  conf('e o que passou a ser dominado', aconteceu.indexOf('Passou a ser dominado: Frações equivalentes') >= 0, true);
  conf('a prévia mostra as quatro', tela.previa, ['O que aconteceu', 'O que isso significa', 'O que ainda pede atenção', 'Próximo ciclo']);
  conf('os três pontos de atenção, todos desmarcados', tela.pontos, [{ id: 'vespera', marcado: false }, { id: 'chuta', marcado: false }, { id: 'sinal', marcado: false }]);
  conf('a prévia não mostra ponto nenhum', await pag.evaluate(p => {
    const t = document.querySelector('#conteudo-previa-doc-ciclo').textContent;
    return p.filter(x => t.indexOf(x) >= 0);
  }, Object.values(PONTOS)), []);
  conf('abrir sem mexer não grava nada', await doBanco(pag), null);
  if (SALVAR) {
    // a janela inteira, com as quatro seções e os pontos, numa tela alta
    await pag.setViewport({ width: 1280, height: 2100, hasTouch: true });
    await pausa(300);
    await printDe(pag, '#modal-documento-ciclo .modal', '02_editor_das_quatro_secoes.png', 0);
    await pag.setViewport({ width: 1280, height: 1000, hasTouch: true });
  }

  // ================================================================
  secao('4. Editar uma seção e marcar um ponto');
  await pag.click('#ciclo-texto-significa', { clickCount: 3 });
  await pag.evaluate(() => { const t = document.querySelector('#ciclo-texto-significa'); t.select(); });
  await pag.keyboard.press('Backspace');
  await pag.type('#ciclo-texto-significa', TEXTO_DELA, { delay: 2 });
  let g = await esperar('o texto gravado', () => doBanco(pag), v => Array.isArray(v) && v[0].textos.significa === TEXTO_DELA, 6000);
  conf('o texto dela gravado em aluno.ciclos', g.valor && g.valor[0].textos.significa, TEXTO_DELA);
  conf('e a prévia mostra o texto', await pag.evaluate(t => document.querySelector('#conteudo-previa-doc-ciclo').textContent.indexOf(t) >= 0, TEXTO_DELA), true);
  await pag.evaluate(() => document.querySelector('#ciclo-pontos .ciclo-ponto[data-ponto="chuta"]').click());
  g = await esperar('o ponto gravado', () => doBanco(pag), v => Array.isArray(v) && (v[0].atencaoQueSai || []).join() === 'chuta', 6000);
  conf('o ponto marcado gravado', g.valor && g.valor[0].atencaoQueSai, ['chuta']);
  conf('e só ele na prévia', await pag.evaluate(p => {
    const t = document.querySelector('#conteudo-previa-doc-ciclo').textContent;
    return p.filter(x => t.indexOf(x) >= 0);
  }, Object.values(PONTOS)), [PONTOS.chuta]);

  // ================================================================
  secao('5. Recarregar: o texto dela e a marca continuam');
  await abrirSemAjuda(pag);
  const depoisDeGravar = await abertosSozinhos(pag);
  conf('com o ciclo guardado, ao abrir não abre nada novo', depoisDeGravar, antesAoAbrir);
  g = await doBanco(pag);
  conf('no banco, depois de recarregar', g && [g.length, g[0].textos.significa, g[0].atencaoQueSai], [1, TEXTO_DELA, ['chuta']]);
  conf('a janela reabre pela ficha', await abrirCiclo(pag), true);
  conf('na tela: o texto dela e a marca', await pag.evaluate(() => [
    document.querySelector('#ciclo-texto-significa').value,
    document.querySelector('#ciclo-pontos .ciclo-ponto[data-ponto="chuta"]').checked,
    document.querySelector('#ciclo-pontos .ciclo-ponto[data-ponto="vespera"]').checked]), [TEXTO_DELA, true, false]);

  // ================================================================
  secao('6. O texto e o PDF, pelos botões');
  await pag.evaluate(() => { window.__gerados = []; document.querySelector('#ciclo-baixar-texto').click(); });
  const md = await esperar('o texto', () => pag.evaluate(() => (window.__gerados || []).find(x => /\.md$/.test(x.nome)) || null), v => !!v, 8000);
  await pag.evaluate(() => { document.querySelector('#ciclo-baixar-pdf').click(); });
  const pdf = await esperar('o PDF', () => pag.evaluate(() => (window.__gerados || []).find(x => /\.pdf$/.test(x.nome)) || null), v => !!v, 15000);
  conf('os nomes dos arquivos', [md.valor && md.valor.nome, pdf.valor && pdf.valor.nome],
    ['Ciclo_Aluno_Alfa_Teste_' + PERIODO.inicio + '_a_' + PERIODO.fim + '.md', 'Ciclo_Aluno_Alfa_Teste_' + PERIODO.inicio + '_a_' + PERIODO.fim + '.pdf']);
  const saidas = {
    texto: md.valor ? Buffer.from(md.valor.base64, 'base64').toString('utf8') : '',
    PDF: pdf.valor ? textoDoPdf(pdf.valor.base64) : ''
  };
  const SENTINELAS = ['RELATO_ALFA_SENTINELA', 'NOTA_SO_MINHA_SENTINELA', 'OBS_SENTINELA', 'OBSPED_SENTINELA', 'PRIORIDADE_SENTINELA', 'R$', '137'];
  Object.keys(saidas).forEach(nome => {
    const t = saidas[nome];
    conf(nome + ': as quatro seções', ['O que aconteceu', 'O que isso significa', 'O que ainda pede atenção', 'Próximo ciclo'].filter(x => t.indexOf(x) < 0), []);
    conf(nome + ': o texto dela', t.indexOf(TEXTO_DELA) >= 0, true);
    conf(nome + ': os rótulos de família (o instrumento vê)', FAMILIA.filter(f => t.indexOf(f) < 0), []);
    conf(nome + ': nenhum rótulo interno de área', INTERNOS.filter(i => FAMILIA.indexOf(i) < 0 && t.indexOf(i) >= 0), []);
    conf(nome + ': o ponto marcado (o instrumento vê)', t.indexOf(PONTOS.chuta) >= 0, true);
    conf(nome + ': nenhum ponto não marcado', [PONTOS.vespera, PONTOS.sinal].filter(p => t.indexOf(p) >= 0), []);
    conf(nome + ': nada de nota, observação ou dinheiro', SENTINELAS.filter(s => t.indexOf(s) >= 0), []);
    conf(nome + ': sem travessão', TRAVESSOES.test(t), false);
  });
  conf('controle: a varredura acusa o rótulo interno quando ele está lá',
    INTERNOS.filter(i => FAMILIA.indexOf(i) < 0 && (saidas.texto + ' ' + INTERNOS[0]).indexOf(i) >= 0).length > 0, true);
  if (SALVAR && pdf.valor) {
    fs.mkdirSync(SALVAR, { recursive: true });
    const arq = path.join(os.tmpdir(), 'c9_ciclo_' + process.pid + '.pdf');
    fs.writeFileSync(arq, Buffer.from(pdf.valor.base64, 'base64'));
    const png = path.join(SALVAR, '03_pdf_primeira_pagina.png');
    execFileSync('python', ['-c', 'import sys, fitz; d = fitz.open(sys.argv[1]); d[0].get_pixmap(dpi=110).save(sys.argv[2])', arq, png]);
    console.log('       print: ' + png);
    try { fs.unlinkSync(arq); } catch (e) { /* já saiu */ }
  }

  // ================================================================
  secao('7. A cópia de segurança leva o ciclo');
  await fecharModais(pag);
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => { window.__gerados = []; document.querySelector('#baixar-copia').click(); });
  await esperar('cópia pronta', () => pag.evaluate(() => document.querySelector('#aviso-texto').textContent), v => /Cópia pronta/.test(v || ''), 15000);
  await pag.evaluate(() => document.querySelector('#aviso-acao').click());
  const copia = await esperar('a cópia entregue', () => pag.evaluate(() => (window.__gerados || []).find(x => /\.json$/.test(x.nome)) || null), v => !!v, 10000);
  const pacote = copia.valor ? JSON.parse(Buffer.from(copia.valor.base64, 'base64').toString('utf8')) : { dados: { alunos: [] } };
  const naCopia = ((pacote.dados.alunos || []).find(a => a.id === ALUNO) || {}).ciclos || [];
  conf('o arquivo da cópia tem o ciclo com o texto dela e a marca', naCopia.map(c => [c.textos.significa, c.atencaoQueSai]), [[TEXTO_DELA, ['chuta']]]);

  // ================================================================
  secao('8. Nada abre sozinho, nenhum diálogo, nenhum erro');
  await abrirSemAjuda(pag);
  conf('ao abrir de novo, o mesmo que antes', await abertosSozinhos(pag), antesAoAbrir);
  conf('nenhum diálogo nativo na rodada inteira', dialogos, []);

  /* O contador enxerga? Uma contagem vazia só prova alguma coisa se o mesmo
   * contador acusa o que abre sozinho de verdade: a faixa da cópia de
   * segurança (que aparece quando a última cópia passa de 14 dias), uma
   * janela e o aviso flutuante. */
  await pag.evaluate(async () => {
    const d = await Store.carregar();
    d.ajustes.ultimaCopia = '2020-01-01';
    await Store.salvar(d);
  });
  await abrirSemAjuda(pag);
  await pag.evaluate(() => {
    document.querySelector('#modal-documento-ciclo').classList.add('aberto');
    document.querySelector('#aviso').classList.add('aberto');
  });
  const controle = await abertosSozinhos(pag);
  conf('controle: o contador vê a faixa, a janela e o aviso que abrem sozinhos',
    [controle.faixas.indexOf('faixa-aviso') >= 0, controle.janelas, controle.aviso], [true, ['modal-documento-ciclo'], true]);
  conf('nenhum erro de página', pag.errosDePagina, []);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
