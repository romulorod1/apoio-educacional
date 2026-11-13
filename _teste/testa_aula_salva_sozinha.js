/* testa_aula_salva_sozinha.js
 *
 * F7 (#159), regra da orquestradora (13/11/2026): na aula que já existe, o
 * relato e a nota só dela salvam sozinhos na pausa; data, horário, duração,
 * situação e cobrança gravam só ao Fechar ou ao Concluir, com o aviso de
 * Desfazer. Há "Descartar alterações".
 *
 * 1. A situação mudada NÃO grava na pausa; ao Fechar grava, com o aviso
 *    "Aula atualizada: ..." e o Desfazer, que volta exatamente o que havia.
 * 2. Conflito no MESMO campo: ela muda a situação; chega pela nuvem
 *    (Store.aplicarRecebidos, o caminho do recebimento) outra situação. A
 *    janela avisa, nada grava por cima, e fechar pede o sim.
 * 3. Conflito em campo DIFERENTE: ela muda a situação; chega outra nota só
 *    dela. A janela mostra a nota nova, e ao Fechar a situação dela grava.
 * 4. Descartar alterações: o relato salvo sozinho e a situação pendente
 *    voltam ao que havia ao abrir.
 * 5. Repetição (A1): ela muda a situação e escreve o relato; o relato salva
 *    sozinho; o Concluir pergunta o escopo e grava a situação.
 * 6. Repetição com conflito: ela muda o horário; chega outro horário; o
 *    Concluir não grava e pergunta.
 * 7. A falha de gravação aparece (rodapé e faixa) e a nova tentativa grava.
 * 8. O relato não se perde ao recarregar logo depois de escrever, com o disco
 *    recusando: volta pelo rascunho guardado na saída da página.
 *
 * Venenos, cada um tem de cair:
 *   --envenenado-grava-por-cima        sem a conferência antes de gravar e sem o rebase;
 *   --envenenado-sem-rascunho-ao-sair  sem o rascunho na saída da página (a gravação fica);
 *   --envenenado-retrato-absorve-tudo  o retrato do gravado absorve todas as chaves (A1).
 * Dados fictícios.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador');
const RELOGIO = H.relogioDaRodada('2026-11-16', '11:00');
const { conf, secao, esperar, pausa } = H;

const MODOS = ['--envenenado-grava-por-cima', '--envenenado-sem-rascunho-ao-sair', '--envenenado-retrato-absorve-tudo'];
const MODO = MODOS.filter(m => process.argv.indexOf(m) >= 0)[0] || '';
const CONFERE = '    return chaves.filter(function (k) { return noBanco[k] !== base[k]; });';
const REBASE = '  function rebasearAulaAberta() {';
const RASCUNHO_SAIDA = "      guardarRascunhoRelato(aulaEmEdicao, $('#campo-nota-texto'), $('#campo-nota-privada'), baseDiscoRelatoAula); // o rascunho, na hora";
const RETRATO = '    chaves.forEach(function (k) { s[k] = valores[k]; });';
const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
conf('(arranjo) as âncoras dos venenos estão cada uma num lugar só',
  [CONFERE, REBASE, RASCUNHO_SAIDA, RETRATO].map(a => APP.split(a).length).join(','), '2,2,2,2');
const trocas = {};
if (MODO === MODOS[0]) trocas['/app.js'] = APP.replace(CONFERE, '    return [];').replace(REBASE, REBASE + ' return;');
if (MODO === MODOS[1]) trocas['/app.js'] = APP.replace(RASCUNHO_SAIDA, '');
if (MODO === MODOS[2]) trocas['/app.js'] = APP.replace(RETRATO, '    Object.keys(valores).forEach(function (k) { s[k] = valores[k]; });');
if (MODO) conf('(veneno) o app.js servido mudou', trocas['/app.js'] !== APP, true);
const amb = H.criarAmbiente(8886, 'nath_f7_salva_sozinha', trocas);
function fimDoVeneno() { throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true }); }

const AVULSA = 'f7_aula';
const lerAula = (pag, id) => pag.evaluate(id => Store.carregar().then(d => {
  const a = d.aulas.find(x => x.id === id);
  return a ? JSON.parse(JSON.stringify(a)) : null;
}), id);
async function abrir(pag, id) {
  await H.irParaAba(pag, 'agenda');
  await pag.evaluate(id => document.querySelector('[data-aula-id="' + id + '"]').click(), id);
  return esperar('aula aberta', () => pag.evaluate(() => document.querySelector('#modal-aula').classList.contains('aberto')), Boolean, 5000);
}
const aberta = pag => pag.evaluate(() => document.querySelector('#modal-aula').classList.contains('aberto'));
const rodape = pag => pag.$eval('#estado-salvamento-aula', e => e.textContent);
async function escolher(pag, sel, valor) {
  await pag.$eval(sel, (e, v) => { e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, valor);
}
async function escrever(pag, sel, texto) {
  await pag.$eval(sel, (e, t) => { e.value = t; e.dispatchEvent(new Event('input', { bubbles: true })); }, texto);
}
/* Chega da nuvem uma versão da aula com `mudanca` (outro aparelho). A fila
 * de envio é esvaziada antes: a aula já tinha subido, senão a edição local
 * pendente venceria (regra do Store) e nada chegaria. */
