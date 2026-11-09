/* nuvem.js
 * A nuvem (fases 0 e 1): a cópia completa deste aparelho e os registros, um a
 * um, numa conta do Firebase que é só dela.
 *
 * O que protege os dados é o login (e-mail e senha no Firebase Auth), a senha
 * e as regras do Firestore (firestore.rules): só a conta dela escreve no
 * caminho dela, o aparelho observador só lê, e qualquer outra conta é negada.
 * DECISÃO DO DONO (08/11/2026): a cifra no aparelho saiu. Não há chave, QR nem
 * código de recuperação; "Restaurar neste aparelho" e o pareamento do
 * observador dependem só do login. Um aparelho que ainda tenha uma chave
 * antiga guardada a ignora e apaga.
 *
 * O que sobe na fase 0 é o mesmo .zip da cópia de segurança (store.js,
 * exportarTudoZip: sem livros e sem pacotes), em partes de bytes. Fala com o
 * Firebase pela API REST (login por e-mail e senha no Identity Toolkit,
 * documentos no Firestore), sem o SDK. A configuração web do projeto não é
 * segredo (ela vai em todo site que usa Firebase).
 *
 * Caminho na nuvem, tudo embaixo de usuarios/{uid}:
 *   estado/copia             { atual, anterior, quando }  qual cópia vale
 *   copias/{id}              { bytes, partes, quando, aparelho, aparelhoId, versao }
 *   copias/{id}/partes/{n}   { dados: bytes }   até 768 KiB cada
 *   config/leitores          { uids: [...] }   quem mais pode LER (D7)
 *   registros/{id}           { id, tipo, atualizadoEm, apagadoEm, aparelho,
 *                              esquema, app, dados, servidorEm }  (N1)
 *   diagnostico/{aparelhoId} { aparelhoId, aparelho, papel, app, quando,
 *                              pendentes, quarentena, ultimoEnvio,
 *                              ultimoRecebimento, ultimaCopia, sincronizacao,
 *                              navegador, instalado, persistente, erroCodigo,
 *                              erroFrase, erroQuando, erroOrigem }  (D7)
 *   folhas/{folha:aulaId:n}  { id, aulaId, n, hash, bytes, tamanho, algoritmo,
 *                              atualizadoEm, apagadoEm, aparelho, esquema, app,
 *                              servidorEm }  (N2, fatia 1)
 * A FOLHA sobe POR PÁGINA (N2): o texto canônico da página (store.js,
 * paginaCanonica: pontos arredondados a 0,1, em JSON), comprimido com
 * CompressionStream('gzip') em `bytes`, com o SHA-256 do texto em `hash`. Só
 * o tablet a envia (o commit recusa `folhas/` fora dele); o celular e o
 * observador a recebem e a leem. Quem recebe descomprime e CONFERE o hash:
 * o documento que não bate é pulado e contado, nunca aplicado. A lápide vai
 * sem bytes. A página recém-gravada espera 30 segundos sem traço novo
 * (store.js, ESPERA_FOLHA) e sobe na hora ao fechar a folha ou o aplicativo.
 * O DIAGNÓSTICO é um resumo pequeno de cada aparelho que escreve (o tablet e
 * o celular da dona), só metadados e nunca dado de criança: a versão, o
 * último erro (o código e a frase fixa dele, nunca o conteúdo), a última
 * sincronização, a fila e a quarentena. Sobe quando muda, no máximo uma vez
 * por hora, só do próprio aparelho; o observador (D7) o lê no painel dele.
 * A cópia nova sobe inteira com um id novo e só então o ponteiro muda; a de
 * antes vira "anterior" e a mais velha sai. Quem baixa nunca vê metade.
 *
 * Os REGISTROS (fase 1 da nuvem) sobem um a um, da fila `saida` do store.js,
 * que entra na mesma transação de cada gravação dela: os metadados (id, tipo,
 * carimbos, aparelho, esquema) e o conteúdo em `dados`, como dado legível do
 * Firestore. O servidor carimba `servidorEm` com a hora dele; é esse carimbo
 * que ordena o recebimento (fatia 3). Uma entrada sai da fila só depois de o
 * commit responder, e só se ainda for a que subiu. Com a nuvem recusando (as
 * regras ainda não publicadas, por exemplo), a fila fica guardada e a tela
 * diz isso; nada trava. O id de aparelho dos registros é o do Store, e a
 * cópia completa leva o mesmo id (aparelhoId) ao lado do rótulo.
 *
 * A cópia automática só começa depois do primeiro envio feito por ela neste
 * aparelho (ou de uma restauração aqui): um aparelho recém-instalado, com a
 * carga inicial, não pode subir por cima da cópia do tablet dela.
 *
 * O celular só lê (D6, parte 1): o aparelho que trouxe a cópia pelo modo
 * celular guarda a marca "só leitura" e nunca escreve na nuvem; o commit, que
 * é a única porta de escrita, recusa. Ele recebe registros (fatia 3).
 *
 * "Apagar tudo" desliga a sincronização deste aparelho (envio e recebimento)
 * até ela restaurar ou enviar uma cópia; a marca mora no Store (controle), e
 * o recebimento a confere dentro da própria transação de aplicar.
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
   * 768 KiB de bytes por parte deixa folga. Um commit aceita 10 MiB; oito
   * partes (6 MiB de bytes, 8 MiB em base64) ficam abaixo disso. */
  var TETO_PARTE = 768 * 1024;
  var PARTES_POR_PEDIDO = 8;
  var REGISTROS_POR_COMMIT = 200;   // o commit aceita 500 escritas; 200 deixa folga de tamanho
  /* Um commit aceita 10 MiB. Com páginas de folha no lote (N2), o lote é
   * cortado pelos bytes também: 5 MiB em base64 deixa folga para os campos. */
  var TETO_COMMIT_BYTES = 5 * 1024 * 1024;
  var TETO_PAGINA_BYTES = 900 * 1024;   // uma página comprimida acima disto não cabe num documento (as regras também recusam)
  var TETO_KEEPALIVE = 60 * 1024;       // o corpo que ainda cabe num fetch com keepalive (o navegador limita a 64 KiB)
  var ATRASO_ENVIO_REGISTROS = 2500; // depois de uma gravação dela, espera as vizinhas antes de subir
  var NOME_BANCO = 'apoio-nuvem';
  var UM_DIA = 24 * 60 * 60 * 1000;
  var ALFABETO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // só para o rótulo do aparelho ("tablet 7K")

  // ---------- estado em memória, espelho do banco próprio ----------

  var sessao = null;      // { email, uid, idToken, refreshToken, expiraEm }
  var ultimaCopia = null; // { id, quando, bytes, partes, aparelho }
  var automatica = false; // ligada depois do primeiro envio manual ou restauração aqui
  var pendente = false;   // houve gravação local desde a última cópia
  var geracao = 0;        // cresce a cada gravação dela; o envio compara com a do retrato
  var aparelho = null;    // rótulo curto deste aparelho, só para a lista de cópias
  var enviando = null;    // promessa do envio em curso, para não subir duas vezes
  /* A marca "este aparelho é celular" (D6): gravada quando ela traz a cópia
   * pelo modo celular. Com ela, a CÓPIA COMPLETA nunca sobe daqui: nem ao
   * fechar, nem uma vez por dia, nem pelo toque. Uma cópia do celular
   * cobriria a do tablet com uma mais velha; a cópia é do tablet. Guarda
   * também de que conta é a cópia, para buscar a mais nova ao abrir.
   * { desde, uidDona }
   * Na conta da DONA (D6, parte 2), o celular edita nas quatro ações e a
   * mudança sobe pela fila de registros; na conta de outra pessoa (o
   * observador, D7), nada sobe, nunca.
   * No banco próprio a chave continua 'soLeitura', o nome da parte 1: a
   * versão de antes lê essa chave, e voltar a ela (rollback) com a marca
   * guardada noutro nome faria o celular enviar a cópia completa. */
  var marcaCelular = null;
  var travadoNestaAbertura = false; // a tela do celular está à vista, mesmo sem a marca
  /* Os registros (N1): quantos esperam na fila, o último envio e o último erro
   * (o PERMISSION_DENIED das regras ainda não publicadas fica aqui, para
   * Ajustes dizer). Espelhado no banco próprio, chave 'registros'. */
  var registros = { pendentes: 0, quarentena: 0, ultimoEnvio: null, erro: null };
  var enviandoRegistros = null;  // promessa do envio em curso
  var envioAgendado = null;      // o setTimeout do envio depois de uma gravação
  /* "Apagar tudo" DESLIGA A SINCRONIZAÇÃO deste aparelho, o envio e o
   * recebimento, até ela restaurar ou mandar a cópia ela mesma, como a fase 0
   * já desliga a cópia automática: num banco vazio nunca chegam aulas soltas,
   * sem aluno. A marca mora no Store (controle), que a confere dentro da
   * transação de aplicar; aqui fica o espelho para as decisões rápidas. */
  var sincronizacaoDesligada = false;
  /* O diagnóstico deste aparelho (D7): o que a tela informa (a versão do
   * aplicativo e o resultado do pedido de armazenamento persistente), o
   * último erro da cópia completa e o último erro de script (só o nome e o
   * lugar, nunca a mensagem), e o último resumo que subiu, com a assinatura
   * (para subir só quando muda) e a hora (no máximo um por hora). Espelhado
   * no banco próprio, chave 'diagnostico'. */
  var versaoApp = '';
  var persistente = null;         // true, false, ou null enquanto o navegador não respondeu
  var erroCopia = null;           // { codigo, quando }
  var erroScript = null;          // { codigo, frase, quando }
  var ultimoDiagnostico = null;   // { quando, assinatura }
  var gravandoDiagnostico = null;
  var problemaBanco = null;       // o nome do erro quando o banco próprio não abre (navegação privada do Safari)
  var UMA_HORA = 60 * 60 * 1000;
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
      lerEstado('diagnostico')]).then(function (v) {
      marcaCelular = v[6] || null;
      sessao = v[0] || null;
      ultimaCopia = v[2] || null;
      automatica = !!v[3];
      pendente = !!v[4];
      aparelho = v[5] || null;
      if (v[7]) registros = { pendentes: 0, quarentena: 0, ultimoEnvio: v[7].ultimoEnvio || null, erro: v[7].erro || null };
      ultimoDiagnostico = v[8] || null;
      var pendencias = [];
      // a chave antiga (fase 0 com cifra, decisão do dono de 08/11): ignorada e apagada
      if (v[1]) pendencias.push(gravarEstado('chave', null).catch(function () { /* fica, ignorada */ }));
      // a fila é do Store; a contagem e a marca da sincronização são lidas dele, nunca guardadas aqui
      contarFila();
      pendencias.push(lerSincronizacaoDesligada());
      if (!aparelho) {
        aparelho = rotuloDoAparelho();
        pendencias.push(gravarEstado('aparelho', aparelho));
      }
      return Promise.all(pendencias);
    }).catch(function (e) {
      /* Sem IndexedDB (a navegação privada do Safari recusa o banco): a nuvem
       * fica indisponível e a tela diz o motivo, pelo estado. */
      problemaBanco = (e && (e.name || e.message)) ? String(e.name || e.message).slice(0, 80) : 'erro';
    });
    return pronto;
  }
  function lerSincronizacaoDesligada() {
    if (!root.Store || typeof root.Store.sincronizacaoDesligada !== 'function') return Promise.resolve(false);
    return root.Store.sincronizacaoDesligada().then(function (d) { sincronizacaoDesligada = !!d; return !!d; }, function () { return sincronizacaoDesligada; });
  }
  /* O id deste aparelho é o do Store (nasce na primeira gravação dela): é o
   * que vai em cada registro e também no cabeçalho da cópia completa. O
   * `aparelho` daqui é só o rótulo que ela lê ("tablet 7K"). */
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
      typeof fetch === 'function' && typeof TextEncoder !== 'undefined';
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
    PAGINA_GRANDE: 'Uma página da folha é grande demais para a nuvem e não sobe: divida a página em duas para ela subir.',
    LOTE_GRANDE: 'O lote passou do tamanho e vai dividido.',
    SEM_COMPRESSAO: 'Este navegador não comprime a folha para a nuvem: as folhas ficam só neste aparelho.',
    SEM_WEBCRYPTO: 'Este navegador não calcula o hash da folha para a nuvem: as folhas ficam só neste aparelho.',
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
    /* `keepalive` (ao fechar o aplicativo, N2): o pedido sobrevive à página
     * fechando. O navegador limita o corpo em voo com keepalive a 64 KiB; um
     * lote com uma página densa (67 KB em gzip, mais em base64) não cabe, e
     * vai sem keepalive: se a página morrer antes, a fila guarda a entrada e
     * ela sobe na próxima abertura. */
    var keepalive = !!opcoes.keepalive && (corpo === undefined || corpo.length <= TETO_KEEPALIVE);
    var p;
    try {
      p = fetch(url, { method: opcoes.metodo || (corpo !== undefined ? 'POST' : 'GET'), headers: cabecalhos, body: corpo, keepalive: keepalive });
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

  // ---------- bytes ----------

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

  /* Um valor do aplicativo vira um Value do Firestore, e volta. O conteúdo do
   * registro (`dados`) é dado legível: objeto vira mapValue, lista vira
   * arrayValue, número inteiro vira integerValue, os outros, doubleValue. O
   * Firestore não aceita lista dentro de lista: essa, rara, vira um mapa com a
   * lista em JSON (`__json`), que a volta desfaz. */
  function valorFirestore(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (v instanceof Uint8Array) return { bytesValue: paraBase64(v) };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') {
      if (!isFinite(v)) return { nullValue: null };
      return Number.isInteger(v) && Math.abs(v) < 9007199254740991 ? { integerValue: String(v) } : { doubleValue: v };
    }
    if (typeof v === 'string') return { stringValue: v };
    if (Array.isArray(v)) {
      if (v.some(function (x) { return Array.isArray(x); })) return { mapValue: { fields: { __json: { stringValue: JSON.stringify(v) } } } };
      return { arrayValue: { values: v.map(valorFirestore) } };
    }
    if (typeof v === 'object') {
      var fields = {};
      Object.keys(v).forEach(function (k) { if (v[k] !== undefined) fields[k] = valorFirestore(v[k]); });
      return { mapValue: { fields: fields } };
    }
    return { stringValue: String(v) };
  }
  function valorDoFirestore(v) {
    if (!v || typeof v !== 'object') return null;
    if ('nullValue' in v) return null;
    if ('bytesValue' in v) return deBase64(v.bytesValue);
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return Number(v.doubleValue);
    if ('booleanValue' in v) return !!v.booleanValue;
    if ('stringValue' in v) return v.stringValue;
    if ('timestampValue' in v) return v.timestampValue;
    if ('arrayValue' in v) return ((v.arrayValue && v.arrayValue.values) || []).map(valorDoFirestore);
    if ('mapValue' in v) {
      var fields = (v.mapValue && v.mapValue.fields) || {};
      if (Object.keys(fields).length === 1 && fields.__json && 'stringValue' in fields.__json) {
        try { return JSON.parse(fields.__json.stringValue); } catch (e) { return null; }
      }
      var saida = {};
      Object.keys(fields).forEach(function (k) { saida[k] = valorDoFirestore(fields[k]); });
      return saida;
    }
    return null;
  }
  /* Os campos de um documento: null e undefined ficam de fora. */
  function campos(obj) {
    var saida = {};
    Object.keys(obj).forEach(function (k) {
      var v = obj[k];
      if (v === null || v === undefined) return;
      saida[k] = valorFirestore(v);
    });
    return saida;
  }
  function valores(fields) {
    var saida = {};
    Object.keys(fields || {}).forEach(function (k) { saida[k] = valorDoFirestore(fields[k]); });
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
  /* TODA escrita na nuvem passa pelo commit. A cópia completa, a rotação e a
   * lista de leitores sobem só do tablet (sem a marca de celular e sem a tela
   * de celular à vista). Do celular da dona sobem os registros, e só eles: o
   * commit confere escrita por escrita que o caminho é o de um registro. O
   * observador de outra conta não escreve nada. */
  function podeEnviarCopia() { return !marcaCelular && !travadoNestaAbertura; }
  /* O celular da DONA: tem a marca e a conta dela é a conta da cópia. Sem a
   * conta à vista (ela saiu), não há como saber: fica sem editar. */
  function celularDaDona() {
    return !!(marcaCelular && sessao && sessao.uid && (!marcaCelular.uidDona || marcaCelular.uidDona === sessao.uid));
  }
  function podeEnviarRegistros() { return podeEnviarCopia() || celularDaDona(); }
  function recusaSoLeitura() {
    return Object.assign(new Error('Este aparelho só lê: nada sobe daqui para a nuvem.'), { codigo: 'SO_LEITURA' });
  }
  function soRegistros(escritas) {
    var raiz = sessao ? '/usuarios/' + sessao.uid + '/registros/' : null;
    return !!raiz && escritas.length > 0 && escritas.every(function (w) {
      var nome = (w && w.update && w.update.name) || '';
      return !w.delete && nome.indexOf(raiz) > 0 && nome.slice(nome.indexOf(raiz) + raiz.length).indexOf('/') < 0;
    });
  }
  /* O diagnóstico (D7) do PRÓPRIO aparelho, numa escrita só, no caminho da
   * conta que entrou: é a outra coisa que o celular da dona pode subir. */
  function soDiagnosticoProprio(escritas) {
    var id = idDoAparelho();
    var nome = escritas.length === 1 && escritas[0] && escritas[0].update && escritas[0].update.name;
    return !!(sessao && id && nome && nome === nomeDoc(sessao.uid, 'diagnostico/' + id));
  }
  /* A folha (N2) só sobe do tablet: qualquer escrita em `folhas/` fora dele é
   * recusada aqui, mesmo que a entrada tenha escapado para a fila. */
  function temFolhas(escritas) {
    return escritas.some(function (w) {
      var nome = (w && w.update && w.update.name) || (w && w.delete) || '';
      return nome.indexOf('/folhas/') > 0;
    });
  }
  function commit(escritas, opcoes) {
    if (!podeEnviarCopia() && temFolhas(escritas)) return Promise.reject(recusaSoLeitura());
    if (!podeEnviarCopia() && !(celularDaDona() && (soRegistros(escritas) || soDiagnosticoProprio(escritas)))) return Promise.reject(recusaSoLeitura());
    return comToken(function (cab) {
      return pedir(urlDoc(raizDocumentos()) + ':commit', { cabecalhos: cab, corpo: { writes: escritas }, keepalive: !!(opcoes && opcoes.keepalive) });
    });
  }
  function gravacao(nome, obj) { return { update: { name: nome, fields: campos(obj) } }; }
  /* A escrita de um registro (fatia 3): o servidor carimba `servidorEm` com a
   * hora DELE (é o carimbo que ordena o recebimento), e a precondição
   * `currentDocument.updateTime` recusa a escrita se outro aparelho ou outra
   * aba gravou depois do que este aparelho viu por último; sem carimbo
   * conhecido, sem precondição (o primeiro envio do registro), salvo a
   * entrada de restauração, que exige que o documento não exista. */
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
    var r = new Uint8Array(4), s = '';
    crypto.getRandomValues(r);
    for (var i = 0; i < r.length; i++) s += (r[i] < 16 ? '0' : '') + r[i].toString(16);
    return 'c' + Date.now().toString(36) + s;
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
   * CONTEÚDO: depois de um "Apagar tudo", ou num aparelho recém-instalado, o
   * fechar não pode trocar a cópia boa pela vazia. Quando é ela quem manda, a
   * tela já perguntou. */
  function enviarCopia(blob, info) {
    if (!podeEnviarCopia()) return Promise.reject(recusaSoLeitura());
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
      return copiasApontadas(sessao.uid);
    }).then(function (lista) {
      apontadas = lista;
      if (automatica_ && !conteudo && apontadas.some(function (c) { return c.conteudo; })) {
        return null; // fica a cópia com conteúdo; nada sobe
      }
      return blob.arrayBuffer().then(function (buf) { return new Uint8Array(buf); });
    }).then(function (bytes) {
      if (!bytes) return { pulada: true };
      var uid = sessao.uid;
      var id = idNovo();
      var partes = [];
      for (var i = 0; i < bytes.length; i += TETO_PARTE) {
        partes.push(bytes.subarray(i, Math.min(i + TETO_PARTE, bytes.length)));
      }
      if (!partes.length) partes.push(new Uint8Array(0));
      var quando = new Date().toISOString();
      var meta = { formato: 'apoio-educacional-copia', versao: 2, bytes: bytes.length,
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
        // o envio feito por ela religa a sincronização que o "Apagar tudo" desligou, e o que está aqui passa a valer
        var religar = info.motivo === 'ela' ? religarSincronizacao({ tudoDesteAparelho: true }) : Promise.resolve();
        return Promise.all([gravarEstado('copia', ultimaCopia), gravarEstado('pendente', pendente), gravarEstado('automatica', true), religar]);
      }).then(function () {
        if (info.motivo === 'ela') agendarEnvioDeRegistros(); // o que o religar enfileirou sobe daqui a pouco
        return ultimaCopia;
      });
    });
    /* O resultado entra no diagnóstico deste aparelho (D7): um erro da cópia
     * fica anotado pelo código, e o envio que deu certo o apaga. */
    var limpar = function (e) {
      enviando = null;
      erroCopia = e && e.codigo ? { codigo: e.codigo, quando: new Date().toISOString() } : null;
      avisarOuvintes();
      gravarDiagnostico();
    };
    enviando.then(function () { limpar(null); }, limpar);
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
              aparelho: meta.aparelho, conteudo: meta.conteudo !== false, versao: meta.versao,
              papel: id === ponteiro.atual ? 'atual' : 'anterior' };
          });
        }));
      }).then(function (lista) { return lista.filter(Boolean); });
    });
  }

  /* Devolve o .zip da cópia, como Blob. Só o login é preciso: as regras do
   * Firestore decidem quem lê. Uma cópia do formato antigo, cifrada (versão 1
   * do cabeçalho), não abre mais: nunca houve uma na conta dela. */
  function baixarCopia(uidDona, id) {
    var uid, meta;
    return carregarEstado().then(function () {
      if (!sessao) throw erro('TOKEN_EXPIRED');
      uid = uidDona || sessao.uid;
      return lerDoc(nomeDoc(uid, 'copias/' + id));
    }).then(function (m) {
      meta = m;
      if (!meta || meta.formato !== 'apoio-educacional-copia') throw erro('NOT_FOUND');
      if (meta.iv) throw Object.assign(new Error('Esta cópia é de uma versão antiga do aplicativo e não abre mais. Envie uma cópia nova do tablet.'), { formatoAntigo: true });
      var pedidos = [];
      for (var n = 0; n < Number(meta.partes); n++) pedidos.push(lerDoc(nomeDoc(uid, 'copias/' + id + '/partes/' + n)));
      return Promise.all(pedidos);
    }).then(function (partes) {
      var total = 0;
      partes.forEach(function (p) { if (!p || !p.dados) throw erro('NOT_FOUND'); total += p.dados.length; });
      if (total !== Number(meta.bytes)) throw new Error('A cópia na nuvem está incompleta. Tente de novo mais tarde.');
      var juntos = new Uint8Array(total), pos = 0;
      partes.forEach(function (p) { juntos.set(p.dados, pos); pos += p.dados.length; });
      return new Blob([juntos], { type: 'application/zip' });
    });
  }

  /* Depois de restaurar aqui, este aparelho passa a ser dono da cópia. Menos
   * o celular (opcoes.celular, a restauração pelo modo celular): esse nunca é
   * dono da cópia, e a automática fica desligada nele. */
  function restaurou(copia, opcoes) {
    var ehCelular = !!(opcoes && opcoes.celular) || !!marcaCelular;
    ultimaCopia = { id: copia.id, quando: copia.quando, bytes: copia.bytes, partes: copia.partes, aparelho: copia.aparelho };
    pendente = false;
    automatica = !ehCelular;
    var gravar = [gravarEstado('copia', ultimaCopia), gravarEstado('pendente', false), gravarEstado('automatica', automatica), religarSincronizacao()];
    if (ehCelular && !marcaCelular) gravar.push(marcarCelular(copia.uid));
    return Promise.all(gravar).then(avisarOuvintes);
  }

  /* Grava a marca ANTES de os dados chegarem (quem chama faz isso antes de
   * importar): se a página morrer no meio, o aparelho já se sabe celular. */
  function marcarCelular(uidDona) {
    marcaCelular = { desde: new Date().toISOString(), uidDona: String(uidDona || (sessao && sessao.uid) || '') };
    automatica = false;
    return Promise.all([gravarEstado('soLeitura', marcaCelular), gravarEstado('automatica', false)]);
  }
  /* Desfazer a marca (o tablet que foi marcado por engano): daqui em diante
   * este aparelho é dono da cópia, e a automática liga. Quem chama já
   * perguntou, e só com a tela larga. */
  function desmarcarCelular() {
    marcaCelular = null;
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
   * sobe sozinho; ela religa no próximo envio dela ou numa restauração. A
   * sincronização (envio e recebimento) o Store já desligou na transação do
   * próprio "Apagar tudo"; aqui só o espelho. */
  function desligarAutomatica() {
    automatica = false;
    sincronizacaoDesligada = true;
    var marca = root.Store && typeof root.Store.desligarSincronizacao === 'function' ? root.Store.desligarSincronizacao().catch(function () {}) : Promise.resolve();
    return Promise.all([gravarEstado('automatica', false), marca]).then(avisarOuvintes, avisarOuvintes);
  }
  /* opcoes.tudoDesteAparelho: o religar pelo "Enviar cópia agora", em que o
   * Store enfileira todo registro vivo e as lápides (o que está neste aparelho
   * passa a valer); a restauração religa sem isso, porque já enfileirou. */
  function religarSincronizacao(opcoes) {
    sincronizacaoDesligada = false;
    if (!root.Store || typeof root.Store.religarSincronizacao !== 'function') return Promise.resolve();
    // sempre no Store, mesmo com a memória já ligada: a marca de lá é a que vale
    return root.Store.religarSincronizacao(opcoes || {}).catch(function () { /* fica em memória */ });
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
  /* Ao fechar com sinal: há conta, a automática já começou e houve mudança
   * desde a última cópia. */
  function copiaAutomaticaDevida() {
    return !!(podeEnviarCopia() && sessao && automatica && pendente && online() && !enviando);
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

  /* O documento de um registro: os metadados e o conteúdo, como dado legível
   * do Firestore. Lápide não leva conteúdo. O `aparelho` do documento é quem o
   * ENVIA, não quem escreveu a versão localmente: é por ele que o recebimento
   * reconhece o eco, e este aparelho pode reafirmar, pela restauração, uma
   * versão que tinha recebido do outro (se fosse com o id do outro, o outro a
   * tomaria por eco e nunca a aplicaria). */
  function documentoDoRegistro(reg, versaoApp) {
    var campo = { id: reg.id, tipo: reg.tipo, atualizadoEm: reg.atualizadoEm, apagadoEm: reg.apagadoEm || null,
      aparelho: idDoAparelho() || reg.aparelho || 'aparelho', esquema: reg.esquema || 1, app: versaoApp || '' };
    if (!reg.apagadoEm && reg.dados !== null && reg.dados !== undefined) campo.dados = reg.dados;
    return campo;
  }

  // ---------- bytes comprimidos (as páginas da folha, N2) ----------

  /* A folha só sobe (e só se confere) com WebCrypto e CompressionStream; sem
   * um deles a página fica na fila e a frase vai para Ajustes e o diagnóstico. */
  function suportaFolhas() {
    return typeof CompressionStream === 'function' && typeof DecompressionStream === 'function' &&
      !!(root.Store && typeof root.Store.temWebCrypto === 'function' && root.Store.temWebCrypto());
  }
  function juntarFluxo(fluxo) {
    return new Response(fluxo).arrayBuffer().then(function (buf) { return new Uint8Array(buf); });
  }
  function comprimir(texto) {
    if (typeof CompressionStream !== 'function') return Promise.reject(erro('SEM_COMPRESSAO'));
    return juntarFluxo(new Blob([new TextEncoder().encode(texto)]).stream().pipeThrough(new CompressionStream('gzip')));
  }
  function descomprimir(bytes) {
    if (typeof DecompressionStream !== 'function') return Promise.reject(erro('SEM_COMPRESSAO'));
    return juntarFluxo(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).then(function (saida) {
      return new TextDecoder('utf-8', { fatal: true }).decode(saida);
    });
  }
  /* O documento de uma PÁGINA DE FOLHA (N2): o texto canônico comprimido, o
   * hash dele e os metadados. A lápide vai sem bytes. Assíncrono (o gzip e o
   * SHA-256 são). Uma página comprimida acima do teto do documento não sobe:
   * o erro PAGINA_GRANDE leva a entrada à quarentena, sem segurar as outras. */
  function documentoDaPagina(reg, versaoApp) {
    var campo = { id: reg.id, aulaId: reg.aulaId, n: reg.n, atualizadoEm: reg.atualizadoEm, apagadoEm: reg.apagadoEm || null,
      aparelho: idDoAparelho() || reg.aparelho || 'aparelho', esquema: reg.esquema || 1, app: versaoApp || '' };
    if (reg.apagadoEm || !reg.pagina) {
      if (reg.hash) campo.hash = reg.hash;
      return Promise.resolve({ doc: campo, bytes: 0, hash: reg.hash || null });
    }
    var texto = root.Store.paginaCanonica(reg.pagina);
    return Promise.all([root.Store.sha256Hex(texto), comprimir(texto)]).then(function (r) {
      if (r[1].length > TETO_PAGINA_BYTES) throw erro('PAGINA_GRANDE');
      campo.hash = r[0];
      campo.bytes = r[1];
      campo.tamanho = texto.length;
      campo.algoritmo = 'gzip';
      return { doc: campo, bytes: r[1].length, hash: r[0] };
    });
  }
  /* Os documentos de um lote, cada um com o caminho dele e o tamanho em
   * bytes: registro em `registros/`, página em `folhas/`. A página GRANDE
   * DEMAIS para um documento não derruba o lote: vem marcada (`grande`), e o
   * envio a põe direto na quarentena, com o motivo, sem tentar de novo (o
   * tamanho não muda tentando); a tela diz qual folha e o que fazer. */
  function documentosDoLote(itens, versaoApp) {
    return Promise.all(itens.map(function (i) {
      var reg = i.registro;
      if (reg.tipo === 'folha') {
        return documentoDaPagina(reg, versaoApp).then(function (r) { return { colecao: 'folhas/', doc: r.doc, bytes: r.bytes, hash: r.hash }; }, function (e) {
          if (e && e.codigo === 'PAGINA_GRANDE') return { grande: true, id: i.fila.id };
          throw e;
        });
      }
      var doc = documentoDoRegistro(reg, versaoApp);
      return Promise.resolve({ colecao: 'registros/', doc: doc, bytes: JSON.stringify(doc).length, hash: null });
    }));
  }

  function contarFila() {
    if (!root.Store || typeof root.Store.estadoDaFila !== 'function') return Promise.resolve(0);
    return root.Store.estadoDaFila().then(function (e) {
      var grandes = e.grandes || [];
      if (e.pendentes !== registros.pendentes || e.quarentena !== registros.quarentena || JSON.stringify(grandes) !== JSON.stringify(registros.paginasGrandes || [])) {
        registros.pendentes = e.pendentes;
        registros.quarentena = e.quarentena;
        registros.paginasGrandes = grandes;
        // a página grande saiu da quarentena (foi dividida e regravada): a frase sai com ela
        if (!grandes.length && registros.erro && registros.erro.codigo === 'PAGINA_GRANDE') { registros.erro = null; guardarRegistros(); }
        avisarOuvintes();
      }
      return e.pendentes;
    }, function () { return registros.pendentes; });
  }
  function guardarRegistros() {
    return gravarEstado('registros', { ultimoEnvio: registros.ultimoEnvio, erro: registros.erro })
      .catch(function () { /* fica em memória */ });
  }
  /* Há o que subir e tem como: conta, sinal, a sincronização ligada e o
   * aparelho pode escrever. A fila em si não entra aqui: o envio a lê. */
  function registrosDevidos() {
    return !!(podeEnviarRegistros() && !sincronizacaoDesligada && sessao && online());
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
  var tudoPendente = false;      // um "sobe tudo agora" chegou com um envio em voo: roda de novo quando ele acabar
  var ultimaInfoDeEnvio = {};
  function enviarRegistros(info) {
    info = info || {};
    ultimaInfoDeEnvio = info;
    /* O "sobe ao fechar" não se perde com um envio em curso (revisão da fatia
     * 1): fica marcado e o envio roda de novo, com `tudo`, assim que este acabar. */
    if (enviandoRegistros) { if (info.tudo) tudoPendente = true; return enviandoRegistros; }
    var enviados = 0, lotes = 0, emQuarentenaAntes = [], adiadas = 0, folhasSemSuporte = 0, paginasGrandes = 0, lapidesDescartadas = 0;
    enviandoRegistros = carregarEstado().then(function () {
      return lerSincronizacaoDesligada();
    }).then(function () {
      if (!podeEnviarRegistros()) return { pulado: 'so leitura', enviados: 0 };
      if (!sessao) return { pulado: 'sem conta', enviados: 0 };
      if (sincronizacaoDesligada) return { pulado: 'desligada', enviados: 0 };
      if (!online()) throw semRede();
      if (!root.Store || typeof root.Store.registrosDaFila !== 'function') return { pulado: 'sem fila', enviados: 0 };
      var uid = sessao.uid;
      // quem já estava em quarentena ANTES deste envio é quem o envio limpo solta depois (não quem entrou nele agora)
      var quarentenaLida = typeof root.Store.lerFila === 'function'
        ? root.Store.lerFila().then(function (l) { emQuarentenaAntes = (l || []).filter(function (e) { return e.quarentena && !e.retestada; }).map(function (e) { return e.id; }); }, function () {})
        : Promise.resolve();
      /* Um lote inteiro, num commit; o que subiu sai da fila. */
      function subirLote(todos) {
        return documentosDoLote(todos, info.versaoApp).then(function (todosPreparados) {
          // as páginas grandes demais vão para a quarentena agora, e o resto do lote segue
          var grandes = todosPreparados.filter(function (p) { return p.grande; }).map(function (p) { return p.id; });
          var itens = todos.filter(function (i, k) { return !todosPreparados[k].grande; });
          var preparados = todosPreparados.filter(function (p) { return !p.grande; });
          var quarentena = grandes.length && typeof root.Store.quarentenar === 'function'
            ? root.Store.quarentenar(grandes, 'PAGINA_GRANDE').then(function () { paginasGrandes += grandes.length; }, function () {})
            : Promise.resolve();
          if (!itens.length) return quarentena.then(function () { return 0; });
          /* O TETO DE BYTES do commit (N2): um lote com páginas de folha que
           * passe dele volta para ser dividido ao meio, sem culpa de ninguém. */
          var total = preparados.reduce(function (s, p) { return s + p.bytes; }, 0);
          if (itens.length > 1 && total > TETO_COMMIT_BYTES) throw erro('LOTE_GRANDE');
          return quarentena.then(function () { return commit(preparados.map(function (p, k) {
            var conhecido = itens[k].registro.nuvem && itens[k].registro.nuvem.updateTime;
            /* A entrada de RESTAURAÇÃO sem carimbo conhecido exige que o documento
             * não exista: se existir, a nuvem tem algo que este aparelho não viu,
             * a precondição falha, o recebimento decide e só então se tenta de
             * novo. */
            /* A mensagem do mês sem carimbo conhecido também (um texto novo do
             * mês, escrito sem sinal): se o outro aparelho já o criou na nuvem, a
             * precondição falha e o recebimento decide pela hora em que cada um
             * foi escrito, em vez de este envio cobrir o outro calado. */
            var precondicao = conhecido ? { updateTime: conhecido }
              : ((itens[k].fila.restauro || itens[k].registro.tipo === 'resumo') ? { exists: false } : null);
            return gravacaoCarimbada(nomeDoc(uid, p.colecao + p.doc.id), p.doc, precondicao);
          }), { keepalive: !!info.fechando }).then(function (resposta) {
            var resultados = (resposta && resposta.writeResults) || [];
            return root.Store.confirmarEnvio(itens.map(function (i, k) {
              var w = resultados[k] || {};
              var transformado = w.transformResults && w.transformResults[0] && w.transformResults[0].timestampValue;
              return { id: i.fila.id, tipo: i.registro.tipo, atualizadoEm: i.fila.atualizadoEm, apagadoEm: i.registro.apagadoEm || null, hash: preparados[k].hash,
                nuvem: { updateTime: w.updateTime || null, servidorEm: transformado || w.updateTime || null } };
            }));
          }); });
        });
      }
      /* O COMMIT É ATÔMICO: um registro que a regra ou o teto de 1 MiB recuse
       * derrubaria o lote inteiro, para sempre. Quando um lote falha, ele é
       * dividido ao meio até isolar o culpado; o que não é culpa de registro
       * (sem rede, sessão vencida) sobe na hora. Devolve o que subiu e os que
       * ficaram sozinhos sem passar (indefinidos), com o erro. Se a metade de
       * cima falhou inteira, a de baixo é tentada inteira uma vez: as duas
       * falhando inteiras é a nuvem recusando tudo, e não se desce mais.
       * A PRECONDIÇÃO QUE FALHA sobe inteira enquanto o recebimento pode
       * resolvê-la (lerLote recebe e tenta de novo); esgotados os recebimentos
       * (`isolar`), ela é culpa de uma entrada, e o lote é dividido até achar
       * qual, para a fila não ficar presa nela (revisão do PR 133). */
      function subir(itens, isolar) {
        return subirLote(itens).then(function (n) { return { enviados: n, indefinidos: [], erro: null }; }, function (e) {
          if (!e || e.codigo === 'SEM_REDE' || e.codigo === 'TOKEN_EXPIRED' || (e.codigo === 'FAILED_PRECONDITION' && !isolar)) throw e;
          if (itens.length === 1) return { enviados: 0, indefinidos: itens, erro: e };
          var meio = Math.ceil(itens.length / 2), a = itens.slice(0, meio), b = itens.slice(meio);
          return subir(a, isolar).then(function (r1) {
            if (r1.enviados === 0 && r1.indefinidos.length === a.length && a.length > 1 && !isolar) {
              return subirLote(b).then(function (n) {
                return { enviados: n, indefinidos: r1.indefinidos, erro: r1.erro };
              }, function (e2) {
                if (!e2 || e2.codigo === 'SEM_REDE' || e2.codigo === 'TOKEN_EXPIRED') throw e2;
                throw r1.erro || e2;
              });
            }
            return subir(b, isolar).then(function (r2) {
              return { enviados: r1.enviados + r2.enviados, indefinidos: r1.indefinidos.concat(r2.indefinidos), erro: r1.erro || r2.erro };
            });
          });
        });
      }
      var jaCulpados = {}; // quem levou tentativa neste envio não volta ao lote até o próximo envio
      var recebimentos = 0; // quantas vezes a precondição mandou receber antes de insistir
      /* A LÁPIDE DA PÁGINA QUE NUNCA SUBIU (N2): não há documento a apagar na
       * nuvem, e escrever a lápide criaria um documento órfão. Ela sai da fila
       * sem escrever nada. A página que subiu e cuja confirmação ainda não
       * anotou o carimbo não cai aqui: a confirmação repõe a lápide na fila
       * quando o carimbo chega (confirmarEnvio). */
      function descartarLapidesOrfas(itens) {
        var orfas = itens.filter(function (i) {
          var reg = i.registro;
          return reg.tipo === 'folha' && reg.apagadoEm && !(reg.nuvem && (reg.nuvem.updateTime || reg.nuvem.servidorEm));
        });
        if (!orfas.length) return Promise.resolve(itens);
        return root.Store.confirmarEnvio(orfas.map(function (i) {
          return { id: i.fila.id, tipo: 'folha', atualizadoEm: i.fila.atualizadoEm, apagadoEm: i.registro.apagadoEm, hash: null, nuvem: null };
        })).then(function () {
          lapidesDescartadas += orfas.length;
          return itens.filter(function (i) { return orfas.indexOf(i) < 0; });
        });
      }
      function proximoLote() {
        return quarentenaLida.then(lerLote);
      }
      function lerLote() {
        return root.Store.registrosDaFila(REGISTROS_POR_COMMIT, { tudo: !!info.tudo }).then(function (itens) {
          // páginas de folha recém-gravadas que esperam mais traços (N2): o envio volta daqui a pouco
          if (itens.adiadas) adiadas = itens.adiadas;
          /* Sem WebCrypto ou sem CompressionStream a folha NÃO SOBE: as páginas
           * ficam na fila e a frase vai para Ajustes e para o diagnóstico. */
          if (!suportaFolhas()) {
            var comFolhas = itens.length;
            itens = itens.filter(function (i) { return !(i.registro && i.registro.tipo === 'folha'); });
            folhasSemSuporte += comFolhas - itens.length;
          }
          itens = itens.filter(function (i) { return !!i.registro && !jaCulpados[i.fila.id]; });
          if (!itens.length || lotes >= 50) return { enviados: enviados };
          lotes++;
          return descartarLapidesOrfas(itens).then(function (itens) {
            if (!itens.length) return { enviados: 0, indefinidos: [], erro: null };
            return subir(itens, recebimentos >= 2);
          }).then(null, function (e) {
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
              return r.enviados > 0 || (r.erro && (r.erro.codigo === 'INVALID_ARGUMENT' || r.erro.codigo === 'FAILED_PRECONDITION'));
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
        /* As páginas que este navegador não consegue subir (sem WebCrypto ou
         * sem CompressionStream) ficam na fila, e a frase fica aqui: Ajustes e o
         * diagnóstico (D7) a mostram. */
        if (folhasSemSuporte) {
          var codigoSuporte = root.Store && typeof root.Store.temWebCrypto === 'function' && !root.Store.temWebCrypto() ? 'SEM_WEBCRYPTO' : 'SEM_COMPRESSAO';
          registros.erro = { codigo: codigoSuporte, quando: new Date().toISOString(), mensagem: FRASES[codigoSuporte] };
        }
        /* A PÁGINA GRANDE DEMAIS fica na quarentena, e a frase fica aqui enquanto
         * ela estiver lá (a deste envio ou de um anterior): Ajustes diz qual
         * folha (pela lista em registros.paginasGrandes) e o diagnóstico leva o
         * código e a frase. */
        if (paginasGrandes || (registros.paginasGrandes && registros.paginasGrandes.length)) {
          registros.erro = { codigo: 'PAGINA_GRANDE', quando: new Date().toISOString(), mensagem: FRASES.PAGINA_GRANDE };
        }
        registros.ultimoEnvio = { quando: new Date().toISOString(), enviados: r.enviados, lapidesDescartadas: lapidesDescartadas };
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
    var limpar = function () {
      enviandoRegistros = null;
      registros.folhasAdiadas = adiadas;
      // o "sobe tudo agora" que chegou durante este envio roda agora
      if (tudoPendente) {
        tudoPendente = false;
        setTimeout(function () { enviarRegistros(Object.assign({}, ultimaInfoDeEnvio, { tudo: true })).catch(function () { /* o erro ficou em registros.erro */ }); }, 0);
      }
      /* Páginas de folha que esperavam mais traços (N2): o envio volta quando a
       * espera acabar, sem depender de outra gravação dela. */
      if (adiadas && registrosDevidos()) {
        if (envioAgendado) clearTimeout(envioAgendado);
        envioAgendado = setTimeout(function () {
          envioAgendado = null;
          enviarRegistros().catch(function () { /* o erro ficou em registros.erro */ });
        }, (root.Store && root.Store.ESPERA_FOLHA) || 30000);
      }
      // a fila contada antes do diagnóstico: o resumo leva o tamanho de agora
      contarFila().then(avisarOuvintes, avisarOuvintes).then(gravarDiagnostico);
    };
    enviandoRegistros.then(limpar, limpar);
    return enviandoRegistros;
  }

  // ---------- o recebimento (N1, fatia 3) ----------

  var recebendo = null;
  /* Busca no servidor os registros com `servidorEm` depois do cursor deste
   * aparelho, em ordem, e aplica (Store.aplicarRecebidos decide por registro
   * e confere a sincronização desligada dentro da própria transação). O
   * celular só leitura também recebe: é leitura na nuvem e a escrita local
   * passa pela trava como a restauração. Nunca rejeita por recusa da nuvem: o
   * erro fica em registros.erroRecebimento. */
  function receberRegistros() {
    if (recebendo) return recebendo;
    var aplicados = 0, lidos = 0, paginas = 0, puladosAqui = 0, uidDona;
    recebendo = carregarEstado().then(function () {
      return lerSincronizacaoDesligada();
    }).then(function () {
      if (!sessao) return { pulado: 'sem conta', aplicados: 0 };
      if (sincronizacaoDesligada) return { pulado: 'desligada', aplicados: 0 };
      if (!online()) throw semRede();
      if (!root.Store || typeof root.Store.aplicarRecebidos !== 'function') return { pulado: 'sem store', aplicados: 0 };
      uidDona = (marcaCelular && marcaCelular.uidDona) || sessao.uid;
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
            /* Um documento do FORMATO ANTIGO (cifrado: com `iv`, ou com `dados` em
             * bytes; o formato de agora leva mapa, lista ou escalar, o ajuste é um
             * escalar) é PULADO: não aplica e não é eco, mas o cursor passa por
             * cima dele, senão seria lido para sempre. Nunca houve um na conta
             * dela; a contagem fica no estado, sem erro na tela. */
            var formatoAntigo = function (v) { return v.iv !== undefined || v.dados instanceof Uint8Array; };
            var regs = docs.map(function (d) {
              var v = valores(d.fields);
              return { id: v.id, tipo: v.tipo, atualizadoEm: v.atualizadoEm, apagadoEm: v.apagadoEm || null, aparelho: v.aparelho || '',
                esquema: v.esquema || 1, servidorEm: v.servidorEm || null, updateTime: d.updateTime || null, nome: d.name,
                dados: v.apagadoEm ? null : (v.dados === undefined ? null : v.dados), eco: !!(meuId && v.aparelho === meuId), antigo: formatoAntigo(v) };
            });
            var pulados = regs.filter(function (r) { return r.antigo; });
            puladosAqui += pulados.length;
            var aplicaveis = regs.filter(function (r) { return !r.antigo && !r.eco; });
            var ecos = regs.filter(function (r) { return !r.antigo && r.eco; });
            var ultimo = regs.length ? { servidorEm: regs[regs.length - 1].servidorEm, nome: regs[regs.length - 1].nome } : null;
            /* O eco vai com o id e o carimbo, marcado: o Store anota o carimbo no
             * registro deste aparelho (mais novo vale), tira da fila a entrada que
             * o eco já é, e avança o cursor. */
            var lote = aplicaveis.concat(ecos.map(function (r) {
              return { id: r.id, tipo: r.tipo, aparelho: r.aparelho, esquema: r.esquema, eco: true, servidorEm: r.servidorEm, nome: r.nome, updateTime: r.updateTime,
                atualizadoEm: r.atualizadoEm, apagadoEm: r.apagadoEm, dados: r.dados };
            })).concat(pulados.map(function (r) {
              // sem id: o Store só avança o cursor por cima dele
              return { servidorEm: r.servidorEm, nome: r.nome };
            }));
            // nada a aplicar: nenhuma transação de escrita (o celular em dia não grava nada)
            var aplicar = lote.length ? root.Store.aplicarRecebidos(lote) : Promise.resolve({ aplicados: 0 });
            return aplicar.then(function (contas) {
              if (contas.pulado === 'desligada') { sincronizacaoDesligada = true; return { pulado: 'desligada', aplicados: aplicados, lidos: lidos }; }
              aplicados += contas.aplicados;
              if (docs.length < 300 || !ultimo || !ultimo.servidorEm) return { aplicados: aplicados, lidos: lidos };
              desde = ultimo;
              return pagina();
            });
          });
        }
        return pagina();
      });
    }).then(function (r) {
      if (r.pulado) return r;
      // depois dos registros, as páginas de folha (N2), com cursor próprio
      return receberFolhas(uidDona).then(function (f) {
        r.folhas = f.aplicados || 0;
        r.folhasInvalidas = f.invalidas || 0;
        return r;
      });
    }).then(function (r) {
      if (!r.pulado) {
        registros.erroRecebimento = null;
        registros.puladosFormatoAntigo = (registros.puladosFormatoAntigo || 0) + puladosAqui;
        registros.folhasInvalidas = (registros.folhasInvalidas || 0) + (r.folhasInvalidas || 0);
        registros.ultimoRecebimento = { quando: new Date().toISOString(), aplicados: r.aplicados, lidos: r.lidos, puladosFormatoAntigo: puladosAqui, folhas: r.folhas || 0 };
      }
      return r;
    }, function (e) {
      registros.erroRecebimento = { codigo: (e && e.codigo) || 'ERRO', quando: new Date().toISOString(), mensagem: (e && e.message) || '' };
      return { aplicados: aplicados, erro: registros.erroRecebimento };
    });
    var limpar = function () { recebendo = null; avisarOuvintes(); gravarDiagnostico(); };
    recebendo.then(limpar, limpar);
    return recebendo;
  }

  /* As PÁGINAS DE FOLHA que chegaram (N2): a coleção `folhas`, em ordem de
   * (servidorEm, nome), depois do cursor próprio (controle/cursorFolhas), em
   * páginas de 50 (os documentos são maiores). Cada documento é descomprimido
   * e o hash do texto é CONFERIDO: o que não bate (ou não abre) é pulado e
   * contado, e o cursor passa por cima dele. O eco é o do próprio aparelho. */
  function receberFolhas(uidDona) {
    var aplicados = 0, lidos = 0, invalidas = 0, paginas = 0;
    if (!root.Store || typeof root.Store.aplicarFolhasRecebidas !== 'function') return Promise.resolve({ aplicados: 0 });
    return root.Store.lerCursorFolhas().then(function (cursor) {
      var desde = cursor && cursor.servidorEm ? { servidorEm: cursor.servidorEm, nome: cursor.nome || null } : null;
      function montarConsulta(c) {
        var q = { from: [{ collectionId: 'folhas' }],
          orderBy: [{ field: { fieldPath: 'servidorEm' }, direction: 'ASCENDING' }, { field: { fieldPath: '__name__' }, direction: 'ASCENDING' }],
          limit: 50 };
        if (c && c.servidorEm) {
          var v = [{ timestampValue: c.servidorEm }];
          if (c.nome) v.push({ referenceValue: c.nome });
          q.startAt = { values: v, before: !c.nome };
        }
        return q;
      }
      function abrirPagina(v) {
        if (v.apagadoEm) return Promise.resolve({ pagina: null, ok: true });
        if (!(v.bytes instanceof Uint8Array) || typeof v.hash !== 'string' || !v.hash) return Promise.resolve({ ok: false });
        return descomprimir(v.bytes).then(function (texto) {
          return root.Store.sha256Hex(texto).then(function (hash) {
            if (hash !== v.hash) return { ok: false };
            var pagina = JSON.parse(texto);
            if (!pagina || typeof pagina !== 'object' || Array.isArray(pagina) || !Array.isArray(pagina.itens)) return { ok: false };
            return { ok: true, pagina: pagina };
          });
        }).catch(function () { return { ok: false }; });
      }
      function pagina() {
        if (paginas++ >= 50) return { aplicados: aplicados, lidos: lidos, invalidas: invalidas };
        return comToken(function (cab) {
          return pedir(urlDoc(raizDocumentos() + '/usuarios/' + uidDona) + ':runQuery', { cabecalhos: cab, corpo: { structuredQuery: montarConsulta(desde) } });
        }).then(function (resposta) {
          var docs = (resposta || []).filter(function (x) { return x && x.document; }).map(function (x) { return x.document; });
          lidos += docs.length;
          var meuId = idDoAparelho();
          return Promise.all(docs.map(function (d) {
            var v = valores(d.fields);
            var base = { servidorEm: v.servidorEm || null, nome: d.name };
            if (typeof v.id !== 'string' || !root.Store.partesDoIdDaPagina(v.id)) { invalidas++; return base; }
            return abrirPagina(v).then(function (r) {
              /* INVÁLIDO (o hash não bate, ou não abre): o conteúdo nunca entra; só
               * o carimbo do servidor é anotado no estado local da página, para a
               * próxima escrita deste aparelho passar na precondição e cobrir o
               * documento ruim. */
              if (!r.ok) { invalidas++; return Object.assign(base, { id: v.id, invalido: true, updateTime: d.updateTime || null }); }
              return Object.assign(base, { id: v.id, hash: v.hash || null, pagina: r.pagina, apagadoEm: v.apagadoEm || null, atualizadoEm: v.atualizadoEm || null,
                aparelho: v.aparelho || '', updateTime: d.updateTime || null, eco: !!(meuId && v.aparelho === meuId) });
            });
          })).then(function (lote) {
            var ultimo = lote.length ? lote[lote.length - 1] : null;
            var aplicar = lote.length ? root.Store.aplicarFolhasRecebidas(lote) : Promise.resolve({ aplicados: 0 });
            return aplicar.then(function (contas) {
              if (contas.pulado === 'desligada') { sincronizacaoDesligada = true; return { pulado: 'desligada', aplicados: aplicados, lidos: lidos, invalidas: invalidas }; }
              aplicados += contas.aplicados || 0;
              if (docs.length < 50 || !ultimo || !ultimo.servidorEm) return { aplicados: aplicados, lidos: lidos, invalidas: invalidas };
              desde = ultimo;
              return pagina();
            });
          });
        });
      }
      return pagina();
    });
  }
  /* Receber e depois enviar: a ordem que faz a precondição passar na maior
   * parte das vezes. O aparelho que só lê só recebe; o celular da dona envia
   * os registros dele. */
  function sincronizar(info) {
    return receberRegistros().then(function (r) {
      if (!podeEnviarRegistros()) return { recebidos: r, enviados: { pulado: 'so leitura', enviados: 0 } };
      return enviarRegistros(info).then(function (e) { return { recebidos: r, enviados: e }; });
    });
  }
  function sincronizarSeDevido(info) {
    if (!(sessao && online()) || sincronizacaoDesligada) return Promise.resolve({ pulado: sincronizacaoDesligada ? 'desligada' : 'indevido' });
    return sincronizar(info);
  }

  // ---------- o diagnóstico por aparelho (D7) ----------

  /* A tela informa o que só ela sabe: a versão do aplicativo e o resultado do
   * navigator.storage.persist() desta abertura. */
  function informar(info) {
    info = info || {};
    if (info.versaoApp !== undefined) versaoApp = String(info.versaoApp || '');
    if (info.persistente !== undefined) persistente = info.persistente === null ? null : !!info.persistente;
  }
  /* Um erro de script anotado SEM a mensagem: só o nome do erro e o lugar
   * (arquivo e linha). A mensagem poderia carregar um pedaço de dado. */
  function anotarErroScript(nome, arquivo, linha) {
    var lugar = String(arquivo || '').split(/[\\/]/).pop().split('?')[0];
    erroScript = { codigo: 'SCRIPT', quando: new Date().toISOString(),
      frase: 'Erro no aplicativo (' + (String(nome || 'Erro').slice(0, 40)) + (lugar ? ' em ' + lugar.slice(0, 40) + (linha ? ':' + linha : '') : '') + ').' };
  }
  /* A frase de um código, sempre a fixa daqui: nunca a mensagem de um erro. */
  function fraseDoCodigo(codigo) {
    if (codigo === 'SEM_REDE') return 'Sem internet.';
    if (codigo === 'SO_LEITURA') return recusaSoLeitura().message;
    return FRASES[codigo] || 'A nuvem não respondeu como esperado.';
  }
  /* Um rótulo curto do navegador, só para o painel: "Safari iOS", "Chrome
   * Android", "Chrome", "Samsung Internet"... */
  function rotuloDoNavegador() {
    var ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
    if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1)) {
      return /CriOS/.test(ua) ? 'Chrome iOS' : /FxiOS/.test(ua) ? 'Firefox iOS' : 'Safari iOS';
    }
    if (/Android/.test(ua)) return /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /Chrome/.test(ua) ? 'Chrome Android' : 'Android';
    if (/Edg\//.test(ua)) return 'Edge';
    if (/Firefox/.test(ua)) return 'Firefox';
    if (/Chrome/.test(ua)) return 'Chrome';
    if (/Safari/.test(ua)) return 'Safari';
    return 'navegador';
  }
  function instaladoNaTela() {
    if (typeof navigator !== 'undefined' && navigator.standalone === true) return true;
    try { return !!(root.matchMedia && root.matchMedia('(display-mode: standalone)').matches); } catch (e) { return false; }
  }
  /* O último erro conhecido deste aparelho, entre os quatro lugares. */
  function ultimoErro() {
    var candidatos = [
      registros.erro && { codigo: registros.erro.codigo, quando: registros.erro.quando, origem: 'envio' },
      registros.erroRecebimento && { codigo: registros.erroRecebimento.codigo, quando: registros.erroRecebimento.quando, origem: 'recebimento' },
      erroCopia && { codigo: erroCopia.codigo, quando: erroCopia.quando, origem: 'copia' },
      erroScript && { codigo: erroScript.codigo, quando: erroScript.quando, origem: 'script', frase: erroScript.frase }
    ].filter(Boolean);
    candidatos.sort(function (a, b) { return String(b.quando).localeCompare(String(a.quando)); });
    return candidatos[0] || null;
  }
  /* O resumo que sobe: só metadados. Nenhum campo leva nome, aula, nota,
   * valor ou mensagem livre; as regras do Firestore conferem os nomes dos
   * campos (hasOnly) e o tamanho de cada um. */
  function montarDiagnostico(id) {
    var d = { aparelhoId: id, aparelho: aparelho || 'aparelho', papel: marcaCelular ? 'celular' : 'tablet',
      app: String(versaoApp || '').slice(0, 32), quando: new Date().toISOString(),
      pendentes: Number(registros.pendentes) || 0, quarentena: Number(registros.quarentena) || 0,
      ultimoEnvio: (registros.ultimoEnvio && registros.ultimoEnvio.quando) || null,
      ultimoRecebimento: (registros.ultimoRecebimento && registros.ultimoRecebimento.quando) || null,
      ultimaCopia: (ultimaCopia && ultimaCopia.quando) || null,
      sincronizacao: sincronizacaoDesligada ? 'desligada' : 'ligada',
      navegador: rotuloDoNavegador(), instalado: instaladoNaTela(),
      persistente: persistente === null ? null : !!persistente };
    var e = ultimoErro();
    if (e) {
      d.erroCodigo = String(e.codigo || 'ERRO').slice(0, 40);
      d.erroFrase = String(e.frase || fraseDoCodigo(e.codigo)).slice(0, 200);
      d.erroQuando = String(e.quando || '').slice(0, 40);
      d.erroOrigem = e.origem;
    }
    return d;
  }
  function assinaturaDoDiagnostico(d) {
    var copia = {};
    Object.keys(d).forEach(function (k) { if (k !== 'quando') copia[k] = d[k]; });
    return JSON.stringify(copia);
  }
  /* Sobe o resumo deste aparelho, se mudou e se a última subida tem mais de
   * uma hora. Só de quem escreve na nuvem (o tablet e o celular da dona): o
   * observador de outra conta não passa pelo commit, e nada dele sobe. Nunca
   * rejeita e nunca mexe em registros.erro: uma recusa daqui (as regras
   * ainda sem o diagnóstico) fica quieta e a próxima sincronização tenta. */
  function gravarDiagnostico() {
    if (!sessao || !podeEnviarRegistros() || !online()) return Promise.resolve({ pulado: 'indevido' });
    /* O celular da dona é "aparelho que escreve" só depois de escrever: um
     * celular que só consulta não sobe nem o resumo (nenhum commit sai dele,
     * como antes do D6b). Com uma mudança dele na fila, na quarentena ou
     * acabada de subir, o resumo passa a subir, porque é aí que o erro dele
     * importa. (Um envio de fila vazia e o "sem internet" de um celular que
     * nada tinha a subir não contam.) */
    if (!podeEnviarCopia() && !(registros.pendentes || registros.quarentena || (registros.ultimoEnvio && registros.ultimoEnvio.enviados > 0))) {
      return Promise.resolve({ pulado: 'celular sem escrita' });
    }
    var id = idDoAparelho();
    if (!id) return Promise.resolve({ pulado: 'sem aparelho' });
    if (gravandoDiagnostico) return gravandoDiagnostico;
    /* A anotação da última subida é lida do banco próprio a cada vez: duas
     * abas do mesmo tablet dividem a mesma, e não sobem duas vezes. */
    gravandoDiagnostico = lerEstado('diagnostico').then(function (anotado) { return anotado || ultimoDiagnostico; }, function () { return ultimoDiagnostico; }).then(function (anotado) {
      var resumo = montarDiagnostico(id);
      var assinatura = assinaturaDoDiagnostico(resumo);
      if (anotado && anotado.assinatura === assinatura) return { pulado: 'igual' };
      if (anotado && anotado.quando) {
        var ha = Date.now() - new Date(anotado.quando).getTime();
        if (ha >= 0 && ha < UMA_HORA) return { pulado: 'hora' };
      }
      return commit([gravacao(nomeDoc(sessao.uid, 'diagnostico/' + id), resumo)]).then(function () {
        ultimoDiagnostico = { quando: resumo.quando, assinatura: assinatura };
        return gravarEstado('diagnostico', ultimoDiagnostico).catch(function () { /* fica em memória */ }).then(function () { return { gravado: true }; });
      }, function (e) {
        return { erro: (e && e.codigo) || 'ERRO' };
      });
    });
    var limpar = function () { gravandoDiagnostico = null; };
    gravandoDiagnostico.then(limpar, limpar);
    return gravandoDiagnostico;
  }
  /* O observador (D7) lê os resumos de todos os aparelhos da dona. uidDona:
   * a conta da cópia; sem ele, a própria. As regras decidem quem lê. */
  function listarDiagnosticos(uidDona) {
    return carregarEstado().then(function () {
      if (!sessao) throw erro('TOKEN_EXPIRED');
      var uid = uidDona || (marcaCelular && marcaCelular.uidDona) || sessao.uid;
      return comToken(function (cab) {
        return pedir(urlDoc(nomeDoc(uid, 'diagnostico')) + '?pageSize=50', { cabecalhos: cab });
      });
    }).then(function (resposta) {
      var docs = (resposta && resposta.documents) || [];
      return docs.map(function (d) {
        var v = valores(d.fields);
        v.aparelhoId = v.aparelhoId || String(d.name || '').split('/').pop();
        return v;
      }).sort(function (a, b) { return String(b.quando || '').localeCompare(String(a.quando || '')); });
    });
  }
  /* "Esquecer este aparelho": a dona, no tablet, apaga o resumo de um aparelho
   * antigo da lista. Passa pelo commit: só o tablet (podeEnviarCopia) chega
   * aqui; o celular e o observador são recusados. */
  function esquecerDiagnostico(aparelhoId) {
    aparelhoId = String(aparelhoId || '').trim();
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(aparelhoId)) return Promise.reject(new Error('Este aparelho não foi encontrado.'));
    if (!sessao) return Promise.reject(erro('TOKEN_EXPIRED'));
    if (aparelhoId === idDoAparelho()) return Promise.reject(new Error('Este é o aparelho atual; ele refaz o resumo sozinho.'));
    return commit([remocao(nomeDoc(sessao.uid, 'diagnostico/' + aparelhoId))]).then(function () { return true; });
  }
  /* O que este aparelho diria de si, sem subir nada: o painel do observador
   * mostra o próprio aparelho por aqui, e nada disso é gravado nele. */
  function diagnosticoLocal() {
    return montarDiagnostico(idDoAparelho() || 'este-aparelho');
  }

  function estado() {
    return {
      disponivel: disponivel(),
      bancoIndisponivel: problemaBanco,
      entrada: sessao ? { email: sessao.email, uid: sessao.uid } : null,
      ultimaCopia: ultimaCopia,
      automatica: automatica,
      pendente: pendente,
      enviando: !!enviando,
      aparelho: aparelho,
      aparelhoId: idDoAparelho(),
      registros: { pendentes: registros.pendentes, quarentena: registros.quarentena, ultimoEnvio: registros.ultimoEnvio,
        erro: registros.erro, enviando: !!enviandoRegistros, ultimoRecebimento: registros.ultimoRecebimento || null,
        erroRecebimento: registros.erroRecebimento || null, recebendo: !!recebendo, puladosFormatoAntigo: registros.puladosFormatoAntigo || 0,
        folhasAdiadas: registros.folhasAdiadas || 0, folhasInvalidas: registros.folhasInvalidas || 0, paginasGrandes: (registros.paginasGrandes || []).slice() },
      // a marca "este aparelho é celular"; quem edita nele é só a dona (celularDaDona)
      celular: !!marcaCelular,
      celularDaDona: celularDaDona(),
      observador: !!(marcaCelular && marcaCelular.uidDona && sessao && sessao.uid && marcaCelular.uidDona !== sessao.uid),
      uidDona: marcaCelular ? marcaCelular.uidDona : null,
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
  // o último erro de script entra no diagnóstico (D7), só o nome e o lugar
  if (typeof root.addEventListener === 'function') {
    root.addEventListener('error', function (ev) {
      anotarErroScript(ev && ev.error && ev.error.name, ev && ev.filename, ev && ev.lineno);
    });
  }
  if (disponivel()) carregarEstado();

  root.Nuvem = {
    disponivel: disponivel, pronto: carregarEstado, estado: estado, aoMudar: aoMudar,
    entrar: entrar, sair: sair, esqueciASenha: esqueciASenha, trocarSenha: trocarSenha,
    enviarCopia: enviarCopia, listarCopias: listarCopias, baixarCopia: baixarCopia, restaurou: restaurou,
    marcarCelular: marcarCelular, desmarcarCelular: desmarcarCelular, travarEnvio: travarEnvio,
    podeEnviarCopia: podeEnviarCopia, podeEnviarRegistros: podeEnviarRegistros, celularDaDona: celularDaDona,
    leitores: leitores, permitirLeitor: permitirLeitor, tirarLeitor: tirarLeitor,
    marcarMudanca: marcarMudanca, desligarAutomatica: desligarAutomatica,
    geracao: function () { return geracao; },
    enviarRegistros: enviarRegistros, enviarRegistrosSeDevido: enviarRegistrosSeDevido, contarFila: contarFila,
    receberRegistros: receberRegistros, sincronizar: sincronizar, sincronizarSeDevido: sincronizarSeDevido,
    copiaAutomaticaDevida: copiaAutomaticaDevida, copiaDiariaDevida: copiaDiariaDevida,
    informar: informar, gravarDiagnostico: gravarDiagnostico, listarDiagnosticos: listarDiagnosticos, diagnosticoLocal: diagnosticoLocal,
    esquecerDiagnostico: esquecerDiagnostico,
    fraseDoCodigo: fraseDoCodigo, rotuloDoNavegador: rotuloDoNavegador, instaladoNaTela: instaladoNaTela,
    fraseDeQuando: fraseDeQuando,
    comprimir: comprimir, descomprimir: descomprimir,
    TETO_PARTE: TETO_PARTE, TETO_PAGINA_BYTES: TETO_PAGINA_BYTES
  };
})(typeof self !== 'undefined' ? self : this);
