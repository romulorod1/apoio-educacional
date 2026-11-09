/* testa_sistema_visual_navegador.js
 *
 * A trava do sistema visual (F1 do redesenho), medida no navegador, pelo
 * estilo computado, nas telas principais do aplicativo com dados de teste (só
 * o "Aluno Alfa Teste"). O irmão sem navegador, testa_sistema_visual.js (B12),
 * confere a folha de estilo escrita; este confere o que a tela mostra.
 *
 * Em cada tela, todo elemento visível:
 *   COR        os botões primários, os segmentos e as abas escolhidos e os
 *              links só usam o marinho como cor de ação (a cor saturada de
 *              fundo, de letra ou de borda tem de ser da família do marinho);
 *              o dourado só aparece sobre o marinho;
 *   FONTE      nenhuma letra computada abaixo de 12 px;
 *   ESCALA     toda letra é um dos 5 tamanhos (24, 20, 16, 14, 12 px, vezes a
 *              letra do aparelho);
 *   PESO       só os pesos 400 e 600;
 *   CAIXA      nenhum text-transform: uppercase;
 *   ITALICO    nenhum itálico;
 *   GLIFO      nenhum caractere solto (‹ › ↻ ✓ × ✕ ⚠ → ↑ ↓ ▸ ▾ ✎ 🗑 e o "+"
 *              sozinho) visível como texto num botão, nem no ::before ou no
 *              ::after dele;
 *   CONTRASTE  4,5:1 (3:1 na letra grande) nos textos medidos;
 *   NUMEROS    o corpo tem algarismos tabulares;
 *   ICONE      todo ícone visível tem desenho, de traço 1,75.
 * No celular a 412 x 915 (Hoje, a folha da aula, Alunos, Fechamento, Enviar)
 * e no tablet a 1280 x 800 (Agenda, a janela da aula, Alunos, Fechamento,
 * Biblioteca, Ajustes). O celular abre sem conta: só lê, e as ações que pedem
 * a nuvem (os botões de situação da folha) ficam com as provas de emulador.
 *
 * Venenos, que TÊM de ser vistos (cada um troca UM trecho de UM arquivo
 * servido; a âncora tem de existir uma vez só):
 *   --envenenado-botao-verde  o botão principal volta ao verde;
 *   --envenenado-fonte-11px   o menor degrau da escala volta a 11 px;
 *   --envenenado-glifo-solto  a seta da semana do celular volta a ser "‹";
 *   --envenenado-icone-vazio  o ícone sai sem desenho (o botão fica vazio).
 *
 *   --prints <pasta>   Hoje e a aula no celular, a janela da aula e a
 *                      Biblioteca no tablet.
 *
 * Porta 8934. Relógio fixo: segunda, 16/11/2026, 11:00.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador.js');
const { conf, secao, esperar, pausa } = H;

const PORTA = 8934;
const LIMITE_LOG = Number(process.env.LIMITE_LOG || 40);
const MODOS = ['--envenenado-botao-verde', '--envenenado-fonte-11px', '--envenenado-glifo-solto', '--envenenado-icone-vazio'];
const MODO = MODOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && MODOS.indexOf(a) < 0);
const PRINTS = (() => { const i = process.argv.indexOf('--prints'); return i >= 0 ? process.argv[i + 1] : ''; })();
const RELOGIO = H.relogioDaRodada('2026-11-16', '11:00');
const HOJE = RELOGIO.dia(0);

/* Cada veneno: o arquivo servido, a âncora (que tem de aparecer UMA vez) e a troca. */
const VENENOS = {
  '--envenenado-botao-verde': { arquivo: 'styles.css', tipos: ['COR'],
    ancora: '.btn.principal { background: var(--acao); border-color: var(--acao); color: var(--sobre-acao); }',
    troca: '.btn.principal { background: var(--teal); border-color: var(--teal); color: var(--branco); }' },
  '--envenenado-fonte-11px': { arquivo: 'styles.css', tipos: ['FONTE', 'ESCALA'],
    ancora: '--letra-12: .75rem;',
    troca: '--letra-12: .6875rem;' },
  '--envenenado-glifo-solto': { arquivo: 'app.js', tipos: ['GLIFO'],
    ancora: "id: 'cel-semana-anterior', 'aria-label': 'Semana anterior', icone: 'chl',",
    troca: "id: 'cel-semana-anterior', 'aria-label': 'Semana anterior', texto: '‹'," },
  '--envenenado-icone-vazio': { arquivo: 'app.js', tipos: ['ICONE'],
    ancora: "s.innerHTML = ICONES_DO_SISTEMA[nome] || '';",
    troca: "s.innerHTML = '';" }
};

