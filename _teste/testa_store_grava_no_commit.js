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
 *   1. OS NOVE CAMINHOS EXERCITADOS UM A UM, interrompidos no instante em que
 *      respondem. (Os outros que passam pelo mesmo `escrever` e NÃO são
 *      exercitados um a um: apagarNota, apagarMidia, a restauração das notas
 *      na cópia, a poda do histórico, o desfazer e o apagarTudo. Eles ficam
 *      cobertos pelo segundo veneno, que muda o `escrever` de todos.) O
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
 *   1b. O RAMO DA REJEIÇÃO: a transação abortada DEPOIS do sucesso do pedido
 *      (o caso em que só o `onabort` avisa) faz a promessa REJEITAR, e nada
 *      fica gravado. Sem isto, a escrita que falha ficaria pendurada para
 *      sempre, com a tela esperando.
 *   4. A MEMÓRIA VOLTA A SER O DISCO: restaurar uma cópia e voltar a um ponto
 *      do histórico, cada um rejeitando no meio (uma parte gravada, outra
 *      não). Depois disso a tela diz que não se completou, e o PRÓXIMO salvar
 *      do aplicativo não grava o estado velho por cima do que ficou no disco.
 *   3. nenhum erro de JavaScript na página.
 *
 * Modo envenenado:
 *   node _teste/testa_store_grava_no_commit.js --envenenado-grava-no-pedido
 *     o store.js servido volta a ter o `gravar` antigo, que responde no
 *     `onsuccess` do pedido. Os outros caminhos continuam consertados, de
 *     propósito: a prova tem de acusar EXATAMENTE os quatro caminhos que passam
 *     pelo `gravar` (salvar, salvarNota, salvarMidia, salvarAnexo), e deixar os
 *     outros cinco verdes. Quem DECIDE é essa acusação da parte 1, que é
 *     determinística. A régua do corte sob veneno só informa quantas perdas
 *     achou: ela depende da velocidade da máquina, e numa máquina rápida pode
 *     dar zero sem que o veneno tenha deixado de existir.
 *   node _teste/testa_store_grava_no_commit.js --envenenado-escreve-no-pedido
 *     o segundo veneno, um degrau abaixo: o `escrever` (por onde passa TODA
 *     escrita simples) volta a responder no `onsuccess` do pedido. Sem ele, as
 *     asserções dos cinco caminhos que não passam pelo `gravar` nunca teriam
 *     mostrado que sabem reprovar. Aqui oito dos nove têm de acusar. O nono, o
 *     registrarHistorico, NÃO acusa, e isso é medida e não descuido: depois de
 *     gravar ele poda o histórico com uma leitura no mesmo depósito, e a
 *     leitura espera a escrita confirmar antes de rodar, então a resposta dele
 *     já chega depois da confirmação mesmo com o `escrever` envenenado.
 *   node _teste/testa_store_grava_no_commit.js --envenenado-nao-rejeita
 *     o `escrever` perde o `t.onabort`: a transação abortada depois do sucesso
 *     do pedido deixa a promessa pendurada, e a parte 1b tem de ver isso.
 *   node _teste/testa_store_grava_no_commit.js --envenenado-nao-rele
 *     o app.js servido não relê o disco depois de uma gravação que rejeitou no
 *     meio: a parte 4 tem de ver o próximo salvar gravar o estado velho.
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
const VENENO_REJEITA = process.argv.indexOf('--envenenado-nao-rejeita') !== -1;
const VENENO_RELE = process.argv.indexOf('--envenenado-nao-rele') !== -1;
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

const ONABORT = "        t.onabort = function () { reject(motivo('A gravação foi interrompida.')); };";
const APP_REPO = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const RELE = '      db = lido || Store.bancoVazio();';
let trocaNova = null;
if (VENENO_REJEITA) {
  trocaNova = STORE_REPO.split(ONABORT).length - 1 === 1 ? STORE_REPO.split(ONABORT).join('') : null;
  if (trocaNova) trocas['/store.js'] = trocaNova;
}
if (VENENO_RELE) {
  trocaNova = APP_REPO.split(RELE).length - 1 === 1 ? APP_REPO.split(RELE).join('      void lido;') : null;
  if (trocaNova) trocas['/app.js'] = trocaNova;
}

