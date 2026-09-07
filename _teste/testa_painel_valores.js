/* testa_painel_valores.js
 *
 * O painel "Cada aluno, desde quando e por quanto" nasce RECOLHIDO no
 * Fechamento, abre no botão Mostrar, lembra a escolha dela e não mexe na
 * rolagem ao abrir nem ao fechar. E este arquivo prova que sabe REPROVAR
 * quando alguma dessas quatro coisas deixa de ser verdade.
 *
 * Por que a trava existe: o Fechamento é a tela que ela abre todo fim de mês,
 * muitas vezes com a família esperando do lado. Medido antes da mudança, numa
 * janela de 1000 pixels de altura e com 1 aluno no painel: o painel ocupava
 * 248 pixels e o primeiro botão "PDF do fechamento" começava a 1209 pixels do
 * topo, ou seja, fora da tela. Ela rolava para chegar ao que veio fazer.
 *
 * Três modos, no mesmo arquivo:
 *   node _teste/testa_painel_valores.js
 *     a rodada limpa: nasce fechado, o botão sobe, abrir e fechar é lembrado,
 *     e a rolagem fica onde estava.
 *   node _teste/testa_painel_valores.js --envenenado-aberto
 *     o servidor entrega um app.js em que o painel nasce ABERTO mesmo sem a
 *     preferência gravada. O teste tem que ENXERGAR isso e imprimir OK ao
 *     enxergar. Um teste que não reprova no defeito que existe para pegar não
 *     é trava, é enfeite.
 *   node _teste/testa_painel_valores.js --envenenado-esquece
 *     o servidor entrega um app.js que nunca grava a preferência. Ela abre o
 *     painel, recarrega, e ele volta fechado. É o defeito silencioso: na tela
 *     tudo parece funcionar, e a perda só aparece na visita seguinte.
 *
 * O VENENO É CONFERIDO ANTES DE QUALQUER OUTRA COISA. Nos dois modos
 * envenenados o teste compara o app.js servido com o do repositório e reprova
 * com todas as letras se ficaram iguais. Esse é o buraco clássico: uma
 * substituição que não casa mais nada deixa o modo envenenado verde afirmando
 * o contrário do que promete. Aconteceu no portão, na trava "série da
 * matemática". Na rodada limpa a conferência é a inversa: o servido tem que
 * ser byte a byte o do repositório, senão a rodada limpa está provando outra
 * coisa.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const RAIZ = path.join(__dirname, '..');

/* Porta própria, diferente da 8777 do portão e da 8783 do irmão
 * testa_biblioteca_offline: há três sessões nesta máquina e, no Windows, o
 * listen do node sobe junto com outro processo já ligado na mesma porta e as
 * conexões vão para o antigo, sem erro nenhum. Por isso a porta é conferida
 * antes de subir e o servidor é conferido depois. */
const PORTA = 8785;
const ORIGEM = 'http://127.0.0.1:' + PORTA;
const URL_APP = ORIGEM + '/index.html';

const VENENO_ABERTO = process.argv.indexOf('--envenenado-aberto') !== -1;
const VENENO_ESQUECE = process.argv.indexOf('--envenenado-esquece') !== -1;
const VENENO = VENENO_ABERTO || VENENO_ESQUECE;

/* Pasta de perfil NOVA a cada rodada, e apagada no fim.
 *
 * O aplicativo registra um service worker que guarda o app.js inteiro em
 * cache. Com o perfil reaproveitado, um service worker sobrevivente da rodada
 * limpa serviria o app.js LIMPO para a rodada envenenada: o veneno passaria
 * batido, os dois modos envenenados imprimiriam OK sem nunca terem visto
 * defeito nenhum, e o teste diria que sabe reprovar sem saber. */
const PERFIL = path.join(os.tmpdir(), 'perfil_painel_valores_' + process.pid + '_' + Date.now());

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

let falhas = 0, passes = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }
const pausa = ms => new Promise(r => setTimeout(r, ms));

