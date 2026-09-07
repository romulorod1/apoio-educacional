/* testa_tabela_no_app.js
 *
 * O aplicativo passou a ler a tabela de matérias (Core.MATERIAS) em vez de ter
 * a palavra "matematica" escrita à mão em oito pontos. Este teste prova, na
 * tela e no banco do tablet, o que essa mudança tinha obrigação de preservar
 * e o que ela tinha obrigação de consertar:
 *
 *   1. MIGRAÇÃO PREGUIÇOSA. Até a versão anterior o tópico ia para a aula sem
 *      id (só título, disciplina e grupo). Agora o bloco traz `ids` e os itens
 *      antigos ganham o seu ao abrir a janela do assunto, sem ela fazer nada:
 *      quem casa ganha id; o título repetido entre português e literatura casa
 *      pela disciplina certa; item sem grupo casa por (disciplina, título) só
 *      se o título for único na disciplina; o título que saiu do catálogo fica
 *      sem id e continua aparecendo pelo título; item livre e tema de
 *      matemática não são tocados; rodar de novo não muda nada nem grava.
 *   2. REPETIDO. Registrar um assunto era recusado só pelo título, e 8 títulos
 *      são idênticos entre português e literatura ("Cecília Meireles"): a
 *      aula de literatura era recusada depois da de português. Agora repetido
 *      é o mesmo id, ou o mesmo título NA MESMA disciplina; título sozinho só
 *      quando algum lado não tem disciplina (registro antigo, sem matéria).
 *   3. ÍNDICES POR MATÉRIA. Abrir a tela de temas não pode pedir à rede o
 *      índice de português e literatura, que ainda não existem (404 a cada
 *      abertura viraria linha de erro no console), nem escrever erro nenhum.
 *   4. ETIQUETA DA UNIDADE. A tabela UNIDADES_NOMES saiu do app.js; a etiqueta
 *      da lista de temas de matemática tem que ser a mesma de antes, tema a
 *      tema, e a tabela antiga fica congelada aqui como o "antes".
 *   5. ÁREAS SÓ DE MATEMÁTICA. Cálculo mental e linguagem matemática ganharam
 *      `so: ['matematica']` e somem para quem só tem outra matéria no
 *      mapeamento; o que ela já marcou continua visível, marcado, e o Salvar
 *      grava a aula com os mesmos ids de antes.
 *
 * Cada trava nova tem o par envenenado no fim: uma página à parte recebe o
 * app.js ou o core.js com o defeito injetado (o service worker é contornado e
 * o arquivo é trocado no caminho), e o teste tem que ENXERGAR o defeito. Sem
 * isso, uma trava que passa não prova nada.
 *
 * Nenhuma espera é por relógio: cada uma espera a condição, imprime o tempo e
 * devolve o último valor lido, para a falha mostrar o que estava na tela.
 * Os títulos, grupos e ids saem do próprio banco/topicos: se o catálogo
 * mudar, o teste anda junto.
 *
 * Precisa do servidor em 127.0.0.1:8777 (o portão levanta o dele).
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const Core = require('../core.js');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ORIGEM = 'http://127.0.0.1:8777/';
const URL_APP = ORIGEM + 'index.html';
const RAIZ = path.join(__dirname, '..');

/* ---------- o catálogo de tópicos, lido do banco ---------- */
const INDICE_TOPICOS = JSON.parse(fs.readFileSync(path.join(RAIZ, 'banco', 'topicos', 'indice.json'), 'utf8'));
const PLANOS = [];
INDICE_TOPICOS.disciplinas.forEach(d => {
  const arq = JSON.parse(fs.readFileSync(path.join(RAIZ, 'banco', 'topicos', d.chave + '.json'), 'utf8'));
  arq.grupos.forEach(g => g.blocos.forEach(b => b.topicos.forEach((t, i) => PLANOS.push({
    disciplina: d.chave, disciplinaNome: d.nome, grupo: g.chave, grupoRotulo: g.rotulo,
    bloco: b.titulo, titulo: t, id: (b.ids || [])[i] || null
  }))));
});
const vezesNoCatalogo = {};
PLANOS.forEach(p => { vezesNoCatalogo[p.titulo] = (vezesNoCatalogo[p.titulo] || 0) + 1; });
/* Um tópico cujo título aparece UMA vez no catálogo inteiro: o clique por
 * texto e a migração não têm como acertar outro. */
const unicoEm = (disciplina, grupo) => PLANOS.filter(p => p.disciplina === disciplina &&
  (!grupo || p.grupo === grupo) && vezesNoCatalogo[p.titulo] === 1 && p.id)[0];
const POR07 = unicoEm('portugues', '07');
const HIS = unicoEm('historia');
const LIT = unicoEm('literatura', 'em3') || unicoEm('literatura');
/* O título repetido entre português e literatura, de preferência no mesmo
 * grupo, que é o caso em que ignorar a disciplina dá o id errado em silêncio. */
const repetidos = PLANOS.filter(p => p.disciplina === 'portugues' &&
  PLANOS.some(q => q.disciplina === 'literatura' && q.titulo === p.titulo && q.grupo === p.grupo));
