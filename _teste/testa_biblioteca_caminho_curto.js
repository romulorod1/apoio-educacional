/* testa_biblioteca_caminho_curto.js
 *
 * O caminho da aula até o material da biblioteca ficou curto (itens 2, 3 e 4 do
 * B7), no Chrome, com o pacote SINTÉTICO. O pacote real do Drive nunca entra
 * aqui. A reclamação que isto atende é concreta: ela abria o exercício, lia,
 * fechava, marcava, e repetia, dezoito vezes.
 *
 * O que prova:
 *
 *   2. DA AULA, O MATERIAL NASCE CHEIO E JÁ MARCADO. Um toque no Material de um
 *      assunto que a biblioteca tem abre o MÓDULO dele (e não uma busca) com
 *      todos os exercícios e todas as páginas de teoria já marcados; o aviso diz
 *      o que marcou e oferece Desfazer, que devolve a seleção anterior inteira;
 *      a janela Gerar material já vem com Teoria e Gabarito ligados. Os
 *      exercícios que ela JÁ USOU com aquele aluno ficam de fora, porque são os
 *      mesmos que o filtro "Ainda não usei com" tira da lista: marcar o que ela
 *      não vê mandaria questão repetida para a mesma criança.
 *
 *   3. MARCAR DE DENTRO DA TELA CHEIA. O visor ganha um botão que alterna entre
 *      "Marcar para o material" e "Tirar do material", sobre o MESMO carrinho da
 *      lista, valendo para exercício e para página de teoria; o selo "Marcado"
 *      fica sobre a imagem, para o estado se ler enquanto ela anda pelo Anterior
 *      e Próxima; e ao fechar o visor as caixas da lista já mostram o que ela
 *      marcou lá dentro.
 *
 *   4. NA ABA, "MARCAR OS N DESTE MÓDULO". No cabeçalho do módulo, um toque
 *      marca os N exercícios e o botão vira "Desmarcar os N"; nada vem marcado
 *      por padrão na navegação livre, onde o carrinho é global e atravessa
 *      módulos.
 *
 * Modos envenenados (cada um desliga UMA regra e sai assim que a vê cair):
 *   --envenenado-cheio   o app.js servido não enche o carrinho ao vir da aula.
 *                        A faixa tem de ficar em "Nada marcado ainda."
 *   --envenenado-visor   o app.js servido não põe as caixas da lista de acordo
 *                        com o carrinho ao fechar a tela cheia. É a metade
 *                        SILENCIOSA do item 3: marcar continua funcionando e só
 *                        a lista mente, então ela remarca o que já estava
 *                        marcado. A outra metade (o botão marcar de verdade) cai
 *                        alto e é o modo normal que a pega.
 *   --envenenado-modulo  o app.js servido nunca reconhece "todos marcados", e o
 *                        botão do módulo nunca vira "Desmarcar os N": o caminho
 *                        fica sem volta. Marcar em si cai alto no modo normal.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8800;
const V_CHEIO = process.argv.indexOf('--envenenado-cheio') !== -1;
const V_VISOR = process.argv.indexOf('--envenenado-visor') !== -1;
const V_MODULO = process.argv.indexOf('--envenenado-modulo') !== -1;
const VENENO = V_CHEIO || V_VISOR || V_MODULO;

const APP_REPO = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
/* A âncora segue a linha que ENCHE o carrinho, e ela mudou junto com o
 * Desfazer: era `bibCarrinho = tudo;` e passou a copiar as duas listas, para o
 * Desfazer poder comparar com o que a marcação pôs. O portão pegou isso na
 * hora, pela asserção logo abaixo, que exige a âncora existir UMA vez: veneno
 * que deixa de envenenar sem ninguém notar é o pior defeito de uma prova. */
const L_CHEIO = 'bibCarrinho = { itens: tudo.itens.slice(), paginas: tudo.paginas.slice() };';
/* O worktree pode ter o app.js com CRLF (core.autocrlf): a âncora segue o
 * arquivo. Um `return` logo depois desta linha pula o marcarCaixasDoCarrinho
 * que fecha o soltarVisor, e nada mais. */
