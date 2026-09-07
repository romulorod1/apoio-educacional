/* figuras/_piloto_base.js
 * O piloto de tema, na parte que nao muda de tema para tema.
 *
 * Ate aqui cada tema ganhava uma copia inteira do piloto: o _piloto_MATEM3-12.js
 * tinha 729 linhas e o _piloto_MATEM3-03.js 652, e as duas copias repetiam as
 * mesmas travas genericas com pequenas divergencias. A varredura que vem marca
 * figura em cerca de 145 temas: copiar isso 145 vezes faz cada conserto de trava
 * morrer numa copia so. O verificador das duas primeiras folhas escreveu o
 * pedido: "os tres defeitos de texto que viraram travas com par envenenado no
 * MATEM3-12 devem ir para um piloto base comum em vez de serem copiados por
 * tema".
 *
 * Entao aqui moram: a abertura do tema e a geracao das quatro folhas, o placar,
 * os leitores de folha (caminhos, Bezier, caixa, textos, marcas, plano) e as
 * travas genericas numeradas de 0 a 8. O piloto de cada tema fica com tres
 * coisas: o ID, os numeros editoriais daquele tema e a medicao no fluxo da
 * familia de receitas dele.
 *
 * Uso, de dentro de um piloto de tema:
 *
 *   const P = require('./_piloto_base.js');
 *   const ctx = P.abrir({ id: 'MATEM3-12', caminhoDoMd: 'temas/mat/em3/MATEM3-12.md' });
 *   P.travasGenericas(ctx, { ...os numeros editoriais deste tema... });
 *   ...a medicao no fluxo deste tema, com P.conf e P.medido...
 *   process.exit(P.placar());
 *
 * ---------------------------------------------------------------------------
 * POR QUE OS PLACARES SUBIRAM, e por que isso NAO e criterio apertando
 *
 * Na unificacao, o MATEM3-12 foi de 88 conferencias para 92, e o MATEM3-03 de
 * 40 para 47. Nenhum dos dois temas mudou, nenhuma folha mudou um byte, e
 * nenhum criterio ficou mais exigente. O que faltava era PERGUNTA.
 *
 * Cada piloto era uma copia, e cada copia tinha nascido de uma folha diferente,
 * entao cada uma perguntava um conjunto proprio. Duas travas existiam em UM SO
 * dos tres pilotos:
 *
 *   numero de escala riscado por arco   so no _piloto_MATEM3-03.js. Nasceu de
 *                                       11 numeros por lingua riscados pela
 *                                       circunferencia naquele tema, e nenhuma
 *                                       trava do kit acusava.
 *   rotulo impresso em cima de outro    so no _piloto_MATEM3-03.js. Nasceu do
 *                                       "(3, 4)" que subiu para onde o "s" da
 *                                       reta mora e a folha imprimiu "(3 s 4)".
 *
 * O MATEM3-12 passava nas duas desde sempre. So que ninguem tinha perguntado:
 * a resposta era zero e zero, e ela ficou dois anos de figura sem ser pedida. O
 * mesmo vale ao contrario: a trava de conferirFigura e a de escala existiam so
 * no MATEM3-12, e o MATEM3-03 nunca tinha sido perguntado sobre elas. Com a
 * base comum, todo tema responde ao conjunto inteiro, e por isso o placar sobe
 * sem que um unico veredito mude.
 *
 * A trava 8 (figura prometida e ausente no tema) e a unica NOVA, e ela nasceu
 * vazia por construcao dentro do piloto: quem a roda de verdade e o
 * figuras/_varredura_banco.js, sobre o banco inteiro. Esta escrito no lugar
 * dela, mais abaixo.
 *
 * UMA conferencia morreu e voltou. Na primeira escrita, a conferencia editorial
 * do MATEM3-12 "nenhuma figura marcada fora de escala: todas saem exatas" foi
 * substituida pela trava E generica, que e mais fraca porque aceita figura fora
 * de escala com legenda. O tema deixou de afirmar o que afirmava, e o commit da
 * unificacao dizia que nenhuma conferencia tinha morrido. Ela voltou como a
 * opcao `figurasForaDeEscala`, com o mesmo rotulo e a mesma semantica, e o
 * MATEM3-12 subiu de 91 para 92.
 *
 * AS QUATRO FOLHAS NAO MUDARAM. Fato datado de 07/09/2026: as folhas geradas
 * pelos pilotos unificados sao byte a byte as mesmas de antes da unificacao,
 * conferidas por sha-256 contra as chamadas literais do piloto antigo.
 *
 *   MATEM3-12  material  d06ec574a7b998b6c94b456cd68e036aa7f6bc445861f5fa8f6f0f6baa1ec1c2
 *              lista     607537d7bc61ad4156ae89d5159377df4d955cdb25ea2ce017bbfd3815ce9a93
 *              gabarito  7a329aa6f2a36ca33c5cfb93766a33a573a7c7c33aaff250780a2fb5bde49f95
 *              en        20ac771761bf11fad37f8abf58694f9e251f88e65e1eca3b0b9d1cd81539a80b
 *   MATEM3-03  material  c57e82885bd634b13fa71e76b8488b5465132b79070b928fab409cc51b8d386e
 *              lista     38d847858142d3ac87b17bbc6bf5fa1fcbc91920d06a33b00f6aa1e1c4c84c66
 *              gabarito  1aee50a67459fb39a6f9327deb02d89ccdee22ae982bb42eadf6105d8ed801cf
 *              en        135f0aeeaab9630cd31101b4f4fe22fbeee8761f27549f9767aba454583a71e2
 *
 * O piloto reimprime esses sha a cada rodada, em medido(), e NAO os confere:
 * a razao esta escrita no lugar onde eles sao calculados.
 *
 * ---------------------------------------------------------------------------
 * DIVIDA CONHECIDA, herdada do piloto antigo e nao consertada aqui de proposito
 *
 * 1. O casamento de figura com exercicio usa indexOf('id=' + f.id), que casa
 *    PREFIXO: um tema com id=q1 e id=q14 pode achar o exercicio errado. Vem do
 *    _piloto_MATEM3-12.js e nao mordeu ainda porque nenhum tema tem par de ids
 *    em que um seja prefixo do outro. Conserto e casar id= com fronteira.
 * 2. ctx.figs olha so as folhas em portugues (docPT mais docGab). As travas C,
 *    D e a conta de marcas ativas, portanto, nao veem as figuras que so a folha
 *    inglesa desenha. Hoje as duas linguas usam as mesmas receitas na mesma
 *    ordem (trava B garante), entao as duas listas coincidem; o dia em que um
 *    tema divergir de proposito, isto vira defeito.
 *
 * Regra da casa: nunca usar travessao.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PDFGen = require('../pdf.js');
/* Os dois so servem para PERGUNTAR: ao base.js o que e numero, ao receitas.js
 * quais chaves de cada receita sao metricas. Este arquivo nao mantem lista
 * propria de nenhuma das duas coisas. */
const Bfig = require('./base.js');
const Receitas = require('./receitas.js');

const RAIZ = path.join(__dirname, '..');
const PADRAO = path.join(RAIZ, 'temas', 'banco.json');

/* ================================================================ o placar */

let ok = 0, mau = 0;

/* A semantica e a de sempre: compara como TEXTO, para "16" e 16 baterem e para
 * a mensagem de falha mostrar o que veio e o que se esperava. */
