/* testa_relogio_padrao.js
 *
 * Prova do relógio fixo PADRÃO do _bib_navegador (a correção central da
 * bomba-relógio de 01/01/2027): toda página que a prova abre pelo helper nasce
 * em 16/11/2026 às 11:00, sem a prova chamar nada, e a prova que precisa do
 * relógio de verdade sai com { relogioReal: true }.
 *
 * O CENÁRIO REAL, simulado: o relógio do SISTEMA adiantado para 02/01/2027
 * (sem mexer no relógio do Windows). Cada cenário é um filho deste mesmo
 * arquivo (--filho=...), com o "mundo em 2027" montado ANTES de o helper
 * existir: no processo, o Date global e o performance.timeOrigin deslocados; na
 * página, um evaluateOnNewDocument mais velho que o do helper (o
 * puppeteer.launch é embrulhado para o nav.newPage registrar o mundo antes de o
 * helper registrar o padrão), que desloca o Date e o performance.timeOrigin da
 * página no mesmo tanto. Sem o padrão o app vê 02/01/2027; com ele, 16/11/2026.
 *
 * O que prova: (1) com o padrão a virada anual NÃO abre (esperado por condição:
 * o app já rodou a verificação da virada, depois dos 1,4 s dele, e a modal está
 * fechada, com o banco de uma carga inicial de 2026 que TEM virada a mostrar);
 * (2) o MESMO cenário com { relogioReal: true } (ambiente e só página): a virada
 * ABRE (sem este controle o (1) não valeria nada); (3) a escolha explícita
 * vence o padrão, sem relógio dentro de relógio, na página e no processo, nas
 * duas ordens (relogioDaRodada antes ou depois do criarAmbiente); (4) o
 * relógio anda, no passo do sistema, e página e processo concordam; (5) a
 * página aberta direto com nav.newPage() também nasce no padrão.
 * O que NÃO prova: que o Chrome e o Node de verdade acompanham um relógio do
 * Windows adiantado. Aqui o "adiantado" é um deslocamento do Date e do
 * performance.timeOrigin dos dois lados, que é como o helper enxerga o sistema;
 * a prova também não olha o service worker (fora do alcance do relógio da
 * página, e o app não decide a virada por ele).
 *
 * Veneno: --envenenado-sem-padrao serve o helper com RELOGIO_PADRAO_LIGADO
 * desligado (em memória, sem cópia em disco), roda o cenário do padrão e
 * confirma "VENENO visto": a virada abre onde o padrão deveria impedir.
 * Porta 8898. Sem emulador.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const Module = require('module');
const { spawnSync } = require('child_process');

const PORTA = 8898;
const ANCORA_VENENO = 'const RELOGIO_PADRAO_LIGADO = true;';
const CAMINHO_HELPER = path.join(__dirname, '_bib_navegador.js');
const filho = (process.argv.find(a => a.indexOf('--filho=') === 0) || '').slice(8);
const VENENO = process.argv.indexOf('--envenenado-sem-padrao') >= 0;
const MARCA = 'RESULTADO ';
const isoDe = d => { const q = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + q(d.getMonth() + 1) + '-' + q(d.getDate()); };

/* ================================================================ FILHO */
if (filho) {
  /* O mundo em 02/01/2027 às 10:00, ANTES de o helper existir. */
  const DateReal = Date;
  const ALVO = new DateReal(2027, 0, 2, 10, 0).getTime();
  const DESLOC = ALVO - DateReal.now();
  function DateMundo(...a) {
    if (!new.target) return new DateReal(DateReal.now() + DESLOC).toString();
    return a.length ? new DateReal(...a) : new DateReal(DateReal.now() + DESLOC);
  }
  DateMundo.prototype = DateReal.prototype;
  DateMundo.now = () => DateReal.now() + DESLOC; DateMundo.UTC = DateReal.UTC; DateMundo.parse = DateReal.parse;
  global.Date = DateMundo;
  const T0 = performance.timeOrigin;
  Object.defineProperty(performance, 'timeOrigin', { configurable: true, get: () => T0 + DESLOC });

  /* A página no mesmo mundo, registrada ANTES de qualquer script do helper. */
  /* O módulo do puppeteer pode ser um namespace somente leitura: o helper
   * recebe, do cache do require, um embrulho com o launch trocado. */
  const caminhoPup = require.resolve('puppeteer-core');
  const puppeteer = require(caminhoPup);
  const lancarNovo = async function (...a) {
    const nav = await puppeteer.launch(...a);
    const novaPagina = nav.newPage.bind(nav);
    nav.newPage = async function (...b) {
      const p = await novaPagina(...b);
      await p.evaluateOnNewDocument(desl => {
        const R = Date, T = performance.timeOrigin;
        function M(...x) {
          if (!new.target) return new R(R.now() + desl).toString();
          return x.length ? new R(...x) : new R(R.now() + desl);
        }
        M.prototype = R.prototype; M.now = () => R.now() + desl; M.UTC = R.UTC; M.parse = R.parse;
        window.Date = M; window.__DateMundo = M;
        Object.defineProperty(performance, 'timeOrigin', { configurable: true, get: () => T + desl });
      }, DESLOC);
      return p;
    };
    return nav;
  };
  require.cache[caminhoPup].exports = new Proxy(puppeteer, {
    get: (alvo, chave) => chave === 'launch' ? lancarNovo : Reflect.get(alvo, chave)
  });

  /* O helper: o de verdade, ou (veneno) o mesmo texto com o padrão desligado,
   * compilado em memória com o caminho real. */
  let H;
  if (VENENO) {
    const texto = fs.readFileSync(CAMINHO_HELPER, 'utf8');
    if (texto.split(ANCORA_VENENO).length !== 2) { console.log('A ÂNCORA DO VENENO NÃO ESTÁ UMA VEZ SÓ NO HELPER'); process.exit(3); }
    const m = new Module(CAMINHO_HELPER, module);
    m.filename = CAMINHO_HELPER; m.paths = Module._nodeModulePaths(__dirname);
    m._compile(texto.replace(ANCORA_VENENO, 'const RELOGIO_PADRAO_LIGADO = false;'), CAMINHO_HELPER);
    H = m.exports;
  } else {
    H = require('./_bib_navegador');
  }
  const { esperar, pausa } = H;

  /* O espião da virada: roda a cada vez que o app chama a verificação (que se
   * reagenda a cada 1,5 s enquanto as novidades estão abertas) e diz, quando
   * não sobrou nenhuma agendada, se a modal da virada ficou aberta. */
  const espiarVirada = pag => pag.evaluateOnNewDocument(() => {
    const original = window.setTimeout;
    let pendentes = 0;
    window.__virada = { fim: false, em: null, aberta: null, chamadas: 0 };
    window.setTimeout = function (fn, ms, ...resto) {
      if (typeof fn === 'function' && fn.name === 'verificarViradaAnualAutomatica') {
        pendentes++;
        return original.call(this, function () {
          pendentes--;
          window.__virada.chamadas++;
          const r = fn.apply(this, arguments);
          if (pendentes === 0) {
            const m = document.querySelector('#modal-virada-anual');
            window.__virada.fim = true;
            window.__virada.em = performance.now();
            window.__virada.aberta = !!(m && m.classList.contains('aberto'));
          }
          return r;
        }, ms, ...resto);
      }
      return original.call(this, fn, ms, ...resto);
    };
  });

  const lerPagina = pag => pag.evaluate(() => {
    const m = document.querySelector('#modal-virada-anual');
    return Store.carregar().then(d => ({
      hojeIso: Core.hojeIso(),
      ano: new Date().getFullYear(),
      padrao: window.__DataDaRodadaPadrao === undefined ? null : window.__DataDaRodadaPadrao,
      semAninhar: !window.__DataDaRodada || window.__DateDoMundo === window.__DateMundo,
      virada: window.__virada,
      modalAbertaAgora: !!(m && m.classList.contains('aberto')),
      alunos: (d.alunos || []).length,
      ultimo: d.ajustes && d.ajustes.ultimoAnoLetivoAtualizado,
      haViradaEm2027: (Core.prepararViradaAnual(d, 2027).linhas || []).length > 0
    }));
  });

  (async () => {
    const saida = { cenario: filho };
    let amb = null;
    try {
      if (filho === 'processo-antes') {
        /* sem navegador: a escolha explícita ANTES do criarAmbiente fica no dia dela */
        const R = H.relogioDaRodada('2027-03-10', '09:00');
        amb = H.criarAmbiente(PORTA, 'nath_relogio_padrao_proc');
        saida.processoIso = isoDe(new Date());
        saida.processoPadrao = Date.__padrao;
        saida.processoSemAninhar = Date.__baseDaRodada === DateMundo;
        saida.diaDoObjeto = R.dia(0);
        console.log(MARCA + JSON.stringify(saida));
        process.exit(0);
      }
      const opcoesAmb = filho === 'real' ? { relogioReal: true } : undefined;
      amb = H.criarAmbiente(PORTA, 'nath_relogio_padrao', undefined, opcoesAmb);
      let R = null;
      if (filho === 'explicito') R = H.relogioDaRodada('2027-03-10', '09:00');   // DEPOIS do criarAmbiente
      const nav = await amb.subir();
      const pag = await amb.pagina(filho === 'pagina-real' ? { relogioReal: true } : undefined);
      if (R) await R.naPagina(pag);
      await espiarVirada(pag);
      await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
      await H.abrirApp(pag, amb.ORIGEM);

      const espera = await esperar('o app rodou a verificação da virada anual', () => pag.evaluate(() => window.__virada), v => !!v && v.fim, 20000);
      saida.esperou = espera.ok;
      Object.assign(saida, await lerPagina(pag));
      saida.processoIso = isoDe(new Date());
      saida.processoPadrao = Date.__padrao === undefined ? null : Date.__padrao;
      saida.processoSemAninhar = Date.__baseDaRodada === undefined ? null : Date.__baseDaRodada === DateMundo;

      /* o relógio anda, no passo do sistema, e página e processo concordam */
      const a = await pag.evaluate(() => [Date.now(), performance.now()]);
      const p0 = Date.now();
      await pausa(500);
      const b = await pag.evaluate(() => [Date.now(), performance.now()]);
      saida.andouPagina = b[0] - a[0];
      saida.andouPerf = b[1] - a[1];
      saida.andouProcesso = Date.now() - p0;
      saida.difPaginaProcesso = Math.abs(b[0] - Date.now());

      if (filho === 'padrao') {
        /* a página aberta direto com nav.newPage(): nasce no padrão também */
        const outra = await nav.newPage();
        await outra.goto(amb.ORIGEM + '/index.html', { waitUntil: 'domcontentloaded' });
        saida.diretaIso = await outra.evaluate(() => { const d = new Date(), q = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + q(d.getMonth() + 1) + '-' + q(d.getDate()); });
        saida.diretaPadrao = await outra.evaluate(() => window.__DataDaRodadaPadrao === true);
      }
      console.log(MARCA + JSON.stringify(saida));
    } catch (e) {
      console.log('ERRO ' + (e && e.stack || e));
      process.exitCode = 2;
    }
    try { if (amb) await amb.encerrar(); } catch (e) { /* nada */ }
    process.exit(process.exitCode || 0);
  })();
} else {
/* ================================================================ PAI */
  const H = require('./_bib_navegador');
  const { conf, secao } = H;

  function rodarFilho(cenario, extra) {
    const r = spawnSync(process.execPath, [__filename, '--filho=' + cenario].concat(extra || []), {
      encoding: 'utf8', timeout: 180000, env: process.env
    });
    const linha = String(r.stdout || '').split(/\r?\n/).find(l => l.indexOf(MARCA) === 0);
    if (!linha) {
      console.log('   o filho "' + cenario + '" não devolveu resultado (código ' + r.status + '):\n' +
        String(r.stdout || '').slice(-800) + String(r.stderr || '').slice(-800));
      return null;
    }
    return JSON.parse(linha.slice(MARCA.length));
  }

  const aberta = r => !!(r && r.virada && r.virada.aberta === true);
  const confVirada = (r, esperadoAberta, quando) => {
    conf(quando + ': a verificação da virada rodou (por condição) e depois dos 1,4 s do app', !!(r && r.esperou && r.virada && r.virada.fim && r.virada.em >= 1400), true);
    conf(quando + ': a virada anual ' + (esperadoAberta ? 'ABRIU' : 'NÃO abriu') + ' ao rodar a verificação', aberta(r), esperadoAberta);
    conf(quando + ': e continua ' + (esperadoAberta ? 'aberta' : 'fechada') + ' no fim', !!(r && r.modalAbertaAgora), esperadoAberta);
  };
  const confBanco = (r, quando) => {
    /* o banco é de uma carga inicial de 2026 e TEM virada a mostrar em 2027:
     * "não abriu" não é "não havia o que abrir" */
    conf(quando + ': o banco tem alunos e ultimoAnoLetivoAtualizado 2026', r ? r.alunos > 0 && r.ultimo === 2026 : false, true);
    conf(quando + ': e em 2027 haveria virada a mostrar', !!(r && r.haViradaEm2027), true);
  };
  const confAnda = (r, quando) => {
    conf(quando + ': o relógio da página ANDA (>= 450 ms em 500 ms)', !!(r && r.andouPagina >= 450), true);
    conf(quando + ': no passo do sistema (relógio da página x performance.now, até 30 ms)', !!(r && Math.abs(r.andouPagina - r.andouPerf) <= 30), true);
    conf(quando + ': o do processo também anda', !!(r && r.andouProcesso >= 450), true);
    conf(quando + ': página e processo concordam (até 5 s)', !!(r && r.difPaginaProcesso < 5000), true);
  };

  secao('0. A âncora do veneno aparece uma vez só no helper');
  const textoHelper = fs.readFileSync(CAMINHO_HELPER, 'utf8');
  conf('"' + ANCORA_VENENO + '" ocorre uma vez no _bib_navegador.js', textoHelper.split(ANCORA_VENENO).length - 1, 1);

  (async () => {
    if (VENENO) {
      secao('V. O helper SEM o padrão, no mundo de 02/01/2027');
      const r = rodarFilho('padrao', ['--envenenado-sem-padrao']);
      conf('o app, sem o padrão, viu 2027 (a página)', r ? r.ano : null, 2027);
      conf('VENENO visto: a virada abriu onde o padrão deveria impedir', aberta(r), true);
    } else {
      secao('1. Com o padrão: a página nasce em 16/11/2026 e a virada NÃO abre');
      const r1 = rodarFilho('padrao');
      conf('a página está no dia do padrão', r1 ? r1.hojeIso : null, '2026-11-16');
      conf('o processo está no dia do padrão', r1 ? r1.processoIso : null, '2026-11-16');
      conf('o relógio da página é o PADRÃO (marcado como padrão)', r1 ? r1.padrao : null, true);
      conf('o do processo é o padrão, sobre o Date do mundo (sem aninhar)', r1 ? [r1.processoPadrao, r1.processoSemAninhar].join(' ') : null, 'true true');
      confVirada(r1, false, 'com o padrão');
      confBanco(r1, 'com o padrão');
      confAnda(r1, 'com o padrão');
      conf('a página aberta direto com nav.newPage() também nasce no padrão', r1 ? [r1.diretaIso, r1.diretaPadrao].join(' ') : null, '2026-11-16 true');

      secao('2. O controle: o mesmo mundo com { relogioReal: true }, a virada ABRE');
      const r2 = rodarFilho('real');
      conf('o ambiente com relogioReal: a página viu o mundo (02/01/2027)', r2 ? r2.hojeIso : null, '2027-01-02');
      conf('e o processo também', r2 ? r2.processoIso : null, '2027-01-02');
      conf('nenhum relógio da rodada na página nem no processo', r2 ? [r2.padrao, r2.processoPadrao].map(String).join(' ') : null, 'null null');
      confVirada(r2, true, 'com relogioReal');
      confBanco(r2, 'com relogioReal');
      confAnda(r2, 'com relogioReal');
      const r2b = rodarFilho('pagina-real');
      conf('amb.pagina({ relogioReal: true }): só a página fica no relógio real (2027), o processo no padrão',
        r2b ? [r2b.hojeIso, r2b.processoIso].join(' ') : null, '2027-01-02 2026-11-16');
      confVirada(r2b, true, 'com relogioReal só na página');

      secao('3. A escolha explícita da prova vence o padrão');
      const r3 = rodarFilho('explicito');
      conf('relogioDaRodada DEPOIS do criarAmbiente: a página está no dia da prova', r3 ? r3.hojeIso : null, '2027-03-10');
      conf('e o processo também', r3 ? r3.processoIso : null, '2027-03-10');
      conf('a página guarda a escolha explícita (não é o padrão) e não há relógio dentro de relógio', r3 ? [r3.padrao, r3.semAninhar].join(' ') : null, 'false true');
      conf('o processo também: explícito, sobre o Date do mundo', r3 ? [r3.processoPadrao, r3.processoSemAninhar].join(' ') : null, 'false true');
      confVirada(r3, true, 'com a escolha explícita em 2027');
      confAnda(r3, 'com a escolha explícita');
      const r4 = rodarFilho('processo-antes');
      conf('relogioDaRodada ANTES do criarAmbiente: o processo fica no dia da prova', r4 ? r4.processoIso : null, '2027-03-10');
      conf('o padrão não entrou por cima: explícito, sobre o Date do mundo', r4 ? [r4.processoPadrao, r4.processoSemAninhar].join(' ') : null, 'false true');
      conf('RELOGIO.dia(0) é o dia da prova', r4 ? r4.diaDoObjeto : null, '2027-03-10');
    }
    console.log('\n' + H.placar.passes + ' passaram, ' + H.placar.falhas + ' falharam.');
    process.exit(H.placar.falhas ? 1 : 0);
  })().catch(e => { console.error('erro:', e.stack); console.log('\n' + H.placar.passes + ' passaram, ' + (H.placar.falhas + 1) + ' falharam.'); process.exit(1); });
}
