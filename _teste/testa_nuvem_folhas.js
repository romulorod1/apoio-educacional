/* testa_nuvem_folhas.js
 *
 * N2, fase 2 da nuvem, fatia 1: A FOLHA SOBE POR PÁGINA e é recebida, contra o
 * Firebase Emulator Suite, com o tablet A (dono da folha), o celular C da
 * dona e o observador O (outra conta).
 *
 * O que prova, com dados fictícios:
 *   1. A escreve uma folha de duas páginas (traços com coordenadas de fração
 *      longa, texto e fundo); a página recém-gravada ESPERA (folhasAdiadas) e
 *      sobe com `tudo`; cada página vira um documento em usuarios/{uid}/folhas
 *      com hash, bytes gzip, n e aulaId; o hash do documento é o SHA-256 do
 *      texto descomprimido, e o texto é a página canônica (pontos a 0,1);
 *   2. C restaura a cópia e RECEBE as páginas: a folha em C é igual à de A
 *      PONTO POR PONTO depois do arredondamento; "Ver a folha" abre a janela
 *      só para ler, sem barra de ferramentas e sem "Salvo"; a caneta no editor
 *      só leitura não cria traço (e no editor normal cria: controle);
 *   3. A edita só a página 2: sobe UM documento, e o da página 1 não muda;
 *   4. A salva a mesma folha de novo: zero páginas na fila, zero escritas;
 *   5. A apaga a página 2: a lápide sobe sem bytes e C fica com uma página;
 *   6. C tenta gravar a folha: a trava recusa, nada muda, nada sobe de C;
 *   7. um documento ADULTERADO (bytes de outra página, hash de outra coisa)
 *      posto direto no emulador não entra em C: é contado como inválido;
 *   8. a página sintética densa (12.000 pontos) sobe num documento só, e o
 *      tamanho (texto e gzip) é impresso, para o livro;
 *   9. O (observador, outra conta) restaura a cópia da dona pelo código da
 *      conta, recebe as folhas e nada sobe dele.
 *
 * Venenos, que TÊM de reprovar a propriedade (a rodada passa quando a prova VÊ
 * o veneno):
 *   --envenenado-sem-hash            o documento da página sobe sem `hash`: as
 *                                    regras TÊM de recusar (e a prova vê a recusa);
 *   --envenenado-regrava-igual       a comparação de hash sai do salvarNota: a
 *                                    mesma folha salva de novo TEM de subir de novo;
 *   --envenenado-celular-edita-folha a trava deixa `notas` passar no celular: a
 *                                    gravação TEM de ser vista passando;
 *   --envenenado-aplica-sem-conferir-hash o recebimento aplica o documento cujo
 *                                    hash não bate: a página adulterada TEM de entrar.
 *
 * Portas: 8901 (app), 8903 (auth), 8904 (firestore), 8905 (hub), 8906 (log),
 * 8907 (websocket). Precisa do firebase-tools e de um JDK 21 em JAVA_HOME.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const cryptoNode = require('crypto');
const { spawn, spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

/* Revisão do PR 133 (seções 10 a 15):
 *  10. a lápide da página que nunca subiu sai da fila sem virar documento;
 *  11. excluir a aula pela tela lapida a folha na nuvem; a aula que volta a traz;
 *  12. a restauração não apaga o próprio estado das folhas (apaga por faixa,
 *      não por cursor), a fila esvazia e a página que a nuvem tem e a cópia
 *      não vira lápide: a nuvem fica igual à cópia, e o celular também;
 *  13. a precondição que não se resolve recebendo isola a culpada em vez de
 *      prender a fila; na terceira vez ela vai para a quarentena;
 *  14. a página grande demais para a nuvem vai direto para a quarentena, com
 *      a frase em Ajustes dizendo qual folha (aluna e data), por quê e o que
 *      fazer; dividida, sobe;
 *  15. a volta de uma versão anterior (que grava a folha solta) reconcilia a
 *      folha com estado e a página nova sobe.
 * Venenos dessas seções (cada um TEM de ser visto):
 *   --envenenado-lapide-orfa             a lápide sem carimbo sobe e vira órfã;
 *   --envenenado-exclui-sem-lapide       a aula excluída não lapida a folha;
 *   --envenenado-limpa-por-cursor        a restauração apaga o estado por cursor
 *                                        (e apaga os próprios puts);
 *   --envenenado-restauro-sem-lapide     a página a mais fica viva na nuvem;
 *   --envenenado-precondicao-prende      a precondição falha prende a fila inteira;
 *   --envenenado-apaga-estado-no-apagar-tudo o "Apagar tudo" apaga o estado em vez
 *                                        de lapidar (a folha fica viva na nuvem);
 *   --envenenado-pagina-grande-tenta     a página grande derruba o lote e conta tentativa;
 *   --envenenado-sem-reconciliar         a volta de versão não reconcilia. */
const MODOS = ['--envenenado-sem-hash', '--envenenado-regrava-igual', '--envenenado-celular-edita-folha', '--envenenado-aplica-sem-conferir-hash',
  '--envenenado-lapide-orfa', '--envenenado-exclui-sem-lapide', '--envenenado-limpa-por-cursor', '--envenenado-restauro-sem-lapide',
  '--envenenado-precondicao-prende', '--envenenado-apaga-estado-no-apagar-tudo', '--envenenado-pagina-grande-tenta', '--envenenado-sem-reconciliar'];
const MODO = MODOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
function prop(rotulo, ok, veneno) {
  if (MODO && MODO === veneno) return conf('VENENO visto: ' + rotulo + ', e quebrou', ok, false);
  return conf(rotulo, ok, true);
}

const PORTA_APP = 8901, PORTA_AUTH = 8903, PORTA_FS = 8904, PORTA_HUB = 8905, PORTA_LOG = 8906, PORTA_WS = 8907;
const PROJETO = 'demo-nath-n2f1';
const AUTH = 'http://127.0.0.1:' + PORTA_AUTH;
const FS = 'http://127.0.0.1:' + PORTA_FS;
const FIREBASE = process.env.FIREBASE_TOOLS ||
  'C:/Users/romul/ferramentas/firebase-tools/node_modules/firebase-tools/lib/bin/firebase.js';
const JAVA_HOME = process.env.JAVA_HOME || '';
const DONA = { email: 'dona@exemplo.test', senha: 'senha-da-dona-1' };
const OBS = { email: 'observador@exemplo.test', senha: 'senha-do-observador-1' };

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const NUVEM = fs.readFileSync(path.join(H.RAIZ, 'nuvem.js'), 'utf8');
const STORE = fs.readFileSync(path.join(H.RAIZ, 'store.js'), 'utf8');
const DRAW = fs.readFileSync(path.join(H.RAIZ, 'draw.js'), 'utf8');
const REGRAS = fs.readFileSync(path.join(H.RAIZ, 'firestore.rules'), 'utf8');

secao('0. As âncoras, o veneno e o ambiente');
const HASH_NO_DOC = 'campo.hash = r[0];';
const COMPARA_HASH = 'if (p && !p.apagadoEm && p.hash && p.hash === hash) {';
const TRAVA = "if (modo === 'readwrite' && soLeitura && porta !== true && !(celularEdita && PORTAS_DO_CELULAR[porta])) throw erroSoLeitura();";
const CONFERE_HASH = 'if (hash !== v.hash) return { ok: false };';
conf('o hash entra no documento da página num lugar só', NUVEM.split(HASH_NO_DOC).length, 2);
conf('a comparação de hash do salvarNota está num lugar só', STORE.split(COMPARA_HASH).length, 2);
conf('a trava do banco está num lugar só', STORE.split(TRAVA).length, 2);
conf('o recebimento confere o hash num lugar só', NUVEM.split(CONFERE_HASH).length, 2);
conf('o commit recusa `folhas/` fora do tablet', NUVEM.indexOf('if (!podeEnviarCopia() && temFolhas(escritas)) return Promise.reject(recusaSoLeitura());') > 0, true);
conf('o editor só leitura trata todo ponteiro como dedo, num lugar só', DRAW.split('return !!this.opcoes.soLeitura || e.pointerType === \'touch\';').length, 2);
conf('o celular abre a folha só para ler pelo cartão da aula', APP.indexOf("'data-ver-folha': a.id") > 0 && APP.indexOf('function abrirFolhaParaLer(aulaId)') > 0, true);
conf('o fechar da folha só leitura não passa pelo gravarNota', APP.indexOf('if (leitorDeFolha) { fecharLeitorDeFolha(); return; }') > 0, true);
conf('as regras têm o caminho das folhas com hash obrigatório na página viva', /match \/folhas\/\{folha\}/.test(REGRAS) && REGRAS.indexOf("(('apagadoEm' in d) || ('hash' in d && 'bytes' in d))") > 0, true);
conf('as regras recusam a lápide com bytes', REGRAS.indexOf("(!('apagadoEm' in d) || !('bytes' in d))") > 0, true);
conf('a página canônica arredonda a 0,1, a regra da cópia', STORE.indexOf('ponto[i] = Math.round(ponto[i] * 10) / 10;') > 0 && STORE.indexOf('copia.paginas = (copia.paginas || []).map(arredondarPagina);') > 0, true);
/* Revisão da fatia 1: sem WebCrypto não há hash de outro algoritmo (a página
 * ficaria inválida para sempre em todo receptor): o sha256Hex rejeita, o
 * envio pula as páginas e diz a frase, e as regras só aceitam 64 hexadecimais. */
