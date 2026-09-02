/* figuras/_prova_marcas_travas.js
 *
 * Prova por reversao. Cada conserto do marcas.js tem aqui uma figura que so
 * existe por causa dele, e o arquivo sabe DESLIGAR o conserto sem editar o
 * marcas.js: le o fonte, troca um trecho, escreve a variante ao lado e carrega
 * essa. Com o conserto ligado a figura passa; com ele desligado o defeito volta
 * e quem acusa e o conferirFigura do base.js, que e a trava do projeto, mais o
 * _audita_marcas.py, que mede o PDF por fora.
 *
 * Sem isto o relatorio seria "conferi e esta certo", que nao e prova: um
 * conserto conferido pela mesma conta que o produziu nao foi conferido.
 *
 *   node _prova_marcas_travas.js            todos os consertos ligados
 *   node _prova_marcas_travas.js --sem A    so o conserto A desligado
 *   node _prova_marcas_travas.js --tudo     roda os dois lados de cada conserto
 *
 * Sai com codigo 1 quando o resultado nao e o esperado (com o conserto ligado
 * tem que haver zero falha; com ele desligado, pelo menos uma).
 *
 * Regra da casa: nunca usar travessao.
 */
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');
const FigBase = require('./base.js');

const COR = PDFGen.COR;
const MARG = 40;

/* Os consertos, cada um com o trecho que o desliga. O anchor e literal de
 * proposito: se alguem reescrever a linha, este arquivo quebra em vez de passar
 * a testar outra coisa em silencio. */
const CONSERTOS = {
  A: {
    nome: 'o cruzamento nomeado ganha arco',
    acusa: /cruzamento nomeado/,
    trocas: [['resultado.arcoEncontro = marcaAngulo(',
              'resultado.arcoEncontro = (0) && marcaAngulo(']]
  },
  B: {
    nome: 'o rotulo desvia do traco em vez de abrir buraco nele',
    acusa: /separado do vertice|cobre um traco/,
    trocas: [['function caixaLivre(caixa, obstaculos, vizinhas) {',
              'function caixaLivre(caixa, obstaculos, vizinhas) { if (1) return true;'],
             ['function caminhoLivre(V, bis, distancia, obstaculos) {',
              'function caminhoLivre(V, bis, distancia, obstaculos) { if (1) return true;']]
  },
  C: {
    nome: 'a folga da seta sai da profundidade dela e nao do passo do tracinho',
    acusa: /pontas de seta/,
    trocas: [['var folgaSeta = Math.max(FOLGA_SETA, tamanho * RECUO_SETA + FOLGA_ENTRE_SETAS);',
              'var folgaSeta = 2.5;']]
  },
  D: {
    nome: 'o passo do tracinho sobrevive a segunda fotocopia',
    acusa: /tracinhos de congruencia/,
    trocas: [['var TAM_TRACO = 7.5;', 'var TAM_TRACO = 6;'],
             ['var FOLGA_TRACO = 4.0;', 'var FOLGA_TRACO = 2.5;']]
  },
  E: {
    nome: 'dois arcos no mesmo vertice se afastam em vez de emendar',
    acusa: /dois arcos no mesmo vertice/,
    trocas: [['var SEPARA_ARCO = 7;', 'var SEPARA_ARCO = 0;']]
  }
};

/* O auditor mede o PDF por fora, sem tocar em nenhuma conta deste modulo. Duas
 * das cinco reversoes so aparecem la: o conferirFigura nao tem trava de halo
 * sobre traco nem de rotulo separado do proprio vertice. */
