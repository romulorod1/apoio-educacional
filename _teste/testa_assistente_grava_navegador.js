/* testa_assistente_grava_navegador.js (projeto IA no app, fase 4a: o assistente que GRAVA uma aula)
 *
 * O cartão de confirmação no aplicativo de verdade (Chrome, puppeteer-core),
 * com alunos SINTÉTICOS e o /api/ia INTERCEPTADO por um falso que devolve um
 * roteiro de tool_use: nenhuma chamada à API, nenhuma conta real.
 *
 * O que prova:
 *   1. no tablet: o pedido leva as 20 ferramentas; o cartão diz o que muda,
 *      o Entendi, o antes e o depois e o dinheiro; "Agora não" não grava;
 *      NADA grava sem o Confirmar (o banco e a fila iguais com o cartão
 *      aberto); o Confirmar grava o que o core faria, mostra o aviso com
 *      "Desfazer" POR CIMA da janela, e o Desfazer volta o banco ao estado
 *      exato de antes;
 *   2. toque duplo em Confirmar grava UMA vez (uma aula nova só);
 *   3. no celular da dona: o Confirmar é ação declarada
 *      ([data-acao-celular="assistente-confirmar"], D6b) e grava; o registro
 *      gerado é IGUAL, byte a byte, ao da mesma mudança pela tela do celular:
 *      o "Cancelar sem cobrança", o "Registrar como foi" e o "Marcar aula";
 *   4. o celular que só lê: o pedido vai com as 16 de leitura, e a proposta
 *      forjada pelo modelo falso não vira cartão nem grava; o observador
 *      não vê o assistente;
 *   5. o transbordo do cartão (várias linhas, a pergunta da cobrança de cada
 *      linha e o relato editável) a 360, 390 e 412 px, letra normal e 130%;
 *   6. as lentes da romul-ac: o aviso de cada saída no botão (não some na
 *      escolha), a linha que o lote poupa, e a trava de concorrência do
 *      Confirmar: a agenda muda pelo caminho de verdade (Store.aplicarRecebidos,
 *      como chega do outro aparelho) com o cartão aberto, e o cartão vira "mudou".
 *
 * Venenos, que TÊM de reprovar:
 *   --envenenado-toque-duplo   o Confirmar sem a trava do estado e sem
 *                              desligar o botão (a parte 2);
 *   --envenenado-sem-acao      o Confirmar do celular fora do
 *                              comoAcaoDoCelular (a parte 3);
 *   --envenenado-sem-conferencia  o Confirmar sem a comparação da
 *                              assinatura (a parte 6).
 *
 * Porta 8975. O service worker é contornado.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8975;
const V_DUPLO = '--envenenado-toque-duplo';
const V_ACAO = '--envenenado-sem-acao';
const V_CONF = '--envenenado-sem-conferencia';
const MODO = [V_DUPLO, V_ACAO, V_CONF].filter(v => process.argv.indexOf(v) >= 0)[0] || '';
function prop(rotulo, ok, veneno) {
  if (MODO && MODO === veneno) return conf('VENENO visto: ' + rotulo + ', e quebrou', ok, false);
  return conf(rotulo, ok, true);
}
const APP_N = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const ANCORAS = {
  [V_DUPLO]: [['    if (!c || c.estado !== \'aberto\') return;\n', '    if (!c) return;\n'], ['    c.estado = \'gravando\';\n    if (botao) botao.disabled = true;\n', '']],
  [V_ACAO]: [['      p = modoCelular ? comoAcaoDoCelular(fazer) : fazer();', '      p = fazer();']],
  [V_CONF]: [['    if (!linhas || Assistente.assinatura(linhas) !== c.assinatura) { c.estado = \'mudou\';', '    if (!linhas) { c.estado = \'mudou\';']]
};
secao('0. As âncoras dos venenos');
Object.keys(ANCORAS).forEach(v => ANCORAS[v].forEach(par => conf('âncora uma vez só no app.js (' + v + '): ' + par[0].trim().slice(0, 50), APP_N.split(par[0]).length, 2)));
const trocas = {};
if (MODO) {
  trocas['/app.js'] = ANCORAS[MODO].reduce((t, par) => t.split(par[0]).join(par[1]), APP_N);
  conf('o app.js servido ficou diferente do repositório (' + MODO + ')', trocas['/app.js'] !== APP_N, true);
}
const amb = H.criarAmbiente(PORTA, 'perfil_assistente_grava_nav', trocas);
const HOJE = '2026-11-16';

function aula(id, alunoId, data, hora, extra) {
  return Object.assign({ id, alunoId, data, hora, duracaoMin: 60, status: 'realizada', notaTexto: '', notaPrivada: '', temNota: false, anexos: [], temas: [], areas: [] }, extra || {});
}
const DB = {
  versao: 1, resumos: [], pagamentos: [],
  // a versão vista é a do app: o celular a põe na memória ao abrir, e a primeira gravação a levaria junto
  ajustes: { cargaInicial: true, versaoVista: /VERSAO = '([0-9.]+)'/.exec(APP_N)[1], ultimoAnoLetivoAtualizado: 2026, pagamentosDesde: '2026-10' },
  alunos: [
    { id: 'al1', nome: 'Zélia Sobrenomeum', ativo: true, cor: '#2E7D6B', telefone: '(21) 98765-4321', precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 120 }], mapeamentos: [], obs: '' },
    { id: 'al2', nome: 'Bruno Sobrenomedois', ativo: true, cor: '#1F3A5F', telefone: '', precos: [{ id: 'p2', inicio: '2026-01-01', fim: null, valorHora: 150 }], mapeamentos: [], obs: '' }
  ],
  series: [{ id: 's1', alunoId: 'al1', dias: [4], hora: '15:30', duracaoMin: 60, inicio: '2026-10-01', fim: null, exclusoes: [], materializadoAte: '2026-11', status: 'realizada' }],
  aulas: [
    aula('s1@2026-11-19', 'al1', '2026-11-19', '15:30', { serieId: 's1', destacada: false }),
    aula('s1@2026-11-26', 'al1', '2026-11-26', '15:30', { serieId: 's1', destacada: false }),
    aula('b1', 'al2', HOJE, '08:00'),
    aula('b2', 'al2', '2026-11-20', '17:30')
  ]
};
const item = o => Object.assign({ acao: null, alunoId: null, nome_dito: '', data: null, hora: null, nova_data: null, nova_hora: null, duracao_min: null, cobranca: null }, o);

const falso = { fila: [], pedidos: [] };
function usage() { return { input_tokens: 12, output_tokens: 30, cache_read_input_tokens: 3000, cache_creation_input_tokens: 0 }; }
function ferramentas(chamadas) {
  return { ok: true, resposta: { id: 'msg_f', model: 'claude-sonnet-5-5', stop_reason: 'tool_use', usage: usage(),
    content: [{ type: 'thinking', thinking: '', signature: 'sig-' + Math.random().toString(36).slice(2) }]
      .concat(chamadas.map((c, i) => ({ type: 'tool_use', id: 'toolu_' + i + '_' + c[0], name: c[0], input: c[1] }))) } };
}
function texto(t) {
  return { ok: true, resposta: { id: 'msg_t', model: 'claude-sonnet-5-5', stop_reason: 'end_turn', usage: usage(), content: [{ type: 'text', text: t }] } };
}

const aberta = (pag, id) => pag.evaluate(i => { const m = document.getElementById(i); return !!m && m.classList.contains('aberto'); }, id);
const visivel = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); if (!e || e.hidden) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }, sel);
async function clicar(pag, sel) {
  await esperar('à vista: ' + sel, () => visivel(pag, sel), v => v === true, 15000);
  await pag.evaluate(s => document.querySelector(s).click(), sel);
  await pausa(200);
}
async function perguntar(pag, frase, roteiro) {
  falso.fila = roteiro.slice();
  falso.pedidos = [];
  await pag.evaluate(f => { const c = document.querySelector('#ass-texto'); c.value = f; c.dispatchEvent(new Event('input', { bubbles: true })); }, frase);
  await clicar(pag, '#ass-perguntar');
  await esperar('a resposta chegou', () => pag.evaluate(() => !document.querySelector('#ass-esperando')), v => v === true, 15000);
  await pausa(450); // a trava de 400 ms do rodapé, que agora vale também para o Confirmar
}
const estadoDoCartao = (pag, sel) => pag.evaluate(s => { const c = document.querySelector(s); return c && c.getAttribute('data-estado'); }, sel || '#ass-conversa > .ass-vez:last-of-type .ass-proposta');
const banco = pag => pag.evaluate(() => Promise.all([Store.carregar(), Store.lerRegistros()]).then(r => JSON.stringify(r[0]) + '|' + JSON.stringify(r[1])));
const soBanco = pag => pag.evaluate(() => Store.carregar().then(b => JSON.stringify(b)));
const semIdsNovos = s => { const d = JSON.parse(s); d.aulas.forEach(a => { if (!/^(s1@|b\d)/.test(a.id)) a.id = 'NOVA'; }); return JSON.stringify(d); };
/* Onde dois bancos diferem (os caminhos), para a falha dizer o quê. */
function onde(a, b, cam, saida) {
  saida = saida || []; cam = cam || '';
  if (saida.length > 6) return saida;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    Array.from(new Set(Object.keys(a).concat(Object.keys(b)))).forEach(k => onde(a[k], b[k], cam + '.' + k, saida));
  } else if (JSON.stringify(a) !== JSON.stringify(b)) saida.push(cam + ': ' + JSON.stringify(a) + ' / ' + JSON.stringify(b));
  return saida;
}
function igual(rotulo, x, y) { conf(rotulo + (x === y ? '' : ' (' + onde(JSON.parse(x), JSON.parse(y)).join('; ') + ')'), x === y, true); }
const ultimoCartao = '#ass-conversa > .ass-vez:last-of-type .ass-proposta';
async function modo(pag, nome, largura, altura) {
  await pag.setViewport({ width: largura, height: altura, hasTouch: largura < 500 });
  await pag.evaluate(n => sessionStorage.setItem('modo-da-prova', n), nome);
  await pag.reload({ waitUntil: 'networkidle0' });
  await esperar('o app abriu (' + nome + ')', () => pag.evaluate(() => typeof Store === 'object' && !!document.querySelector('#versao-app')), v => v === true, 20000);
  await pausa(1500);
  await pag.evaluate(() => { const b = document.querySelector('#entendi-novidades'); if (b && document.querySelector('#modal-novidades.aberto')) b.click(); });
}
async function voltarAoInicio(pag) {
  await pag.evaluate(async d => { await Store.salvar(d); }, DB);
}
async function desfazerPeloAviso(pag) {
  await esperar('o aviso com Desfazer', () => visivel(pag, '#aviso-acao'), v => v === true, 10000);
  await pag.evaluate(() => document.querySelector('#aviso-acao').click());
  await pausa(800);
}
async function transbordo(pag, raizSel) {
  return pag.evaluate(sel => {
    const raiz = document.querySelector(sel);
    const falhas = [];
    const W = window.innerWidth;
    Array.from(raiz.querySelectorAll('*')).forEach(e => {
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const tag = e.tagName.toLowerCase();
      const nome = tag + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).join('.') : '');
      if (['input', 'textarea', 'svg', 'path', 'rect', 'circle'].indexOf(tag) < 0 && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== 'visible')
        falhas.push(nome + ' rola de lado (' + e.scrollWidth + ' > ' + e.clientWidth + ')');
      if (r.right > W + 1) falhas.push(nome + ' passa da borda (' + Math.round(r.right - W) + ' px)');
      if ((tag === 'button' || (tag === 'a' && e.classList.contains('btn'))) && (r.height < 47.5 || r.width < 47.5)) falhas.push(nome + ' com alvo de ' + Math.round(r.width) + 'x' + Math.round(r.height));
    });
    return falhas;
  }, raizSel);
}