/* ESPERA POR CONDIÇÃO, nunca por relógio. O irmão testa_atualizacao_real
 * mediu: espera fixa de 3500 ms reprovava 4 de 6 vezes no HEAD limpo, sem
 * defeito nenhum. Aqui cada espera tem prazo generoso, imprime o tempo real e
 * devolve o último valor lido, para a falha mostrar o que estava na tela. Erro
 * dentro de `ler` é "ainda não": no meio de um recarregamento o contexto da
 * página some e o evaluate lança, e isso não é reprovação. */
async function esperar(rotulo, ler, condicao, limiteMs) {
  const inicio = Date.now();
  let valor;
  for (;;) {
    try { valor = await ler(); } catch (e) { valor = undefined; }
    if (condicao(valor)) {
      console.log('   ' + rotulo + ': em ' + (Date.now() - inicio) + ' ms');
      return { ok: true, valor: valor };
    }
    if (Date.now() - inicio >= limiteMs) break;
    await pausa(200);
  }
  console.log('   ' + rotulo + ': não aconteceu em ' + limiteMs + ' ms (último valor: ' +
    JSON.stringify(valor === undefined ? null : valor).slice(0, 240) + ')');
  return { ok: false, valor: valor };
}

// ---------- o app.js servido, envenenado ou não ----------

const APP_REPO = fs.readFileSync(path.join(RAIZ, 'app.js'), 'utf8');
const VERSAO_REPO = (APP_REPO.match(/var VERSAO = '([^']+)'/) || [])[1];

/* As duas linhas do app.js que os venenos atacam, escritas aqui exatamente
 * como estão lá. Se o código mudar de forma e elas deixarem de casar, o
 * teste não fica verde por engano: a conferência logo abaixo compara o texto
 * servido com o do repositório e reprova. */
const LINHA_LEITURA = 'return !!(db.ajustes && db.ajustes.painelValoresAberto);';
const LINHA_GRAVACAO = 'db.ajustes.painelValoresAberto = vaiAbrir;';

function montarAppServido() {
  let app = APP_REPO;
  if (VENENO_ABERTO) {
    // nasce aberto mesmo sem preferência: a leitura passa a responder sempre sim
    app = app.split(LINHA_LEITURA).join('return true;');
  }
  if (VENENO_ESQUECE) {
    // o toque funciona na tela e nunca chega ao disco
    app = app.split(LINHA_GRAVACAO).join('void vaiAbrir;');
  }
  return app;
}
const APP_SERVIDO = montarAppServido();

// ---------- o servidor ----------

const conexoes = new Set();
const quatrocentos = [];
const servidor = http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';
  /* Só o app.js é trocado; o resto da árvore sai do próprio repositório, sem
   * cópia nenhuma em disco. Assim a rodada envenenada difere da limpa em uma
   * coisa só, que é o defeito que ela existe para provar. */
  if (rel === '/app.js') {
    res.writeHead(200, { 'Content-Type': TIPOS['.js'], 'Cache-Control': 'no-store' });
    res.end(APP_SERVIDO);
    return;
  }
  const arquivo = path.join(RAIZ, rel);
  if (!arquivo.startsWith(RAIZ) || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
    quatrocentos.push(rel);
    res.writeHead(404); res.end('nao encontrado'); return;
  }
  res.writeHead(200, {
    'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  res.end(fs.readFileSync(arquivo));
});
servidor.on('connection', s => { conexoes.add(s); s.on('close', () => conexoes.delete(s)); });
servidor.on('error', e => {
  console.error('FALHA o servidor do teste não subiu em 127.0.0.1:' + PORTA + ': ' + e.message);
  limparPerfil();
  console.log('\n' + passes + ' passaram, ' + (falhas + 1) + ' falharam.');
  process.exit(1);
});

