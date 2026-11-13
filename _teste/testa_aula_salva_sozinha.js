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
 * Rodada 3:
 * 9.  (B1) Descartar volta só o que ESTA janela mudou: a nota, a situação e a
 *     cobrança que chegaram do celular ficam (e a janela as mostra coerentes).
 * 10. (B2) A gravação falha e chega a nuvem com o relato de antes: a caixa
 *     fica com o texto dela, a janela não diz que mostra a versão nova, e o
 *     rascunho volta ao reabrir.
 * 11. (B3) Excluir com mudança pendente: o aviso é o da exclusão, com o
 *     Desfazer. Dividir com mudança pendente: um aviso só, com as duas frases.
 * 12. (B4) O relato numa aula da repetição não a destaca; o "todas" de uma
 *     irmã muda o horário da irmã sem relato e deixa a aula com relato como
 *     está (regra do core, testa_escopo_relato.js).
 * 13. (B5) O Desfazer de "Aula atualizada" volta só aquela aula: o relato
 *     gravado depois em outra aula fica.
 * 14. A aula passada de mês com pagamento fica fora do "todas" e do "excluir todas",
 *     e o aviso diz quantas ficaram de fora e por quê (regra no core,
 *     testa_escopo_pago.js).
 * 15. O Voltar do aparelho na aula NOVA preenchida pergunta "Sair sem guardar o
 *     que você escreveu?", como no pai; o "não" deixa a janela aberta.
 * 16. Uma gravação depois de um lote encerra o Desfazer do lote (o relato salvo
 *     depois não some).
 * 17. A pergunta de escopo aberta enquanto chega uma mudança: nada grava por cima.
 * 18. O fecharTudo do Desfazer não grava: o relato pendente fica no rascunho.
 * 19. O Encerrar da ficha do aluno também poupa a aula já registrada, e o aviso
 *     diz quantas continuam (regra no core, testa_encerrar_repeticao.js).
 * 20. O Desfazer do passo da trilha (e de todo comDesfazer) acaba quando outra
 *     gravação vem depois: o relato salvo sozinho não some.
 *
 * Venenos, cada um tem de cair:
 *   --envenenado-grava-por-cima        sem a conferência antes de gravar e sem o rebase;
 *   --envenenado-sem-rascunho-ao-sair  sem o rascunho na saída da página (a gravação fica);
 *   --envenenado-retrato-absorve-tudo  o retrato do gravado absorve todas as chaves (A1);
 *   --envenenado-descartar-velho       o rebase não atualiza a abertura da janela (B1);
 *   --envenenado-volta-atras           o rebase não reconhece o banco que voltou atrás (B2);
 *   --envenenado-desfazer-tudo         o Desfazer de uma aula volta o banco inteiro (B5);
 *   --envenenado-desfazer-so-no-lote   a trava "gravou depois, o Desfazer acaba" só vale no lote;
 *   --envenenado-voltar-nao-pergunta   o Voltar na aula nova preenchida volta a fechar sem perguntar (seção 15).
 * Dados fictícios.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador');
const RELOGIO = H.relogioDaRodada('2026-11-16', '11:00');
const { conf, secao, esperar, pausa } = H;

const MODOS = ['--envenenado-grava-por-cima', '--envenenado-sem-rascunho-ao-sair', '--envenenado-retrato-absorve-tudo',
  '--envenenado-descartar-velho', '--envenenado-volta-atras', '--envenenado-desfazer-tudo', '--envenenado-desfazer-so-no-lote',
  '--envenenado-voltar-nao-pergunta'];
const MODO = MODOS.filter(m => process.argv.indexOf(m) >= 0)[0] || '';
const CONFERE = '    return chaves.filter(function (k) { return noBanco[k] !== base[k]; });';
const REBASE = '  function rebasearAulaAberta() {';
const RASCUNHO_SAIDA = "      guardarRascunhoRelato(aulaEmEdicao, $('#campo-nota-texto'), $('#campo-nota-privada'), baseDiscoRelatoAula); // o rascunho, na hora";
const RETRATO = '    chaves.forEach(function (k) { s[k] = valores[k]; });';
const ABERTURA = '      if (aberturaDaAula) {';
const VOLTOU = '      return (sobrescritosPelaJanela[k] || []).indexOf(noBanco[k]) >= 0;';
const DESFAZ = "(escopo === 'esta' ? comDesfazerDaAula(rotulo, aula.id, acaoDaAula) : comDesfazer(rotulo, acaoDaAula, true))";
const TRAVA = '          encerrarDesfazerDeLote(); registroDoLote = desfazerDeLoteAberto = { marca: gravacoesPedidas };';
const PERGUNTA_VOLTAR = '    if (JANELAS_COM_CAMPOS[topo.id] && !aulaPeloFechar && janelaMudou(topo.id)) {';
const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
conf('(arranjo) as âncoras dos venenos estão cada uma num lugar só',
  [CONFERE, REBASE, RASCUNHO_SAIDA, RETRATO, ABERTURA, VOLTOU, DESFAZ, TRAVA, PERGUNTA_VOLTAR].map(a => APP.split(a).length).join(','), '2,2,2,2,2,2,2,2,2');