(async () => {
  await amb.subir();
  const pag = await amb.pagina();
  await pag.setBypassServiceWorker(true);
  await pag.setRequestInterception(true);
  const paraFora = [];
  const dialogos = [];
  pag.on('dialog', d => { dialogos.push(d.message()); d.accept().catch(() => {}); });
  pag.on('request', req => {
    const u = req.url();
    if (u.indexOf('/api/ia') >= 0) {
      let corpo = null; try { corpo = JSON.parse(req.postData() || 'null'); } catch (e) { corpo = 'nao-json'; }
      falso.pedidos.push(corpo);
      const vez = falso.fila.shift() || texto('(fila vazia)');
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(vez) }).catch(() => {});
      return;
    }
    if (u.indexOf('http://127.0.0.1:' + PORTA) !== 0 && !u.startsWith('data:') && !u.startsWith('blob:')) { paraFora.push(u); req.abort().catch(() => {}); return; }
    req.continue().catch(() => {});
  });
  await pag.evaluateOnNewDocument(() => {
    let modo = 'sem';
    try { modo = sessionStorage.getItem('modo-da-prova') || 'sem'; } catch (e) { return; }
    let guardado;
    Object.defineProperty(window, 'Nuvem', { configurable: true, get() { return guardado; }, set(v) {
      guardado = v;
      if (modo === 'sem' || !v) return;
      const deVerdade = v.estado;
      const conta = { 'dona-tablet': { uid: 'u1' }, 'dona-celular': { uid: 'u1', marca: 'u1' }, 'so-le': { uid: 'u1', marca: 'u1' }, observador: { uid: 'u2', marca: 'u1' } }[modo];
      v.disponivel = () => true;
      v.estado = function () { return Object.assign({}, deVerdade(), { entrada: { uid: conta.uid, email: 'prova@exemplo' }, uidDona: conta.marca || null, celular: !!conta.marca }); };
      v.celularDaDona = () => modo === 'dona-celular';
      v.tokenParaIA = () => Promise.resolve('token-falso-da-prova');
    } });
  });
  await pag.setViewport({ width: 1280, height: 900 });
  await H.abrirApp(pag, amb.ORIGEM);
  await voltarAoInicio(pag);

  // ================================================================
  secao('1. No tablet: o cartão, "Agora não", nada sem Confirmar, o Confirmar e o Desfazer');
  await modo(pag, 'dona-tablet', 1280, 900);
  const inicio = await banco(pag);
  const antesSo = await soBanco(pag);
  await clicar(pag, '#abrir-assistente');
  await esperar('a janela abriu', () => aberta(pag, 'modal-assistente'), v => v === true, 10000);
  const remarcar = ferramentas([['propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'al1', nome_dito: 'Zélia', data: '2026-11-19', hora: '15:30', nova_data: '2026-11-19', nova_hora: '17:30' })] }]]);
  await perguntar(pag, 'a da Zélia de quinta passa para 17h30', [remarcar, texto('Preparei o cartão: confira e toque em Confirmar.')]);
  conf('o pedido de quem grava leva as 20 ferramentas (16 de leitura e as de proposta)', [falso.pedidos[0].tools.length, falso.pedidos[0].tools.slice(16).map(t => t.name).join(',')], [20, 'propor_aulas,propor_relato,propor_feedback,buscar_assunto']);
  const c1 = await pag.evaluate(s => { const c = document.querySelector(s); return c && {
    titulo: c.querySelector('.ass-linha-titulo').textContent, entendido: c.querySelector('.ass-entendido').textContent,
    antesDepois: Array.from(c.querySelectorAll('.ass-antes-depois dd')).map(d => d.textContent), dinheiro: (c.querySelector('.ass-dinheiro') || {}).textContent,
    botoes: Array.from(c.querySelectorAll('button')).map(b => b.textContent) }; }, ultimoCartao);
  conf('o cartão: o que muda, o Entendi, o antes e o depois, o dinheiro e os dois botões', c1, {
    titulo: 'Remarcar Zélia, qui 19/11: de 15:30 para 17:30', entendido: 'Entendi: quinta, 19/11, 15:30, Zélia.',
    antesDepois: ['qui 19/11, 15:30 (1h), agendada', 'qui 19/11, 17:30 (1h)'], dinheiro: 'O valor do mês não muda.', botoes: ['Agora não', 'Confirmar'] });
  conf('com o cartão aberto, NADA gravou: o banco e a fila iguais', (await banco(pag)) === inicio, true);
  await clicar(pag, ultimoCartao + ' [id^="ass-agora-nao-"]');
  conf('"Agora não": o cartão diz que nada foi gravado, e o banco e a fila seguem iguais', [await pag.evaluate(s => document.querySelector(s).querySelector('.ass-estado').textContent, ultimoCartao), (await banco(pag)) === inicio], ['Nada foi gravado.', true]);
  await perguntar(pag, 'remarca então', [remarcar, texto('Confira e toque em Confirmar.')]);
  conf('a pergunta seguinte conta ao modelo que ela tocou em Agora não', /Cartões anteriores: Remarcar Zélia[^|]*Agora não/.test(JSON.stringify(falso.pedidos[0].messages.filter(m => m.role === 'user').slice(-1))), true);
  await clicar(pag, ultimoCartao + ' [id^="ass-confirmar-"]');
  await esperar('gravou', () => soBanco(pag), v => v !== antesSo, 10000);
  await esperar('o cartão diz feito (só depois de gravar)', () => estadoDoCartao(pag, ultimoCartao), v => v === 'feito', 10000);
  const depoisRemarcar = await soBanco(pag);
  const esperado = await pag.evaluate(s => { const d = JSON.parse(s); Core.aplicarEdicaoAula(d, 's1@2026-11-19', { data: '2026-11-19', hora: '17:30', duracaoMin: 60 }, 'esta'); return JSON.stringify(d); }, antesSo);
  conf('o Confirmar gravou exatamente o Remarcar da tela (Core.aplicarEdicaoAula só nesta aula)', depoisRemarcar === esperado, true);
  conf('o cartão diz que gravou', await pag.evaluate(s => document.querySelector(s).querySelector('.ass-estado').textContent, ultimoCartao), 'Gravado. O aviso de baixo traz o Desfazer por alguns segundos.');
  const aviso = await pag.evaluate(() => {
    const t = document.querySelector('#aviso-texto'), b = document.querySelector('#aviso-acao');
    const r = b.getBoundingClientRect();
    const topo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return [t.textContent, b.textContent, !!topo && (topo === b || b.contains(topo))];
  });
  conf('o aviso diz o que foi feito e tem o Desfazer, POR CIMA da janela do assistente', aviso, ['Aula de Zélia remarcada para qui 19/11, 17:30 (1h).', 'Desfazer', true]);
  await desfazerPeloAviso(pag);
  conf('o Desfazer volta o banco ao estado EXATO de antes', (await soBanco(pag)) === antesSo, true);
  await clicar(pag, '#abrir-assistente');
  conf('reaberto, o cartão diz que foi desfeito', await pag.evaluate(s => document.querySelector(s).querySelector('.ass-estado').textContent, ultimoCartao), 'Desfeito: ficou como estava antes.');

  // ================================================================
  secao('2. Toque duplo em Confirmar grava uma vez só');
  const criar = ferramentas([['propor_aulas', { itens: [item({ acao: 'criar_aula', alunoId: 'al2', nome_dito: 'Bruno', data: '2026-11-21', hora: '10:00' })] }]]);
  /* A trava de 400 ms (lente do #213, 5): o toque no Confirmar logo depois
   * de a resposta chegar não grava; passado o tempo, grava. */
  falso.fila = [criar, texto('Confira.')]; falso.pedidos = [];
  const antesTrava = await soBanco(pag);
  await pag.evaluate(() => { const c = document.querySelector('#ass-texto'); c.value = 'marca aula'; c.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('#ass-perguntar').click(); });
  await esperar('a resposta chegou', () => pag.evaluate(() => !document.querySelector('#ass-esperando') && !!document.querySelector('#ass-conversa > .ass-vez:last-of-type .ass-proposta [id^="ass-confirmar-"]')), v => v === true, 15000);
  await pag.evaluate(s => document.querySelector(s + ' [id^="ass-confirmar-"]').click(), ultimoCartao);
  await pausa(300);
  conf('5: o Confirmar tocado nos primeiros 400 ms depois da resposta não grava', [await estadoDoCartao(pag, ultimoCartao), (await soBanco(pag)) === antesTrava], ['aberto', true]);
  conf('9: com o cartão aberto, o Perguntar fica secundário (o principal é o Confirmar)', await pag.evaluate(() => document.querySelector('#ass-perguntar').classList.contains('principal')), false);
  /* O cartão trocado (lente do #213, 4): o pedido seguinte traz um cartão
   * novo, e o de antes perde os botões. */
  const nAntes = await pag.evaluate(() => document.querySelectorAll('.ass-proposta').length);
  await perguntar(pag, 'não, às 11:00', [ferramentas([['propor_aulas', { itens: [item({ acao: 'criar_aula', alunoId: 'al2', nome_dito: 'Bruno', data: '2026-11-21', hora: '11:00' })] }]]), texto('Confira.')]);
  conf('4: o cartão de antes virou "trocado", sem Confirmar, e só o novo confirma', await pag.evaluate(n => { const cs = document.querySelectorAll('.ass-proposta'); const velho = cs[n - 1];
    return [velho.getAttribute('data-estado'), !!velho.querySelector('[id^="ass-confirmar-"]'), Array.from(cs).filter(c => c.querySelector('[id^="ass-confirmar-"]')).length]; }, nAntes), ['substituido', false, 1]);
  await clicar(pag, ultimoCartao + ' [id^="ass-agora-nao-"]');
  await perguntar(pag, 'marca uma aula com o Bruno sábado às 10h', [criar, texto('Confira e toque em Confirmar.')]);
  conf('o cartão da aula nova, com o dinheiro do core', await pag.evaluate(s => [document.querySelector(s + ' .ass-linha-titulo').textContent, document.querySelector(s + ' .ass-dinheiro').textContent], ultimoCartao),
    ['Marcar aula de Bruno, sáb 21/11, 10:00 (1h)', 'O valor de novembro aumenta R$ 150,00.']);
  /* O que só a trava segura (lente do #213, 7): sem ela, o segundo toque
   * chega à reconferência, que acha a aula recém-criada e anuncia "a agenda
   * mudou". Contam os anúncios da região viva e as aulas criadas. */
  await pag.evaluate(() => { window.__anuncios = []; const r = document.querySelector('#plan-anuncio');
    new MutationObserver(() => { if (r.textContent) window.__anuncios.push(r.textContent); }).observe(r, { childList: true, characterData: true, subtree: true }); });
  await pag.evaluate(s => { const b = document.querySelector(s + ' [id^="ass-confirmar-"]'); b.click(); b.click(); }, ultimoCartao);
  await pausa(1500);
  const novas = await pag.evaluate(() => Store.carregar().then(b => b.aulas.filter(a => a.alunoId === 'al2' && a.data === '2026-11-21' && a.hora === '10:00').length));
  const anuncios = await pag.evaluate(() => window.__anuncios.slice());
  prop('dois toques seguidos no Confirmar: UMA aula nova (' + novas + '), e o segundo toque nem chega à reconferência (' + anuncios.join(' | ') + ')',
    novas === 1 && !anuncios.some(a => /A agenda mudou/.test(a)), V_DUPLO);
  if (MODO === V_DUPLO) { await H.fim(amb)(); return; }
  await pag.evaluate(() => { const f = document.querySelector('#modal-assistente .fechar'); if (f) f.click(); });
  await pausa(300);

  // ================================================================
  secao('3. No celular da dona: ação declarada, e o registro igual ao da tela');
  await voltarAoInicio(pag);
  await modo(pag, 'dona-celular', 390, 844);
  const antesCel = await soBanco(pag);
  await clicar(pag, '#cel-assistente');
  await perguntar(pag, 'cancela a do Bruno de hoje', [ferramentas([['propor_aulas', { itens: [item({ acao: 'cancelar', alunoId: 'al2', nome_dito: 'Bruno', data: HOJE, hora: '08:00', cobranca: 'perguntar' })] }]]), texto('O cartão pergunta a cobrança.')]);
  const pergunta = await pag.evaluate(s => { const c = document.querySelector(s); return { opcoes: Array.from(c.querySelectorAll('.ass-opcao')).map(o => o.querySelector('.ass-opcao-nome').textContent + ': ' + o.querySelector('.ass-opcao-dinheiro').textContent),
    confirmar: c.querySelector('[id^="ass-confirmar-"]').disabled, declarado: c.querySelector('[id^="ass-confirmar-"]').getAttribute('data-acao-celular'),
    soltos: Array.from(c.querySelectorAll('button')).filter(b => !b.closest('[data-acao-celular]')).map(b => (b.querySelector('.ass-opcao-nome') || b).textContent.trim()) }; }, ultimoCartao);
  conf('"cancela a do Bruno": o cartão pergunta, com as três saídas e o dinheiro de cada uma', pergunta.opcoes,
    ['Cancelada sem cobrança: O valor de novembro diminui R$ 150,00.', 'Cancelada e cobrada: O valor do mês não muda.', 'Falta sem aviso (cobrada): O valor do mês não muda.']);
  conf('sem escolher, o Confirmar fica desligado', pergunta.confirmar, true);
  conf('D6b: o Confirmar é a ação declarada do celular (data-acao-celular="assistente-confirmar")', pergunta.declarado, 'assistente-confirmar');
  conf('os outros botões do cartão não gravam (Agora não e as opções)', pergunta.soltos.sort(), ['Agora não', 'Cancelada e cobrada', 'Cancelada sem cobrança', 'Falta sem aviso (cobrada)'].sort());
  await clicar(pag, ultimoCartao + ' .ass-opcao[data-opcao="sem"]');
  conf('escolhida a saída, nada gravou ainda', (await soBanco(pag)) === antesCel, true);
  await clicar(pag, ultimoCartao + ' [id^="ass-confirmar-"]');
  const gravouCel = await esperar('o celular gravou', () => soBanco(pag), v => v !== antesCel, 8000);
  prop('o Confirmar do celular grava (dentro do comoAcaoDoCelular)', gravouCel.ok, V_ACAO);
  if (MODO === V_ACAO) { await H.fim(amb)(); return; }
  const peloCartao = await soBanco(pag);
  conf('nenhuma caixa de confirmação do sistema no cartão (sem window.confirm)', dialogos.length, 0);
  await esperar('o aviso com Desfazer no celular', () => visivel(pag, '#aviso-acao'), v => v === true, 10000);
  conf('no celular, o aviso com Desfazer fica POR CIMA da janela do assistente', await pag.evaluate(() => {
    const b = document.querySelector('#aviso-acao'); const r = b.getBoundingClientRect();
    const topo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!topo && (topo === b || b.contains(topo)); }), true);
  await desfazerPeloAviso(pag);
  igual('o Desfazer no celular volta ao exato de antes', await soBanco(pag), antesCel);
  await pag.evaluate(() => { const f = document.querySelector('#modal-assistente .fechar'); if (f) f.click(); });
  await pausa(400);
  await clicar(pag, '.cel-bloco[data-aula="b1"]');
  await clicar(pag, '#cel-folha-cancelar');
  await clicar(pag, '#cel-cancelar-sem');
  await esperar('a tela gravou', () => soBanco(pag), v => v !== antesCel, 8000);
  igual('o cancelamento pelo cartão = o "Cancelar sem cobrança" da tela do celular, byte a byte', await soBanco(pag), peloCartao);
  await voltarAoInicio(pag);
  await modo(pag, 'dona-celular', 390, 844);

  await clicar(pag, '#cel-assistente');
  await perguntar(pag, 'hoje com o Bruno foi bem, equações', [ferramentas([['propor_relato', { itens: [{ alunoId: 'al2', nome_dito: 'Bruno', data: HOJE, hora: null, relato_familia: 'Foi bem.', nota_so_minha: '', assuntos: [{ titulo: 'Equações', ref: null }], areas: [] }] }]]), texto('Confira o rascunho.')]);
  conf('o relato aparece como rascunho editável, com o assunto', await pag.evaluate(s => [document.querySelector(s + ' textarea[id^="ass-relato-"]').value, document.querySelector(s + ' textarea[id^="ass-nota-"]').value, Array.from(document.querySelectorAll(s + ' .ass-ficha')).map(b => b.textContent)], ultimoCartao),
    ['Foi bem.', '', ['✓ Equações']]);
  await clicar(pag, ultimoCartao + ' [id^="ass-confirmar-"]');
  await esperar('o relato gravou', () => soBanco(pag), v => v !== antesCel, 8000);
  const relatoCartao = await soBanco(pag);
  await desfazerPeloAviso(pag);
  await pag.evaluate(() => { const f = document.querySelector('#modal-assistente .fechar'); if (f) f.click(); });
  await pausa(400);
  await clicar(pag, '.cel-bloco[data-aula="b1"]');
  await clicar(pag, '#cel-folha-registrar');
  await pag.evaluate(() => { const t = document.querySelector('#cel-relato-texto'); t.value = 'Foi bem.'; t.dispatchEvent(new Event('input', { bubbles: true }));
    const a = document.querySelector('#cel-relato-assunto'); a.value = 'Equações'; a.dispatchEvent(new Event('input', { bubbles: true })); });
  await clicar(pag, '#cel-relato-salvar');
  await esperar('o relato da tela gravou', () => soBanco(pag), v => v !== antesCel, 8000);
  igual('o relato pelo cartão = o "Registrar como foi" da tela do celular, byte a byte', await soBanco(pag), relatoCartao);
  await voltarAoInicio(pag);
  await modo(pag, 'dona-celular', 390, 844);

  await clicar(pag, '#cel-assistente');
  await perguntar(pag, 'marca aula com o Bruno sábado às 10h', [criar, texto('Confira.')]);
  await clicar(pag, ultimoCartao + ' [id^="ass-confirmar-"]');
  await esperar('a aula nova gravou', () => soBanco(pag), v => v !== antesCel, 8000);
  const criarCartao = await soBanco(pag);
  await desfazerPeloAviso(pag);
  await pag.evaluate(() => { const f = document.querySelector('#modal-assistente .fechar'); if (f) f.click(); });
  await pausa(400);
  await clicar(pag, '#cel-marcar-aula');
  await pag.evaluate(() => {
    const s = document.querySelector('#cel-aula-aluno'); s.value = 'al2'; s.dispatchEvent(new Event('change', { bubbles: true }));
    const d = document.querySelector('#cel-aula-data'); d.value = '21/11/2026'; d.dispatchEvent(new Event('input', { bubbles: true }));
    const h = document.querySelector('#cel-aula-hora'); h.value = '10:00'; h.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await clicar(pag, '#cel-aula-salvar');
  await esperar('a aula da tela gravou', () => soBanco(pag), v => v !== antesCel, 8000);
  igual('a aula nova pelo cartão = o "Marcar aula" da tela do celular (fora o id novo)', semIdsNovos(await soBanco(pag)), semIdsNovos(criarCartao));
  await voltarAoInicio(pag);

  // ================================================================
  secao('4. O celular que só lê e o observador');
  await modo(pag, 'so-le', 390, 844);
  const antesLe = await banco(pag);
  await clicar(pag, '#cel-assistente');
  await perguntar(pag, 'o Bruno faltou hoje', [ferramentas([['propor_aulas', { itens: [item({ acao: 'falta', alunoId: 'al2', nome_dito: 'Bruno', data: HOJE })] }]]), texto('Isso se faz no tablet.')]);
  conf('o pedido do celular que só lê leva só as 16 de leitura', falso.pedidos[0].tools.length, 16);
  conf('a proposta forjada volta ao modelo como erro, e nenhum cartão aparece', [falso.pedidos[1].messages[2].content[0].is_error, await pag.evaluate(() => document.querySelectorAll('.ass-proposta').length)], [true, 0]);
  conf('o celular que só lê: nada gravou (o banco e a fila iguais)', (await banco(pag)) === antesLe, true);
  await pag.evaluate(() => { const f = document.querySelector('#modal-assistente .fechar'); if (f) f.click(); });
  await modo(pag, 'observador', 390, 844);
  conf('o observador não vê o assistente', [await visivel(pag, '#cel-assistente'), await visivel(pag, '#abrir-assistente')], [false, false]);

  // ================================================================
  secao('5. O transbordo do cartão a 360, 390 e 412 px, letra normal e 130%');
  // a aula de hoje do Bruno já tem um relato: o cartão mostra o antigo à parte
  await pag.evaluate(async () => { const b = await Store.carregar(); b.aulas.find(a => a.id === 'b1').notaTexto = 'Relato antigo da família.'; await Store.salvar(b); });
  await modo(pag, 'dona-celular', 390, 844);
  const antesT = await banco(pag);
  await clicar(pag, '#cel-assistente');
  await perguntar(pag, 'cancela a semana que vem e registra o Bruno de hoje', [ferramentas([
    ['propor_aulas', { itens: [item({ acao: 'cancelar', alunoId: 'al1', nome_dito: 'Zélia', data: '2026-11-26', cobranca: 'perguntar' }), item({ acao: 'cancelar', alunoId: 'al2', nome_dito: 'Bruno', data: '2026-11-20', cobranca: 'perguntar' }), item({ acao: 'mudar_duracao', alunoId: 'al1', nome_dito: 'Zélia', data: '2026-11-19', duracao_min: 90 })] }],
    ['propor_relato', { itens: [{ alunoId: 'al2', nome_dito: 'Bruno', data: HOJE, hora: null, relato_familia: 'Trabalhamos equações do primeiro grau com problemas de enunciado longo; foi muito bem e terminou a lista.', nota_so_minha: 'Combinar revisão antes da prova.', assuntos: [{ titulo: 'Equações do primeiro grau com problemas', ref: null }], areas: ['enunciado', 'ansiedade'] }] }]
  ]), texto('Confira o cartão.')]);
  /* Lente da romul-ac, 9: a escolha da cobrança é POR LINHA (não há mais a escolha do conjunto). */
  conf('um cartão só, com as quatro linhas, a pergunta da cobrança em CADA uma das duas canceladas, e "Confirmar tudo"', await pag.evaluate(s => {
    const c = document.querySelector(s); return [c.querySelectorAll('.ass-linha').length, c.querySelectorAll('.ass-opcoes').length, !!c.querySelector('.ass-pergunta-conjunto'), c.querySelector('[id^="ass-confirmar-"]').textContent]; }, ultimoCartao),
    [4, 2, false, 'Confirmar tudo']);
  await clicar(pag, ultimoCartao + ' .ass-marca');
  conf('tirar o ✓ de uma linha muda o botão', await pag.evaluate(s => document.querySelector(s + ' [id^="ass-confirmar-"]').textContent, ultimoCartao), 'Confirmar 3 de 4');
  await clicar(pag, ultimoCartao + ' .ass-marca');
  conf('o relato: o texto antigo à parte, só para ler, e o campo só com o novo, com teto de tamanho', await pag.evaluate(s => {
    const c = document.querySelector(s); const t = c.querySelector('textarea[id^="ass-relato-"]');
    return [(c.querySelector('.ass-texto-antigo[data-antigo="relato"] p') || {}).textContent, t.value.indexOf('Relato antigo') < 0, t.getAttribute('maxlength')]; }, ultimoCartao),
    ['Relato antigo da família.', true, '2000']);
  conf('o campo do rascunho cresce com o texto (sem barra de rolagem para duas linhas)', await pag.evaluate(s => {
    const t = document.querySelector(s + ' textarea[id^="ass-relato-"]'); t.value = 'linha\nlinha\nlinha\nlinha\nlinha'; t.dispatchEvent(new Event('input', { bubbles: true }));
    return t.scrollHeight <= t.clientHeight + 4; }, ultimoCartao), true);
  const falhas = [];
  for (const largura of [360, 390, 412]) {
    for (const letra of ['100%', '130%']) {
      await pag.setViewport({ width: largura, height: 800, hasTouch: true });
      await pag.evaluate(l => { document.documentElement.style.fontSize = l; }, letra);
      await pausa(300);
      (await transbordo(pag, '#modal-assistente .modal')).forEach(f => falhas.push(largura + '/' + letra + ': ' + f));
      /* O Confirmar à vista com o começo do cartão na tela (preso ao pé da
       * área que rola), e não lá no fim de um cartão longo. */
      const vis = await pag.evaluate(s => {
        const c = document.querySelector(s); c.scrollIntoView({ block: 'start' });
        const b = c.querySelector('[id^="ass-confirmar-"]'); const r = b.getBoundingClientRect();
        const topo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return r.bottom <= window.innerHeight + 1 && r.top >= 0 && !!topo && (topo === b || b.contains(topo)); }, ultimoCartao);
      if (!vis) falhas.push(largura + '/' + letra + ': o Confirmar não fica à vista com o cartão aberto do começo');
    }
  }
  await pag.evaluate(() => { document.documentElement.style.fontSize = ''; });
  conf('a 360, 390 e 412 px, letra normal e 130%: nada passa da borda e todo alvo tem 48 px (' + (falhas.slice(0, 6).join(' | ') || 'nenhuma falha') + ')', falhas.length, 0);
  await pag.evaluate(() => { const d = document.createElement('div'); d.id = 'largo-de-prova'; d.style.width = '600px'; d.style.height = '10px'; document.querySelector('.ass-proposta').appendChild(d); });
  conf('CONTROLE: um elemento de 600 px no cartão é acusado', (await transbordo(pag, '#modal-assistente .modal')).some(f => /largo-de-prova|rola de lado|passa da borda/.test(f)), true);
  conf('o cartão aberto em todas as medidas: nada gravou', (await banco(pag)) === antesT, true);

  // ================================================================
  secao('6. Lentes da romul-ac: o aviso da saída, o lote que poupa e a trava de concorrência do Confirmar');
  await pag.evaluate(() => { const f = document.querySelector('#modal-assistente .fechar'); if (f) f.click(); });
  /* Novembro do Bruno com pagamento marcado: a aula de hoje (b1) passa a ser poupada pelo lote; a de 20/11 (b2), futura, não. */
  await pag.evaluate(async d => { const b = JSON.parse(JSON.stringify(d)); b.pagamentos = [{ id: 'pgn', alunoId: 'al2', mes: '2026-11', pagoEm: '2026-11-10', valor: 300 }]; await Store.salvar(b); }, DB);
  await modo(pag, 'dona-tablet', 1280, 900);
  await clicar(pag, '#abrir-assistente');
  await perguntar(pag, 'cancela a do Bruno do dia 20', [ferramentas([['propor_aulas', { itens: [item({ acao: 'cancelar', alunoId: 'al2', nome_dito: 'Bruno', data: '2026-11-20', hora: '17:30', cobranca: 'perguntar' })] }]]), texto('O cartão pergunta a cobrança.')]);
  const avisoDaSaida = () => pag.evaluate(s => Array.from(document.querySelectorAll(s + ' .ass-opcao')).map(o => o.getAttribute('data-opcao') + '=' + Array.from(o.querySelectorAll('.ass-opcao-aviso')).map(x => x.textContent).join('/')), ultimoCartao);
  conf('2: na pergunta, o aviso do mês pago está no botão da saída que muda o valor', await avisoDaSaida(),
    ['sem=Novembro de 2026 já tem pagamento marcado: o selo do mês vai mudar.', 'com=']);
  await clicar(pag, ultimoCartao + ' .ass-opcao[data-opcao="sem"]');
  conf('2: escolhida a saída, o aviso do dinheiro continua à vista', await visivel(pag, ultimoCartao + ' .ass-opcao[data-opcao="sem"] .ass-opcao-aviso'), true);
  /* 7: a trava de concorrência. Com o cartão aberto e a saída escolhida, o outro aparelho registra a aula de 20/11
   * (ela passa a ter relato). Chega pelo caminho de verdade: Store.aplicarRecebidos, que avisa o app (registrosChegaram). */
  const antesConc = await soBanco(pag);
  const b2 = JSON.parse(antesConc).aulas.find(a => a.id === 'b2');
  await pag.evaluate(async aula => {
    const quando = new Date().toISOString();
    await Store.aplicarRecebidos([{ id: 'aula:b2', tipo: 'aula', dados: Object.assign({}, aula, { notaTexto: 'Relato escrito no outro aparelho.' }), atualizadoEm: quando, apagadoEm: null,
      aparelho: 'apOutroTablet', esquema: 1, servidorEm: quando, updateTime: quando, nome: 'x/registros/aula:b2' }]);
  }, b2);
  const chegou = await esperar('a mudança do outro aparelho chegou', () => soBanco(pag), v => JSON.parse(v).aulas.find(a => a.id === 'b2').notaTexto === 'Relato escrito no outro aparelho.', 8000);
  conf('7: a mudança chegou pelo caminho de verdade (o relato do outro aparelho está no banco)', chegou.ok, true);
  const depoisDaChegada = await soBanco(pag);
  await clicar(pag, ultimoCartao + ' [id^="ass-confirmar-"]');
  await pausa(800);
  const estadoConc = await estadoDoCartao(pag, ultimoCartao);
  const b2Depois = JSON.parse(await soBanco(pag)).aulas.find(a => a.id === 'b2');
  prop('7: a agenda mudou com o cartão aberto: o cartão fica "mudou" (' + estadoConc + ') e a aula não foi cancelada (' + b2Depois.status + ')',
    estadoConc === 'mudou' && b2Depois.status === 'realizada' && (await soBanco(pag)) === depoisDaChegada, V_CONF);
  if (MODO === V_CONF) { await H.fim(amb)(); return; }
  conf('7: o cartão diz que a agenda mudou e nada foi gravado', await pag.evaluate(s => document.querySelector(s).textContent.indexOf('A agenda mudou desde a proposta, e nada foi gravado.') >= 0, ultimoCartao), true);
  /* 1: o lote. Hoje (b1, novembro pago) e 20/11 (b2, agora registrada) ficam de fora; a quinta da Zélia entra. */
  await perguntar(pag, 'cancela as do Bruno de hoje e do dia 20 e a da Zélia de quinta, sem cobrar', [ferramentas([['propor_aulas', { itens: [
    item({ acao: 'cancelar', alunoId: 'al2', nome_dito: 'Bruno', data: HOJE, hora: '08:00', cobranca: 'sem' }),
    item({ acao: 'cancelar', alunoId: 'al2', nome_dito: 'Bruno', data: '2026-11-20', hora: '17:30', cobranca: 'sem' }),
    item({ acao: 'cancelar', alunoId: 'al1', nome_dito: 'Zélia', data: '2026-11-19', hora: '15:30', cobranca: 'sem' })] }]]), texto('Confira.')]);
  conf('1: no lote, as linhas poupadas ficam de fora com o motivo escrito, sem marca, e o botão conta só a que entra', await pag.evaluate(s => {
    const c = document.querySelector(s);
    return [Array.from(c.querySelectorAll('.ass-linha')).map(l => (l.getAttribute('data-poupada') || 'entra') + ':' + ((l.querySelector('.ass-poupada') || {}).textContent || '')),
      c.querySelectorAll('.ass-marca[role="checkbox"]').length, c.querySelector('[id^="ass-confirmar-"]').textContent]; }, ultimoCartao),
    [['fora:Fica de fora: de mês com pagamento.', 'fora:Fica de fora: já registrada.', 'entra:'], 1, 'Confirmar 1 de 3']);
  const antesLote = await soBanco(pag);
  await clicar(pag, ultimoCartao + ' [id^="ass-confirmar-"]');
  const gravouLote = await esperar('o lote gravou', () => soBanco(pag), v => v !== antesLote, 8000);
  const dLote = JSON.parse(await soBanco(pag)), aLote = JSON.parse(antesLote);
  conf('1: confirmado, só a da Zélia foi cancelada; as do Bruno saem iguais byte a byte', [gravouLote.ok, dLote.aulas.find(a => a.id === 's1@2026-11-19').status,
    ['b1', 'b2'].every(id => JSON.stringify(dLote.aulas.find(a => a.id === id)) === JSON.stringify(aLote.aulas.find(a => a.id === id)))], [true, 'cancelada', true]);
  await desfazerPeloAviso(pag);
  conf('o Desfazer volta o lote', (await soBanco(pag)) === antesLote, true);
  /* 1: a linha só, de mês pago: segue, com o destaque antes do Confirmar. */
  await perguntar(pag, 'o Bruno faltou hoje, pode cobrar', [ferramentas([['propor_aulas', { itens: [item({ acao: 'falta', alunoId: 'al2', nome_dito: 'Bruno', data: HOJE, hora: '08:00', cobranca: 'com' })] }]]), texto('Confira.')]);
  conf('1: uma linha só, de mês com pagamento: o destaque, e o Confirmar ligado', await pag.evaluate(s => { const c = document.querySelector(s);
    return [(c.querySelector('.ass-poupada') || {}).textContent, c.querySelector('.ass-linha').getAttribute('data-poupada'), c.querySelector('[id^="ass-confirmar-"]').disabled]; }, ultimoCartao),
    ['Este mês já tem pagamento marcado.', 'destaque', false]);
  await clicar(pag, ultimoCartao + ' [id^="ass-agora-nao-"]');

  conf('nenhum pedido saiu para fora do servidor da prova', paraFora.length, 0);
  conf('nenhum erro de página', pag.errosDePagina ? pag.errosDePagina.slice(0, 3).join(' | ') : '', '');
  await H.fim(amb)();
})().catch(H.fim(amb));
