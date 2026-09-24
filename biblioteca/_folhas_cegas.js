/* Rende as folhas da comparacao cega em PNG, no Chrome headless.
 *
 *   node biblioteca/_folhas_cegas.js <pasta da comparacao>
 *
 * Varre a pasta atras de par-NN-lista-X.html, que o _comparacao_cega.py
 * escreveu, e grava os PNG ao lado, mais um INDICE.txt por pasta de revisor.
 *
 * Por que PNG e nao texto: em geometria a figura e metade do problema, e uma
 * comparacao feita sobre o texto do enunciado julgaria outra coisa.
 *
 * POR QUE A FOLHA SAI EM PEDACOS, e isto e decisao de instrumento e nao de
 * arquivo. Medido nas 60 folhas desta rodada: a altura mediana e 1.492 px e a
 * maior tem 3.175 px. Imagem muito alta chega ao revisor reduzida para caber,
 * e texto de 10 pt reduzido pela metade nao se le. O revisor estaria julgando
 * o que nao consegue ler, e o registro diria que ele julgou. Entao a folha sai
 * em pedacos de no maximo ALTURA_PEDACO px, e o corte cai SEMPRE na fronteira
 * entre dois exercicios: exercicio cortado ao meio, com a figura partida,
 * seria defeito da folha virando juizo sobre a lista.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require(path.join(__dirname, '..', '_teste', 'node_modules', 'puppeteer-core'));

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
/* A janela e em PIXELS CSS e a folha e em PONTOS: 1 pt vale 4/3 px. O corpo
 * tem 300 pt de conteudo mais 32 pt de recuo, ou seja 443 px. Uma janela de
 * 340 px cortaria o recorte ao meio, e o revisor julgaria exercicio cortado
 * achando que era o exercicio. O maior enunciado do pacote tem 295 pt. */
const LARGURA = 470;
const ESCALA = 2;
const ALTURA_PEDACO = 1400;   // px CSS por pedaco

function varrer(raiz) {
  const achados = [];
  for (const nome of fs.readdirSync(raiz)) {
    const inteiro = path.join(raiz, nome);
    if (fs.statSync(inteiro).isDirectory()) achados.push(...varrer(inteiro));
    else if (/^par-\d+-lista-[AB]\.html$/.test(nome)) achados.push(inteiro);
  }
  return achados;
}

/* Agrupa os exercicios em pedacos de no maximo ALTURA_PEDACO px, sem cortar
 * nenhum. Um exercicio mais alto que o limite vira um pedaco sozinho. */
function pedacos(caixas, alturaTotal) {
  const saida = [];
  let inicio = 0, fim = 0;
  for (const c of caixas) {
    if (fim > inicio && c.baixo - inicio > ALTURA_PEDACO) {
      saida.push({ topo: inicio, baixo: fim });
      inicio = fim;
    }
    fim = c.baixo;
  }
  saida.push({ topo: inicio, baixo: Math.max(fim, alturaTotal) });
  return saida;
}

/* O corte e a parte do instrumento que pode estragar a folha sem estragar o
 * programa: um exercicio partido ao meio vira juizo sobre a lista. Entao ele
 * tem prova, com os casos que a folha real produz. */
function autoteste() {
  let ok = 0, falhas = 0;
  const conf = (nome, obtido, esperado) => {
    if (JSON.stringify(obtido) === JSON.stringify(esperado)) { ok++; console.log('  ok      ' + nome); }
    else { falhas++; console.log('  FALHOU  ' + nome + '  [obtido ' + JSON.stringify(obtido) + ', esperado ' + JSON.stringify(esperado) + ']'); }
  };
  const caixas = (alturas) => {
    let y = 0;
    return alturas.map(h => { const c = { topo: y, baixo: y + h }; y += h; return c; });
  };
  const cobre = (partes, caixas) => {
    // nenhum exercicio pode ficar entre dois pedacos
    for (const c of caixas) {
      if (!partes.some(p => c.topo >= p.topo && c.baixo <= p.baixo)) return false;
    }
    return true;
  };

  let cx = caixas([300, 300, 300]);
  conf('folha baixa sai num pedaco so', pedacos(cx, 900).length, 1);

  /* Cinco exercicios de 500 px, teto 1400. Dois pedacos sao IMPOSSIVEIS: como
   * o corte so cai entre exercicios, os tamanhos possiveis de pedaco sao 500,
   * 1000, 1500..., e 1500 ja passa do teto; com o primeiro pedaco em 1000
   * sobram 1500, que tambem nao cabem. Logo o minimo e tres, e foi a minha
   * expectativa que estava errada, nao o programa. A conta fica escrita aqui
   * para ninguem ler este numero como teste ajustado para passar. */
  cx = caixas([500, 500, 500, 500, 500]);
  let p = pedacos(cx, 2500);
  conf('folha de 2500 px em itens de 500 sai em tres pedacos', p.length, 3);
  conf('e nenhum exercicio fica partido entre eles', cobre(p, cx), true);
  conf('e nenhum pedaco passa do teto', p.every(x => x.baixo - x.topo <= ALTURA_PEDACO), true);

  cx = caixas([200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200]);
  p = pedacos(cx, 3200);
  conf('folha de 3200 px sai em tres pedacos', p.length, 3);
  conf('e nenhum exercicio fica partido', cobre(p, cx), true);
  conf('e os pedacos cobrem a folha inteira, sem buraco',
    [p[0].topo, p[p.length - 1].baixo], [0, 3200]);
  conf('e os pedacos nao se sobrepoem',
    p.every((x, i) => i === 0 || x.topo === p[i - 1].baixo), true);

  // um exercicio sozinho mais alto que o teto tem de virar um pedaco so, e
  // nao ser cortado: melhor uma imagem alta que um enunciado partido
  cx = caixas([1900, 300]);
  p = pedacos(cx, 2200);
  conf('exercicio mais alto que o teto vira um pedaco inteiro', p[0].baixo, 1900);
  conf('e nada dele se perde', cobre(p, cx), true);

  console.log(ok + ' verificacoes passaram, ' + falhas + ' falharam');
  process.exit(falhas ? 1 : 0);
}

