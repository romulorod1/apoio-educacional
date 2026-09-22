/* testa_biblioteca_compor.js
 *
 * O compositor da biblioteca (PDFGen.gerarMaterialBiblioteca), sem navegador.
 * Os recortes entram como JPEG já rasterizado, que é o que o app entrega a ele;
 * a rasterização do SVG e a tela ficam no testa_biblioteca_compor_tela.js.
 *
 * O que prova:
 *   1. oito exercícios de duas listas e três páginas de teoria: número de
 *      páginas certo, moldura em todas ("Página k de N");
 *   2. lista renumerada de 1 a 8 no lugar do rótulo original, e nada além;
 *   3. gabarito em folha separada, com as 8 soluções na mesma ordem, e o item
 *      sem solução na fonte escrito como tal, nunca uma linha em branco;
 *   4. PAR ENVENENADO: solução que devia vir e não veio (o asset não abriu)
 *      para a folha com mensagem;
 *   5. gabarito junto, quando ela desmarca a folha separada;
 *   6. marca d'água por cima, em multiplicação, em toda página desta folha;
 *      e os outros documentos (fechamento, material dos temas, página crua)
 *      saem byte a byte iguais aos do pdf.js de main;
 *   7. recorte mais alto que a folha: quebra entre pedaços, nunca no meio; um
 *      pedaço sozinho alto demais é reduzido e sai inteiro;
 *   8. nenhum travessão ou meia-risca no texto impresso;
 *   9. lista SEM gabarito: as soluções nem são pedidas, e a folha sai;
 *  10. espaço para resposta e origem cabem acima do limite da folha, num
 *      recorte alto de um pedaço só;
 *  11. recorte reduzido logo abaixo do título fica na página do título;
 *  12. rótulo em caixa estreita demais (corpo abaixo de 7 pt): o número sai numa
 *      linha própria, acima do recorte.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const PDFGen = require('../pdf.js');
const Core = require('../core.js');

let passes = 0, falhas = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n' + t); }

// Um JPEG cinza-claro de 16 x 16, gerado uma vez (sem conteúdo de ninguém).
const JPEG = new Uint8Array(Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAQABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6BooooA//2Q==', 'base64'));
const img = () => ({ bytes: JPEG, wPx: 16, hPx: 16 });
const peca = (altura, rotulo) => ({ larguraPt: 260, alturaPt: altura, rotulo: rotulo === undefined ? [4, 2, 56, 12] : rotulo, img: img() });
const empilhada = alturas => ({
  larguraPt: 260, alturaPt: alturas.reduce((s, h) => s + h, 0) + 6 * (alturas.length - 1), rotulo: [4, 2, 56, 12],
  pedacos: alturas.map(h => ({ img: img(), alturaPt: h }))
});

/* O PDF deste gerador não comprime os fluxos: dá para ler página por página
 * pela ordem do /Kids, com o texto dos Tj e as imagens desenhadas. */
function lerPdf(bytes) {
  const bruto = Buffer.from(bytes).toString('latin1');
  const objs = {};
  const rxObj = /(\d+) 0 obj\n([\s\S]*?)\nendobj/g;
  let m;
  while ((m = rxObj.exec(bruto))) objs[m[1]] = m[2];
  const raiz = Object.values(objs).find(o => /\/Type \/Pages /.test(o));
  const kids = raiz.match(/\/Kids \[([^\]]*)\]/)[1].match(/\d+ 0 R/g).map(r => r.split(' ')[0]);
  const paginas = kids.map(k => {
    const o = objs[k];
    const cont = objs[o.match(/\/Contents (\d+) 0 R/)[1]];
    const fluxo = cont.slice(cont.indexOf('stream\n') + 7, cont.lastIndexOf('\nendstream'));
    const textos = [];
    const rx = /\(((?:\\.|[^\\()])*)\)\s*Tj/g;
    let t;
    while ((t = rx.exec(fluxo))) textos.push(t[1].replace(/\\([\\()])/g, '$1'));
    const imagens = [];
    const rxI = /q ([\d.]+) 0 0 ([\d.]+) ([\d.-]+) ([\d.-]+) cm \/(Im\d+) Do Q/g;
    while ((t = rxI.exec(fluxo))) imagens.push({ nome: t[5], l: +t[1], a: +t[2], x: +t[3], y: +t[4] });
    return { obj: o, fluxo, texto: textos.join(' '), textos, imagens };
  });
  return { bruto, objs, paginas };
}

