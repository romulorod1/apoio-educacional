/* _bib_navegador.js
 *
 * Arnês comum aos testes de navegador da biblioteca (testa_biblioteca_importar
 * e testa_biblioteca_navegar): placar, espera por condição, servidor próprio
 * numa porta só dele, perfil do Chrome novo a cada rodada e apagado no fim.
 *
 * O mesmo desenho do testa_painel_valores: porta conferida antes de subir e
 * servidor conferido depois (no Windows o listen sobe junto com outro processo
 * na mesma porta e as conexões vão para o antigo, sem erro), perfil no
 * temporário do sistema (sobra dentro do repositório acionaria a trava de
 * privacidade do portão), e a troca de UM arquivo servido para os modos
 * envenenados, sem cópia nenhuma em disco.
 *
 * O RELÓGIO FIXO É O PADRÃO. Toda página que uma prova abre por aqui
 * (amb.pagina() ou o nav.newPage() do amb.subir()) já nasce com o relógio da
 * rodada: segunda, 16/11/2026, às 11:00, andando no passo do relógio do sistema.
 * O Date do PROCESSO também é posto no mesmo dia, no criarAmbiente, para a
 * prova que monta datas com new Date() concordar com a página. Ninguém precisa
 * chamar nada: abrir o app já é abrir o app em 16/11/2026.
 *
 * POR QUÊ: é a bomba-relógio de 01/01/2027. A carga inicial do app grava
 * ultimoAnoLetivoAtualizado = 2026 e, num relógio de 2027 em diante, o app abre
 * SOZINHO o modal da virada anual (verificarViradaAnualAutomatica, 1,4 s depois
 * de abrir), por cima dos cliques da prova. Com o padrão, nenhuma prova de
 * navegador depende do dia em que o CI roda. Quem prova isto é o
 * testa_relogio_padrao (a virada NÃO abre com o padrão e ABRE com a saída).
 *
 * A SAÍDA TEM NOME: { relogioReal: true }, no criarAmbiente(porta, perfil,
 * trocas, { relogioReal: true }) para o ambiente inteiro, ou no
 * amb.pagina({ relogioReal: true }) para uma página só. Usa quem precisa do
 * relógio de verdade (por exemplo, quem prova que o app abre a virada sozinho).
 *
 * A ESCOLHA EXPLÍCITA SEMPRE VENCE O PADRÃO. A prova que chama
 * relogioDaRodada('2027-03-10', '09:00') e RELOGIO.naPagina(pag) fica no dia
 * dela, na ordem que for: o naPagina explícito troca o relógio padrão da
 * página (e só ele: uma escolha explícita anterior continua valendo) e o
 * relogioDaRodada explícito tira o padrão do processo e põe o dele, sempre em
 * cima do Date de verdade (window.__DateDoMundo na página, Date.__baseDaRodada
 * no processo), e nunca um relógio dentro do outro. fixarRelogio e afins, que
 * as provas põem por cima no meio da rodada, continuam empilhando como antes.
 * O padrão vale para quem abre pela página do helper: popup aberto pelo próprio
 * app (window.open) não herda, e a prova que lança o puppeteer por conta
 * própria (sem este arquivo) nem chega aqui.
 */
'use strict';
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const CHROME = (process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const RAIZ = path.join(__dirname, '..');
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  /* O leitor de PDF (C14) é módulo e WebAssembly: o navegador recusa módulo
   * servido como application/octet-stream, e o GitHub Pages manda os dois
   * com o tipo certo. */
  '.mjs': 'text/javascript; charset=utf-8', '.wasm': 'application/wasm'
};

const placar = { passes: 0, falhas: 0 };
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) placar.passes++; else placar.falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + String(obtido).slice(0, 300) + ' | esperado: ' + esperado + ']'));
  return ok;
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }
const pausa = ms => new Promise(r => setTimeout(r, ms));