conf('sem WebCrypto o sha256Hex rejeita, e não há hash de outro algoritmo', STORE.indexOf("if (!temWebCrypto()) return Promise.reject(") > 0 && STORE.indexOf("hashTexto(texto + '\\u0001')") < 0, true);
conf('sem suporte, o envio pula as páginas de folha e guarda a frase em registros.erro', NUVEM.indexOf('if (!suportaFolhas()) {') > 0 && NUVEM.indexOf("registros.erro = { codigo: codigoSuporte, quando: new Date().toISOString(), mensagem: FRASES[codigoSuporte] };") > 0, true);
conf('as regras só aceitam hash de 64 caracteres', REGRAS.indexOf('d.hash is string && d.hash.size() == 64') > 0, true);
conf('o "sobe tudo agora" que chega com um envio em voo roda de novo ao fim dele', NUVEM.indexOf('if (enviandoRegistros) { if (info.tudo) tudoPendente = true; return enviandoRegistros; }') > 0 && NUVEM.indexOf('if (tudoPendente) {') > 0, true);
conf('ao fechar, o commit vai com keepalive quando o corpo cabe', NUVEM.indexOf('keepalive: !!(opcoes && opcoes.keepalive)') > 0 && NUVEM.indexOf('corpo.length <= TETO_KEEPALIVE') > 0 && APP.indexOf("fechando: motivo === 'fechar'") > 0, true);
conf('a folha que chega com o editor aberto nela é guardada antes da próxima gravação, com aviso', APP.indexOf('return Store.guardarVersaoRecebida(aulaNoEditor);') > 0 && APP.indexOf("'Esta folha mudou no outro tablet; a versão de lá ficou guardada.'") > 0 && STORE.indexOf('function guardarVersaoRecebida(aulaId)') > 0, true);
const trocas = {};
if (MODO === MODOS[0]) trocas['/nuvem.js'] = NUVEM.replace(HASH_NO_DOC, '');
if (MODO === MODOS[1]) trocas['/store.js'] = STORE.replace(COMPARA_HASH, 'if (false) {');
if (MODO === MODOS[2]) trocas['/store.js'] = STORE.replace(TRAVA, "if (modo === 'readwrite' && soLeitura && porta !== true && !(celularEdita && PORTAS_DO_CELULAR[porta]) && [].concat(nomes).indexOf('notas') < 0) throw erroSoLeitura();");
if (MODO === MODOS[3]) trocas['/nuvem.js'] = NUVEM.replace(CONFERE_HASH, 'if (false) return { ok: false };');
/* As âncoras da revisão do PR 133, cada uma num lugar só. */
const LAPIDE_ORFA = "return reg.tipo === 'folha' && reg.apagadoEm && !(reg.nuvem && (reg.nuvem.updateTime || reg.nuvem.servidorEm));";
const AULA_LEVA_FOLHA = 'if (!opcoes.semFolhas) ajustarFolhasDasAulas(t, contas.aulasApagadas, contas.aulasRevividas, agora, saida);';
const LIMPA_POR_FAIXA = 'apagarFaixaDeControle(t, PREFIXO_FOLHA);';
const RESTAURO_LAPIDA = 'if (!velho || !velho.nuvem) continue; // nunca subiu: nada a lapidar na nuvem';
const ISOLA_PRECONDICAO = 'return subir(itens, recebimentos >= 2);';
const APAGAR_TUDO_LAPIDA = 'lapidarEstadoDasFolhas(t, agora);';
const PAGINA_GRANDE_MARCA = "if (e && e.codigo === 'PAGINA_GRANDE') return { grande: true, id: i.fila.id };";
const RECONCILIA = 'Store.reconciliarFolhas().catch(function () { /* a próxima gravação da folha acerta */ });';
conf('o descarte da lápide sem carimbo está num lugar só', NUVEM.split(LAPIDE_ORFA).length, 2);
conf('a aula que vira lápide leva a folha, num lugar só (o escritor de diferença)', STORE.split(AULA_LEVA_FOLHA).length, 2);
conf('o estado das folhas é apagado por faixa, num lugar só', STORE.split(LIMPA_POR_FAIXA).length, 2);
conf('a restauração lapida a página que a cópia não tem, num lugar só', STORE.split(RESTAURO_LAPIDA).length, 2);
conf('a precondição esgotada isola a culpada, num lugar só', NUVEM.split(ISOLA_PRECONDICAO).length, 2);
conf('o "Apagar tudo" lapida o estado das folhas na transação do documento', STORE.split(APAGAR_TUDO_LAPIDA).length, 2);
conf('a página grande é marcada no lote, num lugar só', NUVEM.split(PAGINA_GRANDE_MARCA).length, 2);
conf('a volta de versão reconcilia as folhas, num lugar só', APP.split(RECONCILIA).length, 2);
if (MODO === MODOS[4]) trocas['/nuvem.js'] = NUVEM.replace(LAPIDE_ORFA, 'return false;');
if (MODO === MODOS[5]) trocas['/store.js'] = STORE.replace(AULA_LEVA_FOLHA, 'if (false) ajustarFolhasDasAulas(t, [], [], agora, saida);');
if (MODO === MODOS[6]) trocas['/store.js'] = STORE.replace(LIMPA_POR_FAIXA, 'varrerControle(t, PREFIXO_FOLHA, function (chave, valor, cursor) { cursor.delete(); });');
if (MODO === MODOS[7]) trocas['/store.js'] = STORE.replace(RESTAURO_LAPIDA, 'continue;');
if (MODO === MODOS[8]) trocas['/nuvem.js'] = NUVEM.replace(ISOLA_PRECONDICAO, 'return subir(itens, false);');
if (MODO === MODOS[9]) trocas['/store.js'] = STORE.replace(APAGAR_TUDO_LAPIDA, 'limparEstadoDasFolhas(t);');
if (MODO === MODOS[10]) trocas['/nuvem.js'] = NUVEM.replace(PAGINA_GRANDE_MARCA, 'if (false) return null;');
if (MODO === MODOS[11]) trocas['/app.js'] = APP.replace(RECONCILIA, '');
if (MODO) conf('o arquivo servido ficou diferente do repositório (' + MODO + ')', (trocas['/store.js'] || STORE) !== STORE || (trocas['/nuvem.js'] || NUVEM) !== NUVEM || (trocas['/app.js'] || APP) !== APP, true);

