/* P1: a folha de matematica nao muda nem um byte.
 *
 * Ferramenta de prova, nao entra no portao: gera a folha completa dos 148 temas
 * do banco, em portugues e em ingles, com o pdf.js da BASE DO MERGE e com o
 * desta branch, e compara os bytes tema a tema. Sao 296 folhas.
 *
 * Por que a base do merge e nao o HEAD: no portao o commit ja esta feito, e uma
 * trava que compara o arquivo com "git show HEAD:arquivo" nao afirma nada,
 * porque os dois lados sao iguais por construcao.
 *
 * O pdf.js da base e gravado na RAIZ do repositorio, e nao numa pasta
 * temporaria, porque ele resolve "./figuras/receitas.js" pelo proprio caminho:
 * de fora da raiz o modulo de figuras nao carrega, toda figura vira aviso, e a
 * comparacao passaria a comparar duas folhas sem desenho nenhum.
 *
 * Uso: node _teste/compara_pdfs_base.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const COPIA = path.join(RAIZ, '_pdf_base_temporario.js');

function git(args) {
  return execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

let base;
try {
  base = git(['merge-base', 'HEAD', 'main']).trim();
} catch (e) {
  console.log('sem base de merge para comparar: ' + (e && e.message ? e.message : e));
  process.exit(1);
}
const cabeca = git(['rev-parse', 'HEAD']).trim();
console.log('base do merge: ' + base + (base === cabeca ? ' (a mesma arvore do HEAD)' : ''));

/* A copia sai do git em BYTES e e gravada em bytes. Gravada como texto latin1,
 * cada acento do arquivo (que e UTF-8) virava um byte solto, o node lia o
 * arquivo como UTF-8 e as chaves de SIMBOLOS ("pi", "raiz") chegavam quebradas:
 * a base saia com simbolo desenhado onde a branch nao saia, e as 296 folhas
 * diferiam por causa da ferramenta de prova, e nao do codigo sob prova. */
fs.writeFileSync(COPIA, execFileSync('git', ['show', base + ':pdf.js'],
  { cwd: RAIZ, maxBuffer: 64 * 1024 * 1024 }));

let iguais = 0, diferentes = 0;
const relatos = [];
try {
  const antigo = require(COPIA);
  const novo = require(path.join(RAIZ, 'pdf.js'));
  const banco = JSON.parse(fs.readFileSync(path.join(RAIZ, 'temas', 'banco.json'), 'utf8'));

  /* Os avisos de figura sao os mesmos dos dois lados e enchem a tela de ruido
   * quando um tema pede uma receita que nao existe. O que importa aqui sao os
   * bytes. */
  const warn = console.warn;
  console.warn = function () {};

  function folha(mod, tema, lingua) {
    return mod.gerarMaterialTema({
      tema: tema, lingua: lingua,
      incluirMaterial: true, incluirLista: true, incluirGabarito: true,
      aluno: 'Aluna', data: '10/06/2026'
    });
  }

  banco.temas.forEach(function (tema) {
    ['pt', 'en'].forEach(function (lingua) {
      const a = Buffer.from(folha(antigo, tema, lingua));
      const b = Buffer.from(folha(novo, tema, lingua));
      if (a.equals(b)) { iguais++; return; }
      diferentes++;
      let pos = 0;
      const n = Math.min(a.length, b.length);
      while (pos < n && a[pos] === b[pos]) pos++;
      relatos.push('  ' + tema.id + ' (' + lingua + '): ' + a.length + ' bytes na base contra ' +
        b.length + ' na branch; primeiro byte diferente em ' + pos +
        '\n    base:   ' + JSON.stringify(a.slice(Math.max(0, pos - 40), pos + 40).toString('latin1')) +
        '\n    branch: ' + JSON.stringify(b.slice(Math.max(0, pos - 40), pos + 40).toString('latin1')));
    });
  });
  console.warn = warn;
} finally {
  try { fs.unlinkSync(COPIA); } catch (e) { /* a copia ja saiu */ }
}

console.log('\n' + '='.repeat(60));
console.log(iguais + ' iguais, ' + diferentes + ' diferentes.');
if (diferentes) { console.log('\nDIFERENCAS:'); relatos.forEach(function (r) { console.log(r); }); }
console.log('='.repeat(60));
process.exit(diferentes ? 1 : 0);
