/* Testes dos feriados: móveis ancorados na Páscoa, nacionais fixos,
 * estaduais do Rio de Janeiro e municipais de Niterói. */
const Core = require('../core.js');

let falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (!ok) falhas++;
  console.log((ok ? 'OK   ' : 'FALHA') + ' | ' + rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado);
}

console.log('\n=== domingo de Páscoa (datas oficiais conhecidas) ===');
const pascoas = {
  2024: '2024-03-31', 2025: '2025-04-20', 2026: '2026-04-05',
  2027: '2027-03-28', 2028: '2028-04-16', 2030: '2030-04-21'
};
Object.keys(pascoas).forEach(ano => {
  conf('Páscoa de ' + ano, Core.isoDe(Core.domingoDePascoa(+ano)), pascoas[ano]);
});

console.log('\n=== feriados móveis de 2026 ===');
conf('Carnaval, segunda', Core.feriadoEm('2026-02-16').nome, 'Carnaval');
conf('Carnaval, terça', Core.feriadoEm('2026-02-17').nome, 'Carnaval');
conf('Quarta-feira de Cinzas', Core.feriadoEm('2026-02-18').nome, 'Quarta-feira de Cinzas');
conf('Cinzas é facultativo', Core.feriadoEm('2026-02-18').facultativo, true);
conf('Sexta-feira Santa', Core.feriadoEm('2026-04-03').nome, 'Sexta-feira Santa');
conf('Corpus Christi', Core.feriadoEm('2026-06-04').nome, 'Corpus Christi');

console.log('\n=== feriados móveis de 2027 (Páscoa em março) ===');
conf('Carnaval de 2027, terça', Core.feriadoEm('2027-02-09').nome, 'Carnaval');
conf('Sexta-feira Santa de 2027', Core.feriadoEm('2027-03-26').nome, 'Sexta-feira Santa');
conf('Corpus Christi de 2027', Core.feriadoEm('2027-05-27').nome, 'Corpus Christi');

console.log('\n=== nacionais fixos ===');
conf('Ano novo', Core.feriadoEm('2026-01-01').nome, 'Confraternização Universal');
conf('Tiradentes', Core.feriadoEm('2026-04-21').nome, 'Tiradentes');
conf('Trabalho', Core.feriadoEm('2026-05-01').nome, 'Dia do Trabalho');
conf('Independência', Core.feriadoEm('2026-09-07').nome, 'Independência do Brasil');
conf('Aparecida', Core.feriadoEm('2026-10-12').nome, 'Nossa Senhora Aparecida');
conf('Finados', Core.feriadoEm('2026-11-02').nome, 'Finados');
conf('República', Core.feriadoEm('2026-11-15').nome, 'Proclamação da República');
conf('Consciência Negra', Core.feriadoEm('2026-11-20').nome, 'Consciência Negra');
conf('Natal', Core.feriadoEm('2026-12-25').nome, 'Natal');

console.log('\n=== estado do Rio de Janeiro ===');
conf('São Jorge', Core.feriadoEm('2026-04-23').nome, 'São Jorge');
conf('São Jorge é estadual', Core.feriadoEm('2026-04-23').ambito, 'estadual');

console.log('\n=== município de Niterói ===');
conf('Aniversário de Niterói', Core.feriadoEm('2026-11-22').nome, 'Aniversário de Niterói');
conf('Niterói é municipal', Core.feriadoEm('2026-11-22').ambito, 'municipal');
conf('Padroeira de Niterói', Core.feriadoEm('2026-12-08').ambito, 'municipal');

console.log('\n=== dias comuns não são feriado ===');
conf('10/06/2026 não é feriado', Core.feriadoEm('2026-06-10'), 'null');
conf('15/03/2026 não é feriado', Core.feriadoEm('2026-03-15'), 'null');

console.log('\n=== feriados por mês ===');
const nov = Core.feriadosDoMes('2026-11');
conf('novembro de 2026 tem 4 marcações', Object.keys(nov).length, 4);
const jun = Core.feriadosDoMes('2026-06');
conf('junho de 2026 tem 1 marcação', Object.keys(jun).length, 1);
conf('e é Corpus Christi', jun['2026-06-04'].nome, 'Corpus Christi');

console.log('\n=== leitura de data em dd/mm/aaaa ===');
conf('data válida', Core.deBR('10/06/2026'), '2026-06-10');
conf('com um dígito', Core.deBR('1/6/2026'), '2026-06-01');
conf('com ponto', Core.deBR('10.06.2026'), '2026-06-10');
conf('dia inexistente', Core.deBR('31/02/2026'), 'null');
conf('mês inválido', Core.deBR('10/13/2026'), 'null');
conf('texto qualquer', Core.deBR('amanhã'), 'null');
conf('vazio', Core.deBR(''), 'null');
conf('ida e volta', Core.ddmmaaaa(Core.deBR('05/04/2026')), '05/04/2026');

console.log('\n' + (falhas === 0 ? 'TODOS OS TESTES DE FERIADO PASSARAM' : falhas + ' TESTE(S) FALHARAM'));
process.exit(falhas === 0 ? 0 : 1);
