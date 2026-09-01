/* _proto_documentos.js
 * PROTÓTIPO. Não faz parte do aplicativo publicado.
 *
 * Gera dois documentos que hoje não existem, para o Rômulo ver antes de decidir:
 *   1. Escopo do trabalho: uma página com o que ela já entregou àquela família
 *      além da hora de aula, com datas reais e nada estimado.
 *   2. Dossiê do ciclo: o documento de fim de trimestre, com capa e gráficos.
 *
 * Usa o gerador de PDF real do aplicativo. Os gráficos são desenhados com as
 * primitivas que já existem (retângulo, linha, círculo, texto), sem biblioteca.
 */
const PDFGen = require('../pdf.js');
const Core = require('../core.js');

const { COR, PAGINA_L, PAGINA_A, MARG_E, MARG_D, UTIL, medir } = PDFGen;

function ddmm(iso) { const p = String(iso).split('-'); return p[2] + '/' + p[1]; }
function ddmmaaaa(iso) { const p = String(iso).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }

/* ---------------------------------------------------------------- gráficos */

/* Barras horizontais. Serve para áreas trabalhadas e para erros por assunto:
   é a forma que um pai lê em dois segundos sem legenda. */
function barras(doc, itens, opcoes) {
  opcoes = opcoes || {};
  const larguraRotulo = opcoes.larguraRotulo || 190;
  const alturaLinha = opcoes.alturaLinha || 20;
  const max = Math.max.apply(null, itens.map(i => i.valor)) || 1;
  const larguraBarra = MARG_D - MARG_E - larguraRotulo - 42;

  itens.forEach(function (it) {
    doc.garanteEspaco(alturaLinha + 2);
    doc.y -= alturaLinha;
    doc.texto(it.rotulo, MARG_E, doc.y + 5, { tam: 9, cor: COR.texto });
    const x0 = MARG_E + larguraRotulo;
    doc.retangulo(x0, doc.y + 1, larguraBarra, 12, COR.soft);
    const w = Math.max(2, larguraBarra * (it.valor / max));
    doc.retangulo(x0, doc.y + 1, w, 12, opcoes.cor || COR.teal);
    doc.texto(String(it.valor), x0 + larguraBarra + 8, doc.y + 5,
      { tam: 8.5, bold: true, cor: COR.muted });
  });
}

/* A Curva da Autonomia num grafico so, com o eixo nomeado.
   Tres frentes viram tres linhas de cor diferente sobre as mesmas quatro faixas.
   O eixo escrito por extenso importa: sem ele, subir de 2 para 3 nao quer dizer
   nada para quem le, e o documento vai para a mao da familia. */
function curvaNoTempo(doc, frentes, meses) {
  var ETAPAS = ['Apoio total', 'Apoio parcial', 'Supervisao', 'Autonomia'];
  var ETAPAS_PT = ['Apoio total', 'Apoio parcial', 'Supervisão', 'Autonomia'];
  var CORES = [COR.teal, COR.navy, COR.gold];

  var rotulo = 78;
  var x0 = MARG_E + rotulo;
  var larguraUtil = MARG_D - x0 - 8;
  var passo = larguraUtil / Math.max(1, meses.length - 1);
  var alturaFaixa = 26;
  var altura = alturaFaixa * 4;

  doc.garanteEspaco(altura + 62);
  doc.y -= altura + 16;
  var base = doc.y;

  // faixas e rotulos do eixo, de baixo para cima
  for (var n = 0; n < 4; n++) {
    var yy = base + n * alturaFaixa;
    doc.retangulo(x0, yy, larguraUtil, alturaFaixa, n % 2 ? COR.soft : COR.branco);
    doc.linha(x0, yy, x0 + larguraUtil, yy, COR.fio, 0.4);
    doc.texto(String(n + 1), MARG_E, yy + alturaFaixa / 2 - 3,
      { tam: 9, bold: true, cor: COR.navy });
    doc.texto(ETAPAS_PT[n], MARG_E + 11, yy + alturaFaixa / 2 - 3,
      { tam: 8, cor: COR.muted });
  }
  doc.linha(x0, base, x0 + larguraUtil, base, COR.fio, 0.8);
  doc.linha(x0, base + altura, x0 + larguraUtil, base + altura, COR.fio, 0.8);

  // meses no topo
  meses.forEach(function (m, i) {
    doc.texto(m, x0 + i * passo, base + altura + 7, { tam: 8, cor: COR.muted, align: 'centro' });
    doc.linha(x0 + i * passo, base, x0 + i * passo, base + altura, COR.fio, 0.3);
  });

  // uma linha por frente
  frentes.forEach(function (f, k) {
    var c = CORES[k % CORES.length];
    var anterior = null;
    f.pontos.forEach(function (p) {
      var px = x0 + p.i * passo;
      var py = base + (p.etapa - 1) * alturaFaixa + alturaFaixa / 2 + (k - 1) * 3.4;
      if (anterior) {
        doc.linha(anterior.x, anterior.y, px, anterior.y, c, 1.8);
        doc.linha(px, anterior.y, px, py, c, 1.8);
      }
      doc.circulo(px, py, 3, c, true);
      anterior = { x: px, y: py };
    });
    if (anterior) {
      doc.linha(anterior.x, anterior.y, x0 + larguraUtil, anterior.y, c, 1.8);
      doc.circulo(x0 + larguraUtil, anterior.y, 3, c, true);
    }
  });

  // legenda
  doc.y = base - 18;
  var lx = x0;
  frentes.forEach(function (f, k) {
    var c = CORES[k % CORES.length];
    doc.circulo(lx + 3, doc.y + 3, 3, c, true);
    doc.linha(lx - 4, doc.y + 3, lx + 10, doc.y + 3, c, 1.8);
    doc.texto(f.nome, lx + 15, doc.y, { tam: 8.5, cor: COR.texto });
    lx += 15 + medir(f.nome, 8.5, false) + 24;
  });
}

