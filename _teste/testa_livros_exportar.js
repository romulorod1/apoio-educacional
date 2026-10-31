/* testa_livros_exportar.js
 *
 * C15.4 ("Exportar em PDF" no modelo dela) e C15.5 (o capítulo e o gabarito
 * dele num PDF só), com navegador, porta 8864, sobre o pacote SINTÉTICO do
 * gerador (biblioteca/_amostra/fazer_amostra_livros.py --gabarito):
 *   - livro-com-gabarito (PDF): capítulos 1 a 3 nas páginas 1-2, 3-4 e 5-6, e
 *     a seção "Respostas dos exercícios" no fim, uma página por capítulo (7, 8
 *     e 9), cada uma com uma resposta de texto conhecido; o capítulo 2 traz um
 *     travessão de propósito;
 *   - livro-sem-gabarito (PDF): os mesmos capítulos, sem respostas;
 *   - livro-de-prova (EPUB): três capítulos, uma figura no primeiro.
 * Aluno, aula e assuntos fictícios. Nenhum livro comercial.
 *
 * O que se prova:
 *   1. do capítulo 2, "Exportar em PDF": a janela traz o capítulo com as
 *      páginas, e a caixa "Com o gabarito" MARCADA, dizendo a página dele;
 *   2. "Gerar e anexar": o PDF fica anexado à aula, um arquivo só, com o texto
 *      do capítulo 2 nas primeiras páginas e, DEPOIS, o do gabarito do
 *      capítulo 2 (e não o do 1 nem o do 3); o rodapé de fonte em toda
 *      página; o cabeçalho com a marca; nenhum travessão (o do livro virou
 *      hífen);
 *   3. de novo, sem o gabarito: o PDF só com o capítulo;
 *   4. o livro sem gabarito diz "sem gabarito localizado neste livro", com a
 *      caixa desligada;
 *   5. páginas escolhidas ("5-6") viram o PDF dessas páginas;
 *   6. o EPUB: o aviso das fórmulas na janela, e o capítulo remontado (texto e
 *      figura) anexado;
 *   7. nenhum erro de página.
 *
 * Modos envenenados:
 *   --envenenado-gabarito-do-outro  o biblioteca.js servido pega o gabarito do
 *                                   primeiro capítulo para qualquer um: o PDF
 *                                   do capítulo 2 sai com a resposta do 1.
 *   --envenenado-sem-fonte          o pdf.js servido não escreve o rodapé de fonte.
 *   --envenenado-travessao          o pdf.js servido deixa o travessão do livro passar.
 *   --envenenado-pdf-na-copia       o app.js servido guarda o PDF exportado no
 *                                   depósito de anexos, que a cópia de segurança
 *                                   leva: a cópia cresce o tamanho do PDF.
 *
 * Revisão do C15.4 (o PDF exportado mora FORA da cópia de segurança):
 *   8. a cópia antes e depois de exportar o capítulo cresce só alguns KB (o
 *      registro do anexo, sem o arquivo);
 *   9. a janela mostra o tamanho estimado; sem espaço no tablet, a frase
 *      própria, e nada anexado;
 *  10. a cópia restaurada (o PDF não vem): o anexo diz "Exportado do livro
 *      ..." com "Gerar de novo", que refaz o PDF (o capítulo 2 e o gabarito
 *      dele); sem o livro no tablet, a frase diz que falta o livro.
 *
 *   --prints <pasta>   grava três prints: a janela de exportar, a primeira
 *                      página do PDF gerado e a página do gabarito, as duas
 *                      renderizadas (pelo PyMuPDF).
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const H = require('./_bib_navegador');
const { conf, secao, esperar, pausa } = H;

const PORTA = 8864;
const VENENOS = ['--envenenado-gabarito-do-outro', '--envenenado-sem-fonte', '--envenenado-travessao', '--envenenado-pdf-na-copia'];
const MODO = VENENOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const iPrints = process.argv.indexOf('--prints');
const PRINTS = iPrints > 0 ? process.argv[iPrints + 1] : null;
const PYTHON = process.env.PYTHON || 'python';

const BIB = fs.readFileSync(path.join(H.RAIZ, 'biblioteca.js'), 'utf8');
const PDF = fs.readFileSync(path.join(H.RAIZ, 'pdf.js'), 'utf8');
const GAB_DA_ENTRADA = 'var g = entrada.gabarito && entrada.gabarito.faixas ? entrada.gabarito : gabaritoDaEntrada(meta, entrada);';
const FONTE = "var fonte = textoDoLivro(op.fonte || '');";
const TROCA_TRACO = ".replace(RE_TRACOS_LIVRO, '-')";
const trocas = {};
if (MODO === '--envenenado-gabarito-do-outro') trocas['/biblioteca.js'] = BIB.split(GAB_DA_ENTRADA).join('var g = gabaritoDaEntrada(meta, meta.mapa[0]);');
if (MODO === '--envenenado-sem-fonte') trocas['/pdf.js'] = PDF.split(FONTE).join("var fonte = '';");
if (MODO === '--envenenado-travessao') trocas['/pdf.js'] = PDF.split(TROCA_TRACO).join('');
const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const GUARDA_FORA = "return Store.salvarExportado(id, { nome: arquivo.nome, tipo: 'application/pdf', blob: arquivo.blob })";
if (MODO === '--envenenado-pdf-na-copia') trocas['/app.js'] = APP.split(GUARDA_FORA).join(GUARDA_FORA.replace('salvarExportado', 'salvarAnexo'));
const amb = H.criarAmbiente(PORTA, 'nath_c15c_exportar', trocas);

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'c15c_exportar_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });
const hojeIso = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();
const TRACOS = new RegExp('[' + String.fromCharCode(0x2013, 0x2014, 0x96, 0x97) + ']');
const FONTE_ESPERADA = 'Fonte: Livro com gabarito, Volume 2, Autora de Prova, Editora de Prova, 2026, Capítulo 2: Frações, páginas 3 a 4';

function gerarPacote() {
  const r = spawnSync(PYTHON, ['-X', 'utf8', path.join(H.RAIZ, 'biblioteca', '_amostra', 'fazer_amostra_livros.py'), TMP, '--gabarito'],
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
async function irAoCapitulo(pag, rotulo) {
  await pag.evaluate(() => document.querySelector('#leitor-sumario').click());
  await pag.evaluate(r => Array.from(document.querySelectorAll('#leitor-sumario-lista [data-entrada]'))
    .find(b => b.textContent.indexOf(r) >= 0).click(), rotulo);
}
/* Abre a aula de hoje daquela hora pela agenda (o mesmo do testa_livros_mapa.js). */
async function abrirAulaDeHoje(pag, hora) {
  await H.irParaAba(pag, 'agenda');
  for (let i = 0; i < 24; i++) {
    if (await pag.evaluate(h => !!document.querySelector('[data-dia="' + h + '"]'), hojeIso)) break;
    await pag.click(i < 12 ? '#mes-seguinte' : '#mes-anterior');
    await pausa(120);
  }
  const ok = await pag.evaluate((h, hr) => {
    const alvo = Array.from(document.querySelectorAll('[data-dia="' + h + '"] .pilula')).find(x => x.textContent.indexOf(hr) === 0);
    if (!alvo) return false; alvo.click(); return true;
  }, hojeIso, hora);
  await esperar('aula das ' + hora + ' aberta', () => pag.evaluate(() => document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);
  return ok;
}
// a janela de exportar, como ela a vê
const janela = pag => pag.evaluate(() => {
  const m = document.querySelector('#modal-livro-exportar');
  if (!m || !m.classList.contains('aberto')) return null;
  const cap = document.querySelector('#livro-exportar-capitulo');
  const g = document.querySelector('#livro-exportar-gabarito');
  const mot = document.querySelector('#livro-exportar-motivo-gabarito');
  return { capitulo: cap && cap.parentNode ? (cap.checked ? '[x] ' : '[ ] ') + cap.parentNode.textContent.trim() : '',
    gabarito: g ? (g.checked ? 'marcada' : 'desmarcada') + (g.disabled ? ', desligada' : ', ligada') : '',
    motivo: mot ? mot.textContent : '', estado: mot ? mot.dataset.estado : '',
    avisoEpub: !!document.querySelector('#livro-exportar-aviso-epub'),
    paginas: !!document.querySelector('#livro-exportar-paginas') };
});
async function exportar(pag, botao) {
  await pag.evaluate(b => document.querySelector(b).click(), botao);
  return (await esperar('a janela de exportar', () => janela(pag), v => !!v, 5000)).valor;
}
const lerDados = pag => pag.evaluate(() => Store.carregar());
const anexosDoLivro = pag => lerDados(pag).then(d => ((d.aulas.filter(a => a.id === 'au1')[0] || {}).anexos || []).filter(a => a.livro));
async function anexarNaAula(pag, antes) {
  await pag.evaluate(() => document.querySelector('#livro-exportar-aulas [data-aula="au1"]').click());
  await pag.evaluate(() => document.querySelector('#livro-exportar-anexar').click());
  const r = await esperar('o PDF anexado na aula', () => anexosDoLivro(pag), v => !!v && v.length > antes, 60000);
  await esperar('a janela fechou', () => pag.evaluate(() => !document.querySelector('#modal-livro-exportar.aberto')), v => v, 5000);
  return (r.valor || [])[antes] || null;
}
// o PDF exportado, guardado FORA da cópia (Store.lerExportado), em base64, para o Node ler
const lerAnexo = (pag, id) => pag.evaluate(i => Store.lerExportado(i).then(r => r && r.blob ? r.blob.arrayBuffer() : null).then(buf => {
  if (!buf) return null;
  let s = ''; const b = new Uint8Array(buf);
  for (let k = 0; k < b.length; k += 0x8000) s += String.fromCharCode.apply(null, b.subarray(k, k + 0x8000));
  return btoa(s);
}), id);

/* O mesmo leitor do testa_biblioteca_compor_tela.js: o PDF do gerador não
 * comprime os fluxos, então o texto de cada página se lê direto do Tj (o
 * visível e o invisível, que é o da página do livro). */
function lerPdf(bytes) {
  const bruto = Buffer.from(bytes).toString('latin1');
  const objs = {};
  const rxObj = /(\d+) 0 obj\n([\s\S]*?)\nendobj/g;
  let m;
  while ((m = rxObj.exec(bruto))) objs[m[1]] = m[2];
  const raiz = Object.values(objs).find(o => /\/Type \/Pages /.test(o));
  const kids = raiz.match(/\/Kids \[([^\]]*)\]/)[1].match(/\d+ 0 R/g).map(r => r.split(' ')[0]);
  return kids.map(k => {
    const o = objs[k];
    const cont = objs[o.match(/\/Contents (\d+) 0 R/)[1]];
    const fluxo = cont.slice(cont.indexOf('stream\n') + 7, cont.lastIndexOf('\nendstream'));
    const textos = [];
    const rx = /\(((?:\\.|[^\\()])*)\)\s*Tj/g;
    let t;
    while ((t = rx.exec(fluxo))) textos.push(t[1].replace(/\\([\\()])/g, '$1'));
    return { fluxo, textos, texto: textos.join(' '), imagens: (fluxo.match(/ Do Q/g) || []).length };
  });
}

