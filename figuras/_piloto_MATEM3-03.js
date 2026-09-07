/* figuras/_piloto_MATEM3-03.js
 * Gera os documentos do MATEM3-03, "Geometria analitica: a circunferencia",
 * pelo caminho de verdade: o gerarMaterialTema do pdf.js, lendo o tema do
 * temas/banco.json (ou de um retrato de um tema so), que e o mesmo arquivo que
 * o tablet consome. Copia a forma do _piloto_MATEM3-04.js e troca a medicao
 * pelo que a circunferencia no plano pede: a circunferencia impressa e redonda
 * e tem o raio da equacao, a reta impressa passa pelos pontos que a equacao
 * diz, a perpendicular mede d e o ponto livre esta onde as coordenadas mandam.
 * Tudo lido no papel, com a origem do plano tirada dos proprios eixos.
 *
 * Uso: node _piloto_MATEM3-03.js [caminho de outro banco.json ou de um tema solto]
 *   O segundo argumento aceita o banco inteiro ({"temas": [...]}) ou o retrato
 *   de um tema so (figuras/_tema_MATEM3-03.json, no mesmo envelope), para
 *   provar uma edicao do .md sem regravar o temas/banco.json.
 *
 * Sai em quatro arquivos, tres em portugues e um em ingles:
 *   _exemplo_MATEM3-03_material.pdf   explicacao, lista e gabarito
 *   _exemplo_MATEM3-03_lista.pdf      so a lista, com espaco para responder
 *   _exemplo_MATEM3-03_gabarito.pdf   so o gabarito (as figuras da resposta)
 *   _exemplo_MATEM3-03_en.pdf         a folha inglesa inteira
 *
 * Regra da casa: nunca usar travessao.
 */
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');

const ID = 'MATEM3-03';
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
function n2c(v) { return (Math.round(v * 100) / 100).toFixed(2); }

console.log('\nconferencias');

/* 0. O banco tem que ser o do .md de hoje (ver o _piloto_MATEM3-04.js). So
 * vale para o banco padrao: quem passa outro banco ou o retrato de um tema
 * esta comparando de proposito. */
if (BANCO === PADRAO && fs.existsSync(FONTE)) {
  const noMd = (fs.readFileSync(FONTE, 'utf8').match(/(^|\s)@fig\s/g) || []).length;
  let noBanco = 0;
  ['pt', 'en'].forEach(function (lingua) {
    const d = tema[lingua] || {};
    const textos = [d.explicacao || ''];
    (d.exercicios || []).forEach(function (e) { textos.push(e.enunciado || '', e.resposta || ''); });
    textos.forEach(function (s) { noBanco += (s.match(/(^|\s)@fig\s/g) || []).length; });
  });
  conf('o banco.json foi gerado do ' + ID + '.md de hoje (' + noMd + ' diretivas no .md)',
    noBanco === noMd ? 'sim' : 'NAO: o banco tem ' + noBanco + ' diretivas, rode temas/_ferramentas/gerar_banco.py', 'sim');
}

[['material', material], ['lista', lista], ['gabarito', gabarito], ['ingles', ingles]]
  .forEach(function (par) {
    const cru = Buffer.from(par[1]).toString('latin1');
    conf('nenhuma diretiva saiu impressa no ' + par[0], /@fig/.test(cru), false);
  });

const NAO_TRADUZ = ['Nathália Wajsenzon', 'APOIO EDUCACIONAL',
  'Nathália Wajsenzon · Apoio Educacional', 'NW'];
const MARCA_PT = /ção|ções|ângul|Página|Aluno|Gabarito|Exercícios|circunfer|círcul|distância|equação|ê|õ|ç|ã/;

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

/* Escolha editorial escrita: 6 diretivas na explicacao, nenhuma nos 19
 * enunciados, 9 no gabarito.
 *
 * A explicacao desenha o que o texto percorre: a figura de onde a equacao sai
 * (centro (a, b), ponto (x, y), raio r, num plano mudo porque letra nao se le
 * em escala), a circunferencia transladada do Exemplo 2 com as duas
 * coordenadas cotadas, o painel de tres casos da posicao de um ponto, o
 * painel de tres casos da posicao de uma reta com a perpendicular cotada, a
 * reta exterior do Exemplo 4 no plano e a tangente perpendicular ao raio. Os
 * dois paineis sao UMA diretiva e tres figuras cada (casos=), como o painel
 * dos triangulos: por isso a explicacao tem 6 diretivas e 10 figuras.
 *
 * Nenhum enunciado leva figura, e a razao e a mesma do 18 do MATEM3-04: com o
 * plano graduado atras, a posicao de um ponto ou de uma reta se LE da folha
 * (o ponto esta fora, a reta corta em dois lugares, os pontos comuns sao (3,
 * 4) e (-4, -3)), e o exercicio existe para quem resolve decidir isso pela conta.
 * No gabarito a mesma figura vira conferencia da conta, e nao atalho: 10, 11,
 * 12, 13, 15, 16, 17, 18 e 19. O 14 e conta pura (k para o raio 4) e fica em
 * texto, como a regra da especificacao manda. */