function portaOcupada() {
  return new Promise(resolve => {
    const req = http.get({ host: '127.0.0.1', port: PORTA, path: '/', timeout: 1500 },
      res => { res.resume(); resolve(true); });
    // alguém aceitou a conexão e não respondeu: ocupada do mesmo jeito
    req.on('timeout', () => { req.destroy(); resolve(true); });
    req.on('error', () => resolve(false));
  });
}
function pegar(caminho) {
  return new Promise((resolve, reject) => {
    http.get(ORIGEM + caminho, res => {
      let corpo = '';
      res.setEncoding('utf8');
      res.on('data', p => { corpo += p; });
      res.on('end', () => resolve({ status: res.statusCode, corpo: corpo }));
    }).on('error', reject);
  });
}

function limparPerfil() {
  try { fs.rmSync(PERFIL, { recursive: true, force: true }); } catch (e) { /* já não existe */ }
}
/* Cobre process.exit e exceção não tratada. NÃO cobre o processo derrubado por
 * fora: no Windows, kill vira TerminateProcess e o 'exit' não roda. Por isso a
 * pasta mora no temporário do sistema, e não dentro do repositório: sobra em
 * _teste/ apareceria em `git ls-files -mo` e a trava de privacidade do portão
 * acusaria arquivo que ninguém escreveu. */
process.on('exit', limparPerfil);

let nav = null;
async function encerrar() {
  if (nav) { try { await nav.close(); } catch (e) { /* já fechou */ } nav = null; }
  conexoes.forEach(s => s.destroy());
  await new Promise(r => servidor.close(() => r()));
  limparPerfil();
}

// ---------- leituras de dentro da página ----------

/* O que a tela mostra do painel, num pacote só. `cartaoVisivel` é o cartão com
 * as linhas dos alunos, que é o que aparece e some; o cabeçalho fica sempre. */
const lerPainel = pag => pag.evaluate(() => {
  const caixa = document.querySelector('#painel-valores');
  if (!caixa) return { existe: false };
  const botao = caixa.querySelector('#abrir-painel-valores');
  const cartao = caixa.querySelector('.cartao');
  const titulo = caixa.querySelector('h3');
  const tag = caixa.querySelector('.tag');
  const visivel = e => !!(e && e.offsetParent !== null && e.getBoundingClientRect().height > 0);
  return {
    existe: true,
    titulo: titulo ? titulo.textContent.trim() : '',
    tag: tag ? tag.textContent.trim() : '',
    botao: botao ? botao.textContent.trim() : '',
    expandido: botao ? botao.getAttribute('aria-expanded') : '',
    cartaoVisivel: visivel(cartao),
    alturaCartao: cartao ? Math.round(cartao.getBoundingClientRect().height) : 0,
    linhasDeAluno: cartao ? cartao.querySelectorAll('.item-lista').length : 0,
    textoDoCartao: cartao ? cartao.textContent.slice(0, 80) : ''
  };
});

/* A distância do primeiro botão "PDF do fechamento" até o topo do documento.
 *
 * Quem rola nesta interface é a div .conteudo (styles.css:106), e não a
 * janela: window.scrollY é sempre 0 aqui, e medir por ele não diria nada. Por
 * isso a conta é feita dentro do container que rola, somando o scrollTop dele
 * para o número não depender de onde a página está no momento da medida. */
const alturaDoBotaoPDF = pag => pag.evaluate(() => {
  const cont = document.querySelector('.conteudo');
  const b = Array.from(document.querySelectorAll('#lista-fechamento button'))
    .find(x => x.textContent.trim() === 'PDF do fechamento');
  if (!cont || !b) return null;
  return Math.round(b.getBoundingClientRect().top - cont.getBoundingClientRect().top + cont.scrollTop);
});

const lerRolagem = pag => pag.evaluate(() => {
  const cont = document.querySelector('.conteudo');
  return {
    conteudo: cont ? Math.round(cont.scrollTop) : -1,
    podeRolar: cont ? cont.scrollHeight - cont.clientHeight : 0,
    janela: Math.round(window.scrollY)
  };
});

const clicarNoBotao = pag => pag.evaluate(() => {
  const b = document.querySelector('#abrir-painel-valores');
  if (!b) return false;
  b.click();
  return true;
});

