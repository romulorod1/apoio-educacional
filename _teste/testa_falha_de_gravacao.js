/* testa_falha_de_gravacao.js
 *
 * B3: a falha de gravação tratada num lugar só (app.js, salvar e
 * falhaDeGravacao). O tablet sem espaço é simulado no próprio IndexedDB: a
 * transação de gravação do documento principal é ABORTADA, que é o caminho
 * por onde a falta de espaço de verdade chega (o QuotaExceededError vem da
 * transação, store.js:132-150), e não um Store.salvar trocado por um falso.
 *
 * O que se prova:
 *   1. a gravação que falha mostra a faixa no alto, a mudança continua na
 *      memória (a tela já mudou) e o disco continua com o valor antigo;
 *   2. a rejeição avisada não vira erro de página (o ouvinte global a
 *      reconhece e não avisa duas vezes);
 *   3. "Tentar de novo agora" grava a mudança e a faixa some;
 *   4. sem tocar em nada, a nova tentativa automática de 15 s grava sozinha;
 *   5. uma promessa rejeitada sem tratamento que NÃO veio do salvar vira uma
 *      frase na tela, e continua aparecendo como erro para os testes;
 *   6. sem navegador: o Store.salvar só é chamado direto nos quatro lugares
 *      conhecidos (o salvar e três que têm tratamento próprio).
 *
 * Modo envenenado:
 *   node _teste/testa_falha_de_gravacao.js --envenenado-sem-tratamento
 *     o app.js servido perde a linha que liga o tratamento central. A falha
 *     tem de voltar a ser calada: nenhuma faixa, e a rejeição solta como erro
 *     de página. Se o teste não enxergar isso, ele não prova nada.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8873;
const VENENO = process.argv.indexOf('--envenenado-sem-tratamento') !== -1;
const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const LIGACAO = 'p.then(gravacaoConfirmada, falhaDeGravacao);';
const trocas = {};
if (VENENO) trocas['/app.js'] = APP.split(LIGACAO).join('');

// ---------------------------------------------------------------- 6 (Node)
secao('6. O Store.salvar só é chamado direto onde já há tratamento');
const diretas = (APP.match(/Store\.salvar\(/g) || []).length;
/* Quatro: o próprio salvar(), o desfazer (catch com releDoDisco), a carga
 * inicial do iniciar() (catch que mostra "Não foi possível abrir os dados") e
 * o apagarTudo (catch com releDoDisco). Uma quinta chamada direta escaparia do
 * tratamento central: passe pelo salvar(), ou acrescente aqui com o motivo. */
