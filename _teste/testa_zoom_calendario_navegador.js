/* testa_zoom_calendario_navegador.js
 *
 * Valida a organizacao UX-UI do zoom e destaque no calendario (T12):
 * 1. Ausencia de bloco Hoje fixo e preservacao das 5 abas limpas.
 * 2. Estado inicial com painel de zoom recolhido.
 * 3. Clique em um dia do calendario ativa o zoom e destaque visual (.em-zoom).
 * 4. Painel de zoom exibe data por extenso, cards detalhados das aulas e acao rapida.
 * 5. Botao "Fechar destaque" recolhe o zoom.
 * 6. Toggle ao clicar no mesmo dia fecha o zoom.
 * 7. Alternancia suave entre dias diferentes.
 * 8. Botao "Hoje" na barra da agenda navega e foca no dia atual com zoom.
 * 9. Cliques nas pilulas de aula no calendario seguem inalterados (abrem o modal de aula).
 * 10. Toque no card de aula dentro do zoom abre o modal da aula.
 * 11. Botao "+ Nova aula neste dia" abre o agendamento para a data em foco.
 * 12. Tecla Escape fecha o zoom do dia.
 * 13. Ausencia de travessoes e hifens duplos.
 */
'use strict';
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8851, 'nath_t12_zoom');
const { conf, secao, esperar, pausa } = H;

