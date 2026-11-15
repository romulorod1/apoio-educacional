/* testa_trilha_do_zero_voltar.js
 *
 * F5 (refeito sobre a main, substitui o #158): o seletor de temas aberto
 * PELA TRILHA, na ficha do aluno, e o seletor de assunto da aula, com o
 * tablet deitado (1280x1000), contra o Voltar do aparelho da main (#179 e
 * #199: a guarda da raiz e a entrada velha depois de recarregar).
 *
 * 1. Ele não leva as classes do seletor de assunto da aula (nem o painel
 *    lateral, nem o corpo em coluna) e a lista rola com o dedo: algum
 *    ancestral da lista, dentro da janela, com overflow-y auto ou scroll e
 *    conteúdo maior que a caixa.
 * 2. Ficha, "Trilha do zero", escolher o tema, e a trilha nova abre. O Voltar
 *    do aparelho fecha a trilha, a ficha continua aberta E com a entrada dela
 *    no histórico. Com o modal-tema no histórico, fechar o seletor faz um
 *    history.back() que só termina depois: se a trilha abrisse antes de ele
 *    acabar, o Voltar atrasado comeria a entrada da trilha.
 * 3. A aula aberta e, por cima, o painel de assunto (à direita, a aula
 *    atrás): o 1º Voltar fecha só o painel, o 2º fecha a aula, e o 3º, na
 *    tela inicial, avisa "Toque em Voltar de novo para sair." sem sair.
 * 4. Recarregar com o painel aberto (o Android descarta a aba): o app abre
 *    sem janela, o histórico não diz que há janela, e o 1º Voltar ainda é o
 *    aviso da raiz, sem sair do app.
 *
 * Veneno --envenenado-trilha-antes-do-voltar: serve o app.js com a trilha
 * aberta logo depois do fecharModal, sem esperar o Voltar (como na 803b2e6).
 * A conferência 2 tem de cair (as seções 3 e 4 não rodam no veneno).
 * Dados fictícios.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador');
const RELOGIO = H.relogioDaRodada('2026-11-16', '11:00');
const { conf, secao, esperar, pausa } = H;

const VENENO = process.argv.indexOf('--envenenado-trilha-antes-do-voltar') >= 0;
const ESPERA = "          fecharModal('modal-tema', function () { aoEscolher(t); });";
const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
conf('(arranjo) a trilha espera o Voltar do seletor, num lugar só', APP.split(ESPERA).length, 2);
const trocas = {};
if (VENENO) {
  trocas['/app.js'] = APP.replace(ESPERA, "          fecharModal('modal-tema'); aoEscolher(t);");
  conf('(veneno) o app.js servido abre a trilha sem esperar o Voltar', trocas['/app.js'] !== APP, true);
}
const amb = H.criarAmbiente(8885, 'nath_f5_trilha_zero', trocas);

(async () => {
  await amb.subir();
  const pag = await amb.pagina();
  pag.on('dialog', async d => { try { await d.accept(); } catch (e) { /* ok */ } });
  await RELOGIO.naPagina(pag);
  await H.abrirApp(pag, amb.ORIGEM);
  await pag.evaluate(async () => {
    const dados = await Store.carregar();
    dados.alunos = [{ id: 'f5_delta', nome: 'Aluno Delta Teste', ativo: true, anoEscolar: '07', precos: [], trilhas: [] }];
    const aula = (id, data, status) => ({ id, alunoId: 'f5_delta', data, hora: '10:00', duracaoMin: 60, status,
      cobravel: true, notaTexto: '', notaPrivada: '', anexos: [] });
    // a aula de hoje, a última dada (09/11) e uma falta depois dela, que não conta como aula dada
    dados.aulas = [aula('f5_aula', Core.hojeIso(), 'realizada'), aula('f5_antes', '2026-11-09', 'realizada'),
      aula('f5_falta', '2026-11-12', 'falta')];
    dados.series = []; dados.resumos = [];
    await Store.salvar(dados);
  });
  await H.abrirApp(pag, amb.ORIGEM);
  // o servidor da prova serve o app.js envenenado a todos, inclusive ao service worker
  if (VENENO) conf('(veneno) o servidor entrega o app.js envenenado',
    /fecharModal\('modal-tema'\); aoEscolher\(t\);/.test(await pag.evaluate(() => fetch('app.js', { cache: 'no-store' }).then(r => r.text()))), true);

  secao('1. O seletor de temas pela trilha rola com o dedo e não é o da aula');
  await H.irParaAba(pag, 'alunos');
  await pag.click('#lista-alunos .item-lista[data-aluno="f5_delta"]');
  const ficha = await esperar('ficha aberta', () => pag.evaluate(() =>
    document.querySelector('#modal-aluno').classList.contains('aberto')), Boolean, 8000);
  conf('(arranjo) a ficha do aluno abriu', ficha.ok, true);
  await pag.evaluate(() => Array.from(document.querySelectorAll('#modal-aluno .aba-perfil'))
    .find(b => b.textContent.trim() === 'Mapeamento').click());
  const botao = await esperar('Trilha do zero na ficha', () => pag.$('#nova-trilha-do-zero'), Boolean, 8000);
  conf('(arranjo) a ficha oferece "Trilha do zero"', botao.ok, true);
  const estadoAntes = await pag.evaluate(() => history.length);
  await pag.click('#nova-trilha-do-zero');
  const temas = await esperar('lista de temas aberta', () => pag.$$eval('#modal-tema.aberto #lista-temas .item-tema', e => e.length),
    n => n > 5, 8000);
  conf('(arranjo) a lista de temas abriu pela trilha', temas.ok, true);
  const rolagem = await pag.evaluate(() => {
    const modal = document.querySelector('#modal-tema');
    const corpo = document.querySelector('#corpo-modal-tema');
    const lista = document.querySelector('#lista-temas');
    const janela = modal.querySelector('.modal');
    let rolavel = '';
    for (let e = lista; e && e !== janela.parentElement; e = e.parentElement) {
      const oy = getComputedStyle(e).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && e.scrollHeight > e.clientHeight + 1) { rolavel = e.id || e.className; break; }
    }
    return { rolavel, painelDaAula: modal.classList.contains('seletor-da-aula'), corpoDaAula: corpo.classList.contains('seletor-assunto') };
  });
  conf('o seletor da trilha não leva as classes do seletor da aula', rolagem.painelDaAula + '|' + rolagem.corpoDaAula, 'false|false');
  conf('a lista de temas da trilha rola com o dedo (' + rolagem.rolavel + ')', !!rolagem.rolavel, true);

  secao('2. Trilha do zero e Voltar: a ficha fica com a entrada dela no histórico');
  await pag.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#lista-temas .item-tema button')).find(x => x.textContent.trim() === 'Usar');
    b.click();
  });
  const trilha = await esperar('trilha nova aberta', () => pag.evaluate(() =>
    document.querySelector('#modal-trilha').classList.contains('aberto') &&
    !document.querySelector('#modal-tema').classList.contains('aberto')), Boolean, 8000);
  conf('(arranjo) escolher o tema abre a trilha nova e fecha o seletor', trilha.ok, true);
  await pausa(800); // o Voltar do seletor, se ainda estiver a caminho, chega aqui
  await pag.evaluate(() => history.back());
  await pausa(800);
  const depois = await pag.evaluate(() => ({
    trilha: document.querySelector('#modal-trilha').classList.contains('aberto'),
    ficha: document.querySelector('#modal-aluno').classList.contains('aberto'),
    fichaNoHistorico: !!(history.state && history.state.apoioModal)
  }));
  console.log('   depois do Voltar: ' + JSON.stringify(depois) + ' (history.length antes: ' + estadoAntes + ')');
  if (VENENO) {
    conf('VENENO visto: o Voltar fecha a trilha e a ficha fica com a entrada dela, e quebrou',
      !depois.trilha && depois.ficha && depois.fichaNoHistorico, false);
  } else {
    conf('o Voltar fecha a trilha, e a ficha continua aberta com a entrada dela no histórico',
      depois.trilha + '|' + depois.ficha + '|' + depois.fichaNoHistorico, 'false|true|true');
  }

  conf('não houve erro de página', pag.errosDePagina ? pag.errosDePagina.join(' | ') : '', '');
  if (VENENO) { await H.fim(amb)(); return; }
  await pag.close();

  secao('3. O painel de assunto com a aula atrás: o Voltar fecha o painel, depois a aula, e a raiz avisa');
  const p2 = await amb.pagina();
  await RELOGIO.naPagina(p2);
  await H.abrirApp(p2, amb.ORIGEM);
  const ouvirAvisos = () => p2.evaluate(() => {
    window.__avisos = [];
    const t = document.querySelector('#aviso-texto');
    new MutationObserver(() => window.__avisos.push(t.textContent)).observe(t, { childList: true, characterData: true, subtree: true });
  });
  const avisos = () => p2.evaluate(() => (window.__avisos || []).join('|'));
  const estado = () => p2.evaluate(() => ({
    tema: document.querySelector('#modal-tema').classList.contains('aberto'),
    aula: document.querySelector('#modal-aula').classList.contains('aberto'),
    janelaNoHistorico: !!(history.state && history.state.apoioModal)
  }));
  const abrirPainel = async () => {
    await H.irParaAba(p2, 'agenda');
    await p2.evaluate(() => document.querySelector('[data-aula-id="f5_aula"]').click());
    const aula = await esperar('a aula aberta', () => p2.evaluate(() => !!document.querySelector('#modal-aula.aberto #escolher-assunto')), Boolean, 8000);
    conf('(arranjo) a aula de hoje abriu, com o botão do assunto', aula.ok, true);
    await pausa(300);
    await p2.evaluate(() => document.querySelector('#escolher-assunto').click());
    const painel = await esperar('o painel de assunto', () => p2.evaluate(() =>
      !!document.querySelector('#modal-tema.aberto.seletor-da-aula #lista-assuntos .item-assunto')), Boolean, 8000);
    conf('(arranjo) o painel de assunto abriu sobre a aula', painel.ok, true);
    await pausa(300);
  };
  await ouvirAvisos();
  await abrirPainel();
  const painel = await p2.evaluate(() => {
    const r = document.querySelector('#modal-tema .modal').getBoundingClientRect();
    const c = document.querySelector('#tema-contexto');
    return { lateral: Math.abs(r.right - innerWidth) < 1 && r.left > innerWidth - 460 && Math.abs(r.height - innerHeight) < 1,
      contexto: c ? c.textContent.replace(/\s+/g, ' ').trim() : '' };
  });
  conf('o painel fica à direita, da altura da tela', painel.lateral, true);
  conf('o contexto diz a última aula dada, sem contar a falta (' + painel.contexto + ')', /Última aula: 09\/11/.test(painel.contexto), true);
  conf('e o ano do aluno', /7/.test(painel.contexto), true);
  conf('com o painel aberto, o histórico tem a entrada dele', (await estado()).janelaNoHistorico, true);

  await p2.evaluate(() => history.back());
  const v1 = await esperar('o 1º Voltar', estado, v => !!v && !v.tema, 4000);
  conf('1º Voltar: fecha só o painel, a aula fica aberta com a entrada dela no histórico',
    v1.ok && JSON.stringify(await estado()), JSON.stringify({ tema: false, aula: true, janelaNoHistorico: true }));
  await pausa(300);
  await p2.evaluate(() => history.back());
  const v2 = await esperar('o 2º Voltar', estado, v => !!v && !v.aula, 4000);
  conf('2º Voltar: fecha a aula, e o histórico fica sem janela',
    v2.ok && JSON.stringify(await estado()), JSON.stringify({ tema: false, aula: false, janelaNoHistorico: false }));
  await pausa(300);
  const url = p2.url();
  await p2.evaluate(() => { window.__avisos = []; history.back(); });
  const v3 = await esperar('o aviso da raiz', avisos, v => /Toque em Voltar de novo para sair\./.test(v || ''), 4000);
  conf('3º Voltar, na tela inicial: o aviso de sair, e o app continua aberto', v3.ok && p2.url() === url, true);

  secao('4. Recarregar com o painel aberto: sem janela, e a raiz continua guardada');
  await pausa(4000); // a guarda da raiz volta depois do aviso (GUARDA_DA_SAIDA_MS)
  // o estado em que o documento novo NASCEU, lido antes de o app rodar: é a condição da prova
  await p2.evaluateOnNewDocument(() => {
    window.__estadoAoNascer = (history.state && history.state.apoioModal) || null;
  });
  await abrirPainel();
  await H.abrirApp(p2, amb.ORIGEM);
  await ouvirAvisos();
  conf('(arranjo) o documento novo nasceu na entrada de janela do painel',
    !!(await p2.evaluate(() => window.__estadoAoNascer)), true);
  conf('depois de recarregar, nenhuma janela aberta',
    await p2.evaluate(() => document.querySelectorAll('.fundo-modal.aberto').length), 0);
  conf('e o histórico não diz que há janela aberta', (await estado()).janelaNoHistorico, false);
  const url2 = p2.url();
  await p2.evaluate(() => { window.__avisos = []; history.back(); });
  const r1 = await esperar('o aviso depois de recarregar', () => avisos().catch(() => ''), v => /Toque em Voltar de novo para sair\./.test(v || ''), 5000);
  conf('o 1º Voltar depois de recarregar é o aviso da raiz, sem sair do app', r1.ok && p2.url() === url2, true);
  conf('não houve erro de página na aula', p2.errosDePagina.join(' | '), '');
  await H.fim(amb)();
})().catch(e => H.fim(amb)(e));
