/* testa_assistente_grava.js (projeto IA no app, fase 4a: o assistente que GRAVA uma aula)
 *
 * As propostas do assistente.js sobre um banco SINTÉTICO, nos dois lados:
 *   - a conferência contra o banco: a aula certa contra a que não existe, o
 *     aluno homônimo ("Ana" com duas Anas), o choque de horário e a aula
 *     além de materializadoAte (a repetição que o tablet ainda não lançou);
 *   - o efeito de cada proposta confirmada, IGUAL byte a byte ao da mesma
 *     mudança feita pela função da tela (Core.aplicarEdicaoAula só nesta
 *     aula, com as mudanças que os botões do celular e do Fechamento passam;
 *     a aula nova da novaAulaAvulsa; o Core.gravarTextoDoMes);
 *   - as três saídas do cancelamento, com o dinheiro do core (vigência e
 *     total do mês) em cada uma, e a pergunta quando a fala não disse;
 *   - o K2 ("cancela a semana que vem") aula por aula, NUNCA pelo escopo
 *     "esta e as seguintes": a repetição sai igual. Veneno: o mesmo plano
 *     aplicado com 'seguintes' tem de ser pego;
 *   - "nada grava sem Confirmar": o modelo falso pede a gravação, ninguém
 *     toca, e o banco CONGELADO sai igual byte a byte;
 *   - o Confirmar confere de novo: a agenda que mudou não grava;
 *   - o celular que só lê não tem as propostas.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const Core = require('../core.js');
const A = require('../assistente.js');

let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const o = typeof obtido === 'string' ? obtido : JSON.stringify(obtido);
  const e = typeof esperado === 'string' ? esperado : JSON.stringify(esperado);
  if (o === e) { passes++; console.log('  OK    ' + rotulo); }
  else { falhas++; console.log('  FALHA ' + rotulo + '\n        obtido:   ' + o + '\n        esperado: ' + e); }
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

const HOJE = '2026-11-16';          // segunda
const AGORA = 11 * 60;
const VENENO = 'VENENO-PRIVADO-4417';

function aula(id, alunoId, data, hora, extra) {
  return Object.assign({ id, alunoId, data, hora, duracaoMin: 60, status: 'realizada', notaTexto: '', notaPrivada: '', temas: [], areas: [], anexos: [] }, extra || {});
}
function bancoSintetico() {
  const db = {
    versao: 1, ajustes: { pagamentosDesde: '2026-09' },
    alunos: [
      { id: 'mar', nome: 'Marina Sintética', ativo: true, telefone: '(21) 98765-4321', endereco: 'Rua ' + VENENO, obs: VENENO,
        precos: [{ id: 'p1', inicio: '2026-01-01', fim: '2026-11-30', valorHora: 120 }, { id: 'p2', inicio: '2026-12-01', fim: null, valorHora: 130 }] },
      { id: 'anas', nome: 'Ana Sintética', ativo: true, precos: [{ id: 'p3', inicio: '2026-01-01', fim: null, valorHora: 100 }] },
      { id: 'anao', nome: 'Ana Outra', ativo: true, precos: [{ id: 'p4', inicio: '2026-01-01', fim: null, valorHora: 100 }] },
      { id: 'bru', nome: 'Bruno Teste', ativo: true, precos: [{ id: 'p5', inicio: '2026-01-01', fim: null, valorHora: 150 }] }
    ],
    series: [
      // Marina: quinta às 15:30, lançada até novembro; dezembro só existe como repetição prevista
      { id: 's1', alunoId: 'mar', dias: [4], hora: '15:30', duracaoMin: 60, inicio: '2026-10-01', fim: null, exclusoes: [], materializadoAte: '2026-11', status: 'realizada' }
    ],
    aulas: [],
    resumos: [{ alunoId: 'mar', mes: '2026-10', texto: 'Em outubro a Marina avançou em frações.' }],
    pagamentos: [{ id: 'pg1', alunoId: 'bru', mes: '2026-11', pagoEm: '2026-11-10', valor: 300 }]
  };
  ['2026-11-05', '2026-11-12', '2026-11-19', '2026-11-26'].forEach(d => db.aulas.push(aula('s1@' + d, 'mar', d, '15:30', { serieId: 's1', destacada: false })));
  db.aulas.find(a => a.id === 's1@2026-11-05').status = 'falta';
  db.aulas.find(a => a.id === 's1@2026-11-12').notaPrivada = VENENO;
  db.aulas.push(aula('b1', 'bru', HOJE, '08:00'));
  db.aulas.push(aula('b2', 'bru', '2026-11-20', '17:30'));
  db.aulas.push(aula('b3', 'bru', '2026-11-24', '09:00'));
  db.aulas.push(aula('a1', 'anas', '2026-11-17', '10:00'));
  db.aulas.push(aula('a2', 'anao', '2026-11-17', '14:00'));
  return db;
}
function congelar(o) { Object.freeze(o); Object.keys(o).forEach(k => { if (o[k] && typeof o[k] === 'object' && !Object.isFrozen(o[k])) congelar(o[k]); }); return o; }
const clonar = o => JSON.parse(JSON.stringify(o));

const CATALOGO = [{ ref: 'b:MAT-FRA', item: { id: 'MAT-FRA', titulo: 'Frações equivalentes', fonte: 'banco', disciplina: 'matematica' } }];
const catalogo = {
  buscar: t => CATALOGO.filter(c => Core.chaveDeBusca(c.item.titulo).indexOf(Core.chaveDeBusca(t).split(' ')[0]) >= 0).map(c => ({ ref: c.ref, assunto: c.item.titulo, onde: 'Matemática' })),
  item: r => { const c = CATALOGO.find(x => x.ref === r); return c ? Object.assign({}, c.item) : null; }
};
const DB = congelar(bancoSintetico());
const FOTO = JSON.stringify(DB);
const ctxDe = (db, extra) => Object.assign({ db, Core, hoje: HOJE, agoraMin: AGORA, links: {}, gravar: true, catalogo, fala: 'frase de prova: ela falou da cobrança' }, extra || {});
const ctx = ctxDe(DB);
const saidasAoModelo = [];
function propor(nome, entrada, c) {
  const r = A.executar(nome, entrada, c || ctx);
  saidasAoModelo.push(JSON.stringify(r.resultado));
  return r;
}
const item = o => Object.assign({ acao: null, alunoId: null, nome_dito: '', data: null, hora: null, nova_data: null, nova_hora: null, duracao_min: null, cobranca: null }, o);
const naoGravou = rotulo => conf('nada gravou (' + rotulo + '): o banco congelado saiu igual byte a byte', JSON.stringify(DB) === FOTO, true);

/* O efeito confirmado (aplicarPlano, sem as funções do app: o core direto,
 * que é o que as funções da tela chamam) contra a mesma mudança feita pela
 * tela, numa cópia cada. */