(async () => {
  const raiz = process.argv[2];
  if (raiz === '--autoteste') return autoteste();
  if (!raiz || !fs.existsSync(raiz)) { console.error('pasta nao existe: ' + raiz); process.exit(1); }
  const folhas = varrer(raiz).sort();
  const navegador = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const indices = {};
  let ok = 0, imagens = 0, maiorPedaco = 0;
  try {
    const pagina = await navegador.newPage();
    for (const html of folhas) {
      await pagina.setViewport({ width: LARGURA, height: 1200, deviceScaleFactor: ESCALA });
      await pagina.goto('file:///' + html.replace(/\\/g, '/'), { waitUntil: 'load' });
      await pagina.evaluate(() => Promise.all(
        Array.from(document.images).map(im => im.complete ? null : new Promise(r => { im.onload = im.onerror = r; }))));
      const medida = await pagina.evaluate(() => ({
        altura: Math.ceil(document.body.getBoundingClientRect().height) + 8,
        largura: Math.ceil(document.body.scrollWidth),
        caixas: Array.from(document.querySelectorAll('.item')).map(e => {
          const r = e.getBoundingClientRect();
          return { topo: Math.floor(r.top + window.scrollY), baixo: Math.ceil(r.bottom + window.scrollY) };
        })
      }));
      if (medida.largura > LARGURA) {
        throw new Error('a folha tem ' + medida.largura + ' px e a janela ' + LARGURA +
          ': o recorte sairia cortado em ' + path.basename(html));
      }
      await pagina.setViewport({ width: LARGURA, height: medida.altura, deviceScaleFactor: ESCALA });
      const partes = pedacos(medida.caixas, medida.altura);
      const base = path.basename(html, '.html');
      const nomes = [];
      for (let i = 0; i < partes.length; i++) {
        const p = partes[i];
        const alto = p.baixo - p.topo;
        maiorPedaco = Math.max(maiorPedaco, alto);
        const nome = base + '-parte-' + (i + 1) + '.png';
        await pagina.screenshot({
          path: path.join(path.dirname(html), nome),
          captureBeyondViewport: true,
          clip: { x: 0, y: p.topo, width: LARGURA, height: alto }
        });
        nomes.push(nome);
        imagens++;
      }
      const pasta = path.dirname(html);
      (indices[pasta] = indices[pasta] || []).push({ base, partes: nomes, altura: medida.altura });
      ok++;
    }
  } finally {
    await navegador.close();
  }
  for (const pasta of Object.keys(indices)) {
    const linhas = ['As folhas desta pasta, e as partes de cada uma, na ordem de leitura.', ''];
    for (const f of indices[pasta].sort((a, b) => a.base < b.base ? -1 : 1)) {
      linhas.push(f.base + ': ' + f.partes.join(', '));
    }
    fs.writeFileSync(path.join(pasta, 'INDICE.txt'), linhas.join('\n') + '\n', 'utf8');
  }
  process.stdout.write('renderizadas ' + ok + ' folhas em ' + imagens + ' imagens\n');
  process.stdout.write('pedaco mais alto: ' + maiorPedaco + ' px CSS (teto ' + ALTURA_PEDACO + ')\n');
  process.stdout.write('media de ' + (imagens / ok).toFixed(2) + ' imagens por folha\n');
})().catch((e) => { console.error(e); process.exit(1); });
