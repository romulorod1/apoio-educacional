/* testa_planejamento_navegador.js (projeto IA no app, fase 2)
 *
 * O planejamento de estudos no aplicativo de verdade (Chrome, puppeteer-core),
 * com alunos SINTÉTICOS e o endpoint /api/ia INTERCEPTADO por um falso: nenhuma
 * chamada à API de verdade, nenhuma conta real. O login da nuvem é trocado por
 * uma sessão à vista e um token falso (Nuvem.estado e Nuvem.tokenParaIA),
 * porque quem confere o login é o endpoint, que aqui é falso.
 *
 * O que prova (com as lentes de design do #172):
 *   0. quem vê o quê, dos dois lados: sem login, a ficha mostra os planos
 *      salvos e não tem "Novo planejamento" nem o link da aula nova; com
 *      login, tem; o observador não vê nada;
 *   1. da FICHA: o foco no campo, o Montar desligado sem texto nem print, o
 *      print reduzido (1568 px, JPEG) com miniatura de 200 px que amplia, o
 *      "montando" com o Cancelar do outro lado, a prévia que é o PRÓPRIO PDF
 *      (tocar abre o leitor do app), o "Na folha: Aluna | Aluno" sempre à
 *      vista, o selo "N itens para conferir" (com a conferência do app: estudo
 *      antes da prova) e o toque num item levando ao Ajustar com o dia; o
 *      ajuste com a prévia esmaecida, o "Mudou:" e o "Desfazer ajuste"; a
 *      falha do ajuste devolvendo o texto; o ajuste que passa do teto; o
 *      salvar com DOIS toques gravando UM plano; o compartilhar (o PDF certo,
 *      o cancelar da folha de compartilhamento sem baixar, e a trava);
 *   2. o plano salvo no aluno errado muda de ficha; excluir com Desfazer;
 *   3. o Cancelar no meio do "montando" volta ao pedido sem perder o texto;
 *      fechar com texto pergunta numa janela própria (sem confirm());
 *   4. o link da aula nova, no pé: com a aula preenchida, pergunta antes;
 *      "Para qual aluno?" com seleção única (dos dois lados) e, com confiança
 *      baixa, nenhum marcado e a folha esperando a escolha;
 *   5. sem_permissao e sem internet (Montar desligado, "Tentar de novo");
 *   7. a trava de transbordo da janela, a 360, 390 e 412 px, letra normal e
 *      130%, e o rodapé empilhado sem passar de 20% da altura.
 *
 * Veneno, que TEM de reprovar a parte 1:
 *   --envenenado-salva-duplo   o salvar sem a trava, sem desligar o botão e
 *                              com um id novo a cada toque.
 *
 * Porta 8971. O service worker é contornado (a interceptação do /api/ia é
 * pela página).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8971;
const V_DUPLO = '--envenenado-salva-duplo';
const MODO = process.argv.indexOf(V_DUPLO) >= 0 ? V_DUPLO : '';
function prop(rotulo, ok) {
  if (MODO) return conf('VENENO visto: ' + rotulo + ', e quebrou', ok, false);
  return conf(rotulo, ok, true);
}
const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const ANCORAS_DUPLO = [
  ['    if (p.salvando) return;\n', '\n'],
  ['    p.idParaSalvar = p.idParaSalvar || p.salvoId || Core.uid();', '    p.idParaSalvar = p.salvoId || Core.uid();'],
  ['    if (botaoSalvar) botaoSalvar.disabled = true;', '']
];
const APP_N = APP.replace(/\r\n/g, '\n');
secao('0. As âncoras do veneno');
ANCORAS_DUPLO.forEach(par => conf('âncora uma vez só no app.js: ' + par[0].trim().slice(0, 50), APP_N.split(par[0]).length, 2));
const trocas = {};
if (MODO) {
  trocas['/app.js'] = ANCORAS_DUPLO.reduce((t, par) => t.split(par[0]).join(par[1]), APP_N);
  conf('o app.js servido ficou diferente do repositório (' + MODO + ')', trocas['/app.js'] !== APP_N, true);
}
const amb = H.criarAmbiente(PORTA, 'perfil_planejamento_nav', trocas);

function dias(a, b) { const s = []; for (let d = new Date(a + 'T00:00:00Z'); d.toISOString().slice(0, 10) <= b; d.setUTCDate(d.getUTCDate() + 1)) s.push(d.toISOString().slice(0, 10)); return s; }
function planoFalso(alunoId, tratamento, confianca, extra) {
  const grade = dias('2026-11-16', '2026-11-27').map(d => ({ data: d, prova: null, estudo: ['Matemática (1h)'], deManha: false }));
  grade.find(g => g.data === '2026-11-19').prova = 'Cambridge';
  grade.find(g => g.data === '2026-11-27').prova = 'História';
  return Object.assign({
    alunoId, confiancaAluno: confianca || 'alta', tratamento: tratamento || 'Aluna',
    periodo: { inicio: '2026-11-16', fim: '2026-11-27' }, grade,
    provas: [
      { data: '2026-11-19', disciplina: 'Cambridge', conteudo: null, material: null, incerto: false },
      { data: '2026-11-27', disciplina: 'História', conteudo: 'Cap. 2 (Vilas).', material: 'Livro 1.', incerto: true }
    ],
    aulaAConfirmar: [], feriados: [], observacoes: ['O print da prova de História estava cortado.']
  }, extra || {});
}
function respostaFalsa(plano) {
  return { ok: true, resposta: { id: 'msg_falso', model: 'claude-sonnet-5-5', stop_reason: 'end_turn',
    content: [{ type: 'thinking', thinking: '', signature: 'assinatura-sintetica-' + Math.random().toString(36).slice(2) }, { type: 'text', text: JSON.stringify(plano) }],
    usage: { input_tokens: 4, output_tokens: 100, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } } };
}

const DB = {
  versao: 1, resumos: [], pagamentos: [],
  ajustes: { cargaInicial: true, versaoVista: '9.9.9', ultimoAnoLetivoAtualizado: 2026,
    // um plano que veio quebrado (provas null): a ficha abre do mesmo jeito, sem ele na lista
    'planejamento:quebrado': { id: 'quebrado', alunoId: 'al1', criadoEm: '2026-11-10T10:00:00.000Z', atualizadoEm: '2026-11-10T10:00:00.000Z',
      plano: { alunoId: 'al1', periodo: { inicio: '2026-11-10', fim: '2026-11-12' }, provas: null, grade: null } },
    // um plano salvo do Bruno: aparece na ficha mesmo sem login (só ver)
    'planejamento:semente': { id: 'semente', alunoId: 'al2', criadoEm: '2026-11-11T10:00:00.000Z', atualizadoEm: '2026-11-11T10:00:00.000Z',
      plano: planoFalso('al2', 'Aluno') } },
  alunos: [
    { id: 'al1', nome: 'Zélia Sobrenomeum', ativo: true, cor: '#2E7D6B', precos: [], mapeamentos: [], obs: '' },
    { id: 'al2', nome: 'Bruno Sobrenomedois', ativo: true, cor: '#1F3A5F', precos: [], mapeamentos: [], obs: '' }
  ],
  series: [{ id: 's1', alunoId: 'al1', dias: [1, 3], hora: '15:30', duracaoMin: 60, inicio: '2026-11-01', fim: null, exclusoes: [], status: 'realizada' }],
  aulas: [
    { id: 'av1', alunoId: 'al1', serieId: null, destacada: false, data: '2026-11-20', hora: '10:00', duracaoMin: 60, status: 'cancelada', cobravel: false, notaTexto: '', anexos: [], temas: [], areas: [] },
    { id: 'av2', alunoId: 'al2', serieId: null, destacada: false, data: '2026-11-17', hora: '09:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [], temas: [], areas: [] }
  ]
};

/* O falso do endpoint: a próxima resposta, o atraso, e os pedidos que chegaram. */
const falso = { status: 200, corpo: null, atraso: 0, pedidos: [], fila: [] };

