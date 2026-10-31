/* testa_livros_mapa.js
 *
 * C15.2 (o mapa capítulo para assunto, na tela) e C15.3 ("Abrir no livro"),
 * com navegador, sobre o pacote de livros SINTÉTICO do gerador
 * (biblioteca/_amostra/fazer_amostra_livros.py --pacote), que traz o mapa:
 *   - livro-com-marcadores (PDF, 6º ao 9º pelo segmento): passe automático,
 *     capítulo 1 em MAT06-02, capítulo 2 em MAT06-05, capítulo 3 sem assunto;
 *   - livro-sem-marcadores (PDF, 6º pelo mapa): o mapa da orquestradora,
 *     página 1 em MAT06-05 e página 3 em MAT06-09;
 *   - livro-de-prova (EPUB, ensino médio): passe automático, parte 2 em
 *     LITEM2-T05.
 * Alunos, aulas e assuntos são fictícios. Nenhum livro comercial.
 *
 * O que se prova:
 *   1. abrir um capítulo no leitor mostra "Este capítulo cobre: <assunto>",
 *      com o nome do índice; o do passe automático vem marcado e com
 *      Confirmar; um toque confirma;
 *   2. Corrigir lista só os assuntos da matéria e do ano do livro (e "Nenhum
 *      assunto do índice"), com o atual marcado e à vista, e a linha que diz
 *      que a lista rola; um toque grava a correção, e ela continua lá
 *      depois de recarregar o aplicativo; o mapa do pacote não muda;
 *   3. a correção vai na cópia de segurança (em dados.ajustes.mapaDosLivros),
 *      os livros não, e restaurar a cópia devolve a correção;
 *   4. "Abrir no livro" na aula: lista os livros do ano do aluno com o
 *      assunto (com a correção valendo), abre o PDF na página do capítulo e o
 *      EPUB no capítulo; o aluno de outro ano não ganha o botão;
 *   5. nenhum erro de página.
 *
 * Modos envenenados:
 *   --envenenado-correcao-so-na-memoria  a correção não entra no db: depois
 *                                        de recarregar, ela some, e a cópia
 *                                        não a leva.
 *   --envenenado-sem-ano-na-tela         o "Abrir no livro" da aula não passa
 *                                        o ano do aluno: o aluno do 7º ganha o
 *                                        botão de um livro do 6º.
 *   --envenenado-faixa-refeita           a faixa é refeita a cada desenho da
 *                                        página (o código de antes de 31/10):
 *                                        o desenho de novo apaga a lista do
 *                                        Corrigir aberta.
 *
 *   --prints <pasta>   grava três prints (o capítulo com "Este capítulo
 *                      cobre", a escolha do Corrigir, o "Abrir no livro").
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const H = require('./_bib_navegador');
const { conf, secao, esperar, pausa } = H;

const PORTA = 8863;
const VENENOS = ['--envenenado-correcao-so-na-memoria', '--envenenado-sem-ano-na-tela', '--envenenado-faixa-refeita'];
const MODO = VENENOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const iPrints = process.argv.indexOf('--prints');
const PRINTS = iPrints > 0 ? process.argv[iPrints + 1] : null;
const PYTHON = process.env.PYTHON || 'python';

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const GUARDA_CORRECAO = 'var todas = db.ajustes.mapaDosLivros = db.ajustes.mapaDosLivros || {};';
const ANO_DA_AULA = 'Biblioteca.livrosComAssunto(livrosDoTablet, correcoesDosLivros(), t.id, anoParaOsLivros(aluno, t))';
let APP_SERVIDO = APP;
if (MODO === '--envenenado-correcao-so-na-memoria') APP_SERVIDO = APP.split(GUARDA_CORRECAO).join('var todas = {};');
if (MODO === '--envenenado-sem-ano-na-tela') {
  APP_SERVIDO = APP.split(ANO_DA_AULA).join('Biblioteca.livrosComAssunto(livrosDoTablet, correcoesDosLivros(), t.id, null)');
}
// o código de antes de 31/10: a faixa refeita a cada desenho da página
const FAIXA_IGUAL = 'if (!caixa.hidden && caixa.dataset.livro === reg.id && caixa.dataset.capitulo === String(e.n) &&';
if (MODO === '--envenenado-faixa-refeita') APP_SERVIDO = APP.split(FAIXA_IGUAL).join('if (false && caixa.dataset.livro === reg.id && caixa.dataset.capitulo === String(e.n) &&');
const trocas = {};
if (APP_SERVIDO !== APP) trocas['/app.js'] = APP_SERVIDO;
const amb = H.criarAmbiente(PORTA, 'nath_c15b_mapa', trocas);

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'c15b_mapa_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

const hojeIso = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();

function gerarPacote() {
  const r = spawnSync(PYTHON, ['-X', 'utf8', path.join(H.RAIZ, 'biblioteca', '_amostra', 'fazer_amostra_livros.py'), TMP, '--pacote'],
    { encoding: 'utf8' });
  const linhas = String(r.stdout || '').trim().split(/\r?\n/);
  const zip = linhas[linhas.length - 1];
  if (r.status !== 0 || !zip || !fs.existsSync(zip)) { console.log(String(r.stderr || '').slice(0, 800)); return null; }
  return zip;
}

async function importar(pag, arquivo) {
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => { document.querySelector('#estado-importacao-biblioteca').innerHTML = ''; });
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar('a importação dos livros', () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca');
    return [c ? c.innerText.trim() : '', document.querySelector('#importar-biblioteca').disabled];
  }), v => !!v && !!v[0] && !/Conferindo|Gravando/.test(v[0]) && v[1] === false, 60000);
  return (r.valor && r.valor[0]) || '';
}

const paginaDesenhada = pag => pag.evaluate(() => {
  const c = document.querySelector('#corpo-modal-leitor-pdf');
  return c && document.querySelector('#modal-leitor-pdf.aberto') ? (c.dataset.paginaDesenhada || '') : 'fechado';
});
const epubAberto = pag => pag.evaluate(() => {
  const c = document.querySelector('#corpo-modal-leitor-epub');
  return c && document.querySelector('#modal-leitor-epub.aberto') ? (c.dataset.capituloAberto || '') : 'fechado';
});
// a faixa "Este capítulo cobre" de um dos leitores
const cobre = (pag, qual) => pag.evaluate(id => {
  const c = document.querySelector(id);
  if (!c || c.hidden) return null;
  return { capitulo: c.dataset.capitulo || '', estado: c.dataset.estado || '', assuntos: c.dataset.assuntos || '',
    texto: c.querySelector('.cobre-texto') ? c.querySelector('.cobre-texto').textContent : '',
    confirmar: !!c.querySelector('#cobre-confirmar'), corrigir: !!c.querySelector('#cobre-corrigir') };
}, qual === 'epub' ? '#epub-cobre' : '#leitor-cobre');

async function abrirPelaEstante(pag, id) {
  await H.irParaAba(pag, 'biblioteca');
  await esperar('o botão Livros', () => pag.evaluate(() => !!document.querySelector('#btn-livros')), v => v, 10000);
  await pag.evaluate(() => document.querySelector('#btn-livros').click());
  await esperar('a estante com ' + id, () => pag.evaluate(i => !!document.querySelector('#corpo-modal-livros [data-livro="' + i + '"]'), id), v => v, 10000);
  await pag.evaluate(i => document.querySelector('#corpo-modal-livros [data-livro="' + i + '"]').click(), id);
}
async function fecharModal(pag, id) {
  await pag.evaluate(i => {
    const b = document.querySelector('#' + i + ' .modal-rodape [data-fechar]') || document.querySelector('#' + i + ' [data-fechar]');
    if (b) b.click();
  }, id);
  await esperar('a janela ' + id + ' fechou', () => pag.evaluate(i => !document.querySelector('#' + i + '.aberto'), id), v => v, 5000);
}
/* Faz `acao` e espera o leitor de PDF trocar o canvas: cada desenho de página
 * nasce num canvas NOVO (desenharPaginaDoLeitor), então o antigo marcado some
 * quando o desenho pedido termina, mesmo que a página seja a mesma. */
