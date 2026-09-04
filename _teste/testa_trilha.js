/* testa_trilha.js
 * O motor das trilhas, sem navegador, alimentado pelo índice de temas de verdade.
 *
 * A trilha é a resposta a uma reclamação concreta: marcar "Frações" no
 * mapeamento levava a uma busca que devolve dezoito temas em ordem de
 * relevância, começando pelo 8º ano e pulando para o 4º. Aqui a ordem sai do
 * grafo de pré-requisitos, e o que este arquivo confere é justamente que ela
 * sai certa, para todas as lacunas e em anos escolares diferentes.
 */
const Core = require('../core.js');
const indice = require('../banco/indice.json');
const temas = indice.temas || indice;

let passes = 0, falhas = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

const porId = {};
temas.forEach(t => { porId[t.id] = t; });

const LACUNAS = ['naturais', 'tabuada', 'divisao', 'fracoes', 'decimais', 'porcentagem',
  'inteiros', 'potencias', 'medidas', 'algebrica', 'eq1', 'sistemas', 'fatoracao', 'eq2',
  'proporcao', 'area', 'pitagoras', 'semelhanca', 'trigonometria', 'funcoes', 'graficos',
  'probabilidade'];
const ANOS = ['05', '08', 'em2'];

// ================================================================
secao('1. Toda lacuna tem alvo, e o alvo respeita o ano do aluno');

let semAlvo = [];
LACUNAS.forEach(l => {
  const r = Core.alvosDaLacuna(temas, l, '08');
  if (!r.candidatos.length) semAlvo.push(l);
});
conf('as 22 lacunas têm alvo', semAlvo.join(' ') || 'nenhuma sem alvo', 'nenhuma sem alvo');

/* As duas de equação eram as que não tinham: nenhum tema do banco casa com
 * "primeiro grau" nem com "segundo grau" por título. */
conf('a lacuna de equação do 1º grau tem alvo',
  Core.alvosDaLacuna(temas, 'eq1', '08').sugerido, 'MAT07-10');
conf('e a do 2º grau também',
  Core.alvosDaLacuna(temas, 'eq2', '09').sugerido.slice(0, 6), 'MAT09-');

/* O proposto é o mais alto que não passa do ano do aluno: dar conteúdo de 6º
 * ano para tapar buraco de aluno do 5º é adiantar, não recuperar. */
conf('frações no 4º ano propõe o tema do 4º',
  Core.alvosDaLacuna(temas, 'fracoes', '04').sugerido, 'MAT04-05');
conf('frações no 6º ano propõe o do 6º',
  Core.alvosDaLacuna(temas, 'fracoes', '06').sugerido, 'MAT06-06');
conf('frações sem ano registrado cai no mais baixo',
  Core.alvosDaLacuna(temas, 'fracoes', '').sugerido, 'MAT04-05');
conf('e no 3º ano do médio propõe o mais alto que existe',
  Core.alvosDaLacuna(temas, 'fracoes', 'em3').sugerido, 'MAT06-06');

// ================================================================
secao('2. A ordem nunca põe um tema antes de um pré-requisito dele');

/* Esta é a conferência que dá sentido à trilha inteira. Ela roda para as 22
 * lacunas em três anos escolares, ou seja 66 trilhas. */
let violacoes = [];
let comCorte = [];
let deUmPasso = [];
LACUNAS.forEach(l => {
  ANOS.forEach(ano => {
    const alvo = Core.alvosDaLacuna(temas, l, ano).sugerido;
    if (!alvo) return;
    const d = Core.trilhaDerivada(temas, alvo);
    const pos = {};
    d.passos.forEach((p, i) => { pos[p.temaId] = i; });
    d.passos.forEach(p => {
      (porId[p.temaId].prerequisitos || []).forEach(pre => {
        if (pos[pre] === undefined) return;   // foi cortado, e o corte é de trás
        if (pos[pre] > pos[p.temaId]) violacoes.push(l + '/' + ano + ': ' + pre + ' depois de ' + p.temaId);
      });
    });
    if (d.cortados.length) comCorte.push(l + '/' + ano);
    if (d.passos.length === 1) deUmPasso.push(l + '/' + ano);
    if (d.passos.length && d.passos[d.passos.length - 1].temaId !== alvo) {
      violacoes.push(l + '/' + ano + ': o alvo não é o último passo');
    }
  });
});
conf('nenhuma das 66 trilhas inverte um pré-requisito', violacoes.slice(0, 3).join(' ; ') || 'nenhuma', 'nenhuma');
conf('e o alvo é sempre o último passo', violacoes.filter(v => /último/.test(v)).length, 0);

