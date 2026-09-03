/* figuras/_piloto_MAT08-13.js
 * Gera os documentos do MAT08-13, "Circulo: comprimento e area", pelo caminho
 * de verdade: o gerarMaterialTema do pdf.js, lendo o tema do temas/banco.json,
 * que e o mesmo arquivo que o tablet consome. Copia a forma do
 * _piloto_MAT07-12.js, que e o piloto em producao, e acrescenta a medicao no
 * fluxo que as receitas de curva pedem: circulo redondo e roda que anda pi.
 *
 * Uso: node _piloto_MAT08-13.js [caminho de outro banco.json ou de um tema solto]
 *   O segundo argumento existe para ensaiar contra um banco gerado fora do
 *   repositorio antes da unica rodada oficial do gerar_banco.py. Ele aceita as
 *   duas formas: o banco inteiro ({"temas": [...]}) ou o objeto de um tema so,
 *   do jeito que o gerar_banco.ler devolve, para provar uma edicao do .md sem
 *   regravar o temas/banco.json.
 *
 * Sai em quatro arquivos, tres em portugues e um em ingles:
 *   _exemplo_MAT08-13_material.pdf   explicacao, lista e gabarito
 *   _exemplo_MAT08-13_lista.pdf      so a lista, com espaco para responder
 *   _exemplo_MAT08-13_gabarito.pdf   so o gabarito (a camada pelo id, sozinha)
 *   _exemplo_MAT08-13_en.pdf         a folha inglesa inteira
 *
 * Regra da casa: nunca usar travessao.
 */
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');

const ID = 'MAT08-13';
const RAIZ = path.join(__dirname, '..');
const BANCO = process.argv[2] || path.join(RAIZ, 'temas', 'banco.json');
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

/* Nenhuma diretiva impressa como texto: o fluxo nao e comprimido, entao ela
 * apareceria dentro de um (...) Tj. */
[['material', material], ['lista', lista], ['gabarito', gabarito], ['ingles', ingles]]
  .forEach(function (par) {
    const cru = Buffer.from(par[1]).toString('latin1');
    conf('nenhuma diretiva saiu impressa no ' + par[0], /@fig/.test(cru), false);
  });

/* A trava bilingue estrutural do piloto: toda peca de texto da folha inglesa,
 * recusando marca de portugues, seja qual for. */
const NAO_TRADUZ = ['Nathália Wajsenzon', 'APOIO EDUCACIONAL',
  'Nathália Wajsenzon · Apoio Educacional', 'NW'];
const MARCA_PT = /ção|ções|ângul|Página|Aluno|Gabarito|Exercícios|círcul|circunfer|coroa|setor|fatia|região|hachurad|soma |graus|ê|õ|ç|ã/;

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

/* Reexecuta com um Doc proprio para olhar o registro de cada figura. */
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

/* As quantidades sao escolha editorial e ficam escritas aqui para nao mudarem
 * em silencio: 4 na explicacao, 5 em 20 enunciados, 1 no gabarito. */
const diretivasExplic = receitasDe(tema.pt.explicacao).split(' ').filter(function (s) { return s; }).length;
conf('a explicacao tem 4 figuras', diretivasExplic, 4);
conf('e as 4 foram desenhadas', (docPT.figurasDesenhadas || []).length - 5, 4);
conf('mais as 5 figuras dos enunciados (7, 13, 16, 17 e 20)',
  tema.pt.exercicios.filter(function (e) { return receitasDe(e.enunciado); }).map(function (e) { return e.n; }).join(' '),
  '7 13 16 17 20');
conf('e a 1 do gabarito (18)', (docGab.figurasDesenhadas || []).length, 1);
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

