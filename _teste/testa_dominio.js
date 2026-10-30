/* testa_dominio.js
 *
 * C1: domínio por assunto em três estados ("Ainda não", "Em andamento",
 * "Domina"), marcado na aula, lido na ficha, e a regra nova da trilha: o passo
 * fecha quando o aluno DOMINA o assunto do passo, e não mais só por aula dada.
 * Sem navegador. Dados fictícios ("Aluno Alfa Teste").
 *
 * O que se prova:
 *   1. os estados e o toque que marca e desmarca;
 *   2. o quadro da ficha: o último estado por assunto e a data da última aula
 *      em que foi marcado, com o histórico; aula que não aconteceu não conta;
 *      cópia antiga sem o campo é "nada marcado";
 *   3. a regra (Core.dominioFechaPasso) e quem a usa: o passo que fecha na
 *      aula, o que nasce marcado e o lastro de cada marca; passo fechado pela
 *      regra antiga continua fechado;
 *   4. a cópia de segurança leva o domínio (ida e volta em JSON, que é o que a
 *      cópia e o "Voltar a este ponto" fazem com o documento);
 *   5. nada disso chega à família: texto, PDF e cartão do mês, com controle
 *      positivo (o título do assunto TEM de estar lá).
 *
 * VENENO. A regra grava e decide, então a prova da seção 3 roda também contra
 * cópias do core.js com a regra trocada, e cada cópia TEM de reprovar:
 *   - aula-dada: a regra de antes do C1, que fecha o passo por aula dada;
 *   - andamento-fecha: qualquer marca fecha, não só "Domina";
 *   - nunca-fecha: o outro extremo, que nenhuma prova de "não fecha" pegaria.
 * Antes dos venenos, o core.js de verdade é carregado pelo MESMO carregador
 * dos venenos e tem de passar: sem isso, um carregador quebrado faria todo
 * veneno "reprovar" sem provar nada.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Core = require('../core.js');
const PDFGen = require('../pdf.js');
const Cartao = require('../cartao.js');

let passes = 0, falhas = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + JSON.stringify(obtido) + ' | esperado: ' + JSON.stringify(esperado) + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

const ALUNO = 'al_alfa';
// os três primeiros passos da escada até "Operações com frações" (MAT06-06)
const T1 = { id: 'MAT06-01', titulo: 'Sistema de numeração decimal' };
const T2 = { id: 'MAT06-02', titulo: 'Operações com números naturais' };
const T3 = { id: 'MAT06-03', titulo: 'Múltiplos, divisores, MMC e MDC' };

function item(t, dominio) {
  const x = { id: t.id, titulo: t.titulo, fonte: 'banco', disciplina: 'matematica' };
  if (dominio) x.dominio = dominio;
  return x;
}
function aula(id, data, temas, status) {
  return { id: id, alunoId: ALUNO, data: data, hora: '10:00', duracaoMin: 60, status: status || 'realizada',
    cobravel: true, serieId: null, destacada: false, anexos: [], areas: [], temas: temas,
    notaTexto: '', notaPrivada: '', temNota: false };
}
function trilha(C) {
  return C.criarTrilha({
    alunoId: ALUNO, titulo: 'Operações com frações', alvoId: 'MAT06-06', criadaEm: '2026-06-01',
    passos: [T1, T2, T3].map(t => ({ temaId: t.id, titulo: t.titulo, serie: '06', duracaoMin: 60, feitoEm: null, aulaId: null }))
  });
}

// ================================================================
secao('1. Os três estados, e o toque que marca e desmarca');

conf('três estados, na ordem em que o aluno anda', Core.DOMINIO.map(d => d.rotulo), ['Ainda não', 'Em andamento', 'Domina']);
conf('os ids gravados', Core.DOMINIO.map(d => d.id), ['nao', 'andamento', 'domina']);
const it = item(T1);
conf('item sem o campo é nada marcado', Core.estadoDeDominio(it), '');
conf('um toque marca', Core.marcarDominio(it, 'andamento'), 'andamento');
conf('e grava no item', it.dominio, 'andamento');
conf('tocar em outro troca', Core.marcarDominio(it, 'domina'), 'domina');
conf('tocar de novo no marcado desmarca', Core.marcarDominio(it, 'domina'), '');
conf('e o campo sai do item, em vez de ficar vazio', 'dominio' in it, false);
conf('estado que não existe não grava nada', Core.marcarDominio(it, 'talvez'), '');
it.dominio = 'quase';
conf('valor estranho gravado é lido como nada marcado', Core.estadoDeDominio(it), '');

// ================================================================
secao('2. O quadro da ficha: o último estado por assunto, e a data');

function dbDoQuadro() {
  return {
    alunos: [{ id: ALUNO, nome: 'Aluno Alfa Teste' }],
    aulas: [
      aula('q1', '2026-09-02', [item(T1, 'nao'), item(T2)]),
      aula('q2', '2026-09-09', [item(T1, 'andamento')]),
      aula('q3', '2026-09-16', [item(T1, 'domina'), item(T3, 'andamento')]),
      // a mais nova de todas, mas cancelada: não conta
      aula('q4', '2026-09-23', [item(T1, 'nao')], 'cancelada'),
      // falta sem aviso também não
      aula('q5', '2026-09-24', [item(T3, 'domina')], 'falta'),
      // assunto escrito à mão, sem id: a chave é o título
      aula('q6', '2026-09-10', [{ titulo: 'Leitura de gráficos do jornal', fonte: 'livre', dominio: 'andamento' }]),
      // outro aluno, mesmo assunto
      Object.assign(aula('q7', '2026-09-30', [item(T1, 'nao')]), { alunoId: 'al_beta' })
    ]
  };
}
const quadro = Core.dominioPorAssunto(dbDoQuadro(), ALUNO);
const porChave = {};
quadro.forEach(l => { porChave[l.chave] = l; });
conf('um assunto por linha, só os que têm marca', quadro.map(l => l.chave).sort(),
  ['MAT06-01', 'MAT06-03', 'titulo:leitura de graficos do jornal'].sort());
conf('assunto dado sem marca nenhuma não entra', !!porChave['MAT06-02'], false);
conf('o último estado de MAT06-01 é Domina (a cancelada depois não conta)', porChave['MAT06-01'].estado, 'domina');
conf('com a data da última aula em que foi marcado', porChave['MAT06-01'].data, '2026-09-16');
conf('e a aula', porChave['MAT06-01'].aulaId, 'q3');
conf('o histórico, da mais antiga para a mais nova', porChave['MAT06-01'].historico.map(h => h.estado + '@' + h.data),
  ['nao@2026-09-02', 'andamento@2026-09-09', 'domina@2026-09-16']);
conf('falta sem aviso não conta: MAT06-03 fica em andamento', porChave['MAT06-03'].estado, 'andamento');
conf('o título vem do item', porChave['MAT06-01'].titulo, T1.titulo);
conf('assunto à mão entra pelo título', porChave['titulo:leitura de graficos do jornal'].estado, 'andamento');
conf('outro aluno não mistura', Core.dominioPorAssunto(dbDoQuadro(), 'al_beta').map(l => l.estado), ['nao']);
conf('a lista sai da marca mais nova para a mais antiga', quadro.map(l => l.data),
  ['2026-09-16', '2026-09-16', '2026-09-10']);

/* Cópia antiga: o documento de antes do C1 não tem o campo em item nenhum. */
const antigo = dbDoQuadro();
antigo.aulas.forEach(a => a.temas.forEach(t => { delete t.dominio; }));
conf('cópia antiga sem o campo: nada marcado, sem erro', Core.dominioPorAssunto(antigo, ALUNO), []);
conf('aula com "tema" no formato antigo não quebra',
  Core.dominioPorAssunto({ aulas: [{ id: 'x', alunoId: ALUNO, data: '2026-01-01', tema: { titulo: 'Velho' } }] }, ALUNO), []);
