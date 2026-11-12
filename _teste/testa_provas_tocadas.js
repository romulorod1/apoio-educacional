/* testa_provas_tocadas.js
 *
 * Prova, sem navegador, a logica do nivel 1 do CI (provas_tocadas.js e
 * mapa_provas.tsv): dado o conjunto de arquivos tocados, quais provas de
 * navegador rodam. O que se garante:
 *   - todo arquivo rastreado tem prova, esta no mapa com "-" de proposito, ou
 *     cai na bateria inteira (nunca fica sem decisao);
 *   - nenhuma prova da lista some: cada uma, tocada, roda ela mesma, e todos os
 *     arquivos juntos pedem a bateria inteira;
 *   - as ligacoes do mapa apontam para provas que o portao tem;
 *   - as fatias do nivel 1 particionam a selecao (nenhuma prova em duas, nenhuma
 *     perdida);
 * e os controles que reprovam (arquivo fora do mapa, linha apagada, prova que
 * nao existe).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const PORTAO_REL_T = '_teste/confere_tudo.sh';
const { leMapa, listaDoPortao, provasTocadas, rodaDoDiff, nomesDaSelecao, fatiasDoPlano, daFatia, MAPA, ALVO_POR_FATIA } = require('./provas_tocadas.js');

let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
const RAIZ = path.join(__dirname, '..');

console.log('\n=== 1. O instrumento ve ===');
const nav = listaDoPortao();
conf('o portao lista mais de 50 arquivos de prova de navegador', nav.arquivos.length > 50, true);
conf('e todos existem em disco', nav.arquivos.filter(a => !fs.existsSync(path.join(RAIZ, a))).length, 0);
const mapa = leMapa(fs.readFileSync(MAPA, 'utf8'));
conf('o mapa tem linhas', mapa.length > 20, true);
const rastreados = execFileSync('git', ['ls-files'], { cwd: RAIZ, encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
conf('o git lista os arquivos do repositorio', rastreados.length > 100, true);

console.log('\n=== 2. Toda ligacao do mapa aponta para prova que o portao tem ===');
const citadas = new Set();
mapa.forEach(l => l.provas.forEach(p => { if (p !== '-' && p !== '*') citadas.add(p); }));
conf('nenhuma prova do mapa fora do portao', [...citadas].filter(p => nav.arquivos.indexOf(p) < 0).join(' '), '');

console.log('\n=== 3. Todo arquivo do repositorio tem prova, "-" de proposito ou a bateria inteira ===');
const semDecisao = [];
rastreados.forEach(f => {
  if (nav.arquivos.indexOf(f) >= 0) return;
  const r = provasTocadas([f], mapa, nav);
  const casadas = mapa.filter(l => l.re.test(f));
  const semProva = r.modo === 'nenhuma' && casadas.some(l => l.provas[0] === '-');
  if (!(r.modo === 'inteira' || r.provas.length > 0 || semProva)) semDecisao.push(f);
});
conf('nenhum arquivo rastreado sem decisao', semDecisao.join(' '), '');
const sempre = ['app.js', 'store.js', 'nuvem.js', 'core.js', 'sw.js', 'index.html', 'styles.css'];
sempre.forEach(f => {
  const r = provasTocadas([f], mapa, nav);
  conf('arquivo central ' + f + ' roda provas de navegador (' + r.provas.length + ')', r.provas.length >= 5 && r.modo !== 'nenhuma', true);
});
conf('app.js roda o e2e, que abre o aplicativo inteiro', provasTocadas(['app.js'], mapa, nav).provas.indexOf('_teste/e2e.js') >= 0, true);
conf('sw.js roda a prova da atualizacao', provasTocadas(['sw.js'], mapa, nav).provas.indexOf('_teste/testa_atualizacao_apos_fechar.js') >= 0, true);

console.log('\n=== 4. Nenhuma prova da lista some ===');
const somem = [];
nav.arquivos.forEach(p => {
  const r = provasTocadas([p], mapa, nav);
  if (!(r.modo === 'lista' && r.provas.length === 1 && r.provas[0] === p)) somem.push(p);
});
conf('cada prova tocada roda a propria prova', somem.join(' '), '');
const todosJuntos = provasTocadas(rastreados, mapa, nav);
conf('todos os arquivos juntos pedem a bateria inteira', todosJuntos.provas.length + '/' + todosJuntos.modo, nav.arquivos.length + '/inteira');
conf('a bateria inteira e exatamente a lista do portao',
  todosJuntos.provas.slice().sort().join('\n'), nav.arquivos.slice().sort().join('\n'));
conf('prova de navegador mais um arquivo com mapa: a uniao, sem perder a propria',
  (() => { const r = provasTocadas(['_teste/testa_busca.js', 'busca.js'], mapa, nav); return r.provas.indexOf('_teste/testa_busca.js') >= 0 && r.provas.length > 1; })(), true);
conf('alem do mapa, toda prova do mapa existe entre as listadas', [...citadas].every(p => nav.arquivos.indexOf(p) >= 0), true);

console.log('\n=== 5. Casos de decisao ===');
let r = provasTocadas(['README.md'], mapa, nav);
conf('README nao pede prova de navegador', r.modo, 'nenhuma');
r = provasTocadas(['.github/workflows/portao.yml', '_teste/mapa_provas.tsv'], mapa, nav);
conf('workflow e mapa nao pedem prova de navegador', r.modo, 'nenhuma');
r = provasTocadas(['_teste/testa_merge_seguro.js'], mapa, nav);
conf('prova que nao abre navegador fica com o portao-rapido', r.modo, 'nenhuma');
r = provasTocadas(['_teste/confere_tudo.sh'], mapa, nav);
conf('mexer no portao pede a bateria inteira', r.modo, 'inteira');
r = provasTocadas(['_teste/testa_busca.js'], mapa, nav);
conf('prova de navegador tocada roda so ela', r.provas.join(','), '_teste/testa_busca.js');
r = provasTocadas([], mapa, nav);
conf('nada tocado, nada de navegador', r.modo, 'nenhuma');
r = provasTocadas(['busca.js'], mapa, nav);
conf('arquivo mapeado roda as provas do mapa e nao a bateria', r.modo === 'lista' && r.provas.length < nav.arquivos.length, true);
r = provasTocadas(['app.js', 'arquivo_novo_que_ninguem_mapeou.js'], mapa, nav);
conf('um arquivo fora do mapa leva a bateria inteira junto', r.modo + '/' + r.provas.length, 'inteira/' + nav.arquivos.length);
conf('caminho com barra invertida e ./ vale igual', provasTocadas(['.\\busca.js'], mapa, nav).provas.join(), provasTocadas(['busca.js'], mapa, nav).provas.join());

console.log('\n=== 6. Venenos: o controle tem de reprovar ===');
const semApp = mapa.filter(l => l.padrao !== 'app.js');
r = provasTocadas(['app.js'], semApp, nav);
conf('mapa sem a linha do app.js: o app.js cai na bateria inteira (nunca sem prova)', r.modo, 'inteira');
const mapaFalso = leMapa(fs.readFileSync(MAPA, 'utf8') + 'busca.js\t_teste/testa_que_nao_existe.js\n');
let erro = '';
try { provasTocadas(['busca.js'], mapaFalso, nav); } catch (e) { erro = e.message; }
conf('mapa que cita prova inexistente grita', /o mapa cita uma prova que o portao nao tem/.test(erro), true);
erro = '';
try { leMapa('app.js\n'); } catch (e) { erro = e.message; }
conf('linha sem tabulacao grita', /sem tabulacao/.test(erro), true);
erro = '';
try { leMapa('app.js\t- _teste/e2e.js\n'); } catch (e) { erro = e.message; }
conf('"-" misturado com prova grita', /valem sozinhos/.test(erro), true);

console.log('\n=== 7. As fatias do nivel 1 particionam a selecao ===');
const sel = provasTocadas(['app.js'], mapa, nav).provas;
const porFatia = [];
for (let k = 1; k <= 8; k++) porFatia.push(daFatia(sel, nav, k, 8));
const soma = [].concat.apply([], porFatia);
// o arquivo pode aparecer em mais de uma fatia: cada variante dele (nome do portao) e uma prova, e cai em uma so
conf('a uniao das 8 fatias e a selecao inteira', [...new Set(soma)].sort().join('\n'), sel.slice().sort().join('\n'));
conf('nenhuma fatia leva arquivo fora da selecao', soma.filter(p => sel.indexOf(p) < 0).length, 0);
const inteira = nav.arquivos;
const soma2 = [].concat.apply([], [1, 2, 3, 4, 5, 6, 7, 8].map(k => daFatia(inteira, nav, k, 8)));
conf('a bateria inteira, pelas 8 fatias, cobre todas as provas', new Set(soma2).size, inteira.length);

console.log('\n=== 7b. Os nomes do nivel 1: venenos so da prova tocada (POLITICA_TESTES) ===');
const todosOsNomes = f => nav.nomes[f] || [];
const ehVeneno = n => /--envenenado/.test(n);
const comVeneno = nav.arquivos.filter(f => todosOsNomes(f).some(ehVeneno) && todosOsNomes(f).some(n => !ehVeneno(n)));
conf('o instrumento ve: ha provas com venenos e com nome base', comVeneno.length > 5, true);
const pBusca = '_teste/testa_biblioteca_listas.js';
conf('a prova de exemplo tem venenos', todosOsNomes(pBusca).filter(ehVeneno).length > 3, true);
// a prova entra pelo mapa (biblioteca.js): so os nomes base dela
let rr = provasTocadas(['biblioteca.js'], mapa, nav);
let nn = nomesDaSelecao(rr, ['biblioteca.js'], nav);
conf('prova que entrou pelo mapa: nenhum veneno dela', nn.filter(ehVeneno).length, 0);
conf('prova que entrou pelo mapa: todo nome base de todo arquivo selecionado roda',
  rr.provas.every(f => todosOsNomes(f).filter(n => !ehVeneno(n)).every(n => nn.indexOf(n) >= 0)), true);
conf('cenario que nao e veneno (atualizacao --migracao) continua no nivel 1 quando a prova entra pelo mapa',
  (() => { const r2 = provasTocadas(['sw.js'], mapa, nav); return nomesDaSelecao(r2, ['sw.js'], nav).indexOf('atualizacao --migracao') >= 0; })(), true);
// a mesma prova tocada: todos os nomes, venenos inclusive (o outro lado)
rr = provasTocadas([pBusca, 'biblioteca.js'], mapa, nav);
nn = nomesDaSelecao(rr, [pBusca, 'biblioteca.js'], nav);
conf('prova tocada: todos os nomes dela, venenos inclusive', todosOsNomes(pBusca).every(n => nn.indexOf(n) >= 0), true);
conf('prova tocada nao arrasta os venenos das outras do mapa',
  nn.filter(n => ehVeneno(n) && todosOsNomes(pBusca).indexOf(n) < 0).length, 0);
// bateria inteira ("*" ou fora do mapa): todos os nomes, como antes
rr = provasTocadas(['_teste/confere_tudo.sh'], mapa, nav);
conf('mexer no portao: todos os nomes do portao, venenos inclusive', nomesDaSelecao(rr, ['_teste/confere_tudo.sh'], nav).length, nav.ordem.length);
rr = provasTocadas(['arquivo_novo_que_ninguem_mapeou.js'], mapa, nav);
conf('arquivo fora do mapa: todos os nomes do portao', nomesDaSelecao(rr, ['arquivo_novo_que_ninguem_mapeou.js'], nav).length, nav.ordem.length);
conf('nada tocado: nenhum nome', nomesDaSelecao(provasTocadas([], mapa, nav), [], nav).length, 0);
// os nomes saem na ordem do portao (e o que o divide_portao.js tambem usa)
nn = nomesDaSelecao(provasTocadas(['app.js'], mapa, nav), ['app.js'], nav);
conf('os nomes saem na ordem do portao', nn.join('\n'), nav.ordem.filter(n => nn.indexOf(n) >= 0).join('\n'));

console.log('\n=== 7b2. confere_tudo.sh que so ganha linhas roda: as provas delas, e nao a bateria ===');
const linhaRoda = '+roda "biblioteca listas --envenenado-novo"   node "_teste/testa_biblioteca_listas.js" --envenenado-novo';
const cab = 'diff --git a/_teste/confere_tudo.sh b/_teste/confere_tudo.sh\n--- a/_teste/confere_tudo.sh\n+++ b/_teste/confere_tudo.sh\n@@ -1,3 +1,5 @@\n';
const dSo = cab + ' contexto\n+# veneno novo da regra do PR\n' + linhaRoda + '\n';
let dd = rodaDoDiff(dSo);
conf('diff so com roda e comentario: ok, com o arquivo da linha nova', dd.ok + '/' + dd.arquivos.join(','), 'true/_teste/testa_biblioteca_listas.js');
rr = provasTocadas([PORTAO_REL_T, 'app.js'], mapa, nav, { [PORTAO_REL_T]: dSo });
conf('com o diff so de roda, o confere_tudo.sh nao pede a bateria inteira', rr.modo, 'lista');
nn = nomesDaSelecao(rr, [PORTAO_REL_T, 'app.js'], nav);
conf('a prova da linha nova roda com todos os nomes, venenos inclusive', todosOsNomes(pBusca).every(n => nn.indexOf(n) >= 0), true);
conf('e as outras do app.js seguem so com os nomes base', nn.filter(n => ehVeneno(n) && todosOsNomes(pBusca).indexOf(n) < 0).length, 0);
// o outro lado: qualquer linha que nao e roda nem comentario e a maquinaria
const venenosDiff = [
  ['linha de maquinaria (if)', cab + '+if [ "$x" = 1 ]; then\n' + linhaRoda + '\n'],
  ['roda com sobra depois (&& outra coisa)', cab + linhaRoda + ' && rm -rf _site\n'],
  ['roda sem aspas no nome', cab + '+roda nome node "_teste/testa_busca.js"\n'],
  ['variavel trocada', cab + '-falhou=0\n+falhou=1\n'],
  ['linha tirada da maquinaria', cab + '-  shift\n'],
  ['diff vazio', cab],
];
venenosDiff.forEach(([rot, d]) => {
  conf('veneno ' + rot + ': nao e ok', rodaDoDiff(d).ok, false);
  conf('veneno ' + rot + ': bateria inteira', provasTocadas([PORTAO_REL_T], mapa, nav, { [PORTAO_REL_T]: d }).modo, 'inteira');
});
conf('sem diff lido, o confere_tudo.sh pede a bateria inteira', provasTocadas([PORTAO_REL_T], mapa, nav, {}).modo, 'inteira');
conf('sem o argumento de diffs, como antes: bateria inteira', provasTocadas([PORTAO_REL_T], mapa, nav).modo, 'inteira');
dd = rodaDoDiff(cab + '+roda "merge seguro"          node _teste/testa_merge_seguro.js\n');
conf('roda nova de prova sem navegador: ok, e o nivel 1 nao roda nada (o rapido cobre)',
  dd.ok + '/' + provasTocadas([PORTAO_REL_T], mapa, nav, { [PORTAO_REL_T]: cab + '+roda "merge seguro"          node _teste/testa_merge_seguro.js\n' }).modo, 'true/nenhuma');
const linhaTirada = '-roda "biblioteca listas --envenenado-lixeira"   node "_teste/testa_biblioteca_listas.js" --envenenado-lixeira\n';
dd = rodaDoDiff(cab + linhaTirada);
conf('roda tirada: ok, sem prova a rodar', dd.ok + '/' + dd.arquivos.length, 'true/0');
conf('roda tirada: o resultado diz qual prova saiu do portao', dd.removidas.join('|'), 'biblioteca listas --envenenado-lixeira');
conf('roda tirada: o motivo avisa que uma prova saiu do portao',
  provasTocadas([PORTAO_REL_T], mapa, nav, { [PORTAO_REL_T]: cab + linhaTirada }).motivos.some(m => /SAIU\(RAM\) do portao.*envenenado-lixeira/.test(m)), true);
dd = rodaDoDiff(cab + linhaTirada + linhaTirada.replace(/^-/, '+').replace('" --envenenado-lixeira\n', '" --envenenado-lixeira --x\n'));
conf('roda mudada (tirada e posta com o mesmo nome): nao avisa saida', dd.ok + '/' + dd.removidas.length, 'true/0');
// cabecalho pela posicao: a linha tirada que comeca com "-- " vira "--- " e e conteudo
dd = rodaDoDiff(cab + '--- linha tirada que comecava com dois tracos\n');
conf('linha tirada "-- ..." depois do @@ e conteudo, e conta como maquinaria', dd.ok, false);
dd = rodaDoDiff(cab + '+++ linha posta que comecava com dois mais\n');
conf('linha posta "++ ..." depois do @@ e conteudo, e conta como maquinaria', dd.ok, false);
conf('controle: o cabecalho de verdade (antes do @@) nao conta como mudanca', rodaDoDiff(cab + '+# so comentario\n').ok, true);
dd = rodaDoDiff(cab + '+# comentario\n' + 'diff --git a/x b/x\n--- a/x\n+++ b/x\n@@ -1 +1 @@\n+roda "x" node "_teste/testa_busca.js"\n');
conf('segundo arquivo no mesmo diff: o cabecalho dele tambem e pulado', dd.ok + '/' + dd.arquivos.join(','), 'true/_teste/testa_busca.js');
// as linhas roda de hoje, sem variavel: todas na forma que o rodaDoDiff aceita (o instrumento ve a forma real)
const rodasHoje = fs.readFileSync(path.join(__dirname, 'confere_tudo.sh'), 'utf8').split(/\r?\n/).filter(l => /^\s*roda /.test(l));
const literais = rodasHoje.filter(l => l.indexOf('$') < 0);
dd = rodaDoDiff(cab + literais.map(l => '+' + l).join('\n') + '\n');
conf('todas as ' + literais.length + ' linhas roda literais do portao de hoje passam pela forma estrita', dd.ok, true);
conf('e todo arquivo delas existe', dd.arquivos.filter(p => !fs.existsSync(path.join(RAIZ, p))).join(' '), '');
conf('e cobrem mais de 50 das provas de navegador', nav.arquivos.filter(p => dd.arquivos.indexOf(p) >= 0).length > 50, true);
const doLaco = rodasHoje.filter(l => l.indexOf('$') >= 0);
conf('o instrumento ve a linha do laco das provas com navegador', doLaco.length >= 1, true);
doLaco.forEach(l => conf('linha roda com variavel (' + l.trim().slice(0, 40) + '): maquinaria, bateria inteira',
  provasTocadas([PORTAO_REL_T], mapa, nav, { [PORTAO_REL_T]: cab + '+' + l + ' --x\n' }).modo, 'inteira'));
conf('acrescentar prova na lista do laco: maquinaria, bateria inteira',
  provasTocadas([PORTAO_REL_T], mapa, nav, { [PORTAO_REL_T]: cab + '+         testa_nova_navegador \\\n' }).modo, 'inteira');

console.log('\n=== 7c. Quantas fatias o plano abre ===');
const { leTempos, mediana, divide } = require('./divide_portao.js');
const tempos = leTempos();
const med = mediana(Object.keys(tempos).map(k => tempos[k]));
conf('nenhum nome: zero fatias', fatiasDoPlano([], tempos, med), 0);
conf('um nome: uma fatia', fatiasDoPlano([nav.ordem[0]], tempos, med), 1);
conf('a bateria inteira: oito fatias, nunca mais', fatiasDoPlano(nav.ordem, tempos, med), 8);
conf('nunca mais fatias que nomes', fatiasDoPlano(nav.ordem.slice(0, 2), { [nav.ordem[0]]: 9999, [nav.ordem[1]]: 9999 }, med), 2);
nn = nomesDaSelecao(provasTocadas(['app.js'], mapa, nav), ['app.js'], nav);
conf('o app.js sozinho: nenhum veneno na selecao', nn.filter(ehVeneno).length, 0);
const tApp = nn.reduce((s, n) => s + (Object.prototype.hasOwnProperty.call(tempos, n) ? tempos[n] : med), 0);
const nApp = fatiasDoPlano(nn, tempos, med);
conf('app.js: uma fatia a cada ' + ALVO_POR_FATIA / 60 + ' min de prova previstos (' + (tApp / 60).toFixed(1) + ' min, ' + nApp + ' fatias)',
  nApp, Math.min(8, Math.ceil(tApp / ALVO_POR_FATIA)));
// as fatias do plano particionam os NOMES da selecao
const partes = [];
for (let k = 1; k <= nApp; k++) partes.push(daFatia(provasTocadas(['app.js'], mapa, nav).provas, nav, k, nApp, nn));
const nomesJuntos = [].concat.apply([], partes.map(p => p.nomes));
conf('as fatias do plano juntam exatamente os nomes da selecao, cada um uma vez',
  nomesJuntos.length + '/' + nomesJuntos.slice().sort().join('|'), nn.length + '/' + nn.slice().sort().join('|'));
conf('nenhuma fatia do plano fica sem nome', partes.every(p => p.nomes.length > 0), true);
conf('cada arquivo de fatia tem nome na fatia', partes.every(p => p.arquivos.every(f => todosOsNomes(f).some(n => p.nomes.indexOf(n) >= 0))), true);
conf('o divisor das fatias e o mesmo do portao (divide sobre os nomes)', partes.map(p => p.nomes.join('|')).join('#'), divide(nn, tempos, nApp).fatias.map(f => f.join('|')).join('#'));

console.log('\n=== 7d. O divide_portao.js com PORTAO_SELECAO (o que o confere_tudo.sh --pedaco usa) ===');
const selArq = path.join(require('os').tmpdir(), 'selecao_' + process.pid + '.txt');
const divCli = (k, n, conteudo) => {
  if (conteudo === null) delete process.env.PORTAO_SELECAO_TESTE;
  fs.writeFileSync(selArq, conteudo || '');
  try {
    const out = execFileSync('node', [path.join(__dirname, 'divide_portao.js'), String(k), String(n)],
      { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: Object.assign({}, process.env, conteudo === null ? {} : { PORTAO_SELECAO: selArq }) });
    return { codigo: 0, nomes: out.split(/\r?\n/).filter(Boolean) };
  } catch (e) { return { codigo: e.status, nomes: [] }; }
};
const peqSel = nn.slice(0, 6);
const cli = [1, 2].map(k => divCli(k, 2, peqSel.join('\n') + '\n'));
conf('com PORTAO_SELECAO, as 2 fatias juntam so os nomes da selecao',
  [].concat(cli[0].nomes, cli[1].nomes).sort().join('|'), peqSel.slice().sort().join('|'));
conf('e e a mesma divisao do provas_tocadas', cli.map(c => c.nomes.join('|')).join('#'), divide(peqSel, tempos, 2).fatias.map(f => f.join('|')).join('#'));
conf('PORTAO_SELECAO com nome que o portao nao tem sai com 2', divCli(1, 2, peqSel.join('\n') + '\nprova que nao existe\n').codigo, 2);
conf('PORTAO_SELECAO vazia sai com 2 (nunca vira a bateria inteira calada)', divCli(1, 2, '\n').codigo, 2);
const semSel = divCli(1, 8, null);
conf('sem PORTAO_SELECAO, a fatia 1 de 8 e a do portao inteiro', semSel.nomes.join('|'), divide(nav.ordem, tempos, 8).fatias[0].join('|'));
fs.rmSync(selArq, { force: true });

console.log('\n=== 7e. No portao.yml, so o nivel 1 usa PORTAO_SELECAO ===');
// sem as linhas de comentario: o que vale e o que o Actions executa
const yml = fs.readFileSync(path.join(RAIZ, '.github', 'workflows', 'portao.yml'), 'utf8').replace(/\r/g, '')
  .split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
const jobDe = (nome, texto) => { const t2 = texto || yml; const i = t2.indexOf('\n  ' + nome + ':\n'); if (i < 0) return ''; const r2 = t2.slice(i + 1); const j = r2.slice(1).search(/\n {2}[a-z][a-z0-9-]*:\n/); return j < 0 ? r2 : r2.slice(0, j + 1); };
const bateria = jobDe('portao-navegador-fatia');
const nivel1 = jobDe('portao-tocadas-fatia');
// veneno: a mesma conferencia numa copia em que a bateria ganhou PORTAO_SELECAO
const ymlVeneno = yml.replace('\n  portao-navegador-fatia:\n', '\n  portao-navegador-fatia:\n    env:\n      PORTAO_SELECAO: /tmp/x\n');
conf('controle: bateria com PORTAO_SELECAO numa copia do yml e pega', /PORTAO_SELECAO/.test(jobDe('portao-navegador-fatia', ymlVeneno)), true);
conf('controle: o job seguinte nao entra no recorte do job (o recorte para no proximo job)', /portao-navegador:\n/.test(nivel1) || /portao-tocadas:\n/.test(nivel1), false);
conf('o instrumento ve os dois jobs', bateria.length > 200 && nivel1.length > 200, true);
conf('a bateria (portao-navegador-fatia) nunca define PORTAO_SELECAO', /PORTAO_SELECAO/.test(bateria), false);
conf('a bateria roda o portao inteiro em 8 fatias fixas', /fatia: \[1, 2, 3, 4, 5, 6, 7, 8\]/.test(bateria) && /confere_tudo\.sh --pedaco \$\{\{ matrix\.fatia \}\}\/8/.test(bateria), true);
conf('o nivel 1 define PORTAO_SELECAO', /PORTAO_SELECAO=/.test(nivel1), true);
conf('o nivel 1 roda com --provas (o confere_tudo diz que e so o nivel 1)', /confere_tudo\.sh --provas /.test(nivel1), true);
conf('PORTAO_SELECAO so aparece no job do nivel 1', (yml.match(/PORTAO_SELECAO/g) || []).length, (nivel1.match(/PORTAO_SELECAO/g) || []).length);

console.log('\n=== 8. O confere_tudo.sh --provas escolhe so as da lista ===');
const lista = path.join(require('os').tmpdir(), 'provas_tocadas_' + process.pid + '.txt');
fs.writeFileSync(lista, '_teste/testa_busca.js\n_teste/testa_cartao_navegador.js\n');
const listado = execFileSync('sh', [path.join(__dirname, 'confere_tudo.sh'), '--listar', '--provas', lista], { cwd: RAIZ, encoding: 'utf8' });
const arqs = listado.split(/\r?\n/).map(l => /^ {2}arq {5}\d+ (.*)$/.exec(l)).filter(Boolean).map(m => m[1]);
conf('o --listar --provas diz so as provas da lista', [...new Set(arqs)].sort().join(','),
  ['_teste/testa_busca.js', '_teste/testa_cartao_navegador.js'].filter(p => nav.arquivos.indexOf(p) >= 0).sort().join(','));
fs.writeFileSync(lista, '');
let codigo = 0;
try { execFileSync('sh', [path.join(__dirname, 'confere_tudo.sh'), '--provas', lista], { cwd: RAIZ, encoding: 'utf8', stdio: 'pipe' }); } catch (e) { codigo = e.status; }
conf('lista vazia sai com 2, e nao vira a bateria inteira calada', codigo, 2);
fs.rmSync(lista, { force: true });

console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
