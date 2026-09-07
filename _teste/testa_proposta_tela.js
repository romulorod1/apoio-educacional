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
 *      Quanto custa nascem abertos.
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

  /* MUDOU DE PROPÓSITO, e as travas mudaram junto: o bloco do preço chamava
   * "Investimento" na tela e passou a se chamar "Quanto custa", que é o nome
   * que a seção do preço já tem na folha que a família lê.
   *
   * A mesma coisa tinha dois nomes. Quando a mãe ligasse citando "Quanto
   * custa", que é o que está escrito na folha, a professora procuraria esse
   * nome na tela e não acharia. O argumento que trocou o nome na folha, o de
   * escrever com as palavras que ela diria na sala da família, onde ninguém
   * pergunta qual é o investimento, vale igual no editor dela.
   *
   * Nenhuma trava foi afrouxada para isto: o nome trocou nos dois lados, e as
   * catorze buscas por bloco deste arquivo continuam exigindo o nome exato. */
  const b0 = await blocos('#modal-proposta');
  conf('são sete blocos', b0.length, 7);
  conf('na ordem do documento', b0.map(b => b.titulo).join(' | '),
    'Quem | Ponto de partida | O que eu proponho trabalhar | Como funcionam os encontros | ' +
    'Os nossos combinados | Quanto custa | O que vem junto');
  conf('só dois nascem abertos', b0.filter(b => b.aberto).length, 2);
  conf('e são Quem e Quanto custa',
    b0.filter(b => b.aberto).map(b => b.titulo).join(', '), 'Quem, Quanto custa');
  /* O bloco do preço tem UM nome só, e é o mesmo da folha: nome de tela e nome
   * de folha separados é o defeito que esta trava impede de voltar. */
  conf('e o bloco do preço não voltou a se chamar de outro jeito',
    b0.filter(b => b.titulo === 'Investimento').length, 0);
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
    const b = window.__bloco('#modal-proposta', 'Quanto custa');
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
  /* O rascunho deixou de ser UM e passou a ser uma LISTA, de propósito, nesta
   * mesma rodada. Era db.ajustes.propostaRascunho, um objeto só, e a segunda
   * família da tarde apagava a primeira: "Começar outra" avisava que a atual
   * não ficava guardada e a descartava. Quem já é aluno tem a proposta na
   * ficha; quem não é tinha só aquele campo, e a proposta é escrita
   * JUSTAMENTE para quem ainda não é. Agora é db.ajustes.propostaRascunhos,
   * lista, mais recente primeiro, e o campo antigo fica null depois de migrar. */
  conf('o rascunho foi para o disco',
    !!(banco.ajustes && (banco.ajustes.propostaRascunhos || []).length), true);
  conf('com o nome que ela digitou', banco.ajustes.propostaRascunhos[0].aluno, ALUNA);
  conf('e agora é uma LISTA de propostas em andamento, e não uma só',
    Array.isArray(banco.ajustes.propostaRascunhos), true);
  conf('com a data em que ela mexeu por último, para a lista poder se ordenar',
    /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d$/.test(banco.ajustes.propostaRascunhos[0].mexidoEm || ''), true);
  conf('e o campo antigo de um rascunho só ficou vazio',
    banco.ajustes.propostaRascunho, 'null');

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
    banco.ajustes.propostaRascunhos[0].geradoEm, Core.hojeIso());

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

  await abrirBloco('#modal-proposta', 'Quanto custa');
  await tocarNoBloco('#modal-proposta', 'Quanto custa', '[data-campo="modo-cobranca"] [data-valor="planos"]');

  const tabela = await pag.evaluate(() => {
    const b = window.__bloco('#modal-proposta', 'Quanto custa');
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
  const rasc = banco.ajustes.propostaRascunhos[0];
  /* As MESMAS entradas que a tela usa. O valorHora entrou porque a conta dos
   * planos passou a descer do preco que ela cobra hoje, e nao da ancora: sem
   * ele o teste compararia a tela com uma conta que ninguem faz.
   *
   * A ancora ficou sendo so a linha da aula avulsa, que e o preco de quem nao
   * reserva horario. Antes os tres planos saiam ACIMA do que ela cobra. */
  const contaEsperada = Core.calcularPlanos({
    ancora: rasc.cobranca.ancora, valorHora: rasc.cobranca.valorHora,
    descontos: rasc.cobranca.descontos,
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
    !window.__bloco('#modal-proposta', 'Quanto custa').querySelector('[data-aviso="desconto"]'));
  conf('com a escada dela não há aviso de desconto', semAviso, true);
  await digitar('#modal-proposta', 'desconto-semestral', '40');
  await espera(300);
  const comAviso = await pag.evaluate(() => {
    const e = window.__bloco('#modal-proposta', 'Quanto custa').querySelector('[data-aviso="desconto"]');
    return e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
  });
  conf('a escada de 40 por cento avisa',
    /costuma soar como preço inventado/.test(comAviso), true);
  await digitar('#modal-proposta', 'desconto-semestral', '10');
  await espera(300);
  conf('voltando para dez, o aviso some', await pag.evaluate(() =>
    !window.__bloco('#modal-proposta', 'Quanto custa').querySelector('[data-aviso="desconto"]')), true);

  /* Os rótulos do desconto diziam de quanto e calavam de que.
   *
   * Eram "Desconto no mensal (%)", "No trimestral (%)" e "No semestral (%)",
   * um palmo abaixo de "Âncora: a hora avulsa". Quem lê os quatro na ordem
   * conclui que o desconto sai da âncora, e não sai: sai do preço que ela
   * cobra hoje. O Rômulo leu a tela assim e perguntou se a conta estava
   * errada; a conta estava certa e o rótulo estava errado.
   *
   * Este teste não confere o texto exato, que pode ser reescrito melhor: ele
   * confere as três coisas que não podem voltar a faltar. Primeira, a base
   * está escrita ali, com o número. Segunda, o número é O DA CONTA, e não
   * outro: um rótulo que dissesse a base certa com o valor errado seria a
   * mesma mentira noutro lugar. Terceira, o valor que manda na conta aparece
   * no bloco, em campo à vista, no modo Planos: antes ele morava dentro do
   * caixaHora, que some justamente aí. */
  const cobranca = await pag.evaluate(() => {
    const b = window.__bloco('#modal-proposta', 'Quanto custa');
    const campo = document.querySelector('#modal-proposta [data-campo="valor-hora"]');
    return {
      base: b.querySelector('[data-rotulo="base-desconto"]').textContent.replace(/\s+/g, ' ').trim(),
      ajudaDaConta: b.querySelector('[data-ajuda="conta-dos-planos"]').textContent.replace(/\s+/g, ' ').trim(),
      ancora: Array.from(b.querySelectorAll('label.campo > span'))
        .filter(s => /Âncora/.test(s.textContent))[0].textContent.trim(),
      rotulos: Array.from(b.querySelectorAll('label.campo > span')).map(s => s.textContent.trim()),
      valorHoraNaTela: !!(campo && campo.getClientRects().length),
      valorHoraNoBloco: !!(campo && b.contains(campo))
    };
  });
  const precoDeHoje = Core.fmtMoeda(rasc.cobranca.valorHora);
  conf('o valor que manda na conta aparece no bloco de cobrança',
    cobranca.valorHoraNoBloco && cobranca.valorHoraNaTela, true);
  conf('e continua à vista no modo Planos, que é onde ele é a base',
    cobranca.valorHoraNaTela, true);
  conf('o rótulo dos descontos diz de que base eles descem',
    /preço de hoje/.test(cobranca.base), true);
  conf('e diz com o número, que é ' + precoDeHoje,
    cobranca.base.indexOf(precoDeHoje) >= 0, true);
  conf('nenhum rótulo de desconto manda ler a âncora',
    cobranca.rotulos.filter(r => /\(%\)/.test(r) && /ncora/.test(r)).length, 0);
  conf('os três rótulos curtos continuam nomeando os três planos',
    cobranca.rotulos.filter(r => /^(Mensal|Trimestral|Semestral) \(%\)$/.test(r)).length, 3);
  conf('o rótulo da âncora fecha o escopo dela na própria linha',
    /avulsa/.test(cobranca.ancora) && /só/.test(cobranca.ancora), true);
  conf('a ajuda embaixo da tabela também desce do preço de hoje, e não da âncora',
    /A conta é o seu preço de hoje/.test(cobranca.ajudaDaConta), true);
  conf('e diz em voz alta que a âncora não entra na conta',
    /A âncora não entra/.test(cobranca.ajudaDaConta), true);
  conf('nenhum lugar do bloco ainda diz que a conta é âncora vezes o desconto',
    /âncora vezes o desconto/.test(cobranca.ajudaDaConta), false);

  /* Trocar o preço de hoje no modo Planos redesenha a tabela no mesmo toque.
   * Enquanto o campo vivia dentro do caixaHora isto não podia acontecer, e ela
   * conferia números velhos. */
  await digitar('#modal-proposta', 'valor-hora', '130');
  await espera(400);
  const depoisDeTrocar = await pag.evaluate(() => {
    const b = window.__bloco('#modal-proposta', 'Quanto custa');
    return {
      base: b.querySelector('[data-rotulo="base-desconto"]').textContent.replace(/\s+/g, ' ').trim(),
      mensal: Array.from(b.querySelectorAll('.linha-plano'))
        .filter(l => l.querySelector('.nome').textContent.trim() === 'Mensal')[0]
        .querySelector('.por-hora').textContent.trim()
    };
  });
  conf('trocado o preço de hoje, o rótulo da base acompanha',
    depoisDeTrocar.base.indexOf('R$ 130,00') >= 0, true);
  conf('e a linha do mensal, que é o preço dela sem desconto, vira R$ 130,00',
    depoisDeTrocar.mensal, 'R$ 130,00 por hora');
  /* Devolve o bloco ao estado em que as seções seguintes o encontram. A âncora
   * volta à mão porque o conferirAncora só a faz SUBIR: trocando o preço para
   * 130 ela subiu para 150 e não desceria sozinha. */
  await digitar('#modal-proposta', 'valor-hora', String(rasc.cobranca.valorHora));
  await espera(300);
  await digitar('#modal-proposta', 'ancora', String(rasc.cobranca.ancora));
  await espera(400);
  conf('o bloco voltou ao preço e à âncora de antes da conferência',
    await pag.evaluate(() => {
      const b = window.__bloco('#modal-proposta', 'Quanto custa');
      return document.querySelector('#modal-proposta [data-campo="valor-hora"]').value + '/' +
        b.querySelector('[data-campo="ancora"]').value;
    }),
    rasc.cobranca.valorHora + '/' + rasc.cobranca.ancora);

  // ================================================================
  secao('6. Os nossos combinados: padrão editável, e as duas folgas do semestre');

  await abrirBloco('#modal-proposta', 'Os nossos combinados');
  const comb = await pag.evaluate(() => {
    const b = window.__bloco('#modal-proposta', 'Os nossos combinados');
    return Array.from(b.querySelectorAll('.item-combinado')).map(c => ({
      id: c.getAttribute('data-item'),
      ligado: c.querySelector('input[type=checkbox]').checked,
      rotulo: c.querySelector('input[type=text]').value,
      texto: c.querySelector('textarea').value,
      editavel: !c.querySelector('textarea').readOnly && !c.querySelector('textarea').disabled
    }));
  });
  /* Oito desde que entrou a falta sem aviso, que e o unico caso que o motor
 * cobra inteiro por padrao e que o combinado nao mencionava. */
  conf('são oito partes no combinado', comb.length, 8);
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
  await marcarNoBloco('#modal-proposta', 'Os nossos combinados', 'folgas');
  const semFolgas = await blocos('#modal-proposta');
  conf('desligar as folgas acende o alerta no resumo do bloco',
    /sem as folgas/.test(semFolgas[4].resumo), true);
  conf('e o resumo aparece marcado como falta', semFolgas[4].falta, true);
  const faixaFolgas = await pag.evaluate(() => {
    const b = window.__bloco('#modal-proposta', 'Os nossos combinados');
    const f = Array.from(b.querySelectorAll('.faixa-aviso'))
      .filter(x => getComputedStyle(x).display !== 'none')[0];
    return f ? f.textContent.replace(/\s+/g, ' ').trim() : '';
  });
  conf('e a faixa explica por que elas existem',
    /julgar se o motivo era bom o bastante/.test(faixaFolgas), true);
  await marcarNoBloco('#modal-proposta', 'Os nossos combinados', 'folgas');
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
  /* Virou aluno, sai da lista: a proposta passa a morar na ficha dele, e
   * deixá-la nos dois lugares faria a lista oferecer um rascunho com dono. */
  conf('o rascunho saiu da lista depois de virar aluno',
    (banco.ajustes.propostaRascunhos || []).filter(r => r.aluno === ALUNA).length, 0);
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
  secao('9b. As propostas em andamento: duas famílias na mesma tarde');

  /* O buraco que esta lista fecha é o da tarde de três famílias.
   *
   * Antes havia UM rascunho só, e o "Começar outra" avisava que a proposta
   * aberta não ficava guardada e a descartava. Quem já é aluno tem a proposta
   * na ficha; quem ainda não é tinha só aquele campo, e é para quem ainda não
   * é que a proposta existe. A segunda família apagava a primeira.
   *
   * Este teste percorre a tarde inteira: escreve a primeira, começa a segunda,
   * volta para a primeira, apaga a segunda e recarrega a página. Recarregar é
   * a parte que ninguém lembra de olhar e é a que ela vive: o tablet atualiza
   * o aplicativo sozinho no meio da aula. */

  const ALUNA2 = 'Bento Alves';
  const RESP2 = 'Paula Alves';

  /* A linha inteira, e não só o nome: é o conjunto do que sai escrito nela que
   * decide se ela consegue distinguir uma proposta da outra antes de tocar no
   * Apagar, que não tem volta. O "texto" é a linha do jeito que o olho dela vê,
   * e é por ele que a trava das duas Helenas compara caractere por caractere. */
  const listaNaTela = () => pag.evaluate(() => Array.from(
    document.querySelectorAll('#modal-proposta .linha-rascunho')).map(l => ({
      id: l.getAttribute('data-rascunho'),
      nome: l.querySelector('.nome').textContent.trim(),
      quando: l.querySelector('.quando').textContent.trim(),
      trecho: (l.querySelector('.trecho') || { textContent: '' }).textContent.trim(),
      texto: l.textContent.replace(/\s+/g, ' ').trim(),
      altura: Math.round(l.getBoundingClientRect().height),
      aberta: l.classList.contains('aberta'),
      temAbrir: !!l.querySelector('[data-acao="abrir-rascunho"]'),
      temApagar: !!l.querySelector('[data-acao="apagar-rascunho"]')
    })));

  /* Primeiro a metade honesta da regra: quem identifica a linha é o NOME, e
   * sem nome não há linha. Uma proposta escrita sem nome nenhum não fica
   * guardada, e ela precisa saber disso ANTES de tocar, e não depois. */
  await tocar('[data-tela="alunos"]', false);
  await tocar('#proposta-nova', false);
  await digitar('#modal-proposta', 'colegio', 'Colégio São Vicente');
  await espera(1900);
  const perguntasSemNome = [];
  const anotarSemNome = d => perguntasSemNome.push(d.message());
  pag.on('dialog', anotarSemNome);
  await tocar('#modal-proposta [data-acao="comecar-outra"]', false);
  await espera(700);
  pag.off('dialog', anotarSemNome);
  conf('sem nome, Começar outra avisa que a aberta não fica guardada',
    perguntasSemNome.some(t => /não tem nome de aluno/.test(t) &&
      /não fica guardada/.test(t)), true);
  banco = await bd();
  conf('e rascunho sem nome nenhum não ganha linha na lista',
    (banco.ajustes.propostaRascunhos || []).filter(r => String(r.aluno || '').trim()).length, 0);

  /* A janela continua aberta, agora na proposta em branco que o Começar outra
   * abriu: é aqui que a tarde de duas famílias começa de verdade. */
  conf('e a janela seguiu numa proposta em branco',
    await pag.evaluate(() => document.querySelector('#modal-proposta [data-campo="colegio"]').value), '');
  await digitar('#modal-proposta', 'aluno', ALUNA);
  await digitar('#modal-proposta', 'responsavel', RESPONSAVEL);
  await espera(1900);
  /* A lista aparece já na PRIMEIRA proposta com nome. Enquanto ela só aparecia
   * da segunda em diante, a única proposta guardada ficava sem o Apagar, e
   * logo depois do Começar outra, com a aberta ainda em branco, a que ela
   * acabara de guardar sumia da tela até um nome novo ser digitado. */
  let naTela = await listaNaTela();
  conf('a lista existe já na primeira proposta com nome', naTela.length, 1);
  conf('e ela é a que está aberta', naTela[0].aberta, true);
  conf('e tem como ser apagada', naTela[0].temApagar, true);

  await tocar('#modal-proposta [data-acao="comecar-outra"]', false);
  conf('Começar outra abre uma proposta em branco',
    await pag.evaluate(() => document.querySelector('#modal-proposta [data-campo="aluno"]').value), '');
  banco = await bd();
  /* O ponto do pedido: a anterior NÃO foi descartada. */
  conf('e a anterior ficou guardada, em vez de ser descartada',
    (banco.ajustes.propostaRascunhos || []).filter(r => r.aluno === ALUNA).length, 1);
  naTela = await listaNaTela();
  conf('e continua alcançável na lista, com a nova ainda em branco',
    naTela.length === 1 && naTela[0].nome === ALUNA && naTela[0].temAbrir, true);

  await digitar('#modal-proposta', 'aluno', ALUNA2);
  await digitar('#modal-proposta', 'responsavel', RESP2);
  await espera(1900);

  naTela = await listaNaTela();
  conf('agora são duas propostas em andamento', naTela.length, 2);
  conf('a mais recente primeiro, que é a que ela está escrevendo', naTela[0].nome, ALUNA2);
  conf('e ela aparece marcada como aberta', naTela[0].aberta, true);
  conf('a aberta não tem botão de abrir, que seria um toque sem efeito',
    naTela[0].temAbrir, false);
  conf('a outra é identificada pelo nome do aluno', naTela[1].nome, ALUNA);
  /* A HORA vai junto, e não só o dia. Sem ela, duas propostas mexidas hoje
   * saíam com a mesma frase, e a lista existe para não perder proposta. */
  conf('e pela hora em que ela mexeu por último',
    /^mexida hoje às \d\d:\d\d$/.test(naTela[1].quando), true);
  conf('as duas podem ser apagadas',
    naTela.filter(l => l.temApagar).length, 2);

  /* A lista fotografada nas duas orientações. Ela vira o tablet no colo o tempo
   * todo, e é no alto da janela que a lista disputa espaço com o primeiro campo
   * do editor. */
  await pag.evaluate(() => { document.querySelector('#corpo-modal-proposta').scrollTop = 0; });
  await espera(200);
  await pag.screenshot({ path: path.join(__dirname, 'v_rascunhos_deitado.png') });
  await pag.setViewport({ width: 800, height: 1280, hasTouch: true });
  await espera(600);
  await pag.evaluate(() => { document.querySelector('#corpo-modal-proposta').scrollTop = 0; });
  await espera(200);
  await pag.screenshot({ path: path.join(__dirname, 'v_rascunhos_em_pe.png') });
  const alvosDaLista = await pag.evaluate(() => Array.from(
    document.querySelectorAll('#modal-proposta .linha-rascunho button'))
    .filter(b => b.getClientRects().length)
    .map(b => ({ t: b.textContent.replace(/\s+/g, ' ').trim().slice(0, 24),
      a: Math.round(b.getBoundingClientRect().height),
      l: Math.round(b.getBoundingClientRect().width) })));
  conf('em pé, todo botão da lista continua sendo alvo de 44 por 44',
    alvosDaLista.filter(b => b.a < 44 || b.l < 44).length, 0);
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  await espera(500);

  /* Alternar: abrir a outra retoma de onde parou, com o que ela digitou. */
  await pag.evaluate((nome) => {
    Array.from(document.querySelectorAll('#modal-proposta .linha-rascunho'))
      .filter(l => l.querySelector('.nome').textContent.trim() === nome)[0]
      .querySelector('[data-acao="abrir-rascunho"]').click();
  }, ALUNA);
  await espera(700);
  const retomada = await pag.evaluate(() => ({
    aluno: document.querySelector('#modal-proposta [data-campo="aluno"]').value,
    responsavel: document.querySelector('#modal-proposta [data-campo="responsavel"]').value
  }));
  conf('abrir a outra retoma de onde ela parou', retomada.aluno, ALUNA);
  conf('com o responsável junto', retomada.responsavel, RESPONSAVEL);
  naTela = await listaNaTela();
  conf('e a marca de aberta trocou de linha',
    naTela.filter(l => l.aberta)[0].nome, ALUNA);
  conf('a que ficou para trás continua na lista, e não sumiu',
    naTela.filter(l => l.nome === ALUNA2).length, 1);

  /* Apagar, com confirmação. Lista que só cresce vira lixo. */
  const perguntas = [];
  const anotar = d => perguntas.push(d.message());
  pag.on('dialog', anotar);
  await pag.evaluate((nome) => {
    Array.from(document.querySelectorAll('#modal-proposta .linha-rascunho'))
      .filter(l => l.querySelector('.nome').textContent.trim() === nome)[0]
      .querySelector('[data-acao="apagar-rascunho"]').click();
  }, ALUNA2);
  await espera(900);
  pag.off('dialog', anotar);
  conf('apagar pergunta antes, com o nome do aluno na pergunta',
    perguntas.some(t => t.indexOf('Apagar a proposta de ' + ALUNA2) === 0), true);
  /* E a pergunta diz a MESMA hora que a linha. É na pergunta que o engano vira
   * definitivo: com dois alunos de mesmo nome na lista, uma pergunta que só
   * dissesse o nome seria idêntica nas duas linhas e confirmar não seria uma
   * decisão. */
  conf('e com a hora em que ela mexeu, que é o que separa duas de mesmo nome',
    perguntas.some(t => /Apagar a proposta de .+, mexida (hoje|ontem) às \d\d:\d\d\?/.test(t)), true);
  banco = await bd();
  conf('apagada, ela sai do disco também',
    (banco.ajustes.propostaRascunhos || []).filter(r => r.aluno === ALUNA2).length, 0);
  conf('e a que sobrou continua inteira',
    (banco.ajustes.propostaRascunhos || []).filter(r => r.aluno === ALUNA).length, 1);
  naTela = await listaNaTela();
  conf('sobrou uma linha na lista, a da que ficou', naTela.length, 1);
  conf('e é a proposta certa', naTela[0].nome, ALUNA);

  /* Recarregar a página, que é o que o tablet faz sozinho quando a atualização
   * entra. Nada pode se perder aí. */
  await pag.reload({ waitUntil: 'networkidle0' });
  await espera(2000);
  await fecharNovidades();
  await tocar('[data-tela="alunos"]', false);
  await tocar('#proposta-nova', false);
  conf('recarregada a página, a proposta em andamento volta inteira',
    await pag.evaluate(() => document.querySelector('#modal-proposta [data-campo="aluno"]').value),
    ALUNA);
  conf('e o responsável volta com ela',
    await pag.evaluate(() => document.querySelector('#modal-proposta [data-campo="responsavel"]').value),
    RESPONSAVEL);

  // ================================================================
  secao('9c. Duas propostas com o MESMO NOME, e o Apagar que não tem volta');

  /* O defeito que este bloco fecha: duas propostas com o mesmo nome de aluno
   * saíam na lista iguais caractere por caractere, "Helena Prado / mexida hoje
   * / Apagar", e as duas perguntas do Apagar também. Dali em diante o Apagar
   * tinha metade de chance de destruir a proposta errada, e ele não tem volta:
   * apagarRascunho grava direto, sem passar pelo desfazer, numa lista cuja
   * razão de existir é não perder proposta.
   *
   * E é alcançável em três toques: abrir a proposta da família, tocar em
   * Começar outra e digitar o mesmo nome de novo, que é o que acontece quando a
   * mesma família volta ou quando ela recomeça a proposta do zero. Nome
   * repetido também não é caso de laboratório: duas crianças de mesmo nome numa
   * turma é comum, e nesse caso o parágrafo é a única coisa que de fato
   * distingue as duas.
   *
   * O relógio das propostas semeadas é RELATIVO ao relógio de verdade, de
   * propósito: um horário fixo escrito à mão poderia coincidir com o minuto em
   * que o teste roda, e aí duas linhas voltariam a sair iguais por acaso,
   * escondendo justamente o que este bloco persegue. */
  const doisDig = n => String(n).padStart(2, '0');
  const carimboAtras = (minutos) => {
    const d = new Date(Date.now() - minutos * 60000);
    return d.getFullYear() + '-' + doisDig(d.getMonth() + 1) + '-' + doisDig(d.getDate()) +
      'T' + doisDig(d.getHours()) + ':' + doisDig(d.getMinutes()) + ':' + doisDig(d.getSeconds());
  };
  const semear = (rascunhos) => pag.evaluate((lista) => new Promise((resolve) => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const b = req.result;
      const st = b.transaction('dados', 'readwrite').objectStore('dados');
      const g = st.get('principal');
      g.onsuccess = () => {
        const d = g.result;
        d.ajustes = d.ajustes || {};
        d.ajustes.propostaRascunhos = lista;
        d.ajustes.propostaRascunho = null;
        st.put(d, 'principal').onsuccess = () => resolve(true);
      };
    };
  }), rascunhos);

  const HELENA = 'Helena Prado';
  const PARAGRAFO_A = 'A Helena chegou no 7º ano com a tabuada firme e trava na divisão com vírgula.';
  const PARAGRAFO_B = 'A Helena do 3º ano lê tudo sozinha e ainda soma contando nos dedos.';
  const semeados = [
    { id: 'igual-b', aluno: HELENA, responsavel: 'Cláudia Prado', texto: PARAGRAFO_B, atras: 95 },
    { id: 'igual-a', aluno: HELENA, responsavel: 'Marina Prado', texto: PARAGRAFO_A, atras: 240 },
    { id: 'outro-1', aluno: 'Bianca Toledo', responsavel: 'Ana Toledo', atras: 300,
      texto: 'Bianca quer inglês para a viagem de intercâmbio de julho.' },
    { id: 'outro-2', aluno: 'Otávio Lins', responsavel: 'Sérgio Lins', atras: 400,
      texto: 'Otávio precisa recuperar física antes da prova final.' },
    /* Este é o parágrafo COMPRIDO de propósito: é ele que prova que o corte do
     * trecho cai em palavra inteira, e não no meio de uma. */
    { id: 'outro-3', aluno: 'Rafael Muniz', responsavel: 'Denise Muniz', atras: 1500,
      texto: 'Rafael veio de uma escola que não deu geometria nenhuma e chegou aqui achando ' +
        'que não sabe nada de matemática, o que não é verdade.' },
    { id: 'outro-4', aluno: 'Sofia Andrade', responsavel: 'Paulo Andrade', atras: 1600,
      texto: 'Sofia se perde em interpretação de texto longo.' }
  ];

  await tocar('#modal-proposta [data-fechar]', false);
  await espera(500);
  await semear(semeados.map(r => ({
    id: r.id, aluno: r.aluno, responsavel: r.responsavel, texto: r.texto,
    data: carimboAtras(r.atras).slice(0, 10), mexidoEm: carimboAtras(r.atras),
    cobranca: { modo: 'hora', valorHora: 120, ancora: 140,
      descontos: { mensal: 0, trimestral: 5, semestral: 10 }, recomendado: 'trimestral' }
  })));
  await pag.reload({ waitUntil: 'networkidle0' });
  await espera(2000);
  await fecharNovidades();
  await tocar('[data-tela="alunos"]', false);
  await tocar('#proposta-nova', false);
  await espera(500);

  /* Começar outra guarda a que a janela abriu sozinha e deixa as seis todas
   * FECHADAS: é esse o estado em que a lista é lida de relance, e é nele que as
   * duas linhas iguais apareciam. */
  await tocar('#modal-proposta [data-acao="comecar-outra"]', false);
  await espera(900);
  naTela = await listaNaTela();
  conf('as seis propostas em andamento estão na lista', naTela.length, 6);
  conf('e nenhuma está aberta, que é como ela lê a lista de relance',
    naTela.filter(l => l.aberta).length, 0);
  const helenas = naTela.filter(l => l.nome === HELENA);
  conf('duas delas têm o mesmo nome de aluno', helenas.length, 2);
  conf('e as duas linhas NÃO saem iguais caractere por caractere',
    helenas[0].texto === helenas[1].texto, false);
  conf('nenhuma linha da lista repete outra',
    new Set(naTela.map(l => l.texto)).size, 6);
  conf('a hora em que ela mexeu aparece escrita, e não só o dia',
    helenas.every(l => /^mexida (hoje|ontem) às \d\d:\d\d$/.test(l.quando)), true);
  conf('e as duas horas são diferentes', helenas[0].quando === helenas[1].quando, false);
  /* O parágrafo é o desempate do desempate: duas propostas de mesmo nome
   * mexidas no MESMO minuto ainda assim se separam, porque é ali que ela
   * escreve com as palavras dela sobre cada criança. */
  conf('o começo do parágrafo de uma aparece na linha dela',
    naTela.filter(l => l.id === 'igual-a')[0].trecho, PARAGRAFO_A);
  conf('e o da outra na linha da outra',
    naTela.filter(l => l.id === 'igual-b')[0].trecho, PARAGRAFO_B);
  /* Parágrafo comprido: o corte cai em palavra inteira. O mesmo texto entra na
   * pergunta do Apagar, onde é lido inteiro e não encolhido pelo CSS, e palavra
   * partida no meio se lê como defeito no segundo em que ela decide. */
  const compridoNaTela = naTela.filter(l => l.id === 'outro-3')[0].trecho;
  const compridoInteiro = semeados.filter(r => r.id === 'outro-3')[0].texto;
  console.log('       (parágrafo comprido, ' + compridoInteiro.length +
    ' caracteres, sai na linha como: ' + compridoNaTela + ')');
  conf('parágrafo comprido é cortado', compridoNaTela.length < compridoInteiro.length, true);
  conf('e o corte avisa que continua', compridoNaTela.slice(-1), '…');
  conf('e cai em palavra inteira, e não no meio de uma',
    compridoInteiro.indexOf(compridoNaTela.slice(0, -1) + ' ') , 0);

  /* O trecho entrou SEM custar altura: ele divide a linha da hora em vez de
   * criar uma terceira. Medido no tablet em pé com a lista nos oito do teto: a
   * linha tem 51 px de alvo mais 8 de respiro, e o fim do bloco Quem continua
   * em 984 px num corpo de 1067, o mesmo número de antes do trecho existir. Em
   * três linhas a mesma medida dava 1124, com o primeiro campo do editor já
   * cortado pelo rodapé. */
  console.log('       (altura das linhas da lista, deitado: ' +
    naTela.map(l => l.altura).join(', ') + ' px)');
  conf('e a linha da lista não engordou: 51 px de alvo, 59 com o respiro',
    naTela.every(l => l.altura <= 51), true);

  /* O print da lista cheia, nas duas orientações, com as duas Helenas dentro:
   * é nele que se vê que as duas linhas deixaram de ser a mesma linha. */
  await pag.evaluate(() => { document.querySelector('#corpo-modal-proposta').scrollTop = 0; });
  await espera(200);
  await pag.screenshot({ path: path.join(__dirname, 'v_rascunhos_iguais_deitado.png') });
  await pag.setViewport({ width: 800, height: 1280, hasTouch: true });
  await espera(600);
  await pag.evaluate(() => { document.querySelector('#corpo-modal-proposta').scrollTop = 0; });
  await espera(200);
  await pag.screenshot({ path: path.join(__dirname, 'v_rascunhos_iguais_em_pe.png') });
  const emPeIguais = await listaNaTela();
  const textosEmPe = emPeIguais.filter(l => l.nome === HELENA).map(l => l.texto);
  conf('em pé, as duas de mesmo nome continuam se distinguindo',
    textosEmPe[0] === textosEmPe[1], false);
  console.log('       (altura das linhas da lista, em pé: ' +
    emPeIguais.map(l => l.altura).join(', ') + ' px)');
  conf('e em pé a linha continua nos 51 px de alvo',
    emPeIguais.every(l => l.altura <= 51), true);
  conf('em pé, todo botão da lista continua sendo alvo de 44 por 44',
    await pag.evaluate(() => Array.from(
      document.querySelectorAll('#modal-proposta .linha-rascunho button'))
      .filter(b => b.getClientRects().length)
      .filter(b => b.getBoundingClientRect().height < 44 ||
        b.getBoundingClientRect().width < 44).length), 0);
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  await espera(500);

  /* As duas perguntas do Apagar também saíam byte a byte iguais, e é na
   * pergunta que o engano vira definitivo. */
  const perguntasIguais = [];
  const anotarIguais = d => perguntasIguais.push(d.message());
  pag.on('dialog', anotarIguais);
  await pag.evaluate(() => document.querySelector(
    '#modal-proposta [data-rascunho="igual-a"] [data-acao="apagar-rascunho"]').click());
  await espera(900);
  await pag.evaluate(() => document.querySelector(
    '#modal-proposta [data-rascunho="igual-b"] [data-acao="apagar-rascunho"]').click());
  await espera(900);
  pag.off('dialog', anotarIguais);
  /* As duas perguntas saem escritas no relatório: é o texto que ela lê no
   * segundo em que decide, e ele precisa ser conferido por olho humano também,
   * e não só por asserção. */
  perguntasIguais.forEach(t => console.log('       (pergunta: ' +
    t.replace(/\s+/g, ' ').trim() + ')'));
  conf('o Apagar perguntou nas duas vezes', perguntasIguais.length, 2);
  conf('e as duas perguntas não saem iguais',
    perguntasIguais[0] === perguntasIguais[1], false);
  conf('a pergunta de uma cita o parágrafo dela',
    perguntasIguais[0].indexOf(PARAGRAFO_A) >= 0, true);
  conf('e a da outra cita o da outra',
    perguntasIguais[1].indexOf(PARAGRAFO_B) >= 0, true);
  banco = await bd();
  conf('as duas de mesmo nome saíram do disco',
    (banco.ajustes.propostaRascunhos || []).filter(r => r.aluno === HELENA).length, 0);

  // ================================================================
  secao('9d. Apagar a proposta que está ABERTA, que é o caso delicado');

  /* Este caminho não tinha teste nenhum, e o comentário do próprio código diz
   * que é o delicado: são quatro efeitos em sequência, e nada travava se um
   * sumisse. A janela ficaria mostrando uma proposta que não existe mais, ou
   * fecharia na cara dela no meio da tarde. O teste de tela apagava justamente
   * a linha que NÃO estava aberta. */
  await pag.evaluate(() => document.querySelector(
    '#modal-proposta [data-rascunho="outro-1"] [data-acao="abrir-rascunho"]').click());
  await espera(800);
  const antesDeApagar = await listaNaTela();
  conf('a proposta que ela abriu é a que está marcada como aberta',
    antesDeApagar[0].id + '/' + antesDeApagar[0].aberta, 'outro-1/true');
  conf('e há uma seguinte na lista para a janela cair', antesDeApagar.length >= 2, true);
  const seguinte = antesDeApagar[1];

  const perguntaAberta = [];
  const anotarAberta = d => perguntaAberta.push(d.message());
  pag.on('dialog', anotarAberta);
  await pag.evaluate(() => document.querySelector(
    '#modal-proposta [data-rascunho="outro-1"] [data-acao="apagar-rascunho"]').click());
  await espera(1200);
  pag.off('dialog', anotarAberta);
  conf('apagar a aberta também pergunta antes, e diz de quem é',
    perguntaAberta.some(t => t.indexOf('Apagar a proposta de ' + antesDeApagar[0].nome) === 0), true);
  conf('a janela continua aberta, e não fecha na cara dela',
    await visivel('#modal-proposta'), true);
  conf('e o campo do nome passou a mostrar a proposta seguinte da lista',
    await pag.evaluate(() => document.querySelector('#modal-proposta [data-campo="aluno"]').value),
    seguinte.nome);
  naTela = await listaNaTela();
  conf('a apagada sumiu da lista', naTela.filter(l => l.id === 'outro-1').length, 0);
  conf('e a seguinte é a que está aberta agora',
    naTela.filter(l => l.aberta).map(l => l.id).join(','), seguinte.id);
  banco = await bd();
  conf('a apagada sumiu do disco também',
    (banco.ajustes.propostaRascunhos || []).filter(r => r.id === 'outro-1').length, 0);

  /* Recarregar é a parte que ninguém lembra de olhar e é a que ela vive: o
   * tablet atualiza o aplicativo sozinho no meio da aula. Apagada é para não
   * voltar, e o que sobrou é para voltar inteiro. */
  await pag.reload({ waitUntil: 'networkidle0' });
  await espera(2000);
  await fecharNovidades();
  await tocar('[data-tela="alunos"]', false);
  await tocar('#proposta-nova', false);
  await espera(500);
  naTela = await listaNaTela();
  conf('e recarregar não a traz de volta', naTela.filter(l => l.id === 'outro-1').length, 0);
  conf('as outras voltam todas, e nenhuma foi junto',
    naTela.map(l => l.id).sort().join(','), 'outro-2,outro-3,outro-4');

  /* Sobra da migração: quem tinha um rascunho no campo antigo tem que
   * encontrá-lo na lista. Gravado direto no banco, como uma versão anterior o
   * teria deixado, e a janela é reaberta. */
  await tocar('#modal-proposta [data-fechar]', false);
  await espera(500);
  await pag.evaluate(() => new Promise((resolve) => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const b = req.result;
      const st = b.transaction('dados', 'readwrite').objectStore('dados');
      const g = st.get('principal');
      g.onsuccess = () => {
        const d = g.result;
        d.ajustes = d.ajustes || {};
        d.ajustes.propostaRascunhos = [];
        d.ajustes.propostaRascunho = {
          id: 'rascunho-da-versao-antiga', aluno: 'Zoé do Campo Antigo',
          responsavel: 'Mãe da Zoé', data: '2026-01-15',
          cobranca: { modo: 'hora', valorHora: 120, ancora: 140,
            descontos: { mensal: 0, trimestral: 5, semestral: 10 }, recomendado: 'trimestral' }
        };
        st.put(d, 'principal').onsuccess = () => resolve(true);
      };
    };
  }));
  await pag.reload({ waitUntil: 'networkidle0' });
  await espera(2000);
  await fecharNovidades();
  await tocar('[data-tela="alunos"]', false);
  await tocar('#proposta-nova', false);
  conf('quem tinha rascunho no campo antigo o encontra, e não o perde',
    await pag.evaluate(() => document.querySelector('#modal-proposta [data-campo="aluno"]').value),
    'Zoé do Campo Antigo');
  banco = await bd();
  conf('ele passou a morar na lista', (banco.ajustes.propostaRascunhos || []).length, 1);
  conf('e o campo antigo ficou vazio, para não ressuscitar o que ela apagar',
    banco.ajustes.propostaRascunho, 'null');

  /* O teto. Sem ele a lista acumula para sempre, e onze linhas no tablet em pé
   * empurram o primeiro campo do editor para fora da tela (medido: o bloco Quem
   * termina a 984 px com oito linhas e a 1102 com dez, num corpo de 1067). */
  await tocar('#modal-proposta [data-fechar]', false);
  await espera(500);
  await pag.evaluate(() => new Promise((resolve) => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const b = req.result;
      const st = b.transaction('dados', 'readwrite').objectStore('dados');
      const g = st.get('principal');
      g.onsuccess = () => {
        const d = g.result;
        const nomes = ['Alice Prado', 'Caio Serra', 'Duda Lima', 'Eva Rocha', 'Fábio Nunes',
          'Gael Pinto', 'Hugo Reis', 'Íris Melo', 'Joana Tavares', 'Lia Barros'];
        d.ajustes.propostaRascunhos = nomes.map((n, i) => ({
          id: 'teto' + i, aluno: n, responsavel: 'Responsável de ' + n.split(' ')[0],
          data: '2026-08-' + String(10 + i).padStart(2, '0'),
          mexidoEm: '2026-08-' + String(10 + i).padStart(2, '0') + 'T09:00:00',
          cobranca: { modo: 'hora', valorHora: 120, ancora: 140,
            descontos: { mensal: 0, trimestral: 5, semestral: 10 }, recomendado: 'trimestral' }
        }));
        d.ajustes.propostaRascunho = null;
        st.put(d, 'principal').onsuccess = () => resolve(true);
      };
    };
  }));
  await pag.reload({ waitUntil: 'networkidle0' });
  await espera(2000);
  await fecharNovidades();
  await tocar('[data-tela="alunos"]', false);
  await tocar('#proposta-nova', false);
  await espera(500);
  naTela = await listaNaTela();
  conf('a lista tem teto, e ele vale na tela', naTela.length, 8);
  conf('o teto guarda as mais recentes, e não as primeiras que chegaram',
    naTela.map(l => l.nome).join(', '),
    'Lia Barros, Joana Tavares, Íris Melo, Hugo Reis, Gael Pinto, Fábio Nunes, Eva Rocha, Duda Lima');
  banco = await bd();
  conf('e vale no disco também, senão a poda seria só de fachada',
    (banco.ajustes.propostaRascunhos || []).length, 8);
  const avTeto = await aviso();
  conf('o que o teto derrubou é dito por nome, e não some calado',
    /Alice Prado/.test(avTeto.texto) && /Caio Serra/.test(avTeto.texto), true);

  /* E a tela volta ao estado que as próximas seções esperam. */
  await pag.evaluate(() => new Promise((resolve) => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const b = req.result;
      const st = b.transaction('dados', 'readwrite').objectStore('dados');
      const g = st.get('principal');
      g.onsuccess = () => {
        const d = g.result;
        d.ajustes.propostaRascunhos = [];
        d.ajustes.propostaRascunho = null;
        st.put(d, 'principal').onsuccess = () => resolve(true);
      };
    };
  }));
  await pag.reload({ waitUntil: 'networkidle0' });
  await espera(2000);
  await fecharNovidades();

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
    await pag.evaluate(() => window.__bloco('#modal-proposta', 'Quanto custa')
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
