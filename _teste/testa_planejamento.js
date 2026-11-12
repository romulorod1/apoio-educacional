/* testa_planejamento.js (projeto IA no app, fase 2; Node, sem navegador, sem rede)
 *
 * O módulo puro do planejamento de estudos (planejamento.js): o pedido ao
 * endpoint, a leitura da resposta do modelo e a folha em PDF. Dados
 * SINTÉTICOS: nenhum aluno real, nenhum aviso real, nenhuma chamada à API.
 *
 * Cada regra que decide alguma coisa é provada dos DOIS lados (o caso que
 * passa e o que é barrado pela mesma regra), para uma regra que barra tudo, ou
 * que não barra nada, não passar por acerto.
 */
'use strict';
const path = require('path');
const P = require(path.join(__dirname, '..', 'planejamento.js'));
const G = require(path.join(__dirname, '..', 'pdf.js'));

let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK    ' : '  FALHA ') + rotulo + (ok ? '' : '  [obtido: ' + JSON.stringify(obtido).slice(0, 300) + ' | esperado: ' + JSON.stringify(esperado) + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

/* O texto do PDF: cada Tj, em latin1 (os bytes WinAnsi). O travessão e o
 * meia-risca do WinAnsi são os bytes 0x97 e 0x96; o código não carrega o
 * caractere, só o número. */
function textoDoPdf(bytes) {
  const bruto = Buffer.from(bytes).toString('latin1');
  const rx = /\(((?:\\.|[^\\()])*)\)\s*Tj/g;
  const partes = [];
  let m;
  while ((m = rx.exec(bruto))) partes.push(m[1].replace(/\\([\\()])/g, '$1'));
  return partes;
}
function paginasDoPdf(bytes) {
  const m = /\/Type \/Pages \/Count (\d+)/.exec(Buffer.from(bytes).toString('latin1'));
  return m ? Number(m[1]) : -1;
}
const TRAVESSAO_WINANSI = new RegExp('[' + String.fromCharCode(0x96, 0x97) + ']');
const TRAVESSAO = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']');
const contar = (lista, alvo) => lista.filter(t => t === alvo).length;

/* ---------- o plano sintético ---------- */
function dias(inicio, fim) { const s = []; for (let d = inicio; d <= fim; d = P.somaDias(d, 1)) s.push(d); return s; }
function planoBase(o) {
  o = o || {};
  const inicio = o.inicio || '2026-11-09', fim = o.fim || '2026-11-20';
  const grade = dias(inicio, fim).map(d => ({ data: d, prova: null, estudo: ['Matemática'], deManha: false }));
  const g = d => grade.find(x => x.data === d);
  const provas = o.provas || [
    { data: P.somaDias(inicio, 3), disciplina: 'Cambridge', conteudo: null, material: null, incerto: false },
    { data: P.somaDias(inicio, 5), disciplina: 'História', conteudo: 'Cap. 3 (Rios) ' + String.fromCharCode(0x2014) + ' cap. 4 (Cidades).', material: 'Livro 2 e caderno.', incerto: true },
    { data: fim, disciplina: 'Science', conteudo: null, material: null, incerto: false }
  ];
  provas.forEach(p => { if (g(p.data)) g(p.data).prova = p.disciplina; });
  if (g(P.somaDias(inicio, 1))) g(P.somaDias(inicio, 1)).estudo = ['História (2 h)', 'Math (30 min)', 'Science (1 h30)'];
  return Object.assign({
    alunoId: 'al-sint-1', confiancaAluno: 'alta', tratamento: 'Aluna',
    periodo: { inicio, fim }, grade, provas,
    aulaAConfirmar: [], aulasRemovidas: [], aulasExtras: [], feriados: [], observacoes: []
  }, o.extra || {});
}
function respostaDe(plano, extra) {
  return Object.assign({ ok: true, resposta: { id: 'm', model: 'claude-sonnet-5-5', stop_reason: 'end_turn',
    content: [{ type: 'thinking', thinking: '', signature: 'assinatura-sintetica' }, { type: 'text', text: JSON.stringify(plano) }],
    usage: { input_tokens: 10, output_tokens: 20 } } }, extra || {});
}
const IDS = ['al-sint-1', 'al-sint-2'];
const ALUNOS = [
  { id: 'al-sint-1', nome: 'Zélia Sintética Sobrenomezzz', horarios: [{ dias: [4, 1], hora: '17:00' }] },
  { id: 'al-sint-2', nome: 'Bruno Ficticio Sobrenomeyyy', horarios: [{ dias: [1, 3, 5], hora: '15:30' }] }
];

// ================================================================
secao('1. O esquema serve à saída estruturada');
(function () {
  const ruins = [];
  (function andar(n, onde) {
    if (!n || typeof n !== 'object') return;
    if (n.type === 'object') {
      if (n.additionalProperties !== false) ruins.push(onde + ' sem additionalProperties:false');
      const props = Object.keys(n.properties || {}).sort();
      const req = (n.required || []).slice().sort();
      if (JSON.stringify(props) !== JSON.stringify(req)) ruins.push(onde + ' required diferente das propriedades');
    }
    ['minimum', 'maximum', 'minLength', 'maxLength', 'minItems', 'maxItems', 'pattern'].forEach(k => { if (k in n) ruins.push(onde + ' usa ' + k); });
    Object.keys(n).forEach(k => andar(n[k], onde + '.' + k));
  })(P.ESQUEMA, 'ESQUEMA');
  conf('todo objeto tem additionalProperties:false e required com todas as propriedades, sem restrição que a API não aceita', ruins, []);
  conf('os campos do plano são os do brief (mais tratamento e deManha)', Object.keys(P.ESQUEMA.properties).sort(),
    ['alunoId', 'aulaAConfirmar', 'aulasExtras', 'aulasRemovidas', 'confiancaAluno', 'feriados', 'grade', 'observacoes', 'periodo', 'provas', 'tratamento']);
  conf('aulasRemovidas e aulasExtras são exigidas na saída (podem vir vazias), e a extra é { data, hora }', [
    P.ESQUEMA.required.indexOf('aulasRemovidas') >= 0, P.ESQUEMA.required.indexOf('aulasExtras') >= 0,
    P.ESQUEMA.properties.aulasExtras.items.required.slice().sort(), P.ESQUEMA.properties.aulasExtras.items.additionalProperties],
    [true, true, ['data', 'hora'], false]);
})();