const trocas = {};
if (MODO === MODOS[0]) trocas['/app.js'] = APP.replace(CONFERE, '    return [];').replace(REBASE, REBASE + ' return;');
if (MODO === MODOS[1]) trocas['/app.js'] = APP.replace(RASCUNHO_SAIDA, '');
if (MODO === MODOS[2]) trocas['/app.js'] = APP.replace(RETRATO, '    Object.keys(valores).forEach(function (k) { s[k] = valores[k]; });');
if (MODO === MODOS[3]) trocas['/app.js'] = APP.replace(ABERTURA, '      if (false) {');
if (MODO === MODOS[4]) trocas['/app.js'] = APP.replace(VOLTOU, '      return false;');
if (MODO === MODOS[5]) trocas['/app.js'] = APP.replace(DESFAZ, 'comDesfazer(rotulo, acaoDaAula)');
if (MODO === MODOS[7]) trocas['/app.js'] = APP.replace(PERGUNTA_VOLTAR, "    if (JANELAS_COM_CAMPOS[topo.id] && topo.id !== 'modal-aula' && !aulaPeloFechar && janelaMudou(topo.id)) {");
if (MODO === MODOS[6]) trocas['/app.js'] = APP.replace(TRAVA, '          if (deLote) { encerrarDesfazerDeLote(); registroDoLote = desfazerDeLoteAberto = { marca: gravacoesPedidas }; }');
if (MODO) conf('(veneno) o app.js servido mudou', trocas['/app.js'] !== APP, true);
const amb = H.criarAmbiente(8886, 'nath_f7_salva_sozinha', trocas);
function fimDoVeneno() { throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true }); }

const AVULSA = 'f7_aula';
const EXCLUI = 'f7_exclui', DIVIDE = 'f7_divide', OUTRA = 'f7_outra';
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
/* O aviso entra deslizando: tocar no botão antes de ele assentar na tela dá
 * "Node is either not clickable". Espera o aviso aberto e o botão parado dentro
 * da tela (duas leituras iguais), e só então toca, como o dedo dela. */
async function tocarAcaoDoAviso(pag) {
  let antes = '';
  const pronto = await esperar('o botão do aviso parado na tela', async () => {
    const r = await pag.evaluate(() => {
      const caixa = document.querySelector('#aviso'), b = document.querySelector('#aviso-acao');
      if (!caixa || !b || !caixa.classList.contains('aberto') || getComputedStyle(b).display === 'none') return '';
      const q = b.getBoundingClientRect();
      if (!q.width || !q.height || q.top < 0 || q.bottom > innerHeight) return '';
      return [q.left, q.top, q.width, q.height].map(Math.round).join(',');
    });
    const parado = r && r === antes;
    antes = r;
    return parado;
  }, Boolean, 5000);
  if (!pronto.ok) throw new Error('arranjo: o botão do aviso não assentou na tela');
  await pag.click('#aviso-acao');
}
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
/* Cada chegada leva um carimbo do servidor mais novo que o anterior: o que
 * chega com carimbo igual ao que o aparelho já conhece é ignorado (regra do Store). */
let carimboDaChegada = 0;
const chegaDaNuvem = (pag, id, mudanca) => pag.evaluate(async (id, mudanca, n) => {
  const carimbo = '2099-01-' + String(n).padStart(2, '0') + 'T00:00:00.000000Z';
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
  const contas = await Store.aplicarRecebidos([{ id: local.id, tipo: 'aula', atualizadoEm: carimbo.slice(0, 23) + 'Z', apagadoEm: null,
    aparelho: 'ap000000000001', esquema: 1, servidorEm: carimbo, updateTime: carimbo, dados }]);
  return contas.aplicados;
}, id, mudanca, ++carimboDaChegada);

