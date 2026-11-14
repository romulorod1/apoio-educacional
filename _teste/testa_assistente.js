/* testa_assistente.js (projeto IA no app, fase 3: o assistente só de leitura)
 *
 * Cada ferramenta do assistente.js sobre um banco SINTÉTICO, nos dois lados:
 * o valor certo e o pedido que tem de ser recusado (aluno inexistente, data
 * que não existe, período ao contrário ou longo demais). Mais:
 *   - o período vazio, a virada de mês e de ano;
 *   - a aula cancelada não conta como dada;
 *   - o valor por vigência (outubro a 100, novembro a 120), pelo
 *     Core.calcularFechamento, sem conta própria;
 *   - os horários livres batendo com a regra da aba Vagos de antes (a
 *     cópia do horariosLivresCelular do app.js de 5891716 e do filtro da
 *     tela), dia a dia, para várias durações;
 *   - NENHUMA ferramenta grava: o banco vai CONGELADO (Object.freeze em
 *     tudo, uma escrita lança) e sai igual byte a byte, inclusive na leitura
 *     além de materializadoAte (as repetições previstas);
 *   - privacidade: nenhum resultado leva telefone, endereço, a nota "só
 *     minha" nem as observações da ficha (o veneno vai marcado no banco e é
 *     procurado em toda saída);
 *   - o laço de ferramentas: o content do modelo volta INTACTO (o mesmo
 *     objeto, com o thinking), os tool_result vão juntos numa mensagem, o
 *     teto de 5 voltas, o erro que tira a pergunta da conversa e o recomeço
 *     quando a conversa passa do teto do endpoint;
 *   - as datas relativas: 20 frases sintéticas, com o calendário que vai na
 *     pergunta e a conferência do app (a ferramenta recusa a data inválida e
 *     a tela mostra o dia que entendeu).
 *
 * Controles: uma ferramenta de mentira que grava tem de ser pega pelo
 * congelamento; um Vagos quebrado (sem as repetições) tem de divergir.
 */
'use strict';
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
const AGORA = 11 * 60;              // 11:00
const VENENO = 'VENENO-PRIVADO-7731';

function bancoSintetico() {
  return {
    versao: 1,
    ajustes: { pagamentosDesde: '2026-09' },
    alunos: [
      { id: 'al1', nome: 'Ana Sintética', ativo: true, telefone: '(21) 98765-4321', endereco: 'Rua ' + VENENO + ', 10', responsavel: 'Resp ' + VENENO, obs: 'contato: ' + VENENO, local: 'casa',
        precos: [{ id: 'p1', inicio: '2026-01-01', fim: '2026-10-31', valorHora: 100 }, { id: 'p2', inicio: '2026-11-01', fim: null, valorHora: 120 }] },
      { id: 'al2', nome: 'Ana Outra', ativo: true, telefone: '', obs: '', precos: [{ id: 'p3', inicio: '2026-01-01', fim: null, valorHora: 90 }] },
      { id: 'al3', nome: 'Bruno Teste', ativo: true, telefone: '2133334444', obs: '', precos: [{ id: 'p4', inicio: '2026-01-01', fim: null, valorHora: 150 }] },
      { id: 'al4', nome: 'Carla Parou', ativo: false, telefone: '21987650000', obs: '', precos: [] }
    ],
    series: [
      // Ana: segunda e quarta às 15:30, lançada até novembro; dezembro só existe como repetição prevista
      { id: 's1', alunoId: 'al1', dias: [1, 3], hora: '15:30', duracaoMin: 60, inicio: '2026-10-01', fim: null, exclusoes: [], materializadoAte: '2026-11', status: 'realizada' }
    ],
    aulas: [
      // outubro (vigência 100): duas dadas, uma cancelada sem cobrança, uma falta
      { id: 'o1', alunoId: 'al1', serieId: 's1', data: '2026-10-26', hora: '15:30', duracaoMin: 60, status: 'realizada', notaTexto: 'Frações: foi bem.', notaPrivada: VENENO, temas: [{ id: 't1', titulo: 'Frações' }], areas: [], anexos: [] },
      { id: 'o2', alunoId: 'al1', serieId: 's1', data: '2026-10-28', hora: '15:30', duracaoMin: 60, status: 'cancelada', cobravel: false, notaTexto: '', temas: [], areas: [], anexos: [] },
      { id: 'o3', alunoId: 'al1', serieId: 's1', data: '2026-10-21', hora: '15:30', duracaoMin: 90, status: 'falta', notaTexto: '', temas: [], areas: [], anexos: [] },
      { id: 'o4', alunoId: 'al1', serieId: 's1', data: '2026-10-19', hora: '15:30', duracaoMin: 60, status: 'realizada', notaTexto: '', temas: [{ id: 't2', titulo: 'Decimais' }], areas: [], anexos: [] },
      { id: 'b1', alunoId: 'al3', data: '2026-10-20', hora: '09:00', duracaoMin: 120, status: 'realizada', notaTexto: '', temas: [], areas: [], anexos: [] },
      { id: 'b2', alunoId: 'al3', data: '2026-10-31', hora: '10:00', duracaoMin: 60, status: 'cancelada', cobravel: true, notaTexto: '', temas: [], areas: [], anexos: [] },
      // novembro (vigência 120)
      { id: 'n1', alunoId: 'al1', serieId: 's1', data: '2026-11-11', hora: '15:30', duracaoMin: 60, status: 'realizada', notaTexto: '', temas: [], areas: [], anexos: [] },
      { id: 'n2', alunoId: 'al1', serieId: 's1', data: '2026-11-16', hora: '15:30', duracaoMin: 60, status: 'realizada', notaTexto: '', temas: [], areas: [], anexos: [] },
      { id: 'n3', alunoId: 'al1', serieId: 's1', data: '2026-11-18', hora: '15:30', duracaoMin: 60, status: 'cancelada', cobravel: false, notaTexto: '', temas: [], areas: [], anexos: [] },
      { id: 'n4', alunoId: 'al1', serieId: 's1', data: '2026-11-23', hora: '15:30', duracaoMin: 60, status: 'realizada', notaTexto: '', temas: [], areas: [], anexos: [] },
      { id: 'n8', alunoId: 'al1', serieId: 's1', data: '2026-11-25', hora: '15:30', duracaoMin: 60, status: 'realizada', notaTexto: '', temas: [], areas: [], anexos: [] },
      { id: 'n9', alunoId: 'al1', serieId: 's1', data: '2026-11-30', hora: '15:30', duracaoMin: 60, status: 'realizada', notaTexto: '', temas: [], areas: [], anexos: [] },
      { id: 'n5', alunoId: 'al3', data: '2026-11-16', hora: '08:00', duracaoMin: 60, status: 'realizada', notaTexto: '', temas: [], areas: [], anexos: [] },
      { id: 'n6', alunoId: 'al3', data: '2026-11-19', hora: '15:00', duracaoMin: 90, status: 'realizada', notaTexto: '', temas: [], areas: [], anexos: [] },
      { id: 'n7', alunoId: 'al4', data: '2026-11-10', hora: '10:00', duracaoMin: 60, status: 'realizada', notaTexto: '', temas: [], areas: [], anexos: [] }
    ],
    resumos: [{ alunoId: 'al1', mes: '2026-10', texto: 'Feedback de outubro.' }],
    // Bruno pagou outubro a menos; Ana não pagou outubro
    pagamentos: [{ id: 'pg1', alunoId: 'al3', mes: '2026-10', pagoEm: '2026-11-05', valor: 300 }]
  };
}
function congelar(o) { Object.freeze(o); Object.keys(o).forEach(k => { if (o[k] && typeof o[k] === 'object' && !Object.isFrozen(o[k])) congelar(o[k]); }); return o; }

