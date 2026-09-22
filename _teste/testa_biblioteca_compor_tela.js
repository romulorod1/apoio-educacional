/* testa_biblioteca_compor_tela.js
 *
 * Selecionar e compor, no Chrome de verdade, com o pacote SINTÉTICO do 9º ano
 * na forma "compor" (_pacote_sintetico.js): rótulo em todos os itens menos um,
 * um item sem solução na fonte e uma solução em dois pedaços que não cabe numa
 * folha. O pacote real do Drive nunca entra aqui.
 *
 * O que prova, na ordem em que ela viveria:
 *   1. marca 4 exercícios de "Soma e Produto", 4 de "Resultados Básicos" e 3
 *      páginas de teoria pelas caixas; o contador diz "Material marcado:
 *      8 exercícios, 3 páginas de teoria";
 *   2. troca de aba e volta: o carrinho e as caixas continuam;
 *   3. etiqueta de dificuldade com um toque, sem sair da lista; outro toque tira;
 *   4. "Gerar material": título do módulo, caixas nos padrões do brief;
 *      "Nova aula hoje", salvar a aula, e o PDF entra anexado nela;
 *   5. o PDF anexado: teoria, lista renumerada de 1 a 8, gabarito em folha
 *      separada com as 8 soluções na ordem e "Sem solução na fonte." no 3,
 *      marca por cima em toda página; o rótulo original coberto (a caixa
 *      colorida do canto do recorte não aparece na folha rasterizada);
 *   6. o uso gravado: 8 registros {itemId, alunoId, aulaId, data}; o título
 *      guardado para o aluno;
 *   7. de novo na mesma aula, com "Abrir a lista como folha": a folha abre com
 *      a lista colada, riscável;
 *   8. só a lista, sem gabarito (o caminho mais comum): o anexo sai com a lista
 *      e sem folha de gabarito; "Abrir a lista como folha" desliga quando a
 *      Lista é desmarcada;
 *   9. nenhum erro de JavaScript.
 *
 * Modo envenenado:
 *   node _teste/testa_biblioteca_compor_tela.js --envenenado-sem-solucao
 *     o pdf.js servido não escreve "Sem solução na fonte." (o gabarito ficaria
 *     com um número e nada embaixo), e o teste tem de ENXERGAR isso.
 *
 *   SALVAR_PDF=<pasta> guarda o PDF anexado e prints para o CHECKLIST_b4.md.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const VENENO = process.argv.indexOf('--envenenado-sem-solucao') !== -1;
const PORTA = 8793;
const SALVAR = process.env.SALVAR_PDF || '';

const PDF_REPO = fs.readFileSync(path.join(H.RAIZ, 'pdf.js'), 'utf8');
const LINHA_SEM = "doc.texto('Sem solução na fonte.', MARG_E + 20, doc.y, { tam: 9.5, italic: true, cor: COR.muted });";
const trocas = {};
if (VENENO) trocas['/pdf.js'] = PDF_REPO.split(LINHA_SEM).join('void 0;');

const amb = H.criarAmbiente(PORTA, 'perfil_bib_compor', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'bib_compor_tela_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

async function importar(pag, arquivo) {
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => { document.querySelector('#estado-importacao-biblioteca').innerHTML = ''; });
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar('importação', () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca');
    return c ? c.innerText.trim() : '';
  }), v => /^Biblioteca importada\.|não foi importado/.test(v || ''), 60000);
  return r.valor || '';
}

async function tocarLinha(pag, nome) {
  const ok = await pag.evaluate(n => {
    const l = Array.from(document.querySelectorAll('#bib-corpo .item-lista')).find(x => x.querySelector('.nome').textContent.trim() === n);
    if (!l) return false;
    l.click();
    return true;
  }, nome);
  if (!ok) throw Object.assign(new Error('não achei a linha ' + nome), { jaContado: false });
  await pausa(150);
}
async function subirNaBiblioteca(pag) {
  for (let k = 0; k < 4; k++) {
    const v = await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); return !!b; });
    if (!v) break;
    await pausa(150);
  }
}
async function marcar(pag, tipo, id) {
  const ok = await pag.evaluate((t, i) => {
    const c = document.querySelector('input[data-carrinho="' + t + '"][data-id="' + i + '"]');
    if (!c) return false;
    c.click();
    return c.checked;
  }, tipo, id);
  if (!ok) throw Object.assign(new Error('não consegui marcar ' + id), { jaContado: false });
}
const contador = pag => pag.evaluate(() => {
  const c = document.querySelector('#bib-carrinho-contagem');
  return c ? c.textContent : '';
});

// Um depósito inteiro, de dentro da página.
const lerDeposito = (pag, nome) => pag.evaluate(n => new Promise(r => {
  const q = indexedDB.open('apoio-educacional');
  q.onsuccess = () => {
    const g = q.result.transaction(n, 'readonly').objectStore(n).getAll();
    g.onsuccess = () => { q.result.close(); r(g.result); };
  };
}), nome);
const lerDados = pag => pag.evaluate(() => new Promise(r => {
  const q = indexedDB.open('apoio-educacional');
  q.onsuccess = () => {
    const g = q.result.transaction('dados', 'readonly').objectStore('dados').get('principal');
    g.onsuccess = () => { q.result.close(); r(g.result); };
  };
}));
// O anexo guardado, em base64, para o Node ler.
const lerAnexo = (pag, id) => pag.evaluate(i => new Promise(r => {
  const q = indexedDB.open('apoio-educacional');
  q.onsuccess = () => {
    const g = q.result.transaction('anexos', 'readonly').objectStore('anexos').get(i);
    g.onsuccess = () => {
      q.result.close();
      if (!g.result || !g.result.blob) { r(null); return; }
      g.result.blob.arrayBuffer().then(buf => {
        let s = ''; const b = new Uint8Array(buf);
        for (let k = 0; k < b.length; k += 0x8000) s += String.fromCharCode.apply(null, b.subarray(k, k + 0x8000));
        r(btoa(s));
      });
    };
  };
}), id);

/* O mesmo leitor do testa_biblioteca_compor.js: o PDF não comprime os fluxos. */
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
    return { obj: o, fluxo, textos, texto: textos.join(' '), imagens: (fluxo.match(/ Do Q/g) || []).length };
  });
}

