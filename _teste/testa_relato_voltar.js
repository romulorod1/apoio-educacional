/* A5: relato recuperável, saída protegida e Voltar fecha uma janela por vez (com o F7, o relato salva sozinho). */
'use strict';
const H = require('./_bib_navegador');
/* O relógio da rodada: segunda, 16/11/2026, às 11:00, no processo e na página
 * (H.relogioDaRodada). A prova não depende do dia nem da hora em que roda:
 * nem da meia-noite no meio da rodada, nem da virada do ano (o app abre a
 * virada anual sozinho em janeiro), nem do fim do mês. */
const RELOGIO = H.relogioDaRodada('2026-11-16', '11:00');
const amb = H.criarAmbiente(8867, 'nath_a5_relato_voltar');
const { conf, secao, esperar } = H;

(async function () {
  await amb.subir();
  const pag = await amb.pagina();
  await RELOGIO.naPagina(pag);
  await H.abrirApp(pag, amb.ORIGEM);
  await RELOGIO.conferir(pag);
  await pag.evaluate(async () => {
    const d = await Store.carregar();
    const hoje = Core.hojeIso();
    d.alunos = [{ id: 'a5_alfa', nome: 'Aluna Alfa Teste', ativo: true, precos: [] }];
    d.series = [];
    d.aulas = [{ id: 'a5_aula', alunoId: 'a5_alfa', data: hoje, hora: '10:00',
      duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', anexos: [] }];
    d.resumos = [];
    await Store.salvar(d);
  });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'agenda');
  await pag.click('[data-aula-id="a5_aula"]');
  conf('aula abriu', await pag.$eval('#modal-aula', e => e.classList.contains('aberto')), true);

  /* F7 (#159): a aula que já existe salva sozinha. A janela de "sair sem
   * salvar" (modal-sair-relato) deixa de aparecer: o relato vai para o banco
   * na pausa da digitação, e fechar, tocar fora ou o Voltar só fecham depois
   * de gravar. O rascunho no aparelho e o recarregar estão na prova do F7,
   * testa_aula_salva_sozinha.js. */
  secao('relato salvo sozinho e saída por fechar');
  const notaNoBanco = () => pag.evaluate(async () => (await Store.carregar()).aulas.find(a => a.id === 'a5_aula').notaTexto || '');
  await pag.$eval('#campo-nota-texto', e => {
    e.value = 'Relato salvo sem botão';
    e.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const salvoSozinho = await esperar('relato salvo sozinho', notaNoBanco, s => s === 'Relato salvo sem botão', 5000);
  conf('o relato vai para o banco sem botão', salvoSozinho.ok, true);
  conf('e o rascunho sai quando o banco já tem o mesmo texto', await pag.evaluate(() =>
    !localStorage.getItem('rascunho-relato-aula:a5_aula')), true);
  await pag.click('#modal-aula .fechar');
  const fechou = await esperar('fechar fecha a aula', () => pag.evaluate(() =>
    !document.querySelector('#modal-aula').classList.contains('aberto') &&
    !document.querySelector('#modal-sair-relato').classList.contains('aberto')), Boolean, 5000);
  conf('fechar fecha a aula, sem a pergunta de sair', fechou.ok, true);

  secao('Voltar do Android com o relato recém-escrito');
  await pag.click('[data-aula-id="a5_aula"]');
  await pag.$eval('#campo-nota-texto', e => {
    e.value = 'Relato escrito e Voltar na hora';
    e.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await pag.evaluate(() => history.back());
  const voltou = await esperar('Voltar grava e fecha', () => pag.evaluate(() =>
    !document.querySelector('#modal-aula').classList.contains('aberto')), Boolean, 5000);
  conf('o Voltar fecha a aula', voltou.ok, true);
  conf('e o relato escrito logo antes foi gravado', (await esperar('relato do Voltar no banco', notaNoBanco,
    s => s === 'Relato escrito e Voltar na hora', 5000)).ok, true);
  conf('sem entrada fantasma: o histórico não ficou com a aula', await pag.evaluate(() => !(history.state && history.state.apoioModal)), true);

  secao('janelas aninhadas');
  await H.irParaAba(pag, 'alunos');
  async function abrirFichaEConfirmacao() {
    await pag.evaluate(() => {
      document.querySelector('#lista-alunos .item-lista[data-aluno="a5_alfa"]').click();
      document.querySelector('#excluir-aluno').click();
    });
  }
  await abrirFichaEConfirmacao();
  await pag.evaluate(() => history.back());
  const soFicha = await esperar('Voltar fecha a confirmação de exclusão', () => pag.evaluate(() =>
    !document.querySelector('#modal-excluir-aluno').classList.contains('aberto') &&
    document.querySelector('#modal-aluno').classList.contains('aberto')), Boolean, 5000);
  conf('primeiro Voltar conserva a ficha', soFicha.ok, true);
  await pag.evaluate(() => history.back());
  const nenhuma = await esperar('segundo Voltar fecha a ficha', () => pag.$eval('#modal-aluno', e => !e.classList.contains('aberto')), Boolean, 5000);
  conf('segundo Voltar fecha só a ficha', nenhuma.ok, true);
  await abrirFichaEConfirmacao();
  await pag.click('#modal-excluir-aluno [data-fechar]');
  await esperar('confirmação de exclusão fechada à mão', () => pag.$eval('#modal-excluir-aluno', e => !e.classList.contains('aberto')), Boolean, 5000);
  await pag.evaluate(() => history.back());
  const fichaManual = await esperar('Voltar após fechar filha manualmente', () => pag.$eval('#modal-aluno', e => !e.classList.contains('aberto')), Boolean, 5000);
  conf('fechamento manual não deixa histórico fantasma', fichaManual.ok, true);

  secao('Voltar mantém a folha aberta quando o disco falha');
  await H.irParaAba(pag, 'agenda');
  await pag.click('[data-aula-id="a5_aula"]');
  await pag.click('#linha-folha button:first-child');
  const folhaAbriu = await esperar('editor de folha aberto', () =>
    pag.$eval('#modal-nota', e => e.classList.contains('aberto')), Boolean, 5000);
  conf('editor de folha abriu sobre aula', folhaAbriu.ok, true);
  const estadoFolha = await pag.evaluate(() => history.state && history.state.apoioModal);
  await pag.evaluate(token => {
    window.__estadoFolhaA5 = token;
    window.__salvarNotaOriginalA5 = Store.salvarNota;
    Store.salvarNota = () => Promise.reject(new Error('falha simulada na folha'));
    history.back();
  }, estadoFolha);
  const folhaProtegida = await esperar('falha mantém folha e estado de Voltar', () =>
    pag.evaluate(() => document.querySelector('#modal-nota').classList.contains('aberto') &&
      /Não consegui salvar a folha/.test(document.body.textContent) &&
      history.state && history.state.apoioModal === window.__estadoFolhaA5), Boolean, 5000);
  conf('falha no Voltar não deixa folha aberta sem proteção', folhaProtegida.ok, true);
  await pag.evaluate(() => { Store.salvarNota = window.__salvarNotaOriginalA5; });
  await pag.evaluate(() => {
    Array.from(document.querySelectorAll('#rodape-nota button'))
      .find(b => b.textContent.trim() === 'Concluir').click();
  });
  await esperar('folha fechada após gravação', () =>
    pag.$eval('#modal-nota', e => !e.classList.contains('aberto')), Boolean, 5000);
  await pag.click('#modal-aula .fechar');

  secao('falha de gravação mantém o rascunho');
  /* F7: com o disco recusando, o salvar sozinho põe o relato na memória e a
   * faixa avisa; o rascunho no aparelho fica, com a base do DISCO, para o
   * texto voltar mesmo depois de recarregar (a memória se perde). */
  await H.irParaAba(pag, 'agenda');
  await pag.click('[data-aula-id="a5_aula"]');
  await pag.evaluate(() => {
    window.__salvarOriginalA5 = Store.salvar;
    Store.salvar = () => Promise.reject(new Error('falha simulada no disco'));
  });
  await pag.$eval('#campo-nota-texto', e => {
    e.value = 'Relato após falha de gravação';
    e.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await esperar('rascunho da falha gravado no armazenamento', () => pag.evaluate(() => {
    const r = JSON.parse(localStorage.getItem('rascunho-relato-aula:a5_aula') || 'null');
    return !!r && r.notaTexto === 'Relato após falha de gravação';
  }), Boolean, 5000);
  await pag.click('#modal-aula .fechar');
  const falhaSaiu = await esperar('janela fecha com faixa de falha', () => pag.$eval('#modal-aula', e => !e.classList.contains('aberto')), Boolean, 5000);
  conf('falha de gravação não apaga o rascunho', falhaSaiu.ok && await pag.evaluate(() =>
    !!localStorage.getItem('rascunho-relato-aula:a5_aula')), true);
  await pag.evaluate(() => { Store.salvar = window.__salvarOriginalA5; });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'agenda');
  await pag.click('[data-aula-id="a5_aula"]');
  conf('recarregar após falha recupera texto', await pag.$eval('#campo-nota-texto', e => e.value),
    'Relato após falha de gravação');
  conf('com o aviso "Rascunho recuperado às"', await pag.evaluate(() =>
    /Rascunho recuperado às/.test((document.querySelector('#aviso-rascunho-relato') || {}).textContent || '')), true);

  secao('fechar uma janela e abrir outra imediatamente');
  await pag.click('#modal-aula .fechar');
  await esperar('aula anterior fechada', () => pag.$eval('#modal-aula', e => !e.classList.contains('aberto')), Boolean, 5000);
  await pag.click('#nova-aula');
  await pag.click('#salvar-preparar-aula');
  const preparada = await esperar('nova aula aberta para preparar', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto') &&
    !!document.querySelector('#campo-nota-texto')), Boolean, 8000);
  conf('Salvar e preparar abriu a aula criada', preparada.ok, true);
  await pag.evaluate(() => history.back());
  const voltouAgenda = await esperar('Voltar fecha aula preparada', () => pag.$eval('#modal-aula', e => !e.classList.contains('aberto')), Boolean, 5000);
  conf('Voltar fecha a nova janela sem sair da página', voltouAgenda.ok && (await pag.url()).startsWith(amb.ORIGEM), true);

  secao('exclusão de aluno limpa rascunho e histórico das janelas');
  /* o Voltar anterior fecha a janela na hora, mas o histórico só assenta depois do popstate: ler o estado
     antes disso guarda o valor da janela que acabou de fechar e a comparação final nunca fecha */
  const assentou = await esperar('histórico sem janela aberta', () => pag.evaluate(() => !(history.state && history.state.apoioModal)), Boolean, 5000);
  conf('Voltar deixa o histórico sem janela aberta', assentou.ok, true);
  const estadoAntes = await pag.evaluate(() => history.state && history.state.apoioModal);
  await pag.evaluate(() => localStorage.setItem('rascunho-relato-aula:a5_aula',
    JSON.stringify({ notaTexto: 'rascunho do aluno apagado', quando: Date.now() })));
  await H.irParaAba(pag, 'alunos');
  await pag.evaluate(() => {
    document.querySelector('#lista-alunos .item-lista[data-aluno="a5_alfa"]').click();
    document.querySelector('#excluir-aluno').click();
  });
  await pag.click('#confirmar-excluir-aluno');
  const saiuAluno = await esperar('aluno excluído e histórico no estado anterior', () => pag.evaluate(async antes =>
    (await Store.carregar()).alunos.length === 0 &&
    !document.querySelector('#modal-excluir-aluno').classList.contains('aberto') &&
    !document.querySelector('#modal-aluno').classList.contains('aberto') &&
    (history.state && history.state.apoioModal) === antes, estadoAntes), Boolean, 8000);
  if (!saiuAluno.ok) console.log('   DIAG ' + JSON.stringify(await pag.evaluate(async antes => ({
    alunos: (await Store.carregar()).alunos.length,
    excluirAberto: document.querySelector('#modal-excluir-aluno').classList.contains('aberto'),
    alunoAberto: document.querySelector('#modal-aluno').classList.contains('aberto'),
    estado: history.state && history.state.apoioModal, antes
  }), estadoAntes)));
  conf('excluir aluno remove rascunho e volta ao estado anterior', saiuAluno.ok && await pag.evaluate(antes =>
    !localStorage.getItem('rascunho-relato-aula:a5_aula') &&
    (history.state && history.state.apoioModal) === antes, estadoAntes), true);

  secao('apagar dados limpa rascunhos privados');
  await pag.evaluate(() => {
    localStorage.setItem('rascunho-relato-aula:a5_aula', JSON.stringify({ notaPrivada: 'texto privado antigo' }));
    window.confirm = () => true;
  });
  await H.irParaAba(pag, 'ajustes');
  await pag.click('#apagar-tudo');
  const apagou = await esperar('dados e rascunho apagados', () => pag.evaluate(async () =>
    (await Store.carregar()).alunos.length === 0 &&
    !localStorage.getItem('rascunho-relato-aula:a5_aula')), Boolean, 8000);
  conf('Apagar tudo remove também o rascunho local', apagou.ok, true);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