const TEORIA = [1, 2, 3].map(() => ({ img: img(), larguraPt: 612, alturaPt: 792 }));
function oitoItens() {
  // Quatro da lista A e quatro da lista B; o 7 (B-3) não tem solução na fonte;
  // o 6 (B-2) veio sem a caixa do rótulo.
  const A = [60, 140, 90, 220].map((h, i) => ({
    id: '9ano:sint-a:lista-a:ex:' + (i + 1), origem: 'Portal da OBMEP, Sintético A, exercício ' + (i + 1),
    enunciado: peca(h), solucao: peca(80 + 10 * i, [8, 2, 17, 12])
  }));
  const B = [120, 70, 50, 160].map((h, i) => ({
    id: '9ano:sint-b:lista-b:ex:' + (i + 1), origem: 'Portal da OBMEP, Sintético B, exercício ' + (i + 1),
    enunciado: peca(h, i === 1 ? null : undefined),
    solucao: i === 2 ? null : peca(100, [8, 2, 17, 12]), semSolucao: i === 2
  }));
  return A.concat(B);
}
const BASE = { titulo: 'Equações do Segundo Grau', subtitulo: 'Resultados Básicos', aluno: 'Aluno de Teste',
  data: '21/09/2026', incluirTeoria: true, incluirLista: true, incluirGabarito: true, gabaritoSeparado: true,
  espacoParaResposta: 0, mostrarOrigem: false };

// ---------------------------------------------------------------- 1 a 3
secao('1. oito exercícios de duas listas e três páginas de teoria');
const r = PDFGen.gerarMaterialBiblioteca(Object.assign({}, BASE, { teoria: TEORIA, itens: oitoItens() }));
const pdf = lerPdf(r.bytes);
const N = pdf.paginas.length;
/* 3 de teoria; lista em 2 (60+140+90+220 com as folgas cabem na primeira,
 * depois do título; o resto na segunda); gabarito em 2 (sete soluções de 80 a
 * 110 pt somam uns 780 pt com as folgas, mais que uma folha). Conferido na
 * folha rasterizada do CHECKLIST_b4.md. */
conf('páginas no arquivo', N, 7);
conf('lista em 2 páginas, gabarito em 2', r.paginas.lista.length + ',' + r.paginas.gabarito.length, '2,2');
conf('páginas que o compositor contou', r.total, N);
conf('teoria nas páginas 1 a 3', JSON.stringify(r.paginas.teoria), '[0,1,2]');
conf('moldura em toda página', pdf.paginas.every((p, i) => p.textos[p.textos.length - 1] === 'Página ' + (i + 1) + ' de ' + N), true);
conf('uma imagem por página de teoria', pdf.paginas.slice(0, 3).map(p => p.imagens.length).join(','), '1,1,1');

secao('2. lista renumerada');
const lista = r.paginas.lista.map(i => pdf.paginas[i].texto).join(' ');
const numeros = (lista.match(/Exercício \d+\./g) || []).join(' ');
conf('Exercício 1. a 8., em ordem', numeros, [1, 2, 3, 4, 5, 6, 7, 8].map(n => 'Exercício ' + n + '.').join(' '));
conf('exatamente 8 rótulos novos na lista', (lista.match(/Exercício \d+\./g) || []).length, 8);

secao('3. gabarito');
const primeiraGab = r.paginas.gabarito[0];
conf('gabarito começa depois da última página da lista', primeiraGab > Math.max.apply(null, r.paginas.lista), true);
conf('gabarito abre a folha com o título', pdf.paginas[primeiraGab].texto.indexOf('Gabarito') >= 0 &&
  pdf.paginas[primeiraGab].texto.indexOf('Exercício') < 0, true);
const gab = r.paginas.gabarito.map(i => pdf.paginas[i].textos).reduce((a, b) => a.concat(b), []);
const numerosGab = gab.filter(t => /^\d+\.$/.test(t)).join(' ');
conf('soluções 1. a 8., em ordem', numerosGab, '1. 2. 3. 4. 5. 6. 7. 8.');
conf('"Sem solução na fonte." uma vez', gab.filter(t => t === 'Sem solução na fonte.').length, 1);
conf('e logo depois do 7.', gab[gab.indexOf('Sem solução na fonte.') - 1], '7.');
conf('7 imagens de solução no gabarito', r.paginas.gabarito.reduce((s, i) => s + pdf.paginas[i].imagens.length, 0), 7);