function confirmado(linhas, estado) {
  const r = A.opsConfirmadas(linhas, estado || {});
  const db = clonar(FOTO_OBJ());
  A.aplicarPlano(db, r.ops, Core);
  return db;
}
function FOTO_OBJ() { return JSON.parse(FOTO); }
function pelaTela(fazer) { const db = clonar(FOTO_OBJ()); fazer(db); return db; }
function semIdsNovos(db) { const d = clonar(db); d.aulas.forEach(a => { if (!/^(s1@|b\d|a\d)/.test(a.id)) a.id = 'NOVA'; }); return JSON.stringify(d); }

secao('1. As ferramentas: as de proposta só para quem grava, e o total no teto do endpoint');
const comGravar = A.ferramentasPara(true, Core);
conf('quem grava: 20 ferramentas (o teto do servidor/ia.mjs), 16 de leitura e 4 de proposta', [comGravar.length, comGravar.slice(16).map(f => f.name)],
  [20, ['propor_aulas', 'propor_relato', 'propor_feedback', 'buscar_assunto']]);
conf('quem só lê: as 16 de leitura da fase 3, as mesmas', JSON.stringify(A.ferramentasPara(false, Core)) === JSON.stringify(A.FERRAMENTAS), true);
const estritas = function chec(s) {
  if (!s || typeof s !== 'object') return true;
  if (s.type === 'object' && (s.additionalProperties !== false || Object.keys(s.properties || {}).sort().join() !== (s.required || []).slice().sort().join())) return false;
  return Object.keys(s).every(k => chec(s[k]));
};
conf('todo objeto (inclusive dentro das listas) fechado e com todos os campos em required', comGravar.every(f => estritas(f.input_schema)), true);
conf('todas strict, menos o propor_relato (com ele a API recusa o conjunto; medido com a conta de teste)', comGravar.filter(f => f.strict !== true).map(f => f.name), ['propor_relato']);
conf('nenhum campo das propostas com união de tipos (anyOf): o "não disse" é vazio, 0 ou nao_disse', /anyOf/.test(JSON.stringify(comGravar.slice(16))), false);
conf('o "não disse" vazio vale como null: hora "", nova_hora "", duração 0 e cobrança nao_disse', (() => {
  const r = A.executar('propor_aulas', { itens: [{ acao: 'remarcar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', hora: '', nova_data: '2026-11-20', nova_hora: '', duracao_min: 0, cobranca: 'nao_disse' }] }, ctx);
  return r.linhas && r.linhas[0].op.mudancas; })(), { data: '2026-11-20', hora: '15:30', duracaoMin: 60 });
conf('nenhum minimum, maximum, pattern ou minLength (o modo estrito não aceita)', /"(minimum|maximum|pattern|minLength|maxLength|minItems|maxItems)"/.test(JSON.stringify(comGravar)), false);
conf('as áreas do relato são as do core (enum com os ids de Core.AREAS)', comGravar[17].input_schema.properties.itens.items.properties.areas.items.enum.length, Core.AREAS.reduce((s, g) => s + g.itens.length, 0));
conf('o corpo de quem só lê é o da fase 3 (sistema e ferramentas)', (() => { const c = A.corpo([], false, Core); return [c.system === A.SISTEMA, c.tools.length]; })(), [true, 16]);
conf('o corpo de quem grava leva o sistema das propostas e as 20', (() => { const c = A.corpo([], true, Core); return [c.system === A.SISTEMA_GRAVA, c.tools.length, c.esforco]; })(), [true, 20, 'low']);
conf('o sistema das propostas não tem travessão nem data (cache) e diz que só ela grava', [/[–—]|\d{4}-\d{2}-\d{2}/.test(A.SISTEMA_GRAVA), /só ela grava, tocando em Confirmar/.test(A.SISTEMA_GRAVA), /O que você ainda NÃO faz: marcar/.test(A.SISTEMA_GRAVA)], [false, true, false]);
conf('celular que só lê (gravar false): pedir proposta é ferramenta desconhecida, e nada de cartão',
  (() => { const r = A.executar('propor_aulas', { itens: [item({ acao: 'cancelar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', hora: '15:30', cobranca: 'sem' })] }, ctxDe(DB, { gravar: false })); return [r.erro, /desconhecida/.test(r.resultado.erro), r.linhas]; })(), [true, true, null]);
conf('nem o buscar_assunto existe para quem só lê', A.executar('buscar_assunto', { termo: 'frações' }, ctxDe(DB, { gravar: false })).erro, true);

secao('2. Remarcar (G03, G04): a aula certa, a inexistente, o homônimo, o choque, além de materializadoAte');
let r = propor('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', hora: '15:30', nova_data: '2026-11-19', nova_hora: '17:30' })] });
let l = r.linhas && r.linhas[0];
conf('o cartão diz em linguagem dela: "Remarcar Marina, qui 19/11: de 15h30 para 17h30"', l && l.titulo, 'Remarcar Marina, qui 19/11: de 15h30 para 17h30');
conf('o Entendi, o antes, o depois e o dinheiro (do core)', l && [l.entendido, l.antes, l.depois, l.dinheiro], ['quinta, 19/11, 15h30', 'qui 19/11, 15h30 (1h), agendada', 'qui 19/11, 17h30 (1h)', 'O valor do mês não muda.']);
conf('na aula de repetição, o cartão diz que muda só esta', l && l.avisos.some(a => /muda só esta aula/.test(a)), true);
conf('o resultado ao modelo diz que NADA foi gravado', /NADA foi gravado/.test(JSON.stringify(r.resultado)), true);
conf('confirmado = o Remarcar do celular (Core.aplicarEdicaoAula só nesta, { data, hora, duracaoMin }), byte a byte',
  JSON.stringify(confirmado(r.linhas)), JSON.stringify(pelaTela(db => Core.aplicarEdicaoAula(db, 's1@2026-11-19', { data: '2026-11-19', hora: '17:30', duracaoMin: 60 }, 'esta'))));
naoGravou('remarcar');
r = propor('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', hora: null, nova_data: '2026-11-20', nova_hora: null })] });
conf('sem a hora: acha a única aula do dia; "remarca para sexta" mantém a hora (K1)', r.linhas && [r.linhas[0].titulo, r.linhas[0].op.mudancas], ['Remarcar Marina, qui 19/11: de qui 19/11, 15h30 para sex 20/11, 15h30', { data: '2026-11-20', hora: '15:30', duracaoMin: 60 }]);
const k1 = confirmado(r.linhas);
conf('K1 confirmado: a aula muda de data com o mesmo id (ligada à original), e a data antiga vira exclusão da série',
  [k1.aulas.filter(a => a.id === 's1@2026-11-19').map(a => a.data + ' ' + a.destacada)[0], k1.series[0].exclusoes], ['2026-11-20 true', ['2026-11-19']]);