/* Espera por condição, nunca por relógio; erro dentro de `ler` é "ainda não". */
async function esperar(rotulo, ler, condicao, limiteMs) {
  const inicio = Date.now();
  let valor;
  for (;;) {
    try { valor = await ler(); } catch (e) { valor = undefined; }
    if (condicao(valor)) {
      console.log('   ' + rotulo + ': em ' + (Date.now() - inicio) + ' ms');
      return { ok: true, valor };
    }
    if (Date.now() - inicio >= limiteMs) break;
    await pausa(150);
  }
  console.log('   ' + rotulo + ': não aconteceu em ' + limiteMs + ' ms (último valor: ' +
    JSON.stringify(valor === undefined ? null : valor).slice(0, 300) + ')');
  return { ok: false, valor };
}

/* trocas: { '/caminho.js': textoServido } substitui só esses arquivos.
 * opcoes.relogioReal: true tira o relógio fixo padrão do ambiente inteiro (a
 * página e o processo ficam no relógio de verdade); ver o cabeçalho. */
function criarAmbiente(porta, nomePerfil, trocas, opcoes) {
  trocas = trocas || {};
  opcoes = opcoes || {};
  /* O padrão no processo: aqui, e não ao carregar o arquivo, para a prova que
   * escolheu o dia dela (relogioDaRodada antes do criarAmbiente) ficar com ele. */
  if (RELOGIO_PADRAO_LIGADO && !opcoes.relogioReal) {
    relogioPadrao();   // a conta do da página nasce no mesmo instante que a do processo
    if (!Date.__baseDaRodada) instalarNoProcesso(DIA_PADRAO, HORA_PADRAO, true);
  }
  const ORIGEM = 'http://127.0.0.1:' + porta;
  const PERFIL = path.join(os.tmpdir(), nomePerfil + '_' + process.pid + '_' + Date.now());
  const conexoes = new Set();
  const quatrocentos = [];
  const extras = {};   // rotas só do teste (página vazia etc.)
  const servidor = http.createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel === '/') rel = '/index.html';
    /* Rede cortada de verdade: o setOfflineMode da página não alcança o
     * service worker, que busca pela rede dele. Com amb.cortado, toda conexão
     * cai sem resposta, e amb.cortados conta quem tentou passar. */
    if (amb.cortado) { amb.cortados.push(rel); req.socket.destroy(); return; }
    /* Rede fraca: com amb.segurar = '/prefixo/', o pedido chega e fica sem
     * resposta, como no tablet conectado mas sem tráfego. amb.soltarSegurados()
     * derruba os que ficaram pendurados. */
    if (amb.segurar && rel.indexOf(amb.segurar) === 0) { amb.segurados.push({ rel, req }); return; }
    if (extras[rel]) {
      res.writeHead(200, { 'Content-Type': extras[rel].tipo, 'Cache-Control': 'no-store' });
      res.end(extras[rel].corpo);
      return;
    }
    if (Object.prototype.hasOwnProperty.call(trocas, rel)) {
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(rel)] || 'text/plain', 'Cache-Control': 'no-store' });
      res.end(trocas[rel]);
      return;
    }
    const arquivo = path.join(RAIZ, rel);
    if (!arquivo.startsWith(RAIZ) || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
      quatrocentos.push(rel);
      res.writeHead(404); res.end('nao encontrado'); return;
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(fs.readFileSync(arquivo));
  });
  servidor.on('connection', s => { conexoes.add(s); s.on('close', () => conexoes.delete(s)); });

  function limparPerfil() {
    try { fs.rmSync(PERFIL, { recursive: true, force: true }); } catch (e) { /* já não existe */ }
  }
  process.on('exit', limparPerfil);

  function portaOcupada() {
    return new Promise(resolve => {
      const req = http.get({ host: '127.0.0.1', port: porta, path: '/', timeout: 1500 }, res => { res.resume(); resolve(true); });
      req.on('timeout', () => { req.destroy(); resolve(true); });
      req.on('error', () => resolve(false));
    });
  }
  function pegar(caminho) {
    return new Promise((resolve, reject) => {
      http.get(ORIGEM + caminho, res => {
        let corpo = '';
        res.setEncoding('utf8');
        res.on('data', p => { corpo += p; });
        res.on('end', () => resolve({ status: res.statusCode, corpo }));
      }).on('error', reject);
    });
  }

  let nav = null;
  let semPadraoNaProxima = false;   // pagina({ relogioReal: true }) liga só em volta do newPage
  const amb = {
    ORIGEM, PERFIL, quatrocentos, extras, cortado: false, cortados: [], segurar: null, segurados: [],
    soltarSegurados() {
      amb.segurados.forEach(s => { try { s.req.socket.destroy(); } catch (e) { /* já caiu */ } });
      amb.segurar = null;
    },
    async subir() {
      if (await portaOcupada()) {
        conf('a porta 127.0.0.1:' + porta + ' está livre antes de subir o servidor', 'ocupada', 'livre');
        throw Object.assign(new Error('porta ' + porta + ' ocupada'), { jaContado: true });
      }
      await new Promise((r, j) => { servidor.once('error', j); servidor.listen(porta, '127.0.0.1', r); });
      const eco = await pegar('/index.html');
      conf('quem responde em 127.0.0.1:' + porta + ' é este servidor', eco.status, 200);
      limparPerfil();
      nav = await puppeteer.launch({
        executablePath: CHROME, headless: true, userDataDir: PERFIL,
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
        defaultViewport: { width: 1280, height: 1000, hasTouch: true }
      });
      /* O relógio fixo padrão entra em TODA página aberta por este navegador,
       * inclusive a que a prova pede direto com nav.newPage(), antes de
       * qualquer script dela e do documento. */
      const novaPagina = nav.newPage.bind(nav);
      nav.newPage = async function (...a) {
        const p = await novaPagina(...a);
        if (RELOGIO_PADRAO_LIGADO && !opcoes.relogioReal && !semPadraoNaProxima) await relogioPadrao().naPagina(p);
        return p;
      };
      return nav;
    },
    async pagina(opcoesPagina) {
      semPadraoNaProxima = !!(opcoesPagina && opcoesPagina.relogioReal);
      let pag;
      try { pag = await nav.newPage(); } finally { semPadraoNaProxima = false; }
      pag.setDefaultTimeout(60000);
      pag.errosDePagina = [];
      pag.on('pageerror', e => pag.errosDePagina.push(e.message));
      pag.on('dialog', async d => { try { await d.accept(); } catch (e) { /* ok */ } });
      // o IBGE fica de fora: a rodada não depende de sinal nem de terceiro
      await pag.evaluateOnNewDocument(() => {
        const original = window.fetch;
        window.fetch = function (url) {
          if (String(url).indexOf('ibge') >= 0) return Promise.reject(new Error('sem rede para o IBGE neste teste'));
          return original.apply(this, arguments);
        };
      });
      return pag;
    },
    async encerrar() {
      if (nav) { try { await nav.close(); } catch (e) { /* já fechou */ } nav = null; }
      conexoes.forEach(s => s.destroy());
      await new Promise(r => servidor.close(() => r()));
      limparPerfil();
    }
  };
  return amb;
}

