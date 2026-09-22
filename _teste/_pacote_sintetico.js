/* _pacote_sintetico.js
 *
 * Gera um pacote de biblioteca SINTÉTICO no formato do contrato
 * (CONTRATO_pacote_biblioteca.md, esquema 1, com a seção 8a), para os testes
 * do aplicativo. Nenhum conteúdo de terceiros: os títulos imitam a espinha do
 * Portal da OBMEP, mas o texto é escrito aqui e cada "recorte" é um desenho
 * geométrico simples (retângulos e barras), sem texto e sem fonte.
 *
 * O pacote real mora no Drive e NUNCA entra no repositório; este aqui é
 * gerado na hora, numa pasta temporária, e apagado por quem chamou.
 *
 * Forma do sintético, pensada para as provas:
 *   9ano / equacoes-do-segundo-grau: 4 aulas de teoria e 2 listas
 *     (a primeira com 40 exercícios, para o teste de desempenho; a segunda
 *     com 8, dois deles objetivos); uma das páginas cita "Bhaskara".
 *   9ano / produtos-notaveis-e-fatoracao e 9ano / teorema-de-pitagoras: um
 *     módulo cada, para a busca ter o que NÃO devolver.
 *
 *   node _teste/_pacote_sintetico.js <saida.zip> [--veneno=<nome>] [--versao=N]
 *
 * Venenos (cada um tem de ser RECUSADO pelo app):
 *   corrompido-deflate  um byte trocado nos dados comprimidos de um SVG
 *   corrompido-stored   um byte trocado nos dados de uma página guardada sem compressão
 *   hash                o manifest traz o hash errado de um asset
 *   sobrando            um arquivo no zip fora da lista do manifest
 *   faltando            o manifest lista um arquivo que o zip não tem
 *   asset-citado        o itens.json cita um asset que não existe
 *   esquema             manifest com esquema 2
 *   asset-fora          um exercício cita uma imagem fora de assets/ (no zip e no manifest)
 *
 * Opção compor (gerar(saida, { compor: true }), para o testa_biblioteca_compor):
 * a lista "Soma e Produto" ganha o que o compositor tem de tratar, e o resto do
 * pacote fica igual ao de sempre (as contagens dos outros testes não mudam):
 *   medidas.*.rotulo em todos os itens, na barra colorida do canto (4,4 a 60,16
 *     pt), que é o que a folha cobre de branco (dá para ver na folha se cobriu);
 *   item 2 sem rótulo (rotulo null): o número sai numa linha acima;
 *   item 4 com a caixa do rótulo estreita (10 pt): o número também sai acima;
 *   item 4 sem solução na fonte (sem_solucao, assets.solucao null);
 *   item 7 com a solução em dois pedaços empilhados (8a), 400 + 380 pt, que
 *     não cabe numa folha e tem de quebrar entre os pedaços.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const Busca = require('../busca.js');

// ------------------------------------------------------------------ zip

const TABELA = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = TABELA[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

/* arquivos: [{ nome, dados: Buffer, metodo: 0|8, estragar?: bool }] */
function montarZip(arquivos) {
  const partes = [], central = [];
  let pos = 0;
  for (const a of arquivos) {
    const nome = Buffer.from(a.nome, 'utf8');
    const crc = crc32(a.dados);
    let comp = a.metodo === 8 ? zlib.deflateRawSync(a.dados, { level: 9 }) : Buffer.from(a.dados);
    if (a.estragar) {
      comp = Buffer.from(comp);
      const i = Math.floor(comp.length / 2);
      comp[i] = comp[i] ^ 0x5A;
    }
    const loc = Buffer.alloc(30);
    loc.writeUInt32LE(0x04034b50, 0); loc.writeUInt16LE(20, 4); loc.writeUInt16LE(0, 6);
    loc.writeUInt16LE(a.metodo, 8); loc.writeUInt16LE(0, 10); loc.writeUInt16LE(0x21, 12);
    loc.writeUInt32LE(crc, 14); loc.writeUInt32LE(comp.length, 18); loc.writeUInt32LE(a.dados.length, 22);
    loc.writeUInt16LE(nome.length, 26); loc.writeUInt16LE(0, 28);
    partes.push(loc, nome, comp);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(0, 8); cen.writeUInt16LE(a.metodo, 10); cen.writeUInt16LE(0, 12);
    cen.writeUInt16LE(0x21, 14); cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(comp.length, 20);
    cen.writeUInt32LE(a.dados.length, 24); cen.writeUInt16LE(nome.length, 28);
    cen.writeUInt32LE(pos, 42);
    central.push(cen, nome);
    pos += 30 + nome.length + comp.length;
  }
  const dir = Buffer.concat(central);
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0);
  fim.writeUInt16LE(arquivos.length, 8); fim.writeUInt16LE(arquivos.length, 10);
  fim.writeUInt32LE(dir.length, 12); fim.writeUInt32LE(pos, 16);
  return Buffer.concat(partes.concat([dir, fim]));
}

