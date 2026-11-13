/* testa_voltar_android.js
 *
 * FILA 2b: o Voltar do aparelho dentro do aplicativo. Relato do dono em
 * 12/11: na Biblioteca, o Voltar do tablet FECHAVA o app. O histórico só
 * conhecia as janelas; agora cada passo de navegação deixa uma entrada com o
 * retrato da tela no history.state, e o Voltar devolve a tela de antes, com
 * a rolagem, inclusive depois de recarregar.
 *
 * No Chrome de verdade, com os pacotes SINTÉTICOS do 9º ano e do Banco
 * (_pacote_sintetico.js) e os livros SINTÉTICOS do gerador
 * (fazer_amostra_livros.py --pacote). O Voltar é o do navegador
 * (history.back()), o mesmo evento do Android. Cada caminho começa numa aba
 * nova (histórico limpo) e CONTA os toques: nenhum laço absorve Voltar morto.
 *
 * O que prova:
 *   1. aba, módulo e lista: Agenda, Biblioteca, módulo, lista; três Voltar
 *      desfazem os três passos, a rolagem volta, e o quarto avisa "Toque em
 *      Voltar de novo para sair." sem sair;
 *   2. a guarda da raiz volta: depois do aviso, um toque numa aba e o Voltar
 *      voltam à Agenda, e o Voltar seguinte avisa de novo; o outro sai;
 *   3. a seta de voltar da própria tela tira a entrada: depois dela, o Voltar
 *      do aparelho desfaz o passo de antes, e não reabre o módulo;
 *   4. livro e capítulo: o Voltar fecha o leitor e fica na tela do livro, e o
 *      seguinte fecha a tela do livro;
 *   5. janela aberta sobre uma tela (a aula): o Voltar fecha a janela;
 *   6. busca com termo: abrir um resultado e dar Voltar volta aos resultados,
 *      com o termo no campo;
 *   7. o editor de Minhas listas com rascunho: o Voltar pergunta o mesmo que a
 *      seta; "Cancelar" fica no editor com o texto, "OK" volta à lista;
 *   8. recarga no meio: Biblioteca, módulo, recarregar; o Voltar continua
 *      voltando, um passo por toque, até o aviso;
 *   9. no celular: a folha da aula de Hoje fecha pelo Voltar (sem o aviso de
 *      sair por cima), a ficha de um aluno fecha pelo Voltar, e o formulário
 *      com texto pergunta antes de sair;
 *  10. nenhum erro de página.
 *
 * Venenos (cada um TEM de ser visto):
 *   --envenenado-voltar-sem-tela   o Voltar sem janela não devolve a tela (o código de antes)
 *   --envenenado-volta-dois-passos o Voltar devolve a tela e anda mais um passo
 *   --envenenado-seta-nao-tira     a seta de voltar da tela deixa a entrada no histórico
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8961;
const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const VENENOS_DA_PROVA = {
  'voltar-sem-tela': ['if (!topo) { voltarDeTela(ev.state); return; }', 'if (!topo) return;'],
  'volta-dois-passos': ['if (estado.retrato && !mesmaTela(estado.retrato, atual)) { restaurarTela(estado.retrato); return; }',
    'if (estado.retrato && !mesmaTela(estado.retrato, atual)) { restaurarTela(estado.retrato); history.back(); return; }'],
  'seta-nao-tira': ["      // a seta de voltar da tela levou de volta ao lugar de antes: a entrada sai\n      retornoProgramado = true;\n      history.back();\n      return;",
    '      // veneno: a entrada fica'],
  // a pergunta do editor de Minhas listas some
  'pergunta-da-lista-some': ["    if (!modoCelular && bibNav.minhas && bibNav.minhas.editar && typeof editorDeListaMudou === 'function' && editorDeListaMudou()) {",
    '    if (false) {'],
  // a folha da aula no celular fica fora do histórico
  'folha-fora-do-historico': ['    folhaNoHistorico = true;\n    guardaNaRaiz();', '    return;'],
  // a pergunta do formulário do celular some
  'pergunta-do-formulario-some': ['    if (modoCelular && (formCelular || (alunoCelular && editandoFichaAlunoCelular)) && camposMudaram()) {', '    if (false) {'],
  // a janela aberta sobre a raiz não repõe a guarda
  'guarda-depois-da-janela': ["        if (typeof guardaNaRaiz === 'function') guardaNaRaiz();", '        void 0;'],
  // a volta para a Biblioteca logo depois de recarregar desenha sem a Biblioteca carregada
  'sem-ramo-bib': ['            if (!bib) {\n              // a Biblioteca ainda está carregando', '            if (false) {\n              // a Biblioteca ainda está carregando']
};
const VENENOS = ['--envenenado-voltar-sem-tela', '--envenenado-volta-dois-passos', '--envenenado-seta-nao-tira',
  '--envenenado-pergunta-da-lista-some', '--envenenado-folha-fora-do-historico', '--envenenado-pergunta-do-formulario-some',
  '--envenenado-guarda-depois-da-janela', '--envenenado-sem-ramo-bib'];
const VENENO = Object.keys(VENENOS_DA_PROVA).find(k => process.argv.indexOf('--envenenado-' + k) !== -1) || null;
const PYTHON = process.env.PYTHON || 'python';
const trocas = {};
if (VENENO) trocas['/app.js'] = APP.split(VENENOS_DA_PROVA[VENENO][0]).join(VENENOS_DA_PROVA[VENENO][1]);
const amb = H.criarAmbiente(PORTA, 'perfil_voltar_android', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'voltar_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

// no modo veneno, cada verificação marcada com o veneno TEM de reprovar; as outras não contam
const visto = [];
const checa = (rotulo, obtido, esperado, venenos) => {
  if (VENENO) {
    if ((venenos || []).indexOf(VENENO) !== -1 && String(obtido) !== String(esperado)) visto.push(rotulo);
    return;
  }
  conf(rotulo, obtido, esperado);
};
const TODOS = ['voltar-sem-tela', 'volta-dois-passos'];

function gerarLivros() {
  const r = spawnSync(PYTHON, ['-X', 'utf8', path.join(H.RAIZ, 'biblioteca', '_amostra', 'fazer_amostra_livros.py'), TMP, '--pacote'], { encoding: 'utf8' });
  const linhas = String(r.stdout || '').trim().split(/\r?\n/);
  const zip = linhas[linhas.length - 1];
  return r.status === 0 && zip && fs.existsSync(zip) ? zip : null;
}
async function importar(pag, arquivo) {
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => { document.querySelector('#estado-importacao-biblioteca').innerHTML = ''; });
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  await esperar('importação de ' + path.basename(arquivo), () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca');
    return [c ? c.innerText.trim() : '', document.querySelector('#importar-biblioteca').disabled];
  }), v => !!v[0] && !/Conferindo|Gravando/.test(v[0]) && v[1] === false, 60000);
}
const clicar = (pag, sel) => pag.evaluate(s => { const b = document.querySelector(s); if (!b) return false; b.click(); return true; }, sel);
const tocarLinha = (pag, nome) => pag.evaluate(n => {
  const l = Array.from(document.querySelectorAll('#bib-corpo .item-lista')).find(x => x.querySelector('.nome') && x.querySelector('.nome').textContent.trim() === n);
  if (!l) return false; l.click(); return true;
}, nome);
const lugar = pag => pag.evaluate(() => {
  const titulo = document.querySelector('#bib-corpo .bib-titulo');
  const livro = document.querySelector('#bib-livro');
  return {
    aba: (document.querySelector('#abas .aba.ativa') || { dataset: {} }).dataset.tela || '',
    titulo: titulo ? titulo.textContent.trim() : '',
    livro: livro && !livro.hidden ? livro.dataset.livro || '' : '',
    leitor: !!document.querySelector('#modal-leitor-pdf.aberto'),
    aula: !!document.querySelector('#modal-aula.aberto'),
    termo: (document.querySelector('#busca-biblioteca') || {}).value || '',
    resultados: document.querySelectorAll('#bib-corpo .item-lista').length,
    nome: (document.querySelector('#bib-minha-nome') || {}).value,
    rolagem: Math.round(document.querySelector('.conteudo').scrollTop)
  };
});
// cada Voltar é um toque só; quem espera a tela é a condição, nunca um laço de toques
const voltar = pag => pag.evaluate(() => { history.back(); });
const avisos = pag => pag.evaluate(() => (window.__avisos || []).join('|'));
const ouvirAvisos = pag => pag.evaluate(() => {
  window.__avisos = [];
  const t = document.querySelector('#aviso-texto');
  new MutationObserver(() => window.__avisos.push(t.textContent)).observe(t, { childList: true, characterData: true, subtree: true });
});
let ORIGEM = '';
async function abaNova(navegador) {
  const p = await amb.pagina();
  p.on('pageerror', e => erros.push(e.message));
  p.removeAllListeners('dialog');  // o arnês aceita todo diálogo; aqui a prova escolhe a resposta
  p.on('dialog', d => { dialogos.push(d.message()); (p.__respostaDoDialogo === 'aceita' ? d.accept() : d.dismiss()).catch(() => {}); });
  await p.setViewport({ width: 1280, height: 800, hasTouch: true });
  await H.abrirApp(p, ORIGEM);
  await ouvirAvisos(p);
  void navegador;
  return p;
}
const erros = [], dialogos = [];
const esperarBib = pag => esperar('a Biblioteca desenhada', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .item-lista').length), v => v > 0, 10000);

(async () => {
  secao('0. A prova se confere');
  conf('a lista de venenos não está vazia', VENENOS.length > 0, true);
  conf('cada âncora de veneno aparece uma vez só no app.js',
    Object.keys(VENENOS_DA_PROVA).map(k => k + ':' + (APP.split(VENENOS_DA_PROVA[k][0]).length - 1)).join(','),
    Object.keys(VENENOS_DA_PROVA).map(k => k + ':1').join(','));
  if (VENENO) conf('o app.js servido está envenenado (' + VENENO + ')', trocas['/app.js'].indexOf(VENENOS_DA_PROVA[VENENO][0]) === -1, true);
  const zipEx = path.join(TMP, 'pacote_9ano.zip');
  Sintetico.gerar(zipEx);
  const zipBanco = path.join(TMP, 'banco.zip');
  Sintetico.gerarBanco(zipBanco);
  const zipLivros = gerarLivros();
  conf('os pacotes sintéticos foram gerados', !!zipLivros && fs.existsSync(zipEx), true);
  if (!zipLivros) throw Object.assign(new Error('sem pacote de livros'), { jaContado: true });

  await amb.subir();
  ORIGEM = amb.ORIGEM;
  const prep = await amb.pagina();
  prep.on('pageerror', e => erros.push(e.message));
  await prep.setViewport({ width: 1280, height: 800, hasTouch: true });
  await H.abrirApp(prep, ORIGEM);
  const hoje = await prep.evaluate(() => Core.hojeIso());
  await prep.evaluate(async h => {
    const d = await Store.carregar();
    d.alunos = [{ id: 'al_alfa', nome: 'Aluno Alfa Teste', ano: '9', anoEscolar: '9º ano do Ensino Fundamental', responsavel: 'Responsável Alfa',
      grade: 'quarta-feira, 10:00', vigencias: [{ id: 'v1', inicio: '2026-01-01', fim: '2027-12-31', valorHora: 100 }] }];
    d.aulas = [{ id: 'au_um', alunoId: 'al_alfa', serieId: null, data: h, hora: '10:00', duracaoMin: 60, status: 'agendada',
      cobravel: true, notaTexto: '', notaPrivada: '', temNota: false, anexos: [], temas: [] }];
    await Store.salvar(d);
  }, hoje);
  await H.abrirApp(prep, ORIGEM);
  await importar(prep, zipEx);
  await importar(prep, zipBanco);
  await importar(prep, zipLivros);
  // uma lista dela, para o editor de Minhas listas (seção 7)
  const umExercicio = await prep.evaluate(() => {
    const b = document.querySelector('#abas .aba[data-tela="biblioteca"]'); if (b) b.click();
    return null;
  });
  void umExercicio;
  await prep.evaluate(async () => {
    await Store.gravarListaBiblioteca({ id: 'ml_prova', titulo: 'Lista de prova', nivel: null, itens: ['prova:exercicio:1'], paginas: [], criadaEm: Date.now(), editadaEm: Date.now() });
  });
  await H.irParaAba(prep, 'agenda');
  await prep.close();

  try {
  secao('1. Aba, módulo e lista: um Voltar por passo, e o quarto avisa');
  let pag = await abaNova();
  conf('a aba nova abre na Agenda', (await lugar(pag)).aba, 'agenda');
  await clicar(pag, '#abas .aba[data-tela="biblioteca"]');
  await esperarBib(pag);
  const rolagemAntes = await pag.evaluate(() => { const c = document.querySelector('.conteudo'); c.scrollTop = Math.min(180, c.scrollHeight - c.clientHeight); return Math.round(c.scrollTop); });
  conf('entrou no módulo', await tocarLinha(pag, 'Equações do Segundo Grau'), true);
  await pausa(200);
  conf('entrou na lista', await tocarLinha(pag, 'Soma e Produto'), true);
  await pausa(300);
  conf('a lista aberta', /Soma e Produto/.test((await lugar(pag)).titulo), true);
  await voltar(pag);
  const v1 = await esperar('o Voltar da lista', () => lugar(pag), v => !!v && /Equações do Segundo Grau/.test(v.titulo), 4000);
  checa('1º Voltar: da lista ao módulo', v1.ok, true, TODOS);
  await pausa(300);
  await voltar(pag);
  const v2 = await esperar('o Voltar do módulo', () => lugar(pag), v => !!v && v.aba === 'biblioteca' && v.titulo === '', 4000);
  checa('2º Voltar: do módulo à lista de módulos', v2.ok, true, TODOS);
  checa('e a rolagem volta onde estava (a menos de 4 px)', !!v2.valor && Math.abs(v2.valor.rolagem - rolagemAntes) <= 4, true, TODOS);
  await pausa(300);
  await voltar(pag);
  const v3 = await esperar('o Voltar da Biblioteca', () => lugar(pag), v => !!v && v.aba === 'agenda', 4000);
  checa('3º Voltar: da Biblioteca à Agenda', v3.ok, true, TODOS);
  await pausa(300);
  await voltar(pag);
  const aviso1 = await esperar('o aviso de sair', () => avisos(pag), v => /Toque em Voltar de novo para sair\./.test(v || ''), 3000);
  checa('4º Voltar, na tela inicial: o aviso "Toque em Voltar de novo para sair."', aviso1.ok, true, ['volta-dois-passos']);
  checa('e o app continua aberto, na Agenda', (await lugar(pag)).aba, 'agenda', ['volta-dois-passos']);

  secao('2. A guarda da raiz volta com um passo dado depois do aviso');
  await clicar(pag, '#abas .aba[data-tela="biblioteca"]');
  await esperarBib(pag);
  await pag.evaluate(() => { window.__avisos = []; });
  await voltar(pag);
  const g1 = await esperar('o Voltar volta à Agenda', () => lugar(pag), v => !!v && v.aba === 'agenda', 4000);
  checa('depois do aviso, um toque na Biblioteca e o Voltar voltam à Agenda (não sai)', g1.ok, true, TODOS);
  await pausa(300);
  await voltar(pag);
  const aviso2 = await esperar('o aviso de novo', () => avisos(pag), v => /Toque em Voltar de novo para sair\./.test(v || ''), 3000);
  checa('o Voltar seguinte avisa de novo, sem sair', aviso2.ok && (await lugar(pag)).aba === 'agenda', true, ['volta-dois-passos']);
  // M2: logo depois do aviso, ela abre uma aula (janela sobre a raiz); o Voltar fecha a aula, e o seguinte ainda avisa
  const abriuNaRaiz = await pag.evaluate(h => {
    const p = Array.from(document.querySelectorAll('[data-dia="' + h + '"] .pilula')).find(x => x.textContent.indexOf('10:00') === 0);
    if (!p) return false; p.click(); return true;
  }, hoje);
  conf('a aula abriu logo depois do aviso', abriuNaRaiz && (await esperar('a janela da aula sobre a raiz', () => lugar(pag), v => !!v && v.aula, 4000)).ok, true);
  await voltar(pag);
  const fechouNaRaiz = await esperar('o Voltar fecha a aula', () => lugar(pag), v => !!v && !v.aula, 4000);
  conf('o Voltar fecha a aula aberta sobre a raiz', fechouNaRaiz.ok, true);
  await pag.evaluate(() => { window.__avisos = []; });
  const urlNaRaiz = pag.url();
  await pag.evaluate(() => { setTimeout(() => history.back(), 50); });
  const aviso3 = await esperar('o aviso depois da janela', () => avisos(pag).catch(() => ''), v => /Toque em Voltar de novo para sair\./.test(v || ''), 3000);
  checa('depois da janela fechada, o Voltar ainda avisa, e não fecha o app', aviso3.ok && pag.url() === urlNaRaiz, true, ['guarda-depois-da-janela']);
  const urlAntes = pag.url();
  await pag.evaluate(() => { setTimeout(() => history.back(), 50); });
  const saiu = await esperar('o segundo Voltar sai do app', () => Promise.resolve(pag.url()), u => u !== urlAntes, 5000);
  checa('e o Voltar logo depois do aviso sai do app', saiu.ok, true, []);
  await pag.close();

  secao('3. A seta de voltar da tela tira a entrada');
  pag = await abaNova();
  await clicar(pag, '#abas .aba[data-tela="biblioteca"]');
  await esperarBib(pag);
  await tocarLinha(pag, 'Equações do Segundo Grau');
  await pausa(200);
  await clicar(pag, '.bib-voltar');
  await pausa(400);
  conf('a seta da tela leva à lista de módulos', (await lugar(pag)).titulo, '');
  await voltar(pag);
  const s1 = await esperar('o Voltar depois da seta', () => lugar(pag), v => !!v && v.aba === 'agenda', 4000);
  checa('depois da seta, o Voltar do aparelho volta à Agenda (não reabre o módulo)', s1.ok, true, ['voltar-sem-tela', 'seta-nao-tira']);
  await pag.close();

  secao('4. Livro e capítulo');
  pag = await abaNova();
  await clicar(pag, '#abas .aba[data-tela="biblioteca"]');
  await esperarBib(pag);
  await clicar(pag, '#bib-livros .bibl-disciplina[data-disciplina="matematica"]');
  await clicar(pag, '#bib-livros .bibl-ano[data-ano="06"]');
  await pausa(200);
  await clicar(pag, '#bib-livros [data-livro="livro-com-marcadores"]');
  conf('a tela do livro abriu', (await esperar('a tela do livro', () => lugar(pag), v => !!v && v.livro === 'livro-com-marcadores', 5000)).ok, true);
  await clicar(pag, '#bib-livro .bibl-cap[data-n="2"]');
  conf('o capítulo abre o leitor', (await esperar('o leitor', () => lugar(pag), v => !!v && v.leitor, 20000)).ok, true);
  await pausa(500);
  await voltar(pag);
  const l1 = await esperar('o Voltar do leitor', () => lugar(pag), v => !!v && !v.leitor, 4000);
  checa('o Voltar fecha o leitor e fica na tela do livro', l1.ok && l1.valor.livro === 'livro-com-marcadores', true, ['volta-dois-passos']);
  await pausa(400);
  await voltar(pag);
  const l2 = await esperar('o Voltar da tela do livro', () => lugar(pag), v => !!v && v.livro === '' && v.aba === 'biblioteca', 4000);
  checa('o Voltar seguinte fecha a tela do livro e fica na Biblioteca', l2.ok, true, TODOS);
  await pag.close();

  secao('5. Janela aberta sobre uma tela');
  pag = await abaNova();
  const abriu = await pag.evaluate(h => {
    const p = Array.from(document.querySelectorAll('[data-dia="' + h + '"] .pilula')).find(x => x.textContent.indexOf('10:00') === 0);
    if (!p) return false; p.click(); return true;
  }, hoje);
  conf('a aula de hoje abriu sobre a Agenda', abriu && (await esperar('a janela da aula', () => lugar(pag), v => !!v && v.aula, 5000)).ok, true);
  await voltar(pag);
  const j1 = await esperar('o Voltar da janela', () => lugar(pag), v => !!v && !v.aula, 4000);
  checa('o Voltar fecha a janela, e a Agenda fica', j1.ok && j1.valor.aba === 'agenda', true, []);
  await pag.close();

  secao('6. Busca: o Voltar volta aos resultados, com o termo');
  pag = await abaNova();
  await clicar(pag, '#abas .aba[data-tela="biblioteca"]');
  await esperarBib(pag);
  await pag.evaluate(() => { const i = document.querySelector('#busca-biblioteca'); i.value = 'bhaskara'; i.dispatchEvent(new Event('input', { bubbles: true })); });
  await esperar('os resultados da busca', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo details[data-grupo="exercicios"] .item-lista').length), v => v > 0, 5000);
  const abriuResultado = await pag.evaluate(() => { const l = document.querySelector('#bib-corpo details[data-grupo="exercicios"] .item-lista'); if (!l) return false; l.click(); return true; });
  await pausa(300);
  const noResultado = await lugar(pag);
  conf('o resultado abriu (e o campo ficou vazio, como antes)', abriuResultado && noResultado.titulo !== '' && noResultado.termo === '', true);
  await voltar(pag);
  const b1 = await esperar('o Voltar do resultado', () => pag.evaluate(() => ({ termo: document.querySelector('#busca-biblioteca').value,
    grupos: document.querySelectorAll('#bib-corpo details[data-grupo="exercicios"] .item-lista').length })), v => !!v && v.termo === 'bhaskara' && v.grupos > 0, 4000);
  checa('o Voltar volta aos resultados, com "bhaskara" no campo', b1.ok, true, TODOS);
  await pag.close();

  secao('7. O editor de Minhas listas com rascunho');
  pag = await abaNova();
  await clicar(pag, '#abas .aba[data-tela="biblioteca"]');
  await esperarBib(pag);
  await clicar(pag, '#bib-abas [data-aba="minhas"]');
  await pausa(300);
  const abriuEditor = await pag.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#bib-corpo [data-acao="editar"]'))[0];
    if (!b) return false; b.click(); return true;
  });
  await pausa(300);
  conf('o editor da lista abriu', abriuEditor && (await lugar(pag)).nome === 'Lista de prova', true);
  await pag.evaluate(() => { const c = document.querySelector('#bib-minha-nome'); c.value = 'Lista de prova mudada'; c.dispatchEvent(new Event('input', { bubbles: true })); });
  pag.__respostaDoDialogo = 'cancela';
  const antesDoDialogo = dialogos.length;
  await voltar(pag);
  await pausa(600);
  const e1 = await lugar(pag);
  checa('o Voltar pergunta o mesmo que a seta', dialogos.slice(antesDoDialogo).join('|'), 'Sair sem guardar as mudanças desta lista?', ['pergunta-da-lista-some']);
  checa('"Cancelar": o editor fica, com o texto digitado', e1.nome, 'Lista de prova mudada', ['pergunta-da-lista-some']);
  pag.__respostaDoDialogo = 'aceita';
  await voltar(pag);
  const e2 = await esperar('o Voltar com "OK"', () => lugar(pag), v => !!v && v.nome === undefined, 4000);
  checa('"OK": volta a Minhas listas, sem o editor', e2.ok, true, ['voltar-sem-tela']);
  const gravou = await pag.evaluate(() => Store.listasDaBiblioteca().then(ls => (ls.find(l => l.id === 'ml_prova') || {}).titulo));
  conf('e nada foi gravado: a lista continua com o nome de antes', gravou, 'Lista de prova');
  await pag.close();

  secao('8. Recarga no meio');
  pag = await abaNova();
  await clicar(pag, '#abas .aba[data-tela="biblioteca"]');
  await esperarBib(pag);
  await tocarLinha(pag, 'Equações do Segundo Grau');
  await pausa(300);
  await H.abrirApp(pag, ORIGEM);  // o Android descartou a aba: a página recarrega na mesma entrada
  await ouvirAvisos(pag);
  const depoisDaRecarga = await lugar(pag);
  console.log('   depois de recarregar: ' + JSON.stringify(depoisDaRecarga));
  await voltar(pag);
  const r1 = await esperar('1º Voltar depois da recarga', () => lugar(pag), v => !!v && v.aba === 'biblioteca' && v.titulo === '', 4000);
  checa('1º Voltar depois de recarregar: a Biblioteca, sem o módulo', r1.ok, true, TODOS);
  await pausa(400);
  checa('a volta logo depois de recarregar passa pela Biblioteca ainda carregando sem erro de página', erros.filter(e => /listaSeries|modulos/.test(e)).join(' | '), '', ['sem-ramo-bib']);
  await pausa(300);
  await voltar(pag);
  const r2 = await esperar('2º Voltar depois da recarga', () => lugar(pag), v => !!v && v.aba === 'agenda', 4000);
  checa('2º Voltar: a Agenda', r2.ok, true, TODOS);
  await pausa(300);
  await voltar(pag);
  const r3 = await esperar('3º Voltar depois da recarga', () => avisos(pag), v => /Toque em Voltar de novo para sair\./.test(v || ''), 3000);
  checa('3º Voltar: o aviso de sair (nenhum toque morto)', r3.ok, true, ['volta-dois-passos']);
  await pag.close();

  secao('8b. Recarga na tela padrão: o primeiro Voltar não é morto');
  pag = await abaNova();
  await clicar(pag, '#abas .aba[data-tela="biblioteca"]');
  await esperarBib(pag);
  await H.abrirApp(pag, ORIGEM);  // o Android recarrega a aba, que abre na Agenda, e a entrada atual era a da Biblioteca
  await ouvirAvisos(pag);
  conf('depois de recarregar, a tela à vista é a Agenda', (await lugar(pag)).aba, 'agenda');
  await voltar(pag);
  const m1 = await esperar('o 1º Voltar depois de recarregar na Agenda', () => avisos(pag), v => /Toque em Voltar de novo para sair\./.test(v || ''), 3000);
  checa('o 1º Voltar já avisa (a entrada de baixo também é a Agenda, e o toque não fica morto)', m1.ok, true, ['volta-dois-passos']);
  await pag.close();

  secao('8c. A ficha do aluno no tablet: o Voltar pergunta se algo mudou');
  pag = await abaNova();
  await clicar(pag, '#abas .aba[data-tela="alunos"]');
  await pausa(300);
  await clicar(pag, '#novo-aluno');
  const fichaAberta = await esperar('a ficha nova', () => pag.evaluate(() => !!document.querySelector('#modal-aluno.aberto')), v => v, 4000);
  conf('a ficha de aluno novo abriu', fichaAberta.ok, true);
  await pausa(200);
  pag.__respostaDoDialogo = 'cancela';
  let antesA = dialogos.length;
  // sem mexer: o Voltar fecha sem perguntar (nenhuma pergunta falsa)
  await voltar(pag);
  const semMexer = await esperar('o Voltar da ficha sem mudança', () => pag.evaluate(() => !document.querySelector('#modal-aluno.aberto')), v => v, 4000);
  conf('sem nada digitado, o Voltar fecha a ficha sem perguntar', semMexer.ok && dialogos.length === antesA, true);
  await clicar(pag, '#novo-aluno');
  await esperar('a ficha nova de novo', () => pag.evaluate(() => !!document.querySelector('#modal-aluno.aberto')), v => v, 4000);
  await pausa(200);
  await pag.evaluate(() => { const c = document.querySelector('#modal-aluno input[type="text"], #modal-aluno input:not([type])'); c.value = 'Aluno Beta Teste'; c.dispatchEvent(new Event('input', { bubbles: true })); });
  antesA = dialogos.length;
  await voltar(pag);
  await pausa(600);
  conf('com o nome digitado, o Voltar pergunta', dialogos.slice(antesA).join('|'), 'Sair sem guardar o que você escreveu?');
  conf('"Cancelar": a ficha fica aberta, com o nome', await pag.evaluate(() => !!document.querySelector('#modal-aluno.aberto') &&
    Array.from(document.querySelectorAll('#modal-aluno input')).some(c => c.value === 'Aluno Beta Teste')), true);
  pag.__respostaDoDialogo = 'aceita';
  await voltar(pag);
  const fechouAluno = await esperar('o Voltar com "OK"', () => pag.evaluate(() => !document.querySelector('#modal-aluno.aberto')), v => v, 4000);
  conf('"OK": a ficha fecha', fechouAluno.ok, true);
  conf('e nada foi gravado: nenhum aluno novo', await pag.evaluate(() => Store.carregar().then(d => d.alunos.length)), 1);
  await pag.close();

  secao('9. No celular: a folha, a ficha e o formulário');
  const cel = await amb.pagina();
  cel.on('pageerror', e => erros.push('celular: ' + e.message));
  cel.removeAllListeners('dialog');
  cel.on('dialog', d => { dialogos.push(d.message()); (cel.__respostaDoDialogo === 'aceita' ? d.accept() : d.dismiss()).catch(() => {}); });
  await cel.setViewport({ width: 412, height: 915, hasTouch: true, isMobile: true });
  await cel.goto(ORIGEM + '/index.html', { waitUntil: 'networkidle0' });
  const celPronto = await esperar('o celular com as abas', () => cel.evaluate(() => document.body.classList.contains('modo-celular') && !document.querySelector('#cel-abas').hidden), v => v === true, 30000);
  conf('o celular abriu com as abas', celPronto.ok, true);
  await cel.evaluate(() => { const b = document.querySelector('#entendi-novidades'); if (b && document.querySelector('#modal-novidades.aberto')) b.click(); });
  await ouvirAvisos(cel);
  const telaCel = () => cel.evaluate(() => ({ ativa: (document.querySelector('#cel-abas .cel-aba.ativa') || { dataset: {} }).dataset.cel || '',
    lista: !!document.querySelector('#cel-alunos-lista'), folha: !!document.querySelector('#cel-folha'),
    form: !!document.querySelector('[data-form-celular]'), url: location.href }));
  // a folha da aula de Hoje
  const abriuFolha = await cel.evaluate(() => { const b = document.querySelector('#cel-hoje .cel-bloco[data-aula="au_um"]'); if (!b) return false; b.click(); return true; });
  await pausa(300);
  conf('a folha da aula abriu em Hoje', abriuFolha && (await telaCel()).folha, true);
  await cel.evaluate(() => history.back());
  const f1 = await esperar('o Voltar da folha', telaCel, v => !!v && !v.folha, 4000);
  checa('o Voltar fecha a folha e fica em Hoje', f1.ok && f1.valor.ativa === 'hoje', true, ['folha-fora-do-historico']);
  checa('sem o aviso de sair por cima da folha', /Toque em Voltar de novo para sair/.test(await avisos(cel).catch(() => '')), false, ['folha-fora-do-historico']);
  // a ficha de um aluno
  await cel.evaluate(() => document.querySelector('#cel-abas .cel-aba[data-cel="alunos"]').click());
  await esperar('a lista de alunos', telaCel, v => !!v && v.ativa === 'alunos' && v.lista, 5000);
  await pausa(200);
  await cel.evaluate(() => { const b = document.querySelector('#cel-alunos-lista [data-aluno="al_alfa"]'); if (b) b.click(); });
  await pausa(300);
  conf('a ficha do aluno abriu', (await telaCel()).lista, false);
  await cel.evaluate(() => history.back());
  const c1 = await esperar('o Voltar da ficha', telaCel, v => !!v && v.ativa === 'alunos' && v.lista, 4000);
  checa('o Voltar fecha a ficha e fica na lista de alunos', c1.ok, true, TODOS);
  await pausa(300);
  await cel.evaluate(() => history.back());
  const c2 = await esperar('o Voltar de Alunos', telaCel, v => !!v && v.ativa === 'hoje', 4000);
  checa('o Voltar seguinte volta a Hoje', c2.ok, true, TODOS);
  /* o formulário com texto: o celular só abre formulário quando edita (a conta da
   * dona na nuvem). Aqui a nuvem é dublada SÓ para a tela abrir o formulário;
   * nada é gravado, e a prova não toca em nada que grave. */
  const dublou = await cel.evaluate(() => {
    try {
      Nuvem.disponivel = () => true; Nuvem.celularDaDona = () => true;
      const est = Nuvem.estado; Nuvem.estado = () => Object.assign({}, est ? est() : {}, { uidDona: null });
      document.querySelector('#cel-abas .cel-aba[data-cel="hoje"]').click();
      const b = document.querySelector('#cel-marcar-aula'); if (!b || b.hidden) return 'sem botão';
      b.click(); return !!document.querySelector('[data-form-celular]');
    } catch (e) { return 'erro: ' + e.message; }
  });
  conf('a nuvem dublada abriu o formulário do celular', dublou, true);
  if (dublou === true) {
    await pausa(300);
    // sem mexer em nada: o Voltar sai do formulário sem perguntar (nenhuma pergunta falsa)
    const antesSem = dialogos.length;
    await cel.evaluate(() => history.back());
    const semTexto = await esperar('o Voltar do formulário sem mudança', telaCel, v => !!v && !v.form, 4000);
    checa('sem nada digitado, o Voltar sai do formulário sem perguntar', semTexto.ok && dialogos.length === antesSem, true, []);
    await cel.evaluate(() => { const b = document.querySelector('#cel-marcar-aula'); if (b) b.click(); });
    await esperar('o formulário de novo', telaCel, v => !!v && v.form, 4000);
    await pausa(300);
    await cel.evaluate(() => {
      const c = document.querySelector('[data-form-celular] input:not([type=hidden]), [data-form-celular] textarea');
      if (c) { c.value = c.type === 'time' ? '17:30' : (c.type === 'date' ? '2026-12-01' : 'texto de prova'); c.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    cel.__respostaDoDialogo = 'cancela';
    const antes = dialogos.length;
    await cel.evaluate(() => history.back());
    await pausa(600);
    checa('o formulário com texto: o Voltar pergunta antes de sair', dialogos.slice(antes).join('|'), 'Sair sem guardar o que você escreveu?', ['pergunta-do-formulario-some']);
    checa('"Cancelar": o formulário fica', (await telaCel()).form, true, ['pergunta-do-formulario-some']);
    cel.__respostaDoDialogo = 'aceita';
    await cel.evaluate(() => history.back());
    const fm = await esperar('o Voltar do formulário com "OK"', telaCel, v => !!v && !v.form, 4000);
    checa('"OK": o formulário sai', fm.ok, true, []);
  }

  } catch (e) {
    // sem veneno, o erro é falha; com veneno, o Voltar que sai do app no meio do caminho é o defeito
    if (!VENENO) throw e;
    visto.push('o caminho quebrou: ' + e.message);
  }
  if (VENENO) {
    secao('VENENO: ' + VENENO);
    conf('envenenado-' + VENENO + ': a prova viu o defeito', visto.length > 0, true);
    if (visto.length) console.log('VENENO visto: ' + visto.join(' ; '));
    await H.fim(amb)();
    return;
  }
  secao('10. Erros');
  conf('nenhum erro de página', erros.join(' | '), '');
  await H.fim(amb)();
})().catch(H.fim(amb));
