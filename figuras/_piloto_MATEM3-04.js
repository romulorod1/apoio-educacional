/* figuras/_piloto_MATEM3-04.js
 * Gera os documentos do MATEM3-04, "Conicas", pelo caminho de verdade: o
 * gerarMaterialTema do pdf.js, lendo o tema do temas/banco.json, que e o mesmo
 * arquivo que o tablet consome. Copia a forma do _piloto_MAT07-12.js e
 * acrescenta a medicao que as conicas pedem: foco no lugar, medido na curva
 * impressa, e nao no que a receita disse que ia desenhar.
 *
 * Uso: node _piloto_MATEM3-04.js [caminho de outro banco.json]
 *
 * Sai em quatro arquivos, tres em portugues e um em ingles:
 *   _exemplo_MATEM3-04_material.pdf   explicacao, lista e gabarito
 *   _exemplo_MATEM3-04_lista.pdf      so a lista, com espaco para responder
 *   _exemplo_MATEM3-04_gabarito.pdf   so o gabarito (a camada pelo id, sozinha)
 *   _exemplo_MATEM3-04_en.pdf         a folha inglesa inteira
 *
 * Regra da casa: nunca usar travessao.
 */
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');

const ID = 'MATEM3-04';
const RAIZ = path.join(__dirname, '..');
const PADRAO = path.join(RAIZ, 'temas', 'banco.json');
const BANCO = process.argv[2] || PADRAO;
const FONTE = path.join(RAIZ, 'temas', 'mat', 'em3', ID + '.md');
const banco = JSON.parse(fs.readFileSync(BANCO, 'utf8'));
const tema = banco.temas.find(function (t) { return t.id === ID; });
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
  aluno: 'Nathália', data: '02/09/2026'
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

console.log('\nconferencias');

/* 0. O banco tem que ser o do .md de hoje.
 * O piloto le o banco.json, e nao o .md, de proposito: e o arquivo que o tablet
 * consome, entao e nele que a folha da aluna nasce. Mas quando o .md muda e o
 * gerar_banco.py ainda nao rodou, TODAS as contagens abaixo comparam a escolha
 * editorial de hoje com o texto de ontem, e o piloto reprova em sete
 * conferencias sem dizer a causa. Ja aconteceu nesta rodada. Esta conferencia
 * diz a causa numa linha so, e o conserto e regerar o banco, nunca desfazer o
 * tema. Conta as diretivas dos dois lados: no .md as linhas @fig das duas
 * linguas, no banco as que sobreviveram em explicacao, enunciado e resposta.
 * So vale para o banco padrao: quem passa outro banco na linha de comando, para
 * comparar com a main por exemplo, esta comparando de proposito. */
if (BANCO === PADRAO && fs.existsSync(FONTE)) {
  const noMd = (fs.readFileSync(FONTE, 'utf8').match(/(^|\s)@fig\s/g) || []).length;
  let noBanco = 0;
  ['pt', 'en'].forEach(function (lingua) {
    const d = tema[lingua] || {};
    const textos = [d.explicacao || ''];
    (d.exercicios || []).forEach(function (e) { textos.push(e.enunciado || '', e.resposta || ''); });
    textos.forEach(function (s) { noBanco += (s.match(/(^|\s)@fig\s/g) || []).length; });
  });
  conf('o banco.json foi gerado do MATEM3-04.md de hoje (' + noMd + ' diretivas no .md)',
    noBanco === noMd ? 'sim' : 'NAO: o banco tem ' + noBanco + ' diretivas, rode temas/_ferramentas/gerar_banco.py', 'sim');
}

[['material', material], ['lista', lista], ['gabarito', gabarito], ['ingles', ingles]]
  .forEach(function (par) {
    const cru = Buffer.from(par[1]).toString('latin1');
    conf('nenhuma diretiva saiu impressa no ' + par[0], /@fig/.test(cru), false);
  });

const NAO_TRADUZ = ['Nathália Wajsenzon', 'APOIO EDUCACIONAL',
  'Nathália Wajsenzon · Apoio Educacional', 'NW'];
