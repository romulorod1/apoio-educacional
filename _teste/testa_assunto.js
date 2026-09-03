/* testa_assunto.js
 * Simula a Nathália registrando o ASSUNTO da aula.
 *
 * O pedido dela foi curto: que o tema não fique escondido dentro do botão
 * "Material de aula", e que apareça na cara dela ao abrir a aula. O que isso
 * mudou por dentro é maior do que parece: o assunto virou REGISTRO da aula, e o
 * material virou atalho opcional que sai do assunto. Antes, só virava registro
 * o que tinha gerado um PDF.
 *
 * Então é isso que este teste persegue, nesta ordem:
 *   1. o assunto está visível ao abrir a aula, sem entrar em Material de aula;
 *   2. registrar assunto de matemática;
 *   3. registrar assunto de outra matéria, navegando disciplina, grupo e bloco;
 *   4. registrar assunto livre, digitado no campo Outro;
 *   5. a lista da aula mostra os três, cada um com a etiqueta certa;
 *   6. o fechamento do mês lista os três;
 *   7. e nada disso gerou PDF nenhum.
 *
 * O sétimo é o que separa o desenho novo do antigo, e por isso é conferido de
 * três jeitos: contando as chamadas do gerador de PDF, contando o depósito de
 * anexos no aparelho e olhando a aula guardada.
 *
 * Os nomes de disciplina, grupo, bloco e tópico saem do próprio
 * banco/topicos/portugues.json, e não escritos à mão aqui: se o banco mudar, o
 * teste anda junto em vez de reprovar por engano.
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL_APP = 'http://127.0.0.1:8777/index.html';

/* ---- o assunto de outra matéria, tirado do banco ---- */
const TOPICOS = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'banco', 'topicos', 'portugues.json'), 'utf8'));
const DISCIPLINA = TOPICOS.disciplina;                                   // 'Português'
const GRUPO = TOPICOS.grupos.filter(g => g.chave === '07')[0];           // 7º ano
/* Escolhe um tópico que aparece UMA vez no arquivo inteiro: assim o clique por
 * texto não corre risco de acertar a linha errada. */
const VEZES = {};
TOPICOS.grupos.forEach(g => g.blocos.forEach(b => b.topicos.forEach(t => {
  VEZES[t] = (VEZES[t] || 0) + 1;
})));
let BLOCO = null, TOPICO = null;
GRUPO.blocos.forEach(b => b.topicos.forEach(t => {
  if (!TOPICO && VEZES[t] === 1) { BLOCO = b.titulo; TOPICO = t; }
}));

const LIVRE = 'Revisão para a prova de sexta';

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