const L_VISOR = 'bibVezDoVisor++;';
const L_MODULO = 'return ids.length > 0 && ids.every(function (id) { return noCarrinho(\'itens\', id); });';
const ALVO_VENENO = V_CHEIO ? L_CHEIO : V_VISOR ? L_VISOR : L_MODULO;
const TROCA_VENENO = V_CHEIO
  ? 'bibCarrinho = { itens: [], paginas: [] };'
  : V_VISOR
    ? 'bibVezDoVisor++; return;'
    : 'return false;';
const trocas = {};
if (VENENO) trocas['/app.js'] = APP_REPO.split(ALVO_VENENO).join(TROCA_VENENO);

const amb = H.criarAmbiente(PORTA, 'perfil_caminho_curto', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'b7_curto_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });
const hojeIso = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();

const MOD = '9ano:teorema-de-pitagoras';
const EX = '9ano:teorema-de-pitagoras:aplicacoes:ex:';
const TEO = '9ano:teorema-de-pitagoras:o-teorema:teo';
const N_EX = 6, N_PAG = 3;

async function importar(pag, arquivo) {
  await H.irParaAba(pag, 'ajustes');
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar('importação', () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca'); return c ? c.innerText.trim() : '';
  }), v => /^Biblioteca importada\.|não foi importado/.test(v || ''), 90000);
  return r.valor || '';
}
const faixa = pag => pag.evaluate(() => (document.querySelector('#bib-carrinho') || {}).innerText || '');
const carrinho = pag => pag.evaluate(() => {
  try { return JSON.parse(localStorage.getItem('apoio-educacional:bib-carrinho') || 'null') || { itens: [], paginas: [] }; }
  catch (e) { return { itens: [], paginas: [] }; }
});
const aviso = pag => pag.evaluate(() => (document.querySelector('#aviso-texto') || {}).textContent || '');
async function abrirAulaDeHoje(pag, hora) {
  await H.irParaAba(pag, 'agenda');
  for (let i = 0; i < 24; i++) {
    if (await pag.evaluate(h => !!document.querySelector('[data-dia="' + h + '"]'), hojeIso)) break;
    await pag.click(i < 12 ? '#mes-seguinte' : '#mes-anterior');
    await pausa(120);
  }
  const ok = await pag.evaluate((h, hr) => {
    const p = Array.from(document.querySelectorAll('[data-dia="' + h + '"] .pilula')).find(x => x.textContent.indexOf(hr) === 0);
    if (!p) return false; p.click(); return true;
  }, hojeIso, hora);
  await esperar('aula das ' + hora + ' aberta', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 8000);
  return ok;
}
const tocarMaterial = (pag, titulo) => pag.evaluate(t => {
  const l = Array.from(document.querySelectorAll('#corpo-modal-aula .item-assunto-aula')).find(x => x.querySelector('.nome').firstChild.textContent === t);
  const b = l && Array.from(l.querySelectorAll('button')).find(x => x.textContent.trim() === 'Material');
  if (!b) return false; b.click(); return true;
}, titulo);
const tocarLinha = (pag, nome) => pag.evaluate(n => {
  const l = Array.from(document.querySelectorAll('#bib-corpo .item-lista')).find(x => x.querySelector('.nome').textContent.trim() === n);
  if (!l) return false; l.click(); return true;
}, nome);
async function voltarAoTopoDaBiblioteca(pag) {
  await H.irParaAba(pag, 'biblioteca');
  for (let k = 0; k < 5; k++) {
    const v = await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) { b.click(); return true; } return false; });
    if (!v) break;
    await pausa(150);
  }
  await pausa(200);
}
const estadoDoVisor = pag => pag.evaluate(() => ({
  aberto: document.querySelector('#modal-biblioteca').classList.contains('aberto'),
  titulo: (document.querySelector('#titulo-modal-biblioteca') || {}).textContent || '',
  botao: (document.querySelector('#bib-marcar-visor') || {}).textContent || '',
  pressionado: (document.querySelector('#bib-marcar-visor') || {}).getAttribute
    ? document.querySelector('#bib-marcar-visor').getAttribute('aria-pressed') : '',
  selo: !!document.querySelector('#bib-selo-marcado')
}));
const caixaDaLista = (pag, id) => pag.evaluate(i => {
  const c = document.querySelector('#bib-corpo input[data-carrinho][data-id="' + i + '"]');
  return c ? (c.checked ? 'marcada' : 'desmarcada') : 'não achei a caixa';
}, id);
const botaoDoModulo = pag => pag.evaluate(() => {
  const b = document.querySelector('#bib-marcar-modulo');
  return b ? b.textContent.trim() : '(não existe)';
});

