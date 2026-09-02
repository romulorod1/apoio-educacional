/* testa_busca_regras.js
 * As regras do buscador de assunto, sem navegador.
 *
 * Cada verificação aqui nasceu de uma busca que a Nathália faria e que
 * devolvia a tela vazia ou a lista errada.
 */
const B = require('../busca.js');
const ix = require('../banco/busca.json').temas;
const banco = require('../temas/banco.json');

const tit = {}, serieDe = {};
banco.temas.forEach(t => { tit[t.id] = t.pt.titulo; serieDe[t.id] = t.serie; });

let passes = 0, falhas = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

const achar = q => (B.procurar(ix, q) || { itens: [] }).itens;
const primeiro = q => { const r = achar(q); return r.length ? tit[r[0].id] : '(vazio)'; };
const titulos = q => achar(q).map(x => tit[x.id]);
const noTopo = (q, n) => titulos(q).slice(0, n);
const contem = (q, t, n) => noTopo(q, n || 3).some(x => x === t);

// ================================================================
secao('1. Acento, maiúscula e plural não decidem nada');

[['divisão', 'divisao'], ['ângulo', 'angulo'], ['área', 'area'],
 ['fração', 'fracao'], ['polinômio', 'polinomio']].forEach(([com, sem]) => {
  conf('"' + sem + '" acha o mesmo que "' + com + '"',
    titulos(sem).join('|'), titulos(com).join('|'));
});
conf('maiúscula não muda o resultado', titulos('ANGULO').join('|'), titulos('angulo').join('|'));
conf('plural acha o singular', primeiro('equações'), primeiro('equação'));
conf('"polinômios" acha "polinômio"', achar('polinômios').length > 0, true);

// ================================================================
secao('2. Digitar mais não pode piorar');

// era o defeito central: "equação" achava, "equação do primeiro grau" zerava
conf('"equação" acha alguma coisa', achar('equação').length > 0, true);
conf('"equacao do primeiro grau" acha', achar('equacao do primeiro grau').length > 0, true);
conf('e acha o tema certo em primeiro', primeiro('equacao do primeiro grau'), 'Equações do 1º grau');
conf('"equacao de segundo grau" acha o de 2º grau',
  /2º grau/.test(primeiro('equacao de segundo grau')), true);
conf('"equação do 2 grau problemas" acha o de problemas',
  primeiro('equação do 2 grau problemas'), 'Equação do 2º grau: problemas');

// ================================================================
secao('3. O jeito que ela fala, traduzido para o banco');

conf('"bhaskara" acha, mesmo sem a palavra existir no banco',
  contem('bhaskara', 'Equação do 2º grau: como resolver'), true);
conf('"analise combinatoria" acha os temas de contagem',
  achar('analise combinatoria').length > 0, true);
conf('"PA" acha progressão aritmética', primeiro('PA'), 'Progressão aritmética');
conf('"PG" acha progressão geométrica', primeiro('PG'), 'Progressão geométrica');
conf('"funcao do primeiro grau" acha Função afim', primeiro('funcao do primeiro grau'), 'Função afim');
conf('"função do segundo grau" acha Função quadrática',
  primeiro('função do segundo grau'), 'Função quadrática');
conf('"func 1 grau" abreviado também chega lá', primeiro('func 1 grau'), 'Função afim');
conf('"parábola" acha Função quadrática', primeiro('parábola'), 'Função quadrática');
conf('"quadrado da soma" acha Produtos notáveis', primeiro('quadrado da soma'), 'Produtos notáveis');
conf('"conta de dividir" acha divisão', /[Dd]ivis/.test(primeiro('conta de dividir')), true);
conf('"mmc" acha mínimo múltiplo comum', achar('mmc').length > 0, true);

/* O banco passou a escrever as contas com símbolo, então "elevado a" e "ao
 * quadrado" sumiram do texto. Ela continua falando assim, e a busca tem que
 * continuar entendendo. */
