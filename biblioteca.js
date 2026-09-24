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
   * Confere pouco de propósito, e o que ele confere é só isto: o id, o módulo,
   * e a ordem dos degraus. O NÍVEL E OS MINUTOS NÃO SÃO CONFERIDOS AQUI, e a
   * frase antiga dizia que eram, o que é pior do que não conferir: recusar o
   * pacote inteiro por causa deles seria caro demais, e quem se defende da
   * ausência deles é a tela, que não escreve frase nenhuma com número que não é
   * número (ver `umaAula`, em app.js). O que
   * julga a REGRA é o biblioteca/confere_kits.py, do lado do gerador, e repetir
   * aquilo aqui seria pôr duas fontes para a mesma verdade num aparelho que não
   * tem como decidir qual das duas está certa. */
  function lerKits(bytes) {
    if (!bytes) return [];
    var kits = json('kits.json', bytes);
    if (!Array.isArray(kits)) throw Recusa('O kits.json do pacote não é uma lista.');
    kits.forEach(function (k) {
      if (!k || typeof k.id !== 'string' || typeof k.modulo !== 'string') {
        throw Recusa('O kits.json do pacote tem lista sem identificador ou sem módulo.');
      }
      if (!Array.isArray(k.degraus) || !k.degraus.length) {
        throw Recusa('A lista ' + k.id + ' do pacote não traz exercício nenhum.');
      }
      k.degraus.forEach(function (d, i) {
        if (!d || typeof d.item !== 'string') {
          throw Recusa('A lista ' + k.id + ' do pacote tem posição sem exercício.');
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

      // 2. o zip e a lista, nos dois sentidos
      var nomesZip = zip.entradas.map(function (en) { return en.nome; })
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
        var kits = lerKits(extraidos['kits.json']);
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
    '6ano': '6º ano', '7ano': '7º ano', '8ano': '8º ano', '9ano': '9º ano',
    '1em': '1ª série do médio', '2em': '2ª série do médio', '3em': '3ª série do médio',
    n1: 'nível 1', n2: 'nível 2', n3: 'nível 3'
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
    abrirPacote: abrirPacote, resumo: resumo, nomeDaSerie: nomeDaSerie, mb: mb,
    sha256: sha256, tipoDoAsset: tipoDoAsset,
    rasterizarRecorte: rasterizarRecorte, rasterizarPagina: rasterizarPagina,
    alturasDosPedacos: alturasDosPedacos
  };
});
