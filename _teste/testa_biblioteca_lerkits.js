/* testa_biblioteca_lerkits.js
 *
 * O que entra do kits.json na tela dela, e o que é recusado (B10, lente de
 * correção do PR #57).
 *
 * O que prova, no aplicativo servido do repositório, com o pacote SINTÉTICO:
 *   1. pacote SEM kits.json importa, o assunto abre, e não aparece bloco de
 *      listas prontas nenhum (o arquivo é aditivo);
 *   2. cada ramo de recusa do `lerKits`, um pacote para cada, e cada um
 *      recusado com a SUA frase: regra que o aplicativo não conhece, lista sem
 *      minutos, posição sem minutos, id de lista repetido, exercício repetido
 *      dentro de uma lista. Nada é gravado em nenhum deles;
 *   3. lista que cita um exercício que saiu por curadoria: o pacote importa, a
 *      aba Biblioteca abre, a lista com buraco NÃO aparece e a outra lista do
 *      mesmo assunto aparece. Sem o guarda do app.js que descarta a lista com
 *      buraco, a aba inteira não abre.
 *
 * Modo envenenado:
 *   node _teste/testa_biblioteca_lerkits.js --envenenado-guarda
 *     o app.js servido perde o guarda, e a parte 3 tem de ver a aba quebrar.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8811;
const VENENO = process.argv.indexOf('--envenenado-guarda') !== -1;
const V_EMPATE = process.argv.indexOf('--envenenado-empate') !== -1;
const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const GUARDA = '        if (itens.some(function (it) { return !it; })) return;';
// o empate deixa de ser visto, e as duas listas voltam a se chamar igual
const EMPATE = '    var empate = irmas.some(function (o) { return o.id !== lp.id && desafiosDe(o) === n; });';
const trocas = {};
if (VENENO) trocas['/app.js'] = APP.split(GUARDA).join('');
if (V_EMPATE) trocas['/app.js'] = APP.split(EMPATE).join('    var empate = false;');
const amb = H.criarAmbiente(PORTA, 'perfil_bib_lerkits', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'b10_lerkits_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

let versao = 1;
function zip(nome, opcoes) {
  const p = path.join(TMP, nome + '.zip');
  Sintetico.gerar(p, Object.assign({ versao: versao++ }, opcoes));
  return p;
}
async function importar(pag, arquivo) {
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => { const c = document.querySelector('#estado-importacao-biblioteca'); if (c) c.innerHTML = ''; });
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar('importação', () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca'); return c ? c.innerText.trim() : '';
  }), v => /^Biblioteca importada\.|não foi importado/.test(v || ''), 90000);
  return r.valor || '';
}
const itensGravados = pag => H.contarDeposito(pag, 'biblioteca_itens');
const tocarLinha = (pag, t) => pag.evaluate(nome => {
  const l = Array.from(document.querySelectorAll('#bib-corpo .item-lista'))
    .find(x => { const n = x.querySelector('.nome'); return n && n.textContent.trim() === nome; });
  if (!l) return false; l.click(); return true;
}, t);
const linhasDeLista = pag => pag.evaluate(() =>
  Array.from(document.querySelectorAll('#bib-corpo [data-lista-pronta]')).map(l => l.getAttribute('data-lista-pronta')));

(async () => {
  if (VENENO) {
    secao('O veneno é de verdade');
    conf('o guarda casa exatamente uma vez no app.js', APP.split(GUARDA).length - 1, 1);
  } else {
    conf('o guarda do app.js existe (a âncora do veneno)', APP.split(GUARDA).length - 1, 1);
  }
  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);

  if (V_EMPATE || !VENENO) {
    /* 0. O EMPATE DE NOMES (achado no 8º ano, Potenciação: 6 e 6 desafios).
     *   Arranjo:   as duas listas de um assunto com o mesmo número de desafios.
     *   Afirmação: os dois nomes são diferentes, e dizem quantos exercícios. */
    secao('0. Duas listas com o mesmo número de desafios');
    conf('a âncora do veneno do empate casa uma vez', APP.split(EMPATE).length - 1, 1);
    const m0 = await importar(pag, zip('empate', { listas: true, listasVeneno: 'empate' }));
    conf('importou', /^Biblioteca importada\./.test(m0), true);
    await H.irParaAba(pag, 'biblioteca');
    await pausa(500);
    await pag.evaluate(() => { for (let k = 0; k < 4; k++) { const b = document.querySelector('.bib-voltar'); if (!b) break; b.click(); } });
    await pausa(300);
    conf('o assunto abre', await tocarLinha(pag, 'Equações do Segundo Grau'), true);
    await pausa(400);
    const nomes = await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-corpo [data-lista-pronta] .nome')).map(n => n.textContent.trim()));
    console.log('   nomes: ' + JSON.stringify(nomes));
    if (V_EMPATE) {
      conf('VENENO ENXERGADO: as duas listas se chamam igual', nomes.length === 2 && nomes[0] === nomes[1], true);
      return;
    }
    conf('as duas têm nomes diferentes, com o número de exercícios', nomes.join(' | '),
      'Lista com 5 exercícios e 1 desafio | Lista com 4 exercícios e 1 desafio');
  }
  if (!VENENO) {
    secao('1. Pacote sem kits.json');
    const msg = await importar(pag, zip('sem-kits', {}));
    conf('importou', /^Biblioteca importada\./.test(msg), true);
    await H.irParaAba(pag, 'biblioteca');
    await pausa(500);
    await pag.evaluate(() => { for (let k = 0; k < 4; k++) { const b = document.querySelector('.bib-voltar'); if (!b) break; b.click(); } });
    await pausa(300);
    conf('o assunto abre', await tocarLinha(pag, 'Equações do Segundo Grau'), true);
    await pausa(400);
    conf('e não aparece bloco de listas prontas', (await linhasDeLista(pag)).length, 0);
    conf('e a tela do assunto está de pé', await pag.evaluate(() => !!document.querySelector('#bib-corpo .bib-titulo, #bib-corpo h3')), true);

    secao('2. Cada ramo de recusa do lerKits');
    const antes = await itensGravados(pag);
    const casos = [
      ['regra', /regra que este aplicativo não conhece \(listas-v9\)/],
      ['sem-minutos', /não diz quantos minutos leva\./],
      ['degrau-sem-minutos', /não diz quantos minutos leva a posição 3\./],
      ['id-repetido', /duas listas com o mesmo identificador/],
      ['item-repetido', /repete o exercício/],
      ['teoria', /traz teoria, e este aplicativo só mostra lista de exercícios/]
    ];
    for (const [v, frase] of casos) {
      const m = await importar(pag, zip('veneno-' + v, { listas: true, listasVeneno: v }));
      console.log('   ' + v + ': ' + m.replace(/\n/g, ' | ').slice(0, 220));
      conf(v + ': recusado', /não foi importado/.test(m), true);
      conf(v + ': pela frase dele', frase.test(m), true);
    }
    conf('e nenhum dos recusados gravou exercício', await itensGravados(pag), antes);
  }

  secao('3. Lista que cita exercício que saiu por curadoria');
  const m3 = await importar(pag, zip('com-excluido', { listas: true, listasVeneno: 'excluido' }));
  conf('o pacote importa', /^Biblioteca importada\./.test(m3), true);
  await H.irParaAba(pag, 'biblioteca');
  await pausa(700);
  // volta para a lista de assuntos, se a navegação ficou dentro de um
  await pag.evaluate(() => { for (let k = 0; k < 4; k++) { const b = document.querySelector('.bib-voltar'); if (!b) break; b.click(); } });
  await pausa(400);
  const abriu = await pag.evaluate(() => {
    const t = document.querySelector('#bib-corpo');
    return !!t && t.innerText.length > 0 && !!document.querySelector('#bib-corpo .item-lista');
  });
  if (VENENO) {
    conf('VENENO ENXERGADO: sem o guarda, a aba Biblioteca não abre', abriu && pag.errosDePagina.length === 0, false);
    return;
  }
  conf('a aba Biblioteca abre', abriu, true);
  conf('o assunto abre', await tocarLinha(pag, 'Equações do Segundo Grau'), true);
  await pausa(400);
  const linhas = await linhasDeLista(pag);
  console.log('   listas prontas do assunto: ' + JSON.stringify(linhas));
  const ids = Sintetico.LISTAS.filter(l => l.modulo === Sintetico.LISTAS[0].modulo).map(l => l.id);
  conf('a lista com o exercício que saiu NÃO aparece', linhas.indexOf(ids[0]) < 0, true);
  conf('e a outra lista do mesmo assunto aparece', linhas.indexOf(ids[1]) >= 0, true);
  conf('nenhum erro de JavaScript na página', pag.errosDePagina.length ? pag.errosDePagina.join(' | ') : 0, 0);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