conf('o firebase-tools está onde a prova procura (' + FIREBASE + ')', fs.existsSync(FIREBASE), true);
const javaExe = JAVA_HOME ? path.join(JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java';
const versaoJava = (function () {
  const r = spawnSync(javaExe, ['-version'], { encoding: 'utf8' });
  const m = /version "(\d+)/.exec((r.stderr || '') + (r.stdout || ''));
  return m ? Number(m[1]) : 0;
})();
conf('há um JDK 21 ou mais novo (' + (JAVA_HOME || 'java do PATH') + ', versão ' + versaoJava + ')', versaoJava >= 21, true);
if (!fs.existsSync(FIREBASE) || versaoJava < 21) {
  console.log('\n' + H.placar.passes + ' passaram, ' + H.placar.falhas + ' falharam.');
  process.exit(1);
}

/* ---------- o emulador ---------- */
const PASTA = path.join(os.tmpdir(), 'nath_n2f1_emulador_' + process.pid);
let emulador = null;
function subirEmulador(regras) {
  fs.mkdirSync(PASTA, { recursive: true });
  fs.writeFileSync(path.join(PASTA, 'firestore.rules'), regras);
  fs.writeFileSync(path.join(PASTA, 'firebase.json'), JSON.stringify({
    firestore: { rules: 'firestore.rules' },
    emulators: {
      auth: { host: '127.0.0.1', port: PORTA_AUTH },
      firestore: { host: '127.0.0.1', port: PORTA_FS, websocketPort: PORTA_WS },
      hub: { host: '127.0.0.1', port: PORTA_HUB },
      logging: { host: '127.0.0.1', port: PORTA_LOG },
      ui: { enabled: false },
      singleProjectMode: true
    }
  }, null, 2));
  const env = Object.assign({}, process.env);
  if (JAVA_HOME) env.PATH = path.join(JAVA_HOME, 'bin') + path.delimiter + (env.PATH || env.Path || '');
  emulador = spawn(process.execPath, [FIREBASE, 'emulators:start', '--only', 'auth,firestore', '--project', PROJETO, '--non-interactive'],
    { cwd: PASTA, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let saida = '';
  emulador.stdout.on('data', d => { saida += d; });
  emulador.stderr.on('data', d => { saida += d; });
  emulador.on('exit', c => { emulador.saiu = c; });
  return esperar('o emulador respondeu', async () => {
    if (emulador.saiu !== undefined) throw new Error('o emulador saiu: ' + saida.slice(-600));
    const a = await fetch(AUTH + '/').then(r => r.json()).catch(() => null);
    const f = await fetch(FS + '/').then(r => r.status).catch(() => 0);
    return !!(a && a.authEmulator && a.authEmulator.ready) && f === 200;
  }, v => v === true, 120000).then(r => {
    if (!r.ok) { console.log(saida.slice(-1500)); throw Object.assign(new Error('o emulador não subiu'), { jaContado: false }); }
  });
}
function derrubarEmulador() {
  return new Promise(resolve => {
    if (!emulador || emulador.saiu !== undefined) { resolve(); return; }
    emulador.on('exit', () => resolve());
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(emulador.pid), '/T', '/F'], { stdio: 'ignore' });
    else emulador.kill('SIGINT');
    setTimeout(resolve, 8000);
  }).then(() => { try { fs.rmSync(PASTA, { recursive: true, force: true }); } catch (e) { /* o log pode estar preso */ } });
}
async function rest(url, opcoes) {
  opcoes = opcoes || {};
  const cab = Object.assign({}, opcoes.cab || {});
  let corpo = opcoes.corpo;
  if (corpo !== undefined) { corpo = JSON.stringify(corpo); cab['Content-Type'] = 'application/json'; }
  if (opcoes.token) cab.Authorization = 'Bearer ' + opcoes.token;
  const r = await fetch(url, { method: opcoes.metodo || (corpo !== undefined ? 'POST' : 'GET'), headers: cab, body: corpo });
  const texto = await r.text();
  let json = null;
  try { json = texto ? JSON.parse(texto) : null; } catch (e) { json = null; }
  return { status: r.status, json };
}
const criarUsuario = (u) => rest(AUTH + '/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake',
  { corpo: { email: u.email, password: u.senha, returnSecureToken: true } });
const RAIZ_DOCS = 'projects/' + PROJETO + '/databases/(default)/documents';
const docUrl = (uid, rel) => FS + '/v1/' + RAIZ_DOCS + '/usuarios/' + uid + (rel ? '/' + rel : '');
const lerDoc = (token, uid, rel) => rest(docUrl(uid, encodeURIComponent(rel).replace(/%2F/g, '/')), { token });
const commitRest = (token, writes) => rest(FS + '/v1/' + RAIZ_DOCS + ':commit', { token, corpo: { writes } });
const campoTexto = (d, k) => d && d.fields && d.fields[k] ? d.fields[k].stringValue : undefined;
const campoInt = (d, k) => d && d.fields && d.fields[k] ? Number(d.fields[k].integerValue) : undefined;
const campoBytes = (d, k) => d && d.fields && d.fields[k] && d.fields[k].bytesValue ? Buffer.from(d.fields[k].bytesValue, 'base64') : null;
const sha256 = (texto) => cryptoNode.createHash('sha256').update(Buffer.from(texto, 'utf8')).digest('hex');

const CFG = { auth: AUTH, firestore: FS, projectId: PROJETO };
const amb = H.criarAmbiente(PORTA_APP, 'nath_n2f1_folhas', trocas);

async function prepararPagina(pag, movel) {
  pag.setDefaultTimeout(60000);
  if (movel) await pag.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  pag.errosDePagina = [];
  pag.on('pageerror', e => pag.errosDePagina.push(e.message));
  pag.dialogos = [];
  pag.on('dialog', async d => { pag.dialogos.push(d.message()); try { await d.accept(); } catch (e) { /* ok */ } });
  /* Toda escrita que sai desta página para o emulador, com os nomes dos
   * documentos: é por aqui que a prova conta as páginas de folha escritas. */
  pag.escritas = [];
  pag.on('request', r => {
    const u = r.url();
    if (u.indexOf(FS) !== 0) return;
    if (/:commit\b/.test(u)) {
      let nomes = [];
      try { nomes = (JSON.parse(r.postData() || '{}').writes || []).map(w => (w.update && w.update.name) || w.delete || ''); } catch (e) { nomes = ['?']; }
      pag.escritas.push({ url: u, nomes });
    } else if (r.method() === 'PATCH' || r.method() === 'DELETE') pag.escritas.push({ url: u, nomes: [u] });
  });
  await pag.evaluateOnNewDocument(cfg => { window.NUVEM_EMULADOR = cfg; }, CFG);
  await pag.evaluateOnNewDocument(movel_ => {
    const largura = movel_ ? 390 : 1280, altura = movel_ ? 844 : 800;
    Object.defineProperty(Screen.prototype, 'width', { configurable: true, get: () => largura });
    Object.defineProperty(Screen.prototype, 'height', { configurable: true, get: () => altura });
  }, !!movel);
  await pag.evaluateOnNewDocument(() => {
    const original = window.fetch;
    window.fetch = function (url) {
      if (String(url).indexOf('ibge') >= 0) return Promise.reject(new Error('sem rede para o IBGE neste teste'));
      return original.apply(this, arguments);
    };
  });
}
const folhasEscritas = (pag, desde) => pag.escritas.slice(desde).reduce((n, e) => n + e.nomes.filter(x => x.indexOf('/folhas/') > 0).length, 0);
const texto = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent : null; }, sel);
const existe = (pag, sel) => pag.evaluate(s => !!document.querySelector(s), sel);
const escondido = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); return e ? (e.hidden || getComputedStyle(e).display === 'none') : null; }, sel);
async function digitar(pag, sel, valor) {
  await pag.evaluate((s, v) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, sel, valor);
}
const clicar = (pag, sel) => pag.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.click(); return true; }, sel);
async function entrarPelaTela(pag, email, senha, seletorPronto) {
  const form = await esperar('o cartão da nuvem pede e-mail e senha', () => existe(pag, '#nuvem-entrar'), v => v === true, 10000);
  if (!form.ok) return false;
  await digitar(pag, '#nuvem-email', email);
  await digitar(pag, '#nuvem-senha', senha);
  await clicar(pag, '#nuvem-entrar');
  return (await esperar('entrou', () => existe(pag, seletorPronto), v => v === true, 15000)).ok;
}
const editar = (pag, fn) => pag.evaluate(async (corpo) => {
  const d = await Store.carregar();
  (new Function('d', 'Core', corpo))(d, Core);
  await Store.salvar(d);
  return true;
}, fn);
const enviar = (pag, tudo) => pag.evaluate(t => Nuvem.enviarRegistros({ versaoApp: 'prova', tudo: t }).then(r => ({ enviados: r.enviados, erro: r.erro ? r.erro.codigo : null, pulado: r.pulado || null, adiadas: Nuvem.estado().registros.folhasAdiadas })), !!tudo);
const receber = pag => pag.evaluate(() => Nuvem.receberRegistros().then(r => ({ aplicados: r.aplicados, folhas: r.folhas || 0, invalidas: r.folhasInvalidas || 0, erro: r.erro ? r.erro.codigo : null, pulado: r.pulado || null })));
/* As páginas canônicas da folha de uma aula, como texto, para comparar ponto a ponto. */
const canonicas = (pag, aulaId) => pag.evaluate(async id => { const n = await Store.lerNota(id); return n ? n.paginas.map(p => Store.paginaCanonica(p)) : null; }, aulaId);
const filaFolhas = pag => pag.evaluate(() => Store.lerFila().then(l => l.filter(e => e.tipo === 'folha').map(e => ({ id: e.id, apagada: !!e.apagadoEm, restauro: !!e.restauro }))));
const filaToda = pag => pag.evaluate(() => Store.lerFila().then(l => l.map(e => ({ id: e.id, tipo: e.tipo, apagada: !!e.apagadoEm, restauro: !!e.restauro, quarentena: !!e.quarentena, motivo: e.motivo || null, tentativas: e.tentativas || 0 }))));
const resumoDoc = r => r.status !== 200 ? 'status ' + r.status : ('apagadoEm=' + (campoTexto(r.json, 'apagadoEm') ? 'sim' : 'não') + ' bytes=' + (campoBytes(r.json, 'bytes') ? 'sim' : 'não'));
const fimDoVeneno = () => Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
const textoDaNuvem = pag => pag.evaluate(() => { const c = document.querySelector('#nuvem-registros'); return c ? c.textContent : ''; });
/* Restaura no tablet pela API (o mesmo caminho do restaurarDaNuvem do app.js). */
const restaurarPelaApi = (pag, uid, idCopia) => pag.evaluate(async (uid_, id_) => {
  const lista = await Nuvem.listarCopias(uid_);
  const copia = lista.filter(c => c.id === id_)[0] || lista[0];
  const zip = await Nuvem.baixarCopia(uid_, copia.id);
  await Store.importarZip(zip, { daNuvem: true });
  await Nuvem.restaurou(copia, { celular: false });
  return copia.id;
}, uid, idCopia);
async function enviarAteEsvaziar(pag, vezes) {
  let r = null;
  for (let i = 0; i < (vezes || 4); i++) {
    r = await enviar(pag, true);
    const f = await filaFolhas(pag);
    if (!f.length) return Object.assign(r, { rodadas: i + 1, filaFolhas: 0 });
  }
  return Object.assign(r || {}, { rodadas: vezes || 4, filaFolhas: (await filaFolhas(pag)).length });
}
async function enviarCopiaPelaTela(pag) {
  const antes = await pag.evaluate(() => (Nuvem.estado().ultimaCopia || {}).id || null);
  await clicar(pag, '#nuvem-enviar');
  const r = await esperar('a cópia subiu', () => pag.evaluate(() => (Nuvem.estado().ultimaCopia || {}).id || null), v => !!v && v !== antes, 30000);
  return r.ok ? r.valor : null;
}
/* Escreve direto no banco do aplicativo (o que a versão anterior ou outro tablet fariam). */
const idb = (pag, corpo) => pag.evaluate(c => new Promise((res, rej) => {
  const r = indexedDB.open('apoio-educacional');
  r.onsuccess = () => {
    const b = r.result, t = b.transaction(['saida', 'controle', 'notas'], 'readwrite');
    try { (new Function('t', c))(t); } catch (e) { rej(e.message); }
    t.oncomplete = () => { b.close(); res(true); };
    t.onerror = () => { b.close(); rej(String(t.error)); };
  };
  r.onerror = () => rej('não abriu o banco');
}), corpo);
/* Texto que não comprime (alfabeto de 64 símbolos, 6 bits por caractere, de
 * uma cadeia de SHA-256: determinístico e sem período curto; um gerador
 * congruente aqui repetia a cada 16 KB e o gzip o reduzia a quase nada). */
function textoAleatorio(n) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const partes = [];
  let total = 0, i = 0;
  while (total < n) {
    const bloco = cryptoNode.createHash('sha256').update('pagina-grande-' + (i++)).digest();
    let s = '';
    for (const b of bloco) s += A[b & 63];
    partes.push(s); total += s.length;
  }
  return partes.join('').slice(0, n);
}
async function restaurarPelaTela(pag, botaoRestaurar) {
  await clicar(pag, botaoRestaurar);
  await esperar('a janela lista a cópia', () => pag.evaluate(() => document.querySelectorAll('#modal-nuvem-restaurar.aberto #nuvem-copias input[type=radio]').length), v => v >= 1, 15000);
  await clicar(pag, '#nuvem-restaurar-confirmar');
  return (await esperar('a cópia chegou', () => pag.evaluate(async () => !document.querySelector('#modal-nuvem-restaurar.aberto') &&
    (await Store.carregar()).alunos.some(a => a.id === 'alfa')), v => v === true, 30000)).ok;
}

/* A folha de prova: coordenadas com fração longa (o ponteiro real dá isso),
 * um texto e fundos diferentes nas duas páginas. */
