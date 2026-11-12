/* merge_seguro.js
 *
 * O merge de um PR na main, so quando o processo foi cumprido:
 *
 *   sh _teste/merge_seguro.sh 74            confere e faz o merge
 *   sh _teste/merge_seguro.sh 74 --conferir so confere, nao faz merge
 *
 * Existe porque a protecao de branch do GitHub some quando o repositorio vira
 * privado no plano gratuito (onda 3, D1). Enquanto o repositorio e publico, a
 * protecao da main e o CI ja seguram; depois, quem segura e esta regra, usada
 * por toda sessao no lugar de `gh pr merge` direto (secao 8, item 16, das
 * instrucoes de 26/10/2026).
 *
 * Antes de tudo, inclusive no --conferir, ele confere que ELE MESMO e o da main:
 * git fetch origin main e compara este arquivo com origin/main:_teste/merge_seguro.js
 * (so o fim de linha e normalizado). Diferente, ou fetch que falha, recusa: uma
 * copia velha nao tem as guardas novas e diria "ok" onde a main recusaria.
 *
 * Exige, todas para o MESMO commit da cabeca do PR:
 *   1. PR aberto, fora de rascunho, contra a main;
 *   2. o check portao-rapido verde, e nenhum check vermelho ou em andamento
 *      (de cada nome vale a rodada mais nova: abrir e rotular o PR disparam
 *      duas, e a mais velha sai cancelada);
 *   3. o portao inteiro verde: o check portao-navegador (o juntador das oito
 *      fatias) VERDE na cabeca, e so ele. A bateria inteira roda no CI quando o
 *      PR leva o rotulo "pronto" (politica de testes por checkpoint, 09/11/2026):
 *      sem o rotulo o juntador nao roda, e check AUSENTE ou PULADO (skipped) nao
 *      e verde, entao o merge e recusado. Nao ha mais atalho por comentario
 *      "Portão inteiro ... TUDO PASSOU": rodar o portao inteiro na maquina de
 *      quem trabalha deixou de ser o caminho;
 *   4. revisao adversarial do commit da cabeca: comentario que COMECA por
 *      "Revisão adversarial", cita o sha7 da cabeca, foi postado depois do
 *      ultimo commit e TERMINA na linha "veredito: aprova", sem nenhuma linha
 *      "veredito: reprova" no corpo; e nenhuma reprova mais recente. Revisao
 *      de outro commit nao vale: ela leu outro codigo.
 *
 * Depois dessas, e antes do merge, o ramo nao pode estar atras da main: a API
 * compare do GitHub (main...<cabeca>) diz behind_by, e se for maior que zero o
 * merge e recusado ("traga a main e espere o CI"), porque dois PRs verdes,
 * testados contra mains diferentes, entrariam juntos sem o CI ver a juncao. Se
 * a API falhar, recusa tambem: nunca passa por nao conseguir conferir.
 *
 * Comentarios (de revisao) so valem de dono, membro ou
 * colaborador do repositorio (authorAssociation), porque o repositorio e
 * publico e qualquer conta pode comentar.
 *
 * Revisao e portao vao como COMENTARIO do PR (gh pr comment). O --json
 * comments nao traz as "reviews" do GitHub: revisao postada como review nunca
 * e vista por este script.
 *
 * Por ultimo, logo antes do merge, a ORDEM do CACHE (sw.js) e da VERSAO
 * (app.js): git fetch da origin/main e da cabeca do PR NA HORA, e a pergunta e
 * "o PR leva para a main algum arquivo que muda o que o tablet baixa?" (app.js,
 * sw.js ou um arquivo da lista ARQUIVOS do sw.js). Quem responde e o diff da
 * origin/main contra a arvore do MERGE (git merge-tree), e nao a base do merge:
 * depois que o ramo traz a main, a base vira a ponta da main e um ramo que subiu
 * para o MESMO valor que a main alcancou parecia "nao mudou". Se leva, CACHE e
 * VERSAO da arvore do merge tem de ser ESTRITAMENTE MAIORES que os da main
 * atual, como numero (o vNNN do cache; x.y.z da versao, campo a campo, entao
 * 1.42.10 e maior que 1.42.9). Igual reaproveita um nome ja publicado e menor o
 * rebaixa: nos dois o tablet ja instalado pode nao receber o codigo novo. Se nao
 * leva, passa. Leitura que falha, conflito com a main, CACHE fora de
 * apoio-educacional-vNNN ou constante declarada duas vezes recusam.
 * A regra pura e decidirOrdens(), e a leitura e lerOrdensGit(), as duas
 * provadas em _teste/testa_ordem_versao.js, que tambem confere o portao.
 *
 * O merge vai com --match-head-commit: se alguem empurrar um commit entre a
 * conferencia e o merge, o GitHub recusa, em vez de mergear o que ninguem
 * conferiu.
 */
