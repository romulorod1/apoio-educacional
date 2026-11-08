/* testa_rollback_v4.js
 *
 * N1, fatia 1: o ROLLBACK de verdade. A regra do projeto diz que desfazer o
 * release do banco por registro é republicar o código da versão 4 COM
 * VERSAO_BANCO = 5. Esta prova faz isso com o código REAL da versão 4
 * (_store_v4_historico.js) e pergunta, em cada volta da 5, se ela vê o que a 4
 * fez no `principal`:
 *
 *   1. a 5 grava um documento fictício;
 *   2. a 4 (com VERSAO_BANCO = 5) lê o que a 5 gravou, edita, apaga uma aula e
 *      grava o `principal`;
 *   3. a 5 volta e carregar() é exatamente o que a 4 gravou: os registros são
 *      refeitos (aula editada, lápide da apagada, pagamento novo);
 *   4. a 4 faz "Apagar tudo" (esvazia 'dados', sem conhecer os registros nem
 *      o retrato) e a 5 volta: carregar() é null, todo registro vivo vira
 *      lápide, e o salvar seguinte não ressuscita nada. Veio da revisão
 *      adversarial (08/11): antes, a 5 montava o documento inteiro a partir
 *      dos registros vivos e o apagamento da 4 era desfeito.
 *
 * Veneno, que TEM de reprovar a propriedade (a rodada passa quando a prova VÊ
 * o veneno):
 *   --envenenado-registros-ressuscitam  a regra antiga do carregar: sem
 *                                       principal, os registros vivos montam
 *                                       o documento de volta.
 *
 * Dados fictícios. Porta 8845. O service worker é contornado.
 */
'use strict';
const H = require('./_bib_navegador.js');
const R = require('./_prova_registros.js');
const { conf, secao } = H;

const PORTA = 8845;
const VENENO = '--envenenado-registros-ressuscitam';
const MODO = process.argv.indexOf(VENENO) !== -1 ? VENENO : '';
function prop(rotulo, ok) {
  if (MODO) return conf('VENENO visto: ' + rotulo + ', e quebrou', ok, false);
  return conf(rotulo, ok, true);
}

secao('0. As âncoras e o veneno');
R.conferirAncoras(conf);
const STORE_SERVIDO = R.storeEnvenenado(MODO);
if (MODO) conf('o store.js servido ficou diferente do repositório (' + MODO + ')', STORE_SERVIDO !== R.STORE, true);
const V4_EM_6 = R.STORE_V4.replace('var VERSAO_BANCO = 4;', 'var VERSAO_BANCO = 6;');
conf('o código da versão 4 foi republicado com VERSAO_BANCO = 6 (o rollback do plano)', V4_EM_6 !== R.STORE_V4, true);

const trocas = {};
const amb = H.criarAmbiente(PORTA, 'perfil_rollback_v4', trocas);
const DOC = function () {
  const d = { versao: 1, alunos: [], series: [], aulas: [], resumos: [], ajustes: { chavePix: 'chave-de-teste' }, pagamentos: [] };
  d.alunos = [1, 2].map(k => ({ id: 'a' + k, nome: 'Aluna Teste ' + k, ativo: true, precos: [{ id: 'p' + k, inicio: '2026-01-01', fim: null, valorHora: 100 }] }));
  for (let k = 0; k < 6; k++) d.aulas.push({ id: 'aula' + k, alunoId: 'a' + (1 + k % 2), serieId: null, data: '2026-06-0' + (1 + k), hora: '10:00',
    duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] });
  d.pagamentos = [{ id: 'pg1', alunoId: 'a1', mes: '2026-05', pagoEm: '2026-06-02', valor: 300 }];
  return d;
};

