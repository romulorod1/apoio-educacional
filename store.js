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
 * Os quatro primeiros vêm do pacote e se refazem importando de novo; por isso
 * a cópia de segurança leva só uso e etiquetas, que são dela.
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
   * release é republicar o código antigo COM VERSAO_BANCO = 2. */
  var VERSAO_BANCO = 2;
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
        };
        if (typeof root.aoBancoLiberado === 'function') root.aoBancoLiberado();
        resolve(conexao);
      };
      req.onerror = function () { reject(req.error); };
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

  function ler(deposito, chave) {
    return trans(deposito, 'readonly').then(function (s) { return comoPromessa(s.get(chave)); });
  }
  function gravar(deposito, chave, valor) {
    return trans(deposito, 'readwrite').then(function (s) { return comoPromessa(s.put(valor, chave)); });
  }
  function apagar(deposito, chave) {
    return trans(deposito, 'readwrite').then(function (s) { return comoPromessa(s.delete(chave)); });
  }
  function todasAsChaves(deposito) {
    return trans(deposito, 'readonly').then(function (s) { return comoPromessa(s.getAllKeys()); });
  }
  function todosOsValores(deposito) {
    return trans(deposito, 'readonly').then(function (s) { return comoPromessa(s.getAll()); });
  }

  // ---------- dados principais ----------

  function bancoVazio() {
    return { versao: 1, alunos: [], series: [], aulas: [], resumos: [], ajustes: {} };
  }

  function carregar() {
    return ler('dados', 'principal').then(function (d) {
      if (!d) return null;
      // completa campos que possam faltar em bases antigas
      d.alunos = d.alunos || [];
      d.series = d.series || [];
      d.aulas = d.aulas || [];
      d.resumos = d.resumos || [];
      d.ajustes = d.ajustes || {};
      return d;
    });
  }

  function salvar(db) {
    return gravar('dados', 'principal', db);
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

  function registrarUsoBiblioteca(reg) {
    return trans('biblioteca_uso', 'readwrite').then(function (s) {
      return comoPromessa(s.add({ itemId: reg.itemId, alunoId: reg.alunoId, aulaId: reg.aulaId, data: reg.data }));
    });
  }
  function usoDaBiblioteca() { return todosOsValores('biblioteca_uso'); }
  function gravarEtiquetaBiblioteca(reg) {
    return trans('biblioteca_etiquetas', 'readwrite').then(function (s) {
      return comoPromessa(s.put({ itemId: reg.itemId, dificuldade: reg.dificuldade, data: reg.data }));
    });
  }
  function etiquetasDaBiblioteca() { return todosOsValores('biblioteca_etiquetas'); }

  // ---------- histórico de desfazer ----------

  /* Guarda o estado ANTES da ação, para poder voltar.
   * Só o depósito "dados" entra: é o que as ações em massa alteram. */
  function registrarHistorico(rotulo, dbAntes) {
    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var t = b.transaction('historico', 'readwrite');
        var s = t.objectStore('historico');
        s.add({ rotulo: rotulo, quando: Date.now(), estado: JSON.parse(JSON.stringify(dbAntes)) });
        t.oncomplete = function () { resolve(podarHistorico()); };
        t.onerror = function () { reject(t.error); };
      });
    });
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

  /* Volta ao estado guardado e descarta esse ponto do histórico. */
  function desfazer(id) {
    return ler('historico', id).then(function (registro) {
      if (!registro) return null;
      return salvar(registro.estado).then(function () {
        return apagar('historico', id);
      }).then(function () {
        return registro.estado;
      });
    });
  }

  function limparHistorico() {
    return trans('historico', 'readwrite').then(function (s) { return comoPromessa(s.clear()); });
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
    return todasAsNotas().then(function (notas) {
      pacote.notas = notas;
      return todasAsChaves('midias');
    }).then(function (chaves) {
      // miniatura da biblioteca é cache refeito do pacote: não vai para a cópia
      return Promise.all((chaves || []).filter(function (k) {
        return String(k).indexOf(PREFIXO_MINIATURA) !== 0;
      }).map(function (k) {
        return lerMidia(k).then(function (v) { return { id: k, valor: v }; });
      }));
    }).then(function (midias) {
      pacote.midias = {};
      midias.forEach(function (m) { if (m.valor) pacote.midias[m.id] = m.valor; });
      return todasAsChaves('anexos');
    }).then(function (chaves) {
      return Promise.all((chaves || []).map(function (k) {
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
       * os exercícios e as imagens voltam importando o pacote de novo. */
      return Promise.all([usoDaBiblioteca(), etiquetasDaBiblioteca()]);
    }).then(function (bib) {
      pacote.biblioteca = { uso: bib[0] || [], etiquetas: bib[1] || [] };
      return pacote;
    });
  }

  function importarTudo(pacote) {
    if (!pacote || pacote.formato !== 'apoio-educacional' || !pacote.dados) {
      return Promise.reject(new Error('Arquivo de cópia inválido.'));
    }
    return salvar(pacote.dados).then(function () {
      var passos = [];
      Object.keys(pacote.notas || {}).forEach(function (k) { passos.push(gravar('notas', k, pacote.notas[k])); });
      Object.keys(pacote.midias || {}).forEach(function (k) { passos.push(salvarMidia(k, pacote.midias[k])); });
      Object.keys(pacote.anexos || {}).forEach(function (k) {
        var reg = pacote.anexos[k];
        // cópias antigas podiam trazer o anexo já como Blob
        if (reg && reg.conteudo) {
          passos.push(salvarAnexo(k, { nome: reg.nome, tipo: reg.tipo, blob: textoParaBlob(reg.conteudo, reg.tipo) }));
        } else if (reg && reg.blob) {
          passos.push(salvarAnexo(k, reg));
        }
      });
      return Promise.all(passos);
    }).then(function () {
      /* Cópia feita antes da biblioteca não tem o campo: aí o que o tablet já
       * tem de uso e etiquetas fica como está. */
      if (!pacote.biblioteca) return null;
      return restaurarBiblioteca(pacote.biblioteca);
    }).then(function () { return pacote.dados; });
  }

  function restaurarBiblioteca(bib) {
    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var t = b.transaction(['biblioteca_uso', 'biblioteca_etiquetas'], 'readwrite');
        var uso = t.objectStore('biblioteca_uso');
        var etq = t.objectStore('biblioteca_etiquetas');
        uso.clear(); etq.clear();
        (bib.uso || []).forEach(function (r) { if (r && r.itemId) uso.put(r); });
        (bib.etiquetas || []).forEach(function (r) { if (r && r.itemId) etq.put(r); });
        t.oncomplete = function () { resolve(); };
        t.onabort = function () { reject(t.error); };
      });
    });
  }

  function apagarTudo() {
    return Promise.all([
      trans('dados', 'readwrite').then(function (s) { return comoPromessa(s.clear()); }),
      trans('notas', 'readwrite').then(function (s) { return comoPromessa(s.clear()); }),
      trans('midias', 'readwrite').then(function (s) { return comoPromessa(s.clear()); }),
      trans('anexos', 'readwrite').then(function (s) { return comoPromessa(s.clear()); }),
      trans('historico', 'readwrite').then(function (s) { return comoPromessa(s.clear()); }),
      /* O uso e as etiquetas são dela e saem junto. Os pacotes ficam: são
       * conteúdo reimportável, como o próprio aplicativo. */
      trans('biblioteca_uso', 'readwrite').then(function (s) { return comoPromessa(s.clear()); }),
      trans('biblioteca_etiquetas', 'readwrite').then(function (s) { return comoPromessa(s.clear()); })
    ]);
  }

  root.Store = {
    bancoVazio: bancoVazio,
    carregar: carregar, salvar: salvar,
    lerNota: lerNota, salvarNota: salvarNota, apagarNota: apagarNota, todasAsNotas: todasAsNotas,
    salvarMidia: salvarMidia, lerMidia: lerMidia, apagarMidia: apagarMidia,
    salvarAnexo: salvarAnexo, lerAnexo: lerAnexo, apagarAnexo: apagarAnexo,
    registrarHistorico: registrarHistorico, listarHistorico: listarHistorico,
    desfazer: desfazer, limparHistorico: limparHistorico,
    limparOrfaos: limparOrfaos, estimarEspaco: estimarEspaco, tornarPersistente: tornarPersistente,
    exportarTudo: exportarTudo, importarTudo: importarTudo, apagarTudo: apagarTudo,
    gravarPacoteBiblioteca: gravarPacoteBiblioteca, removerPacoteBiblioteca: removerPacoteBiblioteca,
    listarPacotesBiblioteca: listarPacotesBiblioteca,
    itensDaBiblioteca: itensDaBiblioteca, teoriaDaBiblioteca: teoriaDaBiblioteca,
    lerAssetBiblioteca: lerAssetBiblioteca, chaveMiniatura: chaveMiniatura,
    registrarUsoBiblioteca: registrarUsoBiblioteca, usoDaBiblioteca: usoDaBiblioteca,
    gravarEtiquetaBiblioteca: gravarEtiquetaBiblioteca, etiquetasDaBiblioteca: etiquetasDaBiblioteca
  };
})(typeof self !== 'undefined' ? self : this);
