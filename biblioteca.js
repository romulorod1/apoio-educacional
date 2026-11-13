/* biblioteca.js
 * Abre e confere um pacote da biblioteca antes de qualquer gravação.
 *
 * O acordo com o gerador está em CONTRATO_pacote_biblioteca.md (esquema 1).
 * A seção 8 diz o que o aplicativo confere ao importar, e é exatamente o que
 * `abrirPacote` faz, na mesma ordem:
 *   1. manifest.json existe e diz esquema 1;
 *   2. todo arquivo do zip está na lista do manifest, e vice-versa, e cada
 *      hash sha256 bate: UMA divergência recusa o pacote inteiro;
 *   3. todo asset citado em itens.json e teoria.json existe no zip.
 * Quem decide substituir ou não (versão maior, igual ou menor) é quem grava,
 * no store.js, porque depende do que já está no tablet.
 *
 * Nada aqui toca o IndexedDB, e roda no Node, para os testes.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root.Zip || require('./zip.js'));
  else root.Biblioteca = factory(root.Zip);
})(typeof self !== 'undefined' ? self : this, function (Zip) {
  'use strict';

  var ESQUEMA = 1;
  var OBRIGATORIOS = ['itens.json', 'teoria.json', 'busca.json', 'apelidos.json'];
  var SEM_NAVEGADOR = 'Este navegador não consegue abrir o pacote da biblioteca. Atualize o Chrome e tente de novo.';

  /* Toda recusa leva o detalhe técnico (a mensagem) e um TIPO, que diz à
   * tela o que ela pode fazer: 'download' (o arquivo chegou estragado: baixar
   * de novo resolve), 'defeito' (o pacote veio errado de quem gerou),
   * 'atualizar' (pacote de uma versão mais nova do aplicativo), 'navegador'
   * (Chrome sem o que precisa) e 'nao_pacote' (ela escolheu outro arquivo). */
  function Recusa(mensagem, tipo) {
    var e = new Error(mensagem);
    e.recusa = true;
    e.tipo = tipo || tipoDaMensagem(mensagem);
    return e;
  }

  function tipoDaMensagem(m) {
    if (m === SEM_NAVEGADOR) return 'navegador';
    if (/não é um pacote/.test(m)) return 'nao_pacote';
    if (/corrompido|não confere|incompleto|não pôde ser lido/.test(m)) return 'download';
    return 'defeito';
  }

  function hex(buffer) {
    var b = new Uint8Array(buffer), s = '';
    for (var i = 0; i < b.length; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16);
    return s;
  }

  function sha256(bytes) {
    var sutil = (typeof crypto !== 'undefined' && crypto.subtle) ? crypto.subtle : null;
    if (!sutil) return Promise.reject(Recusa(SEM_NAVEGADOR));
    return sutil.digest('SHA-256', bytes).then(hex);
  }

  function texto(bytes) {
    return new TextDecoder('utf-8').decode(bytes);
  }

  /* As listas prontas do pacote (kits.json, seções 8d e 8f do contrato).
   *
   * ADITIVO NOS DOIS SENTIDOS: pacote sem o arquivo continua válido e devolve
   * lista vazia, e pacote com ele é lido. O arquivo já passou pela conferência
   * de manifest e de hash como qualquer outro, então o que se confere aqui é só
   * a FORMA do que vai para a tela dela.
   *
   * Confere a FORMA, e recusa com frase clara, porque cada buraco aqui virava
   * mentira na tela dela: a regra tem de ser uma que este aplicativo conhece
   * (listas-v1, a de meia aula, listas-v2, a de uma aula, ou base-v1, a lista
   * de base do C2b, uma aula com o começo de cada lista da fonte); o minuto tem de
   * ser número, na lista e em cada posição (sem ele a tela escrevia "≈ NaN
   * min"); e nenhum id de lista nem exercício dentro de uma lista pode se
   * repetir (com exercício repetido a tela dizia "Você mudou esta lista" sem
   * ela ter mudado nada). Achado pela lente de correção do PR #57.
   *
   * O que julga a REGRA em si (a rampa, o tempo, a porta de entrada) continua
   * sendo o biblioteca/confere_kits.py, do lado do gerador. */
  var REGRAS_DE_LISTA = ['listas-v1', 'listas-v2', 'base-v1'];
  function lerKits(bytes, itens) {
    if (!bytes) return [];
    var kits = json('kits.json', bytes);
    if (!Array.isArray(kits)) throw Recusa('O kits.json do pacote não é uma lista.');
    var numero = function (x) { return typeof x === 'number' && isFinite(x) && x > 0; };
    var perigoso = function (k) { return k === '__proto__' || k === 'constructor' || k === 'prototype'; };
    var idsVistos = Object.create(null);
    var moduloPorItem = Object.create(null);
    if (Array.isArray(itens)) {
      itens.forEach(function (it) {
        if (it && it.id && it.serie && it.modulo && it.modulo.slug) {
          moduloPorItem[it.id] = it.serie + ':' + it.modulo.slug;
        }
      });
    }
    kits.forEach(function (k) {
      if (!k || typeof k.id !== 'string' || typeof k.modulo !== 'string' || !k.id.trim() || !k.modulo.trim()) {
        throw Recusa('O kits.json do pacote tem lista sem identificador ou sem módulo.');
      }
      if (perigoso(k.id) || perigoso(k.modulo)) {
        throw Recusa('O kits.json do pacote tem lista com identificador ou módulo inválido.');
      }
      if (idsVistos[k.id]) throw Recusa('O kits.json do pacote tem duas listas com o mesmo identificador: ' + k.id + '.');
      idsVistos[k.id] = true;
      if (REGRAS_DE_LISTA.indexOf(k.regra) < 0) {
        throw Recusa('A lista ' + k.id + ' do pacote segue uma regra que este aplicativo não conhece (' + k.regra + ').');
      }
      if (!numero(k.minutos)) throw Recusa('A lista ' + k.id + ' do pacote não diz quantos minutos leva.');
      // a tela da lista não mostra teoria: lista com teoria sairia pela metade
      if (Array.isArray(k.teoria) ? k.teoria.length : k.teoria) {
        throw Recusa('A lista ' + k.id + ' do pacote traz teoria, e este aplicativo só mostra lista de exercícios.');
      }
      if (!Array.isArray(k.degraus) || !k.degraus.length) {
        throw Recusa('A lista ' + k.id + ' do pacote não traz exercício nenhum.');
      }
      var itensVistos = Object.create(null);
      k.degraus.forEach(function (d, i) {
        if (!d || typeof d.item !== 'string' || !d.item.trim()) {
          throw Recusa('A lista ' + k.id + ' do pacote tem posição sem exercício.');
        }
        if (perigoso(d.item)) {
          throw Recusa('A lista ' + k.id + ' do pacote tem exercício com identificador inválido.');
        }
        if (itensVistos[d.item]) throw Recusa('A lista ' + k.id + ' do pacote repete o exercício ' + d.item + '.');
        itensVistos[d.item] = true;
        if (!numero(d.minutos)) {
          throw Recusa('A lista ' + k.id + ' do pacote não diz quantos minutos leva a posição ' + (i + 1) + '.');
        }
        if (moduloPorItem[d.item] && moduloPorItem[d.item] !== k.modulo) {
          throw Recusa('A lista ' + k.id + ' do pacote cita o exercício ' + d.item + ', que não pertence ao módulo ' + k.modulo + '.');
        }
        /* A ORDEM É A LISTA, e é ela que vai para o material dela. Um `n` fora
         * de ordem é o único jeito de o arquivo dizer uma ordem e o vetor
         * dizer outra, e aí não há como saber qual das duas ela quis. */
        if (d.n !== i + 1) {
          throw Recusa('A lista ' + k.id + ' do pacote está fora de ordem na posição ' + (i + 1) + '.');
        }
      });
    });
    return kits;
  }

  function json(nome, bytes) {
    try { return JSON.parse(texto(bytes)); }
    catch (e) { throw Recusa('O arquivo ' + nome + ' do pacote não pôde ser lido.', 'defeito'); }
  }

  /* Caminho seguro para virar chave de gravação: relativo, sem subir pasta. */
  function caminhoValido(nome) {
    return typeof nome === 'string' && nome.length > 0 && nome.charAt(0) !== '/' &&
      nome.indexOf('\\') < 0 && nome.split('/').indexOf('..') < 0;
  }

  function tipoDoAsset(caminho) {
    if (/\.svg$/i.test(caminho)) return 'image/svg+xml';
    if (/\.webp$/i.test(caminho)) return 'image/webp';
    return null;
  }

  /* ------------------------------------------------------------- livros */

  /* O pacote de livros (C15.1, CONTRATO seção 8j). O mesmo zip e o mesmo
   * manifest com hash de todo arquivo, mas sem itens, teoria, busca nem
   * apelidos: `conteudo: "livros"` no manifest, a lista dos livros nele, e
   * cada livro em livros/<id>.pdf ou livros/<id>.epub. Quem grava é o
   * store.js, num depósito só dos livros, fora da cópia de segurança. */
  var FORMATOS_DE_LIVRO = { pdf: 'application/pdf', epub: 'application/epub+zip' };
  var ID_DE_LIVRO = /^[a-z0-9][a-z0-9-]*$/;

  function inteiro(x) { return typeof x === 'number' && isFinite(x) && Math.floor(x) === x; }

  /* O teto por livro do gerador (biblioteca/livros.py, TETO_MB). O aplicativo
   * confere de novo: um livro maior que isto, num pacote feito à mão ou por
   * outro gerador, é recusado com a frase dele, antes de qualquer leitura. Era
   * 40 MB no C15.1; o dono decidiu depois que nada perde qualidade (o tablet
   * tem 200 GB livres), e a leitura livro a livro segura o pico de memória
   * perto de um livro. A prova do gerador confere os dois tetos juntos. */
  var TETO_POR_LIVRO = 160 * 1024 * 1024;

  /* A página impressa (B3): o livro traz opcionalmente `numeracao`, uma lista
   * ordenada de trechos [{ de, ate, inicio, estilo }], onde `de` e `ate` são
   * páginas do ARQUIVO (1..paginas), em ordem crescente e sem sobreposição,
   * `inicio` é inteiro >= 1 (a primeira página impressa daquele trecho) e
   * `estilo` é 'arabico' ou 'romano'. As páginas fora de qualquer trecho (capa,
   * folha de rosto, ficha catalográfica) não têm página impressa. */
  var ESTILOS_DE_NUMERACAO = { arabico: true, romano: true };
  var PARES_ROMANOS = [
    [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'],
    [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'],
    [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']
  ];
  var VALORES_ROMANOS = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };

  function paraRomano(n) {
    if (!inteiro(n) || n < 1 || n > 3999) return null;
    var resto = n, s = '';
    for (var i = 0; i < PARES_ROMANOS.length; i++) {
      var valor = PARES_ROMANOS[i][0], algarismo = PARES_ROMANOS[i][1];
      while (resto >= valor) { s += algarismo; resto -= valor; }
    }
    return s;
  }

  function deRomano(s) {
    if (typeof s !== 'string') return null;
    var limpo = s.trim().toLowerCase();
    if (!limpo || !/^[ivxlcdm]+$/.test(limpo)) return null;
    var total = 0, anterior = 0;
    for (var i = limpo.length - 1; i >= 0; i--) {
      var v = VALORES_ROMANOS[limpo.charAt(i)];
      if (!v) return null;
      if (v < anterior) total -= v;
      else { total += v; anterior = v; }
    }
    if (total < 1 || total > 3999 || paraRomano(total) !== limpo) return null;
    return total;
  }

  function conferirNumeracao(l) {
    if (!l || l.numeracao === undefined || l.numeracao === null) return null;
    var id = l.id || 'sem-id';
    if (!Array.isArray(l.numeracao)) {
      return 'A numeração do livro ' + id + ' não é uma lista.';
    }
    if (!inteiro(l.paginas) || l.paginas < 1) {
      return 'O livro ' + id + ' precisa ter um total de p\u00e1ginas v\u00e1lido para usar numera\u00e7\u00e3o impressa.';
    }
    var limite = l.paginas;
    var fimAnterior = 0;
    for (var i = 0; i < l.numeracao.length; i++) {
      var t = l.numeracao[i];
      if (!t || typeof t !== 'object') {
        return 'A numeração do livro ' + id + ' é inválida no trecho ' + (i + 1) + '.';
      }
      if (!ESTILOS_DE_NUMERACAO[t.estilo]) {
        return 'A numeração do livro ' + id + ' tem estilo desconhecido no trecho ' + (i + 1) + '.';
      }
      if (!inteiro(t.inicio) || t.inicio < 1 || (t.estilo === 'romano' && t.inicio + Math.max(0, (inteiro(t.ate) && inteiro(t.de) ? t.ate - t.de : 0)) > 3999)) {
        return 'A numeração do livro ' + id + ' tem início inválido no trecho ' + (i + 1) + '.';
      }
      if (!inteiro(t.de) || !inteiro(t.ate) || t.de < 1 || t.de > t.ate || (limite !== null && t.ate > limite)) {
        return 'A numeração do livro ' + id + ' aponta para fora dele no trecho ' + (i + 1) + '.';
      }
      if (t.de <= fimAnterior) {
        return 'A numeração do livro ' + id + ' sobrepõe ou inverte trechos no trecho ' + (i + 1) + '.';
      }
      fimAnterior = t.ate;
    }
    return null;
  }

  /* Converte a página do arquivo (1..paginas) para a página impressa do livro:
   * número inteiro nos trechos arábicos, string em minúsculas ('i', 'xiv') nos
   * trechos romanos, ou null quando o livro não traz `numeracao` ou a página
   * está fora dos trechos (capa, folha de rosto, páginas em branco). */
  function paginaImpressa(meta, paginaArq) {
    if (!meta || !Array.isArray(meta.numeracao) || !meta.numeracao.length) return null;
    if (!inteiro(paginaArq) || paginaArq < 1) return null;
    if (inteiro(meta.paginas) && paginaArq > meta.paginas) return null;
    if (conferirNumeracao(meta)) return null;
    for (var i = 0; i < meta.numeracao.length; i++) {
      var t = meta.numeracao[i];
      if (paginaArq >= t.de && paginaArq <= t.ate) {
        var n = t.inicio + (paginaArq - t.de);
        return t.estilo === 'romano' ? paraRomano(n) : n;
      }
    }
    return null;
  }

  /* Converte a página impressa para a página do arquivo (1..paginas):
   * aceita número (45), string arábica ('45') ou string romana ('iv', 'IV'), e
   * um `estilo` opcional ('arabico' ou 'romano'). Quando a mesma página
   * impressa existe em mais de um trecho do mesmo estilo, devolve o primeiro
   * trecho que a contém. Fora de qualquer trecho ou sem `numeracao`, devolve null. */
  function paginaDoArquivo(meta, impressa, estilo) {
    if (!meta || !Array.isArray(meta.numeracao) || !meta.numeracao.length) return null;
    if (conferirNumeracao(meta)) return null;
    if (estilo !== undefined && estilo !== null && !ESTILOS_DE_NUMERACAO[estilo]) return null;
    var n = null, estiloAlvo = estilo || null;
    if (typeof impressa === 'number') {
      if (!inteiro(impressa) || impressa < 1) return null;
      n = impressa;
      if (!estiloAlvo) estiloAlvo = 'arabico';
    } else if (typeof impressa === 'string') {
      var s = impressa.trim();
      if (!s) return null;
      if (/^\d+$/.test(s)) {
        n = parseInt(s, 10);
        if (!inteiro(n) || n < 1) return null;
        if (!estiloAlvo) estiloAlvo = 'arabico';
      } else {
        if (estiloAlvo && estiloAlvo !== 'romano') return null;
        n = deRomano(s);
        if (!n) return null;
        estiloAlvo = 'romano';
      }
    } else {
      return null;
    }
    for (var i = 0; i < meta.numeracao.length; i++) {
      var t = meta.numeracao[i];
      if (t.estilo !== estiloAlvo) continue;
      if (n < t.inicio) continue;
      var arq = t.de + (n - t.inicio);
      if (arq >= t.de && arq <= t.ate) {
        if (inteiro(meta.paginas) && arq > meta.paginas) return null;
        return arq;
      }
    }
    return null;
  }

  /* A página onde o leitor abre a partir da posição guardada em livros_posicoes:
   * pos.pagina já é página do ARQUIVO e nunca passa por paginaDoArquivo. */
  function paginaDaPosicao(meta, pos) {
    var p = pos && inteiro(pos.pagina) && pos.pagina >= 1 ? pos.pagina : null;
    return p;
  }

  /* No "Ir para a página" do leitor: aceita a página impressa quando o livro
   * tem `numeracao` válida, e cai na página do arquivo quando não tem. */
  function resolverPaginaDoLeitor(meta, texto, total) {
    var lim = inteiro(total) && total >= 1 ? total : (meta && inteiro(meta.paginas) ? meta.paginas : 0);
    if (meta && Array.isArray(meta.numeracao) && meta.numeracao.length && !conferirNumeracao(meta)) {
      var arq = paginaDoArquivo(meta, texto);
      if (arq !== null && (!lim || arq <= lim)) return arq;
      return null;
    }
    var s = typeof texto === 'number' ? String(texto) : String(texto || '').trim();
    if (!/^\d+$/.test(s)) return null;
    var n = parseInt(s, 10);
    if (!inteiro(n) || n < 1 || (lim && n > lim)) return null;
    return n;
  }

  /* Confere a FORMA do que vai para a tela e para o leitor: id, formato, o
   * arquivo que existe no zip com o mesmo hash da lista, e o sumário dentro
   * do livro (página de 1 ao total no PDF, capítulo da espinha no EPUB). Um
   * sumário que aponta para fora do livro levaria o toque a lugar nenhum.
   * Não lê livro nenhum: `noZip` é o nome de cada arquivo do zip. */
  function lerLivros(manifest, noZip, lista) {
    var livros = manifest.livros;
    if (!Array.isArray(livros) || !livros.length) throw Recusa('O pacote de livros não traz livro nenhum.', 'defeito');
    var vistos = Object.create(null), citados = Object.create(null), recusados = [];
    var saida = livros.map(function (l) {
      if (!l || typeof l.id !== 'string' || !ID_DE_LIVRO.test(l.id)) {
        throw Recusa('O pacote de livros tem livro sem identificador válido.', 'defeito');
      }
      if (vistos[l.id]) throw Recusa('O pacote de livros repete o livro ' + l.id + '.', 'defeito');
      vistos[l.id] = true;
      if (!FORMATOS_DE_LIVRO[l.formato]) throw Recusa('O livro ' + l.id + ' tem um formato que o aplicativo não lê.', 'defeito');
      if (l.arquivo !== 'livros/' + l.id + '.' + l.formato || !noZip[l.arquivo]) {
        throw Recusa('O livro ' + l.id + ' cita um arquivo que não está no pacote.', 'defeito');
      }
      if (lista[l.arquivo] !== l.hash) throw Recusa('O livro ' + l.id + ' não confere com o manifest.', 'defeito');
      citados[l.arquivo] = true;
      if (typeof l.titulo !== 'string' || !l.titulo.trim()) throw Recusa('O livro ' + l.id + ' não tem título.', 'defeito');
      if (!Array.isArray(l.sumario)) throw Recusa('O livro ' + l.id + ' não traz o sumário.', 'defeito');
      var espinha = l.formato === 'epub' ? ((l.epub && l.epub.espinha) || []) : null;
      if (espinha && (!Array.isArray(espinha) || !espinha.length || espinha.some(function (c) { return !caminhoValido(c); }))) {
        throw Recusa('O EPUB ' + l.id + ' não diz onde estão os capítulos.', 'defeito');
      }
      l.sumario.forEach(function (e, i) {
        var ok = e && typeof e.titulo === 'string' && e.titulo.trim();
        if (ok && l.formato === 'pdf') ok = inteiro(e.pagina) && e.pagina >= 1 && (!inteiro(l.paginas) || e.pagina <= l.paginas);
        if (ok && espinha) ok = inteiro(e.capitulo) && e.capitulo >= 1 && e.capitulo <= espinha.length;
        if (!ok) throw Recusa('O sumário do livro ' + l.id + ' aponta para fora dele na entrada ' + (i + 1) + '.', 'defeito');
      });
      var erroNum = conferirNumeracao(l);
      if (erroNum) {
        recusados.push({ id: l.id, motivo: erroNum });
        return null;
      }
      return { meta: l };
    });
    Object.keys(noZip).forEach(function (n) {
      if (!citados[n]) throw Recusa('O pacote de livros tem um arquivo que nenhum livro cita: ' + n + '.', 'defeito');
    });
    saida = saida.filter(Boolean);
    if (!saida.length && recusados.length) throw Recusa(recusados[0].motivo, 'defeito');
    if (recusados.length) saida.recusados = recusados;
    return saida;
  }

  /* O META DE UM LIVRO DO CATÁLOGO DA NUVEM (fase 1c), conferido antes de
   * entrar no aparelho: o documento catalogo/{id} traz o meta como texto
   * (metaJson) e o hash dele (metaHash). Vale só se o meta é o do livro do
   * documento (id, "sha256:" + sha256 e o tamanho) e passa na MESMA
   * conferência de forma do pacote zip (lerLivros: arquivo, título, sumário
   * dentro do livro, numeração). `hashDoTexto` é o sha256 do metaJson, que a
   * página calcula (WebCrypto). Devolve o meta, ou null com o motivo em
   * `porque`. */
  function conferirMetaDaNuvem(doc, hashDoTexto) {
    var porque = function (m) { return { meta: null, porque: m }; };
    if (!doc || typeof doc.metaJson !== 'string' || typeof doc.id !== 'string') return porque('documento sem meta');
    if (hashDoTexto !== doc.metaHash) return porque('o meta não confere com o metaHash');
    var meta;
    try { meta = JSON.parse(doc.metaJson); } catch (e) { return porque('o meta não é JSON'); }
    if (!meta || meta.id !== doc.id) return porque('o meta é de outro livro');
    if (!/^[0-9a-f]{64}$/.test(String(doc.sha256 || '')) || meta.hash !== 'sha256:' + doc.sha256) return porque('o meta é de outro arquivo');
    if (!inteiro(meta.bytes) || meta.bytes !== doc.tamanho) return porque('o tamanho não confere');
    var noZip = {}, lista = {};
    noZip[meta.arquivo] = true;
    lista[meta.arquivo] = meta.hash;
    try {
      var lidos = lerLivros({ livros: [meta] }, noZip, lista);
      if (!lidos.length) return porque((lidos.recusados && lidos.recusados[0] && lidos.recusados[0].motivo) || 'a forma do meta não confere');
    } catch (e) {
      return porque(e && e.message || 'a forma do meta não confere');
    }
    return { meta: meta, porque: null };
  }

  /* As linhas que a tela mostra depois de importar livros. */
  function resumoDeLivros(contas) {
    var linhas = [];
    var partes = [];
    if (contas.novos) partes.push(contas.novos + (contas.novos === 1 ? ' livro novo' : ' livros novos'));
    if (contas.atualizados) partes.push(contas.atualizados + (contas.atualizados === 1 ? ' atualizado' : ' atualizados'));
    if (contas.iguais) partes.push(contas.iguais + (contas.iguais === 1 ? ' já estava no tablet' : ' já estavam no tablet'));
    if (contas.maisNovos) {
      partes.push(contas.maisNovos + (contas.maisNovos === 1 ? ' ficou como estava, porque o do tablet é mais novo'
        : ' ficaram como estavam, porque os do tablet são mais novos'));
    }
    if (contas.removidos) partes.push(contas.removidos + (contas.removidos === 1 ? ' saiu do pacote e do tablet' : ' saíram do pacote e do tablet'));
    linhas.push(partes.join(', ') || 'Nenhum livro mudou.');
    if (contas.deOutroPacote && contas.deOutroPacote.length) {
      linhas.push(contas.deOutroPacote.length + (contas.deOutroPacote.length === 1 ? ' livro ficou' : ' livros ficaram') +
        ' como estava, porque já veio de outro pacote.');
    }
    /* Desde a fase 1a da nuvem a posição de leitura não sai mais quando o
     * sumário muda. Ela só ANDA quando a página dela deixou de existir no
     * arquivo novo (vai para a última) ou o EPUB virou PDF sem a página
     * conhecida (vai para a primeira), e o leitor avisa onde ela estava. */
    if (contas.posicoesAjustadas) {
      linhas.push(contas.posicoesAjustadas === 1 ?
        '1 livro atualizado não abre mais onde você parou; ao abrir, ele diz onde você estava.' :
        contas.posicoesAjustadas + ' livros atualizados não abrem mais onde você parou; ao abrir, cada um diz onde você estava.');
    }
    return linhas;
  }

  /* ------------------------------------- o mapa dos livros (C15.2 e C15.3) */

  /* O mapa capitulo para assunto de um livro, como vale para ela: o do pacote
   * (meta.mapa, do gerador: o da orquestradora, o de obra inteira ou o passe
   * automático) com a CORREÇÃO DELA por cima. O mapa do pacote nunca muda; a
   * correção mora no aplicativo (app.js, db.ajustes.mapaDosLivros) e vai na
   * cópia de segurança.
   *
   * `correcoes` é { <chave>: { titulo, assuntos: [ids], acao, quando, n?, chave? } }
   * de UM livro. A <chave> do objeto é o número do capítulo (String(n)), como
   * sempre foi, para o aparelho com a versão antiga ler como hoje; só quando
   * esse número já guarda outra correção dela a nova vai para "<n>~<algo>"
   * (chaveParaGravarCorrecao), que a versão antiga não procura e não estraga.
   *
   * Desde a fase 1a da biblioteca na nuvem (12/11/2026), a correção não se
   * perde quando o mapa muda (resolverCorrecoes): ela casa com UMA entrada do
   * mapa, nesta ordem, e a que não casa com nada fica ÓRFÃ, à vista dela na
   * tela do livro (correcoesOrfas), e nunca é apagada nem aplicada no
   * capítulo vizinho. Nada disto grava no db: a resolução é feita a cada
   * leitura.
   *
   * Devolve uma lista de { n, chave, titulo, pagina, pagina_fim, capitulo,
   * capitulo_fim, ancora, assuntos: [ids], origem, estado, correcaoChave },
   * com estado
   *   'a_confirmar' do passe automático, sem palavra dela ainda;
   *   'do_mapa'     do mapa da orquestradora, sem palavra dela;
   *   'confirmado'  ela confirmou o que o mapa dizia;
   *   'corrigido'   ela escolheu outro assunto (ou nenhum).
   * `correcaoChave` é a chave da correção que vale ali (null sem correção):
   * é nela que a próxima palavra dela sobre esse capítulo é gravada. */
  function mapaDoLivro(meta, correcoes) {
    var r = resolverCorrecoes(meta, correcoes);
    return r.entradas.map(function (e) {
      var ids = (Array.isArray(e.assuntos) ? e.assuntos : []).map(function (a) { return a && a.id; })
        .filter(function (id) { return typeof id === 'string' && id; });
      var casada = r.porN[e.n] || null;
      var c = casada ? casada.correcao : null;
      return {
        n: e.n, chave: typeof e.chave === 'string' && e.chave ? e.chave : null,
        titulo: e.titulo, pagina: e.pagina, pagina_fim: e.pagina_fim, capitulo: e.capitulo,
        capitulo_fim: e.capitulo_fim, ancora: e.ancora || null, obraInteira: !!e.obra_inteira,
        // o gabarito do capítulo (C15.5), do gerador; a correção dela não mexe nele
        gabarito: gabaritoDaEntrada(meta, e),
        assuntos: c ? c.assuntos.filter(function (id) { return typeof id === 'string' && id; }) : ids,
        origem: e.origem === 'auto' ? 'auto' : 'mapa',
        estado: c ? (c.acao === 'corrigiu' ? 'corrigido' : 'confirmado') : (e.origem === 'auto' ? 'a_confirmar' : 'do_mapa'),
        correcaoChave: casada ? casada.chave : null
      };
    });
  }

  /* O título comparado sem acento, sem caixa e sem espaço sobrando: a
   * correção de acento ("Fracoes" para "Frações") não separa a correção dela
   * do capítulo. */
  function tituloNormalizado(t) {
    return String(t == null ? '' : t).normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/\s+/g, ' ').trim();
  }

  // o número do capítulo que a correção diz: o `n` gravado nela, ou a chave do objeto quando é só o número
  function numeroDaCorrecao(k, c) {
    if (inteiro(c.n)) return c.n;
    return /^\d+$/.test(k) ? parseInt(k, 10) : null;
  }

  /* A tabela de herança de títulos do livro (meta.heranca_titulos, que o
   * gerador copia de revisao-mapas/L1/HERANCA_L1.json): os títulos que eram
   * lixo de origem no mapa antigo (nome de arquivo, "pageN") e o título
   * impresso que os substituiu, com a página do arquivo onde a entrada antiga
   * começava. A faixa antiga de cada título vai do começo dele até a página
   * antes do começo seguinte da tabela (o último, até o fim do livro). */
  function herancaDoLivro(meta) {
    var lista = (meta && Array.isArray(meta.heranca_titulos) ? meta.heranca_titulos : []).filter(function (h) {
      return h && typeof h.titulo_antigo === 'string' && h.titulo_antigo && typeof h.titulo_novo === 'string' &&
        inteiro(h.pag_arquivo_inicio_antiga) && h.pag_arquivo_inicio_antiga >= 1;
    });
    var inicios = lista.map(function (h) { return h.pag_arquivo_inicio_antiga; }).sort(function (a, b) { return a - b; });
    var total = meta && inteiro(meta.paginas) ? meta.paginas : Infinity;
    return lista.map(function (h) {
      var ini = h.pag_arquivo_inicio_antiga;
      var seguinte = inicios.filter(function (p) { return p > ini; })[0];
      return { antigo: tituloNormalizado(h.titulo_antigo), novo: tituloNormalizado(h.titulo_novo), ini: ini, fim: seguinte ? seguinte - 1 : total };
    });
  }

  /* Casa cada correção dela com uma entrada do mapa de agora. A regra que
   * manda em tudo: NA DÚVIDA, A CORREÇÃO FICA ÓRFÃ À VISTA, nunca aplicada
   * calada noutro capítulo. Só três passos APLICAM, nesta ordem (o primeiro
   * que dá UMA entrada só):
   *   1. a mesma `chave` de capítulo (a chave estável que o gerador dá a cada
   *      entrada e reaproveita a cada geração), e com o mesmo título
   *      normalizado, ou com o par título antigo e título novo na tabela de
   *      herança, e aí também com um assunto em comum entre a correção e o
   *      capítulo novo. Chave igual com título diferente fora disso não
   *      aplica: vira sugestão (o gerador que reaproveitar uma chave não move
   *      a correção calado) e segue para os passos seguintes;
   *   2. o mesmo número E o mesmo título (a regra de antes, para as correções
   *      gravadas sem chave);
   *   3. a herança de títulos (herancaDoLivro): o título dela era um título
   *      antigo da tabela, e cai no capítulo novo que começa DENTRO da faixa
   *      antiga e tem o MESMO assunto que ela escolheu, quando há um só. Com
   *      dois, com nenhum, ou sem assunto escolhido ("nenhum"), não aplica. A
   *      herança não cai pelo começo da faixa nem pelo título novo da
   *      tabela: na unidade 8 do Geração Alpha 7 e 9 a tabela diz "Medições"
   *      e "Algumas grandezas" (o primeiro capítulo), e o volume está no
   *      seguinte.
   * O mesmo título normalizado em UMA entrada só NÃO aplica: é só sugestão
   * (um mapa antigo com dois "Exercícios" e um novo com um só levaria a
   * correção do segundo para o primeiro, calada). A sugestão aparece na linha
   * das órfãs ("Ligar a “Exercícios” (p. X)"), e ela decide com um toque.
   *
   * Duas correções no MESMO capítulo de destino: vence a de `quando` mais
   * recente, qualquer que seja o passo (no empate, o passo mais forte); a
   * outra fica órfã, com o capítulo como sugestão. A exceção é a que diz o
   * mesmo que a vencedora (mesmos assuntos e mesma ação): não tem o que
   * mostrar e é contada em `absorvidas`, sem sair do db.
   *
   * Devolve { entradas, porN: { <n>: { chave, correcao, como } },
   * orfas: [{ chave, titulo, assuntos, acao, quando, n, sugestao }], absorvidas }.
   * `sugestao` é { n, titulo, pagina, capitulo, ocupado } ou null; `ocupado`
   * diz que o capítulo já tem outra correção dela.
   * Limite conhecido: o mapa com dois capítulos de mesmo `n` (mapa
   * defeituoso) junta os dois numa casa só. */
  function resolverCorrecoes(meta, correcoes) {
    var entradas = (meta && Array.isArray(meta.mapa) ? meta.mapa : []).filter(function (e) {
      return !!e && inteiro(e.n) && typeof e.titulo === 'string';
    });
    var todas = correcoes && typeof correcoes === 'object' ? correcoes : {};
    var validas = Object.keys(todas).filter(function (k) {
      var c = todas[k];
      return !!c && typeof c === 'object' && typeof c.titulo === 'string' && Array.isArray(c.assuntos);
    });
    var idsDe = function (e) {
      return (Array.isArray(e.assuntos) ? e.assuntos : []).map(function (a) { return a && a.id; })
        .filter(function (id) { return typeof id === 'string' && id; });
    };
    var unica = function (lista) { return lista.length === 1 ? lista[0] : null; };
    var heranca = herancaDoLivro(meta);
    var herdaPara = function (c, e) {
      var t = tituloNormalizado(c.titulo), te = tituloNormalizado(e.titulo);
      return heranca.some(function (h) { return h.antigo === t && h.novo === te; });
    };
    var propostas = {}, sugestoes = {};
    validas.forEach(function (k) {
      var c = todas[k], tc = tituloNormalizado(c.titulo);
      // 1. a chave, conferida pelo título
      if (typeof c.chave === 'string' && c.chave) {
        var porChave = unica(entradas.filter(function (e) { return e.chave === c.chave; }));
        if (porChave) {
          var mesmoTitulo = tituloNormalizado(porChave.titulo) === tc;
          /* a chave que vale SÓ pela herança pede também um assunto em comum com
           * o capítulo novo: "page12" herdado para "Medições", com o volume no
           * capítulo seguinte, não leva a correção de volume para "Medições" */
          var herdaComAssunto = !mesmoTitulo && herdaPara(c, porChave) &&
            c.assuntos.some(function (id) { return idsDe(porChave).indexOf(id) >= 0; });
          if (mesmoTitulo || herdaComAssunto) { propostas[k] = { e: porChave, como: 'chave' }; return; }
          sugestoes[k] = porChave;
        }
      }
      // 2. o mesmo número e o mesmo título
      var porNumero = unica(entradas.filter(function (e) {
        var mesmoNumeroETitulo = numeroDaCorrecao(k, c) === e.n && c.titulo === e.titulo;
        return mesmoNumeroETitulo;
      }));
      if (porNumero) { propostas[k] = { e: porNumero, como: 'numero' }; return; }
      // 3. a herança de títulos, pelo assunto que ela escolheu
      var hs = heranca.filter(function (h) { return h.antigo === tc; });
      if (hs.length === 1) {
        var h = hs[0];
        var naFaixa = entradas.filter(function (e) { return inteiro(e.pagina) && e.pagina >= h.ini && e.pagina <= h.fim; });
        var escolhidos = c.assuntos.filter(function (id) { return typeof id === 'string' && id; });
        var herdados = (function () {
          // sem assunto escolhido ("nenhum"), não há o que comparar
          if (!escolhidos.length) return [];
          return naFaixa.filter(function (e) {
            return idsDe(e).some(function (id) { return escolhidos.indexOf(id) >= 0; });
          });
        })();
        var porHeranca = unica(herdados);
        if (porHeranca) { propostas[k] = { e: porHeranca, como: 'heranca' }; return; }
      }
      // o mesmo título normalizado numa entrada só: SÓ sugestão, ela decide
      if (!sugestoes[k]) {
        var porTitulo = unica(entradas.filter(function (e) { return tituloNormalizado(e.titulo) === tc; }));
        if (porTitulo) sugestoes[k] = porTitulo;
      }
    });
    // o mesmo destino para duas: a mais recente vence (no empate, o passo mais forte)
    var FORCA = { chave: 0, numero: 1, heranca: 2 };
    var forca = function (k) { return FORCA[propostas[k].como]; };
    var maisNova = function (a, b) {
      var qa = String(todas[a].quando || ''), qb = String(todas[b].quando || '');
      return qa < qb ? 1 : qa > qb ? -1 : 0;
    };
    var ordem = Object.keys(propostas);
    ordem.sort(function (a, b) { return maisNova(a, b) || forca(a) - forca(b) || (a < b ? -1 : a > b ? 1 : 0); });
    var porN = {}, absorvidas = {}, perdeu = {};
    var mesmoQueODaEntrada = function (c, n) {
      var outra = porN[n].correcao;
      return (outra.acao === 'corrigiu') === (c.acao === 'corrigiu') &&
        outra.assuntos.slice().sort().join('|') === c.assuntos.slice().sort().join('|');
    };
    ordem.forEach(function (k) {
      var e = propostas[k].e;
      if (!porN[e.n]) { porN[e.n] = { chave: k, correcao: todas[k], como: propostas[k].como }; return; }
      if (mesmoQueODaEntrada(todas[k], e.n)) { absorvidas[k] = true; return; }
      perdeu[k] = true;
      sugestoes[k] = e;
    });
    var orfas = validas.filter(function (k) { return (!propostas[k] || perdeu[k]) && !absorvidas[k]; }).sort().map(function (k) {
      var c = todas[k], s = sugestoes[k] || null;
      return { chave: k, titulo: c.titulo, assuntos: c.assuntos.filter(function (id) { return typeof id === 'string' && id; }),
        acao: c.acao === 'corrigiu' ? 'corrigiu' : 'confirmou', quando: c.quando || null, n: numeroDaCorrecao(k, c),
        sugestao: s ? { n: s.n, titulo: s.titulo, pagina: inteiro(s.pagina) ? s.pagina : null,
          capitulo: inteiro(s.capitulo) ? s.capitulo : null, ocupado: !!porN[s.n] } : null };
    });
    return { entradas: entradas, porN: porN, orfas: orfas, absorvidas: Object.keys(absorvidas).sort() };
  }

  /* As correções dela que não acharam capítulo no mapa de agora: a tela do
   * livro mostra uma linha discreta com o número, e cada uma com "Ligar a um
   * capítulo" e "Descartar" (com Desfazer). Nunca saem sozinhas. */
  function correcoesOrfas(meta, correcoes) {
    return resolverCorrecoes(meta, correcoes).orfas;
  }

  /* Onde gravar a próxima palavra dela sobre uma entrada do mapaDoLivro: na
   * chave da correção que já vale ali (a palavra nova substitui a dela
   * mesma); senão no número do capítulo, se ele estiver livre; senão (o
   * número guarda OUTRA correção dela, que casou com outro capítulo ou é
   * órfã) numa chave nova "<n>~<chave ou titulo>", sem tocar na que está. */
  function chaveParaGravarCorrecao(correcoes, entrada) {
    var todas = correcoes && typeof correcoes === 'object' ? correcoes : {};
    var tem = function (k) { return Object.prototype.hasOwnProperty.call(todas, k); };
    if (entrada.correcaoChave) return entrada.correcaoChave;
    var k = String(entrada.n);
    if (!tem(k)) return k;
    var base = k + '~' + (entrada.chave || tituloNormalizado(entrada.titulo).replace(/[^a-z0-9]+/g, '-').slice(0, 24) || 'c');
    if (!tem(base)) return base;
    for (var i = 2; ; i++) if (!tem(base + '~' + i)) return base + '~' + i;
  }

  /* A entrada do mapa onde a leitura está: no PDF, a que tem a página entre o
   * começo e o fim; no EPUB, a que tem a parte (posição na espinha). Com duas
   * (capítulos que se cruzam), a que começa mais perto. */
  function entradaDoMapa(mapa, formato, valor) {
    var achada = null;
    (mapa || []).forEach(function (e) {
      var ini = formato === 'epub' ? e.capitulo : e.pagina;
      var fim = formato === 'epub' ? e.capitulo_fim : e.pagina_fim;
      if (!inteiro(ini) || !inteiro(fim) || valor < ini || valor > fim) return;
      var iniAchada = achada ? (formato === 'epub' ? achada.capitulo : achada.pagina) : -1;
      if (ini >= iniAchada) achada = e;
    });
    return achada;
  }

  /* ---------------------------- o sumário que a tela usa (marcadores lixo) */

  /* Vários PDFs comerciais trazem MARCADORES que não são capítulo nenhum: um
   * por página ("page1", "page2_2"), "Blank Page", "Sem nome", o nome do
   * arquivo de diagramação ("GA_MAT_7_LP_4ED_PNLD24_OB1_U8_278A307_FECHADO",
   * "PMR9_1capa"). O gerador (biblioteca/livros.py) usa os marcadores sempre
   * que existem, e o sumário do mapa só entra quando o PDF não tem nenhum.
   * Então a tela decide aqui, sem mexer no pacote, qual sumário mostrar.
   *
   * Título SEM SENTIDO (marcadorSemSentido):
   *   - "page12", "pag 3", "página 7", "p12", com ou sem "_2" no fim;
   *   - "Blank Page", "Página em branco", "Sem nome", "Sem título",
   *     "Untitled", "Sumário", "Índice", "Contents";
   *   - nome de arquivo: sem espaço nenhum E com sublinhado, ou terminando em
   *     .pdf, .indd ou .idml; ou com "_FECHADO";
   *   - vazio, ou só pontuação.
   * Número puro ("1", "2") NÃO é lixo: há livro cujo mapa repete os mesmos
   * números dos marcadores, e trocar um pelo outro não ganha nada.
   *
   * O sumário dos marcadores é INÚTIL (sumarioDosMarcadoresInutil) quando
   * vale tudo isto:
   *   1. o livro é PDF e o sumário veio dos marcadores (sumario_origem);
   *   2. o mapa tem PELO MENOS 2 capítulos com título com sentido e página
   *      inicial dentro do livro (capitulosDoMapaParaSumario);
   *   3. esses capítulos COBREM pelo menos 25% das páginas do livro
   *      (coberturaDoMapa: a união das faixas pagina a pagina_fim sobre
   *      meta.paginas; sem meta.paginas não há como medir, e os marcadores
   *      ficam);
   *   4. e, dos marcadores, MAIS DA METADE é sem sentido, OU os que fazem
   *      sentido são MENOS DA METADE dos capítulos do mapa (os 2 ou 4
   *      marcadores soltos de um livro de 22 capítulos).
   * Os itens 2 e 3 existem porque os marcadores, mesmo lixo, ainda levam a
   * algum lugar (no Praticando 9, ao manual do professor na p. 274), e um
   * mapa que só conhece um trecho do livro tiraria esses atalhos sem pôr
   * nada no lugar: o mapa do Praticando 9 tem UMA entrada boa, de 20 das
   * 394 páginas (5%). Por que 25%: nos pacotes reais (11/2026), os livros
   * em que a troca é a certa têm mapa de 9 a 36 capítulos cobrindo de 51%
   * (Teláris 6) a 96% (Tópicos de Física) das páginas; 25% fica a meio
   * caminho entre os 5% do mapa parcial e os 51% do pior mapa bom, longe dos
   * dois.
   *
   * O sumário que a tela usa (sumarioDoLivro) vem do MAPA quando o livro é
   * PDF e
   *   - o sumário do pacote está VAZIO e o mapa tem ao menos UM capítulo que
   *     sirva, de qualquer tamanho (o PDF sem marcadores de um pacote cujo
   *     mapa chegou depois, como o volume de uma entrada só do Araribá 8, 7
   *     de 442 páginas): sem sumário não há atalho a perder; ou
   *   - o sumário dos marcadores é inútil (os itens 1 a 4).
   * Fora disso fica o do pacote: EPUB, livro sem mapa (com ou sem
   * sumário), marcadores bons, mapa pequeno ou parcial diante de marcadores,
   * e sumário que já veio do mapa.
   *
   * O sumário do mapa tem a mesma forma do gerador (sumario_do_mapa):
   * { n, nivel: 1, titulo, pagina, pagina_fim, mapa_n }, em ordem de página.
   * `mapa_n` é o número do capítulo no mapa, para a tela achar os assuntos
   * dele sem depender só do título. */
  var MARCADOR_DE_PAGINA = /^(page|pag|p[aá]gina|p)\s*[._-]?\s*\d+([._-]\d+)*$/i;
  var MARCADOR_VAZIO = /^(blank\s*page|p[aá]gina\s+em\s+branco|sem\s+nome|sem\s+t[ií]tulo|untitled|sum[aá]rio|[ií]ndice|contents)$/i;
  function marcadorSemSentido(titulo) {
    var t = String(titulo == null ? '' : titulo).trim();
    if (!t || !/[0-9A-Za-zÀ-ÿ]/.test(t)) return true;
    if (MARCADOR_DE_PAGINA.test(t) || MARCADOR_VAZIO.test(t)) return true;
    if (/_FECHADO/i.test(t) || /\.(pdf|indd|idml)$/i.test(t)) return true;
    return !/\s/.test(t) && t.indexOf('_') >= 0;
  }
  /* os capítulos do mapa que servem de sumário: número, título COM SENTIDO e
   * página dentro do livro. As entradas de mapa feitas dos próprios
   * marcadores lixo (nomes de arquivo no Geração Alpha e no Praticando 9)
   * não servem e ficam de fora; o que sobra ainda passa pelos itens 2 e 3
   * acima antes de tomar o lugar de marcadores. */
  function capitulosDoMapaParaSumario(meta) {
    var total = meta && inteiro(meta.paginas) ? meta.paginas : Infinity;
    return (meta && Array.isArray(meta.mapa) ? meta.mapa : []).filter(function (e) {
      return !!e && inteiro(e.n) && typeof e.titulo === 'string' && !marcadorSemSentido(e.titulo) &&
        inteiro(e.pagina) && e.pagina >= 1 && e.pagina <= total;
    });
  }
  var MINIMO_DE_CAPITULOS_DO_MAPA = 2;
  var COBERTURA_MINIMA_DO_MAPA = 0.25;
  /* A fração das páginas do livro dentro de algum capítulo do mapa: a união
   * das faixas pagina a pagina_fim (sem pagina_fim, só a primeira página),
   * cortadas no fim do livro, sobre meta.paginas. Sem meta.paginas, 0. */
  function coberturaDoMapa(meta, caps) {
    var total = meta && inteiro(meta.paginas) && meta.paginas > 0 ? meta.paginas : 0;
    if (!total) return 0;
    var faixas = caps.map(function (e) {
      var fim = inteiro(e.pagina_fim) ? Math.max(e.pagina, e.pagina_fim) : e.pagina;
      return [e.pagina, Math.min(total, fim)];
    }).sort(function (a, b) { return a[0] - b[0]; });
    var cobertas = 0, ate = 0;
    faixas.forEach(function (f) {
      var ini = Math.max(f[0], ate + 1);
      if (f[1] >= ini) { cobertas += f[1] - ini + 1; ate = f[1]; }
    });
    return cobertas / total;
  }
  function sumarioDosMarcadoresInutil(meta) {
    if (!meta || meta.formato === 'epub' || meta.sumario_origem !== 'marcadores') return false;
    var marcadores = Array.isArray(meta.sumario) ? meta.sumario : [];
    var caps = capitulosDoMapaParaSumario(meta);
    if (!caps.length) return false;
    if (!marcadores.length) return true;
    // diante de marcadores, só um mapa de verdade: 2 capítulos ou mais, cobrindo 25% do livro
    if (caps.length < MINIMO_DE_CAPITULOS_DO_MAPA || coberturaDoMapa(meta, caps) < COBERTURA_MINIMA_DO_MAPA) return false;
    var lixo =marcadores.filter(function (e) { return !e || marcadorSemSentido(e.titulo); }).length;
    var uteis = marcadores.length - lixo;
    return lixo * 2 > marcadores.length || uteis * 2 < caps.length;
  }
  function sumarioDoLivro(meta) {
    var sumario = meta && Array.isArray(meta.sumario) ? meta.sumario : [];
    if (!meta || meta.formato === 'epub') return sumario;
    var doMapa = !sumario.length ? capitulosDoMapaParaSumario(meta).length > 0 : sumarioDosMarcadoresInutil(meta);
    if (!doMapa) return sumario;
    var total = inteiro(meta.paginas) ? meta.paginas : Infinity;
    return capitulosDoMapaParaSumario(meta).slice().sort(function (a, b) { return a.pagina - b.pagina || a.n - b.n; })
      .map(function (e, i) {
        var s = { n: i + 1, nivel: 1, titulo: e.titulo, pagina: e.pagina, mapa_n: e.n };
        if (inteiro(e.pagina_fim)) s.pagina_fim = Math.min(total, Math.max(e.pagina, e.pagina_fim));
        return s;
      });
  }

  /* O ano do livro serve ao "Abrir no livro" (C15.3): REGRA de quem entra. O
   * livro entra se for do ano pedido (meta.series, do gerador: o ano do mapa
   * ou o segmento da planilha). Sem ano pedido (aluno sem ano e assunto sem
   * ano), não há o que filtrar. Livro sem ano nenhum não é "do ano" de aluno
   * nenhum. */
  function livroDoAno(meta, ano) {
    if (!ano) return true;
    return Array.isArray(meta && meta.series) && meta.series.indexOf(ano) >= 0;
  }

  /* Os livros do ano com um capítulo mapeado para o assunto (o mapa do
   * pacote com as correções dela). `livros`: [{ id, meta }] (os registros do
   * depósito servem); `correcoesPorLivro`: { <id do livro>: correções }.
   * Devolve [{ id, meta, entrada }], um por capítulo, em ordem de título do
   * livro e de capítulo. */
  function livrosComAssunto(livros, correcoesPorLivro, assuntoId, ano) {
    var saida = [];
    if (!assuntoId) return saida;
    (livros || []).forEach(function (l) {
      if (!l || !l.meta || !livroDoAno(l.meta, ano)) return;
      mapaDoLivro(l.meta, (correcoesPorLivro || {})[l.id]).forEach(function (e) {
        if (e.assuntos.indexOf(assuntoId) >= 0) saida.push({ id: l.id, meta: l.meta, entrada: e });
      });
    });
    return saida.sort(function (a, b) {
      return String(a.meta.titulo || '').localeCompare(String(b.meta.titulo || ''), 'pt-BR') ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0) || a.entrada.n - b.entrada.n;
    });
  }

  /* ------------------------- a ligação de assunto entre matérias (item 12c) */

  /* O capítulo de química que trata de unidades do SI liga o assunto de
   * física (FISEM1-T01): o mapa aceita o id de qualquer matéria do índice, e a
   * tela diz de que matéria ele é ("Física: Unidades do SI e conversões").
   * Quem decide a matéria do assunto é o índice (nomes.porId, com a
   * `disciplina` de cada um), e não o prefixo do id: o id que o índice não tem
   * aparece como veio, sem matéria nenhuma.
   *
   * disciplinaDoMapa(meta): a disciplina do índice do livro (o mapa_disciplina
   *   do gerador; sem ele, a matéria da planilha, com filosofia e sociologia
   *   na chave de lá).
   * assuntoDeOutraMateria(meta, a): o assunto do índice é de outra matéria
   *   que a do livro.
   * nomeDoAssuntoNoLivro(meta, id, nomes, nomeDaMateria): o nome que a tela
   *   mostra, com a matéria na frente quando é de outra; nomeDaMateria(id, a)
   *   dá o rótulo da matéria (o do Core no app).
   * opcoesDoCorrigir(meta, entrada, nomes): a lista do Corrigir: os assuntos
   *   de outra matéria que o capítulo já tem (para ela ver e manter), e depois
   *   os da matéria e do ano do livro, na ordem do índice. */
  var DISCIPLINA_DA_MATERIA = { filosofia: 'filosofia-sociologia', sociologia: 'filosofia-sociologia' };
  function disciplinaDoMapa(meta) {
    var d = (meta && (meta.mapa_disciplina || meta.materia)) || '';
    return DISCIPLINA_DA_MATERIA[d] || d;
  }
  function assuntoDeOutraMateria(meta, a) {
    var d = disciplinaDoMapa(meta);
    return !!(a && a.disciplina && d && a.disciplina !== d);
  }
  function nomeDoAssuntoNoLivro(meta, id, nomes, nomeDaMateria) {
    var a = nomes && nomes.porId && nomes.porId[id];
    if (!a) return String(id);
    var titulo = a.titulo || String(id);
    if (!assuntoDeOutraMateria(meta, a)) return titulo;
    var materia = (typeof nomeDaMateria === 'function' && nomeDaMateria(a.disciplina, a)) || a.disciplinaNome || a.disciplina;
    return materia + ': ' + titulo;
  }
  function opcoesDoCorrigir(meta, entrada, nomes) {
    var series = Array.isArray(meta && meta.series) ? meta.series : [];
    var disciplina = meta && meta.mapa_disciplina;
    var porId = (nomes && nomes.porId) || {};
    var deFora = [];
    ((entrada && entrada.assuntos) || []).forEach(function (id) {
      var a = porId[id];
      if (a && assuntoDeOutraMateria(meta, a) && deFora.indexOf(a) < 0) deFora.push(a);
    });
    var daMateria = ((nomes && nomes.lista) || []).filter(function (a) {
      return a.disciplina === disciplina && (a.eixo !== 'ano' || !series.length || series.indexOf(a.serie) >= 0);
    });
    return deFora.concat(daMateria);
  }

  /* ------------------------- a busca pelos capítulos e assuntos (12/11/2026) */

  /* Pedido do dono: o livro escaneado (sem texto) não aparecia na busca da
   * Biblioteca, mesmo com capítulos mapeados e assuntos ligados. A busca passa
   * a procurar também, em TODO livro instalado:
   *   - nos títulos dos capítulos do sumário que a tela usa (sumarioDoLivro);
   *   - nos títulos das entradas do mapa, já com a correção dela por cima
   *     (mapaDoLivro);
   *   - nos títulos e nas chaves dos assuntos ligados a cada entrada do mapa.
   * A chave do assunto são as palavras-chave que o índice de matemática
   * guarda (chaves.r e chaves.d); o id ("MAT08-15") não entra, porque "mat"
   * casaria todo assunto de matemática. Título casa por trecho,
   * como o texto; chave casa pelo começo de uma palavra, porque são radicais
   * soltos ("cubo", "litro"), e por trecho "de" casaria quase todas.
   *
   * Só lê: nada é gravado. O índice é montado UMA vez por desenho da
   * Biblioteca (app.js), e a consulta é uma varredura em memória.
   *
   * indiceDeCapitulos(livros, correcoesPorLivro, nomes, normalizar)
   *   livros: [{ id, meta }]; correcoesPorLivro: { <id>: correções };
   *   nomes: { porId: { <id do assunto>: { titulo, chaves } } } (ou nada: o
   *   assunto fica só com o id); normalizar: a mesma da busca no texto
   *   (IndiceLivros.normalizar), com esta como reserva.
   * Devolve { livros: [{ id, formato, capitulos: [...] }], capitulos: total }. */
  function normalizarTermo(texto) {
    return String(texto == null ? '' : texto).normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/\s+/g, ' ').trim();
  }
  function indiceDeCapitulos(livros, correcoesPorLivro, nomes, normalizar) {
    var norm = typeof normalizar === 'function' ? normalizar : normalizarTermo;
    var porId = (nomes && nomes.porId) || {};
    var saida = { livros: [], capitulos: 0 };
    var assuntoDoIndice = Object.create(null);
    function assunto(id) {
      if (assuntoDoIndice[id]) return assuntoDoIndice[id];
      var a = porId[id];
      var titulo = a && a.titulo ? String(a.titulo) : id;
      var chaves = a && a.chaves ? [a.chaves.r, a.chaves.d].filter(function (x) { return typeof x === 'string'; }).join(' ') : '';
      assuntoDoIndice[id] = { id: id, titulo: titulo, alvoTitulo: norm(titulo), alvoChaves: ' ' + norm(chaves) + ' ' };
      return assuntoDoIndice[id];
    }
    (livros || []).forEach(function (l) {
      if (!l || !l.meta) return;
      var meta = l.meta, epub = meta.formato === 'epub';
      var chaveIni = epub ? 'capitulo' : 'pagina';
      var caps = [], doMapa = Object.create(null);
      mapaDoLivro(meta, (correcoesPorLivro || {})[l.id]).forEach(function (e) {
        var c = { n: e.n, mapaN: e.n, titulo: e.titulo, inicio: inteiro(e[chaveIni]) ? e[chaveIni] : null,
          ancora: e.ancora || null, obraInteira: !!e.obraInteira,
          // o título lixo (nome de arquivo, "page12") não entra na busca; os assuntos dele, sim
          alvo: marcadorSemSentido(e.titulo) ? '' : norm(e.titulo),
          assuntos: e.assuntos.map(assunto) };
        doMapa[e.n] = c;
        caps.push(c);
      });
      var sumario = sumarioDoLivro(meta);
      var nivel = Infinity;
      sumario.forEach(function (s) { if (s && typeof s.nivel === 'number' && s.nivel < nivel) nivel = s.nivel; });
      if (nivel === Infinity) nivel = 1;
      sumario.forEach(function (s) {
        if (!s || typeof s.titulo !== 'string' || (typeof s.nivel === 'number' ? s.nivel : nivel) !== nivel) return;
        var ini = inteiro(s[chaveIni]) ? s[chaveIni] : null, alvo = marcadorSemSentido(s.titulo) ? '' : norm(s.titulo);
        // o capítulo do sumário que é a mesma entrada do mapa vira uma só, com o título que a tela mostra
        var par = s.mapa_n !== undefined && doMapa[s.mapa_n] ? doMapa[s.mapa_n] : caps.filter(function (c) {
          return c.mapaN !== undefined && c.sumarioN === undefined && c.inicio === ini && c.alvo === alvo;
        })[0];
        if (par) {
          par.sumarioN = s.n;
          par.titulo = s.titulo;
          if (alvo) par.alvo = alvo;
          return;
        }
        caps.push({ n: s.n, sumarioN: s.n, titulo: s.titulo, inicio: ini, ancora: s.ancora || null, obraInteira: false, alvo: alvo, assuntos: [] });
      });
      caps.sort(function (a, b) {
        var ia = a.inicio === null ? Infinity : a.inicio, ib = b.inicio === null ? Infinity : b.inicio;
        return ia - ib || (a.n || 0) - (b.n || 0);
      });
      saida.livros.push({ id: l.id, formato: epub ? 'epub' : 'pdf', capitulos: caps });
      saida.capitulos += caps.length;
    });
    return saida;
  }

  /* procurarNosCapitulos(indice, termo, normalizar, palavras): os capítulos
   * achados, livro a livro, na ordem do índice:
   *   [{ id, capitulos: [{ capitulo, nivel, peloTitulo, assuntos: [{ id, titulo, pela }] }] }]
   * A regra é a da busca no texto (indice-livros.js, palavrasDaBusca): o
   * capítulo entra quando TODAS as palavras significativas estão no título
   * dele ou nos assuntos ligados (título ou chave), juntos. `nivel` é
   *   'frase'    o título do capítulo, ou o de um assunto, tem a frase inteira;
   *   'palavras' as palavras estão todas lá, mas não em sequência.
   * `peloTitulo` diz se o título do capítulo sozinho tem a frase ou todas as
   * palavras; `assuntos` são os que casaram ao menos uma palavra, e `pela`
   * diz se pelo 'titulo' ou pela 'chave'. `palavras` é a função das palavras
   * significativas (IndiceLivros.palavrasDaBusca); sem ela, todas as palavras
   * contam. Termo de menos de duas letras não procura. */
  function casaPalavraNoTitulo(texto, p) {
    if (!texto) return false;
    if (p.length > 1) return texto.indexOf(p) >= 0;
    return new RegExp('(^|[^a-z0-9])' + p + '([^a-z0-9]|$)').test(texto);
  }
  function procurarNosCapitulos(indice, termo, normalizar, palavras) {
    var norm = typeof normalizar === 'function' ? normalizar : normalizarTermo;
    var alvo = norm(termo);
    var saida = [];
    if (!indice || alvo.length < 2 || !/[a-z0-9]/.test(alvo)) return saida;
    var lista = typeof palavras === 'function' ? palavras(alvo) : alvo.split(/[^a-z0-9]+/).filter(Boolean);
    if (!lista.length) return saida;
    indice.livros.forEach(function (l) {
      var achados = [];
      l.capitulos.forEach(function (c) {
        var noTitulo = lista.filter(function (p) { return casaPalavraNoTitulo(c.alvo, p); });
        var faltam = lista.filter(function (p) { return noTitulo.indexOf(p) < 0; });
        var frase = !!c.alvo && c.alvo.indexOf(alvo) >= 0;
        var assuntos = [];
        c.assuntos.forEach(function (a) {
          var peloTitulo = lista.filter(function (p) { return casaPalavraNoTitulo(a.alvoTitulo, p); });
          var pelaChave = lista.filter(function (p) { return peloTitulo.indexOf(p) < 0 && a.alvoChaves.indexOf(' ' + p) >= 0; });
          if (a.alvoTitulo.indexOf(alvo) >= 0) frase = true;
          if (!peloTitulo.length && !pelaChave.length) return;
          faltam = faltam.filter(function (p) { return peloTitulo.indexOf(p) < 0 && pelaChave.indexOf(p) < 0; });
          assuntos.push({ id: a.id, titulo: a.titulo, pela: peloTitulo.length ? 'titulo' : 'chave' });
        });
        if (!frase && faltam.length) return;
        achados.push({ capitulo: c, nivel: frase ? 'frase' : 'palavras', assuntos: assuntos,
          peloTitulo: (!!c.alvo && c.alvo.indexOf(alvo) >= 0) || noTitulo.length === lista.length });
      });
      if (achados.length) saida.push({ id: l.id, capitulos: achados });
    });
    return saida;
  }

  /* ------------------------------ exportar o capítulo (C15.4) e o gabarito (C15.5) */

  // Teto de páginas num PDF exportado: cada página vira um JPEG de algumas
  // centenas de KB, e o tablet monta o PDF inteiro na memória.
  var TETO_DE_PAGINAS_EXPORTADAS = 120;

  /* O tamanho estimado do PDF exportado, para a janela dizer antes de gerar.
   * Página de livro didático a 150 pontos por polegada: entre 350 e 650 KB
   * (a foto colorida pesa mais); a conta usa 500 KB. O EPUB é texto remontado
   * e pesa bem menos por parte. Acima de 20 MB, a janela avisa. */
  var KB_POR_PAGINA_EXPORTADA = 500;
  var KB_POR_PARTE_EXPORTADA = 150;
  var AVISO_DE_TAMANHO_EXPORTADO = 20 * 1024 * 1024;
  function estimarPdfExportado(formato, unidades) {
    return unidades * (formato === 'epub' ? KB_POR_PARTE_EXPORTADA : KB_POR_PAGINA_EXPORTADA) * 1024;
  }

  // o limite do livro: as páginas no PDF, as partes da espinha no EPUB
  function limiteDoLivro(meta) {
    if (!meta) return 0;
    if (meta.formato === 'epub') return ((meta.epub && meta.epub.espinha) || []).length;
    return inteiro(meta.paginas) ? meta.paginas : 0;
  }

  // [[a, b], ...] só com faixas inteiras, em ordem, dentro do livro
  function faixasValidas(fs, limite) {
    return (Array.isArray(fs) ? fs : []).filter(function (f) {
      return Array.isArray(f) && f.length === 2 && inteiro(f[0]) && inteiro(f[1]) && f[0] >= 1 && f[0] <= f[1] && f[1] <= limite;
    }).map(function (f) { return [f[0], f[1]]; });
  }

  function unidadesDe(fs) {
    var saida = [];
    fs.forEach(function (f) { for (var u = f[0]; u <= f[1]; u++) if (saida.indexOf(u) < 0) saida.push(u); });
    return saida.sort(function (a, b) { return a - b; });
  }

  /* O gabarito de uma entrada do mapa, como o gerador o deixou: { faixas,
   * certeza, como, soImpares }, ou null. Faixa fora do livro não entra: o
   * gabarito errado é pior que nenhum. */
  function gabaritoDaEntrada(meta, e) {
    var g = e && e.gabarito;
    if (!g || typeof g !== 'object') return null;
    var fs = faixasValidas(meta && meta.formato === 'epub' ? g.partes : g.paginas, limiteDoLivro(meta));
    if (!fs.length) return null;
    return { faixas: fs, certeza: g.certeza || '', como: g.como || '', soImpares: !!g.so_impares };
  }

  // o livro tem gabarito localizado em algum capítulo?
  function livroTemGabarito(meta) {
    if (!meta || meta.gabarito_origem !== 'auto') return false;
    return (Array.isArray(meta.mapa) ? meta.mapa : []).some(function (e) { return !!gabaritoDaEntrada(meta, e); });
  }

  /* O que vai no PDF exportado de um capítulo do mapa, em páginas (PDF) ou
   * partes (EPUB) do livro:
   *   capitulo  as do capítulo, SEM as páginas de respostas do livro
   *             (gabarito_secoes): a resposta que mora no fim do capítulo não
   *             vai para o aluno sem ela pedir. Se o capítulo é só respostas
   *             (o "Respostas" do sumário), ele vai como está;
   *   gabarito  com o gabarito pedido e localizado, as páginas do gabarito
   *             DAQUELE capítulo, depois das do capítulo, no mesmo arquivo.
   * Devolve { capitulo: [n], gabarito: [n] }. */
  function partesDoCapitulo(meta, entrada, comGabarito) {
    var epub = meta && meta.formato === 'epub';
    var ini = epub ? entrada.capitulo : entrada.pagina;
    var fim = epub ? entrada.capitulo_fim : entrada.pagina_fim;
    var limite = limiteDoLivro(meta);
    if (!inteiro(ini) || !inteiro(fim) || ini < 1 || ini > fim || fim > limite) return { capitulo: [], gabarito: [] };
    var todas = unidadesDe([[ini, fim]]);
    var respostas = unidadesDe(faixasValidas(meta.gabarito_secoes, limite));
    // a entrada vem do mapaDoLivro (o gabarito já conferido) ou crua do manifest
    var g = entrada.gabarito && entrada.gabarito.faixas ? entrada.gabarito : gabaritoDaEntrada(meta, entrada);
    /* O gabarito do FIM DO CAPÍTULO nunca tira página do capítulo: ele foi
     * achado só pelo lugar, e uma página de exercício resolvido tomada por
     * gabarito sumiria do capítulo exportado (revisão do C15.5). O capítulo vai
     * inteiro, e o gabarito só acrescenta. Vale também para o pacote antigo,
     * que punha essas páginas em gabarito_secoes. */
    var doFim = g && g.como === 'fim_do_capitulo' ? unidadesDe(g.faixas) : [];
    var doLivro = g && g.como !== 'fim_do_capitulo' ? g.faixas : [];
    respostas = unidadesDe(respostas.map(function (u) { return [u, u]; }).concat(doLivro))
      .filter(function (u) { return doFim.indexOf(u) < 0; });
    var semRespostas = todas.filter(function (u) { return respostas.indexOf(u) < 0; });
    return {
      capitulo: semRespostas.length ? semRespostas : todas,
      gabarito: comGabarito && g ? unidadesDe(g.faixas) : []
    };
  }

  /* As páginas que ela escreveu ("3-5, 8", "10 a 12"), dentro do livro, em
   * ordem e sem repetir. Devolve { paginas } ou { erro } com a frase da tela. */
  function paginasEscolhidas(texto, total) {
    var t = String(texto || '').trim();
    if (!t) return { erro: 'Escreva as páginas, por exemplo 3-5, 8.' };
    var partes = t.split(/[,;]+|\s+e\s+/);
    var saida = [];
    for (var i = 0; i < partes.length; i++) {
      var p = partes[i].trim();
      if (!p) continue;
      var m = /^(\d{1,5})(?:\s*(?:-|a|até)\s*(\d{1,5}))?$/.exec(p);
      if (!m) return { erro: 'Não entendi "' + p + '". Escreva as páginas assim: 3-5, 8.' };
      var a = parseInt(m[1], 10), b = m[2] ? parseInt(m[2], 10) : a;
      if (a > b) { var x = a; a = b; b = x; }
      if (a < 1 || b > total) return { erro: 'O livro vai da página 1 à ' + total + '.' };
      for (var u = a; u <= b; u++) if (saida.indexOf(u) < 0) saida.push(u);
      if (saida.length > TETO_DE_PAGINAS_EXPORTADAS) return { erro: 'No máximo ' + TETO_DE_PAGINAS_EXPORTADAS + ' páginas por PDF.' };
    }
    if (!saida.length) return { erro: 'Escreva as páginas, por exemplo 3-5, 8.' };
    return { paginas: saida.sort(function (a, b) { return a - b; }) };
  }

  // "páginas 3 a 5 e 8", "página 9", "partes 2 a 3"
  function descreverUnidades(lista, nome) {
    var fs = [];
    (lista || []).forEach(function (u) {
      if (fs.length && u === fs[fs.length - 1][1] + 1) fs[fs.length - 1][1] = u;
      else fs.push([u, u]);
    });
    if (!fs.length) return '';
    var textos = fs.map(function (f) { return f[0] === f[1] ? String(f[0]) : f[0] + ' a ' + f[1]; });
    var junta = textos.length > 1 ? textos.slice(0, -1).join(', ') + ' e ' + textos[textos.length - 1] : textos[0];
    var um = fs.length === 1 && fs[0][0] === fs[0][1];
    return (um ? nome : nome + 's') + ' ' + junta;
  }

  // sem travessão nem meia-risca no que vai para o PDF (a regra da casa)
  var RE_TRACOS = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']', 'g');
  function semTracos(t) {
    return String(t == null ? '' : t).replace(RE_TRACOS, '-');
  }

  /* O rodapé de fonte do PDF exportado: "Fonte: título, autoria, editora,
   * ano, capítulo, páginas". O capítulo é o título do mapa, ou nada (páginas
   * escolhidas fora de capítulo); o gabarito, quando vai, diz as dele. */
  function fonteDoLivro(meta, capitulo, unidades, gabarito) {
    var m = meta || {};
    var nome = m.formato === 'epub' ? 'parte' : 'página';
    var partes = [m.titulo, m.volume, m.autoria, m.editora, m.ano, capitulo, descreverUnidades(unidades, nome)]
      .filter(function (x) { return x !== null && x !== undefined && String(x).trim(); }).map(function (x) { return String(x).trim(); });
    var g = gabarito && gabarito.length ? '; gabarito: ' + descreverUnidades(gabarito, nome) : '';
    return semTracos('Fonte: ' + partes.join(', ') + g);
  }

  /* Todo caminho de asset citado por itens.json e teoria.json. */
  function assetsCitados(itens, teoria) {
    var lista = [];
    (itens || []).forEach(function (it) {
      var a = it && it.assets;
      if (!a) return;
      if (a.enunciado) lista.push({ caminho: a.enunciado, de: it.id });
      if (a.solucao) lista.push({ caminho: a.solucao, de: it.id });
    });
    (teoria || []).forEach(function (t) {
      ((t && t.paginas) || []).forEach(function (p) {
        if (p && p.asset) lista.push({ caminho: p.asset, de: p.id || t.id });
      });
    });
    return lista;
  }

  /* O manifest: esquema, nome, versão e a lista dos arquivos. Recusa com a
   * frase de cada falta. */
  function conferirManifest(manifest) {
    if (!manifest || typeof manifest !== 'object') throw Recusa('O manifest.json do pacote não pôde ser lido.', 'defeito');
    if (manifest.esquema !== ESQUEMA) {
      if (typeof manifest.esquema === 'number' && manifest.esquema > ESQUEMA) {
        throw Recusa('O pacote é do esquema ' + manifest.esquema + ' e este aplicativo lê o esquema ' + ESQUEMA + '.', 'atualizar');
      }
      throw Recusa('O manifest.json não informa um esquema válido.', 'defeito');
    }
    if (typeof manifest.pacote !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(manifest.pacote)) {
      throw Recusa('O manifest.json do pacote não diz o nome do pacote.');
    }
    if (typeof manifest.versao !== 'number' || manifest.versao < 1 || Math.floor(manifest.versao) !== manifest.versao) {
      throw Recusa('O manifest.json do pacote não diz a versão.');
    }
    var lista = manifest.arquivos;
    if (!lista || typeof lista !== 'object') throw Recusa('O manifest.json do pacote não lista os arquivos.');
  }

  /* O zip e a lista do manifest, nos dois sentidos, e os caminhos. Devolve os
   * nomes do zip, menos o manifest. */
  function conferirZipELista(entradas, porNome, lista) {
    var nomesZip = entradas.map(function (en) { return en.nome; })
      .filter(function (n) { return n !== 'manifest.json'; });
    var sobrando = nomesZip.filter(function (n) { return !Object.prototype.hasOwnProperty.call(lista, n); });
    var faltando = Object.keys(lista).filter(function (n) { return n !== 'manifest.json' && !porNome[n]; });
    if (faltando.length) {
      throw Recusa('O pacote está incompleto: falta ' + faltando[0] +
        (faltando.length > 1 ? ' e mais ' + (faltando.length - 1) + ' arquivo(s)' : '') + '.', 'defeito');
    }
    if (sobrando.length) {
      throw Recusa('O pacote tem arquivo fora da lista do manifest: ' + sobrando[0] + '.');
    }
    nomesZip.forEach(function (n) {
      if (!caminhoValido(n)) throw Recusa('O pacote tem um caminho de arquivo inválido: ' + n + '.');
    });
    return nomesZip;
  }

  /* SHA-256 por partes, para o livro (C15.1).
   *
   * O crypto.subtle só calcula o hash de uma vez, com o livro inteiro na
   * memória, e copia os bytes antes de calcular. Medido na revisão: lendo um
   * livro inteiro por vez, a memória da página crescia com o pacote (cada
   * livro lido ficava esperando a coleta de lixo). Aqui o livro passa por
   * trechos de 1 MB, e o hash e o CRC vão sendo somados trecho a trecho:
   * nunca há mais que um trecho na mão. Conferido contra o crypto.subtle no
   * _teste/testa_livros.js, com cortes de trecho em todo lugar do bloco. */
  var K_SHA = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);

  function Sha256() {
    this.h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
    this.bloco = new Uint8Array(64);
    this.n = 0;
    this.total = 0;
    this.w = new Uint32Array(64);
  }
  Sha256.prototype.comprimir = function (b, o) {
    var w = this.w, h = this.h, t, x, y;
    for (t = 0; t < 16; t++) {
      w[t] = (b[o + 4 * t] << 24 | b[o + 4 * t + 1] << 16 | b[o + 4 * t + 2] << 8 | b[o + 4 * t + 3]) >>> 0;
    }
    for (t = 16; t < 64; t++) {
      x = w[t - 15]; y = w[t - 2];
      w[t] = (w[t - 16] + (((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3)) + w[t - 7] +
        (((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10))) >>> 0;
    }
    var a = h[0], bb = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
    for (t = 0; t < 64; t++) {
      var t1 = (hh + (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))) +
        ((e & f) ^ (~e & g)) + K_SHA[t] + w[t]) | 0;
      var t2 = ((((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))) +
        ((a & bb) ^ (a & c) ^ (bb & c))) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
    }
    h[0] += a; h[1] += bb; h[2] += c; h[3] += d; h[4] += e; h[5] += f; h[6] += g; h[7] += hh;
  };
  Sha256.prototype.atualizar = function (dados) {
    var i = 0, n = dados.length;
    this.total += n;
    if (this.n) {
      var k = Math.min(64 - this.n, n);
      this.bloco.set(dados.subarray(0, k), this.n);
      this.n += k;
      i = k;
      if (this.n < 64) return;
      this.comprimir(this.bloco, 0);
      this.n = 0;
    }
    for (; i + 64 <= n; i += 64) this.comprimir(dados, i);
    if (i < n) { this.bloco.set(dados.subarray(i), 0); this.n = n - i; }
  };
  Sha256.prototype.fim = function () {
    var bits = this.total * 8;
    var fecho = new Uint8Array(this.n < 56 ? 64 - this.n : 128 - this.n);
    fecho[0] = 0x80;
    var v = new DataView(fecho.buffer);
    v.setUint32(fecho.length - 8, Math.floor(bits / 0x100000000));
    v.setUint32(fecho.length - 4, bits >>> 0);
    this.atualizar(fecho);
    var s = '';
    for (var i = 0; i < 8; i++) s += ('0000000' + this.h[i].toString(16)).slice(-8);
    return s;
  };
  function sha256PorPartes(trechos) {
    var s = new Sha256();
    trechos.forEach(function (t) { s.atualizar(t); });
    return s.fim();
  }

  /* Confere um livro lido em trechos de 1 MB: tamanho, CRC do zip e hash do
   * manifest. Nenhum trecho fica para o próximo. */
  var TRECHO = 1024 * 1024;
  var PRAZO_CONFERENCIA_LIVRO_MS = 120000;
  function conferirLivroPorTrechos(blob, entrada, shaHex, aoProgredir) {
    var sha = new Sha256(), crc = 0, pos = 0, total = blob.size;
    function somar(b) { crc = Zip.crc32(b, crc); sha.atualizar(b); }
    /* Com leitor "byob", os trechos caem sempre no MESMO buffer de 1 MB: nada
     * fica esperando a coleta de lixo. Navegador sem ele lê fatias de 1 MB,
     * que a coleta de lixo solta depois. */
    var leitor = null;
    try { leitor = typeof blob.stream === 'function' ? blob.stream().getReader({ mode: 'byob' }) : null; }
    catch (e) { leitor = null; }
    function porByob(buf) {
      return leitor.read(new Uint8Array(buf, 0, TRECHO)).then(function (r) {
        if (r.done) return;
        somar(r.value);
        pos += r.value.length;
        if (aoProgredir) aoProgredir(pos, total);
        return porByob(r.value.buffer);
      });
    }
    function porFatias() {
      if (pos >= total) return Promise.resolve();
      var ate = Math.min(total, pos + TRECHO);
      return blob.slice(pos, ate).arrayBuffer().then(function (ab) {
        somar(new Uint8Array(ab));
        pos = ate;
        if (aoProgredir) aoProgredir(pos, total);
        return porFatias();
      });
    }
    var leitura = leitor ? porByob(new ArrayBuffer(TRECHO)) : porFatias();
    return leitura.then(function () {
      if (pos !== total) throw Recusa('O arquivo ' + entrada.nome + ' do pacote está corrompido.');
      if (total !== entrada.tamanho || crc !== entrada.crc) {
        throw Recusa('O arquivo ' + entrada.nome + ' do pacote está corrompido.');
      }
      if (sha.fim() !== shaHex) throw Recusa('O arquivo ' + entrada.nome + ' do pacote não confere com o manifest.', 'defeito');
    });
  }

  /* A conferência pesada de cada livro roda isolada. Se a leitura do Blob não
   * responder, o chamador encerra o Worker e segue para o próximo livro. */
  function conferirLivroIsolado(arquivo, entrada, formato, shaHex, aoProgredir) {
    if (typeof Worker !== 'function') {
      return Promise.reject(Recusa('Este navegador não consegue conferir livros em segurança. Atualize o Chrome e tente de novo.'));
    }
    return new Promise(function (resolve, reject) {
      var worker;
      var encerrado = false;
      var timer = setTimeout(function () {
        encerrar();
        reject(Recusa('A conferência passou de 2 minutos; este livro foi pulado.'));
      }, PRAZO_CONFERENCIA_LIVRO_MS);
      function encerrar() {
        if (encerrado) return;
        encerrado = true;
        clearTimeout(timer);
        try { if (worker) worker.terminate(); } catch (e) { /* já encerrado */ }
      }
      try {
        worker = new Worker('conferir-livro-worker.js');
        worker.onmessage = function (ev) {
          if (ev.data && ev.data.progresso) {
            if (aoProgredir) aoProgredir(ev.data.progresso.bytes, ev.data.progresso.total);
            return;
          }
          encerrar();
          if (ev.data && ev.data.ok) resolve(ev.data.blob);
          else reject(Recusa(ev.data && ev.data.erro || 'Não foi possível conferir este livro; ele foi pulado.'));
        };
        worker.onerror = function () {
          encerrar();
          reject(Recusa('A conferência deste livro falhou; ele foi pulado.'));
        };
        worker.postMessage({ arquivo: arquivo, entrada: entrada, formato: formato, shaHex: shaHex });
      } catch (e) {
        encerrar();
        reject(Recusa('Não foi possível iniciar a conferência deste livro; ele foi pulado.'));
      }
    });
  }

  /* A primeira olhada no arquivo, SEM lê-lo inteiro: só o diretório central
   * do zip e o manifest. Devolve { zip, manifest } ou null quando não dá (aí
   * o caminho de sempre lê o arquivo e diz o motivo com as frases dele).
   *
   * A exceção é o pacote CORTADO (começa como zip e não tem o fim, o download
   * que parou no meio): esse é recusado aqui mesmo, com a frase do download.
   * Antes ele caía no caminho de sempre, que lia o arquivo inteiro (centenas
   * de MB, no pacote de livros) só para dizer a mesma coisa. */
  function espiarPacote(arquivo) {
    if (!Zip.suportado() || !arquivo || typeof arquivo.slice !== 'function' || typeof Zip.lerDoArquivo !== 'function') {
      return Promise.resolve(null);
    }
    return Zip.lerDoArquivo(arquivo).then(function (zipArq) {
      var en = zipArq.entradas.filter(function (e) { return e.nome === 'manifest.json'; })[0];
      if (!en) return null;
      return Zip.extrairDoArquivo(zipArq, en).then(function (bytes) {
        var manifest = JSON.parse(texto(bytes));
        return manifest && typeof manifest === 'object' ? { zip: zipArq, manifest: manifest } : null;
      });
    }).catch(function (e) {
      if (e && e.cortado) throw Recusa(e.message, 'download');
      return null;
    });
  }

  /* O pacote de livros (C15.1), LIVRO A LIVRO, direto do arquivo escolhido.
   *
   * Antes, o arquivo inteiro ia para a memória (arrayBuffer), e cada livro
   * mais uma vez num Blob, todos seguros até o fim da gravação: com 400 MB de
   * zip o pico passava de 800 MB, e a aba caía no tablet. Agora:
   *   - o zip nunca é lido inteiro: só o diretório central (espiarPacote);
   *   - a forma de todos os livros é conferida antes de ler qualquer um, e um
   *     livro acima de 160 MB recusa o pacote ali mesmo;
   *   - cada livro é lido sozinho, por fatia do arquivo, para o CRC e o hash,
   *     e os bytes são soltos antes do próximo: o pico é perto de UM livro;
   *   - o que vai para a gravação é a fatia do próprio arquivo (o livro vem
   *     sem compressão), que o navegador copia do disco para o banco.
   * Devolve { manifest, livros: [{ meta, blob }], erros, idsDoPacote,
   * bytesTotais }. Erro num livro não impede os seguintes. */
  function abrirLivrosDoArquivo(espiado, aoProgredir) {
    var zipArq = espiado.zip, manifest = espiado.manifest;
    return Promise.resolve().then(function () {
      conferirManifest(manifest);
      var lista = manifest.arquivos;
      var porNome = Object.create(null);
      zipArq.entradas.forEach(function (en) { porNome[en.nome] = en; });
      var nomesZip = conferirZipELista(zipArq.entradas, porNome, lista);
      var noZip = Object.create(null);
      nomesZip.forEach(function (n) {
        if (!/^livros\/[a-z0-9][a-z0-9-]*\.(pdf|epub)$/.test(n)) {
          throw Recusa('O pacote de livros tem arquivo fora da pasta dos livros: ' + n + '.', 'defeito');
        }
        noZip[n] = true;
      });
      var livros = lerLivros(manifest, noZip, lista);
      var recusados = livros.recusados || [];
      livros.forEach(function (l) {
        var en = porNome[l.meta.arquivo];
        if (en.tamanho > TETO_POR_LIVRO) {
          throw Recusa('O livro "' + l.meta.titulo + '" tem ' + mb(en.tamanho) + ', acima do teto de 160 MB por livro, ' +
            'e o pacote não foi importado.', 'defeito');
        }
        if (en.metodo !== 0) {
          throw Recusa('O livro "' + l.meta.titulo + '" veio comprimido no pacote, e o aplicativo só lê livro sem compressão.', 'defeito');
        }
      });
      var i = 0, bytesTotais = 0, erros = [];
      function proximo() {
        if (i >= livros.length) return Promise.resolve();
        var l = livros[i++];
        var en = porNome[l.meta.arquivo];
        var m = /^sha256:([0-9a-f]{64})$/.exec(String(lista[l.meta.arquivo] || ''));
        function registrarErro(e) {
          erros.push({ id: l.meta.id, titulo: l.meta.titulo, arquivo: l.meta.arquivo,
            mensagem: e && e.message || 'Não foi possível conferir este livro.' });
          if (aoProgredir) aoProgredir(i, livros.length, l.meta, false, erros[erros.length - 1]);
          return proximo();
        }
        if (!m) return registrarErro(Recusa('O manifest.json não traz o hash deste livro.'));
        // a fatia do próprio arquivo: conferida por trechos e, depois, gravada como está
        return conferirLivroIsolado(zipArq.arquivo, en, FORMATOS_DE_LIVRO[l.meta.formato], m[1], function (bytes, total) {
          if (aoProgredir) aoProgredir(i, livros.length, l.meta, null, null, bytes, total);
        }).then(function (blob) {
          bytesTotais += blob.size;
          l.blob = blob;
          if (aoProgredir) aoProgredir(i, livros.length, l.meta, true, null);
          return proximo();
        }).catch(function (e) {
          return registrarErro(e);
        });
      }
      return proximo().then(function () {
          return { manifest: manifest, livros: livros.filter(function (l) { return !!l.blob; }),
            idsDoPacote: livros.map(function (l) { return l.meta.id; }).concat(recusados.map(function (l) { return l.id; })),
            erros: erros, bytesTotais: bytesTotais,
            recusados: recusados };
      });
    }).catch(function (e) {
      if (e && e.message === 'SEM_DESCOMPRESSAO') throw Recusa(SEM_NAVEGADOR);
      if (e && e.zip) throw Recusa(e.message || 'O pacote não pôde ser aberto.');
      throw e;
    });
  }

  /* Abre o zip, confere tudo e devolve o pacote pronto para gravar:
   *   { manifest, itens, teoria, busca, apelidos,
   *     assets: [{ caminho, tipo, blob }], bytesTotais }
   * Recusa com Error.recusa = true e a mensagem para a tela. */
  function abrirPacote(conteudo, aoProgredir) {
    if (!Zip.suportado()) return Promise.reject(Recusa(SEM_NAVEGADOR));
    var zip;
    try { zip = Zip.ler(conteudo); }
    catch (e) { return Promise.reject(Recusa(e.message)); }

    var porNome = Object.create(null);
    zip.entradas.forEach(function (en) { porNome[en.nome] = en; });

    // 1. o manifest
    if (!porNome['manifest.json']) {
      return Promise.reject(Recusa('Este arquivo não é um pacote da biblioteca: falta o manifest.json.'));
    }
    return Zip.extrair(zip, porNome['manifest.json']).then(function (bytes) {
      var manifest = json('manifest.json', bytes);
      conferirManifest(manifest);
      var lista = manifest.arquivos;
      /* O pacote de livros (C15.1) é lido livro a livro, direto do arquivo
       * (abrirLivrosDoArquivo), e nunca inteiro na memória. Chegar aqui é a
       * espiada do arquivo ter falhado: a frase não culpa o pacote. */
      if (manifest.conteudo === 'livros') {
        throw Recusa('Este pacote de livros não pôde ser lido livro a livro. Feche e abra o aplicativo e tente de novo.', 'download');
      }

      // 2. o zip e a lista, nos dois sentidos
      var nomesZip = conferirZipELista(zip.entradas, porNome, lista);
      OBRIGATORIOS.forEach(function (n) {
        if (!porNome[n]) throw Recusa('O pacote está incompleto: falta ' + n + '.', 'defeito');
      });

      /* Extrai e confere o hash, um arquivo por vez. A imagem vira Blob logo
       * depois do hash e os bytes inflados são soltos: com milhares de SVG, o
       * pacote não fica duas vezes na memória do tablet. */
      var extraidos = Object.create(null);
      var imagens = [];
      var bytesTotais = 0;
      var i = 0;
      function proximo() {
        if (i >= nomesZip.length) return Promise.resolve();
        var nome = nomesZip[i++];
        var esperado = String(lista[nome] || '');
        var m = /^sha256:([0-9a-f]{64})$/.exec(esperado);
        if (!m) return Promise.reject(Recusa('O manifest.json não traz o hash de ' + nome + '.'));
        return Zip.extrair(zip, porNome[nome]).then(function (bytes) {
          return sha256(bytes).then(function (h) {
            if (h !== m[1]) throw Recusa('O arquivo ' + nome + ' do pacote não confere com o manifest.', 'defeito');
            bytesTotais += bytes.length;
            if (/^assets\//.test(nome)) {
              var tipo = tipoDoAsset(nome) || 'application/octet-stream';
              imagens.push({ caminho: nome, tipo: tipo, blob: new Blob([bytes], { type: tipo }) });
              extraidos[nome] = true;
            } else {
              extraidos[nome] = bytes;
            }
            if (aoProgredir) aoProgredir(i, nomesZip.length);
            return proximo();
          });
        });
      }
      return proximo().then(function () {
        var itens = json('itens.json', extraidos['itens.json']);
        var teoria = json('teoria.json', extraidos['teoria.json']);
        var busca = json('busca.json', extraidos['busca.json']);
        var apelidos = json('apelidos.json', extraidos['apelidos.json']);
        var kits = lerKits(extraidos['kits.json'], itens);
        if (!Array.isArray(itens)) throw Recusa('O itens.json do pacote não é uma lista.');
        if (!Array.isArray(teoria)) throw Recusa('O teoria.json do pacote não é uma lista.');
        itens.forEach(function (it) {
          if (!it || typeof it.id !== 'string') throw Recusa('O itens.json do pacote tem exercício sem identificador.');
        });
        teoria.forEach(function (t) {
          if (!t || typeof t.id !== 'string' || !Array.isArray(t.paginas)) {
            throw Recusa('O teoria.json do pacote tem aula sem identificador ou sem páginas.');
          }
        });

        // 3. todo asset citado existe no zip, e é imagem que o app sabe mostrar
        var citados = assetsCitados(itens, teoria);
        citados.forEach(function (c) {
          if (!caminhoValido(c.caminho) || c.caminho.indexOf('assets/') !== 0) {
            throw Recusa('O pacote cita uma imagem fora da pasta assets: ' + c.caminho + '.');
          }
          if (!extraidos[c.caminho]) throw Recusa(c.de + ' cita ' + c.caminho + ', que não está no pacote.', 'defeito');
          if (!tipoDoAsset(c.caminho)) throw Recusa('O pacote cita um arquivo que não é imagem: ' + c.caminho + '.');
        });

        var assets = imagens.sort(function (a, b) { return a.caminho < b.caminho ? -1 : 1; });

        return {
          manifest: manifest, itens: itens, teoria: teoria, busca: busca, apelidos: apelidos,
          kits: kits, assets: assets, bytesTotais: bytesTotais
        };
      });
    }).catch(function (e) {
      if (e && e.message === 'SEM_DESCOMPRESSAO') throw Recusa(SEM_NAVEGADOR);
      /* Só o que veio do leitor de zip vira recusa do pacote. Falha do próprio
       * navegador (falta de memória, por exemplo) não é defeito do pacote:
       * segue como erro comum, e a tela não culpa o pacote nem mostra inglês. */
      if (e && e.zip) throw Recusa(e.message || 'O pacote não pôde ser aberto.');
      throw e;
    });
  }

  /* ------------------------------------------------------------- resumo */

  var NOME_SERIE = {
    '2ano': '2º ano', '3ano': '3º ano', '4ano': '4º ano', '5ano': '5º ano',
    '6ano': '6º ano', '7ano': '7º ano', '8ano': '8º ano', '9ano': '9º ano',
    '1em': '1ª série do médio', '2em': '2ª série do médio', '3em': '3ª série do médio',
    n1: 'nível 1', n2: 'nível 2', n3: 'nível 3',
    // os níveis da OBMEP Mirim (C12): Mirim 1 é o 2º e o 3º ano, Mirim 2 o 4º e o 5º
    m1: 'Mirim 1', m2: 'Mirim 2'
  };
  var NOME_MATERIA = { matematica: 'Matemática' };

  function nomeDaSerie(s) { return NOME_SERIE[s] || s; }

  function mb(bytes) {
    var v = bytes / (1024 * 1024);
    if (v > 0 && v < 0.1) return 'menos de 0,1 MB';
    return (v < 10 ? Math.round(v * 10) / 10 : Math.round(v)).toString().replace('.', ',') + ' MB';
  }

  /* As linhas que a tela mostra depois de importar, e na lista de Ajustes. */
  function resumo(manifest, bytesTotais) {
    var c = manifest.contagens || {};
    var fonte = (manifest.fonte && manifest.fonte.nome) || '';
    /* O Banco não tem série escolar: o nível vem com as séries a que ele
     * equivale (contrato, seção 8b). */
    var equiv = manifest.series_equivalentes || {};
    var series = (manifest.series || []).map(function (s) {
      return nomeDaSerie(s) + (equiv[s] && equiv[s].length ? ' (' + equiv[s].map(nomeDaSerie).join(', ') + ')' : '');
    }).join(', ');
    var linhas = [];
    var titulo = [NOME_MATERIA[manifest.materia] || manifest.materia || '', series, fonte].filter(Boolean).join(', ');
    linhas.push(titulo || 'Pacote da biblioteca');
    var partes = [];
    if (c.modulos != null) partes.push(c.modulos + (c.modulos === 1 ? ' módulo' : ' módulos'));
    if (c.aulas_teoria) partes.push(c.aulas_teoria + (c.aulas_teoria === 1 ? ' aula de teoria' : ' aulas de teoria') +
      (c.paginas_teoria != null ? ' (' + c.paginas_teoria + ' páginas)' : ''));
    if (c.itens != null) partes.push(c.itens + (c.itens === 1 ? ' exercício' : ' exercícios') +
      (c.itens_com_solucao != null ? ', ' + c.itens_com_solucao + ' com solução' : ''));
    if (partes.length) linhas.push(partes.join('; '));
    linhas.push('Versão ' + manifest.versao + (bytesTotais != null ? ', ' + mb(bytesTotais) + ' no tablet' : ''));
    return linhas;
  }

  // ---------- recorte para a folha (PDF) ----------

  /* O dpi em que o recorte vira imagem dentro do PDF. O pdf.js só embute JPEG
   * (DCTDecode), então o SVG é desenhado num canvas nesse dpi e sai JPEG. */
  var DPI_RECORTE = 200;
  var DPI_TEORIA = 150;
  var FOLGA_PEDACOS = 6;     // a mesma do gerador, entre pedaços empilhados (8a)

  /* As alturas dos pedaços empilhados, na ordem de leitura, ou null quando o
   * recorte é de um pedaço só. Se as alturas não fecharem com a medida do
   * asset (folga de 6 pt entre elas), não se adivinha fronteira: o recorte vai
   * inteiro, e o compositor reduz a escala se ele não couber na folha. */
  function alturasDosPedacos(medidas, pedacos) {
    if (!pedacos || pedacos.length < 2) return null;
    var alturas = pedacos.map(function (p) { return p.bbox[3] - p.bbox[1]; });
    var soma = alturas.reduce(function (s, h) { return s + h; }, 0) + FOLGA_PEDACOS * (alturas.length - 1);
    if (Math.abs(soma - medidas.altura_pt) > 1) return null;
    return alturas;
  }

  function canvasParaJpeg(canvas) {
    return new Promise(function (ok, falha) {
      canvas.toBlob(function (b) {
        if (!b) { falha(new Error('o canvas não virou JPEG')); return; }
        b.arrayBuffer().then(function (buf) {
          ok({ bytes: new Uint8Array(buf), wPx: canvas.width, hPx: canvas.height });
        }, falha);
      }, 'image/jpeg', 0.92);
    });
  }

  /* Um asset (SVG, ou o WebP de reserva) virando a peça que o
   * PDFGen.gerarMaterialBiblioteca recebe:
   *   { larguraPt, alturaPt, rotulo, img }  ou  { ..., pedacos: [{ img, alturaPt }] }.
   * O rótulo original ("Exercício 7.") é coberto de branco com folga de 1 pt,
   * aqui e só aqui: o asset guardado no tablet nunca muda. */
  function rasterizarRecorte(blob, medidas, pedacos, dpi) {
    dpi = dpi || DPI_RECORTE;
    var k = dpi / 72;
    var rotulo = medidas.rotulo || null;
    var alturas = alturasDosPedacos(medidas, pedacos);
    return new Promise(function (ok, falha) {
      var url = URL.createObjectURL(blob);
      var im = new Image();
      im.onload = function () {
        URL.revokeObjectURL(url);
        var cv = document.createElement('canvas');
        cv.width = Math.round(medidas.largura_pt * k);
        cv.height = Math.round(medidas.altura_pt * k);
        var cx = cv.getContext('2d');
        cx.fillStyle = '#FFFFFF';
        cx.fillRect(0, 0, cv.width, cv.height);
        cx.drawImage(im, 0, 0, cv.width, cv.height);
        if (rotulo) {
          cx.fillStyle = '#FFFFFF';
          cx.fillRect((rotulo[0] - 1) * k, (rotulo[1] - 1) * k,
            (rotulo[2] - rotulo[0] + 2) * k, (rotulo[3] - rotulo[1] + 2) * k);
        }
        var base = { larguraPt: medidas.largura_pt, alturaPt: medidas.altura_pt, rotulo: rotulo };
        if (!alturas) {
          canvasParaJpeg(cv).then(function (img) { base.img = img; ok(base); }, falha);
          return;
        }
        var y = 0;
        Promise.all(alturas.map(function (h) {
          var p = document.createElement('canvas');
          p.width = cv.width;
          p.height = Math.round(h * k);
          /* O arredondamento de cada fronteira pode pedir uma linha além do fim
           * do canvas de origem; essa linha viria transparente, e transparente
           * vira preto no JPEG (um fio escuro embaixo do último pedaço). Fundo
           * branco e a altura lida limitada ao que a origem tem. */
          var cp = p.getContext('2d');
          cp.fillStyle = '#FFFFFF';
          cp.fillRect(0, 0, p.width, p.height);
          var y0 = Math.round(y * k);
          var alto = Math.min(p.height, cv.height - y0);
          if (alto > 0) cp.drawImage(cv, 0, y0, cv.width, alto, 0, 0, cv.width, alto);
          y += h + FOLGA_PEDACOS;
          return canvasParaJpeg(p).then(function (img) { return { img: img, alturaPt: h }; });
        })).then(function (lista) { base.pedacos = lista; ok(base); }, falha);
      };
      im.onerror = function () { URL.revokeObjectURL(url); falha(new Error('o recorte não abriu')); };
      im.src = url;
    });
  }

  /* Página de teoria inteira, sem rótulo e sem pedaços. */
  function rasterizarPagina(blob, medidas) {
    return rasterizarRecorte(blob, { largura_pt: medidas.largura_pt, altura_pt: medidas.altura_pt, rotulo: null },
      null, DPI_TEORIA).then(function (p) { return { img: p.img, larguraPt: p.larguraPt, alturaPt: p.alturaPt }; });
  }

  return {
    ESQUEMA: ESQUEMA, SEM_NAVEGADOR: SEM_NAVEGADOR,
    abrirPacote: abrirPacote, espiarPacote: espiarPacote, abrirLivrosDoArquivo: abrirLivrosDoArquivo,
    conferirLivroPorTrechos: conferirLivroPorTrechos,
    TETO_POR_LIVRO: TETO_POR_LIVRO, sha256PorPartes: sha256PorPartes, resumo: resumo, nomeDaSerie: nomeDaSerie, mb: mb, resumoDeLivros: resumoDeLivros,
    sha256: sha256, tipoDoAsset: tipoDoAsset,
    paginaImpressa: paginaImpressa, paginaDoArquivo: paginaDoArquivo, paginaDaPosicao: paginaDaPosicao,
    resolverPaginaDoLeitor: resolverPaginaDoLeitor, conferirNumeracao: conferirNumeracao, paraRomano: paraRomano, deRomano: deRomano,
    conferirMetaDaNuvem: conferirMetaDaNuvem,
    mapaDoLivro: mapaDoLivro, resolverCorrecoes: resolverCorrecoes, correcoesOrfas: correcoesOrfas,
    chaveParaGravarCorrecao: chaveParaGravarCorrecao, tituloNormalizado: tituloNormalizado, entradaDoMapa: entradaDoMapa, livroDoAno: livroDoAno, livrosComAssunto: livrosComAssunto,
    indiceDeCapitulos: indiceDeCapitulos, procurarNosCapitulos: procurarNosCapitulos,
    disciplinaDoMapa: disciplinaDoMapa, assuntoDeOutraMateria: assuntoDeOutraMateria,
    nomeDoAssuntoNoLivro: nomeDoAssuntoNoLivro, opcoesDoCorrigir: opcoesDoCorrigir,
    marcadorSemSentido: marcadorSemSentido, sumarioDosMarcadoresInutil: sumarioDosMarcadoresInutil, sumarioDoLivro: sumarioDoLivro,
    coberturaDoMapa: coberturaDoMapa, COBERTURA_MINIMA_DO_MAPA: COBERTURA_MINIMA_DO_MAPA,
    TETO_DE_PAGINAS_EXPORTADAS: TETO_DE_PAGINAS_EXPORTADAS, livroTemGabarito: livroTemGabarito,
    estimarPdfExportado: estimarPdfExportado, AVISO_DE_TAMANHO_EXPORTADO: AVISO_DE_TAMANHO_EXPORTADO,
    partesDoCapitulo: partesDoCapitulo, paginasEscolhidas: paginasEscolhidas, descreverUnidades: descreverUnidades,
    fonteDoLivro: fonteDoLivro, semTracos: semTracos,
    rasterizarRecorte: rasterizarRecorte, rasterizarPagina: rasterizarPagina,
    alturasDosPedacos: alturasDosPedacos
  };
});
