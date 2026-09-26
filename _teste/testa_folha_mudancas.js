/* testa_folha_mudancas.js
 *
 * Toda mudança na folha avisa quem grava, inclusive as que terminam por
 * cancelamento e a que sai pela lixeira.
 *
 * A folha se grava pelo `aoMudar` do Editor. Dois caminhos mudavam a nota e
 * não avisavam (lente de correção do PR #57):
 *   1. o `pointercancel` depois de a borracha já ter tirado um traço, ou de o
 *      arrasto já ter movido um item. O que mudou não volta com o cancelamento,
 *      e sem aviso a folha fechada logo depois perdia a mudança;
 *   2. o `removerSelecionado`, que é a lixeira da seleção (a única saída do
 *      retângulo de tapar, porque a borracha não o alcança).
 *
 * A prova usa o Editor de verdade num canvas da página do aplicativo, com
 * eventos de ponteiro da caneta em coordenadas calculadas da própria folha. E
 * cada medida tem o seu alvo ao lado: o cancelamento SEM mudança nenhuma não
 * pode avisar, senão "avisou" não quer dizer nada.
 *
 * Modos envenenados:
 *   --envenenado-cancela  o cancelamento volta a não avisar;
 *   --envenenado-lixeira-muda  a lixeira volta a não avisar.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa } = H;

const PORTA = 8813;
const V_CANCELA = process.argv.indexOf('--envenenado-cancela') !== -1;
const V_LIXEIRA = process.argv.indexOf('--envenenado-lixeira-muda') !== -1;
const V_ALCA = process.argv.indexOf('--envenenado-alca') !== -1;
const V_TRACO = process.argv.indexOf('--envenenado-traco-cancelado') !== -1;
const DRAW = fs.readFileSync(path.join(H.RAIZ, 'draw.js'), 'utf8');
const L_CANCELA = '    if (mudou) this._avisarMudanca();';
const L_LIXEIRA = '    if (i >= 0) this._avisarMudanca();';
const L_ALCA = '      var alvo = (this.selecionado && this._alcaEm(p, this.selecionado)) ? this.selecionado : this.itemEm(p);';
const L_TRACO = '    var guardouTraco = this._fecharTraco();';
const trocas = {};
let ancoras = { cancela: DRAW.split(L_CANCELA).length - 1, lixeira: DRAW.split(L_LIXEIRA).length - 1, alca: DRAW.split(L_ALCA).length - 1 };
if (V_CANCELA) trocas['/draw.js'] = DRAW.split(L_CANCELA).join('    void mudou;');
if (V_LIXEIRA) trocas['/draw.js'] = DRAW.split(L_LIXEIRA).join('    void i;');
if (V_TRACO) trocas['/draw.js'] = DRAW.split(L_TRACO).join('    this._cancelarTraco(); var guardouTraco = false;');
if (V_ALCA) trocas['/draw.js'] = DRAW.split(L_ALCA).join('      var alvo = this.itemEm(p);');
const amb = H.criarAmbiente(PORTA, 'perfil_folha_mudancas', trocas);

/* Monta um Editor num canvas de 600 x 800, com um traço horizontal no meio da
 * folha e um retângulo de tapar abaixo dele, e devolve funções de toque em
 * coordenadas DA FOLHA. */
