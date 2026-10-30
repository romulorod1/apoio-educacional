/* testa_titulos_e_roteiro.js
 *
 * C11: os títulos do fechamento são dela, e o roteiro de três perguntas do
 * feedback existe inteiro, mas desligado por padrão. Dados fictícios.
 *
 * O que se prova:
 *   1. desligado, a janela do Feedback é a de sempre (sem roteiro), e o
 *      editor de títulos nasce fechado, com os títulos de sempre na prévia;
 *   2. o título que ela troca vale na prévia, fica guardado depois de
 *      recarregar e sai no texto e no PDF de verdade (pelos botões da janela);
 *   3. o título apagado volta ao de sempre;
 *   4. ligado em Ajustes, o roteiro aparece com as três perguntas, a opção
 *      fica guardada, a pergunta reescrita fica guardada, e o texto sai
 *      montado das respostas e continua editável.
 */
'use strict';
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8855, 'nath_c11_titulos_roteiro');
const { conf, secao, esperar, pausa } = H;

const ALUNO = 'aluno_c11_teste';
const MES = '2026-06';
const TITULO_NOVO = 'Comentarios do mes';
// SALVAR_PRINTS=<pasta> guarda os prints do aceite (os dois estados do Feedback e os títulos)
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

function botaoDoCartao(pag, trecho) {
  return pag.evaluate((trecho) => {
    const c = Array.from(document.querySelectorAll('#lista-fechamento .cartao'))
      .find(x => x.textContent.includes('Aluno Alfa Teste'));
    const b = c && Array.from(c.querySelectorAll('button')).find(x => x.textContent.includes(trecho));
    if (!b) return false;
    b.click();
    return true;
  }, trecho);
}

// o botão da janela do documento pelo texto exato (o "Texto" não pode casar com "Copiar texto")
function botaoDaJanela(pag, texto) {
  return pag.evaluate((texto) => {
    const b = Array.from(document.querySelectorAll('#modal-documento-familia button')).find(x => x.textContent.trim() === texto);
    if (!b) return false;
    b.click();
    return true;
  }, texto);
}

async function ajustes(pag) {
  return pag.evaluate(async () => (await Store.carregar()).ajustes || {});
}