// ------------------------------------------------------------------ desenhos

/* Um "recorte" sintético: moldura, linhas cinzas no lugar do texto e uma
 * barra colorida cujo comprimento depende do número, para as miniaturas
 * serem distinguíveis a olho. Sem <text>, sem fonte, sem referência externa. */
function svgRecorte(largura, altura, numero, cor, rotuloLargo) {
  const linhas = [];
  for (let y = 26, k = 0; y < altura - 10; y += 14, k++) {
    const w = largura - 40 - ((numero * 7 + k * 13) % 60);
    linhas.push(`<rect x="20" y="${y}" width="${w}" height="5" fill="#9aa3ad"/>`);
  }
  const barra = 20 + (numero % 10) * ((largura - 40) / 10);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}pt" height="${altura}pt" viewBox="0 0 ${largura} ${altura}">` +
    `<rect x="0" y="0" width="${largura}" height="${altura}" fill="#ffffff"/>` +
    (rotuloLargo ? `<rect x="4" y="4" width="56" height="12" fill="${cor}"/>`
      : `<rect x="4" y="4" width="18" height="14" fill="${cor}"/>`) +
    `<rect x="26" y="8" width="${barra}" height="6" fill="${cor}"/>` +
    linhas.join('') + '</svg>';
}

/* Dois pedaços empilhados como o gerador faz (8a): um <svg> externo com o
 * total e cada pedaço aninhado, com 6 pt de folga entre eles. */
function svgEmpilhado(largura, alturas, numero, cor) {
  let y = 0;
  const partes = alturas.map((h, i) => {
    // pedaço aninhado SEM unidade, como o gerador faz: com "pt" ele seria
    // desenhado 4/3 maior dentro do viewBox do externo
    const s = svgRecorte(largura, h, numero + i, cor, i === 0)
      .replace(`width="${largura}pt" height="${h}pt"`, `width="${largura}" height="${h}"`)
      .replace('<svg ', `<svg x="0" y="${y}" `);
    y += h + 6;
    return s;
  });
  const total = y - 6;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}pt" height="${total}pt" viewBox="0 0 ${largura} ${total}">` +
    partes.join('') + '</svg>';
}

