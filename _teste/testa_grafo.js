/* testa_grafo.js
 * O grafo de pré-requisitos de matemática (C7, entrega 1, 30/10/2026), sem navegador.
 *
 * banco/topicos/matematica.json declara, em cada um dos 148 assuntos, os
 * pré-requisitos IMEDIATOS: o que o aluno precisa saber logo antes. A cadeia
 * inteira sai da transitividade, e é dela que a trilha (core.js,
 * trilhaDerivada) tira a escada. O que este arquivo prova sobre o grafo:
 *
 *   1. todo id citado como pré-requisito existe;
 *   2. não há ciclo: a ordenação topológica (Kahn) coloca os 148 na fila;
 *   3. nenhum pré-requisito é de ano posterior ao do assunto;
 *   4. nenhuma aresta é redundante pela transitividade (se A precisa de B e B
 *      de C, A não lista C), fora as da lista explícita de exceções, com motivo;
 *   5. raízes (sem pré-requisito) só no 2º ano;
 *   6. os ids, os anos e os títulos são os mesmos de antes da revisão
 *      (commit 82bf848): o C7 só mexe em `prerequisitos`.
 *
 * VENENO: cópias do índice com um ciclo, com aresta para ano posterior, com
 * aresta redundante e com id inexistente TÊM de reprovar nas conferências
 * certas. Prova que o instrumento vê antes de acreditar no zero.
 */
const fs = require('fs');
const path = require('path');
/* --arquivo <caminho> aponta o teste para OUTRO índice: é assim que se prova,
 * de fora, que uma cópia envenenada do arquivo reprova o teste inteiro. */
const iArq = process.argv.indexOf('--arquivo');
const ARQ = iArq >= 0 ? process.argv[iArq + 1] : path.join(__dirname, '..', 'banco', 'topicos', 'matematica.json');
const indice = JSON.parse(fs.readFileSync(ARQ, 'utf8'));
const temas = indice.temas;

let passes = 0, falhas = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

const ORDEM_SERIE = ['02', '03', '04', '05', '06', '07', '08', '09', 'em1', 'em2', 'em3'];

/* Arestas redundantes deixadas de propósito: "A<-C" com o motivo. Hoje nenhuma:
 * em toda revisão o que C dava a A já vinha por B. Se um dia uma entrar aqui, o
 * motivo tem de dizer por que C é usado DIRETAMENTE em A. */
const REDUNDANTES_DE_PROPOSITO = {};

/* ------------------------------------------------------------------ o analisador */
function analisa(lista) {
  const porId = {};
  lista.forEach(t => { porId[t.id] = t; });
  const r = { inexistentes: [], posteriores: [], redundantes: [], raizesForaDo2: [], ciclo: null, ordem: [], profundidade: 0 };

  lista.forEach(t => (t.prerequisitos || []).forEach(p => {
    if (!porId[p]) { r.inexistentes.push(t.id + '<-' + p); return; }
    if (ORDEM_SERIE.indexOf(porId[p].serie) > ORDEM_SERIE.indexOf(t.serie)) r.posteriores.push(t.id + '<-' + p);
  }));

  // Kahn: grau de entrada = quantos pré-requisitos existentes; quem fica de fora está num ciclo
  const grau = {}, saiDe = {};
  lista.forEach(t => { grau[t.id] = 0; saiDe[t.id] = []; });
  lista.forEach(t => (t.prerequisitos || []).forEach(p => {
    if (!porId[p]) return;
    grau[t.id]++;
    saiDe[p].push(t.id);
  }));
  const fila = lista.filter(t => !grau[t.id]).map(t => t.id);
  while (fila.length) {
    const atual = fila.shift();
    r.ordem.push(atual);
    saiDe[atual].forEach(v => { if (--grau[v] === 0) fila.push(v); });
  }
  if (r.ordem.length < lista.length) {
    r.ciclo = lista.map(t => t.id).filter(id => r.ordem.indexOf(id) < 0).join(',');
    return r;   // fecho e profundidade só fazem sentido sem ciclo
  }

  // fecho transitivo na ordem topológica, e profundidade
  const fecho = {}, prof = {};
  r.ordem.forEach(id => {
    const s = new Set();
    let p = 0;
    (porId[id].prerequisitos || []).forEach(q => {
      if (!porId[q]) return;
      s.add(q);
      fecho[q].forEach(x => s.add(x));
      p = Math.max(p, prof[q] + 1);
    });
    fecho[id] = s;
    prof[id] = p;
    r.profundidade = Math.max(r.profundidade, p);
  });
  lista.forEach(t => {
    const pres = (t.prerequisitos || []).filter(q => porId[q]);
    pres.forEach(p => {
      const via = pres.filter(q => q !== p && fecho[q].has(p));
      if (via.length && !REDUNDANTES_DE_PROPOSITO[t.id + '<-' + p]) r.redundantes.push(t.id + '<-' + p + ' (já vem por ' + via.join(',') + ')');
    });
  });
  r.raizesForaDo2 = lista.filter(t => !(t.prerequisitos || []).length && t.serie !== '02').map(t => t.id);
  r.raizes = lista.filter(t => !(t.prerequisitos || []).length).map(t => t.id);
  return r;
}

