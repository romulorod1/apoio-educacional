/* testa_familia.js
 * As duas novidades que ela vai usar na frente de quem paga:
 *
 *   1. O MÊS NUMA TELA, em dois modos. Um com tudo, para ela escrever o
 *      fechamento sem abrir aula por aula. Outro sem valores, sem a anotação
 *      particular dela e sem nenhum outro aluno, para abrir com o tablet na mão.
 *   2. O CARTÃO DO MÊS: ela escolhe a frase, vê a imagem e só então envia.
 *
 * O teste existe por causa do primeiro. O modo da família é o item de maior
 * risco de vergonha do aplicativo inteiro: um valor, uma anotação particular ou
 * o nome de outro aluno que escape ali escapa na frente da mãe do aluno, e não
 * há como voltar atrás. Por isso a seção 3 não confere um punhado de casos
 * escolhidos a dedo: ela VARRE o texto renderizado da página inteira, o título
 * da janela e todos os nós da tela da família, visíveis ou não, e afirma que
 * nenhum valor em reais e nenhum outro nome de aluno aparecem em canto nenhum.
 * A varredura por dentro afirma mais do que "está escondido": afirma que o
 * valor e a anotação particular não chegam a ser criados.
 *
 * A base do teste não é a carga inicial pura: Cecília ganha valor por hora e
 * duas aulas no mesmo mês do Marcelo, senão a varredura por nome de outro aluno
 * não afirmaria nada (sem uma segunda pessoa no mês, não haveria nome para
 * vazar). E três aulas do Marcelo ganham assunto, texto do que rendeu e uma
 * anotação particular, que é justamente o que não pode aparecer.
 */