const SP = '9ano:equacoes-do-segundo-grau:soma-e-produto:ex:';
const RB = '9ano:equacoes-do-segundo-grau:equacao-do-2o-grau-resultados-basicos:ex:';
const TEO = '9ano:equacoes-do-segundo-grau:resultados-basicos-parte-i:teo:p';
// na ordem em que ela marca: o 3 da lista é o sem solução, o 2 o sem rótulo, o 4 o de dois pedaços
const MARCADOS = [SP + 1, SP + 2, SP + 4, SP + 7, RB + 1, RB + 2, RB + 3, RB + 5];

(async () => {
  console.log(VENENO
    ? 'MODO ENVENENADO (sem solução): o pdf.js servido não escreve "Sem solução na fonte."; o teste tem de enxergar o número vazio.'
    : 'MODO NORMAL: caixas, carrinho, gerar, anexar, uso, etiqueta e lista como folha.');
  secao('0. O servidor é este, e o veneno é de verdade');
  if (VENENO) {
    conf('o pdf.js servido ficou DIFERENTE do repositório', trocas['/pdf.js'] !== PDF_REPO ? 'diferente' : 'IGUAL', 'diferente');
    conf('e o veneno trocou exatamente uma ocorrência', PDF_REPO.split(LINHA_SEM).length - 1, 1);
    if (trocas['/pdf.js'] === PDF_REPO) throw Object.assign(new Error('veneno não aplicado'), { jaContado: true });
  }
  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);
  const zip = path.join(TMP, 'nono.zip');
  Sintetico.gerar(zip, { compor: true });
  conf('importou o pacote sintético', /^Biblioteca importada\./.test(await importar(pag, zip)), true);

  // ================================================================
  secao('1. Marcar 8 exercícios de duas listas e 3 páginas de teoria');
  await H.irParaAba(pag, 'biblioteca');
  await esperar('módulos', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .item-lista').length), v => v > 0, 10000);
  conf('sem nada marcado, a faixa diz que nada foi marcado (e já ocupa o lugar)', await pag.evaluate(() => {
    const f = document.querySelector('#bib-carrinho'), v = document.querySelector('#bib-carrinho-vazio');
    return !f.hidden && f.offsetHeight > 30 && !!v && /^Nada marcado ainda\./.test(v.textContent);
  }), true);
  const yGrade = () => pag.evaluate(() => { const g = document.querySelector('#bib-corpo'); return Math.round(g.getBoundingClientRect().top); });
  await tocarLinha(pag, 'Equações do Segundo Grau');
  await tocarLinha(pag, 'Soma e Produto');
  await esperar('lista Soma e Produto', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo input[data-carrinho="itens"]').length), v => v === 8, 8000);
  const alvoToque = await pag.evaluate(() => {
    const l = document.querySelector('#bib-corpo .bib-marcar').getBoundingClientRect();
    const e = document.querySelector('#bib-corpo .bib-etiqueta-botao').getBoundingClientRect();
    return Math.min(l.height, e.height, e.width);
  });
  conf('caixa e etiqueta com alvo de toque de 44 px', alvoToque >= 44, true);
  const yAntes = await yGrade();
  for (const id of MARCADOS.slice(0, 4)) await marcar(pag, 'itens', id);
  conf('contador depois de 4', await contador(pag), 'Material marcado: 4 exercícios, 0 páginas de teoria');
  conf('a grade não pulou no primeiro toque (menos de 8 px)', Math.abs((await yGrade()) - yAntes) < 8, true);
  // o toque na caixa não abre a tela cheia
  conf('marcar não abriu a tela cheia', await pag.$eval('#modal-biblioteca', e => e.classList.contains('aberto')), false);
  await subirNaBiblioteca(pag);
  await tocarLinha(pag, 'Equações do Segundo Grau');
  await tocarLinha(pag, 'Equações do Segundo Grau: Resultados Básicos');
  await esperar('lista Resultados Básicos', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo input[data-carrinho="itens"]').length), v => v === 40, 8000);
  for (const id of MARCADOS.slice(4)) await marcar(pag, 'itens', id);
  await subirNaBiblioteca(pag);
  await tocarLinha(pag, 'Equações do Segundo Grau');
  await tocarLinha(pag, 'Resultados Básicos - Parte I');
  await esperar('páginas de teoria', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo input[data-carrinho="paginas"]').length), v => v === 5, 8000);
  for (const n of ['01', '02', '03']) await marcar(pag, 'paginas', TEO + n);
  conf('contador com tudo', await contador(pag), 'Material marcado: 8 exercícios, 3 páginas de teoria');
  if (SALVAR) await pag.screenshot({ path: path.join(SALVAR, 'tela_1_caixas_teoria.png') });

  // ================================================================
  secao('2. Troca de aba: o carrinho continua');
  await H.irParaAba(pag, 'agenda');
  await H.irParaAba(pag, 'biblioteca');
  await esperar('aba desenhada de novo', () => contador(pag), v => !!v, 5000);
  conf('contador depois de ir e voltar', await contador(pag), 'Material marcado: 8 exercícios, 3 páginas de teoria');
  const aindaMarcadas = await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-corpo input[data-carrinho="paginas"]')).map(c => c.checked).join(','));
  conf('e as caixas da teoria continuam marcadas', aindaMarcadas, 'true,true,true,false,false');
  // o aplicativo fechado e aberto de novo: a seleção volta
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'biblioteca');
  await esperar('aba depois de recarregar', () => contador(pag), v => !!v, 8000);
  conf('depois de recarregar, a seleção continua', await contador(pag), 'Material marcado: 8 exercícios, 3 páginas de teoria');
  await subirNaBiblioteca(pag);
  await tocarLinha(pag, 'Equações do Segundo Grau');
  await tocarLinha(pag, 'Resultados Básicos - Parte I');
  await esperar('páginas de teoria', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo input[data-carrinho="paginas"]').length), v => v === 5, 8000);
  // Desmarcar tudo com Desfazer
  await pag.click('#bib-carrinho-limpar');
  conf('Desmarcar tudo zera a faixa', await pag.evaluate(() => !!document.querySelector('#bib-carrinho-vazio')), true);
  const desfez = await pag.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.trim() === 'Desfazer' && x.offsetParent);
    if (!b) return false; b.click(); return true;
  });
  conf('o aviso oferece Desfazer', desfez, true);
  await pausa(200);
  conf('e o Desfazer devolve a seleção inteira', await contador(pag), 'Material marcado: 8 exercícios, 3 páginas de teoria');
  conf('com as caixas marcadas de novo', await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-corpo input[data-carrinho="paginas"]')).map(c => c.checked).join(',')), 'true,true,true,false,false');

  // ================================================================
  secao('3. Etiqueta de dificuldade com um toque');
  await subirNaBiblioteca(pag);
  await tocarLinha(pag, 'Equações do Segundo Grau');
  await tocarLinha(pag, 'Soma e Produto');
  await esperar('lista', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .bib-etiqueta').length), v => v === 8, 8000);
  const tocarEtiqueta = (id, d) => pag.evaluate((i, dd) => {
    const cel = document.querySelector('input[data-carrinho="itens"][data-id="' + i + '"]').closest('.bib-celula');
    cel.querySelector('.bib-etiqueta-botao[data-dificuldade="' + dd + '"]').click();
  }, id, d);
  await tocarEtiqueta(SP + 3, 3);
  const et = await esperar('etiqueta gravada', () => lerDeposito(pag, 'biblioteca_etiquetas'), v => v && v.some(e => e.itemId === SP + 3 && e.dificuldade === 3), 5000);
  conf('Difícil gravada para o exercício 3', et.ok, true);
  conf('o botão ficou marcado', await pag.evaluate(i => document.querySelector('input[data-id="' + i + '"]').closest('.bib-celula')
    .querySelector('.bib-etiqueta-botao.ativa').textContent, SP + 3), 'Difícil');
  conf('e a lista continua na tela', await pag.evaluate(() => document.querySelectorAll('#bib-corpo .bib-celula').length), 8);
  await tocarEtiqueta(SP + 3, 3);
  const tirada = await esperar('etiqueta tirada', () => lerDeposito(pag, 'biblioteca_etiquetas'), v => v && v.some(e => e.itemId === SP + 3 && e.dificuldade === null), 5000);
  conf('outro toque tira a etiqueta', tirada.ok, true);
  if (SALVAR) await pag.screenshot({ path: path.join(SALVAR, 'tela_2_lista_caixas_etiqueta.png') });

  // ================================================================
  secao('4. Gerar material numa aula nova de hoje');
  await pag.click('#bib-carrinho-gerar');
  await esperar('janela Gerar material', () => pag.$eval('#modal-bib-gerar', e => e.classList.contains('aberto')), v => v === true, 5000);
  const padroes = await pag.evaluate(() => ({
    titulo: document.querySelector('#bib-gerar-titulo').value,
    sub: document.querySelector('#bib-gerar-subtitulo').value,
    caixas: ['teoria', 'lista', 'gabarito', 'espaco', 'origem'].map(k => k + '=' + document.querySelector('#bib-gerar-' + k).checked).join(','),
    anexar: document.querySelector('#bib-gerar-anexar').disabled
  }));
  conf('título padrão: o módulo', padroes.titulo, 'Equações do Segundo Grau');
  conf('subtítulo vazio quando as aulas são várias', padroes.sub, '');
  conf('caixas nos padrões do brief', padroes.caixas, 'teoria=true,lista=true,gabarito=true,espaco=false,origem=false');
  conf('"Gerar e anexar" espera a escolha da aula', padroes.anexar, true);
  conf('e a dica diz por quê', await pag.evaluate(() => { const d = document.querySelector('#bib-gerar-dica'); return !!d && !d.hidden && d.offsetParent !== null; }), true);
  if (SALVAR) await pag.screenshot({ path: path.join(SALVAR, 'tela_3_gerar_material.png') });
  await pag.evaluate(() => {
    document.querySelector('#bib-gerar-subtitulo').value = 'Revisão de terça';
    document.querySelector('#bib-gerar-aulas [data-aula="nova"]').click();
  });
  conf('escolhida a aula, a dica some', await pag.evaluate(() => document.querySelector('#bib-gerar-dica').hidden), true);
  await pag.click('#bib-gerar-anexar');
  await esperar('janela de aula nova', () => pag.evaluate(() => document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);
  conf('a janela da aula avisa que o material vai junto', await pag.evaluate(() => !!document.querySelector('#aviso-folha-da-biblioteca')), true);
  const alunoId = await pag.evaluate(() => document.querySelector('#campo-aluno').value);
  await pag.click('#salvar-aula');
  const anexou = await esperar('material anexado na aula nova', () => lerDados(pag).then(d => {
    const a = d.aulas.filter(x => x.alunoId === alunoId && (x.anexos || []).some(n => n.biblioteca))[0];
    return a ? { aulaId: a.id, data: a.data, anexo: a.anexos.filter(n => n.biblioteca)[0] } : null;
  }), v => !!v, 30000);
  conf('a aula nova tem o anexo da biblioteca', anexou.ok, true);
  if (!anexou.ok) throw Object.assign(new Error('sem anexo'), { jaContado: true });
  const aulaId = anexou.valor.aulaId;
  conf('nome termina em _biblioteca.pdf', /_biblioteca\.pdf$/.test(anexou.valor.anexo.nome), true);
  conf('o anexo guarda os módulos dos exercícios', JSON.stringify(anexou.valor.anexo.modulos), '["Equações do Segundo Grau"]');

  // ================================================================
  secao('5. O PDF anexado');
  const b64 = await lerAnexo(pag, anexou.valor.anexo.id);
  conf('o arquivo está no depósito de anexos', !!b64, true);
  const bytes = Buffer.from(b64 || '', 'base64');
  if (SALVAR) fs.writeFileSync(path.join(SALVAR, 'material_biblioteca.pdf'), bytes);
  const pags = lerPdf(bytes);
  const N = pags.length;
  conf('moldura em toda página', pags.every((p, i) => p.textos[p.textos.length - 1] === 'Página ' + (i + 1) + ' de ' + N), true);
  conf('as 3 primeiras são a teoria, uma imagem cada', pags.slice(0, 3).map(p => p.imagens).join(','), '1,1,1');
  conf('título e subtítulo editados na folha', pags[0].texto.indexOf('Equações do Segundo Grau') >= 0 && pags[0].texto.indexOf('Revisão de terça') >= 0, true);
  const todo = pags.map(p => p.texto).join(' ');
  const iGab = pags.findIndex(p => /Gabarito/.test(p.texto));
  const lista = pags.slice(3, iGab).map(p => p.texto).join(' ');
  conf('lista renumerada de 1 a 8', (lista.match(/Exercício \d+\./g) || []).join(' '), [1, 2, 3, 4, 5, 6, 7, 8].map(n => 'Exercício ' + n + '.').join(' '));
  conf('gabarito em folha separada (nenhum Exercício na mesma página)', iGab > 3 && pags[iGab].texto.indexOf('Exercício') < 0, true);
  const gab = pags.slice(iGab).map(p => p.textos).reduce((a, b) => a.concat(b), []);
  conf('soluções 1. a 8. na ordem', gab.filter(t => /^\d+\.$/.test(t)).join(' '), '1. 2. 3. 4. 5. 6. 7. 8.');
  const semSol = gab.filter(t => t === 'Sem solução na fonte.').length;
  if (VENENO) {
    conf('VENENO ENXERGADO: o 3 do gabarito ficou sem "Sem solução na fonte."', semSol, 0);
  } else {
    conf('o 3 diz "Sem solução na fonte."', semSol === 1 && gab[gab.indexOf('Sem solução na fonte.') - 1] === '3.', true);
  }
  // a solução do exercício 4 (dois pedaços, 786 pt) não cabe numa folha e quebra entre os pedaços
  conf('7 soluções com imagem, a de dois pedaços contando duas', pags.slice(iGab).reduce((s, p) => s + p.imagens, 0), 8);
  conf('lista e gabarito: marca por cima', pags.slice(3).every(p => /\/ExtGState << \/GSm \d+ 0 R >>/.test(p.obj) && p.fluxo.indexOf('q /GSm gs') >= 0), true);
  conf('teoria: só o selo no rodapé, sem a marca grande', pags.slice(0, 3).every(p => p.obj.indexOf('/ExtGState') < 0 && /\(NW\) Tj/.test(p.fluxo)), true);
  conf('nenhum travessão ou meia-risca', /[–—\x96\x97]/.test(todo), false);

  // o rótulo original coberto: a barra colorida do canto (4,4 a 60,16 pt) some na folha
  const semCaixa = await pag.evaluate(async () => {
    const itens = await Store.itensDaBiblioteca();
    async function escuros(re, parte) {
      const it = itens.filter(i => re.test(i.id))[0];
      const blob = await Store.lerAssetBiblioteca(it.pacote, it.assets[parte]);
      const p = await Biblioteca.rasterizarRecorte(blob, it.medidas[parte], it.origem[parte] && it.origem[parte].pedacos);
      const img = p.pedacos ? p.pedacos[0].img : p.img;      // o rótulo é sempre do primeiro pedaço
      const url = URL.createObjectURL(new Blob([img.bytes], { type: 'image/jpeg' }));
      const im = new Image(); im.src = url; await im.decode();
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
      const x = c.getContext('2d'); x.drawImage(im, 0, 0);
      const k = im.width / p.larguraPt;
      // exatamente o que a folha cobre: a barra do rótulo (4,4 a 60,16) com 1 pt de folga
      const d = x.getImageData(Math.round(3 * k), Math.round(3 * k), Math.round(58 * k), Math.round(14 * k)).data;
      let n = 0; for (let q = 0; q < d.length; q += 4) if (d[q] < 200 || d[q + 2] < 150) n++;
      // as duas últimas linhas do último pedaço: o desenho acaba antes, então é branco
      let fundo = 0;
      if (p.pedacos) {
        const ult = p.pedacos[p.pedacos.length - 1].img;
        const u = new Image(); u.src = URL.createObjectURL(new Blob([ult.bytes], { type: 'image/jpeg' })); await u.decode();
        const c2 = document.createElement('canvas'); c2.width = u.width; c2.height = u.height;
        const x2 = c2.getContext('2d'); x2.drawImage(u, 0, 0);
        const b = x2.getImageData(0, u.height - 2, u.width, 2).data;
        for (let q = 0; q < b.length; q += 4) if (b[q] < 200) fundo++;
      }
      return { n, pedacos: p.pedacos ? p.pedacos.length : 1, fundo };
    }
    return { enunciado: await escuros(/soma-e-produto:ex:1$/, 'enunciado'), empilhada: await escuros(/soma-e-produto:ex:7$/, 'solucao') };
  });
  conf('a solução do 7 vem em 2 pedaços', semCaixa.empilhada.pedacos, 2);
  conf('a barra do rótulo sumiu da solução empilhada (primeiro pedaço)', semCaixa.empilhada.n, 0);
  conf('sem fio escuro no pé do último pedaço', semCaixa.empilhada.fundo, 0);
  conf('a barra do rótulo original saiu branca no JPEG da folha', semCaixa.enunciado.n, 0);

  // ================================================================
  secao('6. O uso e o título guardados');
  const uso = await lerDeposito(pag, 'biblioteca_uso');
  const daAula = uso.filter(u => u.aulaId === aulaId);
  conf('8 registros de uso desta aula', daAula.length, 8);
  conf('um por exercício marcado, na ordem', daAula.map(u => u.itemId).join('|'), MARCADOS.join('|'));
  conf('com o aluno e a data da aula', daAula.every(u => u.alunoId === alunoId && u.data === anexou.valor.data), true);
  const dados = await lerDados(pag);
  const guardado = ((dados.ajustes || {}).bibliotecaTitulos || {})[alunoId];
  conf('último título guardado para o aluno', guardado ? guardado.titulo + ' / ' + guardado.subtitulo : '', 'Equações do Segundo Grau / Revisão de terça');

  // ================================================================
  secao('7. De novo, na aula de hoje, com a lista como folha');
  await H.irParaAba(pag, 'biblioteca');
  conf('depois de anexar, a seleção foi desmarcada', await pag.evaluate(() => !!document.querySelector('#bib-carrinho-vazio')), true);
  const devolveu = await pag.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.trim() === 'Desfazer' && x.offsetParent);
    if (!b) return false; b.click(); return true;
  });
  conf('e o Desfazer do aviso devolve a seleção', devolveu, true);
  await esperar('contador', () => contador(pag), v => !!v, 5000);
  conf('com os mesmos 8 e 3', await contador(pag), 'Material marcado: 8 exercícios, 3 páginas de teoria');
  await pag.click('#bib-carrinho-gerar');
  await esperar('janela Gerar material', () => pag.$eval('#modal-bib-gerar', e => e.classList.contains('aberto')), v => v === true, 5000);
  await pag.evaluate(i => document.querySelector('#bib-gerar-aulas [data-aula="' + i + '"]').click(), aulaId);
  conf('a aula escolhida oferece o último título', await pag.evaluate(() => {
    const b = document.querySelector('#bib-gerar-usar-ultimo'); return b ? b.textContent : '';
  }).then(t => /Usar o último título com .*: Equações do Segundo Grau/.test(t)), true);
  await pag.evaluate(() => {
    document.querySelector('#bib-gerar-usar-ultimo').click();
    const f = document.querySelector('#bib-gerar-folha'); f.click();
  });
  conf('o título voltou ao último usado', await pag.$eval('#bib-gerar-subtitulo', e => e.value), 'Revisão de terça');
  const usosAntes = (await lerDeposito(pag, 'biblioteca_uso')).length;
  await pag.click('#bib-gerar-anexar');
  const folha = await esperar('folha aberta com a lista', () => pag.$eval('#modal-nota', e => e.classList.contains('aberto')), v => v === true, 30000);
  conf('a folha abriu', folha.ok, true);
  const nota = await pag.evaluate(i => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => {
      const g = q.result.transaction('notas', 'readonly').objectStore('notas').get(i);
      g.onsuccess = () => { q.result.close(); r(g.result); };
    };
  }), aulaId);
  const imagens = nota ? nota.paginas.reduce((s, p) => s + p.itens.filter(x => x.t === 'imagem').length, 0) : 0;
  conf('a folha tem os 8 enunciados colados', imagens, 8);
  // cada imagem na folha na proporção do JPEG guardado (nada achatado)
  const proporcoes = await pag.evaluate(async i => {
    const q = await new Promise(r => { const o = indexedDB.open('apoio-educacional'); o.onsuccess = () => r(o.result); });
    const nota = await new Promise(r => { const g = q.transaction('notas', 'readonly').objectStore('notas').get(i); g.onsuccess = () => r(g.result); });
    const out = [];
    for (const pg of nota.paginas) for (const it of pg.itens.filter(x => x.t === 'imagem')) {
      const m = await new Promise(r => { const g = q.transaction('midias', 'readonly').objectStore('midias').get(it.ref); g.onsuccess = () => r(g.result); });
      if (m && m.w && m.h) out.push(Math.abs((it.w / it.h) / (m.w / m.h) - 1));
    }
    q.close();
    return out;
  }, aulaId);
  conf('nenhum enunciado achatado na folha (proporção dentro de 1%)', proporcoes.length >= 8 && proporcoes.every(d => d < 0.01), true);
  conf('dentro da folha (1000 x 1343)', nota && nota.paginas.every(p => p.itens.every(x => x.x >= 0 && x.y >= 0 && x.x + x.w <= 1000.5 && x.y + x.h <= 1343.5)), true);
  conf('o segundo material gravou mais 8 usos', (await lerDeposito(pag, 'biblioteca_uso')).length - usosAntes, 8);
  // o segundo anexo também desmarcou; o Desfazer do aviso devolve para o passo 8
  const devolveu2 = await pag.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.trim() === 'Desfazer' && x.offsetParent);
    if (!b) return false; b.click(); return true;
  });
  conf('o Desfazer aparece também com a folha aberta', devolveu2, true);
  await pausa(800);
  if (SALVAR) await pag.screenshot({ path: path.join(SALVAR, 'tela_4_lista_como_folha.png') });

  // ================================================================
  secao('8. Só a lista, sem gabarito');
  await pag.evaluate(() => Array.from(document.querySelectorAll('#rodape-nota button')).find(b => b.textContent.trim() === 'Concluir').click());
  await esperar('editor fechado', () => pag.$eval('#modal-nota', e => e.classList.contains('aberto')), v => v === false, 5000);
  await H.irParaAba(pag, 'biblioteca');
  await esperar('contador', () => contador(pag), v => !!v, 5000);
  await pag.click('#bib-carrinho-gerar');
  await esperar('janela Gerar material', () => pag.$eval('#modal-bib-gerar', e => e.classList.contains('aberto')), v => v === true, 5000);
  await pag.evaluate(i => document.querySelector('#bib-gerar-aulas [data-aula="' + i + '"]').click(), aulaId);
  const folhaComLista = await pag.$eval('#bib-gerar-folha', e => e.disabled);
  await pag.evaluate(() => { const l = document.querySelector('#bib-gerar-lista'); l.click(); });
  const folhaSemLista = await pag.$eval('#bib-gerar-folha', e => e.disabled);
  conf('"Abrir a lista como folha" desliga sem a Lista', folhaComLista + ',' + folhaSemLista, 'false,true');
  await pag.evaluate(() => {
    document.querySelector('#bib-gerar-lista').click();          // a Lista de volta
    document.querySelector('#bib-gerar-gabarito').click();       // e o gabarito fora
    document.querySelector('#bib-gerar-teoria').click();         // e a teoria fora
    document.querySelector('#bib-gerar-subtitulo').value = 'Só a lista';
  });
  const antes = (await lerDados(pag)).aulas.filter(a => a.id === aulaId)[0].anexos.length;
  await pag.click('#bib-gerar-anexar');
  const soLista = await esperar('anexo só com a lista', () => lerDados(pag).then(d => {
    const a = d.aulas.filter(x => x.id === aulaId)[0];
    return a.anexos.length > antes ? a.anexos[a.anexos.length - 1] : null;
  }), v => !!v, 30000);
  conf('o anexo saiu (sem erro de solução)', soLista.ok, true);
  if (soLista.ok) {
    const bl = Buffer.from(await lerAnexo(pag, soLista.valor.id) || '', 'base64');
    const pl = lerPdf(bl);
    const txt = pl.map(p => p.texto).join(' ');
    conf('lista de 1 a 8', (txt.match(/Exercício \d+\./g) || []).length, 8);
    conf('sem gabarito e sem teoria', /Gabarito/.test(txt) + ',' + /Teoria/.test(txt), 'false,false');
    conf('o subtítulo novo na folha', txt.indexOf('Só a lista') >= 0, true);
    if (SALVAR) fs.writeFileSync(path.join(SALVAR, 'material_so_lista.pdf'), bl);
  }

  if (pag.errosDePagina.length) console.log('   erros de página: ' + pag.errosDePagina.join(' | ').slice(0, 400));
  conf('nenhum erro de JavaScript na página', pag.errosDePagina.length, 0);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