(async () => {
  await amb.subir();
  secao('1. A versão 5 grava o documento');
  let pag = await R.abrirPaginaNua(amb, trocas, STORE_SERVIDO);
  await pag.evaluate(() => new Promise(res => { const q = indexedDB.deleteDatabase('apoio-educacional'); q.onsuccess = q.onerror = q.onblocked = () => res(); }));
  await pag.close();
  pag = await R.abrirPaginaNua(amb, trocas, STORE_SERVIDO);
  const a = await pag.evaluate(async (montar) => {
    const d = (new Function('return (' + montar + ')()'))();
    await Store.salvar(d);
    const P = window.__prova;
    const c = await Store.carregar();
    return { canon: P.canon(c), ordem: P.ordem(c), versao: (await P.versaoEDepositos()).versao, regs: P.resumoDosRegistros(await P.registrosPorFora()) };
  }, DOC.toString());
  conf('banco na 6 com um registro vivo por item', a.versao + '/' + a.regs.vivos, '6/11');
  await pag.close();

  secao('2. Rollback: o código da 4 (com VERSAO_BANCO = 6) lê, edita e grava o principal');
  pag = await R.abrirPaginaNua(amb, trocas, V4_EM_6);
  const b = await pag.evaluate(async () => {
    const P = window.__prova;
    const d = await Store.carregar();
    const lido = P.canon(d), ordemLida = P.ordem(d);
    d.aulas = d.aulas.filter(x => x.id !== 'aula3');
    d.aulas[0].status = 'cancelada';
    d.pagamentos.push({ id: 'pg2', alunoId: 'a2', mes: '2026-05', pagoEm: '2026-06-05', valor: 200 });
    await Store.salvar(d);
    return { lido, ordemLida, gravado: P.canon(d), ordemGravada: P.ordem(d), versao: (await P.versaoEDepositos()).versao };
  });
  conf('a 4 abre o banco da 6 sem subir versão', b.versao, 6);
  conf('a 4 lê o que a 5 gravou, na mesma ordem', b.lido === a.canon && b.ordemLida === a.ordem, true);
  conf('nenhum erro de página na 4', pag.errosDePagina.join(' | '), '');
  await pag.close();

  secao('3. A 5 volta e vê a edição da 4');
  pag = await R.abrirPaginaNua(amb, trocas, STORE_SERVIDO);
  const c = await pag.evaluate(async () => {
    const P = window.__prova;
    P.zerarPuts();
    const d = await Store.carregar();
    const regs = await P.registrosPorFora();
    return { canon: P.canon(d), ordem: P.ordem(d), puts: P.puts.registros.slice().sort(), lapide: regs.some(r => r.id === 'aula:aula3' && r.apagadoEm) };
  });
  conf('carregar() da 5 é o que a 4 gravou, na mesma ordem', c.canon === b.gravado && c.ordem === b.ordemGravada, true);
  conf('registros refeitos: aula editada, aula apagada (lápide) e pagamento novo', c.puts.join(',') + ' lapide=' + c.lapide, 'aula:aula0,aula:aula3,pagamento:pg2 lapide=true');
  await pag.close();

  secao('4. Rollback de novo: a 4 faz "Apagar tudo" e a 5 volta');
  pag = await R.abrirPaginaNua(amb, trocas, V4_EM_6);
  const d4 = await pag.evaluate(async () => {
    const P = window.__prova;
    await Store.apagarTudo();
    return { carregar: await Store.carregar(), principal: await P.principalPorFora(), regs: P.resumoDosRegistros(await P.registrosPorFora()) };
  });
  conf('na 4, depois de apagar tudo, carregar() é null e o principal saiu', (d4.carregar === null) + '/' + (d4.principal === null), 'true/true');
  conf('e a 4 não tocou nos registros (vivos continuam lá, para a 5 resolver)', d4.regs.vivos > 0, true);
  await pag.close();
  pag = await R.abrirPaginaNua(amb, trocas, STORE_SERVIDO);
  const e = await pag.evaluate(async () => {
    const P = window.__prova;
    P.zerarPuts();
    const d = await Store.carregar();
    const regs = await P.registrosPorFora();
    const principalDepoisDoCarregar = await P.principalPorFora();
    // o aplicativo grava o que carregou (ou, vendo null, o banco vazio ou a carga inicial): nada de antes pode voltar
    await Store.salvar(d || Store.bancoVazio());
    const depois = await Store.carregar();
    return { nulo: d === null, vivosDepoisDoCarregar: regs.filter(r => !r.apagadoEm).length, lapides: regs.filter(r => !!r.apagadoEm).length,
      principalAusente: principalDepoisDoCarregar === null, alunosDepoisDoSalvar: depois.alunos.length, aulasDepoisDoSalvar: depois.aulas.length,
      segundaAbertura: P.ordem(depois) };
  });
  prop('a 5 devolve null depois de a 4 ter apagado tudo (o apagamento de fora vence)', e.nulo);
  prop('e todo registro vivo virou lápide', e.vivosDepoisDoCarregar === 0 && e.lapides > 0);
  conf('o principal continua ausente depois do carregar', e.principalAusente, true);
  prop('o salvar seguinte não ressuscita nada', e.alunosDepoisDoSalvar === 0 && e.aulasDepoisDoSalvar === 0);
  conf('nenhum erro de página', pag.errosDePagina.join(' | '), '');
  await pag.close();
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
