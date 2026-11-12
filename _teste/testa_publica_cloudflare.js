/* testa_publica_cloudflare.js (B4, sem navegador)
 *
 * O deploy no Cloudflare Pages so roda depois do portao inteiro verde na main,
 * e sobe tudo o que o aplicativo pede e nada de _teste/. Le os YAML como texto
 * (o repositorio nao tem leitor de YAML, e nao vale trazer um para isto) e
 * prova cada propriedade nos dois lados: o arquivo de verdade passa, e um
 * veneno de cada propriedade (gatilho a mais, condicao a menos, versao solta)
 * reprova pela MESMA funcao. Sem o veneno, uma conferencia que nao olha nada
 * passaria igual.
 *
 * Depois monta o site com o .github/monta_site.sh numa pasta temporaria e
 * confere que toda entrada do ARQUIVOS do sw.js, o indice de assuntos, cada
 * arquivo de assunto que o indice cita e o leitor de PDF estao la, e que nada
 * de _teste/, biblioteca/, .github/ ou .md subiu.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const ler = f => fs.readFileSync(path.join(RAIZ, f), 'utf8').replace(/\r\n/g, '\n');
let passes = 0, falhas = 0;
function conf(rotulo, ok, detalhe) {
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK    ' : '  FALHA ') + rotulo + (ok || !detalhe ? '' : '  [' + detalhe + ']'));
}

/* Bloco de primeiro nivel (sem recuo) de um YAML, ate a proxima chave sem recuo. */
function blocoTopo(texto, chave) {
  const linhas = texto.split('\n');
  const i = linhas.findIndex(l => l === chave + ':' || l.indexOf(chave + ': ') === 0);
  if (i < 0) return null;
  const fim = linhas.findIndex((l, k) => k > i && /^[A-Za-z_]/.test(l));
  return linhas.slice(i, fim < 0 ? undefined : fim).join('\n');
}
/* Chaves com dois espacos de recuo dentro de um bloco (os gatilhos do on:, os jobs). */
function filhos(bloco) {
  return (bloco || '').split('\n').map(l => (l.match(/^  ([A-Za-z_][\w-]*):/) || [])[1]).filter(Boolean);
}
function blocoJob(texto, nome) {
  const jobs = blocoTopo(texto, 'jobs') || '';
  const linhas = jobs.split('\n');
  const i = linhas.indexOf('  ' + nome + ':');
  if (i < 0) return null;
  const fim = linhas.findIndex((l, k) => k > i && /^  [A-Za-z_]/.test(l));
  return linhas.slice(i, fim < 0 ? undefined : fim).join('\n');
}
/* Os passos de um job, cada um como texto, do "- " ate o proximo "- ". */
function passos(job) {
  const partes = (job || '').split(/\n(?=      - )/);
  return partes.slice(1);
}

