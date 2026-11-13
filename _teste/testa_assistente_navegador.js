/* testa_assistente_navegador.js (projeto IA no app, fase 3: o assistente só de leitura)
 *
 * O assistente no aplicativo de verdade (Chrome, puppeteer-core), com alunos
 * SINTÉTICOS e o /api/ia INTERCEPTADO por um falso que devolve um roteiro de
 * tool_use: nenhuma chamada à API de verdade, nenhuma conta real. A conta da
 * nuvem é trocada por uma sessão de mentira (Nuvem.estado e
 * Nuvem.tokenParaIA, postos antes do app.js ler), e toda rede para fora do
 * servidor da prova é cortada e contada.
 *
 * O que prova:
 *   0. quem vê o botão: sem conta, ninguém; o observador de outra conta, não;
 *      a dona no tablet, no celular dela e no celular que só lê, sim;
 *   1. no tablet: os exemplos na primeira vez (e somem depois), o foco no
 *      campo, o Perguntar desligado sem texto, o laço com duas ferramentas
 *      (listar_aulas e preparar_whatsapp), o content do modelo de volta
 *      INTACTO, o "Entendi: terça, 17/11." e o cartão do WhatsApp com o texto,
 *      que só abre com o toque dela (nada abre nem sai sozinho);
 *   2. os cartões de ligar e do mapa, e o de contato (o número só na tela);
 *   3. o teto de 5 voltas, com a frase própria e a pergunta de volta no campo;
 *   4. os erros: ocupado (com "Tentar de novo") e sem_permissao (sem ele);
 *   5. no celular da dona e no que só lê: o ícone na linha do dia e o fluxo;
 *   6. NADA GRAVOU: o banco do aparelho e a fila de registros iguais antes e
 *      depois de tudo;
 *   7. a trava de transbordo da janela (com conversa e cartões) e da linha do
 *      dia, a 360, 390 e 412 px, letra normal e 130%.
 *
 * Porta 8974. O service worker é contornado.
 */
'use strict';
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8974;
const amb = H.criarAmbiente(PORTA, 'perfil_assistente_nav', {});
const HOJE = '2026-11-16';

const DB = {
  versao: 1, resumos: [], pagamentos: [],
  ajustes: { cargaInicial: true, versaoVista: '9.9.9', ultimoAnoLetivoAtualizado: 2026, pagamentosDesde: '2026-10' },
  alunos: [
    { id: 'al1', nome: 'Zélia Sobrenomeum', ativo: true, cor: '#2E7D6B', telefone: '(21) 98765-4321', responsavel: 'Responsável Sintético',
      endereco: 'Rua Sintética, 10', local: 'casa', precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 100 }], mapeamentos: [], obs: '' },
    { id: 'al2', nome: 'Bruno Sobrenomedois', ativo: true, cor: '#1F3A5F', telefone: '', precos: [], mapeamentos: [], obs: '' }
  ],
  series: [],
  aulas: [
    { id: 'a1', alunoId: 'al1', data: HOJE, hora: '15:00', duracaoMin: 60, status: 'realizada', notaTexto: '', anexos: [], temas: [], areas: [] },
    // ontem, sem registro: o aviso do alto (o selinho) divide a linha do dia com o ícone
    { id: 'a0', alunoId: 'al2', data: '2026-11-15', hora: '10:00', duracaoMin: 60, status: 'realizada', notaTexto: '', anexos: [], temas: [], areas: [] },
    { id: 'a2', alunoId: 'al2', data: '2026-11-18', hora: '09:00', duracaoMin: 60, status: 'realizada', notaTexto: '', anexos: [], temas: [], areas: [] }
  ]
};

/* O falso do endpoint: responde pela fila; guarda os pedidos. */
const falso = { fila: [], pedidos: [], sempre: null };
let contaUso = 0;
function usage() { contaUso++; return { input_tokens: 12, output_tokens: 30, cache_read_input_tokens: 3000, cache_creation_input_tokens: 0 }; }
function ferramentas(chamadas, sig) {
  return { ok: true, resposta: { id: 'msg_f', model: 'claude-sonnet-5-5', stop_reason: 'tool_use', usage: usage(),
    content: [{ type: 'thinking', thinking: '', signature: sig || ('sig-' + Math.random().toString(36).slice(2)) }]
      .concat(chamadas.map((c, i) => ({ type: 'tool_use', id: 'toolu_' + i + '_' + c[0], name: c[0], input: c[1] }))) } };
}
function texto(t) {
  return { ok: true, resposta: { id: 'msg_t', model: 'claude-sonnet-5-5', stop_reason: 'end_turn', usage: usage(),
    content: [{ type: 'thinking', thinking: '', signature: 'sig-fim' }, { type: 'text', text: t }] } };
}

