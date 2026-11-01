/* C7: o índice atualizado prevalece sobre vínculo antigo gravado na trilha. */
'use strict';
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8872, 'nath_c7_vinculos');
const { conf, esperar } = H;

(async () => {
  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);
  await pag.evaluate(async () => {
    const dados = await Store.carregar();
    const passos = [
      { temaId: 'MAT07-10', titulo: 'Equações do 1º grau', serie: '07',
        modulo: '7ano:porcentagem-e-juros', duracaoMin: 60 },
      { temaId: 'MAT07-08', titulo: 'Sequências e regularidades', serie: '07',
        modulo: '7ano:razoes-e-proporcoes', duracaoMin: 60 }
    ];
    const aluno = { id: 'c7_alfa', nome: 'Aluno Alfa Teste', ativo: true, precos: [] };
    aluno.trilhas = [Core.criarTrilha({ alunoId: aluno.id, titulo: 'Trilha Teste',
      alvoId: passos[0].temaId, materia: 'matematica', passos })];
    dados.alunos = [aluno]; dados.aulas = []; dados.series = []; dados.resumos = [];
    await Store.salvar(dados);
    const mods = ['equacoes-e-inequacoes-do-primeiro-grau', 'porcentagem-e-juros', 'razoes-e-proporcoes'];
    const itens = mods.map((slug, i) => ({ id: 'c7_item_' + i, serie: '7ano',
      modulo: { slug, titulo: slug }, aula: { slug: 'aula', titulo: 'Aula Teste', n: 1 },
      numero: 1, assets: { enunciado: 'teste.svg' } }));
    const kits = mods.map((slug, i) => ({ id: 'c7_kit_' + i, modulo: '7ano:' + slug,
      nivel: 1, minutos: 20, regra: 'base-v1', degraus: [{ item: itens[i].id, minutos: 20, degrau: 1 }] }));
    await Store.gravarPacoteBiblioteca({ manifest: { pacote: 'c7-teste', versao: 1 },
      itens, kits, teoria: [], assets: [], busca: { temas: [] }, apelidos: {}, bytesTotais: 0 });
  });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'alunos');
  await pag.click('#lista-alunos .item-lista[data-aluno="c7_alfa"]');
  await pag.evaluate(() => Array.from(document.querySelectorAll('#modal-aluno .aba-perfil'))
    .find(b => b.textContent.trim() === 'Mapeamento').click());
  const painel = await esperar('trilha na ficha', () => pag.$('#painel-trilhas .abrir-trilha'), Boolean, 8000);
  if (!painel.ok) throw new Error('Trilha não abriu na ficha');
  await pag.click('#painel-trilhas .abrir-trilha');
  const aberto = await esperar('passos da trilha', () =>
    pag.$('#modal-trilha.aberto .item-passo-trilha[data-passo="MAT07-08"]'), Boolean, 8000);
  if (!aberto.ok) throw new Error('Passos da trilha não apareceram');
  await pag.evaluate(() => history.back());
  const voltou = await esperar('Voltar fecha só a trilha', () => pag.evaluate(() =>
    !document.querySelector('#modal-trilha').classList.contains('aberto') &&
    document.querySelector('#modal-aluno').classList.contains('aberto')), Boolean, 8000);
  conf('Voltar fecha a trilha e mantém a ficha', voltou.ok, true);
  await pag.click('#painel-trilhas .abrir-trilha');
  const reabriu = await esperar('trilha reaberta', () =>
    pag.$('#modal-trilha.aberto .item-passo-trilha[data-passo="MAT07-08"]'), Boolean, 8000);
  if (!reabriu.ok) throw new Error('Trilha não reabriu');
  conf('assunto sem vínculo seguro não usa módulo antigo', await pag.$eval('#modal-trilha.aberto .item-passo-trilha[data-passo="MAT07-08"]',
    e => /sem lista pronta/.test(e.textContent) && !e.querySelector('.abrir-lista-trilha')), true);
  conf('equações usa vínculo atualizado e oferece lista', await pag.$eval('#modal-trilha.aberto .item-passo-trilha[data-passo="MAT07-10"]',
    e => !!e.querySelector('.abrir-lista-trilha')), true);
  await pag.click('#modal-trilha.aberto .item-passo-trilha[data-passo="MAT07-10"] .abrir-lista-trilha');
  const lista = await esperar('lista correta aberta', () => pag.evaluate(() =>
    document.querySelector('#tela-biblioteca').classList.contains('ativa') &&
    document.querySelector('#bib-corpo').textContent.includes('equacoes-e-inequacoes-do-primeiro-grau')), Boolean, 8000);
  if (process.env.C7_PRINT) await pag.screenshot({ path: process.env.C7_PRINT });
  if (!lista.ok) console.log('estado da biblioteca:', await pag.evaluate(() => ({
    ativa: document.querySelector('#tela-biblioteca').classList.contains('ativa'),
    corpo: document.querySelector('#bib-corpo').textContent.slice(0, 500),
    modais: Array.from(document.querySelectorAll('.fundo-modal.aberto')).map(e => e.id)
  })), pag.errosDePagina);
  conf('abrir lista leva ao módulo de equações', lista.ok, true);
  conf('a ficha e a trilha não encobrem a biblioteca', await pag.evaluate(() =>
    !document.querySelector('#modal-aluno').classList.contains('aberto') &&
    !document.querySelector('#modal-trilha').classList.contains('aberto')), true);

  await H.irParaAba(pag, 'alunos');
  await pag.click('#lista-alunos .item-lista[data-aluno="c7_alfa"]');
  await pag.evaluate(() => Array.from(document.querySelectorAll('#modal-aluno .aba-perfil'))
    .find(b => b.textContent.trim() === 'Mapeamento').click());
  await esperar('botão para montar trilha', () => pag.$('#nova-trilha-do-zero'), Boolean, 8000);
  await pag.click('#nova-trilha-do-zero');
  const seletor = await esperar('seletor de assuntos', () => pag.$('#modal-tema.aberto #lista-temas'), Boolean, 8000);
  if (!seletor.ok) throw new Error('Seletor de assuntos não abriu');
  await pag.$eval('#modal-tema input[placeholder="Procurar por assunto"]', e => {
    e.value = 'Equações do 1º grau'; e.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const alvo = await esperar('assunto de equações encontrado', () => pag.evaluate(() =>
    Array.from(document.querySelectorAll('#modal-tema .item-tema'))
      .some(e => e.querySelector('.nome').textContent.startsWith('Equações do 1º grau'))), Boolean, 8000);
  if (!alvo.ok) throw new Error('Assunto de equações não encontrado');
  await pag.evaluate(() => Array.from(document.querySelectorAll('#modal-tema .item-tema'))
    .find(e => e.querySelector('.nome').textContent.startsWith('Equações do 1º grau')).querySelector('button').click());
  const proposta = await esperar('proposta não salva', () =>
    pag.$('#modal-trilha.aberto .item-passo-trilha[data-passo="MAT07-10"]'), Boolean, 8000);
  if (!proposta.ok) throw new Error('Proposta não apareceu');
  conf('proposta pede guardar antes de abrir lista', await pag.$eval(
    '#modal-trilha.aberto .item-passo-trilha[data-passo="MAT07-10"]', e =>
      /Guarde a trilha para abrir esta lista/.test(e.textContent) && !e.querySelector('.abrir-lista-trilha')), true);
  await pag.evaluate(() => { window.confirm = () => false; history.back(); });
  await new Promise(r => setTimeout(r, 250));
  conf('Voltar cancelado mantém proposta aberta', await pag.$eval('#modal-trilha',
    e => e.classList.contains('aberto')), true);
  await pag.evaluate(() => { window.confirm = () => true; history.back(); });
  const descartou = await esperar('Voltar confirmado fecha proposta', () => pag.evaluate(() =>
    !document.querySelector('#modal-trilha').classList.contains('aberto') &&
    document.querySelector('#modal-aluno').classList.contains('aberto')), Boolean, 8000);
  conf('Voltar confirmado fecha só a proposta', descartou.ok, true);

  const semIndice = await amb.pagina();
  await semIndice.evaluateOnNewDocument(() => {
    const original = window.fetch;
    window.fetch = function (url) {
      if (String(url).includes('banco/topicos/matematica.json')) return Promise.reject(new Error('índice indisponível'));
      return original.apply(this, arguments);
    };
  });
  await H.abrirApp(semIndice, amb.ORIGEM);
  await H.irParaAba(semIndice, 'biblioteca');
  const bib = await esperar('biblioteca disponível sem índice', () =>
    semIndice.$eval('#bib-contagem', e => e.textContent), t => /3 exercícios/.test(t || ''), 8000);
  if (!bib.ok) throw new Error('Biblioteca não carregou');
  await H.irParaAba(semIndice, 'alunos');
  await semIndice.click('#lista-alunos .item-lista[data-aluno="c7_alfa"]');
  await semIndice.evaluate(() => Array.from(document.querySelectorAll('#modal-aluno .aba-perfil'))
    .find(b => b.textContent.trim() === 'Mapeamento').click());
  await esperar('trilha sem índice', () => semIndice.$('#painel-trilhas .abrir-trilha'), Boolean, 8000);
  await semIndice.click('#painel-trilhas .abrir-trilha');
  const passoSemIndice = await esperar('passo sem índice', () =>
    semIndice.$('#modal-trilha.aberto .item-passo-trilha[data-passo="MAT07-10"]'), Boolean, 8000);
  if (!passoSemIndice.ok) throw new Error('Passo não apareceu sem índice');
  conf('sem índice não usa vínculo antigo gravado', await semIndice.$eval(
    '#modal-trilha.aberto .item-passo-trilha[data-passo="MAT07-10"]', e =>
      /sem lista pronta/.test(e.textContent) && !e.querySelector('.abrir-lista-trilha')), true);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