conf('"ao quadrado" acha potenciação', /[Pp]otenc|[Pp]otênc/.test(primeiro('ao quadrado')), true);
conf('"elevado a 3" acha potenciação', /[Pp]otenc|[Pp]otênc/.test(primeiro('elevado a 3')), true);
conf('"ao cubo" acha potenciação', /[Pp]otenc|[Pp]otênc/.test(primeiro('ao cubo')), true);
conf('"dividido por" acha divisão', /[Dd]ivis/.test(primeiro('dividido por')), true);

// toda tradução tem que apontar para palavra que existe mesmo no banco,
// senão a tabela envelhece calada e a busca volta a devolver vazio
secao('4. Nenhuma tradução aponta para o vazio');
const vocab = {};
ix.forEach(r => ['t', 'r', 'd', 'e', 'x'].forEach(c =>
  (r[c] || '').split(' ').forEach(w => { if (w) vocab[w] = 1; })));
let mortas = [];
B.APELIDOS.forEach(([apelido, grupos]) => {
  grupos.forEach(g => {
    if (!g.some(alt => vocab[B.raiz(alt)])) mortas.push(apelido + ' -> ' + g.join('/'));
  });
});
conf('toda palavra de destino existe no banco', mortas.join(', ') || 'nenhuma morta', 'nenhuma morta');

// ================================================================
secao('5. Armadilhas de normalização');

// "mais" não é plural de "mal"
conf('"mais" não vira "mal"', B.aoSingular('mais'), 'mais');
conf('"menos" continua "menos"', B.aoSingular('menos'), 'menos');
conf('"tres" continua "tres"', B.aoSingular('tres'), 'tres');
conf('"equacoes" vira "equacao"', B.aoSingular('equacoes'), 'equacao');
conf('"decimais" vira "decimal"', B.aoSingular('decimais'), 'decimal');

// cardinal só vira número junto de grau, ano ou série
conf('"duas incógnitas" não vira "2 incógnitas"',
  B.lerBusca('duas incognitas').grupos[0][0], 'duas');
conf('"dois graus" vira número, porque veio antes de grau',
  B.lerBusca('dois grau').grupos[0][0], '2');
conf('"equações com duas incógnitas" acha o tema certo',
  primeiro('equações com duas incógnitas'), 'Equações com duas incógnitas');

// letra solta e número solto não podem ser exigência
conf('"regra d tres" acha regra de três', primeiro('regra d tres'), 'Regra de três simples');
conf('"angulos notaveis 30 45 60" acha trigonometria',
  achar('angulos notaveis 30 45 60').length > 1, true);

// ================================================================
secao('6. Palavra rara pesa mais que palavra comum');

const peso = B.medirRaridade(ix);
conf('"exemplo" está em todo tema e vale quase nada', peso['exemplo'] < 0.05, true);
conf('"hipotenusa" é rara e vale muito', peso['hipotenusa'] > 0.7, true);
conf('e a rara vale mais que a comum', peso['hipotenusa'] > peso['exemplo'] * 10, true);

// ================================================================
secao('7. Erro de digitação de uma letra');

conf('"teorena de pitagoras" acha Pitágoras',
  contem('teorena de pitagoras', 'Teorema de Pitágoras'), true);
conf('e a tela sabe dizer que corrigiu',
  B.procurar(ix, 'teorena de pitagoras').corrigida, true);
conf('quem escreveu certo não é marcado como corrigido',
  B.procurar(ix, 'teorema de pitagoras').corrigida, false);
conf('uma letra de diferença', B.umaLetraDeDiferenca('teorena', 'teorema'), true);
conf('duas letras não', B.umaLetraDeDiferenca('teorxna', 'teorema'), false);
conf('letra a menos conta como uma', B.umaLetraDeDiferenca('teorma', 'teorema'), true);

// ================================================================
secao('8. Começo de palavra, para quem digita enquanto o aluno senta');

