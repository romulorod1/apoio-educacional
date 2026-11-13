/* testa_trilha_do_zero_voltar.js
 *
 * F5 (#158, revisão): o seletor de temas aberto PELA TRILHA, na ficha do
 * aluno, com o tablet deitado (1280x1000).
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
 *
 * Veneno --envenenado-trilha-antes-do-voltar: serve o app.js com a trilha
 * aberta logo depois do fecharModal, sem esperar o Voltar (como na 803b2e6).
 * A conferência 2 tem de cair. Dados fictícios.
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
    dados.aulas = []; dados.series = []; dados.resumos = [];
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
  await H.fim(amb)();
})().catch(e => H.fim(amb)(e));
