/* figuras/_piloto_MATEM3-03.js
 * Gera os documentos do MATEM3-03, "Geometria analitica: a circunferencia",
 * pelo caminho de verdade: o gerarMaterialTema do pdf.js, lendo o tema do
 * temas/banco.json (ou de um retrato de um tema so), que e o mesmo arquivo que
 * o tablet consome.
 *
 * Tudo o que e generico (a abertura do tema, o placar, os leitores de folha e
 * as travas 0 a 8) mora no _piloto_base.js. Aqui fica so o que a circunferencia
 * no plano pede: a circunferencia impressa e redonda e tem o raio da equacao, a
 * reta impressa passa pelos pontos que a equacao diz, a perpendicular mede d e
 * o ponto livre esta onde as coordenadas mandam. Tudo lido no papel, com a
 * origem do plano tirada dos proprios eixos.
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
const P = require('./_piloto_base.js');
const PDFGen = P.PDFGen;

const ID = 'MATEM3-03';
const ctx = P.abrir({ id: ID, caminhoDoMd: 'temas/mat/em3/' + ID + '.md' });

const conf = P.conf, medido = P.medido, dist = P.dist;
const n2c = P.n2;
const docPT = ctx.docPT, docGab = ctx.docGab;

/* ================================================================ travas genericas
 *
 * Escolha editorial escrita: 6 diretivas na explicacao, nenhuma nos 19
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
P.travasGenericas(ctx, {
  palavrasPt: ['circunfer', 'círcul', 'distância', 'equação'],
  diretivasNaExplicacao: { n: 6, rotulo: 'a explicacao tem 6 diretivas de figura' },
  enunciadosComFigura: { n: 'nenhum', rotulo: 'nenhum dos 19 enunciados carrega figura' },
  registrosNoMaterial: { n: 10, rotulo: 'e elas geram 10 figuras (dois paineis de tres casos)' },
  figurasNoGabarito: { n: 9, rotulo: 'e o gabarito tem 9 (10, 11, 12, 13, 15, 16, 17, 18 e 19)' }
});

/* As diretivas sao IGUAIS nas duas linguas, numero por numero: neste tema nao
 * ha legenda nem rotulo de palavra, entao a diretiva inteira tem que bater.
 * Fica no piloto do tema, e nao na base, porque num tema com legenda ela
 * reprovaria a traducao correta da legenda. */
function brutasDe(texto) {
  const saida = [];
  new PDFGen.Doc().partesDeFigura(texto).forEach(function (p) { if (p.tipo === 'figura') saida.push(p.diretiva.bruto); });
  return saida.join(' | ');
}
let iguais = brutasDe(ctx.tema.pt.explicacao) === brutasDe(ctx.tema.en.explicacao);
ctx.tema.pt.exercicios.forEach(function (ex, i) {
  const en = ctx.tema.en.exercicios[i];
  if (brutasDe(ex.enunciado) !== brutasDe(en.enunciado) || brutasDe(ex.resposta) !== brutasDe(en.resposta)) iguais = false;
});
conf('e as diretivas sao identicas nas duas linguas, numero por numero', iguais, true);

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

const segmentos09 = P.segmentos09, planoDaFigura = P.planoDaFigura, bolinhasDe = P.bolinhasDe;
function voltasDaFigura(f) {
  return ((f.medido || {}).arcos || []).filter(function (a) { return a.abertura >= 359.9; });
}
function centroDaDiretiva(bruto) {
  const c = primeiroDaDiretiva(bruto, 'centro');
  if (!c) return { x: 0, y: 0 };
  const p = c.split(';');
  if (p.length >= 2 && numeroOuNulo(p[0]) !== null && numeroOuNulo(p[1]) !== null) return { x: parseFloat(p[0]), y: parseFloat(p[1]) };
  return { x: 0, y: 0 };
}

