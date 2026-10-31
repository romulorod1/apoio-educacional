/* A2c: exclusão real da ficha e depósitos numa transação; falha não deixa
 * metade apagada. A exportação também ignora arquivos órfãos antigos. */
'use strict';
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8865, 'nath_a2c_exclusao');
const { conf, secao, esperar } = H;

(async function () {
  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);
  await pag.evaluate(async () => {
    const d = await Store.carregar();
    d.alunos = [
      { id: 'del', nome: 'Aluna a excluir Teste', precos: [] },
      { id: 'fica', nome: 'Aluno mantido Teste', precos: [] }
    ];
    d.aulas = [
      { id: 'a-del', alunoId: 'del', data: '2026-06-01', hora: '10:00', status: 'realizada',
        duracaoMin: 60, cobravel: true, anexos: [{ id: 'an-del' }, { id: 'an-comp' }] },
      { id: 'a-fica', alunoId: 'fica', data: '2026-06-02', hora: '10:00', status: 'realizada',
        duracaoMin: 60, cobravel: true, anexos: [{ id: 'an-comp' }] }
    ];
    d.series = [{ id: 's-del', alunoId: 'del', dias: [1], inicio: '2026-06-01' }];
    d.resumos = [{ id: 'r-del', alunoId: 'del', mes: '2026-06' }];
    d.pagamentos = [{ id: 'p-del', alunoId: 'del', mes: '2026-06' }];
    d.ajustes = d.ajustes || {};
    d.ajustes.bibliotecaTitulos = { del: { titulo: 'Apagar' }, fica: { titulo: 'Manter' } };
    await Store.salvar(d);
    const folha = refs => ({ paginas: [{ itens: refs.map(ref => ({ t: 'imagem', ref })) }] });
    await Store.salvarNota('a-del', folha(['m-del', 'm-comp']));
    await Store.salvarNota('a-fica', folha(['m-comp']));
    await Store.salvarNota('orfa', folha(['m-orfa']));
    for (const id of ['m-del', 'm-comp', 'm-orfa']) await Store.salvarMidia(id, { dataUrl: 'data:image/png;base64,AA==' });
    for (const id of ['an-del', 'an-comp', 'an-orfa']) await Store.salvarAnexo(id,
      { nome: id + '.pdf', tipo: 'application/pdf', blob: new Blob(['x'], { type: 'application/pdf' }) });
    await Store.registrarUsoBiblioteca({ itemId: 'item-del', alunoId: 'del', aulaId: 'a-del', data: '2026-06-01', listaId: 'lista' });
    await Store.registrarUsoBiblioteca({ itemId: 'item-fica', alunoId: 'fica', aulaId: 'a-fica', data: '2026-06-02', listaId: 'lista' });
    await Store.gravarListaBiblioteca({ id: 'lista', titulo: 'Lista Teste', itens: [] });
    await Store.registrarHistorico('antes da exclusão', d);
  });

  secao('cópia sem órfãos antigos');
  const antes = await pag.evaluate(async () => {
    const p = await Store.exportarTudo(await Store.carregar());
    return [Object.keys(p.notas).sort(), Object.keys(p.midias).sort(), Object.keys(p.anexos).sort(), p.biblioteca.uso.length];
  });
  conf('exportação só leva folhas, mídias e anexos referidos', antes,
    [['a-del', 'a-fica'], ['m-comp', 'm-del'], ['an-comp', 'an-del'], 2]);

  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'alunos');
  await pag.evaluate(() => {
    const item = Array.from(document.querySelectorAll('#lista-alunos .item-lista'))
      .find(e => e.textContent.includes('Aluna a excluir Teste'));
    item.querySelector('button').click();
    document.querySelector('#excluir-aluno').click();
  });
  conf('janela do app lista dados e avisa que não há Desfazer',
    await pag.$eval('#modal-excluir-aluno', e => e.classList.contains('aberto') &&
      /folhas e imagens/.test(e.textContent) && /Usada com/.test(e.textContent) &&
      /não tem Desfazer/.test(e.textContent)), true);
  if (process.env.A2C_PRINT) await pag.screenshot({ path: process.env.A2C_PRINT });
  conf('abrir a janela ainda não exclui', await pag.evaluate(async () =>
    (await Store.carregar()).alunos.length), 2);
  await pag.click('#confirmar-excluir-aluno');
  const fechou = await esperar('exclusão concluída', () =>
    pag.$eval('#modal-excluir-aluno', e => !e.classList.contains('aberto')), Boolean, 8000);
  conf('janela fecha após confirmar', fechou.ok, true);

  secao('cascata e preservação do outro aluno');
  const depois = await pag.evaluate(async () => {
    const d = await Store.carregar();
    const uso = await Store.usoDaBiblioteca();
    const hist = await Store.listarHistorico();
    const listas = await Store.listasDaBiblioteca();
    return {
      alunos: d.alunos.map(x => x.id), aulas: d.aulas.map(x => x.id),
      series: d.series.length, resumos: d.resumos.length, pagamentos: d.pagamentos.length,
      tituloApagado: !!d.ajustes.bibliotecaTitulos.del,
      notas: [!!(await Store.lerNota('a-del')), !!(await Store.lerNota('a-fica'))],
      midias: [!!(await Store.lerMidia('m-del')), !!(await Store.lerMidia('m-comp'))],
      anexos: [!!(await Store.lerAnexo('an-del')), !!(await Store.lerAnexo('an-comp'))],
      uso: uso.map(x => x.alunoId), historico: hist.length, listas: listas.length
    };
  });
  conf('dados principais, arquivos e uso excluídos; compartilhados preservados', depois, {
    alunos: ['fica'], aulas: ['a-fica'], series: 0, resumos: 0, pagamentos: 0,
    tituloApagado: false, notas: [false, true], midias: [false, true],
    anexos: [false, true], uso: ['fica'], historico: 0, listas: 1
  });
  const copia = await pag.evaluate(async () => {
    const p = await Store.exportarTudo(await Store.carregar());
    return [Object.keys(p.notas), Object.keys(p.midias), Object.keys(p.anexos), p.biblioteca.uso.map(x => x.alunoId)];
  });
  conf('nova cópia não leva exclusão nem órfãos antigos', copia,
    [['a-fica'], ['m-comp'], ['an-comp'], ['fica']]);

  secao('transação interrompida');
  const abortou = await pag.evaluate(async () => {
    const d = await Store.carregar();
    d.alunos.push({ id: 'falha', nome: 'Aluno da falha Teste', precos: [] });
    d.aulas.push({ id: 'a-falha', alunoId: 'falha', data: '2026-06-03', anexos: [] });
    await Store.salvar(d);
    await Store.salvarNota('a-falha', { paginas: [{ itens: [] }] });
    await Store.registrarUsoBiblioteca({ itemId: 'item-falha', alunoId: 'falha', aulaId: 'a-falha', data: '2026-06-03' });
    await Store.registrarHistorico('antes da tentativa', d);
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () {
      const pedido = original.apply(this, arguments);
      if (this.name === 'dados') pedido.onsuccess = () => this.transaction.abort();
      return pedido;
    };
    let rejeitou = false;
    try { await Store.excluirAlunoEmCascata(d, 'falha'); }
    catch (_) { rejeitou = true; }
    finally { IDBObjectStore.prototype.put = original; }
    const atual = await Store.carregar();
    return [rejeitou, atual.alunos.some(x => x.id === 'falha'),
      atual.aulas.some(x => x.id === 'a-falha'), !!(await Store.lerNota('a-falha')),
      (await Store.usoDaBiblioteca()).some(x => x.alunoId === 'falha'),
      (await Store.listarHistorico()).length];
  });
  conf('aborto preserva documento, folha, uso e histórico', abortou, [true, true, true, true, true, 1]);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
