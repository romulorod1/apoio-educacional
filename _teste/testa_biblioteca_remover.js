/* testa_biblioteca_remover.js
 *
 * Apagar um pacote importado (item 5 do B7), no Chrome, com o pacote
 * SINTÉTICO. O pacote real do Drive nunca entra aqui.
 *
 * Substituir já funcionava: importar a versão nova por cima troca tudo do
 * pacote, sem sobra. O que faltava era TIRAR uma série que ela não vai usar e
 * devolver o espaço do tablet.
 *
 * O que prova:
 *   1. o cartão de cada pacote em Ajustes ganha um botão Remover, e a pergunta
 *      nomeia a série, diz quanto espaço volta e diz O QUE FICA;
 *   2. a contagem de registros por depósito, antes e depois: biblioteca_pacotes,
 *      biblioteca_itens, biblioteca_teoria e biblioteca_assets daquele pacote
 *      vão a zero, e as miniaturas do prefixo saem de 'midias';
 *   3. O PONTO DELICADO: biblioteca_etiquetas (a dificuldade que ela deu) e
 *      biblioteca_uso (que exercício foi para que aluno, em que aula) ficam
 *      INTACTOS, registro por registro. Os dois são dela, não do pacote;
 *   4. depois de remover, a aba Biblioteca volta ao "Em construção", e o cartão
 *      de Ajustes fica sem pacote nenhum;
 *   5. a aula com material anexado continua abrindo o anexo, porque o anexo é
 *      arquivo gravado e não depende do pacote;
 *   6. importando a série de novo, ela reencontra a etiqueta e o histórico de
 *      uso no lugar, porque os dois são gravados por id de exercício, que é
 *      estável entre versões;
 *   7. nenhum erro de JavaScript.
 *
 * Modo envenenado:
 *   node _teste/testa_biblioteca_remover.js --envenenado-dela
 *     o store.js servido leva junto o biblioteca_etiquetas e o biblioteca_uso
 *     na mesma transação da remoção. É a perda que este teste existe para
 *     impedir, e ela é SILENCIOSA: a tela diz "Série removida" do mesmo jeito,
 *     e ela só descobre meses depois, ao reimportar e não achar mais nada. O
 *     teste tem de ENXERGAR.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8801;
const VENENO = process.argv.indexOf('--envenenado-dela') !== -1;
const STORE_REPO = fs.readFileSync(path.join(H.RAIZ, 'store.js'), 'utf8');
/* A mesma lista de depósitos aparece no gravar e no remover: a âncora leva a
 * linha seguinte junto, que só o remover tem. E o worktree pode estar com CRLF
 * (core.autocrlf), então a quebra sai do próprio arquivo. */
const EOL = STORE_REPO.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
const DEPOSITOS_HOJE = "var DEPOSITOS = ['biblioteca_pacotes', 'biblioteca_itens', 'biblioteca_teoria', 'biblioteca_assets', 'midias'];";
const L_DEPOSITOS = DEPOSITOS_HOJE + EOL + '    return abrir()';
const DEPOSITOS_VENENO = "var DEPOSITOS = ['biblioteca_pacotes', 'biblioteca_itens', 'biblioteca_teoria', 'biblioteca_assets', 'midias', 'biblioteca_etiquetas', 'biblioteca_uso'];";
const L_ACHOU = 'contas.achou = true;';
const trocas = {};
if (VENENO) {
  trocas['/store.js'] = STORE_REPO
    .split(L_DEPOSITOS).join(DEPOSITOS_VENENO + EOL + '    return abrir()')
    .split(L_ACHOU).join(L_ACHOU + " t.objectStore('biblioteca_etiquetas').clear(); t.objectStore('biblioteca_uso').clear();");
}

