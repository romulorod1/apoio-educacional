/* sw.js
 * Guarda o aplicativo no próprio tablet para ele abrir sem internet.
 * Os dados das aulas não passam por aqui: ficam no IndexedDB, no aparelho.
 */

/* São dois caches, e é essa divisão que faz a atualização sair barata:
 * CACHE guarda os ARQUIVOS do aplicativo e muda de nome a cada mudança da lista;
 * BAIXADOS guarda o que só entra durante o uso (até o B14, as séries de temas,
 * banco/serie-*.json, que saíram com o material autoral e ficam esquecidas lá
 * nos tablets que já as baixaram; desde o C14, o leitor de PDF de
 * vendor/pdfjs-<versão>/, que chega na primeira vez que ela abre um PDF e daí
 * em diante abre sem sinal), tem nome fixo, e o activate nunca o apaga. O
 * leitor é do mesmo endereço e não é do pacote, então o fetch abaixo o põe no
 * BAIXADOS; e é servido do cache ANTES da rede (veja o fetch). No BAIXADOS
 * ficam o leitor e o trabalhador (1,8 MB), que vêm na primeira abertura, e os
 * três decodificadores .wasm (0,45 MB), que o app busca logo depois, sem
 * segurar o PDF: o PDF.js só os pede quando um PDF escaneado precisa, e esse
 * pedido podia cair num dia sem sinal. Trocar a versão do leitor troca a
 * pasta, e a pasta velha fica no BAIXADOS do tablet, como as séries.
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
 * v11, um por mudança; o v12 foi a entrada de './figuras/solidos.js'; o v13, a
 * dos treze arquivos de './banco/topicos/'. Dali em diante o nome sobe a cada
 * release, mesmo com a lista igual: sem sw.js novo não aparece o aviso de
 * atualizar, e app.js, core.js e banco mudados juntos chegariam aos pedaços
 * pelo cache do navegador. O v20 (08/09/2026) é isso: o aplicativo passou a
 * ler a tabela de matérias, os treze JSON de tópicos ganharam identificadores,
 * e a lista não mudou um item. O v21 é do mesmo tipo, e leva quatro arquivos
 * mudados juntos: o painel "Cada aluno, desde quando e por quanto" passou a
 * nascer recolhido no Fechamento (app.js e index.html) e o fechamento que vai
 * para a família ganhou a linha do total do mês, no texto e no PDF (core.js e
 * pdf.js). Os quatro já estão na lista abaixo, que continua igual. O v22
 * (08/09/2026) acrescenta uma linha à lista, a primeira desde o v16, que levou
 * o './cartao.js': é o índice dos temas de português. Aí o nome novo é
 * obrigatório pelo motivo original, e não pelo hábito do release. O v23 iniciou
 * a série de mudanças de conteúdo do cache; v24 atualizou a diretiva de equação
 * e v25 atualizou o banco do lote 2.
 *
 * O v26 continua a série: a lista permanece igual, mas mudaram dois arquivos já
 * listados, './figuras/receitas.js' e './figuras/solidos.js'. Eles corrigem a
 * família de sólidos medida no uso real.
 * A ordem v23, v24, v25, v26 e v27 evita regressão do nome do cache e é
 * confirmada pelo portão sobre cada estado integrado. O v28 traz a revisão
 * e expansão aprofundada completa da base de dados e acervo pedagógico. O v29
 * limpa a notação de fórmulas matemáticas e atualiza a apresentação das dicas.
 * O v30 tira o acervo do ar (aba Temas em construção) e leva a chave Pix ao
 * fechamento da família, com a lista igual. O v31 tira do PDF do fechamento a
 * seção Feedback quando ela está em branco, depois de a Nathália confirmar.
 * O v32 acrescenta duas linhas à lista, './zip.js' e './biblioteca.js': o
 * Importar biblioteca de Ajustes, que abre e confere o pacote .zip da
 * biblioteca sem internet. O v33 troca a aba Temas pela aba Biblioteca
 * (app.js, index.html e styles.css), com a lista igual. O v34 põe, na busca da
 * Biblioteca, a teoria, os exercícios e o Banco do módulo achado antes do resto
 * (app.js). O v35 traz o material da biblioteca: caixas, carrinho, gerar o
 * PDF com gabarito e anexar na aula (app.js, pdf.js, biblioteca.js, index.html
 * e styles.css), com a lista igual. O v36 liga a biblioteca à aula: o botão
 * Material do assunto abre a biblioteca, o filtro "ainda não usei com" e os
 * módulos usados em "Temas trabalhados" (app.js, core.js, index.html e
 * styles.css), com a lista igual. O v37 põe a dificuldade à vista na lista de
 * exercícios: o filtro Fácil, Médio e Difícil, o rótulo "estimada" ou
 * "curada" e o CSV das etiquetas dela em Ajustes (app.js, index.html e
 * styles.css), com a lista igual. O v38 tira do repositório o acervo de
 * 14/09: saem da lista './banco/acervo.json' e './banco/acervo_indice.json', e
 * do app.js, index.html e styles.css a aba Temas antiga. O v39 troca, a pedido
 * do Romulo, o rótulo "curada" por "revisada" na dificuldade (app.js), com a
 * lista igual. O v40 faz o módulo do material da biblioteca virar assunto da
 * aula ao anexar, e o botão Material só aparecer quando a biblioteca tem o
 * assunto (app.js e core.js), com a lista igual. O v41 desliga o material
 * autoral: sai o botão "Material de aula" da janela da aula e a montagem do
 * PDF autoral, e a biblioteca ganha o caminho curto da aula (módulo inteiro já
 * marcado), o marcar de dentro da tela cheia, o "Marcar os N deste módulo" e o
 * Remover pacote em Ajustes (app.js, store.js, index.html e styles.css), com a
 * lista igual. Nenhum tema sai do banco: os arquivos de banco/ continuam na
 * lista e o carregarSerie continua lendo 'banco/serie-'. O v43 faz o salvar
 * só responder quando o dado está gravado de fato (store.js), com a lista
 * igual; pula o v42 de propósito, que era o nome que a lista pronta do 9º ano
 * usava no PR dela, para os dois nunca chegarem ao ar com o mesmo nome. O v44
 * traz a lista pronta do 9º ano (app.js, biblioteca.js, draw.js, pdf.js,
 * index.html e styles.css), com a lista igual. O v45 traz a ordenação
 * alfabética dos alunos no Fechamento e o carrossel de novidades e guia de
 * listas (app.js, core.js, index.html e styles.css), com a lista igual. O v46
 * (B14) tira o material autoral: saem da lista os seis arquivos de figuras/, o
 * banco/indice.json, o banco/busca.json e o banco/portugues/indice.json, e
 * entra o banco/topicos/matematica.json, o índice de assuntos que ficou
 * (app.js e index.html). O v47 (B3) trata a falha de gravação num lugar só:
 * a faixa no alto quando o tablet não consegue guardar e a nova tentativa
 * (app.js e styles.css), com a lista igual. O v48 (B3, segunda parte) não deixa
 * o Atualizar nem uma troca de dados que não gravou nada levarem o que a faixa
 * ainda não guardou (app.js e store.js), com a lista igual. O v49 (C2a) traz
 * Minhas listas e o banco na versão 3 (app.js, store.js, index.html e
 * styles.css), com a lista igual. O v50 (C2b) traz a lista de base e a
 * etiqueta de nível nas listas prontas (app.js e biblioteca.js), com a lista
 * igual. O v54 (C10a) põe na tela as palavras dela: Página, Relato da aula,
 * Nota só minha, Habilidades e hábitos, Novo ano letivo e aula (app.js,
 * core.js, pdf.js e index.html), com a lista igual. O v55 (C10b) deixa um
 * botão por aluno no Fechamento, os outros formatos dentro da janela e o envio
 * às famílias em sequência (app.js e index.html), com a lista igual. O v77 (D2)
 * traz o cache primeiro e a versão que só roda depois do toque (sw.js, app.js e
 * index.html), com a lista igual; pula o v76, que é o nome do B12 no PR dele.
 * Aqui o nome novo é obrigatório pelo motivo original: com o v75 repetido, o
 * tablet na main instalaria a D2 dentro do cache de onde está abrindo. O v78
 * (D2b com B4) serve da versão da janela tudo o que está no cache dela, troca
 * só com o cache novo completo, e traz o deploy no Cloudflare com a faixa de
 * endereço desligada (sw.js, app.js, styles.css e index.html). O v79 (N0)
 * traz a cópia na nuvem cifrada no aparelho: nuvem.js e o gerador de QR entram
 * na lista; app.js, store.js, index.html e styles.css mudam. O v80 (N0b) conta
 * a geração das mudanças no envio da nuvem (nuvem.js e app.js). O v81 (D6a)
 * traz o modo celular só leitura (app.js, store.js, nuvem.js, index.html e
 * styles.css), com a lista igual. O v82 (N1, fatia 1) traz o banco por registro
 * (IndexedDB 5; store.js e core.js), com a lista igual. O v83 é o nome do B4b
 * (faixa de endereço) no PR dele. O v84 (N1, fatias 2 e 3) traz a fila de saída,
 * o envio e o recebimento por registro (IndexedDB 6; store.js, nuvem.js e
 * app.js), com a lista igual. */
