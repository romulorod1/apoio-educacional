/* testa_encerrar_repeticao.js
 *
 * F7 (#159), rodada 5: TODO caminho de lote da repetição passa pela mesma
 * regra (Core.motivoParaPoupar, via escopoDaRepeticao e encerrarSerie): a aula
 * já registrada (qualquer conteúdo) e a passada de mês com pagamento ficam.
 *
 * 1. O "Encerrar" da ficha do aluno (Core.encerrarSerie): a aula com relato, a
 *    só com assunto e as passadas de outubro (pago) ficam; as vazias de
 *    novembro em diante saem; outubro continua com o valor e o selo "pago";
 *    a contagem por motivo é a que o aviso usa.
 * 2. A mudança de padrão (Core.editarSerie) desde 01/10 não muda o horário da
 *    passada paga nem da registrada, e muda o da vazia.
 * 3. "Desta em diante" numa aula poupada que ficou depois do fim da série não
 *    cria série com o fim antes do início.
 * Sem navegador. Dados fictícios.
 *
 * Venenos, cada um tem de cair só do seu lado:
 *   --envenenado-encerrar-sem-regra   o Encerrar volta a apagar tudo que não é destacado;
 *   --envenenado-encerrar-guarda-tudo o Encerrar não apaga nada;
 *   --envenenado-serie-ao-contrario   o "desta em diante" depois do fim cria a série.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const VENENOS = {
  '--envenenado-encerrar-sem-regra': ["      if (motivo === 'registrada') { saida.registradas++; return true; }\n      if (motivo === 'paga') { saida.pagas++; return true; }", ''],
  '--envenenado-encerrar-guarda-tudo': ['      saida.removidas++;\n      return false;', '      return true;'],
  '--envenenado-serie-ao-contrario': ['          if (fimAntigo && fimAntigo < aula.data) {', '          if (false) {']
};
const pedidos = process.argv.slice(2);
const desconhecidos = pedidos.filter(a => !VENENOS[a]);
if (desconhecidos.length) throw new Error('argumento desconhecido: ' + desconhecidos.join(' '));
const VENENO = pedidos.find(a => VENENOS[a]) || null;

let caminhoCore = path.join(__dirname, '..', 'core.js');
let tmp = null;
if (VENENO) {
  const fonte = fs.readFileSync(caminhoCore, 'utf8').replace(/\r\n/g, '\n');
  const [de, para] = VENENOS[VENENO];
  if (fonte.split(de).length !== 2) throw new Error('o veneno ' + VENENO + ' não achou (uma vez só) o trecho no core.js');
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'encerrar_'));
  caminhoCore = path.join(tmp, 'core.js');
  fs.writeFileSync(caminhoCore, fonte.replace(de, para));
}
const Core = require(caminhoCore);

// o "hoje" do core fixo em 16/11/2026 (o editarSerie e o Encerrar do app usam o dia de hoje)
const RealDate = Date;
global.Date = class extends RealDate {
  constructor(...a) { if (a.length) super(...a); else super(2026, 10, 16, 12, 0, 0); }
  static now() { return new RealDate(2026, 10, 16, 12).getTime(); }
};
const HOJE = '2026-11-16';

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

/* Toda quinta, 60 minutos, R$ 120 a hora, desde 01/10. Outubro pago inteiro
 * (R$ 600). 12/11 tem relato, 26/11 só o assunto; o resto é vazio. */
function montar() {
  const db = { versao: 1, ajustes: {}, resumos: [], pagamentos: [], series: [], aulas: [],
    alunos: [{ id: 'al', nome: 'Aluna Sintética', ativo: true, precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 120 }] }] };
  Core.criarSerie(db, { alunoId: 'al', dias: [4], hora: '16:00', duracaoMin: 60, inicio: '2026-10-01', fim: null });
  const s = db.series[0];
  ['2026-10', '2026-11', '2026-12'].forEach(m => Core.materializarSerieNoMes(db, s, m));
  Core.marcarPagamento(db, 'al', '2026-10', '2026-11-05', Core.valorACobrarDoMes(Core.calcularFechamento(db, 'al', '2026-10', HOJE)));
  const dia = iso => db.aulas.filter(a => a.serieId && a.data === iso)[0];
  dia('2026-11-12').notaTexto = 'Revisão de frações.';
  dia('2026-11-26').temas = [{ id: 'mat-fracoes', titulo: 'Frações' }];
  return { db, s, dia };
}