const diretivasExplic = receitasDe(tema.pt.explicacao).split(' ').filter(function (s) { return s; }).length;
conf('a explicacao tem 6 diretivas de figura', diretivasExplic, 6);
conf('e elas geram 10 figuras (dois paineis de tres casos)', (docPT.figurasDesenhadas || []).length, 10);
conf('nenhum dos 19 enunciados carrega figura',
  tema.pt.exercicios.filter(function (e) { return receitasDe(e.enunciado); }).map(function (e) { return e.n; }).join(' ') || 'nenhum', 'nenhum');
conf('e o gabarito tem 9 (10, 11, 12, 13, 15, 16, 17, 18 e 19)', (docGab.figurasDesenhadas || []).length, 9);
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
/* As diretivas sao IGUAIS nas duas linguas, numero por numero: neste tema nao
 * ha legenda nem rotulo de palavra, entao a diretiva inteira tem que bater. */
function diretivasDe(texto) {
  const saida = [];
  new PDFGen.Doc().partesDeFigura(texto).forEach(function (p) { if (p.tipo === 'figura') saida.push(p.diretiva.bruto); });
  return saida.join(' | ');
}
let iguais = diretivasDe(tema.pt.explicacao) === diretivasDe(tema.en.explicacao);
tema.pt.exercicios.forEach(function (ex, i) {
  const en = tema.en.exercicios[i];
  if (diretivasDe(ex.enunciado) !== diretivasDe(en.enunciado) || diretivasDe(ex.resposta) !== diretivasDe(en.resposta)) iguais = false;
});
conf('e as diretivas sao identicas nas duas linguas, numero por numero', iguais, true);

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
 *
 * Tudo lido do registro.medido de cada figura (o fluxo de conteudo dela, lido
 * pelo lerFluxo do base.js), e nao do que a receita disse que ia desenhar:
 *
 *   plano      a origem e o cruzamento do eixo x (o segmento horizontal mais
 *              longo de 0,9 pt) com o eixo y (o vertical mais longo); a
 *              unidade e a escala do registro
 *   circulo    todo arco de volta inteira tem o raio que a diretiva pediu
 *              (raio= e o raio de outra=), em unidades
 *   reta       os dois extremos do segmento obliquo mais longo satisfazem
 *              Ax + By + C = 0 nas coordenadas lidas do papel
 *   d          o segmento que parte do centro mede a distancia do centro a
 *              reta (distancia=) ou ao ponto (cota=), pela conta
 *   ponto      ha uma bolinha na posicao que ponto=x;y manda
 *
 * A isotropia (a circunferencia e redonda) e medida como no
 * _prova_receitas_circulo.js, na caixa envolvente da propria curva impressa. */
console.log('\nmedicao no fluxo');

