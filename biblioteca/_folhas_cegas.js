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
 * arquivo. Imagem muito alta chega ao revisor reduzida para caber, e texto de
 * 10 pt reduzido pela metade nao se le. O revisor estaria julgando o que nao
 * consegue ler, e o registro diria que ele julgou. Entao a folha sai em
 * pedacos de no maximo ALTURA_PEDACO px de EXERCICIO, e o corte cai SEMPRE na
 * fronteira entre dois exercicios: exercicio cortado ao meio, com a figura
 * partida, seria defeito da folha virando juizo sobre a lista.
 *
 * O QUE FOI MEDIDO, nas imagens da rodada de 24/09 que estao arquivadas em
 * Simulacoes\biblioteca-b9 (e nao estimado a partir do dado, que foi o erro
 * da primeira versao deste comentario, apontado pela lente 1 do PR #56):
 * 60 folhas de conteudo distinto, 100 arquivos HTML (o braco A e escrito uma
 * vez por revisor), 166 imagens. Altura da folha em px CSS: mediana 1.509,5
 * por arquivo e 1.517 por conteudo distinto; a maior tem 3.199.
 *
 * O TETO VALE PARA O EXERCICIO, E O ULTIMO PEDACO LEVA TAMBEM O RECUO DO PE
 * DA FOLHA. Por isso tres dos 166 pedacos daquela rodada tem 1.424 px, 1,7%
 * acima do teto: sao os tres ultimos pedacos das suas folhas, e o excedente e
 * o recuo de baixo, nao exercicio. Isso esta escrito aqui porque a versao
 * anterior prometia "no maximo 1.400" sem ressalva e os quatro casos do
 * autoteste eram montados de um jeito que nunca podia contradize-la: em todos,
 * a soma das caixas era igual a altura total, que e a unica configuracao em
 * que o recuo do pe nao existe. O autoteste agora tem caso com folga entre as
 * caixas e com altura total maior que a ultima caixa.
 */
const fs = require('fs');
const path = require('path');
/* O puppeteer entra so na hora de renderizar. Carregado no topo, o
 * --autoteste, que nem abre navegador, morreria no require numa copia sem
 * _teste/node_modules, e o portao leria isso como "o teste nao chegou a
 * rodar". Ja aconteceu nesta casa: uma suite rodando em copia sem as
 * dependencias, o testa_temas morrendo no puppeteer-core, e o portao dizendo
 * "TUDO PASSOU. Pode seguir para o merge". */
function abrirPuppeteer() {
  return require(path.join(__dirname, '..', '_teste', 'node_modules', 'puppeteer-core'));
}

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
  /* O teto declarado e a afirmacao central do instrumento, e nenhum caso o
   * prendia: os fixtures de fronteira sao montados A PARTIR da constante,
   * entao acompanham qualquer valor que ela tenha. Aqui o numero e escrito
   * a mao, para mudar o teto sem querer reprovar. Segunda rodada da lente
   * estreita do PR #56. */
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

  conf('o teto declarado do pedaco e 1400 px', ALTURA_PEDACO, 1400);

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

  /* A FOLHA DE VERDADE nao e assim: ela tem um h1 no topo, 16 pt de margem
   * entre exercicios e 24 pt de recuo no pe, entao as caixas NAO comecam em
   * zero, NAO sao coladas, e a altura total e MAIOR que a ultima caixa. Os
   * quatro casos acima tem soma igual a altura total, que e a unica
   * configuracao em que o `Math.max(fim, alturaTotal)` da linha do ultimo
   * pedaco nunca roda. A lente 1 do PR #56 mediu isso; os casos abaixo
   * fecham o buraco. */
  const comFolga = (alturas, topo, folga) => {
    let y = topo;
    return alturas.map(h => { const c = { topo: y, baixo: y + h }; y += h + folga; return c; });
  };
  cx = comFolga([400, 400, 400, 400], 60, 21);
  const total = cx[cx.length - 1].baixo + 32;          // recuo do pe
  p = pedacos(cx, total);
  conf('folha real: nenhum exercicio parte entre pedacos', cobre(p, cx), true);
  conf('folha real: os pedacos cobrem do topo ao pe, sem buraco',
    [p[0].topo, p[p.length - 1].baixo], [0, total]);
  conf('folha real: os pedacos nao se sobrepoem nem deixam vao',
    p.every((x, i) => i === 0 || x.topo === p[i - 1].baixo), true);
  conf('folha real: o ultimo pedaco vai ate o pe da folha, e nao ate a ultima caixa',
    p[p.length - 1].baixo, total);
  conf('folha real: so o ultimo pedaco pode passar do teto, e so pelo recuo',
    p.slice(0, -1).every(x => x.baixo - x.topo <= ALTURA_PEDACO) &&
    (p[p.length - 1].baixo - p[p.length - 1].topo) - (total - cx[cx.length - 1].baixo) <= ALTURA_PEDACO, true);

  // uma folha baixa com recuo: um pedaco so, e ele termina no pe
  cx = comFolga([200, 200], 60, 21);
  p = pedacos(cx, cx[1].baixo + 32);
  conf('folha baixa com recuo sai num pedaco que vai ate o pe',
    [p.length, p[0].topo, p[0].baixo], [1, 0, cx[1].baixo + 32]);

  /* Os dois casos de FRONTEIRA, registrados pela lente estreita do PR #56
   * como cegos por completude: nenhuma caixa dos fixtures caia exatamente no
   * teto, e em nenhum a ultima caixa passava da altura total. */
  cx = caixas([700, ALTURA_PEDACO - 700, 500]);       // o corte cai exatamente no teto
  p = pedacos(cx, 1900);
  conf('caixa terminando EXATAMENTE no teto ainda cabe no pedaco',
    [p.length, p[0].baixo], [2, ALTURA_PEDACO]);
  cx = caixas([300, 300]);
  p = pedacos(cx, 500);                                // altura total MENOR que a ultima caixa
  conf('altura total menor que a ultima caixa nao encurta o pedaco', p[p.length - 1].baixo, 600);

  console.log(ok + ' verificacoes passaram, ' + falhas + ' falharam');
  process.exit(falhas ? 1 : 0);
}

(async () => {
  const raiz = process.argv[2];
  if (raiz === '--autoteste') return autoteste();
  if (!raiz || !fs.existsSync(raiz)) { console.error('pasta nao existe: ' + raiz); process.exit(1); }
  const folhas = varrer(raiz).sort();
  const navegador = await abrirPuppeteer().launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
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