/* AS PROPRIEDADES DO PUBLICA. Cada uma devolve a lista do que esta errado. */
function defeitosDoPublica(texto) {
  const d = [];
  const on = blocoTopo(texto, 'on');
  const gatilhos = filhos(on);
  if (gatilhos.join(',') !== 'workflow_run') d.push('gatilhos devem ser so workflow_run, sao: ' + gatilhos.join(','));
  if (!/workflows: \[portao\]/.test(on || '')) d.push('workflow_run nao e do portao');
  if (!/types: \[completed\]/.test(on || '')) d.push('workflow_run sem types: [completed]');
  if (!/branches: \[main\]/.test(on || '')) d.push('workflow_run sem branches: [main]');

  const pub = blocoJob(texto, 'publica');
  if (!pub) { d.push('sem o job publica'); return d; }
  const se = (pub.match(/^    if: >-\n((?:      .*\n?)+)/m) || [])[1] || '';
  [
    "github.event.workflow_run.conclusion == 'success'",
    "github.event.workflow_run.event == 'push'",
    "github.event.workflow_run.head_branch == 'main'",
    'github.event.workflow_run.head_repository.full_name == github.repository'
  ].forEach(c => { if (se.indexOf(c) < 0) d.push('if do publica sem: ' + c); });
  if (/\|\|/.test(se)) d.push('if do publica tem um "ou": qualquer ramo dele publicaria sem as outras condicoes');

  if (!/ref: \$\{\{ github\.event\.workflow_run\.head_sha \}\}/.test(pub)) d.push('checkout nao e do commit do portao');
  // 13f: o monta_site gera VERSAO e CACHE pelo contador, que exige a historia inteira.
  if (!/ref: \$\{\{ github\.event\.workflow_run\.head_sha \}\}\n\s+fetch-depth: 0/.test(pub)) d.push('checkout do publica sem fetch-depth: 0 (o contador da publicacao sairia menor)');
  const ps = passos(pub);
  const iPonta = ps.findIndex(p => /id: ponta/.test(p));
  if (iPonta < 0) d.push('sem o passo da ponta da main');
  else {
    if (!/git rev-parse origin\/main/.test(ps[iPonta]) || !/"\$ponta" = "\$COMMIT"/.test(ps[iPonta]))
      d.push('o passo ponta nao compara a main com o commit');
    ps.slice(iPonta + 1).forEach(p => {
      if (p.indexOf("if: steps.ponta.outputs.publicar == 'sim'") < 0)
        d.push('passo depois da ponta sem a guarda: ' + p.split('\n')[0].trim());
    });
  }
  const envio = ps.find(p => /pages deploy/.test(p)) || '';
  if (!envio) d.push('sem o pages deploy');
  if (!/wrangler@\d+\.\d+\.\d+ pages deploy/.test(envio)) d.push('wrangler sem versao exata');
  if (!/--project-name apoio-educacional/.test(envio)) d.push('projeto nao e apoio-educacional');
  if (!/--branch main/.test(envio)) d.push('deploy nao vai para o ramo de producao main');
  if (!/CLOUDFLARE_API_TOKEN: \$\{\{ secrets\.CLOUDFLARE_API_TOKEN \}\}/.test(envio) ||
      !/CLOUDFLARE_ACCOUNT_ID: \$\{\{ secrets\.CLOUDFLARE_ACCOUNT_ID \}\}/.test(envio))
    d.push('token ou conta fora dos secrets');
  if (ps.indexOf(envio) >= 0 && ps.indexOf(envio) < iPonta) d.push('o envio vem antes da ponta');
  // O endpoint de IA: as dependencias de functions/ entram pelo lock (npm ci,
  // nunca npm install, que resolveria outra versao) e ANTES do envio.
  const deps = ps.findIndex(p => /npm ci --prefix functions/.test(p));
  if (deps < 0) d.push('sem o npm ci --prefix functions (o wrangler nao acharia o SDK do endpoint)');
  else if (deps > ps.indexOf(envio)) d.push('as dependencias do endpoint vem depois do envio');
  if (ps.some(p => /npm install/.test(p))) d.push('npm install no deploy: a versao tem de vir do lock (npm ci)');
  // O wrangler acha functions/ pelo diretorio de trabalho (a raiz). Um
  // working-directory no envio publicaria o site sem o endpoint, calado.
  if (/working-directory:/.test(envio)) d.push('o envio tem working-directory: o wrangler nao acharia functions/');

  const c = blocoJob(texto, 'conferencia') || '';
  if (!/needs: publica/.test(c) || !/uses: \.\/\.github\/workflows\/conferencia-no-ar\.yml/.test(c) ||
      !/site: https:\/\/apoio-educacional\.pages\.dev/.test(c))
    d.push('a conferencia do endereco novo nao segue o envio');
  // 13f: o endereco antigo (GitHub Pages) sai da MESMA montagem, depois do novo.
  const gp = blocoJob(texto, 'publica-github-pages') || '';
  if (!gp) d.push('sem o job publica-github-pages (o endereco antigo ficaria com o sw.js fixo)');
  else {
    if (!/needs: publica\n/.test(gp)) d.push('o GitHub Pages nao espera o publica');
    if (!/if: needs\.publica\.outputs\.publicou == 'sim'/.test(gp)) d.push('o GitHub Pages publica sem o endereco novo ter publicado');
    if (!/pages: write/.test(gp) || !/id-token: write/.test(gp)) d.push('o GitHub Pages sem as permissoes pages e id-token');
    if (!/ref: \$\{\{ github\.event\.workflow_run\.head_sha \}\}\n\s+fetch-depth: 0/.test(gp)) d.push('o GitHub Pages sem o checkout do commit com a historia inteira');
    if (!/sh \.github\/monta_site\.sh _site_antigo --endereco-antigo/.test(gp)) d.push('o GitHub Pages nao usa o montador com --endereco-antigo');
    if (!/uses: actions\/upload-pages-artifact@v\d+\n\s+with:\n\s+path: _site_antigo/.test(gp)) d.push('o GitHub Pages nao sobe o _site_antigo');
    if (!/uses: actions\/deploy-pages@v\d+/.test(gp)) d.push('sem o deploy-pages');
  }
  const ca = blocoJob(texto, 'conferencia-antigo') || '';
  if (!/needs: publica-github-pages/.test(ca) || !/uses: \.\/\.github\/workflows\/conferencia-no-ar\.yml/.test(ca) ||
      !/site: https:\/\/romulorod1\.github\.io\/apoio-educacional/.test(ca))
    d.push('a conferencia do endereco antigo nao segue o envio ao GitHub Pages');
  return d;
}