// ================================================================
secao('2. O pedido ao endpoint');
(function () {
  const img = n => Array.from({ length: n }, (_, i) => ({ media_type: 'image/jpeg', data: 'QUJD' + i }));
  const a = P.montarPedido({ texto: 'provas de novembro da aluna de segunda e quinta', imagens: img(2), alunos: ALUNOS, alunoFixoId: null, hoje: '2026-11-12' });
  const b = P.montarPedido({ texto: 'outro pedido', imagens: [], alunos: ALUNOS.slice(1), alunoFixoId: 'al-sint-2', hoje: '2027-03-01' });
  conf('o corpo tem rota, system, formato json_schema, esforço e teto', [a.rota, typeof a.system, a.formato.type, a.esforco, a.max_tokens],
    ['planejamento', 'string', 'json_schema', 'medium', 16000]);
  conf('o formato leva o ESQUEMA', a.formato.schema === P.ESQUEMA, true);
  conf('o system é ESTÁVEL entre pedidos diferentes (vai para o cache)', a.system === b.system, true);
  const variavel = ['2026-11-12', '12/11', 'al-sint-1', 'Zélia', 'segunda e quinta'];
  conf('nada do que muda por pedido está no system', variavel.filter(v => a.system.indexOf(v) >= 0), []);
  const textoA = a.messages[0].content[a.messages[0].content.length - 1].text;
  conf('a mensagem traz a data de hoje com o dia da semana', textoA.indexOf('quinta-feira, 12/11/2026 (2026-11-12)') >= 0, true);
  conf('a mensagem traz o id, o PRIMEIRO nome e os horários fixos', textoA.indexOf('- id al-sint-1: Zélia (aulas fixas: segunda e quinta às 17h)') >= 0, true);
  conf('o sobrenome nunca vai (dos dois alunos)', /Sobrenome|Sint[eé]tica|Ficticio/.test(textoA), false);
  conf('o controle: o primeiro nome do segundo aluno vai', textoA.indexOf('Bruno (aulas fixas: segunda, quarta e sexta às 15h30)') >= 0, true);
  conf('as imagens vêm antes do texto, em base64', a.messages[0].content.map(c => c.type), ['image', 'image', 'text']);
  conf('sem aluno fixo, a mensagem não diz que está escolhido', textoA.indexOf('já está escolhido') < 0, true);
  const textoB = b.messages[0].content[b.messages[0].content.length - 1].text;
  conf('com aluno fixo, a mensagem diz o id escolhido', textoB.indexOf('O aluno já está escolhido: id al-sint-2.') >= 0, true);
  // com o aluno fixo, só ele vai: o nome e os horários dos outros não saem do aparelho (dos dois lados)
  const fixo = P.montarPedido({ texto: 'x', imagens: [], alunos: ALUNOS, alunoFixoId: 'al-sint-2', hoje: '2026-11-12' }).messages[0].content[0].text;
  conf('aluno fixo: só ele na mensagem (o outro nome e o outro id não vão)', [fixo.indexOf('Bruno') >= 0, fixo.indexOf('Zélia') >= 0, fixo.indexOf('al-sint-1') >= 0], [true, false, false]);
  const livre = P.montarPedido({ texto: 'x', imagens: [], alunos: ALUNOS, alunoFixoId: null, hoje: '2026-11-12' }).messages[0].content[0].text;
  conf('sem aluno fixo (atalho): a lista inteira vai (controle)', [livre.indexOf('Bruno') >= 0, livre.indexOf('Zélia') >= 0], [true, true]);
  const doSalvo = P.pedidoDeAjusteDoSalvo(planoBase(), 'muda', { alunos: ALUNOS, hoje: '2026-11-12' }).messages[0].content[0].text;
  conf('ajuste do plano salvo: só o aluno do plano', [doSalvo.indexOf('Zélia') >= 0, doSalvo.indexOf('Bruno') >= 0, doSalvo.indexOf('al-sint-2') >= 0], [true, false, false]);
  const muitas = P.montarPedido({ texto: 'x', imagens: img(11), alunos: ALUNOS, hoje: '2026-11-12' });
  conf('mais de 8 prints: só os 8 primeiros vão', muitas.messages[0].content.filter(c => c.type === 'image').length, 8);
  const oito = P.montarPedido({ texto: 'x', imagens: img(8), alunos: ALUNOS, hoje: '2026-11-12' });
  conf('8 prints: os 8 vão (controle)', oito.messages[0].content.filter(c => c.type === 'image').length, 8);
  conf('o system não tem travessão', TRAVESSAO.test(a.system), false);
  let lancou = false; try { P.montarPedido({ texto: 'x', hoje: '2026-02-30' }); } catch (e) { lancou = true; }
  conf('hoje inválido não monta pedido', lancou, true);
})();

