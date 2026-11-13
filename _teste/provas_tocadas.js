/* provas_tocadas.js
 *
 * O nivel 1 da politica de testes por checkpoint (09/11/2026): dado o conjunto
 * de arquivos tocados por um PR, quais provas de NAVEGADOR rodam. O mapa e
 * _teste/mapa_provas.tsv (formato e ordem de decisao no cabecalho dele) somado
 * aos arquivos de _teste/mapa_provas.d/, um por prova nova (leMapaPasta, regras
 * no cabecalho do tsv). A pasta so ACRESCENTA provas a arquivos que o mapa geral
 * ja decide: quem tira um arquivo da bateria inteira (item 3) e so o mapa geral.
 *
 *   node _teste/provas_tocadas.js --plano [arquivos...]
 *       so o plano: quantas fatias o nivel 1 abre (fatias=N e matriz=[1..N]
 *       no $GITHUB_OUTPUT; N=0 quando nao ha prova de navegador a rodar).
 *   node _teste/provas_tocadas.js --fatia K/N --saida ARQ --nomes ARQ2 [arquivos...]
 *       os arquivos tocados vem dos argumentos, ou da entrada padrao (um por
 *       linha, como sai do `git diff --name-only`). Escreve em ARQ, uma por
 *       linha, os ARQUIVOS de prova que tem nome na fatia K de N, e em ARQ2 os
 *       NOMES da selecao inteira (o que o divide_portao.js le em
 *       PORTAO_SELECAO para dividir so eles em N fatias, as mesmas daqui).
 *       Imprime o motivo de cada uma. Se $GITHUB_OUTPUT existir, grava nele:
 *         modo=nenhuma|lista|inteira   (da selecao inteira, nao so da fatia)
 *         quantas=N                    (nomes de prova desta fatia)
 *         fatias=N                     (o plano: quantas fatias a selecao pede)
 *         nuvem=sim|nao                (alguma prova desta fatia usa o emulador)
 *
 * Regras de QUAIS ARQUIVOS (conservadoras; na duvida, mais, nunca menos):
 *   1. arquivo que e uma prova de navegador: ela mesma;
 *   2. casa linhas do mapa: a uniao; "-" nao pede prova de navegador;
 *      "*" pede a bateria inteira;
 *   3. nao casa nada no mapa: a bateria inteira.
 *   Excecao do item 2: o _teste/confere_tudo.sh e "*" no mapa, mas quase todo
 *   PR de tela so ACRESCENTA linhas `roda` (venenos novos) e comentarios. Quando
 *   o diff dele (origin/main...HEAD, ou --base REF) e so isso, rodam as provas
 *   de navegador com linha `roda` nova, com todos os nomes; qualquer outra
 *   linha mudada e a maquinaria do portao, e leva a bateria inteira (rodaDoDiff).
 *
 * Regra de QUAIS NOMES de cada arquivo (12/11/2026, "Venenos: só os da regra
 * que o PR cria ou muda", POLITICA_TESTES): o arquivo de prova tem varios nomes
 * no portao, a prova e as variantes "--envenenado-...", que conferem que a
 * PROVA pega o defeito. No nivel 1:
 *   - prova tocada pelo PR (regra 1): todos os nomes dela, venenos inclusive,
 *     porque a prova mudou e e a sensibilidade dela que esta em jogo;
 *   - prova que entrou pelo mapa (regra 2): so os nomes sem "--envenenado"; os
 *     cenarios que nao sao veneno (atualizacao --migracao etc.) rodam todos;
 *   - bateria inteira (regra 2 com "*", regra 3): todos os nomes, como antes.
 * A bateria do rotulo "pronto" roda todos os nomes, sempre; isto so muda o
 * nivel 1. Os venenos eram 77% do tempo da bateria (117 de 152 min na tabela
 * de 09/11) e o nivel 1 os rodava em todo push.
 *
 * Quantas fatias: o tempo previsto da selecao (tempos_do_portao.tsv) dividido
 * por ALVO_POR_FATIA, arredondado para cima, de 1 a 8 e nunca mais fatias que
 * nomes. Prova sozinha mais demorada que o alvo nao parte: a fatia dela demora
 * o que a prova demora.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const MAPA = path.join(__dirname, 'mapa_provas.tsv');
const PASTA = path.join(__dirname, 'mapa_provas.d');
const PORTAO = path.join(__dirname, 'confere_tudo.sh');
const ALVO_POR_FATIA = 5 * 60;   // segundos de prova por fatia do nivel 1 (5 min: relogio de uns 7 min com o preparo)
const MAX_FATIAS = 8;
const VENENO = /--envenenado/;

function leMapa(texto) {
  const linhas = [];
  String(texto).split(/\r?\n/).forEach((l, i) => {
    if (!l.trim() || l[0] === '#') return;
    const t = l.indexOf('\t');
    if (t < 1) throw new Error('mapa_provas: linha ' + (i + 1) + ' sem tabulacao: "' + l + '"');
    const padrao = l.slice(0, t).trim();
    const provas = l.slice(t + 1).trim().split(/\s+/).filter(Boolean);
    if (!padrao || !provas.length) throw new Error('mapa_provas: linha ' + (i + 1) + ' sem padrao ou sem provas');
    if ((provas.indexOf('-') >= 0 || provas.indexOf('*') >= 0) && provas.length > 1) {
      throw new Error('mapa_provas: linha ' + (i + 1) + ': "-" e "*" valem sozinhos');
    }
    const re = new RegExp('^' + padrao.split('*').map(x => x.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
    linhas.push({ padrao, re, provas });
  });
  return linhas;
}

/* Os arquivos de _teste/mapa_provas.d/ (13/11/2026): um por prova, para que o PR
 * que cria uma prova nova so ACRESCENTE um arquivo e nao edite a linha do
 * app.js, do index.html etc. no mapa geral, que todo PR aberto disputava.
 * Cada arquivo <nome>.tsv tem o mesmo formato do mapa geral (padrao<TAB>prova),
 * com estas regras a mais, e qualquer desvio grita (nunca pula calado):
 *   - so arquivos .tsv na pasta (outro arquivo e erro, nao enfeite ignorado);
 *   - ao menos uma linha, e UMA prova so por linha, a mesma em todas;
 *   - o nome do arquivo e o da prova sem a extensao: _teste/testa_x.js fica em
 *     testa_x.tsv (dois PRs com provas diferentes nunca tocam o mesmo arquivo);
 *   - nada de "-" nem "*": esses sao decisoes gerais e moram no mapa geral;
 *   - o padrao fixa uma pasta antes do primeiro "*" (biblioteca/* vale; *.js,
 *     app* e * sozinho nao), para uma linha da pasta nao puxar a prova em todo PR.
 * Que a prova e de navegador (esta no --listar) se confere contra o portao em
 * confereMapa, a mesma regra que vale para o mapa geral.
 * Pasta que nao existe: nenhuma linha (o mecanismo existe antes da 1a prova). */
