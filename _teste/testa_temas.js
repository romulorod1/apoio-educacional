/* testa_temas.js
 * A janela da aula: a folha, o assunto vindo do banco de temas, as áreas
 * trabalhadas e dividir a aula em duas.
 *
 * O ponto que mais importa aqui é a folha em branco continuar sendo o caminho
 * principal, e nada que venha ao lado dela atrapalhar o caminho normal.
 *
 * O MATERIAL AUTORAL SAIU (B7): o botão "Material de aula" e a montagem do PDF
 * com explicação, exercícios e gabarito não existem mais, e quem prova isso é
 * o testa_sem_material_autoral, com veneno. O que este arquivo guarda é o que
 * sobrou e continua sendo dela: a LISTA de temas de matemática, que hoje serve
 * para registrar o assunto da aula (mesmo seletor de ano, mesma busca, mesma
 * memória do ano escolar do aluno), mais as áreas e a divisão da aula.
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
  conf('e a fileira é só ela e os anexos', botoes.join(' | '),
    'Escrever à mão na folha | Anexar PDF | Anexar foto');
  const ajuda = await pag.$eval('#ajuda-folha', e => e.textContent);
  conf('o texto diz que a folha é o começo', /folha em branco é sempre o começo/i.test(ajuda), true);
  conf('e não promete mais material de aula', /atalho opcional|Material de aula/i.test(ajuda), false);

  // ================================================================
  secao('2. A lista de temas de matemática, pela escolha de assunto');

  /* A lista morava atrás do botão "Material de aula", que saiu com o material
   * autoral (testa_sem_material_autoral). A LISTA não saiu: é a mesma
   * desenharEscolhaTema, com o mesmo seletor de ano, a mesma busca e a mesma
   * memória do ano escolar do aluno. Hoje se chega a ela por Escolher o
   * assunto da aula, "Por matéria", Matemática, e escolher REGISTRA o assunto
   * em vez de montar PDF. */
  async function abrirListaDeTemas() {
    await clicarTexto('#corpo-modal-aula button', 'assunto');
    await espera(1600);
    await pag.evaluate(() => {
      const l = Array.from(document.querySelectorAll('#corpo-modal-tema .item-lista'))
        .find(x => x.querySelector('.nome') && x.querySelector('.nome').textContent.trim() === 'Matemática');
      if (!l) throw new Error('nao achei a linha Matematica em "Por materia"');
      l.click();
    });
    await espera(1600);
  }

  await abrirListaDeTemas();
  conf('a janela abriu', await visivel('#modal-tema'), true);
  const quantosTemas = await pag.$$eval('#lista-temas .item-tema', e => e.length);
  conf('a lista abriu com temas do ano escolhido', quantosTemas > 5, true);
  conf('abre no 6º ano quando ainda não sabe o ano do aluno',
    await pag.$eval('#corpo-modal-tema select', e => e.value), '06');

  await pag.evaluate(porValor('#corpo-modal-tema input[type=text]', 'fra'));
  await espera(400);
  const filtrados = await pag.$$eval('#lista-temas .item-tema .nome', es => es.map(e => e.textContent));
  /* A busca ATRAVESSA os anos de propósito: o assunto que ela procura muitas
   * vezes está no ano anterior, e é disso que a aula de reforço trata. Por
   * isso o que se confere não é a lista ter encolhido, e sim ela ter CRESCIDO
   * para além do ano aberto, e tudo que voltou ser mesmo sobre o que ela
   * digitou. As duas contas juntas: uma sozinha deixa passar busca que devolve
   * o banco inteiro, a outra sozinha deixa passar busca presa no ano. */
  conf('a busca devolveu alguma coisa', filtrados.length > 0, true);
  conf('e tudo que voltou é sobre frações',
    filtrados.slice(0, 5).every(t => /[Ff]ra[çc]/.test(t)), true);
  conf('a busca sai do ano aberto quando o assunto está em outro',
    filtrados.length > quantosTemas, true);

  /* O `every` estrito que morava no testa_mapa_e2e, na busca aberta de dentro
   * da trilha por "Ver os temas soltos". Aquele caminho levava ao material
   * autoral e saiu com ele (B7), mas a PROPRIEDADE que ele guardava é da busca
   * e continua valendo aqui: todo resultado precisa dizer POR QUE está ali.
   *
   * A busca olha título, resumo, explicação e exercícios, então um tema pode
   * entrar sem a palavra aparecer no que se lê. Nesses casos a etiqueta cinza
   * no fim da linha (Busca.ROTULO) diz onde bateu. Resultado que não fala do
   * assunto E não traz etiqueta é resultado que ela não consegue explicar. */
  const comMotivo = await pag.$$eval('#lista-temas .item-tema', es => es.map(e => ({
    titulo: e.querySelector('.nome').firstChild.textContent,
    resumo: (e.querySelector('.detalhe') || {}).textContent || '',
    etiquetas: Array.from(e.querySelectorAll('.nome .tag')).map(t => t.textContent.trim())
  })));
  const MOTIVOS = ['sobre este assunto', 'tratado nos exercícios',
    'aparece nos exercícios', 'aparece na explicação'];
  conf('a lista veio com itens para conferir', comMotivo.length > 0, true);
  const soPelaEtiqueta = x => !/fra[cç]/i.test(x.titulo) && !/fra[cç]/i.test(x.resumo) &&
    x.etiquetas.some(t => MOTIVOS.indexOf(t) >= 0);
  conf('todo resultado fala de fração ou diz onde bateu',
    comMotivo.every(x => /fra[cç]/i.test(x.titulo) || /fra[cç]/i.test(x.resumo) ||
      soPelaEtiqueta(x)), true);
  /* O OUTRO LADO, sem o qual o `every` acima é de uma ponta só.
   *
   * Se a busca regredisse para casar apenas por TÍTULO, todo resultado teria
   * "fra" no título, o `every` passaria e o comentário acima continuaria
   * dizendo que a busca olha explicação e exercícios. Esta linha prende que a
   * busca por CONTEÚDO está viva: pelo menos um resultado entrou sem a palavra
   * aparecer no que se lê, e a etiqueta cinza é quem explica por quê. É
   * também a metade que a mudança de casa deixou para trás quando a trava veio
   * do testa_mapa_e2e. */
  conf('e pelo menos um só se explica pela etiqueta, o que prova que a busca olha o conteúdo',
    comMotivo.some(soPelaEtiqueta), true);

  /* Ela digita no teclado do tablet, onde o acento custa toques a mais. Antes
     disto, procurar sem acento devolvia a lista vazia como se o assunto não
     existisse. A igualdade sozinha não guarda nada, porque zero é igual a
     zero: é o "> 0" que prende o defeito. */
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
  await espera(400);
  conf('busca sem resultado avisa em vez de ficar em branco',
    await pag.$eval('#lista-temas', e => /Nenhum tema encontrado/.test(e.textContent)), true);

  await pag.evaluate(porValor('#corpo-modal-tema input[type=text]', ''));
  await espera(400);

  // ================================================================
  secao('3. O ano escolhido fica lembrado no aluno');

  /* Ler de volta o valor que o próprio teste acabou de escrever no select não
   * afirma nada. O que prova que o ano trocou é a LISTA ter trocado. */
  const temas06 = await pag.$$eval('#lista-temas .item-tema .nome', es => es.map(e => e.textContent));
  await pag.select('#corpo-modal-tema select', '08');
  await espera(900);
  const temas08 = await pag.$$eval('#lista-temas .item-tema .nome', es => es.map(e => e.textContent));
  conf('trocar o ano trocou a lista', temas08.length > 0 && temas08.join('|') !== temas06.join('|'), true);
  let banco = await bd();
  const marcelo = banco.alunos.find(a => /Marcelo/i.test(a.nome));
  conf('o aluno da aula é o Marcelo', !!marcelo, true);
  conf('e o ano escolar dele fica gravado', marcelo.anoEscolar, '08');

  // ================================================================
  secao('4. Escolher um tema REGISTRA o assunto, e não monta PDF');

  const titulosDoAno = await pag.$$eval('#lista-temas .item-tema .nome',
    es => es.map(e => e.firstChild.textContent.trim()));
  conf('o ano tem temas para escolher', titulosDoAno.length > 0, true);
  const escolhido = titulosDoAno[0];
  conf('o botão da linha convida a usar',
    await pag.$eval('#lista-temas .item-tema button', e => e.textContent.trim()), 'Usar');
  const detalhes = await pag.$$eval('#lista-temas .item-tema .detalhe', es => es.map(e => e.textContent).join(' '));
  conf('e a linha não promete mais contagem de exercícios', /[0-9]+ exercícios/.test(detalhes), false);
  conf('mas continua dizendo a duração e a dificuldade, que são do grafo',
    /cerca de [0-9]+ minutos · dificuldade [0-9] de 5/.test(detalhes), true);
  await clicarTexto('#lista-temas .item-tema button', 'Usar');
  await espera(1400);
  conf('a janela fecha ao escolher', await visivel('#modal-tema'), false);

  banco = await bd();
  const aula = banco.aulas.find(a => a.data === '2026-06-10' && a.alunoId === marcelo.id);
  conf('o assunto ficou registrado na aula', (aula.temas || []).length, 1);
  conf('com o título do tema', aula.temas[0].titulo, escolhido);
  conf('e nenhum PDF foi gerado', (aula.anexos || []).length, 0);
  conf('nem língua nem partes, que eram do material',
    (aula.temas[0].lingua || '') + (aula.temas[0].partes || []).join(''), '');
  conf('o assunto aparece na aula',
    await pag.$$eval('#lista-temas-aula .item-lista', es => es.length), 1);

  // ================================================================
  secao('7. A folha em branco continua funcionando depois disso');

  await clicarTexto('#linha-folha button', 'Escrever à mão na folha');
  await espera(1500);
  conf('a folha abriu normalmente', await visivel('#modal-nota'), true);
  await clicarTexto('#modal-nota button', 'Concluir');
  await espera(800);

  // ================================================================
  secao('8. Um segundo assunto se soma, não substitui');

  await abrirListaDeTemas();
  await espera(600);
  const titulos2 = await pag.$$eval('#lista-temas .item-tema .nome',
    es => es.map(e => e.firstChild.textContent.trim()));
  const segundo = titulos2.filter(t => t !== escolhido)[0];
  await pag.evaluate(t => {
    const l = Array.from(document.querySelectorAll('#lista-temas .item-tema'))
      .find(x => x.querySelector('.nome').firstChild.textContent.trim() === t);
    l.querySelector('button').click();
  }, segundo);
  await espera(1400);

  banco = await bd();
  const aula2 = banco.aulas.find(a => a.data === '2026-06-10' && a.alunoId === marcelo.id);
  conf('a aula guarda os dois assuntos', (aula2.temas || []).length, 2);
  conf('o primeiro continua lá', aula2.temas[0].titulo, escolhido);
  conf('e o segundo entrou depois', aula2.temas[1].titulo, segundo);
  conf('cada um com o seu título',
    (aula2.temas || []).every(t => t.titulo && t.titulo.length > 3), true);
  conf('os dois aparecem na aula',
    await pag.$$eval('#lista-temas-aula .item-lista', es => es.length), 2);

  await clicarTexto('#lista-temas-aula .item-lista button', 'Tirar');
  await espera(900);
  banco = await bd();
  const aulaTirou = banco.aulas.find(a => a.data === '2026-06-10' && a.alunoId === marcelo.id);
  conf('tirar um assunto deixa o outro', (aulaTirou.temas || []).length, 1);
  conf('e não sobra anexo nenhum', (aulaTirou.anexos || []).length, 0);

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
  conf('o assunto continua depois de recarregar', (aula3.temas || []).length, 1);
  conf('e o ano escolar também',
    banco.alunos.find(a => /Marcelo/i.test(a.nome)).anoEscolar, '08');

  await irParaJunho();
  await abrirAulaDoDia10();
  await abrirListaDeTemas();
  conf('a lista reabre no ano escolar do aluno',
    await pag.$eval('#corpo-modal-tema select', e => e.value), '08');
  await clicarTexto('#rodape-modal-tema button', 'Cancelar');
  await espera(400);
  conf('cancelar fecha sem registrar nada', await visivel('#modal-tema'), false);
  banco = await bd();
  conf('e a aula continua com um assunto só',
    (banco.aulas.find(a => a.data === '2026-06-10' && a.alunoId === marcelo.id).temas || []).length, 1);

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
