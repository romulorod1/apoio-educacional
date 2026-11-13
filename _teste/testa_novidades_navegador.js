/* testa_novidades_navegador.js
 *
 * Exercita o fluxo REAL de mostrarNovidades() e da política de novidades
 * no navegador com Chrome e perfil isolado:
 * 1. Perfil novo (sem versaoVista): inicialização limpa, sem pop-up, grava versão atual.
 * 2. Perfil atualizando de uma versão antiga (1.27.0): a janela abre com a
 *    novidade mais nova e sem requentar a de Português (1.18.0).
 * 2b. Perfil que PULOU duas versões (13f): a janela mostra as DUAS novidades,
 *    da mais nova para a mais antiga, e não a da versão que ela já tinha visto.
 * 2c. Lançamento silencioso: sem novidade depois da versão vista, a janela não
 *    abre e a versão vista anda sozinha.
 * 3. Perfil já na versão atual: silencioso, sem pop-up.
 * 4. Verificação no DOM de que as frases de contagem não duplicam números (UX12).
 */
'use strict';
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8829, 'nath_t03_novidades');
const { conf, secao, esperar, pausa } = H;

/* A versão e as NOVIDADES saem do próprio app.js, e não de um número escrito
 * aqui: cravar '1.28.0' fazia este teste reprovar a cada release (aconteceu na
 * 1.29.0, B14). */
const APP_TEXTO = require('fs').readFileSync(require('path').join(H.RAIZ, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const VERSAO = (APP_TEXTO.match(/var VERSAO = '([^']+)'/) || [])[1];
const NOVIDADES = (() => {
  const i = APP_TEXTO.indexOf('var NOVIDADES = [');
  const j = APP_TEXTO.indexOf('\n  ];', i);
  if (i < 0 || j < 0) return [];
  return require('vm').runInNewContext('(' + APP_TEXTO.slice(i + 'var NOVIDADES = '.length, j + 4) + ')');
})();
const antes = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let k = 0; k < 3; k++) if (x[k] !== y[k]) return x[k] < y[k]; return false; };
/* As que a janela mostra para quem viu `vista`: versão maior que a vista e não
 * maior que a atual, com itens, na ordem do NOVIDADES (a mais nova primeiro). */
const mostraveis = vista => NOVIDADES.filter(n => antes(vista, n.versao) && !antes(VERSAO, n.versao) && n.itens && n.itens.length);
const trecho = n => String(n.itens[0]).slice(0, 30);

async function obterBanco(pag) {
  return pag.evaluate(() => new Promise(resolve => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const db = req.result;
      const get = db.transaction('dados', 'readonly').objectStore('dados').get('principal');
      get.onsuccess = () => { db.close(); resolve(get.result); };
      get.onerror = () => { db.close(); resolve(null); };
    };
    req.onerror = () => resolve(null);
  }));
}

async function gravarVersaoVista(pag, versao) {
  await pag.evaluate(v => new Promise(resolve => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const db = req.result;
      const t = db.transaction('dados', 'readwrite');
      const s = t.objectStore('dados');
      const get = s.get('principal');
      get.onsuccess = () => {
        const dados = get.result;
        dados.ajustes = dados.ajustes || {};
        dados.ajustes.versaoVista = v;
        s.put(dados, 'principal');
      };
      t.oncomplete = () => { db.close(); resolve(); };
    };
  }), versao);
}

async function modalAberto(pag) {
  return pag.evaluate(() => {
    const m = document.querySelector('#modal-novidades');
    return !!(m && m.classList.contains('aberto'));
  });
}

async function conteudoModal(pag) {
  return pag.evaluate(() => {
    const c = document.querySelector('#corpo-modal-novidades');
    return c ? c.textContent : '';
  });
}

