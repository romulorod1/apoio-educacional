/* B2: restauração antiga em transação única; depois, ZIP por depósito. */
'use strict';
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8869, 'nath_b2_copia');
const { conf, secao } = H;

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
      historico: (await Store.listarHistorico()).length
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
      anexoAntigo: false, anexoNovo: 'beta', listas: 0, historico: 0 }));

  secao('ZIP é conferido antes de substituir os dados');
  const zip = await pag.evaluate(async () => {
    const gamma = Store.bancoVazio();
    gamma.alunos = [{ id: 'gamma', nome: 'Aluna Gama Teste' }];
    const anexos = { 'anexo-gamma': { nome: 'gamma.bin', tipo: 'application/octet-stream',
      arquivo: 'anexos/0.bin' } };
    const arquivos = [
      ['manifest.json', { formato: 'apoio-educacional-zip', versao: 2 }],
      ['dados.json', gamma], ['notas.json', {}], ['midias.json', {}],
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
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
