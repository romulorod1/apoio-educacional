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

  function Recusa(mensagem) {
    var e = new Error(mensagem);
    e.recusa = true;
    return e;
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

  function json(nome, bytes) {
    try { return JSON.parse(texto(bytes)); }
    catch (e) { throw Recusa('O arquivo ' + nome + ' do pacote não pôde ser lido.'); }
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

  /* Abre o zip, confere tudo e devolve o pacote pronto para gravar:
   *   { manifest, itens, teoria, busca, apelidos,
   *     assets: [{ caminho, tipo, bytes }], bytesTotais }
   * Recusa com Error.recusa = true e a mensagem para a tela. */
  function abrirPacote(conteudo, aoProgredir) {
    if (!Zip.suportado()) return Promise.reject(Recusa(SEM_NAVEGADOR));
    var zip;
    try { zip = Zip.ler(conteudo); }
    catch (e) { return Promise.reject(Recusa(e.message)); }

    var porNome = {};
    zip.entradas.forEach(function (en) { porNome[en.nome] = en; });

    // 1. o manifest
    if (!porNome['manifest.json']) {
      return Promise.reject(Recusa('Este arquivo não é um pacote da biblioteca: falta o manifest.json.'));
    }
    return Zip.extrair(zip, porNome['manifest.json']).then(function (bytes) {
      var manifest = json('manifest.json', bytes);
      if (!manifest || typeof manifest !== 'object') throw Recusa('O manifest.json do pacote não pôde ser lido.');
      if (manifest.esquema !== ESQUEMA) {
        throw Recusa('Este pacote é de uma versão do aplicativo que ainda não chegou aqui (esquema ' +
          manifest.esquema + '). Atualize o aplicativo e tente de novo.');
      }
      if (typeof manifest.pacote !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(manifest.pacote)) {
        throw Recusa('O manifest.json do pacote não diz o nome do pacote.');
      }
      if (typeof manifest.versao !== 'number' || manifest.versao < 1 || Math.floor(manifest.versao) !== manifest.versao) {
        throw Recusa('O manifest.json do pacote não diz a versão.');
      }
      var lista = manifest.arquivos;
      if (!lista || typeof lista !== 'object') throw Recusa('O manifest.json do pacote não lista os arquivos.');

      // 2. o zip e a lista, nos dois sentidos
      var nomesZip = zip.entradas.map(function (en) { return en.nome; })
        .filter(function (n) { return n !== 'manifest.json'; });
      var sobrando = nomesZip.filter(function (n) { return !Object.prototype.hasOwnProperty.call(lista, n); });
      var faltando = Object.keys(lista).filter(function (n) { return n !== 'manifest.json' && !porNome[n]; });
      if (faltando.length) {
        throw Recusa('O pacote está incompleto: falta ' + faltando[0] +
          (faltando.length > 1 ? ' e mais ' + (faltando.length - 1) + ' arquivo(s)' : '') + '.');
      }
      if (sobrando.length) {
        throw Recusa('O pacote tem arquivo fora da lista do manifest: ' + sobrando[0] + '.');
      }
      nomesZip.forEach(function (n) {
        if (!caminhoValido(n)) throw Recusa('O pacote tem um caminho de arquivo inválido: ' + n + '.');
      });
      OBRIGATORIOS.forEach(function (n) {
        if (!porNome[n]) throw Recusa('O pacote está incompleto: falta ' + n + '.');
      });

      // Extrai e confere o hash, um arquivo por vez (não segura dois inflados
      // de uma vez além do que já foi aceito).
      var extraidos = {};
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
            if (h !== m[1]) throw Recusa('O arquivo ' + nome + ' do pacote não confere com o manifest.');
            extraidos[nome] = bytes;
            bytesTotais += bytes.length;
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
          if (!extraidos[c.caminho]) throw Recusa('O pacote está incompleto: ' + c.de + ' cita ' + c.caminho + ', que não está no zip.');
          if (!tipoDoAsset(c.caminho)) throw Recusa('O pacote cita um arquivo que não é imagem: ' + c.caminho + '.');
        });

        var assets = Object.keys(extraidos).filter(function (n) { return /^assets\//.test(n); }).sort()
          .map(function (n) { return { caminho: n, tipo: tipoDoAsset(n) || 'application/octet-stream', bytes: extraidos[n] }; });

        return {
          manifest: manifest, itens: itens, teoria: teoria, busca: busca, apelidos: apelidos,
          assets: assets, bytesTotais: bytesTotais
        };
      });
    }).catch(function (e) {
      if (e && e.message === 'SEM_DESCOMPRESSAO') throw Recusa(SEM_NAVEGADOR);
      if (e && !e.recusa) throw Recusa(e.message || 'O pacote não pôde ser aberto.');
      throw e;
    });
  }

  /* ------------------------------------------------------------- resumo */

  var NOME_SERIE = {
    '6ano': '6º ano', '7ano': '7º ano', '8ano': '8º ano', '9ano': '9º ano',
    '1em': '1ª série do médio', '2em': '2ª série do médio', '3em': '3ª série do médio',
    n1: 'nível 1', n2: 'nível 2', n3: 'nível 3'
  };
  var NOME_MATERIA = { matematica: 'Matemática' };

  function nomeDaSerie(s) { return NOME_SERIE[s] || s; }

  function mb(bytes) {
    var v = bytes / (1024 * 1024);
    return (v < 10 ? Math.round(v * 10) / 10 : Math.round(v)).toString().replace('.', ',') + ' MB';
  }

  /* As linhas que a tela mostra depois de importar, e na lista de Ajustes. */
  function resumo(manifest, bytesTotais) {
    var c = manifest.contagens || {};
    var fonte = (manifest.fonte && manifest.fonte.nome) || '';
    var series = (manifest.series || []).map(nomeDaSerie).join(', ');
    var linhas = [];
    linhas.push((NOME_MATERIA[manifest.materia] || manifest.materia || '') +
      (series ? ', ' + series : '') + (fonte ? ', ' + fonte : ''));
    var partes = [];
    if (c.modulos != null) partes.push(c.modulos + (c.modulos === 1 ? ' módulo' : ' módulos'));
    if (c.aulas_teoria != null) partes.push(c.aulas_teoria + (c.aulas_teoria === 1 ? ' aula de teoria' : ' aulas de teoria') +
      (c.paginas_teoria != null ? ' (' + c.paginas_teoria + ' páginas)' : ''));
    if (c.itens != null) partes.push(c.itens + (c.itens === 1 ? ' exercício' : ' exercícios') +
      (c.itens_com_solucao != null ? ', ' + c.itens_com_solucao + ' com solução' : ''));
    if (partes.length) linhas.push(partes.join('; '));
    linhas.push('Versão ' + manifest.versao + (bytesTotais != null ? ', ' + mb(bytesTotais) + ' no tablet' : ''));
    return linhas;
  }

  return {
    ESQUEMA: ESQUEMA, SEM_NAVEGADOR: SEM_NAVEGADOR,
    abrirPacote: abrirPacote, resumo: resumo, nomeDaSerie: nomeDaSerie, mb: mb,
    sha256: sha256, tipoDoAsset: tipoDoAsset
  };
});
