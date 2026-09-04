/* testa_proposta_tela.js
 * A proposta de acompanhamento na tela, com o navegador de verdade.
 *
 * O testa_proposta.js prova o modelo e a folha. Este aqui prova a única coisa
 * que decide se ela vai usar isto: o caminho do dedo, do aplicativo aberto até
 * o PDF na mão.
 *
 * O que este teste persegue, nesta ordem:
 *
 *   1. As TRÊS PORTAS existem e levam ao MESMO editor:
 *      a. o botão Proposta na barra da tela Alunos, para a família de quem
 *         ainda nem existe no aplicativo, que é o caso principal;
 *      b. a aba Proposta na ficha de quem já está cadastrado;
 *      c. o botão ao lado de "Gerar ficha em PDF", na aba Mapeamento, que é
 *         onde ela está logo depois da aula de nivelamento.
 *
 *   2. A REGRA DE OURO: os sete blocos abrem FECHADOS, com um resumo de uma
 *      linha cada. Sete blocos abertos numa tela de tablet viram três telas de
 *      rolagem e ela para de usar isto na terceira proposta. Só Quem e
 *      Investimento nascem abertos.
 *
 *   3. O ALUNO QUE AINDA NÃO EXISTE, que é o caso do pedido: ela gera antes de
 *      cadastrar, o rascunho sobrevive a fechar a janela, o PDF sai PRIMEIRO e
 *      só depois o aviso OFERECE cadastrar. Nada é criado sozinho: ela pode
 *      estar mandando proposta para três famílias na mesma tarde.
 *
 *   4. A troca entre hora-aula e planos, com a conta conferida número a número
 *      contra o Core.
 *
 *   5. A CONTAGEM DE TOQUES nos dois caminhos, que é o número que diz se o
 *      desenho serve ou não.
 *
 * E três travas de tom, conferidas no texto que sai IMPRESSO na folha e não no
 * código: nada de multa, taxa, cláusula, penalidade ou rescisão; nada de linha
 * de assinatura nem campo de aceite, porque a resposta que ela quer é um sim no
 * WhatsApp; e as duas folgas por semestre presentes, que são o pedaço que não
 * pode faltar.
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const Core = require('../core.js');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL_APP = 'http://127.0.0.1:8777/index.html';

const ALUNA = 'Antonella Vasques';
const RESPONSAVEL = 'Vanessa Vasques';

let falhas = 0, passes = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }
const espera = ms => new Promise(r => setTimeout(r, ms));

/* O texto que SAI IMPRESSO na folha, e não o código que a escreveu. Mesma
 * leitura do testa_proposta.js: os fluxos não são comprimidos, então cada
 * palavra está num operador Tj, e o latin1 é como o WinAnsi guarda o acento. */
function textoDoPdf(bytes) {
  const bruto = Buffer.from(bytes).toString('latin1');
  const rx = /\(((?:\\.|[^\\()])*)\)\s*Tj/g;
  const partes = [];
  let m;
  while ((m = rx.exec(bruto))) partes.push(m[1].replace(/\\([\\()])/g, '$1'));
  return partes.join(' ');
}

