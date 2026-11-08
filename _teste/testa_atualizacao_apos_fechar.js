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
/* --corte-sobre-a-main: o tablet está na main de antes do D2 e a instalação
 * do D2 cai no meio do app.js, com o MESMO nome de cache do worker antigo (o
 * pior caso: o install escreve dentro do cache de onde ela abre). O app tem de
 * continuar abrindo sem rede. Com --envenenado-apaga-ativo o install volta à
 * guarda antiga, que só poupava o cache "escolhido" e apagava o ativo da main:
 * aí esta prova TEM de reprovar. */
const corteSobreMain = process.argv.includes('--corte-sobre-a-main');
const apagaAtivo = process.argv.includes('--envenenado-apaga-ativo');
const migracao = process.argv.includes('--migracao') || migracaoPonte || corteSobreMain;
const ponteDir = migracaoPonte && process.env.D2_PONTE_DIR;
/* A versão de antes do D2 sai de um commit FIXO, e não da origin/main: depois
 * do merge a main já é o D2, e a prova passaria a migrar do D2 para o D2 sem
 * avisar ninguém. É a main com o B8b (1.41.8, v75), a última antes do D2. */
const ANTES_DO_D2 = '29839c6deab5e6d8af34380ba9a8243bc31ca5f4';
const daAntiga = arq => execFileSync('git', ['show', ANTES_DO_D2 + ':' + arq], { cwd: raiz, encoding: 'utf8' });
const swAnterior = migracao ? daAntiga('sw.js') : null;
const appAnterior = migracao ? daAntiga('app.js') : null;
const CACHE_DA_MAIN = swAnterior ? swAnterior.match(/var CACHE = '([^']+)'/)[1] : null;
let semRede = false;
/* --lista-encolhe (D2b): a versão 2 tira o extra.js do pré-cache e o
 * index.html dela deixa de carregá-lo. Ela fecha sem tocar no aviso, o worker
 * 2 ativa servindo a versão 1, e a rede some: o extra.js tem de vir do cache da
 * versão 1. Com --envenenado-lista-do-worker o worker 2 volta à regra antiga
 * (só serve do cache o que está na lista DELE), e a prova TEM de reprovar. */
const listaEncolhe = process.argv.includes('--lista-encolhe');
const listaDoWorker = process.argv.includes('--envenenado-lista-do-worker');
/* --troca-atomica (D2b): com a rede segurando 40 s e o processador lento, o
 * "Atualizar agora" troca tudo de uma vez. Cada script servido se marca com a
 * versão; depois da recarga, todos têm de ser da versão nova, nos dois
 * caminhos: worker em espera e worker que já assumiu servindo a de antes. */
const trocaAtomica = process.argv.includes('--troca-atomica');
const temExtra = () => listaEncolhe && publicada === 1;
/* --abre-no-meio-do-install (D2b): o app.js da versão 2 chega devagar, e ela
 * abre o aplicativo no meio do download. A limpeza que roda depois de cada
 * abertura não pode apagar o cache que o install está enchendo. Medido antes
 * da marca 'instalando': a 9.0.2 ficava esperando com o cache sem o app.js, e
 * o aviso saía sem número. */
