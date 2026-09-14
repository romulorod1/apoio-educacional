/* testa_acervo.js
 * Valida a integridade do Acervo Educacional Completo:
 * 1. 40 temas presentes no banco/acervo.json e banco/acervo_indice.json;
 * 2. Nenhuma disciplina classificada como 'outra' (disciplinaKey válida em todas);
 * 3. Todas as questões de Matemática (45) com 'imagem_descricao' preenchida;
 * 4. Todos os 40 temas com Mapa Mental completo (núcleo e 4 ramos estruturados).
 */

const fs = require('fs');
const path = require('path');

let passou = 0;
let falhou = 0;

function asseverar(cond, msg) {
  if (cond) {
    passou++;
  } else {
    falhou++;
    console.error('FALHA: ' + msg);
  }
}

const pAcervo = path.join(__dirname, '../banco/acervo.json');
const pIndice = path.join(__dirname, '../banco/acervo_indice.json');

asseverar(fs.existsSync(pAcervo), 'banco/acervo.json deve existir');
asseverar(fs.existsSync(pIndice), 'banco/acervo_indice.json deve existir');

if (fs.existsSync(pAcervo) && fs.existsSync(pIndice)) {
  const acervo = JSON.parse(fs.readFileSync(pAcervo, 'utf-8'));
  const indice = JSON.parse(fs.readFileSync(pIndice, 'utf-8'));

  asseverar(Array.isArray(acervo) && acervo.length === 40, 'acervo.json deve conter exatamente 40 temas (encontrados ' + (acervo ? acervo.length : 0) + ')');
  asseverar(Array.isArray(indice) && indice.length === 40, 'acervo_indice.json deve conter exatamente 40 itens');

  const disciplinasValidas = [
    'matematica', 'portugues', 'literatura', 'fisica',
    'quimica', 'biologia', 'historia', 'geografia',
    'sociologia', 'filosofia', 'ingles', 'artes'
  ];

  let totalQuestoes = 0;
  let mathQuestoes = 0;
  let mathComImagem = 0;
  let temasComMapaMental = 0;
  let temasOutra = 0;

  acervo.forEach((m, idx) => {
    // Validação de chave de disciplina
    const keyOk = disciplinasValidas.indexOf(m.disciplinaKey) !== -1;
    if (!keyOk || m.disciplinaKey === 'outra') temasOutra++;
    asseverar(keyOk, 'Tema ' + (m.id || idx) + ' possui disciplinaKey válida (' + m.disciplinaKey + ')');

    // Validação de questões
    const qCount = m.questoes ? m.questoes.length : 0;
    totalQuestoes += qCount;
    asseverar(qCount === 15, 'Tema ' + m.id + ' deve conter exatamente 15 questões (tem ' + qCount + ')');

    // Validação de Matemática com figuras
    if (m.disciplinaKey === 'matematica') {
      (m.questoes || []).forEach(q => {
        mathQuestoes++;
        if (q.imagem_descricao && q.imagem_descricao.trim().length > 10) {
          mathComImagem++;
        }
      });
    }

    // Validação de Mapa Mental
    const mm = m.mapa_mental;
    const temDica = !!(mm && (mm.dica_fixacao || mm.dica_ninja));
    const temMM = !!(mm && mm.nucleo && Array.isArray(mm.ramos) && mm.ramos.length === 4 && temDica);
    if (temMM) temasComMapaMental++;
    asseverar(temMM, 'Tema ' + m.id + ' deve conter Mapa Mental estruturado completo com 4 ramos e dica');
  });

  const textoAcervo = fs.readFileSync(pAcervo, 'utf-8');
  asseverar(!textoAcervo.includes('DICA NINJA DA NATH'), 'Nenhuma menção a DICA NINJA DA NATH deve existir no acervo');
  asseverar(!textoAcervo.includes('\\log_b'), 'Nenhum comando LaTeX \\log_b cru deve existir no acervo');
  asseverar(!textoAcervo.includes('\\iff'), 'Nenhum comando LaTeX \\iff cru deve existir no acervo');
  asseverar(!textoAcervo.includes('\\frac'), 'Nenhum comando LaTeX \\frac cru deve existir no acervo');

  asseverar(temasOutra === 0, 'Nenhum tema pode estar classificado como disciplinaKey outra');
  asseverar(totalQuestoes === 600, 'Acervo deve conter exatamente 600 questões (encontradas ' + totalQuestoes + ')');
  asseverar(mathQuestoes === 45, 'Devem existir exatamente 45 questões de matemática');
  asseverar(mathComImagem === 45, 'Todas as 45 questões de matemática devem conter imagem_descricao (encontradas ' + mathComImagem + ')');
  asseverar(temasComMapaMental === 40, 'Todos os 40 temas devem possuir Mapa Mental completo');
}

console.log(passou + ' verificações passaram, ' + falhou + ' falharam.');
if (falhou > 0) process.exit(1);
