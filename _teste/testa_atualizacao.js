/* Simula a atualização que a Nathália vai receber no tablet.
 *
 * Roda a versão 1.0.0, a mais antiga que já esteve no aparelho dela, constrói
 * dados de verdade (alunos, aulas, recorrência, folha escrita à mão, resumo do
 * mês e anexo), troca os arquivos pela versão nova, atualiza pelo aviso e
 * confere item por item que nada se perdeu.
 *
 * Desde o D2 mede também o comportamento novo: com o service worker de agora
 * instalado, a versão seguinte NÃO entra sozinha (nem recarregando, nem
 * fechando e abrindo), entra só depois do toque em "Atualizar agora", e o
 * aplicativo abre do cache com o servidor fora do ar. Antes este teste afirmava
 * "a versão nova entrou sozinha" como desejado, que era o defeito FE02 da
 * avaliação de 21/10.
 */
const puppeteer = require('puppeteer-core');
const H = require('./_bib_navegador');
/* O relógio da rodada (segunda, 16/11/2026, 11:00), no processo e na página: a
 * prova não depende do dia em que roda (a virada anual abre sozinha em janeiro). */
const RELOGIO = H.relogioDaRodada('2026-11-16', '11:00');
const fs = require('fs');
const path = require('path');
const { irParaMes } = require('./_ir_para_mes.js');
const http = require('http');

const CHROME = (process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const PASTA = path.join(__dirname, 'sim_v1');
const RAIZ = path.join(__dirname, '..');
const PORTA = 8778;

let falhas = 0, passes = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }
const espera = ms => new Promise(r => setTimeout(r, ms));
async function esperaAte(fn, ms) {
  const ate = Date.now() + (ms || 20000);
  let v = await fn().catch(() => null);
  while (!v && Date.now() < ate) { await espera(250); v = await fn().catch(() => null); }
  return v;
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png',
  '.webmanifest': 'application/manifest+json; charset=utf-8', '.json': 'application/json'
};