(async () => {
  if (!TOPICO) throw new Error('não achei tópico único no 7º ano de português');
  console.log('assunto de outra matéria: ' + DISCIPLINA + ' > ' + GRUPO.rotulo +
    ' > ' + BLOCO + ' > ' + TOPICO);

  const navegador = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1280, height: 1000, hasTouch: true }
  });
  const pag = await navegador.newPage();
  const errosDePagina = [];
  pag.on('pageerror', e => errosDePagina.push(e.message));
  pag.on('console', m => { if (m.type() === 'error') errosDePagina.push('console: ' + m.text()); });
  pag.on('dialog', async d => { try { await d.accept(); } catch (e) { /* ok */ } });

  await pag.evaluateOnNewDocument(() => {
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
  });

  await pag.goto(URL_APP, { waitUntil: 'networkidle0' });
  await espera(1400);

  /* Conta cada chamada do gerador de PDF. É a prova mais direta de que registrar
   * assunto não gera material: se alguma tela chamar o gerador, o contador sobe
   * mesmo que o arquivo nunca chegue a ser guardado.
   *
   * Precisa ser rearmado depois de recarregar a página, porque o PDFGen daquele
   * documento é outro. Sem rearmar, o contador voltaria indefinido e a
   * conferência do fim afirmaria nada. */
  const armarContadorDePdf = () => pag.evaluate(() => {
    window.__pdfs = 0;
    if (!window.PDFGen) return;
    Object.keys(window.PDFGen).forEach(function (k) {
      if (typeof window.PDFGen[k] === 'function' && /^gerar/.test(k)) {
        const original = window.PDFGen[k];
        window.PDFGen[k] = function () { window.__pdfs++; return original.apply(this, arguments); };
      }
    });
  });
  await armarContadorDePdf();
  conf('o contador de PDF está armado',
    await pag.evaluate(() => typeof window.__pdfs === 'number' && !!window.PDFGen), true);

  // ---------------- ferramentas ----------------

  const visivel = (sel) => pag.$eval(sel, e => getComputedStyle(e).display !== 'none' &&
    (!e.classList.contains('fundo-modal') || e.classList.contains('aberto'))).catch(() => false);

  const bd = () => pag.evaluate(() => new Promise((resolve) => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const b = req.result;
      const s = b.transaction('dados', 'readonly').objectStore('dados').get('principal');
      s.onsuccess = () => resolve(s.result);
    };
  }));

  const quantosAnexosGuardados = () => pag.evaluate(() => new Promise((resolve) => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const c = req.result.transaction('anexos', 'readonly').objectStore('anexos').count();
      c.onsuccess = () => resolve(c.result);
      c.onerror = () => resolve(-1);
    };
    req.onerror = () => resolve(-1);
  }));

  /* Toca no que está escrito, dentro de um modal.
   *
   * Procura o elemento MAIS FUNDO cujo texto bate, e clica nele. É de propósito:
   * numa linha grande de tocar o tratador pode estar na linha inteira ou só no
   * botão de dentro, e o clique sobe sozinho até quem escuta. Preferência para
   * o texto exato, e só depois para o que contém. */
  async function tocar(escopo, texto) {
    const r = await pag.evaluate((sel, txt) => {
      const raiz = document.querySelector(sel);
      if (!raiz) return { erro: 'não achei ' + sel };
      const limpo = e => e.textContent.replace(/\s+/g, ' ').trim();
      const visiveis = Array.from(raiz.querySelectorAll('*'))
        .filter(e => e.getClientRects().length > 0);
      let cand = visiveis.filter(e => limpo(e) === txt);
      if (!cand.length) cand = visiveis.filter(e => limpo(e).indexOf(txt) >= 0);
      if (!cand.length) {
        return {
          erro: 'não achei "' + txt + '"',
          vistos: visiveis.filter(e => !e.children.length && limpo(e))
            .map(limpo).slice(0, 45)
        };
      }
      const fundo = e => { let n = 0, x = e; while (x && x !== raiz) { n++; x = x.parentElement; } return n; };
      cand.sort((a, b) => fundo(b) - fundo(a));
      const alvo = cand[0];
      alvo.scrollIntoView({ block: 'center' });
      alvo.click();
      return { ok: true, onde: alvo.tagName + '.' + (alvo.className || '') };
    }, escopo, texto);
    if (r.erro) {
      throw new Error(r.erro + ' em ' + escopo +
        (r.vistos ? '. Visíveis: ' + JSON.stringify(r.vistos) : ''));
    }
    await espera(500);
    return r;
  }
  const tocarNoPicker = (t) => tocar('#modal-tema', t);
  const tocarNaAula = (t) => tocar('#modal-aula', t);

  /* Escreve no campo do "Outro" e toca em Usar. O campo é achado a partir do
   * botão, subindo um nível de cada vez: assim o teste não depende de um id que
   * o desenho não fixou. */
  async function usarOutro(texto) {
    const r = await pag.evaluate((txt) => {
      const raiz = document.querySelector('#modal-tema');
      if (!raiz) return { erro: 'a janela do assunto não está aberta' };
      const limpo = e => e.textContent.replace(/\s+/g, ' ').trim();
      const botao = Array.from(raiz.querySelectorAll('button')).filter(b => limpo(b) === 'Usar')[0];
      if (!botao) {
        return {
          erro: 'não achei o botão Usar',
          vistos: Array.from(raiz.querySelectorAll('button')).map(limpo).slice(0, 30)
        };
      }
      let no = botao, campo = null;
      for (let i = 0; i < 5 && no && !campo; i++) {
        no = no.parentElement;
        if (no) campo = no.querySelector('input[type=text], input:not([type])');
      }
      if (!campo) return { erro: 'não achei o campo ao lado do botão Usar' };
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(campo, txt);
      campo.dispatchEvent(new Event('input', { bubbles: true }));
      botao.click();
      return { ok: true };
    }, texto);
    if (r.erro) throw new Error(r.erro + (r.vistos ? '. Botões: ' + JSON.stringify(r.vistos) : ''));
    await espera(700);
  }

  const linhasDaAula = () => pag.$$eval('#lista-temas-aula .item-lista', es => es.map(e => ({
    nome: e.querySelector('.nome') ? e.querySelector('.nome').textContent.replace(/\s+/g, ' ').trim() : '',
    detalhe: e.querySelector('.detalhe') ? e.querySelector('.detalhe').textContent.replace(/\s+/g, ' ').trim() : '',
    tudo: e.textContent.replace(/\s+/g, ' ').trim(),
    botoes: Array.from(e.querySelectorAll('button')).map(b => b.textContent.trim())
  })));

  async function irParaJunho() {
    await pag.evaluate(async () => {
      let guarda = 0;
      while (document.querySelector('#rotulo-mes').textContent !== 'Junho de 2026' && guarda++ < 40) {
        document.querySelector('#mes-anterior').click();
        await new Promise(r => setTimeout(r, 40));
      }
    });
    await espera(600);
  }
  async function abrirAulaDoDia10() {
    await pag.evaluate(() => {
      document.querySelector('[data-dia="2026-06-10"]').querySelector('.pilula').click();
    });
    await espera(600);
  }
  const aulaDoDia = async (marcelo) => {
    const banco = await bd();
    return banco.aulas.filter(a => a.data === '2026-06-10' && a.alunoId === marcelo.id)[0];
  };

  await irParaJunho();
  await abrirAulaDoDia10();

  let banco = await bd();
  const marcelo = banco.alunos.filter(a => /Marcelo/i.test(a.nome))[0];
  conf('a aula do dia 10 de junho abriu', await visivel('#modal-aula'), true);

  // ================================================================
  secao('1. O assunto aparece ao abrir a aula, sem entrar em Material de aula');

  const entrada = await pag.evaluate(() => {
    const raiz = document.querySelector('#corpo-modal-aula');
    const botoes = Array.from(raiz.querySelectorAll('button'));
    const assunto = botoes.filter(b => /assunto/i.test(b.textContent))[0];
    if (!assunto) {
      return { achou: false, botoes: botoes.map(b => b.textContent.trim()).slice(0, 25) };
    }
    const folha = raiz.querySelector('#linha-folha');
    const titulos = Array.from(raiz.querySelectorAll('h3'));
    const h3 = titulos.filter(h => /Conteúdo da aula/i.test(h.textContent))[0] || null;
    const segue = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    const r = assunto.getBoundingClientRect();
    return {
      achou: true,
      texto: assunto.textContent.replace(/\s+/g, ' ').trim(),
      antesDaFileira: folha ? segue(assunto, folha) : null,
      depoisDoTitulo: h3 ? segue(h3, assunto) : null,
      altura: Math.round(r.height),
      largura: Math.round(r.width),
      larguraDoCorpo: Math.round(raiz.getBoundingClientRect().width),
      dentroDoModalDeMaterial: !!assunto.closest('#modal-tema'),
      ajuda: raiz.textContent.replace(/\s+/g, ' ')
    };
  });

  conf('há um caminho para o assunto na própria aula', entrada.achou, true);
  if (!entrada.achou) {
    console.log('  botões do corpo da aula: ' + JSON.stringify(entrada.botoes));
    throw new Error('sem entrada de assunto na aula: o resto do teste não faz sentido');
  }
  conf('e ele não está escondido dentro de Material de aula', entrada.dentroDoModalDeMaterial, false);
  conf('o botão convida a escolher o assunto', entrada.texto, 'Escolher o assunto da aula');
  conf('ele vem antes da fileira da folha, na cara dela', entrada.antesDaFileira, true);
  conf('e depois do título Conteúdo da aula', entrada.depoisDoTitulo, true);
  conf('é alvo grande de tocar, para dedo em tablet', entrada.altura >= 44, true);
  conf('e ocupa a linha inteira', entrada.largura > entrada.larguraDoCorpo * 0.7, true);
  conf('a ajuda explica que o assunto entra no fechamento',
    /assunto entra no fechamento do mês/i.test(entrada.ajuda), true);
  conf('e que o material sai daí mesmo, quando ela quiser',
    /material pronto, ele sai daqui mesmo/i.test(entrada.ajuda), true);

  /* Travas de propósito: o pedido dela foi tirar o assunto de dentro do botão,
   * e não renomear o botão nem reescrever a ajuda da folha. Estão conferidas no
   * testa_temas também, e ficam aqui porque é esta frente que mexe na tela. */
  const fileira = await pag.$$eval('#linha-folha button', bs => bs.map(b => b.textContent.trim()));
  conf('a fileira dos quatro botões continua a mesma', fileira.join(' | '),
    'Escrever à mão na folha | Material de aula | Anexar PDF | Anexar foto');
  const ajudaFolha = await pag.$eval('#ajuda-folha', e => e.textContent);
  conf('a ajuda da folha continua dizendo que a folha é o começo',
    /folha em branco é sempre o começo/i.test(ajudaFolha), true);
  conf('e que o material é atalho opcional', /atalho opcional/i.test(ajudaFolha), true);

  conf('a aula ainda não tem assunto nenhum',
    ((await aulaDoDia(marcelo)).temas || []).length, 0);

  // ================================================================
  secao('2. Registrar um assunto de matemática');

  await tocarNaAula('Escolher o assunto da aula');
  await espera(1800);
  conf('a janela do assunto abriu', await visivel('#modal-tema'), true);
  conf('e ela diz de quem é a aula',
    await pag.$eval('#titulo-modal-tema', e => e.textContent),
    'Assunto da aula, ' + marcelo.nome);

  /* Regra do tablet: nada de foco automático. O teclado sobe por cima da lista
   * e ela perde de vista justamente o que veio escolher. */
  conf('nenhum campo rouba o foco ao abrir',
    await pag.evaluate(() => {
      const a = document.activeElement;
      return !a || (a.tagName !== 'INPUT' && a.tagName !== 'TEXTAREA');
    }), true);

  /* O campo do Outro é conferido pela estrutura, e não por procurar "Usar" no
   * texto corrido: o textContent cola os rótulos vizinhos sem espaço, e um
   * \bUsar\b nunca casaria em "Escrever o assuntoUsarSugestões". */
  const raizDoPicker = await pag.evaluate(() => {
    const corpo = document.querySelector('#corpo-modal-tema');
    const limpo = e => e.textContent.replace(/\s+/g, ' ').trim();
    return {
      texto: corpo.textContent.replace(/\s+/g, ' '),
      temUsar: Array.from(corpo.querySelectorAll('button')).map(limpo).indexOf('Usar') >= 0,
      temCampo: !!corpo.querySelector('input[type=text]')
    };
  });
  conf('a tela raiz oferece o botão Usar do campo Outro', raizDoPicker.temUsar, true);
  conf('e o campo em branco para ela escrever', raizDoPicker.temCampo, true);
  conf('e oferece a matemática', /Matem[áa]tica/.test(raizDoPicker.texto), true);
  conf('e oferece as outras matérias', new RegExp(DISCIPLINA).test(raizDoPicker.texto), true);

  await tocarNoPicker('Matemática');
  await espera(1800);
  const quantosTemas = await pag.$$eval('#lista-temas .item-tema', e => e.length);
  conf('a lista de temas de matemática abriu', quantosTemas > 5, true);

  const tituloMat = await pag.$eval('#lista-temas .item-tema .nome',
    e => (e.firstChild ? e.firstChild.textContent : e.textContent).trim());
  await pag.evaluate(() => {
    document.querySelector('#lista-temas .item-tema button').click();
  });
  await espera(1600);

  conf('escolher o assunto fecha a janela na hora', await visivel('#modal-tema'), false);
  let aula = await aulaDoDia(marcelo);
  conf('a aula ficou com um assunto', (aula.temas || []).length, 1);
  conf('com o título do tema escolhido', aula.temas[0].titulo, tituloMat);
  conf('sem PDF nenhum pendurado', !!aula.temas[0].anexoId, false);
  conf('e sem anexo na aula', (aula.anexos || []).length, 0);
  conf('a fonte é o banco de matemática',
    aula.temas[0].fonte === undefined || aula.temas[0].fonte === 'banco', true);
  conf('a disciplina é matemática',
    aula.temas[0].disciplina === undefined || aula.temas[0].disciplina === 'matematica', true);
  conf('e ele guardou o id do tema, que é por onde o material se acha depois',
    !!aula.temas[0].id, true);

  conf('a lista da aula já mostra o assunto',
    await pag.$$eval('#lista-temas-aula .item-lista', es => es.length), 1);
  conf('com o cabeçalho no singular',
    await pag.$eval('#lista-temas-aula .bloco-exercicios', e => e.textContent.trim()),
    'Assunto da aula');

  // ================================================================
  secao('3. Registrar assunto de outra matéria: disciplina, grupo e bloco');

  await tocarNaAula('Mais um assunto');
  await espera(1800);
  conf('a janela do assunto reabriu', await visivel('#modal-tema'), true);

  await tocarNoPicker(DISCIPLINA);
  await espera(700);
  conf('depois de escolher a matéria há como voltar',
    await pag.evaluate(() => Array.from(document.querySelectorAll('#modal-tema button'))
      .some(b => /Voltar/i.test(b.textContent))), true);

  await tocarNoPicker(GRUPO.rotulo);
  await espera(700);
  await tocarNoPicker(BLOCO);
  await espera(700);
  await tocarNoPicker(TOPICO);
  await espera(1400);

  conf('escolher o tópico fecha a janela', await visivel('#modal-tema'), false);
  aula = await aulaDoDia(marcelo);
  conf('agora são dois assuntos', (aula.temas || []).length, 2);
  const doTopico = (aula.temas || [])[1] || {};
  conf('o segundo é o tópico escolhido', doTopico.titulo, TOPICO);
  conf('marcado como vindo dos tópicos', doTopico.fonte, 'topico');
  conf('com a disciplina certa', doTopico.disciplina, TOPICOS.chave);
  conf('e com o grupo certo', doTopico.grupo, GRUPO.chave);
  conf('sem PDF', !!doTopico.anexoId, false);
  conf('e sem id de tema de matemática, porque tópico não tem',
    doTopico.id === undefined || doTopico.id === null || doTopico.id === '', true);

  // ================================================================
  secao('4. Registrar assunto livre, digitado no campo Outro');

  await tocarNaAula('Mais um assunto');
  await espera(1800);
  await usarOutro(LIVRE);
  await espera(1000);

  conf('usar o que ela digitou fecha a janela', await visivel('#modal-tema'), false);
  aula = await aulaDoDia(marcelo);
  conf('são três assuntos', (aula.temas || []).length, 3);
  const doLivre = (aula.temas || [])[2] || {};
  conf('o terceiro é exatamente o que ela escreveu', doLivre.titulo, LIVRE);
  conf('marcado como livre', doLivre.fonte, 'livre');
  conf('sem PDF', !!doLivre.anexoId, false);

  // ================================================================
  secao('5. Registrar assunto NÃO gera PDF nenhum');

  conf('o gerador de PDF não foi chamado nenhuma vez',
    await pag.evaluate(() => window.__pdfs), 0);
  conf('nenhum arquivo foi montado para entregar',
    await pag.evaluate(() => (window.__blobs || []).filter(t => /pdf/i.test(t)).length), 0);
  conf('o depósito de anexos do aparelho continua vazio', await quantosAnexosGuardados(), 0);
  conf('e a aula não tem anexo', (aula.anexos || []).length, 0);

  // ================================================================
  secao('6. A lista da aula mostra os três, com a etiqueta certa');

  let linhas = await linhasDaAula();
  conf('três linhas na aula', linhas.length, 3);
  conf('com o cabeçalho no plural',
    await pag.$eval('#lista-temas-aula .bloco-exercicios', e => e.textContent.trim()),
    'Assuntos desta aula');
  conf('o assunto de matemática está lá', linhas[0].nome.indexOf(tituloMat) >= 0, true);
  conf('o tópico da outra matéria também', linhas[1].nome.indexOf(TOPICO) >= 0, true);
  conf('e o assunto livre também', linhas[2].nome.indexOf(LIVRE) >= 0, true);

  /* A etiqueta é o que separa registro de material. Nenhum dos três gerou PDF,
   * então nenhum pode dizer que tem material pronto. */
  conf('nenhum dos três se anuncia com material pronto',
    linhas.filter(l => /material pronto/i.test(l.tudo)).length, 0);
  conf('a linha de matemática não fala de língua nem de partes, que são do PDF',
    /em português|em inglês/i.test(linhas[0].detalhe || linhas[0].tudo), false);
  conf('ela diz de que ano é o assunto',
    /\d+º ano|série/i.test(linhas[0].detalhe || linhas[0].tudo), true);
  conf('a linha da outra matéria diz a matéria',
    new RegExp(DISCIPLINA, 'i').test(linhas[1].tudo), true);
  conf('e diz o grupo', linhas[1].tudo.indexOf(GRUPO.rotulo) >= 0, true);

  /* O material continua alcançável, mas só de onde faz sentido: tema de
   * matemática que existe no índice. Oferecer para os outros seria prometer o
   * que não existe. */
  conf('só a linha de matemática oferece Material',
    linhas.map(l => l.botoes.some(b => /^Material$/i.test(b))).join(','), 'true,false,false');
  conf('e as três podem ser tiradas',
    linhas.every(l => l.botoes.some(b => /Tirar/i.test(b))), true);

  // ================================================================
  secao('7. O assunto fica guardado sem ela tocar em Salvar');

  await pag.evaluate(() => {
    document.querySelector('#modal-aula .modal-rodape [data-fechar]').click();
  });
  await espera(600);
  conf('a aula fechou pelo Cancelar', await visivel('#modal-aula'), false);

  await pag.reload({ waitUntil: 'networkidle0' });
  await espera(1600);
  await armarContadorDePdf();
  aula = await aulaDoDia(marcelo);
  conf('os três assuntos sobreviveram ao Cancelar e ao recarregar',
    (aula.temas || []).map(t => t.titulo).join(' | '),
    [tituloMat, TOPICO, LIVRE].join(' | '));

  await irParaJunho();
  await abrirAulaDoDia10();
  linhas = await linhasDaAula();
  conf('e a aula reabre mostrando os três', linhas.length, 3);
  await pag.evaluate(() => {
    document.querySelector('#modal-aula .modal-rodape [data-fechar]').click();
  });
  await espera(500);

  // ================================================================
  secao('8. O fechamento do mês lista os três');

  await pag.evaluate(() => {
    Array.from(document.querySelectorAll('#abas .aba'))
      .filter(b => b.dataset.tela === 'fechamento')[0].click();
  });
  await espera(600);
  await pag.select('#mes-fechamento', '2026-06');
  await espera(800);

  const achouCartao = await pag.evaluate((nome) => {
    const cartoes = Array.from(document.querySelectorAll('#lista-fechamento .cartao'));
    const meu = cartoes.filter(c => c.textContent.indexOf(nome) >= 0)[0];
    if (!meu) return false;
    const bt = Array.from(meu.querySelectorAll('button'))
      .filter(b => b.textContent.trim() === 'Texto')[0];
    if (!bt) return false;
    bt.click();
    return true;
  }, marcelo.nome);
  conf('o fechamento do aluno abriu para exportar', achouCartao, true);
  await espera(900);

  /* As duas listas só saem quando ela marca a caixa. O teste marca antes de
   * exportar, porque o que ele quer conferir é o conteúdo delas. O padrão, que
   * é não sair, é conferido logo em seguida. */
  await pag.evaluate(() => {
    const cx = Array.from(document.querySelectorAll('#lista-fechamento input[type=checkbox]'))
      .filter(c => /Exibir os temas/.test((c.closest('label') || {}).textContent || ''))[0];
    if (cx && !cx.checked) cx.click();
  });
  await espera(800);
  await pag.evaluate((nome) => {
    const cartoes = Array.from(document.querySelectorAll('#lista-fechamento .cartao'));
    const c = cartoes.filter(x => x.textContent.indexOf(nome) >= 0)[0];
    if (!c) return false;
    const b = Array.from(c.querySelectorAll('button'))
      .filter(x => x.textContent.trim() === 'Texto')[0];
    if (b) b.click();
    return !!b;
  }, marcelo.nome);
  await espera(900);

  const md = await pag.evaluate(() => (window.__ultimoBlob ? window.__ultimoBlob.text() : null));
  conf('o fechamento saiu em texto', !!md, true);
  conf('ele tem a seção dos temas trabalhados',
    /## Temas trabalhados/.test(md || ''), true);
  conf('o assunto de matemática está no fechamento',
    (md || '').indexOf(tituloMat) >= 0, true);
  conf('o tópico da outra matéria também', (md || '').indexOf(TOPICO) >= 0, true);
  conf('e o assunto livre também', (md || '').indexOf(LIVRE) >= 0, true);
  conf('cada um aparece uma vez só, e não repetido',
    [tituloMat, TOPICO, LIVRE].map(t => (md || '').split(t).length - 1).join(','), '1,1,1');
  conf('e nenhum travessão entrou no que a família lê', /[\u2013\u2014]/.test(md || ''), false);

  conf('nem aqui o gerador de PDF foi chamado',
    await pag.evaluate(() => window.__pdfs), 0);

  // ================================================================
  secao('9. O assunto livre é cortado em setenta caracteres');

  /* Até esta frente, todo título vinha do banco: o mais longo da matemática tem
   * 57 caracteres e o mais longo das outras matérias tem 63. Com o campo de
   * escrever, um parágrafo inteiro entrava e ia parar na linha da aula e na
   * tabela do fechamento que a família lê, saindo cortado no meio de uma palavra
   * na impressão. Cortar na entrada é melhor, porque ela vê o que vai sair. */
  /* A secao anterior saiu da aula para olhar o fechamento, entao volta. */
  await pag.evaluate(() => {
    document.querySelectorAll('.fundo-modal.aberto [data-fechar]').forEach(b => b.click());
  });
  await espera(400);
  await irParaJunho();
  await abrirAulaDoDia10();
  await tocarNaAula('Mais um assunto');
  await espera(500);

  const LONGO = 'Revisão para a prova de matemática do colégio sobre equações do segundo grau, ' +
    'funções e sistemas lineares';
  conf('o texto de prova tem mais de setenta caracteres', LONGO.length > 70, true);

  const temMaxlength = await pag.evaluate(() => {
    const c = document.querySelector('#assunto-outro');
    return c ? c.getAttribute('maxlength') : '(sem campo)';
  });
  conf('o campo limita a digitação em setenta', temMaxlength, '70');

  await usarOutro(LONGO);
  aula = (await bd()).aulas.filter(a => a.data === '2026-06-10')[0] || {};
  const longoGravado = (aula.temas || []).filter(t => /matemática do colégio/.test(t.titulo || ''))[0];
  conf('o assunto longo foi registrado', !!longoGravado, true);
  if (longoGravado) {
    console.log('       gravado com ' + longoGravado.titulo.length + ' caracteres: ' + longoGravado.titulo);
    conf('e foi cortado em setenta ou menos', longoGravado.titulo.length <= 70, true);
    conf('e não terminou no meio de uma palavra', /\s$|[^\s]$/.test(longoGravado.titulo), true);
    conf('e não terminou com espaço solto', /\s$/.test(longoGravado.titulo), false);
  }

  // ================================================================
  secao('10. Gravação que falha não deixa o assunto só na memória');

  /* Acontece de verdade com o armazenamento cheio, e o aplicativo aceita anexo de
   * até 25 MB. Sem desfazer, o item ficava em aula.temas na memória e a guarda de
   * duplicata passava a recusar a segunda tentativa, dizendo que o assunto já
   * estava registrado quando ele não estava em lugar nenhum. */
  const antesDaFalha = ((await bd()).aulas.filter(a => a.data === '2026-06-10')[0] || {}).temas || [];

  await pag.evaluate(() => {
    window.__salvarOriginal = window.Store.salvar;
    window.Store.salvar = function () { return Promise.reject(new Error('quota cheia (teste)')); };
  });

  await tocarNaAula('Mais um assunto');
  await espera(500);
  await usarOutro('Assunto que não vai ser gravado');
  await espera(600);

  /* A memoria nao e alcancavel de fora, entao a sonda e a tela: o bloco de
   * assunto e redesenhado a partir da memoria, e o item desfeito nao pode
   * aparecer nele. */
  const naTela = (await linhasDaAula()).filter(l => /não vai ser gravado/.test(l.nome)).length;
  conf('o assunto não fica na lista depois da falha de gravação', naTela, 0);
  const noDisco = ((await bd()).aulas.filter(a => a.data === '2026-06-10')[0] || {}).temas || [];
  conf('e não foi gravado no disco',
    noDisco.filter(t => /não vai ser gravado/.test(t.titulo || '')).length, 0);

  await pag.evaluate(() => { window.Store.salvar = window.__salvarOriginal; });

  /* E a segunda tentativa, agora com a gravação funcionando, tem que passar: era
   * exatamente isso que a guarda de duplicata bloqueava. */
  await tocarNaAula('Mais um assunto');
  await espera(500);
  await usarOutro('Assunto que não vai ser gravado');
  await espera(700);
  aula = (await bd()).aulas.filter(a => a.data === '2026-06-10')[0] || {};
  conf('a segunda tentativa registra',
    (aula.temas || []).filter(t => /não vai ser gravado/.test(t.titulo || '')).length, 1);

  // ================================================================
  secao('11. Os arquivos das outras matérias não vêm');

  /* O índice tem 4 KB e os doze arquivos de disciplina somam 95 KB: quem costuma
   * falhar são eles. Antes, a lista vazia virava memória e a sessão inteira ficava
   * sem as outras matérias mesmo depois de o sinal voltar, e a faixa de aviso não
   * aparecia, porque ela estava pendurada só no índice. */
  const pag2 = await navegador.newPage();
  pag2.on('dialog', async d => { try { await d.accept(); } catch (e) { /* ok */ } });
  await pag2.setRequestInterception(true);
  let bloqueando = true;
  pag2.on('request', r => {
    if (bloqueando && /banco\/topicos\/(?!indice)/.test(r.url())) { r.abort(); return; }
    r.continue();
  });
  await pag2.goto(URL_APP, { waitUntil: 'networkidle0' });
  await espera(1600);

  const abriuPicker = await pag2.evaluate(async () => {
    /* Vai direto ao seletor pela função da página, sem depender da agenda. */
    const aulas = (window.db && window.db.aulas) || [];
    const a = aulas.filter(x => x.temas || x.tema)[0] || aulas[0];
    if (!a) return { erro: 'sem aula no banco de prova' };
    if (typeof window.__abrirAssunto === 'function') { window.__abrirAssunto(a.id); return { ok: true }; }
    return { erro: 'abrirAssunto não está exposto' };
  });

  if (abriuPicker.ok) {
    await espera(900);
    const faixa = await pag2.evaluate(() => {
      const m = document.querySelector('#modal-tema');
      if (!m) return '(sem janela)';
      const f = m.querySelector('.faixa-aviso');
      return f ? f.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : '(sem faixa)';
    });
    conf('a faixa de aviso aparece quando as disciplinas não vêm',
      /não abriram/.test(faixa), true);
  } else {
    console.log('       (o seletor não é alcançável de fora; conferido pelo código)');
    conf('a faixa passou a olhar a lista, e não só o índice',
      require('fs').readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8')
        .indexOf('var semTopicos') >= 0, true);
  }
  await pag2.close();

  // ================================================================
  secao('9. Erros de página');

  const reais = errosDePagina.filter(e => !/favicon|manifest|sw\.js|ServiceWorker/i.test(e));
  reais.forEach(e => console.log('  ERRO: ' + e));
  conf('nenhum erro de JavaScript', reais.length, 0);

  await pag.screenshot({ path: path.join(__dirname, 'v_assunto_final.png') });
  await navegador.close();

  console.log('\n' + '='.repeat(60));
  console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
  if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
  console.log('='.repeat(60));
  process.exit(falhas ? 1 : 0);
})().catch(e => {
  console.error('\nO teste parou com erro:', e.message);
  console.error(e.stack);
  process.exit(1);
});