// ---------------------------------------------------------------- 4
secao('4. par envenenado: solução faltando sem a marca de "sem solução"');
const envenenado = oitoItens();
envenenado[1].solucao = null;          // o asset da solução do 2 não abriu
let erro = null;
try { PDFGen.gerarMaterialBiblioteca(Object.assign({}, BASE, { teoria: TEORIA, itens: envenenado })); } catch (e) { erro = e; }
conf('a folha não sai', !!erro, true);
conf('a mensagem diz qual exercício', erro ? /exercício 2 não chegou/.test(erro.message) : false, true);

// ---------------------------------------------------------------- 5
secao('5. gabarito junto, sem folha separada');
const junto = PDFGen.gerarMaterialBiblioteca(Object.assign({}, BASE, { incluirTeoria: false, gabaritoSeparado: false,
  itens: oitoItens().slice(0, 2) }));
conf('lista e gabarito na mesma página', JSON.stringify(junto.paginas.lista) + JSON.stringify(junto.paginas.gabarito), '[0][0]');

// ---------------------------------------------------------------- 6
secao('6. marca por cima e regressão dos outros documentos');
const gs = Object.keys(pdf.objs).find(k => pdf.objs[k] === '<< /Type /ExtGState /BM /Multiply >>');
conf('um estado gráfico de multiplicação no arquivo', !!gs, true);
const deTeoria = pdf.paginas.filter((p, i) => r.paginas.teoria.indexOf(i) >= 0);
const deLista = pdf.paginas.filter((p, i) => r.paginas.teoria.indexOf(i) < 0);
conf('lista e gabarito: marca por cima em toda página', deLista.every(p => p.obj.indexOf('/ExtGState << /GSm ' + gs + ' 0 R >>') >= 0 &&
  /q \/GSm gs[\s\S]*NW[\s\S]*Q/.test(p.fluxo)), true);
conf('páginas de lista e gabarito com imagem', deLista.filter(p => p.imagens.length).length, deLista.length);
conf('a marca vem depois da última imagem (por cima)', deLista.every(p =>
  p.fluxo.indexOf('q /GSm gs') > p.fluxo.lastIndexOf(' Do Q')), true);
// teoria: a página da fonte já traz a marca dela; só o selo pequeno no rodapé
conf('teoria: sem a marca grande e sem multiplicação', deTeoria.every(p => p.obj.indexOf('/ExtGState') < 0 &&
  p.fluxo.indexOf('/GSm') < 0 && !/ 82 Tf/.test(p.fluxo)), true);
