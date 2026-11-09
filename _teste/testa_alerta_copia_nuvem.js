/* testa_alerta_copia_nuvem.js
 *
 * Item 7: o lembrete da cópia de segurança, no alto da agenda, considera a
 * nuvem. Antes ele olhava só o arquivo exportado e, com a nuvem ligada, dava
 * alarme falso ("sua última cópia tem N dias" com tudo salvo na nuvem).
 *
 * Sem emulador e sem conta nenhuma: o estado da nuvem e a fila são SIMULADOS
 * na página. Antes de qualquer script, a página ganha um Nuvem embrulhado (o
 * estado() de verdade com os campos do caso por cima; as funções que falariam
 * com a nuvem trocadas por respostas locais, que só contam as chamadas) e um
 * Store embrulhado só na leitura da fila (lerFila e estadoDaFila devolvem a
 * fila do caso). O endereço do Firebase aponta para uma porta morta
 * (NUVEM_EMULADOR), e a prova confere que nenhum pedido saiu para fora do
 * 127.0.0.1. Alunos e aulas de teste.
 *
 * O relógio da página começa em 16/11/2026 11:00 (relogioDaRodada) e anda; a
 * prova não depende do dia em que roda.
 *
 * O que prova:
 *   1. fila vazia, envio confirmado há 2 h (09:00), cópia local de 50 dias:
 *      nenhum alerta, e a linha "Na nuvem, salvo às 09:00.";
 *   2. fila parada desde 14/11 (2 dias), com erro: "3 mudanças não subiram
 *      para a nuvem desde 14/11.", com "Tentar de novo" (o botão fica
 *      desabilitado enquanto tenta, e o aviso só diz "enviadas" com a fila
 *      vazia), e nunca "faça uma cópia";
 *   3. QUARENTENA com o último envio RECENTE (2 h) e a entrada parada desde
 *      14/11: alerta, com "Ver o que houve", que abre a nuvem em Ajustes (a
 *      idade é a do que está parado, e não a do último envio);
 *   4. a fila parada há 3 h e há 23 h 59 min: nada; há 24 h 01 min: alerta;
 *   5. data adiantada (o relógio de outro lugar) e data inválida não contam;
 *   6. nuvem desligada (sem conta) e sincronização desligada com a conta
 *      ligada: o alerta antigo, igual;
 *   7. erro com a fila vazia: sem alerta, com a linha;
 *   8. a partida: antes de a nuvem responder e antes de a fila ser lida,
 *      nada (nem o alerta antigo); com a leitura da fila recusada, nada;
 *   9. celular e observador: nada;
 *  10. não grava nada, e nenhuma cópia completa é pedida;
 *  11. a tela: botão de 48 px e nada transborda a 360, 390 e 412 px, com a
 *      letra a 130%, no alerta com "Tentar de novo", no "Ver o que houve" e
 *      na linha "Na nuvem, salvo às"; sem caixa alta, sem travessão.
 *
 * Venenos, que TÊM de reprovar:
 *   --envenenado-alerta-so-local   o lembrete volta ao jeito de antes, só pela
 *                                  cópia local (o app.js servido ignora a nuvem);
 *   --envenenado-idade-do-envio    a idade volta a ser medida pelo último envio
 *                                  confirmado, e a quarentena fica calada.
 *
 *   --prints <pasta>   o alerta da nuvem e a linha "Na nuvem, salvo às", em 1280 x 800.
 *
 * Porta: 8786 (app). Nunca a 8777 do portão.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const MODOS = ['--envenenado-alerta-so-local', '--envenenado-idade-do-envio'];
const [V_SO_LOCAL, V_IDADE] = MODOS;
const MODO = MODOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && MODOS.indexOf(a) < 0);
const PRINTS = (() => { const i = process.argv.indexOf('--prints'); return i >= 0 ? process.argv[i + 1] : ''; })();
function prop(rotulo, ok, venenos) {
  venenos = [].concat(venenos || []);
  if (MODO && venenos.indexOf(MODO) >= 0) return conf('VENENO visto: ' + rotulo + ', e quebrou', ok, false);
  return conf(rotulo, ok, true);
}

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const ANCORA_LOCAL = 'var nuvem = situacaoDaNuvemParaOLembrete();';
const ANCORA_IDADE_1 = 'var inicioPendente = f.pendentes ? (f.pendenteMaisAntiga || confirmado) : null;';
const ANCORA_IDADE_2 = 'var quarentenaAlerta = f.quarentena > 0;';
const vezes = (txt, a) => txt.split(a).length - 1;

secao('0. As âncoras dos venenos e o ambiente');
conf('nenhum --envenenado- desconhecido foi pedido (' + (desconhecidos.join(' ') || 'nenhum') + ')', desconhecidos.length, 0);
conf('a lista de venenos não está vazia', MODOS.length > 0, true);
conf('as âncoras dos venenos aparecem uma vez só no app.js',
  [ANCORA_LOCAL, ANCORA_IDADE_1, ANCORA_IDADE_2].map(a => vezes(APP, a)).join(','), '1,1,1');
const trocas = {};
if (MODO === V_SO_LOCAL) trocas['/app.js'] = APP.replace(ANCORA_LOCAL, 'var nuvem = null;');
if (MODO === V_IDADE) {
  trocas['/app.js'] = APP
    .replace(ANCORA_IDADE_1, 'var inicioPendente = (f.pendentes || f.quarentena) ? confirmado : null;')
    .replace(ANCORA_IDADE_2, 'var quarentenaAlerta = f.quarentena > 0 && !!inicioPendente && Date.now() - inicioPendente.getTime() > limite;');
}

const relogio = H.relogioDaRodada('2026-11-16', '11:00');
const amb = H.criarAmbiente(8786, 'nath_alerta_nuvem', trocas);

/* O Nuvem e a leitura da fila simulados, antes de qualquer script da página.
 * O caso vem do localStorage (__nuvemFalsa), gravado antes de cada recarga. */
