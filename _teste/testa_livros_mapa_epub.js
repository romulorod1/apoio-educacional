/* testa_livros_mapa_epub.js
 *
 * Item 12a, parte 0 (o mapa de capítulos para EPUB), no Chrome de verdade,
 * sobre o EPUB SINTÉTICO do gerador (biblioteca/_prova_mapa_epub.py
 * --pacote): quatro partes, e dois capítulos ("Primeiro" em p2 e "Segundo" em
 * p5) começam na MESMA parte 2, como no FME de teoria. O livro é gravado pelo
 * Store.gravarLivros de verdade, primeiro como estava no tablet (sem mapa e
 * sem sumário, o pacote de antes) e com uma posição de leitura no formato de
 * antes da fase 1a, depois com o meta novo do gerador (o mesmo arquivo).
 * Alunos e aulas fictícios. Nenhum livro real, nenhuma conta.
 *
 * O que se prova:
 *   1. a troca de meta não mexe na posição antiga, byte a byte;
 *   2. a tela do livro mostra o sumário do mapa, os assuntos de cada capítulo
 *      e "Continuar no capítulo 3"; o leitor abre na parte 3, na mesma fração
 *      em que ela estava (a posição antiga continua valendo), e o sumário do
 *      leitor é o do mapa;
 *   3. "Abrir no livro" na aula: o assunto do "Primeiro" lista o capítulo 1 e
 *      o 3; o toque no 1 abre a parte 2 com a âncora p2 no alto, e a faixa
 *      "Este capítulo cobre" é a do capítulo 1 (e não a do 2, que começa na
 *      mesma parte); o do "Segundo" abre a parte 2 com a p5 no alto;
 *   4. nenhum erro de página.
 *
 * Venenos (a prova TEM de ver o defeito e passa dizendo que viu):
 *   --envenenado-sem-ancora         o "Abrir no livro" não passa a âncora: a
 *                                   parte certa, no alto dela (p2 não está no alto
 *                                   do Segundo);
 *   --envenenado-cobre-sem-ancora   a faixa ignora a âncora: o capítulo 1 mostra
 *                                   o 2;
 *   --envenenado-posicao-solta      a troca de meta apaga a posição (o
 *                                   posicoesSoltas de antes da 1a): o leitor
 *                                   abre na parte 1.
 *
 *   node _teste/testa_livros_mapa_epub.js [--envenenado-...]
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const H = require('./_bib_navegador.js');
const RELOGIO = H.relogioDaRodada('2026-11-16', '11:00');
const { conf, secao, esperar } = H;

const PORTA = 8983;
const PYTHON = process.env.PYTHON || 'python';
const ler = n => fs.readFileSync(path.join(H.RAIZ, n), 'utf8').replace(/\r\n/g, '\n');
const APP = ler('app.js');
const BIB = ler('biblioteca.js');
const STORE = ler('store.js');
const VENENOS = {
  '--envenenado-sem-ancora': ['app', 'abrirLivro(a.id, e.obraInteira ? null : (epub ? { capitulo: e.capitulo, ancora: e.ancora } : { pagina: e.pagina }));',
    'abrirLivro(a.id, e.obraInteira ? null : (epub ? { capitulo: e.capitulo, ancora: null } : { pagina: e.pagina }));'],
  '--envenenado-cobre-sem-ancora': ['bib', "if (formato === 'epub' && ancora) {", 'if (false) {'],
  // o mesmo arquivo com meta novo (o caso do mapa que chega): a posição apagada, como antes da 1a
  '--envenenado-posicao-solta': ['store', 'if (mesmoArquivo) {\n              contas.iguais++;',
    "if (mesmoArquivo) {\n              contas.iguais++; t.objectStore('livros_posicoes').delete(l.meta.id);"]
};
const MODO = Object.keys(VENENOS).filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && !VENENOS[a]);
const FONTES = { app: [APP, '/app.js'], bib: [BIB, '/biblioteca.js'], store: [STORE, '/store.js'] };
const trocas = {};
if (MODO) {
  const [qual, de, para] = VENENOS[MODO];
  trocas[FONTES[qual][1]] = FONTES[qual][0].split(de).join(para);
}
const amb = H.criarAmbiente(PORTA, 'nath_mapa_epub', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mapa_epub_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });
const hojeIso = RELOGIO.dia(0);
const ID = 'sem-sumario';

function gerarPacote() {
  const r = spawnSync(PYTHON, ['-X', 'utf8', path.join(H.RAIZ, 'biblioteca', '_prova_mapa_epub.py'), '--pacote', TMP], { encoding: 'utf8' });
  const manifest = path.join(TMP, 'trabalho', 'manifest.json');
  if (r.status !== 0 || !fs.existsSync(manifest)) { console.log(String(r.stderr || '').slice(0, 800)); return null; }
  const m = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  const meta = m.livros.find(l => l.id === ID);
  const epub = fs.readFileSync(path.join(TMP, 'Livros', 'matematica', ID + '.epub'));
  return { meta, b64: epub.toString('base64') };
}

const gravar = (pag, versao, meta, b64) => pag.evaluate(async (versao, meta, b64) => {
  const bin = atob(b64); const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return Store.gravarLivros({ manifest: { pacote: 'prova-mapa-epub', versao }, livros: [{ meta, blob: new Blob([u], { type: 'application/epub+zip' }) }] });
}, versao, meta, b64);
const posicaoCrua = pag => pag.evaluate(i => new Promise((ok, falha) => {
  const q = indexedDB.open('apoio-educacional');
  q.onerror = () => falha(q.error);
  q.onsuccess = () => {
    const b = q.result; const tr = b.transaction(['livros_posicoes'], 'readonly');
    let r = null;
    tr.objectStore('livros_posicoes').get(i).onsuccess = e => { r = e.target.result ? JSON.stringify(e.target.result) : null; };
    tr.oncomplete = () => { b.close(); ok(r); };
    tr.onerror = () => { b.close(); falha(tr.error); };
  };
}), ID);
const epubAberto = pag => pag.evaluate(() => {
  const c = document.querySelector('#corpo-modal-leitor-epub');
  return c && document.querySelector('#modal-leitor-epub.aberto') ? (c.dataset.capituloAberto || '') : 'fechado';
});
// onde a leitura está dentro da parte: a fração rolada e o alto de cada âncora pedida
const dentroDaParte = (pag, ancora) => pag.evaluate(a => {
  const q = document.querySelector('#epub-quadro');
  const w = q && q.contentWindow, d = q && q.contentDocument;
  if (!d || !d.body) return null;
  const max = Math.max(1, d.documentElement.scrollHeight - w.innerHeight);
  const alvo = a ? d.getElementById(a) : null;
  return { fracao: Math.round(w.scrollY / max * 100) / 100, alto: alvo ? Math.round(alvo.getBoundingClientRect().top) : null, max };
}, ancora);
const cobre = pag => pag.evaluate(() => {
  const c = document.querySelector('#epub-cobre');
  if (!c || c.hidden) return null;
  return { capitulo: c.dataset.capitulo || '', assuntos: c.dataset.assuntos || '' };
});
async function fecharModal(pag, id) {
  await pag.evaluate(i => { const b = document.querySelector('#' + i + ' .modal-rodape [data-fechar]') || document.querySelector('#' + i + ' [data-fechar]'); if (b) b.click(); }, id);
  await esperar('a janela ' + id + ' fechou', () => pag.evaluate(i => !document.querySelector('#' + i + '.aberto'), id), v => v, 5000);
}
async function abrirTela(pag) {
  await H.irParaAba(pag, 'biblioteca');
  await esperar('o livro na aba Biblioteca', () => pag.evaluate(i => {
    const sel = '#bib-livros [data-livro="' + i + '"]';
    if (document.querySelector(sel)) return true;
    const d = document.querySelector('#bib-livros .bibl-disciplina[data-disciplina="matematica"]'); if (d) d.click();
    const a = document.querySelector('#bib-livros .bibl-ano[data-ano="em1"]'); if (a) a.click();
    return !!document.querySelector(sel);
  }, ID), v => v, 10000);
  await pag.evaluate(i => document.querySelector('#bib-livros [data-livro="' + i + '"]').click(), ID);
  await esperar('a tela do livro', () => pag.evaluate(i => {
    const t = document.querySelector('#bib-livro'); return !!t && !t.hidden && t.dataset.livro === i;
  }, ID), v => v, 10000);
}
async function abrirAulaDeHoje(pag, hora) {
  await H.irParaAba(pag, 'agenda');
  for (let i = 0; i < 24; i++) {
    if (await pag.evaluate(h => !!document.querySelector('[data-dia="' + h + '"]'), hojeIso)) break;
    await pag.click(i < 12 ? '#mes-seguinte' : '#mes-anterior');
  }
  const ok = await pag.evaluate((h, hr) => {
    const alvo = Array.from(document.querySelectorAll('[data-dia="' + h + '"] .pilula')).find(p => p.textContent.indexOf(hr) === 0);
    if (!alvo) return false; alvo.click(); return true;
  }, hojeIso, hora);
  await esperar('aula das ' + hora + ' aberta', () => pag.evaluate(() => document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);
  return ok;
}
const linhasDosLivros = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#corpo-modal-livros [data-livro]'))
  .map(l => l.getAttribute('data-livro') + '#' + l.getAttribute('data-capitulo')));

async function abrirNoLivro(pag, assunto, capitulo) {
  await esperar('o botão "Abrir no livro" de ' + assunto, () => pag.evaluate(a => !!document.querySelector('#corpo-modal-aula [data-abrir-no-livro="' + a + '"]'), assunto), v => v, 10000);
  await pag.evaluate(a => document.querySelector('#corpo-modal-aula [data-abrir-no-livro="' + a + '"]').click(), assunto);
  const linhas = (await esperar('a lista dos livros de ' + assunto, () => linhasDosLivros(pag), v => !!v && v.length > 0, 5000)).valor || [];
  await pag.evaluate((i, c) => document.querySelector('#corpo-modal-livros [data-livro="' + i + '"][data-capitulo="' + c + '"]').click(), ID, String(capitulo));
  return linhas.join(',');
}

(async () => {
  secao('0. A prova se confere e o pacote');
  conf('nenhum veneno desconhecido foi pedido', desconhecidos.join(','), '');
  Object.keys(VENENOS).forEach(m => {
    const [qual, de] = VENENOS[m];
    conf('o ponto de ' + m + ' existe uma vez', FONTES[qual][0].split(de).length - 1, 1);
  });
  const P = gerarPacote();
  conf('o gerador fez o EPUB de prova com o mapa por parte e âncora', !!P && P.meta.mapa_origem === 'mapa' && P.meta.sumario_origem === 'mapa', true);
  if (!P) throw Object.assign(new Error('sem pacote'), { jaContado: true });
  const ASSUNTO1 = P.meta.mapa[0].assuntos[0].id, ASSUNTO2 = P.meta.mapa[1].assuntos[0].id;
  conf('o mapa do pacote: Primeiro em 2#p2, Segundo em 2#p5, Terceiro em 3, Quarto em 4#p11',
    P.meta.mapa.map(e => e.capitulo + '#' + (e.ancora || '')).join(' '), '2#p2 2#p5 3# 4#p11');

  await amb.subir();
  const pag = await amb.pagina();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await RELOGIO.naPagina(pag);
  await pag.setViewport({ width: 1280, height: 800 });
  await H.abrirApp(pag, amb.ORIGEM);

  secao('1. O livro de antes, com a posição de antes, e o meta novo');
  const antigo = Object.assign({}, P.meta, { sumario: [], sumario_origem: 'nenhum', mapa: [], mapa_origem: 'nenhum' });
  delete antigo.sumario_nota;
  const c1 = await gravar(pag, 1, antigo, P.b64);
  conf('o livro de antes entrou', c1.novos, 1);
  // a posição no formato de antes da fase 1a: sem sha e sem ancoraVista
  await pag.evaluate(i => Store.gravarPosicaoLivro({ id: i, capitulo: 3, fracao: 0.5 }), ID);
  const posAntes = await posicaoCrua(pag);
  conf('controle: a posição antiga foi gravada', !!posAntes && JSON.parse(posAntes).capitulo === 3, true);
  const c2 = await gravar(pag, 2, P.meta, P.b64);
  console.log('   contas do meta novo: ' + JSON.stringify(c2));
  const posDepois = await posicaoCrua(pag);
  if (MODO === '--envenenado-posicao-solta') {
    conf('VENENO visto: a troca de meta apagou a posição', posDepois, 'null');
  } else {
    conf('a troca de meta não mexeu na posição, byte a byte', posDepois, posAntes);
  }

  // alunos e aulas fictícios: uma aluna da 1ª série com aula hoje, com os assuntos do Primeiro e do Segundo
  await pag.evaluate(async (hoje, a1, a2) => {
    const d = (await Store.carregar()) || Store.bancoVazio();
    d.alunos = [{ id: 'aem1', nome: 'Aluna Médio Teste', responsavel: 'Responsável Teste', ativo: true, anoEscolar: 'em1',
      precos: [{ id: 'paem1', inicio: '2026-01-01', fim: null, valorHora: 100 }] }];
    d.aulas = [{ id: 'au1', alunoId: 'aem1', data: hoje, hora: '09:00', duracaoMin: 60, status: 'realizada', cobravel: true,
      areas: [], anexos: [], temas: [{ id: a1, titulo: 'Assunto do primeiro', fonte: 'banco', disciplina: 'matematica' },
        { id: a2, titulo: 'Assunto do segundo', fonte: 'banco', disciplina: 'matematica' }] }];
    await Store.salvar(d);
  }, hojeIso, ASSUNTO1, ASSUNTO2);
  await H.abrirApp(pag, amb.ORIGEM);

  secao('2. A tela do livro e a posição antiga');
  await abrirTela(pag);
  const tela = await pag.evaluate(() => ({
    caps: Array.from(document.querySelectorAll('#bib-livro .bibl-cap')).map(b => b.dataset.capitulo + ':' + b.querySelector('.bibl-cap-titulo').textContent).join(' | '),
    continuar: (document.querySelector('#bib-livro-continuar') || {}).textContent || '' }));
  conf('o sumário da tela é o do mapa, por parte', tela.caps, '2:Primeiro do mapa | 2:Segundo do mapa | 3:Terceiro do mapa | 4:Quarto do mapa');
  if (MODO !== '--envenenado-posicao-solta') conf('a tela diz "Continuar no capítulo 3"', tela.continuar, 'Continuar no capítulo 3');
  await pag.evaluate(() => document.querySelector('#bib-livro-continuar').click());
  const parte = (await esperar('a parte aberta', () => epubAberto(pag), v => /^\d+$/.test(v || ''), 20000)).valor;
  if (MODO === '--envenenado-posicao-solta') {
    conf('VENENO visto: sem a posição, o leitor abriu na parte 1', parte, '1');
    return;
  }
  conf('o leitor abre na parte 3, onde ela parou', parte, '3');
  const onde = (await esperar('a fração da parte 3', () => dentroDaParte(pag, null), v => !!v && v.fracao > 0.3, 10000)).valor;
  conf('na mesma fração (0,5, com folga de 0,05)', !!onde && Math.abs(onde.fracao - 0.5) <= 0.05, true);
  await pag.evaluate(() => document.querySelector('#epub-sumario').click());
  const sumLeitor = await pag.evaluate(() => Array.from(document.querySelectorAll('#epub-sumario-lista [data-entrada]')).map(b => b.textContent).join(','));
  conf('o sumário do leitor é o do mapa', sumLeitor, 'Primeiro do mapa,Segundo do mapa,Terceiro do mapa,Quarto do mapa');
  await fecharModal(pag, 'modal-leitor-epub');

  secao('3. "Abrir no livro" na parte e na âncora');
  conf('a aula de hoje abriu', await abrirAulaDeHoje(pag, '09:00'), true);
  conf('o assunto do Primeiro lista o capítulo 1 e o 3', await abrirNoLivro(pag, ASSUNTO1, 1), ID + '#1,' + ID + '#3');
  conf('o toque no capítulo 1 abre a parte 2', (await esperar('a parte 2', () => epubAberto(pag), v => /^\d+$/.test(v || ''), 20000)).valor, '2');
  const c1v = (await esperar('a faixa do capítulo aberto', () => cobre(pag), v => !!v && !!v.capitulo, 10000)).valor;
  if (MODO === '--envenenado-cobre-sem-ancora') {
    conf('VENENO visto: a faixa do capítulo 1 mostra o capítulo 2', c1v && c1v.capitulo, '2');
    return;
  }
  // sem a âncora, a faixa também erra aqui; o veneno é visto adiante, pelo alto da p5
  if (MODO !== '--envenenado-sem-ancora') {
    conf('a faixa é a do capítulo 1, com o assunto dele (e não a do 2, da mesma parte)', c1v && c1v.capitulo + '/' + c1v.assuntos, '1/' + ASSUNTO1);
    const p2 = (await esperar('a âncora p2', () => dentroDaParte(pag, 'p2'), v => !!v && v.alto !== null && v.max > 200, 10000)).valor;
    conf('a âncora p2 está no alto da tela (de 0 a 40 px)', !!p2 && p2.alto >= 0 && p2.alto <= 40, true);
  }
  await fecharModal(pag, 'modal-leitor-epub');
  if (await pag.evaluate(() => document.querySelector('#modal-livros.aberto'))) await fecharModal(pag, 'modal-livros');
  conf('o assunto do Segundo lista o capítulo 2 e o 4', await abrirNoLivro(pag, ASSUNTO2, 2), ID + '#2,' + ID + '#4');
  conf('o toque no capítulo 2 abre a parte 2', (await esperar('a parte 2', () => epubAberto(pag), v => /^\d+$/.test(v || ''), 20000)).valor, '2');
  const alto = (await esperar('a âncora p5', () => dentroDaParte(pag, 'p5'), v => !!v && v.alto !== null && v.max > 200, 10000)).valor;
  if (MODO === '--envenenado-sem-ancora') {
    conf('VENENO visto: sem a âncora, a p5 não está no alto (abriu no começo da parte)', !!alto && (alto.alto > 60 || alto.alto < -10), true);
    return;
  }
  conf('a âncora p5 está no alto da tela (de 0 a 40 px)', !!alto && alto.alto >= 0 && alto.alto <= 40, true);
  const c2v = (await esperar('a faixa do capítulo 2', () => cobre(pag), v => !!v && !!v.capitulo, 10000)).valor;
  conf('a faixa é a do capítulo 2', c2v && c2v.capitulo + '/' + c2v.assuntos, '2/' + ASSUNTO2);
  await fecharModal(pag, 'modal-leitor-epub');

  secao('4. Nenhum erro de página');
  conf('nenhum erro', erros.join(' | '), '');
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