function auditar(pdf) {
  const alvo = path.join(__dirname, pdf);
  let texto = '';
  try {
    texto = require('child_process').execFileSync(
      'python', [path.join(__dirname, '_audita_marcas.py'), alvo], { encoding: 'utf8' });
  } catch (e) {
    if (e && e.stdout) texto = String(e.stdout);
    else return ['o auditor nao rodou: ' + (e && e.message ? e.message : e)];
  }
  return texto.split('\n')
    .filter(function (l) { return l.indexOf('   ! ') === 0; })
    .map(function (l) { return l.trim().replace(/^!\s*/, ''); })
    /* A marca d'agua atravessando o bloco da figura e defeito de verdade e o
     * auditor a acusa em qualquer folha, mas ela nasce no base.js e nao neste
     * modulo: contada aqui, nenhuma reversao chegaria a zero e a prova perderia
     * o sinal. Fica registrada no relatorio, fora da conta. */
    .filter(function (l) { return !/marca d'agua/.test(l); });
}

/* Um arquivo por variante, e nao um so reescrito: o require do Node guarda o
 * modulo pelo NOME do arquivo, entao reescrevendo o mesmo nome a segunda
 * variante carregava o codigo da primeira e as tres ultimas reversoes passavam
 * testando o conserto errado. O rastro dos arquivos e apagado no fim. */
const variantes = [];

function carregarMarcas(sem) {
  if (!sem) return require('./marcas.js');
  const c = CONSERTOS[sem];
  if (!c) throw new Error('conserto desconhecido: ' + sem);
  let src = fs.readFileSync(path.join(__dirname, 'marcas.js'), 'utf8');
  c.trocas.forEach(function (par) {
    if (src.indexOf(par[0]) < 0) {
      throw new Error('o trecho do conserto ' + sem + ' nao esta mais no marcas.js: ' + par[0]);
    }
    src = src.split(par[0]).join(par[1]);
  });
  const variante = path.join(__dirname, '_prova_marcas_variante_' + sem + '.js');
  fs.writeFileSync(variante, src);
  variantes.push(variante);
  delete require.cache[require.resolve(variante)];
  return require(variante);
}

/* ================================================================ as figuras
 *
 * Cada uma e o caso minimo do conserto: nao ha desenho aqui que nao esteja
 * cobrando alguma coisa. As coordenadas sao as do PROBLEMA, e o figura() ajusta
 * a caixa com a mesma escala nos dois eixos, entao o formato do que se ve aqui e
 * o formato do que sai na folha. */

function contorno(ctx, P) {
  const pontos = [];
  for (let i = 0; i < P.length; i++) pontos.push(P[i]);
  for (let i = 0; i < pontos.length; i++) {
    const A = pontos[i], B = pontos[(i + 1) % pontos.length];
    ctx.doc.linha(A.x, A.y, B.x, B.y, COR.texto, 1.2);
    ctx.anota('traco', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, espessura: 1.2, papel: 'contorno' });
  }
}

function figuras(M) {
  return [
    {
      id: 'encontro',
      conserto: 'A',
      titulo: 'as duas diagonais do retangulo se encontram em O',
      unidades: { x0: 0, y0: 0, x1: 100, y1: 62 },
      desenhar: function (ctx) {
        const P = ctx.pontos([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 62 }, { x: 0, y: 62 }]);
        ctx.contorno(function () { contorno(ctx, P); });
        ctx.marcas(function () {
          M.diagonais(ctx.doc, P, { encontro: true, rotuloEncontro: 'O', ctx: ctx });
        });
      }
    },
    {
      id: 'halo',
      conserto: 'B',
      titulo: 'o valor do vertice obtuso, com o lado oposto logo ali',
      unidades: { x0: 0, y0: 0, x1: 100, y1: 80 },
      desenhar: function (ctx) {
        /* Este e o unico caso construido em PONTOS DE PAGINA e nao em unidades
         * do problema, e o motivo e que o defeito depende de uma distancia em
         * pontos: o lado oposto tem que cair exatamente onde a caixa do valor
         * pousa. Com a figura descrita em unidades, o ajuste a caixa mudaria a
         * escala e o caso deixaria de ser o caso. */
        const O = ctx.p({ x: 50, y: 40 });
        const L = 46, th = 110 * Math.PI / 180;
        const V = { x: O.x - 12, y: O.y - 20 };
        const P = [V, { x: V.x + L, y: V.y },
          { x: V.x + L * Math.cos(th), y: V.y + L * Math.sin(th) }];
        ctx.contorno(function () { contorno(ctx, P); });
        ctx.marcas(function () {
          M.marcaAngulo(ctx.doc, P[0], P[1], P[2], { rotulo: '110°', tam: 8.5, ctx: ctx });
        });
      }
    },
    {
      id: 'setas',
      conserto: 'C',
      titulo: 'o segundo par de paralelas, duas pontas de seta por lado',
      unidades: { x0: 0, y0: 0, x1: 120, y1: 60 },
      desenhar: function (ctx) {
        const P = ctx.pontos([{ x: 0, y: 0 }, { x: 90, y: 0 }, { x: 120, y: 60 }, { x: 30, y: 60 }]);
        ctx.contorno(function () { contorno(ctx, P); });
        ctx.marcas(function () {
          M.marcaLado(ctx.doc, P[0], P[1], { n: 1, tipo: 'seta', ctx: ctx });
          M.marcaLado(ctx.doc, P[3], P[2], { n: 1, tipo: 'seta', ctx: ctx });
          M.marcaLado(ctx.doc, P[1], P[2], { n: 2, tipo: 'seta', ctx: ctx });
          M.marcaLado(ctx.doc, P[0], P[3], { n: 2, tipo: 'seta', ctx: ctx });
        });
      }
    },
    {
      id: 'tracinhos',
      conserto: 'D',
      titulo: 'um, dois e tres tracinhos, que e a notacao de congruencia',
      unidades: { x0: 0, y0: 0, x1: 100, y1: 70 },
      desenhar: function (ctx) {
        const P = ctx.pontos([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 70 }]);
        ctx.contorno(function () { contorno(ctx, P); });
        ctx.marcas(function () {
          M.marcaLado(ctx.doc, P[0], P[1], { n: 1, ctx: ctx });
          M.marcaLado(ctx.doc, P[1], P[2], { n: 2, ctx: ctx });
          M.marcaLado(ctx.doc, P[2], P[0], { n: 3, ctx: ctx });
        });
      }
    },
    {
      id: 'doisarcos',
      conserto: 'E',
      titulo: 'o externo de 115 e o interno de 65 dividem o mesmo vertice',
      unidades: { x0: 0, y0: 0, x1: 112, y1: 94 },
      desenhar: function (ctx) {
        const V = { x: 82, y: 68 };
        const A = { x: 0, y: 0 }, B = { x: 100, y: 0 };
        /* O prolongamento de AV alem de V, que e o que faz o angulo externo
         * existir. Comprido de proposito: com o prolongamento curto o raio do
         * arco de fora cai sozinho e os dois se afastam por acidente e nao por
         * regra, que foi como o defeito passou despercebido na primeira leitura. */
        const dx = V.x - A.x, dy = V.y - A.y, n = Math.sqrt(dx * dx + dy * dy);
        const Q = { x: V.x + dx / n * 34, y: V.y + dy / n * 34 };
        const P = ctx.pontos([A, B, V]);
        const Pq = ctx.p(Q);
        ctx.contorno(function () {
          contorno(ctx, P);
          ctx.doc.linha(P[2].x, P[2].y, Pq.x, Pq.y, COR.texto, 1.2);
          ctx.anota('traco', {
            x1: P[2].x, y1: P[2].y, x2: Pq.x, y2: Pq.y,
            espessura: 1.2, papel: 'prolongamento'
          });
        });
        ctx.marcas(function () {
          /* O externo fica entre a PONTA DO PROLONGAMENTO e o outro lado que sai
           * do vertice, e nao entre o prolongamento e o lado prolongado, que sao
           * a mesma reta. O interno e o dos dois lados. Os dois compartilham a
           * semirreta VB, entao as faixas angulares se tocam e e ai que os arcos
           * emendam se ninguem os afastar. */
          M.marcaAngulo(ctx.doc, P[2], Pq, P[1], { rotulo: '115°', tam: 8.5, ctx: ctx });
          M.marcaAngulo(ctx.doc, P[2], P[0], P[1], { rotulo: '65°', tam: 8.5, ctx: ctx });
        });
      }
    }
  ];
}

