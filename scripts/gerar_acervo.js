const fs = require('fs');
const path = require('path');

const baseDir = 'H:/My Drive/Vida Pessoal/Família/Material pra Nath/Aplicativo/Base de Dados';
const saidaDir = path.join(__dirname, '..', 'banco');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) results = results.concat(getFiles(full));
    else if (file.endsWith('.json')) results.push(full);
  });
  return results;
}

const DISC_MAP = {
  'Matemática': { key: 'matematica', rotulo: 'Matemática', cor: '#1F3A5F' },
  'Língua Portuguesa': { key: 'portugues', rotulo: 'Português', cor: '#2E7D6B' },
  'Literatura': { key: 'literatura', rotulo: 'Literatura', cor: '#8A6D2F' },
  'Física': { key: 'fisica', rotulo: 'Física', cor: '#2F7DA3' },
  'Química': { key: 'quimica', rotulo: 'Química', cor: '#B4453C' },
  'Biologia': { key: 'biologia', rotulo: 'Biologia', cor: '#4A7C3F' },
  'História': { key: 'historia', rotulo: 'História', cor: '#9C413D' },
  'Geografia': { key: 'geografia', rotulo: 'Geografia', cor: '#3F6F8C' },
  'Sociologia': { key: 'sociologia', rotulo: 'Sociologia', cor: '#7A5EA6' },
  'Filosofia': { key: 'filosofia', rotulo: 'Filosofia', cor: '#5B6B82' },
  'Língua Inglesa': { key: 'ingles', rotulo: 'Inglês', cor: '#C9A961' },
  'Artes': { key: 'artes', rotulo: 'Artes', cor: '#A64B7E' }
};

const files = getFiles(baseDir);
console.log('Lendo ' + files.length + ' arquivos de ' + baseDir);