{
  const m = montar();
  const antes = Core.calcularFechamento(m.db, 'al', '2026-10', HOJE).totalValor;
  conf('(arranjo) outubro vale R$ 600 e está pago', antes + ',' + Core.seloDoPagamento(m.db, Core.calcularFechamento(m.db, 'al', '2026-10', HOJE)).selo, '600,pago');
  const r = Core.encerrarSerie(m.db, m.s.id, '2026-10-01', HOJE);
  const ficou = iso => m.db.aulas.some(a => a.data === iso);
  conf('Encerrar desde 01/10: as cinco de outubro, pago, ficam', ['01', '08', '15', '22', '29'].every(d => ficou('2026-10-' + d)), true);
  conf('Encerrar: a de 12/11, com relato, fica', ficou('2026-11-12'), true);
  conf('Encerrar: a de 26/11, só com assunto, fica', ficou('2026-11-26'), true);
  conf('Encerrar: a de 05/11, passada de mês sem pagamento, sai', ficou('2026-11-05'), false);
  conf('Encerrar: a de 19/11, futura e vazia, sai', ficou('2026-11-19'), false);
  conf('Encerrar: as de dezembro, vazias, saem', m.db.aulas.some(a => a.data >= '2026-12-01'), false);
  const f = Core.calcularFechamento(m.db, 'al', '2026-10', HOJE);
  conf('Encerrar: outubro continua valendo R$ 600, com o selo "pago"', f.totalValor + ',' + Core.seloDoPagamento(m.db, f).selo, '600,pago');
  conf('Encerrar: a contagem por motivo (registradas, pagas)', r.registradas + ',' + r.pagas, '2,5');
  conf('Encerrar: a série termina na véspera (e sai, porque o fim ficou antes do início)', m.db.series.some(x => x.id === m.s.id), false);
}
{
  // Encerrar a partir de hoje: só o futuro vazio sai
  const m = montar();
  const r = Core.encerrarSerie(m.db, m.s.id, HOJE, HOJE);
  conf('Encerrar desde hoje: a de 19/11, vazia, sai', m.db.aulas.some(a => a.data === '2026-11-19'), false);
  conf('Encerrar desde hoje: a de 26/11, só com assunto, fica', m.db.aulas.some(a => a.data === '2026-11-26'), true);
  conf('Encerrar desde hoje: a série fica, com fim na véspera', (m.db.series.find(x => x.id === m.s.id) || {}).fim, '2026-11-15');
  conf('Encerrar desde hoje: contagem (registradas, pagas, e removeu alguma)', r.registradas + ',' + r.pagas + ',' + (r.removidas > 0), '1,0,true');
}
{
  // a mudança de padrão (editarSerie) desde 01/10, de 16:00 para 17:00
  const m = montar();
  Core.editarSerie(m.db, m.s.id, { hora: '17:00' }, '2026-10-01');
  conf('editarSerie: a passada de outubro, pago, fica às 16:00', m.dia('2026-10-08').hora, '16:00');
  conf('editarSerie: a de 12/11, com relato, fica às 16:00', m.dia('2026-11-12').hora, '16:00');
  conf('editarSerie: a de 19/11, vazia, vai às 17:00', m.dia('2026-11-19').hora, '17:00');
}
{
  // "desta em diante" numa poupada que ficou depois do fim
  const m = montar();
  Core.encerrarSerie(m.db, m.s.id, '2026-11-20', HOJE);
  const poupada = m.dia('2026-11-26');
  conf('(arranjo) a de 26/11, só com assunto, ficou depois do fim', !!poupada && m.s.fim < poupada.data, true);
  if (poupada) Core.aplicarEdicaoAula(m.db, poupada.id, { hora: '18:00' }, 'seguintes', HOJE);
  conf('"desta em diante" depois do fim: a aula muda', poupada && poupada.hora, '18:00');
  conf('"desta em diante" depois do fim: nenhuma série com o fim antes do início',
    m.db.series.some(x => x.fim && x.fim < x.inicio), false);
}

if (VENENO) {
  const ESPERADO = {
    '--envenenado-encerrar-sem-regra': {
      erra: ['Encerrar desde 01/10: as cinco de outubro, pago, ficam', 'Encerrar: a de 12/11, com relato, fica',
        'Encerrar: outubro continua valendo R$ 600, com o selo "pago"'],
      acerta: ['Encerrar: a de 19/11, futura e vazia, sai', 'Encerrar: as de dezembro, vazias, saem']
    },
    '--envenenado-encerrar-guarda-tudo': {
      erra: ['Encerrar: a de 19/11, futura e vazia, sai', 'Encerrar: as de dezembro, vazias, saem', 'Encerrar desde hoje: a de 19/11, vazia, sai'],
      acerta: ['Encerrar desde 01/10: as cinco de outubro, pago, ficam', 'Encerrar: a de 12/11, com relato, fica']
    },
    '--envenenado-serie-ao-contrario': {
      erra: ['"desta em diante" depois do fim: nenhuma série com o fim antes do início'],
      acerta: ['"desta em diante" depois do fim: a aula muda', 'Encerrar: a de 12/11, com relato, fica']
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