/* Ordenar por ano e número daria certo em quase tudo, e é por causa destes dois
 * pares que a ordenação topológica é de verdade. */
const ordemDe = (alvo) => Core.trilhaDerivada(temas, alvo, { maximo: 99 }).passos.map(p => p.temaId);
const dep = ordemDe('MAT09-06');
conf('MAT09-06 sai depois de MAT09-07, contra a ordem do número',
  dep.indexOf('MAT09-07') < dep.indexOf('MAT09-06') || dep.indexOf('MAT09-07') < 0, true);
const dep2 = ordemDe('MATEM1-09');
conf('MATEM1-09 sai depois de MATEM1-15',
  dep2.indexOf('MATEM1-15') < dep2.indexOf('MATEM1-09') || dep2.indexOf('MATEM1-15') < 0, true);

// ================================================================
secao('3. O corte é regra, e não exceção');

console.log('       trilhas com corte: ' + comCorte.length + ' de 66');
conf('o corte dispara em várias lacunas', comCorte.length > 5, true);

/* Quando corta, o que sobra é o mais perto do alvo, e o cortado volta na
 * resposta para a tela oferecer puxar mais de trás. */
const p7 = Core.trilhaDerivada(temas, Core.alvosDaLacuna(temas, 'porcentagem', '07').sugerido);
conf('porcentagem no 7º ano corta', p7.cortados.length > 0, true);
conf('e guarda seis passos', p7.passos.length, 6);
conf('o alvo continua no fim', p7.passos[p7.passos.length - 1].temaId, 'MAT07-07');
conf('o cortado é o mais distante', p7.cortados.length + p7.passos.length > 6, true);
conf('sem corte, a trilha inteira aparece',
  Core.trilhaDerivada(temas, 'MAT07-07', { maximo: 99 }).passos.length, p7.cortados.length + 6);

// ================================================================
secao('4. Alvo que não depende de ninguém não vira escada');

/* Vinte e dois temas não têm pré-requisito, e alguns são alvo natural de
 * lacuna. Uma escada de um degrau é pior do que não oferecer, então quem chama
 * precisa saber distinguir, e o número de passos é o que diz. */
console.log('       trilhas de um passo só: ' + deUmPasso.length + ' de 66');
conf('frações no 4º ano tem um passo só',
  Core.trilhaDerivada(temas, 'MAT04-05').passos.length, 1);
conf('trigonometria no médio também',
  Core.trilhaDerivada(temas, 'MATEM1-14').passos.length, 1);
conf('e frações no 6º ano tem escada de verdade',
  Core.trilhaDerivada(temas, 'MAT06-06').passos.length > 3, true);

// ================================================================
secao('5. Quantos encontros, pela duração habitual do aluno');

const dbDur = {
  aulas: [
    /* O campo e duracaoMin, que e o que a aula grava de verdade. Este teste
     * usava `duracao`, que nao existe em aula nenhuma, e passava porque a
     * funcao lia o mesmo campo errado: os dois se enganavam juntos, e a
     * proposta saia oferecendo uma hora para quem ela atende hora e meia. */
    { alunoId: 'a1', duracaoMin: 60 }, { alunoId: 'a1', duracaoMin: 60 },
    { alunoId: 'a1', duracaoMin: 90 }, { alunoId: 'a2', duracaoMin: 90 },
    /* Aula com o campo curto, que NAO existe em aula nenhuma do aplicativo:
     * fica aqui para provar que ela nao conta, e nao para pedir uma reserva.
     * Inventar reserva para um campo que nunca existiu esconderia o defeito
     * que acabou de ser consertado, que era exatamente ler o campo errado. */
    { alunoId: 'a4', duracao: 120 }
  ]
};
conf('a duração habitual é a mais frequente', Core.duracaoHabitual(dbDur, 'a1'), 60);
conf('e de outro aluno é a dele', Core.duracaoHabitual(dbDur, 'a2'), 90);
conf('aluno sem aula cai em 60', Core.duracaoHabitual(dbDur, 'a3'), 60);
conf('aula com o campo curto nao conta, e cai no recurso',
  Core.duracaoHabitual(dbDur, 'a4'), 60);

