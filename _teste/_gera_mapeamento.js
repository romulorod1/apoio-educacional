const fs = require('fs'), path = require('path');
const Core = require('../core.js'), PDFGen = require('../pdf.js');
const m = Core.mapeamentoNovo();
m.escola = 'Colégio Santo Inácio'; m.anoEscolar = '08'; m.professor = 'Ricardo';
m.motivo = 'Nota baixa no segundo bimestre e muita insegurança antes das provas.';
m.expectativa = 'A família quer que ele recupere a média e pare de estudar só na véspera.';
m.nivel = '2';
m.marcados.fortes = ['raciocinio-ok','pergunta','gosta','pega-rapido'];
m.marcados.atencao = ['sinal','fracao-fraca','vespera','nao-confere','ansiedade-prova','fora-do-modelo','branco'];
m.marcados.lacunas = ['fracoes','decimais','inteiros','eq1','proporcao'];
m.marcados.rotina = ['lugar-calmo','agenda-cheia','cansado'];
m.marcados.aprende = ['visual','exemplo-regra'];
m.prioridades = 'Fechar frações e decimais até o fim de setembro.\nCriar rotina de revisão semanal.';
m.plano = 'Ele entende rápido, mas nunca consolidou fração. Como o oitavo ano cobra álgebra o tempo todo, cada equação vira um problema de fração disfarçado. Plano: duas semanas de base, depois voltar ao conteúdo do ano com revisão semanal curta.';
const aluno = { id: 'a1', nome: 'Marcelo Andrade', mapeamentos: [m] };
const bytes = PDFGen.gerarFichaMapeamento({
  aluno: aluno, mapeamento: m, grupos: Core.MAPA, rotulos: Core.rotulosDoMapa,
  nivel: Core.rotuloNivel(m.nivel), anoEscolar: '8º ano' });
fs.writeFileSync(path.join(__dirname, 'saida_mapeamento.pdf'), bytes);
console.log('ficha gerada,', bytes.length, 'bytes');
console.log('lembrete:', Core.textoDoLembrete(aluno).slice(0, 130) + '...');
