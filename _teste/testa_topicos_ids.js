/* O identificador de tópico é estável, e as travas que o mantêm assim sabem reprovar.
 *
 * Cada bloco de banco/topicos/<disciplina>.json carrega uma lista 'ids'
 * paralela a 'topicos', e banco/topicos/_ids.json é a memória do que já foi
 * emitido (temas/_ferramentas/emite_ids_topicos.js). O risco real não é id
 * faltando: é DESALINHAMENTO. Um título inserido no meio de um bloco sem id
 * deslocaria todos os seguintes em silêncio, e o tema de português que aponta
 * para POR07-T12 passaria a apontar para o vizinho. Por isso este teste casa
 * cada id com o registro em disciplina, grupo e título, e envenena uma cópia
 * para mostrar que a conferência reprova apontando o bloco.
 *
 * O que NÃO pode mudar aqui: 'topicos' continua lista de strings. O app v19
 * lê só o título (app.js:7616-7619 e 8026) e há uma janela, entre o deploy e
 * o toque em atualizar, em que o app antigo lê estes JSON pela rede; se a
 * forma mudasse, ele gravaria objeto no lugar de título nas aulas dela.
 *
 *   node _teste/testa_topicos_ids.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const DIR = path.join(RAIZ, 'banco', 'topicos');
const EMISSOR = path.join(RAIZ, 'temas', '_ferramentas', 'emite_ids_topicos.js');
const Core = require(path.join(RAIZ, 'core.js'));

let passaram = 0, falharam = 0;
function conf(rotulo, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (ok) passaram++; else falharam++;
  console.log((ok ? '  OK    ' : '  FALHA ') + rotulo +
    (ok ? '' : '  [obtido: ' + JSON.stringify(obtido) + ' | esperado: ' + JSON.stringify(esperado) + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }
function leJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function grupoNoId(chave) { return String(chave).toUpperCase().replace(/-/g, ''); }
/* Os dois travessões por escape, para o próprio teste não carregar o caractere que ele proíbe. */
const TRAVESSAO = /[\u2013\u2014]/;

/* Roda o emissor e devolve código e saída. O emissor fala em uma pasta só,
 * então as provas envenenam uma CÓPIA e apontam '--pasta' para ela: a árvore
 * de verdade nunca é escrita por este teste. */
function emissor(args, pasta) {
  const r = spawnSync(process.execPath, [EMISSOR].concat(args || []).concat(pasta ? ['--pasta', pasta] : []), { encoding: 'utf8' });
  return { codigo: r.status, saida: (r.stdout || '') + (r.stderr || '') };
}
const NOMES = fs.readdirSync(DIR).filter(function (n) { return /\.json$/.test(n); });
function copia() {
  const t = fs.mkdtempSync(path.join(os.tmpdir(), 'topicos-ids-'));
  NOMES.forEach(function (n) { fs.copyFileSync(path.join(DIR, n), path.join(t, n)); });
  return t;
}
function apaga(t) { fs.rmSync(t, { recursive: true, force: true }); }
function leBloco(pasta, disciplina, gi, bi) { return leJson(path.join(pasta, disciplina + '.json')).grupos[gi].blocos[bi]; }
function escreve(pasta, disciplina, dados) { fs.writeFileSync(path.join(pasta, disciplina + '.json'), JSON.stringify(dados)); }

const indice = leJson(path.join(DIR, 'indice.json'));
const disciplinas = indice.disciplinas;
const arquivos = {};
disciplinas.forEach(function (d) { arquivos[d.chave] = leJson(path.join(DIR, d.chave + '.json')); });
const registro = fs.existsSync(path.join(DIR, '_ids.json')) ? leJson(path.join(DIR, '_ids.json')) : null;
const todosIds = [];          /* {id, disciplina, grupo, titulo, bloco} na ordem dos arquivos */
const titulosComTravessao = [];

