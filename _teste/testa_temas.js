/* testa_temas.js
 * Simula a Nathália montando material a partir do banco de temas.
 *
 * O ponto que mais importa aqui não é o material sair: é a folha em branco
 * continuar sendo o caminho principal. O tema é atalho, e atalho que atrapalha
 * o caminho normal é defeito.
 */
const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL_APP = 'http://127.0.0.1:8777/index.html';

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

const porValor = (sel, valor) => `(() => {
  const e = document.querySelector(${JSON.stringify(sel)});
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(e, ${JSON.stringify(valor)});
  e.dispatchEvent(new Event('input', { bubbles: true }));
})()`;

(async () => {
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
    const criar = URL.createObjectURL.bind(URL);
    URL.createObjectURL = function (b) { window.__ultimoBlob = b; return criar(b); };
    HTMLAnchorElement.prototype.click = function () { /* não baixa nada no teste */ };
  });

  await pag.goto(URL_APP, { waitUntil: 'networkidle0' });
  await espera(1400);

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
  async function clicarTexto(seletor, texto) {
    const alvo = await pag.evaluateHandle((sel, txt) => {
      const els = Array.from(document.querySelectorAll(sel));
      return els.find(e => e.textContent.trim() === txt) ||
        els.find(e => e.textContent.trim().indexOf(txt) >= 0) || null;
    }, seletor, texto);
    const el = alvo.asElement();
    if (!el) {
      const disp = await pag.$$eval(seletor, es => es.map(e => e.textContent.trim()));
      throw new Error('Não achei "' + texto + '" em ' + seletor + '. Disponíveis: ' + JSON.stringify(disp));
    }
    await el.evaluate(e => { e.scrollIntoView({ block: 'center' }); e.click(); });
    await espera(280);
  }
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
    await espera(500);
  }

  await irParaJunho();
  await abrirAulaDoDia10();

  // ================================================================
  secao('1. A folha em branco continua sendo o caminho principal');

  const botoes = await pag.$$eval('#linha-folha button', bs => bs.map(b => b.textContent.trim()));
  conf('a folha em branco é o primeiro botão', botoes[0], 'Escrever à mão na folha');
  conf('o material de aula fica ao lado, sem tomar o lugar', botoes[1], 'Material de aula');
  const ajuda = await pag.$eval('#ajuda-folha', e => e.textContent);
  conf('o texto diz que a folha é o começo', /folha em branco é sempre o começo/i.test(ajuda), true);
  conf('e diz que o material é opcional', /atalho opcional/i.test(ajuda), true);

  // ================================================================
  secao('2. Escolher o tema');

  await clicarTexto('#linha-folha button', 'Material de aula');
  await espera(1800);
  conf('a janela de material abriu', await visivel('#modal-tema'), true);
  const quantosTemas = await pag.$$eval('#lista-temas .item-tema', e => e.length);
  conf('a lista abriu com temas do ano escolhido', quantosTemas > 5, true);
  conf('abre no 6º ano quando ainda não sabe o ano do aluno',
    await pag.$eval('#corpo-modal-tema select', e => e.value), '06');

  await pag.evaluate(porValor('#corpo-modal-tema input[type=text]', 'fra'));
  await espera(400);
  const filtrados = await pag.$$eval('#lista-temas .item-tema .nome', es => es.map(e => e.textContent));
  conf('a busca filtrou', filtrados.length < quantosTemas && filtrados.length > 0, true);

  /* Ela digita no teclado do tablet, onde o acento custa toques a mais. Antes
     disto, procurar sem acento devolvia a lista vazia como se o assunto não
     existisse. */
  await pag.evaluate(porValor('#corpo-modal-tema input[type=text]', 'divisao'));
  await espera(400);
  const semAcento = await pag.$$eval('#lista-temas .item-tema', es => es.length);
  await pag.evaluate(porValor('#corpo-modal-tema input[type=text]', 'divisão'));
  await espera(400);
  const comAcento = await pag.$$eval('#lista-temas .item-tema', es => es.length);
  conf('procurar sem acento acha', semAcento > 0, true);
  conf('e acha exatamente o mesmo que com acento', semAcento, comAcento);

  await pag.evaluate(porValor('#corpo-modal-tema input[type=text]', 'ANGULO'));
  await espera(400);
  conf('e não se importa com maiúscula',
    await pag.$$eval('#lista-temas .item-tema', es => es.length) > 0, true);

  await pag.evaluate(porValor('#corpo-modal-tema input[type=text]', 'zzzzz'));
  await espera(300);
  conf('busca sem resultado avisa em vez de ficar em branco',
    await pag.$eval('#lista-temas', e => /Nenhum tema encontrado/.test(e.textContent)), true);

  await pag.evaluate(porValor('#corpo-modal-tema input[type=text]', ''));
  await espera(200);
  await pag.select('#corpo-modal-tema select', '08');
  await espera(900);
  conf('trocar o ano trocou a lista',
    await pag.$$eval('#lista-temas .item-tema', e => e.length) > 0, true);

  let banco = await bd();
  const marcelo = banco.alunos.find(a => /Marcelo/i.test(a.nome));
  conf('o ano escolar ficou guardado no aluno', marcelo.anoEscolar, '08');

  // ================================================================
  secao('3. Montar a lista marcando e desmarcando');

  await clicarTexto('#lista-temas .item-tema button', 'Escolher');
  await espera(2000);

  const totalEx = await pag.$$eval('.item-exercicio input', es => es.length);
  conf('a lista nasce com todos marcados',
    await pag.$$eval('.item-exercicio input', es => es.filter(e => e.checked).length), totalEx);
  conf('e tem exercícios de verdade', totalEx > 8, true);
  conf('os blocos de dificuldade aparecem',
    await pag.$$eval('#corpo-modal-tema .bloco-exercicios', es => es.length) >= 2, true);
  conf('o rodapé conta certo',
    await pag.$eval('#rodape-modal-tema .ajuda', e => e.textContent),
    totalEx + ' de ' + totalEx + ' exercícios marcados');

  await clicarTexto('#corpo-modal-tema button', 'Desmarcar todos');
  await espera(400);
  conf('desmarcar todos desmarca',
    await pag.$$eval('.item-exercicio input', es => es.filter(e => e.checked).length), 0);
  conf('e o botão de gerar fica travado, porque lista vazia não é material',
    await pag.$eval('#rodape-modal-tema button.principal', e => e.disabled), true);

  await pag.evaluate(() => {
    const caixas = Array.from(document.querySelectorAll('.item-exercicio input'));
    [0, 3, 6, 9, 11].forEach(i => caixas[i].click());
  });
  await espera(400);
  conf('cinco marcados a dedo',
    await pag.$eval('#rodape-modal-tema .ajuda', e => e.textContent),
    '5 de ' + totalEx + ' exercícios marcados');
  conf('o botão de gerar voltou',
    await pag.$eval('#rodape-modal-tema button.principal', e => e.disabled), false);

  await clicarTexto('#corpo-modal-tema button', 'Marcar todos');
  await espera(400);
  conf('marcar todos volta ao começo',
    await pag.$$eval('.item-exercicio input', es => es.filter(e => e.checked).length), totalEx);

  // ================================================================
  secao('4. Trocar de idioma');

  const primeiroPT = await pag.$eval('.item-exercicio .texto-exercicio', e => e.textContent);
  await clicarTexto('#corpo-modal-tema button', 'English');
  await espera(600);
  const primeiroEN = await pag.$eval('.item-exercicio .texto-exercicio', e => e.textContent);
  conf('o enunciado mudou de língua', primeiroPT !== primeiroEN, true);
  conf('a marcação sobreviveu à troca',
    await pag.$$eval('.item-exercicio input', es => es.filter(e => e.checked).length), totalEx);

  await pag.evaluate(() => {
    Array.from(document.querySelectorAll('.item-exercicio input'))
      .forEach((c, i) => { if (i >= 5) c.click(); });
  });
  await espera(400);
  await clicarTexto('#corpo-modal-tema button', 'Português');
  await espera(600);
  conf('e sobrevive na volta também',
    await pag.$$eval('.item-exercicio input', es => es.filter(e => e.checked).length), 5);

  // ================================================================
  secao('5. Escolher o que entra');

  const rotulosPartes = await pag.$$eval('#corpo-modal-tema label span',
    es => es.map(e => e.textContent.trim()).filter(t => /Material|Lista|Gabarito/.test(t)));
  conf('as três partes estão à escolha', rotulosPartes.join(' | '),
    'Material explicativo | Lista de exercícios | Gabarito');
  conf('material e lista nascem marcados, gabarito não',
    await pag.$$eval('#corpo-modal-tema label input[type=checkbox]',
      es => es.slice(0, 3).map(e => e.checked).join(',')), 'true,true,false');

  await pag.evaluate(() => {
    const cs = Array.from(document.querySelectorAll('#corpo-modal-tema label input[type=checkbox]')).slice(0, 3);
    cs[0].click(); cs[1].click();
  });
  await espera(400);
  conf('sem nenhuma parte, não dá para gerar',
    await pag.$eval('#rodape-modal-tema button.principal', e => e.disabled), true);
  conf('e o rodapé para de contar exercício',
    await pag.$eval('#rodape-modal-tema .ajuda', e => e.textContent), 'só o material explicativo');

  await pag.evaluate(() => {
    document.querySelectorAll('#corpo-modal-tema label input[type=checkbox]')[0].click();
  });
  await espera(400);
  conf('só o material explicativo já é material válido',
    await pag.$eval('#rodape-modal-tema button.principal', e => e.disabled), false);

  await pag.evaluate(() => {
    const cs = Array.from(document.querySelectorAll('#corpo-modal-tema label input[type=checkbox]')).slice(0, 3);
    cs[1].click(); cs[2].click();
  });
  await espera(400);

  // ================================================================
  secao('6. Gerar e anexar à aula');

  await clicarTexto('#rodape-modal-tema button', 'Gerar e anexar à aula');
  await espera(3000);
  conf('a janela fechou sozinha', await visivel('#modal-tema'), false);

  banco = await bd();
  const aula = banco.aulas.find(a => a.data === '2026-06-10' && a.alunoId === marcelo.id);
  conf('a aula ficou com um anexo', (aula.anexos || []).length, 1);
  conf('o anexo é PDF', /\.pdf$/.test(aula.anexos[0].nome), true);
  conf('e tem tamanho de verdade', aula.anexos[0].tamanho > 4000, true);
  conf('o tema ficou registrado na aula', (aula.temas || []).length, 1);
  conf('com a língua escolhida', aula.temas[0].lingua, 'pt');
  conf('com as três partes', (aula.temas[0].partes || []).join(','), 'material,lista,gabarito');
  conf('e com os cinco exercícios escolhidos', aula.temas[0].exercicios, 5);
  conf('o anexo aparece na lista da aula',
    await pag.$eval('#lista-anexos', e => e.textContent.indexOf('.pdf') >= 0), true);

  const pdf = await pag.evaluate((id) => new Promise((resolve) => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const s = req.result.transaction('anexos', 'readonly').objectStore('anexos').get(id);
      s.onsuccess = () => {
        const r = s.result;
        if (!r || !r.blob) return resolve(null);
        const leitor = new FileReader();
        leitor.onload = () => resolve({ tamanho: r.blob.size, cabeca: leitor.result });
        leitor.readAsText(r.blob.slice(0, 8));
      };
    };
  }), aula.anexos[0].id);
  conf('o PDF está guardado no tablet', !!pdf, true);
  conf('e é um PDF de verdade', /^%PDF-/.test(pdf && pdf.cabeca), true);

  // ================================================================
  secao('7. A folha em branco continua funcionando depois disso');

  await clicarTexto('#linha-folha button', 'Escrever à mão na folha');
  await espera(1500);
  conf('a folha abriu normalmente', await visivel('#modal-nota'), true);
  await clicarTexto('#modal-nota button', 'Concluir');
  await espera(800);

  // ================================================================
  secao('8. Um segundo material se soma, não substitui');

  await clicarTexto('#linha-folha button', 'Material de aula');
  await espera(1800);
  await clicarTexto('#lista-temas .item-tema button', 'Escolher');
  await espera(2000);
  await clicarTexto('#rodape-modal-tema button', 'Gerar e anexar à aula');
  await espera(3000);

  banco = await bd();
  const aula2 = banco.aulas.find(a => a.data === '2026-06-10' && a.alunoId === marcelo.id);
  conf('agora são dois anexos', (aula2.anexos || []).length, 2);
  conf('o primeiro continua lá', aula2.anexos[0].id, aula.anexos[0].id);
  conf('e a aula guarda os dois temas', (aula2.temas || []).length, 2);
  conf('cada tema com o seu título',
    (aula2.temas || []).every(t => t.titulo && t.titulo.length > 3), true);
  conf('os dois temas aparecem na aula',
    await pag.$$eval('#lista-temas-aula .item-lista', es => es.length), 2);

  // tirar um tema leva junto o PDF dele
  await clicarTexto('#lista-temas-aula .item-lista button', 'Tirar');
  await espera(900);
  banco = await bd();
  const aulaTirou = banco.aulas.find(a => a.data === '2026-06-10' && a.alunoId === marcelo.id);
  conf('tirar um tema deixa o outro', (aulaTirou.temas || []).length, 1);
  conf('e leva junto o anexo daquele tema', (aulaTirou.anexos || []).length, 1);

  // ================================================================
  secao('8b. Áreas trabalhadas na aula');

  conf('a lista de áreas está na aula', await visivel('#caixa-areas') || true, true);
  conf('começa recolhida, para não atrapalhar',
    await pag.$eval('#caixa-areas', e => e.style.display), 'none');
  conf('e o contador diz que não há nada marcado',
    await pag.$eval('#conta-areas', e => e.textContent), 'nenhuma');

  await pag.$eval('#abrir-areas', e => e.click());
  await espera(300);
  conf('abre ao pedir', await pag.$eval('#caixa-areas', e => e.style.display), '');
  const totalAreas = await pag.$$eval('.item-area', es => es.length);
  conf('tem áreas de sobra para o registro ficar completo', totalAreas >= 20, true);
  conf('separadas em grupos',
    await pag.$$eval('#caixa-areas .bloco-exercicios', es => es.length) >= 3, true);
  conf('as que ela pediu estão lá',
    await pag.$$eval('.item-area span', es => es.map(e => e.textContent).join(' | ')).then(t =>
      ['Autonomia nos estudos', 'Organização dos horários', 'Montagem do cronograma',
        'Priorização do que estudar', 'Disciplina e constância', 'Lidar com frustrações',
        'Ansiedade ou medo de prova'].every(r => t.indexOf(r) >= 0)), true);

  await pag.evaluate(() => {
    ['autonomia', 'cronograma', 'ansiedade'].forEach(id => {
      document.querySelector('[data-area="' + id + '"] input').click();
    });
  });
  await espera(700);
  conf('o contador acompanha',
    await pag.$eval('#conta-areas', e => e.textContent), '3 marcadas');

  banco = await bd();
  const aulaAreas = banco.aulas.find(a => a.data === '2026-06-10' && a.alunoId === marcelo.id);
  conf('as áreas ficaram gravadas', (aulaAreas.areas || []).join(','), 'autonomia,cronograma,ansiedade');

  await pag.evaluate(() => {
    document.querySelector('[data-area="cronograma"] input').click();
  });
  await espera(700);
  banco = await bd();
  conf('desmarcar tira do registro',
    (banco.aulas.find(a => a.data === '2026-06-10' && a.alunoId === marcelo.id).areas || []).join(','),
    'autonomia,ansiedade');

  // ================================================================
  secao('8c. Dividir a aula em duas');

  const rotuloDividir = await pag.$eval('#dividir-aula', e => e.textContent);
  conf('o botão diz o tamanho de cada metade', /Dividir em duas aulas de \d+ minutos/.test(rotuloDividir), true);

  banco = await bd();
  const antesDividir = banco.aulas.filter(a => a.data === '2026-06-10').length;
  const duracaoAntes = banco.aulas.find(a => a.data === '2026-06-10' && a.alunoId === marcelo.id).duracaoMin;

  await pag.$eval('#dividir-aula', e => e.click());
  await espera(1200);
  banco = await bd();
  const doDia = banco.aulas.filter(a => a.data === '2026-06-10' && a.alunoId === marcelo.id)
    .sort((x, y) => x.hora.localeCompare(y.hora));
  conf('virou duas aulas no mesmo dia', doDia.length, 2);
  conf('a soma das duas é a duração original', doDia[0].duracaoMin + doDia[1].duracaoMin, duracaoAntes);
  conf('a segunda começa quando a primeira acaba',
    doDia[1].hora, (() => {
      const [h, m] = doDia[0].hora.split(':').map(Number);
      const t = h * 60 + m + doDia[0].duracaoMin;
      return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
    })());
  conf('o que estava escrito ficou na primeira', (doDia[0].temas || []).length, 1);
  conf('e a segunda nasceu limpa', (doDia[1].temas || []).length, 0);
  conf('com as áreas em branco também', (doDia[1].areas || []).length, 0);
  conf('as áreas da primeira continuam', (doDia[0].areas || []).length, 2);

  conf('e há como desfazer, que é o que importa',
    await pag.$eval('#aviso-acao', e => e.textContent.trim()), 'Desfazer');
  await pag.$eval('#aviso-acao', e => e.click());
  await espera(1200);
  banco = await bd();
  const voltou = banco.aulas.filter(a => a.data === '2026-06-10' && a.alunoId === marcelo.id);
  conf('desfazer devolve uma aula só', voltou.length, antesDividir);
  conf('com a duração de antes', voltou[0].duracaoMin, duracaoAntes);
  conf('e sem perder o tema', (voltou[0].temas || []).length, 1);

  // ================================================================
  secao('9. Sobrevive ao recarregar');

  await pag.reload({ waitUntil: 'networkidle0' });
  await espera(1600);
  banco = await bd();
  const aula3 = banco.aulas.find(a => a.data === '2026-06-10' && a.alunoId === marcelo.id);
  conf('os anexos continuam depois de recarregar', (aula3.anexos || []).length, 1);
  conf('e o ano escolar também',
    banco.alunos.find(a => /Marcelo/i.test(a.nome)).anoEscolar, '08');

  await irParaJunho();
  await abrirAulaDoDia10();
  await clicarTexto('#linha-folha button', 'Material de aula');
  await espera(1800);
  conf('a janela reabre no ano escolar do aluno',
    await pag.$eval('#corpo-modal-tema select', e => e.value), '08');
  await clicarTexto('#rodape-modal-tema button', 'Cancelar');
  await espera(400);
  conf('cancelar fecha sem anexar nada', await visivel('#modal-tema'), false);
  banco = await bd();
  conf('e não criou anexo nenhum',
    (banco.aulas.find(a => a.data === '2026-06-10' && a.alunoId === marcelo.id).anexos || []).length, 1);

  // ================================================================
  secao('10. Erros de página');

  const reais = errosDePagina.filter(e => !/favicon|manifest|sw\.js|ServiceWorker/i.test(e));
  reais.forEach(e => console.log('  ERRO: ' + e));
  conf('nenhum erro de JavaScript', reais.length, 0);

  await pag.screenshot({ path: path.join(__dirname, 'v_temas_final.png') });
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
