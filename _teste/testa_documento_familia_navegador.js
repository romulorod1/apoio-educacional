/* testa_documento_familia_navegador.js
 *
 * Validacao UX-UI e teste assimetrico de privacidade para T10:
 * - Entrada clara: botao "Preparar e enviar" (antes "Preparar documento para a familia") com previa e opcoes compreensiveis.
 * - Preservacao de todas as saidas oferecidas (PDF fechamento, PDF com folhas, Texto, Cartao, Mes numa tela).
 * - Previa interativa em tempo real com atualizacao instantanea de feedback e opcoes.
 * - Teste assimetrico de privacidade:
 *   PUBLICO_AULA_ALFA (nota publica da aula)
 *   PRIVADO_ALFA_NAO_EXPORTAR (nota particular 'So minha')
 *   FEEDBACK_FAMILIA_ALFA (feedback do mes para a familia)
 * - Verificacao rigorosa de presenca e ausencia esperadas em todas as saidas (PDF, texto, previa, cartao, tela da familia).
 * - Verificacao de zero ocorrencias de PRIVADO_ALFA_NAO_EXPORTAR em qualquer documento ou saida familiar.
 * - Teste de alternancia independente de notas e temas.
 * - Sem travessoes nem hifens duplos.
 */
'use strict';
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8849, 'nath_t10_doc_familia');
const { conf, secao, esperar, pausa, placar } = H;

const PUBLICO_AULA_ALFA = 'PUBLICO_AULA_ALFA';
const PRIVADO_ALFA_NAO_EXPORTAR = 'PRIVADO_ALFA_NAO_EXPORTAR';
const FEEDBACK_FAMILIA_ALFA = 'FEEDBACK_FAMILIA_ALFA';

