/* store.js
 * Armazenamento local no próprio tablet, com IndexedDB.
 *
 * Divisão em depósitos separados, de propósito:
 *   dados     : alunos, séries, aulas e resumos. É leve, então cabe num
 *               instantâneo de desfazer sem pesar.
 *   notas     : as folhas de aula manuscritas, uma por aula. Podem ser grandes.
 *   midias    : imagens coladas nas folhas.
 *   anexos    : arquivos avulsos (PDF do Samsung Notes, fotos).
 *   historico : instantâneos para desfazer.
 *
 * E os da biblioteca (versão 2 do banco), no formato do contrato do pacote
 * (CONTRATO_pacote_biblioteca.md, seção 8):
 *   biblioteca_pacotes  : o manifest de cada pacote importado, com o índice
 *                         de busca e os apelidos dele.
 *   biblioteca_itens    : um exercício por registro, pelo id do contrato.
 *   biblioteca_teoria   : uma aula de teoria por registro, com as páginas.
 *   biblioteca_assets   : os SVG (Blob), por pacote e caminho.
 *   biblioteca_uso      : que exercício foi para que aluno, em que aula.
 *   biblioteca_etiquetas: a dificuldade que ela deu a um exercício.
 *   biblioteca_listas   : as listas dela ("Minhas listas", versão 3 do banco):
 *                         nome, nível e os exercícios e páginas, em ordem.
 * Os quatro primeiros vêm do pacote e se refazem importando de novo; por isso
 * a cópia de segurança leva só uso, etiquetas e listas, que são dela.
 *
 * E os dos livros de referência (versão 4 do banco, C15.1):
 *   livros          : um livro por registro (PDF ou EPUB, como Blob), pelo id
 *                     do pacote de livros, com o manifest do livro (título,
 *                     autoria, sumário) e o pacote e a versão de onde veio.
 *   livros_posicoes : onde ela parou em cada livro (página do PDF; capítulo e
 *                     rolagem do EPUB), para o livro abrir no mesmo lugar.
 * OS DOIS SÃO SÓ DESTE TABLET: ficam FORA da cópia de segurança (o
 * exportarTudo não os lê) e FORA da nuvem. Livro é material de terceiro, pesa
 * dezenas de MB, e volta importando o pacote do Drive; a cópia que ela manda
 * para o Drive continua do tamanho de antes. A fase 1 da nuvem (N1, versão 5
 * do banco) respeita a lista SO_DESTE_TABLET, lá embaixo.
 *
 * E os da fase 1 da nuvem (versão 5 do banco, N1 fatia 1):
 *   registros : UM REGISTRO POR ITEM do documento principal (aluno, série,
 *               aula, resumo, pagamento, chave de ajuste), com atualizadoEm,
 *               apagadoEm (lápide), aparelho, esquema e ordem. É o formato
 *               que sincroniza: a fatia 2 põe na fila o que mudou, a fatia 3
 *               aplica o que chega, registro a registro.
 *   controle  : o id deste aparelho e o `retrato` (quando e a assinatura do
 *               `principal` que os registros espelham).
 * O documento `dados/principal` CONTINUA sendo gravado inteiro, na mesma
 * transação, em toda gravação: é o retrato de segurança que o código da
 * versão anterior lê, e é o que faz o rollback (republicar o código antigo
 * com VERSAO_BANCO = 5) não perder nada. O salvar grava nele e grava em
 * `registros` só a diferença; o carregar monta o db dos registros, e se o
 * `principal` tiver sido gravado por fora (código antigo, prova que semeia o
 * banco), ele vence e os registros são refeitos a partir dele.
 *
 * Daqui nada sai sozinho. A cópia na nuvem (nuvem.js, fase 0) sobe o mesmo
 * .zip da cópia de segurança, cifrado no aparelho, e só depois de ela entrar
 * na conta e mandar a primeira vez; este arquivo só a avisa de que algo dela
 * mudou (aoMudar).
 */
