/* testa_assunto_lado_a_lado.js
 *
 * A fatia B6 do redesenho: o ASSUNTO LADO A LADO. Para um assunto do índice e
 * o ano dele, uma tabela com os assuntos irmãos (o tema do índice) nas
 * linhas, os livros do tablet daquela matéria e daquele ano nas colunas, e em
 * cada célula o capítulo e as páginas do arquivo; onde o mapa não liga, a
 * célula diz "não trata" (mapa revisado) ou "sem mapa" (mapa ainda não
 * revisado). No Chrome de verdade, com três livros SINTÉTICOS do 6º ano de
 * Matemática gerados aqui (PDFs de texto, sem conteúdo de terceiro) e mapas
 * diferentes:
 *   livro-a  o mapa da orquestradora (revisado): Frações (MAT06-05) nos
 *            capítulos 2 e 3, Operações com frações (MAT06-06) no 3,
 *            decimais (MAT06-07) no 4;
 *   livro-b  o mapa da orquestradora (revisado), sem Frações: MAT06-01 e
 *            MAT06-06 só;
 *   livro-c  o passe automático (não revisado): MAT06-07 no capítulo 1, o 2
 *            sem assunto.
 * Aluno e aula fictícios ("Aluno Alfa Teste"). Nenhum livro de verdade.
 *
 * O que prova:
 *   1. a tabela: as linhas (os 8 assuntos de Números do 6º ano) e as
 *      colunas (os três livros); a célula de Frações no livro-a tem os dois
 *      capítulos com as páginas do arquivo; "não trata" no livro-b e "sem
 *      mapa" no livro-c (frases diferentes); a falha salta na coluna de
 *      ícone da linha;
 *   2. tocar na célula abre o leitor na página do arquivo do capítulo;
 *   3. o "N livros" do painel do capítulo e o "Comparar livros por assunto"
 *      da aba chegam à MESMA tabela;
 *   4. a busca de assunto atravessa os anos e mostra o ano e a quantidade de
 *      livros de cada um; o assunto de um ano sem livro diz que não há livro;
 *   5. a correção dela no mapa (db.ajustes.mapaDosLivros) aparece na tabela:
 *      o livro-c confirmado e corrigido passa a revisado ("não trata" onde
 *      era "sem mapa", e o capítulo onde ela ligou Frações);
 *   6. a aula: "Abrir no livro" oferece "Ver em todos os livros", e a linha
 *      do assunto da aula volta ao "Abrir no livro";
 *   7. tablet 1280x800 e 800 px (em pé), a 100% e a 130%: nada transborda,
 *      a página não rola de lado, alvos de 48 px, sem travessão;
 *   8. 15 livros e 16 assuntos abrem sem travar (medido), nada gravado, e
 *      nenhum erro de página.
 *
 * Veneno:
 *   node _teste/testa_assunto_lado_a_lado.js --envenenado-nao-trata-vira-sem-mapa
 *     o app.js servido troca as duas ausências ("sem mapa" onde o mapa foi
 *     revisado, "não trata" onde não foi): a prova TEM de ver ("VENENO visto").
 *
 *   --prints <pasta>   grava os prints do painel cego (tablet 1280x800, escala 2).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8958;
const VENENOS = ['--envenenado-nao-trata-vira-sem-mapa'];
const VENENO = process.argv.indexOf('--envenenado-nao-trata-vira-sem-mapa') !== -1;
const iPrints = process.argv.indexOf('--prints');
const PRINTS = iPrints > 0 ? process.argv[iPrints + 1] : null;

const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const ANCORA = "return { tipo: revisado ? 'nao-trata' : 'sem-mapa' };";
const trocas = {};
if (VENENO) trocas['/app.js'] = APP.split(ANCORA).join("return { tipo: revisado ? 'sem-mapa' : 'nao-trata' };");

const relogio = H.relogioDaRodada('2026-11-11', '09:00');
const hojeIso = relogio.iso;
const amb = H.criarAmbiente(PORTA, 'perfil_assunto_lado_a_lado', trocas);

const LETRA_130 = 'html{font-size:130%} body{font-size:20.8px}';
const letra = (pag, css) => pag.evaluate(c => {
  const v = document.querySelector('#prova-letra'); if (v) v.remove();
  if (c) { const s = document.createElement('style'); s.id = 'prova-letra'; s.textContent = c; document.head.appendChild(s); }
}, css);

/* Um PDF de texto com n páginas ("Pagina k" em cada uma), escrito aqui. */
function pdfDePaginas(n) {
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const kids = [];
  for (let i = 1; i <= n; i++) {
    const txt = 'BT /F1 36 Tf 72 700 Td (Pagina ' + i + ') Tj ET';
    objs.push('<< /Length ' + txt.length + ' >>\nstream\n' + txt + '\nendstream');
    const c = objs.length;
    objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ' + c + ' 0 R /Resources << /Font << /F1 3 0 R >> >> >>');
    kids.push(objs.length);
  }
  objs[1] = '<< /Type /Pages /Kids [' + kids.map(k => k + ' 0 R').join(' ') + '] /Count ' + n + ' >>';
  let out = '%PDF-1.4\n';
  const offs = [];
  objs.forEach((o, i) => { offs.push(Buffer.byteLength(out)); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
  const xref = Buffer.byteLength(out);
  out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
  return Buffer.from(out, 'latin1').toString('base64');
}

// um livro sintético: capítulos [titulo, pagina, pagina_fim, [ids]] e a origem do mapa
function livro(id, titulo, materia, series, caps, origem, paginas) {
  return {
    id, titulo, formato: 'pdf', paginas, materia, series, series_origem: 'mapa', mapa_disciplina: materia, hash: 'sintetico-' + id,
    sumario: caps.map(c => ({ nivel: 1, titulo: c[0], pagina: c[1], pagina_fim: c[2] })), sumario_origem: 'marcadores',
    mapa: caps.map((c, i) => ({ n: i + 1, titulo: c[0], pagina: c[1], pagina_fim: c[2], assuntos: c[3].map(x => ({ id: x })), origem })),
    mapa_origem: origem
  };
}
const LIVROS = [
  livro('livro-a', 'Matemática A', 'matematica', ['06'], [
    ['Capítulo 1: Números naturais', 1, 2, ['MAT06-01']],
    ['Capítulo 2: Frações', 3, 4, ['MAT06-05']],
    ['Capítulo 3: Comparar e operar frações', 5, 6, ['MAT06-05', 'MAT06-06']],
    ['Capítulo 4: Decimais', 7, 8, ['MAT06-07']]], 'mapa', 8),
  livro('livro-b', 'Matemática B', 'matematica', ['06'], [
    ['Capítulo 1: Sistema de numeração', 1, 2, ['MAT06-01']],
    ['Capítulo 2: Operações com frações', 3, 4, ['MAT06-06']],
    ['Capítulo 3: Geometria', 5, 6, []]], 'mapa', 6),
  livro('livro-c', 'Matemática C', 'matematica', ['06'], [
    ['Capítulo 1: Decimais', 1, 2, ['MAT06-07']],
    ['Capítulo 2: Partes do inteiro', 3, 4, []]], 'auto', 4)
];

async function gravarLivros(pag, livros, pacote) {
  return pag.evaluate(async (ls, pac) => {
    const aberto = { manifest: { pacote: pac, versao: 1 }, livros: ls.map(l => {
      const bin = atob(l.pdf); const u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      return { meta: l.meta, blob: new Blob([u], { type: 'application/pdf' }) };
    }) };
    const c = await Store.gravarLivros(aberto);
    return c.novos;
  }, livros.map(m => ({ meta: m, pdf: pdfDePaginas(m.paginas) })), pacote);
}

const clicar = (pag, sel) => pag.evaluate(s => { const b = document.querySelector(s); if (!b) return false; b.click(); return true; }, sel);

// o que a tela lado a lado mostra agora
const lerLado = pag => pag.evaluate(() => {
  const t = document.querySelector('#lado-a-lado');
  if (!t || t.hidden) return { visivel: false };
  const tx = s => ((t.querySelector(s) || {}).textContent || '').replace(/\s+/g, ' ').trim();
  return {
    visivel: true, modo: t.dataset.modo || '', escolhido: t.dataset.escolhido || '',
    titulo: tx('#lado-titulo'), resumo: tx('#lado-resumo'), voltar: tx('#lado-voltar'),
    colunas: Array.from(t.querySelectorAll('.lado-livro')).map(c => c.dataset.livro).join(','),
    cabecas: Array.from(t.querySelectorAll('.lado-livro')).map(c => c.dataset.livro + '=' + c.querySelector('.bibl-apoio').textContent +
      (c.querySelector('[data-falta]') ? '|' + c.querySelector('[data-falta]').textContent : '')).join(' ; '),
    linhas: Array.from(t.querySelectorAll('.lado-linha[data-assunto]')).map(l => l.dataset.assunto).join(','),
    marcada: Array.from(t.querySelectorAll('.lado-linha.escolhido')).map(l => l.dataset.assunto).join(','),
    celulas: Array.from(t.querySelectorAll('.lado-linha[data-assunto]')).map(l => l.dataset.assunto + ':' +
      Array.from(l.querySelectorAll('.lado-celula')).map(c => c.dataset.livro + '=' + c.innerText.replace(/\s+/g, ' ').trim()).join('|')).join(' ; '),
    sinais: Array.from(t.querySelectorAll('.lado-linha[data-assunto]')).map(l => {
      const i = l.querySelector('.lado-sinal svg'); return l.dataset.assunto + '=' + (i ? i.dataset.iconeNome : '-');
    }).join(','),
    anos: Array.from(t.querySelectorAll('.lado-anos .bibl-ano')).map(b => b.dataset.ano + (b.classList.contains('ativo') ? '*' : '')).join(','),
    semLivros: tx('#lado-sem-livros'),
    abrirNoLivro: !!t.querySelector('#lado-abrir-no-livro'),
    rodape: Array.from(t.querySelectorAll('.lado-abrir')).map(b => b.dataset.livro + '=' + b.textContent.trim()).join(','),
    cobreOTrilho: (() => { const e = document.elementFromPoint(40, 400); return !!e && !!e.closest('#lado-a-lado'); })()
  };
});
const paginaDesenhada = pag => pag.evaluate(() => {
  const c = document.querySelector('#corpo-modal-leitor-pdf');
  return c && document.querySelector('#modal-leitor-pdf.aberto') ? (c.dataset.paginaDesenhada || '') : 'fechado';
});
async function fecharModal(pag, id) {
  await pag.evaluate(i => { const b = document.querySelector('#' + i + ' .modal-rodape [data-fechar]'); if (b) b.click(); }, id);
  await esperar('a janela ' + id + ' fechou', () => pag.evaluate(i => !document.querySelector('#' + i + '.aberto'), id), v => v, 5000);
  await pausa(300);
}
async function abrirBibliotecaNoAno(pag, disciplina, ano) {
  await H.irParaAba(pag, 'biblioteca');
  await esperar('a seção de livros', () => pag.evaluate(() => !!document.querySelector('#bib-livros .bibl-disciplina')), v => v, 10000);
  await clicar(pag, '#bib-livros .bibl-disciplina[data-disciplina="' + disciplina + '"]');
  await clicar(pag, '#bib-livros .bibl-ano[data-ano="' + ano + '"]');
  await esperar('o "Comparar livros por assunto"', () => pag.evaluate(() => !!document.querySelector('#bib-comparar')), v => v, 10000);
}
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

/* A trava de transbordo na tela: texto e botão dentro da caixa (na tabela,
 * dentro da grade, que pode rolar de lado sozinha), a página sem rolagem de
 * lado, alvos de 48 px, sem travessão nem caixa alta. */
const medir = pag => pag.evaluate(() => {
  const ruins = [];
  const caixa = document.querySelector('#lado-a-lado');
  if (!caixa || caixa.hidden) return ['sem a tela'];
  const cr = caixa.getBoundingClientRect();
  const grade = caixa.querySelector('.lado-grade');
  const gr = grade ? grade.getBoundingClientRect() : null;
  const nome = e => (e.id || e.dataset.livro || e.dataset.assunto || e.dataset.ano || e.className.baseVal || e.className || e.tagName) + '';
  caixa.querySelectorAll('button, .bibl-forte, .bibl-apoio, .lado-assunto, .lado-nao, .lado-sem, .lado-pg-cap, .lado-pg-p, .tag, h2, input').forEach(e => {
    const r = e.getBoundingClientRect();
    if (!r.width && !r.height) return;
    const dentro = grade && grade.contains(e) ? gr : cr;
    if (r.left < dentro.left - 0.5 || r.right > dentro.right + 0.5) ruins.push(nome(e) + ' sai da área (' + Math.round(r.left) + '-' + Math.round(r.right) + ')');
    if (!(grade && grade.contains(e)) && r.right > innerWidth + 0.5) ruins.push(nome(e) + ' sai da tela');
    if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).textOverflow !== 'ellipsis' && e.tagName !== 'INPUT') ruins.push(nome(e) + ' transborda por dentro');
    if (e.tagName === 'BUTTON') {
      if (r.height < 47.5 || r.width < 47.5) ruins.push(nome(e) + ' com alvo de ' + Math.round(r.width) + 'x' + Math.round(r.height));
      const rg = document.createRange(); rg.selectNodeContents(e);
      const t = rg.getBoundingClientRect();
      if (t.width && (t.left < r.left - 0.5 || t.right > r.right + 0.5)) ruins.push(nome(e) + ': o texto sai do botão');
    }
  });
  if (document.documentElement.scrollWidth > innerWidth) ruins.push('a página rola de lado');
  if (/—|–/.test(caixa.innerText)) ruins.push('travessão no texto');
  if (/[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{5,}/.test(caixa.innerText)) ruins.push('caixa alta no texto');
  return ruins;
});

(async () => {
  secao('0. A prova se confere');
  conf('a lista de venenos não está vazia', VENENOS.length > 0, true);
  conf('a âncora do veneno (a ausência sem mapa revisado) aparece uma vez só no app.js', APP.split(ANCORA).length - 1, 1);
  if (VENENO) conf('o app.js servido está envenenado', trocas['/app.js'].indexOf(ANCORA) === -1, true);

  await amb.subir();
  const pag = await amb.pagina();
  await relogio.naPagina(pag);
  const errosDePagina = [];
  pag.on('pageerror', e => errosDePagina.push(e.message));
  pag.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errosDePagina.push(m.text()); });
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true, deviceScaleFactor: PRINTS ? 2 : 1 });
  await H.abrirApp(pag, amb.ORIGEM);
  await pag.evaluate(async h => {
    const d = await Store.carregar();
    d.alunos = [{ id: 'al_alfa', nome: 'Aluno Alfa Teste', responsavel: 'Responsável Alfa Teste', ativo: true, anoEscolar: '06',
      precos: [{ id: 'pa', inicio: '2026-01-01', fim: null, valorHora: 100 }] }];
    d.aulas = [{ id: 'au_fracoes', alunoId: 'al_alfa', data: h, hora: '10:00', duracaoMin: 60, status: 'agendada', cobravel: true,
      areas: [], anexos: [], temas: [{ id: 'MAT06-05', titulo: 'Frações: o que são e como comparar', fonte: 'banco', disciplina: 'matematica' }] }];
    await Store.salvar(d);
  }, hojeIso);
  conf('os três livros sintéticos entraram', await gravarLivros(pag, LIVROS, 'prova-b6'), 3);
  await H.abrirApp(pag, amb.ORIGEM);
  const antes = await pag.evaluate(() => Store.carregar().then(d => JSON.stringify(d)));

  // ================================================================
  secao('1. A tabela pelo "Comparar livros por assunto" da aba');
  await abrirBibliotecaNoAno(pag, 'matematica', '06');
  const chips = await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-comparar .bibl-comparar-chip')).map(b => (b.dataset.comparar || b.id) + '=' + b.innerText.replace(/\s+/g, ' ').trim()).join(' ; '));
  conf('a aba oferece os assuntos do ano que mais livros tratam, com a quantidade, e "Todos os N assuntos"', chips,
    'MAT06-01=Sistema de numeração decimal 2 livros ; MAT06-06=Operações com frações 2 livros ; MAT06-07=Números decimais e suas operações 2 livros ; ' +
    'MAT06-05=Frações: o que são e como comparar 1 livro ; bib-comparar-todos=Todos os 14 assuntos');
  conf('o título da seção diz o ano', await pag.evaluate(() => document.querySelector('#bib-comparar .bibl-rotulo').textContent), 'Comparar livros por assunto, 6º ano');
  await clicar(pag, '#bib-comparar [data-comparar="MAT06-05"]');
  let lado = (await esperar('a tabela de Frações', () => lerLado(pag), v => v.visivel && v.modo === 'tabela' && !!v.colunas, 10000)).valor;
  conf('a tela cobre o trilho, com Voltar escrito', lado.cobreOTrilho + '|' + lado.voltar, 'true|Voltar');
  conf('o título é o tema e o ano', lado.titulo, 'Números, 6º ano');
  conf('o resumo diz quantos livros e quantos ligam', lado.resumo, '3 livros do 6º ano, todos com capítulo ligado');
  conf('as colunas são os três livros do 6º ano', lado.colunas, 'livro-a,livro-b,livro-c');
  conf('as linhas são os 8 assuntos de Números do 6º ano', lado.linhas, 'MAT06-01,MAT06-02,MAT06-03,MAT06-04,MAT06-05,MAT06-06,MAT06-07,MAT06-08');
  conf('a linha de Frações vem marcada', lado.marcada, 'MAT06-05');
  conf('a cabeça de cada livro diz quantos assuntos ele trata, e o livro não revisado diz isso',
    lado.cabecas, 'livro-a=4 de 8 assuntos ; livro-b=2 de 8 assuntos ; livro-c=1 de 8 assuntos|mapa a confirmar');
  const celulas = Object.fromEntries(lado.celulas.split(' ; ').map(x => [x.slice(0, x.indexOf(':')), x.slice(x.indexOf(':') + 1)]));
  conf('Frações no livro-a: os dois capítulos, com as páginas do arquivo', celulas['MAT06-05'].split('|')[0],
    'livro-a=Cap. 2, Frações p. 3 a 4 Cap. 3, Comparar e operar frações p. 5 a 6');
  const ausencias = celulas['MAT06-05'].split('|').slice(1).join('|');
  if (VENENO) {
    secao('VENENO: as duas ausências trocadas');
    const visto = ausencias !== 'livro-b=não trata|livro-c=sem mapa';
    conf('envenenado-nao-trata-vira-sem-mapa: a tabela trocou "não trata" e "sem mapa" (defeito detectado)', visto, true);
    if (visto) console.log('VENENO visto: ' + ausencias);
    await H.fim(amb)();
    return;
  }
  conf('"não trata" no livro-b (mapa revisado) e "sem mapa" no livro-c (passe automático)', ausencias, 'livro-b=não trata|livro-c=sem mapa');
  conf('as duas frases têm cores diferentes (âmbar para "não trata")', await pag.evaluate(() => {
    const n = document.querySelector('.lado-celula[data-tipo="nao-trata"] .lado-nao');
    const s = document.querySelector('.lado-celula[data-tipo="sem-mapa"] .lado-sem');
    const ambar = getComputedStyle(document.documentElement).getPropertyValue('--aviso-texto').trim();
    const rgb = h => { const x = parseInt(h.slice(1), 16); return 'rgb(' + (x >> 16) + ', ' + ((x >> 8) & 255) + ', ' + (x & 255) + ')'; };
    return getComputedStyle(n).color === rgb(ambar) && getComputedStyle(s).color !== getComputedStyle(n).color;
  }), true);
  conf('decimais: livro-a e livro-c tratam, livro-b não', celulas['MAT06-07'], 'livro-a=Cap. 4, Decimais p. 7 a 8|livro-b=não trata|livro-c=Cap. 1, Decimais p. 1 a 2');
  conf('a falha salta na coluna de ícone da linha (alerta onde algum livro não trata)', lado.sinais,
    'MAT06-01=-,MAT06-02=alerta,MAT06-03=alerta,MAT06-04=alerta,MAT06-05=alerta,MAT06-06=-,MAT06-07=alerta,MAT06-08=alerta');
  conf('o pé abre cada livro no primeiro capítulo ligado', lado.rodape, 'livro-a=Abrir na p. 1,livro-b=Abrir na p. 1,livro-c=Abrir na p. 1');
  await clicar(pag, '#lado-a-lado [data-mostrar="so"]');
  lado = (await esperar('só Frações', () => lerLado(pag), v => v.visivel && v.linhas === 'MAT06-05', 5000)).valor;
  conf('"Só" o assunto escolhido deixa a linha dele', lado.linhas, 'MAT06-05');
  conf('e o pé abre na primeira página dele', lado.rodape, 'livro-a=Abrir na p. 3');
  const soFracoes = lado.celulas;
  await clicar(pag, '#lado-a-lado [data-mostrar="tudo"]');
  await esperar('o tema inteiro de novo', () => lerLado(pag), v => v.visivel && v.linhas.split(',').length === 8, 5000);

  // ================================================================
  secao('2. Tocar na célula abre o leitor na página do arquivo');
  await clicar(pag, '#lado-a-lado .lado-linha[data-assunto="MAT06-05"] .lado-celula[data-livro="livro-a"] .lado-pg[data-n="3"]');
  const r1 = await esperar('o leitor no capítulo 3', () => paginaDesenhada(pag), v => v !== 'fechado' && v !== '', 20000);
  conf('o capítulo 3 do livro-a abre na página 5 do arquivo', r1.valor, '5');
  conf('o leitor fica por cima da tela lado a lado', await pag.evaluate(() =>
    Number(document.querySelector('#modal-leitor-pdf').style.zIndex) > Number(document.querySelector('#lado-a-lado').style.zIndex)), true);
  await fecharModal(pag, 'modal-leitor-pdf');
  conf('fechar o leitor volta à tabela', (await lerLado(pag)).visivel, true);
  if (PRINTS) {
    fs.mkdirSync(PRINTS, { recursive: true });
    await pag.evaluate(() => { const a = document.querySelector('#aviso'); if (a) a.classList.remove('aberto'); });
    await pausa(300);
    await pag.screenshot({ path: path.join(PRINTS, 'tab_assunto_capitulos.png') });
  }
  await clicar(pag, '#lado-voltar');
  conf('o Voltar fecha a tabela', (await lerLado(pag)).visivel, false);
  if (PRINTS) {
    await pag.evaluate(() => { const c = document.querySelector('.conteudo'); const s = document.querySelector('#bib-comparar'); if (c && s) c.scrollTop += s.getBoundingClientRect().bottom - c.getBoundingClientRect().bottom + 24; });
    await pausa(300);
    await pag.screenshot({ path: path.join(PRINTS, 'tab_biblioteca.png') });
    await pag.evaluate(() => { document.querySelector('.conteudo').scrollTop = 0; });
  }

  // ================================================================
  secao('3. O "N livros" do painel do capítulo chega à mesma tabela');
  await clicar(pag, '#bib-livros [data-livro="livro-a"]');
  await esperar('a tela do livro-a', () => pag.evaluate(() => { const t = document.querySelector('#bib-livro'); return !!t && !t.hidden && t.dataset.livro === 'livro-a'; }), v => v, 5000);
  const painel = (await esperar('o "N livros" do assunto ligado', () => pag.evaluate(() =>
    Array.from(document.querySelectorAll('#bib-livro .bibl-assunto')).map(a => a.dataset.assunto + '=' + a.textContent.replace(/\s+/g, ' ').trim()).join(' ; ')),
  v => /livros|neste/.test(v || ''), 10000)).valor;
  // o leitor parou na página 5: o painel é o do capítulo 3, com Frações (só neste) e Operações com frações (2 livros)
  conf('o painel do capítulo mostra cada assunto ligado com quantos livros o tratam', painel,
    'MAT06-05=Frações: o que são e como compararsó neste ; MAT06-06=Operações com frações2 livros');
  await clicar(pag, '#bib-livro [data-comparar="MAT06-06"]');
  lado = (await esperar('a tabela pelo painel', () => lerLado(pag), v => v.visivel && v.escolhido === 'MAT06-06', 10000)).valor;
  const peloPainel = lado.titulo + '|' + lado.marcada + '|' + lado.colunas + '|' + lado.celulas;
  await clicar(pag, '#lado-voltar');
  conf('o Voltar volta à tela do livro', await pag.evaluate(() => !document.querySelector('#bib-livro').hidden && document.querySelector('#lado-a-lado').hidden), true);
  await clicar(pag, '#bib-livro-voltar');
  await abrirBibliotecaNoAno(pag, 'matematica', '06');
  await clicar(pag, '#bib-comparar [data-comparar="MAT06-06"]');
  lado = (await esperar('a tabela pela aba', () => lerLado(pag), v => v.visivel && v.escolhido === 'MAT06-06', 10000)).valor;
  conf('o painel do capítulo e a aba chegam à mesma tabela', lado.titulo + '|' + lado.marcada + '|' + lado.colunas + '|' + lado.celulas, peloPainel);
  await clicar(pag, '#lado-voltar');

  // ================================================================
  secao('4. A busca de assunto atravessa os anos');
  await clicar(pag, '#bib-comparar-todos');
  await esperar('a busca de assunto', () => lerLado(pag), v => v.visivel && v.modo === 'escolha', 5000);
  const lerEscolha = () => pag.evaluate(() => ({
    conta: (document.querySelector('#lado-escolha-conta') || {}).textContent || '',
    itens: Array.from(document.querySelectorAll('#lado-escolha-lista .lado-escolha-item')).map(b => b.dataset.comparar + '|' +
      b.querySelector('.lado-ano').textContent + '|' + b.querySelector('.lado-n').textContent)
  }));
  let esc = await lerEscolha();
  conf('sem termo, os 14 assuntos de Matemática do 6º ano', esc.conta + ' ' + esc.itens.length, '14 assuntos de Matemática do 6º ano. Escreva para buscar em todos os anos. 14');
  await pag.focus('#lado-busca');
  await pag.keyboard.type('fraç');
  esc = (await esperar('o resultado de "fraç"', lerEscolha, v => /todos os anos/.test(v.conta) && v.itens.length > 2, 5000)).valor;
  console.log('   ' + esc.itens.join(' ; '));
  conf('"fraç" acha assuntos de vários anos, cada um com o ano e quantos livros o tratam', esc.itens.filter(x => /^MAT0[456]-/.test(x)).join(' ; '),
    'MAT04-05|4º ano|nenhum livro ; MAT05-03|5º ano|nenhum livro ; MAT05-04|5º ano|nenhum livro ; MAT06-05|6º ano|1 livro ; MAT06-06|6º ano|2 livros');
  conf('os anos da lista são vários', new Set(esc.itens.map(x => x.split('|')[1])).size >= 3, true);
  await clicar(pag, '#lado-escolha-lista [data-comparar="MAT05-03"]');
  lado = (await esperar('a tabela do 5º ano', () => lerLado(pag), v => v.visivel && v.modo === 'tabela' && v.escolhido === 'MAT05-03', 5000)).valor;
  conf('sem livros do ano, a tela diz isso', lado.semLivros, 'Nenhum livro de Matemática do 5º ano neste tablet. Importe o pacote de livros em Ajustes.');
  conf('e a cabeça também', lado.resumo, 'nenhum livro no tablet');
  conf('os anos do tema: os com livro e o de agora', lado.anos, '05*,06');
  await clicar(pag, '#lado-a-lado .lado-anos [data-ano="06"]');
  lado = (await esperar('o tema no 6º ano', () => lerLado(pag), v => v.visivel && v.titulo === 'Números, 6º ano', 5000)).valor;
  conf('o chip do ano leva ao mesmo tema no outro ano', lado.colunas, 'livro-a,livro-b,livro-c');
  await clicar(pag, '#lado-voltar');
  esc = (await esperar('a busca de volta', lerEscolha, v => /todos os anos/.test(v.conta), 5000)).valor;
  conf('o Voltar da tabela volta à busca com o termo', await pag.evaluate(() => document.querySelector('#lado-busca').value), 'fraç');
  await clicar(pag, '#lado-voltar');
  conf('e o Voltar da busca fecha', (await lerLado(pag)).visivel, false);

  // ================================================================
  secao('5. A correção dela no mapa aparece na tabela');
  await pag.evaluate(async () => {
    const d = await Store.carregar();
    d.ajustes = d.ajustes || {};
    d.ajustes.mapaDosLivros = { 'livro-c': {
      1: { titulo: 'Capítulo 1: Decimais', assuntos: ['MAT06-07'], acao: 'confirmou', quando: '2026-11-11T09:00:00.000Z' },
      2: { titulo: 'Capítulo 2: Partes do inteiro', assuntos: ['MAT06-05'], acao: 'corrigiu', quando: '2026-11-11T09:01:00.000Z' } } };
    await Store.salvar(d);
  });
  await H.abrirApp(pag, amb.ORIGEM);
  await abrirBibliotecaNoAno(pag, 'matematica', '06');
  await clicar(pag, '#bib-comparar [data-comparar="MAT06-05"]');
  lado = (await esperar('a tabela com a correção', () => lerLado(pag), v => v.visivel && /livro-c=Cap\. 2/.test(v.celulas), 10000)).valor;
  const c2 = Object.fromEntries(lado.celulas.split(' ; ').map(x => [x.slice(0, x.indexOf(':')), x.slice(x.indexOf(':') + 1)]));
  conf('Frações: o capítulo que ela ligou no livro-c', c2['MAT06-05'].split('|')[2], 'livro-c=Cap. 2, Partes do inteiro p. 3 a 4');
  conf('o livro-c, todo confirmado, vira revisado: "não trata" onde era "sem mapa"', c2['MAT06-06'], 'livro-a=Cap. 3, Comparar e operar frações p. 5 a 6|livro-b=Cap. 2, Operações com frações p. 3 a 4|livro-c=não trata');
  conf('e a cabeça dele perde o "mapa a confirmar"', lado.cabecas.split(' ; ')[2], 'livro-c=2 de 8 assuntos');
  await clicar(pag, '#lado-voltar');

  // ================================================================
  secao('6. A aula: "Abrir no livro" e "Ver em todos os livros"');
  conf('a aula de hoje abriu', await abrirAulaDeHoje(pag, '10:00'), true);
  await esperar('o "Abrir no livro" de Frações', () => clicar(pag, '#corpo-modal-aula [data-abrir-no-livro="MAT06-05"]'), v => v === true, 10000);
  await esperar('a lista dos livros', () => pag.evaluate(() => !!document.querySelector('#modal-livros.aberto #livros-ver-todos')), v => v, 5000);
  await clicar(pag, '#livros-ver-todos');
  lado = (await esperar('a tabela pela aula', () => lerLado(pag), v => v.visivel && v.escolhido === 'MAT06-05', 10000)).valor;
  conf('a aula leva à tabela de Frações, com a linha marcada', lado.titulo + '|' + lado.marcada, 'Números, 6º ano|MAT06-05');
  conf('a tabela fica por cima da aula', await pag.evaluate(() => {
    const e = document.elementFromPoint(640, 400); return !!e && !!e.closest('#lado-a-lado');
  }), true);
  conf('a linha do assunto da aula traz o "Abrir no livro"', lado.abrirNoLivro, true);
  await clicar(pag, '#lado-abrir-no-livro');
  await esperar('a lista "Abrir no livro" de volta', () => pag.evaluate(() => !!document.querySelector('#modal-livros.aberto') && document.querySelector('#lado-a-lado').hidden), v => v, 5000);
  conf('o "Abrir no livro" da linha volta à lista dos livros do assunto, com a aula aberta embaixo', await pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto') && /Os livros do ano/.test(document.querySelector('#corpo-modal-livros').textContent)), true);
  await fecharModal(pag, 'modal-livros');
  await fecharModal(pag, 'modal-aula');

  // ================================================================
  secao('7. Sem transbordo: 1280x800 e 800 px, a 100% e a 130%');
  for (const [w, h] of [[1280, 800], [800, 1280]]) {
    await pag.setViewport({ width: w, height: h, hasTouch: true });
    for (const [rot, css] of [['100%', ''], ['130%', LETRA_130]]) {
      await abrirBibliotecaNoAno(pag, 'matematica', '06');
      await letra(pag, css);
      await clicar(pag, '#bib-comparar [data-comparar="MAT06-05"]');
      await esperar('a tabela', () => lerLado(pag), v => v.visivel && !!v.colunas, 5000);
      await pausa(200);
      conf(w + ' px a ' + rot + ': a tabela não transborda', (await medir(pag)).join('; '), '');
      await clicar(pag, '#lado-voltar');
      await clicar(pag, '#bib-comparar-todos');
      await esperar('a busca', () => lerLado(pag), v => v.visivel && v.modo === 'escolha', 5000);
      await pausa(200);
      conf(w + ' px a ' + rot + ': a busca de assunto não transborda', (await medir(pag)).join('; '), '');
      await clicar(pag, '#lado-voltar');
      const naAba = await pag.evaluate(() => {
        const s = document.querySelector('#bib-comparar'); const r = s.getBoundingClientRect();
        const ruins = [];
        s.querySelectorAll('button').forEach(b => { const q = b.getBoundingClientRect(); if (q.height < 47.5 || q.right > r.right + 0.5) ruins.push(b.dataset.comparar || b.id); });
        if (document.documentElement.scrollWidth > innerWidth) ruins.push('a página rola de lado');
        return ruins.join(',');
      });
      conf(w + ' px a ' + rot + ': o "Comparar" da aba não transborda', naAba, '');
      await letra(pag, '');
    }
  }
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });

  // ================================================================
  secao('8. Nada gravado; 15 livros e 16 assuntos abrem sem travar');
  const depois = await pag.evaluate(() => Store.carregar().then(d => JSON.stringify(d)));
  conf('o banco dela só mudou pela correção que a prova pôs (nada gravado pela tela)', JSON.parse(depois).ajustes.mapaDosLivros['livro-c'][2].acao + '|' +
    (JSON.stringify(Object.assign({}, JSON.parse(depois), { ajustes: null })) === JSON.stringify(Object.assign({}, JSON.parse(antes), { ajustes: null }))), 'corrigiu|true');
  const posicoes = await pag.evaluate(() => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => { const b = q.result; const c = b.transaction('livros_posicoes', 'readonly').objectStore('livros_posicoes').getAllKeys();
      c.onsuccess = () => { b.close(); r(c.result.join(',')); }; };
  }));
  conf('só a posição do livro que o leitor abriu (o que o leitor já guardava)', posicoes, 'livro-a');
  // 15 livros de Português do 3º médio, 20 capítulos cada, ligados aos 16 assuntos de "Literatura: Modernismo"
  const ids = Array.from({ length: 16 }, (_, i) => 'POREM3-T' + String(i + 1).padStart(2, '0'));
  const muitos = Array.from({ length: 15 }, (_, k) => livro('livro-p' + String(k + 1).padStart(2, '0'), 'Português ' + String(k + 1).padStart(2, '0'), 'portugues', ['em3'],
    Array.from({ length: 20 }, (_, i) => ['Capítulo ' + (i + 1) + ': Parte ' + (i + 1), i + 1, i + 1, (i + k) % 3 === 0 ? [] : [ids[(i + k) % 16]]]),
    k % 4 === 0 ? 'auto' : 'mapa', 20));
  conf('os 15 livros entraram', await gravarLivros(pag, muitos, 'prova-b6-muitos'), 15);
  await H.abrirApp(pag, amb.ORIGEM);
  await abrirBibliotecaNoAno(pag, 'portugues', 'em3');
  const t0 = await pag.evaluate(() => { window.__t0 = performance.now(); document.querySelector('#bib-comparar [data-comparar]').click(); return true; });
  const grande = (await esperar('a tabela de 15 livros', () => pag.evaluate(() => {
    const t = document.querySelector('#lado-a-lado');
    if (!t || t.hidden || !t.querySelector('.lado-grade')) return null;
    return { ms: Math.round(performance.now() - window.__t0), colunas: t.querySelectorAll('.lado-livro').length, linhas: t.querySelectorAll('.lado-linha[data-assunto]').length,
      celulas: t.querySelectorAll('.lado-celula[data-tipo]').length };
  }), v => !!v, 10000)).valor;
  console.log('   15 livros x 16 assuntos: ' + JSON.stringify(grande));
  conf('15 colunas e 16 linhas (240 células)', t0 && grande && grande.colunas + 'x' + grande.linhas + '=' + grande.celulas, '15x16=240');
  conf('abre em menos de 1,5 s do toque ao desenho', grande && grande.ms < 1500, true);
  conf('com 15 livros, a página não rola de lado (só a tabela)', await pag.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

  conf('nenhum erro de página', errosDePagina.join(' | '), '');
  if (PRINTS) console.log('   prints em ' + PRINTS);
  await H.fim(amb)();
})().catch(H.fim(amb));