const FOLHA = {
  paginas: [
    { fundo: 'pautado', itens: [
      { t: 'traco', cor: '#1A1C1F', esp: 4, pontos: [[100.123456, 200.987654, 0.531], [101.87654321, 203.3333333, 0.6], [104.5, 207.25, 0.75]] },
      { t: 'traco', cor: '#1F3A5F', esp: 2.2, pontos: [[300.04, 400.06, 0.5], [310.049999, 405.95, 0.5]] },
      { t: 'texto', x: 120.4444, y: 80.5555, texto: 'Fração e porcentagem', tam: 30, cor: '#1A1C1F' }
    ] },
    { fundo: 'branco', itens: [
      { t: 'traco', cor: '#B4453C', esp: 7, pontos: [[500.111, 600.222, 0.9], [510.333, 610.444, 0.95], [520.555, 620.666, 1]] }
    ] }
  ]
};
function paginaSintetica() {
  let s = 7;
  const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  const itens = [];
  for (let t = 0; t < 300; t++) {
    const x0 = 60 + rnd() * 880, y0 = 80 + rnd() * 1200;
    const pontos = [];
    for (let k = 0; k < 40; k++) pontos.push([x0 + k * 0.8 + (rnd() - 0.5) * 3, y0 + Math.sin(k / 3) * 8 + (rnd() - 0.5) * 2, 0.3 + rnd() * 0.7]);
    itens.push({ t: 'traco', cor: '#1A1C1F', esp: 4, pontos });
  }
  return { fundo: 'pautado', itens };
}