// ================================================================
secao('3. A leitura da resposta (dos dois lados)');
(function () {
  const bom = planoBase();
  const r = P.lerResposta(respostaDe(bom), IDS);
  conf('controle: o plano bom é lido, com o content inteiro para a conversa', [!!r.plano, r.conteudo && r.conteudo.length, r.erro], [true, 2, undefined]);
  const foraGrade = planoBase(); foraGrade.grade.push({ data: '2026-11-21', prova: null, estudo: [], deManha: false });
  conf('grade com data fora do período: recusa', P.lerResposta(respostaDe(foraGrade), IDS).erro, 'plano_invalido');
  const naBorda = planoBase(); naBorda.grade = naBorda.grade.filter(g => g.data !== '2026-11-20'); naBorda.grade.push({ data: '2026-11-20', prova: 'Science', estudo: [], deManha: false });
  conf('grade com data no último dia do período (a borda): aceita', !!P.lerResposta(respostaDe(naBorda), IDS).plano, true);
  const antes = planoBase(); antes.grade.unshift({ data: '2026-11-08', prova: null, estudo: [], deManha: false });
  conf('grade com data um dia antes do início: recusa', P.lerResposta(respostaDe(antes), IDS).erro, 'plano_invalido');
  const outroAluno = planoBase({ extra: { alunoId: 'al-que-nao-existe' } });
  conf('aluno fora da lista: recusa', P.lerResposta(respostaDe(outroAluno), IDS).erro, 'plano_invalido');
  conf('o mesmo aluno, quando está na lista: aceita', !!P.lerResposta(respostaDe(outroAluno), IDS.concat(['al-que-nao-existe'])).plano, true);
  conf('aluno null (ela escolhe na prévia): aceita', !!P.lerResposta(respostaDe(planoBase({ extra: { alunoId: null, confiancaAluno: 'baixa' } })), IDS).plano, true);
  const provaFora = planoBase({ provas: [{ data: '2026-11-25', disciplina: 'Geografia', conteudo: null, material: null, incerto: false }] });
  conf('prova fora do período: recusa', P.lerResposta(respostaDe(provaFora), IDS).erro, 'plano_invalido');
  const dataRuim = planoBase(); dataRuim.periodo.fim = '2026-02-30';
  conf('data que não existe (30/02): recusa', P.lerResposta(respostaDe(dataRuim), IDS).erro, 'plano_invalido');
  const aoContrario = planoBase(); aoContrario.periodo = { inicio: '2026-11-20', fim: '2026-11-09' };
  conf('período ao contrário: recusa', P.lerResposta(respostaDe(aoContrario), IDS).erro, 'plano_invalido');
  const repetida = planoBase(); repetida.grade.push(Object.assign({}, repetida.grade[0]));
  conf('data repetida na grade: recusa', P.lerResposta(respostaDe(repetida), IDS).erro, 'plano_invalido');
  const confirmarFora = planoBase({ extra: { aulaAConfirmar: ['2026-12-01'] } });
  conf('"Aula com a Nath?" fora do período: recusa', P.lerResposta(respostaDe(confirmarFora), IDS).erro, 'plano_invalido');
  conf('"Aula com a Nath?" dentro: aceita', !!P.lerResposta(respostaDe(planoBase({ extra: { aulaAConfirmar: ['2026-11-12'] } })), IDS).plano, true);
  conf('recusa do modelo vira "recusa"', P.lerResposta(respostaDe(bom, {}).resposta ? Object.assign(respostaDe(bom), { resposta: Object.assign(respostaDe(bom).resposta, { stop_reason: 'refusal' }) }) : null, IDS).erro, 'recusa');
  conf('saída cortada (max_tokens) vira "cortado"', P.lerResposta(Object.assign(respostaDe(bom), { resposta: Object.assign(respostaDe(bom).resposta, { stop_reason: 'max_tokens' }) }), IDS).erro, 'cortado');
  conf('erro do endpoint passa o código', P.lerResposta({ ok: false, codigo: 'sem_permissao' }, IDS).erro, 'sem_permissao');
  const quebrado = planoBase(); quebrado.provas = null;
  let lancou = false, motivo = null; try { motivo = P.conferirPlano(quebrado, IDS); } catch (e) { lancou = true; }
  conf('plano com provas null: a conferência recusa com motivo, sem quebrar', [lancou, motivo], [false, 'provas ausentes']);
  conf('JSON quebrado vira "sem_plano"', P.lerResposta({ ok: true, resposta: { stop_reason: 'end_turn', content: [{ type: 'text', text: '{"alunoId":' }] } }, IDS).erro, 'sem_plano');
  conf('as frases de tela dos códigos do brief', [P.fraseDoErro('limite_mensal'), P.fraseDoErro('sem_permissao'), P.fraseDoErro('sem_internet')],
    ['A IA está pausada até o dia 1.', 'A IA ainda não está liberada nesta conta.', 'Precisa de internet para montar o planejamento.']);
  conf('o tempo esgotado tem frase própria, que não é "a conexão caiu"', [P.fraseDoErro('prazo'), P.fraseDoErro('prazo') === P.fraseDoErro('rede')],
    ['A IA demorou demais para responder. Tente de novo.', false]);
  const inc = P.itensIncertos(planoBase({ extra: { observacoes: ['Confira o dia ' + String.fromCharCode(0x2013) + ' 14.'] } }));
  conf('o resumo de conferir: UM aviso por prova, em ordem de data, o mais acionável; depois as observações (com verbo e alvo, sem travessão)',
    inc.map(i => i.texto), ['Nenhum dia de estudo de Cambridge antes da prova de 12/11.', 'Confira no aviso a prova de 14/11 (História).',
      'O conteúdo da prova de 20/11 (Science) não veio no aviso. Se tiver, diga no Ajustar.', 'Confira o dia: 14.']);
  conf('a prova de 12/11 tinha dois avisos (estudo e conteúdo): ficou o de estudo, um só', inc.filter(i => i.data === '2026-11-12').length, 1);
  conf('com a data para o toque, e sem data na observação', [inc[1].data, inc[3].data], ['2026-11-14', null]);
  conf('sem o Ajustar à mão, a frase não manda dizer no Ajustar (o outro lado)',
    P.itensIncertos(planoBase(), { semAjuste: true }).map(i => i.texto).filter(t => /Ajustar/.test(t)), []);
})();

// ================================================================
secao('3b. A conferência do app: estudo antes da prova e conteúdo que faltou (dos dois lados)');
(function () {
  const g = (data, estudo) => ({ data, prova: null, estudo, deManha: false });
  const plano = (grade, provas) => ({ grade, provas });
  const prova = (data, disciplina, conteudo) => ({ data, disciplina, conteudo: conteudo === undefined ? 'Cap. 1.' : conteudo, material: null, incerto: false });
  const so = (lista, tipo) => lista.filter(i => i.tipo === tipo).map(i => i.texto);
  conf('com um dia de estudo da matéria antes da prova: nenhum aviso',
    so(P.conferenciasDoPlano(plano([g('2026-11-10', ['História (2h)']), g('2026-11-12', [])], [prova('2026-11-12', 'História')])), 'estudo'), []);
  conf('sem nenhum dia de estudo dela antes: o aviso, com a matéria e a data',
    so(P.conferenciasDoPlano(plano([g('2026-11-10', ['Geografia']), g('2026-11-12', [])], [prova('2026-11-12', 'História')])), 'estudo'),
    ['Nenhum dia de estudo de História antes da prova de 12/11.']);
  conf('estudar a matéria só no DIA da prova não conta como antes (mas é aviso, não erro: o plano é lido)',
    so(P.conferenciasDoPlano(plano([g('2026-11-12', ['História'])], [prova('2026-11-12', 'História')])), 'estudo').length, 1);
  conf('os nomes que a escola usa nas duas línguas contam como a mesma matéria (Math e Matemática; Língua portuguesa e Português)',
    so(P.conferenciasDoPlano(plano([g('2026-11-10', ['Math (30min)', 'Português'])], [prova('2026-11-12', 'Matemática'), prova('2026-11-13', 'Língua portuguesa')])), 'estudo'), []);
  conf('"Prova de Writing" no rótulo e "Writing (+ ELA)" no estudo: a mesma matéria',
    so(P.conferenciasDoPlano(plano([g('2026-11-10', ['Writing (+ ELA)'])], [prova('2026-11-12', 'Writing')])), 'estudo'), []);
  conf('prova sem conteúdo: o aviso para dizer no Ajustar; com conteúdo, nenhum',
    [so(P.conferenciasDoPlano(plano([], [prova('2026-11-27', 'ELA', null)])), 'conteudo'), so(P.conferenciasDoPlano(plano([], [prova('2026-11-27', 'ELA')])), 'conteudo')],
    [['O conteúdo da prova de 27/11 (ELA) não veio no aviso. Se tiver, diga no Ajustar.'], []]);
  const comAviso = planoBase();
  conf('a conferência entra no resumo de conferir, e a folha não muda (o texto do aviso não está no PDF)',
    [P.itensIncertos(comAviso).some(i => i.tipo === 'estudo'), textoDoPdf(P.desenharFolha(comAviso, { nome: 'Ana' }, G).bytes).join(' ').indexOf('Nenhum dia de estudo') < 0], [true, true]);
  conf('o resumo de um ajuste diz a matéria e a ação; sem mudança, "O plano ficou igual."', [
    P.resumoDaMudanca(planoBase(), (() => { const x = planoBase(); x.grade[2].estudo = ['Matemática', 'Geografia']; return x; })()),
    P.resumoDaMudanca(planoBase(), (() => { const x = planoBase(); x.grade[2].estudo = []; return x; })()),
    P.resumoDaMudanca(planoBase(), planoBase())],
    ['Mudou: entrou Geografia no dia 11/11.', 'Mudou: saiu Matemática do dia 11/11.', 'O plano ficou igual.']);
})();

