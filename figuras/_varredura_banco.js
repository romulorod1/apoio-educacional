/* figuras/_varredura_banco.js
 * O verificador do criterio de pronto da frente de figuras: quais temas do
 * banco mandam olhar uma figura que a folha nao tem.
 *
 * Por que este script existe, e nao uma trava dentro do piloto de tema. A trava
 * 8 do _piloto_base.js roda `figuraPrometidaEAusente` e devolve vazio assim que
 * o tema tem uma diretiva. Um piloto de tema so existe para tema QUE TEM
 * figura, entao la ela e verde por construcao, e nao porque o tema esteja
 * limpo. O defeito que ela caca so existe em tema que ainda NAO tem piloto:
 * por isso a mesma funcao precisa ser rodada sobre o banco inteiro, aqui.
 *
 * DUAS LISTAS, porque sao dois defeitos diferentes e so um e o criterio.
 *
 *   (a) REMISSAO QUEBRADA. Enunciado ou resposta que manda olhar uma figura
 *       DESTA folha, e a folha nao tem nenhuma. Quem resolve fica sem o
 *       exercicio. Isto reprova a varredura.
 *   (b) INDICIO DE TEMA ESCRITO SUPONDO FIGURA. A explicacao ensina a olhar uma
 *       figura sem que o tema de nenhuma. Pode ser roteiro generico ("o roteiro
 *       e sempre o mesmo: 1. Identifique os dois triangulos que aparecem na
 *       figura"), que fala da figura do problema que se estiver resolvendo, e
 *       nao de um desenho desta folha. Nao reprova nada: e pista para quem for
 *       escolher os proximos temas a marcar.
 *
 * O METODO, e ele contradiz um numero escrito na SINTESE.md e no briefing da
 * frente. Ate 07/09/2026 dizia-se "onze temas prometem figura e nao tem
 * nenhuma". A conferencia foi refeita em 07/09/2026 em tres passadas: uma
 * varredura por remissao inequivoca ("mostrada na figura", "conforme a figura",
 * "observe a figura", "veja a figura", "a figura mostra", "figura a seguir",
 * "aparecem na figura", "formados na figura"); uma varredura mais larga, por
 * todo "na figura", "no desenho", "na imagem", "in the figure", "in the
 * drawing", restrita aos temas sem nenhuma diretiva; e a LEITURA do contexto de
 * cada ocorrencia que sobrou.
 *
 * Resultado: dos onze, UM e remissao quebrada (MAT08-11) e um e indicio
 * (MAT08-12). Os outros nove usam a palavra em outro sentido, e cada um esta
 * nomeado com o motivo na lista de ISENTOS abaixo. O numero onze da SINTESE.md
 * foi conferido tema a tema e nao se sustenta.
 *
 * CONTROLES POSITIVOS SAO OBRIGATORIOS AQUI. Um verificador cujo resultado
 * esperado e UM tema e fragil: se ele quebrar e passar a acusar zero, ninguem
 * percebe, porque zero parece uma boa noticia. Por isso o MATEM3-03 e o
 * MAT08-13, que TEM figura e remetem a ela, sao conferidos a cada rodada. Se os
 * controles sumirem da saida, o detector esta cego, mesmo com o placar dizendo
 * "1 tema acusado".
 *
 * A saida imprime a FRASE que casou, com tema, lingua e item, e nao so o id do
 * tema. Uma lista de ids nao e acionavel nem auditavel: foi lendo o contexto
 * que se descobriu que o MAT02-06 era falso positivo e que o MAT08-12 era
 * roteiro generico e nao remissao quebrada.
 *
 * Uso: node _varredura_banco.js [caminho de outro banco.json]
 *
 * Regra da casa: nunca usar travessao.
 */
const fs = require('fs');
const path = require('path');
const P = require('./_piloto_base.js');

const BANCO = process.argv[2] || path.join(P.RAIZ, 'temas', 'banco.json');

