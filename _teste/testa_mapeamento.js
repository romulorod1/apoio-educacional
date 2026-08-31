/* testa_mapeamento.js
 * O mapeamento do aluno: catálogo, revisões, lembrete e ficha em PDF.
 * Roda no Node, direto contra o core.
 */
const Core = require('../core.js');
const PDFGen = require('../pdf.js');

let falhas = 0, passes = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

// ================================================================
secao('1. O catálogo do mapeamento');

const chaves = Core.MAPA.map(g => g.chave);
conf('tem os cinco grupos', chaves.join(','), 'fortes,atencao,lacunas,rotina,aprende');
conf('todo grupo tem título e ajuda',
  Core.MAPA.every(g => g.titulo && g.ajuda && g.itens.length >= 8), true);

const ids = [];
Core.MAPA.forEach(g => g.itens.forEach(i => ids.push(g.chave + ':' + i.id)));
conf('nenhum item repetido dentro do grupo', new Set(ids).size, ids.length);
conf('há itens em quantidade útil', ids.length >= 60, true);
conf('todo item tem rótulo legível',
  Core.MAPA.every(g => g.itens.every(i => i.rotulo && i.rotulo.length > 3)), true);

const lacunas = Core.MAPA.find(g => g.chave === 'lacunas');
conf('toda lacuna aponta para uma busca no banco',
  lacunas.itens.every(i => i.busca && i.busca.length > 2), true);
conf('as buscas não se repetem',
  new Set(lacunas.itens.map(i => i.busca)).size, lacunas.itens.length);

conf('os cinco níveis existem', Core.NIVEIS.length, 5);
conf('o nível devolve rótulo', Core.rotuloNivel('3'), 'Acompanha o ano com apoio');
conf('nível vazio não devolve nada', Core.rotuloNivel(''), '');
conf('nenhum travessão no catálogo',
  /[–—]/.test(JSON.stringify(Core.MAPA) + JSON.stringify(Core.NIVEIS)), false);

// ================================================================
secao('2. Um mapeamento novo');

const vazio = Core.mapeamentoNovo();
conf('nasce com data de hoje', /^\d{4}-\d{2}-\d{2}$/.test(vazio.data), true);
conf('e com os cinco grupos vazios',
  Object.keys(vazio.marcados).sort().join(','), 'aprende,atencao,fortes,lacunas,rotina');
conf('nenhum marcado ainda',
  Object.keys(vazio.marcados).reduce((s, k) => s + vazio.marcados[k].length, 0), 0);
conf('cada mapeamento tem id próprio', Core.mapeamentoNovo().id === Core.mapeamentoNovo().id, false);

// ================================================================
secao('3. Aluno sem mapeamento');

const semMapa = { id: 'a1', nome: 'Cecília' };
conf('não está mapeado', Core.mapeado(semMapa), false);
conf('não tem mapeamento atual', Core.mapeamentoAtual(semMapa), 'null');
conf('nem lembrete', Core.lembreteDoMapeamento(semMapa), 'null');
conf('nem texto de lembrete', Core.textoDoLembrete(semMapa), '');
conf('a lista vem vazia', Core.mapeamentosDe(semMapa).length, 0);

// ================================================================
secao('4. Revisões: a mais recente é a que vale');

function comMarcas(data, atencao, lacunasIds, nivel) {
  const m = Core.mapeamentoNovo();
  m.data = data;
  m.marcados.atencao = atencao;
  m.marcados.lacunas = lacunasIds;
  m.nivel = nivel;
  return m;
}

const aluno = {
  id: 'a2', nome: 'Marcelo',
  mapeamentos: [
    comMarcas('2026-08-20', ['sinal', 'vespera', 'branco', 'chuta', 'dispersa'], ['fracoes', 'eq1'], '2'),
    comMarcas('2026-02-10', ['sinal', 'tabuada-fraca'], ['fracoes', 'decimais', 'inteiros'], '1')
  ]
};

conf('está mapeado', Core.mapeado(aluno), true);
conf('a lista sai em ordem de data', Core.mapeamentosDe(aluno).map(m => m.data).join(' '),
  '2026-02-10 2026-08-20');
