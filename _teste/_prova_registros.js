/* _prova_registros.js
 *
 * O que as duas provas do banco por registro (N1, fatia 1) têm em comum:
 * testa_banco_v5.js (dados fictícios, no portão) e
 * _prova_migracao_copias_reais.js (as cópias reais do Drive, só nesta máquina).
 *
 *   - a página NUA de prova (core.js, zip.js e store.js, sem app.js), para a
 *     prova mandar no banco sem o aplicativo gravando por conta própria;
 *   - o código REAL da versão 4 do store.js (_store_v4_historico.js, cópia do
 *     store.js de 016eef5), que monta o banco "de antes" de verdade, em vez
 *     de uma derivação textual do código novo;
 *   - os ajudantes que rodam DENTRO da página: a comparação canônica de dois
 *     documentos (por chave de registro, sem depender da ordem dos vetores
 *     nem da ordem das chaves), o espião de `put` por depósito, a leitura do
 *     banco por fora do Store e a régua de junho.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador.js');

const STORE = fs.readFileSync(path.join(H.RAIZ, 'store.js'), 'utf8');
const STORE_V4 = fs.readFileSync(path.join(__dirname, '_store_v4_historico.js'), 'utf8');

const PAGINA_NUA = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>prova do banco</title></head>' +
  '<body><p id="pronta">prova</p><script src="core.js"></script><script src="zip.js"></script><script src="store.js"></script></body></html>';

/* Âncoras do store.js novo. Cada uma tem de aparecer UMA vez. */
const ANCORAS = {
  versao6: 'var VERSAO_BANCO = 6;',
  criaRegistros: "s = b.createObjectStore('registros', { keyPath: 'id' });",
  criaControle: "if (!b.objectStoreNames.contains('controle')) b.createObjectStore('controle');",
  migracao: 'migrarParaRegistros(e.target.transaction, ',
  lacoDoVetor: '(Array.isArray(db[vetor]) ? db[vetor] : []).forEach(function (item) {',
  igual: 'if (antes && !antes.apagadoEm && antes.ordem === ordem && JSON.stringify(antes.dados) === texto) { contas.iguais++; return; }',
  apagadoPorFora: 'return apagarDocumento().then(function () { return null; });',
  principalFica: "if (!opcoes.semPrincipal) t.objectStore('dados').put(db, 'principal');",
  respondeNoCommit: "t.oncomplete = function () { confirmarGravacao(contas); avisarMudanca('dados'); resolve(); };"
};
/* Os venenos: o texto servido no lugar da âncora. */
const VENENOS = {
  /* a migração (e toda gravação) deixa o último item de cada vetor de fora */
  '--envenenado-perde-registro': ['lacoDoVetor', '(Array.isArray(db[vetor]) ? db[vetor] : []).slice(0, -1).forEach(function (item) {'],
  /* a comparação diz sempre "mudou": tudo é regravado a cada salvar */
  '--envenenado-regrava-tudo': ['igual', 'if (false) { contas.iguais++; return; }'],
  /* a regra antiga do carregar: sem principal, os registros vivos montam o
   * documento de volta (o "Apagar tudo" do código da versão 4 é desfeito) */
  '--envenenado-registros-ressuscitam': ['apagadoPorFora', 'return completar(montar(lido.registros));']
};

function conferirAncoras(conf) {
  Object.keys(ANCORAS).forEach(k => conf('âncora uma vez só no store.js: ' + k, STORE.split(ANCORAS[k]).length, 2));
  conf('o código histórico da versão 4 está na versão 4', STORE_V4.split('var VERSAO_BANCO = 4;').length, 2);
  conf('e não conhece o depósito de registros', STORE_V4.indexOf("'registros'"), -1);
}

function storeEnvenenado(modo) {
  if (!modo || !VENENOS[modo]) return STORE;
  const [chave, troca] = VENENOS[modo];
  return STORE.split(ANCORAS[chave]).join(troca);
}

