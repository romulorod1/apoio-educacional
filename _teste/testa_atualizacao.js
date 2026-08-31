/* Simula a atualização que a Nathália vai receber no tablet.
 *
 * Roda a versão 1.0.0, que é a que está instalada no aparelho dela, constrói
 * dados de verdade (alunos, aulas, recorrência, folha escrita à mão, resumo do
 * mês e anexo), troca os arquivos pela versão nova, atualiza e confere item por
 * item que nada se perdeu.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
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

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png',
  '.webmanifest': 'application/manifest+json; charset=utf-8', '.json': 'application/json'
};

function servidor() {
  return http.createServer((req, res) => {
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

function trocarParaVersaoNova() {
  ['index.html', 'styles.css', 'core.js', 'pdf.js', 'store.js', 'draw.js', 'app.js', 'sw.js', 'manifest.webmanifest']
    .forEach(f => fs.copyFileSync(path.join(RAIZ, f), path.join(PASTA, f)));
}

/* Recria a pasta com a versão 1.0.0 saída do próprio histórico, para o teste
 * poder rodar quantas vezes for preciso sempre partindo do mesmo ponto. */
function prepararVersaoAntiga() {
  const { execSync } = require('child_process');
  fs.rmSync(PASTA, { recursive: true, force: true });
  fs.mkdirSync(PASTA, { recursive: true });
  execSync('git archive ' + COMMIT_V1 + ' | tar -x -C "' + PASTA.replace(/\\/g, '/') + '"',
    { cwd: RAIZ, shell: 'C:/Program Files/Git/bin/bash.exe' });
  const versao = fs.readFileSync(path.join(PASTA, 'app.js'), 'utf8').match(/var VERSAO = '([^']+)'/);
  return versao ? versao[1] : '?';
}

const COMMIT_V1 = '7250029';

(async () => {
  const versaoAntiga = prepararVersaoAntiga();
  console.log('partindo da versão ' + versaoAntiga + ' (a que está instalada no tablet)');

  const srv = servidor();
  await new Promise(r => srv.listen(PORTA, '127.0.0.1', r));

  const navegador = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox'], defaultViewport: { width: 1280, height: 1000, hasTouch: true }
  });
  const pag = await navegador.newPage();
  const errosPagina = [];
  pag.on('pageerror', e => errosPagina.push(e.message));
  pag.on('dialog', async d => { try { await d.accept(); } catch (e) { } });

  const url = 'http://127.0.0.1:' + PORTA + '/index.html';
  await pag.goto(url, { waitUntil: 'networkidle0' });
  await espera(2000);

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
  console.log('   arquivos trocados para a versão 1.1.0');

  // ================================================================
  secao('4. Ela abre o aplicativo com internet');
  await pag.reload({ waitUntil: 'networkidle0' });
  await espera(3000);

  const versaoAgora = await pag.$eval('#versao-app', e => e.textContent).catch(() => 'nao achou');
  conf('a versão nova entrou sozinha', versaoAgora, '1.1.0');

  // aciona a troca do service worker, como o botão faz
  await pag.evaluate(() => navigator.serviceWorker.getRegistration().then(reg => {
    if (reg && reg.waiting) reg.waiting.postMessage({ tipo: 'ativar-agora' });
    return reg ? reg.update() : null;
  }).catch(() => { }));
  await espera(3000);
  await pag.reload({ waitUntil: 'networkidle0' });
  await espera(2000);

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
  const abriuFolha = await pag.evaluate(async (id) => {
    const app = document.querySelector('#grade-mes');
    let g = 0;
    while (document.querySelector('#rotulo-mes').textContent !== 'Setembro de 2026' && g++ < 30) {
      document.querySelector('#mes-seguinte').click();
      await new Promise(r => setTimeout(r, 60));
    }
    const pil = document.querySelector('.pilula');
    if (!pil) return 'sem aula visivel';
    pil.click();
    return 'ok';
  }, construiu.idPrimeira);
  await espera(600);
  const temBotaoFolha = await pag.evaluate(() =>
    Array.from(document.querySelectorAll('#corpo-modal-aula button')).some(b => /folha/i.test(b.textContent)));
  conf('a aula abre e oferece a folha', temBotaoFolha, true);

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