conf('banco vazio não quebra', Core.dominioPorAssunto({}, ALUNO), []);

// ================================================================
/* A seção da REGRA. Recebe o Core por parâmetro para rodar igual contra o
 * core.js de verdade e contra cada veneno. Devolve quantas falharam. */
function provasDaRegra(C, conferir) {
  // a regra, crua
  const comItem = (dom, st) => aula('r', '2026-10-01', [item(T1, dom)], st);
  conferir('Domina em aula realizada fecha', C.dominioFechaPasso(comItem('domina'), T1.id), true);
  conferir('Domina em reposição fecha', C.dominioFechaPasso(comItem('domina', 'reposicao'), T1.id), true);
  conferir('Em andamento não fecha', C.dominioFechaPasso(comItem('andamento'), T1.id), false);
  conferir('Ainda não não fecha', C.dominioFechaPasso(comItem('nao'), T1.id), false);
  conferir('assunto só dado, sem marca, não fecha (era a regra antiga)', C.dominioFechaPasso(comItem(''), T1.id), false);
  conferir('Domina em aula cancelada não fecha', C.dominioFechaPasso(comItem('domina', 'cancelada'), T1.id), false);
  conferir('Domina em falta sem aviso não fecha', C.dominioFechaPasso(comItem('domina', 'falta'), T1.id), false);
  conferir('Domina em OUTRO assunto não fecha este', C.dominioFechaPasso(comItem('domina'), T2.id), false);

  // o passo que fecha na aula
  const al = { id: ALUNO, trilhas: [trilha(C)] };
  const i1 = item(T1);
  const a1 = aula('p1', '2026-10-01', [i1]);
  conferir('na aula: assunto registrado sem marca não anda a trilha', C.marcarPassoPorAssunto(al, a1, i1), null);
  i1.dominio = 'andamento';
  conferir('na aula: Em andamento não anda', C.marcarPassoPorAssunto(al, a1, i1), null);
  conferir('nenhum passo fechado até aqui', C.passosFeitos(al.trilhas[0]), 0);
  i1.dominio = 'domina';
  const andou = C.marcarPassoPorAssunto(al, a1, i1);
  conferir('na aula: Domina anda', !!andou, true);
  conferir('o passo fechado é o do assunto', andou ? andou.passo.temaId : null, T1.id);
  conferir('com a data da aula', al.trilhas[0].passos[0].feitoEm, '2026-10-01');
  conferir('marcado como fechado por domínio', al.trilhas[0].passos[0].porDominio, true);

  // o passo que nasce marcado
  const dbNasce = { aulas: [
    aula('n1', '2026-08-01', [item(T1, 'domina')]),
    aula('n2', '2026-08-08', [item(T2)]),
    aula('n3', '2026-08-15', [item(T3, 'andamento')])
  ] };
  const nascidos = C.marcarOQueJaFoiDado(dbNasce, ALUNO, trilha(C).passos);
  conferir('nasce marcado só o que ele dominava', nascidos.filter(p => p.feitoEm).map(p => p.temaId), [T1.id]);

  // o lastro de cada marca
  const fechado = { temaId: T1.id, feitoEm: '2026-10-01', aulaId: 'l1', porDominio: true };
  const aulaL = (dom) => aula('l1', '2026-10-01', [item(T1, dom)]);
  conferir('lastro: fechado por domínio, ainda Domina, vale', C.marcaDoPassoValeAinda(fechado, aulaL('domina')), true);
  conferir('lastro: tirou o Domina, solta', C.marcaDoPassoValeAinda(fechado, aulaL('')), false);
  conferir('lastro: trocou para Em andamento, solta', C.marcaDoPassoValeAinda(fechado, aulaL('andamento')), false);
  conferir('lastro: aula excluída, solta', C.marcaDoPassoValeAinda(fechado, undefined), false);
  /* Passo fechado pela regra antiga (sem porDominio): continua fechado
   * enquanto a aula registrar o assunto, com ou sem marca de domínio. */
  const antigoP = { temaId: T1.id, feitoEm: '2026-05-01', aulaId: 'l1' };
  conferir('regra antiga: o que estava fechado continua fechado, sem marca', C.marcaDoPassoValeAinda(antigoP, aulaL('')), true);
  conferir('regra antiga: e com Em andamento também', C.marcaDoPassoValeAinda(antigoP, aulaL('andamento')), true);
  conferir('regra antiga: tirar o assunto da aula ainda solta, como sempre',
    C.marcaDoPassoValeAinda(antigoP, aula('l1', '2026-05-01', [])), false);
  conferir('marcado à mão, sem aula, vale', C.marcaDoPassoValeAinda({ temaId: T1.id, feitoEm: '2026-05-01', aulaId: null }, null), true);
}

