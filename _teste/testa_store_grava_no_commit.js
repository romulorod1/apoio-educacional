/* testa_store_grava_no_commit.js
 *
 * O salvar só pode dizer "salvo" quando o dado ESTÁ salvo.
 *
 * O defeito que esta prova existe para impedir: o `gravar` do store.js
 * respondia no `onsuccess` do PEDIDO, e não no `oncomplete` da TRANSAÇÃO. O
 * pedido aceito ainda não é dado no disco: entre um evento e o outro há uns
 * milissegundos em que a página pode morrer (aba fechada, tablet matando o
 * aplicativo em segundo plano), e a transação aborta. O aplicativo já tinha
 * seguido como se estivesse salvo, e o dado sumia calado. Medido em 24/09: 7
 * perdas em 300 cortes com o código antigo, 0 em 300 esperando a transação
 * (Fisher bicaudal p = 0,0151). O `Store.salvar`, que guarda as aulas e os
 * alunos dela, passava pelo mesmo `gravar`.
 *
 * Uma prova que grava, espera e só depois recarrega a página NÃO vê este
 * defeito: a janela fecha antes de o corte chegar. Por isso as duas partes
 * abaixo interrompem no instante exato em que a promessa resolve, sem await no
 * meio e sem volta ao Node.
 *
 * O que prova:
 *   0. CALIBRAGEM: a leitura enxerga uma perda de verdade. Três gravações
 *      abortadas de propósito têm de ler como ausentes; se lerem 2048, quem
 *      está cego é o lado da leitura e nenhum número daqui vale.
 *   1. CADA CAMINHO DE ESCRITA, interrompido no instante em que responde: o
 *      teste anota toda transação que o Store abre durante a chamada e, na
 *      microtarefa em que a promessa resolve, tenta ABORTAR as que ainda não
 *      confirmaram (é o que a página caindo faz). Com o conserto não sobra
 *      nenhuma para abortar e o dado está lá depois. Os caminhos: salvar (os
 *      dados dela), salvarNota, salvarMidia, salvarAnexo, apagarAnexo,
 *      registrarUsoBiblioteca, gravarEtiquetaBiblioteca, registrarHistorico e
 *      limparHistorico. Esta parte é determinística: não depende de sorte.
 *   2. A RÉGUA DO CORTE: 300 ciclos de salvarAnexo com `location.reload()`
 *      chamado dentro da microtarefa da resolução, lendo o anexo depois que a
 *      página volta. Com o conserto, 0 perdas em 300.
 *   3. nenhum erro de JavaScript na página.
 *
 * Modo envenenado:
 *   node _teste/testa_store_grava_no_commit.js --envenenado-grava-no-pedido
 *     o store.js servido volta a ter o `gravar` antigo, que responde no
 *     `onsuccess` do pedido. Os outros caminhos continuam consertados, de
 *     propósito: a prova tem de acusar EXATAMENTE os quatro caminhos que passam
 *     pelo `gravar` (salvar, salvarNota, salvarMidia, salvarAnexo), e deixar os
 *     outros cinco verdes. E a régua do corte tem de achar pelo menos uma perda
 *     em 300 (a taxa medida é 2,3%; a chance de zero em 300 é perto de 0,1%).
 *   node _teste/testa_store_grava_no_commit.js --envenenado-escreve-no-pedido
 *     o segundo veneno, um degrau abaixo: o `escrever` (por onde passa TODA
 *     escrita simples) volta a responder no `onsuccess` do pedido. Sem ele, as
 *     asserções dos cinco caminhos que não passam pelo `gravar` nunca teriam
 *     mostrado que sabem reprovar. Aqui oito dos nove têm de acusar. O nono, o
 *     registrarHistorico, NÃO acusa, e isso é medida e não descuido: depois de
 *     gravar ele poda o histórico com uma leitura no mesmo depósito, e a
 *     leitura espera a escrita confirmar antes de rodar, então a resposta dele
 *     já chega depois da confirmação mesmo com o `escrever` envenenado.
 *   node _teste/testa_store_grava_no_commit.js --envenenado-grava-no-pedido --controle
 *     o mesmo veneno com as expectativas do modo normal. TEM de reprovar: é a
 *     demonstração da linha da reprovação, e por isso não entra no portão.
 *
 * Os ciclos da régua podem ser mudados com CICLOS=n para olhar de perto, mas o
 * portão roda com o número declarado aqui.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa } = H;

const PORTA = 8812;
const VENENO_GRAVAR = process.argv.indexOf('--envenenado-grava-no-pedido') !== -1;
const VENENO_ESCREVER = process.argv.indexOf('--envenenado-escreve-no-pedido') !== -1;
const VENENO = VENENO_GRAVAR || VENENO_ESCREVER;
const CONTROLE = process.argv.indexOf('--controle') !== -1;
/* O que se espera: no modo normal e no controle, o comportamento consertado.
 * Só o veneno sem controle espera ver a perda. */