function todosDaDiretiva(bruto, chave) {
  const saida = [], rx = new RegExp('(^|\\s)' + chave + '=(\\S+)', 'g');
  let m;
  while ((m = rx.exec(String(bruto || '')))) saida.push(m[2]);
  return saida;
}
function primeiroDaDiretiva(bruto, chave) { const v = todosDaDiretiva(bruto, chave); return v.length ? v[0] : null; }
function numeroOuNulo(s) { return /^-?\d+(\.\d+)?$/.test(String(s)) ? parseFloat(s) : null; }
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function segmentos09(f) {
  return ((f.medido || {}).segmentos || []).filter(function (s) { return !s.varredura && Math.abs(s.w - 0.9) < 0.01; })
    .map(function (s) { return { a: { x: s.x1, y: s.y1 }, b: { x: s.x2, y: s.y2 }, L: Math.hypot(s.x2 - s.x1, s.y2 - s.y1) }; });
}
function planoDaFigura(f) {
  const segs = segmentos09(f);
  const hs = segs.filter(function (s) { return Math.abs(s.a.y - s.b.y) < 0.05; }).sort(function (u, v) { return v.L - u.L; });
  const vs = segs.filter(function (s) { return Math.abs(s.a.x - s.b.x) < 0.05; }).sort(function (u, v) { return v.L - u.L; });
  if (!hs.length || !vs.length) return null;
  const O = { x: vs[0].a.x, y: hs[0].a.y }, k = f.escala;
  return { O: O, k: k, segs: segs, xy: function (p) { return { x: (p.x - O.x) / k, y: (p.y - O.y) / k }; },
    pagina: function (q) { return { x: O.x + q.x * k, y: O.y + q.y * k }; } };
}
function voltasDaFigura(f) {
  return ((f.medido || {}).arcos || []).filter(function (a) { return a.abertura >= 359.9; });
}
function bolinhasDe(f) {
  return ((f.medido || {}).areas || []).map(function (a) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    a.pts.forEach(function (p) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); });
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    let rmin = Infinity, rmax = 0;
    a.pts.forEach(function (p) { const r = Math.hypot(p.x - cx, p.y - cy); rmin = Math.min(rmin, r); rmax = Math.max(rmax, r); });
    return { x: cx, y: cy, l: x1 - x0, h: y1 - y0, redondeza: rmax / (rmin || 1e-9), cor: a.cor || [0, 0, 0] };
  }).filter(function (c) {
    return c.l > 1 && c.l < 8 && c.h > 1 && c.h < 8 && c.redondeza < 1.15 && (c.cor[0] + c.cor[1] + c.cor[2]) < 1.5;
  });
}
function centroDaDiretiva(bruto) {
  const c = primeiroDaDiretiva(bruto, 'centro');
  if (!c) return { x: 0, y: 0 };
  const p = c.split(';');
  if (p.length >= 2 && numeroOuNulo(p[0]) !== null && numeroOuNulo(p[1]) !== null) return { x: parseFloat(p[0]), y: parseFloat(p[1]) };
  return { x: 0, y: 0 };
}

const todasAsFiguras = [docPT, docGab, docEN, docGabEN].reduce(function (o, d) { return o.concat(d.figurasDesenhadas || []); }, []);
const circulos = todasAsFiguras.filter(function (f) { return f.receita === 'circulo'; });

/* (a) o raio impresso e o pedido, em toda circunferencia de toda figura */
let raiosLidos = 0, raiosCertos = 0, piorRaio = 0;
circulos.forEach(function (f) {
  const pedidos = [];
  const r = primeiroDaDiretiva(f.diretiva, 'raio');
  if (r !== null && numeroOuNulo(r.split(';')[0]) !== null) pedidos.push(parseFloat(r.split(';')[0]));
  const o = primeiroDaDiretiva(f.diretiva, 'outra');
  if (o !== null) pedidos.push(parseFloat(o.split(';')[2]));
  if (!pedidos.length) pedidos.push(5);   // o raio chutado da receita (raio=r ou sem raio)
  const impressos = voltasDaFigura(f).map(function (a) { return a.raio / f.escala; });
  pedidos.forEach(function (rp) {
    raiosLidos++;
    let melhor = Infinity;
    impressos.forEach(function (ri) { melhor = Math.min(melhor, Math.abs(ri - rp)); });
    piorRaio = Math.max(piorRaio, melhor);
    if (melhor < 0.02) raiosCertos++;
  });
});
medido(raiosLidos + ' raios pedidos em ' + circulos.length + ' figuras de circulo; pior desvio ' + n2c(piorRaio) + ' unidades');
conf('toda circunferencia impressa tem o raio que a diretiva pediu', raiosCertos, raiosLidos);

