/* figuras/_prova_desenho_auditor.js
 * Auditor de HIERARQUIA DE TINTA, independente do desenho.js.
 *
 * Ele nao chama nenhuma funcao do figuras/desenho.js e nao repete nenhuma
 * decisao dele. Ele abre o PDF ja escrito, interpreta o fluxo de conteudo
 * operador a operador (q, Q, w, RG, d, m, l, c, re, S, s) e devolve cada traco
 * com a espessura, a cor e o padrao de tracejado que o leitor de PDF vai usar de
 * fato. E por isso que ele serve de prova: com o conserto desligado ele acusa,
 * com o conserto ligado ele cala, e o que ele le sao os bytes da folha e nao a
 * intencao de quem desenhou.
 *
 * As tres regras auditadas, todas escritas na especificacao:
 *
 *   1. teal mais tracejado e o codigo da camada de GABARITO. Numa folha que so
 *      tem enunciado (a lista) ele nao pode aparecer nenhuma vez.
 *   2. linha que carrega a questao nao pode sair na espessura minima. Todo traco
 *      em teal e traco acrescentado por cima da figura, entao ele e o objeto do
 *      exercicio: abaixo de 0,9 pt e defeito.
 *   3. guia de leitura em [1 2] e o padrao que mais some na fotocopia: ponto de
 *      0,35 mm com vao de 0,7 mm. Guia que amarra a leitura vai em [2 2].
 *
 * Uso:
 *   node figuras/_prova_desenho_auditor.js                (audita o piloto)
 *   node figuras/_prova_desenho_auditor.js arquivo.pdf    (audita um PDF)
 *
 * Sai com codigo 1 quando acha defeito, para servir de porta.
 *
 * A regra 1 vale por ARQUIVO e a fase e deduzida do nome, porque o documento
 * que a professora imprime e inteiro de uma fase so: lista e enunciado,
 * gabarito e resposta, e o material traz as duas mas so a de enunciado nas
 * figuras dos exercicios. Uma folha de PROVA que mistura as duas de proposito,
 * como a _prova_desenho_tinta_com.pdf, nao pode ser julgada por aqui pelo nome:
 * quem sabe qual cartao e de qual fase e o _prova_desenho_tinta.js, e e ele que
 * conta os tracos de cada uma.
 *
 * Regra da casa: nunca usar travessao.
 */
'use strict';
const fs = require('fs');
const path = require('path');

/* ------------------------------------------------------------ leitura crua */

/* Os fluxos deste gerador nao sao comprimidos e as fontes sao base-14, entao
 * todo "stream ... endstream" do arquivo e fluxo de conteudo de pagina. */
function fluxos(caminho) {
  const bruto = fs.readFileSync(caminho, 'latin1');
  const saida = [];
  let i = 0;
  for (;;) {
    const a = bruto.indexOf('stream', i);
    if (a < 0) break;
    /* "endstream" tambem casa com "stream": pular a ocorrencia que e o fim. */
    if (bruto.slice(a - 3, a) === 'end') { i = a + 6; continue; }
    let ini = a + 6;
    if (bruto[ini] === '\r') ini++;
    if (bruto[ini] === '\n') ini++;
    const fim = bruto.indexOf('endstream', ini);
    if (fim < 0) break;
    saida.push(bruto.slice(ini, fim));
    i = fim + 9;
  }
  return saida;
}

/* Varredura de tokens que respeita string entre parenteses: um (12 S) dentro de
 * um Tj nao pode virar operador S. */
function tokens(s) {
  const out = [];
  const delim = /[\s/[\]()<>]/;
  let i = 0;
  const n = s.length;
  while (i < n) {
    const c = s[i];
    if (c === '(') {
      let d = 1; i++;
      while (i < n && d > 0) {
        if (s[i] === '\\') i += 2;
        else { if (s[i] === '(') d++; else if (s[i] === ')') d--; i++; }
      }
      out.push('(str)');
      continue;
    }
    if (c === ' ' || c === '\n' || c === '\r' || c === '\t') { i++; continue; }
    if (c === '[' || c === ']') { out.push(c); i++; continue; }
    if (c === '<' || c === '>') { i++; continue; }
    if (c === '/') {
      let j = i + 1;
      while (j < n && !delim.test(s[j])) j++;
      out.push(s.slice(i, j)); i = j; continue;
    }
    let j = i;
    while (j < n && !delim.test(s[j])) j++;
    if (j === i) j++;
    out.push(s.slice(i, j)); i = j;
  }
  return out;
}

