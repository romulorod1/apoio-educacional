/* testa_biblioteca_offline.js
 *
 * Prova que uma série de temas já baixada no tablet continua abrindo depois de
 * uma atualização do aplicativo feita SEM SINAL. E prova que este teste sabe
 * reprovar quando isso deixa de ser verdade.
 *
 * O incidente que ele existe para impedir está narrado em sw.js:12-16: uma
 * atualização apagou a biblioteca de temas baixada e, no dia seguinte, na casa
 * da família sem sinal, nenhum tema abria. Os dois testes de atualização que já
 * existiam (testa_atualizacao.js e testa_atualizacao_real.js) servem uma árvore
 * de 9 arquivos saída do commit 7250029; o install do sw.js de hoje exige a
 * lista ARQUIVOS inteira e falha inteiro no primeiro 404 (sw.js:105-113), então
 * os dois rodam sob o service worker da 1.0.0 e não provam nada sobre o cache
 * BAIXADOS. Este serve a árvore inteira de hoje, lida do próprio sw.js, e
 * confere logo no começo que o install completou: se não completar, ele diz
 * isso com todas as letras e reprova, em vez de seguir provando outra coisa.
 *
 * Dois modos, no mesmo arquivo:
 *   node _teste/testa_biblioteca_offline.js
 *     a versão nova entra sem sinal e a série baixada continua abrindo.
 *   node _teste/testa_biblioteca_offline.js --envenenado
 *     a versão nova publicada troca, no app.js, 'banco/serie-' por
 *     'banco/matematica/serie-' (o defeito fatal: a chave do cache não muda,
 *     mas o aplicativo passa a pedir outra URL, e sem sinal nada abre). Aqui o
 *     teste espera a perda e imprime OK quando a enxerga. Um teste que não
 *     reprova no defeito que existe para pegar não é trava, é enfeite.
 *   node _teste/testa_biblioteca_offline.js --envenenado-activate
 *     o segundo veneno, e é o incidente real de sw.js:12-16: o sw.js publicado
 *     deixa de poupar o BAIXADOS no activate, e a atualização apaga a
 *     biblioteca inteira. O primeiro veneno nunca faz as asserções de cache
 *     falharem (a chave continua lá, só a URL pedida muda); este faz. Sem ele,
 *     um activate que apagasse o BAIXADOS passaria pelas duas asserções de
 *     cache sem ninguém provar que elas sabem reprovar.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const RAIZ = path.join(__dirname, '..');
/* Começa com sim_ como as pastas dos irmãos: é uma cópia do repositório, e o
 * app.js carrega o primeiro nome do aluno do exemplo. Some no fim e no catch. */
const PASTA = path.join(__dirname, 'sim_biblioteca');
/* Porta própria, diferente da 8777 do portão e da 8779 do irmão: no Windows o
 * listen do node sobe junto com outro processo já ligado na mesma porta e as
 * conexões vão para o antigo. Por isso a porta é conferida antes e depois. */
const PORTA = 8783;
const ENVENENADO = process.argv.indexOf('--envenenado') !== -1;
const VENENO_ACTIVATE = process.argv.indexOf('--envenenado-activate') !== -1;
/* Qualquer veneno: nos dois a série tem que DEIXAR de abrir sem sinal, e o OK
 * do teste é enxergar isso. O que muda entre eles é por onde a perda entra:
 * pela URL que o app pede, ou pelo cache que o activate apaga. */
const VENENO = ENVENENADO || VENENO_ACTIVATE;

const SERIE = '06';
const CAMINHO_SERIE = 'banco/serie-' + SERIE + '.json';
/* Uma série que existe no servidor e que o cenário NUNCA baixa: é o controle
 * que prova que o corte de rede chegou ao service worker. Sem sinal ela tem
 * que voltar 503, que é a resposta que o próprio sw.js fabrica (sw.js:188).
 * Se voltasse 200, o service worker ainda estaria falando com o servidor e
 * tudo que viesse depois seria prova de nada. */
