/* _prints_b10.js
 *
 * O marco visual da B10, tirado do APLICATIVO DE VERDADE no Chrome, que é o
 * caminho do tablet. Nenhum mockup, nenhuma montagem, nenhum rótulo desenhado
 * por cima: o que está na imagem é o que a tela desenhou.
 *
 *   node _teste/_prints_b10.js <pasta-de-saida> <pacote.zip>
 *
 * O pacote é o REAL, do 9º ano, porque é dele que sai a única coisa que
 * interessa olhar aqui: o enunciado de verdade dentro da lista pronta. Ele mora
 * fora do repositório e vem por argumento.
 *
 * O MARCO FECHA A CADEIA, e esta é a lição que custou caro em 24/09. Telas que
 * mostram a escolha, mais uma folha que mostra a impressão, não provam nada se
 * a folha não for a impressão DAQUELA escolha. Por isso o roteiro percorre o
 * caminho inteiro como usuária (abre o módulo, carrega a lista pronta, desce um
 * exercício, tira outro) e, no fim desse percurso, GERA O MATERIAL daquela
 * lista e guarda o PDF. O elo do meio é o que ninguém olha, e é onde o defeito
 * mora: nós entregamos "lista pronta" e quase ninguém tinha olhado uma lista
 * pronta impressa.
 *
 * E o outro lado da mesma lição: no marco entra o que ELA vai ver. Fixture de
 * prova serve à prova e fica na prova. O marco anterior levou, sem querer, a
 * folha que a prova do pdf.js usa, com retângulo preto e frases de teste, e o
 * olho de fora cego gastou três parágrafos analisando artefato nosso.
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

/* O NÚMERO DA IMAGEM É ESCOLHIDO, e não contado.
 *
 * A ordem em que as imagens são olhadas é a ordem em que a cadeia se lê, e ela
 * não é a ordem em que dá jeito de produzi-las. A folha impressa só pode ser
 * gerada depois de a lista estar editada, mas quem olha precisa vê-la logo
 * depois da tela que a produziu; a lista pronta do outro nível e a barra da
 * folha vêm no fim, porque são outro assunto. Na primeira montagem a numeração
 * era sequencial e a última tela mostrada tinha 6 exercícios enquanto o papel
 * tinha 5: o olho de fora cego concluiu, com razão, que a tela e o papel não
 * batiam.
 *
 * Os números 06 a 09 ficam para as páginas do material, rasterizadas fora
 * daqui a partir do b10_material.pdf. */
