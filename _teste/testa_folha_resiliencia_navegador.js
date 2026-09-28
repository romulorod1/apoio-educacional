/* Falhas reais que o teste feliz da folha nao cobria: segundo commit rejeitado
 * e gravacao antiga terminando depois de uma nova alteracao. Dados ficticios. */
'use strict';
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8854, 'nath_t09_resiliencia');
const { conf, secao, esperar, pausa } = H;

async function risco(pag, deslocamento) {
  await pag.evaluate(d => {
    const c = document.querySelector('#tela-desenho');
    const r = c.getBoundingClientRect();
    const x = r.left + 180 + d, y = r.top + 170 + d;
    c.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true, cancelable: true, pointerId: 90 + d, pointerType: 'pen',
      clientX: x, clientY: y, buttons: 1
    }));
    c.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true, cancelable: true, pointerId: 90 + d, pointerType: 'pen',
      clientX: x + 90, clientY: y + 35, buttons: 1
    }));
    c.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true, cancelable: true, pointerId: 90 + d, pointerType: 'pen',
      clientX: x + 90, clientY: y + 35, buttons: 0
    }));
  }, deslocamento);
}

async function rodar() {
  await amb.subir();
  const pag = await amb.pagina();
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  await H.abrirApp(pag, amb.ORIGEM);
  const aulaId = await pag.evaluate(() => {
    const b = document.querySelector('[data-aula-id]');
    if (!b) return '';
    b.click();
    return b.getAttribute('data-aula-id');
  });
  conf('aula ficticia encontrada', !!aulaId, true);
  await esperar('modal de aula', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v, 5000);
  await pag.evaluate(() => {
    Array.from(document.querySelectorAll('#linha-folha button'))
      .find(b => b.textContent.includes('folha')).click();
  });
  await esperar('folha aberta', () => pag.evaluate(() =>
    document.querySelector('#modal-nota').classList.contains('aberto')), v => v, 5000);

  secao('1. Falha no segundo commit e retry verdadeiro');
  const antes = await pag.evaluate(async id => {
    const db = await Store.carregar();
    return !!db.aulas.find(a => a.id === id).temNota;
  }, aulaId);
  conf('aula de teste comeca sem marcador de folha', antes, false);
  await pag.evaluate(() => {
    const original = Store.salvar;
    Store.salvar = function (db) {
      Store.salvar = original;
      return Promise.reject(new Error('falha injetada no banco principal'));
    };
  });
  await risco(pag, 0);
  await esperar('status reconheceu falha', () => pag.$eval('#status-gravacao-folha', e => e.textContent),
    v => /Não salvou/.test(v), 5000);
  const estadoParcial = await pag.evaluate(async id => {
    const db = await Store.carregar();
    const nota = await Store.lerNota(id);
    return { temNota: !!db.aulas.find(a => a.id === id).temNota,
      itens: nota ? nota.paginas.reduce((n, p) => n + p.itens.length, 0) : 0 };
  }, aulaId);
  conf('primeiro commit guardou o traco', estadoParcial.itens > 0, true);
  conf('segundo commit falhou sem fingir marcador persistido', estadoParcial.temNota, false);
  await pag.focus('#status-gravacao-folha');
  await pag.keyboard.press('Enter');
  await esperar('retry concluiu os dois commits', () => pag.$eval('#status-gravacao-folha', e => e.textContent),
    v => /Salvo neste tablet/.test(v), 5000);
  const depois = await pag.evaluate(async id => {
    const db = await Store.carregar();
    return !!db.aulas.find(a => a.id === id).temNota;
  }, aulaId);
  conf('retry persistiu marcador da aula', depois, true);

  secao('1b. Retry falho permanece acessivel e recuperavel');
  await pag.evaluate(() => {
    window.__rejeicoesNaoTratadas = [];
    window.addEventListener('unhandledrejection', e => window.__rejeicoesNaoTratadas.push(String(e.reason)));
    const original = Store.salvarNota;
    let falhas = 2;
    Store.salvarNota = function (id, nota) {
      if (falhas-- > 0) return Promise.reject(new Error('falha persistente injetada'));
      Store.salvarNota = original;
      return original(id, nota);
    };
  });
  await risco(pag, 12);
  await esperar('primeira falha da nota', () => pag.$eval('#status-gravacao-folha', e => e.textContent),
    v => /Não salvou/.test(v), 5000);
  await pag.focus('#status-gravacao-folha');
  await pag.keyboard.press('Enter');
  await esperar('retry ainda falhou', () => pag.$eval('#status-gravacao-folha', e => e.textContent),
    v => /Não salvou/.test(v), 5000);
  const botaoRetry = await pag.$eval('#status-gravacao-folha', e => ({ tag: e.tagName, desativado: e.disabled }));
  conf('retry e um botao acessivel por teclado', botaoRetry.tag, 'BUTTON');
  conf('erro persistente deixa nova tentativa disponivel', botaoRetry.desativado, false);
  await pag.focus('#status-gravacao-folha');
  await pag.keyboard.press('Enter');
  await esperar('terceira tentativa gravou', () => pag.$eval('#status-gravacao-folha', e => e.textContent),
    v => /Salvo neste tablet/.test(v), 5000);
  await pausa(50);
  conf('retry falho nao gerou rejeicao sem tratamento',
    await pag.evaluate(() => window.__rejeicoesNaoTratadas.length), 0);

  secao('2. Gravacao anterior nao pode declarar nova alteracao salva');
  await pag.evaluate(() => {
    const original = Store.salvarNota;
    let primeira = true;
    Store.salvarNota = function (id, nota) {
      if (!primeira) return original(id, nota);
      primeira = false;
      return new Promise((resolve, reject) => {
        window.__liberarGravacaoAntiga = () => original(id, nota).then(resolve, reject);
      });
    };
  });
  await risco(pag, 25);
  await esperar('primeira gravacao entrou em espera', () => pag.evaluate(() =>
    typeof window.__liberarGravacaoAntiga === 'function'), v => v, 5000);
  await risco(pag, 50);
  await pag.evaluate(() => window.__liberarGravacaoAntiga());
  await pausa(100);
  const durante = await pag.$eval('#status-gravacao-folha', e => e.textContent);
  conf('conclusao antiga nao anuncia sucesso da alteracao nova', /Salvando/.test(durante), true);
  await esperar('alteracao nova gravada', () => pag.$eval('#status-gravacao-folha', e => e.textContent),
    v => /Salvo neste tablet/.test(v), 5000);
  const notaFinal = await pag.evaluate(async id => {
    const nota = await Store.lerNota(id);
    return nota.paginas.reduce((n, p) => n + p.itens.length, 0);
  }, aulaId);
  conf('os tres tracos estao persistidos', notaFinal >= 3, true);

  secao('3. Concluir espera traco feito durante a gravacao');
  await pag.evaluate(() => {
    const original = Store.salvarNota;
    let primeira = true;
    Store.salvarNota = function (id, nota) {
      if (!primeira) return original(id, nota);
      primeira = false;
      return new Promise((resolve, reject) => {
        window.__liberarGravacaoFechamento = () => original(id, nota).then(resolve, reject);
      });
    };
  });
  await risco(pag, 65);
  await esperar('gravacao do fechamento entrou em espera', () => pag.evaluate(() =>
    typeof window.__liberarGravacaoFechamento === 'function'), v => v, 5000);
  await pag.evaluate(() => {
    Array.from(document.querySelectorAll('#rodape-nota button'))
      .find(b => b.textContent.trim() === 'Concluir').click();
  });
  await risco(pag, 80);
  await pag.evaluate(() => window.__liberarGravacaoFechamento());
  await esperar('folha fechou apos gravar o traco tardio', () => pag.evaluate(() =>
    !document.querySelector('#modal-nota').classList.contains('aberto')), v => v, 5000);
  const notaFechada = await pag.evaluate(async id => {
    const nota = await Store.lerNota(id);
    return nota.paginas.reduce((n, p) => n + p.itens.length, 0);
  }, aulaId);
  conf('traco durante Concluir tambem ficou salvo', notaFechada >= 5, true);
  conf('sem erros inesperados na pagina', pag.errosDePagina.join(' | '), '');
  await H.fim(amb)();
}

rodar().catch(err => { H.fim(amb)(err); });
