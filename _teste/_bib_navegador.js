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
 */
'use strict';
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const RAIZ = path.join(__dirname, '..');
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
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

/* trocas: { '/caminho.js': textoServido } substitui só esses arquivos. */
function criarAmbiente(porta, nomePerfil, trocas) {
  trocas = trocas || {};
  const ORIGEM = 'http://127.0.0.1:' + porta;
  const PERFIL = path.join(os.tmpdir(), nomePerfil + '_' + process.pid + '_' + Date.now());
  const conexoes = new Set();
  const quatrocentos = [];
  const extras = {};   // rotas só do teste (página vazia etc.)
  const servidor = http.createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel === '/') rel = '/index.html';
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
  const amb = {
    ORIGEM, PERFIL, quatrocentos, extras,
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
      return nav;
    },
    async pagina() {
      const pag = await nav.newPage();
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

/* Abre o aplicativo, espera as abas e tira a janela de novidades do caminho. */
async function abrirApp(pag, origem) {
  await pag.goto(origem + '/index.html', { waitUntil: 'networkidle0' });
  const pronto = await esperar('o aplicativo abriu', () => pag.evaluate(() =>
    !!document.querySelector('#abas .aba') && typeof Store === 'object' && !!document.querySelector('#versao-app') &&
    document.querySelector('#versao-app').textContent.length > 1), v => v === true, 40000);
  if (!pronto.ok) throw Object.assign(new Error('o aplicativo não abriu'), { jaContado: false });
  await pausa(1200);
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

module.exports = { RAIZ, conf, secao, pausa, esperar, criarAmbiente, abrirApp, irParaAba, contarDeposito, placar, fim };