const MARCA_PT = /ção|ções|ângul|Página|Aluno|Gabarito|Exercícios|elipse|hipérbole|parábola|foco |diretriz|vértice|soma |graus|ê|õ|ç|ã/;

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

/* Escolha editorial escrita: 5 na explicacao, nenhuma nos 20 enunciados, 1 no
 * gabarito. As tres conicas se definem por distancia e as tres precisam da
 * definicao DESENHADA: a elipse tem a soma dos raios focais na primeira figura,
 * a hiperbole tem a diferenca na dela, a parabola tem os dois segmentos iguais
 * com tracinho. As outras duas sao as que o texto percorre elemento a elemento,
 * o triangulo de Pitagoras e o retangulo fundamental com as assintotas.
 *
 * Duas sairam desta lista, e o motivo e medido em papel. Cada figura de conica
 * reserva 190 pt, um quarto da faixa util da folha, porque a caixa e mais larga
 * do que alta e o alturaParaCaixa do receitas.js entrega o teto de 190 para
 * todas elas. Com nove figuras o material saia com 9 paginas em cada lingua e
 * tres delas quase em branco: PT p.5 com 616 pt de papel branco (89 por cento
 * da faixa util), EN p.7 com 631 pt (91 por cento) e p.9 com 487 pt nas duas.
 * Com seis figuras sao 6 paginas e a mais vazia tem 148 pt, 21 por cento.
 *
 * A que saiu da explicacao e a elipse transladada do Exemplo 4: das seis, e a
 * unica cujo paragrafo continua inteiro sem ela, porque o que o exemplo ensina
 * e a conta de completar quadrados, e a conclusao ('a curva e a mesma, so
 * desenhada em outro lugar') cabe na frase. A do enunciado do 18 desceu para o gabarito e
 * ganhou com a mudanca: ela estava em escala exata, e com regua na folha a
 * aluna media PF1 e PF2, fazia 7 vezes a razao e chegava ao 3 sem usar a
 * definicao uma vez, que e justamente o que aquele enunciado manda usar. No
 * gabarito a mesma figura vira conferencia, e nao atalho. */
const diretivasExplic = receitasDe(tema.pt.explicacao).split(' ').filter(function (s) { return s; }).length;
conf('a explicacao tem 5 figuras', diretivasExplic, 5);
conf('e as 5 foram desenhadas', (docPT.figurasDesenhadas || []).length, 5);
conf('nenhum dos 20 enunciados carrega figura',
  tema.pt.exercicios.filter(function (e) { return receitasDe(e.enunciado); }).map(function (e) { return e.n; }).join(' ') || 'nenhum', 'nenhum');
conf('e o gabarito tem 1 (a do 18, com o d = 3 escrito)', (docGab.figurasDesenhadas || []).length, 1);
conf('nenhuma figura falhou', figs.filter(function (f) { return f.erro; }).length, 0);
conf('nenhum aviso de figura no material', (docPT.avisosFigura || []).length, 0);
conf('nenhum aviso de figura no gabarito', (docGab.avisosFigura || []).length, 0);
conf('nenhum aviso de figura na folha em ingles', (docEN.avisosFigura || []).length + (docGabEN.avisosFigura || []).length, 0);

