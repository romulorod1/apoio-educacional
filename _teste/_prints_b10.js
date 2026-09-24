/* _prints_b10.js
 *
 * Os prints do marco visual da B10, tirados do APLICATIVO DE VERDADE no Chrome,
 * que é o caminho do tablet. Nenhum mockup, nenhuma montagem, nenhum rótulo
 * desenhado por cima: o que está na imagem é o que a tela desenhou.
 *
 *   node _teste/_prints_b10.js <pasta-de-saida> <pacote.zip>
 *
 * O pacote é o REAL, do 9º ano, porque é dele que sai a única coisa que
 * interessa olhar aqui: o enunciado de verdade dentro da lista pronta. Ele mora
 * fora do repositório e vem por argumento.
 *
 * Os nomes dos arquivos são NEUTROS de propósito (b10_01 em diante). Quem olha
 * as telas de fora não pode receber, no nome do arquivo, a resposta da pergunta
 * que se faz a ele; foi essa a lição do PR #55, em que o rótulo na folha
 * contaminou a amostra do olhar cego.
 *
 * A PASTA TEM DE EXISTIR, e o roteiro NÃO a cria: com `recursive`, um caminho
 * errado fabrica a árvore em silêncio e a conferência lê de volta o mesmo
 * endereço errado. Ninguém percebe um erro que se confirma sozinho.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const SAIDA = process.argv[2];
const PACOTE = process.argv[3];
if (!SAIDA || !PACOTE) {
  console.error('uso: node _teste/_prints_b10.js <pasta-de-saida> <pacote.zip>');
  process.exit(2);
}
if (!fs.existsSync(SAIDA)) {
  console.error('a pasta de saida NAO existe, e este roteiro nao cria pasta: ' + SAIDA);
  process.exit(2);
}
if (!fs.statSync(SAIDA).isDirectory()) {
  console.error('o caminho de saida existe mas nao e uma pasta: ' + SAIDA);
  process.exit(2);
}
if (!fs.existsSync(PACOTE)) {
  console.error('o pacote nao existe: ' + PACOTE);
  process.exit(2);
}

const PORTA = 8807;
const amb = H.criarAmbiente(PORTA, 'perfil_prints_b10', {});

let n = 0;
async function tirar(pag, seletor) {
  n++;
  const nome = 'b10_' + String(n).padStart(2, '0') + '.png';
  const alvo = seletor ? await pag.$(seletor) : pag;
  await (alvo || pag).screenshot({ path: path.join(SAIDA, nome) });
  console.log('   ' + nome);
  return nome;
}

async function importar(pag, arquivo) {
  await H.irParaAba(pag, 'ajustes');
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar('importação do pacote real', () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca'); return c ? c.innerText.trim() : '';
  }), v => /^Biblioteca importada\.|não foi importado/.test(v || ''), 300000);
  return r.valor || '';
}

const tocarLinha = (pag, nome) => pag.evaluate(t => {
  const l = Array.from(document.querySelectorAll('#bib-corpo .item-lista'))
    .find(x => x.querySelector('.nome').textContent.trim() === t);
  if (!l) return false; l.click(); return true;
}, nome);

/* As miniaturas entram sob demanda, e um print tirado antes delas mostraria
 * caixas cinzentas em vez do enunciado. Esperar o número de imagens parar de
 * subir é o que faz o print ser da tela pronta, e não da tela a meio caminho. */
async function esperarMiniaturas(pag, quantas) {
  await esperar('miniaturas', () => pag.evaluate(() =>
    Array.from(document.querySelectorAll('#bib-corpo img')).filter(i => i.complete && i.naturalWidth > 0).length),
  v => v >= quantas, 60000);
  await pausa(500);
}

