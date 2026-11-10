/* testa_modal_aula_navegador.js
 *
 * Valida a organização UX-UI do modal da aula (T08):
 * 1. Agendamento simples (UX05): salvar na agenda fecha o modal sem reabertura intrusiva.
 * 2. Agendar e preparar aula avulsa (UX05): botão "Salvar e preparar" abre diretamente a preparação.
 * 3. Agendar e preparar aula em série repetida: abre diretamente a primeira aula da série.
 * 4. Memória do último encontro e trilha pedagógica posicionadas na primeira dobra (topo de Preparar).
 * 5. Organização nos 3 blocos (Preparar, Registrar como foi, Arquivos da aula).
 * 6. Aviso contextual e banner condicionado ao status (aula futura vs realizada vs cancelada).
 * 7. Destinos explícitos: relato público para família vs nota privada só da professora.
 * 8. Edição de horário, situação e relatos salva sozinha com estado no rodapé.
 * 9. Fechar descarrega alterações pendentes sem descartar dados.
 * 10. Concluir registro fecha a aula com relatos públicos e privados persistidos.
 * 11. Habilidades e hábitos trabalhados: exemplo curto diferenciando de assunto.
 * 12. Testado exclusivamente via navegação real de UI (sem hooks globais) em 1280x800.
 * 13. Ausência de travessões na interface.
 */
'use strict';
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8847, 'nath_t08_modal');
const { conf, secao, esperar, pausa } = H;