function leMapaPasta(pasta) {
  const dir = pasta || PASTA;
  if (!fs.existsSync(dir)) return [];
  const linhas = [];
  fs.readdirSync(dir).sort().forEach(nome => {
    const onde = 'mapa_provas.d/' + nome;
    const cheio = path.join(dir, nome);
    if (!/\.tsv$/.test(nome) || !fs.statSync(cheio).isFile()) throw new Error(onde + ': so arquivos .tsv na pasta do mapa');
    let deste;
    try { deste = leMapa(fs.readFileSync(cheio, 'utf8')); } catch (e) { throw new Error(onde + ': ' + e.message); }
    if (!deste.length) throw new Error(onde + ': nenhuma linha (arquivo vazio ou so comentario)');
    const prova = deste[0].provas[0];
    deste.forEach(l => {
      if (l.provas.length !== 1) throw new Error(onde + ': uma prova so por linha ("' + l.padrao + '" tem ' + l.provas.length + ')');
      if (l.provas[0] === '-' || l.provas[0] === '*') throw new Error(onde + ': "-" e "*" moram no mapa geral, nao na pasta ("' + l.padrao + '")');
      if (l.provas[0] !== prova) throw new Error(onde + ': o arquivo e de uma prova so (' + prova + ' e ' + l.provas[0] + ')');
      const ate = l.padrao.indexOf('*');
      if (ate >= 0 && l.padrao.slice(0, ate).indexOf('/') < 0) throw new Error(onde + ': o padrao "' + l.padrao + '" tem de fixar uma pasta antes do primeiro "*"');
      l.origem = 'pasta';
      l.arquivo = onde;
    });
    const esperado = path.posix.basename(prova).replace(/\.[^.]+$/, '') + '.tsv';
    if (nome !== esperado) throw new Error(onde + ': o nome do arquivo tem de ser o da prova (' + prova + ' fica em ' + esperado + ')');
    deste.forEach(l => linhas.push(l));
  });
  return linhas;
}