'use strict';
const fs = require('fs');
const { execFileSync } = require('child_process');

const REPO = process.env.REPO_MERGE_SEGURO || 'romulorod1/apoio-educacional';
const GH = process.env.GH || 'gh';
const GIT = process.env.GIT || 'git';
const CAMPOS = 'number,state,isDraft,baseRefName,headRefOid,commits,comments,statusCheckRollup,labels';
// Ramo atrás da main só recusa PR de RISCO de dado (gravação, banco, cópia,
// restauração, nuvem, dinheiro, cache do sw.js), marcado com o rótulo `risco`.
// PR de tela, de prova e de CI entra com a bateria verde na própria cabeça,
// mesmo atrás; a main roda a bateria depois do merge (decisão de 09/11/2026).
function ehRisco(pr) {
  return (pr.labels || []).some(l => String(l && l.name).toLowerCase() === 'risco');
}

/* Decide sobre o JSON do `gh pr view --json`. Pura: devolve { ok, motivos }. */
function decidir(pr) {
  const motivos = [];
  if (!pr || typeof pr !== 'object') return { ok: false, motivos: ['nao consegui ler o PR'] };
  if (pr.state !== 'OPEN') motivos.push('o PR nao esta aberto (' + pr.state + ')');
  if (pr.isDraft) motivos.push('o PR esta em rascunho');
  if (pr.baseRefName !== 'main') motivos.push('a base do PR e ' + pr.baseRefName + ', e nao main');

  const cabeca = String(pr.headRefOid || '');
  const commits = pr.commits || [];
  const ultimo = commits[commits.length - 1];
  if (!cabeca || !ultimo) {
    motivos.push('nao achei o commit da cabeca do PR');
    return { ok: false, motivos };
  }
  if (ultimo.oid && ultimo.oid !== cabeca) motivos.push('o ultimo commit da lista nao e a cabeca do PR');
  const dataUltimo = Date.parse(ultimo.committedDate);
  if (!Number.isFinite(dataUltimo)) motivos.push('nao consegui ler a data do ultimo commit');

  // 2. checks: de cada nome, a rodada mais nova.
  //
  // O gh devolve "0001-01-01T00:00:00Z" em data nula, e Date.parse aceita.
  // Data antes de 2000 conta como sem data, e rodada sem data que nao terminou
  // (enfileirada) e a MAIS NOVA: senao a verde antiga do mesmo nome venceria a
  // rodada que ainda nem comecou.
  const valida = s => { const t = Date.parse(s || ''); return t > Date.UTC(2000, 0, 1) ? t : null; };
  const porNome = {};
  (pr.statusCheckRollup || []).forEach(c => {
    const nome = c.name || c.context || '?';
    const terminou = c.__typename === 'StatusContext' ? !/PENDING|EXPECTED/i.test(c.state || '') : c.status === 'COMPLETED';
    let quando = valida(c.startedAt) || valida(c.createdAt) || valida(c.completedAt);
    if (quando === null) quando = terminou ? 0 : Infinity;
    // Rodada PULADA nao e evidencia de nada: um evento que o workflow ignora
    // (rotulo que nao e o "pronto") deixa jobs pulados, mais novos que a rodada
    // que valeu. Para o MESMO commit, a pulada nao desbanca uma rodada que
    // terminou verde, vermelha ou em andamento; se so ha pulada, vale a pulada
    // (e ela nao e verde).
    const pulada = x => x.c.__typename !== 'StatusContext' && x.c.status === 'COMPLETED' && String(x.c.conclusion || '').toUpperCase() === 'SKIPPED';
    const novo = { quando, c };
    const atual = porNome[nome];
    if (!atual) porNome[nome] = novo;
    else if (pulada(novo) && !pulada(atual)) { /* mantem a que valeu */ }
    else if ((pulada(atual) && !pulada(novo)) || quando >= atual.quando) porNome[nome] = novo;
  });
  const estado = nome => {
    const r = porNome[nome];
    if (!r) return 'AUSENTE';
    const c = r.c;
    if (c.__typename === 'StatusContext') return String(c.state || '').toUpperCase();
    if (c.status !== 'COMPLETED') return 'EM_ANDAMENTO';
    return String(c.conclusion || '').toUpperCase();
  };
  if (estado('portao-rapido') !== 'SUCCESS') {
    motivos.push('o check portao-rapido nao esta verde (' + estado('portao-rapido') + ')');
  }
  Object.keys(porNome).forEach(nome => {
    const e = estado(nome);
    if (['SUCCESS', 'SKIPPED', 'NEUTRAL'].indexOf(e) < 0 && nome !== 'portao-rapido') {
      motivos.push('o check ' + nome + ' esta ' + e);
    }
  });

  // 3. o portao inteiro, no commit da cabeca.
  /* So vale comentario de quem tem a chave do repositorio (dono, membro ou
   * colaborador). O repositorio e publico: sem isto, qualquer conta do GitHub
   * podia comentar "Revisao adversarial ... veredito: aprova" e destravar o
   * merge. Comentario sem o campo conta como de fora. */
  const DE_CASA = ['OWNER', 'MEMBER', 'COLLABORATOR'];
  const comentarios = (pr.comments || [])
    .filter(c => DE_CASA.indexOf(String(c.authorAssociation || '').toUpperCase()) >= 0)
    .map(c => ({ corpo: String(c.body || ''), quando: Date.parse(c.createdAt) || 0 }));
  /* O sha7 e o da cabeca que ESTE script leu do GitHub (headRefOid), o mesmo
   * que vai no --match-head-commit, e nao um texto que o comentario declare.
   * Casa como palavra: "abc1234" nao vale dentro de "xabc12345". */
  const sha7 = cabeca.slice(0, 7);
  const citaCabeca = corpo => new RegExp('(^|[^0-9a-f])' + sha7 + '([^0-9a-f]|$)', 'i').test(corpo);
  const estadoInteiro = estado('portao-navegador');
  if (estadoInteiro !== 'SUCCESS') {
    motivos.push('falta o portao inteiro verde no commit ' + sha7 +
      ': o check portao-navegador esta ' + estadoInteiro +
      ' (a bateria inteira roda no CI quando o PR leva o rotulo "pronto"; ausente ou pulado nao vale)');
  }

  // 4. revisao adversarial do commit da cabeca.
  //
  // O que prova que a revisao leu ESTE commit e ela citar o sha7 dele. A data
  // fica so de reforco: committedDate e o relogio de quem commitou, e nao a
  // hora do push, entao uma revisao feita sobre o commit anterior, postada
  // depois do relogio do commit novo e antes do push dele, passaria pela data.
  //
  // O comentario COMECA por "Revisão adversarial" e TERMINA na linha do
  // veredito: a ultima linha nao vazia do corpo e "veredito: aprova" ou
  // "veredito: reprova", e nada mais. Comentario que termina em outra coisa
  // (um parecer antigo colado depois, uma citacao com ">") nao tem veredito.
  // E basta UMA linha "veredito: reprova" no comentario para ele reprovar:
  // um aprova colado embaixo de uma reprova nao a desfaz.
  const linhaVeredito = /^veredito:\s*(aprova|reprova)\s*\.?$/i;
  const vereditos = comentarios
    .filter(c => c.quando > dataUltimo && /^\s*Revis[aã]o adversarial/i.test(c.corpo) && citaCabeca(c.corpo))
    .map(c => {
      const linhas = c.corpo.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const ultima = linhas[linhas.length - 1] || '';
      if (!linhaVeredito.test(ultima)) return null;
      const reprova = linhas.some(l => linhaVeredito.test(l) && /reprova/i.test(l));
      return { quando: c.quando, v: reprova ? 'reprova' : 'aprova' };
    })
    .filter(Boolean)
    .sort((a, b) => a.quando - b.quando);
  if (!vereditos.length) {
    motivos.push('falta revisao adversarial do commit ' + sha7 +
      ' (comentario que cite ' + sha7 + ' e diga "veredito: aprova", depois do ultimo commit)');
  } else if (vereditos[vereditos.length - 1].v !== 'aprova') {
    motivos.push('a revisao adversarial mais recente reprova');
  }

  return { ok: motivos.length === 0, motivos, cabeca };
}