function textoDoPdf(base64) {
  const bruto = Buffer.from(base64, 'base64').toString('latin1');
  const rx = /\(((?:\\.|[^\\()])*)\)\s*Tj/g;
  const partes = [];
  let m;
  while ((m = rx.exec(bruto))) partes.push(m[1].replace(/\\([\\()])/g, '$1'));
  return partes;
}
/* Largura e altura de um JPEG em base64, pelo marcador SOF. */
function medidasDoJpeg(base64) {
  const b = Buffer.from(base64, 'base64');
  if (b[0] !== 0xFF || b[1] !== 0xD8) return null;
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xFF) return null;
    const m = b[i + 1], tam = b.readUInt16BE(i + 2);
    if (m >= 0xC0 && m <= 0xC3) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + tam;
  }
  return null;
}

const visivel = sel => `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; })()`;
/* O toque espera o rodapé ficar livre (ele ignora toques por 400 ms depois de mudar). */
async function clicar(pag, sel) {
  await esperar('à vista: ' + sel, () => pag.evaluate(visivel(sel)), v => v === true, 15000);
  await pausa(450);
  await pag.evaluate(s => document.querySelector(s).click(), sel);
  await pausa(150);
}
async function aberta(pag, id) { return pag.evaluate(i => { const m = document.getElementById(i); return !!m && m.classList.contains('aberto'); }, id); }
const temFolha = pag => pag.evaluate(() => !!document.querySelector('#plan-previa canvas.plan-previa-folha'));
/* Fecha a janela do planejamento; se ela perguntar, descarta. */
async function fecharPlanejamento(pag) {
  await pausa(450);
  await pag.evaluate(() => document.querySelector('#modal-planejamento .fechar').click());
  await pausa(300);
  if (await aberta(pag, 'modal-sair-planejamento')) await clicar(pag, '#descartar-planejamento');
  await esperar('a janela do planejamento fechou', () => aberta(pag, 'modal-planejamento'), v => v === false, 10000);
}
const planosDe = (pag, alunoId) => pag.evaluate(a => Store.carregar().then(d => Object.keys(d.ajustes)
  .filter(k => k.indexOf('planejamento:') === 0 && d.ajustes[k] && d.ajustes[k].alunoId === a && k !== 'planejamento:quebrado').length), alunoId);

/* A varredura de transbordo da janela, como a do celular. */
async function transbordo(pag) {
  return pag.evaluate(() => {
    const raiz = document.querySelector('#modal-planejamento .modal');
    const falhas = [];
    const W = window.innerWidth;
    Array.from(raiz.querySelectorAll('*')).forEach(e => {
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const tag = e.tagName.toLowerCase();
      const nome = tag + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : '');
      if (['input', 'textarea', 'select', 'canvas', 'svg', 'path', 'rect', 'circle'].indexOf(tag) < 0 && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== 'visible')
        falhas.push(nome + ' rola de lado (' + e.scrollWidth + ' > ' + e.clientWidth + ')');
      if (r.right > W + 1) falhas.push(nome + ' passa da borda (' + Math.round(r.right - W) + ' px)');
      if (tag === 'button' && (r.height < 44 || r.width < 44)) falhas.push(nome + ' com alvo de ' + Math.round(r.width) + 'x' + Math.round(r.height));
    });
    return falhas;
  });
}

