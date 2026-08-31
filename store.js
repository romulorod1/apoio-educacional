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
 * Nada sai daqui sem a Nathália mandar. Não há servidor nem envio automático.
 */
(function (root) {
  'use strict';

  var NOME_BANCO = 'apoio-educacional';
  var VERSAO_BANCO = 1;
  var MAX_HISTORICO = 25;

  var bancoAberto = null;

  function abrir() {
    if (bancoAberto) return Promise.resolve(bancoAberto);
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(NOME_BANCO, VERSAO_BANCO);
      req.onupgradeneeded = function (e) {
        var b = e.target.result;
        if (!b.objectStoreNames.contains('dados')) b.createObjectStore('dados');
        if (!b.objectStoreNames.contains('notas')) b.createObjectStore('notas');
        if (!b.objectStoreNames.contains('midias')) b.createObjectStore('midias');
        if (!b.objectStoreNames.contains('anexos')) b.createObjectStore('anexos');
        if (!b.objectStoreNames.contains('historico')) {
          b.createObjectStore('historico', { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = function () { bancoAberto = req.result; resolve(bancoAberto); };
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
      return Promise.all((chaves || []).filter(function (k) { return !midiasUsadas[k]; })
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
      return Promise.all((chaves || []).map(function (k) {
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
      })).then(function () { return pacote; });
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
    }).then(function () { return pacote.dados; });
  }

  function apagarTudo() {
    return Promise.all([
      trans('dados', 'readwrite').then(function (s) { return comoPromessa(s.clear()); }),
      trans('notas', 'readwrite').then(function (s) { return comoPromessa(s.clear()); }),
      trans('midias', 'readwrite').then(function (s) { return comoPromessa(s.clear()); }),
      trans('anexos', 'readwrite').then(function (s) { return comoPromessa(s.clear()); }),
      trans('historico', 'readwrite').then(function (s) { return comoPromessa(s.clear()); })
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
    exportarTudo: exportarTudo, importarTudo: importarTudo, apagarTudo: apagarTudo
  };
})(typeof self !== 'undefined' ? self : this);
