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

/* AS FUNÇÕES DA TELA DE VERDADE (lente do #213, 6): o funcoesDaTela do
 * app.js e o que ele chama (mudarSoEstaAula, revisarTrilhasDoAluno,
 * incluirAssuntoNaAula, novaAulaAvulsa, alunoPorId), tirados do arquivo e
 * postos para rodar sobre o banco da prova, como o testa_dominio faz com o
 * revisarTrilhasDoAluno. O que a prova confirma é o que o app grava. */
const APP_FONTE = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
function extrairDoApp(nome) {
  const ini = APP_FONTE.indexOf('\n  function ' + nome + '(');
  if (ini < 0 || APP_FONTE.indexOf('\n  function ' + nome + '(', ini + 1) >= 0) throw new Error('a função ' + nome + ' não está uma vez só no app.js');
  const fim = APP_FONTE.indexOf('\n  }\n', ini);
  return APP_FONTE.slice(ini, fim + 4);
}
const FONTE_DA_TELA = ['funcoesDaTela', 'mudarSoEstaAula', 'revisarTrilhasDoAluno', 'incluirAssuntoNaAula', 'novaAulaAvulsa', 'alunoPorId'].map(extrairDoApp).join('\n') +
  '\n' + /\n  var MAX_TITULO_ASSUNTO = \d+;/.exec(APP_FONTE)[0];
/* O assistente.js de produção com trocas (os venenos): cada trecho tem de
 * existir uma vez só, senão a prova grita. */
function assistenteEnvenenado(trocas) {
  let fonte = fs.readFileSync(path.join(__dirname, '..', 'assistente.js'), 'utf8').replace(/\r\n/g, '\n');
  trocas.forEach(([de, para]) => {
    if (fonte.split(de).length !== 2) throw new Error('veneno sem âncora única: ' + de.slice(0, 60));
    fonte = fonte.split(de).join(para);
  });
  const Module = require('module');
  const m = new Module(path.join(__dirname, '..', 'assistente_envenenado.js'));
  m.paths = module.paths;
  m._compile(fonte, path.join(__dirname, '..', 'assistente_envenenado.js'));
  return m.exports;
}
function telaDe(db) { return new Function('Core', 'db', FONTE_DA_TELA + '\nreturn funcoesDaTela();')(Core, db); }

const CATALOGO = [{ ref: 'b:MAT-FRA', item: { id: 'MAT-FRA', titulo: 'Frações equivalentes', fonte: 'banco', disciplina: 'matematica' } }];
const catalogo = {
  buscar: t => CATALOGO.filter(c => Core.chaveDeBusca(c.item.titulo).indexOf(Core.chaveDeBusca(t).split(' ')[0]) >= 0).map(c => ({ ref: c.ref, assunto: c.item.titulo, onde: 'Matemática' })),
  item: r => { const c = CATALOGO.find(x => x.ref === r); return c ? Object.assign({}, c.item) : null; }
};
const DB = congelar(bancoSintetico());
const FOTO = JSON.stringify(DB);
/* A FALA DA PROVA: sem fala explícita (FALA_DO_PEDIDO), a prova fala o que o
 * pedido diz, como ela diria: o nome que ela disse e a cobrança que ela
 * disse ("sem cobrar", "pode cobrar", "é cortesia"). As provas da cobrança e
 * do homônimo pela fala (seção 7c) passam a fala delas, que contradiz o modelo. */
const FALA_DO_PEDIDO = { fala: 'do pedido' };
function falaDe(e) {
  return ((e && e.itens) || [e || {}]).map(it => [it.nome_dito || '', it.cobranca === 'sem' ? 'sem cobrar' : it.cobranca === 'com' ? 'pode cobrar' : '',
    it.acao === 'nao_cobrar' ? 'é cortesia' : ''].join(' ').trim()).join('; ');
}
const executarDeVerdade = A.executar;
function exec(nome, entrada, c, ja) { if (c && c.fala === FALA_DO_PEDIDO) c = Object.assign({}, c, { fala: falaDe(entrada) }); return executarDeVerdade(nome, entrada, c, ja); }
const ctxDe = (db, extra) => Object.assign({ db, Core, hoje: HOJE, agoraMin: AGORA, links: {}, gravar: true, catalogo, fala: FALA_DO_PEDIDO }, extra || {});
const ctx = ctxDe(DB);
const saidasAoModelo = [];
function propor(nome, entrada, c) {
  const r = exec(nome, entrada, c || ctx);
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
  A.aplicarPlano(db, r.ops, Core, telaDe(db));
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
  const r = exec('propor_aulas', { itens: [{ acao: 'remarcar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', hora: '', nova_data: '2026-11-20', nova_hora: '', duracao_min: 0, cobranca: 'nao_disse' }] }, ctx);
  return r.linhas && r.linhas[0].op.mudancas; })(), { data: '2026-11-20', hora: '15:30', duracaoMin: 60 });
conf('nenhum minimum, maximum, pattern ou minLength (o modo estrito não aceita)', /"(minimum|maximum|pattern|minLength|maxLength|minItems|maxItems)"/.test(JSON.stringify(comGravar)), false);
conf('as áreas do relato são as do core (enum com os ids de Core.AREAS)', comGravar[17].input_schema.properties.itens.items.properties.areas.items.enum.length, Core.AREAS.reduce((s, g) => s + g.itens.length, 0));
conf('o corpo de quem só lê é o da fase 3 (sistema e ferramentas)', (() => { const c = A.corpo([], false, Core); return [c.system === A.SISTEMA, c.tools.length]; })(), [true, 16]);
conf('o corpo de quem grava leva o sistema das propostas e as 20', (() => { const c = A.corpo([], true, Core); return [c.system === A.SISTEMA_GRAVA, c.tools.length, c.esforco]; })(), [true, 20, 'low']);
conf('o sistema das propostas não tem travessão nem data (cache) e diz que só ela grava', [/[–—]|\d{4}-\d{2}-\d{2}/.test(A.SISTEMA_GRAVA), /só ela grava, tocando em Confirmar/.test(A.SISTEMA_GRAVA), /O que você ainda NÃO faz: marcar/.test(A.SISTEMA_GRAVA)], [false, true, false]);
conf('celular que só lê (gravar false): pedir proposta é ferramenta desconhecida, e nada de cartão',
  (() => { const r = exec('propor_aulas', { itens: [item({ acao: 'cancelar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', hora: '15:30', cobranca: 'sem' })] }, ctxDe(DB, { gravar: false })); return [r.erro, /desconhecida/.test(r.resultado.erro), r.linhas]; })(), [true, true, null]);
conf('nem o buscar_assunto existe para quem só lê', exec('buscar_assunto', { termo: 'frações' }, ctxDe(DB, { gravar: false })).erro, true);

secao('2. Remarcar (G03, G04): a aula certa, a inexistente, o homônimo, o choque, além de materializadoAte');
let r = propor('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', hora: '15:30', nova_data: '2026-11-19', nova_hora: '17:30' })] });
let l = r.linhas && r.linhas[0];
conf('o cartão diz em linguagem dela: "Remarcar Marina, qui 19/11: de 15:30 para 17:30"', l && l.titulo, 'Remarcar Marina, qui 19/11: de 15:30 para 17:30');
conf('o Entendi, o antes, o depois e o dinheiro (do core)', l && [l.entendido, l.antes, l.depois, l.dinheiro], ['quinta, 19/11, 15:30', 'qui 19/11, 15:30 (1h), agendada', 'qui 19/11, 17:30 (1h)', 'O valor do mês não muda.']);
conf('na aula de repetição, o cartão diz que muda só esta, como "aula fixa"', l && l.avisos.indexOf('É uma aula fixa: muda só esta, e as outras semanas continuam iguais.') >= 0, true);
conf('o resultado ao modelo diz que NADA foi gravado', /NADA foi gravado/.test(JSON.stringify(r.resultado)), true);
conf('confirmado = o Remarcar do celular (Core.aplicarEdicaoAula só nesta, { data, hora, duracaoMin }), byte a byte',
  JSON.stringify(confirmado(r.linhas)), JSON.stringify(pelaTela(db => Core.aplicarEdicaoAula(db, 's1@2026-11-19', { data: '2026-11-19', hora: '17:30', duracaoMin: 60 }, 'esta'))));
naoGravou('remarcar');
r = propor('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', hora: null, nova_data: '2026-11-20', nova_hora: null })] });
conf('sem a hora: acha a única aula do dia; "remarca para sexta" mantém a hora (K1)', r.linhas && [r.linhas[0].titulo, r.linhas[0].op.mudancas], ['Remarcar Marina, qui 19/11: de qui 19/11, 15:30 para sex 20/11, 15:30', { data: '2026-11-20', hora: '15:30', duracaoMin: 60 }]);
const k1 = confirmado(r.linhas);
conf('K1 confirmado: a aula muda de data com o mesmo id (ligada à original), e a data antiga vira exclusão da série',
  [k1.aulas.filter(a => a.id === 's1@2026-11-19').map(a => a.data + ' ' + a.destacada)[0], k1.series[0].exclusoes], ['2026-11-20 true', ['2026-11-19']]);