const circulos = ctx.todasAsFiguras.filter(function (f) { return f.receita === 'circulo'; });

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
let voltas = 0, piorAniso = 0;
[docPT, docGab].forEach(function (d) {
  (d.paginas || []).forEach(function (pag) {
    P.lerCaminhos(pag.ops || []).filter((s) => s.pintado === 'traco' && s.trechos.length === 4 && s.trechos.every((t) => !t.reta)).forEach(function (s) {
      const c = P.caixaDe(P.pontosDoSub(s, 24));
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
  const Pl = planoDaFigura(f);
  if (!Pl) { retas++; medido((f.id || 'explicacao') + ': plano nao achado'); return; }
  /* A reta e o segmento obliquo mais longo que NAO parte do centro: a
   * perpendicular tambem e obliqua e, numa janela apertada, pode ser mais
   * comprida do que o trecho visivel da reta. */
  const centroPg = Pl.pagina(centroDaDiretiva(f.diretiva));
  const obliquos = Pl.segs.filter((s) => Math.abs(s.a.y - s.b.y) > 0.05 && Math.abs(s.a.x - s.b.x) > 0.05 &&
    dist(s.a, centroPg) > 0.6 && dist(s.b, centroPg) > 0.6).sort((u, v) => v.L - u.L);
  const reta = obliquos[0];
  retas++;
  const res = reta ? [reta.a, reta.b].map((q) => { const u = Pl.xy(q); return A * u.x + B * u.y + C; }) : [Infinity];
  const bom = res.every((v) => Math.abs(v) < 0.05);
  if (bom) retasOk++;
  const centroU = centroDaDiretiva(f.diretiva);
  const dConta = Math.abs(A * centroU.x + B * centroU.y + C) / Math.hypot(A, B);
  let texto = (f.id || 'explicacao') + ': reta ' + A + 'x + ' + B + 'y + ' + C + ' = 0, residuo nos extremos impressos ' + res.map(n2c).join(' e ');
  if (primeiroDaDiretiva(f.diretiva, 'distancia') !== null) {
    const Cp = Pl.pagina(centroU);
    const perp = Pl.segs.filter((s) => (dist(s.a, Cp) < 0.6 || dist(s.b, Cp) < 0.6) && s !== reta).sort((u, v) => v.L - u.L)[0];
    perps++;
    const dLida = perp ? perp.L / Pl.k : NaN;
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
  const Pl = planoDaFigura(f);
  if (!Pl) return;
  const dots = bolinhasDe(f);
  const centroU = centroDaDiretiva(f.diretiva);
  const cv = todosDaDiretiva(f.diretiva, 'cota');
  pv.forEach(function (p, i) {
    const alvo = Pl.pagina({ x: parseFloat(p[0]), y: parseFloat(p[1]) });
    let perto = Infinity;
    dots.forEach((b) => { perto = Math.min(perto, dist(b, alvo)); });
    pontos++;
    if (perto < 0.5) pontosOk++;
    if (i < cv.length) {
      const Cp = Pl.pagina(centroU);
      const seg = Pl.segs.filter((s) => (dist(s.a, Cp) < 0.6 && dist(s.b, alvo) < 0.6) || (dist(s.b, Cp) < 0.6 && dist(s.a, alvo) < 0.6))[0];
      cotas++;
      const dConta = Math.hypot(parseFloat(p[0]) - centroU.x, parseFloat(p[1]) - centroU.y);
      if (seg && Math.abs(seg.L / Pl.k - dConta) < 0.02) cotasOk++;
      medido((f.id || 'explicacao') + ': ponto (' + p[0] + ', ' + p[1] + ') a ' + n2c(perto) + ' pt da bolinha mais proxima; segmento ate o centro ' + (seg ? n2c(seg.L / Pl.k) : '?') + ' unidades, a conta da ' + n2c(dConta));
    } else {
      medido((f.id || 'explicacao') + ': ponto (' + p[0] + ', ' + p[1] + ') a ' + n2c(perto) + ' pt da bolinha mais proxima');
    }
  });
});
conf('pontos por coordenadas: ' + pontos + ', todos com a bolinha no lugar', pontosOk, pontos);
conf('distancias ate um ponto cotadas: ' + cotas + ', todas medindo a conta', cotasOk, cotas);
conf('houve o que medir (retas, perpendiculares, pontos): ', retas > 0 && perps > 0 && pontos > 0, true);

/* ================================================================ leitura da folha
 * As travas 0 a 8 rodaram na base. As duas daqui sao de familia de receita, e
 * nao de forma da folha: a letra da distancia repousa no segmento que ela mede,
 * e o nome (ou o par de coordenadas) de cada ponto fica mais perto da bolinha
 * dele do que de qualquer outra bolinha da figura. */
console.log('\nleitura da folha deste tema');
const nomeDaFigura = P.nomeDaFigura;

/* A letra da distancia repousa no segmento que ela mede.
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

/* O nome de cada ponto fica mais perto da bolinha dele do que de qualquer
 * outra bolinha. O ponto vem da diretiva (ponto=x;y;N, ou o par "(x, y)"
 * quando nao ha nome; o centro com nome, o centro da outra=), a posicao dele
 * vem do plano lido na folha, e a bolinha concorrente e qualquer outra. */
let nomesLidos = 0, nomeErrado = [], piorNome = { razao: Infinity, onde: 'nenhum nome de ponto' };
circulos.forEach(function (f) {
  const Pl = planoDaFigura(f);
  if (!Pl) return;
  const esperados = [];
  todosDaDiretiva(f.diretiva, 'ponto').forEach(function (v) {
    const p = v.split(';');
    if (p.length < 2 || numeroOuNulo(p[0]) === null || numeroOuNulo(p[1]) === null) return;
    const texto = p.length > 2 ? p[2] : ('(' + p[0] + ', ' + p[1] + ')');
    esperados.push({ texto: texto, pos: Pl.pagina({ x: parseFloat(p[0]), y: parseFloat(p[1]) }) });
  });
  const cv = primeiroDaDiretiva(f.diretiva, 'centro');
  if (cv !== null) {
    const p = cv.split(';');
    if (p.length === 1 && /^[A-Za-z]$/.test(p[0])) esperados.push({ texto: p[0], pos: Pl.pagina({ x: 0, y: 0 }) });
    else if (p.length >= 3 && numeroOuNulo(p[0]) !== null) esperados.push({ texto: p[2], pos: Pl.pagina({ x: parseFloat(p[0]), y: parseFloat(p[1]) }) });
  }
  const ov = primeiroDaDiretiva(f.diretiva, 'outra');
  if (ov !== null) { const p = ov.split(';'); if (p.length > 3) esperados.push({ texto: p[3], pos: Pl.pagina({ x: parseFloat(p[0]), y: parseFloat(p[1]) }) }); }
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

const saida = P.placar();
P.avisos(ctx);
process.exit(saida);