let acimaDoTeto = [];
figs.forEach(function (f) {
  if (f.marcasAtivas > 5) acimaDoTeto.push((f.id || f.receita || '?') + ':' + f.marcasAtivas);
});
conf('nenhuma figura passa do teto de cinco marcas ativas', acimaDoTeto.join(', ') || 'nenhuma', 'nenhuma');
console.log('  marcas ativas por figura: ' +
  figs.map(function (f) { return (f.id || f.receita) + ':' + f.marcasAtivas; }).join(' '));

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
 * O leitor de caminhos da _prova_receitas_circulo.js. Em toda elipse impressa
 * com bolinhas sobre o eixo maior, as bolinhas estao a c = raiz(a2 - b2) do
 * centro, com a e b lidos da caixa da propria curva. Em toda parabola, o foco
 * impresso esta a p/2 do vertice impresso, com p lido da curva. */
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
      case 'm': atual = { pts: [{ x: num(2), y: num(1) }], trechos: [], w: w }; subs.push(atual); break;
      case 'l': if (atual) { const a = atual.pts[atual.pts.length - 1], b = { x: num(2), y: num(1) }; atual.trechos.push({ p0: a, c1: a, c2: b, p3: b, reta: true }); atual.pts.push(b); } break;
      case 'c': if (atual) { const a = atual.pts[atual.pts.length - 1]; const p3 = { x: num(2), y: num(1) }; atual.trechos.push({ p0: a, c1: { x: num(6), y: num(5) }, c2: { x: num(4), y: num(3) }, p3: p3, reta: false }); atual.pts.push(p3); } break;
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
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function bolinhas(subs) {
  return subs.filter((s) => s.pintado === 'area' && s.trechos.length === 4 && s.trechos.every((t) => !t.reta))
    .map((s) => caixaDe(pontosDoSub(s, 8))).filter((c) => c.largura < 8 && c.altura < 8).map((c) => ({ x: c.cx, y: c.cy }));
}

console.log('\nmedicao no fluxo');
let elipses = 0, elipsesOk = 0, parabolas = 0, parabolasOk = 0, hiperboles = 0, hiperbolesOk = 0;
[docPT, docGab].forEach(function (d) {
  (d.paginas || []).forEach(function (pag) {
    const subs = lerCaminhos(pag.ops || []);
    const dots = bolinhas(subs);
    /* elipses: caminho fechado de quatro Beziers, caixa grande e nao redonda */
    subs.filter((s) => s.pintado === 'traco' && s.trechos.length === 4 && s.trechos.every((t) => !t.reta)).forEach(function (s) {
      const c = caixaDe(pontosDoSub(s, 24));
      if (c.largura < 20 || Math.abs(c.largura - c.altura) < 1) return;
      const a = Math.max(c.largura, c.altura) / 2, b = Math.min(c.largura, c.altura) / 2;
      const cc = Math.sqrt(a * a - b * b);
      const horizontal = c.largura >= c.altura;
      /* Sobre o eixo maior, longe do centro (a letra C) e aquem dos vertices
       * (vertices=sim tambem poe bolinhas nas pontas do eixo). */
      const focos = dots.filter((p) => horizontal
        ? Math.abs(p.y - c.cy) < 0.6 && Math.abs(p.x - c.cx) > 1 && Math.abs(p.x - c.cx) < a - 1
        : Math.abs(p.x - c.cx) < 0.6 && Math.abs(p.y - c.cy) > 1 && Math.abs(p.y - c.cy) < a - 1);
      if (!focos.length) return;
      elipses++;
      const erros = focos.map((f) => Math.abs((horizontal ? Math.abs(f.x - c.cx) : Math.abs(f.y - c.cy)) - cc));
      const bom = focos.length === 2 && erros.every((e) => e < 0.5);
      if (bom) elipsesOk++;
      medido('elipse a = ' + a.toFixed(2) + ' b = ' + b.toFixed(2) + ' pt: focos a ' + focos.map((f) => (horizontal ? Math.abs(f.x - c.cx) : Math.abs(f.y - c.cy)).toFixed(3)).join(' e ') + ' pt do centro, c = ' + cc.toFixed(3) + (bom ? '' : '  <<< fora do lugar'));
    });
    /* Caminhos longos: um sozinho na sua faixa vertical e parabola, dois
     * lado a lado na mesma faixa sao os ramos de uma hiperbole. */
    const longos = subs.filter((s) => s.pintado === 'traco' && s.trechos.length >= 30)
      .map((s) => ({ s: s, c: caixaDe(pontosDoSub(s, 6)) }));
    const usados = new Set();
    longos.forEach(function (L, i) {
      if (usados.has(i)) return;
      const par = longos.findIndex((M, j) => j !== i && !usados.has(j) &&
        Math.abs(M.c.y0 - L.c.y0) < 2 && Math.abs(M.c.y1 - L.c.y1) < 2 && Math.abs(M.c.largura - L.c.largura) < 2);
      if (par >= 0) {
        usados.add(i); usados.add(par);
        const todos = [];
        for (const r of [L.s, longos[par].s]) for (const q of pontosDoSub(r, 6)) todos.push(q);
        const cx = caixaDe(todos), centro = { x: cx.cx, y: cx.cy };
        let a = Infinity;
        for (const q of todos) a = Math.min(a, Math.abs(q.x - centro.x));
        const focos = dots.filter((q) => Math.abs(q.y - centro.y) < 0.6 && Math.abs(q.x - centro.x) > a + 1).sort((u, v) => u.x - v.x);
        if (focos.length !== 2) { medido('hiperbole sem os dois focos impressos'); return; }
        hiperboles++;
        let pior = 0;
        for (const q of todos) pior = Math.max(pior, Math.abs(Math.abs(dist(q, focos[0]) - dist(q, focos[1])) - 2 * a));
        const cc = (focos[1].x - focos[0].x) / 2;
        const bom = pior < 0.5;
        if (bom) hiperbolesOk++;
        medido('hiperbole a = ' + a.toFixed(3) + ' pt, focos a ' + cc.toFixed(3) + ' pt do centro (excentricidade impressa c/a = ' + (cc / a).toFixed(4) + '); pior |PF1 - PF2| - 2a = ' + pior.toFixed(4) + ' pt' + (bom ? '' : '  <<< fora'));
        return;
      }
      usados.add(i);
      const pts = pontosDoSub(L.s, 6);
      let V = pts[0];
      for (const p of pts) if (p.x < V.x) V = p;
      let somaP = 0, n = 0;
      for (const p of pts) { const x = p.x - V.x, y = p.y - V.y; if (x > 2) { somaP += y * y / (2 * x); n++; } }
      const p = somaP / n;
      const foco = dots.filter((q) => Math.abs(q.y - V.y) < 0.6 && q.x > V.x)[0] || null;
      if (!foco) { medido('parabola sem foco impresso'); return; }
      parabolas++;
      const bom = Math.abs(foco.x - V.x - p / 2) < 0.5;
      if (bom) parabolasOk++;
      medido('parabola p = ' + p.toFixed(3) + ' pt: foco a ' + (foco.x - V.x).toFixed(3) + ' pt do vertice (p/2 = ' + (p / 2).toFixed(3) + ')' + (bom ? '' : '  <<< fora do lugar'));
    });
  });
});
conf('elipses com focos impressos: ' + elipses + ', todas com os focos a c do centro', elipsesOk, elipses);
conf('parabolas com foco impresso: ' + parabolas + ', todas com o foco a p/2 do vertice', parabolasOk, parabolas);
conf('hiperboles: ' + hiperboles + ', com |PF1 - PF2| = 2a em todo ponto impresso', hiperbolesOk, hiperboles);
/* Tres elipses (a da definicao, a de Pitagoras e a do 18 no gabarito), uma
 * parabola e duas hiperboles: e a conta das seis figuras que sobraram. */