const fr = Core.trilhaDerivada(temas, 'MAT06-06').passos;
const minutos = fr.reduce((s, p) => s + p.duracaoMin, 0);
console.log('       frações do 6º ano: ' + fr.length + ' passos, ' + minutos + ' minutos');
conf('em encontros de 1 hora', Core.encontrosPrevistos(fr, 60), Math.ceil(minutos / 60));
conf('em encontros de 1h30 dá menos', Core.encontrosPrevistos(fr, 90) < Core.encontrosPrevistos(fr, 60), true);
conf('nunca zero encontros', Core.encontrosPrevistos([], 60), 1);

// ================================================================
secao('6. O assunto da aula faz a trilha andar sozinha');

function trilhaDeProva() {
  const d = Core.trilhaDerivada(temas, 'MAT06-06');
  return Core.criarTrilha({
    alunoId: 'a1', lacunaId: 'fracoes', titulo: 'Operações com frações',
    alvoId: 'MAT06-06', criadaEm: '2026-06-01', passos: d.passos
  });
}

const aluno = { id: 'a1', nome: 'Aluna', trilhas: [trilhaDeProva()] };
const primeiro = Core.proximoPasso(aluno.trilhas[0]);
conf('o próximo passo é o primeiro da escada', primeiro.temaId, aluno.trilhas[0].passos[0].temaId);

/* Carimba a data DA AULA, e não a de hoje: ela lança aula atrasada e usa
 * repetir para trás. */
const aula = { id: 'l9', alunoId: 'a1', data: '2026-06-05', status: 'realizada' };
const item = { id: primeiro.temaId, titulo: primeiro.titulo };
const marcou = Core.marcarPassoPorAssunto(aluno, aula, item);
conf('registrar o assunto marca o passo', !!marcou, true);
conf('com a data da aula, não a de hoje', aluno.trilhas[0].passos[0].feitoEm, '2026-06-05');
conf('e guarda qual aula fechou o passo', aluno.trilhas[0].passos[0].aulaId, 'l9');
conf('o item da aula passa a saber de que trilha veio', item.passoDe, aluno.trilhas[0].id);
conf('só o passo daquele tema é marcado',
  aluno.trilhas[0].passos.filter(p => p.feitoEm).length, 1);
conf('e o próximo passo anda', Core.proximoPasso(aluno.trilhas[0]).temaId,
  aluno.trilhas[0].passos[1].temaId);

/* Pular etapa é decisão dela, não do aplicativo: marcar um passo lá na frente
 * não marca os anteriores. */
const aluno2 = { id: 'a1', trilhas: [trilhaDeProva()] };
const terceiro = aluno2.trilhas[0].passos[2];
Core.marcarPassoPorAssunto(aluno2, { id: 'l1', data: '2026-06-05', status: 'realizada' },
  { id: terceiro.temaId });
conf('marcar o terceiro não marca os dois primeiros',
  aluno2.trilhas[0].passos.slice(0, 2).filter(p => p.feitoEm).length, 0);

// ================================================================
secao('7. Aula que não aconteceu não faz a trilha andar');

['falta', 'cancelada'].forEach(st => {
  const a = { id: 'a1', trilhas: [trilhaDeProva()] };
  const p = Core.proximoPasso(a.trilhas[0]);
  Core.marcarPassoPorAssunto(a, { id: 'lx', data: '2026-06-05', status: st }, { id: p.temaId });
  conf('aula com status ' + st + ' não marca passo',
    a.trilhas[0].passos.filter(x => x.feitoEm).length, 0);
});

/* E quando a aula muda de status depois de já ter marcado, o passo volta. É o
 * pior tipo de erro o que fica calado: a trilha contaria como andado o que não
 * foi dado. */
