/* testa_vocabulario.js
 *
 * C10a (lente de UX, glossário): a tela dela fala a língua dela. "Relato da
 * aula" no lugar de "O que rendeu hoje" e de "notas públicas"; "Nota só minha"
 * no lugar de "Só minha", "Nota privada" e "observações pedagógicas";
 * "Desmarcada em cima da hora, cobrada" no lugar de "cancelada cobrável";
 * "Novo ano letivo" no lugar de "Virada de Séries" e de "Virada de ciclo".
 *
 * Lê app.js e index.html como texto, sem navegador. No app.js só conta o que
 * está entre aspas (comentário não é tela); no index.html, o que não é
 * comentário nem folha de estilo. Literais colados por + contam como um texto
 * só, para a frase partida em duas linhas não escapar.
 *
 * A mesma busca roda no app.js e no index.html do commit dae7245, de antes da
 * troca, e TEM de achar cada termo lá: busca que não acha nada no antigo é
 * cega, e cega passa por sorte.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const ANTES = 'dae7245';

let ok = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const passou = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (passou) ok++; else falhas++;
  console.log((passou ? '  OK    ' : '  FALHA ') + rotulo + (passou ? '' : '  [obtido: ' + JSON.stringify(obtido) + ' | esperado: ' + JSON.stringify(esperado) + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

/* Os literais de texto de um arquivo JS, com a linha onde começam. Anda
 * caractere a caractere: comentário de linha e de bloco saem, e o // dentro de
 * uma string ou de uma expressão regular não é tomado por comentário. */
function literaisDoJs(src) {
  const lits = [];
  let i = 0, linha = 1, ultimo = '';
  let juntar = false; // o literal anterior foi seguido só de espaço e +
  const ANTES_DE_REGEX = '(,=:[!&|?{};+-*%<>~^';
  function avanca(n) {
    for (let k = 0; k < n; k++) { if (src[i] === '\n') linha++; i++; }
  }
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && d === '*') {
      const fim = src.indexOf('*/', i + 2);
      avanca((fim < 0 ? src.length : fim + 2) - i);
      continue;
    }
    if (c === '/' && (ultimo === '' || ANTES_DE_REGEX.indexOf(ultimo) >= 0 || /(^|[^\w$])(return|typeof)$/.test(src.slice(Math.max(0, i - 8), i).trimEnd()))) {
      // expressão regular: até a barra que fecha, fora de [ ] e sem escape
      avanca(1);
      let classe = false;
      while (i < src.length && src[i] !== '\n') {
        if (src[i] === '\\') { avanca(2); continue; }
        if (src[i] === '[') classe = true;
        else if (src[i] === ']') classe = false;
        else if (src[i] === '/' && !classe) { avanca(1); break; }
        avanca(1);
      }
      while (/[a-z]/.test(src[i] || '')) avanca(1);
      ultimo = 'r'; juntar = false;
      continue;
    }
    if (c === '\'' || c === '"' || c === '`') {
      const linhaInicio = linha;
      let texto = '';
      avanca(1);
      while (i < src.length && src[i] !== c) {
        if (src[i] === '\\') {
          const e = src[i + 1];
          if (e === 'u') { texto += String.fromCharCode(parseInt(src.slice(i + 2, i + 6), 16)); avanca(6); continue; }
          texto += e === 'n' ? '\n' : e === '\n' ? '' : e;
          avanca(2);
          continue;
        }
        texto += src[i];
        avanca(1);
      }
      avanca(1);
      if (juntar && lits.length) lits[lits.length - 1].texto += texto;
      else lits.push({ linha: linhaInicio, texto });
      ultimo = 'a'; juntar = false;
      continue;
    }
    if (c === '+' && ultimo === 'a') { juntar = true; ultimo = '+'; avanca(1); continue; }
    if (!/\s/.test(c)) {
      ultimo = c;
      juntar = false;
    }
    avanca(1);
  }
  return lits;
}

/* O texto do index.html que aparece: sem comentário de HTML e sem os blocos
 * de estilo. Dividido por linha, para a falha dizer onde. */
function textosDoHtml(src) {
  const limpo = src
    .replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '))
    .replace(/<style[\s\S]*?<\/style>/gi, m => m.replace(/[^\n]/g, ' '));
  return limpo.split('\n').map((t, k) => ({ linha: k + 1, texto: t }));
}

