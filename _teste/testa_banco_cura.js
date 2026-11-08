/* testa_banco_cura.js
 *
 * N1: a VOLTA depois do rollback (segunda mão do #116). A regra do projeto
 * desfaz um release republicando o código antigo com o número novo de
 * VERSAO_BANCO. Num aparelho que nunca tinha passado pelo código novo, esse
 * código antigo abre o banco já no número novo, SEM os depósitos novos
 * (registros, controle, saida). Quando o código novo volta, o onupgradeneeded
 * não roda, porque a versão já é a dele: sem a cura do abrir, toda leitura
 * cairia em NotFoundError, para sempre, porque nenhuma versão seguinte viria
 * resolver.
 *
 * O que prova, com dados fictícios e o código REAL da versão 4
 * (_store_v4_historico.js):
 *   1. a 4 republicada com VERSAO_BANCO = 6 abre um banco novo na 6, sem os
 *      depósitos novos, e grava o documento;
 *   2. o código deste commit abre esse banco: a sonda vê que falta depósito,
 *      reabre na 7, cria o que falta e migra a partir do principal; carregar()
 *      é o documento, campo a campo e na ordem; um registro vivo por item; a
 *      fila semeada com os sincronizáveis; o principal intacto;
 *   3. a abertura seguinte não sobe mais a versão nem grava nada;
 *   4. o código da 4 (com 6) volta a abrir esse banco na 7? Não: ele pede a 6
 *      e o navegador recusa (VersionError), que é o limite documentado da
 *      cura; a prova registra o fato.
 *
 * Veneno, que TEM de reprovar a propriedade (a rodada passa quando a prova VÊ
 * o veneno):
 *   --envenenado-sem-cura  o abrir adota o banco pela versão, sem olhar os
 *                          depósitos: carregar() cai em NotFoundError.
 *
 * Porta 8846. O service worker é contornado.
 */
'use strict';
const H = require('./_bib_navegador.js');
const R = require('./_prova_registros.js');
const { conf, secao } = H;

const PORTA = 8846;
const VENENO = '--envenenado-sem-cura';
const MODO = process.argv.indexOf(VENENO) !== -1 ? VENENO : '';
function prop(rotulo, ok) {
  if (MODO) return conf('VENENO visto: ' + rotulo + ', e quebrou', ok, false);
  return conf(rotulo, ok, true);
}

secao('0. As âncoras e o veneno');
R.conferirAncoras(conf);
const CURA = 'if (b.version >= VERSAO_BANCO && !faltam.length) { adotar(b); return; }';
conf('a cura do abrir está num lugar só', R.STORE.split(CURA).length, 2);
const STORE_SERVIDO = MODO ? R.STORE.split(CURA).join('if (b.version >= VERSAO_BANCO) { adotar(b); return; }') : R.STORE;
if (MODO) conf('o store.js servido ficou diferente do repositório (' + MODO + ')', STORE_SERVIDO !== R.STORE, true);
const V4_EM_6 = R.STORE_V4.replace('var VERSAO_BANCO = 4;', 'var VERSAO_BANCO = 6;');
conf('o código da versão 4 foi republicado com VERSAO_BANCO = 6 (o rollback do plano)', V4_EM_6 !== R.STORE_V4, true);

const trocas = {};
const amb = H.criarAmbiente(PORTA, 'perfil_banco_cura', trocas);
const DOC = function () {
  const d = { versao: 1, alunos: [], series: [], aulas: [], resumos: [], ajustes: { chavePix: 'chave-de-teste', versaoVista: '9.9.9' }, pagamentos: [] };
  d.alunos = [1, 2].map(k => ({ id: 'a' + k, nome: 'Aluna Teste ' + k, ativo: true, precos: [{ id: 'p' + k, inicio: '2026-01-01', fim: null, valorHora: 100 }] }));
  for (let k = 0; k < 6; k++) d.aulas.push({ id: 'aula' + k, alunoId: 'a' + (1 + k % 2), serieId: null, data: '2026-06-0' + (1 + k), hora: '10:00',
    duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] });
  d.resumos = [{ alunoId: 'a1', mes: '2026-06', texto: 'Resumo de junho' }];
  return d;
};
// alunos 2 + aulas 6 + resumos 1 + ajustes 2 + raiz 1
const ITENS = 12, SINCRONIZAVEIS = 12 - 1 - 1; // sem raiz:versao e sem ajuste:versaoVista