conf('houve o que medir (3 elipses, 1 parabola, 2 hiperboles)', elipses + ' ' + parabolas + ' ' + hiperboles, '3 1 2');

/* ================================================================ leitura da folha
 * As quatro coisas que a revisao de folha impressa mediu e que o TEMA resolve,
 * na diretiva ou no texto, e nao a receita: rotulo colado em rotulo, rotulo de
 * vertice que nao da para atribuir, enunciado que nao combina com o gabarito e
 * exercicio que devolve o que um exemplo resolvido ja imprimiu. As quatro
 * medem, nao opinam: a primeira e a segunda leem o fluxo do PDF pelo
 * registro.medido do base.js, as outras duas leem o texto do tema. */
console.log('\nleitura da folha');

const todasAsFiguras = [docPT, docGab, docEN, docGabEN].reduce(function (o, d) {
  return o.concat(d.figurasDesenhadas || []);
}, []);
function nomeDaFigura(f) { return f.id || f.receita || '?'; }

/* 1. Dois rotulos na mesma linha de base viram um rotulo so.
 * Medido na tirada anterior: na elipse da p.1 o "a" acabava em x = 340,31 e o
 * "F1" comecava em x = 350,25, os dois na linha de base 640, os dois sob a
 * mesma reta horizontal e com o foco impresso no meio do segmento. A folha lia
 * "a  F1" em sequencia e o "a" passava a legendar o trecho centro ate F1, que
 * mede c e nao a: 29 por cento a menos, na figura que abre o tema em que
 * trocar a por c e o primeiro erro comum da lista. Na hiperbole o mesmo par
 * A2 e A1 ficava a 12,90 pt. O piso de 14 pt sao 4,9 mm no papel. */
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
 * Medido na tirada anterior: com 2a de 46,29 pt o "A1" ficava a 11,49 pt do
 * vertice que ele nomeia e a 11,65 pt do cruzamento das assintotas, ou seja
 * equidistante, e a folha nao dizia qual bolinha era qual. Quem decide isso e
 * o tema, pela escala: a mesma caixa de altura desenha 2a maior quando a razao
 * a por b cresce.
 *
 * A primeira versao desta trava so comparava com o cruzamento das assintotas, e
 * essa era a comparacao errada. O concorrente real do A1 na folha e a OUTRA
 * bolinha da mesma reta horizontal, a do foco: com a excentricidade honesta de
 * 1,25 desta figura o vertice e o foco ficam a 9,29 pt um do outro, e o A1 mede
 * 11,50 pt ate o seu vertice contra 20,78 ate o foco, razao 1,81. A trava
 * antiga informava 2,23, que e a razao contra o cruzamento, entao qualquer
 * mudanca que aproximasse o A1 do foco passava no teste e saia errada na folha.
 * Agora ela mede contra a bolinha mais proxima que NAO e a dele, seja o foco,
 * seja o outro vertice, e tambem contra o cruzamento, e cobra o menor dos dois.
 *
 * O piso desce de 2 para 1,7 porque a medida mudou de objeto, e nao porque a
 * folha piorou: 1,81 e o que a figura entrega hoje, com o A1 do lado de dentro
 * do seu vertice e o foco do lado de fora, e a leitura sai inequivoca no papel
 * (conferido a 200 dpi). E o piso pega o que a medida velha deixava passar:
 * trocada a figura por a=4 b=2, que puxa o foco para perto do vertice, a razao
 * nova cai para 1,50 e a conferencia acusa, enquanto a razao velha SOBE para
 * 3,22, porque afastar b afasta o cruzamento das assintotas. */
