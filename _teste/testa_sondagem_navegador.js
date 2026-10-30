/* testa_sondagem_navegador.js
 *
 * C5a: a sondagem por ano de entrada, na tela de verdade. Dados fictícios
 * ("Aluno Alfa Teste", 1º ano do médio), um encontro de mapeamento hoje e um
 * mapeamento anterior com Pitágoras e "Vendo o desenho" marcados. A biblioteca
 * é o pacote sintético da sondagem (_pacote_sintetico.gerarSondagem): os
 * módulos do 9º ano com os nomes dos pacotes de verdade, recortes de
 * retângulos e nenhum enunciado. O 8º ano fica de fora de propósito.
 *
 * O que se prova:
 *   1. a sondagem do ano abre no encontro de mapeamento, com as sete lacunas
 *      prováveis do 1º médio, dois exercícios por lacuna, e o aviso de pacote
 *      que falta em fatoração (8º ano);
 *   2. editar: tirar um exercício e trocar outro;
 *   3. gerar a folha pelo caminho da biblioteca: a janela Gerar material abre
 *      com a aula do mapeamento escolhida e a Folha marcada; o PDF é anexado,
 *      a lista vira folha, e a sondagem NÃO vira assunto da aula;
 *   4. corrigir: certo, meio certo ou errado por exercício, a confirmação diz
 *      o que vai para o mapeamento, e só grava ao confirmar;
 *   5. a lacuna marcada com a evidência ("errou 1 de 1 item de equação do
 *      segundo grau na sondagem de dd/mm"), Pitágoras que já estava continua,
 *      e a de um acerto só não entra; "Vendo o desenho", marcado antes, ainda
 *      aparece no grupo que mudou de nome, e "Ouvindo" não;
 *   6. recarregar: banco e tela iguais;
 *   7. a cópia de segurança, pelos botões de Ajustes, leva a sondagem e a
 *      evidência: o banco perde as duas, a cópia volta, e elas voltam;
 *   8. nenhum erro de página.
 *
 * SALVAR_PRINTS=<pasta> guarda três prints: a sondagem aberta, a correção e
 * a lacuna marcada no mapeamento.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador');
const Sintetico = require('./_pacote_sintetico');

const amb = H.criarAmbiente(8861, 'nath_c5_sondagem', {});
const { secao, esperar, pausa } = H;
function conf(rotulo, obtido, esperado) {
  const a = JSON.stringify(obtido), b = JSON.stringify(esperado);
  const ok = a === b;
  if (ok) H.placar.passes++; else H.placar.falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + String(a).slice(0, 400) + ' | esperado: ' + b + ']'));
  return ok;
}
const SALVAR = process.env.SALVAR_PRINTS || '';

const ALUNO = 'aluno_c5_alfa';
const AULA = 'aula_c5_mapeamento';
function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
const HOJE = iso(new Date());
const MES_PASSADO = (() => { const d = new Date(); d.setDate(d.getDate() - 30); return iso(d); })();
const ddmm = s => s.slice(8, 10) + '/' + s.slice(5, 7);
const LACUNAS_EM1 = ['fatoracao', 'eq2', 'pitagoras', 'semelhanca', 'trigonometria', 'funcoes', 'conjuntos'];

async function semear(pag) {
  return pag.evaluate(async (d0) => {
    const d = await Store.carregar();
    d.alunos = (d.alunos || []).filter(a => a.id !== d0.ALUNO);
    const m = Core.mapeamentoNovo();
    m.id = 'map_c5_antes';
    m.data = d0.MES_PASSADO;
    m.anoEscolar = 'em1';
    m.marcados.lacunas = ['pitagoras'];
    m.marcados.aprende = ['visual'];
    d.alunos.push({ id: d0.ALUNO, nome: 'Aluno Alfa Teste', anoEscolar: 'em1', responsavel: 'Responsavel Alfa',
      ativo: true, cor: '#2E7D6B', precos: [{ id: 'p_c5', inicio: '2026-01-01', fim: null, valorHora: 100 }], mapeamentos: [m] });
    d.aulas = (d.aulas || []).filter(a => a.alunoId !== d0.ALUNO);
    d.aulas.push({ id: d0.AULA, alunoId: d0.ALUNO, serieId: null, destacada: false, data: d0.HOJE, hora: '10:00',
      duracaoMin: 60, status: 'realizada', cobravel: true, tipo: 'mapeamento', notaTexto: '', notaPrivada: '',
      temNota: false, anexos: [], areas: [], temas: [] });
    d.ajustes = d.ajustes || {};
    d.ajustes.ultimaCopia = d0.HOJE;
    await Store.salvar(d);
  }, { ALUNO, AULA, HOJE, MES_PASSADO });
}

const doBanco = pag => pag.evaluate(async (a) => {
  const d = await Store.carregar();
  const aluno = (d.alunos || []).find(x => x.id === a.ALUNO) || {};
  const aula = (d.aulas || []).find(x => x.id === a.AULA) || {};
  const m = Core.mapeamentoAtual(aluno);
  const s = (aluno.sondagens || [])[0] || null;
  return {
    sondagem: s, nSondagens: (aluno.sondagens || []).length,
    lacunas: m ? Core.marcadosDaMateria(m, 'matematica').lacunas.slice().sort() : null,
    evidencias: m && m.evidencias ? m.evidencias.lacunas || {} : {},
    nMapeamentos: (aluno.mapeamentos || []).length,
    anexos: (aula.anexos || []).map(x => x.nome), temas: (aula.temas || []).map(t => t.titulo), temNota: !!aula.temNota
  };
}, { ALUNO, AULA });

async function importar(pag, arquivo) {
  await H.irParaAba(pag, 'ajustes');
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar('importação', () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca'); return c ? c.innerText.trim() : '';
  }), v => /^Biblioteca importada\.|não foi importado/.test(v || ''), 60000);
  return r.valor || '';
}

async function abrirAulaDeHoje(pag) {
  await H.irParaAba(pag, 'agenda');
  for (let i = 0; i < 24; i++) {
    if (await pag.evaluate(h => !!document.querySelector('[data-dia="' + h + '"]'), HOJE)) break;
    await pag.click(i < 12 ? '#mes-seguinte' : '#mes-anterior');
    await pausa(120);
  }
  const ok = await pag.evaluate(h => {
    const alvo = Array.from(document.querySelectorAll('[data-dia="' + h + '"] .pilula')).find(p => p.textContent.indexOf('10:00') === 0);
    if (!alvo) return false; alvo.click(); return true;
  }, HOJE);
  const r = await esperar('encontro de mapeamento aberto', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto') && !!document.querySelector('#bloco-sondagem')), v => v === true, 8000);
  return ok && r.ok;
}

async function fecharModais(pag) {
  await pag.evaluate(() => {
    document.querySelectorAll('.fundo-modal.aberto').forEach(m => {
      const f = m.querySelector('.fechar') || m.querySelector('[data-fechar]');
      if (f) f.click();
    });
  });
  await pausa(400);
}

// o que a janela da sondagem mostra, por lacuna
const naSondagem = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#corpo-modal-sondagem .bloco-sondagem')).map(b => ({
  lacuna: b.dataset.lacuna,
  itens: Array.from(b.querySelectorAll('.item-sondagem')).map(i => i.dataset.item),
  aviso: (b.querySelector('.sondagem-sem-exercicio') || {}).textContent || ''
})));

async function tocarNoItem(pag, lacuna, k, classe) {
  return pag.evaluate((l, i, c) => {
    const b = document.querySelector('#corpo-modal-sondagem .bloco-sondagem[data-lacuna="' + l + '"]');
    const it = b && b.querySelectorAll('.item-sondagem')[i];
    const btn = it && it.querySelector('.' + c);
    if (!btn) return false; btn.click(); return true;
  }, lacuna, k, classe);
}

async function responder(pag, lacuna, respostas) {
  for (let k = 0; k < respostas.length; k++) {
    await pag.evaluate((l, i, r) => {
      const linhas = Array.from(document.querySelectorAll('#corpo-modal-sondagem .item-correcao[data-lacuna="' + l + '"]'));
      const b = linhas[i] && linhas[i].querySelector('.opcao-correcao[data-resposta="' + r + '"]');
      if (b) b.click();
    }, lacuna, k, respostas[k]);
    await pausa(60);
  }
}

async function printDe(pag, seletor, nome, folga) {
  if (!SALVAR) return;
  fs.mkdirSync(SALVAR, { recursive: true });
  // o aviso flutuante não entra no print: ele cobre a tela, e não é dela
  await pag.evaluate(() => { const a = document.querySelector('#aviso'); if (a) a.classList.remove('aberto'); });
  await pausa(500);
  const caixa = await pag.evaluate(s => {
    const r = document.querySelector(s).getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
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
  await H.abrirApp(pag, amb.ORIGEM);
  await semear(pag);
  await H.abrirApp(pag, amb.ORIGEM);
  const zip = path.join(os.tmpdir(), 'c5_sondagem_' + process.pid + '.zip');
  Sintetico.gerarSondagem(zip);
  const imp = await importar(pag, zip);
  conf('o pacote sintético da sondagem foi importado', /^Biblioteca importada\./.test(imp), true);
  try { fs.unlinkSync(zip); } catch (e) { /* já saiu */ }

  // ================================================================
  secao('1. A sondagem do ano abre no encontro de mapeamento');
  conf('o encontro de mapeamento abriu', await abrirAulaDeHoje(pag), true);
  const botao = await pag.evaluate(() => { const b = document.querySelector('#montar-sondagem'); return b ? b.textContent : ''; });
  conf('o botão diz o ano', botao, 'Montar a sondagem do 1º ano do médio');
  conf('o roteiro aponta para a sondagem pronta, e não para "montar uma lista curta"',
    await pag.evaluate(() => { const t = document.querySelector('#roteiro-mapeamento').textContent; return /sondagem do ano/.test(t) && !/lista curta/.test(t); }), true);
  await pag.click('#montar-sondagem');
  const aberta = await esperar('a sondagem montada', () => naSondagem(pag), v => Array.isArray(v) && v.length === 7, 15000);
  const blocos = aberta.valor || [];
  conf('as sete lacunas prováveis do 1º médio, na ordem da tabela', blocos.map(b => b.lacuna), LACUNAS_EM1);
  conf('dois exercícios por lacuna, nas seis que têm pacote', blocos.slice(1).map(b => b.itens.length), [2, 2, 2, 2, 2, 2]);
  conf('todos do degrau 1 da lista pronta (o ex:3 é degrau 2 e nunca entra)',
    blocos.every(b => b.itens.every(i => !/:ex:3$/.test(i))), true);
  conf('fatoração fica sem exercício', blocos[0].itens, []);
  conf('e a tela diz qual pacote falta', /falta importar o pacote do 8º ano da OBMEP/.test(blocos[0].aviso), true);
  conf('o total no rodapé', await pag.$eval('#sondagem-total', e => e.textContent), '12 exercícios na sondagem');
  conf('as miniaturas vêm do tablet', await esperar('miniaturas', () => pag.evaluate(() =>
    Array.from(document.querySelectorAll('#corpo-modal-sondagem .miniatura-sondagem')).filter(i => i.complete && i.naturalWidth > 0).length),
  v => v === 12, 10000).then(r => r.valor), 12);
  await printDe(pag, '#modal-sondagem .modal', '01_sondagem_aberta.png', 0);

  // ================================================================
  secao('2. Editar: tirar um exercício e trocar outro');
  const eq2Antes = blocos[1].itens.slice();
  await tocarNoItem(pag, 'eq2', 0, 'tirar-sondagem');
  let agora = await naSondagem(pag);
  conf('tirar: equação do 2º grau fica com o segundo exercício', agora[1].itens, [eq2Antes[1]]);
  conf('e o total desce para 11', await pag.$eval('#sondagem-total', e => e.textContent), '11 exercícios na sondagem');
  const pitAntes = agora[2].itens.slice();
  await tocarNoItem(pag, 'pitagoras', 0, 'trocar-sondagem');
  agora = await naSondagem(pag);
  conf('trocar: o primeiro de Pitágoras mudou, e o segundo ficou', [agora[2].itens[0] !== pitAntes[0], agora[2].itens[1]], [true, pitAntes[1]]);
  conf('o trocado veio da mesma lacuna, degrau 1', /^9ano:teorema-de-pitagoras-e-aplicacoes:.*:ex:[12]$/.test(agora[2].itens[0]), true);
  conf('nada gravado antes de gerar a folha', (await doBanco(pag)).nSondagens, 0);
  const itensFinais = [].concat.apply([], agora.map(b => b.itens));

  // ================================================================
  secao('3. Gerar a folha pelo caminho da biblioteca');
  await pag.click('#sondagem-gerar');
  await esperar('janela Gerar material', () => pag.$eval('#modal-bib-gerar', e => e.classList.contains('aberto')), v => v === true, 8000);
  const gerar = await pag.evaluate(a => ({
    aula: !!document.querySelector('#bib-gerar-aulas [data-aula="' + a + '"].escolhida'),
    folha: document.querySelector('#bib-gerar-folha').checked,
    titulo: document.querySelector('#bib-gerar-titulo').value,
    resumo: document.querySelector('#bib-gerar-resumo').textContent
  }), AULA);
  conf('a aula do mapeamento vem escolhida', gerar.aula, true);
  conf('e a Folha vem marcada', gerar.folha, true);
  conf('o título é Sondagem', gerar.titulo, 'Sondagem');
  conf('com os 11 exercícios', /^11 exercícios/.test(gerar.resumo), true);
  let g = await doBanco(pag);
  conf('a sondagem foi guardada no aluno, com os itens editados', g.sondagem && g.sondagem.itens.map(x => x.item), itensFinais);
  conf('cada item sabe a sua lacuna', g.sondagem && g.sondagem.itens.filter(x => x.lacuna === 'eq2').length, 1);
  await pag.click('#bib-gerar-anexar');
  const anexou = await esperar('anexado e folha aberta', () => Promise.all([doBanco(pag),
    pag.evaluate(() => document.querySelector('#modal-nota').classList.contains('aberto'))]),
  v => v && v[0].anexos.length > 0 && v[0].temNota && v[1] === true, 40000);
  conf('o PDF da sondagem foi anexado na aula', anexou.ok && anexou.valor[0].anexos.some(n => /^Sondagem/.test(n)), true);
  conf('e a lista abriu como folha da aula', anexou.ok && anexou.valor[0].temNota, true);
  conf('a sondagem NÃO virou assunto da aula', anexou.valor ? anexou.valor[0].temas : null, []);
  await pag.evaluate(() => document.querySelector('#modal-nota [data-fechar]').click());
  await esperar('folha fechada', () => pag.evaluate(() => !document.querySelector('#modal-nota').classList.contains('aberto')), v => v === true, 10000);

  // ================================================================
  secao('4. Corrigir, ver o que vai para o mapeamento, e só então gravar');
  conf('o encontro reabre', await abrirAulaDeHoje(pag), true);
  conf('o bloco diz que falta corrigir', /falta corrigir/.test(await pag.$eval('#resumo-sondagem', e => e.textContent)), true);
  await pag.click('#corrigir-sondagem');
  await esperar('a correção', () => pag.evaluate(() => document.querySelectorAll('#corpo-modal-sondagem .item-correcao').length), v => v === 11, 10000);
  conf('três opções por exercício, na ordem', await pag.evaluate(() =>
    Array.from(document.querySelector('#corpo-modal-sondagem .item-correcao').querySelectorAll('.opcao-correcao')).map(b => b.textContent)),
  ['Certo', 'Meio certo', 'Errado']);
  await responder(pag, 'eq2', ['errado']);
  await responder(pag, 'pitagoras', ['errado', 'errado']);
  await responder(pag, 'semelhanca', ['certo', 'errado']);
  await responder(pag, 'trigonometria', ['errado', 'meio']);
  await responder(pag, 'funcoes', ['certo', 'certo']);
  await responder(pag, 'conjuntos', ['meio', 'meio']);
  conf('a marca aparece no botão', await pag.evaluate(() =>
    document.querySelector('#corpo-modal-sondagem .item-correcao[data-lacuna="eq2"] .opcao-correcao.ativa').getAttribute('aria-pressed')), 'true');
  await printDe(pag, '#modal-sondagem .modal', '02_correcao_da_sondagem.png', 0);
  await pag.click('#sondagem-ver-resultado');
  const conf1 = await esperar('a confirmação', () => pag.evaluate(() => {
    const r = {};
    document.querySelectorAll('#sondagem-confirmacao .linha-confirmacao').forEach(l => { r[l.dataset.lacuna] = l.querySelector('.detalhe').textContent; });
    return r;
  }), v => v && Object.keys(v).length === 6, 5000);
  const c = conf1.valor || {};
  conf('equação do 2º grau: marca, com a evidência', c.eq2, 'marca a lacuna: errou 1 de 1 item de equação do segundo grau na sondagem de ' + ddmm(HOJE));
  conf('Pitágoras já estava marcada: a evidência entra junto', /^já estava marcada; a evidência entra junto: errou 2 de 2 itens/.test(c.pitagoras || ''), true);
  conf('semelhança, com um acerto: não marca', c.semelhanca, 'não marca (acertou 1 de 2)');
  conf('trigonometria, errado e meio certo: marca', /^marca a lacuna: errou 1 de 2 itens de trigonometria no triângulo retângulo na sondagem de \d\d\/\d\d, e 1 saiu meio certo$/.test(c.trigonometria || ''), true);
  conf('nada gravado antes de confirmar', [(await doBanco(pag)).lacunas, (await doBanco(pag)).sondagem.itens.every(x => !x.resposta)], [['pitagoras'], true]);
  await pag.click('#sondagem-gravar');
  g = (await esperar('gravado', () => doBanco(pag), v => v.lacunas && v.lacunas.length === 3, 8000)).valor;

  // ================================================================
  secao('5. A lacuna marcada no mapeamento, com a evidência');
  conf('as lacunas: Pitágoras ficou, entraram 2º grau e trigonometria', g.lacunas, ['eq2', 'pitagoras', 'trigonometria']);
  conf('a de um acerto só não entrou, nem as de meio certo e acerto', ['semelhanca', 'funcoes', 'conjuntos'].filter(l => g.lacunas.indexOf(l) >= 0), []);
  conf('no MESMO mapeamento, sem criar outro', g.nMapeamentos, 1);
  conf('a evidência gravada', (g.evidencias.eq2 || []).map(e => e.texto), ['errou 1 de 1 item de equação do segundo grau na sondagem de ' + ddmm(HOJE)]);
  conf('as respostas gravadas na sondagem', g.sondagem.itens.filter(x => x.lacuna === 'semelhanca').map(x => x.resposta), ['certo', 'errado']);
  conf('e a sondagem sabe o que marcou', g.sondagem.lacunasMarcadas.slice().sort(), ['eq2', 'pitagoras', 'trigonometria']);
  conf('o bloco do encontro diz corrigida', await esperar('resumo', () => pag.$eval('#resumo-sondagem', e => e.textContent),
    v => /corrigida em .*3 lacunas marcadas no mapeamento/.test(v || ''), 5000).then(r => r.ok), true);
  await pag.click('#abrir-mapeamento');
  await esperar('mapeamento aberto', () => pag.evaluate(() => document.querySelector('#modal-mapeamento').classList.contains('aberto')), v => v === true, 5000);
  const mapa = await pag.evaluate(() => {
    const lac = id => {
      const l = document.querySelector('[data-item="lacunas:' + id + '"]');
      return l ? { marcada: l.querySelector('input').checked, evidencia: (l.querySelector('.evidencia-lacuna') || {}).textContent || '' } : null;
    };
    const apr = document.querySelector('[data-grupo="aprende"]');
    let titulo = '';
    if (apr) { let h = apr.previousElementSibling; while (h && !h.querySelector('h3')) h = h.previousElementSibling; titulo = h ? h.querySelector('h3').textContent : ''; }
    return {
      eq2: lac('eq2'), pit: lac('pitagoras'), sem: lac('semelhanca'),
      novas: ['divisibilidade', 'expressoes', 'angulos', 'notacao-cientifica', 'conjuntos'].map(id => !!document.querySelector('[data-item="lacunas:' + id + '"]')),
      tituloAprende: titulo,
      visual: !!document.querySelector('[data-item="aprende:visual"] input:checked'),
      ouvindo: !!document.querySelector('[data-item="aprende:ouvindo"]'),
      voz: !!document.querySelector('[data-item="aprende:voz-alta"]')
    };
  });
  conf('a lacuna nova aparece marcada', mapa.eq2 && mapa.eq2.marcada, true);
  conf('com a evidência escrita embaixo', mapa.eq2 && mapa.eq2.evidencia, 'errou 1 de 1 item de equação do segundo grau na sondagem de ' + ddmm(HOJE));
  conf('Pitágoras continua marcada, agora com evidência', [mapa.pit.marcada, /^errou 2 de 2 itens de teorema de Pitágoras/.test(mapa.pit.evidencia)], [true, true]);
  conf('semelhança não marcada e sem evidência', [mapa.sem.marcada, mapa.sem.evidencia], [false, '']);
  conf('as cinco lacunas novas estão na lista', mapa.novas, [true, true, true, true, true]);
  conf('o grupo mudou de nome', mapa.tituloAprende, 'O que costuma funcionar com este aluno');
  conf('"Vendo o desenho", marcado antes, continua à mostra e marcado', mapa.visual, true);
  conf('"Ouvindo" saiu da oferta', mapa.ouvindo, false);
  conf('e as práticas com evidência entraram', mapa.voz, true);
  await pag.evaluate(() => document.querySelector('[data-item="lacunas:eq2"]').scrollIntoView({ block: 'center' }));
  await printDe(pag, '#modal-mapeamento .modal', '03_lacuna_marcada_no_mapeamento.png', 0);
  await fecharModais(pag);

  // ================================================================
  secao('6. Recarregar: banco e tela iguais');
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  g = await doBanco(pag);
  conf('no banco, depois de recarregar', [g.lacunas, (g.evidencias.eq2 || []).length, g.sondagem.itens.length], [['eq2', 'pitagoras', 'trigonometria'], 1, 11]);
  conf('o encontro reabre com a sondagem corrigida', await abrirAulaDeHoje(pag), true);
  conf('e o resumo diz', /11 exercícios de 6 lacunas; corrigida em/.test(await pag.$eval('#resumo-sondagem', e => e.textContent)), true);
  await pag.click('#abrir-sondagem');
  const reaberta = await esperar('a sondagem guardada reabre', () => naSondagem(pag), v => Array.isArray(v) && v.length === 6, 10000);
  conf('com os mesmos exercícios', [].concat.apply([], (reaberta.valor || []).map(b => b.itens)), itensFinais);
  await fecharModais(pag);

  // ================================================================
  secao('7. A cópia de segurança leva a sondagem e a evidência');
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => { window.__gerados = []; document.querySelector('#baixar-copia').click(); });
  await esperar('cópia pronta', () => pag.evaluate(() => document.querySelector('#aviso-texto').textContent), v => /Cópia pronta/.test(v || ''), 15000);
  await pag.evaluate(() => document.querySelector('#aviso-acao').click());
  const copia = await esperar('a cópia entregue', () => pag.evaluate(() => (window.__gerados || []).find(x => /\.json$/.test(x.nome)) || null), v => !!v, 10000);
  conf('a cópia saiu pelo botão', !!copia.valor, true);
  const pacote = JSON.parse(Buffer.from(copia.valor.base64, 'base64').toString('utf8'));
  const alunoNaCopia = (pacote.dados.alunos || []).find(a => a.id === ALUNO) || {};
  conf('o arquivo tem a sondagem, com as respostas', ((alunoNaCopia.sondagens || [])[0] || { itens: [] }).itens.filter(x => x.resposta).length, 11);
  conf('e a evidência no mapeamento', (((alunoNaCopia.mapeamentos || [])[0] || {}).evidencias || { lacunas: {} }).lacunas.eq2.length, 1);
  const arquivo = path.join(os.tmpdir(), 'c5_copia_' + process.pid + '.json');
  fs.writeFileSync(arquivo, Buffer.from(copia.valor.base64, 'base64'));
  await pag.evaluate(async (id) => {
    const d = await Store.carregar();
    const a = d.alunos.find(x => x.id === id);
    delete a.sondagens;
    a.mapeamentos.forEach(m => { delete m.evidencias; m.marcados.lacunas = ['pitagoras']; });
    await Store.salvar(d);
  }, ALUNO);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  g = await doBanco(pag);
  conf('controle: o banco ficou sem a sondagem e sem a evidência', [g.nSondagens, g.lacunas, Object.keys(g.evidencias).length], [0, ['pitagoras'], 0]);
  await H.irParaAba(pag, 'ajustes');
  const entrada = await pag.$('#arquivo-copia');
  await entrada.uploadFile(arquivo);
  await esperar('cópia restaurada', () => pag.evaluate(() => document.querySelector('#aviso-texto').textContent), v => /Cópia restaurada/.test(v || ''), 15000);
  g = await doBanco(pag);
  conf('restaurada, a sondagem volta', [g.nSondagens, g.sondagem && g.sondagem.itens.length], [1, 11]);
  conf('e as lacunas com a evidência', [g.lacunas, (g.evidencias.eq2 || []).map(e => e.texto)],
    [['eq2', 'pitagoras', 'trigonometria'], ['errou 1 de 1 item de equação do segundo grau na sondagem de ' + ddmm(HOJE)]]);
  try { fs.unlinkSync(arquivo); } catch (e) { /* já saiu */ }

  // ================================================================
  secao('8. Nenhum erro de página');
  conf('nenhum erro de página', pag.errosDePagina, []);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