/* ================================================================ a montagem */

function rodar(sem) {
  const M = carregarMarcas(sem);
  const doc = new PDFGen.Doc();
  doc.novaPagina();
  doc.texto('marcas: prova por reversao', MARG, doc.y - 4, { tam: 14, bold: true, cor: COR.navy });
  doc.texto(sem ? 'conserto ' + sem + ' DESLIGADO: ' + CONSERTOS[sem].nome
    : 'todos os consertos ligados', MARG, doc.y - 18, { tam: 8, cor: COR.muted });
  doc.y -= 34;

  const largura = (595.28 - 2 * MARG) / 2 - 8;
  const saida = [];
  let yLinha = doc.y, menorY = doc.y, col = 0;

  figuras(M).forEach(function (caso) {
    const x = MARG + col * (largura + 16);
    doc.y = yLinha;
    doc.texto(caso.titulo, x, doc.y, { tam: 7, cor: COR.muted });
    doc.y -= 9;
    const r = FigBase.figura(doc, {
      x: x, largura: largura, altura: 170, folga: 20,
      id: caso.id, unidades: caso.unidades,
      /* conferir=true e o que faz o conferirFigura REPROVAR e nao so avisar:
       * sem receita declarada ele guarda a conferencia e cala, e foi por isso
       * que o cruzamento sem arco atravessou a pagina de prova inteira sem que
       * ninguem visse. */
      conferir: true
    }, caso.desenhar);
    saida.push({ caso: caso, falhas: (r && r.conferencia) || [] });
    if (doc.y < menorY) menorY = doc.y;
    col++;
    if (col === 2) { col = 0; yLinha = menorY - 14; menorY = yLinha; }
  });

  const nome = '_prova_marcas_travas' + (sem ? '_sem' + sem : '') + '.pdf';
  fs.writeFileSync(path.join(__dirname, nome), doc.finalizar());
  return { nome: nome, saida: saida };
}