secao('3. A regra que fecha o passo da trilha, e quem a usa');
provasDaRegra(Core, conf);

// ================================================================
secao('4. A cópia de segurança leva o domínio');

/* A cópia (Store.exportarTudo) leva `dados: db` inteiro em JSON, e restaurar
 * e "Voltar a este ponto" devolvem o documento inteiro: o domínio mora no item
 * do assunto, dentro de aula.temas, e viaja sem caminho próprio. */
const original = dbDoQuadro();
const voltou = JSON.parse(JSON.stringify({ formato: 'apoio-educacional', versao: 1, dados: original })).dados;
conf('o quadro depois da ida e volta é o mesmo', Core.dominioPorAssunto(voltou, ALUNO), Core.dominioPorAssunto(original, ALUNO));
conf('e o campo está no item, onde foi marcado', voltou.aulas[2].temas[0].dominio, 'domina');

// ================================================================
secao('5. Nada disso chega à família (texto, PDF e cartão)');

function textoDoPdf(bytes) {
  const bruto = Buffer.from(bytes).toString('latin1');
  const rx = /\(((?:\\.|[^\\()])*)\)\s*Tj/g;
  const partes = [];
  let m;
  while ((m = rx.exec(bruto))) partes.push(m[1].replace(/\\([\\()])/g, '$1'));
  return partes.join(' ');
}
const dbFamilia = {
  alunos: [{ id: ALUNO, nome: 'Aluno Alfa Teste', responsavel: 'Responsavel Alfa', ativo: true,
    precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 100 }] }],
  series: [], resumos: [], ajustes: {},
  aulas: [
    aula('f1', '2026-09-02', [item({ id: 'MAT06-01', titulo: 'Sistema decimal Alfa' }, 'nao')]),
    aula('f2', '2026-09-09', [item({ id: 'MAT06-02', titulo: 'Naturais Alfa' }, 'andamento')]),
    aula('f3', '2026-09-16', [item({ id: 'MAT06-03', titulo: 'Multiplos Alfa' }, 'domina')])
  ]
};
const fFam = Core.calcularFechamento(dbFamilia, ALUNO, '2026-09', '2026-09-30');
const PROIBIDAS = /domin|andamento|ainda n/i;
function varrer(nome, texto) {
  // controle positivo: o instrumento vê os assuntos, então a ausência quer dizer alguma coisa
  conf(nome + ': os três assuntos estão lá (o instrumento vê)',
    ['Sistema decimal Alfa', 'Naturais Alfa', 'Multiplos Alfa'].every(t => texto.indexOf(t) >= 0), true);
  const achou = texto.match(PROIBIDAS);
  conf(nome + ': nenhuma palavra do domínio', achou ? achou[0] : null, null);
}
varrer('texto do fechamento', Core.markdownFechamento(fFam, { exibirTemasEAreas: true }));
varrer('PDF do fechamento', textoDoPdf(PDFGen.gerarFechamento(fFam, { exibirTemasEAreas: true })));
varrer('cartão do mês', JSON.stringify(Cartao.montar(fFam, {})));
/* E o próprio instrumento acusa quando a palavra está lá: a regex não é cega. */
conf('a varredura acusa "Domina" quando ele aparece (controle)', !!'Sistema decimal Alfa: Domina'.match(PROIBIDAS), true);