function nuvemSimulada() {
  window.NUVEM_EMULADOR = { auth: 'http://127.0.0.1:9', firestore: 'http://127.0.0.1:9', projectId: 'demo-alerta-nuvem' };
  let caso = null;
  try { caso = JSON.parse(localStorage.getItem('__nuvemFalsa') || 'null'); } catch (e) { caso = null; }
  window.__chamadasNuvem = { enviarRegistros: 0, enviarCopia: 0, lerFila: 0 };
  if (!caso) return;
  const atraso = ms => new Promise(r => setTimeout(r, ms));
  if (caso.telaLarga) {
    Object.defineProperty(window.screen, 'width', { get: () => 1280 });
    Object.defineProperty(window.screen, 'height', { get: () => 800 });
  }
  const fila = caso.fila || [];
  let store;
  Object.defineProperty(window, 'Store', {
    configurable: true,
    get() { return store; },
    set(v) {
      store = Object.assign({}, v, {
        lerFila: () => {
          window.__chamadasNuvem.lerFila++;
          if (caso.filaFalha) return Promise.reject(new Error('leitura recusada (simulada)'));
          return atraso(caso.filaAtrasoMs || 0).then(() => JSON.parse(JSON.stringify(fila)));
        },
        estadoDaFila: () => Promise.resolve({ pendentes: fila.filter(e => !e.quarentena).length, quarentena: fila.filter(e => e.quarentena).length })
      });
    }
  });
  let embrulhado, chamadasPronto = 0, prontoAtrasado = null;
  Object.defineProperty(window, 'Nuvem', {
    configurable: true,
    get() { return embrulhado; },
    set(v) {
      const estadoReal = v.estado;
      const nada = () => Promise.resolve({ pulado: 'simulado', enviados: 0 });
      embrulhado = Object.assign({}, v, {
        disponivel: () => true,
        // a primeira chamada (o modo celular, antes do banco) responde já; as da nuvem, depois do atraso do caso
        pronto: () => {
          chamadasPronto++;
          if (chamadasPronto === 1 || !caso.prontoAtrasoMs) return Promise.resolve();
          if (!prontoAtrasado) prontoAtrasado = atraso(caso.prontoAtrasoMs);
          return prontoAtrasado;
        },
        estado: () => Object.assign(estadoReal(), caso.estado || {}),
        celularDaDona: () => !!(caso.estado && caso.estado.celularDaDona),
        enviarCopia: () => { window.__chamadasNuvem.enviarCopia++; return Promise.resolve({ pulada: true }); },
        enviarRegistros: () => {
          window.__chamadasNuvem.enviarRegistros++;
          return atraso(1500).then(() => ({ enviados: 0 }));
        },
        enviarRegistrosSeDevido: nada, sincronizar: nada, sincronizarSeDevido: nada, receberRegistros: nada,
        listarCopias: () => Promise.resolve([]), listarDiagnosticos: () => Promise.resolve([]),
        gravarDiagnostico: () => Promise.resolve(), leitores: () => Promise.resolve([]),
        copiaAutomaticaDevida: () => false, copiaDiariaDevida: () => false,
        informar: () => {}, travarEnvio: () => {}
      });
    }
  });
}