(async () => {
  if (VENENO) {
    secao('O veneno é de verdade');
    conf('o app.js servido ficou DIFERENTE do repositório', trocas['/app.js'] !== APP_REPO ? 'diferente' : 'IGUAL', 'diferente');
    conf('e o veneno trocou exatamente uma ocorrência', APP_REPO.split(ALVO_VENENO).length - 1, 1);
  }
  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);

  const zip = path.join(TMP, 'nono.zip');
  Sintetico.gerar(zip, {});
  conf('importou o pacote sintético', /^Biblioteca importada\./.test(await importar(pag, zip)), true);

  const alunoId = await pag.evaluate(async h => {
    const d = await Store.carregar();
    const aluno = d.alunos[0];
    d.aulas.push({ id: 'aula-b7-curto', alunoId: aluno.id, serieId: null, destacada: false, data: h, hora: '08:00',
      duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', temNota: false,
      anexos: [], temas: [{ titulo: 'Teorema de Pitágoras', fonte: 'livre' }] });
    await Store.salvar(d);
    return aluno.id;
  }, hojeIso);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('2. Da aula, o material nasce cheio e já marcado');
  /* Uma seleção anterior, de outro módulo, para o Desfazer ter o que devolver.
   * É ela que prova que vir da aula SUBSTITUI, e não soma: o escopo é o módulo
   * que veio da aula, com começo e fim. */
  const ANTES = { itens: ['9ano:produtos-notaveis-e-fatoracao:produtos-notaveis:ex:1'], paginas: [] };
  await pag.evaluate(c => localStorage.setItem('apoio-educacional:bib-carrinho', JSON.stringify(c)), ANTES);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);

  conf('a aula de hoje abriu', await abrirAulaDeHoje(pag, '08:00'), true);
  conf('o assunto tem o botão Material', await tocarMaterial(pag, 'Teorema de Pitágoras'), true);
  const chegou = await esperar('a aba Biblioteca no módulo do assunto', () => pag.evaluate(() => ({
    aba: (document.querySelector('#abas .aba.ativa') || { dataset: {} }).dataset.tela,
    titulo: (document.querySelector('#bib-corpo .bib-titulo') || {}).textContent || '',
    busca: (document.querySelector('#busca-biblioteca') || {}).value || ''
  })), v => v && v.aba === 'biblioteca' && v.titulo === 'Teorema de Pitágoras', 20000);
  conf('o toque leva direto ao módulo, e não a uma busca', chegou.ok, true);
  conf('e o campo de busca fica vazio', chegou.valor && chegou.valor.busca, '');

  const cheio = await esperar('a faixa do carrinho', () => faixa(pag), v => !!v, 10000);
  if (V_CHEIO) {
    conf('VENENO ENXERGADO: sem encher o carrinho, a faixa fica vazia',
      /Nada marcado ainda/.test(cheio.valor || ''), true);
    throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
  }
  conf('a faixa diz o módulo inteiro marcado',
    (cheio.valor || '').split('\n')[0],
    'Material marcado: ' + N_EX + ' exercícios, ' + N_PAG + ' páginas de teoria');
  const c1 = await carrinho(pag);
  conf('o carrinho tem os ' + N_EX + ' exercícios do módulo', c1.itens.length, N_EX);
  conf('e as ' + N_PAG + ' páginas de teoria', c1.paginas.length, N_PAG);
  conf('todos os exercícios são deste módulo', c1.itens.every(i => i.indexOf(MOD + ':') === 0), true);
  conf('e a seleção anterior, de outro módulo, saiu', c1.itens.indexOf(ANTES.itens[0]) < 0, true);
  conf('o aviso diz o que foi marcado', /^Marquei o módulo inteiro: 6 exercícios e 3 páginas de teoria\./.test(await aviso(pag)), true);
  conf('e manda tirar o que não quiser', /Tire o que não quiser e toque em Gerar material\./.test(await aviso(pag)), true);

  /* DESFAZER SEGUE A REGRA DO "Desmarcar tudo": volta o que era dela antes e
   * MANTÉM o que ela marcou nesses segundos. Aqui ela marca uma página de
   * teoria de outro módulo antes de tocar em Desfazer: o módulo sai inteiro, o
   * de antes volta, e a página dela fica. Juntar sem tirar o que a marcação
   * pôs deixaria o módulo marcado e ainda somaria o de antes, e o número
   * SUBIRIA depois de um toque em Desfazer. */
  const AVULSA = '9ano:produtos-notaveis-e-fatoracao:produtos-notaveis:teo:p01';
  // pela TELA, como ela faria, e depressa: o aviso com Desfazer dura nove segundos
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(150);
  await tocarLinha(pag, 'Produtos Notáveis e Fatoração');
  await tocarLinha(pag, 'Produtos Notáveis');
  await pausa(200);
  const marcouAvulsa = await pag.evaluate(id => {
    const c = document.querySelector('#bib-corpo input[data-carrinho][data-id="' + id + '"]');
    if (!c) return false; c.click(); return true;
  }, AVULSA);
  conf('ela marcou uma página de outro módulo enquanto o aviso estava na tela', marcouAvulsa, true);
  const antesDoDesfazer = await carrinho(pag);
  const nMarcado = antesDoDesfazer.itens.length + antesDoDesfazer.paginas.length;
  const aindaTemDesfazer = await pag.evaluate(() => {
    const b = document.querySelector('#aviso-acao');
    const caixa = document.querySelector('#aviso');
    if (!b || !caixa.classList.contains('aberto') || b.style.display === 'none') return false;
    b.click(); return true;
  });
  conf('o aviso com Desfazer ainda estava lá', aindaTemDesfazer, true);
  await pausa(400);
  const c2 = await carrinho(pag);
  conf('Desfazer tira o módulo inteiro que a marcação pôs',
    c2.itens.filter(i => i.indexOf(MOD + ':') === 0).length, 0);
  conf('devolve a seleção que ela tinha antes', c2.itens.join(','), ANTES.itens.join(','));
  conf('e mantém o que ela marcou depois', c2.paginas.join(','), AVULSA);
  conf('o número DESCE depois do Desfazer, e não sobe',
    c2.itens.length + c2.paginas.length < nMarcado, true);
  /* A faixa não conta o que não há: sem página de teoria marcada, a parte das
   * páginas nem aparece. Aqui há uma, então as duas partes saem. */
  conf('e a faixa conta o que sobrou', (await faixa(pag)).split('\n')[0],
    'Material marcado: 1 exercício, 1 página de teoria');

  // ================================================================
  secao('2b. Gerar material já vem com Teoria e Gabarito');
  await abrirAulaDeHoje(pag, '08:00');
  await tocarMaterial(pag, 'Teorema de Pitágoras');
  await esperar('de volta ao módulo', () => pag.evaluate(() =>
    (document.querySelector('#bib-corpo .bib-titulo') || {}).textContent || ''), v => v === 'Teorema de Pitágoras', 20000);
  await esperar('carrinho cheio de novo', () => carrinho(pag), v => v && v.itens.length === N_EX, 8000);
  await pag.click('#bib-carrinho-gerar');
  const gerar = await esperar('janela Gerar material', () => pag.evaluate(() => {
    if (!document.querySelector('#modal-bib-gerar').classList.contains('aberto')) return null;
    const c = id => { const e = document.querySelector('#bib-gerar-' + id); return e ? (e.checked ? 1 : 0) : -1; };
    return { resumo: (document.querySelector('#bib-gerar-resumo') || {}).textContent || '',
      teoria: c('teoria'), lista: c('lista'), gabarito: c('gabarito') };
  }), v => !!v, 10000);
  conf('a janela abriu', gerar.ok, true);
  conf('com teoria, lista e gabarito ligados',
    gerar.valor && [gerar.valor.teoria, gerar.valor.lista, gerar.valor.gabarito].join(','), '1,1,1');
  conf('e o resumo conta o módulo inteiro',
    /^6 exercícios e 3 páginas de teoria, na ordem em que você marcou\.$/.test((gerar.valor || {}).resumo || ''), true);
  await pag.evaluate(() => { const b = document.querySelector('#modal-bib-gerar [data-fechar]'); if (b) b.click(); });
  await pausa(250);

  // ================================================================
  secao('2c. O que ela já usou com aquele aluno fica de fora');
  await pag.evaluate((id, aula, aluno) => Store.registrarUsoBiblioteca({ itemId: id, alunoId: aluno, aulaId: aula, data: '2026-09-01' }),
    EX + '2', 'aula-b7-curto', alunoId);
  await pag.evaluate(() => localStorage.removeItem('apoio-educacional:bib-carrinho'));
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  await abrirAulaDeHoje(pag, '08:00');
  await tocarMaterial(pag, 'Teorema de Pitágoras');
  const semUsado = await esperar('carrinho sem o já usado', () => carrinho(pag), v => v && v.itens.length === N_EX - 1, 20000);
  conf('o exercício já usado com este aluno não é marcado', semUsado.ok, true);
  conf('e é exatamente ele que ficou de fora', (semUsado.valor || { itens: [] }).itens.indexOf(EX + '2'), -1);
  conf('o aviso diz quantos ficaram de fora e com quem',
    / Fora 1 que você já usou com /.test(await aviso(pag)), true);

  // ================================================================
  secao('3. Marcar de dentro da tela cheia');
  await pag.evaluate(() => localStorage.removeItem('apoio-educacional:bib-carrinho'));
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  await voltarAoTopoDaBiblioteca(pag);
  conf('nada vem marcado na navegação livre', /Nada marcado ainda/.test(await faixa(pag)), true);
  conf('entrou no módulo', await tocarLinha(pag, 'Teorema de Pitágoras'), true);
  conf('entrou na lista', await tocarLinha(pag, 'Aplicações do Teorema'), true);
  await esperar('a lista na tela', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .bib-celula').length), v => v === N_EX, 10000);
  conf('a caixa do exercício 1 começa desmarcada', await caixaDaLista(pag, EX + '1'), 'desmarcada');
  await pag.evaluate(i => document.querySelector('#bib-corpo .bib-cartao[data-id="' + i + '"]').click(), EX + '1');
  const v1 = await esperar('o visor aberto', () => estadoDoVisor(pag), v => v && v.aberto, 10000);
  conf('a tela cheia abriu no exercício 1', v1.ok, true);
  conf('o botão convida a marcar', v1.valor && v1.valor.botao, 'Marcar para o material');
  conf('e não há selo antes de marcar', v1.valor && v1.valor.selo, false);
  /* Onde estão os botões e que tamanho tem a folha ANTES do toque. É a medida
   * que prova que a fileira não se reacomoda: os dois rótulos do botão têm
   * tamanhos diferentes, e sem largura fixa ela marcava, o dedo já ia para
   * "Próxima" e o botão tinha saído de baixo dele. */
  const geometria = pag => pag.evaluate(() => {
    const cx = s => { const e = document.querySelector(s); if (!e) return -1; const r = e.getBoundingClientRect(); return Math.round(r.left); };
    const img = document.querySelector('#bib-imagem-cheia');
    return { proxima: cx('#bib-proxima'), solucao: cx('#bib-solucao'), folha: cx('#bib-fechar-visor'),
      largura: img ? Math.round(img.getBoundingClientRect().width) : -1 };
  });
  const g1 = await geometria(pag);
  conf('a folha abre grande, e não no tamanho do recorte', g1.largura > 400, true);
  await pag.click('#bib-marcar-visor');
  await pausa(300);
  const g2 = await geometria(pag);
  conf('marcar não mexe o "Próxima ›" de lugar', g2.proxima, g1.proxima);
  conf('nem o "Ver solução"', g2.solucao, g1.solucao);
  conf('nem o "Fechar"', g2.folha, g1.folha);
  conf('e a folha continua do mesmo tamanho', g2.largura, g1.largura);
  const v2 = await estadoDoVisor(pag);
  conf('depois do toque o botão vira "Tirar do material"', v2.botao, 'Tirar do material');
  conf('com aria-pressed verdadeiro', v2.pressionado, 'true');
  conf('e o selo "Marcado" aparece sobre a imagem', v2.selo, true);
  conf('o carrinho ganhou o exercício', (await carrinho(pag)).itens.join(','), EX + '1');
  await pag.click('#bib-proxima');
  await pausa(300);
  const v3 = await estadoDoVisor(pag);
  conf('andando para a próxima, o botão volta a convidar', v3.botao, 'Marcar para o material');
  conf('e o selo some, porque esta não está marcada', v3.selo, false);
  await pag.click('#bib-anterior');
  await pausa(300);
  const v4 = await estadoDoVisor(pag);
  conf('voltando, o estado da marcada continua lá', v4.botao, 'Tirar do material');
  conf('e o selo volta com ela', v4.selo, true);
  await pag.click('#bib-fechar-visor');
  await pausa(400);
  const caixa1 = await caixaDaLista(pag, EX + '1');
  if (V_VISOR) {
    conf('VENENO ENXERGADO: sem pôr as caixas de acordo, a lista continua dizendo desmarcada', caixa1, 'desmarcada');
    conf('e o carrinho, esse, tem o exercício: a lista é que mente', (await carrinho(pag)).itens.join(','), EX + '1');
    throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
  }
  conf('ao fechar o visor, a caixa da lista já está marcada', caixa1, 'marcada');
  // tirar de dentro da tela cheia também
  await pag.evaluate(i => document.querySelector('#bib-corpo .bib-cartao[data-id="' + i + '"]').click(), EX + '1');
  await esperar('o visor de novo', () => estadoDoVisor(pag), v => v && v.aberto, 8000);
  await pag.click('#bib-marcar-visor');
  await pausa(300);
  conf('tocar de novo tira do material', (await estadoDoVisor(pag)).botao, 'Marcar para o material');
  conf('e o carrinho fica vazio', (await carrinho(pag)).itens.length, 0);
  await pag.click('#bib-fechar-visor');
  await pausa(400);
  conf('e a caixa da lista volta a desmarcada', await caixaDaLista(pag, EX + '1'), 'desmarcada');

  secao('3b. Vale também para página de teoria');
  await voltarAoTopoDaBiblioteca(pag);
  await tocarLinha(pag, 'Teorema de Pitágoras');
  await tocarLinha(pag, 'O Teorema');
  await esperar('as páginas na tela', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .bib-celula').length), v => v === N_PAG, 10000);
  await pag.evaluate(i => document.querySelector('#bib-corpo .bib-cartao[data-id="' + i + '"]').click(), TEO + ':p01');
  await esperar('o visor da teoria', () => estadoDoVisor(pag), v => v && v.aberto, 8000);
  conf('a capa abre com o botão de marcar', (await estadoDoVisor(pag)).botao, 'Marcar para o material');
  await pag.click('#bib-marcar-visor');
  await pausa(300);
  const vt = await estadoDoVisor(pag);
  conf('marcar a página de teoria funciona igual', vt.botao, 'Tirar do material');
  conf('com o selo sobre a página', vt.selo, true);
  conf('e ela entra no carrinho como página', (await carrinho(pag)).paginas.join(','), TEO + ':p01');
  await pag.click('#bib-fechar-visor');
  await pausa(400);
  conf('a caixa da página fica marcada na lista', await caixaDaLista(pag, TEO + ':p01'), 'marcada');

  // ================================================================
  secao('4. "Marcar os N deste módulo" na navegação livre');
  await pag.evaluate(() => localStorage.removeItem('apoio-educacional:bib-carrinho'));
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  await voltarAoTopoDaBiblioteca(pag);
  conf('a navegação livre começa sem nada marcado', /Nada marcado ainda/.test(await faixa(pag)), true);
  await tocarLinha(pag, 'Teorema de Pitágoras');
  await esperar('o cabeçalho do módulo', () => botaoDoModulo(pag), v => v && v !== '(não existe)', 10000);
  conf('o botão conta os exercícios do módulo', await botaoDoModulo(pag), 'Marcar os ' + N_EX + ' exercícios deste módulo');
  await pag.click('#bib-marcar-modulo');
  await pausa(400);
  const c4 = await carrinho(pag);
  conf('um toque marca os ' + N_EX, c4.itens.length, N_EX);
  conf('e só exercícios, nenhuma página de teoria', c4.paginas.length, 0);
  const rotulo = await botaoDoModulo(pag);
  if (V_MODULO) {
    conf('VENENO ENXERGADO: sem reconhecer "todos marcados", o botão nunca vira "Desmarcar"',
      rotulo, 'Marcar os ' + N_EX + ' exercícios deste módulo');
    throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
  }
  conf('com todos marcados, o botão vira "Desmarcar os ' + N_EX + '"', rotulo, 'Desmarcar os ' + N_EX + ' exercícios deste módulo');
  conf('a faixa conta os ' + N_EX + ', e só eles', (await faixa(pag)).split('\n')[0],
    'Material marcado: ' + N_EX + ' exercícios');
  /* A tela do módulo passa a dizer de ONDE vieram: sem isto as linhas ficavam
   * idênticas antes e depois de marcar, e só a faixa mudava. */
  conf('a linha da lista diz quantos entraram no material',
    await pag.evaluate(() => {
      const l = Array.from(document.querySelectorAll('#bib-corpo .item-lista'))
        .find(x => x.querySelector('.nome').textContent.trim() === 'Aplicações do Teorema');
      return l ? l.querySelector('.detalhe').textContent.trim() : '(não achei)';
    }), '6 exercícios · 6 no material');
  await pag.click('#bib-marcar-modulo');
  await pausa(400);
  conf('o mesmo botão desmarca', (await carrinho(pag)).itens.length, 0);
  conf('e volta a convidar', await botaoDoModulo(pag), 'Marcar os ' + N_EX + ' exercícios deste módulo');
  const detalheDaLista = () => pag.evaluate(() => {
    const l = Array.from(document.querySelectorAll('#bib-corpo .item-lista'))
      .find(x => x.querySelector('.nome').textContent.trim() === 'Aplicações do Teorema');
    return l ? l.querySelector('.detalhe').textContent.trim() : '(não achei)';
  });
  conf('e a contagem da linha some junto', await detalheDaLista(), '6 exercícios');
  /* O "Desmarcar tudo" da faixa mexe no carrinho de FORA da tela do módulo:
   * sem redesenho, a faixa dizia "Nada marcado ainda." e a linha logo abaixo
   * continuava dizendo "1 no material", na mesma tela. */
  await pag.click('#bib-marcar-modulo');
  await pausa(400);
  conf('marcando de novo, a linha volta a contar', await detalheDaLista(), '6 exercícios · 6 no material');
  await pag.evaluate(() => { const b = document.querySelector('#bib-carrinho-limpar'); if (b) b.click(); });
  await pausa(600);
  conf('o "Desmarcar tudo" da faixa também limpa a contagem da linha', await detalheDaLista(), '6 exercícios');
  conf('e o botão do módulo acompanha', await botaoDoModulo(pag), 'Marcar os ' + N_EX + ' exercícios deste módulo');
  conf('a faixa e a linha dizem a mesma coisa', /Nada marcado ainda/.test(await faixa(pag)), true);

  secao('4b. O rótulo acompanha a marcação feita na lista');
  await pag.click('#bib-marcar-modulo');
  await pausa(300);
  await tocarLinha(pag, 'Aplicações do Teorema');
  await esperar('a lista', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .bib-celula').length), v => v === N_EX, 10000);
  conf('as caixas da lista já vêm marcadas', await caixaDaLista(pag, EX + '3'), 'marcada');
  await pag.evaluate(i => document.querySelector('#bib-corpo input[data-carrinho][data-id="' + i + '"]').click(), EX + '3');
  await pausa(300);
  conf('desmarcando um, sobram ' + (N_EX - 1), (await carrinho(pag)).itens.length, N_EX - 1);
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(400);
  conf('e o botão do módulo volta a "Marcar os ' + N_EX + '"', await botaoDoModulo(pag), 'Marcar os ' + N_EX + ' exercícios deste módulo');

  // ================================================================
  secao('5. Nenhum erro');
  conf('nenhum erro de JavaScript', pag.errosDePagina.join(' | '), '');
  conf('nenhum pedido deu 404', amb.quatrocentos.join(', '), '');
})().then(() => H.fim(amb)(), e => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e)));
