/* testa_biblioteca_navegar.js
 *
 * A aba Biblioteca no Chrome de verdade, com os pacotes SINTÉTICOS do 9º ano
 * e do Banco (nível 2, equivalente ao 8º e ao 9º ano). O pacote real do
 * Drive nunca entra aqui.
 *
 * O que prova:
 *   1. sem pacote, a aba se chama Biblioteca e mostra "Em construção", sem
 *      campo de busca; a aba Temas não existe mais na barra;
 *   2. com os dois pacotes: séries, módulos do Portal e do Banco separados,
 *      módulo com Teoria e Exercícios, aula de teoria com uma miniatura por
 *      página, lista com número, tipo e dificuldade;
 *   3. desempenho: a lista de 40 exercícios abre em menos de 2 segundos com
 *      as miniaturas visíveis desenhadas, e NÃO desenha as 40 de uma vez; ao
 *      rolar, as outras chegam; na segunda visita vêm do cache em 'midias';
 *   4. tela cheia: a imagem carrega, a solução alterna, a seta anda;
 *   5. busca "bhaskara": Módulos com Equações do Segundo Grau no topo, Teoria
 *      com as QUATRO aulas do módulo, Exercícios com as DUAS listas, Banco com
 *      o problema que fala de equação do segundo grau, nessa ordem;
 *   6. abrir como folha, numa aula nova de hoje: a folha abre com a página
 *      colada, um traço de caneta fica por cima, e depois de recarregar a nota
 *      gravada tem o item de imagem e o traço, e abre de novo pela agenda.
 *
 * Modo envenenado:
 *   node _teste/testa_biblioteca_navegar.js --envenenado-apelidos
 *     o app.js servido ignora os apelidos do pacote. "bhaskara" deixa de
 *     trazer as listas e as quatro teorias, e o teste tem de ENXERGAR isso.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const VENENO_APELIDOS = process.argv.indexOf('--envenenado-apelidos') !== -1;
const PORTA = 8792;

const APP_REPO = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const LINHA_APELIDOS = 'bib.apelidos[k].forEach(function (troca) { saida.push(norm.replace(nk, \' \' + troca + \' \').trim()); });';
const trocas = {};
if (VENENO_APELIDOS) trocas['/app.js'] = APP_REPO.split(LINHA_APELIDOS).join('void nk;');

const amb = H.criarAmbiente(PORTA, 'perfil_bib_navegar', trocas);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'bib_navegar_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

const hojeIso = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();

async function importar(pag, arquivo) {
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => { document.querySelector('#estado-importacao-biblioteca').innerHTML = ''; });
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar('importação de ' + path.basename(arquivo), () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca');
    return c ? c.innerText.trim() : '';
  }), v => /^Biblioteca importada\.|não foi importado/.test(v || ''), 60000);
  return r.valor || '';
}

const lerCorpo = pag => pag.evaluate(() => {
  const c = document.querySelector('#bib-corpo');
  const blocos = [];
  let atual = null;
  Array.from(c.children).forEach(n => {
    if (n.classList.contains('bloco-exercicios')) { atual = { titulo: n.textContent.trim(), linhas: [] }; blocos.push(atual); }
    else if (n.classList.contains('item-lista') && atual) atual.linhas.push(n.querySelector('.nome').textContent.trim());
  });
  return { texto: c.innerText, blocos };
});

async function tocarLinha(pag, nome) {
  const ok = await pag.evaluate(n => {
    const l = Array.from(document.querySelectorAll('#bib-corpo .item-lista')).find(x => x.querySelector('.nome').textContent.trim() === n);
    if (!l) return false;
    l.click();
    return true;
  }, nome);
  if (!ok) throw Object.assign(new Error('não achei a linha ' + nome), { jaContado: false });
  await pausa(100);
}

/* Pixels da cor do título da página sintética (#1F3A5F, azul do módulo) no
 * canvas do editor. Fundo branco não prova nada: a folha sem pauta já é branca;
 * a cor só aparece se a imagem colada estiver desenhada. */
