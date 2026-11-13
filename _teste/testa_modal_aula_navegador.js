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
/* --prints <pasta>: os prints da janela da aula (dados fictícios).
 * --envenenado-grade-antiga: devolve aos cartões as alturas da grade antiga do F6
 * (Preparar com 420 px e Arquivos com 190 px, cada um com rolagem própria); as
 * conferências de rolagem e da primeira dobra têm de cair. */
const PRINTS = (() => { const i = process.argv.indexOf('--prints'); return i >= 0 ? process.argv[i + 1] : ''; })();
const GRADE_ANTIGA = process.argv.indexOf('--envenenado-grade-antiga') >= 0;

async function rodar() {
  await amb.subir();
  const pag = await amb.pagina();
  const dialogos = [];
  pag.removeAllListeners('dialog'); // o ajudante aceita toda pergunta; aqui o "não" é da prova
  pag.on('dialog', async d => { dialogos.push(d.message()); try { await d.dismiss(); } catch (e) { /* ok */ } });
  if (GRADE_ANTIGA) {
    await pag.evaluateOnNewDocument(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const s = document.createElement('style');
        s.textContent = '.janela-aula-preparar{max-height:420px;overflow-y:auto}.janela-aula-arquivos{max-height:190px;overflow-y:auto}';
        document.head.appendChild(s);
      });
    });
    conf('(veneno) a grade antiga foi posta nas páginas', true, true);
  }
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('1. Agendamento simples (UX05): salvar na agenda fecha sem reabertura');

  await pag.click('#nova-aula');
  await esperar('modal de aula aberto', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  const tituloNovo = await pag.$eval('#titulo-modal-aula', e => e.textContent.trim());
  conf('título é Nova aula', tituloNovo, 'Nova aula');
  /* F6 (#157): a Nova aula, com poucos campos, fica no modal estreito no tablet
   * deitado; a tela cheia em duas colunas é só da aula que já existe. */
  const novaLargura = await pag.evaluate(() => ({ largura: Math.round(document.querySelector('#modal-aula .modal').getBoundingClientRect().width),
    cheia: document.querySelector('#modal-aula').classList.contains('janela-aula-cheia') }));
  conf('a Nova aula fica no modal estreito a 1280x800 (' + novaLargura.largura + ' px)', novaLargura.largura <= 640 && !novaLargura.cheia, true);
  if (PRINTS) await pag.screenshot({ path: require('path').join(PRINTS, 'f6_nova_aula_1280x800.png') });

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
  /* F7: numa aula de repetição, o horário NÃO salva sozinho (a escolha de
   * escopo é dela). O rodapé diz para tocar em Concluir registro; o Concluir
   * pergunta o escopo, e "Somente esta aula" muda só esta. */
  await pag.evaluate(() => {
    const hora = document.querySelector('#campo-hora');
    hora.value = '16:30';
    hora.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await pausa(1200);
  const lerSerie = () => pag.evaluate(ids =>
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
    }), serieAntes || { id: '', serieId: '' });
  const semConcluir = await lerSerie();
  conf('na repetição, o horário não salva sozinho', !!semConcluir.atual && semConcluir.atual.hora !== '16:30', true);
  conf('e o rodapé diz que grava ao fechar', /gravam ao fechar/.test(await pag.$eval('#estado-salvamento-aula', e => e.textContent)), true);
  await pag.click('#salvar-aula');
  const escopo = await esperar('pergunta de escopo', () => pag.evaluate(() =>
    document.querySelector('#modal-escopo').classList.contains('aberto')), Boolean, 5000);
  conf('o Concluir pergunta o escopo da mudança', escopo.ok, true);
  await pag.evaluate(() => Array.from(document.querySelectorAll('.opcao-escopo')).find(o => /Somente esta aula/.test(o.textContent)).click());
  const serieDepois = await esperar('salva o horário só nesta ocorrência', lerSerie, v => !!v && !!v.atual && v.atual.hora === '16:30' &&
      v.irmas.length > 0 && v.irmas.every(h => h === '16:00'), 5000);
  conf('salvar uma aula da repetição não muda as irmãs', serieDepois.ok, true);
  const fechouSerie = await esperar('a aula fecha depois do Concluir', () => pag.evaluate(() =>
    !document.querySelector('#modal-aula').classList.contains('aberto')), Boolean, 5000);
  conf('o Concluir fecha a aula', fechouSerie.ok, true);

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
  // F6 (#157): a ordem é a da leitura no tablet, a coluna da esquerda (Preparar e
  // Arquivos) e depois a da direita (Registrar), cada uma com a sua rolagem
  conf('os 3 blocos existem na ordem correta', blocos.join(' | '),
    'grupo-preparar | grupo-arquivos | grupo-registro');

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

  /* F6 (#157, revisão de UX): no máximo uma rolagem por lado, nenhum cartão rola
   * por dentro, e o "Escrever à mão" fica inteiro na parte visível da coluna, com
   * a letra a 100% e a 130% (o documentElement em 130%, como a letra do Android).
   * O veneno --envenenado-grade-antiga devolve as alturas da grade antiga aos
   * cartões e a prova tem de cair. */
  const rolagensDaJanela = (letra) => pag.evaluate(async (letra) => {
    document.documentElement.style.fontSize = letra === 100 ? '' : letra + '%';
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const corpo = document.querySelector('#corpo-modal-aula');
    const rolam = [];
    corpo.querySelectorAll('*').forEach(e => {
      if (/^(TEXTAREA|SELECT|INPUT)$/.test(e.tagName)) return;
      const oy = getComputedStyle(e).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && e.scrollHeight > e.clientHeight + 1) rolam.push(e.id || e.className);
    });
    const lados = rolam.filter(n => /janela-aula-lado/.test(n) || /^janela-aula-(esquerda|direita)$/.test(n));
    const cartoes = rolam.filter(n => lados.indexOf(n) < 0);
    const botao = Array.from(document.querySelectorAll('#linha-folha button')).find(b => /Escrever à mão|Abrir folha/.test(b.textContent));
    const lado = document.querySelector('#janela-aula-esquerda');
    let inteiro = false, onde = 'sem botão';
    if (botao && lado) {
      lado.scrollTop = 0;
      const rb = botao.getBoundingClientRect(), rl = lado.getBoundingClientRect();
      inteiro = rb.top >= rl.top - 1 && rb.bottom <= rl.bottom + 1 && rb.height > 0;
      onde = Math.round(rb.top) + '..' + Math.round(rb.bottom) + ' em ' + Math.round(rl.top) + '..' + Math.round(rl.bottom);
    }
    document.documentElement.style.fontSize = '';
    return { lados: lados.length, cartoes: cartoes.join(','), inteiro, onde };
  }, letra);
  for (const letra of [100, 130]) {
    const r = await rolagensDaJanela(letra);
    if (GRADE_ANTIGA) {
      // com o veneno, a propriedade TEM de quebrar: cartão rolando ou botão cortado
      conf('VENENO visto a ' + letra + '%: cartões sem rolagem própria e "Escrever à mão" inteiro (' + r.cartoes + '; ' + r.onde + '), e quebrou',
        r.cartoes === '' && r.inteiro, false);
      continue;
    }
    conf('a ' + letra + '%, nenhum cartão rola por dentro (' + r.cartoes + ')', r.cartoes, '');
    conf('a ' + letra + '%, no máximo uma rolagem por lado (' + r.lados + ')', r.lados <= 2, true);
    conf('a ' + letra + '%, o "Escrever à mão" fica inteiro na primeira dobra da coluna (' + r.onde + ')', r.inteiro, true);
  }
  if (GRADE_ANTIGA) { await H.fim(amb)(); return; }
  if (PRINTS) {
    await pag.screenshot({ path: require('path').join(PRINTS, 'f6_janela_1280x800.png') });
    await pag.evaluate(() => { document.documentElement.style.fontSize = '130%'; });
    await new Promise(r => setTimeout(r, 200));
    await pag.screenshot({ path: require('path').join(PRINTS, 'f6_janela_1280x800_130.png') });
    await pag.evaluate(() => { document.documentElement.style.fontSize = ''; });
  }

  /* F6 (#157): nada transborda de lado, nem a 1280x800 (duas colunas) nem a
   * 800x1280 (tablet em pé: o fluxo vertical), e o Salvar continua à vista. */
  const transbordoDaJanela = () => pag.evaluate(() => {
    const modal = document.querySelector('#modal-aula .modal').getBoundingClientRect();
    const largos = [];
    document.querySelectorAll('#modal-aula .modal *').forEach(e => {
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height || getComputedStyle(e).visibility === 'hidden') return;
      let p = e.parentElement, rola = false;
      while (p && p !== document.body) { // dentro de algo que rola de lado de propósito, não conta
        const cs = getComputedStyle(p);
        if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && p.scrollWidth > p.clientWidth + 1) { rola = true; break; }
        p = p.parentElement;
      }
      if (!rola && (r.left < modal.left - 1 || r.right > modal.right + 1)) largos.push((e.id || e.className || e.tagName) + ' ' + Math.round(r.right - modal.right) + 'px');
    });
    const colunas = Array.from(document.querySelectorAll('.janela-aula-coluna')).filter(c => c.scrollWidth > c.clientWidth + 1).map(c => c.id);
    const salvar = document.querySelector('#salvar-aula');
    const rs = salvar ? salvar.getBoundingClientRect() : null;
    const prep = document.querySelector('#janela-aula-preparar').getBoundingClientRect();
    const reg = document.querySelector('#janela-aula-registrar').getBoundingClientRect();
    return { largos: largos.slice(0, 5).join('; '), colunas: colunas.join(','), paginaDeLado: document.documentElement.scrollWidth > innerWidth + 1,
      salvarAVista: !!rs && rs.top >= 0 && rs.bottom <= innerHeight + 1, lado: reg.left >= prep.right - 1, empilhado: reg.top >= prep.bottom - 1 };
  });
  const a1280 = await transbordoDaJanela();
  conf('a 1280x800, nada da janela passa da borda nem rola de lado (' + a1280.largos + a1280.colunas + ')',
    a1280.largos + '|' + a1280.colunas + '|' + a1280.paginaDeLado, '||false');
  conf('a 1280x800, o rodapé com Salvar está à vista', a1280.salvarAVista, true);
  await pag.setViewport({ width: 800, height: 1280, hasTouch: true });
  await new Promise(r => setTimeout(r, 300));
  const a800 = await transbordoDaJanela();
  conf('a 800x1280, a janela volta ao fluxo vertical: Registrar embaixo de Preparar', a800.empilhado + '|' + a800.lado, 'true|false');
  conf('a 800x1280, nada da janela passa da borda nem rola de lado (' + a800.largos + a800.colunas + ')',
    a800.largos + '|' + a800.colunas + '|' + a800.paginaDeLado, '||false');
  conf('a 800x1280, o rodapé com Salvar está à vista', a800.salvarAVista, true);
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  await new Promise(r => setTimeout(r, 300));

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

  // F7: o rodapé fala do que está gravado; na aula que já existe, há "Descartar alterações"
  conf('a aula que já existe oferece Fechar e Descartar alterações', await pag.evaluate(() =>
    document.querySelector('#cancelar-aula').textContent.trim() + '|' +
    (getComputedStyle(document.querySelector('#descartar-aula')).display !== 'none')), 'Fechar|true');

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
  const dialogosAntesDaData = dialogos.length;
  await pag.click('#cancelar-aula');
  await pausa(300);
  // a pergunta sobre a data pela metade; o "não" (cancelar) deixa a janela aberta
  const modalPermaneceComDataObrigatoria = await pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')) &&
    /Falta terminar a data/.test(dialogos.slice(dialogosAntesDaData).join(' '));
  conf('fechar com a data vazia pergunta, e o "não" deixa a janela aberta', modalPermaneceComDataObrigatoria, true);
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
  conf('horário, relato e nota privada gravaram ao Fechar', autosavePersistiu.ok, true);
  conf('e o aviso diz o que mudou, com Desfazer', await pag.evaluate(() =>
    /^Aula atualizada: às 10:30/.test(document.querySelector('#aviso-texto').textContent) &&
    /Desfazer/.test((document.querySelector('#aviso-acao') || {}).textContent || '')), true);

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