/* Os links falsos, com a mesma regra do app (só o campo telefone, celular
 * para o WhatsApp) e a cobrança como o familiasACobrarCelular. */
function digitos(t) { t = String(t || '').trim().replace(/[\s().-]/g, ''); return /^[1-9][1-9](9\d{8}|[2-5]\d{7})$/.test(t) ? t : ''; }
function linksFalsos(db) {
  return {
    contato: a => ({ responsavel: a.responsavel || '', telefone: digitos(a.telefone) ? a.telefone : '', endereco: a.endereco || '' }),
    ligar: a => digitos(a.telefone) ? 'tel:+55' + digitos(a.telefone) : '',
    whatsapp: (a, t) => { const d = digitos(a.telefone); return d.length === 11 ? 'https://wa.me/55' + d + (t ? '?text=' + encodeURIComponent(t) : '') : ''; },
    mapa: a => a.endereco ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(a.endereco) : '',
    familiaACobrar: (a, hoje) => {
      const meses = Core.pendentesDePagamento(db, hoje).filter(p => p.alunoId === a.id).map(p => {
        const s = Core.seloDoPagamento(db, Core.calcularFechamento(db, p.alunoId, p.mes, hoje));
        return { mes: p.mes, falta: s.falta, selo: s.selo };
      }).filter(m => Math.round(m.falta * 100) > 0);
      return meses.length ? { aluno: a, meses } : null;
    },
    mensagemDeCobranca: fam => 'Olá! Passando para lembrar do pagamento: ' + fam.meses.map(m => Core.mesExtenso(m.mes).toLowerCase() + ', ' + Core.fmtMoeda(m.falta)).join('; ') + '. Obrigada!'
  };
}

const DB = congelar(bancoSintetico());
const FOTO = JSON.stringify(DB);
const ctx = { db: DB, Core, hoje: HOJE, agoraMin: AGORA, links: linksFalsos(DB) };
const todasAsSaidas = [];
function ex(nome, entrada, c) {
  const r = A.executar(nome, entrada, c || ctx);
  todasAsSaidas.push(JSON.stringify(r.resultado));
  if (r.erro && !/inválid|inexistente|antes do início|longo demais|sem_|nada_em_aberto|vazio|precisa ser|múltiplo/.test(r.resultado.erro)) console.log('        (erro inesperado: ' + r.resultado.erro + ')');
  return r;
}
const naoGravou = rotulo => conf('nada gravou (' + rotulo + '): o banco congelado saiu igual byte a byte', JSON.stringify(DB) === FOTO, true);

secao('1. As ferramentas declaradas: estritas, com esquema fechado');
conf('16 ferramentas, nenhuma acima do teto do endpoint (20)', A.FERRAMENTAS.length, 16);
conf('todas strict, com additionalProperties false e todos os campos em required', A.FERRAMENTAS.every(f => f.strict === true && f.input_schema.additionalProperties === false &&
  Object.keys(f.input_schema.properties).sort().join() === f.input_schema.required.slice().sort().join()), true);
conf('nomes no formato do endpoint', A.FERRAMENTAS.every(f => /^[A-Za-z0-9_-]{1,64}$/.test(f.name)), true);
conf('nenhum minimum, maximum, pattern ou minLength (o modo estrito não aceita)', /"(minimum|maximum|pattern|minLength|maxLength)"/.test(JSON.stringify(A.FERRAMENTAS)), false);
conf('o corpo vai na rota assistente, esforço low, sem modelo nem cache_control vindo do aparelho', (() => { const c = A.corpo([]); return [c.rota, c.esforco, c.max_tokens, 'model' in c, /cache_control/.test(JSON.stringify(c))]; })(), ['assistente', 'low', 4000, false, false]);
conf('o sistema não tem travessão nem data (fica igual entre pedidos: cache)', /[–—]|\d{4}-\d{2}-\d{2}/.test(A.SISTEMA), false);

secao('2. Alunos: primeiro nome, inicial no empate, só os ativos, com os horários fixos');
const nomes = A.nomesParaIA(DB);
conf('as duas Anas ganham a inicial; o inativo fica de fora', nomes, { al1: 'Ana S.', al2: 'Ana O.', al3: 'Bruno' });
const bloco = A.blocoDeAlunos(DB, HOJE);
conf('o bloco de alunos leva id, nome curto e horários fixos', bloco.split('\n')[1], '- id al1: Ana S. (aulas fixas: segunda e quarta às 15:30 (1h))');
{
  const tres = { alunos: [
    { id: 'h1', nome: 'Ana Sobrenomeum Silveira', ativo: true }, { id: 'h2', nome: 'Ana Sobrenomeum Santos', ativo: true },
    { id: 'h3', nome: 'Ana Sobrenomeum Santos', ativo: true }, { id: 'h4', nome: 'Ana', ativo: true }, { id: 'h5', nome: 'Bia Unica', ativo: true }] };
  const n3 = A.nomesParaIA(tres);
  conf('três homônimos: mais iniciais e, no empate total, um número; o nome sem sobrenome fica como está', n3,
    { h1: 'Ana S. S.', h2: 'Ana S. S. (2)', h3: 'Ana S. S. (3)', h4: 'Ana', h5: 'Bia' });
  conf('VENENO: nenhum sobrenome inteiro em nome algum', Object.values(n3).some(x => /Sobrenomeum|Silveira|Santos|Unica/.test(x)), false);
  conf('todos os nomes são diferentes', new Set(Object.values(n3)).size, 5);
}
conf('o bloco não leva sobrenome, telefone, endereço nem observação', [/Sintética|Outra|Teste|Parou/.test(bloco), bloco.indexOf(VENENO) >= 0, /98765/.test(bloco)], [false, false, false]);

