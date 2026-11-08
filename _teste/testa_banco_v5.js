/* testa_banco_v5.js
 *
 * N1 (fase 1 da nuvem), fatia 1: o banco por registro e a subida de 4 para 5.
 *
 * O que prova, numa página nua (core.js, zip.js, store.js; sem o app.js, para
 * nenhuma gravação do aplicativo entrar na conta):
 *
 *   1. A SUBIDA 4 PARA 5 NÃO PERDE NADA. O banco é montado pelo código REAL
 *      da versão 4 (_store_v4_historico.js, o store.js de 016eef5), com dados
 *      fictícios em todo depósito que é dela. O código novo abre: versão 5,
 *      os depósitos `registros` e `controle` existem, as contagens dos
 *      depósitos de antes são as mesmas, `principal` está intacto, há um
 *      registro vivo por item (com os seis campos), e `carregar()` devolve o
 *      mesmo documento, campo a campo, na mesma ordem.
 *   2. O SALVAR GRAVA SÓ A DIFERENÇA, medido POR FORA, por um espião em
 *      IDBObjectStore.prototype.put no depósito `registros`: salvar sem mudar
 *      nada grava zero; mudar uma aula grava um; apagar uma aula grava uma
 *      lápide (dados null); criar um aluno e um ajuste grava dois; o item que
 *      volta depois de apagado revive o registro. O `principal` é gravado em
 *      toda chamada (é o retrato que o código antigo lê).
 *   3. IDA E VOLTA: depois de todas as edições, `carregar()` é igual ao
 *      documento em memória, e o documento montado dos registros é igual ao
 *      `carregar()`.
 *   4. `principal` GRAVADO POR FORA (como o código antigo faria depois de um
 *      rollback) vence na abertura seguinte: `carregar()` devolve o que foi
 *      semeado e os registros são refeitos.
 *   5. OS OUTROS CAMINHOS QUE GRAVAM O DOCUMENTO deixam registros e
 *      `principal` iguais: desfazer, excluirAlunoEmCascata, importarTudo (com
 *      o carimbo da cópia) e apagarTudo (tudo vira lápide, o aparelho fica).
 *   6. A LISTA DOS AJUSTES DO APARELHO existe e tem os cinco esperados.
 *   7. O aplicativo abre depois de tudo, sem erro de página.
 *
 * Venenos, que TÊM de reprovar a propriedade (a rodada passa quando a prova VÊ
 * o veneno):
 *   --envenenado-perde-registro  a migração (e toda gravação) deixa o último
 *                                item de cada vetor de fora: a contagem e a ida
 *                                e volta da parte 1 têm de acusar.
 *   --envenenado-regrava-tudo    a comparação diz sempre "mudou": o salvar sem
 *                                mudança grava tudo, e a parte 2 tem de acusar.
 *
 * Porta 8842. O service worker é contornado.
 */
'use strict';
const H = require('./_bib_navegador.js');
const R = require('./_prova_registros.js');
const { conf, secao, pausa } = H;

const PORTA = 8842;
const MODO = Object.keys(R.VENENOS).filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const PERDE = '--envenenado-perde-registro';
const REGRAVA = '--envenenado-regrava-tudo';

/* A propriedade de cada veneno: no modo dele, a prova tem de vê-la quebrada. */
function prop(rotulo, ok, veneno) {
  if (MODO && [].concat(veneno).indexOf(MODO) >= 0) return conf('VENENO visto: ' + rotulo + ', e quebrou', ok, false);
  return conf(rotulo, ok, true);
}

secao('0. As âncoras e o veneno');
R.conferirAncoras(conf);
const STORE_SERVIDO = R.storeEnvenenado(MODO);
if (MODO) conf('o store.js servido ficou diferente do repositório (' + MODO + ')', STORE_SERVIDO !== R.STORE, true);

const trocas = {};
const amb = H.criarAmbiente(PORTA, 'perfil_banco_v5', trocas);

/* O documento fictício da parte 1: três alunas, duas séries, 40 aulas (as de
 * série com o id determinístico), dois resumos, dois pagamentos e ajustes de
 * ambos os lados da lista (do aparelho e dela). */
