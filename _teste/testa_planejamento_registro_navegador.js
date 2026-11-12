/* testa_planejamento_registro_navegador.js (projeto IA no app, fase 2)
 *
 * A PERGUNTA DE PRODUÇÃO do planejamento de estudos: o plano salvo no
 * aparelho com a versão nova vai para a nuvem e chega ao tablet que AINDA NÃO
 * ATUALIZOU. O que o código antigo faz com ele?
 *
 * O código antigo é o REAL: o store.js da main de antes deste ramo (1f0b839,
 * lido do histórico com git show), numa página nua (core.js, zip.js e
 * store.js, sem o app.js), com dados fictícios.
 *
 *   1. CONTROLE POSITIVO (o instrumento vê o perigo): um registro de TIPO NOVO
 *      ('planejamento'), recebido da nuvem pelo código antigo, some do
 *      documento montado e vira LÁPIDE na fila na gravação seguinte. É por
 *      isso que o plano não é um tipo novo.
 *   2. O CAMINHO ESCOLHIDO: o plano como ajuste ('ajuste:planejamento:<id>'),
 *      recebido pelo código antigo, entra no documento, sobrevive à gravação
 *      seguinte (uma aula mudada), não vira lápide nem entra na fila, e os
 *      dados continuam byte a byte.
 *   3. O CÓDIGO NOVO: o mesmo recebimento e a mesma gravação deixam o plano
 *      vivo; excluir o aluno leva os planos DELE (lápide na fila) e deixa o
 *      plano do outro aluno.
 *
 * Veneno, que TEM de reprovar a parte 3:
 *   --envenenado-cascata-deixa-plano   a exclusão do aluno não tira os planos
 *                                      dele (a linha do store.js neutralizada).
 *
 * Porta 8972. O service worker é contornado.
 */
'use strict';
const { execSync } = require('child_process');
const H = require('./_bib_navegador.js');
const R = require('./_prova_registros.js');
const { conf, secao } = H;

const PORTA = 8972;
const PAI = '1f0b839';
const VENENO = process.argv.indexOf('--envenenado-cascata-deixa-plano') >= 0;
const ANCORA_CASCATA = 'if (k.indexOf(PREFIXO_PLANEJAMENTO) === 0 && v && v.alunoId === alunoId) delete novo.ajustes[k];';

function prop(rotulo, ok) {
  if (VENENO) return conf('VENENO visto: ' + rotulo + ', e quebrou', ok, false);
  return conf(rotulo, ok, true);
}

let STORE_ANTIGO = '';
try {
  STORE_ANTIGO = execSync('git show ' + PAI + ':store.js', { cwd: H.RAIZ, maxBuffer: 1 << 26 }).toString('utf8');
} catch (e) { STORE_ANTIGO = ''; }
secao('0. As fontes');
conf('o store.js de antes (' + PAI + ') foi lido do histórico', STORE_ANTIGO.length > 100000, true);
conf('e é mesmo o de antes: não conhece o planejamento', STORE_ANTIGO.indexOf('PREFIXO_PLANEJAMENTO'), -1);
conf('a âncora da cascata está uma vez só no store.js novo', R.STORE.split(ANCORA_CASCATA).length, 2);
const STORE_NOVO = VENENO ? R.STORE.split(ANCORA_CASCATA).join('if (false) delete novo.ajustes[k];') : R.STORE;
if (VENENO) conf('o store.js servido ficou diferente do repositório (veneno)', STORE_NOVO !== R.STORE, true);

const trocas = {};
const amb = H.criarAmbiente(PORTA, 'perfil_planejamento_registro', trocas);