// a coluna da direita do glossário: o que a tela dela não diz mais
const TERMOS = [
  ['O que rendeu hoje', /o que rendeu hoje/i],
  ['notas públicas', /notas públicas/i],
  ['Só minha sem "Nota"', /(?<!nota )só minha/i],
  ['Nota privada', /nota privada/i],
  ['observações pedagógicas', /observações pedagógicas/i],
  ['cancelada cobrável', /cancelada cobrável/i],
  ['Virada de Séries', /virada de séries/i],
  ['Virada de ciclo', /virada de ciclo/i]
];

function procura(nomeArquivo, textos) {
  const achados = [];
  textos.forEach(t => {
    const s = t.texto.replace(/\s+/g, ' ');
    TERMOS.forEach(([nome, rx]) => { if (rx.test(s)) achados.push({ arquivo: nomeArquivo, linha: t.linha, termo: nome }); });
  });
  return achados;
}
function varre(appJs, indexHtml) {
  return procura('app.js', literaisDoJs(appJs)).concat(procura('index.html', textosDoHtml(indexHtml)));
}

secao('0. O instrumento: comentário não conta, // dentro de texto não corta');
const amostra = [
  '// Nota privada num comentário de linha',
  '/* notas públicas num comentário de bloco */',
  'var r = /\\/\\//g; var a = \'http://x.y Nota privada\';',
  'var b = \'O que rendeu \' +',
  '  \'hoje\';',
  'var c = "Nota só minha"; var d = 2 / 3; var e = \'Só minha\';'
].join('\n');
const naAmostra = procura('amostra', literaisDoJs(amostra));
conf('acha o termo depois de // dentro do texto, na linha 3', naAmostra.filter(a => a.termo === 'Nota privada').map(a => a.linha), [3]);
conf('não acha o termo dos comentários', naAmostra.filter(a => a.termo === 'notas públicas').length, 0);
conf('acha a frase partida por +', naAmostra.filter(a => a.termo === 'O que rendeu hoje').map(a => a.linha), [4]);
conf('"Nota só minha" passa e "Só minha" sozinho não', naAmostra.filter(a => a.termo === 'Só minha sem "Nota"').map(a => a.linha), [6]);
conf('comentário de HTML não conta', procura('h', textosDoHtml('<!-- Virada de ciclo -->\n<p>Virada de Séries</p>')).map(a => a.termo), ['Virada de Séries']);

secao('1. Controle: no ' + ANTES + ', de antes da troca, a busca acha cada termo');
/* Sem o commit (clone raso, ou ramo apagado depois de um squash) o controle
 * falha com o motivo, e não passa calado: controle que não rodou não controla. */
function doCommit(arq) {
  try {
    return execFileSync('git', ['show', ANTES + ':' + arq], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    conf('o controle lê ' + arq + ' do ' + ANTES + ' (' + String(e.stderr || e.message).trim().split('\n')[0] + ')', false, true);
    return '';
  }
}
const antigos = varre(doCommit('app.js'), doCommit('index.html'));
TERMOS.forEach(([nome]) => {
  conf('no antigo há "' + nome + '"', antigos.some(a => a.termo === nome), true);
});
conf('e não acha os de comentário do antigo (app.js 10951, "// Checkbox notas públicas")',
  antigos.some(a => a.arquivo === 'app.js' && a.linha === 10951), false);

secao('2. Hoje: nenhum termo antigo no texto da tela dela');
const appJs = fs.readFileSync(path.join(RAIZ, 'app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
const sobras = varre(appJs, indexHtml);
conf('nenhuma sobra', sobras.map(a => a.arquivo + ':' + a.linha + ' ' + a.termo), []);

secao('3. E as palavras dela estão lá, como rótulo inteiro');
/* Rótulo inteiro, e não pedaço de frase: a novidade da versão cita todas as
 * palavras, e sozinha faria esta parte passar com o rótulo de volta ao antigo. */
const rotulosApp = literaisDoJs(appJs).map(t => t.texto.trim().replace(/:$/, '').toLowerCase());
['Relato da aula', 'Nota só minha', 'desmarcada em cima da hora, cobrada', '+ Página', 'Apagar esta página?']
  .forEach(r => conf('"' + r + '" é um rótulo do app.js', rotulosApp.indexOf(r.toLowerCase()) >= 0, true));
conf('"Novo ano letivo" é o botão de Ajustes', />Novo ano letivo<\/button>/.test(indexHtml), true);

secao('4. O padrão da seção de áreas no documento');
const Core = require('../core.js');
conf('o título padrão é "Habilidades e hábitos"', Core.TITULOS_FECHAMENTO.areas, 'Habilidades e hábitos');

console.log('\n' + ok + ' verificações passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