async function novoDesenho(pag, acao, rotulo) {
  await pag.evaluate(() => { const c = document.querySelector('#corpo-modal-leitor-pdf canvas'); if (c) c.dataset.velho = '1'; });
  await acao();
  return esperar(rotulo, () => pag.evaluate(() => {
    const c = document.querySelector('#corpo-modal-leitor-pdf canvas');
    return !!c && !c.dataset.velho;
  }), v => v === true, 15000);
}
async function irAoCapitulo(pag, rotulo) {
  await pag.evaluate(() => document.querySelector('#leitor-sumario').click());
  await pag.evaluate(r => Array.from(document.querySelectorAll('#leitor-sumario-lista [data-entrada]'))
    .find(b => b.textContent.indexOf(r) >= 0).click(), rotulo);
}
/* Abre a aula de hoje daquela hora pela agenda. */
async function abrirAulaDeHoje(pag, hora) {
  await H.irParaAba(pag, 'agenda');
  for (let i = 0; i < 24; i++) {
    if (await pag.evaluate(h => !!document.querySelector('[data-dia="' + h + '"]'), hojeIso)) break;
    await pag.click(i < 12 ? '#mes-seguinte' : '#mes-anterior');
    await pausa(120);
  }
  const ok = await pag.evaluate((h, hr) => {
    const alvo = Array.from(document.querySelectorAll('[data-dia="' + h + '"] .pilula')).find(p => p.textContent.indexOf(hr) === 0);
    if (!alvo) return false; alvo.click(); return true;
  }, hojeIso, hora);
  await esperar('aula das ' + hora + ' aberta', () => pag.evaluate(() => document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);
  return ok;
}
// as opções marcadas como atuais na lista do Corrigir: id e o visto do começo do texto
const marcados = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#leitor-cobre .cobre-escolha [aria-current="true"]'))
  .map(b => b.getAttribute('data-assunto') + ' ' + (b.classList.contains('atual') ? b.textContent.charAt(0) : '?')).join(' | '));
