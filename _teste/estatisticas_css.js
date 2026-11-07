/* estatisticas_css.js
 *
 * Contagens do sistema visual (item B12), as mesmas da lente de UI de 21/10:
 * tamanhos de letra distintos no styles.css, cores literais fora do :root,
 * estilos embutidos no app.js (`style:`) e no index.html (`style="`), desenhos
 * do monograma NW e as fontes do cartão do mês.
 *
 * Uso: node _teste/estatisticas_css.js [pasta do repositório]
 * Sem argumento, conta o repositório onde o script está. Com uma pasta, conta
 * aquela (é assim que sai o "antes", apontando para uma cópia da main).
 *
 * O núcleo (lerCss, coresSoltas, tamanhosDeLetra) é o mesmo que a trava do
 * portão usa, em testa_sistema_visual.js: a contagem do relatório e a trava não
 * podem medir coisas diferentes.
 */
'use strict';
const fs = require('fs');
const path = require('path');

/* Tira os comentários sem mexer no resto, para um "#FFF" citado num comentário
 * não virar cor solta e um "font-size: 13px" de exemplo não virar tamanho. */
function semComentarios(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, function (c) { return c.replace(/[^\n]/g, ' '); });
}

/* Os blocos `:root { ... }` (pode haver mais de um, inclusive dentro de
 * @media). Devolve os trechos e o CSS com os blocos apagados. */
function separarRoot(css) {
  const blocos = [];
  let resto = '';
  let i = 0;
  const re = /:root\s*\{/g;
  let m;
  while ((m = re.exec(css))) {
    resto += css.slice(i, m.index);
    let j = m.index + m[0].length, nivel = 1;
    while (j < css.length && nivel > 0) {
      if (css[j] === '{') nivel++;
      else if (css[j] === '}') nivel--;
      j++;
    }
    blocos.push(css.slice(m.index, j));
    i = j;
    re.lastIndex = j;
  }
  resto += css.slice(i);
  return { blocos: blocos, resto: resto };
}

/* Variáveis declaradas nos :root, com o valor cru. */
function variaveis(blocosRoot) {
  const v = {};
  blocosRoot.forEach(function (b) {
    const re = /(--[A-Za-z0-9_-]+)\s*:\s*([^;}]+)/g;
    let m;
    while ((m = re.exec(b))) v[m[1]] = m[2].trim();
  });
  return v;
}

const NOMES_DE_COR = ['white', 'black', 'red', 'green', 'blue', 'gray', 'grey',
  'yellow', 'orange', 'silver', 'navy', 'teal', 'gold', 'ivory', 'pink', 'purple'];
/* Cor literal: hexadecimal, rgb(), rgba(), hsl(), hsla() ou nome de cor.
 * `transparent` e `currentColor` não são escolha de cor e ficam de fora. Um
 * nome de cor só conta como valor (depois de ":" ou de espaço num valor), para
 * `.navy` num seletor ou `--navy` numa variável não virarem cor. O "$" no fim
 * pega o nome que fecha a declaração ("background: white;"): o valor chega aqui
 * já sem o ";", e sem ele o veneno de nome de cor passava. */
const RE_COR = new RegExp(
  '#[0-9A-Fa-f]{3,8}\\b|\\b(?:rgba?|hsla?)\\([^)]*\\)|' +
  '(?:[:,(]|\\s)(?:' + NOMES_DE_COR.join('|') + ')(?=[\\s;,)!}]|$)', 'gi');

function lerCss(css) {
  const limpo = semComentarios(css);
  const r = separarRoot(limpo);
  return { limpo: limpo, root: r.blocos, fora: r.resto, vars: variaveis(r.blocos) };
}

/* Cores soltas fora do :root, cada uma com a linha onde está. A busca é só
 * dentro das declarações (entre ":" e ";"), para um seletor como
 * `.tag.gold` ou um id `#FFF` nunca ser lido como cor. */
function coresSoltas(lido) {
  const achadas = [];
  const fora = lido.fora;
  const re = /:([^;{}]*)(?=[;}])/g;
  let m;
  while ((m = re.exec(fora))) {
    const valor = ':' + m[1];
    /* uma declaração tem nome de propriedade antes do ":"; pseudo-classes
     * (":hover", ":not(") ficam num seletor, que termina em "{", e o lookahead
     * acima já exige ";" ou "}" no fim */
    let c;
    const rc = new RegExp(RE_COR.source, 'gi');
    while ((c = rc.exec(valor))) {
      const linha = fora.slice(0, m.index).split('\n').length;
      achadas.push({ cor: c[0].replace(/^[:,(\s]+/, ''), linha: linha });
    }
  }
  return achadas;
}

/* Resolve var(--x) e var(--x, reserva) pelos :root, até três voltas. */
function resolver(valor, vars) {
  let v = valor.trim();
  for (let k = 0; k < 3 && /var\(/.test(v); k++) {
    v = v.replace(/var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*([^)]+))?\)/g, function (_, nome, reserva) {
      return vars[nome] !== undefined ? vars[nome] : (reserva || 'var(' + nome + ')');
    });
  }
  return v.replace(/\s*!important\s*$/, '').trim();
}

/* Tamanhos de letra usados fora do :root (font-size e o tamanho do atalho
 * font), já resolvidos. `inherit` e afins não são tamanho. */
