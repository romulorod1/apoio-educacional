/* testa_biblioteca_importar.js
 *
 * Importar biblioteca, em Ajustes, no Chrome de verdade, com o pacote
 * SINTÉTICO (_pacote_sintetico.js). O pacote real do Drive nunca entra aqui.
 *
 * O que prova, na ordem em que ela viveria:
 *   0. o banco que ela já tem (versão 1, com aluno, folha e imagem) sobe para
 *      a versão 2 sem perder nada, e ganha os seis depósitos da biblioteca;
 *   1. Ajustes mostra o cartão Biblioteca vazio e o botão Importar;
 *   2. o pacote limpo entra: resumo com contagens e MB, 60 exercícios, 7 aulas,
 *      143 imagens; o espaço foi consultado e o armazenamento pedido como
 *      persistente ANTES de gravar;
 *   3. o mesmo pacote de novo: aviso, nada muda;
 *   4. a versão 2 substitui a 1 inteira, e as miniaturas da 1 somem;
 *   5. a versão 1 depois da 2: aviso, nada muda;
 *   6. cada veneno (hash errado, arquivo corrompido deflate e stored, arquivo
 *      sobrando, faltando, asset citado que não existe, esquema 2) é recusado
 *      com mensagem na tela, e o tablet continua com a versão 2 intacta;
 *   7. navegador sem DecompressionStream: a mensagem de atualizar o Chrome;
 *   8. cópia de segurança: leva uso e etiquetas, não leva pacote, exercício,
 *      imagem do pacote nem miniatura; restaurar pela tela devolve o uso.
 *
 * Modo envenenado, no mesmo arquivo:
 *   node _teste/testa_biblioteca_importar.js --envenenado-hash
 *     o servidor entrega um biblioteca.js que NÃO compara o hash. O pacote
 *     com hash errado passa a entrar, e o teste tem de ENXERGAR isso: a
 *     conferência que ele existe para segurar é exatamente essa.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const VENENO_HASH = process.argv.indexOf('--envenenado-hash') !== -1;
const PORTA = 8791;

const BIB_REPO = fs.readFileSync(path.join(H.RAIZ, 'biblioteca.js'), 'utf8');
const LINHA_HASH = "if (h !== m[1]) throw Recusa('O arquivo ' + nome + ' do pacote não confere com o manifest.', 'defeito');";
const trocas = {};
if (VENENO_HASH) trocas['/biblioteca.js'] = BIB_REPO.split(LINHA_HASH).join('void h;');

const amb = H.criarAmbiente(PORTA, 'perfil_bib_importar', trocas);
amb.extras['/vazio.html'] = { tipo: 'text/html; charset=utf-8', corpo: '<!doctype html><title>vazio</title>' };

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'bib_importar_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });
function zip(nome, opcoes) {
  const p = path.join(TMP, nome + '.zip');
  Sintetico.gerar(p, opcoes);
  return p;
}

const lerEstado = pag => pag.evaluate(() => {
  const c = document.querySelector('#estado-importacao-biblioteca');
  return c ? c.innerText.trim() : null;
});
const lerLista = pag => pag.evaluate(() => {
  const c = document.querySelector('#lista-pacotes-biblioteca');
  return c ? c.innerText.trim() : null;
});

async function importar(pag, arquivo, rotulo) {
  await pag.evaluate(() => {
    document.querySelector('#estado-importacao-biblioteca').innerHTML = '';
    // com a chave desligada o cartão nasce escondido; a importação é a mesma
    document.querySelector('#cartao-biblioteca').hidden = false;
  });
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar(rotulo, () => Promise.all([lerEstado(pag), pag.$eval('#importar-biblioteca', b => b.disabled)]),
    v => !!v && !!v[0] && !/Conferindo|Gravando/.test(v[0]) && v[1] === false, 60000);
  return (r.valor && r.valor[0]) || '';
}

const lerPacote = pag => pag.evaluate(() => Store.listarPacotesBiblioteca().then(l => l.map(p => ({ pacote: p.pacote, versao: p.versao }))));
const versoesDeposito = (pag, nome) => pag.evaluate(n => new Promise(r => {
  const q = indexedDB.open('apoio-educacional');
  q.onsuccess = () => {
    const g = q.result.transaction(n, 'readonly').objectStore(n).getAll();
    g.onsuccess = () => { const v = {}; g.result.forEach(x => { v[x.versao] = (v[x.versao] || 0) + 1; }); q.result.close(); r(v); };
  };
}), nome);

(async () => {
  console.log(VENENO_HASH
    ? 'MODO ENVENENADO (hash): o biblioteca.js servido não confere o hash; o teste tem que enxergar o pacote errado entrando.'
    : 'MODO NORMAL: importar, substituir, recusar venenos e levar uso e etiquetas na cópia.');

  secao('0. O veneno é de verdade, e o servidor é este');
  if (VENENO_HASH) {
    conf('o biblioteca.js servido ficou DIFERENTE do repositório', trocas['/biblioteca.js'] !== BIB_REPO ? 'diferente' : 'IGUAL', 'diferente');
    conf('e o veneno trocou exatamente uma ocorrência', BIB_REPO.split(LINHA_HASH).length - 1, 1);
    if (trocas['/biblioteca.js'] === BIB_REPO) throw Object.assign(new Error('veneno não aplicado'), { jaContado: true });
  }
  await amb.subir();
  const pag = await amb.pagina();
  await pag.evaluateOnNewDocument(() => {
    window.__persistir = 0; window.__estimar = 0; window.__ordem = [];
    if (navigator.storage) {
      const p = navigator.storage.persist && navigator.storage.persist.bind(navigator.storage);
      const e = navigator.storage.estimate && navigator.storage.estimate.bind(navigator.storage);
      if (p) navigator.storage.persist = function () { window.__persistir++; window.__ordem.push('persistir'); return p(); };
      if (e) navigator.storage.estimate = function () { window.__estimar++; window.__ordem.push('estimar'); return e(); };
    }
  });

  // ================================================================
  secao('1. O banco que ela já tem sobe para a versão 2 sem perder nada');
  await pag.goto(amb.ORIGEM + '/vazio.html', { waitUntil: 'load' });
  const semeou = await pag.evaluate(() => new Promise((resolve, reject) => {
    const q = indexedDB.open('apoio-educacional', 1);
    q.onupgradeneeded = () => {
      const b = q.result;
      ['dados', 'notas', 'midias', 'anexos'].forEach(n => b.createObjectStore(n));
      b.createObjectStore('historico', { keyPath: 'id', autoIncrement: true });
    };
    q.onsuccess = () => {
      const b = q.result;
      const t = b.transaction(['dados', 'notas', 'midias'], 'readwrite');
      t.objectStore('dados').put({ versao: 1, alunos: [{ id: 'al1', nome: 'Aluna da Migração', responsavel: '', cor: '#2F7DA3',
        ativo: true, obs: '', precos: [] }], series: [], aulas: [{ id: 'au1', alunoId: 'al1', serieId: null, destacada: false,
        data: '2026-09-15', hora: '10:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '',
        temNota: true, anexos: [] }], resumos: [], ajustes: {} }, 'principal');
      t.objectStore('notas').put({ paginas: [{ fundo: 'pautado', itens: [{ t: 'imagem', ref: 'm1', x: 1, y: 1, w: 10, h: 10 }] }] }, 'au1');
      t.objectStore('midias').put({ dataUrl: 'data:image/jpeg;base64,AAAA', w: 10, h: 10 }, 'm1');
      t.oncomplete = () => { b.close(); resolve(b.version); };
      t.onerror = () => reject(t.error);
    };
  }));
  conf('o banco semeado está na versão 1', semeou, 1);
  await H.abrirApp(pag, amb.ORIGEM);
  const depois = await pag.evaluate(() => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => {
      const b = q.result;
      const nomes = Array.from(b.objectStoreNames).sort();
      const t = b.transaction(['dados', 'notas', 'midias'], 'readonly');
      const d = t.objectStore('dados').get('principal');
      const n = t.objectStore('notas').get('au1');
      const m = t.objectStore('midias').get('m1');
      t.oncomplete = () => { const v = b.version; b.close(); r({ v, nomes, aluno: d.result && d.result.alunos[0].nome,
        aulas: d.result && d.result.aulas.length, nota: !!n.result, midia: !!m.result }); };
    };
  }));
  conf('o banco agora está na versão 2', depois.v, 2);
  conf('com os onze depósitos', depois.nomes.join(','),
    'anexos,biblioteca_assets,biblioteca_etiquetas,biblioteca_itens,biblioteca_pacotes,biblioteca_teoria,biblioteca_uso,dados,historico,midias,notas');
  conf('a aluna continua lá', depois.aluno, 'Aluna da Migração');
  conf('a aula continua lá', depois.aulas, 1);
  conf('a folha continua lá', depois.nota, true);
  conf('a imagem da folha continua lá', depois.midia, true);
  const naTela = await pag.evaluate(() => { const a = Array.from(document.querySelectorAll('#abas .aba')).find(x => x.dataset.tela === 'alunos'); a.click(); return document.body.innerText.indexOf('Aluna da Migração') >= 0; });
  conf('e o aplicativo mostra a aluna', naTela, true);

  // ================================================================
  secao('1b. Outra janela na versão antiga segura o banco: aviso, e depois abre');
  {
    const ctx = await pag.browser().createBrowserContext();
    const velhaJanela = await ctx.newPage();
    await velhaJanela.goto(amb.ORIGEM + '/vazio.html', { waitUntil: 'load' });
    // a janela antiga abre o banco na versão 1 e NÃO larga (o código 1.19.1 não tem onversionchange)
    await velhaJanela.evaluate(() => new Promise(r => {
      const q = indexedDB.open('apoio-educacional', 1);
      q.onupgradeneeded = () => { q.result.createObjectStore('dados'); };
      q.onsuccess = () => { window.__con = q.result; r(); };
    }));
    const nova = await ctx.newPage();
    nova.on('dialog', async d => { try { await d.accept(); } catch (e) { /* ok */ } });
    await nova.goto(amb.ORIGEM + '/index.html', { waitUntil: 'domcontentloaded' });
    const aviso = await esperar('aviso de banco bloqueado', () => nova.evaluate(() => {
      const f = document.querySelector('#aviso-banco-bloqueado');
      return f ? f.textContent : null;
    }), v => !!v, 15000);
    conf('a janela nova avisa que outra janela antiga está aberta', aviso.valor,
      'O aplicativo está aberto em outra janela com a versão anterior. Feche as outras janelas do aplicativo; esta abre sozinha em seguida. Nada foi perdido.');
    await velhaJanela.evaluate(() => window.__con.close());
    const abriu = await esperar('o aplicativo abre depois que a antiga larga o banco', () => nova.evaluate(() =>
      !!document.querySelector('#abas .aba') && document.querySelector('#versao-app').textContent.length > 1), v => v === true, 20000);
    conf('e o aplicativo abre sozinho quando a janela antiga fecha', abriu.ok, true);
    conf('e o aviso some quando o banco é liberado', await nova.evaluate(() => !!document.querySelector('#aviso-banco-bloqueado')), false);
    await ctx.close();
  }

  // ================================================================
  secao('2. Ajustes: o cartão Biblioteca, vazio');
  await H.irParaAba(pag, 'ajustes');
  /* Com a chave BIBLIOTECA_NO_AR desligada, o cartão existe e não aparece,
   * porque ainda não há aba para abrir o que for importado. O teste confere o
   * estado da chave e depois mostra o cartão à mão para exercitar a importação. */
  const escondido = await pag.evaluate(() => [document.querySelector('#cartao-biblioteca').hidden,
    document.querySelector('#titulo-cartao-biblioteca').hidden, !!document.querySelector('#importar-biblioteca').offsetParent].join(','));
  const NO_AR = /var BIBLIOTECA_NO_AR = true;/.test(fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8'));
  conf('com a chave ' + (NO_AR ? 'ligada o cartão aparece' : 'desligada o cartão não aparece'), escondido,
    NO_AR ? 'false,false,true' : 'true,true,false');
  await pag.evaluate(() => {
    document.querySelector('#cartao-biblioteca').hidden = false;
    document.querySelector('#titulo-cartao-biblioteca').hidden = false;
  });
  const cartao = await pag.evaluate(() => {
    const b = document.querySelector('#importar-biblioteca');
    const i = document.querySelector('#arquivo-biblioteca');
    const titulos = Array.from(document.querySelectorAll('#tela-ajustes h3')).map(h => h.textContent.trim());
    return { botao: b && b.textContent.trim(), visivel: !!(b && b.offsetParent), aceita: i && i.getAttribute('accept'),
      titulo: titulos.indexOf('Biblioteca') >= 0, lista: document.querySelector('#lista-pacotes-biblioteca').innerText.trim() };
  });
  conf('botão "Importar biblioteca" visível', cartao.botao + ' / ' + cartao.visivel, 'Importar biblioteca / true');
  conf('o seletor aceita .zip', /\.zip/.test(cartao.aceita), true);
  conf('título Biblioteca em Ajustes', cartao.titulo, true);
  conf('nenhum pacote listado', cartao.lista, '');

  // ================================================================
  secao('3. O pacote limpo entra');
  await pag.evaluate(() => { window.__ordem = []; });
  let msg = await importar(pag, zip('limpo-v1'), 'importação do pacote limpo');
  console.log('   tela: ' + msg.replace(/\n/g, ' | '));
  conf('a tela diz que importou', /^Biblioteca importada\./.test(msg), true);
  conf('com a matéria, a série e a fonte', msg.indexOf('Matemática, 9º ano, Pacote sintético de teste') >= 0, true);
  conf('com as contagens', msg.indexOf('3 módulos; 7 aulas de teoria (23 páginas); 60 exercícios, 60 com solução') >= 0, true);
  conf('com a versão e os MB', /Versão 1, [0-9]+(,[0-9])? MB no tablet/.test(msg), true);
  conf('pacotes gravados', await H.contarDeposito(pag, 'biblioteca_pacotes'), 1);
  conf('exercícios gravados', await H.contarDeposito(pag, 'biblioteca_itens'), 60);
  conf('aulas de teoria gravadas', await H.contarDeposito(pag, 'biblioteca_teoria'), 7);
  conf('imagens gravadas (120 recortes + 23 páginas)', await H.contarDeposito(pag, 'biblioteca_assets'), 143);
  const ordem = await pag.evaluate(() => window.__ordem.join(','));
  conf('o espaço foi consultado e o armazenamento pedido persistente, nesta ordem', ordem, 'estimar,persistir');
  const umAsset = await pag.evaluate(() => Store.lerAssetBiblioteca('matematica-sintetico-9ano',
    'assets/9ano/equacoes-do-segundo-grau/soma-e-produto/ex-02.svg').then(b => b ? b.type + ' ' + (b.size > 100) : null));
  conf('um SVG lido de volta como Blob', umAsset, 'image/svg+xml true');
  const umItem = await pag.evaluate(() => Store.itensDaBiblioteca().then(l => l.find(i => i.id === '9ano:equacoes-do-segundo-grau:soma-e-produto:ex:3')));
  conf('um exercício lido de volta, com resposta e pacote', umItem && (umItem.resposta + ' ' + umItem.pacote + ' ' + umItem.versao),
    'C matematica-sintetico-9ano 1');
  let lista = await lerLista(pag);
  conf('o pacote aparece na lista de Ajustes', lista.indexOf('Matemática, 9º ano, Pacote sintético de teste') >= 0, true);

  // ================================================================
  secao('4. O mesmo pacote de novo: nada muda');
  msg = await importar(pag, zip('limpo-v1-de-novo'), 'reimportação da mesma versão');
  conf('aviso de versão igual', msg, 'Esta versão do pacote já está no tablet. Nada foi mudado.');
  conf('continuam 60 exercícios', await H.contarDeposito(pag, 'biblioteca_itens'), 60);

  // ================================================================
  secao('5. A versão 2 substitui a 1');
  await pag.evaluate(() => Store.salvarMidia(Store.chaveMiniatura('matematica-sintetico-9ano', 1, 'assets/x.svg'), { dataUrl: 'data:,', w: 1, h: 1 }));
  msg = await importar(pag, zip('limpo-v2', { versao: 2 }), 'importação da versão 2');
  conf('importou a versão 2', /^Biblioteca importada\.[\s\S]*Versão 2,/.test(msg), true);
  conf('um pacote só', JSON.stringify(await lerPacote(pag)), JSON.stringify([{ pacote: 'matematica-sintetico-9ano', versao: 2 }]));
  conf('exercícios: todos da versão 2', JSON.stringify(await versoesDeposito(pag, 'biblioteca_itens')), '{"2":60}');
  conf('teoria: toda da versão 2', JSON.stringify(await versoesDeposito(pag, 'biblioteca_teoria')), '{"2":7}');
  conf('imagens: todas da versão 2', JSON.stringify(await versoesDeposito(pag, 'biblioteca_assets')), '{"2":143}');
  const miniVelha = await pag.evaluate(() => Store.lerMidia(Store.chaveMiniatura('matematica-sintetico-9ano', 1, 'assets/x.svg')));
  conf('a miniatura da versão 1 sumiu', miniVelha === undefined || miniVelha === null, true);
  conf('a imagem da folha dela continua', !!(await pag.evaluate(() => Store.lerMidia('m1'))), true);

  // ================================================================
  secao('6. A versão 1 depois da 2: nada muda');
  msg = await importar(pag, zip('limpo-v1-velho'), 'importação da versão mais velha');
  conf('aviso de versão menor', msg, 'O tablet já tem a versão 2 deste pacote, mais nova que a do arquivo (versão 1). Nada foi mudado.');
  conf('continua a versão 2', JSON.stringify(await lerPacote(pag)), JSON.stringify([{ pacote: 'matematica-sintetico-9ano', versao: 2 }]));

  // ================================================================
  secao('7. Venenos: recusados, com mensagem na tela, e nada muda');
  const NAO = 'O pacote não foi importado.';
  const IGUAL = 'O que já estava no tablet continua igual.';
  const BAIXE = 'O pacote chegou estragado ou incompleto. Baixe de novo do Drive e tente outra vez.';
  const DEFEITO = 'Este pacote veio com defeito e não pode ser usado. Avise quem mandou o pacote; enquanto isso, continue usando o que já está no tablet.';
  const ATUALIZE = 'Este pacote é de uma versão mais nova do aplicativo. Atualize o aplicativo (Ajustes, Procurar atualização) e tente de novo.';
  const tela = (orientacao, detalhe) => [NAO, orientacao, IGUAL].concat(detalhe ? ['Detalhe: ' + detalhe] : []).join('\n');
  const esperado = {
    'corrompido-deflate': tela(BAIXE, 'O arquivo assets/9ano/equacoes-do-segundo-grau/soma-e-produto/ex-02.svg do pacote está corrompido.'),
    'corrompido-stored': tela(BAIXE, 'O arquivo assets/9ano/equacoes-do-segundo-grau/soma-e-produto-das-raizes/teo-p02.svg do pacote está corrompido.'),
    'hash': tela(DEFEITO, 'O arquivo assets/9ano/equacoes-do-segundo-grau/soma-e-produto/ex-02.svg do pacote não confere com o manifest.'),
    'sobrando': tela(DEFEITO, 'O pacote tem arquivo fora da lista do manifest: assets/9ano/intruso.svg.'),
    'faltando': tela(DEFEITO, 'O pacote está incompleto: falta assets/9ano/nao-existe/ex-01.svg.'),
    'asset-fora': tela(DEFEITO, 'O pacote cita uma imagem fora da pasta assets: figs/fora.svg.'),
    'asset-citado': tela(DEFEITO, '9ano:equacoes-do-segundo-grau:equacao-do-2o-grau-resultados-basicos:ex:4 cita ' +
      'assets/9ano/equacoes-do-segundo-grau/equacao-do-2o-grau-resultados-basicos/ex-04-sumiu.svg, que não está no pacote.'),
    'esquema': tela(ATUALIZE, 'O pacote é do esquema 2 e este aplicativo lê o esquema 1.')
  };
  for (const v of Sintetico.VENENOS) {
    // versão 3, para a recusa não poder vir do aviso de versão
    msg = await importar(pag, zip('veneno-' + v, { veneno: v, versao: 3 }), 'veneno ' + v);
    if (VENENO_HASH && v === 'hash') {
      conf('envenenado-hash: o pacote com hash errado ENTROU (defeito detectado)', /^Biblioteca importada\./.test(msg), true);
      // o resto da rodada parte de um tablet já estragado: acaba aqui
      return;
    }
    conf('veneno ' + v + ': recusado com a mensagem certa', msg, esperado[v]);
    conf('veneno ' + v + ': o tablet continua na versão 2', JSON.stringify(await lerPacote(pag)),
      JSON.stringify([{ pacote: 'matematica-sintetico-9ano', versao: 2 }]));
  }
  if (!VENENO_HASH) {
    conf('depois dos venenos: 60 exercícios, 143 imagens, todos da versão 2',
      JSON.stringify(await versoesDeposito(pag, 'biblioteca_itens')) + JSON.stringify(await versoesDeposito(pag, 'biblioteca_assets')),
      '{"2":60}{"2":143}');
    msg = await importar(pag, path.join(H.RAIZ, 'manifest.webmanifest'), 'arquivo que não é zip');
    conf('arquivo que não é zip: recusado com mensagem', msg,
      tela('O arquivo escolhido não é um pacote da biblioteca. Escolha o arquivo .zip da biblioteca no Drive.'));
    const texto = await pag.evaluate(() => document.querySelector('#tela-ajustes').innerText.length);
    conf('e a tela de Ajustes continua inteira', texto > 500, true);
  }

  // ================================================================
  secao('7b. Pacote de outro nome com os mesmos exercícios: recusado');
  msg = await importar(pag, zip('outro-nome', { pacote: 'matematica-outro-9ano' }), 'pacote com ids alheios');
  conf('recusa por conteúdo que já veio de outro pacote', msg,
    tela(DEFEITO, 'Repete conteúdo que já veio do pacote matematica-sintetico-9ano.'));
  conf('e os exercícios continuam do pacote original', JSON.stringify(await lerPacote(pag)),
    JSON.stringify([{ pacote: 'matematica-sintetico-9ano', versao: 2 }]));

  // ================================================================
  secao('7c. Sem espaço no tablet: recusado antes de gravar');
  const apertada = await amb.pagina();
  await apertada.evaluateOnNewDocument(() => {
    navigator.storage.estimate = () => Promise.resolve({ quota: 50 * 1024 * 1024, usage: 50 * 1024 * 1024 - 1000 });
  });
  await H.abrirApp(apertada, amb.ORIGEM);
  await H.irParaAba(apertada, 'ajustes');
  msg = await importar(apertada, zip('apertado', { versao: 8 }), 'importação sem espaço');
  conf('mensagem de falta de espaço, com os MB', /^O pacote não foi importado\.\nO tablet não tem espaço para este pacote: ele precisa de .* MB e há menos de 0,1 MB livres\. Libere espaço no tablet \(apagando arquivos ou fotos que não usa\) e tente de novo\.\nO que já estava no tablet continua igual\.$/.test(msg), true);
  conf('e nada foi gravado', JSON.stringify(await lerPacote(apertada)), JSON.stringify([{ pacote: 'matematica-sintetico-9ano', versao: 2 }]));
  await apertada.close();

  // ================================================================
  secao('8. Navegador sem DecompressionStream');
  const velha = await amb.pagina();
  await velha.evaluateOnNewDocument(() => { try { delete window.DecompressionStream; } catch (e) { window.DecompressionStream = undefined; } });
  await H.abrirApp(velha, amb.ORIGEM);
  await H.irParaAba(velha, 'ajustes');
  conf('o navegador desta página não tem DecompressionStream', await velha.evaluate(() => typeof DecompressionStream), 'undefined');
  msg = await importar(velha, zip('limpo-v9', { versao: 9 }), 'importação sem DecompressionStream');
  conf('mensagem de atualizar o Chrome', msg,
    tela('Este navegador não consegue abrir o pacote da biblioteca. Atualize o Chrome e tente de novo.'));
  conf('e nada foi gravado', JSON.stringify(await lerPacote(velha)), JSON.stringify([{ pacote: 'matematica-sintetico-9ano', versao: 2 }]));
  await velha.close();

  // ================================================================
  secao('9. Cópia de segurança: uso e etiquetas vão, o pacote não');
  await pag.evaluate(() => Promise.all([
    Store.registrarUsoBiblioteca({ itemId: '9ano:equacoes-do-segundo-grau:soma-e-produto:ex:3', alunoId: 'al1', aulaId: 'au1', data: '2026-09-15' }),
    Store.gravarEtiquetaBiblioteca({ itemId: '9ano:equacoes-do-segundo-grau:soma-e-produto:ex:3', dificuldade: 3, data: '2026-09-15' }),
    Store.salvarMidia(Store.chaveMiniatura('matematica-sintetico-9ano', 2, 'assets/y.svg'), { dataUrl: 'data:,', w: 1, h: 1 })
  ]));
  const pacoteCopia = await pag.evaluate(() => Store.carregar().then(d => Store.exportarTudo(d)).then(p => JSON.stringify(p)));
  const obj = JSON.parse(pacoteCopia);
  conf('a cópia leva o uso', obj.biblioteca && obj.biblioteca.uso.length, 1);
  conf('a cópia leva as etiquetas', obj.biblioteca && obj.biblioteca.etiquetas.length, 1);
  conf('o uso vai com os quatro campos', obj.biblioteca && ['itemId', 'alunoId', 'aulaId', 'data'].every(k => obj.biblioteca.uso[0][k]), true);
  conf('a cópia não leva miniatura', Object.keys(obj.midias).filter(k => k.indexOf('bib:') === 0).length, 0);
  conf('a imagem da folha dela vai', Object.keys(obj.midias).indexOf('m1') >= 0, true);
  conf('a cópia não leva pacote, exercício nem imagem do pacote',
    ['biblioteca_pacotes', 'biblioteca_itens', 'biblioteca_assets', 'svg'].filter(k => pacoteCopia.indexOf(k) >= 0).join(','), '');
  conf('a cópia fica pequena (sem os SVG)', pacoteCopia.length < 20000, true);

  // restaurar pela tela, com o uso apagado antes
  const arquivoCopia = path.join(TMP, 'copia.json');
  fs.writeFileSync(arquivoCopia, pacoteCopia);
  await pag.evaluate(() => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => { const t = q.result.transaction(['biblioteca_uso', 'biblioteca_etiquetas'], 'readwrite');
      t.objectStore('biblioteca_uso').clear(); t.objectStore('biblioteca_etiquetas').clear();
      t.oncomplete = () => { q.result.close(); r(); }; };
  }));
  conf('uso apagado antes de restaurar', await H.contarDeposito(pag, 'biblioteca_uso'), 0);
  const entradaCopia = await pag.$('#arquivo-copia');
  await entradaCopia.uploadFile(arquivoCopia);
  const volta = await esperar('restauração pela tela', () => H.contarDeposito(pag, 'biblioteca_uso'), v => v === 1, 20000);
  conf('restaurar a cópia devolve o uso', volta.valor, 1);
  conf('e as etiquetas', await H.contarDeposito(pag, 'biblioteca_etiquetas'), 1);
  conf('e o pacote continua no tablet', await H.contarDeposito(pag, 'biblioteca_itens'), 60);

  // cópia antiga, sem o campo biblioteca: o uso do tablet fica como está
  const antiga = JSON.parse(pacoteCopia);
  delete antiga.biblioteca;
  fs.writeFileSync(arquivoCopia, JSON.stringify(antiga));
  await pag.evaluate(() => { document.querySelector('#aviso-texto').textContent = ''; });
  await entradaCopia.uploadFile(arquivoCopia);
  await esperar('restauração da cópia antiga', () => pag.evaluate(() => document.querySelector('#aviso-texto').textContent), v => v === 'Cópia restaurada.', 20000);
  conf('cópia antiga (sem biblioteca) não apaga o uso', await H.contarDeposito(pag, 'biblioteca_uso'), 1);

  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  conf('depois de recarregar: uso, etiquetas e pacote no lugar',
    [await H.contarDeposito(pag, 'biblioteca_uso'), await H.contarDeposito(pag, 'biblioteca_etiquetas'), await H.contarDeposito(pag, 'biblioteca_itens')].join(','), '1,1,60');

  if (pag.errosDePagina.length) console.log('   erros de página: ' + pag.errosDePagina.join(' | ').slice(0, 400));
  conf('nenhum erro de JavaScript na página', pag.errosDePagina.length, 0);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
