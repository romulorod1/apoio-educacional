/* sw.js
 * Guarda o aplicativo no próprio tablet para ele abrir sem internet.
 * Os dados das aulas não passam por aqui: ficam no IndexedDB, no aparelho.
 */

/* São dois caches, e é essa divisão que faz a atualização sair barata:
 * CACHE guarda os ARQUIVOS do aplicativo e muda de nome a cada mudança da lista;
 * BAIXADOS guarda o que só entra durante o uso, que hoje são as séries de temas
 * (banco/serie-*.json, uma por vez, na primeira vez que a série é aberta), tem
 * nome fixo, e o activate nunca o apaga.
 *
 * Antes havia um cache só e o activate apagava todo cache cujo nome não fosse o
 * novo. As séries moram ali e não estão em ARQUIVOS de propósito, então o
 * install não as recria: medido no Chrome, as três séries que abriam sem sinal
 * antes de atualizar voltavam 503 depois, e no dia seguinte, na casa da família
 * sem sinal, nenhum tema abria. Valia para todo release.
 *
 * O nome novo a cada mudança da lista não é etiqueta: com o nome repetido o
 * install escreveria dentro do MESMO cache de onde a versão ativa está servindo,
 * e o arquivo novo entraria antes de ela mandar atualizar. Foi assim de v1 a
 * v11, um por mudança; o v12 foi a entrada de './figuras/solidos.js', e este
 * v13 é a entrada dos treze arquivos de './banco/topicos/' na lista abaixo. */
var CACHE = 'apoio-educacional-v18';
var BAIXADOS = 'apoio-educacional-baixados';

var ARQUIVOS = [
  './',
  './index.html',
  './styles.css',
  './core.js',
  './busca.js',
  './pdf.js',
  /* Os SEIS arquivos do kit de figuras. Faltando um, a figura sai sem marca
   * nenhuma e sem erro, e ela dá aula na casa das famílias, muitas vezes sem
   * sinal: o que não estiver aqui não existe quando falta rede. */
  './figuras/base.js',
  './figuras/desenho.js',
  './figuras/marcas.js',
  './figuras/receitas.js',
  './figuras/formula.js',
  './figuras/solidos.js',
  './store.js',
  './draw.js',
  /* O cartao do mes: ela toca uma vez no fechamento e manda a imagem por
   * WhatsApp. Se ficasse de fora da lista, o app.js novo rodaria contra o
   * cartao.js velho servido do cache de sobra, depois de uma atualizacao. */
  './cartao.js',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/favicon.png',
  // o índice dos temas entra no pacote inicial para a lista abrir sem internet.
  // o conteúdo de cada série é guardado sozinho, na primeira vez que for usado.
  './banco/indice.json',
  // o índice de busca acompanha o de temas: é ele que faz o campo de assunto
  // achar por conteúdo, e não só por título.
  './banco/busca.json',
  /* Os TREZE arquivos dos assuntos das outras matérias. O assunto da aula é
   * registro, e não atalho para material: ela precisa poder escolher o assunto
   * na casa da família, sem sinal, do mesmo jeito que abre a lista de temas.
   * Somam 99 KB, menos que os 240 KB do banco/busca.json que já está aqui.
   *
   * Ficam no CACHE, e não no BAIXADOS: BAIXADOS é para os banco/serie-*.json,
   * que pesam de 130 a 280 KB cada e só entram quando a série é aberta.
   *
   * São treze chances novas de a instalação falhar numa conexão ruim, porque a
   * instalação falha inteira de propósito quando um arquivo não baixa (veja o
   * install abaixo). É o preço de o assunto abrir sem internet, e a falha deixa
   * ela na versão anterior inteira, nunca numa versão pela metade. */
  './banco/topicos/indice.json',
  './banco/topicos/biologia.json',
  './banco/topicos/ciencias.json',
  './banco/topicos/estudo.json',
  './banco/topicos/filosofia-sociologia.json',
  './banco/topicos/fisica.json',
  './banco/topicos/geografia.json',
  './banco/topicos/historia.json',
  './banco/topicos/ingles.json',
  './banco/topicos/literatura.json',
  './banco/topicos/portugues.json',
  './banco/topicos/quimica.json',
  './banco/topicos/redacao.json'
];