/* A ORDEM DO CACHE E DA VERSAO. Puras: sem git e sem gh.
 *
 * Ate 12/11/2026 a unica trava era a do confere_tudo.sh, e ela so exigia que o
 * CACHE fosse DIFERENTE do da base do merge. Com PRs em paralelo, um ramo com
 * v130 integrado depois de a main estar em v134 passava verde, e a VERSAO nao
 * tinha trava nenhuma. Aqui a exigencia e ser MAIOR que a da main ATUAL. */
/* Le UMA declaracao real da constante. Duas declaracoes (var, let ou const no
 * comeco da linha) devolvem null: ler a primeira e confiar seria conferir um
 * valor que talvez nao seja o que o navegador usa. Comentario nao conta. */
function lerConstante(texto, nome, padrao) {
  const t = String(texto == null ? '' : texto).replace(/\r/g, '');
  const declaracoes = t.match(new RegExp('^[ \\t]*(var|let|const)[ \\t]+' + nome + '[ \\t]*=', 'gm')) || [];
  if (declaracoes.length !== 1) return null;
  const m = padrao.exec(t);
  return m ? m[1] : null;
}
function lerCache(sw) { return lerConstante(sw, 'CACHE', /^var CACHE = '([^']*)';/m); }
function lerVersao(app) { return lerConstante(app, 'VERSAO', /^ *var VERSAO = '([^']*)';/m); }
/* A lista ARQUIVOS do sw.js, como caminhos do repositorio ('./' e a raiz e sai). */
function listaArquivos(sw) {
  const linhas = String(sw == null ? '' : sw).replace(/\r/g, '').split('\n');
  const ini = linhas.findIndex(l => /^var ARQUIVOS = \[/.test(l));
  if (ini < 0) return [];
  const fora = [];
  for (let i = ini + 1; i < linhas.length && !/^\];/.test(linhas[i]); i++) {
    const m = /^ *'(?:\.\/)?([^']*)' *,? *$/.exec(linhas[i]);
    if (m && m[1]) fora.push(m[1]);
  }
  return fora;
}
/* O numero do nome do cache. Os DOIS lados tem de casar o padrao que o sw.js
 * reconhece (VERSAO_DO_APP = /^apoio-educacional-v\d+$/): fora dele o activate
 * nao ve o cache novo como versao do app. */
