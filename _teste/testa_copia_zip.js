/* B2: restauração antiga em transação única; depois, ZIP por depósito. */
'use strict';
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8869, 'nath_b2_copia');
const { conf, secao, esperar } = H;

(async function () {
  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);

  secao('JSON antigo é restaurado inteiro ou não muda o banco');
  const resultado = await pag.evaluate(async () => {
    const original = Store.bancoVazio();
    original.alunos = [{ id: 'alfa', nome: 'Aluna Alfa Teste' }];
    original.aulas = [{ id: 'aula-alfa', alunoId: 'alfa', data: '2026-10-01',
      hora: '10:00', duracaoMin: 60, status: 'realizada' }];
    await Store.salvar(original);
    await Store.salvarNota('aula-alfa', { paginas: [{ itens: [{ t: 'traco', pontos: [[1, 2, 3]] }] }] });
    await Store.salvarMidia('midia-alfa', { dataUrl: 'data:image/png;base64,AA==' });
    await Store.salvarAnexo('anexo-alfa', { nome: 'alfa.pdf', tipo: 'application/pdf',
      blob: new Blob(['alfa'], { type: 'application/pdf' }) });
    await Store.gravarListaBiblioteca({ id: 'lista-alfa', titulo: 'Lista Alfa Teste', itens: [] });
    await Store.registrarHistorico('antes', original);

    const novo = Store.bancoVazio();
    novo.alunos = [{ id: 'beta', nome: 'Aluno Beta Teste' }];
    delete novo.pagamentos;
    const pacote = { formato: 'apoio-educacional', versao: 1, dados: novo,
      notas: { 'aula-beta': { paginas: [{ itens: [] }] } },
      midias: { 'midia-beta': function () {} },
      anexos: {}, biblioteca: { uso: [], etiquetas: [], listas: [] } };
    let rejeitou = false;
    try { await Store.importarTudo(pacote); } catch (e) { rejeitou = true; }
    const depoisFalha = {
      aluno: (await Store.carregar()).alunos[0].id,
      nota: !!(await Store.lerNota('aula-alfa')),
      midia: !!(await Store.lerMidia('midia-alfa')),
      anexo: !!(await Store.lerAnexo('anexo-alfa')),
      listas: (await Store.listasDaBiblioteca()).map(l => l.id),
      historico: (await Store.listarHistorico()).length
    };
    pacote.midias = {};
    pacote.anexos = { 'anexo-beta': { nome: 'beta.pdf', tipo: 'application/pdf',
      conteudo: 'data:application/pdf;base64,YmV0YQ==' } };
    await Store.importarTudo(pacote);
    const depoisSucesso = {
      aluno: (await Store.carregar()).alunos[0].id,
      notaAntiga: !!(await Store.lerNota('aula-alfa')),
      notaNova: !!(await Store.lerNota('aula-beta')),
      anexoAntigo: !!(await Store.lerAnexo('anexo-alfa')),
      anexoNovo: await (await Store.lerAnexo('anexo-beta')).blob.text(),
      listas: (await Store.listasDaBiblioteca()).length,
      historico: (await Store.listarHistorico()).length,
      pagamentos: Array.isArray((await Store.carregar()).pagamentos)
    };
    return { rejeitou, depoisFalha, depoisSucesso };
  });
  conf('falha no meio aborta a restauração', resultado.rejeitou, true);
  conf('dados e depósitos anteriores permanecem', JSON.stringify(resultado.depoisFalha),
    JSON.stringify({ aluno: 'alfa', nota: true, midia: true, anexo: true,
      listas: ['lista-alfa'], historico: 1 }));
  conf('restauração válida substitui todos os depósitos e limpa histórico',
    JSON.stringify(resultado.depoisSucesso),
    JSON.stringify({ aluno: 'beta', notaAntiga: false, notaNova: true,
      anexoAntigo: false, anexoNovo: 'beta', listas: 0, historico: 0,
      pagamentos: true }));

  secao('ZIP é conferido antes de substituir os dados');
  const zip = await pag.evaluate(async () => {
    const gamma = Store.bancoVazio();
    gamma.alunos = [{ id: 'gamma', nome: 'Aluna Gama Teste' }];
    gamma.aulas = [{ id: 'aula-gamma', alunoId: 'gamma', data: '2026-10-02',
      hora: '10:00', duracaoMin: 60, status: 'realizada', anexos: [{ id: 'anexo-gamma' }] }];
    const anexos = { 'anexo-gamma': { nome: 'gamma.bin', tipo: 'application/octet-stream',
      arquivo: 'anexos/0.bin' } };
    const arquivos = [
      ['manifest.json', { formato: 'apoio-educacional-zip', versao: 2 }],
      ['dados.json', gamma], ['notas.json', { 'aula-gamma': { paginas: [{ itens: [
        { t: 'traco', pontos: [[1.234, 2.345, 3.456]] }
      ] }] } }], ['midias.json', {}],
      ['anexos.json', anexos], ['biblioteca_uso.json', []],
      ['biblioteca_etiquetas.json', []], ['biblioteca_listas.json', []]
    ].map(([nome, conteudo]) => ({ nome, conteudo: JSON.stringify(conteudo), comprimir: true }));
    arquivos.push({ nome: 'anexos/0.bin', conteudo: new Uint8Array([0, 1, 2, 255]) });
    const blob = await Zip.escrever(arquivos);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const aberto = await Zip.lerDoArquivo(blob);
    const entrada = aberto.entradas.find(e => e.nome === 'dados.json');
    bytes[entrada.local + 30 + entrada.nome.length] ^= 1;
    let rejeitou = false;
    try { await Store.importarZip(new Blob([bytes])); } catch (e) { rejeitou = true; }
    const depoisFalha = (await Store.carregar()).alunos[0].id;
    await Store.importarZip(blob);
    const reg = await Store.lerAnexo('anexo-gamma');
    return { rejeitou, depoisFalha,
      depoisSucesso: (await Store.carregar()).alunos[0].id,
      anexo: Array.from(new Uint8Array(await reg.blob.arrayBuffer())) };
  });
  conf('ZIP corrompido não modifica o banco', zip.rejeitou && zip.depoisFalha === 'beta', true);
  conf('ZIP íntegro restaura dados e anexo binário', JSON.stringify([zip.depoisSucesso, zip.anexo]),
    JSON.stringify(['gamma', [0, 1, 2, 255]]));

  secao('exportação ZIP mantém anexos binários e arredonda apenas a cópia');
  const idaVolta = await pag.evaluate(async () => {
    const antes = (await Store.lerNota('aula-gamma')).paginas[0].itens[0].pontos[0];
    const copia = await Store.exportarTudoZip(await Store.carregar());
    const aberto = await Zip.lerDoArquivo(copia);
    const mapa = Object.fromEntries(aberto.entradas.map(e => [e.nome, e]));
    const notas = JSON.parse(new TextDecoder().decode(await Zip.extrairDoArquivo(aberto, mapa['notas.json'])));
    const arredondados = notas['aula-gamma'].paginas[0].itens[0].pontos[0];
    await Store.apagarTudo();
    await Store.importarZip(copia);
    const depois = (await Store.lerNota('aula-gamma')).paginas[0].itens[0].pontos[0];
    const anexo = await Store.lerAnexo('anexo-gamma');
    return { antes, arredondados, depois, metodoAnexo: mapa['anexos/0.bin'].metodo,
      anexo: Array.from(new Uint8Array(await anexo.blob.arrayBuffer())),
      aluno: (await Store.carregar()).alunos[0].id };
  });
  conf('traço original não foi alterado', JSON.stringify(idaVolta.antes),
    JSON.stringify([1.234, 2.345, 3.456]));
  conf('traço na cópia e na restauração tem 0,1 px',
    JSON.stringify([idaVolta.arredondados, idaVolta.depois]),
    JSON.stringify([[1.2, 2.3, 3.5], [1.2, 2.3, 3.5]]));
  conf('anexo binário sem base64 volta intacto',
    JSON.stringify([idaVolta.metodoAnexo, idaVolta.anexo, idaVolta.aluno]),
    JSON.stringify([0, [0, 1, 2, 255], 'gamma']));

  secao('seletor do app aceita ZIP novo e JSON antigo');
  await pag.evaluate(async () => {
    window.confirm = () => true;
    const copia = await Store.exportarTudoZip(await Store.carregar());
    const delta = Store.bancoVazio();
    delta.alunos = [{ id: 'delta', nome: 'Aluno Delta Teste' }];
    await Store.salvar(delta);
    const input = document.querySelector('#arquivo-copia');
    const dt = new DataTransfer();
    dt.items.add(new File([copia], 'copia.zip', { type: 'application/zip' }));
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const telaZip = await esperar('ZIP restaurado pelo seletor', () => pag.evaluate(async () =>
    (await Store.carregar()).alunos[0].id), id => id === 'gamma', 5000);
  conf('seletor restaura ZIP', telaZip.ok, true);
  await pag.evaluate(async () => {
    const copia = await Store.exportarTudo(await Store.carregar());
    const delta = Store.bancoVazio();
    delta.alunos = [{ id: 'delta', nome: 'Aluno Delta Teste' }];
    await Store.salvar(delta);
    const input = document.querySelector('#arquivo-copia');
    const dt = new DataTransfer();
    dt.items.add(new File([JSON.stringify(copia)], 'copia-antiga.json', { type: 'application/json' }));
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const telaJson = await esperar('JSON antigo restaurado pelo seletor', () => pag.evaluate(async () =>
    (await Store.carregar()).alunos[0].id), id => id === 'gamma', 5000);
  conf('seletor preserva compatibilidade com JSON antigo', telaJson.ok, true);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