function ehNum(t) { return /^[-+]?(\d+\.?\d*|\.\d+)$/.test(t); }

/* Interpreta um fluxo e devolve os tracos pintados, cada um com o estado
 * grafico vigente no momento do S. */
function tracosDoFluxo(fluxo, pagina) {
  const tk = tokens(fluxo);
  let est = { w: 1, cor: [0, 0, 0], dash: '[]', preench: [0, 0, 0] };
  const pilha = [];
  let pilhaArr = null;          // acumulando um array [ ... ]
  const op = [];                // operandos pendentes
  let emTexto = false;
  let pts = [];
  const saida = [];

  function copia(e) { return { w: e.w, cor: e.cor.slice(), dash: e.dash, preench: e.preench.slice() }; }
  function nums(k) {
    const v = [];
    for (let i = op.length - k; i < op.length; i++) v.push(Number(op[i]));
    return v;
  }
  function caixa(ps) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of ps) {
      if (p[0] < x0) x0 = p[0];
      if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1];
      if (p[1] > y1) y1 = p[1];
    }
    return { x0, y0, x1, y1 };
  }

  for (let i = 0; i < tk.length; i++) {
    const t = tk[i];
    if (t === '[') { pilhaArr = []; continue; }
    if (t === ']') {
      op.push('[' + (pilhaArr || []).join(' ') + ']');
      pilhaArr = null;
      continue;
    }
    if (pilhaArr) { pilhaArr.push(t); continue; }
    if (ehNum(t) || t[0] === '/' || t === '(str)') { op.push(t); continue; }

    switch (t) {
      case 'q': pilha.push(copia(est)); break;
      case 'Q': if (pilha.length) est = pilha.pop(); break;
      case 'w': est.w = Number(op[op.length - 1]); break;
      case 'RG': est.cor = nums(3); break;
      case 'rg': est.preench = nums(3); break;
      case 'd': est.dash = String(op[op.length - 2] || '[]'); break;
      case 'BT': emTexto = true; break;
      case 'ET': emTexto = false; break;
      case 'm': case 'l': {
        const v = nums(2);
        pts.push(v);
        break;
      }
      case 'c': {
        const v = nums(6);
        pts.push([v[0], v[1]], [v[2], v[3]], [v[4], v[5]]);
        break;
      }
      case 'v': case 'y': {
        const v = nums(4);
        pts.push([v[0], v[1]], [v[2], v[3]]);
        break;
      }
      case 're': {
        const v = nums(4);
        pts.push([v[0], v[1]], [v[0] + v[2], v[1] + v[3]]);
        break;
      }
      case 'S': case 's': case 'B': case 'B*': case 'b': case 'b*': {
        if (!emTexto && pts.length) {
          const cx = caixa(pts);
          saida.push({
            pagina, w: est.w, cor: est.cor.slice(), dash: est.dash,
            x0: cx.x0, y0: cx.y0, x1: cx.x1, y1: cx.y1,
            comprimento: Math.hypot(cx.x1 - cx.x0, cx.y1 - cx.y0),
            pontos: pts.length
          });
        }
        pts = [];
        break;
      }
      case 'f': case 'F': case 'f*': case 'n': pts = []; break;
      default: break;
    }
    op.length = 0;
  }
  return saida;
}

function tracosDoPdf(caminho) {
  const fl = fluxos(caminho);
  let todos = [];
  for (let i = 0; i < fl.length; i++) todos = todos.concat(tracosDoFluxo(fl[i], i + 1));
  return todos;
}

/* ------------------------------------------------------------ as regras */

const TEAL = [0.180392, 0.490196, 0.419608];
const MUTED = [0.419608, 0.447059, 0.501961];
const TEXTO = [0.101961, 0.109804, 0.121569];

function mesmaCor(c, alvo) {
  if (!c || c.length < 3) return false;
  for (let i = 0; i < 3; i++) if (Math.abs(c[i] - alvo[i]) > 0.004) return false;
  return true;
}
function tracejado(d) { return d && d !== '[]' && d !== '[ ]'; }
function padrao(d) { return String(d).replace(/\s+/g, ' ').trim(); }

/* A folha de enunciado nao pode ter NENHUM traco no codigo do gabarito. */
function acharGabaritoNoEnunciado(tracos) {
  return tracos.filter(t => mesmaCor(t.cor, TEAL) && tracejado(t.dash));
}
/* Traco em teal e traco acrescentado por cima da figura, ou seja o objeto do
 * exercicio. Na espessura minima ele e o elemento mais fraco da folha. */
