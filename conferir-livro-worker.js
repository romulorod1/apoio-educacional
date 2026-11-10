/* Confere um livro isolado para que o app possa encerrar a leitura se travar. */
importScripts('zip.js', 'biblioteca.js');
self.onmessage = function (ev) {
  var d = ev.data || {};
  Zip.fatiaDoArquivo({ arquivo: d.arquivo }, d.entrada, d.formato).then(function (blob) {
    return Biblioteca.conferirLivroPorTrechos(blob, d.entrada, d.shaHex, function (bytes, total) {
      self.postMessage({ progresso: { bytes: bytes, total: total } });
    }).then(function () { return blob; });
  }).then(function (blob) {
    self.postMessage({ ok: true, blob: blob });
  }, function (e) {
    self.postMessage({ ok: false, erro: e && e.message || 'O arquivo do livro não confere.' });
  });
};