const CAMINHO_CONTROLE = 'banco/serie-05.json';
/* A URL que o app.js publicado passa a pedir. No modo envenenado é a errada,
 * de propósito: é ela que o teste tem que ver falhar. */
const CAMINHO_QUE_O_APP_PEDE = ENVENENADO ? 'banco/matematica/serie-' + SERIE + '.json' : CAMINHO_SERIE;

const APP_REPO = fs.readFileSync(path.join(RAIZ, 'app.js'), 'utf8');
const SW_REPO = fs.readFileSync(path.join(RAIZ, 'sw.js'), 'utf8');
// as constantes saem do próprio código, para o teste não envelhecer a cada release
const VERSAO_REPO = (APP_REPO.match(/var VERSAO = '([^']+)'/) || [])[1];
const CACHE_ATUAL = (SW_REPO.match(/var CACHE = '([^']+)'/) || [])[1];
const BAIXADOS = (SW_REPO.match(/var BAIXADOS = '([^']+)'/) || [])[1];
const CACHE_NOVO = 'apoio-educacional-v99';
const VERSAO_NOVA = '9.9.9';

const ORIGEM = 'http://127.0.0.1:' + PORTA;
const URL_APP = ORIGEM + '/index.html';
const URL_SW = ORIGEM + '/sw.js';
const URL_SERIE = ORIGEM + '/' + CAMINHO_SERIE;

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

let falhas = 0, passes = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }
const pausa = ms => new Promise(r => setTimeout(r, ms));

/* ESPERA POR CONDIÇÃO, nunca por relógio. O irmão testa_atualizacao_real
 * mediu: espera fixa de 3500 ms reprovava 4 de 6 vezes no HEAD limpo, sem
 * defeito nenhum. Aqui cada espera tem prazo generoso, imprime o tempo real e
 * devolve o último valor lido, para a falha mostrar o que estava na tela. Erro
 * dentro de `ler` é tratado como "ainda não": no meio de um recarregamento o
 * contexto da página some e o evaluate lança, e isso não é reprovação. */
async function esperar(rotulo, ler, condicao, limiteMs) {
  const inicio = Date.now();
  let valor;
  for (;;) {
    try { valor = await ler(); } catch (e) { valor = undefined; }
    if (condicao(valor)) {
      const ms = Date.now() - inicio;
      console.log('   ' + rotulo + ': em ' + ms + ' ms');
      return { ok: true, valor: valor, ms: ms };
    }
    if (Date.now() - inicio >= limiteMs) break;
    await pausa(250);
  }
  console.log('   ' + rotulo + ': não aconteceu em ' + limiteMs + ' ms (último valor: ' +
    JSON.stringify(valor === undefined ? null : valor).slice(0, 200) + ')');
  return { ok: false, valor: valor, ms: limiteMs };
}

/* A lista ARQUIVOS lida do sw.js, do mesmo jeito que o portão lê: só as linhas
 * que são um caminho entre aspas, nada de comentário. Escrever a lista à mão
 * aqui seria uma segunda lista para ficar desatualizada. A entrada './' fica
 * na lista porque vira uma chave própria no cache (a raiz, separada de
 * index.html): medido, o install guarda 36 chaves para 35 arquivos. */
function lerListaArquivos(sw) {
  const bloco = (sw.match(/var ARQUIVOS = \[([\s\S]*?)\];/) || [])[1];
  if (!bloco) throw new Error('não achei a lista ARQUIVOS no sw.js');
  const entradas = [];
  bloco.split('\n').forEach(function (linha) {
    const m = linha.match(/^\s*'(\.\/)?([^']*)'\s*,?\s*$/);
    if (m) entradas.push(m[2] || './');
  });
  return entradas;
}

function copiarParaPasta(rel) {
  const de = path.join(RAIZ, rel);
  const para = path.join(PASTA, rel);
  fs.mkdirSync(path.dirname(para), { recursive: true });
  fs.copyFileSync(de, para);
}

function etagDe(conteudo) {
  return '"' + crypto.createHash('md5').update(conteudo).digest('hex').slice(0, 16) + '"';
}

