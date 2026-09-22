/* testa_biblioteca_aula.js
 *
 * A biblioteca a partir da aula (PR D da B4), com o pacote SINTÉTICO na forma
 * "compor". O pacote real do Drive nunca entra aqui.
 *
 * Sem navegador (Node):
 *   0. o fechamento de um mês SEM biblioteca sai byte a byte igual ao de main
 *      (PDF e texto, com e sem "exibir temas e áreas"); com um anexo da
 *      biblioteca, os módulos entram em "Temas trabalhados" só quando ela marca
 *      "exibir temas e áreas", e o resto do documento não muda.
 *
 * No Chrome:
 *   1. aula de hoje com o assunto "Bhaskara": o botão Material da linha do
 *      assunto abre a aba Biblioteca já procurando "Bhaskara", com o módulo de
 *      equações do segundo grau achado (pelo apelido do pacote) e a faixa
 *      "Material para a aula de ...";
 *   2. na lista, "Ainda não usei com:" já vem com o aluno da aula;
 *   3. marca 3 exercícios, gera: a aula de onde ela veio já vem escolhida;
 *   4. de volta à lista: os 3 usados somem para aquele aluno, com o aviso de
 *      quantos estão escondidos; para outro aluno, e para "todos", voltam os 8;
 *   5. o fechamento do mês calculado na página traz o módulo;
 *   6. a aula apagada: o uso dela não esconde mais nada;
 *   7. nenhum erro de JavaScript.
 *
 * Modo envenenado:
 *   node _teste/testa_biblioteca_aula.js --envenenado-aluno
 *     o app.js servido conta o uso de QUALQUER aluno no filtro. Os 3 usados com
 *     um aluno somem também para o outro, e o teste tem de ENXERGAR isso.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8794;
const VENENO = process.argv.indexOf('--envenenado-aluno') !== -1;
const APP_REPO = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const LINHA_ALUNO = 'if (aulas[u.aulaId] === alunoId) usados[u.itemId] = true;';
const trocas = {};
if (VENENO) trocas['/app.js'] = APP_REPO.split(LINHA_ALUNO).join('if (aulas[u.aulaId]) usados[u.itemId] = true;');
const SALVAR = process.env.SALVAR_PRINTS || '';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'bib_aula_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

// ---------------------------------------------------------------- 0 (Node)
secao('0. Fechamento: sem biblioteca, igual a main; com biblioteca, só os temas');
const RAIZ = path.join(__dirname, '..');
const MAIN = path.join(TMP, 'main');
execSync('git ls-tree -r --name-only origin/main core.js pdf.js figuras', { cwd: RAIZ, encoding: 'utf8' })
  .split(/\r?\n/).filter(Boolean).forEach(f => {
    fs.mkdirSync(path.join(MAIN, path.dirname(f)), { recursive: true });
    fs.writeFileSync(path.join(MAIN, f), execSync('git show "origin/main:' + f + '"', { cwd: RAIZ, maxBuffer: 1 << 26 }));
  });
const CoreN = require('../core.js'), PDFN = require('../pdf.js');
const CoreM = require(path.join(MAIN, 'core.js')), PDFM = require(path.join(MAIN, 'pdf.js'));
const igual = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)) === 0;
function banco(comBiblioteca) {
  const al = { id: 'a1', nome: 'Aluno Teste', responsavel: 'Resp', ativo: true,
    precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 130 }] };
  const db = { alunos: [al], series: [], aulas: [], resumos: [], ajustes: {} };
  [2, 9, 16].forEach(d => db.aulas.push({ id: 'x' + d, alunoId: 'a1', data: '2026-06-' + String(d).padStart(2, '0'),
    hora: '15:30', duracaoMin: 90, status: 'realizada', cobravel: true, areas: ['metodo'],
    anexos: comBiblioteca && d === 9 ? [{ id: 'an1', nome: 'x_biblioteca.pdf', tamanho: 10, biblioteca: true,
      modulos: ['Equações do Segundo Grau', 'Produtos Notáveis e Fatoração'] }] : [],
    temas: [{ id: 'MAT08-03', titulo: 'Equações do primeiro grau', lingua: 'pt', partes: ['lista'], exercicios: 6 }] }));
  return db;
}
const fSem = CoreN.calcularFechamento(banco(false), 'a1', '2026-06');
const fSemM = CoreM.calcularFechamento(banco(false), 'a1', '2026-06');
[{}, { exibirTemasEAreas: true }].forEach(op => {
  const rot = op.exibirTemasEAreas ? ' (exibindo temas)' : '';
  conf('mês sem biblioteca: PDF igual a main' + rot, igual(PDFN.gerarFechamento(fSem, Object.assign({ sempreResumo: true }, op)),
    PDFM.gerarFechamento(fSemM, Object.assign({ sempreResumo: true }, op))), true);
  conf('mês sem biblioteca: texto igual a main' + rot, CoreN.markdownFechamento(fSem, op) === CoreM.markdownFechamento(fSemM, op), true);
});
const fCom = CoreN.calcularFechamento(banco(true), 'a1', '2026-06');
const titulos = fCom.temasDoMes.map(t => t.titulo).join(' | ');
conf('com biblioteca: os módulos entram nos temas do mês', titulos, 'Equações do primeiro grau | Equações do Segundo Grau | Produtos Notáveis e Fatoração');
conf('na data da aula em que foram usados', JSON.stringify(fCom.temasDoMes[1].datas), '["2026-06-09"]');
const mdSem = CoreN.markdownFechamento(fCom, {}), mdCom = CoreN.markdownFechamento(fCom, { exibirTemasEAreas: true });
conf('sem "exibir temas e áreas": o texto não traz os módulos', mdSem.indexOf('Equações do Segundo Grau') < 0, true);
conf('e é o mesmo texto do mês sem biblioteca', mdSem === CoreN.markdownFechamento(fSem, {}), true);
conf('com "exibir temas e áreas": o texto traz os módulos', mdCom.indexOf('Equações do Segundo Grau') >= 0 && mdCom.indexOf('Produtos Notáveis e Fatoração') >= 0, true);
conf('sem "exibir temas e áreas": o PDF é o mesmo do mês sem biblioteca',
  igual(PDFN.gerarFechamento(fCom, { sempreResumo: true }), PDFN.gerarFechamento(fSem, { sempreResumo: true })), true);

// ---------------------------------------------------------------- navegador
const amb = H.criarAmbiente(PORTA, 'perfil_bib_aula', trocas);
const hojeIso = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();

async function importar(pag, arquivo) {
  await H.irParaAba(pag, 'ajustes');
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar('importação', () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca'); return c ? c.innerText.trim() : '';
  }), v => /^Biblioteca importada\.|não foi importado/.test(v || ''), 60000);
  return r.valor || '';
}
async function tocarLinha(pag, nome) {
  const ok = await pag.evaluate(n => {
    const l = Array.from(document.querySelectorAll('#bib-corpo .item-lista')).find(x => x.querySelector('.nome').textContent.trim() === n);
    if (!l) return false; l.click(); return true;
  }, nome);
  if (!ok) throw Object.assign(new Error('não achei a linha ' + nome), { jaContado: false });
  await pausa(150);
}
const visiveis = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#bib-corpo .bib-celula')).filter(c => !c.hidden).length);
const infoFiltro = pag => pag.evaluate(() => (document.querySelector('#bib-filtro-info') || {}).textContent || '');
const lerUso = pag => pag.evaluate(() => Store.usoDaBiblioteca());

(async () => {
  if (VENENO) {
    secao('O veneno é de verdade');
    conf('o app.js servido ficou DIFERENTE do repositório', trocas['/app.js'] !== APP_REPO ? 'diferente' : 'IGUAL', 'diferente');
    conf('e o veneno trocou exatamente uma ocorrência', APP_REPO.split(LINHA_ALUNO).length - 1, 1);
  }
  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);
  const zip = path.join(TMP, 'nono.zip');
  Sintetico.gerar(zip, { compor: true });
  conf('importou o pacote sintético', /^Biblioteca importada\./.test(await importar(pag, zip)), true);

  // aula de hoje com o assunto "Bhaskara", gravada direto no banco, e o app aberto de novo
  const ids = await pag.evaluate(async h => {
    const d = await Store.carregar();
    const alunos = d.alunos.slice(0, 2);
    d.aulas.push({ id: 'aula-bib-teste', alunoId: alunos[0].id, serieId: null, destacada: false, data: h, hora: '10:00',
      duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', temNota: false, anexos: [],
      temas: [{ titulo: 'Bhaskara', fonte: 'livre' },
        // tema autoral que o pacote do 9º ano não tem: o Material tem de seguir para o material de sempre
        { id: 'MAT06-05', titulo: 'Frações: o que são e como comparar', lingua: 'pt' }] });
    await Store.salvar(d);
    return { aluno: alunos[0].id, nome: alunos[0].nome, outro: alunos[1].id };
  }, hojeIso);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('1a. Assunto autoral que a biblioteca não tem: o Material de sempre');
  await H.irParaAba(pag, 'agenda');
  for (let i = 0; i < 24; i++) {
    if (await pag.evaluate(h => !!document.querySelector('[data-dia="' + h + '"]'), hojeIso)) break;
    await pag.click(i < 12 ? '#mes-seguinte' : '#mes-anterior');
    await pausa(120);
  }
  const abriuAula = await pag.evaluate(h => {
    const pilulas = Array.from(document.querySelectorAll('[data-dia="' + h + '"] .pilula'));
    const alvo = pilulas.find(p => /10:00/.test(p.textContent)) || pilulas[0];
    if (!alvo) return false; alvo.click(); return true;
  }, hojeIso);
  conf('a aula de hoje abriu', abriuAula, true);
  const botao = await esperar('botão Material na linha do assunto', () => pag.evaluate(() => {
    const l = Array.from(document.querySelectorAll('#corpo-modal-aula .item-assunto-aula')).find(x => /Bhaskara/.test(x.textContent));
    const b = l && Array.from(l.querySelectorAll('button')).find(x => x.textContent.trim() === 'Material');
    return !!b;
  }), v => v === true, 8000);
  conf('o assunto livre ganhou o botão Material (há pacote)', botao.ok, true);
  // o registro do tema autoral vem de um índice carregado à parte: a linha mostra o ano quando ele chega
  await esperar('índice do tema autoral', () => pag.evaluate(() => {
    const l = Array.from(document.querySelectorAll('#corpo-modal-aula .item-assunto-aula')).find(x => /Frações/.test(x.textContent));
    return l ? l.textContent : '';
  }), v => /6º ano/.test(v || ''), 10000);
  await pag.evaluate(() => {
    const l = Array.from(document.querySelectorAll('#corpo-modal-aula .item-assunto-aula')).find(x => /Frações/.test(x.textContent));
    Array.from(l.querySelectorAll('button')).find(x => x.textContent.trim() === 'Material').click();
  });
  const deSempre = await esperar('material autoral aberto', () => pag.evaluate(() => ({
    tema: document.querySelector('#modal-tema').classList.contains('aberto'),
    aba: document.querySelector('#abas .aba.ativa').dataset.tela
  })), v => v && v.tema, 8000);
  conf('abriu a montagem autoral, e não a biblioteca', deSempre.ok && deSempre.valor.aba !== 'biblioteca', true);
  await pag.evaluate(() => { const b = document.querySelector('#modal-tema [data-fechar]'); if (b) b.click(); });
  await pausa(300);

  secao('1b. O botão Material da linha do assunto abre a biblioteca');
  await pag.evaluate(() => {
    const l = Array.from(document.querySelectorAll('#corpo-modal-aula .item-assunto-aula')).find(x => /Bhaskara/.test(x.textContent));
    Array.from(l.querySelectorAll('button')).find(x => x.textContent.trim() === 'Material').click();
  });
  const abriu = await esperar('aba Biblioteca com a busca', () => pag.evaluate(() => ({
    aba: (document.querySelector('#abas .aba.ativa') || {}).dataset ? document.querySelector('#abas .aba.ativa').dataset.tela : '',
    campo: document.querySelector('#busca-biblioteca').value,
    aulaFechada: !document.querySelector('#modal-aula').classList.contains('aberto'),
    texto: document.querySelector('#bib-corpo').innerText,
    contexto: (document.querySelector('#bib-contexto') || {}).innerText || ''
  })), v => v && v.aba === 'biblioteca' && /Equações do Segundo Grau/.test(v.texto), 8000);
  const a = abriu.valor || {};
  conf('a janela da aula fechou e a aba é a Biblioteca', a.aulaFechada + ',' + a.aba, 'true,biblioteca');
  conf('a busca veio com o título do assunto', a.campo, 'Bhaskara');
  conf('e achou o módulo de equações do segundo grau (pelo apelido)', /Equações do Segundo Grau/.test(a.texto), true);
  conf('a faixa diz para qual aula', new RegExp('^Material para a aula de ' + ids.nome).test(a.contexto), true);
  if (SALVAR) await pag.screenshot({ path: path.join(SALVAR, 'aula_1_busca_do_assunto.png') });

  // ================================================================
  secao('2. "Ainda não usei com" já vem com o aluno da aula');
  await tocarLinha(pag, 'Equações do Segundo Grau');
  await tocarLinha(pag, 'Soma e Produto');
  await esperar('lista', () => visiveis(pag), v => v === 8, 8000);
  conf('o filtro já vem com o aluno', await pag.$eval('#bib-filtro-aluno', e => e.value), ids.aluno);
  await esperar('aviso do filtro', () => infoFiltro(pag), v => /^Nenhum exercício/.test(v), 5000);
  conf('nada usado ainda: os 8 aparecem', await visiveis(pag), 8);

  // ================================================================
  secao('3. Gerar: a aula de onde ela veio já vem escolhida');
  const SP = '9ano:equacoes-do-segundo-grau:soma-e-produto:ex:';
  for (const n of [1, 5, 6]) await pag.evaluate(i => document.querySelector('input[data-carrinho="itens"][data-id="' + i + '"]').click(), SP + n);
  await pag.click('#bib-carrinho-gerar');
  await esperar('janela Gerar material', () => pag.$eval('#modal-bib-gerar', e => e.classList.contains('aberto')), v => v === true, 5000);
  const escolhida = await pag.evaluate(() => {
    const l = document.querySelector('#bib-gerar-aulas .item-lista.escolhida');
    return { id: l ? l.getAttribute('data-aula') : '', botao: document.querySelector('#bib-gerar-anexar').disabled };
  });
  conf('a aula do contexto está escolhida e o botão ligado', escolhida.id + ',' + escolhida.botao, 'aula-bib-teste,false');
  await pag.click('#bib-gerar-anexar');
  const usou = await esperar('uso gravado', () => lerUso(pag), v => v && v.filter(u => u.aulaId === 'aula-bib-teste').length === 3, 30000);
  conf('3 usos gravados para a aula', usou.ok, true);

  // ================================================================
  secao('4. De volta à lista: os usados somem para aquele aluno');
  conf('depois de anexar, a faixa da aula de origem sumiu', await pag.evaluate(() => document.querySelector('#bib-contexto').hidden), true);
  await H.irParaAba(pag, 'agenda');
  await H.irParaAba(pag, 'biblioteca');
  await esperar('lista de novo', () => pag.evaluate(() => !!document.querySelector('#bib-filtro-aluno')), v => v === true, 5000);
  conf('pelo menu, o filtro volta para "qualquer aluno"', await pag.$eval('#bib-filtro-aluno', e => e.value), '');
  await pag.select('#bib-filtro-aluno', ids.aluno);
  await esperar('filtro aplicado', () => visiveis(pag), v => v === 5, 5000);
  conf('5 visíveis com o filtro do aluno', await visiveis(pag), 5);
  conf('e o aviso diz quantos estão escondidos', await infoFiltro(pag), '3 exercícios já usados com ' + ids.nome + ' estão escondidos.');
  const escondidosCertos = await pag.evaluate(sp => [1, 5, 6].every(n => document.querySelector('.bib-cartao[data-id="' + sp + n + '"]').closest('.bib-celula').hidden), SP);
  conf('os escondidos são os 3 usados', escondidosCertos, true);
  if (SALVAR) await pag.screenshot({ path: path.join(SALVAR, 'aula_2_filtro_ainda_nao_usei.png') });
  await pag.select('#bib-filtro-aluno', ids.outro);
  if (VENENO) {
    await esperar('outro aluno (envenenado)', () => visiveis(pag), v => v === 5, 5000);
    conf('VENENO ENXERGADO: para outro aluno os 3 continuam escondidos', await visiveis(pag), 5);
    throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
  }
  await esperar('outro aluno', () => visiveis(pag), v => v === 8, 5000);
  conf('para outro aluno, os 8 voltam', await visiveis(pag), 8);
  await pag.select('#bib-filtro-aluno', '');
  await esperar('todos', () => visiveis(pag), v => v === 8, 5000);
  conf('para "qualquer aluno", os 8', await visiveis(pag), 8);

  // ================================================================
  secao('5. O fechamento do mês traz o módulo');
  const fech = await pag.evaluate(async (alunoId, h) => {
    const d = await Store.carregar();
    const f = Core.calcularFechamento(d, alunoId, h.slice(0, 7));
    return { temas: f.temasDoMes.map(t => t.titulo), md: Core.markdownFechamento(f, { exibirTemasEAreas: true }), mdSem: Core.markdownFechamento(f, {}) };
  }, ids.aluno, hojeIso);
  conf('Temas do mês: o assunto e o módulo', fech.temas.indexOf('Bhaskara') >= 0 && fech.temas.indexOf('Equações do Segundo Grau') >= 0, true);
  conf('no texto com "exibir temas e áreas"', /Equações do Segundo Grau/.test(fech.md), true);
  conf('e fora dele sem a caixa marcada', /Equações do Segundo Grau/.test(fech.mdSem), false);

  // ================================================================
  secao('6. Aula apagada: o uso dela não esconde mais nada');
  await pag.evaluate(async () => {
    const d = await Store.carregar();
    d.aulas = d.aulas.filter(a => a.id !== 'aula-bib-teste');
    await Store.salvar(d);
  });
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'biblioteca');
  await esperar('módulos', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .item-lista').length), v => v > 0, 8000);
  await pag.evaluate(() => { const c = document.querySelector('#busca-biblioteca'); c.value = ''; c.dispatchEvent(new Event('input')); });
  await pausa(400);
  await tocarLinha(pag, 'Equações do Segundo Grau');
  await tocarLinha(pag, 'Soma e Produto');
  await esperar('lista', () => pag.evaluate(() => !!document.querySelector('#bib-filtro-aluno')), v => v === true, 8000);
  await pag.select('#bib-filtro-aluno', ids.aluno);
  await esperar('filtro com a aula apagada', () => infoFiltro(pag), v => /^Nenhum exercício/.test(v), 5000);
  conf('os 8 aparecem: uso de aula que não existe não conta', await visiveis(pag), 8);
  conf('o uso continua gravado (a cópia de segurança não perde nada)', (await lerUso(pag)).filter(u => u.aulaId === 'aula-bib-teste').length, 3);

  if (pag.errosDePagina.length) console.log('   erros de página: ' + pag.errosDePagina.join(' | ').slice(0, 400));
  conf('nenhum erro de JavaScript na página', pag.errosDePagina.length, 0);
})().then(() => H.fim(amb)(), e => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e)));