const DOCUMENTO = function () {
  const d = { versao: 1, alunos: [], series: [], aulas: [], resumos: [], ajustes: {}, pagamentos: [] };
  d.alunos = [1, 2, 3].map(k => ({ id: 'a' + k, nome: 'Aluna Teste ' + k, responsavel: 'Resp. ' + k, cor: '#2E7D6B', ativo: true,
    precos: [{ id: 'p' + k, inicio: '2026-01-01', fim: null, valorHora: 100 }], mapeamentos: [], obs: '' }));
  d.series = [{ id: 's1', alunoId: 'a1', dias: [1, 3], hora: '10:00', duracaoMin: 60, inicio: '2026-06-01', fim: '2026-06-30', exclusoes: [], materializadoAte: '2026-06' },
    { id: 's2', alunoId: 'a2', dias: [2], hora: '14:00', duracaoMin: 90, inicio: '2026-06-01', fim: '2026-06-30', exclusoes: [], materializadoAte: '2026-06' }];
  for (let k = 0; k < 40; k++) {
    const serie = k < 9 ? 's1' : (k < 13 ? 's2' : null);
    const data = '2026-06-' + String(1 + (k % 28)).padStart(2, '0');
    d.aulas.push({ id: serie ? serie + '@' + data : 'aula' + k, alunoId: 'a' + (1 + k % 3), serieId: serie, destacada: false, data,
      hora: '10:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: k === 3 ? 'nota da aula' : '', notaPrivada: '',
      nota: null, anexos: [], temas: [], areas: [] });
  }
  d.resumos = [{ alunoId: 'a1', mes: '2026-06', texto: 'Resumo de junho' }, { alunoId: 'a2', mes: '2026-06', texto: 'Outro resumo' }];
  d.pagamentos = [{ id: 'pg1', alunoId: 'a1', mes: '2026-05', pagoEm: '2026-06-02', valor: 400 }, { id: 'pg2', alunoId: 'a2', mes: '2026-05', pagoEm: '2026-06-03', valor: 300 }];
  d.ajustes = { versaoVista: '9.9.9', valoresOcultos: false, chavePix: 'chave-de-teste', titulosFechamento: { padrao: 'Fechamento' }, cargaInicial: true };
  return d;
};
const ITENS_DO_DOCUMENTO = 3 + 2 + 40 + 2 + 2 + 5 + 1; // alunos, séries, aulas, resumos, pagamentos, ajustes, raiz:versao

