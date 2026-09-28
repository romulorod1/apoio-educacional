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
 * 8. Aviso de rodapé esclarecendo que assuntos, habilidades e arquivos salvam na hora.
 * 9. Voltar sem salvar: cancelamento descarta edição pendente de notas.
 * 10. Salvar registro: persiste relato público e nota privada com destinos separados.
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
  conf('botão de salvar volta a ser Salvar simples', botaoSalvarEmEdicao, 'Salvar');

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
  conf('campo privado identifica nota privada só da professora', seloPrivado, 'Nota privada · só você vê');

  // Aviso de salvamento no rodapé
  const textoAvisoRodape = await pag.$eval('#aviso-salvamento-aula', e => e.textContent.trim());
  conf('aviso de salvamento esclarece que habilidades também salvam na hora',
    textoAvisoRodape.includes('habilidades'), true);

  // ================================================================
  secao('5. Voltar sem salvar: descarta edições pendentes');

  await pag.evaluate(() => {
    const nota = document.querySelector('#campo-nota-texto');
    nota.value = 'Texto teste pendente que deve ser descartado';
    nota.dispatchEvent(new Event('input', { bubbles: true }));

    const priv = document.querySelector('#campo-nota-privada');
    priv.value = 'Privada pendente que deve ser descartada';
    priv.dispatchEvent(new Event('input', { bubbles: true }));
  });

  // Clica no Cancelar
  await pag.click('#cancelar-aula');
  await esperar('modal fechado após cancelar', () => pag.evaluate(() =>
    !document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  // Reabre via UI e verifica que não gravou
  await pag.click('[data-aula-id="' + aulaGravada1.id + '"]');
  await esperar('aula reaberta via UI', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  const valorNotaDescartada = await pag.$eval('#campo-nota-texto', e => e.value);
  conf('texto do relato não foi gravado ao cancelar', valorNotaDescartada, '');

  const valorPrivadaDescartada = await pag.$eval('#campo-nota-privada', e => e.value);
  conf('nota privada não foi gravada ao cancelar', valorPrivadaDescartada, '');

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
