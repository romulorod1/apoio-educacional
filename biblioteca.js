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

  /* Confere a FORMA do que vai para a tela e para o leitor: id, formato, o
   * arquivo que existe no zip com o mesmo hash da lista, e o sumário dentro
   * do livro (página de 1 ao total no PDF, capítulo da espinha no EPUB). Um
   * sumário que aponta para fora do livro levaria o toque a lugar nenhum.
   * Não lê livro nenhum: `noZip` é o nome de cada arquivo do zip. */
  function lerLivros(manifest, noZip, lista) {
    var livros = manifest.livros;
    if (!Array.isArray(livros) || !livros.length) throw Recusa('O pacote de livros não traz livro nenhum.', 'defeito');
    var vistos = Object.create(null), citados = Object.create(null);
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
      return { meta: l };
    });
    Object.keys(noZip).forEach(function (n) {
      if (!citados[n]) throw Recusa('O pacote de livros tem um arquivo que nenhum livro cita: ' + n + '.', 'defeito');
    });
    return saida;
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
    if (contas.posicoesSoltas) {
      linhas.push(contas.posicoesSoltas + (contas.posicoesSoltas === 1 ? ' livro atualizado mudou' : ' livros atualizados mudaram') +
        ' de sumário e vai abrir no começo.');
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
   * `correcoes` é { <n do capítulo>: { titulo, assuntos: [ids], acao, quando } }
   * de UM livro. A correção só vale para o capítulo de mesmo número E mesmo
   * título: se um pacote novo renumerar o sumário, a correção velha não cai
   * calada no capítulo vizinho.
   *
   * Devolve uma lista de { n, titulo, pagina, pagina_fim, capitulo,
   * capitulo_fim, ancora, assuntos: [ids], origem, estado }, com estado
   *   'a_confirmar' do passe automático, sem palavra dela ainda;
   *   'do_mapa'     do mapa da orquestradora, sem palavra dela;
   *   'confirmado'  ela confirmou o que o mapa dizia;
   *   'corrigido'   ela escolheu outro assunto (ou nenhum). */
  function mapaDoLivro(meta, correcoes) {
    var mapa = meta && Array.isArray(meta.mapa) ? meta.mapa : [];
    correcoes = correcoes || {};
    var saida = [];
    mapa.forEach(function (e) {
      if (!e || !inteiro(e.n) || typeof e.titulo !== 'string') return;
      var ids = (Array.isArray(e.assuntos) ? e.assuntos : []).map(function (a) { return a && a.id; })
        .filter(function (id) { return typeof id === 'string' && id; });
      var c = Object.prototype.hasOwnProperty.call(correcoes, String(e.n)) ? correcoes[String(e.n)] : null;
      var vale = !!c && c.titulo === e.titulo && Array.isArray(c.assuntos);
      saida.push({
        n: e.n, titulo: e.titulo, pagina: e.pagina, pagina_fim: e.pagina_fim, capitulo: e.capitulo,
        capitulo_fim: e.capitulo_fim, ancora: e.ancora || null, obraInteira: !!e.obra_inteira,
        assuntos: vale ? c.assuntos.filter(function (id) { return typeof id === 'string' && id; }) : ids,
        origem: e.origem === 'auto' ? 'auto' : 'mapa',
        estado: vale ? (c.acao === 'corrigiu' ? 'corrigido' : 'confirmado') : (e.origem === 'auto' ? 'a_confirmar' : 'do_mapa')
      });
    });
    return saida;
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
  function conferirLivroPorTrechos(blob, entrada, shaHex) {
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
        return porByob(r.value.buffer);
      });
    }
    function porFatias() {
      if (pos >= total) return Promise.resolve();
      var ate = Math.min(total, pos + TRECHO);
      return blob.slice(pos, ate).arrayBuffer().then(function (ab) {
        somar(new Uint8Array(ab));
        pos = ate;
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
   * Devolve { manifest, livros: [{ meta, blob }], bytesTotais }. */
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
      var i = 0, bytesTotais = 0;
      function proximo() {
        if (i >= livros.length) return Promise.resolve();
        var l = livros[i++];
        var en = porNome[l.meta.arquivo];
        var m = /^sha256:([0-9a-f]{64})$/.exec(String(lista[l.meta.arquivo] || ''));
        if (!m) return Promise.reject(Recusa('O manifest.json não traz o hash de ' + l.meta.arquivo + '.'));
        // a fatia do próprio arquivo: conferida por trechos e, depois, gravada como está
        return Zip.fatiaDoArquivo(zipArq, en, FORMATOS_DE_LIVRO[l.meta.formato]).then(function (blob) {
          return conferirLivroPorTrechos(blob, en, m[1]).then(function () { return blob; });
        }).then(function (blob) {
          bytesTotais += blob.size;
          l.blob = blob;
          if (aoProgredir) aoProgredir(i, livros.length);
          return proximo();
        });
      }
      return proximo().then(function () { return { manifest: manifest, livros: livros, bytesTotais: bytesTotais }; });
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
    TETO_POR_LIVRO: TETO_POR_LIVRO, sha256PorPartes: sha256PorPartes, resumo: resumo, nomeDaSerie: nomeDaSerie, mb: mb, resumoDeLivros: resumoDeLivros,
    sha256: sha256, tipoDoAsset: tipoDoAsset,
    mapaDoLivro: mapaDoLivro, entradaDoMapa: entradaDoMapa, livroDoAno: livroDoAno, livrosComAssunto: livrosComAssunto,
    rasterizarRecorte: rasterizarRecorte, rasterizarPagina: rasterizarPagina,
    alturasDosPedacos: alturasDosPedacos
  };
});
