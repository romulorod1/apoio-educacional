/* e2e.js
 * Testes de ponta a ponta, simulando o que a Nathália faz de verdade no tablet.
 * Roda no Chrome instalado, com toque e caneta simulados.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL_APP = 'http://127.0.0.1:8777/index.html';
const PASTA_DOWNLOAD = path.join(__dirname, 'baixados');

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
  if (fs.existsSync(PASTA_DOWNLOAD)) fs.rmSync(PASTA_DOWNLOAD, { recursive: true, force: true });
  fs.mkdirSync(PASTA_DOWNLOAD, { recursive: true });

  const navegador = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1280, height: 1000, isMobile: false, hasTouch: true }
  });

  const pag = await navegador.newPage();
  const errosDePagina = [];
  global.__errosPag = errosDePagina;
  pag.on('pageerror', e => errosDePagina.push(e.message));
  pag.on('console', m => { if (m.type() === 'error') errosDePagina.push('console: ' + m.text()); });
  pag.on('dialog', async d => { try { await d.accept(); } catch (e) { /* já tratado */ } });

  const cdp = await pag.target().createCDPSession();
  await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: PASTA_DOWNLOAD });

  /* O Chrome bloqueia downloads automáticos em sequência, então capturamos o
     arquivo no momento em que o aplicativo o entrega. É o mesmo conteúdo. */
  await pag.evaluateOnNewDocument(() => {
    window.__gerados = [];
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    const criarOriginal = URL.createObjectURL.bind(URL);
    URL.createObjectURL = function (blob) { window.__ultimoBlob = blob; return criarOriginal(blob); };
    const clicarOriginal = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.hasAttribute('download')) {
        const blob = window.__ultimoBlob;
        const leitor = new FileReader();
        leitor.onload = () => window.__gerados.push({
          nome: this.getAttribute('download'), tamanho: blob.size, base64: leitor.result.split(',')[1]
        });
        leitor.readAsDataURL(blob);
        return;
      }
      return clicarOriginal.call(this);
    };
  });

  await pag.goto(URL_APP, { waitUntil: 'networkidle0' });
  await espera(1200);

  // ---------- utilidades de interação ----------

  const $texto = (sel) => pag.$eval(sel, e => e.textContent.trim()).catch(() => null);
  const conta = (sel) => pag.$$eval(sel, es => es.length).catch(() => 0);
  const visivel = (sel) => pag.$eval(sel, e => {
    const s = getComputedStyle(e);
    return s.display !== 'none' && s.visibility !== 'hidden';
  }).catch(() => false);

  async function clicarTexto(seletor, texto) {
    const alvo = await pag.evaluateHandle((sel, txt) => {
      const els = Array.from(document.querySelectorAll(sel));
      return els.find(e => e.textContent.trim() === txt) ||
        els.find(e => e.textContent.trim().indexOf(txt) >= 0) || null;
    }, seletor, texto);
    const el = alvo.asElement();
    if (!el) {
      const disponiveis = await pag.$$eval(seletor, es => es.map(e => e.textContent.trim()));
      throw new Error('Não achei "' + texto + '" em ' + seletor +
        '. Disponíveis: ' + JSON.stringify(disponiveis));
    }
    await el.evaluate(e => { e.scrollIntoView({block:'center'}); e.click(); });
    await espera(260);
  }

  /* Clique direto no elemento: no modo sem janela a rolagem às vezes deixa o
     alvo fora da área visível, e o clique por coordenada erra. */
  async function clicar(sel) {
    await pag.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click(); });
    await espera(260);
  }

  async function preencher(sel, valor) {
    await pag.$eval(sel, (e, v) => {
      const proto = e.tagName === 'TEXTAREA'
        ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(e, v);
      e.dispatchEvent(new Event('input', { bubbles: true }));
      e.dispatchEvent(new Event('change', { bubbles: true }));
    }, valor);
    await espera(120);
  }

  async function escolher(sel, valor) {
    await pag.select(sel, valor);
    await espera(150);
  }

  async function aba(nome) {
    await pag.evaluate(n => {
      Array.from(document.querySelectorAll('#abas .aba'))
        .find(b => b.dataset.tela === n).click();
    }, nome);
    await espera(300);
  }

  // Lê o estado real do banco, para conferir o que a interface gravou.
  const bd = () => pag.evaluate(() => new Promise((resolve) => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const b = req.result;
      const s = b.transaction('dados', 'readonly').objectStore('dados').get('principal');
      s.onsuccess = () => resolve(s.result);
    };
  }));

  /* Salva em disco tudo que o aplicativo entregou desde a última coleta. */
  async function coletarGerados() {
    const novos = await pag.evaluate(() => {
      const lista = window.__gerados || [];
      window.__gerados = [];
      return lista;
    });
    novos.forEach(g => fs.writeFileSync(path.join(PASTA_DOWNLOAD, g.nome), Buffer.from(g.base64, 'base64')));
    return novos.map(g => g.nome);
  }

  /* Traço de caneta com pressão, igual ao da S Pen. */
  async function desenhar(pontos) {
    await pag.evaluate((pts) => {
      const c = document.querySelector('#tela-desenho');
      const r = c.getBoundingClientRect();
      const ev = (tipo, x, y, p) => c.dispatchEvent(new PointerEvent(tipo, {
        pointerId: 1, pointerType: 'pen', pressure: p, isPrimary: true, bubbles: true,
        clientX: r.left + x, clientY: r.top + y
      }));
      ev('pointerdown', pts[0][0], pts[0][1], 0.4);
      for (let i = 1; i < pts.length; i++) ev('pointermove', pts[i][0], pts[i][1], 0.3 + (i % 5) * 0.12);
      ev('pointerup', pts[pts.length - 1][0], pts[pts.length - 1][1], 0.3);
    }, pontos);
    await espera(160);
  }

  // ================================================================
  secao('1. Primeira abertura: o exemplo do Marcelo já preenchido');

  conf('mês exibido é junho de 2026', await $texto('#rotulo-mes'), 'Junho de 2026');
  conf('calendário desenhado', (await conta('.dia')) > 28, true);
  conf('as 10 aulas do Marcelo aparecem', await conta('.pilula'), 10);

  const numerosAgenda = await pag.$$eval('#numeros-mes .numero', es =>
    es.map(e => e.querySelector('.rotulo').textContent + '=' + e.querySelector('.valor').textContent));
  conf('encontros no mês', numerosAgenda[0], 'Encontros=10');
  conf('horas cobradas no mês', numerosAgenda[1], 'Horas cobradas=10:30 h');
  conf('valor a receber no mês', numerosAgenda[2], 'A receber=R$ 1.050,00');
  conf('um aluno no mês', numerosAgenda[3], 'Alunos=1');

  // ================================================================
  secao('2. Conferência do fechamento contra o documento real dela');

  await aba('fechamento');
  const numFech = await pag.$$eval('#numeros-fechamento .numero .valor', es => es.map(e => e.textContent));
  conf('horas no fechamento', numFech[2], '10:30 h');
  conf('total no fechamento', numFech[3], 'R$ 1.050,00');
  const linhasTabela = await conta('#lista-fechamento tbody tr');
  conf('dez aulas mais a linha de total', linhasTabela, 11);
  const totalLinha = await pag.$eval('#lista-fechamento tr.total', e =>
    Array.from(e.querySelectorAll('td')).map(t => t.textContent).join('|'));
  conf('linha de total', totalLinha, 'Total||10:30 h||R$ 1.050,00');

  // ================================================================
  secao('3. Cadastrar uma aluna nova, com valor por hora');

  await aba('alunos');
  conf('os doze alunos da carga inicial', await conta('#lista-alunos .item-lista'), 12);
  const semValor = await pag.$eval('#lista-alunos .faixa-aviso', e => e.textContent);
  conf('avisa que faltam valores por hora', semValor.includes('11 alunos sem valor por hora'), true);
  const nomes = await pag.$$eval('#lista-alunos .item-lista .nome', es => es.map(e => e.textContent.replace('falta o valor','').trim()));
  conf('Daniel está na lista', nomes.includes('Daniel'), true);
  conf('Cecília está na lista', nomes.includes('Cecília'), true);
  conf('Theo está na lista', nomes.includes('Theo'), true);
  conf('o Marcelo já tem valor', (await pag.$$eval('#lista-alunos .item-lista', es =>
    es.find(e => e.textContent.includes('Marcelo')).textContent)).includes('R$ 100,00 por hora'), true);
  await clicar('#novo-aluno');
  await espera(300);
  await preencher('#campo-nome', 'Cecília Andrade');
  await preencher('#campo-responsavel', 'Sra. Andrade');
  await clicarTexto('#corpo-modal-aluno button', '+ Adicionar valor');
  await pag.$$eval('#caixa-precos input[type=number]', es => {
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    set.call(es[0], '120');
    es[0].dispatchEvent(new Event('input', { bubbles: true }));
  });
  await pag.$$eval('#caixa-precos input[type=date]', es => {
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    set.call(es[0], '2026-01-01');
    es[0].dispatchEvent(new Event('input', { bubbles: true }));
  });
  await clicar('#salvar-aluno');
  await espera(500);
  conf('agora são treze alunos', await conta('#lista-alunos .item-lista'), 13);
  let banco = await bd();
  const cecilia = banco.alunos.find(a => a.nome === 'Cecília Andrade');
  conf('a aluna nova foi gravada', !!cecilia, true);
  conf('com R$ 120 por hora', cecilia.precos[0].valorHora, 120);
  conf('e com responsável', cecilia.responsavel, 'Sra. Andrade');

  // ================================================================
  secao('4. Marcar uma aula avulsa');

  await aba('agenda');
  await clicar('#nova-aula');
  await espera(350);
  await escolher('#campo-aluno', cecilia.id);
  await preencher('#campo-data', '2026-06-02');
  await preencher('#campo-hora', '09:00');
  await escolher('#campo-duracao', '90');
  const previsao = await $texto('#previsao-valor');
  conf('mostra o valor previsto de 1h30 a R$ 120', previsao, 'Valor previsto: R$ 180,00 (R$ 120,00 por hora).');
  await clicar('#salvar-aula');
  await espera(500);
  banco = await bd();
  conf('a aula avulsa foi gravada', banco.aulas.filter(a => a.alunoId === cecilia.id).length, 1);
  conf('aula avulsa não pertence a série', banco.aulas.find(a => a.alunoId === cecilia.id).serieId, 'null');

  // ================================================================
  secao('5. Criar aulas que se repetem, toda terça e quinta');

  await clicar('#nova-aula');
  await espera(350);
  await escolher('#campo-aluno', cecilia.id);
  await preencher('#campo-data', '2026-06-09');
  await preencher('#campo-hora', '09:00');
  await escolher('#campo-duracao', '60');
  await clicar('#campo-repetir');
  await espera(250);
  conf('a caixa de repetição apareceu', await visivel('#caixa-repeticao'), true);
  // terça (2) e quinta (4)
  await pag.evaluate(() => {
    document.querySelectorAll('#caixa-repeticao [data-dia-semana]').forEach(b => {
      if (b.dataset.marcado) b.click();
    });
    document.querySelector('#caixa-repeticao [data-dia-semana="2"]').click();
    document.querySelector('#caixa-repeticao [data-dia-semana="4"]').click();
  });
  await preencher('#campo-repetir-ate', '2026-06-30');
  await clicar('#salvar-aula');
  await espera(700);

  banco = await bd();
  const daCecilia = banco.aulas.filter(a => a.alunoId === cecilia.id && a.data.startsWith('2026-06'));
  const daSerie = daCecilia.filter(a => a.serieId);
  conf('agora há duas séries: Marcelo e Cecília', banco.series.length, 2);
  // terças e quintas de 09/06 a 30/06: 09,11,16,18,23,25,30
  conf('sete ocorrências criadas', daSerie.length, 7);
  conf('todas em terça ou quinta', daSerie.every(a => [2, 4].includes(new Date(a.data + 'T12:00').getDay())), true);
  conf('nenhuma antes do início', daSerie.every(a => a.data >= '2026-06-09'), true);
  conf('a aula avulsa continua separada', daCecilia.filter(a => !a.serieId).length, 1);

  // ================================================================
  secao('6. Alterar somente uma ocorrência da repetição');

  await pag.evaluate(() => {
    const dia = document.querySelector('[data-dia="2026-06-16"]');
    dia.querySelector('.pilula').click();
  });
  await espera(400);
  conf('o modal avisa que a aula se repete', await pag.$eval('#corpo-modal-aula .faixa-info', e => e.textContent.includes('se repete')), true);
  await escolher('#campo-duracao', '90');
  await clicar('#salvar-aula');
  await espera(350);
  conf('perguntou o escopo', await visivel('#modal-escopo'), true);
  await clicarTexto('.opcao-escopo strong', 'Somente esta aula');
  await espera(600);

  banco = await bd();
  const dia16 = banco.aulas.find(a => a.data === '2026-06-16' && a.alunoId === cecilia.id);
  conf('só o dia 16 mudou para 1h30', dia16.duracaoMin, 90);
  conf('o dia 16 virou exceção', dia16.destacada, true);
  const outrasDaSerie = banco.aulas.filter(a => a.serieId === dia16.serieId && a.data !== '2026-06-16');
  conf('as outras seis seguem com 1h', outrasDaSerie.every(a => a.duracaoMin === 60), true);

  // ================================================================
  secao('7. Alterar TODAS as da repetição e depois desfazer');

  await pag.evaluate(() => {
    document.querySelector('[data-dia="2026-06-11"] .pilula').click();
  });
  await espera(400);
  await preencher('#campo-hora', '10:30');
  await clicar('#salvar-aula');
  await espera(350);
  await clicarTexto('.opcao-escopo strong', 'Todas as aulas da repetição');
  await espera(800);

  banco = await bd();
  const serieId = dia16.serieId;
  const todas = banco.aulas.filter(a => a.serieId === serieId);
  conf('as não excepcionais foram para 10:30', todas.filter(a => !a.destacada).every(a => a.hora === '10:30'), true);
  conf('a exceção do dia 16 manteve 1h30', banco.aulas.find(a => a.data === '2026-06-16' && a.alunoId === cecilia.id).duracaoMin, 90);
  conf('a barra de desfazer apareceu', await pag.$eval('#aviso', e => e.classList.contains('aberto')), true);
  const textoAviso = await $texto('#aviso-texto');
  conf('com o texto certo', textoAviso, 'Todas as aulas da repetição foram alteradas.');

  await clicar('#aviso-acao');
  await espera(800);
  banco = await bd();
  const depoisDesfazer = banco.aulas.filter(a => a.serieId === serieId && !a.destacada);
  conf('desfazer devolveu o horário 09:00', depoisDesfazer.every(a => a.hora === '09:00'), true);
  conf('e a exceção continua intacta', banco.aulas.find(a => a.data === '2026-06-16' && a.alunoId === cecilia.id).duracaoMin, 90);

  // ================================================================
  secao('8. Excluir esta e as seguintes');

  await pag.evaluate(() => {
    document.querySelector('[data-dia="2026-06-23"] .pilula').click();
  });
  await espera(400);
  await clicar('#excluir-aula');
  await espera(350);
  await clicarTexto('.opcao-escopo strong', 'Esta e as seguintes');
  await espera(700);

  banco = await bd();
  const restantes = banco.aulas.filter(a => a.serieId === serieId);
  conf('nada restou de 23/06 em diante', restantes.every(a => a.data < '2026-06-23'), true);
  conf('sobraram as quatro anteriores', restantes.length, 4);
  conf('a série teve o fim ajustado', banco.series.find(s => s.id === serieId).fim, '2026-06-22');

  // ================================================================
  secao('9. Feriados aparecem como lembrete, sem travar nada');

  await pag.evaluate(() => document.querySelector('#mes-seguinte').click()); // julho
  await espera(300);
  for (let i = 0; i < 4; i++) { await clicar('#mes-seguinte'); await espera(200); }
  conf('chegou em novembro de 2026', await $texto('#rotulo-mes'), 'Novembro de 2026');

  const feriadosNov = await pag.$$eval('.marca-feriado', es => es.map(e => e.textContent));
  conf('Finados marcado', feriadosNov.includes('Finados'), true);
  conf('Proclamação da República marcada', feriadosNov.includes('Proclamação da República'), true);
  conf('Consciência Negra marcada', feriadosNov.includes('Consciência Negra'), true);
  conf('Aniversário de Niterói marcado', feriadosNov.includes('Aniversário de Niterói'), true);

  const tituloNiteroi = await pag.$eval('[data-dia="2026-11-22"] .marca-feriado', e => e.getAttribute('title'));
  conf('o de Niterói é municipal', tituloNiteroi, 'Aniversário de Niterói (municipal)');

  // marcar aula em feriado deve ser permitido, com aviso
  await pag.evaluate(() => document.querySelector('[data-dia="2026-11-20"]').click());
  await espera(400);
  const avisoFer = await $texto('#aviso-feriado');
  conf('o modal avisa do feriado', avisoFer.includes('Feriado: Consciência Negra'), true);
  await escolher('#campo-aluno', cecilia.id);
  await clicar('#salvar-aula');
  await espera(500);
  banco = await bd();
  conf('a aula em feriado foi criada assim mesmo', !!banco.aulas.find(a => a.data === '2026-11-20'), true);

  // dezembro: padroeira de Niterói
  await clicar('#mes-seguinte');
  await espera(350);
  const feriadosDez = await pag.$$eval('.marca-feriado', es => es.map(e => e.textContent));
  conf('padroeira de Niterói em dezembro', feriadosDez.some(f => f.includes('Conceição')), true);
  conf('Natal em dezembro', feriadosDez.includes('Natal'), true);

  // ================================================================
  secao('10. Escrever à mão na folha de aula, com a S Pen');

  await pag.evaluate(() => {
    document.querySelector('#ir-para-hoje').click();
  });
  await espera(300);
  await aba('agenda');
  // volta para junho e abre a aula do Marcelo do dia 10
  await pag.evaluate(() => {
    const app = document.querySelector('#mes-anterior');
    return null;
  });
  await pag.evaluate(async () => {
    // navega direto até junho de 2026
    let guarda = 0;
    while (document.querySelector('#rotulo-mes').textContent !== 'Junho de 2026' && guarda++ < 40) {
      document.querySelector('#mes-anterior').click();
      await new Promise(r => setTimeout(r, 40));
    }
  });
  await espera(600);
  conf('voltou para junho de 2026', await $texto('#rotulo-mes'), 'Junho de 2026');

  await pag.evaluate(() => {
    const dia = document.querySelector('[data-dia="2026-06-10"]');
    dia.querySelector('.pilula').click();
  });
  await espera(400);
  await clicarTexto('#corpo-modal-aula button', 'Escrever à mão na folha');
  await espera(900);
  conf('o editor de folha abriu', await visivel('#modal-nota'), true);

  await desenhar([[300, 200], [340, 230], [400, 210], [460, 260], [520, 240]]);
  await desenhar([[300, 320], [380, 350], [450, 330]]);
  await espera(900);

  let estadoEditor = await pag.evaluate(() => {
    const c = document.querySelector('#tela-desenho');
    return null;
  });
  const tracos = await pag.evaluate(() => {
    return new Promise(resolve => {
      const req = indexedDB.open('apoio-educacional');
      req.onsuccess = () => {
        const b = req.result;
        const t = b.transaction('notas', 'readonly').objectStore('notas').getAll();
        t.onsuccess = () => resolve(t.result);
      };
    });
  });
  conf('a folha foi gravada', tracos.length, 1);
  conf('com dois traços', tracos[0].paginas[0].itens.filter(i => i.t === 'traco').length, 2);
  conf('e com pressão registrada', tracos[0].paginas[0].itens[0].pontos.every(p => p[2] > 0), true);

  // desfazer dentro do editor
  await clicarTexto('#ferramentas-nota button[title="Desfazer"]', '');
  await espera(500);
  const aposDesfazer = await pag.evaluate(() =>
    document.querySelectorAll('#tela-desenho').length && window.__nada);
  // troca de fundo e nova folha
  await escolher('#rodape-nota select', 'pontilhado');
  await espera(250);
  await clicarTexto('#rodape-nota button', '+ Folha');
  await espera(300);
  conf('agora são duas folhas', await $texto('.contador-pagina'), 'Folha 2 de 2');
  await desenhar([[200, 400], [300, 450], [420, 420]]);
  await espera(900);

  await clicarTexto('#rodape-nota button', 'Concluir');
  await espera(800);
  conf('o editor fechou', await visivel('#modal-nota'), false);

  const notaFinal = await pag.evaluate(() => new Promise(resolve => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const b = req.result;
      const t = b.transaction('notas', 'readonly').objectStore('notas').getAll();
      t.onsuccess = () => resolve(t.result);
    };
  }));
  conf('a folha ficou com duas páginas', notaFinal[0].paginas.length, 2);
  conf('a segunda é pontilhada', notaFinal[0].paginas[1].fundo, 'pontilhado');
  banco = await bd();
  conf('a aula ficou marcada como tendo folha', banco.aulas.find(a => a.data === '2026-06-10').temNota, true);
  conf('a agenda mostra o sinal de folha', await conta('.pilula.tem-nota'), 1);

  // ================================================================
  secao('11. Escrever o feedback e gerar o fechamento');

  await aba('fechamento');
  await espera(400);
  await clicarTexto('#lista-fechamento button', 'Editar o feedback');
  await espera(900);
  const resumoExistente = await pag.$eval('#campo-resumo', e => e.value);
  conf('o resumo do exemplo já vem escrito', resumoExistente.includes('homenzinho'), true);
  await preencher('#campo-resumo', 'Mês muito bom. Marcelo evoluiu na interpretação de textos e ganhou autonomia nas tarefas de casa.');
  await clicar('#salvar-resumo');
  await espera(500);
  banco = await bd();
  conf('o resumo foi gravado', banco.resumos[0].texto.includes('ganhou autonomia'), true);

  // ================================================================
  secao('12. Gerar os arquivos do fechamento');

  await clicarTexto('#lista-fechamento button', 'PDF do fechamento');
  await espera(1600);
  await clicarTexto('#lista-fechamento button', 'PDF com as folhas');
  await espera(2200);
  await clicarTexto('#lista-fechamento button', 'Texto');
  await espera(1200);
  await clicar('#exportar-md-mes');
  await espera(1400);
  await clicar('#exportar-pdf-mes');
  await espera(1600);

  const baixados = await coletarGerados();
  console.log('  arquivos gerados: ' + baixados.join(', '));
  const errosAteAqui = errosDePagina.filter(e => !/favicon|manifest|sw\.js|ServiceWorker/i.test(e));
  if (errosAteAqui.length) console.log('  ERROS ATE AQUI: ' + JSON.stringify(errosAteAqui));
  conf('gerou o PDF do aluno', baixados.some(f => /^Fechamento_Marcelo_2026-06\.pdf$/.test(f)), true);
  conf('gerou o PDF com as folhas', baixados.some(f => /com_folhas\.pdf$/.test(f)), true);
  conf('gerou o texto do aluno', baixados.some(f => /^Fechamento_Marcelo_2026-06\.md$/.test(f)), true);
  conf('gerou o texto do mês', baixados.some(f => /^Fechamento_do_mes_2026-06\.md$/.test(f)), true);
  conf('gerou o PDF do mês', baixados.some(f => /^Fechamento_do_mes_2026-06\.pdf$/.test(f)), true);

  const pdfAluno = path.join(PASTA_DOWNLOAD, 'Fechamento_Marcelo_2026-06.pdf');
  if (fs.existsSync(pdfAluno)) {
    const b = fs.readFileSync(pdfAluno);
    conf('o PDF começa com %PDF', b.slice(0, 4).toString(), '%PDF');
    conf('o PDF tem tamanho razoável', b.length > 2500, true);
    conf('o PDF termina com EOF', b.slice(-20).toString().includes('%%EOF'), true);
  }
  const mdAluno = path.join(PASTA_DOWNLOAD, 'Fechamento_Marcelo_2026-06.md');
  if (fs.existsSync(mdAluno)) {
    const t = fs.readFileSync(mdAluno, 'utf8');
    conf('o texto traz o total certo', t.includes('R$ 1.050,00'), true);
    conf('o texto traz o resumo novo', t.includes('ganhou autonomia'), true);
    conf('o texto não usa travessão', /[\u2013\u2014]/.test(t), false);
    conf('o texto mantém a acentuação', t.includes('Mês') && t.includes('Horário') && t.includes('Situação'), true);
  }

  // ================================================================
  secao('13. Reajuste no meio do mês');

  await aba('alunos');
  await pag.evaluate(() => {
    const itens = Array.from(document.querySelectorAll('#lista-alunos .item-lista'));
    const alvo = itens.find(i => i.textContent.includes('Marcelo'));
    alvo.querySelector('button').click();
  });
  await espera(400);
  // encerra o valor atual em 14/06 e cria outro a partir de 15/06
  await pag.$$eval('#caixa-precos input[type=date]', es => {
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    set.call(es[1], '2026-06-14');
    es[1].dispatchEvent(new Event('input', { bubbles: true }));
  });
  await clicarTexto('#corpo-modal-aluno button', '+ Adicionar valor');
  await pag.$$eval('#caixa-precos input[type=number]', es => {
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    set.call(es[1], '130');
    es[1].dispatchEvent(new Event('input', { bubbles: true }));
  });
  await pag.$$eval('#caixa-precos input[type=date]', es => {
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    set.call(es[2], '2026-06-15');
    es[2].dispatchEvent(new Event('input', { bubbles: true }));
  });
  await clicar('#salvar-aluno');
  await espera(600);

  await aba('fechamento');
  await espera(500);
  const detalheMarcelo = await pag.$eval('#lista-fechamento .cartao .ajuda', e => e.textContent);
  conf('o fechamento avisa que houve reajuste', detalheMarcelo.includes('houve reajuste no mês'), true);
  // 01,05,08 a 100 (3h) + 10 a 100 (1h30) = 4h30 a 100 = 450
  // 15,17,19,22,24,26 a 130 (6h) = 780  => total 1230
  const novoTotal = await pag.$eval('#lista-fechamento tr.total td:last-child', e => e.textContent);
  conf('o total considera as duas faixas', novoTotal, 'R$ 1.230,00');

  // ================================================================
  secao('14. Cópia de segurança, apagar tudo e restaurar');

  await aba('ajustes');
  await espera(300);
  await clicar('#baixar-copia');
  await espera(2200);

  /* A cópia agora sai em dois tempos, de propósito: montar demora, e o Android só
     abre a folha de compartilhamento logo depois de um toque. O segundo toque é
     o que manda para o Drive. */
  conf('avisa que a cópia ficou pronta',
    await pag.$eval('#aviso-texto', e => /C[óo]pia pronta/.test(e.textContent)), true);
  conf('e oferece enviar', await pag.$eval('#aviso-acao', e => e.textContent.trim()), 'Enviar');
  await clicar('#aviso-acao');
  await espera(1400);

  const novosArquivos = await coletarGerados();
  const copia = novosArquivos.find(f => f.startsWith('Copia_Apoio_Educacional'));
  conf('a cópia foi entregue', !!copia, true);

  const pacote = JSON.parse(fs.readFileSync(path.join(PASTA_DOWNLOAD, copia), 'utf8'));
  conf('a cópia tem o formato certo', pacote.formato, 'apoio-educacional');
  conf('a cópia traz os treze alunos', pacote.dados.alunos.length, 13);
  conf('a cópia traz as folhas manuscritas', Object.keys(pacote.notas).length, 1);
  conf('a cópia traz as duas séries', pacote.dados.series.length, 2);

  const totalAulasAntes = pacote.dados.aulas.length;

  await clicar('#apagar-tudo');
  await espera(1200);
  banco = await bd();
  conf('tudo foi apagado', banco.alunos.length, 0);
  conf('sem aulas', banco.aulas.length, 0);

  await pag.evaluate((texto) => {
    const entrada = document.querySelector('#arquivo-copia');
    const arquivo = new File([texto], 'copia.json', { type: 'application/json' });
    const dt = new DataTransfer();
    dt.items.add(arquivo);
    entrada.files = dt.files;
    entrada.dispatchEvent(new Event('change', { bubbles: true }));
  }, JSON.stringify(pacote));
  await espera(1500);

  banco = await bd();
  conf('os treze alunos voltaram', banco.alunos.length, 13);
  conf('as aulas voltaram', banco.aulas.length, totalAulasAntes);
  conf('as séries voltaram', banco.series.length, 2);
  const notasRestauradas = await pag.evaluate(() => new Promise(resolve => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const t = req.result.transaction('notas', 'readonly').objectStore('notas').getAll();
      t.onsuccess = () => resolve(t.result);
    };
  }));
  conf('a folha manuscrita voltou', notasRestauradas.length, 1);
  conf('com as duas páginas', notasRestauradas[0].paginas.length, 2);

  // ================================================================
  secao('15. Fechar e reabrir o aplicativo: os dados continuam lá');

  await pag.reload({ waitUntil: 'networkidle0' });
  await espera(1500);
  const rotuloAposReabrir = await $texto('#rotulo-mes');
  conf('reabriu sem perder nada', (await bd()).alunos.length, 13);
  await aba('fechamento');
  await espera(500);
  await escolher('#mes-fechamento', '2026-06');
  await espera(600);
  const cartoesAposReabrir = await conta('#lista-fechamento .cartao');
  conf('o fechamento de junho continua montado', cartoesAposReabrir, 2);
  // total do mês inteiro: Marcelo com o reajuste, mais a Cecília
  const totalAposReabrir = await pag.$eval('#numeros-fechamento .numero:last-child .valor', e => e.textContent);
  conf('com o total do mês preservado', totalAposReabrir, 'R$ 1.950,00');
  const totalMarcelo = await pag.$eval('#lista-fechamento .cartao tr.total td:last-child', e => e.textContent);
  conf('e o total do Marcelo preservado', totalMarcelo, 'R$ 1.230,00');

  // ================================================================
  secao('16. Erros de página durante toda a sessão');

  const errosReais = errosDePagina.filter(e => !/favicon|manifest|sw\.js|ServiceWorker/i.test(e));
  if (errosReais.length) errosReais.forEach(e => console.log('  ERRO: ' + e));
  conf('nenhum erro de JavaScript', errosReais.length, 0);

  await pag.screenshot({ path: path.join(__dirname, 'tela_final.png'), fullPage: false });
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