(async () => {
  await amb.subir();

  // ================================================================
  secao('1. A subida de 4 para 5 não perde nada (o código de antes é o real)');
  let pag = await R.abrirPaginaNua(amb, trocas, R.STORE_V4);
  const v4 = await pag.evaluate(() => window.__prova.versaoEDepositos());
  conf('o banco montado pelo código de antes está na versão 4', v4 && v4.versao, 4);
  conf('e não tem registros nem controle', v4 && v4.depositos.filter(d => d === 'registros' || d === 'controle').length, 0);
  const antes = await pag.evaluate(async (montar) => {
    const d = (new Function('return (' + montar + ')()'))();
    await Store.salvar(d);
    await Store.salvarNota('s1@2026-06-03', { paginas: [{ itens: [] }] });
    await Store.registrarUsoBiblioteca({ itemId: 'x:1', alunoId: 'a1', aulaId: 's1@2026-06-03', data: '2026-06-03' });
    await Store.gravarEtiquetaBiblioteca({ itemId: 'x:1', dificuldade: 2, data: '2026-06-03' });
    await Store.gravarListaBiblioteca({ id: 'l1', titulo: 'Lista de prova', nivel: null, itens: ['x:1'], paginas: [], criadaEm: 1, editadaEm: 1 });
    await Store.registrarHistorico('ponto de prova', d);
    const P = window.__prova;
    const principal = await P.principalPorFora();
    return { depositos: await P.contagensDosDepositos(), canon: P.canon(principal), ordem: P.ordem(principal),
      contagens: P.contagens(principal) };
  }, DOCUMENTO.toString());
  console.log('   contagens de antes: ' + JSON.stringify(antes.contagens));
  conf('o código de antes gravou o documento inteiro em principal', antes.contagens.aulas, 40);
  await pag.close();

  pag = await R.abrirPaginaNua(amb, trocas, STORE_SERVIDO);
  const v5 = await pag.evaluate(() => window.__prova.versaoEDepositos());
  conf('o código novo subiu o banco para a versão 6 (registros, controle e a fila da fatia 2)', v5 && v5.versao, 6);
  conf('com os depósitos registros e controle', v5 && v5.depositos.filter(d => d === 'registros' || d === 'controle').join(','), 'controle,registros');
  const depois = await pag.evaluate(async () => {
    const P = window.__prova;
    const principal = await P.principalPorFora();
    const registros = await P.registrosPorFora();
    const carregado = await Store.carregar();
    return { depositos: await P.contagensDosDepositos(), canonPrincipal: P.canon(principal), canonCarregado: P.canon(carregado),
      ordem: P.ordem(carregado), registros: P.resumoDosRegistros(registros), aparelho: Store.aparelho() };
  });
  const chavesDeAntes = Object.keys(antes.depositos).sort();
  conf('as contagens dos depósitos de antes, um a um, são as de depois',
    chavesDeAntes.map(k => k + '=' + antes.depositos[k]).join(' '), chavesDeAntes.map(k => k + '=' + depois.depositos[k]).join(' '));
  conf('o principal não foi tocado pela migração', depois.canonPrincipal === antes.canon, true);
  prop('há um registro vivo por item do documento (' + ITENS_DO_DOCUMENTO + ')', depois.registros.vivos === ITENS_DO_DOCUMENTO, PERDE);
  conf('nenhuma lápide na migração', depois.registros.lapides, 0);
  conf('todo registro tem id, tipo, atualizadoEm, apagadoEm, aparelho, esquema e ordem', depois.registros.campos, true);
  prop('registros por tipo: 5 ajustes, 3 alunas, 40 aulas, 2 pagamentos, 1 raiz, 2 resumos, 2 séries',
    JSON.stringify(depois.registros.porTipo) === JSON.stringify({ ajuste: 5, aluno: 3, aula: 40, pagamento: 2, raiz: 1, resumo: 2, serie: 2 }), PERDE);
  conf('o controle tem o aparelho e o retrato', depois.depositos.controle, 2);
  conf('o Store sabe o id deste aparelho depois de carregar', /^ap[0-9a-f]{12}$/.test(depois.aparelho || ''), true);
  prop('carregar() depois da migração é o documento de antes, campo a campo', depois.canonCarregado === antes.canon, PERDE);
  prop('e todo vetor e as chaves de ajustes vêm na mesma ordem', depois.ordem === antes.ordem, PERDE);
  console.log('   registros: ' + JSON.stringify(depois.registros));
  if (MODO === PERDE) throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });

  // ================================================================
  secao('2. O salvar grava só a diferença (medido por fora, no depósito registros)');
  const dif = await pag.evaluate(async () => {
    const P = window.__prova;
    const saida = {};
    const db = await Store.carregar();
    P.zerarPuts();
    await Store.salvar(db);
    saida.semMudanca = { registros: P.puts.registros.length, dados: P.puts.dados, contas: Store.ultimaGravacao() };
    const aula = db.aulas.find(a => a.id === 's1@2026-06-03');
    aula.notaTexto = 'mudou a nota';
    P.zerarPuts();
    await Store.salvar(db);
    saida.umaAula = { registros: P.puts.registros.slice(), dados: P.puts.dados };
    const removida = db.aulas.find(a => a.id === 'aula20');
    db.aulas = db.aulas.filter(a => a.id !== 'aula20');
    P.zerarPuts();
    await Store.salvar(db);
    const regs = await Store.lerRegistros();
    const lapide = regs.find(r => r.id === 'aula:aula20');
    saida.apagada = { registros: P.puts.registros.slice(), lapide: lapide ? { apagadoEm: typeof lapide.apagadoEm, dados: lapide.dados } : null,
      aulasCarregadas: (await Store.carregar()).aulas.length };
    db.alunos.push({ id: 'a4', nome: 'Aluna Teste 4', ativo: true, precos: [] });
    db.ajustes.esconderNaoCobradas = true;
    P.zerarPuts();
    await Store.salvar(db);
    saida.novos = P.puts.registros.slice().sort();
    db.aulas.push(removida);
    P.zerarPuts();
    await Store.salvar(db);
    const revivida = (await Store.lerRegistros()).find(r => r.id === 'aula:aula20');
    saida.revivida = { registros: P.puts.registros.slice(), viva: !!revivida && !revivida.apagadoEm && !!revivida.dados,
      ordem: P.ordem(await Store.carregar()) === P.ordem(db) };
    // encaixada no MEIO do vetor: só ela é gravada, e o carregar devolve a ordem do documento
    db.aulas.splice(5, 0, { id: 'aulaMeio', alunoId: 'a1', serieId: null, data: '2026-06-15', hora: '08:00', duracaoMin: 60,
      status: 'realizada', cobravel: true, notaTexto: '', anexos: [] });
    P.zerarPuts();
    await Store.salvar(db);
    saida.noMeio = { registros: P.puts.registros.slice(), ordem: P.ordem(await Store.carregar()) === P.ordem(db) };
    // a última aula vai para a frente: um registro, e a ordem continua a do documento
    db.aulas.unshift(db.aulas.pop());
    P.zerarPuts();
    await Store.salvar(db);
    saida.movida = { registros: P.puts.registros.slice(), ordem: P.ordem(await Store.carregar()) === P.ordem(db) };
    const regs2 = await Store.lerRegistros();
    const carregado = await Store.carregar();
    const montado = Store.montarRegistros(regs2);
    saida.idaEVolta = P.canon(carregado) === P.canon(db);
    saida.ordemFinal = P.ordem(carregado) === P.ordem(db);
    saida.montadoIgual = P.canon(montado) === P.canon(carregado) && P.ordem(montado) === P.ordem(carregado);
    saida.atualizadoEmIso = regs2.every(r => !isNaN(new Date(r.atualizadoEm).getTime()));
    return saida;
  });
  prop('salvar sem mudança não grava registro nenhum', dif.semMudanca.registros === 0, REGRAVA);
  conf('mas grava o principal (o retrato que o código antigo lê)', dif.semMudanca.dados, 1);
  conf('e as contas do Store dizem o mesmo', JSON.stringify(dif.semMudanca.contas && { g: dif.semMudanca.contas.gravados, l: dif.semMudanca.contas.lapides }),
    JSON.stringify(MODO === REGRAVA ? { g: ITENS_DO_DOCUMENTO, l: 0 } : { g: 0, l: 0 }));
  prop('mudar uma aula grava exatamente um registro, o dela', dif.umaAula.registros.join(',') === 'aula:s1@2026-06-03', REGRAVA);
  prop('apagar uma aula grava exatamente uma lápide', dif.apagada.registros.join(',') === 'aula:aula20', REGRAVA);
  conf('a lápide tem apagadoEm e dados null', JSON.stringify(dif.apagada.lapide), JSON.stringify({ apagadoEm: 'string', dados: null }));
  conf('e carregar() não a devolve', dif.apagada.aulasCarregadas, 39);
  prop('criar uma aluna e um ajuste grava exatamente dois', dif.novos.join(',') === 'ajuste:esconderNaoCobradas,aluno:a4', REGRAVA);
  prop('a aula que volta revive o registro (um put, vivo, no fim do vetor como no documento)',
    dif.revivida.registros.join(',') === 'aula:aula20' && dif.revivida.viva && dif.revivida.ordem, REGRAVA);
  prop('uma aula encaixada no meio do vetor grava só ela, e a ordem devolvida é a do documento',
    dif.noMeio.registros.join(',') === 'aula:aulaMeio' && dif.noMeio.ordem, REGRAVA);
  prop('a última aula movida para a frente grava só ela, e a ordem devolvida é a do documento',
    dif.movida.registros.join(',') === 'aula:aula20' && dif.movida.ordem, REGRAVA);
  if (MODO === REGRAVA) throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });

  // ================================================================
  secao('2b. Aula de série excluída e reaberta na mesma data nasce limpa; o Desfazer traz a antiga de volta');
  const reaberta = await pag.evaluate(async () => {
    const P = window.__prova;
    const db = await Store.carregar();
    const ANTIGA = 's1@2026-06-03';
    await Store.salvarNota(ANTIGA, { paginas: [{ itens: [{ t: 'texto', texto: 'folha da aula antiga' }] }] });
    await Store.registrarUsoBiblioteca({ itemId: 'x:9', alunoId: 'a1', aulaId: ANTIGA, data: '2026-06-03' });
    await Store.registrarHistorico('antes de excluir', db);
    const excluidas = Core.excluirAulas(db, ANTIGA, 'esta');
    await Store.salvar(db);
    const serie = db.series.find(s => s.id === 's1');
    const excluida = (serie.exclusoes || []).indexOf('2026-06-03') >= 0 && !db.aulas.some(a => a.id === ANTIGA);
    // reabrir: mudar o padrão desta em diante solta as exclusões a partir do corte, e a data volta a ser materializada
    Core.editarSerie(db, 's1', { hora: '11:00' }, '2026-06-01');
    await Store.salvar(db);
    const nova = db.aulas.find(a => a.serieId === 's1' && a.data === '2026-06-03');
    const notaDaNova = nova ? await Store.lerNota(nova.id) : 'sem aula';
    const usoDaNova = nova ? (await Store.usoDaBiblioteca()).filter(u => u.aulaId === nova.id).length : -1;
    const ponto = (await Store.listarHistorico()).find(h => h.rotulo === 'antes de excluir');
    const voltou = await Store.desfazer(ponto.id);
    const notaDaAntiga = await Store.lerNota(ANTIGA);
    return { excluidas, excluida, novaId: nova ? nova.id : null, notaDaNova, usoDaNova, reaberturas: JSON.stringify(serie.reaberturas || null),
      antigaVoltou: voltou.aulas.some(a => a.id === ANTIGA), notaDaAntiga: notaDaAntiga ? notaDaAntiga.paginas[0].itens[0].texto : null,
      ordemDepoisDoDesfazer: P.ordem(await Store.carregar()) === P.ordem(voltou) };
  });
  conf('a aula foi excluída e a data ficou nas exclusões da série', reaberta.excluidas + '/' + reaberta.excluida, '1/true');
  conf('reaberta na mesma data, a aula nasce com outro id, determinístico', reaberta.novaId, 's1@2026-06-03+r1');
  conf('e a série guarda a reabertura', reaberta.reaberturas, '{"2026-06-03":1}');
  conf('a aula nova não herda a folha da antiga', reaberta.notaDaNova, null);
  conf('nem o uso da biblioteca', reaberta.usoDaNova, 0);
  conf('o Desfazer traz a aula antiga de volta, com o id antigo', reaberta.antigaVoltou, true);
  conf('e a folha dela continua lá', reaberta.notaDaAntiga, 'folha da aula antiga');
  conf('o carregar depois do Desfazer devolve a ordem do ponto', reaberta.ordemDepoisDoDesfazer, true);

  secao('3. Ida e volta');
  conf('carregar() é o documento em memória, campo a campo', dif.idaEVolta, true);
  conf('e na mesma ordem', dif.ordemFinal, true);
  conf('o documento montado dos registros é o carregar(), na mesma ordem', dif.montadoIgual, true);
  conf('todo atualizadoEm é uma data ISO', dif.atualizadoEmIso, true);

  // ================================================================
  secao('4. O principal gravado por fora vence na abertura seguinte');
  const semeado = await pag.evaluate(async () => {
    const P = window.__prova;
    const principal = await P.principalPorFora();
    principal.aulas.find(a => a.id === 'aula21').notaTexto = 'semeada por fora';
    principal.alunos.push({ id: 'a5', nome: 'Aluna Semeada Teste', ativo: true, precos: [] });
    await P.semearPrincipal(principal);
    return { canon: P.canon(principal), ordem: P.ordem(principal) };
  });
  await pag.close();
  pag = await R.abrirPaginaNua(amb, trocas, STORE_SERVIDO);
  const reconciliado = await pag.evaluate(async () => {
    const P = window.__prova;
    P.zerarPuts();
    const carregado = await Store.carregar();
    const puts = P.puts.registros.slice().sort();
    const regs = await Store.lerRegistros();
    const montado = Store.montarRegistros(regs);
    P.zerarPuts();
    const deNovo = await Store.carregar();
    return { canon: P.canon(carregado), ordem: P.ordem(carregado), puts, montadoIgual: P.canon(montado) === P.canon(carregado),
      putsNaSegunda: P.puts.registros.length, canonDeNovo: P.canon(deNovo) };
  });
  conf('carregar() devolve o que foi semeado', reconciliado.canon === semeado.canon, true);
  conf('na ordem do principal semeado', reconciliado.ordem === semeado.ordem, true);
  conf('e refez só os registros que mudaram', reconciliado.puts.join(','), 'aluno:a5,aula:aula21');
  conf('os registros montados são o carregar()', reconciliado.montadoIgual, true);
  conf('a abertura seguinte não grava nada', reconciliado.putsNaSegunda, 0);
  conf('e devolve o mesmo', reconciliado.canonDeNovo === semeado.canon, true);

  // ================================================================
  secao('5. Os outros caminhos que gravam o documento');
  const outros = await pag.evaluate(async () => {
    const P = window.__prova;
    const saida = {};
    const iguais = async (db) => {
      const carregado = await Store.carregar();
      const regs = await Store.lerRegistros();
      const principal = await P.principalPorFora();
      return P.canon(carregado) === P.canon(db) && P.ordem(carregado) === P.ordem(db) &&
        P.canon(Store.montarRegistros(regs)) === P.canon(db) && P.canon(principal) === P.canon(db);
    };
    // desfazer
    let db = await Store.carregar();
    const antesDoPonto = JSON.parse(JSON.stringify(db));
    await Store.registrarHistorico('antes da prova', db);
    db.aulas.find(a => a.id === 'aula22').status = 'cancelada';
    db.alunos = db.alunos.filter(a => a.id !== 'a5');
    await Store.salvar(db);
    const ponto = (await Store.listarHistorico()).find(h => h.rotulo === 'antes da prova');
    P.zerarPuts();
    const voltou = await Store.desfazer(ponto.id);
    saida.desfazer = { iguais: await iguais(antesDoPonto), devolveu: P.canon(voltou) === P.canon(antesDoPonto), puts: P.puts.registros.slice().sort() };
    // excluir aluna em cascata
    db = await Store.carregar();
    const idsDaA3 = { 'aluno:a3': true };
    db.aulas.filter(a => a.alunoId === 'a3').forEach(a => { idsDaA3['aula:' + a.id] = true; });
    const aulasDaA3 = Object.keys(idsDaA3).length - 1;
    P.zerarPuts();
    const novo = await Store.excluirAlunoEmCascata(db, 'a3');
    const regs = await Store.lerRegistros();
    // só os registros dela: as lápides da seção 2b (aulas que o Desfazer tirou de volta) não contam aqui
    saida.cascata = { iguais: await iguais(novo), aulasDaA3, lapides: regs.filter(r => r.apagadoEm && idsDaA3[r.id]).length,
      puts: P.puts.registros.length, alunaFora: !novo.alunos.some(a => a.id === 'a3') };
    // importarTudo com o carimbo da cópia
    const pacote = { formato: 'apoio-educacional', versao: 1, quando: '2026-06-01T12:00:00.000Z',
      dados: { versao: 1, alunos: [{ id: 'b1', nome: 'Aluna Restaurada Teste', ativo: true, precos: [] }], series: [],
        aulas: [{ id: 'r1', alunoId: 'b1', data: '2026-06-02', hora: '09:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] }],
        resumos: [], ajustes: { chavePix: 'outra' } },
      notas: {}, midias: {}, anexos: {} };
    const vivosAntes = (await Store.lerRegistros()).filter(r => !r.apagadoEm).length;
    P.zerarPuts();
    const restaurado = await Store.importarTudo(pacote);
    const regs3 = await Store.lerRegistros();
    const vivos = regs3.filter(r => !r.apagadoEm);
    const CARIMBO = '2026-06-01T12:00:00.000Z';
    /* raiz:versao é igual nos dois lados e não é regravado: fica com o carimbo
     * de antes. ajuste:chavePix existe nos dois e muda: continua vivo. Tudo o
     * mais que estava vivo e não está na cópia vira lápide com o carimbo da
     * cópia: vivosAntes menos esses dois. */
    saida.restaurar = { iguais: await iguais(restaurado), vivos: vivos.length,
      carimbo: vivos.filter(r => r.id !== 'raiz:versao').every(r => r.atualizadoEm === CARIMBO),
      lapidesComCarimbo: regs3.filter(r => r.apagadoEm === CARIMBO).length === vivosAntes - 2,
      detalhe: { vivosAntes, lapidesComCarimbo: regs3.filter(r => r.apagadoEm === CARIMBO).length,
        vivosSemCarimbo: vivos.filter(r => r.atualizadoEm !== CARIMBO).map(r => r.id) },
      pagamentosVazio: Array.isArray(restaurado.pagamentos) && restaurado.pagamentos.length === 0 };
    // apagar tudo
    const aparelhoAntes = Store.aparelho();
    await Store.apagarTudo();
    const regs4 = await Store.lerRegistros();
    const principal = await P.principalPorFora();
    saida.apagarTudo = { carregar: await Store.carregar(), vivos: regs4.filter(r => !r.apagadoEm).length, lapides: regs4.filter(r => !!r.apagadoEm).length,
      principal, controle: (await P.contagensDosDepositos()).controle, aparelhoIgual: Store.aparelho() === aparelhoAntes };
    // e o salvar seguinte recomeça
    const vazio = Store.bancoVazio();
    vazio.alunos.push({ id: 'c1', nome: 'Aluna Nova Teste', ativo: true, precos: [] });
    P.zerarPuts();
    await Store.salvar(vazio);
    saida.recomeco = { puts: P.puts.registros.slice().sort(), iguais: await iguais(vazio) };
    return saida;
  });
  conf('desfazer: carregar, registros e principal voltam ao ponto', outros.desfazer.iguais && outros.desfazer.devolveu, true);
  conf('desfazer gravou só o que o ponto desfez (a aula e a aluna que voltou)', outros.desfazer.puts.join(','), 'aluno:a5,aula:aula22');
  conf('excluir aluna em cascata: carregar, registros e principal iguais, e a aluna saiu', outros.cascata.iguais && outros.cascata.alunaFora, true);
  conf('com uma lápide para a aluna e uma por aula dela', outros.cascata.lapides, 1 + outros.cascata.aulasDaA3);
  conf('e nenhum registro além desses', outros.cascata.puts, 1 + outros.cascata.aulasDaA3);
  conf('restaurar a cópia: carregar, registros e principal iguais à cópia', outros.restaurar.iguais, true);
  conf('os registros vivos são os da cópia (aluna, aula, ajuste, versao)', outros.restaurar.vivos, 4);
  conf('carimbados com o quando da cópia, e não com agora', outros.restaurar.carimbo, true);
  conf('e o que saiu virou lápide com o mesmo carimbo', outros.restaurar.lapidesComCarimbo, true);
  console.log('   restauração: ' + JSON.stringify(outros.restaurar.detalhe));
  conf('a cópia sem pagamentos lê com a lista vazia', outros.restaurar.pagamentosVazio, true);
  conf('apagar tudo: carregar() volta null', outros.apagarTudo.carregar, null);
  conf('nenhum registro vivo, e os de antes viraram lápide', outros.apagarTudo.vivos + '/' + (outros.apagarTudo.lapides > 0), '0/true');
  // em controle ficam o aparelho e a marca da sincronização desligada (fatia 3)
  conf('o principal saiu; ficaram o aparelho e a marca da sincronização desligada', (outros.apagarTudo.principal === null) + '/' + outros.apagarTudo.controle + '/' + outros.apagarTudo.aparelhoIgual, 'true/2/true');
  conf('o salvar seguinte grava os itens novos (aluna e versao)', outros.recomeco.puts.join(','), 'aluno:c1,raiz:versao');
  conf('e fica consistente', outros.recomeco.iguais, true);

  // ================================================================
  secao('5b. A restauração vinda da nuvem: no aparelho que escreve enfileira tudo o que está vivo; no que só lê, nada');
  const restauroDaNuvem = await pag.evaluate(async () => {
    const pacote = () => ({ formato: 'apoio-educacional', versao: 1, quando: '2026-06-02T12:00:00.000Z',
      dados: { versao: 1, alunos: [{ id: 'd1', nome: 'Aluna Da Nuvem Teste', ativo: true, precos: [] }], series: [],
        aulas: [{ id: 's7@2026-06-02', alunoId: 'd1', serieId: 's7', data: '2026-06-02', hora: '09:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] }],
        resumos: [], ajustes: { chavePix: 'pix-da-nuvem', versaoVista: '7.7.7' } }, notas: {}, midias: {}, anexos: {} });
    // o tablet novo, em tela larga: dono do que restaurou
    await Store.importarTudo(pacote(), { daNuvem: true });
    const filaDono = (await Store.lerFila()).map(e => e.id).sort();
    const vivos = (await Store.lerRegistros()).filter(r => !r.apagadoEm && Store.sincronizavel(r.id, r.tipo)).map(r => r.id).sort();
    // o celular só leitura: a mesma restauração, nada entra na fila
    await Store.confirmarEnvio((await Store.lerFila()).map(e => ({ id: e.id, atualizadoEm: e.atualizadoEm })));
    Store.somenteLeitura(true);
    let recusouEdicao = false;
    try { await Store.salvar(await Store.carregar()); } catch (e) { recusouEdicao = !!(e && e.soLeitura); }
    await Store.importarTudo(pacote(), { daNuvem: true });
    const filaCelular = (await Store.lerFila()).length;
    Store.somenteLeitura(false);
    return { filaDono, vivos, filaCelular, recusouEdicao };
  });
  // (a fila leva também a lápide do que a restauração tirou, aluno:c1: a nuvem precisa saber que saiu)
  prop('no aparelho que escreve, a restauração enfileira todo registro vivo sincronizável (' + restauroDaNuvem.vivos.length + ')',
    restauroDaNuvem.vivos.every(id => restauroDaNuvem.filaDono.indexOf(id) >= 0) && restauroDaNuvem.vivos.length === 3, '--envenenado-restauro-sem-fila');
  prop('e a lápide do que a restauração tirou', restauroDaNuvem.filaDono.indexOf('aluno:c1') >= 0, '--envenenado-restauro-sem-fila');
  conf('a trava do só leitura recusa a edição comum (controle)', restauroDaNuvem.recusouEdicao, true);
  conf('no aparelho que só lê, a mesma restauração não enfileira nada', restauroDaNuvem.filaCelular, 0);
  if (MODO === '--envenenado-restauro-sem-fila') throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });

  // ================================================================
  secao('6. A lista dos ajustes do aparelho');
  const lista = await pag.evaluate(() => Store.AJUSTES_DO_APARELHO.slice().sort().join(','));
  conf('são cinco, explícitos', lista, 'ibge,painelValoresAberto,ultimaCopia,valoresOcultos,versaoVista');
  const errosNua = pag.errosDePagina.slice();
  await pag.close();

  // ================================================================
  secao('7. O aplicativo abre depois de tudo');
  const app = await amb.pagina();
  await app.setBypassServiceWorker(true);
  await H.abrirApp(app, amb.ORIGEM);
  await pausa(1500);
  const noApp = await app.evaluate(async () => {
    const d = await Store.carregar();
    const regs = await Store.lerRegistros();
    return { alunos: d ? d.alunos.length : -1, vivos: regs.filter(r => !r.apagadoEm).length, versao: (document.querySelector('#versao-app') || {}).textContent || '' };
  });
  conf('o aplicativo abriu e tem alunos', noApp.alunos > 0, true);
  conf('e o que ele gravou está nos registros', noApp.vivos > 0, true);
  conf('nenhum erro de página', (errosNua.concat(app.errosDePagina)).join(' | '), '');
})().then(() => H.fim(amb)(), e => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e)));