const REP_POR = repetidos.filter(p => p.titulo === 'Cecília Meireles')[0] || repetidos[0];
const REP_LIT = REP_POR && PLANOS.filter(q => q.disciplina === 'literatura' && q.titulo === REP_POR.titulo && q.grupo === REP_POR.grupo)[0];
const SUMIDO = 'Assunto que saiu do catálogo há muito tempo';
const NOME = {};
INDICE_TOPICOS.disciplinas.forEach(d => { NOME[d.chave] = d.nome; });
const GRUPO_ROTULO = (disciplina, grupo) => PLANOS.filter(p => p.disciplina === disciplina && p.grupo === grupo)[0].grupoRotulo;

/* O índice de matemática, para saber a unidade de cada tema pelo título. */
const INDICE_MAT = JSON.parse(fs.readFileSync(path.join(RAIZ, 'banco', 'indice.json'), 'utf8')).temas;
/* A tabela que existia à mão no app.js (UNIDADES_NOMES) até esta versão, e
 * saiu. Fica congelada aqui como o ANTES: a etiqueta da tela tem que continuar
 * igual a ela para os 148 temas, agora saindo de Core.MATERIAS. */
const UNIDADES_ANTES = {
  numeros: 'Números', algebra: 'Álgebra', geometria: 'Geometria',
  grandezas: 'Grandezas', estatistica: 'Estatística'
};

/* As áreas: as duas só de matemática e uma de qualquer matéria. */
const TODAS_AS_AREAS = [];
Core.AREAS.forEach(g => g.itens.forEach(i => TODAS_AS_AREAS.push(i)));
const SO_MAT = TODAS_AS_AREAS.filter(i => i.so && i.so.indexOf('matematica') !== -1).map(i => i.id);
const AREA_COMUM = TODAS_AS_AREAS.filter(i => !i.so)[0].id;

let falhas = 0, passes = 0;
const erros = [];
/* Fica fora do fluxo para o catch fechar o Chrome: teste que morre no meio e
 * deixa o navegador invisível aberto vira processo órfão na máquina. */
let navegador = null;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }
const pausa = ms => new Promise(r => setTimeout(r, ms));

/* Espera por CONDIÇÃO, nunca por relógio (o testa_biblioteca_offline mediu:
 * espera fixa reprovava sem defeito com a máquina ocupada). Erro dentro de
 * `ler` é "ainda não": no meio de um recarregamento o contexto some. */
async function esperar(rotulo, ler, condicao, limiteMs) {
  const inicio = Date.now();
  let valor;
  for (;;) {
    try { valor = await ler(); } catch (e) { valor = undefined; }
    if (condicao(valor)) {
      console.log('   ' + rotulo + ': em ' + (Date.now() - inicio) + ' ms');
      return { ok: true, valor: valor };
    }
    if (Date.now() - inicio >= limiteMs) break;
    await pausa(150);
  }
  console.log('   ' + rotulo + ': não aconteceu em ' + limiteMs + ' ms (último valor: ' +
    JSON.stringify(valor === undefined ? null : valor).slice(0, 300) + ')');
  return { ok: false, valor: valor };
}

/* ---------- o banco do tablet, lido e escrito por fora ---------- */
const bd = p => p.evaluate(() => new Promise(resolve => {
  const req = indexedDB.open('apoio-educacional');
  req.onsuccess = () => {
    const s = req.result.transaction('dados', 'readonly').objectStore('dados').get('principal');
    s.onsuccess = () => resolve(s.result || null);
    s.onerror = () => resolve(null);
  };
  req.onerror = () => resolve(null);
}));
const gravar = (p, banco) => p.evaluate(b => new Promise(resolve => {
  const req = indexedDB.open('apoio-educacional');
  req.onsuccess = () => {
    const s = req.result.transaction('dados', 'readwrite').objectStore('dados').put(b, 'principal');
    s.onsuccess = () => resolve(true);
    s.onerror = () => resolve(false);
  };
  req.onerror = () => resolve(false);
}), banco);

const limpo = s => String(s || '').replace(/\s+/g, ' ').trim();

/* ---------- caminhos de tela, os mesmos que ela usa ---------- */
async function esperarApp(p) {
  return esperar('o aplicativo desenhado', () => p.$eval('#rotulo-mes', e => e.textContent), v => !!v && v !== '.', 30000);
}
/* Na primeira visita o service worker ativa, chama clients.claim() e o app
 * recarrega sozinho; agir antes disso é agir numa página que vai sumir. */