// ================================================================
secao('4. O ajuste mantém a conversa byte a byte');
(function () {
  const pedido = P.montarPedido({ texto: 'provas', imagens: [{ media_type: 'image/jpeg', data: 'QUJD' }], alunos: ALUNOS, hoje: '2026-11-12' });
  const conteudo = respostaDe(planoBase()).resposta.content;
  const antes = JSON.stringify(conteudo), msgsAntes = JSON.stringify(pedido.messages);
  const aj = P.pedidoDeAjuste({ pedido, conteudo }, 'põe Geografia no dia 21');
  conf('as mensagens anteriores vão iguais, na mesma ordem', JSON.stringify(aj.messages.slice(0, pedido.messages.length)), msgsAntes);
  conf('o content do assistente vai INTACTO (byte a byte, com o thinking)', JSON.stringify(aj.messages[pedido.messages.length].content), antes);
  conf('e é o mesmo objeto, não uma cópia reescrita', aj.messages[pedido.messages.length].content === conteudo, true);
  conf('o turno novo é o último, do usuário, com o pedido dela', [aj.messages.length, aj.messages[aj.messages.length - 1].role,
    aj.messages[aj.messages.length - 1].content[0].text.indexOf('põe Geografia no dia 21') >= 0], [3, 'user', true]);
  conf('system, formato, rota e esforço iguais (o cache pega)', [aj.system === pedido.system, aj.formato === pedido.formato, aj.rota, aj.esforco], [true, true, 'planejamento', 'medium']);
  conf('o pedido de antes não foi mexido', JSON.stringify(pedido.messages), msgsAntes);
  const aj2 = P.pedidoDeAjuste({ pedido: aj, conteudo }, 'tira o dia 20');
  conf('segundo ajuste: 5 mensagens, alternando', aj2.messages.map(m => m.role), ['user', 'assistant', 'user', 'assistant', 'user']);
  const salvo = P.pedidoDeAjusteDoSalvo(planoBase(), 'muda', { alunos: ALUNOS, hoje: '2026-11-12' });
  conf('ajuste de plano salvo: uma mensagem com o plano atual e o pedido', [salvo.messages.length, salvo.messages[0].content[0].text.indexOf('"periodo"') >= 0,
    salvo.messages[0].content[0].text.indexOf('Ajuste pedido pela professora: muda') >= 0], [1, true, true]);
})();