secao('3. listar_aulas: o dia, o período, o vazio, a virada de mês e a repetição prevista');
let r = ex('listar_aulas', { inicio: HOJE, fim: HOJE, alunoId: null });
conf('hoje: Bruno 8h (já dada) e Ana 15h30 (agendada)', r.resultado.aulas.map(a => a.hora + ' ' + a.aluno + ' ' + a.situacao), ['08:00 Bruno Realizada', '15:30 Ana S. Agendada']);
conf('a tela mostra o dia que entendeu', r.entendido, ['segunda, 16/11']);
r = ex('listar_aulas', { inicio: '2026-11-18', fim: '2026-11-18', alunoId: 'al1' });
conf('a cancelada aparece como "Cancelada sem cobrança" (não como dada)', r.resultado.aulas.map(a => a.situacao), ['Cancelada sem cobrança']);
r = ex('listar_aulas', { inicio: '2026-11-21', fim: '2026-11-22', alunoId: null });
conf('período vazio: zero aulas, sem erro', [r.erro, r.resultado.quantas], [false, 0]);
r = ex('listar_aulas', { inicio: '2026-11-30', fim: '2026-12-02', alunoId: 'al1' });
conf('virada de mês: 30/11 (lançada) e 02/12 (repetição prevista, além de materializadoAte)', r.resultado.aulas.map(a => a.data + ' ' + !!a.repeticao), ['2026-11-30 false', '2026-12-02 true']);
naoGravou('listar_aulas além de materializadoAte');
conf('(arranjo) dezembro não estava no banco: a série ficou em materializadoAte 2026-11', [DB.series[0].materializadoAte, DB.aulas.some(a => a.data >= '2026-12-01')], ['2026-11', false]);
r = ex('listar_aulas', { inicio: '2026-12-30', fim: '2027-01-04', alunoId: 'al1' });
conf('virada de ano: 30/12 e 04/01/2027, com o ano no rótulo', [r.resultado.aulas.map(a => a.data), r.entendido], [['2026-12-30', '2027-01-04'], ['de quarta, 30/12 a segunda, 04/01/2027, Ana S.']]);
naoGravou('virada de ano');
conf('recusa: aluno inexistente', ex('listar_aulas', { inicio: HOJE, fim: HOJE, alunoId: 'nao-existe' }).erro, true);
conf('recusa: aluno inativo (não está na lista do modelo)', ex('listar_aulas', { inicio: HOJE, fim: HOJE, alunoId: 'al4' }).erro, true);
conf('recusa: 30/02', ex('listar_aulas', { inicio: '2026-02-30', fim: '2026-02-30', alunoId: null }).erro, true);
conf('recusa: data em dd/mm', ex('listar_aulas', { inicio: '20/11', fim: '20/11', alunoId: null }).erro, true);
conf('recusa: fim antes do início', ex('listar_aulas', { inicio: '2026-11-20', fim: '2026-11-19', alunoId: null }).erro, true);
conf('recusa: mais de 62 dias', ex('listar_aulas', { inicio: '2026-11-01', fim: '2027-01-15', alunoId: null }).erro, true);

secao('4. horarios_livres e tenho_algo: a mesma conta da aba Vagos');
/* A regra da aba Vagos ANTES desta fase: o horariosLivresCelular do app.js
 * (5891716), copiado, e o filtro do desenharVagosCelular. */
function vagosDeAntes(db, data, dur, hoje, agoraMin) {
  const livres = [];
  for (let m = 7 * 60; m + dur <= 21 * 60; m += 30) {
    const hora = String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    if (!Core.conflitosComRepeticoes(db, { id: null, data, hora, duracaoMin: dur, status: 'realizada' }).length) livres.push(hora);
  }
  return livres.filter(h => { const i = Core.minutosDaHora(h); return data >= hoje && i + dur <= 20 * 60 && (data !== hoje || i >= agoraMin); });
}
let iguais = 0, total = 0;
for (const dur of [60, 90, 120]) {
  r = ex('horarios_livres', { data_inicio: HOJE, data_fim: '2026-11-29', duracao_min: dur, turno: null });
  r.resultado.dias.forEach(d => { total++; if (JSON.stringify(d.inicios_possiveis) === JSON.stringify(vagosDeAntes(DB, d.data, dur, HOJE, AGORA))) iguais++; });
}
conf('os inícios livres batem com a regra de antes do Vagos, dia a dia (14 dias x 3 durações)', iguais + '/' + total, '42/42');
conf('o Vagos de hoje (Core.vagasDoDia, que a tela usa) é a regra de antes', JSON.stringify(Core.vagasDoDia(DB, HOJE, 60, HOJE, AGORA)), JSON.stringify(vagosDeAntes(DB, HOJE, 60, HOJE, AGORA)));
/* Controle: um Vagos sem as repetições tem de divergir em 07/12 (segunda, 15:30 da Ana). */
const semRepeticao = (db, data, dur) => {
  const l = [];
  for (let m = 7 * 60; m + dur <= 20 * 60; m += 30) {
    const h = String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    if (!Core.conflitosDe(db, { id: null, data, hora: h, duracaoMin: dur }).length) l.push(h);
  }
  return l;
};
r = ex('horarios_livres', { data_inicio: '2026-12-07', data_fim: '2026-12-07', duracao_min: 60, turno: 'tarde' });
conf('07/12 à tarde: a repetição prevista da Ana ocupa 15h30 (das 12:00 às 15:30, das 16:30 às 18:00)', r.resultado.dias[0].livres, ['das 12:00 às 15:30', 'das 16:30 às 18:00']);
conf('CONTROLE: o Vagos sem as repetições deixaria 15:00 livre em 07/12 (a prova vê a diferença)', semRepeticao(DB, '2026-12-07', 60).indexOf('15:00') >= 0 && r.resultado.dias[0].inicios_possiveis.indexOf('15:00') < 0, true);
conf('a tela mostra o que entendeu (dia, turno e duração)', r.entendido, ['segunda, 07/12, à tarde, aula de 1h']);
r = ex('horarios_livres', { data_inicio: HOJE, data_fim: HOJE, duracao_min: 60, turno: 'manha' });
conf('hoje de manhã: só depois de agora (11h) e antes do meio-dia', r.resultado.dias[0].inicios_possiveis, ['11:00']);
r = ex('horarios_livres', { data_inicio: '2026-11-10', data_fim: '2026-11-12', duracao_min: 60, turno: null });
conf('dias que já passaram não têm horário livre', r.resultado.dias, 'o período já passou');
conf('recusa: duração quebrada (50 min)', ex('horarios_livres', { data_inicio: HOJE, data_fim: HOJE, duracao_min: 50, turno: null }).erro, true);
conf('recusa: mais de 14 dias', ex('horarios_livres', { data_inicio: HOJE, data_fim: '2026-12-31', duracao_min: 60, turno: null }).erro, true);
r = ex('tenho_algo', { data: '2026-11-19', hora: '15:00', duracao_min: null });
conf('"já tenho algo quinta às 15h?": o Bruno, 15h, 1h30', [r.resultado.livre, r.resultado.aulas_no_horario.map(a => a.aluno + ' ' + a.hora + ' ' + a.duracao), r.entendido], [false, ['Bruno 15:00 1h30'], ['quinta, 19/11 às 15:00 (1h)']]);
r = ex('tenho_algo', { data: '2026-11-18', hora: '15:30', duracao_min: 60 });
conf('a aula cancelada não ocupa o horário', r.resultado.livre, true);
r = ex('tenho_algo', { data: '2026-12-09', hora: '16:00', duracao_min: 60 });
conf('a repetição prevista ocupa (quarta 09/12, 15h30 a 16h30)', r.resultado.livre, false);
conf('recusa: hora 25:00', ex('tenho_algo', { data: HOJE, hora: '25:00', duracao_min: null }).erro, true);
conf('recusa: hora 3 da tarde em texto', ex('tenho_algo', { data: HOJE, hora: '3pm', duracao_min: null }).erro, true);
naoGravou('horarios_livres e tenho_algo');

