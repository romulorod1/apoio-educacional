/* testa_minhas_listas.js
 *
 * C2a: "Minhas listas". O pedido dela de 23/09 era montar uma vez, guardar com
 * nome e reusar com outro aluno. As listas moram no depósito
 * biblioteca_listas (store.js, banco v3), entram na cópia de segurança, e as
 * "Seleções anteriores" do localStorage viram listas guardadas pelo
 * aplicativo na primeira abertura.
 *
 * Banco fictício ("Aluna Alfa Teste") e pacote sintético
 * (_pacote_sintetico.js), porque a prova tira print.
 *
 * O que se prova:
 *   0. sem navegador: banco v3 com o depósito novo; a cópia leva as listas; a
 *      restauração as repõe na mesma transação; o apagar tudo as leva;
 *   1. migração: o que estava no diário (localStorage) vira lista guardada
 *      pelo aplicativo no depósito, e sai do diário; nenhuma "Seleções
 *      anteriores" na tela;
 *   2. criar: "Salvar esta seleção como lista" no fim do Preparar aula, com
 *      nome e nível; a janela passa a dizer que a seleção está em Minhas listas;
 *   3. o cartão: nome, nível, assunto, quantidade e tempo estimado;
 *   4. duplicar;
 *   5. editar a cópia: nome, nível, descer, tirar e pôr o marcado; a ordem
 *      gravada é a da tela;
 *   6. usar: "Preparar aula com esta lista" põe a lista no material, na ordem
 *      dela; anexar numa aula registra o uso com o id da lista, e o cartão diz
 *      com quem e quando;
 *   7. apagar, e o Desfazer devolve;
 *   8. cópia de segurança: exportar e restaurar devolve as listas; cópia
 *      antiga, sem o campo, não apaga as que o tablet tem;
 *   9. as guardadas pelo aplicativo ficam nas três mais novas.
 *
 * Modos envenenados, um por regra:
 *   --envenenado-sem-espelho     a abertura não migra o diário para o depósito.
 *   --envenenado-copia-sem-listas a cópia de segurança não leva as listas.
 *   --envenenado-uso-sem-lista   o uso não guarda o id da lista.
 *   --envenenado-ordem-velha     o Guardar do editor grava a ordem de antes.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8840;
const MODOS = ['--envenenado-sem-espelho', '--envenenado-copia-sem-listas', '--envenenado-uso-sem-lista',
  '--envenenado-ordem-velha'];
const MODO = MODOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const STORE = fs.readFileSync(path.join(H.RAIZ, 'store.js'), 'utf8');

// uma linha só: âncora de várias linhas depende do final de linha do arquivo
const ESPELHO_NA_ABERTURA = '      return espelharAnteriores();';
const COPIA_LEVA = 'listas: bib[2] || []';
const USO_LEVA = 'listaId: listaId });';
const ORDEM_DA_TELA = 'itens: r.itens.slice(), paginas: r.paginas.slice(), automatica: false';

function umaVez(texto, ancora) { return texto.split(ancora).length === 2; }
const trocas = {};
if (MODO === '--envenenado-sem-espelho') trocas['/app.js'] = APP.split(ESPELHO_NA_ABERTURA).join('      return null;');
if (MODO === '--envenenado-copia-sem-listas') trocas['/store.js'] = STORE.split(COPIA_LEVA).join('nada: 0');
if (MODO === '--envenenado-uso-sem-lista') trocas['/app.js'] = APP.split(USO_LEVA).join('listaId: null });');
if (MODO === '--envenenado-ordem-velha') trocas['/app.js'] = APP.split(ORDEM_DA_TELA).join('itens: original.itens.slice(), paginas: r.paginas.slice(), automatica: false');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'c2a_listas_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

const LISTA2 = Sintetico.LISTAS.filter(l => l.modulo.indexOf('equacoes') >= 0 && l.nivel === 2)[0];
const IDS2 = LISTA2.degraus.map(d => d.item);
const MOD_TITULO = 'Equações do Segundo Grau';
const CHAVE_SEL = 'apoio-educacional:bib-selecoes-anteriores';
const CHAVE_CARRINHO = 'apoio-educacional:bib-carrinho';

// ---------------------------------------------------------------- 0 (Node)
secao('0. Sem navegador: o banco, a cópia, a restauração e o apagar tudo');
conf('VERSAO_BANCO subiu para 3', /var VERSAO_BANCO = 3;/.test(STORE), true);
conf('o depósito biblioteca_listas é criado na subida', /createObjectStore\('biblioteca_listas', \{ keyPath: 'id' \}\)/.test(STORE), true);
conf('a cópia de segurança leva as listas', STORE.indexOf(COPIA_LEVA) >= 0, true);
conf('a restauração repõe as listas', /lis\.put\(r\)/.test(STORE), true);
conf('o apagar tudo leva as listas', STORE.indexOf("esvaziar('biblioteca_listas')") >= 0, true);
[['espelho na abertura', APP, ESPELHO_NA_ABERTURA], ['a cópia leva', STORE, COPIA_LEVA],
  ['o uso leva o id', APP, USO_LEVA], ['ordem da tela', APP, ORDEM_DA_TELA]]
  .forEach(([n, t, a]) => conf('âncora de veneno uma vez só: ' + n, umaVez(t, a), true));

const amb = H.criarAmbiente(PORTA, 'perfil_minhas_listas', trocas);

async function importar(pag, arquivo) {
  await H.irParaAba(pag, 'ajustes');
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar('importação', () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca'); return c ? c.innerText.trim() : '';
  }), v => /^Biblioteca importada\.|não foi importado/.test(v || ''), 90000);
  return r.valor || '';
}
const doDeposito = pag => pag.evaluate(() => Store.listasDaBiblioteca());
const diario = pag => pag.evaluate(k => JSON.parse(localStorage.getItem(k) || '[]'), CHAVE_SEL);
const carrinho = pag => pag.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null') || { itens: [], paginas: [] }, CHAVE_CARRINHO);
const textoDaTela = pag => pag.evaluate(() => document.querySelector('#tela-biblioteca').innerText);
const aviso = pag => pag.evaluate(() => document.querySelector('#aviso-texto').textContent);
const cartoes = pag => pag.evaluate(() => Array.from(document.querySelectorAll('.bib-minha-lista')).map(c => ({
  id: c.dataset.lista, texto: c.innerText.replace(/\s+/g, ' ').trim() })));
const tocarNoCartao = (pag, nome, acao) => pag.evaluate((n, a) => {
  const c = Array.from(document.querySelectorAll('.bib-minha-lista'))
    .find(x => x.querySelector('.bib-minha-nome').textContent === n);
  if (!c) return false;
  c.querySelector('[data-acao="' + a + '"]').click();
  return true;
}, nome, acao);
const irParaMinhas = async pag => {
  await H.irParaAba(pag, 'biblioteca');
  await pausa(300);
  await pag.evaluate(() => { const b = document.querySelector('#bib-abas [data-aba="minhas"]'); if (b) b.click(); });
  await pausa(400);
};
const fim = () => Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });

(async () => {
  if (MODO) {
    secao('O veneno é de verdade');
    const arq = trocas['/app.js'] !== undefined ? '/app.js' : '/store.js';
    conf('o ' + arq + ' servido ficou diferente do repositório (' + MODO + ')',
      trocas[arq] !== (arq === '/app.js' ? APP : STORE), true);
  }
  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);
  const zip = path.join(TMP, 'com-listas.zip');
  Sintetico.gerar(zip, { listas: true });
  conf('importou o pacote sintético', /^Biblioteca importada\./.test(await importar(pag, zip)), true);

  /* Banco fictício: uma aluna de teste e uma aula de hoje. */
  const hoje = await pag.evaluate(() => { const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); });
  await pag.evaluate(async h => {
    const d = await Store.carregar();
    d.alunos = [{ id: 'alfa', nome: 'Aluna Alfa Teste', ativo: true,
      precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 100 }] }];
    d.series = [];
    d.aulas = [{ id: 'aula-alfa', alunoId: 'alfa', serieId: null, destacada: false, data: h, hora: '16:00',
      duracaoMin: 60, status: 'agendada', cobravel: true, notaTexto: '', notaPrivada: '', temNota: false,
      anexos: [], temas: [], areas: [] }];
    d.resumos = [];
    d.ajustes = Object.assign({}, d.ajustes, { versaoVista: '9.9.9' });
    await Store.salvar(d);
  }, hoje);

  // ================================================================
  secao('1. Migração: as seleções do diário viram listas guardadas pelo aplicativo');
  /* O que um tablet na versão anterior tem: duas seleções no localStorage, a
   * mais nova primeiro. */
  const agora = Date.now();
  const SEL_A = { itens: IDS2.slice(0, 3), paginas: [], quando: agora - 60000, lista: null };
  const SEL_B = { itens: IDS2.slice(2, 5), paginas: [], quando: agora - 120000, lista: null };
  await pag.evaluate((k, l) => localStorage.setItem(k, JSON.stringify(l)), CHAVE_SEL, [SEL_A, SEL_B]);
  await H.abrirApp(pag, amb.ORIGEM);
  await irParaMinhas(pag);
  const migradas = await esperar('as duas no depósito', () => doDeposito(pag),
    l => Array.isArray(l) && l.filter(x => x.automatica).length === 2, 5000);
  if (MODO === '--envenenado-sem-espelho') {
    secao('VENENO: a abertura não migra o diário');
    conf('envenenado: o depósito ficou sem as seleções (defeito enxergado)', migradas.ok, false);
    throw fim();
  }
  conf('as duas seleções viraram listas no depósito', migradas.ok, true);
  conf('com os mesmos exercícios, na mesma ordem',
    JSON.stringify(migradas.valor.map(x => x.itens.join('|')).sort()), JSON.stringify([SEL_A, SEL_B].map(x => x.itens.join('|')).sort()));
  conf('e saíram do diário', (await diario(pag)).length, 0);
  const tela1 = await textoDaTela(pag);
  conf('a aba diz quantas há', /Minhas listas \(2\)/.test(tela1), true);
  // sem caixa: o título da seção é desenhado em maiúsculas pelo CSS, e o innerText segue o desenho
  conf('e mostra a seção das guardadas pelo aplicativo', /Guardadas pelo aplicativo/i.test(tela1), true);
  conf('sem "Seleções anteriores" na tela', /Seleções anteriores/.test(await pag.evaluate(() => document.body.innerText)), false);

  // ================================================================
  secao('2. Criar: "Salvar esta seleção como lista" no fim do Preparar aula');
  /* O material com a lista pronta inteira, posto por fora (é preparação):
   * o carrinho do aparelho, e a página recarregada. */
  await pag.evaluate((k, ids) => localStorage.setItem(k, JSON.stringify({ itens: ids, paginas: [] })), CHAVE_CARRINHO, IDS2);
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'biblioteca');
  await pausa(400);
  await pag.click('#bib-carrinho-gerar');
  await esperar('o Preparar aula abriu', () => pag.evaluate(() => !!document.querySelector('#bib-salvar-lista-nome')), v => v === true, 5000);
  await pag.evaluate(() => { const c = document.querySelector('#bib-salvar-lista-nome'); c.value = ''; });
  await pag.type('#bib-salvar-lista-nome', 'Equações, alunos de prova');
  await pag.click('#bib-salvar-lista-nivel [data-nivel="regular"]');
  await pag.click('#bib-salvar-lista-guardar');
  const criada = await esperar('a lista no depósito', () => doDeposito(pag),
    l => Array.isArray(l) && l.some(x => x.titulo === 'Equações, alunos de prova'), 5000);
  conf('a lista com nome está no depósito', criada.ok, true);
  const L1 = (criada.valor || []).filter(x => x.titulo === 'Equações, alunos de prova')[0] || {};
  conf('com o nível escolhido', L1.nivel, 'regular');
  conf('com os exercícios do material, na ordem dele', (L1.itens || []).join('|'), IDS2.join('|'));
  conf('e não é das guardadas pelo aplicativo', L1.automatica, false);
  conf('a janela passa a dizer que a seleção está em Minhas listas',
    await pag.evaluate(() => (document.querySelector('#bib-salvar-lista-ja') || {}).textContent || ''),
    'Esta seleção está em Minhas listas: Equações, alunos de prova.');
  await pag.evaluate(() => document.querySelectorAll('.fundo-modal.aberto [data-fechar]').forEach(b => b.click()));
  await pausa(300);

  // ================================================================
  secao('3. O cartão: nome, nível, assunto, quantidade e tempo');
  await irParaMinhas(pag);
  const c3 = (await cartoes(pag)).filter(c => c.id === L1.id)[0] || { texto: '' };
  conf('o cartão está na tela', !!c3.id, true);
  conf('com o nome', c3.texto.indexOf('Equações, alunos de prova') === 0, true);
  conf('o nível', /Regular/.test(c3.texto), true);
  conf('o assunto', c3.texto.indexOf(MOD_TITULO) >= 0, true);
  conf('quantos exercícios', /5 exercícios/.test(c3.texto), true);
  const minutos = Math.round(LISTA2.degraus.reduce((s, d) => s + d.minutos, 0));
  conf('e o tempo estimado, dos minutos do pacote', c3.texto.indexOf('Cerca de ' + minutos + ' minutos (estimativa)') >= 0, true);
  conf('e ainda não foi usada', /Ainda não usada com nenhum aluno/.test(c3.texto), true);
  if (process.env.SALVAR_PRINTS && !MODO) {
    await pag.screenshot({ path: path.join(process.env.SALVAR_PRINTS, 'depois_minhas_listas.png') });
  }

  // ================================================================
  secao('4. Duplicar');
  await tocarNoCartao(pag, 'Equações, alunos de prova', 'duplicar');
  const dup = await esperar('a cópia no depósito', () => doDeposito(pag),
    l => Array.isArray(l) && l.some(x => x.titulo === 'Equações, alunos de prova (cópia)'), 5000);
  conf('a cópia está no depósito', dup.ok, true);
  const L2 = (dup.valor || []).filter(x => x.titulo === 'Equações, alunos de prova (cópia)')[0] || {};
  conf('com outro id', !!L2.id && L2.id !== L1.id, true);
  conf('e os mesmos exercícios', (L2.itens || []).join('|'), IDS2.join('|'));

  // ================================================================
  secao('5. Editar a cópia: nome, nível, descer, tirar e pôr o marcado');
  await pausa(300);
  await tocarNoCartao(pag, 'Equações, alunos de prova (cópia)', 'editar');
  await esperar('o editor abriu', () => pag.evaluate(() => !!document.querySelector('#bib-minha-nome')), v => v === true, 5000);
  await pag.evaluate(() => { document.querySelector('#bib-minha-nome').value = ''; });
  await pag.type('#bib-minha-nome', 'Equações, aprofundamento');
  await pag.click('#bib-minha-nivel [data-nivel="aprofundamento"]');
  await pausa(200);
  // desce o primeiro, e tira o último
  await pag.evaluate(() => document.querySelector('#bib-minha-itens li:first-child [data-acao="descer"]').click());
  await pausa(200);
  await pag.evaluate(() => document.querySelector('#bib-minha-itens li:last-child [data-acao="tirar"]').click());
  await pausa(200);
  const ordemNaTela = await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-minha-itens li')).map(li => li.dataset.id));
  const esperada = [IDS2[1], IDS2[0], IDS2[2], IDS2[3]];
  conf('a tela mostra a ordem nova, sem o último', ordemNaTela.join('|'), esperada.join('|'));
  /* O último continua marcado no material (o carrinho tem a lista inteira):
   * o editor oferece pôr de volta, no fim. */
  conf('o editor oferece pôr o marcado que não está na lista',
    await pag.evaluate(() => (document.querySelector('#bib-minha-por') || {}).textContent || ''), 'Pôr o marcado no fim da lista');
  await pag.click('#bib-minha-por');
  await pausa(200);
  const esperadaComPor = esperada.concat([IDS2[4]]);
  conf('e ele volta no fim', (await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-minha-itens li')).map(li => li.dataset.id))).join('|'),
    esperadaComPor.join('|'));
  await pag.click('#bib-minha-guardar');
  const editada = await esperar('a edição no depósito', () => doDeposito(pag),
    l => Array.isArray(l) && l.some(x => x.id === L2.id && x.titulo === 'Equações, aprofundamento'), 5000);
  conf('o nome novo está no depósito', editada.ok, true);
  const L2e = (editada.valor || []).filter(x => x.id === L2.id)[0] || {};
  conf('e o nível novo', L2e.nivel, 'aprofundamento');
  if (MODO === '--envenenado-ordem-velha') {
    secao('VENENO: o Guardar grava a ordem de antes');
    conf('envenenado: a ordem gravada não é a da tela (defeito enxergado)', (L2e.itens || []).join('|') === esperadaComPor.join('|'), false);
    throw fim();
  }
  conf('e a ordem gravada é a da tela', (L2e.itens || []).join('|'), esperadaComPor.join('|'));

  // ================================================================
  secao('6. Usar: Preparar aula com esta lista, anexar, e o cartão diz com quem');
  await pausa(300);
  await tocarNoCartao(pag, 'Equações, aprofundamento', 'preparar');
  await esperar('o Preparar aula abriu', () => pag.evaluate(() => !!document.querySelector('#bib-gerar-anexar')), v => v === true, 5000);
  conf('o material é a lista, na ordem dela', (await carrinho(pag)).itens.join('|'), esperadaComPor.join('|'));
  conf('e a janela diz que é uma das Minhas listas',
    await pag.evaluate(() => (document.querySelector('#bib-salvar-lista-ja') || {}).textContent || ''),
    'Esta seleção está em Minhas listas: Equações, aprofundamento.');
  await pag.evaluate(() => { const b = document.querySelector('#bib-gerar-aulas [data-aula="aula-alfa"]'); if (b) b.click(); });
  await pausa(200);
  await pag.click('#bib-gerar-anexar');
  const usou = await esperar('o uso registrado', () => pag.evaluate(() => Store.usoDaBiblioteca()),
    l => Array.isArray(l) && l.some(r => r.aulaId === 'aula-alfa'), 60000);
  conf('o anexo registrou o uso', usou.ok, true);
  const comLista = (usou.valor || []).filter(r => r.aulaId === 'aula-alfa' && r.listaId === L2.id).length;
  await pausa(800);
  await pag.evaluate(() => document.querySelectorAll('.fundo-modal.aberto [data-fechar]').forEach(b => b.click()));
  await irParaMinhas(pag);
  await pausa(600);
  const c6 = (await cartoes(pag)).filter(c => c.id === L2.id)[0] || { texto: '' };
  if (MODO === '--envenenado-uso-sem-lista') {
    secao('VENENO: o uso não guarda o id da lista');
    conf('envenenado: o cartão não diz com quem foi (defeito enxergado)', /Usada com Aluna Alfa Teste/.test(c6.texto), false);
    throw fim();
  }
  conf('cada exercício do uso leva o id da lista', comLista, esperadaComPor.length);
  conf('o cartão diz com quem foi', /Usada com Aluna Alfa Teste/.test(c6.texto), true);
  const [aa, mm, dd] = hoje.split('-');
  conf('e quando foi a última vez', c6.texto.indexOf('Última vez em ' + dd + '/' + mm + '/' + aa) >= 0, true);

  // ================================================================
  secao('7. Apagar, e o Desfazer devolve');
  await tocarNoCartao(pag, 'Equações, alunos de prova', 'apagar'); // o confirm é aceito pelo arnês
  const apagou = await esperar('a lista sair do depósito', () => doDeposito(pag),
    l => Array.isArray(l) && !l.some(x => x.id === L1.id), 5000);
  conf('a lista saiu do depósito', apagou.ok, true);
  conf('o aviso oferece Desfazer', await pag.evaluate(() =>
    getComputedStyle(document.querySelector('#aviso-acao')).display !== 'none' && document.querySelector('#aviso-acao').textContent), 'Desfazer');
  await pag.click('#aviso-acao');
  const voltou = await esperar('a lista voltar', () => doDeposito(pag), l => Array.isArray(l) && l.some(x => x.id === L1.id), 5000);
  conf('o Desfazer devolve a lista', voltou.ok, true);

  // ================================================================
  secao('8. Cópia de segurança: exportar e restaurar devolve as listas');
  const antes8 = (await doDeposito(pag)).map(x => x.id).sort().join(',');
  const copia = await pag.evaluate(async () => {
    const p = await Store.exportarTudo(await Store.carregar());
    return JSON.parse(JSON.stringify(p));
  });
  // as listas saem do tablet, e a cópia é restaurada pelo mesmo caminho da tela
  await pag.evaluate(async () => {
    const l = await Store.listasDaBiblioteca();
    for (const x of l) await Store.apagarListaBiblioteca(x.id);
  });
  conf('as listas saíram do tablet', (await doDeposito(pag)).length, 0);
  await pag.evaluate(async p => { await Store.importarTudo(p); }, copia);
  const depois8 = (await doDeposito(pag)).map(x => x.id).sort().join(',');
  if (MODO === '--envenenado-copia-sem-listas') {
    secao('VENENO: a cópia não leva as listas');
    conf('envenenado: as listas não voltaram (defeito enxergado)', depois8 === antes8, false);
    throw fim();
  }
  conf('a cópia leva as listas', Array.isArray(copia.biblioteca && copia.biblioteca.listas) && copia.biblioteca.listas.length > 0, true);
  conf('e restaurar devolve todas', depois8, antes8);
  // cópia antiga, sem o campo: as listas do tablet ficam
  const semCampo = JSON.parse(JSON.stringify(copia));
  delete semCampo.biblioteca.listas;
  await pag.evaluate(async p => { await Store.importarTudo(p); }, semCampo);
  conf('cópia feita antes das listas não apaga as do tablet', (await doDeposito(pag)).map(x => x.id).sort().join(','), antes8);

  // ================================================================
  secao('9. As guardadas pelo aplicativo ficam nas três mais novas');
  const quatro = [0, 1, 2, 3].map(k => ({ itens: [IDS2[k]], paginas: [], quando: Date.now() - k * 1000, lista: null }));
  await pag.evaluate((k, l) => localStorage.setItem(k, JSON.stringify(l)), CHAVE_SEL, quatro.slice(0, 3));
  await H.abrirApp(pag, amb.ORIGEM);
  await irParaMinhas(pag);
  const tres = await esperar('as automáticas assentarem', () => doDeposito(pag),
    l => Array.isArray(l) && l.filter(x => x.automatica).length === 3, 5000);
  conf('ficam três guardadas pelo aplicativo', tres.ok, true);
  conf('as três mais novas', (tres.valor || []).filter(x => x.automatica).map(x => x.itens[0]).sort().join('|'),
    [IDS2[0], IDS2[1], IDS2[2]].sort().join('|'));
  conf('e as dela continuam', (tres.valor || []).filter(x => !x.automatica).length, 2);

  secao('10. Nenhum erro');
  conf('nenhum erro de página', pag.errosDePagina.join(' | '), '');
  conf('nenhum pedido deu 404', amb.quatrocentos.join(', '), '');
})().then(() => H.fim(amb)(), e => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e)));
