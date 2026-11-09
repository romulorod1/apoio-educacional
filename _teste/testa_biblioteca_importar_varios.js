/* testa_biblioteca_importar_varios.js
 *
 * Importar VÁRIOS pacotes de uma vez, em Ajustes, no Chrome de verdade, com
 * pacotes SINTÉTICOS e PEQUENOS gerados aqui (_pacote_sintetico.js). Os livros
 * e pacotes reais do Drive nunca entram.
 *
 * O que prova, na ordem:
 *   1. o seletor aceita vários arquivos (`multiple`), e é o mesmo dos livros;
 *   2. um arquivo só segue como sempre (sem resumo, a frase de sempre);
 *   3. três pacotes de uma vez dão três importados, com o progresso geral à
 *      vista ("Importando 2 de 3: ..."), e o app lê UM pacote por vez: nenhum
 *      arquivo é lido antes de o anterior ter sido gravado;
 *   4. a mesma versão de novo é pulada ("já estava"), sem gravar nada;
 *   5. um pacote cortado NO COMEÇO da seleção não impede os outros: o resumo
 *      diz o que entrou, o que ficou como estava e o que não entrou, e por quê;
 *   6. a versão 2 substitui a 1 na mesma seleção (nas duas ordens) e em
 *      seleções seguidas; a mais velha depois da mais nova é pulada;
 *   7. um pacote de livros no meio da série, e sozinho (a frase de sempre);
 *      o que SAI do pacote novo também conta como gravação;
 *   8. falha NO MEIO (hash errado, id repetido entre dois da mesma seleção, sem
 *      espaço) e livros v2 e v1 em ordem trocada; a série pede a tela ligada e
 *      a mesma versão é pulada pelo manifest, sem ler o arquivo.
 *
 * Venenos, no mesmo arquivo (cada um TEM de ser enxergado):
 *   --envenenado-para-na-falha     o primeiro erro interrompe a série
 *   --envenenado-reimporta-igual   a mesma versão entra de novo
 *   --envenenado-le-todos-antes    todos os File são lidos antes do primeiro
 *                                  ser gravado (a prova mede a ORDEM de leitura
 *                                  contra a de gravação)
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, esperar } = H;

const MODOS = ['--envenenado-para-na-falha', '--envenenado-reimporta-igual', '--envenenado-le-todos-antes'];
const MODO = MODOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && MODOS.indexOf(a) < 0);
const PORTA = 8880;

// onde cada veneno mexe no app.js (um trecho só, conferido abaixo)
const ANCORAS = {
  '--envenenado-para-na-falha': ['        return pausaCurta().then(proximo);',
    "        return r.estado === 'falhou' ? Promise.resolve() : pausaCurta().then(proximo);"],
  '--envenenado-reimporta-igual': ['return atual && atual.versao >= manifest.versao ? atual.versao : null;',
    'return atual && atual.versao > manifest.versao ? atual.versao : null;'],
  '--envenenado-le-todos-antes': ['    var total = arquivos.length, resultados = [], i = 0;',
    '    var total = arquivos.length, resultados = [], i = 0;\n' +
    '    window.__seguraTodos = arquivos.map(function (a) { return a.arrayBuffer(); });']
};
const APP_REPO = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const trocas = {};
if (MODO) trocas['/app.js'] = APP_REPO.split(ANCORAS[MODO][0]).join(ANCORAS[MODO][1]);

const amb = H.criarAmbiente(PORTA, 'perfil_bib_importar_varios', trocas);
amb.extras['/vazio.html'] = { tipo: 'text/html; charset=utf-8', corpo: '<!doctype html><title>vazio</title>' };

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'bib_varios_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

// os pacotes pequenos: cada um tem o próprio conteúdo, para nenhum repetir exercício do outro
const IDS = {
  m1: 'matematica-sintetico-mirim-m1', m2: 'matematica-sintetico-mirim-m2',
  enem: 'matematica-sintetico-enem-3em', banco: 'matematica-sintetico-banco-n2'
};
const TITULO = {
  m2: 'Matemática, Mirim 2 (4º ano, 5º ano), OBMEP Mirim sintética', enem: 'Matemática, 3ª série do médio, ENEM sintético',
  banco: 'Matemática, nível 2 (8º ano, 9º ano), Banco sintético de teste'
};
function pacote(nome, qual, versao) {
  const p = path.join(TMP, nome + '.zip');
  if (qual === 'banco') Sintetico.gerarBanco(p, { versao });
  else if (qual === 'enem') Sintetico.gerarProva(p, { serie: '3em', versao });
  else Sintetico.gerarProva(p, { serie: qual, versao });
  return p;
}
function cortado(nome, qual) {
  const inteiro = fs.readFileSync(pacote(nome + '-inteiro', qual, 1));
  const p = path.join(TMP, nome + '.zip');
  fs.writeFileSync(p, inteiro.subarray(0, Math.floor(inteiro.length * 0.6)));
  return p;
}

const crypto = require('crypto');
/* Pacote de LIVROS sintético e mínimo: bytes de "PDF" que a importação nunca abre
 * (ela só confere tamanho, CRC e hash), e o manifest no formato do contrato. */