/* ------------------------------------------------------------------ 1 a 5: o grafo de verdade */
secao('1. O grafo gravado');

conf('o índice tem os 148 assuntos', temas.length, 148);
conf('o cabeçalho diz que o grafo foi revisado no C7', /revisado no C7 em 30\/10\/2026/.test(indice.prerequisitos_origem || ''), true);
conf('todo registro traz a lista de pré-requisitos', temas.every(t => Array.isArray(t.prerequisitos)), true);
conf('nenhum assunto repete um pré-requisito na própria lista',
  temas.filter(t => new Set(t.prerequisitos).size !== t.prerequisitos.length).map(t => t.id).join(',') || 'nenhum', 'nenhum');

const g = analisa(temas);
const arestas = temas.reduce((n, t) => n + t.prerequisitos.length, 0);
console.log('       ' + arestas + ' arestas, ' + temas.filter(t => t.prerequisitos.length).length + ' assuntos com pré-requisito');
conf('todo id de pré-requisito existe', g.inexistentes.join(' ') || 'todos existem', 'todos existem');
conf('nenhum ciclo: a ordem topológica tem os 148', g.ciclo || ('completa com ' + g.ordem.length), 'completa com 148');
conf('nenhum pré-requisito de ano posterior', g.posteriores.join(' ') || 'nenhum', 'nenhum');
conf('nenhuma aresta redundante pela transitividade (fora as declaradas)', g.redundantes.slice(0, 5).join(' ; ') || 'nenhuma', 'nenhuma');
conf('toda redundância declarada de propósito existe no grafo',
  Object.keys(REDUNDANTES_DE_PROPOSITO).filter(a => {
    const [id, p] = a.split('<-');
    const t = temas.filter(x => x.id === id)[0];
    return !t || t.prerequisitos.indexOf(p) < 0;
  }).join(',') || 'todas', 'todas');
console.log('       raízes: ' + g.raizes.join(', ') + '; profundidade máxima: ' + g.profundidade);
conf('raízes só no 2º ano', g.raizesForaDo2.join(' ') || 'só no 2º', 'só no 2º');
conf('há pelo menos uma raiz', g.raizes.length > 0, true);
conf('a cadeia atravessa os anos (profundidade entre 11 e 40)', g.profundidade >= 11 && g.profundidade <= 40, true);

/* A ordem topológica respeita o que ela promete: ninguém antes de um
 * pré-requisito seu. Medido sobre a ordem devolvida, e não suposto. */
const posicao = {};
g.ordem.forEach((id, i) => { posicao[id] = i; });
const invertidos = [];
temas.forEach(t => t.prerequisitos.forEach(p => { if (posicao[p] > posicao[t.id]) invertidos.push(t.id + '<-' + p); }));
conf('na ordem topológica, todo pré-requisito vem antes de quem o cita', invertidos.join(' ') || 'nenhum invertido', 'nenhum invertido');

/* ------------------------------------------------------------------ 6: ids, anos e títulos congelados */
secao('2. Ids, anos e títulos são os de antes da revisão (82bf848)');