(async function () {
  secao('1. O tablet A escreve uma folha de duas páginas e ela sobe por página');
  await subirEmulador(REGRAS);
  const dona = (await criarUsuario(DONA)).json;
  const obs = (await criarUsuario(OBS)).json;
  conf('as contas da dona e do observador existem no emulador', !!(dona && dona.localId && obs && obs.localId), true);
  await amb.subir();
  const pagA = await amb.pagina();
  await prepararPagina(pagA, false);
  await H.abrirApp(pagA, amb.ORIGEM);
  const hoje = await pagA.evaluate(() => Core.hojeIso());
  await pagA.evaluate(async (hoje_) => {
    const d = Store.bancoVazio();
    d.alunos = [{ id: 'alfa', nome: 'Aluna Alfa Teste', ativo: true, precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 100 }] }];
    d.aulas = [
      { id: 'x1', alunoId: 'alfa', serieId: null, data: hoje_, hora: '10:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] },
      { id: 'x2', alunoId: 'alfa', serieId: null, data: hoje_, hora: '11:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [] }
    ];
    d.ajustes = { chavePix: 'pix-de-teste' };
    await Store.salvar(d);
  }, hoje);
  await H.abrirApp(pagA, amb.ORIGEM);
  await H.irParaAba(pagA, 'ajustes');
  conf('A entrou', await entrarPelaTela(pagA, DONA.email, DONA.senha, '#nuvem-enviar'), true);
  await clicar(pagA, '#nuvem-enviar');
  conf('a cópia de A subiu (ainda sem folha)', (await esperar('a cópia subiu', () => texto(pagA, '#nuvem-ultima'), v => /^Última cópia na nuvem: hoje/.test(v || ''), 30000)).ok, true);
  conf('A permitiu o observador como leitor', await pagA.evaluate(u => Nuvem.permitirLeitor(u).then(l => l.indexOf(u) >= 0), obs.localId), true);
  const e0 = await enviar(pagA, true);
  conf('os registros de A subiram', e0.erro === null && e0.enviados >= 3, true);

  // a folha, como o editor grava: a nota em `notas` e o temNota no registro da aula
  const contasFolha = await pagA.evaluate(async f => { await Store.salvarNota('x1', f); return Store.ultimaGravacaoDeFolha(); }, FOLHA);
  await editar(pagA, "d.aulas.find(a => a.id === 'x1').temNota = true;");
  conf('a gravação enfileirou as duas páginas (mudadas 2, iguais 0)', JSON.stringify([contasFolha.mudadas, contasFolha.iguais, contasFolha.enfileiradas]), '[2,0,2]');
  conf('a fila tem as duas páginas da folha', JSON.stringify((await filaFolhas(pagA)).map(e => e.id).sort()), JSON.stringify(['folha:x1:0', 'folha:x1:1']));
  const escritasAntes1 = pagA.escritas.length;
  const eEspera = await enviar(pagA, false);
  conf('sem `tudo`, a página recém-gravada espera (duas adiadas, nenhuma escrita em folhas/)', JSON.stringify([eEspera.adiadas, folhasEscritas(pagA, escritasAntes1)]), '[2,0]');
  const e1 = await enviar(pagA, true);
  // sem hash (veneno), a nuvem recusa aqui mesmo: a conferência de baixo é quem vê
  if (MODO !== MODOS[0]) conf('com `tudo`, as páginas sobem sem erro', e1.erro, null);
  const docP0 = await lerDoc(dona.idToken, dona.localId, 'folhas/folha:x1:0');
  const docP1 = await lerDoc(dona.idToken, dona.localId, 'folhas/folha:x1:1');
  prop('a página 1 está na nuvem com hash, bytes, n e aulaId', docP0.status === 200 && typeof campoTexto(docP0.json, 'hash') === 'string' && !!campoBytes(docP0.json, 'bytes') && campoInt(docP0.json, 'n') === 0 && campoTexto(docP0.json, 'aulaId') === 'x1', MODOS[0]);
  if (MODO === MODOS[0]) {
    conf('VENENO visto: sem hash, a nuvem recusou (PERMISSION_DENIED) e a fila ficou', await pagA.evaluate(() => Nuvem.estado().registros.erro && Nuvem.estado().registros.erro.codigo), 'PERMISSION_DENIED');
    throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
  }
  conf('a página 2 está na nuvem', docP1.status === 200 && campoInt(docP1.json, 'n') === 1, true);
  const canA = await canonicas(pagA, 'x1');
  const bytesP0 = campoBytes(docP0.json, 'bytes');
  const textoP0 = zlib.gunzipSync(bytesP0).toString('utf8');
  conf('o hash do documento é o SHA-256 do texto descomprimido', campoTexto(docP0.json, 'hash'), sha256(textoP0));
  conf('o texto descomprimido é a página canônica de A (pontos a 0,1)', textoP0, canA[0]);
  conf('a página canônica arredondou de verdade (100.123456 virou 100.1)', textoP0.indexOf('100.1,201,0.5') > 0 && textoP0.indexOf('100.123456') < 0, true);
  conf('o algoritmo e o tamanho do texto vão no documento', campoTexto(docP0.json, 'algoritmo') === 'gzip' && campoInt(docP0.json, 'tamanho') === textoP0.length, true);
  conf('servidorEm é um carimbo do servidor', !!(docP0.json.fields.servidorEm && docP0.json.fields.servidorEm.timestampValue), true);
  conf('a fila de folhas de A esvaziou', (await filaFolhas(pagA)).length, 0);
  const estadoA = await pagA.evaluate(() => Store.estadoDaFolha('x1'));
  console.log('   estado da folha em A: ' + JSON.stringify(estadoA));
  conf('o estado da folha em A guarda o hash e o carimbo de cada página', estadoA.paginas.length === 2 && estadoA.paginas.every(p => p.hash && p.nuvem && p.nuvem.servidorEm), true);
  conf('o hash do estado é o do documento', estadoA.paginas[0].hash, campoTexto(docP0.json, 'hash'));
  console.log('   página 1: texto ' + textoP0.length + ' bytes, gzip ' + bytesP0.length + ' bytes; página 2: gzip ' + campoBytes(docP1.json, 'bytes').length + ' bytes');

  secao('2. O celular C da dona restaura, recebe a folha ponto por ponto e a abre só para ler');
  const contextoC = await pagA.browser().createBrowserContext();
  const pagC = await contextoC.newPage();
  await prepararPagina(pagC, true);
  await H.abrirApp(pagC, amb.ORIGEM);
  await esperar('a tela do celular pede a conta', () => existe(pagC, '#cel-conta #nuvem-entrar'), v => v === true, 15000);
  await digitar(pagC, '#cel-conta #nuvem-email', DONA.email);
  await digitar(pagC, '#cel-conta #nuvem-senha', DONA.senha);
  await clicar(pagC, '#cel-conta #nuvem-entrar');
  await esperar('o botão de trazer a cópia', () => existe(pagC, '#cel-trazer'), v => v === true, 15000);
  conf('o celular restaurou a cópia (sem folha ainda)', await restaurarPelaTela(pagC, '#cel-trazer'), true);
  /* A tela do celular já recebe sozinha depois de restaurar; a prova chama o
   * receber também e espera a folha ter as duas páginas, venha por onde vier. */
  const rC = await esperar('C recebeu as páginas', () => receber(pagC).then(() => canonicas(pagC, 'x1')).then(c => c ? c.length : 0), v => v === 2, 20000);
  conf('C recebeu as duas páginas da folha pelo recebimento', rC.ok, true);
  const canC = await canonicas(pagC, 'x1');
  conf('a folha em C é igual à de A, PONTO POR PONTO depois do arredondamento (2 páginas)', JSON.stringify(canC), JSON.stringify(canA));
  conf('C guarda o fundo de cada página (pautado, branco)', await pagC.evaluate(async () => (await Store.lerNota('x1')).paginas.map(p => p.fundo).join(',')), 'pautado,branco');
  conf('o cursor das folhas ficou em C', await pagC.evaluate(() => Store.lerCursorFolhas().then(c => !!(c && c.servidorEm))), true);
  const rC2 = await receber(pagC);
  conf('receber de novo não aplica nada (o cursor vale)', rC2.folhas, 0);
  /* A tela (D6c): o bloco da aula na linha do tempo abre a FOLHA DA AULA, e é
   * nela que fica "Ver a folha escrita à mão", que abre a janela só para ler. */
  await pagC.evaluate(() => { const b = document.querySelector('.cel-aba[data-cel="hoje"]'); if (b) b.click(); });
  const blocoX2 = await esperar('a linha do tempo mostra a aula sem folha', () => existe(pagC, '#cel-tempo .cel-bloco[data-aula="x2"]'), v => v === true, 15000);
  conf('a linha do tempo mostra as aulas de hoje', blocoX2.ok, true);
  await clicar(pagC, '#cel-tempo .cel-bloco[data-aula="x2"]');
  await esperar('a folha da aula x2 abriu', () => existe(pagC, '#cel-folha[data-aula="x2"]'), v => v === true, 10000);
  conf('a aula sem folha não mostra o botão na folha da aula', await existe(pagC, '[data-ver-folha]'), false);
  await clicar(pagC, '#cel-folha-fechar');
  await clicar(pagC, '#cel-tempo .cel-bloco[data-aula="x1"]');
  const botaoVer = await esperar('a folha da aula x1 mostra "Ver a folha"', () => existe(pagC, '#cel-folha[data-aula="x1"] [data-ver-folha="x1"]'), v => v === true, 10000);
  conf('a folha da aula com folha escrita mostra "Ver a folha escrita à mão" no celular', botaoVer.ok, true);
  if (process.env.N2_PRINT_DIR) {
    fs.mkdirSync(process.env.N2_PRINT_DIR, { recursive: true });
    await pagC.screenshot({ path: path.join(process.env.N2_PRINT_DIR, 'ver_folha.png') });
  }
  const escritasC0 = pagC.escritas.length;
  await clicar(pagC, '[data-ver-folha="x1"]');
  const abriu = await esperar('a janela da folha abriu', () => existe(pagC, '#modal-nota.aberto'), v => v === true, 10000);
  conf('a janela da folha abriu no celular', abriu.ok, true);
  if (process.env.N2_PRINT_DIR) await pagC.screenshot({ path: path.join(process.env.N2_PRINT_DIR, 'folha_so_leitura.png') });
  conf('o título diz que é só para ler', /só para ler/.test(await texto(pagC, '#titulo-modal-nota')), true);
  conf('sem barra de ferramentas e sem "Salvo"', (await escondido(pagC, '#ferramentas-nota')) === true && (await escondido(pagC, '#status-gravacao-folha')) === true, true);
  conf('o rodapé mostra as páginas e o aviso', (await texto(pagC, '#folha-leitura-pagina')) === 'Página 1 de 2' && /Só para ler/.test(await texto(pagC, '#folha-leitura-aviso')), true);
  conf('nenhum botão de nova página, apagar página, fundo ou salvar', await pagC.evaluate(() => /\+ Página|Apagar página|Salvar/.test(document.querySelector('#rodape-nota').textContent) || !!document.querySelector('#rodape-nota select')), false);
  conf('o canvas da folha está na tela, com tamanho', await pagC.evaluate(() => { const c = document.querySelector('#tela-desenho'); return c && c.width > 0 && c.height > 0; }), true);
  // a caneta no editor só leitura não cria traço; no editor normal cria (controle)
  const caneta = await pagC.evaluate(() => {
    function desenha(soLeitura) {
      const c = document.createElement('canvas');
      c.width = 400; c.height = 500; c.style.width = '400px'; c.style.height = '500px';
      document.body.appendChild(c);
      const ed = new Draw.Editor(c, { nota: Draw.notaVazia('pautado'), soLeitura: soLeitura });
      ed.ajustarTamanho();
      const r = c.getBoundingClientRect();
      const ev = (tipo, x, y) => c.dispatchEvent(new PointerEvent(tipo, { pointerId: 7, pointerType: 'pen', clientX: r.left + x, clientY: r.top + y, pressure: 0.6, bubbles: true }));
      ev('pointerdown', 50, 50); ev('pointermove', 80, 90); ev('pointermove', 120, 130); ev('pointerup', 120, 130);
      const n = ed.nota.paginas[0].itens.length;
      ed.destruir(); c.remove();
      return n;
    }
    return { soLeitura: desenha(true), normal: desenha(false) };
  });
  conf('a caneta no editor só leitura não cria traço (e no normal cria: controle)', JSON.stringify(caneta), JSON.stringify({ soLeitura: 0, normal: 1 }));
  await pagC.evaluate(() => { const b = document.querySelector('#modal-nota [data-fechar]'); if (b) b.click(); });
  conf('a janela fechou sem gravar: nada saiu de C para a nuvem', (await esperar('fechou', () => existe(pagC, '#modal-nota.aberto'), v => v === false, 5000)).ok && pagC.escritas.length === escritasC0, true);

  secao('3. A edita só a página 2: sobe um documento, o da página 1 não muda');
  const updateP0Antes = docP0.json.updateTime;
  const contas3 = await pagA.evaluate(async () => {
    const n = await Store.lerNota('x1');
    n.paginas[1].itens.push({ t: 'traco', cor: '#2E7D6B', esp: 4, pontos: [[700.777, 800.888, 0.5], [710.1, 810.2, 0.5]] });
    await Store.salvarNota('x1', n);
    return Store.ultimaGravacaoDeFolha();
  });
  /* É AQUI que a regravação da página igual aparece primeiro: sem a comparação
   * de hash, a página 1, intocada, voltaria à fila junto com a 2. */
  prop('só a página 2 mudou (mudadas 1, iguais 1), e a fila tem só ela', JSON.stringify([contas3.mudadas, contas3.iguais, (await filaFolhas(pagA)).map(e => e.id)]) === JSON.stringify([1, 1, ['folha:x1:1']]), MODOS[1]);
  if (MODO === MODOS[1]) throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
  const escritasAntes3 = pagA.escritas.length;
  const e3 = await enviar(pagA, true);
  conf('subiu UMA página de folha', e3.erro === null && folhasEscritas(pagA, escritasAntes3) === 1, true);
  const docP0b = await lerDoc(dona.idToken, dona.localId, 'folhas/folha:x1:0');
  const docP1b = await lerDoc(dona.idToken, dona.localId, 'folhas/folha:x1:1');
  conf('o documento da página 1 não mudou', docP0b.json.updateTime, updateP0Antes);
  conf('o da página 2 mudou e tem o hash novo', docP1b.json.updateTime !== docP1.json.updateTime && campoTexto(docP1b.json, 'hash') !== campoTexto(docP1.json, 'hash'), true);
  const rC3 = await receber(pagC);
  conf('C recebeu só a página 2 e ficou igual a A', rC3.folhas === 1 && JSON.stringify(await canonicas(pagC, 'x1')) === JSON.stringify(await canonicas(pagA, 'x1')), true);

  secao('4. A salva a mesma folha de novo: nada entra na fila, nada sobe');
  const contas4 = await pagA.evaluate(async () => { const n = await Store.lerNota('x1'); await Store.salvarNota('x1', n); return Store.ultimaGravacaoDeFolha(); });
  const fila4 = await filaFolhas(pagA);
  const escritasAntes4 = pagA.escritas.length;
  const e4 = await enviar(pagA, true);
  prop('a mesma folha salva de novo não enfileira nem sobe página nenhuma', contas4.mudadas === 0 && contas4.enfileiradas === 0 && fila4.length === 0 && e4.erro === null && folhasEscritas(pagA, escritasAntes4) === 0, MODOS[1]);
  if (MODO === MODOS[1]) throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });

  secao('5. A apaga a página 2: a lápide sobe sem bytes e C fica com uma página');
  const contas5 = await pagA.evaluate(async () => { const n = await Store.lerNota('x1'); n.paginas.pop(); await Store.salvarNota('x1', n); return Store.ultimaGravacaoDeFolha(); });
  conf('a página 2 virou lápide (lapides 1, iguais 1)', JSON.stringify([contas5.lapides, contas5.iguais, contas5.mudadas]), '[1,1,0]');
  conf('a fila tem a lápide da página 2', JSON.stringify(await filaFolhas(pagA)), JSON.stringify([{ id: 'folha:x1:1', apagada: true, restauro: false }]));
  const e5 = await enviar(pagA, true);
  conf('a lápide subiu', e5.erro, null);
  const docP1c = await lerDoc(dona.idToken, dona.localId, 'folhas/folha:x1:1');
  conf('o documento da página 2 tem apagadoEm e não tem bytes', !!campoTexto(docP1c.json, 'apagadoEm') && !campoBytes(docP1c.json, 'bytes'), true);
  const rC5 = await receber(pagC);
  conf('C aplicou a lápide e ficou com uma página, igual à de A', rC5.folhas === 1 && JSON.stringify(await canonicas(pagC, 'x1')) === JSON.stringify(await canonicas(pagA, 'x1')) && (await canonicas(pagC, 'x1')).length === 1, true);

  secao('6. O celular tenta gravar a folha: a trava recusa e nada sobe');
  const tentativaC = await pagC.evaluate(async () => {
    const n = await Store.lerNota('x1');
    const antes = JSON.stringify(n);
    n.paginas[0].itens.push({ t: 'traco', cor: '#1A1C1F', esp: 4, pontos: [[1, 2, 0.5], [3, 4, 0.5]] });
    let erro = null;
    try { await Store.salvarNota('x1', n); } catch (e) { erro = { soLeitura: !!e.soLeitura, mensagem: e.message }; }
    const depois = JSON.stringify(await Store.lerNota('x1'));
    const fila = (await Store.lerFila()).filter(e => e.tipo === 'folha').length;
    return { erro, mudou: antes !== depois, fila };
  });
  const escritasC6 = pagC.escritas.length;
  const e6 = await pagC.evaluate(() => Nuvem.enviarRegistros({ versaoApp: 'prova', tudo: true }).then(r => r.pulado || r.enviados));
  prop('a folha editada no celular é recusada pela trava, nada muda e nada sobe', !!(tentativaC.erro && tentativaC.erro.soLeitura) && !tentativaC.mudou && tentativaC.fila === 0 && folhasEscritas(pagC, escritasC6) === 0, MODOS[2]);
  if (MODO === MODOS[2]) {
    console.log('   (veneno) a gravação no celular: ' + JSON.stringify(tentativaC) + ', envio: ' + JSON.stringify(e6));
    throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
  }

  secao('7. Um documento adulterado no emulador não entra em C');
  const paginaFalsa = JSON.stringify({ fundo: 'pautado', itens: [{ t: 'texto', x: 1, y: 1, texto: 'ADULTERADA', tam: 30 }] });
  const bytesFalsos = zlib.gzipSync(Buffer.from(paginaFalsa, 'utf8')).toString('base64');
  const adulterado = await commitRest(dona.idToken, [{
    update: { name: RAIZ_DOCS + '/usuarios/' + dona.localId + '/folhas/folha:x1:0', fields: {
      id: { stringValue: 'folha:x1:0' }, aulaId: { stringValue: 'x1' }, n: { integerValue: '0' }, hash: { stringValue: sha256('outra coisa qualquer') },
      bytes: { bytesValue: bytesFalsos }, tamanho: { integerValue: String(paginaFalsa.length) }, algoritmo: { stringValue: 'gzip' },
      atualizadoEm: { stringValue: new Date().toISOString() }, aparelho: { stringValue: 'apAdulterador' }, esquema: { integerValue: '1' } } },
    updateTransforms: [{ fieldPath: 'servidorEm', setToServerValue: 'REQUEST_TIME' }]
  }]);
  conf('o documento adulterado foi posto no emulador (a forma passa pelas regras; o hash é que não bate)', adulterado.status, 200);
  // A lápide não pode levar bytes: apagar a página tem de tirar o conteúdo da nuvem. Mesma forma do adulterado
  // (que passou, 200), mais apagadoEm: as regras TÊM de recusar. Id de outra aula, para nada mudar se passasse.
  const lapideComBytes = await commitRest(dona.idToken, [{
    update: { name: RAIZ_DOCS + '/usuarios/' + dona.localId + '/folhas/folha:x9:0', fields: {
      id: { stringValue: 'folha:x9:0' }, aulaId: { stringValue: 'x9' }, n: { integerValue: '0' }, hash: { stringValue: sha256(paginaFalsa) },
      bytes: { bytesValue: bytesFalsos }, tamanho: { integerValue: String(paginaFalsa.length) }, algoritmo: { stringValue: 'gzip' },
      atualizadoEm: { stringValue: new Date().toISOString() }, apagadoEm: { stringValue: new Date().toISOString() },
      aparelho: { stringValue: 'apAdulterador' }, esquema: { integerValue: '1' } } },
    updateTransforms: [{ fieldPath: 'servidorEm', setToServerValue: 'REQUEST_TIME' }]
  }]);
  conf('a lápide com bytes é recusada pelas regras (403)', lapideComBytes.status, 403);
  conf('e nada ficou no caminho dela', (await lerDoc(dona.idToken, dona.localId, 'folhas/folha:x9:0')).status, 404);
  const canCAntes7 = await canonicas(pagC, 'x1');
  const rC7 = await receber(pagC);
  prop('C não aplicou a página adulterada: contou como inválida e a folha ficou igual', rC7.invalidas === 1 && rC7.folhas === 0 && JSON.stringify(await canonicas(pagC, 'x1')) === JSON.stringify(canCAntes7) && (await pagC.evaluate(() => Nuvem.estado().registros.folhasInvalidas)) === 1, MODOS[3]);
  if (MODO === MODOS[3]) {
    console.log('   (veneno) recebimento em C: ' + JSON.stringify(rC7) + ', folha em C contém ADULTERADA: ' + /ADULTERADA/.test(JSON.stringify(await canonicas(pagC, 'x1'))));
    throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
  }
  conf('o cursor passou por cima do documento inválido (receber de novo não o relê)', (await receber(pagC)).invalidas, 0);
  // A também pula o adulterado (que não é eco dele) e não perde a página dela
  const rA7 = await receber(pagA);
  conf('A também pula o adulterado e a folha dela fica', rA7.invalidas === 1 && (await canonicas(pagA, 'x1'))[0] === canA[0], true);
  // A reescreve a página 1 (um traço a mais) e a nuvem volta a ter a página boa
  await pagA.evaluate(async () => { const n = await Store.lerNota('x1'); n.paginas[0].itens.push({ t: 'traco', cor: '#1A1C1F', esp: 4, pontos: [[10.1, 10.2, 0.5], [20.3, 20.4, 0.5]] }); await Store.salvarNota('x1', n); });
  const e7 = await enviar(pagA, true);
  conf('A reescreveu a página 1 por cima do adulterado (a precondição recebeu antes e passou)', e7.erro === null && (await filaFolhas(pagA)).length === 0, true);
  const rC7b = await receber(pagC);
  conf('C recebeu a página boa e ficou igual a A', rC7b.folhas === 1 && JSON.stringify(await canonicas(pagC, 'x1')) === JSON.stringify(await canonicas(pagA, 'x1')), true);

  secao('8. A página sintética densa (300 traços de 40 pontos) sobe num documento só: a medida');
  const sintetica = paginaSintetica();
  const t0 = Date.now();
  await pagA.evaluate(async p => { await Store.salvarNota('x2', { paginas: [p] }); }, sintetica);
  await editar(pagA, "d.aulas.find(a => a.id === 'x2').temNota = true;");
  const e8 = await enviar(pagA, true);
  const ms8 = Date.now() - t0;
  conf('a página densa subiu sem erro', e8.erro, null);
  const docDensa = await lerDoc(dona.idToken, dona.localId, 'folhas/folha:x2:0');
  const bytesDensa = campoBytes(docDensa.json, 'bytes') || Buffer.alloc(0);
  const textoDensa = bytesDensa.length ? zlib.gunzipSync(bytesDensa).toString('utf8') : '';
  conf('o documento da página densa existe, com o hash batendo', docDensa.status === 200 && campoTexto(docDensa.json, 'hash') === sha256(textoDensa), true);
  conf('a página densa cabe num documento (gzip abaixo do teto de 900 KiB)', bytesDensa.length < 900 * 1024, true);
  conf('o texto canônico da página densa tem os 12.000 pontos', (textoDensa.match(/\[\d+(?:\.\d)?,\d+(?:\.\d)?,\d(?:\.\d)?\]/g) || []).length, 12000);
  console.log('   MEDIDA da página densa (12.000 pontos, 0,1): texto canônico ' + textoDensa.length + ' bytes, gzip ' + bytesDensa.length + ' bytes (' + Math.round(bytesDensa.length / 1024) + ' KB), ' +
    'JSON bruto ' + JSON.stringify(sintetica).length + ' bytes; gravar e subir levou ' + ms8 + ' ms');

  secao('9. O observador (outra conta) recebe as folhas e nada sobe dele');
  const contextoO = await pagA.browser().createBrowserContext();
  const pagO = await contextoO.newPage();
  await prepararPagina(pagO, true);
  await H.abrirApp(pagO, amb.ORIGEM);
  await clicar(pagO, '#cel-trazer-copia');
  conf('o observador entrou com a conta dele', await entrarPelaTela(pagO, OBS.email, OBS.senha, '#cel-trazer'), true);
  await clicar(pagO, '#cel-trazer');
  await esperar('a janela de restaurar abriu', () => existe(pagO, '#modal-nuvem-restaurar.aberto'), v => v === true, 10000);
  await digitar(pagO, '#nuvem-conta-dona', dona.localId);
  await clicar(pagO, '#nuvem-conta-dona-buscar');
  await esperar('a janela lista as cópias da dona', () => pagO.evaluate(() => document.querySelectorAll('#modal-nuvem-restaurar.aberto #nuvem-copias input[type=radio]').length), v => v >= 1, 15000);
  await clicar(pagO, '#nuvem-restaurar-confirmar');
  const trouxe = await esperar('o observador restaurou', () => pagO.evaluate(async () => !document.querySelector('#modal-nuvem-restaurar.aberto') && (await Store.carregar()).alunos.some(a => a.id === 'alfa')), v => v === true, 30000);
  conf('o observador trouxe a cópia da dona', trouxe.ok, true);
  conf('o observador é só leitura de outra conta', await pagO.evaluate(() => { const e = Nuvem.estado(); return e.celular && e.observador && !e.celularDaDona; }), true);
  const rO = await esperar('O recebeu as folhas', () => receber(pagO).then(async () => ((await canonicas(pagO, 'x1')) || []).length + ((await canonicas(pagO, 'x2')) || []).length), v => v === 2, 20000);
  conf('o observador recebeu as páginas das duas folhas (x1 e x2)', rO.ok, true);
  conf('a folha x1 no observador é igual à de A, ponto por ponto', JSON.stringify(await canonicas(pagO, 'x1')), JSON.stringify(await canonicas(pagA, 'x1')));
  conf('a página densa x2 no observador é igual à de A', (await canonicas(pagO, 'x2'))[0], textoDensa);
  await pagO.evaluate(() => { const b = document.querySelector('.cel-aba[data-cel="hoje"]'); if (b) b.click(); });
  let botoesO = 0;
  for (const id of ['x1', 'x2']) {
    if ((await esperar('o bloco ' + id, () => existe(pagO, '#cel-tempo .cel-bloco[data-aula="' + id + '"]'), v => v === true, 10000)).ok) {
      await clicar(pagO, '#cel-tempo .cel-bloco[data-aula="' + id + '"]');
      if ((await esperar('a folha da aula ' + id, () => existe(pagO, '#cel-folha[data-aula="' + id + '"] [data-ver-folha="' + id + '"]'), v => v === true, 10000)).ok) botoesO++;
      await clicar(pagO, '#cel-folha-fechar');
    }
  }
  conf('o observador vê "Ver a folha escrita à mão" na folha das duas aulas', botoesO, 2);
  conf('nenhuma escrita saiu do observador para a nuvem', pagO.escritas.length, 0);
  // o commit do observador recusa `folhas/` por dentro também
  conf('o commit do observador recusa uma escrita em folhas/ antes de sair', await pagO.evaluate(() => Nuvem.enviarRegistros({ versaoApp: 'prova', tudo: true }).then(r => r.pulado || 'enviou')), 'so leitura');
  conf('nenhum erro de página em A, C e O', [pagA, pagC, pagO].map(p => p.errosDePagina.join(' | ')).filter(Boolean).join(' || '), '');
  await pagO.close(); await contextoO.close();

  /* ---------- revisão do PR 133 ---------- */
  secao('10. A lápide da página que nunca subiu sai da fila sem virar documento na nuvem');
  await editar(pagA, "d.aulas.push({ id: 'x3', alunoId: 'alfa', serieId: null, data: d.aulas[0].data, hora: '12:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [], temNota: true });");
  await enviar(pagA, true);
  const contas10 = await pagA.evaluate(async () => {
    const P = k => ({ fundo: 'pautado', itens: [{ t: 'traco', cor: '#1A1C1F', esp: 4, pontos: [[10 + k, 20, 0.5], [30 + k, 40, 0.5]] }] });
    await Store.salvarNota('x3', { paginas: [P(0), P(1)] });
    await Store.salvarNota('x3', { paginas: [P(0)] });
    return (await Store.lerFila()).filter(e => e.tipo === 'folha').map(e => e.id + (e.apagadoEm ? ':lapide' : '')).sort();
  });
  conf('a fila tem a página 1 viva e a lápide da página 2, que nunca subiu', JSON.stringify(contas10), JSON.stringify(['folha:x3:0', 'folha:x3:1:lapide']));
  const escritas10 = pagA.escritas.length;
  const e10 = await enviar(pagA, true);
  const doc10 = await lerDoc(dona.idToken, dona.localId, 'folhas/folha:x3:1');
  console.log('   envio: ' + JSON.stringify(e10) + '; folha:x3:1 na nuvem: ' + resumoDoc(doc10) + '; escritas em folhas/: ' + folhasEscritas(pagA, escritas10));
  prop('a lápide da página que nunca subiu não vira documento na nuvem (404), e só a página viva foi escrita', e10.erro === null && doc10.status === 404 && folhasEscritas(pagA, escritas10) === 1, MODOS[4]);
  if (MODO === MODOS[4]) throw fimDoVeneno();
  conf('e a fila de folhas esvaziou (a lápide saiu sem escrever)', (await filaFolhas(pagA)).length, 0);
  conf('o envio contou a lápide descartada', await pagA.evaluate(() => Nuvem.estado().registros.ultimoEnvio.lapidesDescartadas), 1);
  conf('a página 1 de x3 está viva na nuvem (controle: a lápide da página que subiu vai, seção 5)', resumoDoc(await lerDoc(dona.idToken, dona.localId, 'folhas/folha:x3:0')), 'apagadoEm=não bytes=sim');

  secao('11. Excluir a aula pela tela lapida a folha dela na nuvem; a aula que volta traz a folha');
  await editar(pagA, "Core.excluirAulas(d, 'x3', 'esta');");
  const fila11 = await filaFolhas(pagA);
  prop('a exclusão da aula enfileirou a lápide da página de x3', JSON.stringify(fila11) === JSON.stringify([{ id: 'folha:x3:0', apagada: true, restauro: false }]), MODOS[5]);
  conf('a folha de x3 continua em notas (como antes da N2: o desfazer a recupera)', await pagA.evaluate(() => Store.lerNota('x3').then(n => !!n)), true);
  const e11 = await enviar(pagA, true);
  prop('a página de x3 é lápide na nuvem depois de a aula ser excluída', e11.erro === null && resumoDoc(await lerDoc(dona.idToken, dona.localId, 'folhas/folha:x3:0')) === 'apagadoEm=sim bytes=não', MODOS[5]);
  if (MODO === MODOS[5]) throw fimDoVeneno();
  await editar(pagA, "d.aulas.push({ id: 'x3', alunoId: 'alfa', serieId: null, data: d.aulas[0].data, hora: '12:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [], temNota: true });");
  conf('a aula que volta (desfazer) repõe a página na fila', JSON.stringify(await filaFolhas(pagA)), JSON.stringify([{ id: 'folha:x3:0', apagada: false, restauro: false }]));
  const e11b = await enviar(pagA, true);
  conf('e a página volta viva à nuvem', e11b.erro === null && resumoDoc(await lerDoc(dona.idToken, dona.localId, 'folhas/folha:x3:0')) === 'apagadoEm=não bytes=sim', true);

  secao('12. Restaurar a cópia: o estado das folhas fica, a fila esvazia e a nuvem fica igual à cópia');
  // o aplicativo reabre para a cópia (feita pela tela, do documento em memória) levar a aula x3 criada por fora
  await H.abrirApp(pagA, amb.ORIGEM);
  await H.irParaAba(pagA, 'ajustes');
  const copiaK1 = await enviarCopiaPelaTela(pagA);
  conf('a cópia K1 (x1 com 1 página, x2, x3) subiu', !!copiaK1, true);
  await pagA.evaluate(async () => { const n = await Store.lerNota('x1'); n.paginas.push({ fundo: 'branco', itens: [{ t: 'traco', cor: '#666666', esp: 4, pontos: [[50, 60, 0.5], [70, 80, 0.5]] }] }); await Store.salvarNota('x1', n); });
  const e12a = await enviar(pagA, true);
  conf('depois da cópia, x1 ganhou a página 2 e ela subiu', e12a.erro === null && resumoDoc(await lerDoc(dona.idToken, dona.localId, 'folhas/folha:x1:1')) === 'apagadoEm=não bytes=sim', true);
  const rC12 = await esperar('C recebeu a página 2 de x1', () => receber(pagC).then(() => canonicas(pagC, 'x1')).then(c => c ? c.length : 0), v => v === 2, 20000);
  conf('C tem x1 com 2 páginas', rC12.ok, true);
  conf('A restaurou K1', await restaurarPelaApi(pagA, dona.localId, copiaK1), copiaK1);
  conf('A ficou com x1 de 1 página', (await canonicas(pagA, 'x1')).length, 1);
  const estado12 = await pagA.evaluate(() => Store.estadoDaFolha('x1'));
  console.log('   estado de x1 depois de restaurar: ' + JSON.stringify(estado12));
  prop('o estado de x1 existe depois da restauração, com a página restaurada (a restauração não apaga o próprio estado)', !!(estado12 && estado12.paginas && estado12.paginas[0] && !estado12.paginas[0].apagadoEm), MODOS[6]);
  if (MODO === MODOS[6]) throw fimDoVeneno();
  conf('a página restaurada guarda o carimbo que este aparelho conhecia (a precondição passa direto)', !!(estado12.paginas[0].nuvem && estado12.paginas[0].nuvem.updateTime), true);
  const fila12 = await filaFolhas(pagA);
  console.log('   fila de A depois da restauração: ' + JSON.stringify(fila12));
  prop('a restauração enfileirou a lápide da página 2 de x1 (a nuvem a tem e a cópia não)', fila12.some(f => f.id === 'folha:x1:1' && f.apagada), MODOS[7]);
  conf('e as páginas da cópia, com restauro', fila12.filter(f => !f.apagada && f.restauro).map(f => f.id).sort().join(','), 'folha:x1:0,folha:x2:0,folha:x3:0');
  const e12b = await enviarAteEsvaziar(pagA, 4);
  console.log('   envio depois da restauração: ' + JSON.stringify(e12b));
  conf('as páginas restauradas sobem e a fila esvazia (nenhuma precondição presa)', e12b.erro === null && e12b.filaFolhas === 0, true);
  prop('folha:x1:1 é lápide na nuvem depois da restauração (a nuvem ficou igual à cópia)', resumoDoc(await lerDoc(dona.idToken, dona.localId, 'folhas/folha:x1:1')) === 'apagadoEm=sim bytes=não', MODOS[7]);
  if (MODO === MODOS[7]) throw fimDoVeneno();
  conf('as páginas de x2 e x3 continuam vivas na nuvem (só a página a mais foi lapidada)', resumoDoc(await lerDoc(dona.idToken, dona.localId, 'folhas/folha:x2:0')) + ' ' + resumoDoc(await lerDoc(dona.idToken, dona.localId, 'folhas/folha:x3:0')), 'apagadoEm=não bytes=sim apagadoEm=não bytes=sim');
  const rC12b = await esperar('C recebeu a lápide da página 2', () => receber(pagC).then(() => canonicas(pagC, 'x1')).then(c => c ? c.length : 0), v => v === 1, 20000);
  conf('C ficou com x1 de 1 página, igual a A (a restauração venceu)', rC12b.ok && JSON.stringify(await canonicas(pagC, 'x1')) === JSON.stringify(await canonicas(pagA, 'x1')), true);
  const estado12b = await pagA.evaluate(() => Store.estadoDaFolha('x1'));
  const hash12 = await pagA.evaluate(async () => { const n = await Store.lerNota('x1'); return Promise.all(n.paginas.map(Store.hashPagina)); });
  conf('o hash do estado de A bate com o conteúdo de A', JSON.stringify([estado12b.paginas[0].hash]), JSON.stringify(hash12));

  secao('13. A precondição que não se resolve recebendo não prende a fila: a culpada é isolada');
  const paginaX9 = JSON.stringify({ fundo: 'pautado', itens: [{ t: 'texto', x: 1, y: 1, texto: 'de outro tablet', tam: 30 }] });
  const docX9 = await commitRest(dona.idToken, [{
    update: { name: RAIZ_DOCS + '/usuarios/' + dona.localId + '/folhas/folha:x9:0', fields: {
      id: { stringValue: 'folha:x9:0' }, aulaId: { stringValue: 'x9' }, n: { integerValue: '0' }, hash: { stringValue: sha256(paginaX9) },
      bytes: { bytesValue: zlib.gzipSync(Buffer.from(paginaX9, 'utf8')).toString('base64') }, tamanho: { integerValue: String(paginaX9.length) }, algoritmo: { stringValue: 'gzip' },
      atualizadoEm: { stringValue: new Date().toISOString() }, aparelho: { stringValue: 'apOutro' }, esquema: { integerValue: '1' } } },
    updateTransforms: [{ fieldPath: 'servidorEm', setToServerValue: 'REQUEST_TIME' }]
  }]);
  conf('um documento de outro tablet (folha:x9:0) está na nuvem', docX9.status, 200);
  const rA13 = await receber(pagA);
  conf('A recebeu a página de x9 (o cursor passou por ela)', rA13.folhas >= 1, true);
  /* O estado de x9 fica sem carimbo e a fila ganha a entrada de restauração
   * dela: a precondição `exists: false` falha, e o recebimento, já passado
   * por esse documento, não a resolve. */
  await idb(pagA, "t.objectStore('controle').put({ paginas: [{ hash: null, atualizadoEm: '2026-01-01T00:00:00.000Z', apagadoEm: null, nuvem: null }] }, 'folha:x9'); t.objectStore('saida').put({ id: 'folha:x9:0', tipo: 'folha', atualizadoEm: '2026-01-01T00:00:00.000Z', apagadoEm: null, restauro: true });");
  await pagA.evaluate(async () => { const n = await Store.lerNota('x1'); n.paginas[0].itens.push({ t: 'traco', cor: '#1A1C1F', esp: 4, pontos: [[11, 12, 0.5], [21, 22, 0.5]] }); await Store.salvarNota('x1', n); });
  conf('a fila tem a boa (x1) e a presa (x9)', (await filaFolhas(pagA)).map(f => f.id).sort().join(','), 'folha:x1:0,folha:x9:0');
  const e13 = await enviar(pagA, true);
  const fila13 = (await filaToda(pagA)).filter(e => e.tipo === 'folha');
  console.log('   envio com a precondição presa: ' + JSON.stringify(e13) + '; fila: ' + JSON.stringify(fila13));
  prop('a precondição presa não prende a fila: a boa subiu e só a culpada ficou, com uma tentativa', e13.enviados >= 1 && fila13.length === 1 && fila13[0].id === 'folha:x9:0' && fila13[0].tentativas === 1, MODOS[8]);
  if (MODO === MODOS[8]) throw fimDoVeneno();
  await enviar(pagA, true); await enviar(pagA, true);
  const fila13b = (await filaToda(pagA)).filter(e => e.tipo === 'folha');
  const frase13 = await esperar('a frase de Ajustes diz que ela não consegue subir', () => textoDaNuvem(pagA), v => /não consegue subir/.test(v || ''), 5000);
  conf('na terceira vez a culpada vai para a quarentena, e a frase diz que ela não consegue subir', fila13b.length === 1 && fila13b[0].quarentena === true && frase13.ok, true);
  await idb(pagA, "t.objectStore('saida').delete('folha:x9:0'); t.objectStore('controle').delete('folha:x9'); t.objectStore('notas').delete('x9');");
  await enviar(pagA, true);

  secao('14. A página grande demais para a nuvem: quarentena na hora, e a frase diz qual folha e o que fazer');
  await editar(pagA, "d.aulas.push({ id: 'x4', alunoId: 'alfa', serieId: null, data: d.aulas[0].data, hora: '13:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', anexos: [], temNota: true });");
  await H.abrirApp(pagA, amb.ORIGEM);   // a tela de Ajustes nomeia a aula pelo documento em memória: reabre com x4
  await H.irParaAba(pagA, 'ajustes');
  await enviar(pagA, true);
  const bruta = textoAleatorio(1400 * 1024);   // 1,4 MB que não comprimem: acima dos 900 KiB mesmo em gzip
  conf('o texto de prova não comprime abaixo do teto (gzip acima de 900 KiB)', zlib.gzipSync(Buffer.from(bruta, 'utf8')).length > 900 * 1024, true);
  await pagA.evaluate(async txt => { await Store.salvarNota('x4', { paginas: [{ fundo: 'pautado', itens: [{ t: 'texto', x: 10, y: 10, texto: txt, tam: 30, cor: '#1A1C1F' }] }] }); }, bruta);
  const escritas14 = pagA.escritas.length;
  const e14 = await enviar(pagA, true);
  const fila14 = (await filaToda(pagA)).filter(e => e.tipo === 'folha');
  const est14 = await esperar('o estado da nuvem anota a página grande', () => pagA.evaluate(() => { const r = Nuvem.estado().registros; return { erro: r.erro && r.erro.codigo, grandes: r.paginasGrandes, quarentena: r.quarentena }; }), v => !!(v && v.grandes && v.grandes.length === 1), 5000);
  console.log('   envio da página grande: ' + JSON.stringify(e14) + '; fila: ' + JSON.stringify(fila14) + '; estado: ' + JSON.stringify(est14.valor));
  prop('a página grande vai para a quarentena no primeiro envio, com o motivo, sem escrita em folhas/ e sem derrubar o envio', e14.erro === null && fila14.length === 1 && fila14[0].quarentena === true && fila14[0].motivo === 'PAGINA_GRANDE' && folhasEscritas(pagA, escritas14) === 0 &&
    est14.ok && est14.valor.erro === 'PAGINA_GRANDE' && est14.valor.grandes[0].aulaId === 'x4' && est14.valor.grandes[0].n === 0, MODOS[10]);
  if (MODO === MODOS[10]) throw fimDoVeneno();
  const frase14 = await esperar('a frase de Ajustes fala da folha grande', () => textoDaNuvem(pagA), v => /grande demais/.test(v || ''), 5000);
  console.log('   frase: ' + frase14.valor);
  conf('a frase diz QUAL folha (a aluna e a data da aula), por quê e o que fazer', /A folha de Aluna Alfa Teste \(aula de \d+ de \S+ de \d{4}\), página 1, é grande demais para a nuvem/.test(frase14.valor || '') && /divida a página em duas/.test(frase14.valor || ''), true);
  const diag14 = await pagA.evaluate(() => Nuvem.diagnosticoLocal());
  conf('o diagnóstico leva o código e a frase', diag14.erroCodigo === 'PAGINA_GRANDE' && /divida a página em duas/.test(diag14.erroFrase || ''), true);
  await pagA.evaluate(async () => { const n = await Store.lerNota('x1'); n.paginas[0].itens.push({ t: 'traco', cor: '#1A1C1F', esp: 4, pontos: [[13, 14, 0.5], [23, 24, 0.5]] }); await Store.salvarNota('x1', n); });
  const escritas14b = pagA.escritas.length;
  const e14b = await enviar(pagA, true);
  conf('o envio seguinte sobe a outra mudança e não tenta a página grande de novo (sem tentativas inúteis)', e14b.erro === null && e14b.enviados >= 1 && folhasEscritas(pagA, escritas14b) === 1 && (await filaToda(pagA)).filter(e => e.tipo === 'folha').length === 1, true);
  await pagA.evaluate(async txt => {
    const meio = txt.length >> 1;
    await Store.salvarNota('x4', { paginas: [{ fundo: 'pautado', itens: [{ t: 'texto', x: 10, y: 10, texto: txt.slice(0, meio), tam: 30, cor: '#1A1C1F' }] }, { fundo: 'pautado', itens: [{ t: 'texto', x: 10, y: 10, texto: txt.slice(meio), tam: 30, cor: '#1A1C1F' }] }] });
  }, bruta);
  const e14c = await enviar(pagA, true);
  conf('dividida em duas, as duas páginas sobem e a fila esvazia', e14c.erro === null && (await filaToda(pagA)).filter(e => e.tipo === 'folha').length === 0 && resumoDoc(await lerDoc(dona.idToken, dona.localId, 'folhas/folha:x4:1')) === 'apagadoEm=não bytes=sim', true);
  const limpou14 = await esperar('a frase da página grande saiu', () => pagA.evaluate(() => (Nuvem.estado().registros.erro || {}).codigo || null), v => v === null, 5000);
  conf('o erro PAGINA_GRANDE saiu quando a página saiu da quarentena', limpou14.ok, true);

  secao('15. A volta de uma versão anterior: a folha gravada solta é reconciliada com o estado e sobe');
  await editar(pagA, "d.ajustes.versaoVista = '1.42.18';");
  await enviar(pagA, true);
  // a versão anterior grava a nota solta e não conhece o estado por página; e a folha de ANTES da N2 (sem estado) fica como está
  await idb(pagA, "const s = t.objectStore('notas'); const g = s.get('x1'); g.onsuccess = () => { const n = g.result; n.paginas.push({ fundo: 'branco', itens: [{ t: 'traco', cor: '#777777', esp: 4, pontos: [[1, 2, 0.5], [3, 4, 0.5]] }] }); s.put(n, 'x1'); }; " +
    "s.put({ paginas: [{ fundo: 'pautado', itens: [{ t: 'traco', cor: '#777777', esp: 4, pontos: [[5, 6, 0.5], [7, 8, 0.5]] }] }] }, 'x5');");
  conf('a folha de x1 ganhou uma página por fora do estado (como a versão anterior grava)', await pagA.evaluate(async () => { const n = await Store.lerNota('x1'); const e = await Store.estadoDaFolha('x1'); return n.paginas.length + '/' + e.paginas.filter(p => !p.apagadoEm).length; }), '2/1');
  await H.abrirApp(pagA, amb.ORIGEM);
  const fila15 = await esperar('a reconciliação enfileirou a página nova', () => filaFolhas(pagA).then(l => l.map(f => f.id).join(',')), v => v === 'folha:x1:1', 8000);
  prop('de volta à versão nova, a reconciliação pôs na fila a página gravada solta', fila15.ok, MODOS[11]);
  if (MODO === MODOS[11]) throw fimDoVeneno();
  /* A folha de antes da N2 (sem estado por página, como todas as dela na
   * primeira abertura desta versão) NÃO entra na fila: nada sobe em bloco na
   * atualização; cada folha sobe quando for editada. */
  conf('a folha sem estado (de antes da N2) não entrou na fila nem ganhou estado na atualização', (await filaFolhas(pagA)).some(f => f.id.indexOf('folha:x5:') === 0) === false && (await pagA.evaluate(() => Store.estadoDaFolha('x5'))) === null, true);
  const e15 = await enviar(pagA, true);
  conf('e ela sobe', e15.erro === null && resumoDoc(await lerDoc(dona.idToken, dona.localId, 'folhas/folha:x1:1')) === 'apagadoEm=não bytes=sim' && (await filaFolhas(pagA)).length === 0, true);
  conf('a reconciliação direta não muda nada quando tudo bate', JSON.stringify(await pagA.evaluate(() => Store.reconciliarFolhas().then(r => [r.mudadas, r.lapides]))), '[0,0]');
  conf('nenhum erro de página em A e C depois das seções da revisão', [pagA, pagC].map(p => p.errosDePagina.join(' | ')).filter(Boolean).join(' || '), '');
  await pagC.close(); await contextoC.close();
})().then(() => derrubarEmulador().then(H.fim(amb)), e => derrubarEmulador().then(() => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e))));
