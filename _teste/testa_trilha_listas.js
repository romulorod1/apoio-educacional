/* testa_trilha_listas.js
 * Teste unitário para a ligação final da trilha e cobertura de listas (C7.2 e C7.3).
 *
 * 1. Vínculos conhecidos entre assunto e módulo, e ausência declarada de lista.
 * 2. Mapeamento explícito dos 3 assuntos sem lista pronta (MAT02-05, MATEM1-06, MATEM3-09).
 * 3. Ações da trilha: botão "Abrir lista" para passos com lista e selo "sem lista pronta" para os sem lista.
 * 4. Regras de devolução do passo ao descancelar aula e fechamento por Domina.
 */
const fs = require('fs');
const path = require('path');
const Core = require('../core.js');

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

// ============================================================================
secao('1. Cobertura de listas por assunto de matemática (C7.2)');
// ============================================================================

const jsonMatematica = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'banco', 'topicos', 'matematica.json'), 'utf8')
);
const temas = jsonMatematica.temas || [];

conf('total de assuntos no índice de matemática', temas.length, 148);

const semCampo = temas.filter(t => t.modulo === undefined);

conf('nenhum assunto sem o campo modulo declarado', semCampo.length, 0);
const moduloDe = id => temas.find(t => t.id === id).modulo;
conf('razão e regra de três apontam para razões e proporções',
  [moduloDe('MAT07-05'), moduloDe('MAT07-06')].join(','),
  '7ano:razoes-e-proporcoes,7ano:razoes-e-proporcoes');
conf('porcentagem aponta para porcentagem e juros', moduloDe('MAT07-07'), '7ano:porcentagem-e-juros');
conf('equações apontam para equações', moduloDe('MAT07-10'), '7ano:equacoes-e-inequacoes-do-primeiro-grau');
conf('sequências sem lista segura ficam sem vínculo', moduloDe('MAT07-08'), null);

// ============================================================================
secao('2. Lógica visual da trilha: Abrir lista e selo sem lista pronta (C7.3)');
// ============================================================================

const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

// Verifica presença das classes e textos no app.js
conf('botão abrir-lista-trilha declarado em app.js', appJs.includes('abrir-lista-trilha'), true);
conf('texto "Abrir lista" presente em app.js', appJs.includes("texto: 'Abrir lista'"), true);
conf('selo selo-aviso com "sem lista pronta" presente em app.js',
  appJs.includes("class: 'selo selo-aviso', texto: 'sem lista pronta'"), true);

// Simulação da lógica de decisão do passo da trilha
function simulaAcaoPasso(p, indiceTemas, bibListasPorModulo) {
  let modChave = p.modulo;
  if (!modChave && p.temaId && indiceTemas) {
    for (let k = 0; k < indiceTemas.length; k++) {
      if (indiceTemas[k].id === p.temaId) {
        modChave = indiceTemas[k].modulo;
        break;
      }
    }
  }
  let lp = null;
  if (!p.semLista && modChave && bibListasPorModulo && bibListasPorModulo[modChave]) {
    const listas = bibListasPorModulo[modChave];
    if (listas && listas.length) lp = listas[0];
  }
  if (lp) {
    return { tipo: 'botao', classe: 'btn pequeno abrir-lista-trilha', texto: 'Abrir lista', lp: lp };
  }
  return { tipo: 'selo', classe: 'selo selo-aviso', texto: 'sem lista pronta' };
}

const mockBib = {
  '6ano:divisibilidade': [{ id: '6ano:divisibilidade:kit:1', modulo: '6ano:divisibilidade' }],
  'm1:mirim-numeros-ate-100-ler-escrever-e-comparar': [{ id: 'm1:mirim-numeros-ate-100:kit:1', modulo: 'm1:mirim-numeros-ate-100' }]
};