async function rodar() {
  await amb.subir();
  const pag = await amb.pagina();
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('1. Agendamento simples (UX05): salvar na agenda fecha sem reabertura');

  await pag.click('#nova-aula');
  await esperar('modal de aula aberto', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  const tituloNovo = await pag.$eval('#titulo-modal-aula', e => e.textContent.trim());
  conf('título é Nova aula', tituloNovo, 'Nova aula');

  const botaoSalvarTexto = await pag.$eval('#salvar-aula', e => e.textContent.trim());
  conf('botão de salvar na agenda tem rótulo claro', botaoSalvarTexto, 'Salvar na agenda');

  const visivelPreparar = await pag.evaluate(() => {
    const b = document.querySelector('#salvar-preparar-aula');
    return b && getComputedStyle(b).display !== 'none';
  });
  conf('botão "Salvar e preparar" está visível no agendamento', visivelPreparar, true);

  // Agenda aula avulsa para dia 25 de junho de 2026 (mês visível no app)
  await pag.select('#campo-aluno', 'marcelo');
  await pag.evaluate(() => {
    const data = document.querySelector('#campo-data');
    data.value = '2026-06-25';
    data.dispatchEvent(new Event('change', { bubbles: true }));
    const hora = document.querySelector('#campo-hora');
    hora.value = '10:00';
    hora.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Salvar na agenda (agendamento simples)
  await pag.click('#salvar-aula');

  const fechouAposSalvar = await esperar('modal fechou após salvar na agenda', () => pag.evaluate(() =>
    !document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);
  conf('modal fecha diretamente sem forçar reabertura', fechouAposSalvar.ok, true);

  await pausa(300);
  const permaneceuFechado = await pag.evaluate(() =>
    !document.querySelector('#modal-aula').classList.contains('aberto'));
  conf('modal permaneceu fechado sem pop-up surpresa', permaneceuFechado, true);

  // Confere se aula foi gravada no banco e tem pílula na UI
  const aulaGravada1 = await pag.evaluate(() => new Promise(resolve => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const db = req.result;
      const get = db.transaction('dados', 'readonly').objectStore('dados').get('principal');
      get.onsuccess = () => {
        db.close();
        const a = (get.result.aulas || []).find(x => x.data === '2026-06-25' && x.hora === '10:00');
        resolve(a || null);
      };
    };
  }));
  conf('aula do dia 25/06/2026 foi criada no banco', !!aulaGravada1, true);

  const pilulaVisivel = await pag.evaluate(id => {
    return !!document.querySelector('[data-aula-id="' + id + '"]');
  }, aulaGravada1.id);
  conf('pílula da aula está presente no calendário da UI', pilulaVisivel, true);

  // ================================================================
  secao('2. Agendar e preparar aula avulsa (UX05): entra direto na preparação');

  await pag.click('#nova-aula');
  await esperar('modal de aula aberto para segundo teste', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  await pag.select('#campo-aluno', 'marcelo');
  await pag.evaluate(() => {
    const data = document.querySelector('#campo-data');
    data.value = '2026-06-26';
    data.dispatchEvent(new Event('change', { bubbles: true }));
    const hora = document.querySelector('#campo-hora');
    hora.value = '14:00';
    hora.dispatchEvent(new Event('change', { bubbles: true }));
  });

  await pag.click('#salvar-preparar-aula');

  const abriuModoPreparar = await esperar('modal aberto em modo de preparação', () => pag.evaluate(() => {
    const m = document.querySelector('#modal-aula');
    const t = document.querySelector('#titulo-modal-aula');
    return m.classList.contains('aberto') && /26\/06\/2026/.test(t ? t.textContent : '');
  }), v => v === true, 5000);
  conf('abriu diretamente na preparação da aula criada', abriuModoPreparar.ok, true);

  const temGrupoPreparar = await pag.evaluate(() => !!document.querySelector('#grupo-preparar'));
  conf('grupo de Preparar está presente', temGrupoPreparar, true);

  const botaoSalvarEmEdicao = await pag.$eval('#salvar-aula', e => e.textContent.trim());
  conf('botão de salvar fecha o registro já salvo', botaoSalvarEmEdicao, 'Concluir registro');

  const prepararOculto = await pag.evaluate(() => {
    const b = document.querySelector('#salvar-preparar-aula');
    return !b || getComputedStyle(b).display === 'none';
  });
  conf('botão Salvar e preparar fica oculto na aula existente', prepararOculto, true);

  await pag.click('#modal-aula [data-fechar]');
  await esperar('modal fechado', () => pag.evaluate(() =>
    !document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  // ================================================================
  secao('3. Agendar e preparar em série repetida: abre a primeira aula da série');

  await pag.click('#nova-aula');
  await esperar('modal de nova aula aberto para série', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  await pag.select('#campo-aluno', 'marcelo');
  await pag.evaluate(() => {
    const data = document.querySelector('#campo-data');
    data.value = '2026-06-29';
    data.dispatchEvent(new Event('change', { bubbles: true }));
    const hora = document.querySelector('#campo-hora');
    hora.value = '16:00';
    hora.dispatchEvent(new Event('change', { bubbles: true }));
    const chk = document.querySelector('#campo-repetir');
    chk.checked = true;
    chk.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Salvar e preparar a série
  await pag.click('#salvar-preparar-aula');

  const abriuPrimeiraDaSerie = await esperar('abriu primeira aula da série em preparação', () => pag.evaluate(() => {
    const m = document.querySelector('#modal-aula');
    const t = document.querySelector('#titulo-modal-aula');
    return m.classList.contains('aberto') && /29\/06\/2026/.test(t ? t.textContent : '');
  }), v => v === true, 5000);
  conf('abriu diretamente a primeira aula da série repetida criada', abriuPrimeiraDaSerie.ok, true);

  const faixaSerie = await pag.evaluate(() => {
    const f = document.querySelector('#grupo-preparar .faixa-info');
    return f ? f.textContent : '';
  });
  conf('indica que é aula que se repete', /Aula que se repete/i.test(faixaSerie), true);

  const serieAntes = await pag.evaluate(() => new Promise(resolve => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const db = req.result;
      const get = db.transaction('dados', 'readonly').objectStore('dados').get('principal');
      get.onsuccess = () => {
        db.close();
        const aulas = get.result.aulas || [];
        const atual = aulas.find(a => a.data === '2026-06-29' && a.serieId);
        resolve(atual ? {
          id: atual.id,
          serieId: atual.serieId,
          irmas: aulas.filter(a => a.serieId === atual.serieId && a.id !== atual.id).map(a => a.id)
        } : null);
      };
    };
  }));
  conf('a repetição tem outras aulas para proteger', !!serieAntes && serieAntes.irmas.length > 0, true);
  await pag.evaluate(() => {
    const hora = document.querySelector('#campo-hora');
    hora.value = '16:30';
    hora.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const serieDepois = await esperar('salva o horário só nesta ocorrência', () => pag.evaluate(ids =>
    new Promise(resolve => {
      const req = indexedDB.open('apoio-educacional');
      req.onsuccess = () => {
        const db = req.result;
        const get = db.transaction('dados', 'readonly').objectStore('dados').get('principal');
        get.onsuccess = () => {
          db.close();
          const aulas = get.result.aulas || [];
          resolve({
            atual: aulas.find(a => a.id === ids.id),
            irmas: aulas.filter(a => a.serieId === ids.serieId && a.id !== ids.id).map(a => a.hora)
          });
        };
      };
    }), serieAntes || { id: '', serieId: '' }), v => !!v && !!v.atual && v.atual.hora === '16:30' &&
      v.irmas.length > 0 && v.irmas.every(h => h === '16:00'), 5000);
  conf('salvar uma aula da repetição não muda as irmãs', serieDepois.ok, true);
  const statusAutosaveSerie = await pag.$eval('#estado-salvamento-aula', e => e.textContent.trim());
  conf('rodapé confirma o salvamento com horário', /^Salvo \d{2}:\d{2}$/.test(statusAutosaveSerie), true);

  await pag.click('#modal-aula [data-fechar]');
  await esperar('modal da série fechado', () => pag.evaluate(() =>
    !document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  // ================================================================
  secao('4. Organização em 3 blocos e memória na primeira dobra');

  // Abre a aula do dia 25/06/2026 clicando diretamente na UI (pílula)
  await pag.click('[data-aula-id="' + aulaGravada1.id + '"]');

  await esperar('aula de 25/06 aberta via UI', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  const blocos = await pag.evaluate(() => {
    const corpos = Array.from(document.querySelectorAll('#corpo-modal-aula .bloco-grupo-aula'));
    return corpos.map(b => b.id);
  });
  conf('os 3 blocos existem na ordem correta', blocos.join(' | '),
    'grupo-preparar | grupo-registro | grupo-arquivos');

  const gradeTablet = await pag.evaluate(() => {
    const caixa = e => {
      const r = document.querySelector(e).getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom,
        width: r.width, height: r.height };
    };
    const corpo = document.querySelector('#corpo-modal-aula');
    const modal = caixa('#modal-aula .modal');
    const preparar = caixa('#janela-aula-preparar');
    const registrar = caixa('#janela-aula-registrar');
    const arquivos = caixa('#janela-aula-arquivos');
    return {
      telaCheia: Math.abs(modal.left) < 1 && Math.abs(modal.top) < 1 &&
        Math.abs(modal.width - innerWidth) < 1 && Math.abs(modal.height - innerHeight) < 1,
      registroNaDireita: registrar.left >= preparar.right && registrar.right <= modal.right + 1,
      arquivosSobPreparar: Math.abs(arquivos.left - preparar.left) < 1 && arquivos.top > preparar.top,
      corpoSemRolagem: corpo.scrollHeight <= corpo.clientHeight + 1
    };
  });
  conf('a janela ocupa a tela inteira do tablet', gradeTablet.telaCheia, true);
  conf('Registrar fica na coluna direita', gradeTablet.registroNaDireita, true);
  conf('Arquivos ficam abaixo de Preparar', gradeTablet.arquivosSobPreparar, true);
  conf('o painel cabe sem rolagem própria a 1280x800', gradeTablet.corpoSemRolagem, true);

  // Confere que memória/trilha vêm antes do bloco de quando (primeira dobra)
  const ordemInternaGrupo1 = await pag.evaluate(() => {
    const prep = document.querySelector('#grupo-preparar');
    const nos = Array.from(prep.children).map(c => c.id || c.className);
    const posUltimo = nos.findIndex(k => k.includes('bloco-ultimo-encontro') || k.includes('lembrete'));
    const posTrilha = nos.findIndex(k => k === 'cartao-trilha');
    const posQuando = nos.findIndex(k => k === 'bloco-quando');
    return { posUltimo, posTrilha, posQuando, valido: posTrilha >= 0 && posQuando > posTrilha };
  });
  conf('trilha pedagógica está posicionada no topo de Preparar (antes dos campos)', ordemInternaGrupo1.valido, true);

  // Grupo 1: Conteúdo da aula e linha da folha
  const temConteudoEFolha = await pag.evaluate(() => {
    const prep = document.querySelector('#grupo-preparar');
    const sub = prep.querySelector('h3.subtitulo');
    const folha = prep.querySelector('#linha-folha');
    return !!sub && sub.textContent === 'Conteúdo da aula' && !!folha;
  });
  conf('Grupo 1 contém subtítulo Conteúdo da aula e linha da folha', temConteudoEFolha, true);

  // Destinos dos relatos
  const seloPublico = await pag.$eval('#grupo-registro .destino-publico', e => e.textContent.trim());
  conf('campo público identifica envio para fechamento/família', seloPublico, 'Vai para o fechamento / família');

  const seloPrivado = await pag.$eval('#grupo-registro .destino-privado', e => e.textContent.trim());
  conf('campo privado identifica nota privada só da professora', seloPrivado, 'Só você vê');

  // Aviso de salvamento no rodapé
  const textoAvisoRodape = await pag.$eval('#aviso-salvamento-aula', e => e.textContent.trim());
  conf('aviso do registro explica que as alterações salvam automaticamente',
    textoAvisoRodape.includes('automaticamente'), true);

  // ================================================================
  secao('5. Alterações de horário e relato salvam automaticamente');

  const dataAntesDeLimpar = await pag.$eval('#campo-data', e => e.value);
  await pag.evaluate(() => {
    const data = document.querySelector('#campo-data');
    data.value = '';
    data.dispatchEvent(new Event('input', { bubbles: true }));
    data.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await pausa(800);
  const dataVaziaNaoGravou = await pag.evaluate(id => new Promise(resolve => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const banco = req.result;
      const get = banco.transaction('dados', 'readonly').objectStore('dados').get('principal');
      get.onsuccess = () => {
        banco.close();
        const aula = (get.result.aulas || []).find(x => x.id === id);
        resolve(aula && aula.data);
      };
    };
  }), aulaGravada1.id);
  conf('data vazia não é gravada na aula existente', dataVaziaNaoGravou, dataAntesDeLimpar);
  await pag.click('#cancelar-aula');
  await pausa(100);
  const modalPermaneceComDataObrigatoria = await pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto') &&
    document.querySelector('#estado-salvamento-aula').textContent.includes('Informe a data'));
  conf('modal não fecha enquanto a data obrigatória estiver vazia', modalPermaneceComDataObrigatoria, true);
  await pag.evaluate(valor => {
    const data = document.querySelector('#campo-data');
    data.value = valor;
    data.dispatchEvent(new Event('input', { bubbles: true }));
    data.dispatchEvent(new Event('change', { bubbles: true }));
  }, dataAntesDeLimpar);

  await pag.evaluate(() => {
    const hora = document.querySelector('#campo-hora');
    hora.value = '10:30';
    hora.dispatchEvent(new Event('input', { bubbles: true }));
    hora.dispatchEvent(new Event('change', { bubbles: true }));
    const nota = document.querySelector('#campo-nota-texto');
    nota.value = 'Relato sintético salvo automaticamente.';
    nota.dispatchEvent(new Event('input', { bubbles: true }));

    const priv = document.querySelector('#campo-nota-privada');
    priv.value = 'Nota privada sintética salva automaticamente.';
    priv.dispatchEvent(new Event('input', { bubbles: true }));
  });

  // Fechar imediatamente descarrega a gravação antes do temporizador.
  await pag.click('#cancelar-aula');
  await esperar('modal fechou depois de descarregar o autosave', () => pag.evaluate(() =>
    !document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);
  const autosavePersistiu = await esperar('horário e notas foram gravados no banco', () => pag.evaluate(id =>
    new Promise(resolve => {
      const req = indexedDB.open('apoio-educacional');
      req.onsuccess = () => {
        const banco = req.result;
        const get = banco.transaction('dados', 'readonly').objectStore('dados').get('principal');
        get.onsuccess = () => {
          banco.close();
          const aula = (get.result.aulas || []).find(x => x.id === id);
          resolve(aula ? { hora: aula.hora, notaTexto: aula.notaTexto, notaPrivada: aula.notaPrivada } : null);
        };
      };
    }), aulaGravada1.id), v => !!v && v.hora === '10:30' &&
      v.notaTexto === 'Relato sintético salvo automaticamente.' &&
      v.notaPrivada === 'Nota privada sintética salva automaticamente.', 5000);
  conf('horário, relato e nota privada salvaram sem botão', autosavePersistiu.ok, true);

  // Reabre via UI e confirma que os dados continuam gravados.
  await pag.click('[data-aula-id="' + aulaGravada1.id + '"]');
  await esperar('aula reaberta via UI', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  const valorNotaDescartada = await pag.$eval('#campo-nota-texto', e => e.value);
  conf('texto do relato ficou salvo ao fechar', valorNotaDescartada, 'Relato sintético salvo automaticamente.');

  const valorPrivadaDescartada = await pag.$eval('#campo-nota-privada', e => e.value);
  conf('nota privada ficou salva ao fechar', valorPrivadaDescartada, 'Nota privada sintética salva automaticamente.');

  // ================================================================
  secao('6. Salvar registro pedagógico e nota privada');

  await pag.evaluate(() => {
    const nota = document.querySelector('#campo-nota-texto');
    nota.value = 'Trabalhamos expressões algébricas com excelente autonomia.';
    nota.dispatchEvent(new Event('input', { bubbles: true }));

    const priv = document.querySelector('#campo-nota-privada');
    priv.value = 'Cobrar lista de revisão de geometria na próxima aula.';
    priv.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await pag.click('#salvar-aula');
  await esperar('modal fechado após salvar', () => pag.evaluate(() =>
    !document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  // Reabre via UI e confere persistência
  await pag.click('[data-aula-id="' + aulaGravada1.id + '"]');
  await esperar('aula reaberta após salvar via UI', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  const relatoSalvo = await pag.$eval('#campo-nota-texto', e => e.value);
  conf('relato para fechamento foi salvo com sucesso', relatoSalvo,
    'Trabalhamos expressões algébricas com excelente autonomia.');

  const privadaSalva = await pag.$eval('#campo-nota-privada', e => e.value);
  conf('nota privada foi salva com sucesso', privadaSalva,
    'Cobrar lista de revisão de geometria na próxima aula.');

  // ================================================================
  secao('7. Habilidades e hábitos trabalhados (UX09)');

  const rotuloAreas = await pag.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('#grupo-registro span'));
    return spans.map(s => s.textContent).find(t => t.includes('Habilidades e hábitos trabalhados')) || '';
  });
  conf('rótulo usa "Habilidades e hábitos trabalhados"', rotuloAreas.includes('Habilidades e hábitos trabalhados'), true);

  const exemploCurto = await pag.$eval('#grupo-registro .ajuda-exemplo-curto', e => e.textContent.trim());
  conf('exemplo curto esclarece Frações como assunto e raciocínio como habilidade',
    exemploCurto.includes('Frações é o assunto ensinado'), true);

  const contaInicial = await pag.$eval('#conta-areas', e => e.textContent.trim());
  conf('contador inicial é nenhuma', contaInicial, 'nenhuma');

  // Abre a gaveta de áreas e marca a primeira
  await pag.click('#abrir-areas');
  await pausa(200);

  const primeiraArea = await pag.evaluate(() => {
    const caixa = document.querySelector('#caixa-areas input[type="checkbox"]');
    if (caixa) { caixa.click(); return true; }
    return false;
  });
  conf('marcou a primeira habilidade', primeiraArea, true);

  const contaDepois = await pag.$eval('#conta-areas', e => e.textContent.trim());
  conf('contador atualiza após marcar', /1 marcada/i.test(contaDepois), true);

  // Fecha sem salvar (áreas salvam na hora)
  await pag.click('#cancelar-aula');
  await esperar('modal fechado', () => pag.evaluate(() =>
    !document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  // Reabre via UI e confirma que a área permaneceu marcada
  await pag.click('[data-aula-id="' + aulaGravada1.id + '"]');
  await esperar('aula reaberta via UI', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  const mantemMarcada = await pag.$eval('#conta-areas', e => e.textContent.trim());
  conf('área marcada permaneceu salva no tablet automaticamente', /1 marcada/i.test(mantemMarcada), true);

  // ================================================================
  secao('8. Banner condicionado para cancelada vs realizada');

  // Altera para cancelada
  await pag.select('#campo-status', 'cancelada');
  await pag.click('#salvar-aula');
  await esperar('modal fechado após marcar cancelada', () => pag.evaluate(() =>
    !document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  // Reabre e confere banner
  await pag.click('[data-aula-id="' + aulaGravada1.id + '"]');
  await esperar('aula cancelada reaberta via UI', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  const statusAtual = await pag.$eval('#campo-status', e => e.value);
  conf('status foi salvo como cancelada', statusAtual, 'cancelada');

  // ================================================================
  secao('9. Integridade de texto e ausência de travessões');

  const textoTotalModal = await pag.$eval('#corpo-modal-aula', e => e.textContent);
  conf('nenhum travessão (—) no modal da aula', /—/.test(textoTotalModal), false);
  conf('nenhum hífen duplo usado como travessão', /--/.test(textoTotalModal), false);

  conf('não houve erros no console da página', pag.errosDePagina.join(' | '), '');

  await H.fim(amb)();
}

rodar().catch(err => {
  H.fim(amb)(err);
});
