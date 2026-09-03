/* testa_trilha_dados.js
 * A fundação de dados das trilhas, sem navegador.
 *
 * A trilha que fecha uma lacuna é derivada do pré-requisito que cada tema já
 * declara. Isso só funciona se três coisas forem verdade, e as três são
 * conferidas aqui: o pré-requisito viaja no índice (e não só no arquivo pesado
 * da série), o grafo é sadio (sem ciclo e sem aresta apontando para tema que
 * não existe), e a aula cujo único registro é o assunto não é confundida com
 * aula vazia.
 *
 * A terceira é a que morde calado: quem manda ali é o editarSerie, que ao mudar
 * o padrão de uma repetição recria as ocorrências futuras e descarta as que
 * considera vazias.
 */
const Core = require('../core.js');
const indice = require('../banco/indice.json');
const banco = require('../temas/banco.json');

let passes = 0, falhas = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

const temasIx = indice.temas || indice;
const temasBanco = banco.temas || banco;

// ================================================================
secao('1. O pré-requisito viaja no índice');

conf('o índice tem os 148 temas', temasIx.length, temasBanco.length);

const comPre = temasIx.filter(t => t.prerequisitos && t.prerequisitos.length);
console.log('       ' + comPre.length + ' de ' + temasIx.length + ' temas declaram pré-requisito');
conf('mais de cem temas declaram pré-requisito', comPre.length > 100, true);

/* Sem esta, montar uma trilha que atravessa anos exigiria baixar até onze
 * arquivos de série, 2,4 MB, na casa da família e muitas vezes sem sinal. */
conf('nenhum registro traz a chave vazia',
  temasIx.some(t => 'prerequisitos' in t && !(t.prerequisitos || []).length), false);

// O índice e a fonte precisam contar a mesma história.
const preDoIndice = {}, preDoBanco = {};
temasIx.forEach(t => { preDoIndice[t.id] = (t.prerequisitos || []).join(','); });
temasBanco.forEach(t => { preDoBanco[t.id] = (t.prerequisitos || []).join(','); });
const divergem = Object.keys(preDoBanco).filter(id => preDoIndice[id] !== preDoBanco[id]);
conf('o grafo do índice é igual ao da fonte', divergem.join(' ') || 'nenhum', 'nenhum');

// ================================================================
secao('2. O grafo é sadio');

const existe = {};
temasIx.forEach(t => { existe[t.id] = true; });
const quebradas = [];
temasIx.forEach(t => (t.prerequisitos || []).forEach(p => {
  if (!existe[p]) quebradas.push(t.id + ' -> ' + p);
}));
conf('nenhuma aresta aponta para tema que não existe', quebradas.join(' ') || 'nenhuma', 'nenhuma');

/* Ciclo aqui não é hipótese de manual: um tema que dependesse de outro que
 * dependesse dele de volta faria a derivação da trilha girar para sempre. */
const cor = {};
let ciclo = null;
function visita(id, caminho) {
  if (ciclo) return;
  if (cor[id] === 1) { ciclo = caminho.slice(caminho.indexOf(id)).concat(id).join(' -> '); return; }
  if (cor[id] === 2) return;
  cor[id] = 1;
  const t = temasIx.filter(x => x.id === id)[0];
  (t && t.prerequisitos || []).forEach(p => visita(p, caminho.concat(id)));
  cor[id] = 2;
}
temasIx.forEach(t => visita(t.id, []));
conf('nenhum ciclo de pré-requisito', ciclo || 'nenhum', 'nenhum');

/* Profundidade: é ela que decide se a trilha cabe na tela. */
const prof = {};
function profundidade(id) {
  if (prof[id] != null) return prof[id];
  prof[id] = 0;
  const t = temasIx.filter(x => x.id === id)[0];
  const ps = (t && t.prerequisitos) || [];
  prof[id] = ps.length ? 1 + Math.max.apply(null, ps.map(profundidade)) : 0;
  return prof[id];
}
const profundidades = temasIx.map(t => profundidade(t.id));
const maisFundo = Math.max.apply(null, profundidades);
console.log('       profundidade máxima da escada: ' + maisFundo + ' níveis');
conf('a escada mais funda cabe em dez níveis', maisFundo <= 10, true);

// ================================================================
secao('3. A aula cujo único registro é o assunto não é aula vazia');