/* A tela pronta para medir: aba Fechamento aberta, janela de novidades fora do
 * caminho e o painel já desenhado. A janela de novidades aparece 900 ms depois
 * de o aplicativo abrir e é ela que ele mostra a cada versão nova; deixá-la
 * aberta não muda a rolagem da tela de trás, mas atrapalha quem lê a saída de
 * uma falha. */
async function abrirFechamento(pag) {
  const pronto = await esperar('o aplicativo desenhou a agenda',
    () => pag.evaluate(() => !!document.querySelector('#abas .aba')), v => v === true, 40000);
  if (!pronto.ok) throw Object.assign(new Error('o aplicativo não abriu'), { jaContado: false });
  await pausa(1400);
  await pag.evaluate(() => {
    const b = document.querySelector('#entendi-novidades');
    if (b && document.querySelector('#modal-novidades.aberto')) b.click();
  });
  await pag.evaluate(() => {
    const aba = Array.from(document.querySelectorAll('#abas .aba')).find(x => x.dataset.tela === 'fechamento');
    if (aba) aba.click();
  });
  const painel = await esperar('o painel de valores desenhado no Fechamento',
    () => lerPainel(pag), v => !!v && v.existe && !!v.botao, 30000);
  return painel.valor;
}

(async () => {
  console.log(VENENO_ABERTO
    ? 'MODO ENVENENADO (aberto): o app.js servido faz o painel nascer aberto; o teste tem que enxergar isso.'
    : (VENENO_ESQUECE
      ? 'MODO ENVENENADO (esquece): o app.js servido nunca grava a escolha; o teste tem que enxergar a perda.'
      : 'MODO NORMAL: o painel nasce recolhido, abre no botão, é lembrado e não mexe na rolagem.'));
  console.log('repositório na versão ' + VERSAO_REPO + ', perfil do Chrome em ' + PERFIL);

  // ================================================================
  secao('0. O veneno é de verdade, e o servidor é este');
  /* Antes de tudo. Uma substituição que não casa mais nada deixaria os modos
   * envenenados verdes afirmando o contrário do que prometem. */
  if (VENENO) {
    conf('o app.js servido ficou DIFERENTE do app.js do repositório',
      APP_SERVIDO !== APP_REPO ? 'diferente' : 'IGUAL, o veneno não pegou', 'diferente');
    if (APP_SERVIDO === APP_REPO) {
      console.log('   a linha que o veneno procurava não existe mais no app.js: ' +
        (VENENO_ABERTO ? LINHA_LEITURA : LINHA_GRAVACAO));
      throw Object.assign(new Error('veneno não aplicado'), { jaContado: true });
    }
    conf('e o veneno trocou exatamente uma ocorrência',
      APP_REPO.split(VENENO_ABERTO ? LINHA_LEITURA : LINHA_GRAVACAO).length - 1, 1);
  } else {
    conf('o app.js servido é byte a byte o do repositório',
      APP_SERVIDO === APP_REPO ? 'igual' : 'DIFERENTE, a rodada limpa não é limpa', 'igual');
  }

  if (await portaOcupada()) {
    conf('a porta 127.0.0.1:' + PORTA + ' está livre antes de subir o servidor', 'ocupada', 'livre');
    throw Object.assign(new Error('porta ' + PORTA + ' ocupada por outro processo'), { jaContado: true });
  }
  await new Promise(r => servidor.listen(PORTA, '127.0.0.1', r));
  const eco = await pegar('/app.js');
  conf('quem responde em 127.0.0.1:' + PORTA + ' é este servidor, com o app.js desta rodada',
    eco.status + ' ' + (eco.corpo === APP_SERVIDO ? 'o mesmo texto' : 'outro texto'), '200 o mesmo texto');

  limparPerfil();
  nav = await puppeteer.launch({
    executablePath: CHROME, headless: true, userDataDir: PERFIL,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1280, height: 1000, hasTouch: true }
  });
  const pag = await nav.newPage();
  pag.setDefaultTimeout(60000);
  const errosDePagina = [];
  pag.on('pageerror', e => errosDePagina.push(e.message));
  pag.on('dialog', async d => { try { await d.accept(); } catch (e) { /* ok */ } });

  /* A busca do índice do IBGE é cortada aqui dentro. Ela sai do aplicativo de
   * verdade quando a tela do Fechamento abre, e esta trava é sobre recolher
   * painel, não sobre a rede do IBGE: deixar a busca real acontecer amarraria
   * a rodada ao sinal desta máquina e ao servidor de terceiro. O contador
   * existe só para a saída dizer quantas vezes o aplicativo tentou. */
  await pag.evaluateOnNewDocument(() => {
    window.__tentativasIbge = 0;
    const original = window.fetch;
    window.fetch = function (url, opcoes) {
      if (String(url).indexOf('ibge') >= 0) {
        window.__tentativasIbge++;
        return Promise.reject(new Error('sem rede para o IBGE neste teste'));
      }
      return original.apply(this, arguments);
    };
  });

  // ================================================================
  secao('1. Ela abre o Fechamento pela primeira vez');
  await pag.goto(URL_APP, { waitUntil: 'networkidle0' });
  /* Na PRIMEIRA visita, o activate do service worker chama clients.claim(), a
   * página recebe controllerchange e se recarrega sozinha (app.js:903-907).
   * Medir em cima disso é medir uma página que está prestes a sumir, e o
   * evaluate morre junto com o contexto. Espera o controle assumir e recarrega
   * de propósito: dali em diante não há mais recarregamento por baixo. Se o
   * controle não assumir, segue assim mesmo, porque o resto do teste não
   * depende do modo offline. */
  await esperar('o service worker assumiu o controle da página',
    () => pag.evaluate(() => !!navigator.serviceWorker.controller), v => v === true, 30000);
  await pag.reload({ waitUntil: 'networkidle0' });
  let painel = await abrirFechamento(pag);
  conf('o painel existe na tela', painel && painel.existe, true);
  conf('o título "Cada aluno, desde quando e por quanto" está à vista',
    painel.titulo, 'Cada aluno, desde quando e por quanto');
  conf('a tag diz quantos alunos o painel tem', painel.tag, '1 aluno');

  if (VENENO_ABERTO) {
    conf('envenenado-aberto: sem ela ter tocado em nada, o botão já diz Esconder (defeito detectado)',
      painel.botao, 'Esconder');
    conf('envenenado-aberto: e aria-expanded já nasce true (defeito detectado)',
      painel.expandido, 'true');
    conf('envenenado-aberto: o cartão com as linhas dos alunos aparece SEM ela pedir (defeito detectado)',
      painel.cartaoVisivel ? 'visível' : 'recolhido', 'visível');
  } else {
    conf('o botão convida a mostrar', painel.botao, 'Mostrar');
    conf('e o botão diz que está recolhido', painel.expandido, 'false');
    conf('o cartão com as linhas dos alunos NÃO está visível',
      painel.cartaoVisivel ? 'visível' : 'recolhido', 'recolhido');
  }

  // ================================================================
  secao('2. O botão de PDF sobe, e o quanto é medido');
  const pdfFechado = await alturaDoBotaoPDF(pag);
  conf('o botão "PDF do fechamento" foi encontrado na lista', pdfFechado !== null, true);

  const clicou = await clicarNoBotao(pag);
  conf('o botão do painel aceitou o toque', clicou, true);
  await pausa(500);
  painel = await lerPainel(pag);
  const pdfAberto = await alturaDoBotaoPDF(pag);
  const ganho = (pdfAberto === null || pdfFechado === null) ? 0 : pdfAberto - pdfFechado;
  console.log('   "PDF do fechamento" a ' + pdfFechado + ' px do topo com o painel recolhido, e a ' +
    pdfAberto + ' px com ele aberto: ' + ganho + ' px de diferença.');
  console.log('   o cartão do painel mede ' + painel.alturaCartao + ' px de altura.');

  if (VENENO_ABERTO) {
    /* Nascendo aberto, a primeira medida já foi feita com o cartão na tela, e
     * o toque FECHA em vez de abrir: o botão desce em vez de subir. */
    conf('envenenado-aberto: o toque fechou em vez de abrir, e o botão de PDF SUBIU (defeito detectado)',
      ganho < 0 ? 'subiu' : 'não subiu (' + ganho + ' px)', 'subiu');
    conf('envenenado-aberto: e a primeira medida já vinha empurrada pelo cartão',
      pdfFechado > pdfAberto, true);
  } else {
    conf('abrir o painel empurra o botão de PDF para baixo', pdfAberto > pdfFechado, true);
    /* Número, não adjetivo: a diferença tem que ser a altura do próprio cartão
     * que apareceu, com folga de 24 px para a margem entre um bloco e outro.
     * Medido com 1 aluno: cartão de cerca de 200 px. */
    conf('e a diferença é a altura do cartão que apareceu, com folga de 24 px',
      Math.abs(ganho - painel.alturaCartao) <= 24 ? 'bate' :
        'não bate (ganho ' + ganho + ', cartão ' + painel.alturaCartao + ')', 'bate');
    conf('a diferença passa de 100 pixels, que é o que tira o botão da primeira tela',
      ganho > 100 ? 'passa (' + ganho + ' px)' : 'não passa (' + ganho + ' px)', 'passa (' + ganho + ' px)');
  }

  // ================================================================
  secao('3. O toque abre o cartão e o botão troca de nome');
  if (VENENO_ABERTO) {
    // aqui o painel está FECHADO, porque nasceu aberto e o toque de cima fechou
    conf('envenenado-aberto: o toque levou o painel para o estado contrário do esperado',
      painel.botao + ' / ' + painel.expandido, 'Mostrar / false');
    await clicarNoBotao(pag);
    await pausa(500);
    painel = await lerPainel(pag);
  }
  conf('o botão passou a dizer Esconder', painel.botao, 'Esconder');
  conf('aria-expanded virou true', painel.expandido, 'true');
  conf('o cartão está visível', painel.cartaoVisivel, true);
  conf('com uma linha por aluno', painel.linhasDeAluno, 1);
  conf('e a linha do aluno traz o texto do painel',
    painel.textoDoCartao.indexOf('Só para você') === 0, true);

  // ================================================================
  secao('4. Abrir e fechar não mexe na rolagem');
  /* A janela encolhe só para esta seção. Com 1 aluno e 1000 pixels de altura a
   * tela do Fechamento quase não tem o que rolar, e conferir que a rolagem
   * ficou parada num container que não rola não prova nada. */
  await pag.setViewport({ width: 1280, height: 520, hasTouch: true });
  await pausa(400);
  await pag.evaluate(() => { document.querySelector('.conteudo').scrollTop = 260; });
  await pausa(300);
  const antes = await lerRolagem(pag);
  conf('a tela tem mesmo o que rolar', antes.podeRolar > 300 ? 'tem' : 'não tem (' + antes.podeRolar + ' px)', 'tem');
  conf('e ela rolou para baixo', antes.conteudo > 200, true);

  await clicarNoBotao(pag);
  await pausa(600);
  const depoisDeFechar = await lerRolagem(pag);
  console.log('   rolagem antes: ' + antes.conteudo + ' px; depois de fechar: ' + depoisDeFechar.conteudo + ' px.');
  conf('fechar o painel não moveu a rolagem (tolerância de 4 px)',
    Math.abs(depoisDeFechar.conteudo - antes.conteudo) <= 4 ? 'parada' :
      'pulou para ' + depoisDeFechar.conteudo, 'parada');

  await clicarNoBotao(pag);
  await pausa(600);
  const depoisDeAbrir = await lerRolagem(pag);
  console.log('   depois de abrir de novo: ' + depoisDeAbrir.conteudo + ' px.');
  conf('abrir o painel não moveu a rolagem (tolerância de 4 px)',
    Math.abs(depoisDeAbrir.conteudo - antes.conteudo) <= 4 ? 'parada' :
      'pulou para ' + depoisDeAbrir.conteudo, 'parada');
  conf('e a janela nunca rolou, porque quem rola aqui é a .conteudo', depoisDeAbrir.janela, 0);

  await pag.setViewport({ width: 1280, height: 1000, hasTouch: true });
  await pausa(400);

  // ================================================================
  secao('5. Ela fecha o aplicativo com o painel aberto e volta');
  painel = await lerPainel(pag);
  conf('o painel está aberto antes de recarregar', painel.botao, 'Esconder');
  await pag.reload({ waitUntil: 'networkidle0' });
  painel = await abrirFechamento(pag);

  if (VENENO_ESQUECE) {
    conf('envenenado-esquece: a escolha NÃO foi lembrada e o painel voltou fechado (defeito detectado)',
      painel.botao + ' / ' + painel.expandido, 'Mostrar / false');
    conf('envenenado-esquece: e o cartão sumiu junto', painel.cartaoVisivel, false);
  } else {
    conf('a escolha foi lembrada e o painel abriu aberto', painel.botao, 'Esconder');
    conf('aria-expanded continua true', painel.expandido, 'true');
    conf('e o cartão está na tela sem ela tocar em nada', painel.cartaoVisivel, true);
  }

  // ================================================================
  secao('6. Ela esconde de novo, e continua escondido depois de reabrir');
  /* No modo envenenado-esquece o painel voltou fechado, então aqui o toque
   * ABRE. Fechar o que já está fechado não teria o que provar. */
  if (VENENO_ESQUECE) {
    conf('envenenado-esquece: sem o que esconder, o toque abre', painel.botao, 'Mostrar');
    await clicarNoBotao(pag);
    await pausa(500);
    painel = await lerPainel(pag);
    conf('envenenado-esquece: na tela o toque funciona, é só o disco que não guarda',
      painel.cartaoVisivel, true);
    await pag.reload({ waitUntil: 'networkidle0' });
    painel = await abrirFechamento(pag);
    conf('envenenado-esquece: e de novo o painel volta fechado (defeito detectado)',
      painel.botao + ' / ' + (painel.cartaoVisivel ? 'aberto' : 'recolhido'), 'Mostrar / recolhido');
  } else {
    await clicarNoBotao(pag);
    await pausa(500);
    painel = await lerPainel(pag);
    conf('o botão voltou a dizer Mostrar', painel.botao, 'Mostrar');
    conf('aria-expanded voltou para false', painel.expandido, 'false');
    conf('e o cartão sumiu', painel.cartaoVisivel, false);
    await pag.reload({ waitUntil: 'networkidle0' });
    painel = await abrirFechamento(pag);
    if (VENENO_ABERTO) {
      /* A escolha dela foi gravada como recolhido, e o painel volta aberto do
       * mesmo jeito: é este o defeito, e é aqui que ele fica mais claro. */
      conf('envenenado-aberto: a escolha gravada era recolhido e ele voltou ABERTO (defeito detectado)',
        painel.botao, 'Esconder');
      conf('envenenado-aberto: com o cartão de volta na tela (defeito detectado)',
        painel.cartaoVisivel, true);
    } else {
      conf('depois de reabrir o aplicativo ele continua recolhido', painel.botao, 'Mostrar');
      conf('com o cartão fora da tela', painel.cartaoVisivel, false);
    }
    conf('e o título continua à vista', painel.titulo, 'Cada aluno, desde quando e por quanto');
  }

  const tentativas = await pag.evaluate(() => window.__tentativasIbge || 0);
  console.log('\n   tentativas de buscar o índice do IBGE nesta página: ' + tentativas);
  if (quatrocentos.length) console.log('   o servidor respondeu 404 para: ' + quatrocentos.join(', '));
  if (errosDePagina.length) console.log('   erros de página vistos: ' + errosDePagina.join(' | ').slice(0, 400));

  await encerrar();
  console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
  process.exit(falhas ? 1 : 0);
})().catch(async e => {
  console.error('erro:', e.message);
  if (!e.jaContado) console.error(e.stack);
  try { await encerrar(); } catch (e2) { limparPerfil(); }
  console.log('\n' + passes + ' passaram, ' + (falhas + (e.jaContado ? 0 : 1)) + ' falharam.');
  process.exit(1);
});