async function tirar(pag, numero, seletor) {
  const nome = 'b10_' + String(numero).padStart(2, '0') + '.png';
  const alvo = seletor ? await pag.$(seletor) : pag;
  await (alvo || pag).screenshot({ path: path.join(SAIDA, nome) });
  console.log('   ' + nome + (seletor ? '  (' + seletor + ')' : ''));
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
 * caixas cinzentas em vez do enunciado. Com uma coluna só, quase nenhuma delas
 * começa dentro da janela: rolar a tela inteira é o que as faz entrar, e aí o
 * print do corpo inteiro sai com todos os enunciados desenhados. */
async function rolarTudoEEsperar(pag) {
  await pag.evaluate(async () => {
    const c = document.querySelector('.conteudo');
    if (!c) return;
    for (let y = 0; y <= c.scrollHeight; y += Math.max(200, Math.round(c.clientHeight * 0.7))) {
      c.scrollTop = y;
      await new Promise(r => setTimeout(r, 250));
    }
    c.scrollTop = 0;
  });
  const r = await esperar('miniaturas da tela', () => pag.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('#bib-corpo img.bib-mini'));
    const prontas = imgs.filter(i => i.complete && i.naturalWidth > 0).length;
    return imgs.length ? prontas + '/' + imgs.length : '0/0';
  }), v => {
    const [a, b] = String(v).split('/').map(Number);
    return b > 0 && a === b;
  }, 180000);
  await pausa(600);
  return r.valor;
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

  secao('Os prints');
  await H.irParaAba(pag, 'biblioteca');
  await pausa(600);

  // 01: a lista de módulos da série
  await tirar(pag, 1);

  // 02: a tela do módulo, com as duas linhas de lista pronta
  conf('abriu um módulo', await tocarLinha(pag, 'Equações do Segundo Grau'), true);
  await pausa(700);
  await tirar(pag, 2);

  // 03: a lista pronta do nível 2, recém carregada, com a mensagem no fluxo
  conf('tocou na primeira lista pronta', await tocarLinha(pag, 'Lista com 1 desafio'), true);
  await pausa(500);
  // tocar mostra a lista; quem carrega é o "Usar esta lista"
  await pag.evaluate(() => { const b = document.querySelector('#bib-lp-usar'); if (b) b.click(); });
  await pausa(900);
  console.log('   ' + (await rolarTudoEEsperar(pag)));
  await tirar(pag, 3);

  // 04: depois de descer o primeiro exercício
  const ids = await pag.evaluate(() => {
    try { return (JSON.parse(localStorage.getItem('apoio-educacional:bib-carrinho') || '{}').itens) || []; }
    catch (e) { return []; }
  });
  console.log('   a lista carregou ' + ids.length + ' exercícios');
  await pag.evaluate(i => {
    const b = document.querySelector('#bib-lp-grade [data-descer="' + i + '"]');
    if (b && !b.disabled) b.click();
  }, ids[0]);
  await pausa(700);
  console.log('   ' + (await rolarTudoEEsperar(pag)));
  await tirar(pag, 4);

  /* 05: depois de tirar um pela caixa, e esta é a LISTA INTEIRA numa imagem só.
   *
   * É a imagem que fecha a cadeia: ela tem os cinco cartões na ordem em que ela
   * os deixou, que é exatamente o que o papel das imagens seguintes tem de
   * espelhar. Com o print da janela dava para ver dois cartões, e o olho de
   * fora cego escreveu que não conseguia conferir tela contra papel.
   *
   * E NÃO é um print do elemento. A primeira tentativa fotografou o
   * `#bib-corpo`, e saiu um artefato: o elemento é mais alto que a janela, e
   * numa captura assim os elementos de posição fixa e grudada (a faixa do
   * carrinho, a caixa do aviso do rodapé, que estava FECHADA mas tem o botão
   * Desfazer sempre no DOM) vão parar no meio da imagem, e os cartões de baixo
   * saem em branco. Quem olhasse veria uma tela que não existe. O jeito honesto
   * é alargar a JANELA até a lista caber: a largura não muda, então o desenho é
   * o mesmo, e tudo pinta no lugar. */
  await pag.evaluate(i => {
    const c = document.querySelector('#bib-lp-grade input[data-carrinho="itens"][data-id="' + i + '"]');
    if (c) { c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); }
  }, ids[2]);
  await pausa(700);
  console.log('   ' + (await rolarTudoEEsperar(pag)));
  const alturaToda = await pag.evaluate(() => {
    const c = document.querySelector('.conteudo');
    return Math.min(4200, Math.ceil((c ? c.scrollHeight : 0) + 80));
  });
  console.log('   a lista inteira tem ' + alturaToda + ' px de altura');
  await pag.setViewport({ width: 1024, height: alturaToda, deviceScaleFactor: 2 });
  await pausa(600);
  console.log('   ' + (await rolarTudoEEsperar(pag)));
  await tirar(pag, 5);
  await pag.setViewport({ width: 1024, height: 1366, deviceScaleFactor: 2 });
  await pausa(500);

  /* O ELO DO MEIO: a folha impressa DESTA escolha.
   *
   * O espião guarda os bytes do PDF na fronteira em que o aplicativo entrega ao
   * gerador, que é o mesmo lugar onde a prova da ordem mede. O download de
   * verdade continua acontecendo e é ignorado: o que interessa aqui é o
   * arquivo, e não o caminho do navegador até a pasta de downloads. */
  secao('O material de verdade, gerado desta lista e nesta ordem');
  const ordem = await pag.evaluate(() => {
    try { return (JSON.parse(localStorage.getItem('apoio-educacional:bib-carrinho') || '{}').itens) || []; }
    catch (e) { return []; }
  });
  console.log('   vai imprimir ' + ordem.length + ' exercícios, nesta ordem: ' + JSON.stringify(ordem));
  await pag.evaluate(() => {
    const original = window.PDFGen.gerarMaterialBiblioteca;
    window.__pdf64 = null;
    window.__pdfIds = null;
    window.PDFGen.gerarMaterialBiblioteca = function (op) {
      const r = original.apply(this, arguments);
      try {
        window.__pdfIds = (op.itens || []).map(p => (p.item && p.item.id) || p.id || null);
        const b = r.bytes;
        let s = '';
        for (let i = 0; i < b.length; i += 4096) {
          s += String.fromCharCode.apply(null, b.subarray(i, Math.min(i + 4096, b.length)));
        }
        window.__pdf64 = btoa(s);
      } catch (e) { window.__pdf64 = 'ERRO:' + (e && e.message); }
      return r;
    };
  });
  await pag.evaluate(() => { document.querySelector('#bib-carrinho-gerar').click(); });
  await pausa(700);
  const opcoes = await pag.evaluate(() =>
    Array.from(document.querySelectorAll('#corpo-modal-bib-gerar input[type=checkbox]'))
      .map(c => c.id.replace('bib-gerar-', '') + '=' + (c.checked ? 'sim' : 'nao')).join(' '));
  console.log('   o que entra, como o aplicativo propõe: ' + opcoes);
  await pag.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#rodape-modal-bib-gerar button'))
      .find(x => /Gerar|Baixar|material/i.test(x.textContent));
    if (b) b.click();
  });
  const pronto = await esperar('o PDF do material', () => pag.evaluate(() => window.__pdf64 ? window.__pdf64.length : 0),
    v => v > 0, 240000);
  const b64 = await pag.evaluate(() => window.__pdf64);
  const idsNoPdf = await pag.evaluate(() => window.__pdfIds);
  conf('o material saiu', pronto.ok && !/^ERRO:/.test(String(b64)), true);
  conf('e o gerador recebeu os exercícios NA ORDEM DA TELA',
    (idsNoPdf || []).join('|'), ordem.join('|'));
  const pdf = Buffer.from(String(b64), 'base64');
  fs.writeFileSync(path.join(SAIDA, 'b10_material.pdf'), pdf);
  console.log('   b10_material.pdf: ' + pdf.length + ' bytes');
  await pag.evaluate(() => {
    const m = document.querySelector('#modal-bib-gerar');
    if (m && m.classList.contains('aberto')) {
      const f = Array.from(m.querySelectorAll('button')).find(x => /Fechar|Cancelar/i.test(x.textContent));
      if (f) f.click();
    }
    const a = document.querySelector('#aviso');
    if (a) a.classList.remove('aberto');
  });
  await pausa(500);

  // 10: a lista pronta do nível 3 do mesmo módulo
  secao('Os prints que faltam');
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(600);
  conf('tocou na outra lista pronta do mesmo módulo', await tocarLinha(pag, 'Lista com 4 desafios'), true);
  await pausa(900);
  console.log('   ' + (await rolarTudoEEsperar(pag)));
  await tirar(pag, 10);

  // 11: a barra de ferramentas da folha, com a ferramenta de tapar
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
  /* A FOLHA ABRE PELO CAMINHO DELA, e não por uma função interna: a agenda, a
   * pílula do dia e o botão da folha dentro da janela da aula. A primeira
   * escrita deste trecho chamava `abrirFolhaDaAula`, que mora dentro do IIFE e
   * não existe no escopo da página: o print simplesmente não saía, e o roteiro
   * dizia isso em uma linha que passava despercebida. */
  await H.irParaAba(pag, 'agenda');
  await pausa(800);
  const hoje = new Date();
  const iso = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' + String(hoje.getDate()).padStart(2, '0');
  const abriu = await pag.evaluate(d => {
    const dia = document.querySelector('[data-dia="' + d + '"]');
    if (!dia) return 'sem o dia ' + d + ' na agenda';
    const p = dia.querySelector('.pilula');
    if (!p) return 'sem pílula no dia';
    p.click();
    return 'abriu a aula';
  }, iso);
  console.log('   aula: ' + abriu);
  await pausa(900);
  const foiParaFolha = await pag.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#linha-folha button, .modal-corpo button'))
      .find(x => /folha/i.test(x.textContent));
    if (!b) return 'sem botão de folha';
    b.click();
    return 'tocou em ' + b.textContent.trim();
  });
  console.log('   folha: ' + foiParaFolha);
  await pausa(1600);
  const temBarra = await pag.evaluate(() => !!document.querySelector('#ferramentas-nota .ferr'));
  if (temBarra) {
    await tirar(pag, 11, '#ferramentas-nota');
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
  console.log('\n   telas em ' + SAIDA + ': 01 a 05, 10 e 11.');
  console.log('   falta rasterizar b10_material.pdf em b10_06 a b10_09, que é onde o papel entra.');
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