const argv = process.argv.slice(2);
let mau = 0;

function relatar(sem) {
  const r = rodar(sem);
  console.log('\n' + (sem ? 'SEM o conserto ' + sem + ' (' + CONSERTOS[sem].nome + ')'
    : 'COM todos os consertos') + '  ->  ' + r.nome);

  const achados = [];
  r.saida.forEach(function (item) {
    item.falhas.forEach(function (f) { achados.push({ onde: item.caso.id, fonte: 'trava   ', texto: f }); });
  });
  auditar(r.nome).forEach(function (f) { achados.push({ onde: 'folha', fonte: 'auditor ', texto: f }); });

  achados.forEach(function (a) {
    console.log('  ' + a.fonte + a.onde + ': ' + a.texto);
  });
  if (!achados.length) console.log('  (nenhum defeito, nem pela trava nem pelo auditor)');

  if (!sem) {
    if (achados.length) { console.log('  ESPERADO ZERO, obtido ' + achados.length); mau++; }
    else console.log('  esperado zero, obtido zero');
  } else {
    const bate = achados.filter(function (a) { return CONSERTOS[sem].acusa.test(a.texto); });
    if (!bate.length) {
      console.log('  ESPERADO o defeito do conserto ' + sem + ' de volta, e nada foi acusado');
      mau++;
    } else {
      console.log('  esperado o defeito do conserto ' + sem + ' de volta, acusado ' +
        bate.length + ' vez(es)');
    }
  }
}

if (argv[0] === '--tudo') {
  relatar(null);
  Object.keys(CONSERTOS).forEach(relatar);
} else if (argv[0] === '--sem') {
  relatar(argv[1]);
} else {
  relatar(null);
}

variantes.forEach(function (v) { try { fs.unlinkSync(v); } catch (e) { /* ja saiu */ } });
console.log('\n' + (mau ? mau + ' resultado(s) fora do esperado' : 'todos os resultados como esperado'));
process.exit(mau ? 1 : 0);