/* (b) redonda: caixa envolvente da curva impressa 2r por 2r (leitor de caminhos) */
function lerCaminhos(ops) {
  const toks = [];
  for (const s of ops) { if (String(s).indexOf('BT ') === 0) continue; for (const t of String(s).split(/\s+/)) if (t) toks.push(t); }
  const subs = [];
  let atual = null, pilha = [];
  const num = (k) => { const v = pilha[pilha.length - k]; return v === undefined ? 0 : v; };
  for (const t of toks) {
    const v = parseFloat(t);
    if (!isNaN(v) && /^[-+]?[\d.]+$/.test(t)) { pilha.push(v); continue; }
    switch (t) {
      case 'm': atual = { pts: [{ x: num(2), y: num(1) }], trechos: [] }; subs.push(atual); break;
      case 'l': if (atual) { const a = atual.pts[atual.pts.length - 1], b = { x: num(2), y: num(1) }; atual.trechos.push({ p0: a, c1: a, c2: b, p3: b, reta: true }); atual.pts.push(b); } break;
      case 'c': if (atual) { const a = atual.pts[atual.pts.length - 1]; const p3 = { x: num(2), y: num(1) }; atual.trechos.push({ p0: a, c1: { x: num(6), y: num(5) }, c2: { x: num(4), y: num(3) }, p3: p3, reta: false }); atual.pts.push(p3); } break;
      case 'S': case 'B': case 'B*': if (atual) atual.pintado = 'traco'; atual = null; break;
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
let voltas = 0, piorAniso = 0;
[docPT, docGab].forEach(function (d) {
  (d.paginas || []).forEach(function (pag) {
    lerCaminhos(pag.ops || []).filter((s) => s.pintado === 'traco' && s.trechos.length === 4 && s.trechos.every((t) => !t.reta)).forEach(function (s) {
      const c = caixaDe(pontosDoSub(s, 24));
      if (c.largura < 20) return;
      voltas++;
      piorAniso = Math.max(piorAniso, Math.abs(c.largura - c.altura));
    });
  });
});
medido(voltas + ' circunferencias no material e no gabarito, pior anisotropia ' + n2c(piorAniso) + ' pt');
conf('toda circunferencia e redonda: anisotropia abaixo de 0,5 pt', voltas > 0 && piorAniso < 0.5, true);

/* (c) a reta impressa passa pelos pontos que a equacao diz, e a perpendicular mede d */
let retas = 0, retasOk = 0, perps = 0, perpsOk = 0;
circulos.forEach(function (f) {
  const rv = primeiroDaDiretiva(f.diretiva, 'reta');
  if (!rv) return;
  const p = rv.split(';');
  if (p.length < 3 || numeroOuNulo(p[0]) === null) return;   // reta generica: sem equacao a conferir
  const A = parseFloat(p[0]), B = parseFloat(p[1]), C = parseFloat(p[2]);
  const P = planoDaFigura(f);
  if (!P) { retas++; medido((f.id || 'explicacao') + ': plano nao achado'); return; }
  /* A reta e o segmento obliquo mais longo que NAO parte do centro: a
   * perpendicular tambem e obliqua e, numa janela apertada, pode ser mais
   * comprida do que o trecho visivel da reta. */
  const centroPg = P.pagina(centroDaDiretiva(f.diretiva));
  const obliquos = P.segs.filter((s) => Math.abs(s.a.y - s.b.y) > 0.05 && Math.abs(s.a.x - s.b.x) > 0.05 &&
    dist(s.a, centroPg) > 0.6 && dist(s.b, centroPg) > 0.6).sort((u, v) => v.L - u.L);
  const reta = obliquos[0];
  retas++;
  const res = reta ? [reta.a, reta.b].map((q) => { const u = P.xy(q); return A * u.x + B * u.y + C; }) : [Infinity];
  const bom = res.every((v) => Math.abs(v) < 0.05);
  if (bom) retasOk++;
  const centroU = centroDaDiretiva(f.diretiva);
  const dConta = Math.abs(A * centroU.x + B * centroU.y + C) / Math.hypot(A, B);
  let texto = (f.id || 'explicacao') + ': reta ' + A + 'x + ' + B + 'y + ' + C + ' = 0, residuo nos extremos impressos ' + res.map(n2c).join(' e ');
  if (primeiroDaDiretiva(f.diretiva, 'distancia') !== null) {
    const Cp = P.pagina(centroU);
    const perp = P.segs.filter((s) => (dist(s.a, Cp) < 0.6 || dist(s.b, Cp) < 0.6) && s !== reta).sort((u, v) => v.L - u.L)[0];
    perps++;
    const dLida = perp ? perp.L / P.k : NaN;
    if (perp && Math.abs(dLida - dConta) < 0.02) perpsOk++;
    texto += '; perpendicular impressa ' + n2c(dLida) + ' unidades, a conta da ' + n2c(dConta);
  }
  medido(texto + (bom ? '' : '  <<< a reta nao passa onde a equacao diz'));
});
conf('retas com equacao: ' + retas + ', todas passando pelos pontos que a equacao diz', retasOk, retas);
conf('perpendiculares cotadas: ' + perps + ', todas medindo a distancia da conta', perpsOk, perps);

/* (d) todo ponto=x;y tem a sua bolinha onde as coordenadas mandam, e cota= mede a distancia ao centro */
let pontos = 0, pontosOk = 0, cotas = 0, cotasOk = 0;
circulos.forEach(function (f) {
  const pv = todosDaDiretiva(f.diretiva, 'ponto').map((s) => s.split(';')).filter((p) => p.length >= 2 && numeroOuNulo(p[0]) !== null && numeroOuNulo(p[1]) !== null);
  if (!pv.length) return;
  const P = planoDaFigura(f);
  if (!P) return;
  const dots = bolinhasDe(f);
  const centroU = centroDaDiretiva(f.diretiva);
  const cv = todosDaDiretiva(f.diretiva, 'cota');
  pv.forEach(function (p, i) {
    const alvo = P.pagina({ x: parseFloat(p[0]), y: parseFloat(p[1]) });
    let perto = Infinity;
    dots.forEach((b) => { perto = Math.min(perto, dist(b, alvo)); });
    pontos++;
    if (perto < 0.5) pontosOk++;
    if (i < cv.length) {
      const Cp = P.pagina(centroU);
      const seg = P.segs.filter((s) => (dist(s.a, Cp) < 0.6 && dist(s.b, alvo) < 0.6) || (dist(s.b, Cp) < 0.6 && dist(s.a, alvo) < 0.6))[0];
      cotas++;
      const dConta = Math.hypot(parseFloat(p[0]) - centroU.x, parseFloat(p[1]) - centroU.y);
      if (seg && Math.abs(seg.L / P.k - dConta) < 0.02) cotasOk++;
      medido((f.id || 'explicacao') + ': ponto (' + p[0] + ', ' + p[1] + ') a ' + n2c(perto) + ' pt da bolinha mais proxima; segmento ate o centro ' + (seg ? n2c(seg.L / P.k) : '?') + ' unidades, a conta da ' + n2c(dConta));
    } else {
      medido((f.id || 'explicacao') + ': ponto (' + p[0] + ', ' + p[1] + ') a ' + n2c(perto) + ' pt da bolinha mais proxima');
    }
  });
});
conf('pontos por coordenadas: ' + pontos + ', todos com a bolinha no lugar', pontosOk, pontos);
conf('distancias ate um ponto cotadas: ' + cotas + ', todas medindo a conta', cotasOk, cotas);
conf('houve o que medir (retas, perpendiculares, pontos): ', retas > 0 && perps > 0 && pontos > 0, true);

/* ================================================================ leitura da folha
 * As travas 1 e 2 sao as do _piloto_MATEM3-04.js. As travas 3 e 4 sao deste
 * tema: a letra da distancia repousa no segmento que ela mede, e o nome (ou o
 * par de coordenadas) de cada ponto fica mais perto da bolinha dele do que de
 * qualquer outra bolinha da figura. */
console.log('\nleitura da folha');
function nomeDaFigura(f) { return f.id || f.receita || '?'; }

/* 1. Dois rotulos na mesma linha de base viram um rotulo so.
 * Os numeros da escala de um eixo ficam de fora: eles moram na mesma linha de
 * base POR CONSTRUCAO e se leem em sequencia, como uma regua, e o proprio
 * eixos() ja mede que a caixa de um nao invade a do vizinho. Medido no 18
 * (raio 13, passo 4): "-12" e "-8" a 11,11 pt, legiveis e separados. */
const FOLGA_MINIMA = 14;
const NUMERO_PURO = /^-?\d+([.,]\d+)?$/;
/* Numero da escala: numero puro que mora na faixa de numeros de um eixo, ou
 * seja logo abaixo do eixo x ou logo a esquerda do eixo y. O "O" da origem ao
 * lado do primeiro tique ("-2   O", medido a 13,95 pt no 19) e a montagem do
 * livro, e o tique nao e rotulo da figura. Uma cota numerica ("5" da
 * translacao) continua entrando na conta, porque nao mora na faixa. */
function ehNumeroDeEscala(f, t) {
  if (!NUMERO_PURO.test(String(t.txt).trim())) return false;
  const P = planoDaFigura(f);
  if (!P) return false;
  const abaixoDoX = t.y < P.O.y && t.y > P.O.y - 16;
  const esquerdaDoY = t.x + t.largura < P.O.x && t.x + t.largura > P.O.x - 16;
  return abaixoDoX || esquerdaDoY;
}
let piorFolga = { pt: Infinity, onde: 'nenhum par na mesma linha de base' };
todasAsFiguras.forEach(function (f) {
  const ts = ((f.medido || {}).textos || []).filter(function (t) { return String(t.txt).trim() && !ehNumeroDeEscala(f, t); });
  for (let i = 0; i < ts.length; i++) {
    for (let j = i + 1; j < ts.length; j++) {
      if (Math.abs(ts[i].y - ts[j].y) > 1.0) continue;
      const esq = ts[i].x <= ts[j].x ? ts[i] : ts[j];
      const dir = ts[i].x <= ts[j].x ? ts[j] : ts[i];
      const folga = dir.x - (esq.x + esq.largura);
      if (folga < piorFolga.pt) piorFolga = { pt: folga, onde: nomeDaFigura(f) + ' "' + esq.txt + '" e "' + dir.txt + '"' };
    }
  }
});
medido('menor folga entre dois rotulos na mesma linha de base: ' + piorFolga.pt.toFixed(2) + ' pt, em ' + piorFolga.onde);
conf('nenhum par de rotulos na mesma linha de base fica a menos de ' + FOLGA_MINIMA + ' pt', piorFolga.pt >= FOLGA_MINIMA, true);

/* 2. O rotulo do vertice da hiperbole tem que ser atribuivel (vazia neste
 * tema, que nao tem hiperbole; fica porque as travas 1 e 2 sao as da casa). */
let piorVertice = { razao: Infinity, onde: 'nenhuma figura com A1 e A2' };
todasAsFiguras.forEach(function (f) {
  const rot = ((f.medido || {}).textos || []).filter(function (t) { return /^A[12]$/.test(String(t.txt).trim()); });
  if (rot.length !== 2) return;
  piorVertice = { razao: 0, onde: nomeDaFigura(f) + ' tem A1 e A2 e este piloto nao mede hiperbole' };
});
medido(piorVertice.onde);
conf('nenhuma figura deste tema traz vertice de hiperbole', piorVertice.razao === Infinity, true);

/* 3. A letra da distancia repousa no segmento que ela mede.
 * Para cada figura com distancia= ou cota= em letra, o texto com essa letra
 * (sozinha ou como "d = valor" no gabarito) tem que estar mais perto do
 * segmento que parte do centro (a perpendicular, ou o segmento ate o ponto)
 * do que de qualquer outro traco de 0,9 pt, por 1,6 vezes. Sem isto o "d"
 * pousava no meio da escala do eixo x, entre o 4 e o 6 (medido em
 * centro=2;-1;C ponto=6;2;P cota=d antes do pouso escolhido pela geometria). */
const MARGEM_DA_COTA = 1.6;
function distanciaAteSegmento(caixa, s) {
  function doPonto(px, py) {
    const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y, L = dx * dx + dy * dy;
    let t = L ? ((px - s.a.x) * dx + (py - s.a.y) * dy) / L : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (s.a.x + t * dx), py - (s.a.y + t * dy));
  }
  let d = Infinity;
  for (let i = 0; i <= 16; i++) {
    const fx = caixa.x0 + (caixa.x1 - caixa.x0) * i / 16, fy = caixa.y0 + (caixa.y1 - caixa.y0) * i / 16;
    d = Math.min(d, doPonto(fx, caixa.y0), doPonto(fx, caixa.y1), doPonto(caixa.x0, fy), doPonto(caixa.x1, fy));
  }
  return d;
}
let letrasLidas = 0, letraFora = [], piorLetra = { razao: Infinity, onde: 'nenhuma letra de distancia' };
circulos.forEach(function (f) {
  const letras = [];
  const dv = primeiroDaDiretiva(f.diretiva, 'distancia');
  if (dv !== null) { const p = dv.split(';'); const l = p[p.length - 1]; if (/^[A-Za-z]$/.test(l)) letras.push(l); }
  todosDaDiretiva(f.diretiva, 'cota').forEach(function (c) { const p = c.split(';'); const l = p[p.length - 1]; if (/^[A-Za-z]$/.test(l)) letras.push(l); });
  if (!letras.length) return;
  const segs = segmentos09(f);
  const centros = voltasDaFigura(f).map((a) => ({ x: a.cx, y: a.cy }));
  const doCentro = (s) => centros.some((c) => dist(s.a, c) < 0.6 || dist(s.b, c) < 0.6);
  letras.forEach(function (letra) {
    ((f.medido || {}).textos || []).filter((t) => String(t.txt).trim() === letra || String(t.txt).indexOf(letra + ' = ') === 0).forEach(function (t) {
      letrasLidas++;
      const caixa = { x0: t.x, y0: t.y, x1: t.x + t.largura, y1: t.y + t.tam * 0.72 };
      const ordenados = segs.map((s) => ({ d: distanciaAteSegmento(caixa, s), s: s })).sort((u, v) => u.d - v.d);
      const perto = ordenados[0];
      const onde = nomeDaFigura(f) + ' "' + t.txt + '"';
      if (!perto || !doCentro(perto.s)) { letraFora.push(onde + ': o traco mais proximo nao parte do centro'); return; }
      const outro = ordenados.find((o) => !doCentro(o.s) || o.s !== perto.s);
      const razao = outro ? outro.d / Math.max(perto.d, 1e-6) : Infinity;
      if (razao < piorLetra.razao) piorLetra = { razao: razao, onde: onde + ' a ' + n2c(perto.d) + ' pt do seu segmento e a ' + (outro ? n2c(outro.d) : 'nenhum') + ' pt do traco seguinte' };
    });
  });
});
medido('letras de distancia lidas: ' + letrasLidas + '; a de menor margem e ' + piorLetra.onde + ' (razao ' + piorLetra.razao.toFixed(2) + ')');
conf('toda letra de distancia repousa no segmento que parte do centro', letraFora.join('; ') || 'nenhuma fora do lugar', 'nenhuma fora do lugar');
conf('e ganha do traco seguinte por ao menos ' + MARGEM_DA_COTA + ' vezes', letrasLidas > 0 && piorLetra.razao >= MARGEM_DA_COTA, true);

/* 4. O nome de cada ponto fica mais perto da bolinha dele do que de qualquer
 * outra bolinha. O ponto vem da diretiva (ponto=x;y;N, ou o par "(x, y)"
 * quando nao ha nome; o centro com nome, o centro da outra=), a posicao dele
 * vem do plano lido na folha, e a bolinha concorrente e qualquer outra. */
let nomesLidos = 0, nomeErrado = [], piorNome = { razao: Infinity, onde: 'nenhum nome de ponto' };
circulos.forEach(function (f) {
  const P = planoDaFigura(f);
  if (!P) return;
  const esperados = [];
  todosDaDiretiva(f.diretiva, 'ponto').forEach(function (v) {
    const p = v.split(';');
    if (p.length < 2 || numeroOuNulo(p[0]) === null || numeroOuNulo(p[1]) === null) return;
    const texto = p.length > 2 ? p[2] : ('(' + p[0] + ', ' + p[1] + ')');
    esperados.push({ texto: texto, pos: P.pagina({ x: parseFloat(p[0]), y: parseFloat(p[1]) }) });
  });
  const cv = primeiroDaDiretiva(f.diretiva, 'centro');
  if (cv !== null) {
    const p = cv.split(';');
    if (p.length === 1 && /^[A-Za-z]$/.test(p[0])) esperados.push({ texto: p[0], pos: P.pagina({ x: 0, y: 0 }) });
    else if (p.length >= 3 && numeroOuNulo(p[0]) !== null) esperados.push({ texto: p[2], pos: P.pagina({ x: parseFloat(p[0]), y: parseFloat(p[1]) }) });
  }
  const ov = primeiroDaDiretiva(f.diretiva, 'outra');
  if (ov !== null) { const p = ov.split(';'); if (p.length > 3) esperados.push({ texto: p[3], pos: P.pagina({ x: parseFloat(p[0]), y: parseFloat(p[1]) }) }); }
  const dots = bolinhasDe(f);
  esperados.forEach(function (e) {
    const t = ((f.medido || {}).textos || []).filter((x) => String(x.txt).trim() === e.texto)[0];
    if (!t) { nomeErrado.push(nomeDaFigura(f) + ' "' + e.texto + '" nao saiu impresso'); return; }
    nomesLidos++;
    const c = { x: t.x + t.largura / 2, y: t.y + t.tam * 0.35 };
    const minha = dist(c, e.pos);
    let outra = Infinity;
    dots.forEach((b) => { if (dist(b, e.pos) > 1) outra = Math.min(outra, dist(c, b)); });
    if (outra <= minha) nomeErrado.push(nomeDaFigura(f) + ' "' + e.texto + '" a ' + n2c(minha) + ' pt do seu ponto e a ' + n2c(outra) + ' pt de outra bolinha');
    const razao = outra / Math.max(minha, 1e-6);
    if (razao < piorNome.razao) piorNome = { razao: razao, onde: nomeDaFigura(f) + ' "' + e.texto + '" a ' + n2c(minha) + ' pt do seu ponto e a ' + n2c(outra) + ' pt da bolinha vizinha' };
  });
});
medido('nomes de ponto lidos: ' + nomesLidos + '; o de menor margem e ' + piorNome.onde + ' (razao ' + piorNome.razao.toFixed(2) + ')');
conf('todo nome de ponto fica mais perto da bolinha dele do que de qualquer outra', nomeErrado.join('; ') || 'nenhum trocado', 'nenhum trocado');
conf('e por ao menos 1,7 vezes (o piso do vertice da hiperbole)', nomesLidos > 0 && piorNome.razao >= 1.7, true);

/* 5. Nenhum numero de escala e riscado pela circunferencia.
 * A leitura do ver_tiques.py do verificador deste tema, refeita no fluxo de
 * cada figura: todo arco com traco de 1,1 a 1,3 pt (a circunferencia, 1,2 pt;
 * a reta e os eixos sao retos e ficam de fora) e amostrado, e um numero puro
 * em corpo pequeno esta riscado quando a caixa dele, encolhida em 1 pt de
 * cada lado para o roce nao contar, contem um ponto amostrado. Medido nos
 * PDFs antes do conserto: 11 numeros por lingua (o 3 e o -1 do eixo y no
 * Exemplo 4; o -2 e o 6 do eixo x e o 2 e o -4 do eixo y no g11; o 2 e o 4 do
 * eixo x no g17; o -12 e o 12 nos dois eixos do g18), e 0 no MATEM3-12, que
 * nao tem plano. A caixa e a do glifo lido no fluxo (linha de base e altura
 * de digito) em vez da caixa de palavra do MuPDF; encolhidas, as duas cobrem
 * o mesmo miolo do numero. */
let riscados = [];
todasAsFiguras.forEach(function (f) {
  const arcos = ((f.medido || {}).arcos || []).filter((a) => a.w >= 1.1 && a.w <= 1.3);
  if (!arcos.length) return;
  const pontos = [];
  arcos.forEach(function (a) {
    const n = Math.max(64, Math.round(a.abertura * 2));
    for (let i = 0; i <= n; i++) {
      const g = (a.de + a.varre * i / n) * Math.PI / 180;
      pontos.push({ x: a.cx + a.raio * Math.cos(g), y: a.cy + a.raio * Math.sin(g) });
    }
  });
  ((f.medido || {}).textos || []).forEach(function (t) {
    if (!NUMERO_PURO.test(String(t.txt).trim()) || t.tam >= 12) return;
    const q = { x0: t.x + 1, x1: t.x + t.largura - 1, y0: t.y - 0.2 * t.tam + 1, y1: t.y + 0.75 * t.tam - 1 };
    if (q.x1 <= q.x0 || q.y1 <= q.y0) return;
    if (pontos.some((p) => p.x >= q.x0 && p.x <= q.x1 && p.y >= q.y0 && p.y <= q.y1)) {
      riscados.push(nomeDaFigura(f) + ' "' + t.txt + '" em (' + n2c(t.x) + ', ' + n2c(t.y) + ')');
    }
  });
});
medido('numeros riscados por arco de 1,1 a 1,3 pt nas quatro folhas: ' + riscados.length + (riscados.length ? ' (' + riscados.join('; ') + ')' : ''));
conf('nenhum numero de escala tem a caixa atravessada pela circunferencia (eram 11 por lingua)', riscados.length, 0);

/* 6. Nenhum rotulo e impresso em cima de outro, em direcao nenhuma.
 * A trava 1 so olha pares na MESMA linha de base. O desvio de rotulo do
 * desenho.js foge de traco, marca e ponto, nunca de outro rotulo, entao dois
 * textos podem cair um sobre o outro sem aviso nenhum: medido na primeira
 * tentativa do conserto do g13, quando o "(3, 4)" subiu para onde o "s" da
 * reta mora e a folha imprimiu "(3 s 4)". A caixa e a do glifo lido no fluxo
 * (linha de base menos um quinto do corpo, ate tres quartos do corpo), e duas
 * caixas da mesma figura nao podem se cruzar. */
let sobrepostos = [];
todasAsFiguras.forEach(function (f) {
  const ts = ((f.medido || {}).textos || []).filter((t) => String(t.txt).trim());
  const caixa = (t) => ({ x0: t.x, x1: t.x + t.largura, y0: t.y - 0.2 * t.tam, y1: t.y + 0.75 * t.tam });
  for (let i = 0; i < ts.length; i++) {
    for (let j = i + 1; j < ts.length; j++) {
      const a = caixa(ts[i]), b = caixa(ts[j]);
      const dx = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), dy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
      if (dx > 0.5 && dy > 0.5) sobrepostos.push(nomeDaFigura(f) + ' "' + ts[i].txt + '" e "' + ts[j].txt + '" (' + n2c(dx) + ' por ' + n2c(dy) + ' pt)');
    }
  }
});
medido('pares de rotulos com as caixas cruzadas nas quatro folhas: ' + sobrepostos.length + (sobrepostos.length ? ' (' + sobrepostos.join('; ') + ')' : ''));
conf('nenhum rotulo e impresso em cima de outro', sobrepostos.length, 0);

console.log('\n' + ok + ' conferencias passaram, ' + mau + ' falharam.');
[['pt', docPT], ['gb', docGab], ['en', docEN], ['en gb', docGabEN]].forEach(function (par) {
  (par[1].avisosFigura || []).forEach(function (a) { console.log('  ' + par[0] + ' . ' + a); });
});
process.exit(mau ? 1 : 0);
