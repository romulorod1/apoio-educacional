/* B8: três decisões no fechamento, uma ocorrência por vez, com persistência. */
'use strict';
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8862, 'b8_fechamento');
const { conf, esperar } = H;

(async () => {
  await amb.subir();
  const pagina = await amb.pagina();
  await pagina.setViewport({ width: 1280, height: 1000, hasTouch: true });
  await H.abrirApp(pagina, amb.ORIGEM);
  const datas = await pagina.evaluate(async () => {
    const db = await Store.carregar();
    const mes = Core.hojeIso().slice(0, 7);
    const data = mes + '-03';
    const proximo = new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 15);
    const destino = proximo.getFullYear() + '-' + String(proximo.getMonth() + 1).padStart(2, '0') + '-15';
    db.alunos = [{ id: 'b8-alfa', nome: 'Aluna Alfa Teste', ativo: true, cor: '#1F3A5F',
      precos: [{ id: 'preco-b8', inicio: '2000-01-01', fim: null, valorHora: 100 }] }];
    db.aulas = [1, 2, 3].map(n => ({ id: 'b8-a' + n, alunoId: 'b8-alfa',
      data: mes + '-0' + n, hora: '10:00', duracaoMin: 60, status: 'realizada', cobravel: true,
      serieId: n === 3 ? 'b8-serie' : null, destacada: false, notaTexto: '', notaPrivada: '', anexos: [] }));
    db.series = [{ id: 'b8-serie', alunoId: 'b8-alfa', dias: [], inicio: data,
      fim: null, materializadoAte: mes, exclusoes: [] }];
    db.resumos = [];
    await Store.salvar(db);
    return { mes, data, destino };
  });
  await H.abrirApp(pagina, amb.ORIGEM);
  await H.irParaAba(pagina, 'fechamento');
  const linha = id => '[data-aula-fechamento="' + id + '"]';
  async function totalEsperado(valor) {
    const resultado = await esperar('total exibido ' + valor, () => pagina.$eval('#lista-fechamento .total td:nth-child(5)', e => e.textContent),
      texto => texto.includes(valor), 5000);
    conf('fechamento mostra total ' + valor, resultado.ok, true);
  }
  const primeira = await esperar('ações no fechamento', () => pagina.$(linha('b8-a1') + ' .b8-abrir'), Boolean, 5000);
  if (!primeira.ok) throw new Error('Ações da aula não apareceram no fechamento');
  await totalEsperado('300,00');
  await pagina.click(linha('b8-a1') + ' .b8-abrir');
  conf('abrir leva à aula correta', await pagina.$eval('#titulo-modal-aula', e => e.textContent.includes('01/')), true);
  await pagina.click('#modal-aula .fechar');
  await pagina.click(linha('b8-a1') + ' .b8-nao-cobrar');
  const naoCobrou = await esperar('primeira aula não cobrada', () => pagina.evaluate(async () =>
    (await Store.carregar()).aulas.find(a => a.id === 'b8-a1').cobravel === false), Boolean, 5000);
  if (!naoCobrou.ok) throw new Error('Não cobrar não foi gravado');
  await totalEsperado('200,00');
  await pagina.click(linha('b8-a2') + ' .b8-cancelar');
  const cancelou = await esperar('segunda aula cancelada', () => pagina.evaluate(async () => {
    const a = (await Store.carregar()).aulas.find(x => x.id === 'b8-a2'); return a.status === 'cancelada' && a.cobravel === false;
  }), Boolean, 5000);
  if (!cancelou.ok) throw new Error('Cancelamento não foi gravado');
  await totalEsperado('100,00');
  await pagina.click(linha('b8-a3') + ' .b8-adiar');
  await pagina.$eval(linha('b8-a3') + ' input[type=date]', e => { e.value = ''; });
  await pagina.click(linha('b8-a3') + ' .b8-confirmar-data');
  conf('data vazia não move a aula', await pagina.evaluate(async () =>
    (await Store.carregar()).aulas.find(a => a.id === 'b8-a3').data), datas.data);
  await pagina.$eval(linha('b8-a3') + ' input[type=date]', (e, data) => { e.value = data; e.dispatchEvent(new Event('input', { bubbles: true })); }, datas.destino);
  await pagina.click(linha('b8-a3') + ' .b8-confirmar-data');
  const gravou = await esperar('aula adiada', () => pagina.evaluate(async destino => {
    const db = await Store.carregar(); const a = db.aulas.find(x => x.id === 'b8-a3');
    return a.data === destino && a.destacada && !db.series[0].exclusoes.includes(destino) && db.series[0].exclusoes.length === 1;
  }, datas.destino), Boolean, 5000);
  conf('adiar grava uma ocorrência destacada sem recriar a data anterior', gravou.ok, true);
  await totalEsperado('0,00');
  const estado = await pagina.evaluate(async mes => {
    const db = await Store.carregar(); return { total: Core.calcularFechamento(db, 'b8-alfa', mes).totalValor,
      exclusoes: db.series[0].exclusoes, quantidade: db.aulas.length };
  }, datas.mes);
  conf('total do mês recalculado após as três ações', estado.total, 0);
  conf('data original da repetição foi excluída', estado.exclusoes.includes(datas.data), true);
  conf('as três aulas seguem preservadas', estado.quantidade, 3);
  await pagina.reload({ waitUntil: 'domcontentloaded' });
  const persistido = await pagina.evaluate(async () => (await Store.carregar()).aulas.find(a => a.id === 'b8-a3').data);
  conf('adiamento continua após recarregar', persistido, datas.destino);
  await H.irParaAba(pagina, 'fechamento');
  await pagina.evaluate(() => {
    window.__b8SemEspaco = true;
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () {
      const pedido = original.apply(this, arguments);
      if (window.__b8SemEspaco && this.name === 'dados') this.transaction.abort();
      return pedido;
    };
  });
  await pagina.click(linha('b8-a1') + ' .b8-cancelar');
  const falha = await esperar('aviso de gravação', () => pagina.evaluate(() => {
    const f = document.querySelector('#faixa-gravacao'); return !!(f && !f.hidden && getComputedStyle(f).display !== 'none');
  }), Boolean, 5000);
  conf('falha de gravação é informada', falha.ok, true);
  conf('falha não altera a aula guardada', await pagina.evaluate(async () =>
    (await Store.carregar()).aulas.find(a => a.id === 'b8-a1').status), 'realizada');
  await pagina.evaluate(() => { window.__b8SemEspaco = false; });
  await pagina.click('#faixa-gravacao-tentar');
  const recuperou = await esperar('tentativa salva cancelamento', () => pagina.evaluate(async () =>
    (await Store.carregar()).aulas.find(a => a.id === 'b8-a1').status === 'cancelada'), Boolean, 5000);
  conf('nova tentativa guarda a mudança que ficou na tela', recuperou.ok, true);
})().then(H.fim(amb), H.fim(amb));