(function (root) {
  'use strict';

  var NOME_BANCO = 'apoio-educacional';
  /* Versão 2 (biblioteca): a migração só CRIA os depósitos que faltam. Nenhum
   * dado da versão 1 é lido, mudado ou copiado.
   *
   * O número NUNCA desce. Um app.js antigo que pedisse a versão 1 a um banco
   * já na 2 receberia VersionError e não abriria os dados dela: desfazer este
   * release é republicar o código antigo COM VERSAO_BANCO = 2.
   *
   * Versão 3 (C2a, Minhas listas): de novo só CRIA o que falta, o depósito
   * biblioteca_listas. Desfazer este release é republicar o código antigo COM
   * VERSAO_BANCO = 3.
   *
   * Versão 4 (C15.1, livros): de novo só CRIA o que falta, os depósitos livros
   * e livros_posicoes. Desfazer este release é republicar o código antigo COM
   * VERSAO_BANCO = 4.
   *
   * Versão 5 (N1, fase 1 da nuvem, fatia 1): cria `registros` e `controle` e,
   * NA MESMA transação de versão, lê `dados/principal` e grava um registro por
   * item (migrarParaRegistros). Se qualquer passo falhar, a transação de
   * versão aborta inteira e o banco fica na 4, intacto. O `principal` não é
   * apagado nem deixa de ser gravado: desfazer este release é republicar o
   * código antigo COM VERSAO_BANCO = 5, e ele lê o `principal` atual.
   *
   * Versão 6 (N1, fatia 2): só CRIA o depósito `saida`, a fila do que ainda
   * não subiu para a nuvem registro a registro, e a semeia com todo registro
   * vivo sincronizável (o primeiro envio leva o banco inteiro). Desfazer este
   * release é republicar o código antigo COM VERSAO_BANCO = 6.
   *
   * E A VOLTA DEPOIS DO ROLLBACK: o código antigo republicado com o número
   * novo abre, num aparelho que nunca passou por aqui, um banco nessa versão
   * SEM os depósitos novos. Quando este código volta, o onupgradeneeded não
   * roda (a versão já é a dele). Por isso o abrir sonda o banco sem versão,
   * vê que falta depósito e reabre com a versão mais um, criando o que falta e
   * migrando a partir do `principal` (ver abrir). */
  var VERSAO_BANCO = 6;
  /* Depósitos que nunca saem do tablet: nem na cópia de segurança nem na
   * nuvem. Quem for copiar ou sincronizar depósitos lê esta lista. */
  var SO_DESTE_TABLET = ['livros', 'livros_posicoes'];
  var MAX_HISTORICO = 25;

  /* Chave das miniaturas da biblioteca dentro de 'midias'. Elas são cache
   * refeito a partir do SVG do pacote: ficam fora da cópia de segurança e da
   * limpeza de órfãos, e somem quando o pacote é substituído. */
  var PREFIXO_MINIATURA = 'bib:';

  var bancoAberto = null;
  /* O navegador avisa o bloqueio uma vez só, e ele pode chegar antes de o
   * app.js rodar: o nuvem.js já pede o banco enquanto a página carrega. Fica
   * guardado aqui, e o app.js pergunta quando entra (Store.bancoBloqueado). */
  var bancoBloqueadoAgora = false;
  // o mesmo vale para a troca de versão por outra janela (C2a): Store.bancoTrocado
  var bancoTrocadoAgora = false;
  function avisarBloqueio() {
    bancoBloqueadoAgora = true;
    if (typeof root.aoBancoBloqueado === 'function') root.aoBancoBloqueado();
  }

  /* Os depósitos que este código precisa encontrar abertos. Quem faltar é
   * criado na transação de versão (criarDepositos) ou, se o banco já está na
   * versão deste código sem eles, pela cura do abrir (ver lá). */
  var DEPOSITOS = ['dados', 'notas', 'midias', 'anexos', 'historico', 'biblioteca_pacotes', 'biblioteca_itens',
    'biblioteca_teoria', 'biblioteca_assets', 'biblioteca_uso', 'biblioteca_etiquetas', 'biblioteca_listas',
    'livros', 'livros_posicoes', 'registros', 'controle', 'saida'];
  function depositosQueFaltam(b) {
    return DEPOSITOS.filter(function (n) { return !b.objectStoreNames.contains(n); });
  }
  /* Cria o que falta e devolve os nomes criados, para a migração saber o que
   * acabou de nascer. */
  function criarDepositos(b) {
    var criados = depositosQueFaltam(b);
    if (!b.objectStoreNames.contains('dados')) b.createObjectStore('dados');
    if (!b.objectStoreNames.contains('notas')) b.createObjectStore('notas');
    if (!b.objectStoreNames.contains('midias')) b.createObjectStore('midias');
    if (!b.objectStoreNames.contains('anexos')) b.createObjectStore('anexos');
    if (!b.objectStoreNames.contains('historico')) {
      b.createObjectStore('historico', { keyPath: 'id', autoIncrement: true });
    }
    var s;
    if (!b.objectStoreNames.contains('biblioteca_pacotes')) {
      b.createObjectStore('biblioteca_pacotes', { keyPath: 'pacote' });
    }
    if (!b.objectStoreNames.contains('biblioteca_itens')) {
      s = b.createObjectStore('biblioteca_itens', { keyPath: 'id' });
      s.createIndex('serie', 'serie');
      s.createIndex('modulo', 'modulo.slug');
      s.createIndex('tema_app', 'tema_app');
      s.createIndex('pacote', 'pacote');
    }
    if (!b.objectStoreNames.contains('biblioteca_teoria')) {
      s = b.createObjectStore('biblioteca_teoria', { keyPath: 'id' });
      s.createIndex('pacote', 'pacote');
    }
    if (!b.objectStoreNames.contains('biblioteca_assets')) {
      s = b.createObjectStore('biblioteca_assets', { keyPath: 'chave' });
      s.createIndex('pacote', 'pacote');
    }
    if (!b.objectStoreNames.contains('biblioteca_uso')) {
      s = b.createObjectStore('biblioteca_uso', { keyPath: 'id', autoIncrement: true });
      s.createIndex('itemId', 'itemId');
      s.createIndex('alunoId', 'alunoId');
    }
    if (!b.objectStoreNames.contains('biblioteca_etiquetas')) {
      b.createObjectStore('biblioteca_etiquetas', { keyPath: 'itemId' });
    }
    if (!b.objectStoreNames.contains('biblioteca_listas')) {
      b.createObjectStore('biblioteca_listas', { keyPath: 'id' });
    }
    if (!b.objectStoreNames.contains('livros')) {
      s = b.createObjectStore('livros', { keyPath: 'id' });
      s.createIndex('pacote', 'pacote');
    }
    if (!b.objectStoreNames.contains('livros_posicoes')) {
      b.createObjectStore('livros_posicoes', { keyPath: 'id' });
    }
    if (!b.objectStoreNames.contains('registros')) {
      s = b.createObjectStore('registros', { keyPath: 'id' });
      s.createIndex('tipo', 'tipo');
      s.createIndex('atualizadoEm', 'atualizadoEm');
    }
    if (!b.objectStoreNames.contains('controle')) b.createObjectStore('controle');
    if (!b.objectStoreNames.contains('saida')) b.createObjectStore('saida', { keyPath: 'id' });
    return criados;
  }

  /* A migração para os registros, dentro da transação de versão `t`, guiada
   * pelo que ACABOU DE SER CRIADO (e não pelo número da versão, porque a cura
   * do abrir também passa por aqui):
   *   - nasceu `registros`: o documento inteiro vira um registro por item,
   *     todos com atualizadoEm igual ao instante da migração e `ordem` igual à
   *     posição no vetor, e cada um entra na fila; o `principal` fica como
   *     está (ele mesmo é o retrato);
   *   - nasceu só `saida` (a subida 5 para 6): a fila é semeada com todo
   *     registro vivo sincronizável, para o primeiro envio por registro levar
   *     o que já estava no aparelho.
   * Banco novo (de 0) não tem `principal`, e nada é migrado. */
  function migrarParaRegistros(t, criados) {
    if (criados.indexOf('registros') >= 0) {
      var agora = new Date().toISOString();
      var pedido = t.objectStore('dados').get('principal');
      pedido.onsuccess = function () {
        if (!pedido.result) return;
        // a diferença contra um depósito vazio: cada item entra em registros E na fila
        escreverDiferenca(t, pedido.result, { carimbo: agora, semPrincipal: true });
      };
      return;
    }
    if (criados.indexOf('saida') >= 0) semearFila(t);
  }
  /* A subida 5 para 6: a fila nasce com todo registro vivo sincronizável, para
   * o primeiro envio por registro levar o que já estava no aparelho. */
  function semearFila(t) {
    var saida = t.objectStore('saida');
    var todos = t.objectStore('registros').getAll();
    todos.onsuccess = function () {
      (todos.result || []).forEach(function (r) {
        if (r.apagadoEm || !sincronizavel(r.id, r.tipo)) return;
        enfileirar(saida, { id: r.id, tipo: r.tipo, atualizadoEm: r.atualizadoEm, apagadoEm: null });
      });
    };
  }

  /* ABRIR, EM DOIS TEMPOS. Primeiro uma sonda SEM versão, que abre o banco como
   * ele está (um banco que não existe nasce vazio, na versão 1) e diz a versão
   * e os depósitos. Se a versão é a deste código ou maior E todo depósito que
   * este código precisa está lá, essa conexão serve. Senão ela fecha e a
   * abertura de verdade pede a versão deste código ou, quando o banco já está
   * nela (ou acima) e mesmo assim falta depósito, a versão dele mais um: a
   * transação de versão cria o que falta e migra a partir do `principal`.
   *
   * É A CURA DO ROLLBACK (segunda mão do #116): o código da versão 4
   * republicado com VERSAO_BANCO = 5 ou 6 abre um banco novo nessa versão sem
   * `registros`, `controle` nem `saida`; quando este código volta, o
   * onupgradeneeded não roda (a versão já é a dele) e, sem a cura, toda
   * leitura cairia em NotFoundError para sempre. Depois da cura o banco pode
   * ficar numa versão acima de VERSAO_BANCO; a sonda sem versão não se importa.
   * Só o código antigo, que pede a versão dele, veria VersionError num segundo
   * rollback: nesse caso é republicar o antigo com o número que a tela disser. */
  function abrir() {
    if (bancoAberto) return Promise.resolve(bancoAberto);
    return new Promise(function (resolve, reject) {
      var sonda = indexedDB.open(NOME_BANCO);
      sonda.onblocked = avisarBloqueio;
      sonda.onerror = function () { reject(sonda.error); };
      sonda.onsuccess = function () {
        var b = sonda.result;
        var faltam = depositosQueFaltam(b);
        if (b.version >= VERSAO_BANCO && !faltam.length) { adotar(b); return; }
        var alvo = b.version >= VERSAO_BANCO ? b.version + 1 : VERSAO_BANCO;
        b.close();
        abrirNaVersao(alvo);
      };
      function abrirNaVersao(alvo) {
        var req = indexedDB.open(NOME_BANCO, alvo);
        req.onupgradeneeded = function (e) {
          var criados = criarDepositos(e.target.result);
          migrarParaRegistros(e.target.transaction, criados);
        };
        /* Outra janela do aplicativo, ainda na versão antiga, segura o banco na
         * versão 1: a subida espera ela fechar. Sem aviso, a tela ficaria em
         * branco sem motivo aparente; quem mostra o aviso é o app.js. */
        req.onblocked = avisarBloqueio;
        req.onsuccess = function () { adotar(req.result); };
        /* CÓDIGO MAIS VELHO QUE O BANCO (C2a): o banco já está numa versão maior
         * que a deste código (outra janela subiu no meio). O navegador recusa com
         * VersionError, e a tela tem de dizer o que fazer, e não mostrar a
         * mensagem técnica. */
        req.onerror = function () {
          var e = req.error;
          if (e && e.name === 'VersionError') {
            reject(Object.assign(new Error('O banco do aparelho é de uma versão mais nova do aplicativo.'),
              { versaoNova: true, causa: e }));
            return;
          }
          reject(e);
        };
      }
      function adotar(conexao) {
        bancoAberto = conexao;
        /* Uma aba com a versão nova do aplicativo pede para subir o banco:
         * esta conexão sai do caminho em vez de travar a outra. */
        conexao.onversionchange = function () {
          conexao.close();
          if (bancoAberto === conexao) bancoAberto = null;
          /* E AVISA (C2a): esta janela fica com o código de antes, e a próxima
           * gravação dela abriria o banco numa versão que não existe mais. */
          bancoTrocadoAgora = true;
          if (typeof root.aoBancoTrocado === 'function') root.aoBancoTrocado();
        };
        bancoBloqueadoAgora = false;
        if (typeof root.aoBancoLiberado === 'function') root.aoBancoLiberado();
        resolve(conexao);
      }
    });
  }

  /* O CELULAR SÓ LÊ (D6, parte 1). Toda transação do banco nasce aqui, e uma
   * de escrita é recusada enquanto o aparelho está só lendo. A única exceção
   * é a restauração da cópia que vem da nuvem (importarZip com daNuvem), que
   * é como os dados do tablet chegam ao celular. Uma trava num lugar só, e não
   * em cada botão: se algum caminho de edição escapar da tela do celular, ele
   * bate aqui e não grava.
   *
   * O CELULAR DA DONA EDITA (D6, parte 2): a mesma conta do tablet, com a marca
   * "este aparelho é celular". Ele continua sendo um aparelho que só lê para
   * tudo o que não é dele (folhas, anexos, biblioteca, livros, importar,
   * "Apagar tudo", a reconciliação da abertura) e ganha três portas, e só
   * três: o documento pelo escritor de diferença (o salvar, que enfileira na
   * mesma transação), a fila de saída (o envio tira dela o que subiu) e o
   * histórico (o ponto do Desfazer). O que o celular edita é decidido na tela
   * (as quatro ações); aqui fica a porta. O observador de outra conta nunca
   * ganha as portas. */
  var soLeitura = false;
  var celularEdita = false;
  function somenteLeitura(ligar) { soLeitura = !!ligar; }
  function celularQueEdita(ligar) { celularEdita = !!ligar; }
  var PORTAS_DO_CELULAR = { documento: true, fila: true, historico: true };
  function erroSoLeitura() {
    return Object.assign(new Error('Este aparelho só lê. Para mudar alguma coisa, use o tablet.'), { soLeitura: true });
  }
  /* `porta`: true é a restauração da cópia e o recebimento (dado que vem da
   * nuvem); 'documento', 'fila' e 'historico' são as portas do celular da dona. */
  function transacao(b, nomes, modo, porta) {
    if (modo === 'readwrite' && soLeitura && porta !== true && !(celularEdita && PORTAS_DO_CELULAR[porta])) throw erroSoLeitura();
    return b.transaction(nomes, modo);
  }

  function trans(deposito, modo) {
    return abrir().then(function (b) {
      return transacao(b, deposito, modo).objectStore(deposito);
    });
  }

  function comoPromessa(req) {
    return new Promise(function (resolve, reject) {
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  /* TODA escrita simples passa por aqui, e só responde quando a TRANSAÇÃO
   * confirma.
   *
   * Antes, gravar e apagar respondiam no `onsuccess` do pedido. Esse evento diz
   * que o pedido foi aceito, e não que a transação confirmou: entre ele e o
   * `oncomplete` há uns milissegundos em que a página ainda pode morrer (aba
   * fechada, tablet matando o aplicativo em segundo plano), e aí a transação
   * aborta e a escrita some, depois de o aplicativo já ter seguido como se
   * estivesse salvo. Medido em 24/09: 7 perdas em 300 cortes com a resposta no
   * pedido, 0 em 300 esperando a transação confirmar.
   *
   * Por isso a promessa resolve em `t.oncomplete` e rejeita em `t.onerror` ou
   * `t.onabort`, e nunca no evento do pedido. O resultado do pedido (a chave
   * gerada por um `add`, por exemplo) continua sendo o valor devolvido.
   *
   * E A REJEIÇÃO AGORA EXISTE DE VERDADE: quem chama tem de tratar. O motivo
   * vem primeiro da TRANSAÇÃO, porque é nela que o navegador põe o útil (falta
   * de espaço é um QuotaExceededError da transação, e não do pedido). */
  function escrever(deposito, fazer, porta) {
    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var t = transacao(b, deposito, 'readwrite', porta);
        var req = fazer(t.objectStore(deposito));
        var motivo = function (padrao) {
          return t.error || (req && req.error) || new Error(padrao);
        };
        t.oncomplete = function () { avisarMudanca(deposito); resolve(req ? req.result : undefined); };
        t.onerror = function () { reject(motivo('A gravação falhou.')); };
        t.onabort = function () { reject(motivo('A gravação foi interrompida.')); };
      });
    });
  }

  /* Quem quiser saber que algo DELA mudou no aparelho (a cópia na nuvem, N0)
   * se inscreve aqui. Avisa depois de a transação confirmar, e só para o que
   * vai na cópia: o histórico de desfazer e o que é só deste tablet ficam de
   * fora, senão abrir um livro faria a cópia subir de novo. */
  var ouvintesDeMudanca = [];
  var FORA_DA_COPIA = ['historico', 'biblioteca_pacotes', 'biblioteca_itens', 'biblioteca_teoria', 'biblioteca_assets'];
  function aoMudar(fn) { ouvintesDeMudanca.push(fn); }
  function avisarMudanca(deposito) {
    var nomes = Array.isArray(deposito) ? deposito : [deposito];
    var conta = nomes.some(function (n) {
      return FORA_DA_COPIA.indexOf(n) < 0 && SO_DESTE_TABLET.indexOf(n) < 0;
    });
    if (!conta) return;
    ouvintesDeMudanca.forEach(function (fn) { try { fn(nomes); } catch (e) { /* o ouvinte se vira */ } });
  }

  function ler(deposito, chave) {
    return trans(deposito, 'readonly').then(function (s) { return comoPromessa(s.get(chave)); });
  }
  function gravar(deposito, chave, valor) {
    return escrever(deposito, function (s) { return s.put(valor, chave); });
  }
  function apagar(deposito, chave, porta) {
    return escrever(deposito, function (s) { return s.delete(chave); }, porta);
  }
  function esvaziar(deposito) {
    return escrever(deposito, function (s) { return s.clear(); });
  }
  function todasAsChaves(deposito) {
    return trans(deposito, 'readonly').then(function (s) { return comoPromessa(s.getAllKeys()); });
  }
  function todosOsValores(deposito) {
    return trans(deposito, 'readonly').then(function (s) { return comoPromessa(s.getAll()); });
  }

  // ---------- dados principais ----------

  function bancoVazio() {
    return { versao: 1, alunos: [], series: [], aulas: [], resumos: [], ajustes: {}, pagamentos: [] };
  }

  /* Completa campos que possam faltar em bases antigas. Vale para o que vem do
   * disco e também para o que vem de uma cópia de segurança e do "Voltar a este
   * ponto": cópia feita antes do "pago em" (C4) não tem `pagamentos`, e lê como
   * lista vazia em vez de quebrar a tela do Fechamento. */
  function completar(d) {
    d.alunos = d.alunos || [];
    d.series = d.series || [];
    d.aulas = d.aulas || [];
    d.resumos = d.resumos || [];
    d.ajustes = d.ajustes || {};
    if (!Array.isArray(d.pagamentos)) d.pagamentos = [];
    return d;
  }

  // ---------- registros: um por item (versão 5, N1 fatia 1) ----------

  var ESQUEMA_REGISTRO = 1;
  /* Chaves de `ajustes` que são DESTE APARELHO, e não dela: ficam no banco e
   * na cópia como sempre, mas a sincronização (fatia 2) não as põe na fila.
   * Lista explícita, por decisão (sincronizacao.md, 5.4): o que está fora
   * dela sincroniza. */
  var AJUSTES_DO_APARELHO = ['versaoVista', 'painelValoresAberto', 'valoresOcultos', 'ultimaCopia', 'ibge'];
  /* vetor do documento -> tipo do registro, e a volta */
  var VETORES = { alunos: 'aluno', series: 'serie', aulas: 'aula', resumos: 'resumo', pagamentos: 'pagamento' };
  var VETOR_DO_TIPO = {};
  Object.keys(VETORES).forEach(function (v) { VETOR_DO_TIPO[VETORES[v]] = v; });

  var aparelhoId = null;      // o id deste aparelho, lido ou criado na primeira gravação
  var ultimaGravacao = null;  // { gravados, lapides, iguais } da última escrita de diferença

  function novoIdAparelho() {
    var r = new Uint8Array(6), s = '';
    (typeof crypto !== 'undefined' && crypto.getRandomValues) ? crypto.getRandomValues(r)
      : r.forEach(function (_, i) { r[i] = Math.floor(Math.random() * 256); });
    for (var i = 0; i < r.length; i++) s += (r[i] < 16 ? '0' : '') + r[i].toString(16);
    return 'ap' + s;
  }

  /* A chave do registro leva o tipo na frente, para tipos nunca colidirem e
   * para já servir de nome de documento na nuvem. Resumo não tem id: a chave
   * é aluno e mês. Uma chave que se repetir dentro do mesmo documento (dois
   * itens sem id, dois resumos do mesmo mês) ganha um sufixo, determinístico
   * pela ordem do vetor: nenhum item é perdido por colisão. */
  function chaveDoItem(tipo, item, usadas) {
    var base = tipo === 'resumo'
      ? 'resumo:' + (item && item.alunoId != null ? item.alunoId : '') + ':' + (item && item.mes != null ? item.mes : '')
      : tipo + ':' + (item && item.id != null ? item.id : '');
    var chave = base, n = 2;
    while (usadas[chave]) chave = base + '#' + (n++);
    usadas[chave] = true;
    return chave;
  }

  /* O documento inteiro desmontado: { itens: { chave: { tipo, dados } }, ordem: [chave...] }.
   * Vetores conhecidos, depois cada chave de `ajustes`, depois o que sobrar
   * na raiz (`versao`), para nenhum campo do documento ficar de fora. */
  function desmontar(db) {
    var itens = {}, grupos = [], usadas = {};
    Object.keys(VETORES).forEach(function (vetor) {
      var tipo = VETORES[vetor], chaves = [];
      (Array.isArray(db[vetor]) ? db[vetor] : []).forEach(function (item) {
        var chave = chaveDoItem(tipo, item, usadas);
        itens[chave] = { tipo: tipo, dados: item };
        chaves.push(chave);
      });
      grupos.push(chaves);
    });
    var ajustes = [];
    Object.keys(db.ajustes || {}).forEach(function (k) {
      if (db.ajustes[k] === undefined) return;
      itens['ajuste:' + k] = { tipo: 'ajuste', dados: db.ajustes[k] };
      ajustes.push('ajuste:' + k);
    });
    grupos.push(ajustes);
    var raiz = [];
    Object.keys(db).forEach(function (k) {
      if (VETORES[k] || k === 'ajustes' || db[k] === undefined) return;
      itens['raiz:' + k] = { tipo: 'raiz', dados: db[k] };
      raiz.push('raiz:' + k);
    });
    grupos.push(raiz);
    return { itens: itens, grupos: grupos };
  }

  /* A `ordem` de cada chave de um grupo (um vetor, as chaves de ajustes, a
   * raiz), na ordem em que o documento foi salvo. Quem já tem ordem, e ela
   * cresce em relação à do item anterior, fica com a sua e não é regravado
   * por isso: apagar um item não toca os vizinhos. Quem nasce, revive ou está
   * fora de ordem recebe um número entre a ordem anterior e a próxima que
   * ainda vale (um item encaixado no meio custa um registro). Assim o montar
   * devolve cada vetor exatamente na ordem do documento salvo. Se a precisão
   * do meio se esgotar, segue com inteiros e os seguintes se ajustam. */
  function ordensDoGrupo(chaves, porId) {
    var atuais = chaves.map(function (c) {
      var r = porId[c];
      return r && typeof r.ordem === 'number' && isFinite(r.ordem) ? r.ordem : null;
    });
    /* Quem fica com a ordem que tem: a maior sequência crescente das ordens
     * existentes (um item movido para a frente regrava só ele, e não todos os
     * que ficaram atrás). */
    var mantidos = maiorSequenciaCrescente(atuais);
    var proximaMantida = new Array(chaves.length), prox = null;
    for (var k = chaves.length - 1; k >= 0; k--) {
      proximaMantida[k] = prox;
      if (mantidos[k]) prox = atuais[k];
    }
    var saida = [], ultima = -Infinity;
    for (var i = 0; i < chaves.length; i++) {
      var o;
      if (mantidos[i] && atuais[i] > ultima) o = atuais[i];
      else {
        var proxima = proximaMantida[i];
        if (proxima !== null && proxima <= ultima) proxima = null;
        if (proxima === null) o = ultima === -Infinity ? 0 : Math.floor(ultima) + 1;
        else if (ultima === -Infinity) o = proxima - 1;
        else o = (ultima + proxima) / 2;
        if (!(o > ultima && (proxima === null || o < proxima))) o = ultima + 1;
      }
      saida.push(o);
      ultima = o;
    }
    return saida;
  }
  /* Índices da maior subsequência estritamente crescente dos valores (null não
   * conta). Pilhas de paciência com antecessor: O(n log n). */
  function maiorSequenciaCrescente(valores) {
    var topos = [], indices = [], anterior = {};
    for (var i = 0; i < valores.length; i++) {
      var v = valores[i];
      if (v === null) continue;
      var lo = 0, hi = topos.length;
      while (lo < hi) { var m = (lo + hi) >> 1; if (topos[m] < v) lo = m + 1; else hi = m; }
      topos[lo] = v; indices[lo] = i;
      anterior[i] = lo > 0 ? indices[lo - 1] : -1;
    }
    var mantidos = {};
    var k = topos.length ? indices[topos.length - 1] : -1;
    while (k >= 0) { mantidos[k] = true; k = anterior[k]; }
    return mantidos;
  }

  /* A volta: os registros vivos, na ordem gravada, montam o documento no
   * formato de sempre. Lápide fica de fora. */
  function montar(registros) {
    var db = { alunos: [], series: [], aulas: [], resumos: [], ajustes: {}, pagamentos: [] };
    var vivos = (registros || []).filter(function (r) { return r && !r.apagadoEm; });
    vivos.sort(function (a, b) {
      return ((a.ordem || 0) - (b.ordem || 0)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    });
    vivos.forEach(function (r) {
      var vetor = VETOR_DO_TIPO[r.tipo];
      if (vetor) db[vetor].push(r.dados);
      else if (r.tipo === 'ajuste') db.ajustes[r.id.slice('ajuste:'.length)] = r.dados;
      else if (r.tipo === 'raiz') db[r.id.slice('raiz:'.length)] = r.dados;
    });
    return db;
  }

  /* A assinatura do `principal`: tamanho e FNV-1a do JSON. Serve para saber,
   * na abertura, se os registros espelham o `principal` que está no disco ou
   * se alguém (o código antigo, uma prova) gravou o `principal` por fora. */
  function hashTexto(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }
  function assinatura(db) {
    var s = JSON.stringify(db);
    return { tamanho: s.length, hash: hashTexto(s) };
  }
  function mesmaAssinatura(a, b) {
    return !!a && !!b && a.tamanho === b.tamanho && a.hash === b.hash;
  }

  /* Compara o documento com os registros que estão no disco e grava SÓ A
   * DIFERENÇA no depósito `deposito`:
   *   - item que mudou ou nasceu: registro vivo com atualizadoEm = agora;
   *   - item que sumiu: lápide (apagadoEm = agora, dados null);
   *   - item igual: não é tocado.
   * A comparação é pelo texto JSON de cada item e pela `ordem` (ordensDoGrupo):
   * um item igual, na mesma posição relativa, não é tocado. Devolve as contas. */
  function aplicarDiferenca(deposito, saida, existentes, db, agora, aparelho, restauro) {
    var porId = {};
    existentes.forEach(function (r) { porId[r.id] = r; });
    var novo = desmontar(db);
    var contas = { gravados: 0, lapides: 0, iguais: 0, enfileirados: 0 };
    function gravarRegistro(reg) {
      deposito.put(reg);
      if (saida && sincronizavel(reg.id, reg.tipo)) {
        var entrada = { id: reg.id, tipo: reg.tipo, atualizadoEm: reg.atualizadoEm, apagadoEm: reg.apagadoEm };
        // a entrada da restauração só vence na nuvem o que for mais velho que a cópia (fatia 3)
        if (restauro) entrada.restauro = true;
        enfileirar(saida, entrada);
        contas.enfileirados++;
      }
    }
    novo.grupos.forEach(function (chaves) {
      var ordens = ordensDoGrupo(chaves, porId);
      chaves.forEach(function (chave, i) {
        var item = novo.itens[chave];
        var texto = JSON.stringify(item.dados);
        if (texto === undefined) return;
        var antes = porId[chave], ordem = ordens[i];
        if (antes && !antes.apagadoEm && antes.ordem === ordem && JSON.stringify(antes.dados) === texto) {
          contas.iguais++;
          /* Na RESTAURAÇÃO o item igual à cópia também entra na fila: a restauração
           * vence em todos os registros, e um registro que este aparelho não
           * subisse perderia para a edição posterior do outro. */
          if (restauro && saida && sincronizavel(chave, item.tipo)) {
            enfileirar(saida, { id: chave, tipo: item.tipo, atualizadoEm: antes.atualizadoEm, apagadoEm: null, restauro: true });
            contas.enfileirados++;
          }
          return;
        }
        // `nuvem` (o carimbo do servidor que este aparelho conhece, fatia 3) fica com o registro
        gravarRegistro({ id: chave, tipo: item.tipo, atualizadoEm: agora, apagadoEm: null, aparelho: aparelho,
          esquema: ESQUEMA_REGISTRO, ordem: ordem, dados: item.dados, nuvem: antes && antes.nuvem ? antes.nuvem : null });
        contas.gravados++;
      });
    });
    existentes.forEach(function (r) {
      /* Na RESTAURAÇÃO, a lápide que já existia e não está na cópia também entra
       * na fila: a restauração vence em todos os registros, inclusive os que o
       * "Apagar tudo" já tinha apagado aqui sem avisar a nuvem. */
      if (restauro && r.apagadoEm && !novo.itens[r.id] && saida && sincronizavel(r.id, r.tipo)) {
        // só a lápide que o servidor ainda não tem como lápide: a já enviada não volta à fila
        if (!(r.nuvem && r.nuvem.apagado)) {
          enfileirar(saida, { id: r.id, tipo: r.tipo, atualizadoEm: r.atualizadoEm, apagadoEm: r.apagadoEm, restauro: true });
          contas.enfileirados++;
        }
        return;
      }
      if (r.apagadoEm || novo.itens[r.id]) return;
      gravarRegistro({ id: r.id, tipo: r.tipo, atualizadoEm: agora, apagadoEm: agora, aparelho: aparelho,
        esquema: r.esquema || ESQUEMA_REGISTRO, ordem: r.ordem, dados: null, nuvem: r.nuvem || null });
      contas.lapides++;
    });
    return contas;
  }

  /* O que sobe para a nuvem registro a registro (N1, fatia 2): alunos, séries,
   * aulas, resumos, pagamentos e os ajustes que são dela. Os ajustes do
   * aparelho ficam, e a raiz do documento (`versao`) é estrutura, não dado. */
  function sincronizavel(id, tipo) {
    if (tipo === 'raiz') return false;
    if (tipo === 'ajuste') return AJUSTES_DO_APARELHO.indexOf(id.slice('ajuste:'.length)) < 0;
    return true;
  }
  /* A FILA ENTRA NA MESMA TRANSAÇÃO DO DADO: a entrada é um pedido na
   * transação `saida` de quem chamou, nunca uma transação à parte. Abortou o
   * dado, não há fila; confirmou o dado, a fila está lá. Uma entrada por id (a
   * segunda edição do mesmo item substitui a primeira, e o envio leva o
   * registro como estiver). */
  function enfileirar(saida, entrada) { saida.put(entrada); }

  /* TODA gravação do documento passa por aqui, dentro da transação `t` (que
   * tem 'dados', 'registros' e 'controle'): grava o `principal` inteiro (o
   * retrato de segurança), a diferença em `registros` e o `retrato` em
   * `controle`, tudo na mesma transação, que confirma ou aborta inteira.
   * Encadeado por eventos, sem Promise no meio: um await soltaria a
   * transação. `opcoes.carimbo` é o atualizadoEm a usar (a restauração de uma
   * cópia usa o `quando` dela); `opcoes.semPrincipal` é da migração, em que o
   * `principal` já está no disco; `opcoes.semFila` é da restauração da cópia
   * que veio da nuvem (o aparelho que a fez já tinha enviado os registros).
   * `depois` recebe as contas. */
  function escreverDiferenca(t, db, opcoes, depois) {
    opcoes = opcoes || {};
    var agora = opcoes.carimbo || new Date().toISOString();
    var controle = t.objectStore('controle');
    var registros = t.objectStore('registros');
    var saida = opcoes.semFila ? null : t.objectStore('saida');
    /* Com a sincronização DESLIGADA (o "Apagar tudo"), nada do que nasce
     * aqui entra na fila: o banco vazio que ela refaz não pode subir por
     * registro quando religar. A restauração é a exceção (ela religa). */
    var pedidoMarca = controle.get('sincronizacao');
    var desligada = false;
    pedidoMarca.onsuccess = function () { desligada = !!(pedidoMarca.result && pedidoMarca.result.desligada); };
    var pedidoAparelho = controle.get('aparelho');
    pedidoAparelho.onsuccess = function () {
      var ap = pedidoAparelho.result;
      if (!ap) { ap = novoIdAparelho(); controle.put(ap, 'aparelho'); }
      if (desligada && !opcoes.restauro) saida = null;
      var todos = registros.getAll();
      todos.onsuccess = function () {
        var contas;
        /* O `principal` é o ÚLTIMO pedido: o tablet sem espaço (e a prova que
         * o simula abortando a transação nesse put) não deixa pedido nenhum
         * para fazer numa transação já morta. Se mesmo assim um pedido cair em
         * transação encerrada, a transação já abortou e o `onabort` de quem
         * chamou responde: nada a fazer aqui, e nada a espalhar como erro. */
        try {
          contas = aplicarDiferenca(registros, saida, todos.result || [], db, agora, ap, !!opcoes.restauro);
          // a restauração que vem da nuvem recomeça o recebimento do zero: o cursor sai
          if (opcoes.restauro) controle.delete('cursor');
          controle.put({ quando: agora, esquema: VERSAO_BANCO, assinatura: assinatura(db) }, 'retrato');
          if (!opcoes.semPrincipal) t.objectStore('dados').put(db, 'principal');
        } catch (e) {
          if (!e || (e.name !== 'TransactionInactiveError' && e.name !== 'InvalidStateError')) throw e;
          return;
        }
        contas.aparelho = ap;
        if (depois) depois(contas);
      };
    };
  }

  var DEPOSITOS_DO_DOCUMENTO = ['dados', 'registros', 'controle', 'saida'];

  // ---------- a fila de saída (N1, fatia 2) ----------

  /* As entradas da fila com os registros delas, até `limite`, para o envio.
   * Uma transação só de leitura sobre os dois depósitos: o registro lido é o
   * que a fila aponta, no instante da leitura. */
  function registrosDaFila(limite) {
    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var t = transacao(b, ['saida', 'registros'], 'readonly');
        var saida = [];
        var fila = t.objectStore('saida').getAll();
        fila.onsuccess = function () {
          // a quarentena fica de fora: o resto da fila não espera por ela
          (fila.result || []).filter(function (e) { return !e.quarentena; }).slice(0, limite || 200).forEach(function (entrada) {
            var pedido = t.objectStore('registros').get(entrada.id);
            pedido.onsuccess = function () {
              if (pedido.result) saida.push({ fila: entrada, registro: pedido.result });
              else saida.push({ fila: entrada, registro: null });
            };
          });
        };
        t.oncomplete = function () { resolve(saida); };
        t.onerror = function () { reject(t.error || new Error('A leitura falhou.')); };
        t.onabort = function () { reject(t.error || new Error('A leitura foi interrompida.')); };
      });
    });
  }
  /* Tira da fila o que subiu, e SÓ se a entrada ainda for a mesma que subiu
   * (mesmo atualizadoEm): uma edição feita durante o envio deixa uma entrada
   * mais nova, que fica para o próximo. Devolve quantas saíram. */
  function confirmarEnvio(itens) {
    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var t = transacao(b, ['saida', 'registros'], 'readwrite', 'fila');
        var s = t.objectStore('saida'), registros = t.objectStore('registros'), tiradas = 0;
        (itens || []).forEach(function (item) {
          var pedido = s.get(item.id);
          pedido.onsuccess = function () {
            var atual = pedido.result;
            if (atual && atual.atualizadoEm === item.atualizadoEm) { s.delete(item.id); tiradas++; }
          };
          /* O carimbo do servidor que o commit devolveu fica no registro: é a
           * precondição do próximo envio e o desempate do recebimento (fatia 3). */
          if (item.nuvem) {
            var reg = registros.get(item.id);
            reg.onsuccess = function () {
              if (!reg.result) return;
              // `apagado`: o servidor ficou com uma lápide (a restauração não a reenfileira à toa)
              reg.result.nuvem = { updateTime: item.nuvem.updateTime || null, servidorEm: item.nuvem.servidorEm || null, apagado: !!item.apagadoEm };
              registros.put(reg.result);
            };
          }
        });
        t.oncomplete = function () { resolve(tiradas); };
        t.onerror = function () { reject(t.error || new Error('A gravação falhou.')); };
        t.onabort = function () { reject(t.error || new Error('A gravação foi interrompida.')); };
      });
    });
  }
  /* Quantas esperam para subir e quantas estão em quarentena. */
  function estadoDaFila() {
    return todosOsValores('saida').then(function (lista) {
      var q = (lista || []).filter(function (e) { return !!e.quarentena; }).length;
      return { pendentes: (lista || []).length - q, quarentena: q };
    });
  }
  function tamanhoDaFila() {
    return estadoDaFila().then(function (e) { return e.pendentes; });
  }
  /* A entrada que a nuvem recusou sozinha (a regra ou o teto de 1 MiB) ganha
   * uma tentativa; na terceira vai para a quarentena, e deixa de entrar nos
   * lotes, para não derrubar o commit dos outros para sempre. Uma edição nova
   * do mesmo item regrava a entrada (enfileirar) e a tira da quarentena. */
  var TENTATIVAS_ATE_QUARENTENA = 3;
  /* O reteste: a quarentena volta para a fila UMA vez (a entrada fica marcada
   * como retestada e não volta de novo sozinha; só uma edição nova a regrava).
   * Devolve quantas voltaram. */
  function soltarQuarentena(ids) {
    var so = ids ? {} : null;
    (ids || []).forEach(function (id) { so[id] = true; });
    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var t = transacao(b, 'saida', 'readwrite', 'fila');
        var s = t.objectStore('saida'), soltas = 0;
        var todos = s.getAll();
        todos.onsuccess = function () {
          (todos.result || []).forEach(function (e) {
            if (!e.quarentena || e.retestada || (so && !so[e.id])) return;
            e.quarentena = false;
            e.retestada = true;
            s.put(e);
            soltas++;
          });
        };
        t.oncomplete = function () { resolve(soltas); };
        t.onerror = function () { reject(t.error || new Error('A gravação falhou.')); };
        t.onabort = function () { reject(t.error || new Error('A gravação foi interrompida.')); };
      });
    });
  }
  function marcarTentativa(ids) {
    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var t = transacao(b, 'saida', 'readwrite', 'fila');
        var s = t.objectStore('saida'), quarentena = 0;
        (ids || []).forEach(function (id) {
          var pedido = s.get(id);
          pedido.onsuccess = function () {
            var e = pedido.result;
            if (!e) return;
            e.tentativas = (e.tentativas || 0) + 1;
            if (e.tentativas >= TENTATIVAS_ATE_QUARENTENA) { e.quarentena = true; quarentena++; }
            s.put(e);
          };
        });
        t.oncomplete = function () { resolve(quarentena); };
        t.onerror = function () { reject(t.error || new Error('A gravação falhou.')); };
        t.onabort = function () { reject(t.error || new Error('A gravação foi interrompida.')); };
      });
    });
  }

  // ---------- o recebimento (N1, fatia 3) ----------

  /* Quem quiser saber que chegaram registros do outro aparelho. */
  var ouvintesDeRecebimento = [];
  function aoReceber(fn) { ouvintesDeRecebimento.push(fn); }
  function lerCursor() {
    return ler('controle', 'cursor').then(function (c) { return c || null; });
  }
  /* O id da aula de repetição leva a conta de reaberturas: `serieId@data+rN`. */
  var ID_DE_REPETICAO = /^([^@]+)@(\d{4}-\d{2}-\d{2})(?:\+r(\d+))?(?:\+\d+)?$/;
  function partesDoIdDeAula(id) {
    var m = ID_DE_REPETICAO.exec(String(id || ''));
    return m ? { serieId: m[1], data: m[2], r: m[3] ? Number(m[3]) : 0 } : null;
  }
  /* Carimbo do servidor como número (microssegundos): o texto ISO vem ora com
   * 3, ora com 6 dígitos de fração, e comparar como texto erra entre eles. */
  function carimboNumero(iso) {
    if (!iso) return 0;
    var ms = Date.parse(iso);
    if (isNaN(ms)) return 0;
    var m = /\.(\d+)Z?$/.exec(String(iso));
    var fracao = m ? (m[1] + '000000').slice(0, 6) : '000000';
    return Math.floor(ms / 1000) * 1000000 + Number(fracao);
  }
  /* A aula que carrega trabalho dela: relato, nota só minha, folha, anexo,
   * assunto, pagamento marcado. A fusão das reaberturas nunca apaga uma destas. */
  function aulaComConteudo(a) {
    return !!(a && ((a.notaTexto && String(a.notaTexto).trim()) || (a.notaPrivada && String(a.notaPrivada).trim()) || a.temNota ||
      (a.anexos && a.anexos.length) || (a.temas && a.temas.length) || (a.areas && a.areas.length) || a.pago || a.pagoEm));
  }
  /* NO CELULAR (só lê ou edita), a versão do servidor que este aparelho já
   * conhecia volta quando o disco dele tem outra coisa no mesmo carimbo: é a
   * restauração da cópia do tablet, mais velha que um registro já recebido ou
   * que a edição do próprio celular já enviada, e que guardou o carimbo do
   * registro de antes. O celular não é dono da cópia; o servidor é a versão
   * mais nova, e a edição dele ainda na fila continua vencendo. No tablet a
   * restauração vence (ela enfileira tudo), e isto não vale. */
  function voltaDoServidor(local, chegou, fila) {
    if (!soLeitura || !local || !chegou || fila[chegou.id] || !(local.nuvem && local.nuvem.servidorEm) || !chegou.servidorEm) return false;
    if (carimboNumero(local.nuvem.servidorEm) !== carimboNumero(chegou.servidorEm)) return false;
    return JSON.stringify(local.dados) !== JSON.stringify(chegou.apagadoEm ? null : (chegou.dados === undefined ? null : chegou.dados)) ||
      !!local.apagadoEm !== !!chegou.apagadoEm;
  }

  /* O maior par (carimbo, nome): é o cursor da próxima consulta. */
  function parMaior(a, b) {
    if (!a) return b;
    if (!b) return a;
    var ca = carimboNumero(a.servidorEm), cb = carimboNumero(b.servidorEm);
    if (ca !== cb) return ca > cb ? a : b;
    return String(a.nome || '') >= String(b.nome || '') ? a : b;
  }

  /* APLICA O QUE CHEGOU DA NUVEM, numa transação só (passa pela trava como a
   * restauração: é dado que vem da nuvem, e o celular só leitura também
   * recebe). A regra, por registro, pelo carimbo do servidor:
   *   - registro que não existe aqui: entra (vivo ou lápide);
   *   - registro que este aparelho conhece com carimbo do servidor igual ou
   *     mais novo (`nuvem.servidorEm`): o que chegou é velho ou é o eco do que
   *     este aparelho mesmo subiu, e não é aplicado;
   *   - registro com edição LOCAL ainda não enviada (está na fila): a edição
   *     local é a escrita mais nova, vai subir e vencer; o que chegou fica no
   *     histórico e só o carimbo do servidor é anotado, para o envio passar;
   *   - senão o que chegou vence; a versão local que perde vai para o
   *     histórico ("Antes de receber do outro aparelho"), nunca some calada.
   * Lápide que chega apaga aqui. Depois, a fusão das reaberturas: numa mesma
   * série e data, fica viva só a aula de maior r (as outras viram lápide e
   * entram na fila, para os outros aparelhos saberem). Por fim o `principal`
   * é refeito dos registros, o retrato e o cursor gravados. */
  function aplicarRecebidos(lista, opcoes) {
    opcoes = opcoes || {};
    var agora = new Date().toISOString();
    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var nomes = DEPOSITOS_DO_DOCUMENTO.concat(['historico']);
        var t = transacao(b, nomes, 'readwrite', true);
        var registros = t.objectStore('registros'), saida = t.objectStore('saida');
        var contas = { aplicados: 0, ignorados: 0, perdedoresLocais: 0, fundidas: 0, cursor: null, mudou: false };
        /* A fila e o cursor são pedidos ANTES dos registros: os pedidos de uma
         * transação respondem na ordem, e o processamento acontece na resposta
         * do último. */
        var filaReq = saida.getAll();
        var cursorReq = t.objectStore('controle').get('cursor');
        var conflitosReq = t.objectStore('controle').get('conflitos');
        var conflitosJaRegistrados = {};
        conflitosReq.onsuccess = function () { conflitosJaRegistrados = conflitosReq.result || {}; };
        /* A sincronização desligada pelo "Apagar tudo" é conferida AQUI, dentro
         * da transação: um recebimento que estava em curso quando ela apagou
         * tudo não pode aplicar nada depois (aula solta, sem aluno, num banco
         * vazio). */
        var desligadaReq = t.objectStore('controle').get('sincronizacao');
        var desligada = false;
        desligadaReq.onsuccess = function () { desligada = !!(desligadaReq.result && desligadaReq.result.desligada); };
        var todosReq = registros.getAll();
        var fila = {}, existentes = [], cursorAntes = null;
        filaReq.onsuccess = function () { (filaReq.result || []).forEach(function (e) { fila[e.id] = e; }); };
        cursorReq.onsuccess = function () { cursorAntes = cursorReq.result || null; };
        todosReq.onsuccess = function () {
          if (desligada) { contas.pulado = 'desligada'; return; }
          existentes = todosReq.result || [];
          var porId = {};
          existentes.forEach(function (r) { porId[r.id] = r; });
          var dbAntes = montar(existentes);
          var maiorOrdem = -1;
          existentes.forEach(function (r) { if (typeof r.ordem === 'number' && r.ordem > maiorOrdem) maiorOrdem = r.ordem; });
          var cursorMaior = cursorAntes && cursorAntes.servidorEm ? { servidorEm: cursorAntes.servidorEm, nome: cursorAntes.nome || '' } : null;
          var houvePerdedor = false, chegadosQuePerderam = [];
          (lista || []).forEach(function (chegou) {
            // o eco do próprio aparelho vem sem id: só avança o cursor (o par carimbo e nome)
            if (chegou && chegou.servidorEm) cursorMaior = parMaior(cursorMaior, { servidorEm: chegou.servidorEm, nome: chegou.nome || '' });
            if (!chegou || !chegou.id) return;
            var local = porId[chegou.id];
            var carimbo = { updateTime: chegou.updateTime || null, servidorEm: chegou.servidorEm || null };
            /* O ECO do que este aparelho mesmo subiu: o registro já está aqui; só
             * o carimbo é anotado quando falta (a lápide do "Apagar tudo" e a
             * restauração da própria cópia o perdem, e sem ele o envio exigiria
             * que o documento não existisse, para sempre). */
            var volta = voltaDoServidor(local, chegou, fila);
            if (chegou.eco && !volta) {
              /* E a resposta do commit que se perdeu (a aba fechou ou a rede caiu
               * depois de o servidor aplicar): o servidor tem a versão nova, o disco
               * tem o carimbo velho e a entrada na fila. O eco é escrita deste mesmo
               * aparelho: o carimbo mais novo vale sempre, e se o eco é a própria
               * versão que a fila guarda, a entrada sai, porque já subiu. */
              if (local && (!(local.nuvem && local.nuvem.servidorEm) || carimboNumero(chegou.servidorEm) > carimboNumero(local.nuvem.servidorEm))) {
                local.nuvem = Object.assign({}, carimbo, { apagado: !!chegou.apagadoEm });
                registros.put(local);
                var pendente = fila[chegou.id];
                if (pendente && !pendente.quarentena && (pendente.atualizadoEm === chegou.atualizadoEm ||
                    (!!pendente.apagadoEm === !!chegou.apagadoEm && JSON.stringify(local.dados) === JSON.stringify(chegou.dados || null)))) {
                  saida.delete(chegou.id);
                  delete fila[chegou.id];
                  contas.confirmadosPeloEco = (contas.confirmadosPeloEco || 0) + 1;
                }
              }
              return;
            }
            if (local && local.nuvem && local.nuvem.servidorEm && chegou.servidorEm && carimboNumero(local.nuvem.servidorEm) >= carimboNumero(chegou.servidorEm)) {
              if (!volta) {
                contas.ignorados++;
                return;
              }
            }
            var entrada = fila[chegou.id];
            /* A MENSAGEM DO MÊS (tipo `resumo`) vence pela hora em que foi
             * ESCRITA, e não pela ordem em que chega: o texto que ela escreveu
             * sem sinal às 10h não pode cobrir a correção do tablet das 14h só
             * porque o celular pegou sinal às 18h. Se o que chega foi escrito
             * depois da edição local na fila, ele vence: a entrada sai da fila,
             * a versão local vai para o histórico (o houvePerdedor abaixo) e o
             * registro guarda a hora da versão que perdeu, para o editor dizer.
             * Só este tipo; os outros seguem a regra de sempre. */
            var perdeuLocalEm = null;
            if (local && entrada && !entrada.quarentena && chegou.tipo === 'resumo' && !entrada.restauro &&
                Date.parse(chegou.atualizadoEm || '') > Date.parse(entrada.atualizadoEm || '')) {
              saida.delete(chegou.id);
              delete fila[chegou.id];
              perdeuLocalEm = entrada.atualizadoEm;
              entrada = null;
            }
            /* A RESTAURAÇÃO VENCE (decisão da sessão, 08/11): restaurar uma cópia, mais
             * velha ou não, é a vontade dela de voltar àquele ponto, no mesmo
             * tablet ou num novo. A entrada da restauração é uma edição local
             * pendente como qualquer outra: vence o que chega, e cada versão do
             * servidor que perde vai para o histórico, recuperável. A marca
             * `restauro` só muda o envio (exige que o documento não exista quando
             * o carimbo não é conhecido, para o servidor ser recebido antes). */
            if (local && entrada && !entrada.quarentena) {
              // a edição local ainda não enviada vence: só o carimbo é anotado
              local.nuvem = carimbo;
              registros.put(local);
              porId[chegou.id] = local;
              if (JSON.stringify(local.dados) !== JSON.stringify(chegou.dados || null) || !!local.apagadoEm !== !!chegou.apagadoEm) {
                // a versão do outro aparelho que não entrou aqui vai para o histórico, não some
                chegadosQuePerderam.push({ id: chegou.id, tipo: chegou.tipo, atualizadoEm: chegou.atualizadoEm || agora, apagadoEm: chegou.apagadoEm || null,
                  aparelho: chegou.aparelho || '', esquema: chegou.esquema || ESQUEMA_REGISTRO, ordem: local.ordem,
                  dados: chegou.apagadoEm ? null : (chegou.dados === undefined ? null : chegou.dados) });
              }
              contas.ignorados++;
              return;
            }
            var novo = { id: chegou.id, tipo: chegou.tipo, atualizadoEm: chegou.atualizadoEm || agora, apagadoEm: chegou.apagadoEm || null,
              aparelho: chegou.aparelho || '', esquema: chegou.esquema || ESQUEMA_REGISTRO,
              ordem: local && typeof local.ordem === 'number' ? local.ordem : ++maiorOrdem,
              dados: chegou.apagadoEm ? null : (chegou.dados === undefined ? null : chegou.dados),
              nuvem: Object.assign({}, carimbo, { apagado: !!chegou.apagadoEm }) };
            /* Perde a versão local quando: estava viva e muda ou vira lápide; ou era
             * uma lápide daqui e o outro aparelho a ressuscitou (o apagamento
             * daqui perdeu, e vai para o histórico também). */
            if (local && ((!local.apagadoEm && (JSON.stringify(local.dados) !== JSON.stringify(novo.dados) || !!novo.apagadoEm)) ||
                (local.apagadoEm && !novo.apagadoEm))) {
              houvePerdedor = true;
              contas.perdedoresLocais++;
            }
            if (perdeuLocalEm) novo.perdeuLocalEm = perdeuLocalEm; // só neste aparelho: o envio não leva este campo
            registros.put(novo);
            porId[chegou.id] = novo;
            contas.aplicados++;
            contas.mudou = true;
          });
          /* A fusão das reaberturas: numa mesma SÉRIE E DATA (pelos dados da aula,
           * não pelo prefixo do id: o "seguintes" move a aula para a série filha
           * mantendo o id da mãe), e só entre aulas REABERTAS (id com +r), fica
           * viva a de maior r. Nunca apaga aula com conteúdo: nesse caso as duas
           * ficam e o conflito vai para o histórico. */
          var porSerieData = {}, conflitos = [];
          Object.keys(porId).forEach(function (id) {
            var r = porId[id];
            if (r.tipo !== 'aula' || r.apagadoEm) return;
            var p = partesDoIdDeAula(id.slice('aula:'.length));
            if (!p || !p.r || !r.dados) return; var chave = r.dados.serieId + '@' + r.dados.data;
            (porSerieData[chave] = porSerieData[chave] || []).push({ reg: r, r: p.r });
          });
          Object.keys(porSerieData).forEach(function (chave) {
            var grupo = porSerieData[chave];
            if (grupo.length < 2) return;
            grupo.sort(function (a, b) { return b.r - a.r; });
            if (grupo.slice(1).some(function (g) { return aulaComConteudo(g.reg.dados); })) {
              conflitos.push(chave);
              return;
            }
            grupo.slice(1).forEach(function (g) {
              var lapide = { id: g.reg.id, tipo: g.reg.tipo, atualizadoEm: agora, apagadoEm: agora, aparelho: aparelhoId || g.reg.aparelho,
                esquema: g.reg.esquema || ESQUEMA_REGISTRO, ordem: g.reg.ordem, dados: null, nuvem: g.reg.nuvem || null };
              registros.put(lapide);
              porId[g.reg.id] = lapide;
              /* No aparelho que só lê a lápide da fusão não entra na fila: ele
               * nunca envia, a entrada nunca sairia, e "a edição local pendente
               * vence" ignoraria para sempre as versões novas dessa aula. */
              if (!soLeitura) enfileirar(saida, { id: lapide.id, tipo: lapide.tipo, atualizadoEm: agora, apagadoEm: agora });
              contas.fundidas++;
              contas.mudou = true;
            });
          });
          if (houvePerdedor) {
            t.objectStore('historico').add({ rotulo: 'Antes de receber do outro aparelho', quando: Date.now(),
              estado: JSON.parse(JSON.stringify(completar(dbAntes))) });
          }
          if (conflitos.length) {
            contas.conflitos = conflitos.length;
            // uma entrada no histórico por conflito, e não a cada recebimento enquanto ele durar
            var novosConflitos = conflitos.filter(function (c) { return !conflitosJaRegistrados[c]; });
            if (novosConflitos.length) {
              t.objectStore('historico').add({ rotulo: 'Duas aulas na mesma data da mesma série, reabertas em aparelhos diferentes, as duas com conteúdo',
                quando: Date.now(), estado: JSON.parse(JSON.stringify(completar(montar(Object.keys(porId).map(function (id) { return porId[id]; }))))) });
              novosConflitos.forEach(function (c) { conflitosJaRegistrados[c] = agora; });
              t.objectStore('controle').put(conflitosJaRegistrados, 'conflitos');
            }
          }
          if (chegadosQuePerderam.length) {
            // o documento como ficaria com a versão do outro aparelho: "Voltar a este ponto" a traz de volta
            var comOOutro = {};
            existentes.forEach(function (r) { comOOutro[r.id] = r; });
            chegadosQuePerderam.forEach(function (r) { comOOutro[r.id] = r; });
            t.objectStore('historico').add({ rotulo: 'Do outro aparelho, que perdeu para a edição daqui', quando: Date.now(),
              estado: JSON.parse(JSON.stringify(completar(montar(Object.keys(comOOutro).map(function (id) { return comOOutro[id]; }))))) });
            contas.chegadosQuePerderam = chegadosQuePerderam.length;
          }
          if (contas.mudou) {
            var dbDepois = completar(montar(Object.keys(porId).map(function (id) { return porId[id]; })));
            t.objectStore('dados').put(dbDepois, 'principal');
            t.objectStore('controle').put({ quando: agora, esquema: VERSAO_BANCO, assinatura: assinatura(dbDepois) }, 'retrato');
          }
          if (cursorMaior && (!cursorAntes || cursorMaior.servidorEm !== cursorAntes.servidorEm || cursorMaior.nome !== (cursorAntes.nome || ''))) {
            t.objectStore('controle').put({ servidorEm: cursorMaior.servidorEm, nome: cursorMaior.nome, quando: agora }, 'cursor');
          }
          contas.cursor = cursorMaior ? cursorMaior.servidorEm : null;
        };
        t.oncomplete = function () {
          if (contas.mudou) avisarMudanca('dados');
          ouvintesDeRecebimento.forEach(function (fn) { try { fn(contas); } catch (e) { /* o ouvinte se vira */ } });
          resolve(contas);
        };
        t.onerror = function () { reject(t.error || new Error('A gravação falhou.')); };
        t.onabort = function () { reject(t.error || new Error('A gravação foi interrompida.')); };
      });
    });
  }

  /* Lê os três de uma vez, numa transação só de leitura. */
  function lerDocumento() {
    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var t = transacao(b, DEPOSITOS_DO_DOCUMENTO, 'readonly');
        var lido = { principal: undefined, retrato: undefined, registros: [], aparelho: null };
        t.objectStore('dados').get('principal').onsuccess = function (e) { lido.principal = e.target.result; };
        t.objectStore('controle').get('retrato').onsuccess = function (e) { lido.retrato = e.target.result; };
        t.objectStore('controle').get('aparelho').onsuccess = function (e) { lido.aparelho = e.target.result || null; };
        t.objectStore('registros').getAll().onsuccess = function (e) { lido.registros = e.target.result || []; };
        t.oncomplete = function () { resolve(lido); };
        t.onerror = function () { reject(t.error || new Error('A leitura falhou.')); };
        t.onabort = function () { reject(t.error || new Error('A leitura foi interrompida.')); };
      });
    });
  }

  /* O documento, montado dos registros. Quando o `principal` do disco não é o
   * que os registros espelham (gravado por fora: código da versão anterior
   * depois de um rollback, ou uma prova que semeia o banco), o `principal`
   * vence: os registros são refeitos a partir dele, e ele é devolvido. No
   * aparelho que só lê, essa reconciliação não grava nada. */
  function carregar() {
    return lerDocumento().then(function (lido) {
      if (lido.aparelho) aparelhoId = lido.aparelho;
      if (!lido.principal) {
        /* Sem documento. Se ainda há registro vivo, o `principal` foi apagado
         * POR FORA (o código da versão 4, no rollback, "Apagar tudo" esvazia
         * 'dados' e não conhece os registros): o apagamento vence, como
         * qualquer escrita de fora. Tudo vira lápide, e o documento é null.
         * No aparelho que só lê, null sem gravar. */
        var vivos = lido.registros.filter(function (r) { return !r.apagadoEm; });
        if (!vivos.length || soLeitura) return null;
        return apagarDocumento().then(function () { return null; });
      }
      if (lido.retrato && mesmaAssinatura(lido.retrato.assinatura, assinatura(lido.principal))) {
        return completar(montar(lido.registros));
      }
      if (soLeitura) return completar(lido.principal);
      return gravarDocumento(lido.principal, { semPrincipal: true }).then(function () {
        return completar(lido.principal);
      });
    });
  }

  function gravarDocumento(db, opcoes, porta) {
    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var t = transacao(b, DEPOSITOS_DO_DOCUMENTO, 'readwrite', porta);
        var contas = null;
        escreverDiferenca(t, db, opcoes, function (c) { contas = c; });
        t.oncomplete = function () { confirmarGravacao(contas); avisarMudanca('dados'); resolve(); };
        t.onerror = function () { reject(t.error || new Error('A gravação falhou.')); };
        t.onabort = function () { reject(t.error || new Error('A gravação foi interrompida.')); };
      });
    });
  }
  function confirmarGravacao(contas) {
    if (!contas) return;
    ultimaGravacao = contas;
    if (contas.aparelho) aparelhoId = contas.aparelho;
  }

  /* O salvar dela: o documento inteiro em `principal` e só a diferença em
   * `registros`, numa transação só, respondendo quando ela confirma (B3). */
  function salvar(db) {
    // a porta do documento: no celular da dona, é por aqui (e só por aqui) que a edição dele entra
    return gravarDocumento(db, null, 'documento');
  }

  /* Excluir um aluno é uma única transação: o documento, as folhas, os arquivos
   * dele, o uso da biblioteca e o histórico mudam juntos ou ficam como estavam.
   * A folha de outra aula pode citar a mesma imagem; nesse caso ela permanece. */
  function excluirAlunoEmCascata(db, alunoId) {
    if (!alunoId || !(db.alunos || []).some(function (a) { return a.id === alunoId; })) {
      return Promise.reject(new Error('Aluno não encontrado.'));
    }
    var aulasExcluidas = {}, anexosExcluidos = {}, anexosMantidos = {};
    (db.aulas || []).forEach(function (a) {
      if (a.alunoId === alunoId) aulasExcluidas[a.id] = true;
      (a.anexos || []).forEach(function (an) {
        (a.alunoId === alunoId ? anexosExcluidos : anexosMantidos)[an.id || an] = true;
      });
    });
    var novo = Object.assign({}, db, {
      alunos: db.alunos.filter(function (a) { return a.id !== alunoId; }),
      aulas: (db.aulas || []).filter(function (a) { return a.alunoId !== alunoId; }),
      series: (db.series || []).filter(function (s) { return s.alunoId !== alunoId; }),
      resumos: (db.resumos || []).filter(function (r) { return r.alunoId !== alunoId; }),
      pagamentos: (db.pagamentos || []).filter(function (p) { return p.alunoId !== alunoId; })
    });
    novo.ajustes = Object.assign({}, db.ajustes || {});
    if (novo.ajustes.bibliotecaTitulos) {
      novo.ajustes.bibliotecaTitulos = Object.assign({}, novo.ajustes.bibliotecaTitulos);
      delete novo.ajustes.bibliotecaTitulos[alunoId];
    }
    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var t = transacao(b, DEPOSITOS_DO_DOCUMENTO.concat(['notas', 'midias', 'anexos',
          'biblioteca_uso', 'historico', 'livros_posicoes']), 'readwrite');
        var contas = null;
        var notas = t.objectStore('notas');
        var midiasExcluidas = {}, midiasMantidas = {};
        var cursorNotas = notas.openCursor();
        cursorNotas.onsuccess = function (e) {
          var c = e.target.result;
          if (c) {
            var refs = aulasExcluidas[c.key] ? midiasExcluidas : midiasMantidas;
            (c.value.paginas || []).forEach(function (p) {
              (p.itens || []).forEach(function (it) {
                if (it.t === 'imagem' && it.ref) refs[it.ref] = true;
              });
            });
            if (aulasExcluidas[c.key]) c.delete();
            c.continue();
            return;
          }
          Object.keys(midiasExcluidas).forEach(function (id) {
            if (!midiasMantidas[id]) t.objectStore('midias').delete(id);
          });
          Object.keys(anexosExcluidos).forEach(function (id) {
            if (anexosMantidos[id]) return;
            t.objectStore('anexos').delete(id);
            t.objectStore('livros_posicoes').delete(PREFIXO_EXPORTADO + id);
          });
          var cursorUso = t.objectStore('biblioteca_uso').openCursor();
          cursorUso.onsuccess = function (evento) {
            var uso = evento.target.result;
            if (!uso) return;
            if (uso.value.alunoId === alunoId || aulasExcluidas[uso.value.aulaId]) uso.delete();
            uso.continue();
          };
          t.objectStore('historico').clear();
          escreverDiferenca(t, novo, null, function (c) { contas = c; });
        };
        t.oncomplete = function () { confirmarGravacao(contas); avisarMudanca('dados'); resolve(novo); };
        t.onabort = function () { reject(t.error || new Error('Exclusão interrompida.')); };
      });
    });
  }

  // ---------- notas manuscritas ----------

  function lerNota(aulaId) {
    return ler('notas', aulaId).then(function (n) { return n || null; });
  }
  function salvarNota(aulaId, nota) {
    if (!nota || !nota.paginas || !nota.paginas.length) return apagar('notas', aulaId);
    return gravar('notas', aulaId, nota);
  }
  function apagarNota(aulaId) { return apagar('notas', aulaId); }

  function todasAsNotas() {
    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var s = transacao(b, 'notas', 'readonly').objectStore('notas');
        var saida = {};
        var req = s.openCursor();
        req.onsuccess = function (e) {
          var c = e.target.result;
          if (!c) { resolve(saida); return; }
          saida[c.key] = c.value;
          c.continue();
        };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  // ---------- mídias (imagens coladas nas folhas) ----------

  function salvarMidia(id, registro) { return gravar('midias', id, registro); }
  function lerMidia(id) { return ler('midias', id); }
  function apagarMidia(id) { return apagar('midias', id); }

  // ---------- anexos (arquivo do Samsung Notes, fotos) ----------

  function salvarAnexo(id, registro) { return gravar('anexos', id, registro); }
  function lerAnexo(id) { return ler('anexos', id); }
  function apagarAnexo(id) { return apagar('anexos', id); }

  // ---------- biblioteca (pacotes importados) ----------

  /* Grava um pacote já aberto e conferido pelo biblioteca.js, numa transação
   * só: ou entra tudo, ou nada muda. A versão anterior do mesmo pacote é
   * apagada no fim da MESMA transação, depois de a nova estar escrita.
   *
   * Pacote com a mesma chave e versão igual ou maior no tablet: não grava e
   * recusa com e.versaoAtual, para a tela avisar. A conferência é feita dentro
   * da transação, e não antes dela, para dois toques seguidos não gravarem
   * duas vezes. */
  function gravarPacoteBiblioteca(aberto) {
    var m = aberto.manifest;
    var chave = m.pacote, versao = m.versao;
    var DEPOSITOS = ['biblioteca_pacotes', 'biblioteca_itens', 'biblioteca_teoria', 'biblioteca_assets', 'midias'];
    // Os Blobs nascem antes da transação: nada assíncrono pode ficar no meio dela.
    var assets = aberto.assets.map(function (a) {
      return {
        chave: chave + ':' + a.caminho, pacote: chave, versao: versao, caminho: a.caminho,
        blob: a.blob || new Blob([a.bytes], { type: a.tipo })
      };
    });
    /* As listas prontas viajam no registro do pacote, e não num depósito novo,
     * porque são DO PACOTE e não dela: saem junto quando ela remove a série,
     * voltam junto quando ela reimporta, e nunca precisam de migração. É o
     * mesmo tratamento do `busca` e do `apelidos`, que já moram aqui. O que for
     * DELA (a lista que ela salvar com nome próprio) é que vai precisar de
     * depósito e de versão de banco, e não é desta rodada. */
    var registro = {
      pacote: chave, versao: versao, manifest: m, busca: aberto.busca, apelidos: aberto.apelidos,
      kits: aberto.kits || [],
      bytes: aberto.bytesTotais, importadoEm: new Date().toISOString()
    };
    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var t = transacao(b, DEPOSITOS, 'readwrite');
        var recusa = null;
        var pacotes = t.objectStore('biblioteca_pacotes');
        var req = pacotes.get(chave);
        req.onsuccess = function () {
          var atual = req.result;
          if (atual && atual.versao >= versao) {
            recusa = new Error('versao');
            recusa.versaoAtual = atual.versao;
            t.abort();
            return;
          }
          pacotes.put(registro);
          var itens = t.objectStore('biblioteca_itens');
          aberto.itens.forEach(function (it) {
            var r = Object.assign({}, it, { pacote: chave, versao: versao });
            itens.put(r);
          });
          var teoria = t.objectStore('biblioteca_teoria');
          aberto.teoria.forEach(function (au) {
            teoria.put(Object.assign({}, au, { pacote: chave, versao: versao }));
          });
          var dep = t.objectStore('biblioteca_assets');
          assets.forEach(function (a) { dep.put(a); });
          // o que era da versão anterior e não foi reescrito agora
          ['biblioteca_itens', 'biblioteca_teoria', 'biblioteca_assets'].forEach(function (nome) {
            var cur = t.objectStore(nome).index('pacote').openCursor(IDBKeyRange.only(chave));
            cur.onsuccess = function (e) {
              var c = e.target.result;
              if (!c) return;
              if (c.value.versao !== versao) c.delete();
              c.continue();
            };
          });
          // miniaturas da versão anterior: o desenho pode ter mudado
          var pref = PREFIXO_MINIATURA + chave + '@';
          t.objectStore('midias').delete(IDBKeyRange.bound(pref, pref + '￿'));
        };
        t.oncomplete = function () { resolve(registro); };
        t.onabort = function () { reject(recusa || t.error || new Error('A gravação foi interrompida.')); };
      });
    });
  }

  /* Tira um pacote do tablet e devolve o espaço.
   *
   * Sai TUDO o que veio do pacote: o registro em biblioteca_pacotes, e os
   * biblioteca_itens, biblioteca_teoria e biblioteca_assets daquele pacote,
   * mais as miniaturas do prefixo dele em 'midias' (cache refeito do SVG).
   *
   * NÃO SAI, e este é o ponto: biblioteca_etiquetas (a dificuldade que ela deu)
   * e biblioteca_uso (que exercício foi para que aluno, em que aula). Os dois
   * são DELA e não do pacote, e são gravados por id de exercício, que é estável
   * entre versões: ela apaga uma série, importa de novo depois, e encontra as
   * etiquetas e o histórico no lugar. Por isso os dois depósitos nem entram na
   * transação: o que não está aberto não pode ser apagado por engano.
   *
   * Numa transação só: ou sai tudo, ou nada muda. Devolve o que foi removido,
   * para a tela dizer quanto espaço voltou. */
  function removerPacoteBiblioteca(chave) {
    var DEPOSITOS = ['biblioteca_pacotes', 'biblioteca_itens', 'biblioteca_teoria', 'biblioteca_assets', 'midias'];
    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var t = transacao(b, DEPOSITOS, 'readwrite');
        var contas = { itens: 0, teoria: 0, assets: 0, bytes: 0, achou: false };
        var pacotes = t.objectStore('biblioteca_pacotes');
        var req = pacotes.get(chave);
        req.onsuccess = function () {
          var atual = req.result;
          if (!atual) return;            // nada a fazer; a transação fecha sem mudar nada
          contas.achou = true;
          contas.bytes = atual.bytes || 0;
          contas.manifest = atual.manifest;
          pacotes.delete(chave);
          [['biblioteca_itens', 'itens'], ['biblioteca_teoria', 'teoria'], ['biblioteca_assets', 'assets']]
            .forEach(function (par) {
              var cur = t.objectStore(par[0]).index('pacote').openCursor(IDBKeyRange.only(chave));
              cur.onsuccess = function (e) {
                var c = e.target.result;
                if (!c) return;
                contas[par[1]]++;
                c.delete();
                c.continue();
              };
            });
          var pref = PREFIXO_MINIATURA + chave + '@';
          t.objectStore('midias').delete(IDBKeyRange.bound(pref, pref + '￿'));
        };
        t.oncomplete = function () { resolve(contas); };
        t.onabort = function () { reject(t.error || new Error('A remoção foi interrompida.')); };
      });
    });
  }

  function listarPacotesBiblioteca() {
    return todosOsValores('biblioteca_pacotes').then(function (l) {
      return (l || []).sort(function (a, b) { return a.pacote < b.pacote ? -1 : a.pacote > b.pacote ? 1 : 0; });
    });
  }
  function itensDaBiblioteca() { return todosOsValores('biblioteca_itens'); }
  function teoriaDaBiblioteca() { return todosOsValores('biblioteca_teoria'); }
  function lerAssetBiblioteca(pacote, caminho) {
    return ler('biblioteca_assets', pacote + ':' + caminho).then(function (r) { return r ? r.blob : null; });
  }

  function chaveMiniatura(pacote, versao, caminho) {
    return PREFIXO_MINIATURA + pacote + '@' + versao + ':' + caminho;
  }

  /* `listaId` (C2a) é aditivo: vem quando o material anexado era, exatamente,
   * uma das listas dela, e é por ele que o cartão diz com quem ela já usou a
   * lista. Registro antigo fica sem, e a conta só enxerga o que tem. */
  function registrarUsoBiblioteca(reg) {
    var registro = { itemId: reg.itemId, alunoId: reg.alunoId, aulaId: reg.aulaId, data: reg.data };
    if (reg.listaId) registro.listaId = reg.listaId;
    return escrever('biblioteca_uso', function (s) {
      return s.add(registro);
    });
  }
  function usoDaBiblioteca() { return todosOsValores('biblioteca_uso'); }
  function gravarEtiquetaBiblioteca(reg) {
    return escrever('biblioteca_etiquetas', function (s) {
      return s.put({ itemId: reg.itemId, dificuldade: reg.dificuldade, data: reg.data });
    });
  }
  function etiquetasDaBiblioteca() { return todosOsValores('biblioteca_etiquetas'); }

  /* Minhas listas (C2a). Um registro por lista, pelo id:
   *   { id, titulo, nivel: null | 'base' | 'regular' | 'aprofundamento',
   *     itens: [id de exercício...], paginas: [id de página de teoria...],
   *     origem: id da lista pronta de onde nasceu | null,
   *     automatica: true quando foi o aplicativo que guardou (ao trocar o
   *       material), sem nome dado por ela,
   *     criadaEm, editadaEm: milissegundos }
   * `itens` e `paginas` são ordenados: a ordem é a dela. */
  function gravarListaBiblioteca(registro) {
    return escrever('biblioteca_listas', function (s) { return s.put(registro); });
  }
  function apagarListaBiblioteca(id) { return apagar('biblioteca_listas', id); }
  function listasDaBiblioteca() { return todosOsValores('biblioteca_listas'); }

  // ---------- livros de referência (C15.1) ----------

  /* Grava os livros de um pacote já aberto e conferido (biblioteca.js), numa
   * transação só: ou entra tudo, ou nada muda.
   *
   * A comparação é LIVRO A LIVRO, e não pelo pacote inteiro como nos
   * exercícios, porque ela pode remover um livro e querer de volta: importar
   * o mesmo pacote outra vez devolve o que falta e não mexe no que está.
   *
   * O MESMO LIVRO é o mesmo id E o mesmo hash (o sha256 do arquivo, que o
   * manifest traz). Só o id deixava passar calado um PDF trocado com o mesmo
   * nome num pacote de versão igual: o tablet ficava com o arquivo velho e
   * dizia "já estava". Escolha da revisão do C15.1: o hash entra na conta, em
   * vez de exigir versão nova do pacote, porque quem troca um arquivo no Drive
   * e gera de novo esquece de subir a versão, e o hash não esquece.
   *   livro que não está no tablet                 entra (novos)
   *   mesmo id, hash diferente, versão igual ou maior: é substituído
   *     (atualizados). A posição de leitura fica se o sumário for o mesmo
   *     (a página 40 continua a página 40 do mesmo capítulo); com sumário
   *     diferente, ela sai, para o livro não abrir num lugar que mudou
   *   mesmo id, hash diferente, de versão MENOR que a do tablet: fica o do
   *     tablet, que é mais novo (maisNovos)
   *   mesmo id e mesmo hash                         fica como está (iguais);
   *     de versão maior, só a versão e o manifest do livro são renovados,
   *     sem regravar o arquivo
   *   livro deste pacote, de versão menor, que saiu do pacote novo: sai do
   *     tablet, com a posição dele (removidos)
   *   o mesmo id vindo de OUTRO pacote: fica o que está (deOutroPacote), para
   *     um pacote não tomar o livro do outro calado.
   * Devolve as contas, para a tela dizer o que aconteceu. */
  function gravarLivros(aberto) {
    var m = aberto.manifest;
    var chave = m.pacote, versao = m.versao;
    var agora = new Date().toISOString();
    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var t = transacao(b, ['livros', 'livros_posicoes'], 'readwrite');
        var dep = t.objectStore('livros');
        var contas = { novos: 0, atualizados: 0, iguais: 0, maisNovos: 0, removidos: 0, posicoesSoltas: 0,
          deOutroPacote: [], bytes: 0 };
        var noPacote = {};
        aberto.livros.forEach(function (l) {
          noPacote[l.meta.id] = true;
          var req = dep.get(l.meta.id);
          req.onsuccess = function () {
            var atual = req.result;
            if (atual && atual.pacote !== chave) { contas.deOutroPacote.push(l.meta.id); return; }
            var mesmoArquivo = !!atual && !!atual.meta && atual.meta.hash === l.meta.hash;
            if (mesmoArquivo) {
              contas.iguais++;
              if (versao > atual.versao) {
                dep.put({ id: atual.id, pacote: chave, versao: versao, meta: l.meta, blob: atual.blob,
                  bytes: atual.bytes, importadoEm: atual.importadoEm });
              }
              return;
            }
            if (atual && atual.versao > versao) { contas.maisNovos++; return; }
            if (atual) {
              contas.atualizados++;
              if (JSON.stringify(atual.meta && atual.meta.sumario || []) !== JSON.stringify(l.meta.sumario || [])) {
                contas.posicoesSoltas++;
                t.objectStore('livros_posicoes').delete(l.meta.id);
              }
            } else {
              contas.novos++;
            }
            contas.bytes += l.blob.size;
            dep.put({ id: l.meta.id, pacote: chave, versao: versao, meta: l.meta, blob: l.blob,
              bytes: l.blob.size, importadoEm: agora });
          };
        });
        var cur = dep.index('pacote').openCursor(IDBKeyRange.only(chave));
        cur.onsuccess = function (e) {
          var c = e.target.result;
          if (!c) return;
          if (!noPacote[c.value.id] && c.value.versao < versao) {
            contas.removidos++;
            t.objectStore('livros_posicoes').delete(c.value.id);
            c.delete();
          }
          c.continue();
        };
        t.oncomplete = function () { resolve(contas); };
        t.onabort = function () { reject(t.error || new Error('A gravação foi interrompida.')); };
      });
    });
  }

  /* Os livros guardados, em ordem de título. O registro traz o Blob, mas o
   * Blob do IndexedDB é só uma referência: listar não lê os livros. */
  function listarLivros() {
    return todosOsValores('livros').then(function (l) {
      return (l || []).sort(function (a, b) {
        return String(a.meta && a.meta.titulo || a.id).localeCompare(String(b.meta && b.meta.titulo || b.id), 'pt-BR') ||
          (a.id < b.id ? -1 : 1);
      });
    });
  }
  function lerLivro(id) { return ler('livros', id); }

  /* Tira um livro do tablet, com a posição guardada dele. Devolve o que saiu. */
  function removerLivro(id) {
    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var t = transacao(b, ['livros', 'livros_posicoes'], 'readwrite');
        var contas = { achou: false, bytes: 0 };
        var req = t.objectStore('livros').get(id);
        req.onsuccess = function () {
          if (!req.result) return;
          contas.achou = true;
          contas.bytes = req.result.bytes || 0;
          t.objectStore('livros').delete(id);
          t.objectStore('livros_posicoes').delete(id);
        };
        t.oncomplete = function () { resolve(contas); };
        t.onabort = function () { reject(t.error || new Error('A remoção foi interrompida.')); };
      });
    });
  }

  /* { id, pagina } no PDF; { id, capitulo, fracao } no EPUB. */
  function lerPosicaoLivro(id) { return ler('livros_posicoes', id); }
  function gravarPosicaoLivro(reg) {
    var r = { id: reg.id, quando: Date.now() };
    if (reg.pagina != null) r.pagina = reg.pagina;
    if (reg.capitulo != null) { r.capitulo = reg.capitulo; r.fracao = reg.fracao || 0; }
    return escrever('livros_posicoes', function (s) { return s.put(r); });
  }

  /* O PDF EXPORTADO DE UM LIVRO (C15.4), anexado a uma aula. É material de
   * terceiro (as páginas do livro) e pesa MB, e se refaz a partir do livro do
   * tablet: por isso NÃO mora em 'anexos', que a cópia de segurança leva em
   * base64 (um capítulo de 40 páginas com o gabarito passaria de 20 MB a cada
   * exportação), e sim em 'livros_posicoes', que é SO_DESTE_TABLET, com a
   * chave começando por PREFIXO_EXPORTADO, sem subir o banco para a versão 5.
   * O registro em aula.anexos (com `exportado: true` e de onde veio) vai na
   * cópia; o arquivo, não. Ninguém lê 'livros_posicoes' inteiro: a posição de
   * cada livro é lida e apagada pelo id do livro, que nunca tem o prefixo.
   * "Apagar todos os dados" esvazia o depósito, e o PDF sai junto com as aulas. */
  var PREFIXO_EXPORTADO = 'exportado:';
  function salvarExportado(id, registro) {
    var r = { id: PREFIXO_EXPORTADO + id, nome: registro.nome, tipo: registro.tipo, blob: registro.blob, quando: Date.now() };
    return escrever('livros_posicoes', function (s) { return s.put(r); });
  }
  function lerExportado(id) { return ler('livros_posicoes', PREFIXO_EXPORTADO + id); }
  function apagarExportado(id) { return apagar('livros_posicoes', PREFIXO_EXPORTADO + id); }

  // ---------- histórico de desfazer ----------

  /* Guarda o estado ANTES da ação, para poder voltar.
   * Só o depósito "dados" entra: é o que as ações em massa alteram. */
  function registrarHistorico(rotulo, dbAntes) {
    /* Já esperava a transação; faltava rejeitar quando ela aborta sem erro de
     * pedido (a página caindo), e aí a promessa ficava pendurada para sempre. */
    return escrever('historico', function (s) {
      return s.add({ rotulo: rotulo, quando: Date.now(), estado: JSON.parse(JSON.stringify(dbAntes)) });
    }, 'historico').then(function () { return podarHistorico(); });
  }

  function podarHistorico() {
    return todasAsChaves('historico').then(function (chaves) {
      if (chaves.length <= MAX_HISTORICO) return;
      var excedente = chaves.slice(0, chaves.length - MAX_HISTORICO);
      // pela mesma porta do registrar: no celular da dona, a poda é parte do Desfazer
      return Promise.all(excedente.map(function (k) { return apagar('historico', k, 'historico'); }));
    });
  }

  function listarHistorico() {
    return todosOsValores('historico').then(function (lista) {
      return (lista || []).sort(function (a, b) { return b.id - a.id; });
    });
  }

  /* `nadaGravado`: a PRIMEIRA gravação de uma substituição inteira falhou, e
   * ela é uma transação só do documento principal, então o disco ficou como
   * estava. Quem chama pode manter a memória, que aí é melhor que o disco (B3);
   * nas outras falhas, algo pode ter ficado gravado pela metade. */
  function nadaGravado(e) {
    return Object.assign(new Error('Nada foi gravado.'), { nadaGravado: true, causa: e });
  }

  /* Volta ao estado guardado e descarta esse ponto do histórico. */
  function desfazer(id) {
    return ler('historico', id).then(function (registro) {
      if (!registro) return null;
      return salvar(registro.estado).then(null, function (e) { throw nadaGravado(e); }).then(function () {
        return apagar('historico', id);
      }).then(function () {
        return completar(registro.estado);
      });
    });
  }

  function limparHistorico() {
    return esvaziar('historico');
  }

  // ---------- manutenção ----------

  /* Remove notas, mídias e anexos que não pertencem mais a nenhuma aula.
   * Só roda quando ela pedir, para não destruir nada que o desfazer poderia recuperar. */
  function limparOrfaos(db) {
    var idsAulas = {};
    (db.aulas || []).forEach(function (a) { idsAulas[a.id] = true; });
    var relatorio = { notas: 0, midias: 0, anexos: 0 };
    var midiasUsadas = {}, anexosUsados = {};
    (db.aulas || []).forEach(function (a) {
      (a.anexos || []).forEach(function (an) { anexosUsados[an.id || an] = true; });
    });

    return todasAsNotas().then(function (notas) {
      var pendentes = [];
      Object.keys(notas).forEach(function (aulaId) {
        if (!idsAulas[aulaId]) { pendentes.push(apagarNota(aulaId)); relatorio.notas++; return; }
        (notas[aulaId].paginas || []).forEach(function (p) {
          (p.itens || []).forEach(function (it) { if (it.t === 'imagem' && it.ref) midiasUsadas[it.ref] = true; });
        });
      });
      return Promise.all(pendentes);
    }).then(function () {
      return todasAsChaves('midias');
    }).then(function (chaves) {
      return Promise.all((chaves || []).filter(function (k) {
        return !midiasUsadas[k] && String(k).indexOf(PREFIXO_MINIATURA) !== 0;
      })
        .map(function (k) { relatorio.midias++; return apagarMidia(k); }));
    }).then(function () {
      return todasAsChaves('anexos');
    }).then(function (chaves) {
      return Promise.all((chaves || []).filter(function (k) { return !anexosUsados[k]; })
        .map(function (k) { relatorio.anexos++; return apagarAnexo(k); }));
    }).then(function () {
      // o PDF exportado de livro (C15.4) que nenhuma aula cita mais: conta como anexo
      return todasAsChaves('livros_posicoes');
    }).then(function (chaves) {
      return Promise.all((chaves || []).filter(function (k) {
        return String(k).indexOf(PREFIXO_EXPORTADO) === 0 && !anexosUsados[String(k).slice(PREFIXO_EXPORTADO.length)];
      }).map(function (k) { relatorio.anexos++; return apagar('livros_posicoes', k); }));
    }).then(function () { return relatorio; });
  }

  function estimarEspaco() {
    if (navigator.storage && navigator.storage.estimate) return navigator.storage.estimate();
    return Promise.resolve(null);
  }

  /* Pede ao navegador para não descartar os dados por falta de espaço. */
  function tornarPersistente() {
    if (navigator.storage && navigator.storage.persist) return navigator.storage.persist();
    return Promise.resolve(false);
  }

  // ---------- cópia de segurança ----------

  /* Anexo é guardado como Blob, e Blob não sobrevive a JSON.stringify: viraria
   * um objeto vazio e o arquivo se perderia calado. Por isso vira texto na
   * cópia e volta a ser Blob na restauração. */
  function blobParaTexto(blob) {
    return new Promise(function (resolve, reject) {
      var leitor = new FileReader();
      leitor.onload = function () { resolve(leitor.result); };
      leitor.onerror = function () { reject(leitor.error); };
      leitor.readAsDataURL(blob);
    });
  }

  function textoParaBlob(texto, tipo) {
    var partes = String(texto || '').split(',');
    var bin = atob(partes[1] || '');
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: tipo || 'application/octet-stream' });
  }

  function arredondarTracosDaCopia(nota) {
    var copia = JSON.parse(JSON.stringify(nota));
    (copia.paginas || []).forEach(function (p) {
      (p.itens || []).forEach(function (it) {
        if (it.t !== 'traco' || !Array.isArray(it.pontos)) return;
        it.pontos.forEach(function (ponto) {
          if (!Array.isArray(ponto)) return;
          for (var i = 0; i < ponto.length; i++) {
            if (typeof ponto[i] === 'number' && isFinite(ponto[i])) {
              ponto[i] = Math.round(ponto[i] * 10) / 10;
            }
          }
        });
      });
    });
    return copia;
  }

  function exportarTudo(db, opcoes) {
    var pacote = { formato: 'apoio-educacional', versao: 1, quando: new Date().toISOString(), dados: db };
    var idsAulas = {}, idsAlunos = {}, anexosUsados = {}, midiasUsadas = {};
    (db.alunos || []).forEach(function (a) { idsAlunos[a.id] = true; });
    (db.aulas || []).forEach(function (a) {
      if (!idsAlunos[a.alunoId]) return;
      idsAulas[a.id] = true;
      (a.anexos || []).forEach(function (an) { anexosUsados[an.id || an] = true; });
    });
    return todasAsNotas().then(function (notas) {
      pacote.notas = {};
      Object.keys(notas).forEach(function (id) {
        if (!idsAulas[id]) return;
        pacote.notas[id] = (opcoes && opcoes.arredondarTracos)
          ? arredondarTracosDaCopia(notas[id])
          : notas[id];
        (notas[id].paginas || []).forEach(function (p) {
          (p.itens || []).forEach(function (it) {
            if (it.t === 'imagem' && it.ref) midiasUsadas[it.ref] = true;
          });
        });
      });
      return todasAsChaves('midias');
    }).then(function (chaves) {
      // miniatura da biblioteca é cache refeito do pacote: não vai para a cópia
      return Promise.all((chaves || []).filter(function (k) {
        return midiasUsadas[k] && String(k).indexOf(PREFIXO_MINIATURA) !== 0;
      }).map(function (k) {
        return lerMidia(k).then(function (v) { return { id: k, valor: v }; });
      }));
    }).then(function (midias) {
      pacote.midias = {};
      midias.forEach(function (m) { if (m.valor) pacote.midias[m.id] = m.valor; });
      return todasAsChaves('anexos');
    }).then(function (chaves) {
      return Promise.all((chaves || []).filter(function (k) { return anexosUsados[k]; }).map(function (k) {
        return lerAnexo(k).then(function (v) { return { id: k, valor: v }; });
      }));
    }).then(function (anexos) {
      pacote.anexos = {};
      return Promise.all(anexos.map(function (a) {
        if (!a.valor) return null;
        var registro = { nome: a.valor.nome, tipo: a.valor.tipo };
        if (!a.valor.blob) { pacote.anexos[a.id] = registro; return null; }
        if (opcoes && opcoes.anexosBinarios) {
          registro.blob = a.valor.blob;
          pacote.anexos[a.id] = registro;
          return null;
        }
        return blobParaTexto(a.valor.blob).then(function (texto) {
          registro.conteudo = texto;
          pacote.anexos[a.id] = registro;
        });
      }));
    }).then(function () {
      /* Da biblioteca vão só o uso e as etiquetas, que são dela. Os pacotes,
       * os exercícios e as imagens voltam importando o pacote de novo. Os
       * livros (SO_DESTE_TABLET) não entram, nem a posição de leitura: o
       * aceite do C15.1 mede que a cópia não cresce ao importar livros. */
      return Promise.all([usoDaBiblioteca(), etiquetasDaBiblioteca(), listasDaBiblioteca()]);
    }).then(function (bib) {
      pacote.biblioteca = { uso: (bib[0] || []).filter(function (r) {
        return idsAlunos[r.alunoId] && idsAulas[r.aulaId];
      }), etiquetas: bib[1] || [], listas: bib[2] || [] };
      return pacote;
    });
  }

  function exportarTudoZip(db) {
    return exportarTudo(db, { anexosBinarios: true, arredondarTracos: true }).then(function (pacote) {
      var meta = {}, arquivos = [
        { nome: 'manifest.json', conteudo: JSON.stringify({
          formato: 'apoio-educacional-zip', versao: 2, quando: pacote.quando
        }), comprimir: true },
        { nome: 'dados.json', conteudo: JSON.stringify(pacote.dados), comprimir: true },
        { nome: 'notas.json', conteudo: JSON.stringify(pacote.notas), comprimir: true },
        { nome: 'midias.json', conteudo: JSON.stringify(pacote.midias), comprimir: true },
        { nome: 'biblioteca_uso.json', conteudo: JSON.stringify(pacote.biblioteca.uso), comprimir: true },
        { nome: 'biblioteca_etiquetas.json', conteudo: JSON.stringify(pacote.biblioteca.etiquetas), comprimir: true },
        { nome: 'biblioteca_listas.json', conteudo: JSON.stringify(pacote.biblioteca.listas), comprimir: true }
      ];
      Object.keys(pacote.anexos).forEach(function (id, i) {
        var reg = pacote.anexos[id];
        var caminho = 'anexos/' + i + '.bin';
        meta[id] = { nome: reg.nome, tipo: reg.tipo, arquivo: caminho };
        arquivos.push({ nome: caminho, conteudo: reg.blob || new Blob([]) });
      });
      arquivos.push({ nome: 'anexos.json', conteudo: JSON.stringify(meta), comprimir: true });
      return root.Zip.escrever(arquivos);
    });
  }

  /* opcoes.daNuvem: a cópia veio da nuvem (Restaurar neste aparelho). É a
   * única escrita que passa com o aparelho só lendo. */
  function importarTudo(pacote, opcoes) {
    var daNuvem = !!(opcoes && opcoes.daNuvem);
    function objeto(v) { return v && typeof v === 'object' && !Array.isArray(v); }
    function invalida() { return Object.assign(new Error('Arquivo de cópia inválido.'), { invalida: true }); }
    if (!pacote || pacote.formato !== 'apoio-educacional' || !objeto(pacote.dados) ||
        ['alunos', 'aulas', 'series', 'resumos', 'pagamentos'].some(function (k) {
          return pacote.dados[k] != null && !Array.isArray(pacote.dados[k]);
        }) ||
        (pacote.notas != null && !objeto(pacote.notas)) ||
        (pacote.midias != null && !objeto(pacote.midias)) ||
        (pacote.anexos != null && !objeto(pacote.anexos))) return Promise.reject(invalida());
    var bib = pacote.biblioteca;
    if (bib && (!objeto(bib) || (bib.uso != null && !Array.isArray(bib.uso)) ||
        (bib.etiquetas != null && !Array.isArray(bib.etiquetas)) ||
        (bib.listas != null && !Array.isArray(bib.listas)))) return Promise.reject(invalida());

    // Converter toda a cópia ANTES de abrir a transação. Erro de base64 ou de
    // formato não pode deixar o banco com metade dos depósitos substituídos.
    var anexos = {};
    try {
      Object.keys(pacote.anexos || {}).forEach(function (k) {
        var reg = pacote.anexos[k];
        if (!objeto(reg)) throw invalida();
        if (reg.conteudo) anexos[k] = { nome: reg.nome, tipo: reg.tipo,
          blob: textoParaBlob(reg.conteudo, reg.tipo) };
        else if (reg.blob instanceof Blob) anexos[k] = reg;
      });
    } catch (e) { return Promise.reject(e && e.invalida ? e : invalida()); }

    /* Os registros da restauração levam o `quando` da cópia, e não o de agora:
     * restaurar é voltar a um retrato, não editar tudo (a fatia 3 da nuvem,
     * que aplica "última escrita vence", não pode ver uma restauração como a
     * edição mais nova de cada item). Sem `quando` válido, vale agora. */
    var carimbo = (opcoes && opcoes.carimbo) || pacote.quando;
    if (typeof carimbo !== 'string' || isNaN(new Date(carimbo).getTime())) carimbo = null;

    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var nomes = DEPOSITOS_DO_DOCUMENTO.concat(['notas', 'midias', 'anexos', 'historico']);
        if (bib) nomes.push('biblioteca_uso', 'biblioteca_etiquetas');
        if (bib && Array.isArray(bib.listas)) nomes.push('biblioteca_listas');
        var t = transacao(b, nomes, 'readwrite', daNuvem);
        var erro = null, contas = null;
        try {
          function trocar(nome, registros, chaveExterna) {
            var s = t.objectStore(nome);
            s.clear();
            if (chaveExterna) Object.keys(registros || {}).forEach(function (k) { s.put(registros[k], k); });
            else (registros || []).forEach(function (r) { s.put(r); });
          }
          /* A fila: a restauração só NÃO enfileira no aparelho que só lê (o
           * celular do D6a, que nunca envia). Num aparelho que escreve, o
           * tablet novo ou reinstalado é dono do que restaurou e tudo o que
           * está vivo tem de subir como registro: quem fez a cópia pode nunca
           * ter conseguido enviar (regras ainda não publicadas, por exemplo). */
          /* O CELULAR COM MUDANÇA DELE ESPERANDO SINAL NÃO RESTAURA (D6b): a cópia
           * trocaria o dado das entradas da fila pelo da cópia, e o envio subiria a
           * versão do tablet como se fosse a edição do celular. A restauração fica
           * para depois de a fila subir; o que mudou no tablet chega pelos
           * registros de qualquer jeito. Conferido aqui dentro, na transação. */
          if (daNuvem && soLeitura && celularEdita) {
            var pendentesReq = t.objectStore('saida').getAll();
            pendentesReq.onsuccess = function () {
              /* A QUARENTENA NÃO SEGURA (a nuvem recusa esse registro, e ele não
               * sobe com sinal nenhum): a restauração a substitui, e a entrada sai
               * da fila aqui, na mesma transação. Só a mudança que espera sinal
               * segura a cópia. */
              var lista = pendentesReq.result || [];
              lista.forEach(function (e) { if (e.quarentena) t.objectStore('saida').delete(e.id); });
              var n = lista.filter(function (e) { return !e.quarentena; }).length;
              if (!n) return;
              erro = Object.assign(new Error(n === 1 ? 'Há 1 mudança deste celular esperando sinal. A cópia do tablet fica para quando ela subir.'
                : 'Há ' + n + ' mudanças deste celular esperando sinal. A cópia do tablet fica para quando elas subirem.'), { filaPendente: n });
              t.abort();
            };
          }
          escreverDiferenca(t, completar(pacote.dados), { carimbo: carimbo, semFila: daNuvem && soLeitura, restauro: daNuvem }, function (c) { contas = c; });
          trocar('notas', pacote.notas, true);
          trocar('midias', pacote.midias, true);
          trocar('anexos', anexos, true);
          t.objectStore('historico').clear();
          /* O estado anterior fica no histórico, depois da limpeza (os pedidos
           * respondem na ordem): cada versão que a restauração troca ou apaga
           * continua recuperável por "Voltar a este ponto" (decisão da sessão). */
          var anteriorReq = t.objectStore('dados').get('principal');
          anteriorReq.onsuccess = function () {
            if (!anteriorReq.result) return;
            t.objectStore('historico').add({ rotulo: 'Antes de restaurar a cópia', quando: Date.now(),
              estado: JSON.parse(JSON.stringify(completar(anteriorReq.result))) });
          };
          if (bib) {
            trocar('biblioteca_uso', (bib.uso || []).filter(function (r) { return r && r.itemId; }), false);
            trocar('biblioteca_etiquetas', (bib.etiquetas || []).filter(function (r) { return r && r.itemId; }), false);
            if (Array.isArray(bib.listas)) trocar('biblioteca_listas', bib.listas.filter(function (r) {
              return r && r.id && Array.isArray(r.itens);
            }), false);
          }
        } catch (e) { erro = e; t.abort(); }
        t.oncomplete = function () { confirmarGravacao(contas); avisarMudanca('dados'); resolve(completar(pacote.dados)); };
        t.onabort = function () { reject(erro || t.error || new Error('A restauração foi interrompida.')); };
        t.onerror = function () { /* onabort informa o motivo e resolve a promessa */ };
      });
    });
  }

  /* Lê e confere cada entrada antes de abrir a transação de restauração. O ZIP
   * pode vir cortado ou com CRC errado; nesse caso, nada do tablet muda. */
  async function importarZip(arquivo, opcoes) {
    var zip = await root.Zip.lerDoArquivo(arquivo);
    var entradas = {};
    zip.entradas.forEach(function (e) { entradas[e.nome] = e; });
    var fixos = ['manifest.json', 'dados.json', 'notas.json', 'midias.json', 'anexos.json',
      'biblioteca_uso.json', 'biblioteca_etiquetas.json', 'biblioteca_listas.json'];
    var invalida = function () {
      return Object.assign(new Error('Arquivo de cópia inválido.'), { invalida: true });
    };
    if (fixos.some(function (n) { return !entradas[n]; }) ||
        Object.keys(entradas).some(function (n) {
          return fixos.indexOf(n) < 0 && !/^anexos\/[0-9]+\.bin$/.test(n);
        })) throw invalida();
    async function lerJson(nome) {
      try {
        var bytes = await root.Zip.extrairDoArquivo(zip, entradas[nome]);
        return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      } catch (e) { throw invalida(); }
    }
    var manifest = await lerJson('manifest.json');
    if (!manifest || manifest.formato !== 'apoio-educacional-zip' || manifest.versao !== 2) throw invalida();
    var dados = await lerJson('dados.json');
    var notas = await lerJson('notas.json');
    var midias = await lerJson('midias.json');
    var anexosMeta = await lerJson('anexos.json');
    var uso = await lerJson('biblioteca_uso.json');
    var etiquetas = await lerJson('biblioteca_etiquetas.json');
    var listas = await lerJson('biblioteca_listas.json');
    if (!anexosMeta || typeof anexosMeta !== 'object' || Array.isArray(anexosMeta)) throw invalida();
    var anexos = {}, usados = {};
    for (var id of Object.keys(anexosMeta)) {
      var reg = anexosMeta[id];
      if (!reg || typeof reg !== 'object' || typeof reg.arquivo !== 'string' ||
          !entradas[reg.arquivo] || usados[reg.arquivo] ||
          !/^anexos\/[0-9]+\.bin$/.test(reg.arquivo)) throw invalida();
      usados[reg.arquivo] = true;
      var bytes = await root.Zip.extrairDoArquivo(zip, entradas[reg.arquivo]);
      anexos[id] = { nome: reg.nome, tipo: reg.tipo,
        blob: new Blob([bytes], { type: reg.tipo || 'application/octet-stream' }) };
    }
    if (Object.keys(entradas).some(function (n) {
      return /^anexos\/[0-9]+\.bin$/.test(n) && !usados[n];
    })) throw invalida();
    return importarTudo({ formato: 'apoio-educacional', quando: manifest.quando, dados: dados, notas: notas,
      midias: midias, anexos: anexos,
      biblioteca: { uso: uso, etiquetas: etiquetas, listas: listas } }, opcoes);
  }

  /* O documento sai: `principal` e `retrato` apagados, e cada registro vivo
   * vira lápide (não é esvaziado: a lápide é o que, na fatia 3, diz ao outro
   * aparelho que o item saiu). O id do aparelho fica. */
  function apagarDocumento() {
    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var t = transacao(b, DEPOSITOS_DO_DOCUMENTO, 'readwrite');
        var agora = new Date().toISOString();
        var registros = t.objectStore('registros');
        var todos = registros.getAll();
        todos.onsuccess = function () {
          (todos.result || []).forEach(function (r) {
            if (r.apagadoEm) return;
            var lapide = { id: r.id, tipo: r.tipo, atualizadoEm: agora, apagadoEm: agora, aparelho: aparelhoId || r.aparelho,
              esquema: r.esquema || ESQUEMA_REGISTRO, ordem: r.ordem, dados: null, nuvem: r.nuvem || null };
            registros.put(lapide);
            /* As lápides do "Apagar tudo" ficam SÓ AQUI, fora da fila: a decisão da
             * fase 0 é que o banco vazio nunca cobre a cópia boa na nuvem, e
             * mandar as lápides apagaria, pelos registros, o outro aparelho e
             * qualquer restauração seguinte. Levar o "Apagar tudo" à nuvem é a
             * fatia 4, com regra própria. */
          });
          /* A FILA ZERA: nada do que esperava para subir (uma edição feita sem
           * rede antes do "Apagar tudo", a fila semeada na subida da versão e
           * segurada por um 403) pode subir depois dele: a entrada apontaria
           * para o que agora é lápide, e a lápide iria ao outro aparelho. E a
           * sincronização deste aparelho, envio e recebimento, fica desligada
           * aqui, na mesma transação, até ela restaurar ou enviar uma cópia; o
           * recebimento em curso lê esta marca dentro da transação de aplicar. */
          t.objectStore('saida').clear();
          t.objectStore('controle').put({ desligada: true, desde: agora }, 'sincronizacao');
          t.objectStore('dados').delete('principal');
          t.objectStore('controle').delete('retrato');
        };
        t.oncomplete = function () { avisarMudanca('dados'); resolve(); };
        t.onerror = function () { reject(t.error || new Error('A gravação falhou.')); };
        t.onabort = function () { reject(t.error || new Error('A gravação foi interrompida.')); };
      });
    });
  }

  /* A marca da sincronização desligada (o "Apagar tudo"), em `controle`. O
   * nuvem.js a lê e a espelha; quem a desfaz é a restauração ou o envio dela. */
  function sincronizacaoDesligada() {
    return ler('controle', 'sincronizacao').then(function (m) { return !!(m && m.desligada); });
  }
  function desligarSincronizacao() {
    return gravar('controle', 'sincronizacao', { desligada: true, desde: new Date().toISOString() });
  }
  /* Religar pelo "Enviar cópia agora" (opcoes.tudoDesteAparelho): "o que está
   * neste aparelho passa a valer", como na restauração. Todo registro vivo
   * sincronizável entra na fila (com `restauro`, para o servidor ser recebido
   * antes quando o carimbo não é conhecido) e a lápide do que não está vivo
   * também: o cadastro feito depois do "Apagar tudo" sobe, e o que ela apagou
   * sai do outro aparelho. Só quando a marca estava lá; a restauração já
   * enfileirou o dela e religa sem isto. Passa pela trava como a restauração. */
  function religarSincronizacao(opcoes) {
    opcoes = opcoes || {};
    return sincronizacaoDesligada().then(function (estava) {
      if (!estava) return; // nada a religar: nenhuma transação de escrita (o celular que só lê não grava à toa)
      return abrir().then(function (b) { return religarNoBanco(b, opcoes); });
    });
  }
  function religarNoBanco(b, opcoes) {
    return new Promise(function (resolve, reject) {
        var t = transacao(b, ['controle', 'registros', 'saida'], 'readwrite', true);
        var controle = t.objectStore('controle');
        var marcaReq = controle.get('sincronizacao');
        marcaReq.onsuccess = function () {
          var marca = marcaReq.result;
          controle.delete('sincronizacao');
          if (opcoes.tudoDesteAparelho && marca && marca.desligada) {
            var saida = t.objectStore('saida');
            var todos = t.objectStore('registros').getAll();
            todos.onsuccess = function () {
              (todos.result || []).forEach(function (r) {
                if (!sincronizavel(r.id, r.tipo)) return;
                if (r.apagadoEm) saida.put({ id: r.id, tipo: r.tipo, atualizadoEm: r.atualizadoEm, apagadoEm: r.apagadoEm });
                else saida.put({ id: r.id, tipo: r.tipo, atualizadoEm: r.atualizadoEm, apagadoEm: null, restauro: true });
              });
            };
          }
        };
        t.oncomplete = function () { resolve(); };
        t.onerror = function () { reject(t.error); };
        t.onabort = function () { reject(t.error || new Error('A gravação foi interrompida.')); };
    });
  }

  function apagarTudo() {
    return Promise.all([
      apagarDocumento(),
      esvaziar('notas'),
      esvaziar('midias'),
      esvaziar('anexos'),
      esvaziar('historico'),
      /* O uso e as etiquetas são dela e saem junto. Os pacotes ficam: são
       * conteúdo reimportável, como o próprio aplicativo. Os livros também
       * ficam, pelo mesmo motivo (e saem um a um em Ajustes); a POSIÇÃO de
       * leitura em cada livro é dado dela, e sai junto. */
      esvaziar('biblioteca_uso'),
      esvaziar('biblioteca_etiquetas'),
      esvaziar('biblioteca_listas'),
      esvaziar('livros_posicoes')
    ]);
  }

  root.Store = {
    bancoVazio: bancoVazio,
    bancoBloqueado: function () { return bancoBloqueadoAgora; },
    bancoTrocado: function () { return bancoTrocadoAgora; },
    carregar: carregar, salvar: salvar, excluirAlunoEmCascata: excluirAlunoEmCascata,
    lerNota: lerNota, salvarNota: salvarNota, apagarNota: apagarNota, todasAsNotas: todasAsNotas,
    salvarMidia: salvarMidia, lerMidia: lerMidia, apagarMidia: apagarMidia,
    salvarAnexo: salvarAnexo, lerAnexo: lerAnexo, apagarAnexo: apagarAnexo,
    salvarExportado: salvarExportado, lerExportado: lerExportado, apagarExportado: apagarExportado,
    registrarHistorico: registrarHistorico, listarHistorico: listarHistorico,
    desfazer: desfazer, limparHistorico: limparHistorico,
    limparOrfaos: limparOrfaos, estimarEspaco: estimarEspaco, tornarPersistente: tornarPersistente,
    exportarTudo: exportarTudo, exportarTudoZip: exportarTudoZip,
    importarTudo: importarTudo, importarZip: importarZip,
    apagarTudo: apagarTudo,
    gravarPacoteBiblioteca: gravarPacoteBiblioteca, removerPacoteBiblioteca: removerPacoteBiblioteca,
    listarPacotesBiblioteca: listarPacotesBiblioteca,
    itensDaBiblioteca: itensDaBiblioteca, teoriaDaBiblioteca: teoriaDaBiblioteca,
    lerAssetBiblioteca: lerAssetBiblioteca, chaveMiniatura: chaveMiniatura,
    registrarUsoBiblioteca: registrarUsoBiblioteca, usoDaBiblioteca: usoDaBiblioteca,
    gravarEtiquetaBiblioteca: gravarEtiquetaBiblioteca, etiquetasDaBiblioteca: etiquetasDaBiblioteca,
    gravarListaBiblioteca: gravarListaBiblioteca, apagarListaBiblioteca: apagarListaBiblioteca,
    listasDaBiblioteca: listasDaBiblioteca,
    gravarLivros: gravarLivros, listarLivros: listarLivros, lerLivro: lerLivro, removerLivro: removerLivro,
    lerPosicaoLivro: lerPosicaoLivro, gravarPosicaoLivro: gravarPosicaoLivro,
    aoMudar: aoMudar, somenteLeitura: somenteLeitura, celularQueEdita: celularQueEdita,
    estaSoLendo: function () { return soLeitura; },
    celularEdita: function () { return soLeitura && celularEdita; },
    SO_DESTE_TABLET: SO_DESTE_TABLET.slice(),
    /* Registros (N1): o que a sincronização e as provas leem. */
    AJUSTES_DO_APARELHO: AJUSTES_DO_APARELHO.slice(),
    lerRegistros: function () { return todosOsValores('registros'); },
    registrosDaFila: registrosDaFila, confirmarEnvio: confirmarEnvio, tamanhoDaFila: tamanhoDaFila,
    estadoDaFila: estadoDaFila, marcarTentativa: marcarTentativa, soltarQuarentena: soltarQuarentena,
    aplicarRecebidos: aplicarRecebidos, lerCursor: lerCursor, aoReceber: aoReceber, partesDoIdDeAula: partesDoIdDeAula,
    carimboNumero: carimboNumero,
    sincronizacaoDesligada: sincronizacaoDesligada, desligarSincronizacao: desligarSincronizacao, religarSincronizacao: religarSincronizacao,
    lerFila: function () { return todosOsValores('saida'); },
    sincronizavel: sincronizavel,
    montarRegistros: montar,
    aparelho: function () { return aparelhoId; },
    ultimaGravacao: function () { return ultimaGravacao; }
  };
})(typeof self !== 'undefined' ? self : this);