function acharObjetoFraco(tracos) {
  return tracos.filter(t => mesmaCor(t.cor, TEAL) && t.w < 0.9 - 1e-9);
}
/* Guia que some na fotocopia: ponto de 1 pt com vao de 2 pt. */
function acharGuiaFantasma(tracos) {
  return tracos.filter(t => padrao(t.dash) === '[1 2]');
}
/* Guia em cinza medio: 4,79 de contraste, mas 26 por cento mais clara do que a
 * tinta do contorno e a primeira a sumir na segunda geracao de copia. */
function acharGuiaMuted(tracos) {
  return tracos.filter(t => mesmaCor(t.cor, MUTED) && tracejado(t.dash));
}

function resumo(lista, quantos) {
  const q = quantos == null ? 4 : quantos;
  return lista.slice(0, q).map(t =>
    'p' + t.pagina + ' (' + t.x0.toFixed(1) + ',' + t.y0.toFixed(1) + ')-(' +
    t.x1.toFixed(1) + ',' + t.y1.toFixed(1) + ') w=' + t.w +
    ' cor=' + t.cor.map(v => v.toFixed(3)).join('/') + ' d=' + padrao(t.dash)
  );
}

/* ------------------------------------------------------------ porta */

function auditar(caminho, op) {
  op = op || {};
  const nome = path.basename(caminho);
  const tracos = tracosDoPdf(caminho);
  const falhas = [];
  console.log('\n' + nome + ': ' + tracos.length + ' tracos pintados em ' +
    (tracos.length ? tracos[tracos.length - 1].pagina : 0) + ' fluxos');

  if (op.gabarito !== true) {
    const g = acharGabaritoNoEnunciado(tracos);
    if (g.length) {
      falhas.push('R1 ' + g.length + ' traco(s) em teal tracejado numa folha de enunciado');
      resumo(g).forEach(l => console.log('   R1  ' + l));
    } else console.log('   R1  OK    nenhum traco vestido de gabarito');

    const f = acharObjetoFraco(tracos);
    if (f.length) {
      falhas.push('R2 ' + f.length + ' traco(s) de destaque abaixo de 0,9 pt');
      resumo(f).forEach(l => console.log('   R2  ' + l));
    } else console.log('   R2  OK    nenhum traco de destaque na espessura minima');
  } else {
    const g = acharGabaritoNoEnunciado(tracos);
    console.log('   R1  folha de gabarito: ' + g.length + ' traco(s) em teal tracejado, que e onde eles podem estar');
  }

  const gf = acharGuiaFantasma(tracos);
  if (gf.length) {
    falhas.push('R3 ' + gf.length + ' guia(s) no padrao [1 2]');
    resumo(gf).forEach(l => console.log('   R3  ' + l));
  } else console.log('   R3  OK    nenhuma guia no padrao [1 2]');

  const gm = acharGuiaMuted(tracos);
  if (gm.length) {
    resumo(gm, 3).forEach(l => console.log('   R4  aviso  guia tracejada em muted: ' + l));
  }
  return falhas;
}

if (require.main === module) {
  const arg = process.argv.slice(2);
  const aqui = __dirname;
  const alvos = arg.length
    ? arg.map(a => ({ caminho: path.resolve(a), gabarito: /gabarito/.test(a) }))
    : [
      { caminho: path.join(aqui, '_piloto_MAT07-12_lista.pdf'), gabarito: false },
      { caminho: path.join(aqui, '_piloto_MAT07-12_gabarito.pdf'), gabarito: true },
      { caminho: path.join(aqui, '_prova_desenho.pdf'), gabarito: false }
    ];
  let falhas = [];
  for (const a of alvos) {
    if (!fs.existsSync(a.caminho)) { console.log('\nfalta ' + a.caminho); continue; }
    falhas = falhas.concat(auditar(a.caminho, { gabarito: a.gabarito }).map(f => path.basename(a.caminho) + ': ' + f));
  }
  console.log('\n' + (falhas.length ? falhas.length + ' DEFEITO(S)' : 'nenhum defeito de hierarquia de tinta'));
  falhas.forEach(f => console.log('  ' + f));
  process.exit(falhas.length ? 1 : 0);
}

module.exports = { tracosDoPdf, tracosDoFluxo, mesmaCor, TEAL, MUTED, TEXTO, padrao };