conf('teoria: o selo NW no rodapé, depois da imagem', deTeoria.every(p => {
  const m = p.fluxo.match(/\/F2 8 Tf ([\d.]+) ([\d.]+) Td \(NW\) Tj/);
  return !!m && +m[2] < 45 && p.fluxo.indexOf('(NW) Tj') > p.fluxo.lastIndexOf(' Do Q');
}), true);

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'bib_compor_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });
let antigo = null;
try {
  /* O pdf.js de main com as figuras de main ao lado, que é de onde ele as
   * carrega (require relativo): sem elas, o tema com figura sairia diferente
   * por falta do módulo, e não por causa do remendo. */
  const RAIZ = path.join(__dirname, '..');
  const deMain = execSync('git ls-tree -r --name-only origin/main pdf.js figuras', { cwd: RAIZ, encoding: 'utf8' })
    .split(/\r?\n/).filter(Boolean);
  deMain.forEach(f => {
    fs.mkdirSync(path.join(TMP, path.dirname(f)), { recursive: true });
    fs.writeFileSync(path.join(TMP, f), execSync('git show "origin/main:' + f + '"', { cwd: RAIZ, maxBuffer: 1 << 26 }));
  });
  antigo = require(path.join(TMP, 'pdf.js'));
} catch (e) { /* sem git: conta como falha abaixo */ }
conf('pdf.js de main carregado para comparar', !!antigo, true);
if (antigo) {
  const igual = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)) === 0;
  // página crua com marca no fundo
  const cru = G => { const d = new G.Doc(); d.novaPagina(); d.texto('Folha comum', 40, 700); return d.finalizar(); };
  conf('página crua (marca no fundo) byte a byte igual', igual(cru(PDFGen), cru(antigo)), true);
  const banco = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'temas', 'banco.json'), 'utf8'));
  ['MAT06-05', 'MAT09-06', 'MATEM3-12'].forEach(id => {
    const tema = banco.temas.find(t => t.id === id);
    if (!tema) { conf('tema ' + id + ' no banco', false, true); return; }
    const op = { tema, lingua: 'pt', incluirMaterial: true, incluirLista: true, incluirGabarito: true, aluno: 'A', data: '01/09/2026' };
    conf('material do tema ' + id + ' byte a byte igual', igual(PDFGen.gerarMaterialTema(op), antigo.gerarMaterialTema(op)), true);
  });
  const al = { id: 'a1', nome: 'Aluno Teste', responsavel: 'Resp', ativo: true,
    precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 130 }] };
  const db = { alunos: [al], series: [], aulas: [], resumos: [] };
  [2, 9, 16, 23].forEach(d => db.aulas.push({ id: 'x' + d, alunoId: 'a1', data: '2026-06-' + String(d).padStart(2, '0'),
    hora: '15:30', duracaoMin: 90, status: 'realizada', cobravel: true, anexos: [], areas: ['metodo'],
    temas: [{ id: 'MAT08-03', titulo: 'Equações do primeiro grau', lingua: 'pt', partes: ['lista'], exercicios: 6 }] }));
  const f = Core.calcularFechamento(db, 'a1', '2026-06');
  conf('fechamento do mês byte a byte igual', igual(PDFGen.gerarFechamento(f, { sempreResumo: true }),
    antigo.gerarFechamento(f, { sempreResumo: true })), true);
  const mes = Core.calcularMesInteiro(db, '2026-06');
  conf('resumo do mês byte a byte igual', igual(PDFGen.gerarResumoMes(mes, 'Junho de 2026'),
    antigo.gerarResumoMes(mes, 'Junho de 2026')), true);
}

// ---------------------------------------------------------------- 7
secao('7. recorte mais alto que a folha');
const alto = PDFGen.gerarMaterialBiblioteca(Object.assign({}, BASE, { incluirTeoria: false, incluirGabarito: false,
  itens: [
    { id: 'x:1', enunciado: empilhada([420, 380]), solucao: peca(50) },  // 806 pt em dois pedaços
    { id: 'x:2', enunciado: peca(900), solucao: peca(50) }                // um pedaço só, maior que a folha
  ] }));
const pa = lerPdf(alto.bytes);
const onde = nome => pa.paginas.findIndex(p => p.imagens.some(i => i.nome === nome));
conf('pedaço 1 e pedaço 2 do exercício 1 em páginas diferentes', onde('Im1') >= 0 && onde('Im2') === onde('Im1') + 1, true);
const im1 = pa.paginas[onde('Im1')].imagens.find(i => i.nome === 'Im1');
const im2 = pa.paginas[onde('Im2')].imagens.find(i => i.nome === 'Im2');
conf('pedaços na escala 1 (sem redução)', im1.a.toFixed(0) + ',' + im2.a.toFixed(0), '420,380');
conf('o pedaço 2 abre a página nova logo abaixo do aviso de continuação', (im2.y + im2.a) > PDFGen.Y_TOPO - 24, true);
conf('a página nova diz "Exercício 1. (continuação)"', pa.paginas[onde('Im2')].textos.indexOf('Exercício 1. (continuação)') >= 0, true);
conf('exercício 2 reduzido e listado (na lista)', JSON.stringify(alto.reduzidos), '{"lista":[2],"gabarito":[]}');
const im3 = pa.paginas[onde('Im3')].imagens.find(i => i.nome === 'Im3');
conf('exercício 2 inteiro dentro da área útil', im3.y >= PDFGen.Y_LIMITE - 0.01 && im3.y + im3.a <= PDFGen.Y_TOPO + 0.01, true);
conf('proporção do exercício 2 mantida', Math.abs(im3.l / im3.a - 260 / 900) < 0.001, true);

// ---------------------------------------------------------------- 9 a 12
secao('9. lista sem gabarito: as soluções nem são pedidas');
let semGab = null, erroSemGab = null;
try {
  semGab = PDFGen.gerarMaterialBiblioteca(Object.assign({}, BASE, { incluirTeoria: false, incluirGabarito: false,
    itens: oitoItens().map(it => Object.assign({}, it, { solucao: null, semSolucao: false })) }));
} catch (e) { erroSemGab = e; }
conf('a folha sai', erroSemGab ? erroSemGab.message : 'saiu', 'saiu');
conf('e não tem gabarito', semGab ? semGab.paginas.gabarito.length : -1, 0);