(async function () {
  try {
    await amb.subir();
    const pag = await amb.pagina();

    secao('1. Perfil novo (primeiro acesso do usuário)');
    await pag.goto(amb.ORIGEM + '/index.html', { waitUntil: 'networkidle0' });
    await esperar('o aplicativo abriu no perfil novo', () => pag.evaluate(() =>
      !!document.querySelector('#abas .aba') && typeof Store === 'object' && !!document.querySelector('#versao-app')
    ), v => v === true, 30000);

    // Aguarda janela de setTimeout(mostrarNovidades, 900)
    await pausa(1500);

    const abertoNovo = await modalAberto(pag);
    conf('perfil novo não abre modal de novidades', abertoNovo, false);

    const bancoNovo = await obterBanco(pag);
    conf('perfil novo gravou versaoVista no banco', !!(bancoNovo && bancoNovo.ajustes && bancoNovo.ajustes.versaoVista), true);
    conf('li a versão e as NOVIDADES no app.js (controle: mais de 10 entradas)', !!VERSAO && NOVIDADES.length > 10, true);
    conf('versaoVista do perfil novo é a versão atual', bancoNovo.ajustes.versaoVista, VERSAO);

    /* Grava a versão vista, recarrega e devolve o que a janela mostrou. */
    async function abrirCom(vista) {
      await gravarVersaoVista(pag, vista);
      await pag.reload({ waitUntil: 'networkidle0' });
      await esperar('o aplicativo recarregou', () => pag.evaluate(() =>
        !!document.querySelector('#abas .aba') && typeof Store === 'object'
      ), v => v === true, 30000);
      await pausa(1500);
      return { aberto: await modalAberto(pag), texto: await conteudoModal(pag) };
    }
    async function fecharComEntendi(comSlides) {
      if (comSlides) await pag.click('#modal-novidades [data-fechar]');
      else await pag.click('#entendi-novidades');
      await pausa(400);
    }

    secao('2. Perfil atualizando de versão anterior (versaoVista = 1.27.0)');
    const de127 = mostraveis('1.27.0');
    conf('controle: há novidade depois da 1.27.0 no app.js', de127.length > 0, true);
    let r = await abrirCom('1.27.0');
    conf('perfil atualizando de 1.27.0 para ' + VERSAO + ' abre a janela de novidades', r.aberto, true);
    const comSlides = !!(de127[0] && de127[0].slides && de127[0].slides.length);
    if (!comSlides) {
      conf('modal não contém novidade requentada de Português (1.18.0)', r.texto.indexOf('Português') === -1, true);
      conf('modal contém a novidade mais nova (' + de127[0].versao + ')', r.texto.indexOf(trecho(de127[0])) !== -1, true);
    }
    await fecharComEntendi(comSlides);
    conf('modal fechou com sucesso', await modalAberto(pag), false);
    if (!comSlides) conf('versaoVista foi atualizada para ' + VERSAO + ' no banco', (await obterBanco(pag)).ajustes.versaoVista, VERSAO);

    secao('2b. Perfil que pulou duas versões: as duas novidades, na ordem (13f)');
    // As três entradas mais novas com itens e sem carrossel: ela viu a terceira.
    const lista = NOVIDADES.filter(n => !antes(VERSAO, n.versao) && n.itens && n.itens.length && !(n.slides && n.slides.length));
    conf('controle: há três entradas de lista no app.js', lista.length >= 3, true);
    const [n1, n2, n3] = lista;
    const esperadas = mostraveis(n3.versao);
    conf('controle: pulando de ' + n3.versao + ', as que contam são ' + n1.versao + ' e ' + n2.versao,
      esperadas.map(n => n.versao).join(','), [n1.versao, n2.versao].join(','));
    r = await abrirCom(n3.versao);
    conf('quem pulou duas versões vê a janela', r.aberto, true);
    const p1 = r.texto.indexOf(trecho(n1)), p2 = r.texto.indexOf(trecho(n2));
    conf('a janela mostra a novidade de ' + n1.versao, p1 !== -1, true);
    conf('e a de ' + n2.versao + ', que antes do 13f se perdia', p2 !== -1, true);
    conf('na ordem: a mais nova primeiro', p1 !== -1 && p2 !== -1 && p1 < p2, true);
    conf('e não a de ' + n3.versao + ', que ela já tinha visto', r.texto.indexOf(trecho(n3)) === -1, true);
    await fecharComEntendi(false);
    conf('versaoVista foi para ' + VERSAO, (await obterBanco(pag)).ajustes.versaoVista, VERSAO);

    secao('2c. Lançamento silencioso: nada depois da versão vista');
    if (antes(NOVIDADES[0].versao, VERSAO)) {
      r = await abrirCom(NOVIDADES[0].versao);
      conf('vista ' + NOVIDADES[0].versao + ' (a última com novidade) e atual ' + VERSAO + ': a janela NÃO abre', r.aberto, false);
      conf('e a versaoVista anda sozinha para ' + VERSAO, (await obterBanco(pag)).ajustes.versaoVista, VERSAO);
    } else {
      conf('a versão atual ' + VERSAO + ' tem novidade; o caso silencioso não se aplica', true, true);
    }

    secao('3. Perfil já na versão atual (versaoVista = ' + VERSAO + ')');
    await pag.reload({ waitUntil: 'networkidle0' });
    await pausa(1500);
    const abertoAtual = await modalAberto(pag);
    conf('perfil na versão atual não abre modal de novidades', abertoAtual, false);

    secao('4. Reabertura sob demanda do Guia e Novidades');
    // Reabertura pelo botão da Biblioteca
    await pag.click('.aba[data-tela="biblioteca"]');
    await pausa(400);
    await pag.click('#btn-guia-listas');
    await pausa(400);
    conf('guia de listas abre sob demanda ao clicar em Como usar listas', await modalAberto(pag), true);
    await pag.click('#modal-novidades [data-fechar]');
    await pausa(400);

    // Reabertura pelo botão de Ajustes
    await pag.click('.aba[data-tela="ajustes"]');
    await pausa(400);
    await pag.click('#ver-novidades-ajustes');
    await pausa(400);
    conf('novidades abrem sob demanda ao clicar em Ver o que mudou', await modalAberto(pag), true);
    await pag.click('#modal-novidades [data-fechar]');
    await pausa(400);

    secao('5. Interface e concordância sem duplicar contagens (UX12)');
    const duplicacaoEncontrada = await pag.evaluate(() => {
      const textoGeral = document.body.innerText;
      // Procura padrões como "1 1 marcado", "2 2 marcados", "12 12 meses"
      return /\b(\d+)\s+\1\s+(marcad|mes)/i.test(textoGeral);
    });
    conf('nenhuma frase da interface contém contagem duplicada no DOM', duplicacaoEncontrada, false);

    conf('não houve erros de página no console', pag.errosDePagina.length, 0);

    await H.fim(amb)();
  } catch (e) {
    await H.fim(amb)(e);
  }
})();
