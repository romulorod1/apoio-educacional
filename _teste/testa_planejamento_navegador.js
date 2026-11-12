/* testa_planejamento_navegador.js (projeto IA no app, fase 2)
 *
 * O planejamento de estudos no aplicativo de verdade (Chrome, puppeteer-core),
 * com alunos SINTÉTICOS e o endpoint /api/ia INTERCEPTADO por um falso: nenhuma
 * chamada à API de verdade, nenhuma conta real. O login da nuvem é trocado por
 * um token falso (Nuvem.tokenParaIA), porque quem confere o login é o
 * endpoint, que aqui é falso.
 *
 * O que prova:
 *   1. da FICHA do aluno: "Novo planejamento", texto e print anexado (reduzido
 *      no aparelho a no máximo 1568 px, JPEG), "Montar planejamento", o
 *      "montando", a prévia que é o PRÓPRIO PDF (canvas do PDF.js), o resumo
 *      dos incertos acima da prévia, o ajuste (a conversa vai com o content
 *      do assistente intacto), o Salvar na ficha (o plano entra em
 *      ajustes['planejamento:<id>'], SEM os prints) e o Compartilhar (o PDF
 *      tem "Aula com a Nath" só nas aulas da agenda daquele aluno, sem a
 *      cancelada, e o feriado nacional);
 *   2. o pedido que sai: rota planejamento, formato json_schema, só o primeiro
 *      nome, "o aluno já está escolhido";
 *   3. o "Cancelar" no meio do "montando" volta ao pedido sem perder o texto;
 *   4. o ATALHO do "+": a janela da aula nova tem "Planejamento de estudos",
 *      que abre o fluxo sem aluno; a prévia pergunta "É o Bruno?", e a troca
 *      é de um toque (e "Aluna" ou "Aluno", outro toque);
 *   5. o erro sem_permissao vira a frase dela; sem internet, nenhum pedido sai
 *      e a frase é "Precisa de internet para montar o planejamento.";
 *   6. o observador (a cópia de outra conta) não vê o botão nem o atalho;
 *   7. a trava de transbordo da janela, no pedido e na prévia, a 360, 390 e
 *      412 px, com a letra normal e a 130%: nada rola de lado, nada passa da
 *      borda, todo botão com alvo de 44 px.
 *
 * Porta 8971. O service worker é contornado (a interceptação do /api/ia é
 * pela página).
 */
'use strict';
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8971;
const amb = H.criarAmbiente(PORTA, 'perfil_planejamento_nav', {});

