/* versao_publicada.js
 *
 * A VERSAO do app.js, o CACHE do sw.js e as NOVIDADES saem da publicação, e não
 * do PR (13f, 12/11/2026).
 *
 * Por quê: todo PR que mudava o app editava as MESMAS linhas (VERSAO e
 * NOVIDADES no app.js, CACHE e o comentário do cache no sw.js). Cada merge
 * deixava os outros PRs em conflito e obrigava a trazer a main, subir a versão
 * e rodar a bateria inteira de novo.
 *
 * Agora:
 *   - No repositório, VERSAO e CACHE ficam FIXOS nos valores da última versão
 *     escrita à mão (1.42.61 e apoio-educacional-v141). São o valor de
 *     desenvolvimento, que as provas usam, e o PISO da publicação. O PR não os
 *     muda: o merge_seguro recusa.
 *   - Na publicação, o .github/monta_site.sh chama este arquivo, que escreve no
 *     _site/ a VERSAO 1.43.N e o CACHE apoio-educacional-v(1000+N).
 *   - N é o CONTADOR DE PUBLICAÇÕES: quantos commits de primeiro pai da main,
 *     até o commit publicado, mudam algum arquivo que sobe ao site, uma
 *     novidade ou o próprio gerador. Só cresce, porque a main só cresce. Sobe
 *     exatamente quando o que o tablet baixa muda. Um PR só de prova, CI ou
 *     documentação não sobe N, e o tablet não vê "Versão nova pronta" por nada.
 *   - NOVIDADES vira um arquivo por PR, novidades/<nome>.txt: cada linha não
 *     vazia é um item, e linha que começa com "#" é comentário. A versão de
 *     cada arquivo é a do commit da main que o trouxe (1.43.N daquele commit).
 *     A publicação põe essas entradas na frente das NOVIDADES escritas no
 *     app.js, que ficam como histórico. A janela de novidades do app continua
 *     igual: mostra as da versão que abriu.
 *   - VERSAO_MINIMA_PROTOCOLO_MENSAGEM continua escrita à mão no app.js: é
 *     decisão de protocolo, e não de publicação.
 *
 *   node _teste/versao_publicada.js --arquivos-do-site   os arquivos que sobem (o monta_site.sh copia estes)
 *   node _teste/versao_publicada.js --contador [REV]     o N do commit (padrão HEAD)
 *   node _teste/versao_publicada.js --mostrar [REV]      N, VERSAO, CACHE e as novidades geradas
 *   node _teste/versao_publicada.js --montar PASTA [REV] escreve VERSAO, CACHE e NOVIDADES em PASTA/app.js e PASTA/sw.js
 *
 * Tudo lê o git, e nunca o disco: o que se publica é o commit. Clone raso
 * (sem a história inteira) daria um N MENOR que o já publicado, e o tablet não
 * atualizaria; por isso clone raso é erro, e não um número.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const BASE_DO_CACHE = 1000;
const PREFIXO_DA_VERSAO = '1.43.';
// O que muda o que é publicado sem estar no site: o montador e este gerador.
const GERADORES = ['.github/monta_site.sh', '_teste/versao_publicada.js'];
const NOVIDADE = /^novidades\/[^/]+\.txt$/;

/* O arquivo sobe ao site? A regra do monta_site.sh (que lista por aqui), por
 * caminho do repositório. Fica de fora o que só serve a quem trabalha no
 * repositório: provas, geradores da biblioteca, workflows, endpoint de IA (o
 * wrangler o empacota pela raiz), as novidades (vão dentro do app.js), .md, .py,
 * .sh e todo caminho com um pedaço que começa por "_" ou ponto. */