secao('1. Forma: todo bloco tem ids do tamanho de topicos, e topicos continua lista de strings');
disciplinas.forEach(function (d) {
  const arq = arquivos[d.chave];
  let blocos = 0, blocosBons = 0, titulos = 0, formaRuim = 0;
  arq.grupos.forEach(function (g) {
    g.blocos.forEach(function (b) {
      blocos++;
      const topicosOk = Array.isArray(b.topicos) && b.topicos.every(function (t) { return typeof t === 'string'; });
      const idsOk = Array.isArray(b.ids) && b.ids.length === b.topicos.length &&
        b.ids.every(function (id) { return new RegExp('^' + d.prefixo + grupoNoId(g.chave) + '-T\\d{2,}$').test(id); });
      if (topicosOk && idsOk) blocosBons++;
      if (!topicosOk) formaRuim++;
      (b.topicos || []).forEach(function (t, i) {
        titulos++;
        if (TRAVESSAO.test(t)) titulosComTravessao.push(d.chave + '/' + g.chave + ': ' + t);
        todosIds.push({ id: (b.ids || [])[i], disciplina: d.chave, grupo: g.chave, titulo: t, bloco: b.titulo });
      });
      if (TRAVESSAO.test(b.titulo)) titulosComTravessao.push(d.chave + '/' + g.chave + ' bloco: ' + b.titulo);
    });
  });
  conf(d.chave + ': ' + blocos + ' blocos, todos com ids alinhados a topicos e no formato ' + d.prefixo + '<GRUPO>-T<NN>', blocosBons, blocos);
  conf(d.chave + ": nenhum bloco com 'topicos' que não seja lista de strings", formaRuim, 0);
  conf(d.chave + ': o índice diz ' + d.topicos + ' assuntos (é o número que a tela mostra, app.js:7985)', titulos, d.topicos);
  conf(d.chave + ': grupos do arquivo na ordem do índice', arq.grupos.map(function (g) { return g.chave; }), d.grupos.map(function (g) { return g.chave; }));
});
conf('total de tópicos', todosIds.length, 2513);

secao('2. Unicidade');
conf('nenhum id se repete nos 12 arquivos', new Set(todosIds.map(function (x) { return x.id; })).size, todosIds.length);
conf('nenhum título se repete dentro do mesmo grupo (é a chave de casamento com o registro)',
  new Set(todosIds.map(function (x) { return x.disciplina + '\u0000' + x.grupo + '\u0000' + x.titulo; })).size, todosIds.length);
conf('todo id tem número de dois ou mais dígitos', todosIds.every(function (x) { return /-T\d{2,}$/.test(x.id || ''); }), true);

secao('3. O registro congelado: cada id casa em disciplina, grupo e título');
conf('banco/topicos/_ids.json existe e tem o formato do emissor', !!(registro && registro.formato === 'registro-de-ids-de-topicos' && registro.ids), true);
const ids = (registro && registro.ids) || {};
const desalinhados = todosIds.filter(function (x) {
  const e = ids[x.id];
  return !e || e.disciplina !== x.disciplina || e.grupo !== x.grupo || e.titulo !== x.titulo || e.aposentado;
}).map(function (x) { return x.disciplina + '/' + x.grupo + ' bloco "' + x.bloco + '": ' + x.id + ' "' + x.titulo + '"'; });
conf('todo id dos arquivos está no registro, ativo, com a mesma disciplina, grupo e título', desalinhados, []);
const ativos = Object.keys(ids).filter(function (id) { return !ids[id].aposentado; });
const noArquivo = new Set(todosIds.map(function (x) { return x.id; }));
conf('todo id ativo do registro está em algum arquivo (senão devia estar aposentado)', ativos.filter(function (id) { return !noArquivo.has(id); }), []);
conf('id aposentado nunca aparece em arquivo', Object.keys(ids).filter(function (id) { return ids[id].aposentado && noArquivo.has(id); }), []);
conf('o registro não tem dois ids para o mesmo título do mesmo grupo',
  new Set(Object.keys(ids).map(function (id) { return ids[id].disciplina + '\u0000' + ids[id].grupo + '\u0000' + ids[id].titulo; })).size, Object.keys(ids).length);
conf('o número de cada id é único dentro do grupo, contando os aposentados', (function () {
  const vistos = new Set();
  let repetidos = 0;
  Object.keys(ids).forEach(function (id) {
    const k = ids[id].disciplina + '\u0000' + ids[id].grupo + '\u0000' + /-T(\d+)$/.exec(id)[1];
    if (vistos.has(k)) repetidos++;
    vistos.add(k);
  });
  return repetidos;
})(), 0);

secao('4. Prefixos: os da tabela única para POR e LIT, e nenhum é começo de outro');
conf('toda disciplina do índice tem prefixo de três letras maiúsculas', disciplinas.filter(function (d) { return !/^[A-Z]{3}$/.test(d.prefixo || ''); }).map(function (d) { return d.chave; }), []);
conf('prefixos únicos', new Set(disciplinas.map(function (d) { return d.prefixo; })).size, disciplinas.length);
conf('nenhum prefixo de tópico é começo de outro',
  disciplinas.every(function (a) { return disciplinas.every(function (b) { return a === b || b.prefixo.indexOf(a.prefixo) !== 0; }); }), true);