(async () => {
  await amb.subir();
  const pag = await amb.pagina();
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  await H.abrirApp(pag, amb.ORIGEM);

  await pag.evaluate(async (ALUNO) => {
    const d = await Store.carregar();
    d.alunos = (d.alunos || []).filter(a => a.id !== ALUNO);
    d.alunos.push({ id: ALUNO, nome: 'Aluno Alfa Teste', ano: '9', anoEscolar: '9º ano do Ensino Fundamental',
      responsavel: 'Responsavel Alfa', grade: 'quarta-feira, 14:00',
      vigencias: [{ id: 'v_c11', inicio: '2026-01-01', fim: '2026-12-31', valorHora: 100 }] });
    d.aulas = (d.aulas || []).filter(a => a.alunoId !== ALUNO);
    d.aulas.push({ id: 'aula_c11_1', alunoId: ALUNO, data: '2026-06-10', hora: '14:00', duracaoMin: 60,
      status: 'realizada', cobravel: true, assunto: 'Equações' });
    // com feedback escrito: feedback em branco não sai no PDF, nem o título dele
    d.resumos = (d.resumos || []).filter(r => r.alunoId !== ALUNO);
    d.resumos.push({ alunoId: ALUNO, mes: '2026-06', texto: 'Bom mês.' });
    await Store.salvar(d);
  }, ALUNO);
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('1. Desligado: a janela do Feedback é a de sempre');
  await irAoFechamento(pag);
  conf('abriu a janela do Feedback', await botaoDoCartao(pag, 'feedback'), true);
  await esperar('janela do Feedback', () => pag.$eval('#modal-resumo', e => e.classList.contains('aberto')), v => v === true, 5000);
  const janela = await pag.evaluate(() => ({
    roteiro: !!document.querySelector('#roteiro-feedback'),
    campos: document.querySelectorAll('#corpo-modal-resumo textarea, #corpo-modal-resumo input').length
  }));
  conf('sem roteiro', janela.roteiro, false);
  conf('um campo só, o do texto', janela.campos, 1);
  await printar(pag, 'feedback_desligado');
  await pag.evaluate(() => document.querySelector('#modal-resumo [data-fechar]').click());
  await pausa(300);

  // ================================================================
  secao('2. Os títulos: fechados por padrão, os de sempre na prévia');
  conf('abriu o documento da família', await botaoDoCartao(pag, 'Preparar e enviar'), true);
  await esperar('janela do documento', () => pag.$eval('#modal-documento-familia', e => e.classList.contains('aberto')), v => v === true, 5000);
  const titulosDaPrevia = () => pag.evaluate(() =>
    Array.from(document.querySelectorAll('#modal-documento-familia .previa-doc-secao-titulo')).map(e => e.textContent));
  conf('o editor de títulos nasce fechado', await pag.$eval('#doc-titulos', e => e.open), false);
  conf('a prévia tem o título de sempre do feedback', (await titulosDaPrevia()).includes('Feedback'), true);

  // ================================================================
  secao('3. O título que ela troca vale na prévia e fica guardado');
  await pag.evaluate((novo) => {
    document.querySelector('#doc-titulos').open = true;
    const c = document.querySelector('#doc-titulo-feedback');
    c.value = novo;
    c.dispatchEvent(new Event('input', { bubbles: true }));
  }, TITULO_NOVO);
  await pausa(400);
  const previa = await titulosDaPrevia();
  conf('a prévia mostra o título novo', previa.includes(TITULO_NOVO), true);
  conf('e não o antigo', previa.includes('Feedback'), false);
  await printar(pag, 'titulos_do_documento');
  conf('os outros títulos não mudam', previa.includes('Datas trabalhadas'), true);
  await H.abrirApp(pag, amb.ORIGEM);
  conf('depois de recarregar, o título está guardado', ((await ajustes(pag)).titulosFechamento || {}).feedback, TITULO_NOVO);
  conf('e só ele', Object.keys((await ajustes(pag)).titulosFechamento || {}).join(','), 'feedback');

  // ================================================================
  secao('4. O texto e o PDF de verdade levam o título novo');
  await pag.evaluate(() => {
    navigator.canShare = () => false;
    window.__blobs = [];
    const orig = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (b) => { window.__blobs.push(b); return orig(b); };
  });
  await irAoFechamento(pag);
  // C10b: o texto e o PDF saíram do cartão e moram na janela do documento
  await botaoDoCartao(pag, 'Preparar e enviar');
  await esperar('janela do documento', () => pag.$eval('#modal-documento-familia', e => e.classList.contains('aberto')), v => v === true, 5000);
  conf('tocou em Texto', await botaoDaJanela(pag, 'Texto'), true);
  await pausa(600);
  conf('tocou em PDF do fechamento', await botaoDaJanela(pag, 'PDF do fechamento'), true);
  await esperar('dois arquivos', () => pag.evaluate(() => window.__blobs.length), v => v >= 2, 15000);
  await pag.evaluate(() => document.querySelector('#modal-documento-familia [data-fechar]').click());
  await pausa(300);
  const saidas = await pag.evaluate(async () => {
    const t = [];
    for (const b of window.__blobs) t.push(new TextDecoder('latin1').decode(new Uint8Array(await b.arrayBuffer())));
    return { md: t.find(x => x.indexOf('# ') === 0) || '', pdf: t.find(x => x.indexOf('%PDF') === 0) || '' };
  });
  conf('o texto tem a seção com o título novo', saidas.md.includes('## ' + TITULO_NOVO), true);
  conf('o texto não tem mais "## Feedback"', saidas.md.includes('## Feedback'), false);
  conf('o PDF tem o título novo', saidas.pdf.includes(TITULO_NOVO), true);

  // ================================================================
  secao('5. Título apagado volta ao de sempre');
  conf('abriu o documento de novo', await botaoDoCartao(pag, 'Preparar e enviar'), true);
  await esperar('janela do documento', () => pag.$eval('#modal-documento-familia', e => e.classList.contains('aberto')), v => v === true, 5000);
  conf('o campo mostra o título dela', await pag.$eval('#doc-titulo-feedback', e => e.value), TITULO_NOVO);
  await pag.evaluate(() => {
    const c = document.querySelector('#doc-titulo-feedback');
    c.value = '   ';
    c.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await pausa(400);
  conf('a prévia volta a "Feedback"', (await titulosDaPrevia()).includes('Feedback'), true);
  await pausa(300);
  conf('e o ajuste fica sem a chave', JSON.stringify((await ajustes(pag)).titulosFechamento || {}), '{}');
  await pag.evaluate(() => document.querySelector('#modal-documento-familia [data-fechar]').click());
  await pausa(300);

  // ================================================================
  secao('6. Ligado em Ajustes, o roteiro aparece e fica guardado');
  await pag.click('button[data-tela="ajustes"]');
  await pausa(400);
  conf('a caixa do roteiro nasce desmarcada', await pag.$eval('#chk-roteiro-feedback', e => e.checked), false);
  await pag.click('#chk-roteiro-feedback');
  await pausa(500);
  await H.abrirApp(pag, amb.ORIGEM);
  conf('depois de recarregar, o roteiro está ligado', ((await ajustes(pag)).roteiroFeedback || {}).ligado, true);
  await irAoFechamento(pag);
  await botaoDoCartao(pag, 'feedback');
  await esperar('janela do Feedback', () => pag.$eval('#modal-resumo', e => e.classList.contains('aberto')), v => v === true, 5000);
  conf('as três perguntas de sempre', await pag.evaluate(() =>
    [0, 1, 2].map(i => document.querySelector('#roteiro-pergunta-' + i).value).join(' | ')),
    'O que já consegue fazer sem ajuda neste mês? | Onde ainda precisa de apoio? | O que vem no próximo mês?');
  await printar(pag, 'feedback_com_roteiro');

  // ================================================================
  secao('7. A pergunta reescrita e o texto montado das respostas');
  await pag.evaluate(() => {
    const p = document.querySelector('#roteiro-pergunta-0');
    p.value = 'O que ela fez sozinha?';
    document.querySelector('#roteiro-resposta-0').value = 'Resolveu as equações.';
    document.querySelector('#roteiro-resposta-2').value = 'Sistemas.';
    document.querySelector('#roteiro-montar').click();
  });
  await pausa(300);
  conf('o texto sai montado das respostas (pergunta sem resposta não entra)',
    await pag.$eval('#campo-resumo', e => e.value),
    'O que ela fez sozinha?\nResolveu as equações.\n\nO que vem no próximo mês?\nSistemas.');
  await pag.evaluate(() => {
    const a = document.querySelector('#campo-resumo');
    a.value = a.value + '\nObrigada!';
    document.querySelector('#salvar-resumo').click();
  });
  await pausa(600);
  await H.abrirApp(pag, amb.ORIGEM);
  const guardado = await pag.evaluate(async (ALUNO) => {
    const d = await Store.carregar();
    const r = d.resumos.find(x => x.alunoId === ALUNO && x.mes === '2026-06');
    return { texto: r ? r.texto : '', perguntas: ((d.ajustes || {}).roteiroFeedback || {}).perguntas };
  }, ALUNO);
  conf('o texto editado depois de montado foi o que ficou', guardado.texto.endsWith('Sistemas.\nObrigada!'), true);
  conf('a pergunta reescrita ficou guardada, as outras no padrão', JSON.stringify(guardado.perguntas),
    JSON.stringify(['O que ela fez sozinha?', '', '']));
  await irAoFechamento(pag);
  await botaoDoCartao(pag, 'feedback');
  await esperar('janela do Feedback', () => pag.$eval('#modal-resumo', e => e.classList.contains('aberto')), v => v === true, 5000);
  conf('reaberta, a janela traz a pergunta dela', await pag.$eval('#roteiro-pergunta-0', e => e.value), 'O que ela fez sozinha?');

  // ================================================================
  secao('7b. Resposta escrita e salva sem montar não some');
  await pag.evaluate(() => {
    document.querySelector('#roteiro-resposta-1').value = 'Frações.';
    document.querySelector('#salvar-resumo').click();
  });
  await pausa(600);
  await H.abrirApp(pag, amb.ORIGEM);
  const semMontar = await pag.evaluate(async (ALUNO) => {
    const d = await Store.carregar();
    const r = d.resumos.find(x => x.alunoId === ALUNO && x.mes === '2026-06');
    return r ? r.texto : '';
  }, ALUNO);
  conf('o texto de antes ficou, e a resposta foi para o fim', semMontar,
    'O que ela fez sozinha?\nResolveu as equações.\n\nO que vem no próximo mês?\nSistemas.\nObrigada!\n\nOnde ainda precisa de apoio?\nFrações.');

  // ================================================================
  secao('8. Nenhum erro');
  conf('nenhum erro de página', pag.errosDePagina.join(' | '), '');
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
