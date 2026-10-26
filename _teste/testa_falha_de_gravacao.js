/* testa_falha_de_gravacao.js
 *
 * B3: a falha de gravação tratada num lugar só (app.js: salvar,
 * falhaDeGravacao, salvarEDepois, releDoDisco). O tablet sem espaço é simulado
 * no próprio IndexedDB: a transação de gravação do documento principal é
 * ABORTADA, que é o caminho por onde a falta de espaço de verdade chega (o
 * QuotaExceededError vem da transação, store.js:132-150), e não um
 * Store.salvar trocado por um falso.
 *
 * Banco fictício ("Aluna Alfa Teste"), porque a prova tira print.
 *
 * O que se prova:
 *   1. a gravação que falha mostra a faixa no alto, a mudança fica na memória,
 *      o disco fica com o valor antigo, e o OLHO esconde os valores na hora:
 *      ela liga o olho com a família ao lado, e a falha não pode vazar o que
 *      ela mandou esconder;
 *   2. a rejeição avisada não vira erro de página;
 *   3. "Tentar de novo agora" grava, e a faixa some;
 *   4. sem tocar em nada, a nova tentativa automática de 15 s grava sozinha;
 *   5. uma promessa rejeitada sem tratamento que NÃO veio do salvar vira uma
 *      frase na tela, e continua aparecendo como erro para os testes;
 *   6. o releDoDisco não joga fora uma mudança pendente: com a faixa no alto,
 *      um "Voltar a este ponto" que falha deixa a memória e a faixa como
 *      estavam, em vez de reler o disco por cima;
 *   8. sem navegador: o Store.salvar só é chamado direto nos quatro lugares
 *      conhecidos.
 *
 * Modos envenenados, um por regra:
 *   --envenenado-sem-tratamento  o salvar() perde a ligação do tratamento
 *                                central: a falha volta a ser calada.
 *   --envenenado-olho-espera     o olho volta a esperar a gravação para
 *                                redesenhar: na falha, os valores ficam à mostra.
 *   --envenenado-rele-descarta   o releDoDisco volta a reler o disco mesmo com
 *                                mudança pendente: a mudança some calada.
 * Cada um tem de enxergar o próprio defeito; se não enxergar, a prova não prova.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8873;
const MODO = ['--envenenado-sem-tratamento', '--envenenado-olho-espera', '--envenenado-rele-descarta']
  .filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');

const LIGACAO = 'p.then(gravacaoConfirmada, falhaDeGravacao);';
const OLHO_NA_HORA = /desenharTudo\(\);(\r?\n)    salvar\(\);(\r?\n)  \}/;
const RELE_COM_PENDENCIA = 'var antes = gravacaoPendente ? salvar() : Promise.resolve();';
const trocas = {};
if (MODO === '--envenenado-sem-tratamento') trocas['/app.js'] = APP.split(LIGACAO).join('');
if (MODO === '--envenenado-olho-espera') trocas['/app.js'] = APP.replace(OLHO_NA_HORA, 'salvar().then(desenharTudo);$1  }');
if (MODO === '--envenenado-rele-descarta') trocas['/app.js'] = APP.split(RELE_COM_PENDENCIA).join('var antes = Promise.resolve();');

// ---------------------------------------------------------------- 8 (Node)
secao('8. O Store.salvar só é chamado direto onde já há tratamento');
const diretas = (APP.match(/Store\.salvar\(/g) || []).length;
/* Quatro: o próprio salvar(), o desfazer (catch com releDoDisco), a carga
 * inicial do iniciar() (catch que mostra "Não foi possível abrir os dados") e
 * o apagarTudo (catch com releDoDisco). Uma quinta chamada direta escaparia do
 * tratamento central: passe pelo salvar(), ou acrescente aqui com o motivo. */
conf('quatro chamadas diretas ao Store.salvar, todas conhecidas', diretas, 4);
conf('o salvar() liga o tratamento central', APP.indexOf(LIGACAO) >= 0, true);
conf('existe o ouvinte global de promessa rejeitada', /addEventListener\('unhandledrejection'/.test(APP), true);
conf('o olho redesenha antes de gravar', OLHO_NA_HORA.test(APP), true);
conf('o releDoDisco grava a pendência antes de reler', APP.indexOf(RELE_COM_PENDENCIA) >= 0, true);

const amb = H.criarAmbiente(PORTA, 'perfil_falha_gravacao', trocas);

/* O documento principal direto do IndexedDB, por fora do aplicativo. */
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
const olhoLigado = pag => pag.$eval('#alternar-valores', b => b.classList.contains('ativo'));
// os R$ 100,00 da aula de prova: à mostra, ou trocados pela máscara
const valoresAMostra = pag => pag.evaluate(() => /R\$\s?100,00/.test(document.body.innerText));
const fim = () => Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });

