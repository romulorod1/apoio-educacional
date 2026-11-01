/* testa_pago_em.js
 *
 * C4: "pago em" no Fechamento, com navegador. Dados fictícios ("Aluno Alfa
 * Teste" e "Aluno Beta Teste"), meses vencidos (maio e junho de 2026), para a
 * prova não depender do dia em que roda.
 *
 * O que se prova, pela tela:
 *   1. o cartão oferece "Marcar como pago", e a lista de pendentes nasce
 *      recolhida, com quantas pendências e quanto falta no cabeçalho; abrir o
 *      Fechamento sem db.ajustes.pagamentosDesde grava o corte no mês
 *      corrente (nada pendente), e "Mudar" para um mês anterior faz aparecer
 *      o pendente daquele mês;
 *   2. marcar propõe o total a cobrar do mês e a data de hoje, e grava;
 *   3. trocar o valor ao marcar (pago a menos): a diferença aparece no cartão
 *      e continua na lista de pendentes;
 *   4. "Alterar" troca o valor do mesmo registro, sem criar outro;
 *   5. desmarcar tira o registro e o mês volta a ser pendente;
 *   6. o dado sobrevive a recarregar a página;
 *   7. a cópia de segurança, salva pelo botão de verdade, leva os pagamentos,
 *      e restaurá-la (pelo seletor de arquivo de verdade) traz de volta; uma
 *      cópia antiga, sem o campo, restaura sem quebrar;
 *   8. o documento da família, pelo "Preparar e enviar", NÃO cita pagamento:
 *      nem a janela, nem o PDF, nem o texto. A varredura prova antes que
 *      enxerga (acha o nome do aluno, e acusa uma frase de pagamento plantada).
 *
 * SALVAR_PRINTS=<pasta> guarda os três prints do aceite.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8859, 'nath_c4_pago_em');
const { conf, secao, esperar, pausa } = H;

const MES = '2026-06';
const ALFA = 'aluno_c4_alfa';
const BETA = 'aluno_c4_beta';

async function irAoFechamento(pag, mes) {
  await H.irParaAba(pag, 'fechamento');
  await pausa(300);
  await pag.evaluate((mes) => {
    const sel = document.querySelector('#mes-fechamento');
    sel.value = mes;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }, mes || MES);
  await pausa(400);
}

// a linha de pagamento do cartão de um aluno: texto e botões
function linha(pag, alunoId) {
  return pag.evaluate((id) => {
    const l = document.querySelector('#lista-fechamento .linha-pagamento[data-aluno="' + id + '"]');
    if (!l) return null;
    return {
      texto: l.textContent.replace(/\s+/g, ' ').trim(),
      feito: (l.querySelector('.pagamento-feito') || {}).textContent || '',
      falta: (l.querySelector('.pagamento-falta') || {}).textContent || '',
      botoes: Array.from(l.querySelectorAll('button')).map(b => b.textContent.trim()),
      valor: (l.querySelector('.pagamento-valor') || {}).value,
      data: (l.querySelector('.pagamento-data') || {}).value
    };
  }, alunoId);
}

function tocarNaLinha(pag, alunoId, seletor) {
  return pag.evaluate((id, sel) => {
    const b = document.querySelector('#lista-fechamento .linha-pagamento[data-aluno="' + id + '"] ' + sel);
    if (!b) return false;
    b.click();
    return true;
  }, alunoId, seletor);
}

async function preencherEConfirmar(pag, alunoId, valor, data) {
  await pag.evaluate((id, valor, data) => {
    const l = document.querySelector('#lista-fechamento .linha-pagamento[data-aluno="' + id + '"]');
    if (valor !== null) l.querySelector('.pagamento-valor').value = valor;
    if (data !== null) l.querySelector('.pagamento-data').value = data;
    l.querySelector('.btn-confirmar-pagamento').click();
  }, alunoId, valor, data);
  await pausa(400);
}

const pendentes = pag => pag.evaluate(() => {
  const c = document.querySelector('#pendentes-pagamento');
  const lista = document.querySelector('#lista-pendentes');
  return {
    resumo: (document.querySelector('#resumo-pendentes') || {}).textContent || '',
    vazio: !!document.querySelector('#pendentes-vazio'),
    aberta: !!lista && lista.style.display !== 'none',
    itens: Array.from(c.querySelectorAll('.pendente-pagamento')).map(i =>
      i.querySelector('.nome').textContent + ' | ' + i.dataset.mes + ' | ' + i.querySelector('.pendente-falta').textContent +
      ' | ' + i.querySelector('.detalhe').textContent)
  };
});

const doBanco = pag => pag.evaluate(async () => {
  const d = await Store.carregar();
  return (d.pagamentos || []).map(p => ({ id: p.id, alunoId: p.alunoId, mes: p.mes, pagoEm: p.pagoEm, valor: p.valor }))
    .sort((a, b) => (a.alunoId + a.mes).localeCompare(b.alunoId + b.mes));
});

async function printar(pag, seletor, nome) {
  if (!process.env.SALVAR_PRINTS) return;
  const alvo = await pag.$(seletor);
  if (!alvo) { console.log('   (print ' + nome + ': ' + seletor + ' não achado)'); return; }
  await pag.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center' }), seletor);
  await pausa(200);
  await alvo.screenshot({ path: path.join(process.env.SALVAR_PRINTS, nome + '.png') });
}

function textoDoPdf(bytes) {
  const bruto = Buffer.from(bytes).toString('latin1');
  const rx = /\(((?:\\.|[^\\()])*)\)\s*Tj/g;
  const partes = [];
  let m;
  while ((m = rx.exec(bruto))) partes.push(m[1].replace(/\\([\\()])/g, '$1'));
  return partes.join(' ');
}

/* O que não pode aparecer no documento da família: a palavra, o valor que só
 * o pagamento tem (187,35) e a data dele (08/07). */