const ESPERA_PERDA = VENENO && !CONTROLE;
const CICLOS = Number(process.env.CICLOS || 300);

const STORE_REPO = fs.readFileSync(path.join(H.RAIZ, 'store.js'), 'utf8');
/* O worktree pode estar com CRLF (core.autocrlf): a âncora tolera o \r, e a
 * troca é conferida antes de servir. Uma troca que não acontece seria medir o
 * código consertado duas vezes, chamando uma delas de veneno. */
const GRAVAR_CONSERTADO = /[ ]{2}function gravar\(deposito, chave, valor\) \{\r?\n[ ]*return escrever\(deposito, function \(s\) \{ return s\.put\(valor, chave\); \}\);\r?\n[ ]{2}\}/;
const GRAVAR_ANTIGO =
  "  function gravar(deposito, chave, valor) {\n" +
  "    return trans(deposito, 'readwrite').then(function (s) { return comoPromessa(s.put(valor, chave)); });\n" +
  "  }";
/* O segundo veneno: o `escrever` responde no pedido e não na transação. */
const ESCREVER_CONSERTADO = /t\.oncomplete = function \(\) \{ resolve\(req \? req\.result : undefined\); \};/;
const ESCREVER_ANTIGO = 'if (req) req.onsuccess = function () { resolve(req.result); }; ' +
  't.oncomplete = function () { resolve(req ? req.result : undefined); };';
const ANCORA = VENENO_ESCREVER ? ESCREVER_CONSERTADO : GRAVAR_CONSERTADO;
const trocas = {};
let trocaFeita = false;
if (VENENO) {
  if (ANCORA.test(STORE_REPO)) {
    trocas['/store.js'] = STORE_REPO.replace(ANCORA, VENENO_ESCREVER ? ESCREVER_ANTIGO : GRAVAR_ANTIGO);
    trocaFeita = trocas['/store.js'] !== STORE_REPO;
  }
}

const amb = H.criarAmbiente(PORTA, 'perfil_store_commit', trocas);

/* ------------------------------------------------------------------ */
/* Instrumento da parte 1: anota as transações que o Store abre e,     */
/* quando a promessa resolve, aborta as de escrita que não confirmaram. */
/* ------------------------------------------------------------------ */
async function instalarEspiao(pag) {
  await pag.evaluate(() => {
    if (window.__espiao) return;
    const original = IDBDatabase.prototype.transaction;
    const espiao = { ligado: false, criadas: [] };
    IDBDatabase.prototype.transaction = function () {
      const t = original.apply(this, arguments);
      if (espiao.ligado) {
        const reg = { t, completou: false };
        t.addEventListener('complete', () => { reg.completou = true; });
        espiao.criadas.push(reg);
      }
      return t;
    };
    window.__espiao = espiao;
    /* Chama Store[nome](...args) e, NA MICROTAREFA em que a promessa resolve,
     * aborta toda transação de escrita que ainda não confirmou. Devolve quantas
     * estavam pendentes e quantas o abort de fato derrubou. */
    window.__interrompeNaResposta = function (nome, args) {
      espiao.criadas = [];
      espiao.ligado = true;
      return Store[nome].apply(Store, args).then(function () {
        espiao.ligado = false;
        const pendentes = espiao.criadas.filter(r => r.t.mode === 'readwrite' && !r.completou);
        let derrubadas = 0;
        pendentes.forEach(r => { try { r.t.abort(); derrubadas++; } catch (e) { /* já tinha terminado */ } });
        return { pendentes: pendentes.length, derrubadas };
      }, function (e) {
        espiao.ligado = false;
        return { erro: String(e && e.message || e) };
      });
    };
  });
}

