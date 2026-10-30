/* testa_anexo_como_folha.js
 *
 * C3: o anexo da aula (foto ou PDF) vira folha para escrever em cima, na
 * MESMA aula, sem perguntar qual. Dados fictícios ("Aluno Alfa Teste"), e os
 * três anexos montados aqui mesmo: uma foto PNG desenhada num canvas, um PDF
 * de duas páginas escrito byte a byte e um .docx falso.
 *
 * O que se prova:
 *   1. a foto e o PDF ganham "Abrir como folha para escrever em cima", e o
 *      .docx não;
 *   2. a foto vira folha da mesma aula direto, sem o leitor e sem a escolha
 *      de aula, com a foto de fundo; um traço por cima fica salvo depois de
 *      recarregar;
 *   3. o PDF abre o leitor do C14 na página 1, com a frase que aponta o
 *      "Abrir esta página como folha"; a página 2 vira folha da mesma aula
 *      (página nova, a da foto continua), com um traço salvo;
 *   4. o "Abrir" de sempre do PDF continua sem a frase;
 *   5. os três anexos continuam lá, byte a byte iguais, e nenhuma aula nova.
 *
 * SALVAR_PRINTS=<pasta> guarda a lista de anexos, o leitor e a folha da foto.
 */
'use strict';
const path = require('path');
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8858, 'nath_c3_anexo_como_folha');
const { conf, secao, esperar, pausa } = H;
const SALVAR = process.env.SALVAR_PRINTS || '';

const ALUNO = 'aluno_c3_teste';
const AULA = 'aula_c3_1';
const FOTO = { id: 'anexo_c3_foto', nome: 'lista_escola_alfa_foto.png' };
const PDF = { id: 'anexo_c3_pdf', nome: 'lista_escola_alfa.pdf' };
const DOCX = { id: 'anexo_c3_docx', nome: 'redacao_alfa_teste.docx' };
const hojeIso = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();

/* O PDF de duas páginas: um retângulo grande de uma cor por página (vermelho,
 * azul). A cor é o que se procura no canvas da folha: fundo branco não prova
 * que a página certa foi desenhada. */
const CORES = [[0.85, 0.10, 0.10], [0.10, 0.20, 0.85]];
function pdfDeTeste() {
  const objs = [];
  const n = CORES.length;
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  const kids = [];
  for (let i = 0; i < n; i++) kids.push((4 + 2 * i) + ' 0 R');
  objs[2] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>';
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  for (let i = 0; i < n; i++) {
    const c = CORES[i];
    const conteudo = c.join(' ') + ' rg 72 300 468 400 re f\n' +
      'BT /F1 28 Tf 0 0 0 rg 72 740 Td (Aluno Alfa Teste, lista pagina ' + (i + 1) + ') Tj ET\n';
    objs[4 + 2 * i] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ' +
      '/Resources << /Font << /F1 3 0 R >> >> /Contents ' + (5 + 2 * i) + ' 0 R >>';
    objs[5 + 2 * i] = '<< /Length ' + Buffer.byteLength(conteudo, 'latin1') + ' >>\nstream\n' + conteudo + 'endstream';
  }
  let corpo = '%PDF-1.4\n';
  const offs = [];
  for (let k = 1; k < objs.length; k++) {
    offs[k] = Buffer.byteLength(corpo, 'latin1');
    corpo += k + ' 0 obj\n' + objs[k] + '\nendobj\n';
  }
  const xref = Buffer.byteLength(corpo, 'latin1');
  corpo += 'xref\n0 ' + objs.length + '\n0000000000 65535 f \n';
  for (let k = 1; k < objs.length; k++) corpo += String(offs[k]).padStart(10, '0') + ' 00000 n \n';
  corpo += 'trailer\n<< /Size ' + objs.length + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
  return Buffer.from(corpo, 'latin1');
}
const RGB = CORES.map(c => c.map(v => Math.round(v * 255)));
// a cor da foto: laranja, que não está em nenhuma página do PDF
const LARANJA = [240, 140, 20];

const pixelsDaCor = (pag, seletor, rgb) => pag.evaluate((s, cor) => {
  const c = document.querySelector(s);
  if (!c) return -1;
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 4 * 7) {
    if (Math.abs(d[i] - cor[0]) < 40 && Math.abs(d[i + 1] - cor[1]) < 40 && Math.abs(d[i + 2] - cor[2]) < 40) n++;
  }
  return n;
}, seletor, rgb);
const CANVAS_LEITOR = '#corpo-modal-leitor-pdf canvas';
const CANVAS_FOLHA = '#tela-desenho';

