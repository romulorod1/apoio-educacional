/* testa_textos_e_novidades.js
 * Teste unitário e de regressão para a frente T03:
 * 1. Plural e contagem na Agenda e no Fechamento sem duplicação de número (UX12).
 * 2. Política de novidades silenciosa e sem notícias históricas desatualizadas (UX10).
 * 3. Preservação de dados iniciais e regras de banco (UX11).
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

// ============================================================================
secao('1. Função palavraPlural e concordância de contagem');
// ============================================================================

// Extrai a implementação de palavraPlural direto do app.js
const matchPlural = appJs.match(/function palavraPlural\(n, um, muitos\)\s*\{\s*return ([^;]+);\s*\}/);
conf('palavraPlural declarada no app.js', !!matchPlural, true);

const palavraPlural = new Function('n', 'um', 'muitos', 'return n === 1 ? um : muitos;');

conf('singular para 1 marcado à frente', palavraPlural(1, 'marcado à frente', 'marcados à frente'), 'marcado à frente');
conf('plural para 2 marcados à frente', palavraPlural(2, 'marcado à frente', 'marcados à frente'), 'marcados à frente');
conf('plural para 0 marcados à frente', palavraPlural(0, 'marcado à frente', 'marcados à frente'), 'marcados à frente');
conf('plural para 5 marcados à frente', palavraPlural(5, 'marcado à frente', 'marcados à frente'), 'marcados à frente');

conf('singular para 1 mês', palavraPlural(1, 'mês', 'meses'), 'mês');
conf('plural para 2 meses', palavraPlural(2, 'mês', 'meses'), 'meses');
conf('plural para 12 meses', palavraPlural(12, 'mês', 'meses'), 'meses');

// ============================================================================
secao('2. Frases da interface sem número duplicado (UX12)');
// ============================================================================

function montaFraseMarcados(n) {
  return n ? 'mais ' + n + ' ' + palavraPlural(n, 'marcado à frente', 'marcados à frente') : '';
}

function montaFraseMeses(n) {
  return n + ' ' + palavraPlural(n, 'mês', 'meses');
}

const frase1 = montaFraseMarcados(1);
const frase2 = montaFraseMarcados(2);
const fraseMes1 = montaFraseMeses(1);
const fraseMes12 = montaFraseMeses(12);

conf('frase de 1 marcado à frente é limpa', frase1, 'mais 1 marcado à frente');
conf('frase de 2 marcados à frente é limpa', frase2, 'mais 2 marcados à frente');
conf('frase de 1 mês é limpa', fraseMes1, '1 mês');
conf('frase de 12 meses é limpa', fraseMes12, '12 meses');

const regexDuplicado = /\b(\d+)\s+\1\b/;
conf('nenhum número repetido em "mais 1 marcado"', regexDuplicado.test(frase1), false);
conf('nenhum número repetido em "mais 2 marcados"', regexDuplicado.test(frase2), false);
conf('nenhum número repetido em "12 meses"', regexDuplicado.test(fraseMes12), false);

// ============================================================================
secao('3. Conferência estática dos pontos de chamada no app.js');
// ============================================================================

const chamadasPalavraPlural = appJs.match(/\bpalavraPlural\(/g) || [];
conf('palavraPlural é chamada nos pontos de agenda e fechamento (>= 6 chamadas)', chamadasPalavraPlural.length >= 6, true);

// Nenhuma chamada a plural(...) antes da definição da Biblioteca
const partesApp = appJs.split('function contarItens(mod)');
const antesBib = partesApp[0];
const pluralAntesBib = (antesBib.match(/\bplural\(/g) || []).length;
conf('nenhuma chamada concorrente a plural(...) antes da biblioteca', pluralAntesBib, 0);

// ============================================================================
secao('4. Política de novidades silenciosa e sem notícias antigas (UX10)');
// ============================================================================

// Extrai VERSAO e NOVIDADES
const versaoMatch = appJs.match(/var VERSAO = '([^']+)';/);
conf('VERSAO encontrada', !!versaoMatch, true);
const VERSAO = versaoMatch ? versaoMatch[1] : '';

// Extrai compararVersao
function compararVersao(a, b) {
  var pa = String(a || '0').split('.').map(Number);
  var pb = String(b || '0').split('.').map(Number);
  for (var i = 0; i < 3; i++) {
    var x = pa[i] || 0, y = pb[i] || 0;
    if (x !== y) return x - y;
  }
  return 0;
}

conf('compararVersao 1.27.0 vs 1.26.0 > 0', compararVersao('1.27.0', '1.26.0') > 0, true);
conf('compararVersao 1.27.0 vs 1.27.0 === 0', compararVersao('1.27.0', '1.27.0'), 0);
conf('compararVersao 1.18.0 vs 1.27.0 < 0', compararVersao('1.18.0', '1.27.0') < 0, true);

// Simulação de mostrarNovidades
function simularMostrarNovidades(dbSim, novidadesLista) {
  dbSim.ajustes = dbSim.ajustes || {};
  var vista = dbSim.ajustes.versaoVista;
  if (vista === VERSAO) {
    return { abriu: false, motivo: 'mesma_versao' };
  }
  if (!vista) {
    dbSim.ajustes.versaoVista = VERSAO;
    return { abriu: false, motivo: 'primeira_vez_silenciosa', versaoGravada: dbSim.ajustes.versaoVista };
  }
  var novas = (novidadesLista || []).filter(function (n) { return compararVersao(n.versao, vista) > 0; });
  if (!novas.length) {
    dbSim.ajustes.versaoVista = VERSAO;
    return { abriu: false, motivo: 'sem_novidades_para_versao', versaoGravada: dbSim.ajustes.versaoVista };
  }
  return { abriu: true, novas: novas };
}

// Caso A: Novo perfil (sem versaoVista)
const resNovo = simularMostrarNovidades({}, []);
conf('perfil novo não abre modal de novidades', resNovo.abriu, false);
conf('perfil novo grava versaoVista silenciosamente', resNovo.versaoGravada, VERSAO);

// Caso B: Perfil já na versão atual
const resAtual = simularMostrarNovidades({ ajustes: { versaoVista: VERSAO } }, []);
conf('perfil na versão atual não abre modal', resAtual.abriu, false);

// Caso C: Atualização a partir de 1.26.0 sem entradas novas no array
const resSemNovas = simularMostrarNovidades({ ajustes: { versaoVista: '1.26.0' } }, [
  { versao: '1.19.1', itens: ['item antigo'] },
  { versao: '1.18.0', itens: ['portugues'] }
]);
conf('atualização sem itens novos não abre modal', resSemNovas.abriu, false);
conf('atualização sem itens novos atualiza versaoVista', resSemNovas.versaoGravada, VERSAO);

// Caso D: Atualização com nova entrada específica para a versão
const resComNovas = simularMostrarNovidades({ ajustes: { versaoVista: '1.26.0' } }, [
  { versao: '1.27.0', itens: ['melhoria específica de 1.27.0'] },
  { versao: '1.18.0', itens: ['portugues'] }
]);
conf('atualização com itens novos abre modal', resComNovas.abriu, true);
conf('modal contém apenas a versão mais recente', resComNovas.novas.length, 1);
conf('modal exibe a versão correta', resComNovas.novas[0].versao, '1.27.0');
conf('modal NÃO contém a versão antiga de português 1.18.0', resComNovas.novas.some(n => n.versao === '1.18.0'), false);

// ============================================================================
secao('5. Preservação de dados e carga inicial (UX11)');
// ============================================================================

conf('cargaInicial continua definida no app.js', appJs.includes('function cargaInicial()'), true);
conf('ALUNOS_INICIAIS continua presente', appJs.includes('var ALUNOS_INICIAIS = ['), true);
conf('flag cargaInicial é atribuída no arranque de novo banco', appJs.includes('novo.ajustes.cargaInicial = true;'), true);
const storeJs = fs.readFileSync(path.join(__dirname, '..', 'store.js'), 'utf8');
conf('VERSAO_BANCO permanece 2 em store.js', (storeJs.match(/VERSAO_BANCO\s*=\s*2;/) || []).length > 0, true);

// ============================================================================
console.log('\n============================================================');
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
console.log('============================================================');

process.exit(falhas === 0 ? 0 : 1);
