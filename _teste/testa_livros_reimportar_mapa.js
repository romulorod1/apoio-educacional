/* testa_livros_reimportar_mapa.js
 *
 * A versão nova de um pacote de livros que só muda o MAPA (e, onde o sumário
 * era vazio, o sumário): o caso dos pacotes de Matemática do 7º ao 9º ano que
 * ganharam o assunto de volume (MAT08-15) em 12/11/2026. No Chrome de verdade,
 * pela importação de Ajustes, com pacotes SINTÉTICOS montados aqui (bytes de
 * "PDF" que a importação não abre; ela confere tamanho, CRC e hash). Nenhum
 * livro de verdade, nenhum nome de criança.
 *
 * Dois livros, com o MESMO arquivo (mesmo hash) no v1 e no v2:
 *   livro-com-mapa  sumário igual nos dois; o v2 acrescenta MAT08-15 ao
 *                   capítulo 2 (como o Teláris 8 cap. 7);
 *   livro-sem-mapa  sumário e mapa VAZIOS no v1; o v2 traz um sumário de uma
 *                   entrada e o mapa com MAT08-15 (como o Geração Alpha 8 e o
 *                   Araribá 8, a exceção aceita pela orquestradora).
 *
 * O que se prova:
 *   1. o índice servido tem o MAT08-15, do 8º ano, com o título;
 *   2. depois do v2: só o meta foi trocado (versão 2, o mapa novo, o sumário
 *      novo do livro-sem-mapa), o arquivo é o mesmo (bytes e hash) e o
 *      registro manteve a data de importação do v1 (o arquivo não foi
 *      regravado);
 *   3. a posição de leitura (livros_posicoes) dos dois livros ficou intacta,
 *      inclusive a do livro cujo sumário passou de vazio a preenchido;
 *   4. a correção dela (db.ajustes.mapaDosLivros) ficou intacta e continua
 *      valendo por cima do mapa novo: capítulo de mesmo número e título;
 *   5. "Abrir no livro" acha os dois capítulos pelo MAT08-15 no 8º ano, e
 *      nenhum no 7º;
 *   6. reimportar o v1 depois do v2 não rebaixa: a tela diz que o tablet tem
 *      a versão mais nova, e meta, posição e correção continuam as do v2;
 *   7. nenhum erro de página.
 *
 * Veneno (a prova tem de VER o defeito, e então passa dizendo que viu):
 *   --envenenado-meta-nao-troca  o store.js servido deixa de trocar o meta do
 *                                livro de mesmo hash e versão maior: o
 *                                MAT08-15 não chega a nenhum dos dois.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, esperar } = H;

const MODOS = ['--envenenado-meta-nao-troca'];
const MODO = MODOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && MODOS.indexOf(a) < 0);
const PORTA = 8887;

const STORE = fs.readFileSync(path.join(H.RAIZ, 'store.js'), 'utf8');
const ANCORA = '              if (versao > atual.versao) {\n                dep.put({ id: atual.id, pacote: chave, versao: versao, meta: l.meta, blob: atual.blob,';
const ANCORA_N = STORE.replace(/\r\n/g, '\n').split(ANCORA).length - 1;
const trocas = {};
if (MODO === '--envenenado-meta-nao-troca') {
  trocas['/store.js'] = STORE.replace(/\r\n/g, '\n').split(ANCORA).join(ANCORA.replace('if (versao > atual.versao) {', 'if (false) {'));
}
const amb = H.criarAmbiente(PORTA, 'nath_reimportar_mapa', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'reimportar_mapa_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

const PACOTE = 'livros-sintetico-reimportar';
const BYTES = {
  'livro-com-mapa': Buffer.from('%PDF-1.4 sintetico livro-com-mapa ' + 'x'.repeat(3000)),
  'livro-sem-mapa': Buffer.from('%PDF-1.4 sintetico livro-sem-mapa ' + 'y'.repeat(2500))
};
const hashDe = b => 'sha256:' + crypto.createHash('sha256').update(b).digest('hex');
const SUMARIO_COM = [{ n: 1, nivel: 1, titulo: 'Capítulo 1', pagina: 1, pagina_fim: 2 },
  { n: 2, nivel: 1, titulo: 'Capítulo 2', pagina: 3, pagina_fim: 4 }];
const a = id => ({ id, confianca: 'alta' });

function meta(id, versao) {
  const m = { id, formato: 'pdf', arquivo: 'livros/' + id + '.pdf', hash: hashDe(BYTES[id]), bytes: BYTES[id].length,
    titulo: 'Livro ' + id + ' de teste', materia: 'matematica', paginas: 4, series: ['08'], series_origem: 'mapa' };
  if (id === 'livro-com-mapa') {
    m.sumario = SUMARIO_COM; m.sumario_origem = 'marcadores';
    m.mapa = [{ n: 1, titulo: 'Circunferências e círculos', pagina: 1, pagina_fim: 2, assuntos: [a('MAT08-13')], origem: 'mapa' },
      { n: 2, titulo: 'Perímetros, áreas e volumes', pagina: 3, pagina_fim: 4,
        assuntos: versao >= 2 ? [a('MAT08-13'), a('MAT08-15')] : [a('MAT08-13')], origem: 'mapa' }];
  } else if (versao >= 2) {
    m.sumario = [{ n: 1, nivel: 1, titulo: 'Volumes e capacidades', pagina: 2, pagina_fim: 3 }]; m.sumario_origem = 'mapa';
    m.mapa = [{ n: 1, titulo: 'Volumes e capacidades', pagina: 2, pagina_fim: 3, assuntos: [a('MAT08-15')], origem: 'mapa' }];
  } else {
    m.sumario = []; m.sumario_origem = 'nenhum'; m.mapa = [];
  }
  return m;
}

function pacote(versao) {
  const ids = Object.keys(BYTES);
  const arquivos = {};
  ids.forEach(id => { arquivos['livros/' + id + '.pdf'] = hashDe(BYTES[id]); });
  const manifest = { esquema: 1, pacote: PACOTE, versao, conteudo: 'livros', arquivos, livros: ids.map(id => meta(id, versao)) };
  const p = path.join(TMP, PACOTE + '-v' + versao + '.zip');
  fs.writeFileSync(p, Sintetico.montarZip([{ nome: 'manifest.json', dados: Buffer.from(JSON.stringify(manifest)), metodo: 0 }]
    .concat(ids.map(id => ({ nome: 'livros/' + id + '.pdf', dados: BYTES[id], metodo: 0 })))));
  return p;
}

async function importar(pag, arquivo, rotulo) {
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => {
    document.querySelector('#estado-importacao-biblioteca').innerHTML = '';
    document.querySelector('#cartao-biblioteca').hidden = false;
  });
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar(rotulo, () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca');
    return { texto: c ? c.innerText.trim() : '', livre: document.querySelector('#importar-biblioteca').disabled === false };
  }), v => !!v && v.livre && !!v.texto && !/Conferindo|Gravando|Importando/.test(v.texto), 60000);
  return (r.valor && r.valor.texto) || '';
}

// o que a prova olha de cada livro, de dentro da página
const estado = pag => pag.evaluate(async ids => {
  const d = await Store.carregar();
  const correcoes = (d.ajustes || {}).mapaDosLivros || {};
  const saida = { correcoes: JSON.stringify(correcoes), livros: {} };
  for (const id of ids) {
    const r = await Store.lerLivro(id);
    const pos = await Store.lerPosicaoLivro(id);
    saida.livros[id] = r ? {
      versao: r.versao, importadoEm: r.importadoEm, hash: r.meta.hash, texto: await r.blob.text(),
      sumario: JSON.stringify(r.meta.sumario), mapa: r.meta.mapa.map(e => e.n + ':' + e.assuntos.map(x => x.id).join('+')).join(' | '),
      valendo: Biblioteca.mapaDoLivro(r.meta, correcoes[id]).map(e => e.n + ':' + e.estado + ':' + e.assuntos.join('+')).join(' | '),
      posicao: pos ? pos.pagina : null
    } : null;
  }
  const todos = await Store.listarLivros();
  saida.abrir8 = Biblioteca.livrosComAssunto(todos, correcoes, 'MAT08-15', '08').map(x => x.id + '#' + x.entrada.n).join(',');
  saida.abrir7 = Biblioteca.livrosComAssunto(todos, correcoes, 'MAT08-15', '07').map(x => x.id + '#' + x.entrada.n).join(',');
  return saida;
}, Object.keys(BYTES));

(async () => {
  secao('0. Venenos e pacotes');
  conf('nenhum veneno desconhecido foi pedido', desconhecidos.join(','), '');
  conf('a âncora do veneno aparece no store.js uma vez só', ANCORA_N, 1);
  if (MODO) conf('envenenado: o store.js servido ficou DIFERENTE do repositório', trocas['/store.js'] !== STORE.replace(/\r\n/g, '\n') ? 'diferente' : 'IGUAL', 'diferente');
  const v1 = pacote(1), v2 = pacote(2);

  await amb.subir();
  const pag = await amb.pagina();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.setViewport({ width: 1280, height: 800 });
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('1. O índice servido tem o MAT08-15, do 8º ano');
  const tema = await pag.evaluate(() => fetch('banco/topicos/matematica.json').then(x => x.json())
    .then(j => j.temas.filter(t => t.id === 'MAT08-15').map(t => t.serie + '|' + t.unidade + '|' + t.pt.titulo + '|' + t.prerequisitos.join('+'))[0] || null));
  conf('MAT08-15 no índice, com ano, unidade, título e pré-requisitos', tema, '08|grandezas|Volume e capacidade: bloco retangular e cilindro|MAT06-12+MAT08-13');

  // ================================================================
  secao('2. O v1, a posição de leitura e a correção dela');
  let t = await importar(pag, v1, 'importação do v1');
  conf('o v1 entrou', /^Livros importados\./.test(t), true);
  const correcao = { 'livro-com-mapa': { '1': { titulo: 'Circunferências e círculos', assuntos: ['MAT08-12'], acao: 'corrigiu', quando: '2026-11-10T10:00:00.000Z' } },
    'livro-sem-mapa': { '7': { titulo: 'Capítulo que não existe', assuntos: ['MAT08-01'], acao: 'corrigiu', quando: '2026-11-10T10:00:00.000Z' } } };
  await pag.evaluate(async c => {
    const d = await Store.carregar();
    d.ajustes = d.ajustes || {};
    d.ajustes.mapaDosLivros = c;
    await Store.salvar(d);
    await Store.gravarPosicaoLivro({ id: 'livro-com-mapa', pagina: 4 });
    await Store.gravarPosicaoLivro({ id: 'livro-sem-mapa', pagina: 3 });
  }, correcao);
  await H.abrirApp(pag, amb.ORIGEM);
  const antes = await estado(pag);
  conf('v1: livro-com-mapa sem MAT08-15', antes.livros['livro-com-mapa'].mapa, '1:MAT08-13 | 2:MAT08-13');
  conf('v1: livro-sem-mapa com sumário e mapa vazios', antes.livros['livro-sem-mapa'].sumario + '/' + antes.livros['livro-sem-mapa'].mapa, '[]/');
  conf('v1: a correção vale no capítulo 1', antes.livros['livro-com-mapa'].valendo, '1:corrigido:MAT08-12 | 2:do_mapa:MAT08-13');
  conf('v1: as posições gravadas', antes.livros['livro-com-mapa'].posicao + '/' + antes.livros['livro-sem-mapa'].posicao, '4/3');
  conf('v1: "Abrir no livro" com MAT08-15 não acha nada', antes.abrir8, '');

  // ================================================================
  secao('3. O v2: mesmo arquivo, versão maior, mapa novo');
  t = await importar(pag, v2, 'importação do v2');
  conf('a tela diz que importou', /^Livros importados\./.test(t), true);
  const depois = await estado(pag);
  const C = depois.livros['livro-com-mapa'], S = depois.livros['livro-sem-mapa'];
  const A0 = antes.livros['livro-com-mapa'], S0 = antes.livros['livro-sem-mapa'];
  if (MODO === '--envenenado-meta-nao-troca') {
    conf('VENENO visto: o meta não trocou, e o MAT08-15 não chegou a nenhum dos dois',
      C.mapa === A0.mapa && S.mapa === '' && depois.abrir8 === '', true);
    return;
  }
  conf('os dois livros ficaram com a versão 2', C.versao + '/' + S.versao, '2/2');
  conf('livro-com-mapa: o capítulo 2 ganhou MAT08-15', C.mapa, '1:MAT08-13 | 2:MAT08-13+MAT08-15');
  conf('livro-com-mapa: o sumário é o mesmo do v1', C.sumario === A0.sumario, true);
  conf('livro-sem-mapa: o sumário passou de vazio a uma entrada', S.sumario, JSON.stringify([{ n: 1, nivel: 1, titulo: 'Volumes e capacidades', pagina: 2, pagina_fim: 3 }]));
  conf('livro-sem-mapa: o mapa novo com MAT08-15', S.mapa, '1:MAT08-15');
  conf('o arquivo é o mesmo, byte a byte, nos dois', C.texto === A0.texto && S.texto === S0.texto && C.hash === A0.hash && S.hash === S0.hash, true);
  conf('o registro manteve a data de importação do v1 (o arquivo não foi regravado)', C.importadoEm === A0.importadoEm && S.importadoEm === S0.importadoEm, true);
  conf('a posição de leitura dos dois ficou intacta', C.posicao + '/' + S.posicao, '4/3');
  conf('db.ajustes.mapaDosLivros ficou intacto', depois.correcoes, JSON.stringify(correcao));
  conf('a correção continua valendo por cima do mapa novo', C.valendo, '1:corrigido:MAT08-12 | 2:do_mapa:MAT08-13+MAT08-15');
  conf('"Abrir no livro" acha os dois capítulos pelo MAT08-15 no 8º ano', depois.abrir8, 'livro-com-mapa#2,livro-sem-mapa#1');
  conf('e nenhum no 7º ano', depois.abrir7, '');

  // ================================================================
  secao('4. O v1 de novo, depois do v2: não rebaixa');
  t = await importar(pag, v1, 'o v1 depois do v2');
  conf('a tela diz que o tablet tem a versão mais nova', /versão 2/.test(t) && /Nada foi mudado/.test(t), true);
  const fim = await estado(pag);
  conf('meta, posição e correção continuam as do v2', JSON.stringify(fim) === JSON.stringify(depois), true);

  secao('5. Nenhum erro de página');
  conf('nenhum erro de página', erros.join(' | ') || 'nenhum', 'nenhum');
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
