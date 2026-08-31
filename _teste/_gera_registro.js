const fs = require('fs'), path = require('path');
const Core = require('../core.js'), PDFGen = require('../pdf.js');
const marcelo = { id: 'a1', nome: 'Marcelo Andrade', responsavel: 'Patrícia Andrade', ativo: true,
  precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 130 }] };
const AREAS = ['autonomia','horarios','cronograma','priorizacao','disciplina','metodo','material','tempo',
  'revisao','estrategia-prova','analise-erros','frustracao','ansiedade','confianca','persistencia','raciocinio'];
const TEMAS = [
  { id: 'MAT08-03', titulo: 'Equações do primeiro grau', lingua: 'pt', partes: ['material','lista','gabarito'], exercicios: 9 },
  { id: 'MAT08-04', titulo: 'Sistemas de duas equações e duas incógnitas', lingua: 'pt', partes: ['lista'], exercicios: 6 },
  { id: 'MAT08-07', titulo: 'Produtos notáveis e fatoração', lingua: 'pt', partes: ['material'], exercicios: 0 }
];
const db = { alunos: [marcelo], series: [], aulas: [], resumos: [{ alunoId: 'a1', mes: '2026-06',
  texto: 'Mês de consolidação. O Marcelo chegou mais seguro na prova de junho e passou a montar o cronograma sozinho, o que era o principal objetivo do bimestre.' }] };
[1,3,5,8,10,12,15,17,19,22,24,26].forEach((d, i) => {
  db.aulas.push({ id: 'x' + d, alunoId: 'a1', data: '2026-06-' + String(d).padStart(2,'0'),
    hora: '15:30', duracaoMin: 90, status: 'realizada', cobravel: true, anexos: [],
    areas: AREAS.slice(0, 3 + (i % 6)),
    temas: i % 3 === 0 ? [TEMAS[0], TEMAS[1]] : [TEMAS[i % 3]] });
});
const f = Core.calcularFechamento(db, 'a1', '2026-06');
console.log('temas no mês:', f.temasDoMes.length, '| áreas:', f.areasDoMes.length);
fs.writeFileSync(path.join(__dirname, 'saida_registro.pdf'), PDFGen.gerarFechamento(f, { sempreResumo: true }));
fs.writeFileSync(path.join(__dirname, 'saida_registro.md'), Core.markdownFechamento(f, {}), 'utf8');
console.log('pdf e md gerados');