function tamanhosDeLetra(lido) {
  const usos = {};
  const fora = lido.fora;
  const re = /(?:^|[;{\s])font-size\s*:\s*([^;}]+)/g;
  let m;
  while ((m = re.exec(fora))) {
    const v = resolver(m[1], lido.vars);
    if (/^(inherit|initial|unset|revert)$/i.test(v)) continue;
    usos[v] = (usos[v] || 0) + 1;
  }
  const reAtalho = /(?:^|[;{\s])font\s*:\s*([^;}]+)/g;
  while ((m = reAtalho.exec(fora))) {
    const v = resolver(m[1], lido.vars);
    const t = v.match(/(?:^|\s)(\d*\.?\d+(?:px|em|rem|%|pt))(?:\/|\s)/);
    if (t) usos[t[1]] = (usos[t[1]] || 0) + 1;
  }
  return usos;
}

function contar(raiz) {
  const ler = function (f) { return fs.readFileSync(path.join(raiz, f), 'utf8'); };
  const css = ler('styles.css');
  const app = ler('app.js');
  const html = ler('index.html');
  const cartao = ler('cartao.js');
  const lido = lerCss(css);
  const soltas = coresSoltas(lido);
  const distintas = {};
  soltas.forEach(function (s) { const k = s.cor.toUpperCase().replace(/\s+/g, ''); distintas[k] = (distintas[k] || 0) + 1; });
  const tamanhos = tamanhosDeLetra(lido);

  /* Estilos embutidos: `style:` no app.js (todo atributo passado ao el()) e
   * `style="` no index.html. Os do app.js saem em dois baldes: valor fixo
   * (literal só) e calculado na hora (com variável, conta ou condição). */
  const estilosApp = app.match(/\bstyle\s*:/g) || [];
  const fixosApp = app.match(/\bstyle\s*:\s*'[^']*'\s*[,}\n]/g) || [];
  const estilosHtml = html.match(/\sstyle="/g) || [];
  const blocoStyleHtml = (html.match(/<style[\s>]/g) || []).length;

  /* Monograma: cada lugar que desenha as letras NW (texto) mais os ícones. */
  const desenhosNW = [];
  ['cartao.js', 'pdf.js', 'app.js', 'index.html'].forEach(function (f) {
    const t = ler(f);
    const re = /(?:fillText|texto|strokeText)\(\s*'NW'/g;
    let m;
    while ((m = re.exec(t))) desenhosNW.push(f + ':' + t.slice(0, m.index).split('\n').length);
    if (/>\s*NW\s*</.test(t)) desenhosNW.push(f + ' (no HTML)');
  });

  /* Fontes do cartão: as famílias citadas nas pilhas SERIF e SANS. */
  const pilhas = [];
  const rp = /var\s+(SERIF|SANS)\s*=\s*"([^"]+)"/g;
  let mp;
  while ((mp = rp.exec(cartao))) pilhas.push(mp[1] + ' = ' + mp[2]);
  const deRede = /Lora|Poppins/.test(pilhas.join(' '));
  const embarcadas = /FontFace\(|@font-face/.test(cartao + css);

  return {
    tamanhosDistintos: Object.keys(tamanhos).length,
    tamanhos: tamanhos,
    coresSoltas: soltas.length,
    coresSoltasDistintas: Object.keys(distintas).length,
    variaveisNoRoot: Object.keys(lido.vars).length,
    usosDeVar: (lido.fora.match(/var\(--/g) || []).length,
    estilosApp: estilosApp.length,
    estilosAppFixos: fixosApp.length,
    estilosHtml: estilosHtml.length,
    blocoStyleHtml: blocoStyleHtml,
    principalNoApp: (app.match(/\bprincipal\b/g) || []).length,
    desenhosNW: desenhosNW,
    pilhasCartao: pilhas,
    fontesDeRedeNoCartao: deRede,
    fontesEmbarcadas: embarcadas
  };
}

module.exports = { semComentarios: semComentarios, separarRoot: separarRoot, lerCss: lerCss,
  coresSoltas: coresSoltas, tamanhosDeLetra: tamanhosDeLetra, resolver: resolver, contar: contar };

if (require.main === module) {
  const raiz = path.resolve(process.argv[2] || path.join(__dirname, '..'));
  const c = contar(raiz);
  console.log('Contagens do sistema visual em ' + raiz);
  console.log('  tamanhos de letra distintos no styles.css: ' + c.tamanhosDistintos);
  console.log('    ' + Object.keys(c.tamanhos).sort(function (a, b) { return parseFloat(a) - parseFloat(b); })
    .map(function (k) { return k + ' (' + c.tamanhos[k] + ')'; }).join(', '));
  console.log('  cores literais fora do :root: ' + c.coresSoltas + ' usos, ' + c.coresSoltasDistintas + ' distintas');
  console.log('  variáveis no :root: ' + c.variaveisNoRoot + '; usos de var(--...) fora dele: ' + c.usosDeVar);
  console.log('  estilos embutidos no app.js (style:): ' + c.estilosApp + ', dos quais de valor fixo: ' + c.estilosAppFixos);
  console.log('  estilos embutidos no index.html (style="): ' + c.estilosHtml + '; blocos <style>: ' + c.blocoStyleHtml);
  console.log('  desenhos do monograma NW em código: ' + c.desenhosNW.length + ' (' + c.desenhosNW.join(', ') + '), mais os ícones PNG');
  console.log('  fontes do cartão: ' + c.pilhasCartao.join(' | '));
  console.log('    citam fontes que não vêm no pacote (Lora, Poppins): ' + (c.fontesDeRedeNoCartao ? 'sim' : 'não') +
    '; fontes embarcadas: ' + (c.fontesEmbarcadas ? 'sim' : 'não'));
}