async function esperarControle(p) {
  await esperar('o service worker controlando a página (ou desistindo)',
    () => p.evaluate(() => !!navigator.serviceWorker.controller), v => v === true, 15000);
  await esperarApp(p);
}
async function abrirComBanco(p, mexer) {
  await p.goto(URL_APP, { waitUntil: 'networkidle0' });
  await esperarControle(p);
  const banco = await bd(p);
  if (!banco) throw new Error('o banco de exemplo não foi criado');
  mexer(banco);
  const gravou = await gravar(p, banco);
  if (!gravou) throw new Error('não consegui gravar o banco de prova');
  await p.reload({ waitUntil: 'networkidle0' });
  await esperarApp(p);
  return banco;
}
async function irParaJunho(p) {
  await p.evaluate(async () => {
    let guarda = 0;
    while (document.querySelector('#rotulo-mes').textContent !== 'Junho de 2026' && guarda++ < 40) {
      document.querySelector('#mes-anterior').click();
      await new Promise(r => setTimeout(r, 30));
    }
  });
  return esperar('junho de 2026 na agenda', () => p.$eval('#rotulo-mes', e => e.textContent), v => v === 'Junho de 2026', 15000);
}
async function abrirAula(p, dia) {
  const tem = await esperar('a aula do dia ' + dia + ' na agenda',
    () => p.evaluate(d => !!document.querySelector('[data-dia="' + d + '"] .pilula'), dia), v => v === true, 15000);
  if (!tem.ok) throw new Error('sem aula no dia ' + dia);
  await p.evaluate(d => document.querySelector('[data-dia="' + d + '"] .pilula').click(), dia);
  return esperar('a janela da aula', () => p.$eval('#modal-aula', e => e.classList.contains('aberto')), v => v === true, 15000);
}
async function fecharAula(p) {
  await p.evaluate(() => document.querySelector('#modal-aula .modal-rodape [data-fechar]').click());
  return esperar('a janela da aula fechada', () => p.$eval('#modal-aula', e => e.classList.contains('aberto')), v => v === false, 10000);
}
async function abrirPicker(p) {
  const clicou = await p.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#corpo-modal-aula button')).filter(x => /assunto/i.test(x.textContent))[0];
    if (!b) return false;
    b.click();
    return true;
  });
  if (!clicou) throw new Error('sem botão de assunto na aula');
  return esperar('a janela do assunto com a lista por matéria',
    () => p.$eval('#lista-assuntos', e => e.textContent), v => /Por matéria/.test(v || ''), 30000);
}
async function fecharPicker(p) {
  await p.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#rodape-modal-tema button'))
      .filter(x => x.textContent.trim() === 'Cancelar')[0];
    if (b) b.click();
  });
  return esperar('a janela do assunto fechada', () => p.$eval('#modal-tema', e => e.classList.contains('aberto')), v => v === false, 10000);
}
/* Toca na linha da lista de assuntos cujo nome é exatamente o texto. */
async function tocarLinha(p, texto) {
  const r = await p.evaluate(txt => {
    const limpar = s => String(s || '').replace(/\s+/g, ' ').trim();
    const linhas = Array.from(document.querySelectorAll('#lista-assuntos .item-assunto'));
    const alvo = linhas.filter(l => limpar((l.querySelector('.nome') || {}).textContent) === txt)[0];
    if (!alvo) return { erro: 'não achei a linha "' + txt + '"', vistas: linhas.map(l => limpar((l.querySelector('.nome') || {}).textContent)).slice(0, 30) };
    alvo.scrollIntoView({ block: 'center' });
    alvo.click();
    return { ok: true };
  }, texto);
  if (r.erro) throw new Error(r.erro + '. Linhas vistas: ' + JSON.stringify(r.vistas));
}
/* Navega até o grupo de uma disciplina e espera a tela do grupo. */
async function irAteGrupo(p, disciplina, grupo) {
  await tocarLinha(p, NOME[disciplina]);
  await esperar('a matéria ' + NOME[disciplina] + ' aberta',
    () => p.$eval('#lista-assuntos', e => e.textContent), v => (v || '').indexOf(GRUPO_ROTULO(disciplina, grupo)) >= 0, 15000);
  await tocarLinha(p, GRUPO_ROTULO(disciplina, grupo));
  return esperar('o grupo ' + GRUPO_ROTULO(disciplina, grupo) + ' aberto',
    () => p.$eval('#lista-assuntos', e => e.querySelectorAll('.bloco-exercicios').length), v => v > 0, 15000);
}
const aviso = p => p.evaluate(() => ({
  aberto: document.querySelector('#aviso').classList.contains('aberto'),
  texto: document.querySelector('#aviso-texto').textContent
}));
const aulaDoDia = async (p, dia, alunoId) => ((await bd(p)) || { aulas: [] }).aulas
  .filter(a => a.data === dia && a.alunoId === alunoId)[0];
const linhasDaAula = p => p.$$eval('#lista-temas-aula .item-lista', es => es.map(e => ({
  nome: (e.querySelector('.nome') ? e.querySelector('.nome').textContent : '').replace(/\s+/g, ' ').trim(),
  detalhe: (e.querySelector('.detalhe') ? e.querySelector('.detalhe').textContent : '').replace(/\s+/g, ' ').trim(),
  botoes: Array.from(e.querySelectorAll('button')).map(b => b.textContent.trim())
})));
/* A lista de temas de matemática, com o título e a primeira etiqueta de cada
 * um (a da unidade vem logo depois do título). */