(async () => {
  const navegador = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1280, height: 800, hasTouch: true }
  });
  const pag = await navegador.newPage();
  const errosDePagina = [];
  pag.on('pageerror', e => errosDePagina.push(e.message));
  pag.on('console', m => { if (m.type() === 'error') errosDePagina.push('console: ' + m.text()); });
  pag.on('dialog', async d => { try { await d.accept(); } catch (e) { /* ok */ } });

  await pag.evaluateOnNewDocument(() => {
    /* Sem folha de compartilhamento do Android aqui: o entregarArquivo cai no
     * download, e é por ele que o teste pega os bytes do PDF. */
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    window.__blobs = [];
    const criar = URL.createObjectURL.bind(URL);
    URL.createObjectURL = function (b) {
      window.__ultimoBlob = b;
      try { window.__blobs.push(String(b.type || '')); } catch (e) { /* ok */ }
      return criar(b);
    };
    HTMLAnchorElement.prototype.click = function () { /* não baixa nada no teste */ };

    /* Achar um bloco pelo título, dentro de um escopo. Os identificadores de
     * item se repetem de propósito entre as listas (o combinado tem "véspera"
     * e o mapa também), então toda busca por item é feita DENTRO do bloco. */
    window.__bloco = function (escopo, titulo) {
      const raiz = document.querySelector(escopo);
      if (!raiz) return null;
      return Array.from(raiz.querySelectorAll('.bloco-proposta')).filter(function (x) {
        const t = x.querySelector('.titulo-bloco');
        return t && t.textContent === titulo;
      })[0] || null;
    };
  });

  await pag.goto(URL_APP, { waitUntil: 'networkidle0' });
  await espera(1600);

  // ---------------- ferramentas ----------------

  const bd = () => pag.evaluate(() => new Promise((resolve) => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const b = req.result;
      const s = b.transaction('dados', 'readonly').objectStore('dados').get('principal');
      s.onsuccess = () => resolve(s.result);
    };
  }));

  const visivel = (sel) => pag.$eval(sel, e => getComputedStyle(e).display !== 'none' &&
    (!e.classList.contains('fundo-modal') || e.classList.contains('aberto'))).catch(() => false);

  /* Toda a contagem de toques do teste passa por aqui: o número que diz se o
   * desenho serve é quantas vezes o dedo encosta na tela, e ele não pode ser
   * escrito à mão no fim do arquivo. */
  let toques = 0;
  async function tocar(sel, contar) {
    const r = await pag.evaluate((s) => {
      const e = document.querySelector(s);
      if (!e) return { erro: 'não achei ' + s };
      e.scrollIntoView({ block: 'center' });
      e.click();
      return { ok: true };
    }, sel);
    if (r.erro) throw new Error(r.erro);
    if (contar !== false) toques++;
    await espera(320);
  }

  async function digitar(escopo, campo, texto) {
    const r = await pag.evaluate((sel, c, t) => {
      const e = document.querySelector(sel + ' [data-campo="' + c + '"]');
      if (!e) return { erro: 'não achei o campo ' + c + ' em ' + sel };
      const proto = e.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement : window.HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(proto.prototype, 'value').set;
      setter.call(e, t);
      e.dispatchEvent(new Event('input', { bubbles: true }));
      return { ok: true };
    }, escopo, campo, texto);
    if (r.erro) throw new Error(r.erro);
    await espera(140);
  }

  const blocos = (escopo) => pag.evaluate((sel) => {
    const raiz = document.querySelector(sel);
    return Array.from(raiz.querySelectorAll('.bloco-proposta')).map(b => {
      const cab = b.querySelector('.cabeca-bloco');
      const r = cab.getBoundingClientRect();
      return {
        titulo: b.querySelector('.titulo-bloco').textContent,
        resumo: b.querySelector('.resumo-bloco').textContent,
        falta: b.querySelector('.resumo-bloco').classList.contains('falta'),
        aberto: b.querySelector('.corpo-bloco').style.display !== 'none',
        altura: Math.round(r.height),
        largura: Math.round(r.width)
      };
    });
  }, escopo);

  const abrirBloco = async (escopo, titulo) => {
    const r = await pag.evaluate((e, t) => {
      const b = window.__bloco(e, t);
      if (!b) return { erro: 'não achei o bloco ' + t };
      if (b.querySelector('.corpo-bloco').style.display === 'none') b.querySelector('.cabeca-bloco').click();
      return { ok: true };
    }, escopo, titulo);
    if (r.erro) throw new Error(r.erro);
    await espera(200);
  };

  const marcarNoBloco = async (escopo, titulo, itemId) => {
    const r = await pag.evaluate((e, t, id) => {
      const b = window.__bloco(e, t);
      if (!b) return { erro: 'não achei o bloco ' + t };
      const alvo = b.querySelector('.corpo-bloco [data-item="' + id + '"] input[type=checkbox]');
      if (!alvo) return { erro: 'não achei o item ' + id + ' no bloco ' + t };
      alvo.scrollIntoView({ block: 'center' });
      alvo.click();
      return { ok: true };
    }, escopo, titulo, itemId);
    if (r.erro) throw new Error(r.erro);
    await espera(200);
  };

  const tocarNoBloco = async (escopo, titulo, seletor) => {
    const r = await pag.evaluate((e, t, s) => {
      const b = window.__bloco(e, t);
      if (!b) return { erro: 'não achei o bloco ' + t };
      const alvo = b.querySelector('.corpo-bloco ' + s);
      if (!alvo) return { erro: 'não achei ' + s + ' no bloco ' + t };
      alvo.scrollIntoView({ block: 'center' });
      alvo.click();
      return { ok: true };
    }, escopo, titulo, seletor);
    if (r.erro) throw new Error(r.erro);
    await espera(260);
  };

  const aviso = () => pag.evaluate(() => {
    const c = document.querySelector('#aviso');
    return {
      aberto: c.classList.contains('aberto'),
      texto: document.querySelector('#aviso-texto').textContent.replace(/\s+/g, ' ').trim(),
      acao: document.querySelector('#aviso-acao').style.display === 'none'
        ? '' : document.querySelector('#aviso-acao').textContent.trim()
    };
  });

  const textoDoUltimoPdf = async () => {
    const b64 = await pag.evaluate(() => new Promise((resolve) => {
      const b = window.__ultimoBlob;
      if (!b) { resolve(''); return; }
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result).split(',')[1] || '');
      fr.readAsDataURL(b);
    }));
    if (!b64) return '';
    return textoDoPdf(Buffer.from(b64, 'base64'));
  };

  /* A janela de novidades abre por cima de tudo na primeira carga depois de uma
   * versão nova. Sem fechar, nenhum toque chega na tela de baixo. */
  const fecharNovidades = async () => {
    await pag.evaluate(() => {
      const m = document.querySelector('#modal-novidades');
      if (m && m.classList.contains('aberto')) {
        const b = m.querySelector('#entendi-novidades') || m.querySelector('[data-fechar]');
        if (b) b.click();
      }
    });
    await espera(300);
  };
  await fecharNovidades();

  // ================================================================
  secao('1. Porta 1: o botão Proposta na barra da tela Alunos');

  /* A medida sai com a tela Alunos JÁ no ar: elemento em tela escondida mede
   * zero, e a conferência de alvo de dedo afirmaria nada. */
  await tocar('[data-tela="alunos"]');   // toque 1

  const naBarra = await pag.evaluate(() => {
    const barra = document.querySelector('#tela-alunos .barra');
    const b = barra.querySelector('#proposta-nova');
    if (!b) return { achou: false, botoes: Array.from(barra.querySelectorAll('button')).map(x => x.textContent.trim()) };
    const novo = barra.querySelector('#novo-aluno');
    const r = b.getBoundingClientRect();
    const segue = (a, c) => !!(a.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING);
    return {
      achou: true, texto: b.textContent.trim(),
      aoLadoDeNovoAluno: !!novo && segue(b, novo),
      altura: Math.round(r.height), largura: Math.round(r.width)
    };
  });
  conf('há um botão Proposta na barra dos Alunos', naBarra.achou, true);
  if (!naBarra.achou) {
    console.log('  botões da barra: ' + JSON.stringify(naBarra.botoes));
    throw new Error('sem porta 1 não há o que testar');
  }
  conf('ele se chama Proposta', naBarra.texto, 'Proposta');
  conf('e fica ao lado de + Novo aluno', naBarra.aoLadoDeNovoAluno, true);
  conf('é alvo grande de tocar, para dedo em tablet', naBarra.altura >= 44, true);
  conf('e largo o bastante', naBarra.largura >= 44, true);

  await tocar('#proposta-nova');         // toque 2
  conf('o toque abre a janela própria da proposta', await visivel('#modal-proposta'), true);
  conf('e ela não abriu a janela do aluno junto', await visivel('#modal-aluno'), false);

  // ================================================================
  secao('2. A regra de ouro: sete blocos, fechados, com resumo de uma linha');

  const b0 = await blocos('#modal-proposta');
  conf('são sete blocos', b0.length, 7);
  conf('na ordem do documento', b0.map(b => b.titulo).join(' | '),
    'Quem | Ponto de partida | O que eu proponho trabalhar | Como funcionam os encontros | ' +
    'O combinado | Investimento | O que vem junto');
  conf('só dois nascem abertos', b0.filter(b => b.aberto).length, 2);
  conf('e são Quem e Investimento',
    b0.filter(b => b.aberto).map(b => b.titulo).join(', '), 'Quem, Investimento');
  conf('todo bloco tem resumo de uma linha', b0.every(b => b.resumo.length > 0), true);
  conf('nenhum resumo passa de uma linha de tablet', b0.every(b => b.resumo.length <= 90), true);
  conf('toda cabeça de bloco é alvo grande de tocar', b0.every(b => b.altura >= 44), true);
  conf('e ocupa a linha inteira', b0.every(b => b.largura > 400), true);
  conf('o resumo de Quem diz o que falta',
    b0[0].resumo, 'falta o nome do aluno');
  conf('e ele aparece marcado como falta', b0[0].falta, true);
  conf('o combinado já nasce com as duas folgas por semestre',
    /2 folgas por semestre/.test(b0[4].resumo), true);
  conf('e sem o aviso de que elas foram desligadas',
    /sem as folgas/.test(b0[4].resumo), false);
  conf('o investimento nasce em hora-aula', /por hora-aula/.test(b0[5].resumo), true);

  /* Cem reais é o padrão do aplicativo, e não um número dela: é o que sobrou de
   * não haver preço nenhum. Enquanto for esse número, a faixa avisa. */
  const faixaValor = () => pag.evaluate(() => {
    const b = window.__bloco('#modal-proposta', 'Investimento');
    const f = Array.from(b.querySelectorAll('.faixa-aviso'))
      .filter(x => getComputedStyle(x).display !== 'none')[0];
    return f ? f.textContent.replace(/\s+/g, ' ').trim() : '';
  });
  conf('o valor por hora avisa enquanto for o padrão do aplicativo',
    /é o padrão do aplicativo, e não o seu/.test(await faixaValor()), true);
  await digitar('#modal-proposta', 'valor-hora', '120');
  conf('e o aviso some no momento em que ela encosta no campo', await faixaValor(), '');
  conf('o resumo do bloco acompanha', (await blocos('#modal-proposta'))[5].resumo,
    'R$ 120,00 por hora-aula');
  await digitar('#modal-proposta', 'valor-hora', '100');

  /* Nenhum campo com foco automático: no tablet, foco automático abre o teclado
   * do sistema por cima da metade da tela, antes de ela ter lido qualquer
   * coisa. */
  const focoInicial = await pag.evaluate(() => document.activeElement.tagName);
  conf('nenhum campo pega o foco sozinho', ['BODY', 'HTML'].indexOf(focoInicial) >= 0, true);

  /* Nada de arrastar em lugar nenhum do editor: com a mão apoiada na mesa da
   * família, arrasto erra. Escolha é botão. */
  const arrasto = await pag.evaluate(() => {
    const m = document.querySelector('#modal-proposta');
    return {
      faixas: m.querySelectorAll('input[type=range]').length,
      arrastaveis: m.querySelectorAll('[draggable="true"]').length,
      segmentados: m.querySelectorAll('.segmentado').length
    };
  });
  conf('nenhuma faixa de arrastar no editor', arrasto.faixas, 0);
  conf('nada arrastável no editor', arrasto.arrastaveis, 0);
  conf('as escolhas são botões lado a lado', arrasto.segmentados > 0, true);

  /* Alvo de 44 por 44 em TODO botão do editor, e não só nos principais: a folha
   * inteira é preenchida de pé, na sala da família. */
  const alvos = await pag.evaluate(() => {
    const m = document.querySelector('#modal-proposta');
    return Array.from(m.querySelectorAll('button'))
      .filter(b => b.getClientRects().length > 0 && !b.classList.contains('fechar'))
      .map(b => ({ texto: b.textContent.replace(/\s+/g, ' ').trim().slice(0, 30),
        a: Math.round(b.getBoundingClientRect().height),
        l: Math.round(b.getBoundingClientRect().width) }));
  });
  const pequenos = alvos.filter(b => b.a < 44 || b.l < 44);
  if (pequenos.length) console.log('  pequenos: ' + JSON.stringify(pequenos));
  conf('todo botão do editor tem 44 por 44 de alvo', pequenos.length, 0);
  conf('numa proposta em branco não há botão de recomeçar, que não faria nada',
    await pag.evaluate(() => !!document.querySelector('#modal-proposta [data-acao="comecar-outra"]')),
    false);

  // ================================================================
  secao('3. O aluno que ainda não existe: dois campos e o rascunho que sobrevive');

  await digitar('#modal-proposta', 'aluno', ALUNA);
  await digitar('#modal-proposta', 'responsavel', RESPONSAVEL);

  const b1 = await blocos('#modal-proposta');
  conf('o resumo de Quem passou a dizer quem é',
    b1[0].resumo, ALUNA + ', responsável ' + RESPONSAVEL);
  conf('e deixou de acusar falta', b1[0].falta, false);

  /* Fechar a janela GUARDA o rascunho, ao contrário do mapeamento, que desiste:
   * a família da proposta ainda não existe no aplicativo, e perder o que ela
   * digitou seria perder tudo, sem ter para onde voltar. */
  await tocar('#modal-proposta [data-fechar]', false);
  conf('a janela fechou', await visivel('#modal-proposta'), false);
  await espera(500);
  let banco = await bd();
  conf('o rascunho foi para o disco', !!(banco.ajustes && banco.ajustes.propostaRascunho), true);
  conf('com o nome que ela digitou', banco.ajustes.propostaRascunho.aluno, ALUNA);
  conf('e é UM rascunho só, e não uma lista',
    Array.isArray(banco.ajustes.propostaRascunho), false);

  await tocar('#proposta-nova', false);
  conf('com nome digitado, o botão de recomeçar aparece',
    await pag.evaluate(() => !!document.querySelector('#modal-proposta [data-acao="comecar-outra"]')),
    true);
  const voltou = await pag.evaluate(() => ({
    aluno: document.querySelector('#modal-proposta [data-campo="aluno"]').value,
    responsavel: document.querySelector('#modal-proposta [data-campo="responsavel"]').value
  }));
  conf('reabrir traz o rascunho de volta', voltou.aluno, ALUNA);
  conf('com o responsável junto', voltou.responsavel, RESPONSAVEL);

  // ================================================================
  secao('4. O caminho mínimo: gerar o PDF com dois campos digitados');

  const antesDoPdf = await pag.evaluate(() => (window.__blobs || []).length);
  await tocar('#gerar-proposta');        // toque 3
  await espera(900);

  const depoisDoPdf = await pag.evaluate(() => (window.__blobs || []).length);
  conf('um PDF foi entregue', depoisDoPdf - antesDoPdf, 1);
  conf('e é PDF mesmo',
    await pag.evaluate(() => window.__blobs[window.__blobs.length - 1]), 'application/pdf');

  const av1 = await aviso();
  conf('o aviso aparece depois do PDF, e não antes', av1.aberto, true);
  conf('ele OFERECE cadastrar, com o nome da aluna',
    av1.texto, 'Proposta de ' + ALUNA + ' gerada. Cadastrar como aluno?');
  conf('e o botão do aviso é Cadastrar', av1.acao, 'Cadastrar');

  banco = await bd();
  conf('NADA foi cadastrado sozinho',
    banco.alunos.filter(a => a.nome === ALUNA).length, 0);
  conf('o rascunho ficou marcado como gerado',
    banco.ajustes.propostaRascunho.geradoEm, Core.hojeIso());

  const TOQUES_AVULSO = toques;
  conf('do aplicativo aberto ao PDF gerado, três toques dentro do aplicativo', TOQUES_AVULSO, 3);
  console.log('       (mais um toque no WhatsApp, na folha de compartilhamento do Android: 4 no total)');
  console.log('       (mais dois campos digitados: o aluno e o responsável)');

  const pdf1 = await textoDoUltimoPdf();
  conf('a folha traz o nome da aluna', pdf1.indexOf(ALUNA) >= 0, true);
  conf('e o responsável', pdf1.indexOf(RESPONSAVEL) >= 0, true);
  conf('e o valor por hora-aula', /por hora-aula/.test(pdf1), true);

  // ================================================================
  secao('5. A troca entre hora-aula e planos, com a conta conferida');

  await abrirBloco('#modal-proposta', 'Investimento');
  await tocarNoBloco('#modal-proposta', 'Investimento', '[data-campo="modo-cobranca"] [data-valor="planos"]');

  const tabela = await pag.evaluate(() => {
    const b = window.__bloco('#modal-proposta', 'Investimento');
    return Array.from(b.querySelectorAll('.linha-plano')).map(l => ({
      nome: l.querySelector('.nome').textContent.trim(),
      detalhe: l.querySelector('.detalhe').textContent.trim(),
      hora: l.querySelector('.por-hora').textContent.trim(),
      total: l.querySelector('.total').textContent.trim(),
      recomendado: l.classList.contains('recomendado')
    }));
  });
  conf('a tabela tem quatro linhas', tabela.length, 4);
  conf('a primeira é a aula avulsa', tabela[0].nome, 'Aula avulsa');
  conf('depois mensal, trimestral e semestral',
    tabela.slice(1).map(l => l.nome).join(', '), 'Mensal, Trimestral, Semestral');
  conf('uma linha só sai recomendada', tabela.filter(l => l.recomendado).length, 1);
  conf('e é a trimestral, que é o padrão dela',
    tabela.filter(l => l.recomendado)[0].nome, 'Trimestral');

  banco = await bd();
  const rasc = banco.ajustes.propostaRascunho;
  const contaEsperada = Core.calcularPlanos({
    ancora: rasc.cobranca.ancora, descontos: rasc.cobranca.descontos,
    porSemana: rasc.encontro.porSemana, duracaoMin: rasc.encontro.duracaoMin
  });
  conf('a âncora da tela é a que o Core calcula',
    tabela[0].hora, Core.fmtMoeda(contaEsperada.ancora) + ' por hora');
  contaEsperada.planos.forEach((pl, i) => {
    conf('a linha ' + pl.rotulo + ' mostra o valor por hora do Core',
      tabela[i + 1].hora, Core.fmtMoeda(pl.valorHora) + ' por hora');
    conf('e o total do período do Core', tabela[i + 1].total, Core.fmtMoeda(pl.total));
    conf('e quantos encontros são', tabela[i + 1].detalhe,
      pl.encontros + ' encontros de ' + Core.fmtDuracao(rasc.encontro.duracaoMin));
  });

  /* A escada exagerada avisa. Zero, cinco e dez é criticável; zero, quinze e
   * trinta lê como desespero e ainda destrói a receita de quem pagaria cheio. */
  const semAviso = await pag.evaluate(() =>
    !window.__bloco('#modal-proposta', 'Investimento').querySelector('[data-aviso="desconto"]'));
  conf('com a escada dela não há aviso de desconto', semAviso, true);
  await digitar('#modal-proposta', 'desconto-semestral', '40');
  await espera(300);
  const comAviso = await pag.evaluate(() => {
    const e = window.__bloco('#modal-proposta', 'Investimento').querySelector('[data-aviso="desconto"]');
    return e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
  });
  conf('a escada de 40 por cento avisa',
    /costuma soar como preço inventado/.test(comAviso), true);
  await digitar('#modal-proposta', 'desconto-semestral', '10');
  await espera(300);
  conf('voltando para dez, o aviso some', await pag.evaluate(() =>
    !window.__bloco('#modal-proposta', 'Investimento').querySelector('[data-aviso="desconto"]')), true);

  // ================================================================
  secao('6. O combinado: padrão editável, e as duas folgas do semestre');

  await abrirBloco('#modal-proposta', 'O combinado');
  const comb = await pag.evaluate(() => {
    const b = window.__bloco('#modal-proposta', 'O combinado');
    return Array.from(b.querySelectorAll('.item-combinado')).map(c => ({
      id: c.getAttribute('data-item'),
      ligado: c.querySelector('input[type=checkbox]').checked,
      rotulo: c.querySelector('input[type=text]').value,
      texto: c.querySelector('textarea').value,
      editavel: !c.querySelector('textarea').readOnly && !c.querySelector('textarea').disabled
    }));
  });
  conf('são sete partes no combinado', comb.length, 7);
  conf('todas nascem ligadas', comb.every(c => c.ligado), true);
  conf('e todas são editáveis, nunca texto fixo', comb.every(c => c.editavel), true);
  conf('a primeira é o material preparado antes, que é o argumento dela',
    comb[0].id, 'preparo');
  conf('e ela lidera pelo trabalho pedagógico, e não pelo horário que não se revende',
    /preparado antes/.test(comb[0].texto) && !/revend/i.test(comb[0].texto), true);
  const folgas = comb.filter(c => c.id === 'folgas')[0];
  conf('existe a parte das folgas por semestre', !!folgas, true);
  conf('ela diz que são duas', /duas desmarca/.test(folgas.texto), true);
  conf('e que não precisa dar explicação nenhuma',
    /explicação nenhuma/.test(folgas.texto), true);
  conf('e existe a parte de quando quem desmarca é ela',
    comb.filter(c => c.id === 'eu-desmarco').length, 1);

  /* Desligar as folgas não é proibido, porque o documento é dela. Mas é o
   * pedaço que não pode faltar, e o editor tem que dizer isso de um jeito que
   * ela veja com o bloco fechado. */
  await marcarNoBloco('#modal-proposta', 'O combinado', 'folgas');
  const semFolgas = await blocos('#modal-proposta');
  conf('desligar as folgas acende o alerta no resumo do bloco',
    /sem as folgas/.test(semFolgas[4].resumo), true);
  conf('e o resumo aparece marcado como falta', semFolgas[4].falta, true);
  const faixaFolgas = await pag.evaluate(() => {
    const b = window.__bloco('#modal-proposta', 'O combinado');
    const f = Array.from(b.querySelectorAll('.faixa-aviso'))
      .filter(x => getComputedStyle(x).display !== 'none')[0];
    return f ? f.textContent.replace(/\s+/g, ' ').trim() : '';
  });
  conf('e a faixa explica por que elas existem',
    /julgar se o motivo era bom o bastante/.test(faixaFolgas), true);
  await marcarNoBloco('#modal-proposta', 'O combinado', 'folgas');
  const comFolgas = await blocos('#modal-proposta');
  conf('religando, o alerta some', /sem as folgas/.test(comFolgas[4].resumo), false);

  // ================================================================
  secao('7. O que ela marca vira o plano de trabalho, e a folha nunca abre com defeito');

  await abrirBloco('#modal-proposta', 'Ponto de partida');
  await marcarNoBloco('#modal-proposta', 'Ponto de partida', 'pergunta');
  await marcarNoBloco('#modal-proposta', 'Ponto de partida', 'persiste');
  await marcarNoBloco('#modal-proposta', 'Ponto de partida', 'vespera');
  await marcarNoBloco('#modal-proposta', 'Ponto de partida', 'fracoes');
  await abrirBloco('#modal-proposta', 'O que eu proponho trabalhar');
  await marcarNoBloco('#modal-proposta', 'O que eu proponho trabalhar', 'cronograma');

  const b2 = await blocos('#modal-proposta');
  conf('o resumo do ponto de partida conta o que está marcado',
    b2[1].resumo, 'Matemática, 2 pontos fortes, 1 de atenção, 1 lacuna');
  conf('e o das áreas também', /1 área em 1 frente/.test(b2[2].resumo), true);

  /* O teto de seis não é enfeite: seis é conversa, dezenove é laudo. */
  const teto = await pag.evaluate(async () => {
    const b = window.__bloco('#modal-proposta', 'Ponto de partida');
    const caixas = Array.from(b.querySelectorAll('.corpo-bloco .grade-areas'));
    /* A grade de atenção é a que vem logo depois do título "Pontos de atenção". */
    let alvo = null;
    Array.from(b.querySelectorAll('.corpo-bloco h3')).forEach(h => {
      if (h.textContent === 'Pontos de atenção') {
        let n = h.nextElementSibling;
        while (n && !n.classList.contains('grade-areas')) n = n.nextElementSibling;
        alvo = n;
      }
    });
    if (!alvo) return { erro: 'não achei a grade de atenção' };
    const cxs = Array.from(alvo.querySelectorAll('input[type=checkbox]'));
    for (let i = 0; i < cxs.length; i++) {
      if (!cxs[i].checked) { cxs[i].click(); await new Promise(r => setTimeout(r, 20)); }
    }
    return { marcadas: cxs.filter(c => c.checked).length, total: cxs.length, sobra: caixas.length };
  });
  conf('marcar tudo em Pontos de atenção para no sexto', teto.marcadas, 6);
  conf('e havia mais itens para marcar', teto.total > 6, true);

  // ================================================================
  secao('8. Gerar de novo: o tom da folha e o que ela nunca diz');

  await tocar('#gerar-proposta', false);
  await espera(900);
  const pdf2 = await textoDoUltimoPdf();

  conf('a folha traz a seção do combinado',
    /Como funcionam os encontros/.test(pdf2), true);
  conf('e as duas folgas por semestre estão impressas',
    /duas desmarcações em cima da hora por semestre/.test(pdf2), true);
  conf('a tabela dos planos está na folha', /Total do per/.test(pdf2), true);
  conf('com o parágrafo que explica o desconto',
    /O desconto não é do preço da aula: é do compromisso/.test(pdf2), true);

  [['multa', /multa/i], ['taxa', /\btaxas?\b/i], ['cláusula', /cláusul/i],
  ['penalidade', /penalidad/i], ['rescisão', /rescis/i]].forEach(([nome, rx]) => {
    conf('a folha não usa a palavra ' + nome, rx.test(pdf2), false);
  });
  conf('não há linha de assinatura', /assinatura|assinar|assinado/i.test(pdf2), false);
  conf('nem campo de aceite: a resposta que ela quer é um sim no WhatsApp',
    /de acordo|aceite|ciente/i.test(pdf2), false);
  conf('e nenhum travessão em lugar nenhum da folha',
    /[\u2013\u2014]/.test(pdf2), false);

  /* A folha abre pelo que já funciona. Uma proposta que abre listando defeito
   * assusta e perde a família, que é o oposto do que ela existe para fazer. */
  const iForte = pdf2.indexOf('Pontos fortes');
  const iAtencao = pdf2.indexOf('Pontos de aten');
  conf('os pontos fortes vêm antes dos de atenção na folha',
    iForte >= 0 && (iAtencao < 0 || iForte < iAtencao), true);

  // ================================================================
  secao('9. Cadastrar depois de mandar, e o valor por hora que nasce junto');

  const av2 = await aviso();
  conf('o aviso voltou a oferecer cadastrar', av2.acao, 'Cadastrar');
  await tocar('#aviso-acao', false);
  await espera(900);

  banco = await bd();
  const criada = banco.alunos.filter(a => a.nome === ALUNA)[0];
  conf('a aluna entrou na lista', !!criada, true);
  conf('com o responsável', criada.responsavel, RESPONSAVEL);
  conf('com a proposta guardada na ficha', (criada.propostas || []).length, 1);
  conf('e com o mapeamento inicial já preenchido', (criada.mapeamentos || []).length, 1);
  const mapa = criada.mapeamentos[0];
  conf('o mapeamento traz os pontos fortes que ela marcou',
    (mapa.marcados.fortes || []).indexOf('pergunta') >= 0, true);
  conf('e a lacuna de anos anteriores',
    (mapa.marcados.lacunas || []).indexOf('fracoes') >= 0, true);
  conf('o rascunho foi embora depois de virar aluno',
    banco.ajustes.propostaRascunho, 'null');
  conf('a janela da proposta fechou junto', await visivel('#modal-proposta'), false);

  const av3 = await aviso();
  conf('o mesmo caminho OFERECE criar o valor por hora',
    av3.acao, 'Criar o valor');
  conf('e o aviso diz até quando a vigência vale',
    /até \d\d\/\d\d\/\d\d\d\d/.test(av3.texto), true);
  await tocar('#aviso-acao', false);
  await espera(900);

  banco = await bd();
  const comPreco = banco.alunos.filter(a => a.nome === ALUNA)[0];
  conf('a vigência nasceu em aluno.precos', (comPreco.precos || []).length, 1);
  const vigEsperada = Core.vigenciaDoPlano(comPreco.propostas[0], comPreco.propostas[0].cobranca.recomendado);
  conf('com o valor por hora do plano recomendado',
    comPreco.precos[0].valorHora, vigEsperada.valorHora);
  conf('e com o fim no fim do período', comPreco.precos[0].fim, vigEsperada.fim);
  conf('as vigências continuam válidas', Core.validarPrecos(comPreco).length, 0);
  conf('o fechamento passa a cobrar esse valor',
    (Core.precoVigente(comPreco, Core.hojeIso()) || {}).valorHora, vigEsperada.valorHora);

  /* Os padrões dela viajam para a próxima proposta: uma âncora só para todo
   * mundo, e o botão já no estado que ela usou da última vez. */
  conf('o modo de cobrança virou o padrão dela',
    (banco.ajustes.propostaPadrao || {}).modo, 'planos');
  conf('e a âncora ficou guardada',
    (banco.ajustes.propostaPadrao || {}).ancora, comPreco.propostas[0].cobranca.ancora);

  // ================================================================
  secao('10. Porta 2: a aba Proposta na ficha de quem já está cadastrado');

  toques = 0;
  await tocar('[data-tela="alunos"]');                        // toque 1
  await tocar('#lista-alunos [data-aluno="' + criada.id + '"]'); // toque 2
  conf('a ficha da aluna abriu', await visivel('#modal-aluno'), true);

  const abas = await pag.$$eval('#corpo-modal-aluno .aba-perfil', es => es.map(e => e.textContent.trim()));
  conf('a ficha ganhou a aba Proposta', abas.indexOf('Proposta') >= 0, true);
  conf('e ela vem depois de Histórico', abas.join(', '),
    'Dados, Valores, Mapeamento, Histórico, Proposta');

  await pag.evaluate(() => {
    Array.from(document.querySelectorAll('#corpo-modal-aluno .aba-perfil'))
      .filter(b => b.textContent.trim() === 'Proposta')[0].click();
  });
  toques++;                                                   // toque 3
  await espera(500);

  const bAba = await blocos('#corpo-modal-aluno');
  conf('a aba desenha o MESMO editor de sete blocos', bAba.length, 7);
  conf('com os mesmos títulos da janela',
    bAba.map(b => b.titulo).join(' | '), b0.map(b => b.titulo).join(' | '));
  conf('só dois abertos aqui também', bAba.filter(b => b.aberto).length, 2);
  conf('e tudo já vem preenchido, sem digitar nada',
    bAba[0].resumo, ALUNA + ', responsável ' + RESPONSAVEL);
  conf('o ponto de partida veio do mapeamento',
    /2 pontos fortes/.test(bAba[1].resumo), true);
  conf('e nada aparece faltando', bAba.filter(b => b.falta).length, 0);

  const linhaUltima = await pag.evaluate(() => {
    const t = document.querySelector('#corpo-modal-aluno').textContent.replace(/\s+/g, ' ');
    const m = t.match(/Última proposta em \d\d\/\d\d\/\d\d\d\d/);
    return m ? m[0] : '';
  });
  conf('a aba diz quando foi a última proposta',
    linhaUltima, 'Última proposta em ' + Core.ddmmaaaa(Core.hojeIso()));

  const antesAba = await pag.evaluate(() => (window.__blobs || []).length);
  await tocar('#corpo-modal-aluno [data-acao="gerar-proposta"]');  // toque 4
  await espera(900);
  conf('gerou o PDF a partir da aba',
    await pag.evaluate(() => (window.__blobs || []).length) - antesAba, 1);
  conf('do aplicativo aberto ao PDF, quatro toques para quem já é aluno', toques, 4);
  console.log('       (mais um toque no WhatsApp: 5 no total, e ZERO digitação)');

  await pag.screenshot({ path: path.join(__dirname, 'v_proposta_aba.png') });

  banco = await bd();
  const depoisAba = banco.alunos.filter(a => a.nome === ALUNA)[0];
  conf('regerar no mesmo dia continua sendo a MESMA proposta, e não uma segunda',
    (depoisAba.propostas || []).length, 1);
  conf('e a vigência não foi duplicada', (depoisAba.precos || []).length, 1);

  /* Oferecer de novo o valor que já está lá seria pedir um toque para não mudar
   * nada, e aceitar criaria uma segunda vigência igual que o validarPrecos
   * recusa. */
  const av4 = await aviso();
  conf('o aviso não oferece criar o valor que já existe igual', av4.acao, '');
  conf('e diz só que a proposta foi guardada',
    av4.texto, 'Proposta gerada e guardada na ficha de ' + ALUNA + '.');

  // ================================================================
  secao('11. Porta 3: o botão ao lado de Gerar ficha em PDF, na aba Mapeamento');

  await pag.evaluate(() => {
    Array.from(document.querySelectorAll('#corpo-modal-aluno .aba-perfil'))
      .filter(b => b.textContent.trim() === 'Mapeamento')[0].click();
  });
  await espera(400);

  const naFileira = await pag.evaluate(() => {
    const ficha = document.querySelector('#pdf-mapeamento');
    const prop = document.querySelector('#proposta-do-mapeamento');
    if (!ficha || !prop) return { achou: false };
    const r = prop.getBoundingClientRect();
    return {
      achou: true,
      texto: prop.textContent.trim(),
      mesmaFileira: ficha.parentElement === prop.parentElement,
      altura: Math.round(r.height)
    };
  });
  conf('há um botão de proposta na aba Mapeamento', naFileira.achou, true);
  conf('ele se chama Gerar proposta', naFileira.texto, 'Gerar proposta');
  conf('e fica na mesma fileira de Gerar ficha em PDF', naFileira.mesmaFileira, true);
  conf('é alvo grande de tocar', naFileira.altura >= 44, true);

  await tocar('#proposta-do-mapeamento', false);
  const abaAtiva = await pag.$eval('#corpo-modal-aluno .aba-perfil.ativa', e => e.textContent.trim());
  conf('o toque leva direto para a aba Proposta', abaAtiva, 'Proposta');
  const bPorta3 = await blocos('#corpo-modal-aluno');
  conf('e ela chega preenchida', bPorta3[0].resumo, ALUNA + ', responsável ' + RESPONSAVEL);

  // ================================================================
  secao('12. A tela Alunos depois de tudo');

  await pag.evaluate(() => document.querySelector('#modal-aluno [data-fechar]').click());
  await espera(500);
  const naLista = await pag.evaluate((nome) => {
    const linha = Array.from(document.querySelectorAll('#lista-alunos .item-lista'))
      .filter(l => l.textContent.indexOf(nome) >= 0)[0];
    return linha ? linha.textContent.replace(/\s+/g, ' ').trim() : '';
  }, ALUNA);
  conf('a aluna aparece na lista', naLista.indexOf(ALUNA) >= 0, true);
  conf('e já com valor por hora, sem a etiqueta de falta',
    /falta o valor/.test(naLista), false);

  // ================================================================
  secao('13. Prints e erros de página');

  await pag.evaluate(() => document.querySelector('#proposta-nova').click());
  await espera(700);
  conf('reabrir a janela volta ao alto do documento',
    await pag.evaluate(() => document.querySelector('#corpo-modal-proposta').scrollTop), 0);
  conf('e o modo de cobrança já vem no estado da última vez',
    await pag.evaluate(() => window.__bloco('#modal-proposta', 'Investimento')
      .querySelector('[data-campo="modo-cobranca"] .opcao-seg.ativa').getAttribute('data-valor')),
    'planos');
  await pag.screenshot({ path: path.join(__dirname, 'v_proposta_deitado.png') });
  await pag.setViewport({ width: 800, height: 1280, hasTouch: true });
  await espera(600);
  await pag.screenshot({ path: path.join(__dirname, 'v_proposta_em_pe.png') });

  /* Em pé, a cabeça de cada bloco continua sendo alvo de dedo e o resumo
   * continua cabendo numa linha: é a orientação em que ela usa o tablet na sala
   * da família, apoiado no colo. */
  const emPe = await blocos('#modal-proposta');
  conf('em pé continuam sendo sete blocos', emPe.length, 7);
  conf('e todos continuam sendo alvo de dedo', emPe.every(b => b.altura >= 44), true);
  const rolagemLateral = await pag.evaluate(() =>
    document.querySelector('#corpo-modal-proposta').scrollWidth <=
    document.querySelector('#corpo-modal-proposta').clientWidth + 2);
  conf('e nada escapa para os lados', rolagemLateral, true);
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  await espera(400);

  const reais = errosDePagina.filter(e => !/favicon|manifest|sw\.js|ServiceWorker/i.test(e));
  reais.forEach(e => console.log('  ERRO: ' + e));
  conf('nenhum erro de JavaScript', reais.length, 0);

  await navegador.close();

  console.log('\n' + '='.repeat(60));
  console.log('TOQUES, aluno que ainda não existe: ' + TOQUES_AVULSO +
    ' dentro do aplicativo, mais o WhatsApp na folha do Android, e dois campos digitados.');
  console.log('TOQUES, aluno já cadastrado: 4 dentro do aplicativo, mais o WhatsApp, e nada digitado.');
  console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
  if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
  console.log('='.repeat(60));
  process.exit(falhas ? 1 : 0);
})().catch(e => {
  console.error('\nO teste parou com erro:', e.message);
  console.error(e.stack);
  process.exit(1);
});