/* ---------- o servidor, com os cabeçalhos do GitHub Pages ----------
 *
 * ETag e max-age=600, iguais aos do testa_atualizacao_real.js, porque é assim
 * que o tablet recebe o aplicativo de verdade. `redeCortada` é o sinal caindo:
 * a partir dali toda conexão que chegar é derrubada sem resposta, que é o que
 * a antena faz na casa da família. */
let redeCortada = false;
let pedidosNoCorte = 0;
const quatrocentos = [];
const conexoes = new Set();
const servidor = http.createServer((req, res) => {
  if (redeCortada) { pedidosNoCorte++; req.socket.destroy(); return; }
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';
  const arquivo = path.join(PASTA, rel);
  if (!arquivo.startsWith(PASTA) || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
    quatrocentos.push(rel);
    res.writeHead(404); res.end('nao encontrado'); return;
  }
  const conteudo = fs.readFileSync(arquivo);
  const etag = etagDe(conteudo);
  if (req.headers['if-none-match'] === etag) { res.writeHead(304); res.end(); return; }
  res.writeHead(200, {
    'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream',
    'Cache-Control': 'max-age=600',
    'ETag': etag
  });
  res.end(conteudo);
});
servidor.on('connection', s => { conexoes.add(s); s.on('close', () => conexoes.delete(s)); });
servidor.on('error', e => {
  console.error('FALHA o servidor da simulação não subiu em 127.0.0.1:' + PORTA + ': ' + e.message);
  limparPasta();
  console.log('\n' + passes + ' passaram, ' + (falhas + 1) + ' falharam.');
  process.exit(1);
});

function portaOcupada() {
  return new Promise(resolve => {
    const req = http.get({ host: '127.0.0.1', port: PORTA, path: '/', timeout: 1500 }, res => { res.resume(); resolve(true); });
    // alguém aceitou a conexão e não respondeu: ocupada do mesmo jeito
    req.on('timeout', () => { req.destroy(); resolve(true); });
    req.on('error', () => resolve(false));
  });
}
function pegar(caminho) {
  return new Promise((resolve, reject) => {
    http.get(ORIGEM + caminho, res => {
      res.resume();
      res.on('end', () => resolve({ status: res.statusCode, etag: res.headers.etag }));
    }).on('error', reject);
  });
}

function limparPasta() {
  try { fs.rmSync(PASTA, { recursive: true, force: true }); } catch (e) { /* já não existe */ }
}
/* Este handler cobre process.exit e exceção não tratada. NÃO cobre o processo
 * derrubado por fora: no Windows, kill vira TerminateProcess e o 'exit' não
 * roda. Medido com SIGKILL e SIGTERM: a pasta sobrava com 38 arquivos, entre
 * eles o app.js com o nome do aluno de exemplo, e a trava de privacidade do
 * portão acusava um arquivo que ninguém escreveu.
 *
 * Quem cobre o kill são duas outras coisas: o limparPasta() no começo da
 * rodada seguinte (a sobra some antes de qualquer asserção), e a linha do
 * .gitignore para _teste/sim_biblioteca/, que tira a sobra do alcance de
 * `git ls-files -mo`, que é o que a trava de privacidade lê. */
process.on('exit', limparPasta);

let nav = null;
async function encerrar() {
  if (nav) { try { await nav.close(); } catch (e) { /* já fechou */ } nav = null; }
  conexoes.forEach(s => s.destroy());
  await new Promise(r => servidor.close(() => r()));
  limparPasta();
}

/* ---------- leituras de dentro da página ---------- */
const estadoSW = pag => pag.evaluate(() => navigator.serviceWorker.getRegistration().then(reg => ({
  active: reg && reg.active ? reg.active.scriptURL : null,
  installing: !!(reg && reg.installing),
  waiting: !!(reg && reg.waiting),
  controller: navigator.serviceWorker.controller ? navigator.serviceWorker.controller.scriptURL : null,
  tipoNav: (performance.getEntriesByType('navigation')[0] || {}).type || '?'
})));
const versao = pag => pag.$eval('#versao-app', e => e.textContent).catch(() => '?');
const temNoBaixados = (pag, url) => pag.evaluate((nome, u) =>
  caches.open(nome).then(c => c.match(u)).then(r => !!r), BAIXADOS, url);
