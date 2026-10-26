/* testa_novidades_navegador.js
 *
 * Exercita o fluxo REAL de mostrarNovidades() e da política de novidades
 * no navegador com Chrome e perfil isolado:
 * 1. Perfil legado (versaoVista = '1.17.0'): não exibe pop-up requentando
 *    novidades de Português (1.18.0) e atualiza versaoVista silenciosamente.
 * 2. Perfil novo (sem versaoVista): inicialização limpa, sem pop-up, grava versão atual.
 * 3. Perfil já na versão atual: silencioso, sem pop-up.
 * 4. Verificação no DOM de que as frases de contagem não duplicam números (UX12).
 */
'use strict';
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8829, 'nath_t03_novidades');
const { conf, secao, esperar, pausa } = H;

/* A versão e a entrada de NOVIDADES dela saem do próprio app.js, e não de
 * um número escrito aqui: cravar '1.28.0' fazia este teste reprovar a cada
 * release (aconteceu na 1.29.0, B14). */
const APP_TEXTO = require('fs').readFileSync(require('path').join(H.RAIZ, 'app.js'), 'utf8');
const VERSAO = (APP_TEXTO.match(/var VERSAO = '([^']+)'/) || [])[1];
const ENTRADA = (() => {
  const i = APP_TEXTO.indexOf("versao: '" + VERSAO + "'");
  return i < 0 ? '' : APP_TEXTO.slice(i, APP_TEXTO.indexOf('\n    }', i));
})();
const ENTRADA_TEM_SLIDES = /slides:\s*\[/.test(ENTRADA);
/* Um pedaço do primeiro item, para conferir que a janela mostra a entrada
 * da versão atual: as primeiras palavras do primeiro texto entre aspas. */
const TRECHO_DA_ENTRADA = ((ENTRADA.match(/'([^'\n]{20,})'/) || [])[1] || '').slice(0, 30);

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
    conf('li a versão e a entrada dela no app.js', !!VERSAO && !!ENTRADA && TRECHO_DA_ENTRADA.length >= 20, true);
    conf('versaoVista do perfil novo é a versão atual', bancoNovo.ajustes.versaoVista, VERSAO);

    secao('2. Perfil atualizando de versão anterior (versaoVista = 1.27.0)');
    await gravarVersaoVista(pag, '1.27.0');
    const bancoAntes = await obterBanco(pag);
    conf('banco configurado com versaoVista anterior 1.27.0', bancoAntes.ajustes.versaoVista, '1.27.0');

    // Recarrega o aplicativo para disparar inicialização real
    await pag.reload({ waitUntil: 'networkidle0' });
    await esperar('o aplicativo recarregou', () => pag.evaluate(() =>
      !!document.querySelector('#abas .aba') && typeof Store === 'object'
    ), v => v === true, 30000);

    // Aguarda a rotina de novidades
    await pausa(1500);

    const abertoAtualizacao = await modalAberto(pag);
    conf('perfil atualizando para ' + VERSAO + ' abre a janela de novidades', abertoAtualizacao, true);

    const textoModal = await conteudoModal(pag);
    conf('modal não contém novidade requentada de Português (1.18.0)', textoModal.indexOf('Português') === -1, true);
    conf('modal contém a novidade de ' + VERSAO, textoModal.indexOf(TRECHO_DA_ENTRADA) !== -1, true);

    if (ENTRADA_TEM_SLIDES) {
      // Carrossel: o Entendi avança, e o Voltar aparece a partir do slide 2
      await pag.click('#entendi-novidades');
      await pausa(300);
      const textoBotaoVoltar = await pag.evaluate(() => {
        const b = document.querySelector('#btn-carrossel-voltar');
        return b ? window.getComputedStyle(b).display : 'none';
      });
      conf('botão Voltar fica visível a partir do slide 2', textoBotaoVoltar !== 'none', true);
      await pag.click('#modal-novidades [data-fechar]');
    } else {
      // Lista: o Entendi fecha e grava a versão vista
      await pag.click('#entendi-novidades');
    }
    await pausa(400);
    const abertoAposFechar = await modalAberto(pag);
    conf('modal fechou com sucesso', abertoAposFechar, false);

    const bancoDepois = await obterBanco(pag);
    conf('versaoVista foi atualizada para ' + VERSAO + ' no banco', bancoDepois.ajustes.versaoVista, VERSAO);

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
