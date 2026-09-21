/* zip.js
 * Leitor de zip sem dependência, para o pacote da biblioteca.
 *
 * Lê só o que o contrato do pacote permite (CONTRATO_pacote_biblioteca.md,
 * seção 1): entradas "stored" (método 0) e "deflate" (método 8), sem
 * criptografia, sem zip64, num disco só. Qualquer coisa fora disso é recusada
 * com o motivo escrito, nunca aberta pela metade.
 *
 * O deflate é desfeito pelo próprio navegador, com DecompressionStream
 * ('deflate-raw'). Navegador sem ele não abre pacote nenhum, e a tela tem de
 * dizer isso em vez de falhar calada: é o que `suportado()` responde.
 *
 * Cada arquivo extraído é conferido duas vezes antes de sair daqui: o tamanho
 * descomprimido e o CRC-32 gravados no diretório central. O hash do manifest
 * é uma terceira conferência, feita por quem chama (biblioteca.js).
 *
 * Roda também no Node (18 ou mais novo), para os testes.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Zip = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SIG_FIM = 0x06054b50;       // fim do diretório central
  var SIG_CENTRAL = 0x02014b50;   // entrada do diretório central
  var SIG_LOCAL = 0x04034b50;     // cabeçalho local do arquivo

  function suportado() {
    return typeof DecompressionStream === 'function';
  }

  function ErroZip(mensagem) {
    var e = new Error(mensagem);
    e.zip = true;
    return e;
  }

  function comoBytes(entrada) {
    if (entrada instanceof Uint8Array) return entrada;
    if (entrada instanceof ArrayBuffer) return new Uint8Array(entrada);
    if (entrada && entrada.buffer instanceof ArrayBuffer) {
      return new Uint8Array(entrada.buffer, entrada.byteOffset, entrada.byteLength);
    }
    throw ErroZip('O arquivo não pôde ser lido.');
  }

  /* ---------------------------------------------------------------- CRC-32 */

  var TABELA_CRC = null;
  function crc32(bytes) {
    if (!TABELA_CRC) {
      TABELA_CRC = new Uint32Array(256);
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        TABELA_CRC[n] = c >>> 0;
      }
    }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) crc = TABELA_CRC[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  /* -------------------------------------------------------- diretório central */

  /* Devolve { entradas: [...] } com o nome, o método, os tamanhos, o CRC e
   * onde começam os dados de cada arquivo. Não descomprime nada. */
  function ler(entrada) {
    var b = comoBytes(entrada);
    var v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    if (b.length < 22) throw ErroZip('O arquivo escolhido não é um pacote (.zip).');

    // O fim do diretório central fica nos últimos 22 bytes, mais o comentário.
    var fim = -1;
    var ate = Math.max(0, b.length - 22 - 65535);
    for (var p = b.length - 22; p >= ate; p--) {
      if (v.getUint32(p, true) === SIG_FIM) { fim = p; break; }
    }
    if (fim < 0) throw ErroZip('O arquivo escolhido não é um pacote (.zip).');

    var disco = v.getUint16(fim + 4, true);
    var discoDir = v.getUint16(fim + 6, true);
    var totalAqui = v.getUint16(fim + 8, true);
    var total = v.getUint16(fim + 10, true);
    var tamDir = v.getUint32(fim + 12, true);
    var inicioDir = v.getUint32(fim + 16, true);
    if (total === 0xFFFF || tamDir === 0xFFFFFFFF || inicioDir === 0xFFFFFFFF) {
      throw ErroZip('Pacote em formato zip64, que o aplicativo não lê.');
    }
    if (disco !== 0 || discoDir !== 0 || totalAqui !== total) {
      throw ErroZip('Pacote dividido em partes, que o aplicativo não lê.');
    }
    if (inicioDir + tamDir > fim) throw ErroZip('O pacote está incompleto ou corrompido.');

    var entradas = [];
    var vistos = {};
    var q = inicioDir;
    for (var i = 0; i < total; i++) {
      if (q + 46 > fim || v.getUint32(q, true) !== SIG_CENTRAL) {
        throw ErroZip('O pacote está incompleto ou corrompido.');
      }
      var flags = v.getUint16(q + 8, true);
      var metodo = v.getUint16(q + 10, true);
      var crc = v.getUint32(q + 16, true);
      var comprimido = v.getUint32(q + 20, true);
      var tamanho = v.getUint32(q + 24, true);
      var lenNome = v.getUint16(q + 28, true);
      var lenExtra = v.getUint16(q + 30, true);
      var lenComent = v.getUint16(q + 32, true);
      var local = v.getUint32(q + 42, true);
      var nome = nomeDe(b.subarray(q + 46, q + 46 + lenNome));
      q += 46 + lenNome + lenExtra + lenComent;

      if (flags & 1) throw ErroZip('O pacote está protegido por senha, e o aplicativo não o abre.');
      if (comprimido === 0xFFFFFFFF || tamanho === 0xFFFFFFFF || local === 0xFFFFFFFF) {
        throw ErroZip('Pacote em formato zip64, que o aplicativo não lê.');
      }
      if (/\/$/.test(nome)) continue;   // pasta: não é arquivo
      if (metodo !== 0 && metodo !== 8) {
        throw ErroZip('O arquivo ' + nome + ' do pacote usa uma compressão que o aplicativo não lê.');
      }
      if (vistos[nome]) throw ErroZip('O pacote tem o arquivo ' + nome + ' repetido.');
      vistos[nome] = true;

      if (local + 30 > b.length || v.getUint32(local, true) !== SIG_LOCAL) {
        throw ErroZip('O pacote está incompleto ou corrompido.');
      }
      var dados = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
      if (dados + comprimido > b.length) throw ErroZip('O pacote está incompleto ou corrompido.');
      if (metodo === 0 && comprimido !== tamanho) throw ErroZip('O pacote está incompleto ou corrompido.');

      entradas.push({
        nome: nome, metodo: metodo, crc: crc,
        comprimido: comprimido, tamanho: tamanho, inicio: dados
      });
    }
    return { bytes: b, entradas: entradas };
  }

  function nomeDe(bytes) {
    // O contrato pede nomes ASCII; UTF-8 é superconjunto, então lê assim.
    if (typeof TextDecoder === 'function') return new TextDecoder('utf-8').decode(bytes);
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return s;
  }

  /* ------------------------------------------------------------- extrair */

  function inflar(bytes) {
    var fluxo = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Response(fluxo).arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
  }

  /* Devolve os bytes descomprimidos de uma entrada, conferidos contra o
   * tamanho e o CRC do diretório central. */
  function extrair(zip, entrada) {
    var cru = zip.bytes.subarray(entrada.inicio, entrada.inicio + entrada.comprimido);
    var passo;
    if (entrada.metodo === 0) {
      passo = Promise.resolve(cru);
    } else {
      if (!suportado()) return Promise.reject(ErroZip('SEM_DESCOMPRESSAO'));
      passo = inflar(cru).catch(function () {
        throw ErroZip('O arquivo ' + entrada.nome + ' do pacote está corrompido.');
      });
    }
    return passo.then(function (saida) {
      if (saida.length !== entrada.tamanho || crc32(saida) !== entrada.crc) {
        throw ErroZip('O arquivo ' + entrada.nome + ' do pacote está corrompido.');
      }
      return saida;
    });
  }

  return { suportado: suportado, ler: ler, extrair: extrair, crc32: crc32 };
});