secao('10. espaço para resposta e origem num recorte alto');
const cauda = PDFGen.gerarMaterialBiblioteca(Object.assign({}, BASE, { incluirTeoria: false, incluirGabarito: false,
  espacoParaResposta: 60, mostrarOrigem: true, itens: [
    { id: 'x:1', origem: 'Portal da OBMEP, teste, exercício 1', enunciado: peca(650), solucao: peca(50) },
    { id: 'x:2', origem: 'Portal da OBMEP, teste, exercício 2', enunciado: empilhada([400, 380]), solucao: peca(50) }
  ] }));
const pc = lerPdf(cauda.bytes);
const imgsC = pc.paginas.map(p => p.imagens).reduce((a, b) => a.concat(b), []);
const fundoDaImagem = nome => imgsC.find(i => i.nome === nome).y;
// a origem sai 9 pt abaixo da imagem, e o espaço de 60 pt vem depois dela
conf('recorte de 650 pt: origem e espaço acima do limite', fundoDaImagem('Im1') - 9 - 60 >= PDFGen.Y_LIMITE - 0.01, true);
conf('recorte em pedaços: o último leva origem e espaço junto', fundoDaImagem('Im3') - 9 - 60 >= PDFGen.Y_LIMITE - 0.01, true);
const origens = pc.paginas.map(p => p.textos.filter(t => /^Portal da OBMEP, teste/.test(t)).length).reduce((a, b) => a + b, 0);
conf('as duas origens impressas', origens, 2);

secao('11. recorte reduzido logo abaixo do título fica na página do título');
const titulo = PDFGen.gerarMaterialBiblioteca(Object.assign({}, BASE, { incluirTeoria: false, incluirGabarito: false,
  itens: [{ id: 'x:1', enunciado: peca(900), solucao: peca(50) }] }));
const pt = lerPdf(titulo.bytes);
conf('uma página só, com o título e o recorte', pt.paginas.length + ',' + pt.paginas[0].imagens.length, '1,1');
conf('o recorte cabe acima do limite', pt.paginas[0].imagens[0].y >= PDFGen.Y_LIMITE - 0.01, true);
// e o que cabe numa folha nova NÃO encolhe para caber na do título
const cabe = PDFGen.gerarMaterialBiblioteca(Object.assign({}, BASE, { incluirTeoria: false, incluirGabarito: false,
  itens: [{ id: 'x:1', enunciado: peca(660), solucao: peca(50) }] }));
const pcb = lerPdf(cabe.bytes);
conf('recorte de 660 pt: vai inteiro para a folha seguinte, sem redução', JSON.stringify(cabe.reduzidos.lista) + ',' +
  pcb.paginas.length + ',' + pcb.paginas[1].imagens[0].a.toFixed(0), '[],2,660');

secao('12. rótulo em caixa estreita: número numa linha própria');
const estreita = PDFGen.gerarMaterialBiblioteca(Object.assign({}, BASE, { incluirTeoria: false, incluirGabarito: false,
  itens: [{ id: 'x:1', enunciado: peca(100, [4, 2, 14, 12]), solucao: peca(50) }] }));
const pe = lerPdf(estreita.bytes);
const mTd = pe.paginas[0].fluxo.match(/\/F2 ([\d.]+) Tf ([\d.]+) ([\d.]+) Td \(Exerc\S* 1\.\) Tj/);
conf('"Exercício 1." em corpo legível, na margem', mTd ? (+mTd[1] >= 7) + ',' + mTd[2] : 'não achei', 'true,40.00');
const imE = pe.paginas[0].imagens[0];
conf('e acima do recorte', mTd ? +mTd[3] > imE.y + imE.a : false, true);

// ---------------------------------------------------------------- 8
secao('8. texto sem travessão nem meia-risca');
const tudo = pdf.paginas.map(p => p.texto).join(' ') + pa.paginas.map(p => p.texto).join(' ');
conf('nenhum travessão ou meia-risca', /[–—\x96\x97]/.test(tudo), false);

console.log('\n' + '='.repeat(60));
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
