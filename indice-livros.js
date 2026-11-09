/* indice-livros.js
 * O índice de texto dos livros (B12): o motor da busca no texto dos livros
 * deste tablet. A tela de busca chama buscarNosLivros; este arquivo não
 * desenha nada além da linha de progresso da Biblioteca.
 *
 * O MESMO ARQUIVO RODA EM DOIS LUGARES:
 *   na página (index.html o carrega): a fila, a sincronização com os livros
 *     do tablet, a linha de progresso e a consulta;
 *   no Web Worker (new Worker('indice-livros.js')): a leitura do texto, um
 *     livro por vez e uma página por vez, com o PDF.js do aplicativo
 *     (vendor/pdfjs-6.4.299), e os EPUBs pelo texto do próprio EPUB.
 * Um arquivo só, e não dois, para a normalização da consulta e a do índice
 * serem a MESMA função, e para o service worker servir as duas metades da
 * mesma versão (o pedido do Worker sai da janela, que está presa à versão que
 * ela escolheu).
 *
 * ONDE MORA: num banco IndexedDB SEPARADO, 'indice-livros', e não num
 * depósito novo do banco principal. O banco principal continua na versão 6:
 * subir para a 7 trancaria fora o código antigo (VersionError) na volta de
 * versão e dispararia o aviso de banco bloqueado. Um banco à parte fica, por
 * construção, fora da cópia de segurança (o exportarTudo só lê o banco
 * principal) e fora da nuvem (idem). O "Apagar tudo" o apaga (store.js,
 * apagarTudo). Ele é CACHE: pode sumir, chegar corrompido ou numa versão que
 * este código não conhece, e a resposta é sempre a mesma, apagar e refazer
 * a partir dos livros, sem dizer nada a ela.
 *
 * Depósitos (versão 1 do banco 'indice-livros'):
 *   livros  : um registro por livro, pelo id do livro: o hash do arquivo de
 *             onde o índice saiu, a versão deste motor, quantas unidades o
 *             livro tem (páginas do PDF, partes da espinha do EPUB), a
 *             próxima a ler (a retomada) e as páginas sem texto;
 *   paginas : o texto normalizado de cada página COM texto, pela chave
 *             [id do livro, página do ARQUIVO]. Página sem texto não entra:
 *             fica contada no registro do livro.
 *
 * RETOMADA: o Worker grava cada página e o avanço do livro na mesma
 * transação. Fechar o aplicativo no meio perde no máximo a página que estava
 * sendo lida; a próxima abertura continua de `proxima`. O livro pronto, de
 * mesmo hash e mesma versão do motor, não é lido de novo (decidir).
 */