const amb = H.criarAmbiente(PORTA, 'perfil_bib_remover', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'b7_remover_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });
const hojeIso = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();

const EX = '9ano:teorema-de-pitagoras:aplicacoes:ex:';
const ANEXO_ID = 'anexo-b7-remover';
const DEPOSITOS = ['biblioteca_pacotes', 'biblioteca_itens', 'biblioteca_teoria', 'biblioteca_assets',
  'biblioteca_uso', 'biblioteca_etiquetas'];

async function importar(pag, arquivo) {
  await H.irParaAba(pag, 'ajustes');
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar('importação', () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca'); return c ? c.innerText.trim() : '';
  }), v => /^Biblioteca importada\.|não foi importado/.test(v || ''), 90000);
  return r.valor || '';
}
async function contar(pag) {
  const saida = {};
  for (const d of DEPOSITOS) saida[d] = await H.contarDeposito(pag, d);
  saida.miniaturas = await pag.evaluate(() => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => {
      const b = q.result;
      const c = b.transaction('midias', 'readonly').objectStore('midias').getAllKeys();
      c.onsuccess = () => { b.close(); r(c.result.filter(k => String(k).indexOf('bib:') === 0).length); };
      c.onerror = () => { b.close(); r(-1); };
    };
    q.onerror = () => r(-2);
  }));
  return saida;
}
const lerDela = pag => pag.evaluate(() => Promise.all([Store.etiquetasDaBiblioteca(), Store.usoDaBiblioteca()])
  .then(r => JSON.stringify({
    etiquetas: (r[0] || []).map(e => e.itemId + '=' + e.dificuldade).sort(),
    uso: (r[1] || []).map(u => u.itemId + '@' + u.aulaId).sort()
  })));
const cartoesDePacote = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#lista-pacotes-biblioteca .cartao')).map(c => ({
  titulo: c.querySelector('div').textContent.trim(),
  botoes: Array.from(c.querySelectorAll('button')).map(b => b.textContent.trim()).join(',')
})));

