/* _prova_migracao_copias_reais.js
 *
 * N1, fatia 1: a migração 4 para 5 sobre as CÓPIAS REAIS de segurança dela,
 * lidas de onde estão (Aplicativo\Backups no Drive), por caminho. Fora do
 * portão, de propósito: as cópias têm dados de crianças, só existem nesta
 * máquina, e nada delas pode ir ao repositório. Esta prova só imprime
 * CONTAGENS e resultados verdadeiro ou falso; nenhum campo é impresso.
 *
 * Para cada cópia:
 *   1. o código REAL da versão 4 (_store_v4_historico.js) restaura a cópia
 *      num banco limpo (Store.importarTudo, como o aplicativo faria);
 *   2. a régua de junho é medida: quantos alunos têm, em junho de 2026,
 *      10 encontros, 630 minutos e R$ 1.050,00 (o caso de referência da
 *      carga inicial), e quais ids;
 *   3. o código novo abre: versão 5, migração dentro da transação de versão;
 *      `carregar()` tem de ser igual aos dados da cópia, campo a campo (forma
 *      canônica), com a mesma ordem das aulas; um registro vivo por item;
 *      `principal` intacto;
 *   4. a régua de junho dá o mesmo resultado, nos mesmos ids;
 *   5. ida e volta: `salvar(carregar())` não grava registro nenhum e
 *      `carregar()` continua igual; o documento montado dos registros é o
 *      `carregar()`.
 *
 * Uso: node _teste/_prova_migracao_copias_reais.js [pasta ou arquivo .json]
 * Sem argumento, a pasta é H:\My Drive\Vida Pessoal\Família\Material pra
 * Nath\Aplicativo\Backups. Porta 8843.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador.js');
const R = require('./_prova_registros.js');
const { conf, secao } = H;

const PORTA = 8843;
const ORIGEM = process.argv[2] || 'H:\\My Drive\\Vida Pessoal\\Família\\Material pra Nath\\Aplicativo\\Backups';

function arquivos() {
  const st = fs.statSync(ORIGEM);
  if (st.isFile()) return [ORIGEM];
  return fs.readdirSync(ORIGEM).filter(n => /\.json$/i.test(n)).sort().map(n => path.join(ORIGEM, n));
}

secao('0. As âncoras');
R.conferirAncoras(conf);
const lista = arquivos();
conf('há cópias reais para ler em ' + ORIGEM, lista.length > 0, true);

const trocas = {};
const amb = H.criarAmbiente(PORTA, 'perfil_copias_reais', trocas);

/* Apaga o banco inteiro entre uma cópia e outra. */
async function apagarBanco(pag) {
  await pag.evaluate(() => new Promise(res => {
    const q = indexedDB.deleteDatabase('apoio-educacional');
    q.onsuccess = q.onerror = q.onblocked = () => res();
  }));
}

