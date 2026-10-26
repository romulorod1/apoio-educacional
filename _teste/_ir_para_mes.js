/* _ir_para_mes.js
 *
 * Leva a Agenda ate o mes pedido, pelo NUMERO do mes, e nao pelo texto.
 *
 * Os testes faziam isso de dois jeitos, e os dois tinham data de validade:
 * clicar so em "Seguinte" ate o rotulo dizer "Setembro de 2026" (que nunca
 * chega quando o teste roda depois de setembro), ou escolher a direcao
 * comparando os rotulos como texto ("Outubro de 2026" < "Setembro de 2026",
 * porque O vem antes de S). Os dois passaram enquanto o relogio estava em
 * setembro e reprovaram sozinhos em outubro, sem nenhuma linha do aplicativo
 * ter mudado: o teste testava o calendario da maquina.
 *
 *   await irParaMes(pagina, 2026, 9)   // devolve o rotulo final
 */
'use strict';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
  'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/* Roda dentro da pagina. Recebe os nomes dos meses porque a funcao vai ao
 * navegador serializada e nao enxerga nada deste arquivo. */
function navegar(ano, mes, meses, pausaMs) {
  function posicao(rotulo) {
    const m = /^(\S+) de (\d{4})$/.exec(String(rotulo || '').trim());
    if (!m) return null;
    const i = meses.indexOf(m[1].toLowerCase());
    return i < 0 ? null : Number(m[2]) * 12 + i;
  }
  const alvo = ano * 12 + (mes - 1);
  return (async () => {
    for (let guarda = 0; guarda < 120; guarda++) {
      const agora = posicao(document.querySelector('#rotulo-mes').textContent);
      if (agora === null) break;
      if (agora === alvo) break;
      document.querySelector(agora > alvo ? '#mes-anterior' : '#mes-seguinte').click();
      await new Promise(r => setTimeout(r, pausaMs));
    }
    return document.querySelector('#rotulo-mes').textContent;
  })();
}

async function irParaMes(pagina, ano, mes, pausaMs) {
  return pagina.evaluate(navegar, ano, mes, MESES, pausaMs || 45);
}

module.exports = { irParaMes };