// ================================================================
secao('5. A folha');
const AGENDA = [{ data: '2026-11-10', hora: '11:00' }, { data: '2026-11-12', hora: '15:30' }, { data: '2026-11-25', hora: '11:00' }];
(function () {
  const r = P.desenharFolha(planoBase(), { nome: 'Ana Sintética', aulas: AGENDA }, G);
  conf('a folha sai, sem erro', !!r.bytes && !r.erro, true);
  const t = textoDoPdf(r.bytes);
  conf('uma página só', paginasDoPdf(r.bytes), 1);
  conf('título e período', [t.indexOf('Planejamento de estudos: provas de novembro') >= 0, t.indexOf('DE 9 A 20 DE NOVEMBRO') >= 0], [true, true]);
  conf('"Aluna: Ana" (o primeiro nome, com o tratamento)', t.indexOf('Aluna: Ana') >= 0, true);
  conf('cabeçalho de segunda a domingo', ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map(d => t.indexOf(Buffer.from(d, 'latin1').toString('latin1')) >= 0 || t.indexOf(d) >= 0), [true, true, true, true, true, true, true]);
  conf('"Prova Cambridge", sem o "de"', [t.join(' ').indexOf('Prova Cambridge') >= 0, t.join(' ').indexOf('Prova de Cambridge') >= 0], [true, false]);
  conf('as outras provas com o "de"', [t.indexOf('Prova de História') >= 0 || t.join(' ').indexOf('Prova de História') >= 0, t.join(' ').indexOf('Prova de Science') >= 0], [true, true]);
  const junto = t.join('\n');
  conf('"2h", "30min" e "1h30" colados (vieram do modelo com espaço)', [junto.indexOf('História (2h)') >= 0, junto.indexOf('Math (30min)') >= 0, junto.indexOf('Science (1h30)') >= 0], [true, true, true]);
  conf('nenhum "2 h" nem "30 min" com espaço', /\d\s+(h|min)\b/.test(junto), false);
  conf('nenhum travessão no texto extraído (o conteúdo veio com um)', TRAVESSAO_WINANSI.test(junto) || TRAVESSAO.test(junto), false);
  conf('o conteúdo sem travessão fica com dois-pontos', junto.indexOf('Cap. 3 (Rios): cap. 4 (Cidades).') >= 0, true);
  conf('"Aula com a Nath" só nas datas da agenda DENTRO do período (2 de 3)', contar(t, 'Aula com a Nath'), 2);
  conf('com o horário colado', [t.indexOf('às 11h') >= 0, t.indexOf('às 15h30') >= 0], [true, true]);
  conf('"Conteúdo ainda não enviado pela escola." nas duas provas sem conteúdo', contar(t, P.SEM_CONTEUDO), 2);
  conf('o "estudar:" aparece', t.indexOf('estudar:') >= 0, true);
  conf('o quadro "Datas e conteúdo das provas"', t.indexOf('Datas e conteúdo das provas') >= 0, true);
  conf('o incerto NUNCA vai para a folha', /incert|confira/i.test(junto), false);

  const semAgenda = textoDoPdf(P.desenharFolha(planoBase(), { nome: 'Ana', aulas: [] }, G).bytes);
  conf('agenda vazia: nenhuma "Aula com a Nath" (a aula nunca vem do modelo)', semAgenda.filter(x => /Aula com a Nath/.test(x)).length, 0);
  const conf2 = textoDoPdf(P.desenharFolha(planoBase({ extra: { aulaAConfirmar: ['2026-11-13', '2026-11-12'] } }), { nome: 'Ana', aulas: AGENDA }, G).bytes);
  conf('"Aula com a Nath?" sem horário, só no dia sem aula na agenda', [contar(conf2, 'Aula com a Nath?'), contar(conf2, 'Aula com a Nath')], [1, 2]);
  const todas = planoBase(); todas.provas.forEach(p => { p.conteudo = 'Conteúdo do aviso.'; });
  conf('com todo conteúdo no aviso, nenhum "não enviado"', contar(textoDoPdf(P.desenharFolha(todas, { nome: 'Ana', aulas: [] }, G).bytes), P.SEM_CONTEUDO), 0);
  const menino = textoDoPdf(P.desenharFolha(planoBase({ extra: { tratamento: 'Aluno' } }), { nome: 'Bruno Teste', aulas: [] }, G).bytes);
  conf('"Aluno: Bruno"', menino.indexOf('Aluno: Bruno') >= 0, true);
  const manha = planoBase(); manha.grade.find(g => g.data === '2026-11-14').deManha = true;
  conf('"estudar de manhã:" no dia de prova com revisão de manhã', textoDoPdf(P.desenharFolha(manha, { nome: 'Ana' }, G).bytes).indexOf('estudar de manhã:') >= 0, true);
})();

// ================================================================
secao('6. O período que atravessa o mês e o ano');
(function () {
  const p = planoBase({ inicio: '2026-11-24', fim: '2026-12-08', provas: [
    { data: '2026-11-27', disciplina: 'Cambridge', conteudo: null, material: null, incerto: false },
    { data: '2026-12-08', disciplina: 'Geografia', conteudo: 'Relevo.', material: null, incerto: false }] });
  const r = P.desenharFolha(p, { nome: 'Ana', aulas: [{ data: '2026-12-01', hora: '11:00' }] }, G);
  const t = textoDoPdf(r.bytes);
  conf('sai numa página', [!!r.bytes, paginasDoPdf(r.bytes)], [true, 1]);
  conf('título com os dois meses e o período por extenso', [t.indexOf('Planejamento de estudos: provas de novembro e dezembro') >= 0, t.indexOf('DE 24 DE NOVEMBRO A 8 DE DEZEMBRO') >= 0], [true, true]);
  conf('a grade vai da segunda 23/11 ao domingo 13/12: três semanas', P.semanasDoPeriodo('2026-11-24', '2026-12-08').map(s => s[0] + '..' + s[6]),
    ['2026-11-23..2026-11-29', '2026-11-30..2026-12-06', '2026-12-07..2026-12-13']);
  conf('o dia 1 diz o mês', t.indexOf('dez') >= 0, true);
  conf('a aula de 01/12 entra (a agenda atravessa o mês junto)', contar(t, 'Aula com a Nath'), 1);
  conf('o nome do arquivo', P.nomeDoArquivo(p, 'Ana Sintética'), 'Planejamento de Estudos Ana - Provas de Novembro e Dezembro.pdf');
  const ano = planoBase({ inicio: '2026-12-28', fim: '2027-01-08', provas: [{ data: '2027-01-08', disciplina: 'Math', conteudo: null, material: null, incerto: false }] });
  conf('atravessando o ano, o ano aparece', P.subtitulo(ano), 'DE 28 DE DEZEMBRO DE 2026 A 8 DE JANEIRO DE 2027');
  conf('período que começa no domingo: uma semana a mais em cima', P.semanasDoPeriodo('2026-11-15', '2026-11-16').length, 2);
})();

// ================================================================
secao('7. Uma página só, ou recusa com motivo (dos dois lados)');
(function () {
  const longo = 'Conteúdo longo do aviso com muitas palavras para encher a linha do quadro. ';
  const cabe = planoBase(); cabe.provas.forEach(p => { p.conteudo = longo.repeat(2); });
  const rc = P.desenharFolha(cabe, { nome: 'Ana' }, G);
  conf('conteúdo médio: cabe, uma página', [!!rc.bytes, rc.bytes ? paginasDoPdf(rc.bytes) : 0], [true, 1]);
  const naoCabe = planoBase(); naoCabe.provas.forEach(p => { p.conteudo = longo.repeat(40); });
  const rn = P.desenharFolha(naoCabe, { nome: 'Ana' }, G);
  conf('conteúdo enorme: recusa com motivo, sem PDF cortado', [!!rn.bytes, /não cabe numa folha só/.test(rn.erro || '')], [false, true]);
  const seis = planoBase({ inicio: '2026-11-02', fim: '2026-12-13' });
  const r6 = P.desenharFolha(seis, { nome: 'Ana' }, G);
  conf('seis semanas inteiras: ainda cabem numa página', [!!r6.bytes, r6.bytes ? paginasDoPdf(r6.bytes) : 0], [true, 1]);
  const longoDemais = planoBase({ inicio: '2026-11-02', fim: '2026-12-14' });
  conf('período acima de 42 dias: recusado na leitura', P.lerResposta(respostaDe(longoDemais), IDS).erro, 'plano_invalido');
})();