const CONGELADO = [
  'MAT02-01|02|Números até 100: ler, escrever e comparar',
  'MAT02-02|02|Adição até 100',
  'MAT02-03|02|Subtração até 100',
  'MAT02-04|02|Dobro, metade e triplo',
  'MAT02-05|02|Sequências e padrões numéricos',
  'MAT02-06|02|Figuras planas: reconhecer e nomear',
  'MAT02-07|02|Sólidos geométricos no dia a dia',
  'MAT02-08|02|Medindo comprimentos',
  'MAT02-09|02|Horas, dias e meses',
  'MAT02-10|02|Dinheiro: moedas e cédulas',
  'MAT02-11|02|Tabelas e gráficos simples',
  'MAT02-12|02|Problemas do dia a dia',
  'MAT03-01|03|Números até 1000 e valor posicional',
  'MAT03-02|03|Adição com reagrupamento',
  'MAT03-03|03|Subtração com reagrupamento',
  'MAT03-04|03|Multiplicação: a ideia e a tabuada',
  'MAT03-05|03|Divisão: repartir em partes iguais',
  'MAT03-06|03|Metade, terço e quarto',
  'MAT03-07|03|Figuras planas e seus lados',
  'MAT03-08|03|Metro e centímetro',
  'MAT03-09|03|Massa e capacidade',
  'MAT03-10|03|Dinheiro e troco',
  'MAT03-11|03|Relógio e calendário',
  'MAT03-12|03|Gráficos de barras',
  'MAT04-01|04|Números até 10.000 e valor posicional',
  'MAT04-02|04|Adição e subtração com números grandes',
  'MAT04-03|04|Multiplicação por dois algarismos',
  'MAT04-04|04|Divisão com resto',
  'MAT04-05|04|Frações: comparar e encontrar equivalentes',
  'MAT04-06|04|Números decimais com dinheiro e medidas',
  'MAT04-07|04|Retas, ângulos e giros',
  'MAT04-08|04|Polígonos e simetria',
  'MAT04-09|04|Perímetro e área',
  'MAT04-10|04|Unidades de medida e transformações',
  'MAT04-11|04|Possível, impossível e provável',
  'MAT04-12|04|Gráficos e média simples',
  'MAT05-01|05|Números até 100.000 e o sistema decimal',
  'MAT05-02|05|As quatro operações com naturais',
  'MAT05-03|05|Frações com o mesmo denominador',
  'MAT05-04|05|Frações e decimais: a mesma ideia',
  'MAT05-05|05|Operações com decimais',
  'MAT05-06|05|Porcentagem: primeiros passos',
  'MAT05-07|05|Múltiplos e divisores',
  'MAT05-08|05|Sólidos e suas planificações',
  'MAT05-09|05|Perímetro, área e volume',
  'MAT05-10|05|Transformando unidades de medida',
  'MAT05-11|05|Localização e plano cartesiano',
  'MAT05-12|05|Média, tabelas e gráficos',
  'MAT06-01|06|Sistema de numeração decimal',
  'MAT06-02|06|Operações com números naturais',
  'MAT06-03|06|Múltiplos, divisores, MMC e MDC',
  'MAT06-04|06|Números primos e fatoração',
  'MAT06-05|06|Frações: o que são e como comparar',
  'MAT06-06|06|Operações com frações',
  'MAT06-07|06|Números decimais e suas operações',
  'MAT06-08|06|Porcentagem no dia a dia',
  'MAT06-09|06|Ângulos e retas',
  'MAT06-10|06|Polígonos e sua classificação',
  'MAT06-11|06|Perímetro e área de figuras planas',
  'MAT06-12|06|Volume e unidades de medida',
  'MAT06-13|06|Plano cartesiano',
  'MAT06-14|06|Tabelas, gráficos e média',
  'MAT07-01|07|Números inteiros e a reta numérica',
  'MAT07-02|07|Operações com números inteiros',
  'MAT07-03|07|Números racionais e suas formas',
  'MAT07-04|07|Operações com racionais',
  'MAT07-05|07|Razão e proporção',
  'MAT07-06|07|Regra de três simples',
  'MAT07-07|07|Porcentagem e juros simples',
  'MAT07-08|07|Sequências e regularidades',
  'MAT07-09|07|Linguagem algébrica e expressões',
  'MAT07-10|07|Equações do 1º grau',
  'MAT07-11|07|Ângulos: medir, somar e classificar',
  'MAT07-12|07|Triângulos e quadriláteros',
  'MAT07-13|07|Área e perímetro de figuras compostas',
  'MAT07-14|07|Média, moda, mediana e probabilidade',
  'MAT08-01|08|Potenciação e suas propriedades',
  'MAT08-02|08|Notação científica',
  'MAT08-03|08|Radiciação e raízes',
  'MAT08-04|08|Dízimas periódicas e fração geratriz',
  'MAT08-05|08|Expressões algébricas e monômios',
  'MAT08-06|08|Produtos notáveis',
  'MAT08-07|08|Fatoração de polinômios',
  'MAT08-08|08|Frações algébricas',
  'MAT08-09|08|Equações com duas incógnitas',
  'MAT08-10|08|Sistemas de equações do 1º grau',
  'MAT08-11|08|Ângulos em retas paralelas',
  'MAT08-12|08|Congruência de triângulos',
  'MAT08-13|08|Círculo: comprimento e área',
  'MAT08-14|08|Média ponderada e probabilidade',
  'MAT09-01|09|Números reais e irracionais',
  'MAT09-02|09|Potências com expoente negativo e fracionário',
  'MAT09-03|09|Radicais: operações e racionalização',
  'MAT09-04|09|Equação do 2º grau: como resolver',
  'MAT09-05|09|Equação do 2º grau: problemas',
  'MAT09-06|09|Relações métricas no triângulo retângulo',
  'MAT09-07|09|Teorema de Pitágoras',
  'MAT09-08|09|Semelhança e Teorema de Tales',
  'MAT09-09|09|Seno, cosseno e tangente',
  'MAT09-10|09|Funções: a ideia e o gráfico',
  'MAT09-11|09|Circunferência: ângulos e arcos',
  'MAT09-12|09|Volume de cilindros e outros sólidos',
  'MAT09-13|09|Medidas de tendência e de dispersão',
  'MAT09-14|09|Probabilidade de eventos sucessivos',
  'MATEM1-01|em1|Conjuntos numéricos',
  'MATEM1-02|em1|Função: domínio, contradomínio e imagem',
  'MATEM1-03|em1|Função afim',
  'MATEM1-04|em1|Função quadrática',
  'MATEM1-05|em1|Inequações do 1º e do 2º grau',
  'MATEM1-06|em1|Função modular',
  'MATEM1-07|em1|Função exponencial',
  'MATEM1-08|em1|Logaritmos: definição e propriedades',
  'MATEM1-09|em1|Função logarítmica',
  'MATEM1-10|em1|Progressão aritmética',
  'MATEM1-11|em1|Progressão geométrica',
  'MATEM1-12|em1|Sequências e recorrência',
  'MATEM1-13|em1|Estatística descritiva',
  'MATEM1-14|em1|Trigonometria no triângulo retângulo',
  'MATEM1-15|em1|Função composta',
  'MATEM2-01|em2|Ciclo trigonométrico',
  'MATEM2-02|em2|Funções trigonométricas',
  'MATEM2-03|em2|Lei dos senos e lei dos cossenos',
  'MATEM2-04|em2|Matrizes e suas operações',
  'MATEM2-05|em2|Determinantes',
  'MATEM2-06|em2|Sistemas lineares',
  'MATEM2-07|em2|Princípio fundamental da contagem',
  'MATEM2-08|em2|Arranjos, permutações e combinações',
  'MATEM2-09|em2|Binômio de Newton',
  'MATEM2-10|em2|Probabilidade',
  'MATEM2-11|em2|Prismas e pirâmides',
  'MATEM2-12|em2|Cilindros, cones e esferas',
  'MATEM2-13|em2|Juros compostos',
  'MATEM2-14|em2|Distribuições e dispersão',
  'MATEM2-15|em2|Identidades trigonométricas: adição de arcos e arco duplo',
  'MATEM3-01|em3|Geometria analítica: ponto e distância',
  'MATEM3-02|em3|Geometria analítica: a reta',
  'MATEM3-03|em3|Geometria analítica: a circunferência',
  'MATEM3-04|em3|Cônicas',
  'MATEM3-05|em3|Números complexos: forma algébrica',
  'MATEM3-06|em3|Números complexos: forma trigonométrica',
  'MATEM3-07|em3|Polinômios: operações e divisão',
  'MATEM3-08|em3|Equações polinomiais e raízes',
  'MATEM3-09|em3|Noção de limite e continuidade',
  'MATEM3-10|em3|Revisão: funções e gráficos',
  'MATEM3-11|em3|Revisão: contagem e probabilidade',
  'MATEM3-12|em3|Revisão: geometria plana e espacial',
  'MATEM3-13|em3|Matemática financeira aplicada',
  'MATEM3-14|em3|Interpretação de dados e gráficos',
];
conf('a lista congelada tem 148 linhas', CONGELADO.length, 148);
const deHoje = temas.map(t => t.id + '|' + t.serie + '|' + t.pt.titulo);
const diferentes = [];
for (let i = 0; i < Math.max(deHoje.length, CONGELADO.length); i++) {
  if (deHoje[i] !== CONGELADO[i]) diferentes.push((CONGELADO[i] || '(nada)') + ' => ' + (deHoje[i] || '(nada)'));
}
conf('id, ano e título de cada assunto, na mesma ordem, são os de 82bf848',
  diferentes.slice(0, 3).join(' ; ') || 'iguais', 'iguais');