const DONA = { email: 'dona@exemplo.test', uid: 'uid-de-teste-dona' };
const iso = (dia, hhmm) => { const p = dia.split('-').map(Number), h = hhmm.split(':').map(Number); return new Date(p[0], p[1] - 1, p[2], h[0], h[1]).toISOString(); };
const HOJE = relogio.dia(0);                 // 2026-11-16
const COPIA_LOCAL = relogio.dia(-50);        // a cópia exportada, velha
const COPIA_NUVEM = { id: 'c1', quando: iso(relogio.dia(-5), '20:00') };
const entrada = (id, quando, extra) => Object.assign({ id: 'aula:' + id, tipo: 'aula', atualizadoEm: quando }, extra || {});
const regs = (ultimoEnvio, erro) => ({ pendentes: 0, quarentena: 0, ultimoEnvio: ultimoEnvio ? { quando: ultimoEnvio, enviados: 1 } : null, erro: erro || null });
const ligada = (registros, extra) => Object.assign({ entrada: DONA, ultimaCopia: COPIA_NUVEM, registros }, extra || {});
const DOIS_DIAS = iso(relogio.dia(-2), '11:00');
const HA_2H = iso(HOJE, '09:00');
const CASOS = {
  emDia: { telaLarga: true, fila: [], estado: ligada(regs(HA_2H)) },
  parada: { telaLarga: true, fila: [entrada('a', DOIS_DIAS), entrada('b', iso(relogio.dia(-1), '15:00')), entrada('c', iso(HOJE, '10:00'))],
    estado: ligada(regs(DOIS_DIAS, { codigo: 'ERRO', quando: iso(HOJE, '10:30') })) },
  quarentena: { telaLarga: true, fila: [entrada('q', DOIS_DIAS, { quarentena: true, tentativas: 3 })], estado: ligada(regs(HA_2H)) },
  recente: { telaLarga: true, fila: [entrada('r1', iso(HOJE, '08:00')), entrada('r2', iso(HOJE, '08:30'))],
    estado: ligada(regs(iso(relogio.dia(-3), '11:00'), { codigo: 'SEM_REDE', quando: iso(HOJE, '10:50') })) },
  quase24: { telaLarga: true, fila: [entrada('x', null, { haMinutos: 23 * 60 + 59 })], estado: ligada(regs(HA_2H)) },
  passou24: { telaLarga: true, fila: [entrada('y', null, { haMinutos: 24 * 60 + 1 })], estado: ligada(regs(HA_2H)) },
  futuro: { telaLarga: true, fila: [], estado: ligada(regs(iso(relogio.dia(3), '11:00'))) },
  futuroNaFila: { telaLarga: true, fila: [entrada('f', iso(relogio.dia(2), '11:00'))], estado: ligada(regs(iso(relogio.dia(-3), '11:00'))) },
  invalida: { telaLarga: true, fila: [], estado: ligada(regs('não é data'), { ultimaCopia: { id: 'c2', quando: iso(HOJE, '09:30') } }) },
  desligada: null,
  sincDesligada: { telaLarga: true, fila: [entrada('s', DOIS_DIAS)], estado: ligada(regs(DOIS_DIAS), { sincronizacaoDesligada: true }) },
  erroFilaVazia: { telaLarga: true, fila: [], estado: ligada(regs(iso(relogio.dia(-3), '11:00'), { codigo: 'SEM_REDE', quando: iso(HOJE, '10:55') })) },
  partidaPronto: { telaLarga: true, prontoAtrasoMs: 7000, fila: [], estado: {} },
  partidaFila: { telaLarga: true, filaAtrasoMs: 7000, fila: [], estado: ligada(regs(HA_2H)) },
  filaFalha: { telaLarga: true, filaFalha: true, fila: [], estado: ligada(regs(HA_2H)) },
  celular: { fila: [entrada('c', DOIS_DIAS, { quarentena: true })], estado: ligada(regs(iso(relogio.dia(-3), '11:00')), { celular: true, celularDaDona: true, uidDona: DONA.uid }) },
  observador: { fila: [], estado: { entrada: { email: 'observador@exemplo.test', uid: 'uid-de-teste-observador' }, celular: true, observador: true,
    uidDona: DONA.uid, ultimaCopia: COPIA_NUVEM, registros: regs(null) } }
};