secao('0. Os venenos e as âncoras');
conf('a lista de venenos não está vazia', MODOS.length > 0, true);
conf('todo veneno da lista tem a sua troca', MODOS.every(m => !!VENENOS[m]), true);
conf('nenhum veneno desconhecido pedido (' + desconhecidos.join(', ') + ')', desconhecidos.length, 0);
const trocas = {};
for (const m of MODOS) {
  const v = VENENOS[m];
  const texto = fs.readFileSync(path.join(H.RAIZ, v.arquivo), 'utf8');
  const vezes = texto.split(v.ancora).length - 1;
  conf('a âncora do ' + m + ' aparece uma vez só no ' + v.arquivo, vezes, 1);
  if (m === MODO && vezes === 1) trocas['/' + v.arquivo] = texto.replace(v.ancora, v.troca);
}
if (MODO) conf('o veneno ' + MODO + ' foi plantado no arquivo servido', Object.keys(trocas).length, 1);

/* ---------- a medição, dentro da página ---------- */
function medir(raizSel, escala) {
  const GLIFOS = /[‹›↻↺⟳✓✔×✕✖⚠←→↑↓▸▾▴◂✎✏\u{1F5D1}\u{1F512}]/u;
  const TAMANHOS = [12, 14, 16, 20, 24].map(t => t * escala);
  const parse = c => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return [0, 0, 0, 0]; const p = m[1].split(',').map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const over = (top, bot) => { const a = top[3]; return [top[0] * a + bot[0] * (1 - a), top[1] * a + bot[1] * (1 - a), top[2] * a + bot[2] * (1 - a), 1]; };
  const bgOf = el => { const camadas = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c[3] > 0) { camadas.push(c); if (c[3] >= 1) break; } } let base = [255, 255, 255, 1]; for (let i = camadas.length - 1; i >= 0; i--) base = over(camadas[i], base); return base; };
  const hsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; if (mx === mn) return [0, 0, l]; const d = mx - mn; const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); let h; if (mx === r) h = (g - b) / d + (g < b ? 6 : 0); else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; return [h * 60, s, l]; };
  const perto = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) <= 30;
  const OURO = [201, 167, 91];
  const MARINHO = [31, 58, 95];
  /* cor de ação aceita: neutra (pouca saturação), muito clara ou muito escura,
   * ou da família do marinho (matiz 200 a 225) */
  const deAcaoAceita = c => { const [h, s, l] = hsl(c); return s < 0.2 || l > 0.93 || l < 0.08 || (h >= 200 && h <= 225); };
  const desc = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '') + ' "' + (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28) + '"';
  const raiz = document.querySelector(raizSel) || document.body;
  const out = [];
  let textos = 0, acoes = 0, botoes = 0, pior = 99;
  const visivel = (el, cs) => {
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  const CLICAVEL = 'button,a[href],[role=button],[role=tab],.btn';
  const ESCOLHIDO = '.ativa,.ativo,.atual,.escolhida,.marcada,.selecionada,.on,[aria-pressed="true"],[aria-selected="true"],[aria-checked="true"],[aria-current="page"]';
  for (const el of raiz.querySelectorAll('*')) {
    if (el.closest('svg')) continue;
    if (el.closest('[hidden],[inert]')) continue;
    const cs = getComputedStyle(el);
    if (!visivel(el, cs)) continue;
    // ancestral escondido (display none) já deixa o retângulo zerado; opacidade zero não
    let escondido = false;
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { if (+getComputedStyle(e).opacity === 0) { escondido = true; break; } }
    if (escondido) continue;
    const direto = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    const desabilitado = el.closest(':disabled,[aria-disabled="true"]');
    if (direto) {
      textos++;
      const fs = parseFloat(cs.fontSize);
      if (fs < 11.99 * escala) out.push('FONTE ' + desc(el) + ' ' + cs.fontSize);
      if (!TAMANHOS.some(t => Math.abs(t - fs) < 0.6)) out.push('ESCALA ' + desc(el) + ' ' + cs.fontSize);
      const peso = +cs.fontWeight;
      if (peso !== 400 && peso !== 600) out.push('PESO ' + desc(el) + ' ' + cs.fontWeight);
      if (cs.textTransform === 'uppercase') out.push('CAIXA ' + desc(el));
      if (cs.fontStyle === 'italic' || cs.fontStyle === 'oblique') out.push('ITALICO ' + desc(el));
      const fg = parse(cs.color), bg = bgOf(el);
      const fgc = fg[3] < 1 ? over(fg, bg) : fg;
      if (perto(fgc, OURO) && !perto(bg, MARINHO)) out.push('COR dourado fora do marinho ' + desc(el));
      if (!desabilitado && !(el.matches('input,textarea,select'))) {
        const L1 = lum(fgc), L2 = lum(bg);
        const razao = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        const grande = fs >= 24 * escala || (fs >= 18.66 * escala && peso >= 600);
        pior = Math.min(pior, razao);
        if (razao < (grande ? 3 : 4.5)) out.push('CONTRASTE ' + desc(el) + ' ' + razao.toFixed(2) + ':1');
      }
    }
    if (el.matches(CLICAVEL)) {
      botoes++;
      const deDentro = [el, ...el.querySelectorAll('*')].filter(x => !x.closest('svg'));
      const texto = (el.textContent || '').trim();
      const pseudos = deDentro.map(x => [getComputedStyle(x, '::before').content, getComputedStyle(x, '::after').content])
        .flat().filter(c => c && c !== 'none' && c !== 'normal').join(' ');
      if (GLIFOS.test(texto) || GLIFOS.test(pseudos) || texto === '+') out.push('GLIFO ' + desc(el) + (GLIFOS.test(pseudos) ? ' (no ::before/::after: ' + pseudos.slice(0, 20) + ')' : ''));
      const primario = el.matches('.principal,.destaque,.secundaria,.primario');
      const escolhido = el.matches(ESCOLHIDO);
      const link = el.matches('a[href]');
      if ((primario || escolhido || link) && !desabilitado) {
        acoes++;
        const cores = [['fundo', parse(cs.backgroundColor)], ['letra', parse(cs.color)]];
        if (parseFloat(cs.borderTopWidth) > 0) cores.push(['borda', parse(cs.borderTopColor)]);
        if (parseFloat(cs.borderBottomWidth) > 0) cores.push(['borda de baixo', parse(cs.borderBottomColor)]);
        const sombra = cs.boxShadow && cs.boxShadow !== 'none' ? cs.boxShadow.match(/rgba?\([^)]+\)/g) || [] : [];
        sombra.forEach(s => { const c = parse(s); if (c[3] >= 0.9) cores.push(['anel', c]); });
        const fundoEl = bgOf(el);
        for (const [onde, c] of cores) {
          if (c[3] === 0) continue;
          const vista = c[3] < 1 ? over(c, fundoEl) : c;
          const ouroSobreMarinho = onde === 'letra' && perto(vista, OURO) && perto(fundoEl, MARINHO);
          if (!ouroSobreMarinho && !deAcaoAceita(vista)) out.push('COR ' + onde + ' rgb(' + vista.slice(0, 3).map(Math.round).join(',') + ') em ' + (primario ? 'botão primário ' : escolhido ? 'escolhido ' : 'link ') + desc(el));
        }
      }
    }
  }
  /* ICONE: o desenho que entrou no lugar do glifo tem de aparecer (um ícone
   * sem traço deixa o botão vazio, sem que nenhuma outra medida veja). */
  let icones = 0;
  for (const s of raiz.querySelectorAll('svg.ico')) {
    if (s.closest('[hidden],[inert]')) continue;
    const cs = getComputedStyle(s), r = s.getBoundingClientRect();
    if (cs.display === 'none' || cs.visibility === 'hidden' || r.width < 1 || r.height < 1) continue;
    icones++;
    let caixa = null;
    try { caixa = s.getBBox(); } catch (e) { caixa = null; }
    if (!s.firstElementChild || !caixa || caixa.width + caixa.height < 2) out.push('ICONE vazio "' + (s.getAttribute('data-icone-nome') || '?') + '" em ' + desc(s.parentElement));
    if (parseFloat(cs.strokeWidth) !== 1.75 && parseFloat(cs.strokeWidth) !== 2.25) out.push('ICONE traço ' + cs.strokeWidth + ' em ' + desc(s.parentElement));
  }
  const tab = getComputedStyle(document.body).fontVariantNumeric;
  if (!/tabular-nums/.test(tab)) out.push('NUMEROS o corpo não tem algarismos tabulares (' + tab + ')');
  return { problemas: [...new Set(out)], textos, acoes, botoes, icones, piorContraste: +pior.toFixed(2) };
}