/* Bolinha e area pequena, escura e REDONDA. Sem o teste de redondeza as duas
 * pontas de seta da cota do c entram na conta (5,77 por 6,60 pt, escuras), e
 * uma delas vira "o vertice mais proximo" do A1: a primeira tirada desta
 * conferencia mediu 34,17 pt de A1 ate uma ponta de seta. */
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
    /* A bolinha mais proxima que nao e a dele. */
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

/* 3. Enunciado no singular com gabarito no plural.
 * O 20 pedia "as coordenadas desse ponto" e o gabarito entregava "os pontos
 * (5, 2 raiz de 15) e (5, -2 raiz de 15)", com a figura desenhando um so. */
const DOIS_PARES = /\)\s*(?:e|and)\s*\(/;
let singularComPlural = [];
['pt', 'en'].forEach(function (lingua) {
  const plural = lingua === 'pt' ? /\bpontos\b/i : /\bpoints\b/i;
  tema[lingua].exercicios.forEach(function (ex) {
    if (DOIS_PARES.test(ex.resposta) && !plural.test(ex.enunciado)) {
      singularComPlural.push(lingua + ' ' + ex.n);
    }
  });
});
conf('nenhum enunciado no singular com gabarito de dois pontos',
  singularComPlural.join(', ') || 'nenhum', 'nenhum');

/* 4. Exercicio que repete um exemplo resolvido e entrega a resposta.
 * O 8 era "x^{2}/9 - y^{2}/16 = 1" pedindo assintotas e excentricidade: a
 * mesma equacao do Exemplo 2, que ja imprimia "y = 4x/3", "y = -4x/3" e
 * "e = 5/3" duas paginas antes. Acusa quando a equacao do enunciado aparece na
 * explicacao E todas as fracoes da resposta tambem. */
function umEspaco(s) { return String(s || '').replace(/\s+/g, ' '); }
function semEspaco(s) { return String(s || '').replace(/\s+/g, ''); }
const EQUACAO_REDUZIDA = /x\^\{2\}\/\d+[-+]y\^\{2\}\/\d+=1/g;
const FRACAO = /-?[0-9A-Za-z]+\/[0-9A-Za-z]+/g;
let jaRespondidos = [];
['pt', 'en'].forEach(function (lingua) {
  const explicSem = semEspaco(tema[lingua].explicacao);
  const explicCom = umEspaco(tema[lingua].explicacao);
  tema[lingua].exercicios.forEach(function (ex) {
    const eqs = semEspaco(ex.enunciado).match(EQUACAO_REDUZIDA) || [];
    if (!eqs.some(function (e) { return explicSem.indexOf(e) >= 0; })) return;
    const fr = umEspaco(ex.resposta).match(FRACAO) || [];
    if (fr.length < 2) return;
    if (fr.every(function (t) { return explicCom.indexOf(t) >= 0; })) {
      jaRespondidos.push(lingua + ' ' + ex.n + ' (' + fr.join(', ') + ')');
    }
  });
});
conf('nenhum exercicio repete a equacao de um exemplo com a resposta ja impressa',
  jaRespondidos.join('; ') || 'nenhum', 'nenhum');

/* 5. A letra de cota tem que repousar no traco que ela cota.
 * Em desenho a letra pertence a linha em que a base dela repousa, e as travas 1
 * e 2 acima so comparam texto contra texto e texto contra bolinha: nenhuma
 * olhava texto contra TRACO. Dois casos medidos na tirada anterior, os dois na
 * explicacao:
 *
 *   b   na elipse que abre o tema: 1,92 pt ate a corda PF2, que e obliqua, e
 *       5,60 pt ate o semieixo menor, que e vertical e e o que ele nomeia. A
 *       aluna saia da primeira figura com b = raio focal, no paragrafo que
 *       acabou de dizer que PF1 + PF2 = 2a, e trocar quem e quem nessa relacao
 *       e o erro que o proprio tema lista como o numero um.
 *   d   na parabola: 5,60 pt ate a diretriz, que ele nomeia, e 5,76 pt ate o
 *       segmento horizontal que sai de P, ou seja empate de 3 por cento, e o
 *       segmento errado e o mais grosso dos dois (0,9 contra 0,6 pt).
 *
 * A conferencia le da DIRETIVA que traco cada letra cota, porque isso e escolha
 * do tema: b cota o semieixo menor, que e vertical; a, c e p cotam medidas
 * sobre o eixo horizontal; diretriz=<letra> nomeia a reta vertical. Duas cotam
 * obliquas e para elas so vale a margem: retangulo=<letra>, que e a meia
 * diagonal, e incognita=<letra>, que e o raio focal. Fora a direcao, todas tem
 * que ganhar do segundo traco mais proximo por 1,6 vezes; hoje a pior margem e
 * 2,29. So le letra escrita sozinha: no gabarito a incognita sai como "d = 3",
 * puxada por fio de chamada, que e outra mecanica e tem trava propria. */
const DIRECAO_DA_COTA = { a: 0, b: 90, c: 0, p: 0, diretriz: 90, retangulo: null, incognita: null };
const MARGEM_DA_COTA = 1.6;
const TOLERANCIA_DE_ANGULO = 4;

function paresDaDiretiva(bruto) {
  const pares = {};
  const rx = /([a-z]+)=([^\s]+)/g;
  let m;
  while ((m = rx.exec(String(bruto || '')))) if (!(m[1] in pares)) pares[m[1]] = m[2];
  return pares;
}
function letraDaCota(valor) {
  const partes = String(valor).split(';');
  const fim = partes[partes.length - 1];
  return /^[A-Za-z]$/.test(fim) ? fim : null;
}
function anguloDoSegmento(s) {
  let a = Math.atan2(s.y2 - s.y1, s.x2 - s.x1) * 180 / Math.PI;
  while (a < 0) a += 180;
  return a % 180;
}
function difDeAngulo(u, v) { const d = Math.abs(u - v) % 180; return Math.min(d, 180 - d); }
function distanciaAteSegmento(caixa, s) {
  function doPonto(px, py) {
    const dx = s.x2 - s.x1, dy = s.y2 - s.y1, L = dx * dx + dy * dy;
    let t = L ? ((px - s.x1) * dx + (py - s.y1) * dy) / L : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (s.x1 + t * dx), py - (s.y1 + t * dy));
  }
  let d = Infinity;
  for (let i = 0; i <= 16; i++) {
    const fx = caixa.x0 + (caixa.x1 - caixa.x0) * i / 16;
    const fy = caixa.y0 + (caixa.y1 - caixa.y0) * i / 16;
    d = Math.min(d, doPonto(fx, caixa.y0), doPonto(fx, caixa.y1), doPonto(caixa.x0, fy), doPonto(caixa.x1, fy));
  }
  return d;
}
let cotasLidas = 0;
let cotaErrada = [];
let piorCota = { razao: Infinity, onde: 'nenhuma letra de cota' };
todasAsFiguras.forEach(function (f) {
  const pares = paresDaDiretiva(f.diretiva);
  const med = f.medido || {};
  const tracos = (med.segmentos || []).filter(function (s) { return !s.varredura; });
  if (!tracos.length) return;
  Object.keys(DIRECAO_DA_COTA).forEach(function (chave) {
    if (!(chave in pares)) return;
    const letra = letraDaCota(pares[chave]);
    if (!letra) return;
    const rot = (med.textos || []).filter(function (t) { return String(t.txt).trim() === letra; });
    if (!rot.length) return;
    rot.forEach(function (t) {
      cotasLidas++;
      const caixa = { x0: t.x, y0: t.y, x1: t.x + t.largura, y1: t.y + t.tam * 0.72 };
      const ordenados = tracos.map(function (s) {
        return { d: distanciaAteSegmento(caixa, s), ang: anguloDoSegmento(s), s: s };
      }).sort(function (u, v) { return u.d - v.d; });
      const perto = ordenados[0];
      const outro = ordenados.find(function (o) { return difDeAngulo(o.ang, perto.ang) > TOLERANCIA_DE_ANGULO; });
      const esperada = DIRECAO_DA_COTA[chave];
      const onde = nomeDaFigura(f) + ' "' + letra + '" (' + chave + '=' + pares[chave] + ')';
      if (esperada !== null && difDeAngulo(perto.ang, esperada) > TOLERANCIA_DE_ANGULO) {
        cotaErrada.push(onde + ': o traco mais proximo esta a ' + perto.d.toFixed(2) +
          ' pt e sai a ' + perto.ang.toFixed(0) + ' graus, e nao a ' + esperada);
        return;
      }
      const razao = outro ? outro.d / Math.max(perto.d, 1e-6) : Infinity;
      if (razao < piorCota.razao) {
        piorCota = {
          razao: razao,
          onde: onde + ' a ' + perto.d.toFixed(2) + ' pt do traco que ela cota e a ' +
            (outro ? outro.d.toFixed(2) : 'nenhum') + ' pt do traco seguinte'
        };
      }
    });
  });
});
medido('letras de cota lidas: ' + cotasLidas + '; a de menor margem e ' + piorCota.onde +
  ' (razao ' + piorCota.razao.toFixed(2) + ')');
conf('toda letra de cota repousa no traco que ela cota',
  cotaErrada.join('; ') || 'nenhuma fora do lugar', 'nenhuma fora do lugar');
conf('e ganha do traco seguinte por ao menos ' + MARGEM_DA_COTA + ' vezes',
  piorCota.razao >= MARGEM_DA_COTA, true);

console.log('\n' + ok + ' conferencias passaram, ' + mau + ' falharam.');
[['pt', docPT], ['gb', docGab], ['en', docEN], ['en gb', docGabEN]].forEach(function (par) {
  (par[1].avisosFigura || []).forEach(function (a) { console.log('  ' + par[0] + ' . ' + a); });
});
process.exit(mau ? 1 : 0);