const temasNaTela = p => p.$$eval('#lista-temas .item-tema', es => es.map(e => {
  const nome = e.querySelector('.nome');
  const tag = nome ? nome.querySelector('.tag') : null;
  return { titulo: nome && nome.firstChild ? nome.firstChild.textContent.trim() : '', tag: tag ? tag.textContent.trim() : '' };
}));
async function abrirMaterial(p) {
  await p.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#linha-folha button')).filter(x => x.textContent.trim() === 'Material de aula')[0];
    if (b) b.click();
  });
  return esperar('a lista de temas', () => p.$$eval('#lista-temas .item-tema', es => es.length), v => v > 0, 30000);
}
async function escolherSerie(p, serie) {
  const esperados = INDICE_MAT.filter(t => t.serie === serie).map(t => t.pt.titulo).sort().join('|');
  await p.evaluate(s => {
    const sel = document.querySelector('#corpo-modal-tema select');
    sel.value = s;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }, serie);
  return esperar('a lista do ano ' + serie, async () => (await temasNaTela(p)).map(t => t.titulo).sort().join('|'), v => v === esperados, 15000);
}

/* Uma página à parte com o app.js ou o core.js ENVENENADO. O service worker é
 * contornado para o pedido chegar à interceptação, e cada troca tem que mudar
 * o código de verdade: veneno que não muda nada provaria nada. */
async function paginaEnvenenada(navegador, trocas) {
  const ctx = await navegador.createBrowserContext();
  const p = await ctx.newPage();
  p.setDefaultTimeout(60000);
  p.on('dialog', async d => { try { await d.accept(); } catch (e) { /* ok */ } });
  await p.setBypassServiceWorker(true);
  await p.setRequestInterception(true);
  const fontes = {};
  Object.keys(trocas).forEach(arq => {
    let src = fs.readFileSync(path.join(RAIZ, arq), 'utf8').replace(/\r\n/g, '\n');
    trocas[arq].forEach(par => {
      const antes = src;
      src = src.split(par[0]).join(par[1]);
      conf('veneno em ' + arq + ' mudou o código de verdade (' + par[0].slice(0, 42) + ')', src !== antes, true);
    });
    fontes[arq] = src;
  });
  p.on('request', r => {
    const arq = Object.keys(fontes).filter(a => r.url() === ORIGEM + a)[0];
    if (arq) r.respond({ status: 200, contentType: 'application/javascript; charset=utf-8', body: fontes[arq] });
    else r.continue();
  });
  return { ctx: ctx, p: p };
}