/* Os mesmos ARQUIVOS em endereço absoluto, que é a forma como eles aparecem
 * como chave de cache. É o que separa o pacote do aplicativo daquilo que ela
 * baixou durante o uso. */
var ENDERECOS = ARQUIVOS.map(function (u) { return new URL(u, self.location.href).href; });
function doPacote(endereco) { return ENDERECOS.indexOf(endereco) !== -1; }

/* Não assume o controle sozinho: fica esperando. Quem manda trocar de versão
 * é ela, pelo aviso que aparece no aplicativo. Assim uma atualização nunca
 * recarrega a tela no meio de uma aula.
 *
 * Faltando um arquivo, a instalação inteira falha, de propósito. Antes a falha
 * de cada arquivo era engolida: com a conexão caindo no meio, uma instalação
 * rasgada chegava a installed, o aplicativo anunciava versão nova, e o toque
 * dela promovia o cache incompleto por cima do completo (medido: FigSolidos
 * indefinido sem sinal, e a figura do sólido saindo muda na folha). Falhando
 * aqui ela continua com a versão anterior inteira, e o navegador tenta de novo
 * na abertura seguinte. */
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(ARQUIVOS.map(function (u) {
      return fetch(new Request(u, { cache: 'reload' })).then(function (r) {
        if (!r || !r.ok) throw new Error('não baixou ' + u);
        return c.put(u, r);
      });
    }));
  }));
});

self.addEventListener('message', function (e) {
  if (e.data && e.data.tipo === 'ativar-agora') self.skipWaiting();
});

/* Apaga os caches das versões anteriores, e nunca o BAIXADOS. Antes de apagar
 * cada um, resgata dele para o BAIXADOS as chaves que não são do pacote: são as
 * séries que ela já baixou e que o install não recria. Sem esse resgate, quem
 * está numa versão anterior a esta perderia a biblioteca uma última vez. */
function resgatarEApagar(baixados, nome) {
  return caches.open(nome).then(function (velho) {
    return velho.keys().then(function (chaves) {
      return Promise.all(chaves.map(function (pedido) {
        if (doPacote(pedido.url)) return null;
        return velho.match(pedido).then(function (r) {
          return r ? baixados.put(pedido, r) : null;
        });
      }));
    });
  }).then(function () {
    return caches.delete(nome);
  }, function () {
    /* Se o resgate falhar, o cache antigo fica de pé: melhor guardar duas
     * vezes do que apagar o que ela baixou. Na ativação seguinte tenta de
     * novo, e o clients.claim() abaixo acontece de todo jeito. */
    return null;
  });
}

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.open(BAIXADOS).then(function (baixados) {
      return caches.keys().then(function (nomes) {
        return Promise.all(nomes
          .filter(function (n) { return n !== CACHE && n !== BAIXADOS; })
          .map(function (n) { return resgatarEApagar(baixados, n); }));
      });
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
   * apenas "sem alteração".
   *
   * Vale para o que chega até aqui, e não é tudo: medido numa recarga da mesma
   * aba logo depois de um deploy, nenhum dos 13 scripts e estilos do index.html
   * passou por este handler, porque o navegador os serviu do cache dele. Quem
   * entrega o conjunto inteiro e coerente é o botão de atualizar, que troca de
   * service worker e recarrega. */
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(function (resposta) {
      if (resposta && resposta.status === 200 && resposta.type === 'basic') {
        var copia = resposta.clone();
        // cada um no seu cache: o pacote no CACHE, o baixado durante o uso no BAIXADOS.
        caches.open(doPacote(e.request.url) ? CACHE : BAIXADOS).then(function (c) {
          c.put(e.request, copia);
        });
      }
      return resposta;
    }).catch(function () {
      // caches.match sem nome procura nos dois, então a série baixada aparece aqui.
      return caches.match(e.request).then(function (achado) {
        if (achado) return achado;
        if (e.request.mode === 'navigate') return caches.match('./index.html');
        return new Response('Sem conexão.', { status: 503, statusText: 'Sem conexão' });
      });
    })
  );
});
