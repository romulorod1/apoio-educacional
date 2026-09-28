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
    conf('versaoVista do perfil novo é a versão atual', bancoNovo.ajustes.versaoVista, '1.27.0');

    secao('2. Perfil legado com versão antiga (versaoVista = 1.17.0)');
    // Simula perfil existente com versão anterior à introdução de Português (1.18.0)
    await gravarVersaoVista(pag, '1.17.0');
    const bancoAntes = await obterBanco(pag);
    conf('banco configurado com versaoVista legada 1.17.0', bancoAntes.ajustes.versaoVista, '1.17.0');

    // Recarrega o aplicativo para disparar inicialização real
    await pag.reload({ waitUntil: 'networkidle0' });
    await esperar('o aplicativo recarregou', () => pag.evaluate(() =>
      !!document.querySelector('#abas .aba') && typeof Store === 'object'
    ), v => v === true, 30000);

    // Aguarda a rotina de novidades
    await pausa(1500);

    const abertoLegado = await modalAberto(pag);
    conf('perfil legado 1.17.0 NÃO abre modal de novidades', abertoLegado, false);

    const textoModal = await conteudoModal(pag);
    conf('modal não contém novidade requentada de Português (1.18.0)', textoModal.indexOf('Português') === -1, true);

    const bancoDepois = await obterBanco(pag);
    conf('versaoVista foi atualizada silenciosamente para 1.27.0', bancoDepois.ajustes.versaoVista, '1.27.0');

    secao('3. Perfil já na versão atual (versaoVista = 1.27.0)');
    await pag.reload({ waitUntil: 'networkidle0' });
    await pausa(1500);
    const abertoAtual = await modalAberto(pag);
    conf('perfil na versão atual não abre modal de novidades', abertoAtual, false);

    secao('4. Interface e concordância sem duplicar contagens (UX12)');
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