/* O mapa que vale: o geral somado ao da pasta. Cada linha leva origem
 * 'geral' ou 'pasta'. */
function leMapaTodo(arquivo, pasta) {
  const geral = leMapa(fs.readFileSync(arquivo || MAPA, 'utf8'));
  geral.forEach(l => { l.origem = 'geral'; });
  return geral.concat(leMapaPasta(pasta));
}

/* Toda prova que o mapa cita (geral e pasta) e de navegador: esta no --listar.
 * Grita com a lista das que nao sao. Antes so gritava quando a linha casava um
 * arquivo tocado; agora o CLI confere o mapa inteiro antes de decidir. */
function confereMapa(mapa, navegador) {
  const fora = [];
  mapa.forEach(l => l.provas.forEach(p => {
    if (p !== '-' && p !== '*' && navegador.arquivos.indexOf(p) < 0) fora.push((l.arquivo || 'mapa_provas.tsv') + ': ' + p);
  }));
  if (fora.length) throw new Error('o mapa cita prova que o portao nao tem (nao e prova de navegador): ' + fora.join('; '));
}

/* navegador: { arquivos: [caminho...], nomes: { caminho: [nome...] }, ordem: [nome...] } (do --listar). */
function listaDoPortao() {
  const saida = execFileSync('sh', [PORTAO, '--listar'], { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const arquivos = [], nomes = {}, ordem = [];
  saida.split(/\r?\n/).forEach(l => {
    let m = /^ {2}vai {5}(\d+) (.*)$/.exec(l);
    if (m) { ordem.push(m[2]); return; }
    m = /^ {2}arq {5}(\d+) (.*)$/.exec(l);
    if (m) {
      const nome = ordem[Number(m[1]) - 1] || ordem[ordem.length - 1];
      if (arquivos.indexOf(m[2]) < 0) arquivos.push(m[2]);
      (nomes[m[2]] = nomes[m[2]] || []).push(nome);
    }
  });
  return { arquivos, nomes, ordem };
}

const norm = f => String(f).trim().replace(/\\/g, '/').replace(/^\.\//, '');

/* Pura. O diff do confere_tudo.sh so acrescenta, tira ou muda linhas `roda` e
 * comentarios? Devolve { ok: true, arquivos: [...] } com o arquivo de prova de
 * cada linha `roda` acrescentada (ou mudada, pelo lado "+"), ou { ok: false,
 * linha } com a primeira linha que mexe em outra coisa (a maquinaria do portao:
 * a bateria inteira, como antes). Rigoroso: a linha `roda` tem de ser a forma
 * exata das linhas do portao (nome entre aspas, interpretador, arquivo, opcoes
 * --x), sem nada sobrando e sem variavel; qualquer outra coisa e maquinaria,
 * inclusive a lista do laco `for t in ...` das provas com navegador. */
const RODA = /^roda\s+"[^"]*"\s+(?:node|python3?|sh)\s+"?([^"\s]+)"?(?:\s+--[A-Za-z0-9_=.-]+)*$/;
function rodaDoDiff(diff) {
  if (typeof diff !== 'string') return { ok: false, linha: '(o diff do confere_tudo.sh nao foi lido)' };
  const arquivos = [];
  const mais = [], menos = [];
  let mudancas = 0;
  // O cabecalho ("diff --git", "index", "--- a/...", "+++ b/...") so existe
  // ANTES do primeiro "@@" de cada arquivo. Depois dele, toda linha com + ou -
  // e conteudo, inclusive a linha tirada que comeca com "-- " (vira "--- ").
  let noCorpo = false;
  for (const l of diff.split(/\r?\n/)) {
    if (/^diff --git /.test(l)) { noCorpo = false; continue; }
    if (/^@@/.test(l)) { noCorpo = true; continue; }
    if (!noCorpo || !/^[+-]/.test(l)) continue;
    const corpo = l.slice(1).trim();
    mudancas++;
    if (!corpo || corpo[0] === '#') continue;
    // com variavel ($t no laco do "com navegador") a linha vale por varias
    // provas que o diff nao diz: maquinaria
    const m = corpo.indexOf('$') < 0 ? RODA.exec(corpo) : null;
    if (!m) return { ok: false, linha: corpo };
    (l[0] === '+' ? mais : menos).push(corpo.replace(/\s+/g, ' '));
    if (l[0] === '+' && arquivos.indexOf(m[1]) < 0) arquivos.push(m[1]);
  }
  if (!mudancas) return { ok: false, linha: '(diff vazio: tocado sem mudanca que eu veja)' };
  // linha roda tirada que nao volta (mudada) do lado "+": prova que saiu do portao
  const nomeDe = c => (/^roda\s+"([^"]*)"/.exec(c) || [])[1];
  const nomesMais = new Set(mais.map(nomeDe));
  const removidas = menos.map(nomeDe).filter(n => !nomesMais.has(n));
  return { ok: true, arquivos, removidas };
}

const PORTAO_REL = '_teste/confere_tudo.sh';

/* Pura. Devolve { modo: 'nenhuma'|'lista'|'inteira', provas: [...], diretas: [...], motivos: [...] }.
 * diretas: as provas que rodam com todos os nomes (tocadas, ou com linha `roda`
 * nova no confere_tudo.sh). diffs: { caminho: texto do diff }, hoje so o do
 * confere_tudo.sh; sem ele, o confere_tudo.sh tocado pede a bateria inteira. */
function provasTocadas(tocados, mapa, navegador, diffs) {
  const todas = navegador.arquivos;
  const uniao = new Set();
  const diretas = new Set();
  const motivos = [];
  let inteira = false;
  tocados.map(norm).filter(Boolean).forEach(f => {
    if (todas.indexOf(f) >= 0) { uniao.add(f); diretas.add(f); motivos.push(f + ': e prova de navegador, roda ela mesma'); return; }
    if (f === PORTAO_REL && diffs && Object.prototype.hasOwnProperty.call(diffs, f)) {
      const d = rodaDoDiff(diffs[f]);
      if (d.ok) {
        const nav = d.arquivos.filter(p => todas.indexOf(p) >= 0);
        nav.forEach(p => { uniao.add(p); diretas.add(p); });
        motivos.push(f + ': so linhas roda e comentarios; ' + nav.length + ' provas de navegador com linha nova rodam com todos os nomes' +
          (nav.length ? ' (' + nav.join(' ') + ')' : '') + (d.arquivos.length > nav.length ? '; as outras ficam com o portao-rapido' : '') +
          (d.removidas.length ? '; ATENCAO: ' + d.removidas.length + ' prova(s) SAIU(RAM) do portao, confira na revisao: ' + d.removidas.join(' | ') : ''));
        return;
      }
      motivos.push(f + ': mexe na maquinaria do portao ("' + d.linha.slice(0, 80) + '"), bateria inteira');
      inteira = true;
      return;
    }
    const casadas = mapa.filter(l => l.re.test(f));
    // item 3 pelo mapa GERAL: linha da pasta so acrescenta prova, nunca tira da bateria inteira
    if (!casadas.some(l => l.origem !== 'pasta')) {
      inteira = true;
      motivos.push(f + ': nao esta no mapa' + (casadas.length ? ' geral (a pasta mapa_provas.d so acrescenta)' : '') + ', bateria inteira');
      return;
    }
    casadas.forEach(l => {
      if (l.provas[0] === '*') { inteira = true; motivos.push(f + ': ' + l.padrao + ' pede a bateria inteira'); }
      else if (l.provas[0] === '-') motivos.push(f + ': ' + l.padrao + ' sem prova de navegador (o portao-rapido cobre)');
      else { l.provas.forEach(p => uniao.add(p)); motivos.push(f + ': ' + l.provas.length + ' provas pelo mapa (' + l.padrao + (l.arquivo ? ', ' + l.arquivo : '') + ')'); }
    });
  });
  if (inteira) return { modo: 'inteira', provas: todas.slice(), diretas: [...diretas], motivos };
  const provas = todas.filter(p => uniao.has(p));
  // prova do mapa que o portao nao tem: erro do mapa, nao pulo calado
  uniao.forEach(p => { if (todas.indexOf(p) < 0) throw new Error('o mapa cita uma prova que o portao nao tem: ' + p); });
  return { modo: provas.length ? 'lista' : 'nenhuma', provas, diretas: [...diretas], motivos };
}

/* Pura. Os NOMES do portao que o nivel 1 roda, na ordem do portao (regra no
 * cabecalho). r e o resultado de provasTocadas. */
function nomesDaSelecao(r, tocados, navegador) {
  const diretas = new Set((r.diretas || []).concat(tocados.map(norm).filter(f => navegador.arquivos.indexOf(f) >= 0)));
  const quero = new Set();
  r.provas.forEach(p => {
    const nomes = navegador.nomes[p] || [];
    if (!nomes.length) throw new Error('prova sem nome no portao: ' + p);
    const tudo = r.modo === 'inteira' || diretas.has(p);
    const base = nomes.filter(n => !VENENO.test(n));
    // arquivo so de venenos (nao ha hoje): roda tudo, nunca fica sem nome
    (tudo || !base.length ? nomes : base).forEach(n => quero.add(n));
  });
  return navegador.ordem.filter(n => quero.has(n));
}

/* Pura. Quantas fatias o nivel 1 abre para estes nomes. */
function fatiasDoPlano(nomes, tempos, mediana) {
  if (!nomes.length) return 0;
  const seg = nomes.reduce((s, n) => s + (Object.prototype.hasOwnProperty.call(tempos, n) ? tempos[n] : mediana), 0);
  return Math.max(1, Math.min(MAX_FATIAS, nomes.length, Math.ceil(seg / ALVO_POR_FATIA)));
}

/* Os nomes e os arquivos da selecao que caem na fatia K de N, pelo mesmo divisor
 * que o `confere_tudo.sh --pedaco K/N` usa quando PORTAO_SELECAO aponta para a
 * lista de nomes (divide_portao.js). Sem nomes, divide o portao inteiro (como antes). */
function daFatia(provas, navegador, k, n, nomesSel) {
  const { divide, leTempos, nomesDoPortao } = require('./divide_portao.js');
  const minhas = new Set(divide(nomesSel || nomesDoPortao(), leTempos(), n).fatias[k - 1]);
  const arquivos = provas.filter(p => (navegador.nomes[p] || []).some(nm => minhas.has(nm)));
  return nomesSel ? { arquivos, nomes: [...minhas] } : arquivos;
}

module.exports = { leMapa, leMapaPasta, leMapaTodo, confereMapa, PASTA, listaDoPortao, provasTocadas, rodaDoDiff, nomesDaSelecao, fatiasDoPlano, daFatia, MAPA, ALVO_POR_FATIA, MAX_FATIAS };

if (require.main === module) {
  const a = process.argv.slice(2);
  let fatia = null, saida = null, saidaNomes = null, plano = false, base = 'origin/main';
  const arquivos = [];
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--fatia') fatia = a[++i];
    else if (a[i] === '--base') base = a[++i];
    else if (a[i] === '--saida') saida = a[++i];
    else if (a[i] === '--nomes') saidaNomes = a[++i];
    else if (a[i] === '--plano') plano = true;
    else arquivos.push(a[i]);
  }
  const grava = txt => { if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, txt); };
  const tocados = arquivos.length ? arquivos : fs.readFileSync(0, 'utf8').split(/\r?\n/);
  const nav = listaDoPortao();
  // o diff do confere_tudo.sh, quando ele foi tocado: o mesmo origin/main...HEAD
  // de onde saiu a lista de tocados. Falhou a leitura: sem diff, bateria inteira.
  const diffs = {};
  if (tocados.map(norm).indexOf(PORTAO_REL) >= 0) {
    try {
      diffs[PORTAO_REL] = execFileSync('git', ['diff', base + '...HEAD', '--', PORTAO_REL], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { console.log('  nao consegui ler o diff do ' + PORTAO_REL + ' contra ' + base + ': ' + String(e.message).split('\n')[0]); }
  }
  // MAPA_PROVAS_PASTA_TESTE: so o testa_provas_tocadas a usa, para provar que o
  // CLI le a pasta (o CI nao a define; sem ela vale _teste/mapa_provas.d)
  const mapa = leMapaTodo(null, process.env.MAPA_PROVAS_PASTA_TESTE || null);
  confereMapa(mapa, nav);
  const r = provasTocadas(tocados, mapa, nav, diffs);
  r.motivos.forEach(m => console.log('  ' + m));
  const nomes = nomesDaSelecao(r, tocados, nav);
  const { leTempos, mediana } = require('./divide_portao.js');
  const tempos = leTempos();
  const n = fatiasDoPlano(nomes, tempos, mediana(Object.keys(tempos).map(k => tempos[k])));
  const venenosFora = r.provas.reduce((s, p) => s + (nav.nomes[p] || []).length, 0) - nomes.length;
  console.log('modo: ' + r.modo + '; ' + r.provas.length + ' de ' + nav.arquivos.length + ' arquivos de prova, ' + nomes.length +
    ' nomes (' + venenosFora + ' venenos de prova nao tocada ficam para a bateria do rotulo pronto); fatias: ' + n);
  if (plano) {
    grava('modo=' + r.modo + '\nfatias=' + n + '\nmatriz=' + JSON.stringify(Array.from({ length: n }, (_, i) => i + 1)) + '\n');
    process.exit(0);
  }
  if (!fatia) {
    if (saida) fs.writeFileSync(saida, r.provas.join('\n') + (r.provas.length ? '\n' : ''));
    process.exit(0);
  }
  const m = /^(\d+)\/(\d+)$/.exec(fatia);
  if (!m || +m[1] < 1 || +m[1] > +m[2]) { console.error('uso: --fatia K/N, K de 1 a N'); process.exit(2); }
  // a fatia pedida tem de ser a do plano: se a selecao mudou entre o plano e a
  // fatia, a matriz do CI nao bate com a divisao, e isso e falha, nao pulo calado
  if (+m[2] !== n) { console.error('a fatia pedida e de ' + m[2] + ', mas a selecao pede ' + n + ' fatias'); process.exit(2); }
  const d = daFatia(r.provas, nav, +m[1], +m[2], nomes);
  console.log('fatia ' + fatia + ': ' + d.nomes.length + ' nomes de prova, ' + d.arquivos.length + ' arquivos');
  d.nomes.forEach(nm => console.log('    ' + nm));
  if (saida) fs.writeFileSync(saida, d.arquivos.join('\n') + (d.arquivos.length ? '\n' : ''));
  if (saidaNomes) fs.writeFileSync(saidaNomes, nomes.join('\n') + (nomes.length ? '\n' : ''));
  const nuvem = d.arquivos.some(p => /FIREBASE_TOOLS/.test(fs.readFileSync(path.join(RAIZ, p), 'utf8')));
  grava('modo=' + r.modo + '\nquantas=' + d.nomes.length + '\nfatias=' + n + '\nnuvem=' + (nuvem ? 'sim' : 'nao') + '\n');
}
