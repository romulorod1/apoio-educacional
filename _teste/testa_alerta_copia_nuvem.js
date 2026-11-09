/* testa_alerta_copia_nuvem.js
 *
 * Item 7: o lembrete da cópia de segurança, no alto da agenda, considera a
 * nuvem. Antes ele olhava só o arquivo exportado e, com a nuvem ligada, dava
 * alarme falso ("sua última cópia tem N dias" com tudo salvo na nuvem).
 *
 * Sem emulador e sem conta nenhuma: o estado da nuvem é SIMULADO na página.
 * Antes de qualquer script, a página ganha um Nuvem embrulhado: o estado() de
 * verdade com os campos do caso por cima (a conta, a cópia completa, a fila),
 * e as funções que falariam com a nuvem trocadas por respostas locais, que só
 * contam as chamadas. O endereço do Firebase aponta para uma porta morta
 * (NUVEM_EMULADOR), e a prova confere que nenhum pedido saiu para fora do
 * 127.0.0.1. Alunos e aulas de teste.
 *
 * O relógio da página começa em 16/11/2026 11:00 (relogioDaRodada) e anda; a
 * prova não depende do dia em que roda.
 *
 * O que prova:
 *   1. nuvem ligada, fila vazia, envio confirmado há 2 h (09:00) e cópia
 *      local de 50 dias: nenhum alerta, e a linha "Na nuvem, salvo às 09:00.";
 *   2. fila parada (3 mudanças, com erro) desde 14/11 11:00, há 2 dias, e a
 *      cópia local velha: o alerta fala da nuvem ("3 mudanças não subiram
 *      para a nuvem desde 14/11."), com "Tentar de novo", e não pede cópia;
 *      o toque tenta subir (uma chamada ao envio da fila);
 *   3. quarentena parada há 2 dias: o alerta da nuvem com "Ver o que houve",
 *      que abre o cartão da nuvem em Ajustes;
 *   4. fila parada há só 3 h: nenhum alerta (o envio está a caminho);
 *   5. nuvem desligada (sem conta): o alerta antigo, igual, com "Salvar cópia
 *      agora";
 *   6. celular e observador: nenhum lembrete;
 *   7. não grava nada: a data da cópia local continua a mesma, e nenhuma
 *      cópia completa foi pedida;
 *   8. a tela: botão de 48 px e nada transborda a 360, 390 e 412 px, com a
 *      letra a 130%; sem caixa alta, sem travessão.
 *
 * Veneno, que TEM de reprovar:
 *   --envenenado-alerta-so-local   o lembrete volta ao jeito de antes, só pela
 *                                  cópia local (o app.js servido ignora a nuvem).
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

const MODOS = ['--envenenado-alerta-so-local'];
const [V_SO_LOCAL] = MODOS;
const MODO = MODOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && MODOS.indexOf(a) < 0);
const PRINTS = (() => { const i = process.argv.indexOf('--prints'); return i >= 0 ? process.argv[i + 1] : ''; })();
function prop(rotulo, ok, venenos) {
  venenos = [].concat(venenos || []);
  if (MODO && venenos.indexOf(MODO) >= 0) return conf('VENENO visto: ' + rotulo + ', e quebrou', ok, false);
  return conf(rotulo, ok, true);
}

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const ANCORA = 'var nuvem = situacaoDaNuvemParaOLembrete();';

secao('0. A âncora do veneno e o ambiente');
conf('nenhum --envenenado- desconhecido foi pedido (' + (desconhecidos.join(' ') || 'nenhum') + ')', desconhecidos.length, 0);
conf('a lista de venenos não está vazia', MODOS.length > 0, true);
conf('a âncora do veneno aparece uma vez só no app.js', APP.split(ANCORA).length - 1, 1);
const trocas = {};
if (MODO === V_SO_LOCAL) trocas['/app.js'] = APP.replace(ANCORA, 'var nuvem = null;');

const relogio = H.relogioDaRodada('2026-11-16', '11:00');
const amb = H.criarAmbiente(8786, 'nath_alerta_nuvem', trocas);

/* O Nuvem simulado, antes de qualquer script da página. O caso vem do
 * localStorage (__nuvemFalsa), gravado pela prova antes de cada recarga. */