(async () => {
  if (MODO) {
    secao('O veneno é de verdade');
    conf('o app.js servido ficou diferente do repositório (' + MODO + ')', trocas['/app.js'] !== APP, true);
  }
  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);
  await pausa(1500);

  /* Banco fictício, e não a carga inicial: a carga inicial traz nomes reais de
   * crianças, e esta prova tira print. Uma aluna de teste, uma aula de hoje a
   * R$ 100, e a versão vista gravada (nenhuma janela de novidades na tela). */
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
  secao('1. A gravação que falha avisa, a mudança fica na memória, e o olho esconde na hora');
  conf('o disco começa com os valores à mostra', await noDisco(pag), false);
  conf('e a tela também', await valoresAMostra(pag), true);
  await pag.evaluate(() => { window.__semEspaco = true; });
  await pag.click('#alternar-valores');
  await pausa(800);
  conf('o olho está ligado na tela', await olhoLigado(pag), true);
  conf('o disco continua com o valor antigo', await noDisco(pag), false);
  const escondeu = !(await valoresAMostra(pag));
  const faixa = await faixaVisivel(pag);
  /* O print do antes é o modo sem tratamento (a falha calada, como na main), e
   * o do depois é o modo normal, no mesmo instante do percurso. */
  if (process.env.SALVAR_PRINTS && (!MODO || MODO === '--envenenado-sem-tratamento')) {
    await pag.screenshot({ path: path.join(process.env.SALVAR_PRINTS,
      (MODO ? 'antes' : 'depois') + '_gravacao_que_falhou.png') });
  }

  if (MODO === '--envenenado-sem-tratamento') {
    secao('VENENO: sem o tratamento central, a falha volta a ser calada');
    conf('envenenado: nenhuma faixa aparece (defeito enxergado)', faixa, false);
    conf('envenenado: a rejeição sai solta, como erro de página', pag.errosDePagina.length > 0, true);
    throw fim();
  }
  if (MODO === '--envenenado-olho-espera') {
    secao('VENENO: o olho espera o disco, e a falha deixa os valores à mostra');
    conf('envenenado: os valores continuam à mostra com o olho ligado (defeito enxergado)', escondeu, false);
    throw fim();
  }

  conf('os valores somem na hora, mesmo sem ter gravado', escondeu, true);
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
  conf('os valores voltaram à tela na hora', await valoresAMostra(pag), true);
  conf('e o disco ficou com o valor de antes da mudança', await noDisco(pag), true);
  await pag.evaluate(() => { window.__semEspaco = false; });
  const sozinha = await esperar('a nova tentativa de 15 s', () => noDisco(pag), v => v === false, 20000);
  conf('sem tocar em nada, a mudança chegou ao disco', sozinha.ok, true);
  conf('e a faixa sumiu', await faixaVisivel(pag), false);

  // ================================================================
  secao('6. O releDoDisco não joga fora uma mudança pendente');
  /* Um ponto do histórico para o "Voltar a este ponto", gravado por fora (é
   * preparação, e não o que se prova). Depois: o tablet sem espaço, o olho
   * ligado (a mudança pendente, com a faixa), e o "Voltar a este ponto", que
   * falha ao gravar e chama o releDoDisco. */
  await pag.evaluate(async () => {
    const d = await Store.carregar();
    await Store.registrarHistorico('Ponto de prova', JSON.parse(JSON.stringify(d)));
  });
  await pag.evaluate(() => { window.__semEspaco = true; });
  await pag.click('#alternar-valores');
  await pausa(800);
  conf('há mudança pendente: olho ligado e faixa no alto', (await olhoLigado(pag)) && (await faixaVisivel(pag)), true);
  conf('e o disco ainda sem ela', await noDisco(pag), false);
  await H.irParaAba(pag, 'ajustes');
  const botao = await esperar('o "Voltar a este ponto" na lista', () => pag.evaluate(() =>
    Array.from(document.querySelectorAll('#lista-historico button')).some(b => b.textContent.trim() === 'Voltar a este ponto')),
  v => v === true, 5000);
  conf('o ponto de prova aparece em Ajustes', botao.ok, true);
  await pag.evaluate(() => {
    Array.from(document.querySelectorAll('#lista-historico button'))
      .find(b => b.textContent.trim() === 'Voltar a este ponto').click();
  });
  await pausa(1500);
  /* O olho da tela segue uma variável própria, e não o banco relido: ele não
   * diz se a memória foi trocada pelo disco. O que diz é o DISCO no fim. Com
   * espaço de volta, a nova tentativa grava a memória: se a mudança pendente
   * ficou, o disco ganha os valores escondidos; se o releDoDisco a trocou pelo
   * disco velho, a tentativa grava o velho de novo. */
  const faixaDepois = await faixaVisivel(pag);
  const fraseDepois = await pag.$eval('#aviso', a => /ainda não está guardada/.test(a.textContent));
  await pag.evaluate(() => { window.__semEspaco = false; });
  if (faixaDepois) await pag.click('#faixa-gravacao-tentar');
  const guardouDepois = await esperar('o disco ganhou a mudança que ficou', () => noDisco(pag), v => v === true, 5000);
  if (MODO === '--envenenado-rele-descarta') {
    secao('VENENO: o releDoDisco relê o disco por cima da mudança pendente');
    conf('envenenado: a mudança pendente nunca chega ao disco (defeito enxergado)', guardouDepois.ok, false);
    throw fim();
  }
  conf('a faixa continua no alto depois do "Voltar a este ponto" que falhou', faixaDepois, true);
  conf('e a frase diz que a última mudança ainda não está guardada', fraseDepois, true);
  conf('com espaço de volta, a mudança que ficou chega ao disco', guardouDepois.ok, true);

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