(async () => {
  await amb.subir();
  const pag = await amb.pagina();
  await pag.setViewport({ width: 1024, height: 1366, deviceScaleFactor: 2 });
  await H.abrirApp(pag, amb.ORIGEM);

  secao('O pacote real do 9º ano entra no aplicativo de hoje');
  const msg = await importar(pag, PACOTE);
  console.log('   ' + msg.replace(/\n/g, ' | '));
  conf('importou', /^Biblioteca importada\./.test(msg), true);
  const versao = await pag.evaluate(() => (window.VERSAO_APP || document.querySelector('#versao-app') || {}).textContent || '');
  console.log('   versão na tela: ' + String(versao).trim());

  secao('Os prints');
  await H.irParaAba(pag, 'biblioteca');
  await pausa(600);

  // 01: a lista de módulos da série
  await tirar(pag);

  // 02: a tela do módulo, com as duas linhas de lista pronta
  conf('abriu um módulo', await tocarLinha(pag, 'Equações do Segundo Grau'), true);
  await pausa(700);
  await tirar(pag);
  await tirar(pag, '#bib-corpo');

  // 03: a lista pronta do nível 2, carregada e em ordem
  conf('tocou na lista pronta do nível 2', await tocarLinha(pag, 'Lista pronta, nível 2'), true);
  await pausa(900);
  await esperarMiniaturas(pag, 3);
  await tirar(pag);

  // 04: depois de descer o primeiro e tirar um pela caixa
  const ids = await pag.evaluate(() => {
    try { return (JSON.parse(localStorage.getItem('apoio-educacional:bib-carrinho') || '{}').itens) || []; }
    catch (e) { return []; }
  });
  await pag.evaluate(i => {
    const b = document.querySelector('#bib-lp-grade [data-descer="' + i + '"]');
    if (b && !b.disabled) b.click();
  }, ids[0]);
  await pausa(700);
  await esperarMiniaturas(pag, 3);
  await tirar(pag);

  await pag.evaluate(i => {
    const c = document.querySelector('#bib-lp-grade input[data-carrinho="itens"][data-id="' + i + '"]');
    if (c) { c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); }
  }, ids[2]);
  await pausa(700);
  await esperarMiniaturas(pag, 3);
  await tirar(pag);
  await tirar(pag, '#bib-lp-cabeca');

  // 05: a lista pronta do nível 3 do mesmo módulo
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(600);
  conf('tocou na lista pronta do nível 3', await tocarLinha(pag, 'Lista pronta, nível 3'), true);
  await pausa(900);
  await esperarMiniaturas(pag, 3);
  await tirar(pag);

  // 06: a barra de ferramentas da folha, com a ferramenta de tapar
  await pag.evaluate(async () => {
    const d = await Store.carregar();
    const aluno = d.alunos[0];
    const hoje = new Date();
    const iso = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' + String(hoje.getDate()).padStart(2, '0');
    d.aulas.push({ id: 'aula-b10-folha', alunoId: aluno.id, serieId: null, destacada: false, data: iso,
      hora: '08:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '',
      temNota: false, anexos: [], temas: [{ titulo: 'Equações do Segundo Grau', fonte: 'livre' }] });
    await Store.salvar(d);
  });
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  const abriu = await pag.evaluate(() => {
    if (typeof abrirFolhaDaAula === 'function') { abrirFolhaDaAula('aula-b10-folha'); return 'funcao'; }
    return 'nao achei';
  }).catch(() => 'erro');
  console.log('   folha: ' + abriu);
  await pausa(1200);
  const temBarra = await pag.evaluate(() => !!document.querySelector('#ferramentas-nota .ferr'));
  if (temBarra) {
    await tirar(pag, '#ferramentas-nota');
    const rotulos = await pag.evaluate(() =>
      Array.from(document.querySelectorAll('#ferramentas-nota .ferr')).map(b => b.getAttribute('title') || ''));
    console.log('   ferramentas: ' + JSON.stringify(rotulos));
    conf('a ferramenta de tapar está na barra', rotulos.indexOf('Tapar com branco') >= 0, true);
    conf('e nenhuma ferramenta promete editar o enunciado',
      rotulos.filter(r => /editar/i.test(r)).join(',') || '(nenhuma)', '(nenhuma)');
  } else {
    console.log('   a barra da folha não abriu por aqui; o print dela fica de fora');
  }

  if (pag.errosDePagina.length) console.log('   erros de página: ' + pag.errosDePagina.join(' | ').slice(0, 400));
  conf('nenhum erro de JavaScript na página', pag.errosDePagina.length, 0);
  console.log('\n   ' + n + ' prints em ' + SAIDA);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