(async () => {
  await amb.subir();
  const pag = await amb.pagina();
  await pag.setBypassServiceWorker(true);
  await pag.setRequestInterception(true);
  pag.on('request', req => {
    if (req.url().indexOf('/api/ia') < 0) { req.continue().catch(() => {}); return; }
    let corpo = null; try { corpo = JSON.parse(req.postData() || 'null'); } catch (e) { corpo = 'nao-json'; }
    falso.pedidos.push({ corpo, autorizacao: req.headers().authorization || '' });
    // a fila, quando há, responde na ordem; senão, a resposta corrente
    const vez = falso.fila.length ? falso.fila.shift() : { status: falso.status, corpo: falso.corpo };
    const responder = () => req.respond({ status: vez.status, contentType: 'application/json', body: JSON.stringify(vez.corpo) }).catch(() => {});
    if (falso.atraso) setTimeout(responder, falso.atraso); else responder();
  });
  /* O compartilhar do aparelho, falso desde a abertura (o rótulo do botão é
   * decidido ao desenhar): guarda o arquivo, ou cancela como o Android quando
   * window.__cancelarCompartilhar, ou segura a folha aberta. E conta os
   * downloads (o <a download> que o baixar cria). */
  await pag.evaluateOnNewDocument(() => {
    window.__compartilhado = null; window.__baixados = 0; window.__cancelarCompartilhar = false; window.__segurarCompartilhar = null;
    navigator.canShare = () => true;
    navigator.share = d => {
      if (window.__cancelarCompartilhar) return Promise.reject(Object.assign(new Error('cancelou'), { name: 'AbortError' }));
      if (window.__segurarCompartilhar) return new Promise(r => { window.__soltarCompartilhar = r; });
      const f = d.files[0];
      return f.arrayBuffer().then(b => { let s = ''; const u = new Uint8Array(b); for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
        window.__compartilhado = { nome: f.name, tipo: f.type, base64: btoa(s) }; });
    };
    const clicarOriginal = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { if (this.hasAttribute('download')) { window.__baixados++; return; } return clicarOriginal.apply(this, arguments); };
  });
  await H.abrirApp(pag, amb.ORIGEM);
  await pag.evaluate(async d => { await Store.salvar(d); }, DB);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  conf('(arranjo) os dois alunos sintéticos estão no banco', await pag.evaluate(() => Store.carregar().then(d => d.alunos.map(a => a.id).sort().join(','))), 'al1,al2');

  // ================================================================
  secao('0. Quem vê o quê: sem login, vê os salvos e não tem o Novo; com login, tem');
  await H.irParaAba(pag, 'alunos');
  await clicar(pag, '#lista-alunos .item-lista[data-aluno="al1"]');
  await esperar('a ficha abriu', () => aberta(pag, 'modal-aluno'), v => v === true, 10000);
  conf('sem login e sem plano salvo: a ficha nem mostra a seção', await pag.evaluate(() => !document.querySelector('#plan-secao')), true);
  await pag.evaluate(() => document.querySelector('#modal-aluno .fechar').click());
  await esperar('a ficha fechou', () => aberta(pag, 'modal-aluno'), v => v === false, 10000);
  await clicar(pag, '#lista-alunos .item-lista[data-aluno="al2"]');
  await esperar('a ficha abriu', () => aberta(pag, 'modal-aluno'), v => v === true, 10000);
  conf('sem login: a ficha mostra o plano salvo, sem o "Novo planejamento"', await pag.evaluate(() => [!!document.querySelector('#plan-secao'),
    document.querySelectorAll('#plan-secao .plan-item').length, !document.querySelector('#plan-novo')]), [true, 1, true]);
  await clicar(pag, '#plan-secao .plan-item');
  await esperar('sem login, o salvo abre na prévia', () => temFolha(pag), v => v === true, 30000);
  conf('sem login, no salvo: a prévia e o compartilhar, sem o Ajustar', await pag.evaluate(() => [!!document.querySelector('#plan-compartilhar'),
    !document.querySelector('#plan-ajuste'), !document.querySelector('#plan-mudar-algo')]), [true, true, true]);
  await clicar(pag, '#plan-conferir');
  conf('sem login, a conferência não manda "dizer no Ajustar" (não há Ajustar)', await pag.evaluate(() => /Ajustar/.test(document.querySelector('#plan-incertos').textContent)), false);
  await fecharPlanejamento(pag);
  await pag.evaluate(() => document.querySelector('#modal-aluno .fechar').click());
  await esperar('a ficha fechou', () => aberta(pag, 'modal-aluno'), v => v === false, 10000);
  await clicar(pag, '#nav-marcar-aula');
  await esperar('a aula nova abriu', () => aberta(pag, 'modal-aula'), v => v === true, 10000);
  conf('sem login: a aula nova sem o link do planejamento', await pag.evaluate(() => !document.querySelector('#aula-planejamento')), true);
  await pag.evaluate(() => document.querySelector('#modal-aula .fechar').click());
  await esperar('a aula nova fechou', () => aberta(pag, 'modal-aula'), v => v === false, 10000);
  await pag.evaluate(() => {
    const deVerdade = Nuvem.estado;
    Nuvem.estado = function () { return Object.assign({}, deVerdade(), { entrada: { uid: 'conta-sintetica', email: 'teste@exemplo' } }); };
    Nuvem.tokenParaIA = function () { return Promise.resolve('token-falso-da-prova'); };
  });

  // ================================================================
  secao('1. Da ficha até a prévia, o conferir, o ajuste, o salvar e o compartilhar');
  await H.irParaAba(pag, 'agenda');
  await H.irParaAba(pag, 'alunos');
  await clicar(pag, '#lista-alunos .item-lista[data-aluno="al1"]');
  await esperar('a ficha abriu', () => aberta(pag, 'modal-aluno'), v => v === true, 10000);
  conf('com login: a seção tem o "Novo planejamento" como botão principal, e a lista vazia', await pag.evaluate(() => {
    const s = document.querySelector('#plan-secao'); return !!s && !!s.querySelector('#plan-novo.principal') && !s.querySelector('.plan-item');
  }), true);
  conf('o plano quebrado do banco fica fora da lista, e a ficha abriu sem erro', [await pag.evaluate(() => !document.querySelector('[data-plano="quebrado"]')), pag.errosDePagina.length], [true, 0]);
  await clicar(pag, '#plan-novo');
  await esperar('a janela do planejamento abriu', () => aberta(pag, 'modal-planejamento'), v => v === true, 10000);
  conf('ela diz para quem é, e o foco está no campo', await pag.evaluate(() => [document.querySelector('#plan-para').textContent, document.activeElement && document.activeElement.id]),
    ['Para Zélia Sobrenomeum.', 'plan-texto']);
  conf('sem texto nem print, o Montar fica desligado', await pag.evaluate(() => document.querySelector('#plan-montar').disabled), true);
  await pag.type('#plan-texto', 'Provas de novembro. Uma matéria por dia.');
  conf('com texto, o Montar liga (o outro lado)', await pag.evaluate(() => document.querySelector('#plan-montar').disabled), false);
  // um print sintético de 2400 x 1200: tem de sair com no máximo 1568 px no lado maior, em JPEG
  await pag.evaluate(() => new Promise(r => {
    const c = document.createElement('canvas'); c.width = 2400; c.height = 1200;
    const x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, 2400, 1200); x.fillStyle = '#1f3a5f'; x.font = '80px sans-serif'; x.fillText('Aviso sintético de prova', 100, 300);
    c.toBlob(b => {
      const dt = new DataTransfer(); dt.items.add(new File([b], 'aviso.png', { type: 'image/png' }));
      const i = document.querySelector('#plan-arquivos'); i.files = dt.files; i.dispatchEvent(new Event('change')); r();
    }, 'image/png');
  }));
  conf('enquanto o print é preparado, aparece "Preparando" e o Montar espera', await pag.evaluate(() => {
    const e = document.querySelector('#plan-preparando'); return [!!e && !e.hidden && /Preparando 0 de 1/.test(e.textContent), document.querySelector('#plan-montar').disabled];
  }), [true, true]);
  await esperar('o print apareceu', () => pag.evaluate(() => document.querySelectorAll('#plan-prints .plan-print').length), v => v === 1, 10000);
  conf('a miniatura é uma imagem à parte, de até 200 px, e o Montar volta', await pag.evaluate(() => new Promise(r => {
    const i = document.querySelector('#plan-prints img'); const v = () => r([Math.max(i.naturalWidth, i.naturalHeight) <= 200, document.querySelector('#plan-montar').disabled]);
    if (i.complete) v(); else i.onload = v;
  })), [true, false]);
  await clicar(pag, '#plan-prints .plan-print-ver');
  conf('tocar na miniatura amplia o print', await aberta(pag, 'modal-plan-print'), true);
  await pag.evaluate(() => document.querySelector('#modal-plan-print .fechar').click());
  await esperar('o print ampliado fechou', () => aberta(pag, 'modal-plan-print'), v => v === false, 10000);

  falso.status = 200; falso.atraso = 1200; falso.corpo = respostaFalsa(planoFalso('al1'));
  await clicar(pag, '#plan-montar');
  conf('o "montando" com o tempo e o Cancelar do OUTRO lado do rodapé', await pag.evaluate(() => [!!document.querySelector('#plan-montando'),
    /1 ou 2 minutos/.test(document.querySelector('#plan-montando').textContent), document.querySelector('#plan-cancelar').classList.contains('esquerda')]), [true, true, true]);
  await esperar('a prévia desenhou o PDF', () => temFolha(pag), v => v === true, 30000);
  const p1 = falso.pedidos[0] && falso.pedidos[0].corpo;
  conf('um pedido saiu, com o token no cabeçalho', [falso.pedidos.length, falso.pedidos[0].autorizacao], [1, 'Bearer token-falso-da-prova']);
  conf('rota planejamento, formato json_schema, esforço e teto', [p1.rota, p1.formato && p1.formato.type, p1.esforco, p1.max_tokens], ['planejamento', 'json_schema', 'medium', 16000]);
  const conteudo1 = p1.messages[0].content;
  const img = conteudo1.find(c => c.type === 'image');
  const med = img ? medidasDoJpeg(img.source.data) : null;
  conf('o print foi como JPEG reduzido: 1568 x 784', [img && img.source.media_type, med && med.w, med && med.h], ['image/jpeg', 1568, 784]);
  const texto1 = conteudo1.find(c => c.type === 'text').text;
  conf('só o primeiro nome vai, e só o aluno da ficha', [texto1.indexOf('Zélia') >= 0, /Sobrenome/.test(texto1), texto1.indexOf('Bruno') < 0, texto1.indexOf('O aluno já está escolhido: id al1.') >= 0],
    [true, false, true, true]);
  conf('a prévia chegou: o foco no título e o anúncio na região viva', await pag.evaluate(() => [document.activeElement && document.activeElement.id,
    /pronto/.test(document.querySelector('#plan-anuncio').textContent)]), ['titulo-modal-planejamento', true]);
  conf('da ficha: sem "Para qual aluno?", e com "Na folha: Aluna | Aluno" sempre à vista, Aluna marcada', await pag.evaluate(() => [!document.querySelector('#plan-quem'),
    !!document.querySelector('#plan-na-folha'), document.querySelector('#plan-tratamento [data-valor="Aluna"]').getAttribute('aria-checked')]), [true, true, 'true']);
  conf('"Toque para ampliar" SOBRE a folha, no canto de cima', await pag.evaluate(() => {
    const l = document.querySelector('#plan-legenda'), f = document.querySelector('#plan-previa canvas').getBoundingClientRect(), r = l.getBoundingClientRect();
    return [l.textContent, r.top >= f.top && r.bottom <= f.top + 80 && r.right <= f.right + 1];
  }), ['Toque para ampliar', true]);
  /* O leitor do planejamento, no celular: compacto, com a letra legível e a
   * saída "Compartilhar PDF"; o Voltar fecha o LEITOR, e o planejamento fica. */
  await pag.setViewport({ width: 390, height: 844, hasTouch: true });
  await pausa(400);
  await clicar(pag, '#plan-ampliar');
  await esperar('a folha abriu no leitor de PDF do app', () => pag.evaluate(() => !!document.querySelector('#corpo-modal-leitor-pdf canvas')), v => v === true, 15000);
  conf('o leitor do planejamento: sem Anterior, Próxima, contador, Sumário nem "Ajustar à largura"; com menos, mais e "Compartilhar PDF"', await pag.evaluate(() => {
    const vis = s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && !e.hidden; };
    return [['#leitor-anterior', '#leitor-proxima', '#leitor-contador', '#leitor-sumario', '#leitor-largura'].map(vis).join(','),
      vis('#leitor-menos') && vis('#leitor-mais'), vis('#leitor-compartilhar') && document.querySelector('#leitor-compartilhar').textContent, vis('#leitor-exportar')];
  }), ['false,false,false,false,false', true, 'Compartilhar PDF', false]);
  conf('no celular, abre com zoom legível (150 a 200% da largura)', await pag.evaluate(() => {
    const c = document.querySelector('#corpo-modal-leitor-pdf canvas'), corpo = document.querySelector('#corpo-modal-leitor-pdf');
    const z = parseFloat(c.style.width) / Math.max(160, corpo.clientWidth - 36); return z >= 1.5 && z <= 2.01;
  }), true);
  await pag.evaluate(() => history.back());
  await esperar('o Voltar fechou o leitor', () => aberta(pag, 'modal-leitor-pdf'), v => v === false, 10000);
  conf('o Voltar fecha o LEITOR primeiro, e o planejamento (não salvo) fica aberto, sem pergunta', await pag.evaluate(() => [
    document.querySelector('#modal-planejamento').classList.contains('aberto'), document.querySelector('#modal-sair-planejamento').classList.contains('aberto')]), [true, false]);
  conf('fechado o leitor, ele volta a ser o de sempre (a Biblioteca não passa as opções): Anterior e Próxima à vista, sem a saída do planejamento', await pag.evaluate(() => [
    document.querySelector('#modal-leitor-pdf').classList.contains('leitor-compacto'), getComputedStyle(document.querySelector('#leitor-anterior')).display !== 'none',
    document.querySelector('#leitor-compartilhar').hidden]), [false, true, true]);
  await pag.setViewport({ width: 1280, height: 1000, hasTouch: true });
  await pausa(400);
  // o conferir: selo recolhido; aberto, traz a IA e a conferência do app
  conf('o selo "N itens para conferir", recolhido, na MESMA linha do "Mudar algo?"', await pag.evaluate(() => [document.querySelector('#plan-conferir').textContent, document.querySelector('#plan-conferir').getAttribute('aria-expanded'),
    !document.querySelector('#plan-incertos'), document.querySelector('#plan-conferir').parentNode === document.querySelector('#plan-mudar-algo').parentNode]), ['3 itens para conferir', 'false', true, true]);
  // o que ela escreve no ajuste sobrevive ao redesenho (abrir o selo redesenha)
  await pag.type('#plan-ajuste', 'Tira Matemática.');
  await clicar(pag, '#plan-conferir');
  conf('o texto do ajuste sobreviveu ao redesenho, e o foco voltou ao selo', await pag.evaluate(() => [document.querySelector('#plan-ajuste').value, document.activeElement && document.activeElement.id]),
    ['Tira Matemática.', 'plan-conferir']);
  const itens = await pag.evaluate(() => Array.from(document.querySelectorAll('#plan-incertos li')).map(l => l.textContent));
  conf('aberto: UM aviso por prova (o mais acionável) e a observação, cada um com "Ajustar ›"', [itens.length,
    itens[0].indexOf('Nenhum dia de estudo de Cambridge antes da prova de 19/11.') >= 0, itens[1].indexOf('Nenhum dia de estudo de História antes da prova de 27/11.') >= 0,
    /cortado/.test(itens[2]), itens.every(t => /Ajustar ›/.test(t))], [3, true, true, true, true]);
  conf('todos os itens com o mesmo estilo, tocáveis e sem sublinhado', await pag.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#plan-incertos .plan-item-conferir')); return [b.length, b.every(x => !/underline/.test(getComputedStyle(x).textDecorationLine))];
  }), [3, true]);
  await clicar(pag, '#plan-incertos .plan-item-conferir[data-data="2026-11-19"]');
  conf('tocar no aviso ACRESCENTA o dia ao que já está no campo, sem apagar', await pag.evaluate(() => [document.querySelector('#plan-ajuste').value, document.activeElement && document.activeElement.id]),
    ['Tira Matemática. No dia 19/11: ', 'plan-ajuste']);
  conf('rótulos do ajuste: "O que mudar?" e "Ajustar" (principal); no tablet deitado, com o campo à vista, o "Mudar algo?" some', await pag.evaluate(() => [document.querySelector('label[for="plan-ajuste"]').textContent,
    document.querySelector('#plan-ajustar').textContent, document.querySelector('#plan-ajustar').classList.contains('principal'), document.querySelector('#plan-ajuste').placeholder,
    getComputedStyle(document.querySelector('#plan-mudar-algo')).display]), ['O que mudar?', 'Ajustar', true, 'Ex.: Geografia no dia 21', 'none']);

  // o ajuste: a prévia fica, esmaecida; depois, "Mudou:" e "Desfazer ajuste"
  const plano2 = planoFalso('al1');
  plano2.grade.find(g => g.data === '2026-11-21').estudo = ['Geografia (1h)'];
  const resp1 = falso.corpo;
  falso.atraso = 1500; falso.corpo = respostaFalsa(plano2);
  await pag.evaluate(() => { document.querySelector('#plan-ajuste').value = ''; });
  await pag.type('#plan-ajuste', 'põe Geografia no dia 21');
  await clicar(pag, '#plan-ajustar');
  conf('ajustando: a prévia continua à vista, esmaecida, com o indicador por cima', await pag.evaluate(() => [!!document.querySelector('#plan-previa.plan-previa-esmaecida'),
    !!document.querySelector('#plan-ajustando'), !!document.querySelector('#plan-previa canvas, #plan-previa .plan-previa-recado')]), [true, true, true]);
  await esperar('o ajuste voltou', () => pag.evaluate(() => !!document.querySelector('#plan-mudou')), v => v === true, 30000);
  const p2 = falso.pedidos[1].corpo;
  conf('o ajuste leva a conversa inteira, com o content do assistente intacto', [p2.messages.map(m => m.role).join(','), JSON.stringify(p2.messages[1].content) === JSON.stringify(resp1.resposta.content),
    JSON.stringify(p2.messages[0]) === JSON.stringify(p1.messages[0]), p2.system === p1.system], ['user,assistant,user', true, true, true]);
  conf('"Mudou:" diz a matéria e a ação, com o "Desfazer ajuste"', await pag.evaluate(() => [document.querySelector('#plan-mudou span').textContent, !!document.querySelector('#plan-desfazer-ajuste')]),
    ['Mudou: entrou Geografia (1h) no dia 21/11 e saiu Matemática (1h) do dia 21/11.', true]);
  await clicar(pag, '#plan-desfazer-ajuste');
  conf('desfeito: o "Mudou:" sai', await pag.evaluate(() => !document.querySelector('#plan-mudou')), true);
  // o pedido seguinte mostra o plano de ANTES do ajuste (Matemática no dia 21): o desfazer voltou mesmo
  falso.atraso = 0; falso.corpo = respostaFalsa(plano2);
  await pag.type('#plan-ajuste', 'põe Geografia no dia 21');
  await clicar(pag, '#plan-ajustar');
  await esperar('o ajuste depois do desfazer voltou', () => pag.evaluate(() => !!document.querySelector('#plan-mudou')), v => v === true, 30000);
  const p3 = falso.pedidos[2].corpo.messages[0].content[0].text;
  conf('depois do Desfazer, o ajuste parte do plano anterior (Matemática no dia 21), num turno só',
    [falso.pedidos[2].corpo.messages.length, p3.indexOf('"data":"2026-11-21","prova":null,"estudo":["Matemática (1h)"]') >= 0], [1, true]);

  // a falha do ajuste devolve o texto ao campo, com o erro acima dele
  falso.fila = [{ status: 503, corpo: { ok: false, codigo: 'ocupado' } }];
  await pag.type('#plan-ajuste', 'tira a aula do dia 18');
  await clicar(pag, '#plan-ajustar');
  await esperar('o erro do ajuste', () => pag.evaluate(() => !!document.querySelector('#plan-erro-ajuste')), v => v === true, 15000);
  conf('falha no ajuste: o texto volta ao campo e o erro fica acima dele (role=alert)', await pag.evaluate(() => [document.querySelector('#plan-ajuste').value,
    document.querySelector('#plan-erro-ajuste').getAttribute('role'), !!(document.querySelector('#plan-erro-ajuste').compareDocumentPosition(document.querySelector('#plan-ajuste')) & Node.DOCUMENT_POSITION_FOLLOWING)]),
    ['tira a aula do dia 18', 'alert', true]);
  // a conversa passou do teto do endpoint: recomeça sozinha com o plano como texto
  falso.fila = [{ status: 400, corpo: { ok: false, codigo: 'texto_demais' } }, { status: 200, corpo: respostaFalsa(plano2) }];
  await pag.evaluate(() => { document.querySelector('#plan-ajuste').value = ''; });
  await pag.type('#plan-ajuste', 'mantém tudo');
  const antesTeto = falso.pedidos.length;
  await clicar(pag, '#plan-ajustar');
  await esperar('o ajuste recomeçado voltou', () => pag.evaluate(() => !!document.querySelector('#plan-mudou') && !document.querySelector('#plan-ajustando')).then(v => v && falso.pedidos.length === antesTeto + 2), v => v === true, 30000);
  const pTeto = falso.pedidos[antesTeto].corpo, pRec = falso.pedidos[antesTeto + 1].corpo;
  conf('texto_demais: o primeiro levava a conversa, o segundo recomeça com um turno e o plano atual, sem frase de encurtar', [pTeto.messages.length > 1, pRec.messages.length,
    pRec.messages[0].content[0].text.indexOf('Este é o plano atual') >= 0, await pag.evaluate(() => !document.querySelector('#plan-erro-ajuste'))], [true, 1, true, true]);

  // salvar com DOIS toques seguidos: um plano só
  await pausa(450);
  await pag.evaluate(() => { const b = document.querySelector('#plan-salvar'); b.click(); b.click(); });
  await pausa(1500);
  prop('dois toques seguidos no "Salvar na ficha" gravam UM plano só', (await planosDe(pag, 'al1')) === 1);
  if (MODO) throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true });
  await esperar('salvo', () => pag.evaluate(() => { const b = document.querySelector('#plan-salvar'); return b && b.textContent; }), v => v === 'Salvo na ficha', 10000);
  const salvo = await pag.evaluate(() => Store.carregar().then(d => {
    const k = Object.keys(d.ajustes).filter(x => x.indexOf('planejamento:') === 0 && d.ajustes[x].alunoId === 'al1' && x !== 'planejamento:quebrado');
    return { chaves: k.length, reg: k.length ? d.ajustes[k[0]] : null };
  }));
  conf('o plano entrou em ajustes["planejamento:<id>"], do aluno al1, com Geografia no dia 21', [salvo.chaves, salvo.reg && salvo.reg.alunoId,
    JSON.stringify(salvo.reg.plano.grade.find(g => g.data === '2026-11-21').estudo)], [1, 'al1', JSON.stringify(['Geografia (1h)'])]);
  const regTexto = JSON.stringify(salvo.reg);
  conf('os prints NÃO são guardados (nem o base64, nem a conversa)', [regTexto.indexOf(img.source.data.slice(0, 40)) < 0, regTexto.indexOf('/9j/') < 0, regTexto.indexOf('assinatura-sintetica') < 0, regTexto.length < 20000], [true, true, true, true]);

  // compartilhar: cancelar a folha de compartilhamento não baixa; a trava; e o arquivo certo
  await pag.evaluate(() => { window.__cancelarCompartilhar = true; window.__baixados = 0; });
  await clicar(pag, '#plan-compartilhar');
  await pausa(300);
  conf('cancelar a folha de compartilhamento (AbortError) não vira download', await pag.evaluate(() => window.__baixados), 0);
  await pag.evaluate(() => { window.__cancelarCompartilhar = false; window.__segurarCompartilhar = true; });
  await clicar(pag, '#plan-compartilhar');
  conf('com a folha de compartilhamento aberta, o botão fica travado', await pag.evaluate(() => document.querySelector('#plan-compartilhar').disabled), true);
  await pag.evaluate(() => { window.__segurarCompartilhar = null; window.__soltarCompartilhar(); });
  await esperar('o botão volta', () => pag.evaluate(() => document.querySelector('#plan-compartilhar').disabled), v => v === false, 5000);
  await clicar(pag, '#plan-compartilhar');
  await esperar('o PDF foi compartilhado', () => pag.evaluate(() => window.__compartilhado && window.__compartilhado.nome), v => !!v, 10000);
  const arq = await pag.evaluate(() => window.__compartilhado);
  conf('o nome do arquivo', [arq.nome, arq.tipo], ['Planejamento de Estudos Zélia - Provas de Novembro.pdf', 'application/pdf']);
  const t = textoDoPdf(arq.base64);
  conf('"Aula com a Nath" só nas 4 aulas da agenda de Zélia no período (sem a cancelada, sem a do Bruno)', t.filter(x => x === 'Aula com a Nath').length, 4);
  conf('com o horário colado "às 15h30", e o feriado de 20/11', [t.filter(x => x === 'às 15h30').length, t.indexOf('feriado') >= 0], [4, true]);
  conf('"Aluna: Zélia", "Prova Cambridge" e o "não enviado"', [t.indexOf('Aluna: Zélia') >= 0, t.join(' ').indexOf('Prova Cambridge') >= 0, t.indexOf('Conteúdo ainda não enviado pela escola.') >= 0], [true, true, true]);
  conf('a conferência do app NÃO vai para a folha', t.join(' ').indexOf('Nenhum dia de estudo') < 0, true);

  // de volta à ficha: o foco volta ao botão de origem, e o salvo está na lista
  await fecharPlanejamento(pag);
  conf('ao fechar, o foco volta ao "Novo planejamento"', await pag.evaluate(() => new Promise(r => setTimeout(() => r(document.activeElement && document.activeElement.id), 100))), 'plan-novo');
  conf('a ficha lista o plano salvo, com o sinal de que abre', await pag.evaluate(() => [Array.from(document.querySelectorAll('#plan-secao .plan-item-nome')).map(e => e.textContent).join('|'),
    !!document.querySelector('#plan-secao .plan-item .plan-item-abre'), parseFloat(getComputedStyle(document.querySelector('#plan-secao .plan-item-quando')).fontSize) >= 14]),
    ['Provas de novembro, de 16/11 a 27/11', true, true]);
  await clicar(pag, '#plan-secao .plan-item');
  await esperar('o salvo abre direto na prévia', () => temFolha(pag), v => v === true, 30000);
  conf('e já diz "Salvo na ficha", sem pedido novo', [await pag.evaluate(() => document.querySelector('#plan-salvar').textContent), falso.pedidos.length], ['Salvo na ficha', antesTeto + 2]);
  conf('no salvo, "Para qual aluno?" e o "Excluir este plano"', await pag.evaluate(() => [!!document.querySelector('#plan-quem #plan-alunos'), !!document.querySelector('#plan-excluir')]), [true, true]);
  await clicar(pag, '#plan-ampliar');
  await esperar('o leitor abriu do salvo', () => aberta(pag, 'modal-leitor-pdf'), v => v === true, 10000);
  await pag.evaluate(() => history.back());
  await esperar('o Voltar fechou o leitor do salvo', () => aberta(pag, 'modal-leitor-pdf'), v => v === false, 10000);
  conf('com o plano salvo, o Voltar também fecha só o leitor', await pag.evaluate(() => document.querySelector('#modal-planejamento').classList.contains('aberto')), true);

  // excluir o salvo: sem pergunta, com Desfazer
  await clicar(pag, '#plan-excluir');
  await esperar('o plano saiu', () => planosDe(pag, 'al1'), v => v === 0, 10000);
  conf('excluído: a janela fechou e a ficha ficou sem o plano, com Desfazer', await pag.evaluate(() => [document.querySelector('#modal-planejamento').classList.contains('aberto'),
    document.querySelectorAll('#plan-secao .plan-item').length, document.querySelector('#aviso-acao').textContent]), [false, 0, 'Desfazer']);
  await pag.evaluate(() => document.querySelector('#aviso-acao').click());
  await esperar('o Desfazer trouxe o plano de volta', () => planosDe(pag, 'al1'), v => v === 1, 10000);
  await clicar(pag, '#plan-secao .plan-item');
  await esperar('o salvo abre de novo', () => temFolha(pag), v => v === true, 30000);

  // ================================================================
  secao('7. A trava de transbordo da janela (prévia e pedido), 360, 390 e 412 px, letra normal e 130%');
  const medir = async (estado) => {
    for (const largura of [360, 390, 412]) {
      for (const letra of ['100%', '130%']) {
        await pag.setViewport({ width: largura, height: 800, hasTouch: true });
        await pag.evaluate(l => { document.documentElement.style.fontSize = l; }, letra);
        await pausa(300);
        const f = await transbordo(pag);
        conf(estado + ' em ' + largura + ' px, letra ' + letra + ': nada transborda', f.slice(0, 6), []);
        const rodape = await pag.evaluate(() => { const r = document.querySelector('#rodape-modal-planejamento').getBoundingClientRect(); return r.height / window.innerHeight; });
        conf(estado + ' em ' + largura + ' px, letra ' + letra + ': o rodapé não passa de 20% da altura (' + Math.round(rodape * 100) + '%)', rodape <= 0.2, true);
        if (process.env.SALVAR_PRINTS && largura === 390) {
          await pag.screenshot({ path: path.join(process.env.SALVAR_PRINTS, 'planejamento_' + (estado === 'a prévia' ? 'previa' : 'pedido') + '_390_' + letra.replace('%', '') + '.png') });
        }
      }
    }
    await pag.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await pag.setViewport({ width: 1280, height: 1000, hasTouch: true });
    await pausa(300);
  };
  await medir('a prévia');
  conf('no celular, o rodapé empilhado com o principal em cima', await (async () => {
    await pag.setViewport({ width: 360, height: 800, hasTouch: true }); await pausa(300);
    const r = await pag.evaluate(() => { const c = document.querySelector('#plan-compartilhar').getBoundingClientRect(), s = document.querySelector('#plan-salvar').getBoundingClientRect(); return [c.top < s.top, Math.abs(c.width - s.width) < 2]; });
    await pag.setViewport({ width: 1280, height: 1000, hasTouch: true }); await pausa(300);
    return r;
  })(), [true, true]);
  conf('no tablet deitado, a janela larga com a folha à esquerda e o conferir à direita', await pag.evaluate(() => {
    const f = document.querySelector('#plan-previa').getBoundingClientRect(), l = document.querySelector('.plan-lado').getBoundingClientRect();
    return [document.querySelector('#modal-planejamento .modal').getBoundingClientRect().width > 900, f.left < l.left, Math.abs(f.top - l.top) < 40];
  }), [true, true, true]);
  // controle: o instrumento vê um elemento largo demais (senão o zero não prova nada)
  await pag.setViewport({ width: 360, height: 800, hasTouch: true });
  await pag.evaluate(() => { const d = document.createElement('div'); d.id = 'largo-de-prova'; d.style.cssText = 'width:600px;height:10px';
    document.querySelector('#corpo-modal-planejamento').appendChild(d); });
  await pausa(200);
  const vistos = await transbordo(pag);
  conf('CONTROLE: um elemento de 600 px em 360 px é acusado', vistos.some(f => /largo-de-prova|rola de lado/.test(f)), true);
  await pag.evaluate(() => document.querySelector('#largo-de-prova').remove());
  await pag.setViewport({ width: 1280, height: 1000, hasTouch: true });
  await pausa(200);
  await fecharPlanejamento(pag);
  await clicar(pag, '#plan-novo');
  await esperar('o pedido abriu', () => pag.evaluate(() => !!document.querySelector('#plan-texto')), v => v === true, 10000);
  await medir('o pedido');

  // ================================================================
  secao('3. Fechar com texto pergunta; o Cancelar do "montando" volta ao pedido sem perder o texto');
  await pag.type('#plan-texto', 'texto que não pode sumir');
  await pausa(450);
  await pag.evaluate(() => document.querySelector('#modal-planejamento .fechar').click());
  await esperar('a pergunta abriu', () => aberta(pag, 'modal-sair-planejamento'), v => v === true, 5000);
  conf('a pergunta é uma janela própria: "Continuar editando" é o principal e "Descartar" é vermelho', await pag.evaluate(() => [
    document.querySelector('#continuar-planejamento').classList.contains('principal'), document.querySelector('#descartar-planejamento').classList.contains('perigo')]), [true, true]);
  await clicar(pag, '#continuar-planejamento');
  conf('"Continuar editando": a janela fica, com o texto', await pag.evaluate(() => [document.querySelector('#modal-sair-planejamento').classList.contains('aberto'),
    document.querySelector('#modal-planejamento').classList.contains('aberto'), document.querySelector('#plan-texto').value]), [false, true, 'texto que não pode sumir']);
  falso.atraso = 2500; falso.corpo = respostaFalsa(planoFalso('al1'));
  const antesCancelar = falso.pedidos.length;
  await clicar(pag, '#plan-montar');
  await clicar(pag, '#plan-cancelar');
  await pausa(3000);
  conf('voltou ao pedido, sem prévia, com o texto', await pag.evaluate(() => [!!document.querySelector('#plan-texto'), !document.querySelector('#plan-previa'),
    document.querySelector('#plan-texto') && document.querySelector('#plan-texto').value, !document.querySelector('#plan-erro')]), [true, true, 'texto que não pode sumir', true]);
  conf('(o pedido tinha saído)', falso.pedidos.length, antesCancelar + 1);

  // ================================================================
  secao('5. O erro sem_permissao e o sem internet');
  falso.atraso = 0; falso.status = 403; falso.corpo = { ok: false, codigo: 'sem_permissao' };
  await clicar(pag, '#plan-montar');
  await esperar('a frase do erro', () => pag.evaluate(() => { const e = document.querySelector('#plan-erro span'); return e && e.textContent; }), v => !!v, 15000);
  conf('sem_permissao vira a frase dela, e o texto continua', await pag.evaluate(() => [document.querySelector('#plan-erro span').textContent, document.querySelector('#plan-texto').value]),
    ['A IA ainda não está liberada nesta conta.', 'texto que não pode sumir']);
  conf('sem permissão, tentar de novo não resolve: sem o botão, e o Montar desligado', await pag.evaluate(() => [!document.querySelector('#plan-tentar'), document.querySelector('#plan-montar').disabled]), [true, true]);
  const antesOffline = falso.pedidos.length;
  await pag.setOfflineMode(true);
  await esperar('a frase do sem internet', () => pag.evaluate(() => { const e = document.querySelector('#plan-erro span'); return e && e.textContent; }), v => v === 'Precisa de internet para montar o planejamento.', 15000);
  conf('sem internet: o Montar desligado, o "Tentar de novo", e nenhum pedido sai', await pag.evaluate(() => [document.querySelector('#plan-montar').disabled, !!document.querySelector('#plan-tentar')]), [true, true]);
  await pag.evaluate(() => document.querySelector('#plan-tentar').click());
  await pausa(300);
  conf('(nenhum pedido saiu sem internet)', falso.pedidos.length, antesOffline);
  await pag.setOfflineMode(false);
  await esperar('com a internet de volta, o Montar liga', () => pag.evaluate(() => document.querySelector('#plan-montar').disabled), v => v === false, 10000);
  await fecharPlanejamento(pag);
  await pag.evaluate(() => document.querySelector('#modal-aluno .fechar').click());
  await esperar('a ficha fechou', () => aberta(pag, 'modal-aluno'), v => v === false, 10000);

  // ================================================================
  secao('4. O link da aula nova, no pé; "Para qual aluno?" com seleção única');
  falso.status = 200; falso.atraso = 0; falso.corpo = respostaFalsa(planoFalso('al2', 'Aluno', 'baixa'));
  await clicar(pag, '#nav-marcar-aula');
  await esperar('a janela da aula nova abriu', () => aberta(pag, 'modal-aula'), v => v === true, 10000);
  conf('o "+" continua abrindo a aula nova, e o link do planejamento fica no PÉ do formulário', await pag.evaluate(() => {
    const c = document.querySelector('#corpo-modal-aula'), l = document.querySelector('#aula-planejamento');
    return [document.querySelector('#titulo-modal-aula').textContent, !!l && l.textContent, !!l && c.lastElementChild.contains(l)];
  }), ['Nova aula', 'Fazer planejamento de estudos', true]);
  // a aula nova preenchida: o link pergunta antes de fechar
  await pag.evaluate(() => { const s = document.querySelector('#campo-aluno'); s.value = s.options[s.options.length - 1].value; s.dispatchEvent(new Event('change', { bubbles: true })); });
  await clicar(pag, '#aula-planejamento');
  conf('com a aula preenchida, o link pergunta antes de fechar', await pag.evaluate(() => [document.querySelector('#modal-sair-planejamento').classList.contains('aberto'),
    document.querySelector('#titulo-sair-planejamento').textContent, document.querySelector('#modal-aula').classList.contains('aberto')]), [true, 'Sair da aula nova?', true]);
  await clicar(pag, '#descartar-planejamento');
  await esperar('a janela do planejamento abriu pelo link', () => aberta(pag, 'modal-planejamento'), v => v === true, 10000);
  conf('sem aluno escolhido, e a aula nova fechou', await pag.evaluate(() => [!document.querySelector('#plan-para'), !document.querySelector('#modal-aula').classList.contains('aberto')]), [true, true]);
  await pag.type('#plan-texto', 'provas do aluno de segunda');
  await clicar(pag, '#plan-montar');
  await esperar('a prévia do atalho', () => pag.evaluate(() => !!document.querySelector('#plan-quem')), v => v === true, 30000);
  const pa = falso.pedidos[falso.pedidos.length - 1].corpo;
  conf('o pedido do atalho NÃO diz aluno escolhido, e leva a lista', [pa.messages[0].content[0].text.indexOf('já está escolhido') < 0,
    pa.messages[0].content[0].text.indexOf('- id al1: Zélia (aulas fixas: segunda e quarta às 15h30)') >= 0], [true, true]);
  const marcados = () => pag.evaluate(() => Array.from(document.querySelectorAll('#plan-alunos [role="radio"]')).filter(b => b.getAttribute('aria-checked') === 'true').map(b => b.getAttribute('data-aluno')));
  conf('"Para qual aluno?" (radiogroup); com confiança baixa, nenhum marcado e a folha espera a escolha', [await pag.evaluate(() => [document.querySelector('#plan-pergunta').textContent,
    document.querySelector('#plan-alunos').getAttribute('role'), !!document.querySelector('#plan-sem-aluno'), document.querySelector('#plan-salvar').disabled]), await marcados()],
    [['Para qual aluno?', 'radiogroup', true, true], []]);
  conf('sem o aluno escolhido, o selo de conferir não aparece', await pag.evaluate(() => !document.querySelector('#plan-conferir')), true);
  await clicar(pag, '#plan-alunos [data-aluno="al1"]');
  conf('um toque marca UM aluno, com o ✓', [await marcados(), await pag.evaluate(() => !!document.querySelector('#plan-alunos [data-aluno="al1"] svg'))], [['al1'], true]);
  await clicar(pag, '#plan-alunos [data-aluno="al2"]');
  conf('outro toque troca: continua UM só marcado (o outro lado)', await marcados(), ['al2']);
  await clicar(pag, '#plan-alunos [data-aluno="al1"]');
  await clicar(pag, '#plan-tratamento [data-tratamento="Aluna"]');
  conf('"Na folha: Aluna" marcada', await pag.evaluate(() => document.querySelector('#plan-tratamento [data-tratamento="Aluna"]').getAttribute('aria-checked')), 'true');
  await esperar('a prévia redesenhou para Zélia', () => temFolha(pag), v => v === true, 30000);
  // depois da troca, o ajuste recomeça a conversa com o aluno novo
  const antesDoAjuste = falso.pedidos.length;
  await pag.type('#plan-ajuste', 'põe Geografia no dia 21');
  await clicar(pag, '#plan-ajustar');
  await esperar('o ajuste depois da troca voltou', () => pag.evaluate(() => !!document.querySelector('#plan-mudou')).then(v => v && falso.pedidos.length === antesDoAjuste + 1), v => v === true, 30000);
  const pt = falso.pedidos[falso.pedidos.length - 1].corpo, tt = pt.messages[0].content[0].text;
  conf('ajuste depois de trocar o aluno: um turno só, com o plano atual e o aluno novo (e sem o antigo)', [pt.messages.length, tt.indexOf('Este é o plano atual') >= 0,
    tt.indexOf('O aluno já está escolhido: id al1.') >= 0, tt.indexOf('Zélia') >= 0, tt.indexOf('Bruno') < 0, tt.indexOf('"alunoId":"al1"') >= 0], [1, true, true, true, true, true]);
  conf('e continua marcada a Zélia', await marcados(), ['al1']);
  // compartilhar o plano não salvo: ele vai para a ficha, e fechar não pergunta mais
  const antesDeCompartilhar = await planosDe(pag, 'al1');
  await clicar(pag, '#plan-compartilhar');
  await esperar('compartilhou e salvou', () => planosDe(pag, 'al1'), v => v === antesDeCompartilhar + 1, 10000);
  await pausa(450);
  await pag.evaluate(() => document.querySelector('#modal-planejamento .fechar').click());
  await pausa(300);
  conf('compartilhar salvou na ficha, e fechar não perguntou', await pag.evaluate(() => [document.querySelector('#modal-sair-planejamento').classList.contains('aberto'),
    document.querySelector('#modal-planejamento').classList.contains('aberto')]), [false, false]);

  // ================================================================
  secao('2. O plano salvo no aluno errado muda de ficha');
  await H.irParaAba(pag, 'agenda');
  await H.irParaAba(pag, 'alunos');
  await clicar(pag, '#lista-alunos .item-lista[data-aluno="al1"]');
  await esperar('a ficha abriu', () => aberta(pag, 'modal-aluno'), v => v === true, 10000);
  await clicar(pag, '#plan-secao .plan-item');
  await esperar('o salvo abriu', () => temFolha(pag), v => v === true, 30000);
  await clicar(pag, '#plan-alunos [data-aluno="al2"]');
  conf('trocado: o Salvar volta a valer', await pag.evaluate(() => [document.querySelector('#plan-salvar').textContent, document.querySelector('#plan-salvar').disabled]), ['Salvar na ficha', false]);
  await clicar(pag, '#plan-salvar');
  await esperar('salvo no outro aluno', () => planosDe(pag, 'al2'), v => v === 2, 10000);
  await fecharPlanejamento(pag);
  conf('o plano trocado saiu da ficha de Zélia e foi para o Bruno (fica o que veio do compartilhar)', [await pag.evaluate(() => document.querySelectorAll('#plan-secao .plan-item').length), await planosDe(pag, 'al1'), await planosDe(pag, 'al2')], [1, 1, 2]);
  await pag.evaluate(() => document.querySelector('#modal-aluno .fechar').click());
  await esperar('a ficha fechou', () => aberta(pag, 'modal-aluno'), v => v === false, 10000);

  // ================================================================
  secao('6. O observador (cópia de outra conta) não vê nada do planejamento');
  await pag.evaluate(() => {
    window.__estadoDeVerdade = Nuvem.estado;
    Nuvem.estado = function () { return Object.assign({}, window.__estadoDeVerdade(), { uidDona: 'conta-da-dona', entrada: { uid: 'conta-do-observador', email: 'obs@exemplo' } }); };
  });
  await H.irParaAba(pag, 'agenda');
  await H.irParaAba(pag, 'alunos');
  await clicar(pag, '#lista-alunos .item-lista[data-aluno="al2"]');
  await esperar('a ficha abriu', () => aberta(pag, 'modal-aluno'), v => v === true, 10000);
  conf('observador: a ficha do Bruno (que tem planos) sem a seção Planejamentos', await pag.evaluate(() => !document.querySelector('#plan-secao')), true);
  await pag.evaluate(() => document.querySelector('#modal-aluno .fechar').click());
  await esperar('a ficha fechou', () => aberta(pag, 'modal-aluno'), v => v === false, 10000);
  await clicar(pag, '#nav-marcar-aula');
  await esperar('a janela da aula nova abriu', () => aberta(pag, 'modal-aula'), v => v === true, 10000);
  conf('observador: a aula nova sem o link do planejamento', await pag.evaluate(() => !document.querySelector('#aula-planejamento')), true);
  await pag.evaluate(() => { Nuvem.estado = window.__estadoDeVerdade; });

  conf('nenhum erro de página', pag.errosDePagina, []);
})().then(() => H.fim(amb)(), H.fim(amb));
