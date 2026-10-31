/* A5: relato recuperável, saída protegida e Voltar fecha uma janela por vez. */
'use strict';
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8867, 'nath_a5_relato_voltar');
const { conf, secao, esperar } = H;

(async function () {
  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);
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

  secao('rascunho e saída por fechar');
  await pag.$eval('#campo-nota-texto', e => {
    e.value = 'Relato preservado no rascunho';
    e.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 800));
  conf('rascunho guardado com hora', await pag.evaluate(() => {
    const r = JSON.parse(localStorage.getItem('rascunho-relato-aula:a5_aula') || 'null');
    return !!r && r.notaTexto === 'Relato preservado no rascunho' && Number.isFinite(r.quando);
  }), true);
  await pag.click('#modal-aula .fechar');
  conf('fechar abre escolha sem fechar aula', await pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto') &&
    document.querySelector('#modal-sair-relato').classList.contains('aberto')), true);
  if (process.env.A5_PRINT_DEPOIS) await pag.screenshot({ path: process.env.A5_PRINT_DEPOIS });
  await pag.click('#continuar-relato');
  const voltou = await esperar('continuar volta à aula', () => pag.evaluate(() =>
    !document.querySelector('#modal-sair-relato').classList.contains('aberto') &&
    document.querySelector('#modal-aula').classList.contains('aberto')), Boolean, 5000);
  conf('continuar escrevendo preserva aula aberta', voltou.ok, true);
  await pag.click('#cancelar-aula');
  conf('Cancelar também protege o relato', await pag.$eval('#modal-sair-relato', e => e.classList.contains('aberto')), true);
  await pag.click('#continuar-relato');
  await pag.evaluate(() => {
    const fundo = document.querySelector('#modal-aula');
    fundo.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fundo.click();
  });
  conf('toque fora também protege o relato', await pag.$eval('#modal-sair-relato', e => e.classList.contains('aberto')), true);
  await pag.click('#continuar-relato');

  secao('Voltar do Android');
  await pag.evaluate(() => history.back());
  const aviso = await esperar('Voltar pede decisão', () => pag.$eval('#modal-sair-relato', e => e.classList.contains('aberto')), Boolean, 5000);
  conf('Voltar não perde relato', aviso.ok, true);
  await pag.evaluate(() => history.back());
  const soAula = await esperar('Voltar fecha apenas confirmação', () => pag.evaluate(() =>
    !document.querySelector('#modal-sair-relato').classList.contains('aberto') &&
    document.querySelector('#modal-aula').classList.contains('aberto')), Boolean, 5000);
  conf('segundo Voltar fecha só janela de cima', soAula.ok, true);
  await pag.click('#modal-aula .fechar');
  await pag.click('#descartar-relato');
  const fechadas = await esperar('descartar fecha as duas janelas', () => pag.evaluate(() =>
    !document.querySelector('#modal-sair-relato').classList.contains('aberto') &&
    !document.querySelector('#modal-aula').classList.contains('aberto')), Boolean, 5000);
  conf('Descartar fecha ambas e limpa rascunho', fechadas.ok && await pag.evaluate(() =>
    !localStorage.getItem('rascunho-relato-aula:a5_aula')), true);

  secao('restauração após recarregar e salvar');
  await pag.click('[data-aula-id="a5_aula"]');
  await pag.$eval('#campo-nota-texto', e => {
    e.value = 'Relato que sobrevive ao recarregamento';
    e.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 800));
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'agenda');
  await pag.click('[data-aula-id="a5_aula"]');
  conf('rascunho restaurado com aviso de hora', await pag.evaluate(() =>
    document.querySelector('#campo-nota-texto').value === 'Relato que sobrevive ao recarregamento' &&
    /Rascunho recuperado às/.test(document.querySelector('#aviso-rascunho-relato').textContent)), true);
  await pag.click('#modal-aula .fechar');
  await pag.click('#salvar-sair-relato');
  const salvo = await esperar('relato salvo', () => pag.evaluate(async () =>
    (await Store.carregar()).aulas.find(a => a.id === 'a5_aula').notaTexto),
  s => s === 'Relato que sobrevive ao recarregamento', 8000);
  conf('Salvar e sair guarda no banco', salvo.ok, true);
  conf('rascunho sai após gravação', await pag.evaluate(() =>
    !localStorage.getItem('rascunho-relato-aula:a5_aula')), true);

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
  await new Promise(r => setTimeout(r, 120));
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
  await H.irParaAba(pag, 'agenda');
  await pag.click('[data-aula-id="a5_aula"]');
  await pag.$eval('#campo-nota-texto', e => {
    e.value = 'Relato após falha de gravação';
    e.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await pag.click('#modal-aula .fechar');
  await pag.evaluate(() => {
    window.__salvarOriginalA5 = Store.salvar;
    Store.salvar = () => Promise.reject(new Error('falha simulada no disco'));
  });
  await pag.click('#salvar-sair-relato');
  const falhaSaiu = await esperar('janela fecha com faixa de falha', () => pag.$eval('#modal-aula', e => !e.classList.contains('aberto')), Boolean, 5000);
  conf('falha de gravação não apaga o rascunho', falhaSaiu.ok && await pag.evaluate(() =>
    !!localStorage.getItem('rascunho-relato-aula:a5_aula')), true);
  await pag.evaluate(() => { Store.salvar = window.__salvarOriginalA5; });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'agenda');
  await pag.click('[data-aula-id="a5_aula"]');
  conf('recarregar após falha recupera texto', await pag.$eval('#campo-nota-texto', e => e.value),
    'Relato após falha de gravação');

  secao('fechar uma janela e abrir outra imediatamente');
  await pag.click('#modal-aula .fechar');
  await pag.click('#descartar-relato');
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
  const estadoAntes = await pag.evaluate(() => history.state && history.state.apoioModal);
  await pag.evaluate(() => localStorage.setItem('rascunho-relato-aula:a5_aula',
    JSON.stringify({ notaTexto: 'rascunho do aluno apagado', quando: Date.now() })));
  await H.irParaAba(pag, 'alunos');
  await pag.evaluate(() => {
    document.querySelector('#lista-alunos .item-lista[data-aluno="a5_alfa"]').click();
    document.querySelector('#excluir-aluno').click();
  });
  await pag.click('#confirmar-excluir-aluno');
  const saiuAluno = await esperar('aluno excluído', () => pag.evaluate(async () =>
    (await Store.carregar()).alunos.length === 0 &&
    !document.querySelector('#modal-excluir-aluno').classList.contains('aberto') &&
    !document.querySelector('#modal-aluno').classList.contains('aberto')), Boolean, 8000);
  await new Promise(r => setTimeout(r, 120));
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
