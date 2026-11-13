/* testa_mede_secao15.js (TEMPORÁRIA: mede a seção 15 de testa_aula_salva_sozinha.js)
 *
 * Repete N vezes o passo da seção 15 (abrir a aula NOVA, mudar o horário,
 * apertar o Voltar) e conta o que aconteceu em cada vez:
 *   perguntou   o Voltar abriu "Sair sem guardar o que você escreveu?";
 *   fechou      a janela fechou SEM perguntar (o Voltar foi processado, mas o
 *               app não viu mudança: a foto da janela saiu depois da mudança);
 *   nada        nem pergunta nem fechou no teto (o Voltar não foi processado).
 * --como-hoje   o passo exato da seção 15 de hoje (muda o campo logo que a
 *               janela abre e espera o diálogo 5 s);
 * --com-espera  o passo novo (espera a tarefa da foto da janela rodar antes de
 *               mudar o campo, e espera o Voltar ser processado, com teto de 15 s).
 * O placar É a taxa: "N passaram, M falharam" = perguntou N vezes, e M não. Dados fictícios.
 */
'use strict';
const H = require('./_bib_navegador');
const RELOGIO = H.relogioDaRodada('2026-11-16', '11:00');
const { esperar, pausa } = H;
const COMO_HOJE = process.argv.indexOf('--como-hoje') >= 0;
const N = Number((process.argv.find(a => /^--vezes=\d+$/.test(a)) || '--vezes=30').split('=')[1]);
const amb = H.criarAmbiente(8893, 'nath_mede_secao15', {});
const aberta = pag => pag.evaluate(() => document.querySelector('#modal-aula').classList.contains('aberto'));
async function escolher(pag, sel, valor) {
  await pag.$eval(sel, (e, v) => { e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, valor);
}

(async () => {
  await amb.subir();
  const pag = await amb.pagina();
  pag.dialogos = [];
  pag.respostaDoDialogo = false;
  pag.removeAllListeners('dialog');
  pag.on('dialog', async d => {
    pag.dialogos.push(d.message());
    try { if (pag.respostaDoDialogo) await d.accept(); else await d.dismiss(); } catch (e) { /* ok */ }
  });
  await RELOGIO.naPagina(pag);
  await H.abrirApp(pag, amb.ORIGEM);
  await pag.evaluate(async () => {
    const d = await Store.carregar();
    d.alunos = [{ id: 'm15_alfa', nome: 'Aluna Medida Teste', ativo: true, precos: [] }];
    d.series = []; d.resumos = []; d.aulas = [];
    await Store.salvar(d);
  });
  await H.abrirApp(pag, amb.ORIGEM);
  const conta = { perguntou: 0, fechou: 0, nada: 0 };
  for (let i = 0; i < N; i++) {
    await H.irParaAba(pag, 'agenda');
    await pag.click('#nova-aula');
    await esperar('a aula nova abriu', () => aberta(pag), Boolean, 5000);
    if (!COMO_HOJE) await pag.evaluate(() => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0))));
    await escolher(pag, '#campo-hora', '07:30');
    pag.respostaDoDialogo = false;
    const d0 = pag.dialogos.length;
    await pag.evaluate(() => history.back());
    const teto = COMO_HOJE ? 5000 : 15000;
    const r = await esperar('o Voltar processado', async () =>
      pag.dialogos.length > d0 ? 'perguntou' : (!(await aberta(pag)) ? 'fechou' : ''), v => !!v, teto);
    const desfecho = r.ok ? r.valor : 'nada';
    conta[desfecho]++;
    H.conf('vez ' + (i + 1) + ': o Voltar perguntou', desfecho, 'perguntou'); // o placar é a taxa
    // fecha o que ficou, para a próxima vez começar igual
    if (await aberta(pag)) {
      pag.respostaDoDialogo = true;
      await pag.evaluate(() => history.back());
      await esperar('fechou', async () => !(await aberta(pag)), Boolean, 15000);
    }
    await pausa(200);
  }
  console.log('MEDIDA seção 15 (' + (COMO_HOJE ? 'como hoje' : 'com espera') + '): ' + N + ' vezes, perguntou ' + conta.perguntou +
    ', fechou sem perguntar ' + conta.fechou + ', nada ' + conta.nada);

  await H.fim(amb)();
})().catch(e => H.fim(amb)(e));
