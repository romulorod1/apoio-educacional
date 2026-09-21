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
function svgRecorte(largura, altura, numero, cor) {
  const linhas = [];
  for (let y = 26, k = 0; y < altura - 10; y += 14, k++) {
    const w = largura - 40 - ((numero * 7 + k * 13) % 60);
    linhas.push(`<rect x="20" y="${y}" width="${w}" height="5" fill="#9aa3ad"/>`);
  }
  const barra = 20 + (numero % 10) * ((largura - 40) / 10);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}pt" height="${altura}pt" viewBox="0 0 ${largura} ${altura}">` +
    `<rect x="0" y="0" width="${largura}" height="${altura}" fill="#ffffff"/>` +
    `<rect x="4" y="4" width="18" height="14" fill="${cor}"/>` +
    `<rect x="26" y="8" width="${barra}" height="6" fill="${cor}"/>` +
    linhas.join('') + '</svg>';
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
      texto: 'quadrado da soma quadrado da diferenca produto da soma pela diferenca' }],
    listas: [{ slug: 'produtos-notaveis', titulo: 'Produtos Notáveis', itens: 6, pareada: ['produtos-notaveis'] }]
  },
  {
    slug: 'teorema-de-pitagoras', titulo: 'Teorema de Pitágoras', cor: '#B4453C',
    teorias: [{ slug: 'o-teorema', titulo: 'O Teorema', paginas: 3,
      texto: 'triangulo retangulo hipotenusa catetos quadrado da hipotenusa' }],
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
        arquivos[base + '.svg'] = { dados: Buffer.from(svgRecorte(262, alt, n, m.cor)), metodo: 8 };
        arquivos[base + '-sol.svg'] = { dados: Buffer.from(svgRecorte(262, alt + 60, n + 3, '#C9A961')), metodo: 8 };
        comSolucao++;
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
          assets: { enunciado: base + '.svg', solucao: base + '-sol.svg' },
          medidas: { enunciado: { largura_pt: 262, altura_pt: alt }, solucao: { largura_pt: 262, altura_pt: alt + 60 } },
          origem: { arquivo: `PDF/matematica/sintetico/${SERIE}/${m.slug}__exercicios-${l.slug}.pdf`,
            enunciado: { pagina: 1, coluna: 1, bbox: [33, 100, 295, 100 + alt] },
            solucao: { pagina: 5, coluna: 1, bbox: [33, 100, 295, 160 + alt] } }
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
    pacote: 'matematica-sintetico-9ano', versao,
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

const VENENOS = ['corrompido-deflate', 'corrompido-stored', 'hash', 'sobrando', 'faltando', 'asset-citado', 'esquema'];

module.exports = { gerar, montarZip, crc32, VENENOS, MODULOS };

if (require.main === module) {
  const saida = process.argv[2];
  if (!saida) { console.error('uso: node _teste/_pacote_sintetico.js <saida.zip> [--veneno=x] [--versao=N]'); process.exit(2); }
  const v = (process.argv.find(a => a.startsWith('--veneno=')) || '').split('=')[1] || null;
  const ver = parseInt((process.argv.find(a => a.startsWith('--versao=')) || '').split('=')[1] || '1', 10);
  const r = gerar(path.resolve(saida), { veneno: v, versao: ver });
  console.log('pacote sintetico: ' + r.itens.length + ' itens, ' + r.teoria.length + ' aulas de teoria, ' + r.zip.length + ' bytes');
}
