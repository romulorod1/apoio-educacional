/* nuvem.js
 * Fase 0 da nuvem (N0): a cópia completa deste aparelho, cifrada AQUI, numa
 * conta do Firebase que é só dela.
 *
 * O que sobe é o mesmo .zip da cópia de segurança (store.js, exportarTudoZip:
 * sem livros e sem pacotes), trancado com AES-GCM de 256 bits pela WebCrypto.
 * A chave nasce neste aparelho, fica no IndexedDB (num banco à parte, para
 * nunca entrar na cópia) e aparece para ela como QR e como código de
 * recuperação, para imprimir. A chave NUNCA vai para o servidor: o Firestore
 * guarda bytes que não abre, mais o tamanho, a hora e o nome do aparelho.
 *
 * Fala com o Firebase pela API REST (login por e-mail e senha no Identity
 * Toolkit, documentos no Firestore), sem o SDK: a fase 0 só sobe e baixa uma
 * cópia, e o SDK inteiro pesa mais que o aplicativo. A configuração web do
 * projeto não é segredo (ela vai em todo site que usa Firebase): quem protege
 * os dados são as regras do Firestore (firestore.rules, na raiz) e a cifra.
 *
 * Caminho na nuvem, tudo embaixo de usuarios/{uid}:
 *   estado/copia             { atual, anterior, quando }  qual cópia vale
 *   copias/{id}              { iv, bytes, partes, quando, aparelho, versao }
 *   copias/{id}/partes/{n}   { dados: bytes cifrados }   até 768 KiB cada
 *   config/leitores          { uids: [...] }   quem mais pode LER (D7)
 *   registros/{id}           { id, tipo, atualizadoEm, apagadoEm, aparelho,
 *                              esquema, app, iv, dados }  (N1, fatia 2)
 * A cópia nova sobe inteira com um id novo e só então o ponteiro muda; a de
 * antes vira "anterior" e a mais velha sai. Quem baixa nunca vê metade.
 *
 * Os REGISTROS (fase 1 da nuvem) sobem um a um, da fila `saida` do store.js,
 * que entra na mesma transação de cada gravação dela: os metadados em claro
 * (id, tipo, carimbos, aparelho, esquema) e o conteúdo cifrado com a mesma
 * chave da cópia, rótulo próprio. Uma entrada sai da fila só depois de o
 * commit responder, e só se ainda for a que subiu. Com a nuvem recusando (as
 * regras ainda não publicadas, por exemplo), a fila fica guardada e a tela
 * diz isso; nada trava. O id de aparelho dos registros é o do Store, e a
 * cópia completa passa a levar o mesmo id (aparelhoId) ao lado do rótulo.
 *
 * A cópia automática só começa depois do primeiro envio feito por ela neste
 * aparelho (ou de uma restauração aqui): um aparelho recém-instalado, com a
 * carga inicial, não pode subir por cima da cópia do tablet dela.
 *
 * O celular só lê (D6, parte 1): o aparelho que trouxe a cópia pelo modo
 * celular guarda a marca "só leitura" e nunca escreve na nuvem; o commit, que
 * é a única porta de escrita, recusa.
 */
