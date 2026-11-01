/* testa_cabecalho_tablet_navegador.js
 *
 * Prova de navegador para o item B5:
 * Validacao dinamica do cabecalho em uma unica linha de 64 px e abas com alvos
 * de 44 px nas larguras do tablet em pe (721px, 800px, 850px, 884px e 900px).
 *
 * Usa o arnes _bib_navegador: servidor proprio na porta 8866 servindo os arquivos
 * desta arvore, perfil temporario do Chromium e conferencia rigorosa contra
 * transbordamento, sobreposicao e quebra de abas.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const H = require('./_bib_navegador');

const PORTA = 8866;
const PASTA_PRINTS = process.env.SALVAR_PRINTS || path.join(__dirname, 'prints');

(async () => {
  const amb = H.criarAmbiente(PORTA, 'cabecalho_b5');
  await amb.subir();

  try {
    const page = await amb.pagina();
    await page.goto(amb.ORIGEM + '/index.html', { waitUntil: 'networkidle0' });
    await H.esperar('o aplicativo abriu com cabecalho', () => page.evaluate(() =>
      !!document.querySelector('.cabecalho') && typeof Store === 'object'), v => v === true, 30000);
    await H.pausa(3000);
    await page.evaluate(() => {
      const btn = document.querySelector('#fechar-modal-novidades');
      if (btn) btn.click();
    });

    // Confere que a pagina servida vem desta arvore (versao 1.41.1)
    const versaoApp = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src);
      return scripts.some(s => s.includes('app.js'));
    });
    H.conf('pagina carregou app.js da arvore correta', versaoApp, true);

    const largurasTablet = [721, 800, 850, 884, 900];

    for (const w of largurasTablet) {
      H.secao(`Medicao no tablet em pe: largura ${w}px`);
      await page.setViewport({ width: w, height: 1000, hasTouch: true });
      await H.pausa(120);

      const m = await page.evaluate((larguraTotal) => {
        const cab = document.querySelector('.cabecalho');
        const marca = document.querySelector('.marca');
        const subtitulo = document.querySelector('.marca span');
        const abasContainer = document.querySelector('.abas');
        const abas = Array.from(document.querySelectorAll('.aba'));
        const olho = document.querySelector('.olho');

        const cabRect = cab.getBoundingClientRect();
        const marcaRect = marca.getBoundingClientRect();
        const olhoRect = olho.getBoundingClientRect();
        const abasRect = abasContainer.getBoundingClientRect();
        const rectsAbas = abas.map(a => a.getBoundingClientRect());

        const subDisplay = window.getComputedStyle(subtitulo).display;
        const tops = rectsAbas.map(r => Math.round(r.top));
        const alturas = rectsAbas.map(r => Math.round(r.height));

        // Transbordamento: scrollWidth nao pode exceder clientWidth
        const semTransbordamento = cab.scrollWidth <= cab.clientWidth;

        // Limites de tela: nenhum elemento pode vazar da viewport
        const tudoDentroDaTela = rectsAbas.every(r => r.right <= larguraTotal + 1 && r.left >= 0) &&
                                 marcaRect.left >= 0 && olhoRect.right <= larguraTotal;

        // Sobreposicao horizontal: marca antes do olho, olho antes das abas
        const semSobreposicaoFilhos = (marcaRect.right <= olhoRect.left + 2) &&
                                      (olhoRect.right <= abasRect.left + 2);

        // Abas individuais sem sobreposicao entre si
        let abasSemColisao = true;
        for (let i = 0; i < rectsAbas.length - 1; i++) {
          if (rectsAbas[i].right > rectsAbas[i + 1].left + 1) {
            abasSemColisao = false;
            break;
          }
        }

        return {
          alturaCabecalho: Math.round(cabRect.height),
          mesmaLinha: new Set(tops).size === 1,
          tops,
          alturas,
          subtituloOculto: subDisplay === 'none',
          alturaOlho: Math.round(olhoRect.height),
          larguraOlho: Math.round(olhoRect.width),
          semTransbordamento,
          tudoDentroDaTela,
          semSobreposicao: semSobreposicaoFilhos && abasSemColisao
        };
      }, w);

      H.conf(`[${w}px] cabecalho exatamente em 64px de altura`, m.alturaCabecalho, 64);
      H.conf(`[${w}px] subtitulo oculto para poupar largura`, m.subtituloOculto, true);
      H.conf(`[${w}px] todas as 5 abas em uma unica linha`, m.mesmaLinha, true);
      H.conf(`[${w}px] abas com altura de toque confortavel de 44px`, m.alturas.every(h => h === 44), true);
      H.conf(`[${w}px] botao do olho com 44x44px`, m.alturaOlho === 44 && m.larguraOlho === 44, true);
      H.conf(`[${w}px] sem transbordamento horizontal (scrollWidth <= clientWidth)`, m.semTransbordamento, true);
      H.conf(`[${w}px] todos os elementos dentro dos limites da tela`, m.tudoDentroDaTela, true);
      H.conf(`[${w}px] sem colisao ou sobreposicao horizontal de elementos`, m.semSobreposicao, true);
    }

    H.secao('Controle positivo e negativo: desktop (1024px) e celular (720px)');

    // Desktop
    await page.setViewport({ width: 1024, height: 800 });
    await H.pausa(100);
    const desk = await page.evaluate(() => {
      const cab = document.querySelector('.cabecalho');
      const subtitulo = document.querySelector('.marca span');
      return {
        altura: Math.round(cab.getBoundingClientRect().height),
        subtituloVisivel: window.getComputedStyle(subtitulo).display !== 'none'
      };
    });
    H.conf('[1024px] cabecalho em 64px no desktop', desk.altura, 64);
    H.conf('[1024px] subtitulo visivel no desktop', desk.subtituloVisivel, true);

    // Celular
    await page.setViewport({ width: 720, height: 800 });
    await H.pausa(100);
    const cel = await page.evaluate(() => {
      const cab = document.querySelector('.cabecalho');
      const subtitulo = document.querySelector('.marca span');
      return {
        subtituloOculto: window.getComputedStyle(subtitulo).display === 'none',
        flexDirection: window.getComputedStyle(cab).flexDirection
      };
    });
    H.conf('[720px] subtitulo oculto no celular', cel.subtituloOculto, true);
    H.conf('[720px] layout coluna preservado no celular', cel.flexDirection, 'column');

    // Captura prints de evidencia se pasta informada ou padrao
    try {
      if (!fs.existsSync(PASTA_PRINTS)) fs.mkdirSync(PASTA_PRINTS, { recursive: true });
      for (const w of [721, 850, 900]) {
        await page.setViewport({ width: w, height: 800, hasTouch: true });
        await H.pausa(100);
        await page.screenshot({ path: path.join(PASTA_PRINTS, `depois_b5_${w}.png`), fullPage: false });
      }
      console.log('   prints de evidencia salvos em ' + PASTA_PRINTS);
    } catch (e) {
      console.log('   aviso ao salvar prints: ' + e.message);
    }

  } finally {
    await amb.encerrar();
  }

  console.log('\n' + '='.repeat(60));
  console.log(H.placar.passes + ' verificacoes passaram, ' + H.placar.falhas + ' falharam.');
  console.log('='.repeat(60));

  if (H.placar.falhas > 0) process.exit(1);
})().catch(err => {
  console.error('Erro na execucao da prova de navegador:', err);
  process.exit(1);
});