const lerLembrete = pag => pag.evaluate(() => {
  const c = document.querySelector('#lembrete-copia');
  const b = c && c.querySelector('button');
  return { texto: c ? c.innerText.trim() : null, botao: b ? b.innerText.trim() : '',
    alerta: !!(c && c.querySelector('.faixa-aviso')), linha: !!document.querySelector('#lembrete-nuvem-em-dia'),
    celular: document.body.classList.contains('modo-celular') };
});

async function abrirCaso(pag, nome, espera) {
  /* "há N minutos" sai do relógio da rodada na hora de abrir, que anda junto com o da página */
  const caso = CASOS[nome] && JSON.parse(JSON.stringify(CASOS[nome]));
  if (caso) caso.fila.forEach(e => { if (e.haMinutos) { e.atualizadoEm = new Date(Date.now() - e.haMinutos * 60000).toISOString(); delete e.haMinutos; } });
  await pag.evaluate(c => { localStorage.setItem('__nuvemFalsa', JSON.stringify(c)); }, caso);
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'agenda');
  await pausa(espera === undefined ? 400 : espera);
  const l = await lerLembrete(pag);
  console.log('   [' + nome + '] ' + JSON.stringify(l.texto));
  return l;
}

/* A tela: nada transborda o lembrete nem a página, e o botão (se houver) tem
 * 48 px, com as letras do app a 130% (como a letra grande do sistema). */