/* Abre o aplicativo, espera as abas e tira a janela de novidades do caminho.
 *
 * Na primeira visita de um perfil novo o worker assume (clients.claim no
 * activate do sw.js), o controllerchange dispara e o app recarrega sozinho
 * (app.js, registrarServiceWorker). É do app e é o esperado; a prova só não
 * pode medir em cima do documento que está para sumir ("Execution context was
 * destroyed", a main vermelha na 4a1c4ca). Antes, uma pausa de 1,2 s torcia
 * para a recarga já ter passado. Agora cada documento se marca ao nascer
 * (__nasceuControlada, o mesmo desenho do testa_biblioteca_importar) e o
 * abrirApp só devolve a página com o app pronto num documento que JÁ nasceu
 * sob o worker: esse não recarrega mais pelo primeiro controle.
 *
 * Página com o worker contornado (setBypassServiceWorker) nunca nasce
 * controlada: nela basta o app pronto. Página sem registro de worker nenhum
 * (a instalação falhou e o navegador apagou o registro) também não recarrega:
 * segue, e diz isso no log. Worker registrado que não assume no prazo (preso
 * instalando ou esperando) é erro com o estado do registro e a marca
 * semWorker, nunca espera sem fim.
 *
 * O app abre as novidades 900 ms depois de pronto (app.js,
 * setTimeout(mostrarNovidades, 900)): a página só volta quando o mesmo
 * documento está pronto há PRAZO_NOVIDADES_MS no relógio dele, e a janela, se
 * abriu, é fechada. Se o documento trocar no meio, a contagem recomeça no novo. */
