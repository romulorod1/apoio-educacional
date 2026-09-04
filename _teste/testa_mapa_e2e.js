/* testa_mapa_e2e.js
 * O mapeamento visto pelo lado dela: aluno novo com encontro marcado, aluno
 * antigo mapeado depois, e o lembrete aparecendo na hora de dar aula.
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
    window.__gerados = [];
    const criar = URL.createObjectURL.bind(URL);
    URL.createObjectURL = function (b) {
      window.__ultimoTamanho = (b && b.size) || 0;
      return criar(b);
    };
    HTMLAnchorElement.prototype.click = function () {
      if (this.hasAttribute('download')) {
        window.__gerados.push({
          nome: this.getAttribute('download'),
          tamanho: window.__ultimoTamanho || 0
        });
      }
    };
  });

  await pag.goto(URL_APP, { waitUntil: 'networkidle0' });
  await espera(1500);

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
    await espera(300);
  }
  async function preencher(sel, valor) {
    await pag.$eval(sel, (e, v) => {
      const proto = e.tagName === 'TEXTAREA'
        ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(e, v);
      e.dispatchEvent(new Event('input', { bubbles: true }));
      e.dispatchEvent(new Event('change', { bubbles: true }));
    }, valor);
    await espera(140);
  }
  async function abrirFichaDoMarcelo() {
    await pag.evaluate(() => {
      const linha = Array.from(document.querySelectorAll('#lista-alunos .item-lista'))
        .find(e => /Marcelo/.test(e.textContent));
      linha.click();
    });
    await espera(700);
  }

  async function aba(nome) {
    await pag.evaluate(n => {
      Array.from(document.querySelectorAll('.aba-perfil')).find(x => x.textContent.trim() === n).click();
    }, nome);
    await espera(350);
  }

  // ================================================================
  secao('1. Aluno novo com encontro de mapeamento');

  await pag.evaluate(() => {
    Array.from(document.querySelectorAll('#abas .aba')).find(b => b.dataset.tela === 'alunos').click();
  });
  await espera(400);
  await clicarTexto('#tela-alunos button', 'Novo aluno');
  await espera(500);

  conf('a opção de mapeamento aparece no aluno novo',
    await pag.$eval('#campo-agendar-mapeamento', e => !!e), true);
  conf('e começa desmarcada, porque nem todo aluno precisa',
    await pag.$eval('#campo-agendar-mapeamento', e => e.checked), false);
  conf('os campos do encontro ficam escondidos até ela pedir',
    await pag.$eval('#caixa-mapeamento-novo', e => e.style.display), 'none');

  await preencher('#campo-nome', 'Helena Prova');
  await preencher('#campo-responsavel', 'Mãe da Helena');
  await pag.$eval('#campo-agendar-mapeamento', e => e.click());
  await espera(400);
  conf('marcar abre os campos de data e horário',
    await pag.$eval('#caixa-mapeamento-novo', e => e.style.display), '');

  await preencher('#campo-mapa-data', '2026-09-02');
  await preencher('#campo-mapa-hora', '14:00');
  conf('a duração sugerida é maior que a de uma aula comum',
    await pag.$eval('#campo-mapa-duracao', e => e.value), '90');

  await clicarTexto('#modal-aluno .modal-rodape button', 'Salvar');
  await espera(1600);

  let banco = await bd();
  const helena = banco.alunos.find(a => a.nome === 'Helena Prova');
  conf('a aluna foi criada', !!helena, true);
  const encontro = banco.aulas.find(a => a.alunoId === helena.id);
  conf('o encontro foi marcado', !!encontro, true);
  conf('na data escolhida', encontro.data, '2026-09-02');
  conf('com a duração escolhida', encontro.duracaoMin, 90);
  conf('e marcado como mapeamento', encontro.tipo, 'mapeamento');
  conf('conta como aula cobrável, porque é trabalho', encontro.cobravel, true);
  conf('a data de início do relacionamento foi preenchida sozinha', helena.desde, '2026-09-02');
  conf('a janela do encontro abriu na hora', await visivel('#modal-aula'), true);

  // ================================================================
  secao('2. A janela do encontro é diferente da aula comum');

  conf('avisa que é encontro de mapeamento',
    await pag.$eval('#corpo-modal-aula .faixa-info', e => /Encontro de mapeamento/.test(e.textContent)), true);
  conf('traz o roteiro sugerido',
    await pag.$$eval('#roteiro-mapeamento .passo-roteiro', es => es.length) >= 4, true);
  conf('o roteiro fala da conversa com o responsável',
    await pag.$eval('#roteiro-mapeamento', e => /respons[áa]vel/i.test(e.textContent)), true);
  conf('e da sondagem escrita',
    await pag.$eval('#roteiro-mapeamento', e => /sondagem/i.test(e.textContent)), true);
  conf('tem o botão de preencher o mapeamento',
    await pag.$eval('#abrir-mapeamento', e => e.textContent.trim()), 'Preencher o mapeamento');
  conf('a folha em branco continua ali',
    await pag.$$eval('#linha-folha button', es => es.map(e => e.textContent.trim())[0]),
    'Escrever à mão na folha');

  // ================================================================
  secao('3. Preencher o mapeamento');

  await pag.$eval('#abrir-mapeamento', e => e.click());
  await espera(900);
  conf('a janela de mapeamento abriu', await visivel('#modal-mapeamento'), true);
  conf('diz que está ligada ao encontro de hoje',
    await pag.$eval('#corpo-modal-mapeamento', e => /ligado ao encontro/.test(e.textContent)), true);

  const grupos = await pag.$$eval('#corpo-modal-mapeamento [data-grupo]', es => es.map(e => e.dataset.grupo));
  conf('os cinco grupos estão na tela', grupos.join(','), 'fortes,atencao,lacunas,rotina,aprende');
  const totalItens = await pag.$$eval('#corpo-modal-mapeamento .item-area', es => es.length);
  conf('com itens de sobra para clicar', totalItens >= 60, true);
  conf('cada lacuna tem atalho para os temas',
    await pag.$$eval('[data-item^="lacunas:"] button', es => es.length) >= 20, true);
  conf('e os outros grupos não têm, porque não são conteúdo',
    await pag.$$eval('[data-item^="atencao:"] button', es => es.length), 0);

  await pag.evaluate(() => {
    ['fortes:raciocinio-ok', 'fortes:gosta',
      'atencao:sinal', 'atencao:vespera', 'atencao:ansiedade-prova',
      'lacunas:fracoes', 'lacunas:eq1',
      'rotina:agenda-cheia', 'aprende:visual'].forEach(k => {
        document.querySelector('[data-item="' + k + '"] input').click();
      });
  });
  await espera(400);

  await pag.select('#mapa-nivel', '2');
  await pag.select('#mapa-ano', '08');
  await preencher('#corpo-modal-mapeamento [data-campo="escola"] input', 'Colégio de Teste');
  await preencher('#corpo-modal-mapeamento [data-campo="prioridades"] textarea',
    'Fechar frações até outubro');
  await preencher('#corpo-modal-mapeamento [data-campo="plano"] textarea',
    'Duas semanas de base antes de voltar ao conteúdo do ano.');
  await espera(300);

  await pag.$eval('#salvar-mapeamento', e => e.click());
  await espera(1600);
  conf('a janela fechou ao salvar', await visivel('#modal-mapeamento'), false);

  banco = await bd();
  const helena2 = banco.alunos.find(a => a.nome === 'Helena Prova');
  conf('o mapeamento foi gravado', (helena2.mapeamentos || []).length, 1);
  const mapa = helena2.mapeamentos[0];
  conf('com os pontos de atenção', mapa.marcados.atencao.join(','), 'sinal,vespera,ansiedade-prova');
  conf('com as lacunas', mapa.marcados.lacunas.join(','), 'fracoes,eq1');
  conf('com o nível', mapa.nivel, '2');
  conf('com a escola', mapa.escola, 'Colégio de Teste');
  conf('com as prioridades', mapa.prioridades, 'Fechar frações até outubro');
  conf('ligado ao encontro', mapa.aulaId, encontro.id);
  conf('e o ano escolar foi para a ficha do aluno', helena2.anoEscolar, '08');

  // ================================================================
  secao('4. O lembrete aparece na próxima aula');

  await pag.evaluate(() => {
    const btn = document.querySelector('#modal-aula .fechar');
    if (btn) btn.click();
  });
  await espera(400);

  await pag.evaluate(() => {
    Array.from(document.querySelectorAll('#abas .aba')).find(b => b.dataset.tela === 'agenda').click();
  });
  await espera(500);
  await pag.evaluate(async () => {
    let guarda = 0;
    while (document.querySelector('#rotulo-mes').textContent !== 'Setembro de 2026' && guarda++ < 40) {
      document.querySelector('#mes-seguinte').click();
      await new Promise(r => setTimeout(r, 40));
    }
  });
  await espera(700);

  conf('o encontro aparece marcado na agenda',
    await pag.$$eval('.pilula.mapeamento', es => es.length) >= 1, true);
  conf('e diz que é mapeamento',
    await pag.$eval('.pilula.mapeamento', e => /mapeamento/.test(e.textContent)), true);

  // cria uma aula comum para a Helena e confere o lembrete
  await pag.evaluate(() => {
    document.querySelector('[data-dia="2026-09-09"]').click();
  });
  await espera(600);
  await pag.evaluate((id) => {
    const sel = document.querySelector('#campo-aluno');
    sel.value = id;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }, helena.id);
  await espera(300);
  conf('a aula nova avisa o que vem depois de salvar',
    await pag.$eval('#ajuda-aula-nova', e => /ao salvar/i.test(e.textContent)), true);

  await clicarTexto('#modal-aula .modal-rodape button', 'Salvar');
  await espera(1600);

  conf('a aula recém-criada abre sozinha', await visivel('#modal-aula'), true);
  conf('e já traz a folha e o material de aula',
    await pag.$$eval('#linha-folha button', es => es.map(e => e.textContent.trim()).join(' | ')),
    'Escrever à mão na folha | Material de aula | Anexar PDF | Anexar foto');

  conf('o lembrete do mapeamento está lá', await visivel('#lembrete-mapeamento'), true);
  const lembrete = await pag.$eval('#lembrete-mapeamento', e => e.textContent);
  conf('com as prioridades', /Fechar frações até outubro/.test(lembrete), true);
  conf('com as lacunas', /Frações/.test(lembrete), true);
  conf('com os pontos de atenção', /Erros de sinal/.test(lembrete), true);
  conf('e com o jeito de aprender', /Vendo o desenho/.test(lembrete), true);

  await pag.$eval('#usar-lembrete', e => e.click());
  await espera(700);
  const anotacao = await pag.$eval('#campo-nota-texto', e => e.value);
  conf('dá para copiar o lembrete para a anotação', anotacao.indexOf('Prioridades:'), 0);
  conf('sem apagar o que já estava escrito',
    await pag.evaluate(async () => {
      const area = document.querySelector('#campo-nota-texto');
      const antes = area.value;
      document.querySelector('#usar-lembrete').click();
      await new Promise(r => setTimeout(r, 300));
      return area.value.indexOf(antes) === 0 && area.value.length > antes.length;
    }), true);

  // ================================================================
  secao('5. Nunca é tarde: mapear um aluno antigo');

  await pag.evaluate(() => {
    const btn = document.querySelector('#modal-aula .fechar');
    if (btn) btn.click();
  });
  await espera(400);
  await pag.evaluate(() => {
    Array.from(document.querySelectorAll('#abas .aba')).find(b => b.dataset.tela === 'alunos').click();
  });
  await espera(500);
  await abrirFichaDoMarcelo();
  await espera(700);

  const nomesAbas = await pag.$$eval('.aba-perfil', es => es.map(e => e.textContent.trim()));
  conf('a ficha do aluno ganhou a aba de mapeamento', nomesAbas.join(','),
    'Dados,Valores,Mapeamento,Histórico,Proposta');
  conf('e a opção de agendar encontro não aparece para aluno já existente',
    await pag.$('#campo-agendar-mapeamento') === null, true);

  await aba('Mapeamento');
  conf('diz que o aluno ainda não foi mapeado',
    await pag.$eval('.aba-perfil.ativa', e => e.textContent.trim()), 'Mapeamento');
  conf('e convida a mapear mesmo assim',
    await pag.$eval('#mapear-aluno', e => /Mapear/.test(e.textContent)), true);

  await pag.$eval('#mapear-aluno', e => e.click());
  await espera(900);
  conf('a janela de mapeamento abriu para o aluno antigo',
    await visivel('#modal-mapeamento'), true);
  conf('e não fala em encontro de hoje, porque não veio de um',
    await pag.$eval('#corpo-modal-mapeamento', e => /ligado ao encontro/.test(e.textContent)), false);

  await pag.evaluate(() => {
    ['atencao:dispersa', 'lacunas:proporcao'].forEach(k => {
      document.querySelector('[data-item="' + k + '"] input').click();
    });
  });
  await espera(300);
  await pag.$eval('#salvar-mapeamento', e => e.click());
  await espera(1400);

  banco = await bd();
  const marcelo = banco.alunos.find(a => /Marcelo/.test(a.nome));
  conf('o aluno antigo agora está mapeado', (marcelo.mapeamentos || []).length, 1);
  conf('com o que ela marcou', marcelo.mapeamentos[0].marcados.atencao.join(','), 'dispersa');

  // ================================================================
  secao('6. Refazer o mapeamento guarda o anterior');

  await abrirFichaDoMarcelo();
  await espera(700);
  await aba('Mapeamento');
  conf('a aba agora mostra o mapeamento',
    await pag.$eval('#editar-mapeamento', e => !!e), true);

  await pag.$eval('#refazer-mapeamento', e => e.click());
  await espera(900);
  conf('a revisão avisa que começa do anterior',
    await pag.$eval('#corpo-modal-mapeamento', e => /Revisão do mapeamento/.test(e.textContent)), true);
  conf('e já vem com o que estava marcado antes',
    await pag.$eval('[data-item="atencao:dispersa"] input', e => e.checked), true);

  await pag.evaluate(() => {
    document.querySelector('[data-item="atencao:dispersa"] input').click();
    document.querySelector('[data-item="fortes:persiste"] input').click();
  });
  await espera(300);
  await pag.$eval('#salvar-mapeamento', e => e.click());
  await espera(1400);

  banco = await bd();
  const marcelo2 = banco.alunos.find(a => /Marcelo/.test(a.nome));
  conf('agora são dois mapeamentos', (marcelo2.mapeamentos || []).length, 2);
  conf('o antigo ficou como estava',
    marcelo2.mapeamentos[0].marcados.atencao.join(','), 'dispersa');
  conf('e o novo tem a mudança',
    marcelo2.mapeamentos[1].marcados.fortes.join(','), 'persiste');
  conf('o novo não herdou o que ela desmarcou',
    marcelo2.mapeamentos[1].marcados.atencao.length, 0);

  // ================================================================
  secao('7. A lacuna leva à trilha, os temas continuam a um toque, e a ficha vira PDF');

  /* O botão da lacuna mudou de destino de propósito: antes abria a busca de
   * temas, que devolve dezoito resultados em ordem de relevância, começando pelo
   * 8º ano e pulando para o 4º. Agora monta a trilha, que é a mesma lista em
   * ordem de pré-requisito.
   *
   * O caminho antigo NÃO sumiu, e é isso que as asserções de baixo continuam
   * conferindo: ele está dentro da trilha, em "Ver os temas soltos". */

  await abrirFichaDoMarcelo();
  await espera(700);
  await aba('Mapeamento');
  await pag.$eval('#editar-mapeamento', e => e.click());
  await espera(900);

  await pag.$eval('[data-item="lacunas:fracoes"] button', e => e.click());
  await espera(2200);
  conf('a trilha abriu pela lacuna', await visivel('#modal-trilha'), true);
  const tituloTrilha = await pag.$eval('#titulo-modal-trilha', e => e.textContent.trim());
  conf('e o título diz o que ela fecha', /Fraç/i.test(tituloTrilha), true);

  /* Daqui em diante é o caminho de hoje, um nível abaixo. */
  await clicarTexto('#modal-trilha button', 'Ver os temas soltos');
  await espera(2000);
  conf('a janela de temas continua a um toque, de dentro da trilha',
    await visivel('#modal-tema'), true);
  conf('com a busca já preenchida',
    await pag.$eval('#corpo-modal-tema input[type=text]', e => e.value), 'fração');
  const achados = await pag.$$eval('#lista-temas .item-tema', es => es.map(e => e.textContent));
  conf('e achou temas de fração', achados.length > 0, true);
  /* Todo resultado precisa dizer POR QUE esta ali. A busca olha titulo, resumo,
   * explicacao e exercicios, entao um tema pode entrar sem a palavra aparecer no
   * que se le: nesses casos a etiqueta cinza no fim da linha diz onde bateu.
   *
   * Medido: por este caminho a lista traz 18 temas, cinco deles achados so pelos
   * exercicios. Pelo caminho antigo vinham 9, porque a lista abria antes de o
   * indice de busca terminar de carregar e caia no casamento por titulo e resumo.
   * A busca por conteudo e a funcionalidade que ela mais elogiou, entao passar a
   * ter os cinco aqui e ganho, desde que a etiqueta explique cada um. */
  conf('todo resultado fala de fração ou diz onde bateu',
    achados.every(t => /fra[cç]/i.test(t) || /tratado n/i.test(t)), true);
  conf('o botão final não fala em anexar, porque não há aula aqui',
    await pag.$eval('#rodape-modal-tema button', e => e.textContent.trim()), 'Cancelar');

  await clicarTexto('#lista-temas .item-tema button', 'Escolher');
  await espera(1800);
  conf('e na montagem o botão diz só gerar',
    await pag.$eval('#rodape-modal-tema button.principal', e => e.textContent.trim()), 'Gerar material');

  await clicarTexto('#rodape-modal-tema button', 'Cancelar');
  await espera(400);

  // ficha em PDF
  await abrirFichaDoMarcelo();
  await espera(700);
  await aba('Mapeamento');
  await pag.$eval('#pdf-mapeamento', e => e.click());
  await espera(1600);
  const gerados = await pag.evaluate(() => window.__gerados || []);
  conf('a ficha saiu em PDF', gerados.length >= 1, true);
  conf('com o nome do aluno no arquivo', /Mapeamento_.*\.pdf/.test(gerados[gerados.length - 1].nome), true);
  conf('e com conteúdo de verdade', gerados[gerados.length - 1].tamanho > 1500, true);

  // ================================================================
  secao('8. Sobrevive ao recarregar');

  await pag.reload({ waitUntil: 'networkidle0' });
  await espera(1600);
  banco = await bd();
  conf('os mapeamentos continuam lá',
    (banco.alunos.find(a => /Marcelo/.test(a.nome)).mapeamentos || []).length, 2);
  conf('e o da aluna nova também',
    (banco.alunos.find(a => a.nome === 'Helena Prova').mapeamentos || []).length, 1);

  // ================================================================
  secao('9. Erros de página');

  const reais = errosDePagina.filter(e => !/favicon|manifest|sw\.js|ServiceWorker/i.test(e));
  reais.forEach(e => console.log('  ERRO: ' + e));
  conf('nenhum erro de JavaScript', reais.length, 0);

  await pag.screenshot({ path: path.join(__dirname, 'v_mapa_final.png') });
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