const puppeteer = require('puppeteer-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL_APP = 'http://127.0.0.1:8777/index.html';

const SO_MINHA = 'Chegou disperso e sem o material. Falar com a mae antes do proximo mes.';
const RENDEU_1 = 'Retomamos as fracoes com desenho e ele fechou a lista sozinho.';
const RENDEU_2 = 'Leitura de um texto longo e resposta discursiva com as proprias palavras.';

let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }
const espera = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const navegador = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1280, height: 900, hasTouch: true }
  });
  const pag = await navegador.newPage();
  const errosDePagina = [];
  pag.on('pageerror', e => errosDePagina.push(e.message));
  pag.on('console', m => { if (m.type() === 'error') errosDePagina.push('console: ' + m.text()); });
  pag.on('dialog', async d => { try { await d.accept(); } catch (e) { /* ok */ } });

  /* Nada sai do aparelho de verdade: o compartilhamento é desligado e o
   * download é interceptado, para o teste poder olhar o arquivo por dentro. */
  await pag.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    window.__gerados = [];
    const criar = URL.createObjectURL.bind(URL);
    URL.createObjectURL = function (b) { window.__ultimoBlob = b; return criar(b); };
    HTMLAnchorElement.prototype.click = function () {
      if (!this.hasAttribute('download')) return;
      const bl = window.__ultimoBlob, leitor = new FileReader();
      leitor.onload = () => window.__gerados.push({
        nome: this.getAttribute('download'),
        tipo: (bl && bl.type) || '',
        b64: String(leitor.result).split(',')[1]
      });
      leitor.readAsDataURL(bl);
    };
  });

  await pag.goto(URL_APP, { waitUntil: 'networkidle0' });
  await espera(1800);

  // ---------------------------------------------------------------- a base
  await pag.evaluate(async (semente) => {
    const banco = await new Promise(r => {
      const q = indexedDB.open('apoio-educacional');
      q.onsuccess = () => r(q.result);
    });
    const atual = await new Promise(r => {
      const s = banco.transaction('dados', 'readonly').objectStore('dados').get('principal');
      s.onsuccess = () => r(s.result);
    });

    const marcelo = atual.alunos.find(a => a.nome === 'Marcelo');
    const ceci = atual.alunos.find(a => a.nome === 'Cecília');
    ceci.precos = [{ id: 'preco-ceci', inicio: '2026-01-01', fim: null, valorHora: 150 }];
    ['2026-06-04', '2026-06-11'].forEach((d, i) => {
      atual.aulas.push({
        id: 'aula-ceci-' + i, alunoId: ceci.id, serieId: null, destacada: false,
        data: d, hora: '10:00', duracaoMin: 90, status: 'realizada', cobravel: true,
        notaTexto: '', notaPrivada: '', temNota: false, anexos: [], areas: [], temas: []
      });
    });

    const dele = atual.aulas
      .filter(a => a.alunoId === marcelo.id && a.data.slice(0, 7) === '2026-06')
      .sort((x, y) => x.data.localeCompare(y.data));
    dele[0].temas = [{ titulo: 'Frações e números decimais', disciplina: 'matematica', fonte: 'livre' }];
    dele[0].notaTexto = semente.rendeu1;
    dele[0].notaPrivada = semente.soMinha;
    dele[0].areas = ['metodo'];
    dele[1].temas = [{ titulo: 'Interpretação de texto', disciplina: 'portugues', fonte: 'livre' }];
    dele[1].notaTexto = semente.rendeu2;
    dele[1].areas = ['autonomia'];
    dele[2].temas = [{ titulo: 'Equações do primeiro grau', disciplina: 'matematica', fonte: 'livre' }];

    await new Promise(r => {
      const s = banco.transaction('dados', 'readwrite').objectStore('dados').put(atual, 'principal');
      s.onsuccess = () => r();
    });
  }, { soMinha: SO_MINHA, rendeu1: RENDEU_1, rendeu2: RENDEU_2 });

  await pag.reload({ waitUntil: 'networkidle0' });
  await espera(1800);

  /* A janela de novidades pode abrir sozinha e ficaria por cima de tudo. */
  await pag.evaluate(() => {
    document.querySelectorAll('.fundo-modal.aberto').forEach(m => m.classList.remove('aberto'));
  });

  const irParaFechamento = async () => {
    await pag.evaluate(() => {
      Array.from(document.querySelectorAll('#abas .aba'))
        .find(b => b.dataset.tela === 'fechamento').click();
    });
    await espera(700);
  };
  const clicar = async (seletor, texto) => {
    const achou = await pag.evaluate((sel, txt) => {
      const alvo = Array.from(document.querySelectorAll(sel))
        .find(e => e.textContent.trim() === txt);
      if (!alvo) return false;
      alvo.scrollIntoView({ block: 'center' });
      alvo.click();
      return true;
    }, seletor, texto);
    if (!achou) throw new Error('não achei "' + texto + '" em ' + seletor);
    await espera(420);
  };

  await irParaFechamento();

  const nomes = await pag.evaluate(() => Array.from(
    document.querySelectorAll('#lista-fechamento .cartao h3')).map(h => h.textContent.trim()));
  conf('o mês tem dois alunos, então há nome de outro para vazar', nomes.length, 2);

  /* Os nomes dos outros alunos saem do próprio banco, e não escritos aqui: a
   * varredura acompanha a carga inicial se ela mudar, e nenhum nome de aluno
   * fica gravado neste arquivo. */
  const OUTROS = await pag.evaluate(async () => {
    const banco = await new Promise(r => {
      const q = indexedDB.open('apoio-educacional');
      q.onsuccess = () => r(q.result);
    });
    const d = await new Promise(r => {
      const s = banco.transaction('dados', 'readonly').objectStore('dados').get('principal');
      s.onsuccess = () => r(s.result);
    });
    return d.alunos.map(a => a.nome).filter(n => n !== 'Marcelo');
  });
  conf('e há uma dúzia de nomes para a varredura procurar', OUTROS.length >= 10, true);

  // ================================================================
  secao('1. A tela como ela vê: o mês inteiro, sem abrir aula por aula');

  conf('o botão novo está ao lado dos que já existem',
    await pag.evaluate(() => Array.from(document.querySelectorAll('#lista-fechamento button'))
      .some(b => b.textContent.trim() === 'O mês numa tela')), true);

  await pag.evaluate(() => {
    const cartao = Array.from(document.querySelectorAll('#lista-fechamento .cartao'))
      .find(c => /Marcelo/.test(c.querySelector('h3').textContent));
    Array.from(cartao.querySelectorAll('button'))
      .find(b => b.textContent.trim() === 'O mês numa tela').click();
  });
  await espera(600);

  const aberta = () => pag.$eval('#modal-mes', e => e.classList.contains('aberto'));
  conf('a janela do mês abriu', await aberta(), true);
  conf('o título traz o aluno e o mês',
    await pag.$eval('#titulo-modal-mes', e => e.textContent.trim()), 'Marcelo, Junho de 2026');

  const dela = await pag.$eval('#modal-mes', e => e.innerText);
  conf('ela vê o total do mês', dela.includes('R$ 1.050,00'), true);
  conf('ela vê o valor de um encontro', /R\$\s*100,00/.test(dela), true);
  conf('ela vê os assuntos de cada dia', dela.includes('Frações e números decimais'), true);
  conf('e de outra matéria também', dela.includes('Interpretação de texto'), true);
  conf('ela vê o que rendeu em cada aula', dela.includes(RENDEU_1) && dela.includes(RENDEU_2), true);
  conf('ela vê a anotação particular', dela.includes(SO_MINHA), true);
  conf('num bloco com barra, e não solta no meio do texto',
    await pag.$$eval('#modal-mes .so-minha', es => es.length), 1);
  conf('a anotação particular está DENTRO desse bloco',
    await pag.$eval('#modal-mes .so-minha', e => e.textContent.includes('Falar com a mae')), true);
  conf('ela vê o feedback que já escreveu', dela.includes('Marcelo está se tornando um homenzinho'), true);
  conf('e tem por onde editar o feedback daqui',
    await pag.evaluate(() => Array.from(document.querySelectorAll('#rodape-modal-mes button'))
      .some(b => b.textContent.trim() === 'Editar o feedback')), true);
  conf('as áreas do mês aparecem', dela.includes('Método de estudo'), true);
  conf('nenhum erro de página até aqui', errosDePagina.length, 0);

  /* Escrever o feedback é para o que esta tela serve, então o caminho de ida e
   * volta precisa funcionar de dentro dela: a janela do feedback abre POR CIMA e
   * desistir dela devolve o mês, sem apagar nada. */
  await clicar('#rodape-modal-mes button', 'Editar o feedback');
  conf('a janela do feedback abre de dentro do mês',
    await pag.$eval('#modal-resumo', e => e.classList.contains('aberto')), true);
  conf('e fica por cima, e não atrás',
    await pag.evaluate(() => (+document.querySelector('#modal-resumo').style.zIndex || 0) >
      (+document.querySelector('#modal-mes').style.zIndex || 0)), true);
  await clicar('#modal-resumo .modal-rodape button', 'Cancelar');
  conf('desistir dela devolve o mês inteiro', await aberta(), true);
  conf('com o feedback intacto',
    await pag.$eval('#modal-mes', e => e.innerText.includes('Marcelo está se tornando um homenzinho')), true);

  await pag.screenshot({ path: '_teste/v_mes_dela.png' });

  // ================================================================
  secao('2. Entrar no modo da família é óbvio e não acontece por engano');

  await clicar('#rodape-modal-mes button', 'Mostrar para a família');
  conf('um toque só NÃO muda de modo',
    await pag.evaluate(() => document.body.classList.contains('modo-familia')), false);
  conf('ele abre a leitura do que vai sumir',
    await pag.$$eval('#rodape-modal-mes .confirma-familia', es => es.length), 1);
  conf('e essa leitura diz de quem é a tela',
    await pag.$eval('#rodape-modal-mes .confirma-familia', e => e.textContent.includes('Marcelo')), true);

  await clicar('#rodape-modal-mes button', 'Agora não');
  conf('dá para desistir no meio',
    await pag.$$eval('#rodape-modal-mes .confirma-familia', es => es.length), 0);
  conf('e continua sendo a tela dela',
    await pag.$eval('#modal-mes', e => e.innerText.includes('R$ 1.050,00')), true);

  await clicar('#rodape-modal-mes button', 'Mostrar para a família');
  await clicar('#rodape-modal-mes button', 'Sim, mostrar');
  conf('dois toques deliberados entram no modo da família',
    await pag.evaluate(() => document.body.classList.contains('modo-familia')), true);
  conf('e a tela diz, em cima, que está sendo mostrada',
    await pag.$eval('#selo-modal-mes', e => e.textContent.trim()), 'Mostrando para a família');

  // ================================================================
  secao('3. A varredura: nada do que é dela escapa em canto nenhum');

  /* Duas varreduras, e as duas precisam estar limpas.
   *
   *   tela  : o texto RENDERIZADO da página inteira, que é o que existe para
   *           quem está com o tablet na mão. innerText já aplica display:none e
   *           text-transform, então é a medida honesta do que aparece.
   *   janela: TODOS os nós da tela da família, visíveis ou não. Serve para
   *           afirmar mais do que "está escondido": afirma que o valor e a
   *           anotação particular não chegam a ser criados. Máscara é o que o
   *           botão do olho faz, e máscara ainda escreve "R$" na tela. */
  const varredura = await pag.evaluate(() => ({
    tela: document.body.innerText,
    titulo: document.title,
    janela: document.querySelector('#modal-mes').textContent,
    nomes: Array.from(document.querySelectorAll('#lista-fechamento .cartao h3')).map(h => h.textContent.trim()),
    cabecalhoNoAr: getComputedStyle(document.querySelector('.cabecalho')).display,
    conteudoNoAr: getComputedStyle(document.querySelector('.conteudo')).display,
    avisoNoAr: getComputedStyle(document.querySelector('#aviso')).display,
    blocosPrivados: document.querySelectorAll('.so-minha').length,
    botoes: Array.from(document.querySelectorAll('#modal-mes button')).map(b => b.textContent.trim()),
    ancoras: document.querySelectorAll('a[download]').length
  }));

  const MOEDA = /\d{1,3}(\.\d{3})*,\d{2}/;
  conf('nenhum "R$" no texto da tela inteira', /R\$/.test(varredura.tela), false);
  conf('nem em nó nenhum da tela da família', /R\$/.test(varredura.janela), false);
  conf('nenhum número com cara de dinheiro na tela', MOEDA.test(varredura.tela), false);
  conf('nem na tela da família por dentro', MOEDA.test(varredura.janela), false);
  conf('o total do mês dele não aparece', varredura.tela.includes('1.050'), false);
  conf('o total do mês dela também não', varredura.tela.includes('450,00'), false);
  conf('nem a máscara do botão do olho', varredura.tela.includes('•'), false);

  conf('nenhum outro nome de aluno na tela',
    OUTROS.filter(n => varredura.tela.indexOf(n) >= 0).join(', ') || 'nenhum', 'nenhum');
  conf('nem em nó nenhum da tela da família',
    OUTROS.filter(n => varredura.janela.indexOf(n) >= 0).join(', ') || 'nenhum', 'nenhum');
  conf('nem no título da janela',
    OUTROS.filter(n => varredura.titulo.indexOf(n) >= 0).join(', ') || 'nenhum', 'nenhum');
  conf('e o título não leva dinheiro', /R\$/.test(varredura.titulo), false);

  conf('a anotação particular não aparece na tela', varredura.tela.includes(SO_MINHA), false);
  conf('e não existe na tela da família nem escondida',
    varredura.janela.includes(SO_MINHA), false);
  conf('nem o bloco onde ela morava', varredura.blocosPrivados, 0);
  conf('nem o rótulo "Só minha"', varredura.janela.includes('Só minha'), false);
  conf('nem a conta do que ela deu sem cobrar',
    /sem cobrar|desmarcad/i.test(varredura.janela), false);
  conf('nem a palavra que fala de cobrança', /cobrad|cobrar/i.test(varredura.janela), false);

  conf('o cabeçalho saiu do ar', varredura.cabecalhoNoAr, 'none');
  conf('a tela de fechamento, com todos os alunos, saiu do ar', varredura.conteudoNoAr, 'none');
  conf('o aviso flutuante saiu do ar', varredura.avisoNoAr, 'none');
  conf('a lista de alunos continua existindo por baixo, escondida', varredura.nomes.length, 2);

  /* Nenhum arquivo nasce daqui: não há PDF, imagem nem compartilhamento no modo
   * da família, então não existe caminho por onde esta tela vaze num arquivo. */
  const exporta = varredura.botoes.filter(t => /PDF|Texto|Cart|Enviar|Salvar|Baixar/i.test(t));
  conf('nenhum botão que gere arquivo', exporta.join(', ') || 'nenhum', 'nenhum');
  conf('e nenhum link de download pendurado', varredura.ancoras, 0);
  conf('nada foi gerado até agora',
    await pag.evaluate(() => window.__gerados.length), 0);

  conf('o que interessa continua na tela: o nome dele',
    varredura.tela.includes('Marcelo'), true);
  conf('o mês', varredura.tela.includes('Junho de 2026'), true);
  conf('os assuntos', varredura.tela.includes('Frações e números decimais'), true);
  conf('e o que rendeu em cada encontro', varredura.tela.includes(RENDEU_1), true);

  await pag.screenshot({ path: '_teste/v_mes_familia_deitado.png' });
  await pag.setViewport({ width: 820, height: 1180, hasTouch: true });
  await espera(500);
  await pag.screenshot({ path: '_teste/v_mes_familia_em_pe.png' });
  await pag.setViewport({ width: 1280, height: 900, hasTouch: true });
  await espera(500);

  // ================================================================
  secao('4. Sair sem querer no meio de uma conversa é difícil');

  conf('não há × para fechar',
    await pag.$eval('#fechar-modal-mes', e => getComputedStyle(e).display), 'none');

  await pag.evaluate(() => {
    const m = document.querySelector('#modal-mes');
    m.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await espera(300);
  conf('tocar no fundo da janela não fecha', await aberta(), true);
  conf('e continua no modo da família',
    await pag.evaluate(() => document.body.classList.contains('modo-familia')), true);

  const caixa = await pag.$eval('#sair-modo-familia', e => {
    const r = e.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, l: r.width, a: r.height };
  });
  conf('o botão de sair é alvo de dedo, e não de precisão', caixa.a >= 44 && caixa.l >= 44, true);

  await pag.mouse.move(caixa.x, caixa.y);
  await pag.mouse.down();
  await espera(300);
  await pag.mouse.up();
  await espera(300);
  conf('um toque rápido NÃO sai',
    await pag.evaluate(() => document.body.classList.contains('modo-familia')), true);
  conf('e explica por que não saiu',
    await pag.$eval('#dica-segurar', e => e.textContent.trim().length > 0), true);

  await pag.mouse.down();
  await espera(1600);
  await pag.mouse.up();
  await espera(500);
  conf('segurando, ela sai',
    await pag.evaluate(() => document.body.classList.contains('modo-familia')), false);
  conf('o cabeçalho voltou',
    await pag.$eval('.cabecalho', e => getComputedStyle(e).display !== 'none'), true);
  conf('a tela de fechamento voltou',
    await pag.$eval('.conteudo', e => getComputedStyle(e).display !== 'none'), true);
  conf('e os valores voltaram para ela',
    await pag.$eval('#modal-mes', e => e.innerText.includes('R$ 1.050,00')), true);
  conf('a anotação particular voltou também',
    await pag.$eval('#modal-mes', (e, t) => e.innerText.includes(t), SO_MINHA), true);

  await pag.evaluate(() => {
    Array.from(document.querySelectorAll('#rodape-modal-mes button'))
      .find(b => b.textContent.trim() === 'Fechar').click();
  });
  await espera(400);
  conf('e a janela fecha normalmente quando ela manda', await aberta(), false);
  conf('sem deixar o corpo marcado',
    await pag.evaluate(() => document.body.classList.contains('modo-familia')), false);

  // ================================================================
  secao('5. O cartão do mês: ela escolhe a frase e vê antes de mandar');

  await pag.evaluate(() => {
    const cartao = Array.from(document.querySelectorAll('#lista-fechamento .cartao'))
      .find(c => /Marcelo/.test(c.querySelector('h3').textContent));
    Array.from(cartao.querySelectorAll('button'))
      .find(b => b.textContent.trim() === 'Cartão do mês').click();
  });
  await espera(700);

  conf('a janela do cartão abriu',
    await pag.$eval('#modal-cartao', e => e.classList.contains('aberto')), true);
  conf('o título diz de quem é',
    await pag.$eval('#titulo-modal-cartao', e => e.textContent.trim()), 'Cartão do mês, Marcelo');

  const frases = await pag.$$eval('#corpo-modal-cartao .opcao-frase', es => es.map(e => e.textContent.trim()));
  conf('as frases do feedback dela viraram opções', frases.length >= 4, true);
  conf('e saíram do texto que ela escreveu, sem uma palavra trocada',
    frases[0].startsWith('Marcelo está se tornando um homenzinho'), true);
  conf('a última opção é não pôr frase nenhuma', frases[frases.length - 1], 'Sem frase nenhuma');
  conf('cada opção é alvo de dedo',
    await pag.$$eval('#corpo-modal-cartao .opcao-frase',
      es => es.every(e => e.getBoundingClientRect().height >= 44)), true);
  conf('a primeira já vem escolhida',
    await pag.$eval('#corpo-modal-cartao .opcao-frase', e => e.classList.contains('escolhida')), true);

  const previa = await pag.$eval('#previa-cartao', e => ({ l: e.width, a: e.height }));
  conf('a prévia é o arquivo: 1080 por 1080', previa.l + 'x' + previa.a, '1080x1080');

  const antes = await pag.$eval('#previa-cartao', e => e.toDataURL('image/png').length);
  await pag.evaluate(() => document.querySelectorAll('#corpo-modal-cartao .opcao-frase')[2].click());
  await espera(400);
  const depois = await pag.$eval('#previa-cartao', e => e.toDataURL('image/png').length);
  conf('trocar de frase muda a imagem', antes !== depois, true);
  conf('e a escolha fica marcada na terceira',
    await pag.$$eval('#corpo-modal-cartao .opcao-frase',
      es => es.findIndex(e => e.classList.contains('escolhida'))), 2);

  /* O que o cartão desenha, varrido no plano que o próprio cartao.js devolve:
   * é ali que estão todas as palavras que vão para a imagem. */
  const conteudoDoCartao = await pag.evaluate(async () => {
    const banco = await new Promise(r => {
      const q = indexedDB.open('apoio-educacional');
      q.onsuccess = () => r(q.result);
    });
    const d = await new Promise(r => {
      const s = banco.transaction('dados', 'readonly').objectStore('dados').get('principal');
      s.onsuccess = () => r(s.result);
    });
    const marcelo = d.alunos.find(a => a.nome === 'Marcelo');
    const f = Core.calcularFechamento(d, marcelo.id, '2026-06');
    const tela = document.createElement('canvas');
    const p = Cartao.desenhar(tela, f, { frase: Cartao.frasesDoResumo(f.resumoTexto)[0] });
    return JSON.stringify(p);
  });
  conf('nada de dinheiro no que o cartão desenha', /R\$/.test(conteudoDoCartao), false);
  conf('nem número com cara de dinheiro', MOEDA.test(conteudoDoCartao), false);
  conf('nenhum outro nome de aluno no cartão',
    OUTROS.filter(n => conteudoDoCartao.indexOf(n) >= 0).join(', ') || 'nenhum', 'nenhum');
  conf('nem a anotação particular dela',
    conteudoDoCartao.includes('Falar com a mae'), false);
  conf('mas o nome dele e o mês estão lá',
    conteudoDoCartao.includes('Marcelo') && conteudoDoCartao.includes('Junho'), true);

  await pag.screenshot({ path: '_teste/v_cartao_escolha.png' });
  await pag.setViewport({ width: 820, height: 1180, hasTouch: true });
  await espera(500);
  await pag.screenshot({ path: '_teste/v_cartao_em_pe.png' });
  await pag.setViewport({ width: 1280, height: 900, hasTouch: true });
  await espera(500);

  await pag.evaluate(() => document.querySelector('#enviar-cartao').click());
  await espera(1400);
  const gerados = await pag.evaluate(() => window.__gerados);
  const png = gerados.find(g => /\.png$/.test(g.nome));
  conf('só então o cartão é enviado', !!png, true);
  if (png) {
    conf('e é uma imagem, que aparece dentro da conversa', png.tipo, 'image/png');
    conf('com o nome do aluno e o mês no arquivo', png.nome, 'Cartao_Marcelo_2026-06.png');
    const bin = Buffer.from(png.b64, 'base64');
    conf('o arquivo é PNG de verdade', bin.slice(1, 4).toString('latin1'), 'PNG');
    conf('e tem 1080 por 1080',
      bin.readUInt32BE(16) + 'x' + bin.readUInt32BE(20), '1080x1080');
  }
  conf('a janela do cartão fecha depois de enviar',
    await pag.$eval('#modal-cartao', e => e.classList.contains('aberto')), false);

  // ================================================================
  secao('6. O aluno sem feedback escrito ainda tem cartão');

  /* O caso comum de quem começou agora: nenhum feedback escrito, nenhuma frase
   * para escolher. O cartão sai assim mesmo, com o nome, o mês e a contagem, e a
   * janela diz onde escrever a frase. */
  await pag.evaluate(() => {
    const outro = document.querySelectorAll('#lista-fechamento .cartao')[1];
    Array.from(outro.querySelectorAll('button'))
      .find(b => b.textContent.trim() === 'Cartão do mês').click();
  });
  await espera(700);
  conf('a janela abre igual',
    await pag.$eval('#modal-cartao', e => e.classList.contains('aberto')), true);
  conf('sem frase nenhuma para escolher',
    await pag.$$eval('#corpo-modal-cartao .opcao-frase', es => es.length), 0);
  conf('e explica o que fazer para ter uma',
    await pag.$eval('#corpo-modal-cartao', e => e.innerText.includes('ainda não foi escrito')), true);
  conf('mas a prévia existe do mesmo jeito',
    await pag.$eval('#previa-cartao', e => e.width + 'x' + e.height), '1080x1080');
  await clicar('#modal-cartao .modal-rodape button', 'Cancelar');
  conf('e dá para sair sem mandar nada',
    await pag.$eval('#modal-cartao', e => e.classList.contains('aberto')), false);

  // ================================================================
  secao('7. O que já existia continua no lugar');

  const fech = await pag.$eval('#tela-fechamento', e => e.innerText);
  conf('o fechamento continua mostrando os dois alunos',
    fech.includes('Marcelo') && fech.includes('Cecília'), true);
  conf('e continua mostrando o dinheiro', fech.includes('R$ 1.050,00'), true);
  conf('os botões antigos continuam lá',
    await pag.evaluate(() => {
      const t = Array.from(document.querySelectorAll('#lista-fechamento button')).map(b => b.textContent.trim());
      return ['Editar o feedback', 'Texto', 'PDF do fechamento', 'PDF com as folhas']
        .every(x => t.indexOf(x) >= 0);
    }), true);
  conf('nenhum erro de página no caminho inteiro',
    errosDePagina.join(' | ') || 'nenhum', 'nenhum');

  await navegador.close();
  console.log('\n' + '='.repeat(60));
  console.log(passes + ' passaram, ' + falhas + ' falharam.');
  console.log('='.repeat(60));
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error('erro:', e && e.stack || e); process.exit(1); });