conf('o atual é o mais recente', Core.mapeamentoAtual(aluno).data, '2026-08-20');
conf('e não o que foi inserido primeiro', Core.mapeamentoAtual(aluno).nivel, '2');

// ================================================================
secao('5. O lembrete que aparece na aula');

const l = Core.lembreteDoMapeamento(aluno);
conf('traz a data do mapeamento', l.data, '2026-08-20');
conf('traz o nível por extenso', l.nivel, 'Abaixo do que o ano pede');
conf('corta a lista para caber na tela', l.atencao.length, 4);
conf('mas informa quantos são no total', l.totalAtencao, 5);
conf('as lacunas vêm por extenso', l.lacunas.join(', '), 'Frações, Equação do primeiro grau');
conf('e com rótulo, não com id', l.atencao[0], 'Erros de sinal');

const semRuido = Object.assign({}, aluno, {
  mapeamentos: [comMarcas('2026-08-20', [], [], '')]
});
const l2 = Core.lembreteDoMapeamento(semRuido);
conf('mapeamento em branco ainda devolve lembrete', !!l2, true);
conf('só que sem nada dentro', l2.atencao.length + l2.lacunas.length, 0);

// item que saiu do catálogo não pode virar linha em branco
const comLixo = {
  id: 'a3', nome: 'Teste',
  mapeamentos: [comMarcas('2026-08-20', ['sinal', 'item-que-nao-existe'], [], '')]
};
conf('id desconhecido é descartado', Core.lembreteDoMapeamento(comLixo).atencao.join(','), 'Erros de sinal');

// ================================================================
secao('6. O lembrete em texto, para colar na anotação');

const m = Core.mapeamentoNovo();
m.marcados.atencao = ['sinal', 'vespera'];
m.marcados.lacunas = ['fracoes'];
m.marcados.aprende = ['visual'];
m.prioridades = 'Fechar frações\nCriar rotina de revisão';
const paraTexto = { id: 'a4', nome: 'Teste', mapeamentos: [m] };
const txt = Core.textoDoLembrete(paraTexto);

conf('começa pelas prioridades', txt.indexOf('Prioridades:'), 0);
conf('a quebra de linha vira ponto e vírgula', txt.indexOf('frações; Criar') > 0, true);
conf('cita as lacunas', txt.indexOf('Lacunas: Frações.') > 0, true);
conf('cita os pontos de atenção', txt.indexOf('Erros de sinal') > 0, true);
conf('e como ele aprende', txt.indexOf('Aprende melhor: Vendo') > 0, true);
conf('nenhum travessão no texto gerado', /[–—]/.test(txt), false);
conf('é uma linha só, para colar na anotação', txt.indexOf('\n'), -1);

// ================================================================
secao('7. A ficha em PDF');

const cheio = Core.mapeamentoNovo();
cheio.escola = 'Colégio Santo Inácio';
cheio.nivel = '2';
cheio.motivo = 'Nota baixa no segundo bimestre.';
cheio.prioridades = 'Fechar frações até setembro.';
cheio.plano = 'Duas semanas de base, depois voltar ao conteúdo do ano.';
Core.MAPA.forEach(g => { cheio.marcados[g.chave] = g.itens.slice(0, 5).map(i => i.id); });

const bytes = PDFGen.gerarFichaMapeamento({
  aluno: { nome: 'Marcelo Andrade' }, mapeamento: cheio,
  grupos: Core.MAPA, rotulos: Core.rotulosDoMapa,
  nivel: Core.rotuloNivel(cheio.nivel), anoEscolar: '8º ano'
});
conf('gera um PDF', String.fromCharCode(...bytes.slice(0, 4)), '%PDF');
conf('com tamanho de verdade', bytes.length > 5000, true);

const vazioPdf = PDFGen.gerarFichaMapeamento({
  aluno: { nome: 'Sem nada' }, mapeamento: Core.mapeamentoNovo(),
  grupos: Core.MAPA, rotulos: Core.rotulosDoMapa, nivel: '', anoEscolar: ''
});
conf('mapeamento vazio não quebra o PDF', String.fromCharCode(...vazioPdf.slice(0, 4)), '%PDF');
conf('e sai bem menor', vazioPdf.length < bytes.length, true);

console.log('\n' + '='.repeat(60));
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