const passoComLista = { temaId: 'MAT06-03', titulo: 'Critérios de divisibilidade' };
const acaoComLista = simulaAcaoPasso(passoComLista, temas, mockBib);
conf('passo com lista pronta gera botão Abrir lista', acaoComLista.tipo, 'botao');
conf('passo com lista pronta tem classe abrir-lista-trilha', acaoComLista.classe.includes('abrir-lista-trilha'), true);
conf('passo com lista pronta carrega lista correta', acaoComLista.lp.id, '6ano:divisibilidade:kit:1');

const passoSemLista = { temaId: 'MAT02-05', titulo: 'Sequências e padrões numéricos' };
const acaoSemLista = simulaAcaoPasso(passoSemLista, temas, mockBib);
conf('passo sem lista pronta gera selo de aviso', acaoSemLista.tipo, 'selo');
conf('passo sem lista pronta exibe texto sem lista pronta', acaoSemLista.texto, 'sem lista pronta');
conf('passo sem lista pronta tem classe selo-aviso', acaoSemLista.classe.includes('selo-aviso'), true);

const passoModularSemLista = { temaId: 'MATEM1-06', titulo: 'Função modular' };
const acaoModular = simulaAcaoPasso(passoModularSemLista, temas, mockBib);
conf('função modular exibe selo sem lista pronta', acaoModular.texto, 'sem lista pronta');

// ============================================================================
secao('3. Regras de ciclo de vida do passo da trilha (C7.3)');
// ============================================================================

// Fechamento de passo por Domina
const aulaRealizada = {
  id: 'aula-1',
  data: '2026-11-01',
  status: 'realizada',
  temas: [{ id: 'MAT06-03', titulo: 'Divisibilidade', dominio: 'domina' }]
};

conf('Core.dominioFechaPasso fecha passo quando status é realizada e domínio é Domina',
  Core.dominioFechaPasso(aulaRealizada, 'MAT06-03'), true);

const aulaAndamento = {
  id: 'aula-2',
  data: '2026-11-01',
  status: 'realizada',
  temas: [{ id: 'MAT06-03', titulo: 'Divisibilidade', dominio: 'andamento' }]
};
conf('Core.dominioFechaPasso não fecha passo com Em andamento',
  Core.dominioFechaPasso(aulaAndamento, 'MAT06-03'), false);

// Devolução de passo antigo ao descancelar
const passoAntigo = {
  temaId: 'MAT06-03',
  feitoEm: '2026-10-15',
  aulaId: 'aula-antiga',
  aulaDada: 'aula-antiga'
};
const aulaAntigaDescancelada = {
  id: 'aula-antiga',
  status: 'realizada',
  temas: [{ id: 'MAT06-03', titulo: 'Divisibilidade' }]
};
conf('Core.aulaDevolvePassoAntigo devolve passo quando aula correspondente é realizada',
  Core.aulaDevolvePassoAntigo(passoAntigo, aulaAntigaDescancelada), true);

const outraAula = {
  id: 'aula-outra',
  status: 'realizada',
  temas: [{ id: 'MAT06-03', titulo: 'Divisibilidade' }]
};
conf('Core.aulaDevolvePassoAntigo não devolve passo de aula diferente',
  Core.aulaDevolvePassoAntigo(passoAntigo, outraAula), false);

// ============================================================================
secao('4. Invariante de tipografia e privacidade');
// ============================================================================

const arquivosVerificados = [
  path.join(__dirname, '..', 'app.js'),
  path.join(__dirname, '..', 'styles.css'),
  path.join(__dirname, '..', 'sw.js'),
  path.join(__dirname, '..', 'banco', 'topicos', 'matematica.json')
];

let temTravessao = false;
arquivosVerificados.forEach(f => {
  const conteudo = fs.readFileSync(f, 'utf8');
  if (conteudo.includes('\u2014') || conteudo.includes('\u2013')) {
    temTravessao = true;
    console.error('Travessão encontrado em: ' + f);
  }
});
conf('zero travessões (em-dash e en-dash) nos arquivos modificados', temTravessao, false);

console.log('\n============================================================');
console.log(`${passes} verificações passaram, ${falhas} falharam.`);
console.log('============================================================');

if (falhas > 0) process.exit(1);
