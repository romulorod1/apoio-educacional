/* sw.js
 * Guarda o aplicativo no próprio tablet para ele abrir sem internet.
 * Os dados das aulas não passam por aqui: ficam no IndexedDB, no aparelho.
 */

/* O nome do cache muda toda vez que a lista de ARQUIVOS muda, e nao e etiqueta:
 * o install abre caches.open(CACHE) e da put() em cada arquivo, entao com o nome
 * repetido ele escreve dentro do MESMO cache de onde a versao ativa esta
 * servindo, e o arquivo novo entra antes de ela mandar atualizar. Pior, o
 * .catch() por arquivo deixa a instalacao dar certo quando a conexao cai no
 * meio: o cache vivo fica rasgado, parte novo e parte velho, justamente para
 * quem da aula na casa das familias sem sinal. Com nome novo o cache anterior
 * fica inteiro ate o activate. Foi assim de v1 a v11, um por mudanca; este v12
 * e a entrada de './figuras/solidos.js' na lista abaixo. */
var CACHE = 'apoio-educacional-v12';

var ARQUIVOS = [
  './',
  './index.html',
  './styles.css',
  './core.js',
  './busca.js',
  './pdf.js',
  /* Os CINCO arquivos do kit de figuras. Faltando um, a figura sai sem marca
   * nenhuma e sem erro, e ela da aula na casa das familias, muitas vezes sem
   * sinal: o que nao estiver aqui nao existe quando falta rede. */
  './figuras/base.js',
  './figuras/desenho.js',
  './figuras/marcas.js',
  './figuras/receitas.js',
  './figuras/formula.js',
  './figuras/solidos.js',
  './store.js',
  './draw.js',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/favicon.png',
  // o indice dos temas entra no pacote inicial para a lista abrir sem internet.
  // o conteudo de cada serie e guardado sozinho, na primeira vez que for usado.
  './banco/indice.json',
  // o indice de busca acompanha o de temas: e ele que faz o campo de assunto
  // achar por conteudo, e nao so por titulo.
  './banco/busca.json'
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