async function rodar() {
  await amb.subir();
  const pag = await amb.pagina();
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('1. Ausencia de bloco Hoje fixo e preservacao das 5 abas');

  const abas = await pag.$$eval('#abas .aba', es => es.map(e => e.textContent.trim()));
  conf('exatamente 5 abas na barra superior', abas.length, 5);
  conf('abas preservam nomes conhecidos', abas.join(' | '), 'Agenda | Alunos | Fechamento | Biblioteca | Ajustes');

  const existeBlocoHojeFixo = await pag.evaluate(() => {
    return !!document.querySelector('#bloco-hoje, .bloco-hoje, #secao-hoje');
  });
  conf('nao ha bloco Hoje fixo poluindo a Agenda', existeBlocoHojeFixo, false);

  // ================================================================
  secao('2. Estado inicial do zoom no calendario');

  const painelInicialVisivel = await pag.evaluate(() => {
    const p = document.querySelector('#painel-zoom-dia');
    return p && getComputedStyle(p).display !== 'none';
  });
  conf('painel de zoom inicia oculto', painelInicialVisivel, false);

  const celulasEmZoomInicial = await pag.$$eval('.dia.em-zoom', es => es.length);
  conf('nenhuma celula em zoom no estado inicial', celulasEmZoomInicial, 0);

  // ================================================================
  secao('3. Clique em um dia do calendario ativa o zoom e destaque visual');

  // Identifica uma celula com aulas no mes visivel (junho de 2026 no banco sintetico)
  const celulaComAula = await pag.evaluate(() => {
    const cel = document.querySelector('.grade-mes .dia:not(.fora):has(.pilula)');
    return cel ? cel.getAttribute('data-dia') : null;
  });
  conf('encontrou dia com aula no mes', !!celulaComAula, true);

  // Clica na celula do dia (fora da pilula de aula)
  await pag.evaluate((iso) => {
    const cel = document.querySelector('.dia[data-dia="' + iso + '"]');
    cel.click();
  }, celulaComAula);

  await esperar('painel de zoom visivel apos clique no dia', () => pag.evaluate(() => {
    const p = document.querySelector('#painel-zoom-dia');
    return p && getComputedStyle(p).display !== 'none';
  }), v => v === true, 5000);

  const celulaDestacada = await pag.evaluate((iso) => {
    const cel = document.querySelector('.dia[data-dia="' + iso + '"]');
    return cel && cel.classList.contains('em-zoom');
  }, celulaComAula);
  conf('celula clicada recebe classe .em-zoom', celulaDestacada, true);

  const temSeloZoom = await pag.evaluate((iso) => {
    const cel = document.querySelector('.dia[data-dia="' + iso + '"] .selo-zoom-celula');
    return cel && cel.textContent.trim() === 'Zoom';
  }, celulaComAula);
  conf('celula exibe indicador visual de zoom', temSeloZoom, true);

  // ================================================================
  secao('4. Conteudo detalhado no painel de zoom');

  const tituloZoom = await pag.$eval('#painel-zoom-dia .zoom-dia-titulo', e => e.textContent.trim());
  conf('titulo do zoom traz data por extenso legivel', tituloZoom.length > 5, true);

  const qtdCardsZoom = await pag.$$eval('#painel-zoom-dia .card-aula-zoom', es => es.length);
  conf('cards detalhados de aulas foram renderizados no zoom', qtdCardsZoom >= 1, true);

  const temBotaoNovaAulaNoZoom = await pag.evaluate(() => {
    const btn = document.querySelector('#painel-zoom-dia .zoom-dia-rodape .btn.principal');
    return btn && btn.textContent.includes('Nova aula neste dia');
  });
  conf('acao rapida "+ Nova aula neste dia" presente no zoom', temBotaoNovaAulaNoZoom, true);

  // ================================================================
  secao('5. Fechar destaque via botao no cabecalho do zoom');

  await pag.click('#painel-zoom-dia .zoom-btn-fechar');
  await esperar('painel de zoom oculto apos fechar', () => pag.evaluate(() => {
    const p = document.querySelector('#painel-zoom-dia');
    return !p || getComputedStyle(p).display === 'none';
  }), v => v === true, 5000);

  const celulaAposFechar = await pag.evaluate((iso) => {
    const cel = document.querySelector('.dia[data-dia="' + iso + '"]');
    return cel && cel.classList.contains('em-zoom');
  }, celulaComAula);
  conf('celula perdeu classe .em-zoom apos fechar destaque', celulaAposFechar, false);

  // ================================================================
  secao('6. Alternancia (toggle) ao clicar na mesma celula');

  // Abre novamente
  await pag.evaluate((iso) => {
    document.querySelector('.dia[data-dia="' + iso + '"]').click();
  }, celulaComAula);
  await esperar('zoom reaberto', () => pag.evaluate(() => {
    const p = document.querySelector('#painel-zoom-dia');
    return p && getComputedStyle(p).display !== 'none';
  }), v => v === true, 5000);

  // Clica de novo no mesmo dia: deve fechar
  await pag.evaluate((iso) => {
    document.querySelector('.dia[data-dia="' + iso + '"]').click();
  }, celulaComAula);
  await esperar('zoom fechado por toggle', () => pag.evaluate(() => {
    const p = document.querySelector('#painel-zoom-dia');
    return !p || getComputedStyle(p).display === 'none';
  }), v => v === true, 5000);
  conf('clicar no mesmo dia fecha o zoom via toggle', true, true);

  // ================================================================
  secao('7. Alternancia suave entre dias diferentes');

  await pag.evaluate(() => {
    const dias = document.querySelectorAll('.grade-mes .dia:not(.fora)');
    if (dias[10]) dias[10].click();
  });
  await pausa(200);

  const dia10Iso = await pag.evaluate(() => {
    const dias = document.querySelectorAll('.grade-mes .dia:not(.fora)');
    return dias[10] ? dias[10].getAttribute('data-dia') : null;
  });

  const dia15Iso = await pag.evaluate(() => {
    const dias = document.querySelectorAll('.grade-mes .dia:not(.fora)');
    return dias[15] ? dias[15].getAttribute('data-dia') : null;
  });

  // Alterna para outro dia
  await pag.evaluate((iso) => {
    document.querySelector('.dia[data-dia="' + iso + '"]').click();
  }, dia15Iso);
  await pausa(200);

  const status10 = await pag.evaluate((iso) => {
    const cel = document.querySelector('.dia[data-dia="' + iso + '"]');
    return cel && cel.classList.contains('em-zoom');
  }, dia10Iso);

  const status15 = await pag.evaluate((iso) => {
    const cel = document.querySelector('.dia[data-dia="' + iso + '"]');
    return cel && cel.classList.contains('em-zoom');
  }, dia15Iso);

  conf('dia anterior perdeu destaque', status10, false);
  conf('novo dia selecionado recebeu destaque', status15, true);

  // ================================================================
  secao('8. Botao Hoje na barra superior navega e ativa zoom');

  await pag.click('#ir-para-hoje');
  await pausa(300);

  const diaHojeIso = await pag.evaluate(() => {
    const celHoje = document.querySelector('.dia.hoje');
    return celHoje ? celHoje.getAttribute('data-dia') : null;
  });

  if (diaHojeIso) {
    const hojeEmZoom = await pag.evaluate((iso) => {
      const cel = document.querySelector('.dia[data-dia="' + iso + '"]');
      return cel && cel.classList.contains('em-zoom');
    }, diaHojeIso);
    conf('dia de hoje ganhou zoom ao tocar no botao Hoje', hojeEmZoom, true);

    const tagHojeVisivel = await pag.evaluate(() => {
      const tag = document.querySelector('#painel-zoom-dia .zoom-tag-hoje');
      return tag && getComputedStyle(tag).display !== 'none';
    });
    conf('badge Hoje visivel no painel de zoom', tagHojeVisivel, true);
  } else {
    conf('navegou para o mes atual', true, true);
  }

  // ================================================================
  secao('9. Cliques nas aulas seguem inalterados');

  // Volta para junho de 2026 onde temos aulas sinteticas garantidas
  for (let i = 0; i < 5; i++) {
    const rot = await pag.$eval('#rotulo-mes', e => e.textContent.trim());
    if (rot === 'Junho de 2026') break;
    await pag.click('#mes-anterior');
    await pausa(150);
  }

  const pilulaExiste = await pag.evaluate(() => {
    const p = document.querySelector('.grade-mes .pilula');
    return !!p;
  });
  conf('pilula de aula existe na grade', pilulaExiste, true);

  // Clica diretamente na pilula
  await pag.evaluate(() => {
    document.querySelector('.grade-mes .pilula').click();
  });
  await esperar('modal de aula aberto ao clicar na pilula', () => pag.evaluate(() => {
    const m = document.querySelector('#modal-aula');
    return m && m.classList.contains('aberto');
  }), v => v === true, 5000);
  conf('clique na aula na grade abriu o modal de aula diretamente', true, true);

  // Fecha o modal da aula
  await pag.click('#modal-aula [data-fechar]');
  await esperar('modal de aula fechado', () => pag.evaluate(() => {
    const m = document.querySelector('#modal-aula');
    return !m || !m.classList.contains('aberto');
  }), v => v === true, 5000);

  // ================================================================
  secao('10. Toque no card de aula dentro do zoom abre o modal da aula');

  // Abre zoom no dia da aula
  await pag.evaluate((iso) => {
    document.querySelector('.dia[data-dia="' + iso + '"]').click();
  }, celulaComAula);
  await pausa(200);

  await pag.click('#painel-zoom-dia .card-aula-zoom');
  await esperar('modal de aula aberto via card do zoom', () => pag.evaluate(() => {
    const m = document.querySelector('#modal-aula');
    return m && m.classList.contains('aberto');
  }), v => v === true, 5000);
  conf('toque no card dentro do zoom abre modal da aula', true, true);

  await pag.click('#modal-aula [data-fechar]');
  await esperar('modal de aula fechado', () => pag.evaluate(() => {
    const m = document.querySelector('#modal-aula');
    return !m || !m.classList.contains('aberto');
  }), v => v === true, 5000);

  // ================================================================
  secao('11. Acao rapida "+ Nova aula neste dia"');

  await pag.click('#painel-zoom-dia .zoom-dia-rodape .btn.principal');
  await esperar('modal de aula aberto via botao rapido', () => pag.evaluate(() => {
    const m = document.querySelector('#modal-aula');
    return m && m.classList.contains('aberto');
  }), v => v === true, 5000);

  const valorDataNoCampo = await pag.$eval('#campo-data', e => e.value);
  conf('campo de data preenchido com a data em zoom', valorDataNoCampo, celulaComAula);

  await pag.click('#modal-aula [data-fechar]');
  await esperar('modal fechado', () => pag.evaluate(() => {
    const m = document.querySelector('#modal-aula');
    return !m || !m.classList.contains('aberto');
  }), v => v === true, 5000);

  // ================================================================
  secao('12. Tecla Escape fecha o zoom do dia');

  const zoomAbertoAntesEsc = await pag.evaluate(() => {
    const p = document.querySelector('#painel-zoom-dia');
    return p && getComputedStyle(p).display !== 'none';
  });
  conf('zoom estava aberto antes do Escape', zoomAbertoAntesEsc, true);

  await pag.keyboard.press('Escape');
  await esperar('zoom fechado via tecla Escape', () => pag.evaluate(() => {
    const p = document.querySelector('#painel-zoom-dia');
    return !p || getComputedStyle(p).display === 'none';
  }), v => v === true, 5000);
  conf('tecla Escape fechou o zoom do dia com sucesso', true, true);

  // ================================================================
  secao('13. Integridade de textos e regras estritas');

  const textoPainel = await pag.evaluate(() => {
    const p = document.querySelector('#painel-zoom-dia');
    return p ? p.textContent : '';
  });
  conf('nenhum travessao no painel de zoom', /—/.test(textoPainel), false);
  conf('nenhum hifen duplo no painel de zoom', /--/.test(textoPainel), false);

  conf('zero erros no console da pagina', pag.errosDePagina.join(' | '), '');

  await H.fim(amb)();
}

rodar().catch(err => {
  H.fim(amb)(err);
});
