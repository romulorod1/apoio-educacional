/* Um valor editado e descartado não pode ser salvo por outra ação. */
'use strict';
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8858, 'b9_preco_cancelado');
const { conf, esperar } = H;

(async () => {
  await amb.subir();
  const pagina = await amb.pagina();
  await H.abrirApp(pagina, amb.ORIGEM);
  await pagina.evaluate(async () => {
    const db = await Store.carregar();
    db.alunos = [{ id: 'b9-alfa', nome: 'Aluna Alfa Teste', ativo: true, cor: '#1F3A5F',
      precos: [{ id: 'b9-preco', inicio: '2020-01-01', fim: null, valorHora: 100 }] }];
    db.aulas = []; db.series = []; db.resumos = [];
    await Store.salvar(db);
  });
  await H.abrirApp(pagina, amb.ORIGEM);
  async function abrirValores() {
    await H.irParaAba(pagina, 'alunos');
    await pagina.click('#lista-alunos .item-lista[data-aluno="b9-alfa"]');
    await pagina.evaluate(() => Array.from(document.querySelectorAll('#modal-aluno .aba-perfil'))
      .find(b => b.textContent.trim() === 'Valores').click());
  }
  async function alterarValor(valor) {
    await pagina.$eval('#caixa-precos input[type=number]', (e, v) => {
      e.value = String(v); e.dispatchEvent(new Event('input', { bubbles: true }));
    }, valor);
  }
  async function precoGravado() {
    return pagina.evaluate(async () => (await Store.carregar()).alunos[0].precos[0].valorHora);
  }
  await abrirValores();
  await alterarValor(200);
  await pagina.$$eval('#caixa-precos input[type=date]', campos => {
    campos[0].value = '2020-02-01'; campos[0].dispatchEvent(new Event('input', { bubbles: true }));
    campos[1].value = '2021-12-31'; campos[1].dispatchEvent(new Event('input', { bubbles: true }));
  });
  await pagina.click('#modal-aluno [data-fechar]');
  await pagina.click('#alternar-valores');
  const outraGravacao = await esperar('outra alteração gravada', () => pagina.evaluate(async () =>
    !!(await Store.carregar()).ajustes.valoresOcultos), Boolean, 8000);
  if (!outraGravacao.ok) throw new Error('A outra alteração não foi gravada');
  conf('fechar sem salvar preserva o preço mesmo após outra gravação', await precoGravado(), 100);
  const periodo = await pagina.evaluate(async () => {
    const p = (await Store.carregar()).alunos[0].precos[0]; return [p.inicio, p.fim];
  });
  conf('fechar sem salvar preserva início e fim da vigência', JSON.stringify(periodo), JSON.stringify(['2020-01-01', null]));
  await abrirValores();
  await alterarValor(200);
  await pagina.click('#salvar-aluno');
  const salvo = await esperar('valor salvo de propósito', precoGravado, valor => valor === 200, 8000);
  conf('salvar a ficha grava o novo preço', salvo.ok, true);
})().then(H.fim(amb), H.fim(amb));