Core.materiasComTemas().forEach(function (m) {
  const dona = disciplinas.filter(function (d) { return d.chave === m.topicos; })[0];
  if (dona) {
    conf('prefixo de ' + dona.chave + ' no índice é o mesmo de Core.MATERIAS.' + m.id + '.temas.prefixo', dona.prefixo, m.temas.prefixo);
  } else {
    conf('nenhuma disciplina de tópicos usa ' + m.temas.prefixo + ' (é tema de ' + m.id + ', que não tem catálogo)',
      disciplinas.filter(function (d) { return d.prefixo.indexOf(m.temas.prefixo) === 0 || m.temas.prefixo.indexOf(d.prefixo) === 0; }), []);
  }
  conf('fora da própria matéria, nenhum prefixo de tópico encosta em ' + m.temas.prefixo,
    disciplinas.filter(function (d) { return d.chave !== m.topicos && (d.prefixo.indexOf(m.temas.prefixo) === 0 || m.temas.prefixo.indexOf(d.prefixo) === 0); }), []);
});
conf('os prefixos de hoje', disciplinas.map(function (d) { return d.chave + '=' + d.prefixo; }),
  ['portugues=POR', 'redacao=RED', 'ingles=ING', 'ciencias=CIE', 'historia=HIS', 'geografia=GEO', 'fisica=FIS', 'quimica=QUI',
    'biologia=BIO', 'literatura=LIT', 'filosofia-sociologia=FSO', 'estudo=EST']);

secao("5. O '-T' separa tópico de tema: Core.materiaDoTema devolve null para todo id");
conf("todo id tem '-T'", todosIds.filter(function (x) { return String(x.id).indexOf('-T') === -1; }).length, 0);
conf('Core.materiaDoTema(id) é null para os ' + todosIds.length + ' ids', todosIds.filter(function (x) { return Core.materiaDoTema(x.id) !== null; }).length, 0);
conf("e só o '-T' faz a diferença: POR07-12 é tema do português", (Core.materiaDoTema('POR07-12') || {}).id, 'portugues');
conf('LITEM2-T03 não é tema', Core.materiaDoTema('LITEM2-T03'), null);

secao('6. O emissor: --confere sai 0 na árvore, e rodar de novo numa cópia não muda nada');
const confereReal = emissor(['--confere']);
conf('--confere sai 0', confereReal.codigo, 0);
conf('e diz que tudo confere', /tudo confere/.test(confereReal.saida) && !/REPROVADO/.test(confereReal.saida), true);
{
  const t = copia();
  const antes = {};
  NOMES.forEach(function (n) { antes[n] = fs.readFileSync(path.join(t, n), 'utf8'); });
  const r = emissor([], t);
  conf('emissor em modo de escrita numa cópia já numerada sai 0', r.codigo, 0);
  conf('e diz que nada mudou', /nada mudou/.test(r.saida), true);
  conf('e não muda byte nenhum dos 14 arquivos', NOMES.filter(function (n) { return fs.readFileSync(path.join(t, n), 'utf8') !== antes[n]; }), []);
  apaga(t);
}

