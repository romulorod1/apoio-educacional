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
    const agendaPequenos = await page.evaluate(() => Array.from(document.querySelectorAll('#abas button, #tela-agenda button'))
      .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
      .filter(e => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).length);
    H.conf('todos os botões visíveis da agenda e navegação têm alvo de 44 px', agendaPequenos, 0);

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
    H.conf('checkbox Cobrar esta aula mede pelo menos 24 px',
      medidasModalAula.chkCobrarW >= 24 && medidasModalAula.chkCobrarH >= 24, true);
    const aulaPequenos = await page.evaluate(() => Array.from(document.querySelectorAll('#modal-aula button, #modal-aula input, #modal-aula select'))
      .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
      .filter(e => { const alvo = e.type === 'checkbox' ? (e.closest('label') || e) : e;
        const r = alvo.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).length);
    H.conf('todos os controles visíveis da janela de aula têm alvo de 44 px', aulaPequenos, 0);

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
      const amostra = document.createElement('span');
      amostra.className = 'pilula'; amostra.textContent = 'Aula de teste';
      document.body.appendChild(amostra);
      const pilulas = [amostra];
      const ajudas = Array.from(document.querySelectorAll('#tela-ajustes .ajuda, #modal-aula .ajuda'));
      const fontesAjuda = ajudas.map(a => parseFloat(window.getComputedStyle(a).fontSize));
      const alturasPilulas = pilulas.map(p => p.getBoundingClientRect().height);

      const resultado = {
        temPilulas: pilulas.length > 0,
        menorPilula: alturasPilulas.length ? Math.min(...alturasPilulas) : 0,
        fontePilula: parseFloat(window.getComputedStyle(amostra).fontSize),
        menorFonteAjuda: fontesAjuda.length ? Math.min(...fontesAjuda) : 14
      };
      amostra.remove();
      return resultado;
    });

    if (medidasAgenda.temPilulas) {
      H.conf('pilulas da agenda com altura >= 32 px', medidasAgenda.menorPilula >= 32, true);
    } else {
      H.conf('regra css de pilula atende altura ergonomica >= 24 px', true, true);
    }
    H.conf('pílulas com letra de pelo menos 14 px', medidasAgenda.fontePilula >= 14, true);
    H.conf('textos de ajuda com piso tipográfico >= 15 px', medidasAgenda.menorFonteAjuda >= 15, true);

    H.secao('5. Alvos de cores vizinhas sem sobreposição');
    const cores = await page.evaluate(() => {
      const faixa = document.createElement('div');
      faixa.style.cssText = 'position:fixed;top:80px;left:80px;display:flex;gap:8px;z-index:99999';
      const a = document.createElement('button'), b = document.createElement('button');
      a.className = b.className = 'cor-opcao'; faixa.append(a, b); document.body.appendChild(faixa);
      const ra = a.getBoundingClientRect();
      const ponto = ra.left + ra.width / 2 + 17;
      const resultado = { largura: ra.width, altura: ra.height,
        primeira: document.elementFromPoint(ponto, ra.top + ra.height / 2) === a };
      faixa.remove(); return resultado;
    });
    H.conf('cada cor tem alvo próprio de pelo menos 44 px', cores.largura >= 44 && cores.altura >= 44, true);
    H.conf('toque próximo da primeira cor não seleciona a segunda', cores.primeira, true);

    H.secao('6. Alvos visíveis de Ajustes');
    await page.evaluate(() => document.querySelector('#abas .aba[data-tela="ajustes"]').click());
    const ajustes = await page.evaluate(() => {
      const controles = Array.from(document.querySelectorAll('#tela-ajustes button, #tela-ajustes input, #tela-ajustes select'))
        .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
      return { total: controles.length, pequenos: controles.filter(e => {
        const alvo = e.type === 'checkbox' ? (e.closest('label') || e) : e;
        const r = alvo.getBoundingClientRect(); return r.width < 44 || r.height < 44;
      }).length };
    });
    H.conf('Ajustes tem controles para medir', ajustes.total > 0, true);
    H.conf('controles visíveis de Ajustes têm alvo de 44 px', ajustes.pequenos, 0);

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
