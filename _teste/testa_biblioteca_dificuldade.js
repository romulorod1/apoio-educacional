/* testa_biblioteca_dificuldade.js
 *
 * A dificuldade à vista na lista de exercícios (PR E da B5), no Chrome, com o
 * pacote SINTÉTICO do 9º ano e dois exercícios de "Soma e Produto" marcados
 * como curados (opção curadoria do _pacote_sintetico.js). O pacote real do
 * Drive nunca entra aqui.
 *
 * Em "Soma e Produto" (8 exercícios) a dificuldade estimada pela posição é
 * 1, 1, 1, 2, 2, 2, 3, 3; o 2 vem curado como Difícil e o 8 como Fácil.
 *
 * O que prova:
 *   1. o cartão diz de onde veio a dificuldade: "estimada: fácil" ou
 *      "curada: difícil", sem cor, e a etiqueta dela ("Para mim") é a única
 *      colorida quando marcada: as duas não se confundem;
 *   2. o filtro Fácil, Médio, Difícil mostra 1, 3 e 8; 4, 5 e 6; 2 e 7;
 *      "Todas" volta os 8;
 *   3. a etiqueta dela vale no filtro: Difícil no exercício 1 tira ele do Fácil
 *      e põe no Difícil; tirar a etiqueta devolve;
 *   4. o filtro "Ainda não usei com" e o de dificuldade juntos: a célula só
 *      aparece quando nenhum dos dois a tira;
 *   5. recarregado o aplicativo, a etiqueta continua valendo no filtro;
 *   6. Ajustes, "Exportar minhas etiquetas de dificuldade": sem etiqueta, avisa
 *      e não gera arquivo; com etiquetas, o CSV sai no formato da curadoria
 *      (id;dificuldade;quem;data;observacao, LF, sem BOM, ordenado, só 1 a 3),
 *      e a etiqueta tirada não entra;
 *   7. nenhum erro de JavaScript.
 *
 * Modo envenenado:
 *   node _teste/testa_biblioteca_dificuldade.js --envenenado-etiqueta
 *     o app.js servido ignora a etiqueta dela no filtro (só a do pacote vale),
 *     e o teste tem de ENXERGAR isso.
 *
 *   SALVAR_PRINTS=<pasta> guarda os prints do Marco B5.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8795;
const VENENO = process.argv.indexOf('--envenenado-etiqueta') !== -1;
const SALVAR = process.env.SALVAR_PRINTS || '';
const APP_REPO = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const LINHA_EFETIVA = 'return (bibEtiquetas && bibEtiquetas[it.id]) || it.dificuldade || null;';
const trocas = {};
if (VENENO) trocas['/app.js'] = APP_REPO.split(LINHA_EFETIVA).join('return it.dificuldade || null;');

const SP = '9ano:equacoes-do-segundo-grau:soma-e-produto:ex:';
const CURADORIA = {};
CURADORIA[SP + 2] = 3;
CURADORIA[SP + 8] = 1;

const amb = H.criarAmbiente(PORTA, 'perfil_bib_dificuldade', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'bib_dificuldade_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

async function importar(pag, arquivo) {
  await H.irParaAba(pag, 'ajustes');
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar('importação', () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca'); return c ? c.innerText.trim() : '';
  }), v => /^Biblioteca importada\.|não foi importado/.test(v || ''), 60000);
  return r.valor || '';
}
async function tocarLinha(pag, nome) {
  const ok = await pag.evaluate(n => {
    const l = Array.from(document.querySelectorAll('#bib-corpo .item-lista')).find(x => x.querySelector('.nome').textContent.trim() === n);
    if (!l) return false; l.click(); return true;
  }, nome);
  if (!ok) throw Object.assign(new Error('não achei a linha ' + nome), { jaContado: false });
  await pausa(150);
}
async function abrirSomaEProduto(pag) {
  await H.irParaAba(pag, 'biblioteca');
  for (let k = 0; k < 4; k++) {
    const v = await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); return !!b; });
    if (!v) break;
    await pausa(150);
  }
  await esperar('módulos na tela', () => pag.evaluate(() => Array.from(document.querySelectorAll('#bib-corpo .item-lista .nome'))
    .some(x => x.textContent.trim() === 'Equações do Segundo Grau')), v => v === true, 8000);
  await tocarLinha(pag, 'Equações do Segundo Grau');
  await tocarLinha(pag, 'Soma e Produto');
  await esperar('lista Soma e Produto', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .bib-etiqueta').length), v => v === 8, 8000);
  // as etiquetas gravadas chegam depois do primeiro desenho
  await pausa(300);
}
// os números dos exercícios visíveis, na ordem da lista
const visiveis = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#bib-corpo .bib-celula'))
  .filter(c => !c.hidden).map(c => c.querySelector('.bib-cartao').getAttribute('data-id').split(':').pop()).join(','));
const filtrar = (pag, d) => pag.evaluate(dd => {
  const b = document.querySelector('#bib-filtro-dif .chip-filtro[data-dificuldade="' + dd + '"]'); if (b) b.click(); return !!b;
}, d === null ? '' : String(d));
const tocarEtiqueta = (pag, n, d) => pag.evaluate((id, dd) => {
  const cel = document.querySelector('#bib-corpo .bib-cartao[data-id="' + id + '"]').closest('.bib-celula');
  cel.querySelector('.bib-etiqueta-botao[data-dificuldade="' + dd + '"]').click();
}, SP + n, d);
const rotuloFonte = (pag, n) => pag.evaluate(id => {
  const t = document.querySelector('#bib-corpo .bib-cartao[data-id="' + id + '"] .bib-dif-fonte'); return t ? t.textContent : '';
}, SP + n);
const lerEtiquetas = pag => pag.evaluate(() => Store.etiquetasDaBiblioteca());

(async () => {
  if (VENENO) {
    secao('O veneno é de verdade');
    conf('o app.js servido ficou DIFERENTE do repositório', trocas['/app.js'] !== APP_REPO ? 'diferente' : 'IGUAL', 'diferente');
    conf('e o veneno trocou exatamente uma ocorrência', APP_REPO.split(LINHA_EFETIVA).length - 1, 1);
  }
  await amb.subir();
  const pag = await amb.pagina();
  // o download vira texto lido pelo teste: sem folha de compartilhamento, o app cai no a[download]
  await pag.evaluateOnNewDocument(() => {
    try { Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true }); } catch (e) { /* ok */ }
    window.__baixados = [];
    const clicar = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download) {
        const nome = this.download;
        fetch(this.href).then(r => r.arrayBuffer()).then(b => {
          window.__baixados.push({ nome, bytes: Array.from(new Uint8Array(b)) });
        });
        return undefined;
      }
      return clicar.apply(this, arguments);
    };
  });
  await H.abrirApp(pag, amb.ORIGEM);
  // uma aula do primeiro aluno, gravada direto no banco, para o filtro "ainda não usei com"
  const alunoId = await pag.evaluate(async () => {
    const d = await Store.carregar();
    const al = d.alunos[0];
    d.aulas.push({ id: 'aula-dif-teste', alunoId: al.id, serieId: null, destacada: false, data: '2026-09-22', hora: '10:00',
      duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', temNota: false, anexos: [], temas: [] });
    await Store.salvar(d);
    return al.id;
  });
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('6a. Exportar sem etiqueta nenhuma: avisa e não gera arquivo');
  await H.irParaAba(pag, 'ajustes');
  conf('sem pacote, o botão de exportar não aparece (Ajustes igual ao de antes)', await pag.evaluate(() => {
    const b = document.querySelector('#exportar-etiquetas'); return !!b && b.hidden && b.offsetParent === null;
  }), true);
  const zip = path.join(TMP, 'nono.zip');
  Sintetico.gerar(zip, { curadoria: CURADORIA });
  conf('importou o pacote sintético com dois curados', /^Biblioteca importada\./.test(await importar(pag, zip)), true);
  conf('o botão está em Ajustes, no cartão da biblioteca', await pag.evaluate(() => {
    const b = document.querySelector('#exportar-etiquetas');
    return !!b && !!b.closest('#cartao-biblioteca') && b.offsetParent !== null && b.textContent.trim();
  }), 'Exportar minhas etiquetas de dificuldade');
  await pag.click('#exportar-etiquetas');
  const aviso = await esperar('aviso sem etiquetas', () => pag.evaluate(() => document.body.innerText.indexOf('Nenhuma etiqueta de dificuldade ainda. Marque no "Para mim" de cada exercício, na Biblioteca.') >= 0), v => v === true, 5000);
  conf('sem etiqueta: "Nenhuma etiqueta de dificuldade ainda."', aviso.ok, true);
  await pausa(400);
  conf('e nenhum arquivo saiu', await pag.evaluate(() => window.__baixados.length), 0);

  // ================================================================
  secao('1. O cartão diz de onde veio a dificuldade');
  await abrirSomaEProduto(pag);
  conf('exercício 1: "estimada: fácil"', await rotuloFonte(pag, 1), 'estimada: fácil');
  conf('exercício 2 (curado): "curada: difícil"', await rotuloFonte(pag, 2), 'curada: difícil');
  conf('exercício 5: "estimada: médio"', await rotuloFonte(pag, 5), 'estimada: médio');
  conf('exercício 8 (curado): "curada: fácil"', await rotuloFonte(pag, 8), 'curada: fácil');
  // cada cartão diz a origem que o pacote traz, e nunca "curada" num item proxy
  const origens = await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-corpo .bib-cartao')).map(c =>
    ({ id: c.getAttribute('data-id'), rotulo: (c.querySelector('.bib-dif-fonte') || {}).textContent || '' })));
  const origemEsperada = origens.map(o => (CURADORIA[o.id] ? 'curada' : 'estimada'));
  conf('os 8 cartões: "curada" só no 2 e no 8, que o pacote marca como curadoria; "estimada" nos 6 proxy',
    origens.map(o => o.rotulo.split(':')[0]).join(','), origemEsperada.join(','));
  conf('nenhum cartão com o rótulo antigo ("revisada" ou só "Fácil")', await pag.evaluate(() =>
    Array.from(document.querySelectorAll('#bib-corpo .bib-tags .tag')).filter(t => /revisada|^(Fácil|Médio|Difícil)$/i.test(t.textContent.trim())).length), 0);
  await tocarEtiqueta(pag, 3, 1);
  await esperar('etiqueta do 3 marcada', () => pag.evaluate(id => !!document.querySelector('#bib-corpo .bib-cartao[data-id="' + id + '"]')
    .closest('.bib-celula').querySelector('.bib-etiqueta-botao.ativa'), SP + 3), v => v === true, 5000);
  const cores = await pag.evaluate(id => {
    const cel = document.querySelector('#bib-corpo .bib-cartao[data-id="' + id + '"]').closest('.bib-celula');
    const fonte = getComputedStyle(cel.querySelector('.bib-dif-fonte'));
    const dela = getComputedStyle(cel.querySelector('.bib-etiqueta-botao.ativa'));
    return { fonteFundo: fonte.backgroundColor, fonteCor: fonte.color, delaFundo: dela.backgroundColor, delaCor: dela.color,
      maiusculas: fonte.textTransform };
  }, SP + 3);
  conf('o rótulo do pacote e a etiqueta dela têm fundos diferentes', cores.fonteFundo !== cores.delaFundo, true);
  conf('e cores de letra diferentes', cores.fonteCor !== cores.delaCor, true);
  conf('o rótulo do pacote não sai em maiúsculas', cores.maiusculas, 'none');
  conf('os chips do filtro têm 44 px de altura, como os do "Para mim"', await pag.evaluate(() =>
    Array.from(document.querySelectorAll('#bib-filtro-dif .chip-filtro')).every(b => b.getBoundingClientRect().height >= 44)), true);
  if (SALVAR) await pag.screenshot({ path: path.join(SALVAR, 'b5_1_cartao_estimada_curada_para_mim.png') });
  await tocarEtiqueta(pag, 3, 1);   // tira de novo
  await esperar('etiqueta do 3 tirada', () => lerEtiquetas(pag), v => v && v.some(e => e.itemId === SP + 3 && e.dificuldade === null), 5000);

  // ================================================================
  secao('2. O filtro Fácil, Médio, Difícil');
  conf('a barra "Dificuldade:" com Todas, Fácil, Médio, Difícil', await pag.evaluate(() =>
    Array.from(document.querySelectorAll('#bib-filtro-dif .chip-filtro')).map(b => b.textContent).join(',')), 'Todas,Fácil,Médio,Difícil');
  conf('começa em Todas: os 8', await visiveis(pag), '1,2,3,4,5,6,7,8');
  await filtrar(pag, 1);
  conf('Fácil: 1, 3 e o 8 curado (o 2 curado como Difícil sai)', await visiveis(pag), '1,3,8');
  conf('com a contagem do que está na tela', await pag.evaluate(() => document.querySelector('#bib-filtro-dif-info').textContent), 'Mostrando 3 de 8 exercícios.');
  await filtrar(pag, 2);
  conf('Médio: 4, 5 e 6', await visiveis(pag), '4,5,6');
  await filtrar(pag, 3);
  conf('Difícil: o 2 curado e o 7', await visiveis(pag), '2,7');
  if (SALVAR) await pag.screenshot({ path: path.join(SALVAR, 'b5_2_filtro_dificil.png') });
  await filtrar(pag, null);
  conf('Todas volta os 8', await visiveis(pag), '1,2,3,4,5,6,7,8');
  conf('e a contagem some', await pag.evaluate(() => document.querySelector('#bib-filtro-dif-info').textContent), '');

  // ================================================================
  secao('3. A etiqueta dela vale no filtro');
  await filtrar(pag, 1);
  await tocarEtiqueta(pag, 1, 3);
  await esperar('etiqueta Difícil no 1', () => lerEtiquetas(pag), v => v && v.some(e => e.itemId === SP + 1 && e.dificuldade === 3), 5000);
  await pausa(150);
  conf('o cartão não some debaixo do dedo: o 1 fica na tela até ela trocar o filtro', await visiveis(pag), '1,3,8');
  await filtrar(pag, 1);
  if (VENENO) {
    // o app envenenado só olha a dificuldade do pacote: o 1 continua no Fácil
    conf('VENENO ENXERGADO: com a etiqueta ignorada, o 1 continua no Fácil', await visiveis(pag), '1,3,8');
    throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
  }
  conf('tocado o Fácil de novo, o 1 marcado Difícil por ela sai da lista', await visiveis(pag), '3,8');
  await filtrar(pag, 3);
  conf('e aparece no Difícil', await visiveis(pag), '1,2,7');
  if (SALVAR) await pag.screenshot({ path: path.join(SALVAR, 'b5_3_etiqueta_dela_no_filtro.png') });

  // ================================================================
  secao('4. Os dois filtros juntos');
  await pag.evaluate((id, al) => Store.registrarUsoBiblioteca({ itemId: id, alunoId: al, aulaId: 'aula-dif-teste', data: '2026-09-22' }), SP + 7, alunoId);
  await pag.select('#bib-filtro-aluno', alunoId);
  await esperar('filtro de uso aplicado', () => visiveis(pag), v => v === '1,2', 5000);
  conf('Difícil e "ainda não usei com": o 7 usado sai, ficam 1 e 2', await visiveis(pag), '1,2');
  conf('e a contagem é a dos dois filtros juntos', await pag.evaluate(() => document.querySelector('#bib-filtro-dif-info').textContent), 'Mostrando 2 de 8 exercícios.');
  await filtrar(pag, null);
  conf('Todas com o filtro de uso: só o 7 escondido', await visiveis(pag), '1,2,3,4,5,6,8');
  await pag.select('#bib-filtro-aluno', '');
  await esperar('filtro de uso desligado', () => visiveis(pag), v => v === '1,2,3,4,5,6,7,8', 5000);
  conf('os dois desligados: os 8', await visiveis(pag), '1,2,3,4,5,6,7,8');

  // ================================================================
  secao('5. Recarregado, a etiqueta continua valendo');
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  await abrirSomaEProduto(pag);
  await filtrar(pag, 3);
  await esperar('etiquetas relidas', () => visiveis(pag), v => v === '1,2,7', 5000);
  conf('depois de recarregar, Difícil ainda traz o 1 dela', await visiveis(pag), '1,2,7');
  // o filtro fica ligado de uma lista para a outra: voltar ao módulo e reabrir a lista, sem tocar no filtro,
  // com as etiquetas chegando depois do desenho (a corrida do carregarEtiquetas)
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(150);
  await tocarLinha(pag, 'Soma e Produto');
  await esperar('lista reaberta com o filtro ligado', () => visiveis(pag), v => v === '1,2,7', 5000);
  conf('reaberta a lista, o Difícil continua ligado e traz o 1 dela', await visiveis(pag), '1,2,7');
  conf('com o chip Difícil marcado', await pag.evaluate(() => (document.querySelector('#bib-filtro-dif .chip-filtro.ativo') || {}).textContent), 'Difícil');
  // pelo menu, os filtros voltam para todos
  await H.irParaAba(pag, 'agenda');
  await abrirSomaEProduto(pag);
  await esperar('lista pelo menu', () => visiveis(pag), v => v === '1,2,3,4,5,6,7,8', 5000);
  conf('entrando pela aba, o filtro de dificuldade volta para Todas', await visiveis(pag), '1,2,3,4,5,6,7,8');

  // ================================================================
  secao('6b. Exportar as etiquetas: o CSV da curadoria');
  await tocarEtiqueta(pag, 5, 1);
  await esperar('etiqueta Fácil no 5', () => lerEtiquetas(pag), v => v && v.some(e => e.itemId === SP + 5 && e.dificuldade === 1), 5000);
  // o 3 ficou gravado sem dificuldade (etiqueta tirada) e não pode sair
  await H.irParaAba(pag, 'ajustes');
  await pag.click('#exportar-etiquetas');
  const baixado = await esperar('CSV baixado', () => pag.evaluate(() => window.__baixados.length), v => v === 1, 5000);
  conf('um arquivo saiu', baixado.ok, true);
  const arq = await pag.evaluate(() => window.__baixados[0] || null);
  const hoje = await pag.evaluate(() => Core.hojeIso());
  conf('nome do arquivo', arq && arq.nome, 'etiquetas-dificuldade-' + hoje + '.csv');
  const bytes = Buffer.from(arq ? arq.bytes : []);
  conf('sem BOM', bytes.slice(0, 3).toString('hex') !== 'efbbbf', true);
  const csv = bytes.toString('utf8');
  conf('sem CR (fim de linha LF, como o dificuldade.csv do Drive)', csv.indexOf('\r'), -1);
  const linhas = csv.split('\n');
  conf('cabeçalho igual ao da curadoria', linhas[0], 'id;dificuldade;quem;data;observacao');
  conf('termina com uma quebra de linha', csv.slice(-1), '\n');
  conf('as duas etiquetas, ordenadas pelo id, e nada da tirada', linhas.slice(1, -1).join('|'),
    SP + '1;3;Nathalia;' + hoje + ';|' + SP + '5;1;Nathalia;' + hoje + ';');
  conf('cada linha com cinco campos', linhas.slice(1, -1).every(l => l.split(';').length === 5), true);
  if (SALVAR) {
    fs.writeFileSync(path.join(SALVAR, 'b5_6_etiquetas_exportadas.csv'), bytes);
    await pag.screenshot({ path: path.join(SALVAR, 'b5_6_ajustes_exportar.png') });
  }

  // ================================================================
  secao('7. Nenhum erro de JavaScript');
  conf('nenhum erro de página', pag.errosDePagina.join(' | '), '');
})().then(() => H.fim(amb)(), e => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e)));