async function abrirAulaDeHoje(pag) {
  await H.irParaAba(pag, 'agenda');
  for (let i = 0; i < 24; i++) {
    if (await pag.evaluate(h => !!document.querySelector('[data-dia="' + h + '"]'), hojeIso)) break;
    await pag.click(i < 12 ? '#mes-seguinte' : '#mes-anterior');
    await pausa(120);
  }
  const ok = await pag.evaluate(h => {
    const alvo = Array.from(document.querySelectorAll('[data-dia="' + h + '"] .pilula')).find(p => p.textContent.indexOf('10:00') === 0);
    if (!alvo) return false; alvo.click(); return true;
  }, hojeIso);
  await esperar('aula de hoje aberta', () => pag.evaluate(() => document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);
  return ok;
}

// os botões de uma linha da lista de anexos, pelo nome do arquivo
const botoesDoAnexo = (pag, nome) => pag.evaluate(n => {
  const linha = Array.from(document.querySelectorAll('#lista-anexos .item-lista')).find(l => l.textContent.indexOf(n) >= 0);
  return linha ? Array.from(linha.querySelectorAll('button')).map(b => b.textContent.trim()) : null;
}, nome);
const ACAO = 'Abrir como folha para escrever em cima';
function tocarNoAnexo(pag, nome, texto) {
  return pag.evaluate((n, t) => {
    const linha = Array.from(document.querySelectorAll('#lista-anexos .item-lista')).find(l => l.textContent.indexOf(n) >= 0);
    const b = linha && Array.from(linha.querySelectorAll('button')).find(x => x.textContent.trim() === t);
    if (!b) return false;
    b.click();
    return true;
  }, nome, texto);
}

const estadoLeitor = pag => pag.evaluate(() => {
  const corpo = document.querySelector('#corpo-modal-leitor-pdf');
  const dica = document.querySelector('#leitor-dica');
  const f = document.querySelector('#leitor-pdf-falha');
  return {
    aberto: document.querySelector('#modal-leitor-pdf').classList.contains('aberto'),
    desenhada: corpo.dataset.paginaDesenhada || '',
    contador: document.querySelector('#leitor-contador').textContent,
    dica: dica && !dica.hidden && dica.getBoundingClientRect().height > 0 ? dica.textContent : '',
    falha: f ? f.dataset.motivo : ''
  };
});
const editorAberto = pag => pag.evaluate(() => document.querySelector('#modal-nota').classList.contains('aberto'));

async function tracarEConcluir(pag, antesDeConcluir) {
  await pag.evaluate(() => {
    const c = document.querySelector('#tela-desenho');
    const r = c.getBoundingClientRect();
    // dentro da página, que fica no meio do canvas
    const pts = [[r.width * 0.4, r.height * 0.4], [r.width * 0.45, r.height * 0.46], [r.width * 0.52, r.height * 0.42], [r.width * 0.6, r.height * 0.5]];
    const ev = (tipo, x, y) => c.dispatchEvent(new PointerEvent(tipo, { pointerId: 7, pointerType: 'pen', pressure: 0.5, isPrimary: true,
      bubbles: true, clientX: r.left + x, clientY: r.top + y }));
    ev('pointerdown', pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ev('pointermove', pts[i][0], pts[i][1]);
    ev('pointerup', pts[pts.length - 1][0], pts[pts.length - 1][1]);
  });
  await pausa(900);
  if (antesDeConcluir) await antesDeConcluir();
  await pag.evaluate(() => Array.from(document.querySelectorAll('#rodape-nota button')).find(b => b.textContent.trim() === 'Concluir').click());
  return esperar('editor fechado', () => editorAberto(pag), v => v === false, 8000);
}

// a folha da aula, página a página: os tipos dos itens, o JPEG e a largura da imagem
const lerFolha = pag => pag.evaluate(async (id) => {
  const d = await Store.carregar();
  const aula = d.aulas.find(a => a.id === id);
  const nota = await Store.lerNota(id);
  const paginas = [];
  for (const p of (nota ? nota.paginas : [])) {
    const img = (p.itens || []).find(x => x.t === 'imagem');
    const midia = img ? await Store.lerMidia(img.ref) : null;
    paginas.push({ tipos: (p.itens || []).map(x => x.t).join(','), jpeg: midia ? String(midia.dataUrl).slice(0, 23) : '',
      largura: img ? Math.round(img.w) : 0, ref: img ? img.ref : '' });
  }
  return { temNota: !!(aula && aula.temNota), paginas };
}, AULA);

/* A impressão digital dos anexos: o registro na aula e, de cada arquivo no
 * depósito, o nome, o tipo, o tamanho e o SHA-256 dos bytes. */
const digitalDosAnexos = pag => pag.evaluate(async (dados) => {
  const d = await Store.carregar();
  const aula = d.aulas.find(a => a.id === dados.AULA);
  const arquivos = [];
  for (const an of (aula ? aula.anexos : [])) {
    const r = await Store.lerAnexo(an.id);
    if (!r || !r.blob) { arquivos.push(an.id + ':sumiu'); continue; }
    const h = await crypto.subtle.digest('SHA-256', await r.blob.arrayBuffer());
    arquivos.push([an.id, r.nome, r.tipo, r.blob.size, Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('')].join(':'));
  }
  return { registro: JSON.stringify(aula ? aula.anexos : null), arquivos: arquivos.join('\n'), aulas: d.aulas.length };
}, { AULA });

// quem abrir a escolha de aula fica anotado: o C3 nunca deve perguntar
const vigiarEscolhaDeAula = pag => pag.evaluate(() => {
  window.__perguntou = 0;
  const m = document.querySelector('#modal-bib-folha');
  new MutationObserver(() => { if (m.classList.contains('aberto')) window.__perguntou++; })
    .observe(m, { attributes: true, attributeFilter: ['class'] });
});
const perguntou = pag => pag.evaluate(() => window.__perguntou);

(async () => {
  await amb.subir();
  const pag = await amb.pagina();
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  await H.abrirApp(pag, amb.ORIGEM);

  const pdf = pdfDeTeste();
  await pag.evaluate(async (dados) => {
    const d = await Store.carregar();
    d.alunos = (d.alunos || []).filter(a => a.id !== dados.ALUNO);
    d.alunos.push({ id: dados.ALUNO, nome: 'Aluno Alfa Teste', ano: '9', anoEscolar: '9º ano do Ensino Fundamental',
      responsavel: 'Responsavel Alfa', grade: 'quarta-feira, 10:00',
      vigencias: [{ id: 'v_c3', inicio: '2026-01-01', fim: '2027-12-31', valorHora: 100 }] });
    // a foto: uma folha laranja com uma linha de texto, desenhada aqui e guardada como PNG
    const c = document.createElement('canvas');
    c.width = 600; c.height = 800;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, 600, 800);
    ctx.fillStyle = 'rgb(' + dados.LARANJA.join(',') + ')'; ctx.fillRect(40, 140, 520, 600);
    ctx.fillStyle = '#000000'; ctx.font = 'bold 30px sans-serif';
    ctx.fillText('Aluno Alfa Teste, foto da lista', 40, 90);
    const png = await new Promise(r => c.toBlob(r, 'image/png'));
    await Store.salvarAnexo(dados.FOTO.id, { nome: dados.FOTO.nome, tipo: 'image/png', blob: png });
    const bytes = Uint8Array.from(atob(dados.b64), ch => ch.charCodeAt(0));
    await Store.salvarAnexo(dados.PDF.id, { nome: dados.PDF.nome, tipo: 'application/pdf',
      blob: new Blob([bytes], { type: 'application/pdf' }) });
    // o .docx é falso: só o começo de um zip, que nenhum desenho abriria
    const tipoDocx = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const docx = new Blob([new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0, 0, 0]), 'redacao de teste'], { type: tipoDocx });
    await Store.salvarAnexo(dados.DOCX.id, { nome: dados.DOCX.nome, tipo: tipoDocx, blob: docx });
    d.aulas = (d.aulas || []).filter(a => a.alunoId !== dados.ALUNO);
    d.aulas.push({ id: dados.AULA, alunoId: dados.ALUNO, serieId: null, data: dados.hoje, hora: '10:00', duracaoMin: 60,
      status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', temNota: false,
      anexos: [{ id: dados.FOTO.id, nome: dados.FOTO.nome, tamanho: png.size },
        { id: dados.PDF.id, nome: dados.PDF.nome, tamanho: bytes.length },
        { id: dados.DOCX.id, nome: dados.DOCX.nome, tamanho: docx.size }] });
    await Store.salvar(d);
  }, { ALUNO, AULA, FOTO, PDF, DOCX, LARANJA, hoje: hojeIso, b64: pdf.toString('base64') });
  await H.abrirApp(pag, amb.ORIGEM);
  const digitalAntes = await digitalDosAnexos(pag);
  conf('os três anexos estão guardados', digitalAntes.arquivos.split('\n').filter(l => l.indexOf(':sumiu') < 0).length, 3);

  // ================================================================
  secao('1. Quem ganha a ação');
  conf('a aula abriu', await abrirAulaDeHoje(pag), true);
  conf('a foto tem a ação', (await botoesDoAnexo(pag, FOTO.nome)).join(' | '), ACAO + ' | Abrir | Remover');
  conf('o PDF tem a ação', (await botoesDoAnexo(pag, PDF.nome)).join(' | '), ACAO + ' | Abrir | Remover');
  conf('o .docx NÃO tem a ação', (await botoesDoAnexo(pag, DOCX.nome)).join(' | '), 'Abrir | Remover');
  conf('a ação tem 44 px de altura', await pag.evaluate(() =>
    Array.from(document.querySelectorAll('#lista-anexos .anexo-como-folha')).map(b => b.getBoundingClientRect().height >= 44).join(',')), 'true,true');
  if (SALVAR) {
    const g = await pag.$('#grupo-arquivos');
    await g.evaluate(e => e.scrollIntoView({ block: 'center' }));
    await pausa(300);
    await g.screenshot({ path: path.join(SALVAR, 'c3_2_depois_lista_de_anexos.png') });
  }

  // ================================================================
  secao('2. A foto vira folha da mesma aula, direto');
  await vigiarEscolhaDeAula(pag);
  conf('tocou na ação da foto', await tocarNoAnexo(pag, FOTO.nome, ACAO), true);
  const ed1 = await esperar('a folha da foto abriu', () => editorAberto(pag), v => v === true, 15000);
  conf('o editor da folha abriu', ed1.ok, true);
  conf('sem passar pelo leitor', (await estadoLeitor(pag)).aberto, false);
  conf('e sem perguntar a aula', await perguntou(pag), 0);
  await pausa(600);
  conf('a foto (laranja) está desenhada na folha', (await pixelsDaCor(pag, CANVAS_FOLHA, LARANJA)) > 200, true);
  conf('controle: o vermelho do PDF não está', await pixelsDaCor(pag, CANVAS_FOLHA, RGB[0]), 0);
  conf('a folha é da aula do Aluno Alfa Teste', /Aluno Alfa Teste/.test(await pag.$eval('#titulo-modal-nota', e => e.textContent)), true);
  await tracarEConcluir(pag, async () => {
    if (!SALVAR) return;
    // o aviso "Colado na folha" cobre a foto no print; ele sai sozinho em 3,6 s
    await esperar('o aviso saiu', () => pag.$eval('#aviso', e => e.classList.contains('aberto')), v => v === false, 6000);
    await pausa(400);
    await pag.screenshot({ path: path.join(SALVAR, 'c3_4_folha_da_foto_com_traco.png') });
  });
  let folha = await lerFolha(pag);
  conf('a aula tem folha', folha.temNota, true);
  conf('uma página: a foto e o traço por cima', folha.paginas.map(p => p.tipos).join(' / '), 'imagem,traco');
  conf('a foto está guardada como JPEG', folha.paginas[0] && folha.paginas[0].jpeg, 'data:image/jpeg;base64,');
  conf('a foto ocupa a largura da folha', folha.paginas[0] && folha.paginas[0].largura > 700, true);
  const refFoto = folha.paginas[0] && folha.paginas[0].ref;
  conf('a imagem da folha é uma cópia, e não o anexo', refFoto && refFoto !== FOTO.id, true);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  folha = await lerFolha(pag);
  conf('depois de recarregar, a foto e o traço continuam', folha.paginas.map(p => p.tipos).join(' / '), 'imagem,traco');

  // ================================================================
  secao('3. O PDF abre o leitor, e a página 2 vira folha da mesma aula');
  conf('a aula abriu', await abrirAulaDeHoje(pag), true);
  await vigiarEscolhaDeAula(pag);
  conf('tocou na ação do PDF', await tocarNoAnexo(pag, PDF.nome, ACAO), true);
  const p1 = await esperar('a página 1 desenhada', () => estadoLeitor(pag), v => v && (v.desenhada === '1' || v.falha !== ''), 30000);
  conf('o leitor abriu na página 1', p1.valor && (p1.valor.desenhada + '|' + p1.valor.falha), '1|');
  conf('o contador diz "Página 1 de 2"', p1.valor && p1.valor.contador, 'Página 1 de 2');
  conf('a frase aponta o "Abrir esta página como folha"', /"Abrir esta página como folha"/.test(p1.valor && p1.valor.dica), true);
  conf('o botão está ligado e é o principal', await pag.$eval('#leitor-como-folha', b =>
    !b.disabled && b.classList.contains('principal') && b.getBoundingClientRect().height >= 44), true);
  conf('a cor da página 1 (vermelho) no leitor', (await pixelsDaCor(pag, CANVAS_LEITOR, RGB[0])) > 200, true);
  if (SALVAR) await pag.screenshot({ path: path.join(SALVAR, 'c3_3_leitor_com_o_pdf.png') });
  await pag.click('#leitor-proxima');
  const p2 = await esperar('a página 2 desenhada', () => estadoLeitor(pag), v => v && v.desenhada === '2', 15000);
  conf('Próxima leva à página 2', p2.valor && p2.valor.contador, 'Página 2 de 2');
  await pag.click('#leitor-como-folha');
  const ed2 = await esperar('a folha da página 2 abriu', () => editorAberto(pag), v => v === true, 15000);
  conf('o editor da folha abriu', ed2.ok, true);
  conf('o leitor fechou', (await estadoLeitor(pag)).aberto, false);
  conf('sem perguntar a aula', await perguntou(pag), 0);
  await pausa(600);
  conf('a página 2 (azul) está na folha', (await pixelsDaCor(pag, CANVAS_FOLHA, RGB[1])) > 200, true);
  conf('e a página 1 (vermelho) não', await pixelsDaCor(pag, CANVAS_FOLHA, RGB[0]), 0);
  await tracarEConcluir(pag);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  folha = await lerFolha(pag);
  conf('depois de recarregar: a página da foto e a do PDF, cada uma com o traço',
    folha.paginas.map(p => p.tipos).join(' / '), 'imagem,traco / imagem,traco');
  conf('a página do PDF está guardada como JPEG', folha.paginas[1] && folha.paginas[1].jpeg, 'data:image/jpeg;base64,');
  conf('a página da foto é a mesma de antes', folha.paginas[0] && folha.paginas[0].ref, refFoto);

  // ================================================================
  secao('4. O "Abrir" de sempre do PDF continua sem a frase');
  conf('a aula abriu', await abrirAulaDeHoje(pag), true);
  conf('tocou em Abrir no PDF', await tocarNoAnexo(pag, PDF.nome, 'Abrir'), true);
  const pa = await esperar('a página 1 desenhada', () => estadoLeitor(pag), v => v && v.desenhada === '1', 30000);
  conf('o leitor abriu na página 1, sem a frase', pa.valor && (pa.valor.desenhada + '|' + pa.valor.dica), '1|');
  await pag.evaluate(() => document.querySelector('#modal-leitor-pdf [data-fechar]').click());

  // ================================================================
  secao('5. Os anexos continuam lá, iguais');
  const digitalDepois = await digitalDosAnexos(pag);
  conf('o registro dos anexos na aula não mudou', digitalDepois.registro, digitalAntes.registro);
  conf('os arquivos não mudaram (nome, tipo, tamanho e SHA-256)', digitalDepois.arquivos, digitalAntes.arquivos);
  conf('nenhuma aula nova', digitalDepois.aulas, digitalAntes.aulas);
  conf('os três ainda aparecem na lista', await pag.evaluate(() =>
    document.querySelectorAll('#lista-anexos .item-lista').length), 3);

  // ================================================================
  secao('6. Nenhum erro');
  conf('nenhum erro de página', pag.errosDePagina.join(' | '), '');
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