var CACHE = 'apoio-educacional-v84';
var BAIXADOS = 'apoio-educacional-baixados';

var ARQUIVOS = [
  './',
  './index.html',
  './styles.css',
  './core.js',
  './busca.js',
  './pdf.js',
  './store.js',
  './draw.js',
  /* O leitor de zip e a conferência do pacote da biblioteca. O pacote em si
   * nunca passa por aqui: ele vai para o IndexedDB ao ser importado. */
  './zip.js',
  './biblioteca.js',
  /* O cartao do mes: ela toca uma vez no fechamento e manda a imagem por
   * WhatsApp. Se ficasse de fora da lista, o app.js novo rodaria contra o
   * cartao.js velho servido do cache de sobra, depois de uma atualizacao. */
  './cartao.js',
  /* A cópia na nuvem (N0): o motor e o gerador do QR da chave. Fora da lista,
   * o app.js novo abriria Ajustes sem o Nuvem depois de uma atualização. */
  './nuvem.js',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/favicon.png',
  /* O índice de assuntos de matemática (B14): id, título, ano, unidade,
   * duração, dificuldade e pré-requisitos dos 148 assuntos, sem material.
   * Até a 1.28 aqui ficavam o banco/indice.json, o banco/busca.json e o
   * banco/portugues/indice.json, gerados do material autoral, que saiu; a busca
   * passou a ser montada no aparelho a partir dos títulos (app.js,
   * carregarIndiceDeBusca). As séries (banco/serie-*.json) que o tablet já
   * baixou ficam esquecidas no BAIXADOS: ninguém as pede mais. */
  './banco/topicos/matematica.json',
  /* Os TREZE arquivos dos assuntos das outras matérias. O assunto da aula é
   * registro, e não atalho para material: ela precisa poder escolher o assunto
   * na casa da família, sem sinal, do mesmo jeito que abre a lista de temas.
   * Somam 99 KB.
   *
   * Ficam no CACHE, e não no BAIXADOS: BAIXADOS é para o que só entra durante
   * o uso (até o B14, as séries de temas, que saíram com o material autoral).
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

/* Arquivos que já foram do pacote e saíram dele. O resgate abaixo guarda no
 * BAIXADOS tudo o que não é do pacote, e o BAIXADOS nunca se apaga: sem esta
 * lista, o acervo de 14/09 (2,4 MB, fora do pacote desde o v38) iria para lá
 * como se ela o tivesse baixado, e ficaria no tablet para sempre. O v46 (B14)
 * aposenta o índice, a busca e o índice de português dos temas autorais e os
 * seis arquivos do kit de figuras, que saíram do pacote. */
var APOSENTADOS = ['./banco/acervo.json', './banco/acervo_indice.json',
  './banco/indice.json', './banco/busca.json', './banco/portugues/indice.json',
  './figuras/base.js', './figuras/desenho.js', './figuras/marcas.js',
  './figuras/receitas.js', './figuras/formula.js', './figuras/solidos.js']
  .map(function (u) { return new URL(u, self.location.href).href; });
function aposentado(endereco) { return APOSENTADOS.indexOf(endereco) !== -1; }

/* CACHE PRIMEIRO, E A VERSÃO QUE RODA É A QUE ELA ESCOLHEU (D2).
 *
 * Até a 1.41 o fetch ia à rede primeiro, sem prazo, inclusive para abrir o
 * aplicativo. Medido na avaliação de 21/10: sem sinal abria em 75 ms, mas com a
 * rede demorando 40 s para responder a agenda só aparecia aos 40 s. Na casa da
 * família o sinal de uma barrinha é pior que sinal nenhum. E o aviso de versão
 * não segurava nada: o código novo rodava na abertura seguinte, sem toque, e o
 * cache da versão ATIVA recebia o app.js novo da rede.
 *
 * Agora os ARQUIVOS saem do cache da versão escolhida, sem perguntar à rede.
 * Quem escolhe é ela, no aviso "Versão nova pronta": a escolha fica gravada no
 * cache CONTROLE, separada do ciclo de vida do service worker, porque o
 * navegador ativa o worker em espera sozinho quando a última janela fecha.
 * Sem essa separação, fechar o aplicativo depois da aula já seria atualizar.
 *
 * As chaves do CONTROLE: 'selecionado' (o cache que abre o aplicativo),
 * 'candidato' (o último cache instalado por inteiro, com a versão dele),
 * 'na-proxima' (o "Depois da aula": entra na próxima abertura), 'anterior' (de
 * onde a troca saiu, para as outras janelas abertas ficarem onde estavam) e
 * 'cliente-<id>' (a versão em que cada janela aberta nasceu). O CONTROLE não
 * casa com o padrão das versões, então o activate nunca o apaga. */
var CONTROLE = 'apoio-educacional-controle';
var VERSAO_DO_APP = /^apoio-educacional-v\d+$/;
function chaveControle(nome) { return new URL('./__controle_versao__/' + encodeURIComponent(nome), self.location.href).href; }
function lerControle(nome) {
  return caches.open(CONTROLE).then(function (c) { return c.match(chaveControle(nome)); })
    .then(function (r) { return r ? r.json() : null; });
}
function gravarControle(nome, valor) {
  return caches.open(CONTROLE).then(function (c) {
    return c.put(chaveControle(nome), new Response(JSON.stringify(valor), { headers: { 'Content-Type': 'application/json' } }));
  });
}
function apagarControle(nome) {
  return caches.open(CONTROLE).then(function (c) { return c.delete(chaveControle(nome)); });
}

/* O cache que está abrindo o aplicativo agora. Sem escolha gravada, é o worker
 * de antes do D2 que está servindo, e ele serve o cache de versão mais nova
 * que não é o desta: é de lá que sai o "anterior" de uma troca. */
function cacheEmUso() {
  return lerControle('selecionado').then(function (selecionado) {
    if (selecionado) return selecionado;
    return caches.keys().then(function (nomes) {
      var antigos = nomes.filter(function (n) { return VERSAO_DO_APP.test(n) && n !== CACHE; })
        .sort(function (a, b) { return Number(b.match(/\d+$/)[0]) - Number(a.match(/\d+$/)[0]); });
      return antigos[0] || CACHE;
    });
  });
}

/* A escolha que abre o aplicativo, conferida: se o cache escolhido não existe
 * mais (o navegador pode apagar armazenamento), abre com o desta versão, que
 * está inteiro, em vez de deixar a tela branca. Um aplicativo preso numa
 * versão que sumiu não teria como mostrar o aviso que o tira de lá. */
function cacheSelecionado() {
  return lerControle('selecionado').then(function (selecionado) {
    if (!selecionado || selecionado === CACHE) return CACHE;
    return caches.has(selecionado).then(function (existe) {
      if (existe) return selecionado;
      return gravarControle('selecionado', CACHE).then(function () { return CACHE; });
    });
  });
}

function versaoDoCache(nome) {
  return caches.open(nome).then(function (c) { return c.match('./app.js'); })
    .then(function (r) { return r ? r.text() : ''; })
    .then(function (s) { var m = s.match(/var VERSAO = '([^']+)'/); return m ? m[1] : null; });
}

/* Rede com prazo de 3 s até a resposta começar. O prazo vale para o servidor
 * responder, e não para o corpo inteiro chegar: um app.js grande numa conexão
 * lenta ainda baixa, e o tablet que só tem sinal fraco não fica preso para
 * sempre na versão antiga por nunca caber em 3 s. Se a conexão cair no meio do
 * corpo, o c.put do install falha e a instalação falha inteira (veja abaixo).
 *
 * Pergunta ao servidor se o arquivo mudou (cache: 'no-cache'), em vez de
 * aceitar o que estiver no cache do navegador: o GitHub Pages manda guardar por
 * dez minutos, e a resposta continua barata quando nada mudou.
 *
 * O install também usa 'no-cache'. Depois de um corte no meio do corpo, a
 * tentativa seguinte retoma de onde parou (Range com If-Range pela ETag, que
 * garante que é o mesmo arquivo), e num sinal que cai sempre no meio a versão
 * nova chega mais cedo do que baixando tudo de novo a cada vez. O 'reload' que
 * esteve aqui no D2b não consertava nada: a versão nova sem app.js que parecia
 * vir da retomada era a limpeza apagando o cache em obra (veja a marca
 * 'instalando' no install). */
function redeComPrazo(pedido, modo) {
  var controlador = new AbortController();
  var prazo = setTimeout(function () { controlador.abort(); }, 3000);
  return fetch(pedido, { cache: modo || 'no-cache', signal: controlador.signal })
    .finally(function () { clearTimeout(prazo); });
}

/* Não assume o controle sozinho: fica esperando. Quem manda trocar de versão
 * é ela, pelo aviso que aparece no aplicativo. Assim uma atualização nunca
 * recarrega a tela no meio de uma aula.
 *
 * O download é em segundo plano e vai para um cache NOVO (o nome sobe a cada
 * release, veja o topo): o cache de onde a versão ativa está servindo nunca
 * recebe um arquivo da versão nova.
 *
 * Faltando um arquivo, a instalação inteira falha, de propósito. Antes a falha
 * de cada arquivo era engolida: com a conexão caindo no meio, uma instalação
 * rasgada chegava a installed, o aplicativo anunciava versão nova, e o toque
 * dela promovia o cache incompleto por cima do completo (medido: FigSolidos
 * indefinido sem sinal, e a figura do sólido saindo muda na folha). Falhando
 * aqui ela continua com a versão anterior inteira, e o navegador tenta de novo
 * na abertura seguinte. O 'candidato' só é gravado com tudo baixado: é ele que
 * faz o aviso aparecer.
 *
 * O cache pela metade é apagado SÓ se nasceu nesta instalação. Um cache que já
 * existia antes dela é o de onde uma versão está abrindo: o nome repetido faz o
 * install escrever dentro dele (veja o topo), e o worker de antes do D2 não
 * grava escolha nenhuma. Apagar pela escolha gravada deixava o tablet na main,
 * com o corte no meio do download, sem cache nenhum para abrir sem rede (achado
 * da revisão do D2, provado com veneno no testa_atualizacao_apos_fechar). */
self.addEventListener('install', function (e) {
  var jaExistia = false;
  e.waitUntil(caches.has(CACHE).then(function (existe) {
    jaExistia = existe;
    /* Marca o cache em obra: a limpeza que roda depois de cada abertura (veja
     * o fetch) não sabe dele, porque o 'candidato' só é gravado no fim. Sem a
     * marca, uma abertura no meio do download apagava o cache que o install
     * estava enchendo, e a versão nova ficava esperando com o cache vazio
     * (medido no D2b: o aviso sem número, e o app.js ausente do cache novo). */
    return gravarControle('instalando', { cache: CACHE, desde: Date.now() });
  }).then(function () {
    return caches.open(CACHE);
  }).then(function (c) {
    return Promise.all(ARQUIVOS.map(function (u) {
      return redeComPrazo(new Request(u)).then(function (r) {
        if (!r || !r.ok) throw new Error('não baixou ' + u);
        return c.put(u, r);
      });
    }));
  }).then(function () {
    return versaoDoCache(CACHE).then(function (versao) { return gravarControle('candidato', { cache: CACHE, versao: versao }); })
      .then(function () { return apagarControle('instalando'); });
  }).catch(function (erro) {
    return (jaExistia ? Promise.resolve() : caches.delete(CACHE)).then(function () { throw erro; });
  }));
});

/* As três conversas com o aplicativo. A resposta vai pela porta do
 * MessageChannel quando há uma; o aplicativo de antes do D2 manda o
 * 'ativar-agora' sem porta, e ele funciona do mesmo jeito: é por ali que o
 * tablet que ficou numa versão antiga sai dela.
 *
 * 'estado-versao': há versão nova pronta, e qual é.
 * 'ativar-agora': o "Atualizar agora". Grava a escolha antes de pedir o
 *   skipWaiting, para a ordem nunca deixar o worker novo servindo a versão de
 *   antes, nem o contrário.
 * 'depois-da-aula': grava que a versão nova entra na próxima abertura. */
self.addEventListener('message', function (e) {
  if (!e.data) return;
  function responder(objeto) { if (e.ports && e.ports[0]) e.ports[0].postMessage(objeto); }
  if (e.data.tipo === 'estado-versao') {
    e.waitUntil(Promise.all([cacheEmUso(), lerControle('candidato')]).then(function (dados) {
      var candidato = dados[1];
      responder({ pendente: !!candidato && candidato.cache !== dados[0],
        versao: candidato && candidato.versao });
    }, function () { responder(null); }));
  }
  if (e.data.tipo === 'ativar-agora') {
    /* A TROCA É INTEIRA OU NÃO É (D2b). Só escolhe o cache novo depois de
     * conferir que ele tem todos os ARQUIVOS; faltando um, responde que não
     * ativou e nada muda. A janela que tocou continua presa à versão dela até
     * recarregar: num tablet lento, entre o toque e a recarga, o que ela pedir
     * vem da versão em que nasceu, e não da nova (antes a chave dela saía aqui
     * mesmo, e o que chegasse nesse intervalo vinha da versão nova). O cache
     * velho sai na limpeza depois da abertura seguinte (veja o fetch). */
    var quem = e.source && e.source.id;
    e.waitUntil(cacheCompleto(CACHE).then(function (completo) {
      if (!completo) throw new Error('cache da versão nova incompleto');
      return cacheEmUso();
    }).then(function (anterior) { return gravarControle('anterior', { cache: anterior, para: CACHE, quem: quem || null }); })
      .then(function () { return gravarControle('selecionado', CACHE); })
      .then(function () { return apagarControle('na-proxima'); })
      .then(function () { return self.skipWaiting(); })
      .then(function () { responder({ ativada: true }); })
      .catch(function () { responder({ ativada: false }); }));
  }
  if (e.data.tipo === 'depois-da-aula') {
    e.waitUntil(lerControle('candidato').then(function (candidato) {
      return candidato ? gravarControle('na-proxima', candidato.cache) : null;
    }).then(function () { responder({ adiada: true }); }, function () { responder({ adiada: false }); }));
  }
});

/* Todos os ARQUIVOS desta versão estão no cache dela. */
function cacheCompleto(nome) {
  return caches.has(nome).then(function (existe) {
    if (!existe) return false;
    return caches.open(nome).then(function (c) {
      return Promise.all(ARQUIVOS.map(function (u) { return c.match(u); }));
    }).then(function (achados) { return achados.every(Boolean); });
  });
}

/* Apaga os caches das versões anteriores, e nunca o BAIXADOS. Antes de apagar
 * cada um, resgata dele para o BAIXADOS as chaves que não são do pacote: são as
 * séries que ela já baixou e que o install não recria. Sem esse resgate, quem
 * está numa versão anterior a esta perderia a biblioteca uma última vez. */
function resgatarEApagar(baixados, nome) {
  return caches.open(nome).then(function (velho) {
    return velho.keys().then(function (chaves) {
      return Promise.all(chaves.map(function (pedido) {
        if (doPacote(pedido.url) || aposentado(pedido.url)) return null;
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

/* Só os caches DESTE aplicativo, pelo padrão apoio-educacional-v<número>, e
 * nunca o BAIXADOS nem o CONTROLE. Antes o activate apagava todo cache que não
 * fosse o novo, e no GitHub Pages a origem é a mesma para todos os
 * repositórios do usuário: o cache de outro aplicativo ia junto. Fica de pé o
 * escolhido, o candidato e o de cada janela aberta, que pode estar no meio de
 * uma aula na versão de antes. As chaves de janela que já fecharam saem. */
function limparVersoesNaoUsadas(janelas, selecionado) {
  return Promise.all([lerControle('candidato'), caches.open(CONTROLE), caches.open(BAIXADOS), caches.keys(), lerControle('instalando')])
    .then(function (dados) {
      var candidato = dados[0], controle = dados[1], baixados = dados[2], nomes = dados[3];
      // o cache em obra fica de pé; a marca vale dez minutos, para um install
      // morto pelo navegador não segurar o cache para sempre
      var emObra = dados[4] && Date.now() - dados[4].desde < 10 * 60 * 1000 ? dados[4].cache : null;
      return Promise.all(janelas.map(function (janela) { return lerControle('cliente-' + janela.id); }))
        .then(function (fixados) {
          var manter = [selecionado, CACHE, candidato && candidato.cache, emObra].concat(fixados);
          return Promise.all(nomes.filter(function (n) {
            return VERSAO_DO_APP.test(n) && manter.indexOf(n) < 0;
          }).map(function (n) { return resgatarEApagar(baixados, n); }));
        }).then(function () {
          var vivos = janelas.map(function (janela) { return 'cliente-' + janela.id; });
          return controle.keys().then(function (pedidos) {
            return Promise.all(pedidos.map(function (pedido) {
              var nome = decodeURIComponent(new URL(pedido.url).pathname.split('/').pop());
              return nome.indexOf('cliente-') === 0 && vivos.indexOf(nome) < 0 ? controle.delete(pedido) : null;
            }));
          });
        });
    });
}

/* Quando a escolha muda sem toque nesta ativação.
 *
 * Sem escolha gravada, quem estava servindo era o worker de antes do D2. O
 * aplicativo daquela época não conhece o 'estado-versao': com o worker novo
 * ativo ele não vê worker em espera, e nunca mostraria o aviso. Mantê-lo na
 * versão dele seria deixar o tablet preso. Essa travessia segue a regra
 * antiga uma última vez: ativou porque ela fechou o aplicativo, a versão nova
 * abre na próxima abertura.
 *
 * Com 'na-proxima' igual a esta versão, ela já tocou "Depois da aula": é a
 * próxima abertura, e a versão entra. Nos dois casos, as janelas que ainda
 * estiverem abertas ficam onde estavam (veja o fetch). */
function escolherNaAtivacao() {
  return Promise.all([lerControle('selecionado'), lerControle('na-proxima')]).then(function (dados) {
    if (!dados[0] || dados[1] === CACHE) {
      return gravarControle('selecionado', CACHE).then(function () { return apagarControle('na-proxima'); })
        .then(function () { return CACHE; });
    }
    return cacheSelecionado();
  });
}

/* Em que versão ficam as janelas abertas na hora da ativação. Com toque, as
 * outras janelas ficam na de antes ('anterior'). Sem toque e com escolha
 * gravada, na que estava em uso. Sem toque e sem escolha gravada não havia
 * worker do D2 antes: ou é a primeira instalação, e a janela aberta veio da
 * rede, sem worker, ou é a travessia ao fechar, sem janela nenhuma. Prender
 * essa janela ao cache velho mais novo seria errado e o deixaria de pé
 * (medido no testa_limpeza_acervo: o v37 sobrava sem o resgate). */
self.addEventListener('activate', function (e) {
  e.waitUntil(Promise.all([cacheEmUso(), lerControle('selecionado')]).then(function (dados) {
    var emUso = dados[0], haviaEscolha = !!dados[1];
    return escolherNaAtivacao().then(function (selecionado) {
      return lerControle('anterior').then(function (anterior) {
        var tocou = anterior && anterior.para === CACHE;
        var deOnde = tocou ? anterior.cache : (haviaEscolha ? emUso : selecionado);
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (janelas) {
          return Promise.all(janelas.map(function (janela) {
            var chave = 'cliente-' + janela.id;
            return lerControle(chave).then(function (fixado) {
              return fixado ? null : gravarControle(chave, deOnde);
            });
          })).then(function () { return limparVersoesNaoUsadas(janelas, selecionado); });
        });
      });
    });
  }).then(function () { return self.clients.claim(); }));
});

/* A abertura do aplicativo. É aqui que o "Depois da aula" vira versão nova:
 * abertura de verdade é a navegação sem outra janela do aplicativo aberta.
 * Com outra aberta, a escolha espera, para as duas não rodarem versões
 * diferentes contra o mesmo banco. */
function escolherNaAbertura(e) {
  return lerControle('na-proxima').then(function (naProxima) {
    if (naProxima !== CACHE) return cacheSelecionado();
    return self.clients.matchAll({ type: 'window' }).then(function (janelas) {
      var outras = janelas.filter(function (j) { return j.id !== e.resultingClientId && j.id !== e.clientId; });
      if (outras.length) return cacheSelecionado();
      return gravarControle('selecionado', CACHE).then(function () { return apagarControle('na-proxima'); })
        .then(function () { return CACHE; });
    });
  });
}

/* De onde vem cada pedido:
 *
 * os ARQUIVOS e a abertura, do cache da versão escolhida, sem esperar a rede.
 * Cada janela fica na versão em que nasceu ('cliente-<id>'): a troca feita
 * noutra janela não troca os arquivos desta no meio da aula. Faltando o
 * arquivo no cache (não devia), vai à rede com prazo e, sem ela, ao cache
 * desta versão, que está inteiro, em vez de responder erro;
 *
 * o leitor de PDF, do BAIXADOS antes da rede (o caminho leva a versão);
 *
 * o resto (os baixados durante o uso, como banco/serie-*.json), da rede
 * primeiro, com o prazo de 3 s, e do BAIXADOS sem ela. É o que muda no
 * servidor sem release, e o prazo curto impede a tela de esperar 40 s. */
/* A resposta do cache vai para a página com Cache-Control: no-cache. O
 * arquivo guardado leva o max-age=600 do GitHub Pages, e com ele o navegador
 * guarda o script na memória da aba e o reaproveita ao recarregar, sem passar
 * por aqui. Medido no D2: depois do "Atualizar agora" com o worker novo já
 * ativo (ela tinha fechado o aplicativo sem tocar), a recarga rodou o app.js
 * da versão de antes, servido da memória, enquanto este handler já entregava o
 * novo. Com no-cache o navegador pergunta de novo, e quem responde é a escolha
 * gravada. Custa uma cópia de cabeçalhos por arquivo. */
function semGuardarNaMemoria(r) {
  var cabecalhos = new Headers(r.headers);
  cabecalhos.set('Cache-Control', 'no-cache');
  return new Response(r.body, { status: r.status, statusText: r.statusText, headers: cabecalhos });
}

/* Depois de cada abertura, a limpeza das versões que nenhuma janela usa. A
 * janela que tocou em "Atualizar agora" fica presa à versão dela até sumir, e
 * some só quando a recarga termina: limpar no activate deixava o cache velho
 * de pé até a release seguinte. A espera dá tempo de a janela velha sair da
 * lista. Corre por fora do evento, sem waitUntil: segurar a abertura por 2 s
 * pode atrasar a ativação do worker em espera quando ela fecha o aplicativo
 * (na prova da lista que encolhe, uma rodada achou o worker ainda em espera
 * depois de fechar e abrir). Se o navegador parar o
 * worker antes, a limpeza fica para a abertura seguinte. */
function limparDepoisDaAbertura(selecionado) {
  return new Promise(function (r) { setTimeout(r, 2000); }).then(function () {
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  }).then(function (janelas) { return limparVersoesNaoUsadas(janelas, selecionado); })
    .catch(function () { return null; });
}

/* O que é baixado durante o uso, e nunca da versão: as séries (até o B14) e o
 * leitor de PDF. Os caches de antes do D2 guardavam as séries junto com o
 * pacote; servi-las dali seria trocar a rede primeiro delas por cache primeiro. */
function baixadoDuranteOUso(caminho) {
  return /\/banco\/serie-/.test(caminho) || /\/vendor\/pdfjs-[^\/]+\//.test(caminho);
}

/* A LISTA QUE VALE É A DO CACHE DA JANELA, E NÃO A DESTE WORKER (D2b).
 *
 * Antes o fetch só procurava no cache da versão o que estava nos ARQUIVOS do
 * worker que estava rodando. Com o "Depois da aula" ou fechando sem tocar, o
 * worker novo ativa e continua servindo a versão de antes; se a release nova
 * tirou um arquivo da lista, o index.html de antes ainda o pede, o worker novo
 * não o reconhece como do pacote e vai à rede. Sem sinal, a versão aberta
 * abria quebrada (medido pela orquestradora: 503 no arquivo que saiu, com ele
 * guardado no cache da versão aberta). Agora tudo o que ESTÁ no cache da
 * versão da janela sai de lá, e a lista deste worker só decide o que fazer
 * quando o arquivo não está. */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  var navegacao = e.request.mode === 'navigate';
  var daVersao = navegacao || !baixadoDuranteOUso(url.pathname);
  if (daVersao) {
    var doPacoteDeAgora = navegacao || doPacote(e.request.url);
    e.respondWith((navegacao ? escolherNaAbertura(e) : cacheSelecionado()).then(function (selecionado) {
      if (navegacao) {
        var destino = e.resultingClientId || e.clientId;
        limparDepoisDaAbertura(selecionado);
        return destino ? gravarControle('cliente-' + destino, selecionado).then(function () { return selecionado; }) : selecionado;
      }
      if (!e.clientId) return selecionado;
      return lerControle('cliente-' + e.clientId).then(function (fixado) { return fixado || selecionado; });
    }).then(function (nome) { return caches.open(nome); }).then(function (c) {
      return c.match(e.request).then(function (r) {
        if (r) return r;
        if (navegacao) return c.match('./index.html');
        return null;
      });
    }).then(function (r) {
      if (r) return semGuardarNaMemoria(r);
      // fora do cache da versão e fora do pacote: é baixado, rede primeiro
      if (!doPacoteDeAgora) return daRedeParaOBaixados(e.request);
      return redeComPrazo(e.request).catch(function () {
        return caches.open(CACHE).then(function (c) {
          return c.match(navegacao ? './index.html' : e.request);
        }).then(function (achado) {
          return achado || new Response('Sem conexão.', { status: 503, statusText: 'Sem conexão' });
        });
      });
    }));
    return;
  }

  /* O leitor de PDF (C14) vem do cache ANTES da rede. O caminho leva a versão
   * (vendor/pdfjs-6.4.299/), então o arquivo de um caminho nunca muda, e não
   * há atualização a perguntar ao servidor. Com a rede primeiro, o tablet
   * conectado mas sem tráfego (o sinal de uma barrinha na casa da família)
   * esperava a rede sem prazo, com o leitor guardado ali do lado: a janela
   * ficava em "Abrindo o PDF..." e não saía. */
  if (/\/vendor\/pdfjs-[^\/]+\//.test(url.pathname)) {
    e.respondWith(caches.open(BAIXADOS).then(function (baixados) {
      return baixados.match(e.request).then(function (achado) {
        if (achado) return achado;
        return fetch(e.request).then(function (resposta) {
          if (resposta && resposta.status === 200 && resposta.type === 'basic') {
            var copia = resposta.clone();
            baixados.put(e.request, copia);
          }
          return resposta;
        });
      });
    }).catch(function () {
      return new Response('Sem conexão.', { status: 503, statusText: 'Sem conexão' });
    }));
    return;
  }

  e.respondWith(daRedeParaOBaixados(e.request));
});

/* O baixado durante o uso vai para o BAIXADOS, nunca para o cache de uma
 * versão: o cache da versão escolhida só recebe o que o install baixou. */
function daRedeParaOBaixados(pedido) {
  return redeComPrazo(pedido).then(function (resposta) {
    if (resposta && resposta.status === 200 && resposta.type === 'basic') {
      var copia = resposta.clone();
      return caches.open(BAIXADOS).then(function (c) {
        return c.put(pedido, copia).catch(function () {});
      }).then(function () { return resposta; });
    }
    return resposta;
  }).catch(function () {
    return caches.open(BAIXADOS).then(function (c) { return c.match(pedido); }).then(function (achado) {
      return achado || new Response('Sem conexão.', { status: 503, statusText: 'Sem conexão' });
    });
  });
}