// ================================================================
secao('6. VENENO: cópias do core.js com a regra trocada TÊM de reprovar');

/* O final de linha do disco depende do checkout (autocrlf no Windows): a
 * fonte é lida com \r\n trocado por \n, e o controle carrega ESTA mesma fonte
 * normalizada, então a troca não muda o que se prova. */
const FONTE = fs.readFileSync(path.join(__dirname, '..', 'core.js'), 'utf8').replace(/\r\n/g, '\n');
function carregar(fonte, nome) {
  const m = { exports: {} };
  vm.runInNewContext(fonte, { module: m, console: console }, { filename: nome });
  return m.exports;
}
const INICIO = 'function dominioFechaPasso(aula, temaId) {';
function envenenar(corpo) {
  const i = FONTE.indexOf(INICIO);
  if (i < 0 || FONTE.indexOf(INICIO, i + 1) >= 0) return null;
  const fim = FONTE.indexOf('\n  }\n', i);
  if (fim < 0) return null;
  return FONTE.slice(0, i) + INICIO + '\n' + corpo + FONTE.slice(fim);
}
function contarFalhas(C) {
  let n = 0;
  provasDaRegra(C, (rotulo, obtido, esperado) => {
    if (JSON.stringify(obtido) !== JSON.stringify(esperado)) n++;
  });
  return n;
}

// controle: o carregador dos venenos, com o core.js de verdade, passa
let controle;
try { controle = contarFalhas(carregar(FONTE, 'core_de_verdade.js')); } catch (e) { controle = 'erro: ' + e.message; }
conf('controle: o core.js de verdade, pelo carregador dos venenos, passa em tudo', controle, 0);

const VENENOS = {
  'aula-dada': '    if (!aula || !temaId || !aulaAconteceu(aula)) return false;\n' +
    '    return temasDaAula(aula).some(function (t) { return t && t.id === temaId; });',
  'andamento-fecha': '    if (!aula || !temaId || !aulaAconteceu(aula)) return false;\n' +
    '    return temasDaAula(aula).some(function (t) { return t && t.id === temaId && !!estadoDeDominio(t); });',
  'nunca-fecha': '    return false;'
};
Object.keys(VENENOS).forEach(nome => {
  const fonte = envenenar(VENENOS[nome]);
  conf('veneno ' + nome + ': a troca da regra foi aplicada', fonte !== null && fonte !== FONTE, true);
  if (!fonte) return;
  let n;
  try { n = contarFalhas(carregar(fonte, 'core_' + nome + '.js')); } catch (e) { n = 'erro: ' + e.message; }
  console.log('       veneno ' + nome + ': ' + n + ' prova(s) da regra reprovaram');
  conf('veneno ' + nome + ': reprova (veneno visto)', typeof n === 'number' && n > 0, true);
});

// ================================================================
console.log('\n' + '='.repeat(60));
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