const preparar = pag => pag.evaluate(() => {
  const c = document.createElement('canvas');
  c.style.cssText = 'position:fixed;left:0;top:0;width:600px;height:800px;z-index:99999;background:#fff';
  document.body.appendChild(c);
  const nota = window.Draw.notaVazia('branco');
  const pontos = [];
  for (let x = 200; x <= 800; x += 20) pontos.push([x, 500, 3]);
  nota.paginas[0].itens.push({ t: 'traco', cor: '#1A1C1F', pontos: pontos });
  nota.paginas[0].itens.push({ t: 'tapar', x: 300, y: 800, w: 300, h: 120 });
  window.__avisos = 0;
  /* O aviso guarda também o que a nota TINHA no instante do aviso: quem grava
   * a folha grava aquele estado, e um aviso dado antes da mudança (o do
   * `marcarPonto`, no começo do gesto) não conta como aviso da mudança. */
  window.__viu = null;
  const ed = new window.Draw.Editor(c, { nota: nota, aoMudar: n => {
    window.__avisos++;
    window.__viu = n.paginas[0].itens.filter(i => i.t === 'tapar').length;
  } });
  if (ed.ajustarTamanho) ed.ajustarTamanho();
  window.__ed = ed; window.__c = c;
  return { escala: ed.escala, dx: ed.deslocX, dy: ed.deslocY };
});
const toque = (pag, tipo, x, y) => pag.evaluate((t, fx, fy) => {
  const ed = window.__ed, c = window.__c, r = c.getBoundingClientRect();
  c.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'pen',
    clientX: r.left + ed.deslocX + fx * ed.escala, clientY: r.top + ed.deslocY + fy * ed.escala,
    buttons: t === 'pointerup' || t === 'pointercancel' ? 0 : 1 }));
}, tipo, x, y);
const estado = pag => pag.evaluate(() => ({
  avisos: window.__avisos,
  tracos: window.__ed.pagina().itens.filter(i => i.t === 'traco').length,
  tapar: (window.__ed.pagina().itens.filter(i => i.t === 'tapar')[0] || null)
}));
const zerar = pag => pag.evaluate(() => { window.__avisos = 0; });