const amb = H.criarAmbiente(PORTA, 'perfil_store_commit', trocas);
const os = require('os');

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

/* Arma UMA vez: o próximo `metodo` no depósito dado aborta a transação logo
 * depois de o pedido ter dado certo. É o caso em que só o `onabort` avisa. */
const armarAbort = (pag, deposito, metodo) => pag.evaluate((d, m) => {
  const original = IDBObjectStore.prototype[m];
  IDBObjectStore.prototype[m] = function () {
    const req = original.apply(this, arguments);
    if (this.name === d) {
      IDBObjectStore.prototype[m] = original;
      const t = this.transaction;
      req.addEventListener('success', () => { try { t.abort(); } catch (e) { /* já terminou */ } });
    }
    return req;
  };
}, deposito, metodo);

const textoDoAviso = pag => pag.evaluate(() => (document.querySelector('#aviso-texto') || {}).textContent || '');
const nomeNoDisco = pag => pag.evaluate(() => Store.carregar().then(d => d.alunos[0].nome));
/* Um salvar comum do aplicativo, pelo botão do olho: ele grava o `db` da
 * memória inteiro. É o "próximo salvar" que não pode gravar o estado velho. */
const umSalvarDoApp = async pag => {
  await pag.evaluate(() => document.querySelector('#alternar-valores').click());
  await pausa(1200);
};

async function parteQuatro(pag) {
  secao('4. Gravação que rejeita no meio: a memória volta a ser o disco');
  const antes = await nomeNoDisco(pag);
  // a) restaurar uma cópia: os dados entram, as notas abortam
  const dados = await pag.evaluate(() => Store.carregar());
  dados.alunos[0].nome = 'Aluna da Cópia';
  const arq = path.join(os.tmpdir(), 'copia_prova_commit_' + process.pid + '.json');
  fs.writeFileSync(arq, JSON.stringify({ formato: 'apoio-educacional', versao: 1, dados: dados,
    notas: { 'nota-da-copia': { paginas: [{ itens: [] }] } } }));
  process.on('exit', () => { try { fs.unlinkSync(arq); } catch (e) { /* ok */ } });
  await armarAbort(pag, 'notas', 'put');
  await (await pag.$('#arquivo-copia')).uploadFile(arq);
  const av1 = await H.esperar('o aviso da cópia', () => textoDoAviso(pag), v => /cópia/i.test(v || ''), 15000);
  console.log('   aviso: ' + JSON.stringify(av1.valor));
  conf('a tela diz que a cópia não se completou', /não foi restaurada por inteiro/.test(av1.valor || ''), true);
  conf('sem mensagem técnica do navegador', /Error|abort/i.test(av1.valor || ''), false);
  conf('o disco ficou com os dados da cópia (a parte que gravou)', await nomeNoDisco(pag), 'Aluna da Cópia');
  await umSalvarDoApp(pag);
  const depoisA = await nomeNoDisco(pag);
  console.log('   antes: ' + antes + ' | no disco depois do próximo salvar: ' + depoisA);
  if (VENENO_RELE && !CONTROLE) {
    conf('VENENO ENXERGADO: o próximo salvar gravou o estado velho por cima da cópia', depoisA, antes);
    return;
  }
  conf('e o próximo salvar NÃO gravou o estado velho por cima', depoisA, 'Aluna da Cópia');

  // b) voltar a um ponto do histórico: o estado entra, o apagar do ponto aborta
  const estado = await pag.evaluate(() => Store.carregar());
  estado.alunos[0].nome = 'Aluna do Ponto';
  await pag.evaluate(e => Store.registrarHistorico('ponto de prova do commit', e), estado);
  await H.irParaAba(pag, 'ajustes');
  await pausa(600);
  await armarAbort(pag, 'historico', 'delete');
  const tocou = await pag.evaluate(() => {
    const linha = Array.from(document.querySelectorAll('#lista-historico .item-lista'))
      .find(l => /ponto de prova do commit/.test(l.textContent));
    const b = linha && Array.from(linha.querySelectorAll('button')).find(x => /Voltar a este ponto/.test(x.textContent));
    if (!b) return false; b.click(); return true;
  });
  conf('tocou em Voltar a este ponto', tocou, true);
  const av2 = await H.esperar('o aviso da volta', () => textoDoAviso(pag), v => /voltar a este ponto/i.test(v || ''), 15000);
  console.log('   aviso: ' + JSON.stringify(av2.valor));
  conf('a tela diz que a volta não se completou', /Não consegui voltar a este ponto/.test(av2.valor || ''), true);
  await umSalvarDoApp(pag);
  conf('e o próximo salvar NÃO gravou o estado velho por cima do ponto', await nomeNoDisco(pag), 'Aluna do Ponto');
}