r = propor('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-18', hora: '15:30', nova_data: '2026-11-20', nova_hora: '15:30' })] });
conf('recusa: a aula que não existe (quarta 18/11) volta como nao_achei, sem cartão', [r.erro, /^nao_achei/.test(r.resultado.erro), r.linhas], [true, true, null]);
r = propor('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', hora: '10:00', nova_data: '2026-11-20', nova_hora: '15:30' })] });
conf('recusa: a data certa e a hora errada, com a hora que existe no dia', [r.erro, /15h30/.test(r.resultado.erro)], [true, true]);
r = propor('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'anas', nome_dito: 'Ana', data: '2026-11-17', hora: null, nova_data: '2026-11-18', nova_hora: null })] });
conf('recusa: "Ana" com duas Anas ativas é ambíguo, e o erro manda perguntar com os dois nomes', [r.erro, /^ambiguo/.test(r.resultado.erro), /Ana S\. e Ana O\./.test(r.resultado.erro)], [true, true, true]);
r = propor('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'anas', nome_dito: 'Ana S.', data: '2026-11-17', hora: null, nova_data: '2026-11-18', nova_hora: null })] });
conf('"Ana S." (a inicial que a lista dá) é inequívoco', [r.erro, r.linhas && r.linhas[0].nome], [false, 'Ana S.']);
conf('"Ana O." e "a Ana Outra" (artigo e inicial) também são inequívocos; "a Ana" não', ['Ana O.', 'a Ana Outra', 'a Ana'].map(n =>
  propor('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'anao', nome_dito: n, data: '2026-11-17', hora: null, nova_data: '2026-11-18', nova_hora: null })] }).erro), [false, false, true]);
r = propor('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'anao', nome_dito: 'Ana Sintética', data: '2026-11-17', hora: null, nova_data: '2026-11-18', nova_hora: null })] });
conf('recusa: o nome dito é de outra aluna que não a do id', [r.erro, /Confira o id/.test(r.resultado.erro)], [true, true]);
r = propor('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', hora: '15:30', nova_data: '2026-11-20', nova_hora: '17:30' })] });
conf('choque de horário (Bruno sexta 17h30): o cartão avisa, pela conta do Vagos', r.linhas && r.linhas[0].avisos.filter(a => /Já há aula/.test(a)), ['Já há aula neste horário: Bruno às 17h30. As duas ficam no mesmo horário.']);
r = propor('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', hora: '15:30', nova_data: '2026-11-20', nova_hora: '10:00' })] });
conf('(controle) horário livre: sem aviso de choque', r.linhas[0].avisos.filter(a => /Já há aula/.test(a)).length, 0);
r = propor('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-12-03', hora: '15:30', nova_data: '2026-12-04', nova_hora: null })] });
conf('além de materializadoAte (03/12, prevista): a proposta pede para lançar dezembro antes, e o dinheiro já usa a vigência de dezembro',
  r.linhas && [r.linhas[0].op.materializar, r.linhas[0].op.serieId, r.linhas[0].op.aulaId, r.linhas[0].dinheiro], ['2026-12', 's1', undefined, 'O valor do mês não muda.']);
naoGravou('proposta além de materializadoAte (a simulação roda numa cópia)');
conf('confirmado além de materializadoAte = a tela: o tablet navega a dezembro (Core.garantirSeriesAte) e remarca só esta',
  JSON.stringify(confirmado(r.linhas)), JSON.stringify(pelaTela(db => { Core.garantirSeriesAte(db, '2026-12'); Core.aplicarEdicaoAula(db, 's1@2026-12-03', { data: '2026-12-04', hora: '15:30', duracaoMin: 60 }, 'esta'); })));
r = propor('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-26', hora: '15:30', nova_data: '2026-12-01', nova_hora: null })] });
conf('remarcar de novembro para dezembro: o valor sai de um mês e entra no outro, pela vigência (120 e 130)', r.linhas[0].dinheiro, 'O valor de novembro diminui R$ 120,00. O valor de dezembro aumenta R$ 130,00.');

