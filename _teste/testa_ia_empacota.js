/* testa_ia_empacota.js (projeto IA no app, fase 1; sem navegador, COM rede do npm)
 *
 * O deploy da main empacota a Pages Function (functions/api/ia.js) com o SDK
 * da Anthropic. Se o empacotamento falhar, TODO deploy do app fica travado
 * até o conserto. Esta prova faz, antes do merge, o mesmo que o deploy faz:
 *   1. npm ci numa cópia de functions/ (a versão vem do lock);
 *   2. wrangler pages functions build, com a mesma versão do deploy;
 * e confere que as rotas geradas para o Cloudflare são SÓ /api/ia: todo o
 * resto do site continua servido como arquivo, sem passar pela Function.
 *
 * Precisa de rede até o registro do npm. Sem rede ela FALHA (não pula): uma
 * prova que pula calada passaria com o empacotamento quebrado.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
let passes = 0, falhas = 0;
function conf(rotulo, ok, detalhe) {
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK    ' : '  FALHA ') + rotulo + (ok || detalhe === undefined ? '' : '  [' + detalhe + ']'));
}

/* A versão do wrangler é a do deploy, lida do próprio workflow. */
const pub = fs.readFileSync(path.join(RAIZ, '.github', 'workflows', 'publica-cloudflare.yml'), 'utf8');
const versao = (pub.match(/wrangler@(\d+\.\d+\.\d+) pages deploy/) || [])[1];
conf('a versão do wrangler do deploy foi lida (' + versao + ')', !!versao);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ia_empacota_'));
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const roda = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'pipe', shell: process.platform === 'win32', encoding: 'utf8' });
try {
  // Cópia mínima da árvore que o wrangler enxerga: functions/ (sem
  // node_modules) e servidor/, nas mesmas posições relativas.
  fs.cpSync(path.join(RAIZ, 'functions'), path.join(tmp, 'functions'), {
    recursive: true, filter: s => s.split(path.sep).indexOf('node_modules') < 0
  });
  fs.cpSync(path.join(RAIZ, 'servidor'), path.join(tmp, 'servidor'), { recursive: true });

  let ok = true, msg = '';
  try { roda(npm, ['ci', '--prefix', 'functions', '--no-audit', '--no-fund'], tmp); }
  catch (e) { ok = false; msg = String(e.stderr || e.message).slice(0, 300); }
  conf('npm ci --prefix functions instala pelo lock', ok, msg);

  const saida = path.join(tmp, 'saida');
  const rotas = path.join(tmp, '_routes.json');
  ok = true; msg = '';
  if (versao) {
    try { roda(npx, ['--yes', 'wrangler@' + versao, 'pages', 'functions', 'build', '--outdir', saida, '--output-routes-path', rotas], tmp); }
    catch (e) { ok = false; msg = String(e.stderr || e.stdout || e.message).slice(-400); }
  } else ok = false;
  conf('wrangler ' + versao + ' empacota functions/ com o SDK e o servidor/', ok && fs.existsSync(path.join(saida, 'index.js')), msg);

  const bundle = fs.existsSync(path.join(saida, 'index.js')) ? fs.readFileSync(path.join(saida, 'index.js'), 'utf8') : '';
  conf('o pacote traz o núcleo (montarParametros) e o SDK (api.anthropic.com)',
    bundle.indexOf('montarParametros') >= 0 && bundle.indexOf('api.anthropic.com') >= 0);

  let r = null;
  try { r = JSON.parse(fs.readFileSync(rotas, 'utf8')); } catch (e) { /* fica null */ }
  conf('as rotas da Function são só /api/ia (o resto do site não passa por ela)',
    !!r && JSON.stringify(r.include) === JSON.stringify(['/api/ia']), JSON.stringify(r));
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log('\n' + passes + ' verificacoes passaram, ' + falhas + ' falharam');
process.exit(falhas ? 1 : 0);
