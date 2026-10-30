/* testa_preparar_e_enviar.js
 *
 * C10b: no Fechamento, um botão principal por aluno, e o envio às famílias em
 * sequência. Dados fictícios ("Aluno Alfa Teste" e "Aluno Beta Teste").
 *
 * O que se prova:
 *   1. o cartão de cada aluno tem um botão principal, "Preparar e enviar", e o
 *      do feedback; nenhum dos formatos mora mais no cartão;
 *   2. a janela do documento tem "Mais formatos" com O mês numa tela, Cartão do
 *      mês, PDF com as folhas e Texto, e o PDF do fechamento no rodapé, como a
 *      ação principal; cada um aparece uma vez só na janela;
 *   3. cada formato entrega de verdade: os dois PDFs e o texto saem como
 *      arquivo, o cartão sai como PNG pelo "Enviar o cartão", e o mês numa tela
 *      abre a tela do aluno (ele é tela, não arquivo);
 *   4. "Enviar para todas as famílias" passa pelas etapas na ordem, "Pular"
 *      num e "Enviar o PDF" no outro, o resumo diz 1 e 1, e o banco fica igual;
 *   5. "Parar" na primeira etapa leva ao resumo sem enviar nada.
 *
 * O compartilhar do aparelho é desligado (navigator.canShare devolve falso) e
 * os arquivos são pegos em URL.createObjectURL, com o nome do download.
 */
'use strict';
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8856, 'nath_c10b_preparar_enviar');
const { conf, secao, esperar, pausa } = H;

const MES = '2026-06';
const ALFA = 'aluno_c10b_alfa';
const BETA = 'aluno_c10b_beta';
const FORMATOS_DA_SECAO = ['O mês numa tela', 'Cartão do mês', 'PDF com as folhas', 'Texto'];
const CINCO = ['O mês numa tela', 'PDF do fechamento', 'Cartão do mês', 'PDF com as folhas', 'Texto'];

// SALVAR_PRINTS=<pasta> guarda os prints do aceite (o Fechamento, a janela e as etapas do envio)
async function printar(pag, nome) {
  if (process.env.SALVAR_PRINTS) await pag.screenshot({ path: require('path').join(process.env.SALVAR_PRINTS, nome + '.png') });
}

async function irAoFechamento(pag) {
  await pag.click('button[data-tela="fechamento"]');
  await pausa(300);
  await pag.evaluate((mes) => {
    const sel = document.querySelector('#mes-fechamento');
    sel.value = mes;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }, MES);
  await pausa(400);
}

function abrirJanelaDe(pag, nome) {
  return pag.evaluate((nome) => {
    const c = Array.from(document.querySelectorAll('#lista-fechamento .cartao')).find(x => x.textContent.includes(nome));
    const b = c && c.querySelector('.btn-preparar-doc');
    if (!b) return false;
    b.click();
    return document.querySelector('#modal-documento-familia').classList.contains('aberto');
  }, nome);
}

function tocar(pag, seletor, texto) {
  return pag.evaluate((seletor, texto) => {
    const b = Array.from(document.querySelectorAll(seletor)).find(x => x.textContent.trim() === texto);
    if (!b) return false;
    b.click();
    return true;
  }, seletor, texto);
}

const aberta = (pag, id) => pag.$eval('#' + id, e => e.classList.contains('aberto'));