(async () => {
  if (VENENO) {
    secao('O veneno é de verdade');
    conf('o store.js servido ficou DIFERENTE do repositório', trocas['/store.js'] !== STORE_REPO ? 'diferente' : 'IGUAL', 'diferente');
    conf('a lista de depósitos da remoção foi trocada uma vez', STORE_REPO.split(L_DEPOSITOS).length - 1, 1);
    conf('e o clear das duas entrou uma vez', STORE_REPO.split(L_ACHOU).length - 1, 1);
  }
  await amb.subir();
  const pag = await amb.pagina();
  const perguntas = [];
  pag.on('dialog', d => { perguntas.push(d.message()); });
  await H.abrirApp(pag, amb.ORIGEM);

  const zip = path.join(TMP, 'nono.zip');
  Sintetico.gerar(zip, {});
  conf('importou o pacote sintético', /^Biblioteca importada\./.test(await importar(pag, zip)), true);

  // ================================================================
  secao('0. O trabalho dela: etiquetas, uso e uma aula com material anexado');
  const alunoId = await pag.evaluate(async (h, ex, anexoId) => {
    const d = await Store.carregar();
    const aluno = d.alunos[0];
    d.aulas.push({ id: 'aula-b7-remover', alunoId: aluno.id, serieId: null, destacada: false, data: h, hora: '07:00',
      duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', temNota: false,
      anexos: [{ id: anexoId, nome: 'material-da-biblioteca.pdf', tamanho: 4096 }],
      temas: [{ titulo: 'Teorema de Pitágoras', fonte: 'biblioteca', modulo: '9ano:teorema-de-pitagoras', anexoId: anexoId }] });
    await Store.salvarAnexo(anexoId, { nome: 'material-da-biblioteca.pdf', tipo: 'application/pdf',
      blob: new Blob([new Uint8Array(4096)], { type: 'application/pdf' }) });
    await Store.salvar(d);
    await Store.gravarEtiquetaBiblioteca({ itemId: ex + '1', dificuldade: 3, data: '2026-09-20' });
    await Store.gravarEtiquetaBiblioteca({ itemId: ex + '4', dificuldade: 1, data: '2026-09-20' });
    await Store.registrarUsoBiblioteca({ itemId: ex + '1', alunoId: aluno.id, aulaId: 'aula-b7-remover', data: '2026-09-20' });
    await Store.registrarUsoBiblioteca({ itemId: ex + '2', alunoId: aluno.id, aulaId: 'aula-b7-remover', data: '2026-09-20' });
    return aluno.id;
  }, hojeIso, EX, ANEXO_ID);
  conf('a aula e o aluno ficaram gravados', !!alunoId, true);
  // o app precisa reler o banco: a aula foi gravada por fora da memória dele
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  // uma miniatura de verdade em 'midias', desenhada ao abrir a lista
  await H.irParaAba(pag, 'biblioteca');
  await esperar('a árvore da biblioteca', () => pag.evaluate(() =>
    Array.from(document.querySelectorAll('#bib-corpo .item-lista .nome')).some(x => x.textContent.trim() === 'Teorema de Pitágoras')), v => v === true, 20000);
  await pag.evaluate(() => {
    const l = Array.from(document.querySelectorAll('#bib-corpo .item-lista')).find(x => x.querySelector('.nome').textContent.trim() === 'Teorema de Pitágoras');
    if (l) l.click();
  });
  await pausa(300);
  await pag.evaluate(() => {
    const l = Array.from(document.querySelectorAll('#bib-corpo .item-lista')).find(x => x.querySelector('.nome').textContent.trim() === 'Aplicações do Teorema');
    if (l) l.click();
  });
  const comMini = await esperar('miniaturas guardadas', () => contar(pag).then(c => c.miniaturas), v => v > 0, 25000);
  conf('o tablet chegou a guardar miniaturas do pacote', comMini.ok, true);

  const antes = await contar(pag);
  const delaAntes = await lerDela(pag);
  secao('Contagem ANTES: ' + JSON.stringify(antes));
  conf('o pacote está gravado', antes.biblioteca_pacotes, 1);
  conf('com os exercícios', antes.biblioteca_itens > 0, true);
  conf('com a teoria', antes.biblioteca_teoria > 0, true);
  conf('com as imagens', antes.biblioteca_assets > 0, true);
  conf('as duas etiquetas dela estão lá', antes.biblioteca_etiquetas, 2);
  conf('e os dois registros de uso também', antes.biblioteca_uso, 2);

  // ================================================================
  secao('1. Ajustes: o botão Remover e a pergunta');
  await H.irParaAba(pag, 'ajustes');
  const cartoes = await esperar('o cartão do pacote', () => cartoesDePacote(pag), v => v && v.length === 1, 10000);
  conf('há um cartão de pacote em Ajustes', cartoes.ok, true);
  conf('e ele tem o botão Remover', cartoes.valor && cartoes.valor[0].botoes, 'Remover');
  const titulo = cartoes.valor[0].titulo;
  perguntas.length = 0;
  await pag.evaluate(() => document.querySelector('#lista-pacotes-biblioteca button[data-remover-pacote]').click());
  const removeu = await esperar('a remoção terminar', () => pag.evaluate(() =>
    (document.querySelector('#aviso-texto') || {}).textContent || ''), v => /Série removida do tablet/.test(v || ''), 30000);
  conf('a pergunta apareceu antes de remover', perguntas.length, 1);
  const p = perguntas[0] || '';
  conf('e ela nomeia a série', p.indexOf(titulo) >= 0, true);
  conf('e diz quanto espaço volta', /Voltam .*MB de espaço\./.test(p), true);
  conf('e diz que as etiquetas dela ficam', /etiquetas de dificuldade/.test(p), true);
  conf('e que o registro de uso fica', /já\s+usou com cada aluno/.test(p), true);
  conf('e que o material anexado continua abrindo', /anexado nas aulas continua abrindo/.test(p), true);
  conf('e que dá para importar de novo', /importar o pacote outra vez do Drive/.test(p), true);
  conf('a tela avisa que removeu', removeu.ok, true);

  // ================================================================
  secao('2 e 3. A contagem depois: sai o pacote, fica o que é dela');
  const depois = await contar(pag);
  secao('Contagem DEPOIS: ' + JSON.stringify(depois));
  const delaDepois = await lerDela(pag);
  if (VENENO) {
    conf('VENENO ENXERGADO: as etiquetas dela foram junto', depois.biblioteca_etiquetas, 0);
    conf('VENENO ENXERGADO: o registro de uso foi junto', depois.biblioteca_uso, 0);
    conf('e o que ela tinha não é mais o que ela tem', delaDepois === delaAntes, false);
    throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
  }
  conf('o registro do pacote saiu', depois.biblioteca_pacotes, 0);
  conf('os exercícios saíram', depois.biblioteca_itens, 0);
  conf('a teoria saiu', depois.biblioteca_teoria, 0);
  conf('as imagens saíram', depois.biblioteca_assets, 0);
  conf('as miniaturas saíram de midias', depois.miniaturas, 0);
  conf('AS ETIQUETAS DELA FICARAM', depois.biblioteca_etiquetas, antes.biblioteca_etiquetas);
  conf('O REGISTRO DE USO FICOU', depois.biblioteca_uso, antes.biblioteca_uso);
  conf('e registro por registro, nada mudou', delaDepois, delaAntes);

  // ================================================================
  secao('4. A aba volta ao "Em construção" e Ajustes fica sem pacote');
  conf('nenhum cartão de pacote sobrou em Ajustes', (await cartoesDePacote(pag)).length, 0);
  conf('o botão de exportar etiquetas se esconde',
    await pag.evaluate(() => document.querySelector('#exportar-etiquetas').hidden), true);
  /* A seleção estava CHEIA quando a série saiu: é o caso em que a faixa do
   * carrinho ficava contando exercícios que já não existem, com o "Gerar
   * material" ligado sobre o nada. Achado no marco visual do B7. */
  await pag.evaluate(c => localStorage.setItem('apoio-educacional:bib-carrinho', JSON.stringify(c)),
    { itens: [EX + '1', EX + '2', EX + '3'], paginas: [] });
  await H.irParaAba(pag, 'agenda');
  await H.irParaAba(pag, 'biblioteca');
  const vazia = await esperar('Em construção', () => pag.evaluate(() =>
    (document.querySelector('#biblioteca-em-construcao') || {}).textContent || ''), v => !!v, 15000);
  conf('a aba Biblioteca volta ao "Em construção"',
    (vazia.valor || '').indexOf('Em construçãoEsta área está sendo preparada.'), 0);
  /* O caminho de volta não pode viver só no aviso, que some em segundos: ela
   * pode chegar nesta tela minutos depois e precisa saber o que fazer. */
  conf('e a tela diz onde importar de novo, sem depender do aviso',
    await pag.evaluate(() => (document.querySelector('#biblioteca-onde-importar') || {}).textContent || ''),
    'Para trazer uma biblioteca para este tablet, vá em Ajustes, no cartão Biblioteca, e toque em Importar biblioteca.');
  const semFantasma = await pag.evaluate(() => ({
    faixa: document.querySelector('#bib-carrinho').hidden,
    texto: document.querySelector('#bib-carrinho').textContent.trim(),
    gerar: !!document.querySelector('#bib-carrinho-gerar'),
    contexto: document.querySelector('#bib-contexto').hidden,
    guardado: localStorage.getItem('apoio-educacional:bib-carrinho')
  }));
  conf('a faixa do material some junto com a biblioteca', semFantasma.faixa, true);
  conf('sem contar exercício que não existe mais', semFantasma.texto, '');
  conf('sem "Gerar material" sobre o nada', semFantasma.gerar, false);
  conf('e a faixa da aula de origem também some', semFantasma.contexto, true);
  conf('a seleção órfã sai também do aparelho', semFantasma.guardado, '{"itens":[],"paginas":[]}');

  // ================================================================
  secao('5. A aula com material anexado continua abrindo');
  const anexo = await pag.evaluate(id => Store.lerAnexo(id).then(r => (r && r.blob ? r.blob.size : -1)), ANEXO_ID);
  conf('o arquivo do anexo continua gravado', anexo, 4096);
  await H.irParaAba(pag, 'agenda');
  for (let i = 0; i < 24; i++) {
    if (await pag.evaluate(h => !!document.querySelector('[data-dia="' + h + '"]'), hojeIso)) break;
    await pag.click(i < 12 ? '#mes-seguinte' : '#mes-anterior');
    await pausa(120);
  }
  await pag.evaluate(h => {
    const p = Array.from(document.querySelectorAll('[data-dia="' + h + '"] .pilula')).find(x => x.textContent.indexOf('07:00') === 0);
    if (p) p.click();
  }, hojeIso);
  const naAula = await esperar('a aula com o anexo', () => pag.evaluate(() => {
    if (!document.querySelector('#modal-aula.aberto')) return null;
    const l = document.querySelector('#lista-anexos .item-lista');
    return { anexo: l ? l.querySelector('.nome').textContent.trim() : '(nenhum)',
      assunto: (document.querySelector('#corpo-modal-aula .item-assunto-aula .nome') || {}).textContent || '' };
  }), v => !!v, 15000);
  conf('a aula abriu com o anexo na lista', naAula.valor && naAula.valor.anexo, 'material-da-biblioteca.pdf');
  conf('e o assunto da biblioteca continua registrado', /Teorema de Pitágoras/.test((naAula.valor || {}).assunto || ''), true);
  await pag.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#lista-anexos button')).find(x => x.textContent.trim() === 'Abrir');
    if (b) b.click();
  });
  await pausa(600);
  conf('tocar em Abrir não quebra nada', pag.errosDePagina.join(' | '), '');
  await pag.evaluate(() => { const f = document.querySelector('#modal-aula .fechar'); if (f) f.click(); });
  await pausa(250);

  // ================================================================
  secao('6. Importando de novo, ela reencontra o que era dela');
  conf('importou o pacote de novo', /^Biblioteca importada\./.test(await importar(pag, zip)), true);
  const voltou = await contar(pag);
  conf('o pacote está de volta', voltou.biblioteca_pacotes, 1);
  conf('com os mesmos exercícios', voltou.biblioteca_itens, antes.biblioteca_itens);
  conf('com a mesma teoria', voltou.biblioteca_teoria, antes.biblioteca_teoria);
  conf('com as mesmas imagens', voltou.biblioteca_assets, antes.biblioteca_assets);
  conf('e as etiquetas e o uso dela continuam sendo os mesmos', await lerDela(pag), delaAntes);
  await H.irParaAba(pag, 'biblioteca');
  /* Ela pode voltar dentro do módulo em que estava (a navegação guardada
   * sobrevive à remoção): sobe até a lista de módulos antes de conferir. */
  for (let k = 0; k < 5; k++) {
    const v = await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) { b.click(); return true; } return false; });
    if (!v) break;
    await pausa(200);
  }
  const deVolta = await esperar('a árvore de volta', () => pag.evaluate(() =>
    Array.from(document.querySelectorAll('#bib-corpo .item-lista .nome')).some(x => x.textContent.trim() === 'Teorema de Pitágoras')), v => v === true, 25000);
  conf('a aba Biblioteca volta a mostrar os módulos', deVolta.ok, true);

  // ================================================================
  secao('7. Nenhum erro');
  conf('nenhum erro de JavaScript', pag.errosDePagina.join(' | '), '');
  conf('nenhum pedido deu 404', amb.quatrocentos.join(', '), '');
})().then(() => H.fim(amb)(), e => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e)));