const PRAZO_APP_MS = 40000;
const PRAZO_WORKER_MS = 30000;
const PRAZO_NOVIDADES_MS = 1000;
const PRAZO_SEM_REGISTRO_MS = 3000;

async function marcarDocumentos(pag) {
  if (pag.__marcaDoControle) return;
  pag.__marcaDoControle = true;
  await pag.evaluateOnNewDocument(() => {
    window.__nasceuControlada = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
    window.__documento = Math.random().toString(36).slice(2) + '.' + Date.now();
  });
}

const lerDocumento = pag => pag.evaluate(() => {
  const base = {
    pronto: !!document.querySelector('#abas .aba') && typeof Store === 'object' &&
      !!document.querySelector('#versao-app') && document.querySelector('#versao-app').textContent.length > 1,
    controlada: window.__nasceuControlada === true,
    id: window.__documento || null
  };
  const registro = navigator.serviceWorker ? navigator.serviceWorker.getRegistration() : Promise.resolve(null);
  return registro.then(r => Object.assign(base, { registro: !!r, agora: performance.now() }));
});

async function abrirApp(pag, origem) {
  await marcarDocumentos(pag);
  const contornado = pag.isServiceWorkerBypassed();
  await pag.goto(origem + '/index.html', { waitUntil: 'networkidle0' });
  const pronto = await esperar('o aplicativo abriu', () => lerDocumento(pag), v => !!v && v.pronto, PRAZO_APP_MS);
  if (!pronto.ok) throw Object.assign(new Error('o aplicativo não abriu'), { jaContado: false });
  /* candidato: o documento pronto que está sendo observado, e por qual motivo
   * ele não vai recarregar. "sem registro" é a instalação que falhou (o
   * navegador apaga o registro do worker que não instala, como o sw.js do
   * 1.26.0 do testa_biblioteca_kits, que lista arquivos que não existem mais):
   * sem worker não há recarga a esperar, mas só vale depois de
   * PRAZO_SEM_REGISTRO_MS seguidos no mesmo documento, porque o register()
   * leva um instante para criar o registro. Worker registrado que nunca
   * assume (preso instalando ou esperando) cai no prazo e é erro. */
  let candidato = null;
  const assentou = await esperar(contornado ? 'o aplicativo assentou (worker contornado)' :
    'o aplicativo assentou num documento que já nasceu sob o worker', () => lerDocumento(pag), v => {
    const motivo = !v || !v.pronto || !v.id ? null :
      (contornado ? 'contornado' : (v.controlada ? 'controlada' : (!v.registro ? 'sem registro' : null)));
    if (!motivo) { candidato = null; return false; }
    if (!candidato || candidato.id !== v.id || candidato.motivo !== motivo) candidato = { id: v.id, motivo, desde: v.agora };
    return v.agora - candidato.desde >= (motivo === 'sem registro' ? PRAZO_SEM_REGISTRO_MS : PRAZO_NOVIDADES_MS);
  }, PRAZO_WORKER_MS);
  if (assentou.ok && candidato.motivo === 'sem registro') {
    console.log('   (nenhum service worker registrado nesta página: a instalação falhou ou não houve; não há recarga a esperar)');
  }
  if (!assentou.ok) {
    let estado = '?';
    try {
      estado = await pag.evaluate(() => navigator.serviceWorker.getRegistration().then(r => JSON.stringify({
        nasceuControlada: window.__nasceuControlada, controlador: !!navigator.serviceWorker.controller,
        registro: !!r, instalando: !!(r && r.installing), esperando: !!(r && r.waiting), ativo: !!(r && r.active) })));
    } catch (e) { estado = 'sem leitura: ' + e.message; }
    throw Object.assign(new Error((contornado ? 'o aplicativo não ficou de pé ' : 'o service worker não assumiu a página ') +
      'em ' + PRAZO_WORKER_MS + ' ms; estado: ' + estado), { jaContado: false, semWorker: !contornado });
  }
  await pag.evaluate(() => {
    const b = document.querySelector('#entendi-novidades');
    if (b && document.querySelector('#modal-novidades.aberto')) b.click();
  });
}

