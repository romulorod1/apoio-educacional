/* testa_dominio_troca_aula.js
 *
 * F10 (#202), conserto das lentes:
 * 1. Um redesenho atrasado de OUTRA aula não toma o domínio ativo. Ela abre a
 *    aula A, cujo assunto espera o índice; troca para a aula B; o índice chega
 *    e a lista de A se redesenharia (estava fora da tela). Ela toca "Domina"
 *    em B: grava, e a tela de B mostra o marcado.
 * 2. Chega um registro da nuvem com a aula aberta (rebasearAulaAberta troca o
 *    registro dela): ela marca "Domina" depois, e a marca fica no banco.
 * Venenos, cada um tem de cair:
 *   --envenenado-sequestro      as duas guardas voltam (o redesenho de A olha só o
 *                               parentNode, e qualquer aula toma o domínio ativo);
 *   --envenenado-rebase-velho   o rebase não redesenha a lista de assuntos.
 * Dados fictícios.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador');
const RELOGIO = H.relogioDaRodada('2026-11-16', '11:00');
const { conf, secao, esperar, pausa } = H;

const MODOS = ['--envenenado-sequestro', '--envenenado-rebase-velho'];
const MODO = MODOS.filter(m => process.argv.indexOf(m) >= 0)[0] || '';
const GUARDA_AULA = '    if (aulaEmEdicao && aulaEmEdicao.id === aula.id) {\n      blocoDominioAtivo = { aulaId: aula.id, desenhar: function () {';
const GUARDA_TELA = '        if (caixa.isConnected) desenharTemasDaAula(caixa, aula, aluno); // só a lista que está na tela';
const REBASE = "    if ($('#lista-temas-aula') && $('#lista-temas-aula').isConnected) {\n      desenharTemasDaAula($('#lista-temas-aula'), novo, alunoPorId(novo.alunoId));\n    }";
const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
conf('(arranjo) as âncoras dos venenos estão no app.js', [GUARDA_AULA, GUARDA_TELA, REBASE].map(a => APP.split(a).length).join(','), '2,4,2');
const trocas = {};
if (MODO === MODOS[0]) {
  trocas['/app.js'] = APP.replace(GUARDA_AULA, '    if (true) {\n      blocoDominioAtivo = { aulaId: aula.id, desenhar: function () {')
    .split(GUARDA_TELA).join('        if (caixa.parentNode) desenharTemasDaAula(caixa, aula, aluno);');
}
if (MODO === MODOS[1]) trocas['/app.js'] = APP.replace(REBASE, '');
if (MODO) conf('(veneno) o app.js servido mudou', trocas['/app.js'] !== APP, true);
const amb = H.criarAmbiente(8894, 'nath_f10_troca_aula', trocas);
function fimDoVeneno() { throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true }); }

const lerAula = (pag, id) => pag.evaluate(id => Store.carregar().then(d => {
  const a = d.aulas.find(x => x.id === id); return a ? JSON.parse(JSON.stringify(a)) : null;
}), id);
const aberta = pag => pag.evaluate(() => document.querySelector('#modal-aula').classList.contains('aberto'));
async function abrir(pag, id) {
  await H.irParaAba(pag, 'agenda');
  await pag.evaluate(id => document.querySelector('[data-aula-id="' + id + '"]').click(), id);
  return esperar('aula aberta', () => pag.evaluate(() => document.querySelector('#modal-aula').classList.contains('aberto') &&
    !!document.querySelector('#lista-temas-aula .item-assunto-aula')), Boolean, 8000);
}
async function fechar(pag) {
  await pag.evaluate(() => document.querySelector('#cancelar-aula').click());
  return esperar('a aula fechou', async () => !(await aberta(pag)), Boolean, 8000);
}
const ativoNaTela = (pag, temaId) => pag.evaluate(t => {
  const l = document.querySelector('#lista-temas-aula .item-assunto-aula[data-tema-id="' + t + '"]');
  const b = l && l.querySelector('.opcao-dominio.ativa'); return b ? b.dataset.estado : '';
}, temaId);
const tocar = (pag, temaId, estado) => pag.evaluate((t, e) => {
  document.querySelector('#lista-temas-aula .item-assunto-aula[data-tema-id="' + t + '"] .opcao-dominio[data-estado="' + e + '"]').click();
}, temaId, estado);

(async () => {
  await amb.subir();
  const pag = await amb.pagina();
  pag.on('dialog', d => d.accept().catch(() => {}));
  /* O índice de assuntos da matemática fica SEGURO na página até a prova soltar:
   * é o "índice pendente" do cenário. */
  await pag.evaluateOnNewDocument(() => {
    const original = window.fetch.bind(window);
    window.__esperandoIndice = [];
    window.__segurarIndice = true;
    window.fetch = (u, o) => {
      if (window.__segurarIndice && String(u).indexOf('banco/topicos/matematica.json') >= 0) {
        return new Promise(r => window.__esperandoIndice.push(() => r(original(u, o))));
      }
      return original(u, o);
    };
    window.__soltarIndice = () => { window.__segurarIndice = false; window.__esperandoIndice.splice(0).forEach(f => f()); };
  });
  await RELOGIO.naPagina(pag);
  await H.abrirApp(pag, amb.ORIGEM);
  await pag.evaluate(async () => {
    const d = await Store.carregar();
    const hoje = Core.hojeIso();
    d.alunos = [{ id: 'f10_alfa', nome: 'Aluna Alfa Teste', ativo: true, precos: [] }];
    d.series = []; d.resumos = [];
    const base = { alunoId: 'f10_alfa', data: hoje, duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', anexos: [] };
    d.aulas = [
      // A: o assunto sem material espera o índice de assuntos
      Object.assign({}, base, { id: 'f10_A', hora: '08:00', temas: [{ id: 'MAT07-10', titulo: 'Equações do 1º grau', fonte: 'banco', disciplina: 'matematica' }] }),
      // B e C: o assunto com material não espera índice nenhum
      Object.assign({}, base, { id: 'f10_B', hora: '09:00', temas: [{ id: 'tB', titulo: 'Assunto B Teste', anexoId: 'anxB', disciplina: 'matematica' }] }),
      Object.assign({}, base, { id: 'f10_C', hora: '10:00', temas: [{ id: 'tC', titulo: 'Assunto C Teste', anexoId: 'anxC', disciplina: 'matematica' }] })
    ];
    await Store.salvar(d);
  });
  await H.abrirApp(pag, amb.ORIGEM);

  if (MODO === MODOS[0] || !MODO) {
    secao('1. O redesenho atrasado de outra aula não toma o domínio ativo');
    conf('(arranjo) a aula A abriu, com o índice ainda pendente', (await abrir(pag, 'f10_A')).ok &&
      (await pag.evaluate(() => window.__esperandoIndice.length)) > 0, true);
    conf('(arranjo) a aula A fechou', (await fechar(pag)).ok, true);
    conf('(arranjo) a aula B abriu', (await abrir(pag, 'f10_B')).ok, true);
    await pag.evaluate(() => window.__soltarIndice());
    await esperar('o índice chegou', () => pag.evaluate(() => !window.__segurarIndice && !window.__esperandoIndice.length), Boolean, 5000);
    await pausa(800); // o redesenho de A, que vinha atrás do índice, já rodou
    await tocar(pag, 'tB', 'domina');
    const gravou = await esperar('o Domina de B gravou', () => lerAula(pag, 'f10_B'), a => a && a.temas[0].dominio === 'domina', 5000);
    conf('o Domina de B grava no assunto de B', gravou.ok, true);
    const tela = await esperar('a tela de B mostra', () => ativoNaTela(pag, 'tB'), v => v === 'domina', 3000);
    if (MODO === MODOS[0]) {
      conf('VENENO visto: a tela de B mostra o Domina marcado, e quebrou (' + tela.valor + ')', tela.valor, 'domina');
      fimDoVeneno();
    }
    conf('a tela de B mostra o Domina marcado', tela.valor, 'domina');
    conf('a aula A não ganhou marca', ((await lerAula(pag, 'f10_A')).temas[0].dominio || ''), '');
    await fechar(pag);
  }

  if (MODO === MODOS[1] || !MODO) {
    secao('2. Depois de chegar um registro da nuvem, a marca fica no banco');
    await pag.evaluate(() => window.__soltarIndice && window.__soltarIndice());
    conf('(arranjo) a aula C abriu', (await abrir(pag, 'f10_C')).ok, true);
    const chegou = await pag.evaluate(async () => {
      const carimbo = '2099-01-01T00:00:00.000000Z';
      await new Promise((resolve, reject) => {
        const req = indexedDB.open('apoio-educacional');
        req.onsuccess = () => { const b = req.result; const t = b.transaction('saida', 'readwrite'); t.objectStore('saida').clear();
          t.oncomplete = () => { b.close(); resolve(); }; t.onerror = () => { b.close(); reject(t.error); }; };
        req.onerror = () => reject(req.error);
      });
      const local = (await Store.lerRegistros()).find(r => r.id === 'aula:f10_C');
      const dados = Object.assign({}, local.dados, { notaPrivada: 'Nota que chegou do celular' });
      const contas = await Store.aplicarRecebidos([{ id: local.id, tipo: 'aula', atualizadoEm: carimbo.slice(0, 23) + 'Z', apagadoEm: null,
        aparelho: 'ap000000000001', esquema: 1, servidorEm: carimbo, updateTime: carimbo, dados }]);
      return contas.aplicados;
    });
    conf('(arranjo) chegou da nuvem um registro da aula aberta', chegou, 1);
    await esperar('a janela viu a chegada', () => pag.evaluate(() => document.querySelector('#campo-nota-privada') &&
      document.querySelector('#campo-nota-privada').value === 'Nota que chegou do celular'), Boolean, 5000);
    await tocar(pag, 'tC', 'domina');
    const gravouC = await esperar('o Domina de C gravou', () => lerAula(pag, 'f10_C'), a => a && a.temas[0].dominio === 'domina', 5000);
    if (MODO === MODOS[1]) {
      conf('VENENO visto: a marca feita depois da chegada ficou no banco, e quebrou', gravouC.ok, false);
      fimDoVeneno();
    }
    conf('a marca feita depois da chegada fica no banco', gravouC.ok, true);
    conf('e a nota que chegou também', (await lerAula(pag, 'f10_C')).notaPrivada, 'Nota que chegou do celular');
  }

  conf('não houve erro de página', (pag.errosDePagina || []).join(' | '), '');
  await H.fim(amb)();
})().catch(e => H.fim(amb)(e));