const PLANO = {
  alunoId: 'a1', confiancaAluno: 'alta', tratamento: 'Aluna', periodo: { inicio: '2026-11-16', fim: '2026-11-18' },
  grade: [{ data: '2026-11-16', prova: null, estudo: ['Matemática (1h)'], deManha: false },
    { data: '2026-11-17', prova: null, estudo: [], deManha: false }, { data: '2026-11-18', prova: 'Cambridge', estudo: [], deManha: true }],
  provas: [{ data: '2026-11-18', disciplina: 'Cambridge', conteudo: null, material: null, incerto: false }],
  aulaAConfirmar: [], feriados: [], observacoes: []
};
const DOC = {
  versao: 1, ajustes: { chavePix: 'chave-de-teste' }, series: [], resumos: [], pagamentos: [],
  alunos: [{ id: 'a1', nome: 'Aluna Teste Um', ativo: true, precos: [] }, { id: 'a2', nome: 'Aluno Teste Dois', ativo: true, precos: [] }],
  aulas: [{ id: 'aula1', alunoId: 'a1', serieId: null, data: '2026-11-16', hora: '11:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] }]
};
const reg = (id, tipo, dados, seg) => ({ id, tipo, dados, atualizadoEm: '2026-11-16T10:00:0' + seg + '.000Z', apagadoEm: null, aparelho: 'apOutroCelular',
  esquema: 1, servidorEm: '2026-11-16T10:00:0' + seg + '.000000Z', updateTime: '2026-11-16T10:00:0' + seg + '.000000Z', nome: 'x/registros/' + id });

/* Dentro da página: semeia, recebe, grava uma mudança, e devolve o que ficou. */
async function rodada(pag, recebidos) {
  return pag.evaluate(async (doc, chegam) => {
    await Store.salvar(doc);
    await Store.aplicarRecebidos(chegam);
    const db = await Store.carregar();
    const montadoTem = { ajuste: !!(db.ajustes && db.ajustes['planejamento:p1']), tipoNovo: JSON.stringify(db).indexOf('"p2"') >= 0 };
    db.aulas[0].notaTexto = 'mudou outra coisa';
    await Store.salvar(db);
    const regs = await Store.lerRegistros();
    const fila = await Store.lerFila();
    const r = id => { const x = regs.find(y => y.id === id); return x ? { vivo: !x.apagadoEm, dados: x.dados } : null; };
    const naFila = id => { const e = fila.find(y => y.id === id); return e ? (e.apagadoEm ? 'lapide' : 'viva') : 'fora'; };
    return { montadoTem, p1: r('ajuste:planejamento:p1'), p2: r('planejamento:p2'), filaP1: naFila('ajuste:planejamento:p1'), filaP2: naFila('planejamento:p2'),
      aulaNaFila: naFila('aula:aula1') };
  }, DOC, recebidos);
}

(async () => {
  await amb.subir();
  const dadosP1 = { id: 'p1', alunoId: 'a1', criadoEm: '2026-11-16T10:00:00.000Z', atualizadoEm: '2026-11-16T10:00:00.000Z', plano: PLANO };

  // ================================================================
  secao('1 e 2. O tablet com o código de ANTES recebe os dois formatos');
  let pag = await R.abrirPaginaNua(amb, trocas, STORE_ANTIGO);
  const antes = await rodada(pag, [
    reg('ajuste:planejamento:p1', 'ajuste', dadosP1, 1),
    reg('planejamento:p2', 'planejamento', { id: 'p2', alunoId: 'a1', plano: PLANO }, 2)
  ]);
  console.log('   ' + JSON.stringify({ montadoTem: antes.montadoTem, filaP1: antes.filaP1, filaP2: antes.filaP2, aula: antes.aulaNaFila }));
  conf('(arranjo) a gravação seguinte entrou na fila (a aula mudada)', antes.aulaNaFila, 'viva');
  conf('CONTROLE: o tipo novo não entra no documento montado pelo código antigo', antes.montadoTem.tipoNovo, false);
  conf('CONTROLE: e vira LÁPIDE na gravação seguinte (o perigo que o tipo novo traria)', [antes.p2 && antes.p2.vivo, antes.filaP2], [false, 'lapide']);
  conf('o plano como ajuste entra no documento do código antigo', antes.montadoTem.ajuste, true);
  conf('e continua VIVO depois da gravação seguinte', antes.p1 && antes.p1.vivo, true);
  conf('sem entrar na fila (nem como lápide, nem regravado)', antes.filaP1, 'fora');
  conf('com os dados byte a byte', JSON.stringify(antes.p1 && antes.p1.dados), JSON.stringify(dadosP1));
  conf('a página do código antigo não deu erro', pag.errosDePagina, []);
  await pag.close();

  // ================================================================
  secao('3. O código NOVO: o mesmo recebimento, e a exclusão do aluno');
  // o banco da parte 1 sai antes, numa página sem o Store (nada segura a conexão)
  amb.extras['/vazia.html'] = { tipo: 'text/html; charset=utf-8', corpo: '<!doctype html><title>vazia</title>' };
  const limpa = await amb.pagina();
  await limpa.setBypassServiceWorker(true);
  await limpa.goto(amb.ORIGEM + '/vazia.html');
  const apagou = await limpa.evaluate(() => new Promise(r => { const q = indexedDB.deleteDatabase('apoio-educacional');
    q.onsuccess = () => r('apagou'); q.onerror = () => r('erro'); q.onblocked = () => r('bloqueado'); }));
  conf('(arranjo) o banco da parte 1 foi apagado antes da parte 3', apagou, 'apagou');
  await limpa.close();
  pag = await R.abrirPaginaNua(amb, trocas, STORE_NOVO);
  const novo = await rodada(pag, [reg('ajuste:planejamento:p1', 'ajuste', dadosP1, 1)]);
  conf('o plano recebido entra e fica vivo depois da gravação seguinte', [novo.montadoTem.ajuste, novo.p1 && novo.p1.vivo, novo.filaP1], [true, true, 'fora']);
  const cascata = await pag.evaluate(async plano => {
    const db = await Store.carregar();
    db.ajustes['planejamento:p3'] = { id: 'p3', alunoId: 'a2', criadoEm: '2026-11-16T11:00:00.000Z', atualizadoEm: '2026-11-16T11:00:00.000Z', plano: Object.assign({}, plano, { alunoId: 'a2' }) };
    await Store.salvar(db);
    const depois = await Store.excluirAlunoEmCascata(db, 'a1');
    const regs = await Store.lerRegistros();
    const fila = await Store.lerFila();
    const vivo = id => { const x = regs.find(y => y.id === id); return x ? !x.apagadoEm : null; };
    const naFila = id => { const e = fila.find(y => y.id === id); return e ? (e.apagadoEm ? 'lapide' : 'viva') : 'fora'; };
    const carregado = await Store.carregar();
    return { p1: vivo('ajuste:planejamento:p1'), filaP1: naFila('ajuste:planejamento:p1'), p3: vivo('ajuste:planejamento:p3'),
      noDoc: Object.keys(carregado.ajustes).filter(k => k.indexOf('planejamento:') === 0).sort(), devolvido: !!depois };
  }, PLANO);
  console.log('   ' + JSON.stringify(cascata));
  prop('excluir o aluno leva o plano dele: lápide no registro e na fila', cascata.p1 === false && cascata.filaP1 === 'lapide');
  prop('no documento fica só o plano do outro aluno', JSON.stringify(cascata.noDoc) === JSON.stringify(['planejamento:p3']));
  conf('o plano do outro aluno continua vivo', cascata.p3, true);
  conf('a página do código novo não deu erro', pag.errosDePagina, []);
  await pag.close();
  if (VENENO) throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true });
})().then(() => H.fim(amb)(), H.fim(amb));