const chegaDaNuvem = (pag, id, mudanca) => pag.evaluate(async (id, mudanca) => {
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
  const local = (await Store.lerRegistros()).find(r => r.id === 'aula:' + id);
  const dados = Object.assign({}, local.dados, mudanca);
  const contas = await Store.aplicarRecebidos([{ id: local.id, tipo: 'aula', atualizadoEm: '2099-01-01T00:00:00.000Z', apagadoEm: null,
    aparelho: 'ap000000000001', esquema: 1, servidorEm: '2099-01-01T00:00:00.000000Z', updateTime: '2099-01-01T00:00:00.000000Z', dados }]);
  return contas.aplicados;
}, id, mudanca);

(async () => {
  await amb.subir();
  const pag = await amb.pagina();
  pag.dialogos = [];
  pag.respostaDoDialogo = true;
  pag.removeAllListeners('dialog'); // o ajudante aceita toda pergunta; aqui quem responde é a prova
  pag.on('dialog', async d => {
    pag.dialogos.push(d.message());
    try { if (pag.respostaDoDialogo) await d.accept(); else await d.dismiss(); } catch (e) { /* ok */ }
  });
  await RELOGIO.naPagina(pag);
  await H.abrirApp(pag, amb.ORIGEM);
  const serie = await pag.evaluate(async id => {
    const d = await Store.carregar();
    d.alunos = [{ id: 'f7_alfa', nome: 'Aluna Alfa Teste', ativo: true, precos: [] }];
    d.series = []; d.resumos = [];
    d.aulas = [{ id, alunoId: 'f7_alfa', data: Core.hojeIso(), hora: '10:00', duracaoMin: 60, status: 'realizada',
      cobravel: true, notaTexto: 'Relato de antes', notaPrivada: 'Nota de antes', anexos: [] }];
    Core.criarSerie(d, { alunoId: 'f7_alfa', dias: [Core.diaSemana(Core.hojeIso())], hora: '16:00', duracaoMin: 60, inicio: Core.hojeIso(), fim: null });
    await Store.salvar(d);
    const s = d.series[0];
    return { id: s.id, aula: d.aulas.find(a => a.serieId === s.id && a.data === Core.hojeIso()).id };
  }, AVULSA);
  await H.abrirApp(pag, amb.ORIGEM);

  if (MODO === MODOS[0] || !MODO) {
    secao('1. A situação grava só ao Fechar, com Desfazer exato');
    conf('(arranjo) a aula abriu', (await abrir(pag, AVULSA)).ok, true);
    const antes = await lerAula(pag, AVULSA);
    await escolher(pag, '#campo-status', 'cancelada');
    await pausa(1200);
    conf('na pausa, a situação NÃO grava', (await lerAula(pag, AVULSA)).status, antes.status);
    conf('o rodapé diz que grava ao fechar', /gravam ao fechar/.test(await rodape(pag)), true);
    await pag.click('#cancelar-aula');
    const gravou = await esperar('a situação gravou ao fechar', () => lerAula(pag, AVULSA), a => a && a.status === 'cancelada', 5000);
    conf('ao Fechar, a situação grava', gravou.ok, true);
    const aviso = await pag.evaluate(() => ({ texto: document.querySelector('#aviso-texto').textContent,
      acao: (document.querySelector('#aviso-acao') || {}).textContent || '' }));
    conf('o aviso diz o que mudou e oferece Desfazer (' + aviso.texto + ')', /^Aula atualizada: cancelada/.test(aviso.texto) && /Desfazer/.test(aviso.acao), true);
    await pag.click('#aviso-acao');
    const desfeito = await esperar('o Desfazer volta', () => lerAula(pag, AVULSA), a => a && a.status === antes.status, 5000);
    const CAMPOS = ['data', 'hora', 'duracaoMin', 'status', 'cobravel', 'notaTexto', 'notaPrivada', 'destacada', 'serieId'];
    const diferentes = desfeito.ok ? CAMPOS.filter(k => JSON.stringify(desfeito.valor[k]) !== JSON.stringify(antes[k])) : ['(não voltou)'];
    if (diferentes.length) console.log('   antes: ' + JSON.stringify(antes) + '\n   depois: ' + JSON.stringify(desfeito.valor));
    conf('o Desfazer volta exatamente o que havia (' + diferentes.join(',') + ')', diferentes.length, 0);

    secao('2. Conflito no mesmo campo: nada grava por cima');
    conf('(arranjo) a aula abriu de novo', (await abrir(pag, AVULSA)).ok, true);
    await escolher(pag, '#campo-status', 'falta');
    conf('(arranjo) chegou do outro aparelho outra situação', await chegaDaNuvem(pag, AVULSA, { status: 'reposicao' }), 1);
    await pausa(900);
    pag.respostaDoDialogo = false;
    const dAntes = pag.dialogos.length;
    await pag.click('#cancelar-aula');
    await pausa(500);
    const noBanco = await lerAula(pag, AVULSA);
    if (MODO === MODOS[0]) {
      conf('VENENO visto: a situação do outro aparelho continua no banco, e quebrou (' + noBanco.status + ')', noBanco.status === 'reposicao', false);
      fimDoVeneno();
    }
    conf('a situação que chegou não foi coberta pela daqui', noBanco.status, 'reposicao');
    conf('o rodapé avisa que a aula mudou em outro aparelho', /mudou em outro aparelho/.test(await rodape(pag)), true);
    conf('fechar com conflito pergunta, e o "não" deixa a janela aberta',
      /não foi gravado/.test(pag.dialogos.slice(dAntes).join(' ')) && await aberta(pag), true);
    pag.respostaDoDialogo = true;
    await pag.click('#cancelar-aula');
    await pausa(400);
    conf('com o sim, fecha sem gravar', !(await aberta(pag)) && (await lerAula(pag, AVULSA)).status === 'reposicao', true);

    secao('3. Conflito em campo diferente: a janela mostra o novo e grava o dela');
    conf('(arranjo) a aula abriu de novo', (await abrir(pag, AVULSA)).ok, true);
    await escolher(pag, '#campo-status', 'falta');
    conf('(arranjo) chegou do outro aparelho outra nota só dela', await chegaDaNuvem(pag, AVULSA, { notaPrivada: 'Nota do outro aparelho' }), 1);
    await pausa(900);
    conf('a janela mostra a nota que chegou', await pag.$eval('#campo-nota-privada', e => e.value), 'Nota do outro aparelho');
    await pag.click('#cancelar-aula');
    const ambos = await esperar('a situação dela gravou', () => lerAula(pag, AVULSA), a => a && a.status === 'falta', 5000);
    conf('ao Fechar, a situação dela grava e a nota que chegou fica', ambos.ok && ambos.valor.notaPrivada === 'Nota do outro aparelho', true);

    secao('4. Descartar alterações volta ao que havia ao abrir');
    conf('(arranjo) a aula abriu de novo', (await abrir(pag, AVULSA)).ok, true);
    const abertura = await lerAula(pag, AVULSA);
    await escrever(pag, '#campo-nota-texto', 'Relato que vai ser descartado');
    const salvouSozinho = await esperar('o relato salvou sozinho', () => lerAula(pag, AVULSA), a => a && a.notaTexto === 'Relato que vai ser descartado', 5000);
    conf('(arranjo) o relato salvou sozinho na pausa', salvouSozinho.ok, true);
    await escolher(pag, '#campo-status', 'realizada');
    await pag.click('#descartar-aula');
    const voltou = await esperar('Descartar volta a aula', () => lerAula(pag, AVULSA), a => a && a.notaTexto === abertura.notaTexto, 5000);
    const CAMPOS_D = ['data', 'hora', 'duracaoMin', 'status', 'cobravel', 'notaTexto', 'notaPrivada', 'destacada'];
    const difD = voltou.ok ? CAMPOS_D.filter(k => JSON.stringify(voltou.valor[k]) !== JSON.stringify(abertura[k])) : ['(não voltou)'];
    if (difD.length) console.log('   abertura: ' + JSON.stringify(abertura) + '\n   depois: ' + JSON.stringify(voltou.valor));
    conf('Descartar volta a aula exatamente ao que era ao abrir (' + difD.join(',') + ')', difD.length === 0 && !(await aberta(pag)), true);
  }

  if (MODO === MODOS[2] || !MODO) {
    secao('5. Repetição (A1): situação e relato, o Concluir grava a situação com escopo');
    conf('(arranjo) a aula da repetição abriu', (await abrir(pag, serie.aula)).ok, true);
    await escolher(pag, '#campo-status', 'cancelada');
    await escrever(pag, '#campo-nota-texto', 'Desmarcou em cima da hora');
    const relatoSerie = await esperar('o relato da repetição salvou', () => lerAula(pag, serie.aula), a => a && a.notaTexto === 'Desmarcou em cima da hora', 5000);
    conf('(arranjo) o relato salvou sozinho', relatoSerie.ok, true);
    await pag.click('#salvar-aula');
    const escopo = await esperar('pergunta de escopo', () => pag.evaluate(() => document.querySelector('#modal-escopo').classList.contains('aberto')), Boolean, 4000);
    if (MODO === MODOS[2]) {
      conf('VENENO visto: o Concluir pergunta o escopo da situação, e quebrou', escopo.ok, false);
      fimDoVeneno();
    }
    conf('o Concluir pergunta o escopo da situação pendente', escopo.ok, true);
    await pag.evaluate(() => Array.from(document.querySelectorAll('.opcao-escopo')).find(o => /Somente esta aula/.test(o.textContent)).click());
    const situacao = await esperar('a situação gravou', () => lerAula(pag, serie.aula), a => a && a.status === 'cancelada', 5000);
    const canceladasNaSerie = await pag.evaluate(sid => Store.carregar().then(d =>
      d.aulas.filter(a => a.serieId === sid && a.status === 'cancelada').length), serie.id);
    conf('a situação gravou, só nesta aula', situacao.ok && canceladasNaSerie === 1, true);

    secao('6. Repetição com conflito: o Concluir não grava');
    const outra = await pag.evaluate(sid => Store.carregar().then(d => d.aulas.filter(a => a.serieId === sid && a.status !== 'cancelada')
      .sort((x, y) => x.data.localeCompare(y.data))[0].id), serie.id);
    conf('(arranjo) outra aula da repetição abriu', (await abrir(pag, outra)).ok, true);
    await escolher(pag, '#campo-hora', '17:00');
    conf('(arranjo) chegou do outro aparelho outro horário', await chegaDaNuvem(pag, outra, { hora: '18:00' }), 1);
    await pausa(900);
    pag.respostaDoDialogo = false;
    await pag.click('#salvar-aula');
    await pausa(600);
    conf('o Concluir não grava o horário por cima', (await lerAula(pag, outra)).hora, '18:00');
    conf('e a janela continua aberta, sem pergunta de escopo', await aberta(pag) &&
      !(await pag.evaluate(() => document.querySelector('#modal-escopo').classList.contains('aberto'))), true);
    pag.respostaDoDialogo = true;
    await pag.click('#cancelar-aula');
    await pausa(400);
  }

  if (!MODO) {
    secao('7. A falha de gravação aparece');
    conf('(arranjo) a aula reabriu', (await abrir(pag, AVULSA)).ok, true);
    await pag.evaluate(() => { window.__salvarOriginalF7 = Store.salvar; Store.salvar = () => Promise.reject(new Error('falha simulada')); });
    await escrever(pag, '#campo-nota-texto', 'Relato que o disco recusou');
    await pausa(1500);
    const falha = await pag.evaluate(() => ({
      rodape: document.querySelector('#estado-salvamento-aula').textContent,
      faixa: !!document.querySelector('#faixa-gravacao') && getComputedStyle(document.querySelector('#faixa-gravacao')).display !== 'none'
    }));
    conf('o rodapé diz que não gravou neste tablet', /Não foi possível gravar/.test(falha.rodape), true);
    conf('e a faixa de gravação aparece', falha.faixa, true);
    await pag.evaluate(() => { Store.salvar = window.__salvarOriginalF7; });
    const recuperou = await esperar('a nova tentativa grava', () => lerAula(pag, AVULSA), a => a && a.notaTexto === 'Relato que o disco recusou', 70000);
    conf('a nova tentativa sozinha grava o que ficou na memória', recuperou.ok, true);
    await pag.click('#cancelar-aula');
    await pausa(400);
  }

  if (MODO === MODOS[1] || !MODO) {
    secao('8. O relato não se perde ao recarregar');
    conf('(arranjo) a aula abriu', (await abrir(pag, AVULSA)).ok, true);
    // o disco recusa: só o rascunho guardado na saída da página pode trazer o texto de volta
    await pag.evaluate(() => { Store.salvar = () => Promise.reject(new Error('disco recusando')); });
    await escrever(pag, '#campo-nota-texto', 'Relato escrito logo antes de recarregar');
    await pausa(100); // antes da pausa de 600 ms do rascunho e do salvar sozinho
    await H.abrirApp(pag, amb.ORIGEM);
    conf('(arranjo) a aula reabriu depois de recarregar', (await abrir(pag, AVULSA)).ok, true);
    const volta = await pag.evaluate(() => ({ texto: document.querySelector('#campo-nota-texto').value,
      aviso: (document.querySelector('#aviso-rascunho-relato') || {}).textContent || '' }));
    if (MODO === MODOS[1]) {
      conf('VENENO visto: o relato voltou depois de recarregar, e quebrou (' + volta.texto + ')', volta.texto === 'Relato escrito logo antes de recarregar', false);
      fimDoVeneno();
    }
    conf('o relato escrito antes de recarregar voltou', volta.texto, 'Relato escrito logo antes de recarregar');
    conf('com o aviso "Rascunho recuperado às"', /Rascunho recuperado às/.test(volta.aviso), true);
  }

  conf('não houve erro de página', (pag.errosDePagina || []).join(' | '), '');
  await H.fim(amb)();
})().catch(e => H.fim(amb)(e));
