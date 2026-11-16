/* monta_mathjax.js: monta o vendor/mathjax-4.1.3/ a partir do npm, de forma repetível.
 *
 *   node ferramentas/monta_mathjax.js              monta e grava o vendor
 *   node ferramentas/monta_mathjax.js --confere    monta numa pasta de fora e
 *                                                  compara byte a byte com o
 *                                                  vendor versionado (sai 1 se
 *                                                  diferir)
 *   node ferramentas/monta_mathjax.js --trava      refaz o package-lock.json
 *                                                  (só quando uma versão muda)
 *   --trabalho <pasta>                             onde instalar (padrão: a
 *                                                  pasta temporária do sistema)
 *
 * As versões estão travadas em ferramentas/mathjax/package.json (sem ^ nem ~) e
 * o package-lock.json ao lado trava o resto da árvore, com o hash de cada
 * pacote. A instalação é por `npm ci` numa pasta FORA do repositório: nada de
 * node_modules aqui dentro. O esbuild (versão travada também) empacota
 * ferramentas/mathjax/entrada.js num IIFE minificado, ES2017, para o navegador.
 *
 * Grava:
 *   vendor/mathjax-4.1.3/mathjax-svg.min.js   o pacote, com a linha de licença
 *   vendor/mathjax-4.1.3/LICENSE              a Apache 2.0, copiada do @mathjax/src
 *
 * O vendor NÃO entra no ARQUIVOS do sw.js: o aplicativo o busca na primeira vez
 * que um documento tem fórmula (formula.js, Formula.pronto) e ele fica no cache
 * BAIXADOS, como o leitor de PDF.
 *
 * Regra da casa: nunca usar travessão.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const FONTES = path.join(__dirname, 'mathjax');
const VERSAO = '4.1.3';
const DESTINO = path.join(RAIZ, 'vendor', 'mathjax-' + VERSAO);
const PACOTE = 'mathjax-svg.min.js';

const args = process.argv.slice(2);
const confere = args.includes('--confere');
const trava = args.includes('--trava');
const iTrab = args.indexOf('--trabalho');
const trabalho = iTrab >= 0 ? path.resolve(args[iTrab + 1]) : path.join(os.tmpdir(), 'monta-mathjax-' + VERSAO);

function npm(argumentos) {
  const r = spawnSync('npm', argumentos, { cwd: trabalho, stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) { console.error('npm ' + argumentos.join(' ') + ' falhou (' + r.status + ')'); process.exit(1); }
}

fs.mkdirSync(trabalho, { recursive: true });
fs.copyFileSync(path.join(FONTES, 'package.json'), path.join(trabalho, 'package.json'));
fs.copyFileSync(path.join(FONTES, 'entrada.js'), path.join(trabalho, 'entrada.js'));
const lock = path.join(FONTES, 'package-lock.json');
if (trava) {
  try { fs.rmSync(path.join(trabalho, 'package-lock.json')); } catch (e) { /* não havia */ }
  npm(['install', '--package-lock-only', '--no-audit', '--no-fund']);
  fs.copyFileSync(path.join(trabalho, 'package-lock.json'), lock);
  console.log('package-lock.json refeito em ' + path.relative(RAIZ, lock));
}
if (!fs.existsSync(lock)) { console.error('falta ' + path.relative(RAIZ, lock) + ' (rode com --trava uma vez)'); process.exit(1); }
fs.copyFileSync(lock, path.join(trabalho, 'package-lock.json'));
npm(['ci', '--no-audit', '--no-fund']);

/* As versões que de fato instalaram, conferidas contra as travadas: um lock
 * mexido à mão não passa calado. */
const travadas = JSON.parse(fs.readFileSync(path.join(FONTES, 'package.json'), 'utf8')).dependencies;
for (const nome of Object.keys(travadas)) {
  const v = JSON.parse(fs.readFileSync(path.join(trabalho, 'node_modules', nome, 'package.json'), 'utf8')).version;
  if (v !== travadas[nome]) { console.error(nome + ' instalou ' + v + ', travado em ' + travadas[nome]); process.exit(1); }
}
const mhchem = JSON.parse(fs.readFileSync(path.join(trabalho, 'node_modules', 'mhchemparser', 'package.json'), 'utf8')).version;

const esbuild = require(path.join(trabalho, 'node_modules', 'esbuild'));
const banner = '/* MathJax ' + VERSAO + ' (Apache-2.0, https://www.mathjax.org), com a fonte New Computer Modern ' +
  'do MathJax e o mhchemParser ' + mhchem + ' (Apache-2.0). Empacotado por ferramentas/monta_mathjax.js; ' +
  'a licença está em LICENSE, nesta pasta. */';
const r = esbuild.buildSync({
  entryPoints: [path.join(trabalho, 'entrada.js')],
  absWorkingDir: trabalho,
  bundle: true, minify: true, format: 'iife', platform: 'browser', target: 'es2017',
  legalComments: 'none', charset: 'utf8', write: false, logLevel: 'warning',
  banner: { js: banner }
});
const codigo = Buffer.from(r.outputFiles[0].contents);
if (codigo.indexOf(Buffer.from(trabalho)) >= 0 || codigo.indexOf(Buffer.from(trabalho.replace(/\\/g, '/'))) >= 0) {
  console.error('o pacote cita a pasta de trabalho: a montagem não seria repetível');
  process.exit(1);
}
const licenca = fs.readFileSync(path.join(trabalho, 'node_modules', '@mathjax', 'src', 'LICENSE'));

const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const gz = zlib.gzipSync(codigo, { level: 9 }).length;
console.log(PACOTE + ': ' + codigo.length + ' bytes, ' + gz + ' com gzip, sha256 ' + sha(codigo));

if (confere) {
  const arq = path.join(DESTINO, PACOTE);
  const atual = fs.existsSync(arq) ? fs.readFileSync(arq) : Buffer.alloc(0);
  const licAtual = fs.existsSync(path.join(DESTINO, 'LICENSE')) ? fs.readFileSync(path.join(DESTINO, 'LICENSE')) : Buffer.alloc(0);
  const igual = atual.equals(codigo) && licAtual.equals(licenca);
  console.log(igual ? 'CONFERE: o vendor versionado é byte a byte o que a montagem gera'
    : 'DIFERE: o vendor versionado (sha256 ' + sha(atual) + ') não é o que a montagem gera');
  process.exit(igual ? 0 : 1);
}
fs.mkdirSync(DESTINO, { recursive: true });
fs.writeFileSync(path.join(DESTINO, PACOTE), codigo);
fs.writeFileSync(path.join(DESTINO, 'LICENSE'), licenca);
console.log('gravado em ' + path.relative(RAIZ, DESTINO));