conf('"pitag" acha Pitágoras', contem('pitag', 'Teorema de Pitágoras', 2), true);
conf('"inequa" acha inequações', primeiro('inequa'), 'Inequações do 1º e do 2º grau');
conf('"porcent" acha porcentagem', /[Pp]orcentagem/.test(primeiro('porcent')), true);
conf('"equa" acha equações do 1º grau no topo', primeiro('equa'), 'Equações do 1º grau');
conf('letra sozinha não vira busca por prefixo', achar('x').length < 20, true);

// ================================================================
secao('9. O ano escolar vira filtro, e não palavra procurada');

conf('"fracao 7 ano" só devolve do 7º',
  achar('fracao 7 ano').every(x => serieDe[x.id] === '07'), true);
conf('e devolve alguma coisa', achar('fracao 7 ano').length > 0, true);
conf('"9 ano" sozinho devolve o ano inteiro',
  achar('9 ano').length > 5 && achar('9 ano').every(x => serieDe[x.id] === '09'), true);
conf('"nono ano" também', achar('nono ano').every(x => serieDe[x.id] === '09'), true);
conf('assunto que não existe no ano pedido é procurado no banco todo',
  achar('logaritmo 6 ano').length > 0, true);
conf('e a tela sabe que saiu do ano pedido',
  B.procurar(ix, 'logaritmo 6 ano').foraDoAno, true);

// ================================================================
secao('10. A lista não vira rolagem infinita');

conf('"numero" não devolve o banco inteiro', achar('numero').length < 40, true);
conf('nenhuma busca do banco passa de 30 linhas',
  ['equacao', 'numero', 'area', 'grafico', 'calcular', 'soma', 'valor']
    .every(q => achar(q).length <= 30), true);
conf('a contagem verdadeira vem junto', typeof B.procurar(ix, 'equacao').total, 'number');

// ================================================================
secao('11. Palavra de pedido não é exigência');

conf('"exercicio de fracao" acha o mesmo que "fracao"',
  noTopo('exercicio de fracao', 3).join('|'), noTopo('fracao', 3).join('|'));
conf('"lista de exercicios de porcentagem" também',
  primeiro('lista de exercicios de porcentagem'), primeiro('porcentagem'));
conf('"prova de trigonometria" acha trigonometria',
  /[Tt]rigonometria/.test(primeiro('prova de trigonometria')), true);

// ================================================================
secao('12. Sem busca não há tela vazia sem motivo');

conf('busca só com preposição não devolve nada de errado',
  achar('de').length < 40, true);
conf('busca vazia devolve nulo', B.procurar(ix, ''), null);
/* Assunto que o banco não tem não devolve tela vazia: devolve o mais perto
 * que existe, marcado como incompleto, para ela ver que trigonometria existe
 * e que hiperbólica não. O aplicativo usa essa marca para anotar o que faltou. */
conf('"trigonometria hiperbolica" mostra o que existe de trigonometria',
  achar('trigonometria hiperbolica').length > 0, true);
conf('e vem marcada como busca não atendida por inteiro',
  B.procurar(ix, 'trigonometria hiperbolica').completa, false);
conf('"logaritmo neperiano" idem', B.procurar(ix, 'logaritmo neperiano').completa, false);
conf('busca atendida por inteiro não é marcada assim',
  B.procurar(ix, 'teorema de pitagoras').completa, true);
conf('palavra que não existe em lugar nenhum devolve vazio de verdade',
  achar('xilofone quantico').length, 0);

// ================================================================
secao('13. Tempo');

const t0 = process.hrtime.bigint();
['equacao do primeiro grau', 'bhaskara', 'area de figuras planas', 'pitag',
 'fracao 7 ano', 'teorena de pitagoras'].forEach(q => B.procurar(ix, q));
const ms = Number(process.hrtime.bigint() - t0) / 1e6;
console.log('  seis buscas em ' + ms.toFixed(1) + ' ms');
conf('seis buscas em menos de 100 ms', ms < 100, true);

// ================================================================
console.log('\n' + '='.repeat(60));
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
