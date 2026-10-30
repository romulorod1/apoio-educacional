/* testa_leitor_pdf.js
 *
 * C14: o PDF anexado à aula abre no leitor do próprio aplicativo (o PDF.js da
 * Mozilla, em vendor/), e não fora dele. Dados fictícios ("Aluno Alfa Teste")
 * e um PDF de três páginas montado aqui mesmo, sem arquivo de terceiro.
 *
 * O que se prova:
 *   1. o leitor NÃO vem com o aplicativo: nem no index.html, nem na lista do
 *      pré-cache do sw.js, nem pedido na abertura;
 *   2. sem sinal na primeira vez, a janela diz isso numa frase e oferece abrir
 *      fora do aplicativo, e esse botão leva ao caminho de antes;
 *   3. com sinal, "Abrir" abre o PDF sem sair do aplicativo: nenhuma aba nova,
 *      nenhuma navegação, nenhum compartilhar ou download; a página 1 aparece;
 *   4. Próxima leva à página 2, e o contador diz "Página 2 de 3";
 *   5. o zoom muda o tamanho do canvas, e "Ajustar à largura" volta ao de antes;
 *   6. "Abrir esta página como folha" cria a folha com a página como imagem, um
 *      traço de caneta por cima fica salvo depois de recarregar;
 *   7. com a rede cortada de verdade (a página E o servidor), a SEGUNDA
 *      abertura funciona, servida pelo BAIXADOS do sw.js;
 *   8. o anexo que não é PDF continua saindo como antes.
 * E a rede fraca (o servidor segura a resposta sem responder): sem o leitor
 * guardado, o prazo de 15 s leva ao "Abrir fora" e o Abrir seguinte tenta de
 * novo (2b); com o leitor guardado, abre do cache sem esperar a rede (6b). E
 * os três decodificadores .wasm entram no BAIXADOS já na primeira abertura.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8857, 'nath_c14_leitor_pdf');
const { conf, secao, esperar, pausa } = H;

const ALUNO = 'aluno_c14_teste';
const AULA = 'aula_c14_1';
const ANEXO_PDF = 'anexo_c14_pdf';
const ANEXO_TXT = 'anexo_c14_txt';
const hojeIso = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();

/* Um PDF de verdade, montado byte a byte: cada página tem um retângulo grande
 * de uma cor só (vermelho, azul, verde) e uma linha de texto. A cor é o que o
 * teste procura no canvas: fundo branco não prova que a página foi desenhada. */
const CORES = [[0.85, 0.10, 0.10], [0.10, 0.20, 0.85], [0.10, 0.60, 0.20]];
function pdfDeTeste() {
  const objs = [];
  const n = CORES.length;
  // 1 catálogo, 2 páginas, 3 fonte, depois (página, conteúdo) por página
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  const kids = [];
  for (let i = 0; i < n; i++) kids.push((4 + 2 * i) + ' 0 R');
  objs[2] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>';
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  for (let i = 0; i < n; i++) {
    const c = CORES[i];
    const conteudo = c.join(' ') + ' rg 72 300 468 400 re f\n' +
      'BT /F1 28 Tf 0 0 0 rg 72 740 Td (Aluno Alfa Teste, pagina ' + (i + 1) + ') Tj ET\n';
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

/* Pixels perto de uma cor, num canvas da página, amostrando um a cada sete. */
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
const RGB = CORES.map(c => c.map(v => Math.round(v * 255)));
const CANVAS = '#corpo-modal-leitor-pdf canvas';

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

// o "Abrir" da linha do anexo, pelo nome do arquivo
function tocarAbrir(pag, nome) {
  return pag.evaluate(n => {
    const linha = Array.from(document.querySelectorAll('#lista-anexos .item-lista')).find(l => l.textContent.indexOf(n) >= 0);
    const b = linha && Array.from(linha.querySelectorAll('button')).find(x => x.textContent.trim() === 'Abrir');
    if (!b) return false;
    b.click();
    return true;
  }, nome);
}

const estadoLeitor = pag => pag.evaluate(() => {
  const m = document.querySelector('#modal-leitor-pdf');
  const corpo = document.querySelector('#corpo-modal-leitor-pdf');
  const c = corpo.querySelector('canvas');
  const f = document.querySelector('#leitor-pdf-falha');
  return {
    aberto: m.classList.contains('aberto'),
    desenhada: corpo.dataset.paginaDesenhada || '',
    contador: document.querySelector('#leitor-contador').textContent,
    largura: c ? parseFloat(c.style.width) : 0,
    falha: f ? f.dataset.motivo + ': ' + f.textContent : ''
  };
});

/* Quem tenta sair do aplicativo: o compartilhar do Android e o download por
 * link. Os dois ficam anotados em vez de acontecer. */
async function vigiarSaidas(pag) {
  await pag.evaluate(() => {
    window.__saidas = [];
    navigator.canShare = () => true;
    navigator.share = (d) => { window.__saidas.push('share:' + d.files.map(f => f.name).join(',')); return Promise.resolve(); };
    const clicar = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.hasAttribute('download')) { window.__saidas.push('download:' + this.getAttribute('download')); return; }
      return clicar.apply(this, arguments);
    };
  });
}
const saidas = pag => pag.evaluate(() => (window.__saidas || []).join(' | '));