/* Ajudantes que rodam dentro da página: instalados uma vez por página. */
const AJUDANTES = function () {
  if (window.__prova) return;
  const P = {};
  /* Chaves canônicas de cada item, as mesmas do store.js. */
  P.chave = function (tipo, item) {
    if (tipo === 'resumo') return 'resumo:' + (item && item.alunoId) + ':' + (item && item.mes);
    return tipo + ':' + (item && item.id);
  };
  P.ordenaChaves = function (v) {
    if (Array.isArray(v)) return v.map(P.ordenaChaves);
    if (v && typeof v === 'object') {
      const o = {};
      Object.keys(v).sort().forEach(k => { if (v[k] !== undefined) o[k] = P.ordenaChaves(v[k]); });
      return o;
    }
    return v;
  };
  /* O documento em forma canônica: cada vetor vira um objeto por chave de
   * registro (com sufixo para repetição), as chaves em ordem, e o texto JSON
   * disso. Dois documentos iguais em conteúdo dão o mesmo texto, qualquer que
   * seja a ordem dos vetores ou das chaves dos objetos. */
  P.canon = function (db) {
    if (!db) return 'null';
    const saida = {};
    const vetores = { alunos: 'aluno', series: 'serie', aulas: 'aula', resumos: 'resumo', pagamentos: 'pagamento' };
    Object.keys(vetores).forEach(v => {
      const mapa = {}, usadas = {};
      (db[v] || []).forEach(item => {
        let k = P.chave(vetores[v], item), n = 2;
        const base = k;
        while (usadas[k]) k = base + '#' + (n++);
        usadas[k] = true;
        mapa[k] = item;
      });
      saida[v] = mapa;
    });
    saida.ajustes = db.ajustes || {};
    Object.keys(db).forEach(k => { if (!vetores[k] && k !== 'ajustes') saida['raiz:' + k] = db[k]; });
    return JSON.stringify(P.ordenaChaves(saida));
  };
  /* A ORDEM dos vetores e das chaves, como texto: a prova compara isto além
   * da forma canônica, porque o montar tem de devolver o documento na ordem
   * em que foi salvo. */
  P.ordem = function (db) {
    if (!db) return 'null';
    return JSON.stringify({
      alunos: (db.alunos || []).map(a => a.id), series: (db.series || []).map(s => s.id), aulas: (db.aulas || []).map(a => a.id),
      resumos: (db.resumos || []).map(r => r.alunoId + ':' + r.mes), pagamentos: (db.pagamentos || []).map(p => p.id),
      ajustes: Object.keys(db.ajustes || {})
    });
  };
  P.contagens = function (db) {
    return {
      alunos: (db.alunos || []).length, series: (db.series || []).length, aulas: (db.aulas || []).length,
      resumos: (db.resumos || []).length, pagamentos: (db.pagamentos || []).length,
      ajustes: Object.keys(db.ajustes || {}).length
    };
  };
  /* A régua de junho: os alunos que têm, em junho de 2026, exatamente 10
   * encontros e 630 minutos (10:30), com o valor que o fechamento dá a cada
   * um (R$ 1.050,00 no caso de referência, quando a vigência do preço cobre
   * junho). Só ids e números, nunca nomes. */
  P.regua = function (db) {
    const casos = [];
    (db.alunos || []).forEach(a => {
      try {
        const f = Core.calcularFechamento(db, a.id, '2026-06');
        if (f && f.linhas && f.linhas.length === 10 && f.totalMin === 630) casos.push({ id: a.id, valor: Math.round(f.totalValor * 100) / 100, horas: f.totalHoras });
      } catch (e) { /* aluno sem o que fechar */ }
    });
    casos.sort((x, y) => (x.id < y.id ? -1 : 1));
    return { quantos: casos.length, com1050: casos.filter(c => c.valor === 1050).length, casos, texto: JSON.stringify(casos) };
  };
  /* O banco lido POR FORA do Store, por depósito. */
  P.abrirBanco = function () {
    return new Promise((res, rej) => {
      const q = indexedDB.open('apoio-educacional');
      q.onsuccess = () => res(q.result);
      q.onerror = () => rej(q.error);
    });
  };
  P.porFora = function (fazer) {
    return P.abrirBanco().then(b => new Promise((res, rej) => {
      const nomes = Array.from(b.objectStoreNames);
      const t = b.transaction(nomes, 'readonly');
      const saida = {};
      fazer(t, saida, nomes);
      t.oncomplete = () => { b.close(); res(saida); };
      t.onerror = () => { b.close(); rej(t.error); };
    }));
  };
  P.contagensDosDepositos = function () {
    return P.porFora((t, saida, nomes) => {
      nomes.forEach(n => { const c = t.objectStore(n).count(); c.onsuccess = () => { saida[n] = c.result; }; });
    });
  };
  /* Pelo Store primeiro: um open sem versão num banco que ainda não existe o
   * criaria na versão 1, vazio, e o Store nunca mais subiria. */
  P.versaoEDepositos = function () {
    return Store.carregar().then(P.abrirBanco).then(b => {
      const s = { versao: b.version, depositos: Array.from(b.objectStoreNames).sort() }; b.close(); return s;
    });
  };
  P.principalPorFora = function () {
    return P.porFora((t, saida) => {
      const g = t.objectStore('dados').get('principal');
      g.onsuccess = () => { saida.principal = g.result || null; };
    }).then(s => s.principal);
  };
  P.registrosPorFora = function () {
    return P.porFora((t, saida) => {
      const g = t.objectStore('registros').getAll();
      g.onsuccess = () => { saida.registros = g.result || []; };
    }).then(s => s.registros);
  };
  /* Grava o principal por fora (como o código antigo ou uma prova faria). */
  P.semearPrincipal = function (db) {
    return P.abrirBanco().then(b => new Promise((res, rej) => {
      const t = b.transaction('dados', 'readwrite');
      t.objectStore('dados').put(db, 'principal');
      t.oncomplete = () => { b.close(); res(); };
      t.onerror = () => { b.close(); rej(t.error); };
      t.onabort = () => { b.close(); rej(t.error); };
    }));
  };
  /* O espião de put: conta, por depósito, quantos puts o Store fez, e guarda
   * as chaves dos de `registros`. */
  const original = IDBObjectStore.prototype.put;
  P.puts = { registros: [], dados: 0, controle: 0, outros: 0 };
  IDBObjectStore.prototype.put = function (valor, chave) {
    if (this.name === 'registros') P.puts.registros.push(valor && valor.id);
    else if (this.name === 'dados') P.puts.dados++;
    else if (this.name === 'controle') P.puts.controle++;
    else P.puts.outros++;
    return original.apply(this, arguments);
  };
  P.zerarPuts = function () { P.puts = { registros: [], dados: 0, controle: 0, outros: 0 }; };
  P.resumoDosRegistros = function (lista) {
    const vivos = lista.filter(r => !r.apagadoEm), lapides = lista.filter(r => !!r.apagadoEm);
    const porTipo = {};
    vivos.forEach(r => { porTipo[r.tipo] = (porTipo[r.tipo] || 0) + 1; });
    const campos = lista.every(r => typeof r.id === 'string' && typeof r.tipo === 'string' && typeof r.atualizadoEm === 'string' &&
      ('apagadoEm' in r) && typeof r.aparelho === 'string' && typeof r.esquema === 'number' && typeof r.ordem === 'number');
    const lapidesSemDados = lapides.every(r => r.dados === null);
    const aparelhos = Array.from(new Set(lista.map(r => r.aparelho)));
    return { total: lista.length, vivos: vivos.length, lapides: lapides.length, porTipo, campos, lapidesSemDados, aparelhos: aparelhos.length };
  };
  window.__prova = P;
};

async function abrirPaginaNua(amb, trocas, storeServido) {
  trocas['/store.js'] = storeServido;
  amb.extras['/prova.html'] = { tipo: 'text/html; charset=utf-8', corpo: PAGINA_NUA };
  const pag = await amb.pagina();
  await pag.setBypassServiceWorker(true);
  await pag.goto(amb.ORIGEM + '/prova.html', { waitUntil: 'networkidle0' });
  await pag.waitForFunction(() => typeof Store === 'object' && typeof Core === 'object', { timeout: 20000 });
  await pag.evaluate(AJUDANTES);
  return pag;
}

module.exports = { STORE, STORE_V4, PAGINA_NUA, ANCORAS, VENENOS, conferirAncoras, storeEnvenenado, AJUDANTES, abrirPaginaNua };
