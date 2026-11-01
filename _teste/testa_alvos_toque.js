/* testa_alvos_toque.js
 *
 * Prova estatica do item B6:
 * Valida a presenca e corretude dos alvos de toque de 44 px e piso tipografico
 * no styles.css e app.js:
 * 1. Token --alvo: 44px declarado no :root.
 * 2. .btn.pequeno com min-height de 44 px.
 * 3. .fechar com min-width e min-height de 44 px.
 * 4. .zoom-btn-fechar com min-height de 44 px.
 * 5. Caixas de marcacao e rotulos envolventes com min-height de 44 px.
 * 6. .cor-opcao com area de toque expandida de 44x44 px (::after).
 * 7. .pilula da agenda com min-height de 24 px e fonte de 12 px.
 * 8. .ajuda com piso de 14 px.
 * 9. Venenos de controle comprovando que a prova detecta violacoes.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ARQ_CSS = path.join(__dirname, '..', 'styles.css');
const ARQ_APP = path.join(__dirname, '..', 'app.js');

let passes = 0;
let falhas = 0;

function afirme(descricao, condicao) {
  if (condicao) {
    passes++;
    console.log('  OK    ' + descricao);
  } else {
    falhas++;
    console.error('  FALHA ' + descricao);
  }
}

function validarCss(css) {
  const erros = [];

  // 1. Token --alvo: 44px
  if (!/--alvo:\s*44px/i.test(css)) {
    erros.push('Token --alvo: 44px nao encontrado no :root');
  }

  // 2. .btn.pequeno com 44 px
  const blocoBtnPequeno = (css.match(/\.btn\.pequeno\s*\{([^}]+)\}/) || [])[1] || '';
  if (!/min-height:\s*(?:var\(--alvo[^)]*\)|44px)/i.test(blocoBtnPequeno)) {
    erros.push('.btn.pequeno sem min-height de 44px');
  }

  // 3. .fechar com 44x44 px
  const blocoFechar = (css.match(/\.fechar\s*\{([^}]+)\}/) || [])[1] || '';
  const fecharMinW = /min-width:\s*(?:var\(--alvo[^)]*\)|44px)/i.test(blocoFechar);
  const fecharMinH = /min-height:\s*(?:var\(--alvo[^)]*\)|44px)/i.test(blocoFechar);
  if (!fecharMinW || !fecharMinH) {
    erros.push('.fechar sem min-width e min-height de 44px');
  }

  // 4. .zoom-btn-fechar com 44 px
  const blocoZoomFechar = (css.match(/\.zoom-btn-fechar\s*\{([^}]+)\}/) || [])[1] || '';
  if (!/min-height:\s*(?:var\(--alvo[^)]*\)|44px)/i.test(blocoZoomFechar)) {
    erros.push('.zoom-btn-fechar sem min-height de 44px');
  }

  // 5. A própria caixa tem 44 px, evitando sobreposição dos alvos.
  const blocoCor = (css.match(/\.cor-opcao\s*\{([^}]+)\}/) || [])[1] || '';
  const corMinW = /width:\s*44px/i.test(blocoCor);
  const corMinH = /height:\s*44px/i.test(blocoCor);
  if (!corMinW || !corMinH) {
    erros.push('.cor-opcao sem area de toque de 44x44px');
  }

  // 6. Caixas de marcacao com alvo de 44 px
  const temRotuloCheckbox = /label\.campo:has\(input\[type="checkbox"\]\)[\s\S]*?min-height:\s*(?:var\(--alvo[^)]*\)|44px)/i.test(css) ||
    /\.rotulo-inline-virada[\s\S]*?min-height:\s*(?:var\(--alvo[^)]*\)|44px)/i.test(css);
  if (!temRotuloCheckbox) {
    erros.push('Rotulos de checkbox sem min-height de 44px');
  }

  // 7. .pilula com min-height 32 px e font-size 14 px
  const blocoPilula = (css.match(/\.pilula\s*\{([^}]+)\}/) || [])[1] || '';
  if (!/min-height:\s*32px/i.test(blocoPilula) || !/font-size:\s*14px/i.test(blocoPilula)) {
    erros.push('.pilula sem min-height de 32px ou font-size de 14px');
  }

  // 8. Piso de 15 px em Ajustes e Janela da aula
  const temAjuda15 = /#tela-ajustes\s+\.ajuda[\s\S]*?font-size:\s*15px/i.test(css) &&
    /#modal-aula\s+\.ajuda[\s\S]*?font-size:\s*15px/i.test(css);
  if (!temAjuda15) {
    erros.push('Ajustes ou modal de aula sem piso tipografico de 15px na ajuda');
  }

  return erros;
}

console.log('=== Prova estatica do Item B6 (Alvos de toque e tipografia) ===');

const cssReal = fs.readFileSync(ARQ_CSS, 'utf8');
const appReal = fs.readFileSync(ARQ_APP, 'utf8');

// Validacao do CSS real
const errosReal = validarCss(cssReal);
afirme('styles.css atende a todas as 8 regras ergonomicas de B6', errosReal.length === 0);

// A versão atual e o cache mudam em toda release; o portão já verifica ambos.
afirme('app.js possui bloco 1.41.2 em NOVIDADES com itens acentuados',
  /versao:\s*'1\.41\.2'[\s\S]*?itens:\s*\[[\s\S]*?pixels[\s\S]*?distância/i.test(appReal));

// Provas negativas com venenos de controle
console.log('\n--- Venenos de controle positivo e negativo ---');

// Veneno 1: .btn.pequeno com 36 px
const v1 = cssReal.replace(/min-height:\s*var\(--alvo,\s*44px\);/g, 'min-height: 36px;');
const e1 = validarCss(v1);
afirme('veneno 1 (btn pequeno 36px) e detectado', e1.some(e => e.includes('.btn.pequeno')));

// Veneno 2: .fechar sem 44x44
const v2 = cssReal.replace(/min-width:\s*var\(--alvo,\s*44px\);/g, 'min-width: 20px;');
const e2 = validarCss(v2);
afirme('veneno 2 (.fechar estreito) e detectado', e2.some(e => e.includes('.fechar')));

// Veneno 3: .pilula miuda com 11 px
const v3 = cssReal.replace(/min-height:\s*32px;/g, 'min-height: 18px;');
const e3 = validarCss(v3);
afirme('veneno 3 (.pilula baixa) e detectado', e3.some(e => e.includes('.pilula')));

// Veneno 4: Ajustes e modal da aula com 13 px antigo
const v4 = cssReal.replace(/#tela-ajustes\s+\.ajuda[\s\S]*?font-size:\s*15px/i, '#tela-ajustes .ajuda { font-size: 13px;');
const e4 = validarCss(v4);
afirme('veneno 4 (ajuda miuda 13px em ajustes e aula) e detectado', e4.some(e => e.includes('piso tipografico de 15px')));

console.log('\n' + '='.repeat(60));
console.log(passes + ' verificacoes passaram, ' + falhas + ' falharam.');
console.log('='.repeat(60));

if (falhas > 0) process.exit(1);
