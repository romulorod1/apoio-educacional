/* figuras/_piloto_MATEM3-12.js
 * Gera os documentos do MATEM3-12, "Revisao: geometria plana e espacial", pelo
 * caminho de verdade: o gerarMaterialTema do pdf.js, lendo o tema do
 * temas/banco.json, que e o mesmo arquivo que o tablet consome. Copia a forma
 * do _piloto_MATEM3-04.js e troca tres blocos: os numeros editoriais deste
 * tema, a medicao no fluxo que solidos e circulos pedem (os modelos sao a
 * _prova_receitas_solidos.js e a _prova_receitas_circulo.js) e as travas de
 * leitura da folha reescritas para o texto deste tema.
 *
 * Uso: node _piloto_MATEM3-12.js [caminho de outro banco.json ou do retrato]
 *   O segundo argumento aceita o banco inteiro ({"temas": [...]}) ou o objeto
 *   de um tema so, do jeito que o gerar_banco.ler devolve. O retrato de um tema
 *   (figuras/_tema_MATEM3-12.json, gitignored) prova uma edicao do .md sem
 *   regravar o temas/banco.json enquanto outro autor escreve outro tema.
 *
 * Sai em quatro arquivos, tres em portugues e um em ingles:
 *   _exemplo_MATEM3-12_material.pdf   explicacao, lista e gabarito
 *   _exemplo_MATEM3-12_lista.pdf      so a lista, com espaco para responder
 *   _exemplo_MATEM3-12_gabarito.pdf   so o gabarito (a camada pelo id, sozinha)
 *   _exemplo_MATEM3-12_en.pdf         a folha inglesa inteira
 *
 * Regra da casa: nunca usar travessao.
 */
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');

const ID = 'MATEM3-12';
const RAIZ = path.join(__dirname, '..');
const PADRAO = path.join(RAIZ, 'temas', 'banco.json');
const BANCO = process.argv[2] || PADRAO;
const FONTE = path.join(RAIZ, 'temas', 'mat', 'em3', ID + '.md');
const lido = JSON.parse(fs.readFileSync(BANCO, 'utf8'));
const tema = Array.isArray(lido.temas)
  ? lido.temas.find(function (t) { return t.id === ID; })
  : (lido && lido.id === ID ? lido : null);
if (!tema) throw new Error(ID + ' nao esta em ' + BANCO + ': rode gerar_banco.py antes');

console.log('tema: ' + tema.pt.titulo + '  |  ' + tema.pt.exercicios.length + ' exercicios  |  banco: ' + BANCO);

/* ================================================================ os documentos */

function gerar(nome, op) {
  const bytes = PDFGen.gerarMaterialTema(Object.assign({ tema: tema }, op));
  const saida = path.join(__dirname, nome);
  fs.writeFileSync(saida, bytes);
  console.log('  ' + nome + ': ' + Math.round(bytes.length / 1024) + ' KB');
  return bytes;
}

const material = gerar('_exemplo_' + ID + '_material.pdf', {
  lingua: 'pt', incluirMaterial: true, incluirLista: true, incluirGabarito: true,
  aluno: 'Nathália', data: '07/09/2026'
});
const lista = gerar('_exemplo_' + ID + '_lista.pdf', {
  lingua: 'pt', incluirLista: true, aluno: 'Nathália', espacoParaResposta: 26
});
const gabarito = gerar('_exemplo_' + ID + '_gabarito.pdf', {
  lingua: 'pt', incluirGabarito: true
});
const ingles = gerar('_exemplo_' + ID + '_en.pdf', {
  lingua: 'en', incluirMaterial: true, incluirLista: true, incluirGabarito: true
});

/* ================================================================ conferencias */