async function irParaAba(pag, tela) {
  await pag.evaluate(t => {
    const aba = Array.from(document.querySelectorAll('#abas .aba')).find(x => x.dataset.tela === t);
    if (aba) aba.click();
  }, tela);
  await pausa(150);
}

/* Conta registros de um depósito do IndexedDB, de dentro da página. */
const contarDeposito = (pag, nome) => pag.evaluate(n => new Promise(r => {
  const q = indexedDB.open('apoio-educacional');
  q.onsuccess = () => {
    const b = q.result;
    if (!b.objectStoreNames.contains(n)) { b.close(); r(-1); return; }
    const c = b.transaction(n, 'readonly').objectStore(n).count();
    c.onsuccess = () => { b.close(); r(c.result); };
    c.onerror = () => { b.close(); r(-2); };
  };
  q.onerror = () => r(-3);
}), nome);

function fim(amb) {
  return async function (e) {
    if (e) {
      console.error('erro:', e.message);
      if (!e.jaContado) { console.error(e.stack); placar.falhas++; }
    }
    try { await amb.encerrar(); } catch (e2) { /* nada */ }
    if (amb.quatrocentos.length) console.log('   o servidor respondeu 404 para: ' + amb.quatrocentos.slice(0, 8).join(', '));
    console.log('\n' + placar.passes + ' passaram, ' + placar.falhas + ' falharam.');
    process.exit(placar.falhas ? 1 : 0);
  };
}

/* O relógio padrão: o mesmo dia e a mesma hora de quase todas as provas. A
 * RELOGIO_PADRAO_LIGADO existe para o veneno do testa_relogio_padrao (o helper
 * servido sem o padrão); em produção é sempre true. */
const RELOGIO_PADRAO_LIGADO = true;
const DIA_PADRAO = '2026-11-16';
const HORA_PADRAO = '11:00';

/* A conta do relógio, sem tocar em nada: o instante fixo (hora local) e o
 * deslocamento do relógio do sistema até ele. */
function contaDoRelogio(iso, hhmm) {
  const p = iso.split('-').map(Number), h = hhmm.split(':').map(Number);
  const fixo = new (Date.__baseDaRodada || Date)(p[0], p[1] - 1, p[2], h[0], h[1]).getTime();
  const sistema = () => performance.timeOrigin + performance.now();
  return { p, fixo, deslocamento: fixo - sistema() };
}

/* Põe o relógio da rodada no Date do processo, sempre em cima do Date de
 * verdade: se já havia um relógio da rodada (o padrão, ou uma escolha anterior),
 * ele sai, e o novo não fica dentro do outro. Um Date trocado por quem não é
 * este arquivo (o controle que finge a meia-noite) continua sendo a base. */
function instalarNoProcesso(iso, hhmm, ehPadrao) {
  const Base = Date.__baseDaRodada || Date;
  const { fixo } = contaDoRelogio(iso, hhmm);
  const base0 = Base.now();
  const agora = () => fixo + (Base.now() - base0);
  function DaRodada(...a) {
    if (!new.target) return new Base(agora()).toString();
    return a.length ? new Base(...a) : new Base(agora());
  }
  DaRodada.prototype = Base.prototype;
  DaRodada.now = agora; DaRodada.UTC = Base.UTC; DaRodada.parse = Base.parse;
  DaRodada.__baseDaRodada = Base; DaRodada.__padrao = !!ehPadrao;
  global.Date = DaRodada;
}

const isoDeData = d => { const q = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + q(d.getMonth() + 1) + '-' + q(d.getDate()); };

/* O objeto da rodada (dia, conferir, naPagina) para o dia e a hora dados. Não
 * mexe no Date do processo: quem instala é o instalarNoProcesso. */