async function cortarRede(pag, cortar) {
  amb.cortado = cortar;
  await pag.setOfflineMode(cortar);
}

(async () => {
  const navegador = await amb.subir();
  const pag = await amb.pagina();
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  const pedidosDoLeitor = [];
  pag.on('request', r => { if (r.url().indexOf('/vendor/pdfjs') >= 0) pedidosDoLeitor.push(r.url()); });
  await H.abrirApp(pag, amb.ORIGEM);
  /* O sw.js precisa estar no comando antes do primeiro PDF: é ele que guarda o
   * leitor no BAIXADOS. Na primeira visita ele assume e o aplicativo recarrega. */
  await esperar('o sw.js controla a página', () => pag.evaluate(() => !!navigator.serviceWorker.controller), v => v === true, 20000);
  await H.abrirApp(pag, amb.ORIGEM);
  conf('o sw.js controla a página', await pag.evaluate(() => !!navigator.serviceWorker.controller), true);

  const pdf = pdfDeTeste();
  await pag.evaluate(async (dados) => {
    const d = await Store.carregar();
    d.alunos = (d.alunos || []).filter(a => a.id !== dados.ALUNO);
    d.alunos.push({ id: dados.ALUNO, nome: 'Aluno Alfa Teste', ano: '9', anoEscolar: '9º ano do Ensino Fundamental',
      responsavel: 'Responsavel Alfa', grade: 'quarta-feira, 10:00',
      vigencias: [{ id: 'v_c14', inicio: '2026-01-01', fim: '2027-12-31', valorHora: 100 }] });
    const bytes = Uint8Array.from(atob(dados.b64), c => c.charCodeAt(0));
    await Store.salvarAnexo(dados.ANEXO_PDF, { nome: 'lista_alfa_teste.pdf', tipo: 'application/pdf',
      blob: new Blob([bytes], { type: 'application/pdf' }) });
    await Store.salvarAnexo(dados.ANEXO_TXT, { nome: 'recado_alfa.txt', tipo: 'text/plain',
      blob: new Blob(['recado de teste'], { type: 'text/plain' }) });
    d.aulas = (d.aulas || []).filter(a => a.alunoId !== dados.ALUNO);
    d.aulas.push({ id: dados.AULA, alunoId: dados.ALUNO, serieId: null, data: dados.hoje, hora: '10:00', duracaoMin: 60,
      status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', temNota: false,
      anexos: [{ id: dados.ANEXO_PDF, nome: 'lista_alfa_teste.pdf', tamanho: bytes.length },
        { id: dados.ANEXO_TXT, nome: 'recado_alfa.txt', tamanho: 15 }] });
    await Store.salvar(d);
  }, { ALUNO, AULA, ANEXO_PDF, ANEXO_TXT, hoje: hojeIso, b64: pdf.toString('base64') });
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('1. O leitor não vem com o aplicativo');
  const raiz = H.RAIZ;
  const sw = fs.readFileSync(path.join(raiz, 'sw.js'), 'utf8');
  const lista = (sw.match(/var ARQUIVOS = \[([\s\S]*?)\n\];/) || ['', ''])[1];
  conf('achei a lista ARQUIVOS do sw.js', lista.indexOf("'./app.js'") >= 0, true);
  conf('o leitor não está no pré-cache', /vendor/.test(lista.replace(/\/\*[\s\S]*?\*\//g, '')), false);
  conf('nem num <script> do index.html', /<script[^>]+vendor/.test(fs.readFileSync(path.join(raiz, 'index.html'), 'utf8')), false);
  conf('os arquivos do leitor existem', ['pdf.min.mjs', 'pdf.worker.min.mjs', 'LICENSE']
    .every(f => fs.existsSync(path.join(raiz, 'vendor', 'pdfjs-6.4.299', f))), true);
  conf('nenhum pedido do leitor ao abrir o aplicativo', pedidosDoLeitor.length, 0);

  // ================================================================
  secao('2. Sem sinal na primeira vez: a frase e o caminho de fora');
  await vigiarSaidas(pag);
  conf('a aula abriu', await abrirAulaDeHoje(pag), true);
  await cortarRede(pag, true);
  // controle positivo: a rede está cortada mesmo (um endereço que nenhum cache tem)
  conf('controle: com a rede cortada, nada chega do servidor', await pag.evaluate(() =>
    fetch('vendor/pdfjs-6.4.299/LICENSE?sonda=' + Date.now()).then(r => r.status, () => 'erro')), 503);
  conf('tocou em Abrir no PDF', await tocarAbrir(pag, 'lista_alfa_teste.pdf'), true);
  const semSinal = await esperar('a frase de sem sinal', () => estadoLeitor(pag), v => v && v.falha !== '', 15000);
  conf('o leitor diz que precisa de sinal na primeira vez', /^leitor: .*sem sinal/.test(semSinal.valor.falha), true);
  conf('e oferece abrir fora do aplicativo', await pag.evaluate(() => (document.querySelector('#leitor-abrir-fora') || {}).textContent), 'Abrir fora do aplicativo');
  conf('o "Abrir esta página como folha" fica desligado', await pag.$eval('#leitor-como-folha', e => e.disabled), true);
  await pag.click('#leitor-abrir-fora');
  await pausa(300);
  conf('"Abrir fora" leva ao caminho de antes (compartilhar)', await saidas(pag), 'share:lista_alfa_teste.pdf');
  conf('e a janela do leitor fechou', (await estadoLeitor(pag)).aberto, false);
  await cortarRede(pag, false);
  await pag.evaluate(() => { window.__saidas = []; });

  // ================================================================
  secao('2b. Rede que não responde, sem o leitor guardado: o prazo leva ao "Abrir fora"');
  /* O tablet conectado mas sem tráfego: o pedido não falha, fica esperando.
   * Sem prazo, a janela ficava em "Abrindo o PDF..." para sempre. */
  amb.segurar = '/vendor/';
  amb.segurados.length = 0;
  conf('tocou em Abrir no PDF', await tocarAbrir(pag, 'lista_alfa_teste.pdf'), true);
  const inicioDoPrazo = Date.now();
  await pausa(3000);
  const esperando = await estadoLeitor(pag);
  conf('enquanto a rede segura, a janela espera', esperando.aberto + '|' + esperando.falha + '|' + esperando.desenhada, 'true||');
  conf('os pedidos do leitor chegaram ao servidor e ficaram sem resposta', amb.segurados.length > 0, true);
  const venceu = await esperar('o prazo vencer', () => estadoLeitor(pag), v => v && v.falha !== '', 25000);
  const levou = Date.now() - inicioDoPrazo;
  console.log('   o "Abrir fora" apareceu em ' + levou + ' ms');
  conf('passado o prazo, a frase de sem sinal', /^leitor: .*sem sinal/.test(venceu.valor ? venceu.valor.falha : ''), true);
  conf('e o "Abrir fora do aplicativo"', await pag.evaluate(() => !!document.querySelector('#leitor-abrir-fora')), true);
  conf('no prazo de 15 s, e não antes', levou >= 14000 && levou < 25000, true);
  await pag.evaluate(() => document.querySelector('#modal-leitor-pdf [data-fechar]').click());
  amb.soltarSegurados();
  await pausa(300);

  // ================================================================
  secao('3. Com sinal, o Abrir seguinte tenta de novo e abre sem sair do aplicativo');
  const urlAntes = pag.url();
  const abasAntes = (await navegador.pages()).length;
  let navegacoes = 0;
  const contaNavegacao = f => { if (f === pag.mainFrame()) navegacoes++; };
  pag.on('framenavigated', contaNavegacao);
  let alvosNovos = 0;
  const contaAlvo = t => { if (t.type() === 'page') alvosNovos++; };
  navegador.on('targetcreated', contaAlvo);
  conf('tocou em Abrir no PDF', await tocarAbrir(pag, 'lista_alfa_teste.pdf'), true);
  const p1 = await esperar('a página 1 desenhada', () => estadoLeitor(pag), v => v && v.desenhada === '1', 30000);
  conf('a janela do leitor abriu', p1.valor && p1.valor.aberto, true);
  conf('e a página 1 apareceu', p1.valor && p1.valor.desenhada, '1');
  conf('o contador diz "Página 1 de 3"', p1.valor && p1.valor.contador, 'Página 1 de 3');
  conf('o título é o nome do anexo', await pag.$eval('#titulo-modal-leitor-pdf', e => e.textContent), 'lista_alfa_teste.pdf');
  conf('a cor da página 1 (vermelho) está no canvas', (await pixelsDaCor(pag, CANVAS, RGB[0])) > 200, true);
  conf('e a da página 2 (azul) não', await pixelsDaCor(pag, CANVAS, RGB[1]), 0);
  conf('o leitor foi pedido só agora', pedidosDoLeitor.length > 0, true);
  conf('nenhuma aba nova', alvosNovos + '/' + ((await navegador.pages()).length - abasAntes), '0/0');
  conf('nenhuma navegação', navegacoes + ' ' + pag.url(), '0 ' + urlAntes);
  conf('nada foi compartilhado nem baixado', await saidas(pag), '');
  /* O PDF de teste não tem imagem: o PDF.js nunca pediria um decodificador.
   * Se eles estão no BAIXADOS, foi a busca de fundo do app que os trouxe. */
  const decod = await esperar('os três decodificadores no BAIXADOS', () => pag.evaluate(async () => {
    const c = await caches.open('apoio-educacional-baixados');
    return (await c.keys()).filter(r => /\/vendor\/pdfjs-6\.4\.299\/wasm\/[a-z0-9_]+\.wasm$/.test(r.url))
      .map(r => r.url.split('/').pop()).sort().join(',');
  }), v => v === 'jbig2.wasm,openjpeg.wasm,qcms_bg.wasm', 15000);
  conf('depois da primeira abertura, os três .wasm estão no BAIXADOS', decod.valor, 'jbig2.wasm,openjpeg.wasm,qcms_bg.wasm');

  // ================================================================
  secao('4. Próxima: a página 2');
  await pag.click('#leitor-proxima');
  const p2 = await esperar('a página 2 desenhada', () => estadoLeitor(pag), v => v && v.desenhada === '2', 15000);
  conf('o contador diz "Página 2 de 3"', p2.valor && p2.valor.contador, 'Página 2 de 3');
  conf('a cor da página 2 (azul) está no canvas', (await pixelsDaCor(pag, CANVAS, RGB[1])) > 200, true);
  conf('e a da página 1 (vermelho) saiu', await pixelsDaCor(pag, CANVAS, RGB[0]), 0);
  conf('Anterior ligado, Próxima ligado', await pag.evaluate(() =>
    [document.querySelector('#leitor-anterior').disabled, document.querySelector('#leitor-proxima').disabled].join(',')), 'false,false');

  // ================================================================
  secao('5. O zoom muda o tamanho do canvas');
  const larguraBase = (await estadoLeitor(pag)).largura;
  const esperaLargura = (rotulo, cond) => esperar(rotulo, () => estadoLeitor(pag), v => v && cond(v.largura), 10000);
  await pag.click('#leitor-mais');
  const maior = (await esperaLargura('canvas maior', l => l > larguraBase + 10)).valor.largura;
  conf('"+" aumenta o canvas em 25%', Math.abs(maior / larguraBase - 1.25) < 0.02, true);
  await pag.click('#leitor-menos');
  await pag.click('#leitor-menos');
  const menor = (await esperaLargura('canvas menor', l => l < larguraBase - 10)).valor.largura;
  conf('"-" diminui o canvas', Math.abs(menor / larguraBase - 0.8) < 0.02, true);
  await pag.click('#leitor-largura');
  const ajustada = (await esperaLargura('de volta à largura', l => Math.abs(l - larguraBase) <= 1)).valor.largura;
  conf('"Ajustar à largura" volta à largura da janela', Math.abs(ajustada - larguraBase) <= 1, true);
  const corpoLargura = await pag.$eval('#corpo-modal-leitor-pdf', e => e.clientWidth - 36);
  conf('e a largura é a da janela', Math.abs(larguraBase - corpoLargura) <= 1, true);
  conf('os botões têm 44 px de altura', await pag.evaluate(() =>
    ['#leitor-anterior', '#leitor-proxima', '#leitor-menos', '#leitor-mais', '#leitor-largura', '#leitor-como-folha']
      .every(s => document.querySelector(s).getBoundingClientRect().height >= 44)), true);
  conf('ainda na página 2', (await estadoLeitor(pag)).contador, 'Página 2 de 3');

  // ================================================================
  secao('6. Abrir esta página como folha');
  await pag.click('#leitor-como-folha');
  const editor = await esperar('a folha abriu', () => pag.evaluate(() =>
    document.querySelector('#modal-nota').classList.contains('aberto')), v => v === true, 15000);
  conf('o editor da folha abriu', editor.ok, true);
  conf('e o leitor fechou', (await estadoLeitor(pag)).aberto, false);
  await pausa(600);
  conf('a página 2 (azul) está desenhada na folha', (await pixelsDaCor(pag, '#tela-desenho', RGB[1])) > 200, true);
  await pag.evaluate(() => {
    const c = document.querySelector('#tela-desenho');
    const r = c.getBoundingClientRect();
    const pts = [[r.width * 0.3, r.height * 0.3], [r.width * 0.4, r.height * 0.35], [r.width * 0.5, r.height * 0.32], [r.width * 0.6, r.height * 0.4]];
    const ev = (tipo, x, y) => c.dispatchEvent(new PointerEvent(tipo, { pointerId: 7, pointerType: 'pen', pressure: 0.5, isPrimary: true,
      bubbles: true, clientX: r.left + x, clientY: r.top + y }));
    ev('pointerdown', pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ev('pointermove', pts[i][0], pts[i][1]);
    ev('pointerup', pts[pts.length - 1][0], pts[pts.length - 1][1]);
  });
  await pausa(900);
  await pag.evaluate(() => Array.from(document.querySelectorAll('#rodape-nota button')).find(b => b.textContent.trim() === 'Concluir').click());
  await esperar('editor fechado', () => pag.$eval('#modal-nota', e => e.classList.contains('aberto')), v => v === false, 8000);
  const lerFolha = () => pag.evaluate(async (id) => {
    const d = await Store.carregar();
    const aula = d.aulas.find(a => a.id === id);
    const nota = await Store.lerNota(id);
    const itens = nota ? nota.paginas[nota.paginas.length - 1].itens : [];
    const img = itens.find(x => x.t === 'imagem');
    const midia = img ? await Store.lerMidia(img.ref) : null;
    return { temNota: aula && aula.temNota, paginas: nota ? nota.paginas.length : 0, tipos: itens.map(x => x.t).join(','),
      jpeg: midia ? String(midia.dataUrl).slice(0, 23) : '', largura: img ? Math.round(img.w) : 0 };
  }, AULA);
  let folha = await lerFolha();
  conf('a aula tem folha', folha.temNota, true);
  conf('a folha tem a página como imagem e o traço por cima', folha.tipos, 'imagem,traco');
  conf('a imagem está guardada como JPEG', folha.jpeg, 'data:image/jpeg;base64,');
  conf('a página ocupa a largura da folha', folha.largura > 700, true);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  folha = await lerFolha();
  conf('depois de recarregar, a imagem e o traço continuam', folha.tipos, 'imagem,traco');

  // ================================================================
  secao('6b. Rede que não responde, com o leitor guardado: abre do cache');
  amb.segurar = '/vendor/';
  amb.segurados.length = 0;
  await H.abrirApp(pag, amb.ORIGEM);   // sessão nova: o leitor carrega de novo
  conf('a aula abriu', await abrirAulaDeHoje(pag), true);
  conf('tocou em Abrir no PDF', await tocarAbrir(pag, 'lista_alfa_teste.pdf'), true);
  const fraca = await esperar('a página 1 com a rede segurando', () => estadoLeitor(pag), v => v && (v.desenhada === '1' || v.falha !== ''), 12000);
  conf('com a rede segurando, o PDF abriu do cache', fraca.valor && (fraca.valor.desenhada + '|' + fraca.valor.falha), '1|');
  conf('nenhum pedido do leitor ficou esperando a rede', amb.segurados.map(s => s.rel).join(', '), '');
  await pag.evaluate(() => document.querySelector('#modal-leitor-pdf [data-fechar]').click());
  amb.soltarSegurados();

  // ================================================================
  secao('7. Rede cortada: a SEGUNDA abertura funciona');
  await cortarRede(pag, true);
  amb.cortados.length = 0;
  pedidosDoLeitor.length = 0;
  // o aplicativo inteiro reaberto sem rede: o leitor só pode vir do BAIXADOS
  await pag.goto(amb.ORIGEM + '/index.html', { waitUntil: 'domcontentloaded' }).catch(() => { });
  await H.abrirApp(pag, amb.ORIGEM).catch(() => { });
  conf('o aplicativo abriu sem rede', await pag.evaluate(() => typeof Store === 'object'), true);
  await vigiarSaidas(pag);
  conf('a aula abriu sem rede', await abrirAulaDeHoje(pag), true);
  conf('tocou em Abrir no PDF', await tocarAbrir(pag, 'lista_alfa_teste.pdf'), true);
  const off = await esperar('a página 1 desenhada sem rede', () => estadoLeitor(pag), v => v && (v.desenhada === '1' || v.falha !== ''), 30000);
  conf('sem rede, o PDF abriu', off.valor && (off.valor.desenhada + '|' + off.valor.falha), '1|');
  conf('com a cor da página 1', (await pixelsDaCor(pag, CANVAS, RGB[0])) > 200, true);
  conf('o leitor foi pedido de novo (e veio do cache)', pedidosDoLeitor.length > 0, true);
  /* O setOfflineMode da página não alcança a rede do sw.js (medido: o
   * servidor recebe os pedidos dele). Por isso o corte do lado do servidor.
   * Controle: o resto do aplicativo, que o sw.js busca na rede primeiro,
   * tentou o servidor cortado; o leitor, que vem do cache antes, não. */
  conf('controle: o aplicativo tentou a rede e o servidor cortado derrubou', amb.cortados.indexOf('/app.js') >= 0, true);
  conf('o leitor nem tentou a rede (cache primeiro)', amb.cortados.filter(c => c.indexOf('/vendor/') === 0).join(', '), '');
  conf('o leitor está no BAIXADOS, e não no pré-cache', await pag.evaluate(async () => {
    const nomes = await caches.keys();
    const onde = [];
    for (const n of nomes) {
      const c = await caches.open(n);
      const k = (await c.keys()).filter(r => r.url.indexOf('/vendor/pdfjs-6.4.299/pdf.') >= 0);
      if (k.length) onde.push(n.replace(/v\d+$/, 'vN') + ':' + k.length);
    }
    return onde.join(' ');
  }), 'apoio-educacional-baixados:2');
  await pag.click('#leitor-proxima');
  const offP2 = await esperar('a página 2 sem rede', () => estadoLeitor(pag), v => v && v.desenhada === '2', 15000);
  conf('e anda para a página 2 sem rede', offP2.valor && offP2.valor.contador, 'Página 2 de 3');
  await pag.evaluate(() => document.querySelector('#modal-leitor-pdf [data-fechar]').click());
  await cortarRede(pag, false);

  // ================================================================
  secao('8. O anexo que não é PDF sai como antes');
  await pag.evaluate(() => { window.__saidas = []; });
  conf('tocou em Abrir no recado', await tocarAbrir(pag, 'recado_alfa.txt'), true);
  await pausa(500);
  conf('foi para o compartilhar, e o leitor não abriu', (await saidas(pag)) + ' ' + (await estadoLeitor(pag)).aberto,
    'share:recado_alfa.txt false');

  // ================================================================
  secao('9. Nenhum erro');
  conf('nenhum erro de página', pag.errosDePagina.join(' | '), '');
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