const aberta = (pag, id) => pag.evaluate(i => { const m = document.getElementById(i); return !!m && m.classList.contains('aberto'); }, id);
const visivel = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); if (!e || e.hidden) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }, sel);
async function clicar(pag, sel) {
  await esperar('à vista: ' + sel, () => visivel(pag, sel), v => v === true, 15000);
  await pag.evaluate(s => document.querySelector(s).click(), sel);
  await pausa(150);
}
async function perguntar(pag, frase) {
  await pag.evaluate(f => { const c = document.querySelector('#ass-texto'); c.value = f; c.dispatchEvent(new Event('input', { bubbles: true })); }, frase);
  await clicar(pag, '#ass-perguntar');
  await esperar('a resposta chegou', () => pag.evaluate(() => !document.querySelector('#ass-esperando')), v => v === true, 15000);
}
const banco = pag => pag.evaluate(() => Promise.all([Store.carregar(), Store.lerRegistros()]).then(r => JSON.stringify(r[0]) + '|' + JSON.stringify(r[1])));
async function modo(pag, nome, largura, altura) {
  await pag.setViewport({ width: largura, height: altura, hasTouch: largura < 500 });
  await pag.evaluate(n => sessionStorage.setItem('modo-da-prova', n), nome);
  await pag.reload({ waitUntil: 'networkidle0' });
  await esperar('o app abriu (' + nome + ')', () => pag.evaluate(() => typeof Store === 'object' && !!document.querySelector('#versao-app')), v => v === true, 20000);
  await pausa(1500);
  await pag.evaluate(() => { const b = document.querySelector('#entendi-novidades'); if (b && document.querySelector('#modal-novidades.aberto')) b.click(); });
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
  pag.on('request', req => {
    const u = req.url();
    if (u.indexOf('/api/ia') >= 0) {
      let corpo = null; try { corpo = JSON.parse(req.postData() || 'null'); } catch (e) { corpo = 'nao-json'; }
      falso.pedidos.push({ corpo, autorizacao: req.headers().authorization || '' });
      const vez = falso.sempre ? falso.sempre() : falso.fila.shift() || texto('(fila vazia)');
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(vez) }).catch(() => {});
      return;
    }
    if (u.indexOf('http://127.0.0.1:' + PORTA) !== 0 && !u.startsWith('data:') && !u.startsWith('blob:')) { paraFora.push(u); req.abort().catch(() => {}); return; }
    req.continue().catch(() => {});
  });
  /* A conta de mentira, posta no instante em que o nuvem.js publica o Nuvem
   * (antes de o app.js ler), conforme o modo da rodada. E o window.open
   * contado: nada pode abrir sozinho. */
  await pag.evaluateOnNewDocument(() => {
    window.__aberturas = [];
    const abrir = window.open;
    window.open = function (u) { window.__aberturas.push(String(u)); return null; };
    document.addEventListener('click', ev => { const a = ev.target.closest && ev.target.closest('a[href]'); if (a) { window.__aberturas.push('toque ' + a.getAttribute('href')); ev.preventDefault(); } }, true);
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
  await pag.evaluate(async d => { await Store.salvar(d); }, DB);

  // ================================================================
  secao('0. Quem vê o botão do assistente');
  await modo(pag, 'sem', 1280, 900);
  conf('sem a conta da nuvem: o tablet não mostra o ícone', await visivel(pag, '#abrir-assistente'), false);
  await modo(pag, 'observador', 390, 844);
  conf('(arranjo) o observador está no modo celular', await pag.evaluate(() => document.body.classList.contains('modo-celular')), true);
  conf('o observador de outra conta: nem no alto do tablet nem na linha do dia', [await visivel(pag, '#abrir-assistente'), await visivel(pag, '#cel-assistente')], [false, false]);
  await modo(pag, 'so-le', 390, 844);
  conf('o celular que só lê, com a conta: tem o ícone na linha do dia (perguntar é ler)', await visivel(pag, '#cel-assistente'), true);
  await modo(pag, 'dona-celular', 390, 844);
  conf('o celular da dona: o ícone fica na linha do dia, antes do Vagos', await pag.evaluate(() => { const b = document.querySelector('#cel-assistente'); return !!b && b.nextElementSibling && b.nextElementSibling.id; }), 'cel-abrir-vagos');
  conf('o ícone tem nome para o leitor de tela e o alvo de 48 px', await pag.evaluate(() => { const b = document.querySelector('#cel-assistente'); const r = b.getBoundingClientRect(); return [b.getAttribute('aria-label'), r.width >= 48 && r.height >= 48]; }), ['Perguntar ao assistente', true]);
  await modo(pag, 'dona-tablet', 1280, 900);
  conf('a dona no tablet: o ícone no alto, ao lado do olho', await visivel(pag, '#abrir-assistente'), true);
  const antes = await banco(pag);

  // ================================================================
  secao('1. No tablet: os exemplos, o laço com duas ferramentas, o Entendi e o cartão');
  await clicar(pag, '#abrir-assistente');
  await esperar('a janela abriu', () => aberta(pag, 'modal-assistente'), v => v === true, 10000);
  conf('o foco no campo; o Perguntar desligado sem texto', await pag.evaluate(() => [document.activeElement && document.activeElement.id, document.querySelector('#ass-perguntar').disabled]), ['ass-texto', true]);
  conf('na primeira vez, três exemplos curtos', await pag.evaluate(() => Array.from(document.querySelectorAll('.ass-exemplo')).map(b => b.textContent)),
    ['O que eu tenho amanhã?', 'Quem não pagou outubro?', 'Avisa a mãe do João que vou atrasar 10 min']);
  await clicar(pag, '.ass-exemplo');
  conf('tocar no exemplo põe a frase no campo e liga o Perguntar', await pag.evaluate(() => [document.querySelector('#ass-texto').value, document.querySelector('#ass-perguntar').disabled]), ['O que eu tenho amanhã?', false]);
  const primeira = ferramentas([['listar_aulas', { inicio: '2026-11-17', fim: '2026-11-17', alunoId: null }], ['preparar_whatsapp', { alunoId: 'al1', texto: 'Olá! Vou atrasar 10 minutos para a aula de Zélia.' }]], 'sig-primeira');
  falso.fila = [primeira, texto('Amanhã você não tem aula.\nPreparei a mensagem: é só tocar em Abrir no WhatsApp.')];
  falso.pedidos = [];
  await clicar(pag, '#ass-perguntar');
  await esperar('a resposta chegou', () => pag.evaluate(() => !document.querySelector('#ass-esperando') && !!document.querySelector('.ass-vez')), v => v === true, 15000);
  const p0 = falso.pedidos[0] && falso.pedidos[0].corpo, p1 = falso.pedidos[1] && falso.pedidos[1].corpo;
  conf('dois pedidos ao endpoint, na rota assistente, com o login e as 16 ferramentas', [falso.pedidos.length, p0.rota, falso.pedidos[0].autorizacao, p0.tools.length], [2, 'assistente', 'Bearer token-falso-da-prova', 16]);
  conf('o pedido leva o agora pelo relógio da tela (segunda, 16/11/2026, 11h) e os alunos só pelo primeiro nome', [/Agora: segunda-feira, 16\/11\/2026 \(2026-11-16\), 11:/.test(p0.messages[0].content[0].text), /Sobrenome/.test(JSON.stringify(p0)), /98765|Rua Sintética/.test(JSON.stringify(p0))], [true, false, false]);
  conf('o segundo pedido devolve o content do modelo INTACTO e os dois resultados juntos', [JSON.stringify(p1.messages[1].content) === JSON.stringify(primeira.resposta.content), p1.messages[2].content.map(b => b.type + ':' + b.tool_use_id).join(',')],
    [true, 'tool_result:toolu_0_listar_aulas,tool_result:toolu_1_preparar_whatsapp']);
  conf('o resultado ao modelo não leva o telefone', /98765|wa\.me/.test(JSON.stringify(p1.messages[2])), false);
  const vez = await pag.evaluate(() => ({
    pergunta: document.querySelector('.ass-pergunta').textContent,
    resposta: Array.from(document.querySelectorAll('.ass-resposta p')).map(p => p.textContent),
    entendido: (document.querySelector('.ass-entendido') || {}).textContent,
    cartao: (document.querySelector('.ass-cartao[data-tipo="whatsapp"] .ass-mensagem') || {}).textContent,
    href: (document.querySelector('.ass-cartao[data-tipo="whatsapp"] a') || { getAttribute: () => '' }).getAttribute('href'),
    alvo: (document.querySelector('.ass-cartao[data-tipo="whatsapp"] a') || {}).target,
    exemplos: !!document.querySelector('.ass-exemplos')
  }));
  conf('a pergunta, a resposta em duas linhas e o dia que entendeu', [vez.pergunta, vez.resposta, vez.entendido],
    ['O que eu tenho amanhã?', ['Amanhã você não tem aula.', 'Preparei a mensagem: é só tocar em Abrir no WhatsApp.'], 'Entendi: terça, 17/11; Zélia.']);
  conf('o cartão do WhatsApp mostra o texto e abre a conversa com ele, numa aba nova', [vez.cartao, vez.href, vez.alvo],
    ['Olá! Vou atrasar 10 minutos para a aula de Zélia.', 'https://wa.me/5521987654321?text=' + encodeURIComponent('Olá! Vou atrasar 10 minutos para a aula de Zélia.'), '_blank']);
  conf('depois da primeira pergunta, os exemplos somem', vez.exemplos, false);
  conf('nada abriu sozinho e nada foi para fora (' + paraFora.length + ')', [await pag.evaluate(() => window.__aberturas.length), paraFora.length], [0, 0]);
  await pag.evaluate(() => document.querySelector('.ass-cartao[data-tipo="whatsapp"] a').click());
  conf('(controle) o toque dela no cartão é visto pelo instrumento', await pag.evaluate(() => window.__aberturas.join(' ; ')), 'toque ' + vez.href);

  // ================================================================
  secao('2. Ligar, mapa e contato');
  falso.fila = [ferramentas([['preparar_ligacao', { alunoId: 'al1' }], ['preparar_mapa', { alunoId: 'al1' }], ['contato', { alunoId: 'al1' }]]), texto('Está nos cartões abaixo.')];
  await perguntar(pag, 'liga para a mãe da Zélia e me mostra o endereço');
  const cartoes = await pag.evaluate(() => Array.from(document.querySelectorAll('.ass-vez:last-child .ass-cartao')).map(c => c.dataset.tipo + ' ' + Array.from(c.querySelectorAll('a')).map(a => a.getAttribute('href')).join(' ')));
  conf('os três cartões: Ligar (tel:), Abrir no mapa e o contato com os três botões', cartoes, [
    'ligar tel:+5521987654321',
    'mapa https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Rua Sintética, 10'),
    'contato tel:+5521987654321 https://wa.me/5521987654321 https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Rua Sintética, 10')]);
  conf('o telefone aparece no cartão, na tela dela', await pag.evaluate(() => (document.querySelector('.ass-vez:last-child .ass-telefone') || {}).textContent), 'Telefone: (21) 98765-4321');
  falso.fila = [ferramentas([['preparar_whatsapp', { alunoId: 'al2', texto: 'Oi' }]]), texto('O Bruno não tem celular cadastrado.')];
  await perguntar(pag, 'avisa a mãe do Bruno');
  const ultimo = falso.pedidos[falso.pedidos.length - 1].corpo.messages;
  conf('sem celular: a ferramenta volta como erro ao modelo e nenhum cartão aparece', [ultimo[ultimo.length - 1].content[0].is_error, await pag.evaluate(() => document.querySelectorAll('.ass-vez:last-child .ass-cartao').length)], [true, 0]);

  // ================================================================
  secao('3. O teto de 5 voltas');
  falso.pedidos = [];
  falso.sempre = () => ferramentas([['valor_hora', { alunoId: 'al1' }]]);
  await perguntar(pag, 'quanto eu cobro da Zélia?');
  falso.sempre = null;
  conf('no máximo 5 pedidos, a frase própria e a pergunta de volta no campo', [falso.pedidos.length, await pag.evaluate(() => (document.querySelector('#ass-erro') || {}).textContent), await pag.evaluate(() => document.querySelector('#ass-texto').value)],
    [5, 'Não consegui responder em poucos passos. Tente perguntar de um jeito mais direto.', 'quanto eu cobro da Zélia?']);

  // ================================================================
  secao('4. Erros: ocupado com "Tentar de novo"; sem permissão, neutro e sem ele');
  falso.fila = [{ ok: false, codigo: 'ocupado' }];
  await perguntar(pag, 'o que eu tenho hoje?');
  conf('ocupado: a frase e o "Tentar de novo"', await pag.evaluate(() => [document.querySelector('#ass-erro').getAttribute('role'), document.querySelector('#ass-erro span').textContent, !!document.querySelector('#ass-tentar')]),
    ['alert', 'A IA está ocupada agora. Tente de novo daqui a pouco.', true]);
  falso.fila = [texto('Hoje você tem a Zélia às 15h.')];
  await clicar(pag, '#ass-tentar');
  await esperar('o tentar de novo respondeu', () => pag.evaluate(() => !document.querySelector('#ass-esperando') && !document.querySelector('#ass-erro')), v => v === true, 15000);
  conf('"Tentar de novo" pergunta de novo e responde', await pag.evaluate(() => document.querySelector('.ass-vez:last-child .ass-resposta').textContent), 'Hoje você tem a Zélia às 15h.');
  falso.fila = [{ ok: false, codigo: 'sem_permissao' }];
  await perguntar(pag, 'oi');
  conf('sem_permissao: frase neutra, sem "Tentar de novo"', await pag.evaluate(() => [document.querySelector('#ass-erro span').textContent, !!document.querySelector('#ass-tentar')]), ['A IA ainda não está liberada nesta conta.', false]);

  // ================================================================
  secao('5. Fechar e abrir de novo: a conversa da sessão fica');
  const vezes = await pag.evaluate(() => document.querySelectorAll('.ass-vez').length);
  await pag.evaluate(() => document.querySelector('#modal-assistente .fechar').click());
  await esperar('a janela fechou', () => aberta(pag, 'modal-assistente'), v => v === false, 10000);
  conf('o foco volta ao ícone', await pag.evaluate(() => document.activeElement && document.activeElement.id), 'abrir-assistente');
  await clicar(pag, '#abrir-assistente');
  conf('reabrir mostra o que já foi perguntado', await pag.evaluate(() => document.querySelectorAll('.ass-vez').length), vezes);
  await pag.evaluate(() => document.querySelector('#modal-assistente .fechar').click());
  await pausa(300);

  // ================================================================
  secao('6. Nada gravou');
  conf('o banco do aparelho e a fila de registros iguais antes e depois de todas as perguntas', (await banco(pag)) === antes, true);
  conf('nenhum pedido saiu para fora do servidor da prova (' + paraFora.slice(0, 3).join(', ') + ')', paraFora.length, 0);

  // ================================================================
  secao('7. No celular da dona: o fluxo e a trava de transbordo');
  await modo(pag, 'dona-celular', 390, 844);
  const antesCel = await banco(pag);
  await clicar(pag, '#cel-assistente');
  await esperar('a janela abriu no celular', () => aberta(pag, 'modal-assistente'), v => v === true, 10000);
  falso.fila = [ferramentas([['preparar_whatsapp', { alunoId: 'al1', texto: 'Olá! Estou chegando para a aula de Zélia, em cerca de 10 minutos, por causa do trânsito na avenida principal.' }], ['preparar_ligacao', { alunoId: 'al1' }]]),
    texto('Preparei a mensagem e o atalho para ligar. É só tocar no botão; nada foi enviado.')];
  await perguntar(pag, 'avisa a mãe da Zélia que estou chegando');
  conf('no celular, o cartão do WhatsApp e o de ligar', await pag.evaluate(() => Array.from(document.querySelectorAll('.ass-cartao')).map(c => c.dataset.tipo)), ['whatsapp', 'ligar']);
  conf('no celular, nada gravou (o banco e a fila iguais)', (await banco(pag)) === antesCel, true);
  const falhas = [];
  for (const largura of [360, 390, 412]) {
    for (const letra of ['100%', '130%']) {
      await pag.setViewport({ width: largura, height: 800, hasTouch: true });
      await pag.evaluate(l => { document.documentElement.style.fontSize = l; }, letra);
      await pausa(300);
      (await transbordo(pag, '#modal-assistente .modal')).forEach(f => falhas.push(largura + '/' + letra + ' janela: ' + f));
      const rodape = await pag.evaluate(() => document.querySelector('#rodape-modal-assistente').getBoundingClientRect().height / window.innerHeight);
      if (rodape > 0.3) falhas.push(largura + '/' + letra + ' o rodapé ocupa ' + Math.round(rodape * 100) + '% da altura');
    }
  }
  await pag.evaluate(() => { document.documentElement.style.fontSize = ''; document.querySelector('#modal-assistente .fechar').click(); });
  await pausa(300);
  const linhas = [];
  for (const largura of [360, 390, 412]) {
    for (const letra of ['100%', '130%']) {
      await pag.setViewport({ width: largura, height: 800, hasTouch: true });
      await pag.evaluate(l => { document.documentElement.style.fontSize = l; }, letra);
      await pausa(300);
      (await transbordo(pag, '#cel-semana')).forEach(f => falhas.push(largura + '/' + letra + ' linha do dia: ' + f));
      /* A linha do dia com o ícone, e a mesma linha sem ele (o desenho de
       * antes, como controle): o ícone não pode empurrar a agenda para baixo. */
      const m = await pag.evaluate(() => { const t = document.querySelector('#cel-dia-titulo'); const lh = parseFloat(getComputedStyle(t).lineHeight) || 20;
        const linha = document.querySelector('.cel-semana-topo');
        const r = { linhas: Math.round(t.getBoundingClientRect().height / lh), alto: Math.round(linha.getBoundingClientRect().height), semana: (t.textContent),
          selo: !!linha.querySelector('#cel-avisos-selo'), relogio: getComputedStyle(document.querySelector('#cel-abrir-vagos .ico')).display };
        const b = document.querySelector('#cel-assistente'); const prox = b.nextSibling;
        b.remove(); linha.classList.remove('com-assistente');
        r.altoSem = Math.round(linha.getBoundingClientRect().height); r.relogioSem = getComputedStyle(document.querySelector('#cel-abrir-vagos .ico')).display; r.linhasSem = Math.round(t.getBoundingClientRect().height / lh);
        linha.insertBefore(b, prox); linha.classList.add('com-assistente');
        return r; });
      linhas.push(largura + '/' + letra + ': título em ' + m.linhas + ' linha(s) (sem o ícone: ' + m.linhasSem + '), a linha do dia com ' + m.alto + ' px (sem o ícone: ' + m.altoSem + ')');
      if (m.linhas > Math.max(2, m.linhasSem)) falhas.push(largura + '/' + letra + ' o título da linha do dia quebra em ' + m.linhas + ' linhas (sem o ícone: ' + m.linhasSem + ')');
      if (m.alto > m.altoSem) falhas.push(largura + '/' + letra + ' o ícone aumenta a linha do dia (' + m.altoSem + ' para ' + m.alto + ' px)');
      if (m.semana.indexOf('Hoje, seg 16/11') !== 0) falhas.push('o texto do título mudou: ' + m.semana);
      if (!m.selo) falhas.push(largura + '/' + letra + ' (arranjo) o selinho dos avisos não está na linha');
      if (m.relogio === 'none' || m.relogioSem !== 'none') falhas.push(largura + '/' + letra + ' o relógio do Vagos: com o ícone ' + m.relogio + ', sem ' + m.relogioSem);
    }
  }
  linhas.forEach(l => console.log('   ' + l));
  await pag.evaluate(() => { document.documentElement.style.fontSize = ''; });
  conf('a 360, 390 e 412 px, letra normal e 130%: nada passa da borda, alvos de 48 px, título em até 2 linhas e o rodapé contido (' + (falhas.slice(0, 6).join(' | ') || 'nenhuma falha') + ')', falhas.length, 0);
  /* Controle: um elemento largo na janela é acusado pela varredura. */
  await pag.setViewport({ width: 360, height: 800, hasTouch: true });
  await clicar(pag, '#cel-assistente');
  await pag.evaluate(() => { const d = document.createElement('div'); d.id = 'largo-de-prova'; d.style.width = '600px'; d.style.height = '10px'; document.querySelector('#corpo-modal-assistente').appendChild(d); });
  const vistos = await transbordo(pag, '#modal-assistente .modal');
  conf('CONTROLE: um elemento de 600 px em 360 px é acusado', vistos.some(f => /largo-de-prova|rola de lado/.test(f)), true);

  conf('nenhum erro de página', pag.errosDePagina ? pag.errosDePagina.slice(0, 3).join(' | ') : '', '');
  await H.fim(amb)();
})().catch(H.fim(amb));
