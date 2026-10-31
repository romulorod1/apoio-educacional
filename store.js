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
 * para o Drive continua do tamanho de antes. A fase 1 da nuvem (N1, agora
 * versão 5 do banco) tem de respeitar a lista SO_DESTE_TABLET, lá embaixo.
 *
 * Nada sai daqui sem a Nathália mandar. Não há servidor nem envio automático.
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
   * e livros_posicoes. A fase 1 da nuvem (N1), que estava marcada para a
   * versão 4, passa a ser a 5. Desfazer este release é republicar o código
   * antigo COM VERSAO_BANCO = 4. */
  var VERSAO_BANCO = 4;
  /* Depósitos que nunca saem do tablet: nem na cópia de segurança nem na
   * nuvem. Quem for copiar ou sincronizar depósitos lê esta lista. */
  var SO_DESTE_TABLET = ['livros', 'livros_posicoes'];
  var MAX_HISTORICO = 25;

  /* Chave das miniaturas da biblioteca dentro de 'midias'. Elas são cache
   * refeito a partir do SVG do pacote: ficam fora da cópia de segurança e da
   * limpeza de órfãos, e somem quando o pacote é substituído. */
  var PREFIXO_MINIATURA = 'bib:';

  var bancoAberto = null;

  function criarDepositos(b) {
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
  }

  function abrir() {
    if (bancoAberto) return Promise.resolve(bancoAberto);
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(NOME_BANCO, VERSAO_BANCO);
      req.onupgradeneeded = function (e) { criarDepositos(e.target.result); };
      /* Outra janela do aplicativo, ainda na versão antiga, segura o banco na
       * versão 1: a subida espera ela fechar. Sem aviso, a tela ficaria em
       * branco sem motivo aparente; quem mostra o aviso é o app.js. */
      req.onblocked = function () { if (typeof root.aoBancoBloqueado === 'function') root.aoBancoBloqueado(); };
      req.onsuccess = function () {
        var conexao = req.result;
        bancoAberto = conexao;
        /* Uma aba com a versão nova do aplicativo pede para subir o banco:
         * esta conexão sai do caminho em vez de travar a outra. */
        conexao.onversionchange = function () {
          conexao.close();
          if (bancoAberto === conexao) bancoAberto = null;
          /* E AVISA (C2a): esta janela fica com o código de antes, e a próxima
           * gravação dela abriria o banco numa versão que não existe mais. */
          if (typeof root.aoBancoTrocado === 'function') root.aoBancoTrocado();
        };
        if (typeof root.aoBancoLiberado === 'function') root.aoBancoLiberado();
        resolve(conexao);
      };
      /* CÓDIGO MAIS VELHO QUE O BANCO (C2a): o banco já está numa versão maior
       * que a deste código (outra janela, ou um aparelho que voltou a uma
       * versão anterior pelo cache). O navegador recusa com VersionError, e a
       * tela tem de dizer o que fazer, e não mostrar a mensagem técnica. */
      req.onerror = function () {
        var e = req.error;
        if (e && e.name === 'VersionError') {
          reject(Object.assign(new Error('O banco do aparelho é de uma versão mais nova do aplicativo.'),
            { versaoNova: true, causa: e }));
          return;
        }
        reject(e);
      };
    });
  }

  function trans(deposito, modo) {
    return abrir().then(function (b) {
      return b.transaction(deposito, modo).objectStore(deposito);
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
  function escrever(deposito, fazer) {
    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var t = b.transaction(deposito, 'readwrite');
        var req = fazer(t.objectStore(deposito));
        var motivo = function (padrao) {
          return t.error || (req && req.error) || new Error(padrao);
        };
        t.oncomplete = function () { resolve(req ? req.result : undefined); };
        t.onerror = function () { reject(motivo('A gravação falhou.')); };
        t.onabort = function () { reject(motivo('A gravação foi interrompida.')); };
      });
    });
  }

  function ler(deposito, chave) {
    return trans(deposito, 'readonly').then(function (s) { return comoPromessa(s.get(chave)); });
  }
  function gravar(deposito, chave, valor) {
    return escrever(deposito, function (s) { return s.put(valor, chave); });
  }
  function apagar(deposito, chave) {
    return escrever(deposito, function (s) { return s.delete(chave); });
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

  function carregar() {
    return ler('dados', 'principal').then(function (d) {
      if (!d) return null;
      return completar(d);
    });
  }

  function salvar(db) {
    return gravar('dados', 'principal', db);
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
        var t = b.transaction(['dados', 'notas', 'midias', 'anexos',
          'biblioteca_uso', 'historico', 'livros_posicoes'], 'readwrite');
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
          t.objectStore('dados').put(novo, 'principal');
        };
        t.oncomplete = function () { resolve(novo); };
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
        var s = b.transaction('notas', 'readonly').objectStore('notas');
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
        var t = b.transaction(DEPOSITOS, 'readwrite');
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
        var t = b.transaction(DEPOSITOS, 'readwrite');
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
        var t = b.transaction(['livros', 'livros_posicoes'], 'readwrite');
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
        var t = b.transaction(['livros', 'livros_posicoes'], 'readwrite');
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
    }).then(function () { return podarHistorico(); });
  }

  function podarHistorico() {
    return todasAsChaves('historico').then(function (chaves) {
      if (chaves.length <= MAX_HISTORICO) return;
      var excedente = chaves.slice(0, chaves.length - MAX_HISTORICO);
      return Promise.all(excedente.map(function (k) { return apagar('historico', k); }));
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

  function exportarTudo(db) {
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
        pacote.notas[id] = notas[id];
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

  function importarTudo(pacote) {
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

    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var nomes = ['dados', 'notas', 'midias', 'anexos', 'historico'];
        if (bib) nomes.push('biblioteca_uso', 'biblioteca_etiquetas');
        if (bib && Array.isArray(bib.listas)) nomes.push('biblioteca_listas');
        var t = b.transaction(nomes, 'readwrite');
        var erro = null;
        try {
          function trocar(nome, registros, chaveExterna) {
            var s = t.objectStore(nome);
            s.clear();
            if (chaveExterna) Object.keys(registros || {}).forEach(function (k) { s.put(registros[k], k); });
            else (registros || []).forEach(function (r) { s.put(r); });
          }
          trocar('dados', { principal: completar(pacote.dados) }, true);
          trocar('notas', pacote.notas, true);
          trocar('midias', pacote.midias, true);
          trocar('anexos', anexos, true);
          t.objectStore('historico').clear();
          if (bib) {
            trocar('biblioteca_uso', (bib.uso || []).filter(function (r) { return r && r.itemId; }), false);
            trocar('biblioteca_etiquetas', (bib.etiquetas || []).filter(function (r) { return r && r.itemId; }), false);
            if (Array.isArray(bib.listas)) trocar('biblioteca_listas', bib.listas.filter(function (r) {
              return r && r.id && Array.isArray(r.itens);
            }), false);
          }
        } catch (e) { erro = e; t.abort(); }
        t.oncomplete = function () { resolve(completar(pacote.dados)); };
        t.onabort = function () { reject(erro || t.error || new Error('A restauração foi interrompida.')); };
        t.onerror = function () { /* onabort informa o motivo e resolve a promessa */ };
      });
    });
  }

  function apagarTudo() {
    return Promise.all([
      esvaziar('dados'),
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
    carregar: carregar, salvar: salvar, excluirAlunoEmCascata: excluirAlunoEmCascata,
    lerNota: lerNota, salvarNota: salvarNota, apagarNota: apagarNota, todasAsNotas: todasAsNotas,
    salvarMidia: salvarMidia, lerMidia: lerMidia, apagarMidia: apagarMidia,
    salvarAnexo: salvarAnexo, lerAnexo: lerAnexo, apagarAnexo: apagarAnexo,
    salvarExportado: salvarExportado, lerExportado: lerExportado, apagarExportado: apagarExportado,
    registrarHistorico: registrarHistorico, listarHistorico: listarHistorico,
    desfazer: desfazer, limparHistorico: limparHistorico,
    limparOrfaos: limparOrfaos, estimarEspaco: estimarEspaco, tornarPersistente: tornarPersistente,
    exportarTudo: exportarTudo, importarTudo: importarTudo, apagarTudo: apagarTudo,
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
    SO_DESTE_TABLET: SO_DESTE_TABLET.slice()
  };
})(typeof self !== 'undefined' ? self : this);