/* Este é o defeito que apaga trabalho sem avisar. O temConteudo governa o
 * editarSerie: ao mudar o padrão de uma repetição, ele recria as ocorrências
 * futuras e descarta as que considera vazias. */
const soAssunto = { id: 'x1', data: '2026-09-10', temas: [{ titulo: 'Frações' }] };
const soArea = { id: 'x2', data: '2026-09-10', areas: ['leitura'] };
const soAntiga = { id: 'x3', data: '2026-09-10', tema: { titulo: 'Frações' } };
const vazia = { id: 'x4', data: '2026-09-10' };

/* temConteudo não é exportado: quem o exerce de fora é o editarSerie, então é
 * por ele que a conferência passa, que é como o defeito apareceria de verdade. */
function sobrevive(aula) {
  const db = {
    alunos: [{ id: 'a1', nome: 'Aluna', valorHora: 100 }],
    series: [{ id: 's1', alunoId: 'a1', diaSemana: 4, inicio: '14:00', duracao: 60,
               inicioEm: '2026-09-01', fimEm: '2026-12-31' }],
    aulas: [Object.assign({ alunoId: 'a1', serieId: 's1', inicio: '14:00', duracao: 60,
                            status: 'realizada' }, aula)],
    resumos: [], mapeamentos: [], ajustes: {}
  };
  Core.editarSerie(db, 's1', { diaSemana: 4, inicio: '15:00', duracao: 60 }, '2026-09-01');
  return db.aulas.some(a => a.id === aula.id);
}

conf('a aula só com assunto sobrevive à mudança do padrão', sobrevive(soAssunto), true);
conf('a aula só com área sobrevive', sobrevive(soArea), true);
conf('a aula com o assunto antigo no singular sobrevive', sobrevive(soAntiga), true);
conf('a aula de verdade vazia continua sendo descartada', sobrevive(vazia), false);

// ================================================================
secao('4. O fechamento não parte o mesmo assunto em duas linhas');

/* O campo Outro deixa ela escrever o assunto, e aí a mesma coisa aparece com
 * caixa e acento diferentes em aulas diferentes. No documento que a família lê,
 * isso viraria duas linhas dizendo a mesma coisa. */
const db = {
  alunos: [{ id: 'a1', nome: 'Aluna Exemplo', serie: '8', valorHora: 100 }],
  aulas: [
    { id: 'l1', alunoId: 'a1', data: '2026-06-03', inicio: '14:00', duracao: 60,
      status: 'realizada', temas: [{ titulo: 'Frações' }], areas: [] },
    { id: 'l2', alunoId: 'a1', data: '2026-06-10', inicio: '14:00', duracao: 60,
      status: 'realizada', temas: [{ titulo: 'fracoes' }], areas: [] },
    { id: 'l3', alunoId: 'a1', data: '2026-06-17', inicio: '14:00', duracao: 60,
      status: 'realizada', temas: [{ titulo: 'Porcentagem' }], areas: [] }
  ],
  resumos: [], mapeamentos: [], ajustes: {}
};
const f = Core.calcularFechamento(db, 'a1', '2026-06');
const titulos = (f.temasDoMes || []).map(t => t.titulo);
conf('duas grafias do mesmo assunto viram uma linha', titulos.length, 2);
conf('a primeira grafia é a que aparece', titulos[0], 'Frações');
conf('as duas datas ficam juntas na mesma linha',
  (f.temasDoMes[0].datas || []).length, 2);
conf('o outro assunto continua separado', titulos[1], 'Porcentagem');

/* Assunto com nome de propriedade de objeto não pode derrubar a conta. */
const db2 = {
  alunos: [{ id: 'a1', nome: 'Aluna', serie: '8', valorHora: 100 }],
  aulas: [{ id: 'l1', alunoId: 'a1', data: '2026-06-03', inicio: '14:00', duracao: 60,
            status: 'realizada', temas: [{ titulo: 'constructor' }], areas: [] }],
  resumos: [], mapeamentos: [], ajustes: {}
};
let sobreviveu = true;
try { Core.calcularFechamento(db2, 'a1', '2026-06'); } catch (e) { sobreviveu = false; }
conf('assunto chamado constructor não quebra o fechamento', sobreviveu, true);

// ================================================================
console.log('\n' + '='.repeat(60));
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
