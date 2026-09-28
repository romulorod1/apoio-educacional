/* testa_sugestoes_matematica.js
 * Teste unitário e de conformidade para a frente T05:
 * 1. Começar em Matemática como ponto de partida natural na escolha de assunto.
 * 2. Ano escolar do aluno (cadastro ou mapeamento) contextualizando as sugestões.
 * 3. Preservação de navegação livre (aluno do 7º ano consegue escolher frações do 6º).
 * 4. Aluno sem ano escolar tem saída útil e amigável sem bloquear o planejamento.
 * 5. Separação de assuntos recentes/trilha das sugestões curriculares do ano.
 */
const fs = require('fs');
const path = require('path');

let falhas = 0, passes = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else {
    falhas++;
    console.error('  FALHA | ' + rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado);
    return;
  }
  console.log('  OK    | ' + rotulo);
}

function secao(t) { console.log('\n=== ' + t + ' ==='); }

const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const Core = require('../core.js');

// ============================================================================
secao('1. Resolução compatível de ano escolar (anoEscolarDe)');
// ============================================================================

function extrairFuncao(codigo, nome) {
  const regex = new RegExp('(function\\s+' + nome + '\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n  \\})');
  const m = codigo.match(regex);
  if (!m) throw new Error('Função não encontrada: ' + nome);
  return m[1];
}

const fnAnoEscolarDe = new Function('Core', 'aluno', `
  ${extrairFuncao(appJs, 'anoEscolarDe')}
  return anoEscolarDe(aluno);
`);

const alunoComAnoDireto = { id: 'a1', nome: 'Bento', anoEscolar: '07' };
conf('Aluno com anoEscolar direto no cadastro (T04)', fnAnoEscolarDe(Core, alunoComAnoDireto), '07');

const alunoComAnoMapeado = { id: 'a2', nome: 'Clara', mapeamentos: [{ anoEscolar: '08' }] };
conf('Aluno com anoEscolar herdado do mapeamento (legado)', fnAnoEscolarDe(Core, alunoComAnoMapeado), '08');

const alunoComAnoDuplo = { id: 'a3', nome: 'Davi', anoEscolar: '09', mapeamentos: [{ anoEscolar: '08' }] };
conf('Aluno com ano no cadastro tem prioridade sobre mapeamento antigo', fnAnoEscolarDe(Core, alunoComAnoDuplo), '09');

const alunoCursinho = { id: 'a4', nome: 'Eduarda', anoEscolar: 'cursinho' };
conf('Aluno de cursinho mapeia para 3º do médio (em3)', fnAnoEscolarDe(Core, alunoCursinho), 'em3');

const alunoSemAno = { id: 'a5', nome: 'Felipe' };
conf('Aluno sem ano retorna null', fnAnoEscolarDe(Core, alunoSemAno), null);

conf('Aluno indefinido/null retorna null', fnAnoEscolarDe(Core, null), null);

// ============================================================================
secao('2. Não rebaixar o ano cadastrado ao navegar entre anos (lembrarAnoEscolar)');
// ============================================================================

const fnLembrarAno = new Function('Core', 'anoEscolarDe', 'aluno', 'ano', `
  var salvou = false;
  function salvar() { salvou = true; }
  ${extrairFuncao(appJs, 'lembrarAnoEscolar')}
  lembrarAnoEscolar(aluno, ano);
  return { ano: aluno ? aluno.anoEscolar : null, salvou: salvou };
`);

// Aluno do 7º ano explorando o 6º ano para reforço de Frações
const alunoSetimo = { id: 'a7', nome: 'Gabriel', anoEscolar: '07' };
const resSetimo = fnLembrarAno(Core, fnAnoEscolarDe.bind(null, Core), alunoSetimo, '06');
conf('Aluno do 7º ano NÃO tem seu ano alterado para 06 ao consultar outro ano', resSetimo.ano, '07');
conf('Não dispara gravação desnecessária para aluno com ano já fixado', resSetimo.salvou, false);

// Aluno sem ano cadastrado que escolhe uma série pela primeira vez
const alunoVazio = { id: 'av', nome: 'Helena', anoEscolar: null };
const resVazio = fnLembrarAno(Core, fnAnoEscolarDe.bind(null, Core), alunoVazio, '06');
conf('Aluno sem ano aprende o ano escolar navegado', resVazio.ano, '06');
conf('Dispara gravação para memorizar ano de aluno sem cadastro', resVazio.salvou, true);

// ============================================================================
secao('3. Separação de recentes e sugestões curriculares de Matemática');
// ============================================================================

conf('app.js define sugestoesRecentesDeAssunto', appJs.includes('function sugestoesRecentesDeAssunto('), true);
conf('app.js define sugestoesDoAnoDeMatematica', appJs.includes('function sugestoesDoAnoDeMatematica('), true);
conf('app.js mantém compatibilidade com sugestoesDeAssunto', appJs.includes('function sugestoesDeAssunto('), true);

// ============================================================================
secao('4. Interface e ponto inicial em Matemática');
// ============================================================================

conf('Campo de escrita livre "assunto-outro" presente', appJs.includes("id: 'assunto-outro'"), true);
conf('Botão "usar-assunto-outro" presente', appJs.includes("id: 'usar-assunto-outro'"), true);
conf('Campo de busca em qualquer matéria presente', appJs.includes("id: 'busca-assunto'"), true);
conf('Bloco "Continuar trabalhando com este aluno" presente', appJs.includes("texto: 'Continuar trabalhando com este aluno'"), true);
conf('Título de Matemática contextualizado por ano presente', appJs.includes("'Sugestões de Matemática para o ' + rotuloAno"), true);
conf('Aviso amigável quando ano não está cadastrado presente', appJs.includes('O ano escolar não está informado na ficha deste aluno'), true);
conf('Atalho "Ver todos os assuntos de Matemática" presente', appJs.includes("'Ver todos os assuntos de Matemática ('"), true);
conf('Bloco "Outras matérias" presente', appJs.includes("texto: 'Outras matérias'"), true);

// ============================================================================
secao('5. Verificação da base de temas e tópicos');
// ============================================================================

const indicePath = path.join(__dirname, '..', 'banco', 'indice.json');
conf('Banco de temas de Matemática (indice.json) existe', fs.existsSync(indicePath), true);
if (fs.existsSync(indicePath)) {
  const indiceData = JSON.parse(fs.readFileSync(indicePath, 'utf8'));
  const temas = Array.isArray(indiceData) ? indiceData : (indiceData.temas || []);
  const temasSetimo = temas.filter(t => t.serie === '07');
  conf('7º ano possui temas de Matemática estruturados', temasSetimo.length > 0, true);
  const temasSexto = temas.filter(t => t.serie === '06');
  conf('6º ano possui temas de Matemática estruturados', temasSexto.length > 0, true);
}

console.log('\n============================================================');
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
console.log('============================================================\n');
process.exit(falhas ? 1 : 0);