/* ================================================================ trava editorial
 *
 * Uma coisa que o desenhador nao tem como conferir sozinho, porque mora no
 * texto do tema e nao na figura.
 *
 * (Nota para quem vier depois: a pizza do c7 e a unica diretiva circulo do
 * tema sem centro=, e e de proposito. Pondo centro=O nela, o nomearPonto so
 * tenta as quatro diagonais e na pizza de 8 fatias as quatro caem EM CIMA de
 * cortes: o aviso "rotulo O: nao ha posicao livre para o halo, saiu em tarja
 * estreita" aparece nas folhas pt e en, e a tarja apaga um pedaco do corte de
 * baixo a esquerda. Quem ler o diametro certo ja tem a cota por fora, com
 * ponta nos dois extremos dos 88,58 pt. Nao reponha o centro= antes de a
 * receita saber pousar a letra na bissetriz da fatia.)
 *
 * Nenhum exercicio repete os dados de um passo ja resolvido na explicacao.
 *
 * A folha de estudo traz o enunciado, a lista e o gabarito no mesmo PDF. Se um
 * exercicio usa os MESMOS numeros de um exemplo resolvido e chega ao MESMO
 * resultado, a aluna responde folheando duas paginas para tras e o exercicio
 * deixa de medir qualquer coisa. Passo resolvido aqui e o paragrafo que comeca
 * por "**Exemplo" ("**Example") ou a linha do tipo "Se o comprimento e ...,
 * entao ..." ("If the circumference is ..., then ..."), que e a forma que a
 * subsecao de voltar ao raio usa.
 *
 * Esta e a UNICA conferencia do piloto que le o .md em vez do banco, e de
 * proposito: ela julga o texto do tema, e o temas/banco.json so recebe a
 * edicao na unica rodada do gerar_banco.py, que acontece depois. Lendo o banco,
 * a trava acusaria o clone que o .md ja nao tem e reprovaria o portao de merge
 * por atraso de compilacao, nao por defeito. As secoes saem por posicao (a
 * primeira "###" de cada lingua e a explicacao, a segunda os exercicios, a
 * terceira o gabarito), para nao repetir o titulo em duas linguas. */