/* ------------------------------------------------------------------ veneno */
secao('3. Veneno: o analisador reprova o que tem de reprovar');

const copia = () => JSON.parse(JSON.stringify(temas));
const acha = (lista, id) => lista.filter(t => t.id === id)[0];

// o grafo limpo passa em tudo (controle positivo do controle)
const limpo = analisa(copia());
conf('controle: a cópia fiel passa em todas as conferências',
  !limpo.ciclo && !limpo.inexistentes.length && !limpo.posteriores.length && !limpo.redundantes.length && !limpo.raizesForaDo2.length, true);

// ciclo: MAT02-01 passa a depender de MAT09-04, que depende (pela cadeia) de MAT02-01
const v1 = copia();
acha(v1, 'MAT02-01').prerequisitos = ['MAT09-04'];
const r1 = analisa(v1);
conf('veneno ciclo: a ordem topológica fica incompleta', !!r1.ciclo, true);
conf('veneno ciclo: a fila acusa MAT02-01 e MAT09-04 entre os presos', r1.ciclo.indexOf('MAT02-01') >= 0 && r1.ciclo.indexOf('MAT09-04') >= 0, true);
conf('veneno ciclo: o mesmo veneno é também aresta de ano posterior', r1.posteriores.join(','), 'MAT02-01<-MAT09-04');