secao('7. PAR ENVENENADO: título inserido sem id no meio de um bloco');
{
  const t = copia();
  const dados = leJson(path.join(t, 'portugues.json'));
  const gi = dados.grupos.findIndex(function (g) { return g.chave === '07'; });
  const g = dados.grupos[gi];
  const b = g.blocos[0];
  const original = b.ids.slice();
  const VENENO = 'Tópico envenenado pela prova';
  b.topicos.splice(2, 0, VENENO);           /* só 'topicos'; 'ids' fica como estava */
  escreve(t, 'portugues', dados);
  const r = emissor(['--confere'], t);
  conf('--confere sai 1', r.codigo, 1);
  conf('aponta a disciplina, o grupo e o BLOCO', r.saida.indexOf('DESALINHADO portugues/07 bloco "' + b.titulo + '"') !== -1, true);
  conf('diz que há título sem id, qual, e em que posição', r.saida.indexOf('título sem id: "' + VENENO + '" (posição 2') !== -1, true);
  conf("diz que 'topicos' e 'ids' têm tamanhos diferentes", r.saida.indexOf("'topicos' tem " + (original.length + 1) + " e 'ids' tem " + original.length) !== -1, true);
  conf('nenhum outro bloco é acusado', (r.saida.match(/DESALINHADO/g) || []).length, 1);
  conf('a cópia não foi escrita pela conferência', leBloco(t, 'portugues', gi, 0).ids, original);

  /* A política de estabilidade, medida: o novo ganha o PRÓXIMO número livre do
   * grupo e ninguém é deslocado; ao sair, fica aposentado; ao voltar, recebe o
   * mesmo id de volta em vez de um número novo. */
  const maior = Math.max.apply(null, Object.keys(ids).filter(function (id) {
    return ids[id].disciplina === 'portugues' && ids[id].grupo === '07';
  }).map(function (id) { return parseInt(/-T(\d+)$/.exec(id)[1], 10); }));
  const esperadoNovo = 'POR07-T' + String(maior + 1).padStart(2, '0');
  const r2 = emissor([], t);
  conf('emitir na cópia envenenada sai 0', r2.codigo, 0);
  const depois = leBloco(t, 'portugues', gi, 0).ids;
  conf('o título novo ganhou o próximo número livre do grupo: ' + esperadoNovo, depois[2], esperadoNovo);
  conf('e os vizinhos ficaram com o que tinham (nenhum deslocado)', depois.filter(function (x, i) { return i !== 2; }), original);
  conf('o emissor diz que emitiu 1 id novo em portugues', /portugues: \d+ títulos, 1 ids novos/.test(r2.saida), true);
  const reg2 = leJson(path.join(t, '_ids.json')).ids;
  conf('o registro da cópia ganhou a entrada', reg2[esperadoNovo], { disciplina: 'portugues', grupo: '07', titulo: VENENO });
  conf('--confere na cópia agora sai 0', emissor(['--confere'], t).codigo, 0);

  /* Sai da lista: aposentado, número não volta. */
  b.topicos.splice(2, 1);
  b.ids = depois;                            /* o arquivo escrito pelo emissor tem ids; refletimos a remoção só em topicos */
  b.ids.splice(2, 1);
  escreve(t, 'portugues', dados);
  const r3 = emissor([], t);
  conf('removido o título, o emissor sai 0 e aposenta 1', r3.codigo === 0 && /1 aposentados/.test(r3.saida), true);
  const reg3 = leJson(path.join(t, '_ids.json')).ids;
  conf('a entrada continua no registro, marcada aposentado', reg3[esperadoNovo] && reg3[esperadoNovo].aposentado, true);
  conf('o bloco voltou aos ids originais', leBloco(t, 'portugues', gi, 0).ids, original);

  /* Outro título novo no mesmo grupo NÃO recebe o número aposentado. */
  b.topicos.push('Segundo tópico envenenado');
  escreve(t, 'portugues', dados);
  emissor([], t);
  const esperadoSegundo = 'POR07-T' + String(maior + 2).padStart(2, '0');
  conf('um segundo título novo pula o número aposentado e recebe ' + esperadoSegundo, leBloco(t, 'portugues', gi, 0).ids[original.length], esperadoSegundo);

  /* Volta o primeiro: recebe o id antigo de volta, e não um terceiro número. */
  b.topicos.splice(2, 0, VENENO);
  b.ids = leBloco(t, 'portugues', gi, 0).ids;
  escreve(t, 'portugues', dados);
  const r5 = emissor([], t);
  conf('o título que voltou recebeu o mesmo id de antes, reativado', leBloco(t, 'portugues', gi, 0).ids[2] === esperadoNovo && /1 reativados/.test(r5.saida), true);
  conf('o registro da cópia tem exatamente 2 ids a mais que o real', Object.keys(leJson(path.join(t, '_ids.json')).ids).length, Object.keys(ids).length + 2);
  apaga(t);
}

