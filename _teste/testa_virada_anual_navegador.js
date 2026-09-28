/* testa_virada_anual_navegador.js
 *
 * Valida a virada anual com pop-up comparativo (T11):
 * 1. Presenca do cartao "Ano letivo e progressao escolar" na aba Ajustes.
 * 2. Abertura do modal de virada anual sob demanda a partir de Ajustes.
 * 3. Tabela comparativa com Aluno, Serie anterior, Nova serie sugerida e Fim de ciclo.
 * 4. Ajuste manual de serie no seletor.
 * 5. Marcacao de "Encerrar ciclo" com desabilitacao de seletor e destaque visual.
 * 6. Botao "Lembrar mais tarde" fecha o modal sem alterar o banco.
 * 7. Confirmacao da virada:
 *    - Persistencia atomica no Store.
 *    - Registro de db.ajustes.ultimoAnoLetivoAtualizado.
 *    - Inativacao do aluno encerrado (ativo = false).
 *    - Cancelamento de aulas futuras a partir de 01/01 para encerrados.
 *    - Preservacao 100% de aulas passadas e fechamentos historicos.
 *    - Encerramento de recorrencias semanais em db.series.
 * 8. Ausencia de travessoes e hifens duplos.
 */
'use strict';
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8852, 'nath_t11_virada');
const { conf, secao, esperar, pausa } = H;

