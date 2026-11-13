/* testa_escopo_pago.js
 *
 * F7 (#159), decisão do dono (13/11/2026): a aula PASSADA de um mês JÁ PAGO
 * fica de fora do "todas", do "desta em diante" e do "excluir" da repetição,
 * mesmo sem texto (Core.escopoDaRepeticao). "Passada" é a regra do
 * Fechamento (a de hoje conta como dada) e "paga" é o selo "pago" do
 * Fechamento (seloDoPagamento).
 *
 * Os lados:
 *   - a passada e paga, sem texto, não muda nem some;
 *   - a passada NÃO paga (nem paga a menos), sem texto, muda e some como antes;
 *   - a futura, mesmo num mês pago, muda e some como antes;
 *   - a contagem do que ficou de fora, por motivo, que a tela usa no aviso.
 * Sem navegador. Dados fictícios.
 *
 * Venenos, cada um tem de cair só do seu lado:
 *   --envenenado-sem-regra-da-paga     a paga volta a entrar no lote;
 *   --envenenado-protege-toda-passada  toda passada fica de fora, paga ou não;
 *   --envenenado-protege-futura        a futura de mês pago também fica de fora.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const VENENOS = {
  '--envenenado-sem-regra-da-paga': ['      if (passadaEPaga(a)) { saida.pagas.push(a); return; }', ''],
  '--envenenado-protege-toda-passada': ["        mesPago[chave] = !!f && seloDoPagamento(db, f).selo === 'pago';", '        mesPago[chave] = true;'],
  '--envenenado-protege-futura': ['      if (!a.data || a.data > hoje) return false;', '      if (!a.data) return false;']
};
const pedidos = process.argv.slice(2);
const desconhecidos = pedidos.filter(a => !VENENOS[a]);
if (desconhecidos.length) throw new Error('argumento desconhecido: ' + desconhecidos.join(' '));
const VENENO = pedidos.find(a => VENENOS[a]) || null;

let caminhoCore = path.join(__dirname, '..', 'core.js');
let tmp = null;
if (VENENO) {
  const fonte = fs.readFileSync(caminhoCore, 'utf8');
  const [de, para] = VENENOS[VENENO];
  if (fonte.split(de).length !== 2) throw new Error('o veneno ' + VENENO + ' não achou (uma vez só) o trecho no core.js');
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'escopo_pago_'));
  caminhoCore = path.join(tmp, 'core.js');
  fs.writeFileSync(caminhoCore, fonte.replace(de, para));
}
const Core = require(caminhoCore);

let passes = 0, falhas = 0;
const resultados = {};
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  resultados[rotulo] = ok;
  if (!VENENO) {
    if (ok) passes++; else falhas++;
    console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
  }
}

const HOJE = '2026-11-16';
/* Série toda quinta, 60 minutos, R$ 120 a hora, desde 03/09/2026.
 * Setembro: pago a MENOS (parcial). Outubro: pago inteiro. Novembro: pago o
 * que já aconteceu (05 e 12/11); 19 e 26/11 ainda vêm. */
function montar() {
  const db = { versao: 1, ajustes: { pagamentosDesde: '2026-09' }, resumos: [], pagamentos: [], series: [], aulas: [],
    alunos: [{ id: 'al', nome: 'Aluna Sintética', ativo: true, precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 120 }] }] };
  Core.criarSerie(db, { alunoId: 'al', dias: [4], hora: '16:00', duracaoMin: 60, inicio: '2026-09-03', fim: null });
  const s = db.series[0];
  ['2026-09', '2026-10', '2026-11', '2026-12'].forEach(m => Core.materializarSerieNoMes(db, s, m));
  const devido = m => Core.valorACobrarDoMes(Core.calcularFechamento(db, 'al', m, HOJE));
  Core.marcarPagamento(db, 'al', '2026-09', '2026-10-05', devido('2026-09') - 120);
  Core.marcarPagamento(db, 'al', '2026-10', '2026-11-05', devido('2026-10'));
  Core.marcarPagamento(db, 'al', '2026-11', '2026-11-14', devido('2026-11'));
  const dia = iso => db.aulas.filter(a => a.serieId && a.data === iso)[0];
  return { db, dia };
}

{
  const m = montar();
  const selo = mes => Core.seloDoPagamento(m.db, Core.calcularFechamento(m.db, 'al', mes, HOJE)).selo;
  conf('(arranjo) setembro parcial, outubro e novembro pagos', [selo('2026-09'), selo('2026-10'), selo('2026-11')].join(','), 'parcial,pago,pago');
  conf('(arranjo) nenhuma aula com texto', m.db.aulas.some(a => (a.notaTexto || '').trim() || (a.notaPrivada || '').trim()), false);
}

for (const escopo of ['todas', 'seguintes']) {
  const m = montar();
  const origem = escopo === 'todas' ? m.dia('2026-12-03') : m.dia('2026-09-03');
  const fora = Core.escopoDaRepeticao(m.db, origem, escopo, HOJE);
  conf(escopo + ': ficam de fora por estarem pagas as 7 passadas de outubro e novembro', fora.pagas.length, 7);
  conf(escopo + ': nenhuma de fora por texto', fora.comTexto.length, 0);
  Core.aplicarEdicaoAula(m.db, origem.id, { duracaoMin: 90 }, escopo, HOJE);
  conf(escopo + ': a passada e paga de outubro (08/10) fica com 60', m.dia('2026-10-08').duracaoMin, 60);
  conf(escopo + ': a passada e paga de novembro (12/11) fica com 60', m.dia('2026-11-12').duracaoMin, 60);
  conf(escopo + ': a passada de setembro, paga a menos (10/09), vai a 90', m.dia('2026-09-10').duracaoMin, 90);
  conf(escopo + ': a futura de novembro, mês pago (19/11), vai a 90', m.dia('2026-11-19').duracaoMin, 90);
  conf(escopo + ': a futura de dezembro (10/12) vai a 90', m.dia('2026-12-10').duracaoMin, 90);
}

