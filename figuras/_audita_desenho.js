/* figuras/_audita_desenho.js
 * Medidor da figura da desigualdade triangular, direto no fluxo de conteudo.
 *
 * Nao chama nenhuma funcao do figuras/desenho.js: abre o PDF ja escrito, anda
 * pelos operadores (q, Q, w, RG, rg, d, m, l, c, re, S, f, B, BT, Tf, Td, Tj) e
 * devolve cada elemento pintado com a espessura, a cor, o tracejado e o
 * contraste WCAG que o leitor de PDF vai usar de fato. E por isso que ele serve
 * de medida: o que ele le sao os bytes da folha e nao a intencao de quem
 * desenhou.
 *
 * O _prova_desenho_auditor.js le so o que sai com S, porque as tres regras dele
 * sao de traco. Aqui o preenchimento tambem precisa entrar: as duas pontas de
 * seta da cota saem com f e sao metade do que segura o vao na folha.
 *
 * Uso:
 *   node figuras/_audita_desenho.js
 *   node figuras/_audita_desenho.js arquivo.pdf 3
 *
 * Regra da casa: nunca usar travessao.
 */
'use strict';
const fs = require('fs');
const path = require('path');

/* ------------------------------------------------------------ leitura crua */

function fluxos(caminho) {
  const bruto = fs.readFileSync(caminho, 'latin1');
  const saida = [];
  let i = 0;
  for (;;) {
    const a = bruto.indexOf('stream', i);
    if (a < 0) break;
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

function tokens(s) {
  const out = [];
  const delim = /[\s/[\]()<>]/;
  let i = 0;
  const n = s.length;
  while (i < n) {
    const c = s[i];
    if (c === '(') {
      let d = 1, j = i + 1, txt = '';
      while (j < n && d > 0) {
        if (s[j] === '\\') { txt += s[j + 1]; j += 2; continue; }
        if (s[j] === '(') d++;
        else if (s[j] === ')') { d--; if (!d) { j++; break; } }
        txt += s[j]; j++;
      }
      out.push({ str: txt }); i = j; continue;
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

function ehNum(t) { return typeof t === 'string' && /^[-+]?(\d+\.?\d*|\.\d+)$/.test(t); }

/* ------------------------------------------------------------ contraste WCAG */

function luminancia(c) {
  const canal = [0.2126, 0.7152, 0.0722];
  let s = 0;
  for (let i = 0; i < 3; i++) {
    const v = c[i];
    s += canal[i] * (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  }
  return s;
}
/* Contra o branco, que e a folha. */
function contraste(c) { return 1.05 / (luminancia(c) + 0.05); }
function hex(c) {
  return '#' + c.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255)
    .toString(16).toUpperCase().padStart(2, '0')).join('');
}

/* ------------------------------------------------------------ interpretador */

function elementosDoFluxo(fluxo, pagina) {
  const tk = tokens(fluxo);
  let est = {
    w: 1, cor: [0, 0, 0], preench: [0, 0, 0], dash: '[]',
    tam: 0, fonte: ''
  };
  const pilha = [];
  let arr = null;
  const op = [];
  let emTexto = false, tm = null;
  let pts = [];
  const saida = [];

  function copia(e) {
    return { w: e.w, cor: e.cor.slice(), preench: e.preench.slice(), dash: e.dash, tam: e.tam, fonte: e.fonte };
  }
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
  function pintar(tipo) {
    if (emTexto || !pts.length) { pts = []; return; }
    const cx = caixa(pts);
    const cor = tipo === 'f' ? est.preench.slice() : est.cor.slice();
    saida.push({
      pagina, tipo, w: tipo === 'f' ? 0 : est.w, cor,
      dash: String(est.dash).replace(/\s+/g, ' ').trim(),
      x0: cx.x0, y0: cx.y0, x1: cx.x1, y1: cx.y1,
      largura: cx.x1 - cx.x0, altura: cx.y1 - cx.y0,
      comprimento: Math.hypot(cx.x1 - cx.x0, cx.y1 - cx.y0),
      pontos: pts.length, contraste: contraste(cor), hex: hex(cor)
    });
    pts = [];
  }

  for (let i = 0; i < tk.length; i++) {
    const t = tk[i];
    if (t === '[') { arr = []; continue; }
    if (t === ']') { op.push('[' + (arr || []).join(' ') + ']'); arr = null; continue; }
    if (arr) { arr.push(t); continue; }
    if (typeof t === 'object') { op.push(t); continue; }
    if (ehNum(t) || t[0] === '/') { op.push(t); continue; }

    switch (t) {
      case 'q': pilha.push(copia(est)); break;
      case 'Q': if (pilha.length) est = pilha.pop(); break;
      case 'w': est.w = Number(op[op.length - 1]); break;
      case 'RG': est.cor = nums(3); break;
      case 'rg': est.preench = nums(3); break;
      case 'd': est.dash = String(op[op.length - 2] || '[]'); break;
      case 'BT': emTexto = true; tm = null; break;
      case 'ET': emTexto = false; break;
      case 'Tf': est.tam = Number(op[op.length - 1]); est.fonte = String(op[op.length - 2] || ''); break;
      case 'Td': case 'TD': tm = nums(2); break;
      case 'Tm': { const v = nums(6); tm = [v[4], v[5]]; break; }
      case 'Tj': {
        const s = op[op.length - 1];
        const txt = s && typeof s === 'object' ? s.str : '';
        if (txt) {
          saida.push({
            pagina, tipo: 'texto', texto: txt, tam: est.tam, fonte: est.fonte,
            cor: est.preench.slice(), hex: hex(est.preench), contraste: contraste(est.preench),
            x0: tm ? tm[0] : 0, y0: tm ? tm[1] : 0, x1: tm ? tm[0] : 0, y1: tm ? tm[1] : 0,
            w: 0, dash: '[]'
          });
        }
        break;
      }
      case 'm': case 'l': pts.push(nums(2)); break;
      case 'c': { const v = nums(6); pts.push([v[0], v[1]], [v[2], v[3]], [v[4], v[5]]); break; }
      case 'v': case 'y': { const v = nums(4); pts.push([v[0], v[1]], [v[2], v[3]]); break; }
      case 're': { const v = nums(4); pts.push([v[0], v[1]], [v[0] + v[2], v[1] + v[3]]); break; }
      case 'S': case 's': pintar('S'); break;
      case 'f': case 'F': case 'f*': pintar('f'); break;
      case 'B': case 'B*': case 'b': case 'b*': pintar('B'); break;
      case 'n': pts = []; break;
      default: break;
    }
    op.length = 0;
  }
  return saida;
}

function elementosDoPdf(caminho) {
  const fl = fluxos(caminho);
  let todos = [];
  for (let i = 0; i < fl.length; i++) todos = todos.concat(elementosDoFluxo(fl[i], i + 1));
  return todos;
}

/* ------------------------------------------ achar a figura da desigualdade
 *
 * A assinatura dela no fluxo, e nao a posicao na folha: tres reguas horizontais
 * de 1,2 pt, uma delas com o comprimento dos 12 e as duas de cima somando 11.
 * Achado o par mais comprido, a regiao e a caixa dele folgada de 30 pt, que
 * pega os tacos, as guias verticais, a cota inteira e os rotulos. */
function acharRegiao(elems, pagina) {
  const naPag = elems.filter(e => e.pagina === pagina);
  const reguas = naPag.filter(e => e.tipo === 'S' && Math.abs(e.w - 1.2) < 0.001 &&
    e.altura < 0.6 && e.largura > 100);
  if (!reguas.length) return null;
  reguas.sort((a, b) => b.largura - a.largura);
  const base = reguas[0];
  const juntos = reguas.filter(r => Math.abs(r.x0 - base.x0) < base.largura &&
    Math.abs(r.y0 - base.y0) < 120);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const r of juntos) {
    x0 = Math.min(x0, r.x0); x1 = Math.max(x1, r.x1);
    y0 = Math.min(y0, r.y0); y1 = Math.max(y1, r.y1);
  }
  return { x0: x0 - 30, x1: x1 + 30, y0: y0 - 30, y1: y1 + 46, base };
}

function dentro(e, r) {
  return e.x1 >= r.x0 && e.x0 <= r.x1 && e.y1 >= r.y0 && e.y0 <= r.y1;
}

/* ------------------------------------------------------------ relatorio */

const PISO_ESPESSURA = 0.6;

function papelDe(e, reg) {
  if (e.tipo === 'texto') return 'rotulo "' + e.texto + '"';
  if (e.tipo === 'f') return 'ponta de seta (preenchimento)';
  const horizontal = e.altura < 0.6, vertical = e.largura < 0.6;
  if (Math.abs(e.w - 1.2) < 0.001 && horizontal && e.largura > 100) return 'vareta (contexto)';
  if (vertical && e.altura < 12 && e.y0 > reg.base.y0 - 8) return 'tracinho de extremidade';
  if (vertical && e.dash !== '[]') return 'linha de chamada do vao ate a base (tracejada)';
  if (vertical) return 'linha de chamada';
  if (horizontal) return 'linha de cota';
  return 'traco';
}

function linha(e, reg) {
  const p = papelDe(e, reg).padEnd(46, ' ');
  if (e.tipo === 'texto') {
    return p + '  ' + e.tam.toFixed(2) + ' pt de corpo   ' + e.hex +
      '   ' + e.contraste.toFixed(2) + ':1';
  }
  const esp = e.tipo === 'f'
    ? ('solido ' + e.largura.toFixed(2) + ' x ' + e.altura.toFixed(2) + ' pt').padEnd(16, ' ')
    : (e.w.toFixed(2) + ' pt').padEnd(16, ' ');
  return p + '  ' + esp + ' ' + e.hex + '   ' + e.contraste.toFixed(2) + ':1   d=' + e.dash +
    '   comp=' + e.comprimento.toFixed(2) + ' pt';
}

function medirFigura(caminho, pagina) {
  const elems = elementosDoPdf(caminho);
  const reg = acharRegiao(elems, pagina);
  console.log('\n=== ' + path.basename(caminho) + '  fluxo ' + pagina + ' ===');
  if (!reg) { console.log('  figura da desigualdade nao encontrada nesta pagina'); return null; }
  const dentroDela = elems.filter(e => e.pagina === pagina && dentro(e, reg))
    .sort((a, b) => (b.y0 - a.y0) || (a.x0 - b.x0));
  console.log('  regiao (' + reg.x0.toFixed(1) + ',' + reg.y0.toFixed(1) + ') a (' +
    reg.x1.toFixed(1) + ',' + reg.y1.toFixed(1) + '), ' + dentroDela.length + ' elementos');
  /* Escala: a vareta de 12 unidades e a mais comprida da figura. */
  console.log('  escala: ' + (reg.base.largura / 12).toFixed(3) + ' pt por unidade' +
    '  (vareta de 12 = ' + reg.base.largura.toFixed(2) + ' pt)');
  for (const e of dentroDela) console.log('  ' + linha(e, reg));

  const fracos = dentroDela.filter(e =>
    (e.tipo === 'S' && e.w > 0 && e.w < PISO_ESPESSURA - 1e-9) ||
    (e.contraste < 3 && !(luminancia(e.cor) > 0.95)));
  console.log('  abaixo do piso de ' + PISO_ESPESSURA + ' pt ou de 3:1  ->  ' + fracos.length);
  fracos.forEach(e => console.log('     ! ' + linha(e, reg)));
  return { reg, elems: dentroDela };
}

/* Varredura da folha inteira: nada, em nenhuma pagina, abaixo do piso de 0,6 pt
 * ou de 3:1. A malha do plano e a unica excecao autorizada, e ela nao existe
 * nestas folhas. */
function varrerFolha(caminho) {
  const elems = elementosDoPdf(caminho);
  const fracos = [];
  for (const e of elems) {
    if (e.tipo === 'S' && e.w > 0 && e.w < PISO_ESPESSURA - 1e-9) {
      fracos.push({ e, por: 'espessura ' + e.w.toFixed(2) + ' pt' });
      continue;
    }
    if (luminancia(e.cor) > 0.95) continue;      // branco e fundo, nao carrega
    if (e.contraste < 3) fracos.push({ e, por: 'contraste ' + e.contraste.toFixed(2) + ':1' });
  }
  const chaves = {};
  for (const f of fracos) {
    const k = f.e.tipo + ' ' + f.e.hex + ' w=' + f.e.w.toFixed(2) + ' ' + f.por;
    chaves[k] = (chaves[k] || 0) + 1;
  }
  console.log('\n--- ' + path.basename(caminho) + ': ' + elems.length + ' elementos, ' +
    fracos.length + ' abaixo do piso de 0,6 pt ou de 3:1');
  Object.keys(chaves).forEach(k => console.log('    ' + chaves[k] + 'x  ' + k));
  return fracos;
}

/* ------------------------------------------------ prova do op.desde da cota
 *
 * A mesma geometria da figura do 4, 7 e 12, desenhada duas vezes na mesma
 * folha: a esquerda como a receita desenha hoje, com a amarracao do vao ate a
 * base por fora da cota, e a direita com a amarracao dentro dela, por op.desde.
 * Quem julga sao os bytes: a medida sai do fluxo de conteudo da folha escrita,
 * pelo mesmo leitor que mede o piloto. */
function provarDesde(saida) {
  const PDFGen = require('../pdf.js');
  const B = require('./base.js');
  const D = require('./desenho.js');
  const COR = PDFGen.COR;
  const doc = new PDFGen.Doc();
  doc.novaPagina();
  doc.texto('prova do op.desde da cota', PDFGen.MARG_E, doc.y, { tam: 12, bold: true, cor: COR.navy });
  doc.y -= 22;

  const L = 12, m1 = 7, m2 = 4, alto = L * 0.14;
  const larg = (PDFGen.MARG_D - PDFGen.MARG_E - 16) / 2;

  function cartao(x, comDesde) {
    doc.texto(comDesde ? 'com desde=' : 'sem desde=', x, doc.y, { tam: 7.5, cor: COR.muted });
    return B.figura(doc, {
      x: x, largura: larg, altura: 96, folga: 14,
      unidades: { x0: 0, y0: 0, x1: L, y1: alto }
    }, function (ctx) {
      const base0 = ctx.p({ x: 0, y: 0 }), base1 = ctx.p({ x: L, y: 0 });
      const c0 = ctx.p({ x: 0, y: alto }), c1 = ctx.p({ x: m1, y: alto });
      const c2 = ctx.p({ x: m1 + m2, y: alto });
      ctx.contorno(function () {
        D.poligono(ctx, [base0, base1], { fechado: false });
        D.poligono(ctx, [c0, c1], { fechado: false });
        D.poligono(ctx, [c1, c2], { fechado: false });
      });
      ctx.marcas(function () {
        const op = {
          fora: { x: (base0.x + base1.x) / 2, y: base0.y }, afastamento: 11, tam: 8.5
        };
        if (comDesde) op.desde = base0;
        D.cota(ctx, c2, ctx.p({ x: L, y: alto }), '1', op);
      });
    });
  }
  const y0 = doc.y;
  cartao(PDFGen.MARG_E, false);
  const y1 = doc.y;
  doc.y = y0;
  cartao(PDFGen.MARG_E + larg + 16, true);
  doc.y = Math.min(y1, doc.y);
  fs.writeFileSync(saida, Buffer.from(doc.finalizar(), 'latin1'));

  const el = elementosDoPdf(saida).filter(e => e.tipo === 'S');
  const meio = (PDFGen.MARG_E + PDFGen.MARG_D) / 2;
  console.log('\n=== ' + path.basename(saida) + ' ===');
  ['sem desde=', 'com desde='].forEach((rot, i) => {
    const lado = el.filter(e => (i === 0 ? e.x1 < meio : e.x0 > meio));
    console.log('  ' + rot);
    lado.sort((a, b) => a.w - b.w).forEach(e => console.log('    w=' + e.w.toFixed(2) +
      '  ' + e.hex + '  ' + e.contraste.toFixed(2) + ':1  d=' + e.dash +
      '  comp=' + e.comprimento.toFixed(2) + ' pt'));
  });
  console.log('  avisos: ' + JSON.stringify(doc.avisos || []));
  return saida;
}

if (require.main === module) {
  const arg = process.argv.slice(2);
  const aqui = __dirname;
  if (arg.length >= 2) {
    medirFigura(path.resolve(arg[0]), Number(arg[1]));
  } else {
    medirFigura(path.join(aqui, '_piloto_MAT07-12_material.pdf'), 3);
    medirFigura(path.join(aqui, '_piloto_MAT07-12_en.pdf'), 3);
    medirFigura(path.join(aqui, '_prova_desenho.pdf'), 5);
  }
  provarDesde(path.join(aqui, '_audita_desenho_desde.pdf'));

  console.log('\n\n############ varredura de piso na folha inteira ############');
  ['_piloto_MAT07-12_material.pdf', '_piloto_MAT07-12_en.pdf', '_piloto_MAT07-12_lista.pdf',
   '_piloto_MAT07-12_gabarito.pdf', '_prova_desenho.pdf'].forEach(f => {
    const c = path.join(aqui, f);
    if (fs.existsSync(c)) varrerFolha(c);
  });
}

module.exports = { elementosDoPdf, contraste, luminancia, hex, acharRegiao, medirFigura, varrerFolha };