// ================================================================
secao('8. O fuso de São Paulo e as horas');
(function () {
  conf('às 23h30 de 12/11 em São Paulo (02h30 UTC de 13/11), hoje é 12/11', P.hojeEmSaoPaulo(new Date('2026-11-13T02:30:00Z')), '2026-11-12');
  conf('às 00h30 de 13/11 em São Paulo (03h30 UTC), hoje é 13/11', P.hojeEmSaoPaulo(new Date('2026-11-13T03:30:00Z')), '2026-11-13');
  conf('horas coladas', ['15:30', '11:00', '09:05', ''].map(P.horaCurta), ['15h30', '11h', '9h05', '']);
  conf('"Prova de" sem duplicar quando o modelo já escreveu "Prova de"', [P.rotuloDaProva('Prova de História'), P.rotuloDaProva('Cambridge Movers'), P.rotuloDaProva('Math')],
    ['Prova de História', 'Prova Cambridge Movers', 'Prova de Math']);
})();

// ================================================================
secao('9. Aulas tiradas e postas na folha (aulasRemovidas, aulasExtras), dos dois lados');
(function () {
  // a agenda sintética do período 09/11 a 20/11: 10/11 11h, 12/11 15h30, 18/11 10h
  const AG = [{ data: '2026-11-10', hora: '11:00' }, { data: '2026-11-12', hora: '15:30' }, { data: '2026-11-18', hora: '10:00' }];
  const nAulas = (plano) => contar(textoDoPdf(P.desenharFolha(plano, { nome: 'Ana', aulas: AG }, G).bytes), 'Aula com a Nath');

  // remover
  const sem18 = planoBase({ extra: { aulasRemovidas: ['2026-11-18'] } });
  conf('controle: sem exceção, as 3 aulas da agenda estão na lista e na folha', [Object.keys(P.aulasNaFolha(planoBase(), AG).aulas), nAulas(planoBase())],
    [['2026-11-10', '2026-11-12', '2026-11-18'], 3]);
  conf('aulasRemovidas 18/11: sai da LISTA da folha', Object.keys(P.aulasNaFolha(sem18, AG).aulas), ['2026-11-10', '2026-11-12']);
  conf('aulasRemovidas 18/11: sai da FOLHA (2 de 3), e o "às 10h" some com ela', [nAulas(sem18),
    textoDoPdf(P.desenharFolha(sem18, { nome: 'Ana', aulas: AG }, G).bytes).indexOf('às 10h') >= 0], [2, false]);
  conf('a agenda que chega não é mexida (a exceção é só da folha)', AG.length === 3 && AG[2].data === '2026-11-18', true);

  // acrescentar
  const com21 = planoBase({ inicio: '2026-11-09', fim: '2026-11-22', extra: { aulasExtras: [{ data: '2026-11-21', hora: '10:00' }, { data: '2026-11-13', hora: null }] } });
  const t21 = textoDoPdf(P.desenharFolha(com21, { nome: 'Ana', aulas: AG }, G).bytes);
  conf('aulasExtras: põe a aula na lista (com a hora, e sem hora)', P.aulasNaFolha(com21, AG).aulas, { '2026-11-10': '11:00', '2026-11-12': '15:30', '2026-11-18': '10:00', '2026-11-21': '10:00', '2026-11-13': '' });
  conf('aulasExtras: "Aula com a Nath" na folha (3 da agenda + 2 extras), com "às 10h"', [contar(t21, 'Aula com a Nath'), contar(t21, 'às 10h')], [5, 2]);
  conf('controle: sem a extra, a folha fica com as 3 da agenda', nAulas(planoBase({ inicio: '2026-11-09', fim: '2026-11-22' })), 3);
  const troca = planoBase({ extra: { aulasRemovidas: ['2026-11-18'], aulasExtras: [{ data: '2026-11-18', hora: '16:00' }] } });
  conf('troca de horário (tirou a da agenda e pôs outra no mesmo dia): uma aula só, na hora nova', [nAulas(troca), P.aulasNaFolha(troca, AG).aulas['2026-11-18']], [3, '16:00']);
  const extraEConfirmar = planoBase({ extra: { aulaAConfirmar: ['2026-11-13'], aulasExtras: [{ data: '2026-11-13', hora: null }] } });
  conf('extra e "Aula com a Nath?" no mesmo dia, sem arrumar: a folha mostra a aula, sem o "?"', P.aulasNaFolha(extraEConfirmar, AG).aConfirmar, {});

  // o plano salvo ANTES desta mudança: sem os dois campos, como está em ajustes['planejamento:<id>']
  const antigo = planoBase(); delete antigo.aulasRemovidas; delete antigo.aulasExtras;
  const registro = { id: 'planejamento:pl-sint-1', alunoId: 'al-sint-1', plano: antigo, criadoEm: '2026-11-12T10:00:00.000Z', atualizadoEm: '2026-11-12T10:00:00.000Z' };
  const copia = JSON.parse(JSON.stringify(registro.plano)); // o que o abrirPlanejamento faz
  conf('plano antigo: o formato do registro gravado não tem os campos (o veneno é real)', ['aulasRemovidas' in copia, 'aulasExtras' in copia], [false, false]);
  conf('plano antigo: passa na conferência (abre na ficha)', P.conferirPlano(copia, ['al-sint-1']), null);
  const fa = P.desenharFolha(copia, { nome: 'Ana', aulas: AG }, G);
  conf('plano antigo: desenha, com as 3 aulas da agenda', [!!fa.bytes, fa.erro, contar(textoDoPdf(fa.bytes), 'Aula com a Nath')], [true, undefined, 3]);
  const ajAntigo = P.pedidoDeAjusteDoSalvo(copia, 'tira a aula do dia 18', { alunos: ALUNOS, hoje: '2026-11-12',
    aulasDaAgenda: { de: '2026-11-09', ate: '2026-12-20', aulas: AG } });
  const txAntigo = ajAntigo.messages[0].content[0].text;
  conf('plano antigo: o ajuste monta o pedido, com as listas vazias no plano e as aulas da agenda', [txAntigo.indexOf('"aulasRemovidas":[]') >= 0, txAntigo.indexOf('"aulasExtras":[]') >= 0,
    txAntigo.indexOf('- 2026-11-18 (quarta, 18/11) às 10h') >= 0, txAntigo.indexOf('Ajuste pedido pela professora: tira a aula do dia 18') >= 0], [true, true, true, true]);
  conf('plano antigo: o pedido não mexeu no plano guardado', 'aulasRemovidas' in copia, false);
  const novoDoAntigo = planoBase({ extra: { aulasRemovidas: ['2026-11-18'] } });
  const lidoDoAntigo = P.lerResposta(respostaDe(novoDoAntigo), IDS, copia);
  conf('plano antigo: a resposta do ajuste é lida, e o resumo diz a aula que saiu', [!!lidoDoAntigo.plano, P.resumoDaMudanca(copia, lidoDoAntigo.plano)],
    [true, 'Mudou: saiu a aula com a Nath do dia 18/11.']);
  conf('plano antigo e o mesmo plano com as listas vazias: "O plano ficou igual."', P.resumoDaMudanca(copia, planoBase()), 'O plano ficou igual.');
  const lidoAntigo = P.lerResposta(respostaDe(copia), IDS);
  conf('a resposta sem os campos (modelo antigo) é lida, e ganha as duas listas vazias', [!!lidoAntigo.plano, lidoAntigo.plano && lidoAntigo.plano.aulasRemovidas, lidoAntigo.plano && lidoAntigo.plano.aulasExtras], [true, [], []]);

  // data inválida e fora do período: ignoradas (o plano vale); formato errado: recusado
  const ruins = planoBase({ extra: { aulasRemovidas: ['2026-02-30', '2026-12-01', 'amanhã', '2026-11-18', '2026-11-18'],
    aulasExtras: [{ data: '2026-11-31', hora: '10:00' }, { data: '2026-11-30', hora: '10:00' }, { data: '2026-11-19', hora: '10h' }, { data: '2026-11-16', hora: 'de manhã' }] } });
  const lr = P.lerResposta(respostaDe(ruins), IDS);
  conf('datas inválidas (30/02, 31/11, "amanhã") e fora do período: o plano é lido', !!lr.plano, true);
  conf('e elas saem das listas; a repetida fica uma vez; "10h" vira "10:00"; hora que não se lê vira null', [lr.plano.aulasRemovidas, lr.plano.aulasExtras],
    [['2026-11-18'], [{ data: '2026-11-16', hora: null }, { data: '2026-11-19', hora: '10:00' }]]);
  const foraNaFolha = planoBase({ extra: { aulasExtras: [{ data: '2026-11-30', hora: '10:00' }, { data: '2026-02-30', hora: null }] } });
  conf('na folha, sem arrumar: a extra fora do período ou com data que não existe não entra (3, as da agenda)', nAulas(foraNaFolha), 3);
  conf('controle: a mesma extra DENTRO do período entra (4)', nAulas(planoBase({ extra: { aulasExtras: [{ data: '2026-11-19', hora: '10:00' }] } })), 4);
  conf('aulasRemovidas que não é lista: recusa', P.lerResposta(respostaDe(planoBase({ extra: { aulasRemovidas: '2026-11-18' } })), IDS).erro, 'plano_invalido');
  conf('aulasRemovidas com item que não é texto: recusa', P.lerResposta(respostaDe(planoBase({ extra: { aulasRemovidas: [18] } })), IDS).erro, 'plano_invalido');
  conf('aulasExtras com hora que não é texto: recusa', P.lerResposta(respostaDe(planoBase({ extra: { aulasExtras: [{ data: '2026-11-19', hora: 10 }] } })), IDS).erro, 'plano_invalido');
  conf('aulasExtras com item que não é objeto: recusa', P.lerResposta(respostaDe(planoBase({ extra: { aulasExtras: ['2026-11-19'] } })), IDS).erro, 'plano_invalido');
  conf('controle: aulasExtras boa, com hora null: aceita', !!P.lerResposta(respostaDe(planoBase({ extra: { aulasExtras: [{ data: '2026-11-19', hora: null }] } })), IDS).plano, true);
  conf('as horas', ['10:00', '9:05', '10h', '10h30', '24:00', '10:60', '', null, 'manhã'].map(P.horaValida), ['10:00', '09:05', '10:00', '10:30', null, null, null, null, null]);

  // a coerência com aulaAConfirmar: vale o pedido mais recente
  const comConfirmar = planoBase({ extra: { aulaAConfirmar: ['2026-11-18'] } });
  const pediuTirar = planoBase({ extra: { aulaAConfirmar: ['2026-11-18'], aulasRemovidas: ['2026-11-18'] } });
  const n1 = P.normalizarAulas(pediuTirar, comConfirmar);
  conf('antes "Aula com a Nath?" no 18, agora pediu tirar (as duas vieram): vale a remoção', [n1.aulasRemovidas, n1.aulaAConfirmar], [['2026-11-18'], []]);
  const tirada = planoBase({ extra: { aulasRemovidas: ['2026-11-18'] } });
  const n2 = P.normalizarAulas(pediuTirar, tirada);
  conf('antes tirada no 18, agora pediu "Aula com a Nath?" (as duas vieram): vale o "?"', [n2.aulasRemovidas, n2.aulaAConfirmar], [[], ['2026-11-18']]);
  const n3 = P.normalizarAulas(pediuTirar, null);
  conf('sem plano de antes (as duas novas): vence a remoção, e nunca ficam as duas', [n3.aulasRemovidas, n3.aulaAConfirmar], [['2026-11-18'], []]);
  conf('pela leitura da resposta, com o plano de antes: o mesmo', P.lerResposta(respostaDe(pediuTirar), IDS, tirada).plano.aulaAConfirmar, ['2026-11-18']);
  const extraVelha = planoBase({ extra: { aulasExtras: [{ data: '2026-11-19', hora: '10:00' }] } });
  const tirouExtra = planoBase({ extra: { aulasExtras: [{ data: '2026-11-19', hora: '10:00' }], aulasRemovidas: ['2026-11-19'] } });
  conf('a extra era a velha e agora veio a remoção do mesmo dia: a extra sai (e a folha tira a aula)', [P.normalizarAulas(tirouExtra, extraVelha).aulasExtras, nAulas(P.normalizarAulas(tirouExtra, extraVelha))], [[], 3]);
  conf('controle: remoção e extra novas no mesmo dia (troca de horário): ficam as duas', P.normalizarAulas(troca, planoBase()).aulasExtras, [{ data: '2026-11-18', hora: '16:00' }]);
  conf('normalizar não muda o plano recebido', [pediuTirar.aulaAConfirmar, pediuTirar.aulasRemovidas], [['2026-11-18'], ['2026-11-18']]);

  // o resumo da mudança
  conf('resumo: saiu a aula', P.resumoDaMudanca(planoBase(), sem18), 'Mudou: saiu a aula com a Nath do dia 18/11.');
  conf('resumo: entrou a aula, com a hora', P.resumoDaMudanca(planoBase(), planoBase({ extra: { aulasExtras: [{ data: '2026-11-19', hora: '10:00' }] } })),
    'Mudou: entrou a aula com a Nath no dia 19/11 às 10h.');
  conf('resumo: voltou a aula tirada', P.resumoDaMudanca(sem18, planoBase()), 'Mudou: voltou a aula com a Nath do dia 18/11.');
  conf('resumo: a extra mudou de hora', P.resumoDaMudanca(extraVelha, planoBase({ extra: { aulasExtras: [{ data: '2026-11-19', hora: '11:30' }] } })),
    'Mudou: a aula com a Nath do dia 19/11 agora é às 11h30.');
  conf('resumo: aula e matéria juntas, em ordem de dia', P.resumoDaMudanca(planoBase(), (() => { const x = planoBase({ extra: { aulasRemovidas: ['2026-11-18'] } }); x.grade[2].estudo = ['Matemática', 'Geografia']; return x; })()),
    'Mudou: entrou Geografia no dia 11/11 e saiu a aula com a Nath do dia 18/11.');
  conf('resumo: a extra que sai pela remoção é dita uma vez só', P.resumoDaMudanca(extraVelha, P.normalizarAulas(tirouExtra, extraVelha)), 'Mudou: saiu a aula com a Nath do dia 19/11.');
})();