/* ---------- os dados de teste ---------- */
const ALUNO = 'aluno_alfa_f1';
function semear(dados) {
  return Store.carregar().then(d => {
    d.alunos = [{ id: dados.ALUNO, nome: 'Aluno Alfa Teste', responsavel: 'Responsável Alfa', ano: '9',
      anoEscolar: '9º ano do Ensino Fundamental', cor: '#3D6A9B', ativo: true, telefone: '11900000000',
      grade: 'segunda-feira, 08:00', precos: [], vigencias: [{ id: 'v_f1', inicio: '2026-01-01', fim: '2027-12-31', valorHora: 100 }] }];
    d.series = [];
    d.resumos = [];
    d.pagamentos = [];
    const aula = (id, data, hora, status, extra) => Object.assign({ id, alunoId: dados.ALUNO, serieId: null, data, hora,
      duracaoMin: 60, status, cobravel: status !== 'cancelada', notaTexto: '', notaPrivada: '', temNota: false, anexos: [] }, extra || {});
    d.aulas = [
      aula('aula_f1_1', dados.hoje, '08:00', 'realizada', { notaTexto: 'Revisamos frações.', temNota: true }),
      aula('aula_f1_2', dados.hoje, '09:00', 'falta'),
      aula('aula_f1_3', dados.hoje, '10:30', 'agendada'),
      aula('aula_f1_4', dados.hoje, '14:00', 'reposicao'),
      aula('aula_f1_5', dados.hoje, '16:00', 'cancelada'),
      aula('aula_f1_6', dados.ontem, '15:00', 'realizada')
    ];
    d.ajustes = d.ajustes || {};
    d.ajustes.cargaInicial = true;
    return Store.salvar(d);
  });
}