function citaPagamento(texto) {
  const achados = [];
  if (/\bpag[oa]s?\b|pagamento|pendente|pendência/i.test(texto)) achados.push('palavra');
  if (texto.indexOf('187,35') >= 0) achados.push('valor');
  if (texto.indexOf('08/07') >= 0) achados.push('data');
  return achados;
}

(async () => {
  await amb.subir();
  const pag = await amb.pagina();
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  await H.abrirApp(pag, amb.ORIGEM);

  // Só os dois alunos fictícios: a carga inicial tem nomes reais e fica de fora dos prints.
  await pag.evaluate(async (ALFA, BETA) => {
    const d = await Store.carregar();
    const preco = (id, v) => [{ id: id, inicio: '2026-01-01', fim: null, valorHora: v }];
    d.alunos = [
      { id: ALFA, nome: 'Aluno Alfa Teste', ano: '9', anoEscolar: '9º ano do Ensino Fundamental',
        responsavel: 'Responsavel Alfa', grade: 'quarta-feira, 14:00', precos: preco('v_c4_a', 100) },
      { id: BETA, nome: 'Aluno Beta Teste', ano: '7', anoEscolar: '7º ano do Ensino Fundamental',
        responsavel: 'Responsavel Beta', grade: 'sexta-feira, 10:00', precos: preco('v_c4_b', 120) }
    ];
    d.series = [];
    d.aulas = [
      { id: 'aula_c4_a1', alunoId: ALFA, data: '2026-06-03', hora: '14:00', duracaoMin: 60, status: 'realizada', cobravel: true, assunto: 'Equações' },
      { id: 'aula_c4_a2', alunoId: ALFA, data: '2026-06-10', hora: '14:00', duracaoMin: 60, status: 'realizada', cobravel: true, assunto: 'Frações' },
      { id: 'aula_c4_b0', alunoId: BETA, data: '2026-05-08', hora: '10:00', duracaoMin: 60, status: 'realizada', cobravel: true, assunto: 'Leitura' },
      { id: 'aula_c4_b1', alunoId: BETA, data: '2026-06-05', hora: '10:00', duracaoMin: 90, status: 'realizada', cobravel: true, assunto: 'Leitura' }
    ];
    d.resumos = [
      { alunoId: ALFA, mes: '2026-06', texto: 'Bom mês para o Alfa.' },
      { alunoId: BETA, mes: '2026-06', texto: 'Bom mês para o Beta.' }
    ];
    d.pagamentos = [];
    await Store.salvar(d);
  }, ALFA, BETA);
  await H.abrirApp(pag, amb.ORIGEM);

  // nada sai do aparelho: sem compartilhar, e cada download é pego com o nome
  const prenderSaidas = () => pag.evaluate(() => {
    navigator.canShare = () => false;
    window.__saidas = [];
    let ultimo = null;
    const criar = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (b) => { ultimo = b; return criar(b); };
    HTMLAnchorElement.prototype.click = function () {
      if (this.hasAttribute('download') && ultimo) window.__saidas.push({ nome: this.getAttribute('download'), blob: ultimo });
    };
  });
  await prenderSaidas();
  const saidas = () => pag.evaluate(async () => {
    const lista = window.__saidas.splice(0);
    const out = [];
    for (const s of lista) {
      const bytes = new Uint8Array(await s.blob.arrayBuffer());
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      out.push({ nome: s.nome, tipo: s.blob.type, latin1: bin });
    }
    return out;
  });
  const hoje = await pag.evaluate(() => Core.hojeIso());
  const ddmmHoje = hoje.slice(8, 10) + '/' + hoje.slice(5, 7);

  // ================================================================
  secao('1. O cartão oferece "Marcar como pago"; os pendentes nascem recolhidos');
  await irAoFechamento(pag);
  let la = await linha(pag, ALFA);
  conf('Alfa: a linha de pagamento existe no cartão', !!la, true);
  conf('Alfa: só o botão "Marcar como pago"', la && la.botoes.join(' | '), 'Marcar como pago');
  conf('Alfa: nada de "Pago em" ainda', la && la.texto.includes('Pago em'), false);
  let pe = await pendentes(pag);
  conf('pendentes: nasce recolhida', pe.aberta, false);

  // o corte: abrir o Fechamento sem o campo grava o mês corrente, e aí nada é pendente
  const mesHoje = hoje.slice(0, 7);
  const corteGravado = () => pag.evaluate(async () => ((await Store.carregar()).ajustes || {}).pagamentosDesde || null);
  conf('abrir o Fechamento sem o campo gravou o corte no mês corrente', await corteGravado(), mesHoje);
  conf('com o corte no mês corrente, nada pendente (maio e junho já pagos antes do app)', pe.resumo, 'nada pendente');
  const abrirLista = () => pag.evaluate(() => {
    const l = document.querySelector('#lista-pendentes');
    if (l && l.style.display === 'none') document.querySelector('#abrir-pendentes-pagamento').click();
  });
  await abrirLista();
  const textoDoCorte = () => pag.evaluate(() => (document.querySelector('#lista-pendentes .texto-corte') || {}).textContent || '');
  conf('a lista diz desde quando controla', await textoDoCorte(),
    'Controlando a partir de ' + await pag.evaluate(m => Core.mesExtenso(m), mesHoje));
  const mudarCorte = async (mes) => {
    const ok = await pag.evaluate(() => { const b = document.querySelector('#mudar-corte-pagamentos'); if (!b) return false; b.click(); return true; });
    const temMes = await pag.evaluate((mes) => {
      const sel = document.querySelector('#corte-pagamentos');
      if (!sel || !Array.from(sel.options).some(o => o.value === mes)) return false;
      sel.value = mes;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }, mes);
    await pausa(300);
    return ok && temMes;
  };
  conf('"Mudar" para junho', await mudarCorte('2026-06'), true);
  pe = await pendentes(pag);
  conf('junho passa a ter pendência; maio, antes do corte, não', pe.resumo, '2 pendências · R$ 380,00');
  conf('e o corte foi gravado', await corteGravado(), '2026-06');
  conf('a linha do corte acompanha', await textoDoCorte(), 'Controlando a partir de Junho de 2026');
  conf('"Mudar" para maio', await mudarCorte('2026-05'), true);
  pe = await pendentes(pag);
  conf('pendentes: três (Alfa em junho, Beta em maio e em junho), R$ 500,00', pe.resumo, '3 pendências · R$ 500,00');
  await pag.evaluate(() => document.querySelector('#abrir-pendentes-pagamento').click());
  conf('Esconder recolhe de novo', (await pendentes(pag)).aberta, false);
  conf('pendentes: do mês mais antigo para o mais novo', pe.itens.map(i => i.split(' | ').slice(0, 3).join(' | ')), [
    'Aluno Beta Teste | 2026-05 | R$ 120,00',
    'Aluno Alfa Teste | 2026-06 | R$ 200,00',
    'Aluno Beta Teste | 2026-06 | R$ 180,00'
  ]);
  await printar(pag, '#lista-fechamento .cartao', '1_cartao_marcar_como_pago');

  // ================================================================
  secao('2. Marcar: o valor proposto é o total a cobrar, a data é hoje');
  conf('tocou em "Marcar como pago"', await tocarNaLinha(pag, ALFA, '.btn-marcar-pago'), true);
  la = await linha(pag, ALFA);
  conf('valor proposto: o total do mês, com vírgula', la.valor, '200,00');
  conf('data proposta: hoje', la.data, hoje);
  conf('com Confirmar e Cancelar', la.botoes.join(' | '), 'Confirmar | Cancelar');
  await preencherEConfirmar(pag, ALFA, null, null);
  la = await linha(pag, ALFA);
  conf('o cartão diz "Pago em dd/mm · R$ 200,00"', la.feito, 'Pago em ' + ddmmHoje + ' · R$ 200,00');
  conf('sem diferença', la.falta, '');
  conf('com Alterar e Desmarcar', la.botoes.join(' | '), 'Alterar | Desmarcar');
  let banco = await doBanco(pag);
  conf('gravou um registro, no formato combinado', banco.map(p => [p.alunoId, p.mes, p.pagoEm, p.valor]), [[ALFA, MES, hoje, 200]]);
  pe = await pendentes(pag);
  conf('o Alfa saiu dos pendentes', pe.resumo, '2 pendências · R$ 300,00');
  await printar(pag, '#lista-fechamento .cartao', '2_cartao_pago');

  // ================================================================
  secao('3. Trocar o valor ao marcar: pago a menos fica pendente, com a diferença');
  conf('tocou em "Marcar como pago" do Beta', await tocarNaLinha(pag, BETA, '.btn-marcar-pago'), true);
  conf('o proposto do Beta é o total dele', (await linha(pag, BETA)).valor, '180,00');
  await preencherEConfirmar(pag, BETA, '150,50', '2026-07-07');
  let lb = await linha(pag, BETA);
  conf('Beta: "Pago em 07/07 · R$ 150,50"', lb.feito, 'Pago em 07/07 · R$ 150,50');
  conf('Beta: e a diferença dita no cartão', lb.falta, 'faltam R$ 29,50');
  banco = await doBanco(pag);
  conf('gravou 150.5 (duas casas, sem resto)', banco.filter(p => p.alunoId === BETA).map(p => p.valor), [150.5]);
  pe = await pendentes(pag);
  conf('pendentes: o Beta de junho continua, só com a diferença', pe.resumo, '2 pendências · R$ 149,50');
  conf('tocou em Mostrar', await pag.evaluate(() => { const b = document.querySelector('#abrir-pendentes-pagamento'); if (!b) return false; b.click(); return true; }), true);
  pe = await pendentes(pag);
  conf('a lista abriu', pe.aberta, true);
  conf('a lista, com o pago a menos explicado', pe.itens, [
    'Aluno Beta Teste | 2026-05 | R$ 120,00 | Sem pagamento marcado.',
    'Aluno Beta Teste | 2026-06 | faltam R$ 29,50 | Pagou R$ 150,50 em 07/07, de R$ 180,00.'
  ]);
  await printar(pag, '#pendentes-pagamento', '3_pendentes_aberta');

  // ================================================================
  secao('4. "Alterar" troca o valor do mesmo registro');
  const idBeta = banco.filter(p => p.alunoId === BETA)[0].id;
  conf('tocou em Alterar', await tocarNaLinha(pag, BETA, '.btn-alterar-pagamento'), true);
  lb = await linha(pag, BETA);
  conf('o campo traz o valor pago, e não o proposto', lb.valor, '150,50');
  conf('e a data do pagamento', lb.data, '2026-07-07');
  await preencherEConfirmar(pag, BETA, 'abc', null);
  conf('valor que não é valor não grava', (await doBanco(pag)).filter(p => p.alunoId === BETA).map(p => p.valor), [150.5]);
  conf('e o aviso diz o que escrever', await pag.$eval('#aviso-texto', e => e.textContent), 'Escreva o valor pago, por exemplo 150,00.');
  await preencherEConfirmar(pag, BETA, '180,00', null);
  lb = await linha(pag, BETA);
  conf('Beta: "Pago em 07/07 · R$ 180,00", sem diferença', [lb.feito, lb.falta], ['Pago em 07/07 · R$ 180,00', '']);
  banco = await doBanco(pag);
  conf('o mesmo registro (mesmo id), um só', banco.filter(p => p.alunoId === BETA).map(p => [p.id === idBeta, p.valor]), [[true, 180]]);
  pe = await pendentes(pag);
  conf('pendentes: só o Beta de maio', pe.resumo, '1 pendência · R$ 120,00');

  // ================================================================
  secao('5. Desmarcar');
  conf('tocou em Desmarcar do Alfa', await tocarNaLinha(pag, ALFA, '.btn-desmarcar-pagamento'), true);
  await pausa(300);
  la = await linha(pag, ALFA);
  conf('o cartão volta a oferecer "Marcar como pago"', la.botoes.join(' | '), 'Marcar como pago');
  banco = await doBanco(pag);
  conf('o registro saiu do banco', banco.map(p => p.alunoId), [BETA]);
  pe = await pendentes(pag);
  conf('o Alfa volta aos pendentes', pe.resumo, '2 pendências · R$ 320,00');
  // de novo, com valor e data próprios, para a varredura do documento da família
  await tocarNaLinha(pag, ALFA, '.btn-marcar-pago');
  await preencherEConfirmar(pag, ALFA, '187,35', '2026-07-08');
  conf('Alfa marcado de novo, a menos', (await linha(pag, ALFA)).feito, 'Pago em 08/07 · R$ 187,35');

  // ================================================================
  secao('6. Sobrevive a recarregar');
  await H.abrirApp(pag, amb.ORIGEM);
  await prenderSaidas();
  await irAoFechamento(pag);
  conf('Alfa depois de recarregar', (await linha(pag, ALFA)).feito, 'Pago em 08/07 · R$ 187,35');
  conf('Beta depois de recarregar', (await linha(pag, BETA)).feito, 'Pago em 07/07 · R$ 180,00');
  pe = await pendentes(pag);
  conf('pendentes depois de recarregar (e a lista nasce recolhida de novo)', [pe.resumo, pe.aberta], ['2 pendências · R$ 132,65', false]);
  conf('o corte escolhido sobrevive a recarregar', await corteGravado(), '2026-05');

  // ================================================================
  secao('7. A cópia de segurança leva os pagamentos, e restaurar traz de volta');
  const esperado = await doBanco(pag);
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => document.querySelector('#baixar-copia').click());
  await esperar('a cópia pronta', () => pag.evaluate(() => {
    const b = document.querySelector('#aviso-acao');
    return !!b && b.style.display !== 'none' && b.textContent === 'Enviar';
  }), v => v === true, 15000);
  await pag.evaluate(() => document.querySelector('#aviso-acao').click());
  await esperar('o arquivo da cópia', () => pag.evaluate(() => window.__saidas.length), v => v >= 1, 15000);
  const copia = (await saidas())[0];
  conf('saiu a cópia no formato esperado', !!copia && /\.(json|zip)$/.test(copia.nome), true);
  let pacote;
  if (copia && /\.zip$/.test(copia.nome)) {
    pacote = await pag.evaluate(async (latin1) => {
      const u8 = new Uint8Array(latin1.length);
      for (let i = 0; i < latin1.length; i++) u8[i] = latin1.charCodeAt(i) & 0xff;
      const aberto = await Zip.lerDoArquivo(new Blob([u8]));
      const mapa = Object.fromEntries(aberto.entradas.map(e => [e.nome, e]));
      const dados = JSON.parse(new TextDecoder().decode(await Zip.extrairDoArquivo(aberto, mapa['dados.json'])));
      return { formato: 'apoio-educacional', versao: 1, dados, notas: {}, midias: {}, anexos: {} };
    }, copia.latin1);
  } else {
    pacote = JSON.parse(Buffer.from((copia || {}).latin1 || '', 'latin1').toString('utf8'));
  }
  conf('a cópia leva db.pagamentos, com os dois registros',
    (pacote.dados.pagamentos || []).map(p => [p.alunoId, p.mes, p.pagoEm, p.valor]).sort(),
    esperado.map(p => [p.alunoId, p.mes, p.pagoEm, p.valor]).sort());

  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'c4_copia_'));
  const ext = (copia && /\.zip$/.test(copia.nome)) ? '.zip' : '.json';
  const arqCopia = path.join(pasta, 'copia' + ext);
  fs.writeFileSync(arqCopia, Buffer.from(copia.latin1, 'latin1'));
  // apaga os pagamentos pela tela, e restaura a cópia pelo seletor de verdade
  await irAoFechamento(pag);
  await tocarNaLinha(pag, ALFA, '.btn-desmarcar-pagamento');
  await pausa(200);
  await tocarNaLinha(pag, BETA, '.btn-desmarcar-pagamento');
  await pausa(300);
  conf('antes de restaurar, o banco está sem pagamentos', (await doBanco(pag)).length, 0);
  await H.irParaAba(pag, 'ajustes');
  const entrada = await pag.$('#arquivo-copia');
  await entrada.uploadFile(arqCopia);
  await esperar('a cópia restaurada', () => pag.$eval('#aviso-texto', e => e.textContent), v => /Cópia restaurada/.test(v || ''), 15000);
  conf('depois de restaurar, os pagamentos voltam ao banco', (await doBanco(pag)).map(p => [p.alunoId, p.valor]),
    esperado.map(p => [p.alunoId, p.valor]));
  await irAoFechamento(pag);
  conf('e à tela', [(await linha(pag, ALFA)).feito, (await linha(pag, BETA)).feito],
    ['Pago em 08/07 · R$ 187,35', 'Pago em 07/07 · R$ 180,00']);

  // uma cópia de antes do "pago em": sem o campo
  const antigo = JSON.parse(JSON.stringify(pacote));
  delete antigo.dados.pagamentos;
  const arqAntigo = path.join(pasta, 'copia_antiga.json');
  fs.writeFileSync(arqAntigo, JSON.stringify(antigo));
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => { document.querySelector('#aviso-texto').textContent = ''; });
  await (await pag.$('#arquivo-copia')).uploadFile(arqAntigo);
  await esperar('a cópia antiga restaurada', () => pag.$eval('#aviso-texto', e => e.textContent), v => /Cópia restaurada/.test(v || ''), 15000);
  await irAoFechamento(pag);
  conf('cópia antiga: o Fechamento abre, com "Marcar como pago" nos dois',
    [(await linha(pag, ALFA)).botoes.join(','), (await linha(pag, BETA)).botoes.join(','),], ['Marcar como pago', 'Marcar como pago']);
  conf('cópia antiga: pendentes, tudo', (await pendentes(pag)).resumo, '3 pendências · R$ 500,00');
  conf('cópia antiga: o banco lê como lista vazia', await pag.evaluate(async () => {
    const d = await Store.carregar();
    return Array.isArray(d.pagamentos) && d.pagamentos.length;
  }), 0);
  // de volta à cópia com pagamentos, para a seção 8
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => { document.querySelector('#aviso-texto').textContent = ''; });
  await (await pag.$('#arquivo-copia')).uploadFile(arqCopia);
  await esperar('a cópia restaurada de novo', () => pag.$eval('#aviso-texto', e => e.textContent), v => /Cópia restaurada/.test(v || ''), 15000);
  fs.rmSync(pasta, { recursive: true, force: true });

  // "Voltar a este ponto": o ponto guarda o documento inteiro, pagamentos junto
  await pag.evaluate(async () => { await Store.registrarHistorico('Ponto do teste C4', await Store.carregar()); });
  await irAoFechamento(pag);
  await tocarNaLinha(pag, ALFA, '.btn-desmarcar-pagamento');
  await pausa(300);
  conf('desmarcado depois do ponto', (await doBanco(pag)).map(p => p.alunoId), [BETA]);
  await H.irParaAba(pag, 'ajustes');
  await pausa(400);
  await pag.evaluate(() => { document.querySelector('#aviso-texto').textContent = ''; });
  conf('tocou em "Voltar a este ponto"', await pag.evaluate(() => {
    const it = Array.from(document.querySelectorAll('#lista-historico .item-lista'))
      .find(x => x.querySelector('.nome') && x.querySelector('.nome').textContent === 'Ponto do teste C4');
    const b = it && Array.from(it.querySelectorAll('button')).find(x => x.textContent.trim() === 'Voltar a este ponto');
    if (!b) return false;
    b.click();
    return true;
  }), true);
  await esperar('o estado restaurado', () => pag.$eval('#aviso-texto', e => e.textContent), v => /Estado restaurado/.test(v || ''), 15000);
  conf('o ponto devolve o pagamento ao banco', (await doBanco(pag)).map(p => [p.alunoId, p.valor]), esperado.map(p => [p.alunoId, p.valor]));
  await irAoFechamento(pag);
  conf('e à tela', (await linha(pag, ALFA)).feito, 'Pago em 08/07 · R$ 187,35');

  // ================================================================
  secao('8. O documento da família não cita pagamento');
  conf('a varredura acusa uma frase de pagamento plantada', citaPagamento('Pago em 08/07 · R$ 187,35'), ['palavra', 'valor', 'data']);
  conf('e não acusa um documento sem ela', citaPagamento('Aluno Alfa Teste, junho, R$ 200,00'), []);
  await irAoFechamento(pag);
  conf('o Alfa está pago neste momento (a varredura tem o que achar)', (await linha(pag, ALFA)).feito, 'Pago em 08/07 · R$ 187,35');
  await saidas();
  conf('abriu a janela pelo "Preparar e enviar"', await pag.evaluate(() => {
    const c = Array.from(document.querySelectorAll('#lista-fechamento .cartao')).find(x => x.textContent.includes('Aluno Alfa Teste'));
    const b = c && c.querySelector('.btn-preparar-doc');
    if (!b) return false;
    b.click();
    return document.querySelector('#modal-documento-familia').classList.contains('aberto');
  }), true);
  const janela = await pag.$eval('#modal-documento-familia', e => e.textContent);
  conf('a janela mostra o documento (o instrumento vê)', janela.includes('Aluno Alfa Teste') && janela.includes('R$ 200,00'), true);
  conf('a janela não cita pagamento', citaPagamento(janela), []);

  await pag.evaluate(() => Array.from(document.querySelectorAll('#rodape-modal-doc-familia button'))
    .find(b => b.textContent.trim() === 'PDF do fechamento').click());
  await esperar('o PDF do fechamento', () => pag.evaluate(() => window.__saidas.length), v => v >= 1, 15000);
  const pdf = (await saidas())[0];
  conf('saiu um PDF', !!pdf && pdf.latin1.slice(0, 4), '%PDF');
  const textoPdf = textoDoPdf(Buffer.from(pdf.latin1, 'latin1'));
  conf('o PDF lê (o instrumento vê o nome e o total)', textoPdf.includes('Aluno Alfa Teste') && textoPdf.includes('200,00'), true);
  conf('o PDF não cita pagamento', citaPagamento(textoPdf), []);

  await pag.evaluate(() => Array.from(document.querySelectorAll('#doc-mais-formatos button'))
    .find(b => b.textContent.trim() === 'Texto').click());
  await esperar('o texto', () => pag.evaluate(() => window.__saidas.length), v => v >= 1, 15000);
  const md = (await saidas())[0];
  const textoMd = md ? Buffer.from(md.latin1, 'latin1').toString('utf8') : '';
  conf('o texto lê (o instrumento vê o nome e o total)', textoMd.includes('Aluno Alfa Teste') && textoMd.includes('R$ 200,00'), true);
  conf('o texto não cita pagamento', citaPagamento(textoMd), []);

  // ================================================================
  secao('9. O olho esconde os valores do pagamento também');
  await pag.evaluate(() => {
    const m = document.querySelector('#modal-documento-familia [data-fechar]');
    if (m) m.click();
  });
  await irAoFechamento(pag);
  const meus = () => pag.evaluate(() => ['#pendentes-pagamento', '#lista-fechamento .linha-pagamento']
    .map(s => Array.from(document.querySelectorAll(s)).map(e => e.textContent).join(' ')).join(' '));
  conf('com os valores à vista, a linha e a lista mostram reais (o instrumento vê)', /R\$ \d/.test(await meus()), true);
  await pag.evaluate(() => document.querySelector('#alternar-valores').click());
  await pausa(400);
  const escondido = await meus();
  conf('com o olho fechado, nenhum valor do pagamento à mostra', escondido.match(/R\$ \d[\d.,]*/g), null);
  conf('e a linha continua dizendo quando foi pago', escondido.includes('Pago em 08/07'), true);
  await pag.evaluate(() => document.querySelector('#alternar-valores').click());
  await pausa(300);

  // ================================================================
  secao('10. Mês com aula à frente: o proposto é o total do mês, como no PDF');
  /* O relógio da página é fixado em 08/06/2026: junho do Alfa fica com uma
   * aula dada (03/06) e uma marcada à frente (10/06), 100 até hoje e 200 no
   * mês. Página nova, para o relógio falso valer desde o carregamento; a
   * antiga sai para não haver duas abas no mesmo banco. */
  const errosDaPrimeira = pag.errosDePagina.slice();
  await pag.close();
  const pag2 = await amb.pagina();
  await pag2.setViewport({ width: 1280, height: 800, hasTouch: true });
  await pag2.evaluateOnNewDocument((fixo) => {
    const Real = Date;
    const base = new Real(fixo).getTime();
    const inicio = Real.now();
    class Falso extends Real {
      constructor(...a) { if (a.length) super(...a); else super(base + (Real.now() - inicio)); }
      static now() { return base + (Real.now() - inicio); }
    }
    window.Date = Falso;
  }, '2026-06-08T12:00:00');
  await H.abrirApp(pag2, amb.ORIGEM);
  conf('o relógio da página está em 08/06/2026', await pag2.evaluate(() => Core.hojeIso()), '2026-06-08');
  await pag2.evaluate(async () => { const d = await Store.carregar(); d.pagamentos = []; await Store.salvar(d); });
  await H.abrirApp(pag2, amb.ORIGEM);
  await irAoFechamento(pag2);
  const contas = await pag2.evaluate(async (id) => {
    const x = Core.calcularFechamento(await Store.carregar(), id, '2026-06');
    return [x.valorFeito, x.totalValor];
  }, ALFA);
  conf('junho do Alfa: 100 até hoje, 200 no mês', contas, [100, 200]);
  const pdfDiz = await pag2.evaluate(async (id) => {
    const x = Core.calcularFechamento(await Store.carregar(), id, '2026-06');
    return Core.markdownFechamento(x).indexOf('Total do mês, já contando as datas ainda marcadas:** ') >= 0 &&
      Core.markdownFechamento(x).indexOf(Core.fmtMoeda(200)) >= 0;
  }, ALFA);
  conf('o documento da família diz o total do mês com as datas marcadas, R$ 200,00', pdfDiz, true);
  conf('tocou em "Marcar como pago" do Alfa', await tocarNaLinha(pag2, ALFA, '.btn-marcar-pago'), true);
  la = await linha(pag2, ALFA);
  conf('o proposto é o total do mês (200,00), e não o até hoje (100,00)', la.valor, '200,00');
  conf('a ajuda diz de onde vem o valor', await pag2.$eval('#lista-fechamento .linha-pagamento[data-aluno="' + ALFA + '"] .ajuda-proposto', e => e.textContent),
    'O valor proposto é o total do mês, já contando as datas ainda marcadas, como no documento da família. Troque se a família pagou outro valor.');
  await preencherEConfirmar(pag2, ALFA, null, null);
  la = await linha(pag2, ALFA);
  conf('aceitar o proposto não deixa "faltam" no cartão', [la.feito, la.falta], ['Pago em 08/06 · R$ 200,00', '']);
  conf('Beta (junho sem nada à frente): proposto o total do mês, com a frase sem as datas marcadas', await (async () => {
    await tocarNaLinha(pag2, BETA, '.btn-marcar-pago');
    const lb2 = await linha(pag2, BETA);
    const aj = await pag2.$eval('#lista-fechamento .linha-pagamento[data-aluno="' + BETA + '"] .ajuda-proposto', e => e.textContent);
    return [lb2.valor, aj];
  })(), ['180,00', 'O valor proposto é o total do mês, como no documento da família. Troque se a família pagou outro valor.']);

  // ================================================================
  secao('11. Nenhum erro');
  conf('nenhum erro de página', errosDaPrimeira.concat(pag2.errosDePagina).join(' | '), '');
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