const FONTE = path.join(RAIZ, 'temas', 'mat', '08', ID + '.md');
function secoesDoMd() {
  const cru = fs.readFileSync(FONTE, 'utf8').replace(/\r\n/g, '\n');
  const o = {};
  ['PT', 'EN'].forEach(function (marca) {
    const parte = (cru.split(new RegExp('^## ' + marca + '$', 'm'))[1] || '').split(/^## /m)[0];
    const blocos = parte.split(/^### [^\n]*\n/m).slice(1);
    o[marca.toLowerCase()] = {
      explicacao: blocos[0] || '',
      exercicios: itensNumerados(blocos[1] || ''),
      exerciciosBruto: blocos[1] || '',
      gabarito: itensNumerados(blocos[2] || '')
    };
  });
  return o;
}
/* O mesmo laco do itens_numerados do verificar.py: a linha "N. " abre o item e
 * cada linha seguinte que nao abre outro se cola nele. */
function itensNumerados(bloco) {
  const itens = {};
  let atual = null;
  bloco.split('\n').forEach(function (linha) {
    const abre = linha.match(/^(\d+)\.\s+(.*)$/);
    if (abre) { atual = abre[1]; itens[atual] = abre[2]; return; }
    if (/^\s*$/.test(linha) || /^[#*]/.test(linha)) { atual = null; return; }
    if (atual) itens[atual] += ' ' + linha.trim();
  });
  return itens;
}
function numerosDe(texto) {
  const achados = String(texto || '').match(/-?\d+(?:[.,]\d+)?/g) || [];
  return [...new Set(achados.map(function (s) { return s.replace(',', '.'); }))];
}
function passosResolvidos(explicacao) {
  return String(explicacao || '').split(/\n\s*\n/)
    .filter(function (p) {
      return /^\*\*Exempl[oa] \d|^\*\*Example \d/.test(p.trim()) ||
        /(^|\n)\s*(Se|If)\b[^\n]*=\s*-?\d/.test(p);
    })
    .map(function (p) { return numerosDe(p.replace(/^\*\*Exempl[oa] \d+\.\*\*|^\*\*Example \d+\.\*\*/, '')); });
}
function contem(grandes, pequenos) {
  return pequenos.length > 0 && pequenos.every(function (v) { return grandes.indexOf(v) >= 0; });
}
const fonte = secoesDoMd();
let clonados = [], conferidos = 0;
['pt', 'en'].forEach(function (lingua) {
  const secao = fonte[lingua];
  const passos = passosResolvidos(secao.explicacao);
  Object.keys(secao.exercicios).forEach(function (n) {
    const dados = numerosDe(secao.exercicios[n]), resp = numerosDe(secao.gabarito[n]);
    conferidos++;
    passos.forEach(function (p) {
      if (contem(p, dados) && contem(p, resp)) {
        const marca = lingua + ':' + n;
        if (clonados.indexOf(marca) < 0) clonados.push(marca);
      }
    });
  });
});
conf('o .md deu 20 exercicios com gabarito em cada lingua para a trava editorial', conferidos, 40);
conf('nenhum exercicio repete os dados e o resultado de um passo ja resolvido',
  clonados.join(' ') || 'nenhum', 'nenhum');

/* Vazamento PARCIAL no primeiro bloco, que a trava acima nao pega.
 *
 * A trava anterior so acusa o clone inteiro: dados E resultado do exercicio
 * dentro do mesmo passo ja resolvido. O exercicio 4 escapava por pouco, com o
 * raio 6 dos Exemplos 3 e 4, que imprimem "A area total e 36pi" duas paginas
 * antes: o gabarito do 4 pedia "36 x 3,14 = 113,04" e a unica coisa que o
 * exercicio queria cobrar, elevar o raio ao quadrado, ja estava na folha. A
 * aluna que folheia para tras achava 36pi pronto e so multiplicava.
 *
 * A regra vale para o PRIMEIRO bloco, que e onde a formula crua e treinada: um
 * exercicio de Fundamentos nao pode usar um dado v cujo quadrado o gabarito
 * dele cita E que algum passo ja resolvido imprime AO LADO do proprio v. Nos
 * blocos B e C o exercicio pede uma composicao (coroa, regiao entre figuras,
 * volta da roda) e reaproveitar um quadrado ja visto e economia de leitura, nao
 * gabarito adiantado, entao a regra nao se aplica la: o exercicio 12 usa 25pi
 * do Exemplo 2 e continua tendo que achar 144pi e subtrair.
 *
 * O 3,14 e o 360 saem da conta de dados: sao as duas constantes que o proprio
 * enunciado entrega, e nao dado do problema. Sem tirar, o Exemplo 1 (que cita
 * 3,14) casaria com quase todo enunciado que manda usar a aproximacao. */
const CONSTANTES_ENTREGUES = ['3.14', '360'];
function numerosDoPrimeiroBloco(bruto) {
  /* O corpo entre o primeiro cabecalho de bloco e o segundo. */
  const partes = String(bruto || '')
    .split(/^\*\*(?:Bloco|Block)\s+[A-C][.．]?[^\n]*\*\*\s*$/m);
  const corpo = partes.length > 1 ? partes[1] : '';
  const ns = [];
  corpo.split('\n').forEach(function (linha) {
    const abre = linha.match(/^(\d+)\.\s+/);
    if (abre) ns.push(abre[1]);
  });
  return ns;
}
let adiantados = [], noPrimeiroBloco = 0;
['pt', 'en'].forEach(function (lingua) {
  const secao = fonte[lingua];
  const passos = passosResolvidos(secao.explicacao);
  numerosDoPrimeiroBloco(secao.exerciciosBruto).forEach(function (n) {
    noPrimeiroBloco++;
    const dados = numerosDe(secao.exercicios[n]).filter(function (v) {
      return CONSTANTES_ENTREGUES.indexOf(v) < 0;
    });
    const resp = numerosDe(secao.gabarito[n]);
    dados.forEach(function (v) {
      const q = String(Number(v) * Number(v));
      if (resp.indexOf(q) < 0) return;
      passos.forEach(function (p) {
        if (p.indexOf(v) >= 0 && p.indexOf(q) >= 0) {
          const marca = lingua + ':' + n + ' (' + v + ' ja elevado a ' + q + ')';
          if (adiantados.indexOf(marca) < 0) adiantados.push(marca);
        }
      });
    });
  });
});
conf('o primeiro bloco de cada lingua tem 5 exercicios para esta trava', noPrimeiroBloco, 10);
conf('nenhum exercicio do primeiro bloco usa um dado que a explicacao ja elevou ao quadrado',
  adiantados.join(' ') || 'nenhum', 'nenhum');

/* A figura da roda mostra a MESMA roda em tres instantes de uma volta, e nao
 * tres rodas enfileiradas. Quem ja sabe a materia le certo; quem esta
 * aprendendo conta tres rodas e a conta deixa de fazer sentido, porque a cota C
 * vai do chao da primeira ao chao da terceira. A receita rodando so aceita
 * raio/diametro e comprimento, e a ESPECIFICACAO restringe legenda de figura ao
 * aviso de escala e a glosa da hachura, entao a chave de leitura tem que estar
 * no ENUNCIADO, que e onde a especificacao manda o aviso de figura morar e o
 * lugar que a aluna le ANTES de olhar o desenho. */
const CHAVE_DA_RODA = { pt: /a mesma roda/i, en: /the same wheel/i };
let semChave = [], comRodando = 0;
['pt', 'en'].forEach(function (lingua) {
  const secao = fonte[lingua];
  Object.keys(secao.exercicios).forEach(function (n) {
    const texto = secao.exercicios[n];
    if (!/@fig\s+rodando\b/.test(texto)) return;
    comRodando++;
    if (!CHAVE_DA_RODA[lingua].test(texto)) semChave.push(lingua + ':' + n);
  });
});
conf('a receita rodando aparece em um enunciado de cada lingua', comRodando, 2);
conf('todo enunciado com a roda diz que as tres sao a mesma roda',
  semChave.join(' ') || 'nenhum', 'nenhum');

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
 * O mesmo leitor de caminhos da _prova_receitas_circulo.js: toda circunferencia
 * impressa no material tem caixa 2r por 2r, e a roda do exercicio 17 anda pi
 * vezes o diametro por meia volta. */
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
function voltasInteiras(subs) {
  return subs.filter((s) => s.pintado === 'traco' && s.trechos.length === 4 && s.trechos.every((t) => !t.reta) &&
    caixaDe(pontosDoSub(s, 8)).largura >= 20);
}

console.log('\nmedicao no fluxo');
let quantas = 0, piorAniso = 0, piorRadial = 0;
[docPT, docGab].forEach(function (d) {
  (d.paginas || []).forEach(function (pag) {
    for (const v of voltasInteiras(lerCaminhos(pag.ops || []))) {
      const pts = pontosDoSub(v, 24), c = caixaDe(pts), r = (c.largura + c.altura) / 4;
      let radial = 0;
      for (const p of pts) radial = Math.max(radial, Math.abs(dist(p, { x: c.cx, y: c.cy }) - r));
      quantas++;
      piorAniso = Math.max(piorAniso, Math.abs(c.largura - c.altura));
      piorRadial = Math.max(piorRadial, radial);
    }
  });
});
medido(quantas + ' circunferencias medidas no material e no gabarito');
conf('toda circunferencia e redonda: anisotropia abaixo de 0,5 pt', piorAniso < 0.5, true);
medido('pior anisotropia ' + piorAniso.toFixed(4) + ' pt, pior desvio radial ' + piorRadial.toFixed(4) + ' pt');

/* A roda do 17: tres rodas iguais, centros a 0, pi e 2 pi diametros. */
{
  const reg = (docPT.figurasDesenhadas || []).find((f) => f.id === 'c17');
  const pag = reg ? (docPT.paginas || [])[reg.pagina != null ? reg.pagina - 1 : (docPT.paginas.length - 1)] : null;
  let rodas = [];
  (docPT.paginas || []).forEach(function (p) {
    const vs = voltasInteiras(lerCaminhos(p.ops || [])).map((v) => caixaDe(pontosDoSub(v, 24)));
    const iguais = vs.filter((a) => vs.filter((b) => Math.abs(a.largura - b.largura) < 0.05 && Math.abs(a.cy - b.cy) < 0.05).length === 3);
    if (iguais.length === 3) rodas = iguais.sort((a, b) => a.cx - b.cx);
  });
  if (rodas.length === 3) {
    const d = rodas[0].largura;
    medido('roda: diametro impresso ' + d.toFixed(3) + ' pt; centros a ' + ((rodas[1].cx - rodas[0].cx) / d).toFixed(4) + ' d e ' + ((rodas[2].cx - rodas[0].cx) / d).toFixed(4) + ' d');
    conf('a roda anda pi diametros por volta (meia volta = pi/2 d, volta = pi d)',
      Math.abs((rodas[1].cx - rodas[0].cx) / d - Math.PI / 2) < 0.01 && Math.abs((rodas[2].cx - rodas[0].cx) / d - Math.PI) < 0.01, true);
  } else conf('as tres rodas do exercicio 17 foram impressas', rodas.length, 3);
  void reg; void pag;
}

console.log('\n' + ok + ' conferencias passaram, ' + mau + ' falharam.');
[['pt', docPT], ['gb', docGab], ['en', docEN], ['en gb', docGabEN]].forEach(function (par) {
  (par[1].avisosFigura || []).forEach(function (a) { console.log('  ' + par[0] + ' . ' + a); });
});
process.exit(mau ? 1 : 0);