function svgPagina(numero, cor) {
  const L = 612, A = 792, linhas = [];
  for (let y = 120, k = 0; y < A - 60; y += 18, k++) {
    linhas.push(`<rect x="60" y="${y}" width="${L - 120 - ((numero * 11 + k * 17) % 90)}" height="6" fill="#9aa3ad"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}pt" height="${A}pt" viewBox="0 0 ${L} ${A}">` +
    `<rect x="0" y="0" width="${L}" height="${A}" fill="#ffffff"/>` +
    `<rect x="60" y="50" width="${120 + numero * 30}" height="28" fill="${cor}"/>` +
    linhas.join('') + '</svg>';
}

// ------------------------------------------------------------------ conteúdo

const SERIE = '9ano';
const MODULOS = [
  {
    slug: 'equacoes-do-segundo-grau', titulo: 'Equações do Segundo Grau', cor: '#1F3A5F',
    teorias: [
      { slug: 'resultados-basicos-parte-i', titulo: 'Resultados Básicos - Parte I', paginas: 5,
        texto: 'equacao do segundo grau forma geral coeficientes a b c raizes da equacao' },
      { slug: 'resultados-basicos-parte-ii', titulo: 'Resultados Básicos - Parte II', paginas: 4,
        texto: 'discriminante delta formula de bhaskara quantidade de raizes reais' },
      { slug: 'soma-e-produto-das-raizes', titulo: 'Soma e Produto das Raízes', paginas: 3,
        texto: 'soma das raizes produto das raizes relacoes entre coeficientes e raizes' },
      { slug: 'equacoes-biquadradas', titulo: 'Equações Biquadradas', paginas: 3,
        texto: 'equacao biquadrada troca de variavel equacao do segundo grau auxiliar' }
    ],
    listas: [
      { slug: 'equacao-do-2o-grau-resultados-basicos', titulo: 'Equações do Segundo Grau: Resultados Básicos', itens: 40,
        pareada: ['resultados-basicos-parte-i', 'resultados-basicos-parte-ii'] },
      { slug: 'soma-e-produto', titulo: 'Soma e Produto', itens: 8, objetivas: [3, 6],
        pareada: ['soma-e-produto-das-raizes'] }
    ]
  },
  {
    slug: 'produtos-notaveis-e-fatoracao', titulo: 'Produtos Notáveis e Fatoração', cor: '#2E7D6B',
    teorias: [{ slug: 'produtos-notaveis', titulo: 'Produtos Notáveis', paginas: 3,
      texto: 'quadrado da soma quadrado da diferenca produto da soma pela diferenca' },
      // de outro módulo e casa no título com "equação do segundo grau": o
      // módulo dela também é achado (o resumo cita a aula), então ela entra no
      // mesmo patamar e disputa pela nota com as do módulo de equações
      { slug: 'equacao-do-segundo-grau-e-fatoracao', titulo: 'Equação do Segundo Grau e Fatoração', paginas: 2,
        texto: 'fatorar o trinomio para achar as raizes' }],
    listas: [{ slug: 'produtos-notaveis', titulo: 'Produtos Notáveis', itens: 6, pareada: ['produtos-notaveis'] }]
  },
  {
    slug: 'teorema-de-pitagoras', titulo: 'Teorema de Pitágoras', cor: '#B4453C',
    teorias: [{ slug: 'o-teorema', titulo: 'O Teorema', paginas: 3,
      texto: 'triangulo retangulo hipotenusa catetos quadrado da hipotenusa e o discriminante delta de uma equacao auxiliar, discriminante delta' }],
    listas: [{ slug: 'aplicacoes', titulo: 'Aplicações do Teorema', itens: 6, pareada: ['o-teorema'] }]
  }
];

const dd = n => String(n).padStart(2, '0');
const sha = b => 'sha256:' + crypto.createHash('sha256').update(b).digest('hex');
const json = o => Buffer.from(JSON.stringify(o, null, 1) + '\n', 'utf8');

function gerar(saida, opcoes) {
  opcoes = opcoes || {};
  const veneno = opcoes.veneno || null;
  const versao = opcoes.versao || 1;
  const arquivos = {};   // nome -> { dados, metodo }
  const itens = [], teoria = [], docs = [];
  let paginasTeoria = 0, aulasExercicios = 0, comSolucao = 0;

  for (const m of MODULOS) {
    const titulosAulas = [];
    m.teorias.forEach((t, ti) => {
      const id = `${SERIE}:${m.slug}:${t.slug}:teo`;
      const paginas = [];
      for (let p = 1; p <= t.paginas; p++) {
        const asset = `assets/${SERIE}/${m.slug}/${t.slug}/teo-p${dd(p)}.svg`;
        // páginas de teoria vão SEM compressão: o leitor tem de ler os dois métodos
        arquivos[asset] = { dados: Buffer.from(svgPagina(p, m.cor)), metodo: 0 };
        paginas.push({ id: `${id}:p${dd(p)}`, n: p, capa: p === 1, asset,
          medidas: { largura_pt: 612, altura_pt: 792 },
          texto: p === 1 ? 'portal sintetico material teorico ' + t.titulo.toLowerCase() : t.texto });
      }
      paginasTeoria += paginas.length;
      const pareados = m.listas.filter(l => l.pareada.indexOf(t.slug) >= 0).map(l => `${SERIE}:${m.slug}:${l.slug}`);
      teoria.push({ id, fonte: 'obmep-portal', serie: SERIE,
        modulo: { slug: m.slug, titulo: m.titulo },
        aula: { slug: t.slug, titulo: t.titulo, n: ti + 1, autor: 'Autor Sintético', revisor: 'Revisor Sintético', data: '2026-09-21' },
        exercicios_pareados: pareados, paginas });
      titulosAulas.push(t.titulo);
      docs.push({ id, tipo: 'teoria', titulo: t.titulo, resumo: m.titulo, texto: paginas.slice(1).map(p => p.texto).join(' ') });
    });
    m.listas.forEach((l, li) => {
      aulasExercicios++;
      for (let n = 1; n <= l.itens; n++) {
        const id = `${SERIE}:${m.slug}:${l.slug}:ex:${n}`;
        const base = `assets/${SERIE}/${m.slug}/${l.slug}/ex-${dd(n)}`;
        const objetiva = (l.objetivas || []).indexOf(n) >= 0;
        const alt = 90 + (n % 5) * 20;
        const deCompor = !!opcoes.compor && l.slug === 'soma-e-produto';
        const semSolucao = deCompor && n === 4;
        const empilhada = deCompor && n === 7 ? [400, 380] : null;
        const altSol = empilhada ? 400 + 6 + 380 : alt + 60;
        arquivos[base + '.svg'] = { dados: Buffer.from(svgRecorte(262, alt, n, m.cor, deCompor)), metodo: 8 };
        if (!semSolucao) {
          arquivos[base + '-sol.svg'] = { dados: Buffer.from(empilhada ? svgEmpilhado(262, empilhada, n + 3, '#C9A961')
            : svgRecorte(262, altSol, n + 3, '#C9A961', deCompor)), metodo: 8 };
          comSolucao++;
        }
        // no modo compor, o "rótulo" é a barra do canto (4,4 a 60,16 pt)
        // o 4 tem a caixa do rótulo estreita: o número não cabe com 7 pt e vai para a faixa de cima
        const rotulo = deCompor ? (n === 2 ? null : n === 4 ? [4, 4, 14, 16] : [4, 4, 60, 16]) : undefined;
        const terco = Math.min(3, 1 + Math.floor(3 * (n - 1) / l.itens));
        const texto = `resolva o exercicio ${n} sobre ${l.titulo.toLowerCase()}`;
        itens.push({
          id, fonte: 'obmep-portal', serie: SERIE,
          modulo: { slug: m.slug, titulo: m.titulo },
          aula: { slug: l.slug, titulo: l.titulo, n: li + 1 },
          numero: n, formato: objetiva ? 'objetiva' : 'aberta',
          alternativas: objetiva ? ['A', 'B', 'C', 'D', 'E'] : null,
          resposta: objetiva ? 'C' : null, subitens: [],
          texto, origem_citada: n === 5 ? 'Extraído da Olimpíada Sintética' : null,
          origem_citada_em: n === 5 ? 'solucao' : undefined,
          dificuldade: terco, dificuldade_origem: 'proxy',
          proxy: { posicao: Math.round(1000 * (n - 1) / l.itens) / 1000, terco }, tema_app: null,
          assets: { enunciado: base + '.svg', solucao: semSolucao ? null : base + '-sol.svg' },
          medidas: { enunciado: { largura_pt: 262, altura_pt: alt, rotulo },
            solucao: semSolucao ? undefined : { largura_pt: 262, altura_pt: altSol, rotulo } },
          sem_solucao: semSolucao || undefined,
          origem: { arquivo: `PDF/matematica/sintetico/${SERIE}/${m.slug}__exercicios-${l.slug}.pdf`,
            enunciado: { pagina: 1, coluna: 1, bbox: [33, 100, 295, 100 + alt] },
            solucao: semSolucao ? undefined : empilhada
              ? { pagina: 5, coluna: 1, bbox: [33, 100, 295, 500],
                pedacos: [{ pagina: 5, coluna: 1, bbox: [33, 100, 295, 500] }, { pagina: 5, coluna: 2, bbox: [305, 60, 567, 440] }] }
              : { pagina: 5, coluna: 1, bbox: [33, 100, 295, 160 + alt] } }
        });
        docs.push({ id, tipo: 'exercicio', titulo: '', resumo: `${l.titulo} ${m.titulo}`, texto });
      }
      titulosAulas.push(l.titulo);
    });
    docs.push({ id: `${SERIE}:${m.slug}`, tipo: 'modulo', titulo: m.titulo, resumo: titulosAulas.join(' '), texto: '' });
  }

  docs.sort((a, b) => a.id < b.id ? -1 : 1);
  const indice = Busca.montarIndice(docs.map(d => ({ id: d.id, serie: '09', titulo: d.titulo, resumo: d.resumo,
    explicacao: '', enunciados: d.texto })));
  const tipos = {}; docs.forEach(d => { tipos[d.id] = d.tipo; });
  indice.forEach(r => { r.k = tipos[r.i]; });
  const busca = { formato: 'indice-de-busca', versao: 1, tipos: { k: 'modulo, teoria ou exercicio' }, temas: indice };
  const apelidos = { bhaskara: ['equação do segundo grau'], pitagoras: ['teorema de pitagoras'] };

  if (veneno === 'asset-citado') itens[3].assets.solucao = itens[3].assets.solucao.replace('-sol.svg', '-sumiu.svg');
  if (veneno === 'asset-fora') {
    arquivos['figs/fora.svg'] = { dados: Buffer.from(svgRecorte(100, 60, 1, '#000')), metodo: 8 };
    itens[2].assets.enunciado = 'figs/fora.svg';
  }

  arquivos['itens.json'] = { dados: json(itens), metodo: 8 };
  arquivos['teoria.json'] = { dados: json(teoria), metodo: 8 };
  arquivos['busca.json'] = { dados: json(busca), metodo: 8 };
  arquivos['apelidos.json'] = { dados: json(apelidos), metodo: 0 };

  const nomes = Object.keys(arquivos).sort();
  const lista = {};
  nomes.forEach(n => { lista[n] = sha(arquivos[n].dados); });

  const alvoDeflate = `assets/${SERIE}/equacoes-do-segundo-grau/soma-e-produto/ex-02.svg`;
  const alvoStored = `assets/${SERIE}/equacoes-do-segundo-grau/soma-e-produto-das-raizes/teo-p02.svg`;
  if (veneno === 'hash') lista[alvoDeflate] = sha(Buffer.from('outro conteudo'));
  if (veneno === 'faltando') lista['assets/9ano/nao-existe/ex-01.svg'] = sha(Buffer.from('x'));

  const manifest = {
    esquema: veneno === 'esquema' ? 2 : 1,
    pacote: opcoes.pacote || 'matematica-sintetico-9ano', versao,
    gerado_em: '2026-09-21T21:00:00-03:00',
    gerador: { nome: '_teste/_pacote_sintetico.js', commit: null },
    materia: 'matematica',
    fonte: { id: 'obmep-portal', nome: 'Pacote sintético de teste', url: 'https://example.invalid/', licenca: 'gerado para teste' },
    series: [SERIE],
    contagens: { modulos: MODULOS.length, aulas_teoria: teoria.length, paginas_teoria: paginasTeoria,
      aulas_exercicios: aulasExercicios, itens: itens.length, itens_com_solucao: comSolucao, itens_excluidos: 0 },
    arquivos: lista
  };

  const entradas = [{ nome: 'manifest.json', dados: json(manifest), metodo: 8 }];
  nomes.forEach(n => {
    if (veneno === 'asset-citado' && /-sumiu\.svg$/.test(n)) return;
    entradas.push({ nome: n, dados: arquivos[n].dados, metodo: arquivos[n].metodo,
      estragar: (veneno === 'corrompido-deflate' && n === alvoDeflate) || (veneno === 'corrompido-stored' && n === alvoStored) });
  });
  if (veneno === 'sobrando') entradas.push({ nome: 'assets/9ano/intruso.svg', dados: Buffer.from(svgRecorte(100, 50, 1, '#000')), metodo: 8 });

  const zip = montarZip(entradas);
  if (saida) fs.writeFileSync(saida, zip);
  return { zip, manifest, itens, teoria, busca, apelidos, arquivos };
}

/* Pacote sintético do Banco de Questões, no formato da seção 8b do contrato:
 * nível 2, equivalente ao 8º e ao 9º ano, dois "anos" com seis problemas cada.
 * O problema 4 de 2020 fala de equação do segundo grau, para a busca
 * "bhaskara" ter o que mostrar no grupo Banco. */
function gerarBanco(saida, opcoes) {
  opcoes = opcoes || {};
  const versao = opcoes.versao || 1;
  const arquivos = {}, itens = [], docs = [];
  const equivalentes = ['8ano', '9ano'];
  for (const ano of [2019, 2020]) {
    const mod = { slug: 'banco-' + ano, titulo: 'Banco de Questões ' + ano };
    for (let n = 1; n <= 6; n++) {
      const id = `banco:${ano}:n2:${n}`;
      const base = `assets/banco/${ano}/n2/q-${dd(n)}`;
      const alt = 110 + n * 10;
      arquivos[base + '.svg'] = { dados: Buffer.from(svgRecorte(262, alt, n, '#7C3AED')), metodo: 8 };
      arquivos[base + '-sol.svg'] = { dados: Buffer.from(svgRecorte(262, alt + 40, n + 1, '#C9A961')), metodo: 8 };
      const segundoGrau = ano === 2020 && n === 4;
      const titulo = segundoGrau ? 'As raízes escondidas' : 'Problema sintético ' + n;
      const texto = segundoGrau ? 'uma equacao do segundo grau tem raizes inteiras encontre os coeficientes'
        : 'problema sintetico numero ' + n + ' de contagem';
      itens.push({ id, fonte: 'obmep-banco', serie: 'n2', series_equivalentes: equivalentes,
        modulo: mod, aula: { slug: 'nivel-2', titulo: 'Nível 2', n: 2 }, numero: n, titulo,
        formato: 'aberta', alternativas: null, resposta: null, subitens: [], texto, origem_citada: null,
        dificuldade: 2, dificuldade_origem: 'proxy', proxy: { nivel: 2 }, tema_app: null,
        assets: { enunciado: base + '.svg', solucao: base + '-sol.svg' },
        medidas: { enunciado: { largura_pt: 262, altura_pt: alt }, solucao: { largura_pt: 262, altura_pt: alt + 40 } },
        origem: { arquivo: `PDF/matematica/sintetico/banco/${ano}.pdf`, enunciado: { pagina: 3, coluna: 1, bbox: [33, 100, 295, 100 + alt] },
          solucao: { pagina: 9, coluna: 1, bbox: [33, 100, 295, 140 + alt] } } });
      docs.push({ id, tipo: 'exercicio', titulo, resumo: 'Banco de Questões ' + ano + ' Nível 2', texto });
    }
    docs.push({ id: 'banco:' + ano + ':n2', tipo: 'modulo', titulo: mod.titulo, resumo: 'Nível 2', texto: '' });
  }
  docs.sort((a, b) => a.id < b.id ? -1 : 1);
  const indice = Busca.montarIndice(docs.map(d => ({ id: d.id, serie: '08', titulo: d.titulo, resumo: d.resumo, explicacao: '', enunciados: d.texto })));
  const tipos = {}; docs.forEach(d => { tipos[d.id] = d.tipo; });
  indice.forEach(r => { r.k = tipos[r.i]; });
  arquivos['itens.json'] = { dados: json(itens), metodo: 8 };
  arquivos['teoria.json'] = { dados: json([]), metodo: 8 };
  arquivos['busca.json'] = { dados: json({ formato: 'indice-de-busca', versao: 1, tipos: { k: 'modulo, teoria ou exercicio' }, temas: indice }), metodo: 8 };
  arquivos['apelidos.json'] = { dados: json({ bhaskara: ['equação do segundo grau'] }), metodo: 0 };
  const nomes = Object.keys(arquivos).sort();
  const lista = {};
  nomes.forEach(n => { lista[n] = sha(arquivos[n].dados); });
  const manifest = { esquema: 1, pacote: 'matematica-sintetico-banco-n2', versao, gerado_em: '2026-09-21T21:00:00-03:00',
    gerador: { nome: '_teste/_pacote_sintetico.js', commit: null }, materia: 'matematica',
    fonte: { id: 'obmep-banco', nome: 'Banco sintético de teste', url: 'https://example.invalid/', licenca: 'gerado para teste' },
    series: ['n2'], series_equivalentes: { n2: equivalentes },
    contagens: { modulos: 2, aulas_teoria: 0, paginas_teoria: 0, aulas_exercicios: 2, itens: itens.length, itens_com_solucao: itens.length, itens_excluidos: 0 },
    arquivos: lista };
  const zip = montarZip([{ nome: 'manifest.json', dados: json(manifest), metodo: 8 }]
    .concat(nomes.map(n => ({ nome: n, dados: arquivos[n].dados, metodo: arquivos[n].metodo }))));
  if (saida) fs.writeFileSync(saida, zip);
  return { zip, manifest, itens, arquivos };
}

const VENENOS = ['corrompido-deflate', 'corrompido-stored', 'hash', 'sobrando', 'faltando', 'asset-citado', 'esquema', 'asset-fora'];

module.exports = { gerar, gerarBanco, montarZip, crc32, VENENOS, MODULOS };

if (require.main === module) {
  const saida = process.argv[2];
  if (!saida) { console.error('uso: node _teste/_pacote_sintetico.js <saida.zip> [--veneno=x] [--versao=N]'); process.exit(2); }
  const v = (process.argv.find(a => a.startsWith('--veneno=')) || '').split('=')[1] || null;
  const ver = parseInt((process.argv.find(a => a.startsWith('--versao=')) || '').split('=')[1] || '1', 10);
  const r = gerar(path.resolve(saida), { veneno: v, versao: ver });
  console.log('pacote sintetico: ' + r.itens.length + ' itens, ' + r.teoria.length + ' aulas de teoria, ' + r.zip.length + ' bytes');
}