/* Os nove caminhos. `prepara` deixa o estado anterior (com await normal),
 * `chama` é a escrita interrompida, `le` devolve o que ficou, `esperado` é o
 * que tem de ter ficado se a escrita valeu. `pelo_gravar` diz se o caminho
 * passa pelo `gravar`, que é o que o veneno devolve ao estado antigo. */
const CAMINHOS = [
  {
    nome: 'salvar (os dados dela: alunos, aulas)', pelo_gravar: true,
    prepara: () => Store.carregar().then(d => { d = d || Store.bancoVazio(); d.ajustes.__marca = 'antes'; return Store.salvar(d); }),
    chama: ['salvar', '__DADOS_DEPOIS__'],
    le: () => Store.carregar().then(d => d && d.ajustes ? d.ajustes.__marca : 'sem dados'),
    esperado: 'depois'
  },
  {
    nome: 'salvarNota (a folha da aula)', pelo_gravar: true,
    prepara: () => Store.salvarNota('aula-prova-commit', { paginas: [{ itens: [], rotulo: 'antes' }] }),
    chama: ['salvarNota', 'aula-prova-commit', { paginas: [{ itens: [], rotulo: 'depois' }] }],
    le: () => Store.lerNota('aula-prova-commit').then(n => n ? n.paginas[0].rotulo : 'sem nota'),
    esperado: 'depois'
  },
  {
    nome: 'salvarMidia (imagem colada na folha)', pelo_gravar: true,
    prepara: () => Promise.resolve(),
    chama: ['salvarMidia', 'midia-prova-commit', { tipo: 'image/png', rotulo: 'depois' }],
    le: () => Store.lerMidia('midia-prova-commit').then(m => m ? m.rotulo : 'sem midia'),
    esperado: 'depois'
  },
  {
    nome: 'salvarAnexo (o PDF anexado na aula)', pelo_gravar: true,
    prepara: () => Promise.resolve(),
    chama: ['salvarAnexo', 'anexo-prova-commit', '__BLOB_2048__'],
    le: () => Store.lerAnexo('anexo-prova-commit').then(r => (r && r.blob ? r.blob.size : -1)),
    esperado: 2048
  },
  {
    nome: 'apagarAnexo', pelo_gravar: false,
    prepara: () => Store.salvarAnexo('anexo-prova-apagar', { nome: 'a.pdf', tipo: 'application/pdf', blob: new Blob([new Uint8Array(16)]) }),
    chama: ['apagarAnexo', 'anexo-prova-apagar'],
    le: () => Store.lerAnexo('anexo-prova-apagar').then(r => (r ? 'ainda la' : 'apagado')),
    esperado: 'apagado'
  },
  {
    nome: 'registrarUsoBiblioteca', pelo_gravar: false,
    prepara: () => Promise.resolve(),
    chama: ['registrarUsoBiblioteca', { itemId: 'item-prova-commit', alunoId: 'a1', aulaId: 'x', data: '2026-09-24' }],
    le: () => Store.usoDaBiblioteca().then(l => l.filter(u => u.itemId === 'item-prova-commit').length),
    esperado: 1
  },
  {
    nome: 'gravarEtiquetaBiblioteca', pelo_gravar: false,
    prepara: () => Promise.resolve(),
    chama: ['gravarEtiquetaBiblioteca', { itemId: 'item-prova-commit', dificuldade: 3, data: '2026-09-24' }],
    le: () => Store.etiquetasDaBiblioteca().then(l => (l.find(e => e.itemId === 'item-prova-commit') || {}).dificuldade),
    esperado: 3
  },
  {
    nome: 'registrarHistorico (o ponto do desfazer)', pelo_gravar: false, poda_depois: true,
    prepara: () => Store.limparHistorico(),
    chama: ['registrarHistorico', 'prova do commit', { alunos: [], aulas: [] }],
    le: () => Store.listarHistorico().then(l => l.filter(h => h.rotulo === 'prova do commit').length),
    esperado: 1
  },
  {
    nome: 'limparHistorico', pelo_gravar: false,
    prepara: () => Store.registrarHistorico('para limpar', { alunos: [] }),
    chama: ['limparHistorico'],
    le: () => Store.listarHistorico().then(l => l.length),
    esperado: 0
  }
];