const fetchDaPagina = (pag, rel) => pag.evaluate(r => fetch(r).then(resp => {
  if (!resp.ok) return { ok: false, status: resp.status, serie: null };
  return resp.json().then(d => ({ ok: true, status: resp.status, serie: d.serie || null }),
    () => ({ ok: true, status: resp.status, serie: 'não é json' }));
}).catch(e => ({ ok: false, status: 'erro: ' + e.message, serie: null })), rel);
const lerAviso = pag => pag.evaluate(() => ({
  aberto: document.querySelector('#aviso').classList.contains('aberto'),
  texto: document.querySelector('#aviso-texto').textContent
}));
const lerPagina = pag => pag.evaluate(() => ({
  velha: !!window.__paginaVelha,
  versao: document.querySelector('#versao-app').textContent
}));

async function clicarTexto(pag, seletor, texto) {
  const achou = await pag.evaluate((sel, txt) => {
    const els = Array.from(document.querySelectorAll(sel));
    const el = els.find(e => e.textContent.trim() === txt) || els.find(e => e.textContent.trim().indexOf(txt) >= 0);
    if (!el) return false;
    el.scrollIntoView({ block: 'center' });
    el.click();
    return true;
  }, seletor, texto);
  if (!achou) throw new Error('não achei "' + texto + '" em ' + seletor);
}

/* O MESMO CAMINHO DE TELA que ela usa, tirado do testa_temas.js: a aula do dia
 * 10 de junho do exemplo, o botão "Material de aula", a lista abre no 6º ano
 * quando o aluno ainda não tem ano escolar guardado, e "Escolher" chama
 * abrirMontagem (app.js:8316), que chama carregarSerie (app.js:7558), que é o
 * fetch('banco/serie-' + serie + '.json') deste teste. Devolve o que a tela
 * mostrou: a montagem com exercícios, a faixa "Não consegui abrir este tema",
 * ou o ponto em que o caminho parou. */
async function abrirMontagemDaSerie(pag) {
  await pag.evaluate(async () => {
    let guarda = 0;
    while (document.querySelector('#rotulo-mes').textContent !== 'Junho de 2026' && guarda++ < 40) {
      document.querySelector('#mes-anterior').click();
      await new Promise(r => setTimeout(r, 40));
    }
  });
  const junho = await esperar('junho de 2026 na agenda',
    () => pag.$eval('#rotulo-mes', e => e.textContent), v => v === 'Junho de 2026', 15000);
  if (!junho.ok) return { resultado: 'não cheguei em junho de 2026', exercicios: 0, serie: '?' };

  const pilula = await esperar('a aula do dia 10 na agenda',
    () => pag.evaluate(() => !!document.querySelector('[data-dia="2026-06-10"] .pilula')), v => v === true, 15000);
  if (!pilula.ok) return { resultado: 'sem aula no dia 10', exercicios: 0, serie: '?' };
  await pag.evaluate(() => document.querySelector('[data-dia="2026-06-10"] .pilula').click());

  const botao = await esperar('o botão Material de aula',
    () => pag.evaluate(() => Array.from(document.querySelectorAll('#linha-folha button'))
      .some(b => b.textContent.trim() === 'Material de aula')), v => v === true, 15000);
  if (!botao.ok) return { resultado: 'sem botão Material de aula', exercicios: 0, serie: '?' };
  await clicarTexto(pag, '#linha-folha button', 'Material de aula');

  const contaTemas = () => pag.evaluate(() => document.querySelectorAll('#lista-temas .item-tema').length);
  const lista = await esperar('a lista de temas', contaTemas, n => n > 0, 30000);
  if (!lista.ok) return { resultado: 'a lista de temas não abriu', exercicios: 0, serie: '?' };

  let serie = await pag.$eval('#corpo-modal-tema select', e => e.value);
  if (serie !== SERIE) {
    // o aluno do exemplo já teria ano guardado: escolhe o 6º ano na mão, como ela faria
    await pag.evaluate(s => {
      const sel = document.querySelector('#corpo-modal-tema select');
      sel.value = s;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }, SERIE);
    await esperar('a lista do 6º ano', contaTemas, n => n > 0, 15000);
    serie = await pag.$eval('#corpo-modal-tema select', e => e.value);
  }

  await clicarTexto(pag, '#lista-temas .item-tema button', 'Escolher');
  const fim = await esperar('a montagem do tema, ou a faixa', () => pag.evaluate(() => {
    const corpo = document.querySelector('#corpo-modal-tema');
    const ex = corpo.querySelectorAll('.item-exercicio').length;
    if (ex > 0) return { resultado: 'montagem', exercicios: ex };
    const faixa = corpo.querySelector('.faixa-aviso');
    if (faixa && /Não consegui abrir este tema/.test(faixa.textContent)) return { resultado: 'faixa', exercicios: 0 };
    return null;
  }), v => !!v, 30000);
  const r = fim.valor || { resultado: 'nem montagem nem faixa', exercicios: 0 };
  r.serie = serie;
  return r;
}