secao('3. Duração (G05): o valor que muda');
r = propor('propor_aulas', { itens: [item({ acao: 'mudar_duracao', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', hora: null, duracao_min: 90 })] });
conf('1h para 1h30: "O valor de novembro aumenta R$ 60,00."', r.linhas && [r.linhas[0].titulo, r.linhas[0].dinheiro], ['Duração da aula de Marina, qui 19/11, 15h30: de 1h para 1h30', 'O valor de novembro aumenta R$ 60,00.']);
conf('confirmado = o "Ajustar duração" do celular ({ duracaoMin })', JSON.stringify(confirmado(r.linhas)), JSON.stringify(pelaTela(db => Core.aplicarEdicaoAula(db, 's1@2026-11-19', { duracaoMin: 90 }, 'esta'))));
conf('recusa: a mesma duração, e 50 minutos (fora da grade de 15)', [propor('propor_aulas', { itens: [item({ acao: 'mudar_duracao', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', duracao_min: 60 })] }).erro,
  propor('propor_aulas', { itens: [item({ acao: 'mudar_duracao', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', duracao_min: 50 })] }).erro], [true, true]);

secao('4. Cancelar (G08 a G11): três saídas com dinheiro diferente, e a pergunta quando a fala não diz');
r = propor('propor_aulas', { itens: [item({ acao: 'cancelar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', hora: null, cobranca: 'perguntar' })] });
l = r.linhas[0];
conf('"cancela a da Marina": o cartão PERGUNTA, com as opções e o dinheiro de cada uma (aula futura: sem a falta)',
  l.opcoes.map(o => o.rotulo + ': ' + o.dinheiro), ['Cancelada sem cobrança: O valor de novembro diminui R$ 120,00.', 'Cancelada e cobrada: O valor do mês não muda.']);
conf('sem escolher, o Confirmar não tem o que gravar', A.opsConfirmadas(r.linhas, {}).falta, 'cobranca');
conf('escolhida "sem": = o "Cancelar sem cobrança" do celular e o "Cancelar aula" do Fechamento',
  JSON.stringify(confirmado(r.linhas, { escolha: { 0: 'sem' } })), JSON.stringify(pelaTela(db => Core.aplicarEdicaoAula(db, 's1@2026-11-19', { status: 'cancelada', cobravel: false }, 'esta'))));
conf('escolhida "com": = o "Cancelar e cobrar" do celular',
  JSON.stringify(confirmado(r.linhas, { escolha: { 0: 'com' } })), JSON.stringify(pelaTela(db => Core.aplicarEdicaoAula(db, 's1@2026-11-19', { status: 'cancelada', cobravel: true }, 'esta'))));
r = propor('propor_aulas', { itens: [item({ acao: 'cancelar', alunoId: 'bru', nome_dito: 'Bruno', data: HOJE, hora: '08:00', cobranca: 'perguntar' })] });
l = r.linhas[0];
conf('a aula de hoje (já dada): três saídas, com a falta, e o aviso de que ela já conta',
  [l.opcoes.map(o => o.id + ': ' + o.dinheiro), l.avisos.some(a => /está como dada/.test(a))],
  [['sem: O valor de novembro diminui R$ 150,00.', 'com: O valor do mês não muda.', 'falta: O valor do mês não muda.'], true]);
conf('novembro do Bruno já tem "pago em": a saída que muda o valor avisa do selo', l.opcoes[0].avisos, ['Novembro de 2026 já tem pagamento marcado: o selo do mês vai mudar.']);
r = propor('propor_aulas', { itens: [item({ acao: 'cancelar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', cobranca: 'sem' })] });
conf('"cancela sem cobrança": sem pergunta, o nome do PDF e o dinheiro', [r.linhas[0].opcoes, r.linhas[0].depois, r.linhas[0].dinheiro], [undefined, 'Cancelada sem cobrança', 'O valor de novembro diminui R$ 120,00.']);
r = propor('propor_aulas', { itens: [item({ acao: 'falta', alunoId: 'bru', nome_dito: 'Bruno', data: HOJE, cobranca: null })] });
conf('G08 falta de hoje: cobrada por padrão, o valor não muda', [r.linhas[0].depois, r.linhas[0].dinheiro], ['Falta sem aviso (cobrada)', 'O valor do mês não muda.']);
conf('confirmado = o "Faltou" do celular ({ status: falta, cobravel: true })', JSON.stringify(confirmado(r.linhas)), JSON.stringify(pelaTela(db => Core.aplicarEdicaoAula(db, 'b1', { status: 'falta', cobravel: true }, 'esta'))));
conf('recusa: falta numa aula que ainda não aconteceu (manda cancelar ou remarcar)', /ainda não aconteceu/.test(propor('propor_aulas', { itens: [item({ acao: 'falta', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19' })] }).resultado.erro), true);
r = propor('propor_aulas', { itens: [item({ acao: 'nao_cobrar', alunoId: 'bru', nome_dito: 'Bruno', data: HOJE })] });
conf('G11 "não cobra esta aula": diminui R$ 150 e = o "Não cobrar" do Fechamento ({ cobravel: false })',
  [r.linhas[0].dinheiro, JSON.stringify(confirmado(r.linhas)) === JSON.stringify(pelaTela(db => Core.aplicarEdicaoAula(db, 'b1', { cobravel: false }, 'esta')))], ['O valor de novembro diminui R$ 150,00.', true]);

secao('5. Voltar (G07, G13), criar (G01) e reposição (G12)');
r = propor('propor_aulas', { itens: [item({ acao: 'voltar_a_dada', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-05' })] });
conf('G07 "a falta foi engano": volta a dada, = o "Realizada" do celular', [r.linhas[0].titulo, JSON.stringify(confirmado(r.linhas)) === JSON.stringify(pelaTela(db => Core.aplicarEdicaoAula(db, 's1@2026-11-05', { status: 'realizada', cobravel: true }, 'esta')))],
  ['A aula de Marina, qui 05/11, 15h30 volta a contar como dada', true]);
conf('recusa: voltar uma aula que não é falta nem cancelada', propor('propor_aulas', { itens: [item({ acao: 'voltar_a_dada', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19' })] }).erro, true);
r = propor('propor_aulas', { itens: [item({ acao: 'criar_aula', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-21', hora: '10:00', duracao_min: null })] });
conf('G01 "marca uma aula com o Bruno sábado às 10h": 1h, cobrada, aumenta R$ 150', [r.linhas[0].titulo, r.linhas[0].dinheiro], ['Marcar aula de Bruno, sáb 21/11, 10h (1h)', 'O valor de novembro aumenta R$ 150,00.']);
const novaTela = c => ({ id: Core.uid(), alunoId: c.alunoId, serieId: null, destacada: false, data: c.data, hora: c.hora, duracaoMin: c.duracaoMin, status: c.status, cobravel: c.cobravel,
  notaTexto: '', notaPrivada: '', temNota: false, anexos: [] }); // a novaAulaAvulsa do app.js, copiada
const fonteApp = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
conf('(arranjo) a cópia é a novaAulaAvulsa do app.js de agora', /function novaAulaAvulsa\(c\) \{\s*return \{\s*id: Core\.uid\(\), alunoId: c\.alunoId, serieId: null, destacada: false,\s*data: c\.data, hora: c\.hora, duracaoMin: c\.duracaoMin, status: c\.status, cobravel: c\.cobravel,\s*notaTexto: '', notaPrivada: '', temNota: false, anexos: \[\]\s*\};/.test(fonteApp), true);
conf('confirmado = o "Marcar aula" do celular (a mesma aula avulsa, fora o id novo)', semIdsNovos(confirmado(r.linhas)),
  semIdsNovos(pelaTela(db => db.aulas.push(novaTela({ alunoId: 'bru', data: '2026-11-21', hora: '10:00', duracaoMin: 60, status: 'realizada', cobravel: true })))));
conf('recusa: aula nova sem hora, e aula repetida no mesmo horário', [propor('propor_aulas', { itens: [item({ acao: 'criar_aula', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-21', hora: null })] }).erro,
  /já existe/.test(propor('propor_aulas', { itens: [item({ acao: 'criar_aula', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-20', hora: '17:30' })] }).resultado.erro)], [true, true]);
r = propor('propor_aulas', { itens: [item({ acao: 'criar_aula', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-20', hora: '17:00', duracao_min: 60 })] });
conf('aula nova em cima de outra: o aviso de choque', r.linhas[0].avisos.some(a => /Bruno às 17h30/.test(a)), true);
r = propor('propor_aulas', { itens: [item({ acao: 'criar_reposicao', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-21', hora: '10:00' })] });
conf('G12 reposição: situação reposição, cobrada, e o cartão diz que não fica ligada à aula que repõe', [r.linhas[0].op.campos.status, r.linhas[0].op.campos.cobravel, r.linhas[0].avisos.some(a => /não fica ligada/.test(a))], ['reposicao', true, true]);

secao('6. Relato (G17 a G19) e feedback (G42): rascunho editável, sem perder o que já estava');
r = propor('propor_relato', { itens: [{ alunoId: 'bru', nome_dito: 'Bruno', data: HOJE, hora: null, relato_familia: 'Trabalhamos frações equivalentes; foi bem.', nota_so_minha: 'Treinar leitura de enunciado.',
  assuntos: [{ titulo: 'frações', ref: 'b:MAT-FRA' }, { titulo: 'Leitura de problemas', ref: null }], areas: ['enunciado', 'nao-existe'] }] });
l = r.linhas[0];
conf('o rascunho separa a família da nota só dela, com o assunto do catálogo e o livre, e só a área que existe',
  [l.editavel.relato, l.editavel.nota, l.editavel.assuntos, l.editavel.areas.map(a => a.id)],
  ['Trabalhamos frações equivalentes; foi bem.', 'Treinar leitura de enunciado.', [{ id: 'MAT-FRA', titulo: 'Frações equivalentes', fonte: 'banco', disciplina: 'matematica' }, { titulo: 'Leitura de problemas', fonte: 'livre' }], ['enunciado']]);
const relatoEd = confirmado(r.linhas, { edicao: { 0: { relato: 'Frações equivalentes: foi bem.', semAssunto: { 1: true } } } });
conf('o que ela editou e o assunto que ela tirou valem no Confirmar', (() => { const a = relatoEd.aulas.find(x => x.id === 'b1'); return [a.notaTexto, a.notaPrivada, a.temas.map(t => t.titulo), a.areas, a.status]; })(),
  ['Frações equivalentes: foi bem.', 'Treinar leitura de enunciado.', ['Frações equivalentes'], ['enunciado'], 'realizada']);
conf('o relato sem nota nem área = o "Registrar como foi" do celular (situação de agora, relato, assunto)',
  JSON.stringify(confirmado(propor('propor_relato', { itens: [{ alunoId: 'bru', nome_dito: 'Bruno', data: HOJE, hora: '08:00', relato_familia: 'Foi bem.', nota_so_minha: '', assuntos: [{ titulo: 'Equações', ref: null }], areas: [] }] }).linhas)),
  JSON.stringify(pelaTela(db => { Core.aplicarEdicaoAula(db, 'b1', { status: 'realizada', notaTexto: 'Foi bem.' }, 'esta'); const a = db.aulas.find(x => x.id === 'b1'); a.temas = Core.temasDaAula(a); a.temas.push({ titulo: 'Equações', fonte: 'livre' }); delete a.tema; })));
r = propor('propor_relato', { itens: [{ alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-12', hora: null, relato_familia: 'Revisão.', nota_so_minha: 'Cansada.', assuntos: [], areas: [] }] });
conf('a aula que já tinha nota só dela: o rascunho traz só o NOVO, o antigo à parte, e o cartão avisa', [r.linhas[0].editavel.nota, r.linhas[0].editavel.notaAntes === VENENO, r.linhas[0].avisos.some(a => /Já havia registro/.test(a))], ['Cansada.', true, true]);
conf('confirmado: o antigo fica EXATAMENTE como estava, e o novo entra depois', confirmado(r.linhas).aulas.find(x => x.id === 's1@2026-11-12').notaPrivada === VENENO + '\n\nCansada.', true);
conf('recusa: relato de aula que ainda não aconteceu', propor('propor_relato', { itens: [{ alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', hora: null, relato_familia: 'x', nota_so_minha: '', assuntos: [], areas: [] }] }).erro, true);
r = propor('propor_feedback', { alunoId: 'mar', nome_dito: 'Marina', mes: '2026-10', texto: 'Ela também melhorou na leitura.' });
conf('G42: o rascunho traz só o texto novo; o feedback que já existia fica à parte', [r.linhas[0].editavel.feedback, r.linhas[0].editavel.feedbackAntes], ['Ela também melhorou na leitura.', 'Em outubro a Marina avançou em frações.']);
conf('confirmado = o Core.gravarTextoDoMes do editor do celular, com o texto que ela deixou',
  JSON.stringify(confirmado(r.linhas, { edicao: { 0: { feedback: 'Texto final.' } } })), JSON.stringify(pelaTela(db => Core.gravarTextoDoMes(db, 'mar', '2026-10', 'Em outubro a Marina avançou em frações.\n\nTexto final.'))));
conf('feedback apagado por ela: o Confirmar não grava vazio', A.opsConfirmadas(r.linhas, { edicao: { 0: { feedback: '  ' } } }).falta, 'texto');
conf('buscar_assunto devolve o ref do catálogo', propor('buscar_assunto', { termo: 'frações' }).resultado.assuntos.map(a => a.ref), ['b:MAT-FRA']);
conf('historico_aluno traz os feedbacks recentes (o tom dela) e nunca a nota só dela', (() => { const h = A.executar('historico_aluno', { alunoId: 'mar', n: 5 }, ctx).resultado; return [h.feedbacks_recentes.map(f => f.mes), JSON.stringify(h).indexOf(VENENO) >= 0]; })(), [['outubro de 2026'], false]);
naoGravou('relato e feedback');

secao('7. K2: cancelar a semana que vem, aula por aula, nunca "esta e as seguintes"');
const semanaQueVem = { itens: [item({ acao: 'cancelar', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-24', hora: '09:00', cobranca: 'perguntar' }),
  item({ acao: 'cancelar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-26', hora: '15:30', cobranca: 'perguntar' })] };
r = propor('propor_aulas', semanaQueVem);
conf('duas linhas, as duas perguntando a cobrança (o cartão pergunta UMA vez para o conjunto)', r.linhas.map(x => !!x.opcoes), [true, true]);
conf('a escolha do conjunto vale para todas', A.opsConfirmadas(r.linhas, { escolhaDoConjunto: 'sem' }).ops.map(o => o.mudancas), [{ status: 'cancelada', cobravel: false }, { status: 'cancelada', cobravel: false }]);
const k2 = confirmado(r.linhas, { escolhaDoConjunto: 'sem' });
const k2Tela = pelaTela(db => { Core.aplicarEdicaoAula(db, 'b3', { status: 'cancelada', cobravel: false }, 'esta'); Core.aplicarEdicaoAula(db, 's1@2026-11-26', { status: 'cancelada', cobravel: false }, 'esta'); });
conf('K2 confirmado = as duas aulas canceladas pela tela, uma por uma ("somente esta")', JSON.stringify(k2), JSON.stringify(k2Tela));
const repeticaoIntacta = db => JSON.stringify(db.series) === JSON.stringify(DB.series) &&
  db.aulas.filter(a => a.serieId && a.data !== '2026-11-26').every(a => JSON.stringify(a) === JSON.stringify(DB.aulas.find(x => x.id === a.id)));
conf('a repetição da Marina sai igual: a série e as outras aulas dela', repeticaoIntacta(k2), true);
/* VENENO: o mesmo plano aplicado pelo escopo "esta e as seguintes". */
const k2Veneno = (() => { const db = JSON.parse(FOTO); A.aplicarPlano(db, A.opsConfirmadas(r.linhas, { escolhaDoConjunto: 'sem' }).ops, Core, { aplicarSo: (id, m) => Core.aplicarEdicaoAula(db, id, m, 'seguintes') }); return db; })();
conf('VENENO: com "esta e as seguintes", a prova acusa (a série corta e nasce outra)', repeticaoIntacta(k2Veneno), false);
conf('o assistente.js nunca escreve o escopo da série: nem \'seguintes\' nem \'todas\'', /'seguintes'|'todas'|"seguintes"|"todas"/.test(fs.readFileSync(path.join(__dirname, '..', 'assistente.js'), 'utf8')), false);
r = propor('propor_aulas', { itens: [item({ acao: 'cancelar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-12-03', cobranca: 'sem' }), item({ acao: 'cancelar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-12-10', cobranca: 'sem' })] });
const k2Dez = confirmado(r.linhas);
conf('K2 além de materializadoAte: dezembro é lançado como o tablet lança, e só as duas canceladas',
  JSON.stringify(k2Dez), JSON.stringify(pelaTela(db => { Core.garantirSeriesAte(db, '2026-12'); ['s1@2026-12-03', 's1@2026-12-10'].forEach(id => Core.aplicarEdicaoAula(db, id, { status: 'cancelada', cobravel: false }, 'esta')); })));
conf('recusa: a mesma aula duas vezes no cartão', /já está numa linha/.test(propor('propor_aulas', { itens: [semanaQueVem.itens[0], semanaQueVem.itens[0]] }).resultado.erro), true);
conf('tirar o ✓ de uma linha: só a outra grava', A.opsConfirmadas(r.linhas, { semLinha: { 0: true } }).ops.map(o => o.data), ['2026-12-10']);
conf('tirar todas: nada a gravar', A.opsConfirmadas(r.linhas, { semLinha: { 0: true, 1: true } }).falta, 'nada');

secao('7b. A lente de dados de f9b7791 (scratchpad\\lente4a\\ataques.js): cada achado, com prova');
/* O banco do ataque: Marina na segunda e na quinta, lançada até novembro;
 * dezembro só prevista; mais uma "Marina Sintética" de nome idêntico. */
function bancoDoAtaque(comHomonima) {
  const db = { versao: 1, ajustes: {}, resumos: [], pagamentos: [], aulas: [], alunos: [
    { id: 'mar', nome: 'Marina Sintética', ativo: true, precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 120 }] },
    { id: 'bru', nome: 'Bruno Teste', ativo: true, precos: [{ id: 'p5', inicio: '2026-01-01', fim: null, valorHora: 150 }] }
  ], series: [
    { id: 's1', alunoId: 'mar', dias: [1, 4], hora: '15:30', duracaoMin: 60, inicio: '2026-10-01', fim: null, exclusoes: [], materializadoAte: null, status: 'realizada' },
    { id: 's2', alunoId: 'bru', dias: [2], hora: '09:00', duracaoMin: 60, inicio: '2026-10-01', fim: null, exclusoes: [], materializadoAte: null, status: 'realizada' }
  ] };
  Core.garantirSeriesAte(db, '2026-11');
  if (comHomonima) { db.alunos.push({ id: 'm2', nome: 'Marina Sintética', ativo: true, precos: [{ id: 'p6', inicio: '2026-01-01', fim: null, valorHora: 90 }] }); db.aulas.push(aula('m2a', 'm2', '2026-11-17', '10:00')); }
  return db;
}
const itA = o => item(Object.assign({ acao: 'remarcar', alunoId: 'mar', nome_dito: 'Marina S' }, o));
const ctxA = (db, fala) => ctxDe(db, { catalogo: null, fala: fala === undefined ? 'frase de prova: ela falou da cobrança' : fala });
{
  /* A1: 26/11 para 03/12 (quinta, dia da própria série, dezembro não lançado). */
  const db = bancoDoAtaque();
  const rA1 = A.executar('propor_aulas', { itens: [itA({ data: '2026-11-26', hora: '15:30', nova_data: '2026-12-03', nova_hora: '17:00' })] }, ctxA(db));
  A.aplicarPlano(db, A.opsConfirmadas(rA1.linhas, {}).ops, Core);
  Core.garantirSeriesAte(db, '2026-12');
  const dia = db.aulas.filter(a => a.alunoId === 'mar' && a.data === '2026-12-03').map(a => a.hora).sort();
  conf('A1: remarcada para 03/12, a aula fixa daquele dia continua (15:30 e 17:00)', dia, ['15:30', '17:00']);
  conf('A1: dezembro fecha R$ 1.200 (9 fixas e a remarcada), e não R$ 1.080', Core.calcularFechamento(db, 'mar', '2026-12', HOJE).totalValor, 1200);
  conf('A1: o cartão já dizia o dinheiro certo dos dois meses', rA1.linhas[0].dinheiro, 'O valor de novembro diminui R$ 120,00. O valor de dezembro aumenta R$ 120,00.');
  /* VENENO A1: o mesmo plano sem lançar o mês de destino (o de antes). */
  const dbV = bancoDoAtaque();
  const opsV = A.opsConfirmadas(A.executar('propor_aulas', { itens: [itA({ data: '2026-11-26', hora: '15:30', nova_data: '2026-12-03', nova_hora: '17:00' })] }, ctxA(dbV)).linhas, {}).ops;
  Core.aplicarEdicaoAula(dbV, opsV[0].aulaId, opsV[0].mudancas, 'esta'); Core.garantirSeriesAte(dbV, '2026-12');
  conf('VENENO A1: sem lançar o destino antes, a fixa de 03/12 some (a prova vê)', dbV.aulas.filter(a => a.alunoId === 'mar' && a.data === '2026-12-03').length, 1);
}
{
  const db = bancoDoAtaque();
  const cria = itA({ acao: 'criar_aula', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-18', hora: '10:00' });
  const r2 = A.executar('propor_aulas', { itens: [cria, cria] }, ctxA(db));
  conf('A2: a mesma aula nova duas vezes no cartão é recusada', [r2.erro, /já está numa linha/.test(r2.resultado.erro)], [true, true]);
  conf('A2 (controle): duas aulas novas em horas diferentes passam', A.executar('propor_aulas', { itens: [cria, Object.assign({}, cria, { hora: '11:00' })] }, ctxA(db)).erro, false);
  db.aulas.find(a => a.id === 's1@2026-11-12').status = 'falta';
  const r3 = A.executar('propor_aulas', { itens: [itA({ data: '2026-11-12', hora: '15:30', nova_data: '2026-11-27', nova_hora: '10:00' })] }, ctxA(db));
  conf('A3: remarcar uma falta é recusado, com o caminho da reposição e do engano', [r3.erro, /criar_reposicao/.test(r3.resultado.erro), /voltar_a_dada/.test(r3.resultado.erro)], [true, true, true]);
  const r10 = A.executar('propor_aulas', { itens: [itA({ acao: 'cancelar', data: '2026-11-12', hora: '15:30', cobranca: 'perguntar' })] }, ctxA(db));
  conf('A10: na aula que já é falta, o cartão não oferece "Falta sem aviso"', r10.linhas[0].opcoes.map(o => o.id), ['sem', 'com']);
  conf('A12: cada saída leva o valor em centavos, para o cartão do conjunto dizer os reais', r10.linhas[0].opcoes.map(o => o.centavos), [-12000, 0]);
}
{
  const db = bancoDoAtaque();
  const r4 = A.executar('propor_aulas', { itens: [itA({ acao: 'cancelar', data: '2028-11-16', hora: '15:30', cobranca: 'sem' })] }, ctxA(db));
  conf('A4: aula prevista a mais de 12 meses de hoje é recusada (o Confirmar lançaria anos de aulas)', [r4.erro, /12 meses/.test(r4.resultado.erro)], [true, true]);
  const r4b = A.executar('propor_aulas', { itens: [itA({ data: '2026-11-19', hora: '15:30', nova_data: '2028-01-10', nova_hora: '' })] }, ctxA(db));
  conf('A4: remarcar para mais de 12 meses também', r4b.erro, true);
  conf('A4 (controle): dez meses à frente passa', A.executar('propor_aulas', { itens: [itA({ acao: 'cancelar', data: '2027-09-16', hora: '15:30', cobranca: 'sem' })] }, ctxA(db)).erro, false);
}
{
  /* A7: o choque que apareceu depois da proposta muda a assinatura. */
  const db = bancoDoAtaque();
  const ch = [{ nome: 'propor_aulas', entrada: { itens: [itA({ data: '2026-11-19', hora: '15:30', nova_data: '2026-11-20', nova_hora: '09:00' })] } }];
  const fala = 'remarca a da Marina';
  const a1 = A.assinatura(A.conferirDeNovo(ch, ctxDe(db), fala));
  db.aulas.push(aula('x1', 'bru', '2026-11-20', '09:00'));
  conf('A7: um choque novo na nuvem muda a assinatura (o Confirmar não grava sem ela ver)', A.assinatura(A.conferirDeNovo(ch, ctxDe(db), fala)) === a1, false);
}
{
  /* A8: áreas que são nomes do protótipo, e tipos errados vindos do modelo. */
  const db = bancoDoAtaque();
  const rel = extra => A.executar('propor_relato', { itens: [Object.assign({ alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-12', hora: '', relato_familia: 'ok', nota_so_minha: '', assuntos: [], areas: [] }, extra)] }, ctxA(db));
  const r8 = rel({ areas: ['__proto__', 'constructor', 'toString', 'enunciado'] });
  conf('A8: "__proto__", "constructor" e "toString" não viram área; "enunciado" vira', r8.linhas[0].editavel.areas.map(a => a.id), ['enunciado']);
  const r8b = rel({ relato_familia: { a: 1 }, nota_so_minha: 5, assuntos: 'x', areas: 'y' });
  conf('A8: tipos errados não viram texto "[object Object]" nem quebram: nada a registrar', [r8b.erro, /nada a registrar/.test(r8b.resultado.erro)], [true, true]);
  const r8c = rel({ assuntos: [null, { titulo: {} }, { titulo: 'Frações', ref: 5 }] });
  conf('A8: assunto sem texto é ignorado; o texto livre fica', r8c.linhas[0].editavel.assuntos, [{ titulo: 'Frações', fonte: 'livre' }]);
}
{
  /* A5: homônimos, inclusive de nome completo idêntico. */
  const db = bancoDoAtaque(true);
  const nomes = A.nomesParaIA(db);
  conf('A5: dois "Marina Sintética" ganham rótulos distintos', [nomes.mar, nomes.m2], ['Marina Sintética (1)', 'Marina Sintética (2)']);
  const can = nd => A.executar('propor_aulas', { itens: [itA({ acao: 'cancelar', alunoId: 'm2', nome_dito: nd, data: '2026-11-17', hora: '10:00', cobranca: 'sem' })] }, ctxA(db)).erro;
  conf('A5: "Marina", "Marina Sintética", "ela" e o vazio são ambíguos; o rótulo exato "(2)" não', ['Marina', 'Marina Sintética', 'ela', '', 'Marina Sintética (2)'].map(can), [true, true, true, true, false]);
  conf('A5 (controle): sem homônimo, o nome vazio vale pelo id', A.executar('propor_aulas', { itens: [itA({ acao: 'cancelar', alunoId: 'bru', nome_dito: '', data: '2026-11-17', hora: '09:00', cobranca: 'sem' })] }, ctxA(bancoDoAtaque(true))).erro, false);
}
{
  /* 4: a cobrança vem da FALA dela, nunca do modelo. */
  const db = bancoDoAtaque();
  const cancelar = (fala, cob) => { const r = A.executar('propor_aulas', { itens: [itA({ acao: 'cancelar', data: '2026-11-19', hora: '15:30', cobranca: cob })] }, ctxA(db, fala)); return r.linhas[0].opcoes ? 'pergunta' : r.linhas[0].op.mudancas.cobravel; };
  conf('4: a fala sem palavra de cobrança: "com" e "sem" do modelo viram a pergunta do cartão',
    [cancelar('cancela a da Marina de quinta', 'sem'), cancelar('cancela a da Marina de quinta', 'com'), cancelar('', 'sem'),
      (() => { const r = A.executar('propor_aulas', { itens: [itA({ acao: 'cancelar', data: '2026-11-19', hora: '15:30', cobranca: 'com' })] }, ctxDe(db, { fala: undefined })); return r.linhas[0].opcoes ? 'pergunta' : 'decidiu'; })()],
    ['pergunta', 'pergunta', 'pergunta', 'pergunta']);
  conf('4: com a palavra dela, vale o que ela disse',
    [['cancela sem cobrar', 'sem'], ['cancela, mas cobra', 'com'], ['foi cortesia, cancela', 'sem'], ['cancela, fica de graça', 'sem'], ['cancela, que é pago', 'com']].map(p => cancelar(p[0], p[1])), [false, true, false, false, true]);
  conf('4: texto injetado pelo modelo (no nome dito) não conta como fala dela',
    (() => { const r = A.executar('propor_aulas', { itens: [itA({ acao: 'cancelar', nome_dito: 'Marina sem cobrar', data: '2026-11-19', hora: '15:30', cobranca: 'sem' })] }, ctxA(db, 'cancela a da Marina')); return r.erro ? 'erro' : (r.linhas[0].opcoes ? 'pergunta' : 'decidiu'); })(), 'pergunta');
  const falta = (fala, cob) => A.executar('propor_aulas', { itens: [itA({ acao: 'falta', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-10', hora: '09:00', cobranca: cob })] }, ctxA(db, fala)).linhas[0].op.mudancas.cobravel;
  conf('4: falta "sem" do modelo sem a palavra dela fica cobrada (o padrão); com "não cobra", sem cobrança', [falta('o Bruno faltou', 'sem'), falta('o Bruno faltou, não cobra', 'sem')], [true, false]);
  const criar = (fala, cob) => A.executar('propor_aulas', { itens: [itA({ acao: 'criar_aula', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-21', hora: '10:00', cobranca: cob })] }, ctxA(db, fala)).linhas[0].op.campos.cobravel;
  conf('4: aula nova "sem" só com a palavra dela', [criar('marca aula sábado', 'sem'), criar('marca aula sábado, de graça', 'sem')], [true, false]);
}

secao('8. "Nada grava sem Confirmar", K6 e K7 num cartão só, e o Confirmar que confere de novo');
const filaDoModelo = [];
function respostaFerramentas(chamadas) { return { ok: true, resposta: { stop_reason: 'tool_use', usage: {}, content: [{ type: 'thinking', thinking: '', signature: 's' }].concat(chamadas.map((c, i) => ({ type: 'tool_use', id: 't' + i, name: c[0], input: c[1] }))) } }; }
function respostaTexto(t) { return { ok: true, resposta: { stop_reason: 'end_turn', usage: {}, content: [{ type: 'text', text: t }] } }; }
const pedidos = [];
const o = { ctx, hora: '11:00', chamar: c => { pedidos.push(c); return Promise.resolve(filaDoModelo.shift()); } };
(async () => {
  const sessao = A.novaSessao();
  filaDoModelo.push(respostaFerramentas([
    ['propor_aulas', { itens: [item({ acao: 'falta', alunoId: 'bru', nome_dito: 'Bruno', data: HOJE, cobranca: 'com' }), item({ acao: 'criar_reposicao', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-21', hora: '10:00' })] }],
    ['propor_relato', { itens: [{ alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-12', hora: null, relato_familia: 'Frações.', nota_so_minha: '', assuntos: [], areas: [] }] }]
  ]), respostaTexto('Preparei o cartão: confira e toque em Confirmar.'));
  const res = await A.perguntar(sessao, 'o Bruno não veio hoje, cobra, marca a reposição sábado às 10h; e hoje com a Marina foi frações', o);
  conf('K6 e K7: as duas propostas da mesma pergunta viram UM cartão com três linhas', res.proposta && res.proposta.linhas.map(x => x.tipo), ['falta', 'criar_reposicao', 'relato']);
  conf('o pedido de quem grava leva as 20 ferramentas e o sistema das propostas', [pedidos[0].tools.length, pedidos[0].system === A.SISTEMA_GRAVA], [20, true]);
  conf('o modelo pediu a gravação, ninguém tocou em Confirmar: o banco congelado saiu igual byte a byte', JSON.stringify(DB) === FOTO, true);
  conf('o resultado ao modelo não leva a nota só dela, o telefone nem o endereço', saidasAoModelo.concat(pedidos.map(p => JSON.stringify(p.messages))).some(s => s.indexOf(VENENO) >= 0 || /98765/.test(s)), false);
  conf('a conferência de novo, com o banco igual, dá a mesma assinatura', A.assinatura(A.conferirDeNovo(res.proposta.chamadas, ctx)) === res.proposta.assinatura, true);
  const mudado = bancoSintetico(); mudado.aulas.find(a => a.id === 'b1').hora = '09:00';
  let deNovo; try { deNovo = A.assinatura(A.conferirDeNovo(res.proposta.chamadas, ctxDe(mudado))); } catch (e) { deNovo = 'recusou'; }
  conf('a agenda mudou (a aula do Bruno foi para 9h): o Confirmar não grava (assinatura diferente ou recusa)', deNovo !== res.proposta.assinatura, true);
  const mudado2 = bancoSintetico(); mudado2.resumos.push({ alunoId: 'bru', mes: '2026-08', texto: 'x' });
  conf('(controle) uma mudança que não toca o cartão não impede', A.assinatura(A.conferirDeNovo(res.proposta.chamadas, ctxDe(mudado2))) === res.proposta.assinatura, true);
  filaDoModelo.push(respostaFerramentas([['propor_aulas', { itens: [item({ acao: 'cancelar', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-24', hora: '09:00', cobranca: 'sem' })] }]]), respostaTexto('Confira.'));
  const semPalavra = await A.perguntar(A.novaSessao(), 'cancela a aula do Bruno de terça que vem', o);
  conf('4, pelo laço inteiro: a fala dela sem palavra de cobrança e o modelo mandando "sem": o cartão pergunta', [!!semPalavra.proposta.linhas[0].opcoes, semPalavra.proposta.fala], [true, 'cancela a aula do Bruno de terça que vem']);
  conf('4: a reconferência do Confirmar usa a mesma fala e dá a mesma assinatura', A.assinatura(A.conferirDeNovo(semPalavra.proposta.chamadas, ctx, semPalavra.proposta.fala)) === semPalavra.proposta.assinatura, true);
  filaDoModelo.push(respostaTexto('Na próxima.'));
  await A.perguntar(sessao, 'e agora?', Object.assign({}, o, { cartoesAnteriores: 'Falta de Bruno: ela tocou em Agora não; nada gravado' }));
  conf('a pergunta seguinte diz ao modelo o que aconteceu com o cartão', /Cartões anteriores: Falta de Bruno: ela tocou em Agora não/.test(JSON.stringify(pedidos[pedidos.length - 1].messages.filter(m => m.role === 'user').slice(-1))), true);
  const quemSoLe = A.novaSessao(); pedidos.length = 0;
  filaDoModelo.push(respostaFerramentas([['propor_aulas', { itens: [item({ acao: 'falta', alunoId: 'bru', nome_dito: 'Bruno', data: HOJE })] }]]), respostaTexto('Isso se faz no tablet.'));
  const soLe = await A.perguntar(quemSoLe, 'o Bruno faltou', Object.assign({}, o, { ctx: ctxDe(DB, { gravar: false }) }));
  conf('celular que só lê: o pedido vai com as 16, e a proposta forjada volta como erro e sem cartão', [pedidos[0].tools.length, pedidos[0].system === A.SISTEMA, soLe.proposta, pedidos[1].messages[2].content[0].is_error], [16, true, null, true]);

  secao('9. aplicarPlano: tudo ou nada');
  const db9 = JSON.parse(FOTO);
  let lancou = false;
  try { A.aplicarPlano(db9, [{ k: 'editar', aulaId: 'b1', alunoId: 'bru', mudancas: { status: 'falta' } }, { k: 'editar', aulaId: 'sumiu', alunoId: 'bru', mudancas: { status: 'falta' } }], Core); } catch (e) { lancou = e.message; }
  conf('uma aula que sumiu: lança antes de mudar a primeira', [lancou, JSON.stringify(db9) === FOTO], ['aula_sumiu', true]);
  try { lancou = false; A.aplicarPlano(JSON.parse(FOTO), [{ k: 'editar', aulaId: 'b1', alunoId: 'mar', mudancas: {} }], Core); } catch (e) { lancou = e.message; }
  conf('a aula de outro aluno também é recusada', lancou, 'aula_sumiu');

  console.log('\n' + passes + ' verificacoes passaram, ' + falhas + ' falharam');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