// o que saiu desde a última leitura: nome do download, tipo e o começo dos bytes
function arquivosNovos(pag) {
  return pag.evaluate(async () => {
    const lista = window.__saidas.splice(0);
    const out = [];
    for (const s of lista) {
      const bytes = new Uint8Array(await s.blob.arrayBuffer());
      out.push({
        nome: s.nome, tipo: s.blob.type, tamanho: bytes.length,
        comeco: new TextDecoder('latin1').decode(bytes.slice(0, 8)),
        texto: s.blob.type.indexOf('text') === 0 ? new TextDecoder('utf-8').decode(bytes) : ''
      });
    }
    return out;
  });
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
        responsavel: 'Responsavel Alfa', grade: 'quarta-feira, 14:00', precos: preco('v_c10b_a', 100) },
      { id: BETA, nome: 'Aluno Beta Teste', ano: '7', anoEscolar: '7º ano do Ensino Fundamental',
        responsavel: 'Responsavel Beta', grade: 'sexta-feira, 10:00', precos: preco('v_c10b_b', 120) }
    ];
    d.aulas = [
      { id: 'aula_c10b_a1', alunoId: ALFA, data: '2026-06-03', hora: '14:00', duracaoMin: 60, status: 'realizada', cobravel: true, assunto: 'Equações' },
      { id: 'aula_c10b_a2', alunoId: ALFA, data: '2026-06-10', hora: '14:00', duracaoMin: 60, status: 'realizada', cobravel: true, assunto: 'Frações' },
      { id: 'aula_c10b_b1', alunoId: BETA, data: '2026-06-05', hora: '10:00', duracaoMin: 90, status: 'realizada', cobravel: true, assunto: 'Leitura' }
    ];
    d.resumos = [
      { alunoId: ALFA, mes: '2026-06', texto: 'Bom mês para o Alfa.' },
      { alunoId: BETA, mes: '2026-06', texto: 'Bom mês para o Beta.' }
    ];
    await Store.salvar(d);
  }, ALFA, BETA);
  await H.abrirApp(pag, amb.ORIGEM);

  // nada sai do aparelho: sem compartilhar, e cada download é pego com o nome
  await pag.evaluate(() => {
    navigator.canShare = () => false;
    window.__saidas = [];
    let ultimo = null;
    const criar = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (b) => { ultimo = b; return criar(b); };
    HTMLAnchorElement.prototype.click = function () {
      if (this.hasAttribute('download') && ultimo) window.__saidas.push({ nome: this.getAttribute('download'), blob: ultimo });
    };
  });

  // ================================================================
  secao('1. O cartão de cada aluno: um botão principal, e o do feedback');
  await irAoFechamento(pag);
  const cartoes = await pag.evaluate(() => Array.from(document.querySelectorAll('#lista-fechamento .cartao')).map(c => ({
    nome: c.querySelector('h3').textContent.trim(),
    botoes: Array.from(c.querySelectorAll('button')).map(b => b.textContent.trim()),
    principal: (c.querySelector('.btn-preparar-doc') || {}).textContent || '',
    principalEhPrincipal: !!c.querySelector('.btn-preparar-doc.principal')
  })));
  conf('dois cartões, em ordem', cartoes.map(c => c.nome).join(' | '), 'Aluno Alfa Teste | Aluno Beta Teste');
  for (const c of cartoes) {
    conf(c.nome + ': o botão principal é "Preparar e enviar"', c.principal, 'Preparar e enviar');
    conf(c.nome + ': e tem a cara de principal', c.principalEhPrincipal, true);
    // C4: no pé do cartão, a linha do pagamento, que não é formato do documento
    conf(c.nome + ': no cartão só ele, o do feedback e o do pagamento', c.botoes.join(' | '),
      'Preparar e enviar | Editar o feedback | Marcar como pago');
    conf(c.nome + ': nenhum dos cinco formatos no cartão', CINCO.filter(x => c.botoes.includes(x)).join(','), '');
  }
  conf('no alto, o "Enviar para todas as famílias"', await pag.$eval('#enviar-todas-familias', e => e.textContent.trim()),
    'Enviar para todas as famílias');
  conf('ao lado do "Exportar o mês em texto"', await pag.evaluate(() =>
    document.querySelector('#enviar-todas-familias').parentNode === document.querySelector('#exportar-md-mes').parentNode), true);
  await printar(pag, 'depois_fechamento');
  await pag.evaluate(() => document.querySelector('#lista-fechamento .acoes-doc-familia').scrollIntoView({ block: 'center' }));
  await pausa(200);
  await printar(pag, 'depois_cartao');

  // ================================================================
  secao('2. A janela: "Mais formatos" e o PDF do fechamento no rodapé');
  conf('o "Preparar e enviar" abre a janela do documento', await abrirJanelaDe(pag, 'Aluno Alfa Teste'), true);
  const janela = await pag.evaluate(() => ({
    titulo: (document.querySelector('#doc-mais-formatos-titulo') || {}).textContent || '',
    secao: Array.from(document.querySelectorAll('#doc-mais-formatos button')).map(b => b.textContent.trim()),
    rodape: Array.from(document.querySelectorAll('#rodape-modal-doc-familia button')).map(b => b.textContent.trim()),
    principalDoRodape: Array.from(document.querySelectorAll('#rodape-modal-doc-familia .btn.principal')).map(b => b.textContent.trim()),
    todos: Array.from(document.querySelectorAll('#modal-documento-familia button')).map(b => b.textContent.trim()),
    texto: document.querySelector('#modal-documento-familia').textContent
  }));
  conf('a seção se chama "Mais formatos"', janela.titulo, 'Mais formatos');
  conf('a seção tem os quatro formatos além do principal', FORMATOS_DA_SECAO.every(x => janela.secao.includes(x)), true);
  conf('o rodapé tem só o Fechar e o PDF do fechamento', janela.rodape.join(' | '), 'Fechar | PDF do fechamento');
  conf('o PDF do fechamento é a ação principal do rodapé', janela.principalDoRodape.join(' | '), 'PDF do fechamento');
  conf('os cinco estão na janela, cada um uma vez só',
    CINCO.map(x => x + '=' + janela.todos.filter(t => t === x).length).join(', '),
    CINCO.map(x => x + '=1').join(', '));
  conf('a seção antiga "Outras saídas" não existe mais', janela.texto.includes('Outras saídas'), false);
  conf('nem o "Baixar texto" do rodapé', janela.todos.includes('Baixar texto'), false);
  await printar(pag, 'depois_janela');
  await pag.evaluate(() => document.querySelector('#doc-mais-formatos').scrollIntoView({ block: 'center' }));
  await pausa(200);
  await printar(pag, 'depois_janela_mais_formatos');

  // ================================================================
  secao('3. Cada formato entrega de verdade');
  await arquivosNovos(pag);
  conf('tocou em PDF do fechamento', await tocar(pag, '#rodape-modal-doc-familia button', 'PDF do fechamento'), true);
  await esperar('o PDF do fechamento', () => pag.evaluate(() => window.__saidas.length), v => v >= 1, 15000);
  let saiu = await arquivosNovos(pag);
  conf('PDF do fechamento: um arquivo', saiu.length, 1);
  conf('PDF do fechamento: é PDF', saiu[0] && saiu[0].comeco.slice(0, 4), '%PDF');
  conf('PDF do fechamento: com o nome do aluno e sem as folhas',
    !!saiu[0] && /Alfa/.test(saiu[0].nome) && /\.pdf$/.test(saiu[0].nome) && !/com_folhas/.test(saiu[0].nome), true);

  conf('tocou em PDF com as folhas', await tocar(pag, '#doc-mais-formatos button', 'PDF com as folhas'), true);
  await esperar('o PDF com as folhas', () => pag.evaluate(() => window.__saidas.length), v => v >= 1, 15000);
  saiu = await arquivosNovos(pag);
  conf('PDF com as folhas: é PDF', saiu[0] && saiu[0].comeco.slice(0, 4), '%PDF');
  conf('PDF com as folhas: o nome diz que leva as folhas', !!saiu[0] && /_com_folhas\.pdf$/.test(saiu[0].nome), true);

  conf('tocou em Texto', await tocar(pag, '#doc-mais-formatos button', 'Texto'), true);
  await esperar('o texto', () => pag.evaluate(() => window.__saidas.length), v => v >= 1, 15000);
  saiu = await arquivosNovos(pag);
  conf('Texto: é um .md', !!saiu[0] && /\.md$/.test(saiu[0].nome), true);
  conf('Texto: traz o aluno e o feedback', !!saiu[0] && saiu[0].texto.includes('Aluno Alfa Teste') &&
    saiu[0].texto.includes('Bom mês para o Alfa.'), true);

  conf('tocou em Cartão do mês', await tocar(pag, '#doc-mais-formatos button', 'Cartão do mês'), true);
  await esperar('a janela do cartão', () => aberta(pag, 'modal-cartao'), v => v === true, 5000);
  conf('o cartão é do aluno da janela', await pag.$eval('#titulo-modal-cartao', e => e.textContent.trim()), 'Cartão do mês, Aluno Alfa Teste');
  conf('a janela do documento fechou para dar lugar a ele', await aberta(pag, 'modal-documento-familia'), false);
  await pag.evaluate(() => document.querySelector('#enviar-cartao').click());
  await esperar('o PNG do cartão', () => pag.evaluate(() => window.__saidas.length), v => v >= 1, 15000);
  saiu = await arquivosNovos(pag);
  conf('Cartão do mês: é PNG', saiu[0] && saiu[0].tipo + ' ' + saiu[0].comeco.slice(1, 4), 'image/png PNG');
  conf('Cartão do mês: com o nome do aluno', !!saiu[0] && /^Cartao_.*Alfa.*\.png$/.test(saiu[0].nome), true);

  conf('reabriu a janela', await abrirJanelaDe(pag, 'Aluno Alfa Teste'), true);
  conf('tocou em O mês numa tela', await tocar(pag, '#doc-mais-formatos button', 'O mês numa tela'), true);
  await esperar('a tela do mês', () => aberta(pag, 'modal-mes'), v => v === true, 5000);
  conf('O mês numa tela: abre a tela do aluno (é tela, não arquivo)',
    await pag.$eval('#titulo-modal-mes', e => e.textContent.trim()), 'Aluno Alfa Teste, Junho de 2026');
  await pag.evaluate(() => document.querySelector('#fechar-modal-mes').click());
  await pausa(300);
  conf('e nenhum arquivo saiu por ela', (await arquivosNovos(pag)).length, 0);

  // ================================================================
  secao('4. Enviar para todas as famílias: Pular num, Enviar o PDF no outro');
  const antes = await pag.evaluate(async () => JSON.stringify(await Store.carregar()));
  await irAoFechamento(pag);
  await pag.evaluate(() => document.querySelector('#enviar-todas-familias').click());
  await esperar('a janela do envio', () => aberta(pag, 'modal-envio-familias'), v => v === true, 5000);
  const etapa = () => pag.$eval('#envio-etapa', e => e.textContent.trim()).catch(() => '');
  const rodapeDoEnvio = () => pag.evaluate(() =>
    Array.from(document.querySelectorAll('#rodape-modal-envio-familias button')).map(b => b.textContent.trim()).join(' | '));
  conf('primeira etapa', await etapa(), 'Família 1 de 2: Aluno Alfa Teste');
  conf('com Parar, Pular e Enviar o PDF', await rodapeDoEnvio(), 'Parar o envio | Pular esta família | Enviar o PDF');
  await printar(pag, 'depois_envio_etapa');
  conf('tocou em Pular', await tocar(pag, '#rodape-modal-envio-familias button', 'Pular esta família'), true);
  await pausa(200);
  conf('pular não gera arquivo', (await arquivosNovos(pag)).length, 0);
  conf('segunda etapa', await etapa(), 'Família 2 de 2: Aluno Beta Teste');
  conf('tocou em Enviar o PDF', await tocar(pag, '#rodape-modal-envio-familias button', 'Enviar o PDF'), true);
  await esperar('o PDF do Beta', () => pag.evaluate(() => window.__saidas.length), v => v >= 1, 15000);
  await esperar('o resumo', () => pag.evaluate(() => !!document.querySelector('#envio-resumo')), v => v === true, 5000);
  saiu = await arquivosNovos(pag);
  conf('saiu um arquivo só', saiu.length, 1);
  conf('é o PDF do fechamento do Beta', !!saiu[0] && saiu[0].comeco.slice(0, 4) === '%PDF' &&
    /Beta/.test(saiu[0].nome) && !/com_folhas/.test(saiu[0].nome), true);
  conf('o resumo: enviadas', await pag.$eval('#envio-enviadas', e => e.textContent.trim()), 'Enviadas: 1');
  conf('o resumo: puladas', await pag.$eval('#envio-puladas', e => e.textContent.trim()), 'Puladas: 1');
  conf('nenhuma ficou para depois', await pag.evaluate(() => !!document.querySelector('#envio-faltaram')), false);
  await printar(pag, 'depois_envio_resumo');
  await tocar(pag, '#rodape-modal-envio-familias button', 'Fechar');
  await pausa(300);
  conf('a janela do envio fechou', await aberta(pag, 'modal-envio-familias'), false);
  const depois = await pag.evaluate(async () => JSON.stringify(await Store.carregar()));
  conf('nada foi gravado no banco (Store.carregar igual antes e depois)', depois === antes, true);

  // ================================================================
  secao('5. Parar na primeira etapa');
  await pag.evaluate(() => document.querySelector('#enviar-todas-familias').click());
  await esperar('a janela do envio', () => aberta(pag, 'modal-envio-familias'), v => v === true, 5000);
  conf('recomeça da primeira', await etapa(), 'Família 1 de 2: Aluno Alfa Teste');
  conf('tocou em Parar', await tocar(pag, '#rodape-modal-envio-familias button', 'Parar o envio'), true);
  await pausa(200);
  conf('o resumo: nenhuma enviada', await pag.$eval('#envio-enviadas', e => e.textContent.trim()), 'Enviadas: 0');
  conf('o resumo: nenhuma pulada', await pag.$eval('#envio-puladas', e => e.textContent.trim()), 'Puladas: 0');
  conf('e as duas ficaram para depois', await pag.$eval('#envio-faltaram', e => e.textContent.trim()), 'Ficaram para depois: 2');
  conf('parar não gera arquivo', (await arquivosNovos(pag)).length, 0);
  await tocar(pag, '#rodape-modal-envio-familias button', 'Fechar');

  // ================================================================
  secao('6. Nenhum erro');
  conf('nenhum erro de página', pag.errosDePagina.join(' | '), '');
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