(async () => {
  conf('as três âncoras dos venenos casam uma vez cada no draw.js', ancoras.cancela + ',' + ancoras.lixeira + ',' + ancoras.alca, '1,1,1');
  conf('a âncora do veneno do traço casa uma vez', DRAW.split(L_TRACO).length - 1, 1);
  if (V_CANCELA || V_LIXEIRA || V_ALCA || V_TRACO) conf('o veneno mudou mesmo o draw.js', trocas['/draw.js'] !== DRAW ? 'diferente' : 'IGUAL', 'diferente');
  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);
  const geo = await preparar(pag);
  console.log('   folha na tela: ' + JSON.stringify(geo));

  /* A ALÇA DO TAPAR POR CIMA DE UMA IMAGEM. O retângulo fica sobre o recorte
   * do enunciado, que é o uso dele; o toque na alça cai um pouco FORA do
   * retângulo (a alça tem folga) e dentro da imagem. Tem de redimensionar o
   * retângulo, e não a imagem. */
  secao('A. A alça do tapar selecionado vence a imagem debaixo');
  const alca = await pag.evaluate(() => {
    const ed = window.__ed;
    const itens = ed.pagina().itens;
    const img = { t: 'imagem', ref: 'nada', x: 100, y: 100, w: 700, h: 500 };
    const tp = { t: 'tapar', x: 200, y: 200, w: 200, h: 60 };
    itens.push(img); itens.push(tp);
    ed.selecionado = tp; ed.ferramenta = 'selecao';
    window.__alca = { img, tp };
    return { img: [img.x, img.y, img.w, img.h].join(','), tpW: tp.w };
  });
  await toque(pag, 'pointerdown', 406, 264);   // 6 e 4 unidades fora do canto, dentro da imagem
  await toque(pag, 'pointermove', 446, 284);
  await toque(pag, 'pointerup', 446, 284);
  const depoisAlca = await pag.evaluate(() => { const i = window.__alca.img;
    return { img: [i.x, i.y, i.w, i.h].join(','), tpW: window.__alca.tp.w }; });
  console.log('   antes ' + JSON.stringify(alca) + ' depois ' + JSON.stringify(depoisAlca));
  if (V_ALCA) {
    conf('VENENO ENXERGADO: o toque na alça pegou a IMAGEM, e o recorte saiu do lugar', depoisAlca.img !== alca.img, true);
    return;
  }
  conf('a imagem do enunciado não se mexeu', depoisAlca.img, alca.img);
  conf('e o retângulo cresceu', depoisAlca.tpW > alca.tpW, true);
  await pag.evaluate(() => {
    const itens = window.__ed.pagina().itens;
    [window.__alca.img, window.__alca.tp].forEach(x => itens.splice(itens.indexOf(x), 1));
    window.__ed.selecionado = null;
  });

  /* O TRAÇO FEITO ATÉ O CANCELAMENTO FICA: é escrita dela. */
  secao('B. Caneta cancelada no meio do traço guarda o traço');
  await pag.evaluate(() => { window.__ed.ferramenta = 'caneta'; });
  const tracosAntes = (await estado(pag)).tracos;
  await toque(pag, 'pointerdown', 200, 1100);
  for (let k = 1; k <= 5; k++) await toque(pag, 'pointermove', 200 + k * 40, 1100 + k * 5);
  await zerar(pag);
  await toque(pag, 'pointercancel', 400, 1125);
  const eb = await estado(pag);
  if (V_TRACO) {
    conf('VENENO ENXERGADO: o traço dela sumiu com o cancelamento', eb.tracos, tracosAntes);
    return;
  }
  conf('o traço ficou na folha', eb.tracos, tracosAntes + 1);
  // sob o veneno do cancelamento o aviso é justamente o que falta; lá quem decide é a seção 1
  if (!V_CANCELA) conf('e quem grava foi avisado', eb.avisos > 0, true);
  await pag.evaluate(() => { const it = window.__ed.pagina().itens; it.splice(it.length - 1, 1); });

  secao('0. O alvo: cancelar sem ter mudado nada NÃO avisa');
  await pag.evaluate(() => { window.__ed.ferramenta = 'borracha'; });
  /* O `marcarPonto` do começo de todo gesto já avisa (é o ponto do
   * desfazer), então a conta zera DEPOIS do começo, e mede só o cancelamento. */
  await toque(pag, 'pointerdown', 100, 100);  // longe do traço: a borracha não tira nada
  await toque(pag, 'pointermove', 110, 110);
  await zerar(pag);
  await toque(pag, 'pointercancel', 110, 110);
  let e = await estado(pag);
  conf('a borracha longe do traço não tirou nada', e.tracos, 1);
  conf('e o cancelamento sem mudança não avisou', e.avisos, 0);

  secao('1. Borracha que já apagou, e o gesto é cancelado');
  await toque(pag, 'pointerdown', 400, 500);
  await toque(pag, 'pointermove', 420, 500);
  await zerar(pag);
  await toque(pag, 'pointercancel', 420, 500);
  e = await estado(pag);
  conf('a borracha tirou o traço', e.tracos, 0);
  if (V_CANCELA) {
    conf('VENENO ENXERGADO: a folha mudou e ninguém foi avisado', e.avisos, 0);
  } else {
    conf('e o cancelamento AVISOU a mudança', e.avisos > 0, true);
  }

  secao('2. Arrasto que já moveu o retângulo, e o gesto é cancelado');
  await pag.evaluate(() => { window.__ed.ferramenta = 'selecao'; });
  const antes = (await estado(pag)).tapar;
  await toque(pag, 'pointerdown', 450, 860);
  await toque(pag, 'pointermove', 470, 900);
  await zerar(pag);
  await toque(pag, 'pointercancel', 470, 900);
  e = await estado(pag);
  conf('o retângulo saiu do lugar', e.tapar && (e.tapar.x !== antes.x || e.tapar.y !== antes.y), true);
  if (V_CANCELA) {
    conf('VENENO ENXERGADO: moveu e ninguém foi avisado', e.avisos, 0);
    return;
  }
  conf('e o cancelamento AVISOU a mudança', e.avisos > 0, true);

  secao('3. A lixeira da seleção avisa');
  await toque(pag, 'pointerdown', 470, 900);
  await toque(pag, 'pointerup', 470, 900);
  await zerar(pag);
  const tirou = await pag.evaluate(() => {
    if (!window.__ed.selecionado) return 'nada selecionado';
    window.__ed.removerSelecionado();
    return 'ok';
  });
  conf('havia um item selecionado para a lixeira', tirou, 'ok');
  e = await estado(pag);
  conf('o retângulo saiu da folha', e.tapar, null);
  const viu = await pag.evaluate(() => window.__viu);
  if (V_LIXEIRA) {
    conf('VENENO ENXERGADO: o último aviso ainda viu o retângulo na folha', viu, 1);
    return;
  }
  conf('e o último aviso já viu a folha SEM o retângulo', viu, 0);
  await zerar(pag);
  await pag.evaluate(() => window.__ed.removerSelecionado());
  conf('e a lixeira sem nada selecionado não avisa (o alvo)', (await estado(pag)).avisos, 0);

  conf('nenhum erro de JavaScript na página', pag.errosDePagina.length ? pag.errosDePagina.join(' | ') : 0, 0);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