(function (root) {
  'use strict';

  var NOME = 'indice-livros';
  var VERSAO = 1;
  /* A versão do motor. Mudar a leitura ou a normalização de um jeito que
   * mude o texto guardado pede subir este número: os livros prontos com o
   * número velho são refeitos, um por vez, sem mexer no banco. */
  var MOTOR = 1;
  var PDFJS_PASTA = 'vendor/pdfjs-6.4.299/';

  /* A NORMALIZAÇÃO, a mesma no índice e na consulta: sem acento, sem
   * maiúscula, ligaduras desfeitas (o "fi" de uma letra só que os PDFs usam) e
   * espaços juntados num só. */
  function normalizar(texto) {
    return String(texto == null ? '' : texto).normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/\s+/g, ' ').trim();
  }

  /* Página com texto é a que tem ao menos uma letra ou um algarismo. */
  function temTexto(normalizado) { return /[a-z0-9]/.test(normalizado); }

  /* O que fazer com um livro, dado o registro do índice (ou nada) e o livro
   * do tablet ({ id, hash }):
   *   'refazer'   sem registro, arquivo trocado (hash novo) ou motor velho;
   *   'pronto'    já indexado: não se lê de novo;
   *   'continuar' começado e interrompido: segue de `proxima`. */
  function decidir(reg, livro) {
    if (!reg || !livro || reg.hash !== livro.hash || reg.motor !== MOTOR) return 'refazer';
    if (reg.pronto) return 'pronto';
    return 'continuar';
  }

  // ------------------------------------------------------------ o banco

  var conexao = null;

  function criar(b) {
    if (!b.objectStoreNames.contains('livros')) b.createObjectStore('livros', { keyPath: 'id' });
    if (!b.objectStoreNames.contains('paginas')) b.createObjectStore('paginas', { keyPath: ['id', 'pagina'] });
  }

  function abrirUmaVez() {
    return new Promise(function (resolve, reject) {
      var req;
      try { req = indexedDB.open(NOME, VERSAO); } catch (e) { reject(e); return; }
      req.onupgradeneeded = function () { criar(req.result); };
      req.onsuccess = function () {
        var b = req.result;
        if (!b.objectStoreNames.contains('livros') || !b.objectStoreNames.contains('paginas')) {
          b.close();
          reject(new Error('o índice dos livros está sem os depósitos'));
          return;
        }
        /* Outro pedido (o "Apagar tudo", a cura de outra janela, uma versão
         * nova) quer o banco: esta conexão sai do caminho. */
        b.onversionchange = function () { b.close(); if (conexao === b) conexao = null; };
        b.onclose = function () { if (conexao === b) conexao = null; };
        conexao = b;
        resolve(b);
      };
      req.onerror = function () { reject(req.error || new Error('o índice dos livros não abriu')); };
    });
  }

  function apagarBanco() {
    if (conexao) { try { conexao.close(); } catch (e) { /* já fechou */ } conexao = null; }
    return new Promise(function (resolve) {
      var req;
      try { req = indexedDB.deleteDatabase(NOME); } catch (e) { resolve(); return; }
      req.onsuccess = function () { resolve(); };
      req.onerror = function () { resolve(); };
    });
  }

  /* Abre; se não abrir (corrompido, sem os depósitos, numa versão que este
   * código não conhece), apaga e abre de novo, uma vez. */
  function abrirBanco() {
    if (conexao) return Promise.resolve(conexao);
    return abrirUmaVez().catch(function () {
      return apagarBanco().then(abrirUmaVez);
    });
  }

  function transacao(nomes, modo, fazer) {
    return abrirBanco().then(function (b) {
      return new Promise(function (resolve, reject) {
        var t = b.transaction(nomes, modo);
        var saida;
        t.oncomplete = function () { resolve(saida); };
        t.onerror = function () { reject(t.error || new Error('o índice dos livros falhou')); };
        t.onabort = function () { reject(t.error || new Error('o índice dos livros foi interrompido')); };
        fazer(t, function (v) { saida = v; });
      });
    });
  }

  function faixaDoLivro(id) { return IDBKeyRange.bound([id, -Infinity], [id, Infinity]); }

  function lerRegistros() {
    return transacao(['livros'], 'readonly', function (t, dar) {
      var q = t.objectStore('livros').getAll();
      q.onsuccess = function () { dar(q.result || []); };
    });
  }

  function lerRegistro(id) {
    return transacao(['livros'], 'readonly', function (t, dar) {
      var q = t.objectStore('livros').get(id);
      q.onsuccess = function () { dar(q.result || null); };
    });
  }

  function tirarDoIndice(ids) {
    if (!ids.length) return Promise.resolve();
    return transacao(['livros', 'paginas'], 'readwrite', function (t) {
      ids.forEach(function (id) {
        t.objectStore('livros').delete(id);
        t.objectStore('paginas').delete(faixaDoLivro(id));
      });
    });
  }

  var noTrabalhador = typeof document === 'undefined' && typeof importScripts === 'function' &&
    typeof root.postMessage === 'function';

  if (noTrabalhador) iniciarTrabalhador(); else iniciarPagina();

  // ===================================================== o Web Worker

  function iniciarTrabalhador() {
    importScripts('zip.js');
    var pararPedido = false;
    var pdfjs = null;

    /* Com o tablet conectado mas sem tráfego, o fetch não falha: fica
     * esperando. Passado o prazo, desiste, e o índice fica para a próxima
     * abertura (como o leitor, app.js, PRAZO_DO_LEITOR_MS). */
    var PRAZO_DO_LEITOR_MS = 60000;
    function baixar(relativo) {
      var parar = typeof AbortController === 'function' ? new AbortController() : null;
      var relogio = setTimeout(function () { if (parar) parar.abort(); }, PRAZO_DO_LEITOR_MS);
      return fetch(new URL(relativo, root.location.href).href, parar ? { signal: parar.signal } : undefined).then(function (r) {
        if (!r.ok) throw new Error('não baixou ' + relativo);
        return r.blob();
      }).then(function (b) { clearTimeout(relogio); return b; }, function (e) { clearTimeout(relogio); throw e; });
    }
    /* O PDF.js entra como no leitor (app.js, carregarPdfJs): por fetch e por um
     * endereço blob, porque um import() que falha uma vez (sem sinal) fica
     * guardado como falha. O trabalhador do PDF.js entra ANTES e deixa o
     * pdfjsWorker no escopo global: com ele, o PDF.js lê tudo aqui mesmo, sem
     * abrir um segundo Worker. */
    function carregarPdfJs() {
      if (pdfjs) return pdfjs;
      function importar(blob) {
        var u = URL.createObjectURL(new Blob([blob], { type: 'text/javascript' }));
        return import(u).then(function (m) { URL.revokeObjectURL(u); return m; },
          function (e) { URL.revokeObjectURL(u); throw e; });
      }
      pdfjs = Promise.all([baixar(PDFJS_PASTA + 'pdf.worker.min.mjs'), baixar(PDFJS_PASTA + 'pdf.min.mjs')])
        .then(function (p) { return importar(p[0]).then(function () { return importar(p[1]); }); });
      pdfjs.catch(function () { pdfjs = null; });
      return pdfjs;
    }

    function avisar(m) { root.postMessage(Object.assign({ indice: true }, m)); }

    /* O registro novo de um livro que começa do zero: as páginas velhas saem
     * na mesma transação. */
    function recomecar(livro) {
      var reg = { id: livro.id, hash: livro.hash, motor: MOTOR, formato: livro.formato, total: null, proxima: 1,
        semTexto: [], pronto: false, erro: null, proximaNoInicio: null, semAvanco: 0 };
      return transacao(['livros', 'paginas'], 'readwrite', function (t) {
        t.objectStore('paginas').delete(faixaDoLivro(livro.id));
        t.objectStore('livros').put(reg);
      }).then(function () { return reg; });
    }

    /* Uma página lida: o texto (se tiver) e o avanço do livro, juntos. */
    function gravarPagina(reg, n, texto) {
      var comTexto = temTexto(texto);
      if (!comTexto && reg.semTexto.indexOf(n) < 0) reg.semTexto.push(n);
      reg.proxima = n + 1;
      return transacao(['livros', 'paginas'], 'readwrite', function (t) {
        var p = t.objectStore('paginas');
        if (comTexto) p.put({ id: reg.id, pagina: n, texto: texto });
        else p.delete([reg.id, n]);
        t.objectStore('livros').put(reg);
      }).then(function () { return comTexto; });
    }

    function terminar(reg, erro) {
      reg.pronto = true;
      if (erro) reg.erro = String(erro).slice(0, 200);
      return transacao(['livros'], 'readwrite', function (t) { t.objectStore('livros').put(reg); });
    }

    /* As unidades de um livro: { total, ler(n) -> texto, soltar() }. */
    function abrirPdf(blob) {
      return carregarPdfJs().catch(function (e) { throw Object.assign(new Error(String(e && e.message || e)), { semLeitor: true }); })
        .then(function (lib) {
          /* O PDF é lido POR FATIAS do Blob (o PDF.js pede o trecho de que
           * precisa), e não inteiro de uma vez: o maior livro tem 119 MB. */
          var transporte = new lib.PDFDataRangeTransport(blob.size, null);
          transporte.requestDataRange = function (de, ate) {
            blob.slice(de, ate).arrayBuffer().then(function (ab) {
              transporte.onDataRange(de, new Uint8Array(ab));
            }, function () { /* o PDF.js desiste do trecho e dá erro na página */ });
          };
          var tarefa = lib.getDocument({
            range: transporte, length: blob.size, rangeChunkSize: 262144,
            disableAutoFetch: true, disableStream: true,
            // nada de código vindo de dentro do PDF: o arquivo é de terceiro
            isEvalSupported: false, enableXfa: false, verbosity: 0
          });
          return tarefa.promise.then(function (doc) {
            return {
              total: doc.numPages,
              ler: function (n) {
                return doc.getPage(n).then(function (pg) {
                  return pg.getTextContent().then(function (c) {
                    var partes = [];
                    (c.items || []).forEach(function (it) {
                      if (typeof it.str === 'string') partes.push(it.str);
                      if (it.hasEOL) partes.push(' ');
                    });
                    pg.cleanup();
                    return partes.join('');
                  });
                });
              },
              soltar: function () { return tarefa.destroy().catch(function () {}); }
            };
          });
        });
    }

    var ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
    function textoDoXhtml(s) {
      return s.replace(/<(script|style|head)\b[\s\S]*?<\/\1\s*>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, function (m, e) {
          if (e[0] === '#') {
            var c = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
            try { return String.fromCodePoint(c); } catch (x) { return ' '; }
          }
          var v = ENTIDADES[e.toLowerCase()];
          return v == null ? m : v;
        });
    }

    function abrirEpub(blob, espinha) {
      return root.Zip.lerDoArquivo(blob).then(function (zipArq) {
        var porNome = {};
        zipArq.entradas.forEach(function (en) { porNome[en.nome] = en; });
        return {
          total: espinha.length,
          ler: function (n) {
            var en = porNome[espinha[n - 1]];
            if (!en) return Promise.resolve('');
            return root.Zip.extrairDoArquivo(zipArq, en).then(function (bytes) {
              return textoDoXhtml(new TextDecoder('utf-8').decode(bytes));
            });
          },
          soltar: function () { return Promise.resolve(); }
        };
      });
    }

    function indexar(livro) {
      pararPedido = false;
      var reg, fonte = null, lidas = 0;
      return lerRegistro(livro.id).then(function (atual) {
        var d = decidir(atual, livro);
        if (d === 'pronto') return 'pronto';
        return (d === 'refazer' ? recomecar(livro) : Promise.resolve(atual)).then(function (r) {
          reg = r;
          /* Livro que derruba a leitura (o Worker morre no meio, sempre no
           * mesmo lugar) não pode prender a fila para sempre: oito começos
           * seguidos sem avançar uma página e ele fica de fora, como sem texto. */
          reg.semAvanco = reg.proximaNoInicio === reg.proxima ? (reg.semAvanco || 0) + 1 : 0;
          reg.proximaNoInicio = reg.proxima;
          if (reg.semAvanco > 8) return terminar(reg, 'a leitura não avança').then(function () { return 'pronto'; });
          return transacao(['livros'], 'readwrite', function (t) { t.objectStore('livros').put(reg); }).then(function () {
            return livro.formato === 'epub' ? abrirEpub(livro.blob, livro.espinha || []) : abrirPdf(livro.blob);
          }).then(function (f) {
            fonte = f;
            reg.total = f.total;
            var n = reg.proxima;
            function passo() {
              if (n > reg.total) return terminar(reg).then(function () { return 'pronto'; });
              if (pararPedido) return 'parou';
              return f.ler(n).catch(function () { return ''; }).then(function (bruto) {
                return gravarPagina(reg, n, normalizar(bruto));
              }).then(function () {
                lidas++;
                avisar({ tipo: 'pagina', id: livro.id, pagina: n, total: reg.total });
                n++;
                return passo();
              });
            }
            return passo();
          }, function (e) {
            if (e && e.semLeitor) throw e;
            // o arquivo não abre (corrompido, com senha): fica de fora, sem erro para ela
            reg.total = reg.total || 0;
            return terminar(reg, e && e.message || e).then(function () { return 'pronto'; });
          });
        });
      }).then(function (fim) {
        return (fonte ? fonte.soltar() : Promise.resolve()).then(function () {
          avisar({ tipo: fim, id: livro.id, lidas: lidas, total: reg ? reg.total : null,
            semTexto: reg ? reg.semTexto.length : null });
        });
      }, function (e) {
        return (fonte ? fonte.soltar() : Promise.resolve()).then(function () {
          avisar({ tipo: 'falhou', id: livro.id, lidas: lidas, semLeitor: !!(e && e.semLeitor),
            semEspaco: !!(e && e.name === 'QuotaExceededError'), motivo: String(e && e.message || e).slice(0, 200) });
        });
      });
    }

    root.addEventListener('message', function (e) {
      var m = e.data || {};
      if (!m.indice) return;   // o PDF.js também conversa por aqui
      if (m.tipo === 'parar') { pararPedido = true; return; }
      if (m.tipo === 'indexar') indexar(m.livro);
    });
  }

  // ===================================================== a página

  function iniciarPagina() {
    var suportado = typeof indexedDB !== 'undefined' && typeof Worker === 'function' && typeof Promise === 'function';
    var fila = [];
    var trabalhador = null;
    var atual = null;          // { livro, resolver }
    var parado = false;        // "Apagar tudo" nesta sessão, ou sem leitor, ou sem espaço
    var pausado = false;       // aplicativo em segundo plano
    var sincronizando = null, deNovo = false;
    var situacao = { total: 0, prontos: 0, livro: null, pagina: null, de: null, lidasNaSessao: {}, motivo: null };
    var ouvintes = [];

    function estado() {
      return { total: situacao.total, prontos: situacao.prontos, rodando: !!atual, livro: situacao.livro,
        pagina: situacao.pagina, de: situacao.de, fila: fila.map(function (l) { return l.id; }),
        lidasNaSessao: Object.assign({}, situacao.lidasNaSessao), parado: parado, pausado: pausado,
        motivo: situacao.motivo };
    }

    function mudou() {
      desenharLinha();
      ouvintes.forEach(function (fn) { try { fn(estado()); } catch (e) { /* o ouvinte se vira */ } });
    }

    /* A linha discreta na Biblioteca: "Preparando a busca: 12 de 65 livros".
     * Só aparece com trabalho por fazer e o trabalho andando; some quando
     * termina (e quando o trabalho para por falta de leitor ou de espaço:
     * aviso que não leva a nada não aparece). */
    function desenharLinha() {
      if (typeof document === 'undefined') return;
      var linha = document.getElementById('indice-livros-progresso');
      if (!linha) return;
      var falta = situacao.total - situacao.prontos;
      var mostra = !parado && falta > 0 && (!!atual || fila.length > 0);
      if (!mostra) { linha.hidden = true; linha.textContent = ''; return; }
      linha.textContent = 'Preparando a busca: ' + situacao.prontos + ' de ' + situacao.total +
        (situacao.total === 1 ? ' livro' : ' livros');
      linha.hidden = false;
    }

    function dadosDoLivro(l) {
      var m = l.meta || {};
      return { id: l.id, hash: m.hash || null, formato: m.formato === 'epub' ? 'epub' : 'pdf',
        espinha: (m.epub && m.epub.espinha) || [] };
    }

    /* Põe o índice em dia com os livros do tablet: o livro que saiu sai do
     * índice; o trocado (hash novo) sai e volta para a fila; o que falta entra
     * na fila. Chamado pelo aplicativo sempre que a lista de livros é lida
     * (ao abrir, ao importar, ao remover). */
    function sincronizar() {
      if (!suportado || parado || !root.Store || typeof root.Store.listarLivros !== 'function') return Promise.resolve(estado());
      if (sincronizando) { deNovo = true; return sincronizando; }
      /* Ler o índice falhou (corrompido no meio do caminho): ele é apagado e
       * refeito, sem erro para ela. Já a falha de ler os LIVROS (o banco
       * principal ocupado) não apaga nada: fica para a próxima vez. */
      var indiceFalhou = false;
      var registros = lerRegistros().catch(function (e) { indiceFalhou = true; throw e; });
      sincronizando = Promise.all([root.Store.listarLivros(), registros]).then(function (r) {
        var livros = r[0] || [], regs = r[1] || [];
        var porId = {}, noTablet = {};
        regs.forEach(function (x) { porId[x.id] = x; });
        livros.forEach(function (l) { noTablet[l.id] = dadosDoLivro(l); });
        var sair = regs.filter(function (x) {
          return !noTablet[x.id] || decidir(x, noTablet[x.id]) === 'refazer';
        }).map(function (x) { return x.id; });
        // o livro que sai não pode continuar sendo lido
        if (atual && sair.indexOf(atual.livro.id) >= 0) pedirParada();
        return tirarDoIndice(sair).then(function () {
          sair.forEach(function (id) { delete porId[id]; });
          var nova = [], prontos = 0;
          livros.forEach(function (l) {
            var d = dadosDoLivro(l);
            if (decidir(porId[l.id], d) === 'pronto') prontos++;
            else if (!atual || atual.livro.id !== l.id) nova.push(d);
          });
          fila = nova;
          situacao.total = livros.length;
          situacao.prontos = prontos;
          mudou();
          proximo();
          return estado();
        });
      }).catch(function () {
        return (indiceFalhou ? apagarBanco() : Promise.resolve()).then(function () { return estado(); });
      }).then(function (e) {
        sincronizando = null;
        if (deNovo) { deNovo = false; return sincronizar(); }
        return e;
      });
      return sincronizando;
    }

    function obterTrabalhador() {
      if (trabalhador) return trabalhador;
      trabalhador = new Worker('indice-livros.js');
      trabalhador.onmessage = function (e) { receber(e.data || {}); };
      trabalhador.onerror = function (e) {
        if (e && e.preventDefault) e.preventDefault();
        /* O Worker caiu (ou nem subiu): para por esta sessão, calado, em vez
         * de subir outro para cada livro da fila. O livro de agora continua
         * na próxima abertura, e a retomada conta o começo sem avanço. */
        soltarTrabalhador();
        parado = true;
        situacao.motivo = 'trabalhador';
        terminarAtual('falhou');
      };
      return trabalhador;
    }

    function soltarTrabalhador() {
      if (trabalhador) { try { trabalhador.terminate(); } catch (e) { /* já foi */ } }
      trabalhador = null;
    }

    function pedirParada() {
      if (trabalhador && atual) trabalhador.postMessage({ indice: true, tipo: 'parar' });
    }

    function receber(m) {
      if (!m.indice || !atual || m.id !== atual.livro.id) return;
      if (m.tipo === 'pagina') {
        situacao.livro = m.id; situacao.pagina = m.pagina; situacao.de = m.total;
        situacao.lidasNaSessao[m.id] = (situacao.lidasNaSessao[m.id] || 0) + 1;
        mudou();
        return;
      }
      if (m.tipo === 'pronto') { situacao.prontos = Math.min(situacao.total, situacao.prontos + 1); terminarAtual('pronto'); return; }
      if (m.tipo === 'parou') { terminarAtual('parou'); return; }
      if (m.tipo === 'falhou') {
        if (m.semLeitor || m.semEspaco) {
          // sem o leitor (primeira vez sem sinal) ou sem espaço: para por esta sessão, calado
          parado = true;
          situacao.motivo = m.semLeitor ? 'sem-leitor' : 'sem-espaco';
        }
        terminarAtual('falhou');
      }
    }

    function terminarAtual(como) {
      if (!atual) return;
      var feito = atual;
      atual = null;
      situacao.livro = null; situacao.pagina = null; situacao.de = null;
      // o livro parado no meio (segundo plano) volta para a frente da fila
      if (como === 'parou' && !parado) fila.unshift(feito.livro);
      // em segundo plano, o Worker (e o PDF.js dentro dele) sai da memória
      if (pausado || parado) soltarTrabalhador();
      feito.resolver(como);
      mudou();
      proximo();
    }

    /* Um livro por vez, e uma janela só por vez: com o aplicativo aberto em
     * duas abas, a outra espera (Web Locks, quando o navegador tem). */
    function comTrava(fazer) {
      if (typeof navigator !== 'undefined' && navigator.locks && typeof navigator.locks.request === 'function') {
        return navigator.locks.request('indice-livros-trabalho', fazer);
      }
      return fazer();
    }

    /* A leitura não disputa a abertura do aplicativo: começa uns segundos
     * depois de a página carregar. */
    var ESPERA_NA_ABERTURA_MS = 3000;
    var esperando = null;
    function proximo() {
      if (atual || parado || pausado || esperando) return;
      if (!fila.length) { soltarTrabalhador(); return; }
      var agora = typeof performance !== 'undefined' ? performance.now() : ESPERA_NA_ABERTURA_MS;
      if (agora < ESPERA_NA_ABERTURA_MS) {
        esperando = setTimeout(function () { esperando = null; proximo(); }, ESPERA_NA_ABERTURA_MS - agora);
        return;
      }
      var livro = fila.shift();
      var trabalho = new Promise(function (resolver) { atual = { livro: livro, resolver: resolver }; });
      mudou();
      comTrava(function () {
        if (!atual || atual.livro !== livro) return Promise.resolve();
        /* O Blob sai do banco principal só como referência e vai ao Worker
         * pelo postMessage, que também não copia o arquivo. */
        return root.Store.lerLivro(livro.id).then(function (reg) {
          if (!atual || atual.livro !== livro) return;
          if (!reg || !reg.blob || (reg.meta && reg.meta.hash) !== livro.hash) { terminarAtual('saiu'); return; }
          if (pausado) { terminarAtual('parou'); return; }
          obterTrabalhador().postMessage({ indice: true, tipo: 'indexar', livro: Object.assign({ blob: reg.blob }, livro) });
          return trabalho;
        }, function () { terminarAtual('falhou'); });
      });
    }

    /* Segundo plano: o livro de agora para depois da página que está lendo
     * (a retomada guarda onde), e volta quando ela voltar ao aplicativo. */
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') { pausado = true; pedirParada(); }
        else if (pausado) { pausado = false; proximo(); }
      });
    }

    /* O "Apagar tudo" (store.js): para a leitura, apaga o banco do índice e não
     * recomeça nesta sessão. Os livros ficam no tablet, e o índice deles se
     * refaz na próxima vez que ela abrir o aplicativo. */
    function apagar() {
      parado = true;
      fila = [];
      soltarTrabalhador();
      terminarAtual('apagado');
      situacao.total = 0; situacao.prontos = 0;
      mudou();
      return apagarBanco();
    }

    // ------------------------------------------------------- a consulta

    function capitulosDoLivro(meta, total) {
      var epub = meta.formato === 'epub';
      var chaveIni = epub ? 'capitulo' : 'pagina', chaveFim = epub ? 'capitulo_fim' : 'pagina_fim';
      var fonte = Array.isArray(meta.sumario) && meta.sumario.length ? meta.sumario : (Array.isArray(meta.mapa) ? meta.mapa : []);
      var validas = fonte.filter(function (e) { return e && typeof e.titulo === 'string' && Number.isInteger(e[chaveIni]); });
      if (!validas.length) return [];
      // o capítulo é o nível de cima do sumário
      var nivel = Math.min.apply(null, validas.map(function (e) { return Number.isInteger(e.nivel) ? e.nivel : 1; }));
      var caps = validas.filter(function (e) { return (Number.isInteger(e.nivel) ? e.nivel : 1) === nivel; })
        .sort(function (a, b) { return a[chaveIni] - b[chaveIni]; });
      return caps.map(function (e, i) {
        var prox = caps[i + 1];
        var fim = Number.isInteger(e[chaveFim]) ? e[chaveFim] : (prox ? Math.max(e[chaveIni], prox[chaveIni] - 1) : (total || e[chaveIni]));
        return { n: e.n, titulo: e.titulo, inicio: e[chaveIni], fim: fim };
      });
    }

    function doFiltro(meta, filtros) {
      filtros = filtros || {};
      if (filtros.ano) {
        var ano = String(filtros.ano);
        var doAno = root.Biblioteca && typeof root.Biblioteca.livroDoAno === 'function'
          ? root.Biblioteca.livroDoAno(meta, ano)
          : Array.isArray(meta.series) && meta.series.indexOf(ano) >= 0;
        if (!doAno) return false;
      }
      if (filtros.disciplina) {
        var d = String(filtros.disciplina);
        if (meta.mapa_disciplina !== d && meta.materia !== d) return false;
      }
      return true;
    }

    function paginasComTermo(id, alvo) {
      return transacao(['paginas'], 'readonly', function (t, dar) {
        var q = t.objectStore('paginas').getAll(faixaDoLivro(id));
        q.onsuccess = function () {
          dar((q.result || []).filter(function (p) { return p.texto.indexOf(alvo) >= 0; })
            .map(function (p) { return p.pagina; }).sort(function (a, b) { return a - b; }));
        };
      });
    }

    /* buscarNosLivros(termo, { ano, disciplina })
     *
     * Procura o termo (sem acento e sem maiúscula, como o índice) no texto dos
     * livros do tablet, de um livro por vez. `ano` é o ano escolar ('08',
     * 'em2'), pela mesma regra do "Abrir no livro" (Biblioteca.livroDoAno);
     * `disciplina` é a matéria do livro (o id do índice de assuntos).
     *
     * Devolve uma promessa de:
     *   { termo, normalizado,
     *     livros: [{ id, titulo, volume, formato, unidade ('pagina' no PDF,
     *       'parte' no EPUB: a posição na espinha), total, semTexto (quantas
     *       páginas daquele livro não puderam ser lidas), paginas: [todas as
     *       páginas do ARQUIVO com o termo],
     *       capitulos: [{ n, titulo, inicio, fim, paginas: [...] }] }],
     *       (as páginas fora de todo capítulo ficam num capítulo de n e
     *       titulo null, no fim)
     *     pendentes: [ids dos livros do filtro ainda não indexados] }
     * Os livros vêm na ordem do tablet (título), só os que têm o termo. */
    function buscarNosLivros(termo, filtros) {
      var alvo = normalizar(termo);
      var saida = { termo: String(termo == null ? '' : termo), normalizado: alvo, livros: [], pendentes: [] };
      if (!suportado || !temTexto(alvo) || !root.Store) return Promise.resolve(saida);
      return Promise.all([root.Store.listarLivros(), lerRegistros().catch(function () { return []; })]).then(function (r) {
        var porId = {};
        r[1].forEach(function (x) { porId[x.id] = x; });
        var candidatos = (r[0] || []).filter(function (l) { return l && l.meta && doFiltro(l.meta, filtros); });
        var seq = Promise.resolve();
        candidatos.forEach(function (l) {
          var reg = porId[l.id], d = dadosDoLivro(l);
          var estadoDoLivro = decidir(reg, d);
          if (estadoDoLivro !== 'pronto') saida.pendentes.push(l.id);
          // o livro começado já responde pelas páginas lidas
          if (!reg || estadoDoLivro === 'refazer') return;
          seq = seq.then(function () { return paginasComTermo(l.id, alvo); }).then(function (paginas) {
            if (!paginas.length) return;
            var caps = capitulosDoLivro(l.meta, reg.total);
            var grupos = caps.map(function (c) { return { n: c.n, titulo: c.titulo, inicio: c.inicio, fim: c.fim, paginas: [] }; });
            var fora = { n: null, titulo: null, inicio: null, fim: null, paginas: [] };
            paginas.forEach(function (p) {
              var g = null;
              grupos.forEach(function (c) { if (p >= c.inicio && p <= c.fim && (!g || c.inicio >= g.inicio)) g = c; });
              (g || fora).paginas.push(p);
            });
            saida.livros.push({
              id: l.id, titulo: l.meta.titulo || l.id, volume: l.meta.volume || null, formato: d.formato,
              unidade: d.formato === 'epub' ? 'parte' : 'pagina', total: reg.total,
              semTexto: (reg.semTexto || []).length, pronto: estadoDoLivro === 'pronto', paginas: paginas,
              capitulos: grupos.filter(function (c) { return c.paginas.length; }).concat(fora.paginas.length ? [fora] : [])
            });
          });
        });
        return seq.then(function () { return saida; });
      });
    }

    root.IndiceLivros = {
      sincronizar: sincronizar, buscarNosLivros: buscarNosLivros, estado: estado, apagar: apagar,
      aoMudar: function (fn) { ouvintes.push(fn); },
      normalizar: normalizar, NOME_BANCO: NOME, MOTOR: MOTOR
    };
    // a tela de busca (outra fatia) chama daqui
    root.buscarNosLivros = buscarNosLivros;
  }
})(typeof self !== 'undefined' ? self : this);