const modulos = [];
let idCounter = 1;

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const data = JSON.parse(content);
  const discInfo = DISC_MAP[data.disciplina] || { key: 'outra', rotulo: data.disciplina || 'Outra', cor: '#627D98' };

  let modId = 'ACE-' + discInfo.key.substring(0, 3).toUpperCase() + '-' + String(idCounter++).padStart(2, '0');
  if (data.questoes && data.questoes[0] && data.questoes[0].id) {
    const parts = data.questoes[0].id.split('-');
    if (parts.length >= 2) {
      modId = 'ACE-' + parts[0] + '-' + parts[1];
    }
  }

  // Prepara explicacao em markdown para o gerador de PDF
  const expLines = [];
  const bd = data.benchmark_didatico;
  if (bd) {
    if (bd.capitulo) expLines.push('### ' + bd.capitulo);
    if (bd.objetivos_aprendizagem && bd.objetivos_aprendizagem.length) {
      expLines.push('**Objetivos de Aprendizagem:**');
      bd.objetivos_aprendizagem.forEach(o => expLines.push('- ' + o));
      expLines.push('');
    }
    if (bd.resumo_teorico) {
      expLines.push('#### Resumo Teórico');
      if (bd.resumo_teorico.conceitos_chave && bd.resumo_teorico.conceitos_chave.length) {
        bd.resumo_teorico.conceitos_chave.forEach(c => expLines.push('- ' + c));
        expLines.push('');
      }
      if (bd.resumo_teorico.atencao_ponto_cego) {
        expLines.push('**Atenção (Ponto Cego):** ' + bd.resumo_teorico.atencao_ponto_cego);
        expLines.push('');
      }
    }
    if (bd.exemplo_resolvido) {
      const ex = bd.exemplo_resolvido;
      expLines.push('#### Exemplo Resolvido: ' + (ex.titulo || ''));
      if (ex.enunciado) expLines.push(ex.enunciado);
      if (ex.resolucao_passo_a_passo && ex.resolucao_passo_a_passo.length) {
        expLines.push('**Resolução:**');
        ex.resolucao_passo_a_passo.forEach(p => expLines.push(p));
      }
    }
  }

  // Formata exercicios para o gerador de PDF
  const exercicios = (data.questoes || []).map((q, idx) => {
    let enun = q.enunciado || '';
    if (q.imagem_descricao) {
      enun += '\n\n' + q.imagem_descricao;
    }
    if (q.tipo === 'fechada' && q.alternativas && q.alternativas.length) {
      enun += '\n\n' + q.alternativas.map(a => '(' + a.letra + ') ' + a.texto).join('\n');
    }
    let resp = '';
    if (q.gabarito) {
      if (q.gabarito.letra) resp += 'Alternativa ' + q.gabarito.letra.toUpperCase() + '. ';
      if (q.gabarito.porque) resp += q.gabarito.porque + ' ';
      if (q.gabarito.ancora) resp += 'Justificativa: ' + q.gabarito.ancora + ' ';
      if (q.gabarito.espera_se) resp += q.gabarito.espera_se;
    } else if (q.resposta) {
      resp = q.resposta;
    }

    return {
      n: idx + 1,
      id: q.id,
      bloco: q.origem ? q.origem + ' · ' + (q.dificuldade_rotulo || '') : (q.dificuldade_rotulo || 'Questão ' + (idx + 1)),
      enunciado: (q.origem ? '[' + q.origem + '] ' : '') + enun,
      resposta: resp.trim() || q.resposta || 'Consulte o gabarito oficial.'
    };
  });

  const bDidatico = data.benchmark_didatico || {};
  const rTeorico = bDidatico.resumo_teorico || {};
  const niveisMod = Array.from(new Set((data.questoes || []).map(q => q.dificuldade_nivel).filter(Boolean)));

  const modulo = {
    id: modId,
    disciplina: data.disciplina,
    disciplinaKey: discInfo.key,
    disciplinaRotulo: discInfo.rotulo,
    cor: discInfo.cor,
    assunto: data.assunto,
    publico_alvo: data.publico_alvo,
    capitulo: bDidatico.capitulo || '',
    conceitos_chave: rTeorico.conceitos_chave || [],
    atencao_ponto_cego: rTeorico.atencao_ponto_cego || '',
    exemplo_resolvido: bDidatico.exemplo_resolvido || null,
    niveis: niveisMod,
    benchmark_didatico: data.benchmark_didatico,
    questoes: data.questoes || [],
    qtdQuestoes: (data.questoes || []).length,
    temaCompativel: {
      id: modId,
      serie: 'em1',
      materia: discInfo.key,
      pt: {
        titulo: data.assunto,
        resumo: data.publico_alvo || '',
        explicacao: expLines.join('\n\n'),
        exercicios: exercicios
      }
    }
  };

  modulos.push(modulo);
});

console.log('Total de módulos processados:', modulos.length);

const indice = modulos.map(m => ({
  id: m.id,
  disciplina: m.disciplina,
  disciplinaKey: m.disciplinaKey,
  disciplinaRotulo: m.disciplinaRotulo,
  cor: m.cor,
  assunto: m.assunto,
  publico_alvo: m.publico_alvo,
  capitulo: (m.benchmark_didatico && m.benchmark_didatico.capitulo) || '',
  qtdQuestoes: m.qtdQuestoes,
  niveis: Array.from(new Set(m.questoes.map(q => q.dificuldade_nivel).filter(Boolean))),
  origens: Array.from(new Set(m.questoes.map(q => q.origem).filter(Boolean)))
}));

fs.writeFileSync(path.join(saidaDir, 'acervo.json'), JSON.stringify(modulos), 'utf8');
fs.writeFileSync(path.join(saidaDir, 'acervo_indice.json'), JSON.stringify(indice), 'utf8');

console.log('Salvo em ' + path.join(saidaDir, 'acervo.json') + ' (' + fs.statSync(path.join(saidaDir, 'acervo.json')).size + ' bytes)');
console.log('Salvo em ' + path.join(saidaDir, 'acervo_indice.json') + ' (' + fs.statSync(path.join(saidaDir, 'acervo_indice.json')).size + ' bytes)');