/* ------------------------------------------------- escopo do trabalho */

function gerarEscopoDoTrabalho(op) {
  const doc = new PDFGen.Doc();
  doc.novaPagina();

  doc.cabecalhoDeSecao('Escopo do trabalho', op.aluno.nome);
  doc.y -= 14;
  doc.texto(op.periodo, PAGINA_L / 2, doc.y, { tam: 9, cor: COR.muted, align: 'centro' });

  doc.y -= 24;
  doc.paragrafo(op.abertura, { tam: 10.5, alturaLinha: 15 });

  function secao(titulo, linhas) {
    if (!linhas.length) return;
    doc.y -= 20;
    doc.garanteEspaco(46);
    doc.texto(titulo, MARG_E, doc.y, { tam: 10.5, bold: true, cor: COR.navy });
    doc.y -= 4;
    doc.linha(MARG_E, doc.y, MARG_E + 58, doc.y, COR.teal, 1.1);
    doc.y -= 2;
    linhas.forEach(function (l) {
      // A coluna da data e reservada, senao a linha longa passa por cima dela.
      var reserva = l.quando ? medir(l.quando, 8.5, false) + 14 : 0;
      var largura = MARG_D - (MARG_E + 16) - reserva;
      var partes = doc.quebrar(l.texto, largura, 9.5, false);
      partes.forEach(function (parte, i) {
        doc.garanteEspaco(16);
        doc.y -= 14.5;
        if (i === 0) {
          doc.texto('•', MARG_E + 3, doc.y, { tam: 9.5, cor: COR.teal });
          if (l.quando) {
            doc.texto(l.quando, MARG_D, doc.y, { tam: 8.5, cor: COR.muted, align: 'direita' });
          }
        }
        doc.texto(parte, MARG_E + 16, doc.y, { tam: 9.5, cor: COR.texto });
      });
    });
  }

  secao('Encontros', op.encontros);
  secao('Diagnóstico e acompanhamento', op.diagnostico);
  secao('Material produzido', op.material);
  secao('Prestação de contas', op.contas);

  doc.y -= 22;
  doc.retangulo(MARG_E, doc.y - 34, UTIL, 44, COR.soft);
  doc.retangulo(MARG_E, doc.y - 34, 3, 44, COR.gold);
  doc.texto(op.rodape, MARG_E + 14, doc.y - 8, { tam: 9.5, cor: COR.texto });
  doc.texto('Tudo acima já aconteceu. Nenhuma linha é estimativa.',
    MARG_E + 14, doc.y - 22, { tam: 8.5, cor: COR.muted });

  return doc.finalizar();
}

/* ------------------------------------------------------- dossiê do ciclo */

