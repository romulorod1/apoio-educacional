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

  const c = blocoJob(texto, 'conferencia') || '';
  if (!/needs: publica/.test(c) || !/uses: \.\/\.github\/workflows\/conferencia-no-ar\.yml/.test(c) ||
      !/site: https:\/\/apoio-educacional\.pages\.dev/.test(c))
    d.push('a conferencia do endereco novo nao segue o envio');
  return d;
}

function defeitosDaConferencia(texto) {
  const d = [];
  const gatilhos = filhos(blocoTopo(texto, 'on'));
  ['push', 'workflow_dispatch', 'workflow_call'].forEach(g => {
    if (gatilhos.indexOf(g) < 0) d.push('conferencia-no-ar sem o gatilho ' + g);
  });
  if (!/SITE_ANTIGO: https:\/\/romulorod1\.github\.io\/apoio-educacional/.test(texto)) d.push('sem o endereco antigo');
  if (!/- https:\/\/apoio-educacional\.pages\.dev/.test(texto)) d.push('a escolha manual nao tem o endereco novo');
  if (!/ref: \$\{\{ inputs\.ref \|\| github\.sha \}\}/.test(texto)) d.push('checkout nao segue o commit pedido');
  if (!/SITE="\$\{SITE_PEDIDO:-\$SITE_ANTIGO\}"/.test(texto)) d.push('o site conferido nao vem do pedido');
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
conf('conferencia-no-ar confere o antigo no push e o novo pela chamada', dc.length === 0, dc.join('; '));

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
  ['sem a conferencia', PUBLICA.replace('uses: ./.github/workflows/conferencia-no-ar.yml', 'uses: ./outro.yml')]
];
venenos.forEach(([nome, texto]) => {
  conf('veneno "' + nome + '" foi aplicado', texto !== PUBLICA);
  conf('veneno "' + nome + '" reprova', defeitosDoPublica(texto).length > 0);
});
const vconf = CONFERENCIA.replace(/  workflow_call:\n(    .*\n)+/, '');
conf('veneno "conferencia sem workflow_call" foi aplicado e reprova', vconf !== CONFERENCIA && defeitosDaConferencia(vconf).length > 0);

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
  const todos = [];
  (function anda(d, rel) {
    fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
      const r = rel ? rel + '/' + e.name : e.name;
      if (e.isDirectory()) anda(path.join(d, e.name), r); else todos.push(r);
    });
  })(destino, '');
  const proibidos = todos.filter(r => /^(_teste|biblioteca|\.github)\//.test(r) || /\.(md|py|sh)$/.test(r) ||
    r.split('/').some(p => p[0] === '_' || p[0] === '.'));
  conf('nada de _teste, biblioteca, .github, .md, .py ou "_" no site (' + todos.length + ' arquivos)',
    proibidos.length === 0 && todos.length > 0, proibidos.slice(0, 5).join(','));
  // controle positivo do filtro: no repositorio esses caminhos existem
  conf('controle: o repositorio tem _teste/ e banco/topicos/_ids.json que o filtro tirou',
    fs.existsSync(path.join(RAIZ, '_teste', 'confere_tudo.sh')) && fs.existsSync(path.join(RAIZ, 'banco/topicos/_ids.json')) &&
    !tem('_teste/confere_tudo.sh') && !tem('banco/topicos/_ids.json'));
} finally {
  fs.rmSync(destino, { recursive: true, force: true });
}

console.log('\n' + passes + ' verificacoes passaram, ' + falhas + ' falharam');
process.exit(falhas ? 1 : 0);