(async () => {
  await amb.subir();
  const pag = await amb.pagina();
  pag.dialogos = [];
  pag.respostaDoDialogo = true;
  pag.removeAllListeners('dialog'); // o ajudante aceita toda pergunta; aqui quem responde é a prova
  pag.on('dialog', async d => {
    pag.dialogos.push(d.message());
    try {
      if (!pag.respostaDoDialogo) await d.dismiss();
      else if (d.type() === 'prompt') await d.accept(pag.textoDoPrompt || d.defaultValue());
      else await d.accept();
    } catch (e) { /* ok */ }
  });
  await RELOGIO.naPagina(pag);
  await H.abrirApp(pag, amb.ORIGEM);
  const serie = await pag.evaluate(async (id, EXCLUI, DIVIDE, OUTRA) => {
    const d = await Store.carregar();
    d.alunos = [{ id: 'f7_alfa', nome: 'Aluna Alfa Teste', ativo: true, precos: [] }];
    d.series = []; d.resumos = [];
    d.aulas = [{ id, alunoId: 'f7_alfa', data: Core.hojeIso(), hora: '10:00', duracaoMin: 60, status: 'realizada',
      cobravel: true, notaTexto: 'Relato de antes', notaPrivada: 'Nota de antes', anexos: [] }];
    [[EXCLUI, '07:00'], [DIVIDE, '08:00'], [OUTRA, '13:00']].forEach(p => d.aulas.push({ id: p[0], alunoId: 'f7_alfa',
      data: Core.hojeIso(), hora: p[1], duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', anexos: [] }));
    Core.criarSerie(d, { alunoId: 'f7_alfa', dias: [Core.diaSemana(Core.hojeIso())], hora: '16:00', duracaoMin: 60, inicio: Core.hojeIso(), fim: null });
    await Store.salvar(d);
    const s = d.series[0];
    return { id: s.id, aula: d.aulas.find(a => a.serieId === s.id && a.data === Core.hojeIso()).id };
  }, AVULSA, EXCLUI, DIVIDE, OUTRA);
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
    await tocarAcaoDoAviso(pag);
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

  const avisoAgora = pag => pag.evaluate(() => ({ texto: document.querySelector('#aviso-texto').textContent,
    acao: (document.querySelector('#aviso-acao') || {}).textContent || '' }));

  if (MODO === MODOS[3] || !MODO) {
    secao('9. (B1) Descartar volta só o que esta janela mudou');
    conf('(arranjo) a aula abriu', (await abrir(pag, AVULSA)).ok, true);
    const abertura9 = await lerAula(pag, AVULSA);
    await escrever(pag, '#campo-nota-texto', 'Relato A desta janela');
    conf('(arranjo) o relato salvou sozinho', (await esperar('relato A', () => lerAula(pag, AVULSA), a => a && a.notaTexto === 'Relato A desta janela', 5000)).ok, true);
    conf('(arranjo) chegou do celular outra nota, outra situação e a cobrança desligada',
      await chegaDaNuvem(pag, AVULSA, { notaPrivada: 'Nota B do celular', status: 'cancelada', cobravel: false }), 1);
    await pausa(900);
    const janela9 = await pag.evaluate(() => ({ nota: document.querySelector('#campo-nota-privada').value,
      status: document.querySelector('#campo-status').value, cobrar: document.querySelector('#campo-cobrar').checked }));
    conf('a janela mostra a nota, a situação e a cobrança que chegaram, coerentes (' + JSON.stringify(janela9) + ')',
      janela9.nota === 'Nota B do celular' && janela9.status === 'cancelada' && janela9.cobrar === false, true);
    const d9 = pag.dialogos.length;
    await pag.click('#descartar-aula');
    conf('a pergunta diz exatamente o que volta e o que fica', pag.dialogos.slice(d9).join(' '),
      'Descartar o relato, a nota e o que ainda não foi gravado nesta aula? O assunto e os arquivos ficam.');
    const depois9 = await esperar('o relato voltou', () => lerAula(pag, AVULSA), a => a && a.notaTexto === abertura9.notaTexto, 5000);
    const fim9 = await lerAula(pag, AVULSA);
    if (MODO === MODOS[3]) {
      conf('VENENO visto: a nota do celular sobreviveu ao Descartar, e quebrou (' + fim9.notaPrivada + ')', fim9.notaPrivada === 'Nota B do celular', false);
      fimDoVeneno();
    }
    conf('o relato desta janela voltou ao de antes', depois9.ok, true);
    conf('a nota, a situação e a cobrança do celular ficaram', fim9.notaPrivada === 'Nota B do celular' && fim9.status === 'cancelada' && fim9.cobravel === false, true);
    conf('o aviso diz o que voltou e o que ficou', (await avisoAgora(pag)).texto,
      'Descartados o relato, a nota e o que ainda não estava gravado. O assunto e os arquivos ficaram.');
  }

  if (MODO === MODOS[4] || !MODO) {
    secao('10. (B2) Falha de gravação e chegada da nuvem: o texto dela fica');
    conf('(arranjo) a aula abriu', (await abrir(pag, AVULSA)).ok, true);
    const antes10 = await lerAula(pag, AVULSA);
    await pag.evaluate(() => { window.__salvarOriginalB2 = Store.salvar; Store.salvar = () => Promise.reject(new Error('falha simulada')); });
    await escrever(pag, '#campo-nota-texto', 'Texto C que o disco recusou');
    await pausa(1500);
    conf('(arranjo) o rodapé diz que não gravou', /Não foi possível gravar/.test(await rodape(pag)), true);
    // a nuvem traz a aula como está no disco: o relato de antes, e a nota mudada no celular
    conf('(arranjo) chegou da nuvem a aula com o relato de antes', await chegaDaNuvem(pag, AVULSA, { notaPrivada: 'Nota E do celular' }), 1);
    await pausa(900);
    const caixa10 = await pag.$eval('#campo-nota-texto', e => e.value);
    if (MODO === MODOS[4]) {
      conf('VENENO visto: o texto dela continua na caixa, e quebrou (' + caixa10 + ')', caixa10 === 'Texto C que o disco recusou', false);
      fimDoVeneno();
    }
    conf('o texto dela continua na caixa', caixa10, 'Texto C que o disco recusou');
    const rod10 = await rodape(pag);
    conf('o rodapé não diz que a janela mostra a versão nova (' + rod10 + ')', /já mostra a versão nova/.test(rod10), false);
    conf('o rascunho dela continua guardado', await pag.evaluate(id => {
      const r = JSON.parse(localStorage.getItem('rascunho-relato-aula:' + id) || 'null');
      return !!r && r.notaTexto === 'Texto C que o disco recusou';
    }, AVULSA), true);
    conf('nada foi gravado por cima do relato de antes', (await lerAula(pag, AVULSA)).notaTexto, antes10.notaTexto);
    await pag.evaluate(() => { Store.salvar = window.__salvarOriginalB2; });
    const d10 = pag.dialogos.length;
    await pag.click('#cancelar-aula');
    await pausa(500);
    conf('fechar pergunta antes de largar o texto dela', /não foi gravado/.test(pag.dialogos.slice(d10).join(' ')) && !(await aberta(pag)), true);
    conf('(arranjo) a aula reabriu', (await abrir(pag, AVULSA)).ok, true);
    const volta10 = await pag.evaluate(() => ({ texto: document.querySelector('#campo-nota-texto').value,
      aviso: (document.querySelector('#aviso-rascunho-relato') || {}).textContent || '' }));
    conf('ao reabrir, o texto dela volta pelo rascunho', volta10.texto === 'Texto C que o disco recusou' && /Rascunho recuperado/.test(volta10.aviso), true);
    await pag.click('#descartar-aula');
    await pausa(800);
  }

  if (!MODO) {
    secao('11. (B3) Excluir e Dividir com mudança pendente');
    conf('(arranjo) a aula a excluir abriu', (await abrir(pag, EXCLUI)).ok, true);
    await escolher(pag, '#campo-status', 'falta');
    await pag.click('#excluir-aula');
    await esperar('a aula saiu', () => lerAula(pag, EXCLUI), a => a === null, 5000);
    await pausa(300);
    const av11 = await avisoAgora(pag);
    conf('o aviso é o da exclusão, com Desfazer, sem falar do que não gravou (' + av11.texto + ')',
      /^Aula excluída/.test(av11.texto) && !/não foi gravada/.test(av11.texto) && /Desfazer/.test(av11.acao), true);
    await tocarAcaoDoAviso(pag);
    await esperar('a exclusão desfeita', () => lerAula(pag, EXCLUI), a => !!a, 5000);
    conf('(arranjo) a aula a dividir abriu', (await abrir(pag, DIVIDE)).ok, true);
    await escolher(pag, '#campo-hora', '08:30');
    await pag.evaluate(() => document.querySelector('#dividir-aula').click());
    await esperar('a aula dividiu', () => lerAula(pag, DIVIDE), a => a && a.duracaoMin === 30, 5000);
    await pausa(300);
    const av11b = await avisoAgora(pag);
    conf('um aviso só, com a divisão, o Desfazer e a frase do que não gravou (' + av11b.texto + ')',
      /^Aula dividida em/.test(av11b.texto) && /não foi gravada/.test(av11b.texto) && /Desfazer/.test(av11b.acao), true);
    conf('o horário pendente não gravou', (await lerAula(pag, DIVIDE)).hora, '08:00');

    secao('12. (B4) O relato não destaca a aula da repetição, e a aula com relato fica fora do "todas"');
    const irmas = await pag.evaluate(sid => Store.carregar().then(d => d.aulas.filter(a => a.serieId === sid && !a.destacada && !(a.notaTexto || '').trim())
      .sort((x, y) => x.data.localeCompare(y.data)).map(a => a.id)), serie.id);
    conf('(arranjo) há três aulas sem relato e não destacadas na repetição', irmas.length >= 3, true);
    conf('(arranjo) a aula da repetição abriu', (await abrir(pag, irmas[0])).ok, true);
    await escrever(pag, '#campo-nota-texto', 'Relato da irmã');
    const r12 = await esperar('o relato salvou', () => lerAula(pag, irmas[0]), a => a && a.notaTexto === 'Relato da irmã', 5000);
    conf('o relato gravou e a aula não ficou destacada', r12.ok && !r12.valor.destacada, true);
    await pag.click('#cancelar-aula');
    await pausa(400);
    const horaDoRelato = (await lerAula(pag, irmas[0])).hora;
    conf('(arranjo) a outra irmã abriu', (await abrir(pag, irmas[1])).ok, true);
    await escolher(pag, '#campo-hora', '15:00');
    await pag.click('#salvar-aula');
    await esperar('pergunta de escopo', () => pag.evaluate(() => document.querySelector('#modal-escopo').classList.contains('aberto')), Boolean, 4000);
    await pag.evaluate(() => Array.from(document.querySelectorAll('.opcao-escopo')).find(o => /Todas as aulas/.test(o.textContent)).click());
    const t12 = await esperar('o todas chegou na irmã sem relato', () => lerAula(pag, irmas[2]), a => a && a.hora === '15:00', 5000);
    conf('o "todas" muda o horário da irmã sem relato', t12.ok, true);
    const comRelato12 = await lerAula(pag, irmas[0]);
    conf('e não toca a aula com relato: nem o horário, nem o relato', comRelato12.hora === horaDoRelato && comRelato12.notaTexto === 'Relato da irmã', true);
  }

  if (MODO === MODOS[5] || !MODO) {
    secao('13. (B5) O Desfazer volta só a aula dele');
    conf('(arranjo) a aula abriu', (await abrir(pag, AVULSA)).ok, true);
    const antes13 = await lerAula(pag, AVULSA);
    await escolher(pag, '#campo-status', antes13.status === 'falta' ? 'reposicao' : 'falta');
    await pag.click('#cancelar-aula');
    await esperar('a situação gravou', () => lerAula(pag, AVULSA), a => a && a.status !== antes13.status, 5000);
    conf('(arranjo) o aviso tem Desfazer', /Desfazer/.test((await avisoAgora(pag)).acao), true);
    conf('(arranjo) a outra aula abriu', (await abrir(pag, OUTRA)).ok, true);
    await escrever(pag, '#campo-nota-texto', 'Relato da outra aula');
    conf('(arranjo) o relato da outra aula salvou', (await esperar('relato outra', () => lerAula(pag, OUTRA), a => a && a.notaTexto === 'Relato da outra aula', 5000)).ok, true);
    await pag.click('#cancelar-aula');
    await pausa(300);
    const av13 = await avisoAgora(pag);
    conf('(arranjo) o aviso ainda é o da aula (' + av13.texto + ')', /^Aula atualizada/.test(av13.texto), true);
    /* O Desfazer de uma aula só é POR AULA (comDesfazerDaAula): o relato
     * gravado depois em outra aula não o encerra, porque ele não volta o banco
     * inteiro. Com o veneno (o Desfazer da aula vira o comDesfazer do banco
     * inteiro), a trava da rodada 6 encerra o Desfazer na gravação do relato:
     * ela perde o Desfazer da aula. Sem a trava, o mesmo veneno apagaria o
     * relato da outra aula. Os dois são o mesmo defeito, e a prova olha os dois. */
    const vivo13 = await pag.evaluate(() => { const b = document.querySelector('#aviso-acao');
      return getComputedStyle(b).display !== 'none' && !!b.onclick && /Desfazer/.test(b.textContent); });
    if (MODO === MODOS[5] && !vivo13) {
      conf('VENENO visto: o Desfazer da aula continua depois do relato da outra, e quebrou', vivo13, false);
      fimDoVeneno();
    }
    conf('o Desfazer da aula continua depois do relato gravado na outra', vivo13, true);
    await tocarAcaoDoAviso(pag);
    await esperar('o Desfazer voltou a situação', () => lerAula(pag, AVULSA), a => a && a.status === antes13.status, 5000);
    const outra13 = await lerAula(pag, OUTRA);
    if (MODO === MODOS[5]) {
      conf('VENENO visto: o relato da outra aula ficou, e quebrou (' + outra13.notaTexto + ')', outra13.notaTexto === 'Relato da outra aula', false);
      fimDoVeneno();
    }
    conf('a situação desta aula voltou', (await lerAula(pag, AVULSA)).status, antes13.status);
    conf('o relato gravado depois na outra aula ficou', outra13.notaTexto, 'Relato da outra aula');
  }

  if (!MODO) {
    secao('14. Aula passada de mês com pagamento fica fora do lote, e o aviso diz quantas');
    // outra aluna, toda quinta desde 01/10, com outubro pago inteiro e novembro em aberto
    const beta = await pag.evaluate(async () => {
      const d = await Store.carregar();
      d.alunos.push({ id: 'f7_beta', nome: 'Aluna Beta Teste', ativo: true, precos: [{ id: 'pb', inicio: '2026-01-01', fim: null, valorHora: 100 }] });
      Core.criarSerie(d, { alunoId: 'f7_beta', dias: [4], hora: '09:00', duracaoMin: 60, inicio: '2026-10-01', fim: null });
      const s = d.series[d.series.length - 1];
      ['2026-10', '2026-11', '2026-12'].forEach(m => Core.materializarSerieNoMes(d, s, m));
      Core.marcarPagamento(d, 'f7_beta', '2026-10', '2026-11-05', Core.valorACobrarDoMes(Core.calcularFechamento(d, 'f7_beta', '2026-10')));
      await Store.salvar(d);
      const dia = iso => d.aulas.find(a => a.serieId === s.id && a.data === iso).id;
      return { serie: s.id, aula: dia('2026-11-19'), outra: dia('2026-11-26') };
    });
    await H.abrirApp(pag, amb.ORIGEM);
    const duracoes = () => pag.evaluate(sid => Store.carregar().then(d => d.aulas.filter(a => a.serieId === sid)
      .sort((x, y) => x.data.localeCompare(y.data)).map(a => a.data.slice(5) + '=' + a.duracaoMin).join(' ')), beta.serie);
    conf('(arranjo) a aula da repetição abriu', (await abrir(pag, beta.aula)).ok, true);
    await escolher(pag, '#campo-duracao', '90');
    await pag.click('#salvar-aula');
    await esperar('pergunta de escopo', () => pag.evaluate(() => document.querySelector('#modal-escopo').classList.contains('aberto')), Boolean, 4000);
    conf('a pergunta do "todas" avisa que as de mês com pagamento ficam de fora', await pag.evaluate(() =>
      /menos as aulas já registradas e as de mês com pagamento/.test(document.querySelector('#modal-escopo').textContent)), true);
    await pag.evaluate(() => Array.from(document.querySelectorAll('.opcao-escopo')).find(o => /Todas as aulas/.test(o.textContent)).click());
    const mudou = await esperar('o todas gravou', () => lerAula(pag, beta.outra), a => a && a.duracaoMin === 90, 5000); // a de 26/11, outra irmã
    conf('(arranjo) o "todas" gravou nas aulas que podia', mudou.ok, true);
    const d14 = await duracoes();
    conf('outubro, pago, ficou com 60; novembro, em aberto, foi a 90 (' + d14 + ')',
      /^10-01=60 10-08=60 10-15=60 10-22=60 10-29=60 11-05=90 11-12=90 11-19=90 11-26=90/.test(d14), true);
    const av14 = (await avisoAgora(pag)).texto;
    conf('o aviso diz quantas ficaram de fora e por quê (' + av14 + ')',
      /^Aulas da repetição alteradas\. 5 aulas de mês com pagamento ficaram como estavam\./.test(av14), true);
    conf('(arranjo) a aula da repetição abriu de novo', (await abrir(pag, beta.aula)).ok, true);
    await pag.click('#excluir-aula');
    await esperar('pergunta de escopo do excluir', () => pag.evaluate(() => document.querySelector('#modal-escopo').classList.contains('aberto')), Boolean, 4000);
    await pag.evaluate(() => Array.from(document.querySelectorAll('.opcao-escopo')).find(o => /Todas as aulas/.test(o.textContent)).click());
    const sobrou = await esperar('o excluir gravou', () => pag.evaluate(sid => Store.carregar().then(d =>
      d.aulas.filter(a => a.serieId === sid).map(a => a.data.slice(5)).sort().join(' ')), beta.serie), v => v && v.indexOf('11-') < 0, 5000);
    conf('no excluir, as cinco de outubro, pago, continuam (' + (sobrou.valor || '') + ')', sobrou.ok && sobrou.valor, '10-01 10-08 10-15 10-22 10-29');
    const av14b = (await avisoAgora(pag)).texto;
    conf('o aviso do excluir diz quantas continuam e por quê (' + av14b + ')',
      /^Aulas da repetição excluídas\. 5 aulas de mês com pagamento continuam na agenda\./.test(av14b), true);
  }

  if (MODO === MODOS[7] || !MODO) {
    secao('15. O Voltar na aula NOVA preenchida pergunta antes de sair');
    /* Estável por condição (teste/f7-secao15-estavel): a janela tira a foto dos
     * campos numa tarefa logo depois de abrir (tirarFotoDaJanela, setTimeout 0),
     * e é contra ela que o Voltar compara. Mudar o campo antes dessa tarefa
     * rodar fazia a foto já sair com a mudança, e o Voltar fechava sem
     * perguntar (no CI, uma vez ou outra). A prova espera a tarefa da página
     * rodar (um quadro e uma tarefa depois de aberta) antes de mudar o campo,
     * e espera o Voltar ser PROCESSADO (a pergunta chegou, ou a janela fechou),
     * com teto largo, antes de afirmar o que aconteceu. */
    const tarefaDaPaginaRodou = () => pag.evaluate(() => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0))));
    const voltarProcessado = async (antes) => (await esperar('o Voltar processado', async () =>
      pag.dialogos.length > antes ? 'perguntou' : (!(await aberta(pag)) ? 'fechou' : ''), v => !!v, 15000)).valor || 'nada';
    pag.respostaDoDialogo = true;
    await H.irParaAba(pag, 'agenda');
    await pag.click('#nova-aula');
    conf('(arranjo) a aula nova abriu', (await esperar('a aula nova abriu', () => aberta(pag), Boolean, 5000)).ok, true);
    await tarefaDaPaginaRodou();
    await escolher(pag, '#campo-hora', '07:30');
    const temRelatoNaNova = await pag.evaluate(() => !!document.querySelector('#campo-nota-texto'));
    if (temRelatoNaNova) await escrever(pag, '#campo-nota-texto', 'Relato da aula nova');
    pag.respostaDoDialogo = false;
    const d15 = pag.dialogos.length;
    await pag.evaluate(() => history.back());
    const desfecho15 = await voltarProcessado(d15);
    if (MODO === MODOS[7]) {
      conf('VENENO visto: o Voltar na aula nova perguntou, e quebrou (' + desfecho15 + ')', desfecho15, 'fechou');
      fimDoVeneno();
    }
    conf('o Voltar foi processado e perguntou (' + desfecho15 + ')', desfecho15, 'perguntou');
    conf('a pergunta é "Sair sem guardar o que você escreveu?"', pag.dialogos.slice(d15).join(' | '), 'Sair sem guardar o que você escreveu?');
    conf('com o "não", a aula nova continua aberta', await aberta(pag), true);
    pag.respostaDoDialogo = true;
    const d15b = pag.dialogos.length;
    await pag.evaluate(() => history.back());
    const desfecho15b = await voltarProcessado(d15b);
    if (desfecho15b === 'perguntou') await esperar('com o sim, fecha', async () => !(await aberta(pag)), Boolean, 15000);
    conf('com o "sim", a aula nova fecha sem gravar nada (' + desfecho15b + ')', desfecho15b === 'perguntou' && !(await aberta(pag)) &&
      !(await pag.evaluate(() => Store.carregar().then(d => d.aulas.some(a => a.hora === '07:30')))), true);
  }

  if (!MODO) {
    secao('16. Uma gravação depois de um lote encerra o Desfazer do lote');
    pag.respostaDoDialogo = true;
    conf('(arranjo) a aula da repetição abriu', (await abrir(pag, serie.aula)).ok, true);
    await escolher(pag, '#campo-hora', '14:00');
    await pag.click('#salvar-aula');
    await esperar('pergunta de escopo', () => pag.evaluate(() => document.querySelector('#modal-escopo').classList.contains('aberto')), Boolean, 4000);
    await pag.evaluate(() => Array.from(document.querySelectorAll('.opcao-escopo')).find(o => /Todas as aulas/.test(o.textContent)).click());
    await esperar('o lote gravou', () => lerAula(pag, serie.aula), a => a && a.hora === '14:00', 5000);
    const lote16 = await avisoAgora(pag);
    conf('(arranjo) o lote oferece Desfazer (' + lote16.texto + ')', /Desfazer/.test(lote16.acao), true);
    conf('(arranjo) a outra aula abriu', (await abrir(pag, OUTRA)).ok, true);
    await escrever(pag, '#campo-nota-texto', 'Relato gravado depois do lote');
    conf('(arranjo) o relato da outra aula salvou', (await esperar('relato depois do lote', () => lerAula(pag, OUTRA), a => a && a.notaTexto === 'Relato gravado depois do lote', 5000)).ok, true);
    const botao16 = await pag.evaluate(() => { const b = document.querySelector('#aviso-acao'); return { visivel: getComputedStyle(b).display !== 'none', texto: b.textContent }; });
    conf('depois do "Salvo", o Desfazer do lote some (' + JSON.stringify(botao16) + ')', botao16.visivel && /Desfazer/.test(botao16.texto), false);
    await pag.click('#cancelar-aula');
    await pausa(400);
    conf('o relato gravado depois do lote continua', (await lerAula(pag, OUTRA)).notaTexto, 'Relato gravado depois do lote');
    conf('e o lote continua aplicado', (await lerAula(pag, serie.aula)).hora, '14:00');

    secao('17. A pergunta de escopo aberta enquanto chega uma mudança: nada grava por cima');
    conf('(arranjo) a aula da repetição abriu', (await abrir(pag, serie.aula)).ok, true);
    await escolher(pag, '#campo-hora', '15:30');
    await pag.click('#salvar-aula');
    await esperar('pergunta de escopo', () => pag.evaluate(() => document.querySelector('#modal-escopo').classList.contains('aberto')), Boolean, 4000);
    conf('(arranjo) chegou da nuvem outro horário com a pergunta aberta', await chegaDaNuvem(pag, serie.aula, { hora: '19:00' }), 1);
    await pausa(900);
    await pag.evaluate(() => Array.from(document.querySelectorAll('.opcao-escopo')).find(o => /Todas as aulas/.test(o.textContent)).click());
    await pausa(800);
    conf('o horário que chegou não foi coberto', (await lerAula(pag, serie.aula)).hora, '19:00');
    const av17 = (await avisoAgora(pag)).texto;
    conf('o aviso diz que nada foi gravado por cima (' + av17 + ')', /mudou em outro aparelho enquanto você escolhia/.test(av17), true);
    conf('o rodapé mostra o conflito', /mudou em outro aparelho/.test(await rodape(pag)), true);
    pag.respostaDoDialogo = true;
    await pag.click('#cancelar-aula');
    await pausa(400);

    secao('18. O fecharTudo do Desfazer não grava: o relato pendente fica no rascunho');
    conf('(arranjo) a aula a excluir abriu', (await abrir(pag, EXCLUI)).ok, true);
    await pag.click('#excluir-aula');
    await esperar('a aula saiu', () => lerAula(pag, EXCLUI), a => a === null, 5000);
    conf('(arranjo) a outra aula abriu', (await abrir(pag, OUTRA)).ok, true);
    const antes18 = (await lerAula(pag, OUTRA)).notaTexto;
    await escrever(pag, '#campo-nota-texto', 'Relato que o Desfazer não pode gravar');
    // antes da pausa do salvar sozinho: o Desfazer da exclusão, que fecha tudo
    await pag.evaluate(() => document.querySelector('#aviso-acao').click());
    await esperar('a exclusão desfeita', () => lerAula(pag, EXCLUI), a => !!a, 5000);
    await pausa(1200);
    conf('a janela fechou', await aberta(pag), false);
    conf('o relato pendente NÃO foi gravado pelo fecharTudo', (await lerAula(pag, OUTRA)).notaTexto, antes18);
    conf('ele ficou no rascunho do aparelho', await pag.evaluate(id => {
      const r = JSON.parse(localStorage.getItem('rascunho-relato-aula:' + id) || 'null');
      return !!r && r.notaTexto === 'Relato que o Desfazer não pode gravar';
    }, OUTRA), true);
  }

  if (!MODO) {
    secao('19. O Encerrar da ficha do aluno também poupa a aula já registrada');
    pag.respostaDoDialogo = true;
    const antes19 = await pag.evaluate(sid => Store.carregar().then(d => {
      const hoje = Core.hojeIso();
      const da = d.aulas.filter(a => a.serieId === sid && a.data >= hoje && !a.destacada);
      return { registradas: da.filter(a => Core.temConteudo(a)).map(a => a.id), vazias: da.filter(a => !Core.temConteudo(a)).map(a => a.id) };
    }), serie.id);
    conf('(arranjo) há aula registrada e aula vazia da repetição de hoje em diante', antes19.registradas.length > 0 && antes19.vazias.length > 0, true);
    await H.irParaAba(pag, 'alunos');
    await pag.evaluate(() => document.querySelector('#lista-alunos .item-lista[data-aluno="f7_alfa"]').click());
    await esperar('a ficha abriu', () => pag.evaluate(() => document.querySelector('#modal-aluno').classList.contains('aberto')), Boolean, 5000);
    pag.textoDoPrompt = await pag.evaluate(() => Core.ddmmaaaa(Core.hojeIso()));
    const d19 = pag.dialogos.length;
    const tocou = await pag.evaluate(() => {
      const b = Array.from(document.querySelectorAll('#modal-aluno button')).find(x => x.textContent.trim() === 'Encerrar');
      if (b) b.click();
      return !!b;
    });
    conf('(arranjo) o Encerrar existe na ficha', tocou, true);
    const depois19 = await esperar('o Encerrar gravou', () => pag.evaluate(ids => Store.carregar().then(d => ids.filter(id => d.aulas.some(a => a.id === id)).length), antes19.vazias), n => n === 0, 5000);
    pag.textoDoPrompt = null;
    conf('(arranjo) o Encerrar perguntou a data', pag.dialogos.length > d19, true);
    conf('as vazias de hoje em diante saíram', depois19.ok, true);
    const ficaram19 = await pag.evaluate(ids => Store.carregar().then(d => ids.filter(id => d.aulas.some(a => a.id === id)).length), antes19.registradas);
    conf('as já registradas ficaram (' + ficaram19 + ' de ' + antes19.registradas.length + ')', ficaram19, antes19.registradas.length);
    const av19 = (await avisoAgora(pag)).texto;
    const n19 = antes19.registradas.length;
    conf('o aviso diz quantas continuam e por quê (' + av19 + ')', av19.indexOf('Repetição encerrada. ' + (n19 === 1 ? '1 aula já registrada continua na agenda.' : n19 + ' aulas já registradas continuam na agenda.')) === 0, true);
  }

  if (MODO === MODOS[6] || !MODO) {
    secao('20. O Desfazer do passo da trilha não apaga o relato salvo depois');
    pag.respostaDoDialogo = true;
    await pag.evaluate(async aulaId => {
      const d = await Store.carregar();
      const al = d.alunos.find(a => a.id === 'f7_alfa');
      al.trilhas = [Core.criarTrilha({ alunoId: al.id, titulo: 'Trilha Teste', alvoId: 'MAT07-10', materia: 'matematica',
        passos: [{ temaId: 'MAT07-10', titulo: 'Equações do 1º grau', serie: '07', modulo: '7ano:equacoes', duracaoMin: 60 }] })];
      al.trilhas[0].passos[0].feitoEm = Core.hojeIso();
      al.trilhas[0].passos[0].aulaId = aulaId;
      await Store.salvar(d);
    }, AVULSA);
    await H.abrirApp(pag, amb.ORIGEM);
    await H.irParaAba(pag, 'alunos');
    await pag.evaluate(() => document.querySelector('#lista-alunos .item-lista[data-aluno="f7_alfa"]').click());
    await pag.evaluate(() => { const b = Array.from(document.querySelectorAll('#modal-aluno .aba-perfil')).find(x => x.textContent.trim() === 'Mapeamento'); if (b) b.click(); });
    const passo = await esperar('o passo marcado no painel', () => pag.evaluate(() => {
      const c = document.querySelector('#painel-trilhas .marca-passo'); return !!c && c.checked; }), Boolean, 8000);
    conf('(arranjo) o passo marcado aparece no painel da ficha', passo.ok, true);
    await pag.evaluate(() => { const c = document.querySelector('#painel-trilhas .marca-passo'); c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); });
    const desmarcou = await esperar('o passo voltou para a fila', () => pag.evaluate(() => Store.carregar().then(d =>
      !d.alunos.find(a => a.id === 'f7_alfa').trilhas[0].passos[0].feitoEm)), Boolean, 5000);
    conf('(arranjo) desmarcar o passo gravou, com Desfazer (' + (await avisoAgora(pag)).texto + ')', desmarcou.ok && /Desfazer/.test((await avisoAgora(pag)).acao), true);
    await pag.evaluate(() => { const b = document.querySelector('#modal-aluno [data-fechar]'); if (b) b.click(); });
    await esperar('a ficha fechou', () => pag.evaluate(() => !document.querySelector('#modal-aluno').classList.contains('aberto')), Boolean, 5000);
    conf('(arranjo) a aula abriu', (await abrir(pag, AVULSA)).ok, true);
    await escrever(pag, '#campo-nota-texto', 'Relato escrito depois do passo');
    conf('(arranjo) o relato salvou ("Salvo")', (await esperar('relato depois do passo', () => lerAula(pag, AVULSA), a => a && a.notaTexto === 'Relato escrito depois do passo', 5000)).ok, true);
    const botao20 = await pag.evaluate(() => { const b = document.querySelector('#aviso-acao'); return { vivo: getComputedStyle(b).display !== 'none' && !!b.onclick }; });
    // o toque no Desfazer do passo, mesmo que o aviso já tenha recolhido
    await pag.evaluate(() => { const b = document.querySelector('#aviso-acao'); if (b.onclick) b.onclick(); });
    await pausa(1200);
    const relato20 = (await lerAula(pag, AVULSA)) ? (await lerAula(pag, AVULSA)).notaTexto : '(aula sumiu)';
    if (MODO === MODOS[6]) {
      conf('VENENO visto: o relato continua depois do Desfazer do passo, e quebrou (' + relato20 + ')', relato20 === 'Relato escrito depois do passo', false);
      fimDoVeneno();
    }
    conf('depois do "Salvo", o Desfazer do passo some', botao20.vivo, false);
    conf('o relato salvo depois do passo continua gravado (' + relato20 + ')', relato20, 'Relato escrito depois do passo');
    if (await aberta(pag)) { await pag.click('#cancelar-aula'); await pausa(400); }
  }

  conf('não houve erro de página', (pag.errosDePagina || []).join(' | '), '');
  await H.fim(amb)();
})().catch(e => H.fim(amb)(e));