const DB = {
  versao: 1, resumos: [], pagamentos: [],
  ajustes: { cargaInicial: true, versaoVista: '9.9.9', ultimoAnoLetivoAtualizado: 2026 },
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

/* O falso do endpoint: a próxima resposta, o atraso, e os pedidos que chegaram. */
const falso = { status: 200, corpo: null, atraso: 0, pedidos: [] };

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
async function clicar(pag, sel) {
  await esperar('à vista: ' + sel, () => pag.evaluate(visivel(sel)), v => v === true, 15000);
  await pag.evaluate(s => document.querySelector(s).click(), sel);
  await pausa(150);
}
async function aberta(pag, id) { return pag.evaluate(i => { const m = document.getElementById(i); return !!m && m.classList.contains('aberto'); }, id); }

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
    const responder = () => req.respond({ status: falso.status, contentType: 'application/json', body: JSON.stringify(falso.corpo) }).catch(() => {});
    if (falso.atraso) setTimeout(responder, falso.atraso); else responder();
  });
  await H.abrirApp(pag, amb.ORIGEM);
  await pag.evaluate(async d => { await Store.salvar(d); }, DB);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  /* O login da nuvem vira um token falso: quem confere o login é o endpoint, falso aqui. */
  const stub = () => pag.evaluate(() => { Nuvem.tokenParaIA = function () { return Promise.resolve('token-falso-da-prova'); }; });
  await stub();
  conf('(arranjo) os dois alunos sintéticos estão no banco', await pag.evaluate(() => Store.carregar().then(d => d.alunos.map(a => a.id).sort().join(','))), 'al1,al2');

  // ================================================================
  secao('1. Da ficha do aluno até a prévia, o ajuste, o salvar e o compartilhar');
  await H.irParaAba(pag, 'alunos');
  await clicar(pag, '#lista-alunos .item-lista[data-aluno="al1"]');
  await esperar('a ficha abriu', () => aberta(pag, 'modal-aluno'), v => v === true, 10000);
  conf('a ficha tem a seção Planejamentos, vazia, com o botão', await pag.evaluate(() => {
    const s = document.querySelector('#plan-secao'); return !!s && !!s.querySelector('#plan-novo') && !s.querySelector('.plan-item');
  }), true);
  await clicar(pag, '#plan-novo');
  await esperar('a janela do planejamento abriu', () => aberta(pag, 'modal-planejamento'), v => v === true, 10000);
  conf('ela diz para quem é (o aluno da ficha)', await pag.evaluate(() => document.querySelector('#plan-para').textContent), 'Para Zélia Sobrenomeum.');
  conf('o campo grande, o anexar prints e o montar', await pag.evaluate(() => ['#plan-texto', '#plan-anexar', '#plan-montar'].map(s => !!document.querySelector(s))), [true, true, true]);
  await pag.type('#plan-texto', 'Provas de novembro. Uma matéria por dia.');
  // um print sintético de 2400 x 1200: tem de sair com no máximo 1568 px no lado maior, em JPEG
  await pag.evaluate(() => new Promise(r => {
    const c = document.createElement('canvas'); c.width = 2400; c.height = 1200;
    const x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, 2400, 1200); x.fillStyle = '#1f3a5f'; x.font = '80px sans-serif'; x.fillText('Aviso sintético de prova', 100, 300);
    c.toBlob(b => {
      const dt = new DataTransfer(); dt.items.add(new File([b], 'aviso.png', { type: 'image/png' }));
      const i = document.querySelector('#plan-arquivos'); i.files = dt.files; i.dispatchEvent(new Event('change')); r();
    }, 'image/png');
  }));
  await esperar('o print apareceu', () => pag.evaluate(() => document.querySelectorAll('#plan-prints .plan-print').length), v => v === 1, 10000);

  falso.status = 200; falso.atraso = 900; falso.corpo = respostaFalsa(planoFalso('al1'));
  await clicar(pag, '#plan-montar');
  conf('o "montando" aparece, com o cancelar', await pag.evaluate(() => !!document.querySelector('#plan-montando') && !!document.querySelector('#plan-cancelar')), true);
  await esperar('a prévia desenhou o PDF', () => pag.evaluate(() => !!document.querySelector('#plan-previa canvas.plan-previa-folha')), v => v === true, 30000);
  const p1 = falso.pedidos[0] && falso.pedidos[0].corpo;
  conf('um pedido saiu, com o token no cabeçalho', [falso.pedidos.length, falso.pedidos[0].autorizacao], [1, 'Bearer token-falso-da-prova']);
  conf('rota planejamento, formato json_schema, esforço e teto', [p1.rota, p1.formato && p1.formato.type, p1.esforco, p1.max_tokens], ['planejamento', 'json_schema', 'medium', 16000]);
  const conteudo1 = p1.messages[0].content;
  const img = conteudo1.find(c => c.type === 'image');
  const med = img ? medidasDoJpeg(img.source.data) : null;
  conf('o print foi como JPEG reduzido: 1568 x 784', [img && img.source.media_type, med && med.w, med && med.h], ['image/jpeg', 1568, 784]);
  const texto1 = conteudo1.find(c => c.type === 'text').text;
  conf('só o primeiro nome vai, nunca o sobrenome', [texto1.indexOf('Zélia') >= 0, /Sobrenome/.test(texto1)], [true, false]);
  conf('o pedido diz que o aluno já está escolhido', texto1.indexOf('O aluno já está escolhido: id al1.') >= 0, true);
  conf('o texto dela vai', texto1.indexOf('Provas de novembro. Uma matéria por dia.') >= 0, true);
  conf('sem a pergunta do aluno (veio da ficha)', await pag.evaluate(() => !document.querySelector('#plan-quem')), true);
  conf('os incertos ficam acima da prévia, fora da folha', await pag.evaluate(() => {
    const i = document.querySelector('#plan-incertos'), v = document.querySelector('#plan-previa');
    return !!i && !!v && (i.compareDocumentPosition(v) & Node.DOCUMENT_POSITION_FOLLOWING) > 0 && /História: confira no aviso/.test(i.textContent) && /cortado/.test(i.textContent);
  }), true);

  // o ajuste: a conversa continua, com o content do assistente intacto
  const plano2 = planoFalso('al1');
  plano2.grade.find(g => g.data === '2026-11-21').estudo = ['Geografia (1h)'];
  const resp1 = falso.corpo;
  falso.atraso = 0; falso.corpo = respostaFalsa(plano2);
  await pag.type('#plan-ajuste', 'põe Geografia no dia 21');
  await clicar(pag, '#plan-ajustar');
  await esperar('o segundo pedido saiu e a prévia voltou', () => pag.evaluate(() => !!document.querySelector('#plan-previa canvas.plan-previa-folha')).then(v => v && falso.pedidos.length === 2), v => v === true, 30000);
  const p2 = falso.pedidos[1].corpo;
  conf('o ajuste leva a conversa inteira: usuário, assistente, usuário', p2.messages.map(m => m.role), ['user', 'assistant', 'user']);
  conf('o content do assistente vai byte a byte como voltou (com o thinking)', JSON.stringify(p2.messages[1].content), JSON.stringify(resp1.resposta.content));
  conf('o primeiro turno vai igual (com o print)', JSON.stringify(p2.messages[0]), JSON.stringify(p1.messages[0]));
  conf('o turno novo é o ajuste dela', p2.messages[2].content[0].text.indexOf('põe Geografia no dia 21') >= 0, true);
  conf('o system é o mesmo (o cache pega)', p2.system === p1.system, true);

  // salvar na ficha
  await clicar(pag, '#plan-salvar');
  await esperar('salvo', () => pag.evaluate(() => { const b = document.querySelector('#plan-salvar'); return b && b.textContent; }), v => v === 'Salvo na ficha', 10000);
  const salvo = await pag.evaluate(() => Store.carregar().then(d => {
    const k = Object.keys(d.ajustes).filter(x => x.indexOf('planejamento:') === 0);
    return { chaves: k.length, reg: k.length ? d.ajustes[k[0]] : null };
  }));
  conf('o plano entrou em ajustes["planejamento:<id>"], do aluno al1', [salvo.chaves, salvo.reg && salvo.reg.alunoId, salvo.reg && salvo.reg.id && ('planejamento:' + salvo.reg.id)], [1, 'al1', salvo.reg && ('planejamento:' + salvo.reg.id)]);
  conf('com a versão ajustada (Geografia no dia 21)', JSON.stringify(salvo.reg.plano.grade.find(g => g.data === '2026-11-21').estudo), JSON.stringify(['Geografia (1h)']));
  const regTexto = JSON.stringify(salvo.reg);
  conf('os prints NÃO são guardados (nem o base64, nem a conversa)', [regTexto.indexOf(img.source.data.slice(0, 40)) < 0, regTexto.indexOf('/9j/') < 0, regTexto.indexOf('assinatura-sintetica') < 0, regTexto.length < 20000], [true, true, true, true]);

  // compartilhar: o arquivo que sai
  await pag.evaluate(() => {
    window.__compartilhado = null;
    navigator.canShare = () => true;
    navigator.share = d => { const f = d.files[0]; return f.arrayBuffer().then(b => { let s = ''; const u = new Uint8Array(b); for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
      window.__compartilhado = { nome: f.name, tipo: f.type, base64: btoa(s) }; }); };
  });
  await pag.evaluate(() => { const p = document.querySelector('#plan-compartilhar'); p.disabled = false; });
  // o rótulo do botão foi escolhido ao desenhar; com o share trocado, o toque compartilha
  await clicar(pag, '#plan-compartilhar');
  await esperar('o PDF foi compartilhado', () => pag.evaluate(() => window.__compartilhado && window.__compartilhado.nome), v => !!v, 10000);
  const arq = await pag.evaluate(() => window.__compartilhado);
  conf('o nome do arquivo', [arq.nome, arq.tipo], ['Planejamento de Estudos Zélia - Provas de Novembro.pdf', 'application/pdf']);
  const t = textoDoPdf(arq.base64);
  conf('"Aula com a Nath" só nas 4 aulas da agenda de Zélia no período (sem a cancelada, sem a do Bruno)', t.filter(x => x === 'Aula com a Nath').length, 4);
  conf('com o horário colado "às 15h30"', t.filter(x => x === 'às 15h30').length, 4);
  conf('o feriado nacional de 20/11 aparece', t.indexOf('feriado') >= 0, true);
  conf('"Aluna: Zélia" e "Prova Cambridge"', [t.indexOf('Aluna: Zélia') >= 0, t.join(' ').indexOf('Prova Cambridge') >= 0], [true, true]);
  conf('a prova sem conteúdo diz que a escola não enviou', t.indexOf('Conteúdo ainda não enviado pela escola.') >= 0, true);

  // de volta à ficha: o plano salvo está na lista e abre de novo
  await pag.evaluate(() => document.querySelector('#modal-planejamento .fechar').click());
  await esperar('a janela do planejamento fechou', () => aberta(pag, 'modal-planejamento'), v => v === false, 10000);
  conf('a ficha lista o plano salvo', await pag.evaluate(() => Array.from(document.querySelectorAll('#plan-secao .plan-item-nome')).map(e => e.textContent)), ['Provas de novembro, de 16/11 a 27/11']);
  await clicar(pag, '#plan-secao .plan-item');
  await esperar('o salvo abre direto na prévia', () => pag.evaluate(() => !!document.querySelector('#plan-previa canvas.plan-previa-folha')), v => v === true, 30000);
  conf('e já diz "Salvo na ficha"', await pag.evaluate(() => document.querySelector('#plan-salvar').textContent), 'Salvo na ficha');
  conf('nenhum pedido novo para abrir o salvo', falso.pedidos.length, 2);

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
        // SALVAR_PRINTS=<pasta>: o print da janela, só com aluno sintético
        if (process.env.SALVAR_PRINTS && largura === 390) {
          await pag.screenshot({ path: require('path').join(process.env.SALVAR_PRINTS, 'planejamento_' + (estado === 'a prévia' ? 'previa' : 'pedido') + '_390_' + letra.replace('%', '') + '.png') });
        }
      }
    }
    await pag.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await pag.setViewport({ width: 1280, height: 1000, hasTouch: true });
    await pausa(300);
  };
  await medir('a prévia');
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
  await pag.evaluate(() => document.querySelector('#modal-planejamento .fechar').click());
  await clicar(pag, '#plan-novo');
  await esperar('o pedido abriu', () => pag.evaluate(() => !!document.querySelector('#plan-texto')), v => v === true, 10000);
  await medir('o pedido');

  // ================================================================
  secao('3. Cancelar no meio do "montando" volta ao pedido sem perder o texto');
  await pag.type('#plan-texto', 'texto que não pode sumir');
  falso.atraso = 2500; falso.corpo = respostaFalsa(planoFalso('al1'));
  const antesCancelar = falso.pedidos.length;
  await clicar(pag, '#plan-montar');
  await clicar(pag, '#plan-cancelar');
  await pausa(3200);
  conf('voltou ao pedido, sem prévia, com o texto', await pag.evaluate(() => [!!document.querySelector('#plan-texto'), !document.querySelector('#plan-previa'),
    document.querySelector('#plan-texto') && document.querySelector('#plan-texto').value, !document.querySelector('#plan-erro')]), [true, true, 'texto que não pode sumir', true]);
  conf('(o pedido tinha saído)', falso.pedidos.length, antesCancelar + 1);

  // ================================================================
  secao('5. O erro sem_permissao e o sem internet');
  falso.atraso = 0; falso.status = 403; falso.corpo = { ok: false, codigo: 'sem_permissao' };
  await clicar(pag, '#plan-montar');
  await esperar('a frase do erro', () => pag.evaluate(() => { const e = document.querySelector('#plan-erro'); return e && e.textContent; }), v => !!v, 15000);
  conf('sem_permissao vira a frase dela, e o texto continua', await pag.evaluate(() => [document.querySelector('#plan-erro').textContent, document.querySelector('#plan-texto').value]),
    ['Esta conta ainda não tem a IA liberada.', 'texto que não pode sumir']);
  const antesOffline = falso.pedidos.length;
  await pag.setOfflineMode(true);
  await clicar(pag, '#plan-montar');
  await esperar('a frase do sem internet', () => pag.evaluate(() => { const e = document.querySelector('#plan-erro'); return e && e.textContent; }), v => v === 'Precisa de internet para montar o planejamento.', 15000);
  conf('sem internet: nenhum pedido saiu', falso.pedidos.length, antesOffline);
  await pag.setOfflineMode(false);
  await pag.evaluate(() => document.querySelector('#modal-planejamento .fechar').click());
  await pausa(300);
  await pag.evaluate(() => document.querySelector('#modal-aluno .fechar').click());
  await esperar('a ficha fechou', () => aberta(pag, 'modal-aluno'), v => v === false, 10000);

  // ================================================================
  secao('4. O atalho do "+": sem aluno, com a pergunta e a troca em um toque');
  falso.status = 200; falso.atraso = 0; falso.corpo = respostaFalsa(planoFalso('al2', 'Aluno', 'baixa'));
  await clicar(pag, '#nav-marcar-aula');
  await esperar('a janela da aula nova abriu', () => aberta(pag, 'modal-aula'), v => v === true, 10000);
  conf('o "+" continua abrindo a aula nova, com o atalho do planejamento no alto', await pag.evaluate(() => [document.querySelector('#titulo-modal-aula').textContent, !!document.querySelector('#aula-planejamento')]), ['Nova aula', true]);
  await clicar(pag, '#aula-planejamento');
  await esperar('a janela do planejamento abriu pelo atalho', () => aberta(pag, 'modal-planejamento'), v => v === true, 10000);
  conf('sem aluno escolhido', await pag.evaluate(() => [!document.querySelector('#plan-para'), !document.querySelector('#modal-aula').classList.contains('aberto')]), [true, true]);
  await pag.type('#plan-texto', 'provas do aluno de segunda');
  await clicar(pag, '#plan-montar');
  await esperar('a prévia do atalho', () => pag.evaluate(() => !!document.querySelector('#plan-quem')), v => v === true, 30000);
  const pa = falso.pedidos[falso.pedidos.length - 1].corpo;
  conf('o pedido do atalho NÃO diz aluno escolhido, e leva a lista', [pa.messages[0].content[0].text.indexOf('já está escolhido') < 0,
    pa.messages[0].content[0].text.indexOf('- id al1: Zélia (aulas fixas: segunda e quarta às 15h30)') >= 0], [true, true]);
  conf('a pergunta "É o Bruno?", marcada como dúvida', await pag.evaluate(() => [document.querySelector('#plan-pergunta').textContent,
    document.querySelector('#plan-quem').classList.contains('plan-quem-duvida')]), ['É o Bruno?', true]);
  await clicar(pag, '#plan-alunos [data-aluno="al1"]');
  await clicar(pag, '#plan-tratamento [data-tratamento="Aluna"]');
  conf('um toque troca o aluno, outro troca "Aluno" por "Aluna"', await pag.evaluate(() => [document.querySelector('#plan-pergunta').textContent,
    document.querySelector('#plan-alunos [data-aluno="al1"]').getAttribute('aria-pressed')]), ['É a Zélia?', 'true']);
  await esperar('a prévia redesenhou para Zélia', () => pag.evaluate(() => !!document.querySelector('#plan-previa canvas.plan-previa-folha')), v => v === true, 30000);
  await pag.evaluate(() => document.querySelector('#modal-planejamento .fechar').click());
  await esperar('fechou', () => aberta(pag, 'modal-planejamento'), v => v === false, 10000);

  // ================================================================
  secao('6. O observador (cópia de outra conta) não vê o botão nem o atalho');
  await pag.evaluate(() => {
    window.__estadoDeVerdade = Nuvem.estado;
    Nuvem.estado = function () { return Object.assign({}, window.__estadoDeVerdade(), { uidDona: 'conta-da-dona', entrada: { uid: 'conta-do-observador', email: 'obs@exemplo' } }); };
  });
  await H.irParaAba(pag, 'agenda');
  await H.irParaAba(pag, 'alunos');
  await clicar(pag, '#lista-alunos .item-lista[data-aluno="al1"]');
  await esperar('a ficha abriu', () => aberta(pag, 'modal-aluno'), v => v === true, 10000);
  conf('observador: a ficha sem a seção Planejamentos', await pag.evaluate(() => !document.querySelector('#plan-secao')), true);
  await pag.evaluate(() => document.querySelector('#modal-aluno .fechar').click());
  await esperar('a ficha fechou', () => aberta(pag, 'modal-aluno'), v => v === false, 10000);
  await clicar(pag, '#nav-marcar-aula');
  await esperar('a janela da aula nova abriu', () => aberta(pag, 'modal-aula'), v => v === true, 10000);
  conf('observador: a aula nova sem o atalho do planejamento', await pag.evaluate(() => !document.querySelector('#aula-planejamento')), true);
  await pag.evaluate(() => { Nuvem.estado = window.__estadoDeVerdade; });

  conf('nenhum erro de página', pag.errosDePagina, []);
})().then(() => H.fim(amb)(), H.fim(amb));