async function rodaCaminho(pag, c) {
  const prep = await pag.evaluate('(' + c.prepara.toString() + ')().then(() => "ok", e => "erro: " + e.message)');
  if (prep !== 'ok') { conf(c.nome + ': preparou o estado anterior', prep, 'ok'); return; }
  const r = await pag.evaluate(chamada => {
    const nome = chamada[0];
    const args = chamada.slice(1).map(a => {
      if (a === '__BLOB_2048__') {
        return { nome: 'material.pdf', tipo: 'application/pdf', blob: new Blob([new Uint8Array(2048)], { type: 'application/pdf' }) };
      }
      return a;
    });
    if (args[0] === '__DADOS_DEPOIS__') {
      return Store.carregar().then(d => { d.ajustes.__marca = 'depois'; return window.__interrompeNaResposta(nome, [d]); });
    }
    return window.__interrompeNaResposta(nome, args);
  }, c.chama);
  if (r.erro) { conf(c.nome + ': a escrita respondeu sem erro', r.erro, 'sem erro'); return; }
  const lido = await pag.evaluate('(' + c.le.toString() + ')()');
  const morde = ESPERA_PERDA && (VENENO_ESCREVER ? !c.poda_depois : c.pelo_gravar);
  if (morde) {
    conf('VENENO ENXERGADO em ' + c.nome + ': respondeu com a transação ainda aberta', r.pendentes > 0, true);
    conf('VENENO ENXERGADO em ' + c.nome + ': interrompida no instante da resposta, a escrita SUMIU',
      String(lido) !== String(c.esperado), true);
  } else {
    conf(c.nome + ': quando respondeu, nenhuma transação de escrita estava aberta', r.pendentes, 0);
    conf(c.nome + ': interrompida no instante da resposta, a escrita continua lá', lido, c.esperado);
  }
}

/* ------------------------------------------------------------------ */
/* Parte 2: a régua do corte, com a página recarregando de verdade.     */
/* ------------------------------------------------------------------ */
async function voltou(pag, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < (ms || 30000)) {
    try {
      const ok = await pag.evaluate(() => typeof Store === 'object' &&
        window.__antesDoCorte === undefined && !!document.querySelector('#abas .aba'));
      if (ok) return true;
    } catch (e) { /* o documento sumiu: é a navegação acontecendo */ }
    await pausa(50);
  }
  return false;
}
const leAnexo = (pag, id) => pag.evaluate(
  i => Store.lerAnexo(i).then(r => (r && r.blob ? r.blob.size : -1)).catch(() => -2), id);
/* O CORTE: grava pelo caminho do aplicativo e recarrega DENTRO da microtarefa
 * da resolução. Nada de await entre uma coisa e outra. */
const gravaECorta = (pag, id) => pag.evaluate(i => {
  window.__antesDoCorte = i;
  Store.salvarAnexo(i, {
    nome: 'material-antigo.pdf', tipo: 'application/pdf',
    blob: new Blob([new Uint8Array(2048)], { type: 'application/pdf' })
  }).then(function () { location.reload(); });
}, id);
/* CALIBRAGEM: grava e aborta de propósito. A leitura tem de dar -1. */
const gravaEAborta = (pag, id) => pag.evaluate(i => new Promise((resolve, reject) => {
  const req = indexedDB.open('apoio-educacional');
  req.onsuccess = () => {
    const b = req.result;
    const t = b.transaction('anexos', 'readwrite');
    t.objectStore('anexos').put({
      nome: 'material-antigo.pdf', tipo: 'application/pdf',
      blob: new Blob([new Uint8Array(2048)], { type: 'application/pdf' })
    }, i);
    t.onabort = () => { b.close(); resolve('abortou'); };
    t.oncomplete = () => { b.close(); resolve('completou'); };
    t.abort();
  };
  req.onerror = () => reject(req.error);
}), id);