const NOME_DO_CACHE = /^apoio-educacional-v([0-9]+)$/;
function compararCache(a, b) {
  const x = NOME_DO_CACHE.exec(String(a || '')), y = NOME_DO_CACHE.exec(String(b || ''));
  if (!x || !y) return null;
  return Number(x[1]) - Number(y[1]);
}
/* x.y.z campo a campo, como numero: '1.42.10' > '1.42.9'. Formato fora de x.y.z da null. */
function compararSemver(a, b) {
  const pa = /^([0-9]+)\.([0-9]+)\.([0-9]+)$/.exec(String(a || ''));
  const pb = /^([0-9]+)\.([0-9]+)\.([0-9]+)$/.exec(String(b || ''));
  if (!pa || !pb) return null;
  for (let i = 1; i <= 3; i++) {
    const d = Number(pa[i]) - Number(pb[i]);
    if (d !== 0) return d;
  }
  return 0;
}
/* Uma constante: o valor da arvore do merge (agora), o da main atual e os
 * arquivos do app que o PR leva para a main. Devolve { ok, motivo }. */
function decidirOrdem(nome, agora, main, levados, comparar) {
  if (agora == null || main == null) {
    return { ok: false, motivo: 'nao consegui ler ' + nome + ' (merge:[' + agora + '] main:[' + main + ']): ' +
      'falta a declaracao, ou ha mais de uma' };
  }
  const c = comparar(agora, main);
  if (c === null) return { ok: false, motivo: nome + ' fora do formato: merge ' + agora + ', main ' + main };
  if (!levados || !levados.length) {
    return { ok: true, motivo: nome + ' ' + agora + ': o PR nao leva arquivo do app para a main' };
  }
  const quais = ' (leva ' + levados.slice(0, 3).join(', ') + (levados.length > 3 ? ' e mais ' + (levados.length - 3) : '') + ')';
  if (c > 0) return { ok: true, motivo: nome + ' ' + agora + ' e maior que o da main atual, ' + main + quais };
  return { ok: false, motivo: nome + ' ' + agora + ' do PR nao e MAIOR que o da main atual, ' + main +
    (c === 0 ? ' (igual: reaproveita o que ja foi publicado)' : ' (menor: rebaixa o que ja foi publicado)') +
    quais + '; suba para a proxima livre' };
}
/* v = { levados: [arquivos do app que mudam], cache: { agora, main }, versao: { agora, main } } */
function decidirOrdens(v) {
  const r = [
    decidirOrdem('CACHE', v.cache.agora, v.cache.main, v.levados, compararCache),
    decidirOrdem('VERSAO', v.versao.agora, v.versao.main, v.levados, compararSemver)
  ];
  return { ok: r.every(x => x.ok), motivos: r.map(x => x.motivo), recusas: r.filter(x => !x.ok).map(x => x.motivo) };
}