// os botões "Abrir no livro" da aula aberta, pelo id do assunto
const botoesDoLivro = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#corpo-modal-aula [data-abrir-no-livro]'))
  .map(b => b.getAttribute('data-abrir-no-livro')).join(','));
const linhasDosLivros = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#corpo-modal-livros [data-livro]'))
  .map(l => l.getAttribute('data-livro') + '#' + l.getAttribute('data-capitulo') + ' ' + l.innerText.replace(/\s+/g, ' ').trim()));

async function printar(pag, nome) {
  if (!PRINTS) return;
  fs.mkdirSync(PRINTS, { recursive: true });
  await pag.evaluate(() => { const a = document.querySelector('#aviso'); if (a) a.classList.remove('aberto'); });
  await pausa(300);
  await pag.screenshot({ path: path.join(PRINTS, nome) });
  console.log('   print: ' + path.join(PRINTS, nome));
}

(async () => {
  secao('0. As âncoras dos venenos e o pacote');
  conf('a correção entra no db num lugar só', APP.split(GUARDA_CORRECAO).length, 2);
  conf('o ano da aula vai para os livros num lugar só', APP.split(ANO_DA_AULA).length, 2);
  conf('a faixa igual à da tela é reconhecida num lugar só', APP.split(FAIXA_IGUAL).length, 2);
  if (MODO) conf('o app.js servido ficou diferente do repositório (' + MODO + ')', APP_SERVIDO !== APP, true);
  const ZIP = gerarPacote();
  conf('o gerador fez o pacote de prova, com o mapa', !!ZIP, true);
  if (!ZIP) throw Object.assign(new Error('sem pacote'), { jaContado: true });

  await amb.subir();
  const p = await amb.pagina();
  await p.setBypassServiceWorker(true);
  await H.abrirApp(p, amb.ORIGEM);
  const estado = await importar(p, ZIP);
  conf('os quatro livros entraram', /4 livros novos/.test(estado), true);
  // alunos e aulas fictícios: um do 6º, um do 7º e um da 2ª série do médio, todos com aula hoje
  await p.evaluate(async hoje => {
    const d = (await Store.carregar()) || Store.bancoVazio();
    const aluno = (id, nome, ano) => ({ id, nome, responsavel: 'Responsável Teste', ativo: true, anoEscolar: ano,
      precos: [{ id: 'p' + id, inicio: '2026-01-01', fim: null, valorHora: 100 }] });
    const aula = (id, alunoId, hora, temas) => ({ id, alunoId, data: hoje, hora, duracaoMin: 60, status: 'realizada',
      cobravel: true, areas: [], anexos: [], temas });
    const mat = (id, titulo) => ({ id, titulo, fonte: 'banco', disciplina: 'matematica' });
    d.alunos = [aluno('a6', 'Aluna Seis Teste', '06'), aluno('a7', 'Aluno Sete Teste', '07'), aluno('am2', 'Aluna Médio Teste', 'em2')];
    d.aulas = [
      aula('au6', 'a6', '09:00', [mat('MAT06-09', 'Ângulos e retas'), mat('MAT06-05', 'Frações: o que são e como comparar')]),
      aula('au7', 'a7', '10:00', [mat('MAT06-09', 'Ângulos e retas')]),
      aula('aum2', 'am2', '11:00', [{ id: 'LITEM2-T05', titulo: 'Determinismo e força do meio', fonte: 'topico',
        disciplina: 'literatura', grupo: 'em2' }])
    ];
    await Store.salvar(d);
  }, hojeIso);
  await H.abrirApp(p, amb.ORIGEM);

  // ================================================================
  secao('1. Abrir um capítulo: "Este capítulo cobre", e Confirmar');
  await abrirPelaEstante(p, 'livro-com-marcadores');
  await esperar('a página 1', () => paginaDesenhada(p), v => v === '1', 30000);
  const c1 = (await esperar('a faixa do capítulo 1 com o nome do assunto', () => cobre(p, 'pdf'),
    v => !!v && v.capitulo === '1' && /Operações com números naturais/.test(v.texto), 15000)).valor;
  console.log('   capítulo 1: ' + JSON.stringify(c1));
  conf('o capítulo 1 cobre "Operações com números naturais" (MAT06-02)', c1 && c1.assuntos, 'MAT06-02');
  conf('vem do passe automático, marcado, com Confirmar e Corrigir',
    !!c1 && c1.estado === 'a_confirmar' && /sugestão automática/.test(c1.texto) && c1.confirmar && c1.corrigir, true);
  // o veneno da memória não deixa a correção nem na tela: quem o enxerga é a seção 2, depois de recarregar
  const soNaMemoria = MODO === '--envenenado-correcao-so-na-memoria';
  await p.evaluate(() => document.querySelector('#cobre-confirmar').click());
  const c1b = (await esperar('o capítulo 1 confirmado', () => cobre(p, 'pdf'), v => !!v && v.estado === 'confirmado', soNaMemoria ? 1500 : 5000)).valor;
  if (!soNaMemoria) {
    conf('um toque confirma: "confirmado por você", sem o botão Confirmar', !!c1b && /confirmado por você/.test(c1b.texto) && !c1b.confirmar, true);
  }
  await irAoCapitulo(p, 'Capítulo 2');
  await esperar('a página 3', () => paginaDesenhada(p), v => v === '3', 15000);
  const c2 = (await esperar('a faixa do capítulo 2', () => cobre(p, 'pdf'), v => !!v && v.capitulo === '2' && /Frações/.test(v.texto), 10000)).valor;
  console.log('   capítulo 2: ' + JSON.stringify(c2));
  conf('o capítulo 2 cobre "Frações: o que são e como comparar" (MAT06-05)',
    !!c2 && c2.assuntos === 'MAT06-05' && /Frações: o que são e como comparar/.test(c2.texto), true);
  await printar(p, 'c15b_capitulo_cobre.png');

  // ================================================================
  secao('2. Corrigir: só a matéria e o ano do livro; a correção fica depois de recarregar');
  await p.evaluate(() => document.querySelector('#cobre-corrigir').click());
  const opcoes = (await esperar('a lista do Corrigir', () => p.evaluate(() =>
    Array.from(document.querySelectorAll('#leitor-cobre .cobre-escolha [data-assunto]')).map(b => b.getAttribute('data-assunto'))),
  v => !!v && v.length > 3, 10000)).valor || [];
  console.log('   ' + opcoes.length + ' opções: ' + opcoes.slice(0, 6).join(', ') + ' ... ' + opcoes.slice(-3).join(', '));
  conf('as opções são só de matemática do 6º ao 9º ano (o ano do livro)',
    opcoes.filter(x => x).every(x => /^MAT0[6-9]-/.test(x)), true);
  conf('com os 56 assuntos desses anos, e "Nenhum assunto do índice"', opcoes.filter(x => x).length + '+' + opcoes.filter(x => !x).length, '56+1');
  conf('o assunto atual do capítulo vem marcado na lista, e só ele', await marcados(p), 'MAT06-05 ✓');
  const rolagem = await p.evaluate(() => {
    const l = document.querySelector('#leitor-cobre .cobre-escolha');
    const r = document.querySelector('#leitor-cobre .cobre-rolagem');
    const m = l.querySelector('.atual');
    return { rola: l.scrollHeight > l.clientHeight, linha: r && !r.hidden ? r.textContent : '',
      atualAVista: !!m && m.offsetTop >= l.scrollTop && m.offsetTop + m.offsetHeight <= l.scrollTop + l.clientHeight };
  });
  console.log('   rolagem: ' + JSON.stringify(rolagem));
  conf('a lista rola, e o fim dela diz isso ("Role a lista ... 57 opções")', rolagem.rola && /Role a lista.*57 opções/.test(rolagem.linha), true);
  conf('e abre com o assunto atual à vista', rolagem.atualAVista, true);
  await p.evaluate(() => document.querySelector('#leitor-cobre .cobre-escolha').scrollIntoView({ block: 'center' }));
  await printar(p, 'c15b_corrigir.png');
  await p.evaluate(() => document.querySelector('#leitor-cobre .cobre-escolha [data-assunto="MAT06-06"]').click());
  const c2b = (await esperar('o capítulo 2 corrigido', () => cobre(p, 'pdf'), v => !!v && v.estado === 'corrigido', soNaMemoria ? 1500 : 5000)).valor;
  if (!soNaMemoria) {
    conf('um toque na escolha grava: "Operações com frações", "corrigido por você"',
      !!c2b && c2b.assuntos === 'MAT06-06' && /Operações com frações/.test(c2b.texto) && /corrigido por você/.test(c2b.texto), true);
  }
  // espera a correção NO DISCO, e não um tempo, antes de recarregar
  if (!soNaMemoria) {
    await esperar('a correção gravada no banco', () => p.evaluate(() => Store.carregar().then(d =>
      JSON.stringify((((d.ajustes || {}).mapaDosLivros || {})['livro-com-marcadores'] || {})['2'] || {}))),
    v => /MAT06-06/.test(v || ''), 10000);
  }
  await fecharModal(p, 'modal-leitor-pdf');
  await H.abrirApp(p, amb.ORIGEM);
  await abrirPelaEstante(p, 'livro-com-marcadores');
  await esperar('o livro reaberto', () => paginaDesenhada(p), v => /^\d+$/.test(v || ''), 30000);
  /* O livro reabre onde ela parou, que JÁ É a página 3: esperar "página 3"
   * depois do toque no sumário passava na hora, com o desenho do toque ainda
   * por vir, e ele chegava no meio do passo seguinte (a causa da rodada em dez
   * que falhava). A espera é pelo canvas NOVO, o do toque. */
  await novoDesenho(p, () => irAoCapitulo(p, 'Capítulo 2'), 'a página 3 desenhada pelo toque no sumário');
  conf('o livro reabriu no capítulo 2, na página 3', await paginaDesenhada(p), '3');
  const c2c = (await esperar('a faixa do capítulo 2 depois de recarregar', () => cobre(p, 'pdf'), v => !!v && v.capitulo === '2', 10000)).valor;
  console.log('   capítulo 2 depois de recarregar: ' + JSON.stringify(c2c));
  const guardado = await p.evaluate(() => Store.carregar().then(d => (d.ajustes || {}).mapaDosLivros || null));
  console.log('   db.ajustes.mapaDosLivros: ' + JSON.stringify(guardado));
  const texto = await p.evaluate(() => Store.carregar().then(d => Store.exportarTudo(d)).then(x => JSON.stringify(x)));
  if (MODO === '--envenenado-correcao-so-na-memoria') {
    secao('VENENO: a correção só na memória');
    conf('envenenado: depois de recarregar a correção sumiu, e a cópia não a leva (defeito enxergado)',
      !!c2c && c2c.estado === 'a_confirmar' && texto.indexOf('mapaDosLivros') < 0, true);
    throw Object.assign(new Error('fim'), { fimDoVeneno: true });
  }
  conf('depois de recarregar o aplicativo, o capítulo 2 continua corrigido', !!c2c && c2c.estado === 'corrigido' && c2c.assuntos === 'MAT06-06', true);
  await esperar('o nome do assunto na faixa', () => cobre(p, 'pdf'), v => !!v && /Operações com frações/.test(v.texto), 10000);
  await p.evaluate(() => document.querySelector('#cobre-corrigir').click());
  await esperar('a lista do Corrigir de novo', () => p.evaluate(() => document.querySelectorAll('#leitor-cobre .cobre-escolha [data-assunto]').length), v => v > 3, 10000);
  conf('o Corrigir agora marca a escolha dela', await marcados(p), 'MAT06-06 ✓');
  /* A página desenhada de novo com a lista aberta (o sumário levando à página
   * onde ela já está; o zoom faz o mesmo) não pode apagar a lista: até 31/10
   * a faixa era refeita a cada desenho. Com o canvas novo à vista, a lista
   * tem de continuar lá, com a marca. */
  conf('a página foi mesmo desenhada de novo (canvas novo)', (await novoDesenho(p, () => irAoCapitulo(p, 'Capítulo 2'), 'a mesma página desenhada de novo, com a lista aberta')).ok, true);
  const depoisDoDesenho = await marcados(p);
  if (MODO === '--envenenado-faixa-refeita') {
    secao('VENENO: a faixa refeita a cada desenho');
    conf('envenenado: o desenho de novo apagou a lista aberta (defeito enxergado)', depoisDoDesenho, '');
    throw Object.assign(new Error('fim'), { fimDoVeneno: true });
  }
  conf('a página desenhada de novo não apaga a lista aberta', depoisDoDesenho, 'MAT06-06 ✓');
  await p.evaluate(() => document.querySelector('#cobre-corrigir').click());
  conf('e o segundo toque em Corrigir fecha a lista e a linha da rolagem',
    await p.evaluate(() => !document.querySelector('#leitor-cobre .cobre-escolha') && !document.querySelector('#leitor-cobre .cobre-rolagem')), true);
  const doLivro = (guardado || {})['livro-com-marcadores'] || {};
  conf('a correção mora em db.ajustes.mapaDosLivros, por capítulo, com o título',
    [doLivro['1'] && doLivro['1'].acao + ':' + doLivro['1'].assuntos.join('+'), doLivro['2'] && doLivro['2'].acao + ':' + doLivro['2'].assuntos.join('+') + ':' + doLivro['2'].titulo].join(' | '),
    'confirmou:MAT06-02 | corrigiu:MAT06-06:Capítulo 2: Frações');
  const doPacote = await p.evaluate(() => Store.lerLivro('livro-com-marcadores').then(r => r.meta.mapa.map(e => e.assuntos.map(a => a.id).join('+')).join(' | ')));
  conf('o mapa do pacote, no depósito dos livros, não mudou', doPacote, 'MAT06-02 | MAT06-05 | ');
  await fecharModal(p, 'modal-leitor-pdf');

  // ================================================================
  secao('3. A correção vai na cópia de segurança; os livros não');
  const copia = JSON.parse(texto);
  conf('a cópia leva a correção', JSON.stringify(((copia.dados.ajustes || {}).mapaDosLivros || {})['livro-com-marcadores'] || {}) === JSON.stringify(doLivro), true);
  conf('e não leva livro nenhum (nem PDF, nem o depósito dos livros, nem a posição)', /JVBERi0|livros_posicoes|"blob"/.test(texto), false);
  console.log('   cópia: ' + texto.length + ' caracteres');
  conf('a cópia é pequena (menos de 64 KB, com 1,2 MB de livro no tablet)', texto.length < 64 * 1024, true);
  // restaurar: apaga tudo (os livros ficam) e importa a cópia de volta
  const restaurado = await p.evaluate(async c => {
    await Store.apagarTudo();
    const vazio = await Store.carregar();
    const antes = !!(vazio && vazio.ajustes && vazio.ajustes.mapaDosLivros);
    await Store.importarTudo(c);
    const d = await Store.carregar();
    return { antes, depois: JSON.stringify(((d.ajustes || {}).mapaDosLivros || {})['livro-com-marcadores'] || null) };
  }, copia);
  conf('Apagar tudo tira a correção, e restaurar a cópia a devolve', !restaurado.antes && restaurado.depois === JSON.stringify(doLivro), true);
  await H.abrirApp(p, amb.ORIGEM);

  // ================================================================
  secao('4. "Abrir no livro" a partir da aula');
  conf('a aula do 6º abriu', await abrirAulaDeHoje(p, '09:00'), true);
  const b6 = (await esperar('os botões "Abrir no livro"', () => botoesDoLivro(p), v => /MAT06-09/.test(v || ''), 10000)).valor;
  conf('os dois assuntos da aula do 6º têm livro: o botão aparece nos dois', b6, 'MAT06-09,MAT06-05');
  await p.evaluate(() => document.querySelector('#corpo-modal-aula [data-abrir-no-livro="MAT06-05"]').click());
  const l05 = (await esperar('a lista dos livros de Frações', () => linhasDosLivros(p), v => !!v && v.length > 0, 5000)).valor;
  console.log('   Frações: ' + JSON.stringify(l05));
  conf('Frações: só o livro do mapa (o capítulo 2 do outro foi corrigido para "Operações com frações")',
    (l05 || []).map(x => x.split(' ')[0]).join(','), 'livro-sem-marcadores#1');
  await printar(p, 'c15b_abrir_no_livro.png');
  await fecharModal(p, 'modal-livros');
  await p.evaluate(() => document.querySelector('#corpo-modal-aula [data-abrir-no-livro="MAT06-09"]').click());
  const l09 = (await esperar('a lista dos livros de Ângulos', () => linhasDosLivros(p), v => !!v && v.length > 0, 5000)).valor;
  console.log('   Ângulos: ' + JSON.stringify(l09));
  conf('Ângulos e retas: o livro sem marcadores, "Unidade do mapa B, página 3"',
    (l09 || []).length === 1 && /^livro-sem-marcadores#2 .*Unidade do mapa B, página 3/.test(l09[0]), true);
  await p.evaluate(() => document.querySelector('#corpo-modal-livros [data-livro]').click());
  conf('o toque abre o PDF na página 3', (await esperar('a página do capítulo', () => paginaDesenhada(p), v => /^\d+$/.test(v || ''), 30000)).valor, '3');
  // o nome sai do índice, que abre depois da faixa: espera por ele, e não só pelo capítulo
  const c09 = (await esperar('a faixa do capítulo aberto pela aula', () => cobre(p, 'pdf'),
    v => !!v && v.capitulo === '2' && /Ângulos e retas/.test(v.texto), 10000)).valor;
  conf('e a faixa diz o assunto da aula, do mapa da orquestradora (sem Confirmar)',
    !!c09 && c09.assuntos === 'MAT06-09' && /Ângulos e retas/.test(c09.texto) && !c09.confirmar, true);
  await fecharModal(p, 'modal-leitor-pdf');
  await fecharModal(p, 'modal-aula');

  conf('a aula do 7º abriu', await abrirAulaDeHoje(p, '10:00'), true);
  /* A AUSÊNCIA do botão só vale com a linha do assunto já desenhada e com a
   * lista dos livros já lida (a mesma da aula do 6º, que mostrou o botão):
   * espera pela linha, e não por um tempo. */
  await esperar('a linha do assunto da aula do 7º', () => p.evaluate(() =>
    Array.from(document.querySelectorAll('#corpo-modal-aula .item-assunto-aula .nome')).map(n => n.textContent).join('|')),
  v => /Ângulos e retas/.test(v || ''), 10000);
  const b7 = await botoesDoLivro(p);
  if (MODO === '--envenenado-sem-ano-na-tela') {
    secao('VENENO: a aula não passa o ano do aluno');
    conf('envenenado: o aluno do 7º ganhou o botão de um livro do 6º (defeito enxergado)', b7, 'MAT06-09');
    throw Object.assign(new Error('fim'), { fimDoVeneno: true });
  }
  conf('o aluno do 7º, com o mesmo assunto, não ganha o botão: o único livro com ele é do 6º', b7, '');
  await fecharModal(p, 'modal-aula');

  conf('a aula da 2ª série abriu', await abrirAulaDeHoje(p, '11:00'), true);
  const bm = (await esperar('o botão no assunto de literatura', () => botoesDoLivro(p), v => /LITEM2-T05/.test(v || ''), 10000)).valor;
  conf('o assunto de literatura tem o botão', bm, 'LITEM2-T05');
  await p.evaluate(() => document.querySelector('#corpo-modal-aula [data-abrir-no-livro]').click());
  const lm = (await esperar('a lista do EPUB', () => linhasDosLivros(p), v => !!v && v.length > 0, 5000)).valor;
  console.log('   literatura: ' + JSON.stringify(lm));
  conf('o EPUB, no capítulo 2 do mapa', (lm || []).map(x => x.split(' ')[0]).join(','), 'livro-de-prova#2');
  await p.evaluate(() => document.querySelector('#corpo-modal-livros [data-livro]').click());
  conf('o toque abre o EPUB no capítulo 2', (await esperar('a parte do EPUB', () => epubAberto(p), v => /^\d+$/.test(v || ''), 20000)).valor, '2');
  const cm = (await esperar('a faixa do EPUB', () => cobre(p, 'epub'), v => !!v && v.capitulo === '2' && /Determinismo/.test(v.texto), 15000)).valor;
  conf('e a faixa do EPUB diz "Determinismo e força do meio", a confirmar', !!cm && cm.estado === 'a_confirmar' && cm.confirmar, true);
  await p.evaluate(() => document.querySelector('#epub-proximo').click());
  await esperar('a parte 3', () => epubAberto(p), v => v === '3', 15000);
  const cm3 = (await esperar('a faixa da parte 3', () => cobre(p, 'epub'), v => !!v && v.capitulo === '3', 10000)).valor;
  conf('na parte 3, o capítulo sem assunto diz "nenhum assunto do índice"', !!cm3 && /nenhum assunto do índice/.test(cm3.texto), true);
  await fecharModal(p, 'modal-leitor-epub');
  await fecharModal(p, 'modal-aula');

  secao('5. Nenhum erro de página');
  conf('nenhum erro', p.errosDePagina.join(' | '), '');
})().then(() => H.fim(amb)(), e => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e)));