function defeitosDaConferencia(texto) {
  const d = [];
  const gatilhos = filhos(blocoTopo(texto, 'on'));
  ['workflow_dispatch', 'workflow_call'].forEach(g => {
    if (gatilhos.indexOf(g) < 0) d.push('conferencia-no-ar sem o gatilho ' + g);
  });
  // 13f: no push nenhum dos enderecos tem o commit ainda (os dois publicam depois do portao).
  if (gatilhos.indexOf('push') >= 0) d.push('conferencia-no-ar com gatilho de push: compararia o ar antes da publicacao');
  if (!/SITE_ANTIGO: https:\/\/romulorod1\.github\.io\/apoio-educacional/.test(texto)) d.push('sem o endereco antigo');
  if (!/- https:\/\/apoio-educacional\.pages\.dev/.test(texto)) d.push('a escolha manual nao tem o endereco novo');
  if (!/ref: \$\{\{ inputs\.ref \|\| github\.sha \}\}/.test(texto)) d.push('checkout nao segue o commit pedido');
  if (!/SITE="\$\{SITE_PEDIDO:-\$SITE_ANTIGO\}"/.test(texto)) d.push('o site conferido nao vem do pedido');
  // 13f: o endereco novo serve o site MONTADO (VERSAO e CACHE gerados), e o
  // contador le a historia inteira. Sem isto a conferencia compararia o ar com o
  // valor fixo do repositorio e reprovaria todo deploy certo.
  if (!/fetch-depth: 0/.test(texto)) d.push('o checkout da conferencia nao traz a historia inteira (fetch-depth: 0)');
  if (!/confere_no_ar\.sh --montado "\$SITE" 900/.test(texto)) d.push('a conferencia nao compara com o site montado (--montado)');
  if (/confere_no_ar\.sh "\$SITE"/.test(texto)) d.push('a conferencia ainda compara algum endereco com o disco cru');
  return d;
}

const PUBLICA = ler('.github/workflows/publica-cloudflare.yml');
const CONFERENCIA = ler('.github/workflows/conferencia-no-ar.yml');
const PORTAO = ler('.github/workflows/portao.yml');

console.log('\n=== o deploy so depois do portao verde na main ===');
const dp = defeitosDoPublica(PUBLICA);
conf('publica-cloudflare.yml cumpre todas as propriedades', dp.length === 0, dp.join('; '));
conf('o workflow que ele espera se chama "portao"', /^name: portao$/m.test(PORTAO));
conf('no push na main o portao roda o navegador (nenhum job pulado)',
  (PORTAO.match(/github\.event_name != 'pull_request' \|\|/g) || []).length >= 2);
const dc = defeitosDaConferencia(CONFERENCIA);
conf('conferencia-no-ar confere os dois enderecos pela chamada, contra o site montado', dc.length === 0, dc.join('; '));