(async () => {
  await amb.subir();
  secao('1. A 4 republicada com VERSAO_BANCO = 6 abre um banco novo, sem os depósitos novos');
  let pag = await R.abrirPaginaNua(amb, trocas, V4_EM_6);
  await pag.evaluate(() => new Promise(res => { const q = indexedDB.deleteDatabase('apoio-educacional'); q.onsuccess = q.onerror = q.onblocked = () => res(); }));
  await pag.close();
  pag = await R.abrirPaginaNua(amb, trocas, V4_EM_6);
  const a = await pag.evaluate(async (montar) => {
    const d = (new Function('return (' + montar + ')()'))();
    await Store.salvar(d);
    await Store.salvarNota('aula1', { paginas: [{ itens: [] }] });
    const P = window.__prova;
    const v = await P.versaoEDepositos();
    const principal = await P.principalPorFora();
    return { versao: v.versao, depositos: v.depositos, canon: P.canon(principal), ordem: P.ordem(principal), contagens: await P.contagensDosDepositos() };
  }, DOC.toString());
  conf('o banco nasceu na versão 6', a.versao, 6);
  conf('sem registros, controle nem saida', a.depositos.filter(d => d === 'registros' || d === 'controle' || d === 'saida').length, 0);
  await pag.close();

  secao('2. O código novo volta: a cura cria o que falta e migra');
  pag = await R.abrirPaginaNua(amb, trocas, STORE_SERVIDO);
  const b = await pag.evaluate(async () => {
    const P = window.__prova;
    let erro = null, carregado = null;
    try { carregado = await Store.carregar(); } catch (e) { erro = (e && e.name) || String(e); }
    let v = null, registros = [], fila = [], principal = null, contagens = null;
    try {
      v = await P.versaoEDepositos();
      registros = await P.registrosPorFora();
      fila = await Store.lerFila();
      principal = await P.principalPorFora();
      contagens = await P.contagensDosDepositos();
    } catch (e) { erro = erro || ((e && e.name) || String(e)); }
    return { erro, canon: P.canon(carregado), ordem: P.ordem(carregado), versao: v && v.versao, depositos: v ? v.depositos : [],
      registros: P.resumoDosRegistros(registros), fila: fila.length, canonPrincipal: P.canon(principal), contagens };
  });
  prop('carregar() abre sem erro (sem a cura seria NotFoundError: ' + (b.erro || 'nenhum') + ')', b.erro === null);
  prop('e devolve o documento que a 4 gravou, campo a campo e na ordem', b.canon === a.canon && b.ordem === a.ordem);
  if (MODO) throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
  conf('o banco subiu para a 7 (a versão que tinha, mais um)', b.versao, 7);
  conf('com registros, controle e saida', b.depositos.filter(d => d === 'registros' || d === 'controle' || d === 'saida').join(','), 'controle,registros,saida');
  conf('um registro vivo por item (' + ITENS + '), nenhuma lápide', b.registros.vivos + '/' + b.registros.lapides, ITENS + '/0');
  conf('a fila semeada com os sincronizáveis (' + SINCRONIZAVEIS + ': sem raiz e sem o ajuste do aparelho)', b.fila, SINCRONIZAVEIS);
  conf('o principal não foi tocado', b.canonPrincipal === a.canon, true);
  const chaves = Object.keys(a.contagens).sort();
  conf('os depósitos de antes, um a um, têm as mesmas contagens', chaves.map(k => k + '=' + a.contagens[k]).join(' '), chaves.map(k => k + '=' + b.contagens[k]).join(' '));
  await pag.close();

  secao('3. A abertura seguinte não sobe a versão nem grava');
  pag = await R.abrirPaginaNua(amb, trocas, STORE_SERVIDO);
  const c = await pag.evaluate(async () => {
    const P = window.__prova;
    P.zerarPuts();
    const d = await Store.carregar();
    const v = await P.versaoEDepositos();
    return { versao: v.versao, puts: P.puts.registros.length + P.puts.dados + P.puts.controle + P.puts.outros, canon: P.canon(d) };
  });
  conf('continua na 7', c.versao, 7);
  conf('nenhum put', c.puts, 0);
  conf('e o documento é o mesmo', c.canon === a.canon, true);
  conf('nenhum erro de página', pag.errosDePagina.join(' | '), '');
  await pag.close();

  secao('4. O limite documentado: a 4 (com 6) não abre mais o banco na 7');
  pag = await R.abrirPaginaNua(amb, trocas, V4_EM_6);
  const d4 = await pag.evaluate(async () => {
    try { await Store.carregar(); return 'abriu'; } catch (e) { return (e && e.versaoNova) ? 'versaoNova' : ((e && e.name) || String(e)); }
  });
  conf('a 4 recebe a recusa tratada (versaoNova), e não um erro cru', d4, 'versaoNova');
  await pag.close();
})().then(() => H.fim(amb)(), e => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e)));
