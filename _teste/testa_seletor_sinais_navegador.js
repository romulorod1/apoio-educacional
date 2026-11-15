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
 *    conferência 2 não exercitaria nada). Só o sinal que existe aparece
 *    (assunto sem nada, nenhum ícone). Digitar na busca não refaz a conta:
 *    a fontesDoAssuntoNoApp roda no máximo uma vez por assunto (contada no
 *    app.js servido), e redigitar não a chama de novo. Na janela centrada
 *    (800x1280), a legenda fica presa no alto quando a lista rola.
 *    A grade "Ver todos os assuntos de Matemática", aberta dali, também tem
 *    os sinais e o texto.
 * 2. Para cada assunto com sinal no seletor e na grade, a página do assunto,
 *    aberta pela Biblioteca como ela abre, tem exatamente as seções que o
 *    seletor (e a grade) acende, e o texto da linha ("No tablet: teoria,
 *    lista de base e exercícios") nomeia as mesmas seções, na ordem da
 *    página; sem seção, a linha não fala de material.
 *
 * 1b. O Voltar do aparelho dentro de "Outras matérias" sobe um nível: do
 *    grupo à matéria, da matéria à raiz do seletor, com o painel aberto e a
 *    entrada dele no histórico; da grade de Matemática, volta à raiz.
 * 3. O sinal herdado (do vizinho, ou todo de outro ano) diz de onde vem, como
 *    a página do assunto: traço pontilhado, nome do sinal, fim do texto da
 *    linha e a entrada da legenda.
 *
 * Venenos (TÊM de ser vistos: "VENENO visto"):
 *   --envenenado-sinais-do-modulo  o seletor lê o módulo do assunto direto
 *     (como no #158): teoria do módulo, itens do módulo, nada de OBMEP, e o
 *     texto "Módulo relacionado no tablet". A conferência 2 tem de cair.
 *   --envenenado-voltar-fecha-seletor  o Voltar do aparelho não sobe o nível
 *     do seletor (como no #239) e fecha o painel inteiro. A 1b tem de cair.
 *   --envenenado-sem-enem-no-sinal  o sinal dos exercícios sem o ENEM: o
 *     assunto só com ENEM fica sem sinal, e a seção 3 tem de cair.
 *   --envenenado-vizinhos-de-todos-os-sinais  cada sinal nomeia todos os
 *     vizinhos do assunto: a teoria fala do vizinho que só deu exercícios, e
 *     a seção 3 tem de cair.
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
// a linha que lê a fonte dos sinais: o veneno põe no lugar dela a leitura do módulo, que devolve antes
const ANCORA = "    var f = (bib && assunto && assunto.id ? fontesDoAssuntoNoApp(assunto.id, null, serie) : null) || {};\n";
const DO_MODULO = "    var achado = bib ? moduloDoAssunto(assunto) : false;\n" +
  "    var mod = achado && bib.modulos[achado.chave];\n" +
  "    void serie;\n" +
  "    return { teoria: !!(mod && mod.teorias && mod.teorias.length), exercicios: !!(mod && contarItens(mod)), obmep: false,\n" +
  "      resumo: mod ? resumoDisponibilidadeDoAssunto(assunto, mod) : '' };\n";
conf('(arranjo) a fonte dos sinais está num lugar só do app.js', APP.split(ANCORA).length, 2);
// a contagem das chamadas da fontesDoAssuntoNoApp, só no app.js servido a esta prova
const ENTRADA_FONTES = '  function fontesDoAssuntoNoApp(assuntoId, vinculos, anoDoAssunto) {\n';
conf('(arranjo) a fontesDoAssuntoNoApp aparece uma vez no app.js', APP.split(ENTRADA_FONTES).length, 2);
/* A seção 3 (de onde vem o sinal) dá a dois assuntos fontes feitas à mão,
 * com material herdado do vizinho ou de outro ano: o acervo sintético não tem
 * esse caso. Só no app.js servido a esta prova, e só para os ids pedidos. */
let servido = APP.replace(ENTRADA_FONTES, ENTRADA_FONTES + '    window.__contaFontes = (window.__contaFontes || 0) + 1;\n' +
  '    if (window.__fontesDaProva && window.__fontesDaProva[assuntoId]) return JSON.parse(JSON.stringify(window.__fontesDaProva[assuntoId]));\n');
const ENTRADA_MEMO = '  function memoDosSinaisAtual() {\n';
conf('(arranjo) o memo dos sinais aparece uma vez no app.js', APP.split(ENTRADA_MEMO).length, 2);
servido = servido.replace(ENTRADA_MEMO, ENTRADA_MEMO + '    if (window.__zerarSinais) { window.__zerarSinais = false; memoDosSinais.bib = null; }\n');
/* O outro veneno: o app.js servido sem o passo do seletor no Voltar do
 * aparelho (como no #239). Dentro de "Outras matérias", o Voltar fecha o
 * painel inteiro, e a seção 1b tem de cair. */
const VENENO_VOLTAR = process.argv.indexOf('--envenenado-voltar-fecha-seletor') >= 0;
/* O terceiro veneno: o sinal dos exercícios sem o ENEM (como antes do
 * acabamento). A linha nomeia o ENEM, a página tem a seção ENEM, e o sinal
 * fica apagado: a seção 3 tem de cair. */
const VENENO_ENEM = process.argv.indexOf('--envenenado-sem-enem-no-sinal') >= 0;
/* O quarto veneno: cada sinal nomeia TODOS os vizinhos do assunto, e não só
 * os que deram material a ele (como no e0db370). A teoria que veio só de
 * "Volume e unidades de medida" diria também "Volume do cilindro", que só deu
 * exercícios: a seção 3 tem de cair. */
const VENENO_VIZINHOS = process.argv.indexOf('--envenenado-vizinhos-de-todos-os-sinais') >= 0;
const VIZINHOS_DO_SINAL = "      var vizinhosDoSinal = (estado.vizinhos || []).filter(function (v) { return porSinal.indexOf(v.id) >= 0; });\n";
conf('(arranjo) os vizinhos de cada sinal saem num lugar só do app.js', APP.split(VIZINHOS_DO_SINAL).length, 2);
if (VENENO_VIZINHOS) {
  servido = servido.replace(VIZINHOS_DO_SINAL, '      var vizinhosDoSinal = estado.vizinhos || [];\n');
  conf('(veneno) o app.js servido nomeia todos os vizinhos em todo sinal', servido.indexOf(VIZINHOS_DO_SINAL) < 0, true);
}
const ENEM_NO_SINAL = "    var exercicios = (f.listaBase ? [f.listaBase] : []).concat(f.exercicios || [], f.enem || []);\n";
conf('(arranjo) o sinal dos exercícios junta o ENEM num lugar só do app.js', APP.split(ENEM_NO_SINAL).length, 2);
if (VENENO_ENEM) {
  servido = servido.replace(ENEM_NO_SINAL, "    var exercicios = (f.listaBase ? [f.listaBase] : []).concat(f.exercicios || []);\n");
  conf('(veneno) o app.js servido tira o ENEM do sinal', servido.indexOf(ENEM_NO_SINAL) < 0, true);
}
const PASSO_DO_SELETOR = "    var subirSeletor = topo.id === 'modal-tema' && typeof subirNivelDoSeletor === 'function' ? subirNivelDoSeletor() : null;\n";
conf('(arranjo) o Voltar do seletor sobe o nível num lugar só do app.js', APP.split(PASSO_DO_SELETOR).length, 2);
if (VENENO_VOLTAR) {
  servido = servido.replace(PASSO_DO_SELETOR, '    var subirSeletor = null;\n');
  conf('(veneno) o app.js servido fecha o painel no Voltar', servido.indexOf(PASSO_DO_SELETOR) < 0, true);
}
if (VENENO) {
  servido = servido.replace(ANCORA, DO_MODULO);
  conf('(veneno) o app.js servido lê o módulo direto', servido.indexOf(ANCORA) < 0, true);
}
const trocas = { '/app.js': servido };
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

const NOMES_DAS_SECOES = { teoria: 'teoria', 'lista-base': 'lista de base', exercicios: 'exercícios', obmep: 'OBMEP', enem: 'ENEM' };
const juntarComE = p => p.length < 2 ? p.join('') : p.slice(0, -1).join(', ') + ' e ' + p[p.length - 1];
// o texto que a linha tem de ter, dito pelas seções da página (o nome do módulo, entre parênteses, é opcional)
function textoBate(texto, secoes) {
  const nomes = secoes.map(s => NOMES_DAS_SECOES[s]).filter(Boolean);
  if (!nomes.length) return !/No tablet|Módulo relacionado/.test(texto);
  const esperado = 'No tablet: ' + juntarComE(nomes);
  const i = texto.indexOf(esperado);
  if (i < 0) return false;
  // depois das seções: o módulo entre parênteses e, no material herdado, de onde ele vem
  const resto = texto.slice(i + esperado.length);
  return /^( \([^)]+\))?(, de outro ano|, de assuntos? vizinhos?|; [^;]+ de outro ano)?$/.test(resto);
}
// o sinal dos exercícios junta as três seções de exercício da página
const SECOES_DO_SINAL = { teoria: ['teoria'], exercicios: ['lista-base', 'exercicios', 'enem'], obmep: ['obmep'] };

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
    document.querySelectorAll('#lista-assuntos .tema-sinais[data-lidos]').length), n => n > 3, 20000);
  conf('(arranjo) o seletor lê os sinais depois de a biblioteca carregar', acesos.ok, true);
  // os sinais de uma lista: o estado (pela classe), o texto, e o que está à vista de verdade
  const lerSinais = (sel, selTexto) => pag.evaluate((sel, selTexto) => {
    const porId = {}, visivelErrado = [];
    Array.from(document.querySelectorAll(sel)).forEach(l => {
      const s = l.querySelector('.tema-sinais');
      if (!s || !s.hasAttribute('data-lidos')) return;
      const est = {};
      Array.from(s.querySelectorAll('[data-tipo-sinal]')).forEach(x => {
        est[x.dataset.tipoSinal] = x.classList.contains('disponivel');
        const aVista = getComputedStyle(s).display !== 'none' && getComputedStyle(x).display !== 'none';
        if (aVista !== est[x.dataset.tipoSinal]) visivelErrado.push(l.dataset.assuntoId + ':' + x.dataset.tipoSinal);
      });
      const d = l.querySelector(selTexto);
      est.texto = d && !d.hidden ? d.textContent : '';
      porId[l.dataset.assuntoId] = est;
    });
    const legenda = document.querySelector('#tema-legenda');
    // a legenda à vista, entrada por entrada (a entrada escondida não conta)
    const entradas = legenda ? Array.from(legenda.querySelectorAll('[data-legenda]')).filter(e => !e.hidden) : [];
    return { porId, visivelErrado, legenda: legenda && !legenda.hidden
      ? entradas.map(e => e.textContent.replace(/\s+/g, ' ').trim()).join(' · ') : '' };
  }, sel, selTexto);
  const seletor = await lerSinais('#lista-assuntos .item-assunto[data-assunto-id]', '.detalhe');
  const ids = Object.keys(seletor.porId);
  console.log('   no seletor: ' + JSON.stringify(seletor.porId));
  /* A legenda usa as palavras do texto das linhas ("No tablet: teoria, lista
   * de base e exercícios"): teoria; lista de base ou exercícios; OBMEP. */
  conf('a legenda está à vista e diz teoria, lista de base ou exercícios, e OBMEP (' + seletor.legenda + ')',
    /(^| )Teoria( |$)/.test(seletor.legenda) && /Lista de base|Exercícios/.test(seletor.legenda) &&
    /OBMEP/.test(seletor.legenda) && !/biblioteca/i.test(seletor.legenda), true);
  // toda seção de exercício que o texto de uma linha nomeia está no nome da legenda
  const semLegenda = await pag.evaluate(() => {
    const nome = ((document.querySelector('#tema-legenda [data-legenda="exercicios"]') || {}).textContent || '').toLowerCase();
    const textos = Array.from(document.querySelectorAll('#lista-assuntos .item-assunto .detalhe')).map(d => d.textContent);
    return ['lista de base', 'exercícios', 'ENEM'].filter(s => textos.some(t => new RegExp('No tablet: [^·]*' + s).test(t)) &&
      nome.indexOf(s.toLowerCase()) < 0);
  });
  conf('a legenda explica toda seção de exercício que o texto das linhas nomeia', semLegenda.join(', '), '');
  // cada sinal aceso tem uma entrada na legenda, e a entrada sem sinal na tela não aparece
  const legendaCasa = await pag.evaluate(() => {
    const acesos = new Set(Array.from(document.querySelectorAll('#lista-assuntos .tema-sinal')).filter(x => !x.hidden).map(x => x.dataset.tipoSinal));
    return Array.from(document.querySelectorAll('#tema-legenda [data-legenda]')).filter(e => e.dataset.legenda !== 'herdado')
      .every(e => e.hidden === !acesos.has(e.dataset.legenda));
  });
  conf('a legenda mostra só a entrada de sinal que está na tela', legendaCasa, true);
  if (!VENENO) {
    ['teoria', 'exercicios', 'obmep'].forEach(tipo => {
      conf('(arranjo) há na tela um assunto com o sinal de ' + tipo + ' aceso', ids.some(id => seletor.porId[id][tipo]), true);
    });
  }
  conf('(arranjo) os assuntos de antes estão no seletor', ['MAT09-04', 'MAT07-01', 'MAT04-09'].every(id => ids.indexOf(id) >= 0), true);
  conf('só o sinal que existe está à vista (assunto sem nada, nenhum ícone)', seletor.visivelErrado.join(', '), '');

  /* A busca redesenha a cada letra: a conta dos sinais não pode ser refeita.
   * No máximo uma chamada por assunto novo, e redigitar não chama de novo. */
  const digitar = async termos => {
    const vistos = new Set();
    for (const t of termos) {
      await pag.evaluate(v => { const i = document.querySelector('#busca-assunto'); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); }, t);
      await pausa(250);
      (await pag.evaluate(() => Array.from(document.querySelectorAll('#lista-assuntos [data-assunto-id]')).map(l => l.dataset.assuntoId)))
        .forEach(id => vistos.add(id));
    }
    return vistos;
  };
  await pag.evaluate(() => { window.__contaFontes = 0; });
  const vistos = await digitar(['e', 'eq', 'equ', 'equa', 'equaç']);
  const chamadas1 = await pag.evaluate(() => window.__contaFontes);
  const novos = Array.from(vistos).filter(id => ids.indexOf(id) < 0).length;
  console.log('   digitando: ' + vistos.size + ' assuntos na tela, ' + novos + ' novos, ' + chamadas1 + ' chamadas');
  conf('(arranjo) a busca mostrou assuntos com sinal', vistos.size > 3, true);
  conf('digitando, a fontesDoAssuntoNoApp roda no máximo uma vez por assunto novo', chamadas1 <= novos, true);
  await digitar(['', 'e', 'eq', 'equ', 'equa', 'equaç']);
  conf('redigitando, nenhuma chamada nova', await pag.evaluate(() => window.__contaFontes), chamadas1);
  await digitar(['']);

  /* Na janela centrada (tablet em pé), a legenda fica presa no alto quando a
   * lista rola: os ícones nunca ficam sem explicação. */
  await pag.setViewport({ width: 800, height: 1280, hasTouch: true });
  await pausa(400);
  const preso = await pag.evaluate(() => {
    const corpo = document.querySelector('#corpo-modal-tema');
    corpo.scrollTop = corpo.scrollHeight;
    const rc = corpo.getBoundingClientRect(), rl = document.querySelector('#tema-legenda').getBoundingClientRect();
    return { rolou: corpo.scrollTop > 200, legendaNoAlto: rl.top >= rc.top - 1 && rl.bottom <= rc.top + 220 && rl.height > 0 };
  });
  conf('em 800x1280, com a lista rolada, a legenda continua no alto da janela', preso.rolou + '|' + preso.legendaNoAlto, 'true|true');
  await pag.evaluate(() => { document.querySelector('#corpo-modal-tema').scrollTop = 0; });
  await pag.setViewport({ width: 1280, height: 1000, hasTouch: true });
  await pausa(400);

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
  /* 1b. O VOLTAR DO APARELHO SOBE UM NÍVEL dentro do seletor (como #179 e
   * #199: a entrada do painel volta ao histórico). Da matéria, um grupo; do
   * grupo, o Voltar devolve a matéria; da matéria, a raiz; só na raiz ele
   * fecha o painel, e a aula atrás continua aberta. */
  secao('1b. Dentro de "Outras matérias", o Voltar do aparelho sobe um nível');
  const ondeEsta = () => pag.evaluate(() => ({
    tema: document.querySelector('#modal-tema').classList.contains('aberto'),
    aula: document.querySelector('#modal-aula').classList.contains('aberto'),
    titulo: ((document.querySelector('#lista-assuntos .barra h3') || {}).textContent || '').trim(),
    raiz: !!document.querySelector('#lista-assuntos #assunto-outro'),
    noHistorico: !!(history.state && history.state.apoioModal)
  }));
  const materia = await ondeEsta();
  await pag.evaluate(() => { const l = document.querySelector('#lista-assuntos .item-assunto'); if (l) l.click(); });
  const grupo = await esperar('um grupo da matéria', ondeEsta, v => !!v && v.titulo !== materia.titulo && v.titulo.indexOf(materia.titulo + ', ') === 0, 5000);
  conf('(arranjo) a matéria abre um grupo (' + (grupo.valor || {}).titulo + ')', grupo.ok, true);
  await pag.evaluate(() => history.back());
  const v1 = await esperar('o 1º Voltar', ondeEsta, v => !!v && (v.titulo === materia.titulo || !v.tema), 4000);
  const p1 = v1.valor || {};
  await pausa(300);
  await pag.evaluate(() => history.back());
  const v2 = await esperar('o 2º Voltar', ondeEsta, v => !!v && (v.raiz || !v.tema), 4000);
  const p2 = v2.valor || {};
  await pausa(300);
  const voltaCerta = p1.tema && p1.titulo === materia.titulo && p1.noHistorico && p2.tema && p2.raiz && p2.noHistorico;
  if (VENENO_VOLTAR) {
    conf('VENENO visto: o Voltar no grupo devolve a matéria e depois a raiz, com o painel aberto, e quebrou (' +
      JSON.stringify([p1, p2]) + ')', voltaCerta, false);
    conf('não houve erro de página', pag.errosDePagina.join(' | '), '');
    fs.rmSync(TMP, { recursive: true, force: true });
    await H.fim(amb)();
    return;
  }
  conf('no grupo, o 1º Voltar do aparelho devolve a matéria, com o painel e a entrada dele', p1.tema + '|' + p1.titulo + '|' + p1.noHistorico,
    'true|' + materia.titulo + '|true');
  conf('na matéria, o 2º Voltar devolve a raiz do seletor, com o painel aberto', p2.tema + '|' + p2.raiz + '|' + p2.noHistorico, 'true|true|true');
  conf('a aula atrás continua aberta', p2.aula, true);
  // e a grade de Matemática, aberta da raiz: o Voltar devolve a raiz
  await pag.evaluate(() => {
    const l = Array.from(document.querySelectorAll('#lista-assuntos .item-assunto')).find(x =>
      /^Ver todos os assuntos de Matemática/.test(x.querySelector('.nome').textContent));
    if (l) l.click();
  });
  await esperar('a grade aberta', () => pag.evaluate(() => !!document.querySelector('#lista-temas .item-tema')), Boolean, 8000);
  await pag.evaluate(() => history.back());
  const v3 = await esperar('o Voltar da grade', () => pag.evaluate(() => ({
    tema: document.querySelector('#modal-tema').classList.contains('aberto'),
    raiz: !!document.querySelector('#lista-assuntos #assunto-outro')
  })), v => !!v && (v.raiz || !v.tema), 4000);
  conf('na grade de Matemática, o Voltar do aparelho devolve a raiz do seletor', JSON.stringify(v3.valor), JSON.stringify({ tema: true, raiz: true }));
  await esperar('a raiz do seletor', () => pag.evaluate(() => !!document.querySelector('#lista-assuntos .item-assunto[data-assunto-id]')), Boolean, 5000);

  /* A grade "Ver todos os assuntos de Matemática", aberta do seletor da aula:
   * os mesmos sinais e o mesmo texto da página do assunto. */
  await pag.evaluate(() => {
    const l = Array.from(document.querySelectorAll('#lista-assuntos .item-assunto')).find(x =>
      /^Ver todos os assuntos de Matemática/.test(x.querySelector('.nome').textContent));
    if (l) l.click();
  });
  const gradeAberta = await esperar('a grade de temas', () => pag.evaluate(() =>
    document.querySelectorAll('#lista-temas .item-tema .tema-sinais[data-lidos]').length), n => n > 3, 10000);
  conf('(arranjo) a grade "Ver todos os assuntos de Matemática" abriu com os sinais lidos', gradeAberta.ok, true);
  const grade = await lerSinais('#lista-temas .item-tema[data-assunto-id]', '.bib-disponibilidade-tema');
  const idsGrade = Object.keys(grade.porId);
  console.log('   na grade: ' + JSON.stringify(grade.porId));
  conf('(arranjo) a grade tem o MAT04-09, o da OBMEP', idsGrade.indexOf('MAT04-09') >= 0, true);
  conf('na grade, a legenda está à vista', /OBMEP/.test(grade.legenda), true);
  conf('na grade, só o sinal que existe está à vista', grade.visivelErrado.join(', '), '');
  // o Voltar devolve a raiz do seletor, depois fecha o painel e depois a aula
  await pag.evaluate(() => history.back());
  await esperar('a raiz do seletor', () => pag.evaluate(() => !!document.querySelector('#lista-assuntos #assunto-outro')), Boolean, 4000);
  await pausa(300);
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
  const diferentes = [], textosDiferentes = [];
  // no veneno do ENEM, a seção 2 (que não tem ENEM no acervo sintético) não roda: a 3 é que tem de cair
  const todos = VENENO_ENEM ? [] : ids.concat(idsGrade.filter(id => ids.indexOf(id) < 0));
  for (const id of todos) {
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
    [['seletor', seletor.porId[id]], ['grade', grade.porId[id]]].forEach(([onde, est]) => {
      if (!est) return;
      const igual = linha.ok && pagina.ok && Object.keys(naPagina).every(t => naPagina[t] === !!est[t]);
      const textoIgual = linha.ok && pagina.ok && textoBate(est.texto, secoes);
      console.log('   ' + id + ' (' + onde + '): ' + JSON.stringify(est) + ' | página ' + JSON.stringify(secoes));
      if (!igual) diferentes.push(id + ' no ' + onde + ' (' + JSON.stringify(est) + ', página ' + JSON.stringify(naPagina) + ')');
      if (!textoIgual) textosDiferentes.push(id + ' no ' + onde + ' (linha "' + est.texto + '", página ' + JSON.stringify(secoes) + ')');
    });
    await pag.evaluate(() => { const v = document.querySelector('#bib-corpo .bib-assunto .bib-voltar'); if (v) v.click(); });
    await pag.evaluate(() => { const i = document.querySelector('#busca-biblioteca'); if (i && i.value) { i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); } });
    await pausa(300);
  }
  if (VENENO) {
    conf('VENENO visto: os sinais do seletor batem com a página do assunto, e quebrou (' + diferentes.join('; ') + ')',
      diferentes.length === 0, false);
    conf('VENENO visto: o texto da linha bate com a página do assunto, e quebrou (' + textosDiferentes.join('; ') + ')',
      textosDiferentes.length === 0, false);
  } else {
    conf('os sinais do seletor e da grade batem com as seções da página do assunto em ' + todos.length + ' assuntos', diferentes.join('; '), '');
    conf('o texto de cada linha (seletor e grade) nomeia as mesmas seções da página, nos ' + todos.length + ' assuntos', textosDiferentes.join('; '), '');
    if (!VENENO_ENEM) conf('(arranjo) há linha com texto de material', ids.some(id => /No tablet: /.test(seletor.porId[id].texto)), true);
  }

  /* 3. DE ONDE VEM O SINAL. A página do assunto diz quando o material é
   * herdado dos vizinhos ("Este assunto ainda não tem material próprio") ou de
   * outro ano (", de outro ano"); o seletor diz o mesmo, calmo: um traço
   * pontilhado sob o sinal, explicado na legenda, o nome do sinal com a origem
   * e o fim do texto da linha. As fontes de dois assuntos são feitas à mão
   * (o acervo sintético não tem o caso): o MAT07-01 com exercícios só do
   * os vizinhos MAT06-12 e MAT09-12 (o plural concorda), o MAT04-09 com a
   * teoria toda de outro ano e a OBMEP do próprio ano, e o MAT09-07 só com
   * ENEM: o acervo sintético só tem ENEM no 3º médio, e esta aluna é do 4º
   * ano, então é aqui que o sinal de exercícios encontra a seção ENEM. */
  if (!VENENO) {
    secao('3. O sinal herdado diz de onde vem, como a página do assunto');
    await H.irParaAba(pag, 'agenda');
    await pag.evaluate(() => {
      const mod = { chave: '9ano:prova', titulo: 'Módulo da prova' };
      window.__fontesDaProva = {
        // a teoria veio só do MAT06-12; os exercícios, dos dois vizinhos
        'MAT07-01': { assunto: 'MAT07-01', listaBase: null, obmep: [], enem: [],
          teoria: [{ id: 'prova:teo:2', tipo: 'teoria', titulo: 'Teoria 2', deVizinho: 'MAT06-12', modulo: mod }],
          exercicios: [{ id: 'prova:ex:1', tipo: 'exercicio', titulo: 'Exercício 1', deVizinho: 'MAT06-12', modulo: mod },
            { id: 'prova:ex:2', tipo: 'exercicio', titulo: 'Exercício 2', deVizinho: 'MAT09-12', modulo: mod }],
          vizinhos: [{ id: 'MAT06-12', titulo: 'Volume e unidades de medida', serie: '06' },
            { id: 'MAT09-12', titulo: 'Volume do cilindro', serie: '09' }] },
        'MAT09-07': { assunto: 'MAT09-07', teoria: [], listaBase: null, exercicios: [], obmep: [], vizinhos: [],
          enem: [{ id: 'enem:2099:1', tipo: 'exercicio', titulo: 'Questão 1', fonte: 'enem' }] },
        'MAT04-09': { assunto: 'MAT04-09', listaBase: null, exercicios: [], enem: [], vizinhos: [],
          teoria: [{ id: 'prova:teo:1', tipo: 'teoria', titulo: 'Teoria 1', outroAno: true, modulo: mod }],
          obmep: [{ id: 'prova:ob:1', tipo: 'exercicio', titulo: 'OBMEP 1', outroAno: false }] }
      };
      window.__zerarSinais = true;
      document.querySelector('[data-aula-id="f5_hoje"]').click();
    });
    await esperar('a aula aberta', () => pag.evaluate(() => !!document.querySelector('#modal-aula.aberto #escolher-assunto')), Boolean, 10000);
    await pausa(300);
    await pag.evaluate(() => document.querySelector('#escolher-assunto').click());
    await esperar('os sinais', () => pag.evaluate(() => document.querySelectorAll('#lista-assuntos .tema-sinais[data-lidos]').length), n => n > 3, 20000);
    await pausa(300);
    const origem = await pag.evaluate(() => {
      const linha = id => document.querySelector('#lista-assuntos .item-assunto[data-assunto-id="' + id + '"]');
      const sinal = (id, tipo) => {
        const s = linha(id) && linha(id).querySelector('[data-tipo-sinal="' + tipo + '"]');
        if (!s || s.hidden) return null;
        return { herdado: s.classList.contains('herdado'), origem: s.dataset.origem || '', nome: s.getAttribute('aria-label'),
          traco: getComputedStyle(s).borderBottomStyle };
      };
      const texto = id => ((linha(id) || document).querySelector('.detalhe') || {}).textContent || '';
      const herdado = document.querySelector('#tema-legenda [data-legenda="herdado"]');
      return {
        vizinho: sinal('MAT07-01', 'exercicios'), textoVizinho: texto('MAT07-01'), teoriaDoVizinho: sinal('MAT07-01', 'teoria'),
        outroAno: sinal('MAT04-09', 'teoria'), proprio: sinal('MAT04-09', 'obmep'), textoOutroAno: texto('MAT04-09'),
        controle: sinal('MAT09-04', 'teoria') || sinal('MAT09-04', 'exercicios'),
        legenda: herdado && !herdado.hidden ? herdado.textContent.trim() : '',
        enem: { teoria: !!sinal('MAT09-07', 'teoria'), exercicios: !!sinal('MAT09-07', 'exercicios'), obmep: !!sinal('MAT09-07', 'obmep'),
          nome: (sinal('MAT09-07', 'exercicios') || {}).nome || '', texto: texto('MAT09-07') },
        legendaExercicios: ((document.querySelector('#tema-legenda [data-legenda="exercicios"]') || {}).textContent || '').trim(),
        ano: ((document.querySelector('#tema-contexto .tag') || {}).textContent || '').trim()
      };
    });
    console.log('   ' + JSON.stringify(origem));
    /* O ENEM: a página teria só a seção ENEM; o sinal tem de ser o dos
     * exercícios (SECOES_DO_SINAL), o texto nomeia o ENEM e a legenda também. */
    const enemNaPagina = {};
    Object.keys(SECOES_DO_SINAL).forEach(t => { enemNaPagina[t] = SECOES_DO_SINAL[t].indexOf('enem') >= 0; });
    const enemIgual = Object.keys(enemNaPagina).every(t => enemNaPagina[t] === origem.enem[t]);
    /* Cada sinal nomeia só os vizinhos que deram material a ELE: a teoria,
     * que veio só de "Volume e unidades de medida", fica no singular e não fala
     * de "Volume do cilindro", que só deu exercícios. */
    const tv = origem.teoriaDoVizinho || {};
    const teoriaCerta = tv.origem === 'vizinho' && /, de assunto vizinho: “Volume e unidades de medida” \(6º ano\)$/.test(tv.nome || '') &&
      !/cilindro/i.test(tv.nome || '');
    if (VENENO_VIZINHOS) {
      conf('VENENO visto: a teoria nomeia só o vizinho que deu teoria, e quebrou (' + tv.nome + ')', teoriaCerta, false);
      conf('não houve erro de página', pag.errosDePagina.join(' | '), '');
      fs.rmSync(TMP, { recursive: true, force: true });
      await H.fim(amb)();
      return;
    }
    conf('a teoria nomeia só o vizinho que deu teoria, no singular, e não o que só deu exercícios (' + tv.nome + ')', teoriaCerta, true);
    if (VENENO_ENEM) {
      conf('VENENO visto: o assunto só com ENEM acende o sinal dos exercícios, e quebrou (' + JSON.stringify(origem.enem) + ')',
        enemIgual, false);
      conf('não houve erro de página', pag.errosDePagina.join(' | '), '');
      fs.rmSync(TMP, { recursive: true, force: true });
      await H.fim(amb)();
      return;
    }
    conf('o assunto só com ENEM acende o sinal dos exercícios, como a seção ENEM da página (' + JSON.stringify(origem.enem) + ')', enemIgual, true);
    conf('o texto da linha nomeia o ENEM, e o nome do sinal também', textoBate(origem.enem.texto, ['enem']) + '|' + /ENEM/.test(origem.enem.nome), 'true|true');
    conf('a legenda dos exercícios nomeia o ENEM que está na tela (' + origem.legendaExercicios + ')', /ENEM/.test(origem.legendaExercicios), true);
    conf('o ano da aluna, sem supor menino ou menina (' + origem.ano + ')', origem.ano, 'Está no 4º ano');
    const v = origem.vizinho || {}, o = origem.outroAno || {}, p = origem.proprio || {}, c = origem.controle || {};
    conf('o sinal herdado de dois vizinhos tem o traço pontilhado, concorda no plural e diz de quais veio',
      v.herdado + '|' + v.origem + '|' + v.traco + '|' +
      /de assuntos vizinhos: “Volume e unidades de medida” \(6º ano\) e “Volume do cilindro” \(9º ano\)/.test(v.nome || ''),
      'true|vizinho|dotted|true');
    conf('o texto da linha diz que o material é de assuntos vizinhos (' + origem.textoVizinho + ')', /No tablet: teoria e exercícios \(Módulo da prova\), de assuntos vizinhos$/.test(origem.textoVizinho), true);
    conf('a teoria toda de outro ano tem o traço e diz isso', o.herdado + '|' + o.origem + '|' + /, de outro ano$/.test(o.nome || ''), 'true|outro-ano|true');
    conf('a OBMEP do próprio ano, na mesma linha, fica sem o traço', p.herdado + '|' + p.traco, 'false|none');
    // a linha diz qual parte é de outro ano, e não diz que tudo é
    conf('o texto da linha diz que a teoria é de outro ano, e só ela (' + origem.textoOutroAno + ')',
      /No tablet: teoria e OBMEP \(Módulo da prova\); teoria de outro ano$/.test(origem.textoOutroAno) && !/, de outro ano/.test(origem.textoOutroAno), true);
    conf('(controle) o assunto com material próprio fica sem o traço', !!origem.controle && c.herdado, false);
    conf('a legenda explica o traço, no plural do que está na tela (' + origem.legenda + ')', origem.legenda, 'De outro ano ou de assuntos vizinhos');
    await pag.evaluate(() => { window.__fontesDaProva = null; });

    /* 4. SUBIR, ESCOLHER, VOLTAR. Na matéria, um grupo; o Voltar do aparelho
     * sobe à matéria; dali, o grupo de novo e um assunto escolhido. O painel
     * fecha, a aula fica com a entrada dela, e o Voltar seguinte fecha a aula
     * sem sair do aplicativo. */
    secao('4. Subir um nível, escolher o assunto, e o Voltar seguinte fecha a aula');
    const urlDoApp = pag.url();
    await pag.evaluate(() => {
      const blocos = Array.from(document.querySelectorAll('#lista-assuntos .bloco-exercicios'));
      const outras = blocos.find(x => x.textContent.trim() === 'Outras matérias');
      let e = outras && outras.nextElementSibling;
      while (e && !e.classList.contains('item-assunto')) e = e.nextElementSibling;
      if (e) e.click();
    });
    const naMateria = await esperar('a matéria', () => pag.evaluate(() => ((document.querySelector('#lista-assuntos .barra h3') || {}).textContent || '').trim()), Boolean, 5000);
    const abrirGrupo = () => pag.evaluate(() => { const l = document.querySelector('#lista-assuntos .item-assunto'); if (l) l.click(); });
    await abrirGrupo();
    await esperar('o grupo', () => pag.evaluate(() => !!document.querySelector('#lista-assuntos .irmao-aninhado')), Boolean, 5000);
    await pag.evaluate(() => history.back());
    const subiu = await esperar('o Voltar sobe à matéria', () => pag.evaluate(t =>
      !!document.querySelector('#modal-tema.aberto') && ((document.querySelector('#lista-assuntos .barra h3') || {}).textContent || '').trim() === t,
    naMateria.valor), Boolean, 4000);
    conf('(arranjo) o Voltar subiu do grupo à matéria', subiu.ok, true);
    await pausa(300);
    await abrirGrupo();
    await esperar('o grupo de novo', () => pag.evaluate(() => !!document.querySelector('#lista-assuntos .irmao-aninhado')), Boolean, 5000);
    const escolhido = await pag.evaluate(() => { const l = document.querySelector('#lista-assuntos .irmao-aninhado'); const t = l.querySelector('.nome').textContent; l.click(); return t; });
    const estadoAula = () => pag.evaluate(() => ({
      tema: document.querySelector('#modal-tema').classList.contains('aberto'),
      aula: document.querySelector('#modal-aula').classList.contains('aberto'),
      noHistorico: !!(history.state && history.state.apoioModal)
    }));
    const fechou = await esperar('o painel fecha depois de escolher', estadoAula, e => !!e && !e.tema && e.aula, 6000);
    await pausa(600);
    conf('escolher "' + escolhido + '" fecha o painel, e a aula fica com a entrada dela', fechou.ok && JSON.stringify(await estadoAula()),
      JSON.stringify({ tema: false, aula: true, noHistorico: true }));
    await pag.evaluate(() => history.back());
    const aulaFechou = await esperar('o Voltar fecha a aula', estadoAula, e => !!e && !e.aula, 4000);
    await pausa(500);
    conf('o Voltar seguinte fecha a aula, sem janela no histórico e sem sair do aplicativo',
      aulaFechou.ok && JSON.stringify(await estadoAula()) + '|' + (pag.url() === urlDoApp) + '|' + !!(await pag.$('#abas')),
      JSON.stringify({ tema: false, aula: false, noHistorico: false }) + '|true|true');
  }
  conf('não houve erro de página', pag.errosDePagina.join(' | '), '');
  fs.rmSync(TMP, { recursive: true, force: true });
  await H.fim(amb)();
})().catch(e => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e2) { /* ok */ } H.fim(amb)(e); });
