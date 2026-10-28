/* testa_banco_v3.js
 *
 * C2a sobe o banco do aparelho de 2 para 3, só criando o depósito
 * biblioteca_listas. Três coisas que uma subida de versão tem de cobrir:
 *
 *   1. a subida de 2 para 3 não perde nada: o banco é montado pelo código na
 *      versão 2 (o store.js servido com VERSAO_BANCO = 2 e sem o depósito
 *      novo), com dados fictícios em todos os depósitos dela; o código novo
 *      abre, sobe, e as contagens são as mesmas, com o depósito novo vazio;
 *   2. código mais velho que o banco: o store.js servido pede uma versão
 *      menor que a do banco, o navegador recusa (VersionError), e a tela diz
 *      o que fazer em vez de mostrar a mensagem técnica;
 *   3. duas janelas: com uma janela aberta, outra sobe o banco para uma versão
 *      maior; a primeira fecha a conexão (a outra não fica bloqueada) e avisa
 *      que foi atualizado em outra janela.
 *
 * O código "mais velho" e o "mais novo" são o código deste commit com só o
 * número da versão trocado, porque o que se prova é o tratamento que este
 * código dá. O comportamento da versão 1.29.1, que já está no ar e não tem
 * esse tratamento, foi medido à parte e está descrito no PR do C2a.
 *
 * O service worker é contornado (setBypassServiceWorker), para cada página
 * receber exatamente o arquivo servido naquele momento.
 *
 * Modos envenenados:
 *   --envenenado-versao-tecnica  o código mais velho que o banco volta a
 *                                mostrar a mensagem técnica.
 *   --envenenado-troca-calada    a janela antiga não avisa quando outra sobe
 *                                o banco.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8841;
const MODO = ['--envenenado-versao-tecnica', '--envenenado-troca-calada']
  .filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const STORE = fs.readFileSync(path.join(H.RAIZ, 'store.js'), 'utf8');

const V3 = 'var VERSAO_BANCO = 3;';
const CRIA_LISTAS = /    if \(!b\.objectStoreNames\.contains\('biblioteca_listas'\)\) \{\r?\n      b\.createObjectStore\('biblioteca_listas', \{ keyPath: 'id' \}\);\r?\n    \}\r?\n/;
const RAMO_VERSAO = 'if (e && e.versaoNova) {';
const AVISA_TROCA = "if (typeof root.aoBancoTrocado === 'function') root.aoBancoTrocado();";

secao('0. As âncoras');
conf('o store.js está na versão 3', STORE.split(V3).length, 2);
conf('o store.js cria o depósito das listas uma vez', (STORE.match(new RegExp(CRIA_LISTAS.source, 'g')) || []).length, 1);
conf('o app.js tem o ramo da versão mais nova uma vez', APP.split(RAMO_VERSAO).length, 2);
conf('o store.js avisa a troca uma vez', STORE.split(AVISA_TROCA).length, 2);

const STORE_V2 = STORE.replace(V3, 'var VERSAO_BANCO = 2;').replace(CRIA_LISTAS, '');
const STORE_V4 = STORE.replace(V3, 'var VERSAO_BANCO = 4;');
const trocas = {};
const APP_SERVIDO = MODO === '--envenenado-versao-tecnica' ? APP.split(RAMO_VERSAO).join('if (false) {') : APP;
const STORE_SERVIDO = MODO === '--envenenado-troca-calada' ? STORE.split(AVISA_TROCA).join('') : STORE;
if (APP_SERVIDO !== APP) trocas['/app.js'] = APP_SERVIDO;
if (STORE_SERVIDO !== STORE) trocas['/store.js'] = STORE_SERVIDO;
const amb = H.criarAmbiente(PORTA, 'perfil_banco_v3', trocas);

const versaoEDepositos = pag => pag.evaluate(() => new Promise(r => {
  const q = indexedDB.open('apoio-educacional');
  q.onsuccess = () => { const b = q.result; const s = { versao: b.version, depositos: Array.from(b.objectStoreNames).sort() };
    b.close(); r(s); };
  q.onerror = () => r(null);
}));
const contagens = pag => pag.evaluate(() => new Promise(r => {
  const q = indexedDB.open('apoio-educacional');
  q.onsuccess = () => {
    const b = q.result;
    const nomes = Array.from(b.objectStoreNames).sort();
    const t = b.transaction(nomes, 'readonly');
    const saida = {};
    nomes.forEach(n => { const c = t.objectStore(n).count(); c.onsuccess = () => { saida[n] = c.result; }; });
    const g = t.objectStore('dados').get('principal');
    g.onsuccess = () => { const d = g.result || {};
      saida.alunos = (d.alunos || []).length; saida.aulas = (d.aulas || []).length; saida.resumos = (d.resumos || []).length; };
    t.oncomplete = () => { b.close(); r(saida); };
  };
}));

(async () => {
  if (MODO) {
    secao('O veneno é de verdade');
    conf('um arquivo servido ficou diferente do repositório (' + MODO + ')', Object.keys(trocas).length, 1);
  }
  await amb.subir();

  // ================================================================
  secao('1. A subida de 2 para 3 não perde nada');
  trocas['/store.js'] = STORE_V2;
  const pag = await amb.pagina();
  await pag.setBypassServiceWorker(true);
  await H.abrirApp(pag, amb.ORIGEM);
  await pausa(1000);
  const v2 = await versaoEDepositos(pag);
  conf('o banco montado pelo código de antes está na versão 2', v2 && v2.versao, 2);
  conf('e não tem o depósito das listas', v2 && v2.depositos.indexOf('biblioteca_listas') >= 0, false);
  /* Dados fictícios em cada depósito que é dela, por fora do aplicativo. */
  await pag.evaluate(async () => {
    const d = await Store.carregar();
    d.alunos = [1, 2, 3].map(k => ({ id: 'a' + k, nome: 'Aluna Teste ' + k, ativo: true, precos: [] }));
    d.aulas = [];
    for (let k = 0; k < 40; k++) d.aulas.push({ id: 'aula' + k, alunoId: 'a' + (1 + k % 3), data: '2026-06-' + String(1 + k % 28).padStart(2, '0'),
      hora: '10:00', duracaoMin: 60, status: 'realizada', cobravel: true, temas: [], areas: [], anexos: [] });
    d.resumos = [{ alunoId: 'a1', mes: '2026-06', texto: 'Resumo de prova' }];
    d.ajustes = Object.assign({}, d.ajustes, { versaoVista: '9.9.9' });
    await Store.salvar(d);
    await Store.salvarNota('aula1', { paginas: [{ itens: [] }] });
    await Store.registrarUsoBiblioteca({ itemId: 'x:1', alunoId: 'a1', aulaId: 'aula1', data: '2026-06-02' });
    await Store.gravarEtiquetaBiblioteca({ itemId: 'x:1', dificuldade: 2, data: '2026-06-02' });
    await Store.registrarHistorico('ponto de prova', d);
  });
  const antes = await contagens(pag);
  await pag.close();
  // o código deste commit, na versão 3
  delete trocas['/store.js'];
  if (STORE_SERVIDO !== STORE) trocas['/store.js'] = STORE_SERVIDO;
  const pag2 = await amb.pagina();
  await pag2.setBypassServiceWorker(true);
  await H.abrirApp(pag2, amb.ORIGEM);
  await pausa(1000);
  const v3 = await versaoEDepositos(pag2);
  conf('o código novo subiu o banco para a versão 3', v3 && v3.versao, 3);
  conf('com o depósito das listas', v3 && v3.depositos.indexOf('biblioteca_listas') >= 0, true);
  const depois = await contagens(pag2);
  const chaves = Object.keys(antes).sort();
  conf('as contagens de antes, depósito por depósito, são as de depois',
    chaves.map(k => k + '=' + antes[k]).join(' '), chaves.map(k => k + '=' + depois[k]).join(' '));
  conf('e o depósito novo começa vazio', depois.biblioteca_listas, 0);
  console.log('   contagens: ' + JSON.stringify(depois));

  // ================================================================
  secao('2. Código mais velho que o banco: a tela diz o que fazer');
  await pag2.close();
  trocas['/store.js'] = STORE_V2;
  const pag3 = await amb.pagina();
  await pag3.setBypassServiceWorker(true);
  await pag3.goto(amb.ORIGEM + '/index.html', { waitUntil: 'networkidle0' });
  const tela3 = await esperar('a tela do código mais velho', () => pag3.evaluate(() => document.body.innerText),
    t => /versão anterior do aplicativo|Não foi possível abrir os dados/.test(t || ''), 10000);
  const texto3 = tela3.valor || '';
  console.log('   tela: ' + JSON.stringify(texto3.slice(0, 200)));
  if (MODO === '--envenenado-versao-tecnica') {
    secao('VENENO: a mensagem técnica volta');
    conf('envenenado: a tela mostra a mensagem técnica (defeito enxergado)', /Não foi possível abrir os dados/.test(texto3), true);
    throw Object.assign(new Error('fim'), { fimDoVeneno: true });
  }
  conf('a tela não fica em branco', texto3.trim().length > 0, true);
  conf('e diz que esta janela é de uma versão anterior', /versão anterior do aplicativo/.test(texto3), true);
  conf('e o que fazer', /Feche o aplicativo e abra de novo/.test(texto3), true);
  conf('sem a mensagem técnica do navegador', /VersionError|version|versão solicitada/i.test(texto3.replace(/versão anterior|versão mais nova/g, '')), false);
  conf('e o banco continua na versão 3', (await versaoEDepositos(pag3)).versao, 3);
  await pag3.close();

  // ================================================================
  secao('3. Duas janelas: a antiga larga o banco e avisa');
  trocas['/store.js'] = STORE_SERVIDO;
  const pagA = await amb.pagina();
  await pagA.setBypassServiceWorker(true);
  await H.abrirApp(pagA, amb.ORIGEM);
  await pausa(800);
  // uma janela com uma versão mais nova do banco abre agora
  trocas['/store.js'] = STORE_V4;
  const pagB = await amb.pagina();
  await pagB.setBypassServiceWorker(true);
  await H.abrirApp(pagB, amb.ORIGEM);
  const subiu = await esperar('o banco na versão 4', () => versaoEDepositos(pagB), v => !!v && v.versao === 4, 10000);
  conf('a janela nova subiu o banco, sem ficar bloqueada', subiu.ok, true);
  conf('e não mostra o aviso de bloqueio', await pagB.evaluate(() => !!document.querySelector('#aviso-banco-bloqueado')), false);
  await pagA.bringToFront();
  const avisou = await esperar('o aviso na janela antiga', () => pagA.evaluate(() =>
    (document.querySelector('#aviso-banco-trocado') || {}).textContent || ''), t => /atualizado em outra janela/.test(t || ''), 5000);
  if (MODO === '--envenenado-troca-calada') {
    secao('VENENO: a janela antiga larga o banco calada');
    conf('envenenado: nenhum aviso na janela antiga (defeito enxergado)', avisou.ok, false);
    throw Object.assign(new Error('fim'), { fimDoVeneno: true });
  }
  conf('a janela antiga avisa que foi atualizado em outra janela', avisou.ok, true);
  conf('e diz que nada guardado se perdeu', /continua lá/.test(avisou.valor || ''), true);

  secao('4. Nenhum erro de página');
  conf('nenhum erro nas janelas', [pag, pag2, pag3, pagA, pagB].map(p => p.errosDePagina.join(' | ')).filter(Boolean).join(' || '), '');
})().then(() => H.fim(amb)(), e => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e)));