(async () => {
  await amb.subir();
  for (const arquivo of lista) {
    const nome = path.basename(arquivo);
    secao('Cópia ' + nome + ' (' + fs.statSync(arquivo).size + ' bytes)');
    const texto = fs.readFileSync(arquivo, 'utf8');
    let pacote;
    try { pacote = JSON.parse(texto); } catch (e) { conf('a cópia é JSON válido', 'não', 'sim'); continue; }
    conf('formato apoio-educacional', pacote.formato, 'apoio-educacional');
    // servida da memória, nunca gravada no repositório
    amb.extras['/copia.json'] = { tipo: 'application/json; charset=utf-8', corpo: texto };

    // 1. o código real da versão 4 restaura a cópia
    let pag = await R.abrirPaginaNua(amb, trocas, R.STORE_V4);
    await apagarBanco(pag);
    await pag.close();
    pag = await R.abrirPaginaNua(amb, trocas, R.STORE_V4);
    const antes = await pag.evaluate(async () => {
      const P = window.__prova;
      const p = await (await fetch('/copia.json')).json();
      await Store.importarTudo(p);
      const v = await P.versaoEDepositos();
      const principal = await P.principalPorFora();
      const carregado = await Store.carregar();
      return { versao: v.versao, depositos: await P.contagensDosDepositos(), canon: P.canon(principal), canonCarregado: P.canon(carregado),
        ordem: P.ordem(principal), contagens: P.contagens(carregado), regua: P.regua(carregado),
        notas: Object.keys(p.notas || {}).length, anexos: Object.keys(p.anexos || {}).length };
    });
    conf('o código de antes deixou o banco na versão 4', antes.versao, 4);
    console.log('   contagens: ' + JSON.stringify(antes.contagens) + ', notas ' + antes.notas + ', anexos ' + antes.anexos);
    /* A régua: 10 encontros e 10:30 valem em toda cópia; R$ 1.050,00 só onde a
     * vigência do preço do aluno de referência cobre junho (na cópia de 30/08;
     * nas seguintes ela mudou o início da vigência para agosto, e junho fecha
     * sem preço). A exigência da migração é que o resultado seja o MESMO
     * antes e depois; o valor é dito em números. */
    console.log('   régua de junho (10 encontros, 10:30): ' + antes.regua.quantos + ' aluno(s), ' + antes.regua.com1050 + ' com R$ 1.050,00; ' +
      antes.regua.casos.map(c => c.horas + ' R$ ' + c.valor.toFixed(2)).join(' | '));
    conf('a régua de junho encontra o caso de referência (10 encontros, 10:30) na cópia', antes.regua.quantos >= 1, true);
    delete amb.extras['/copia.json'];
    await pag.close();

    // 3. o código novo migra
    pag = await R.abrirPaginaNua(amb, trocas, R.STORE);
    const depois = await pag.evaluate(async () => {
      const P = window.__prova;
      const v = await P.versaoEDepositos();
      const principal = await P.principalPorFora();
      const registros = await P.registrosPorFora();
      const carregado = await Store.carregar();
      const resumo = P.resumoDosRegistros(registros);
      // 5. ida e volta
      P.zerarPuts();
      await Store.salvar(carregado);
      const putsNoSalvar = P.puts.registros.length;
      const deNovo = await Store.carregar();
      const montado = Store.montarRegistros(await Store.lerRegistros());
      return { versao: v.versao, depositos: await P.contagensDosDepositos(), canonPrincipal: P.canon(principal), canonCarregado: P.canon(carregado),
        ordem: P.ordem(carregado), contagens: P.contagens(carregado), regua: P.regua(carregado), registros: resumo,
        putsNoSalvar, canonDeNovo: P.canon(deNovo), ordemDeNovo: P.ordem(deNovo), canonMontado: P.canon(montado), ordemMontado: P.ordem(montado) };
    });
    conf('o código novo subiu o banco para a versão 5', depois.versao, 5);
    const chaves = Object.keys(antes.depositos).sort();
    conf('as contagens dos depósitos de antes, um a um, são as de depois',
      chaves.map(k => k + '=' + antes.depositos[k]).join(' '), chaves.map(k => k + '=' + depois.depositos[k]).join(' '));
    conf('o principal não foi tocado', depois.canonPrincipal === antes.canon, true);
    conf('carregar() depois da migração é a cópia, campo a campo', depois.canonCarregado === antes.canonCarregado, true);
    conf('todo vetor e as chaves de ajustes vêm na mesma ordem', depois.ordem === antes.ordem, true);
    const itens = antes.contagens.alunos + antes.contagens.series + antes.contagens.aulas + antes.contagens.resumos +
      antes.contagens.pagamentos + antes.contagens.ajustes + 1;
    conf('um registro vivo por item (' + itens + ')', depois.registros.vivos, itens);
    conf('nenhuma lápide', depois.registros.lapides, 0);
    conf('todo registro com os seis campos', depois.registros.campos, true);
    console.log('   registros por tipo: ' + JSON.stringify(depois.registros.porTipo));
    // 4. a régua
    conf('a régua de junho dá o mesmo depois da migração (ids, horas e valor)', depois.regua.texto === antes.regua.texto, true);
    conf('e o caso com R$ 1.050,00 continua onde estava', depois.regua.com1050, antes.regua.com1050);
    // 5. ida e volta
    conf('salvar(carregar()) não grava registro nenhum', depois.putsNoSalvar, 0);
    conf('e carregar() continua igual, na mesma ordem', depois.canonDeNovo === antes.canonCarregado && depois.ordemDeNovo === antes.ordem, true);
    conf('o documento montado dos registros é o carregar(), na mesma ordem', depois.canonMontado === depois.canonCarregado && depois.ordemMontado === depois.ordem, true);
    conf('nenhum erro de página', pag.errosDePagina.join(' | '), '');
    await apagarBanco(pag);
    await pag.close();
  }
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