secao('8. Mais venenos: ids trocados, título repetido, prefixo mudado, registro perdido, registro editado à mão');
{
  const t = copia();
  const dados = leJson(path.join(t, 'historia.json'));
  const b = dados.grupos[0].blocos[0];
  const tmp = b.ids[0]; b.ids[0] = b.ids[1]; b.ids[1] = tmp;
  escreve(t, 'historia', dados);
  const r = emissor(['--confere'], t);
  conf('dois ids trocados de lugar: --confere sai 1', r.codigo, 1);
  conf('e aponta o bloco e a posição', r.saida.indexOf('DESALINHADO historia/' + dados.grupos[0].chave + ' bloco "' + b.titulo + '": posição 0') !== -1, true);
  apaga(t);
}
{
  const t = copia();
  const dados = leJson(path.join(t, 'biologia.json'));
  const g = dados.grupos[0];
  const antes = fs.readFileSync(path.join(t, 'biologia.json'), 'utf8');
  g.blocos[1].topicos.push(g.blocos[0].topicos[0]);     /* mesmo título, mesmo grupo, outro bloco */
  escreve(t, 'biologia', dados);
  const depoisDoVeneno = fs.readFileSync(path.join(t, 'biologia.json'), 'utf8');
  const r = emissor([], t);
  conf('título repetido no mesmo grupo: o emissor se recusa (sai 1)', r.codigo, 1);
  conf('e diz qual', r.saida.indexOf('título repetido no mesmo grupo: "' + g.blocos[0].topicos[0] + '" em biologia/' + g.chave) !== -1, true);
  conf('e não escreve nada', fs.readFileSync(path.join(t, 'biologia.json'), 'utf8') === depoisDoVeneno && antes !== depoisDoVeneno, true);
  apaga(t);
}
{
  const t = copia();
  const ind = leJson(path.join(t, 'indice.json'));
  ind.disciplinas.filter(function (d) { return d.chave === 'portugues'; })[0].prefixo = 'PXR';
  fs.writeFileSync(path.join(t, 'indice.json'), JSON.stringify(ind));
  const r = emissor([], t);
  conf('prefixo de português diferente do Core: o emissor se recusa', r.codigo === 1 && /Core\.MATERIAS/.test(r.saida), true);
  ind.disciplinas.filter(function (d) { return d.chave === 'portugues'; })[0].prefixo = 'POR';
  ind.disciplinas.filter(function (d) { return d.chave === 'redacao'; })[0].prefixo = 'MAT';
  fs.writeFileSync(path.join(t, 'indice.json'), JSON.stringify(ind));
  const r2 = emissor([], t);
  conf('redação com o prefixo MAT da matemática: o emissor se recusa', r2.codigo === 1 && /colide com o prefixo de tema 'MAT'/.test(r2.saida), true);
  ind.disciplinas.filter(function (d) { return d.chave === 'redacao'; })[0].prefixo = 'RED';
  ind.disciplinas.filter(function (d) { return d.chave === 'ingles'; })[0].prefixo = 'INX';
  fs.writeFileSync(path.join(t, 'indice.json'), JSON.stringify(ind));
  const r3 = emissor([], t);
  conf('prefixo de inglês trocado depois de ids emitidos: o emissor se recusa a renumerar', r3.codigo === 1 && /mudou depois de ids emitidos/.test(r3.saida), true);
  apaga(t);
}
{
  const t = copia();
  fs.unlinkSync(path.join(t, '_ids.json'));
  const r = emissor([], t);
  conf('registro perdido com arquivos numerados: o emissor se recusa e manda restaurar do git', r.codigo === 1 && /Restaure o registro do git/.test(r.saida), true);
  apaga(t);
}
{
  const t = copia();
  const reg = leJson(path.join(t, '_ids.json'));
  const alvo = Object.keys(reg.ids).filter(function (id) { return reg.ids[id].disciplina === 'quimica'; })[3];
  const titulo = reg.ids[alvo].titulo;
  reg.ids[alvo].titulo = titulo + ' (retocado à mão)';
  fs.writeFileSync(path.join(t, '_ids.json'), JSON.stringify(reg));
  const r = emissor(['--confere'], t);
  conf('título retocado no registro: --confere sai 1 (o arquivo passa a ter título sem id)', r.codigo === 1 && r.saida.indexOf('título sem id: "' + titulo + '"') !== -1, true);
  apaga(t);
}

secao('9. Nada de travessão');
conf('nenhum travessão em título de tópico, bloco, grupo ou disciplina (se houver, relatar; não consertar: ela já gravou o título)', titulosComTravessao, []);
conf('nenhum travessão nos rótulos do índice', disciplinas.filter(function (d) {
  return TRAVESSAO.test(d.nome) || d.grupos.some(function (g) { return TRAVESSAO.test(g.rotulo); });
}).map(function (d) { return d.chave; }), []);
['banco/topicos/_ids.json', 'banco/topicos/LEIA-ME.md', 'temas/_ferramentas/emite_ids_topicos.js', '_teste/testa_topicos_ids.js'].forEach(function (rel) {
  const p = path.join(RAIZ, rel);
  conf('nenhum travessão em ' + rel, fs.existsSync(p) && !TRAVESSAO.test(fs.readFileSync(p, 'utf8')), true);
});

console.log('\n' + passaram + ' passaram, ' + falharam + ' falharam.');
process.exit(falharam ? 1 : 0);