(async () => {
  console.log('MODO: ' + (VENENO_GRAVAR ? 'envenenado (gravar antigo, que responde no pedido)'
    : VENENO_ESCREVER ? 'envenenado (escrever responde no pedido)' : 'normal') +
    (CONTROLE ? ', COM CONTROLE: tem de reprovar' : ''));
  if (VENENO) {
    secao('O veneno é de verdade');
    conf('achei no store.js o trecho consertado que o veneno troca', ANCORA.test(STORE_REPO), true);
    conf('o store.js servido ficou DIFERENTE do repositório', trocaFeita ? 'diferente' : 'IGUAL', 'diferente');
    if (!trocaFeita) throw Object.assign(new Error('a troca do veneno não aconteceu; nada a medir'), { jaContado: true });
  } else if (VENENO_REJEITA || VENENO_RELE) {
    secao('O veneno é de verdade');
    conf('a linha que o veneno tira casa exatamente uma vez, e a troca aconteceu', !!trocaNova, true);
    if (!trocaNova) throw Object.assign(new Error('a troca do veneno não aconteceu; nada a medir'), { jaContado: true });
  } else {
    conf('o `onabort` do escrever existe (a âncora do veneno da rejeição)', STORE_REPO.split(ONABORT).length - 1, 1);
    conf('a releitura do disco existe (a âncora do veneno do app)', APP_REPO.split(RELE).length - 1, 1);
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

  // ---------------- 1b. o ramo da rejeição ----------------
  secao('1b. A escrita que aborta REJEITA, e não fica pendurada');
  await armarAbort(pag, 'anexos', 'put');
  const rej = await pag.evaluate(() => Promise.race([
    Store.salvarAnexo('anexo-que-aborta', { nome: 'x.pdf', tipo: 'application/pdf', blob: new Blob([new Uint8Array(64)]) })
      .then(() => 'resolveu', e => 'rejeitou: ' + (e && (e.name || e.message))),
    new Promise(r => setTimeout(() => r('pendurada'), 4000))
  ]));
  console.log('   salvarAnexo com a transação abortada depois do sucesso do pedido: ' + rej);
  const ficou = await leAnexo(pag, 'anexo-que-aborta');
  conf('e nada ficou gravado (o abort valeu)', ficou, -1);
  if (VENENO_REJEITA && !CONTROLE) {
    conf('VENENO ENXERGADO: sem o onabort, a promessa ficou pendurada', rej, 'pendurada');
    return;
  }
  if (ESPERA_PERDA) {
    /* Os dois venenos da perda respondem no pedido, e o pedido deu certo: a
     * promessa diz "salvo" e nada ficou. É o defeito inteiro numa linha. */
    conf('VENENO ENXERGADO: a promessa disse que salvou, e nada ficou', rej, 'resolveu');
  } else {
    conf('a promessa rejeitou', /^rejeitou/.test(rej), true);
  }

  if (!VENENO) await parteQuatro(pag);
  if (VENENO_RELE) return;

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
  if (VENENO) {
    // sob veneno a régua só informa: quem decide é a acusação determinística da parte 1
    console.log('   (sob veneno, a contagem acima é informativa)');
    if (ESPERA_PERDA) return;
  }
  conf('nenhuma perda em ' + CICLOS + ' cortes no instante da resposta', perdas, 0);

  // ---------------- 3. erros ----------------
  secao('3. Sem erro de JavaScript');
  conf('nenhum erro de JavaScript na página', pag.errosDePagina.length ? pag.errosDePagina.join(' | ') : 'nenhum', 'nenhum');
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