/* O que o PR LEVA para a main, lido do git. g(args) devolve a saida ou lanca.
 * A arvore do merge sai do `git merge-tree --write-tree main alvo`, que e o que
 * a main fica depois do merge; o diff dela contra a main e o que o PR leva, sem
 * contar o que a main andou enquanto o ramo ficou atras. Conflito (merge-tree
 * sai 1) lanca. Arquivo do app: app.js, sw.js e a lista ARQUIVOS do sw.js da
 * main e da arvore do merge. */
function lerOrdensGit(g, alvo, main) {
  let arvore;
  try {
    arvore = g(['merge-tree', '--write-tree', main, alvo]).split('\n')[0].trim();
  } catch (e) {
    const err = new Error('o PR tem conflito com a main ou o merge-tree falhou: ' + String(e.stderr || e.message).split('\n')[0]);
    err.stderr = err.message;
    throw err;
  }
  if (!/^[0-9a-f]{40,64}$/.test(arvore)) throw new Error('o merge-tree nao devolveu uma arvore: [' + arvore + ']');
  const mudados = g(['diff', '--name-only', '-z', main, arvore]).split('\0').filter(Boolean);
  const swMerge = g(['show', arvore + ':sw.js']), swMain = g(['show', main + ':sw.js']);
  const app = new Set(['app.js', 'sw.js'].concat(listaArquivos(swMerge), listaArquivos(swMain)));
  return {
    levados: mudados.filter(f => app.has(f)),
    cache: { agora: lerCache(swMerge), main: lerCache(swMain) },
    versao: { agora: lerVersao(g(['show', arvore + ':app.js'])), main: lerVersao(g(['show', main + ':app.js'])) }
  };
}

/* No merge: busca a origin/main e a cabeca do PR AGORA, e le o que ele leva. */
function lerOrdens(numero, cabeca) {
  git(['fetch', 'origin', 'main', 'refs/pull/' + numero + '/head']);
  return lerOrdensGit(git, cabeca, 'origin/main');
}

/* Quantos commits a cabeca esta atras da main. Lanca se nao conseguir medir. */
function commitsAtras(cabeca) {
  const saida = gh(['api', 'repos/' + REPO + '/compare/main...' + cabeca]);
  const n = JSON.parse(saida).behind_by;
  if (!Number.isInteger(n) || n < 0) throw new Error('a resposta nao traz behind_by');
  return n;
}

/* GH terminado em .js roda pelo node: e a costura da prova, que troca o gh
 * por um falso de caminho absoluto, sem PATH sombreado e sem rede. */