secao('5. proximas_aulas e historico_aluno');
r = ex('proximas_aulas', { alunoId: 'al1', n: 3 });
conf('próximas da Ana: hoje 15h30, a de 18/11 é cancelada e vai à parte, 23/11 e 25/11 (novembro está lançado)', r.resultado.proximas.map(a => a.data), ['2026-11-16', '2026-11-23', '2026-11-25']);
conf('as canceladas à frente e os horários fixos', [r.resultado.canceladas_a_frente.map(a => a.data), r.resultado.horarios_fixos], [['2026-11-18'], ['segunda e quarta às 15:30 (1h)']]);
r = ex('proximas_aulas', { alunoId: 'al1', n: 10 });
conf('além de novembro, as repetições previstas entram (dezembro)', r.resultado.proximas.some(a => a.data >= '2026-12-01' && a.repeticao), true);
conf('n acima de 10 fica em 10', ex('proximas_aulas', { alunoId: 'al1', n: 50 }).resultado.proximas.length, 10);
r = ex('proximas_aulas', { alunoId: 'al2', n: 3 });
conf('aluna sem aula: diz que não há', r.resultado.proximas, 'nenhuma aula marcada nos próximos 120 dias');
r = ex('historico_aluno', { alunoId: 'al1', n: 3 });
conf('a última aula dada vem primeiro (11/11), depois a cancelada e a de 26/10 com o relato', r.resultado.ultimas_aulas.map(a => a.data + ' ' + a.situacao), ['2026-11-11 Realizada', '2026-10-28 Cancelada sem cobrança', '2026-10-26 Realizada']);
conf('o relato e o assunto de 26/10', [r.resultado.ultimas_aulas[2].relato, r.resultado.ultimas_aulas[2].assuntos], ['Frações: foi bem.', ['Frações']]);
conf('os assuntos já dados (sem os da falta e da cancelada)', r.resultado.assuntos_ja_dados.map(a => a.assunto), ['Decimais', 'Frações']);
conf('recusa: aluno inexistente', ex('historico_aluno', { alunoId: 'x', n: 3 }).erro, true);
conf('recusa: n que não é inteiro', ex('historico_aluno', { alunoId: 'al1', n: 2.5 }).erro, true);
naoGravou('proximas_aulas e historico_aluno');

secao('6. contagem');
r = ex('contagem', { alunoId: 'al1', inicio: '2026-10-01', fim: '2026-10-31' });
conf('outubro da Ana: 2 dadas, 1 falta, 1 cancelada sem cobrança (a cancelada NÃO conta como dada)', r.resultado.total, { dadas: 2, agendadas: 0, faltas: 1, canceladas_sem_cobranca: 1, canceladas_e_cobradas: 0, reposicoes: 0 });
r = ex('contagem', { alunoId: null, inicio: '2026-10-01', fim: '2026-10-31' });
conf('outubro de todos: a cancelada e cobrada do Bruno conta à parte', [r.resultado.total.canceladas_e_cobradas, r.resultado.por_aluno.map(p => p.aluno)], [1, ['Ana S.', 'Bruno']]);
r = ex('contagem', { alunoId: 'al1', inicio: '2026-11-01', fim: '2026-11-30' });
conf('novembro da Ana: a de hoje 15h30 ainda é agendada (agora são 11h)', [r.resultado.total.dadas, r.resultado.total.agendadas, r.resultado.total.canceladas_sem_cobranca], [1, 4, 1]);
conf('recusa: período de mais de um ano', ex('contagem', { alunoId: null, inicio: '2025-01-01', fim: '2026-11-16' }).erro, true);
naoGravou('contagem');

secao('7. Dinheiro: as funções do Fechamento, com a vigência');
r = ex('resumo_financeiro', { mes: '2026-10', alunoId: 'al1' });
conf('outubro da Ana a R$ 100/h: 1h + falta de 1h30 (cobrada) + 1h = R$ 350,00, nada pago', [r.resultado.valor_ja_dado, r.resultado.pagamento, r.resultado.falta], ['R$ 350,00', 'sem pagamento marcado no app', 'R$ 350,00']);
const fOut = Core.calcularFechamento(DB, 'al1', '2026-10', HOJE);
conf('(o mesmo número do Fechamento)', Core.fmtMoeda(fOut.valorFeito), 'R$ 350,00');
r = ex('resumo_financeiro', { mes: '2026-11', alunoId: 'al1' });
conf('novembro da Ana a R$ 120/h (vigência nova): dado R$ 240,00 (11/11 e hoje, que o Fechamento já conta), ainda não dado R$ 360,00 (23, 25 e 30/11)', [r.resultado.valor_ja_dado, r.resultado.valor_ainda_nao_dado], ['R$ 240,00', 'R$ 360,00']);
r = ex('resumo_financeiro', { mes: '2026-10', alunoId: null });
conf('outubro de todos: Bruno 2h a 150 + cancelada e cobrada 1h = R$ 450, pagou 300; falta receber 350 + 150', [r.resultado.total_ja_dado, r.resultado.falta_receber_do_mes, r.resultado.por_aluno.map(p => p.aluno + ' ' + p.pagamento)], ['R$ 800,00', 'R$ 500,00', ['Ana S. sem pagamento marcado no app', 'Bruno pagamento marcado a menos']]);
r = ex('resumo_financeiro', { mes: '2026-11', alunoId: null });
conf('novembro de todos: os meses anteriores em aberto (outubro) aparecem à parte', r.resultado.meses_anteriores_em_aberto, 'R$ 500,00');
/* Ranking e projetado numa chamada só: o "de todos" traz, por aluno, o mesmo
 * já dado, ainda não dado e mês inteiro que a chamada de um aluno traz.
 * (Num teste real ela pediu "os cinco que mais rendem, projetado" e o modelo
 * consultou um aluno por vez, bateu no teto de 8 por volta e deixou 3 de fora.) */
const todosNov = r.resultado.por_aluno;
conf('novembro de todos: cada aluno com já dado, ainda não dado e mês inteiro', todosNov.every(p => p.valor_ja_dado && p.valor_ainda_nao_dado && p.valor_do_mes_inteiro), true);
['al1', 'al2'].forEach(function (id) {
  const um = ex('resumo_financeiro', { mes: '2026-11', alunoId: id }).resultado;
  const doTodos = todosNov.filter(p => p.aluno === um.aluno)[0] || {};
  conf('novembro: ' + um.aluno + ' no "de todos" igual à chamada só dele',
    [doTodos.valor_ja_dado, doTodos.valor_ainda_nao_dado, doTodos.valor_do_mes_inteiro, doTodos.aulas_dadas, doTodos.aulas_a_dar],
    [um.valor_ja_dado, um.valor_ainda_nao_dado, um.valor_do_mes_inteiro, um.aulas_dadas, um.aulas_a_dar]);
});
conf('o system manda comparar e ordenar alunos com UMA chamada para todos e nunca listar com aluno faltando',
  /UMA chamada para todos/.test(A.SISTEMA) && /se faltar algum, diga isso ANTES da lista/.test(A.SISTEMA), true);
