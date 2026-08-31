/* sw.js
 * Guarda o aplicativo no próprio tablet para ele abrir sem internet.
 * Os dados das aulas não passam por aqui: ficam no IndexedDB, no aparelho.
 */

var CACHE = 'apoio-educacional-v5';

var ARQUIVOS = [
  './',
  './index.html',
  './styles.css',
  './core.js',
  './pdf.js',
  './store.js',
  './draw.js',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/favicon.png'
];

/* Não assume o controle sozinho: fica esperando. Quem manda trocar de versão
 * é ela, pelo aviso que aparece no aplicativo. Assim uma atualização nunca
 * recarrega a tela no meio de uma aula. */
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(ARQUIVOS.map(function (u) {
      return fetch(new Request(u, { cache: 'reload' })).then(function (r) {
        if (r && r.ok) return c.put(u, r);
      }).catch(function () { /* um arquivo a menos não impede a instalação */ });
    }));
  }));
});

self.addEventListener('message', function (e) {
  if (e.data && e.data.tipo === 'ativar-agora') self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (nomes) {
      return Promise.all(nomes.map(function (n) {
        if (n !== CACHE) return caches.delete(n);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Busca na rede primeiro para pegar atualizações, e cai no cache quando
 * não há sinal. É o comportamento certo para quem dá aula na casa das famílias. */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  /* Pergunta ao servidor se o arquivo mudou, em vez de aceitar o que estiver
   * guardado no cache do navegador. O GitHub Pages manda guardar por dez
   * minutos, e sem isso uma versão nova podia demorar a chegar no tablet.
   * A resposta continua barata: quando nada mudou o servidor devolve
   * apenas "sem alteração". */
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(function (resposta) {
      if (resposta && resposta.status === 200 && resposta.type === 'basic') {
        var copia = resposta.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copia); });
      }
      return resposta;
    }).catch(function () {
      return caches.match(e.request).then(function (achado) {
        if (achado) return achado;
        if (e.request.mode === 'navigate') return caches.match('./index.html');
        return new Response('Sem conexão.', { status: 503, statusText: 'Sem conexão' });
      });
    })
  );
});