for (const escopo of ['todas', 'seguintes']) {
  const m = montar();
  const origem = escopo === 'todas' ? m.dia('2026-12-03') : m.dia('2026-09-03');
  Core.excluirAulas(m.db, origem.id, escopo, HOJE);
  const existe = iso => m.db.aulas.some(a => a.data === iso);
  conf('excluir ' + escopo + ': a passada e paga de outubro (08/10) fica', existe('2026-10-08'), true);
  conf('excluir ' + escopo + ': a passada e paga de novembro (12/11) fica', existe('2026-11-12'), true);
  conf('excluir ' + escopo + ': a passada de setembro, paga a menos (10/09), sai', existe('2026-09-10'), false);
  conf('excluir ' + escopo + ': a futura de novembro, mês pago (19/11), sai', existe('2026-11-19'), false);
  conf('excluir ' + escopo + ': a futura de dezembro (10/12) sai', existe('2026-12-10'), false);
  // o pago continua pago: nada do que a família pagou sumiu do mês
  const f = Core.calcularFechamento(m.db, 'al', '2026-10', HOJE);
  conf('excluir ' + escopo + ': outubro continua pago depois do excluir', Core.seloDoPagamento(m.db, f).selo, 'pago');
}

// a aula de hoje conta como dada (regra do Fechamento): num mês pago, ela fica de fora
{
  const m = montar();
  const hojeQuinta = '2026-11-12';
  const fora = Core.escopoDaRepeticao(m.db, m.dia('2026-12-03'), 'todas', hojeQuinta);
  conf('com hoje = 12/11, a aula de hoje, num mês pago, fica de fora', fora.pagas.some(a => a.data === '2026-11-12'), true);
}

// a própria aula editada sempre entra, mesmo passada e paga
{
  const m = montar();
  const propria = m.dia('2026-10-08');
  Core.aplicarEdicaoAula(m.db, propria.id, { duracaoMin: 45 }, 'todas', HOJE);
  conf('a própria aula paga, editada no "todas", muda', propria.duracaoMin, 45);
  conf('e a irmã paga (15/10) não', m.dia('2026-10-15').duracaoMin, 60);
}

// com texto e paga conta como com texto (um motivo só por aula)
{
  const m = montar();
  m.dia('2026-10-22').notaTexto = 'Revisão para a prova.';
  const fora = Core.escopoDaRepeticao(m.db, m.dia('2026-12-03'), 'todas', HOJE);
  conf('a aula paga com relato conta uma vez, como com texto', [fora.comTexto.length, fora.pagas.length].join(','), '1,6');
}

if (VENENO) {
  const ESPERADO = {
    '--envenenado-sem-regra-da-paga': {
      erra: ['todas: a passada e paga de outubro (08/10) fica com 60', 'excluir todas: a passada e paga de outubro (08/10) fica',
        'seguintes: a passada e paga de novembro (12/11) fica com 60', 'excluir seguintes: a passada e paga de novembro (12/11) fica'],
      acerta: ['todas: a passada de setembro, paga a menos (10/09), vai a 90', 'excluir todas: a futura de dezembro (10/12) sai',
        'todas: a futura de novembro, mês pago (19/11), vai a 90']
    },
    '--envenenado-protege-toda-passada': {
      erra: ['todas: a passada de setembro, paga a menos (10/09), vai a 90', 'excluir todas: a passada de setembro, paga a menos (10/09), sai',
        'seguintes: a passada de setembro, paga a menos (10/09), vai a 90'],
      acerta: ['todas: a passada e paga de outubro (08/10) fica com 60', 'excluir todas: a passada e paga de outubro (08/10) fica',
        'todas: a futura de dezembro (10/12) vai a 90']
    },
    '--envenenado-protege-futura': {
      erra: ['todas: a futura de novembro, mês pago (19/11), vai a 90', 'excluir todas: a futura de novembro, mês pago (19/11), sai'],
      acerta: ['todas: a passada e paga de outubro (08/10) fica com 60', 'todas: a passada de setembro, paga a menos (10/09), vai a 90',
        'todas: a futura de dezembro (10/12) vai a 90']
    }
  }[VENENO];
  const vf = (r, ok) => { if (ok) passes++; else falhas++; console.log((ok ? '  OK   ' : '  FALHA') + ' ' + r); };
  [...ESPERADO.erra, ...ESPERADO.acerta].forEach(r => { if (!(r in resultados)) vf('o caso "' + r + '" existe na prova', false); });
  ESPERADO.erra.forEach(r => vf('VENENO visto (' + VENENO + '): "' + r + '" sai errado', resultados[r] === false));
  ESPERADO.acerta.forEach(r => vf('com ' + VENENO + ', "' + r + '" segue certo (o veneno é deste lado só)', resultados[r] === true));
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);