conf('quatro chamadas diretas ao Store.salvar, todas conhecidas', diretas, 4);
conf('o salvar() liga o tratamento central', APP.indexOf(LIGACAO) >= 0, true);
conf('existe o ouvinte global de promessa rejeitada', /addEventListener\('unhandledrejection'/.test(APP), true);

const amb = H.criarAmbiente(PORTA, 'perfil_falha_gravacao', trocas);

/* Lê o documento principal direto do IndexedDB, por fora do aplicativo. */
const noDisco = pag => pag.evaluate(() => new Promise(res => {
  const r = indexedDB.open('apoio-educacional');
  r.onsuccess = () => {
    const g = r.result.transaction('dados', 'readonly').objectStore('dados').get('principal');
    g.onsuccess = () => res(!!(g.result && g.result.ajustes && g.result.ajustes.valoresOcultos));
    g.onerror = () => res(null);
  };
  r.onerror = () => res(null);
}));
const faixaVisivel = pag => pag.evaluate(() => {
  const f = document.querySelector('#faixa-gravacao');
  return !!(f && !f.hidden && getComputedStyle(f).display !== 'none');
});

(async () => {
  if (VENENO) {
    secao('O veneno é de verdade');
    conf('o app.js servido perdeu a ligação do tratamento central', trocas['/app.js'].indexOf(LIGACAO) < 0, true);
  }
  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);
  await pausa(1500);

  /* Banco fictício, e não a carga inicial: a carga inicial traz nomes reais de
   * crianças, e esta prova tira print. Uma aluna de teste, uma aula, a versão
   * vista gravada (para nenhuma janela de novidades cobrir a tela). */
  await pag.evaluate(() => new Promise(res => {
    const r = indexedDB.open('apoio-educacional');
    r.onsuccess = () => {
      const t = r.result.transaction('dados', 'readwrite');
      const s = t.objectStore('dados');
      const g = s.get('principal');
      g.onsuccess = () => {
        const d = g.result;
        d.alunos = [{ id: 'alfa', nome: 'Aluna Alfa Teste', ativo: true,
          precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 100 }] }];
        d.series = [];
        d.aulas = [{ id: 'a1', alunoId: 'alfa', data: new Date().toISOString().slice(0, 10), hora: '15:00',
          duracaoMin: 60, status: 'realizada', cobravel: true, temas: [], areas: [], anexos: [] }];
        d.resumos = [];
        d.ajustes = Object.assign({}, d.ajustes, { versaoVista: '9.9.9', valoresOcultos: false });
        s.put(d, 'principal');
      };
      t.oncomplete = () => res();
    };
  }));
  await H.abrirApp(pag, amb.ORIGEM);
  await pausa(1500);

  /* O tablet sem espaço: com a chave ligada, a gravação do documento
   * principal faz o pedido e aborta a transação logo em seguida. */
  await pag.evaluate(() => {
    window.__semEspaco = false;
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () {
      const req = put.apply(this, arguments);
      if (window.__semEspaco && this.name === 'dados') this.transaction.abort();
      return req;
    };
  });

  // ================================================================
  secao('1. A gravação que falha avisa, e a mudança fica na memória');
  const antes = await noDisco(pag);
  conf('o disco começa com os valores à mostra', antes, false);
  await pag.evaluate(() => { window.__semEspaco = true; });
  await pag.click('#alternar-valores');
  await pausa(800);
  const naTela = await pag.$eval('#alternar-valores', b => b.classList.contains('ativo'));
  conf('a tela mudou (o olho está ligado)', naTela, true);
  conf('o disco continua com o valor antigo', await noDisco(pag), false);
  const faixa = await faixaVisivel(pag);
  /* O print do antes é o modo envenenado (a falha calada, como na main), e o
   * do depois é o modo normal, no mesmo instante do percurso. */
  if (process.env.SALVAR_PRINTS) {
    await pag.screenshot({ path: path.join(process.env.SALVAR_PRINTS,
      (VENENO ? 'antes' : 'depois') + '_gravacao_que_falhou.png') });
  }

  if (VENENO) {
    secao('VENENO: sem o tratamento central, a falha volta a ser calada');
    conf('envenenado: nenhuma faixa aparece (defeito enxergado)', faixa, false);
    conf('envenenado: a rejeição sai solta, como erro de página', pag.errosDePagina.length > 0, true);
    throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
  }

  conf('a faixa aparece no alto', faixa, true);
  conf('e diz que não guardou e que vai tentar de novo',
    await pag.$eval('#faixa-gravacao', f => /Não consegui guardar/.test(f.textContent) && /tento guardar de novo/.test(f.textContent)), true);

  // ================================================================
  secao('2. A rejeição avisada não vira erro de página');
  conf('nenhum erro de página até aqui', pag.errosDePagina.join(' | '), '');

  // ================================================================
  secao('3. "Tentar de novo agora" grava, e a faixa some');
  await pag.evaluate(() => { window.__semEspaco = false; });
  await pag.click('#faixa-gravacao-tentar');
  const gravou = await esperar('o disco ganhou a mudança', () => noDisco(pag), v => v === true, 5000);
  conf('o disco agora tem os valores escondidos', gravou.ok, true);
  conf('a faixa sumiu', await faixaVisivel(pag), false);

  // ================================================================
  secao('4. A nova tentativa automática grava sozinha');
  await pag.evaluate(() => { window.__semEspaco = true; });
  await pag.click('#alternar-valores');
  await pausa(800);
  conf('a faixa voltou', await faixaVisivel(pag), true);
  conf('e o disco ficou com o valor de antes da mudança', await noDisco(pag), true);
  await pag.evaluate(() => { window.__semEspaco = false; });
  const sozinha = await esperar('a nova tentativa de 15 s', () => noDisco(pag), v => v === false, 20000);
  conf('sem tocar em nada, a mudança chegou ao disco', sozinha.ok, true);
  conf('e a faixa sumiu', await faixaVisivel(pag), false);

  // ================================================================
  secao('5. Rejeição que não veio do salvar vira frase, e continua sendo erro');
  const errosAntes = pag.errosDePagina.length;
  /* Por um script da PÁGINA, e não pelo evaluate: a promessa rejeitada que
   * nasce dentro de um evaluate do puppeteer não dispara o evento
   * unhandledrejection na página (medido: nem um ouvinte posto pela própria
   * prova disparava), enquanto a de um script da página dispara. */
  await pag.addScriptTag({ content: "Promise.reject(new Error('rejeição de prova'));" });
  const frase = await esperar('o aviso de ação que não terminou', () => pag.$eval('#aviso', a =>
    a.classList.contains('aberto') && /não terminou como devia/.test(a.textContent)), v => v === true, 5000);
  conf('aparece a frase para ela', frase.ok, true);
  conf('e o erro continua visível para os testes', pag.errosDePagina.length, errosAntes + 1);

  // ================================================================
  secao('7. Nenhum outro erro');
  conf('só o erro de prova da seção 5', pag.errosDePagina.filter(e => !/rejeição de prova/.test(e)).join(' | '), '');
  conf('nenhum pedido deu 404', amb.quatrocentos.join(', '), '');
})().then(() => H.fim(amb)(), e => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e)));