r = propor('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-18', hora: '15:30', nova_data: '2026-11-20', nova_hora: '15:30' })] });
conf('recusa: a aula que não existe (quarta 18/11) volta como nao_achei, sem cartão', [r.erro, /^nao_achei/.test(r.resultado.erro), r.linhas], [true, true, null]);
r = propor('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', hora: '10:00', nova_data: '2026-11-20', nova_hora: '15:30' })] });
conf('recusa: a data certa e a hora errada, com a hora que existe no dia', [r.erro, /15:30/.test(r.resultado.erro)], [true, true]);
r = propor('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'anas', nome_dito: 'Ana', data: '2026-11-17', hora: null, nova_data: '2026-11-18', nova_hora: null })] });
conf('recusa: "Ana" com duas Anas ativas é ambíguo, e o erro manda perguntar com os dois nomes', [r.erro, /^ambiguo/.test(r.resultado.erro), /Ana S\. e Ana O\./.test(r.resultado.erro)], [true, true, true]);
r = propor('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'anas', nome_dito: 'Ana S.', data: '2026-11-17', hora: null, nova_data: '2026-11-18', nova_hora: null })] });
conf('"Ana S." (a inicial que a lista dá) é inequívoco', [r.erro, r.linhas && r.linhas[0].nome], [false, 'Ana S.']);
conf('"Ana O." e "a Ana Outra" (artigo e inicial) também são inequívocos; "a Ana" não', ['Ana O.', 'a Ana Outra', 'a Ana'].map(n =>
  propor('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'anao', nome_dito: n, data: '2026-11-17', hora: null, nova_data: '2026-11-18', nova_hora: null })] }).erro), [false, false, true]);
r = propor('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'anao', nome_dito: 'Ana Sintética', data: '2026-11-17', hora: null, nova_data: '2026-11-18', nova_hora: null })] });
conf('recusa: o nome dito é de outra aluna que não a do id', [r.erro, /Confira o id|^ambiguo/.test(r.resultado.erro)], [true, true]);
r = propor('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', hora: '15:30', nova_data: '2026-11-20', nova_hora: '17:30' })] });
conf('choque de horário (Bruno sexta 17h30): o cartão avisa, pela conta do Vagos', r.linhas && r.linhas[0].avisos.filter(a => /Já há aula/.test(a)), ['Já há aula neste horário: Bruno às 17:30. As duas ficam no mesmo horário.']);
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
conf('1h para 1h30: "O valor de novembro aumenta R$ 60,00."', r.linhas && [r.linhas[0].titulo, r.linhas[0].dinheiro], ['Duração da aula de Marina, qui 19/11, 15:30: de 1h para 1h30', 'O valor de novembro aumenta R$ 60,00.']);
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
  [l.opcoes.map(o => o.id + ': ' + o.dinheiro), l.avisos.some(a => a === 'Esta aula já foi dada: veja abaixo o que muda no valor do mês.')],
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
  ['A aula de Marina, qui 05/11, 15:30 volta a contar como realizada', true]);
conf('recusa: voltar uma aula que não é falta nem cancelada', propor('propor_aulas', { itens: [item({ acao: 'voltar_a_dada', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19' })] }).erro, true);
r = propor('propor_aulas', { itens: [item({ acao: 'criar_aula', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-21', hora: '10:00', duracao_min: null })] });
conf('G01 "marca uma aula com o Bruno sábado às 10h": 1h, cobrada, aumenta R$ 150', [r.linhas[0].titulo, r.linhas[0].dinheiro], ['Marcar aula de Bruno, sáb 21/11, 10:00 (1h)', 'O valor de novembro aumenta R$ 150,00.']);
const novaTela = c => ({ id: Core.uid(), alunoId: c.alunoId, serieId: null, destacada: false, data: c.data, hora: c.hora, duracaoMin: c.duracaoMin, status: c.status, cobravel: c.cobravel,
  notaTexto: '', notaPrivada: '', temNota: false, anexos: [] }); // a novaAulaAvulsa do app.js, copiada
const fonteApp = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
conf('(arranjo) a cópia é a novaAulaAvulsa do app.js de agora', /function novaAulaAvulsa\(c\) \{\s*return \{\s*id: Core\.uid\(\), alunoId: c\.alunoId, serieId: null, destacada: false,\s*data: c\.data, hora: c\.hora, duracaoMin: c\.duracaoMin, status: c\.status, cobravel: c\.cobravel,\s*notaTexto: '', notaPrivada: '', temNota: false, anexos: \[\]\s*\};/.test(fonteApp), true);
conf('confirmado = o "Marcar aula" do celular (a mesma aula avulsa, fora o id novo)', semIdsNovos(confirmado(r.linhas)),
  semIdsNovos(pelaTela(db => db.aulas.push(novaTela({ alunoId: 'bru', data: '2026-11-21', hora: '10:00', duracaoMin: 60, status: 'realizada', cobravel: true })))));
conf('recusa: aula nova sem hora, e aula repetida no mesmo horário', [propor('propor_aulas', { itens: [item({ acao: 'criar_aula', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-21', hora: null })] }).erro,
  /já existe/.test(propor('propor_aulas', { itens: [item({ acao: 'criar_aula', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-20', hora: '17:30' })] }).resultado.erro)], [true, true]);
r = propor('propor_aulas', { itens: [item({ acao: 'criar_aula', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-20', hora: '17:00', duracao_min: 60 })] });
conf('aula nova em cima de outra: o aviso de choque', r.linhas[0].avisos.some(a => /Bruno às 17:30/.test(a)), true);
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
/* Lente da romul-ac, 6: os feedbacks recentes (o tom dela) só vão quando ela pede o rascunho do feedback. */
conf('historico_aluno com a fala pedindo o feedback traz os feedbacks recentes, e nunca a nota só dela', (() => { const h = exec('historico_aluno', { alunoId: 'mar', n: 5 }, ctxDe(DB, { fala: 'escreve o feedback de outubro da Marina', pergunta: 'escreve o feedback de outubro da Marina' })).resultado; return [(h.feedbacks_recentes || []).map(f => f.mes), JSON.stringify(h).indexOf(VENENO) >= 0]; })(), [['outubro de 2026'], false]);
conf('historico_aluno numa pergunta qualquer NÃO leva os feedbacks dela ao modelo', (() => { const h = exec('historico_aluno', { alunoId: 'mar', n: 5 }, ctxDe(DB, { fala: 'como foram as últimas aulas da Marina?', pergunta: 'como foram as últimas aulas da Marina?' })).resultado; return [h.feedbacks_recentes === undefined, JSON.stringify(h).indexOf('avançou em frações') >= 0]; })(), [true, false]);
naoGravou('relato e feedback');

secao('7. K2: cancelar a semana que vem, aula por aula, nunca "esta e as seguintes"');
const semanaQueVem = { itens: [item({ acao: 'cancelar', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-24', hora: '09:00', cobranca: 'perguntar' }),
  item({ acao: 'cancelar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-26', hora: '15:30', cobranca: 'perguntar' })] };
r = propor('propor_aulas', semanaQueVem);
conf('duas linhas, as duas perguntando a cobrança (cada linha com a sua escolha)', r.linhas.map(x => !!x.opcoes), [true, true]);
conf('a escolha de cada linha vale para a sua aula', A.opsConfirmadas(r.linhas, { escolha: { 0: 'sem', 1: 'sem' } }).ops.map(o => o.mudancas), [{ status: 'cancelada', cobravel: false }, { status: 'cancelada', cobravel: false }]);
const k2 = confirmado(r.linhas, { escolha: { 0: 'sem', 1: 'sem' } });
const k2Tela = pelaTela(db => { Core.aplicarEdicaoAula(db, 'b3', { status: 'cancelada', cobravel: false }, 'esta'); Core.aplicarEdicaoAula(db, 's1@2026-11-26', { status: 'cancelada', cobravel: false }, 'esta'); });
conf('K2 confirmado = as duas aulas canceladas pela tela, uma por uma ("somente esta")', JSON.stringify(k2), JSON.stringify(k2Tela));
const repeticaoIntacta = db => JSON.stringify(db.series) === JSON.stringify(DB.series) &&
  db.aulas.filter(a => a.serieId && a.data !== '2026-11-26').every(a => JSON.stringify(a) === JSON.stringify(DB.aulas.find(x => x.id === a.id)));
conf('a repetição da Marina sai igual: a série e as outras aulas dela', repeticaoIntacta(k2), true);
/* VENENO: o mesmo plano aplicado pelo escopo "esta e as seguintes". */
const k2Veneno = (() => { const db = JSON.parse(FOTO); A.aplicarPlano(db, A.opsConfirmadas(r.linhas, { escolha: { 0: 'sem', 1: 'sem' } }).ops, Core, Object.assign(telaDe(db), { editarAula: (id, alunoId, m) => { Core.aplicarEdicaoAula(db, id, m, 'seguintes'); return null; } })); return db; })();
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
const ctxA = (db, fala) => ctxDe(db, { catalogo: null, fala: fala === undefined ? FALA_DO_PEDIDO : fala });
{
  /* A1: 26/11 para 03/12 (quinta, dia da própria série, dezembro não lançado). */
  const db = bancoDoAtaque();
  const rA1 = exec('propor_aulas', { itens: [itA({ data: '2026-11-26', hora: '15:30', nova_data: '2026-12-03', nova_hora: '17:00' })] }, ctxA(db));
  A.aplicarPlano(db, A.opsConfirmadas(rA1.linhas, {}).ops, Core, telaDe(db));
  Core.garantirSeriesAte(db, '2026-12');
  const dia = db.aulas.filter(a => a.alunoId === 'mar' && a.data === '2026-12-03').map(a => a.hora).sort();
  conf('A1: remarcada para 03/12, a aula fixa daquele dia continua (15:30 e 17:00)', dia, ['15:30', '17:00']);
  conf('A1: dezembro fecha R$ 1.200 (9 fixas e a remarcada), e não R$ 1.080', Core.calcularFechamento(db, 'mar', '2026-12', HOJE).totalValor, 1200);
  conf('A1: o cartão já dizia o dinheiro certo dos dois meses', rA1.linhas[0].dinheiro, 'O valor de novembro diminui R$ 120,00. O valor de dezembro aumenta R$ 120,00.');
  /* A1 também na ordem: o Confirmar lança dezembro ANTES de mover (como o
   * tablet ao navegar). Desde a main a39e13f o core também protege a fixa
   * quando o mês é lançado depois; a proposta não depende disso. Veneno:
   * a mesma edição direto, sem lançar o destino, deixa dezembro sem lançar. */
  const db1 = bancoDoAtaque();
  const ops1 = A.opsConfirmadas(exec('propor_aulas', { itens: [itA({ data: '2026-11-26', hora: '15:30', nova_data: '2026-12-03', nova_hora: '17:00' })] }, ctxA(db1)).linhas, {}).ops;
  const dbV = JSON.parse(JSON.stringify(db1));
  A.aplicarPlano(db1, ops1, Core, telaDe(db1));
  conf('A1: o Confirmar lança o mês de destino antes de mover (materializadoAte chega a dezembro)', db1.series.find(x => x.id === 's1').materializadoAte, '2026-12');
  Core.aplicarEdicaoAula(dbV, ops1[0].aulaId, ops1[0].mudancas, 'esta');
  conf('VENENO A1: a mesma edição sem lançar o destino deixa dezembro sem lançar (a prova vê a diferença)', dbV.series.find(x => x.id === 's1').materializadoAte, '2026-11');
}
{
  const db = bancoDoAtaque();
  const cria = itA({ acao: 'criar_aula', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-18', hora: '10:00' });
  const r2 = exec('propor_aulas', { itens: [cria, cria] }, ctxA(db));
  conf('A2: a mesma aula nova duas vezes no cartão é recusada', [r2.erro, /já está numa linha/.test(r2.resultado.erro)], [true, true]);
  conf('A2 (controle): duas aulas novas em horas diferentes passam', exec('propor_aulas', { itens: [cria, Object.assign({}, cria, { hora: '11:00' })] }, ctxA(db)).erro, false);
  db.aulas.find(a => a.id === 's1@2026-11-12').status = 'falta';
  const r3 = exec('propor_aulas', { itens: [itA({ data: '2026-11-12', hora: '15:30', nova_data: '2026-11-27', nova_hora: '10:00' })] }, ctxA(db));
  conf('A3: remarcar uma falta é recusado, com o caminho da reposição e do engano', [r3.erro, /criar_reposicao/.test(r3.resultado.erro), /voltar_a_dada/.test(r3.resultado.erro)], [true, true, true]);
  const r10 = exec('propor_aulas', { itens: [itA({ acao: 'cancelar', data: '2026-11-12', hora: '15:30', cobranca: 'perguntar' })] }, ctxA(db));
  conf('A10: na aula que já é falta, o cartão não oferece "Falta sem aviso"', r10.linhas[0].opcoes.map(o => o.id), ['sem', 'com']);
  conf('A12: cada saída leva o valor em centavos, para o cartão do conjunto dizer os reais', r10.linhas[0].opcoes.map(o => o.centavos), [-12000, 0]);
}
{
  const db = bancoDoAtaque();
  const r4 = exec('propor_aulas', { itens: [itA({ acao: 'cancelar', data: '2028-11-16', hora: '15:30', cobranca: 'sem' })] }, ctxA(db));
  conf('A4: aula prevista a mais de 12 meses de hoje é recusada (o Confirmar lançaria anos de aulas)', [r4.erro, /12 meses/.test(r4.resultado.erro)], [true, true]);
  const r4b = exec('propor_aulas', { itens: [itA({ data: '2026-11-19', hora: '15:30', nova_data: '2028-01-10', nova_hora: '' })] }, ctxA(db));
  conf('A4: remarcar para mais de 12 meses também', r4b.erro, true);
  conf('A4 (controle): dez meses à frente passa', exec('propor_aulas', { itens: [itA({ acao: 'cancelar', data: '2027-09-16', hora: '15:30', cobranca: 'sem' })] }, ctxA(db)).erro, false);
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
  const rel = extra => exec('propor_relato', { itens: [Object.assign({ alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-12', hora: '', relato_familia: 'ok', nota_so_minha: '', assuntos: [], areas: [] }, extra)] }, ctxA(db));
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
  conf('A5: dois "Marina Sintética" ganham rótulos distintos (a regra do #191)', [nomes.mar, nomes.m2], ['Marina S.', 'Marina S. (2)']);
  const can = nd => exec('propor_aulas', { itens: [itA({ acao: 'cancelar', alunoId: 'm2', nome_dito: nd, data: '2026-11-17', hora: '10:00', cobranca: 'sem' })] }, ctxA(db)).erro;
  conf('A5: "Marina", "Marina Sintética" e o rótulo "Marina S. (2)" são ambíguos (a fala cita o nome e não tem como diferenciar nomes idênticos); "ela" e o vazio, sem nome na fala, vêm da agenda (N5)', ['Marina', 'Marina Sintética', 'ela', '', 'Marina S. (2)'].map(can), [true, true, false, false, true]);
  conf('A5 (controle): sem homônimo, o nome vazio vale pelo id', exec('propor_aulas', { itens: [itA({ acao: 'cancelar', alunoId: 'bru', nome_dito: '', data: '2026-11-17', hora: '09:00', cobranca: 'sem' })] }, ctxA(bancoDoAtaque(true))).erro, false);
}
{
  /* 4: a cobrança vem da FALA dela, nunca do modelo. */
  const db = bancoDoAtaque();
  const cancelar = (fala, cob) => { const r = exec('propor_aulas', { itens: [itA({ acao: 'cancelar', data: '2026-11-19', hora: '15:30', cobranca: cob })] }, ctxA(db, fala)); return r.linhas[0].opcoes ? 'pergunta' : r.linhas[0].op.mudancas.cobravel; };
  conf('4: a fala sem palavra de cobrança: "com" e "sem" do modelo viram a pergunta do cartão',
    [cancelar('cancela a da Marina de quinta', 'sem'), cancelar('cancela a da Marina de quinta', 'com'), cancelar('', 'sem'),
      (() => { const r = exec('propor_aulas', { itens: [itA({ acao: 'cancelar', data: '2026-11-19', hora: '15:30', cobranca: 'com' })] }, ctxDe(db, { fala: undefined })); return r.linhas[0].opcoes ? 'pergunta' : 'decidiu'; })()],
    ['pergunta', 'pergunta', 'pergunta', 'pergunta']);
  conf('4: com a palavra dela, vale o que ela disse',
    [['cancela sem cobrar', 'sem'], ['cancela, mas cobra', 'com'], ['foi cortesia, cancela', 'sem'], ['cancela, fica de graça', 'sem'], ['cancela, que é pago', 'com']].map(p => cancelar(p[0], p[1])), [false, true, false, false, 'pergunta']);
  conf('4: texto injetado pelo modelo (no nome dito) não conta como fala dela',
    (() => { const r = exec('propor_aulas', { itens: [itA({ acao: 'cancelar', nome_dito: 'Marina sem cobrar', data: '2026-11-19', hora: '15:30', cobranca: 'sem' })] }, ctxA(db, 'cancela a da Marina')); return r.erro ? 'erro' : (r.linhas[0].opcoes ? 'pergunta' : 'decidiu'); })(), 'pergunta');
  const falta = (fala, cob) => { const r = exec('propor_aulas', { itens: [itA({ acao: 'falta', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-10', hora: '09:00', cobranca: cob })] }, ctxA(db, fala)).linhas[0]; const l = r; return l.opcoes ? 'pergunta' : l.op.mudancas.cobravel; };
  /* Lente da romul-ac, 3: o "sem" do modelo que a fala não confirma pergunta (antes ficava no padrão). */
  conf('4: falta "sem" do modelo sem a palavra dela PERGUNTA; com "não cobra", sem cobrança; sem nada dito, o padrão (cobrada)', [falta('o Bruno faltou', 'sem'), falta('o Bruno faltou, não cobra', 'sem'), falta('o Bruno faltou', 'nao_disse')], ['pergunta', false, true]);
  const criar = (fala, cob) => { const r = exec('propor_aulas', { itens: [itA({ acao: 'criar_aula', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-21', hora: '10:00', cobranca: cob })] }, ctxA(db, fala)).linhas[0]; const l = r; return l.opcoes ? 'pergunta' : l.op.campos.cobravel; };
  conf('4: aula nova "sem" só com a palavra dela (sem a palavra, pergunta)', [criar('marca aula sábado', 'sem'), criar('marca aula sábado, de graça', 'sem'), criar('marca aula sábado', 'nao_disse')], ['pergunta', false, true]);
}

secao('7c. A lente adversarial do #213 (scratchpad\\cen.js): ano, homônimo pela fala, polaridade, cartão substituído, só as funções da tela');
{
  /* 1. ALTO: o ano. Os dois lados, com veneno: o ano passado é recusado; a
   * virada para o ano seguinte passa, com o ano no cartão. */
  const db = JSON.parse(FOTO);
  const rem = (nd, fala) => exec('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-20', hora: '17:30', nova_data: nd, nova_hora: '17:30' })] }, ctxDe(db, { fala }));
  const r1 = rem('2025-11-21', 'passa a aula do Bruno de sexta para o dia 21');
  conf('1: remarcar para 21/11/2025 (o ano passado) é recusado, mandando conferir o ano', [r1.erro, /já passou/.test(r1.resultado.erro), /Confira o ano/.test(r1.resultado.erro)], [true, true, true]);
  conf('1 (controle): 21/11/2026 passa', rem('2026-11-21', 'passa a aula do Bruno para o dia 21').erro, false);
  const r1b = rem('2027-01-08', 'passa a aula do Bruno para 8 de janeiro');
  const l1b = r1b.linhas && r1b.linhas[0];
  conf('1: a virada para janeiro de 2027 passa, com o ano no título, no depois e no dinheiro', l1b && [/sex 08\/01\/2027/.test(l1b.titulo), l1b.depois, l1b.dinheiro],
    [true, 'sex 08/01/2027, 17:30 (1h)', 'O valor de novembro diminui R$ 150,00. O valor de janeiro de 2027 aumenta R$ 150,00.']);
  conf('1: criar_aula no ano passado e a mais de 12 meses: recusados, com a mesma frase do remarcar', ['2025-11-21', '2031-11-21'].map(d => {
    const r = exec('propor_aulas', { itens: [item({ acao: 'criar_aula', alunoId: 'bru', nome_dito: 'Bruno', data: d, hora: '10:00' })] }, ctxDe(db, { fala: 'marca aula com o Bruno' }));
    return r.erro && (/já passou/.test(r.resultado.erro) || /12 meses/.test(r.resultado.erro)); }), [true, true]);
  /* VENENO 1 (B7): o assistente.js de PRODUÇÃO, carregado com o ano tirado
   * do quandoCurto e do dinheiro. A mesma prova do ano tem de reprovar. */
  const comVeneno = assistenteEnvenenado([
    ["    var ano = hoje && String(hoje).slice(0, 4) !== String(data).slice(0, 4) ? '/' + String(data).slice(0, 4) : '';", "    var ano = '';"],
    ["      var ano = String(ctx.hoje).slice(0, 4) !== e.mes.slice(0, 4) ? ' de ' + e.mes.slice(0, 4) : '';", "      var ano = '';"]]);
  const lV = comVeneno.executar('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-20', hora: '17:30', nova_data: '2027-01-08', nova_hora: '17:30' })] },
    ctxDe(db, { fala: 'passa a aula do Bruno para 8 de janeiro' })).linhas[0];
  conf('VENENO 1: sem o ano no código, o cartão de janeiro sai sem "/2027" e sem "de 2027" (a prova do ano reprova)', [/\/2027/.test(lV.titulo), /2027/.test(lV.dinheiro)], [false, false]);
}
{
  /* B8: o Confirmar do app passa as funções da tela ao aplicarPlano. */
  const fonte = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
  const corpo = (fonte.split('\n  function confirmarProposta(')[1] || '').split('\n  }\n')[0];
  conf('B8: o confirmarProposta grava pelo Assistente.aplicarPlano(db, r.ops, Core, funcoesDaTela())', /trilhas = Assistente\.aplicarPlano\(db, r\.ops, Core, funcoesDaTela\(\)\);/.test(corpo), true);
}
{
  /* 2. homônimo pela FALA: o nome_dito copiado da lista não basta. */
  const db = JSON.parse(FOTO);
  const can = (nd, fala) => { const r = exec('propor_aulas', { itens: [item({ acao: 'cancelar', alunoId: 'anas', nome_dito: nd, data: '2026-11-17', cobranca: 'perguntar' })] }, ctxDe(db, { fala })); return r.erro ? (/^ambiguo/.test(r.resultado.erro) ? 'ambiguo' : r.resultado.erro) : 'passa'; };
  conf('2: "cancela a da Ana amanhã" com o nome_dito "Ana S." (copiado da lista pelo modelo) é ambíguo', can('Ana S.', 'cancela a da Ana amanhã'), 'ambiguo');
  conf('2: com o diferenciador na fala dela ("Ana S.", "Ana Sintética", "Ana da Sintética"), passa', ['cancela a da Ana S. amanhã', 'cancela a da Ana Sintética amanhã', 'cancela a da Ana da Sintética'].map(f => can('Ana S.', f)), ['passa', 'passa', 'passa']);
  conf('2: o diferenciador de OUTRA Ana na fala não serve para esta', can('Ana S.', 'cancela a da Ana Outra amanhã'), 'ambiguo');
  conf('2: sem nome nenhum na fala ("cancela todas as aulas de amanhã"), a aula vem da agenda e passa com o rótulo da lista', can('Ana S.', 'cancela todas as aulas de amanhã'), 'passa');
  conf('2: vale também no relato e no feedback', [
    exec('propor_relato', { itens: [{ alunoId: 'anas', nome_dito: 'Ana S.', data: '2026-11-16', hora: '', relato_familia: 'ok', nota_so_minha: '', assuntos: [], areas: [] }] }, ctxDe(db, { fala: 'hoje a Ana foi bem' })).erro,
    exec('propor_feedback', { alunoId: 'anas', nome_dito: 'Ana S.', mes: '2026-10', texto: 'Foi bem.' }, ctxDe(db, { fala: 'escreve o feedback da Ana' })).erro], [true, true]);
  conf('2 (controle): sem homônimo, o nome sozinho basta', exec('propor_aulas', { itens: [item({ acao: 'cancelar', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-20', cobranca: 'perguntar' })] }, ctxDe(db, { fala: 'cancela a do Bruno' })).erro, false);
}
{
  /* 3. a POLARIDADE da cobrança sai da fala, e só das frases deste aluno. */
  const db = JSON.parse(FOTO);
  const pol = (f, aluno) => A.polaridadeDaFala({ db, fala: f }, db.alunos.find(a => a.id === (aluno || 'bru')));
  conf('3: a polaridade da fala', ['o Bruno faltou, pode cobrar', 'cancela sem cobrar', 'não cobra a do Bruno', 'foi cortesia', 'não precisa cobrar', 'cancela a do Bruno', 'cobra e não cobra'].map(f => pol(f)),
    ['com', 'sem', 'sem', 'sem', 'sem', null, 'ambigua']);
  const falta = exec('propor_aulas', { itens: [item({ acao: 'falta', alunoId: 'bru', nome_dito: 'Bruno', data: HOJE, cobranca: 'sem' })] }, ctxDe(db, { fala: 'o Bruno faltou hoje, pode cobrar' }));
  conf('3: "faltou, pode cobrar" com o modelo mandando "sem": a fala contradiz o modelo, e o cartão pergunta (com ou sem cobrança)', falta.linhas[0].opcoes && falta.linhas[0].opcoes.map(o => o.id + ':' + o.op.mudancas.cobravel), ['com:true', 'sem:false']);
  const outra = exec('propor_aulas', { itens: [item({ acao: 'cancelar', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-20', cobranca: 'sem' })] }, ctxDe(db, { fala: 'cancela a aula do Bruno de sexta. depois me lembra de cobrar a Marina' }));
  conf('3: "cancela a de sexta. depois me lembra de cobrar a Marina": a cobrança da Marina não vale, o cartão pergunta', !!outra.linhas[0].opcoes, true);
  const outraCom = exec('propor_aulas', { itens: [item({ acao: 'cancelar', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-20', cobranca: 'com' })] }, ctxDe(db, { fala: 'cancela a aula do Bruno de sexta. depois me lembra de cobrar a Marina' }));
  conf('3: e o "com" do modelo também não vale ali', !!outraCom.linhas[0].opcoes, true);
  const nc = exec('propor_aulas', { itens: [item({ acao: 'nao_cobrar', alunoId: 'bru', nome_dito: 'Bruno', data: HOJE, hora: '08:00' })] }, ctxDe(db, { fala: 'o Bruno veio hoje' }));
  conf('3: nao_cobrar com "o Bruno veio hoje" é recusado', [nc.erro, /para não cobrar/.test(nc.resultado.erro)], [true, true]);
  conf('3 (controle): nao_cobrar com "foi cortesia" passa', exec('propor_aulas', { itens: [item({ acao: 'nao_cobrar', alunoId: 'bru', nome_dito: 'Bruno', data: HOJE, hora: '08:00' })] }, ctxDe(db, { fala: 'a do Bruno de hoje foi cortesia' })).erro, false);
}
{
  /* 4. a proposta nova substitui o cartão aberto (o app chama esta função ao chegar a resposta). */
  const hist = [{ proposta: { estado: 'aberto' } }, { proposta: { estado: 'feito' } }, { proposta: { estado: 'aberto' } }, { texto: 'sem cartão' }];
  conf('4: os cartões ainda abertos viram "substituido"; os outros ficam', [A.substituirCartoesAbertos(hist), hist.map(h => h.proposta && h.proposta.estado)], [2, ['substituido', 'feito', 'substituido', undefined]]);
  const fonte = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  conf('4: o app substitui os abertos antes de guardar a proposta nova', /Assistente\.substituirCartoesAbertos\(historicoAssistente\)[\s\S]{0,400}historicoAssistente\.push\(/.test(fonte), true);
}
{
  /* 6. só as funções da tela gravam: sem elas, o aplicarPlano recusa. */
  const d = JSON.parse(FOTO);
  let msg = null; try { A.aplicarPlano(d, [{ k: 'editar', aulaId: 'b1', alunoId: 'bru', mudancas: { status: 'falta' } }], Core); } catch (e) { msg = e.message; }
  conf('6: sem as funções da tela, o aplicarPlano recusa e não muda nada', [msg, JSON.stringify(d) === FOTO], ['sem_as_funcoes_da_tela', true]);
  conf('6: a prova grava pelas funções REAIS do app.js (o funcoesDaTela tirado do arquivo)', Object.keys(telaDe(d)).sort(), ['aplicarSo', 'assunto', 'criar', 'editarAula', 'feedback', 'trilhas']);
  /* 8 e 12 */
  const rel = exec('propor_relato', { itens: [{ alunoId: 'bru', nome_dito: 'Bruno', data: HOJE, hora: '08:00', relato_familia: 'Trabalhamos frações.', nota_so_minha: '', assuntos: [], areas: [] }] }, ctxDe(DB, { fala: 'hoje com o Bruno foi frações' }));
  conf('8: o relato sem registro antigo não leva aviso vazio', rel.linhas[0].avisos, []);
  conf('12: quem só lê não recebe os feedbacks recentes (o pedido continua o da fase 3)', [
    'feedbacks_recentes' in exec('historico_aluno', { alunoId: 'mar', n: 3 }, ctxDe(DB, { gravar: false })).resultado,
    'feedbacks_recentes' in exec('historico_aluno', { alunoId: 'mar', n: 3 }, ctxDe(DB, { fala: 'faz o feedback da Marina', pergunta: 'faz o feedback da Marina' })).resultado], [false, true]);
}

secao('7d. Segunda rodada adversarial do #213 (scratchpad\\sonda.js): na dúvida, o cartão pergunta');
{
  /* N1 a N3: a tabela da polaridade. Cada frase dá exatamente um de COM, SEM
   * ou PERGUNTA, numa FALTA de hoje em que o modelo manda "sem" (o pior caso:
   * o modelo erra para o lado de tirar dinheiro). Nenhuma decide errado. */
  const dbP = JSON.parse(FOTO);
  dbP.alunos.push({ id: 'gra', nome: 'Graça Pinto', ativo: true, precos: [{ id: 'pg', inicio: '2026-01-01', fim: null, valorHora: 100 }] });
  dbP.aulas.push(aula('g1', 'gra', HOJE, '07:00'));
  const decisao = (fala, alunoId, cobModelo) => {
    const r = exec('propor_aulas', { itens: [item({ acao: 'falta', alunoId: alunoId || 'bru', nome_dito: '', data: HOJE, cobranca: cobModelo || 'sem' })] }, ctxDe(dbP, { fala }));
    if (r.erro) return 'RECUSA';
    const l = r.linhas[0];
    return l.opcoes ? 'PERGUNTA' : l.op.mudancas.cobravel ? 'COM' : 'SEM';
  };
  const TABELA = [
    // as frases da lente: todas perguntam
    ['o Bruno faltou, não é pra cobrar', 'PERGUNTA'], ['o Bruno faltou, não quero que cobre', 'PERGUNTA'], ['o Bruno faltou, não vai cobrar', 'PERGUNTA'],
    ['o Bruno faltou, cobra não', 'PERGUNTA'], ['o Bruno faltou, nem cobra', 'PERGUNTA'], ['o Bruno faltou e não é cortesia', 'PERGUNTA'],
    ['o Bruno faltou, e não é de graça', 'PERGUNTA'], ['o Bruno faltou, sem custo adicional', 'PERGUNTA'], ['o Bruno faltou, não foi pago', 'PERGUNTA'],
    ['o Bruno faltou, o mês já está pago', 'PERGUNTA'], ['o Bruno faltou, a mãe paga depois', 'PERGUNTA'], ['o Bruno faltou, cobra só metade', 'PERGUNTA'],
    ['o Bruno e a Marina faltaram, a do Bruno sem cobrar', 'PERGUNTA'], ['o Bruno faltou sem cobrar e a Marina cobrando', 'PERGUNTA'], ['a Marina faltou sem cobrar, o Bruno também', 'PERGUNTA'],
    ['o Bruno faltou, não cobrar 50', 'PERGUNTA'], ['o Bruno faltou e depois não cobra', 'PERGUNTA'], ['o Bruno faltou, NÃO COBRAR', 'PERGUNTA'],
    ['a aluna de Graça faltou hoje', 'PERGUNTA', 'gra'],
    // os controles inequívocos
    ['o Bruno faltou, pode cobrar', 'COM', null, 'com'], ['o Bruno faltou, cobra', 'COM', null, 'com'], ['o Bruno faltou, vai ser cobrada', 'COM', null, 'com'],
    ['o Bruno faltou, sem cobrar', 'SEM'], ['o Bruno faltou, sem cobrança', 'SEM'], ['o Bruno faltou, não cobra', 'SEM'],
    ['o Bruno faltou, não precisa cobrar', 'SEM'], ['o Bruno faltou, foi cortesia', 'SEM'], ['o Bruno faltou, fica de graça', 'PERGUNTA'], // com uma aluna Graça, "de graça" fica em dúvida (sem ela, SEM: seção 7b)
    // a fala que diz um e o modelo que diz outro: pergunta
    ['o Bruno faltou, pode cobrar', 'PERGUNTA', null, 'sem'], ['o Bruno faltou, não cobra', 'PERGUNTA', null, 'com'],
    // sem palavra de cobrança e o modelo sem dizer nada: a falta fica no padrão (cobrada)
    ['o Bruno faltou hoje', 'COM', null, 'nao_disse'], ['a aula da Graça foi hoje e ela faltou', 'COM', 'gra', 'nao_disse'],
    // lente da romul-ac, 3: o "sem" do modelo sem a palavra dela pergunta (antes ficava no padrão)
    ['o Bruno faltou hoje', 'PERGUNTA'],
    // lente da romul-ac, 3: a regex nunca vence o "perguntar" nem o "nao_disse" do modelo
    ['o Bruno faltou, sem cobrar', 'PERGUNTA', null, 'perguntar'], ['o Bruno faltou, pode cobrar', 'PERGUNTA', null, 'perguntar'],
    ['o Bruno faltou, sem cobrar', 'PERGUNTA', null, 'nao_disse'], ['o Bruno faltou, foi cortesia', 'PERGUNTA', null, 'nao_disse'],
    // as frases da lente da romul-ac (scratchpad l4a\prova1.js, seção C): todas perguntam, com o modelo dizendo o que for
    ['o Bruno faltou, cobra ela não', 'PERGUNTA', null, 'perguntar'], ['o Bruno faltou, cobra ela não', 'PERGUNTA', null, 'com'],
    ['o Bruno faltou, cobra dele não', 'PERGUNTA', null, 'com'], ['o Bruno faltou, nada de cortesia', 'PERGUNTA', null, 'perguntar'],
    ['o Bruno faltou, nada de cortesia', 'PERGUNTA', null, 'sem'], ['o Bruno faltou e cobra nada', 'PERGUNTA', null, 'com'],
    ['o Bruno faltou, jamais cobra', 'PERGUNTA', null, 'com'], ['o Bruno faltou, dessa vez ninguém cobra', 'PERGUNTA', null, 'com'],
    ['o Bruno faltou, acabou a cortesia', 'PERGUNTA', null, 'sem'], ['o Bruno faltou, chega de cortesia', 'PERGUNTA', null, 'sem'],
    ['o Bruno faltou, cobra', 'PERGUNTA', null, 'perguntar'], ['o Bruno faltou, a mãe avisou em cima da hora', 'PERGUNTA', null, 'perguntar'],
    ['o Bruno faltou, não cobra nada', 'PERGUNTA', null, 'sem'], ['o Bruno faltou, vê se a cobra apareceu no quintal', 'PERGUNTA', null, 'perguntar'],
    ['o Bruno faltou, não cobra', 'PERGUNTA', null, 'perguntar'], ['o Bruno faltou, nao precisa cobrar', 'PERGUNTA', null, 'perguntar'],
    ['o Bruno faltou semana passada e eu não cobrei. o Bruno faltou hoje', 'PERGUNTA', null, 'sem']
  ];
  const vistas = TABELA.map(([f, esp, id, cob]) => [f, cob || 'sem', decisao(f, id, cob), esp]);
  vistas.forEach(([f, cob, obt, esp]) => console.log('        ' + (obt === esp ? 'ok   ' : 'ERRO ') + obt.padEnd(9) + '(modelo ' + cob + ')  ' + f));
  conf('N1 a N3: a tabela da polaridade (' + vistas.length + ' frases): cada uma dá exatamente o esperado de COM, SEM ou PERGUNTA', vistas.filter(v => v[2] !== v[3]).map(v => v[0] + ' => ' + v[2]), []);
  conf('N1: nenhuma frase da tabela decide para o lado contrário do que ela disse (nunca SEM onde pede COM, nem o contrário)',
    vistas.filter(v => (v[3] === 'COM' && v[2] === 'SEM') || (v[3] === 'SEM' && v[2] === 'COM')).length, 0);
  const nc = f => exec('propor_aulas', { itens: [item({ acao: 'nao_cobrar', alunoId: 'bru', nome_dito: 'Bruno', data: HOJE, hora: '08:00' })] }, ctxDe(dbP, { fala: f })).erro;
  conf('N3: o nao_cobrar exige a forma SEM inequívoca ("não é cortesia" e "sem custo" são recusados; "foi cortesia" passa)',
    ['a aula do Bruno de hoje não é cortesia', 'a do Bruno de hoje foi sem custo', 'a do Bruno de hoje foi cortesia'].map(nc), [true, true, false]);
  const can = (f, cob) => { const r = exec('propor_aulas', { itens: [item({ acao: 'cancelar', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-20', cobranca: cob })] }, ctxDe(dbP, { fala: f })); return r.linhas[0].opcoes ? 'PERGUNTA' : r.linhas[0].op.mudancas.cobravel ? 'COM' : 'SEM'; };
  conf('N1: a aula nova e o cancelamento também perguntam na dúvida', [can('cancela a do Bruno, a mãe paga depois', 'com'),
    (() => { const r = exec('propor_aulas', { itens: [item({ acao: 'criar_aula', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-21', hora: '10:00', cobranca: 'sem' })] }, ctxDe(dbP, { fala: 'marca aula do Bruno sábado, não é de graça' })); return r.linhas[0].opcoes ? 'PERGUNTA' : 'decidiu'; })()],
    ['PERGUNTA', 'PERGUNTA']);
}
{
  /* B6: a fala da conversa desde o último cartão. */
  const fila = [];
  const pedidos = [];
  const o6 = { ctx: ctxDe(DB, { fala: undefined }), hora: '11:00', chamar: c => { pedidos.push(c); return Promise.resolve(fila.shift()); } };
  fila.push({ ok: true, resposta: { stop_reason: 'tool_use', usage: {}, content: [{ type: 'tool_use', id: 't6', name: 'propor_aulas', input: { itens: [item({ acao: 'falta', alunoId: 'bru', nome_dito: '', data: HOJE, hora: '08:00', cobranca: 'sem' })] } }] } },
    { ok: true, resposta: { stop_reason: 'end_turn', usage: {}, content: [{ type: 'text', text: 'Confira.' }] } });
  global.__b6 = A.perguntar(A.novaSessao(), 'a das 8', Object.assign({}, o6, { falasAnteriores: ['o Bruno faltou, não cobra', 'qual aula?'] }));
}
{
  /* N4: o diferenciador é a inicial COM ponto ou a palavra inteira. */
  const dbH = JSON.parse(FOTO);
  const anas = [['an1', 'Ana Souza'], ['an2', 'Ana Oliveira'], ['an3', 'Ana Assis'], ['an4', 'Ana Nascimento'], ['an5', 'Ana Mendes'], ['an6', 'Ana Esteves']];
  dbH.alunos = dbH.alunos.filter(a => a.id !== 'anas' && a.id !== 'anao');
  anas.forEach(([id, nome]) => { dbH.alunos.push({ id, nome, ativo: true, precos: [{ id: 'p' + id, inicio: '2026-01-01', fim: null, valorHora: 100 }] }); dbH.aulas.push(aula('x' + id, id, '2026-11-17', '10:00')); });
  const rotulos = A.nomesParaIA(dbH);
  // o nome_dito é o rótulo da lista (o que o modelo copia): quem decide é a fala dela
  const cancela = (id, fala) => { const r = exec('propor_aulas', { itens: [item({ acao: 'cancelar', alunoId: id, nome_dito: rotulos[id], data: '2026-11-17', cobranca: 'perguntar' })] }, ctxDe(dbH, { fala })); return r.erro ? (/^ambiguo/.test(r.resultado.erro) ? 'ambiguo' : r.resultado.erro) : 'passa'; };
  conf('N4: "só", "o", "às", "na", "me" e "e" depois de "Ana" não são sobrenome (Souza, Oliveira, Assis, Nascimento, Mendes, Esteves)',
    [['an1', 'cancela a da Ana só amanhã'], ['an2', 'cancela a da Ana o dia todo'], ['an3', 'cancela a da Ana às 10'], ['an4', 'cancela a da Ana na terça'], ['an5', 'cancela a da Ana me avisou'], ['an6', 'cancela a da Ana e pronto']].map(p => cancela(p[0], p[1])),
    ['ambiguo', 'ambiguo', 'ambiguo', 'ambiguo', 'ambiguo', 'ambiguo']);
  conf('N4: a inicial com ponto e a palavra inteira passam; a inicial sem ponto e o prefixo, não',
    [cancela('an1', 'cancela a da Ana S. amanhã'), cancela('an4', 'cancela a da Ana Nascimento'), cancela('an1', 'cancela a da Ana S amanhã'), cancela('an4', 'cancela a da Ana Nasc')], ['passa', 'passa', 'ambiguo', 'ambiguo']);
  /* N5: sem nome na fala, vale (com o aviso); com apelido, não. */
  const dbN = JSON.parse(FOTO);
  const r5 = exec('propor_aulas', { itens: [item({ acao: 'cancelar', alunoId: 'anas', nome_dito: '', data: '2026-11-17', cobranca: 'perguntar' })] }, ctxDe(dbN, { fala: 'cancela a de amanhã às 10:00' }));
  conf('N5: o modelo obediente (nome_dito vazio, fala sem nome) passa, com o aviso da outra Ana no dia', [r5.erro, r5.linhas && r5.linhas[0].avisos.some(a => /Há outra Ana com aula neste dia/.test(a))], [false, true]);
  conf('N5: "Aninha", "Anna" e "Anas" com "Ana S." copiado da lista são recusados', ['cancela a da Aninha amanhã', 'cancela a da Anna amanhã', 'cancela as das Anas amanhã'].map(f =>
    exec('propor_aulas', { itens: [item({ acao: 'cancelar', alunoId: 'anas', nome_dito: 'Ana S.', data: '2026-11-17', cobranca: 'perguntar' })] }, ctxDe(dbN, { fala: f })).erro), [true, true, true]);
}
{
  /* N7, B1 e o N6 do prompt e do app. */
  const db7 = JSON.parse(FOTO);
  db7.aulas.push(aula('velha', 'bru', '2026-09-10', '10:00'), aula('muitovelha', 'bru', '2025-10-01', '10:00'));
  const r7 = exec('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-09-10', hora: '10:00', nova_data: '2026-11-25', nova_hora: '10:00' })] }, ctxDe(db7, { fala: 'remarca a do Bruno' }));
  conf('N7: a aula de origem num mês já fechado leva o aviso', r7.linhas[0].avisos.filter(a => /mês já fechado/.test(a)), ['Esta aula é de setembro de 2026, mês já fechado.']);
  const r7b = exec('propor_aulas', { itens: [item({ acao: 'falta', alunoId: 'bru', nome_dito: 'Bruno', data: '2025-10-01', hora: '10:00' })] }, ctxDe(db7, { fala: 'o Bruno faltou' }));
  conf('N7: a origem com mais de 12 meses é recusada', [r7b.erro, /mais de 12 meses atrás/.test(r7b.resultado.erro)], [true, true]);
  conf('N7 (controle): a aula deste mês não leva o aviso', exec('propor_aulas', { itens: [item({ acao: 'falta', alunoId: 'bru', nome_dito: 'Bruno', data: HOJE, hora: '08:00' })] }, ctxDe(db7, { fala: 'o Bruno faltou' })).linhas[0].avisos.filter(a => /fechado/.test(a)).length, 0);
  const r1 = exec('propor_aulas', { itens: [item({ acao: 'remarcar', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-20', hora: '17:30', nova_data: HOJE, nova_hora: '09:00' })] }, ctxDe(db7, { fala: 'passa a do Bruno para hoje às 9' }));
  conf('B1: destino hoje num horário que já passou: o aviso', r1.linhas[0].avisos.indexOf('Esse horário de hoje já passou: a aula entra como já dada.') >= 0, true);
  conf('N6: o sistema pede para repetir as linhas no cartão novo', /Um cartão novo troca os cartões ainda abertos: repita nele as linhas que ela ainda quer\./.test(A.SISTEMA_GRAVA), true);
  const fonteApp = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  conf('N6: o cartão trocado não promete o de baixo, e o texto editado dele vai ao modelo', [/substituido: 'Trocado por um cartão novo\. Nada foi gravado por este\.'/.test(fonteApp), /o texto que ela deixou no cartão/.test(fonteApp)], [true, true]);
  conf('B6: o app manda as falas desde o último cartão confirmado ou trocado', /falasAnteriores: falasDesdeOUltimoCartao\(\)/.test(fonteApp), true);
}

secao('7e. Lentes da romul-ac na 39d7061 (scratchpad l4a\\prova1.js a prova3.js): lote, aviso da saída, fala, privacidade, baixos');
global.__lentesAc = true;
{
  /* As funções DE VERDADE do app.js que montam o que vai ao modelo, sobre um histórico de mentira. */
  const doApp = historico => new Function('historicoAssistente', [extrairDoApp('falasDesdeOUltimoCartao'), extrairDoApp('cartoesAnterioresDoAssistente')].join('\n') +
    '\nreturn { falas: falasDesdeOUltimoCartao, cartoes: cartoesAnterioresDoAssistente };')(historico);
  const NOTA = 'NOTA-SO-DELA-7781', RELATO = 'Relato que ela editou.';
  const historico = [
    { pergunta: 'o Bruno faltou, não cobra', proposta: { estado: 'recusado', linhas: [{ titulo: 'Falta de Bruno' }], edicao: {} } },
    { pergunta: 'cancela a da Marina sem cobrar', proposta: { estado: 'substituido', linhas: [{ titulo: 'Relato de Marina' }], edicao: { 0: { relato: RELATO, nota: NOTA } } } },
    { pergunta: 'e a do Bruno de terça', proposta: { estado: 'erro', linhas: [{ titulo: 'Cancelar Bruno' }], edicao: {} } },
    { pergunta: 'cancela a de quinta' }
  ];
  const f = doApp(historico);
  conf('4: a fala de um cartão recusado, trocado ou com erro NÃO passa para o seguinte: só a do pedido atual', f.falas(), ['cancela a de quinta']);
  ['aberto', 'mudou', 'feito', 'substituido', 'recusado', 'erro'].forEach(est => {
    const h = [{ pergunta: 'cancela a do Bruno sem cobrar', proposta: { estado: est, linhas: [{ titulo: 'x' }], edicao: {} } }, { pergunta: 'e a de quinta' }];
    conf('4: depois de um cartão "' + est + '", a fala dele fica para trás', doApp(h).falas(), ['e a de quinta']);
  });
  conf('4 (controle): sem cartão no meio, a conversa continua junta (o B6: "qual aula?", "a das 8")', doApp([{ pergunta: 'o Bruno faltou, não cobra' }, { pergunta: 'a das 8' }]).falas(), ['o Bruno faltou, não cobra', 'a das 8']);
  const texto = f.cartoes();
  conf('5: o relato editado do cartão trocado vai ao modelo, a nota "Só para mim" não', [texto.indexOf(RELATO) >= 0, texto.indexOf(NOTA) >= 0], [true, false]);
  global.__notaDoCartao = { texto, NOTA };
}
{
  /* O cenário do Bruno da lente (l4a\prova1.js): outubro PAGO com quatro aulas dadas (uma com relato e nota só dela),
   * novembro pago com uma registrada e uma futura. */
  const dbB = JSON.parse(FOTO);
  dbB.pagamentos = [{ id: 'pgo', alunoId: 'bru', mes: '2026-10', pagoEm: '2026-11-05', valor: 600 }];
  dbB.aulas = dbB.aulas.filter(a => a.alunoId !== 'bru');
  dbB.aulas.push(aula('o1', 'bru', '2026-10-06', '09:00', { notaTexto: 'Relato que foi para a família.', notaPrivada: VENENO }));
  ['2026-10-13', '2026-10-20', '2026-10-27'].forEach((d, k) => dbB.aulas.push(aula('o' + (k + 2), 'bru', d, '09:00')));
  dbB.aulas.push(aula('n1', 'bru', '2026-11-10', '09:00', { notaTexto: 'Relato de novembro.' }));
  dbB.aulas.push(aula('n2', 'bru', '2026-11-20', '17:30'));
  const FOTO_B = JSON.stringify(dbB);
  const P = (fala, itens, Amod) => (Amod ? Amod.executar : exec)('propor_aulas', { itens: [].concat(itens).map(item) }, ctxDe(JSON.parse(FOTO_B), { fala }));
  const canc = (data, cob) => ({ acao: 'cancelar', alunoId: 'bru', nome_dito: 'Bruno', data, cobranca: cob || 'sem' });
  conf('1: o core só ganhou a EXPORTAÇÃO do motivoParaPoupar (a regra é a do lote do app)', [typeof Core.motivoParaPoupar, ['o1', 'o2', 'n1', 'n2'].map(id => Core.motivoParaPoupar(dbB, dbB.aulas.find(a => a.id === id), HOJE, {}))], ['function', ['registrada', 'paga', 'registrada', null]]);
  let r = P('cancela a aula do Bruno do dia 13 de outubro sem cobrar', canc('2026-10-13'));
  conf('1: uma linha só, de mês com pagamento: segue, com o destaque antes do Confirmar', [r.linhas[0].poupada, A.situacaoDaLinha(r.linhas, 0), !!A.opsConfirmadas(r.linhas, {}).ops], ['paga', { fora: false, texto: 'Este mês já tem pagamento marcado: o valor muda.' }, true]);
  r = P('cancela a aula do Bruno do dia 6 de outubro sem cobrar', canc('2026-10-06'));
  conf('1: uma linha só, aula já registrada: segue, com "Esta aula já tem registro."', [A.situacaoDaLinha(r.linhas, 0), !!A.opsConfirmadas(r.linhas, {}).ops], [{ fora: false, texto: 'Esta aula já tem registro.' }, true]);
  r = P('passa a aula do Bruno do dia 10 para o dia 30', { acao: 'remarcar', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-10', nova_data: '2026-11-30', nova_hora: '09:00' });
  conf('1: a aula dada com relato que vira agendada leva o aviso', [r.linhas[0].avisos.indexOf('Esta aula já foi dada e tem registro: remarcada, ela volta a ser agendada, com o registro junto.') >= 0, A.situacaoDaLinha(r.linhas, 0).texto], [true, 'Esta aula já tem registro.']);
  r = P('passa a aula do Bruno do dia 20 para o dia 27', { acao: 'remarcar', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-20', nova_data: '2026-11-27', nova_hora: '17:30' });
  conf('1 (controle): a aula futura sem registro não leva o aviso nem o destaque', [r.linhas[0].avisos.some(a => /tem registro/.test(a)), A.situacaoDaLinha(r.linhas, 0)], [false, null]);
  r = P('cancela todas as aulas do Bruno de outubro sem cobrar', ['2026-10-06', '2026-10-13', '2026-10-20', '2026-10-27'].map(d => canc(d)));
  conf('1: o LOTE das quatro de outubro pago: todas ficam de fora, com o motivo, e o Confirmar não tem o que gravar',
    [r.linhas.map((l, i) => A.situacaoDaLinha(r.linhas, i).texto), A.opsConfirmadas(r.linhas, {}).falta],
    [['Fica de fora: esta aula já tem registro de como foi.', 'Fica de fora: o mês dela já tem pagamento marcado.', 'Fica de fora: o mês dela já tem pagamento marcado.', 'Fica de fora: o mês dela já tem pagamento marcado.'], 'poupadas']);
  const mistura = P('cancela a do Bruno de 13 de outubro e a de 20 de novembro, sem cobrar', [canc('2026-10-13'), canc('2026-11-20')]);
  const opsMistura = A.opsConfirmadas(mistura.linhas, {}).ops;
  conf('1: lote misturado: só a de 20/11 entra no plano; a de outubro pago fica de fora e o modelo fica sabendo', [opsMistura.map(o => o.aulaId), mistura.resultado.ficam_de_fora],
    [['n2'], [mistura.linhas[0].titulo + ' (mês com pagamento)']]);
  const dbM = JSON.parse(FOTO_B); A.aplicarPlano(dbM, opsMistura, Core, telaDe(dbM));
  conf('1: confirmado, outubro sai igual byte a byte e só a de 20/11 muda', [JSON.stringify(dbM.aulas.filter(a => a.data < '2026-11-01')) === JSON.stringify(dbB.aulas.filter(a => a.data < '2026-11-01')), dbM.aulas.find(a => a.id === 'n2').status], [true, 'cancelada']);
  /* Os venenos dos dois lados: sem a regra do lote, a de outubro pago entra; com a regra marcando tudo, a de novembro some. */
  const semLote = assistenteEnvenenado([["    if (noLote(linhas, i)) return { fora: true,", "    if (noLote(linhas, i)) return { fora: false,"]]);
  const m1 = P('cancela a do Bruno de 13 de outubro e a de 20 de novembro, sem cobrar', [canc('2026-10-13'), canc('2026-11-20')], semLote);
  conf('VENENO (lote desligado): a prova acusa, a de outubro pago entra no plano', semLote.opsConfirmadas(m1.linhas, {}).ops.map(o => o.aulaId), ['o2', 'n2']);
  const tudoPoupa = assistenteEnvenenado([["      var motivo = aulaDaOp ? ctx.Core.motivoParaPoupar(ctx.db, aulaDaOp, ctx.hoje, {}) : null;", "      var motivo = aulaDaOp ? 'paga' : null;"]]);
  const m2 = P('cancela a do Bruno de 13 de outubro e a de 20 de novembro, sem cobrar', [canc('2026-10-13'), canc('2026-11-20')], tudoPoupa);
  conf('VENENO (poupa tudo): a prova acusa, a de 20/11 também fica de fora', tudoPoupa.opsConfirmadas(m2.linhas, {}).falta, 'poupadas');
  const semMarca = assistenteEnvenenado([["      if (motivo) {\n        l.poupada = motivo;", "      if (false) {\n        l.poupada = motivo;"]]);
  const m3 = P('cancela a aula do Bruno do dia 13 de outubro sem cobrar', canc('2026-10-13'), semMarca);
  conf('VENENO (sem marca): a linha só de outubro pago perde o destaque, e a prova acusa', semMarca.situacaoDaLinha(m3.linhas, 0), null);
  conf('1: a assinatura muda se o pagamento for marcado com o cartão aberto (o Confirmar acusa "mudou")', (() => {
    const p1 = P('cancela a aula do Bruno do dia 20 sem cobrar', canc('2026-11-20'));
    const db2 = JSON.parse(FOTO_B); db2.aulas.push(aula('n0', 'bru', '2026-11-03', '09:00')); db2.pagamentos.push({ id: 'pgn', alunoId: 'bru', mes: '2026-11', pagoEm: HOJE, valor: 1 });
    const de = A.conferirDeNovo([{ nome: 'propor_aulas', entrada: { itens: [item(canc('2026-11-20'))] } }], ctxDe(db2, { fala: 'cancela a aula do Bruno do dia 20 sem cobrar' }), 'cancela a aula do Bruno do dia 20 sem cobrar');
    return A.assinatura(de) === A.assinatura(p1.linhas); })(), false);

  /* 2: os avisos de cada saída (o selo do mês pago) estão na saída, para o cartão mostrar no botão. */
  r = P('cancela a do Bruno de 20 de novembro', canc('2026-11-20', 'perguntar'));
  const dbN = JSON.parse(FOTO_B); dbN.pagamentos.push({ id: 'pgn', alunoId: 'bru', mes: '2026-11', pagoEm: '2026-11-10', valor: 300 });
  const rN = exec('propor_aulas', { itens: [item(canc('2026-11-20', 'perguntar'))] }, ctxDe(dbN, { fala: 'cancela a do Bruno de 20 de novembro' }));
  conf('2: na pergunta, a saída que muda o valor do mês pago traz o aviso; a que não muda, não', rN.linhas[0].opcoes.map(o => [o.id, o.avisos]),
    [['sem', ['Novembro de 2026 já tem pagamento marcado: o selo do mês vai mudar.']], ['com', []]]);
  conf('2: o cartão desenha os avisos da saída dentro do botão (não somem na escolha)', /concat\(\(o\.avisos \|\| \[\]\)\.map\(function \(a\) \{ return el\('span', \{ class: 'ass-opcao-aviso'/.test(APP_FONTE), true);

  /* 9: os baixos. */
  const fb = mes => exec('propor_feedback', { alunoId: 'bru', nome_dito: 'Bruno', mes, texto: 'Foi bem.' }, ctxDe(JSON.parse(FOTO_B), { fala: 'feedback do Bruno' }));
  conf('9: feedback só para mês na janela das aulas dele (de outubro até este mês)', ['2026-09', '2026-10', '2026-11', '2026-12', '2099-01'].map(m => fb(m).erro), [true, false, false, true, true]);
  conf('9: cobrança fora do enum é RECUSADA, não vira cobrada', ['gratis', 'talvez', 'com', 'nao_disse'].map(c => exec('propor_aulas', { itens: [item({ acao: 'criar_aula', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-25', hora: '10:00', cobranca: c })] }, ctxDe(JSON.parse(FOTO_B), { fala: 'marca aula do Bruno dia 25 às 10' })).erro), [true, true, false, false]);
  const duas = P('cancela a do Bruno de 20 de novembro e a da Marina de quinta', [canc('2026-11-20', 'perguntar'), { acao: 'cancelar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', cobranca: 'perguntar' }]);
  conf('9: com duas linhas perguntando, a escolha é POR LINHA: uma escolha só não basta', A.opsConfirmadas(duas.linhas, { escolha: { 0: 'sem' } }).falta, 'cobranca');
  conf('9: e cada linha fica com a sua', A.opsConfirmadas(duas.linhas, { escolha: { 0: 'sem', 1: 'com' } }).ops.map(o => o.mudancas.cobravel), [false, true]);
  conf('9: o estado do cartão não tem mais a escolha do conjunto', /escolhaDoConjunto|doConjunto/.test(APP_FONTE + fs.readFileSync(path.join(__dirname, '..', 'assistente.js'), 'utf8')), false);
  conf('nada gravou no banco congelado', JSON.stringify(DB) === FOTO, true);
}


secao('7f. Rodada final da orquestradora na 4e61542: o lote é por ação, a prevista entra no lote, o feedback só no pedido de rascunho');
{
  /* 1. O LOTE é o grupo da MESMA ação. Novembro do Bruno está pago adiantado no banco da prova (pg1);
   * b1 é a aula de hoje, b0 uma de novembro que já passou. */
  const db1 = JSON.parse(FOTO); db1.aulas.push(aula('b0', 'bru', '2026-11-09', '08:00'));
  const FOTO_1 = JSON.stringify(db1);
  const P1 = (fala, itens, Amod) => (Amod ? Amod.executar : exec)('propor_aulas', { itens: itens.map(item) }, ctxDe(JSON.parse(FOTO_1), { fala }));
  const falta = (data, hora) => ({ acao: 'falta', alunoId: 'bru', nome_dito: 'Bruno', data, hora });
  const repo = { acao: 'criar_reposicao', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-21', hora: '10:00' };
  const FALA_LENTE = 'o Bruno faltou hoje, marca a reposição sábado';
  const lente = P1(FALA_LENTE, [falta(HOJE, '08:00'), repo]);
  const sit = lente.linhas.map((l, i) => A.situacaoDaLinha(lente.linhas, i));
  conf('1 (o caso da lente): falta de hoje e reposição no novembro pago: a falta ENTRA, com o aviso em destaque', [lente.linhas.map(l => l.tipo), sit[0], sit[1], lente.resultado.ficam_de_fora],
    [['falta', 'criar_reposicao'], { fora: false, texto: 'Este mês já tem pagamento marcado.' }, null, undefined]);
  const escolha = lente.linhas[0].opcoes ? { 0: lente.linhas[0].opcoes[0].id } : {};
  const opsLente = A.opsConfirmadas(lente.linhas, { escolha }).ops;
  conf('1 (o caso da lente): o Confirmar grava as duas, a falta da b1 e a reposição', [opsLente.length, opsLente[0].aulaId, opsLente[0].mudancas.status, opsLente[1].k], [2, 'b1', 'falta', 'criar']);
  const duasFaltas = P1('o Bruno faltou hoje e no dia 9', [falta(HOJE, '08:00'), falta('2026-11-09', '08:00')]);
  conf('1: DUAS faltas no mês pago são lote: as duas ficam de fora e o Confirmar não tem o que gravar',
    [duasFaltas.linhas.map((l, i) => A.situacaoDaLinha(duasFaltas.linhas, i).texto), A.opsConfirmadas(duasFaltas.linhas, {}).falta, duasFaltas.resultado.ficam_de_fora.length],
    [['Fica de fora: o mês dela já tem pagamento marcado.', 'Fica de fora: o mês dela já tem pagamento marcado.'], 'poupadas', 2]);
  const misto = P1('o Bruno faltou hoje e no dia 9, marca a reposição sábado', [falta(HOJE, '08:00'), falta('2026-11-09', '08:00'), repo]);
  conf('1: o cartão que mistura aplica o lote só dentro da ação: as duas faltas ficam de fora, a reposição entra',
    [misto.linhas.map((l, i) => { const x = A.situacaoDaLinha(misto.linhas, i); return x ? x.fora : null; }), A.opsConfirmadas(misto.linhas, {}).ops.map(o => o.k)], [[true, true, null], ['criar']]);
  /* O lote é do cartão inteiro, mesmo quando as linhas vêm de duas chamadas da mesma pergunta. */
  const deDuas = A.conferirDeNovo([{ nome: 'propor_aulas', entrada: { itens: [item(falta(HOJE, '08:00'))] } }, { nome: 'propor_aulas', entrada: { itens: [item(falta('2026-11-09', '08:00'))] } }],
    ctxDe(JSON.parse(FOTO_1)), 'o Bruno faltou hoje e no dia 9');
  conf('1: duas faltas em duas chamadas da mesma pergunta continuam lote', deDuas.map((l, i) => A.situacaoDaLinha(deDuas, i).fora), [true, true]);
  /* Os venenos dos dois lados: a regra antiga (cartão de várias linhas = lote) tira a falta da lente; o lote desligado deixa as duas faltas entrarem. */
  const loteAntigo = assistenteEnvenenado([["    if (noLote(linhas, i)) return { fora: true,", "    if (linhas.length > 1) return { fora: true,"]]);
  const lenteAntiga = P1(FALA_LENTE, [falta(HOJE, '08:00'), repo], loteAntigo);
  conf('VENENO (o lote é o cartão inteiro, a regra de antes): a prova acusa, a falta da lente fica de fora', loteAntigo.situacaoDaLinha(lenteAntiga.linhas, 0).fora, true);
  const semLote = assistenteEnvenenado([["    if (noLote(linhas, i)) return { fora: true,", "    if (false) return { fora: true,"]]);
  const duasSem = P1('o Bruno faltou hoje e no dia 9', [falta(HOJE, '08:00'), falta('2026-11-09', '08:00')], semLote);
  conf('VENENO (lote desligado): a prova acusa, as duas faltas do mês pago entram', semLote.opsConfirmadas(duasSem.linhas, {}).ops.map(o => o.aulaId), ['b1', 'b0']);

  /* 2. A aula PREVISTA no lote: uma repetição do Bruno às quintas desde outubro, nada lançado (materializadoAte em setembro),
   * outubro pago. As aulas de outubro só existem como previstas (serieId e data). */
  const db2 = JSON.parse(FOTO);
  db2.series.push({ id: 's9', alunoId: 'bru', dias: [4], hora: '14:00', duracaoMin: 60, inicio: '2026-10-01', fim: null, exclusoes: [], materializadoAte: '2026-09', status: 'realizada' });
  db2.pagamentos.push({ id: 'pgo', alunoId: 'bru', mes: '2026-10', pagoEm: '2026-10-30', valor: 600 });
  const FOTO_2 = JSON.stringify(db2);
  const canc = data => ({ acao: 'cancelar', alunoId: 'bru', nome_dito: 'Bruno', data, hora: '14:00', cobranca: 'sem' });
  const P2 = (fala, itens, Amod) => (Amod ? Amod.executar : exec)('propor_aulas', { itens: itens.map(item) }, ctxDe(JSON.parse(FOTO_2), { fala }));
  const duasPrev = P2('cancela as aulas do Bruno de 8 e 15 de outubro sem cobrar', [canc('2026-10-08'), canc('2026-10-15')]);
  conf('2 (controle): as duas são PREVISTAS (a op vai pela série e pela data, sem aulaId)', duasPrev.linhas.map(l => [l.op.aulaId, l.op.serieId, l.op.data]), [[undefined, 's9', '2026-10-08'], [undefined, 's9', '2026-10-15']].map(x => x.slice()));
  conf('2: cancelar DUAS previstas do outubro pago: as duas ficam de fora (Core.motivoParaPoupar, pelo Core.pagamentoDe do mês)',
    [duasPrev.linhas.map(l => l.poupada), duasPrev.linhas.map((l, i) => A.situacaoDaLinha(duasPrev.linhas, i).texto), A.opsConfirmadas(duasPrev.linhas, {}).falta],
    [['paga', 'paga'], ['Fica de fora: o mês dela já tem pagamento marcado.', 'Fica de fora: o mês dela já tem pagamento marcado.'], 'poupadas']);
  const umaPrev = P2('cancela a aula do Bruno de 8 de outubro sem cobrar', [canc('2026-10-08')]);
  conf('2: UMA prevista do outubro pago passa, com o destaque', [A.situacaoDaLinha(umaPrev.linhas, 0), !!A.opsConfirmadas(umaPrev.linhas, {}).ops],
    [{ fora: false, texto: 'Este mês já tem pagamento marcado: o valor muda.' }, true]);
  const db2b = JSON.parse(FOTO_2); db2b.pagamentos = db2b.pagamentos.filter(x => x.id !== 'pgo');
  const semPago = exec('propor_aulas', { itens: [item(canc('2026-10-08')), item(canc('2026-10-15'))] }, ctxDe(db2b, { fala: 'cancela as aulas do Bruno de 8 e 15 de outubro sem cobrar' }));
  conf('2 (controle): sem o pagamento de outubro, as duas previstas entram', [semPago.linhas.map(l => l.poupada || null), A.opsConfirmadas(semPago.linhas, {}).ops.length], [[null, null], 2]);
  const soLancada = assistenteEnvenenado([["    if (op.k === 'editar' && (op.aulaId || op.serieId) && ctx.Core.motivoParaPoupar) {", "    if (op.k === 'editar' && op.aulaId && ctx.Core.motivoParaPoupar) {"]]);
  const prevAntiga = P2('cancela as aulas do Bruno de 8 e 15 de outubro sem cobrar', [canc('2026-10-08'), canc('2026-10-15')], soLancada);
  conf('VENENO (só a aula lançada é poupada, a regra de antes): a prova acusa, as duas previstas do mês pago entram', soLancada.opsConfirmadas(prevAntiga.linhas, {}).ops.length, 2);

  /* 3. Os feedbacks recentes só vão quando a PERGUNTA ATUAL pede o rascunho. */
  const leva = (pergunta, fala) => 'feedbacks_recentes' in exec('historico_aluno', { alunoId: 'mar', n: 3 }, ctxDe(DB, { fala: fala || pergunta, pergunta })).resultado;
  const RASCUNHOS = ['escreve o feedback de outubro da Marina', 'prepara a devolutiva da Marina', 'faz o feedback da Marina', 'monta a mensagem do mês da Marina',
    'prepara o retorno do mês para a família da Marina', 'faz pra mim um rascunho do feedback da Marina'];
  const CONSULTAS = ['feedbacks pendentes?', 'de quem falta o feedback?', 'já fiz o feedback da Marina?', 'como foram as últimas aulas da Marina?', 'o feedback da Marina já foi?'];
  conf('3: o pedido de RASCUNHO leva os feedbacks recentes', RASCUNHOS.map(f => leva(f)), RASCUNHOS.map(() => true));
  conf('3: a CONSULTA com a palavra feedback não leva', CONSULTAS.map(f => leva(f)), CONSULTAS.map(() => false));
  conf('3: a fala anterior com rascunho, seguida de uma consulta, não leva (só a pergunta atual conta)', leva('feedbacks pendentes?', 'escreve o feedback da Marina\nfeedbacks pendentes?'), false);
  const frouxo = assistenteEnvenenado([["PEDE_RASCUNHO.test(semAcento(soTexto(ctx && ctx.pergunta)).toLowerCase())", "/\\b(feedback|feedbacks|devolutiva|mensagem do mes|recado do mes)\\b/.test(semAcento(soTexto(ctx && ctx.fala)))"]]);
  const levaFrouxo = (pergunta, fala) => 'feedbacks_recentes' in frouxo.executar('historico_aluno', { alunoId: 'mar', n: 3 }, ctxDe(DB, { fala: fala || pergunta, pergunta })).resultado;
  conf('VENENO (a regra frouxa de antes): a prova acusa, "feedbacks pendentes?" leva os feedbacks', levaFrouxo('feedbacks pendentes?'), true);
  const pelaFala = assistenteEnvenenado([["PEDE_RASCUNHO.test(semAcento(soTexto(ctx && ctx.pergunta)).toLowerCase())", "PEDE_RASCUNHO.test(semAcento(soTexto(ctx && ctx.fala)).toLowerCase())"]]);
  conf('VENENO (lendo a fala da conversa): a prova acusa, a fala anterior com rascunho leva os feedbacks na consulta',
    'feedbacks_recentes' in pelaFala.executar('historico_aluno', { alunoId: 'mar', n: 3 }, ctxDe(DB, { fala: 'escreve o feedback da Marina\nfeedbacks pendentes?', pergunta: 'feedbacks pendentes?' })).resultado, true);
  conf('nada gravou no banco congelado', JSON.stringify(DB) === FOTO, true);
}

secao('7g. Revisão cega de tela do #213: os textos do cartão na língua dela');
{
  /* A aula fixa: remarcar, mudar a duração e cancelar a da repetição dizem "aula fixa", e nenhum aviso fala em "repetição". */
  const avisosDe = it => { const x = propor('propor_aulas', { itens: [item(it)] }); return (x.linhas[0].avisos || []); };
  const fixa = [avisosDe({ acao: 'remarcar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', hora: '15:30', nova_data: '2026-11-19', nova_hora: '17:30' }),
    avisosDe({ acao: 'mudar_duracao', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', duracao_min: 90 }),
    avisosDe({ acao: 'cancelar', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-19', cobranca: 'perguntar' })];
  conf('7g: a aula fixa nas três ações, e nenhum aviso com "repetição"', [fixa.map(a => a.filter(t => /^É uma aula fixa/.test(t))), fixa.some(a => a.some(t => /repeti/.test(t)))],
    [[['É uma aula fixa: muda só esta, e as outras semanas continuam iguais.'], ['É uma aula fixa: muda só esta, e as outras semanas continuam iguais.'], ['É uma aula fixa: cancela só esta, e as outras semanas continuam iguais.']], false]);
  /* "como dada" saiu de todo texto que o cartão mostra (título, antes, depois, avisos, opções). */
  const dada = propor('propor_aulas', { itens: [item({ acao: 'cancelar', alunoId: 'bru', nome_dito: 'Bruno', data: HOJE, hora: '08:00', cobranca: 'perguntar' })] });
  const voltar = propor('propor_aulas', { itens: [item({ acao: 'voltar_a_dada', alunoId: 'mar', nome_dito: 'Marina', data: '2026-11-05' })] });
  const textos = [dada, voltar].map(x => x.linhas[0]).map(l => [l.titulo, l.antes, l.depois].concat(l.avisos || [], (l.opcoes || []).map(o => o.rotulo + ' ' + o.dinheiro)).filter(Boolean).join(' | '));
  conf('7g: nenhum texto do cartão diz "como dada" (' + textos.join(' || ') + ')', textos.some(t => /como dada/.test(t)), false);
}

secao('8. "Nada grava sem Confirmar", K6 e K7 num cartão só, e o Confirmar que confere de novo');
const filaDoModelo = [];
function respostaFerramentas(chamadas) { return { ok: true, resposta: { stop_reason: 'tool_use', usage: {}, content: [{ type: 'thinking', thinking: '', signature: 's' }].concat(chamadas.map((c, i) => ({ type: 'tool_use', id: 't' + i, name: c[0], input: c[1] }))) } }; }
function respostaTexto(t) { return { ok: true, resposta: { stop_reason: 'end_turn', usage: {}, content: [{ type: 'text', text: t }] } }; }
const pedidos = [];
const o = { ctx, hora: '11:00', chamar: c => { pedidos.push(c); return Promise.resolve(filaDoModelo.shift()); } };
(async () => {
  const r6 = await global.__b6;
  conf('B6: "o Bruno faltou, não cobra", "qual aula?", "a das 8": a falta sai SEM cobrança, e a fala guardada é a da conversa',
    [r6.proposta && r6.proposta.linhas[0].op && r6.proposta.linhas[0].op.mudancas, r6.proposta && r6.proposta.fala], [{ status: 'falta', cobravel: false }, 'o Bruno faltou, não cobra\nqual aula?\na das 8']);
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
  conf('a conferência de novo, com o banco igual, dá a mesma assinatura', A.assinatura(A.conferirDeNovo(res.proposta.chamadas, ctx, res.proposta.fala)) === res.proposta.assinatura, true);
  const mudado = bancoSintetico(); mudado.aulas.find(a => a.id === 'b1').hora = '09:00';
  let deNovo; try { deNovo = A.assinatura(A.conferirDeNovo(res.proposta.chamadas, ctxDe(mudado), res.proposta.fala)); } catch (e) { deNovo = 'recusou'; }
  conf('a agenda mudou (a aula do Bruno foi para 9h): o Confirmar não grava (assinatura diferente ou recusa)', deNovo !== res.proposta.assinatura, true);
  const mudado2 = bancoSintetico(); mudado2.resumos.push({ alunoId: 'bru', mes: '2026-08', texto: 'x' });
  conf('(controle) uma mudança que não toca o cartão não impede', A.assinatura(A.conferirDeNovo(res.proposta.chamadas, ctxDe(mudado2), res.proposta.fala)) === res.proposta.assinatura, true);
  filaDoModelo.push(respostaFerramentas([['propor_aulas', { itens: [item({ acao: 'cancelar', alunoId: 'bru', nome_dito: 'Bruno', data: '2026-11-24', hora: '09:00', cobranca: 'sem' })] }]]), respostaTexto('Confira.'));
  const semPalavra = await A.perguntar(A.novaSessao(), 'cancela a aula do Bruno de terça que vem', o);
  conf('4, pelo laço inteiro: a fala dela sem palavra de cobrança e o modelo mandando "sem": o cartão pergunta', [!!semPalavra.proposta.linhas[0].opcoes, semPalavra.proposta.fala], [true, 'cancela a aula do Bruno de terça que vem']);
  conf('4: a reconferência do Confirmar usa a mesma fala e dá a mesma assinatura', A.assinatura(A.conferirDeNovo(semPalavra.proposta.chamadas, ctx, semPalavra.proposta.fala)) === semPalavra.proposta.assinatura, true);
  {
    /* 5: o corpo inteiro do pedido, com os cartões anteriores do app de verdade: a nota "Só para mim" não está nele.
     * Os cartões anteriores vão a partir da segunda pergunta da sessão, por isso a primeira é um "oi". */
    const { texto, NOTA } = global.__notaDoCartao;
    const corpoDaSegunda = async cartoes => {
      const ses = A.novaSessao();
      filaDoModelo.push(respostaTexto('Oi.')); await A.perguntar(ses, 'oi', o);
      filaDoModelo.push(respostaTexto('Certo.')); await A.perguntar(ses, 'e agora?', Object.assign({}, o, { cartoesAnteriores: cartoes }));
      return JSON.stringify(pedidos[pedidos.length - 1]);
    };
    const corpo = await corpoDaSegunda(texto);
    conf('5: a nota "Só para mim" do cartão trocado não aparece no corpo do pedido ao modelo (o relato sim)', [corpo.indexOf(NOTA) >= 0, corpo.indexOf('Relato que ela editou.') >= 0], [false, true]);
    const comNota = new Function('historicoAssistente', extrairDoApp('cartoesAnterioresDoAssistente').replace('txt = [e.relato, e.feedback]', 'txt = [e.relato, e.nota, e.feedback]') + '\nreturn cartoesAnterioresDoAssistente;')(
      [{ proposta: { estado: 'substituido', linhas: [{ titulo: 'Relato' }], edicao: { 0: { relato: 'r', nota: NOTA } } } }]);
    conf('VENENO (o app de antes, com e.nota): a prova acusa a nota no corpo do pedido', (await corpoDaSegunda(comNota())).indexOf(NOTA) >= 0, true);
  }
  filaDoModelo.push(respostaTexto('Na próxima.'));
  await A.perguntar(sessao, 'e agora?', Object.assign({}, o, { cartoesAnteriores: 'Falta de Bruno: ela tocou em Agora não; nada gravado' }));
  conf('a pergunta seguinte diz ao modelo o que aconteceu com o cartão', /Cartões anteriores: Falta de Bruno: ela tocou em Agora não/.test(JSON.stringify(pedidos[pedidos.length - 1].messages.filter(m => m.role === 'user').slice(-1))), true);
  {
    /* 3 (rodada final), pelo laço inteiro: o perguntar() passa a PERGUNTA ATUAL ao historico_aluno; a fala anterior não conta. */
    const resultadoDoHistorico = async (pergunta, anteriores) => {
      pedidos.length = 0;
      filaDoModelo.push(respostaFerramentas([['historico_aluno', { alunoId: 'mar', n: 3 }]]), respostaTexto('Pronto.'));
      await A.perguntar(A.novaSessao(), pergunta, Object.assign({}, o, { falasAnteriores: anteriores || [] }));
      return JSON.stringify(pedidos[1].messages.slice(-1));
    };
    conf('3, pelo laço: o pedido de rascunho leva os feedbacks recentes ao modelo', (await resultadoDoHistorico('escreve o feedback de outubro da Marina')).indexOf('feedbacks_recentes') >= 0, true);
    conf('3, pelo laço: "feedbacks pendentes?" não leva', (await resultadoDoHistorico('feedbacks pendentes?')).indexOf('feedbacks_recentes') >= 0, false);
    conf('3, pelo laço: rascunho na fala anterior e consulta agora: não leva', (await resultadoDoHistorico('feedbacks pendentes?', ['escreve o feedback de outubro da Marina'])).indexOf('feedbacks_recentes') >= 0, false);
  }
  const quemSoLe = A.novaSessao(); pedidos.length = 0;
  filaDoModelo.push(respostaFerramentas([['propor_aulas', { itens: [item({ acao: 'falta', alunoId: 'bru', nome_dito: 'Bruno', data: HOJE })] }]]), respostaTexto('Isso se faz no tablet.'));
  const soLe = await A.perguntar(quemSoLe, 'o Bruno faltou', Object.assign({}, o, { ctx: ctxDe(DB, { gravar: false }) }));
  conf('celular que só lê: o pedido vai com as 16, e a proposta forjada volta como erro e sem cartão', [pedidos[0].tools.length, pedidos[0].system === A.SISTEMA, soLe.proposta, pedidos[1].messages[2].content[0].is_error], [16, true, null, true]);

  secao('9. aplicarPlano: tudo ou nada');
  const db9 = JSON.parse(FOTO);
  let lancou = false;
  try { A.aplicarPlano(db9, [{ k: 'editar', aulaId: 'b1', alunoId: 'bru', mudancas: { status: 'falta' } }, { k: 'editar', aulaId: 'sumiu', alunoId: 'bru', mudancas: { status: 'falta' } }], Core, telaDe(db9)); } catch (e) { lancou = e.message; }
  conf('uma aula que sumiu: lança antes de mudar a primeira', [lancou, JSON.stringify(db9) === FOTO], ['aula_sumiu', true]);
  try { lancou = false; const d = JSON.parse(FOTO); A.aplicarPlano(d, [{ k: 'editar', aulaId: 'b1', alunoId: 'mar', mudancas: {} }], Core, telaDe(d)); } catch (e) { lancou = e.message; }
  conf('a aula de outro aluno também é recusada', lancou, 'aula_sumiu');

  console.log('\n' + passes + ' verificacoes passaram, ' + falhas + ' falharam');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