async function printar(pag, nome) {
  if (!PRINTS) return;
  fs.mkdirSync(PRINTS, { recursive: true });
  await pag.evaluate(() => { const a = document.querySelector('#aviso'); if (a) a.classList.remove('aberto'); });
  await pausa(300);
  await pag.screenshot({ path: path.join(PRINTS, nome) });
  console.log('   print: ' + path.join(PRINTS, nome));
}
// a página do PDF gerado, renderizada pelo PyMuPDF (o mesmo que o portão usa)
function printarPdf(bytes, indice, nome) {
  if (!PRINTS) return;
  const arq = path.join(TMP, 'exportado.pdf');
  fs.writeFileSync(arq, bytes);
  const roteiro = path.join(TMP, 'render.py');
  fs.writeFileSync(roteiro, 'import sys, pymupdf\nd = pymupdf.open(sys.argv[1])\nd[int(sys.argv[2])].get_pixmap(dpi=110).save(sys.argv[3])\n');
  const r = spawnSync(PYTHON, [roteiro, arq, String(indice), path.join(PRINTS, nome)], { encoding: 'utf8' });
  console.log(r.status === 0 ? '   print: ' + path.join(PRINTS, nome) : '   print falhou: ' + r.stderr);
}

(async () => {
  secao('0. As âncoras dos venenos e o pacote');
  conf('o gabarito do capítulo é lido num lugar só', BIB.split(GAB_DA_ENTRADA).length, 2);
  conf('o rodapé de fonte entra num lugar só', PDF.split(FONTE).length, 2);
  conf('a troca do travessão do livro mora num lugar só', PDF.split(TROCA_TRACO).length, 2);
  conf('o PDF exportado é guardado fora da cópia num lugar só', APP.split(GUARDA_FORA).length, 2);
  if (MODO) conf('o arquivo servido ficou diferente do repositório (' + MODO + ')', Object.keys(trocas).length, 1);
  const ZIP = gerarPacote();
  conf('o gerador fez o pacote de prova, com o gabarito', !!ZIP, true);
  if (!ZIP) throw Object.assign(new Error('sem pacote'), { jaContado: true });

  await amb.subir();
  const p = await amb.pagina();
  await p.setBypassServiceWorker(true);
  await H.abrirApp(p, amb.ORIGEM);
  const estado = await importar(p, ZIP);
  conf('os três livros entraram', /3 livros novos/.test(estado), true);
  await p.evaluate(async hoje => {
    const d = (await Store.carregar()) || Store.bancoVazio();
    d.alunos = [{ id: 'a6', nome: 'Aluna Seis Teste', responsavel: 'Responsável Teste', ativo: true, anoEscolar: '06',
      precos: [{ id: 'pa6', inicio: '2026-01-01', fim: null, valorHora: 100 }] }];
    d.aulas = [{ id: 'au1', alunoId: 'a6', data: hoje, hora: '09:00', duracaoMin: 60, status: 'realizada', cobravel: true,
      areas: [], anexos: [], temas: [{ id: 'MAT06-05', titulo: 'Frações: o que são e como comparar', fonte: 'banco', disciplina: 'matematica' }] }];
    await Store.salvar(d);
  }, hojeIso);
  await H.abrirApp(p, amb.ORIGEM);

  // ================================================================
  secao('1. Do capítulo 2, "Exportar em PDF": a caixa do gabarito vem marcada');
  await abrirPelaEstante(p, 'livro-com-gabarito');
  await esperar('a página 1', () => paginaDesenhada(p), v => v === '1', 30000);
  conf('o leitor do livro tem "Exportar em PDF"', await p.evaluate(() => !document.querySelector('#leitor-exportar').hidden), true);
  await irAoCapitulo(p, 'Capítulo 2');
  await esperar('a página 3', () => paginaDesenhada(p), v => v === '3', 15000);
  const j1 = await exportar(p, '#leitor-exportar');
  console.log('   janela: ' + JSON.stringify(j1));
  conf('o capítulo 2 vem escolhido, com as páginas dele', j1 && j1.capitulo, '[x] O capítulo: Capítulo 2: Frações (páginas 3 a 4)');
  conf('a caixa "Com o gabarito" vem marcada e ligada', j1 && j1.gabarito, 'marcada, ligada');
  // no veneno do gabarito do outro, quem diz que o defeito foi enxergado é o PDF, na seção 2
  const doOutro = MODO === '--envenenado-gabarito-do-outro';
  if (!doOutro) conf('e diz onde está o gabarito do capítulo 2', j1 && j1.motivo, '(gabarito: página 8, no fim do livro)');
  // o tamanho estimado (3 páginas a 500 KB), sem o aviso de 20 MB
  const tam = await p.evaluate(() => [document.querySelector('#livro-exportar-tamanho').textContent,
    document.querySelector('#livro-exportar-aviso-tamanho').hidden]);
  conf('a janela mostra o tamanho estimado, sem o aviso de 20 MB', tam.join(' | '),
    'Tamanho estimado do PDF: cerca de 1,5 MB (3 páginas do livro). | true');
  conf('com "O capítulo" marcado, o campo das páginas fica desligado', await p.evaluate(() => document.querySelector('#livro-exportar-quais').disabled), true);
  await p.evaluate(() => document.querySelector('#livro-exportar-aulas [data-aula="au1"]').click());
  await printar(p, 'c15c_janela_exportar.png');

  // sem espaço no tablet: a frase própria, e nada anexado
  await p.evaluate(() => { window.__estimarDeVerdade = navigator.storage.estimate.bind(navigator.storage);
    navigator.storage.estimate = () => Promise.resolve({ quota: 1000000, usage: 999000 }); });
  await p.evaluate(() => document.querySelector('#livro-exportar-anexar').click());
  const semEspaco = (await esperar('o aviso de falta de espaço', () => p.evaluate(() => document.querySelector('#aviso').textContent),
    v => /sem espaço/.test(v || ''), 10000)).valor || '';
  console.log('   aviso: ' + semEspaco);
  conf('sem espaço: a frase própria, sem "não consegui montar o PDF", e nada anexado',
    /O tablet está sem espaço para guardar este PDF \(cerca de 1,5 MB\)/.test(semEspaco) + ' | ' + /Não consegui montar/.test(semEspaco) +
    ' | ' + (await anexosDoLivro(p)).length, 'true | false | 0');
  await p.evaluate(() => { navigator.storage.estimate = window.__estimarDeVerdade; });

  // ================================================================
  secao('2. Gerar e anexar: o capítulo e o gabarito dele, num PDF só, na aula');
  const tamanhoDaCopia = () => p.evaluate(() => Store.carregar().then(d => Store.exportarTudo(d)).then(x => JSON.stringify(x).length));
  const copiaAntes = await tamanhoDaCopia();
  const an1 = await anexarNaAula(p, 0);
  const copiaDepois = await tamanhoDaCopia();
  console.log('   cópia de segurança: ' + copiaAntes + ' caracteres antes, ' + copiaDepois + ' depois (+' + (copiaDepois - copiaAntes) + ')');
  if (MODO === '--envenenado-pdf-na-copia') {
    secao('VENENO: o PDF exportado no depósito de anexos');
    conf('envenenado: a cópia cresceu o tamanho do PDF (defeito enxergado)', copiaDepois - copiaAntes > 100000, true);
    throw Object.assign(new Error('fim'), { fimDoVeneno: true });
  }
  conf('a cópia de segurança cresce só alguns KB (o registro do anexo, sem o PDF)', copiaDepois - copiaAntes < 4096, true);
  conf('e o PDF não está no depósito de anexos', await p.evaluate(i => Store.lerAnexo(i).then(r => !!r), an1 && an1.id), false);
  console.log('   anexo: ' + JSON.stringify(an1));
  if (!doOutro) {
    conf('um anexo só na aula, do livro, com as páginas do capítulo e as do gabarito',
      an1 ? [an1.livro.id, an1.livro.paginas.join(','), an1.livro.gabarito.join(','), /com_gabarito\.pdf$/.test(an1.nome)].join(' | ') : '',
      'livro-com-gabarito | 3,4 | 8 | true');
  }
  const b1 = Buffer.from((await lerAnexo(p, an1 && an1.id)) || '', 'base64');
  conf('o PDF está no depósito de anexos', b1.length > 1000 && b1.slice(0, 5).toString('latin1') === '%PDF-', true);
  const pg1 = lerPdf(b1);
  pg1.forEach((x, i) => console.log('   página ' + (i + 1) + ': ' + x.texto.slice(0, 260)));
  conf('três páginas: as duas do capítulo e a do gabarito', pg1.length, 3);
  const tudo1 = pg1.map(x => x.texto).join(' ');
  const iCap = tudo1.indexOf('Texto conhecido do capítulo 2, parte 1.');
  const iCap2 = tudo1.indexOf('Texto conhecido do capítulo 2, parte 2.');
  const iGab = tudo1.indexOf('Resposta conhecida do capítulo 2: três quartos.');
  if (MODO === '--envenenado-gabarito-do-outro') {
    secao('VENENO: o gabarito do outro capítulo');
    conf('envenenado: o PDF do capítulo 2 saiu com a resposta do capítulo 1 (defeito enxergado)',
      tudo1.indexOf('Resposta conhecida do capítulo 1') >= 0 && iGab < 0, true);
    throw Object.assign(new Error('fim'), { fimDoVeneno: true });
  }
  conf('o texto do capítulo 2 nas páginas 1 e 2, nessa ordem', iCap >= 0 && iCap2 > iCap && pg1[0].texto.indexOf('parte 1.') >= 0 && pg1[1].texto.indexOf('parte 2.') >= 0, true);
  conf('DEPOIS dele, o gabarito do capítulo 2, na página 3', iGab > iCap2 && pg1[2].texto.indexOf('Resposta conhecida do capítulo 2') >= 0, true);
  conf('e nem o gabarito do capítulo 1 nem o do 3', /Resposta conhecida do capítulo [13]/.test(tudo1), false);
  conf('a página 3 abre com o título "Gabarito: Capítulo 2: Frações"', pg1[2].textos[0], 'Gabarito: Capítulo 2: Frações');
  conf('cada página do livro entra como uma imagem', pg1.map(x => x.imagens).join(','), '1,1,1');
  const fontes = pg1.map(x => x.textos.filter(t => /^Fonte: /.test(t)).join(' '));
  if (MODO === '--envenenado-sem-fonte') {
    secao('VENENO: o PDF sem o rodapé de fonte');
    conf('envenenado: nenhuma página tem o rodapé de fonte (defeito enxergado)', fontes.every(f => !f), true);
    throw Object.assign(new Error('fim'), { fimDoVeneno: true });
  }
  conf('o rodapé de fonte em toda página, com título, autoria, editora, ano, capítulo e páginas',
    fontes.every(f => f === FONTE_ESPERADA + '; gabarito: página 8'), true);
  conf('o cabeçalho com a marca em toda página', pg1.every(x => x.textos.indexOf('Nathália Wajsenzon') >= 0 && x.textos.indexOf('APOIO EDUCACIONAL') >= 0), true);
  if (MODO === '--envenenado-travessao') {
    secao('VENENO: o travessão do livro passa');
    conf('envenenado: o travessão do capítulo 2 chegou ao PDF (defeito enxergado)', TRACOS.test(tudo1), true);
    throw Object.assign(new Error('fim'), { fimDoVeneno: true });
  }
  conf('o travessão do livro virou hífen ("Frações - a parte e o todo.")', tudo1.indexOf('Frações - a parte e o todo.') >= 0, true);
  // nos fluxos de conteúdo das páginas (o JPEG é binário, e qualquer byte aparece nele)
  conf('nenhum travessão nem meia-risca no PDF', TRACOS.test(pg1.map(x => x.fluxo).join('\n')), false);
  printarPdf(b1, 0, 'c15c_pdf_pagina1.png');
  printarPdf(b1, 2, 'c15c_pdf_gabarito.png');

  // ================================================================
  secao('3. Sem o gabarito: só o capítulo');
  await exportar(p, '#leitor-exportar');
  await p.evaluate(() => { const g = document.querySelector('#livro-exportar-gabarito'); g.click(); });
  conf('a caixa desmarcada', (await janela(p)).gabarito, 'desmarcada, ligada');
  const an2 = await anexarNaAula(p, 1);
  const pg2 = lerPdf(Buffer.from((await lerAnexo(p, an2 && an2.id)) || '', 'base64'));
  conf('duas páginas, só o capítulo, sem resposta nenhuma', pg2.length + ' | ' + /Resposta conhecida|Gabarito:/.test(pg2.map(x => x.texto).join(' ')), '2 | false');
  conf('o rodapé sem o gabarito', pg2.every(x => x.textos.indexOf(FONTE_ESPERADA) >= 0), true);

  // ================================================================
  secao('4. Páginas escolhidas');
  await exportar(p, '#leitor-exportar');
  await p.evaluate(() => {
    document.querySelector('#livro-exportar-paginas').click();
    const c = document.querySelector('#livro-exportar-quais');
    c.value = '5-6';
  });
  conf('com páginas escolhidas, o gabarito fica desligado e diz por quê', (await janela(p)).motivo, '(o gabarito acompanha o capítulo inteiro)');
  const an3 = await anexarNaAula(p, 2);
  const pg3 = lerPdf(Buffer.from((await lerAnexo(p, an3 && an3.id)) || '', 'base64'));
  conf('as páginas 5 e 6, do capítulo 3, com o nome dele no rodapé',
    pg3.length + ' | ' + pg3.every(x => x.textos.indexOf('Fonte: Livro com gabarito, Volume 2, Autora de Prova, Editora de Prova, 2026, Capítulo 3: Geometria plana, páginas 5 a 6') >= 0) +
    ' | ' + /capítulo 3, parte 1/.test(pg3[0].texto), '2 | true | true');
  await fecharModal(p, 'modal-leitor-pdf');

  // ================================================================
  secao('5. O livro sem gabarito diz isso');
  await abrirPelaEstante(p, 'livro-sem-gabarito');
  await esperar('a página 1', () => paginaDesenhada(p), v => v === '1', 30000);
  const j5 = await exportar(p, '#leitor-exportar');
  console.log('   janela: ' + JSON.stringify(j5));
  conf('"sem gabarito localizado neste livro", com a caixa desligada', j5 && (j5.motivo + ' | ' + j5.gabarito + ' | ' + j5.estado),
    '(sem gabarito localizado neste livro) | desmarcada, desligada | sem_no_livro');
  await fecharModal(p, 'modal-livro-exportar');
  await fecharModal(p, 'modal-leitor-pdf');

  // ================================================================
  secao('6. O EPUB: o aviso das fórmulas, e o capítulo remontado');
  await abrirPelaEstante(p, 'livro-de-prova');
  await esperar('a parte 1 do EPUB', () => p.evaluate(() => (document.querySelector('#corpo-modal-leitor-epub') || {}).dataset.capituloAberto || ''), v => v === '1', 20000);
  const j6 = await exportar(p, '#epub-exportar');
  console.log('   janela: ' + JSON.stringify(j6));
  conf('o aviso de que as fórmulas podem sair diferentes, sem páginas escolhidas',
    j6 && j6.avisoEpub + ' | ' + j6.paginas + ' | ' + j6.capitulo, 'true | false | [x] O capítulo: Capítulo 1: O começo (parte 1)');
  conf('o texto do aviso', await p.evaluate(() => document.querySelector('#livro-exportar-aviso-epub').textContent),
    'No EPUB, o texto e as figuras são remontados no PDF: as fórmulas podem sair diferentes do original. Confira antes de mandar.');
  const an6 = await anexarNaAula(p, 3);
  const pg6 = lerPdf(Buffer.from((await lerAnexo(p, an6 && an6.id)) || '', 'base64'));
  const tudo6 = pg6.map(x => x.texto).join(' ');
  conf('o texto do capítulo 1 remontado, com a figura, e o rodapé de fonte com a parte',
    /Parágrafo 1 do capítulo 1/.test(tudo6) + ' | ' + (pg6.reduce((s, x) => s + x.imagens, 0) >= 1) + ' | ' +
    pg6.every(x => x.textos.some(t => /^Fonte: Livro de prova em EPUB, Autora de Prova, Editora de Prova, 2026, Capítulo 1: O começo, parte 1$/.test(t))),
    'true | true | true');
  conf('e nada do capítulo 2', /do capítulo 2/.test(tudo6), false);
  await fecharModal(p, 'modal-leitor-epub');

  // ================================================================
  secao('8. A cópia restaurada noutro tablet: "Gerar de novo"');
  const copia = await p.evaluate(() => Store.carregar().then(d => Store.exportarTudo(d)));
  // "Apagar todos os dados" leva os PDFs exportados e fica com os livros: é o tablet novo com o pacote importado
  await p.evaluate(async c => { await Store.apagarTudo(); await Store.importarTudo(c); }, copia);
  conf('depois de restaurar, o PDF do capítulo 2 não está no tablet', await p.evaluate(i => Store.lerExportado(i).then(r => !!r), an1.id), false);
  await H.abrirApp(p, amb.ORIGEM);
  conf('a aula abriu', await abrirAulaDeHoje(p, '09:00'), true);
  const linha = (await esperar('o anexo com "Gerar de novo"', () => p.evaluate(i => {
    const l = document.querySelector('#lista-anexos [data-anexo-id="' + i + '"]');
    const b = l && l.querySelector('[data-gerar-de-novo]');
    return l && b && !b.closest('[hidden]') ? l.innerText.replace(/\s+/g, ' ') : '';
  }, an1.id), v => !!v, 10000)).valor || '';
  console.log('   linha: ' + linha);
  conf('o anexo diz de onde veio e oferece "Gerar de novo"',
    /Exportado do livro Livro com gabarito, Volume 2, Capítulo 2: Frações, com o gabarito/.test(linha) && /Gerar de novo/.test(linha), true);
  await p.evaluate(i => document.querySelector('#lista-anexos [data-gerar-de-novo="' + i + '"]').click(), an1.id);
  const refeito = (await esperar('o PDF gerado de novo', () => lerAnexo(p, an1.id), v => !!v, 60000)).valor;
  const pg8 = refeito ? lerPdf(Buffer.from(refeito, 'base64')) : [];
  const tudo8 = pg8.map(x => x.texto).join(' ');
  conf('o "Gerar de novo" refez o capítulo 2 e o gabarito dele, no mesmo anexo',
    pg8.length + ' | ' + (tudo8.indexOf('Texto conhecido do capítulo 2, parte 1.') >= 0) + ' | ' +
    (tudo8.indexOf('Resposta conhecida do capítulo 2') > tudo8.indexOf('parte 2.')) + ' | ' + /capítulo [13]:/.test(tudo8), '3 | true | true | false');
  await esperar('a linha sem o "Gerar de novo"', () => p.evaluate(i => {
    const l = document.querySelector('#lista-anexos [data-anexo-id="' + i + '"]');
    return !!l && !l.querySelector('[data-gerar-de-novo]');
  }, an1.id), v => v, 5000);
  // sem o livro no tablet: a frase diz que falta o livro
  await p.evaluate(async i => { await Store.apagarExportado(i); await Store.removerLivro('livro-com-gabarito'); }, an1.id);
  await fecharModal(p, 'modal-aula');
  await H.abrirApp(p, amb.ORIGEM);
  await abrirAulaDeHoje(p, '09:00');
  await esperar('o "Gerar de novo" de novo', () => p.evaluate(i => !!document.querySelector('#lista-anexos [data-gerar-de-novo="' + i + '"]'), an1.id), v => v, 10000);
  await p.evaluate(i => document.querySelector('#lista-anexos [data-gerar-de-novo="' + i + '"]').click(), an1.id);
  const falta = (await esperar('a frase do livro que falta', () => p.evaluate(() => document.querySelector('#aviso').textContent),
    v => /Falta o livro/.test(v || ''), 10000)).valor || '';
  conf('sem o livro, a frase diz que falta o livro', falta.indexOf('Falta o livro "Livro com gabarito, Volume 2" neste tablet.') >= 0, true);
  await fecharModal(p, 'modal-aula');

  secao('7. Nenhum erro de página');
  conf('nenhum erro', p.errosDePagina.join(' | '), '');
})().then(() => H.fim(amb)(), e => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e)));