function gh(args) {
  const [bin, pre] = /\.js$/.test(GH) ? [process.execPath, [GH]] : [GH, []];
  return execFileSync(bin, pre.concat(args), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

/* Mesma costura do gh: GIT terminado em .js roda pelo node (git falso da prova). */
function git(args) {
  const [bin, pre] = /\.js$/.test(GIT) ? [process.execPath, [GIT]] : [GIT, []];
  return execFileSync(bin, pre.concat(args), { encoding: 'utf8', cwd: __dirname, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 });
}

/* Devolve null se este arquivo e o da main; senao, a frase da recusa. */
function conferirVersao() {
  try {
    git(['fetch', 'origin', 'main']);
    const main = git(['show', 'origin/main:_teste/merge_seguro.js']);
    const eu = fs.readFileSync(__filename, 'utf8');
    if (main.replace(/\r\n/g, '\n') !== eu.replace(/\r\n/g, '\n')) {
      return 'este merge_seguro não é o da main atualizada: rode-o de uma pasta com a main em dia (git pull) e tente de novo';
    }
    return null;
  } catch (e) {
    return 'não consegui conferir se este merge_seguro é o da main: ' + String(e.stderr || e.message).split('\n')[0];
  }
}

function principal(argv) {
  const numero = argv[0];
  const soConferir = argv.indexOf('--conferir') >= 0;
  const velho = conferirVersao();
  if (velho) {
    console.log('RECUSADO  ' + velho);
    return 1;
  }
  if (!/^[0-9]+$/.test(numero || '')) {
    console.log('uso: sh _teste/merge_seguro.sh <numero do PR> [--conferir]');
    return 2;
  }
  let pr;
  try {
    pr = JSON.parse(gh(['pr', 'view', numero, '-R', REPO, '--json', CAMPOS]));
  } catch (e) {
    console.log('RECUSADO  nao consegui ler o PR #' + numero + ': ' + String(e.message).split('\n')[0]);
    return 1;
  }
  const r = decidir(pr);
  if (!r.ok) {
    console.log('RECUSADO  PR #' + numero + ':');
    r.motivos.forEach(m => console.log('  - ' + m));
    return 1;
  }
  // BEHIND-INICIO
  if (!ehRisco(pr)) {
    console.log('aviso     PR #' + numero + ' sem o rótulo risco: não confiro se está atrás da main');
  } else try {
    const atras = commitsAtras(r.cabeca);
    if (atras > 0) {
      console.log('RECUSADO  PR #' + numero + ':');
      console.log('  - o ramo está ' + atras + ' commits atrás da main: traga a main e espere o CI');
      return 1;
    }
  } catch (e) {
    console.log('RECUSADO  nao consegui conferir se o ramo esta atras da main: ' + String(e.stderr || e.message).split('\n')[0]);
    return 1;
  }
  // BEHIND-FIM
  // ORDEM-INICIO
  let ordem;
  try {
    ordem = decidirOrdens(lerOrdens(numero, r.cabeca));
  } catch (e) {
    console.log('RECUSADO  nao consegui conferir CACHE e VERSAO contra a origin/main: ' + String(e.stderr || e.message).split('\n')[0]);
    return 1;
  }
  if (!ordem.ok) {
    console.log('RECUSADO  PR #' + numero + ':');
    ordem.recusas.forEach(m => console.log('  - ' + m));
    return 1;
  }
  ordem.motivos.forEach(m => console.log('ordem     ' + m));
  // ORDEM-FIM
  console.log('ok        PR #' + numero + ' cumpre o processo no commit ' + r.cabeca.slice(0, 7));
  if (soConferir) return 0;
  try {
    process.stdout.write(gh(['pr', 'merge', numero, '-R', REPO, '--merge', '--match-head-commit', r.cabeca]));
  } catch (e) {
    console.log('RECUSADO  o GitHub recusou o merge: ' + String(e.stderr || e.message).split('\n')[0]);
    return 1;
  }
  console.log('mergeado  agora confira o ar: workflow conferencia-no-ar, ou sh _teste/confere_no_ar.sh');
  return 0;
}

if (require.main === module) process.exit(principal(process.argv.slice(2)));
module.exports = { decidir, principal, decidirOrdem, decidirOrdens, lerOrdensGit, listaArquivos, compararCache, compararSemver, lerCache, lerVersao };