/* ================================================================ os isentos
 *
 * Tema em que a palavra "figura" ou "desenho" aparece em OUTRO SENTIDO, e nao
 * como remissao a um desenho. Cada um foi lido, e o motivo esta escrito ao lado
 * para a varredura nao voltar a acusar o mesmo tema toda vez. Isento nao e
 * perdao: e classificacao. Se um destes ganhar uma remissao de verdade um dia,
 * a linha sai daqui.
 *
 * Nenhum deles e acusado pela expressao de remissao de hoje. A lista continua
 * aqui porque ela e a memoria da leitura: quem mexer na expressao e voltar a
 * acusar um destes sabe, pelo motivo escrito, que afrouxou demais. */
const ISENTOS = {
  'MAT02-06': 'figura como forma: o tema e "Figuras planas: reconhecer e nomear" e usa a palavra 19 vezes assim',
  'MAT04-09': 'figura como forma: "dar a volta na figura somando", "Na figura composta"',
  'MAT04-12': 'figura como icone de pictograma: "cada figura de livro vale 4 livros"',
  'MAT05-09': 'figura como forma: "A area da figura e 58 cm quadrados"',
  'MAT06-10': 'figura como forma: "as aberturas dentro da figura em cada vertice"',
  'MAT06-11': 'figura como forma: "Qual e a area da figura?"',
  'MAT07-08': 'figura como termo de uma sequencia: "quantos elementos tem cada figura"',
  'MAT07-13': 'figura como forma: "o comprimento do contorno da figura"',
  'MAT09-08': 'figura como forma: "um lado da figura original"',
  'MAT04-07': 'desenho como o que quem resolve vai desenhar: "marque a seta no desenho"',
  'MAT06-09': 'desenho como o que quem resolve vai desenhar: "marque no desenho todos os angulos iguais"',
  'MAT07-05': 'desenho como desenho em escala, objeto do problema: "razao entre a medida no desenho e a medida real"',
  'MAT09-07': 'desenho generico, o que quem resolve imagina: "in the drawing it is always the one facing the right angle"',
  'MATEM1-05': 'desenho mental: "Ler no desenho mental da parabola"'
};

/* (a) Os temas com REMISSAO QUEBRADA hoje. Lista fechada: um tema novo aqui
 * reprova a varredura, e um tema que SAI daqui tambem, porque sair e a hora de
 * registrar que a frente andou. */
const REMISSAO_QUEBRADA_DE_HOJE = ['MAT08-11'];

/* Controles: temas que TEM figura e remetem a ela. Obrigatorios, ver o
 * cabecalho. */
const CONTROLES = ['MATEM3-03', 'MAT08-13'];

/* ================================================================ a varredura */