(function (root) {
  'use strict';

  /* Decisoes\firebase_web_config.json, recebida em 28/10/2026. Pública por
   * natureza; o que ela identifica é o projeto, não a dona. */
  var CONFIGURACAO = {
    apiKey: 'AIzaSyB1p6CvU0gw-MUjKjJhEVZ4wEioje73DOI',
    projectId: 'nw-apoio-educacional'
  };
  var PONTAS = {
    identidade: 'https://identitytoolkit.googleapis.com/v1',
    token: 'https://securetoken.googleapis.com/v1',
    firestore: 'https://firestore.googleapis.com/v1'
  };
  /* O emulador (Firebase Emulator Suite) entra por aqui, antes de este arquivo
   * carregar: window.NUVEM_EMULADOR = { auth: 'http://127.0.0.1:9099',
   * firestore: 'http://127.0.0.1:8080', projectId: 'demo-x' }. */
  if (root.NUVEM_EMULADOR) {
    PONTAS.identidade = root.NUVEM_EMULADOR.auth + '/identitytoolkit.googleapis.com/v1';
    PONTAS.token = root.NUVEM_EMULADOR.auth + '/securetoken.googleapis.com/v1';
    PONTAS.firestore = root.NUVEM_EMULADOR.firestore + '/v1';
    if (root.NUVEM_EMULADOR.projectId) CONFIGURACAO.projectId = root.NUVEM_EMULADOR.projectId;
  }

  /* Um documento do Firestore cabe 1 MiB com tudo (nome, campos, codificação).
   * 768 KiB de bytes cifrados por parte deixa folga. Um commit aceita 10 MiB;
   * oito partes (6 MiB de bytes, 8 MiB em base64) ficam abaixo disso. */
  var TETO_PARTE = 768 * 1024;
  var PARTES_POR_PEDIDO = 8;
  var ROTULO_CIFRA = 'apoio-educacional-copia:1';
  var ROTULO_REGISTRO = 'apoio-educacional-registro:1';
  var REGISTROS_POR_COMMIT = 200;   // o commit aceita 500 escritas; 200 deixa folga de tamanho
  var ATRASO_ENVIO_REGISTROS = 2500; // depois de uma gravação dela, espera as vizinhas antes de subir
  var NOME_BANCO = 'apoio-nuvem';
  var UM_DIA = 24 * 60 * 60 * 1000;
  var CODIGO_TAMANHO = 56; // 52 letras da chave (256 bits) + 4 de conferência
  var ALFABETO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // sem I, L, O e U: não se confundem com 1 e 0

  // ---------- estado em memória, espelho do banco próprio ----------

  var sessao = null;      // { email, uid, idToken, refreshToken, expiraEm }
  var chaveBruta = null;  // Uint8Array(32)
  var ultimaCopia = null; // { id, quando, bytes, partes, aparelho }
  var automatica = false; // ligada depois do primeiro envio manual ou restauração aqui
  var pendente = false;   // houve gravação local desde a última cópia
  var geracao = 0;        // cresce a cada gravação dela; o envio compara com a do retrato
  var aparelho = null;    // rótulo curto deste aparelho, só para a lista de cópias
  var enviando = null;    // promessa do envio em curso, para não subir duas vezes
  /* A marca "este aparelho só lê" (D6, parte 1): gravada quando ela traz a
   * cópia pelo modo celular. Com ela, nada sobe daqui, nunca: nem ao fechar,
   * nem uma vez por dia, nem pelo toque. Uma cópia do celular cobriria a do
   * tablet com uma mais velha. Guarda também de que conta é a cópia, para
   * buscar a mais nova ao abrir. { desde, uidDona } */
  var marcaSoLeitura = null;
  var travadoNestaAbertura = false; // a tela do celular está à vista, mesmo sem a marca
  /* Os registros (N1, fatia 2): quantos esperam na fila, o último envio e o
   * último erro (o PERMISSION_DENIED das regras ainda não publicadas fica
   * aqui, para Ajustes dizer). Espelhado no banco próprio, chave 'registros'. */
  var registros = { pendentes: 0, quarentena: 0, ultimoEnvio: null, erro: null };
  var enviandoRegistros = null;  // promessa do envio em curso
  var envioAgendado = null;      // o setTimeout do envio depois de uma gravação
  /* "Apagar tudo" DESLIGA A SINCRONIZAÇÃO deste aparelho, o envio e o
   * recebimento, até ela entrar e restaurar de novo (ou mandar a cópia ela
   * mesma), como a fase 0 já desliga a cópia automática: num banco vazio nunca
   * chegam aulas soltas, sem aluno. Espelhado no banco próprio. */
  var sincronizacaoDesligada = false;
  var ouvintes = [];
  var pronto = null;

  // ---------- banco próprio (fora do apoio-educacional, de propósito) ----------

  var bancoAberto = null;
  function abrir() {
    if (bancoAberto) return Promise.resolve(bancoAberto);
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(NOME_BANCO, 1);
      req.onupgradeneeded = function () {
        var b = req.result;
        if (!b.objectStoreNames.contains('estado')) b.createObjectStore('estado');
      };
      req.onsuccess = function () {
        bancoAberto = req.result;
        bancoAberto.onclose = function () { bancoAberto = null; };
        bancoAberto.onversionchange = function () { bancoAberto.close(); bancoAberto = null; };
        resolve(bancoAberto);
      };
      req.onerror = function () { reject(req.error); };
    });
  }
  function lerEstado(chave) {
    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var req = b.transaction('estado', 'readonly').objectStore('estado').get(chave);
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }
  function gravarEstado(chave, valor) {
    return abrir().then(function (b) {
      return new Promise(function (resolve, reject) {
        var t = b.transaction('estado', 'readwrite');
        if (valor === undefined || valor === null) t.objectStore('estado').delete(chave);
        else t.objectStore('estado').put(valor, chave);
        t.oncomplete = function () { resolve(); };
        t.onerror = function () { reject(t.error); };
        t.onabort = function () { reject(t.error || new Error('A gravação foi interrompida.')); };
      });
    });
  }

  function carregarEstado() {
    if (pronto) return pronto;
    pronto = Promise.all([lerEstado('sessao'), lerEstado('chave'), lerEstado('copia'),
      lerEstado('automatica'), lerEstado('pendente'), lerEstado('aparelho'), lerEstado('soLeitura'), lerEstado('registros'),
      lerEstado('sincronizacaoDesligada')]).then(function (v) {
      sincronizacaoDesligada = !!v[8];
      marcaSoLeitura = v[6] || null;
      sessao = v[0] || null;
      chaveBruta = v[1] ? new Uint8Array(v[1]) : null;
      ultimaCopia = v[2] || null;
      automatica = !!v[3];
      pendente = !!v[4];
      aparelho = v[5] || null;
      if (v[7]) registros = { pendentes: 0, quarentena: 0, ultimoEnvio: v[7].ultimoEnvio || null, erro: v[7].erro || null };
      // a fila é do Store; a contagem é lida dele, nunca guardada aqui
      contarFila();
      if (!aparelho) {
        aparelho = rotuloDoAparelho();
        return gravarEstado('aparelho', aparelho);
      }
    }).catch(function () { /* sem IndexedDB: a nuvem fica indisponível e a tela diz */ });
    return pronto;
  }
  /* O id deste aparelho é o do Store (nasce na primeira gravação dela): é o
   * que vai em cada registro e, desde a fatia 2, também no cabeçalho da cópia
   * completa. O `aparelho` daqui é só o rótulo que ela lê ("tablet 7K"). */
  function idDoAparelho() {
    return (root.Store && typeof root.Store.aparelho === 'function' && root.Store.aparelho()) || '';
  }

  function rotuloDoAparelho() {
    var ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
    var tipo = /Mobile/.test(ua) && !/Tablet|SM-T|SM-X/.test(ua) ? 'celular' : 'tablet';
    var sufixo = '';
    var aleatorio = new Uint8Array(2);
    crypto.getRandomValues(aleatorio);
    for (var i = 0; i < 2; i++) sufixo += ALFABETO[aleatorio[i] % 32];
    return tipo + ' ' + sufixo;
  }

  function aoMudar(fn) { ouvintes.push(fn); }
  function avisarOuvintes() {
    ouvintes.forEach(function (fn) { try { fn(); } catch (e) { /* a tela que ouve se vira */ } });
  }

  function disponivel() {
    return typeof indexedDB !== 'undefined' && typeof crypto !== 'undefined' &&
      !!crypto.subtle && typeof fetch === 'function' && typeof TextEncoder !== 'undefined';
  }

  // ---------- pedidos HTTP ----------

  /* As mensagens do Firebase são códigos em inglês; aqui viram frase dela. */
  var FRASES = {
    /* O aplicativo só ENTRA: as contas nascem no console do Firebase, pela
     * mão do dono, e aqui não há caminho que crie conta. Em produção o
     * Firebase costuma responder INVALID_LOGIN_CREDENTIALS sem dizer se o
     * e-mail existe. */
    INVALID_LOGIN_CREDENTIALS: 'E-mail ou senha não conferem. Se a conta ainda não existe, peça ao Rômulo para criá-la.',
    INVALID_PASSWORD: 'E-mail ou senha não conferem.',
    EMAIL_NOT_FOUND: 'Esta conta não existe; peça ao Rômulo para criá-la.',
    INVALID_EMAIL: 'Este e-mail não está escrito certo.',
    MISSING_PASSWORD: 'Falta a senha.',
    MISSING_EMAIL: 'Falta o e-mail.',
    USER_DISABLED: 'Esta conta está desativada.',
    TOO_MANY_ATTEMPTS_TRY_LATER: 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.',
    WEAK_PASSWORD: 'A senha nova precisa ter pelo menos 6 caracteres.',
    CREDENTIAL_TOO_OLD_LOGIN_AGAIN: 'Saia e entre de novo antes de trocar a senha.',
    TOKEN_EXPIRED: 'A entrada venceu. Entre de novo.',
    INVALID_REFRESH_TOKEN: 'A entrada venceu. Entre de novo.',
    USER_NOT_FOUND: 'A entrada venceu. Entre de novo.',
    PERMISSION_DENIED: 'A nuvem recusou: esta conta não pode mexer neste lugar.',
    NOT_FOUND: 'Não há cópia na nuvem para esta conta.',
    FAILED_PRECONDITION: 'Outro aparelho gravou antes; vou receber e tentar de novo.',
    ALREADY_EXISTS: 'Outro aparelho gravou antes; vou receber e tentar de novo.',
    INVALID_ARGUMENT: 'A nuvem recusou a forma de um registro.',
    RESOURCE_EXHAUSTED: 'A cota da nuvem acabou por hoje; tento de novo mais tarde.',
    UNAVAILABLE: 'A nuvem está indisponível agora; tento de novo mais tarde.',
    DEADLINE_EXCEEDED: 'A nuvem demorou demais; tento de novo mais tarde.',
    INTERNAL: 'A nuvem falhou por dentro; tento de novo mais tarde.',
    UNAUTHENTICATED: 'A entrada venceu. Entre de novo.'
  };
  /* Nenhum erro cru chega à tela: o código fica em e.codigo, para o
   * diagnóstico, e a frase é sempre dela. */
  function erro(codigo, detalhe) {
    var chave = String(codigo || '').split(/[\s:]/)[0];
    var e = new Error(FRASES[chave] || 'A nuvem não respondeu como esperado. Tento de novo daqui a pouco.');
    e.codigo = chave;
    e.detalhe = detalhe || null;
    return e;
  }
  function semRede() {
    var e = new Error('Sem internet agora. A cópia fica para quando houver sinal.');
    e.codigo = 'SEM_REDE';
    return e;
  }

  function pedir(url, opcoes) {
    opcoes = opcoes || {};
    var cabecalhos = Object.assign({}, opcoes.cabecalhos || {});
    var corpo = opcoes.corpo;
    if (corpo !== undefined && typeof corpo !== 'string') {
      corpo = JSON.stringify(corpo);
      cabecalhos['Content-Type'] = 'application/json';
    }
    var p;
    try {
      p = fetch(url, { method: opcoes.metodo || (corpo !== undefined ? 'POST' : 'GET'), headers: cabecalhos, body: corpo });
    } catch (e) { return Promise.reject(semRede()); }
    return p.then(function (r) {
      return r.text().then(function (texto) {
        var json = null;
        try { json = texto ? JSON.parse(texto) : null; } catch (e) { json = null; }
        if (r.ok) return json;
        var codigo = (json && json.error && (json.error.message || json.error.status)) || ('HTTP ' + r.status);
        var e = erro(codigo, json);
        e.status = r.status;
        if (r.status === 404) e.codigo = 'NOT_FOUND';
        if (r.status === 403) e.codigo = 'PERMISSION_DENIED';
        /* A precondição do commit (fatia 3): outro aparelho ou outra aba escreveu
         * antes (FAILED_PRECONDITION), ou o documento já existe quando a escrita
         * exigia que não (ALREADY_EXISTS, 409 em produção). Os dois têm a mesma
         * saída: receber e decidir. */
        var statusNuvem = json && json.error && json.error.status;
        if (statusNuvem === 'FAILED_PRECONDITION' || statusNuvem === 'ALREADY_EXISTS' || r.status === 409) e.codigo = 'FAILED_PRECONDITION';
        else if (statusNuvem && FRASES[statusNuvem]) { e.codigo = statusNuvem; e.message = FRASES[statusNuvem]; }
        throw e;
      });
    }, function () { throw semRede(); });
  }

  // ---------- entrada por e-mail e senha ----------

  function guardarSessao(resposta) {
    var vida = Number(resposta.expiresIn || resposta.expires_in || 3600) * 1000;
    sessao = {
      email: resposta.email || (sessao && sessao.email) || '',
      uid: resposta.localId || resposta.user_id || (sessao && sessao.uid) || '',
      idToken: resposta.idToken || resposta.id_token,
      refreshToken: resposta.refreshToken || resposta.refresh_token,
      expiraEm: Date.now() + vida
    };
    return gravarEstado('sessao', sessao).then(function () { avisarOuvintes(); return sessao; });
  }

  function entrar(email, senha) {
    email = String(email || '').trim();
    if (!email) return Promise.reject(erro('MISSING_EMAIL'));
    if (!senha) return Promise.reject(erro('MISSING_PASSWORD'));
    return carregarEstado().then(function () {
      return pedir(PONTAS.identidade + '/accounts:signInWithPassword?key=' + CONFIGURACAO.apiKey, {
        corpo: { email: email, password: senha, returnSecureToken: true }
      });
    }).then(guardarSessao).then(function (s) { return { email: s.email, uid: s.uid }; });
  }

  function sair() {
    sessao = null;
    return gravarEstado('sessao', null).then(avisarOuvintes);
  }

  /* O Firebase manda o e-mail com o link de redefinição; o aplicativo só pede.
   * Em produção o Firebase pode não dizer se o e-mail existe (proteção contra
   * enumeração), então a resposta para ela é sempre a mesma. */
  function esqueciASenha(email) {
    email = String(email || '').trim();
    if (!email) return Promise.reject(erro('MISSING_EMAIL'));
    return pedir(PONTAS.identidade + '/accounts:sendOobCode?key=' + CONFIGURACAO.apiKey, {
      corpo: { requestType: 'PASSWORD_RESET', email: email }
    }).then(function () { return true; }, function (e) {
      if (e.codigo === 'EMAIL_NOT_FOUND') return true;
      throw e;
    });
  }

  /* Trocar a senha exige entrada recente: entra de novo com a atual e troca. */
  function trocarSenha(senhaAtual, senhaNova) {
    if (!sessao) return Promise.reject(erro('TOKEN_EXPIRED'));
    if (!senhaAtual) return Promise.reject(erro('MISSING_PASSWORD'));
    if (!senhaNova || String(senhaNova).length < 6) return Promise.reject(erro('WEAK_PASSWORD'));
    var email = sessao.email;
    return pedir(PONTAS.identidade + '/accounts:signInWithPassword?key=' + CONFIGURACAO.apiKey, {
      corpo: { email: email, password: senhaAtual, returnSecureToken: true }
    }).then(function (r) {
      return pedir(PONTAS.identidade + '/accounts:update?key=' + CONFIGURACAO.apiKey, {
        corpo: { idToken: r.idToken, password: senhaNova, returnSecureToken: true }
      });
    }).then(function (r) {
      r.email = r.email || email;
      return guardarSessao(r);
    }).then(function () { return true; });
  }

  /* O token de entrada dura uma hora; o de renovação, até ela sair. Renova
   * cinco minutos antes de vencer. Renovação recusada derruba a sessão: a
   * conta foi desativada ou a senha mudou noutro aparelho. */
  function tokenValido() {
    if (!sessao) return Promise.reject(erro('TOKEN_EXPIRED'));
    if (sessao.idToken && sessao.expiraEm - Date.now() > 5 * 60 * 1000) return Promise.resolve(sessao.idToken);
    var corpo = 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(sessao.refreshToken || '');
    return pedir(PONTAS.token + '/token?key=' + CONFIGURACAO.apiKey, {
      corpo: corpo, cabecalhos: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).then(guardarSessao, function (e) {
      if (e.codigo === 'SEM_REDE') throw e;
      return sair().then(function () { throw erro('TOKEN_EXPIRED'); });
    }).then(function (s) { return s.idToken; });
  }

  // ---------- a chave: bytes, código de recuperação e QR ----------

  function paraBase32(bytes) {
    var saida = '', bits = 0, valor = 0;
    for (var i = 0; i < bytes.length; i++) {
      valor = (valor << 8) | bytes[i];
      bits += 8;
      while (bits >= 5) {
        saida += ALFABETO[(valor >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    if (bits > 0) saida += ALFABETO[(valor << (5 - bits)) & 31];
    return saida;
  }
  function deBase32(texto) {
    var bytes = [], bits = 0, valor = 0;
    for (var i = 0; i < texto.length; i++) {
      var n = ALFABETO.indexOf(texto[i]);
      if (n < 0) return null;
      valor = (valor << 5) | n;
      bits += 5;
      if (bits >= 8) {
        bytes.push((valor >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }
    return new Uint8Array(bytes);
  }
  function digesto(bytes) {
    return crypto.subtle.digest('SHA-256', bytes).then(function (d) { return new Uint8Array(d); });
  }
  /* Tira espaços e traços, põe em maiúsculas e aceita as confusões comuns de
   * leitura (O por 0, I e L por 1, U por V). */
  function normalizarCodigo(texto) {
    return String(texto || '').toUpperCase().replace(/[^0-9A-Z]/g, '')
      .replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V');
  }
  function formatarCodigo(codigo) {
    return (codigo.match(/.{1,4}/g) || []).join(' ');
  }
  /* 32 bytes viram 52 letras; a conferência são 20 bits do SHA-256 da chave,
   * em 4 letras. Um erro de digitação é pego antes de tentar decifrar. */
  function codigoDaChave(bytes) {
    return digesto(bytes).then(function (d) {
      return paraBase32(bytes).slice(0, 52) + paraBase32(d.subarray(0, 3)).slice(0, 4);
    });
  }
  function chaveDoCodigo(texto) {
    var codigo = normalizarCodigo(texto);
    var invalida = function (frase) { return Object.assign(new Error(frase), { invalida: true }); };
    if (codigo.length !== CODIGO_TAMANHO) {
      return Promise.reject(invalida('O código tem ' + CODIGO_TAMANHO + ' letras e números; este tem ' + codigo.length + '.'));
    }
    var bytes = deBase32(codigo.slice(0, 52) + '000');
    if (!bytes || bytes.length < 32) return Promise.reject(invalida('O código não é de uma chave.'));
    bytes = bytes.subarray(0, 32);
    return codigoDaChave(bytes).then(function (esperado) {
      if (esperado !== codigo) throw invalida('O código tem alguma letra trocada. Confira com o papel ou leia o QR.');
      return bytes;
    });
  }
  function gerarChave() {
    var bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return bytes;
  }
  function garantirChave() {
    return carregarEstado().then(function () {
      if (chaveBruta) return chaveBruta;
      chaveBruta = gerarChave();
      return gravarEstado('chave', chaveBruta).then(function () { avisarOuvintes(); return chaveBruta; });
    });
  }
  function temChave() { return !!chaveBruta; }
  /* O QR leva também o uid da dona, para o aparelho que lê saber de que conta
   * baixar (o observador do D7 entra com outra conta). */
  function verChave() {
    return garantirChave().then(codigoDaChave).then(function (codigo) {
      return { codigo: codigo, formatado: formatarCodigo(codigo),
        qr: 'APOIO1:' + ((sessao && sessao.uid) || '') + ':' + codigo };
    });
  }
  /* O uid do Firebase é só letras, números, traço e sublinhado; outra coisa
   * no lugar dele (barra, interrogação) viraria pedaço de caminho ou de
   * consulta, e o QR é recusado. */
  function lerQr(texto) {
    var m = /^APOIO1:([A-Za-z0-9_-]{0,128}):([0-9A-Za-z]+)$/.exec(String(texto || '').trim());
    if (!m) return null;
    return { uid: m[1], codigo: m[2].toUpperCase() };
  }
  function importarChave(texto) {
    var lido = lerQr(texto);
    return chaveDoCodigo(lido ? lido.codigo : texto).then(function (bytes) {
      chaveBruta = bytes;
      return gravarEstado('chave', chaveBruta);
    }).then(function () { avisarOuvintes(); return true; });
  }

  // ---------- cifra ----------

  function chaveCripto(bytes, usos) {
    return crypto.subtle.importKey('raw', bytes, { name: 'AES-GCM' }, false, usos);
  }
  function cifrar(bytes) {
    var iv = new Uint8Array(12);
    crypto.getRandomValues(iv);
    return chaveCripto(chaveBruta, ['encrypt']).then(function (k) {
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv, additionalData: new TextEncoder().encode(ROTULO_CIFRA) }, k, bytes);
    }).then(function (saida) { return { iv: iv, dados: new Uint8Array(saida) }; });
  }
  /* O GCM não separa chave errada de parte adulterada: a frase depende de
   * quem mandou a chave. Com código digitado, o provável é o código; com a
   * chave do aparelho, a cópia está danificada ou é de outra chave. */
  function decifrar(iv, dados, bytesDaChave) {
    return chaveCripto(bytesDaChave || chaveBruta, ['decrypt']).then(function (k) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv, additionalData: new TextEncoder().encode(ROTULO_CIFRA) }, k, dados);
    }).then(function (saida) { return new Uint8Array(saida); }, function () {
      throw Object.assign(new Error(bytesDaChave
        ? 'A chave não abre esta cópia. Confira o código ou leia o QR de novo.'
        : 'Esta cópia está danificada ou foi feita com outra chave, não a deste aparelho. Se tiver o papel dela, digite o código.'),
      { chaveErrada: true });
    });
  }

  function paraBase64(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i += 0x8000) {
      s += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + 0x8000, bytes.length)));
    }
    return btoa(s);
  }
  function deBase64(texto) {
    var s = atob(String(texto || '').replace(/-/g, '+').replace(/_/g, '/'));
    var bytes = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
    return bytes;
  }

  // ---------- Firestore pela API REST ----------

  function raizDocumentos() {
    return 'projects/' + CONFIGURACAO.projectId + '/databases/(default)/documents';
  }
  function nomeDoc(uid, relativo) { return raizDocumentos() + '/usuarios/' + uid + '/' + relativo; }
  function urlDoc(nome) { return PONTAS.firestore + '/' + nome; }

  /* Só os tipos que a fase 0 usa. */
  function campos(obj) {
    var saida = {};
    Object.keys(obj).forEach(function (k) {
      var v = obj[k];
      if (v === null || v === undefined) return;
      if (v instanceof Uint8Array) saida[k] = { bytesValue: paraBase64(v) };
      else if (typeof v === 'number') saida[k] = { integerValue: String(Math.round(v)) };
      else if (typeof v === 'boolean') saida[k] = { booleanValue: v };
      else if (Array.isArray(v)) saida[k] = { arrayValue: { values: v.map(function (x) { return { stringValue: String(x) }; }) } };
      else saida[k] = { stringValue: String(v) };
    });
    return saida;
  }
  function valores(fields) {
    var saida = {};
    Object.keys(fields || {}).forEach(function (k) {
      var v = fields[k];
      if ('bytesValue' in v) saida[k] = deBase64(v.bytesValue);
      else if ('integerValue' in v) saida[k] = Number(v.integerValue);
      else if ('booleanValue' in v) saida[k] = !!v.booleanValue;
      else if ('arrayValue' in v) saida[k] = ((v.arrayValue && v.arrayValue.values) || []).map(function (x) { return x.stringValue; });
      else if ('stringValue' in v) saida[k] = v.stringValue;
      else if ('timestampValue' in v) saida[k] = v.timestampValue; // servidorEm (fatia 3)
      else saida[k] = null;
    });
    return saida;
  }

  function comToken(fazer) {
    return tokenValido().then(function (token) { return fazer({ Authorization: 'Bearer ' + token }); });
  }
  /* null quando o documento não existe; o resto dos erros sobe. */
  function lerDoc(nome) {
    return comToken(function (cab) {
      return pedir(urlDoc(nome), { cabecalhos: cab }).then(function (d) { return d ? valores(d.fields) : null; }, function (e) {
        if (e.codigo === 'NOT_FOUND') return null;
        throw e;
      });
    });
  }
  /* TODA escrita na nuvem passa pelo commit, e o aparelho que só lê não
   * escreve: a cópia, a rotação e a lista de leitores ficam todas aqui atrás. */
  function podeEnviar() { return !marcaSoLeitura && !travadoNestaAbertura; }
  function recusaSoLeitura() {
    return Object.assign(new Error('Este aparelho só lê: nada sobe daqui para a nuvem.'), { codigo: 'SO_LEITURA' });
  }
  function commit(escritas) {
    if (!podeEnviar()) return Promise.reject(recusaSoLeitura());
    return comToken(function (cab) {
      return pedir(urlDoc(raizDocumentos()) + ':commit', { cabecalhos: cab, corpo: { writes: escritas } });
    });
  }
  function gravacao(nome, obj) { return { update: { name: nome, fields: campos(obj) } }; }
  /* A escrita de um registro (fatia 3): o servidor carimba `servidorEm` com a
   * hora DELE (é o carimbo que ordena o recebimento), e a precondição
   * `currentDocument.updateTime` recusa a escrita se outro aparelho ou outra
   * aba gravou depois do que este aparelho viu por último; sem carimbo
   * conhecido, sem precondição (o primeiro envio do registro). */
  function gravacaoCarimbada(nome, obj, precondicao) {
    var w = { update: { name: nome, fields: campos(obj) },
      updateTransforms: [{ fieldPath: 'servidorEm', setToServerValue: 'REQUEST_TIME' }] };
    if (precondicao && precondicao.updateTime) w.currentDocument = { updateTime: precondicao.updateTime };
    else if (precondicao && precondicao.exists === false) w.currentDocument = { exists: false };
    return w;
  }
  function remocao(nome) { return { delete: nome }; }

  // ---------- a cópia: subir ----------

  function idNovo() {
    var r = new Uint8Array(4);
    crypto.getRandomValues(r);
    return 'c' + Date.now().toString(36) + paraBase32(r).slice(0, 6).toLowerCase();
  }

  /* As duas cópias apontadas e o cabeçalho de cada uma. Cabeçalho antigo sem o
   * campo `conteudo` conta como cópia com conteúdo: o lado seguro. */
  function copiasApontadas(uid) {
    return lerDoc(nomeDoc(uid, 'estado/copia')).then(function (ponteiro) {
      var ids = ponteiro ? [ponteiro.atual, ponteiro.anterior].filter(Boolean) : [];
      return Promise.all(ids.map(function (id) {
        return lerDoc(nomeDoc(uid, 'copias/' + id)).then(function (meta) {
          return meta ? { id: id, meta: meta, conteudo: meta.conteudo !== false } : null;
        });
      })).then(function (lista) { return lista.filter(Boolean); });
    });
  }

  /* blob: o .zip da cópia. info.motivo: 'ela', 'fechar' ou 'diaria'.
   * info.conteudo: false quando o banco está vazio ou é só a carga inicial.
   *
   * A AUTOMÁTICA NUNCA SOBE UM BANCO SEM CONTEÚDO POR CIMA DE UMA CÓPIA COM
   * CONTEÚDO, e nunca cria chave: depois de um "Apagar tudo", ou num aparelho
   * recém-instalado, o fechar não pode trocar a cópia boa pela vazia. Quando
   * é ela quem manda, a tela já perguntou. */
  function enviarCopia(blob, info) {
    if (!podeEnviar()) return Promise.reject(recusaSoLeitura());
    if (enviando) return enviando;
    info = info || {};
    var conteudo = info.conteudo !== false;
    var automatica_ = info.motivo && info.motivo !== 'ela';
    var apontadas = [];
    /* A geração do RETRATO que sobe (a tela lê antes de montar o zip e passa
     * em info.geracao); sem ela, a de agora. Uma gravação durante o envio
     * muda a geração, e aí a cópia que subiu já não é a do aparelho. */
    var geracaoDoRetrato = typeof info.geracao === 'number' ? info.geracao : geracao;
    enviando = carregarEstado().then(function () {
      if (!sessao) throw erro('TOKEN_EXPIRED');
      if (automatica_ && !chaveBruta) throw Object.assign(new Error('A cópia automática não cria chave.'), { semChave: true });
      return copiasApontadas(sessao.uid);
    }).then(function (lista) {
      apontadas = lista;
      if (automatica_ && !conteudo && apontadas.some(function (c) { return c.conteudo; })) {
        return null; // fica a cópia com conteúdo; nada sobe
      }
      return garantirChave().then(function () { return blob.arrayBuffer(); }).then(function (buf) {
        return cifrar(new Uint8Array(buf));
      });
    }).then(function (cifrado) {
      if (!cifrado) return { pulada: true };
      var uid = sessao.uid;
      var id = idNovo();
      var partes = [];
      for (var i = 0; i < cifrado.dados.length; i += TETO_PARTE) {
        partes.push(cifrado.dados.subarray(i, Math.min(i + TETO_PARTE, cifrado.dados.length)));
      }
      if (!partes.length) partes.push(new Uint8Array(0));
      var quando = new Date().toISOString();
      var meta = { formato: 'apoio-educacional-copia', versao: 1, iv: cifrado.iv, bytes: cifrado.dados.length,
        partes: partes.length, quando: quando, aparelho: aparelho || 'aparelho', aparelhoId: idDoAparelho(),
        motivo: info.motivo || 'ela', app: info.versaoApp || '', conteudo: conteudo };
      var fila = Promise.resolve();
      for (var p = 0; p < partes.length; p += PARTES_POR_PEDIDO) {
        (function (inicio) {
          fila = fila.then(function () {
            var escritas = [];
            for (var n = inicio; n < Math.min(inicio + PARTES_POR_PEDIDO, partes.length); n++) {
              escritas.push(gravacao(nomeDoc(uid, 'copias/' + id + '/partes/' + n), { dados: partes[n], n: n }));
            }
            return commit(escritas);
          });
        })(p);
      }
      return fila.then(function () {
        /* A rotação: a nova vira atual; a anterior é SEMPRE a mais nova das
         * apontadas que tem conteúdo (só sem nenhuma com conteúdo é a que
         * estava como atual), e o resto sai. Vale em todo envio, tenha a nova
         * conteúdo ou não: com atual vazia e anterior boa, a próxima com
         * conteúdo mantém a boa e tira a vazia. A nuvem nunca apaga a última
         * cópia com conteúdo só pela contagem. */
        var anterior = apontadas.filter(function (c) { return c.conteudo; })[0] || apontadas[0] || null;
        var saindo = apontadas.filter(function (c) { return !anterior || c.id !== anterior.id; });
        var escritas = [
          gravacao(nomeDoc(uid, 'copias/' + id), meta),
          gravacao(nomeDoc(uid, 'estado/copia'), { atual: id, anterior: anterior ? anterior.id : '', quando: quando })
        ];
        return commit(escritas).then(function () {
          /* A que sai, sai depois, e sem derrubar o envio se falhar: na
           * próxima subida ela sai de novo, pelo mesmo caminho. */
          return saindo.reduce(function (p, c) {
            return p.then(function () { return apagarCopia(uid, c.id).catch(function () { /* fica para a próxima */ }); });
          }, Promise.resolve());
        });
      }).then(function () {
        ultimaCopia = { id: id, quando: quando, bytes: meta.bytes, partes: meta.partes, aparelho: meta.aparelho };
        // o que ela gravou DURANTE o envio não está nesta cópia: continua pendente
        pendente = geracao !== geracaoDoRetrato;
        automatica = true;
        // o envio feito por ela religa a sincronização que o "Apagar tudo" desligou
        var religar = info.motivo === 'ela' ? religarSincronizacao() : Promise.resolve();
        return Promise.all([gravarEstado('copia', ultimaCopia), gravarEstado('pendente', pendente), gravarEstado('automatica', true), religar]);
      }).then(function () { return ultimaCopia; });
    });
    var limpar = function () { enviando = null; avisarOuvintes(); };
    enviando.then(limpar, limpar);
    return enviando;
  }

  function apagarCopia(uid, id) {
    return lerDoc(nomeDoc(uid, 'copias/' + id)).then(function (meta) {
      var escritas = [remocao(nomeDoc(uid, 'copias/' + id))];
      var n = meta ? Number(meta.partes) || 0 : 0;
      for (var i = 0; i < n; i++) escritas.push(remocao(nomeDoc(uid, 'copias/' + id + '/partes/' + i)));
      return commit(escritas);
    });
  }

  // ---------- a cópia: listar e baixar ----------

  /* uidDona: a conta de quem é a cópia; sem ele, a própria. */
  function listarCopias(uidDona) {
    return carregarEstado().then(function () {
      if (!sessao) throw erro('TOKEN_EXPIRED');
      var uid = uidDona || sessao.uid;
      return lerDoc(nomeDoc(uid, 'estado/copia')).then(function (ponteiro) {
        if (!ponteiro) return [];
        var ids = [ponteiro.atual, ponteiro.anterior].filter(Boolean);
        return Promise.all(ids.map(function (id) {
          return lerDoc(nomeDoc(uid, 'copias/' + id)).then(function (meta) {
            if (!meta) return null;
            return { id: id, uid: uid, quando: meta.quando, bytes: meta.bytes, partes: meta.partes,
              aparelho: meta.aparelho, conteudo: meta.conteudo !== false,
              papel: id === ponteiro.atual ? 'atual' : 'anterior' };
          });
        }));
      }).then(function (lista) { return lista.filter(Boolean); });
    });
  }

  /* Devolve o .zip decifrado, como Blob. Com `codigo`, decifra com a chave
   * desse código e, abrindo, guarda essa chave aqui (é a restauração num
   * aparelho novo). */
  function baixarCopia(uidDona, id, codigo) {
    var uid, meta, bytesDaChave = null;
    return carregarEstado().then(function () {
      if (!sessao) throw erro('TOKEN_EXPIRED');
      uid = uidDona || sessao.uid;
      if (codigo) {
        var lido = lerQr(codigo);
        return chaveDoCodigo(lido ? lido.codigo : codigo).then(function (b) { bytesDaChave = b; });
      }
      if (!chaveBruta) throw Object.assign(new Error('Sem a chave da cópia não dá para abrir. Leia o QR ou digite o código.'), { semChave: true });
    }).then(function () {
      return lerDoc(nomeDoc(uid, 'copias/' + id));
    }).then(function (m) {
      meta = m;
      if (!meta || meta.formato !== 'apoio-educacional-copia') throw erro('NOT_FOUND');
      var pedidos = [];
      for (var n = 0; n < Number(meta.partes); n++) pedidos.push(lerDoc(nomeDoc(uid, 'copias/' + id + '/partes/' + n)));
      return Promise.all(pedidos);
    }).then(function (partes) {
      var total = 0;
      partes.forEach(function (p) { if (!p || !p.dados) throw erro('NOT_FOUND'); total += p.dados.length; });
      if (total !== Number(meta.bytes)) throw new Error('A cópia na nuvem está incompleta. Tente de novo mais tarde.');
      var juntos = new Uint8Array(total), pos = 0;
      partes.forEach(function (p) { juntos.set(p.dados, pos); pos += p.dados.length; });
      return decifrar(meta.iv, juntos, bytesDaChave);
    }).then(function (claro) {
      var depois = bytesDaChave ? gravarEstado('chave', bytesDaChave).then(function () { chaveBruta = bytesDaChave; }) : Promise.resolve();
      return depois.then(function () { return new Blob([claro], { type: 'application/zip' }); });
    });
  }

  /* Depois de restaurar aqui, este aparelho passa a ser dono da cópia. Menos
   * o que só lê (opcoes.soLeitura, a restauração pelo modo celular): esse
   * nunca é dono, e a automática fica desligada nele. */
  function restaurou(copia, opcoes) {
    var soLe = !!(opcoes && opcoes.soLeitura) || !!marcaSoLeitura;
    ultimaCopia = { id: copia.id, quando: copia.quando, bytes: copia.bytes, partes: copia.partes, aparelho: copia.aparelho };
    pendente = false;
    automatica = !soLe;
    var gravar = [gravarEstado('copia', ultimaCopia), gravarEstado('pendente', false), gravarEstado('automatica', automatica), religarSincronizacao()];
    if (soLe && !marcaSoLeitura) gravar.push(marcarSoLeitura(copia.uid));
    return Promise.all(gravar).then(avisarOuvintes);
  }

  /* Grava a marca ANTES de os dados chegarem (quem chama faz isso antes de
   * importar): se a página morrer no meio, o aparelho já se sabe só leitura. */
  function marcarSoLeitura(uidDona) {
    marcaSoLeitura = { desde: new Date().toISOString(), uidDona: String(uidDona || (sessao && sessao.uid) || '') };
    automatica = false;
    return Promise.all([gravarEstado('soLeitura', marcaSoLeitura), gravarEstado('automatica', false)]);
  }
  /* Desfazer a marca (o tablet que foi marcado por engano): daqui em diante
   * este aparelho é dono da cópia, e a automática liga. Quem chama já
   * perguntou, e só com a tela larga. */
  function desmarcarSoLeitura() {
    marcaSoLeitura = null;
    automatica = true;
    return Promise.all([gravarEstado('soLeitura', null), gravarEstado('automatica', true)]).then(avisarOuvintes);
  }
  /* A tela do celular à vista sem a marca (aparelho que ainda não trouxe a
   * cópia, ou o tablet numa janela estreita): nada sobe enquanto ela estiver. */
  function travarEnvio(ligar) { travadoNestaAbertura = !!ligar; }

  // ---------- leitores (o aparelho observador, D7) ----------

  function leitores() {
    return carregarEstado().then(function () {
      if (!sessao) throw erro('TOKEN_EXPIRED');
      return lerDoc(nomeDoc(sessao.uid, 'config/leitores'));
    }).then(function (d) { return (d && d.uids) || []; });
  }
  function gravarLeitores(uids) {
    return commit([gravacao(nomeDoc(sessao.uid, 'config/leitores'), { uids: uids })]).then(function () { return uids; });
  }
  function permitirLeitor(uid) {
    uid = String(uid || '').trim();
    if (!/^[A-Za-z0-9_-]{6,128}$/.test(uid)) return Promise.reject(Object.assign(new Error('Este código de conta não parece certo.'), { invalida: true }));
    return leitores().then(function (uids) {
      if (uids.indexOf(uid) >= 0) return uids;
      return gravarLeitores(uids.concat([uid]));
    });
  }
  function tirarLeitor(uid) {
    return leitores().then(function (uids) {
      return gravarLeitores(uids.filter(function (u) { return u !== uid; }));
    });
  }

  // ---------- cópia automática ----------

  /* "Apagar tudo" desliga a automática neste aparelho: o banco vazio nunca
   * sobe sozinho; ela religa no próximo envio dela ou numa restauração. */
  function desligarAutomatica() {
    automatica = false;
    sincronizacaoDesligada = true;
    return Promise.all([gravarEstado('automatica', false), gravarEstado('sincronizacaoDesligada', true)]).then(avisarOuvintes, avisarOuvintes);
  }
  function religarSincronizacao() {
    if (!sincronizacaoDesligada) return Promise.resolve();
    sincronizacaoDesligada = false;
    return gravarEstado('sincronizacaoDesligada', false).catch(function () { /* fica em memória */ });
  }
  /* O aviso chega de dentro do oncomplete da gravação dela (store.js). A
   * memória muda na hora; a gravação do sinal no banco próprio fica para o
   * próximo giro, fora da resposta da gravação dela: a promessa do B3 é que
   * a resposta chega sem nenhuma transação de escrita aberta, e abrir uma
   * aqui, mesmo noutro banco, quebraria a medida. */
  var gravarPendenteAgendado = false;
  function marcarMudanca() {
    /* A geração cresce SEMPRE, mesmo com pendente já ligado: é ela que diz ao
     * envio em curso que houve gravação depois do retrato que está subindo. */
    // os registros da gravação já estão na fila: sobem daqui a pouco, com sinal
    agendarEnvioDeRegistros();
    geracao++;
    if (pendente) return;
    pendente = true;
    if (gravarPendenteAgendado) return;
    gravarPendenteAgendado = true;
    setTimeout(function () {
      gravarPendenteAgendado = false;
      if (!pendente) return;
      gravarEstado('pendente', true).catch(function () { /* fica só em memória; a próxima gravação tenta de novo */ });
    }, 0);
  }
  function online() {
    return !(typeof navigator !== 'undefined' && navigator.onLine === false);
  }
  /* Ao fechar com sinal: há conta, chave, a automática já começou e houve
   * mudança desde a última cópia. */
  function copiaAutomaticaDevida() {
    return !!(podeEnviar() && sessao && chaveBruta && automatica && pendente && online() && !enviando);
  }
  /* Uma vez por dia, ao abrir: o mesmo, mas só se a última cópia tem mais de
   * um dia (a de fechar pode ter falhado ontem sem ela ver). */
  function copiaDiariaDevida() {
    if (!copiaAutomaticaDevida()) return false;
    if (!ultimaCopia || !ultimaCopia.quando) return true;
    var ha = Date.now() - new Date(ultimaCopia.quando).getTime();
    return !(ha >= 0 && ha < UM_DIA);
  }

  // ---------- os registros, um a um (N1, fatia 2) ----------

  function cifrarRegistro(texto) {
    var iv = new Uint8Array(12);
    crypto.getRandomValues(iv);
    return chaveCripto(chaveBruta, ['encrypt']).then(function (k) {
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv, additionalData: new TextEncoder().encode(ROTULO_REGISTRO) }, k, new TextEncoder().encode(texto));
    }).then(function (saida) { return { iv: iv, dados: new Uint8Array(saida) }; });
  }

  /* O documento de um registro: os metadados em claro e o conteúdo cifrado.
   * Lápide não leva conteúdo. */
  function documentoDoRegistro(reg, versaoApp) {
    var campo = { id: reg.id, tipo: reg.tipo, atualizadoEm: reg.atualizadoEm, apagadoEm: reg.apagadoEm || null,
      aparelho: reg.aparelho || idDoAparelho() || 'aparelho', esquema: reg.esquema || 1, app: versaoApp || '' };
    if (reg.apagadoEm || reg.dados === null || reg.dados === undefined) return Promise.resolve(campo);
    return cifrarRegistro(JSON.stringify(reg.dados)).then(function (c) {
      campo.iv = c.iv;
      campo.dados = c.dados;
      return campo;
    });
  }

  function contarFila() {
    if (!root.Store || typeof root.Store.estadoDaFila !== 'function') return Promise.resolve(0);
    return root.Store.estadoDaFila().then(function (e) {
      if (e.pendentes !== registros.pendentes || e.quarentena !== registros.quarentena) {
        registros.pendentes = e.pendentes;
        registros.quarentena = e.quarentena;
        avisarOuvintes();
      }
      return e.pendentes;
    }, function () { return registros.pendentes; });
  }
  function guardarRegistros() {
    return gravarEstado('registros', { ultimoEnvio: registros.ultimoEnvio, erro: registros.erro })
      .catch(function () { /* fica em memória */ });
  }
  /* Há o que subir e tem como: conta, chave, sinal e o aparelho pode escrever.
   * A fila em si não entra aqui: o envio a lê. */
  function registrosDevidos() {
    return !!(podeEnviar() && !sincronizacaoDesligada && sessao && chaveBruta && online());
  }
  function agendarEnvioDeRegistros() {
    // fora da resposta da gravação dela (ver marcarMudanca): nada abre transação ali
    setTimeout(contarFila, 0);
    if (!registrosDevidos()) return;
    if (envioAgendado) clearTimeout(envioAgendado);
    envioAgendado = setTimeout(function () {
      envioAgendado = null;
      enviarRegistros().catch(function () { /* o erro ficou em registros.erro */ });
    }, ATRASO_ENVIO_REGISTROS);
  }
  /* Ao fechar, ao abrir e ao voltar: sobe o que houver, sem esperar. */
  function enviarRegistrosSeDevido(info) {
    if (!registrosDevidos()) return Promise.resolve({ pulado: 'indevido' });
    return enviarRegistros(info);
  }

  /* Sobe a fila em lotes, pelo commit (que recusa no aparelho que só lê).
   * Nunca rejeita: devolve { enviados, erro }, e o erro fica em
   * registros.erro para a tela. Uma entrada sai da fila só depois de o lote
   * dela responder, e só se ainda for a que subiu. */
  function enviarRegistros(info) {
    info = info || {};
    if (enviandoRegistros) return enviandoRegistros;
    var enviados = 0, lotes = 0, emQuarentenaAntes = [];
    enviandoRegistros = carregarEstado().then(function () {
      if (!podeEnviar()) return { pulado: 'so leitura', enviados: 0 };
      if (!sessao) return { pulado: 'sem conta', enviados: 0 };
      if (!chaveBruta) return { pulado: 'sem chave', enviados: 0 };
      if (sincronizacaoDesligada) return { pulado: 'desligada', enviados: 0 };
      if (!online()) throw semRede();
      if (!root.Store || typeof root.Store.registrosDaFila !== 'function') return { pulado: 'sem fila', enviados: 0 };
      var uid = sessao.uid;
      // quem já estava em quarentena ANTES deste envio é quem o envio limpo solta depois (não quem entrou nele agora)
      var quarentenaLida = typeof root.Store.lerFila === 'function'
        ? root.Store.lerFila().then(function (l) { emQuarentenaAntes = (l || []).filter(function (e) { return e.quarentena && !e.retestada; }).map(function (e) { return e.id; }); }, function () {})
        : Promise.resolve();
      /* Um lote inteiro, num commit; o que subiu sai da fila. */
      function subirLote(itens) {
        return Promise.all(itens.map(function (i) { return documentoDoRegistro(i.registro, info.versaoApp); })).then(function (docs) {
          return commit(docs.map(function (d, k) {
            var conhecido = itens[k].registro.nuvem && itens[k].registro.nuvem.updateTime;
            /* A entrada de RESTAURAÇÃO sem carimbo conhecido exige que o documento
             * não exista: se existir, a nuvem tem algo que este aparelho não viu,
             * a precondição falha, o recebimento decide (o mais novo que a cópia
             * vence) e só então se tenta de novo. */
            var precondicao = conhecido ? { updateTime: conhecido } : (itens[k].fila.restauro ? { exists: false } : null);
            return gravacaoCarimbada(nomeDoc(uid, 'registros/' + d.id), d, precondicao);
          }));
        }).then(function (resposta) {
          var resultados = (resposta && resposta.writeResults) || [];
          return root.Store.confirmarEnvio(itens.map(function (i, k) {
            var w = resultados[k] || {};
            var transformado = w.transformResults && w.transformResults[0] && w.transformResults[0].timestampValue;
            return { id: i.fila.id, atualizadoEm: i.fila.atualizadoEm,
              nuvem: { updateTime: w.updateTime || null, servidorEm: transformado || w.updateTime || null } };
          }));
        });
      }
      /* O COMMIT É ATÔMICO: um registro que a regra ou o teto de 1 MiB recuse
       * derrubaria o lote inteiro, para sempre. Quando um lote falha, ele é
       * dividido ao meio até isolar o culpado; o que não é culpa de registro
       * (sem rede, sessão vencida) sobe na hora. Devolve o que subiu e os que
       * ficaram sozinhos sem passar (indefinidos), com o erro. Se a metade de
       * cima falhou inteira, a de baixo é tentada inteira uma vez: as duas
       * falhando inteiras é a nuvem recusando tudo, e não se desce mais. */
      function subir(itens) {
        return subirLote(itens).then(function (n) { return { enviados: n, indefinidos: [], erro: null }; }, function (e) {
          if (!e || e.codigo === 'SEM_REDE' || e.codigo === 'TOKEN_EXPIRED' || e.codigo === 'FAILED_PRECONDITION') throw e;
          if (itens.length === 1) return { enviados: 0, indefinidos: itens, erro: e };
          var meio = Math.ceil(itens.length / 2), a = itens.slice(0, meio), b = itens.slice(meio);
          return subir(a).then(function (r1) {
            if (r1.enviados === 0 && r1.indefinidos.length === a.length && a.length > 1) {
              return subirLote(b).then(function (n) {
                return { enviados: n, indefinidos: r1.indefinidos, erro: r1.erro };
              }, function (e2) {
                if (!e2 || e2.codigo === 'SEM_REDE' || e2.codigo === 'TOKEN_EXPIRED') throw e2;
                throw r1.erro || e2;
              });
            }
            return subir(b).then(function (r2) {
              return { enviados: r1.enviados + r2.enviados, indefinidos: r1.indefinidos.concat(r2.indefinidos), erro: r1.erro || r2.erro };
            });
          });
        });
      }
      var jaCulpados = {}; // quem levou tentativa neste envio não volta ao lote até o próximo envio
      var recebimentos = 0; // quantas vezes a precondição mandou receber antes de insistir
      function proximoLote() {
        return quarentenaLida.then(lerLote);
      }
      function lerLote() {
        return root.Store.registrosDaFila(REGISTROS_POR_COMMIT).then(function (itens) {
          itens = itens.filter(function (i) { return !!i.registro && !jaCulpados[i.fila.id]; });
          if (!itens.length || lotes >= 50) return { enviados: enviados };
          lotes++;
          return subir(itens).then(null, function (e) {
            /* A PRECONDIÇÃO FALHOU: outro aparelho (ou outra aba) gravou algum
             * destes registros depois do que este aparelho viu. Recebe primeiro
             * (a regra do recebimento decide, e anota o carimbo novo), e tenta de
             * novo; na terceira vez a fila fica para o próximo envio. */
            if (e && e.codigo === 'FAILED_PRECONDITION' && recebimentos < 2) {
              recebimentos++;
              return receberRegistros().then(function () { return { enviados: 0, indefinidos: [], erro: null, repetir: true }; });
            }
            throw e;
          }).then(function (r) {
            if (r.repetir) return lerLote();
            enviados += r.enviados;
            if (!r.indefinidos.length) return proximoLote();
            /* Culpa do registro, e não da nuvem: outros do mesmo lote passaram, ou
             * o erro é de forma (INVALID_ARGUMENT). Senão é a nuvem recusando
             * tudo: a fila fica e o erro sobe.
             * RECUSA TOTAL NUNCA CONTA TENTATIVA, seja o lote de 200 ou de 1: um
             * bom que ficou sozinho (por uma queda parcial antes) e vê a nuvem
             * recusar tudo (503, regras ainda não coladas) não pode ir para a
             * quarentena sem culpa. */
            var culpados = r.indefinidos.filter(function (i) {
              return r.enviados > 0 || (r.erro && r.erro.codigo === 'INVALID_ARGUMENT');
            });
            if (!culpados.length) throw r.erro;
            culpados.forEach(function (i) { jaCulpados[i.fila.id] = true; });
            return root.Store.marcarTentativa(culpados.map(function (i) { return i.fila.id; })).then(function () {
              // o lote seguinte lê a fila de novo, sem os culpados deste envio: uma tentativa por envio
              return proximoLote();
            });
          });
        });
      }
      return proximoLote();
    }).then(function (r) {
      if (!r.pulado) {
        registros.erro = null;
        registros.ultimoEnvio = { quando: new Date().toISOString(), enviados: r.enviados };
        guardarRegistros();
        /* Um envio inteiro sem recusa solta a quarentena UMA vez, como reteste:
         * quem foi parar lá por uma queda da nuvem sai no próximo envio; quem
         * a nuvem recusa de verdade volta para a quarentena e fica. */
        if (emQuarentenaAntes.length && typeof root.Store.soltarQuarentena === 'function') {
          return root.Store.soltarQuarentena(emQuarentenaAntes).then(function () { return r; }, function () { return r; });
        }
      }
      return r;
    }, function (e) {
      registros.erro = { codigo: (e && e.codigo) || 'ERRO', quando: new Date().toISOString(), mensagem: (e && e.message) || '' };
      guardarRegistros();
      return { enviados: enviados, erro: registros.erro };
    });
    var limpar = function () { enviandoRegistros = null; contarFila().then(avisarOuvintes, avisarOuvintes); };
    enviandoRegistros.then(limpar, limpar);
    return enviandoRegistros;
  }

  // ---------- o recebimento (N1, fatia 3) ----------

  function decifrarRegistro(iv, dados) {
    return chaveCripto(chaveBruta, ['decrypt']).then(function (k) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv, additionalData: new TextEncoder().encode(ROTULO_REGISTRO) }, k, dados);
    }).then(function (saida) { return JSON.parse(new TextDecoder().decode(new Uint8Array(saida))); });
  }
  var recebendo = null;
  /* Busca no servidor os registros com `servidorEm` depois do cursor deste
   * aparelho, em ordem, decifra e aplica (Store.aplicarRecebidos decide por
   * registro). O celular só leitura também recebe: é leitura na nuvem e a
   * escrita local passa pela trava como a restauração. Nunca rejeita por
   * recusa da nuvem: o erro fica em registros.erroRecebimento. */
  function receberRegistros() {
    if (recebendo) return recebendo;
    var aplicados = 0, lidos = 0, paginas = 0, uidDona;
    recebendo = carregarEstado().then(function () {
      if (!sessao) return { pulado: 'sem conta', aplicados: 0 };
      if (!chaveBruta) return { pulado: 'sem chave', aplicados: 0 };
      if (sincronizacaoDesligada) return { pulado: 'desligada', aplicados: 0 };
      if (!online()) throw semRede();
      if (!root.Store || typeof root.Store.aplicarRecebidos !== 'function') return { pulado: 'sem store', aplicados: 0 };
      uidDona = (marcaSoLeitura && marcaSoLeitura.uidDona) || sessao.uid;
      return root.Store.lerCursor().then(function (cursor) {
        var desde = cursor && cursor.servidorEm ? { servidorEm: cursor.servidorEm, nome: cursor.nome || null } : null;
        /* A consulta: em ordem de (servidorEm, __name__), começando DEPOIS do par
         * do cursor. Só pelo carimbo não dá: os 200 registros de um commit têm o
         * MESMO servidorEm, e uma página que acabasse no meio deles perderia o
         * resto ao pedir "maior que o carimbo". Cursor antigo sem nome (não
         * existe em produção) recomeça no próprio carimbo, inclusivo. */
        function montarConsulta(c) {
          var q = { from: [{ collectionId: 'registros' }],
            orderBy: [{ field: { fieldPath: 'servidorEm' }, direction: 'ASCENDING' }, { field: { fieldPath: '__name__' }, direction: 'ASCENDING' }],
            limit: 300 };
          if (c && c.servidorEm) q.startAt = { values: valoresDoCursor(c), before: !c.nome };
          return q;
        }
        function valoresDoCursor(c) {
          var v = [{ timestampValue: c.servidorEm }];
          if (c.nome) v.push({ referenceValue: c.nome });
          return v;
        }
        function pagina() {
          if (paginas++ >= 50) return { aplicados: aplicados, lidos: lidos };
          return comToken(function (cab) {
            return pedir(urlDoc(raizDocumentos() + '/usuarios/' + uidDona) + ':runQuery', { cabecalhos: cab, corpo: { structuredQuery: montarConsulta(desde) } });
          }).then(function (resposta) {
            var docs = (resposta || []).filter(function (x) { return x && x.document; }).map(function (x) { return x.document; });
            lidos += docs.length;
            var meuId = idDoAparelho();
            return Promise.all(docs.map(function (d) {
              var v = valores(d.fields);
              var reg = { id: v.id, tipo: v.tipo, atualizadoEm: v.atualizadoEm, apagadoEm: v.apagadoEm || null, aparelho: v.aparelho || '',
                esquema: v.esquema || 1, servidorEm: v.servidorEm || null, updateTime: d.updateTime || null, nome: d.name, dados: null, eco: false };
              if (meuId && reg.aparelho === meuId) reg.eco = true;
              if (reg.apagadoEm || !v.dados || !v.iv) return reg;
              return decifrarRegistro(v.iv, v.dados).then(function (dados) { reg.dados = dados; return reg; }, function () {
                reg.indecifravel = true; return reg;
              });
            })).then(function (regs) {
              /* O eco do que este aparelho mesmo subiu só avança o cursor: o
               * registro já está aqui, com o carimbo anotado no envio. O que não
               * decifra (outra chave) não é aplicado, e não some calado: conta. */
              var aplicaveis = regs.filter(function (r) { return !r.eco && !r.indecifravel; });
              var ecos = regs.filter(function (r) { return r.eco; });
              var indecifraveis = regs.filter(function (r) { return r.indecifravel; }).length;
              var ultimo = regs.length ? { servidorEm: regs[regs.length - 1].servidorEm, nome: regs[regs.length - 1].nome } : null;
              /* O eco vai com o id e o carimbo, marcado: o Store só anota o carimbo
               * no registro que ainda não o tem (a lápide do "Apagar tudo" e a
               * restauração da própria cópia o perdem), e avança o cursor. */
              var lote = aplicaveis.concat(ecos.map(function (r) { return { id: r.id, eco: true, servidorEm: r.servidorEm, nome: r.nome, updateTime: r.updateTime }; }));
              // nada a aplicar: nenhuma transação de escrita (o celular em dia não grava nada)
              var aplicar = lote.length ? root.Store.aplicarRecebidos(lote) : Promise.resolve({ aplicados: 0 });
              return aplicar.then(function (contas) {
                aplicados += contas.aplicados;
                registros.indecifraveis = (registros.indecifraveis || 0) + indecifraveis;
                if (docs.length < 300 || !ultimo || !ultimo.servidorEm) return { aplicados: aplicados, lidos: lidos };
                desde = ultimo;
                return pagina();
              });
            });
          });
        }
        return pagina();
      });
    }).then(function (r) {
      if (!r.pulado) { registros.erroRecebimento = null; registros.ultimoRecebimento = { quando: new Date().toISOString(), aplicados: r.aplicados, lidos: r.lidos }; }
      return r;
    }, function (e) {
      registros.erroRecebimento = { codigo: (e && e.codigo) || 'ERRO', quando: new Date().toISOString(), mensagem: (e && e.message) || '' };
      return { aplicados: aplicados, erro: registros.erroRecebimento };
    });
    var limpar = function () { recebendo = null; avisarOuvintes(); };
    recebendo.then(limpar, limpar);
    return recebendo;
  }
  /* Receber e depois enviar: a ordem que faz a precondição passar na maior
   * parte das vezes. O aparelho que só lê só recebe. */
  function sincronizar(info) {
    return receberRegistros().then(function (r) {
      if (!podeEnviar()) return { recebidos: r, enviados: { pulado: 'so leitura', enviados: 0 } };
      return enviarRegistros(info).then(function (e) { return { recebidos: r, enviados: e }; });
    });
  }
  function sincronizarSeDevido(info) {
    if (!(sessao && chaveBruta && online()) || sincronizacaoDesligada) return Promise.resolve({ pulado: sincronizacaoDesligada ? 'desligada' : 'indevido' });
    return sincronizar(info);
  }

  function estado() {
    return {
      disponivel: disponivel(),
      entrada: sessao ? { email: sessao.email, uid: sessao.uid } : null,
      temChave: !!chaveBruta,
      ultimaCopia: ultimaCopia,
      automatica: automatica,
      pendente: pendente,
      enviando: !!enviando,
      aparelho: aparelho,
      aparelhoId: idDoAparelho(),
      registros: { pendentes: registros.pendentes, quarentena: registros.quarentena, ultimoEnvio: registros.ultimoEnvio,
        erro: registros.erro, enviando: !!enviandoRegistros, ultimoRecebimento: registros.ultimoRecebimento || null,
        erroRecebimento: registros.erroRecebimento || null, recebendo: !!recebendo, indecifraveis: registros.indecifraveis || 0 },
      soLeitura: !!marcaSoLeitura,
      uidDona: marcaSoLeitura ? marcaSoLeitura.uidDona : null,
      sincronizacaoDesligada: sincronizacaoDesligada,
      online: online()
    };
  }

  /* "hoje, 14:02", "ontem, 18:40", "03/11, 09:15" ou "03/11/2025, 09:15". */
  function fraseDeQuando(iso, agora) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    agora = agora || new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var hora = pad(d.getHours()) + ':' + pad(d.getMinutes());
    var mesmoDia = function (a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); };
    if (mesmoDia(d, agora)) return 'hoje, ' + hora;
    var ontem = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 1);
    if (mesmoDia(d, ontem)) return 'ontem, ' + hora;
    var data = pad(d.getDate()) + '/' + pad(d.getMonth() + 1);
    if (d.getFullYear() !== agora.getFullYear()) data += '/' + d.getFullYear();
    return data + ', ' + hora;
  }

  // Toda gravação dela no banco principal marca que há cópia a subir.
  if (root.Store && typeof root.Store.aoMudar === 'function') root.Store.aoMudar(marcarMudanca);
  if (disponivel()) carregarEstado();

  root.Nuvem = {
    disponivel: disponivel, pronto: carregarEstado, estado: estado, aoMudar: aoMudar,
    entrar: entrar, sair: sair, esqueciASenha: esqueciASenha, trocarSenha: trocarSenha,
    verChave: verChave, temChave: temChave, importarChave: importarChave, lerQr: lerQr,
    codigoValido: function (texto) { return chaveDoCodigo(texto).then(function () { return true; }); },
    formatarCodigo: formatarCodigo,
    enviarCopia: enviarCopia, listarCopias: listarCopias, baixarCopia: baixarCopia, restaurou: restaurou,
    marcarSoLeitura: marcarSoLeitura, desmarcarSoLeitura: desmarcarSoLeitura, travarEnvio: travarEnvio, podeEnviar: podeEnviar,
    leitores: leitores, permitirLeitor: permitirLeitor, tirarLeitor: tirarLeitor,
    marcarMudanca: marcarMudanca, desligarAutomatica: desligarAutomatica,
    geracao: function () { return geracao; },
    enviarRegistros: enviarRegistros, enviarRegistrosSeDevido: enviarRegistrosSeDevido, contarFila: contarFila,
    receberRegistros: receberRegistros, sincronizar: sincronizar, sincronizarSeDevido: sincronizarSeDevido,
    copiaAutomaticaDevida: copiaAutomaticaDevida, copiaDiariaDevida: copiaDiariaDevida,
    fraseDeQuando: fraseDeQuando,
    TETO_PARTE: TETO_PARTE
  };
})(typeof self !== 'undefined' ? self : this);