console.log('\n=== venenos: cada um TEM de reprovar ===');
const venenos = [
  ['gatilho push a mais', PUBLICA.replace('on:\n', 'on:\n  push:\n    branches: [main]\n')],
  ['pull_request a mais', PUBLICA.replace('on:\n', 'on:\n  pull_request:\n')],
  ['sem a conclusao success', PUBLICA.replace("github.event.workflow_run.conclusion == 'success' &&\n", '')],
  ['conclusao trocada por "ou"', PUBLICA.replace("conclusion == 'success' &&", "conclusion == 'success' ||")],
  ['sem o evento push', PUBLICA.replace("github.event.workflow_run.event == 'push' &&\n", '')],
  ['de outro workflow', PUBLICA.replace('workflows: [portao]', 'workflows: [outro]')],
  ['wrangler sem versao', PUBLICA.replace(/wrangler@[\d.]+/, 'wrangler@4')],
  ['envio sem a guarda da ponta', PUBLICA.replace(/(id: envio\n)        if: steps\.ponta\.outputs\.publicar == 'sim'\n/, '$1')],
  ['token escrito no arquivo', PUBLICA.replace('${{ secrets.CLOUDFLARE_API_TOKEN }}', 'abc123')],
  ['ramo de preview', PUBLICA.replace('--branch main', '--branch prova')],
  ['sem a conferencia', PUBLICA.replace('uses: ./.github/workflows/conferencia-no-ar.yml', 'uses: ./outro.yml')],
  ['sem as dependencias do endpoint', PUBLICA.replace('npm ci --prefix functions', 'echo pulei')],
  ['npm install no lugar do npm ci', PUBLICA.replace('npm ci --prefix functions', 'npm install --prefix functions')],
  ['dependencias do endpoint depois do envio', (() => {
    const m = PUBLICA.match(/      - name: Dependencias do endpoint de IA \(functions\/\)\n(?:        .*\n)+/);
    if (!m) return PUBLICA;
    const sem = PUBLICA.replace(m[0], '');
    return sem.replace(/(        run: \|\n          npx --yes wrangler@[\s\S]*?publicou=sim" >> "\$GITHUB_OUTPUT"\n)/, '$1' + m[0]);
  })()],
  ['envio com working-directory', PUBLICA.replace(/(id: envio\n)/, '$1        working-directory: _site\n')],
  ['checkout raso', PUBLICA.replace(/(ref: \$\{\{ github\.event\.workflow_run\.head_sha \}\}\n\s+)fetch-depth: 0/, '$1fetch-depth: 1')],
  ['sem o job do GitHub Pages', PUBLICA.replace('  publica-github-pages:\n', '  outro-job:\n')],
  ['GitHub Pages sem a guarda do publicou', PUBLICA.replace(/(  publica-github-pages:\n    needs: publica\n)    if: needs\.publica\.outputs\.publicou == 'sim'\n/, '$1')],
  ['GitHub Pages com o icone novo (sem --endereco-antigo)', PUBLICA.replace('monta_site.sh _site_antigo --endereco-antigo', 'monta_site.sh _site_antigo')],
  ['GitHub Pages com checkout raso', PUBLICA.replace(/(  publica-github-pages:[\s\S]*?)fetch-depth: 0/, '$1fetch-depth: 1')],
  ['sem a conferencia do antigo', PUBLICA.replace('  conferencia-antigo:\n', '  outra-conferencia:\n')]
];
venenos.forEach(([nome, texto]) => {
  conf('veneno "' + nome + '" foi aplicado', texto !== PUBLICA);
  conf('veneno "' + nome + '" reprova', defeitosDoPublica(texto).length > 0);
});
const vconf = CONFERENCIA.replace(/  workflow_call:\n(    .*\n)+/, '');
conf('veneno "conferencia sem workflow_call" foi aplicado e reprova', vconf !== CONFERENCIA && defeitosDaConferencia(vconf).length > 0);
[['conferencia sem --montado', CONFERENCIA.replace('confere_no_ar.sh --montado "$SITE"', 'confere_no_ar.sh "$SITE"')],
 ['conferencia com o gatilho de push de volta', CONFERENCIA.replace('on:\n', 'on:\n  push:\n    branches: [main]\n')],
 ['conferencia com checkout raso', CONFERENCIA.replace('fetch-depth: 0', 'fetch-depth: 1')]].forEach(([nome, texto]) => {
  conf('veneno "' + nome + '" foi aplicado e reprova', texto !== CONFERENCIA && defeitosDaConferencia(texto).length > 0);
});

console.log('\n=== o site montado tem o que o aplicativo pede ===');
const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'site_b4_'));
try {
  execFileSync('sh', [path.join(RAIZ, '.github', 'monta_site.sh'), destino], { cwd: RAIZ, stdio: 'pipe' });
  const tem = rel => fs.existsSync(path.join(destino, rel));
  const sw = ler('sw.js');
  const lista = (sw.match(/var ARQUIVOS = \[([\s\S]*?)\];/) || [])[1] || '';
  const arquivos = (lista.replace(/\/\*[\s\S]*?\*\//g, '').match(/'\.\/[^']*'/g) || [])
    .map(s => s.slice(3, -1)).map(s => s === '' ? 'index.html' : s);
  conf('o ARQUIVOS do sw.js foi lido (controle: mais de 15 entradas)', arquivos.length > 15, arquivos.length);
  const faltam = arquivos.filter(a => !tem(a));
  conf('toda entrada do ARQUIVOS esta no site (' + arquivos.length + ')', faltam.length === 0, faltam.join(','));
  const indice = JSON.parse(ler('banco/topicos/indice.json'));
  const assuntos = indice.disciplinas.map(x => 'banco/topicos/' + x.chave + '.json');
  conf('o indice cita assuntos (controle: mais de 5)', assuntos.length > 5, assuntos.length);
  const faltamAss = assuntos.filter(a => !tem(a));
  conf('todo arquivo de assunto do indice esta no site', faltamAss.length === 0, faltamAss.join(','));
  const pasta = (ler('app.js').match(/var PDFJS_PASTA = '([^']+)'/) || [])[1];
  conf('o leitor de PDF (' + pasta + ') esta no site',
    !!pasta && tem(pasta + 'pdf.min.mjs') && tem(pasta + 'pdf.worker.min.mjs') && tem(pasta + 'wasm/jbig2.wasm'));
  conf('o site tem 404.html (sem ele o Cloudflare responde 200 com o index para caminho que nao existe)',
    tem('404.html') && /não encontrado/.test(fs.readFileSync(path.join(destino, '404.html'), 'utf8')));
  // O icone do endereco novo (pedido do dono, 08/11): no site do Cloudflare os
  // arquivos de icons/ sao os de icons/pages-dev/; no repositorio (o que o
  // GitHub Pages publica) continuam os de sempre; a pasta pages-dev nao sobe.
  const crypto = require('crypto');
  const hashDe = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'favicon.png'].forEach(f => {
    const novo = hashDe(path.join(RAIZ, 'icons', 'pages-dev', f));
    const velho = hashDe(path.join(RAIZ, 'icons', f));
    conf('icone ' + f + ': o site do Cloudflare tem o NOVO', hashDe(path.join(destino, 'icons', f)) === novo);
    conf('icone ' + f + ': o repositorio (GitHub Pages) continua com o de sempre, diferente do novo', velho !== novo);
  });
  conf('o site do Cloudflare tem o apple-touch-icon novo (180 px)',
    tem('icons/apple-touch-icon.png') && hashDe(path.join(destino, 'icons', 'apple-touch-icon.png')) === hashDe(path.join(RAIZ, 'icons', 'pages-dev', 'apple-touch-icon.png')));
  conf('a pasta icons/pages-dev nao sobe para o site', !tem('icons/pages-dev/icon-192.png'));
  // 13f: VERSAO e CACHE do site sao os gerados pelo contador, maiores que os
  // fixos do repositorio; o resto do app.js e do sw.js e o do commit.
  const VP = require('./versao_publicada.js');
  const gerado = VP.calcular(args => execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 }), 'HEAD');
  const appSite = fs.readFileSync(path.join(destino, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
  const swSite = fs.readFileSync(path.join(destino, 'sw.js'), 'utf8').replace(/\r\n/g, '\n');
  conf('o app.js do site traz a VERSAO gerada (' + gerado.versao + ')', VP.lerValor(appSite, VP.RE_VERSAO) === gerado.versao);
  conf('o sw.js do site traz o CACHE gerado (' + gerado.cache + ')', VP.lerValor(swSite, VP.RE_CACHE) === gerado.cache);
  conf('controle: o repositorio continua com o valor fixo, diferente do gerado',
    VP.lerValor(ler('app.js'), VP.RE_VERSAO) !== gerado.versao && VP.lerValor(ler('sw.js'), VP.RE_CACHE) !== gerado.cache);
  conf('fora a VERSAO, o CACHE e as NOVIDADES geradas, o app.js e o sw.js do site sao os do commit',
    appSite.replace(VP.RE_VERSAO, '$1X$3').replace(/^([ \t]*var NOVIDADES = \[)\n(?:[ \t]*\{ versao: "[^"]*", itens: .*\},\n)*/m, '$1\n') ===
      ler('app.js').replace(VP.RE_VERSAO, '$1X$3') &&
    swSite.replace(VP.RE_CACHE, '$1X$3') === ler('sw.js').replace(VP.RE_CACHE, '$1X$3'));
  conf('a pasta novidades/ nao sobe ao site (vai dentro do app.js)', !fs.existsSync(path.join(destino, 'novidades')));
  conf('o confere_no_ar.sh le a VERSAO e o CACHE gerados do site montado', (() => {
    const v = execFileSync('sh', ['-c', "sed -n \"s/^ *var VERSAO = '\\([^']*\\)'.*/\\1/p\" \"$1\" | head -1", 'x', path.join(destino, 'app.js')], { encoding: 'utf8' }).trim();
    const c = execFileSync('sh', ['-c', "sed -n \"s/^var CACHE = '\\([^']*\\)'.*/\\1/p\" \"$1\" | head -1", 'x', path.join(destino, 'sw.js')], { encoding: 'utf8' }).trim();
    return v === gerado.versao && c === gerado.cache;
  })());
  const antigo = fs.mkdtempSync(path.join(os.tmpdir(), 'site_antigo_'));
  try {
    execFileSync('sh', [path.join(RAIZ, '.github', 'monta_site.sh'), antigo, '--endereco-antigo'], { cwd: RAIZ, stdio: 'pipe' });
    const lerA = rel => fs.readFileSync(path.join(antigo, rel), 'utf8').replace(/\r\n/g, '\n');
    conf('endereco antigo: o mesmo app.js, sw.js e index.html do novo (a conferencia compara estes)',
      ['app.js', 'sw.js', 'index.html'].every(f => lerA(f) === fs.readFileSync(path.join(destino, f), 'utf8').replace(/\r\n/g, '\n')));
    ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'favicon.png'].forEach(f => {
      conf('endereco antigo: o icone ' + f + ' e o de sempre', hashDe(path.join(antigo, 'icons', f)) === hashDe(path.join(RAIZ, 'icons', f)));
    });
    conf('endereco antigo: a pasta icons/pages-dev nao sobe', !fs.existsSync(path.join(antigo, 'icons', 'pages-dev')));
    let codigo = 0;
    try { execFileSync('sh', [path.join(RAIZ, '.github', 'monta_site.sh'), antigo, '--outra'], { cwd: RAIZ, stdio: 'pipe' }); } catch (e) { codigo = e.status; }
    conf('opcao desconhecida no montador sai com 2', codigo, 2);
  } finally { fs.rmSync(antigo, { recursive: true, force: true }); }
  conf('o index.html do site e o do commit, igual (a conferencia-no-ar compara)',
    fs.readFileSync(path.join(destino, 'index.html'), 'utf8').replace(/\r\n/g, '\n') === ler('index.html'));
  conf('o apple-touch-icon do index.html aponta para icons/icon-192.png, que no Cloudflare e o novo',
    /<link rel="apple-touch-icon" href="icons\/icon-192\.png">/.test(ler('index.html')));
  const todos = [];
  (function anda(d, rel) {
    fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
      const r = rel ? rel + '/' + e.name : e.name;
      if (e.isDirectory()) anda(path.join(d, e.name), r); else todos.push(r);
    });
  })(destino, '');
  const proibidos = todos.filter(r => /^(_teste|biblioteca|\.github|functions|servidor)\//.test(r) || /\.(md|py|sh)$/.test(r) ||
    r.split('/').some(p => p[0] === '_' || p[0] === '.'));
  conf('nada de _teste, biblioteca, .github, functions, servidor, .md, .py ou "_" no site (' + todos.length + ' arquivos)',
    proibidos.length === 0 && todos.length > 0, proibidos.slice(0, 5).join(','));
  // O endpoint de IA (functions/) e o nucleo dele (servidor/) sao codigo do
  // servidor: o wrangler os empacota; como arquivo estatico, nao sobem. O
  // controle positivo prova que eles existem no repositorio (o filtro tem o
  // que tirar) e que nenhum arquivo do site tem o nome deles.
  conf('controle: o repositorio tem functions/api/ia.js e servidor/ia.mjs, e o site nao',
    fs.existsSync(path.join(RAIZ, 'functions', 'api', 'ia.js')) && fs.existsSync(path.join(RAIZ, 'servidor', 'ia.mjs')) &&
    !tem('functions/api/ia.js') && !tem('servidor/ia.mjs') && !todos.some(r => /(^|\/)ia\.mjs$/.test(r)));
  // controle positivo do filtro: no repositorio esses caminhos existem
  conf('controle: o repositorio tem _teste/ e banco/topicos/_ids.json que o filtro tirou',
    fs.existsSync(path.join(RAIZ, '_teste', 'confere_tudo.sh')) && fs.existsSync(path.join(RAIZ, 'banco/topicos/_ids.json')) &&
    !tem('_teste/confere_tudo.sh') && !tem('banco/topicos/_ids.json'));
} finally {
  fs.rmSync(destino, { recursive: true, force: true });
}

console.log('\n' + passes + ' verificacoes passaram, ' + falhas + ' falharam');
process.exit(falhas ? 1 : 0);