const pixelsDaPagina = pag => pag.evaluate(() => {
  const c = document.querySelector('#tela-desenho');
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 4 * 7) {
    if (Math.abs(d[i] - 31) < 26 && Math.abs(d[i + 1] - 58) < 26 && Math.abs(d[i + 2] - 95) < 26) n++;
  }
  return n;
});
const rodapeDaFolha = pag => pag.evaluate(() => ({
  contador: (document.querySelector('#rodape-nota').innerText.match(/Folha \d+ de \d+/) || [''])[0],
  fundo: (document.querySelector('#rodape-nota select') || {}).value
}));
const chavesDeMiniatura = (pag, filtro) => pag.evaluate(f => new Promise(r => {
  const q = indexedDB.open('apoio-educacional');
  q.onsuccess = () => {
    const g = q.result.transaction('midias', 'readonly').objectStore('midias').getAllKeys();
    g.onsuccess = () => { q.result.close(); r(g.result.filter(k => new RegExp(f).test(String(k))).length); };
  };
}), filtro);

const estadoMinis = pag => pag.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll('#bib-corpo img.bib-mini'));
  return { total: imgs.length, prontas: imgs.filter(i => i.classList.contains('pronta') && i.naturalWidth > 0).length,
    falhas: imgs.filter(i => i.classList.contains('falhou')).length };
});
const minisVisiveisProntas = pag => pag.evaluate(() => {
  const cont = document.querySelector('.conteudo').getBoundingClientRect();
  const imgs = Array.from(document.querySelectorAll('#bib-corpo img.bib-mini')).filter(i => {
    const r = i.getBoundingClientRect();
    return r.bottom > cont.top && r.top < cont.bottom;
  });
  return { visiveis: imgs.length, prontas: imgs.filter(i => i.classList.contains('pronta') && i.naturalWidth > 0).length };
});

