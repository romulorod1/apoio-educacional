/* testa_voltar_android.js
 *
 * FILA 2b: o Voltar do aparelho dentro do aplicativo. Relato do dono em
 * 12/11: na Biblioteca, o Voltar do tablet FECHAVA o app. O histórico só
 * conhecia as janelas; agora cada passo de navegação deixa uma entrada, e o
 * Voltar devolve a tela de antes, com a rolagem.
 *
 * No Chrome de verdade, com os pacotes SINTÉTICOS do 9º ano e do Banco (_pacote_sintetico.js)
 * e os livros SINTÉTICOS do gerador (fazer_amostra_livros.py --pacote). O
 * Voltar é o do navegador (history.back()), o mesmo evento do Android.
 *
 * O que prova:
 *   1. aba: da Agenda para a Biblioteca, o Voltar volta à Agenda;
 *   2. série, módulo e lista na Biblioteca: cada Voltar desfaz um passo, e a
 *      rolagem da lista de módulos volta onde estava;
 *   3. a seta de voltar da própria tela não deixa entrada a mais: depois
 *      dela, o Voltar do aparelho não "volta para a frente";
 *   4. livro e capítulo: a tela do livro, e o leitor aberto pelo capítulo; o
 *      Voltar fecha o leitor e fica na tela do livro, e o seguinte fecha a
 *      tela do livro;
 *   5. janela aberta sobre uma tela (a aula): o Voltar fecha a janela e a
 *      tela de baixo fica;
 *   6. na tela inicial, o primeiro Voltar avisa "Toque em Voltar de novo
 *      para sair." e o app continua; o segundo sai;
 *   7. no celular: de Hoje para Alunos e a ficha de um aluno, cada Voltar
 *      desfaz um passo;
 *   8. nenhum erro de página.
 *
 * Veneno:
 *   --envenenado-voltar-sem-tela  o Voltar sem janela aberta não devolve a
 *     tela (o código de antes): a prova TEM de ver o Voltar sair da Biblioteca.
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
const VENENOS = ['--envenenado-voltar-sem-tela'];
const VENENO = process.argv.indexOf('--envenenado-voltar-sem-tela') !== -1;
const PYTHON = process.env.PYTHON || 'python';
const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const ANCORA = 'if (!topo) { voltarDeTela(); return; }';
const trocas = {};
if (VENENO) trocas['/app.js'] = APP.split(ANCORA).join('if (!topo) return;');
const amb = H.criarAmbiente(PORTA, 'perfil_voltar_android', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'voltar_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

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
// o lugar da tela: a aba, a série, o módulo, a aula, o livro e o leitor
const lugar = pag => pag.evaluate(() => {
  const aba = (document.querySelector('#abas .aba.ativa') || { dataset: {} }).dataset.tela || '';
  const titulo = document.querySelector('#bib-corpo .bib-titulo');
  const livro = document.querySelector('#bib-livro');
  return {
    aba, emApp: !!document.querySelector('#abas'),
    serie: (document.querySelector('#bib-corpo .bib-series .chip-filtro.ativo') || {}).textContent || '',
    titulo: titulo ? titulo.textContent.trim() : '',
    livro: livro && !livro.hidden ? livro.dataset.livro || '' : '',
    leitor: !!document.querySelector('#modal-leitor-pdf.aberto'),
    aula: !!document.querySelector('#modal-aula.aberto'),
    rolagem: Math.round(document.querySelector('.conteudo').scrollTop)
  };
});
const voltar = pag => pag.evaluate(() => { history.back(); });

(async () => {
  secao('0. A prova se confere');
  conf('a lista de venenos não está vazia', VENENOS.length > 0, true);
  conf('a âncora do veneno (sem janela, o Voltar é das telas) aparece uma vez só no app.js', APP.split(ANCORA).length - 1, 1);
  const zipEx = path.join(TMP, 'pacote_9ano.zip');
  Sintetico.gerar(zipEx);
  const zipBanco = path.join(TMP, 'banco.zip');
  Sintetico.gerarBanco(zipBanco);
  const zipLivros = gerarLivros();
  conf('os pacotes sintéticos foram gerados', !!zipLivros && fs.existsSync(zipEx), true);
  if (!zipLivros) throw Object.assign(new Error('sem pacote de livros'), { jaContado: true });

  await amb.subir();
  const pag = await amb.pagina();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  await H.abrirApp(pag, amb.ORIGEM);
  const hoje = await pag.evaluate(() => Core.hojeIso());
  await pag.evaluate(async h => {
    const d = await Store.carregar();
    d.alunos = [{ id: 'al_alfa', nome: 'Aluno Alfa Teste', ano: '9', anoEscolar: '9º ano do Ensino Fundamental', responsavel: 'Responsável Alfa',
      grade: 'quarta-feira, 10:00', vigencias: [{ id: 'v1', inicio: '2026-01-01', fim: '2027-12-31', valorHora: 100 }] }];
    d.aulas = [{ id: 'au_um', alunoId: 'al_alfa', serieId: null, data: h, hora: '10:00', duracaoMin: 60, status: 'agendada',
      cobravel: true, notaTexto: '', notaPrivada: '', temNota: false, anexos: [], temas: [] }];
    await Store.salvar(d);
  }, hoje);
  await H.abrirApp(pag, amb.ORIGEM);
  await importar(pag, zipEx);
  await importar(pag, zipBanco);
  await importar(pag, zipLivros);
  // a prova começa da Agenda, que é onde o app abre
  await H.irParaAba(pag, 'agenda');
  await H.abrirApp(pag, amb.ORIGEM);
  const inicio = await lugar(pag);
  conf('o app abre na Agenda', inicio.aba, 'agenda');

  secao('1. Aba: da Agenda para a Biblioteca, e o Voltar volta');
  await clicar(pag, '#abas .aba[data-tela="biblioteca"]');
  await esperar('a Biblioteca desenhada', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .item-lista').length), v => v > 0, 10000);
  conf('a aba Biblioteca abriu', (await lugar(pag)).aba, 'biblioteca');
  await voltar(pag);
  const v1 = await esperar('o Voltar da Biblioteca', () => lugar(pag), v => !!v && v.aba === 'agenda', 5000);
  if (VENENO) {
    secao('VENENO: o Voltar sem janela não devolve a tela');
    const visto = !v1.ok;
    conf('envenenado-voltar-sem-tela: o Voltar não voltou à Agenda (defeito detectado)', visto, true);
    if (visto) console.log('VENENO visto: o Voltar não voltou à Agenda.');
    await H.fim(amb)();
    return;
  }
  conf('o Voltar do aparelho na Biblioteca volta à Agenda, sem sair do app', v1.ok && v1.valor.emApp, true);

  secao('2. Série, módulo e lista: cada Voltar desfaz um passo, com a rolagem');
  await clicar(pag, '#abas .aba[data-tela="biblioteca"]');
  await esperar('a Biblioteca de novo', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .item-lista').length), v => v > 0, 10000);
  await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-corpo .bib-series .chip-filtro')).find(c => c.textContent === '8º ano').click());
  await pausa(200);
  conf('a série do 8º ano', (await lugar(pag)).serie, '8º ano');
  await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-corpo .bib-series .chip-filtro')).find(c => c.textContent === '9º ano').click());
  await pausa(200);
  await pag.evaluate(() => { document.querySelector('.conteudo').scrollTop = 0; });
  // a rolagem antes de entrar no módulo: um pouco abaixo do alto
  const rolagemAntes = await pag.evaluate(() => { const c = document.querySelector('.conteudo'); c.scrollTop = Math.min(180, c.scrollHeight - c.clientHeight); return Math.round(c.scrollTop); });
  conf('entrou no módulo', await tocarLinha(pag, 'Equações do Segundo Grau'), true);
  await pausa(200);
  const noModulo = await lugar(pag);
  conf('o módulo aberto', /Equações do Segundo Grau/.test(noModulo.titulo), true);
  conf('entrou na lista', await tocarLinha(pag, 'Soma e Produto'), true);
  await pausa(300);
  const naLista = await lugar(pag);
  conf('a lista aberta', /Soma e Produto/.test(naLista.titulo), true);
  await voltar(pag);
  const vLista = await esperar('o Voltar da lista', () => lugar(pag), v => !!v && /Equações do Segundo Grau/.test(v.titulo) && !/Soma e Produto/.test(v.titulo), 5000);
  conf('o Voltar da lista volta ao módulo', vLista.ok, true);
  await voltar(pag);
  const vMod = await esperar('o Voltar do módulo', () => lugar(pag), v => !!v && v.titulo === '' && v.serie === '9º ano', 5000);
  conf('o Voltar do módulo volta à lista de módulos do 9º ano', vMod.ok, true);
  conf('e a rolagem volta onde estava (a menos de 4 px)', vMod.valor && Math.abs(vMod.valor.rolagem - rolagemAntes) <= 4, true);
  console.log('   rolagem antes ' + rolagemAntes + ', depois ' + (vMod.valor && vMod.valor.rolagem));
  /* ir do 9º ao 8º e de volta ao 9º é voltar: a entrada do 8º saiu na volta,
   * e o Voltar seguinte desfaz a entrada na Biblioteca (volta à Agenda) */
  await voltar(pag);
  const vSerie = await esperar('o Voltar da lista de módulos', () => lugar(pag), v => !!v && v.aba === 'agenda', 5000);
  conf('o Voltar seguinte volta à Agenda (o 8º ano e a volta ao 9º não deixaram entrada)', vSerie.ok, true);

  secao('3. A seta de voltar da tela não deixa entrada a mais');
  await clicar(pag, '#abas .aba[data-tela="biblioteca"]');
  await esperar('a Biblioteca de novo', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .item-lista').length), v => v > 0, 10000);
  await tocarLinha(pag, 'Equações do Segundo Grau');
  await pausa(200);
  await clicar(pag, '.bib-voltar');
  await pausa(300);
  const depoisDaSeta = await lugar(pag);
  conf('a seta de voltar da tela leva à lista de módulos', depoisDaSeta.titulo, '');
  await voltar(pag);
  const vSeta = await esperar('o Voltar depois da seta', () => lugar(pag), v => !!v && v.aba === 'agenda', 5000);
  conf('depois da seta, o Voltar do aparelho desfaz o passo de antes (a entrada na Biblioteca), e não reabre o módulo', vSeta.ok, true);

  secao('4. Livro e capítulo: o leitor fecha, e depois a tela do livro');
  await clicar(pag, '#abas .aba[data-tela="biblioteca"]');
  await esperar('a Biblioteca de novo', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .item-lista').length), v => v > 0, 10000);
  await clicar(pag, '#bib-livros .bibl-disciplina[data-disciplina="matematica"]');
  await clicar(pag, '#bib-livros .bibl-ano[data-ano="06"]');
  await pausa(200);
  await clicar(pag, '#bib-livros [data-livro="livro-com-marcadores"]');
  const tela = await esperar('a tela do livro', () => lugar(pag), v => !!v && v.livro === 'livro-com-marcadores', 5000);
  conf('a tela do livro abriu', tela.ok, true);
  await clicar(pag, '#bib-livro .bibl-cap[data-n="2"]');
  const leitor = await esperar('o leitor no capítulo 2', () => lugar(pag), v => !!v && v.leitor, 20000);
  conf('o capítulo abre o leitor', leitor.ok, true);
  await pausa(500);
  await voltar(pag);
  const vLeitor = await esperar('o Voltar do leitor', () => lugar(pag), v => !!v && !v.leitor, 5000);
  conf('o Voltar fecha o leitor e fica na tela do livro', vLeitor.ok && vLeitor.valor.livro === 'livro-com-marcadores', true);
  await pausa(400);
  await voltar(pag);
  const vLivro = await esperar('o Voltar da tela do livro', () => lugar(pag), v => !!v && v.livro === '' && v.aba === 'biblioteca', 5000);
  conf('o Voltar seguinte fecha a tela do livro e fica na Biblioteca', vLivro.ok, true);

  secao('5. Janela aberta sobre uma tela: o Voltar é da janela');
  await clicar(pag, '#abas .aba[data-tela="agenda"]');
  await pausa(300);
  const abriuAula = await pag.evaluate(h => {
    const p = Array.from(document.querySelectorAll('[data-dia="' + h + '"] .pilula')).find(x => x.textContent.indexOf('10:00') === 0);
    if (!p) return false; p.click(); return true;
  }, hoje);
  const aula = await esperar('a janela da aula', () => lugar(pag), v => !!v && v.aula, 5000);
  conf('a aula de hoje abriu sobre a Agenda', abriuAula && aula.ok, true);
  await voltar(pag);
  const vAula = await esperar('o Voltar da janela', () => lugar(pag), v => !!v && !v.aula, 5000);
  conf('o Voltar fecha a janela, e a Agenda fica', vAula.ok && vAula.valor.aba === 'agenda', true);

  secao('6. Na tela inicial: o primeiro Voltar avisa, o segundo sai');
  // desfaz os passos que sobraram até a pilha esvaziar (a Agenda é a tela de partida)
  for (let i = 0; i < 12; i++) {
    const vazia = await pag.evaluate(() => !!(history.state && history.state.apoioGuarda));
    if (vazia) break;
    await voltar(pag);
    await pausa(250);
  }
  conf('com a pilha vazia, o app está na guarda da tela inicial', await pag.evaluate(() => !!(history.state && history.state.apoioGuarda)), true);
  await pag.evaluate(() => { window.__avisos = []; const t = document.querySelector('#aviso-texto'); new MutationObserver(() => window.__avisos.push(t.textContent)).observe(t, { childList: true, characterData: true, subtree: true }); });
  await voltar(pag);
  const aviso = await esperar('o aviso de sair', () => pag.evaluate(() => (window.__avisos || []).join('|')), v => /Toque em Voltar de novo para sair\./.test(v || ''), 3000);
  conf('o primeiro Voltar na tela inicial avisa "Toque em Voltar de novo para sair."', aviso.ok, true);
  conf('e o app continua aberto', (await lugar(pag)).emApp, true);
  const urlAntes = pag.url();
  // o segundo Voltar sai da página: a chamada vai num temporizador, para a avaliação voltar antes
  await pag.evaluate(() => { setTimeout(() => history.back(), 50); });
  const saiu = await esperar('o segundo Voltar sai do app', () => Promise.resolve(pag.url()), u => u !== urlAntes, 5000);
  conf('o segundo Voltar sai do app', saiu.ok, true);

  secao('7. No celular: Hoje, Alunos e a ficha');
  const cel = await amb.pagina();
  cel.on('pageerror', e => erros.push('celular: ' + e.message));
  await cel.setViewport({ width: 412, height: 915, hasTouch: true, isMobile: true });
  await cel.goto(amb.ORIGEM + '/index.html', { waitUntil: 'networkidle0' });
  const celPronto = await esperar('o celular com as abas', () => cel.evaluate(() => document.body.classList.contains('modo-celular') && !document.querySelector('#cel-abas').hidden), v => v === true, 30000);
  conf('o celular abriu com as abas', celPronto.ok, true);
  if (celPronto.ok) {
    await cel.evaluate(() => { const b = document.querySelector('#entendi-novidades'); if (b && document.querySelector('#modal-novidades.aberto')) b.click(); });
    const telaCel = () => cel.evaluate(() => ({ ativa: (document.querySelector('#cel-abas .cel-aba.ativa') || { dataset: {} }).dataset.cel || '',
      lista: !!document.querySelector('#cel-alunos-lista'), estado: JSON.stringify(history.state), tamanho: history.length }));
    const ficha = v => !!v && v.ativa === 'alunos' && !v.lista;
    await cel.evaluate(() => document.querySelector('#cel-abas .cel-aba[data-cel="alunos"]').click());
    await esperar('a lista de alunos', telaCel, v => !!v && v.ativa === 'alunos' && v.lista, 5000);
    console.log('   na lista: ' + JSON.stringify(await telaCel()));
    const abriuFicha = await cel.evaluate(() => { const b = document.querySelector('#cel-alunos-lista [data-aluno="al_alfa"]'); if (!b) return false; b.click(); return true; });
    await pausa(300);
    console.log('   na ficha: ' + JSON.stringify(await telaCel()));
    conf('a ficha do aluno abriu na aba Alunos', abriuFicha && ficha(await telaCel()), true);
    await cel.evaluate(() => history.back());
    const vFicha = await esperar('o Voltar da ficha', telaCel, v => !!v && v.ativa === 'alunos' && v.lista, 5000);
    conf('o Voltar fecha a ficha e fica na lista de alunos', vFicha.ok, true);
    await cel.evaluate(() => history.back());
    const vAlunos = await esperar('o Voltar de Alunos', telaCel, v => !!v && v.ativa === 'hoje', 5000);
    conf('o Voltar seguinte volta a Hoje', vAlunos.ok, true);
  }

  secao('8. Erros');
  conf('nenhum erro de página', erros.join(' | '), '');
  await H.fim(amb)();
})().catch(H.fim(amb));