// ciclo curto, de dois, sem mexer em ano: MAT06-05 <-> MAT06-06
const v1b = copia();
acha(v1b, 'MAT06-05').prerequisitos.push('MAT06-06');
const r1b = analisa(v1b);
conf('veneno ciclo de dois no mesmo ano: reprova', !!r1b.ciclo && r1b.ciclo.indexOf('MAT06-05') >= 0 && r1b.ciclo.indexOf('MAT06-06') >= 0, true);
conf('veneno ciclo de dois: e sem aresta de ano posterior, só o ciclo acusa', r1b.posteriores.length, 0);

// ano posterior sem ciclo: MAT03-11 (relógio e calendário, 3º, de que ninguém depende)
// passa a pedir MAT04-11 (possível e provável, 4º, cuja cadeia não passa por MAT03-11)
const v2 = copia();
acha(v2, 'MAT03-11').prerequisitos.push('MAT04-11');
const r2 = analisa(v2);
conf('veneno ano posterior: acusa a aresta certa', r2.posteriores.join(','), 'MAT03-11<-MAT04-11');
conf('veneno ano posterior: e isso não é ciclo, só a regra do ano o pega', r2.ciclo, null);

// ano posterior do médio para o fundamental, com a série em letras
const v2b = copia();
acha(v2b, 'MAT09-13').prerequisitos.push('MATEM1-13');
const r2b = analisa(v2b);
conf('veneno ano posterior com série em1: reprova (a ordem dos anos não é alfabética)', r2b.posteriores.length >= 1 && r2b.posteriores.indexOf('MAT09-13<-MATEM1-13') >= 0, true);

// redundância: MAT02-12 (problemas) volta a listar MAT02-02, que já vem por MAT02-03
const v3 = copia();
acha(v3, 'MAT02-12').prerequisitos.push('MAT02-02');
const r3 = analisa(v3);
conf('veneno redundância: acusa a aresta que já vem pela cadeia', r3.redundantes.join(','), 'MAT02-12<-MAT02-02 (já vem por MAT02-03)');

// id inexistente
const v4 = copia();
acha(v4, 'MAT05-07').prerequisitos.push('MAT05-99');
const r4 = analisa(v4);
conf('veneno id inexistente: acusa', r4.inexistentes.join(','), 'MAT05-07<-MAT05-99');

// raiz fora do 2º ano
const v5 = copia();
acha(v5, 'MAT07-01').prerequisitos = [];
const r5 = analisa(v5);
conf('veneno raiz no 7º ano: acusa', r5.raizesForaDo2.join(','), 'MAT07-01');

// título mexido: a comparação congelada vê
const deHojeMexido = deHoje.slice();
deHojeMexido[10] = deHojeMexido[10].replace(/\|([^|]*)$/, '|Outro título');
conf('veneno título trocado: a lista congelada acusa',
  deHojeMexido.filter((l, i) => l !== CONGELADO[i]).length, 1);

// ================================================================
console.log('\n' + '='.repeat(60));
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