(async () => {
  console.log(VENENO_APELIDOS
    ? 'MODO ENVENENADO (apelidos): o app.js servido ignora os apelidos; "bhaskara" tem de perder as listas e o teste tem de enxergar.'
    : 'MODO NORMAL: aba vazia, navegação, desempenho, tela cheia, busca e abrir como folha.');
  secao('0. O veneno é de verdade, e o servidor é este');
  if (VENENO_APELIDOS) {
    conf('o app.js servido ficou DIFERENTE do repositório', trocas['/app.js'] !== APP_REPO ? 'diferente' : 'IGUAL', 'diferente');
    conf('e o veneno trocou exatamente uma ocorrência', APP_REPO.split(LINHA_APELIDOS).length - 1, 1);
    if (trocas['/app.js'] === APP_REPO) throw Object.assign(new Error('veneno não aplicado'), { jaContado: true });
  }
  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('1. Sem pacote: Biblioteca em construção');
  const abas = await pag.evaluate(() => Array.from(document.querySelectorAll('#abas .aba')).map(b => b.textContent.trim() + ':' + b.dataset.tela));
  conf('a barra tem a aba Biblioteca no lugar de Temas', abas.join(','), 'Agenda:agenda,Alunos:alunos,Fechamento:fechamento,Biblioteca:biblioteca,Ajustes:ajustes');
  await H.irParaAba(pag, 'biblioteca');
  const vazia = await esperar('aba vazia desenhada', () => pag.evaluate(() => {
    const v = document.querySelector('#biblioteca-em-construcao');
    return v ? { texto: Array.from(v.querySelectorAll('p')).map(p => p.textContent.trim()).join('\n'), busca: getComputedStyle(document.querySelector('#bib-busca-cartao')).display,
      titulo: document.querySelector('#tela-biblioteca h2').textContent.trim(), visivel: !!v.offsetParent } : null;
  }), v => !!v, 10000);
  conf('mostra "Em construção" e "Esta área está sendo preparada."', vazia.valor && vazia.valor.texto, 'Em construção\nEsta área está sendo preparada.');
  conf('visível', vazia.valor && vazia.valor.visivel, true);
  conf('sem o campo de busca', vazia.valor && vazia.valor.busca, 'none');
  conf('título Biblioteca', vazia.valor && vazia.valor.titulo, 'Biblioteca');

  // ================================================================
  secao('2. Com os pacotes do 9º ano e do Banco');
  const z9 = path.join(TMP, 'nono.zip'); Sintetico.gerar(z9);
  const zb = path.join(TMP, 'banco.zip'); Sintetico.gerarBanco(zb);
  conf('importou o 9º ano', /^Biblioteca importada\./.test(await importar(pag, z9)), true);
  conf('importou o Banco', /^Biblioteca importada\./.test(await importar(pag, zb)), true);
  await H.irParaAba(pag, 'biblioteca');
  await esperar('lista de módulos', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .item-lista').length), v => v > 0, 10000);
  let corpo = await lerCorpo(pag);
  const chips = await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-corpo .chip-filtro')).map(c => c.textContent + (c.classList.contains('ativo') ? '*' : '')));
  conf('séries: 8º (só Banco) e 9º, abrindo no 9º', chips.join(','), '8º ano,9º ano*');
  conf('contagem no alto', await pag.$eval('#bib-contagem', e => e.textContent), '7 aulas de teoria, 60 exercícios, 12 problemas do Banco');
  conf('campo de busca visível', await pag.$eval('#bib-busca-cartao', e => getComputedStyle(e).display !== 'none'), true);
  conf('blocos do 9º ano: Módulos e Banco de Questões', corpo.blocos.map(b => b.titulo).join(','), 'Módulos,Banco de Questões');
  conf('módulos do Portal, em ordem alfabética', corpo.blocos[0].linhas.join(' | '),
    'Equações do Segundo Grau | Produtos Notáveis e Fatoração | Teorema de Pitágoras');
  conf('módulos do Banco', corpo.blocos[1].linhas.join(' | '), 'Banco de Questões 2019 | Banco de Questões 2020');
  conf('detalhe do módulo com acento certo', corpo.texto.indexOf('4 aulas de teoria · 2 listas, 48 exercícios') >= 0, true);
  await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-corpo .chip-filtro')).find(c => c.textContent === '8º ano').click());
  await pausa(150);
  corpo = await lerCorpo(pag);
  conf('no 8º ano só aparece o Banco', corpo.blocos.map(b => b.titulo + ':' + b.linhas.length).join(','), 'Banco de Questões:2');
  await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-corpo .chip-filtro')).find(c => c.textContent === '9º ano').click());
  await pausa(150);

  await tocarLinha(pag, 'Equações do Segundo Grau');
  corpo = await lerCorpo(pag);
  conf('módulo: Teoria com as 4 aulas', corpo.blocos[0] && (corpo.blocos[0].titulo + ':' + corpo.blocos[0].linhas.join(' | ')),
    'Teoria:Resultados Básicos - Parte I | Resultados Básicos - Parte II | Soma e Produto das Raízes | Equações Biquadradas');
  conf('módulo: Exercícios com as 2 listas', corpo.blocos[1] && (corpo.blocos[1].titulo + ':' + corpo.blocos[1].linhas.join(' | ')),
    'Exercícios:Equações do Segundo Grau: Resultados Básicos | Soma e Produto');

  await tocarLinha(pag, 'Resultados Básicos - Parte I');
  const paginas = await esperar('miniaturas das páginas', () => estadoMinis(pag), v => v && v.total === 5 && v.prontas === 5, 15000);
  conf('aula de teoria: 5 páginas, 5 miniaturas desenhadas', paginas.valor && (paginas.valor.total + '/' + paginas.valor.prontas), '5/5');
  const rotulos = await pag.evaluate(() => Array.from(document.querySelectorAll('#bib-corpo .bib-rotulo')).map(e => e.textContent).join(','));
  conf('rótulos das páginas', rotulos, 'Capa,Página 2,Página 3,Página 4,Página 5');
  const cache = await pag.evaluate(() => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => { const g = q.result.transaction('midias', 'readonly').objectStore('midias').getAllKeys();
      g.onsuccess = () => { q.result.close(); r(g.result.filter(k => String(k).indexOf('bib:matematica-sintetico-9ano@1:') === 0).length); }; };
  }));
  conf('as 5 miniaturas ficaram guardadas em midias', cache, 5);

  // ================================================================
  secao('3. Lista de 40 exercícios: menos de 2 segundos, sem desenhar tudo');
  await pag.evaluate(() => document.querySelector('.bib-voltar').click());
  await pausa(100);
  const t0 = Date.now();
  await tocarLinha(pag, 'Equações do Segundo Grau: Resultados Básicos');
  const lista = await esperar('lista de 40 com as miniaturas visíveis', () => Promise.all([estadoMinis(pag), minisVisiveisProntas(pag)]),
    v => v && v[0].total === 40 && v[1].visiveis > 0 && v[1].prontas === v[1].visiveis, 10000);
  const ms = Date.now() - t0;
  console.log('   abrir a lista: ' + ms + ' ms; visíveis ' + (lista.valor && lista.valor[1].visiveis) + ', desenhadas ' + (lista.valor && lista.valor[0].prontas));
  conf('abriu com as miniaturas visíveis desenhadas', lista.ok, true);
  conf('em menos de 2 segundos', ms < 2000, true);
  conf('sem desenhar as 40 de uma vez', lista.valor && lista.valor[0].prontas < 40, true);
  const primeiro = await pag.evaluate(() => {
    const c = document.querySelector('#bib-corpo .bib-cartao');
    return (c => Array.from(c.children).map(e => e.classList.contains('bib-tags') ? Array.from(e.children).map(t => t.textContent).join(' | ') : e.textContent).filter(Boolean).join(' | '))(c);
  });
  conf('cartão: número de origem e dificuldade (aberta não leva etiqueta)', primeiro, 'Exercício 1 | Fácil');
  const quinto = await pag.evaluate(() => (c => Array.from(c.children).map(e => e.classList.contains('bib-tags') ? Array.from(e.children).map(t => t.textContent).join(' | ') : e.textContent).filter(Boolean).join(' | '))(document.querySelectorAll('#bib-corpo .bib-cartao')[4]));
  conf('origem citada em letra pequena', quinto, 'Exercício 5 | Fácil | Extraído da Olimpíada Sintética');
  await pag.evaluate(() => { const c = document.querySelector('.conteudo'); c.scrollTop = c.scrollHeight; });
  const todas = await esperar('ao rolar até o fim, as outras chegam', () => estadoMinis(pag), v => v && v.prontas === 40, 15000);
  conf('rolando, as 40 ficam desenhadas', todas.valor && todas.valor.prontas, 40);
  conf('nenhuma falhou', todas.valor && todas.valor.falhas, 0);
  // segunda visita: do cache
  await pag.evaluate(() => document.querySelector('.bib-voltar').click());
  await pausa(100);
  const chavesAntes = await chavesDeMiniatura(pag, '^bib:');
  // espião: na segunda visita nenhum SVG pode ser lido do pacote para desenhar
  await pag.evaluate(() => {
    window.__leiturasDeAsset = 0;
    const orig = Store.lerAssetBiblioteca;
    Store.lerAssetBiblioteca = function () { window.__leiturasDeAsset++; return orig.apply(this, arguments); };
  });
  const t1 = Date.now();
  await tocarLinha(pag, 'Equações do Segundo Grau: Resultados Básicos');
  await esperar('segunda visita', () => minisVisiveisProntas(pag), v => v && v.visiveis > 0 && v.prontas === v.visiveis, 10000);
  const ms2 = Date.now() - t1;
  console.log('   segunda visita: ' + ms2 + ' ms');
  conf('segunda visita também abaixo de 2 segundos', ms2 < 2000, true);
  await pausa(500);
  conf('e veio do cache: nenhuma miniatura nova gravada em midias', await chavesDeMiniatura(pag, '^bib:'), chavesAntes);
  conf('e nenhum SVG foi lido do pacote para redesenhar', await pag.evaluate(() => window.__leiturasDeAsset), 0);
  conf('as 40 miniaturas da lista estão no cache', await chavesDeMiniatura(pag, 'resultados-basicos/ex-\\d+\\.svg#520$'), 40);

  // ================================================================
  secao('4. Tela cheia');
  await pag.evaluate(() => document.querySelectorAll('#bib-corpo .bib-cartao')[2].click());
  const cheia = await esperar('imagem em tela cheia', () => pag.evaluate(() => {
    const i = document.querySelector('#bib-imagem-cheia');
    return i && i.complete && i.naturalWidth > 0 ? { titulo: document.querySelector('#titulo-modal-biblioteca').textContent,
      aberto: document.querySelector('#modal-biblioteca').classList.contains('aberto'), src: i.src.slice(0, 5),
      largura: Math.round(i.getBoundingClientRect().width) } : null;
  }), v => !!v, 10000);
  conf('abre com o título do exercício e a posição na lista', cheia.valor && cheia.valor.titulo, 'Equações do Segundo Grau: Resultados Básicos, exercício 3 (3 de 40)');
  conf('a imagem vem do pacote (blob)', cheia.valor && cheia.valor.src, 'blob:');
  conf('maior que a miniatura', cheia.valor && cheia.valor.largura > 400, true);
  await pag.click('#bib-solucao');
  await esperar('solução', () => pag.$eval('#titulo-modal-biblioteca', e => e.textContent), v => /solução$/.test(v || ''), 5000);
  conf('Ver solução troca para a solução', await pag.$eval('#bib-solucao', e => e.textContent), 'Ver enunciado');
  await pag.click('#bib-proxima');
  await esperar('próxima', () => pag.$eval('#titulo-modal-biblioteca', e => e.textContent), v => /exercício 4 \(4 de 40\)$/.test(v || ''), 5000);
  conf('Próxima vai para o exercício 4, no enunciado', await pag.$eval('#titulo-modal-biblioteca', e => e.textContent),
    'Equações do Segundo Grau: Resultados Básicos, exercício 4 (4 de 40)');
  await pag.click('#bib-fechar-visor');
  await pausa(150);
  conf('Fechar fecha', await pag.$eval('#modal-biblioteca', e => e.classList.contains('aberto')), false);

  // ================================================================
  secao('5. Busca "bhaskara"');
  await pag.focus('#busca-biblioteca');
  await pag.keyboard.type('bhaskara');
  await esperar('resultado da busca', () => lerCorpo(pag), v => v && v.blocos.length > 0, 5000);
  corpo = await lerCorpo(pag);
  console.log('   ' + corpo.blocos.map(b => b.titulo + ' [' + b.linhas.join(' | ') + ']').join('  '));
  if (VENENO_APELIDOS) {
    const exs = corpo.blocos.find(b => b.titulo === 'Exercícios');
    conf('envenenado-apelidos: sem os apelidos, "bhaskara" NÃO traz as listas (defeito detectado)', !exs, true);
    await amb.encerrar();
    console.log('\n' + H.placar.passes + ' passaram, ' + H.placar.falhas + ' falharam.');
    process.exit(H.placar.falhas ? 1 : 0);
  }
  conf('grupos, nesta ordem', corpo.blocos.map(b => b.titulo).join(','), 'Módulos,Teoria,Exercícios,Banco de Questões');
  conf('Módulos: Equações do Segundo Grau no topo', corpo.blocos[0].linhas[0], 'Equações do Segundo Grau');
  conf('Teoria: as quatro do módulo, a de Produtos que casa no título e a de Pitágoras que cita o discriminante',
    corpo.blocos[1].linhas.slice().sort().join(' | '),
    ['Equação do Segundo Grau e Fatoração', 'Equações Biquadradas', 'O Teorema', 'Resultados Básicos - Parte I',
      'Resultados Básicos - Parte II', 'Soma e Produto das Raízes'].join(' | '));
  /* A teoria de Pitágoras cita Bhaskara no texto: aparece, mas depois das
   * quatro do módulo achado. */
  conf('as quatro teorias do módulo achado vêm primeiro', corpo.blocos[1].linhas.slice(0, 4).sort().join(' | '),
    ['Equações Biquadradas', 'Resultados Básicos - Parte I', 'Resultados Básicos - Parte II', 'Soma e Produto das Raízes'].join(' | '));
  conf('e as de outros módulos vêm depois, mesmo a que casa no título', corpo.blocos[1].linhas.slice(4).join(' | '),
    'Equação do Segundo Grau e Fatoração | O Teorema');
  conf('dentro do módulo vale a nota: o título que casa vem na frente', corpo.blocos[1].linhas[0], 'Equações Biquadradas');
  conf('Exercícios: as duas listas', corpo.blocos[2].linhas.slice().sort().join(' | '),
    'Equações do Segundo Grau: Resultados Básicos | Soma e Produto');
  conf('Banco: o problema da equação do segundo grau', corpo.blocos[3].linhas.join(' | '), 'As raízes escondidas');
  conf('em Exercícios e Banco, nada de Produtos Notáveis nem de Pitágoras',
    corpo.blocos.filter(b => b.titulo === 'Exercícios' || b.titulo === 'Banco de Questões')
      .some(b => b.linhas.some(l => /Pitágoras|Teorema|Produtos|Fatoração/.test(l))), false);
  // tocar numa lista leva a ela e limpa a busca
  await tocarLinha(pag, 'Soma e Produto');
  await esperar('lista aberta pela busca', () => estadoMinis(pag), v => v && v.total === 8, 5000);
  conf('a busca levou à lista, e o campo ficou limpo', await pag.$eval('#busca-biblioteca', e => e.value), '');
  const objetiva = await pag.evaluate(() => (c => Array.from(c.children).map(e => e.classList.contains('bib-tags') ? Array.from(e.children).map(t => t.textContent).join(' | ') : e.textContent).filter(Boolean).join(' | '))(document.querySelectorAll('#bib-corpo .bib-cartao')[2]));
  conf('exercício objetivo marcado', objetiva, 'Exercício 3 | Objetiva | Fácil');

  // ================================================================
  secao('6. Abrir como folha, numa aula nova de hoje');
  await H.irParaAba(pag, 'biblioteca');
  await pag.evaluate(() => document.querySelector('.bib-voltar').click());
  await pausa(100);
  await tocarLinha(pag, 'Resultados Básicos - Parte II');
  await esperar('páginas', () => estadoMinis(pag), v => v && v.total === 4, 5000);
  await pag.evaluate(() => document.querySelectorAll('#bib-corpo .bib-cartao')[1].click());
  await esperar('tela cheia da página 2', () => pag.$eval('#titulo-modal-biblioteca', e => e.textContent), v => v === 'Resultados Básicos - Parte II, página 2 de 4', 5000);
  await pag.click('#bib-como-folha');
  await esperar('escolha da aula', () => pag.$eval('#modal-bib-folha', e => e.classList.contains('aberto')), v => v === true, 5000);
  await pag.click('#bib-nova-aula');
  await esperar('janela de aula nova com o aviso da biblioteca', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto') && !!document.querySelector('#aviso-folha-da-biblioteca')), v => v === true, 5000);
  conf('a data da aula nova é hoje', await pag.$eval('#campo-data', e => e.value), hojeIso);
  conf('e a janela não promete reabrir a aula (vai abrir a folha)', await pag.evaluate(() => !document.querySelector('#ajuda-aula-nova')), true);
  await pag.click('#salvar-aula');
  const editor = await esperar('a folha abriu com a página colada', () => pag.evaluate(() =>
    document.querySelector('#modal-nota').classList.contains('aberto') ? document.querySelector('#titulo-modal-nota').textContent : null), v => !!v, 10000);
  conf('o editor da folha abriu', !!editor.valor, true);
  // um traço de caneta por cima da página
  await pausa(400);
  await pag.evaluate(() => {
    const c = document.querySelector('#tela-desenho');
    const r = c.getBoundingClientRect();
    const pts = [[r.width * 0.3, r.height * 0.3], [r.width * 0.4, r.height * 0.35], [r.width * 0.5, r.height * 0.32], [r.width * 0.6, r.height * 0.4]];
    const ev = (tipo, x, y, p) => c.dispatchEvent(new PointerEvent(tipo, { pointerId: 7, pointerType: 'pen', pressure: p, isPrimary: true,
      bubbles: true, clientX: r.left + x, clientY: r.top + y }));
    ev('pointerdown', pts[0][0], pts[0][1], 0.5);
    for (let i = 1; i < pts.length; i++) ev('pointermove', pts[i][0], pts[i][1], 0.5);
    ev('pointerup', pts[pts.length - 1][0], pts[pts.length - 1][1], 0.5);
  });
  await pausa(900);
  const pixel = await pixelsDaPagina(pag);
  console.log('   pixels da cor da página no editor: ' + pixel);
  conf('a página aparece no editor (a cor do título dela está no canvas)', pixel > 30, true);
  await pag.evaluate(() => Array.from(document.querySelectorAll('#rodape-nota button')).find(b => b.textContent.trim() === 'Concluir').click());
  await esperar('editor fechado', () => pag.$eval('#modal-nota', e => e.classList.contains('aberto')), v => v === false, 5000);

  const lerNotaDeHoje = () => pag.evaluate(h => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => {
      const t = q.result.transaction(['dados', 'notas', 'midias'], 'readonly');
      const d = t.objectStore('dados').get('principal');
      const notas = t.objectStore('notas').getAll();
      const chaves = t.objectStore('notas').getAllKeys();
      const midias = t.objectStore('midias').getAll();
      const mchaves = t.objectStore('midias').getAllKeys();
      t.oncomplete = () => {
        q.result.close();
        const aula = d.result.aulas.find(a => a.data === h);
        const i = aula ? chaves.result.indexOf(aula.id) : -1;
        const nota = i >= 0 ? notas.result[i] : null;
        const itens = nota ? nota.paginas[0].itens : [];
        const img = itens.find(x => x.t === 'imagem');
        const mi = img ? mchaves.result.indexOf(img.ref) : -1;
        r({ aula: !!aula, temNota: aula && aula.temNota, paginas: nota ? nota.paginas.length : 0, fundo: nota && nota.paginas[0].fundo,
          tipos: itens.map(x => x.t).join(','), jpeg: mi >= 0 && String(midias.result[mi].dataUrl).slice(0, 23),
          largura: img && Math.round(img.w) });
      };
    };
  }), hojeIso);
  let nota = await lerNotaDeHoje();
  conf('a aula de hoje foi criada e tem folha', nota.aula + '/' + nota.temNota, 'true/true');
  conf('a nota tem a imagem da página e o traço por cima', nota.tipos, 'imagem,traco');
  conf('numa página sem pauta', nota.fundo, 'branco');
  conf('a imagem está guardada como JPEG em midias', nota.jpeg, 'data:image/jpeg;base64,');
  conf('a página ocupa a largura da folha', nota.largura > 900, true);

  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  nota = await lerNotaDeHoje();
  conf('depois de recarregar, a nota continua com imagem e traço', nota.tipos, 'imagem,traco');
  // abrir pela agenda: mês de hoje, a aula do dia, "Abrir folha de aula"
  await H.irParaAba(pag, 'agenda');
  for (let i = 0; i < 24; i++) {
    const tem = await pag.evaluate(h => !!document.querySelector('[data-dia="' + h + '"]'), hojeIso);
    if (tem) break;
    // a carga inicial abre no mês do exemplo (junho de 2026), antes de hoje
    await pag.click(i < 12 ? '#mes-seguinte' : '#mes-anterior');
    await pausa(120);
  }
  await pag.evaluate(h => document.querySelector('[data-dia="' + h + '"] .pilula').click(), hojeIso);
  await pausa(400);
  const abriu = await pag.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#corpo-modal-aula button')).find(x => x.textContent.trim() === 'Abrir folha de aula');
    if (!b) return false;
    b.click();
    return true;
  });
  conf('a aula de hoje oferece "Abrir folha de aula"', abriu, true);
  const reaberta = await esperar('folha reaberta depois de recarregar', () => pag.evaluate(() =>
    document.querySelector('#modal-nota').classList.contains('aberto')).then(a => a ? pixelsDaPagina(pag) : 0), v => v > 30, 8000);
  conf('e a folha reabre com a página desenhada', reaberta.ok, true);

  const concluir = async () => {
    await pag.evaluate(() => Array.from(document.querySelectorAll('#rodape-nota button')).find(b => b.textContent.trim() === 'Concluir').click());
    await esperar('editor fechado', () => pag.$eval('#modal-nota', e => e.classList.contains('aberto')), v => v === false, 5000);
  };
  const subirNaBiblioteca = async () => {
    for (let k = 0; k < 4; k++) {
      const v = await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); return !!b; });
      if (!v) break;
      await pausa(150);
    }
  };

  // ================================================================
  secao('7. Colar numa aula que JÁ tem folha: página nova, e o rodapé na página certa');
  await concluir();
  await H.irParaAba(pag, 'biblioteca');
  await subirNaBiblioteca();
  await tocarLinha(pag, 'Equações do Segundo Grau');
  await tocarLinha(pag, 'Resultados Básicos - Parte II');
  await esperar('páginas', () => estadoMinis(pag), v => v && v.total === 4, 5000);
  await pag.evaluate(() => document.querySelectorAll('#bib-corpo .bib-cartao')[2].click());
  await esperar('tela cheia da página 3', () => pag.$eval('#titulo-modal-biblioteca', e => e.textContent), v => /página 3 de 4$/.test(v || ''), 5000);
  await pag.click('#bib-como-folha');
  await esperar('escolha da aula', () => pag.$eval('#modal-bib-folha', e => e.classList.contains('aberto')), v => v === true, 5000);
  const linhasDeHoje = await pag.evaluate(() => Array.from(document.querySelectorAll('#corpo-modal-bib-folha .item-lista .detalhe')).map(d => d.textContent));
  conf('a aula de hoje aparece dizendo que já tem folha', linhasDeHoje.some(t => /já tem folha/.test(t)), true);
  // dois toques seguidos: tem de colar UMA vez (uma imagem nova em midias, fora as miniaturas)
  const imagensAntes = await chavesDeMiniatura(pag, '^(?!bib:)');
  await pag.evaluate(() => { const l = document.querySelector('#corpo-modal-bib-folha .item-lista'); l.click(); l.click(); });
  await esperar('editor aberto na página colada', () => pag.$eval('#modal-nota', e => e.classList.contains('aberto')), v => v === true, 10000);
  await pausa(600);
  const rod = await rodapeDaFolha(pag);
  conf('o rodapé mostra a página colada, e não a primeira', rod.contador, 'Folha 2 de 2');
  conf('e o fundo mostrado é o da página colada (sem pauta)', rod.fundo, 'branco');
  conf('dois toques colaram uma página só', (await lerNotaDeHoje()).paginas, 2);
  conf('e gravaram uma imagem só em midias', (await chavesDeMiniatura(pag, '^(?!bib:)')) - imagensAntes, 1);

  // ================================================================
  secao('8. Nova aula com "Repetir toda semana": a página vai para a aula do dia');
  await concluir();
  await H.irParaAba(pag, 'biblioteca');
  await pag.evaluate(() => document.querySelectorAll('#bib-corpo .bib-cartao')[0].click());
  await esperar('tela cheia da capa', () => pag.$eval('#modal-biblioteca', e => e.classList.contains('aberto')), v => v === true, 5000);
  await pag.click('#bib-como-folha');
  await esperar('escolha da aula', () => pag.$eval('#modal-bib-folha', e => e.classList.contains('aberto')), v => v === true, 5000);
  await pag.click('#bib-nova-aula');
  await esperar('janela de aula nova', () => pag.evaluate(() => document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);
  const outroAluno = await pag.evaluate(() => {
    const sel = document.querySelector('#campo-aluno');
    sel.selectedIndex = Math.min(2, sel.options.length - 1);
    sel.dispatchEvent(new Event('change'));
    const chk = document.querySelector('#campo-repetir');
    chk.checked = true;
    chk.dispatchEvent(new Event('change'));
    return sel.value;
  });
  await pag.click('#salvar-aula');
  const colou = await esperar('a série foi criada e a página colada na aula do dia', () => pag.evaluate((a, h) => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => {
      const t = q.result.transaction(['dados', 'notas'], 'readonly');
      const d = t.objectStore('dados').get('principal');
      const n = t.objectStore('notas').getAll();
      const k = t.objectStore('notas').getAllKeys();
      t.oncomplete = () => {
        q.result.close();
        const doAluno = d.result.aulas.filter(x => x.alunoId === a);
        const doDia = doAluno.filter(x => x.data === h)[0];
        const i = doDia ? k.result.indexOf(doDia.id) : -1;
        r({ aulas: doAluno.length, temImagem: i >= 0 && n.result[i].paginas.some(pg => pg.itens.some(it => it.t === 'imagem')) });
      };
    };
  }), outroAluno, hojeIso), v => v && v.temImagem, 10000);
  conf('a série tem mais de uma aula', colou.valor && colou.valor.aulas > 1, true);
  conf('e a aula do dia recebeu a página na folha', colou.valor && colou.valor.temImagem, true);

  if (pag.errosDePagina.length) console.log('   erros de página: ' + pag.errosDePagina.join(' | ').slice(0, 400));
  conf('nenhum erro de JavaScript na página', pag.errosDePagina.length, 0);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