const amb = H.criarAmbiente(PORTA, 'nath_f1_sistema', trocas);
const vistos = [];
const registro = [];

async function telaDeTablet(pag) {
  await pag.evaluateOnNewDocument(() => {
    ['width', 'height'].forEach(k => Object.defineProperty(Screen.prototype, k, { configurable: true, get() { return k === 'width' ? 1280 : 800; } }));
  });
}
async function telaDeCelular(pag) {
  await pag.evaluateOnNewDocument(() => {
    ['width', 'height'].forEach(k => Object.defineProperty(Screen.prototype, k, { configurable: true, get() { return k === 'width' ? 412 : 915; } }));
  });
}

async function medirTela(pag, aparelho, tela, raiz, print) {
  const m = await pag.evaluate(medir, raiz || 'body', 1);
  registro.push(Object.assign({ aparelho, tela }, m));
  console.log('   medida ' + aparelho + ' | ' + tela + ' | textos ' + m.textos + ' | botões ' + m.botoes + ' | de ação ' + m.acoes +
    ' | ícones ' + m.icones + ' | pior contraste ' + m.piorContraste + ':1 | problemas ' + m.problemas.length);
  m.problemas.slice(0, LIMITE_LOG).forEach(p => console.log('      ' + p));
  if (m.problemas.length > LIMITE_LOG) console.log('      (e mais ' + (m.problemas.length - LIMITE_LOG) + ')');
  conf(aparelho + ', ' + tela + ': a tela tem textos medidos', m.textos > 3, true);
  if (PRINTS && print) {
    fs.mkdirSync(PRINTS, { recursive: true });
    await pag.screenshot({ path: path.join(PRINTS, print) });
  }
  return m;
}

