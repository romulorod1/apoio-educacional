/* testa_assistente_navegador.js (projeto IA no app, fase 3: o assistente só de leitura)
 *
 * O assistente no aplicativo de verdade (Chrome, puppeteer-core), com alunos
 * SINTÉTICOS e o /api/ia INTERCEPTADO por um falso que devolve um roteiro de
 * tool_use: nenhuma chamada à API de verdade, nenhuma conta real. A conta da
 * nuvem é trocada por uma sessão de mentira (Nuvem.estado e
 * Nuvem.tokenParaIA, postos antes do app.js ler), e toda rede para fora do
 * servidor da prova é cortada e contada.
 *
 * O que prova (com as lentes do #191):
 *   0. a porta: sem conta, ninguém; o observador, não; o celular que só lê,
 *      a dona no celular (a pílula "Perguntar" presa no pé de Hoje, acima
 *      das abas, e nada no alto: a linha do dia fica como a da main) e no
 *      tablet (a pílula vizinha do olho);
 *   1. no tablet: o foco no título ao abrir, os exemplos com o nome de um
 *      aluno dela e o mês passado, tocar num exemplo pergunta, o laço com
 *      duas ferramentas e o content intacto, o "Entendi:", o cartão do
 *      WhatsApp com o texto EDITÁVEL (o link acompanha) que só abre com o
 *      toque, e as "Ideias" depois da primeira pergunta;
 *   2. os cartões compactos de ligar, mapa e contato (o WhatsApp é o único
 *      principal; os nomes para o leitor de tela com o contexto);
 *   3. o teto de 5 voltas, com a frase sem jargão e a pergunta de volta;
 *   4. os erros: ocupado (com "Tentar de novo") e sem_permissao (sem ele);
 *   5. fechar durante o "Procurando..." devolve a pergunta ao campo; fechar e
 *      abrir guarda a conversa; "Nova conversa" zera;
 *   6. NADA GRAVOU: o banco do aparelho e a fila de registros iguais antes e
 *      depois de tudo;
 *   7. no celular: o fluxo, a linha do dia igual à da main (a palavra Vagos,
 *      o "1 dia" e o dia da semana à vista), a pílula no pé, acima das abas,
 *      sem nada a mais no alto, e a trava de transbordo da janela, do alto e
 *      da pílula a 360, 390 e 412 px, letra normal e 130%, com controle.
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
    // ontem, sem registro: o aviso do alto (o selinho) fica na linha do dia
    { id: 'a0', alunoId: 'al2', data: '2026-11-15', hora: '10:00', duracaoMin: 60, status: 'realizada', notaTexto: '', anexos: [], temas: [], areas: [] },
    { id: 'a2', alunoId: 'al2', data: '2026-11-18', hora: '09:00', duracaoMin: 60, status: 'realizada', notaTexto: '', anexos: [], temas: [], areas: [] }
  ]
};

/* O falso do endpoint: responde pela fila; guarda os pedidos; segura quando pedido. */
const falso = { fila: [], pedidos: [], sempre: null, segurar: false, segurados: [] };
function usage() { return { input_tokens: 12, output_tokens: 30, cache_read_input_tokens: 3000, cache_creation_input_tokens: 0 }; }
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
/* O toque espera o rodapé ficar livre (ele ignora toques por 400 ms depois de mudar). */
async function clicar(pag, sel) {
  await esperar('à vista: ' + sel, () => visivel(pag, sel), v => v === true, 15000);
  await pausa(450);
  await pag.evaluate(s => document.querySelector(s).click(), sel);
  await pausa(150);
}
const respondeu = pag => esperar('a resposta chegou', () => pag.evaluate(() => !document.querySelector('#ass-esperando')), v => v === true, 15000);
async function perguntar(pag, frase) {
  await pausa(450);
  await pag.evaluate(f => { const c = document.querySelector('#ass-texto'); c.value = f; c.dispatchEvent(new Event('input', { bubbles: true })); }, frase);
  await clicar(pag, '#ass-perguntar');
  await respondeu(pag);
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
    if (!raiz) return ['não achei ' + sel];
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
      if (falso.segurar) { falso.segurados.push(req); return; }
      const vez = falso.sempre ? falso.sempre() : falso.fila.shift() || texto('(fila vazia)');
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(vez) }).catch(() => {});
      return;
    }
    if (u.indexOf('http://127.0.0.1:' + PORTA) !== 0 && !u.startsWith('data:') && !u.startsWith('blob:')) { paraFora.push(u); req.abort().catch(() => {}); return; }
    req.continue().catch(() => {});
  });
  /* A conta de mentira, posta no instante em que o nuvem.js publica o Nuvem
   * (antes de o app.js ler), conforme o modo da rodada. E o window.open e os
   * toques em link contados: nada pode abrir sozinho. */
  await pag.evaluateOnNewDocument(() => {
    window.__aberturas = [];
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
  secao('0. A porta do assistente');
  await modo(pag, 'sem', 1280, 900);
  conf('sem a conta da nuvem: o tablet não mostra a pílula', await visivel(pag, '#abrir-assistente'), false);
  await modo(pag, 'observador', 390, 844);
  conf('(arranjo) o observador está no modo celular', await pag.evaluate(() => document.body.classList.contains('modo-celular')), true);
  conf('o observador de outra conta: nem no alto do tablet nem no celular', [await visivel(pag, '#abrir-assistente'), await visivel(pag, '#cel-assistente')], [false, false]);
  await modo(pag, 'so-le', 390, 844);
  conf('o celular que só lê, com a conta: tem a porta (perguntar é ler)', await visivel(pag, '#cel-assistente'), true);
  await modo(pag, 'dona-celular', 390, 844);
  const porta = await pag.evaluate(() => {
    const b = document.querySelector('#cel-assistente'), r = b.getBoundingClientRect(), abas = document.querySelector('#cel-abas').getBoundingClientRect();
    return { texto: b.textContent.trim(), icone: (b.querySelector('svg') || { getAttribute: () => '' }).getAttribute('data-icone-nome'), noAlto: !!b.closest('#cel-semana'),
      acimaDasAbas: r.bottom <= abas.top + 1 && abas.top - r.bottom <= 24, aDireita: window.innerWidth - r.right <= 24, alvo: r.height >= 48 && r.width >= 48 };
  });
  conf('no celular da dona: a pílula "Perguntar" com o balão, presa no pé de Hoje, logo acima das abas, à direita, fora do alto, alvo de 48 px', porta,
    { texto: 'Perguntar', icone: 'perguntar', noAlto: false, acimaDasAbas: true, aDireita: true, alvo: true });
  conf('a linha do dia é a da main: "Hoje, seg 16/11", o Vagos com a palavra e o "1 dia" à vista', await pag.evaluate(() => {
    const t = document.querySelector('#cel-dia-titulo'), v = document.querySelector('#cel-abrir-vagos'), p = document.querySelector('#cel-dia-anterior');
    return [t.textContent, t.children.length, v.textContent, !v.querySelector('svg'), getComputedStyle(p).fontSize !== '0px', p.textContent.trim()];
  }), ['Hoje, seg 16/11', 0, 'Vagos', true, true, '1 dia']);
  await modo(pag, 'dona-tablet', 1280, 900);
  const pilula = await pag.evaluate(() => {
    const b = document.querySelector('#abrir-assistente'), o = document.querySelector('#alternar-valores'), rb = b.getBoundingClientRect(), ro = o.getBoundingClientRect();
    return { visivel: rb.width > 0, texto: b.textContent.trim(), icone: (b.querySelector('svg') || { getAttribute: () => '' }).getAttribute('data-icone-nome'),
      vizinha: Math.round(ro.left - rb.right) <= 16 && Math.round(ro.left - rb.right) >= 0, alinhada: Math.abs((rb.top + rb.bottom) / 2 - (ro.top + ro.bottom) / 2) <= 3, alvo: rb.height >= 48 };
  });
  conf('no tablet: a pílula "Perguntar" com o balão, vizinha do olho (até 16 px), alinhada a ele e com o alvo de 48 px', pilula,
    { visivel: true, texto: 'Perguntar', icone: 'perguntar', vizinha: true, alinhada: true, alvo: true });
  const antes = await banco(pag);

  // ================================================================
  secao('1. No tablet: os exemplos, tocar pergunta, o laço, o Entendi e o cartão editável');
  await clicar(pag, '#abrir-assistente');
  await esperar('a janela abriu', () => aberta(pag, 'modal-assistente'), v => v === true, 10000);
  conf('o foco no título (o teclado não sobe ao abrir); o Perguntar desligado sem texto', await pag.evaluate(() => [document.activeElement && document.activeElement.id, document.querySelector('#ass-perguntar').disabled]), ['titulo-modal-assistente', true]);
  conf('os exemplos: um de horário livre, o mês passado e o nome de um aluno dela (nunca "João")', await pag.evaluate(() => Array.from(document.querySelectorAll('#ass-exemplos .ass-exemplo')).map(b => b.textContent)),
    ['O que eu tenho amanhã?', 'Tenho horário livre amanhã à tarde?', 'Quem não pagou outubro?', 'Avisa a família de Bruno que vou atrasar']);
  conf('o Perguntar desligado é legível (texto escuro, sem transparência)', await pag.evaluate(() => { const c = getComputedStyle(document.querySelector('#ass-perguntar')); return [c.opacity, c.color]; }), ['1', 'rgb(26, 28, 31)']);
  const primeira = ferramentas([['listar_aulas', { inicio: '2026-11-17', fim: '2026-11-17', alunoId: null }], ['preparar_whatsapp', { alunoId: 'al1', texto: 'Olá! Vou atrasar ___ min para a aula de Zélia.' }]], 'sig-primeira');
  falso.fila = [primeira, texto('Amanhã você não tem aula.\nPreparei a mensagem: é só tocar em **Abrir no WhatsApp**.')];
  falso.pedidos = [];
  await clicar(pag, '#ass-exemplos .ass-exemplo');
  await respondeu(pag);
  const p0 = falso.pedidos[0] && falso.pedidos[0].corpo, p1 = falso.pedidos[1] && falso.pedidos[1].corpo;
  conf('tocar no exemplo já pergunta: dois pedidos na rota assistente, com o login e as 16 ferramentas', [falso.pedidos.length, p0.rota, falso.pedidos[0].autorizacao, p0.tools.length, /O que eu tenho amanhã\?/.test(p0.messages[0].content[0].text)], [2, 'assistente', 'Bearer token-falso-da-prova', 16, true]);
  conf('o pedido leva o agora pelo relógio da tela e os alunos só pelo primeiro nome', [/Agora: segunda-feira, 16\/11\/2026 \(2026-11-16\), 11:/.test(p0.messages[0].content[0].text), /Sobrenome/.test(JSON.stringify(p0)), /98765|Rua Sintética|Responsável/.test(JSON.stringify(p0))], [true, false, false]);
  conf('o segundo pedido devolve o content do modelo INTACTO e os dois resultados juntos', [JSON.stringify(p1.messages[1].content) === JSON.stringify(primeira.resposta.content), p1.messages[2].content.map(b => b.type + ':' + b.tool_use_id).join(',')],
    [true, 'tool_result:toolu_0_listar_aulas,tool_result:toolu_1_preparar_whatsapp']);
  conf('o resultado ao modelo não leva o telefone nem o responsável', /98765|wa\.me|Responsável/.test(JSON.stringify(p1.messages[2])), false);
  const vez = await pag.evaluate(() => ({
    pergunta: document.querySelector('.ass-pergunta').textContent,
    resposta: Array.from(document.querySelectorAll('.ass-resposta p')).map(p => p.textContent),
    entendido: (document.querySelector('.ass-entendido') || {}).textContent,
    entendidoLetra: getComputedStyle(document.querySelector('.ass-entendido')).fontSize,
    linha: (document.querySelector('.ass-cartao[data-tipo="whatsapp"] .ass-cartao-linha') || {}).textContent,
    campo: (document.querySelector('.ass-cartao[data-tipo="whatsapp"] textarea') || {}).value,
    href: (document.querySelector('.ass-cartao[data-tipo="whatsapp"] a') || { getAttribute: () => '' }).getAttribute('href'),
    principal: Array.from(document.querySelectorAll('.ass-cartao[data-tipo="whatsapp"] a')).map(a => a.classList.contains('principal')),
    exemplos: !!document.querySelector('#ass-exemplos'), ideias: !!document.querySelector('#ass-ideias:not([open])')
  }));
  conf('o "Entendi:" com 14 px e o cinza #5F6876, e o foco voltou ao campo (tablet) depois do redesenho', await pag.evaluate(() => { const c = getComputedStyle(document.querySelector('.ass-entendido')); return [c.fontSize, c.color, document.activeElement && document.activeElement.id]; }), ['14px', 'rgb(95, 104, 118)', 'ass-texto']);
  conf('a pergunta, a resposta em duas linhas sem markdown e o dia que entendeu, com letra de 14 px ou mais', [vez.pergunta, vez.resposta, vez.entendido, parseFloat(vez.entendidoLetra) >= 14],
    ['O que eu tenho amanhã?', ['Amanhã você não tem aula.', 'Preparei a mensagem: é só tocar em Abrir no WhatsApp.'], 'Entendi: terça, 17/11; Zélia.', true]);
  conf('o cartão do WhatsApp: uma linha com o responsável e o número, o texto num campo, e o WhatsApp é o único principal', [vez.linha, vez.campo, vez.principal, vez.href],
    ['WhatsApp de Responsável Sintético (21) 98765-4321', 'Olá! Vou atrasar ___ min para a aula de Zélia.', [true], 'https://wa.me/5521987654321?text=' + encodeURIComponent('Olá! Vou atrasar ___ min para a aula de Zélia.')]);
  conf('depois da primeira pergunta, os exemplos saem e as "Ideias" ficam recolhidas', [vez.exemplos, vez.ideias], [false, true]);
  await pag.evaluate(() => { const c = document.querySelector('.ass-cartao[data-tipo="whatsapp"] textarea'); c.value = 'Olá! Vou atrasar 15 min para a aula de Zélia.'; c.dispatchEvent(new Event('input', { bubbles: true })); });
  const hrefEditado = await pag.evaluate(() => document.querySelector('.ass-cartao[data-tipo="whatsapp"] a').getAttribute('href'));
  conf('ela muda o texto antes de abrir, e o link acompanha', hrefEditado, 'https://wa.me/5521987654321?text=' + encodeURIComponent('Olá! Vou atrasar 15 min para a aula de Zélia.'));
  conf('nada abriu sozinho e nada foi para fora (' + paraFora.length + ')', [await pag.evaluate(() => window.__aberturas.length), paraFora.length], [0, 0]);
  await pag.evaluate(() => document.querySelector('.ass-cartao[data-tipo="whatsapp"] a').click());
  conf('(controle) o toque dela no cartão é visto pelo instrumento, com o texto dela', await pag.evaluate(() => window.__aberturas.join(' ; ')), 'toque ' + hrefEditado);

  // ================================================================
  secao('2. Ligar, mapa e contato, compactos');
  falso.fila = [ferramentas([['preparar_ligacao', { alunoId: 'al1' }], ['preparar_mapa', { alunoId: 'al1' }], ['contato', { alunoId: 'al1' }]]), texto('Está nos cartões abaixo.')];
  await perguntar(pag, 'liga para a mãe da Zélia e me mostra o endereço');
  const cartoes = await pag.evaluate(() => Array.from(document.querySelectorAll('.ass-vez:last-of-type .ass-cartao')).map(c => ({
    tipo: c.dataset.tipo, linha: Array.from(c.querySelectorAll('.ass-cartao-linha')).map(l => l.textContent).join(' | '),
    links: Array.from(c.querySelectorAll('a')).map(a => a.dataset.cartao + (a.classList.contains('principal') ? '*' : '') + ' ' + a.getAttribute('aria-label')) })));
  conf('ligar: o responsável e o número numa linha, e o "Ligar" secundário com o contexto para o leitor de tela', cartoes[0],
    { tipo: 'ligar', linha: 'Responsável Sintético (21) 98765-4321', links: ['ligar Ligar para Responsável Sintético, (21) 98765-4321'] });
  conf('mapa: o endereço em cinza para conferir, e o "Abrir no mapa" secundário', cartoes[1],
    { tipo: 'mapa', linha: 'Endereço de Zélia Rua Sintética, 10', links: ['mapa Abrir no mapa o endereço de Zélia'] });
  conf('contato: o WhatsApp é o principal; Ligar e Mapa secundários', [cartoes[2].tipo, cartoes[2].links.map(l => l.split(' ')[0])], ['contato', ['whatsapp*', 'ligar', 'mapa']]);
  falso.fila = [ferramentas([['preparar_whatsapp', { alunoId: 'al2', texto: 'Oi' }]]), texto('O Bruno não tem celular cadastrado.')];
  await perguntar(pag, 'avisa a mãe do Bruno');
  const ultimo = falso.pedidos[falso.pedidos.length - 1].corpo.messages;
  conf('ALTO da rodada 2: depois de outras perguntas (a janela redesenhou), o cartão do WhatsApp ainda tem o texto editado, no campo e no link', await pag.evaluate(() => {
    const c = document.querySelector('.ass-cartao[data-tipo="whatsapp"]'); return [c.querySelector('textarea').value, c.querySelector('a').getAttribute('href')]; }),
    ['Olá! Vou atrasar 15 min para a aula de Zélia.', hrefEditado]);
  conf('as "Ideias" têm a seta e 48 px de toque', await pag.evaluate(() => { const s = document.querySelector('#ass-ideias summary'); return [!!s.querySelector('svg'), s.getBoundingClientRect().height >= 48]; }), [true, true]);
  conf('sem celular: a ferramenta volta como erro ao modelo e nenhum cartão aparece', [ultimo[ultimo.length - 1].content[0].is_error, await pag.evaluate(() => document.querySelectorAll('.ass-vez:last-of-type .ass-cartao').length)], [true, 0]);
  falso.fila = [ferramentas([['preparar_whatsapp', { alunoId: 'al1', texto: 'Olá! Ficou R$ 9.999,00 de outubro.' }]]), texto('Para cobrar, uso a cobrança do app.')];
  await perguntar(pag, 'manda a cobrança da Zélia');
  const ultimo2 = falso.pedidos[falso.pedidos.length - 1].corpo.messages;
  conf('VENENO: o modelo põe valor no WhatsApp e a ferramenta recusa, sem cartão', [ultimo2[ultimo2.length - 1].content[0].is_error, /preparar_cobranca/.test(ultimo2[ultimo2.length - 1].content[0].content),
    await pag.evaluate(() => document.querySelectorAll('.ass-vez:last-of-type .ass-cartao').length)], [true, true, 0]);

  // ================================================================
  secao('3. O teto de 5 voltas');
  falso.pedidos = [];
  falso.sempre = () => ferramentas([['valor_hora', { alunoId: 'al1' }]]);
  await perguntar(pag, 'quanto eu cobro da Zélia?');
  falso.sempre = null;
  conf('no máximo 5 pedidos, a frase sem jargão perto do campo, com o ícone, e a pergunta de volta no campo',
    [falso.pedidos.length, await pag.evaluate(() => [document.querySelector('#ass-erro').textContent, !!document.querySelector('#ass-erro svg'), !!document.querySelector('#rodape-modal-assistente #ass-erro'), document.querySelector('#ass-texto').value])],
    [5, ['Não achei essa resposta. Tente perguntar de outro jeito.', true, true, 'quanto eu cobro da Zélia?']]);

  // ================================================================
  secao('4. Erros: ocupado com "Tentar de novo"; sem permissão, neutro e sem ele');
  falso.fila = [{ ok: false, codigo: 'ocupado' }];
  await perguntar(pag, 'o que eu tenho hoje?');
  conf('ocupado: a frase e o "Tentar de novo"', await pag.evaluate(() => [document.querySelector('#ass-erro').getAttribute('role'), document.querySelector('#ass-erro span').textContent, !!document.querySelector('#ass-tentar')]),
    ['alert', 'Não consegui agora. Toque em Tentar de novo.', true]);
  falso.fila = [texto('Hoje você tem a Zélia às 15:00.')];
  await clicar(pag, '#ass-tentar');
  await esperar('o tentar de novo respondeu', () => pag.evaluate(() => !document.querySelector('#ass-esperando') && !document.querySelector('#ass-erro')), v => v === true, 15000);
  conf('"Tentar de novo" pergunta de novo e responde', await pag.evaluate(() => document.querySelector('.ass-vez:last-of-type .ass-resposta').textContent), 'Hoje você tem a Zélia às 15:00.');
  falso.fila = [{ ok: false, codigo: 'sem_permissao' }];
  await perguntar(pag, 'oi');
  conf('sem_permissao: a frase neutra do planejamento, sem "Tentar de novo"', await pag.evaluate(() => [document.querySelector('#ass-erro span').textContent, !!document.querySelector('#ass-tentar')]), ['A IA ainda não está liberada nesta conta.', false]);

  // ================================================================
  secao('5. Fechar no meio devolve a pergunta; a conversa fica; "Nova conversa" zera');
  falso.segurar = true;
  await pausa(450);
  await pag.evaluate(() => { const c = document.querySelector('#ass-texto'); c.value = 'pergunta que fica no meio'; c.dispatchEvent(new Event('input', { bubbles: true })); });
  await clicar(pag, '#ass-perguntar');
  await esperar('o "Procurando..." apareceu', () => visivel(pag, '#ass-esperando'), v => v === true, 10000);
  await pag.evaluate(() => document.querySelector('#modal-assistente .fechar').click());
  await esperar('a janela fechou', () => aberta(pag, 'modal-assistente'), v => v === false, 10000);
  falso.segurar = false;
  falso.segurados.forEach(r => r.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(texto('tarde demais')) }).catch(() => {}));
  falso.segurados = [];
  conf('o foco volta à pílula', await pag.evaluate(() => document.activeElement && document.activeElement.id), 'abrir-assistente');
  await clicar(pag, '#abrir-assistente');
  await pausa(300);
  conf('reabrir: a pergunta de antes está no campo, e a resposta atrasada não entrou na conversa', await pag.evaluate(() => [document.querySelector('#ass-texto').value, /tarde demais/.test(document.querySelector('#ass-conversa').textContent)]), ['pergunta que fica no meio', false]);
  const vezes = await pag.evaluate(() => document.querySelectorAll('.ass-vez').length);
  conf('(arranjo) a conversa tem as perguntas de antes, e o "Nova conversa" está à vista', [vezes >= 5, await visivel(pag, '#ass-nova')], [true, true]);
  await pag.evaluate(() => { const c = document.querySelector('#ass-texto'); c.value = 'texto que ela começou'; c.dispatchEvent(new Event('input', { bubbles: true })); });
  await clicar(pag, '#ass-nova');
  conf('"Nova conversa" mantém o que ela tinha escrito no campo', await pag.evaluate(() => document.querySelector('#ass-texto').value), 'texto que ela começou');
  conf('"Nova conversa" zera a conversa e volta aos exemplos', await pag.evaluate(() => [document.querySelectorAll('.ass-vez').length, !!document.querySelector('#ass-exemplos'), document.querySelector('#ass-nova').hidden]), [0, true, true]);
  falso.pedidos = [];
  falso.fila = [texto('Nova.')];
  await perguntar(pag, 'oi de novo');
  conf('depois de "Nova conversa", o pedido começa do zero (com a lista de alunos)', [falso.pedidos[0].corpo.messages.length, /Alunos ativos/.test(falso.pedidos[0].corpo.messages[0].content[0].text)], [1, true]);
  await pag.evaluate(() => document.querySelector('#modal-assistente .fechar').click());
  await pausa(300);

  // ================================================================
  secao('6. Nada gravou');
  conf('o banco do aparelho e a fila de registros iguais antes e depois de todas as perguntas', (await banco(pag)) === antes, true);
  conf('nenhum pedido saiu para fora do servidor da prova (' + paraFora.slice(0, 3).join(', ') + ')', paraFora.length, 0);

  // ================================================================
  secao('7. No celular da dona: o fluxo, as duas linhas do alto e a trava de transbordo');
  await modo(pag, 'dona-celular', 390, 844);
  const antesCel = await banco(pag);
  await clicar(pag, '#cel-assistente');
  await esperar('a janela abriu no celular', () => aberta(pag, 'modal-assistente'), v => v === true, 10000);
  falso.fila = [ferramentas([['preparar_whatsapp', { alunoId: 'al1', texto: 'Olá! Vou atrasar ___ min para a aula de Zélia, por causa do trânsito na avenida principal.' }], ['preparar_ligacao', { alunoId: 'al1' }]]),
    texto('Preparei a mensagem e o atalho para ligar. É só tocar no botão; nada foi enviado.')];
  await perguntar(pag, 'avisa a família da Zélia que vou atrasar por causa do trânsito');
  conf('no celular, WhatsApp e Ligar do mesmo aluno num cartão só, lado a lado, com o nome e o número uma vez', await pag.evaluate(() => {
    const cs = Array.from(document.querySelectorAll('.ass-cartao'));
    const links = Array.from(cs[0].querySelectorAll('a')).map(a => a.dataset.cartao + (a.classList.contains('principal') ? '*' : ''));
    const r = Array.from(cs[0].querySelectorAll('a')).map(a => a.getBoundingClientRect());
    return [cs.map(c => c.dataset.tipo), links, r.length === 2 && Math.abs(r[0].top - r[1].top) < 2, (cs[0].textContent.match(/98765-4321/g) || []).length];
  }), [['whatsapp'], ['whatsapp*', 'ligar'], true, 1]);
  conf('no celular, a janela desce até o fim da tela e cobre a barra de abas', await pag.evaluate(() => {
    const m = document.querySelector('#modal-assistente .modal').getBoundingClientRect(), abas = document.querySelector('#cel-abas').getBoundingClientRect();
    return m.bottom >= abas.bottom - 1 && m.top < abas.top; }), true);
  conf('no celular, nada gravou (o banco e a fila iguais)', (await banco(pag)) === antesCel, true);
  const falhas = [], linhas = [];
  falso.fila = [{ ok: false, codigo: 'ocupado' }];
  await perguntar(pag, 'o que eu tenho hoje?');
  await pag.setViewport({ width: 360, height: 780, hasTouch: true });
  await pag.evaluate(() => { document.documentElement.style.fontSize = '130%'; });
  await pausa(400);
  const comErro = await pag.evaluate(() => {
    const r = document.querySelector('#rodape-modal-assistente').getBoundingClientRect(), t = document.querySelector('#ass-tentar').getBoundingClientRect(), s = document.querySelector('#ass-erro span').getBoundingClientRect();
    return { pct: Math.round(r.height / window.innerHeight * 100), mesmaLinha: t.top < s.bottom && t.bottom > s.top, campo: document.querySelector('#ass-texto').rows };
  });
  console.log('   rodapé com o erro aberto a 360 x 780 e 130%: ' + comErro.pct + '% da altura');
  conf('com o erro aberto a 360 e 130%: o "Tentar de novo" na linha do texto, o campo numa linha e o rodapé até 30% da altura', [comErro.mesmaLinha, comErro.campo, comErro.pct <= 30], [true, 1, true]);
  await pag.evaluate(() => { document.documentElement.style.fontSize = ''; });
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
  for (const largura of [360, 390, 412]) {
    for (const letra of ['100%', '130%']) {
      await pag.setViewport({ width: largura, height: 800, hasTouch: true });
      await pag.evaluate(l => { document.documentElement.style.fontSize = l; }, letra);
      await pausa(300);
      (await transbordo(pag, '#cel-semana')).forEach(f => falhas.push(largura + '/' + letra + ' alto: ' + f));
      (await transbordo(pag, '#cel-assistente-pe')).forEach(f => falhas.push(largura + '/' + letra + ' pílula: ' + f));
      const m = await pag.evaluate(() => {
        const t = document.querySelector('#cel-dia-titulo'), lh = parseFloat(getComputedStyle(t).lineHeight) || 20;
        const alto = document.querySelector('#cel-semana').getBoundingClientRect(), dia = document.querySelector('.cel-semana-topo').getBoundingClientRect();
        const b = document.querySelector('#cel-assistente').getBoundingClientRect(), abas = document.querySelector('#cel-abas').getBoundingClientRect();
        const cortado = Array.from(document.querySelectorAll('#cel-semana *, #cel-assistente-pe *')).filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (e.scrollHeight > e.clientHeight + 1 && getComputedStyle(e).overflowY === 'hidden'); }).map(e => e.id || e.className);
        return { linhas: Math.round(t.getBoundingClientRect().height / lh), alto: Math.round(alto.height), dia: Math.round(dia.height), so: !document.querySelector('#cel-semana #cel-assistente') && Array.from(document.querySelector('#cel-semana').children).every(c => c.classList.contains('cel-semana-topo') || /^cel-avisos/.test(c.id)),
          pilula: b.bottom <= abas.top + 1 && b.height >= 48, cortado };
      });
      linhas.push(largura + '/' + letra + ': título em ' + m.linhas + ' linha(s); o alto ' + m.alto + ' px, só a linha do dia (' + m.dia + ' px): ' + m.so + '; a pílula acima das abas: ' + m.pilula);
      if (!m.so) falhas.push(largura + '/' + letra + ' o alto tem mais que a linha do dia (' + m.alto + ' contra ' + m.dia + ' px)');
      if (!m.pilula) falhas.push(largura + '/' + letra + ' a pílula não está inteira acima das abas');
      if (m.cortado.length) falhas.push(largura + '/' + letra + ' cortado: ' + m.cortado.join(', '));
    }
  }
  linhas.forEach(l => console.log('   ' + l));
  await pag.evaluate(() => { document.documentElement.style.fontSize = ''; });
  conf('a 360, 390 e 412 px, letra normal e 130%: nada passa da borda, nada cortado, alvos de 48 px, o alto só com a linha do dia, a pílula acima das abas e o rodapé contido (' + (falhas.slice(0, 6).join(' | ') || 'nenhuma falha') + ')', falhas.length, 0);
  /* Controle: um elemento largo na janela é acusado pela varredura. */
  await pag.setViewport({ width: 360, height: 800, hasTouch: true });
  await clicar(pag, '#cel-assistente');
  await pag.evaluate(() => { const d = document.createElement('div'); d.id = 'largo-de-prova'; d.style.width = '600px'; d.style.height = '10px'; document.querySelector('#corpo-modal-assistente').appendChild(d); });
  const vistos = await transbordo(pag, '#modal-assistente .modal');
  conf('CONTROLE: um elemento de 600 px em 360 px é acusado', vistos.some(f => /largo-de-prova|rola de lado/.test(f)), true);
  await pag.evaluate(() => document.querySelector('#modal-assistente .fechar').click());
  await pausa(400);
  const cruza = [];
  for (const [w, h, letra] of [[360, 780, '130%'], [360, 780, ''], [390, 844, '']]) {
    await pag.setViewport({ width: w, height: h, hasTouch: true });
    await pag.evaluate(l => { document.documentElement.style.fontSize = l; }, letra);
    await pag.evaluate(() => document.querySelector('#cel-dia-seguinte').click()); await pausa(300);
    await pag.evaluate(() => document.querySelector('#cel-dia-hoje').click()); await pausa(500);
    const m = await pag.evaluate(() => {
      const c = document.querySelector('#cel-conteudo'); c.scrollTop = c.scrollHeight;
      const b = document.querySelector('#cel-assistente').getBoundingClientRect();
      const blocos = Array.from(document.querySelectorAll('#cel-tempo .cel-bloco')).map(x => x.getBoundingClientRect()).sort((x, y) => x.bottom - y.bottom);
      const u = blocos[blocos.length - 1];
      return { cruza: !!u && b.left < u.right && b.right > u.left && b.top < u.bottom && b.bottom > u.top, folga: u ? Math.round(b.top - u.bottom) : null };
    });
    if (m.cruza) cruza.push(w + '/' + (letra || '100%') + ' (folga ' + m.folga + ')');
  }
  await pag.evaluate(() => { document.documentElement.style.fontSize = ''; });
  conf('rolado até o fim de Hoje, a pílula não cobre a última aula (360 a 130% e 100%, 390)', cruza.join(', '), '');

  conf('nenhum erro de página', pag.errosDePagina ? pag.errosDePagina.slice(0, 3).join(' | ') : '', '');
  await H.fim(amb)();
})().catch(H.fim(amb));