(async () => {
  if (!POR07 || !HIS || !LIT || !REP_POR || !REP_LIT) {
    throw new Error('o catálogo não tem os tópicos que este teste precisa (único no 7º de português, único em história, único em literatura, repetido entre português e literatura no mesmo grupo)');
  }
  conf('o título "sumido" não existe no catálogo', vezesNoCatalogo[SUMIDO] || 0, 0);
  console.log('tópico único de português: ' + POR07.titulo + ' (' + POR07.id + ')');
  console.log('tópico único de história, sem grupo no item: ' + HIS.titulo + ' (' + HIS.id + ')');
  console.log('repetido: "' + REP_POR.titulo + '" ' + REP_POR.id + ' em português e ' + REP_LIT.id + ' em literatura');
  console.log('áreas só de matemática: ' + SO_MAT.join(', ') + '; área comum: ' + AREA_COMUM);
  conf('as duas áreas só de matemática existem na tabela', SO_MAT.length, 2);

  navegador = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1280, height: 800, hasTouch: true }
  });
  const pag = await navegador.newPage();
  pag.setDefaultTimeout(60000);
  const errosDePagina = [];
  pag.on('pageerror', e => errosDePagina.push(e.message));
  pag.on('console', m => { if (m.type() === 'error') errosDePagina.push('console: ' + m.text()); });
  pag.on('dialog', async d => { try { await d.accept(); } catch (e) { /* ok */ } });
  const pedidos = [];
  pag.on('request', r => pedidos.push(r.url()));

  /* Quatro aulas do junho do exemplo (segundas, quartas e sextas, menos 03, 12
   * e 29, que no mês real não houve): uma para a migração, outra para provar
   * que ela alcança aula que não está aberta, uma para o repetido e uma para
   * as áreas, para nenhuma seção herdar o que a anterior gravou. */
  const DIA_MIGRA = '2026-06-10', DIA_OUTRA = '2026-06-15', DIA_REPETIDO = '2026-06-08', DIA_AREAS = '2026-06-22';
  let marcelo = null;
  const temaMat = INDICE_MAT.filter(t => t.serie === '06')[0];

  // ================================================================
  secao('0. O banco de prova: itens antigos, sem id, como o tablet dela tem hoje');
  await abrirComBanco(pag, banco => {
    marcelo = banco.alunos.filter(a => /Marcelo/i.test(a.nome))[0];
    const dele = d => banco.aulas.filter(a => a.alunoId === marcelo.id && a.data === d)[0];
    dele(DIA_MIGRA).temas = [
      { titulo: POR07.titulo, fonte: 'topico', disciplina: 'portugues', grupo: '07' },
      { titulo: REP_POR.titulo, fonte: 'topico', disciplina: 'portugues', grupo: REP_POR.grupo },
      { titulo: REP_LIT.titulo, fonte: 'topico', disciplina: 'literatura', grupo: REP_LIT.grupo },
      { titulo: SUMIDO, fonte: 'topico', disciplina: 'portugues', grupo: '07' }
    ];
    dele(DIA_OUTRA).temas = [
      { titulo: HIS.titulo, fonte: 'topico', disciplina: 'historia' },
      { titulo: 'Revisão para a prova de sexta', fonte: 'livre' },
      { id: temaMat.id, titulo: temaMat.pt.titulo, fonte: 'banco', disciplina: 'matematica' }
    ];
    dele(DIA_REPETIDO).temas = [
      { titulo: REP_POR.titulo, fonte: 'livre', disciplina: 'portugues' },
      { titulo: LIT.titulo, fonte: 'livre' }
    ];
  });
  conf('o aluno do exemplo está no banco', !!marcelo, true);
  const semente = await aulaDoDia(pag, DIA_MIGRA, marcelo.id);
  conf('a aula do dia 10 abre com os quatro itens antigos, nenhum com id',
    semente.temas.map(t => 'id' in t).join(','), 'false,false,false,false');

  // ================================================================
  secao('1. Abrir a janela do assunto migra os ids dos tópicos antigos');
  await irParaJunho(pag);
  await abrirAula(pag, DIA_MIGRA);
  let linhas = await linhasDaAula(pag);
  conf('a aula mostra os quatro assuntos antes de qualquer migração', linhas.length, 4);
  conf('o sumido aparece pelo título', linhas.some(l => l.nome.indexOf(SUMIDO) >= 0), true);

  const pedidosAntes = pedidos.length;
  await abrirPicker(pag);
  const migrou = await esperar('o id do tópico de português gravado no banco',
    async () => ((await aulaDoDia(pag, DIA_MIGRA, marcelo.id)).temas[0] || {}).id, v => v === POR07.id, 15000);
  conf('o tópico de português ganhou o id do catálogo', migrou.valor, POR07.id);
  let aula = await aulaDoDia(pag, DIA_MIGRA, marcelo.id);
  conf('o repetido de português casou pela disciplina certa', aula.temas[1].id, REP_POR.id);
  conf('o repetido de literatura casou pela disciplina certa', aula.temas[2].id, REP_LIT.id);
  conf('o que saiu do catálogo ficou sem id (nem nulo: a chave não existe)', 'id' in aula.temas[3], false);
  conf('e nada mais mudou nos quatro itens (título, fonte, disciplina, grupo)',
    aula.temas.map(t => [t.titulo, t.fonte, t.disciplina, t.grupo].join('/')).join(' ; '),
    semente.temas.map(t => [t.titulo, t.fonte, t.disciplina, t.grupo].join('/')).join(' ; '));
  let outra = await aulaDoDia(pag, DIA_OUTRA, marcelo.id);
  conf('a migração alcança as outras aulas, não só a aberta: o item sem grupo casou por (disciplina, título)', outra.temas[0].id, HIS.id);
  conf('o item livre continua sem id', 'id' in outra.temas[1], false);
  conf('o tema de matemática continua com o id dele', outra.temas[2].id, temaMat.id);
  conf('e sem ganhar nem perder campo', Object.keys(outra.temas[2]).sort().join(','), 'disciplina,fonte,id,titulo');

  /* Item 3 do brief: os índices das outras matérias não existem ainda, e a
   * abertura não pode ir à rede atrás deles. */
  const doBanco = pedidos.slice(pedidosAntes).filter(u => u.indexOf('/banco/') >= 0).map(u => u.replace(ORIGEM, ''));
  console.log('   pedidos a banco/ ao abrir a janela: ' + (doBanco.length ? doBanco.join(', ') : 'nenhum'));
  conf('nenhum pedido a banco/portugues/ nem banco/literatura/ (índice que não existe não é pedido à rede)',
    doBanco.filter(u => /banco\/(portugues|literatura)\//.test(u)).length, 0);

  const salvasAntes = await pag.evaluate(() => {
    window.__salvas = 0;
    const original = window.Store.salvar;
    window.Store.salvar = function () { window.__salvas++; return original.apply(this, arguments); };
    return window.__salvas;
  });
  const retrato = JSON.stringify(((await bd(pag)) || {}).aulas);
  await fecharPicker(pag);
  await abrirPicker(pag);
  await fecharPicker(pag);
  conf('abrir de novo não grava nada (idempotente: zero chamadas ao Store.salvar)',
    await pag.evaluate(() => window.__salvas), salvasAntes);
  conf('e o banco ficou byte a byte igual', JSON.stringify(((await bd(pag)) || {}).aulas) === retrato, true);

  linhas = await linhasDaAula(pag);
  conf('a linha do tópico de português diz a matéria e o ano', linhas[0].detalhe, 'Português, 7º ano');
  conf('a de literatura diz a matéria e o grupo', linhas[2].detalhe, 'Literatura, ' + REP_LIT.grupoRotulo);
  conf('o sumido continua aparecendo pelo título, com a matéria', linhas[3].nome.indexOf(SUMIDO) >= 0 && /Português/.test(linhas[3].detalhe), true);
  conf('nenhuma das quatro oferece Material: não há tema com material nelas', linhas.filter(l => l.botoes.indexOf('Material') >= 0).length, 0);
  await fecharAula(pag);

  // ================================================================
  secao('2. Repetido é (disciplina, título), e não título sozinho');
  await abrirAula(pag, DIA_REPETIDO);
  let antes = (await aulaDoDia(pag, DIA_REPETIDO, marcelo.id)).temas.length;
  conf('a aula começa com os dois assuntos escritos à mão', antes, 2);
  await abrirPicker(pag);
  await irAteGrupo(pag, 'literatura', REP_LIT.grupo);
  await tocarLinha(pag, REP_LIT.titulo);
  const registrou = await esperar('o assunto de literatura registrado',
    async () => (await aulaDoDia(pag, DIA_REPETIDO, marcelo.id)).temas.length, v => v === antes + 1, 15000);
  conf('"' + REP_LIT.titulo + '" de literatura entra, mesmo já havendo o de português escrito à mão', registrou.valor, antes + 1);
  aula = await aulaDoDia(pag, DIA_REPETIDO, marcelo.id);
  conf('e entra com o id e a disciplina de literatura', aula.temas[2].id + '/' + aula.temas[2].disciplina, REP_LIT.id + '/literatura');
  await esperar('a janela do assunto fechada depois de registrar', () => pag.$eval('#modal-tema', e => e.classList.contains('aberto')), v => v === false, 10000);

  antes = aula.temas.length;
  await abrirPicker(pag);
  await irAteGrupo(pag, 'portugues', REP_POR.grupo);
  await tocarLinha(pag, REP_POR.titulo);
  const recusou = await esperar('o aviso de assunto repetido', () => aviso(pag), a => !!a && a.aberto && /já está registrado/.test(a.texto), 10000);
  conf('o mesmo título em português é recusado: mesma disciplina', recusou.valor ? recusou.valor.texto : null, 'Este assunto já está registrado nesta aula.');
  conf('e a aula não ganhou item', (await aulaDoDia(pag, DIA_REPETIDO, marcelo.id)).temas.length, antes);
  await esperar('a janela do assunto fechada depois da recusa', () => pag.$eval('#modal-tema', e => e.classList.contains('aberto')), v => v === false, 10000);

  /* O legado: registro antigo sem disciplina nenhuma compara só pelo título,
   * porque não há como saber de que matéria ele era. */
  await abrirPicker(pag);
  await irAteGrupo(pag, 'literatura', LIT.grupo);
  await tocarLinha(pag, LIT.titulo);
  const recusouLegado = await esperar('o aviso de repetido para o registro sem disciplina', () => aviso(pag), a => !!a && a.aberto && /já está registrado/.test(a.texto), 10000);
  conf('título igual a um registro antigo SEM disciplina continua recusado (legado)', recusouLegado.ok, true);
  conf('e a aula continua com o que tinha', (await aulaDoDia(pag, DIA_REPETIDO, marcelo.id)).temas.length, antes);
  await esperar('a janela fechada', () => pag.$eval('#modal-tema', e => e.classList.contains('aberto')), v => v === false, 10000);
  await fecharAula(pag);

  // ================================================================
  secao('3. A etiqueta da unidade na lista de temas é a mesma de antes, tema a tema');
  await abrirAula(pag, DIA_MIGRA);
  await abrirMaterial(pag);
  const porSerieETitulo = {};
  INDICE_MAT.forEach(t => { porSerieETitulo[t.serie + '|' + t.pt.titulo] = t; });
  let conferidos = 0, divergentes = [];
  const series = Array.from(new Set(INDICE_MAT.map(t => t.serie)));
  for (const serie of series) {
    const lista = await escolherSerie(pag, serie);
    if (!lista.ok) { divergentes.push(serie + ': a lista não abriu'); continue; }
    (await temasNaTela(pag)).forEach(item => {
      const t = porSerieETitulo[serie + '|' + item.titulo];
      if (!t) { divergentes.push(serie + ': "' + item.titulo + '" não está no índice'); return; }
      const antesEtiqueta = UNIDADES_ANTES[t.unidade] || t.unidade;
      conferidos++;
      if (item.tag !== antesEtiqueta) divergentes.push(t.id + ': tela "' + item.tag + '", antes "' + antesEtiqueta + '"');
    });
  }
  divergentes.slice(0, 10).forEach(d => console.log('   divergente: ' + d));
  conf('todos os temas do índice foram conferidos na tela', conferidos, INDICE_MAT.length);
  conf('a etiqueta da unidade é igual à da tabela antiga em todos', divergentes.length, 0);
  await pag.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#rodape-modal-tema button')).filter(x => x.textContent.trim() === 'Cancelar')[0];
    if (b) b.click();
  });
  await esperar('a lista de temas fechada', () => pag.$eval('#modal-tema', e => e.classList.contains('aberto')), v => v === false, 10000);

  // ================================================================
  secao('4. Os retratos: a aula com o tópico de português e a janela do assunto, nas duas orientações');
  /* O aviso da recusa da seção anterior ainda pode estar na tela; o retrato
   * espera ele ir embora, para mostrar só o que a seção mostra. */
  const semAviso = () => esperar('o aviso anterior fechado', () => aviso(pag), a => !!a && !a.aberto, 12000);
  for (const tam of [[1280, 800], [800, 1280]]) {
    await pag.setViewport({ width: tam[0], height: tam[1], hasTouch: true });
    await esperar('a janela da aula reacomodada em ' + tam.join('x'), () => pag.$eval('#modal-aula', e => e.classList.contains('aberto')), v => v === true, 5000);
    await pag.evaluate(() => { const l = document.querySelector('#lista-temas-aula'); if (l) l.scrollIntoView({ block: 'center' }); });
    await semAviso();
    await pag.screenshot({ path: path.join(__dirname, 'v_tabela_aula_' + tam.join('x') + '.png') });
    await abrirPicker(pag);
    await irAteGrupo(pag, 'portugues', '07');
    await pag.evaluate(() => { const c = document.querySelector('#corpo-modal-tema'); if (c) c.scrollTop = 0; });
    await semAviso();
    await pag.screenshot({ path: path.join(__dirname, 'v_tabela_assunto_' + tam.join('x') + '.png') });
    await fecharPicker(pag);
  }
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  await fecharAula(pag);
  console.log('   retratos em _teste/v_tabela_aula_*.png e _teste/v_tabela_assunto_*.png');

  // ================================================================
  secao('5. Áreas só de matemática: somem para quem só tem outra matéria, mas o que já foi marcado fica e grava igual');
  const totalAreas = TODAS_AS_AREAS.length;
  await abrirAula(pag, DIA_OUTRA);
  conf('sem mapeamento de outra matéria, a aula oferece todas as ' + totalAreas + ' áreas',
    await pag.$$eval('#corpo-modal-aula .item-area', es => es.length), totalAreas);
  await fecharAula(pag);

  /* Um mapeamento só de português para o aluno, e uma aula com uma área só de
   * matemática já marcada, como ela pode ter feito antes desta versão. */
  const itemPortugues = Core.itensDaMateria('atencao', 'portugues')[0];
  conf('há item de mapeamento que vale para português', !!itemPortugues, true);
  let bancoAgora = await bd(pag);
  const m = Core.mapeamentoNovo();
  Core.marcarNaMateria(m, 'portugues', 'atencao', itemPortugues.id, true);
  bancoAgora.alunos.filter(a => a.id === marcelo.id)[0].mapeamentos = [m];
  const aulaAreas = bancoAgora.aulas.filter(a => a.alunoId === marcelo.id && a.data === DIA_AREAS)[0];
  aulaAreas.areas = [SO_MAT[0], AREA_COMUM];
  const areasAntes = aulaAreas.areas.slice();
  await gravar(pag, bancoAgora);
  await pag.reload({ waitUntil: 'networkidle0' });
  await esperarApp(pag);
  conf('o mapeamento gravado é só de português',
    Core.materiasDoMapeamento(Core.mapeamentoAtual(((await bd(pag)).alunos).filter(a => a.id === marcelo.id)[0])).join(','), 'portugues');
  await irParaJunho(pag);
  await abrirAula(pag, DIA_AREAS);
  const caixas = await pag.$$eval('#corpo-modal-aula .item-area', es => es.map(e => ({
    id: e.getAttribute('data-area'), marcada: e.querySelector('input').checked
  })));
  conf('a área só de matemática que NÃO estava marcada sumiu', caixas.some(c => c.id === SO_MAT[1]), false);
  conf('a que já estava marcada continua na tela', caixas.some(c => c.id === SO_MAT[0]), true);
  conf('e continua marcada', (caixas.filter(c => c.id === SO_MAT[0])[0] || {}).marcada, true);
  conf('a área comum continua', caixas.some(c => c.id === AREA_COMUM), true);
  conf('no total, uma caixa a menos que a tabela inteira', caixas.length, totalAreas - 1);
  await pag.evaluate(() => document.querySelector('#salvar-aula').click());
  await esperar('a aula salva e fechada', () => pag.$eval('#modal-aula', e => e.classList.contains('aberto')), v => v === false, 15000);
  const depois = await aulaDoDia(pag, DIA_AREAS, marcelo.id);
  conf('o Salvar gravou a aula com os mesmos ids de área de antes', (depois.areas || []).join(','), areasAntes.join(','));

  // ================================================================
  secao('6. Pares envenenados: cada trava tem que enxergar o defeito que existe para pegar');

  // 6a. A migração casa só por (grupo, título), ignorando a disciplina.
  {
    const env = await paginaEnvenenada(navegador, {
      'app.js': [
        ["porGrupo[p.disciplina + '|' + p.grupo + '|' + p.titulo] = p.id;", "porGrupo[p.grupo + '|' + p.titulo] = p.id;"],
        ["chaves.porGrupo[t.disciplina + '|' + t.grupo + '|' + t.titulo]", "chaves.porGrupo[t.grupo + '|' + t.titulo]"]
      ]
    });
    let idAluno = null;
    await abrirComBanco(env.p, banco => {
      const al = banco.alunos.filter(a => /Marcelo/i.test(a.nome))[0];
      idAluno = al.id;
      banco.aulas.filter(a => a.alunoId === al.id && a.data === DIA_MIGRA)[0].temas = [
        { titulo: REP_POR.titulo, fonte: 'topico', disciplina: 'portugues', grupo: REP_POR.grupo }
      ];
    });
    await irParaJunho(env.p);
    await abrirAula(env.p, DIA_MIGRA);
    await abrirPicker(env.p);
    const r = await esperar('algum id gravado no item de português (envenenado)',
      async () => ((await aulaDoDia(env.p, DIA_MIGRA, idAluno)).temas[0] || {}).id, v => !!v, 15000);
    conf('envenenado (migração sem disciplina): o item de português recebeu id de OUTRA disciplina (defeito detectado)',
      r.valor && r.valor !== REP_POR.id ? 'id errado: ' + r.valor : 'id certo: ' + r.valor, 'id errado: ' + REP_LIT.id);
    await env.ctx.close();
  }

  // 6b. Repetido volta a ser só pelo título, a regra antiga.
  {
    const env = await paginaEnvenenada(navegador, {
      'app.js': [['return t.disciplina === item.disciplina;', 'return true;']]
    });
    let idAluno = null;
    await abrirComBanco(env.p, banco => {
      const al = banco.alunos.filter(a => /Marcelo/i.test(a.nome))[0];
      idAluno = al.id;
      banco.aulas.filter(a => a.alunoId === al.id && a.data === DIA_REPETIDO)[0].temas = [
        { titulo: REP_POR.titulo, fonte: 'livre', disciplina: 'portugues' }
      ];
    });
    await irParaJunho(env.p);
    await abrirAula(env.p, DIA_REPETIDO);
    await abrirPicker(env.p);
    await irAteGrupo(env.p, 'literatura', REP_LIT.grupo);
    await tocarLinha(env.p, REP_LIT.titulo);
    const r = await esperar('o aviso de repetido (envenenado)', () => aviso(env.p), a => !!a && a.aberto && /já está registrado/.test(a.texto), 10000);
    conf('envenenado (título sozinho): a literatura foi recusada depois do português (defeito detectado)', r.ok, true);
    conf('e a aula não ganhou o item', (await aulaDoDia(env.p, DIA_REPETIDO, idAluno)).temas.length, 1);
    await env.ctx.close();
  }

  // 6c. areasPara esquece o que já está marcado.
  {
    const env = await paginaEnvenenada(navegador, {
      'core.js': [['if (!i.so || !pedidas.length || fixos.indexOf(i.id) !== -1) return true;', 'if (!i.so || !pedidas.length) return true;']]
    });
    await abrirComBanco(env.p, banco => {
      const al = banco.alunos.filter(a => /Marcelo/i.test(a.nome))[0];
      const mm = Core.mapeamentoNovo();
      Core.marcarNaMateria(mm, 'portugues', 'atencao', itemPortugues.id, true);
      al.mapeamentos = [mm];
      banco.aulas.filter(a => a.alunoId === al.id && a.data === DIA_AREAS)[0].areas = [SO_MAT[0], AREA_COMUM];
    });
    await irParaJunho(env.p);
    await abrirAula(env.p, DIA_AREAS);
    const ids = await env.p.$$eval('#corpo-modal-aula .item-area', es => es.map(e => e.getAttribute('data-area')));
    conf('envenenado (sem manter): a área marcada SUMIU da tela, sem como desmarcar (defeito detectado)', ids.indexOf(SO_MAT[0]) === -1, true);
    await env.ctx.close();
  }

  // 6d. A etiqueta da unidade vira a chave crua.
  {
    const env = await paginaEnvenenada(navegador, {
      'app.js': [["return (rotulos && rotulos[t.unidade]) || t.unidade;", 'return t.unidade;']]
    });
    await abrirComBanco(env.p, function () { /* banco de exemplo como está */ });
    await irParaJunho(env.p);
    await abrirAula(env.p, DIA_MIGRA);
    await abrirMaterial(env.p);
    const lista = await escolherSerie(env.p, '06');
    const etiquetas = lista.ok ? (await temasNaTela(env.p)).map(t => t.tag) : [];
    const erradas = etiquetas.filter(e => Object.keys(UNIDADES_ANTES).indexOf(e) >= 0).length;
    conf('envenenado (etiqueta crua): a tela mostra a chave em vez do nome (defeito detectado)', erradas > 0 && erradas === etiquetas.length, true);
    await env.ctx.close();
  }

  // ================================================================
  secao('7. Erros de página');
  const reais = errosDePagina.filter(e => !/favicon|manifest|sw\.js|ServiceWorker/i.test(e));
  reais.forEach(e => console.log('  ERRO: ' + e));
  conf('nenhum erro de JavaScript nem de console na página principal', reais.length, 0);

  await navegador.close();
  console.log('\n' + '='.repeat(60));
  console.log(passes + ' passaram, ' + falhas + ' falharam.');
  if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
  console.log('='.repeat(60));
  process.exit(falhas ? 1 : 0);
})().catch(async e => {
  console.error('\nO teste parou com erro:', e.message);
  console.error(e.stack);
  if (navegador) { try { await navegador.close(); } catch (e2) { /* já fechou */ } }
  console.log('\n' + passes + ' passaram, ' + (falhas + 1) + ' falharam.');
  process.exit(1);
});