async function rodar() {
  await amb.subir();

  /* o tablet: semeia e mede */
  const tab = await amb.pagina();
  await RELOGIO.naPagina(tab);
  await telaDeTablet(tab);
  await tab.setViewport({ width: 1280, height: 800, hasTouch: true });
  await H.abrirApp(tab, amb.ORIGEM);
  await tab.evaluate(semear, { ALUNO, hoje: HOJE, ontem: RELOGIO.dia(-3) });
  await H.abrirApp(tab, amb.ORIGEM);
  conf('o tablet abriu fora do modo celular', await tab.evaluate(() => !document.body.classList.contains('modo-celular')), true);
  conf('só o aluno de teste no banco', await tab.evaluate(() => Store.carregar().then(d => d.alunos.map(a => a.nome).join(','))), 'Aluno Alfa Teste');

  secao('1. Tablet a 1280 x 800');
  await H.irParaAba(tab, 'agenda');
  await medirTela(tab, 'tablet', 'Agenda', 'body');
  await H.irParaAba(tab, 'alunos');
  await medirTela(tab, 'tablet', 'Alunos', '#tela-alunos');
  await H.irParaAba(tab, 'fechamento');
  await medirTela(tab, 'tablet', 'Fechamento', '#tela-fechamento');
  await H.irParaAba(tab, 'ajustes');
  await medirTela(tab, 'tablet', 'Ajustes', '#tela-ajustes');
  await H.irParaAba(tab, 'biblioteca');
  await pausa(300);
  await medirTela(tab, 'tablet', 'Biblioteca', '#tela-biblioteca', 'tab_biblioteca.png');
  await H.irParaAba(tab, 'agenda');
  const abriu = await tab.evaluate(() => {
    const p = document.querySelector('[data-aula-id="aula_f1_1"]');
    if (!p) return false;
    p.click();
    return true;
  });
  conf('a pílula da aula de hoje está na agenda', abriu, true);
  const modal = await esperar('a janela da aula abriu', () => tab.evaluate(() => document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 8000);
  conf('a janela da aula abriu', modal.ok, true);
  await pausa(400);
  await medirTela(tab, 'tablet', 'janela da aula', '#modal-aula', 'tab_aula.png');
  await tab.close();

  /* o celular: só lê, sem conta */
  secao('2. Celular a 412 x 915');
  const cel = await amb.pagina();
  await RELOGIO.naPagina(cel);
  await telaDeCelular(cel);
  await cel.setViewport({ width: 412, height: 915, hasTouch: true, isMobile: true });
  await H.abrirApp(cel, amb.ORIGEM);
  const hoje = await esperar('o Hoje do celular apareceu', () => cel.evaluate(() =>
    document.body.classList.contains('modo-celular') && !!document.querySelector('#cel-hoje.ativa .cel-bloco')), v => v === true, 15000);
  conf('o celular abriu no Hoje, com as aulas de teste', hoje.ok, true);
  await medirTela(cel, 'celular', 'Hoje', '#modo-celular', 'cel_hoje.png');
  await cel.evaluate(() => { const b = document.querySelector('.cel-bloco[data-aula="aula_f1_1"]'); if (b) b.click(); });
  const folha = await esperar('a folha da aula abriu', () => cel.evaluate(() => !!document.querySelector('.cel-folha')), v => v === true, 8000);
  conf('a folha da aula abriu no celular', folha.ok, true);
  await pausa(300);
  await medirTela(cel, 'celular', 'folha da aula', '#modo-celular', 'cel_aula.png');
  for (const t of ['alunos', 'fechamento', 'enviar']) {
    await cel.evaluate(t => { const f = document.querySelector('#cel-folha-fundo'); if (f) f.click(); const b = document.querySelector('#cel-abas .cel-aba[data-cel="' + t + '"]'); if (b) b.click(); }, t);
    await pausa(300);
    await medirTela(cel, 'celular', t, '#modo-celular');
  }
  conf('nenhum erro de página no celular', (cel.errosDePagina || []).join(' | '), '');
  await cel.close();

  secao('3. O veredito');
  const todos = registro.flatMap(r => r.problemas.map(p => r.aparelho + ' ' + r.tela + ': ' + p));
  const doTipo = t => todos.filter(p => p.indexOf(': ' + t + ' ') >= 0);
  const doVeneno = MODO ? VENENOS[MODO].tipos : [];
  const hojeCel = registro.find(r => r.aparelho === 'celular' && r.tela === 'Hoje');
  conf('o Hoje do celular tem ícones medidos (' + (hojeCel ? hojeCel.icones : 0) + ')', !!hojeCel && hojeCel.icones >= 3, true);
  for (const t of ['COR', 'FONTE', 'ESCALA', 'PESO', 'CAIXA', 'ITALICO', 'GLIFO', 'CONTRASTE', 'NUMEROS', 'ICONE']) {
    const achados = doTipo(t);
    if (doVeneno.indexOf(t) >= 0) {
      if (achados.length) vistos.push(MODO);
      conf('VENENO visto: ' + MODO + ' (' + achados.length + ' achados de ' + t + ', ex.: ' + (achados[0] || 'nenhum') + ')', achados.length > 0, true);
    } else {
      conf('nenhum problema de ' + t + ' (' + achados.length + ')', achados.length, 0);
    }
  }
  conf('foram medidas as 11 telas', registro.length, 11);
  if (MODO) conf('o veneno ' + MODO + ' foi visto', vistos.indexOf(MODO) >= 0, true);
}

rodar().then(() => H.fim(amb)(), e => H.fim(amb)(e));