function nuvemSimulada() {
  window.NUVEM_EMULADOR = { auth: 'http://127.0.0.1:9', firestore: 'http://127.0.0.1:9', projectId: 'demo-alerta-nuvem' };
  let caso = null;
  try { caso = JSON.parse(localStorage.getItem('__nuvemFalsa') || 'null'); } catch (e) { caso = null; }
  window.__chamadasNuvem = { enviarRegistros: 0, enviarCopia: 0 };
  if (!caso) return;
  if (caso.telaLarga) {
    Object.defineProperty(window.screen, 'width', { get: () => 1280 });
    Object.defineProperty(window.screen, 'height', { get: () => 800 });
  }
  let embrulhado;
  Object.defineProperty(window, 'Nuvem', {
    configurable: true,
    get() { return embrulhado; },
    set(v) {
      const estadoReal = v.estado;
      const nada = () => Promise.resolve({ pulado: 'simulado', enviados: 0 });
      embrulhado = Object.assign({}, v, {
        disponivel: () => true,
        pronto: () => Promise.resolve(),
        estado: () => Object.assign(estadoReal(), caso.estado || {}),
        celularDaDona: () => !!(caso.estado && caso.estado.celularDaDona),
        enviarCopia: () => { window.__chamadasNuvem.enviarCopia++; return Promise.resolve({ pulada: true }); },
        enviarRegistros: () => { window.__chamadasNuvem.enviarRegistros++; return Promise.resolve({ enviados: 0, erro: { codigo: 'SEM_REDE' } }); },
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
const CASOS = {
  emDia: { telaLarga: true, estado: { entrada: DONA, ultimaCopia: { id: 'c1', quando: iso(relogio.dia(-5), '20:00') },
    registros: { pendentes: 0, quarentena: 0, ultimoEnvio: { quando: iso(HOJE, '09:00'), enviados: 2 }, erro: null } } },
  parada: { telaLarga: true, estado: { entrada: DONA, ultimaCopia: { id: 'c1', quando: iso(relogio.dia(-5), '20:00') },
    registros: { pendentes: 3, quarentena: 0, ultimoEnvio: { quando: iso(relogio.dia(-2), '11:00'), enviados: 1 },
      erro: { codigo: 'ERRO', quando: iso(HOJE, '10:30'), mensagem: '' } } } },
  quarentena: { telaLarga: true, estado: { entrada: DONA, ultimaCopia: { id: 'c1', quando: iso(relogio.dia(-5), '20:00') },
    registros: { pendentes: 0, quarentena: 1, ultimoEnvio: { quando: iso(relogio.dia(-2), '11:00'), enviados: 1 }, erro: null } } },
  recente: { telaLarga: true, estado: { entrada: DONA, ultimaCopia: { id: 'c1', quando: iso(relogio.dia(-5), '20:00') },
    registros: { pendentes: 2, quarentena: 0, ultimoEnvio: { quando: iso(HOJE, '08:00'), enviados: 1 },
      erro: { codigo: 'SEM_REDE', quando: iso(HOJE, '10:50'), mensagem: '' } } } },
  desligada: null,
  celular: { estado: { entrada: DONA, celular: true, celularDaDona: true, uidDona: DONA.uid, ultimaCopia: { id: 'c1', quando: iso(relogio.dia(-5), '20:00') },
    registros: { pendentes: 4, quarentena: 0, ultimoEnvio: { quando: iso(relogio.dia(-3), '11:00'), enviados: 1 }, erro: { codigo: 'ERRO', quando: iso(HOJE, '10:00') } } } },
  observador: { estado: { entrada: { email: 'observador@exemplo.test', uid: 'uid-de-teste-observador' }, celular: true, observador: true,
    uidDona: DONA.uid, ultimaCopia: { id: 'c1', quando: iso(relogio.dia(-5), '20:00') },
    registros: { pendentes: 0, quarentena: 0, ultimoEnvio: null, erro: null } } }
};

const lerLembrete = pag => pag.evaluate(() => {
  const c = document.querySelector('#lembrete-copia');
  const b = c && c.querySelector('button');
  return { texto: c ? c.innerText.trim() : null, botao: b ? b.innerText.trim() : '',
    alerta: !!(c && c.querySelector('.faixa-aviso')), linha: !!document.querySelector('#lembrete-nuvem-em-dia'),
    celular: document.body.classList.contains('modo-celular') };
});

async function abrirCaso(pag, nome) {
  await pag.evaluate(c => { localStorage.setItem('__nuvemFalsa', JSON.stringify(c)); }, CASOS[nome]);
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'agenda');
  await pausa(300);
  return lerLembrete(pag);
}

/* A tela: nada transborda a lembrete nem a página, e o botão tem 48 px,
 * com as letras do app a 130% (como a letra grande do sistema). */
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
    const b = c && c.querySelector('button');
    const r = {
      pagina: raiz.scrollWidth <= window.innerWidth + 1,
      caixa: !!c && c.scrollWidth <= c.clientWidth + 1,
      botaoAltura: b ? b.getBoundingClientRect().height : 0,
      botaoCabe: b ? b.scrollWidth <= b.clientWidth + 1 && b.getBoundingClientRect().right <= c.getBoundingClientRect().right + 1 : false
    };
    for (let i = 1; i <= 8; i++) raiz.style.removeProperty('--letra-' + i);
    return r;
  });
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

  secao('1. Nuvem confirmada há 2 h: sem alerta, e a linha "Na nuvem, salvo às"');
  const emDia = await abrirCaso(pag, 'emDia');
  console.log('   lembrete: ' + JSON.stringify(emDia.texto));
  prop('nenhum alerta com a nuvem em dia', !emDia.alerta, V_SO_LOCAL);
  prop('a linha diz "Na nuvem, salvo às 09:00."', emDia.texto === 'Na nuvem, salvo às 09:00.' && emDia.linha, V_SO_LOCAL);
  if (PRINTS && !MODO) {
    fs.mkdirSync(PRINTS, { recursive: true });
    await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
    await pausa(200);
    await pag.screenshot({ path: path.join(PRINTS, 'linha_na_nuvem_salvo_as_1280.png') });
  }

  secao('2. Fila parada há 2 dias, cópia local velha: o alerta da nuvem');
  const parada = await abrirCaso(pag, 'parada');
  console.log('   lembrete: ' + JSON.stringify(parada.texto));
  prop('o alerta fala da nuvem: "3 mudanças não subiram para a nuvem desde 14/11."',
    parada.alerta && /^3 mudanças não subiram para a nuvem desde 14\/11\./.test(parada.texto || ''), V_SO_LOCAL);
  prop('não pede para fazer uma cópia', !/cópia/i.test(parada.texto || ''), V_SO_LOCAL);
  prop('a ação é "Tentar de novo"', parada.botao === 'Tentar de novo', V_SO_LOCAL);
  if (PRINTS && !MODO) {
    await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
    await pausa(200);
    await pag.screenshot({ path: path.join(PRINTS, 'alerta_da_nuvem_1280.png') });
  }
  if (!MODO) {
    for (const largura of [360, 390, 412]) {
      const m = await medirTela(pag, largura);
      conf(largura + ' px, letra a 130%: nada transborda (página, alerta, botão)', m.pagina && m.caixa && m.botaoCabe, true);
      conf(largura + ' px: o botão tem pelo menos 48 px de altura (' + Math.round(m.botaoAltura) + ')', m.botaoAltura >= 48, true);
    }
    await pag.setViewport({ width: 1280, height: 1000, hasTouch: true });
    conf('sem caixa alta nem travessão no alerta', await pag.evaluate(() => {
      const c = document.querySelector('#lembrete-copia');
      const t = c.innerText;
      return !/[–—]/.test(t) && Array.from(c.querySelectorAll('*')).every(e => getComputedStyle(e).textTransform !== 'uppercase');
    }), true);
    await pag.click('#lembrete-nuvem-acao');
    const tentou = await esperar('o toque tenta subir a fila', () => pag.evaluate(() => window.__chamadasNuvem.enviarRegistros), v => v === 1, 5000);
    conf('"Tentar de novo" pede um envio da fila', tentou.ok, true);
  }

  secao('3. Quarentena parada há 2 dias: o alerta da nuvem com "Ver o que houve"');
  const quar = await abrirCaso(pag, 'quarentena');
  console.log('   lembrete: ' + JSON.stringify(quar.texto));
  prop('o alerta diz "1 mudança não subiu para a nuvem desde 14/11."',
    quar.alerta && /^1 mudança não subiu para a nuvem desde 14\/11\./.test(quar.texto || ''), V_SO_LOCAL);
  prop('a ação é "Ver o que houve"', quar.botao === 'Ver o que houve', V_SO_LOCAL);
  if (!MODO) {
    await pag.click('#lembrete-nuvem-acao');
    await pausa(300);
    conf('"Ver o que houve" abre Ajustes, com os aparelhos na nuvem abertos', await pag.evaluate(() =>
      document.querySelector('#tela-ajustes').classList.contains('ativa') && !!document.querySelector('#nuvem-aparelhos-detalhes[open]')), true);
  }

  secao('4. Fila parada há só 3 h: nada ainda');
  const recente = await abrirCaso(pag, 'recente');
  prop('nenhum alerta enquanto o envio está a caminho', !recente.alerta && !recente.linha, V_SO_LOCAL);

  secao('5. Nuvem desligada: o alerta antigo, igual');
  const deslig = await abrirCaso(pag, 'desligada');
  console.log('   lembrete: ' + JSON.stringify(deslig.texto));
  conf('o alerta antigo, pela cópia local de 50 dias', deslig.alerta &&
    /^Sua última cópia de segurança tem 50 dias\. Tudo fica só neste tablet\. Salve uma cópia e guarde no Drive\./.test(deslig.texto || ''), true);
  conf('com "Salvar cópia agora"', deslig.botao, 'Salvar cópia agora');

  secao('6. Celular e observador: nada');
  const cel = await abrirCaso(pag, 'celular');
  conf('o celular está no modo celular', cel.celular, true);
  conf('o celular não recebe o lembrete', !cel.texto, true);
  const obs = await abrirCaso(pag, 'observador');
  conf('o observador está no modo celular', obs.celular, true);
  conf('o observador não recebe o lembrete', !obs.texto, true);

  secao('7. Não grava nada');
  conf('nenhuma cópia completa foi pedida à nuvem', await pag.evaluate(() => window.__chamadasNuvem.enviarCopia), 0);
  await pag.evaluate(() => localStorage.removeItem('__nuvemFalsa'));
  await H.abrirApp(pag, amb.ORIGEM);
  conf('a data da cópia local continua a mesma', await pag.evaluate(async () => (await Store.carregar()).ajustes.ultimaCopia), COPIA_LOCAL);
  conf('nenhum pedido saiu para fora do 127.0.0.1 (' + (fora.slice(0, 3).join(' ') || 'nenhum') + ')', fora.length, 0);
  conf('nenhum erro de página', pag.errosDePagina.join(' | '), '');
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