async function medirTela(pag, largura) {
  await pag.setViewport({ width: largura, height: 800, hasTouch: true });
  await pausa(250);
  return pag.evaluate(() => {
    const raiz = document.documentElement, cs = getComputedStyle(raiz);
    for (let i = 1; i <= 8; i++) {
      const v = parseFloat(cs.getPropertyValue('--letra-' + i));
      if (v) raiz.style.setProperty('--letra-' + i, (v * 1.3) + 'px');
    }
    const c = document.querySelector('#lembrete-copia');
    const filho = c && c.firstElementChild;
    const b = c && c.querySelector('button');
    const r = {
      pagina: raiz.scrollWidth <= window.innerWidth + 1,
      caixa: !!c && !!filho && c.scrollWidth <= c.clientWidth + 1 && filho.scrollWidth <= filho.clientWidth + 1,
      temBotao: !!b,
      botaoAltura: b ? b.getBoundingClientRect().height : 0,
      botaoCabe: b ? b.scrollWidth <= b.clientWidth + 1 && b.getBoundingClientRect().right <= c.getBoundingClientRect().right + 1 : true
    };
    for (let i = 1; i <= 8; i++) raiz.style.removeProperty('--letra-' + i);
    return r;
  });
}
async function conferirTela(pag, rotulo, comBotao) {
  for (const largura of [360, 390, 412]) {
    const m = await medirTela(pag, largura);
    conf(rotulo + ', ' + largura + ' px, letra a 130%: nada transborda', m.pagina && m.caixa && m.botaoCabe, true);
    if (comBotao) conf(rotulo + ', ' + largura + ' px: botão de pelo menos 48 px (' + Math.round(m.botaoAltura) + ')', m.temBotao && m.botaoAltura >= 48, true);
  }
  await pag.setViewport({ width: 1280, height: 1000, hasTouch: true });
  conf(rotulo + ': sem caixa alta nem travessão', await pag.evaluate(() => {
    const c = document.querySelector('#lembrete-copia');
    return !/[–—]/.test(c.innerText) && Array.from(c.querySelectorAll('*')).every(e => getComputedStyle(e).textTransform !== 'uppercase');
  }), true);
}
async function print(pag, nome) {
  if (!PRINTS || MODO) return;
  fs.mkdirSync(PRINTS, { recursive: true });
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  await pausa(200);
  await pag.screenshot({ path: path.join(PRINTS, nome) });
  await pag.setViewport({ width: 1280, height: 1000, hasTouch: true });
}