function montarRelogio(iso, hhmm, ehPadrao) {
  const { p, fixo, deslocamento } = contaDoRelogio(iso, hhmm);
  const Base = Date.__baseDaRodada || Date;
  /* O dia `n` dias depois (antes, se negativo) do dia fixo, em aaaa-mm-dd. */
  const dia = n => isoDeData(new Base(p[0], p[1] - 1, p[2] + n, 12, 0));
  /* (arranjo) A página aberta e o processo estão no dia da rodada: sem isto,
   * uma prova que esqueceu o naPagina passaria no dia de hoje sem ninguém ver. */
  const conferir = async pag => conf('(arranjo) a página e o processo estão no dia da rodada (' + iso + ')',
    [await pag.evaluate(() => Core.hojeIso()), isoDeData(new Date())].join(' '), iso + ' ' + iso);
  return {
    iso, hhmm, fixo, dia, conferir,
    /* O padrão (ehPadrao) cede a vez: se a página já tem uma escolha explícita
     * da prova, ele não entra; se tem só o padrão, a escolha explícita o
     * substitui. Em qualquer ordem a página fica com a escolha da prova. */
    naPagina: pag => pag.evaluateOnNewDocument((desl, padrao) => {
      if (window.__DataDaRodada && (padrao || !window.__DataDaRodadaPadrao)) return;
      /* O Date de verdade da página, de antes de qualquer relógio da rodada: o
       * novo relógio nunca fica dentro do outro. */
      const Real = window.__DateDoMundo || Date;
      /* Do relógio do sistema, e não do Date que a página já tinha: se algo
       * trocou o Date dela antes (o controle que finge a data no navegador
       * inteiro), a rodada continua no dia dela. */
      const agoraPag = () => performance.timeOrigin + performance.now() + desl;
      function DaRodada(...a) {
        if (!new.target) return new Real(agoraPag()).toString();
        return a.length ? new Real(...a) : new Real(agoraPag());
      }
      DaRodada.prototype = Real.prototype;
      DaRodada.now = agoraPag; DaRodada.UTC = Real.UTC; DaRodada.parse = Real.parse;
      window.__DateDoMundo = Real;
      window.__DataDaRodadaPadrao = !!padrao;
      window.__DataDaRodada = DaRodada;
      window.Date = DaRodada;
    }, deslocamento, !!ehPadrao)
  };
}

/* O relógio da rodada: a prova inteira acontece num dia e numa hora escolhidos,
 * e nunca no dia e na hora em que o CI roda (o portão de 09/11 caiu porque uma
 * conferência dependia da hora real, depois da meia-noite UTC).
 *
 * relogioDaRodada('2026-11-16', '11:00') troca o Date do processo: new Date()
 * e Date.now() começam nesse instante (hora local) e andam no passo do relógio
 * de verdade; com argumentos, Date é o de sempre. naPagina(pag) põe o mesmo
 * relógio na página, antes de qualquer script dela, e vale a cada recarga.
 *
 * O relógio ANDA, não fica parado: o app carimba as gravações com a hora e
 * monta o id da cópia com Date.now(), e um relógio parado daria a duas cópias
 * o mesmo id e a duas gravações a mesma hora. Para parar numa hora, a prova
 * usa por cima o fixarRelogio dela, que guarda este como o Date de volta.
 *
 * O passo da página vem do relógio do sistema (performance.timeOrigin), e não
 * do Date do processo nem do Date da página: assim a página e o processo
 * concordam mesmo quando um dos dois foi trocado antes (o controle que finge a
 * meia-noite no processo e no navegador).
 *
 * Quem usa: celular_edita, celular_leitura, falha_de_gravacao e as provas de
 * tela que liam o dia de verdade (domínio, sondagem, documento do ciclo, anexo,
 * documento da família, virada anual, leitor de PDF, limpeza, sem material
 * autoral, celular_ficha e as da biblioteca). A data do teste sai de
 * RELOGIO.dia(n), no relógio local, e nunca de toISOString (o dia em UTC). */
function relogioDaRodada(iso, hhmm) {
  instalarNoProcesso(iso, hhmm, false);
  return montarRelogio(iso, hhmm, false);
}

/* O relógio padrão (o objeto dele, criado na primeira vez que alguém pede): o
 * da página é instalado pelo navegador do ambiente, e o do processo, pelo
 * criarAmbiente. Quem quiser conferir o arranjo numa prova sem escolha
 * explícita usa relogioPadrao().conferir(pag). */
let padraoMontado = null;
function relogioPadrao() {
  if (!padraoMontado) padraoMontado = montarRelogio(DIA_PADRAO, HORA_PADRAO, true);
  return padraoMontado;
}

module.exports = { RAIZ, conf, secao, pausa, esperar, criarAmbiente, abrirApp, irParaAba, contarDeposito, placar, fim, relogioDaRodada, relogioPadrao };
