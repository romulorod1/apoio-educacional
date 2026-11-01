/* D2: uma versão em espera não pode entrar só porque a aula foi fechada. */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer-core');
const { execFileSync } = require('child_process');

const raiz = path.resolve(__dirname, '..');
const porta = 8891;
let publicada = 1;
let redeLenta = false;
const ponte = process.argv.includes('--ponte');
const falhaInstalacao = process.argv.includes('--falha-instalacao');
const migracaoPonte = process.argv.includes('--migracao-ponte');
const migracao = process.argv.includes('--migracao') || migracaoPonte;
const ponteDir = migracaoPonte && process.env.D2_PONTE_DIR;
const swAnterior = migracao ? execFileSync('git', ['show', 'origin/main:sw.js'], { cwd: raiz, encoding: 'utf8' }) : null;
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const servidor = http.createServer((req, res) => {
  const nome = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
  if (nome === 'banco/serie-teste.json') {
    const responder = () => { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end('{"serie":"teste"}'); };
    if (!redeLenta) responder();
    else { const atraso = setTimeout(responder, 40000); req.on('close', () => clearTimeout(atraso)); }
    return;
  }
  if (falhaInstalacao && publicada === 2 && nome === 'styles.css') { res.writeHead(503); res.end(); return; }
  if (ponte && nome === '__ativar') { publicada = 2; res.writeHead(200); res.end('ok'); return; }
  if (ponte && nome === 'sw.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
    res.end(`let pendente = true;
      self.addEventListener('install', e => e.waitUntil(self.skipWaiting()));
      self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
      self.addEventListener('message', e => {
        if (!e.ports[0]) return;
        if (e.data.tipo === 'estado-versao') e.ports[0].postMessage({pendente, versao:'9.0.2'});
        if (e.data.tipo === 'ativar-agora') e.waitUntil(fetch('./__ativar').then(() => {
          pendente = false; e.ports[0].postMessage({ativada:true});
        }));
      });`);
    return;
  }
  const arquivo = path.resolve(raiz, nome);
  if (!arquivo.startsWith(raiz + path.sep) || !fs.existsSync(arquivo) || !fs.statSync(arquivo).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  let corpo = ponteDir && publicada === 1 && (nome === 'app.js' || nome === 'sw.js')
    ? fs.readFileSync(path.join(ponteDir, nome)) : fs.readFileSync(arquivo);
  if (nome === 'sw.js') {
    let codigo = migracao && publicada === 1 && !ponteDir ? swAnterior : corpo.toString();
    if (migracaoPonte && publicada === 1 && !ponteDir) codigo = codigo.replace('  var url = new URL(e.request.url);', `
      if (doPacote(e.request.url) || e.request.mode === 'navigate') {
        e.respondWith(caches.open(CACHE).then(c => c.match(e.request).then(r =>
          r || (e.request.mode === 'navigate' ? c.match('./index.html') : null)))
          .then(r => r || new Response('Indisponível', {status:503})));
        return;
      }
      var url = new URL(e.request.url);`);
    corpo = Buffer.from(codigo.replace(/var CACHE = '[^']+'/,
      "var CACHE = '" + (migracao ? 'apoio-educacional-v900' : 'apoio-educacional-d2-prova-') + publicada + "'"));
  }
  if (nome === 'app.js') corpo = Buffer.from(corpo.toString().replace(/var VERSAO = '[^']+'/,
    "var VERSAO = '9.0." + publicada + "'"));
  function responder() {
    res.writeHead(200, { 'Content-Type': tipos[path.extname(arquivo)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(corpo);
  }
  if (!redeLenta || nome === 'sw.js') responder();
  else {
    const atraso = setTimeout(responder, 40000);
    req.on('close', () => clearTimeout(atraso));
  }
});

(async () => {
  let navegador;
  try {
    await new Promise(resolve => servidor.listen(porta, '127.0.0.1', resolve));
    navegador = await puppeteer.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      headless: 'new', args: ['--no-sandbox'], defaultViewport: { width: 1280, height: 1000, hasTouch: true } });
    let pagina = await navegador.newPage();
    pagina.on('dialog', d => d.dismiss().catch(() => {}));
    const url = 'http://127.0.0.1:' + porta + '/index.html';
    await pagina.goto(url, { waitUntil: 'domcontentloaded' });
    const prazo = Date.now() + 30000;
    let instalada = false;
    while (!instalada && Date.now() < prazo) {
      instalada = await pagina.evaluate(() => !!navigator.serviceWorker.controller &&
        !!document.querySelector('#versao-app')?.textContent.includes('9.0.1')).catch(() => false);
      if (!instalada) await new Promise(resolve => setTimeout(resolve, 200));
    }
    if (!instalada) throw new Error('Versão inicial não ficou pronta');
    if (process.argv.includes('--serie-lenta')) {
      await pagina.evaluate(() => fetch('./banco/serie-teste.json').then(r => r.json()));
      redeLenta = true;
      const inicio = Date.now();
      const resposta = await pagina.evaluate(() => fetch('./banco/serie-teste.json').then(r => r.json()));
      const tempo = Date.now() - inicio;
      if (resposta.serie !== 'teste' || tempo > 4000) throw new Error('Série não voltou ao cache no prazo: ' + tempo + ' ms');
      console.log('1 passou, 0 falharam. Série recuperada do cache em ' + tempo + ' ms.');
      return;
    }
    if (ponte) {
      await pagina.waitForFunction(() => document.querySelector('#aviso-texto')?.textContent.includes('9.0.2') &&
        document.querySelector('#aviso-acao')?.textContent === 'Atualizar agora', { timeout: 5000 });
      await pagina.click('#aviso-acao');
      await pagina.waitForFunction(() => document.querySelector('#versao-app')?.textContent.includes('9.0.2'), { timeout: 15000 })
        .catch(async e => {
          console.log('   estado após tentativa:', await pagina.evaluate(async () => ({
            versao: document.querySelector('#versao-app')?.textContent,
            aviso: document.querySelector('#aviso-texto')?.textContent,
            esperando: !!(await navigator.serviceWorker.getRegistration()).waiting,
            caches: await caches.keys()
          })).catch(() => null));
          throw e;
        });
      console.log('1 passou, 0 falharam. Ponte reconhece e aplica versão pendente.');
      return;
    }
    if (process.argv.includes('--rede-lenta')) {
      redeLenta = true;
      const inicio = Date.now();
      await Promise.race([
        pagina.goto(url, { waitUntil: 'domcontentloaded' }),
        new Promise((_, rejeitar) => setTimeout(() => rejeitar(new Error('Abertura ultrapassou 1 segundo com rede de 40 segundos')), 1000))
      ]);
      console.log('1 passou, 0 falharam. Abertura em ' + (Date.now() - inicio) + ' ms.');
      return;
    }
    await pagina.evaluate(async () => {
      const cache = await caches.open('outro-aplicativo');
      await cache.put('/outro', new Response('preservado'));
      const antigo = await caches.open('apoio-educacional-v8999');
      await antigo.put('/arquivo-baixado-anterior', new Response('resgatado'));
    });
    publicada = 2;
    await pagina.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
    if (falhaInstalacao) {
      await pagina.waitForFunction(async () => !(await navigator.serviceWorker.getRegistration()).installing, { timeout: 30000 });
      const estado = await pagina.evaluate(async () => ({
        esperando: !!(await navigator.serviceWorker.getRegistration()).waiting,
        caches: await caches.keys()
      }));
      if (estado.esperando || estado.caches.includes('apoio-educacional-d2-prova-2'))
        throw new Error('Instalação incompleta ficou disponível');
      await pagina.reload({ waitUntil: 'domcontentloaded' });
      const versao = await pagina.$eval('#versao-app', e => e.textContent.trim());
      if (versao !== '9.0.1') throw new Error('Instalação incompleta trocou a versão para ' + versao);
      console.log('1 passou, 0 falharam. Instalação incompleta preservou a versão anterior.');
      return;
    }
    await pagina.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration()).waiting, { timeout: 30000 });
    const antes = await pagina.$eval('#versao-app', e => e.textContent.trim());
    const outraJanela = await navegador.newPage();
    outraJanela.on('dialog', d => d.dismiss().catch(() => {}));
    await outraJanela.goto(url, { waitUntil: 'domcontentloaded' });
    await outraJanela.waitForSelector('#versao-app');
    const outraVersao = await outraJanela.$eval('#versao-app', e => e.textContent.trim());
    if (outraVersao !== '9.0.1') throw new Error('Outra janela abriu versão ' + outraVersao + ' sem toque');
    if (process.argv.includes('--duas-janelas')) {
      console.log('   preparando falha de gravação na segunda janela');
      await outraJanela.evaluate(() => {
        window.__semEspaco = true;
        window.__ficou = true;
        window.confirm = () => false;
        const original = IDBObjectStore.prototype.put;
        IDBObjectStore.prototype.put = function () {
          const pedido = original.apply(this, arguments);
          if (window.__semEspaco && this.name === 'dados') this.transaction.abort();
          return pedido;
        };
      });
      await outraJanela.click('#alternar-valores');
      console.log('   aguardando aviso de gravação');
      await outraJanela.waitForFunction(() => {
        const f = document.querySelector('#faixa-gravacao');
        return !!(f && !f.hidden && getComputedStyle(f).display !== 'none');
      }, { timeout: 10000 });
      console.log('   solicitando atualização na primeira janela');
      await pagina.evaluate(() => document.querySelector('#abas .aba[data-tela="ajustes"]').click());
      console.log('   ajustes aberto, aguardando botão');
      await pagina.waitForFunction(() => !!document.querySelector('#estado-versao button'), { timeout: 10000 });
      await pagina.evaluate(() => document.querySelector('#estado-versao button').click());
      console.log('   aguardando primeira janela atualizada');
      const limite = Date.now() + 30000;
      let atualizada = false;
      while (!atualizada && Date.now() < limite) {
        atualizada = await pagina.evaluate(() => !!document.querySelector('#versao-app')?.textContent.includes('9.0.2')).catch(() => false);
        if (!atualizada) await new Promise(resolve => setTimeout(resolve, 200));
      }
      if (!atualizada) throw new Error('Primeira janela não atualizou');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('   conferindo segunda janela');
      const preservada = await outraJanela.evaluate(async () => ({
        ficou: !!window.__ficou,
        versao: document.querySelector('#versao-app').textContent.trim(),
        codigo: await (await fetch('./app.js')).text()
      }));
      if (!preservada.ficou || preservada.versao !== '9.0.1' || !preservada.codigo.includes("var VERSAO = '9.0.1'"))
        throw new Error('Janela com gravação pendente não preservou sua versão e memória');
      console.log('1 passou, 0 falharam. A outra janela preservou dados pendentes e arquivos anteriores.');
      return;
    }
    await outraJanela.close();
    await pagina.close();
    pagina = await navegador.newPage();
    await pagina.goto(url, { waitUntil: 'domcontentloaded' });
    await pagina.waitForSelector('#versao-app');
    const depois = await pagina.$eval('#versao-app', e => e.textContent.trim());
    if (antes !== '9.0.1' || depois !== '9.0.1') throw new Error('Sem toque: antes=' + antes + ', ao reabrir=' + depois);
    await pagina.waitForFunction(() => document.querySelector('#aviso')?.classList.contains('aberto') &&
      document.querySelector('#aviso-texto')?.textContent.includes('9.0.2') &&
      document.querySelector('#aviso-acao')?.textContent === 'Atualizar agora' &&
      document.querySelector('#aviso-acao')?.getBoundingClientRect().width > 0 &&
      document.querySelector('#aviso-acao')?.getBoundingClientRect().height > 0 &&
      document.querySelector('#aviso-acao')?.getBoundingClientRect().top < innerHeight, { timeout: 10000 });
    await pagina.click('#aviso-acao');
    await pagina.waitForFunction(() => document.querySelector('#versao-app')?.textContent.includes('9.0.2'), { timeout: 15000 });
    const outro = await pagina.evaluate(async () => (await (await caches.open('outro-aplicativo')).match('/outro'))?.text());
    if (outro !== 'preservado') throw new Error('Cache de outro aplicativo foi alterado');
    const antigos = await pagina.evaluate(async () => ({
      nomes: await caches.keys(),
      resgate: await (await (await caches.open('apoio-educacional-baixados')).match('/arquivo-baixado-anterior'))?.text()
    }));
    if (antigos.nomes.includes('apoio-educacional-v8999') || antigos.resgate !== 'resgatado')
      throw new Error('Limpeza não resgatou dados antes de apagar cache antigo');
    if (process.argv.includes('--terceira')) {
      publicada = 3;
      await pagina.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
      await pagina.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration()).waiting, { timeout: 30000 });
      await pagina.close();
      pagina = await navegador.newPage();
      await pagina.goto(url, { waitUntil: 'domcontentloaded' });
      await pagina.waitForSelector('#versao-app');
      const anterior = await pagina.$eval('#versao-app', e => e.textContent.trim());
      if (anterior !== '9.0.2') throw new Error('Terceira atualização trocou ou regrediu a versão para ' + anterior);
      await pagina.waitForFunction(() => document.querySelector('#aviso')?.classList.contains('aberto') &&
        document.querySelector('#aviso-texto')?.textContent.includes('9.0.3') &&
        document.querySelector('#aviso-acao')?.getBoundingClientRect().top < innerHeight, { timeout: 10000 });
      await pagina.click('#aviso-acao');
      await pagina.waitForFunction(() => document.querySelector('#versao-app')?.textContent.includes('9.0.3'), { timeout: 15000 });
      console.log('2 passaram, 0 falharam. Terceira versão aguardou o toque sem regredir.');
    }
    console.log('4 passaram, 0 falharam. Atualização autorizada, cache alheio e resgate preservados.');
  } catch (e) {
    console.error('FALHA: ' + e.message);
    process.exitCode = 1;
  } finally {
    if (navegador) await navegador.close();
    servidor.close();
  }
})();