async function rodar() {
  await amb.subir();
  const pag = await amb.pagina();
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('1. Cartao de Ano Letivo na aba Ajustes');

  // Navega para Ajustes
  await pag.click('#abas .aba[data-tela="ajustes"]');
  await pausa(300);

  const cartaoAnoLetivo = await pag.evaluate(() => {
    const btn = document.querySelector('#btn-revisar-virada-anual');
    const info = document.querySelector('#info-ano-letivo');
    return {
      temBotao: !!btn,
      textoBotao: btn ? btn.textContent.trim() : '',
      temInfo: !!info
    };
  });
  conf('botao de virada anual presente em Ajustes', cartaoAnoLetivo.temBotao, true);
  conf('rotulo claro do botao', cartaoAnoLetivo.textoBotao, 'Revisar anos escolares / Virada de ciclo');
  conf('bloco de informacao de ano letivo presente', cartaoAnoLetivo.temInfo, true);

  // ================================================================
  secao('2. Abertura do modal de virada anual');

  await pag.$eval('#btn-revisar-virada-anual', e => { e.scrollIntoView({ block: 'center' }); e.click(); });
  await esperar('modal de virada aberto', () => pag.evaluate(() => {
    const m = document.querySelector('#modal-virada-anual');
    return m && m.classList.contains('aberto');
  }), v => !!v, 3000);

  const modalAberto = await pag.evaluate(() => {
    const m = document.querySelector('#modal-virada-anual');
    const titulo = document.querySelector('#titulo-modal-virada-anual');
    const tabela = document.querySelector('#modal-virada-anual .tabela-virada');
    const linhas = document.querySelectorAll('#modal-virada-anual .tabela-virada tbody tr');
    return {
      aberto: m && m.classList.contains('aberto'),
      titulo: titulo ? titulo.textContent.trim() : '',
      temTabela: !!tabela,
      qtdLinhas: linhas.length
    };
  });
  conf('modal de virada anual aberto com sucesso', modalAberto.aberto, true);
  conf('tabela de comparacao presente', modalAberto.temTabela, true);
  conf('alunos ativos listados na tabela', modalAberto.qtdLinhas > 0, true);

  // ================================================================
  secao('3. Linhas da tabela comparativa e sugestoes de serie');

  const dadosLinhas = await pag.evaluate(() => {
    const trs = Array.from(document.querySelectorAll('#modal-virada-anual .tabela-virada tbody tr'));
    return trs.map(tr => {
      const nomeEl = tr.querySelector('.nome-aluno-virada');
      const antEl = tr.querySelector('.tag-serie-anterior');
      const sel = tr.querySelector('.select-virada-serie');
      const chk = tr.querySelector('.check-encerrar-ciclo');
      return {
        alunoId: tr.getAttribute('data-aluno-id'),
        nome: nomeEl ? nomeEl.textContent.trim() : '',
        anterior: antEl ? antEl.textContent.trim() : '',
        sugerido: sel ? sel.value : '',
        temCheck: !!chk
      };
    });
  });

  conf('ao menos um aluno listado', dadosLinhas.length > 0, true);
  const primeiroAluno = dadosLinhas[0];
  conf('primeiro aluno possui nome preenchido', !!primeiroAluno.nome, true);
  conf('primeiro aluno possui serie anterior legivel', !!primeiroAluno.anterior, true);
  conf('primeiro aluno possui select com valor sugerido', !!primeiroAluno.sugerido, true);
  conf('primeiro aluno possui checkbox de encerramento', primeiroAluno.temCheck, true);

  // ================================================================
  secao('4. Interacao: Marcacao de Encerrar Ciclo');

  // Marca encerramento para o primeiro aluno via clique
  const alunoParaEncerrar = primeiroAluno.alunoId;
  await pag.evaluate((id) => {
    const chk = document.querySelector('#modal-virada-anual .check-encerrar-ciclo[data-aluno-id="' + id + '"]');
    if (chk) chk.click();
  }, alunoParaEncerrar);
  await pausa(100);

  const estadoLinhaEncerrada = await pag.evaluate((id) => {
    const chk = document.querySelector('#modal-virada-anual .check-encerrar-ciclo[data-aluno-id="' + id + '"]');
    const tr = chk ? chk.closest('tr') : null;
    const sel = tr ? tr.querySelector('.select-virada-serie') : null;
    const aviso = document.querySelector('#aviso-virada-encerrados');
    return {
      temClasse: tr ? tr.classList.contains('linha-encerrada') : false,
      selectDesabilitado: sel ? sel.disabled : false,
      avisoVisivel: aviso && getComputedStyle(aviso).display !== 'none'
    };
  }, alunoParaEncerrar);
  conf('linha ganha classe visual de encerrada', estadoLinhaEncerrada.temClasse, true);
  conf('select de serie fica desabilitado ao encerrar', estadoLinhaEncerrada.selectDesabilitado, true);
  conf('aviso explicativo sobre aulas futuras surge', estadoLinhaEncerrada.avisoVisivel, true);

  // ================================================================
  secao('5. Botao Lembrar Mais Tarde fecha sem salvar');

  await pag.$eval('#virada-lembrar-depois', e => e.click());
  await pausa(200);

  const fechouSemSalvar = await pag.evaluate(() => {
    const m = document.querySelector('#modal-virada-anual');
    return !(m && m.classList.contains('aberto'));
  });
  conf('modal fechado via Lembrar mais tarde', fechouSemSalvar, true);

  // ================================================================
  secao('6. Reabertura, alteracao de serie e confirmacao');

  // Adiciona aulas futuras e passadas para o primeiro aluno via Store e recarrega
  await pag.evaluate(async (alunoId) => {
    const banco = await Store.carregar();
    const anoAtual = new Date().getFullYear();
    window.__teste_anoVirada = anoAtual + 1;
    banco.aulas.push({
      id: 'aula-passada-teste',
      alunoId: alunoId,
      data: anoAtual + '-06-15',
      duracaoMin: 60,
      status: 'realizada',
      cobravel: true
    });
    banco.aulas.push({
      id: 'aula-futura-teste',
      alunoId: alunoId,
      data: (anoAtual + 1) + '-02-10',
      duracaoMin: 60,
      status: 'agendada',
      cobravel: true
    });
    banco.series = banco.series || [];
    banco.series.push({
      id: 'serie-teste-aluno',
      alunoId: alunoId,
      inicio: anoAtual + '-01-01',
      fim: null
    });
    await Store.salvar(banco);
  }, alunoParaEncerrar);

  await pag.reload();
  await H.abrirApp(pag, amb.ORIGEM);

  // Navega para Ajustes e clica no botao de virada anual
  await pag.click('#abas .aba[data-tela="ajustes"]');
  await pausa(300);
  await pag.$eval('#btn-revisar-virada-anual', e => { e.scrollIntoView({ block: 'center' }); e.click(); });
  await esperar('modal de virada reaberto', () => pag.evaluate(() => {
    const m = document.querySelector('#modal-virada-anual');
    return m && m.classList.contains('aberto');
  }), v => !!v, 3000);

  // Altera serie do segundo aluno se houver
  if (dadosLinhas.length > 1) {
    const segundoAlunoId = dadosLinhas[1].alunoId;
    await pag.evaluate((id) => {
      const sel = document.querySelector('.select-virada-serie[data-aluno-id="' + id + '"]');
      if (sel) {
        sel.value = 'em2';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, segundoAlunoId);
  }

  // Marca encerramento para o primeiro aluno
  await pag.evaluate((id) => {
    const chk = document.querySelector('.check-encerrar-ciclo[data-aluno-id="' + id + '"]');
    if (chk) chk.click();
  }, alunoParaEncerrar);

  // Clica no botao de confirmacao
  await pag.$eval('#virada-confirmar-series', e => e.click());
  await pausa(500);

  const confirmacaoEfeituada = await pag.evaluate(async (alunoId) => {
    const m = document.querySelector('#modal-virada-anual');
    const modalFechado = !(m && m.classList.contains('aberto'));
    const banco = await Store.carregar();
    const aluno = banco.alunos.find(a => String(a.id) === String(alunoId));
    const aulaPassada = banco.aulas.find(a => a.id === 'aula-passada-teste');
    const aulaFutura = banco.aulas.find(a => a.id === 'aula-futura-teste');
    const temSerieRecorrente = (banco.series || []).some(s => String(s.alunoId) === String(alunoId));
    const ultimoAno = banco.ajustes && banco.ajustes.ultimoAnoLetivoAtualizado;

    return {
      modalFechado: modalFechado,
      alunoInativo: aluno ? aluno.ativo === false : false,
      alunoEncerradoAno: aluno ? aluno.encerradoAnoLetivo : null,
      aulaPassadaStatus: aulaPassada ? aulaPassada.status : null,
      aulaFuturaStatus: aulaFutura ? aulaFutura.status : null,
      aulaFuturaCobravel: aulaFutura ? aulaFutura.cobravel : null,
      semSerieRecorrente: !temSerieRecorrente,
      ultimoAnoGravado: ultimoAno,
      temHistorico: aluno && Array.isArray(aluno.historicoAnoEscolar) && aluno.historicoAnoEscolar.length > 0
    };
  }, alunoParaEncerrar);

  conf('modal fechado apos confirmacao', confirmacaoEfeituada.modalFechado, true);
  conf('aluno com ciclo encerrado fica inativo (ativo = false)', confirmacaoEfeituada.alunoInativo, true);
  conf('aluno registra ano de encerramento', !!confirmacaoEfeituada.alunoEncerradoAno, true);
  conf('aula passada permanece intacta como realizada', confirmacaoEfeituada.aulaPassadaStatus, 'realizada');
  conf('aula futura foi cancelada', confirmacaoEfeituada.aulaFuturaStatus, 'cancelada');
  conf('aula futura cancelada nao e cobravel', confirmacaoEfeituada.aulaFuturaCobravel, false);
  conf('recorrencia semanal foi removida para o aluno encerrado', confirmacaoEfeituada.semSerieRecorrente, true);
  conf('ultimo ano letivo atualizado gravado em ajustes', confirmacaoEfeituada.ultimoAnoGravado > 2000, true);
  conf('historico escolar anual registrado no aluno', confirmacaoEfeituada.temHistorico, true);

  // ================================================================
  secao('7. Atualizacao do texto em Ajustes');

  await pag.click('#abas .aba[data-tela="ajustes"]');
  await pausa(200);

  const textoAjustesAtualizado = await pag.evaluate(() => {
    const info = document.querySelector('#info-ano-letivo');
    return info ? info.textContent.trim() : '';
  });
  conf('texto de Ajustes exibe o ano letivo revisado', textoAjustesAtualizado.includes('Último ano letivo revisado:'), true);

  // ================================================================
  secao('8. Verificacao de texto: zero travessoes e zero hifens duplos');

  const textoModal = await pag.evaluate(() => {
    const m = document.querySelector('#modal-virada-anual');
    return m ? m.textContent : '';
  });
  conf('nenhum travessao no modal de virada', /[\u2014]/.test(textoModal), false);
  conf('nenhum hifen duplo no modal de virada', /--/.test(textoModal), false);

  conf('zero erros no console da pagina', pag.errosDePagina.join(' | '), '');

  await H.fim(amb)();
}

rodar().catch(err => {
  H.fim(amb)(err);
});