(async function () {
  await amb.subir();
  const pag = await amb.pagina();
  const fora = [];
  pag.on('request', q => { const u = q.url(); if (!/^https?:\/\/127\.0\.0\.1:8786\//.test(u) && !/^(data|blob):/.test(u)) fora.push(u); });
  await relogio.naPagina(pag);
  await pag.evaluateOnNewDocument(nuvemSimulada);
  await H.abrirApp(pag, amb.ORIGEM);
  await pag.evaluate(async (o) => {
    const d = await Store.carregar();
    d.alunos = [{ id: 'alfa_b7', nome: 'Aluno Alfa Teste', anoEscolar: '07', ativo: true, cor: '#2563EB',
      precos: [{ id: 'p_b7', inicio: '2026-01-01', fim: null, valorHora: 100 }] }];
    d.series = [];
    d.aulas = [{ id: 'aula_b7', alunoId: 'alfa_b7', serieId: null, destacada: false, data: o.HOJE, hora: '15:00', duracaoMin: 60,
      status: 'agendada', cobravel: true, notaTexto: '', notaPrivada: '', temNota: false, anexos: [], areas: [], temas: [] }];
    d.ajustes = d.ajustes || {};
    d.ajustes.ultimaCopia = o.COPIA_LOCAL;
    await Store.salvar(d);
  }, { HOJE, COPIA_LOCAL });
  conf('o relógio da página está em 16/11/2026', await pag.evaluate(() => Core.hojeIso()), HOJE);

  secao('1. Fila vazia, envio confirmado há 2 h: a linha "Na nuvem, salvo às"');
  const emDia = await abrirCaso(pag, 'emDia');
  prop('nenhum alerta com a nuvem em dia', !emDia.alerta, V_SO_LOCAL);
  prop('a linha diz "Na nuvem, salvo às 09:00."', emDia.texto === 'Na nuvem, salvo às 09:00.' && emDia.linha, V_SO_LOCAL);
  if (!MODO) await conferirTela(pag, 'a linha "Na nuvem, salvo às"', false);
  await print(pag, 'linha_na_nuvem_salvo_as_1280.png');

  secao('2. Fila parada desde 14/11: o alerta da nuvem, com "Tentar de novo"');
  const parada = await abrirCaso(pag, 'parada');
  prop('"3 mudanças não subiram para a nuvem desde 14/11."',
    parada.alerta && /^3 mudanças não subiram para a nuvem desde 14\/11\./.test(parada.texto || ''), V_SO_LOCAL);
  prop('não pede para fazer uma cópia', !/cópia/i.test(parada.texto || ''), V_SO_LOCAL);
  prop('a ação é "Tentar de novo"', parada.botao === 'Tentar de novo', V_SO_LOCAL);
  await print(pag, 'alerta_da_nuvem_1280.png');
  if (!MODO) {
    await conferirTela(pag, 'o alerta com "Tentar de novo"', true);
    await pag.click('#lembrete-nuvem-acao');
    await pausa(200);
    conf('durante o envio, o botão fica desabilitado', await pag.evaluate(() => document.querySelector('#lembrete-nuvem-acao').disabled), true);
    await pag.evaluate(() => { const b = document.querySelector('#lembrete-nuvem-acao'); b.disabled = false; b.click(); });
    const aviso = await esperar('o envio terminou', () => pag.evaluate(() => (document.querySelector('#aviso-texto') || {}).textContent || ''),
      t => /^Ainda não subiu|^Mudanças enviadas/.test(t), 8000);
    conf('com a fila ainda cheia, o aviso diz que não subiu (' + aviso.valor + ')', /^Ainda não subiu/.test(aviso.valor || ''), true);
    conf('o toque pede um envio da fila, e o segundo toque não pede outro', await pag.evaluate(() => window.__chamadasNuvem.enviarRegistros), 1);
    conf('depois do envio, o botão volta', await pag.evaluate(() => !document.querySelector('#lembrete-nuvem-acao').disabled), true);
  }

  secao('3. Quarentena com o último envio recente: alerta, com "Ver o que houve"');
  const quar = await abrirCaso(pag, 'quarentena');
  prop('"1 mudança não subiu para a nuvem desde 14/11.", com o envio de 2 h atrás',
    quar.alerta && /^1 mudança não subiu para a nuvem desde 14\/11\./.test(quar.texto || ''), [V_SO_LOCAL, V_IDADE]);
  prop('a ação é "Ver o que houve"', quar.botao === 'Ver o que houve', [V_SO_LOCAL, V_IDADE]);
  if (!MODO) {
    await conferirTela(pag, 'o alerta com "Ver o que houve"', true);
    await pag.click('#lembrete-nuvem-acao');
    await pausa(300);
    conf('"Ver o que houve" abre Ajustes, com os aparelhos na nuvem abertos', await pag.evaluate(() =>
      document.querySelector('#tela-ajustes').classList.contains('ativa') && !!document.querySelector('#nuvem-aparelhos-detalhes[open]')), true);
  }

  secao('4. A idade do que está parado: 3 h, 23 h 59 min e 24 h 01 min');
  const recente = await abrirCaso(pag, 'recente');
  prop('parada há 3 h: nada (o envio está a caminho)', !recente.alerta && !recente.linha, [V_SO_LOCAL, V_IDADE]);
  const quase = await abrirCaso(pag, 'quase24');
  prop('parada há 23 h 59 min: nada', !quase.alerta && !quase.linha, V_SO_LOCAL);
  const passou = await abrirCaso(pag, 'passou24');
  prop('parada há 24 h 01 min, com o envio de 2 h atrás: "1 mudança não subiu para a nuvem desde 15/11."',
    passou.alerta && /^1 mudança não subiu para a nuvem desde 15\/11\./.test(passou.texto || '') && passou.botao === 'Tentar de novo', [V_SO_LOCAL, V_IDADE]);

  secao('5. Data adiantada e data inválida não contam');
  const futuro = await abrirCaso(pag, 'futuro');
  prop('o envio "daqui a 3 dias" é ignorado: vale a cópia de 11/11, 20:00',
    futuro.texto === 'Na nuvem, salvo em 11/11, às 20:00.' && !futuro.alerta, V_SO_LOCAL);
  const futuroFila = await abrirCaso(pag, 'futuroNaFila');
  prop('a entrada "daqui a 2 dias" é ignorada: a referência é a última confirmação, de 13/11',
    futuroFila.alerta && /^1 mudança não subiu para a nuvem desde 13\/11\./.test(futuroFila.texto || ''), V_SO_LOCAL);
  const invalida = await abrirCaso(pag, 'invalida');
  prop('a data inválida é ignorada: vale a cópia das 09:30', invalida.texto === 'Na nuvem, salvo às 09:30.', V_SO_LOCAL);

  secao('6. Nuvem desligada: o alerta antigo, igual');
  const ALERTA_ANTIGO = /^Sua última cópia de segurança tem 50 dias\. Tudo fica só neste tablet\. Salve uma cópia e guarde no Drive\./;
  const deslig = await abrirCaso(pag, 'desligada');
  conf('sem conta: o alerta antigo, pela cópia local de 50 dias', deslig.alerta && ALERTA_ANTIGO.test(deslig.texto || ''), true);
  conf('com "Salvar cópia agora"', deslig.botao, 'Salvar cópia agora');
  const sinc = await abrirCaso(pag, 'sincDesligada');
  conf('sincronização desligada, com a conta ligada: o alerta antigo', sinc.alerta && ALERTA_ANTIGO.test(sinc.texto || ''), true);

  secao('7. Erro com a fila vazia: sem alerta');
  const erroVazia = await abrirCaso(pag, 'erroFilaVazia');
  prop('nada a perder, nada de alerta: "Na nuvem, salvo em 13/11, às 11:00."',
    !erroVazia.alerta && erroVazia.texto === 'Na nuvem, salvo em 13/11, às 11:00.', V_SO_LOCAL);

  secao('8. A partida: nada antes de a nuvem e a fila responderem');
  const antesPronto = await abrirCaso(pag, 'partidaPronto', 0);
  conf('antes de a nuvem responder, o lembrete está vazio (nem o alerta antigo)', antesPronto.texto, '');
  const depoisPronto = await esperar('a nuvem respondeu', () => lerLembrete(pag), v => !!v.texto, 12000);
  conf('depois, sem conta, o alerta antigo aparece', depoisPronto.ok && ALERTA_ANTIGO.test(depoisPronto.valor.texto), true);
  const antesFila = await abrirCaso(pag, 'partidaFila', 0);
  conf('antes de a fila ser lida, o lembrete está vazio (nem "salvo às", nem o alerta antigo)', antesFila.texto, '');
  const depoisFila = await esperar('a fila foi lida', () => lerLembrete(pag), v => !!v.texto, 12000);
  prop('depois da leitura, "Na nuvem, salvo às 09:00."', depoisFila.ok && depoisFila.valor.texto === 'Na nuvem, salvo às 09:00.', V_SO_LOCAL);
  const falha = await abrirCaso(pag, 'filaFalha', 1500);
  prop('com a leitura da fila recusada, nada (a fila foi pedida: ' + (await pag.evaluate(() => window.__chamadasNuvem.lerFila)) + ')',
    falha.texto === '' && await pag.evaluate(() => window.__chamadasNuvem.lerFila > 0), V_SO_LOCAL);

  secao('9. Celular e observador: nada');
  const cel = await abrirCaso(pag, 'celular');
  conf('o celular está no modo celular', cel.celular, true);
  conf('o celular não recebe o lembrete', !cel.texto, true);
  const obs = await abrirCaso(pag, 'observador');
  conf('o observador está no modo celular', obs.celular, true);
  conf('o observador não recebe o lembrete', !obs.texto, true);

  secao('10. Não grava nada');
  conf('nenhuma cópia completa foi pedida à nuvem', await pag.evaluate(() => window.__chamadasNuvem.enviarCopia), 0);
  await pag.evaluate(() => localStorage.removeItem('__nuvemFalsa'));
  await H.abrirApp(pag, amb.ORIGEM);
  conf('a data da cópia local continua a mesma', await pag.evaluate(async () => (await Store.carregar()).ajustes.ultimaCopia), COPIA_LOCAL);
  conf('nenhum pedido saiu para fora do 127.0.0.1 (' + (fora.slice(0, 3).join(' ') || 'nenhum') + ')', fora.length, 0);
  conf('nenhum erro de página', pag.errosDePagina.join(' | '), '');
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