/* Com foraDoAr, o servidor derruba a conexão: é o tablet sem sinal. */
let foraDoAr = false;
function servidor() {
  return http.createServer((req, res) => {
    if (foraDoAr) { req.socket.destroy(); return; }
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel === '/') rel = '/index.html';
    const arquivo = path.join(PASTA, rel);
    if (!arquivo.startsWith(PASTA) || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
      res.writeHead(404); res.end('nao encontrado'); return;
    }
    res.writeHead(200, {
      'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(arquivo).pipe(res);
  });
}

/* Copia a lista inteira do pacote, lida do próprio sw.js. Com o cache
 * primeiro (D2), a versão nova só existe se o install baixar TODOS os ARQUIVOS:
 * a lista antiga de nove arquivos deixava o zip.js, o cartao.js e os tópicos de
 * fora, o install falhava inteiro, e quem trazia o código novo era o worker da
 * 1.0.0, que vai à rede primeiro. */
function arquivosDoPacote() {
  const sw = fs.readFileSync(path.join(RAIZ, 'sw.js'), 'utf8');
  const lista = sw.slice(sw.indexOf('var ARQUIVOS = ['), sw.indexOf('];', sw.indexOf('var ARQUIVOS = [')));
  return (lista.match(/'\.\/[^']*'/g) || []).map(x => x.slice(3, -1)).filter(Boolean).concat(['sw.js']);
}
function trocarParaVersaoNova() {
  arquivosDoPacote().forEach(f => {
    fs.mkdirSync(path.dirname(path.join(PASTA, f)), { recursive: true });
    fs.copyFileSync(path.join(RAIZ, f), path.join(PASTA, f));
  });
}
/* A versão seguinte, publicada por cima da nova: só o número e o nome do cache. */
function publicarVersaoSeguinte() {
  const app = path.join(PASTA, 'app.js'), sw = path.join(PASTA, 'sw.js');
  fs.writeFileSync(app, fs.readFileSync(app, 'utf8').replace(/var VERSAO = '[^']+'/, "var VERSAO = '9.9.9'"));
  fs.writeFileSync(sw, fs.readFileSync(sw, 'utf8').replace(/var CACHE = '[^']+'/, "var CACHE = 'apoio-educacional-v99999'"));
}

/* Recria a pasta com a versão 1.0.0 saída do próprio histórico, para o teste
 * poder rodar quantas vezes for preciso sempre partindo do mesmo ponto. */
function prepararVersaoAntiga() {
  const { execSync } = require('child_process');
  fs.rmSync(PASTA, { recursive: true, force: true });
  fs.mkdirSync(PASTA, { recursive: true });
  execSync('git archive ' + COMMIT_V1 + ' | tar -x -C "' + PASTA.replace(/\\/g, '/') + '"',
    // O pipe para o tar pede um shell POSIX: o Git Bash no Windows, o /bin/sh
    // no runner Linux do GitHub.
    { cwd: RAIZ, shell: process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : '/bin/sh' });
  const versao = fs.readFileSync(path.join(PASTA, 'app.js'), 'utf8').match(/var VERSAO = '([^']+)'/);
  return versao ? versao[1] : '?';
}

const COMMIT_V1 = '7250029';
const VERSAO_NOVA = (fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8')
  .match(/var VERSAO = '([^']+)'/) || [])[1];

/* O aviso sobe de baixo da tela: espera ele parar dentro dela antes do toque,
 * como o dedo espera. */
async function tocarNoAviso(p, sel) {
  await p.waitForFunction(s => {
    const b = document.querySelector(s);
    const r = b && b.getBoundingClientRect();
    return r && r.height > 0 && r.bottom <= innerHeight;
  }, { timeout: 10000 }, sel);
  await espera(300);
  await p.click(sel);
}

(async () => {
  const versaoAntiga = prepararVersaoAntiga();
  console.log('partindo da versão ' + versaoAntiga + ' (a que está instalada no tablet)');

  const srv = servidor();
  await new Promise(r => srv.listen(PORTA, '127.0.0.1', r));

  const navegador = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox'], defaultViewport: { width: 1280, height: 1000, hasTouch: true }
  });
  let pag = await navegador.newPage();
  await RELOGIO.naPagina(pag);
  const errosPagina = [];
  pag.on('pageerror', e => errosPagina.push(e.message));
  pag.on('dialog', async d => { try { await d.accept(); } catch (e) { } });

  const url = 'http://127.0.0.1:' + PORTA + '/index.html';
  await pag.goto(url, { waitUntil: 'networkidle0' });
  await espera(2000);
  await RELOGIO.conferirData(pag, conf);

  const bd = () => pag.evaluate(() => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => { const t = q.result.transaction('dados', 'readonly').objectStore('dados').get('principal'); t.onsuccess = () => r(t.result); };
  }));
  const notas = () => pag.evaluate(() => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => { const t = q.result.transaction('notas', 'readonly').objectStore('notas').getAll(); t.onsuccess = () => r(t.result); };
  }));
  const anexos = () => pag.evaluate(() => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => { const t = q.result.transaction('anexos', 'readonly').objectStore('anexos').getAll(); t.onsuccess = () => r(t.result.length); };
  }));

  // ================================================================
  secao('1. Versão que está instalada no tablet dela');
  conf('a versão em uso é a 1.0.0', await pag.$eval('#versao-app', e => e.textContent), '1.0.0');
  const swInicial = await pag.evaluate(() => navigator.serviceWorker.getRegistrations().then(r => r.length));
  conf('o modo offline está ativo', swInicial > 0, true);

  // ================================================================
  secao('2. Ela constrói o trabalho dela');

  // um aluno novo, com valor por hora e recorrência
  const construiu = await pag.evaluate(() => new Promise(resolve => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => {
      const banco = q.result;
      const t = banco.transaction('dados', 'readonly').objectStore('dados').get('principal');
      t.onsuccess = () => {
        const db = t.result;
        const aluno = {
          id: 'aluno-teste', nome: 'Miguel José', responsavel: 'Sra. Souza',
          cor: '#2E7D6B', ativo: true, obs: 'Aluno criado antes da atualização.',
          precos: [{ id: 'p-teste', inicio: '2026-01-01', fim: null, valorHora: 145 }]
        };
        db.alunos.push(aluno);
        Core.criarSerie(db, {
          alunoId: 'aluno-teste', dias: [1, 4], hora: '17:30', duracaoMin: 90,
          inicio: '2026-09-07', fim: '2026-10-31'
        });
        db.resumos.push({
          alunoId: 'aluno-teste', mes: '2026-09',
          texto: 'Mês de adaptação. Miguel ganhou confiança na leitura em voz alta.'
        });
        const w = banco.transaction('dados', 'readwrite').objectStore('dados').put(db, 'principal');
        w.onsuccess = () => {
          const aulas = db.aulas.filter(a => a.alunoId === 'aluno-teste');
          resolve({ aulas: aulas.length, primeira: aulas.map(a => a.data).sort()[0], idPrimeira: aulas.sort((x, y) => x.data.localeCompare(y.data))[0].id });
        };
      };
    };
  }));
  conf('a recorrência criou as aulas', construiu.aulas > 0, true);

  // folha escrita à mão nessa primeira aula
  await pag.evaluate(id => new Promise(resolve => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => {
      const pontos = [];
      for (let i = 0; i < 60; i++) pontos.push([100 + i * 12, 300 + Math.sin(i / 5) * 60, 2 + (i % 5) * 0.7]);
      const nota = { paginas: [
        { fundo: 'pautado', itens: [
          { t: 'traco', cor: '#1A1C1F', pontos: pontos },
          { t: 'texto', x: 80, y: 90, tam: 34, cor: '#1F3A5F', txt: 'Leitura em voz alta' }
        ] },
        { fundo: 'pontilhado', itens: [{ t: 'traco', cor: '#2E7D6B', pontos: [[200, 200, 3], [400, 300, 5], [600, 250, 4]] }] }
      ] };
      const w = q.result.transaction('notas', 'readwrite').objectStore('notas').put(nota, id);
      w.onsuccess = () => resolve();
    };
  }), construiu.idPrimeira);

  // anexo
  await pag.evaluate(() => new Promise(resolve => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => {
      const blob = new Blob([new TextEncoder().encode('%PDF-1.4 conteudo de teste')], { type: 'application/pdf' });
      const w = q.result.transaction('anexos', 'readwrite').objectStore('anexos')
        .put({ nome: 'aula_samsung_notes.pdf', tipo: 'application/pdf', blob: blob }, 'anexo-teste');
      w.onsuccess = () => resolve();
    };
  }));

  await pag.reload({ waitUntil: 'networkidle0' });
  await espera(1500);

  const antes = {
    db: await bd(), notas: await notas(), anexos: await anexos()
  };
  console.log('   construído: ' + antes.db.alunos.length + ' alunos, ' + antes.db.aulas.length +
    ' aulas, ' + antes.db.series.length + ' recorrências, ' + antes.notas.length + ' folha(s), ' +
    antes.anexos + ' anexo(s), ' + antes.db.resumos.length + ' resumo(s)');
  conf('o aluno novo está lá', antes.db.alunos.some(a => a.nome === 'Miguel José'), true);
  conf('a folha manuscrita está lá', antes.notas.length, 1);
  conf('com os traços', antes.notas[0].paginas[0].itens[0].pontos.length, 60);
  conf('o anexo está lá', antes.anexos, 1);

  // ================================================================
  secao('3. A versão nova é publicada');
  trocarParaVersaoNova();
  console.log('   arquivos trocados para a versão ' + VERSAO_NOVA);

  // ================================================================
  secao('4. Ela abre o aplicativo com internet e toca no aviso');
  /* O worker da 1.0.0 é de antes do D2 e vai à rede primeiro: esta travessia
   * não passa pelo portão novo, e é o último jeito antigo de chegar. O que
   * importa aqui é que o worker de agora instala por inteiro e que o aviso
   * dele leva à versão nova. */
  await pag.reload({ waitUntil: 'networkidle0' });
  const esperando = await esperaAte(() => pag.evaluate(() =>
    navigator.serviceWorker.getRegistration().then(r => !!(r && r.waiting))), 30000);
  conf('o service worker novo baixou por inteiro e ficou esperando', !!esperando, true);
  const aviso = await esperaAte(() => pag.evaluate(v => {
    const t = document.querySelector('#aviso-texto');
    return document.querySelector('#aviso').classList.contains('aberto') && t && t.textContent.includes('Versão nova pronta (' + v + ')');
  }, VERSAO_NOVA), 15000);
  conf('aparece o aviso "Versão nova pronta (' + VERSAO_NOVA + ')"', !!aviso, true);
  await tocarNoAviso(pag, '#aviso-acao');
  const entrou = await esperaAte(() => pag.evaluate(async v => {
    const r = await navigator.serviceWorker.getRegistration();
    return !r.waiting && document.querySelector('#versao-app').textContent === v ? v : null;
  }, VERSAO_NOVA), 20000);
  conf('o toque em "Atualizar agora" leva à versão nova', entrou, VERSAO_NOVA);
  await espera(1500);

  // ================================================================
  secao('5. Nada se perdeu');

  const depois = { db: await bd(), notas: await notas(), anexos: await anexos() };

  conf('mesma quantidade de alunos', depois.db.alunos.length, antes.db.alunos.length);
  conf('mesma quantidade de aulas', depois.db.aulas.length, antes.db.aulas.length);
  conf('mesma quantidade de recorrências', depois.db.series.length, antes.db.series.length);
  conf('mesma quantidade de resumos', depois.db.resumos.length, antes.db.resumos.length);
  conf('mesma quantidade de folhas', depois.notas.length, antes.notas.length);
  conf('mesma quantidade de anexos', depois.anexos, antes.anexos);

  const miguelAntes = antes.db.alunos.find(a => a.nome === 'Miguel José');
  const miguelDepois = depois.db.alunos.find(a => a.nome === 'Miguel José');
  conf('o aluno continua', !!miguelDepois, true);
  conf('com o mesmo valor por hora', miguelDepois.precos[0].valorHora, miguelAntes.precos[0].valorHora);
  conf('com o responsável', miguelDepois.responsavel, 'Sra. Souza');
  conf('e com as observações', miguelDepois.obs, miguelAntes.obs);

  conf('a folha manuscrita continua', depois.notas.length, 1);
  conf('com as duas páginas', depois.notas[0].paginas.length, 2);
  conf('com os 60 pontos do traço', depois.notas[0].paginas[0].itens[0].pontos.length, 60);
  conf('com a pressão preservada',
    JSON.stringify(depois.notas[0].paginas[0].itens[0].pontos) === JSON.stringify(antes.notas[0].paginas[0].itens[0].pontos), true);
  conf('com o texto digitado', depois.notas[0].paginas[0].itens[1].txt, 'Leitura em voz alta');
  conf('e o fundo de cada página', depois.notas[0].paginas.map(p => p.fundo).join(','), 'pautado,pontilhado');

  conf('o resumo do mês continua', depois.db.resumos.some(r => r.texto.includes('leitura em voz alta')), true);

  const anexoDepois = await pag.evaluate(() => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => {
      const t = q.result.transaction('anexos', 'readonly').objectStore('anexos').getAll();
      t.onsuccess = () => {
        const reg = t.result[0];
        if (!reg || !reg.blob) { r('sem arquivo'); return; }
        reg.blob.text().then(txt => r(reg.nome + '|' + txt.slice(0, 4)));
      };
    };
  }));
  conf('o anexo continua abrindo', anexoDepois, 'aula_samsung_notes.pdf|%PDF');

  // ================================================================
  secao('6. E a versão nova funciona de verdade');
  const funcionando = await pag.evaluate(() => ({
    mes: document.querySelector('#rotulo-mes').textContent,
    dias: document.querySelectorAll('.dia').length,
    temRetroativo: !!document.querySelector('#modal-retroativo'),
    temPainelTexto: !!document.querySelector('#modal-texto'),
    temBotaoAtualizar: !!document.querySelector('#procurar-atualizacao')
  }));
  conf('o calendário desenha', funcionando.dias > 28, true);
  conf('o recurso de repetir para trás chegou', funcionando.temRetroativo, true);
  conf('o painel de texto chegou', funcionando.temPainelTexto, true);
  conf('o botão de procurar atualização chegou', funcionando.temBotaoAtualizar, true);

  // a folha abre e aceita escrita depois da atualização
  await pag.evaluate(() => {
    const abas = document.querySelectorAll('#abas .aba');
    Array.from(abas).find(b => b.dataset.tela === 'agenda').click();
  });
  await espera(400);
  await irParaMes(pag, 2026, 9, 60);
  const abriuFolha = await pag.evaluate(async (id) => {
    const pil = document.querySelector('.pilula');
    if (!pil) return 'sem aula visivel';
    pil.click();
    return 'ok';
  }, construiu.idPrimeira);
  await espera(600);
  const temBotaoFolha = await pag.evaluate(() =>
    Array.from(document.querySelectorAll('#corpo-modal-aula button')).some(b => /folha/i.test(b.textContent)));
  conf('a aula abre e oferece a folha', temBotaoFolha, true);

  // ================================================================
  secao('7. A versão seguinte não entra sozinha (D2)');
  publicarVersaoSeguinte();
  await pag.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update())).catch(() => { });
  const seguinte = await esperaAte(() => pag.evaluate(() => {
    const t = document.querySelector('#aviso-texto');
    return document.querySelector('#aviso').classList.contains('aberto') && t && t.textContent.includes('Versão nova pronta (9.9.9)');
  }), 30000);
  conf('a 9.9.9 baixa por baixo e o aviso aparece', !!seguinte, true);
  conf('sem toque, a tela segue na versão de antes', await pag.$eval('#versao-app', e => e.textContent), VERSAO_NOVA);
  await pag.reload({ waitUntil: 'networkidle0' });
  await espera(1500);
  conf('recarregar não troca a versão', await pag.$eval('#versao-app', e => e.textContent), VERSAO_NOVA);
  const codigo = await pag.evaluate(() => fetch('./app.js').then(r => r.text()).then(t => t.match(/var VERSAO = '([^']+)'/)[1]));
  conf('e o app.js que o service worker entrega é o da versão de antes', codigo, VERSAO_NOVA);
  /* "Depois da aula": nada troca agora, e a 9.9.9 entra na próxima abertura.
   * Abertura de verdade é sem outra janela do aplicativo aberta, então a aba
   * fecha e outra abre, como ela fecha o aplicativo e abre na casa seguinte. */
  await esperaAte(() => pag.evaluate(() => document.querySelector('#aviso').classList.contains('aberto') &&
    document.querySelector('#aviso-acao2').textContent === 'Depois da aula'), 15000);
  await tocarNoAviso(pag, '#aviso-acao2');
  await espera(1500);
  conf('"Depois da aula" não troca na hora', await pag.$eval('#versao-app', e => e.textContent), VERSAO_NOVA);
  await pag.close();
  await espera(1500);
  pag = await navegador.newPage();
  await RELOGIO.naPagina(pag);
  pag.on('pageerror', e => errosPagina.push(e.message));
  pag.on('dialog', async d => { try { await d.accept(); } catch (e) { } });
  await pag.goto(url, { waitUntil: 'networkidle0' });
  const nove = await esperaAte(() => pag.$eval('#versao-app', e => e.textContent === '9.9.9' ? '9.9.9' : null), 20000);
  conf('e a 9.9.9 entra na próxima abertura', nove, '9.9.9');

  // ================================================================
  secao('8. Abre do cache com o servidor fora do ar');
  await espera(1500);
  foraDoAr = true;
  const t0 = Date.now();
  await pag.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => { });
  const abriu = await esperaAte(() => pag.evaluate(() =>
    document.querySelector('#rotulo-mes').textContent.length > 3 && document.querySelector('#versao-app').textContent), 10000);
  console.log('   abriu sem rede em ' + (Date.now() - t0) + ' ms');
  conf('abre sem rede, na versão escolhida', abriu, '9.9.9');
  foraDoAr = false;

  const reais = errosPagina.filter(e => !/favicon|manifest|sw\.js|ServiceWorker/i.test(e));
  if (reais.length) reais.forEach(e => console.log('  ERRO: ' + e));
  conf('nenhum erro de JavaScript', reais.length, 0);

  await navegador.close();
  srv.close();

  console.log('\n' + '='.repeat(64));
  console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
  if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
  console.log('='.repeat(64));
  process.exit(falhas ? 1 : 0);
})().catch(e => {
  console.error('\nO teste parou com erro:', e.message);
  console.error(e.stack);
  process.exit(1);
});