(async () => {
  console.log('MODO: ' + (VENENO_GRAVAR ? 'envenenado (gravar antigo, que responde no pedido)'
    : VENENO_ESCREVER ? 'envenenado (escrever responde no pedido)' : 'normal') +
    (CONTROLE ? ', COM CONTROLE: tem de reprovar' : ''));
  if (VENENO) {
    secao('O veneno é de verdade');
    conf('achei no store.js o trecho consertado que o veneno troca', ANCORA.test(STORE_REPO), true);
    conf('o store.js servido ficou DIFERENTE do repositório', trocaFeita ? 'diferente' : 'IGUAL', 'diferente');
    if (!trocaFeita) throw Object.assign(new Error('a troca do veneno não aconteceu; nada a medir'), { jaContado: true });
  } else {
    conf('o gravar do store.js passa pelo escrever (a âncora do primeiro veneno existe)', GRAVAR_CONSERTADO.test(STORE_REPO), true);
    conf('o escrever responde na transação (a âncora do segundo veneno existe)', ESCREVER_CONSERTADO.test(STORE_REPO), true);
  }

  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);

  if (VENENO) {
    const servido = await pag.evaluate(() => fetch('/store.js').then(r => r.text()));
    conf('o /store.js que a página recebeu tem o veneno',
      servido.indexOf(VENENO_ESCREVER ? 'if (req) req.onsuccess = function () { resolve(req.result); };'
        : "return trans(deposito, 'readwrite').then(function (s) { return comoPromessa(s.put(valor, chave)); });") >= 0, true);
  }

  // ---------------- 0. calibragem ----------------
  secao('0. Calibragem: a leitura enxerga uma perda de verdade?');
  let viuPerda = 0;
  for (let i = 0; i < 3; i++) {
    const id = 'calibra-' + i;
    const fim = await gravaEAborta(pag, id);
    const lido = await leAnexo(pag, id);
    if (lido !== 2048) viuPerda++;
    console.log('   calibragem ' + i + ': transação ' + fim + ', leitura ' + lido);
  }
  if (!conf('a leitura acusa a perda nos 3 abortos de propósito', viuPerda, 3)) {
    throw Object.assign(new Error('a leitura está cega; nenhum número desta prova vale'), { jaContado: true });
  }

  // ---------------- 1. cada caminho ----------------
  secao('1. Cada caminho de escrita, interrompido no instante em que responde');
  await instalarEspiao(pag);
  for (const c of CAMINHOS) await rodaCaminho(pag, c);

  // ---------------- 2. a régua do corte ----------------
  secao('2. A régua do corte: ' + CICLOS + ' recargas dentro da microtarefa da resposta');
  let perdas = 0;
  const tamanhos = {};
  const t0 = Date.now();
  for (let i = 0; i < CICLOS; i++) {
    const id = 'corte-' + i;
    await gravaECorta(pag, id);
    if (!await voltou(pag)) throw new Error('a página não voltou no ciclo ' + id);
    const lido = await leAnexo(pag, id);
    tamanhos[lido] = (tamanhos[lido] || 0) + 1;
    if (lido !== 2048) { perdas++; console.log('   perda no ciclo ' + id + ': leitura ' + lido); }
  }
  console.log('   ' + perdas + ' perdas em ' + CICLOS + ' ciclos, em ' + Math.round((Date.now() - t0) / 1000) +
    ' s; tamanhos lidos ' + JSON.stringify(tamanhos));
  if (ESPERA_PERDA) {
    conf('VENENO ENXERGADO pela régua do corte: pelo menos uma perda em ' + CICLOS, perdas >= 1, true);
  } else {
    conf('nenhuma perda em ' + CICLOS + ' cortes no instante da resposta', perdas, 0);
  }

  // ---------------- 3. erros ----------------
  secao('3. Sem erro de JavaScript');
  conf('nenhum erro de JavaScript na página', pag.errosDePagina.length ? pag.errosDePagina.join(' | ') : 'nenhum', 'nenhum');
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