function pacoteDeLivros(nome, ids, versao) {
  const livros = ids.map(id => {
    const dados = Buffer.from('%PDF-1.4 sintetico ' + id + ' ' + 'x'.repeat(2000));
    return { id, dados, hash: 'sha256:' + crypto.createHash('sha256').update(dados).digest('hex') };
  });
  const arquivos = {};
  livros.forEach(l => { arquivos['livros/' + l.id + '.pdf'] = l.hash; });
  const manifest = { esquema: 1, pacote: 'livros-sintetico-varios', versao, conteudo: 'livros', arquivos,
    livros: livros.map(l => ({ id: l.id, formato: 'pdf', arquivo: 'livros/' + l.id + '.pdf', hash: l.hash,
      titulo: 'Livro ' + l.id + ' de teste', paginas: 1, sumario: [{ titulo: 'Capítulo 1', pagina: 1 }] })) };
  const p = path.join(TMP, nome + '.zip');
  fs.writeFileSync(p, Sintetico.montarZip([{ nome: 'manifest.json', dados: Buffer.from(JSON.stringify(manifest)), metodo: 0 }]
    .concat(livros.map(l => ({ nome: 'livros/' + l.id + '.pdf', dados: l.dados, metodo: 0 })))));
  return p;
}

const base = f => path.basename(f);
const versaoDosItens = (pag, id) => pag.evaluate(i => Store.itensDaBiblioteca().then(l =>
  JSON.stringify(Array.from(new Set(l.filter(x => x.pacote === i).map(x => x.versao))).sort())), id);
const lerPacotes = pag => pag.evaluate(() => Store.listarPacotesBiblioteca().then(l => l.map(p =>
  ({ pacote: p.pacote, versao: p.versao, importadoEm: p.importadoEm })).sort((a, b) => a.pacote < b.pacote ? -1 : 1)));

/* Escolhe os arquivos, espera o fim e devolve o que a tela mostrou: o resumo
 * (várias linhas) ou a frase de sempre (um arquivo só). */
async function importar(pag, arquivos, rotulo) {
  await pag.evaluate(() => {
    document.querySelector('#estado-importacao-biblioteca').innerHTML = '';
    document.querySelector('#cartao-biblioteca').hidden = false;
    window.__ordem = []; window.__prog = []; window.__wake = [];
  });
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(...arquivos);
  const r = await esperar(rotulo, () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca');
    const t = c ? c.innerText.trim() : '';
    return { texto: t, resumo: !!document.querySelector('#resumo-importacao-biblioteca'),
      livre: document.querySelector('#importar-biblioteca').disabled === false };
  }), v => v.livre && v.texto && !/Conferindo|Gravando|Importando/.test(v.texto), 90000);
  return pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca');
    const resumo = document.querySelector('#resumo-importacao-biblioteca');
    return {
      texto: c.innerText.trim(), temResumo: !!resumo,
      titulo: resumo ? resumo.firstElementChild.textContent : null,
      linhas: Array.from(document.querySelectorAll('#resumo-importacao-biblioteca li')).map(li => ({
        estado: li.dataset.estado, arquivo: li.dataset.arquivo, texto: li.innerText.replace(/\s+/g, ' ').trim() })),
      ordem: window.__ordem.slice(), progresso: window.__prog.slice(), wake: window.__wake.slice(),
      botaoLivre: document.querySelector('#importar-biblioteca').disabled === false
    };
  }).then(x => Object.assign(x, { esperou: r.ok }));
}

