/* testa_modal_aula_navegador.js
 *
 * Valida a organização UX-UI do modal da aula (T08):
 * 1. Agendamento simples (UX05): salvar na agenda fecha o modal sem reabertura intrusiva.
 * 2. Agendar e preparar (UX05): botão "Salvar e preparar" salva e entra direto no modo de preparação.
 * 3. Organização nos 3 blocos (Preparar, Registrar como foi, Arquivos da aula).
 * 4. Contexto de aula futura com indicação clara para preenchimento posterior.
 * 5. Destinos explícitos: relato público para família vs nota privada só da professora.
 * 6. Voltar sem salvar: cancelamento descarta edição pendente de notas.
 * 7. Salvar registro: persiste relato público e nota privada com destinos separados.
 * 8. Habilidades e hábitos trabalhados: exemplo curto diferenciando de assunto e salvamento imediato.
 * 9. Ausência de travessões na interface.
 */
'use strict';
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8847, 'nath_t08_modal');
const { conf, secao, esperar, pausa } = H;

async function rodar() {
  await amb.subir();
  const pag = await amb.pagina();
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

  await pag.select('#campo-aluno', 'marcelo');
  await pag.evaluate(() => {
    const data = document.querySelector('#campo-data');
    data.value = '2026-10-15';
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

  await pausa(400);
  const permaneceuFechado = await pag.evaluate(() =>
    !document.querySelector('#modal-aula').classList.contains('aberto'));
  conf('modal permaneceu fechado sem pop-up surpresa', permaneceuFechado, true);

  // Confere se aula foi gravada no banco
  const aulaGravada1 = await pag.evaluate(() => new Promise(resolve => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const db = req.result;
      const get = db.transaction('dados', 'readonly').objectStore('dados').get('principal');
      get.onsuccess = () => {
        db.close();
        const a = (get.result.aulas || []).find(x => x.data === '2026-10-15' && x.hora === '10:00');
        resolve(a || null);
      };
    };
  }));
  conf('aula do dia 15/10/2026 foi criada no banco', !!aulaGravada1, true);

  // ================================================================
  secao('2. Agendar e preparar (UX05): entra direto no modo de preparação');

  await pag.click('#nova-aula');
  await esperar('modal de aula aberto para segundo teste', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  await pag.select('#campo-aluno', 'marcelo');
  await pag.evaluate(() => {
    const data = document.querySelector('#campo-data');
    data.value = '2026-10-22';
    data.dispatchEvent(new Event('change', { bubbles: true }));
    const hora = document.querySelector('#campo-hora');
    hora.value = '14:00';
    hora.dispatchEvent(new Event('change', { bubbles: true }));
  });

  await pag.click('#salvar-preparar-aula');

  // Aguarda transição para o modo de aula existente
  const abriuModoPreparar = await esperar('modal aberto em modo de preparação', () => pag.evaluate(() => {
    const m = document.querySelector('#modal-aula');
    const t = document.querySelector('#titulo-modal-aula');
    return m.classList.contains('aberto') && /22\/10\/2026/.test(t ? t.textContent : '');
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
  secao('3. Organização da aula futura em 3 blocos (T08)');

  // Abre a aula do dia 15/10/2026
  await pag.evaluate(id => {
    abrirAula(id);
  }, aulaGravada1.id);

  await esperar('aula de 15/10 aberta', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  const blocos = await pag.evaluate(() => {
    const corpos = Array.from(document.querySelectorAll('#corpo-modal-aula .bloco-grupo-aula'));
    return corpos.map(b => b.id);
  });
  conf('os 3 blocos existem na ordem correta', blocos.join(' | '),
    'grupo-preparar | grupo-registro | grupo-arquivos');

  // Grupo 1: Preparar
  const folhaAntesDeArquivos = await pag.evaluate(() => {
    const prep = document.querySelector('#grupo-preparar');
    const folha = prep.querySelector('#linha-folha');
    const subtitulo = prep.querySelector('h3.subtitulo');
    const assunto = prep.querySelector('#bloco-assunto');
    return !!(folha && subtitulo && assunto);
  });
  conf('Grupo 1 contém assunto, subtítulo de conteúdo e linha da folha', folhaAntesDeArquivos, true);

  // Grupo 2: Registrar como foi
  const contextoFuturo = await pag.evaluate(() => {
    const reg = document.querySelector('#grupo-registro');
    return reg ? reg.textContent : '';
  });
  conf('Grupo 2 avisa amigavelmente que é aula futura',
    /Aula futura.*preencha.*após/i.test(contextoFuturo), true);

  const destinosSeparados = await pag.evaluate(() => {
    const pub = document.querySelector('.destino-publico');
    const priv = document.querySelector('.destino-privado');
    return {
      publico: pub ? pub.textContent.trim() : '',
      privado: priv ? priv.textContent.trim() : ''
    };
  });
  conf('campo público identifica envio para fechamento/família',
    /fechamento.*família/i.test(destinosSeparados.publico), true);
  conf('campo privado identifica nota privada só da professora',
    /nota privada.*só você/i.test(destinosSeparados.privado), true);

  // Grupo 3: Arquivos da aula
  const temListaAnexos = await pag.evaluate(() => {
    const arq = document.querySelector('#grupo-arquivos');
    return !!(arq && arq.querySelector('#lista-anexos'));
  });
  conf('Grupo 3 contém lista de anexos', temListaAnexos, true);

  // ================================================================
  secao('4. Voltar sem salvar (Aceite de T08): descarta edições pendentes');

  await pag.evaluate(() => {
    document.querySelector('#campo-nota-texto').value = 'Texto pendente para descarte';
    document.querySelector('#campo-nota-privada').value = 'Nota privada para descarte';
  });

  await pag.click('#modal-aula [data-fechar]');
  await esperar('modal fechado após cancelar', () => pag.evaluate(() =>
    !document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  // Reabre e verifica que textos descartados não foram gravados
  await pag.evaluate(id => { abrirAula(id); }, aulaGravada1.id);
  await esperar('aula reaberta', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  const notasAposCancelar = await pag.evaluate(() => ({
    texto: document.querySelector('#campo-nota-texto').value,
    privada: document.querySelector('#campo-nota-privada').value
  }));
  conf('texto do relato não foi gravado ao cancelar', notasAposCancelar.texto, '');
  conf('nota privada não foi gravada ao cancelar', notasAposCancelar.privada, '');

  // ================================================================
  secao('5. Salvar registro pedagógico e nota privada (T08)');

  const RELATO = 'Frações revisadas com sucesso com apoio de material visual.';
  const PRIVADA = 'Atenção aos denominadores diferentes na próxima aula.';

  await pag.evaluate((r, p) => {
    document.querySelector('#campo-nota-texto').value = r;
    document.querySelector('#campo-nota-privada').value = p;
  }, RELATO, PRIVADA);

  await pag.click('#salvar-aula');
  await esperar('modal fechado após salvar', () => pag.evaluate(() =>
    !document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  // Reabre e confirma persistência
  await pag.evaluate(id => { abrirAula(id); }, aulaGravada1.id);
  await esperar('aula reaberta após salvar', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  const notasSalvas = await pag.evaluate(() => ({
    texto: document.querySelector('#campo-nota-texto').value,
    privada: document.querySelector('#campo-nota-privada').value
  }));
  conf('relato para fechamento foi salvo com sucesso', notasSalvas.texto, RELATO);
  conf('nota privada foi salva com sucesso', notasSalvas.privada, PRIVADA);

  // ================================================================
  secao('6. Habilidades e hábitos trabalhados (UX09)');

  const textoRotuloAreas = await pag.$eval('#abrir-areas', e => {
    const barra = e.closest('.barra');
    return barra ? barra.textContent : '';
  });
  conf('rótulo usa "Habilidades e hábitos trabalhados"',
    /Habilidades e hábitos trabalhados/i.test(textoRotuloAreas), true);

  const textoExemploCurto = await pag.evaluate(() => {
    const ex = document.querySelector('#grupo-registro .ajuda-exemplo-curto');
    return ex ? ex.textContent : '';
  });
  conf('exemplo curto esclarece Frações como assunto e raciocínio como habilidade',
    /Frações é o assunto.*habilidade/i.test(textoExemploCurto), true);

  // Abre a caixa de áreas e clica na primeira
  await pag.click('#abrir-areas');
  await pausa(200);

  const antesCheck = await pag.$eval('#conta-areas', e => e.textContent.trim());
  conf('contador inicial é nenhuma', antesCheck, 'nenhuma');

  await pag.evaluate(() => {
    const primeira = document.querySelector('#corpo-modal-aula .item-area input');
    if (primeira) primeira.click();
  });
  await pausa(300);

  const depoisCheck = await pag.$eval('#conta-areas', e => e.textContent.trim());
  conf('contador atualiza após marcar', /1 marcada/i.test(depoisCheck), true);

  // Fecha sem clicar em salvar (áreas salvam na hora)
  await pag.click('#modal-aula [data-fechar]');
  await esperar('modal fechado', () => pag.evaluate(() =>
    !document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  // Reabre e confirma que a área permaneceu marcada
  await pag.evaluate(id => { abrirAula(id); }, aulaGravada1.id);
  await esperar('aula reaberta', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  const mantemMarcada = await pag.$eval('#conta-areas', e => e.textContent.trim());
  conf('área marcada permaneceu salva no tablet automaticamente', /1 marcada/i.test(mantemMarcada), true);

  // ================================================================
  secao('7. Integridade de texto e ausência de travessões');

  const textoTotalModal = await pag.$eval('#corpo-modal-aula', e => e.textContent);
  conf('nenhum travessão (—) no modal da aula', /—/.test(textoTotalModal), false);
  conf('nenhum hífen duplo usado como travessão', /--/.test(textoTotalModal), false);

  conf('não houve erros no console da página', pag.errosDePagina.join(' | '), '');

  await H.fim(amb)();
}

rodar().catch(err => {
  H.fim(amb)(err);
});