function conf(rotulo, obtido, esperado) {
  const bom = String(obtido) === String(esperado);
  if (bom) ok++; else mau++;
  console.log((bom ? '  OK    ' : '  FALHA ') + rotulo +
    (bom ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
  return bom;
}
function medido(t) { console.log('        ' + t); }
function placar() {
  console.log('\n' + ok + ' conferencias passaram, ' + mau + ' falharam.');
  return mau ? 1 : 0;
}

/* ================================================================ numeros */

const n2 = (v) => (Math.round(v * 100) / 100).toFixed(2);
const n4 = (v) => (Math.round(v * 10000) / 10000).toFixed(4);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/* ================================================================ leitores de folha
 *
 * Tudo aqui le o que VAI SAIR IMPRESSO: o fluxo de conteudo da pagina, ou o
 * registro.medido que o base.js monta lendo esse mesmo fluxo. Nenhum destes
 * leitores pergunta a receita o que ela pretendia desenhar, porque a receita
 * concorda consigo mesma por construcao. */

/* O leitor de caminhos da _prova_receitas_circulo.js: reconstroi cada
 * sub-caminho do fluxo, com os trechos de reta e de Bezier e a espessura com
 * que ele foi pintado. */
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
/* Volta inteira: quatro Beziers pintadas em traco, com mais de 20 pt de vao. E
 * a assinatura da circunferencia e da elipse fechada no fluxo. */
function voltasInteiras(subs) {
  return subs.filter((s) => s.pintado === 'traco' && s.trechos.length === 4 && s.trechos.every((t) => !t.reta) &&
    caixaDe(pontosDoSub(s, 8)).largura >= 20);
}

function textos(f) { return ((f && f.medido && f.medido.textos) || []).map((t) => t.txt); }
function tem(f, txt) { return textos(f).filter((t) => t === txt).length; }
function quadradinhos(f) { return (f.marcas || []).filter((k) => k && k.tipo === 'anguloReto'); }
function triangulos(f) { return ((f.medido || {}).areas || []).filter((a) => a.pts.length === 3); }
function nomeDaFigura(f) { return f.id || f.receita || '?'; }

/* As bolinhas de ponto: area pequena, redonda e escura. Serve a trava 2 (o
 * rotulo de vertice) e a qualquer tema que marque ponto na folha. */
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

/* Os tracos de construcao (0,9 pt) de uma figura, ja em forma de segmento. */
function segmentos09(f) {
  return ((f.medido || {}).segmentos || []).filter(function (s) { return !s.varredura && Math.abs(s.w - 0.9) < 0.01; })
    .map(function (s) { return { a: { x: s.x1, y: s.y1 }, b: { x: s.x2, y: s.y2 }, L: Math.hypot(s.x2 - s.x1, s.y2 - s.y1) }; });
}
/* O plano cartesiano lido da propria folha: a origem e o cruzamento do eixo x
 * (o horizontal mais longo de 0,9 pt) com o eixo y (o vertical mais longo), e a
 * unidade e a escala do registro. Devolve null em figura sem plano, e e por
 * isso que a trava 1 vale igual num tema sem plano nenhum. */
function planoDaFigura(f) {
  const segs = segmentos09(f);
  const hs = segs.filter(function (s) { return Math.abs(s.a.y - s.b.y) < 0.05; }).sort(function (u, v) { return v.L - u.L; });
  const vs = segs.filter(function (s) { return Math.abs(s.a.x - s.b.x) < 0.05; }).sort(function (u, v) { return v.L - u.L; });
  if (!hs.length || !vs.length) return null;
  const O = { x: vs[0].a.x, y: hs[0].a.y }, k = f.escala;
  return {
    O: O, k: k, segs: segs,
    xy: function (p) { return { x: (p.x - O.x) / k, y: (p.y - O.y) / k }; },
    pagina: function (q) { return { x: O.x + q.x * k, y: O.y + q.y * k }; }
  };
}

/* A hachura, lida no fluxo.
 *
 * O hachurar do marcas.js e chamado com o ctx.doc e nao com o ctx, entao a
 * marca de hachura NAO chega ao registro da figura: quem quiser saber se ha
 * hachura precisa ler o desenho. No fluxo ela sai como varredura, um unico S
 * com muitos sub-caminhos. So que varredura tambem e a malha do plano e a
 * fileira de tiques dos eixos: no MATEM3-03, 22 figuras das quatro folhas tem
 * varredura e nenhuma delas e hachurada. Tres sinais separam as tres coisas:
 *
 *   hachura   tracos longos (mais de 12 pt), todos na MESMA inclinacao, ao
 *             menos tres deles. Medido: 25 a 33 tracos de 114 a 158 pt.
 *   tique     tracos curtos, 5 pt por construcao, nas duas direcoes do eixo.
 *   malha     tracos longos nas DUAS direcoes, em numero parecido: por isso a
 *             familia so conta quando nao ha uma perpendicular do mesmo porte.
 *
 * O angulo da hachura nao serve sozinho de sinal: a convencao do
 * escolherInclinacao lista 45, 30, 60, 135, 120, 150 e, em ultimo caso, 90 e 0,
 * entao existe hachura alinhada ao eixo. */
const HACHURA_TRACO_MINIMO = 12;
function familiasDeVarredura(f) {
  const fam = {};
  ((f.medido || {}).segmentos || []).forEach(function (s) {
    if (!s.varredura) return;
    const L = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
    if (L < HACHURA_TRACO_MINIMO) return;
    let a = Math.atan2(s.y2 - s.y1, s.x2 - s.x1) * 180 / Math.PI;
    a = ((a % 180) + 180) % 180;
    const k = String(Math.round(a));
    if (!fam[k]) fam[k] = { angulo: Math.round(a), n: 0 };
    fam[k].n++;
  });
  return Object.keys(fam).map((k) => fam[k]).filter((g) => g.n >= 3);
}
function ehAlinhadaAoEixo(a) { return Math.min(a, Math.abs(a - 90), Math.abs(a - 180)) < 2; }
/* A regra de "tem perpendicular do mesmo porte, entao e malha" custou caro na
 * primeira escrita: o aneis= do receitas.js alterna 45 e 135 DE PROPOSITO, para
 * cada anel se distinguir do vizinho, e a figura de aneis saia com 56 segmentos
 * de varredura e ZERO inclinacao de hachura. Era regressao de verdade contra o
 * "varreduras > 0" antigo, e nenhum dos dois primeiros temas usa aneis, entao
 * nenhum placar acusava.
 *
 * A perpendicularidade so acusa malha quando as duas familias estao ALINHADAS
 * AOS EIXOS, que e como a malha e a fileira de tiques saem; e uma familia
 * alinhada ao eixo dentro de uma figura com plano cartesiano e malha sem
 * precisar da perpendicular, porque o plano e quem a desenha. Par a 45 e 135
 * fora de plano e hachura dupla, e sempre foi. */
function inclinacoesDeHachura(f) {
  const fam = familiasDeVarredura(f);
  const temPlano = !!planoDaFigura(f);
  return fam.filter(function (g) {
    if (!ehAlinhadaAoEixo(g.angulo)) return true;
    if (temPlano) return false;
    return !fam.some(function (h) {
      const d = Math.abs(((h.angulo - g.angulo) % 180 + 180) % 180 - 90);
      return d < 2 && h.n >= 3;
    });
  }).map((g) => g.angulo);
}
function ehHachurada(f) { return inclinacoesDeHachura(f).length > 0; }

/* ================================================================ o texto do tema */

function semDiretiva(s) { return String(s || '').replace(/(^|\s)@fig\s[^\n]*/g, ' '); }
function diretivasDe(s) { return String(s || '').match(/(^|\s)@fig\s[^\n]*/g) || []; }
function clonar(t) { return JSON.parse(JSON.stringify(t)); }

/* REMISSAO A FIGURA: o texto manda OLHAR um desenho que esta na folha.
 *
 * A primeira versao desta lista era so o substantivo ("figura", "desenho",
 * "grafico") e ela nao servia: rodada sobre os 148 temas do banco, acusava 62
 * temas de prometer figura sem ter, e 33 na trava 3. Os falsos positivos sao
 * reais e sao de quatro tipos, todos medidos no banco de 07/09/2026:
 *
 *   figura como FORMA          "Qual figura nao tem nenhum canto?" (MAT02-06),
 *                              "a area da figura que sobrou" (MAT04-09),
 *                              "um lado da figura original" (MAT09-08)
 *   figura como ICONE          "cada figura de livro vale 4 livros" (MAT04-12)
 *   figura como TERMO          "quantos elementos tem cada figura" (MAT07-08)
 *   desenho como O QUE QUEM    "marque a seta no desenho" (MAT04-07),
 *   RESOLVE VAI DESENHAR       "Ler no desenho mental da parabola" (MATEM1-05)
 *
 * O conserto tem duas partes e a ordem importa. Primeiro APAGA-SE do texto o
 * uso em que "figura" e a forma medida, e nao o desenho na folha: isso e o
 * SENTIDO_DE_FORMA, reconhecido pelo substantivo de medida antes ("area da",
 * "perimetro da", "contorno da", "volta na", "dentro da") ou pelo qualificador
 * depois ("figura composta", "figura original", "figura que sobrou"). Depois se
 * procura a remissao no que sobrou.
 *
 * O que sobra e a forma da casa: "<objeto> da figura" e "na figura"
 * ("A piramide reta DA FIGURA tem base quadrada", MATEM3-12; "os oito angulos
 * formados NA FIGURA", MAT08-11), mais as deiticas explicitas.
 *
 * Em ingles, "in the drawing" ficou de fora de proposito: em prosa inglesa "the
 * drawing" costuma ser o desenho que quem resolve vai fazer, e foi o unico
 * falso positivo que sobrou na medicao (MAT09-07, "in the drawing it is always
 * the one facing the right angle", num tema sem figura nenhuma). A forma da
 * casa no banco bilingue e "in the figure".
 *
 * Medido em 07/09/2026 sobre os 148 temas: entre os temas SEM nenhuma diretiva,
 * esta lista acusa exatamente dois, MAT08-11 e MAT08-12, que sao remissao de
 * verdade nas duas linguas. E ela enxerga os controles que TEM figura e
 * remetem: 12 remissoes no MATEM3-03, 14 no MAT08-13, 15 no MATEM3-12. Quem
 * mexer aqui roda o figuras/_varredura_banco.js antes e depois. */
/* A REMISSAO TEM DUAS FORMAS, E A ORDEM EM QUE SE PROCURA CADA UMA IMPORTA.
 *
 * FORMA FORTE: o texto aponta para o papel, e nao ha ambiguidade nenhuma. Sao
 * os deiticos ("figura a seguir", "figura abaixo", "figura ao lado", "figura
 * mostrada", "figura dada", "figura indicada"), os imperativos ("observe a
 * figura", "veja a figura", "conforme a figura") e "a figura mostra".
 *
 * FORMA NUA: "na figura", "da figura", "in the figure". E a forma da casa
 * ("A piramide reta DA FIGURA tem base quadrada", MATEM3-12) e tambem o jeito
 * de dizer forma geometrica ("a area DA FIGURA que sobrou", MAT04-09). So esta
 * precisa do apagador do SENTIDO_DE_FORMA.
 *
 * POR QUE A ORDEM IMPORTA, e este comentario existe porque alguem vai reordenar
 * isto sem perceber. O apagador come um trecho INTEIRO ("area da figura",
 * "perimetro da figura"), e a forma forte costuma vir logo DEPOIS do trecho
 * comido. Se o apagador rodar primeiro sobre tudo, "Calcule a area da figura ao
 * lado." vira "Calcule a   ao lado." e a remissao mais explicita que existe
 * some. Isso mata nos dois sentidos, e o segundo e o pior: no varredura, um
 * tema sem figura que diga "Calcule o perimetro da figura abaixo" nao entra na
 * lista (a), e o criterio de pronto da frente fica verde com o defeito na
 * folha; no piloto, o dia em que o MAT07-13 ("Area e perimetro de figuras
 * compostas") ganhar figura, a trava 3 acusa "tem figura e nao remete" e
 * acrescentar "abaixo" ao enunciado nao resolve, porque o apagador come a frase
 * inteira. A saida facil seria afrouxar a trava, e ai se perdem as duas.
 *
 * Entao: FORMA FORTE no texto CRU, primeiro. Forma nua no texto apagado,
 * depois. Nunca o contrario. */
const FORMA_FORTE = {
  pt: /\b(?:[ao]s?\s+)?(?:figura|desenho|esquema|diagrama)s?\s+(?:a seguir|abaixo|acima|ao lado|mostrad[ao]s?|dad[ao]s?|indicad[ao]s?)\b|\b(?:observe|veja|conforme)\s+[ao]s?\s+(?:figura|desenho|esquema|diagrama)s?\b|\b[ao]s?\s+(?:figura|desenho|esquema|diagrama)s?\s+mostram?\b/i,
  en: /\b(?:figure|diagram|picture|drawing)s?\s+(?:below|above|alongside|opposite|shown)\b|\bthe (?:figure|diagram|picture|drawing)s?\s+shows?\b|\bas shown\b/i
};
const REMETE_NUA = {
  pt: /\b(?:n[ao]|d[ao])\s+figura\b/i,
  en: /\bin the (?:figure|diagram|picture)\b/i
};
/* NAO existe aqui uma expressao unica que junte as duas, e a ausencia e
 * deliberada. Havia uma, chamada REMETE, exportada "para quem quiser a lista
 * inteira num objeto so", sem nenhum usuario. Ela era uma arma carregada: quem
 * escrevesse REMETE.test(textoDeRemissao(s)) reinstalaria em uma linha o defeito
 * que custou uma rodada inteira, porque procuraria a forma FORTE no texto ja
 * apagado, e "Calcule a area da figura ao lado" voltaria a nao contar. O ponto
 * desta trava nao e QUAIS formas se procura, e sim EM QUAL TEXTO cada uma e
 * procurada, e um objeto que junta as duas apaga exatamente essa distincao.
 * Quem confere usa remeteAFigura; quem quer listar usa ocorrenciasDeRemissao,
 * que marca cada ocorrencia com forte ou nua. */
const SENTIDO_DE_FORMA = {
  /* Sem \b antes de "area": em JavaScript \b e ASCII, e entre um espaco e o
   * "a" acentuado nao ha fronteira de palavra nenhuma. Com o \b, "a area da
   * figura" escapava do apagador e o tema vinha para a lista. Pela mesma razao
   * o fim da segunda linha usa (?=\s|$|[,.;:]) e nao \b: depois de vogal
   * acentuada nao ha fronteira nenhuma.
   *
   * O VERBO depois de "da figura" NAO entra na lista de qualificadores, e isso
   * foi medido: "e" e "sao" estiveram nela e apagavam a forma da casa. O
   * MAT08-13 diz "A pista de atletismo DA FIGURA E formada por um retangulo" e
   * "O alvo DA FIGURA E formado por tres circunferencias", que sao remissoes
   * legitimas em exercicios que TEM figura, e os dois passaram a ser acusados
   * de "tem figura e nao remete a ela". Quem carrega o sentido de forma e o
   * substantivo de medida ANTES ("area da", "perimetro da"), nao o verbo
   * depois. O caso que motivou o "e" na lista, "A area da figura e 58 cm
   * quadrados" do MAT05-09, ja e apagado pela primeira linha. */
  pt: [
    /(?:[áa]rea|per[íi]metro|contorno|volta|lado|lados|dentro|redor|interior|total|metade)\s+(?:d[ao]|n[ao])\s+figura\b/gi,
    /\b(?:d[ao]|n[ao])\s+figura\s+(?:composta|original|plana|planas|geom[ée]trica|toda|que)(?=\s|$|[,.;:])/gi
  ],
  en: [
    /\b(?:area|perimeter|outline|inside|around)\s+of the figure\b/gi,
    /\b(?:in|of) the figure\s+(?:that|which)\b/gi
  ]
};
/* O texto sem as diretivas e sem os usos de "figura" que sao forma medida. So a
 * forma NUA se procura aqui: a forte ja foi procurada no texto cru. */
function textoDeRemissao(s, lingua) {
  let t = semDiretiva(s);
  SENTIDO_DE_FORMA[lingua].forEach(function (rx) {
    t = t.replace(new RegExp(rx.source, 'gi'), ' ');
  });
  return t;
}
function formaForte(s, lingua) { return FORMA_FORTE[lingua].test(semDiretiva(s)); }
function remeteAFigura(s, lingua) {
  return formaForte(s, lingua) || REMETE_NUA[lingua].test(textoDeRemissao(s, lingua));
}
/* Todas as ocorrencias, com a frase inteira, para o verificador poder mostrar
 * ao leitor o que casou em vez de so um id de tema. Uma lista de ids nao e
 * auditavel: foi abrindo o arquivo que se descobriu o falso positivo do
 * MAT02-06. */
function ocorrenciasDeRemissao(s, lingua) {
  const saida = [];
  function varrer(texto, rx, forte) {
    const r = new RegExp(rx.source, 'gi');
    let m;
    while ((m = r.exec(texto))) {
      let a = m.index, b = m.index;
      while (a > 0 && '.!?\n'.indexOf(texto[a - 1]) < 0) a--;
      while (b < texto.length && '.!?\n'.indexOf(texto[b]) < 0) b++;
      const frase = texto.slice(a, b + 1).replace(/\s+/g, ' ').trim();
      /* A mesma frase pode casar as duas formas ("a area da figura ao lado"
       * casa a forte no cru e nao casa a nua no apagado; "da figura abaixo"
       * casa as duas). Vale a forte, que e a mais informativa. */
      if (saida.some(function (x) { return x.frase === frase; })) return;
      saida.push({ casou: m[0], frase: frase, forte: forte });
    }
  }
  /* A ordem e a mesma do remeteAFigura, e pela mesma razao. */
  varrer(semDiretiva(s), FORMA_FORTE[lingua], true);
  varrer(textoDeRemissao(s, lingua), REMETE_NUA[lingua], false);
  return saida;
}
/* A glosa da hachura: a palavra que diz o que a textura quer dizer. */
const GLOSA = { pt: /hachurad/i, en: /hatched/i };

/* As pecas de texto que a folha imprime, lidas nos BYTES do PDF terminado. E de
 * proposito que esta leitura nao passe pelo Doc: a folha e o que chega ao
 * papel. O fluxo nao e comprimido, entao cada peca aparece dentro de um Tj. */
function pecasDeTexto(bytes) {
  const cru = Buffer.from(bytes).toString('latin1');
  const rx = /Td \(((?:[^()\\]|\\.)*)\) Tj/g;
  let m, o = [];
  while ((m = rx.exec(cru))) o.push(m[1]);
  return o;
}

/* O que nao se traduz: assinatura da folha e sigla. */
const NAO_TRADUZ = ['Nathália Wajsenzon', 'APOIO EDUCACIONAL',
  'Nathália Wajsenzon · Apoio Educacional', 'NW'];
/* O nucleo do padrao que acha portugues em qualquer folha: cabecalho, sufixo e
 * as letras acentuadas. Cada tema acrescenta as palavras dele em
 * op.palavrasPt, porque o vocabulario da area e que muda. */
const MARCA_PT_NUCLEO = 'ção|ções|ângul|Página|Aluno|Gabarito|Exercícios|ê|õ|ç|ã';

/* ================================================================ abrir o tema
 *
 * Resolve o banco (o argv[2] ou o temas/banco.json), acha o tema, gera as
 * quatro folhas pelo caminho de verdade (o gerarMaterialTema do pdf.js, que e o
 * mesmo que o tablet consome) e monta os quatro documentos medidos. */

function comDoc(tema, lingua, op) {
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

/* Os nomes de receita de um texto, na ordem em que ele os pede. E a assinatura
 * usada pela paridade PT x EN e pela contagem editorial. */
function receitasDe(texto) {
  const nomes = [];
  new PDFGen.Doc().partesDeFigura(texto).forEach(function (p) {
    if (p.tipo === 'figura') nomes.push(p.diretiva.receita || ('id:' + p.diretiva.id));
  });
  return nomes.join(' ');
}

/* Desenha uma diretiva solta numa folha de rascunho, para o par envenenado
 * poder comparar a mesma medida numa figura com o defeito plantado. */
function rascunho(fig, registra) {
  const d = new PDFGen.Doc(); d.novaPagina();
  if (registra) d.registrarFiguras(registra);
  d.partesDeFigura(fig).forEach(function (p) {
    if (p.tipo === 'figura') d.figura(p.diretiva, { x: PDFGen.MARG_E + 20, largura: PDFGen.MARG_D - PDFGen.MARG_E - 20 });
  });
  return { figs: d.figurasDesenhadas || [], avisos: d.avisosFigura || [] };
}

function abrir(op) {
  op = op || {};
  const ID = op.id;
  const BANCO = op.banco || process.argv[2] || PADRAO;
  const FONTE = op.caminhoDoMd ? path.join(RAIZ, op.caminhoDoMd) : null;
  const lido = JSON.parse(fs.readFileSync(BANCO, 'utf8'));
  const tema = Array.isArray(lido.temas)
    ? lido.temas.find(function (t) { return t.id === ID; })
    : (lido && lido.id === ID ? lido : null);
  if (!tema) throw new Error(ID + ' nao esta em ' + BANCO + ': rode gerar_banco.py antes');

  console.log('tema: ' + tema.pt.titulo + '  |  ' + tema.pt.exercicios.length + ' exercicios  |  banco: ' + BANCO);

  function gerar(nome, opcoes) {
    const bytes = PDFGen.gerarMaterialTema(Object.assign({ tema: tema }, opcoes));
    const saida = path.join(__dirname, nome);
    fs.writeFileSync(saida, bytes);
    console.log('  ' + nome + ': ' + Math.round(bytes.length / 1024) + ' KB');
    return bytes;
  }
  const aluno = op.aluno || 'Nathália';
  const data = op.data || '07/09/2026';
  const material = gerar('_exemplo_' + ID + '_material.pdf', {
    lingua: 'pt', incluirMaterial: true, incluirLista: true, incluirGabarito: true,
    aluno: aluno, data: data
  });
  const lista = gerar('_exemplo_' + ID + '_lista.pdf', {
    lingua: 'pt', incluirLista: true, aluno: aluno, espacoParaResposta: op.espacoParaResposta || 26
  });
  const gabarito = gerar('_exemplo_' + ID + '_gabarito.pdf', {
    lingua: 'pt', incluirGabarito: true
  });
  const ingles = gerar('_exemplo_' + ID + '_en.pdf', {
    lingua: 'en', incluirMaterial: true, incluirLista: true, incluirGabarito: true
  });

  /* O SHA-256 das quatro folhas, IMPRESSO e nunca conferido contra nada.
   *
   * A tentacao e cravar o SHA de hoje numa conferencia, e ela e errada: as
   * receitas estao vivas (o escalaFora e as chaves base= e altura= estao
   * mudando enquanto isto e escrito) e figura de prototipo MUDA de proposito.
   * Uma trava assim ficaria vermelha a cada melhoria legitima, seria atualizada
   * para ficar verde, e trava que se atualiza para ficar verde ensina quem le a
   * ignorar trava.
   *
   * Impresso, o SHA e outra coisa: e o registro datado do que esta folha era
   * nesta rodada. Duas rodadas seguidas com o mesmo SHA provam que a mudanca no
   * codigo nao encostou no desenho, que e exatamente a pergunta de toda
   * refatoracao. A comparacao e de quem le, e nao da maquina. */
  const sha = {};
  [['material', material], ['lista', lista], ['gabarito', gabarito], ['en', ingles]]
    .forEach(function (par) {
      sha[par[0]] = crypto.createHash('sha256').update(Buffer.from(par[1])).digest('hex');
    });
  console.log('  sha-256 das quatro folhas desta rodada (registro, nao conferencia):');
  Object.keys(sha).forEach(function (k) {
    console.log('        ' + (k + '        ').slice(0, 9) + ' ' + sha[k]);
  });

  const docPT = comDoc(tema, 'pt', { material: true });
  const docGab = comDoc(tema, 'pt', { gabarito: true });
  const docEN = comDoc(tema, 'en', { material: true });
  const docGabEN = comDoc(tema, 'en', { gabarito: true });

  const figs = (docPT.figurasDesenhadas || []).concat(docGab.figurasDesenhadas || []);
  const todasAsFiguras = [docPT, docGab, docEN, docGabEN].reduce(function (o, d) {
    return o.concat(d.figurasDesenhadas || []);
  }, []);
  const porId = {}, gabPorId = {};
  (docPT.figurasDesenhadas || []).forEach(function (f) { if (f.id) porId[f.id] = f; });
  (docGab.figurasDesenhadas || []).forEach(function (f) { if (f.id) gabPorId[f.id] = f; });
  const daExplicacao = (docPT.figurasDesenhadas || []).filter(function (f) { return !f.id; });

  return {
    ID: ID, RAIZ: RAIZ, PADRAO: PADRAO, BANCO: BANCO, FONTE: FONTE, tema: tema,
    material: material, lista: lista, gabarito: gabarito, ingles: ingles, sha: sha,
    docPT: docPT, docGab: docGab, docEN: docEN, docGabEN: docGabEN,
    figs: figs, todasAsFiguras: todasAsFiguras,
    porId: porId, gabPorId: gabPorId, daExplicacao: daExplicacao,
    explic: function (receita, trecho) {
      return daExplicacao.filter(function (f) {
        return f.receita === receita && (!trecho || String(f.diretiva).indexOf(trecho) >= 0);
      });
    }
  };
}

/* ================================================================ os detectores
 *
 * Cada um devolve a LISTA do que acusou, com o item nomeado, para a conferencia
 * poder mostrar exatamente onde esta o defeito e para o par envenenado poder
 * comparar a acusacao inteira, e nao so "falhou". */

/* 3. Enunciado com figura remete a ela; enunciado sem figura nao fala dela.
 * O texto de antes DESCREVIA a figura em palavras. Com a figura na folha, o
 * enunciado tem que mandar olhar, porque a figura vem DEPOIS do texto e quem le
 * com dificuldade nao volta sozinho. E o contrario e o defeito silencioso da
 * lista montada a mao: um enunciado que diz "da figura" e cuja diretiva foi
 * apagada. E esta segunda metade que pega os onze temas que prometem figura e
 * nao tem nenhuma. */
function semRemissao(t) {
  const acusa = [];
  ['pt', 'en'].forEach(function (lingua) {
    (t[lingua].exercicios || []).forEach(function (ex) {
      const temFig = diretivasDe(ex.enunciado).length > 0;
      const remete = remeteAFigura(ex.enunciado, lingua);
      if (temFig && !remete) acusa.push(lingua + ' ' + ex.n + ' tem figura e nao remete a ela');
      if (!temFig && remete) acusa.push(lingua + ' ' + ex.n + ' fala da figura e nao tem nenhuma');
    });
  });
  return acusa;
}

/* 4. Nenhum dado numerico existe so no desenho.
 * O numero que a figura imprime tem que estar tambem no texto do enunciado,
 * senao quem le em voz alta ou pelo leitor de tela perde o exercicio. Le os
 * textos IMPRESSOS de cada figura de enunciado (pelo registro, nao pela
 * diretiva) e procura cada numero no texto do item, sem a diretiva. O "30" da
 * marca de angulo conta como 30. Letra nao entra: letra e resultado que a
 * figura constroi. */
function numeroSoNoDesenho(t, lingua, registros) {
  const acusa = [];
  registros.forEach(function (f) {
    if (!f.id || f.fase === 'gabarito') return;
    const ex = (t[lingua].exercicios || []).find((e) => diretivasDe(e.enunciado).some((d) => d.indexOf('id=' + f.id + ' ') >= 0 || / id=.*$/.test(d) && d.indexOf('id=' + f.id) >= 0));
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

/* 5. Toda hachura tem glosa: na legenda da figura e, no exercicio, tambem no
 * enunciado. Hachura sem palavra e textura que o olho tenta ler como conteudo,
 * e a folha pode sair em cinza na fotocopiadora. A hachura e lida no fluxo, com
 * o criterio de familia acima, e nao na diretiva. */
function hachuraSemGlosa(t, lingua, registros) {
  const acusa = [];
  registros.forEach(function (f) {
    if (!ehHachurada(f)) return;
    const nome = lingua + ' ' + nomeDaFigura(f);
    if (!f.legenda) { acusa.push(nome + ' hachurada sem legenda'); return; }
    if (!GLOSA[lingua].test(f.legenda)) acusa.push(nome + ' com legenda que nao glosa a hachura');
    if (f.id && f.fase !== 'gabarito') {
      const ex = (t[lingua].exercicios || []).find((e) => diretivasDe(e.enunciado).some((d) => d.indexOf('id=' + f.id) >= 0));
      if (ex && !GLOSA[lingua].test(semDiretiva(ex.enunciado))) acusa.push(nome + ': o enunciado nao diz que ha regiao hachurada');
    }
  });
  return acusa;
}

/* 8. Figura prometida e ausente no TEMA inteiro.
 * A trava 3 pega o item; esta pega o tema. Um tema cuja explicacao, enunciado
 * ou resposta fala de figura e que nao tem nenhuma diretiva @fig em lugar
 * nenhum e exatamente o defeito que motivou a varredura: onze temas prometiam
 * figura e nenhum deles tinha uma. */
function figuraPrometidaEAusente(t) {
  const acusa = [];
  if (contarDiretivas(t) > 0) return acusa;
  ['pt', 'en'].forEach(function (lingua) {
    const d = t[lingua] || {};
    if (remeteAFigura(d.explicacao, lingua)) {
      acusa.push(lingua + ' explicacao promete figura e o tema nao tem nenhuma');
    }
    (d.exercicios || []).forEach(function (e) {
      if (remeteAFigura(e.enunciado, lingua)) acusa.push(lingua + ' ' + e.n + ' promete figura e o tema nao tem nenhuma');
      if (remeteAFigura(e.resposta, lingua)) acusa.push(lingua + ' resposta ' + e.n + ' promete figura e o tema nao tem nenhuma');
    });
  });
  return acusa;
}

/* E. Escala coerente.
 * Duas afirmacoes falsas, opostas uma da outra. A primeira, figura marcada fora
 * de escala e sem legenda, imprimiria portugues numa folha em ingles se o
 * desenhador inventasse a frase, e por isso ele recusa (ver a parte 1 do
 * _base_prova_travas.js). A segunda, figura marcada fora de escala que saiu
 * exata, e a afirmacao falsa sobre um desenho fiel: pelo foraDeEscala do
 * base.js, isso so acontece com escala=fora escrito na diretiva, porque sem ele
 * a marca nasce justamente de haver valor que nao e numero. */
/* Quais chaves de uma diretiva sao METRICAS depende da receita, e a receita e
 * quem sabe. A primeira escrita desta trava mantinha aqui uma lista propria de
 * chaves de texto, contra a regra da casa: este arquivo nao mantem lista
 * propria, ele pergunta. Agora pergunta ao receitas.js, receita por receita, o
 * mesmo `metricas` que o escalaFora() de la usa para decidir a escala. Uma
 * chave nova numa receita (o `base=` e o `altura=` que estao entrando no
 * triangulo e no quadrilatero) passa a valer aqui sozinha, sem ninguem lembrar
 * de vir mexer nesta linha. */
function metricasDaReceita(nome) {
  const r = ((Receitas && Receitas.receitas) || {})[nome];
  return r && Array.isArray(r.metricas) ? r.metricas : null;
}
/* Os valores metricos escritos na diretiva, com a chave, na ordem das chaves da
 * receita. Devolve null quando a receita e desconhecida: dai a trava nao afirma
 * nada, em vez de afirmar sobre uma lista vazia. */
function valoresMetricos(diretiva, receita) {
  const metricas = metricasDaReceita(receita);
  if (!metricas) return null;
  const texto = String(diretiva || ''), saida = [];
  metricas.forEach(function (chave) {
    const rx = new RegExp('(^|\\s)' + chave + '=(\\S+)', 'g');
    let m;
    while ((m = rx.exec(texto))) saida.push({ chave: chave, valor: m[2] });
  });
  return saida;
}
/* Numerico e o que o base.js chama de numero, parte por parte do valor
 * composto: e a mesma pergunta que o foraDeEscala() de la faz. */
function ehValorNumerico(v) {
  const partes = String(v).split(';');
  return partes.every(function (p) { return p === '' || Bfig.ehNumero(p); });
}
function escalaIncoerente(registros) {
  const acusa = [];
  registros.forEach(function (f) {
    if (!f.foraDeEscala) return;
    if (!f.legenda) { acusa.push(nomeDaFigura(f) + ' marcada fora de escala e sem legenda'); return; }
    if (!/(^|\s)escala=fora(\s|$)/.test(String(f.diretiva))) return;
    const vals = valoresMetricos(f.diretiva, f.receita);
    if (vals === null) return;
    if (vals.length && vals.every(function (v) { return ehValorNumerico(v.valor); })) {
      acusa.push(nomeDaFigura(f) + ' marcada fora de escala e saiu exata: ' +
        vals.map(function (v) { return v.chave + '=' + v.valor; }).join(' ') + ', todo valor e numero');
    }
  });
  return acusa;
}

/* Sanidade da geracao, item a item. Cada um destes e chamado pela trava C e
 * pode ser chamado sozinho pela prova, que e o que faz o par envenenado da
 * trava existir: uma trava que so foi vista aprovando pode estar aprovando
 * tudo. */

/* A diretiva impressa como texto. O fluxo nao e comprimido, entao ela
 * apareceria dentro de um Tj. */
function diretivaImpressa(bytes) { return /@fig/.test(Buffer.from(bytes).toString('latin1')); }

/* 0. Quantas diretivas o tema carrega, nas duas linguas, somando explicacao,
 * enunciado e resposta. E o numero que a trava 0 compara com o do .md. */
function contarDiretivas(t) {
  let n = 0;
  ['pt', 'en'].forEach(function (lingua) {
    const d = t[lingua] || {};
    n += diretivasDe(d.explicacao).length;
    (d.exercicios || []).forEach(function (e) {
      n += diretivasDe(e.enunciado).length + diretivasDe(e.resposta).length;
    });
  });
  return n;
}

/* A. O padrao que acha portugues, montado com as palavras do tema. */
function montarMarcaPt(palavras) {
  return new RegExp(MARCA_PT_NUCLEO + (palavras && palavras.length ? '|' + palavras.join('|') : ''));
}
/* Devolve as pecas na ordem em que a folha as imprime, com repeticao: quem
 * quiser a lista de palavras distintas usa new Set, e quem quiser contar quanto
 * portugues a folha portuguesa tem conta as pecas. */
function palavrasPortuguesasNaFolha(bytes, marcaPt, naoTraduz) {
  const nt = naoTraduz || NAO_TRADUZ;
  return pecasDeTexto(bytes).filter(function (t) {
    return nt.indexOf(t) < 0 && marcaPt.test(t);
  });
}

/* B. Paridade PT x EN, item a item. */
function paridadeItemAItem(t) {
  const acusa = [];
  (t.pt.exercicios || []).forEach(function (ex, i) {
    const en = (t.en.exercicios || [])[i];
    if (!en) { acusa.push('pt ' + ex.n + ' nao tem par em ingles'); return; }
    if (receitasDe(ex.enunciado) !== receitasDe(en.enunciado)) {
      acusa.push('enunciado ' + ex.n + ': pt pede "' + receitasDe(ex.enunciado) + '" e en pede "' + receitasDe(en.enunciado) + '"');
    }
    if (receitasDe(ex.resposta) !== receitasDe(en.resposta)) {
      acusa.push('resposta ' + ex.n + ': pt pede "' + receitasDe(ex.resposta) + '" e en pede "' + receitasDe(en.resposta) + '"');
    }
  });
  return acusa;
}

/* C. Figuras que o conferirFigura reprovou. */
function figurasReprovadas(figs) {
  return figs.filter(function (f) { return (f.conferencia || []).length; })
    .map(function (f) { return nomeDaFigura(f) + ': ' + f.conferencia.join(' ; '); });
}

/* D. Teto de marcas ativas. Cinco e o teto do conferirFigura, e a razao esta
 * escrita la: o teto so sobrevive ao decimo tema se for restricao e nao
 * intencao. */
const TETO_DE_MARCAS = 5;
function acimaDoTeto(figs, teto) {
  const t = teto == null ? TETO_DE_MARCAS : teto;
  return figs.filter(function (f) { return f.marcasAtivas > t; })
    .map(function (f) { return nomeDaFigura(f) + ':' + f.marcasAtivas; });
}

/* C. Estado global do fluxo: um q sem Q recorta o resto da pagina; um tracejado
 * ligado fora de envelope tracejou o rodape e a figura seguinte. */
function estadoDoFluxo(doc) {
  let desbalanceada = 0, tracejadoAberto = 0;
  (doc.paginas || []).forEach(function (pag) {
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
  return { desbalanceada: desbalanceada, tracejadoAberto: tracejadoAberto };
}

/* F. A conta editorial: quantos exercicios ficam sem figura nenhuma. */
function contagemEditorial(t) {
  const total = (t.pt.exercicios || []).length;
  const comFigura = (t.pt.exercicios || []).filter(function (e) { return receitasDe(e.enunciado); }).length;
  const semNada = (t.pt.exercicios || []).filter(function (e) {
    return !receitasDe(e.enunciado) && !receitasDe(e.resposta);
  }).length;
  return { total: total, comFigura: comFigura, semNada: semNada, piso: Math.ceil(total / 3) };
}

/* 1. Dois rotulos na mesma linha de base viram um rotulo so. */
const FOLGA_MINIMA = 14;
function paresNaMesmaLinhaDeBase(figuras, folgaMinima) {
  const piso = folgaMinima == null ? FOLGA_MINIMA : folgaMinima;
  let pior = { pt: Infinity, onde: 'nenhum par na mesma linha de base' };
  const acusa = [];
  figuras.forEach(function (f) {
    const ts = ((f.medido || {}).textos || []).filter(function (t) {
      return String(t.txt).trim() && !ehNumeroDeEscala(f, t);
    });
    for (let i = 0; i < ts.length; i++) {
      for (let j = i + 1; j < ts.length; j++) {
        if (Math.abs(ts[i].y - ts[j].y) > 1.0) continue;
        const esq = ts[i].x <= ts[j].x ? ts[i] : ts[j];
        const dir = ts[i].x <= ts[j].x ? ts[j] : ts[i];
        const folga = dir.x - (esq.x + esq.largura);
        const onde = nomeDaFigura(f) + ' "' + esq.txt + '" e "' + dir.txt + '"';
        if (folga < pior.pt) pior = { pt: folga, onde: onde };
        if (folga < piso) acusa.push(onde + ' a ' + folga.toFixed(2) + ' pt');
      }
    }
  });
  return { pior: pior, acusa: acusa };
}

/* 2. O rotulo do vertice tem que ser atribuivel. */
const PISO_DO_VERTICE = 1.7;
function verticeAtribuivel(figuras) {
  let pior = { razao: Infinity, onde: 'nenhuma figura com A1 e A2' };
  figuras.forEach(function (f) {
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
      if (concorrente / aoVertice < pior.razao) {
        pior = {
          razao: concorrente / aoVertice,
          onde: nomeDaFigura(f) + ' "' + t.txt + '" a ' + aoVertice.toFixed(2) +
            ' pt do seu vertice e a ' + concorrente.toFixed(2) + ' pt ' + comoChama
        };
      }
    });
  });
  return pior;
}

/* 6. Nenhum numero de escala e riscado por arco.
 * A leitura do ver_tiques.py do verificador do MATEM3-03, refeita no fluxo de
 * cada figura: todo arco com traco de 1,1 a 1,3 pt (a circunferencia sai em
 * 1,2; a reta e os eixos sao retos e ficam de fora) e amostrado, e um numero
 * puro em corpo pequeno esta riscado quando a caixa dele, encolhida em 1 pt de
 * cada lado para o roce nao contar, contem um ponto amostrado. Eram 11 por
 * lingua no MATEM3-03 e nenhuma trava do kit acusava. */
function numerosRiscadosPorArco(figuras) {
  const riscados = [];
  figuras.forEach(function (f) {
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
        riscados.push(nomeDaFigura(f) + ' "' + t.txt + '" em (' + n2(t.x) + ', ' + n2(t.y) + ')');
      }
    });
  });
  return riscados;
}

/* 7. Nenhum rotulo e impresso em cima de outro, em direcao nenhuma.
 * A trava 1 so olha pares na MESMA linha de base. O desvio de rotulo do
 * desenho.js foge de traco, marca e ponto, nunca de outro rotulo, entao dois
 * textos podem cair um sobre o outro sem aviso nenhum: medido na primeira
 * tentativa do conserto do g13 do MATEM3-03, quando o "(3, 4)" subiu para onde
 * o "s" da reta mora e a folha imprimiu "(3 s 4)". A caixa e a do glifo lido no
 * fluxo (linha de base menos um quinto do corpo, ate tres quartos do corpo). */
function rotulosSobrepostos(figuras) {
  const sobrepostos = [];
  figuras.forEach(function (f) {
    const ts = ((f.medido || {}).textos || []).filter((t) => String(t.txt).trim());
    const caixa = (t) => ({ x0: t.x, x1: t.x + t.largura, y0: t.y - 0.2 * t.tam, y1: t.y + 0.75 * t.tam });
    for (let i = 0; i < ts.length; i++) {
      for (let j = i + 1; j < ts.length; j++) {
        const a = caixa(ts[i]), b = caixa(ts[j]);
        const dx = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), dy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
        if (dx > 0.5 && dy > 0.5) sobrepostos.push(nomeDaFigura(f) + ' "' + ts[i].txt + '" e "' + ts[j].txt + '" (' + n2(dx) + ' por ' + n2(dy) + ' pt)');
      }
    }
  });
  return sobrepostos;
}

/* ================================================================ as travas genericas
 *
 * op traz o que varia por tema. Numero simples ou {n, rotulo}: o numero e o que
 * a trava confere, o rotulo e a frase editorial daquele tema. Opcao que nao vem
 * desliga a trava correspondente, e a base AVISA que desligou, para nao existir
 * trava silenciosamente ausente numa folha que passou. */
function alvo(v, rotuloPadrao) {
  if (v == null) return null;
  if (typeof v === 'object') return { n: v.n, rotulo: v.rotulo || rotuloPadrao };
  return { n: v, rotulo: rotuloPadrao };
}

function travasGenericas(ctx, op) {
  op = op || {};
  const tema = ctx.tema;

  console.log('\nconferencias');

  /* 0. Retrato atual: o banco lido tem que ser o do .md de hoje.
   * Vale para o banco padrao e para o retrato deste tema, que nasce do mesmo
   * .md: quem passa OUTRO banco (a main, por exemplo) esta comparando de
   * proposito. Escrita porque quem edita o .md esquece de regerar o retrato, e
   * as conferencias passam todas sobre uma versao velha. */
  const ehRetratoDesteTema = new RegExp('_tema_' + ctx.ID + '\\.json$').test(ctx.BANCO);
  const bancoComparavel = ctx.BANCO === ctx.PADRAO || ehRetratoDesteTema;
  /* Os tres ramos sao separados de proposito. Antes havia um so, e um caminho
   * de .md digitado errado imprimia "o banco lido nao e o padrao nem o retrato
   * deste tema", que e FALSO, e a trava ficava desligada com placar verde.
   * Trava desligada tem que dizer o motivo verdadeiro, senao ela mente duas
   * vezes: sobre o tema e sobre si mesma. */
  if (!ctx.FONTE) {
    medido('trava 0 nao rodou: este piloto nao passou caminhoDoMd');
  } else if (!fs.existsSync(ctx.FONTE)) {
    medido('trava 0 nao rodou: o .md nao existe em ' + ctx.FONTE);
  } else if (!bancoComparavel) {
    medido('trava 0 nao rodou: o banco lido nao e o padrao nem o retrato deste tema (' + ctx.BANCO + ')');
  } else {
    const noMd = (fs.readFileSync(ctx.FONTE, 'utf8').match(/(^|\s)@fig\s/g) || []).length;
    const noBanco = contarDiretivas(tema);
    conf('o banco lido foi gerado do ' + ctx.ID + '.md de hoje (' + noMd + ' diretivas no .md)',
      noBanco === noMd ? 'sim' : 'NAO: o banco tem ' + noBanco + ' diretivas, regere o retrato ou rode gerar_banco.py', 'sim');
  }

  /* C. Sanidade da geracao, parte um: nenhuma diretiva saiu impressa como
   * texto. O fluxo nao e comprimido, entao ela apareceria dentro de um Tj. */
  [['material', ctx.material], ['lista', ctx.lista], ['gabarito', ctx.gabarito], ['ingles', ctx.ingles]]
    .forEach(function (par) {
      conf('nenhuma diretiva saiu impressa no ' + par[0], diretivaImpressa(par[1]), false);
    });

  /* A. Nenhuma palavra portuguesa na folha em ingles, e o mesmo padrao acha
   * portugues na folha em portugues. A segunda metade e o par envenenado da
   * propria trava: um detector que nao acha nada nao prova nada. */
  const naoTraduz = NAO_TRADUZ.concat(op.naoTraduz || []);
  const MARCA_PT = montarMarcaPt(op.palavrasPt);
  /* Sem palavrasPt a trava A roda so sobre o nucleo, que e acento e cabecalho:
   * "prisma" numa folha em ingles passaria batido. Isso e escolha legitima num
   * tema de aritmetica e e defeito num tema de geometria, e quem le a folha
   * precisa saber qual dos dois esta vendo. */
  if (op.palavrasPt && op.palavrasPt.length) {
    medido('trava A com ' + op.palavrasPt.length + ' palavras deste tema alem do nucleo: ' + op.palavrasPt.join(' '));
  } else {
    medido('trava A sem palavrasPt: roda so sobre o nucleo (acento e cabecalho), e palavra portuguesa sem acento passa');
  }
  if (op.naoTraduz && op.naoTraduz.length) {
    medido('trava A com ' + op.naoTraduz.length + ' pecas isentas alem das da casa: ' + op.naoTraduz.join(' | '));
  }
  conf('nenhuma palavra portuguesa na folha em ingles',
    [...new Set(palavrasPortuguesasNaFolha(ctx.ingles, MARCA_PT, naoTraduz))].join(', ') || 'nenhuma', 'nenhuma');
  conf('e o mesmo padrao acha portugues na folha em portugues',
    palavrasPortuguesasNaFolha(ctx.material, MARCA_PT, naoTraduz).length >= 10, true);

  /* Os numeros editoriais do tema. Nao ha valor generico para nenhum deles: o
   * que a base garante e que a conta e sempre a mesma e que a ausencia da opcao
   * aparece na folha. */
  const aExplic = alvo(op.diretivasNaExplicacao, 'a explicacao tem ' + (op.diretivasNaExplicacao && op.diretivasNaExplicacao.n != null ? op.diretivasNaExplicacao.n : op.diretivasNaExplicacao) + ' diretivas de figura');
  if (aExplic) {
    const q = receitasDe(tema.pt.explicacao).split(' ').filter(function (s) { return s; }).length;
    conf(aExplic.rotulo, q, aExplic.n);
  } else medido('trava editorial nao rodou: sem diretivasNaExplicacao');

  const aEnun = alvo(op.enunciadosComFigura, 'os enunciados com figura sao ' + (op.enunciadosComFigura && op.enunciadosComFigura.n != null ? op.enunciadosComFigura.n : op.enunciadosComFigura));
  if (aEnun) {
    const quais = tema.pt.exercicios.filter(function (e) { return receitasDe(e.enunciado); })
      .map(function (e) { return e.n; }).join(' ') || 'nenhum';
    conf(aEnun.rotulo, quais, aEnun.n);
  } else medido('trava editorial nao rodou: sem enunciadosComFigura');

  const aMat = alvo(op.registrosNoMaterial, 'o material desenha ' + (op.registrosNoMaterial && op.registrosNoMaterial.n != null ? op.registrosNoMaterial.n : op.registrosNoMaterial) + ' registros');
  if (aMat) conf(aMat.rotulo, (ctx.docPT.figurasDesenhadas || []).length, aMat.n);
  else medido('trava editorial nao rodou: sem registrosNoMaterial');

  const aGab = alvo(op.figurasNoGabarito, 'e o gabarito tem ' + (op.figurasNoGabarito && op.figurasNoGabarito.n != null ? op.figurasNoGabarito.n : op.figurasNoGabarito));
  if (aGab) conf(aGab.rotulo, (ctx.docGab.figurasDesenhadas || []).length, aGab.n);
  else medido('trava editorial nao rodou: sem figurasNoGabarito');

  const aIds = alvo(op.idsDoGabarito, 'e os ids do gabarito sao os pedidos');
  if (aIds) {
    conf(aIds.rotulo, (ctx.docGab.figurasDesenhadas || []).map(function (f) { return f.id; }).join(' '), aIds.n);
  } else medido('trava editorial nao rodou: sem idsDoGabarito');

  /* C. Sanidade da geracao, parte dois: nenhuma figura falhou, nenhum aviso em
   * nenhuma das quatro folhas, nenhuma figura reprovada pelo conferirFigura. */
  conf('nenhuma figura falhou', ctx.figs.filter(function (f) { return f.erro; }).length, 0);
  conf('nenhum aviso de figura no material', (ctx.docPT.avisosFigura || []).length, 0);
  conf('nenhum aviso de figura no gabarito', (ctx.docGab.avisosFigura || []).length, 0);
  conf('nenhum aviso de figura na folha em ingles',
    (ctx.docEN.avisosFigura || []).length + (ctx.docGabEN.avisosFigura || []).length, 0);
  conf('nenhuma figura com falha de conferencia',
    figurasReprovadas(ctx.figs).join(' | ') || 'nenhuma', 'nenhuma');

  /* D. Teto de cinco marcas ativas, com o nome de quem passar. */
  conf('nenhuma figura passa do teto de cinco marcas ativas',
    acimaDoTeto(ctx.figs).join(', ') || 'nenhuma', 'nenhuma');
  console.log('  marcas ativas por figura: ' +
    ctx.figs.map(function (f) { return nomeDaFigura(f) + ':' + f.marcasAtivas; }).join(' '));

  /* E. Escala coerente. Duas conferencias, e elas dizem coisas diferentes.
   *
   * A primeira e a trava generica: qualquer figura fora de escala precisa de
   * legenda, e nenhuma figura exata pode ser marcada de fora de escala. Ela
   * ACEITA figura fora de escala com legenda, porque prototipo em letra e
   * legitimo.
   *
   * A segunda e editorial e vem por opcao, porque e afirmacao sobre AQUELE
   * tema: "neste tema nenhuma figura e chute, entao nenhuma pode sair marcada".
   * Ela existe porque foi perdida uma vez: na unificacao dos pilotos a
   * conferencia do MATEM3-12 "nenhuma figura marcada fora de escala: todas saem
   * exatas" foi substituida pela generica, que e mais fraca, e o tema deixou de
   * afirmar o que afirmava. Quem tem tema com prototipo em letra simplesmente
   * nao passa a opcao. */
  conf('nenhuma figura afirma escala falsa: fora de escala pede legenda, e desenho exato nao se marca',
    escalaIncoerente(ctx.todasAsFiguras).join('; ') || 'nenhuma', 'nenhuma');
  /* Receita que nao declara `metricas` deixa a segunda metade da trava E muda
   * naquela figura, e mudez tem que aparecer na folha: e o aviso para o dia em
   * que uma receita nova esquecer a lista. */
  const semMetricas = [...new Set(ctx.todasAsFiguras
    .filter(function (f) { return f.receita && valoresMetricos(f.diretiva, f.receita) === null; })
    .map(function (f) { return f.receita; }))];
  if (semMetricas.length) {
    medido('trava E muda em ' + semMetricas.length + ' receita(s) sem lista `metricas` declarada: ' +
      semMetricas.join(', ') + '. A segunda metade dela nao roda nessas figuras');
  }
  const aFora = alvo(op.figurasForaDeEscala, 'as figuras marcadas fora de escala sao as esperadas');
  if (aFora) {
    conf(aFora.rotulo,
      ctx.todasAsFiguras.filter(function (f) { return f.foraDeEscala; })
        .map(nomeDaFigura).join(', ') || 'nenhuma', aFora.n);
  } else medido('trava E sem a conta editorial: sem figurasForaDeEscala, so a coerencia e conferida');

  /* B. Paridade PT x EN: as duas linguas usam as mesmas receitas, na mesma
   * ordem, item a item, e tambem na explicacao. */
  conf('as duas linguas usam as mesmas receitas na mesma ordem, item a item',
    paridadeItemAItem(tema).join('; ') || 'nenhum descompasso', 'nenhum descompasso');
  conf('a explicacao tambem', receitasDe(tema.pt.explicacao), receitasDe(tema.en.explicacao));

  /* C. Sanidade da geracao, parte tres: estado global do fluxo. Um q sem Q
   * recorta o resto da pagina; um tracejado ligado fora de envelope tracejou o
   * rodape e a figura seguinte. */
  [['material', ctx.docPT], ['gabarito', ctx.docGab], ['ingles', ctx.docEN]].forEach(function (par) {
    const e = estadoDoFluxo(par[1]);
    conf('todo q tem o seu Q no ' + par[0], e.desbalanceada, 0);
    conf('nenhum tracejado ligado fora de envelope no ' + par[0], e.tracejadoAberto, 0);
  });

  /* F. Pelo menos um terco dos exercicios sem figura nenhuma. E regra
   * editorial: a figura no enunciado e excecao, nao regra. */
  const ed = contagemEditorial(tema);
  console.log('\neditorial: ' + ed.comFigura + ' de ' + ed.total +
    ' enunciados com figura, ' + ed.semNada + ' exercicios sem figura nenhuma');
  conf('pelo menos um terco dos exercicios sem figura nenhuma', ed.semNada >= ed.piso, true);

  /* ============================================================ leitura da folha */
  console.log('\nleitura da folha');

  /* 1. Dois rotulos na mesma linha de base viram um rotulo so.
   * Medido no MATEM3-04: na elipse da p.1 o "a" acabava em x = 340,31 e o "F1"
   * comecava em x = 350,25, os dois na linha de base 640, e a folha lia "a  F1"
   * em sequencia. O piso de 14 pt sao 4,9 mm no papel.
   *
   * Os numeros da escala de um eixo ficam de fora: eles moram na mesma linha de
   * base POR CONSTRUCAO e se leem como uma regua, e o eixos() ja mede que a
   * caixa de um nao invade a do vizinho. Medido no 18 do MATEM3-03 (raio 13,
   * passo 4): "-12" e "-8" a 11,11 pt, legiveis e separados. Num tema sem plano
   * o planoDaFigura devolve null e nada e excluido. */
  const folgas = paresNaMesmaLinhaDeBase(ctx.todasAsFiguras);
  medido('menor folga entre dois rotulos na mesma linha de base: ' +
    folgas.pior.pt.toFixed(2) + ' pt, em ' + folgas.pior.onde);
  conf('nenhum par de rotulos na mesma linha de base fica a menos de ' + FOLGA_MINIMA + ' pt',
    folgas.acusa.join('; ') || 'nenhum', 'nenhum');

  /* 2. O rotulo do vertice tem que ser atribuivel: mais perto do vertice dele
   * do que de qualquer outra bolinha e do que do cruzamento das assintotas.
   * Nasceu na hiperbole do MATEM3-04 e passa vazia em tema sem conica, o que e
   * de proposito: no dia em que uma conica entrar no tema ela ja esta armada. */
  const piorVertice = verticeAtribuivel(ctx.todasAsFiguras);
  medido(piorVertice.onde + ' (razao ' + piorVertice.razao.toFixed(2) + ')');
  conf('o rotulo do vertice fica ao menos ' + PISO_DO_VERTICE +
    ' vezes mais perto do seu vertice do que do concorrente mais proximo',
    piorVertice.razao >= PISO_DO_VERTICE, true);

  /* 3. */
  conf('todo enunciado com figura remete a ela, e nenhum sem figura fala dela',
    semRemissao(tema).join('; ') || 'nenhum', 'nenhum');

  /* 4. */
  const soNoDesenho = numeroSoNoDesenho(tema, 'pt', ctx.docPT.figurasDesenhadas || [])
    .concat(numeroSoNoDesenho(tema, 'en', ctx.docEN.figurasDesenhadas || []));
  conf('todo numero impresso numa figura de enunciado esta no texto do item, nas duas linguas',
    soNoDesenho.join('; ') || 'nenhum', 'nenhum');

  /* 5. */
  const hachuradas = ctx.todasAsFiguras.filter(ehHachurada).length;
  medido(hachuradas + ' figuras hachuradas nas quatro folhas');
  const aHach = alvo(op.hachurasMinimas, 'ha hachura para glosar');
  if (aHach) conf(aHach.rotulo, hachuradas >= aHach.n, true);
  else medido('trava 5 sem piso de hachura: sem hachurasMinimas, so a glosa e conferida');
  conf('toda figura hachurada tem legenda de glosa e o enunciado nomeia a regiao, nas duas linguas',
    hachuraSemGlosa(tema, 'pt', ctx.docPT.figurasDesenhadas || [])
      .concat(hachuraSemGlosa(tema, 'en', ctx.docEN.figurasDesenhadas || [])).join('; ') || 'nenhuma', 'nenhuma');

  /* 6. */
  const riscados = numerosRiscadosPorArco(ctx.todasAsFiguras);
  medido('numeros riscados por arco de 1,1 a 1,3 pt nas quatro folhas: ' + riscados.length +
    (riscados.length ? ' (' + riscados.join('; ') + ')' : ''));
  conf('nenhum numero de escala tem a caixa atravessada por arco', riscados.length, 0);

  /* 7. */
  const sobrepostos = rotulosSobrepostos(ctx.todasAsFiguras);
  medido('pares de rotulos com as caixas cruzadas nas quatro folhas: ' + sobrepostos.length +
    (sobrepostos.length ? ' (' + sobrepostos.join('; ') + ')' : ''));
  conf('nenhum rotulo e impresso em cima de outro', sobrepostos.length, 0);

  /* 8. Figura prometida e ausente no tema inteiro.
   *
   * Aqui ela e VAZIA POR CONSTRUCAO e isso esta escrito na folha de proposito.
   * O figuraPrometidaEAusente devolve vazio assim que o tema tem uma diretiva,
   * e um piloto de tema so existe para tema que TEM figura: neste lugar ela
   * passa porque nao tem o que perguntar, e nao porque o tema esteja limpo.
   * Deixa-la aqui verde e calada seria a pior especie de trava, a que da
   * garantia sem conferir nada.
   *
   * Quem de fato roda esta trava e o figuras/_varredura_banco.js, sobre os 148
   * temas do banco, que sao majoritariamente temas SEM piloto: e la que o
   * defeito existe. A conferencia fica aqui so para o caso do tema que perdeu
   * todas as diretivas numa edicao e continua falando de figura. */
  const diretivasDoTema = contarDiretivas(tema);
  if (diretivasDoTema > 0) {
    medido('trava 8 vazia por construcao: o tema tem ' + diretivasDoTema +
      ' diretivas, entao ela nao pode acusar. Quem roda a trava 8 de verdade e o _varredura_banco.js, sobre o banco inteiro');
  }
  conf('o tema nao promete figura sem ter nenhuma',
    figuraPrometidaEAusente(tema).join('; ') || 'nenhum', 'nenhum');
}

/* Numero puro em corpo pequeno na faixa de numeros de um eixo: logo abaixo do
 * eixo x ou logo a esquerda do eixo y. O "O" da origem ao lado do primeiro
 * tique ("-2   O", medido a 13,95 pt no 19 do MATEM3-03) e a montagem do livro,
 * e o tique nao e rotulo da figura. Uma cota numerica continua entrando na
 * conta da trava 1, porque nao mora na faixa. */
const NUMERO_PURO = /^-?\d+([.,]\d+)?$/;
function ehNumeroDeEscala(f, t) {
  if (!NUMERO_PURO.test(String(t.txt).trim())) return false;
  const P = planoDaFigura(f);
  if (!P) return false;
  const abaixoDoX = t.y < P.O.y && t.y > P.O.y - 16;
  const esquerdaDoY = t.x + t.largura < P.O.x && t.x + t.largura > P.O.x - 16;
  return abaixoDoX || esquerdaDoY;
}

/* Imprime os avisos de figura das quatro folhas, no fim, como os pilotos fazem. */
function avisos(ctx) {
  [['pt', ctx.docPT], ['gb', ctx.docGab], ['en', ctx.docEN], ['en gb', ctx.docGabEN]].forEach(function (par) {
    (par[1].avisosFigura || []).forEach(function (a) { console.log('  ' + par[0] + ' . ' + a); });
  });
}

module.exports = {
  PDFGen: PDFGen, RAIZ: RAIZ, PADRAO: PADRAO,
  abrir: abrir, comDoc: comDoc, rascunho: rascunho, avisos: avisos,
  conf: conf, medido: medido, placar: placar,
  lerCaminhos: lerCaminhos, emBezier: emBezier, pontosDoSub: pontosDoSub, caixaDe: caixaDe,
  voltasInteiras: voltasInteiras, textos: textos, tem: tem, quadradinhos: quadradinhos,
  triangulos: triangulos, dist: dist, n2: n2, n4: n4, receitasDe: receitasDe,
  nomeDaFigura: nomeDaFigura, bolinhasDe: bolinhasDe, segmentos09: segmentos09,
  planoDaFigura: planoDaFigura, pecasDeTexto: pecasDeTexto,
  semDiretiva: semDiretiva, diretivasDe: diretivasDe, clonar: clonar,
  FORMA_FORTE: FORMA_FORTE, REMETE_NUA: REMETE_NUA,
  SENTIDO_DE_FORMA: SENTIDO_DE_FORMA,
  textoDeRemissao: textoDeRemissao, remeteAFigura: remeteAFigura, formaForte: formaForte,
  ocorrenciasDeRemissao: ocorrenciasDeRemissao,
  GLOSA: GLOSA, NAO_TRADUZ: NAO_TRADUZ, MARCA_PT_NUCLEO: MARCA_PT_NUCLEO,
  NUMERO_PURO: NUMERO_PURO, ehNumeroDeEscala: ehNumeroDeEscala,
  ehHachurada: ehHachurada, inclinacoesDeHachura: inclinacoesDeHachura,
  semRemissao: semRemissao, numeroSoNoDesenho: numeroSoNoDesenho,
  hachuraSemGlosa: hachuraSemGlosa, figuraPrometidaEAusente: figuraPrometidaEAusente,
  escalaIncoerente: escalaIncoerente, valoresMetricos: valoresMetricos,
  diretivaImpressa: diretivaImpressa, contarDiretivas: contarDiretivas,
  montarMarcaPt: montarMarcaPt,
  palavrasPortuguesasNaFolha: palavrasPortuguesasNaFolha,
  paridadeItemAItem: paridadeItemAItem, figurasReprovadas: figurasReprovadas,
  acimaDoTeto: acimaDoTeto, TETO_DE_MARCAS: TETO_DE_MARCAS,
  estadoDoFluxo: estadoDoFluxo, contagemEditorial: contagemEditorial,
  paresNaMesmaLinhaDeBase: paresNaMesmaLinhaDeBase, FOLGA_MINIMA: FOLGA_MINIMA,
  verticeAtribuivel: verticeAtribuivel, PISO_DO_VERTICE: PISO_DO_VERTICE,
  numerosRiscadosPorArco: numerosRiscadosPorArco, rotulosSobrepostos: rotulosSobrepostos,
  travasGenericas: travasGenericas
};