/* A versão nova publicada na pasta servida. Muda os bytes de verdade e confere
 * que mudou: uma publicação que não troca nada faria o resto do teste passar
 * sem atualização nenhuma. */
function publicarVersaoNova() {
  const caminhoApp = path.join(PASTA, 'app.js');
  const caminhoSw = path.join(PASTA, 'sw.js');
  const appAntes = fs.readFileSync(caminhoApp, 'utf8');
  let app = appAntes.replace("var VERSAO = '" + VERSAO_REPO + "'", "var VERSAO = '" + VERSAO_NOVA + "'");
  conf('o app.js publicado mudou de versão de verdade', app !== appAntes, true);
  if (ENVENENADO) {
    const antes = app;
    app = app.split("'banco/serie-'").join("'banco/matematica/serie-'");
    conf("envenenado: o app.js publicado passou a pedir 'banco/matematica/serie-'", app !== antes, true);
  }
  fs.writeFileSync(caminhoApp, app);
  const swAntes = fs.readFileSync(caminhoSw, 'utf8');
  let sw = swAntes.replace("var CACHE = '" + CACHE_ATUAL + "'", "var CACHE = '" + CACHE_NOVO + "'");
  conf('o sw.js publicado mudou de cache de verdade (' + CACHE_ATUAL + ' para ' + CACHE_NOVO + ')', sw !== swAntes, true);
  if (VENENO_ACTIVATE) {
    /* O activate poupa o BAIXADOS por uma condição só (sw.js:148). Tirar essa
     * condição faz resgatarEApagar rodar sobre o próprio BAIXADOS: copia as
     * chaves para dentro dele mesmo e depois o apaga. É exatamente o que
     * aconteceu uma vez de verdade. */
    const antes = sw;
    sw = sw.split('n !== CACHE && n !== BAIXADOS').join('n !== CACHE');
    conf('envenenado-activate: o sw.js publicado deixou de poupar o BAIXADOS no activate', sw !== antes, true);
  }
  fs.writeFileSync(caminhoSw, sw);
}