let ok = 0, mau = 0;
function conf(rotulo, obtido, esperado) {
  const bom = String(obtido) === String(esperado);
  if (bom) ok++; else mau++;
  console.log((bom ? '  OK    ' : '  FALHA ') + rotulo +
    (bom ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function alinhar(s, n) { return (s + '                ').slice(0, Math.max(n, s.length)); }

const lido = JSON.parse(fs.readFileSync(BANCO, 'utf8'));
const temas = Array.isArray(lido.temas) ? lido.temas : [lido];

/* Toda ocorrencia de remissao de um tema, com lingua, item e a frase inteira.
 * O campo `daLista` separa as duas listas: remissao dentro de exercicio manda
 * olhar ESTA folha; remissao na explicacao pode ser roteiro generico. */
function ocorrenciasDoTema(t) {
  const saida = [];
  ['pt', 'en'].forEach(function (lingua) {
    const d = t[lingua];
    if (!d) return;
    const olhar = [['explicacao', d.explicacao, 'b']];
    (d.exercicios || []).forEach(function (e) {
      olhar.push(['ex ' + e.n, e.enunciado, 'a']);
      olhar.push(['resp ' + e.n, e.resposta, 'a']);
    });
    olhar.forEach(function (par) {
      P.ocorrenciasDeRemissao(par[1], lingua).forEach(function (o) {
        saida.push({ lingua: lingua, onde: par[0], daLista: par[2], casou: o.casou, frase: o.frase });
      });
    });
  });
  return saida;
}

let semDiretivaNenhuma = 0;
const quebradas = [], indicios = [];
temas.forEach(function (t) {
  if (!t || !t.pt) return;
  if (P.contarDiretivas(t) > 0) return;
  semDiretivaNenhuma++;
  const o = ocorrenciasDoTema(t);
  if (!o.length) return;
  const registro = { id: t.id, titulo: (t.pt || {}).titulo || '', ocorrencias: o };
  if (o.some(function (x) { return x.daLista === 'a'; })) quebradas.push(registro);
  else indicios.push(registro);
});

function despejar(lista, vazio) {
  if (!lista.length) { console.log('  ' + vazio); return 0; }
  let n = 0;
  lista.forEach(function (a) {
    console.log('  ' + a.id + '   ' + a.titulo);
    a.ocorrencias.forEach(function (o) {
      n++;
      console.log('      ' + alinhar(o.lingua, 3) + ' ' + alinhar(o.onde, 12) + ' [' + o.casou + ']');
      console.log('          "' + o.frase + '"');
    });
  });
  return n;
}

console.log('varredura do banco: ' + temas.length + ' temas, ' + semDiretivaNenhuma +
  ' sem nenhuma diretiva @fig  |  banco: ' + BANCO);

console.log('\n(a) remissao quebrada: exercicio manda olhar uma figura que a folha nao tem');
const nA = despejar(quebradas, 'nenhum');
console.log('  ' + quebradas.length + ' temas, ' + nA + ' ocorrencias  [e este o criterio de pronto]');

console.log('\n(b) indicio de tema escrito supondo figura: a explicacao ensina a olhar, o tema nao desenha');
const nB = despejar(indicios, 'nenhum');
console.log('  ' + indicios.length + ' temas, ' + nB + ' ocorrencias  [pista para escolher o proximo lote, nao reprova]');

console.log('\nisentos: a palavra aparece em outro sentido, lido e conferido em 07/09/2026');
Object.keys(ISENTOS).forEach(function (id) {
  console.log('  ' + alinhar(id, 11) + ' ' + ISENTOS[id]);
});

console.log('\ncontroles: temas que TEM figura e remetem a ela (obrigatorios)');
CONTROLES.forEach(function (id) {
  const t = temas.find(function (x) { return x && x.id === id; });
  if (!t) { console.log('  ' + alinhar(id, 11) + ' fora deste banco'); return; }
  const o = ocorrenciasDoTema(t);
  console.log('  ' + alinhar(id, 11) + ' ' + P.contarDiretivas(t) + ' diretivas, ' + o.length + ' remissoes vistas');
  o.slice(0, 2).forEach(function (x) {
    console.log('          ' + x.lingua + ' ' + x.onde + ' [' + x.casou + ']  "' + x.frase.slice(0, 96) + '"');
  });
});

console.log('\nconferencias');
/* O detector enxerga. Sem isto, uma lista curta de acusados nao significaria
 * nada: zero acusados parece boa noticia e pode ser cegueira. */
CONTROLES.forEach(function (id) {
  const t = temas.find(function (x) { return x && x.id === id; });
  if (!t) { conf('o controle ' + id + ' esta no banco', 'ausente', 'presente'); return; }
  conf('o controle ' + id + ' tem figura e o detector ve a remissao dele',
    P.contarDiretivas(t) > 0 && ocorrenciasDoTema(t).length > 0, true);
  conf('e por isso o ' + id + ' nao entra em lista nenhuma de acusados',
    P.figuraPrometidaEAusente(t).length, 0);
});
/* Os isentos continuam classificados como outro sentido da palavra. */
const todosAcusados = quebradas.concat(indicios).map(function (a) { return a.id; });
conf('nenhum tema isento voltou a ser acusado: a expressao de remissao nao afrouxou',
  todosAcusados.filter(function (id) { return ISENTOS[id]; }).join(', ') || 'nenhum', 'nenhum');
/* A lista fechada (a). Tema novo aqui e defeito para ler; tema que sai daqui e
 * a frente andando, e as duas coisas precisam parar quem estiver passando. */
conf('a lista de remissao quebrada e a conhecida',
  quebradas.map(function (a) { return a.id; }).join(' ') || 'nenhum',
  REMISSAO_QUEBRADA_DE_HOJE.join(' '));

console.log('\n' + ok + ' conferencias passaram, ' + mau + ' falharam.');
if (quebradas.length) {
  console.log('\ncriterio de pronto em aberto: ' + quebradas.map(function (a) { return a.id; }).join(', ') +
    '. Marcar figura ai fecha a lista (a).');
}
process.exit(mau ? 1 : 0);