// ================================================================
secao('10. O pedido: as aulas da agenda e a revisão');
(function () {
  const AG = [{ data: '2026-11-18', hora: '10:00' }, { data: '2026-11-12', hora: '15:30' }, { data: '2026-11-12', hora: '15:30' }, { data: '2027-01-30', hora: '10:00' }];
  const agenda = { de: '2026-11-12', ate: '2026-12-23', aulas: AG };
  const fixo = P.montarPedido({ texto: 'x', imagens: [], alunos: ALUNOS, alunoFixoId: 'al-sint-1', hoje: '2026-11-12', aulasDaAgenda: agenda });
  const tf = fixo.messages[0].content[0].text;
  conf('com o aluno fixo, as aulas da agenda vão no turno do usuário, em ordem, sem repetir e só as da janela', [
    tf.indexOf('Aulas com a Nath na agenda, de 12/11 a 23/12'), tf.indexOf('- 2026-11-12 (quinta, 12/11) às 15h30') < tf.indexOf('- 2026-11-18 (quarta, 18/11) às 10h'),
    tf.split('2026-11-12 (quinta').length - 1, tf.indexOf('2027-01-30') >= 0].map((v, i) => i === 0 ? v >= 0 : v), [true, true, 1, false]);
  const livre = P.montarPedido({ texto: 'x', imagens: [], alunos: ALUNOS, alunoFixoId: null, hoje: '2026-11-12', aulasDaAgenda: agenda });
  conf('sem aluno fixo (atalho), as aulas não vão (a agenda dos outros não sai do aparelho)', livre.messages[0].content[0].text.indexOf('Aulas com a Nath na agenda') >= 0, false);
  const vazia = P.montarPedido({ texto: 'x', imagens: [], alunos: ALUNOS, alunoFixoId: 'al-sint-1', hoje: '2026-11-12', aulasDaAgenda: { de: '2026-11-12', ate: '2026-12-23', aulas: [] } });
  conf('agenda vazia: diz que não há aula', vazia.messages[0].content[0].text.indexOf('(nenhuma aula na agenda nesses dias)') >= 0, true);
  conf('o system continua igual com ou sem as aulas (o cache pega)', fixo.system === livre.system && fixo.system === P.SISTEMA, true);
  conf('nada das aulas no system', ['18/11', '15h30', '2026-11-18'].filter(v => fixo.system.indexOf(v) >= 0), []);
  const conteudo = respostaDe(planoBase()).resposta.content;
  const aj = P.pedidoDeAjuste({ pedido: fixo, conteudo }, 'tira a aula com a Nath do dia 18', agenda);
  const ta = aj.messages[aj.messages.length - 1].content[0].text;
  conf('no ajuste, as aulas vão no turno novo, antes do pedido dela', [ta.indexOf('- 2026-11-18 (quarta, 18/11) às 10h') >= 0, ta.indexOf('Aulas com a Nath') < ta.indexOf('Ajuste pedido')], [true, true]);
  conf('controle: sem a agenda, o turno do ajuste fica como era', P.pedidoDeAjuste({ pedido: fixo, conteudo }, 'x').messages[2].content[0].text.indexOf('Aulas com a Nath') >= 0, false);
  conf('o system ensina as listas de aula e a revisão', ['"aulasRemovidas"', '"aulasExtras"', 'não a agenda', 'Revisão de Matemática (30min)', 'segunda 2h, terça 1h30'].map(v => P.SISTEMA.indexOf(v) >= 0),
    [true, true, true, true, true]);
  conf('o system não manda mais dizer que a aula se tira na agenda', /se tira na agenda/.test(P.SISTEMA), false);
  conf('o system sem travessão', TRAVESSAO.test(P.SISTEMA), false);
  // a revisão conta como estudo da matéria (a conferência do app não acusa falta de estudo)
  const g = (data, estudo) => ({ data, prova: null, estudo, deManha: false });
  const so = l => l.filter(i => i.tipo === 'estudo').map(i => i.texto);
  conf('"Revisão de História (30min)" antes da prova conta como estudo de História', so(P.conferenciasDoPlano({ grade: [g('2026-11-11', ['Revisão de História (30min)'])],
    provas: [{ data: '2026-11-12', disciplina: 'História', conteudo: 'x', material: null, incerto: false }] })), []);
  conf('controle: "Revisão de Geografia" não conta como História', so(P.conferenciasDoPlano({ grade: [g('2026-11-11', ['Revisão de Geografia (30min)'])],
    provas: [{ data: '2026-11-12', disciplina: 'História', conteudo: 'x', material: null, incerto: false }] })).length, 1);
  const rev = planoBase(); rev.grade.find(x => x.data === '2026-11-14').estudo = ['Revisão de História (30min)', 'Math (30min)'];
  conf('"Revisão de História (30min)" sai na folha como está (quebrada em duas linhas na coluna)', textoDoPdf(P.desenharFolha(rev, { nome: 'Ana' }, G).bytes).join(' ').replace(/\s+/g, ' ').indexOf('Revisão de História (30min)') >= 0, true);
})();

console.log('\n' + passes + ' verificacoes passaram, ' + falhas + ' falharam');
process.exit(falhas ? 1 : 0);