function ehDoSite(f) {
  f = String(f || '');
  if (!f) return false;
  if (/^(_teste|biblioteca|\.github|functions|servidor|novidades)\//.test(f)) return false;
  if (f === 'README.md' || /\.(md|py|sh)$/.test(f)) return false;
  if (/^_|\/_|^\.|\/\./.test(f)) return false;
  return true;
}
/* O arquivo muda o que é publicado (e por isso sobe o contador)? */
function contaParaPublicacao(f) {
  return ehDoSite(f) || /^novidades\//.test(String(f || '')) || GERADORES.indexOf(f) >= 0;
}

function versaoDe(n) { return PREFIXO_DA_VERSAO + n; }
function cacheDe(n) { return 'apoio-educacional-v' + (BASE_DO_CACHE + n); }

/* Itens de um arquivo de novidade: linha não vazia que não começa com "#". */
function lerNovidade(texto) {
  const linhas = String(texto == null ? '' : texto).replace(/^﻿/, '').replace(/\r/g, '').split('\n').map(l => l.trim());
  return {
    itens: linhas.filter(l => l && l[0] !== '#'),
    comentarios: linhas.filter(l => l && l[0] === '#').length
  };
}

function gitDe(raiz) {
  return args => execFileSync('git', args, { cwd: raiz || RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 });
}

/* A história de primeiro pai até rev, do commit mais antigo ao mais novo, com
 * os arquivos que cada um muda contra o primeiro pai (o merge na main conta pelo
 * que trouxe). Devolve [{ sha, mudancas: [{ estado, caminho }] }]. */
function historia(g, rev) {
  if (String(g(['rev-parse', '--is-shallow-repository'])).trim() === 'true') {
    throw new Error('clone raso: sem a historia inteira o contador sairia menor que o ja publicado (use fetch-depth: 0)');
  }
  const saida = g(['-c', 'core.quotePath=false', 'log', '--reverse', '--first-parent', '--diff-merges=first-parent',
    '--no-renames', '--name-status', '--format=@%H', rev || 'HEAD']);
  const commits = [];
  saida.split('\n').forEach(l => {
    if (!l) return;
    if (l[0] === '@') { commits.push({ sha: l.slice(1), mudancas: [] }); return; }
    const t = l.split('\t');
    if (t.length >= 2 && commits.length) commits[commits.length - 1].mudancas.push({ estado: t[0][0], caminho: t[t.length - 1] });
  });
  return commits;
}

/* Pura. O contador de cada commit e a versão de cada arquivo de novidade.
 * conta é a regra de "este arquivo muda o que é publicado" (a prova a troca
 * pelos venenos; o padrão é contaParaPublicacao). */
function contar(commits, conta) {
  conta = conta || contaParaPublicacao;
  let n = 0;
  const versaoDaNovidade = {};
  commits.forEach(c => {
    if (c.mudancas.some(m => conta(m.caminho))) n++;
    c.mudancas.forEach(m => {
      if (!NOVIDADE.test(m.caminho)) return;
      if (m.estado === 'D') delete versaoDaNovidade[m.caminho];
      else if (m.estado === 'A' || !(m.caminho in versaoDaNovidade)) versaoDaNovidade[m.caminho] = n;
    });
  });
  return { n, versaoDaNovidade };
}

/* Pura. As entradas geradas, da versão mais nova para a mais antiga; dentro de
 * uma versão, os arquivos em ordem de nome. Arquivo só de comentário não gera
 * entrada (o PR disse que não há novidade para ela). */
function entradasDeNovidade(arquivos, versaoDaNovidade) {
  const porVersao = {};
  Object.keys(arquivos).sort().forEach(caminho => {
    if (!(caminho in versaoDaNovidade)) throw new Error('novidade sem commit de origem na main: ' + caminho);
    const itens = lerNovidade(arquivos[caminho]).itens;
    if (!itens.length) return;
    const n = versaoDaNovidade[caminho];
    (porVersao[n] = porVersao[n] || []).push(...itens);
  });
  return Object.keys(porVersao).map(Number).sort((a, b) => b - a).map(n => ({ versao: versaoDe(n), itens: porVersao[n] }));
}

/* Tudo o que a publicação de rev gera, lido do git. */
function calcular(g, rev) {
  rev = rev || 'HEAD';
  const { n, versaoDaNovidade } = contar(historia(g, rev));
  const arquivos = {};
  g(['-c', 'core.quotePath=false', 'ls-tree', '-r', '--name-only', rev, '--', 'novidades/']).split('\n').filter(Boolean).forEach(c => {
    if (NOVIDADE.test(c)) arquivos[c] = g(['show', rev + ':' + c]);
  });
  return { n, versao: versaoDe(n), cache: cacheDe(n), novidades: entradasDeNovidade(arquivos, versaoDaNovidade) };
}

/* Troca a ÚNICA declaração da constante. Zero ou duas declarações é erro: o
 * navegador usaria uma que talvez não seja a trocada. */
function trocarUnica(texto, rotulo, padrao, novo) {
  const achadas = texto.match(new RegExp(padrao.source, 'gm')) || [];
  if (achadas.length !== 1) throw new Error(rotulo + ': esperava uma declaracao, achei ' + achadas.length);
  return texto.replace(padrao, novo);
}
const RE_VERSAO = /^([ \t]*var VERSAO = ')([^']*)(';)/m;
const RE_CACHE = /^(var CACHE = ')([^']*)(';)/m;
const RE_NOVIDADES = /^([ \t]*var NOVIDADES = \[)[ \t]*$/m;

function lerValor(texto, re) { const m = re.exec(String(texto || '').replace(/\r/g, '')); return m ? m[2] : null; }
function compararVersao(a, b) {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d; }
  return 0;
}
function numeroDoCache(c) { const m = /^apoio-educacional-v(\d+)$/.exec(String(c || '')); return m ? Number(m[1]) : null; }

/* Pura. O app.js e o sw.js publicados, a partir dos do commit e do calculado.
 * Recusa gerar VERSAO ou CACHE que não seja MAIOR que o do repositório (o piso,
 * que é o último escrito à mão, já publicado): o tablet só atualiza com nome novo. */
function injetar(app, sw, calc) {
  const nl = /\r\n/.test(app) ? '\r\n' : '\n';
  const versaoRepo = lerValor(app, RE_VERSAO), cacheRepo = lerValor(sw, RE_CACHE);
  if (!versaoRepo || !cacheRepo) throw new Error('nao achei VERSAO no app.js ou CACHE no sw.js');
  if (compararVersao(calc.versao, versaoRepo) <= 0) throw new Error('VERSAO gerada ' + calc.versao + ' nao e maior que a do repositorio ' + versaoRepo);
  if (!(numeroDoCache(calc.cache) > numeroDoCache(cacheRepo))) throw new Error('CACHE gerado ' + calc.cache + ' nao e maior que o do repositorio ' + cacheRepo);
  let a = trocarUnica(app, 'VERSAO do app.js', RE_VERSAO, '$1' + calc.versao + '$3');
  if (calc.novidades.length) {
    const recuo = (RE_NOVIDADES.exec(a) || [, ''])[1].match(/^[ \t]*/)[0];
    const texto = calc.novidades.map(e => recuo + '  { versao: ' + JSON.stringify(e.versao) + ', itens: ' + JSON.stringify(e.itens) + ' },').join(nl);
    a = trocarUnica(a, 'NOVIDADES do app.js', RE_NOVIDADES, '$1' + nl + texto);
  }
  const s = trocarUnica(sw, 'CACHE do sw.js', RE_CACHE, '$1' + calc.cache + '$3');
  return { app: a, sw: s };
}

module.exports = { ehDoSite, contaParaPublicacao, versaoDe, cacheDe, lerNovidade, historia, contar, entradasDeNovidade,
  calcular, injetar, lerValor, RE_VERSAO, RE_CACHE, NOVIDADE, GERADORES, BASE_DO_CACHE, PREFIXO_DA_VERSAO };

if (require.main === module) {
  const a = process.argv.slice(2);
  const g = gitDe(RAIZ);
  const falha = m => { process.stderr.write('versao_publicada: ' + m + '\n'); process.exit(2); };
  try {
    if (a[0] === '--arquivos-do-site') {
      g(['-c', 'core.quotePath=false', 'ls-files']).split('\n').filter(ehDoSite).forEach(f => process.stdout.write(f + '\n'));
    } else if (a[0] === '--contador') {
      process.stdout.write(calcular(g, a[1]).n + '\n');
    } else if (a[0] === '--mostrar') {
      const c = calcular(g, a[1]);
      console.log('N ' + c.n + ': VERSAO ' + c.versao + ', CACHE ' + c.cache + ', ' + c.novidades.length + ' versao(oes) com novidade gerada');
      c.novidades.forEach(e => console.log('  ' + e.versao + ': ' + e.itens.length + ' item(ns)'));
    } else if (a[0] === '--montar') {
      const pasta = a[1];
      if (!pasta) falha('uso: --montar PASTA [REV]');
      const c = calcular(g, a[2]);
      const pa = path.join(pasta, 'app.js'), ps = path.join(pasta, 'sw.js');
      const r = injetar(fs.readFileSync(pa, 'utf8'), fs.readFileSync(ps, 'utf8'), c);
      fs.writeFileSync(pa, r.app);
      fs.writeFileSync(ps, r.sw);
      console.log('publicacao N ' + c.n + ': VERSAO ' + c.versao + ', CACHE ' + c.cache + ', novidades geradas para ' +
        (c.novidades.map(e => e.versao).join(', ') || 'nenhuma versao'));
    } else {
      falha('uso: --arquivos-do-site | --contador [REV] | --mostrar [REV] | --montar PASTA [REV]');
    }
  } catch (e) {
    falha(String(e.stderr || e.message).split('\n')[0]);
  }
}
