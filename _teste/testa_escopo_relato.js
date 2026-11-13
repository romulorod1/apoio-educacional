/* testa_escopo_relato.js
 *
 * F7 (#159), regra da orquestradora (13/11/2026): no "todas" e no "desta em
 * diante" (Core.alvosDoEscopo), a aula que tem relato ou a nota só dela
 * (notaTexto ou notaPrivada não vazios) fica de fora, na edição e no excluir. Aula com relato é aula dada e registrada: mudar o padrão da
 * série não reescreve o passado dela (a duração, a situação e a cobrança de um
 * mês já cobrado). Antes isso vinha de carona no "destacada", que o relato
 * marcava; desde o F7 o relato grava direto, sem destacar.
 *
 * Os dois lados: a aula com texto NÃO muda nem some, e a aula sem texto MUDA
 * (ou é excluída). Sem navegador.
 *
 * Venenos, cada um tem de cair só do lado da aula com texto:
 *   --envenenado-sem-regra-do-relato   o filtro volta a olhar só o destacada;
 *   --envenenado-so-o-relato           a regra olha só o notaTexto (a nota só dela fica desprotegida).
 * Dados fictícios.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const VENENOS = {
  '--envenenado-sem-regra-do-relato': ['      if (temTextoDaAula(a)) { saida.comTexto.push(a); return; }', ''],
  '--envenenado-so-o-relato': ["    return !!(String(a.notaTexto || '').trim() || String(a.notaPrivada || '').trim());",
    "    return !!String(a.notaTexto || '').trim();"]
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
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'escopo_relato_'));
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

/* Série toda quinta às 16h, 60 minutos, desde 01/10/2026. A aula de 08/10 já
 * foi dada e tem relato (mês de outubro já cobrado); a de 15/10 não tem. */
function montar() {
  const db = { versao: 1, ajustes: {}, alunos: [{ id: 'al', nome: 'Aluna Sintética', ativo: true, precos: [] }],
    aulas: [], series: [], resumos: [], pagamentos: [] };
  Core.criarSerie(db, { alunoId: 'al', dias: [4], hora: '16:00', duracaoMin: 60, inicio: '2026-10-01', fim: null });
  const s = db.series[0];
  Core.materializarSerieNoMes(db, s, '2026-10');
  Core.materializarSerieNoMes(db, s, '2026-11');
  const dia = iso => db.aulas.filter(a => a.serieId && a.data === iso)[0];
  dia('2026-10-08').notaTexto = 'Equações do 1º grau, lista 3 feita.'; // o relato grava direto (F7, B4)
  dia('2026-10-29').notaPrivada = 'Chegou cansada; conversar com a mãe.'; // só a nota só dela
  return { db, dia };
}

for (const escopo of ['todas', 'seguintes']) {
  const m = montar();
  const comRelato = m.dia('2026-10-08'), semRelato = m.dia('2026-10-15'), depois = m.dia('2026-11-12');
  const soNota = m.dia('2026-10-29');
  conf('(arranjo, ' + escopo + ') a aula com relato existe e não está destacada', !!comRelato && !comRelato.destacada, true);
  const origem = escopo === 'todas' ? m.dia('2026-11-05') : m.dia('2026-10-01');
  Core.aplicarEdicaoAula(m.db, origem.id, { duracaoMin: 90 }, escopo);
  conf(escopo + ': a aula com relato (08/10) fica com 60 minutos', comRelato.duracaoMin, 60);
  conf(escopo + ': a aula com relato mantém o relato', comRelato.notaTexto, 'Equações do 1º grau, lista 3 feita.');
  conf(escopo + ': a aula só com a nota só dela (29/10) fica com 60 minutos', soNota.duracaoMin, 60);
  conf(escopo + ': a aula sem relato (15/10) passa a 90 minutos', semRelato.duracaoMin, 90);
  conf(escopo + ': a aula sem relato de novembro (12/11) passa a 90 minutos', depois.duracaoMin, 90);
  conf(escopo + ': a aula editada passa a 90 minutos', origem.duracaoMin, 90);
}
// a própria aula com relato, editada no "todas", entra
{
  const m = montar();
  const comRelato = m.dia('2026-10-08');
  Core.aplicarEdicaoAula(m.db, comRelato.id, { status: 'cancelada' }, 'todas');
  conf('todas a partir da própria aula com relato: ela muda', comRelato.status, 'cancelada');
  conf('todas a partir da própria aula com relato: a irmã sem relato muda', m.dia('2026-10-15').status, 'cancelada');
}
// o excluir: a aula com texto fica, com o texto; a sem texto sai
for (const escopo of ['todas', 'seguintes']) {
  const m = montar();
  const origem = escopo === 'todas' ? m.dia('2026-11-05') : m.dia('2026-10-01');
  Core.excluirAulas(m.db, origem.id, escopo);
  const ficou = iso => m.db.aulas.filter(a => a.data === iso)[0];
  conf('excluir ' + escopo + ': a aula com relato (08/10) fica, com o relato',
    !!ficou('2026-10-08') && ficou('2026-10-08').notaTexto, 'Equações do 1º grau, lista 3 feita.');
  conf('excluir ' + escopo + ': a aula só com a nota só dela (29/10) fica, com a nota',
    !!ficou('2026-10-29') && ficou('2026-10-29').notaPrivada, 'Chegou cansada; conversar com a mãe.');
  conf('excluir ' + escopo + ': a aula sem texto (15/10) sai', !ficou('2026-10-15'), true);
  conf('excluir ' + escopo + ': a aula de onde saiu o excluir sai', !m.db.aulas.some(a => a.id === origem.id), true);
}
// relato só de espaços não conta como relato
{
  const m = montar();
  const branco = m.dia('2026-10-22');
  branco.notaTexto = '   ';
  branco.notaPrivada = ' ';
  Core.aplicarEdicaoAula(m.db, m.dia('2026-11-05').id, { duracaoMin: 45 }, 'todas');
  conf('relato só com espaços não protege a aula', branco.duracaoMin, 45);
}

if (VENENO) {
  const ESPERADO = {
    '--envenenado-sem-regra-do-relato': {
      erra: ['todas: a aula com relato (08/10) fica com 60 minutos', 'seguintes: a aula com relato (08/10) fica com 60 minutos',
        'todas: a aula só com a nota só dela (29/10) fica com 60 minutos', 'excluir todas: a aula com relato (08/10) fica, com o relato',
        'excluir seguintes: a aula só com a nota só dela (29/10) fica, com a nota'],
      acerta: ['todas: a aula sem relato (15/10) passa a 90 minutos', 'seguintes: a aula sem relato (15/10) passa a 90 minutos',
        'excluir todas: a aula sem texto (15/10) sai', 'todas: a aula com relato mantém o relato', 'relato só com espaços não protege a aula']
    },
    '--envenenado-so-o-relato': {
      erra: ['todas: a aula só com a nota só dela (29/10) fica com 60 minutos', 'seguintes: a aula só com a nota só dela (29/10) fica com 60 minutos',
        'excluir todas: a aula só com a nota só dela (29/10) fica, com a nota', 'excluir seguintes: a aula só com a nota só dela (29/10) fica, com a nota'],
      acerta: ['todas: a aula com relato (08/10) fica com 60 minutos', 'excluir todas: a aula com relato (08/10) fica, com o relato',
        'todas: a aula sem relato (15/10) passa a 90 minutos', 'excluir todas: a aula sem texto (15/10) sai']
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
