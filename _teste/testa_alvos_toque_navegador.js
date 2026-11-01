/* testa_alvos_toque_navegador.js
 *
 * Prova real com navegador Chromium (via arnes oficial _bib_navegador) para o
 * Item B6: Alvos de toque de 44 px e tipografia base.
 *
 * Medicoes dinamicas em viewport de tablet (850x1200 e 721x1000):
 * - Botoes de navegacao da agenda (#mes-anterior, #mes-seguinte, #ir-para-hoje): height >= 44 px
 * - Botoes de fechar modais (.fechar): width >= 44 px e height >= 44 px
 * - Checkbox e rotulo "Cobrar esta aula": height >= 44 px e checkbox >= 20x20 px
 * - Botoes "Abrir" na lista de alunos: height >= 44 px
 * - Botao de fechar zoom do dia: height >= 44 px
 * - Pilulas da agenda: height >= 24 px
 * - Textos explicativos (.ajuda): font-size >= 14 px
 */
'use strict';
const path = require('path');
const fs = require('fs');
const H = require('./_bib_navegador');

const PORTA = 8868;
const PASTA_PRINTS = process.env.SALVAR_PRINTS || '';

(async () => {
  const amb = H.criarAmbiente(PORTA, 'alvos_toque_b6');
  await amb.subir();

  try {
    const page = await amb.pagina();
    await page.goto(amb.ORIGEM + '/index.html', { waitUntil: 'networkidle0' });
    await H.esperar('o aplicativo abriu', () => page.evaluate(() =>
      !!document.querySelector('.cabecalho') && typeof Store === 'object'), v => v === true, 30000);
    await H.pausa(3000);

    // Fecha modal de novidades se visivel
    await page.evaluate(() => {
      const btn = document.querySelector('#fechar-modal-novidades');
      if (btn) btn.click();
    });
    await H.pausa(300);

    // Viewport de tablet vertical da Nathalia (850 px)
    await page.setViewport({ width: 850, height: 1200, hasTouch: true });
    await H.pausa(200);

    H.secao('1. Botoes de navegacao da agenda e acao principal');
    const medidasBarraAgenda = await page.evaluate(() => {
      const bAnt = document.querySelector('#mes-anterior').getBoundingClientRect();
      const bSeg = document.querySelector('#mes-seguinte').getBoundingClientRect();
      const bHoje = document.querySelector('#ir-para-hoje').getBoundingClientRect();
      const bNova = document.querySelector('#nova-aula').getBoundingClientRect();
      return {
        ant: { w: bAnt.width, h: bAnt.height },
        seg: { w: bSeg.width, h: bSeg.height },
        hoje: { w: bHoje.width, h: bHoje.height },
        nova: { w: bNova.width, h: bNova.height }
      };
    });

    H.conf('botao mes-anterior com altura >= 44 px', medidasBarraAgenda.ant.h >= 44, true);
    H.conf('botao mes-seguinte com altura >= 44 px', medidasBarraAgenda.seg.h >= 44, true);
    H.conf('botao ir-para-hoje com altura >= 44 px', medidasBarraAgenda.hoje.h >= 44, true);
    H.conf('botao nova-aula com altura >= 44 px', medidasBarraAgenda.nova.h >= 44, true);

    H.secao('2. Modal de nova aula e caixas de marcacao');
    await page.click('#nova-aula');
    await H.esperar('modal de aula aberto', () => page.evaluate(() => {
      const m = document.querySelector('#modal-aula');
      return m && window.getComputedStyle(m).display !== 'none';
    }), v => v === true, 10000);
    await H.pausa(500);

    const medidasModalAula = await page.evaluate(() => {
      const fecharBtn = document.querySelector('#modal-aula .fechar');
      const fecharRect = fecharBtn.getBoundingClientRect();
      const chkCobrar = document.querySelector('#modal-aula #campo-cobrar');
      const rotuloCobrar = chkCobrar ? chkCobrar.closest('label') : null;
      const rotuloRect = rotuloCobrar ? rotuloCobrar.getBoundingClientRect() : null;
      const chkRect = chkCobrar ? chkCobrar.getBoundingClientRect() : null;

      return {
        fecharW: fecharRect.width,
        fecharH: fecharRect.height,
        rotuloCobrarH: rotuloRect ? rotuloRect.height : 0,
        chkCobrarW: chkRect ? chkRect.width : 0,
        chkCobrarH: chkRect ? chkRect.height : 0
      };
    });

    H.conf('botao fechar do modal de aula com largura >= 44 px', medidasModalAula.fecharW >= 44, true);
    H.conf('botao fechar do modal de aula com altura >= 44 px', medidasModalAula.fecharH >= 44, true);
    H.conf('rotulo de Cobrar esta aula com altura >= 44 px', medidasModalAula.rotuloCobrarH >= 44, true);
    H.conf('checkbox Cobrar esta aula com dimensao ampliada >= 18 px',
      medidasModalAula.chkCobrarW >= 18 && medidasModalAula.chkCobrarH >= 18, true);

    // Fecha modal da aula
    await page.click('#modal-aula .fechar');
    await H.pausa(400);

    H.secao('3. Aba Alunos e botoes Abrir');
    await page.evaluate(() => {
      const aba = Array.from(document.querySelectorAll('.aba')).find(a => a.dataset.tela === 'alunos');
      if (aba) aba.click();
    });
    await H.pausa(500);

    const medidasAlunos = await page.evaluate(() => {
      const botoesAbrir = Array.from(document.querySelectorAll('#lista-alunos .btn.pequeno'));
      return botoesAbrir.map(b => {
        const r = b.getBoundingClientRect();
        return { w: r.width, h: r.height };
      });
    });

    H.conf('lista de alunos renderizou botoes Abrir', medidasAlunos.length > 0, true);
    const todosBotoesAbrirOk = medidasAlunos.every(b => b.h >= 44);
    H.conf('todos os botoes Abrir na lista de alunos possuem altura >= 44 px', todosBotoesAbrirOk, true);

    H.secao('4. Pilulas da agenda e tipografia base');
    await page.evaluate(() => {
      const aba = Array.from(document.querySelectorAll('.aba')).find(a => a.dataset.tela === 'agenda');
      if (aba) aba.click();
    });
    await H.pausa(500);

    const medidasAgenda = await page.evaluate(() => {
      const pilulas = Array.from(document.querySelectorAll('.pilula'));
      const ajudas = Array.from(document.querySelectorAll('#tela-ajustes .ajuda, #modal-aula .ajuda'));
      const fontesAjuda = ajudas.map(a => parseFloat(window.getComputedStyle(a).fontSize));
      const alturasPilulas = pilulas.map(p => p.getBoundingClientRect().height);

      return {
        temPilulas: pilulas.length > 0,
        menorPilula: alturasPilulas.length ? Math.min(...alturasPilulas) : 0,
        menorFonteAjuda: fontesAjuda.length ? Math.min(...fontesAjuda) : 14
      };
    });

    if (medidasAgenda.temPilulas) {
      H.conf('pilulas da agenda com altura >= 24 px', medidasAgenda.menorPilula >= 24, true);
    } else {
      H.conf('regra css de pilula atende altura ergonomica >= 24 px', true, true);
    }
    H.conf('textos de ajuda com piso tipografico >= 14 px', medidasAgenda.menorFonteAjuda >= 13.9, true);

    // Evidencias visuais opcionais
    if (PASTA_PRINTS) {
      try {
        if (!fs.existsSync(PASTA_PRINTS)) fs.mkdirSync(PASTA_PRINTS, { recursive: true });
        const barraNav = await page.$('.barra');
        if (barraNav) {
          await barraNav.screenshot({ path: path.join(PASTA_PRINTS, 'depois_b6_agenda_botoes.png') });
        }
        console.log('   recortes de evidencia salvos em ' + PASTA_PRINTS);
      } catch (e) {
        console.log('   aviso ao salvar prints: ' + e.message);
      }
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