let ok = 0, mau = 0;
function conf(rotulo, obtido, esperado) {
  const bom = String(obtido) === String(esperado);
  if (bom) ok++; else mau++;
  console.log((bom ? '  OK    ' : '  FALHA ') + rotulo +
    (bom ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function medido(t) { console.log('        ' + t); }
const n2 = (v) => (Math.round(v * 100) / 100).toFixed(2);
const n4 = (v) => (Math.round(v * 10000) / 10000).toFixed(4);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

console.log('\nconferencias');

/* 0. O banco tem que ser o do .md de hoje.
 * Vale para o banco padrao e para o retrato deste tema, que nasce do mesmo .md:
 * quem passa OUTRO banco (a main, por exemplo) esta comparando de proposito. */
const ehRetratoDesteTema = new RegExp('_tema_' + ID + '\\.json$').test(BANCO);
if (fs.existsSync(FONTE) && (BANCO === PADRAO || ehRetratoDesteTema)) {
  const noMd = (fs.readFileSync(FONTE, 'utf8').match(/(^|\s)@fig\s/g) || []).length;
  let noBanco = 0;
  ['pt', 'en'].forEach(function (lingua) {
    const d = tema[lingua] || {};
    const textos = [d.explicacao || ''];
    (d.exercicios || []).forEach(function (e) { textos.push(e.enunciado || '', e.resposta || ''); });
    textos.forEach(function (s) { noBanco += (s.match(/(^|\s)@fig\s/g) || []).length; });
  });
  conf('o banco lido foi gerado do ' + ID + '.md de hoje (' + noMd + ' diretivas no .md)',
    noBanco === noMd ? 'sim' : 'NAO: o banco tem ' + noBanco + ' diretivas, regere o retrato ou rode gerar_banco.py', 'sim');
}

[['material', material], ['lista', lista], ['gabarito', gabarito], ['ingles', ingles]]
  .forEach(function (par) {
    const cru = Buffer.from(par[1]).toString('latin1');
    conf('nenhuma diretiva saiu impressa no ' + par[0], /@fig/.test(cru), false);
  });

const NAO_TRADUZ = ['Nathália Wajsenzon', 'APOIO EDUCACIONAL',
  'Nathália Wajsenzon · Apoio Educacional', 'NW'];
/* As palavras deste tema que so existem em portugues, inclusive as que a
 * figura imprime pelo parametro (os nomes do painel e a glosa da hachura). */
const MARCA_PT = /ção|ções|ângul|Página|Aluno|Gabarito|Exercícios|\bprisma\b|cilindro|pirâmide|esfera|geratriz|apótema|hachurad|região|setor |graus|ê|õ|ç|ã/;

function pecasDeTexto(bytes) {
  const cru = Buffer.from(bytes).toString('latin1');
  const rx = /Td \(((?:[^()\\]|\\.)*)\) Tj/g;
  let m, o = [];
  while ((m = rx.exec(cru))) o.push(m[1]);
  return o;
}
const vazou = pecasDeTexto(ingles)
  .filter(function (t) { return NAO_TRADUZ.indexOf(t) < 0 && MARCA_PT.test(t); });
conf('nenhuma palavra portuguesa na folha em ingles',
  [...new Set(vazou)].join(', ') || 'nenhuma', 'nenhuma');
const achouNoPt = pecasDeTexto(material)
  .filter(function (t) { return NAO_TRADUZ.indexOf(t) < 0 && MARCA_PT.test(t); });
conf('e o mesmo padrao acha portugues na folha em portugues', achouNoPt.length >= 10, true);

function comDoc(lingua, op) {
  const doc = new PDFGen.Doc();
  doc.lingua = lingua;
  const dados = tema[lingua];
  doc.novaPagina();
  doc.registrarFiguras(dados.explicacao);
  dados.exercicios.forEach(function (ex) { doc.registrarFiguras(ex.enunciado); });
  if (op.material) doc.markdown(dados.explicacao, { tam: 10 });
  dados.exercicios.forEach(function (ex) {
    const partes = doc.partesDeFigura(op.gabarito ? ex.resposta : ex.enunciado);
    partes.forEach(function (p) {
      if (p.tipo === 'figura') doc.figura(p.diretiva, { x: PDFGen.MARG_E + 20, largura: PDFGen.MARG_D - PDFGen.MARG_E - 20 });
    });
  });
  return doc;
}

const docPT = comDoc('pt', { material: true });
const docGab = comDoc('pt', { gabarito: true });
const docEN = comDoc('en', { material: true });
const docGabEN = comDoc('en', { gabarito: true });
const figs = (docPT.figurasDesenhadas || []).concat(docGab.figurasDesenhadas || []);

function receitasDe(texto) {
  const nomes = [];
  new PDFGen.Doc().partesDeFigura(texto).forEach(function (p) {
    if (p.tipo === 'figura') nomes.push(p.diretiva.receita || ('id:' + p.diretiva.id));
  });
  return nomes.join(' ');
}

/* Escolha editorial escrita: 5 na explicacao, 7 nos 18 enunciados, 3 no
 * gabarito. O tema chegou sem UMA figura, num assunto em que o livro didatico
 * desenha em toda pagina, e a regua e essa: o que um bom livro do 3o ano traria
 * naquele ponto.
 *
 * Na explicacao, as cinco figuras sao as cinco frases que descreviam um
 * desenho em palavras: o hexagono "formado por seis triangulos equilateros"
 * (agora decomposto, com L no lado e L no raio, que e o argumento de o
 * triangulo ser equilatero); o setor "de angulo central alfa" (a fracao
 * alfa/360, com o arco destacado); os cinco solidos, lado a lado e com nome,
 * antes das formulas de cada um; a piramide com o triangulo interno, que e o
 * m2 = h2 + a2 que o texto so contava; e o cone com o triangulo interno, que e
 * o g2 = r2 + h2. O circulo sozinho com r e O ficou de fora: o setor ja traz
 * r e O, e uma segunda circunferencia na mesma pagina so repetiria.
 *
 * Nos enunciados, figura onde a configuracao nao cabe numa oracao: 8 e 9
 * (o triangulo interno, com m e g no lugar exato), 14 (o quadrado com os dois
 * circulos e a regiao hachurada, que o texto descrevia em tres oracoes), 15
 * (prisma de base triangular), 16 (o setor de 30 graus hachurado), 17 (o
 * semicirculo que vira cone, a figura mais necessaria do tema) e 18 (a esfera
 * inscrita). Os numeros continuam no texto, e o texto remete ("da figura"),
 * que e a forma do MAT08-13 e a regra de que nenhum dado numerico existe so
 * no desenho. O 12 (hexagono de lado 4) ficou SEM figura de proposito: a
 * figura da explicacao ja mostra a decomposicao em letras, dar de novo com o
 * 4 entrega o argumento que o exercicio existe para cobrar, e o enunciado e
 * uma oracao so. Onze exercicios ficam sem figura nenhuma, acima do terco.
 *
 * No gabarito, a figura volta so onde a resposta E uma construcao lida no
 * desenho: 8 (m = 5, com o a que o texto diz valer 3), 17 (g = 10, a geratriz
 * que e o raio do semicirculo, que o texto de antes nao dizia) e 18 (h = 6,
 * a altura que e o diametro da esfera). O 9 e conta pura sobre o triangulo
 * que o enunciado ja mostra, e fica em texto. */
const diretivasExplic = receitasDe(tema.pt.explicacao).split(' ').filter(function (s) { return s; }).length;
conf('a explicacao tem 5 figuras', diretivasExplic, 5);
const COM_FIGURA = '8 9 14 15 16 17 18';
conf('os enunciados 8, 9, 14, 15, 16, 17 e 18 carregam figura, e so eles',
  tema.pt.exercicios.filter(function (e) { return receitasDe(e.enunciado); }).map(function (e) { return e.n; }).join(' '), COM_FIGURA);
conf('o material desenha 16 registros: 4 figuras mais as 5 celulas do painel na explicacao, e 7 nos enunciados',
  (docPT.figurasDesenhadas || []).length, 16);
conf('e o gabarito tem 3 (8, 17 e 18)', (docGab.figurasDesenhadas || []).length, 3);
conf('as tres do gabarito sao as dos ids s8, s17 e s18',
  (docGab.figurasDesenhadas || []).map(function (f) { return f.id; }).join(' '), 's8 s17 s18');
conf('nenhuma figura falhou', figs.filter(function (f) { return f.erro; }).length, 0);
conf('nenhum aviso de figura no material', (docPT.avisosFigura || []).length, 0);
conf('nenhum aviso de figura no gabarito', (docGab.avisosFigura || []).length, 0);
conf('nenhum aviso de figura na folha em ingles', (docEN.avisosFigura || []).length + (docGabEN.avisosFigura || []).length, 0);
conf('nenhuma figura com falha de conferencia',
  figs.filter(function (f) { return (f.conferencia || []).length; }).map(function (f) { return (f.id || f.receita) + ': ' + f.conferencia.join(' ; '); }).join(' | ') || 'nenhuma', 'nenhuma');

let acimaDoTeto = [];
figs.forEach(function (f) {
  if (f.marcasAtivas > 5) acimaDoTeto.push((f.id || f.receita || '?') + ':' + f.marcasAtivas);
});
conf('nenhuma figura passa do teto de cinco marcas ativas', acimaDoTeto.join(', ') || 'nenhuma', 'nenhuma');
console.log('  marcas ativas por figura: ' +
  figs.map(function (f) { return (f.id || f.receita) + ':' + f.marcasAtivas; }).join(' '));

/* Nenhuma figura deste tema e chute: as numericas saem fieis por construcao e
 * as de letra sao prototipos ou se deduzem (inscrito=10 raio=r). Entao nenhuma
 * pode sair MARCADA fora de escala, que e a afirmacao falsa sobre um desenho
 * exato; e a falta do aviso numa figura chutada ja sairia como aviso acima. */
conf('nenhuma figura marcada fora de escala: todas saem exatas',
  figs.filter(function (f) { return f.foraDeEscala; }).map(function (f) { return f.id || f.receita; }).join(', ') || 'nenhuma', 'nenhuma');

let pareado = true;
tema.pt.exercicios.forEach(function (ex, i) {
  const en = tema.en.exercicios[i];
  if (receitasDe(ex.enunciado) !== receitasDe(en.enunciado)) pareado = false;
  if (receitasDe(ex.resposta) !== receitasDe(en.resposta)) pareado = false;
});
conf('as duas linguas usam as mesmas receitas na mesma ordem, item a item', pareado, true);
conf('a explicacao tambem', receitasDe(tema.pt.explicacao), receitasDe(tema.en.explicacao));

[['material', docPT], ['gabarito', docGab], ['ingles', docEN]].forEach(function (par) {
  let desbalanceada = 0, tracejadoAberto = 0;
  (par[1].paginas || []).forEach(function (pag) {
    let nivel = 0, tracejado = false;
    (pag.ops || []).forEach(function (o) {
      const s = String(o);
      if (/(^|\s)q(\s|$)/.test(s)) nivel++;
      if (/(^|\s)Q(\s|$)/.test(s)) { nivel--; if (nivel === 0) { tracejado = false; } }
      if (/\[[\d\s.]+\]\s+\d+(\.\d+)?\s+d/.test(s)) tracejado = true;
      if (nivel === 0 && tracejado) tracejadoAberto++;
    });
    if (nivel !== 0) desbalanceada++;
  });
  conf('todo q tem o seu Q no ' + par[0], desbalanceada, 0);
  conf('nenhum tracejado ligado fora de envelope no ' + par[0], tracejadoAberto, 0);
});

const comFigura = tema.pt.exercicios.filter(function (e) { return receitasDe(e.enunciado); }).length;
const semNada = tema.pt.exercicios.filter(function (e) {
  return !receitasDe(e.enunciado) && !receitasDe(e.resposta);
}).length;
console.log('\neditorial: ' + comFigura + ' de ' + tema.pt.exercicios.length +
  ' enunciados com figura, ' + semNada + ' exercicios sem figura nenhuma');
conf('pelo menos um terco dos exercicios sem figura nenhuma',
  semNada >= Math.ceil(tema.pt.exercicios.length / 3), true);

/* ================================================================ medicao no fluxo
 * O que a folha AFIRMA com o desenho, medido no que vai sair impresso, e nao no
 * que a receita disse que ia desenhar. Os leitores sao os das duas folhas de
 * prova: o de caminhos da _prova_receitas_circulo.js (toda circunferencia sai
 * redonda) e os pontos-chave que o solidos.js devolve "para a receita cotar em
 * cima" (_prova_receitas_solidos.js). */
function lerCaminhos(ops) {
  const toks = [];
  for (const s of ops) {
    if (String(s).indexOf('BT ') === 0) continue;
    for (const t of String(s).split(/\s+/)) if (t) toks.push(t);
  }
  const subs = [];
  let atual = null, pilha = [], w = 1;
  const num = (k) => { const v = pilha[pilha.length - k]; return v === undefined ? 0 : v; };
  for (const t of toks) {
    const v = parseFloat(t);
    if (!isNaN(v) && /^[-+]?[\d.]+$/.test(t)) { pilha.push(v); continue; }
    switch (t) {
      case 'w': w = num(1); break;
      case 'm': atual = { pts: [{ x: num(2), y: num(1) }], trechos: [], w: w, fechado: false }; subs.push(atual); break;
      case 'l': if (atual) { const a = atual.pts[atual.pts.length - 1], b = { x: num(2), y: num(1) }; atual.trechos.push({ p0: a, c1: a, c2: b, p3: b, reta: true }); atual.pts.push(b); } break;
      case 'c': if (atual) { const a = atual.pts[atual.pts.length - 1]; const p3 = { x: num(2), y: num(1) }; atual.trechos.push({ p0: a, c1: { x: num(6), y: num(5) }, c2: { x: num(4), y: num(3) }, p3: p3, reta: false }); atual.pts.push(p3); } break;
      case 'h': if (atual) atual.fechado = true; break;
      case 'S': case 'B': case 'B*': if (atual) { atual.pintado = 'traco'; atual.w = w; } atual = null; break;
      case 'f': case 'f*': if (atual) atual.pintado = 'area'; atual = null; break;
      case 'n': if (atual) atual.pintado = 'recorte'; atual = null; break;
      default: break;
    }
    pilha = [];
  }
  return subs;
}
function emBezier(tr, t) {
  const s = 1 - t, a = s * s * s, b = 3 * s * s * t, c = 3 * s * t * t, d = t * t * t;
  return { x: a * tr.p0.x + b * tr.c1.x + c * tr.c2.x + d * tr.p3.x, y: a * tr.p0.y + b * tr.c1.y + c * tr.c2.y + d * tr.p3.y };
}
function pontosDoSub(sub, n) { const o = []; for (const tr of sub.trechos) for (let i = 0; i <= n; i++) o.push(emBezier(tr, i / n)); return o; }
function caixaDe(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
  return { x0, y0, x1, y1, largura: x1 - x0, altura: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
function voltasInteiras(subs) {
  return subs.filter((s) => s.pintado === 'traco' && s.trechos.length === 4 && s.trechos.every((t) => !t.reta) &&
    caixaDe(pontosDoSub(s, 8)).largura >= 20);
}
function textos(f) { return ((f && f.medido && f.medido.textos) || []).map((t) => t.txt); }
function tem(f, txt) { return textos(f).filter((t) => t === txt).length; }
function quadradinhos(f) { return (f.marcas || []).filter((k) => k && k.tipo === 'anguloReto'); }
function triangulos(f) { return ((f.medido || {}).areas || []).filter((a) => a.pts.length === 3); }
/* Do triangulo interno preenchido: o cateto horizontal (raio ou apotema da
 * base) sobre o vertical (altura), lidos nos pontos da area impressa. */
function catetosDoTriangulo(f) {
  const t = triangulos(f)[0];
  if (!t) return null;
  const P = t.pts;
  let horizontal = 0, vertical = 0;
  for (let i = 0; i < 3; i++) {
    const a = P[i], b = P[(i + 1) % 3];
    if (Math.abs(a.y - b.y) < 0.05) horizontal = Math.abs(a.x - b.x);
    if (Math.abs(a.x - b.x) < 0.05) vertical = Math.abs(a.y - b.y);
  }
  return { horizontal: horizontal, vertical: vertical };
}
function rascunho(fig, registra) {
  const d = new PDFGen.Doc(); d.novaPagina();
  if (registra) d.registrarFiguras(registra);
  d.partesDeFigura(fig).forEach(function (p) {
    if (p.tipo === 'figura') d.figura(p.diretiva, { x: PDFGen.MARG_E + 20, largura: PDFGen.MARG_D - PDFGen.MARG_E - 20 });
  });
  return { figs: d.figurasDesenhadas || [], avisos: d.avisosFigura || [] };
}

const porId = {}, gabPorId = {};
(docPT.figurasDesenhadas || []).forEach(function (f) { if (f.id) porId[f.id] = f; });
(docGab.figurasDesenhadas || []).forEach(function (f) { if (f.id) gabPorId[f.id] = f; });
const daExplicacao = (docPT.figurasDesenhadas || []).filter(function (f) { return !f.id; });
function explic(receita, trecho) {
  return daExplicacao.filter(function (f) { return f.receita === receita && (!trecho || String(f.diretiva).indexOf(trecho) >= 0); });
}

console.log('\nmedicao no fluxo');

console.log('\ntoda circunferencia sai redonda');
{
  let piorAniso = 0, piorRadial = 0, quantas = 0;
  [docPT, docGab].forEach(function (d) {
    (d.paginas || []).forEach(function (pag) {
      voltasInteiras(lerCaminhos(pag.ops || [])).forEach(function (v) {
        const pts = pontosDoSub(v, 24), c = caixaDe(pts);
        const r = (c.largura + c.altura) / 4;
        let radial = 0;
        for (const p of pts) radial = Math.max(radial, Math.abs(dist(p, { x: c.cx, y: c.cy }) - r));
        /* As elipses dos solidos em perspectiva nao sao circunferencias e
         * ficam de fora; quem e circulo de verdade tem desvio radial nulo. */
        if (radial > 1) return;
        quantas++;
        piorAniso = Math.max(piorAniso, Math.abs(c.largura - c.altura));
        piorRadial = Math.max(piorRadial, radial);
      });
    });
  });
  medido(quantas + ' circunferencias inteiras no material e no gabarito; pior anisotropia ' + n4(piorAniso) + ' pt, pior desvio radial ' + n4(piorRadial) + ' pt');
  conf('ha o que medir: ao menos 5 (o setor de alfa, as duas do 14, a do 16 e a esfera do 18)', quantas >= 5, true);
  conf('nenhuma anisotropia acima de 0,5 pt', piorAniso < 0.5, true);
  conf('e o desvio radial do Bezier fica abaixo de 0,05 pt', piorRadial < 0.05, true);
}

console.log('\nexplicacao: o hexagono e o setor');
{
  const h = explic('poligonoregular')[0];
  const lados = ((h && h.medido && h.medido.segmentos) || []).filter((s) => !s.varredura && Math.abs(s.w - 1.2) < 0.01);
  const comp = lados.map((s) => Math.hypot(s.x2 - s.x1, s.y2 - s.y1));
  let cx = 0, cy = 0;
  lados.forEach((s) => { cx += s.x1 + s.x2; cy += s.y1 + s.y2; });
  cx /= Math.max(1, 2 * lados.length); cy /= Math.max(1, 2 * lados.length);
  const raio = lados.length ? dist({ x: lados[0].x1, y: lados[0].y1 }, { x: cx, y: cy }) : 0;
  medido('hexagono: ' + lados.length + ' lados de contorno, comprimentos ' + comp.map(n2).join(' ') + ' pt; raio (centro a vertice) ' + n2(raio) + ' pt');
  conf('o hexagono tem seis lados iguais', lados.length === 6 && Math.max.apply(null, comp) - Math.min.apply(null, comp) < 0.02, true);
  conf('e cada lado mede o raio, que e o argumento de o triangulo ser equilatero', lados.length === 6 && Math.abs(comp[0] - raio) < 0.02, true);
  conf('L impresso duas vezes (no lado e no raio) e um triangulo chapado', tem(h, 'L') === 2 && triangulos(h).length === 1, true);
  /* Par envenenado da medida: no pentagono o lado NAO mede o raio, e a mesma
   * conta tem que dizer isso. */
  const p5 = rascunho('@fig poligonoregular lados=5 lado=L raio=L decomposto=sim').figs[0];
  const l5 = ((p5 && p5.medido && p5.medido.segmentos) || []).filter((s) => !s.varredura && Math.abs(s.w - 1.2) < 0.01);
  let c5x = 0, c5y = 0;
  l5.forEach((s) => { c5x += s.x1 + s.x2; c5y += s.y1 + s.y2; });
  c5x /= Math.max(1, 2 * l5.length); c5y /= Math.max(1, 2 * l5.length);
  const lado5 = l5.length ? Math.hypot(l5[0].x2 - l5[0].x1, l5[0].y2 - l5[0].y1) : 0;
  const raio5 = l5.length ? dist({ x: l5[0].x1, y: l5[0].y1 }, { x: c5x, y: c5y }) : 0;
  medido('par envenenado, pentagono: lado ' + n2(lado5) + ' pt contra raio ' + n2(raio5) + ' pt');
  conf('a mesma medida acusa o pentagono, em que lado e raio diferem', l5.length === 5 && Math.abs(lado5 - raio5) > 2, true);

  const s = explic('circulo')[0];
  const arcos = ((s && s.medido && s.medido.arcos) || []).map((a) => a.abertura);
  medido('setor de alfa: aberturas no fluxo ' + arcos.map((a) => a.toFixed(1)).join(', ') + '; textos ' + textos(s).join(' '));
  conf('o setor de alfa imprime alfa, r e O, e nada mais', textos(s).sort().join(' '), 'O r α');
  conf('e tem os dois arcos do angulo central (o destacado e o da marca)', arcos.filter((a) => a > 10 && a < 350).length >= 2, true);
  conf('o setor esta hachurado', ((s.medido || {}).varreduras || 0) > 0, true);
}

console.log('\nexplicacao: o painel e os dois triangulos internos');
{
  const celulas = explic('painelsolidos');
  const ks = celulas.map((c) => c.escala);
  medido('painel: ' + celulas.length + ' celulas, escala ' + ks.map((k) => k.toFixed(4)).join(' '));
  conf('cinco celulas na mesma escala', celulas.length === 5 && Math.max.apply(null, ks) - Math.min.apply(null, ks) < 1e-9, true);
  const nomesPT = [];
  celulas.forEach((c) => textos(c).forEach((t) => nomesPT.push(t)));
  conf('os cinco nomes em portugues vieram da diretiva', ['prisma', 'cilindro', 'pirâmide', 'cone', 'esfera'].every((n) => nomesPT.indexOf(n) >= 0), true);
  const celulasEN = (docEN.figurasDesenhadas || []).filter((f) => f.receita === 'painelsolidos');
  const nomesEN = [];
  celulasEN.forEach((c) => textos(c).forEach((t) => nomesEN.push(t)));
  conf('e os cinco em ingles tambem', ['prism', 'cylinder', 'pyramid', 'cone', 'sphere'].every((n) => nomesEN.indexOf(n) >= 0), true);
  conf('as celulas so escrevem r e h alem do nome', nomesPT.filter((t) => t === 'r' || t === 'h').length === 7 && nomesPT.length === 12, true);

  const pir = explic('solido', 'tipo=piramide')[0], cone = explic('solido', 'tipo=cone')[0];
  [['piramide', pir, 'a h m'], ['cone', cone, 'g h r']].forEach(function (par) {
    const f = par[1], q = quadradinhos(f)[0], O = f && f.saida ? f.saida.O : null;
    medido(par[0] + ' em letras: textos ' + textos(f).join(' ') + '; quadradinho ' + (q && O ? 'a ' + n2(dist(q, O)) + ' pt do pe, abertura ' + n2(q.abertura) : 'ausente'));
    conf(par[0] + ' em letras imprime exatamente ' + par[2], textos(f).sort().join(' '), par[2]);
    conf(par[0] + ': o quadradinho esta no pe da altura e mede 90 na folha', !!q && !!O && dist(q, O) < 0.01 && Math.abs(q.abertura - 90) < 0.01, true);
    conf(par[0] + ': o triangulo interno e a unica area preenchida', triangulos(f).length, 1);
  });
}

console.log('\nexercicio 9: o cone de 6 por 8');
{
  const f = porId.s9, c = catetosDoTriangulo(f), q = quadradinhos(f)[0];
  medido('cateto horizontal ' + n2(c.horizontal) + ' pt, vertical ' + n2(c.vertical) + ' pt, razao ' + n4(c.horizontal / c.vertical) + ' (pedido 6/8 = 0,7500); textos ' + textos(f).join(' '));
  conf('raio por altura na folha e 6/8', Math.abs(c.horizontal / c.vertical - 0.75) < 1e-3, true);
  conf('6 e 8 impressos, g em letra', tem(f, '6') === 1 && tem(f, '8') === 1 && tem(f, 'g') === 1, true);
  conf('quadradinho no pe da altura, reto na folha', !!q && dist(q, f.saida.O) < 0.01 && Math.abs(q.abertura - 90) < 0.01, true);
  /* Par envenenado da medida: o cone de 6 por 9 nao pode passar por 6 por 8. */
  const outro = catetosDoTriangulo(rascunho('@fig solido tipo=cone triangulo=sim raio=6 altura=9 geratriz=g').figs[0]);
  medido('par envenenado, cone 6 por 9: razao ' + n4(outro.horizontal / outro.vertical));
  conf('a mesma medida distingue o cone de 6 por 9', Math.abs(outro.horizontal / outro.vertical - 0.75) > 0.05, true);
}

console.log('\nexercicio 8: a piramide de 6 por 4 e o seu gabarito');
{
  const f = porId.s8, sd = f.saida, q = quadradinhos(f)[0], c = catetosDoTriangulo(f);
  medido('apotema da base ' + n2(dist(sd.O, sd.M)) + ' pt contra metade da aresta ' + n2(sd.piramide.aresta / 2) + ' pt; catetos ' + n2(c.horizontal) + ' por ' + n2(c.vertical) + ' (razao ' + n4(c.horizontal / c.vertical) + ', pedido 3/4); textos ' + textos(f).join(' '));
  conf('o apotema da base sai em verdadeira grandeza, metade da aresta', Math.abs(dist(sd.O, sd.M) - sd.piramide.aresta / 2) < 0.02, true);
  conf('quadradinho no pe da altura, reto na folha', !!q && dist(q, sd.O) < 0.01 && Math.abs(q.abertura - 90) < 0.01, true);
  conf('enunciado: 4 impresso, a e m em letra (a aresta 6 mora no texto)', textos(f).sort().join(' '), '4 a m');
  const g = gabPorId.s8;
  medido('gabarito: textos ' + textos(g).join(' | '));
  conf('gabarito: m = 5 resolvido no apotema da face', tem(g, 'm = 5'), 1);
  conf('gabarito: o a colado fica letra, e o 4 continua', tem(g, 'a') === 1 && tem(g, '4') === 1, true);
  conf('gabarito: mesma escala e mesma caixa do enunciado', Math.abs(g.escala - f.escala) < 1e-9 && g.caixa.altura === f.caixa.altura, true);
}

console.log('\nexercicio 14: o quadrado com os dois circulos');
{
  const f = porId.q14, k = f.escala;
  const voltas = ((f.medido || {}).arcos || []).filter((a) => a.abertura > 359).sort((a, b) => a.raio - b.raio);
  const lados = ((f.medido || {}).segmentos || []).filter((s) => !s.varredura && Math.abs(s.w - 1.2) < 0.01);
  const comp = lados.map((s) => Math.hypot(s.x2 - s.x1, s.y2 - s.y1));
  medido('circunferencias de raio ' + voltas.map((v) => n2(v.raio)).join(' e ') + ' pt (razao ' + (voltas.length === 2 ? n4(voltas[1].raio / voltas[0].raio) : '?') + '); quadrado com ' + lados.length + ' lados de ' + comp.map(n2).join(' ') + ' pt; 10 unidades = ' + n2(10 * k) + ' pt');
  conf('duas circunferencias, a circunscrita com raio raiz de 2 vezes a inscrita', voltas.length === 2 && Math.abs(voltas[1].raio / voltas[0].raio - Math.SQRT2) < 1e-3, true);
  conf('o quadrado tem quatro lados de 10 unidades', lados.length === 4 && comp.every((L) => Math.abs(L - 10 * k) < 0.05), true);
  conf('e a inscrita toca os lados: o raio dela e metade do lado', voltas.length === 2 && Math.abs(voltas[0].raio - 5 * k) < 0.05, true);
  conf('10 impresso, r e R em letra, quadradinho na tangencia', tem(f, '10') === 1 && tem(f, 'r') === 1 && tem(f, 'R') === 1 && quadradinhos(f).length === 1, true);
  conf('a regiao entre o quadrado e a inscrita esta hachurada', ((f.medido || {}).varreduras || 0) > 0, true);
}

console.log('\nexercicio 15: o prisma triangular de 6 por 10');
{
  const f = porId.s15, P = f.saida.prisma;
  const lado = dist(P.vertices.A, P.vertices.B), alt = dist(P.vertices.A, P.vertices.D);
  medido('lado ' + n2(lado) + ' pt, altura ' + n2(alt) + ' pt, razao ' + n4(lado / alt) + ' (pedido 0,6000)');
  conf('lado por altura na folha e 6/10', Math.abs(lado / alt - 0.6) < 1e-6, true);
  conf('duas cotas de seta, 6 e 10, e duas marcas', f.tracos.filter((t) => t.tipo === 'cota').length === 2 && tem(f, '6') === 1 && tem(f, '10') === 1 && f.marcasAtivas === 2, true);
}

console.log('\nexercicio 16: o setor de 30 graus');
{
  const f = porId.c16;
  const arcos = ((f.medido || {}).arcos || []).map((a) => a.abertura);
  medido('aberturas no fluxo: ' + arcos.map((a) => a.toFixed(2)).join(', ') + '; textos ' + textos(f).join(' '));
  conf('dois arcos de 30 graus (o destacado na circunferencia e o da marca)', arcos.filter((a) => Math.abs(a - 30) < 1).length >= 2, true);
  conf('12, 30 graus e O impressos', tem(f, '12') === 1 && tem(f, '30°') === 1 && tem(f, 'O') === 1, true);
  conf('o setor esta hachurado', ((f.medido || {}).varreduras || 0) > 0, true);
}

console.log('\nexercicio 17: o semicirculo que vira cone, e o seu gabarito');
{
  const f = porId.s17, sd = f.saida;
  medido('setor de raio ' + sd.geratriz + ' e 180 graus; cone montado com r ' + sd.raioCone + ' e h ' + n4(sd.alturaCone) + ' (5 raiz de 3 = ' + n4(5 * Math.sqrt(3)) + '); textos ' + textos(f).join(' '));
  conf('o cone montado tem raio 5 e altura 5 raiz de 3', sd.raioCone === 5 && Math.abs(sd.alturaCone - 5 * Math.sqrt(3)) < 1e-9, true);
  conf('enunciado: 10 no raio do setor, r, h e g em letra', textos(f).sort().join(' '), '10 g h r');
  const g = gabPorId.s17;
  medido('gabarito: textos ' + textos(g).join(' | '));
  conf('gabarito: g = 10 resolvido na geratriz', tem(g, 'g = 10'), 1);
  conf('gabarito: r e h colados ficam letra', tem(g, 'r') === 1 && tem(g, 'h') === 1, true);
  conf('gabarito: mesma escala e mesma caixa do enunciado', Math.abs(g.escala - f.escala) < 1e-9 && g.caixa.altura === f.caixa.altura, true);
}

console.log('\nexercicio 18: a esfera inscrita, e o seu gabarito');
{
  const f = porId.s18, sd = f.saida;
  const circ = ((f.medido || {}).arcos || []).filter((a) => a.abertura > 359 && Math.abs(a.raio - sd.raio) < 0.1);
  conf('a esfera esta no fluxo como uma circunferencia de raio 3k', circ.length, 1);
  if (circ.length) {
    const c = circ[0];
    const dFundo = Math.abs((c.cy - c.raio) - sd.cilindro.centroBase.y);
    const dTopo = Math.abs((c.cy + c.raio) - sd.cilindro.centroTopo.y);
    const dLat = Math.abs((c.cx + c.raio) - sd.cilindro.baseDir.x);
    medido('esfera: fundo a ' + n2(dFundo) + ' pt do centro da base, topo a ' + n2(dTopo) + ' pt do centro da tampa, lado a ' + n2(dLat) + ' pt da silhueta');
    conf('a esfera toca as duas bases e a lateral (teto 0,05 pt)', dFundo < 0.05 && dTopo < 0.05 && dLat < 0.05, true);
  }
  const cotas = f.tracos.filter((t) => t.tipo === 'cota');
  conf('a cota da altura mede o diametro da esfera', cotas.length === 1 && Math.abs(Math.abs(cotas[0].y2 - cotas[0].y1) - 2 * sd.raio) < 0.02, true);
  conf('enunciado: 3, h e O impressos', textos(f).sort().join(' '), '3 O h');
  const g = gabPorId.s18;
  medido('gabarito: textos ' + textos(g).join(' | '));
  conf('gabarito: h = 6 na cota', tem(g, 'h = 6'), 1);
  conf('gabarito: mesma escala e mesma caixa do enunciado', Math.abs(g.escala - f.escala) < 1e-9 && g.caixa.altura === f.caixa.altura, true);
}

/* ================================================================ leitura da folha
 * O que a revisao de folha impressa mede e que o TEMA resolve, na diretiva ou
 * no texto, e nao a receita. As duas primeiras vieram do piloto do MATEM3-04 e
 * ficam como estao (leem o fluxo do PDF pelo registro.medido do base.js). As
 * tres seguintes sao deste tema, leem o texto e o registro, e cada uma vem
 * com o par envenenado: a mesma funcao rodada num tema ou numa figura com o
 * defeito plantado tem que acusar. */
console.log('\nleitura da folha');

const todasAsFiguras = [docPT, docGab, docEN, docGabEN].reduce(function (o, d) {
  return o.concat(d.figurasDesenhadas || []);
}, []);
function nomeDaFigura(f) { return f.id || f.receita || '?'; }

/* 1. Dois rotulos na mesma linha de base viram um rotulo so.
 * Medido no MATEM3-04: na elipse da p.1 o "a" acabava em x = 340,31 e o "F1"
 * comecava em x = 350,25, os dois na linha de base 640, e a folha lia "a  F1"
 * em sequencia. O piso de 14 pt sao 4,9 mm no papel. */
const FOLGA_MINIMA = 14;
let piorFolga = { pt: Infinity, onde: 'nenhum par na mesma linha de base' };
todasAsFiguras.forEach(function (f) {
  const ts = ((f.medido || {}).textos || []).filter(function (t) { return String(t.txt).trim(); });
  for (let i = 0; i < ts.length; i++) {
    for (let j = i + 1; j < ts.length; j++) {
      if (Math.abs(ts[i].y - ts[j].y) > 1.0) continue;
      const esq = ts[i].x <= ts[j].x ? ts[i] : ts[j];
      const dir = ts[i].x <= ts[j].x ? ts[j] : ts[i];
      const folga = dir.x - (esq.x + esq.largura);
      if (folga < piorFolga.pt) {
        piorFolga = { pt: folga, onde: nomeDaFigura(f) + ' "' + esq.txt + '" e "' + dir.txt + '"' };
      }
    }
  }
});
medido('menor folga entre dois rotulos na mesma linha de base: ' +
  piorFolga.pt.toFixed(2) + ' pt, em ' + piorFolga.onde);
conf('nenhum par de rotulos na mesma linha de base fica a menos de ' + FOLGA_MINIMA + ' pt',
  piorFolga.pt >= FOLGA_MINIMA, true);

/* 2. O rotulo do vertice da hiperbole tem que ser atribuivel.
 * Trava do piloto do MATEM3-04, mantida como esta. Neste tema nao ha A1 nem
 * A2 e ela passa vazia; fica porque a leitura da folha e a mesma em todos os
 * pilotos e o dia em que uma conica entrar aqui ela ja esta armada. */
function bolinhasDe(f) {
  return ((f.medido || {}).areas || []).map(function (a) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    a.pts.forEach(function (p) {
      x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y);
      x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
    });
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    let rmin = Infinity, rmax = 0;
    a.pts.forEach(function (p) {
      const r = Math.hypot(p.x - cx, p.y - cy);
      rmin = Math.min(rmin, r); rmax = Math.max(rmax, r);
    });
    return { x: cx, y: cy, l: x1 - x0, h: y1 - y0, redondeza: rmax / (rmin || 1e-9), cor: a.cor || [0, 0, 0] };
  }).filter(function (c) {
    return c.l > 1 && c.l < 8 && c.h > 1 && c.h < 8 && c.redondeza < 1.15 &&
      (c.cor[0] + c.cor[1] + c.cor[2]) < 1.5;
  });
}
let piorVertice = { razao: Infinity, onde: 'nenhuma figura com A1 e A2' };
todasAsFiguras.forEach(function (f) {
  const rot = ((f.medido || {}).textos || [])
    .filter(function (t) { return /^A[12]$/.test(String(t.txt).trim()); });
  if (rot.length !== 2) return;
  const dots = bolinhasDe(f);
  if (dots.length < 4) return;
  const cx = dots.reduce(function (s, d) { return s + d.x; }, 0) / dots.length;
  const cy = dots.reduce(function (s, d) { return s + d.y; }, 0) / dots.length;
  rot.forEach(function (t) {
    const px = t.x + t.largura / 2, py = t.y + t.tam * 0.35;
    const lado = String(t.txt).trim() === 'A1' ? 1 : -1;
    const meus = dots.filter(function (d) { return (d.x - cx) * lado > 0; })
      .sort(function (u, v) { return Math.abs(u.x - cx) - Math.abs(v.x - cx); });
    if (!meus.length) return;
    const V = meus[0];
    const aoVertice = Math.hypot(px - V.x, py - V.y);
    const aoCentro = Math.hypot(px - cx, py - cy);
    let outra = { d: Infinity, quem: 'nenhuma outra bolinha' };
    dots.forEach(function (d) {
      if (d === V) return;
      const dd = Math.hypot(px - d.x, py - d.y);
      if (dd < outra.d) outra = { d: dd, quem: 'da bolinha vizinha' };
    });
    const concorrente = Math.min(outra.d, aoCentro);
    const comoChama = outra.d <= aoCentro ? outra.quem : 'do cruzamento das assintotas';
    if (concorrente / aoVertice < piorVertice.razao) {
      piorVertice = {
        razao: concorrente / aoVertice,
        onde: nomeDaFigura(f) + ' "' + t.txt + '" a ' + aoVertice.toFixed(2) +
          ' pt do seu vertice e a ' + concorrente.toFixed(2) + ' pt ' + comoChama
      };
    }
  });
});
const PISO_DO_VERTICE = 1.7;
medido(piorVertice.onde + ' (razao ' + piorVertice.razao.toFixed(2) + ')');
conf('o rotulo do vertice fica ao menos ' + PISO_DO_VERTICE +
  ' vezes mais perto do seu vertice do que do concorrente mais proximo',
  piorVertice.razao >= PISO_DO_VERTICE, true);

/* Os utilitarios das tres travas do tema. */
function semDiretiva(s) { return String(s || '').replace(/(^|\s)@fig\s[^\n]*/g, ' '); }
function diretivasDe(s) { return String(s || '').match(/(^|\s)@fig\s[^\n]*/g) || []; }
function clonar(t) { return JSON.parse(JSON.stringify(t)); }
const REMETE = { pt: /\bfigura\b/i, en: /\bfigure\b/i };
const GLOSA = { pt: /hachurad/i, en: /hatched/i };

/* 3. Enunciado com figura remete a ela; enunciado sem figura nao fala dela.
 * O texto de antes DESCREVIA a figura em palavras (14, 17 e 18 eram os piores:
 * "interna ao quadrado e externa ao circulo inscrito", "enrolado ate formar",
 * "tocando as duas bases e a superficie lateral"). Com a figura na folha, o
 * enunciado tem que mandar olhar ("da figura", "in the figure"), porque a
 * figura vem DEPOIS do texto e quem le com dificuldade nao volta sozinho; e o
 * contrario e o defeito silencioso da lista montada pela professora: um
 * enunciado que diz "da figura" e cuja diretiva foi apagada. */
function semRemissao(t) {
  const acusa = [];
  ['pt', 'en'].forEach(function (lingua) {
    t[lingua].exercicios.forEach(function (ex) {
      const temFig = diretivasDe(ex.enunciado).length > 0;
      const remete = REMETE[lingua].test(semDiretiva(ex.enunciado));
      if (temFig && !remete) acusa.push(lingua + ' ' + ex.n + ' tem figura e nao remete a ela');
      if (!temFig && remete) acusa.push(lingua + ' ' + ex.n + ' fala da figura e nao tem nenhuma');
    });
  });
  return acusa;
}
conf('todo enunciado com figura remete a ela, e nenhum sem figura fala dela',
  semRemissao(tema).join('; ') || 'nenhum', 'nenhum');
{
  const veneno = clonar(tema);
  const ex9 = veneno.pt.exercicios.find((e) => e.n === 9);
  ex9.enunciado = ex9.enunciado.replace('da figura', 'reto');
  const ex1 = veneno.en.exercicios.find((e) => e.n === 1);
  ex1.enunciado = 'The right triangle in the figure has legs 9 and 12 centimetres.';
  conf('par envenenado: o 9 sem "da figura" e o 1 falando de figura sem ter sao acusados',
    semRemissao(veneno).join('; '), 'pt 9 tem figura e nao remete a ela; en 1 fala da figura e nao tem nenhuma');
}

/* 4. Nenhum dado numerico existe so no desenho.
 * A regra da especificacao para o banco bilingue: o numero que a figura
 * imprime tem que estar tambem no texto do enunciado, senao quem le em voz
 * alta ou pelo leitor de tela perde o exercicio. Le os textos IMPRESSOS de cada
 * figura de enunciado (pelo registro, nao pela diretiva) e procura cada numero
 * no texto do item, sem a diretiva. O "30°" da marca de angulo conta como 30. */
function numeroSoNoDesenho(t, lingua, registros) {
  const acusa = [];
  registros.forEach(function (f) {
    if (!f.id || f.fase === 'gabarito') return;
    const ex = t[lingua].exercicios.find((e) => diretivasDe(e.enunciado).some((d) => d.indexOf('id=' + f.id + ' ') >= 0 || / id=.*$/.test(d) && d.indexOf('id=' + f.id) >= 0));
    if (!ex) { acusa.push(lingua + ' ' + f.id + ' sem exercicio'); return; }
    const noTexto = semDiretiva(ex.enunciado).match(/\d+(?:[.,]\d+)?/g) || [];
    textos(f).forEach(function (tx) {
      const m = String(tx).match(/^(\d+(?:[.,]\d+)?)°?$/);
      if (!m) return;
      if (noTexto.indexOf(m[1]) < 0) acusa.push(lingua + ' ' + ex.n + ': a figura imprime ' + tx + ' e o texto nao traz');
    });
  });
  return acusa;
}
const soNoDesenho = numeroSoNoDesenho(tema, 'pt', docPT.figurasDesenhadas || [])
  .concat(numeroSoNoDesenho(tema, 'en', docEN.figurasDesenhadas || []));
conf('todo numero impresso numa figura de enunciado esta no texto do item, nas duas linguas',
  soNoDesenho.join('; ') || 'nenhum', 'nenhum');
{
  const veneno = clonar(tema);
  const ex16 = veneno.pt.exercicios.find((e) => e.n === 16);
  ex16.enunciado = ex16.enunciado.replace('raio 12 centímetros', 'raio dado');
  conf('par envenenado: tirado o 12 do texto do 16, a figura que imprime 12 e acusada',
    numeroSoNoDesenho(veneno, 'pt', docPT.figurasDesenhadas || []).join('; '), 'pt 16: a figura imprime 12 e o texto nao traz');
}

/* 5. Toda hachura tem glosa: na legenda da figura e, no exercicio, tambem no
 * enunciado. Hachura sem palavra e textura que o olho tenta ler como conteudo,
 * e a folha pode sair em cinza. A hachura e lida no fluxo (as varreduras que o
 * base.js conta), nao na diretiva. */
function hachuraSemGlosa(t, lingua, registros) {
  const acusa = [];
  registros.forEach(function (f) {
    if (!((f.medido || {}).varreduras > 0)) return;
    const nome = lingua + ' ' + nomeDaFigura(f);
    if (!f.legenda) { acusa.push(nome + ' hachurada sem legenda'); return; }
    if (!GLOSA[lingua].test(f.legenda)) acusa.push(nome + ' com legenda que nao glosa a hachura');
    if (f.id && f.fase !== 'gabarito') {
      const ex = t[lingua].exercicios.find((e) => diretivasDe(e.enunciado).some((d) => d.indexOf('id=' + f.id) >= 0));
      if (ex && !GLOSA[lingua].test(semDiretiva(ex.enunciado))) acusa.push(nome + ': o enunciado nao diz que ha regiao hachurada');
    }
  });
  return acusa;
}
const hachuradas = todasAsFiguras.filter((f) => (f.medido || {}).varreduras > 0).length;
medido(hachuradas + ' figuras hachuradas nas quatro folhas');
conf('ha hachura para glosar (o setor de alfa, o 14 e o 16, em cada lingua)', hachuradas >= 6, true);
conf('toda figura hachurada tem legenda de glosa e o enunciado nomeia a regiao, nas duas linguas',
  hachuraSemGlosa(tema, 'pt', docPT.figurasDesenhadas || []).concat(hachuraSemGlosa(tema, 'en', docEN.figurasDesenhadas || [])).join('; ') || 'nenhuma', 'nenhuma');
{
  const semLegenda = rascunho('@fig circulo id=v1 raio=6 setor=60 centro=O').figs;
  const veneno = clonar(tema);
  const ex14 = veneno.pt.exercicios.find((e) => e.n === 14);
  ex14.enunciado = ex14.enunciado.replace('região hachurada', 'região');
  conf('par envenenado: o setor sem legenda e o 14 sem "hachurada" no texto sao acusados',
    hachuraSemGlosa(veneno, 'pt', semLegenda.concat([porId.q14])).join('; '),
    'pt v1 hachurada sem legenda; pt q14: o enunciado nao diz que ha regiao hachurada');
}

console.log('\n' + ok + ' conferencias passaram, ' + mau + ' falharam.');
[['pt', docPT], ['gb', docGab], ['en', docEN], ['en gb', docGabEN]].forEach(function (par) {
  (par[1].avisosFigura || []).forEach(function (a) { console.log('  ' + par[0] + ' . ' + a); });
});
process.exit(mau ? 1 : 0);