const a3 = { id: 'a1', trilhas: [trilhaDeProva()] };
const aulaViva = { id: 'l7', data: '2026-06-05', status: 'realizada' };
Core.marcarPassoPorAssunto(a3, aulaViva, { id: Core.proximoPasso(a3.trilhas[0]).temaId });
conf('o passo ficou marcado', a3.trilhas[0].passos.filter(p => p.feitoEm).length, 1);
aulaViva.status = 'cancelada';
conf('cancelar a aula desmarca um passo', Core.revisarPassosDaAula(a3, aulaViva), 1);
conf('e a trilha volta ao começo', a3.trilhas[0].passos.filter(p => p.feitoEm).length, 0);

// ================================================================
secao('8. O que o aluno já viu nasce marcado');

/* É aqui que as duas frentes se encostam: o registro de assunto alimenta a
 * trilha antes mesmo de ela existir. */
const dbHist = {
  aulas: [
    { id: 'v1', alunoId: 'a1', data: '2026-05-12', status: 'realizada',
      temas: [{ id: 'MAT06-01', titulo: 'Sistema de numeração decimal' }] },
    { id: 'v2', alunoId: 'a1', data: '2026-05-19', status: 'cancelada',
      temas: [{ id: 'MAT06-02', titulo: 'Operações com números naturais' }] },
    { id: 'v3', alunoId: 'a2', data: '2026-05-20', status: 'realizada',
      temas: [{ id: 'MAT06-03', titulo: 'Múltiplos e divisores' }] }
  ]
};
const passos = Core.marcarOQueJaFoiDado(dbHist, 'a1', Core.trilhaDerivada(temas, 'MAT06-06').passos);
const feitos = passos.filter(p => p.feitoEm);
conf('o passo já dado nasce marcado', feitos.length, 1);
conf('com a data da aula em que foi dado', feitos[0].feitoEm, '2026-05-12');
conf('e marcado como já era', feitos[0].jaEra, true);
conf('aula cancelada não conta', passos.filter(p => p.temaId === 'MAT06-02' && p.feitoEm).length, 0);
conf('aula de outro aluno não conta', passos.filter(p => p.temaId === 'MAT06-03' && p.feitoEm).length, 0);

// ================================================================
secao('9. Ela governa a trilha');

const t = trilhaDeProva();
const antes = t.passos.map(p => p.temaId).join(',');
conf('mover um passo para cima muda a ordem', Core.moverPasso(t, 2, 0) && t.passos.map(p => p.temaId).join(',') !== antes, true);
conf('mover para fora da lista não faz nada', Core.moverPasso(t, 0, 99), false);
const quantos = t.passos.length;
conf('tirar um passo diminui a lista', Core.removerPasso(t, 0) && t.passos.length, quantos - 1);
conf('tirar índice que não existe não faz nada', Core.removerPasso(t, 99), false);
conf('encerrar guarda a data', Core.encerrarTrilha(t, '2026-07-01', 'fechou antes') && t.encerradaEm, '2026-07-01');
conf('e o motivo', t.motivo, 'fechou antes');
conf('encerrada sai das ativas', Core.trilhasAtivas({ trilhas: [t] }).length, 0);
conf('mas continua na lista, que é a prova do trabalho', Core.trilhasDe({ trilhas: [t] }).length, 1);

// ================================================================
secao('10. Aluno de hoje, sem trilha nenhuma');

conf('aluno sem o campo devolve lista vazia', Core.trilhasDe({ id: 'a9' }).length, 0);
conf('e nenhuma ativa', Core.trilhasAtivas({ id: 'a9' }).length, 0);
conf('marcar assunto em aluno sem trilha não quebra',
  Core.marcarPassoPorAssunto({ id: 'a9' }, { id: 'l1', data: '2026-06-01', status: 'realizada' },
    { id: 'MAT06-01' }), null);
conf('revisar aula de aluno sem trilha não quebra',
  Core.revisarPassosDaAula({ id: 'a9' }, { id: 'l1', status: 'cancelada' }), 0);

// ================================================================
console.log('\n' + '='.repeat(60));
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