function gerarDossieDoCiclo(op) {
  const doc = new PDFGen.Doc();

  // ---------- capa ----------
  doc.novaPagina({ semMarca: true });
  doc.marcaDagua();
  doc.y = PAGINA_A - 300;
  doc.texto('Acompanhamento pedagógico', PAGINA_L / 2, doc.y,
    { tam: 11, cor: COR.teal, align: 'centro', tracking: 2.2 });
  doc.y -= 52;
  doc.texto(op.aluno.nome, PAGINA_L / 2, doc.y,
    { tam: 40, bold: true, cor: COR.navy, align: 'centro' });
  doc.y -= 20;
  doc.linha(PAGINA_L / 2 - 56, doc.y, PAGINA_L / 2 + 56, doc.y, COR.gold, 1.4);
  doc.y -= 26;
  doc.texto(op.periodo, PAGINA_L / 2, doc.y,
    { tam: 13, cor: COR.texto, align: 'centro' });
  doc.y -= 18;
  doc.texto(op.contexto, PAGINA_L / 2, doc.y,
    { tam: 9.5, cor: COR.muted, align: 'centro' });

  doc.y -= 64;
  const cx = [MARG_E + UTIL * 0.17, MARG_E + UTIL * 0.5, MARG_E + UTIL * 0.83];
  op.numeros.forEach(function (n, i) {
    doc.texto(n.valor, cx[i], doc.y, { tam: 26, bold: true, cor: COR.navy, align: 'centro' });
    doc.texto(n.rotulo, cx[i], doc.y - 15, { tam: 8.5, cor: COR.muted, align: 'centro' });
  });

  // ---------- de onde partimos ----------
  doc.novaPagina();
  doc.cabecalhoDeSecao('De onde partimos', 'Mapeamento de ' + ddmmaaaa(op.mapeamento.data));
  doc.y -= 18;
  doc.paragrafo(op.mapeamento.leitura, { tam: 10, alturaLinha: 14.5 });

  doc.y -= 18;
  doc.texto('O que estava marcado', MARG_E, doc.y, { tam: 10.5, bold: true, cor: COR.navy });
  doc.y -= 4;
  doc.linha(MARG_E, doc.y, MARG_E + 88, doc.y, COR.teal, 1.1);
  doc.y -= 6;
  op.mapeamento.grupos.forEach(function (g) {
    doc.garanteEspaco(30);
    doc.y -= 16;
    doc.texto(g.titulo, MARG_E, doc.y, { tam: 9, bold: true, cor: COR.teal });
    doc.y -= 13;
    doc.paragrafo(g.itens.join(', ') + '.', { tam: 9.5, alturaLinha: 13, x: MARG_E + 10, largura: UTIL - 10 });
  });

  // ---------- o que mudou ----------
  doc.y -= 26;
  doc.garanteEspaco(200);
  doc.texto('O que mudou no trimestre', MARG_E, doc.y, { tam: 10.5, bold: true, cor: COR.navy });
  doc.y -= 4;
  doc.linha(MARG_E, doc.y, MARG_E + 112, doc.y, COR.teal, 1.1);
  doc.y -= 12;
  doc.texto('Curva da autonomia, por frente', MARG_E, doc.y, { tam: 9, cor: COR.muted });
  doc.y -= 8;
  curvaNoTempo(doc, op.curva.frentes, op.curva.meses);
  doc.y -= 16;
  doc.texto('Etapa inicial baixa é o esperado no começo do trabalho, e não é fracasso.',
    MARG_E, doc.y, { tam: 8, cor: COR.muted });

  // ---------- o trimestre ----------
  doc.novaPagina();
  doc.cabecalhoDeSecao('O trimestre', op.periodo);

  doc.y -= 20;
  doc.texto('Temas trabalhados, por número de encontros', MARG_E, doc.y,
    { tam: 10.5, bold: true, cor: COR.navy });
  doc.y -= 8;
  barras(doc, op.temas, { larguraRotulo: 230 });

  doc.y -= 26;
  doc.texto('Áreas trabalhadas, além do conteúdo', MARG_E, doc.y,
    { tam: 10.5, bold: true, cor: COR.navy });
  doc.y -= 8;
  barras(doc, op.areas, { larguraRotulo: 230, cor: COR.gold });

  doc.y -= 26;
  doc.garanteEspaco(120);
  doc.texto('Encontros por mês', MARG_E, doc.y, { tam: 10.5, bold: true, cor: COR.navy });
  doc.y -= 8;
  barras(doc, op.porMes, { larguraRotulo: 120 });

  // ---------- a narrativa ----------
  doc.novaPagina();
  doc.cabecalhoDeSecao('A leitura do trimestre', op.aluno.nome);
  op.narrativa.forEach(function (b) {
    doc.y -= 24;
    doc.garanteEspaco(60);
    doc.texto(b.titulo, MARG_E, doc.y, { tam: 10.5, bold: true, cor: COR.navy });
    doc.y -= 4;
    doc.linha(MARG_E, doc.y, MARG_E + 70, doc.y, COR.teal, 1.1);
    doc.y -= 6;
    doc.paragrafo(b.texto, { tam: 10.5, alturaLinha: 15.5 });
  });

  doc.y -= 30;
  doc.garanteEspaco(80);
  doc.retangulo(MARG_E, doc.y - 56, UTIL, 66, COR.soft);
  doc.retangulo(MARG_E, doc.y - 56, 3, 66, COR.gold);
  doc.texto('Próximo ciclo', MARG_E + 14, doc.y - 12, { tam: 10, bold: true, cor: COR.navy });
  doc.y -= 26;
  doc.paragrafo(op.proximo, { tam: 9.5, alturaLinha: 13.5, x: MARG_E + 14, largura: UTIL - 28 });

  return doc.finalizar();
}

module.exports = { gerarEscopoDoTrabalho, gerarDossieDoCiclo, barras, curvaNoTempo };
