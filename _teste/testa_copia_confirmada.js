/* A2a: a data da cópia acompanha a entrega confirmada, nunca a montagem,
 * o cancelamento ou o clique de download. Usa o botão real e o banco real. */
'use strict';
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8864, 'nath_a2a_copia');
const { conf, secao, esperar } = H;

(async function () {
  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);
  await pag.evaluate(async () => {
    const d = await Store.carregar();
    d.alunos = [{ id: 'alfa_a2a', nome: 'Aluna Alfa Teste', precos: [] }];
    d.series = [];
    d.aulas = [];
    d.ajustes = d.ajustes || {};
    d.ajustes.ultimaCopia = '2020-01-01';
    await Store.salvar(d);
  });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'ajustes');

  await pag.evaluate(() => {
    window.__downloadsA2a = 0;
    HTMLAnchorElement.prototype.click = function () {
      if (this.hasAttribute('download')) window.__downloadsA2a++;
    };
    navigator.canShare = () => true;
    navigator.share = () => Promise.reject(new DOMException('cancelado', 'AbortError'));
    document.querySelector('#baixar-copia').click();
  });
  const pronta = await esperar('faixa da cópia pronta', () =>
    pag.$eval('#copia-pronta-ajustes', e => e.textContent), t => /Cópia montada/.test(t), 15000);
  conf('montar mostra faixa persistente', pronta.ok, true);
  conf('montar não atualiza a data', await pag.evaluate(async () =>
    (await Store.carregar()).ajustes.ultimaCopia), '2020-01-01');

  secao('compartilhamento cancelado');
  await pag.click('#copia-pronta-ajustes button');
  const cancelou = await esperar('cancelamento observado', () =>
    pag.$eval('#aviso-texto', e => e.textContent), t => /Envio cancelado/.test(t), 5000);
  conf('cancelamento aparece', cancelou.ok, true);
  conf('cancelamento não baixa nem altera a data', await pag.evaluate(async () =>
    [window.__downloadsA2a, (await Store.carregar()).ajustes.ultimaCopia].join('|')), '0|2020-01-01');
  conf('a faixa continua para tentar de novo', await pag.$eval('#copia-pronta-ajustes', e => /Enviar/.test(e.textContent)), true);

  secao('download sem confirmação automática');
  await pag.evaluate(() => { navigator.canShare = () => false; });
  await pag.click('#copia-pronta-ajustes button');
  conf('download iniciado, data antiga preservada', await pag.evaluate(async () =>
    [window.__downloadsA2a, (await Store.carregar()).ajustes.ultimaCopia].join('|')), '1|2020-01-01');
  conf('pede confirmação explícita', await pag.$eval('#copia-pronta-ajustes', e =>
    /Já guardei o arquivo/.test(e.textContent)), true);
  await pag.click('#copia-pronta-ajustes button');
  const confirmada = await esperar('data confirmada', () => pag.evaluate(async () =>
    (await Store.carregar()).ajustes.ultimaCopia), d => d !== '2020-01-01', 5000);
  conf('só a confirmação atualiza a data', confirmada.ok, true);
  conf('faixa pendente sai após confirmar', await pag.$('#copia-pronta-ajustes'), null);

  secao('compartilhamento aceito');
  await pag.evaluate(async () => {
    const d = await Store.carregar();
    d.ajustes.ultimaCopia = '2020-01-01';
    await Store.salvar(d);
  });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => {
    navigator.canShare = () => true;
    navigator.share = () => Promise.resolve();
    document.querySelector('#baixar-copia').click();
  });
  await esperar('nova faixa pronta', () => pag.$('#copia-pronta-ajustes'), Boolean, 15000);
  await pag.click('#copia-pronta-ajustes button');
  const enviada = await esperar('data após share', () => pag.evaluate(async () =>
    (await Store.carregar()).ajustes.ultimaCopia), d => d !== '2020-01-01', 5000);
  conf('share resolvido atualiza a data', enviada.ok, true);
  conf('sem faixa pendente após share', await pag.$('#copia-pronta-ajustes'), null);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