const abreNoMeio = process.argv.includes('--abre-no-meio-do-install');
// veneno: a limpeza esquece o cache em obra, e a prova TEM de reprovar
const semMarca = process.argv.includes('--envenenado-sem-marca');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const servidor = http.createServer((req, res) => {
  if (semRede) { req.socket.destroy(); return; }
  const nome = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
  if (nome === 'banco/serie-teste.json') {
    const responder = () => { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end('{"serie":"teste"}'); };
    if (!redeLenta) responder();
    else { const atraso = setTimeout(responder, 40000); req.on('close', () => clearTimeout(atraso)); }
    return;
  }
  if (falhaInstalacao && publicada === 2 && nome === 'styles.css') { res.writeHead(503); res.end(); return; }
  if (listaEncolhe && nome === 'extra.js') {
    if (!temExtra()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
    res.end('window.__EXTRA = 1;');
    return;
  }
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
  if (migracao && !ponteDir && publicada === 1 && nome === 'app.js') corpo = Buffer.from(appAnterior);
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
    if (temExtra()) {
      if (codigo.indexOf("  './app.js',") < 0) throw new Error('não achei o app.js na lista do sw.js');
      codigo = codigo.replace("  './app.js',", "  './app.js',\n  './extra.js',");
    }
    if (abreNoMeio && semMarca) {
      const marca = 'candidato && candidato.cache, emObra]';
      if (codigo.indexOf(marca) < 0) throw new Error('veneno não achou a marca do cache em obra');
      codigo = codigo.split(marca).join('candidato && candidato.cache]');
    }
    if (listaEncolhe && listaDoWorker && publicada === 2) {
      const regraNova = 'var daVersao = navegacao || !baixadoDuranteOUso(url.pathname);';
      if (codigo.indexOf(regraNova) < 0) throw new Error('veneno não achou a regra do fetch');
      codigo = codigo.split(regraNova).join('var daVersao = navegacao || doPacote(e.request.url);');
    }
    if (corteSobreMain && apagaAtivo && publicada === 2) {
      const guardaNova = '(jaExistia ? Promise.resolve() : caches.delete(CACHE))';
      if (codigo.indexOf(guardaNova) < 0) throw new Error('veneno não achou a guarda do install');
      codigo = codigo.split(guardaNova).join(
        "lerControle('selecionado').then(function (selecionado) { return selecionado === CACHE ? null : caches.delete(CACHE); })");
    }
    corpo = Buffer.from(corteSobreMain
      ? codigo.replace(/var CACHE = '[^']+'/, "var CACHE = '" + CACHE_DA_MAIN + "'")
      : codigo.replace(/var CACHE = '[^']+'/,
        "var CACHE = '" + (migracao || abreNoMeio ? 'apoio-educacional-v900' : 'apoio-educacional-d2-prova-') + publicada + "'"));
  }
  if (nome === 'app.js') corpo = Buffer.from(corpo.toString().replace(/var VERSAO = '[^']+'/,
    "var VERSAO = '9.0." + publicada + "'"));
  if (temExtra() && nome === 'index.html') {
    const html = corpo.toString();
    if (html.indexOf('<script src="app.js"') < 0) throw new Error('index.html sem o script do app.js');
    corpo = Buffer.from(html.replace('<script src="app.js"', '<script src="extra.js"></script><script src="app.js"'));
  }
  if (trocaAtomica && /\.js$/.test(nome) && nome !== 'sw.js')
    corpo = Buffer.concat([corpo, Buffer.from('\n;(window.__marcas = window.__marcas || []).push(' + JSON.stringify(nome + '@' + publicada) + ');\n')]);
  function responder() {
    res.writeHead(200, { 'Content-Type': tipos[path.extname(arquivo)] || 'application/octet-stream', 'Cache-Control': 'no-store',
      'Content-Length': corpo.length });
    if (abreNoMeio && publicada === 2 && nome === 'app.js') {
      res.write(corpo.subarray(0, Math.floor(corpo.length / 2)));
      setTimeout(() => res.end(corpo.subarray(Math.floor(corpo.length / 2))), 6000);
      return;
    }
    if (corteSobreMain && publicada === 2 && nome === 'app.js') {
      // metade do corpo e a conexão cai: a rede some no meio do download
      res.write(corpo.subarray(0, Math.floor(corpo.length / 2)));
      setTimeout(() => req.socket.destroy(), 150);
      return;
    }
    res.end(corpo);
  }
  if (!redeLenta || (nome === 'sw.js' && !trocaAtomica)) responder();
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
      console.log('1 de 1 verificações passaram, 0 falharam. Série recuperada do cache em ' + tempo + ' ms.');
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
      console.log('1 de 1 verificações passaram, 0 falharam. Ponte reconhece e aplica versão pendente.');
      return;
    }
    if (process.argv.includes('--rede-lenta')) {
      redeLenta = true;
      const inicio = Date.now();
      await Promise.race([
        pagina.goto(url, { waitUntil: 'domcontentloaded' }),
        new Promise((_, rejeitar) => setTimeout(() => rejeitar(new Error('Abertura ultrapassou 1 segundo com rede de 40 segundos')), 1000))
      ]);
      console.log('1 de 1 verificações passaram, 0 falharam. Abertura em ' + (Date.now() - inicio) + ' ms.');
      return;
    }
    await pagina.evaluate(async () => {
      const cache = await caches.open('outro-aplicativo');
      await cache.put('/outro', new Response('preservado'));
      const antigo = await caches.open('apoio-educacional-v9999');
      await antigo.put('/arquivo-baixado-anterior', new Response('resgatado'));
    });
    publicada = 2;
    await pagina.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
    if (listaEncolhe) {
      await pagina.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration()).waiting, { timeout: 30000 });
      if (!(await pagina.evaluate(() => window.__EXTRA === 1))) throw new Error('A versão 1 não carregou o extra.js');
      await pagina.close();
      semRede = true;
      pagina = await navegador.newPage();
      await pagina.goto(url, { waitUntil: 'load' }).catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 2000));
      await pagina.reload({ waitUntil: 'load' }).catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 2500));
      const estado = await pagina.evaluate(async () => ({
        extra: window.__EXTRA === 1,
        versao: document.querySelector('#versao-app')?.textContent,
        ativo: (await navigator.serviceWorker.getRegistration()).active.scriptURL,
        esperando: !!(await navigator.serviceWorker.getRegistration()).waiting
      }));
      console.log('   sem rede, depois de fechar sem tocar: ' + JSON.stringify(estado));
      if (estado.esperando || estado.versao !== '9.0.1') throw new Error('O worker 2 não assumiu servindo a 9.0.1: ' + JSON.stringify(estado));
      if (listaDoWorker) {
        if (estado.extra) throw new Error('O veneno não foi visto: a regra antiga achou o extra.js');
        console.log('   a conferência reprovou a cópia envenenada: a versão aberta perdeu o extra.js sem rede');
        console.log('1 de 1 verificações passaram, 0 falharam. Veneno visto.');
        return;
      }
      if (!estado.extra) throw new Error('Sem rede, a versão aberta perdeu o extra.js que saiu da lista nova');
      console.log('1 de 1 verificações passaram, 0 falharam. A versão aberta achou no cache dela o arquivo que saiu da lista nova.');
      return;
    }
    if (abreNoMeio) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!(await pagina.evaluate(async () => !!(await navigator.serviceWorker.getRegistration()).installing)))
        throw new Error('O install da 9.0.2 não estava em andamento na hora da abertura');
      await pagina.close();
      pagina = await navegador.newPage();
      await pagina.goto(url, { waitUntil: 'domcontentloaded' });
      await pagina.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration()).waiting, { timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 2500));
      const obra = await pagina.evaluate(async () => {
        const nomes = await caches.keys();
        const nome = nomes.find(n => /v9002$/.test(n));
        const app = nome && await (await caches.open(nome)).match('./app.js');
        return { nomes, app: app ? ((await app.text()).match(/var VERSAO = '([^']+)'/) || [])[1] : null };
      });
      console.log('   depois de abrir no meio do install: ' + JSON.stringify(obra));
      if (semMarca) {
        if (obra.app === '9.0.2') throw new Error('O veneno não foi visto: sem a marca, o cache em obra sobreviveu');
        console.log('   a conferência reprovou a cópia envenenada: o cache em obra foi apagado no meio do install');
        console.log('1 de 1 verificações passaram, 0 falharam. Veneno visto.');
        return;
      }
      if (obra.app !== '9.0.2') throw new Error('A abertura no meio do install estragou o cache da versão nova');
      const aviso = await pagina.waitForFunction(() => (document.querySelector('#aviso-texto')?.textContent || '').includes('Versão nova pronta (9.0.2)'),
        { timeout: 15000 }).then(() => true, () => false);
      if (!aviso) throw new Error('O aviso da 9.0.2 não apareceu com o número');
      console.log('1 de 1 verificações passaram, 0 falharam. Abrir no meio do install não apaga o cache em obra.');
      return;
    }
    if (trocaAtomica) {
      const ESPERADOS = (fs.readFileSync(path.join(raiz, 'index.html'), 'utf8').match(/<script src="[^"]+\.js"/g) || []).length;
      const conferir = async (versao, rotulo) => {
        const marcas = await pagina.evaluate(() => window.__marcas || []);
        const fora = marcas.filter(m => !m.endsWith('@' + versao));
        console.log('   ' + rotulo + ': ' + marcas.length + ' scripts, fora da versão ' + versao + ': ' + (fora.join(', ') || 'nenhum'));
        if (marcas.length !== ESPERADOS || fora.length) throw new Error(rotulo + ': troca misturou versões ou faltou script');
      };
      const tocarAtualizar = async alvo => {
        await pagina.waitForFunction(t => document.querySelector('#aviso')?.classList.contains('aberto') &&
          (document.querySelector('#aviso-texto')?.textContent || '').includes(t) &&
          document.querySelector('#aviso-acao').getBoundingClientRect().bottom <= innerHeight, { timeout: 30000 }, 'Versão nova pronta (' + alvo + ')');
        await new Promise(resolve => setTimeout(resolve, 300));
        const cdp = await pagina.target().createCDPSession();
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
        redeLenta = true;
        const t0 = Date.now();
        await pagina.click('#aviso-acao');
        await pagina.waitForFunction(v => document.querySelector('#versao-app')?.textContent === v, { timeout: 30000 }, alvo);
        await new Promise(resolve => setTimeout(resolve, 1500));
        redeLenta = false;
        return Date.now() - t0;
      };
      await pagina.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration()).waiting, { timeout: 30000 });
      const ms1 = await tocarAtualizar('9.0.2');
      console.log('   worker em espera: troca em ' + ms1 + ' ms com a rede segurando 40 s');
      await conferir(2, 'worker em espera');
      publicada = 3;
      await pagina.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
      await pagina.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration()).waiting, { timeout: 30000 });
      await pagina.close();
      pagina = await navegador.newPage();
      pagina.on('dialog', d => d.dismiss().catch(() => {}));
      await pagina.goto(url, { waitUntil: 'domcontentloaded' });
      await pagina.waitForFunction(() => document.querySelector('#versao-app')?.textContent === '9.0.2', { timeout: 15000 });
      if (await pagina.evaluate(async () => !!(await navigator.serviceWorker.getRegistration()).waiting))
        throw new Error('O worker 3 não assumiu ao fechar');
      const ms2 = await tocarAtualizar('9.0.3');
      console.log('   worker que já assumiu: troca em ' + ms2 + ' ms com a rede segurando 40 s');
      await conferir(3, 'worker que já assumiu');
      console.log('2 de 2 verificações passaram, 0 falharam. A troca foi inteira nos dois caminhos, sem esperar a rede.');
      return;
    }
    if (corteSobreMain) {
      await pagina.waitForFunction(async () => !(await navigator.serviceWorker.getRegistration()).installing, { timeout: 30000 });
      const depoisDoCorte = await pagina.evaluate(async nome => ({
        esperando: !!(await navigator.serviceWorker.getRegistration()).waiting,
        ativo: await caches.has(nome),
        app: !!(await (await caches.open(nome)).match('./app.js'))
      }), CACHE_DA_MAIN);
      console.log('   depois do corte: ' + JSON.stringify(depoisDoCorte));
      if (depoisDoCorte.esperando) throw new Error('Instalação cortada ficou esperando');
      const apagou = !depoisDoCorte.ativo || !depoisDoCorte.app;
      /* No portão, o veneno passa quando a trava o vê: a cópia que apaga o
       * cache ativo reprova a conferência abaixo, e esse é o resultado certo. */
      if (apagaAtivo) {
        if (!apagou) throw new Error('O veneno não foi visto: a guarda antiga deixou o cache ativo de pé');
        console.log('   a conferência reprovou a cópia envenenada: o corte apagou o cache ativo da main (' + CACHE_DA_MAIN + ')');
        console.log('1 de 1 verificações passaram, 0 falharam. Veneno visto.');
        return;
      }
      if (apagou) throw new Error('O corte apagou o cache ativo da main (' + CACHE_DA_MAIN + ')');
      semRede = true;
      await pagina.close();
      pagina = await navegador.newPage();
      await pagina.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => {});
      const aberta = await pagina.waitForFunction(() => document.querySelector('#versao-app')?.textContent.includes('9.0.1'),
        { timeout: 10000 }).then(() => true, () => false);
      if (!aberta) throw new Error('Sem rede, o aplicativo não abriu depois do corte');
      console.log('1 de 1 verificações passaram, 0 falharam. Corte no meio do install sobre a main: abre sem rede na versão de antes.');
      return;
    }
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
      console.log('1 de 1 verificações passaram, 0 falharam. Instalação incompleta preservou a versão anterior.');
      return;
    }
    await pagina.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration()).waiting, { timeout: 30000 });
    if (migracao && !migracaoPonte) {
      /* A travessia da main para o D2. O worker da main vai à rede primeiro e
       * não segura nada: uma janela nova já abriria a 9.0.2, e isso não tem
       * conserto do lado de cá. O que o D2 garante é não deixar o tablet preso:
       * o aplicativo da main não conhece o 'estado-versao', então, ativado o
       * worker novo ao fechar, a escolha vai para a versão nova (regra antiga,
       * uma última vez). Mantê-lo na versão da main o deixaria sem aviso. */
      await pagina.close();
      pagina = await navegador.newPage();
      await pagina.goto(url, { waitUntil: 'domcontentloaded' });
      await pagina.waitForFunction(() => document.querySelector('#versao-app')?.textContent.includes('9.0.2'), { timeout: 15000 });
      const nomesMigracao = await pagina.evaluate(() => caches.keys());
      if (!nomesMigracao.includes('apoio-educacional-controle')) throw new Error('A travessia não gravou a escolha');
      console.log('1 de 1 verificações passaram, 0 falharam. Travessia da main sem toque não ficou presa na versão antiga.');
      return;
    }
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
      console.log('1 de 1 verificações passaram, 0 falharam. A outra janela preservou dados pendentes e arquivos anteriores.');
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
    if (antigos.nomes.includes('apoio-educacional-v9999') || antigos.resgate !== 'resgatado')
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
