/* indice-livros.js
 * O índice de texto dos livros (B12): o motor da busca no texto dos livros
 * deste tablet. A tela de busca chama buscarNosLivros; este arquivo não
 * desenha nada além da linha de progresso da Biblioteca.
 *
 * O MESMO ARQUIVO RODA EM DOIS LUGARES:
 *   na página (index.html o carrega): a fila, a sincronização com os livros
 *     do tablet, a vigia (prazo, leitor aberto, segundo plano), a linha de
 *     progresso e a consulta;
 *   no Web Worker (new Worker('indice-livros.js')): a leitura do texto, um
 *     livro por vez e uma página por vez, com o PDF.js do aplicativo
 *     (vendor/pdfjs-6.4.299), e os EPUBs pelo texto do próprio EPUB.
 * Um arquivo só, e não dois, para a normalização da consulta e a do índice
 * serem a MESMA função, e para o service worker servir as duas metades da
 * mesma versão (o pedido do Worker sai da janela, que está presa à versão que
 * ela escolheu; o importScripts do zip.js sai do Worker, que cai no cache
 * selecionado: o zip.js é estável, e isso fica dito no relato do B12).
 *
 * ONDE MORA: num banco IndexedDB SEPARADO, 'indice-livros', e não num
 * depósito novo do banco principal. O banco principal continua na versão 6:
 * subir para a 7 trancaria fora o código antigo (VersionError) na volta de
 * versão e dispararia o aviso de banco bloqueado. Um banco à parte fica, por
 * construção, fora da cópia de segurança (o exportarTudo só lê o banco
 * principal) e fora da nuvem (idem). O "Apagar tudo" o apaga (store.js,
 * apagarTudo), sem esperar por ele. Ele é CACHE: pode sumir, chegar
 * corrompido ou numa versão que este código não conhece, e a resposta é
 * sempre a mesma, apagar e refazer a partir dos livros, sem dizer nada a ela.
 *
 * Depósitos (versão 1 do banco 'indice-livros'):
 *   livros  : um registro por livro, pelo id do livro: o hash do arquivo de
 *             onde o índice saiu, a versão deste motor, quantas unidades o
 *             livro tem (páginas do PDF, partes da espinha do EPUB), a
 *             próxima a ler (a retomada), as páginas sem texto, as falhas
 *             passageiras seguidas e o erro que tirou o livro da leitura;
 *   paginas : o texto normalizado de cada página COM texto, pela chave
 *             [id do livro, página do ARQUIVO]. Página sem texto não entra:
 *             fica contada no registro do livro.
 *
 * RETOMADA: o Worker grava cada página e o avanço do livro na mesma
 * transação, e só depois de conferir, nessa transação, que o registro ainda é
 * o mesmo livro (hash) e que a página é a esperada (proxima). Fechar o
 * aplicativo no meio perde no máximo a página que estava sendo lida; a
 * próxima abertura continua de `proxima`. O livro pronto, de mesmo hash e
 * mesma versão do motor, não é lido de novo (decidir).
 *
 * FALHAS: a PERMANENTE (PDF com senha, arquivo que não é PDF, EPUB que o
 * leitor de zip recusa) tira o livro da leitura e ele aparece na consulta
 * como não lido. A PASSAGEIRA (memória, leitura do arquivo, prazo, o Worker
 * que morre) deixa o livro para a próxima abertura, de onde parou; depois de
 * LIMITE_DE_FALHAS seguidas SEM avançar uma página, ele também sai, como não
 * lido. Avançar zera a conta. Pausa, falta do leitor e falta de espaço não
 * contam como falha.
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
  var LIMITE_DE_FALHAS = 4;

  var HIFEN_INVISIVEL = String.fromCharCode(0xAD);
  var SEM_HIFEN_INVISIVEL = new RegExp(HIFEN_INVISIVEL, 'g');
  /* A palavra partida no fim da linha ("multipli-" e "cação" na linha de
   * baixo) volta a ser uma palavra: hífen, ou hífen invisível, colado numa
   * letra, no fim da linha, com letra minúscula no começo da seguinte. */
  var PARTIDA_NO_FIM_DA_LINHA = new RegExp('([A-Za-zÀ-ÖØ-öø-ÿ])[-' + HIFEN_INVISIVEL + ']\n(?=[a-zß-öø-ÿ])', 'g');

  /* A NORMALIZAÇÃO, a mesma no índice e na consulta: sem acento, sem
   * maiúscula, sem hífen invisível, ligaduras desfeitas (o "fi" de uma letra
   * só que os PDFs usam) e espaços juntados num só. */
  function normalizar(texto) {
    return String(texto == null ? '' : texto).replace(PARTIDA_NO_FIM_DA_LINHA, '$1').normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(SEM_HIFEN_INVISIVEL, '')
      .toLowerCase().replace(/\s+/g, ' ').trim();
  }

  /* Página com texto é a que tem ao menos uma letra ou um algarismo. */
  function temTexto(normalizado) { return /[a-z0-9]/.test(normalizado); }

  /* AS PALAVRAS DA CONSULTA (pedido do dono, 12/11/2026). "volume do
   * cilindro" achava a frase inteira em páginas de física ("o volume do
   * cilindro de gás") e, na tela, misturava tudo. A regra agora:
   *   - a página entra quando tem TODAS as palavras significativas da
   *     consulta, em qualquer ordem;
   *   - as palavras de ligação abaixo não contam (sem elas, "volume do
   *     cilindro" pede "volume" e "cilindro");
   *   - a palavra de uma letra só ("x", o "2" de "capítulo 2") casa só
   *     inteira, porque por trecho casaria quase toda página;
   *   - a FRASE exata, em sequência, é contada à parte (paginasComFrase), e a
   *     tela a põe na frente;
   *   - consulta só de palavras de ligação ("de") procura ela mesma, por
   *     trecho, como antes.
   * Normalizado é o texto que já passou por normalizar. */
  var PALAVRAS_DE_LIGACAO = ['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'as', 'os', 'em', 'no', 'na', 'um', 'uma', 'para', 'com', 'por'];
  function palavrasDaBusca(normalizado) {
    var alvo = String(normalizado == null ? '' : normalizado);
    var significativas = alvo.split(/[^a-z0-9]+/).filter(function (p) { return p && PALAVRAS_DE_LIGACAO.indexOf(p) < 0; });
    return significativas.length ? significativas : (temTexto(alvo) ? [alvo] : []);
  }
  function casaPalavra(texto, p) {
    if (p.length > 1) return texto.indexOf(p) >= 0;
    return new RegExp('(^|[^a-z0-9])' + p + '([^a-z0-9]|$)').test(texto);
  }
  function casaTodas(texto, palavras) {
    for (var i = 0; i < palavras.length; i++) if (!casaPalavra(texto, palavras[i])) return false;
    return palavras.length > 0;
  }

  /* O que fazer com um livro, dado o registro do índice (ou nada) e o livro
   * do tablet ({ id, hash }):
   *   'refazer'   sem registro, arquivo trocado (hash novo) ou motor velho;
   *   'pronto'    já indexado (ou tirado da leitura por erro): não se lê de novo;
   *   'continuar' começado e interrompido: segue de `proxima`. */
  function decidir(reg, livro) {
    if (!reg || !livro || reg.hash !== livro.hash || reg.motor !== MOTOR) return 'refazer';
    if (reg.pronto) return 'pronto';
    return 'continuar';
  }

  /* O erro que não passa tentando de novo: é do arquivo, e não do momento. */
  var PERMANENTES = ['PasswordException', 'InvalidPDFException', 'FormatError', 'MissingPDFException'];
  function falhaPermanente(e) {
    if (!e) return false;
    if (PERMANENTES.indexOf(e.name || e.nome) >= 0) return true;
    // o leitor de zip recusa o EPUB pelo formato (e.zip); a falta de descompressão é do navegador
    if (e.zip && !e.passageira && !/SEM_DESCOMPRESSAO/.test(String(e.message || e.mensagem || ''))) return true;
    return false;
  }
  function semEspaco(e) { return !!e && (e.name || e.nome) === 'QuotaExceededError'; }

  // ------------------------------------------------------------ o banco

  var conexao = null;
  var aoBancoTrocado = function () {};
  var bancoRecusado = false;   // no Worker: outro pediu o banco, e este não o reabre

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
         * nova) quer o banco: esta conexão sai do caminho, e a leitura para
         * (aoBancoTrocado), para não recriar o banco por baixo de quem o apagou. */
        b.onversionchange = function () {
          b.close();
          if (conexao === b) conexao = null;
          try { aoBancoTrocado(); } catch (e) { /* segue */ }
        };
        b.onclose = function () { if (conexao === b) conexao = null; };
        conexao = b;
        resolve(b);
      };
      req.onerror = function () { reject(req.error || new Error('o índice dos livros não abriu')); };
    });
  }

  /* Apaga o banco do índice. Nunca prende quem chamou: com uma conexão que
   * não fecha (outra janela congelada), o pedido fica pendente no navegador
   * e termina sozinho quando ela fechar, mas a promessa resolve no prazo. */
  function apagarBanco(prazoMs) {
    if (conexao) { try { conexao.close(); } catch (e) { /* já fechou */ } conexao = null; }
    return new Promise(function (resolve) {
      var feito = false;
      function fim() { if (!feito) { feito = true; resolve(); } }
      var req;
      try { req = indexedDB.deleteDatabase(NOME); } catch (e) { fim(); return; }
      req.onsuccess = fim;
      req.onerror = fim;
      req.onblocked = function () { /* fica pendente; o prazo responde por ela */ };
      if (prazoMs) setTimeout(fim, prazoMs);
    });
  }

  /* Abre; se não abrir (corrompido, sem os depósitos, numa versão que este
   * código não conhece), apaga e abre de novo, uma vez. */
  function abrirBanco() {
    if (bancoRecusado) return Promise.reject(Object.assign(new Error('o índice foi pedido por outro'), { bancoTrocado: true }));
    if (conexao) return Promise.resolve(conexao);
    return abrirUmaVez().catch(function () {
      return apagarBanco(3000).then(abrirUmaVez);
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

  /* Uma falha do livro `id` (do arquivo de hash `hash`), contada no registro
   * dele. Usada pelo Worker (o erro que ele viu) e pela página (o Worker que
   * morreu ou estourou o prazo). Só mexe no registro do MESMO arquivo. */
  /* naPagina: a falha veio com o livro já aberto, lendo a página `proxima`
   * (o Worker que morre ou trava no meio). Ela conta para ESSA página: na
   * TENTATIVAS_POR_PAGINA-ésima vez seguida, só a página sai (fica entre as
   * que não puderam ser lidas) e a leitura segue da seguinte. Só a falha na
   * ABERTURA conta para o livro inteiro. */
  var TENTATIVAS_POR_PAGINA = 3;
  function registrarFalha(id, hash, erro, naPagina) {
    return transacao(['livros'], 'readwrite', function (t, dar) {
      var dep = t.objectStore('livros');
      var q = dep.get(id);
      q.onsuccess = function () {
        var r = q.result;
        if (!r || r.hash !== hash || r.motor !== MOTOR || r.pronto) { dar(null); return; }
        var permanente = falhaPermanente(erro);
        if (!permanente && naPagina && r.total != null) {
          var n = r.proxima;
          r.falhaDaPagina = r.falhaDaPagina && r.falhaDaPagina.n === n ? { n: n, vezes: r.falhaDaPagina.vezes + 1 } : { n: n, vezes: 1 };
          if (r.falhaDaPagina.vezes >= TENTATIVAS_POR_PAGINA) {
            r.ilegiveis = (r.ilegiveis || []).concat([n]);
            r.proxima = n + 1;
            r.falhaDaPagina = null;
          }
          dep.put(r);
          dar({ pronto: false, falhas: r.falhas || 0, permanente: false, pagina: n });
          return;
        }
        if (!permanente) {
          // a conta zera quando o livro avançou desde a última falha
          r.falhas = r.proximaNaFalha === r.proxima ? (r.falhas || 0) + 1 : 1;
          r.proximaNaFalha = r.proxima;
        }
        if (permanente || r.falhas >= LIMITE_DE_FALHAS) {
          r.pronto = true;
          r.erro = { permanente: permanente, nome: String(erro && (erro.name || erro.nome) || 'Erro'),
            motivo: String(erro && (erro.message || erro.mensagem) || erro || '').slice(0, 200) };
        }
        dep.put(r);
        dar({ pronto: !!r.pronto, falhas: r.falhas || 0, permanente: permanente });
      };
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
    aoBancoTrocado = function () { bancoRecusado = true; pararPedido = true; };

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

    function comPrazo(promessa, ms, rotulo) {
      return new Promise(function (resolve, reject) {
        var relogio = setTimeout(function () { reject(Object.assign(new Error(rotulo + ' passou de ' + ms + ' ms'), { name: 'Prazo' })); }, ms);
        promessa.then(function (v) { clearTimeout(relogio); resolve(v); }, function (e) { clearTimeout(relogio); reject(e); });
      });
    }

    /* O registro novo de um livro que começa do zero: as páginas velhas saem
     * na mesma transação. */
    function recomecar(livro) {
      var reg = { id: livro.id, hash: livro.hash, motor: MOTOR, formato: livro.formato, total: null, proxima: 1,
        semTexto: [], pronto: false, erro: null, falhas: 0, proximaNaFalha: null };
      return transacao(['livros', 'paginas'], 'readwrite', function (t) {
        t.objectStore('paginas').delete(faixaDoLivro(livro.id));
        t.objectStore('livros').put(reg);
      }).then(function () { return reg; });
    }

    /* Toda gravação do meio do livro passa por aqui: na MESMA transação, o
     * registro tem de ser ainda o do mesmo arquivo e estar na página
     * esperada. Se o banco foi apagado e recriado, o livro removido ou
     * trocado, ou outra janela andou com ele, nada é gravado (descompasso). */
    function gravarConferido(reg, esperada, fazer) {
      var descompasso = false;
      return transacao(['livros', 'paginas'], 'readwrite', function (t) {
        var q = t.objectStore('livros').get(reg.id);
        q.onsuccess = function () {
          var r = q.result;
          if (!r || r.hash !== reg.hash || r.motor !== reg.motor || r.pronto || r.proxima !== esperada) {
            descompasso = true;
            t.abort();
            return;
          }
          fazer(t);
        };
      }).catch(function (e) {
        if (descompasso) throw Object.assign(new Error('o registro do livro mudou por baixo'), { descompasso: true });
        throw e;
      });
    }

    /* Uma página lida: o texto (se tiver) e o avanço do livro, juntos. */
    function gravarPagina(reg, n, texto, ilegivel) {
      var comTexto = !ilegivel && temTexto(texto);
      var ileg = reg.ilegiveis || [];
      var novo = Object.assign({}, reg, { proxima: n + 1, falhaDaPagina: null,
        ilegiveis: ilegivel && ileg.indexOf(n) < 0 ? ileg.concat([n]) : ileg,
        semTexto: comTexto || ilegivel || reg.semTexto.indexOf(n) >= 0 ? reg.semTexto : reg.semTexto.concat([n]) });
      return gravarConferido(reg, n, function (t) {
        var p = t.objectStore('paginas');
        if (comTexto) p.put({ id: reg.id, pagina: n, texto: texto });
        else p.delete([reg.id, n]);
        t.objectStore('livros').put(novo);
      }).then(function () { return novo; });
    }

    /* As unidades de um livro: { total, ler(n) -> texto, soltar() }. */
    function abrirPdf(blob, prazos) {
      return carregarPdfJs().catch(function (e) { throw Object.assign(new Error(String(e && e.message || e)), { semLeitor: true }); })
        .then(function (lib) {
          /* O PDF é lido POR FATIAS do Blob (o PDF.js pede o trecho de que
           * precisa), e não inteiro de uma vez: o maior livro tem 119 MB. A
           * fatia que não se lê QUEBRA a leitura na hora (quebra), em vez de
           * deixar o PDF.js esperando um trecho que nunca vem. */
          var quebrar;
          var quebra = new Promise(function (_, rej) { quebrar = rej; });
          quebra.catch(function () {});
          var transporte = new lib.PDFDataRangeTransport(blob.size, null);
          transporte.requestDataRange = function (de, ate) {
            blob.slice(de, ate).arrayBuffer().then(function (ab) {
              transporte.onDataRange(de, new Uint8Array(ab));
            }, function (e) { quebrar(e || new Error('a leitura do arquivo falhou')); });
          };
          var tarefa = lib.getDocument({
            range: transporte, length: blob.size, rangeChunkSize: 262144,
            disableAutoFetch: true, disableStream: true,
            // nada de código vindo de dentro do PDF: o arquivo é de terceiro
            isEvalSupported: false, enableXfa: false, verbosity: 0
          });
          var soltar = function () { return tarefa.destroy().catch(function () {}); };
          return comPrazo(Promise.race([tarefa.promise, quebra]), prazos.paginaMs, 'a abertura do livro').then(function (doc) {
            return {
              total: doc.numPages,
              ler: function (n) {
                var leitura = doc.getPage(n).then(function (pg) {
                  return pg.getTextContent().then(function (c) {
                    var partes = [];
                    (c.items || []).forEach(function (it) {
                      if (typeof it.str === 'string') partes.push(it.str);
                      if (it.hasEOL) partes.push('\n');
                    });
                    pg.cleanup();
                    return partes.join('');
                  });
                });
                return comPrazo(Promise.race([leitura, quebra]), prazos.paginaMs, 'a página ' + n);
              },
              soltar: soltar
            };
          }, function (e) { soltar(); throw e; });
        });
    }

    /* O texto do capítulo do EPUB, sem as marcas. Marca de bloco (parágrafo,
     * título, quebra de linha, item de lista, célula) vira espaço; marca de
     * dentro da linha (<b>, <i>, <span>) não separa a palavra. */
    var BLOCO = /^(p|div|br|hr|li|ul|ol|dl|dt|dd|h[1-6]|section|article|aside|header|footer|nav|blockquote|pre|table|thead|tbody|tfoot|tr|td|th|caption|figure|figcaption|body|html|title)$/i;
    var ENTIDADES = { amp: 38, lt: 60, gt: 62, quot: 34, apos: 39, nbsp: 32, shy: 0xAD, ordf: 0xAA, ordm: 0xBA, deg: 0xB0,
      sup1: 0xB9, sup2: 0xB2, sup3: 0xB3, laquo: 0xAB, raquo: 0xBB, middot: 0xB7, times: 0xD7, divide: 0xF7,
      ndash: 0x2D, mdash: 0x2D, hellip: 0x2026, lsquo: 39, rsquo: 39, ldquo: 34, rdquo: 34, euro: 0x20AC };
    // as letras acentuadas do Latin-1, pelo nome (aacute, Ccedil, otilde...)
    (function () {
      var marcas = { grave: [0xC0, 0xC8, 0xCC, 0xD2, 0xD9], acute: [0xC1, 0xC9, 0xCD, 0xD3, 0xDA], circ: [0xC2, 0xCA, 0xCE, 0xD4, 0xDB],
        uml: [0xC4, 0xCB, 0xCF, 0xD6, 0xDC] };
      Object.keys(marcas).forEach(function (m) {
        'AEIOU'.split('').forEach(function (v, i) {
          ENTIDADES[v + m] = marcas[m][i];
          ENTIDADES[v.toLowerCase() + m] = marcas[m][i] + 0x20;
        });
      });
      ENTIDADES.Atilde = 0xC3; ENTIDADES.atilde = 0xE3; ENTIDADES.Otilde = 0xD5; ENTIDADES.otilde = 0xF5;
      ENTIDADES.Ntilde = 0xD1; ENTIDADES.ntilde = 0xF1; ENTIDADES.Ccedil = 0xC7; ENTIDADES.ccedil = 0xE7;
      ENTIDADES.Yacute = 0xDD; ENTIDADES.yacute = 0xFD; ENTIDADES.szlig = 0xDF;
    })();
    function textoDoXhtml(s) {
      return s.replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<(script|style|head)\b[\s\S]*?<\/\1\s*>/gi, ' ')
        .replace(/<\/?([a-z][a-z0-9:-]*)\b[^>]*>/gi, function (m, nome) { return BLOCO.test(nome.replace(/^.*:/, '')) ? ' ' : ''; })
        .replace(/<[^>]*>/g, ' ')
        .replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z][a-z0-9]*);/gi, function (m, e) {
          var c;
          if (e[0] === '#') c = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
          else c = ENTIDADES[e];
          if (c == null) return m;
          try { return String.fromCodePoint(c); } catch (x) { return ' '; }
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

    function comoMensagem(e) {
      return { nome: String(e && e.name || 'Erro'), mensagem: String(e && e.message || e || '').slice(0, 200), zip: !!(e && e.zip) };
    }

    function indexar(livro, prazos) {
      pararPedido = false;
      var reg = null, fonte = null, lidas = 0;
      avisar({ tipo: 'iniciou', id: livro.id });
      return lerRegistro(livro.id).then(function (atual) {
        var d = decidir(atual, livro);
        if (d === 'pronto') return 'pronto';
        return (d === 'refazer' ? recomecar(livro) : Promise.resolve(atual)).then(function (r) {
          reg = r;
          return livro.formato === 'epub' ? abrirEpub(livro.blob, livro.espinha || []) : abrirPdf(livro.blob, prazos);
        }).then(function (f) {
          fonte = f;
          avisar({ tipo: 'aberto', id: livro.id });
          /* Uma página: o texto, ou '' (sem texto pelo CONTEÚDO dela), ou
           * ilegível. A falha passageira é tentada de novo, com o livro
           * reaberto (a fatia que falhou deixa o documento quebrado), até
           * TENTATIVAS_POR_PAGINA vezes; depois SÓ essa página sai, e o livro
           * segue. Se a reabertura falhar, o erro é da abertura. */
          function lerPagina(n) {
            var tentativa = 0;
            function uma() {
              return fonte.ler(n).then(function (bruto) { return { texto: normalizar(bruto) }; }, function (e) {
                if (falhaPermanente(e)) return { texto: '' };
                if (++tentativa >= TENTATIVAS_POR_PAGINA) return { texto: '', ilegivel: true };
                return fonte.soltar().then(function () {
                  return livro.formato === 'epub' ? abrirEpub(livro.blob, livro.espinha || []) : abrirPdf(livro.blob, prazos);
                }).then(function (nova) { fonte = nova; return uma(); });
              });
            }
            return uma();
          }
          var antes = reg.proxima;
          var comTotal = Object.assign({}, reg, { total: f.total });
          return gravarConferido(reg, antes, function (t) { t.objectStore('livros').put(comTotal); }).then(function () {
            reg = comTotal;
            function passo() {
              if (reg.proxima > reg.total) {
                var pronto = Object.assign({}, reg, { pronto: true, falhas: 0 });
                return gravarConferido(reg, reg.proxima, function (t) { t.objectStore('livros').put(pronto); })
                  .then(function () { reg = pronto; return 'pronto'; });
              }
              if (pararPedido) return 'parou';
              var n = reg.proxima;
              return lerPagina(n).then(function (lida) {
                if (pararPedido) return 'parou';
                return gravarPagina(reg, n, lida.texto, lida.ilegivel).then(function (novo) {
                  reg = novo;
                  lidas++;
                  avisar({ tipo: 'pagina', id: livro.id, pagina: n, total: reg.total });
                  return passo();
                });
              });
            }
            return passo();
          });
        });
      }).then(function (fim) {
        return (fonte ? fonte.soltar() : Promise.resolve()).then(function () {
          avisar({ tipo: fim, id: livro.id, lidas: lidas, total: reg ? reg.total : null,
            semTexto: reg ? reg.semTexto.length : null });
        });
      }, function (e) {
        var soltar = fonte ? fonte.soltar() : Promise.resolve();
        var base = { tipo: 'falhou', id: livro.id, lidas: lidas, erro: comoMensagem(e) };
        if (e && (e.semLeitor || e.descompasso || e.bancoTrocado || bancoRecusado || semEspaco(e))) {
          return soltar.then(function () {
            avisar(Object.assign(base, { semLeitor: !!e.semLeitor, descompasso: !!e.descompasso,
              bancoTrocado: !!(e.bancoTrocado || bancoRecusado), semEspaco: semEspaco(e) }));
          });
        }
        // o erro do livro (permanente ou passageiro) fica contado no registro dele
        return soltar.then(function () {
          return registrarFalha(livro.id, livro.hash, e).catch(function () { return null; });
        }).then(function (conta) {
          avisar(Object.assign(base, { contada: true, tirado: !!(conta && conta.pronto), permanente: falhaPermanente(e) }));
        });
      });
    }

    root.addEventListener('message', function (e) {
      var m = e.data || {};
      if (!m.indice) return;   // o PDF.js também conversa por aqui
      if (m.tipo === 'parar') { pararPedido = true; return; }
      if (m.tipo === 'indexar') indexar(m.livro, m.prazos || { paginaMs: 60000 });
    });
  }

  // ===================================================== a página

  function iniciarPagina() {
    var suportado = typeof indexedDB !== 'undefined' && typeof Worker === 'function' && typeof Promise === 'function';
    /* Os prazos e a folga de espaço. As provas os encurtam por
     * window.INDICE_LIVROS_CONFIG, antes de o aplicativo carregar. */
    var CONFIG = Object.assign({
      semNoticiaMs: 90000,          // o Worker calado por mais que isto morreu ou travou
      livroMs: 30 * 60000,          // um livro sozinho não segura a fila mais que isto por abertura
      paginaMs: 60000,              // uma página (ou a abertura do livro) dentro do Worker
      folgaBytes: 100 * 1048576,    // o índice não começa um livro com menos que isto livre
      semEspacoPorMs: 3 * 86400000  // sem espaço, não tenta de novo antes disto
    }, root.INDICE_LIVROS_CONFIG || {});
    var MARCA_SEM_ESPACO = 'indice-livros-sem-espaco-ate';

    var fila = [];
    var trabalhador = null;
    var atual = null;          // { livro, resolver, inicio, noticia, iniciou, parando }
    var parado = false;        // "Apagar tudo", sem leitor, sem espaço, banco pedido por outro: até a próxima abertura
    var pausado = false;       // aplicativo em segundo plano
    var ocupadoFn = null;      // o app diz quando o leitor ou a importação estão abertos
    var recomecados = {};
    var sincronizando = null, deNovo = false;
    var situacao = { total: 0, prontos: 0, livro: null, pagina: null, de: null, lidasNaSessao: {}, falhasNaSessao: {}, motivo: null };
    var ouvintes = [];
    var vigia = null;

    aoBancoTrocado = function () {
      // outro (o "Apagar tudo" de outra janela, a cura) apagou ou subiu o índice: esta janela para
      pararTudo('banco-trocado');
    };

    function ocupado() {
      if (!ocupadoFn) return false;
      try { return !!ocupadoFn(); } catch (e) { return false; }
    }

    function estado() {
      return { total: situacao.total, prontos: situacao.prontos, rodando: !!atual, livro: situacao.livro,
        pagina: situacao.pagina, de: situacao.de, fila: fila.map(function (l) { return l.id; }),
        lidasNaSessao: Object.assign({}, situacao.lidasNaSessao), falhasNaSessao: Object.assign({}, situacao.falhasNaSessao),
        parado: parado, pausado: pausado, ocupado: ocupado(), motivo: situacao.motivo };
    }

    function mudou() {
      desenharLinha();
      ouvintes.forEach(function (fn) { try { fn(estado()); } catch (e) { /* o ouvinte se vira */ } });
    }

    /* A linha discreta na Biblioteca: "Preparando a busca: 12 de 65 livros".
     * Só aparece com trabalho por fazer; some quando termina (e quando o
     * trabalho para por falta de leitor ou de espaço: aviso que não leva a
     * nada não aparece). */
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

    function semEspacoAte() {
      try { return Number(root.localStorage.getItem(MARCA_SEM_ESPACO)) || 0; } catch (e) { return 0; }
    }

    /* Sem espaço: o índice (que é derivado, e se refaz) sai do tablet para não
     * disputar o lugar com as aulas, e a leitura não tenta de novo por uns
     * dias, em vez de insistir a cada abertura. */
    function tratarSemEspaco() {
      try { root.localStorage.setItem(MARCA_SEM_ESPACO, String(Date.now() + CONFIG.semEspacoPorMs)); } catch (e) { /* sem marca: tenta na próxima */ }
      pararTudo('sem-espaco');
      apagarBanco(3000);
    }

    /* Põe o índice em dia com os livros do tablet: o livro que saiu sai do
     * índice; o trocado (hash novo) sai e volta para a fila; o que falta entra
     * na fila. Chamado pelo aplicativo sempre que a lista de livros é lida
     * (ao abrir, ao importar, ao remover). */
    function sincronizar() {
      if (!suportado || parado || !root.Store || typeof root.Store.listarLivros !== 'function') return Promise.resolve(estado());
      if (semEspacoAte() > Date.now()) { parado = true; situacao.motivo = 'sem-espaco'; mudou(); return Promise.resolve(estado()); }
      if (sincronizando) { deNovo = true; return sincronizando; }
      /* Ler o índice falhou (corrompido no meio do caminho): ele é apagado e
       * refeito, sem erro para ela. Já a falha de ler os LIVROS (o banco
       * principal ocupado) não apaga nada: fica para a próxima vez. */
      var indiceFalhou = false;
      sincronizando = root.Store.listarLivros().then(function (livros) {
        livros = livros || [];
        if (!livros.length) {
          /* Sem livro nenhum (o celular, o observador, quem nunca importou):
           * o índice não é aberto, para não nascer um banco vazio. Se houver
           * um de antes (todos os livros removidos), ele sai. */
          fila = [];
          situacao.total = 0; situacao.prontos = 0;
          mudou();
          // deleteDatabase de um banco que não existe não cria nada
          if (atual) { soltarTrabalhador(); terminarAtual('saiu'); }
          return apagarBanco(3000).then(function () { return estado(); });
        }
        return lerRegistros().catch(function (e) { indiceFalhou = true; throw e; }).then(function (regs) {
          var porId = {}, noTablet = {};
          regs.forEach(function (x) { porId[x.id] = x; });
          livros.forEach(function (l) { noTablet[l.id] = dadosDoLivro(l); });
          var sair = regs.filter(function (x) {
            return !noTablet[x.id] || decidir(x, noTablet[x.id]) === 'refazer';
          }).map(function (x) { return x.id; });
          // o livro que sai (removido ou trocado) não pode continuar sendo lido
          if (atual && (sair.indexOf(atual.livro.id) >= 0 || !noTablet[atual.livro.id] ||
              noTablet[atual.livro.id].hash !== atual.livro.hash)) pedirParada();
          return tirarDoIndice(sair).then(function () {
            sair.forEach(function (id) { delete porId[id]; });
            var nova = [], prontos = 0;
            livros.forEach(function (l) {
              var d = dadosDoLivro(l);
              if (decidir(porId[l.id], d) === 'pronto') prontos++;
              else if (!atual || atual.livro.id !== l.id || atual.livro.hash !== d.hash) nova.push(d);
            });
            fila = nova;
            situacao.total = livros.length;
            situacao.prontos = prontos;
            mudou();
            proximo();
            return estado();
          });
        });
      }).catch(function () {
        return (indiceFalhou ? apagarBanco(3000) : Promise.resolve()).then(function () { return estado(); });
      }).then(function (e) {
        sincronizando = null;
        if (deNovo) { deNovo = false; return sincronizar(); }
        return e;
      });
      return sincronizando;
    }

    function obterTrabalhador() {
      if (trabalhador) return trabalhador;
      var w = trabalhador = new Worker('indice-livros.js');
      w.onmessage = function (e) { if (w === trabalhador) receber(e.data || {}); };
      w.onerror = function (e) {
        if (e && e.preventDefault) e.preventDefault();
        if (w !== trabalhador) return;
        perderTrabalhador('o Worker do índice caiu');
      };
      return w;
    }

    function soltarTrabalhador() {
      if (trabalhador) { try { trabalhador.terminate(); } catch (e) { /* já foi */ } }
      trabalhador = null;
    }

    /* O Worker morreu, travou ou estourou o prazo, sem dizer por quê.
     * Se ele nem chegou a começar o livro (não subiu), a sessão para, calada,
     * sem contar falha de livro nenhum: o defeito não é do livro. Se morreu
     * no meio, a falha é PASSAGEIRA do livro de agora (a conta no registro
     * dele), e a fila segue com um Worker novo. */
    function perderTrabalhador(motivo) {
      soltarTrabalhador();
      if (!atual) return;
      var livro = atual.livro;
      if (!atual.iniciou) { pararTudo('trabalhador'); return; }
      situacao.falhasNaSessao[livro.id] = (situacao.falhasNaSessao[livro.id] || 0) + 1;
      var feito = atual;
      feito.parando = true;
      registrarFalha(livro.id, livro.hash, { name: 'Prazo', message: motivo }, !!feito.aberto).catch(function () { return null; })
        .then(function (conta) {
          if (atual !== feito) return;
          if (conta && conta.pronto) situacao.prontos = Math.min(situacao.total, situacao.prontos + 1);
          terminarAtual('falhou');
        });
    }

    function pedirParada() {
      if (trabalhador && atual) { atual.parando = true; trabalhador.postMessage({ indice: true, tipo: 'parar' }); }
    }

    function receber(m) {
      if (!m.indice || !atual || m.id !== atual.livro.id) return;
      atual.noticia = Date.now();
      if (m.tipo === 'iniciou') { atual.iniciou = true; return; }
      if (m.tipo === 'aberto') { atual.aberto = true; return; }
      if (m.tipo === 'pagina') {
        situacao.livro = m.id; situacao.pagina = m.pagina; situacao.de = m.total;
        situacao.lidasNaSessao[m.id] = (situacao.lidasNaSessao[m.id] || 0) + 1;
        mudou();
        return;
      }
      if (m.tipo === 'pronto') { situacao.prontos = Math.min(situacao.total, situacao.prontos + 1); terminarAtual('pronto'); return; }
      if (m.tipo === 'parou') { terminarAtual('parou'); return; }
      if (m.tipo === 'falhou') {
        if (m.semLeitor) { pararTudo('sem-leitor'); return; }
        if (m.semEspaco) { tratarSemEspaco(); return; }
        if (m.bancoTrocado) { pararTudo('banco-trocado'); return; }
        if (m.descompasso) {
          // o registro mudou por baixo (livro trocado, outra janela): uma volta a mais, do zero, se o livro ainda for o mesmo
          var livro = atual.livro;
          terminarAtual('descompasso');
          if (!recomecados[livro.id]) { recomecados[livro.id] = true; fila.unshift(livro); proximo(); }
          return;
        }
        situacao.falhasNaSessao[m.id] = (situacao.falhasNaSessao[m.id] || 0) + 1;
        if (m.tirado) situacao.prontos = Math.min(situacao.total, situacao.prontos + 1);
        terminarAtual('falhou');
      }
    }

    function terminarAtual(como) {
      if (!atual) return;
      var feito = atual;
      atual = null;
      situacao.livro = null; situacao.pagina = null; situacao.de = null;
      // o livro parado no meio (segundo plano, leitor aberto) volta para a frente da fila
      if (como === 'parou' && !parado) fila.unshift(feito.livro);
      // parado, o Worker (e o PDF.js dentro dele) sai da memória
      if (pausado || parado || ocupado()) soltarTrabalhador();
      feito.resolver(como);
      mudou();
      proximo();
    }

    function pararTudo(motivo) {
      parado = true;
      situacao.motivo = motivo;
      fila = [];
      soltarTrabalhador();
      if (atual) terminarAtual(motivo);
      pararVigia();
      mudou();
    }

    /* Um livro por vez, e uma janela só por vez: com o aplicativo aberto em
     * duas abas, a outra espera (Web Locks, quando o navegador tem). */
    function comTrava(fazer) {
      if (typeof navigator !== 'undefined' && navigator.locks && typeof navigator.locks.request === 'function') {
        return navigator.locks.request('indice-livros-trabalho', fazer);
      }
      return fazer();
    }

    function temFolga() {
      if (typeof navigator === 'undefined' || !navigator.storage || typeof navigator.storage.estimate !== 'function') return Promise.resolve(true);
      return navigator.storage.estimate().then(function (e) {
        if (!e || !e.quota) return true;
        return e.quota - (e.usage || 0) >= CONFIG.folgaBytes;
      }, function () { return true; });
    }

    /* A VIGIA, uma vez por segundo enquanto há trabalho: o Worker calado
     * demais (morreu, travou), o livro que passou do prazo, o leitor ou a
     * importação que abriram (o índice para e devolve a memória) e que
     * fecharam (ele volta). */
    function ligarVigia() {
      if (vigia || parado) return;
      vigia = setInterval(function () {
        if (parado || (!atual && !fila.length)) { pararVigia(); return; }
        var agora = Date.now();
        if (atual && atual.enviado) {
          /* Em segundo plano (e no sono do aparelho, em que o relógio de parede
           * anda e o Worker não) o prazo não é julgado. */
          if (!pausado && (agora - atual.noticia > CONFIG.semNoticiaMs || agora - atual.inicio > CONFIG.livroMs)) {
            perderTrabalhador('o Worker do índice passou do prazo');
            return;
          }
          if ((ocupado() || pausado) && !atual.parando) pedirParada();
        }
        if (!atual) proximo();
      }, 1000);
    }
    function pararVigia() { if (vigia) { clearInterval(vigia); vigia = null; } }

    /* A leitura não disputa a abertura do aplicativo: começa uns segundos
     * depois de a página carregar. */
    var ESPERA_NA_ABERTURA_MS = 3000;
    var esperando = null;
    function proximo() {
      if (atual || parado || esperando) return;
      if (!fila.length) { soltarTrabalhador(); pararVigia(); return; }
      ligarVigia();
      if (pausado || ocupado()) return;   // a vigia chama de novo quando liberar
      var agora = typeof performance !== 'undefined' ? performance.now() : ESPERA_NA_ABERTURA_MS;
      if (agora < ESPERA_NA_ABERTURA_MS) {
        esperando = setTimeout(function () { esperando = null; proximo(); }, ESPERA_NA_ABERTURA_MS - agora);
        return;
      }
      var livro = fila.shift();
      var trabalho = new Promise(function (resolver) {
        atual = { livro: livro, resolver: resolver, inicio: Date.now(), noticia: Date.now(), iniciou: false, parando: false, enviado: false };
      });
      var este = atual;
      mudou();
      comTrava(function () {
        if (atual !== este) return Promise.resolve();
        return temFolga().then(function (folga) {
          if (atual !== este) return;
          if (!folga) { tratarSemEspaco(); return; }
          /* O Blob sai do banco principal só como referência e vai ao Worker
           * pelo postMessage, que também não copia o arquivo. */
          return root.Store.lerLivro(livro.id).then(function (reg) {
            if (atual !== este) return;
            if (!reg || !reg.blob || (reg.meta && reg.meta.hash) !== livro.hash) { terminarAtual('saiu'); return; }
            if (pausado || ocupado()) { terminarAtual('parou'); return; }
            este.inicio = Date.now(); este.noticia = Date.now(); este.enviado = true;
            obterTrabalhador().postMessage({ indice: true, tipo: 'indexar', livro: Object.assign({ blob: reg.blob }, livro),
              prazos: { paginaMs: CONFIG.paginaMs } });
            return trabalho;
          }, function () { if (atual === este) terminarAtual('falhou'); });
        });
      });
    }

    /* Segundo plano: o livro de agora para depois da página que está lendo
     * (a retomada guarda onde), e volta quando ela voltar ao aplicativo. */
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') { pausado = true; pedirParada(); }
        else if (pausado) {
          pausado = false;
          // a conta do prazo recomeça na volta: o tempo apagado não é do Worker
          if (atual) { atual.noticia = Date.now(); atual.inicio = Date.now(); }
          proximo();
        }
      });
    }

    /* O "Apagar tudo" (store.js). Primeiro `parar`, que não espera nada: a
     * leitura para, o Worker sai e a conexão desta janela fecha. Depois de o
     * banco principal ser apagado, `apagar` pede a remoção do banco do índice
     * e resolve em no máximo 3 s, removido ou não (a remoção pendente termina
     * sozinha quando a última conexão fechar). Não recomeça nesta sessão: os
     * livros ficam, e o índice se refaz na próxima abertura. */
    function parar() {
      pararTudo('apagado');
      situacao.total = 0; situacao.prontos = 0;
      if (conexao) { try { conexao.close(); } catch (e) { /* já fechou */ } conexao = null; }
      mudou();
    }
    function apagar() {
      parar();
      return apagarBanco(3000);
    }

    // ------------------------------------------------------- a consulta

    /* O PONTO ÚNICO que diz de onde vêm os capítulos do resultado. O sumário
     * cru do PDF pode ser lixo ("page45", "Blank Page", nome de arquivo); o
     * Biblioteca.sumarioDoLivro (PR #169) devolve o sumário que a tela do
     * livro mostra, o do mapa quando os marcadores não servem. Enquanto ele
     * não existe, vale o cru. Só lê: nada derivado do sumário é gravado. */
    function sumarioDosCapitulos(meta) {
      var B = root.Biblioteca;
      if (B && typeof B.sumarioDoLivro === 'function') {
        try {
          var efetivo = B.sumarioDoLivro(meta);
          if (Array.isArray(efetivo) && efetivo.length) return efetivo;
        } catch (e) { /* cai no sumário cru */ }
      }
      return Array.isArray(meta.sumario) && meta.sumario.length ? meta.sumario : (Array.isArray(meta.mapa) ? meta.mapa : []);
    }

    function capitulosDoLivro(meta, total) {
      var epub = meta.formato === 'epub';
      var chaveIni = epub ? 'capitulo' : 'pagina', chaveFim = epub ? 'capitulo_fim' : 'pagina_fim';
      var fonte = sumarioDosCapitulos(meta);
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

    /* As páginas de um livro com o termo, lidas em lotes de 50: a busca nunca
     * põe o livro inteiro (nem todos os livros) na memória de uma vez, e cada
     * lote é uma transação, o que devolve a vez à tela entre eles. */
    var LOTE_DA_BUSCA = 50;
    function paginasComTermo(id, alvo, cancelada) {
      // todas as palavras na mesma página; a frase exata vai à parte (achadas.frase)
      var achadas = [], palavras = palavrasDaBusca(alvo);
      achadas.frase = [];
      function lote(depoisDe) {
        if (cancelada && cancelada()) return Promise.resolve(achadas);
        return transacao(['paginas'], 'readonly', function (t, dar) {
          var faixa = depoisDe == null ? faixaDoLivro(id) : IDBKeyRange.bound([id, depoisDe], [id, Infinity], true, false);
          var q = t.objectStore('paginas').getAll(faixa, LOTE_DA_BUSCA);
          q.onsuccess = function () { dar(q.result || []); };
        }).then(function (ps) {
          ps.forEach(function (p) {
            if (!casaTodas(p.texto, palavras)) return;
            achadas.push(p.pagina);
            if (p.texto.indexOf(alvo) >= 0) achadas.frase.push(p.pagina);
          });
          if (ps.length < LOTE_DA_BUSCA) return achadas;
          return lote(ps[ps.length - 1].pagina);
        });
      }
      return lote(null);
    }

    function naoLidasDe(reg) {
      if (reg.erro) return reg.total || null;
      return (reg.semTexto || []).length + (reg.ilegiveis || []).length;
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
     *       'parte' no EPUB: a posição na espinha), total, naoLidas (quantas
     *       páginas daquele livro não puderam ser lidas; semTexto é o mesmo
     *       número), pronto, paginas: [todas as páginas do ARQUIVO com todas
     *       as palavras do termo (palavrasDaBusca)], paginasComFrase: [as que
     *       têm o termo inteiro, em sequência], capitulos: [{ n, titulo,
     *       inicio, fim, paginas: [...], paginasComFrase: [...] }] }]
     *       (as páginas fora de todo capítulo ficam num capítulo de n e
     *       titulo null, no fim);
     *     naoLidos: [{ id, titulo, volume, formato, total, naoLidas,
     *       livroInteiro (o livro todo ficou de fora: senha, arquivo que não
     *       abre, falhas seguidas), motivo ('sem-texto', 'arquivo' ou
     *       'leitura') }]: TODO livro do filtro com página que não pôde ser
     *       lida, com acerto ou sem;
     *     pendentes: [ids dos livros do filtro ainda não indexados] }
     * Os livros vêm na ordem do tablet (título). */
    function buscarNosLivros(termo, filtros, opcoes) {
      // opcoes.cancelada: função que diz que esta consulta já foi superada (a tela digitou de novo)
      var cancelada = opcoes && typeof opcoes.cancelada === 'function' ? opcoes.cancelada : null;
      var alvo = normalizar(termo);
      var saida = { termo: String(termo == null ? '' : termo), normalizado: alvo, livros: [], naoLidos: [], pendentes: [] };
      if (!suportado || !temTexto(alvo) || !root.Store) return Promise.resolve(saida);
      return root.Store.listarLivros().then(function (livros) {
        if (!livros || !livros.length) return [livros || [], []];
        return lerRegistros().catch(function () { return []; }).then(function (regs) { return [livros, regs]; });
      }).then(function (r) {
        var porId = {};
        r[1].forEach(function (x) { porId[x.id] = x; });
        var candidatos = (r[0] || []).filter(function (l) { return l && l.meta && doFiltro(l.meta, filtros); });
        var seq = Promise.resolve();
        candidatos.forEach(function (l) {
          var reg = porId[l.id], d = dadosDoLivro(l);
          var estadoDoLivro = decidir(reg, d);
          if (estadoDoLivro !== 'pronto') saida.pendentes.push(l.id);
          if (!reg || estadoDoLivro === 'refazer') return;
          var naoLidas = naoLidasDe(reg);
          if (reg.erro || naoLidas) {
            saida.naoLidos.push({ id: l.id, titulo: l.meta.titulo || l.id, volume: l.meta.volume || null, formato: d.formato,
              total: reg.total, naoLidas: naoLidas, livroInteiro: !!reg.erro,
              motivo: reg.erro ? (reg.erro.permanente ? 'arquivo' : 'leitura') : ((reg.ilegiveis || []).length ? 'leitura' : 'sem-texto') });
          }
          if (reg.erro) return;
          // o livro começado já responde pelas páginas lidas
          seq = seq.then(function () { return cancelada && cancelada() ? [] : paginasComTermo(l.id, alvo, cancelada); }).then(function (paginas) {
            if (!paginas.length) return;
            var caps = capitulosDoLivro(l.meta, reg.total);
            var grupos = caps.map(function (c) { return { n: c.n, titulo: c.titulo, inicio: c.inicio, fim: c.fim, paginas: [], paginasComFrase: [] }; });
            var fora = { n: null, titulo: null, inicio: null, fim: null, paginas: [], paginasComFrase: [] };
            var comFrase = paginas.frase || [];
            paginas.forEach(function (p) {
              var g = null;
              grupos.forEach(function (c) { if (p >= c.inicio && p <= c.fim && (!g || c.inicio >= g.inicio)) g = c; });
              (g || fora).paginas.push(p);
              if (comFrase.indexOf(p) >= 0) (g || fora).paginasComFrase.push(p);
            });
            saida.livros.push({
              id: l.id, titulo: l.meta.titulo || l.id, volume: l.meta.volume || null, formato: d.formato,
              unidade: d.formato === 'epub' ? 'parte' : 'pagina', total: reg.total,
              naoLidas: naoLidas, semTexto: naoLidas, pronto: estadoDoLivro === 'pronto', paginas: paginas.slice(),
              paginasComFrase: comFrase.slice(),
              capitulos: grupos.filter(function (c) { return c.paginas.length; }).concat(fora.paginas.length ? [fora] : [])
            });
          });
        });
        return seq.then(function () { if (cancelada && cancelada()) saida.cancelada = true; return saida; });
      });
    }

    root.IndiceLivros = {
      sincronizar: sincronizar, buscarNosLivros: buscarNosLivros, estado: estado, apagar: apagar, parar: parar,
      /* fn () -> true enquanto o leitor de PDF ou de EPUB está aberto, ou a
       * importação de livros corre: o índice para e devolve a memória. */
      quandoOcupado: function (fn) { ocupadoFn = typeof fn === 'function' ? fn : null; },
      aoMudar: function (fn) { ouvintes.push(fn); },
      normalizar: normalizar, palavrasDaBusca: palavrasDaBusca, NOME_BANCO: NOME, MOTOR: MOTOR
    };
    // a tela de busca (outra fatia) chama daqui
    root.buscarNosLivros = buscarNosLivros;
  }
})(typeof self !== 'undefined' ? self : this);