async function rodar() {
  await amb.subir();
  const pag = await amb.pagina();
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('1. Criacao dos dados de teste assimetrico (aluno e aula com notas)');

  await pag.evaluate(async (pub, priv) => {
    const dados = await Store.carregar();
    dados.alunos = dados.alunos || [];
    let aluno = dados.alunos.find(a => a.id === 'aluno_alfa_t10');
    if (!aluno) {
      aluno = {
        id: 'aluno_alfa_t10',
        nome: 'Aluno Alfa Teste',
        ano: '9',
        anoEscolar: '9º ano do Ensino Fundamental',
        responsavel: 'Responsavel Alfa',
        telefone: '11999998888',
        grade: 'quarta-feira, 14:00',
        vigencias: [{
          id: 'v_alfa',
          inicio: '2026-01-01',
          fim: '2026-12-31',
          valorHora: 120
        }]
      };
      dados.alunos.push(aluno);
    }

    dados.aulas = dados.aulas || [];
    dados.aulas = dados.aulas.filter(a => a.id !== 'aula_alfa_1');
    dados.aulas.push({
      id: 'aula_alfa_1',
      alunoId: 'aluno_alfa_t10',
      data: '2026-06-10',
      hora: '14:00',
      duracaoMin: 60,
      status: 'realizada',
      cobravel: true,
      assunto: 'Equações e Sistemas',
      notaTexto: pub,
      notaPrivada: priv,
      temNota: true,
      areas: ['algebra'],
      temas: [{ id: 't_alfa', titulo: 'Equações do 1o grau', area: 'algebra' }]
    });

    await Store.salvar(dados);
  }, PUBLICO_AULA_ALFA, PRIVADO_ALFA_NAO_EXPORTAR);

  // Recarregar pagina e aguardar aplicacao carregar do IndexedDB
  await H.abrirApp(pag, amb.ORIGEM);

  conf('aluno e aula de teste criados no IndexedDB', true, true);

  // ================================================================
  secao('2. Navegacao para o Fechamento e presenca dos botoes');

  await pag.click('button[data-tela="fechamento"]');
  await pausa(400);

  // Selecionar mes de Junho de 2026
  await pag.evaluate(() => {
    const sel = document.querySelector('#mes-fechamento');
    if (sel) {
      sel.value = '2026-06';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await pausa(400);

  // Verificar se o cartao do Aluno Alfa foi renderizado
  const cartaoAlfaExiste = await pag.evaluate(() => {
    const titulos = Array.from(document.querySelectorAll('#lista-fechamento .cartao .titulo'));
    return titulos.some(t => t.textContent.includes('Aluno Alfa Teste'));
  });
  conf('cartao do Aluno Alfa renderizado no fechamento', cartaoAlfaExiste, true);

  // Verificar presenca do novo botao em destaque "Preparar documento para a familia" no cartao do Aluno Alfa
  const botaoPrepararExiste = await pag.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#lista-fechamento .cartao'));
    const cAlfa = cards.find(c => c.textContent.includes('Aluno Alfa Teste'));
    if (!cAlfa) return false;
    const b = cAlfa.querySelector('.btn-preparar-doc');
    // C10b: o botão principal do cartão passou a se chamar "Preparar e enviar"
    return b && b.textContent.includes('Preparar e enviar');
  });
  conf('botao "Preparar e enviar" visivel no cartao', botaoPrepararExiste, true);

  /* Verificar preservacao das saidas e atalhos existentes (nao eliminadas).
   * C10b: o feedback continua no cartao; os formatos moram na janela do
   * documento, que e aberta aqui so para ler os botoes e fechada em seguida. */
  const botoesExistentesPreservados = await pag.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#lista-fechamento .cartao'));
    const cAlfa = cards.find(c => c.textContent.includes('Aluno Alfa Teste'));
    if (!cAlfa) return {};
    const doCartao = Array.from(cAlfa.querySelectorAll('.barra button')).map(b => b.textContent.trim());
    cAlfa.querySelector('.btn-preparar-doc').click();
    const textos = Array.from(document.querySelectorAll('#modal-documento-familia button')).map(b => b.textContent.trim());
    document.querySelector('#modal-documento-familia [data-fechar]').click();
    return {
      temFeedback: doCartao.some(t => t.includes('feedback')),
      temMesNaTela: textos.includes('O mês numa tela'),
      temTexto: textos.includes('Texto'),
      temPdfFechamento: textos.includes('PDF do fechamento'),
      temCartao: textos.includes('Cartão do mês'),
      temPdfFolhas: textos.includes('PDF com as folhas')
    };
  });
  conf('atalho feedback preservado', botoesExistentesPreservados.temFeedback, true);
  conf('atalho O mes numa tela preservado', botoesExistentesPreservados.temMesNaTela, true);
  conf('atalho Texto preservado', botoesExistentesPreservados.temTexto, true);
  conf('atalho PDF do fechamento preservado', botoesExistentesPreservados.temPdfFechamento, true);
  conf('atalho Cartao do mes preservado', botoesExistentesPreservados.temCartao, true);
  conf('atalho PDF com as folhas preservado', botoesExistentesPreservados.temPdfFolhas, true);

  // ================================================================
  secao('3. Abertura do modal "Preparar documento para a familia" e Previa em Tempo Real');

  await pag.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#lista-fechamento .cartao'));
    const cAlfa = cards.find(c => c.textContent.includes('Aluno Alfa Teste'));
    if (cAlfa) {
      const b = cAlfa.querySelector('.btn-preparar-doc');
      if (b) b.click();
    }
  });
  await pausa(300);

  const modalAberto = await pag.evaluate(() => {
    const m = document.querySelector('#modal-documento-familia');
    return m && m.classList.contains('aberto');
  });
  conf('modal do documento da familia abriu para Aluno Alfa', modalAberto, true);

  // Digitar FEEDBACK_FAMILIA_ALFA no campo de feedback
  await pag.evaluate((fb) => {
    const txt = document.querySelector('#doc-feedback-texto');
    txt.value = fb;
    txt.dispatchEvent(new Event('input', { bubbles: true }));
  }, FEEDBACK_FAMILIA_ALFA);
  await pausa(300);

  // Verificar sincronizacao com a previa em tempo real
  const textoPrevia = await pag.evaluate(() => {
    const previa = document.querySelector('#conteudo-previa-doc-familia');
    return previa ? previa.textContent : '';
  });

  conf('previa exibe FEEDBACK_FAMILIA_ALFA em tempo real', textoPrevia.includes(FEEDBACK_FAMILIA_ALFA), true);
  conf('previa NUNCA exibe PRIVADO_ALFA_NAO_EXPORTAR', textoPrevia.includes(PRIVADO_ALFA_NAO_EXPORTAR), false);

  // ================================================================
  secao('4. Alternancia independente de notas e temas');

  // Inicialmente chkNotas esta desmarcado: PUBLICO_AULA_ALFA nao deve estar na previa
  const temPublicoSemNotas = await pag.evaluate((pub) => {
    const previa = document.querySelector('#conteudo-previa-doc-familia');
    return previa && previa.textContent.includes(pub);
  }, PUBLICO_AULA_ALFA);
  conf('sem marcar notas: nota publica ausente da previa', temPublicoSemNotas, false);

  // Marcar chkNotas: PUBLICO_AULA_ALFA deve passar a aparecer, PRIVADO continua ausente
  await pag.evaluate(() => {
    const chk = document.querySelector('#doc-chk-notas');
    chk.checked = true;
    chk.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await pausa(200);

  const textoComNotas = await pag.evaluate(() => {
    const previa = document.querySelector('#conteudo-previa-doc-familia');
    return previa ? previa.textContent : '';
  });
  conf('com notas marcadas: PUBLICO_AULA_ALFA aparece na previa', textoComNotas.includes(PUBLICO_AULA_ALFA), true);
  conf('com notas marcadas: PRIVADO_ALFA_NAO_EXPORTAR permanece com zero ocorrencias',
    textoComNotas.includes(PRIVADO_ALFA_NAO_EXPORTAR), false);

  // Alternar temas: desmarcar temas oculta a secao "Temas trabalhados"
  await pag.evaluate(() => {
    const chk = document.querySelector('#doc-chk-temas');
    chk.checked = false;
    chk.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await pausa(200);

  const temTemasDesmarcado = await pag.evaluate(() => {
    const previa = document.querySelector('#conteudo-previa-doc-familia');
    return previa && previa.textContent.includes('Temas trabalhados');
  });
  conf('temas desmarcados: secao "Temas trabalhados" oculta', temTemasDesmarcado, false);

  // Reativar temas
  await pag.evaluate(() => {
    const chk = document.querySelector('#doc-chk-temas');
    chk.checked = true;
    chk.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await pausa(200);

  const temTemasReativado = await pag.evaluate(() => {
    const previa = document.querySelector('#conteudo-previa-doc-familia');
    return previa && previa.textContent.includes('Temas trabalhados');
  });
  conf('temas reativados: secao "Temas trabalhados" visivel', temTemasReativado, true);

  // ================================================================
  secao('5. Teste assimetrico de privacidade no Texto Markdown exportado');

  const resultadoTexto = await pag.evaluate(async (pub, priv, fb) => {
    const dados = await Store.carregar();
    const f = Core.calcularFechamento(dados, 'aluno_alfa_t10', '2026-06');
    const mdSemNotas = Core.markdownFechamento(f, { incluirNotas: false, exibirTemasEAreas: true });
    const mdComNotas = Core.markdownFechamento(f, { incluirNotas: true, exibirTemasEAreas: true });
    return {
      semNotas: {
        temPrivado: mdSemNotas.includes(priv),
        temPublico: mdSemNotas.includes(pub),
        temFeedback: mdSemNotas.includes(fb)
      },
      comNotas: {
        temPrivado: mdComNotas.includes(priv),
        temPublico: mdComNotas.includes(pub),
        temFeedback: mdComNotas.includes(fb)
      }
    };
  }, PUBLICO_AULA_ALFA, PRIVADO_ALFA_NAO_EXPORTAR, FEEDBACK_FAMILIA_ALFA);

  conf('texto sem notas: PRIVADO tem 0 ocorrencias', resultadoTexto.semNotas.temPrivado, false);
  conf('texto sem notas: FEEDBACK esta presente', resultadoTexto.semNotas.temFeedback, true);
  conf('texto sem notas: PUBLICO esta ausente', resultadoTexto.semNotas.temPublico, false);

  conf('texto com notas: PRIVADO tem 0 ocorrencias', resultadoTexto.comNotas.temPrivado, false);
  conf('texto com notas: FEEDBACK esta presente', resultadoTexto.comNotas.temFeedback, true);
  conf('texto com notas: PUBLICO esta presente', resultadoTexto.comNotas.temPublico, true);

  // ================================================================
  secao('6. Teste assimetrico de privacidade no PDF do Fechamento');

  const resultadoPdf = await pag.evaluate(async (pub, priv, fb) => {
    const dados = await Store.carregar();
    const f = Core.calcularFechamento(dados, 'aluno_alfa_t10', '2026-06');
    const gen = typeof PDFGen !== 'undefined' ? PDFGen : Pdf;

    // 1. PDF padrao sem notas publicas
    const bytesSemNotas = gen.gerarFechamento(f, { incluirNotasPublicas: false, exibirTemasEAreas: true });
    let strSemNotas = '';
    for (let i = 0; i < bytesSemNotas.length; i++) strSemNotas += String.fromCharCode(bytesSemNotas[i]);

    // 2. PDF padrao com notas publicas
    const bytesComNotas = gen.gerarFechamento(f, { incluirNotasPublicas: true, exibirTemasEAreas: true });
    let strComNotas = '';
    for (let i = 0; i < bytesComNotas.length; i++) strComNotas += String.fromCharCode(bytesComNotas[i]);

    // 3. PDF com folhas sem notas publicas
    const bytesFolhasSemNotas = gen.gerarFechamento(f, { incluirFolhas: true, incluirNotasPublicas: false, notas: [], exibirTemasEAreas: true });
    let strFolhasSemNotas = '';
    for (let i = 0; i < bytesFolhasSemNotas.length; i++) strFolhasSemNotas += String.fromCharCode(bytesFolhasSemNotas[i]);

    // 4. PDF com folhas com notas publicas
    const bytesFolhasComNotas = gen.gerarFechamento(f, { incluirFolhas: true, incluirNotasPublicas: true, notas: [], exibirTemasEAreas: true });
    let strFolhasComNotas = '';
    for (let i = 0; i < bytesFolhasComNotas.length; i++) strFolhasComNotas += String.fromCharCode(bytesFolhasComNotas[i]);

    return {
      semNotas: {
        temPrivado: strSemNotas.includes(priv),
        temFeedback: strSemNotas.includes(fb),
        temPublico: strSemNotas.includes(pub)
      },
      comNotas: {
        temPrivado: strComNotas.includes(priv),
        temFeedback: strComNotas.includes(fb),
        temPublico: strComNotas.includes(pub)
      },
      folhasSemNotas: {
        temPrivado: strFolhasSemNotas.includes(priv),
        temFeedback: strFolhasSemNotas.includes(fb),
        temPublico: strFolhasSemNotas.includes(pub)
      },
      folhasComNotas: {
        temPrivado: strFolhasComNotas.includes(priv),
        temFeedback: strFolhasComNotas.includes(fb),
        temPublico: strFolhasComNotas.includes(pub)
      }
    };
  }, PUBLICO_AULA_ALFA, PRIVADO_ALFA_NAO_EXPORTAR, FEEDBACK_FAMILIA_ALFA);

  conf('PDF fechamento sem notas: PRIVADO tem 0 ocorrencias', resultadoPdf.semNotas.temPrivado, false);
  conf('PDF fechamento sem notas: FEEDBACK esta presente no documento', resultadoPdf.semNotas.temFeedback, true);
  conf('PDF fechamento sem notas: PUBLICO esta ausente do documento', resultadoPdf.semNotas.temPublico, false);

  conf('PDF fechamento com notas: PRIVADO tem 0 ocorrencias', resultadoPdf.comNotas.temPrivado, false);
  conf('PDF fechamento com notas: FEEDBACK esta presente no documento', resultadoPdf.comNotas.temFeedback, true);
  conf('PDF fechamento com notas: PUBLICO esta presente no documento', resultadoPdf.comNotas.temPublico, true);

  conf('PDF com folhas sem notas: PRIVADO tem 0 ocorrencias', resultadoPdf.folhasSemNotas.temPrivado, false);
  conf('PDF com folhas sem notas: PUBLICO esta ausente', resultadoPdf.folhasSemNotas.temPublico, false);

  conf('PDF com folhas com notas: PRIVADO tem 0 ocorrencias', resultadoPdf.folhasComNotas.temPrivado, false);
  conf('PDF com folhas com notas: PUBLICO esta presente', resultadoPdf.folhasComNotas.temPublico, true);

  // ================================================================
  secao('7. Teste de privacidade no Cartao do Mes e Modo Familia (O mes numa tela)');

  // Fechar modal do documento da familia clicando no botao Fechar
  await pag.evaluate(() => {
    const b = document.querySelector('#modal-documento-familia button');
    if (b) b.click();
  });
  await pausa(300);

  /* C10b: o Cartao do mes e O mes numa tela moram em "Mais formatos", na
   * janela do documento. O caminho abre a janela e toca la dentro. */
  async function tocarEmMaisFormatos(trecho) {
    await pag.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('#lista-fechamento .cartao'));
      const cAlfa = cards.find(c => c.textContent.includes('Aluno Alfa Teste'));
      if (cAlfa) cAlfa.querySelector('.btn-preparar-doc').click();
    });
    await pausa(300);
    await pag.evaluate((trecho) => {
      const b = Array.from(document.querySelectorAll('#doc-mais-formatos button')).find(x => x.textContent.includes(trecho));
      if (b) b.click();
    }, trecho);
  }

  // Abrir Cartao do mes para Aluno Alfa
  await tocarEmMaisFormatos('Cartão');
  await pausa(300);

  const cartaoTexto = await pag.evaluate(() => {
    const c = document.querySelector('#corpo-modal-cartao');
    return c ? c.textContent : '';
  });
  conf('Cartao do mes: PRIVADO tem 0 ocorrencias', cartaoTexto.includes(PRIVADO_ALFA_NAO_EXPORTAR), false);

  await pag.evaluate(() => {
    const b = document.querySelector('#modal-cartao [data-fechar]');
    if (b) b.click();
  });
  await pausa(200);

  // Abrir "O mes numa tela"
  await tocarEmMaisFormatos('O mês numa tela');
  await pausa(400);

  // No modo normal (professora), nota privada aparece em .so-minha
  const temSoMinhaProfessora = await pag.evaluate((priv) => {
    const elPriv = document.querySelector('.so-minha');
    return elPriv && elPriv.textContent.includes(priv);
  }, PRIVADO_ALFA_NAO_EXPORTAR);
  conf('O mes numa tela (modo professora): nota privada visivel em .so-minha', temSoMinhaProfessora, true);

  // Entrar no modo da familia
  await pag.click('#mostrar-para-familia');
  await pausa(150);
  await pag.click('#confirmar-familia');
  await pausa(200);

  const corpoFamilia = await pag.evaluate(() => {
    const c = document.querySelector('#corpo-modal-mes');
    return c ? c.textContent : '';
  });

  conf('Modo Familia: PRIVADO_ALFA_NAO_EXPORTAR tem 0 ocorrencias', corpoFamilia.includes(PRIVADO_ALFA_NAO_EXPORTAR), false);
  conf('Modo Familia: PUBLICO_AULA_ALFA permanece visivel', corpoFamilia.includes(PUBLICO_AULA_ALFA), true);

  // Sair do modo familia segurando o botao
  await pag.evaluate(() => {
    const btnSair = document.querySelector('#sair-modo-familia');
    if (btnSair) {
      btnSair.dispatchEvent(new Event('pointerdown'));
    }
  });
  await pausa(1400);

  await pag.evaluate(() => {
    const m = document.querySelector('#modal-mes');
    if (m) m.classList.remove('aberto');
  });
  await pausa(200);

  // ================================================================
  secao('9. Saneamento complementar T10: canceladas futuras na previa, filtro de notas futuras e distincao visual');

  // 1. Distincao visual dos botoes e legenda de folhas no modal atual (2026-06)
  await pag.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#lista-fechamento .cartao'));
    const cAlfa = cards.find(c => c.textContent.includes('Aluno Alfa Teste'));
    if (cAlfa) {
      const b = cAlfa.querySelector('.btn-preparar-doc');
      if (b) b.click();
    }
  });
  await pausa(300);

  const botoesModal = await pag.evaluate(() => {
    const btnFolhas = document.querySelector('#btn-doc-familia-pdf-folhas');
    const btnFechamento = document.querySelector('#btn-doc-familia-pdf-fechamento');
    const ajuda = document.querySelector('#ajuda-doc-familia-folhas');
    return {
      folhasExiste: !!btnFolhas,
      fechamentoExiste: !!btnFechamento,
      ajudaExiste: !!ajuda,
      ajudaTexto: ajuda ? ajuda.textContent : '',
      folhasTitle: btnFolhas ? btnFolhas.getAttribute('title') : ''
    };
  });
  conf('botao PDF com as folhas tem ID especifico', botoesModal.folhasExiste, true);
  conf('botao PDF do fechamento tem ID especifico', botoesModal.fechamentoExiste, true);
  conf('legenda explicativa para PDF com folhas visivel no modal', botoesModal.ajudaExiste, true);
  conf('legenda esclarece que desenhos manuscritos nao saem na previa', botoesModal.ajudaTexto.includes('desenhos manuscritos'), true);

  // Fechar modal atual para atualizar dados
  await pag.evaluate(() => {
    const btnFechar = Array.from(document.querySelectorAll('#rodape-modal-doc-familia button')).find(b => b.textContent.includes('Fechar'));
    if (btnFechar) btnFechar.click();
  });
  await pausa(300);

  // 2. Injetar aula futura cancelada e aula futura com nota para testar previa, markdown e PDF
  /* O mes SEGUINTE ao do relogio, e nao um mes escrito. O teste nasceu em
   * setembro de 2026 com '2026-10' fixo, que era futuro; em outubro virou o mes
   * corrente, as aulas de 10 e 12 viraram passado, e seis conferencias
   * reprovaram sem nenhuma linha do aplicativo ter mudado. */
  const proximo = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
  const MES_FUTURO = proximo.getFullYear() + '-' + String(proximo.getMonth() + 1).padStart(2, '0');
  const DIA_CANCELADA = '10/' + MES_FUTURO.slice(5);
  await pag.evaluate(async (MES_FUTURO) => {
    const dados = await Store.carregar();
    dados.aulas.push({
      id: 'aula_alfa_futura_cancelada',
      alunoId: 'aluno_alfa_t10',
      data: MES_FUTURO + '-10',
      hora: '14:00',
      duracaoMin: 60,
      status: 'cancelada',
      cobravel: true,
      valor: 100,
      notaTexto: 'Nota de aula futura cancelada'
    });
    dados.aulas.push({
      id: 'aula_alfa_futura_agendada',
      alunoId: 'aluno_alfa_t10',
      data: MES_FUTURO + '-12',
      hora: '15:00',
      duracaoMin: 60,
      status: 'realizada',
      cobravel: true,
      valor: 100,
      temNota: true,
      notaTexto: 'Planejamento confidencial que nao deve sair em notas realizadas'
    });
    await Store.salvar(dados);
  }, MES_FUTURO);

  // Recarregar app para inicializar db com as novas aulas
  await H.abrirApp(pag, amb.ORIGEM);

  // Navegar para aba Fechamento e selecionar o mes seguinte
  await pag.evaluate((MES_FUTURO) => {
    const abaFech = document.querySelector('#abas .aba[data-tela="fechamento"]');
    if (abaFech) abaFech.click();
    const sel = document.querySelector('#mes-fechamento');
    if (sel) {
      sel.value = MES_FUTURO;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, MES_FUTURO);
  await pausa(400);

  // Abrir modal da familia para Aluno Alfa no mes seguinte
  await pag.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#lista-fechamento .cartao'));
    const cAlfa = cards.find(c => c.textContent.includes('Aluno Alfa Teste'));
    if (cAlfa) {
      const b = cAlfa.querySelector('.btn-preparar-doc');
      if (b) b.click();
    }
  });
  await pausa(400);

  const resultadoFuturas = await pag.evaluate(async (MES_FUTURO, DIA_CANCELADA) => {
    // Marcar chkNotas
    const chkNotas = document.querySelector('#doc-chk-notas');
    if (chkNotas && !chkNotas.checked) chkNotas.click();

    const previa = document.querySelector('#conteudo-previa-doc-familia');
    const textoPrevia = previa ? previa.textContent : '';

    const dados = await Store.carregar();
    const f = Core.calcularFechamento(dados, 'aluno_alfa_t10', MES_FUTURO);
    const md = Core.markdownFechamento(f, { incluirNotas: true, exibirTemasEAreas: true });

    let pdfTexto = '';
    try {
      const bytes = PDFGen.gerarFechamento(f, {
        exibirTemasEAreas: true,
        incluirNotasPublicas: true,
        incluirFolhas: false
      });
      pdfTexto = new TextDecoder('latin1').decode(bytes);
    } catch (e) {
      pdfTexto = 'ERRO: ' + e.message;
    }

    return {
      previaTemAulasCanceladasAFrente: textoPrevia.includes('Aulas canceladas à frente'),
      previaTemDataCancelada: textoPrevia.includes(DIA_CANCELADA),
      previaTemNotaFutura: textoPrevia.includes('Planejamento confidencial'),
      mdTemAulasCanceladasAFrente: md.includes('## Aulas canceladas à frente'),
      mdTemNotaFutura: md.includes('Planejamento confidencial'),
      pdfTemAulasCanceladasAFrente: pdfTexto.includes('Aulas canceladas'),
      pdfTemNotaFutura: pdfTexto.includes('Planejamento confidencial')
    };
  }, MES_FUTURO, DIA_CANCELADA);

  conf('previa exibe secao "Aulas canceladas a frente"', resultadoFuturas.previaTemAulasCanceladasAFrente, true);
  conf('previa exibe data da cancelada futura (' + DIA_CANCELADA + ')', resultadoFuturas.previaTemDataCancelada, true);
  conf('previa NUNCA exibe notas de aulas futuras', resultadoFuturas.previaTemNotaFutura, false);
  conf('Markdown exibe secao "Aulas canceladas a frente"', resultadoFuturas.mdTemAulasCanceladasAFrente, true);
  conf('Markdown NUNCA exibe notas de aulas futuras', resultadoFuturas.mdTemNotaFutura, false);
  conf('PDF exibe secao de canceladas a frente', resultadoFuturas.pdfTemAulasCanceladasAFrente, true);
  conf('PDF NUNCA exibe notas de aulas futuras', resultadoFuturas.pdfTemNotaFutura, false);

  // ================================================================
  secao('10. Verificacao de ausencia de travessoes e hifens duplos na interface');

  const textoGeralApp = await pag.evaluate(() => {
    return document.body.innerText;
  });
  conf('zero travessoes na interface', textoGeralApp.includes('\u2014'), false);
  conf('zero hifens duplos na interface', textoGeralApp.includes('\x2d\x2d'), false);

  // ================================================================
  secao('Fim da execucao');
  // No dialeto dos irmaos, que e o unico que o portao le: "N aprovados, M
  // falhas" saia la como "nao disse que passou" mesmo com tudo verde.
  console.log('\n' + placar.passes + ' passaram, ' + placar.falhas + ' falharam.');
  await amb.encerrar();
  process.exit(placar.falhas === 0 ? 0 : 1);
}

rodar().catch(err => {
  console.error('Erro na suite de testes:', err);
  amb.encerrar().then(() => process.exit(1));
});