conf('a descrição do resumo_financeiro diz que o "de todos" traz o mês inteiro por aluno',
  /todos de uma vez[^']*mês inteiro/.test(JSON.stringify(A.FERRAMENTAS.filter(f => f.name === 'resumo_financeiro')[0])), true);
/* "Entendi" curto: 3 ou mais iguais menos o aluno viram uma linha com a contagem;
 * 2 ficam como estão; o resto fica na ordem. */
conf('Entendi: 15 consultas de alunos viram "aulas de novembro de 2026, 15 alunos"',
  A.resumirEntendido(Array.from({ length: 15 }, (_, i) => 'aulas de novembro de 2026, Aluno' + i)), ['aulas de novembro de 2026, 15 alunos']);
conf('Entendi: dois alunos ficam com o nome (abaixo de 3 não resume)',
  A.resumirEntendido(['aulas de novembro de 2026, Ana S.', 'aulas de novembro de 2026, Bruno']), ['aulas de novembro de 2026, Ana S.', 'aulas de novembro de 2026, Bruno']);
conf('Entendi: o que não é do grupo fica, na ordem',
  A.resumirEntendido(['pagamentos marcados no app, aulas de outubro de 2026', 'aulas de novembro de 2026, A', 'Bruno', 'aulas de novembro de 2026, B', 'aulas de novembro de 2026, C']),
  ['pagamentos marcados no app, aulas de outubro de 2026', 'aulas de novembro de 2026, 3 alunos', 'Bruno']);
r = ex('resumo_financeiro', { mes: '2026-08', alunoId: 'al1' });
conf('mês sem aula', r.resultado.obs, 'nenhuma aula neste mês');
conf('recusa: mês "outubro"', ex('resumo_financeiro', { mes: 'outubro', alunoId: null }).erro, true);
conf('recusa: mês 13', ex('resumo_financeiro', { mes: '2026-13', alunoId: null }).erro, true);
r = ex('pendencias_pagamento', { mes: null });
conf('quem não pagou: Ana outubro (350) e Bruno outubro a menos (150); total 500', [r.resultado.meses.map(p => p.aluno + ' ' + p.falta), r.resultado.total_em_aberto], [['Ana S. R$ 350,00', 'Bruno R$ 150,00'], 'R$ 500,00']);
conf('o resultado nunca diz "não pagou": diz "sem pagamento marcado no app" ou "marcado a menos", e lembra do Pix', [r.resultado.meses.map(p => p.situacao), /não pag/i.test(JSON.stringify(r.resultado)), /Pix/.test(r.resultado.lembrete)], [['sem pagamento marcado no app', 'pagamento marcado a menos'], false, true]);
conf('o Entendi diz de onde vem o número', ex('pendencias_pagamento', { mes: '2026-10' }).entendido, ['pagamentos marcados no app, aulas de outubro de 2026']);
r = ex('pendencias_pagamento', { mes: '2026-11' });
conf('o mês corrente ainda não fecha', [r.resultado.meses.length, !!r.resultado.obs], [0, true]);
r = ex('valor_hora', { alunoId: 'al1' });
conf('valor da hora da Ana hoje e desde quando, com a vigência anterior', [r.resultado.hoje, r.resultado.desde, r.resultado.vigencias.length], ['R$ 120,00 por hora', '01/11/2026', 2]);
r = ex('valor_hora', { alunoId: 'al1' }, Object.assign({}, ctx, { hoje: '2026-10-15' }));
conf('em 15/10 a vigência era a de R$ 100', r.resultado.hoje, 'R$ 100,00 por hora');
naoGravou('dinheiro');

secao('8. Pendências: sem registro e feedbacks');
r = ex('sem_registro', { inicio: '2026-11-01', fim: HOJE });
conf('sem registro: 11/11 da Ana (dada, vazia) e 16/11 8h do Bruno; a de hoje 15h30 ainda não; o inativo fica fora', r.resultado.aulas.map(a => a.data + ' ' + a.aluno), ['2026-11-16 Bruno', '2026-11-11 Ana S.']);
r = ex('sem_registro', { inicio: '2026-10-01', fim: '2026-10-31' });
conf('outubro: só as dadas sem registro (a falta e a cancelada não pedem registro)', r.resultado.aulas.map(a => a.data), ['2026-10-20']);
r = ex('feedbacks_pendentes', { mes: '2026-10' });
conf('feedback de outubro: falta o do Bruno; o da Ana está escrito', [r.resultado.faltam, r.resultado.escritos], [['Bruno'], 1]);
naoGravou('pendências');

secao('9. Contato e atalhos: cartões que ela toca; o número não vai ao modelo');
r = ex('contato', { alunoId: 'al1' });
conf('o cartão tem o telefone, o WhatsApp e o mapa', [r.cartao.tipo, r.cartao.ligar, r.cartao.whatsapp, !!r.cartao.mapa], ['contato', 'tel:+5521987654321', 'https://wa.me/5521987654321', true]);
conf('o resultado ao modelo diz só o que existe', [r.resultado.telefone_cadastrado, r.resultado.tem_whatsapp, r.resultado.endereco_cadastrado], [true, true, true]);
r = ex('preparar_whatsapp', { alunoId: 'al1', texto: 'Olá! Estou 10 minutos atrasada — chego já.' });
conf('o WhatsApp abre com o texto escrito, sem travessão', [r.cartao.href, r.cartao.texto], ['https://wa.me/5521987654321?text=' + encodeURIComponent('Olá! Estou 10 minutos atrasada, chego já.'), 'Olá! Estou 10 minutos atrasada, chego já.']);
conf('recusa: sem celular (Ana O.)', [ex('preparar_whatsapp', { alunoId: 'al2', texto: 'Oi' }).erro, ex('preparar_whatsapp', { alunoId: 'al2', texto: 'Oi' }).resultado.erro.slice(0, 12)], [true, 'sem_whatsapp']);
conf('recusa: fixo não abre WhatsApp, mas liga', [ex('preparar_whatsapp', { alunoId: 'al3', texto: 'Oi' }).erro, ex('preparar_ligacao', { alunoId: 'al3' }).cartao.href], [true, 'tel:+552133334444']);
conf('recusa: texto vazio', ex('preparar_whatsapp', { alunoId: 'al1', texto: '  ' }).erro, true);
for (const veneno of ['Olá! Ficou R$ 9.999,00 de outubro.', 'O valor é 9999,00.', 'São 300 reais.', 'Veja https://exemplo.com/pix', 'Paga em www.exemplo.com.br', 'Entra em pix.app']) {
  const v = ex('preparar_whatsapp', { alunoId: 'al1', texto: veneno });
  conf('VENENO recusado no WhatsApp: "' + veneno + '" (sem cartão; o erro manda usar a cobrança ou tirar o link)', [v.erro, v.cartao, /preparar_cobranca|link/.test(v.resultado.erro)], [true, null, true]);
}
for (const veneno of ['Olá! Ficou 350.', 'São 1.250 do mês.', 'Pix: 21987654321', 'O mês deu 1,250 no total.']) {
  const v = ex('preparar_whatsapp', { alunoId: 'al1', texto: veneno });
  conf('VENENO (rodada 2) recusado: "' + veneno + '", mandando usar a cobrança', [v.erro, /preparar_cobranca/.test(v.resultado.erro)], [true, true]);
}
for (const hora of ['Chego às 15.30', 'Chego às 15:30', 'Vou atrasar 15 min', 'Vou atrasar 10 minutos', 'Chego às 15h30', 'Chego 15.30h', 'Até 9:05!', 'Podemos remarcar a aula de 20/11/2026?']) {
  conf('a hora passa no WhatsApp: "' + hora + '"', ex('preparar_whatsapp', { alunoId: 'al1', texto: hora }).erro, false);
}
conf('CONTROLE: a mensagem sem valor nem link passa, com minutos e horas', ex('preparar_whatsapp', { alunoId: 'al1', texto: 'Olá! Vou atrasar 10 minutos, chego às 15:40.' }).erro, false);
conf('o cartão leva o responsável e o telefone só para a tela', (() => { const c = ex('preparar_whatsapp', { alunoId: 'al1', texto: 'Olá!' }).cartao; return [!!c.responsavel, !!c.telefone]; })(), [true, true]);
r = ex('preparar_cobranca', { alunoId: 'al1', mes: null });
conf('cobrança: a mensagem do app, com outubro e R$ 350,00', [r.cartao.cobranca, r.cartao.texto], [true, 'Olá! Passando para lembrar do pagamento: outubro de 2026, R$ 350,00. Obrigada!']);
conf('recusa: cobrar um mês sem pendência', ex('preparar_cobranca', { alunoId: 'al1', mes: '2026-09' }).erro, true);
conf('preparar_mapa abre o endereço; sem endereço, recusa', [!!ex('preparar_mapa', { alunoId: 'al1' }).cartao.href, ex('preparar_mapa', { alunoId: 'al3' }).erro], [true, true]);
naoGravou('atalhos');

secao('10. Privacidade: nada sai com o telefone, o endereço, a nota "só minha" nem a observação');
const tudo = todasAsSaidas.join('\n');
conf('o veneno (endereço, responsável, nota só minha, observação) não aparece em nenhum resultado ao modelo (' + todasAsSaidas.length + ' saídas)', tudo.indexOf(VENENO) >= 0, false);
conf('nenhum número de telefone em resultado ao modelo', /98765|33334444|wa\.me|tel:/.test(tudo), false);
conf('CONTROLE: o instrumento vê o veneno quando ele está lá', (tudo + VENENO).indexOf(VENENO) >= 0, true);

secao('11. Nada grava: controle com uma ferramenta que tenta gravar');
const ctxMentira = Object.assign({}, ctx);
const tentou = (() => { try { DB.aulas.push({ id: 'intrusa' }); return 'gravou'; } catch (e) { return 'recusado'; } })();
conf('CONTROLE: o banco congelado recusa uma escrita (o instrumento pega quem grava)', tentou, 'recusado');
try { DB.alunos[0].nome = 'Mudou'; } catch (e) { /* esperado */ }
conf('CONTROLE: mudar um campo também é recusado', DB.alunos[0].nome, 'Ana Sintética');
naoGravou('depois dos controles');
conf('ferramenta desconhecida vira erro, não exceção', A.executar('apagar_tudo', {}, ctxMentira).erro, true);

/* ================= 12. o laço de ferramentas ================= */
function respostaTool(chamadas, assinatura) {
  return { ok: true, resposta: { stop_reason: 'tool_use', content: [{ type: 'thinking', thinking: '', signature: assinatura || 'sig-1' }].concat(chamadas.map((c, i) => ({ type: 'tool_use', id: 'tu' + i + '-' + c.name, name: c.name, input: c.input }))),
    usage: { input_tokens: 10, output_tokens: 20, cache_read_input_tokens: 3000, cache_creation_input_tokens: 0 } } };
}
function respostaTexto(t) { return { ok: true, resposta: { stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: '', signature: 'sig-fim' }, { type: 'text', text: t }], usage: { input_tokens: 5, output_tokens: 15, cache_read_input_tokens: 3000, cache_creation_input_tokens: 0 } } }; }

