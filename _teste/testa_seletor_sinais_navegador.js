/* testa_seletor_sinais_navegador.js
 *
 * F5: os sinais do seletor de assunto da aula dizem o MESMO que a página do
 * assunto. A fonte dos dois é a fontesDoAssuntoNoApp (decisão da
 * orquestradora): cada sinal é uma seção do bloco "Teoria e exercícios" da
 * página, com o mesmo sentido.
 *   teoria      a seção Teoria;
 *   exercicios  a seção Lista de base ou a seção Exercícios;
 *   obmep       a seção OBMEP.
 *
 * O acervo é o sintético das provas (_pacote_sintetico.js): o 9º ano do Portal
 * com teoria e lista de base, o Banco do nível 2 e a Mirim 2, importados pela
 * tela de Ajustes, como ela faz. O aluno é do 4º ano (a Mirim 2 acende a
 * OBMEP nas sugestões do ano) e as aulas de antes trazem assuntos do 9º (a
 * teoria e os exercícios do Portal), que voltam em "Continuar de onde parou".
 * Dados fictícios, perfil do Chrome novo e apagado no fim. Tablet deitado.
 *
 * 1. O seletor abre com os sinais acesos; a legenda diz teoria, exercícios e
 *    OBMEP, e há na tela ao menos um assunto com cada sinal aceso (senão a
 *    conferência 2 não exercitaria nada).
 * 2. Para cada assunto com sinal na tela, a página do assunto, aberta pela
 *    Biblioteca como ela abre, tem exatamente as seções que o seletor acende.
 *
 * Veneno (TEM de ser visto: "VENENO visto"):
 *   --envenenado-sinais-do-modulo  o seletor lê o módulo do assunto direto
 *     (como no #158): teoria do módulo, itens do módulo, e nada de OBMEP. A
 *     conferência 2 tem de cair.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const RELOGIO = H.relogioDaRodada('2026-11-16', '11:00');
const { conf, secao, pausa, esperar } = H;

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const VENENO = process.argv.indexOf('--envenenado-sinais-do-modulo') >= 0;
const ANCORA = "    var f = (bib && assunto && assunto.id ? fontesDoAssuntoNoApp(assunto.id, null, serie) : null) || {};\n" +
  "    return {\n" +
  "      teoria: !!(f.teoria || []).length,\n" +
  "      exercicios: !!f.listaBase || !!(f.exercicios || []).length,\n" +
  "      obmep: !!(f.obmep || []).length\n" +
  "    };\n";
const DO_MODULO = "    var achado = bib ? moduloDoAssunto(assunto) : false;\n" +
  "    var mod = achado && bib.modulos[achado.chave];\n" +
  "    void serie;\n" +
  "    return { teoria: !!(mod && mod.teorias && mod.teorias.length), exercicios: !!(mod && contarItens(mod)), obmep: false };\n";
conf('(arranjo) a fonte dos sinais está num lugar só do app.js', APP.split(ANCORA).length, 2);
const trocas = {};
if (VENENO) {
  trocas['/app.js'] = APP.replace(ANCORA, DO_MODULO);
  conf('(veneno) o app.js servido lê o módulo direto', trocas['/app.js'].indexOf(ANCORA) < 0, true);
}
const amb = H.criarAmbiente(8897, 'nath_f5_seletor_sinais', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'f5_sinais_'));

async function importar(pag, arquivo) {
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => { document.querySelector('#estado-importacao-biblioteca').innerHTML = ''; });
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar('importação de ' + path.basename(arquivo), () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca');
    return [c ? c.innerText.trim() : '', document.querySelector('#importar-biblioteca').disabled];
  }), v => !!v[0] && !/Conferindo|Gravando/.test(v[0]) && v[1] === false, 60000);
  return (r.valor || [''])[0];
}

const SECOES_DO_SINAL = { teoria: ['teoria'], exercicios: ['lista-base', 'exercicios'], obmep: ['obmep'] };

(async () => {
  secao('0. O acervo sintético');
  const zips = [
    ['portal.zip', z => Sintetico.gerar(z, { listas: true, base: true })],
    ['banco.zip', z => Sintetico.gerarBanco(z)],
    ['mirim2.zip', z => Sintetico.gerarProva(z, { serie: 'm2' })]
  ].map(([nome, gerar]) => { const z = path.join(TMP, nome); gerar(z); return z; });
  await amb.subir();
  const pag = await amb.pagina();
  await RELOGIO.naPagina(pag);
  await H.abrirApp(pag, amb.ORIGEM);
  await pag.evaluate(async () => {
    const d = await Store.carregar();
    d.alunos = [{ id: 'f5_eco', nome: 'Aluna Eco Teste', ativo: true, anoEscolar: '04', precos: [], trilhas: [] }];
    const aula = (id, data, temas) => ({ id, alunoId: 'f5_eco', data, hora: '10:00', duracaoMin: 60, status: 'realizada',
      cobravel: true, notaTexto: '', notaPrivada: '', anexos: [], temas: temas || [] });
    d.aulas = [aula('f5_hoje', Core.hojeIso()),
      aula('f5_a1', '2026-11-09', [{ id: 'MAT09-04', titulo: 'Equação do 2º grau: como resolver', fonte: 'banco' }]),
      aula('f5_a2', '2026-11-02', [{ id: 'MAT09-07', titulo: 'Teorema de Pitágoras', fonte: 'banco' },
        { id: 'MAT07-01', titulo: 'Assunto sem material', fonte: 'banco' }]),
      aula('f5_a3', '2026-10-26', [{ id: 'MAT04-09', titulo: 'Assunto do 4º ano', fonte: 'banco' }])];
    d.series = []; d.resumos = [];
    await Store.salvar(d);
  });
  await H.abrirApp(pag, amb.ORIGEM);
  for (const z of zips) conf('importou ' + path.basename(z), /^Biblioteca importada\./.test(await importar(pag, z)), true);
  await H.abrirApp(pag, amb.ORIGEM);

  secao('1. O seletor da aula, com os sinais acesos');
  await H.irParaAba(pag, 'agenda');
  await pag.evaluate(() => document.querySelector('[data-aula-id="f5_hoje"]').click());
  const aula = await esperar('a aula aberta', () => pag.evaluate(() => !!document.querySelector('#modal-aula.aberto #escolher-assunto')), Boolean, 10000);
  conf('(arranjo) a aula de hoje abriu', aula.ok, true);
  await pausa(300);
  await pag.evaluate(() => document.querySelector('#escolher-assunto').click());
  const acesos = await esperar('os sinais do seletor', () => pag.evaluate(() =>
    document.querySelectorAll('#lista-assuntos .tema-sinais:not([hidden])').length), n => n > 3, 20000);
  conf('(arranjo) o seletor mostra os sinais depois de a biblioteca carregar', acesos.ok, true);
  const seletor = await pag.evaluate(() => {
    const porId = {};
    Array.from(document.querySelectorAll('#lista-assuntos .item-assunto[data-assunto-id]')).forEach(l => {
      const s = l.querySelector('.tema-sinais');
      if (!s || s.hidden) return;
      const est = {};
      Array.from(s.querySelectorAll('[data-tipo-sinal]')).forEach(x => { est[x.dataset.tipoSinal] = x.classList.contains('disponivel'); });
      porId[l.dataset.assuntoId] = est;
    });
    const legenda = document.querySelector('#tema-legenda');
    return { porId, legenda: legenda && !legenda.hidden ? legenda.textContent.replace(/\s+/g, ' ').trim() : '' };
  });
  const ids = Object.keys(seletor.porId);
  console.log('   no seletor: ' + JSON.stringify(seletor.porId));
  conf('a legenda está à vista e diz teoria, exercícios e OBMEP',
    /Teoria da biblioteca/.test(seletor.legenda) && /Exercícios/.test(seletor.legenda) && /OBMEP/.test(seletor.legenda), true);
  if (!VENENO) {
    ['teoria', 'exercicios', 'obmep'].forEach(tipo => {
      conf('(arranjo) há na tela um assunto com o sinal de ' + tipo + ' aceso', ids.some(id => seletor.porId[id][tipo]), true);
    });
  }
  conf('(arranjo) os assuntos de antes estão no seletor', ['MAT09-04', 'MAT07-01', 'MAT04-09'].every(id => ids.indexOf(id) >= 0), true);
  /* Numa tela sem sinal (os assuntos de outra matéria), a legenda e os sinais
   * somem DE VERDADE: o display da regra deles não pode vencer o hidden. */
  await pag.evaluate(() => {
    const blocos = Array.from(document.querySelectorAll('#lista-assuntos .bloco-exercicios'));
    const outras = blocos.find(x => x.textContent.trim() === 'Outras matérias');
    let e = outras && outras.nextElementSibling;
    while (e && !e.classList.contains('item-assunto')) e = e.nextElementSibling;
    if (e) e.click();
  });
  const semSinal = await esperar('outra matéria aberta no seletor', () => pag.evaluate(() => {
    if (document.querySelector('#lista-assuntos .item-assunto[data-assunto-id]')) return null;
    const legenda = document.querySelector('#tema-legenda');
    return { legenda: legenda.hidden + ':' + getComputedStyle(legenda).display,
      sinaisVisiveis: Array.from(document.querySelectorAll('#lista-assuntos .tema-sinais')).filter(s => getComputedStyle(s).display !== 'none').length };
  }), v => !!v, 8000);
  conf('em outra matéria, a legenda escondida não aparece na tela', semSinal.ok && (semSinal.valor || {}).legenda, 'true:none');
  conf('e nenhum sinal à vista', semSinal.ok && (semSinal.valor || {}).sinaisVisiveis, 0);
  // o Voltar fecha o painel e depois a aula
  await pag.evaluate(() => history.back());
  await esperar('o painel fechado', () => pag.evaluate(() => !document.querySelector('#modal-tema.aberto')), Boolean, 4000);
  await pausa(300);
  await pag.evaluate(() => history.back());
  await esperar('a aula fechada', () => pag.evaluate(() => !document.querySelector('#modal-aula.aberto')), Boolean, 4000);
  await pausa(300);

  secao('2. Cada assunto: os sinais do seletor são as seções da página do assunto');
  // a página do assunto é aberta pela busca da Biblioteca, pelo título do índice (sem livro no tablet, a
  // lista por ano não aparece)
  const tituloDe = await pag.evaluate(() => fetch('banco/topicos/matematica.json').then(r => r.json()).then(d => {
    const a = Array.isArray(d) ? d : (d.temas || d.itens || Object.values(d).find(Array.isArray));
    const m = {}; a.forEach(t => { m[t.id] = t.pt.titulo; }); return m;
  }));
  const diferentes = [];
  for (const id of ids) {
    await H.irParaAba(pag, 'biblioteca');
    await pag.evaluate(() => { const v = document.querySelector('#bib-corpo .bib-assunto .bib-voltar'); if (v) v.click(); });
    await pag.evaluate(t => { const i = document.querySelector('#busca-biblioteca'); i.value = t; i.dispatchEvent(new Event('input', { bubbles: true })); }, tituloDe[id]);
    const linha = await esperar('o ' + id + ' na busca', () => pag.evaluate(i => {
      const l = document.querySelector('#bib-assuntos-da-busca [data-assunto="' + i + '"]');
      if (l) { l.click(); return true; }
      document.querySelectorAll('#bib-assuntos-da-busca .bib-assuntos-mais, #bib-assuntos-da-busca .bib-assuntos-outros-anos-ver').forEach(b => b.click());
      return false;
    }, id), Boolean, 10000);
    const pagina = await esperar('a página de ' + id, () => pag.evaluate(i => {
      const p = document.querySelector('#bib-corpo .bib-assunto[data-assunto="' + i + '"]');
      const bte = p && p.querySelector('.bte');
      if (!bte) return null;
      return Array.from(bte.querySelectorAll('.bte-secao[data-secao]')).map(s => s.dataset.secao);
    }, id), v => Array.isArray(v), 10000);
    const secoes = pagina.valor || [];
    const naPagina = {};
    Object.keys(SECOES_DO_SINAL).forEach(t => { naPagina[t] = SECOES_DO_SINAL[t].some(s => secoes.indexOf(s) >= 0); });
    const igual = linha.ok && pagina.ok && Object.keys(naPagina).every(t => naPagina[t] === !!seletor.porId[id][t]);
    console.log('   ' + id + ': seletor ' + JSON.stringify(seletor.porId[id]) + ' | página ' + JSON.stringify(secoes));
    if (!igual) diferentes.push(id + ' (seletor ' + JSON.stringify(seletor.porId[id]) + ', página ' + JSON.stringify(naPagina) + ')');
    await pag.evaluate(() => { const v = document.querySelector('#bib-corpo .bib-assunto .bib-voltar'); if (v) v.click(); });
    await pag.evaluate(() => { const i = document.querySelector('#busca-biblioteca'); if (i && i.value) { i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); } });
    await pausa(300);
  }
  if (VENENO) {
    conf('VENENO visto: os sinais do seletor batem com a página do assunto, e quebrou (' + diferentes.join('; ') + ')',
      diferentes.length === 0, false);
  } else {
    conf('os sinais do seletor batem com as seções da página do assunto em ' + ids.length + ' assuntos', diferentes.join('; '), '');
  }
  conf('não houve erro de página', pag.errosDePagina.join(' | '), '');
  fs.rmSync(TMP, { recursive: true, force: true });
  await H.fim(amb)();
})().catch(e => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e2) { /* ok */ } H.fim(amb)(e); });