/* A ORDEM: cada evento do log é "le:<método>:<arquivo>" ou "grava:<pacote>".
 * Serial = os arquivos aparecem em ordem não decrescente (nenhum arquivo é
 * tocado depois de o seguinte ter sido), e só UM arquivo foi lido antes da
 * primeira gravação. */
function medirOrdem(ordem, arquivos, idsDosPacotes) {
  const dono = {};
  arquivos.forEach((f, i) => { dono[base(f)] = i; });
  const seq = [];
  let lidosAntesDaPrimeiraGravacao = new Set(), gravou = false;
  ordem.forEach(e => {
    let i;
    if (e.indexOf('le:') === 0) { i = dono[e.split(':').slice(2).join(':')]; if (!gravou) lidosAntesDaPrimeiraGravacao.add(i); }
    else if (e.indexOf('grava:') === 0) { i = idsDosPacotes[e.slice(6)]; gravou = true; }
    if (i !== undefined) seq.push(i);
  });
  const naoDecrescente = seq.every((v, k) => k === 0 || v >= seq[k - 1]);
  return { seq, naoDecrescente, lidosAntes: lidosAntesDaPrimeiraGravacao.size, gravacoes: ordem.filter(e => e.indexOf('grava:') === 0).length };
}

(async () => {
  console.log(MODO ? 'MODO ENVENENADO (' + MODO + '): o app.js servido tem o defeito, e a prova TEM de enxergá-lo.'
    : 'MODO NORMAL: vários pacotes de uma vez, em série, com resumo.');

  secao('0. Os venenos existem e o servidor é este');
  conf('a lista de venenos não está vazia', MODOS.length > 0, true);
  conf('nenhum veneno desconhecido foi pedido', desconhecidos.join(','), '');
  conf('cada âncora de veneno aparece no app.js uma vez só',
    MODOS.map(m => APP_REPO.split(ANCORAS[m][0]).length - 1).join(','), MODOS.map(() => 1).join(','));
  if (MODO) {
    conf('envenenado: o app.js servido ficou DIFERENTE do repositório', trocas['/app.js'] !== APP_REPO ? 'diferente' : 'IGUAL', 'diferente');
    if (trocas['/app.js'] === APP_REPO) throw Object.assign(new Error('veneno não aplicado'), { jaContado: true });
  }

  await amb.subir();
  const pag = await amb.pagina();
  await pag.setViewport({ width: 1280, height: 800 });
  await pag.evaluateOnNewDocument(() => {
    window.__ordem = []; window.__prog = []; window.__wake = [];
    // a trava de tela: o teste só conta o pedido e a soltura
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: {
      request: tipo => { window.__wake.push('pede:' + tipo); return Promise.resolve({ release() { window.__wake.push('solta'); } }); } } });
    // cada leitura do arquivo escolhido (e de qualquer fatia dele) entra no log, com o nome do arquivo
    ['slice', 'arrayBuffer', 'stream', 'text'].forEach(m => {
      const o = File.prototype[m];
      File.prototype[m] = function () { window.__ordem.push('le:' + m + ':' + this.name); return o.apply(this, arguments); };
    });
  });
  await pag.goto(amb.ORIGEM + '/vazio.html', { waitUntil: 'load' });
  await H.abrirApp(pag, amb.ORIGEM);
  await pag.evaluate(() => {
    // cada gravação entra no log; o progresso geral é anotado a cada mudança da caixa de estado
    // espaço curto por uma vez, quando a prova pede (window.__semEspaco)
    const espacoReal = Store.estimarEspaco;
    Store.estimarEspaco = function () {
      if (window.__semEspaco > 0) { window.__semEspaco--; return Promise.resolve({ quota: 1000, usage: 0 }); }
      return espacoReal.apply(this, arguments);
    };
    ['gravarPacoteBiblioteca', 'gravarLivros'].forEach(m => {
      const o = Store[m];
      Store[m] = function (aberto) { window.__ordem.push('grava:' + aberto.manifest.pacote); return o.apply(this, arguments); };
    });
    const caixa = document.querySelector('#estado-importacao-biblioteca');
    new MutationObserver(() => {
      const p = caixa.getAttribute('data-progresso');
      if (p) window.__prog.push(p + '|' + (caixa.innerText.split('\n')[0] || ''));
    }).observe(caixa, { childList: true, subtree: true, attributes: true });
  });
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => {
    document.querySelector('#cartao-biblioteca').hidden = false;
    document.querySelector('#titulo-cartao-biblioteca').hidden = false;
  });

  // ================================================================
  secao('1. O seletor aceita vários arquivos');
  const sel = await pag.evaluate(() => { const i = document.querySelector('#arquivo-biblioteca'); return { multiple: i.multiple, n: document.querySelectorAll('input[type=file]#arquivo-biblioteca').length, livros: document.querySelectorAll('input[type=file][id*=livro]').length }; });
  conf('o #arquivo-biblioteca tem multiple', sel.multiple, true);
  conf('e é o único seletor da Biblioteca e dos livros (não há outro de livros)', sel.n + '/' + sel.livros, '1/0');

  // ================================================================
  secao('2. Um arquivo só segue como sempre');
  const um = pacote('m1-v1', 'm1', 1);
  let r = await importar(pag, [um], 'um arquivo só');
  conf('a frase de sempre', /^Biblioteca importada\./.test(r.texto), true);
  conf('sem o resumo de vários', r.temResumo, false);
  conf('o botão volta livre', r.botaoLivre, true);
  conf('um arquivo só não pede a tela ligada', r.wake.join(','), '');
  conf('um pacote gravado', JSON.stringify((await lerPacotes(pag)).map(p => p.pacote)), JSON.stringify([IDS.m1]));

  // ================================================================
  secao('3. Três pacotes de uma vez: três importados, um por vez, com o progresso à vista');
  const tres = [pacote('m2-v1', 'm2', 1), pacote('enem-v1', 'enem', 1), pacote('banco-v1', 'banco', 1)];
  const dono3 = { [IDS.m2]: 0, [IDS.enem]: 1, [IDS.banco]: 2 };
  r = await importar(pag, tres, 'três pacotes');
  const ord = medirOrdem(r.ordem, tres, dono3);
  if (MODO === '--envenenado-le-todos-antes') {
    conf('VENENO visto: os arquivos foram lidos fora de ordem, antes de o primeiro ser gravado (' + ord.lidosAntes + ' lidos antes da 1ª gravação)',
      !ord.naoDecrescente || ord.lidosAntes > 1, true);
  } else {
    conf('o resumo diz: 3 entraram', r.titulo, 'Importação terminada: 3 entraram.');
    conf('três linhas, todas "entrou"', r.linhas.map(l => l.estado).join(','), 'entrou,entrou,entrou');
    conf('na ordem em que ela escolheu', r.linhas.map(l => l.arquivo).join(','), tres.map(base).join(','));
    conf('o nome do pacote vem do manifest', r.linhas.map((l, k) => l.texto.indexOf([TITULO.m2, TITULO.enem, TITULO.banco][k]) >= 0).join(','), 'true,true,true');
    conf('4 pacotes no tablet (o de antes e os 3)', (await lerPacotes(pag)).length, 4);
      const prog = r.progresso.map(x => x.split('|')[0]);
    conf('o progresso geral passou por 1/3, 2/3 e 3/3', ['1/3', '2/3', '3/3'].every(x => prog.indexOf(x) >= 0), true);
    conf('"Importando 2 de 3: <nome do pacote>" apareceu', r.progresso.indexOf('2/3|Importando 2 de 3: ' + TITULO.enem) >= 0, true);
    conf('um pacote por vez: nenhum arquivo é tocado depois de o seguinte', ord.naoDecrescente, true);
    conf('e só um arquivo foi lido antes da primeira gravação', ord.lidosAntes, 1);
    conf('três gravações, uma por pacote', ord.gravacoes, 3);
    conf('a série pede a tela ligada e solta no fim', r.wake.join(','), 'pede:screen,solta');
    conf('o botão volta livre', r.botaoLivre, true);
    conf('o resumo fecha', await pag.evaluate(() => { document.querySelector('#fechar-resumo-importacao').click(); return document.querySelector('#estado-importacao-biblioteca').children.length; }), 0);
  }
  if (MODO === '--envenenado-le-todos-antes') return;

  // ================================================================
  secao('4. A mesma versão de novo: pulada, sem gravar');
  const antes = await lerPacotes(pag);
  const todos = [um, tres[0], tres[1], tres[2]];
  r = await importar(pag, todos, 'a mesma versão de novo');
  const depois = await lerPacotes(pag);
  const ord4 = medirOrdem(r.ordem, todos, Object.assign({ [IDS.m1]: 0 }, { [IDS.m2]: 1, [IDS.enem]: 2, [IDS.banco]: 3 }));
  if (MODO === '--envenenado-reimporta-igual') {
    conf('VENENO visto: a mesma versão foi gravada de novo (' + ord4.gravacoes + ' gravações)', ord4.gravacoes > 0, true);
    return;
  }
  conf('o resumo diz: 4 ficaram como estavam', r.titulo, 'Importação terminada: 4 ficaram como estavam.');
  conf('todas "pulou", com "já estava no tablet"', r.linhas.map(l => l.estado + ':' + /já estava no tablet/.test(l.texto)).join(','), 'pulou:true,pulou:true,pulou:true,pulou:true');
  conf('nenhuma gravação', ord4.gravacoes, 0);
  conf('e nenhum arquivo foi lido inteiro (pulou pelo manifest, só pela espiada)', r.ordem.filter(e => e.indexOf('le:arrayBuffer') === 0).length, 0);
  conf('o banco ficou idêntico (versão e hora de gravação)', JSON.stringify(depois), JSON.stringify(antes));

  // ================================================================
  secao('5. Um pacote cortado no começo da seleção: os outros entram, e o resumo diz por quê');
  await pag.evaluate(ids => Promise.all(ids.map(i => Store.removerPacoteBiblioteca(i))), [IDS.enem, IDS.banco]);
  const quebrado = cortado('enem-cortado', 'enem');
  const bancoOk = tres[2];
  const cinco = [quebrado, um, bancoOk];
  r = await importar(pag, cinco, 'série com um pacote cortado');
  const ids5 = (await lerPacotes(pag)).map(p => p.pacote);
  if (MODO === '--envenenado-para-na-falha') {
    conf('VENENO visto: o primeiro erro parou a série, e o último pacote não entrou', ids5.indexOf(IDS.banco) < 0, true);
    return;
  }
  conf('o resumo diz: 1 entrou, 1 ficou como estava, 1 não entrou', r.titulo, 'Importação terminada: 1 entrou, 1 ficou como estava, 1 não entrou.');
  conf('as linhas, na ordem: não entrou, ficou, entrou', r.linhas.map(l => l.estado).join(','), 'falhou,pulou,entrou');
  conf('a que falhou é o arquivo cortado', r.linhas[0].arquivo, base(quebrado));
  conf('com o motivo em português (download incompleto)', /Baixe de novo do Drive/.test(r.linhas[0].texto), true);
  conf('sem inglês nem jargão na linha', /undefined|Error|Exception|\[object/.test(r.linhas[0].texto), false);
  conf('a frase "o que já estava continua igual"', /O que já estava no tablet continua igual\./.test(r.texto), true);
  conf('o pacote de depois entrou mesmo assim', ids5.indexOf(IDS.banco) >= 0, true);
  conf('o cortado não entrou', ids5.indexOf(IDS.enem) < 0, true);
  conf('o botão volta livre', r.botaoLivre, true);

  // ================================================================
  secao('6. A versão 2 substitui a 1: na mesma seleção, nas duas ordens, e em seleções seguidas');
  await pag.evaluate(ids => Promise.all(ids.map(i => Store.removerPacoteBiblioteca(i))), [IDS.m1, IDS.m2]);
  const m1v1 = pacote('m1-v1b', 'm1', 1), m1v2 = pacote('m1-v2', 'm1', 2);
  r = await importar(pag, [m1v1, m1v2], 'v1 e v2 na mesma seleção');
  conf('v1 e v2 na ordem: as duas entram', r.linhas.map(l => l.estado).join(','), 'entrou,entrou');
  conf('fica a versão 2', JSON.stringify((await lerPacotes(pag)).filter(p => p.pacote === IDS.m1).map(p => p.versao)), '[2]');
  conf('e os exercícios dele são todos da versão 2', await versaoDosItens(pag, IDS.m1), '[2]');
  const m2v1 = pacote('m2-v1b', 'm2', 1), m2v2 = pacote('m2-v2', 'm2', 2);
  r = await importar(pag, [m2v2, m2v1], 'v2 e v1 na mesma seleção');
  conf('v2 e v1 (ordem trocada): a v2 entra e a v1 fica como estava', r.linhas.map(l => l.estado).join(','), 'entrou,pulou');
  conf('a linha diz que o tablet tem uma versão mais nova', /versão 2, e o arquivo é a 1/.test(r.linhas[1].texto), true);
  conf('fica a versão 2', JSON.stringify((await lerPacotes(pag)).filter(p => p.pacote === IDS.m2).map(p => p.versao)), '[2]');
  // seleções seguidas
  await pag.evaluate(ids => Store.removerPacoteBiblioteca(ids), IDS.banco);
  const bv1 = pacote('banco-v1b', 'banco', 1), bv2 = pacote('banco-v2', 'banco', 2);
  r = await importar(pag, [bv1], 'banco v1 sozinho');
  r = await importar(pag, [bv2], 'banco v2 sozinho');
  conf('v1 e depois v2, em seleções seguidas: a v2 substitui', JSON.stringify((await lerPacotes(pag)).filter(p => p.pacote === IDS.banco).map(p => p.versao)), '[2]');
  r = await importar(pag, [bv1], 'banco v1 depois da v2');
  conf('um arquivo só, mais velho: a frase de sempre', r.texto, 'O tablet já tem a versão 2 deste pacote, mais nova que a do arquivo (versão 1). Nada foi mudado.');

  // ================================================================
  secao('7. Pacote de livros no meio da série, e sozinho');
  await pag.evaluate(id => Store.removerPacoteBiblioteca(id), IDS.m1);
  const livrosV1 = pacoteDeLivros('livros-v1', ['livro-a', 'livro-b'], 1);
  r = await importar(pag, [livrosV1, m1v1], 'livros e exercícios na mesma série');
  conf('série mista: livros e exercícios entram', r.linhas.map(l => l.estado).join(','), 'entrou,entrou');
  conf('o resumo diz: 2 entraram', r.titulo, 'Importação terminada: 2 entraram.');
  conf('os dois livros estão no depósito dos livros', await H.contarDeposito(pag, 'livros'), 2);
  conf('o pacote de exercícios entrou junto', (await lerPacotes(pag)).some(p => p.pacote === IDS.m1), true);
  conf('o livro aparece na lista de Ajustes (a tela dos livros foi refeita)', await pag.evaluate(() => document.querySelectorAll('#lista-livros-biblioteca [data-livro]').length), 2);
  r = await importar(pag, [livrosV1, m1v1], 'os mesmos livros e exercícios de novo');
  conf('de novo: os dois ficam como estavam', r.linhas.map(l => l.estado + ':' + /já estava no tablet/.test(l.texto)).join(','), 'pulou:true,pulou:true');
  // a versão 2 do pacote de livros TIRA um livro: é gravação (o livro sai do tablet), e o resumo não diz "já estava"
  const livrosV2 = pacoteDeLivros('livros-v2', ['livro-b'], 2);
  r = await importar(pag, [livrosV2, m1v1], 'a versão 2 dos livros, sem um deles, na série');
  conf('o pacote que só TIROU um livro conta como "entrou"', r.linhas.map(l => l.estado).join(','), 'entrou,pulou');
  conf('o livro que saiu do pacote saiu do tablet', await H.contarDeposito(pag, 'livros'), 1);
  const livrosV3 = pacoteDeLivros('livros-v3', ['livro-b'], 3);
  r = await importar(pag, [livrosV3], 'a versão 3 dos livros, sozinha');
  conf('um arquivo só de livros: a frase de sempre, sem resumo', /^Livros importados\./.test(r.texto) && !r.temResumo, true);
  await pag.evaluate(id => Store.removerPacoteBiblioteca(id), IDS.m1);
  r = await importar(pag, [livrosV3, m1v1], 'os mesmos livros no meio da série');
  conf('o mesmo livro de novo fica como estava, e o de exercícios entra', r.linhas.map(l => l.estado).join(','), 'pulou,entrou');

  // ================================================================
  secao('8. Falha NO MEIO (hash errado, id repetido entre dois da mesma seleção, sem espaço) e livros em ordem trocada');
  const defeito = path.join(TMP, 'nono-hash.zip');
  Sintetico.gerar(defeito, { veneno: 'hash', pacote: 'nono-defeito' });
  const nonoA = path.join(TMP, 'nono-a.zip'), nonoB = path.join(TMP, 'nono-b.zip');
  Sintetico.gerar(nonoA, { pacote: 'nono-a' });
  Sintetico.gerar(nonoB, { pacote: 'nono-b' });
  const enemNovo = pacote('enem-v1c', 'enem', 1);
  r = await importar(pag, [defeito, nonoA, nonoB, enemNovo], 'hash errado, id repetido e um bom no fim');
  conf('os quatro estados, na ordem: falhou, entrou, falhou, entrou', r.linhas.map(l => l.estado).join(','), 'falhou,entrou,falhou,entrou');
  conf('o resumo diz: 2 entraram, 2 não entraram', r.titulo, 'Importação terminada: 2 entraram, 2 não entraram.');
  conf('o hash errado diz que não confere com o manifest', /não confere com o manifest/.test(r.linhas[0].texto), true);
  conf('o id repetido diz de que pacote veio', /Repete conteúdo que já veio do pacote nono-a/.test(r.linhas[2].texto), true);
  conf('o pacote de depois dos dois erros entrou', (await lerPacotes(pag)).some(p => p.pacote === IDS.enem), true);
  conf('o pacote de hash errado não ficou no banco', (await lerPacotes(pag)).some(p => p.pacote === 'nono-defeito'), false);
  // sem espaço no primeiro: o seguinte confere o espaço de novo e entra
  await pag.evaluate(ids => Promise.all(ids.map(i => Store.removerPacoteBiblioteca(i))), [IDS.m2, IDS.enem]);
  await pag.evaluate(() => { window.__semEspaco = 1; });
  r = await importar(pag, [m2v1, enemNovo], 'sem espaço no primeiro');
  conf('sem espaço no primeiro: falhou, e o seguinte entrou', r.linhas.map(l => l.estado).join(','), 'falhou,entrou');
  conf('a linha diz que o tablet não tem espaço', /O tablet não tem espaço/.test(r.linhas[0].texto), true);
  conf('o que falhou não gravou nada', (await lerPacotes(pag)).some(p => p.pacote === IDS.m2), false);
  // livros: a v2 (que tirou um livro) e depois a v1, na mesma seleção, terminam igual à ordem certa
  await pag.evaluate(() => Store.removerLivro('livro-b'));
  r = await importar(pag, [livrosV2, livrosV1], 'livros v2 e depois v1');
  conf('livros v2 e v1 (ordem trocada): a v2 entra e a v1 fica como estava', r.linhas.map(l => l.estado).join(','), 'entrou,pulou');
  conf('o livro que a v2 tirou NÃO volta', await H.contarDeposito(pag, 'livros'), 1);

  if (pag.errosDePagina.length) console.log('   erros de página: ' + pag.errosDePagina.join(' | ').slice(0, 400));
  conf('nenhum erro de JavaScript na página', pag.errosDePagina.length, 0);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