(async () => {
  secao('11b. A resposta na tela: sem travessão, sem markdown, valor à direita com 3 itens ou mais');
  conf('negrito, título, marcador e travessão saem; valor à direita', A.linhasDaResposta('Em outubro:\n- **Ana O.**: R$ 110,00\n* Caio: R$ 600,00\n## Total \u2014 R$ 710,00'),
    [{ texto: 'Em outubro:', valor: null }, { texto: 'Ana O.', valor: 'R$ 110,00' }, { texto: 'Caio', valor: 'R$ 600,00' }, { texto: 'Total', valor: 'R$ 710,00' }]);
  conf('com menos de 3 linhas, o valor fica no texto', A.linhasDaResposta('O mês deu R$ 600,00.'), [{ texto: 'O mês deu R$ 600,00.', valor: null }]);
  conf('o travessão vira vírgula', A.linhasDaResposta('Hoje \u2013 nada')[0].texto, 'Hoje, nada');

  secao('12. O laço: content intacto, resultados juntos, teto de 5 voltas, erro e recomeço');
  const sessao = A.novaSessao();
  const pedidos = [];
  const roteiro = [
    respostaTool([{ name: 'listar_aulas', input: { inicio: '2026-11-17', fim: '2026-11-17', alunoId: null } }, { name: 'preparar_whatsapp', input: { alunoId: 'al1', texto: 'Olá! Vou atrasar 10 minutos.' } }], 'sig-A'),
    respostaTexto('Amanhã você não tem aula. Preparei a mensagem: é só tocar em Abrir no WhatsApp.')
  ];
  let fila = roteiro.slice();
  const chamar = c => { pedidos.push(JSON.parse(JSON.stringify(c))); return Promise.resolve(fila.shift()); };
  let res = await A.perguntar(sessao, 'O que eu tenho amanhã? E avisa a mãe da Ana que vou atrasar', { chamar, ctx, hora: '11:00' });
  conf('a resposta, os cartões e o que entendeu', [res.texto, res.cartoes.map(c => c.tipo), res.entendido, res.voltas], [roteiro[1].resposta.content[1].text, ['whatsapp'], ['terça, 17/11', 'Ana S.'], 2]);
  conf('a primeira mensagem leva os alunos e o agora; a pergunta vai depois', [/Alunos ativos/.test(pedidos[0].messages[0].content[0].text), /Agora: segunda-feira, 16\/11\/2026 \(2026-11-16\), 11:00/.test(pedidos[0].messages[0].content[0].text)], [true, true]);
  conf('o segundo pedido reenvia o content do modelo INTACTO (com o thinking e a assinatura)', JSON.stringify(pedidos[1].messages[1].content), JSON.stringify(roteiro[0].resposta.content));
  conf('o mesmo objeto, não uma cópia reescrita', sessao.mensagens[1].content === roteiro[0].resposta.content, true);
  conf('os dois tool_result vão juntos numa mensagem só, na ordem, com os ids', pedidos[1].messages[2].content.map(b => b.type + ':' + b.tool_use_id), ['tool_result:tu0-listar_aulas', 'tool_result:tu1-preparar_whatsapp']);
  conf('o usage de cada volta fica guardado', res.usos.length, 2);
  const tamanhoAntes = sessao.mensagens.length;
  fila = [respostaTexto('Amanhã: nada.')];
  res = await A.perguntar(sessao, 'e amanhã?', { chamar, ctx, hora: '11:05' });
  conf('a pergunta seguinte continua a conversa (sem repetir os alunos), com o agora novo', [sessao.mensagens.length, /Alunos ativos/.test(pedidos[2].messages[tamanhoAntes].content[0].text), /11:05/.test(pedidos[2].messages[tamanhoAntes].content[0].text)], [tamanhoAntes + 2, false, true]);

  // erro de ferramenta: volta como is_error e o modelo corrige
  fila = [respostaTool([{ name: 'listar_aulas', input: { inicio: '2026-02-30', fim: '2026-02-30', alunoId: null } }]), respostaTexto('Essa data não existe.')];
  const antes = pedidos.length;
  res = await A.perguntar(sessao, 'o que eu tenho dia 30 de fevereiro?', { chamar, ctx, hora: '11:06' });
  const ultimo = pedidos[antes + 1].messages[pedidos[antes + 1].messages.length - 1].content[0];
  conf('data inválida volta ao modelo como erro (is_error), e a tela não mostra dia entendido', [ultimo.is_error, /data inválida/.test(ultimo.content), res.entendido], [true, true, []]);

  // teto de 5 voltas
  const sessao2 = A.novaSessao();
  let voltas = 0;
  const sempreFerramenta = () => { voltas++; return Promise.resolve(respostaTool([{ name: 'valor_hora', input: { alunoId: 'al1' } }], 'sig-' + voltas)); };
  res = await A.perguntar(sessao2, 'quanto eu cobro da Ana?', { chamar: sempreFerramenta, ctx, hora: '11:00' });
  conf('o teto: no máximo 5 chamadas por pergunta, e a frase própria', [voltas, res.erro, A.fraseDoErro(res.erro)], [5, 'voltas', 'Não achei essa resposta. Tente perguntar de outro jeito.']);
  conf('a pergunta que não fechou sai da conversa (nada pendurado)', sessao2.mensagens.length, 0);

  // erro do endpoint: a pergunta sai da conversa e a frase é curta
  const sessao3 = A.novaSessao();
  for (const [codigo, frase] of [['sem_internet', 'Precisa de internet para perguntar.'], ['limite_mensal', 'A IA está pausada até o dia 1.'], ['ocupado', 'Não consegui agora. Toque em Tentar de novo.'], ['sem_permissao', 'A IA ainda não está liberada nesta conta.']]) {
    res = await A.perguntar(sessao3, 'oi', { chamar: () => Promise.resolve({ ok: false, codigo }), ctx, hora: '11:00' });
    conf('erro ' + codigo + ': frase curta e a conversa vazia', [A.fraseDoErro(res.erro), sessao3.mensagens.length], [frase, 0]);
  }
  conf('a frase de sem_permissao é neutra (sem nome de pessoa)', /Rômulo|Nathália/.test(A.fraseDoErro('sem_permissao')), false);
  conf('"Tentar de novo" só para o que passa sozinho', ['rede', 'sem_internet', 'ocupado', 'sem_permissao', 'limite_mensal'].map(A.daParaTentarDeNovo), [true, true, true, false, false]);
  res = await A.perguntar(sessao3, 'oi', { chamar: () => Promise.reject(new Error('caiu')), ctx, hora: '11:00' });
  conf('a rede que cai no meio vira "rede"', res.erro, 'rede');
  res = await A.perguntar(sessao3, 'oi', { chamar: () => Promise.resolve({ ok: true, resposta: { stop_reason: 'refusal', content: [] } }), ctx, hora: '11:00' });
  conf('a recusa vira frase própria', res.erro, 'recusa');

  // recomeço quando a conversa passa do teto do endpoint
  const sessao4 = A.novaSessao();
  fila = [respostaTexto('um')];
  await A.perguntar(sessao4, 'primeira', { chamar, ctx, hora: '11:00' });
  let vezes = 0;
  const longa = c => { vezes++; return Promise.resolve(vezes === 1 ? { ok: false, codigo: 'conversa_longa' } : respostaTexto('dois')); };
  res = await A.perguntar(sessao4, 'segunda', { chamar: longa, ctx, hora: '11:01' });
  conf('conversa longa: recomeça sozinha só com a pergunta nova, e responde', [res.texto, sessao4.mensagens.length, /Alunos ativos/.test(sessao4.mensagens[0].content[0].text)], ['dois', 2, true]);

  // cancelar no meio
  const sessao5 = A.novaSessao();
  let cancelado = false;
  res = await A.perguntar(sessao5, 'oi', { chamar: () => { cancelado = true; return Promise.resolve(respostaTexto('tarde')); }, ctx, hora: '11:00', cancelado: () => cancelado });
  conf('cancelar no meio: nada fica na conversa', [res.erro, sessao5.mensagens.length], ['cancelado', 0]);
  // tetos (item 17): no máximo 8 ferramentas por volta, e o resultado grande demais vira erro
  {
    const sessao6 = A.novaSessao('u1');
    const dez = Array.from({ length: 10 }, () => ['valor_hora', { alunoId: 'al1' }]).map(c => ({ name: c[0], input: c[1] }));
    const pedidos6 = [];
    let f6 = [respostaTool(dez), respostaTexto('ok')];
    await A.perguntar(sessao6, 'dez', { chamar: c => { pedidos6.push(c); return Promise.resolve(f6.shift()); }, ctx, hora: '11:00' });
    const res6 = pedidos6[1].messages[2].content;
    conf('10 ferramentas numa volta: 8 rodam, 2 voltam como erro (todas respondidas)', [res6.length, res6.filter(b => !b.is_error).length, res6.filter(b => b.is_error).length, /no máximo 8/.test(res6[9].content)], [10, 8, 2, true]);
    const pedidos7 = [];
    f6 = [respostaTool([{ name: 'listar_aulas', input: { inicio: '2026-11-01', fim: '2027-01-01', alunoId: null } }]), respostaTexto('ok')];
    const grande = Object.assign({}, ctx, { db: Object.assign({}, DB, { aulas: DB.aulas.concat(Array.from({ length: 900 }, (x, i) => ({ id: 'g' + i, alunoId: 'al3', data: '2026-12-' + String(1 + (i % 28)).padStart(2, '0'), hora: '07:00', duracaoMin: 30, status: 'realizada' }))) }) });
    await A.perguntar(A.novaSessao('u1'), 'grande', { chamar: c => { pedidos7.push(c); return Promise.resolve(f6.shift()); }, ctx: grande, hora: '11:00' });
    const r7 = pedidos7[1].messages[2].content[0];
    conf('resultado acima de 30 mil caracteres vira erro "peça um período menor"', [r7.is_error, /período menor/.test(r7.content), r7.content.length < A.MAX_RESULTADO], [true, true, true]);
  }
  // sessão (item 16): o desfazer não corta a conversa que mudou no meio; a sessão sabe de quem é
  {
    const sessao8 = A.novaSessao('u1');
    fila = [respostaTexto('primeira')];
    await A.perguntar(sessao8, 'primeira', { chamar, ctx, hora: '11:00' });
    const antesDaCorrida = sessao8.mensagens.length;
    let soltar;
    const pendente = A.perguntar(sessao8, 'lenta', { chamar: () => new Promise(r => { soltar = r; }), ctx, hora: '11:01' });
    sessao8.mensagens = [];              // "Nova conversa" no meio
    sessao8.mensagens.push({ role: 'user', content: [{ type: 'text', text: 'outra' }] });
    soltar({ ok: false, codigo: 'ocupado' });
    const r8 = await pendente;
    conf('corrida: a pergunta que falha depois de uma "Nova conversa" não corta a conversa nova', [r8.erro, sessao8.mensagens.length, sessao8.mensagens[0].content[0].text], ['ocupado', 1, 'outra']);
    conf('(arranjo) antes da corrida havia 2 mensagens', antesDaCorrida, 2);
    /* Fechar, reabrir e perguntar (o caminho do app): ao fechar no meio, o app
     * troca a lista da sessão pela de antes da pergunta (pararAssistente);
     * a pergunta nova vai na lista nova, e a velha, quando enfim volta, não
     * corta nada. */
    const sessao11 = A.novaSessao('u1');
    fila = [respostaTexto('antes')];
    await A.perguntar(sessao11, 'antes', { chamar, ctx, hora: '11:00' });
    const tamanho = sessao11.mensagens.length;
    let soltar11;
    const velha = A.perguntar(sessao11, 'velha', { chamar: () => new Promise(r => { soltar11 = r; }), ctx, hora: '11:01' });
    sessao11.mensagens = sessao11.mensagens.slice(0, tamanho);       // fechar (pararAssistente)
    fila = [respostaTexto('nova')];
    const r11 = await A.perguntar(sessao11, 'nova', { chamar, ctx, hora: '11:02' });  // reabrir e perguntar
    soltar11({ ok: false, codigo: 'cancelado' });
    await velha;
    conf('corrida fechar, reabrir e perguntar: a pergunta nova fica inteira, e a velha não aparece', [r11.texto, sessao11.mensagens.length, sessao11.mensagens.some(m => /velha/.test(JSON.stringify(m.content)))], ['nova', tamanho + 2, false]);
    conf('a sessão sabe de quem é: outra conta não usa a conversa', [A.sessaoValida(sessao8, 'u1'), A.sessaoValida(sessao8, 'u2'), A.sessaoValida(null, 'u1')], [true, false, false]);
  }
  // recomeço (item 16): respeita as voltas que restam; e o teto de 36 mensagens recomeça avisando
  {
    const sessao9 = A.novaSessao('u1');
    fila = [respostaTexto('um')];
    await A.perguntar(sessao9, 'um', { chamar, ctx, hora: '11:00' });
    let n9 = 0;
    const sempreLonga = () => { n9++; return Promise.resolve(n9 <= 2 ? respostaTool([{ name: 'valor_hora', input: { alunoId: 'al1' } }]) : n9 === 3 ? { ok: false, codigo: 'conversa_longa' } : respostaTool([{ name: 'valor_hora', input: { alunoId: 'al1' } }])); };
    const r9 = await A.perguntar(sessao9, 'dois', { chamar: sempreLonga, ctx, hora: '11:00' });
    conf('o recomeço conta as voltas de antes: no máximo 5 chamadas no total', [n9, r9.erro, r9.voltas], [5, 'voltas', 5]);
    const sessao10 = A.novaSessao('u1');
    for (let i = 0; i < 40; i++) sessao10.mensagens.push({ role: i % 2 ? 'assistant' : 'user', content: [{ type: 'text', text: 'x' }] });
    fila = [respostaTexto('nova')];
    const r10 = await A.perguntar(sessao10, 'depois de muitas', { chamar, ctx, hora: '11:00' });
    conf('passou de 36 mensagens: a conversa recomeça e a resposta avisa (recomecou)', [r10.recomecou, sessao10.mensagens.length, /Alunos ativos/.test(sessao10.mensagens[0].content[0].text)], [true, 2, true]);
  }
  naoGravou('o laço inteiro');

  secao('13. Datas relativas: 20 frases, o calendário da pergunta e a conferência do app');
  /* Para cada frase: o agora, a data que o modelo deve pedir, a linha do
   * calendário que a dá pronta, e o que a tela mostra. */
  const casos = [
    ['2026-11-16', '11:00', 'o que eu tenho amanhã?', '2026-11-17', 'Amanhã: terça, 2026-11-17', 'terça, 17/11'],
    ['2026-11-16', '11:00', 'e depois de amanhã?', '2026-11-18', 'Depois de amanhã: quarta, 2026-11-18', 'quarta, 18/11'],
    ['2026-11-16', '11:00', 'quinta que vem', '2026-11-26', 'Semana que vem: 2026-11-23 a 2026-11-29', 'quinta, 26/11'],
    ['2026-11-16', '11:00', 'o que eu tenho quinta?', '2026-11-19', 'qui 2026-11-19', 'quinta, 19/11'],
    ['2026-11-16', '11:00', 'já tenho algo às 3 e meia da tarde?', '2026-11-16', 'Agora: segunda-feira, 16/11/2026 (2026-11-16)', 'segunda, 16/11'],
    ['2026-11-22', '21:30', 'o que eu tenho segunda?', '2026-11-23', 'Amanhã: segunda, 2026-11-23', 'segunda, 23/11'],
    ['2026-11-22', '21:30', 'como está a semana que vem?', '2026-11-23', 'Semana que vem: 2026-11-23 a 2026-11-29', 'segunda, 23/11'],
    ['2026-11-29', '20:00', 'amanhã', '2026-11-30', 'Amanhã: segunda, 2026-11-30', 'segunda, 30/11'],
    ['2026-11-30', '09:00', 'depois de amanhã', '2026-12-02', 'Depois de amanhã: quarta, 2026-12-02', 'quarta, 02/12'],
    ['2026-11-30', '09:00', 'quinta', '2026-12-03', 'qui 2026-12-03', 'quinta, 03/12'],
    ['2026-12-31', '18:00', 'amanhã', '2027-01-01', 'Amanhã: sexta, 2027-01-01', 'sexta, 01/01/2027'],
    ['2026-12-31', '18:00', 'segunda', '2027-01-04', 'seg 2027-01-04', 'segunda, 04/01/2027'],
    ['2026-12-30', '10:00', 'semana que vem', '2027-01-04', 'Semana que vem: 2027-01-04 a 2027-01-10', 'segunda, 04/01/2027'],
    ['2027-02-27', '10:00', 'depois de amanhã', '2027-03-01', 'Depois de amanhã: segunda, 2027-03-01', 'segunda, 01/03'],
    ['2028-02-28', '10:00', 'amanhã', '2028-02-29', 'Amanhã: terça, 2028-02-29', 'terça, 29/02'],
    ['2026-11-19', '08:00', 'o que eu tenho quinta?', '2026-11-19', 'Agora: quinta-feira, 19/11/2026 (2026-11-19)', 'quinta, 19/11'],
    ['2026-11-19', '08:00', 'quinta que vem', '2026-11-26', 'Semana que vem: 2026-11-23 a 2026-11-29', 'quinta, 26/11'],
    ['2026-11-21', '12:00', 'esta semana', '2026-11-16', 'Esta semana (segunda a domingo): 2026-11-16 a 2026-11-22', 'segunda, 16/11'],
    ['2026-11-22', '23:50', 'esta semana', '2026-11-16', 'Esta semana (segunda a domingo): 2026-11-16 a 2026-11-22 (termina hoje)', 'segunda, 16/11'],
    ['2026-11-16', '11:00', 'quem não pagou o mês passado?', '2026-10', 'Mês passado: outubro de 2026 (2026-10)', 'outubro de 2026']
  ];
  conf('(arranjo) são 20 frases', casos.length, 20);
  for (const [hoje, hora, frase, alvo, linha, tela] of casos) {
    const cal = A.contextoDoAgora(hoje, hora);
    const ctxDia = Object.assign({}, ctx, { hoje, agoraMin: Core.minutosDaHora(hora) });
    let mostra;
    if (alvo.length === 7) mostra = A.executar('feedbacks_pendentes', { mes: alvo }, ctxDia).entendido[0];
    else mostra = A.executar('listar_aulas', { inicio: alvo, fim: alvo, alunoId: null }, ctxDia).entendido[0];
    conf('"' + frase + '" em ' + hoje + ' ' + hora + ': o calendário traz "' + linha + '" e a tela mostra "' + tela + '"', [cal.indexOf(linha) >= 0, mostra], [true, tela]);
  }
  conf('3 e meia da tarde é 15:30: o app aceita e a tela diz 15:30', A.executar('tenho_algo', { data: '2026-11-16', hora: '15:30', duracao_min: null }, ctx).entendido, ['segunda, 16/11 às 15:30 (1h)']);
  conf('a conferência recusa o que o modelo pedir errado: 2027-02-29, 2026-11-31, "amanhã", 2026-1-5',
    ['2027-02-29', '2026-11-31', 'amanhã', '2026-1-5'].map(d => A.executar('listar_aulas', { inicio: d, fim: d, alunoId: null }, ctx).erro), [true, true, true, true]);
  conf('o calendário não usa travessão', /[–—]/.test(A.contextoDoAgora(HOJE, '11:00')), false);
  naoGravou('as 20 frases');

  console.log('\n' + passes + ' verificacoes passaram, ' + falhas + ' falharam');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