(async () => {
  console.log(ENVENENADO
    ? 'MODO ENVENENADO: a versão nova troca o caminho das séries; o teste tem que enxergar a perda.'
    : (VENENO_ACTIVATE
      ? 'MODO ENVENENADO (activate): a versão nova apaga o BAIXADOS ao ativar; o teste tem que enxergar a perda.'
      : 'MODO NORMAL: a biblioteca baixada tem que sobreviver à atualização sem sinal.'));
  console.log('repositório na versão ' + VERSAO_REPO + ', cache ' + CACHE_ATUAL + ', baixados em ' + BAIXADOS);

  // ================================================================
  secao('0. A árvore de hoje, servida como o GitHub Pages serve');
  const lista = lerListaArquivos(SW_REPO);
  conf('a lista ARQUIVOS foi lida do sw.js', lista.length > 0, true);
  // a raiz './' é servida como index.html pelo servidor, não é arquivo para copiar
  const arquivos = lista.filter(rel => rel !== './');
  /* O sw.js não está em ARQUIVOS (quem guarda o script do service worker é o
   * próprio navegador), mas o servidor precisa dele; as duas séries são o que
   * o cenário baixa e o controle do corte de rede. */
  const extras = ['sw.js', CAMINHO_SERIE, CAMINHO_CONTROLE];
  const faltando = arquivos.concat(extras).filter(rel => !fs.existsSync(path.join(RAIZ, rel)));
  conf('todos os arquivos da lista existem no repositório', faltando.length ? faltando.join(', ') : 'nenhum falta', 'nenhum falta');
  if (faltando.length) throw Object.assign(new Error('faltam arquivos para servir'), { jaContado: true });
  limparPasta();
  fs.mkdirSync(PASTA, { recursive: true });
  arquivos.concat(extras).forEach(copiarParaPasta);
  console.log('   ' + lista.length + ' entradas em ARQUIVOS, ' + arquivos.length + ' arquivos copiados, mais ' + extras.join(', '));

  if (await portaOcupada()) {
    conf('a porta 127.0.0.1:' + PORTA + ' está livre antes de subir o servidor', 'ocupada', 'livre');
    throw Object.assign(new Error('porta ' + PORTA + ' ocupada por outro processo'), { jaContado: true });
  }
  await new Promise(r => servidor.listen(PORTA, '127.0.0.1', r));
  // quem responde tem que ser ESTE servidor, com a cópia desta pasta
  const eco = await pegar('/sw.js');
  conf('quem responde em 127.0.0.1:' + PORTA + ' é este servidor, servindo a cópia',
    eco.status + ' ' + eco.etag, '200 ' + etagDe(fs.readFileSync(path.join(PASTA, 'sw.js'))));

  nav = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1280, height: 1000, hasTouch: true }
  });
  const pag = await nav.newPage();
  pag.setDefaultTimeout(60000);
  const errosDePagina = [];
  pag.on('pageerror', e => errosDePagina.push(e.message));
  pag.on('dialog', async d => { try { await d.accept(); } catch (e) { /* ok */ } });

  // ================================================================
  secao('1. O install do service worker de hoje completa (o buraco dos testes antigos)');
  await pag.goto(URL_APP, { waitUntil: 'networkidle0' });
  const instalou = await esperar('registration.active com o script servido',
    () => estadoSW(pag), s => !!s && s.active === URL_SW, 60000);
  if (!instalou.ok) {
    conf('o install do service worker atual completou (registration.active com o script servido)',
      'o install do service worker falhou', 'completou');
    console.log(quatrocentos.length
      ? '   o servidor respondeu 404 para: ' + quatrocentos.join(', ')
      : '   o servidor não respondeu 404 nenhum; o install não terminou em 60 s');
    throw Object.assign(new Error('o install do service worker atual não completou'), { jaContado: true });
  }
  conf('o install do service worker atual completou (registration.active com o script servido)', instalou.valor.active, URL_SW);
  conf('o install não pediu arquivo que o servidor não tem', quatrocentos.length ? quatrocentos.join(', ') : 'nenhum 404', 'nenhum 404');

  /* Na primeira visita o activate chama clients.claim(), o app recebe
   * controllerchange e recarrega (app.js:885-889). Espera a página que nasceu
   * desse recarregamento, já controlada, para não agir numa página que está
   * prestes a sumir. */
  const controlada = await esperar('a página controlada, depois do recarregamento da primeira visita',
    () => estadoSW(pag), s => !!s && s.controller === URL_SW && s.tipoNav === 'reload', 30000);
  conf('o service worker controla a página', controlada.valor ? controlada.valor.controller : null, URL_SW);
  conf('a versão na tela é a VERSAO do app.js do repositório', await versao(pag), VERSAO_REPO);
  const chavesDoPacote = await pag.evaluate(n => caches.open(n).then(c => c.keys()).then(k => k.length), CACHE_ATUAL);
  conf('o cache ' + CACHE_ATUAL + ' tem a lista ARQUIVOS inteira', chavesDoPacote, lista.length);

  // ================================================================
  secao('2. Online, ela abre um tema do 6º ano: a série entra no BAIXADOS');
  const online = await abrirMontagemDaSerie(pag);
  conf('a montagem do tema abre com internet (o caminho de tela existe)', online.resultado, 'montagem');
  conf('a lista estava no 6º ano', online.serie, SERIE);
  console.log('   ' + online.exercicios + ' exercícios na montagem');
  /* O put no BAIXADOS acontece depois do respondWith, sem ser esperado
   * (sw.js:178-180), então a chave pode aparecer um instante depois da tela. */
  const guardou = await esperar('a série ' + SERIE + ' no cache ' + BAIXADOS,
    () => temNoBaixados(pag, URL_SERIE), v => v === true, 15000);
  conf('caches.open(BAIXADOS).match(' + URL_SERIE + ') existe', guardou.valor, true);

  // ================================================================
  secao('3. Uma versão nova é publicada' + (ENVENENADO ? ', com o caminho das séries trocado'
    : (VENENO_ACTIVATE ? ', com um activate que apaga o BAIXADOS' : '')));
  publicarVersaoNova();
  /* O mesmo update() do botão "Procurar atualização" (app.js:908) e do relógio
   * de uma hora do app. O Chrome busca o sw.js sem passar pelo cache HTTP,
   * vê bytes diferentes e instala o novo, que fica em waiting porque o antigo
   * ainda controla a página. */
  await pag.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
  const esperando = await esperar('registration.waiting (o service worker novo instalou)',
    () => estadoSW(pag), s => !!s && s.waiting, 90000);
  conf('o service worker novo instalou e está esperando', !!(esperando.valor && esperando.valor.waiting), true);
  conf('a instalação nova não pediu arquivo que o servidor não tem', quatrocentos.length ? quatrocentos.join(', ') : 'nenhum 404', 'nenhum 404');
  const aviso = await esperar('o aviso de versão nova na tela',
    () => lerAviso(pag), a => !!a && a.aberto && /versão nova/.test(a.texto), 5000);
  conf('o aplicativo mostra "Há uma versão nova do aplicativo."', aviso.valor ? aviso.valor.texto : null, 'Há uma versão nova do aplicativo.');
  conf('e a página ainda roda a versão antiga', await versao(pag), VERSAO_REPO);

  // ================================================================
  secao('4. O sinal cai. Só então ela toca em Atualizar');
  /* Os dois cortes juntos: o do navegador (setOfflineMode) e o do servidor,
   * que derruba toda conexão que chegar. O segundo não é excesso de zelo.
   * Medido aqui: com o setOfflineMode ligado, 25 pedidos do service worker
   * bateram no servidor durante o corte (o recarregamento inteiro e mais as
   * séries), porque a emulação de rede do puppeteer vale para a página e não
   * para o worker. Sem o corte no servidor o service worker seguiria online,
   * o cenário "sem sinal" seria mentira e este teste passaria sem provar nada.
   * O contador pedidosNoCorte sai impresso no fim para isso continuar visível. */
  await pag.setOfflineMode(true);
  redeCortada = true;
  conexoes.forEach(s => s.destroy());
  const controle = await fetchDaPagina(pag, CAMINHO_CONTROLE);
  conf('sem sinal, um arquivo nunca baixado volta 503 do próprio service worker (a rede está cortada para ele também)',
    controle.status, 503);

  await pag.evaluate(() => { window.__paginaVelha = true; });
  // a mesma mensagem que aplicarAtualizacao manda quando ela toca em Atualizar (app.js:899)
  const mandou = await pag.evaluate(() => navigator.serviceWorker.getRegistration().then(r => {
    if (!r || !r.waiting) return false;
    r.waiting.postMessage({ tipo: 'ativar-agora' });
    return true;
  }));
  conf('a mensagem ativar-agora foi para o service worker em waiting', mandou, true);
  const recarregou = await esperar('o recarregamento por controllerchange, sem sinal',
    () => lerPagina(pag), p => !!p && !p.velha && p.versao !== '.', 60000);
  conf('a página recarregou sozinha depois do controllerchange', recarregou.ok, true);

  // ================================================================
  secao('5. Sem sinal, na versão nova' + (VENENO ? ' envenenada' : ''));
  conf('a versão na tela é ' + VERSAO_NOVA, recarregou.valor ? recarregou.valor.versao : null, VERSAO_NOVA);
  const nomes = await pag.evaluate(() => caches.keys());
  console.log('   caches no tablet: ' + nomes.join(', '));
  conf('o cache novo ' + CACHE_NOVO + ' existe', nomes.indexOf(CACHE_NOVO) !== -1, true);
  conf('o cache antigo ' + CACHE_ATUAL + ' foi apagado pelo activate', nomes.indexOf(CACHE_ATUAL) === -1, true);
  if (!VENENO_ACTIVATE) {
    conf('o ' + BAIXADOS + ' continua de pé', nomes.indexOf(BAIXADOS) !== -1, true);
    conf('caches.open(BAIXADOS).match(' + URL_SERIE + ') ainda existe', await temNoBaixados(pag, URL_SERIE), true);
  } else {
    /* As duas asserções de cima têm que saber reprovar. É aqui que se prova. */
    conf('envenenado-activate: o ' + BAIXADOS + ' SUMIU no activate (defeito detectado)',
      nomes.indexOf(BAIXADOS) === -1 ? 'sumiu' : 'continua de pé', 'sumiu');
    conf('envenenado-activate: a série ' + SERIE + ' NÃO está mais em cache nenhum (defeito detectado)',
      await temNoBaixados(pag, URL_SERIE), false);
  }

  const pedido = await fetchDaPagina(pag, CAMINHO_QUE_O_APP_PEDE);
  if (!VENENO) {
    conf('fetch(' + CAMINHO_QUE_O_APP_PEDE + ') de dentro da página responde ok, servido do BAIXADOS pelo service worker novo',
      pedido.ok + ' ' + pedido.status, 'true 200');
    conf('e o conteúdo é a série ' + SERIE, pedido.serie, SERIE);
  } else {
    conf('envenenado: fetch(' + CAMINHO_QUE_O_APP_PEDE + ') NÃO responde sem sinal (defeito detectado)',
      pedido.ok ? 'respondeu ' + pedido.status : 'não respondeu (' + pedido.status + ')', 'não respondeu (503)');
  }

  const offline = await abrirMontagemDaSerie(pag);
  console.log('   a tela mostrou: ' + offline.resultado + (offline.exercicios ? ', ' + offline.exercicios + ' exercícios' : ''));
  if (!VENENO) {
    conf('a montagem de um tema do 6º ano abre sem sinal, sem a faixa "Não consegui abrir este tema"', offline.resultado, 'montagem');
    conf('com exercícios de verdade', offline.exercicios > 0, true);
  } else {
    conf('envenenado: a montagem NÃO abre sem sinal (defeito detectado)',
      offline.resultado === 'montagem' ? 'a montagem abriu' : 'não abriu', 'não abriu');
    conf('envenenado: e é a faixa "Não consegui abrir este tema" que aparece', offline.resultado, 'faixa');
  }

  console.log('   pedidos que bateram no servidor durante o corte: ' + pedidosNoCorte);
  if (errosDePagina.length) console.log('   erros de página vistos: ' + errosDePagina.join(' | ').slice(0, 400));

  await encerrar();
  console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
  process.exit(falhas ? 1 : 0);
})().catch(async e => {
  console.error('erro:', e.message);
  if (!e.jaContado) console.error(e.stack);
  try { await encerrar(); } catch (e2) { limparPasta(); }
  console.log('\n' + passes + ' passaram, ' + (falhas + (e.jaContado ? 0 : 1)) + ' falharam.');
  process.exit(1);
});
