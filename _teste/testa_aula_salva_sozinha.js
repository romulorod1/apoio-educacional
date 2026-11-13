/* testa_aula_salva_sozinha.js
 *
 * F7 (#159): a aula que já existe salva sozinha, com as regras de dados.
 *
 * 1. Nunca por cima de versão mais nova: com a janela aberta, chega pela
 *    nuvem (Store.aplicarRecebidos, o mesmo caminho do recebimento) um relato
 *    novo de outro aparelho. Ela escreve no relato daqui: nada é gravado por
 *    cima, o rodapé avisa, e fechar pede o sim dela.
 * 2. A falha de gravação aparece: com o disco recusando, o rodapé e a faixa
 *    de gravação dizem que não guardou, e a memória fica com o que ela fez.
 * 3. O relato não se perde ao recarregar: ela escreve e recarrega logo, antes
 *    da pausa do salvar sozinho. Ao reabrir, o texto está lá (do banco ou do
 *    rascunho guardado na saída da página).
 *
 * Venenos, cada um tem de cair:
 *   --envenenado-grava-por-cima     o app.js servido sem a conferência antes de gravar;
 *   --envenenado-sem-rascunho-ao-sair  o app.js servido sem o rascunho na saída da página.
 * Dados fictícios.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador');
const RELOGIO = H.relogioDaRodada('2026-11-16', '11:00');
const { conf, secao, esperar, pausa } = H;

const MODOS = ['--envenenado-grava-por-cima', '--envenenado-sem-rascunho-ao-sair'];
const MODO = MODOS.filter(m => process.argv.indexOf(m) >= 0)[0] || '';
const CONFERE = "    var mexidasFora = noBanco ? Object.keys(mudancas).filter(function (k) { return noBanco[k] !== base[k]; }) : ['aula'];";
const SAIDA = "    window.addEventListener('pagehide', function () {";
const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
conf('(arranjo) a conferência antes de gravar e o rascunho na saída estão cada um num lugar só',
  APP.split(CONFERE).length + ',' + APP.split(SAIDA).length, '2,2');
const trocas = {};
if (MODO === MODOS[0]) trocas['/app.js'] = APP.replace(CONFERE, '    var mexidasFora = [];');
if (MODO === MODOS[1]) trocas['/app.js'] = APP.replace(SAIDA, "    window.addEventListener('pagehide-envenenado', function () {");
if (MODO) conf('(veneno) o app.js servido mudou', trocas['/app.js'] !== APP, true);
const amb = H.criarAmbiente(8886, 'nath_f7_salva_sozinha', trocas);
function fimDoVeneno() { throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true }); }

const ID = 'f7_aula';
const lerAula = pag => pag.evaluate(id => Store.carregar().then(d => {
  const a = d.aulas.find(x => x.id === id);
  return a ? { notaTexto: a.notaTexto || '', hora: a.hora } : null;
}), ID);
async function abrirAula(pag) {
  await H.irParaAba(pag, 'agenda');
  await pag.click('[data-aula-id="' + ID + '"]');
  return esperar('aula aberta', () => pag.evaluate(() => document.querySelector('#modal-aula').classList.contains('aberto')), Boolean, 5000);
}
async function escrever(pag, texto) {
  await pag.$eval('#campo-nota-texto', (e, t) => { e.value = t; e.dispatchEvent(new Event('input', { bubbles: true })); }, texto);
}

(async () => {
  await amb.subir();
  const pag = await amb.pagina();
  pag.dialogos = [];
  pag.on('dialog', async d => { pag.dialogos.push(d.message()); try { await d.accept(); } catch (e) { /* ok */ } });
  await RELOGIO.naPagina(pag);
  await H.abrirApp(pag, amb.ORIGEM);
  await pag.evaluate(async id => {
    const d = await Store.carregar();
    d.alunos = [{ id: 'f7_alfa', nome: 'Aluna Alfa Teste', ativo: true, precos: [] }];
    d.series = []; d.resumos = [];
    d.aulas = [{ id, alunoId: 'f7_alfa', data: Core.hojeIso(), hora: '10:00', duracaoMin: 60, status: 'realizada',
      cobravel: true, notaTexto: 'Relato de antes', notaPrivada: '', anexos: [] }];
    await Store.salvar(d);
  }, ID);
  await H.abrirApp(pag, amb.ORIGEM);

  if (MODO !== MODOS[1]) {
    secao('1. Nunca por cima de versão mais nova');
    conf('(arranjo) a aula abriu', (await abrirAula(pag)).ok, true);
    const chegou = await pag.evaluate(async id => {
      /* A aula já tinha subido para a nuvem: a fila de envio está vazia. Sem
       * isso, o recebimento acha a edição local pendente e ela vence (é a regra
       * do Store), e nada chegaria para a janela conferir. */
      await new Promise((resolve, reject) => {
        const req = indexedDB.open('apoio-educacional');
        req.onsuccess = () => {
          const b = req.result;
          const t = b.transaction('saida', 'readwrite');
          t.objectStore('saida').clear();
          t.oncomplete = () => { b.close(); resolve(); };
          t.onerror = () => { b.close(); reject(t.error); };
        };
        req.onerror = () => reject(req.error);
      });
      const regs = await Store.lerRegistros();
      const local = regs.find(r => r.id === 'aula:' + id);
      const dados = Object.assign({}, local.dados, { notaTexto: 'Relato do outro aparelho' });
      const contas = await Store.aplicarRecebidos([{ id: local.id, tipo: 'aula', atualizadoEm: '2099-01-01T00:00:00.000Z', apagadoEm: null,
        aparelho: 'ap000000000001', esquema: 1, servidorEm: '2099-01-01T00:00:00.000000Z', updateTime: '2099-01-01T00:00:00.000000Z', dados }]);
      return contas.aplicados;
    }, ID);
    conf('(arranjo) o relato do outro aparelho chegou ao banco', chegou, 1);
    await pausa(800); // o app relê o banco ao receber
    await escrever(pag, 'Relato escrito aqui');
    await pausa(1500);
    const depois = await lerAula(pag);
    const rodape = await pag.$eval('#estado-salvamento-aula', e => e.textContent);
    if (MODO === MODOS[0]) {
      conf('VENENO visto: o relato do outro aparelho continua no banco, e quebrou (' + depois.notaTexto + ')',
        depois.notaTexto === 'Relato do outro aparelho', false);
      fimDoVeneno();
    }
    conf('o relato que chegou de outro aparelho não foi coberto pelo daqui', depois.notaTexto, 'Relato do outro aparelho');
    conf('o rodapé avisa que a aula mudou em outro aparelho e nada foi gravado', /mudou em outro aparelho/.test(rodape) && /Nada foi gravado/.test(rodape), true);
    const dialogosAntes = pag.dialogos.length;
    await pag.click('#cancelar-aula');
    await pausa(400);
    conf('fechar com conflito pede o sim dela', /não foi gravado/.test(pag.dialogos.slice(dialogosAntes).join(' ')), true);
    conf('e, com o sim, a janela fecha sem gravar', (await pag.evaluate(() => !document.querySelector('#modal-aula').classList.contains('aberto'))) &&
      (await lerAula(pag)).notaTexto === 'Relato do outro aparelho', true);

    secao('2. A falha de gravação aparece');
    conf('(arranjo) a aula reabriu', (await abrirAula(pag)).ok, true);
    await pag.evaluate(() => {
      window.__salvarOriginalF7 = Store.salvar;
      Store.salvar = () => Promise.reject(new Error('falha simulada'));
    });
    await escrever(pag, 'Relato que o disco recusou');
    await pausa(1500);
    const falha = await pag.evaluate(() => ({
      rodape: document.querySelector('#estado-salvamento-aula').textContent,
      faixa: !!document.querySelector('#faixa-gravacao') && getComputedStyle(document.querySelector('#faixa-gravacao')).display !== 'none'
    }));
    conf('o rodapé diz que não gravou neste tablet', /Não foi possível gravar/.test(falha.rodape), true);
    conf('e a faixa de gravação aparece', falha.faixa, true);
    await pag.evaluate(() => { Store.salvar = window.__salvarOriginalF7; });
    const recuperou = await esperar('a nova tentativa grava', () => lerAula(pag), a => a && a.notaTexto === 'Relato que o disco recusou', 70000);
    conf('a nova tentativa sozinha grava o que ficou na memória', recuperou.ok, true);
    await pag.click('#cancelar-aula');
    await pausa(400);
  }

  secao('3. O relato não se perde ao recarregar');
  conf('(arranjo) a aula abriu de novo', (await abrirAula(pag)).ok, true);
  await escrever(pag, 'Relato escrito logo antes de recarregar');
  await pausa(100); // antes da pausa de 600 ms do salvar sozinho e do rascunho
  await H.abrirApp(pag, amb.ORIGEM);
  conf('(arranjo) a aula reabriu depois de recarregar', (await abrirAula(pag)).ok, true);
  const texto = await pag.$eval('#campo-nota-texto', e => e.value);
  if (MODO === MODOS[1]) {
    conf('VENENO visto: o relato voltou depois de recarregar, e quebrou (' + texto + ')', texto === 'Relato escrito logo antes de recarregar', false);
    fimDoVeneno();
  }
  conf('o relato escrito antes de recarregar voltou', texto, 'Relato escrito logo antes de recarregar');

  conf('não houve erro de página', (pag.errosDePagina || []).join(' | '), '');
  await H.fim(amb)();
})().catch(e => H.fim(amb)(e));
